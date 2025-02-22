require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(bodyParser.json());

// (Optional) AI Explanation function:
async function getLlamaExplanation(routeScores) {
  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf",
      { inputs: `Analyze these routes and pick the safest based on safety scores: ${JSON.stringify(routeScores)}.` },
      {
        headers: {
          "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    return response.data?.generated_text || "No AI explanation";
  } catch (err) {
    console.error("LLaMA error:", err);
    return "Could not generate an AI explanation.";
  }
}

app.post('/api/get-safe-route', async (req, res) => {
  try {
    // The frontend passes an array of route objects
    // each route object has 'coordinates', an array of [lat, lng]
    const { routes } = req.body;

    if (!routes || !Array.isArray(routes)) {
      return res.status(400).json({ error: "Missing or invalid 'routes' in request body." });
    }

    // 1) Evaluate safety
    const routeScores = await Promise.all(
      routes.map(async (routeObj) => {
        const coords = routeObj.coordinates; 
        if (!coords || coords.length === 0) {
          return { route: routeObj, avgSafetyScore: 0 };
        }

        let totalSafetyScore = 0;
        let numPoints = coords.length;

        // coords is [[lat, lng], [lat, lng], ...]
        for (let [lat, lng] of coords) {
          const foundStreet = await prisma.street.findFirst({
            where: {
              latitude: { gte: lat - 0.0005, lte: lat + 0.0005 },
              longitude: { gte: lng - 0.0005, lte: lng + 0.0005 }
            }
          });

          if (foundStreet) totalSafetyScore += foundStreet.safetyScore;
          else totalSafetyScore += 5; // default
        }

        const avg = totalSafetyScore / numPoints;
        return {
          route: routeObj, 
          avgSafetyScore: avg
        };
      })
    );

    // 2) Pick the route with highest (avg) safety score
    const safestRoute = routeScores.sort((a, b) => b.avgSafetyScore - a.avgSafetyScore)[0];

    // 3) (Optional) Ask AI for explanation
    const explanation = await getLlamaExplanation(routeScores);

    res.json({ safestRoute, explanation });
  } catch (err) {
    console.error("Server error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(5001, () => console.log("Backend on 5001!"));
