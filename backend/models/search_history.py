from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


class SearchHistory(Base):
    __tablename__ = "search_history"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    search_query = Column(String(200), nullable=False)
    filters = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("User", back_populates="search_history")
