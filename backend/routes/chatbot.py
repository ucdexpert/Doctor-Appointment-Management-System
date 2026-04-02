from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import ChatSession, ChatMessage, User
from schemas import ChatSessionCreate, ChatSessionResponse, ChatMessageResponse, ChatReply
from middleware.auth import get_current_user
from utils.chatbot import get_chatbot_reply

router = APIRouter(prefix="/chat", tags=["Chatbot"])


@router.post("/session", response_model=ChatSessionResponse, status_code=status.HTTP_201_CREATED)
def create_chat_session(
    session_data: ChatSessionCreate = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new chat session"""

    new_session = ChatSession(
        user_id=current_user.id,
        title=session_data.title if session_data and session_data.title else "New Chat"
    )

    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return new_session


@router.post("/message", response_model=ChatReply)
def send_message(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message and get AI reply with real doctors from database"""

    session_id = data.get("session_id")
    message = data.get("message")

    if not session_id or not message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="session_id and message are required"
        )

    # Verify session belongs to user
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )

    # Get previous messages for context (last 10)
    prev_messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at.desc()).limit(10).all()

    # Reverse to get chronological order
    prev_messages.reverse()

    # Format for LLM
    history = [{"role": m.role, "content": m.content} for m in prev_messages]

    # Get AI reply with REAL doctors from database
    reply = get_chatbot_reply(history, message, db)

    # Save user message
    user_message = ChatMessage(
        session_id=session_id,
        role="user",
        content=message
    )
    db.add(user_message)

    # Save assistant reply
    assistant_message = ChatMessage(
        session_id=session_id,
        role="assistant",
        content=reply
    )
    db.add(assistant_message)

    # Update session timestamp
    from datetime import datetime
    session.updated_at = datetime.utcnow()
    db.commit()

    return {"reply": reply}


@router.get("/sessions", response_model=List[ChatSessionResponse])
def get_chat_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all chat sessions for current user"""

    sessions = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id
    ).order_by(ChatSession.updated_at.desc()).all()

    return sessions


@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
def get_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get specific chat session with messages"""

    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )

    return session


@router.delete("/sessions/{session_id}")
def delete_chat_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a chat session"""

    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )

    db.delete(session)
    db.commit()

    return {"message": "Chat session deleted successfully"}
