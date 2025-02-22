// import_crimes.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// ------------------- CONFIG ---------------------
// You might tweak these as needed:
const CRIME_FILE = path.join(__dirname, 'dc_crimes.geojson');
const CRIME_WEIGHTS = {
  HOMICIDE: 10,
  ROBBERY: 8,
  'ASSAULT W/DANGEROUS WEAPON': 7,
  BURGLARY: 6,
  'THEFT/OTHER': 4,
  'THEFT F/AUTO': 3,
  'MOTOR VEHICLE THEFT': 5,
  'SEX ABUSE': 9,
  ARSON: 8
};
const DEFAULT_WEIGHT = 3;
const DISTANCE_THRESHOLD_KM = 0.1; // 100m

// Exponential decay example
function timeDecayFactor(crimeDate) {
  const now = new Date();
  const diffMs = now - crimeDate;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  // Tweak decayRate to change how quickly older crimes matter less
  const decayRate = 0.03; 
  return Math.exp(-decayRate * diffDays); 
}

// Simple distance in km using Haversine
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function importCrimes() {
  try {
    console.log("Loading streets from DB...");
    const streets = await prisma.street.findMany({
      select: { id: true, name: true, polygonData: true }
    });
    console.log(`Found ${streets.length} streets in DB.`);

    console.log("Reading crime GeoJSON...");
    const rawData = fs.readFileSync(CRIME_FILE, 'utf8');
    const geojson = JSON.parse(rawData);

    // Prepare a structure to accumulate crime info for each street
    const streetCrimes = {};
    for (const st of streets) {
      streetCrimes[st.id] = {
        weightedScore: 0, // sum of all weighted crimes
        crimeList: []     // we'll store details here
      };
    }

    let totalFeatures = geojson.features.length;
    console.log(`Processing ${totalFeatures} crime features...`);

    // Loop over crimes
    let processed = 0;
    for (const feature of geojson.features) {
      processed++;
      if (processed % 500 === 0) {
        console.log(`...processed ${processed} crimes so far`);
      }

      // Skip if no geometry or properties
      if (!feature.geometry || !feature.properties) continue;
      const coords = feature.geometry.coordinates; // [lng, lat]
      if (!Array.isArray(coords) || coords.length < 2) continue;

      const offense = feature.properties.OFFENSE || "UNKNOWN";
      const block = feature.properties.BLOCK || "N/A";
      const shift = feature.properties.SHIFT || "N/A";
      const method = feature.properties.METHOD || "N/A";
      let dateStr = feature.properties.REPORT_DAT || ""; 
      const crimeDate = new Date(dateStr);

      // 1) compute the base weight
      const baseWeight = CRIME_WEIGHTS[offense] || DEFAULT_WEIGHT;

      // 2) multiply by time decay factor
      const recencyMultiplier = timeDecayFactor(crimeDate);
      const finalCrimeWeight = baseWeight * recencyMultiplier;

      // 3) find nearest street
      let nearestStreet = null;
      let shortestDistance = Infinity;

      for (const st of streets) {
        if (!st.polygonData || !st.polygonData.coordinates) continue;

        // For each coordinate in the polygon (assuming st.polygonData is type "Polygon")
        // st.polygonData.coordinates => [ [ [lng1, lat1], [lng2, lat2], ... ] ]
        // The [0] is because typically polygons have an outer ring at index 0
        const polygonCoords = st.polygonData.coordinates[0];
        if (!Array.isArray(polygonCoords)) continue;

        for (const [polyLng, polyLat] of polygonCoords) {
          // distance in km between crime point and polygon vertex
          const dist = calculateDistance(coords[1], coords[0], polyLat, polyLng);
          if (dist < shortestDistance) {
            shortestDistance = dist;
            nearestStreet = st;
          }
        }
      }

      // 4) if the nearest street is within threshold, record crime
      if (nearestStreet && shortestDistance < DISTANCE_THRESHOLD_KM) {
        streetCrimes[nearestStreet.id].weightedScore += finalCrimeWeight;
        streetCrimes[nearestStreet.id].crimeList.push({
          type: offense,
          date: dateStr,
          block: block,
          shift: shift,
          method: method,
          distanceKm: shortestDistance.toFixed(4),
          baseWeight,
          recencyMultiplier: recencyMultiplier.toFixed(3),
          finalCrimeWeight: finalCrimeWeight.toFixed(3)
        });
      }
    }

    console.log("\nUpdating each street’s safetyScore in DB...");
    for (const st of streets) {
      const info = streetCrimes[st.id];
      if (!info) continue;

      // Start from 5.0 (the user wants initial to be above 5).
      // Then subtract some fraction of the weighted crimes so that
      // more or heavier crimes => lowers the score.
      // EXACT formula is up to you:
      //
      //   newScore = 5 - (info.weightedScore * 0.1)  
      //
      // Then clamp between 0 and 10:
      let newScore = 5 - (info.weightedScore * 0.1);

      // If you want a slightly less punitive approach, reduce the factor
      // Or you can do a more complex approach that looks at # of crimes, etc.
      if (newScore < 0) newScore = 0;
      if (newScore > 10) newScore = 10;

      // Append these crime details to the existing 'reports' or just overwrite
      // If you want to keep old data, you must retrieve the existing street's 'reports' first
      // then combine. But for a simple approach:
      await prisma.street.update({
        where: { id: st.id },
        data: {
          safetyScore: newScore,
          reports: info.crimeList
        }
      });
    }

    console.log("✅ Done updating safety scores based on crime data!");
    await prisma.$disconnect();
  } catch (err) {
    console.error("Error importing crimes:", err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Kick off
importCrimes();
