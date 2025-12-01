# Troubleshooting Guide

## Blank Screen Issues

If you see a blank screen on `http://localhost:3000`:

### 1. Check Browser Console
Open Developer Tools (F12) and check for JavaScript errors in the Console tab.

### 2. Verify Both Servers Are Running

**Backend:**
```bash
curl http://localhost:5000/health
```
Should return: `{"status":"ok"}`

**Frontend:**
- Check terminal where `npm start` is running
- Should see "VITE ready" message
- Check for any error messages

### 3. Clear Browser Cache
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Or clear browser cache completely

### 4. Check Dependencies
Make sure all dependencies are installed:
```bash
cd frontend
npm install
```

### 5. Check Port Conflicts
If port 3000 or 5000 is in use:
- Kill the process using the port
- Or change ports in config files

### 6. Verify File Structure
Ensure all files exist:
```bash
ls -la frontend/src/pages/
ls -la frontend/src/components/
```

### 7. Check Network Tab
In browser DevTools → Network tab:
- Verify `main.jsx` is loading (status 200)
- Check for any failed requests
- Look for CORS errors

## Common Errors

### "Cannot GET /"
- Backend not running
- Wrong port
- Missing route handler (should be fixed now)

### "Module not found"
- Run `npm install` in both frontend and backend
- Delete `node_modules` and reinstall

### "CORS error"
- Backend CORS is configured for `http://localhost:3000`
- Make sure you're accessing frontend on that exact URL

### "Socket.io connection failed"
- Backend not running
- Wrong backend URL in frontend code
- Firewall blocking WebSocket connections

## Quick Fixes

1. **Restart both servers:**
   ```bash
   # Kill existing processes
   pkill -f "node.*server.js"
   pkill -f "vite"
   
   # Restart backend
   cd backend && npm run dev
   
   # Restart frontend (new terminal)
   cd frontend && npm start
   ```

2. **Reinstall dependencies:**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   
   cd ../backend
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check Node.js version:**
   ```bash
   node --version
   ```
   Should be 18+ for best compatibility

## Still Having Issues?

1. Check browser console for specific error messages
2. Check terminal output for both frontend and backend
3. Verify you're accessing `http://localhost:3000` (not `127.0.0.1`)
4. Try a different browser
5. Disable browser extensions that might interfere

