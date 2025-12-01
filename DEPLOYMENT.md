# Deployment Guide - TogetherStream

## Overview

TogetherStream consists of two parts:
1. **Frontend** (React + Vite) - Deploy to Vercel
2. **Backend** (Node.js + Socket.io) - Deploy to Railway/Render/Heroku

## Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

The frontend is already configured for Vercel deployment.

### Step 2: Deploy to Vercel

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Navigate to frontend directory**:
   ```bash
   cd togetherstream/frontend
   ```

4. **Deploy**:
   ```bash
   vercel
   ```
   - Follow the prompts
   - When asked "Set up and deploy?", choose **Yes**
   - When asked "Which scope?", select your account
   - When asked "Link to existing project?", choose **No**
   - When asked "What's your project's name?", enter `togetherstream-frontend`
   - When asked "In which directory is your code located?", enter `./`

5. **Set Environment Variables**:
   After deployment, go to Vercel dashboard:
   - Project Settings → Environment Variables
   - Add:
     - `VITE_API_URL` = `https://your-backend-url.railway.app` (or your backend URL)
     - `VITE_SOCKET_URL` = `https://your-backend-url.railway.app` (or your backend URL)

6. **Redeploy**:
   ```bash
   vercel --prod
   ```

### Alternative: Deploy via GitHub

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Set root directory to `frontend`
5. Add environment variables
6. Deploy

## Backend Deployment (Railway - Recommended)

**Note**: Vercel doesn't support long-running WebSocket servers well. Use Railway, Render, or Heroku for the backend.

### Option 1: Railway (Recommended)

1. **Go to [railway.app](https://railway.app)**
2. **Create new project**
3. **Deploy from GitHub** or **Deploy from local directory**
4. **Set root directory** to `backend`
5. **Add environment variables**:
   - `PORT` = `5000` (or leave empty, Railway auto-assigns)
   - `CORS_ORIGIN` = `https://your-frontend.vercel.app`
   - `NODE_ENV` = `production`

6. **Railway will automatically**:
   - Detect Node.js
   - Run `npm install`
   - Run `npm start`

7. **Get your backend URL** from Railway dashboard (e.g., `https://togetherstream-backend.railway.app`)

### Option 2: Render

1. **Go to [render.com](https://render.com)**
2. **Create new Web Service**
3. **Connect GitHub repository**
4. **Configure**:
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && node server.js`
   - Environment: `Node`
5. **Add environment variables** (same as Railway)
6. **Deploy**

### Option 3: Heroku

1. **Install Heroku CLI**:
   ```bash
   npm i -g heroku
   ```

2. **Login**:
   ```bash
   heroku login
   ```

3. **Create app**:
   ```bash
   cd togetherstream/backend
   heroku create togetherstream-backend
   ```

4. **Set environment variables**:
   ```bash
   heroku config:set CORS_ORIGIN=https://your-frontend.vercel.app
   heroku config:set NODE_ENV=production
   ```

5. **Deploy**:
   ```bash
   git push heroku main
   ```

## Update Frontend Environment Variables

After backend is deployed:

1. Go to Vercel dashboard
2. Project Settings → Environment Variables
3. Update:
   - `VITE_API_URL` = Your backend URL (e.g., `https://togetherstream-backend.railway.app`)
   - `VITE_SOCKET_URL` = Your backend URL (same as above)
4. Redeploy frontend

## Update Backend CORS

After frontend is deployed:

1. Go to your backend hosting dashboard
2. Update `CORS_ORIGIN` environment variable to your Vercel frontend URL
3. Restart backend service

## Testing Deployment

1. Visit your Vercel frontend URL
2. Create a room
3. Open in two different browsers/tabs
4. Test video sync and chat

## Troubleshooting

### CORS Errors
- Make sure `CORS_ORIGIN` in backend matches your frontend URL exactly
- Include `https://` in the URL
- No trailing slash

### Socket Connection Failed
- Check backend is running
- Verify `VITE_SOCKET_URL` is set correctly
- Check browser console for WebSocket errors
- Ensure backend supports WebSockets (Railway/Render/Heroku do)

### Environment Variables Not Working
- Vite requires `VITE_` prefix for environment variables
- Redeploy after changing environment variables
- Check Vercel dashboard → Settings → Environment Variables

## Quick Deploy Commands

### Frontend (Vercel):
```bash
cd togetherstream/frontend
vercel --prod
```

### Backend (Railway):
- Use Railway dashboard or CLI:
```bash
railway up
```

## Production URLs

After deployment, you'll have:
- **Frontend**: `https://togetherstream-frontend.vercel.app`
- **Backend**: `https://togetherstream-backend.railway.app`

Update environment variables accordingly!

