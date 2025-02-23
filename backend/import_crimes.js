const { PrismaClient } = require('@prisma/client');
const fs = require('fs-extra');
const geojsonRbush = require('geojson-rbush');
const turf = require('@turf/turf');

const prisma = new PrismaClient();
const crimeFile = "dc_crimes.geojson";

// Define crime weights for severity:
const CRIME_WEIGHTS = {
  'HOMICIDE': 10,
  'ROBBERY': 8,
  'ASSAULT W/DANGEROUS WEAPON': 7,
  'BURGLARY': 6,
  'THEFT/OTHER': 4,
  'THEFT F/AUTO': 3,
  'MOTOR VEHICLE THEFT': 5,
  'SEX ABUSE': 9,
  'ARSON': 8
};
const DEFAULT_WEIGHT = 3;

// Distance threshold (in kilometers) within which a crime is assigned to a street:
const DISTANCE_THRESHOLD_KM = 0.1; // ~100 meters

async function importCrimeData() {
  try {
    console.log("Reading crime data...");
    const rawData = await fs.readFile(crimeFile, 'utf8');
    const crimeData = JSON.parse(rawData);
    console.log(`Found ${crimeData.features.length} crime incidents`);

    // 1. Get all streets from the database
    const streets = await prisma.street.findMany({
      select: {
        id: true,
        name: true,
        polygonData: true,
        safetyScore: true,
        reports: true
      }
    });
    console.log(`Processing ${streets.length} streets`);

    // 2. Build a GeoJSON FeatureCollection of street centroids.
    // We assume that each street's polygonData is a valid GeoJSON Polygon.
    const streetFeatures = [];
    for (const street of streets) {
      if (!street.polygonData) continue;
      // Compute the centroid using Turf.js
      const centroid = turf.centroid(street.polygonData);
      // Attach the street's id so we can later update the correct record
      centroid.properties = { streetId: street.id };
      streetFeatures.push(centroid);
    }

    // 3. Build the spatial index using geojson-rbush.
    const tree = geojsonRbush();
    tree.load({
      type: "FeatureCollection",
      features: streetFeatures
    });

    // 4. Prepare an object to accumulate crime data per street.
    const streetCrimes = {};
    streets.forEach(street => {
      streetCrimes[street.id] = {
        totalCrimes: 0,
        weightedScore: 0,
        crimeList: []
      };
    });

    // 5. Process each crime incident.
    let processedCrimes = 0;
    for (const feature of crimeData.features) {
      try {
        if (!feature.geometry || !feature.properties) continue;
        // Crime coordinates: [longitude, latitude]
        const crimeCoords = feature.geometry.coordinates;
        const crimePoint = turf.point(crimeCoords);
        
        const offense = feature.properties.OFFENSE;
        const date = feature.properties.REPORT_DAT;
        const block = feature.properties.BLOCK;
        const shift = feature.properties.SHIFT;
        const method = feature.properties.METHOD;

        // 5a. Use the spatial index to search for nearby street centroids.
        // We create a small bounding box (buffer) around the crime point.
        const buffer = turf.buffer(crimePoint, 0.1, { units: 'kilometers' });
        const bbox = turf.bbox(buffer);
        const bboxPolygon = turf.bboxPolygon(bbox);
        const nearby = tree.search(bboxPolygon);

        if (!nearby || !nearby.features || nearby.features.length === 0) {
          // No nearby street found – skip this crime.
          continue;
        }

        // 5b. Determine the nearest street centroid.
        let nearestStreetId = null;
        let minDistance = Infinity;
        for (const candidate of nearby.features) {
          const distance = turf.distance(crimePoint, candidate, { units: 'kilometers' });
          if (distance < minDistance) {
            minDistance = distance;
            nearestStreetId = candidate.properties.streetId;
          }
        }

        // 5c. If the nearest street is within the threshold, attribute the crime to it.
        if (minDistance <= DISTANCE_THRESHOLD_KM && nearestStreetId != null) {
          const weight = CRIME_WEIGHTS[offense] || DEFAULT_WEIGHT;
          streetCrimes[nearestStreetId].totalCrimes++;
          streetCrimes[nearestStreetId].weightedScore += weight;
          streetCrimes[nearestStreetId].crimeList.push({
            type: offense,
            date: date,
            block: block,
            shift: shift,
            method: method,
            weight: weight
          });
        }

        processedCrimes++;
        if (processedCrimes % 100 === 0) {
          console.log(`Processed ${processedCrimes} crimes...`);
        }
      } catch (error) {
        console.error("Error processing a crime feature:", error);
        continue;
      }
    }

    // 6. Update street safety scores based on the accumulated crime data.
    console.log("Updating street safety scores...");
    for (const street of streets) {
      const crimes = streetCrimes[street.id];
      // Default safety score is 10 (very safe) if there are no crimes.
      let safetyScore = 10;
      if (crimes.totalCrimes > 0) {
        const crimeScore = crimes.weightedScore / crimes.totalCrimes;
        // For example, subtract half the crimeScore from 10.
        safetyScore = Math.max(0, 10 - (crimeScore / 2));
      }
      await prisma.street.update({
        where: { id: street.id },
        data: {
          safetyScore: safetyScore,
          reports: crimes.crimeList
        }
      });
    }

    console.log("✅ Crime data processed and safety scores updated!");
  } catch (error) {
    console.error("Error processing crime data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

importCrimeData().catch(console.error);
