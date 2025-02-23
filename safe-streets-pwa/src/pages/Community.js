import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaPencilAlt } from "react-icons/fa";
import "./styles/Community.css";

// Sample data for hubs
const sampleHubs = [
  {
    id: 1,
    name: "Howard University",
    description: "Updates and events for Howard University students.",
    joined: false,
    updates: [
      {
        id: 1,
        timestamp: "2025-02-22T19:00:00Z",
        content: "Party at the dorms tonight! Stay safe and travel in groups.",
        image: "https://via.placeholder.com/300x200",
      },
      {
        id: 2,
        timestamp: "2025-02-22T20:00:00Z",
        content: "Safety alert: Incident reported near the library. Please avoid that area.",
        image: null,
      },
    ],
  },
  {
    id: 2,
    name: "Local Neighborhood",
    description: "Community updates for your local area.",
    joined: false,
    updates: [
      {
        id: 3,
        timestamp: "2025-02-22T19:30:00Z",
        content: "Block party scheduled for Sunday! Join in for some fun.",
        image: "https://via.placeholder.com/300x200",
      },
    ],
  },
];

function Community() {
  const [hubs, setHubs] = useState(() => {
    const stored = localStorage.getItem("communityHubs");
    return stored ? JSON.parse(stored) : sampleHubs;
  });

  // Persist hubs to localStorage when they change
  useEffect(() => {
    localStorage.setItem("communityHubs", JSON.stringify(hubs));
  }, [hubs]);

  return (
    <div className="community-container">
      <Routes>
        <Route path="/" element={<HubList hubs={hubs} setHubs={setHubs} />} />
        <Route path=":hubId" element={<HubDetails hubs={hubs} setHubs={setHubs} />} />
        <Route path="create" element={<CreateHub hubs={hubs} setHubs={setHubs} />} />
      </Routes>
      <FloatingPencil />
    </div>
  );
}

// HubList Component: displays list of hubs with join/delete buttons
function HubList({ hubs, setHubs }) {
  const navigate = useNavigate();

  const handleJoin = (hubId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setHubs((prevHubs) =>
      prevHubs.map((hub) =>
        hub.id === hubId ? { ...hub, joined: !hub.joined } : hub
      )
    );
  };

  const handleDeleteHub = (hubId, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this hub?")) {
      const updatedHubs = hubs.filter((hub) => hub.id !== hubId);
      setHubs(updatedHubs);
    }
  };

  return (
    <div className="hub-list">
      <h2>Community Hubs</h2>
      <ul>
        {hubs.map((hub) => (
          <li key={hub.id}>
            <Link to={`${hub.id}`} className="hub-item">
              <div className="hub-name">{hub.name}</div>
              <div className="hub-description">{hub.description}</div>
            </Link>
            <div className="hub-actions">
              <button
                className={`join-btn ${hub.joined ? "joined" : ""}`}
                onClick={(e) => handleJoin(hub.id, e)}
              >
                {hub.joined ? "Joined" : "Join"}
              </button>
              <button
                className="delete-btn"
                onClick={(e) => handleDeleteHub(hub.id, e)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// HubDetails Component: displays details and updates for a specific hub
function HubDetails({ hubs, setHubs }) {
  const { hubId } = useParams();
  const navigate = useNavigate();
  const hub = hubs.find((hub) => hub.id === parseInt(hubId));
  const [newUpdate, setNewUpdate] = useState("");
  const [updateIsRecording, setUpdateIsRecording] = useState(false);

  if (!hub) return <p>Hub not found.</p>;

  const handlePostUpdate = () => {
    if (!newUpdate.trim()) return;
    const newUpdateObj = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      content: newUpdate,
    };
    const updatedHubs = hubs.map((h) =>
      h.id === hub.id ? { ...h, updates: [...h.updates, newUpdateObj] } : h
    );
    setHubs(updatedHubs);
    setNewUpdate("");
  };

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
    recognition.onend = () => setUpdateIsRecording(false);
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setUpdateIsRecording(false);
    };
  };

  return (
    <div className="hub-content">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <FaArrowLeft /> Back
      </button>
      <h2>{hub.name} Updates</h2>
      <p>{hub.description}</p>
      <div className="updates">
        {hub.updates.map((update) => (
          <div key={update.id} className="update">
            <div className="update-header">
              <span className="timestamp">
                {new Date(update.timestamp).toLocaleString()}
              </span>
            </div>
            <div className="update-content">
              <p>{update.content}</p>
              {update.image && <img src={update.image} alt="Update" />}
            </div>
          </div>
        ))}
      </div>
      <div className="update-form">
        <textarea
          placeholder="Share an update..."
          value={newUpdate}
          onChange={(e) => setNewUpdate(e.target.value)}
        />
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
    </div>
  );
}

// CreateHub Component: form to create a new hub
function CreateHub({ hubs, setHubs }) {
  const navigate = useNavigate();
  const [newHubName, setNewHubName] = useState("");
  const [newHubDescription, setNewHubDescription] = useState("");

  const handleCreate = () => {
    if (!newHubName.trim()) {
      alert("Hub name is required.");
      return;
    }
    const newHub = {
      id: Date.now(),
      name: newHubName,
      description: newHubDescription || "",
      joined: false,
      updates: [],
    };
    setHubs([...hubs, newHub]);
    navigate(`/${newHub.id}`);
  };

  return (
    <div className="hub-content">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <FaArrowLeft /> Back
      </button>
      <h2>Create New Hub</h2>
      <div className="create-hub-form">
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
        <button onClick={handleCreate}>Create Hub</button>
      </div>
    </div>
  );
}

// Floating Pencil Button Component
function FloatingPencil() {
  return (
    <Link to="create" className="floating-pencil">
      <FaPencilAlt />
    </Link>
  );
}

export default Community;
