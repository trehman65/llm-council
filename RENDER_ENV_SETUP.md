# Render Environment Variables Setup

## Required Environment Variables for Backend

### 1. **OPENROUTER_API_KEY** (Required)
- Your OpenRouter API key
- Format: `sk-or-v1-...`
- Mark as **Secret** in Render

### 2. **FRONTEND_URL** (Required for CORS)
- Your frontend URL (e.g., `https://llmcouncil.us`)
- **Important**: Include the protocol (`https://`)
- This is used for CORS and OAuth redirects
- **Must match exactly** what the browser sends as the origin

### 3. **OAUTH_REDIRECT_URI** (Required for OAuth)
- Your backend callback URL
- Format: `https://your-backend.onrender.com/api/auth/callback`
- Example: `https://llm-council-backend-8wlf.onrender.com/api/auth/callback`
- This must match what's configured in Google Cloud Console

### 4. **GOOGLE_CLIENT_ID** (Required for OAuth)
- Your Google OAuth Client ID
- Get from [Google Cloud Console](https://console.cloud.google.com/)

### 5. **GOOGLE_CLIENT_SECRET** (Required for OAuth)
- Your Google OAuth Client Secret
- Mark as **Secret** in Render
- Get from [Google Cloud Console](https://console.cloud.google.com/)

### 6. **MONGODB_URI** (Optional but Recommended)
- MongoDB connection string for persistent storage
- Format: `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority`
- Mark as **Secret** in Render

### 7. **USE_DATABASE** (Optional)
- Set to `true` to enable MongoDB
- Default: `false` (uses file storage)

### 8. **DB_NAME** (Optional)
- Database name
- Default: `llm_council`

### 9. **PORT** (Auto-set by Render)
- Automatically provided by Render
- Don't set manually

## Required Environment Variables for Frontend

### 1. **VITE_API_BASE_URL** (Required)
- Your backend URL
- Format: `https://your-backend.onrender.com`
- Example: `https://llm-council-backend-8wlf.onrender.com`
- **Important**: Must be set BEFORE building (Vite needs it at build time)

## Common CORS Issues

### Issue: "No 'Access-Control-Allow-Origin' header"
**Solution:**
1. Ensure `FRONTEND_URL` in backend is set to your exact frontend URL
2. Include the protocol: `https://llmcouncil.us` (not just `llmcouncil.us`)
3. No trailing slash: `https://llmcouncil.us` (not `https://llmcouncil.us/`)
4. After updating, **redeploy** the backend service

### Issue: OAuth redirect mismatch
**Solution:**
1. Ensure `OAUTH_REDIRECT_URI` matches your backend URL + `/api/auth/callback`
2. Ensure this same URL is configured in Google Cloud Console as an authorized redirect URI
3. Both must match exactly (including protocol and trailing path)

## Verification Steps

1. **Check Backend CORS Logs:**
   - After deployment, check backend logs
   - Should see: `CORS allowed origins: [...]`
   - Verify your frontend URL is in the list

2. **Test Backend Health:**
   ```bash
   curl https://your-backend.onrender.com/
   ```
   Should return: `{"status":"ok","service":"LLM Council API"}`

3. **Test CORS:**
   - Open browser console on your frontend
   - Try to login
   - Check for CORS errors
   - If errors persist, verify `FRONTEND_URL` matches exactly

## Quick Fix Checklist

- [ ] `FRONTEND_URL` set in backend (with `https://` and no trailing slash)
- [ ] `OAUTH_REDIRECT_URI` set in backend (matches backend URL + `/api/auth/callback`)
- [ ] `GOOGLE_CLIENT_ID` set in backend
- [ ] `GOOGLE_CLIENT_SECRET` set in backend (marked as secret)
- [ ] `VITE_API_BASE_URL` set in frontend (matches backend URL)
- [ ] Google Cloud Console has the redirect URI configured
- [ ] Backend service redeployed after environment variable changes
- [ ] Frontend rebuilt after `VITE_API_BASE_URL` change

