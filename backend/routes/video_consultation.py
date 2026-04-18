"""
Video Consultation - Jitsi Integration
Simple version without JWT (using free meet.jit.si public server)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User, Appointment, Doctor
from middleware.auth import require_role
from datetime import datetime
import os

router = APIRouter(prefix="/api/video", tags=["Video Consultation"])

# Jitsi configuration - using FREE public server
JITSI_DOMAIN = os.getenv("JITSI_DOMAIN", "meet.jit.si")

@router.get("/room/{appointment_id}")
def get_video_room(
    appointment_id: int,
    current_user: User = Depends(require_role("patient", "doctor")),
    db: Session = Depends(get_db)
):
    """Get video consultation room details - FREE version (no JWT required)"""
    
    # Get appointment
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Verify user is patient or doctor of this appointment
    is_patient = (appointment.patient_id == current_user.id)
    is_doctor = False
    
    if current_user.role == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        is_doctor = doctor and appointment.doctor_id == doctor.id
    
    if not is_patient and not is_doctor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this appointment"
        )
    
    # Check if appointment is video type
    if appointment.appointment_type != "video":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This is not a video consultation appointment"
        )
    
    # Generate unique room name
    room_name = f"MediConnect-apt-{appointment_id}"
    
    return {
        "room_name": room_name,
        "domain": JITSI_DOMAIN,
        "user_name": current_user.name,
        "user_email": current_user.email,
        "is_doctor": is_doctor,
        "appointment_id": appointment_id,
        "jwt_required": False  # Public server doesn't need JWT
    }
