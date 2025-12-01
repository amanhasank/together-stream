import { useState, useEffect, useRef } from 'react';
import SimplePeer from 'simple-peer';
import './VoiceChat.css';

const VoiceChat = ({ socket, roomId, localUser, remoteUser }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!socket || !remoteUser) return;

    // Initialize WebRTC
    const initWebRTC = async () => {
      try {
        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: isVideoEnabled
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Create peer connection with STUN servers for better connectivity
        const peer = new SimplePeer({
          initiator: true,
          trickle: false,
          stream: stream,
          config: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' }
            ]
          }
        });

        peer.on('signal', (data) => {
          socket.emit('offer', { roomId, offer: JSON.stringify(data) });
        });

        peer.on('stream', (remoteStream) => {
          remoteStreamRef.current = remoteStream;
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
          setIsConnected(true);
        });

        peer.on('error', (err) => {
          console.error('Peer error:', err);
        });

        socket.on('offer', ({ offer, from }) => {
          if (from !== socket.id) {
            const answerPeer = new SimplePeer({
              initiator: false,
              trickle: false,
              stream: localStreamRef.current,
              config: {
                iceServers: [
                  { urls: 'stun:stun.l.google.com:19302' },
                  { urls: 'stun:stun1.l.google.com:19302' }
                ]
              }
            });

            answerPeer.on('signal', (data) => {
              socket.emit('answer', { roomId, answer: JSON.stringify(data) });
            });

            answerPeer.on('stream', (remoteStream) => {
              remoteStreamRef.current = remoteStream;
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
              }
              setIsConnected(true);
            });

            answerPeer.signal(JSON.parse(offer));
            peerRef.current = answerPeer;
          }
        });

        socket.on('answer', ({ answer, from }) => {
          if (from !== socket.id && peerRef.current) {
            peerRef.current.signal(JSON.parse(answer));
          }
        });

        socket.on('ice-candidate', ({ candidate, from }) => {
          if (from !== socket.id && peerRef.current) {
            peerRef.current.signal(JSON.parse(candidate));
          }
        });

        peerRef.current = peer;
      } catch (error) {
        console.error('Error accessing media devices:', error);
        setError('Failed to access microphone/camera. Please check permissions.');
      }
    };

    initWebRTC();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, [socket, roomId, isVideoEnabled, remoteUser]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  return (
    <div className="voice-chat-panel">
      <div className="voice-chat-header">
        <h3 style={{ color: 'white', fontWeight: '600', margin: 0 }}>Voice Chat</h3>
        {isConnected ? (
          <span style={{ fontSize: '0.75rem', color: '#4ade80' }}>● Connected</span>
        ) : (
          <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>Connecting...</span>
        )}
      </div>
      {error && (
        <div style={{
          padding: '0.5rem',
          background: 'rgba(239, 68, 68, 0.2)',
          color: 'white',
          fontSize: '0.75rem',
          borderRadius: '4px',
          margin: '0.5rem'
        }}>
          {error}
        </div>
      )}
      <div className="voice-chat-content">
        {isVideoEnabled && (
          <div className="video-preview">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="local-video"
            />
            {remoteStreamRef.current && (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="remote-video"
              />
            )}
          </div>
        )}
        <div className="voice-controls">
          <button
            onClick={toggleMute}
            className={`control-button ${isMuted ? 'muted' : ''}`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🎤'}
          </button>
          <button
            onClick={toggleVideo}
            className={`control-button ${!isVideoEnabled ? 'disabled' : ''}`}
            title={isVideoEnabled ? 'Disable Video' : 'Enable Video'}
          >
            {isVideoEnabled ? '📹' : '📷'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceChat;

