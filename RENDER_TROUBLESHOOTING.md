# Render Deployment Troubleshooting

## Issue: App Stuck on Input Screen / Not Progressing

If your app works locally but gets stuck on Render, follow these steps:

### Step 1: Verify Environment Variables

**Frontend (Static Site):**
1. Go to Render Dashboard → Your Frontend Service → Environment
2. Check that `VITE_API_BASE_URL` is set to your backend URL
   - Example: `https://llm-council-backend.onrender.com`
   - **NO trailing slash**
   - **Must include `https://`**
3. **IMPORTANT**: After setting/changing this variable, you MUST rebuild:
   - Go to "Manual Deploy" → "Clear build cache & deploy"

**Backend (Web Service):**
1. Go to Render Dashboard → Your Backend Service → Environment
2. Check that `FRONTEND_URL` is set to your frontend URL
   - Example: `https://llm-council-frontend.onrender.com`
   - **NO trailing slash**
   - **Must include `https://`**
3. Restart the backend service after changing this

### Step 2: Check Browser Console

1. Open your deployed frontend in a browser
2. Press F12 to open Developer Tools
3. Go to "Console" tab
4. Look for:
   - `API Base URL: ...` - Should show your backend URL, NOT localhost
   - Any red error messages
   - CORS errors
   - Network errors

### Step 3: Test Backend Directly

1. Open your backend URL in a browser: `https://your-backend.onrender.com/`
2. Should see: `{"status":"ok","service":"LLM Council API"}`
3. If you see an error, the backend isn't running properly

### Step 4: Check CORS Configuration

If you see CORS errors in the console:

1. Verify `FRONTEND_URL` in backend matches your frontend URL exactly
2. Check backend logs in Render dashboard
3. Make sure both URLs use `https://` (not `http://`)

### Step 5: Rebuild Frontend

**Critical**: Vite environment variables are baked into the build at build time.

If you set `VITE_API_BASE_URL` AFTER the first build:
1. Go to your frontend service in Render
2. Click "Manual Deploy"
3. Select "Clear build cache & deploy"
4. Wait for rebuild to complete

### Step 6: Verify Streaming Works

The app uses Server-Sent Events (SSE) for streaming. Check:

1. Backend logs should show requests to `/api/conversations/{id}/message/stream`
2. Browser Network tab should show a request with type "eventsource" or "fetch"
3. If streaming fails, check backend logs for errors

### Common Issues

**Issue**: API URL shows `http://localhost:8001`
- **Fix**: Set `VITE_API_BASE_URL` in frontend environment variables and rebuild

**Issue**: CORS errors in console
- **Fix**: Set `FRONTEND_URL` in backend environment variables and restart backend

**Issue**: "Failed to fetch" errors
- **Fix**: Check backend is running and URL is correct (no trailing slash)

**Issue**: App loads but doesn't progress past input
- **Fix**: Check browser console for errors, verify streaming endpoint works

### Quick Checklist

- [ ] `VITE_API_BASE_URL` set in frontend (with https://, no trailing slash)
- [ ] Frontend rebuilt after setting environment variable
- [ ] `FRONTEND_URL` set in backend (with https://, no trailing slash)
- [ ] Backend restarted after setting environment variable
- [ ] `OPENROUTER_API_KEY` set in backend
- [ ] Backend health check works (`/` endpoint)
- [ ] No CORS errors in browser console
- [ ] Browser console shows correct API URL (not localhost)

### Testing After Fix

1. Open frontend in browser
2. Open browser console (F12)
3. Enter a question
4. Watch console for:
   - "Creating conversation..."
   - "Conversation created: ..."
   - "Starting message stream..."
   - "Stream event: stage1_start"
   - "Stream event: stage1_complete"
   - etc.

If you see these logs, the connection is working!

