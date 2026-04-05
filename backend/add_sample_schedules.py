"""
Add sample schedules for existing approved doctors
This will set weekly availability for each doctor
"""
from database import SessionLocal
from models import Doctor, Schedule

def add_sample_schedules():
    db = SessionLocal()
    
    try:
        # Get all approved doctors
        doctors = db.query(Doctor).filter(Doctor.is_approved == True).all()
        
        if not doctors:
            print("❌ No approved doctors found in database!")
            return
        
        print(f"\n📅 Found {len(doctors)} approved doctors")
        
        # Define sample schedules for different specializations
        schedule_map = {
            "Cardiologist": ["Mon", "Wed", "Fri"],
            "Dermatologist": ["Tue", "Thu", "Sat"],
            "General Physician": ["Mon", "Tue", "Wed", "Thu", "Fri"],
            "Pediatrician": ["Mon", "Wed", "Fri"],
            "Orthopedic": ["Tue", "Thu", "Sat"],
        }
        
        for doctor in doctors:
            # Check if schedule already exists
            existing = db.query(Schedule).filter(Schedule.doctor_id == doctor.id).first()
            
            if existing:
                print(f"\n⏭️  Dr. {doctor.id} - Schedule already exists, skipping...")
                continue
            
            # Get days based on specialization
            days = schedule_map.get(doctor.specialization, ["Mon", "Tue", "Wed", "Thu", "Fri"])
            
            # Create schedule entries
            for day in days:
                schedule = Schedule(
                    doctor_id=doctor.id,
                    day_of_week=day,
                    start_time="09:00",
                    end_time="17:00",
                    is_available=True
                )
                db.add(schedule)
            
            print(f"\n✅ Dr. {doctor.id} ({doctor.specialization})")
            print(f"   Days: {', '.join(days)}")
            print(f"   Time: 9:00 AM - 5:00 PM")
        
        db.commit()
        print(f"\n✅ Schedules added successfully!")
        
        # Verify
        total_schedules = db.query(Schedule).count()
        print(f"📊 Total schedule entries: {total_schedules}")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    print("📅 Adding sample schedules for doctors...")
    add_sample_schedules()
    print("✅ Done!")
