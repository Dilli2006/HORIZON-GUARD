"""Database engine/session setup (SQLite via SQLAlchemy 2.x)."""
from __future__ import annotations

import os
from pathlib import Path
from typing import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = os.getenv("EXPENSEGUARD_DB", str(BASE_DIR / "expenseguard.db"))

engine = create_engine(
    f"sqlite:///{DB_PATH}",
    connect_args={"check_same_thread": False},
    future=True,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


def get_db() -> Iterator[Session]:
    """FastAPI dependency yielding a scoped session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all tables (idempotent)."""
    from . import models  # noqa: F401  (register models)

    Base.metadata.create_all(bind=engine)
