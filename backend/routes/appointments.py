from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi.responses import StreamingResponse
from database import get_db
from models import Appointment, Doctor, User, Schedule
from schemas import AppointmentCreate, AppointmentResponse, AppointmentStatusUpdate
from middleware.auth import require_role
from utils.email import (
    send_appointment_confirmation,
    send_doctor_notification,
    send_appointment_cancelled
)
from utils.pdf_generator import create_prescription_pdf
from routes.notifications import create_notification
from datetime import datetime, date, time

router = APIRouter(prefix="/appointments", tags=["Appointments"])


def validate_appointment_slot(
    db: Session,
    doctor_id: int,
    appointment_date: date,
    appointment_time: time
) -> tuple[bool, str]:
    """
    Comprehensive validation for appointment booking.
    Returns (is_valid, error_message)
    """
    
    # 1. Check if date is in the past
    today = date.today()
    if appointment_date < today:
        return False, "Cannot book appointment for a past date"
    
    # 2. Check if slot is already booked (double booking prevention)
    existing = db.query(Appointment).filter(
        Appointment.doctor_id == doctor_id,
        Appointment.appointment_date == appointment_date,
        Appointment.time_slot == appointment_time,
        Appointment.status.in_(["pending", "confirmed"])
    ).first()
    
    if existing:
        return False, "This time slot is already booked"
    
    # 3. Check if doctor is available on this day of week
    day_name = appointment_date.strftime("%A")  # e.g., "Monday"
    schedule = db.query(Schedule).filter(
        Schedule.doctor_id == doctor_id,
        Schedule.day_of_week == day_name,
        Schedule.is_available == True
    ).first()
    
    if not schedule:
        return False, f"Doctor is not available on {day_name}"
    
    # 4. Check if requested time is within doctor's working hours
    start_time = schedule.start_time
    end_time = schedule.end_time
    
    if appointment_time < start_time or appointment_time >= end_time:
        return False, f"Requested time is outside doctor's working hours ({start_time.strftime('%H:%M')} - {end_time.strftime('%H:%M')})"
    
    # 5. Check if time aligns with slot duration (e.g., 15, 30, 60 min intervals)
    slot_duration = schedule.slot_duration
    minutes_since_start = (appointment_time.hour * 60 + appointment_time.minute) - (start_time.hour * 60 + start_time.minute)
    
    if minutes_since_start % slot_duration != 0:
        return False, f"Time slot must be in {slot_duration}-minute intervals"
    
    return True, ""


