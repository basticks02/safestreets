const { PrismaClient } = require('@prisma/client');
const fs = require('fs-extra');

const prisma = new PrismaClient();
const geojsonFile = "dc_streets.geojson";

async function importGeoJSON() {
  try {
    console.log("Starting GeoJSON import...");
    const rawData = await fs.readFile(geojsonFile, 'utf8');
    const geoJSON = JSON.parse(rawData);

    console.log(`Total features found: ${geoJSON.features.length}`);
    
    // Add counting of Unknown Streets
    let unknownCount = 0;
    let validCount = 0;

    const streetEntries = geoJSON.features.map((feature) => {
      const streetName = feature.properties?.STREETNAME || "Unknown Street";

      if (!feature.geometry || feature.geometry.type !== "Polygon") {
        console.log(`Skipping feature - Invalid geometry or not a Polygon`);
        return null;
      }

      if (streetName === "Unknown Street") {
        unknownCount++;
      } else {
        validCount++;
      }

      return {
        name: streetName.trim(),
        polygonData: feature.geometry,
        safetyScore: 5.0,
        reports: []
      };
    }).filter(Boolean);

    console.log(`Unknown Streets found: ${unknownCount}`);
    console.log(`Valid named streets found: ${validCount}`);
    console.log(`Total valid entries to process: ${streetEntries.length}`);

    // Process in batches to avoid overwhelming the database
    const batchSize = 100;
    for (let i = 0; i < streetEntries.length; i += batchSize) {
      const batch = streetEntries.slice(i, i + batchSize);
      console.log(`Processing batch ${i/batchSize + 1} of ${Math.ceil(streetEntries.length/batchSize)}`);
      
      await Promise.all(batch.map(async (street) => {
        try {
          await prisma.street.create({
            data: street
          });
          process.stdout.write("."); // Progress indicator
        } catch (error) {
          console.error(`\n❌ Error inserting ${street.name}:`, error);
        }
      }));
      console.log("\nBatch complete");
    }

    console.log("\n✅ GeoJSON data import completed!");
    console.log(`Final statistics:
    - Total features processed: ${geoJSON.features.length}
    - Unknown Streets: ${unknownCount}
    - Named Streets: ${validCount}
    `);

  } catch (error) {
    console.error("❌ Error during import:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Add error handling for the main execution
importGeoJSON().catch(error => {
  console.error("Fatal error during import:", error);
  process.exit(1);
});