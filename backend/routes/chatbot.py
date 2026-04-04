from fastapi import APIRouter, Depends, HTTPException, status, Request, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import io
import os
import uuid
from database import get_db
from models import ChatSession, ChatMessage, User
from schemas import ChatSessionCreate, ChatSessionResponse, ChatReply
from middleware.auth import get_current_user
from utils.chatbot import get_chatbot_reply, client as groq_client
from utils.limiter import limiter
from datetime import datetime

router = APIRouter(prefix="/chat", tags=["Chatbot"])

# Medical reports upload dir
MEDICAL_REPORTS_DIR = os.path.join("uploads", "medical_reports")
os.makedirs(MEDICAL_REPORTS_DIR, exist_ok=True)

MEDICAL_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
MAX_MEDICAL_REPORT_SIZE = 5 * 1024 * 1024  # 5MB


def _get_file_ext(filename: str) -> str:
    return os.path.splitext(filename)[1].lower() if filename else ""


def _extract_text_from_file(contents: bytes, ext: str, original_filename: str) -> str:
    """Extract text content from uploaded file. Limited to 2000 chars."""
    if ext in (".jpg", ".jpeg", ".png"):
        return f"Medical image uploaded: {original_filename}. The user has shared a medical image. Please ask them to describe what they see."

    elif ext == ".pdf":
        try:
            import pdfplumber
            text = ""
            with pdfplumber.open(io.BytesIO(contents)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            if text.strip():
                return f"Medical report ({original_filename}):\n{text.strip()[:2000]}"
        except ImportError:
            try:
                from pypdf import PdfReader
                reader = PdfReader(io.BytesIO(contents))
                text = ""
                for page in reader.pages:
                    pt = page.extract_text()
                    if pt:
                        text += pt + "\n"
                if text.strip():
                    return f"Medical report ({original_filename}):\n{text.strip()[:2000]}"
            except Exception:
                pass
        except Exception:
            pass
        return f"Medical report uploaded: {original_filename}. Text extraction unavailable."

    elif ext in (".doc", ".docx"):
        try:
            from docx import Document
            doc = Document(io.BytesIO(contents))
            text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
            if text.strip():
                return f"Medical document ({original_filename}):\n{text.strip()[:2000]}"
        except Exception:
            pass
        return f"Medical document uploaded: {original_filename}. Please describe its contents."

    return f"File uploaded: {original_filename}"


# ─── Upload endpoint under /chat/upload/ ──────────────────────────────────

@router.post("/upload/medical-report", response_model=dict)
async def upload_medical_report(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload a medical report for chatbot analysis. Extracts text from PDF/DOC."""
    if file.content_type not in MEDICAL_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX"
        )

    contents = await file.read()
    if len(contents) > MAX_MEDICAL_REPORT_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File too large. Max size is 5MB"
        )

    ext = _get_file_ext(file.filename or "")
    unique_filename = f"medical_report_{current_user.id}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = os.path.join(MEDICAL_REPORTS_DIR, unique_filename)

    try:
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )

    file_url = f"/uploads/medical_reports/{unique_filename}"
    file_context = _extract_text_from_file(contents, ext, file.filename or "unknown")

    return {
        "file_url": file_url,
        "filename": file.filename,
        "file_context": file_context,
        "message": "File uploaded successfully"
    }


# ─── Chat session endpoints ─────────────────────────────────────────────

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
@limiter.limit("20/minute")
def send_message(
    request: Request,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message and get AI reply with real doctors from database"""
    # Check if Groq client is initialized
    if not groq_client:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI chatbot is currently unavailable. Please set GROQ_API_KEY to enable this feature."
        )
    
    session_id = data.get("session_id")
    message = data.get("message")
    file_url = data.get("file_url")  # URL of uploaded file (for display)
    file_context = data.get("file_context")  # Extracted text for AI

    if not session_id or not message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="session_id and message are required"
        )

    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )

    # Get previous messages (last 10, chronological order)
    prev_messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at.desc()).limit(10).all()
    prev_messages.reverse()

    history = [{"role": m.role, "content": m.content} for m in prev_messages]

    # Use file_context (extracted text) for AI if provided
    if not file_context and file_url:
        file_context = f"User uploaded medical file: {file_url}"

    reply = get_chatbot_reply(history, message, db, file_context)

    # Save user message (store the actual file URL for display)
    user_message = ChatMessage(
        session_id=session_id,
        role="user",
        content=message,
        file_url=file_url
    )
    db.add(user_message)

    assistant_message = ChatMessage(
        session_id=session_id,
        role="assistant",
        content=reply
    )
    db.add(assistant_message)

    session.updated_at = datetime.utcnow()
    db.commit()

    return {"reply": reply}


@router.get("/sessions", response_model=List[ChatSessionResponse])
def get_chat_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all chat sessions for current user"""
    from sqlalchemy.orm import joinedload

    sessions = db.query(ChatSession).options(
        joinedload(ChatSession.messages)
    ).filter(
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
