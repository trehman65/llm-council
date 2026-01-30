"""Configuration for the LLM Council."""

import os
import secrets
from dotenv import load_dotenv

load_dotenv()

# OpenRouter API key
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Council members - list of OpenRouter model identifiers
COUNCIL_MODELS = [
    "openai/gpt-5.1",
    "google/gemini-3-pro-preview",
    "anthropic/claude-sonnet-4.5",
    "x-ai/grok-4",
]

# Chairman model - synthesizes final response
CHAIRMAN_MODEL = "google/gemini-3-pro-preview"

# OpenRouter API endpoint
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Data directory for conversation storage
DATA_DIR = "data/conversations"

# ==================== Authentication Configuration ====================

# Google OAuth credentials
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

# OAuth redirect URI (backend callback endpoint)
OAUTH_REDIRECT_URI = os.getenv("OAUTH_REDIRECT_URI", "http://localhost:8001/api/auth/callback")

# Frontend URL for redirect after authentication
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Secret key for JWT encoding - generate a random one if not set
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    # In production, SECRET_KEY must be explicitly set
    if os.getenv("ENVIRONMENT") == "production" or os.getenv("PORT"):
        raise ValueError(
            "SECRET_KEY environment variable must be set in production. "
            "Generate one with: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
        )
    # Development fallback
    print("⚠️ WARNING: Using auto-generated SECRET_KEY. Set SECRET_KEY env var for production.")
    SECRET_KEY = secrets.token_urlsafe(32)

# JWT token expiration time in hours
TOKEN_EXPIRATION_HOURS = 24

# User data directory
USERS_DIR = "data/users"
SESSIONS_DIR = "data/users/sessions"

# ==================== Database Configuration ====================

# MongoDB connection string (for persistent storage on Render)
MONGODB_URI = os.getenv("MONGODB_URI")
USE_DATABASE = os.getenv("USE_DATABASE", "false").lower() == "true"

# Database name
DB_NAME = os.getenv("DB_NAME", "llm_council")
