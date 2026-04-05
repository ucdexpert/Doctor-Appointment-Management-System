"""
List all doctors in the database with their details
"""
from database import SessionLocal
from models import User, Doctor
from sqlalchemy.orm import joinedload

def list_doctors():
    db = SessionLocal()
    
    try:
        # Get all doctors with user info
        doctors = (
            db.query(Doctor, User)
            .join(User, Doctor.user_id == User.id)
            .all()
        )
        
        if not doctors:
            print("\n📭 Database mein KOI doctors nahi hain!")
            print("\nRun this to add sample doctors:")
            print("  python add_sample_doctors.py")
            return
        
        print(f"\n🏥 Total Doctors in Database: {len(doctors)}")
        print("=" * 80)
        
        approved_count = 0
        pending_count = 0
        
        for idx, (doctor, user) in enumerate(doctors, 1):
            status = "✅ Approved" if doctor.is_approved else "⏳ Pending"
            if doctor.is_approved:
                approved_count += 1
            else:
                pending_count += 1
            
            print(f"\n{idx}. {user.name}")
            print(f"   📧 Email: {user.email}")
            print(f"   🩺 Specialization: {doctor.specialization}")
            print(f"   🎓 Qualification: {doctor.qualification or 'N/A'}")
            print(f"   📍 City: {doctor.city or 'N/A'}")
            print(f"   💰 Fee: PKR {doctor.consultation_fee}")
            print(f"   📅 Experience: {doctor.experience_years} years")
            print(f"   📝 Bio: {doctor.bio or 'N/A'}")
            print(f"   🔑 Status: {status}")
            print(f"   🆔 Doctor ID: {doctor.id}")
            print("-" * 80)
        
        print(f"\n📊 Summary:")
        print(f"   ✅ Approved: {approved_count}")
        print(f"   ⏳ Pending: {pending_count}")
        print(f"   📝 Total: {len(doctors)}")
        
        if approved_count == 0:
            print("\n⚠️  KOI approved doctor nahi hai!")
            print("   AI chatbot ko doctors dikhane ke liye approve karo:")
            print("   python approve_doctor.py")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    print("🔍 Checking database for doctors...")
    list_doctors()
