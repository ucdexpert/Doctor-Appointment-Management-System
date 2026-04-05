import resend
import os

# Configure Resend API key
resend.api_key = os.getenv("RESEND_API_KEY", "")

# Default sender email (update with your domain)
FROM_EMAIL = os.getenv("FROM_EMAIL", "appointments@doctor-appointment.com")

# Frontend URL for links (password reset, etc.)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def send_appointment_confirmation(patient_email: str, doctor_name: str,
                                   date: str, time: str, clinic_address: str = None):
    """Send appointment confirmation email to patient"""
    
    if not resend.api_key:
        print("Resend API key not configured, skipping email")
        return

    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": patient_email,
            "subject": "Appointment Confirmed! 🩺",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Appointment Booked!</h1>
                </div>
                <div style="padding: 30px; background: #f9f9f9;">
                    <p style="font-size: 16px; color: #333;">Dear Patient,</p>
                    <p style="font-size: 16px; color: #333;">
                        Your appointment with <strong>Dr. {doctor_name}</strong> has been confirmed!
                    </p>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 10px 0;"><strong>📅 Date:</strong> {date}</p>
                        <p style="margin: 10px 0;"><strong>🕐 Time:</strong> {time}</p>
                        {f'<p style="margin: 10px 0;"><strong>📍 Location:</strong> {clinic_address}</p>' if clinic_address else ''}
                    </div>
                    <p style="font-size: 14px; color: #666;">
                        Please arrive 10 minutes before your appointment time. 
                        If you need to cancel or reschedule, please do so at least 24 hours in advance.
                    </p>
                    <p style="font-size: 16px; color: #333; margin-top: 20px;">
                        Take care!<br/>
                        <strong>Your Healthcare Team</strong>
                    </p>
                </div>
            </div>
            """
        })
        print(f"Appointment confirmation sent to {patient_email}")
    except Exception as e:
        print(f"Failed to send appointment confirmation: {e}")


def send_doctor_notification(doctor_email: str, patient_name: str,
                              date: str, time: str):
    """Send new appointment notification to doctor"""
    
    if not resend.api_key:
        print("Resend API key not configured, skipping email")
        return

    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": doctor_email,
            "subject": "New Appointment Booked! 📅",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">New Appointment!</h1>
                </div>
                <div style="padding: 30px; background: #f9f9f9;">
                    <p style="font-size: 16px; color: #333;">Dear Dr.,</p>
                    <p style="font-size: 16px; color: #333;">
                        You have a new appointment booking from <strong>{patient_name}</strong>.
                    </p>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 10px 0;"><strong>📅 Date:</strong> {date}</p>
                        <p style="margin: 10px 0;"><strong>🕐 Time:</strong> {time}</p>
                    </div>
                    <p style="font-size: 16px; color: #333; margin-top: 20px;">
                        Best regards,<br/>
                        <strong>Your Healthcare Platform</strong>
                    </p>
                </div>
            </div>
            """
        })
        print(f"Doctor notification sent to {doctor_email}")
    except Exception as e:
        print(f"Failed to send doctor notification: {e}")


def send_doctor_approved(doctor_email: str, doctor_name: str):
    """Send account approval email to doctor"""
    
    if not resend.api_key:
        print("Resend API key not configured, skipping email")
        return

    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": doctor_email,
            "subject": "Account Approved! Welcome Aboard 🎉",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Mubarak ho! 🎉</h1>
                </div>
                <div style="padding: 30px; background: #f9f9f9;">
                    <p style="font-size: 16px; color: #333;">Dear Dr. {doctor_name},</p>
                    <p style="font-size: 16px; color: #333;">
                        Great news! Your doctor account has been <strong>approved</strong>.
                    </p>
                    <p style="font-size: 16px; color: #333;">
                        You can now log in to your account, set your schedule, and start receiving appointments from patients.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{FRONTEND_URL}/login"
                           style="background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Login Now
                        </a>
                    </div>
                    <p style="font-size: 16px; color: #333; margin-top: 20px;">
                        Welcome to the team!<br/>
                        <strong>Your Healthcare Platform</strong>
                    </p>
                </div>
            </div>
            """
        })
        print(f"Approval email sent to {doctor_email}")
    except Exception as e:
        print(f"Failed to send approval email: {e}")


def send_doctor_rejected(doctor_email: str, doctor_name: str, reason: str):
    """Send account rejection email to doctor"""
    
    if not resend.api_key:
        print("Resend API key not configured, skipping email")
        return

    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": doctor_email,
            "subject": "Account Update",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #f44336; padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Account Review Update</h1>
                </div>
                <div style="padding: 30px; background: #f9f9f9;">
                    <p style="font-size: 16px; color: #333;">Dear Dr. {doctor_name},</p>
                    <p style="font-size: 16px; color: #333;">
                        Thank you for applying to join our platform. After careful review, 
                        we regret to inform you that your account could not be approved at this time.
                    </p>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336;">
                        <p style="margin: 0; color: #666;"><strong>Reason:</strong></p>
                        <p style="margin: 10px 0 0 0; color: #333;">{reason}</p>
                    </div>
                    <p style="font-size: 16px; color: #333; margin-top: 20px;">
                        Best regards,<br/>
                        <strong>Your Healthcare Platform</strong>
                    </p>
                </div>
            </div>
            """
        })
        print(f"Rejection email sent to {doctor_email}")
    except Exception as e:
        print(f"Failed to send rejection email: {e}")


