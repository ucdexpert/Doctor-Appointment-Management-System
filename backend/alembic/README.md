# Database Migrations with Alembic

This directory contains database migration scripts using Alembic.

## Setup (First Time Only)

```bash
cd backend
pip install -r requirements.txt
```

## Common Commands

### Create a new migration
```bash
# After modifying models, auto-generate migration
alembic revision --autogenerate -m "description_of_changes"

# Example:
alembic revision --autogenerate -m "add_phone_to_users"
```

### Apply migrations
```bash
# Apply all pending migrations
alembic upgrade head

# Apply one migration at a time
alembic upgrade +1

# Rollback last migration
alembic downgrade -1

# Rollback all migrations
alembic downgrade base
```

### Check migration status
```bash
# Show current migration status
alembic current

# Show list of all migrations
alembic history
```

## Initial Setup

To create the initial database schema:

```bash
# Make sure DATABASE_URL is set in .env
export DATABASE_URL="postgresql://user:password@localhost:5432/doctor_appointment"

# Apply initial migration
alembic upgrade head
```

## Best Practices

1. **Always create migrations through Alembic** - Don't manually modify the database
2. **Review auto-generated migrations** - Always check the generated migration file
3. **Test migrations** - Test both upgrade and downgrade in development
4. **One logical change per migration** - Keep migrations focused and understandable
5. **Commit migrations** - They are part of your schema version control

## Troubleshooting

### Migration fails with "already exists"
```bash
# Stamp the database as already being at a specific revision
alembic stamp head
```

### Migration file has errors
```bash
# Delete the problematic migration file
# Fix the issue
# Generate a new migration
alembic revision --autogenerate -m "fixed_migration"
```

## Environment Variables

Make sure these are set in your `.env` file:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/doctor_appointment
```

## File Structure

```
alembic/
├── env.py                 # Alembic environment configuration
├── script.py.mako         # Template for new migration files
├── versions/              # Migration scripts
│   └── 0001_initial_schema.py  # Initial database schema
└── README.md              # This file
```
