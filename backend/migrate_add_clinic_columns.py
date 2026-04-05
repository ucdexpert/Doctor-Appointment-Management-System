"""
Migration script to add clinic location columns to doctors table
Run this to fix the database schema
"""
from database import engine
from sqlalchemy import text

def add_clinic_columns():
    """Add clinic location columns to doctors table if they don't exist"""
    
    with engine.connect() as conn:
        # Check if columns already exist
        check_query = """
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'doctors' 
            AND column_name = 'clinic_name'
        """
        result = conn.execute(text(check_query))
        exists = result.fetchone()
        
        if exists:
            print("✅ Clinic columns already exist!")
            return
        
        print("🔧 Adding clinic columns to doctors table...")
        
        # Add columns
        conn.execute(text("""
            ALTER TABLE doctors
            ADD COLUMN IF NOT EXISTS clinic_name VARCHAR(200),
            ADD COLUMN IF NOT EXISTS clinic_address TEXT,
            ADD COLUMN IF NOT EXISTS clinic_latitude NUMERIC(10, 8),
            ADD COLUMN IF NOT EXISTS clinic_longitude NUMERIC(11, 8),
            ADD COLUMN IF NOT EXISTS clinic_landline VARCHAR(20)
        """))
        
        conn.commit()
        print("✅ Clinic columns added successfully!")

if __name__ == "__main__":
    print("🏥 Running clinic columns migration...")
    add_clinic_columns()
    print("✅ Migration complete!")
