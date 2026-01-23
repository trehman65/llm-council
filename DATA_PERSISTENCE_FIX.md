# Data Persistence Fix for Render

## Problem
Render's filesystem is **ephemeral** - it gets wiped on every deployment. Your chat history stored in `data/` directory disappears because:
- Render creates a fresh filesystem on each deploy
- The `data/` directory is not persisted between deployments
- This is mentioned in DEPLOY.md but not solved

## Solution: MongoDB Atlas (Free Tier)

I'm implementing MongoDB Atlas support which:
- ✅ Free tier (512MB storage, perfect for beta)
- ✅ Persists data across deployments
- ✅ Works seamlessly with your JSON structure
- ✅ No code changes needed after setup

## Quick Setup Steps

### 1. Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for free account
3. Create a new cluster (choose FREE tier M0)
4. Create a database user (save username/password)
5. Whitelist IP addresses (SECURITY IMPORTANT):
   - **Option A (Recommended)**: Use MongoDB Atlas VPC Peering (if available)
   - **Option B**: Whitelist Render's IP ranges (see below)
   - **Option C (Quick but insecure)**: `0.0.0.0/0` - ONLY for testing, NOT production!
6. Get connection string: Click "Connect" → "Connect your application"
7. Copy the connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority`)

### 2. Update Render Environment Variables
Add to your backend service:
- `MONGODB_URI`: Your MongoDB connection string
- `USE_DATABASE`: `true` (enables database mode)

### 3. Deploy
The code will automatically use MongoDB when `USE_DATABASE=true` is set.

## Alternative: Keep File Storage for Local Dev

The code supports both:
- **Local dev**: Uses file storage (no MongoDB needed)
- **Production**: Uses MongoDB (set `USE_DATABASE=true`)

## Migration

Existing data in `data/` directory:
- Will continue to work locally
- On Render, new data goes to MongoDB
- Old data is lost (expected, since filesystem is ephemeral)

## Cost

- **MongoDB Atlas Free Tier**: $0/month
  - 512MB storage
  - Shared CPU/RAM
  - Perfect for beta testing

## Next Steps After Setup

1. Set `MONGODB_URI` in Render
2. Set `USE_DATABASE=true` in Render  
3. Redeploy
4. Your chat history will now persist! 🎉

