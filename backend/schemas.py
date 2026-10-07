"""Pydantic request/response schemas."""
from __future__ import annotations

from datetime import date as Date
from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ExpenseIn(BaseModel):
    date: Date
    time: str = Field(default="12:00", pattern=r"^\d{1,2}:\d{2}$")
    merchant: str = Field(min_length=1, max_length=160)
    amount: float = Field(gt=0, lt=1e8)
    category: Optional[str] = None  # auto-categorized when omitted
    payment_method: str = "UPI"
    location: str = "Bengaluru"
    notes: str = ""
    source: str = "manual"

    @field_validator("time")
    @classmethod
    def _time(cls, v: str) -> str:
        hh, mm = v.split(":")
        h, m = int(hh), int(mm)
        if not (0 <= h < 24 and 0 <= m < 60):
            raise ValueError("invalid time")
        return f"{h:02d}:{m:02d}"


class AnomalyBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    risk_score: int
    severity: str
    status: str
    reasons: list[str]
    blocked_by_antibody_id: Optional[int] = None


class ExpenseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    date: Date
    time: str
    merchant: str
    amount: float
    category: str
    payment_method: str
    location: str
    notes: str
    source: str
    anomaly: Optional[AnomalyBrief] = None


class BudgetIn(BaseModel):
    category: str
    monthly_limit: float = Field(ge=0)


class VerdictIn(BaseModel):
    verdict: Literal["legit", "fraud"]


class AskIn(BaseModel):
    question: str = Field(min_length=1, max_length=400)


class GuardCheckIn(BaseModel):
    merchant: str
    amount: float
    category: Optional[str] = None
    time: Optional[str] = None


class GuardLogIn(BaseModel):
    merchant: str
    amount: float
    category: str = "Other"
    reasons: list[str] = []
    decision: Literal["proceeded", "cancelled"]


class VaccineIn(BaseModel):
    format: str
    antibodies: list[dict[str, Any]]
    checksum: str
    created_at: Optional[str] = None
    count: Optional[int] = None
