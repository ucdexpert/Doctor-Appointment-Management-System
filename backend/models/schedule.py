from sqlalchemy import Column, Integer, String, Boolean, Time, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


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
