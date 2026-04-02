from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import Appointment, Doctor, User
from schemas import AppointmentCreate, AppointmentResponse, AppointmentStatusUpdate
from middleware.auth import require_role
from datetime import datetime

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(
    appointment_data: AppointmentCreate,
    current_user: User = Depends(require_role("patient")),
    db: Session = Depends(get_db)
):
    """Book a new appointment"""
    
    # Check if doctor exists
    doctor = db.query(Doctor).filter(Doctor.id == appointment_data.doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    if not doctor.is_approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor is not approved yet"
        )
    
    # Check if slot is already booked
    from datetime import datetime
    try:
        appt_date = datetime.strptime(appointment_data.appointment_date, "%Y-%m-%d").date()
        appt_time = datetime.strptime(appointment_data.time_slot, "%H:%M").time()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date or time format"
        )
    
    existing = db.query(Appointment).filter(
        Appointment.doctor_id == appointment_data.doctor_id,
        Appointment.appointment_date == appt_date,
        Appointment.time_slot == appt_time,
        Appointment.status.in_(["pending", "confirmed"])
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This time slot is already booked"
        )
    
    # Create appointment
    new_appointment = Appointment(
        patient_id=current_user.id,
        doctor_id=appointment_data.doctor_id,
        appointment_date=appt_date,
        time_slot=appt_time,
        reason=appointment_data.reason,
        status="pending"
    )
    
    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)
    
    return new_appointment


@router.get("/my", response_model=List[AppointmentResponse])
def get_my_appointments(
    status_filter: Optional[str] = None,
    current_user: User = Depends(require_role("patient")),
    db: Session = Depends(get_db)
):
    """Get patient's own appointments"""
    
    query = db.query(Appointment).filter(Appointment.patient_id == current_user.id)
    
    if status_filter:
        query = query.filter(Appointment.status == status_filter)
    
    appointments = query.order_by(Appointment.appointment_date.desc()).all()
    return appointments


@router.get("/doctor", response_model=List[AppointmentResponse])
def get_doctor_appointments(
    date_filter: Optional[str] = None,
    current_user: User = Depends(require_role("doctor")),
    db: Session = Depends(get_db)
):
    """Get doctor's appointments"""
    
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found"
        )
    
    query = db.query(Appointment).filter(Appointment.doctor_id == doctor.id)
    
    if date_filter:
        try:
            filter_date = datetime.strptime(date_filter, "%Y-%m-%d").date()
            query = query.filter(Appointment.appointment_date == filter_date)
        except ValueError:
            pass
    
    appointments = query.order_by(Appointment.appointment_date.desc()).all()
    return appointments


@router.put("/{appointment_id}/confirm", response_model=AppointmentResponse)
def confirm_appointment(
    appointment_id: int,
    current_user: User = Depends(require_role("doctor")),
    db: Session = Depends(get_db)
):
    """Confirm an appointment"""
    
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found"
        )
    
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.doctor_id == doctor.id
    ).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    appointment.status = "confirmed"
    db.commit()
    db.refresh(appointment)
    
    return appointment


@router.put("/{appointment_id}/cancel", response_model=AppointmentResponse)
def cancel_appointment(
    appointment_id: int,
    cancel_data: dict,
    current_user: User = Depends(require_role("patient")),
    db: Session = Depends(get_db)
):
    """Cancel an appointment"""
    
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.patient_id == current_user.id
    ).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    if appointment.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel completed appointment"
        )
    
    appointment.status = "cancelled"
    appointment.cancel_reason = cancel_data.get("reason")
    db.commit()
    db.refresh(appointment)
    
    return appointment


@router.put("/{appointment_id}/complete", response_model=AppointmentResponse)
def complete_appointment(
    appointment_id: int,
    current_user: User = Depends(require_role("doctor")),
    db: Session = Depends(get_db)
):
    """Mark appointment as completed"""
    
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found"
        )
    
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.doctor_id == doctor.id
    ).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    appointment.status = "completed"
    db.commit()
    db.refresh(appointment)
    
    return appointment


@router.put("/{appointment_id}/notes", response_model=AppointmentResponse)
def add_notes(
    appointment_id: int,
    notes_data: dict,
    current_user: User = Depends(require_role("doctor")),
    db: Session = Depends(get_db)
):
    """Add prescription/notes to appointment"""
    
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found"
        )
    
    appointment = db.query(Appointment).filter(
        Appointment.id == appointment_id,
        Appointment.doctor_id == doctor.id
    ).first()
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    appointment.notes = notes_data.get("notes")
    db.commit()
    db.refresh(appointment)
    
    return appointment
