from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import Doctor, User, Appointment, Review
from schemas import DoctorResponse, UserResponse, AdminStats, MessageResponse, BanUser
from middleware.auth import require_role
from datetime import datetime, timedelta
from utils.email import send_doctor_approved, send_doctor_rejected

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/doctors/pending", response_model=List[DoctorResponse])
def get_pending_doctors(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Get all doctors pending approval"""

    doctors = db.query(Doctor).filter(
        Doctor.is_approved == False,
        Doctor.rejection_reason == None
    ).order_by(Doctor.created_at.desc()).all()

    return doctors


@router.put("/doctors/{doctor_id}/approve", response_model=MessageResponse)
def approve_doctor(
    doctor_id: int,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Approve a doctor's profile"""

    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()

    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )

    if doctor.is_approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor is already approved"
        )

    doctor.is_approved = True
    doctor.rejection_reason = None
    db.commit()

    # Send approval email
    user = db.query(User).filter(User.id == doctor.user_id).first()
    if user:
        try:
            send_doctor_approved(user.email, user.name)
        except Exception as e:
            print(f"Failed to send approval email: {e}")

    return {"message": f"Dr. {user.name if user else 'Doctor'} approved successfully"}


@router.put("/doctors/{doctor_id}/reject", response_model=MessageResponse)
def reject_doctor(
    doctor_id: int,
    rejection_data: dict,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Reject a doctor's profile"""

    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()

    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )

    reason = rejection_data.get("reason", "No reason provided")
    doctor.is_approved = False
    doctor.rejection_reason = reason
    db.commit()

    # Send rejection email
    user = db.query(User).filter(User.id == doctor.user_id).first()
    if user:
        try:
            send_doctor_rejected(user.email, user.name, reason)
        except Exception as e:
            print(f"Failed to send rejection email: {e}")

    return {"message": "Doctor profile rejected"}


@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    role: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Get all users with optional filters"""

    query = db.query(User)

    if role:
        query = query.filter(User.role == role)

    if search:
        query = query.filter(
            User.name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        )

    users = query.order_by(User.created_at.desc()).all()
    return users


@router.put("/users/{user_id}/ban", response_model=MessageResponse)
def ban_user(
    user_id: int,
    ban_data: BanUser,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Ban a user"""

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot ban admin users"
        )

    user.is_banned = True
    db.commit()

    return {"message": f"User {user.name} has been banned"}


@router.put("/users/{user_id}/unban", response_model=MessageResponse)
def unban_user(
    user_id: int,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Unban a user"""

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user.is_banned = False
    db.commit()

    return {"message": f"User {user.name} has been unbanned"}


@router.delete("/users/{user_id}", response_model=MessageResponse)
def delete_user(
    user_id: int,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Delete a user permanently"""
    from models import Doctor, Appointment, Review, ChatSession, ChatMessage

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Prevent deleting admin users
    if user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete admin users"
        )

    # Prevent admins from deleting themselves
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete yourself"
        )

    try:
        # Get related doctor IDs
        doctor_ids = [d.id for d in db.query(Doctor).filter(Doctor.user_id == user_id).all()]

        # Delete in correct order (respecting foreign keys)
        # 1. Chat messages
        db.query(ChatMessage).filter(ChatMessage.session_id.in_(
            db.query(ChatSession.id).filter(ChatSession.user_id == user_id)
        )).delete(synchronize_session=False)

        # 2. Chat sessions
        db.query(ChatSession).filter(ChatSession.user_id == user_id).delete(synchronize_session=False)

        # 3. Appointments (patient)
        db.query(Appointment).filter(
            Appointment.patient_id == user_id
        ).delete(synchronize_session=False)

        # 4. Appointments (doctor) - if this user is a doctor
        if doctor_ids:
            db.query(Appointment).filter(
                Appointment.doctor_id.in_(doctor_ids)
            ).delete(synchronize_session=False)

            # 5. Reviews (for this doctor)
            db.query(Review).filter(
                Review.doctor_id.in_(doctor_ids)
            ).delete(synchronize_session=False)

        # 6. Reviews (written by this user)
        db.query(Review).filter(
            Review.patient_id == user_id
        ).delete(synchronize_session=False)

        # 7. Doctor profile
        db.query(Doctor).filter(Doctor.user_id == user_id).delete(synchronize_session=False)

        # 8. Finally delete user
        db.query(User).filter(User.id == user_id).delete(synchronize_session=False)

        db.commit()

        return {"message": f"User {user.name} has been deleted permanently"}

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {str(e)}"
        )


@router.get("/stats", response_model=AdminStats)
def get_admin_stats(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics for admin"""

    today = datetime.now().date()
    week_start = today - timedelta(days=today.weekday())
    month_start = today.replace(day=1)

    # Total counts
    total_patients = db.query(User).filter(User.role == "patient").count()
    total_doctors = db.query(Doctor).count()
    total_appointments_all = db.query(Appointment).count()

    # Today's appointments
    today_appointments = db.query(Appointment).filter(
        Appointment.appointment_date == today
    ).count()

    # Month appointments
    month_appointments = db.query(Appointment).filter(
        Appointment.appointment_date >= month_start
    ).count()

    # Popular specializations
    from sqlalchemy import func
    popular_specs = db.query(
        Doctor.specialization,
        func.count(Doctor.id).label('count')
    ).group_by(Doctor.specialization).order_by(
        func.count(Doctor.id).desc()
    ).limit(5).all()

    popular_specializations = [
        {"specialization": spec, "count": count}
        for spec, count in popular_specs
    ]

    # Recent registrations (last 10)
    recent_users = db.query(User).order_by(
        User.created_at.desc()
    ).limit(10).all()

    recent_registrations = [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "created_at": u.created_at.isoformat()
        }
        for u in recent_users
    ]

    return {
        "total_patients": total_patients,
        "total_doctors": total_doctors,
        "total_appointments_today": today_appointments,
        "total_appointments_month": month_appointments,
        "total_appointments_all": total_appointments_all,
        "popular_specializations": popular_specializations,
        "recent_registrations": recent_registrations
    }
