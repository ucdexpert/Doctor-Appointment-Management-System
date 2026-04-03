from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Review, Doctor, User, Appointment
from schemas import ReviewCreate, ReviewResponse
from middleware.auth import require_role

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(require_role("patient")),
    db: Session = Depends(get_db)
):
    """Submit a review for a doctor (after completed appointment)"""

    # Verify appointment exists and belongs to this patient
    appointment = db.query(Appointment).filter(
        Appointment.id == review_data.appointment_id,
        Appointment.patient_id == current_user.id
    ).first()

    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )

    # Check if appointment is completed
    if appointment.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only review completed appointments"
        )

    # Check if review already exists for this appointment
    existing_review = db.query(Review).filter(
        Review.appointment_id == review_data.appointment_id
    ).first()

    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reviewed this appointment"
        )

    # Create review
    new_review = Review(
        patient_id=current_user.id,
        doctor_id=review_data.doctor_id,
        appointment_id=review_data.appointment_id,
        rating=review_data.rating,
        comment=review_data.comment
    )

    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    # Update doctor's average rating
    doctor = db.query(Doctor).filter(Doctor.id == review_data.doctor_id).first()
    if doctor:
        # Get all reviews for this doctor
        all_reviews = db.query(Review).filter(Review.doctor_id == doctor.id).all()
        total_reviews = len(all_reviews)
        avg_rating = sum(r.rating for r in all_reviews) / total_reviews if total_reviews > 0 else 0

        doctor.avg_rating = round(avg_rating, 2)
        doctor.total_reviews = total_reviews
        db.commit()

    return new_review


@router.get("/doctor/{doctor_id}", response_model=List[ReviewResponse])
def get_doctor_reviews(
    doctor_id: int,
    db: Session = Depends(get_db)
):
    """Get all reviews for a specific doctor"""

    # Verify doctor exists
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )

    reviews = db.query(Review).filter(
        Review.doctor_id == doctor_id
    ).order_by(Review.created_at.desc()).all()

    return reviews
