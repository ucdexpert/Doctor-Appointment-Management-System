from sqlalchemy import Column, Integer, String, Boolean, DateTime, DECIMAL, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    specialization = Column(String(100), nullable=False)
    qualification = Column(String(200))
    experience_years = Column(Integer, default=0)
    consultation_fee = Column(DECIMAL(10, 2), nullable=False)
    bio = Column(Text)
    city = Column(String(100))
    is_approved = Column(Boolean, default=False)
    rejection_reason = Column(Text)
    avg_rating = Column(DECIMAL(3, 2), default=0.0)
    total_reviews = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="doctor_profile")
    schedules = relationship("Schedule", back_populates="doctor", cascade="all, delete-orphan")
    appointments = relationship("Appointment", back_populates="doctor")
    reviews = relationship("Review", back_populates="doctor")
