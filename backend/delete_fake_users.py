"""
Delete all fake/test users from database
This removes:
- Users with @test.com emails
- Users with 'test' in name
- XSS test users (<script> tags)
- API test users
- QA test users
"""
from database import SessionLocal
from models import User, Doctor, Appointment, Review, ChatSession, ChatMessage

def delete_all_fake_users():
    db = SessionLocal()
    
    try:
        # Get all users
        all_users = db.query(User).all()
        
        print(f"\n📋 Total users in database: {len(all_users)}")
        
        # Identify fake/test users to delete
        users_to_delete = []
        keep_users = []
        
        for user in all_users:
            is_fake = False
            reason = ""
            
            # Check for test emails
            if "@test.com" in user.email or "@apiqa.com" in user.email:
                is_fake = True
                reason = "test email"
            
            # Check for XSS attempts
            elif "<script>" in user.name.lower() or "alert(" in user.name.lower():
                is_fake = True
                reason = "XSS test"
            
            # Check for test names
            elif any(keyword in user.name.lower() for keyword in ['test', 'api test', 'qa ', 'updated']):
                is_fake = True
                reason = "test name"
            
            # Check for generic test email patterns
            elif any(keyword in user.email.lower() for keyword in ['test', 'apitest', 'qa_']):
                is_fake = True
                reason = "test email pattern"
            
            if is_fake:
                users_to_delete.append((user, reason))
            else:
                keep_users.append(user)
        
        if not users_to_delete:
            print("\n✅ No fake/test users found!")
            return
        
        print(f"\n🗑️  Deleting {len(users_to_delete)} fake/test users...\n")
        
        deleted_count = 0
        kept_count = len(keep_users)
        
        for user, reason in users_to_delete:
            print(f"❌ {user.name} ({user.email}) - Reason: {reason}")
            
            try:
                # Get related doctor IDs
                doctor_ids = [d.id for d in db.query(Doctor).filter(Doctor.user_id == user.id).all()]
                
                # Delete in correct order (respecting foreign keys)
                # 1. Chat messages
                db.query(ChatMessage).filter(ChatMessage.session_id.in_(
                    db.query(ChatSession.id).filter(ChatSession.user_id == user.id)
                )).delete(synchronize_session=False)
                
                # 2. Chat sessions
                db.query(ChatSession).filter(ChatSession.user_id == user.id).delete(synchronize_session=False)
                
                # 3. Appointments (patient)
                db.query(Appointment).filter(
                    Appointment.patient_id == user.id
                ).delete(synchronize_session=False)
                
                # 4. Appointments (doctor) - if this user is a doctor
                if doctor_ids:
                    db.query(Appointment).filter(
                        Appointment.doctor_id.in_(doctor_ids)
                    ).delete(synchronize_session=False)
                    
                    # 5. Reviews (for this doctor)
                    db.query(Review).filter(
                        Review.doctor_id.in_(doctor_ids)
                    ).delete(synchronize_session=False)
                
                # 6. Reviews (written by this user)
                db.query(Review).filter(
                    Review.patient_id == user.id
                ).delete(synchronize_session=False)
                
                # 7. Doctor profile
                db.query(Doctor).filter(Doctor.user_id == user.id).delete(synchronize_session=False)
                
                # 8. Notifications (if exists)
                try:
                    from models import Notification
                    db.query(Notification).filter(Notification.user_id == user.id).delete(synchronize_session=False)
                except:
                    pass
                
                # 9. Favorites (if exists)
                try:
                    from models import Favorite
                    db.query(Favorite).filter(Favorite.user_id == user.id).delete(synchronize_session=False)
                except:
                    pass
                
                # 10. Search history (if exists)
                try:
                    from models import SearchHistory
                    db.query(SearchHistory).filter(SearchHistory.user_id == user.id).delete(synchronize_session=False)
                except:
                    pass
                
                # 11. Finally delete user
                db.query(User).filter(User.id == user.id).delete(synchronize_session=False)
                
                deleted_count += 1
                
            except Exception as e:
                print(f"   ⚠️  Error deleting {user.name}: {e}")
        
        db.commit()
        
        print(f"\n{'='*60}")
        print(f"✅ Successfully deleted: {deleted_count} fake users")
        print(f"✅ Real users remaining: {kept_count}")
        print(f"{'='*60}")
        
        # Show remaining users
        print(f"\n👥 Remaining Users:")
        for user in keep_users:
            print(f"   ✅ {user.name} ({user.email}) - {user.role}")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    print("🧹 Cleaning fake/test users from database...")
    delete_all_fake_users()
    print("\n✅ Done!")
