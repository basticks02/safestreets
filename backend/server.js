require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const bodyParser = require('body-parser');
const cors = require('cors');
const turf = require('@turf/turf'); // For spatial operations

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(bodyParser.json());

// Function to call LLaMA API for AI-powered route explanation
// async function getLlamaExplanation(routeScores) {
//   try {
//     const response = await axios.post(
//       "https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf",
//       { inputs: `Analyze these routes and pick the safest based on safety scores: ${JSON.stringify(routeScores)}.` },
//       {
//         headers: {
//           "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
//           "Content-Type": "application/json"
//         }
//       }
//     );

//     return response.data?.generated_text || "AI explanation unavailable.";
//   } catch (err) {
//     console.error("LLaMA API error:", err);
//     return "Could not generate an AI explanation.";
//   }
// }
async function getLlamaExplanation(routeScores) {
    // TEMPORARY: Return a simulated explanation for testing
    return "Route A was chosen because it passes through areas with a higher safety score based on local crime data.";
  }
  

// Helper: Checks if a coordinate [lat, lng] is inside a given polygon (using Turf)
function isPointInPolygon(lat, lng, polygonData) {
  try {
    // Create a Turf point (note: Turf expects [lng, lat])
    const pt = turf.point([lng, lat]);
    // Build a Turf polygon from the stored polygonData
    // Assuming polygonData is a GeoJSON object with a "coordinates" property
    const poly = turf.polygon(polygonData.coordinates);
    return turf.booleanPointInPolygon(pt, poly);
  } catch (err) {
    console.error("Error checking point in polygon:", err);
    return false;
  }
}

// API to Get the Safest Route
app.post('/api/get-safe-route', async (req, res) => {
  try {
    // The request body should contain an array of route objects, each with a 'coordinates' field (an array of [lat, lng])
    const { routes } = req.body;
    if (!routes || !Array.isArray(routes)) {
      return res.status(400).json({ error: "Missing or invalid 'routes' in request body." });
    }

    // Fetch all streets that have polygonData from the database (do this once for efficiency)
    const allStreets = await prisma.street.findMany({
      where: { polygonData: { not: null } }
    });

    // Evaluate safety for each route
    const routeScores = await Promise.all(
      routes.map(async (routeObj) => {
        const coords = routeObj.coordinates;
        if (!coords || coords.length === 0) {
          return { route: routeObj, avgSafetyScore: 0 };
        }

        let totalSafetyScore = 0;
        const numPoints = coords.length;

        // For each coordinate in the route, try to find the matching street
        for (let [lat, lng] of coords) {
          let matchedStreet = null;
          // Loop through the streets to check if the point is inside any polygon
          for (const street of allStreets) {
            if (!street.polygonData) continue;
            if (isPointInPolygon(lat, lng, street.polygonData)) {
              matchedStreet = street;
              break;
            }
          }
          // Use the street's safetyScore if found; otherwise, use a default score of 5
          totalSafetyScore += matchedStreet ? matchedStreet.safetyScore : 5;
        }

        const avg = totalSafetyScore / numPoints;
        return { route: routeObj, avgSafetyScore: avg };
      })
    );

    // Pick the route with the highest average safety score
    const safestRoute = routeScores.sort((a, b) => b.avgSafetyScore - a.avgSafetyScore)[0];

    // Get an AI explanation for why this route was chosen
    const explanation = await getLlamaExplanation(routeScores);

    res.json({ safestRoute, explanation });
  } catch (err) {
    console.error("Server error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/api/safe-route-nl', async (req, res) => {
    try {
      const { query, userLocation } = req.body;
      if (!query || !userLocation) {
        return res.status(400).json({ error: "Missing 'query' or 'userLocation' in request body." });
      }
  
      // Convert the destination query into coordinates using the Google Geocoding API
      const destinationCoords = await getCoordinatesFromPlace(query);
      if (!destinationCoords) {
        return res.status(400).json({ error: "Failed to get destination coordinates." });
      }
  
      // Fetch possible routes from the user's location to the destination via the Google Directions API
      const routes = await getRoutes(userLocation, destinationCoords);
      if (routes.length === 0) {
        return res.status(404).json({ error: "No routes found." });
      }
  
      // Evaluate safety for each route using the stored street polygons
      const allStreets = await prisma.street.findMany({
        where: { polygonData: { not: null } }
      });
      const routeScores = await Promise.all(
        routes.map(async (routeObj) => {
          const coords = routeObj.coordinates;
          if (!coords || coords.length === 0) {
            return { route: routeObj, avgSafetyScore: 0 };
          }
          let totalSafetyScore = 0;
          const numPoints = coords.length;
          for (let [lat, lng] of coords) {
            let matchedStreet = null;
            for (const street of allStreets) {
              if (!street.polygonData) continue;
              if (isPointInPolygon(lat, lng, street.polygonData)) {
                matchedStreet = street;
                break;
              }
            }
            totalSafetyScore += matchedStreet ? matchedStreet.safetyScore : 5;
          }
          const avg = totalSafetyScore / numPoints;
          return { route: routeObj, avgSafetyScore: avg };
        })
      );
  
      // Choose the safest route and generate an explanation
      const safestRoute = routeScores.sort((a, b) => b.avgSafetyScore - a.avgSafetyScore)[0];
      const explanation = await getLlamaExplanation(routeScores);
      res.json({ safestRoute, explanation });
    } catch (err) {
      console.error("Error processing natural language route request:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
  
  /**
   * Helper: Get coordinates for a place name using the Google Geocoding API.
   */
  async function getCoordinatesFromPlace(placeName) {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address: placeName,
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      });
      if (response.data.status !== 'OK' || response.data.results.length === 0) {
        throw new Error("Failed to retrieve location data.");
      }
      const location = response.data.results[0].geometry.location;
      return { latitude: location.lat, longitude: location.lng };
    } catch (error) {
      console.error("Error fetching coordinates from place:", error);
      return null;
    }
  }
  
  /**
   * Helper: Get routes between origin and destination using the Google Directions API.
   */
  async function getRoutes(origin, destination) {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
        params: {
          origin: `${origin.latitude},${origin.longitude}`,
          destination: `${destination.latitude},${destination.longitude}`,
          alternatives: true,
          mode: 'walking', // Change mode if needed (driving, transit, etc.)
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      });
      if (response.data.status !== 'OK' || response.data.routes.length === 0) {
        throw new Error("Failed to retrieve routes.");
      }
      // Convert the Google Directions response into our internal route format
      const routes = response.data.routes.map(route => {
        let coordinates = [];
        route.legs.forEach(leg => {
          leg.steps.forEach(step => {
            coordinates.push([step.start_location.lat, step.start_location.lng]);
          });
          // Include the final endpoint for each leg
          coordinates.push([leg.end_location.lat, leg.end_location.lng]);
        });
        return {
          summary: route.summary || "Unnamed route",
          coordinates: coordinates
        };
      });
      return routes;
    } catch (error) {
      console.error("Error fetching routes from Google Directions:", error);
      return [];
    }
  }

app.listen(5001, () => console.log("🚀 Backend running on port 5001"));
