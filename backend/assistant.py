"""AI Assistant: natural language -> validated intent JSON -> safe ORM query.

The LLM never writes SQL. It may only propose an ``Intent`` (validated by pydantic with
whitelisted enums); the query is then built with SQLAlchemy bound parameters.
"""
from __future__ import annotations

import re
from collections import defaultdict
from datetime import date, timedelta
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field, ValidationError, field_validator
from sqlalchemy import select
from sqlalchemy.orm import Session

from . import llm
from .categorizer import CATEGORIES
from .detector import inr
from .models import Anomaly, Expense

Aggregation = Literal["sum", "count", "avg", "max", "top_merchants", "by_category", "daily", "anomalies"]


class Intent(BaseModel):
    category: Optional[str] = None
    merchant: Optional[str] = Field(default=None, max_length=60)
    start: date
    end: date
    aggregation: Aggregation = "sum"
    label: str = "the selected period"

    @field_validator("category")
    @classmethod
    def _cat(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        match = next((c for c in CATEGORIES if c.lower() == v.lower()), None)
        return match


_CAT_WORDS = {
    "Food": ("food", "eat", "eating", "restaurant", "swiggy", "zomato", "grocer", "dining", "lunch", "dinner", "coffee"),
    "Travel": ("travel", "cab", "uber", "ola", "flight", "fuel", "petrol", "commute", "trip", "transport"),
    "Shopping": ("shopping", "shop", "amazon", "flipkart", "clothes", "myntra", "gadgets"),
    "Bills": ("bill", "bills", "rent", "electricity", "utilities", "recharge", "internet"),
    "Entertainment": ("entertainment", "movie", "movies", "netflix", "games", "gaming", "spotify", "ott"),
    "Health": ("health", "medical", "medicine", "pharmacy", "gym", "doctor", "fitness"),
    "Education": ("education", "course", "courses", "books", "learning", "udemy"),
    "Other": ("other", "misc", "transfer"),
}
_MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august",
           "september", "october", "november", "december"]


