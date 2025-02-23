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

// TEMPORARY AI explanation function (simulate explanation)
async function getLlamaExplanation(routeScores) {
  return "Route A was chosen because it passes through areas with a higher safety score based on local crime data.";
}

// Helper: Checks if a coordinate [lat, lng] is inside a given polygon using Turf
function isPointInPolygon(lat, lng, polygonData) {
  try {
    const pt = turf.point([lng, lat]); // Note: Turf expects [lng, lat]
    const poly = turf.polygon(polygonData.coordinates);
    return turf.booleanPointInPolygon(pt, poly);
  } catch (err) {
    console.error("Error checking point in polygon:", err);
    return false;
  }
}

// Helper: Calculate haversine distance (in miles) between two coordinates
function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = (x) => x * Math.PI / 180;
  const R = 3958.8; // Radius of Earth in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper: Calculate total route distance (in miles)
function calculateRouteDistance(route) {
  let total = 0;
  const coords = route.coordinates;
  for (let i = 0; i < coords.length - 1; i++) {
    total += haversineDistance(coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1]);
  }
  return total;
}

// API to Get the Safest Route from an array of routes (if needed)
app.post('/api/get-safe-route', async (req, res) => {
  try {
    const { routes } = req.body;
    if (!routes || !Array.isArray(routes)) {
      return res.status(400).json({ error: "Missing or invalid 'routes' in request body." });
    }

    const allStreets = await prisma.street.findMany({
      where: { polygonData: { not: null } }
    });

    const routeScores = await Promise.all(
      routes.map(async (routeObj) => {
        const coords = routeObj.coordinates;
        if (!coords || coords.length === 0) {
          return { route: routeObj, avgSafetyScore: 0, duration: 0, distance: 0 };
        }

        let totalSafetyScore = 0;
        let totalDistance = 0;
        // Loop over consecutive coordinate pairs
        for (let i = 0; i < coords.length - 1; i++) {
          const [lat1, lng1] = coords[i];
          const [lat2, lng2] = coords[i + 1];

          let matchedStreet = null;
          for (const street of allStreets) {
            if (!street.polygonData) continue;
            if (isPointInPolygon(lat1, lng1, street.polygonData)) {
              matchedStreet = street;
              break;
            }
          }
          totalSafetyScore += matchedStreet ? matchedStreet.safetyScore : 5;
          totalDistance += turf.distance(turf.point([lng1, lat1]), turf.point([lng2, lat2]), { units: "miles" });
        }

        // Approximate duration: assume average walking speed of 3 mph
        const estimatedDuration = (totalDistance / 3) * 60; // in minutes
        const avgSafetyScore = totalSafetyScore / coords.length;

        return { 
          route: routeObj, 
          avgSafetyScore: avgSafetyScore.toFixed(1), 
          distance: totalDistance.toFixed(2), 
          duration: Math.round(estimatedDuration)
        };
      })
    );

    const safestRoute = routeScores.sort((a, b) => b.avgSafetyScore - a.avgSafetyScore)[0];
    res.json({ safestRoute });
  } catch (err) {
    console.error("Server error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API to Get the Safest Route from a natural language query
app.post('/api/safe-route-nl', async (req, res) => {
  try {
    const { query, userLocation } = req.body;
    console.log("✅ Received query:", query);
    console.log("✅ Received userLocation:", userLocation);

    if (!query) {
      return res.status(400).json({ error: "Query is required." });
    }
    if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
      return res.status(400).json({ error: "User location is required." });
    }

    // STEP 1: Convert query to coordinates using Google APIs
    const destinationCoords = await getCoordinatesFromPlace(query);
    console.log("📍 Destination coordinates found:", destinationCoords);

    if (!destinationCoords) {
      return res.status(400).json({ error: "Failed to get destination coordinates." });
    }

    // STEP 2: Fetch routes from Google Directions API
    const routes = await getRoutes(userLocation, destinationCoords);
    console.log("🛤️ Routes received:", routes.length);

    if (routes.length === 0) {
      return res.status(404).json({ error: "No routes found." });
    }

    // STEP 3: Evaluate route safety using stored street polygons
    const allStreets = await prisma.street.findMany({ where: { polygonData: { not: null } } });

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

    console.log("🔍 Route safety scores calculated.");

    // STEP 4: Choose the safest route
    const safestRoute = routeScores.sort((a, b) => b.avgSafetyScore - a.avgSafetyScore)[0];
    console.log("✅ Safest route selected:", JSON.stringify(safestRoute, null, 2));

    // STEP 5: Get AI explanation (if desired)
    const explanation = await getLlamaExplanation(routeScores);

    // STEP 6: Calculate additional details for summary
    const distance = calculateRouteDistance(safestRoute.route);
    const estimatedDuration = Math.round((distance / 3) * 60); // in minutes
    const summaryMessage = `The safest route is ${safestRoute.route.summary || "Unnamed route"}. It is approximately ${distance.toFixed(2)} miles long, taking about ${estimatedDuration} minutes to walk, with a safety score of ${safestRoute.avgSafetyScore.toFixed(1)}.`;

    // STEP 7: Send response with detailed summary
    res.json({ 
      safestRoute, 
      explanation, 
      routeSummary: summaryMessage 
    });
  } catch (err) {
    console.error("🔥 Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Helper: Get coordinates for a place name using the Google Geocoding/Places API.
 */
async function getCoordinatesFromPlace(placeName) {
  try {
    console.log("🔍 Fetching coordinates for:", placeName);
    const searchQuery = !placeName.toLowerCase().includes('washington') &&
                        !placeName.toLowerCase().includes('dc')
                        ? `${placeName}, Washington, DC`
                        : placeName;

    // Try Google Places API first
    const placesResponse = await axios.get('https://maps.googleapis.com/maps/api/place/findplacefromtext/json', {
      params: {
        input: searchQuery,
        inputtype: 'textquery',
        fields: 'geometry,formatted_address,name',
        locationbias: 'circle:8000@38.8977,-77.0365', // Bias to DC area
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });
    console.log("📡 Google Places API Response:", JSON.stringify(placesResponse.data, null, 2));

    if (placesResponse.data.status === 'OK' && placesResponse.data.candidates.length > 0) {
      const location = placesResponse.data.candidates[0].geometry.location;
      console.log("✅ Places API Found Location:", location);
      return { latitude: location.lat, longitude: location.lng };
    }

    // Fall back to Google Geocoding API
    const geoResponse = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: searchQuery,
        components: 'administrative_area:DC|country:US',
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });
    console.log("📡 Google Geocoding API Response:", JSON.stringify(geoResponse.data, null, 2));
    if (geoResponse.data.status !== 'OK' || geoResponse.data.results.length === 0) {
      console.error("❌ No results for:", searchQuery);
      return null;
    }
    const geoLocation = geoResponse.data.results[0].geometry.location;
    console.log("✅ Geocoding API Found Location:", geoLocation);
    return { latitude: geoLocation.lat, longitude: geoLocation.lng };

  } catch (error) {
    console.error("🔥 Error fetching coordinates from place:", error);
    return null;
  }
}

/**
 * Helper: Get routes between origin and destination using the Google Directions API.
 */
async function getRoutes(origin, destination) {
  try {
    console.log("🛤️ Fetching routes from:", origin, "to", destination);
    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        alternatives: true,
        mode: 'walking',
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });
    console.log("📡 Google Directions API Raw Response:", JSON.stringify(response.data, null, 2));
    if (response.data.status !== 'OK' || response.data.routes.length === 0) {
      console.error("❌ Google Directions API returned no valid routes.");
      return [];
    }
    // Convert Google Directions response into our internal route format
    const routes = response.data.routes.map(route => {
      let coordinates = [];
      route.legs.forEach(leg => {
        leg.steps.forEach(step => {
          coordinates.push([step.start_location.lat, step.start_location.lng]);
        });
        // Include the final endpoint for each leg
        coordinates.push([leg.end_location.lat, leg.end_location.lng]);
      });
      console.log("✅ Processed route summary:", route.summary);
      console.log("✅ Processed route coordinates count:", coordinates.length);
      return {
        summary: route.summary || "Unnamed route",
        coordinates: coordinates
      };
    });
    console.log("✅ Total routes found:", routes.length);
    return routes;
  } catch (error) {
    console.error("🔥 Error fetching routes from Google Directions:", error);
    return [];
  }
}

app.listen(5001, () => console.log("🚀 Backend running on port 5001"));
