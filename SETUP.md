# TogetherStream Setup Guide

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

## Installation Steps

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

## Running the Application

### Terminal 1 - Start Backend Server

```bash
cd backend
npm run dev
```

Backend will run on: http://localhost:5000

### Terminal 2 - Start Frontend

```bash
cd frontend
npm start
```

Frontend will run on: http://localhost:3000

## Usage

1. Open http://localhost:3000 in your browser
2. Enter your name to login
3. Create a new room or join with a room code
4. Share the room code with your partner
5. Once both are in the room:
   - Paste a YouTube URL to load a video
   - Use avatars to express emotions and gestures
   - Chat in real-time
   - Voice/video chat is available when partner joins

## Features

✅ Synchronized YouTube video playback
✅ Real-time voice/video chat (WebRTC)
✅ Interactive avatars with emotions and gestures
✅ Real-time text chat with emoji reactions
✅ Shared playback controls
✅ Room-based sessions

## Troubleshooting

### Port Already in Use

If port 3000 or 5000 is already in use:
- Frontend: Change port in `frontend/vite.config.js`
- Backend: Change PORT in `backend/server.js` or set `PORT` environment variable

### WebRTC Not Working

- Make sure you're using HTTPS in production
- For local development, use `http://localhost` (not `127.0.0.1`)
- Check browser console for WebRTC errors

### Video Not Syncing

- Check browser console for Socket.io connection errors
- Ensure both users are in the same room
- Check network latency (high latency can cause sync issues)

## Development Notes

- Backend uses in-memory storage (rooms reset on server restart)
- For production, add database (PostgreSQL/MongoDB)
- Add authentication system for production
- Implement proper error handling
- Add reconnection logic for dropped connections

