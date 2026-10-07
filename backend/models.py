"""ORM models for ExpenseGuard."""
from __future__ import annotations

from datetime import date, datetime
from typing import Any, Optional

from sqlalchemy import JSON, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(200), default="")
    home_city: Mapped[str] = mapped_column(String(80), default="Bengaluru")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), default=1, index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    time: Mapped[str] = mapped_column(String(5), default="12:00")  # "HH:MM" 24h
    merchant: Mapped[str] = mapped_column(String(160))
    amount: Mapped[float] = mapped_column(Float)
    category: Mapped[str] = mapped_column(String(40), default="Other", index=True)
    payment_method: Mapped[str] = mapped_column(String(40), default="UPI")
    location: Mapped[str] = mapped_column(String(80), default="Bengaluru")
    notes: Mapped[str] = mapped_column(Text, default="")
    source: Mapped[str] = mapped_column(String(30), default="manual")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    anomaly: Mapped[Optional["Anomaly"]] = relationship(
        back_populates="expense", uselist=False, cascade="all, delete-orphan"
    )

    @property
    def timestamp(self) -> datetime:
        hh, mm = (self.time or "12:00").split(":")[:2]
        return datetime(self.date.year, self.date.month, self.date.day, int(hh), int(mm))


class Budget(Base):
    __tablename__ = "budgets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), default=1)
    category: Mapped[str] = mapped_column(String(40), unique=True)
    monthly_limit: Mapped[float] = mapped_column(Float)


class Anomaly(Base):
    __tablename__ = "anomalies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    expense_id: Mapped[int] = mapped_column(ForeignKey("expenses.id"), unique=True)
    risk_score: Mapped[int] = mapped_column(Integer)
    severity: Mapped[str] = mapped_column(String(10))
    reasons: Mapped[list[str]] = mapped_column(JSON, default=list)
    # [{detector, score, reason}] - powers the explainability waterfall
    contributions: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    counterfactuals: Mapped[list[str]] = mapped_column(JSON, default=list)
    status: Mapped[str] = mapped_column(String(10), default="open")  # open/legit/fraud
    blocked_by_antibody_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    expense: Mapped[Expense] = relationship(back_populates="anomaly")


class Antibody(Base):
    """A learned fraud pattern. Future matching transactions are auto-flagged."""

    __tablename__ = "antibodies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pattern_signature: Mapped[dict[str, Any]] = mapped_column(JSON)
    description: Mapped[str] = mapped_column(Text)
    learned_from_anomaly_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    learned_from_expense_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    hits: Mapped[int] = mapped_column(Integer, default=0)
    origin: Mapped[str] = mapped_column(String(12), default="learned")  # learned/acquired
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)


class WhitelistPattern(Base):
    """A pattern the user confirmed as legitimate; matching flags are suppressed."""

    __tablename__ = "whitelist"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pattern_signature: Mapped[dict[str, Any]] = mapped_column(JSON)
    description: Mapped[str] = mapped_column(Text)
    learned_from_anomaly_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    learned_from_expense_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    hits: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)


class LearningEvent(Base):
    """Before/after proof that a verdict improved the model."""

    __tablename__ = "learning_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    kind: Mapped[str] = mapped_column(String(10))  # fraud/legit
    anomaly_id: Mapped[int] = mapped_column(Integer)
    open_before: Mapped[int] = mapped_column(Integer)
    open_after: Mapped[int] = mapped_column(Integer)
    immunity_before: Mapped[int] = mapped_column(Integer)
    immunity_after: Mapped[int] = mapped_column(Integer)
    note: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)


class ImpulseLog(Base):
    """Emotional Spending Guard decisions."""

    __tablename__ = "impulse_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    merchant: Mapped[str] = mapped_column(String(160))
    amount: Mapped[float] = mapped_column(Float)
    category: Mapped[str] = mapped_column(String(40))
    reasons: Mapped[list[str]] = mapped_column(JSON, default=list)
    decision: Mapped[str] = mapped_column(String(12))  # proceeded/cancelled
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
