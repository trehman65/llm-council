"""Authentication module for LLM Council."""

import os
import json
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from .config import SECRET_KEY, TOKEN_EXPIRATION_HOURS, USERS_DIR, SESSIONS_DIR
from .database import get_users_collection, get_sessions_collection

# Ensure directories exist
os.makedirs(USERS_DIR, exist_ok=True)
os.makedirs(SESSIONS_DIR, exist_ok=True)

# Security scheme
security = HTTPBearer(auto_error=False)


def get_user_file_path(user_id: str) -> str:
    """Get the file path for a user's data."""
    return os.path.join(USERS_DIR, f"{user_id}.json")


def get_session_file_path(session_id: str) -> str:
    """Get the file path for a session."""
    # Hash the session ID to create a safe filename
    hashed = hashlib.sha256(session_id.encode()).hexdigest()
    return os.path.join(SESSIONS_DIR, f"{hashed}.json")


# Temporary token storage for secure token exchange (one-time use, short expiration)
_temp_tokens: Dict[str, Dict[str, Any]] = {}


def create_temp_token(jwt_token: str) -> str:
    """Create a temporary token for secure exchange."""
    import secrets
    temp_token = secrets.token_urlsafe(32)
    _temp_tokens[temp_token] = {
        "jwt_token": jwt_token,
        "created_at": datetime.utcnow(),
        "expires_at": datetime.utcnow() + timedelta(minutes=5)  # 5 minute expiration
    }
    return temp_token


def exchange_temp_token(temp_token: str) -> Optional[str]:
    """Exchange a temporary token for the real JWT token. Returns None if invalid."""
    if not temp_token or temp_token not in _temp_tokens:
        return None
    
    token_data = _temp_tokens[temp_token]
    
    # Check expiration
    if datetime.utcnow() > token_data["expires_at"]:
        del _temp_tokens[temp_token]
        return None
    
    # Get the JWT token and delete the temp token (one-time use)
    jwt_token = token_data["jwt_token"]
    del _temp_tokens[temp_token]
    
    return jwt_token


def _cleanup_expired_temp_tokens():
    """Clean up expired temporary tokens."""
    now = datetime.utcnow()
    expired = [token for token, data in _temp_tokens.items() if now > data["expires_at"]]
    for token in expired:
        del _temp_tokens[token]


def create_user(user_info: Dict[str, Any]) -> Dict[str, Any]:
    """Create or update a user from Google OAuth info."""
    user_id = user_info.get("sub") or user_info.get("id")
    if not user_id:
        raise ValueError("User info must contain 'sub' or 'id' field")
    
    user_data = {
        "id": user_id,
        "email": user_info.get("email"),
        "name": user_info.get("name"),
        "picture": user_info.get("picture"),
        "created_at": datetime.utcnow().isoformat(),
        "last_login": datetime.utcnow().isoformat(),
    }
    
    # Try MongoDB first, fall back to file storage
    collection = get_users_collection()
    if collection:
        existing_user = collection.find_one({"id": user_id})
        if existing_user:
            user_data["created_at"] = existing_user.get("created_at", user_data["created_at"])
        collection.update_one(
            {"id": user_id},
            {"$set": user_data},
            upsert=True
        )
    else:
        # File storage fallback
        file_path = get_user_file_path(user_id)
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                existing_user = json.load(f)
                user_data["created_at"] = existing_user.get("created_at", user_data["created_at"])
        
        # Save user data
        with open(file_path, 'w') as f:
            json.dump(user_data, f, indent=2)
    
    return user_data


def get_user(user_id: str) -> Optional[Dict[str, Any]]:
    """Get a user by ID."""
    # Try MongoDB first, fall back to file storage
    collection = get_users_collection()
    if collection:
        user = collection.find_one({"id": user_id})
        if user:
            user.pop("_id", None)  # Remove MongoDB _id field
            return user
        return None
    else:
        # File storage fallback
        file_path = get_user_file_path(user_id)
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                return json.load(f)
        return None


def create_access_token(user_id: str, user_email: str) -> str:
    """Create a JWT access token."""
    expire = datetime.utcnow() + timedelta(hours=TOKEN_EXPIRATION_HOURS)
    payload = {
        "sub": user_id,
        "email": user_email,
        "exp": expire,
        "iat": datetime.utcnow(),
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    return token


def create_session(user_id: str, token: str) -> Dict[str, Any]:
    """Create a session for a user."""
    session_data = {
        "user_id": user_id,
        "token": token,
        "created_at": datetime.utcnow().isoformat(),
        "expires_at": (datetime.utcnow() + timedelta(hours=TOKEN_EXPIRATION_HOURS)).isoformat(),
    }
    
    # Try MongoDB first, fall back to file storage
    collection = get_sessions_collection()
    if collection:
        collection.update_one(
            {"token": token},
            {"$set": session_data},
            upsert=True
        )
    else:
        # File storage fallback
        file_path = get_session_file_path(token)
        with open(file_path, 'w') as f:
            json.dump(session_data, f, indent=2)
    
    return session_data


def get_session(token: str) -> Optional[Dict[str, Any]]:
    """Get a session by token."""
    # Try MongoDB first, fall back to file storage
    collection = get_sessions_collection()
    if collection:
        session = collection.find_one({"token": token})
        if session:
            session.pop("_id", None)  # Remove MongoDB _id field
            # Check if session is expired
            expires_at = datetime.fromisoformat(session["expires_at"])
            if datetime.utcnow() > expires_at:
                delete_session(token)
                return None
            return session
        return None
    else:
        # File storage fallback
        file_path = get_session_file_path(token)
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                session = json.load(f)
                # Check if session is expired
                expires_at = datetime.fromisoformat(session["expires_at"])
                if datetime.utcnow() > expires_at:
                    delete_session(token)
                    return None
                return session
        return None


def delete_session(token: str) -> bool:
    """Delete a session."""
    # Try MongoDB first, fall back to file storage
    collection = get_sessions_collection()
    if collection:
        result = collection.delete_one({"token": token})
        return result.deleted_count > 0
    else:
        # File storage fallback
        file_path = get_session_file_path(token)
        if os.path.exists(file_path):
            os.remove(file_path)
            return True
        return False


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify a JWT token and return the payload."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return payload
    except JWTError:
        return None


async def get_current_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Dict[str, Any]:
    """
    Dependency to get the current authenticated user.
    Raises HTTPException if not authenticated.
    """
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = credentials.credentials
    
    # Verify the JWT token
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Get user from storage
    user_id = payload.get("sub")
    user = get_user(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user


async def get_optional_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[Dict[str, Any]]:
    """
    Dependency to get the current user if authenticated, or None if not.
    Does not raise exceptions for unauthenticated requests.
    """
    if not credentials:
        return None
    
    token = credentials.credentials
    
    # Verify the JWT token
    payload = verify_token(token)
    if not payload:
        return None
    
    # Get user from storage
    user_id = payload.get("sub")
    return get_user(user_id)

