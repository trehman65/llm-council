# Google OAuth 2.0 Setup Guide

This guide explains how to set up Google OAuth 2.0 authentication for the LLM Council application.

## Prerequisites

- A Google account
- Access to Google Cloud Console (https://console.cloud.google.com/)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "LLM Council")
5. Click "Create"

## Step 2: Enable Google+ API (OAuth 2.0)

1. In your Google Cloud project, go to **APIs & Services** > **Library**
2. Search for "Google+ API" or "Identity Toolkit API"
3. Click on it and click **Enable**

Alternatively, you can enable OAuth 2.0 by going to **APIs & Services** > **Credentials** > **OAuth consent screen** (this will guide you through the process).

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Select **External** (unless you're using Google Workspace, then use Internal)
3. Click **Create**
4. Fill in the required fields:
   - **App name**: LLM Council (or your preferred name)
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
5. Click **Save and Continue**
6. On the **Scopes** page, click **Add or Remove Scopes**
   - Add: `openid`, `email`, `profile`
7. Click **Save and Continue**
8. On the **Test users** page (if in Testing mode), add test users if needed
9. Click **Save and Continue**
10. Review and submit

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Web application** as the application type
4. Fill in the details:
   - **Name**: LLM Council Client (or your preferred name)
   - **Authorized JavaScript origins**:
     - For local development: `http://localhost:8001`
     - For production: Your backend URL (e.g., `https://your-backend.onrender.com`)
   - **Authorized redirect URIs**:
     - For local development: `http://localhost:8001/api/auth/callback`
     - For production: `https://your-backend.onrender.com/api/auth/callback`
5. Click **Create**
6. **IMPORTANT**: Copy the **Client ID** and **Client Secret** - you'll need these for environment variables

## Step 5: Set Environment Variables

### For Local Development (.env file)

Create or update your `.env` file in the project root:

```bash
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here

# Secret key for JWT tokens (generate a secure random string)
SECRET_KEY=your_secret_key_here_at_least_32_characters_long

# OAuth redirect URI (must match what you set in Google Cloud Console)
OAUTH_REDIRECT_URI=http://localhost:8001/api/auth/callback

# Frontend URL (for redirects after authentication)
FRONTEND_URL=http://localhost:5173

# Session cookie security (set to true in production with HTTPS)
SESSION_COOKIE_SECURE=false
```

### For Production (Render)

1. Go to your Render dashboard
2. Select your backend service
3. Go to **Environment** tab
4. Add the following environment variables:

```
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
SECRET_KEY=your_secret_key_here_at_least_32_characters_long
OAUTH_REDIRECT_URI=https://your-backend.onrender.com/api/auth/callback
FRONTEND_URL=https://your-frontend.onrender.com
SESSION_COOKIE_SECURE=true
```

### For Frontend (Render)

1. Go to your Render dashboard
2. Select your frontend static site
3. Go to **Environment** tab
4. Add the following environment variable:

```
VITE_API_BASE_URL=https://your-backend.onrender.com
```

## Step 6: Generate a Secure Secret Key

For production, generate a secure random secret key:

```bash
# Using Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Using OpenSSL
openssl rand -hex 32
```

## Security Best Practices

1. **Never commit credentials to version control**: Always use environment variables
2. **Use HTTPS in production**: Set `SESSION_COOKIE_SECURE=true` only when using HTTPS
3. **Rotate secrets regularly**: Change your SECRET_KEY periodically
4. **Limit OAuth scopes**: Only request the scopes you need (`openid`, `email`, `profile`)
5. **Use different credentials for dev/prod**: Create separate OAuth clients for each environment
6. **Monitor usage**: Regularly check OAuth consent screen usage in Google Cloud Console

## Testing

1. Start your backend server:
   ```bash
   cd backend
   python -m uvicorn backend.main:app --reload --port 8001
   ```

2. Start your frontend server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Navigate to `http://localhost:5173`
4. Click "Sign in with Google"
5. You should be redirected to Google's login page
6. After logging in, you'll be redirected back to the app

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure the redirect URI in your `.env` file matches exactly what you set in Google Cloud Console
- Check for trailing slashes and protocol (http vs https)

### Error: "invalid_client"
- Verify your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Make sure you copied the full client ID and secret

### Error: "access_denied"
- If your app is in "Testing" mode, make sure the user is added to the test users list
- Consider publishing your app if you want to allow all users

### Sessions not persisting
- Check that `SESSION_COOKIE_SECURE` is set correctly (false for HTTP, true for HTTPS)
- Verify cookies are being set in your browser's developer tools
- Check CORS settings in your backend

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [OAuth 2.0 Best Practices](https://oauth.net/2/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)




This guide explains how to set up Google OAuth 2.0 authentication for the LLM Council application.

## Prerequisites

- A Google account
- Access to Google Cloud Console (https://console.cloud.google.com/)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "LLM Council")
5. Click "Create"

## Step 2: Enable Google+ API (OAuth 2.0)

1. In your Google Cloud project, go to **APIs & Services** > **Library**
2. Search for "Google+ API" or "Identity Toolkit API"
3. Click on it and click **Enable**

Alternatively, you can enable OAuth 2.0 by going to **APIs & Services** > **Credentials** > **OAuth consent screen** (this will guide you through the process).

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Select **External** (unless you're using Google Workspace, then use Internal)
3. Click **Create**
4. Fill in the required fields:
   - **App name**: LLM Council (or your preferred name)
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
5. Click **Save and Continue**
6. On the **Scopes** page, click **Add or Remove Scopes**
   - Add: `openid`, `email`, `profile`
7. Click **Save and Continue**
8. On the **Test users** page (if in Testing mode), add test users if needed
9. Click **Save and Continue**
10. Review and submit

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Web application** as the application type
4. Fill in the details:
   - **Name**: LLM Council Client (or your preferred name)
   - **Authorized JavaScript origins**:
     - For local development: `http://localhost:8001`
     - For production: Your backend URL (e.g., `https://your-backend.onrender.com`)
   - **Authorized redirect URIs**:
     - For local development: `http://localhost:8001/api/auth/callback`
     - For production: `https://your-backend.onrender.com/api/auth/callback`
5. Click **Create**
6. **IMPORTANT**: Copy the **Client ID** and **Client Secret** - you'll need these for environment variables

## Step 5: Set Environment Variables

### For Local Development (.env file)

Create or update your `.env` file in the project root:

```bash
# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here

# Secret key for JWT tokens (generate a secure random string)
SECRET_KEY=your_secret_key_here_at_least_32_characters_long

# OAuth redirect URI (must match what you set in Google Cloud Console)
OAUTH_REDIRECT_URI=http://localhost:8001/api/auth/callback

# Frontend URL (for redirects after authentication)
FRONTEND_URL=http://localhost:5173

# Session cookie security (set to true in production with HTTPS)
SESSION_COOKIE_SECURE=false
```

### For Production (Render)

1. Go to your Render dashboard
2. Select your backend service
3. Go to **Environment** tab
4. Add the following environment variables:

```
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
SECRET_KEY=your_secret_key_here_at_least_32_characters_long
OAUTH_REDIRECT_URI=https://your-backend.onrender.com/api/auth/callback
FRONTEND_URL=https://your-frontend.onrender.com
SESSION_COOKIE_SECURE=true
```

### For Frontend (Render)

1. Go to your Render dashboard
2. Select your frontend static site
3. Go to **Environment** tab
4. Add the following environment variable:

```
VITE_API_BASE_URL=https://your-backend.onrender.com
```

## Step 6: Generate a Secure Secret Key

For production, generate a secure random secret key:

```bash
# Using Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Using OpenSSL
openssl rand -hex 32
```

## Security Best Practices

1. **Never commit credentials to version control**: Always use environment variables
2. **Use HTTPS in production**: Set `SESSION_COOKIE_SECURE=true` only when using HTTPS
3. **Rotate secrets regularly**: Change your SECRET_KEY periodically
4. **Limit OAuth scopes**: Only request the scopes you need (`openid`, `email`, `profile`)
5. **Use different credentials for dev/prod**: Create separate OAuth clients for each environment
6. **Monitor usage**: Regularly check OAuth consent screen usage in Google Cloud Console

## Testing

1. Start your backend server:
   ```bash
   cd backend
   python -m uvicorn backend.main:app --reload --port 8001
   ```

2. Start your frontend server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Navigate to `http://localhost:5173`
4. Click "Sign in with Google"
5. You should be redirected to Google's login page
6. After logging in, you'll be redirected back to the app

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure the redirect URI in your `.env` file matches exactly what you set in Google Cloud Console
- Check for trailing slashes and protocol (http vs https)

### Error: "invalid_client"
- Verify your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
- Make sure you copied the full client ID and secret

### Error: "access_denied"
- If your app is in "Testing" mode, make sure the user is added to the test users list
- Consider publishing your app if you want to allow all users

### Sessions not persisting
- Check that `SESSION_COOKIE_SECURE` is set correctly (false for HTTP, true for HTTPS)
- Verify cookies are being set in your browser's developer tools
- Check CORS settings in your backend

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [OAuth 2.0 Best Practices](https://oauth.net/2/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)