@router.post("", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(
    appointment_data: AppointmentCreate,
    current_user: User = Depends(require_role("patient")),
    db: Session = Depends(get_db)
):
    """Book a new appointment with comprehensive validation"""

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

    # Parse date and time
    try:
        appt_date = datetime.strptime(appointment_data.appointment_date, "%Y-%m-%d").date()
        appt_time = datetime.strptime(appointment_data.time_slot, "%H:%M").time()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date or time format. Use YYYY-MM-DD for date and HH:MM for time"
        )

    # Comprehensive slot validation
    is_valid, error_message = validate_appointment_slot(
        db, appointment_data.doctor_id, appt_date, appt_time
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
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

    # Create in-app notifications
    create_notification(
        db, current_user.id, "Appointment Booked",
        f"Your appointment with Dr. {doctor_name} on {appointment_data.appointment_date} at {appointment_data.time_slot} has been booked!",
        "success", f"/patient/appointments"
    )
    
    # Notify doctor
    if doctor_user:
        create_notification(
            db, doctor_user.id, "New Appointment",
            f"{current_user.name} has booked an appointment with you on {appointment_data.appointment_date} at {appointment_data.time_slot}",
            "info", f"/doctor/appointments"
        )

    # Send confirmation email to patient
    patient_email = current_user.email
    doctor_name = doctor.user.name if doctor.user else "Doctor"
    try:
        send_appointment_confirmation(
            patient_email=patient_email,
            doctor_name=doctor_name,
            date=appointment_data.appointment_date,
            time=appointment_data.time_slot
        )
    except Exception as e:
        print(f"Failed to send patient confirmation email: {e}")

    # Send notification email to doctor
    doctor_user = db.query(User).filter(User.id == doctor.user_id).first()
    if doctor_user:
        try:
            send_doctor_notification(
                doctor_email=doctor_user.email,
                patient_name=current_user.name,
                date=appointment_data.appointment_date,
                time=appointment_data.time_slot
            )
        except Exception as e:
            print(f"Failed to send doctor notification email: {e}")

    return new_appointment


@router.get("/stats")
def get_patient_stats(
    current_user: User = Depends(require_role("patient")),
    db: Session = Depends(get_db)
):
    """Get patient appointment statistics"""
    today = datetime.utcnow().date()

    total = db.query(Appointment).filter(
        Appointment.patient_id == current_user.id
    ).count()

    upcoming = db.query(Appointment).filter(
        Appointment.patient_id == current_user.id,
        Appointment.status == "confirmed",
        Appointment.appointment_date >= today
    ).count()

    completed = db.query(Appointment).filter(
        Appointment.patient_id == current_user.id,
        Appointment.status == "completed"
    ).count()

    cancelled = db.query(Appointment).filter(
        Appointment.patient_id == current_user.id,
        Appointment.status == "cancelled"
    ).count()

    return {
        "total": total,
        "upcoming": upcoming,
        "completed": completed,
        "cancelled": cancelled
    }


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
    current_user: User = Depends(require_role("patient", "doctor")),
    db: Session = Depends(get_db)
):
    """Cancel an appointment (by patient or doctor)"""

    # Check if user is patient or doctor
    if current_user.role == "patient":
        appointment = db.query(Appointment).filter(
            Appointment.id == appointment_id,
            Appointment.patient_id == current_user.id
        ).first()
        cancel_by = current_user.name
    elif current_user.role == "doctor":
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
        cancel_by = f"Dr. {current_user.name}"
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patient or doctor can cancel appointment"
        )

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

    # Send cancellation email to patient
    patient = db.query(User).filter(User.id == appointment.patient_id).first()
    if patient:
        try:
            send_appointment_cancelled(
                recipient_email=patient.email,
                recipient_name=patient.name,
                cancel_by=cancel_by,
                date=appointment.appointment_date.strftime("%Y-%m-%d"),
                time=appointment.time_slot.strftime("%H:%M"),
                reason=appointment.cancel_reason
            )
        except Exception as e:
            print(f"Failed to send patient cancellation email: {e}")

    # Send cancellation email to doctor (if cancelled by patient)
    if current_user.role == "patient":
        doctor = db.query(Doctor).filter(Doctor.id == appointment.doctor_id).first()
        if doctor:
            doctor_user = db.query(User).filter(User.id == doctor.user_id).first()
            if doctor_user:
                try:
                    send_appointment_cancelled(
                        recipient_email=doctor_user.email,
                        recipient_name=f"Dr. {doctor_user.name}",
                        cancel_by=patient.name,
                        date=appointment.appointment_date.strftime("%Y-%m-%d"),
                        time=appointment.time_slot.strftime("%H:%M"),
                        reason=appointment.cancel_reason
                    )
                except Exception as e:
                    print(f"Failed to send doctor cancellation email: {e}")
    elif current_user.role == "doctor":
        # Patient ko bhi inform karo
        if patient:
            try:
                send_appointment_cancelled(
                    recipient_email=patient.email,
                    recipient_name=patient.name,
                    cancel_by=cancel_by,
                    date=appointment.appointment_date.strftime("%Y-%m-%d"),
                    time=appointment.time_slot.strftime("%H:%M"),
                    reason=appointment.cancel_reason
                )
            except Exception as e:
                print(f"Failed to send patient cancellation email: {e}")

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


@router.get("/{appointment_id}/prescription-pdf")
def download_prescription_pdf(
    appointment_id: int,
    current_user: User = Depends(require_role("patient", "doctor")),
    db: Session = Depends(get_db)
):
    """
    Download prescription as PDF
    Accessible by patient or doctor of the appointment
    """
    
    # Get appointment
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Verify user is patient or doctor
    is_patient = (appointment.patient_id == current_user.id)
    is_doctor = False
    
    if current_user.role == "doctor":
        doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
        is_doctor = doctor and appointment.doctor_id == doctor.id
    
    if not is_patient and not is_doctor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this prescription"
        )
    
    # Check if appointment has notes
    if not appointment.notes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No prescription available for this appointment"
        )
    
    # Get patient info
    patient = db.query(User).filter(User.id == appointment.patient_id).first()
    patient_name = patient.name if patient else "Unknown Patient"
    
    # Get doctor info
    doctor = db.query(Doctor).filter(Doctor.id == appointment.doctor_id).first()
    doctor_user = db.query(User).filter(User.id == doctor.user_id).first() if doctor else None
    
    doctor_name = doctor_user.name if doctor_user else "Doctor"
    specialization = doctor.specialization if doctor else "General"
    qualification = doctor.qualification if doctor else "MBBS"
    
    # Format appointment date
    appt_date = appointment.appointment_date.strftime("%Y-%m-%d") if hasattr(appointment.appointment_date, 'strftime') else str(appointment.appointment_date)
    
    # Generate PDF
    pdf_buffer = create_prescription_pdf(
        doctor_name=doctor_name,
        specialization=specialization,
        qualification=qualification,
        patient_name=patient_name,
        appointment_date=appt_date,
        prescription_notes=appointment.notes
    )
    
    # Return PDF as download
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=prescription_{appointment_id}.pdf"
        }
    )
