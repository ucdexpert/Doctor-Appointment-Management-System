"""
Migration script to add favorites table to existing database
Run: python migrate_add_favorites.py
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, Column, Integer, ForeignKey, DateTime, text
from database import Base, engine
from datetime import datetime

load_dotenv()

def add_favorites_table():
    """Add favorites table to database"""
    
    print("🔄 Adding favorites table...")
    
    try:
        # Create the favorites table using raw SQL
        with engine.connect() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS favorites (
                    id SERIAL PRIMARY KEY,
                    patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
                    created_at TIMESTAMP DEFAULT NOW(),
                    UNIQUE(patient_id, doctor_id)
                );
            """))
            conn.commit()
        
        print("✅ Favorites table created successfully!")
        
    except Exception as e:
        print(f"❌ Error creating favorites table: {e}")
        return False
    
    return True


if __name__ == "__main__":
    print("="*60)
    print("🎯 Migration: Add Favorites Table")
    print("="*60)
    
    success = add_favorites_table()
    
    if success:
        print("\n✅ Migration completed!")
        print("📝 Users can now favorite doctors!")
    else:
        print("\n❌ Migration failed!")
        exit(1)
