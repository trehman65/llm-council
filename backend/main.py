"""FastAPI backend for LLM Council."""

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, RedirectResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest
from pydantic import BaseModel, Field, field_validator
from typing import List, Dict, Any, Optional
import uuid
import json
import asyncio
import os
from urllib.parse import urlencode

from . import storage
from . import auth
from . import oauth as oauth_module
from .config import FRONTEND_URL
from .council import (
    run_full_council,
    generate_conversation_title,
    stage1_collect_responses,
    stage2_collect_rankings,
    stage3_synthesize_final,
    calculate_aggregate_rankings,
)

app = FastAPI(title="LLM Council API")

# Enable CORS - allow local development and Render frontend
cors_origins = [
    "http://localhost:5173",
    "http://localhost:5174",  # Vite may use different ports
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]
# Add Render frontend URL if provided via environment variable
if os.getenv("FRONTEND_URL"):
    cors_origins.append(os.getenv("FRONTEND_URL"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    expose_headers=[],
    max_age=3600,
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""
    async def dispatch(self, request: StarletteRequest, call_next):
        response = await call_next(request)
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # HSTS - only in production (HTTPS)
        if os.getenv("ENVIRONMENT") == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app.add_middleware(SecurityHeadersMiddleware)


class SendMessageRequest(BaseModel):
    """Request to send a message in a conversation."""
    content: str = Field(..., min_length=1, max_length=10000, description="Message content (1-10000 characters)")
    
    @field_validator('content')
    @classmethod
    def validate_content(cls, v: str) -> str:
        """Validate and sanitize message content."""
        if not v or not v.strip():
            raise ValueError("Message content cannot be empty")
        # Strip whitespace but preserve internal formatting
        content = v.strip()
        if len(content) > 10000:
            raise ValueError("Message content cannot exceed 10000 characters")
        return content


class ConversationMetadata(BaseModel):
    """Conversation metadata for list view."""
    id: str
    created_at: str
    title: str
    message_count: int


class Conversation(BaseModel):
    """Full conversation with all messages."""
    id: str
    created_at: str
    title: str
    messages: List[Dict[str, Any]]


# ==================== Health Check ====================

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "LLM Council API"}


# ==================== Authentication Endpoints ====================

@app.get("/api/auth/login")
async def login():
    """
    Initiate Google OAuth login.
    Returns the authorization URL for the frontend to redirect to.
    """
    try:
        auth_url, state = oauth_module.generate_authorization_url()
        return {"auth_url": auth_url, "state": state}
    except Exception as e:
        # Log detailed error server-side but return generic message to client
        import logging
        logging.error(f"Failed to generate authorization URL: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to initiate login. Please try again later.")


@app.get("/api/auth/callback")
async def auth_callback(code: str = None, state: str = None, error: str = None):
    """
    Handle the OAuth callback from Google.
    Exchanges the code for tokens and creates a user session.
    """
    if error:
        return RedirectResponse(
            url=f"{FRONTEND_URL}/auth/callback?error={error}"
        )
    
    if not code:
        return RedirectResponse(
            url=f"{FRONTEND_URL}/auth/callback?error=no_code"
        )
    
    # Validate state parameter to prevent CSRF attacks
    if not state or not oauth_module.validate_state(state):
        import logging
        logging.warning(f"Invalid or missing OAuth state parameter")
        return RedirectResponse(
            url=f"{FRONTEND_URL}/auth/callback?error=invalid_state"
        )
    
    try:
        # Exchange code for tokens
        token_response = await oauth_module.exchange_code_for_token(code)
        access_token = token_response.get("access_token")
        
        if not access_token:
            return RedirectResponse(
                url=f"{FRONTEND_URL}/auth/callback?error=no_access_token"
            )
        
        # Get user info from Google
        user_info = await oauth_module.get_user_info(access_token)
        
        # Create or update user in our system
        user = auth.create_user(user_info)
        
        # Create our own JWT token
        jwt_token = auth.create_access_token(user["id"], user.get("email", ""))
        
        # Create session
        auth.create_session(user["id"], jwt_token)
        
        # Create temporary token for secure exchange (prevents token in URL)
        temp_token = auth.create_temp_token(jwt_token)
        
        # Redirect to frontend with temporary token ID
        return RedirectResponse(
            url=f"{FRONTEND_URL}/auth/callback?temp_token={temp_token}"
        )
        
    except Exception as e:
        # Log detailed error server-side but return generic message to client
        import logging
        logging.error(f"OAuth callback error: {str(e)}", exc_info=True)
        # Use generic error message to prevent information disclosure
        return RedirectResponse(
            url=f"{FRONTEND_URL}/auth/callback?error=authentication_failed"
        )


@app.post("/api/auth/exchange-token")
async def exchange_token(request: Request):
    """Exchange a temporary token for the real JWT token."""
    try:
        body = await request.json()
        temp_token = body.get("temp_token")
        
        if not temp_token:
            raise HTTPException(status_code=400, detail="temp_token is required")
        
        jwt_token = auth.exchange_temp_token(temp_token)
        
        if not jwt_token:
            raise HTTPException(status_code=401, detail="Invalid or expired temporary token")
        
        return {"token": jwt_token}
    except Exception as e:
        import logging
        logging.error(f"Token exchange error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Token exchange failed")


@app.get("/api/auth/me")
async def get_current_user_info(current_user: Dict[str, Any] = Depends(auth.get_current_user)):
    """Get the current authenticated user's information."""
    return current_user


@app.post("/api/auth/logout")
async def logout(
    request: Request,
    current_user: Dict[str, Any] = Depends(auth.get_current_user)
):
    """Logout the current user by invalidating their session."""
    # Extract token from Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:]  # Remove "Bearer " prefix
        auth.delete_session(token)
    return {"message": "Logged out successfully"}


# ==================== Authenticated Conversation Endpoints ====================

@app.get("/api/conversations", response_model=List[ConversationMetadata])
async def list_conversations(current_user: Dict[str, Any] = Depends(auth.get_current_user)):
    """List all conversations for the current user."""
    return storage.list_conversations(user_id=current_user["id"])


@app.post("/api/conversations", response_model=Conversation)
async def create_conversation(
    request: Request,
    current_user: Dict[str, Any] = Depends(auth.get_current_user)
):
    """Create a new conversation for the current user."""
    conversation_id = str(uuid.uuid4())
    conversation = storage.create_conversation(conversation_id, user_id=current_user["id"])
    return conversation


@app.get("/api/conversations/{conversation_id}", response_model=Conversation)
async def get_conversation(
    conversation_id: str,
    current_user: Dict[str, Any] = Depends(auth.get_current_user)
):
    """Get a specific conversation with all its messages."""
    conversation = storage.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Verify the conversation belongs to the current user
    if conversation.get("user_id") and conversation["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return conversation


@app.post("/api/conversations/{conversation_id}/message")
async def send_message(
    conversation_id: str,
    request: SendMessageRequest,
    current_user: Dict[str, Any] = Depends(auth.get_current_user)
):
    """
    Send a message and run the 3-stage council process.
    Returns the complete response with all stages.
    """
    # Check if conversation exists
    conversation = storage.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Verify the conversation belongs to the current user
    if conversation.get("user_id") and conversation["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    # Check if this is the first message
    is_first_message = len(conversation["messages"]) == 0

    # Add user message
    storage.add_user_message(conversation_id, request.content)

    # If this is the first message, generate a title
    if is_first_message:
        title = await generate_conversation_title(request.content)
        storage.update_conversation_title(conversation_id, title)

    # Run the 3-stage council process
    stage1_results, stage2_results, stage3_result, metadata = await run_full_council(
        request.content
    )

    # Add assistant message with all stages
    storage.add_assistant_message(
        conversation_id,
        stage1_results,
        stage2_results,
        stage3_result
    )

    # Return the complete response with metadata
    return {
        "stage1": stage1_results,
        "stage2": stage2_results,
        "stage3": stage3_result,
        "metadata": metadata
    }


@app.post("/api/conversations/{conversation_id}/message/stream")
async def send_message_stream(
    conversation_id: str,
    request: SendMessageRequest,
    current_user: Dict[str, Any] = Depends(auth.get_current_user)
):
    """
    Send a message and stream the 3-stage council process.
    Returns Server-Sent Events as each stage completes.
    """
    # Check if conversation exists
    conversation = storage.get_conversation(conversation_id)
    if conversation is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Verify the conversation belongs to the current user
    if conversation.get("user_id") and conversation["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    # Check if this is the first message
    is_first_message = len(conversation["messages"]) == 0

    async def event_generator():
        try:
            # Add user message
            storage.add_user_message(conversation_id, request.content)

            # Start title generation in parallel (don't await yet)
            title_task = None
            if is_first_message:
                title_task = asyncio.create_task(generate_conversation_title(request.content))

            # Stage 1: Collect responses
            yield f"data: {json.dumps({'type': 'stage1_start'})}\n\n"
            stage1_results = await stage1_collect_responses(request.content)
            yield f"data: {json.dumps({'type': 'stage1_complete', 'data': stage1_results})}\n\n"

            # Stage 2: Collect rankings
            yield f"data: {json.dumps({'type': 'stage2_start'})}\n\n"
            stage2_results, label_to_model = await stage2_collect_rankings(request.content, stage1_results)
            aggregate_rankings = calculate_aggregate_rankings(stage2_results, label_to_model)
            yield f"data: {json.dumps({'type': 'stage2_complete', 'data': stage2_results, 'metadata': {'label_to_model': label_to_model, 'aggregate_rankings': aggregate_rankings}})}\n\n"

            # Stage 3: Synthesize final answer
            yield f"data: {json.dumps({'type': 'stage3_start'})}\n\n"
            stage3_result = await stage3_synthesize_final(request.content, stage1_results, stage2_results)
            yield f"data: {json.dumps({'type': 'stage3_complete', 'data': stage3_result})}\n\n"

            # Wait for title generation if it was started
            if title_task:
                title = await title_task
                storage.update_conversation_title(conversation_id, title)
                yield f"data: {json.dumps({'type': 'title_complete', 'data': {'title': title}})}\n\n"

            # Save complete assistant message
            storage.add_assistant_message(
                conversation_id,
                stage1_results,
                stage2_results,
                stage3_result
            )

            # Send completion event
            yield f"data: {json.dumps({'type': 'complete'})}\n\n"

        except Exception as e:
            # Send error event
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


# ==================== Guest Mode Endpoints (No Authentication) ====================

@app.post("/api/guest/message/stream")
async def guest_message_stream(request: SendMessageRequest):
    """
    Send a message in guest mode - no authentication required.
    Conversations are not saved. Returns Server-Sent Events as each stage completes.
    """
    async def event_generator():
        try:
            # Stage 1: Collect responses
            yield f"data: {json.dumps({'type': 'stage1_start'})}\n\n"
            stage1_results = await stage1_collect_responses(request.content)
            yield f"data: {json.dumps({'type': 'stage1_complete', 'data': stage1_results})}\n\n"

            # Stage 2: Collect rankings
            yield f"data: {json.dumps({'type': 'stage2_start'})}\n\n"
            stage2_results, label_to_model = await stage2_collect_rankings(request.content, stage1_results)
            aggregate_rankings = calculate_aggregate_rankings(stage2_results, label_to_model)
            yield f"data: {json.dumps({'type': 'stage2_complete', 'data': stage2_results, 'metadata': {'label_to_model': label_to_model, 'aggregate_rankings': aggregate_rankings}})}\n\n"

            # Stage 3: Synthesize final answer
            yield f"data: {json.dumps({'type': 'stage3_start'})}\n\n"
            stage3_result = await stage3_synthesize_final(request.content, stage1_results, stage2_results)
            yield f"data: {json.dumps({'type': 'stage3_complete', 'data': stage3_result})}\n\n"

            # Send completion event (no storage for guest mode)
            yield f"data: {json.dumps({'type': 'complete'})}\n\n"

        except Exception as e:
            # Send error event
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


if __name__ == "__main__":
    import uvicorn
    # Use PORT environment variable (provided by Render) or default to 8001
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
