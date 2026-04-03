"""
Migration script to add password reset columns to users table.
Run this once to update your database schema.

Usage:
  python migrate_add_reset_token.py
"""

from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not set in environment variables")
    exit(1)

engine = create_engine(DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        # Check if columns already exist
        columns = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name IN ('reset_token', 'reset_token_expiry')
        """)).fetchall()

        existing_columns = [col[0] for col in columns]

        if "reset_token" not in existing_columns:
            print("Adding reset_token column...")
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN reset_token VARCHAR(100) UNIQUE
            """))
            conn.commit()
            print("✅ reset_token column added")
        else:
            print("⏭️  reset_token column already exists")

        if "reset_token_expiry" not in existing_columns:
            print("Adding reset_token_expiry column...")
            conn.execute(text("""
                ALTER TABLE users 
                ADD COLUMN reset_token_expiry TIMESTAMP
            """))
            conn.commit()
            print("✅ reset_token_expiry column added")
        else:
            print("⏭️  reset_token_expiry column already exists")

        print("\n✅ Migration complete!")

if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        exit(1)
