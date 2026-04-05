"""
Add sample approved doctors to database for testing
Run this after setting up your database
"""
import os
from database import SessionLocal
from models import User, Doctor

def add_sample_doctors():
    db = SessionLocal()
    
    try:
        # Check if doctors already exist
        existing_doctors = db.query(Doctor).all()
        if existing_doctors:
            print(f"✅ {len(existing_doctors)} doctors already exist in database")
            return
        
        # Sample doctors data
        doctors_data = [
            {
                "user": {"name": "Dr. Ahmed Ali", "email": "ahmed@example.com", "role": "doctor"},
                "doctor": {
                    "specialization": "Cardiologist",
                    "qualification": "MBBS, FCPS (Cardiology)",
                    "experience_years": 15,
                    "consultation_fee": 1500,
                    "city": "Karachi",
                    "bio": "Experienced cardiologist specializing in heart diseases and cardiac surgery",
                    "is_approved": True
                }
            },
            {
                "user": {"name": "Dr. Fatima Khan", "email": "fatima@example.com", "role": "doctor"},
                "doctor": {
                    "specialization": "Dermatologist",
                    "qualification": "MBBS, MD (Dermatology)",
                    "experience_years": 10,
                    "consultation_fee": 1200,
                    "city": "Lahore",
                    "bio": "Expert in skin care, acne treatment, and cosmetic dermatology",
                    "is_approved": True
                }
            },
            {
                "user": {"name": "Dr. Hassan Raza", "email": "hassan@example.com", "role": "doctor"},
                "doctor": {
                    "specialization": "General Physician",
                    "qualification": "MBBS, MRCP",
                    "experience_years": 8,
                    "consultation_fee": 800,
                    "city": "Islamabad",
                    "bio": "Specialist in common illnesses, fever, flu, and general health checkups",
                    "is_approved": True
                }
            },
            {
                "user": {"name": "Dr. Ayesha Malik", "email": "ayesha@example.com", "role": "doctor"},
                "doctor": {
                    "specialization": "Pediatrician",
                    "qualification": "MBBS, DCH (Pediatrics)",
                    "experience_years": 12,
                    "consultation_fee": 1000,
                    "city": "Rawalpindi",
                    "bio": "Child health specialist with focus on vaccinations and growth monitoring",
                    "is_approved": True
                }
            },
            {
                "user": {"name": "Dr. Usman Sheikh", "email": "usman@example.com", "role": "doctor"},
                "doctor": {
                    "specialization": "Orthopedic",
                    "qualification": "MBBS, MS (Orthopedics)",
                    "experience_years": 18,
                    "consultation_fee": 1800,
                    "city": "Faisalabad",
                    "bio": "Bone and joint specialist with expertise in fracture treatment",
                    "is_approved": True
                }
            }
        ]
        
        for data in doctors_data:
            # Create user
            user = User(
                name=data["user"]["name"],
                email=data["user"]["email"],
                role=data["user"]["role"],
                hashed_password="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILp92S.0i",  # Default: password123
                is_active=True
            )
            db.add(user)
            db.flush()  # Get user ID
            
            # Create doctor profile
            doctor = Doctor(
                user_id=user.id,
                **data["doctor"]
            )
            db.add(doctor)
        
        db.commit()
        print(f"✅ Successfully added {len(doctors_data)} approved doctors to database")
        
        # Verify
        count = db.query(Doctor).filter(Doctor.is_approved == True).count()
        print(f"✅ Total approved doctors: {count}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error adding doctors: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🏥 Adding sample approved doctors...")
    add_sample_doctors()
    print("✅ Done!")
