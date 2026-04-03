from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Favorite, Doctor, User
from middleware.auth import require_role
from pydantic import BaseModel

router = APIRouter(prefix="/favorites", tags=["Favorites"])


class FavoriteResponse(BaseModel):
    id: int
    doctor_id: int
    created_at: str

    class Config:
        from_attributes = True


@router.post("/{doctor_id}", status_code=status.HTTP_201_CREATED)
def add_to_favorites(
    doctor_id: int,
    current_user: User = Depends(require_role("patient")),
    db: Session = Depends(get_db)
):
    """Add a doctor to favorites"""

    # Check if doctor exists
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found"
        )

    # Check if already favorited
    existing = db.query(Favorite).filter(
        Favorite.patient_id == current_user.id,
        Favorite.doctor_id == doctor_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Doctor already in favorites"
        )

    # Add to favorites
    favorite = Favorite(
        patient_id=current_user.id,
        doctor_id=doctor_id
    )

    db.add(favorite)
    db.commit()
    db.refresh(favorite)

    return {"message": "Doctor added to favorites", "favorite_id": favorite.id}


@router.delete("/{doctor_id}")
def remove_from_favorites(
    doctor_id: int,
    current_user: User = Depends(require_role("patient")),
    db: Session = Depends(get_db)
):
    """Remove a doctor from favorites"""

    favorite = db.query(Favorite).filter(
        Favorite.patient_id == current_user.id,
        Favorite.doctor_id == doctor_id
    ).first()

    if not favorite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite not found"
        )

    db.delete(favorite)
    db.commit()

    return {"message": "Doctor removed from favorites"}


@router.get("/my", response_model=List[dict])
def get_my_favorites(
    current_user: User = Depends(require_role("patient")),
    db: Session = Depends(get_db)
):
    """Get all favorite doctors"""

    favorites = db.query(Favorite).filter(
        Favorite.patient_id == current_user.id
    ).all()

    result = []
    for fav in favorites:
        doctor = db.query(Doctor).filter(Doctor.id == fav.doctor_id).first()
        if doctor:
            result.append({
                "id": fav.id,
                "doctor_id": doctor.id,
                "created_at": fav.created_at.isoformat(),
                "doctor": {
                    "id": doctor.id,
                    "specialization": doctor.specialization,
                    "qualification": doctor.qualification,
                    "experience_years": doctor.experience_years,
                    "consultation_fee": str(doctor.consultation_fee),
                    "city": doctor.city,
                    "bio": doctor.bio,
                    "avg_rating": str(doctor.avg_rating),
                    "total_reviews": doctor.total_reviews,
                    "is_approved": doctor.is_approved
                }
            })

    return result


@router.get("/check/{doctor_id}")
def check_if_favorited(
    doctor_id: int,
    current_user: User = Depends(require_role("patient")),
    db: Session = Depends(get_db)
):
    """Check if a doctor is in favorites"""

    favorite = db.query(Favorite).filter(
        Favorite.patient_id == current_user.id,
        Favorite.doctor_id == doctor_id
    ).first()

    return {"is_favorited": favorite is not None}
