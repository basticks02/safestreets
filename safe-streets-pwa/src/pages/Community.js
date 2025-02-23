import React, { useState, useEffect } from 'react';
import './styles/Community.css';

// Sample data for community hubs
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
  const [hubs, setHubs] = useState(sampleHubs);
  const [selectedHub, setSelectedHub] = useState(null);
  const [newUpdate, setNewUpdate] = useState("");

  // Automatically select the first hub on mount
  useEffect(() => {
    if (hubs.length > 0 && !selectedHub) {
      setSelectedHub(hubs[0]);
    }
  }, [hubs, selectedHub]);

  // Handle posting a new update (append to the bottom)
  const handlePostUpdate = () => {
    if (!newUpdate.trim()) return;
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

  // Handle creating a new hub via a simple prompt
  const handleCreateHub = () => {
    const hubName = prompt("Enter the new community hub name:");
    if (!hubName) return;
    const hubDescription = prompt("Enter a description for the new hub:");
    const newHub = {
      id: Date.now(),
      name: hubName,
      description: hubDescription || "",
      updates: [],
    };
    const updatedHubs = [...hubs, newHub];
    setHubs(updatedHubs);
    setSelectedHub(newHub);
  };

  return (
    <div className="community-container">
      {/* Sidebar: List of Hubs */}
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
              <button className="join-btn" onClick={(e) => { e.stopPropagation(); console.log(`User joined hub ${hub.id}`); }}>
                Join
              </button>
            </li>
          ))}
        </ul>
        {/* Create New Hub Button */}
        <button className="create-hub-btn" onClick={handleCreateHub}>
          Create New Hub
        </button>
      </div>

      {/* Main Content: Selected Hub's Updates */}
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
              <button onClick={handlePostUpdate}>Post Update</button>
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
