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
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))

# JWT token expiration time in hours
TOKEN_EXPIRATION_HOURS = 24

# User data directory
USERS_DIR = "data/users"
SESSIONS_DIR = "data/users/sessions"
