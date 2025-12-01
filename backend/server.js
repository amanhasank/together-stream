import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const httpServer = createServer(app);

// CORS configuration
const CORS_ORIGIN = process.env.CORS_ORIGIN || 
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

console.log('🌐 CORS Origin:', CORS_ORIGIN);

const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());

// In-memory storage (replace with database in production)
const rooms = new Map();
const users = new Map();

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'TogetherStream API Server',
    status: 'running',
    endpoints: {
      health: 'GET /health',
      createRoom: 'POST /api/rooms',
      getRoom: 'GET /api/rooms/:roomId'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Create room
app.post('/api/rooms', (req, res) => {
  const roomId = uuidv4().substring(0, 8).toUpperCase();
  const room = {
    id: roomId,
    host: null,
    partner: null,
    controller: null, // User who has control
    videoUrl: null,
    playbackState: {
      playing: false,
      currentTime: 0,
      playbackRate: 1,
      lastSyncTime: null
    },
    messages: [], // Store chat history
    createdAt: new Date()
  };
  rooms.set(roomId, room);
  console.log(`Room created: ${roomId}, Total rooms: ${rooms.size}`);
  res.json({ roomId, room });
});

// Get room info
app.get('/api/rooms/:roomId', (req, res) => {
  const roomId = req.params.roomId.toUpperCase();
  console.log(`Checking room: ${roomId}, Available:`, Array.from(rooms.keys()));
  const room = rooms.get(roomId);
  if (!room) {
    return res.status(404).json({ 
      error: 'Room not found',
      availableRooms: Array.from(rooms.keys())
    });
  }
  res.json(room);
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room
  socket.on('join-room', ({ roomId, userId, username }) => {
    // Normalize roomId to uppercase
    const normalizedRoomId = roomId ? roomId.trim().toUpperCase() : null;
    
    if (!normalizedRoomId) {
      socket.emit('error', { message: 'Invalid room ID' });
      return;
    }
    
    console.log(`Attempting to join room: ${normalizedRoomId}`);
    console.log(`Available rooms:`, Array.from(rooms.keys()));
    
    const room = rooms.get(normalizedRoomId);
    if (!room) {
      console.error(`Room ${normalizedRoomId} not found! Available rooms:`, Array.from(rooms.keys()));
      socket.emit('error', { message: `Room ${normalizedRoomId} not found. Please check the room code.` });
      return;
    }
    
    console.log(`Room ${normalizedRoomId} found, user ${username} joining...`);

    socket.join(normalizedRoomId);
    users.set(socket.id, { userId, username, roomId: normalizedRoomId });

    // Assign host or partner
    if (!room.host) {
      room.host = { socketId: socket.id, userId, username };
      // First user (host) gets control by default
      if (!room.controller) {
        room.controller = { socketId: socket.id, userId, username };
      }
    } else if (!room.partner && room.host.socketId !== socket.id) {
      room.partner = { socketId: socket.id, userId, username };
    }

    // Send existing chat messages to new user (only once, with unique IDs)
    if (room.messages && room.messages.length > 0) {
      // Send all existing messages in one batch to avoid duplicates
      socket.emit('chat-history', room.messages);
    }

    // Notify others in room (only if this is a new join, not a reconnect)
    const existingUser = Array.from(users.values()).find(u => u.userId === userId && u.roomId === normalizedRoomId);
    if (!existingUser || existingUser.socketId === socket.id) {
      socket.to(normalizedRoomId).emit('user-joined', { userId, username, timestamp: Date.now() });
    }
    
    // Send current room state to new user
    socket.emit('room-state', room);
    
    // Update partner info for existing users
    if (room.partner) {
      socket.to(normalizedRoomId).emit('partner-joined', room.partner);
    }
    if (room.host && room.host.socketId !== socket.id) {
      socket.to(normalizedRoomId).emit('partner-joined', room.host);
    }
    
    // Notify all users in room
    io.to(normalizedRoomId).emit('room-updated', room);
  });

  // Take control
  socket.on('take-control', ({ roomId }) => {
    const normalizedRoomId = roomId ? roomId.trim().toUpperCase() : null;
    const room = normalizedRoomId ? rooms.get(normalizedRoomId) : null;
    const user = users.get(socket.id);
    
    if (room && user) {
      room.controller = { socketId: socket.id, userId: user.userId, username: user.username };
      io.to(normalizedRoomId).emit('control-changed', { 
        controller: room.controller,
        message: `${user.username} took control`
      });
      io.to(normalizedRoomId).emit('room-updated', room);
    }
  });

  // Video sync events - only controller can control
  socket.on('play', ({ roomId, currentTime }) => {
    const normalizedRoomId = roomId ? roomId.trim().toUpperCase() : null;
    const room = normalizedRoomId ? rooms.get(normalizedRoomId) : null;
    const user = users.get(socket.id);
    
    if (room && user && room.controller && room.controller.userId === user.userId) {
      console.log(`Controller ${user.username} playing at ${currentTime}`);
      room.playbackState.playing = true;
      room.playbackState.currentTime = currentTime || 0;
      room.playbackState.lastSyncTime = Date.now();
      // Broadcast immediately to all viewers
      socket.to(normalizedRoomId).emit('play', { 
        currentTime: currentTime || 0, 
        timestamp: Date.now() 
      });
    }
  });

  socket.on('pause', ({ roomId, currentTime }) => {
    const normalizedRoomId = roomId ? roomId.trim().toUpperCase() : null;
    const room = normalizedRoomId ? rooms.get(normalizedRoomId) : null;
    const user = users.get(socket.id);
    
    if (room && user && room.controller && room.controller.userId === user.userId) {
      console.log(`⏸️ Controller ${user.username} pausing at ${currentTime} - broadcasting to viewers`);
      room.playbackState.playing = false;
      room.playbackState.currentTime = currentTime || 0;
      room.playbackState.lastSyncTime = Date.now();
      // Broadcast immediately to ALL users in room (including controller for state sync)
      io.to(normalizedRoomId).emit('pause', { 
        currentTime: currentTime || 0, 
        timestamp: Date.now() 
      });
      console.log(`✅ Pause event broadcasted to room ${normalizedRoomId}`);
    } else {
      console.warn(`⚠️ Pause rejected - user ${user?.username} is not controller`);
    }
  });

  socket.on('seek', ({ roomId, currentTime }) => {
    const normalizedRoomId = roomId ? roomId.trim().toUpperCase() : null;
    const room = normalizedRoomId ? rooms.get(normalizedRoomId) : null;
    const user = users.get(socket.id);
    
    if (room && user && room.controller && room.controller.userId === user.userId) {
      room.playbackState.currentTime = currentTime;
      room.playbackState.lastSyncTime = Date.now();
      socket.to(normalizedRoomId).emit('seek', { currentTime, timestamp: Date.now() });
    }
  });

  // Skip forward/backward
  socket.on('skip', ({ roomId, seconds }) => {
    const normalizedRoomId = roomId ? roomId.trim().toUpperCase() : null;
    const room = normalizedRoomId ? rooms.get(normalizedRoomId) : null;
    const user = users.get(socket.id);
    
    if (room && user && room.controller && room.controller.userId === user.userId) {
      const newTime = Math.max(0, room.playbackState.currentTime + seconds);
      room.playbackState.currentTime = newTime;
      room.playbackState.lastSyncTime = Date.now();
      io.to(normalizedRoomId).emit('skip', { currentTime: newTime, timestamp: Date.now() });
    }
  });

  // Periodic sync from controller
  socket.on('sync-update', ({ roomId, currentTime, isPlaying }) => {
    const normalizedRoomId = roomId ? roomId.trim().toUpperCase() : null;
    const room = normalizedRoomId ? rooms.get(normalizedRoomId) : null;
    const user = users.get(socket.id);
    
    if (room && user && room.controller && room.controller.userId === user.userId) {
      room.playbackState.currentTime = currentTime;
      room.playbackState.playing = isPlaying;
      room.playbackState.lastSyncTime = Date.now();
      socket.to(normalizedRoomId).emit('sync-update', { 
        currentTime, 
        isPlaying,
        timestamp: Date.now() 
      });
    }
  });

  socket.on('video-change', ({ roomId, videoUrl }) => {
    const normalizedRoomId = roomId ? roomId.trim().toUpperCase() : null;
    const room = normalizedRoomId ? rooms.get(normalizedRoomId) : null;
    if (room) {
      room.videoUrl = videoUrl;
      io.to(normalizedRoomId).emit('video-change', { videoUrl });
    }
  });

  // WebRTC signaling
  socket.on('offer', ({ roomId, offer }) => {
    const normalizedRoomId = roomId ? roomId.trim().toUpperCase() : null;
    if (normalizedRoomId) {
      socket.to(normalizedRoomId).emit('offer', { offer, from: socket.id });
    }
  });

  socket.on('answer', ({ roomId, answer }) => {
    const normalizedRoomId = roomId ? roomId.trim().toUpperCase() : null;
    if (normalizedRoomId) {
      socket.to(normalizedRoomId).emit('answer', { answer, from: socket.id });
    }
  });

  socket.on('ice-candidate', ({ roomId, candidate }) => {
    const normalizedRoomId = roomId ? roomId.trim().toUpperCase() : null;
    if (normalizedRoomId) {
      socket.to(normalizedRoomId).emit('ice-candidate', { candidate, from: socket.id });
    }
  });

  // Avatar interactions
  socket.on('avatar-action', ({ roomId, action, data }) => {
    const normalizedRoomId = roomId ? roomId.trim().toUpperCase() : null;
    if (normalizedRoomId) {
      socket.to(normalizedRoomId).emit('avatar-action', { 
        action, 
        data, 
        from: socket.id,
        userId: users.get(socket.id)?.userId 
      });
    }
  });

  // Chat messages
  socket.on('chat-message', ({ roomId, message, username }) => {
    const normalizedRoomId = roomId ? roomId.trim().toUpperCase() : null;
    if (!normalizedRoomId) return;
    
    const messageId = `${Date.now()}-${socket.id}-${Math.random().toString(36).substr(2, 9)}`;
    const messageData = {
      id: messageId,
      message,
      username,
      timestamp: new Date().toISOString(),
      userId: users.get(socket.id)?.userId,
      type: 'user'
    };
    
    // Store message in room history
    const room = rooms.get(normalizedRoomId);
    if (room) {
      if (!room.messages) {
        room.messages = [];
      }
      // Check for duplicates before adding
      const isDuplicate = room.messages.some(msg => msg.id === messageId);
      if (!isDuplicate) {
        room.messages.push(messageData);
        // Keep only last 100 messages
        if (room.messages.length > 100) {
          room.messages = room.messages.slice(-100);
        }
      }
    }
    
    // Broadcast to all users in room
    io.to(normalizedRoomId).emit('chat-message', messageData);
  });

  // Disconnect
  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      const normalizedRoomId = user.roomId ? user.roomId.trim().toUpperCase() : null;
      const room = normalizedRoomId ? rooms.get(normalizedRoomId) : null;
      if (room) {
        if (room.host?.socketId === socket.id) {
          room.host = null;
        }
        if (room.partner?.socketId === socket.id) {
          room.partner = null;
        }
        if (normalizedRoomId) {
        const leaveMessageId = `leave-${Date.now()}-${socket.id}`;
        socket.to(normalizedRoomId).emit('user-left', { 
          userId: user.userId, 
          username: user.username,
          timestamp: Date.now(),
          messageId: leaveMessageId
        });
        io.to(normalizedRoomId).emit('room-updated', room);
        }
      }
      users.delete(socket.id);
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

// For Vercel serverless, export the handler
if (process.env.VERCEL) {
  module.exports = app;
} else {
  // For regular Node.js server (Railway, Render, Heroku)
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 CORS Origin: ${CORS_ORIGIN}`);
  });
}

