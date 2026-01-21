# Deploying to Render

This guide will help you deploy the LLM Council application to Render.

## Prerequisites

1. A [Render](https://render.com) account
2. Your OpenRouter API key
3. Your code pushed to a GitHub repository

## Deployment Steps

### Step 1: Deploy Backend (Using render.yaml)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Deploy Backend via Blueprint**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml` and deploy the backend

3. **Set Backend Environment Variables**
   - In the backend service settings, add:
     - `OPENROUTER_API_KEY`: Your OpenRouter API key (mark as "Secret")
   - `PORT` is automatically provided by Render
   - **Note**: You'll set `FRONTEND_URL` after the frontend deploys

4. **Wait for backend to deploy**
   - Note your backend URL (e.g., `https://llm-council-backend.onrender.com`)

### Step 2: Deploy Frontend (Manual Setup)

Since Render's Blueprint doesn't support static sites well, deploy the frontend manually:

1. **Create Static Site**
   - In Render Dashboard, click "New +" → "Static Site"
   - Connect your GitHub repository

2. **Configure Frontend**
   - **Name**: `llm-council-frontend` (or your preferred name)
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
   - **Environment Variables**:
     - `VITE_API_BASE_URL`: Your backend URL from Step 1 (e.g., `https://llm-council-backend.onrender.com`)
       - **Important**: This must be set BEFORE building, as Vite needs it at build time
   - **Note**: The `_redirects` file in `frontend/public/` ensures client-side routing works correctly (all routes serve `index.html`)

3. **Deploy Frontend**
   - Click "Create Static Site"
   - Wait for it to build and deploy
   - Note your frontend URL (e.g., `https://llm-council-frontend.onrender.com`)

### Step 3: Connect Backend and Frontend

1. **Update Backend CORS**
   - Go to your backend service settings
   - Add/Update environment variable:
     - `FRONTEND_URL`: Your frontend URL from Step 2 (e.g., `https://llm-council-frontend.onrender.com`)
   - This allows the frontend to make API calls to the backend

2. **Verify Deployment**
   - Test backend: Visit `https://your-backend.onrender.com/` (should show `{"status":"ok"}`)
   - Test frontend: Visit your frontend URL
   - Create a test conversation to verify everything works

### Alternative: Manual Setup (Both Services)

#### Backend Service

1. Create a new **Web Service** on Render
2. Connect your GitHub repository
3. Configure:
   - **Name**: `llm-council-backend`
   - **Runtime**: Python 3
   - **Build Command**: `uv sync && uv pip install --system -e .`
   - **Start Command**: `uv run uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables**:
     - `OPENROUTER_API_KEY`: Your API key (Secret)
     - `FRONTEND_URL`: Will be set after frontend deploys (e.g., `https://llm-council-frontend.onrender.com`)
   - **Plan**: Free

#### Frontend Service

1. Create a new **Static Site** on Render
2. Connect your GitHub repository
3. Configure:
   - **Name**: `llm-council-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
   - **Environment Variables**:
     - `VITE_API_BASE_URL`: Your backend URL (e.g., `https://llm-council-backend.onrender.com`)
   - **Plan**: Free

4. **Update Backend CORS**:
   - After frontend deploys, update the backend's `FRONTEND_URL` environment variable with the frontend URL

## Important Notes

### Free Tier Limitations

- Services on the free tier spin down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- Consider upgrading to a paid plan for production use

### Data Persistence

- The current implementation stores conversations in JSON files in the `data/` directory
- On Render's free tier, this data is **ephemeral** and will be lost on redeploy
- For production, consider:
  - Using Render's PostgreSQL database (paid)
  - Using an external database (MongoDB Atlas, Supabase, etc.)
  - Using object storage (AWS S3, Cloudflare R2, etc.)

### Environment Variables

Make sure to set:
- `OPENROUTER_API_KEY` in the backend service
- `VITE_API_BASE_URL` in the frontend service (should be the backend URL)
- `FRONTEND_URL` in the backend service (should be the frontend URL)

## Troubleshooting

### CORS Errors
- Ensure `FRONTEND_URL` in backend matches your frontend service URL exactly
- Include protocol (`https://`) in the URL

### Build Failures
- Check that `uv` is available (Render should install it automatically)
- Verify all dependencies are in `pyproject.toml`
- Check build logs in Render dashboard

### API Connection Issues
- Verify `VITE_API_BASE_URL` is set correctly in frontend
- Check that backend service is running and healthy
- Ensure backend URL doesn't have a trailing slash

### 404 Error on Routes (e.g., `/auth/callback`)
- This happens when the static site doesn't serve `index.html` for all routes
- The `_redirects` file in `frontend/public/` should fix this
- After adding `_redirects`, rebuild and redeploy the frontend
- If still not working, verify the `_redirects` file is in `frontend/dist/` after build

## Post-Deployment

After deployment:
1. Test the health endpoint: `https://your-backend.onrender.com/`
2. Test the frontend: `https://your-frontend.onrender.com`
3. Create a test conversation to verify everything works

## Custom Domain (Optional)

You can add custom domains in Render dashboard:
1. Go to your service settings
2. Click "Custom Domains"
3. Add your domain and follow DNS setup instructions

