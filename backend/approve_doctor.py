"""
Doctor Approval Script - Simple CLI Tool
Run this to approve/reject doctors without admin UI

Usage:
    python approve_doctor.py     - Show all doctors
    python approve_doctor.py 1   - Approve doctor with ID 1
    python approve_doctor.py 1 reject "Reason" - Reject doctor with ID 1
"""

from database import get_db
from models import Doctor, User
from passlib.context import CryptContext

def show_all_doctors():
    """Show all doctors with their approval status"""
    db = next(get_db())
    
    doctors = db.query(Doctor).all()
    
    print("\n" + "="*60)
    print("📋 ALL DOCTORS IN DATABASE")
    print("="*60)
    print(f"\nTotal Doctors: {len(doctors)}")
    
    approved = [d for d in doctors if d.is_approved]
    pending = [d for d in doctors if not d.is_approved]
    
    print(f"✅ Approved: {len(approved)}")
    print(f"⏳ Pending: {len(pending)}")
    
    if pending:
        print("\n" + "="*60)
        print("⏳ PENDING DOCTORS (Need Approval)")
        print("="*60)
        
        for doctor in pending:
            user = db.query(User).filter(User.id == doctor.user_id).first()
            print(f"\n📌 Doctor ID: {doctor.id}")
            print(f"   Name: {user.name if user else 'Unknown'}")
            print(f"   Email: {user.email if user else 'Unknown'}")
            print(f"   Specialization: {doctor.specialization}")
            print(f"   City: {doctor.city}")
            print(f"   Fee: PKR {doctor.consultation_fee}")
            print(f"   Experience: {doctor.experience_years} years")
            print(f"   Qualification: {doctor.qualification}")
            print(f"   Status: ❌ PENDING")
            print(f"   → To Approve: python approve_doctor.py {doctor.id}")
            print(f"   → To Reject: python approve_doctor.py {doctor.id} reject \"Reason\"")
            print("   " + "-"*40)
    
    if approved:
        print("\n" + "="*60)
        print("✅ APPROVED DOCTORS")
        print("="*60)
        
        for doctor in approved:
            user = db.query(User).filter(User.id == doctor.user_id).first()
            print(f"\n   Dr. {user.name if user else 'Unknown'} ({doctor.id})")
            print(f"   {doctor.specialization} | {doctor.city} | PKR {doctor.consultation_fee}")
    
    print("\n" + "="*60)
    db.close()


def approve_doctor(doctor_id: int):
    """Approve a doctor by ID"""
    db = next(get_db())
    
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    
    if not doctor:
        print(f"❌ Doctor with ID {doctor_id} not found!")
        return
    
    if doctor.is_approved:
        print(f"⚠️  Doctor {doctor_id} is already approved!")
        return
    
    doctor.is_approved = True
    doctor.rejection_reason = None
    db.commit()
    
    user = db.query(User).filter(User.id == doctor.user_id).first()
    
    print("\n" + "="*60)
    print("✅ DOCTOR APPROVED SUCCESSFULLY!")
    print("="*60)
    print(f"   Name: Dr. {user.name if user else 'Unknown'}")
    print(f"   Email: {user.email if user else 'Unknown'}")
    print(f"   Specialization: {doctor.specialization}")
    print(f"   City: {doctor.city}")
    print(f"\n   Now patients can see and book appointments!")
    print("="*60 + "\n")
    
    db.close()


def reject_doctor(doctor_id: int, reason: str):
    """Reject a doctor by ID with reason"""
    db = next(get_db())
    
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    
    if not doctor:
        print(f"❌ Doctor with ID {doctor_id} not found!")
        return
    
    doctor.is_approved = False
    doctor.rejection_reason = reason
    db.commit()
    
    user = db.query(User).filter(User.id == doctor.user_id).first()
    
    print("\n" + "="*60)
    print("❌ DOCTOR REJECTED")
    print("="*60)
    print(f"   Name: Dr. {user.name if user else 'Unknown'}")
    print(f"   Email: {user.email if user else 'Unknown'}")
    print(f"   Reason: {reason}")
    print("="*60 + "\n")
    
    db.close()


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) == 1:
        # No arguments - show all doctors
        show_all_doctors()
    
    elif len(sys.argv) == 2:
        # Approve doctor
        doctor_id = int(sys.argv[1])
        approve_doctor(doctor_id)
    
    elif len(sys.argv) >= 4:
        # Reject doctor
        doctor_id = int(sys.argv[1])
        reason = " ".join(sys.argv[2:])
        reject_doctor(doctor_id, reason)
    
    else:
        print(__doc__)
