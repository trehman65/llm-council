# Fix: redirect_uri_mismatch Error on Render

## Quick Fix Steps

### 1. Find Your Render Backend URL
- Go to [Render Dashboard](https://dashboard.render.com)
- Click on your backend service (e.g., `llm-council-backend`)
- Copy the URL from the top (e.g., `https://llm-council-backend-xxxx.onrender.com`)

### 2. Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Click **Edit**
5. Under **Authorized redirect URIs**, add:
   ```
   https://YOUR-BACKEND-URL.onrender.com/api/auth/callback
   ```
   ⚠️ **Important**: Replace `YOUR-BACKEND-URL` with your actual Render backend URL
6. Under **Authorized JavaScript origins**, add:
   ```
   https://YOUR-BACKEND-URL.onrender.com
   ```
7. Click **Save**

### 3. Set Environment Variable in Render

1. In Render Dashboard, go to your backend service
2. Click **Environment** tab
3. Add or update the environment variable:
   - **Key**: `OAUTH_REDIRECT_URI`
   - **Value**: `https://YOUR-BACKEND-URL.onrender.com/api/auth/callback`
   ⚠️ **Important**: Replace `YOUR-BACKEND-URL` with your actual Render backend URL
4. Click **Save Changes**

### 4. Redeploy (if needed)

- If you just added the environment variable, Render should automatically redeploy
- Wait for the deployment to complete
- Try logging in again

## Common Mistakes to Avoid

❌ **Don't include a trailing slash**: 
- ✅ Correct: `https://backend.onrender.com/api/auth/callback`
- ❌ Wrong: `https://backend.onrender.com/api/auth/callback/`

❌ **Don't use http instead of https**:
- ✅ Correct: `https://backend.onrender.com/api/auth/callback`
- ❌ Wrong: `http://backend.onrender.com/api/auth/callback`

❌ **Don't forget to match exactly**:
- The URI in Google Cloud Console must match EXACTLY what's in Render's `OAUTH_REDIRECT_URI`
- Check for typos, extra spaces, or missing parts

## Verify Your Setup

After making changes, verify:

1. **Google Cloud Console** has the redirect URI: `https://your-backend.onrender.com/api/auth/callback`
2. **Render Dashboard** has `OAUTH_REDIRECT_URI` set to: `https://your-backend.onrender.com/api/auth/callback`
3. Both URLs match **exactly** (case-sensitive, no trailing slashes)

## Still Not Working?

1. **Check Render logs**: Look for any errors in the backend service logs
2. **Verify environment variable**: Make sure `OAUTH_REDIRECT_URI` is actually set (check in Render Dashboard)
3. **Wait a few minutes**: Google Cloud Console changes can take a few minutes to propagate
4. **Clear browser cache**: Try logging in in an incognito/private window