def send_appointment_cancelled(recipient_email: str, recipient_name: str,
                                cancel_by: str, date: str, time: str, reason: str):
    """Send appointment cancellation email"""

    if not resend.api_key:
        print("Resend API key not configured, skipping email")
        return

    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": recipient_email,
            "subject": "Appointment Cancelled",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #ff9800; padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Appointment Cancelled</h1>
                </div>
                <div style="padding: 30px; background: #f9f9f9;">
                    <p style="font-size: 16px; color: #333;">Dear {recipient_name},</p>
                    <p style="font-size: 16px; color: #333;">
                        Your appointment has been cancelled by <strong>{cancel_by}</strong>.
                    </p>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 10px 0;"><strong>📅 Date:</strong> {date}</p>
                        <p style="margin: 10px 0;"><strong>🕐 Time:</strong> {time}</p>
                        <p style="margin: 10px 0;"><strong>Reason:</strong> {reason}</p>
                    </div>
                    <p style="font-size: 16px; color: #333; margin-top: 20px;">
                        You can book a new appointment anytime from your dashboard.<br/>
                        <strong>Your Healthcare Platform</strong>
                    </p>
                </div>
            </div>
            """
        })
        print(f"Cancellation email sent to {recipient_email}")
    except Exception as e:
        print(f"Failed to send cancellation email: {e}")


def send_password_reset_email(email: str, reset_token: str, user_name: str):
    """Send password reset email with token"""

    if not resend.api_key:
        print("Resend API key not configured, skipping email")
        return

    # Frontend URL for password reset
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"

    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": email,
            "subject": "Reset Your Password - MediConnect",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Reset Your Password 🔐</h1>
                </div>
                <div style="padding: 30px; background: #f9f9f9;">
                    <p style="font-size: 16px; color: #333;">Dear {user_name},</p>
                    <p style="font-size: 16px; color: #333;">
                        We received a request to reset your password for your MediConnect account.
                    </p>
                    <p style="font-size: 16px; color: #333;">
                        Click the button below to set a new password. This link will expire in <strong>1 hour</strong>.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_link}"
                           style="background: #667eea; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                            Reset Password
                        </a>
                    </div>
                    <p style="font-size: 14px; color: #666;">
                        Or copy and paste this link into your browser:<br/>
                        <a href="{reset_link}" style="color: #667eea; word-break: break-all;">{reset_link}</a>
                    </p>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
                        <p style="margin: 0; font-size: 14px; color: #666;">
                            ⚠️ If you didn't request this password reset, please ignore this email. Your account remains secure.
                        </p>
                    </div>
                    <p style="font-size: 16px; color: #333; margin-top: 20px;">
                        Best regards,<br/>
                        <strong>Your MediConnect Team</strong>
                    </p>
                </div>
            </div>
            """
        })
        print(f"Password reset email sent to {email}")
    except Exception as e:
        print(f"Failed to send password reset email: {e}")


def send_contact_form_email(name: str, email: str, subject: str, message: str):
    """Send contact form submission to admin"""

    if not resend.api_key:
        print("Resend API key not configured, skipping email")
        return False

    # Admin email - where contact form submissions go
    ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "hk202504@gmail.com")

    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": ADMIN_EMAIL,
            "subject": f"New Contact Form: {subject}",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">New Contact Form Submission 📩</h1>
                </div>
                <div style="padding: 30px; background: #f9f9f9;">
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 10px 0;"><strong>👤 Name:</strong> {name}</p>
                        <p style="margin: 10px 0;"><strong>📧 Email:</strong> {email}</p>
                        <p style="margin: 10px 0;"><strong>📋 Subject:</strong> {subject}</p>
                    </div>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0 0 10px 0;"><strong>💬 Message:</strong></p>
                        <p style="margin: 0; color: #333; line-height: 1.6; white-space: pre-wrap;">{message}</p>
                    </div>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="mailto:{email}"
                           style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                            Reply to {name}
                        </a>
                    </div>
                    <p style="font-size: 16px; color: #333; margin-top: 20px;">
                        Best regards,<br/>
                        <strong>HealthCare+ Contact Form</strong>
                    </p>
                </div>
            </div>
            """
        })
        print(f"Contact form email sent to {ADMIN_EMAIL} from {name}")
        return True
    except Exception as e:
        print(f"Failed to send contact form email: {e}")
        return False
