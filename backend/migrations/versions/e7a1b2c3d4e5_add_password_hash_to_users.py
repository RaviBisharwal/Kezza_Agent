"""add password hash to users

Revision ID: e7a1b2c3d4e5
Revises: c5f760a25687
Create Date: 2026-11-19 18:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'e7a1b2c3d4e5'
down_revision: Union[str, Sequence[str], None] = 'c5f760a25687'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("password_hash", sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "password_hash")
