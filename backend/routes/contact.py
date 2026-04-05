from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from utils.email import send_contact_form_email

router = APIRouter(prefix="/contact", tags=["Contact"])


class ContactForm(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str


@router.post("/send")
async def submit_contact_form(data: ContactForm):
    """Submit contact form and send email to admin"""

    try:
        success = send_contact_form_email(
            name=data.name,
            email=data.email,
            subject=data.subject,
            message=data.message,
        )

        if success:
            return {
                "message": "Message sent successfully! We'll get back to you soon.",
                "success": True,
            }
        else:
            # Email not configured but still accept the submission
            return {
                "message": "Message received. We'll get back to you soon.",
                "success": True,
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")
