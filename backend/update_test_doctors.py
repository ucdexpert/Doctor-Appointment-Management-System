"""
Simply update existing test doctors with proper names and details
No deletion needed - just update
"""
from database import SessionLocal
from models import User, Doctor

def update_test_doctors():
    db = SessionLocal()
    
    try:
        # Get all approved doctors
        doctors = (
            db.query(Doctor, User)
            .join(User, Doctor.user_id == User.id)
            .filter(Doctor.is_approved == True)
            .all()
        )
        
        print(f"\n📋 Found {len(doctors)} approved doctors")
        
        for idx, (doctor, user) in enumerate(doctors):
            print(f"\n{'='*60}")
            print(f"Before: {user.name} - {doctor.specialization}")
            
            if "test" in user.name.lower() or "test" in user.email.lower():
                # Update based on index
                if idx == 0:
                    user.name = "Dr. Ahmed Ali"
                    user.email = "ahmed.ali@example.com"
                    doctor.specialization = "Cardiologist"
                    doctor.qualification = "MBBS, FCPS (Cardiology)"
                    doctor.experience_years = 15
                    doctor.consultation_fee = 1500
                    doctor.city = "Karachi"
                    doctor.bio = "Experienced cardiologist specializing in heart diseases"
                elif idx == 1:
                    user.name = "Dr. Fatima Khan"
                    user.email = "fatima.khan@example.com"
                    doctor.specialization = "Dermatologist"
                    doctor.qualification = "MBBS, MD (Dermatology)"
                    doctor.experience_years = 10
                    doctor.consultation_fee = 1200
                    doctor.city = "Lahore"
                    doctor.bio = "Expert in skin care, acne treatment, and cosmetic dermatology"
                elif idx == 2:
                    user.name = "Dr. Hassan Raza"
                    user.email = "hassan.raza@example.com"
                    doctor.specialization = "General Physician"
                    doctor.qualification = "MBBS, MRCP"
                    doctor.experience_years = 8
                    doctor.consultation_fee = 800
                    doctor.city = "Islamabad"
                    doctor.bio = "Specialist in common illnesses, fever, flu, and general health"
                
                print(f"After:  {user.name} - {doctor.specialization}")
                print(f"✅ Updated!")
        
        db.commit()
        print(f"\n✅ All test doctors updated to proper doctors!")
        
        # List all doctors
        from list_doctors import list_doctors
        list_doctors()
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    print("🔄 Updating test doctors to proper doctors...")
    update_test_doctors()
    print("✅ Done!")
