import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Community from "./pages/Community";
import Report from "./pages/Report";
import NotFound from "./pages/NotFound";
import "./App.css";

function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Router>
      <header className="app-header">
        {/* Navigation Links */}
        <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
          <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/community" onClick={() => setMenuOpen(false)}>Community</Link>
          <Link to="/report" onClick={() => setMenuOpen(false)}>Report</Link>
        </nav>
        {/* Hamburger Icon placed on the right */}
        <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </header>

      <div className="app-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/community/*" element={<Community />} />

          <Route path="/report" element={<Report />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
