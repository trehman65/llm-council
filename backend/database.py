"""Database connection and utilities for MongoDB."""

import os
from typing import Optional
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
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
        try:
            # Production-ready connection settings
            _client = MongoClient(
                MONGODB_URI,
                serverSelectionTimeoutMS=5000,  # 5 second timeout
                connectTimeoutMS=10000,  # 10 second connection timeout
                retryWrites=True,
                # TLS is handled by the connection string on Render
            )
            # Test the connection
            _client.admin.command('ping')
            _db = _client[DB_NAME]
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            import logging
            logging.error(f"Failed to connect to MongoDB: {str(e)}")
            _client = None
            _db = None
            return None
    
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

