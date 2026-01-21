# Fix: "Not Found" Error on `/auth/callback` Route (Render Static Site)

## Problem
After Google OAuth redirects to `/auth/callback`, Render's static site returns "Not Found" because it's looking for a file at that path instead of serving `index.html` for React Router to handle.

## Solution: Two-Part Fix

### Part 1: Add `_redirects` File (Already Done)
✅ Created `frontend/public/_redirects` with:
```
/*    /index.html   200
```

This file will be automatically copied to `frontend/dist/` during build.

### Part 2: Configure Render Dashboard (REQUIRED)

Render static sites need explicit configuration in the dashboard:

1. **Go to Render Dashboard**
   - Navigate to [Render Dashboard](https://dashboard.render.com)
   - Click on your **frontend static site** (`llm-council-frontend-mbps`)

2. **Open Settings Tab**
   - Click the **Settings** tab

3. **Find Redirects & Rewrites Section**
   - Scroll down to find **"Redirects & Rewrites"** or **"Custom Redirects"**
   - If you don't see this section, your plan might not support it (see Alternative below)

4. **Add Rewrite Rule**
   - Click **"Add Redirect"** or **"Add Rewrite"**
   - Configure:
     - **Source Path**: `/*` (matches all paths)
     - **Destination**: `/index.html`
     - **Action**: **Rewrite** (NOT Redirect - this keeps the URL unchanged)
     - **Status Code**: `200`
   - Click **Save**

5. **Redeploy**
   - Render should automatically redeploy after saving
   - Wait for deployment to complete

### Alternative: If Redirects Section Not Available

If your Render plan doesn't show Redirects & Rewrites:

1. **Verify `_redirects` is in build output:**
   - Check Render build logs
   - Verify `frontend/dist/_redirects` exists after build
   - The file should contain: `/*    /index.html   200`

2. **Contact Render Support:**
   - Some plans require enabling SPA routing via support
   - Or upgrade to a plan that supports custom redirects

## Verification Steps

After configuring:

1. **Test the route directly:**
   - Visit: `https://llm-council-frontend-mbps.onrender.com/auth/callback`
   - Should load your React app (not 404)

2. **Test login flow:**
   - Go to `/login`
   - Click "Sign in with Google"
   - After selecting account, should redirect to `/auth/callback` successfully

3. **Check browser console:**
   - Should see no 404 errors
   - Auth callback should process successfully

## Why This Happens

- **Locally**: Vite dev server handles SPA routing automatically
- **Production**: Static hosting needs explicit rules to serve `index.html` for all routes
- **Render**: Requires both the `_redirects` file AND dashboard configuration

## Quick Checklist

- [ ] `frontend/public/_redirects` file exists with `/*    /index.html   200`
- [ ] Rewrite rule configured in Render dashboard (`/*` → `/index.html`, Rewrite, 200)
- [ ] Frontend redeployed after changes
- [ ] `/auth/callback` route loads successfully (test directly)
- [ ] Login flow completes successfully

