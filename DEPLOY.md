# Deploying to Render

This guide will help you deploy the LLM Council application to Render.

## Prerequisites

1. A [Render](https://render.com) account
2. Your OpenRouter API key
3. Your code pushed to a GitHub repository

## Deployment Steps

### Option 1: Using render.yaml (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Connect to Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml`

3. **Set Environment Variables**
   
   **Backend Service:**
   - `OPENROUTER_API_KEY`: Your OpenRouter API key (mark as "Secret")
   - `FRONTEND_URL`: Will be set automatically after frontend deploys
   - `PORT`: Automatically provided by Render
   
   **Frontend Service:**
   - `VITE_API_BASE_URL`: Set this to your backend URL (e.g., `https://llm-council-backend.onrender.com`)
     - **Important**: This must be set BEFORE building, as Vite needs it at build time
     - You may need to set this manually after the backend deploys, then trigger a rebuild

4. **Deploy**
   - Click "Apply" to deploy both services
   - Wait for both services to build and deploy

### Option 2: Manual Setup

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

