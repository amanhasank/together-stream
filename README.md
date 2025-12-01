# TogetherStream - Long-Distance Movie Watching Platform

A web application for long-distance couples to watch movies together in sync with real-time voice/video chat and interactive avatars.

## Project Structure

```
togetherstream/
├── frontend/          # React + TypeScript frontend
├── backend/          # Node.js + Express + Socket.io backend
└── README.md         # This file
```

## Quick Start

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend runs on: http://localhost:5000

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

Frontend runs on: http://localhost:3000

## Features

- ✅ Synchronized video playback (YouTube)
- ✅ Real-time voice/video chat (WebRTC)
- ✅ Interactive avatars with emotions and gestures
- ✅ Shared playback controls
- ✅ Room-based sessions
- ✅ Real-time chat with emoji reactions

## Tech Stack

**Frontend:**
- React 18
- TypeScript
- Socket.io-client
- WebRTC (simple-peer)
- Tailwind CSS

**Backend:**
- Node.js
- Express
- Socket.io
- WebRTC signaling

## Development

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm start`
3. Open browser: http://localhost:3000

## Usage

1. Sign up / Login
2. Create a room or join with room code
3. Invite your partner
4. Select a YouTube video
5. Watch together with synchronized playback!

# together-stream
