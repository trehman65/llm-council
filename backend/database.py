"""Database connection and utilities for MongoDB."""

from typing import Optional
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from .config import MONGODB_URI, DB_NAME, USE_DATABASE

_client: Optional[MongoClient] = None
_db: Optional[Database] = None


def get_database() -> Optional[Database]:
    """Get MongoDB database instance. Returns None if not configured."""
    global _db
    
    if not USE_DATABASE or not MONGODB_URI:
        return None
    
    if _db is None:
        global _client
        _client = MongoClient(MONGODB_URI)
        _db = _client[DB_NAME]
    
    return _db


def get_conversations_collection() -> Optional[Collection]:
    """Get conversations collection."""
    db = get_database()
    if db is None:
        return None
    return db["conversations"]


def get_users_collection() -> Optional[Collection]:
    """Get users collection."""
    db = get_database()
    if db is None:
        return None
    return db["users"]


def get_sessions_collection() -> Optional[Collection]:
    """Get sessions collection."""
    db = get_database()
    if db is None:
        return None
    return db["sessions"]


def get_momentum_projects_collection() -> Optional[Collection]:
    """Get Momentum projects collection."""
    db = get_database()
    if db is None:
        return None
    return db["momentum_projects"]


def close_connection():
    """Close database connection."""
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None

