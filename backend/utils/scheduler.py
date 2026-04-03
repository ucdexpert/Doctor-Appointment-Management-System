"""
APScheduler Integration for FastAPI
Automatically sends appointment reminders at scheduled intervals.
"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from send_reminders import send_24hr_reminders, send_1hr_reminders
import logging

# Configure logging
logging.basicConfig()
logging.getLogger('apscheduler').setLevel(logging.INFO)

# Global scheduler instance
scheduler = BackgroundScheduler()


def start_scheduler(app=None):
    """
    Start the background scheduler for appointment reminders.
    
    Schedule:
    - 24hr reminders: Runs every hour at minute 0
    - 1hr reminders: Runs every 30 minutes
    """
    
    # Check if reminders are enabled
    if not os.getenv("RESEND_API_KEY"):
        print("⚠️  RESEND_API_KEY not set. Email reminders disabled.")
        return
    
    print("🔔 Starting appointment reminder scheduler...")
    
    # Add 24hr reminder job - runs every hour
    scheduler.add_job(
        send_24hr_reminders,
        CronTrigger(hour='*', minute=0),  # Every hour at :00
        id='send_24hr_reminders',
        name='Send 24-hour appointment reminders',
        replace_existing=True
    )
    
    # Add 1hr reminder job - runs every 30 minutes
    scheduler.add_job(
        send_1hr_reminders,
        CronTrigger(minute='0,30'),  # Every 30 minutes
        id='send_1hr_reminders',
        name='Send 1-hour appointment reminders',
        replace_existing=True
    )
    
    # Start the scheduler
    scheduler.start()
    
    print("✅ Scheduler started successfully!")
    print("📅 24hr reminders: Every hour at :00")
    print("⏰ 1hr reminders: Every 30 minutes (:00 and :30)")
    
    # Shutdown scheduler on app exit
    import atexit
    atexit.register(lambda: scheduler.shutdown())


def get_scheduler():
    """Get the scheduler instance"""
    return scheduler


import os
