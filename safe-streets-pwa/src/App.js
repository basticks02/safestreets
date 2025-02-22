import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Community from './pages/Community';
import Report from './pages/Report';
import NotFound from './pages/NotFound';
import './App.css'; 

function App() {
  return (
    <Router>
      {/* ✅ Navigation Menu */}
      <nav>
        <Link to="/">Home</Link> | 
        <Link to="/community">Community</Link> | 
        <Link to="/report">Report</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/community" element={<Community />} />
        <Route path="/report" element={<Report />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
