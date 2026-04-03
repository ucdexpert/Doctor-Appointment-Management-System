"""
Migration script to add search_history and notifications tables
Run: python migrate_new_tables.py
"""
from sqlalchemy import text
from database import engine

def create_new_tables():
    """Create search_history and notifications tables"""
    
    print("🔄 Creating new tables...")
    
    try:
        with engine.connect() as conn:
            # Create search_history table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS search_history (
                    id SERIAL PRIMARY KEY,
                    patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    search_query VARCHAR(200) NOT NULL,
                    filters VARCHAR(500),
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """))
            conn.commit()
            print("✅ search_history table created")
            
            # Create notifications table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS notifications (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    title VARCHAR(200) NOT NULL,
                    message TEXT NOT NULL,
                    type VARCHAR(50) DEFAULT 'info',
                    is_read BOOLEAN DEFAULT FALSE,
                    link VARCHAR(300),
                    created_at TIMESTAMP DEFAULT NOW()
                );
            """))
            conn.commit()
            print("✅ notifications table created")
        
        print("\n✅ Migration completed successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True


if __name__ == "__main__":
    print("="*60)
    print("🎯 Migration: Search History & Notifications")
    print("="*60)
    
    if create_new_tables():
        print("\n✅ All tables created! Features ready to use.")
    else:
        print("\n❌ Migration failed!")
        exit(1)
