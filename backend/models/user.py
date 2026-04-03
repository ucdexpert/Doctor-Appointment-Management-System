from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    role = Column(String(20), default="patient")  # 'patient', 'doctor', 'admin'
    phone = Column(String(20))
    photo_url = Column(Text)
    is_active = Column(Boolean, default=True)
    is_banned = Column(Boolean, default=False)
    reset_token = Column(String(100), unique=True, index=True)
    reset_token_expiry = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships - defined in other model files
    doctor_profile = relationship("Doctor", back_populates="user", uselist=False)
    appointments_patient = relationship("Appointment", foreign_keys="Appointment.patient_id", back_populates="patient")
    reviews = relationship("Review", back_populates="patient")
    chat_sessions = relationship("ChatSession", back_populates="user")
    favorites = relationship("Favorite", back_populates="patient", cascade="all, delete-orphan")
    search_history = relationship("SearchHistory", back_populates="patient", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
