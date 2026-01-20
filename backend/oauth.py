"""Google OAuth module for LLM Council."""

import secrets
from typing import Tuple, Dict, Any

import httpx
from authlib.integrations.httpx_client import AsyncOAuth2Client

from .config import (
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    OAUTH_REDIRECT_URI,
)

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
    Returns: (authorization_url, state)
    """
    client = create_oauth_client()
    state = secrets.token_urlsafe(32)
    
    # create_authorization_url is synchronous, not async
    auth_url, _ = client.create_authorization_url(
        GOOGLE_AUTHORIZATION_ENDPOINT,
        state=state,
        scope="openid email profile",
    )
    
    return auth_url, state


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

