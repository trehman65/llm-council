# Authentication Troubleshooting Guide

## Issue: 404 Error on Login

If you're getting a "404 Not Found" error when trying to log in, the backend server needs to be restarted to load the new authentication routes.

### Solution

1. **Stop the current backend server** (if running):
   - Press `Ctrl+C` in the terminal where the backend is running

2. **Install new dependencies** (if you haven't already):
   ```bash
   pip install -e .
   # or
   uv sync
   ```

3. **Restart the backend server**:
   ```bash
   # Option 1: Using uv (recommended)
   uv run python -m backend.main
   
   # Option 2: Using uvicorn directly with python3
   python3 -m uvicorn backend.main:app --reload --port 8001
   
   # Option 3: Using the start script
   chmod +x start.sh
   ./start.sh
   
   # Option 4: If uv is not available, use python3 directly
   python3 -m pip install -e .
   python3 -m uvicorn backend.main:app --reload --port 8001
   ```

4. **Verify the routes are loaded**:
   ```bash
   curl http://localhost:8001/api/auth/login
   ```
   
   You should see a JSON response with `auth_url` and `state`, or an error about missing Google OAuth credentials (which is expected if credentials aren't set up yet).

## Issue: Missing Google OAuth Credentials

If you get an error about missing credentials, you need to set up Google OAuth first.

### Quick Setup

1. Add to your `.env` file:
   ```bash
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   SECRET_KEY=your_random_secret_key_here
   OAUTH_REDIRECT_URI=http://localhost:8001/api/auth/callback
   FRONTEND_URL=http://localhost:5173
   ```

2. See `OAUTH_SETUP.md` for detailed instructions on getting Google OAuth credentials.

## Issue: Import Errors

If you see import errors when starting the backend, make sure all dependencies are installed:

```bash
pip install -e .
# or
uv sync
```

The new dependencies include:
- `authlib`
- `python-jose[cryptography]`
- `python-multipart`
- `itsdangerous`

## Issue: Backend Not Starting

Check for errors in the backend startup:

1. Look for import errors
2. Verify all environment variables are set (at minimum, the OAuth ones can be empty if you just want to test)
3. Check that port 8001 is not already in use

## Testing the Setup

1. **Test backend health**:
   ```bash
   curl http://localhost:8001/
   ```
   Should return: `{"status":"ok","service":"LLM Council API"}`

2. **Test login endpoint**:
   ```bash
   curl http://localhost:8001/api/auth/login
   ```
   Should return either:
   - JSON with `auth_url` (if credentials are set)
   - Error about missing credentials (expected if not set up)

3. **Test frontend**:
   - Open http://localhost:5173
   - You should see the login page
   - If you get a connection error, verify the backend is running


## Issue: 404 Error on Login

If you're getting a "404 Not Found" error when trying to log in, the backend server needs to be restarted to load the new authentication routes.

### Solution

1. **Stop the current backend server** (if running):
   - Press `Ctrl+C` in the terminal where the backend is running

2. **Install new dependencies** (if you haven't already):
   ```bash
   pip install -e .
   # or
   uv sync
   ```

3. **Restart the backend server**:
   ```bash
   # Option 1: Using uv (recommended)
   uv run python -m backend.main
   
   # Option 2: Using uvicorn directly with python3
   python3 -m uvicorn backend.main:app --reload --port 8001
   
   # Option 3: Using the start script
   chmod +x start.sh
   ./start.sh
   
   # Option 4: If uv is not available, use python3 directly
   python3 -m pip install -e .
   python3 -m uvicorn backend.main:app --reload --port 8001
   ```

4. **Verify the routes are loaded**:
   ```bash
   curl http://localhost:8001/api/auth/login
   ```
   
   You should see a JSON response with `auth_url` and `state`, or an error about missing Google OAuth credentials (which is expected if credentials aren't set up yet).

## Issue: Missing Google OAuth Credentials

If you get an error about missing credentials, you need to set up Google OAuth first.

### Quick Setup

1. Add to your `.env` file:
   ```bash
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   SECRET_KEY=your_random_secret_key_here
   OAUTH_REDIRECT_URI=http://localhost:8001/api/auth/callback
   FRONTEND_URL=http://localhost:5173
   ```

2. See `OAUTH_SETUP.md` for detailed instructions on getting Google OAuth credentials.

## Issue: Import Errors

If you see import errors when starting the backend, make sure all dependencies are installed:

```bash
pip install -e .
# or
uv sync
```

The new dependencies include:
- `authlib`
- `python-jose[cryptography]`
- `python-multipart`
- `itsdangerous`

## Issue: Backend Not Starting

Check for errors in the backend startup:

1. Look for import errors
2. Verify all environment variables are set (at minimum, the OAuth ones can be empty if you just want to test)
3. Check that port 8001 is not already in use

## Testing the Setup

1. **Test backend health**:
   ```bash
   curl http://localhost:8001/
   ```
   Should return: `{"status":"ok","service":"LLM Council API"}`

2. **Test login endpoint**:
   ```bash
   curl http://localhost:8001/api/auth/login
   ```
   Should return either:
   - JSON with `auth_url` (if credentials are set)
   - Error about missing credentials (expected if not set up)

3. **Test frontend**:
   - Open http://localhost:5173
   - You should see the login page
   - If you get a connection error, verify the backend is running

