"""
Migration script to add file_url column to chat_messages table
Run: python migrate_add_file_url.py
"""
from sqlalchemy import text
from database import engine

def add_file_url_column():
    """Add file_url column to chat_messages table"""
    
    print("🔄 Adding file_url column to chat_messages...")
    
    try:
        with engine.connect() as conn:
            conn.execute(text("""
                ALTER TABLE chat_messages 
                ADD COLUMN IF NOT EXISTS file_url TEXT;
            """))
            conn.commit()
            print("✅ file_url column added successfully!")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("="*60)
    print("🎯 Migration: Add file_url to chat_messages")
    print("="*60)
    
    if add_file_url_column():
        print("\n✅ Migration completed!")
        print("📝 Chatbot file upload feature now works!")
    else:
        print("\n❌ Migration failed!")
        exit(1)
