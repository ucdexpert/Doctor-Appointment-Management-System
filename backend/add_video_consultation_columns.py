"""
Add video consultation columns to appointments table
Run this script to add the new columns manually if migration fails
"""
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ DATABASE_URL not found in .env file")
    exit(1)

print("🔗 Connecting to database...")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    try:
        # Check if columns already exist
        check_columns = text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'appointments' 
            AND column_name IN ('appointment_type', 'call_duration', 'call_started_at')
        """)
        
        result = conn.execute(check_columns)
        existing_columns = [row[0] for row in result.fetchall()]
        
        print(f"📊 Existing columns: {existing_columns}")
        
        # Add appointment_type
        if 'appointment_type' not in existing_columns:
            print("➕ Adding appointment_type column...")
            conn.execute(text("""
                ALTER TABLE appointments 
                ADD COLUMN appointment_type VARCHAR(20) NOT NULL DEFAULT 'in-person'
            """))
            conn.commit()
            print("✅ appointment_type added")
        else:
            print("✅ appointment_type already exists")
        
        # Add call_duration
        if 'call_duration' not in existing_columns:
            print("➕ Adding call_duration column...")
            conn.execute(text("""
                ALTER TABLE appointments 
                ADD COLUMN call_duration INTEGER NOT NULL DEFAULT 0
            """))
            conn.commit()
            print("✅ call_duration added")
        else:
            print("✅ call_duration already exists")
        
        # Add call_started_at
        if 'call_started_at' not in existing_columns:
            print("➕ Adding call_started_at column...")
            conn.execute(text("""
                ALTER TABLE appointments 
                ADD COLUMN call_started_at TIMESTAMP
            """))
            conn.commit()
            print("✅ call_started_at added")
        else:
            print("✅ call_started_at already exists")
        
        print("\n✅ All video consultation columns added successfully!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        conn.rollback()
        raise
