import React, { useState, useEffect } from 'react';
import './styles/Community.css';

// Sample data to initialize hubs if none exist in localStorage
const sampleHubs = [
  {
    id: 1,
    name: "Howard University",
    description: "Updates and events for Howard University students.",
    updates: [
      {
        id: 1,
        timestamp: "2025-02-22T19:00:00Z",
        content: "Party at the dorms tonight! Stay safe and travel in groups.",
        image: "https://via.placeholder.com/300x200",
        comments: [],
      },
      {
        id: 2,
        timestamp: "2025-02-22T20:00:00Z",
        content: "Safety alert: Incident reported near the library. Please avoid that area.",
        image: null,
        comments: [],
      },
    ],
  },
  {
    id: 2,
    name: "Local Neighborhood",
    description: "Community updates for your local area.",
    updates: [
      {
        id: 3,
        timestamp: "2025-02-22T19:30:00Z",
        content: "Block party scheduled for Sunday! Join in for some fun.",
        image: "https://via.placeholder.com/300x200",
        comments: [],
      },
    ],
  },
];

function Community() {
  // Retrieve hubs from localStorage if they exist, otherwise initialize with sampleHubs
  const [hubs, setHubs] = useState(() => {
    const stored = localStorage.getItem('communityHubs');
    return stored ? JSON.parse(stored) : sampleHubs;
  });
  const [selectedHub, setSelectedHub] = useState(null);
  const [newUpdate, setNewUpdate] = useState("");
  const [updateIsRecording, setUpdateIsRecording] = useState(false);
  const [newHubName, setNewHubName] = useState("");
  const [newHubDescription, setNewHubDescription] = useState("");

  // Automatically select the first hub on mount (if any)
  useEffect(() => {
    if (hubs.length > 0 && !selectedHub) {
      setSelectedHub(hubs[0]);
    }
  }, [hubs, selectedHub]);

  // Persist hubs in localStorage whenever hubs state changes
  useEffect(() => {
    localStorage.setItem('communityHubs', JSON.stringify(hubs));
  }, [hubs]);

  // Join hub functionality (stubbed)
  const handleJoin = (hubId, e) => {
    e.stopPropagation();
    console.log(`User joined hub ${hubId}`);
    // Later, implement join API call or notification subscription here
  };

  // Delete hub functionality
  const handleDeleteHub = (hubId, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this hub?")) {
      const updatedHubs = hubs.filter((hub) => hub.id !== hubId);
      setHubs(updatedHubs);
      if (selectedHub && selectedHub.id === hubId) {
        setSelectedHub(updatedHubs.length > 0 ? updatedHubs[0] : null);
      }
    }
  };

  // Create a new hub
  const handleCreateHub = () => {
    if (!newHubName.trim()) {
      alert("Hub name is required.");
      return;
    }
    const newHub = {
      id: Date.now(),
      name: newHubName,
      description: newHubDescription || "",
      updates: [],
    };
    const updatedHubs = [...hubs, newHub];
    setHubs(updatedHubs);
    setSelectedHub(newHub);
    setNewHubName("");
    setNewHubDescription("");
  };

  // Post a new update for the selected hub (appended to the bottom)
  const handlePostUpdate = () => {
    if (!newUpdate.trim() || !selectedHub) return;
    const newUpdateObj = {
      id: Date.now(), // In production, use a unique ID from the backend
      timestamp: new Date().toISOString(),
      content: newUpdate,
      image: null,
      comments: [],
    };
    const updatedHubs = hubs.map((hub) =>
      hub.id === selectedHub.id
        ? { ...hub, updates: [...hub.updates, newUpdateObj] }
        : hub
    );
    setHubs(updatedHubs);
    setSelectedHub(updatedHubs.find((hub) => hub.id === selectedHub.id));
    setNewUpdate("");
  };

  // Speech recognition for the update input box
  const handleVoiceInputForUpdate = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Your browser does not support voice input.");
      return;
    }
    const recognition = new (window.webkitSpeechRecognition || window.SpeechRecognition)();
    recognition.lang = "en-US";
    recognition.start();
    setUpdateIsRecording(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setNewUpdate(transcript);
    };

    recognition.onend = () => {
      setUpdateIsRecording(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setUpdateIsRecording(false);
    };
  };

  return (
    <div className="community-container">
      {/* Sidebar: List of Hubs & Create New Hub Form */}
      <div className="sidebar">
        <h2>Community Hubs</h2>
        <ul>
          {hubs.map((hub) => (
            <li
              key={hub.id}
              className={selectedHub && selectedHub.id === hub.id ? "active" : ""}
              onClick={() => setSelectedHub(hub)}
            >
              <div className="hub-name">{hub.name}</div>
              <div className="hub-description">{hub.description}</div>
              <div className="hub-actions">
                <button className="join-btn" onClick={(e) => handleJoin(hub.id, e)}>
                  Join
                </button>
                <button className="delete-btn" onClick={(e) => handleDeleteHub(hub.id, e)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
        <div className="create-hub-form">
          <h3>Create New Hub</h3>
          <input
            type="text"
            placeholder="Hub Name"
            value={newHubName}
            onChange={(e) => setNewHubName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Hub Description"
            value={newHubDescription}
            onChange={(e) => setNewHubDescription(e.target.value)}
          />
          <button onClick={handleCreateHub}>Create Hub</button>
        </div>
      </div>

      {/* Main content: Selected Hub's Updates */}
      <div className="hub-content">
        {selectedHub ? (
          <>
            <h2>{selectedHub.name} Updates</h2>
            <p>{selectedHub.description}</p>
            <div className="updates">
              {selectedHub.updates.map((update) => (
                <div key={update.id} className="update">
                  <div className="update-header">
                    <span className="timestamp">
                      {new Date(update.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="update-content">
                    <p>{update.content}</p>
                    {update.image && (
                      <img src={update.image} alt="Update visual" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Update form placed at the bottom */}
            <div className="update-form">
              <textarea
                placeholder="Share an update..."
                value={newUpdate}
                onChange={(e) => setNewUpdate(e.target.value)}
              ></textarea>
              <div className="update-form-actions">
                <button onClick={handlePostUpdate}>Post Update</button>
                <button
                  className={`mic-btn ${updateIsRecording ? "recording" : ""}`}
                  onClick={handleVoiceInputForUpdate}
                >
                  {updateIsRecording ? "Stop Recording" : "Speak"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <p>Select a community hub to see its updates.</p>
        )}
      </div>
    </div>
  );
}

export default Community;
