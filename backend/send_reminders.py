"""
Appointment Reminder Scheduler
Checks for upcoming appointments and sends reminder emails.
Run this as a scheduled task (cron job or APScheduler).

For development, run manually: python send_reminders.py
For production, use:
  - APScheduler (built-in)
  - Celery Beat (for distributed systems)
  - Cron jobs (Railway supports scheduled jobs)
"""
import os
import sys
from datetime import datetime, timedelta
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Appointment, User, Doctor

# Load environment variables
load_dotenv()

# Import email functions
from utils.reminders import (
    send_appointment_reminder_24hr,
    send_appointment_reminder_1hr
)


def send_24hr_reminders():
    """Send reminders for appointments happening tomorrow"""
    db = SessionLocal()
    
    try:
        tomorrow = (datetime.now() + timedelta(days=1)).date()
        
        # Get all pending/confirmed appointments for tomorrow
        appointments = db.query(Appointment).filter(
            Appointment.appointment_date == tomorrow,
            Appointment.status.in_(["pending", "confirmed"])
        ).all()
        
        print(f"\n📅 Found {len(appointments)} appointment(s) for tomorrow ({tomorrow})")
        
        for appt in appointments:
            # Get patient info
            patient = db.query(User).filter(User.id == appt.patient_id).first()
            if not patient:
                continue
            
            # Get doctor info
            doctor = db.query(Doctor).filter(Doctor.id == appt.doctor_id).first()
            doctor_user = db.query(User).filter(User.id == doctor.user_id).first() if doctor else None
            
            doctor_name = doctor_user.name if doctor_user else "Doctor"
            appt_time = appt.time_slot.strftime("%H:%M") if hasattr(appt.time_slot, 'strftime') else str(appt.time_slot)
            appt_date_str = appt.appointment_date.strftime("%Y-%m-%d")
            
            # Send reminder to patient
            print(f"  📧 Sending 24hr reminder to patient: {patient.email}")
            send_appointment_reminder_24hr(
                recipient_email=patient.email,
                recipient_name=patient.name,
                doctor_name=doctor_name,
                date=appt_date_str,
                time=appt_time,
                is_patient=True
            )
            
            # Send reminder to doctor
            if doctor_user:
                print(f"  📧 Sending 24hr reminder to doctor: {doctor_user.email}")
                send_appointment_reminder_24hr(
                    recipient_email=doctor_user.email,
                    recipient_name=doctor_user.name,
                    doctor_name=patient.name,
                    date=appt_date_str,
                    time=appt_time,
                    is_patient=False
                )
        
        print(f"\n✅ 24hr reminders completed!")
        
    except Exception as e:
        print(f"\n❌ Error sending 24hr reminders: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


def send_1hr_reminders():
    """Send reminders for appointments happening in 1 hour"""
    db = SessionLocal()
    
    try:
        now = datetime.now()
        one_hour_later = now + timedelta(hours=1)
        
        # Get appointments happening in the next hour
        appointments = db.query(Appointment).filter(
            Appointment.appointment_date == now.date(),
            Appointment.status.in_(["pending", "confirmed"])
        ).all()
        
        # Filter for appointments in the next hour
        upcoming_appointments = []
        for appt in appointments:
            appt_time = appt.time_slot
            if hasattr(appt_time, 'hour') and hasattr(appt_time, 'minute'):
                appt_datetime = datetime.combine(now.date(), appt_time)
                # Check if appointment is within the next 90 minutes (buffer)
                time_diff = (appt_datetime - now).total_seconds() / 3600
                if 0.5 <= time_diff <= 1.5:  # 30 min to 90 min buffer
                    upcoming_appointments.append(appt)
        
        print(f"\n⏰ Found {len(upcoming_appointments)} appointment(s) in the next hour")
        
        for appt in upcoming_appointments:
            # Get patient info
            patient = db.query(User).filter(User.id == appt.patient_id).first()
            if not patient:
                continue
            
            # Get doctor info
            doctor = db.query(Doctor).filter(Doctor.id == appt.doctor_id).first()
            doctor_user = db.query(User).filter(User.id == doctor.user_id).first() if doctor else None
            
            doctor_name = doctor_user.name if doctor_user else "Doctor"
            appt_time = appt.time_slot.strftime("%H:%M") if hasattr(appt.time_slot, 'strftime') else str(appt.time_slot)
            
            # Send reminder to patient
            print(f"  📧 Sending 1hr reminder to patient: {patient.email}")
            send_appointment_reminder_1hr(
                recipient_email=patient.email,
                recipient_name=patient.name,
                doctor_name=doctor_name,
                time=appt_time,
                is_patient=True
            )
            
            # Send reminder to doctor
            if doctor_user:
                print(f"  📧 Sending 1hr reminder to doctor: {doctor_user.email}")
                send_appointment_reminder_1hr(
                    recipient_email=doctor_user.email,
                    recipient_name=doctor_user.name,
                    doctor_name=patient.name,
                    time=appt_time,
                    is_patient=False
                )
        
        print(f"\n✅ 1hr reminders completed!")
        
    except Exception as e:
        print(f"\n❌ Error sending 1hr reminders: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


def run_all_reminders():
    """Run all reminder checks"""
    print("="*60)
    print("🔔 APPOINTMENT REMINDER SCHEDULER")
    print("="*60)
    print(f"⏱️  Running at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    send_24hr_reminders()
    send_1hr_reminders()
    
    print("\n" + "="*60)
    print("✅ All reminder tasks completed!")
    print("="*60)


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Appointment Reminder Scheduler")
    parser.add_argument(
        "--type",
        choices=["24hr", "1hr", "all"],
        default="all",
        help="Which reminder to send (default: all)"
    )
    
    args = parser.parse_args()
    
    if args.type == "24hr":
        send_24hr_reminders()
    elif args.type == "1hr":
        send_1hr_reminders()
    else:
        run_all_reminders()
