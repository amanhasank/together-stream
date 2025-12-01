import { useState } from 'react';
import './Avatar.css';

const Avatar = ({ user, isLocal, onAction }) => {
  const [position, setPosition] = useState({ x: isLocal ? 20 : 80, y: 80 });
  const [currentEmotion, setCurrentEmotion] = useState('idle');
  const [isDragging, setIsDragging] = useState(false);

  const emotions = ['happy', 'sad', 'excited', 'love', 'surprised'];
  const gestures = ['wave', 'thumbs-up', 'heart', 'clap', 'dance'];

  const handleEmotion = (emotion) => {
    setCurrentEmotion(emotion);
    if (onAction) {
      onAction('emotion', { emotion });
    }
    setTimeout(() => setCurrentEmotion('idle'), 2000);
  };

  const handleGesture = (gesture) => {
    setCurrentEmotion(gesture);
    if (onAction) {
      onAction('gesture', { gesture });
    }
    setTimeout(() => setCurrentEmotion('idle'), 2000);
  };

  const handleMouseDown = (e) => {
    if (!isLocal) return;
    setIsDragging(true);
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (e) => {
      setPosition({
        x: Math.max(0, Math.min(100, ((e.clientX - startX) / window.innerWidth) * 100)),
        y: Math.max(0, Math.min(100, ((e.clientY - startY) / window.innerHeight) * 100))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={`avatar-container ${isLocal ? 'local' : 'remote'}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div
        className={`avatar ${currentEmotion} ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
      >
        <div className="avatar-face">
          <div className="avatar-eyes">
            <div className="eye left"></div>
            <div className="eye right"></div>
          </div>
          <div className="avatar-mouth"></div>
        </div>
        <div className="avatar-label">{user.username}</div>
      </div>

      {isLocal && (
        <div className="avatar-controls">
          <div className="controls-section">
            <span className="control-label">Emotions</span>
            <div className="control-buttons">
              {emotions.map(emotion => (
                <button
                  key={emotion}
                  onClick={() => handleEmotion(emotion)}
                  className="control-btn"
                  title={emotion}
                >
                  {emotion === 'happy' && '😊'}
                  {emotion === 'sad' && '😢'}
                  {emotion === 'excited' && '🤩'}
                  {emotion === 'love' && '😍'}
                  {emotion === 'surprised' && '😲'}
                </button>
              ))}
            </div>
          </div>
          <div className="controls-section">
            <span className="control-label">Gestures</span>
            <div className="control-buttons">
              {gestures.map(gesture => (
                <button
                  key={gesture}
                  onClick={() => handleGesture(gesture)}
                  className="control-btn"
                  title={gesture}
                >
                  {gesture === 'wave' && '👋'}
                  {gesture === 'thumbs-up' && '👍'}
                  {gesture === 'heart' && '❤️'}
                  {gesture === 'clap' && '👏'}
                  {gesture === 'dance' && '💃'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Avatar;

