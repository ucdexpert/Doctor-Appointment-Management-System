from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import Doctor, User
from schemas import DoctorCreate, DoctorUpdate, DoctorResponse, MessageResponse
from middleware.auth import get_current_user, require_role
from pydantic import BaseModel
import math

router = APIRouter(prefix="/doctors", tags=["Doctors"])


class DoctorSearchFilters(BaseModel):
    search: Optional[str] = None
    specialization: Optional[str] = None
    city: Optional[str] = None
    min_fee: Optional[float] = None
    max_fee: Optional[float] = None
    day: Optional[str] = None
    sort_by: Optional[str] = None  # 'rating', 'experience', 'fee'


class PaginatedDoctorsResponse(BaseModel):
    doctors: List[DoctorResponse]
    total: int
    page: int
    limit: int
    pages: int


@router.get("", response_model=PaginatedDoctorsResponse)
def get_all_doctors(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    search: Optional[str] = None,
    specialization: Optional[str] = None,
    city: Optional[str] = None,
    min_fee: Optional[float] = None,
    max_fee: Optional[float] = None,
    day: Optional[str] = None,
    sort_by: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get all approved doctors with optional filters and pagination"""

    # Base query - only approved doctors
    query = db.query(Doctor).filter(Doctor.is_approved == True)

    # Apply filters
    if search:
        query = query.join(User).filter(
            User.name.ilike(f"%{search}%") | Doctor.specialization.ilike(f"%{search}%")
        )

    if specialization:
        query = query.filter(Doctor.specialization == specialization)

    if city:
        query = query.filter(Doctor.city == city)

    if min_fee is not None:
        query = query.filter(Doctor.consultation_fee >= min_fee)

    if max_fee is not None:
        query = query.filter(Doctor.consultation_fee <= max_fee)

    # Sorting
    if sort_by == "rating":
        query = query.order_by(Doctor.avg_rating.desc())
    elif sort_by == "experience":
        query = query.order_by(Doctor.experience_years.desc())
    elif sort_by == "fee":
        query = query.order_by(Doctor.consultation_fee.asc())
    else:
        query = query.order_by(Doctor.created_at.desc())

    # Get total count before pagination
    total = query.count()

    # Calculate pages
    total_pages = math.ceil(total / limit) if total > 0 else 0

    # Apply pagination
    offset = (page - 1) * limit
    doctors = query.offset(offset).limit(limit).all()

    return {
        "doctors": doctors,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": total_pages
    }


@router.get("/{doctor_id}", response_model=DoctorResponse)
def get_doctor_by_id(doctor_id: int, db: Session = Depends(get_db)):
    """Get single doctor by ID with reviews and schedule"""
    
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )
    
    if not doctor.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor profile is pending approval"
        )
    
    return doctor


@router.post("/profile", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
def create_doctor_profile(
    doctor_data: DoctorCreate,
    current_user: User = Depends(require_role("doctor")),
    db: Session = Depends(get_db)
):
    """Create doctor profile (for newly registered doctors)"""
    
    # Check if doctor profile already exists
    existing_doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    
    if existing_doctor:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor profile already exists"
        )
    
    # Create new doctor profile
    new_doctor = Doctor(
        user_id=current_user.id,
        specialization=doctor_data.specialization,
        qualification=doctor_data.qualification,
        experience_years=doctor_data.experience_years,
        consultation_fee=doctor_data.consultation_fee,
        bio=doctor_data.bio,
        city=doctor_data.city,
        is_approved=False  # Pending admin approval
    )
    
    db.add(new_doctor)
    db.commit()
    db.refresh(new_doctor)
    
    return new_doctor


@router.put("/profile", response_model=DoctorResponse)
def update_doctor_profile(
    doctor_data: DoctorUpdate,
    current_user: User = Depends(require_role("doctor")),
    db: Session = Depends(get_db)
):
    """Update doctor profile"""
    
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found"
        )
    
    # Update fields
    if doctor_data.specialization is not None:
        doctor.specialization = doctor_data.specialization
    if doctor_data.qualification is not None:
        doctor.qualification = doctor_data.qualification
    if doctor_data.experience_years is not None:
        doctor.experience_years = doctor_data.experience_years
    if doctor_data.consultation_fee is not None:
        doctor.consultation_fee = doctor_data.consultation_fee
    if doctor_data.bio is not None:
        doctor.bio = doctor_data.bio
    if doctor_data.city is not None:
        doctor.city = doctor_data.city
    
    db.commit()
    db.refresh(doctor)
    
    return doctor


@router.get("/my/dashboard")
def get_doctor_dashboard(
    current_user: User = Depends(require_role("doctor")),
    db: Session = Depends(get_db)
):
    """Get doctor's dashboard statistics"""
    
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found"
        )
    
    # Get appointment counts
    from models import Appointment
    from datetime import datetime, timedelta
    
    today = datetime.now().date()
    week_start = today - timedelta(days=today.weekday())
    
    total_appointments = db.query(Appointment).filter(
        Appointment.doctor_id == doctor.id
    ).count()
    
    today_appointments = db.query(Appointment).filter(
        Appointment.doctor_id == doctor.id,
        Appointment.appointment_date == today
    ).count()
    
    week_appointments = db.query(Appointment).filter(
        Appointment.doctor_id == doctor.id,
        Appointment.appointment_date >= week_start
    ).count()
    
    return {
        "doctor": doctor,
        "stats": {
            "total_appointments": total_appointments,
            "today_appointments": today_appointments,
            "week_appointments": week_appointments,
            "total_patients": db.query(Appointment).filter(
                Appointment.doctor_id == doctor.id
            ).distinct(Appointment.patient_id).count(),
            "avg_rating": float(doctor.avg_rating),
            "total_reviews": doctor.total_reviews
        }
    }


