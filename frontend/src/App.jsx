// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';

function App() {
  return (
    <Router>
      <div>
        {/* Navigation Bar */}
        <nav style={{ padding: '15px', backgroundColor: '#333', color: 'white', display: 'flex', gap: '20px' }}>
          <h1 style={{ margin: 0, fontSize: '20px' }}>🛒 Ransara Supermarket</h1>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Home</Link>
            <Link to="/cart" style={{ color: 'white', textDecoration: 'none' }}>My Cart</Link>
            <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>Login</Link>
          </div>
        </nav>

        {/* Page Content */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cart" element={<div style={{padding: '20px'}}><h2>Your Cart</h2><p>Cart component coming soon...</p></div>} />
          <Route path="/login" element={<div style={{padding: '20px'}}><h2>Login</h2><p>User Management coming soon...</p></div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;