import React, { useState, useEffect } from "react";
import { GoogleMap, LoadScript, DirectionsRenderer, Marker } from "@react-google-maps/api";
import { Link } from "react-router-dom";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";
import { IoNavigate } from "react-icons/io5";
import { fetchSafeRoute } from "../api/routesApi";
import "./styles/Home.css";

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

function Home() {
  const [query, setQuery] = useState("");
  const [routeData, setRouteData] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 38.9072, lng: -77.0369 });
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setUserLocation(location);
          console.log("User Location:", location);
          setMapCenter({ lat: location.latitude, lng: location.longitude });
        },
        (error) => {
          console.error("Error obtaining location:", error);
          alert("Unable to retrieve your location. Please allow location access.");
        }
      );
    }
  }, []);

  const handleFetchRoute = async () => {
    if (!query || !userLocation) {
      alert("Please ensure both location and destination are available.");
      return;
    }
    try {
      const response = await fetchSafeRoute(query, userLocation);
      console.log("Raw response:", response);
  
      // Clear any existing speech
      window.speechSynthesis.cancel();
  
      // Extract route details from the response
      let route = response?.safestRoute?.route;
      const duration = response?.safestRoute?.duration;
      const distance = response?.safestRoute?.distance;
      const safetyScore = response?.safestRoute?.avgSafetyScore;
  
      // Fallback: if route exists but summary is missing, assign a default summary
      if (route && !route.summary) {
        route.summary = "The safest route found for your destination";
      }
  
      // Generate spoken summary based on the route details
      let summaryText = "";
      if (route) {
        summaryText = `This is the safest route: ${route.summary}. It will take approximately ${duration} minutes to reach your destination. The total distance is ${distance} miles. The safety score for this route is ${safetyScore} out of 10. Please proceed with caution and stay safe.`;
      } else {
        summaryText = "No safe route available.";
      }
  
      console.log("Speaking text:", summaryText);
  
      // Convert the summary to speech
      const routeSpeech = new SpeechSynthesisUtterance(summaryText);
      routeSpeech.onstart = () => console.log("Started speaking route summary");
      routeSpeech.onend = () => console.log("Finished speaking route summary");
      routeSpeech.onerror = (event) => console.error("Speech synthesis error:", event.error);
      window.speechSynthesis.speak(routeSpeech);
  
      // Process route for displaying on the map if a route exists
      if (route) {
        const newDirections = buildDirectionsResult(route);
        if (newDirections) {
          setRouteData({ ...response, directions: newDirections });
          const bounds = newDirections.routes[0].bounds;
          const routeCenter = {
            lat: (bounds.north + bounds.south) / 2,
            lng: (bounds.east + bounds.west) / 2
          };
          setMapCenter(routeCenter);
        }
      }
    } catch (error) {
      console.error("Error fetching safe route:", error);
      alert("Failed to fetch route. Please try again.");
    }
  };
  
  
const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Your browser does not support voice input.");
      return;
    }
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.start();
    setIsRecording(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
    };

    recognition.onend = () => setIsRecording(false);
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
    };
  };

  const buildDirectionsResult = (route) => {
    if (!route || !route.coordinates || route.coordinates.length === 0) {
      console.error("Invalid route data:", route);
      return null;
    }
  
    const path = route.coordinates.map(coord => ({
      lat: parseFloat(coord[0]),
      lng: parseFloat(coord[1])
    }));
  
    if (path.length === 0) {
      console.error("Empty path after conversion.");
      return null;
    }
  
    const leg = {
      start_location: path[0],
      end_location: path[path.length - 1],
      steps: path.map((point, index) => ({
        start_location: point,
        end_location: path[index + 1] || point,
        path: [point, path[index + 1] || point],
        instructions: "",
        distance: { text: "", value: 0 },
        duration: { text: "", value: 0 }
      })),
      path: path,
      distance: { text: "", value: 0 },
      duration: { text: "", value: 0 }
    };
  
    const bounds = {
      north: Math.max(...path.map(p => p.lat)),
      south: Math.min(...path.map(p => p.lat)),
      east: Math.max(...path.map(p => p.lng)),
      west: Math.min(...path.map(p => p.lng))
    };
  
    console.log("Generated path:", path);
    console.log("Generated bounds:", bounds);
  
    return {
      routes: [{
        legs: [leg],
        overview_path: path,
        bounds: bounds
      }],
      status: "OK"
    };
  };

  const directionsResult = routeData?.safestRoute?.route 
    ? buildDirectionsResult(routeData.safestRoute.route)
    : null;

    return (
      <div className="modern-home-container">
      {/* Full-screen map as background */}
      <div className="fullscreen-map">
        <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={mapCenter}
            zoom={14}
            options={{
              styles: [
                { elementType: "geometry", stylers: [{ color: "#1a1d29" }] },
                { elementType: "labels.text.stroke", stylers: [{ color: "#1a1d29" }] },
                { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                {
                  featureType: "road",
                  elementType: "geometry",
                  stylers: [{ color: "#38414e" }],
                },
                {
                  featureType: "road",
                  elementType: "geometry.stroke",
                  stylers: [{ color: "#212a37" }],
                },
                {
                  featureType: "water",
                  elementType: "geometry",
                  stylers: [{ color: "#17263c" }],
                },
              ],
            }}
          >
            {userLocation && (
              <Marker
                position={{
                  lat: userLocation.latitude,
                  lng: userLocation.longitude,
                }}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                  scaledSize: { width: 40, height: 40 },
                }}
                title="Your Location"
              />
            )}
            {routeData?.directions && (
              <DirectionsRenderer
                directions={routeData.directions}
                options={{
                  suppressMarkers: false,
                  polylineOptions: {
                    strokeColor: "#4A90E2",
                    strokeWeight: 6,
                    strokeOpacity: 0.8,
                  },
                }}
              />
            )}
          </GoogleMap>
        </LoadScript>
      </div>
  
        {/* Floating header */}
        <div className="floating-header">
          <h1>Safe Streets</h1>
        </div>
  
        {/* Floating controls at bottom */}
        <div className="floating-controls">
          <div className="search-container">
            <div className="input-group">
              <input
                type="text"
                placeholder="Where would you like to go?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                className={`mic-button ${isRecording ? "recording" : ""}`}
                onClick={handleVoiceInput}
              >
                {isRecording ? <FaMicrophoneSlash /> : <FaMicrophone />}
              </button>
            </div>
            <button className="navigate-button" onClick={handleFetchRoute}>
              <IoNavigate />
              <span>Navigate</span>
            </button>
          </div>
  
          {/* Route summary card */}
          {routeData?.safestRoute?.route?.summary && (
            <div className={`route-summary ${showSummary ? 'show' : ''}`}>
              <p>{routeData.safestRoute.route.summary}</p>
            </div>
          )}
  
          {/* Navigation links */}
          <nav className="bottom-nav">
            <Link to="/community">Community</Link>
            <Link to="/report">Report Issue</Link>
          </nav>
        </div>
      </div>
    );
  }
  
  export default Home;