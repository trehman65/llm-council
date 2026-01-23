"""Google OAuth module for LLM Council."""

import secrets
from typing import Tuple, Dict, Any, Optional
from datetime import datetime, timedelta

import httpx
from authlib.integrations.httpx_client import AsyncOAuth2Client

from .config import (
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    OAUTH_REDIRECT_URI,
)

# In-memory storage for OAuth state values (with expiration)
# In production, consider using Redis or a database
_oauth_states: Dict[str, datetime] = {}
STATE_EXPIRATION_MINUTES = 10

# Google OAuth endpoints
GOOGLE_AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_ENDPOINT = "https://www.googleapis.com/oauth2/v3/userinfo"


def create_oauth_client() -> AsyncOAuth2Client:
    """Create an OAuth2 client for Google."""
    return AsyncOAuth2Client(
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        redirect_uri=OAUTH_REDIRECT_URI,
    )


def generate_authorization_url() -> Tuple[str, str]:
    """
    Generate the Google OAuth authorization URL.
    Stores state for validation on callback.
    Returns: (authorization_url, state)
    """
    client = create_oauth_client()
    state = secrets.token_urlsafe(32)
    
    # Store state with expiration time
    _oauth_states[state] = datetime.utcnow() + timedelta(minutes=STATE_EXPIRATION_MINUTES)
    
    # Clean up expired states (simple cleanup, not perfect but sufficient)
    _cleanup_expired_states()
    
    # create_authorization_url is synchronous, not async
    auth_url, _ = client.create_authorization_url(
        GOOGLE_AUTHORIZATION_ENDPOINT,
        state=state,
        scope="openid email profile",
    )
    
    return auth_url, state


def validate_state(state: str) -> bool:
    """
    Validate an OAuth state parameter.
    Returns True if state is valid and not expired, False otherwise.
    """
    if not state:
        return False
    
    if state not in _oauth_states:
        return False
    
    # Check if expired
    if datetime.utcnow() > _oauth_states[state]:
        # Remove expired state
        del _oauth_states[state]
        return False
    
    # State is valid, remove it (one-time use)
    del _oauth_states[state]
    return True


def _cleanup_expired_states():
    """Remove expired states from storage."""
    now = datetime.utcnow()
    expired = [state for state, expiry in _oauth_states.items() if now > expiry]
    for state in expired:
        del _oauth_states[state]


async def exchange_code_for_token(code: str) -> Dict[str, Any]:
    """
    Exchange the authorization code for an access token.
    Returns the token response from Google.
    """
    client = create_oauth_client()
    
    token = await client.fetch_token(
        GOOGLE_TOKEN_ENDPOINT,
        code=code,
        grant_type="authorization_code",
    )
    
    return token


async def get_user_info(access_token: str) -> Dict[str, Any]:
    """
    Get user information from Google using the access token.
    """
    async with httpx.AsyncClient() as client:
        response = await client.get(
            GOOGLE_USERINFO_ENDPOINT,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        response.raise_for_status()
        return response.json()

