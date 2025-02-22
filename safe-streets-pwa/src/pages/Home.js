import React from 'react';
import { Link } from 'react-router-dom';
import './styles/Home.css'; 

function Home() {
  return (
    <div className="home-container">
      <h1>Welcome to Safe Streets</h1>
      <p>Find safer routes and community updates.</p>
      <nav>
        <Link to="/community">Community</Link> | 
        <Link to="/report">Report an Issue</Link>
      </nav>
    </div>
  );
}

export default Home;
