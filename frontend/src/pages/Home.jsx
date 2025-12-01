import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { getApiUrl } from '../config';

const Home = ({ user, onLogin, onLogout }) => {
  const [username, setUsername] = useState('');
  const [roomId, setRoomId] = useState('');
  const [showLogin, setShowLogin] = useState(!user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (username.trim()) {
      try {
        const userData = {
          id: uuidv4(),
          username: username.trim(),
          avatar: 'bear'
        };
        onLogin(userData);
        setShowLogin(false);
      } catch (err) {
        setError('Failed to login. Please try again.');
        console.error('Login error:', err);
      }
    }
  };

  const handleCreateRoom = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${getApiUrl()}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to create room');
      }
      
      const data = await response.json();
      navigate(`/room/${data.roomId}`);
    } catch (error) {
      console.error('Error creating room:', error);
      setError('Failed to create room. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomId.trim()) {
      setError('Please enter a room code');
      return;
    }
    
    const cleanRoomId = roomId.trim().toUpperCase();
    setLoading(true);
    setError('');
    
    // Verify room exists before navigating
    try {
      const response = await fetch(`${getApiUrl()}/api/rooms/${cleanRoomId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Room not found. Please check the room code.');
        } else {
          setError('Failed to verify room. Make sure the backend is running.');
        }
        setLoading(false);
        return;
      }
      navigate(`/room/${cleanRoomId}`);
    } catch (error) {
      console.error('Error verifying room:', error);
      setError('Failed to verify room. Make sure the backend is running.');
      setLoading(false);
    }
  };

  if (showLogin) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '1rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
        }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold', 
            color: 'white', 
            marginBottom: '0.5rem', 
            textAlign: 'center' 
          }}>
            TogetherStream
          </h1>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.8)', 
            textAlign: 'center', 
            marginBottom: '2rem' 
          }}>
            Watch movies together, even when apart
          </p>
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.2)',
              color: 'white',
              padding: '0.75rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                fontSize: '1rem'
              }}
              required
            />
            <button
              type="submit"
              style={{
                width: '100%',
                background: '#FF6B9D',
                color: 'white',
                fontWeight: '600',
                padding: '0.75rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#FF5A8A'}
              onMouseOut={(e) => e.target.style.background = '#FF6B9D'}
            >
              Get Started
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: '1rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1.5rem' 
        }}>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'white' }}>
            TogetherStream
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.875rem' }}>
              Hi, {user?.username}!
            </span>
            <button
              onClick={onLogout}
              style={{
                color: 'rgba(255, 255, 255, 0.6)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                textDecoration: 'underline'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.2)',
            color: 'white',
            padding: '0.75rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button
            onClick={handleCreateRoom}
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#999' : '#FF6B9D',
              color: 'white',
              fontWeight: '600',
              padding: '1rem',
              borderRadius: '8px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => !loading && (e.target.style.background = '#FF5A8A')}
            onMouseOut={(e) => !loading && (e.target.style.background = '#FF6B9D')}
          >
            {loading ? 'Creating...' : 'Create New Room'}
          </button>

          <div style={{ 
            position: 'relative', 
            margin: '1rem 0' 
          }}>
            <div style={{ 
              position: 'absolute', 
              inset: 0, 
              display: 'flex', 
              alignItems: 'center' 
            }}>
              <div style={{ 
                width: '100%', 
                borderTop: '1px solid rgba(255, 255, 255, 0.2)' 
              }}></div>
            </div>
            <div style={{ 
              position: 'relative', 
              display: 'flex', 
              justifyContent: 'center' 
            }}>
              <span style={{ 
                padding: '0 0.5rem', 
                background: 'transparent', 
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.875rem'
              }}>
                or
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input
              type="text"
              placeholder="Enter room code"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                fontSize: '1rem'
              }}
            />
            <button
              onClick={handleJoinRoom}
              style={{
                width: '100%',
                background: '#C77DFF',
                color: 'white',
                fontWeight: '600',
                padding: '0.75rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#B66DFF'}
              onMouseOut={(e) => e.target.style.background = '#C77DFF'}
            >
              Join Room
            </button>
          </div>
        </div>

        <div style={{ 
          marginTop: '2rem', 
          textAlign: 'center', 
          color: 'rgba(255, 255, 255, 0.6)', 
          fontSize: '0.875rem' 
        }}>
          <p>Share the room code with your partner to watch together!</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
