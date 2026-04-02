from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from typing import Optional
from datetime import datetime
from decimal import Decimal


# ============== USER SCHEMAS ==============

class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    photo_url: Optional[str] = None


class UserRegister(UserBase):
    password: str = Field(..., min_length=6, max_length=255)
    role: str = Field(default="patient", pattern="^(patient|doctor|admin)$")


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    role: str
    is_active: bool
    created_at: datetime


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = None
    photo_url: Optional[str] = None


class ChangePassword(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=6, max_length=255)


# ============== TOKEN SCHEMAS ==============

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    user_id: Optional[int] = None


# ============== DOCTOR SCHEMAS ==============

class DoctorBase(BaseModel):
    specialization: str = Field(..., max_length=100)
    qualification: Optional[str] = Field(None, max_length=200)
    experience_years: int = Field(default=0, ge=0)
    consultation_fee: Decimal = Field(..., ge=0)
    bio: Optional[str] = None
    city: Optional[str] = Field(None, max_length=100)


class DoctorCreate(DoctorBase):
    pass


class DoctorUpdate(DoctorBase):
    pass


class DoctorResponse(DoctorBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    is_approved: bool
    rejection_reason: Optional[str] = None
    avg_rating: Decimal
    total_reviews: int
    created_at: datetime
    
    user: Optional[UserResponse] = None


class DoctorApproval(BaseModel):
    is_approved: bool
    rejection_reason: Optional[str] = None


# ============== SCHEDULE SCHEMAS ==============

class ScheduleBase(BaseModel):
    day_of_week: str = Field(..., pattern="^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$")
    start_time: str = Field(..., pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")  # HH:MM format
    end_time: str = Field(..., pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    slot_duration: int = Field(default=30, ge=15, le=60)
    is_available: bool = True


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(BaseModel):
    start_time: Optional[str] = Field(None, pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    end_time: Optional[str] = Field(None, pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    slot_duration: Optional[int] = Field(None, ge=15, le=60)
    is_available: Optional[bool] = None


class ScheduleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    doctor_id: int
    day_of_week: str
    start_time: str
    end_time: str
    slot_duration: int
    is_available: bool
    
    # Custom serializer for time fields
    def model_dump(self, **kwargs):
        data = super().model_dump(**kwargs)
        # Convert time objects to strings
        if hasattr(data.get('start_time'), 'strftime'):
            data['start_time'] = data['start_time'].strftime('%H:%M')
        if hasattr(data.get('end_time'), 'strftime'):
            data['end_time'] = data['end_time'].strftime('%H:%M')
        return data


# ============== APPOINTMENT SCHEMAS ==============

class AppointmentBase(BaseModel):
    appointment_date: str = Field(..., pattern="^\\d{4}-\\d{2}-\\d{2}$")  # YYYY-MM-DD
    time_slot: str = Field(..., pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    reason: Optional[str] = None


class AppointmentCreate(AppointmentBase):
    doctor_id: int


class AppointmentUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(pending|confirmed|cancelled|completed)$")
    cancel_reason: Optional[str] = None
    notes: Optional[str] = None


class AppointmentResponse(AppointmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_id: int
    doctor_id: int
    status: str
    cancel_reason: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    patient: Optional[UserResponse] = None
    doctor: Optional[DoctorResponse] = None

    # Field validators to convert date/time objects to strings
    @field_validator('appointment_date', mode='before')
    @classmethod
    def validate_appointment_date(cls, v):
        if isinstance(v, datetime):
            return v.strftime('%Y-%m-%d')
        if hasattr(v, 'isoformat'):
            return v.isoformat()
        return v

    @field_validator('time_slot', mode='before')
    @classmethod
    def validate_time_slot(cls, v):
        if isinstance(v, datetime):
            return v.strftime('%H:%M')
        if hasattr(v, 'strftime'):
            return v.strftime('%H:%M')
        return v


class AppointmentStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(pending|confirmed|cancelled|completed)$")
    cancel_reason: Optional[str] = None
    notes: Optional[str] = None


# ============== REVIEW SCHEMAS ==============

class ReviewBase(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class ReviewCreate(ReviewBase):
    doctor_id: int
    appointment_id: int


class ReviewResponse(ReviewBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    patient_id: int
    doctor_id: int
    appointment_id: int
    created_at: datetime
    
    patient: Optional[UserResponse] = None


# ============== CHATBOT SCHEMAS ==============

class ChatMessageCreate(BaseModel):
    session_id: int
    message: str


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    session_id: int
    role: str
    content: str
    created_at: datetime


class ChatSessionCreate(BaseModel):
    title: Optional[str] = None


class ChatSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    messages: Optional[list[ChatMessageResponse]] = None


class ChatReply(BaseModel):
    reply: str


# ============== ADMIN SCHEMAS ==============

class AdminStats(BaseModel):
    total_patients: int
    total_doctors: int
    total_appointments_today: int
    total_appointments_month: int
    total_appointments_all: int
    popular_specializations: list[dict]
    recent_registrations: list[dict]


class BanUser(BaseModel):
    reason: str


# ============== GENERIC RESPONSE ==============

class MessageResponse(BaseModel):
    message: str
