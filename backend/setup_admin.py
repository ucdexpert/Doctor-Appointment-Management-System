"""
Admin Setup Script
Creates a default admin account if it doesn't exist.
Generates a secure random password and displays it once.

Usage:
    python setup_admin.py
    
The script will:
1. Check if admin already exists
2. If not, create admin with secure random password
3. Display credentials (SAVE THESE!)
4. Exit
"""
import os
import sys
import secrets
from database import SessionLocal, engine
from models import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def generate_secure_password(length=16):
    """Generate a cryptographically secure random password"""
    # Use secrets module for secure random generation
    alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    while True:
        password = ''.join(secrets.choice(alphabet) for _ in range(length))
        # Ensure password meets complexity requirements
        if (any(c.islower() for c in password)
                and any(c.isupper() for c in password)
                and any(c.isdigit() for c in password)
                and any(c in "!@#$%^&*" for c in password)):
            return password


def check_admin_exists(db):
    """Check if admin account already exists"""
    admin = db.query(User).filter(User.role == "admin").first()
    return admin is not None


def create_admin_account(email="admin@example.com", name="System Administrator"):
    """Create admin account with secure password"""
    db = SessionLocal()
    
    try:
        # Check if admin already exists
        if check_admin_exists(db):
            print("✅ Admin account already exists!")
            print("If you need to reset the password, please do it manually in the database.")
            return
        
        # Generate secure password
        password = generate_secure_password(20)
        hashed_password = pwd_context.hash(password)
        
        # Create admin user
        admin = User(
            name=name,
            email=email,
            password=hashed_password,
            role="admin",
            is_active=True,
            is_banned=False
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        # Display credentials (ONE TIME ONLY!)
        print("\n" + "="*70)
        print("🎉 ADMIN ACCOUNT CREATED SUCCESSFULLY!")
        print("="*70)
        print("\n⚠️  IMPORTANT: Save these credentials NOW! They won't be shown again.\n")
        print(f"📧 Email:    {email}")
        print(f"🔑 Password: {password}")
        print(f"👤 Role:     admin")
        print("\n" + "="*70)
        print("📝 Next Steps:")
        print("   1. Login at: http://localhost:3000/login")
        print("   2. Change password immediately after first login")
        print("   3. Delete or secure this script in production")
        print("="*70 + "\n")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating admin account: {e}")
        sys.exit(1)
    finally:
        db.close()


def reset_admin_password(email="admin@example.com"):
    """Reset admin password (use if you forgot the password)"""
    db = SessionLocal()
    
    try:
        admin = db.query(User).filter(
            User.role == "admin",
            User.email == email
        ).first()
        
        if not admin:
            print(f"❌ Admin account with email {email} not found!")
            return
        
        # Generate new password
        new_password = generate_secure_password(20)
        admin.password = pwd_context.hash(new_password)
        
        db.commit()
        
        # Display new credentials
        print("\n" + "="*70)
        print("🔐 ADMIN PASSWORD RESET SUCCESSFUL!")
        print("="*70)
        print("\n⚠️  IMPORTANT: Save these credentials NOW!\n")
        print(f"📧 Email:    {email}")
        print(f"🔑 Password: {new_password}")
        print("\n" + "="*70)
        print("📝 Please login and change password immediately!")
        print("="*70 + "\n")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error resetting admin password: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Admin Account Setup")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Reset existing admin password"
    )
    parser.add_argument(
        "--email",
        default="admin@example.com",
        help="Admin email (default: admin@example.com)"
    )
    
    args = parser.parse_args()
    
    # Create database tables if they don't exist
    from database import Base
    Base.metadata.create_all(bind=engine)
    
    if args.reset:
        reset_admin_password(args.email)
    else:
        create_admin_account(args.email)
