"""
Add many sample approved doctors to database for better UI display
Run this after setting up your database
"""
import os
from database import SessionLocal
from models import User, Doctor
from hashlib import sha256

def add_many_sample_doctors():
    db = SessionLocal()

    try:
        # Sample doctors data - 20 doctors with different specializations
        doctors_data = [
            {
                "name": "Dr. Ahmed Ali",
                "email": "ahmed.ali@doctor.com",
                "specialization": "Cardiologist",
                "qualification": "MBBS, FCPS (Cardiology)",
                "experience_years": 15,
                "consultation_fee": 1500,
                "city": "Karachi",
                "bio": "Experienced cardiologist specializing in heart diseases and cardiac surgery"
            },
            {
                "name": "Dr. Fatima Khan",
                "email": "fatima.khan@doctor.com",
                "specialization": "Dermatologist",
                "qualification": "MBBS, MD (Dermatology)",
                "experience_years": 10,
                "consultation_fee": 1200,
                "city": "Lahore",
                "bio": "Expert in skin care, acne treatment, and cosmetic dermatology"
            },
            {
                "name": "Dr. Hassan Raza",
                "email": "hassan.raza@doctor.com",
                "specialization": "General Physician",
                "qualification": "MBBS, MRCP",
                "experience_years": 8,
                "consultation_fee": 800,
                "city": "Islamabad",
                "bio": "Specialist in common illnesses, fever, flu, and general health checkups"
            },
            {
                "name": "Dr. Ayesha Malik",
                "email": "ayesha.malik@doctor.com",
                "specialization": "Pediatrician",
                "qualification": "MBBS, DCH (Pediatrics)",
                "experience_years": 12,
                "consultation_fee": 1000,
                "city": "Rawalpindi",
                "bio": "Child health specialist with focus on vaccinations and growth monitoring"
            },
            {
                "name": "Dr. Usman Sheikh",
                "email": "usman.sheikh@doctor.com",
                "specialization": "Orthopedic",
                "qualification": "MBBS, MS (Orthopedics)",
                "experience_years": 18,
                "consultation_fee": 1800,
                "city": "Faisalabad",
                "bio": "Bone and joint specialist with expertise in fracture treatment"
            },
            {
                "name": "Dr. Sana Ahmed",
                "email": "sana.ahmed@doctor.com",
                "specialization": "Gynecologist",
                "qualification": "MBBS, FCPS (Gynecology)",
                "experience_years": 14,
                "consultation_fee": 1300,
                "city": "Karachi",
                "bio": "Women's health specialist focusing on pregnancy and reproductive health"
            },
            {
                "name": "Dr. Bilal Hassan",
                "email": "bilal.hassan@doctor.com",
                "specialization": "ENT Specialist",
                "qualification": "MBBS, FCPS (ENT)",
                "experience_years": 11,
                "consultation_fee": 1100,
                "city": "Lahore",
                "bio": "Ear, nose, and throat specialist with surgical expertise"
            },
            {
                "name": "Dr. Zara Tariq",
                "email": "zara.tariq@doctor.com",
                "specialization": "Ophthalmologist",
                "qualification": "MBBS, FRCS (Ophthalmology)",
                "experience_years": 9,
                "consultation_fee": 1400,
                "city": "Islamabad",
                "bio": "Eye specialist experienced in cataract surgery and laser treatment"
            },
            {
                "name": "Dr. Ali Raza",
                "email": "ali.raza@doctor.com",
                "specialization": "Neurologist",
                "qualification": "MBBS, MD (Neurology)",
                "experience_years": 20,
                "consultation_fee": 2000,
                "city": "Karachi",
                "bio": "Brain and nervous system specialist with extensive clinical experience"
            },
            {
                "name": "Dr. Maryam Siddiqui",
                "email": "maryam.siddiqui@doctor.com",
                "specialization": "Psychiatrist",
                "qualification": "MBBS, FCPS (Psychiatry)",
                "experience_years": 7,
                "consultation_fee": 1600,
                "city": "Rawalpindi",
                "bio": "Mental health specialist focusing on depression, anxiety, and therapy"
            },
            {
                "name": "Dr. Omar Farooq",
                "email": "omar.farooq@doctor.com",
                "specialization": "Urologist",
                "qualification": "MBBS, MS (Urology)",
                "experience_years": 16,
                "consultation_fee": 1700,
                "city": "Multan",
                "bio": "Urinary tract and kidney specialist with surgical expertise"
            },
            {
                "name": "Dr. Hina Khan",
                "email": "hina.khan@doctor.com",
                "specialization": "Endocrinologist",
                "qualification": "MBBS, MRCP (Endocrinology)",
                "experience_years": 13,
                "consultation_fee": 1500,
                "city": "Lahore",
                "bio": "Hormonal disorders specialist, diabetes and thyroid expert"
            },
            {
                "name": "Dr. Tariq Mehmood",
                "email": "tariq.mehmood@doctor.com",
                "specialization": "Pulmonologist",
                "qualification": "MBBS, FCPS (Pulmonology)",
                "experience_years": 17,
                "consultation_fee": 1600,
                "city": "Islamabad",
                "bio": "Respiratory system specialist treating asthma, COPD, and lung diseases"
            },
            {
                "name": "Dr. Nida Shah",
                "email": "nida.shah@doctor.com",
                "specialization": "Gastroenterologist",
                "qualification": "MBBS, MD (Gastroenterology)",
                "experience_years": 11,
                "consultation_fee": 1400,
                "city": "Karachi",
                "bio": "Digestive system specialist with expertise in liver and stomach disorders"
            },
            {
                "name": "Dr. Kamran Yousuf",
                "email": "kamran.yousuf@doctor.com",
                "specialization": "Rheumatologist",
                "qualification": "MBBS, MRCP (Rheumatology)",
                "experience_years": 10,
                "consultation_fee": 1300,
                "city": "Peshawar",
                "bio": "Joint and autoimmune diseases specialist, arthritis expert"
            },
            {
                "name": "Dr. Rabia Akhtar",
                "email": "rabia.akhtar@doctor.com",
                "specialization": "Nephrologist",
                "qualification": "MBBS, FCPS (Nephrology)",
                "experience_years": 14,
                "consultation_fee": 1500,
                "city": "Faisalabad",
                "bio": "Kidney specialist experienced in dialysis and transplant care"
            },
            {
                "name": "Dr. Faisal Qureshi",
                "email": "faisal.qureshi@doctor.com",
                "specialization": "Dentist",
                "qualification": "BDS, RDS, FCPS (Dentistry)",
                "experience_years": 12,
                "consultation_fee": 900,
                "city": "Lahore",
                "bio": "Dental care expert specializing in cosmetic dentistry and oral surgery"
            },
            {
                "name": "Dr. Amna Iqbal",
                "email": "amna.iqbal@doctor.com",
                "specialization": "Allergist",
                "qualification": "MBBS, MD (Allergy & Immunology)",
                "experience_years": 8,
                "consultation_fee": 1100,
                "city": "Rawalpindi",
                "bio": "Allergy and immunology specialist, asthma and eczema treatment"
            },
            {
                "name": "Dr. Waleed Ahmed",
                "email": "waleed.ahmed@doctor.com",
                "specialization": "General Surgeon",
                "qualification": "MBBS, MS (General Surgery)",
                "experience_years": 19,
                "consultation_fee": 2200,
                "city": "Karachi",
                "bio": "Experienced surgeon specializing in laparoscopic and minimally invasive surgery"
            },
            {
                "name": "Dr. Saima Noor",
                "email": "saima.noor@doctor.com",
                "specialization": "Physiotherapist",
                "qualification": "DPT, MS (Physiotherapy)",
                "experience_years": 9,
                "consultation_fee": 800,
                "city": "Islamabad",
                "bio": "Physical therapy specialist focusing on rehabilitation and pain management"
            }
        ]

        # Track counters
        added_count = 0
        skipped_count = 0

        for doctor_data in doctors_data:
            # Check if user already exists
            existing_user = db.query(User).filter(User.email == doctor_data["email"]).first()
            if existing_user:
                # Check if doctor profile already exists
                existing_doctor = db.query(Doctor).filter(Doctor.user_id == existing_user.id).first()
                if existing_doctor and existing_doctor.is_approved:
                    print(f"⏭️  Skipped: {doctor_data['name']} (already exists)")
                    skipped_count += 1
                    continue
                elif existing_doctor:
                    # Update existing doctor profile
                    existing_doctor.is_approved = True
                    print(f"✅ Approved: {doctor_data['name']}")
                    added_count += 1
                    continue
                else:
                    # Create doctor profile for existing user
                    doctor = Doctor(
                        user_id=existing_user.id,
                        specialization=doctor_data["specialization"],
                        qualification=doctor_data["qualification"],
                        experience_years=doctor_data["experience_years"],
                        consultation_fee=doctor_data["consultation_fee"],
                        city=doctor_data["city"],
                        bio=doctor_data["bio"],
                        is_approved=True
                    )
                    db.add(doctor)
                    print(f"✅ Created profile: {doctor_data['name']}")
                    added_count += 1
                    continue

            # Create new user
            user = User(
                name=doctor_data["name"],
                email=doctor_data["email"],
                role="doctor",
                password="$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYILp92S.0i",  # Default: password123
                is_active=True
            )
            db.add(user)
            db.flush()  # Get user ID

            # Create doctor profile
            doctor = Doctor(
                user_id=user.id,
                specialization=doctor_data["specialization"],
                qualification=doctor_data["qualification"],
                experience_years=doctor_data["experience_years"],
                consultation_fee=doctor_data["consultation_fee"],
                city=doctor_data["city"],
                bio=doctor_data["bio"],
                is_approved=True
            )
            db.add(doctor)
            added_count += 1
            print(f"✅ Added: {doctor_data['name']} - {doctor_data['specialization']}")

        db.commit()
        
        # Print summary
        print(f"\n{'='*60}")
        print(f"✅ Successfully added/approved: {added_count} doctors")
        print(f"⏭️  Skipped (already approved): {skipped_count} doctors")
        
        # Verify total approved doctors
        total_approved = db.query(Doctor).filter(Doctor.is_approved == True).count()
        print(f"🏥 Total approved doctors in database: {total_approved}")
        print(f"{'='*60}")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error adding doctors: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🏥 Adding sample approved doctors to database...")
    print("="*60)
    add_many_sample_doctors()
    print("\n✅ Done! Your website should now look much better!")
