"""Storage for conversations - supports both MongoDB and file-based storage."""

import json
import os
import re
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path
from .config import DATA_DIR
from .database import get_conversations_collection, get_momentum_projects_collection


def ensure_data_dir():
    """Ensure the data directory exists."""
    Path(DATA_DIR).mkdir(parents=True, exist_ok=True)


def sanitize_id(id_value: str) -> str:
    """
    Sanitize an ID to prevent path traversal attacks.
    Only allows alphanumeric characters, hyphens, and underscores.
    """
    if not id_value or not isinstance(id_value, str):
        raise ValueError("Invalid ID: must be a non-empty string")
    
    # Remove any path separators and dangerous characters
    sanitized = re.sub(r'[^a-zA-Z0-9\-_]', '', id_value)
    
    if not sanitized or sanitized != id_value:
        raise ValueError(f"Invalid ID format: {id_value}")
    
    if len(sanitized) > 100:
        raise ValueError("ID too long")
    
    return sanitized


def get_conversation_path(conversation_id: str) -> str:
    """Get the file path for a conversation."""
    safe_id = sanitize_id(conversation_id)
    return os.path.join(DATA_DIR, f"{safe_id}.json")


MOMENTUM_DIR = "data/momentum_projects"


def ensure_momentum_dir():
    """Ensure the Momentum data directory exists."""
    Path(MOMENTUM_DIR).mkdir(parents=True, exist_ok=True)


def get_momentum_path(user_id: str) -> str:
    """Get the file path for a user's Momentum projects."""
    safe_id = sanitize_id(user_id)
    return os.path.join(MOMENTUM_DIR, f"{safe_id}.json")


def create_conversation(conversation_id: str, user_id: Optional[str] = None) -> Dict[str, Any]:
    """
    Create a new conversation.

    Args:
        conversation_id: Unique identifier for the conversation
        user_id: Optional user ID to associate with the conversation

    Returns:
        New conversation dict
    """
    conversation = {
        "id": conversation_id,
        "created_at": datetime.utcnow().isoformat(),
        "title": "New Conversation",
        "messages": [],
        "user_id": user_id,
    }

    # Try MongoDB first, fall back to file storage
    collection = get_conversations_collection()
    if collection is not None:
        collection.insert_one(conversation)
    else:
        # File storage fallback
        ensure_data_dir()
        path = get_conversation_path(conversation_id)
        with open(path, 'w') as f:
            json.dump(conversation, f, indent=2)

    return conversation


def get_conversation(conversation_id: str) -> Optional[Dict[str, Any]]:
    """
    Load a conversation from storage.

    Args:
        conversation_id: Unique identifier for the conversation

    Returns:
        Conversation dict or None if not found
    """
    # Try MongoDB first, fall back to file storage
    collection = get_conversations_collection()
    if collection is not None:
        result = collection.find_one({"id": conversation_id})
        if result:
            # Remove MongoDB _id field
            result.pop("_id", None)
            return result
        return None
    else:
        # File storage fallback
        path = get_conversation_path(conversation_id)
        if not os.path.exists(path):
            return None
        with open(path, 'r') as f:
            return json.load(f)


def save_conversation(conversation: Dict[str, Any]):
    """
    Save a conversation to storage.

    Args:
        conversation: Conversation dict to save
    """
    # Try MongoDB first, fall back to file storage
    collection = get_conversations_collection()
    if collection is not None:
        collection.update_one(
            {"id": conversation["id"]},
            {"$set": conversation},
            upsert=True
        )
    else:
        # File storage fallback
        ensure_data_dir()
        path = get_conversation_path(conversation['id'])
        with open(path, 'w') as f:
            json.dump(conversation, f, indent=2)


