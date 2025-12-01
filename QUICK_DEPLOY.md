# Quick Deploy to Vercel

## Frontend Only (Quick Start)

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy Frontend**:
   ```bash
   cd togetherstream/frontend
   vercel
   ```

3. **Follow prompts** - Vercel will guide you through setup

4. **After deployment**, you'll get a URL like: `https://togetherstream-frontend.vercel.app`

## Important: Backend Required

⚠️ **The frontend needs a backend server running!**

The backend (Socket.io server) cannot run on Vercel. You need to deploy it separately:

### Recommended: Railway (Easiest)

1. Go to [railway.app](https://railway.app)
2. Sign up/login
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Set root directory to `backend`
6. Railway auto-detects Node.js and deploys
7. Get your backend URL from Railway dashboard
8. Update frontend environment variables in Vercel:
   - `VITE_API_URL` = Your Railway backend URL
   - `VITE_SOCKET_URL` = Your Railway backend URL
9. Redeploy frontend

### Alternative: Render

1. Go to [render.com](https://render.com)
2. Create new "Web Service"
3. Connect GitHub repo
4. Set:
   - Root Directory: `backend`
   - Build: `npm install`
   - Start: `node server.js`
5. Add environment variable: `CORS_ORIGIN` = Your Vercel frontend URL
6. Deploy

## Environment Variables Checklist

### Frontend (Vercel):
- ✅ `VITE_API_URL` = Backend URL
- ✅ `VITE_SOCKET_URL` = Backend URL

### Backend (Railway/Render):
- ✅ `CORS_ORIGIN` = Frontend Vercel URL
- ✅ `PORT` = 5000 (or auto-assigned)
- ✅ `NODE_ENV` = production

## Test After Deployment

1. Open frontend URL
2. Create a room
3. Open in incognito window
4. Join with room code
5. Test video sync!

