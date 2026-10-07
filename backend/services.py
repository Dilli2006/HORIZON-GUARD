"""DB-facing services: run detection, compute immunity, shared helpers."""
from __future__ import annotations

from calendar import monthrange
from datetime import date, datetime
from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from . import detector as det
from .models import Anomaly, Antibody, Budget, Expense, WhitelistPattern


def to_txn(e: Expense) -> det.Txn:
    return det.Txn(id=e.id, ts=e.timestamp, merchant=e.merchant, amount=float(e.amount),
                   category=e.category, location=e.location or "")


def pattern_lists(db: Session) -> tuple[list[tuple[int, dict[str, Any], Optional[int]]], list[tuple[int, dict[str, Any], Optional[int]]]]:
    abs_ = [(a.id, a.pattern_signature, a.learned_from_expense_id) for a in db.scalars(select(Antibody).order_by(Antibody.id))]
    wl = [(w.id, w.pattern_signature, w.learned_from_expense_id) for w in db.scalars(select(WhitelistPattern).order_by(WhitelistPattern.id))]
    return abs_, wl


def run_detection(db: Session) -> dict[str, Any]:
    """Re-score every expense and upsert Anomaly rows.

    * Resolved anomalies (legit/fraud) keep their status - the user's verdict is final.
    * Open anomalies whose score fell below the threshold are cleared.
    * Antibody / whitelist hit counters are recomputed idempotently.
    Returns stats and the list of newly-created anomaly ids.
    """
    expenses = list(db.scalars(select(Expense)))
    if not expenses:
        return {"scanned": 0, "flagged": 0, "new_anomaly_ids": [], "cleared": 0}
    antibodies, whitelist = pattern_lists(db)
    _ctx, results, cfs = det.detect_all([to_txn(e) for e in expenses], antibodies, whitelist)

    existing = {a.expense_id: a for a in db.scalars(select(Anomaly))}
    new_ids: list[int] = []
    cleared = 0
    ab_hits: dict[int, int] = {a[0]: 0 for a in antibodies}
    wl_hits: dict[int, int] = {w[0]: 0 for w in whitelist}

    for e in expenses:
        r = results[e.id]
        if r.antibody_id:
            ab_hits[r.antibody_id] = ab_hits.get(r.antibody_id, 0) + 1
        if r.whitelist_id:
            wl_hits[r.whitelist_id] = wl_hits.get(r.whitelist_id, 0) + 1
        a = existing.get(e.id)
        if r.flagged:
            payload = dict(
                risk_score=r.score, severity=r.severity,
                reasons=[s.reason for s in r.signals],
                contributions=[s.as_dict() for s in r.signals],
                counterfactuals=cfs.get(e.id, []),
                blocked_by_antibody_id=r.antibody_id,
            )
            if a is None:
                a = Anomaly(expense_id=e.id, status="open", **payload)
                db.add(a)
                db.flush()
                new_ids.append(a.id)
            elif a.status == "open":
                for k, v in payload.items():
                    setattr(a, k, v)
        elif a is not None and a.status == "open":
            db.delete(a)
            cleared += 1

    for ab in db.scalars(select(Antibody)):
        ab.hits = ab_hits.get(ab.id, 0)
    for w in db.scalars(select(WhitelistPattern)):
        w.hits = wl_hits.get(w.id, 0)
    db.commit()
    flagged = sum(1 for r in results.values() if r.flagged)
    return {"scanned": len(expenses), "flagged": flagged, "new_anomaly_ids": new_ids, "cleared": cleared}


# ----------------------------------------------------------------------------- budgets
def month_bounds(d: date) -> tuple[date, date]:
    return d.replace(day=1), d.replace(day=monthrange(d.year, d.month)[1])


def budget_status(db: Session, today: Optional[date] = None) -> list[dict[str, Any]]:
    today = today or date.today()
    start, end = month_bounds(today)
    spent: dict[str, float] = {}
    for e in db.scalars(select(Expense).where(Expense.date >= start, Expense.date <= end)):
        spent[e.category] = spent.get(e.category, 0.0) + e.amount
    out = []
    for b in db.scalars(select(Budget).order_by(Budget.category)):
        actual = round(spent.get(b.category, 0.0), 2)
        out.append({
            "category": b.category, "monthly_limit": b.monthly_limit, "actual": actual,
            "pct": round(actual / b.monthly_limit * 100, 1) if b.monthly_limit else 0,
            "over": actual > b.monthly_limit,
        })
    return out


# ----------------------------------------------------------------------------- immunity
def immunity(db: Session, as_of: Optional[datetime] = None) -> dict[str, Any]:
    """Immunity Score (0-100).

    * 40 pts - resolution ratio (resolved / all anomalies)
    * 30 pts - antibodies + whitelist patterns learned (6 pts per antibody, 3 per whitelist)
    * 30 pts - budget adherence (share of budgeted categories within limit this month)
    """
    as_of = as_of or datetime.now()
    anomalies = [a for a in db.scalars(select(Anomaly)) if a.expense and a.expense.timestamp <= as_of]
    resolved = sum(1 for a in anomalies if a.status != "open" and (a.resolved_at or as_of) <= as_of)
    total = len(anomalies)
    resolution = 40.0 * (resolved / total) if total else 40.0

    n_ab = sum(1 for a in db.scalars(select(Antibody)) if a.created_at <= as_of)
    n_wl = sum(1 for w in db.scalars(select(WhitelistPattern)) if w.created_at <= as_of)
    learning = min(30.0, n_ab * 6 + n_wl * 3)

    budgets = budget_status(db, as_of.date())
    adherence = 30.0 * (sum(1 for b in budgets if not b["over"]) / len(budgets)) if budgets else 30.0

    score = int(round(resolution + learning + adherence))
    if score >= 75:
        label = "Strong"
    elif score >= 50:
        label = "Recovering"
    elif score >= 30:
        label = "Vulnerable"
    else:
        label = "Critical"
    return {
        "score": score, "label": label,
        "components": {
            "resolution": round(resolution, 1), "learning": round(learning, 1), "budget": round(adherence, 1),
        },
        "resolved": resolved, "open": total - resolved, "antibodies": n_ab, "whitelist": n_wl,
    }