@router.get("/{doctor_id}/slots")
def get_available_slots(
    doctor_id: int,
    date: str,  # Format: YYYY-MM-DD
    db: Session = Depends(get_db)
):
    """Get available time slots for a doctor on a specific date"""

    from datetime import datetime, time, timedelta
    from models import Schedule, Appointment

    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()

    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )

    # Parse the date
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
        day_name = target_date.strftime("%A")
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use YYYY-MM-DD"
        )

    # Get doctor's schedule for that day of week
    schedule = db.query(Schedule).filter(
        Schedule.doctor_id == doctor_id,
        Schedule.day_of_week == day_name,
        Schedule.is_available == True
    ).first()

    if not schedule:
        return {"slots": [], "message": "Doctor not available on this day"}

    # Generate all possible slots
    start_datetime = datetime.combine(target_date, schedule.start_time)
    end_datetime = datetime.combine(target_date, schedule.end_time)
    slot_duration = timedelta(minutes=schedule.slot_duration)

    all_slots = []
    current_time = start_datetime

    while current_time + slot_duration <= end_datetime:
        all_slots.append(current_time.time().strftime("%H:%M"))
        current_time += slot_duration

    # Get already booked slots for this date
    booked_appointments = db.query(Appointment).filter(
        Appointment.doctor_id == doctor_id,
        Appointment.appointment_date == target_date,
        Appointment.status.in_(["pending", "confirmed"])
    ).all()

    booked_slots = [apt.time_slot.strftime("%H:%M") for apt in booked_appointments]

    # Filter out booked slots
    available_slots = [slot for slot in all_slots if slot not in booked_slots]

    return {
        "date": date,
        "doctor_id": doctor_id,
        "slots": available_slots,
        "slot_duration": schedule.slot_duration
    }


@router.get("/recommendations/quick-book")
def get_quick_book_recommendations(
    current_user: User = Depends(require_role("patient")),
    db: Session = Depends(get_db)
):
    """
    Smart recommendations for quick booking:
    - Doctors available within next 2 hours
    - Based on patient's search history
    - Top-rated doctors in patient's city
    """
    from datetime import datetime, timedelta, time as dtime
    from models import SearchHistory, Schedule, Appointment

    # Get patient's most searched specializations
    search_history = db.query(SearchHistory).filter(
        SearchHistory.patient_id == current_user.id
    ).order_by(SearchHistory.created_at.desc()).limit(10).all()

    # Extract preferred specializations from search history
    preferred_specs = []
    for search in search_history:
        if search.search_query:
            preferred_specs.append(search.search_query.lower())

    # Get today's date and current time
    now = datetime.now()
    today = now.date()
    today_name = today.strftime("%A")
    current_time = now.time()
    two_hours_later = (now + timedelta(hours=2)).time()

    # Find doctors available within next 2 hours
    doctors_query = db.query(Doctor, User).join(User, Doctor.user_id == User.id)
    doctors_query = doctors_query.filter(Doctor.is_approved == True)

    recommendations = []

    for doctor, user in doctors_query.all():
        # Check if doctor has schedule for today
        schedule = db.query(Schedule).filter(
            Schedule.doctor_id == doctor.id,
            Schedule.day_of_week == today_name,
            Schedule.is_available == True
        ).first()

        if not schedule:
            continue

        # Check if there are available slots within next 2 hours
        start_datetime = datetime.combine(today, schedule.start_time)
        end_datetime = datetime.combine(today, schedule.end_time)
        slot_duration = timedelta(minutes=schedule.slot_duration)

        # Count available slots in next 2 hours
        available_count = 0
        current_slot = start_datetime if start_datetime.time() > current_time else datetime.combine(today, current_time)

        while current_slot + slot_duration <= end_datetime and current_slot.time() <= two_hours_later:
            # Check if slot is booked
            existing = db.query(Appointment).filter(
                Appointment.doctor_id == doctor.id,
                Appointment.appointment_date == today,
                Appointment.time_slot == current_slot.time(),
                Appointment.status.in_(["pending", "confirmed"])
            ).first()

            if not existing:
                available_count += 1

            current_slot += slot_duration

        if available_count > 0:
            # Calculate score based on multiple factors
            score = 0

            # Rating factor (0-40 points)
            score += float(doctor.avg_rating) * 8

            # Availability factor (0-30 points)
            score += min(available_count * 10, 30)

            # Search history match (0-30 points)
            if doctor.specialization.lower() in preferred_specs:
                score += 30

            recommendations.append({
                "doctor_id": doctor.id,
                "doctor_name": user.name,
                "specialization": doctor.specialization,
                "city": doctor.city,
                "consultation_fee": float(doctor.consultation_fee),
                "avg_rating": float(doctor.avg_rating),
                "experience_years": doctor.experience_years,
                "available_slots_today": available_count,
                "recommendation_score": score,
                "reason": "Available today" if doctor.specialization.lower() not in preferred_specs else "Matches your search history"
            })

    # Sort by recommendation score
    recommendations.sort(key=lambda x: x["recommendation_score"], reverse=True)

    # Return top 5
    return {
        "recommendations": recommendations[:5],
        "total_found": len(recommendations),
        "generated_at": now.isoformat()
    }
