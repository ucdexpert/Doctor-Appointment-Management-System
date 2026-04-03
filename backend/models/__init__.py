# Import all models
from models.user import User
from models.doctor import Doctor
from models.schedule import Schedule
from models.appointment import Appointment
from models.review import Review
from models.chat import ChatSession, ChatMessage
from models.favorite import Favorite
from models.search_history import SearchHistory
from models.notification import Notification

__all__ = [
    "User",
    "Doctor",
    "Schedule",
    "Appointment",
    "Review",
    "ChatSession",
    "ChatMessage",
    "Favorite",
    "SearchHistory",
    "Notification",
]
