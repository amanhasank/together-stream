import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import Room from './pages/Room';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      // Check for stored user
      const storedUser = localStorage.getItem('togetherstream_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Error loading user:', err);
      setError('Failed to load user data');
    }
  }, []);

  const login = (userData) => {
    try {
      setUser(userData);
      localStorage.setItem('togetherstream_user', JSON.stringify(userData));
    } catch (err) {
      console.error('Error saving user:', err);
      setError('Failed to save user data');
    }
  };

  const logout = () => {
    try {
      setUser(null);
      localStorage.removeItem('togetherstream_user');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  // Show loading state initially
  if (!mounted) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontFamily: 'sans-serif'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontFamily: 'sans-serif'
      }}>
        <div>
          <h1>Error</h1>
          <p>{error}</p>
          <button 
            onClick={() => setError(null)}
            style={{
              padding: '0.5rem 1rem',
              background: '#FF6B9D',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App" style={{ minHeight: '100vh' }}>
        <Routes>
          <Route 
            path="/" 
            element={<Home user={user} onLogin={login} onLogout={logout} />} 
          />
          <Route 
            path="/room/:roomId" 
            element={user ? <Room user={user} /> : <Navigate to="/" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
