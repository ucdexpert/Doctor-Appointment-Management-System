from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Schedule, Doctor
from schemas import ScheduleCreate, ScheduleUpdate, ScheduleResponse
from middleware.auth import require_role
from models import User

router = APIRouter(prefix="/schedules", tags=["Schedules"])


@router.get("/my")
def get_my_schedule(
    current_user: User = Depends(require_role("doctor")),
    db: Session = Depends(get_db)
):
    """Get doctor's own schedule"""
    
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found"
        )
    
    schedules = db.query(Schedule).filter(
        Schedule.doctor_id == doctor.id
    ).all()
    
    # Convert time to string manually
    result = []
    for s in schedules:
        result.append({
            "id": s.id,
            "doctor_id": s.doctor_id,
            "day_of_week": s.day_of_week,
            "start_time": s.start_time.strftime('%H:%M') if s.start_time else None,
            "end_time": s.end_time.strftime('%H:%M') if s.end_time else None,
            "slot_duration": s.slot_duration,
            "is_available": s.is_available
        })
    
    return result


@router.post("", status_code=status.HTTP_201_CREATED)
def create_schedule(
    schedule_data: ScheduleCreate,
    current_user: User = Depends(require_role("doctor")),
    db: Session = Depends(get_db)
):
    """Add new schedule day"""
    
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found"
        )
    
    # Check if schedule for this day already exists
    existing = db.query(Schedule).filter(
        Schedule.doctor_id == doctor.id,
        Schedule.day_of_week == schedule_data.day_of_week
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Schedule for {schedule_data.day_of_week} already exists. Update it instead."
        )
    
    # Create new schedule
    new_schedule = Schedule(
        doctor_id=doctor.id,
        day_of_week=schedule_data.day_of_week,
        start_time=schedule_data.start_time,
        end_time=schedule_data.end_time,
        slot_duration=schedule_data.slot_duration,
        is_available=schedule_data.is_available
    )
    
    db.add(new_schedule)
    db.commit()
    db.refresh(new_schedule)
    
    # Return with time as string
    return {
        "id": new_schedule.id,
        "doctor_id": new_schedule.doctor_id,
        "day_of_week": new_schedule.day_of_week,
        "start_time": new_schedule.start_time.strftime('%H:%M') if new_schedule.start_time else None,
        "end_time": new_schedule.end_time.strftime('%H:%M') if new_schedule.end_time else None,
        "slot_duration": new_schedule.slot_duration,
        "is_available": new_schedule.is_available
    }


@router.put("/{schedule_id}")
def update_schedule(
    schedule_id: int,
    schedule_data: ScheduleUpdate,
    current_user: User = Depends(require_role("doctor")),
    db: Session = Depends(get_db)
):
    """Update existing schedule"""
    
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found"
        )
    
    schedule = db.query(Schedule).filter(
        Schedule.id == schedule_id,
        Schedule.doctor_id == doctor.id
    ).first()
    
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found"
        )
    
    # Update fields
    if schedule_data.start_time is not None:
        schedule.start_time = schedule_data.start_time
    if schedule_data.end_time is not None:
        schedule.end_time = schedule_data.end_time
    if schedule_data.slot_duration is not None:
        schedule.slot_duration = schedule_data.slot_duration
    if schedule_data.is_available is not None:
        schedule.is_available = schedule_data.is_available
    
    db.commit()
    db.refresh(schedule)
    
    # Return with time as string
    return {
        "id": schedule.id,
        "doctor_id": schedule.doctor_id,
        "day_of_week": schedule.day_of_week,
        "start_time": schedule.start_time.strftime('%H:%M') if schedule.start_time else None,
        "end_time": schedule.end_time.strftime('%H:%M') if schedule.end_time else None,
        "slot_duration": schedule.slot_duration,
        "is_available": schedule.is_available
    }


@router.delete("/{schedule_id}")
def delete_schedule(
    schedule_id: int,
    current_user: User = Depends(require_role("doctor")),
    db: Session = Depends(get_db)
):
    """Delete schedule"""
    
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found"
        )
    
    schedule = db.query(Schedule).filter(
        Schedule.id == schedule_id,
        Schedule.doctor_id == doctor.id
    ).first()
    
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Schedule not found"
        )
    
    db.delete(schedule)
    db.commit()
    
    return {"message": "Schedule deleted successfully"}
