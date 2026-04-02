from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from models import User
from middleware.auth import get_current_user
from schemas import MessageResponse
from pydantic import BaseModel
import os
import uuid

router = APIRouter(prefix="/upload", tags=["File Upload"])

# Upload directory
UPLOAD_DIR = "uploads/profile_photos"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Allowed file types
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


class UploadResponse(BaseModel):
    message: str
    photo_url: str


def get_file_extension(filename: str) -> str:
    """Get file extension"""
    return os.path.splitext(filename)[1].lower()


@router.post("/profile-photo", response_model=UploadResponse)
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload profile photo"""
    
    # Validate file type
    file_ext = get_file_extension(file.filename or "")
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Read file content to check size
    contents = await file.read()
    file_size = len(contents)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must be less than 5MB"
        )
    
    # Reset file pointer for saving
    file.file.seek(0)
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    try:
        # Save file
        with open(file_path, "wb") as buffer:
            buffer.write(contents)
        
        # Generate URL (for local development)
        # In production, you would upload to S3/Cloudinary and get CDN URL
        photo_url = f"/uploads/profile_photos/{unique_filename}"
        
        # Update user's photo_url in database
        current_user.photo_url = photo_url
        db.commit()
        
        return {
            "message": "Profile photo uploaded successfully",
            "photo_url": photo_url
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )


@router.get("/profile-photo/{filename}")
async def get_profile_photo(filename: str):
    """Serve profile photos (for local development)"""
    from fastapi.responses import FileResponse
    
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found"
        )
    
    return FileResponse(file_path)
