from sqlalchemy import Column, Integer, String, Boolean, DateTime, DECIMAL, Text, ForeignKey, Time, DATE, UniqueConstraint
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
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    doctor_profile = relationship("Doctor", back_populates="user", uselist=False)
    appointments_patient = relationship("Appointment", foreign_keys="Appointment.patient_id", back_populates="patient")
    reviews = relationship("Review", back_populates="patient")
    chat_sessions = relationship("ChatSession", back_populates="user")


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


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"))
    day_of_week = Column(String(10), nullable=False)  # 'Monday', 'Tuesday', etc.
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    slot_duration = Column(Integer, default=30)  # minutes: 15, 30, or 60
    is_available = Column(Boolean, default=True)

    # Relationships
    doctor = relationship("Doctor", back_populates="schedules")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    appointment_date = Column(DATE, nullable=False)
    time_slot = Column(Time, nullable=False)
    reason = Column(Text)
    status = Column(String(20), default="pending")  # 'pending', 'confirmed', 'cancelled', 'completed'
    cancel_reason = Column(Text)
    notes = Column(Text)  # doctor's prescription/advice
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient = relationship("User", foreign_keys=[patient_id], back_populates="appointments_patient")
    doctor = relationship("Doctor", back_populates="appointments")
    review = relationship("Review", back_populates="appointment", uselist=False)


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    appointment_id = Column(Integer, ForeignKey("appointments.id"), unique=True)
    rating = Column(Integer, nullable=False)
    comment = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient = relationship("User", back_populates="reviews")
    doctor = relationship("Doctor", back_populates="reviews")
    appointment = relationship("Appointment", back_populates="review")

    __table_args__ = (
        UniqueConstraint('patient_id', 'appointment_id', name='unique_patient_appointment_review'),
    )


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(200))  # auto-generated from first message
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"))
    role = Column(String(10), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    session = relationship("ChatSession", back_populates="messages")
