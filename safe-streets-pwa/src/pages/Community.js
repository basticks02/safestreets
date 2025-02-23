import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaPencilAlt } from "react-icons/fa";
import "./styles/Community.css";

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
      },
      {
        id: 2,
        timestamp: "2025-02-22T20:00:00Z",
        content: "Safety alert: Incident reported near the library. Please avoid that area.",
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
      },
    ],
  },
];

function Community() {
  const [hubs, setHubs] = useState(() => {
    const stored = localStorage.getItem("communityHubs");
    return stored ? JSON.parse(stored) : sampleHubs;
  });
  const [selectedHub, setSelectedHub] = useState(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

  // Persist hubs to localStorage
  useEffect(() => {
    localStorage.setItem("communityHubs", JSON.stringify(hubs));
  }, [hubs]);

  // Listen for window resize
  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // On desktop, auto-select the first hub if none selected
  useEffect(() => {
    if (!isMobileView && hubs.length > 0 && !selectedHub) {
      setSelectedHub(hubs[0]);
    }
  }, [isMobileView, hubs, selectedHub]);

  return (
    <div className="community-container">
      {isMobileView ? (
        // MOBILE: use nested routes
        <Routes>
          <Route index element={<HubList hubs={hubs} setHubs={setHubs} />} />
          <Route path=":hubId" element={<HubDetails hubs={hubs} setHubs={setHubs} />} />
          <Route path="create" element={<CreateHub hubs={hubs} setHubs={setHubs} />} />
        </Routes>
      ) : (
        // DESKTOP: two-pane layout
        <div className="desktop-layout">
          <Sidebar
            hubs={hubs}
            setHubs={setHubs}
            selectedHub={selectedHub}
            setSelectedHub={setSelectedHub}
          />
          <div className="hub-content">
            {selectedHub ? (
              <HubDetails hubs={hubs} setHubs={setHubs} hub={selectedHub} />
            ) : (
              <p>Please select a hub to view updates.</p>
            )}
          </div>
        </div>
      )}

      {/** On mobile, show floating pencil bottom-right */}
      {isMobileView && (
        <Link to="/community/create" className="floating-pencil">
          <FaPencilAlt />
        </Link>
      )}
    </div>
  );
}

/* -----------------------------
   SIDEBAR (Desktop Only)
   ----------------------------- */
function Sidebar({ hubs, setHubs, selectedHub, setSelectedHub }) {
  return (
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
              <button
                className={`join-btn ${hub.joined ? "joined" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setHubs((prev) =>
                    prev.map((h) =>
                      h.id === hub.id ? { ...h, joined: !h.joined } : h
                    )
                  );
                }}
              >
                {hub.joined ? "Joined" : "Join"}
              </button>
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm("Are you sure you want to delete this hub?")) {
                    const updated = hubs.filter((h) => h.id !== hub.id);
                    setHubs(updated);
                    if (selectedHub?.id === hub.id) {
                      setSelectedHub(updated[0] || null);
                    }
                  }
                }}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      {/* Desktop pencil at bottom of sidebar */}
      <div className="sidebar-footer">
        <Link to="/community/create" className="floating-pencil">
          <FaPencilAlt />
        </Link>
      </div>
    </div>
  );
}

/* -----------------------------
   HUB LIST (MOBILE)
   ----------------------------- */
function HubList({ hubs, setHubs }) {
  return (
    <div className="hub-list">
      <h2>Community Hubs</h2>
      <ul>
        {hubs.map((hub) => (
          <li key={hub.id}>
            <Link to={`/community/${hub.id}`} className="hub-item">
              <div className="hub-name">{hub.name}</div>
              <div className="hub-description">{hub.description}</div>
            </Link>
            <div className="hub-actions">
              <button
                className={`join-btn ${hub.joined ? "joined" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setHubs((prev) =>
                    prev.map((h) =>
                      h.id === hub.id ? { ...h, joined: !h.joined } : h
                    )
                  );
                }}
              >
                {hub.joined ? "Joined" : "Join"}
              </button>
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (window.confirm("Are you sure you want to delete this hub?")) {
                    const updated = hubs.filter((h) => h.id !== hub.id);
                    setHubs(updated);
                  }
                }}
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

/* -----------------------------
   HUB DETAILS (Mobile + Desktop)
   ----------------------------- */
function HubDetails({ hubs, setHubs, hub }) {
  const { hubId } = useParams();
  const navigate = useNavigate();
  const selectedHub = hub || hubs.find((h) => h.id === parseInt(hubId));

  const [newUpdate, setNewUpdate] = useState("");
  const [isEditingUpdate, setIsEditingUpdate] = useState(null);
  const [editedContent, setEditedContent] = useState("");

  if (!selectedHub) return <p>Hub not found.</p>;

  const handlePostUpdate = () => {
    if (!newUpdate.trim()) return;
    const newUpdateObj = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      content: newUpdate,
    };
    setHubs((prev) =>
      prev.map((h) =>
        h.id === selectedHub.id
          ? { ...h, updates: [...h.updates, newUpdateObj] }
          : h
      )
    );
    setNewUpdate("");
  };

  const handleDeleteUpdate = (updateId) => {
    setHubs((prev) =>
      prev.map((h) =>
        h.id === selectedHub.id
          ? { ...h, updates: h.updates.filter((u) => u.id !== updateId) }
          : h
      )
    );
  };

  const handleEditUpdate = (updateId, currentContent) => {
    setIsEditingUpdate(updateId);
    setEditedContent(currentContent);
  };

  const handleSaveEdit = (updateId) => {
    setHubs((prev) =>
      prev.map((h) =>
        h.id === selectedHub.id
          ? {
              ...h,
              updates: h.updates.map((u) =>
                u.id === updateId ? { ...u, content: editedContent } : u
              ),
            }
          : h
      )
    );
    setIsEditingUpdate(null);
    setEditedContent("");
  };

  return (
    <div className="hub-content">
      {/* Show back button on mobile only */}
      <button className="back-btn" onClick={() => navigate(-1)}>
        <FaArrowLeft /> Back
      </button>

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
              {isEditingUpdate === update.id ? (
                <>
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                  />
                  <button onClick={() => handleSaveEdit(update.id)}>Save</button>
                </>
              ) : (
                <>
                  <p>{update.content}</p>
                  <div className="update-actions">
                    <button onClick={() => handleEditUpdate(update.id, update.content)}>
                      Edit
                    </button>
                    <button onClick={() => handleDeleteUpdate(update.id)}>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* Update form at bottom */}
      <div className="update-form">
        <textarea
          placeholder="Share an update..."
          value={newUpdate}
          onChange={(e) => setNewUpdate(e.target.value)}
        />
        <div className="update-form-actions">
          <button onClick={handlePostUpdate}>Post Update</button>
        </div>
      </div>
    </div>
  );
}

/* -----------------------------
   CREATE HUB
   ----------------------------- */
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
    // Navigate to newly created hub
    navigate(`/community/${newHub.id}`);
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

// Floating Pencil for mobile
function FloatingPencil() {
  return (
    <></> // For desktop, we use sidebar-footer. For mobile, we show a floating pencil
  );
}

export default Community;
