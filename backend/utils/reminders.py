import resend
import os

# Configure Resend API key
resend.api_key = os.getenv("RESEND_API_KEY", "")

# Default sender email
FROM_EMAIL = os.getenv("FROM_EMAIL", "appointments@doctor-appointment.com")

# Frontend URL
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def send_appointment_reminder_24hr(
    recipient_email: str,
    recipient_name: str,
    doctor_name: str,
    date: str,
    time: str,
    is_patient: bool = True
):
    """Send 24-hour appointment reminder"""

    if not resend.api_key:
        print("Resend API key not configured, skipping email")
        return

    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": recipient_email,
            "subject": "⏰ Reminder: Appointment Tomorrow!",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Appointment Reminder ⏰</h1>
                    <p style="color: white; margin: 10px 0 0 0;">Your appointment is tomorrow!</p>
                </div>
                <div style="padding: 30px; background: #f9f9f9;">
                    <p style="font-size: 16px; color: #333;">Dear {recipient_name},</p>
                    <p style="font-size: 16px; color: #333;">
                        This is a friendly reminder that you have an appointment scheduled for <strong>tomorrow</strong>.
                    </p>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                        <p style="margin: 10px 0;"><strong>👨‍⚕️ Doctor:</strong> {doctor_name}</p>
                        <p style="margin: 10px 0;"><strong>📅 Date:</strong> {date}</p>
                        <p style="margin: 10px 0;"><strong>🕐 Time:</strong> {time}</p>
                    </div>
                    <p style="font-size: 14px; color: #666;">
                        Please arrive 10 minutes before your appointment time.
                        If you need to cancel or reschedule, please do so from your dashboard.
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{FRONTEND_URL}/{'patient' if is_patient else 'doctor'}/appointments"
                           style="background: #f59e0b; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                            View Appointment Details
                        </a>
                    </div>
                    <p style="font-size: 16px; color: #333; margin-top: 20px;">
                        Best regards,<br/>
                        <strong>Your Healthcare Platform</strong>
                    </p>
                </div>
            </div>
            """
        })
        print(f"24hr reminder sent to {recipient_email}")
    except Exception as e:
        print(f"Failed to send 24hr reminder: {e}")


def send_appointment_reminder_1hr(
    recipient_email: str,
    recipient_name: str,
    doctor_name: str,
    time: str,
    is_patient: bool = True
):
    """Send 1-hour appointment reminder"""

    if not resend.api_key:
        print("Resend API key not configured, skipping email")
        return

    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": recipient_email,
            "subject": "🚨 Appointment in 1 Hour!",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Appointment in 1 Hour! 🚨</h1>
                    <p style="color: white; margin: 10px 0 0 0;">Time to get ready!</p>
                </div>
                <div style="padding: 30px; background: #f9f9f9;">
                    <p style="font-size: 16px; color: #333;">Dear {recipient_name},</p>
                    <p style="font-size: 16px; color: #333;">
                        Your appointment with <strong>{doctor_name}</strong> is in <strong style="color: #10b981;">1 hour</strong>!
                    </p>
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                        <p style="margin: 10px 0;"><strong>🕐 Appointment Time:</strong> {time}</p>
                        <p style="margin: 10px 0;"><strong>📍 Action:</strong> {'Please get ready to join' if is_patient else 'Please prepare for your patient'}</p>
                    </div>
                    <p style="font-size: 14px; color: #666;">
                        Please ensure you're available at the scheduled time.
                        {'You can view your appointment details from your dashboard.' if is_patient else 'Please be ready to attend to your patient.'}
                    </p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{FRONTEND_URL}/{'patient' if is_patient else 'doctor'}/appointments"
                           style="background: #10b981; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                            View Appointment
                        </a>
                    </div>
                    <p style="font-size: 16px; color: #333; margin-top: 20px;">
                        See you soon!<br/>
                        <strong>Your Healthcare Platform</strong>
                    </p>
                </div>
            </div>
            """
        })
        print(f"1hr reminder sent to {recipient_email}")
    except Exception as e:
        print(f"Failed to send 1hr reminder: {e}")
