import axios from "axios";

// Function to fetch the safest route from the backend
export const fetchSafeRoute = async (query, userLocation) => {
  if (!query) {
    throw new Error("Query is required.");
  }
  if (!userLocation) {
    throw new Error("User location is required.");
  }

  try {
    const response = await axios.post("http://localhost:5001/api/safe-route-nl", {
      query,
      userLocation,
    });

    return response.data.safestRoute.route; // Return the route object
  } catch (error) {
    console.error("Error fetching route:", error);
    throw error;
  }
};
