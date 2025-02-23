import React, { useState } from "react";
import { GoogleMap, LoadScript, DirectionsRenderer } from "@react-google-maps/api";
import axios from "axios";
import { Link } from "react-router-dom";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import "./styles/Home.css";

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY; // API key from .env

function Home() {
  const [query, setQuery] = useState(""); // Single input for start & destination
  const [directions, setDirections] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  // Fetch route from backend
  const fetchRoute = async () => {
    try {
      const response = await axios.post("http://localhost:8000/api/get-safe-route", { query });
      setDirections(response.data.route);
    } catch (error) {
      console.error("Error fetching route:", error);
    }
  };

  // Handle voice input using SpeechRecognition
  const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Your browser does not support voice input.");
      return;
    }
    const recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
    recognition.lang = "en-US";
    recognition.start();
    setIsRecording(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
    };
  };

  return (
    <div className="home-container">
      <h1>Safe Streets Navigation</h1>
      <p>Type or speak your start and destination, and we’ll display the safest route.</p>

      {/* Single input box for both text and voice */}
      <div className="input-box">
        <input
          type="text"
          placeholder="Enter start & destination..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className={`mic-button ${isRecording ? "recording" : ""}`} onClick={handleVoiceInput}>
          {isRecording ? <FaMicrophoneSlash /> : <FaMicrophone />}
        </button>
      </div>

      <button onClick={fetchRoute} className="find-route-btn">Find Safe Route</button>

      {/* Google Maps Component */}
      <div className="map-container">
        <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={{ lat: 38.9072, lng: -77.0369 }}
            zoom={14}
          >
            {directions && <DirectionsRenderer directions={directions} />}
          </GoogleMap>
        </LoadScript>
      </div>

      <nav>
        <Link to="/community">Community</Link> | <Link to="/report">Report an Issue</Link>
      </nav>
    </div>
  );
}

export default Home;
