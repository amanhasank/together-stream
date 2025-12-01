import { useState } from 'react';
import YouTube from 'react-youtube';
import './VideoPlayer.css';

const VideoPlayer = ({
  videoUrl,
  videoId,
  onVideoChange,
  onPlay,
  onPause,
  onSeek,
  onPlayerReady,
  onPlayerStateChange,
  isPlaying,
  isController = false,
  onSkip
}) => {
  const [inputUrl, setInputUrl] = useState(videoUrl || '');

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      onVideoChange(inputUrl.trim());
    }
  };

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 1,
      rel: 0,
      modestbranding: 1
    }
  };

  return (
    <div className="video-player-container">
      {!videoId ? (
        <div className="video-placeholder">
          <div className="placeholder-content">
            <div style={{
              textAlign: 'center',
              padding: '3rem 2rem',
              width: '100%',
              maxWidth: '700px',
              margin: '0 auto'
            }}>
              <div style={{
                fontSize: '5rem',
                marginBottom: '1.5rem',
                animation: 'pulse 2s ease-in-out infinite',
                filter: 'drop-shadow(0 4px 20px rgba(255, 107, 157, 0.5))'
              }}>
                🎬
              </div>
              <h2 style={{
                color: 'white',
                fontSize: '2.5rem',
                fontWeight: 'bold',
                marginBottom: '0.75rem',
                textShadow: '0 2px 20px rgba(0,0,0,0.5)'
              }}>
                Ready to Watch Together?
              </h2>
              <p style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '1.1rem',
                marginBottom: '2.5rem',
                fontWeight: '300'
              }}>
                Add a YouTube video to start your synchronized viewing experience
              </p>
              <form onSubmit={handleUrlSubmit} style={{
                maxWidth: '700px',
                margin: '0 auto'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '0',
                  marginBottom: '1.5rem',
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(20px)',
                  padding: '0.5rem',
                  borderRadius: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#FF6B9D';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(255, 107, 157, 0.4)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.2)';
                }}
                >
                  <input
                    type="text"
                    placeholder="Paste YouTube URL here..."
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '1.25rem 1.5rem',
                      background: 'transparent',
                      border: 'none',
                      color: 'white',
                      fontSize: '1.1rem',
                      outline: 'none',
                      fontWeight: '400'
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!inputUrl.trim()}
                    style={{
                      padding: '1.25rem 2.5rem',
                      background: inputUrl.trim() 
                        ? 'linear-gradient(135deg, #FF6B9D 0%, #FF5A8A 100%)' 
                        : 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      cursor: inputUrl.trim() ? 'pointer' : 'not-allowed',
                      transition: 'all 0.3s ease',
                      boxShadow: inputUrl.trim() 
                        ? '0 6px 20px rgba(255, 107, 157, 0.5)' 
                        : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      whiteSpace: 'nowrap',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                    onMouseEnter={(e) => {
                      if (inputUrl.trim()) {
                        e.target.style.transform = 'scale(1.05) translateY(-2px)';
                        e.target.style.boxShadow = '0 8px 25px rgba(255, 107, 157, 0.7)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (inputUrl.trim()) {
                        e.target.style.transform = 'scale(1) translateY(0)';
                        e.target.style.boxShadow = '0 6px 20px rgba(255, 107, 157, 0.5)';
                      }
                    }}
                  >
                    <span style={{ fontSize: '1.3rem' }}>▶</span>
                    <span>Load Video</span>
                  </button>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  marginBottom: '1.5rem'
                }}>
                  <button
                    type="button"
                    onClick={() => setInputUrl('')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: '500'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <span>🗑️</span>
                    <span>Clear</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const exampleUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
                      setInputUrl(exampleUrl);
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'rgba(199, 125, 255, 0.2)',
                      border: '1px solid rgba(199, 125, 255, 0.4)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontWeight: '500'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(199, 125, 255, 0.3)';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(199, 125, 255, 0.2)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    <span>🎯</span>
                    <span>Try Example</span>
                  </button>
                </div>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  padding: '1rem 1.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '0.9rem',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    fontWeight: '400'
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>💡</span>
                    <span>Copy any YouTube video URL from your browser and paste it above</span>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className="video-wrapper" style={{ position: 'relative' }}>
          <YouTube
            videoId={videoId}
            opts={opts}
            onReady={onPlayerReady}
            onStateChange={onPlayerStateChange}
            className="youtube-player"
          />
          {!isController && (
            <div style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              zIndex: 10
            }}>
              👁️ View Only Mode
            </div>
          )}
          {isController && onSkip && (
            <div style={{
              position: 'absolute',
              bottom: '60px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '0.5rem',
              zIndex: 10
            }}>
              <button
                onClick={() => onSkip(-10)}
                style={{
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
                title="Skip back 10 seconds"
              >
                ⏪ -10s
              </button>
              <button
                onClick={() => onSkip(10)}
                style={{
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
                title="Skip forward 10 seconds"
              >
                ⏩ +10s
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;