def list_conversations(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    List all conversations (metadata only), optionally filtered by user.

    Args:
        user_id: Optional user ID to filter conversations

    Returns:
        List of conversation metadata dicts
    """
    # Try MongoDB first, fall back to file storage
    collection = get_conversations_collection()
    if collection is not None:
        query = {}
        if user_id is not None:
            query["user_id"] = user_id
        
        conversations = []
        for doc in collection.find(query, {"id": 1, "created_at": 1, "title": 1, "messages": 1}):
            # Get first user message (the original question)
            first_question = None
            for msg in doc.get("messages", []):
                if msg.get("role") == "user":
                    first_question = msg.get("content", "")
                    break
            
            conversations.append({
                "id": doc["id"],
                "created_at": doc["created_at"],
                "title": doc.get("title", "New Conversation"),
                "message_count": len(doc.get("messages", [])),
                "first_question": first_question
            })
        
        # Sort by creation time, newest first
        conversations.sort(key=lambda x: x["created_at"], reverse=True)
        return conversations
    
    # File storage fallback
    ensure_data_dir()
    conversations = []
    
    if not os.path.exists(DATA_DIR):
        return []
    
    for filename in os.listdir(DATA_DIR):
        if filename.endswith('.json'):
            try:
                filepath = os.path.join(DATA_DIR, filename)
                with open(filepath, 'r') as f:
                    conv = json.load(f)
                
                # Filter by user_id if specified
                if user_id is not None and conv.get("user_id") != user_id:
                    continue
                
                # Get first user message (the original question)
                first_question = None
                for msg in conv.get("messages", []):
                    if msg.get("role") == "user":
                        first_question = msg.get("content", "")
                        break
                
                conversations.append({
                    "id": conv["id"],
                    "created_at": conv["created_at"],
                    "title": conv.get("title", "New Conversation"),
                    "message_count": len(conv.get("messages", [])),
                    "first_question": first_question
                })
            except (json.JSONDecodeError, KeyError, IOError):
                # Skip invalid files
                continue
    
    # Sort by creation time, newest first
    conversations.sort(key=lambda x: x["created_at"], reverse=True)
    return conversations


def list_momentum_projects(user_id: str) -> List[Dict[str, Any]]:
    """List Momentum projects for a user."""
    collection = get_momentum_projects_collection()
    if collection is not None:
        result = collection.find_one({"user_id": user_id})
        if result and "projects" in result:
            return result["projects"]
        return []
    ensure_momentum_dir()
    path = get_momentum_path(user_id)
    if not os.path.exists(path):
        return []
    with open(path, 'r') as f:
        data = json.load(f)
        return data.get("projects", [])


def save_momentum_projects(user_id: str, projects: List[Dict[str, Any]]):
    """Save Momentum projects for a user."""
    payload = {
        "user_id": user_id,
        "projects": projects,
        "updated_at": datetime.utcnow().isoformat()
    }
    collection = get_momentum_projects_collection()
    if collection is not None:
        collection.update_one(
            {"user_id": user_id},
            {"$set": payload},
            upsert=True
        )
        return
    ensure_momentum_dir()
    path = get_momentum_path(user_id)
    with open(path, 'w') as f:
        json.dump(payload, f, indent=2)


def add_user_message(conversation_id: str, content: str):
    """
    Add a user message to a conversation.

    Args:
        conversation_id: Conversation identifier
        content: User message content
    """
    conversation = get_conversation(conversation_id)
    if conversation is None:
        raise ValueError(f"Conversation {conversation_id} not found")

    conversation["messages"].append({
        "role": "user",
        "content": content
    })

    save_conversation(conversation)


def add_assistant_message(
    conversation_id: str,
    stage1: List[Dict[str, Any]],
    stage2: List[Dict[str, Any]],
    stage3: Dict[str, Any]
):
    """
    Add an assistant message with all 3 stages to a conversation.

    Args:
        conversation_id: Conversation identifier
        stage1: List of individual model responses
        stage2: List of model rankings
        stage3: Final synthesized response
    """
    conversation = get_conversation(conversation_id)
    if conversation is None:
        raise ValueError(f"Conversation {conversation_id} not found")

    conversation["messages"].append({
        "role": "assistant",
        "stage1": stage1,
        "stage2": stage2,
        "stage3": stage3
    })

    save_conversation(conversation)


def add_raw_assistant_message(conversation_id: str, content: str):
    """
    Add a raw assistant message with content to a conversation.
    Used for storing structured data like second-order effects.

    Args:
        conversation_id: Conversation identifier
        content: Assistant message content (can be JSON string)
    """
    conversation = get_conversation(conversation_id)
    if conversation is None:
        raise ValueError(f"Conversation {conversation_id} not found")

    conversation["messages"].append({
        "role": "assistant",
        "content": content
    })

    save_conversation(conversation)


def add_second_order_message(
    conversation_id: str,
    first_order: Dict[str, Any],
    second_order: Dict[str, Any],
    third_order: Dict[str, Any],
    recommendations: Dict[str, Any]
):
    """
    Add a second-order analysis message to a conversation (old format).

    Args:
        conversation_id: Conversation identifier
        first_order: First-order impact analysis
        second_order: Second-order impact analysis
        third_order: Third-order impact analysis
        recommendations: Recommendations and mitigations
    """
    conversation = get_conversation(conversation_id)
    if conversation is None:
        raise ValueError(f"Conversation {conversation_id} not found")

    conversation["messages"].append({
        "role": "assistant",
        "type": "second_order_analysis",
        "first_order": first_order,
        "second_order": second_order,
        "third_order": third_order,
        "recommendations": recommendations
    })

    save_conversation(conversation)


def update_conversation_title(conversation_id: str, title: str):
    """
    Update the title of a conversation.

    Args:
        conversation_id: Conversation identifier
        title: New title for the conversation
    """
    conversation = get_conversation(conversation_id)
    if conversation is None:
        raise ValueError(f"Conversation {conversation_id} not found")

    conversation["title"] = title
    save_conversation(conversation)