def rule_intent(q: str, today: Optional[date] = None, merchants: Optional[list[str]] = None) -> Intent:
    """Deterministic parser - the fallback when Gemini is unavailable."""
    today = today or date.today()
    s = q.lower()
    category = next((c for c, words in _CAT_WORDS.items() if any(re.search(rf"\b{w}\b", s) for w in words)), None)
    merchant = next((m for m in (merchants or []) if len(m) > 2 and m.lower() in s), None)

    start, end, label = today - timedelta(days=29), today, "the last 30 days"
    if "today" in s:
        start, end, label = today, today, "today"
    elif "yesterday" in s:
        start = end = today - timedelta(days=1)
        label = "yesterday"
    elif "last week" in s or "past week" in s:
        end = today - timedelta(days=today.weekday() + 1)
        start, label = end - timedelta(days=6), "last week"
    elif "this week" in s:
        start, label = today - timedelta(days=today.weekday()), "this week"
    elif "last month" in s or "previous month" in s:
        end = today.replace(day=1) - timedelta(days=1)
        start, label = end.replace(day=1), "last month"
    elif "this month" in s:
        start, label = today.replace(day=1), "this month"
    elif m := re.search(r"last (\d+) days", s):
        n = max(1, min(365, int(m.group(1))))
        start, label = today - timedelta(days=n - 1), f"the last {n} days"
    elif re.search(r"\b(all time|ever|overall|in total)\b", s):
        start, label = date(2000, 1, 1), "all time"
    else:
        for i, name in enumerate(_MONTHS):
            if re.search(rf"\b({name}|{name[:3]})\b", s):
                year = today.year if i + 1 <= today.month else today.year - 1
                start = date(year, i + 1, 1)
                nxt = date(year + (i + 1) // 12, (i + 1) % 12 + 1, 1)
                end, label = nxt - timedelta(days=1), name.title()
                break

    if any(w in s for w in ("anomal", "fraud", "suspicious", "flagged", "risk")):
        agg = "anomalies"
    elif any(w in s for w in ("how many", "number of", "count")):
        agg = "count"
    elif any(w in s for w in ("average", "avg", "mean")):
        agg = "avg"
    elif any(w in s for w in ("biggest", "largest", "most expensive", "highest", "max")):
        agg = "max"
    elif any(w in s for w in ("top merchant", "where", "which merchant", "merchants")):
        agg = "top_merchants"
    elif any(w in s for w in ("breakdown", "by category", "categories", "split")):
        agg = "by_category"
    elif any(w in s for w in ("daily", "trend", "per day", "each day")):
        agg = "daily"
    else:
        agg = "sum"
    return Intent(category=category, merchant=merchant, start=start, end=end, aggregation=agg, label=label)


def llm_intent(q: str, today: date, merchants: list[str]) -> Optional[Intent]:
    prompt = f"""Convert the user's question about their personal expenses into JSON intent. Today is {today.isoformat()}.
Allowed categories: {CATEGORIES} or null. Allowed aggregation: sum, count, avg, max, top_merchants, by_category, daily, anomalies.
Known merchants (use exact spelling or null): {merchants[:80]}
Return ONLY JSON: {{"category":..., "merchant":..., "start":"YYYY-MM-DD", "end":"YYYY-MM-DD", "aggregation":"...", "label":"short human period label"}}
Question: {q}"""
    data = llm.generate_json(prompt, timeout=10)
    if not isinstance(data, dict):
        return None
    try:
        intent = Intent(**data)
        if intent.merchant and intent.merchant not in merchants:
            intent.merchant = None
        return intent
    except (ValidationError, TypeError):
        return None


def execute(db: Session, it: Intent) -> dict[str, Any]:
    """Run the intent with parameterised ORM filters only."""
    stmt = select(Expense).where(Expense.date >= it.start, Expense.date <= it.end)
    if it.category:
        stmt = stmt.where(Expense.category == it.category)
    if it.merchant:
        stmt = stmt.where(Expense.merchant == it.merchant)
    rows = list(db.scalars(stmt.order_by(Expense.date, Expense.time)))
    scope = " ".join(filter(None, [it.merchant, it.category])) or "all"
    total = sum(r.amount for r in rows)
    chart: list[dict[str, Any]] = []
    chart_type = "bar"

    if it.aggregation == "count":
        answer = f"You made **{len(rows)}** {scope} transactions in {it.label}, totalling {inr(total)}."
    elif it.aggregation == "avg":
        avg = total / len(rows) if rows else 0
        answer = f"Your average {scope} transaction in {it.label} was **{inr(avg)}** across {len(rows)} payments."
    elif it.aggregation == "max":
        top = sorted(rows, key=lambda r: -r.amount)[:5]
        chart = [{"label": f"{r.merchant} ({r.date:%d %b})", "value": round(r.amount)} for r in top]
        answer = (f"Your biggest {scope} expense in {it.label} was **{inr(top[0].amount)}** at {top[0].merchant} "
                  f"on {top[0].date:%d %b}." if top else f"No {scope} expenses in {it.label}.")
    elif it.aggregation == "top_merchants":
        agg: dict[str, float] = defaultdict(float)
        for r in rows:
            agg[r.merchant] += r.amount
        top = sorted(agg.items(), key=lambda kv: -kv[1])[:6]
        chart = [{"label": k, "value": round(v)} for k, v in top]
        answer = (f"Top {scope} merchants in {it.label}: " + ", ".join(f"{k} ({inr(v)})" for k, v in top[:3]) + "."
                  if top else f"No {scope} expenses in {it.label}.")
    elif it.aggregation == "by_category":
        agg = defaultdict(float)
        for r in rows:
            agg[r.category] += r.amount
        top = sorted(agg.items(), key=lambda kv: -kv[1])
        chart = [{"label": k, "value": round(v)} for k, v in top]
        answer = (f"In {it.label} you spent {inr(total)}; the largest share went to **{top[0][0]}** ({inr(top[0][1])})."
                  if top else f"No expenses in {it.label}.")
    elif it.aggregation == "anomalies":
        ids = [r.id for r in rows]
        anoms = list(db.scalars(select(Anomaly).where(Anomaly.expense_id.in_(ids)))) if ids else []
        by_sev: dict[str, int] = defaultdict(int)
        for a in anoms:
            by_sev[a.severity] += 1
        chart = [{"label": k, "value": v} for k, v in sorted(by_sev.items())]
        risk = sum(a.expense.amount for a in anoms if a.status == "open")
        answer = (f"**{len(anoms)}** {scope} transactions were flagged in {it.label} "
                  f"({sum(1 for a in anoms if a.status == 'open')} still open, {inr(risk)} at risk).")
    else:
        daily: dict[date, float] = defaultdict(float)
        for r in rows:
            daily[r.date] += r.amount
        chart = [{"label": d.strftime("%d %b"), "value": round(v)} for d, v in sorted(daily.items())]
        chart_type = "line" if len(chart) > 7 else "bar"
        if it.aggregation == "daily":
            peak = max(daily.items(), key=lambda kv: kv[1], default=None)
            answer = (f"Daily {scope} spend for {it.label}: total {inr(total)}"
                      + (f", peak {inr(peak[1])} on {peak[0]:%d %b}." if peak else "."))
        else:
            answer = f"You spent **{inr(total)}** on {scope if scope != 'all' else 'everything'} in {it.label} ({len(rows)} transactions)."
    return {"answer": answer, "chart": {"type": chart_type, "data": chart}, "total": round(total, 2), "count": len(rows)}


def ask(db: Session, question: str) -> dict[str, Any]:
    today = date.today()
    merchants = sorted({m for (m,) in db.execute(select(Expense.merchant).distinct())})
    intent = llm_intent(question, today, merchants)
    source = "gemini"
    if intent is None:
        intent, source = rule_intent(question, today, merchants), "rules"
    result = execute(db, intent)
    return {**result, "intent": intent.model_dump(mode="json"), "source": source}
