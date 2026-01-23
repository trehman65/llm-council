"""Storage for conversations - supports both MongoDB and file-based storage."""

import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path
from .config import DATA_DIR
from .database import get_conversations_collection


def ensure_data_dir():
    """Ensure the data directory exists."""
    Path(DATA_DIR).mkdir(parents=True, exist_ok=True)


def get_conversation_path(conversation_id: str) -> str:
    """Get the file path for a conversation."""
    return os.path.join(DATA_DIR, f"{conversation_id}.json")


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
    else:
        # File storage fallback
        ensure_data_dir()
        conversations = []
        for filename in os.listdir(DATA_DIR):
            if filename.endswith('.json'):
                path = os.path.join(DATA_DIR, filename)
                with open(path, 'r') as f:
                    data = json.load(f)
                    
                    # Filter by user_id if provided
                    if user_id is not None:
                        if data.get("user_id") != user_id:
                            continue
                    
                # Get first user message (the original question)
                first_question = None
                for msg in data.get("messages", []):
                    if msg.get("role") == "user":
                        first_question = msg.get("content", "")
                        break
                
                # Return metadata only
                conversations.append({
                    "id": data["id"],
                    "created_at": data["created_at"],
                    "title": data.get("title", "New Conversation"),
                    "message_count": len(data["messages"]),
                    "first_question": first_question
                })

        # Sort by creation time, newest first
        conversations.sort(key=lambda x: x["created_at"], reverse=True)
        return conversations


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
