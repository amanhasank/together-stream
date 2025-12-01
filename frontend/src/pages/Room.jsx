import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import VideoPlayer from '../components/VideoPlayer';
import Avatar from '../components/Avatar';
import ChatPanel from '../components/ChatPanel';
import VoiceChat from '../components/VoiceChat';
import { getSocketUrl, getApiUrl } from '../config';
import './Room.css';

const Room = ({ user }) => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoId, setVideoId] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [partner, setPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [controller, setController] = useState(null);
  const [isController, setIsController] = useState(false);
  const playerRef = useRef(null);
  const isSyncingRef = useRef(false); // Track if we're currently syncing (to allow programmatic changes)
  const syncIntervalRef = useRef(null);
  const messageIdsRef = useRef(new Set()); // Track message IDs to prevent duplicates

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    if (!roomId) {
      console.error('No roomId provided');
      navigate('/');
      return;
    }

    // Normalize roomId (uppercase, trim)
    const normalizedRoomId = roomId.trim().toUpperCase();
    console.log(`Joining room: ${normalizedRoomId}`);

    // Connect to socket
    const newSocket = io(getSocketUrl(), {
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('Connected to server, joining room:', normalizedRoomId);
      setLoading(false);
      newSocket.emit('join-room', {
        roomId: normalizedRoomId,
        userId: user.id,
        username: user.username
      });
    });

    newSocket.on('error', ({ message }) => {
      console.error('Socket error:', message);
      setError(message);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    });

    newSocket.on('room-state', (roomData) => {
      console.log('Received room state:', roomData);
      setRoom(roomData);
      if (roomData.videoUrl) {
        setVideoUrl(roomData.videoUrl);
        extractVideoId(roomData.videoUrl);
      }
      setIsPlaying(roomData.playbackState?.playing || false);
      setCurrentTime(roomData.playbackState?.currentTime || 0);
      
      // Set partner info
      if (roomData.host && roomData.host.userId !== user.id) {
        setPartner(roomData.host);
      } else if (roomData.partner && roomData.partner.userId !== user.id) {
        setPartner(roomData.partner);
      }
      
      // Set controller info
      if (roomData.controller) {
        setController(roomData.controller);
        setIsController(roomData.controller.userId === user.id);
      }
    });

    newSocket.on('room-updated', (roomData) => {
      setRoom(roomData);
      // Update partner info
      if (roomData.host && roomData.host.userId !== user.id) {
        setPartner(roomData.host);
      } else if (roomData.partner && roomData.partner.userId !== user.id) {
        setPartner(roomData.partner);
      } else if (!roomData.partner && roomData.host?.userId === user.id) {
        setPartner(null);
      }
      
      // Update controller info
      if (roomData.controller) {
        const newIsController = roomData.controller.userId === user.id;
        setController(roomData.controller);
        setIsController(newIsController);
        
        // Setup sync interval based on controller status
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
        
        if (newIsController && playerRef.current) {
          syncIntervalRef.current = setInterval(() => {
            if (playerRef.current && socket) {
              const time = playerRef.current.getCurrentTime();
              const playing = playerRef.current.getPlayerState() === window.YT.PlayerState.PLAYING;
              socket.emit('sync-update', { 
                roomId, 
                currentTime: time, 
                isPlaying: playing 
              });
              setCurrentTime(time);
              setIsPlaying(playing);
            }
          }, 1000);
        } else if (!newIsController) {
          syncIntervalRef.current = setInterval(() => {
            if (playerRef.current && isPlaying && currentTime > 0) {
              const currentPlayerTime = playerRef.current.getCurrentTime();
              const timeDiff = Math.abs(currentPlayerTime - currentTime);
              if (timeDiff > 0.3) {
                playerRef.current.seekTo(currentTime, true);
              }
            }
          }, 2000);
        }
      }
    });

    newSocket.on('control-changed', ({ controller, message }) => {
      setController(controller);
      const newIsController = controller.userId === user.id;
      setIsController(newIsController);
      
      // Add control change message (deduplicated)
      const messageId = `control-${Date.now()}-${controller.userId}`;
      if (!messageIdsRef.current.has(messageId)) {
        messageIdsRef.current.add(messageId);
        setMessages(prev => [...prev, {
          id: messageId,
          type: 'system',
          message: message,
          timestamp: new Date().toISOString()
        }]);
      }
      
      // Restart sync interval when control changes
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      
      if (newIsController) {
        // Controller sends sync updates
        syncIntervalRef.current = setInterval(() => {
          if (playerRef.current && socket) {
            const time = playerRef.current.getCurrentTime();
            const playing = playerRef.current.getPlayerState() === window.YT.PlayerState.PLAYING;
            socket.emit('sync-update', { 
              roomId, 
              currentTime: time, 
              isPlaying: playing 
            });
            setCurrentTime(time);
            setIsPlaying(playing);
          }
        }, 1000);
      } else {
        // Non-controller syncs periodically
        syncIntervalRef.current = setInterval(() => {
          if (playerRef.current && isPlaying && currentTime > 0) {
            const currentPlayerTime = playerRef.current.getCurrentTime();
            const timeDiff = Math.abs(currentPlayerTime - currentTime);
            if (timeDiff > 0.3) {
              playerRef.current.seekTo(currentTime, true);
            }
          }
        }, 2000);
      }
    });

    newSocket.on('partner-joined', (partnerData) => {
      console.log('Partner joined:', partnerData);
      setPartner(partnerData);
    });

    // Receive chat history (only once when joining)
    newSocket.on('chat-history', (messageHistory) => {
      const newMessages = messageHistory.filter(msg => {
        const msgId = msg.id || `${msg.timestamp}-${msg.userId || 'system'}-${msg.message}`;
        if (!messageIdsRef.current.has(msgId)) {
          messageIdsRef.current.add(msgId);
          return true;
        }
        return false;
      });
      setMessages(prev => [...newMessages, ...prev]);
    });

    newSocket.on('user-joined', ({ username, timestamp, userId }) => {
      // Only add message if it's not from current user and not duplicate
      if (userId && userId === user.id) return;
      
      const messageId = `join-${timestamp || Date.now()}-${userId || username}`;
      if (!messageIdsRef.current.has(messageId)) {
        messageIdsRef.current.add(messageId);
        setMessages(prev => [...prev, {
          id: messageId,
          type: 'system',
          message: `${username} joined the room`,
          timestamp: new Date(timestamp || Date.now()).toISOString()
        }]);
      }
    });

    newSocket.on('user-left', ({ userId, username, messageId, timestamp }) => {
      const msgId = messageId || `leave-${timestamp || Date.now()}-${userId}`;
      if (!messageIdsRef.current.has(msgId)) {
        messageIdsRef.current.add(msgId);
        setMessages(prev => [...prev, {
          id: msgId,
          type: 'system',
          message: username ? `${username} left the room` : 'Partner left the room',
          timestamp: new Date(timestamp || Date.now()).toISOString()
        }]);
      }
      if (partner && partner.userId === userId) {
        setPartner(null);
      }
    });

    newSocket.on('play', ({ currentTime, timestamp }) => {
      console.log('📺 Received play event - mirroring on viewer:', { currentTime, isController });
      if (playerRef.current) {
        // Mark that we're syncing (allow programmatic changes)
        isSyncingRef.current = true;
        
        // Sync time first (important for perfect sync)
        if (currentTime !== undefined && currentTime !== null) {
          const currentPlayerTime = playerRef.current.getCurrentTime();
          const timeDiff = Math.abs(currentPlayerTime - currentTime);
          
          // Sync if difference is more than 0.1 seconds
          if (timeDiff > 0.1) {
            playerRef.current.seekTo(currentTime, true);
          }
        }
        
        // Mirror play action immediately (only for viewer, controller already playing)
        if (!isController) {
          // Use requestAnimationFrame for immediate execution
          requestAnimationFrame(() => {
            if (playerRef.current) {
              const playerState = playerRef.current.getPlayerState();
              if (playerState !== window.YT.PlayerState.PLAYING) {
                playerRef.current.playVideo();
                console.log('✅ Viewer: Video playing now');
              }
            }
            // Reset sync flag after a short delay
            setTimeout(() => {
              isSyncingRef.current = false;
            }, 500);
          });
        } else {
          isSyncingRef.current = false;
        }
      }
      setIsPlaying(true);
      if (currentTime !== undefined && currentTime !== null) {
        setCurrentTime(currentTime);
      }
    });

    newSocket.on('pause', ({ currentTime, timestamp }) => {
      console.log('⏸️ Received pause event - mirroring on viewer:', { currentTime, isController, timestamp });
      if (playerRef.current) {
        // Mark that we're syncing (allow programmatic changes)
        isSyncingRef.current = true;
        
        // Sync time first (important for perfect sync)
        if (currentTime !== undefined && currentTime !== null) {
          const currentPlayerTime = playerRef.current.getCurrentTime();
          const timeDiff = Math.abs(currentPlayerTime - currentTime);
          
          // Sync if difference is more than 0.1 seconds
          if (timeDiff > 0.1) {
            playerRef.current.seekTo(currentTime, true);
          }
        }
        
        // Mirror pause action immediately (only for viewer, controller already paused)
        if (!isController) {
          // Force pause immediately - multiple attempts to ensure it works
          const pauseVideo = () => {
            try {
              if (playerRef.current) {
                const playerState = playerRef.current.getPlayerState();
                console.log('Viewer player state before pause:', playerState);
                
                // Always call pauseVideo() - it's safe to call even if already paused
                playerRef.current.pauseVideo();
                console.log('✅ Viewer: pauseVideo() called');
                
                // Verify it worked
                setTimeout(() => {
                  if (playerRef.current) {
                    const newState = playerRef.current.getPlayerState();
                    console.log('Viewer player state after pause:', newState);
                    if (newState === window.YT.PlayerState.PLAYING) {
                      console.log('⚠️ Video still playing, forcing pause again');
                      playerRef.current.pauseVideo();
                    } else {
                      console.log('✅ Viewer: Video successfully paused');
                    }
                  }
                  // Reset sync flag
                  isSyncingRef.current = false;
                }, 200);
              }
            } catch (error) {
              console.error('Error pausing video:', error);
              isSyncingRef.current = false;
            }
          };
          
          // Call immediately
          pauseVideo();
        } else {
          // Controller also updates state when receiving pause event (for consistency)
          console.log('Controller received pause event (state sync)');
          isSyncingRef.current = false;
        }
      }
      setIsPlaying(false);
      if (currentTime !== undefined && currentTime !== null) {
        setCurrentTime(currentTime);
      }
    });

    newSocket.on('seek', ({ currentTime, timestamp }) => {
      if (playerRef.current && !isController) {
        isSyncingRef.current = true;
        playerRef.current.seekTo(currentTime, true);
        setTimeout(() => {
          isSyncingRef.current = false;
        }, 300);
      }
      setCurrentTime(currentTime);
    });

    newSocket.on('skip', ({ currentTime, timestamp }) => {
      if (playerRef.current && !isController) {
        playerRef.current.seekTo(currentTime, true);
      }
      setCurrentTime(currentTime);
    });

    // Perfect sync updates from controller
    newSocket.on('sync-update', ({ currentTime, isPlaying, timestamp }) => {
      if (playerRef.current && !isController) {
        isSyncingRef.current = true;
        const now = Date.now();
        const elapsed = (now - timestamp) / 1000; // seconds elapsed
        const targetTime = currentTime + (isPlaying ? elapsed : 0);
        
        const currentPlayerTime = playerRef.current.getCurrentTime();
        const timeDiff = Math.abs(currentPlayerTime - targetTime);
        
        // Sync if difference is more than 0.2 seconds for perfect sync
        if (timeDiff > 0.2) {
          playerRef.current.seekTo(targetTime, true);
        }
        
        const playerState = playerRef.current.getPlayerState();
        if (isPlaying && playerState !== window.YT.PlayerState.PLAYING) {
          playerRef.current.playVideo();
        } else if (!isPlaying && playerState === window.YT.PlayerState.PLAYING) {
          playerRef.current.pauseVideo();
        }
        setTimeout(() => {
          isSyncingRef.current = false;
        }, 300);
      }
      setIsPlaying(isPlaying);
      setCurrentTime(currentTime);
    });


    newSocket.on('video-change', ({ videoUrl }) => {
      console.log('Video changed:', videoUrl);
      setVideoUrl(videoUrl);
      extractVideoId(videoUrl);
    });

    newSocket.on('chat-message', (messageData) => {
      console.log('Chat message received:', messageData);
      // Check for duplicates using message ID
      const msgId = messageData.id || `${messageData.timestamp}-${messageData.userId || 'user'}-${messageData.message}`;
      if (!messageIdsRef.current.has(msgId)) {
        messageIdsRef.current.add(msgId);
        setMessages(prev => [...prev, messageData]);
      }
    });

    newSocket.on('avatar-action', ({ action, data, userId }) => {
      // Handle avatar actions from partner
      console.log('Avatar action:', action, data, userId);
    });

    setSocket(newSocket);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      // Clear message IDs when leaving room
      messageIdsRef.current.clear();
      newSocket.close();
    };
  }, [roomId, user?.id, user?.username, navigate]);

  const extractVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    const id = (match && match[2].length === 11) ? match[2] : null;
    setVideoId(id || '');
  };

  const handleVideoChange = (url) => {
    setVideoUrl(url);
    extractVideoId(url);
    if (socket) {
      socket.emit('video-change', { roomId, videoUrl: url });
    }
  };

  const handleTakeControl = () => {
    if (socket) {
      socket.emit('take-control', { roomId });
    }
  };

  const handlePlay = () => {
    if (!isController) {
      alert('Only the controller can play/pause the video. Click "Take Control" to gain control.');
      return;
    }
    if (playerRef.current && socket) {
      const time = playerRef.current.getCurrentTime();
      console.log('Controller playing at time:', time);
      setIsPlaying(true);
      // Emit immediately to mirror on viewer
      socket.emit('play', { roomId, currentTime: time });
      // Also play locally
      playerRef.current.playVideo();
    }
  };

  const handlePause = () => {
    if (!isController) {
      alert('Only the controller can play/pause the video. Click "Take Control" to gain control.');
      return;
    }
    if (playerRef.current && socket) {
      const time = playerRef.current.getCurrentTime();
      console.log('Controller pausing at time:', time);
      setIsPlaying(false);
      // Emit immediately to mirror on viewer
      socket.emit('pause', { roomId, currentTime: time });
      // Also pause locally
      playerRef.current.pauseVideo();
    }
  };

  const handleSeek = (time) => {
    if (!isController) {
      return; // Silently ignore if not controller
    }
    if (socket && playerRef.current) {
      playerRef.current.seekTo(time, true);
      socket.emit('seek', { roomId, currentTime: time });
      setCurrentTime(time);
    }
  };

  const handleSkip = (seconds) => {
    if (!isController) {
      return;
    }
    if (socket && playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      const newTime = Math.max(0, currentTime + seconds);
      playerRef.current.seekTo(newTime, true);
      socket.emit('skip', { roomId, seconds });
      setCurrentTime(newTime);
    }
  };

  const handleAvatarAction = (action, data) => {
    if (socket) {
      socket.emit('avatar-action', { roomId, action, data });
    }
  };

  const handleSendMessage = (message) => {
    if (socket && message.trim()) {
      socket.emit('chat-message', {
        roomId,
        message: message.trim(),
        username: user.username
      });
    }
  };

  const onPlayerReady = (event) => {
    playerRef.current = event.target;
    
    // For non-controllers: Disable all player controls and interactions
    if (!isController && playerRef.current) {
      try {
        // Disable player controls programmatically
        // Note: YouTube API doesn't have a direct method, but we control via opts
        console.log('🔒 Player ready - View-only mode: All controls disabled');
      } catch (error) {
        console.error('Error disabling player controls:', error);
      }
    }
    
    // Sync to current room state
    if (room?.playbackState) {
      const playbackState = room.playbackState;
      if (playbackState.currentTime > 0) {
        event.target.seekTo(playbackState.currentTime, true);
      }
      if (playbackState.playing && isController) {
        // Only auto-play if controller
        event.target.playVideo();
      } else {
        event.target.pauseVideo();
      }
    }
  };

  const onPlayerStateChange = (event) => {
    // CRITICAL: Only allow state changes if user is controller
    // BUT: Allow programmatic changes from socket sync (isSyncingRef)
    if (!isController) {
      // If we're currently syncing (from socket events), allow the change
      if (isSyncingRef.current) {
        console.log('✅ Allowing programmatic state change during sync');
        return; // Allow the change, but don't emit events
      }
      
      // If NOT syncing, this is a manual user interaction - BLOCK IT
      console.warn('⚠️ Non-controller attempted manual video state change - blocking');
      // Force sync back to current room state
      if (room?.playbackState && playerRef.current) {
        const playbackState = room.playbackState;
        if (playbackState.currentTime > 0) {
          playerRef.current.seekTo(playbackState.currentTime, true);
        }
        if (playbackState.playing) {
          const playerState = playerRef.current.getPlayerState();
          if (playerState !== window.YT.PlayerState.PLAYING) {
            playerRef.current.playVideo();
          }
        } else {
          const playerState = playerRef.current.getPlayerState();
          if (playerState === window.YT.PlayerState.PLAYING) {
            playerRef.current.pauseVideo();
          }
        }
      }
      return; // Exit early - don't process state change
    }
    
    // Only sync if controller (non-controller is controlled by socket events)
    if (isController && playerRef.current && socket) {
      const currentTime = playerRef.current.getCurrentTime();
      
      if (event.data === window.YT.PlayerState.PLAYING) {
        console.log('🎮 Controller: Video playing via YouTube controls - broadcasting to viewers');
        setIsPlaying(true);
        // Emit play event immediately when controller plays via YouTube controls
        socket.emit('play', { roomId, currentTime });
      } else if (event.data === window.YT.PlayerState.PAUSED) {
        console.log('🎮 Controller: Video paused via YouTube controls - broadcasting to viewers');
        setIsPlaying(false);
        // Emit pause event immediately when controller pauses via YouTube controls
        socket.emit('pause', { roomId, currentTime });
      } else if (event.data === window.YT.PlayerState.BUFFERING) {
        // Don't sync buffering state
      }
    }
    // Note: Removed the else block that was blocking legitimate sync operations
  };

  if (loading) {
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
          <div>Connecting to room {roomId}...</div>
          {error && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: 'rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: 'white'
            }}>
              {error}
            </div>
          )}
        </div>
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
        fontFamily: 'sans-serif',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          padding: '2rem',
          background: 'rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <h2>Error</h2>
          <p>{error}</p>
          <button
            onClick={() => navigate('/')}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              background: '#FF6B9D',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      overflow: 'hidden'
    }}>
      <div style={{
        padding: '1rem 2rem',
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1rem',
              padding: '0.5rem'
            }}
          >
            ← Back
          </button>
          <div>
            <h2 style={{ color: 'white', fontWeight: '600', margin: 0 }}>
              Room: {roomId}
            </h2>
            {partner && (
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
                Watching with {partner.username}
              </p>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {!partner && (
            <div style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.875rem',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '0.5rem 1rem',
              borderRadius: '8px'
            }}>
              Waiting for partner to join...
            </div>
          )}
          {controller && (
            <div style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.875rem',
              background: isController ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 255, 255, 0.1)',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {isController ? '🎮 You have control' : `🎮 ${controller.username} has control`}
            </div>
          )}
          {!isController && (
            <button
              onClick={handleTakeControl}
              style={{
                background: '#FF6B9D',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#FF5A8A'}
              onMouseOut={(e) => e.target.style.background = '#FF6B9D'}
            >
              Take Control
            </button>
          )}
        </div>
      </div>

      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 350px',
        gap: '1rem',
        padding: '1rem',
        overflow: 'hidden',
        minHeight: 0,
        height: 'calc(100vh - 100px)', // Fixed height minus header
        maxHeight: 'calc(100vh - 100px)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          position: 'relative',
          minHeight: 0,
          height: '100%',
          overflow: 'hidden' // Prevent video section from scrolling
        }}>
          <div style={{
            width: '100%',
            height: '100%',
            flexShrink: 0, // Video never shrinks
            position: 'relative',
            minHeight: 0
          }}>
            <VideoPlayer
              videoUrl={videoUrl}
              videoId={videoId}
              onVideoChange={handleVideoChange}
              onPlay={isController ? handlePlay : undefined}
              onPause={isController ? handlePause : undefined}
              onSeek={handleSeek}
              onPlayerReady={onPlayerReady}
              onPlayerStateChange={onPlayerStateChange}
              isPlaying={isPlaying}
              isController={isController}
              onSkip={handleSkip}
            />
          </div>

          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            right: '20px',
            display: 'flex',
            gap: '1rem',
            pointerEvents: 'none',
            zIndex: 10
          }}>
            <div style={{ pointerEvents: 'all' }}>
              <Avatar
                user={user}
                isLocal={true}
                onAction={handleAvatarAction}
              />
            </div>
            {partner && (
              <div style={{ pointerEvents: 'all' }}>
                <Avatar
                  user={partner}
                  isLocal={false}
                  onAction={() => {}}
                />
              </div>
            )}
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          overflow: 'hidden',
          minHeight: 0,
          maxHeight: '100%',
          height: '100%'
        }}>
          <div style={{
            flex: '1 1 auto',
            minHeight: 0,
            maxHeight: partner ? '65%' : '100%', // Chat takes 65% if voice chat exists
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <ChatPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              currentUser={user}
            />
          </div>
          {partner && (
            <div style={{
              flexShrink: 0,
              maxHeight: '35%', // Voice chat takes remaining 35%
              minHeight: 0,
              overflow: 'hidden'
            }}>
              <VoiceChat
                socket={socket}
                roomId={roomId}
                localUser={user}
                remoteUser={partner}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Room;
