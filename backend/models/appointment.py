from sqlalchemy import Column, Integer, String, Text, ForeignKey, DATE, Time, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"))
    doctor_id = Column(Integer, ForeignKey("doctors.id"))
    appointment_date = Column(DATE, nullable=False)
    time_slot = Column(Time, nullable=False)
    reason = Column(Text)
    status = Column(String(20), default="pending")  # 'pending', 'confirmed', 'cancelled', 'completed'
    appointment_type = Column(String(20), default="in-person")  # 'in-person', 'video'
    call_duration = Column(Integer, default=0)  # Duration in seconds
    call_started_at = Column(DateTime, nullable=True)  # When video call started
    cancel_reason = Column(Text)
    notes = Column(Text)  # doctor's prescription/advice
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient = relationship("User", foreign_keys=[patient_id], back_populates="appointments_patient")
    doctor = relationship("Doctor", back_populates="appointments")
    review = relationship("Review", back_populates="appointment", uselist=False)
