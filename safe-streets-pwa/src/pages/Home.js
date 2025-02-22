import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div>
      <h1>Welcome to Safe Streets</h1>
      <p>Find safer routes and community updates.</p>
      <nav>
        <Link to="/community">Community</Link> | <Link to="/report">Report an Issue</Link>
      </nav>
    </div>
  );
}

export default Home;
