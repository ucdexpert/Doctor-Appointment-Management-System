"""add video consultation fields to appointments

Revision ID: add_video_consultation
Revises: previous_revision
Create Date: 2026-04-06

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_video_consultation'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add video consultation fields to appointments table"""
    
    # Add appointment_type column with default 'in-person'
    op.add_column(
        'appointments',
        sa.Column('appointment_type', sa.String(length=20), nullable=False, server_default='in-person')
    )
    
    # Add call_duration column to track video call length in seconds
    op.add_column(
        'appointments',
        sa.Column('call_duration', sa.Integer(), nullable=False, server_default='0')
    )
    
    # Add call_started_at column to track when video call began
    op.add_column(
        'appointments',
        sa.Column('call_started_at', sa.DateTime(), nullable=True)
    )


def downgrade() -> None:
    """Remove video consultation fields from appointments table"""
    op.drop_column('appointments', 'call_started_at')
    op.drop_column('appointments', 'call_duration')
    op.drop_column('appointments', 'appointment_type')
