"""
Clean test data and add proper doctors
"""
from database import SessionLocal
from models import User, Doctor, Appointment, Review, ChatSession, ChatMessage

def clean_and_add_doctors():
    db = SessionLocal()
    
    try:
        # Delete test users with @test.com emails
        test_users = db.query(User).filter(
            User.email.like("%@test.com")
        ).all()
        
        if test_users:
            print(f"\n🗑️  Deleting {len(test_users)} test users...")
            for user in test_users:
                print(f"   - {user.name} ({user.email})")
                
                # Get doctor IDs for this user
                doctor_ids = [d.id for d in db.query(Doctor).filter(Doctor.user_id == user.id).all()]
                
                # Delete related data in correct order
                # 1. Delete appointments where this user is patient
                db.query(Appointment).filter(Appointment.patient_id == user.id).delete(synchronize_session=False)
                
                # 2. Delete appointments where these doctors are involved
                if doctor_ids:
                    db.query(Appointment).filter(Appointment.doctor_id.in_(doctor_ids)).delete(synchronize_session=False)
                    db.query(Review).filter(Review.doctor_id.in_(doctor_ids)).delete(synchronize_session=False)
                
                # 3. Delete reviews where this user is patient
                db.query(Review).filter(Review.patient_id == user.id).delete(synchronize_session=False)
                
                # 4. Delete chat messages and sessions
                db.query(ChatMessage).filter(ChatMessage.session_id.in_(
                    db.query(ChatSession.id).filter(ChatSession.user_id == user.id)
                )).delete(synchronize_session=False)
                db.query(ChatSession).filter(ChatSession.user_id == user.id).delete(synchronize_session=False)
                
                # 5. Delete doctor profiles
                db.query(Doctor).filter(Doctor.user_id == user.id).delete(synchronize_session=False)
                
                # 6. Finally delete user
                db.query(User).filter(User.id == user.id).delete(synchronize_session=False)
            
            db.commit()
            print("✅ Test users deleted!")
        
        # Now add proper doctors
        from add_sample_doctors import add_sample_doctors
        add_sample_doctors()
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    print("🧹 Cleaning test data and adding proper doctors...")
    clean_and_add_doctors()
    print("✅ Done!")
