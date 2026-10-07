"""Live Fraud Simulator + shared 'detect and notify' pipeline for new transactions."""
from __future__ import annotations

import random
from datetime import datetime, timedelta
from statistics import median
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from . import detector as det
from .events import broker
from .models import Anomaly, Expense
from .services import immunity, run_detection

SIM_KINDS = {
    "duplicate": "Duplicate charge",
    "huge": "Huge purchase",
    "night": "3 AM purchase",
    "travel": "Impossible travel",
}


def anomaly_event(a: Anomaly) -> dict[str, Any]:
    e = a.expense
    return {
        "type": "anomaly", "anomaly_id": a.id, "expense_id": e.id, "merchant": e.merchant,
        "amount": e.amount, "category": e.category, "risk_score": a.risk_score, "severity": a.severity,
        "reason": a.reasons[0] if a.reasons else "", "reasons": a.reasons,
        "antibody_id": a.blocked_by_antibody_id,
    }


def detect_and_notify(db: Session, expense_ids: list[int]) -> list[dict[str, Any]]:
    """Run detection, then push an SSE alert for any of ``expense_ids`` that got flagged."""
    run_detection(db)
    events = []
    for eid in expense_ids:
        a = db.scalar(select(Anomaly).where(Anomaly.expense_id == eid))
        if a is not None:
            ev = anomaly_event(a)
            broker.publish(ev)
            events.append(ev)
        else:
            e = db.get(Expense, eid)
            if e is not None:
                events.append({"type": "clean", "expense_id": eid, "merchant": e.merchant, "amount": e.amount})
    broker.publish({"type": "refresh", "immunity": immunity(db)["score"]})
    return events


def _add(db: Session, **kw: Any) -> Expense:
    e = Expense(user_id=1, source="simulator", payment_method=kw.pop("payment_method", "Credit Card"), **kw)
    db.add(e)
    db.flush()
    return e


def simulate(db: Session, kind: str) -> dict[str, Any]:
    """Inject a realistic fraud scenario *now* and run the real detection pipeline on it."""
    if kind not in SIM_KINDS:
        raise ValueError(f"unknown kind {kind}")
    now = datetime.now().replace(second=0, microsecond=0)
    rng = random.Random()
    created: list[Expense] = []
    targets: list[Expense] = []

    if kind == "duplicate":
        recent = db.scalars(select(Expense).where(Expense.amount >= 300, Expense.source != "simulator")
                            .order_by(Expense.date.desc(), Expense.time.desc()).limit(1)).first()
        base_ts = now - timedelta(minutes=rng.randint(20, 90))
        if recent is not None and (now - recent.timestamp) <= timedelta(hours=40):
            merchant, amount, cat, loc = recent.merchant, recent.amount, recent.category, recent.location
        else:
            merchant, amount, cat, loc = "Amazon Pay", 2499.0, "Shopping", "Online"
            created.append(_add(db, date=base_ts.date(), time=base_ts.strftime("%H:%M"), merchant=merchant,
                                amount=amount, category=cat, location=loc, notes="original charge"))
        targets.append(_add(db, date=now.date(), time=now.strftime("%H:%M"), merchant=merchant, amount=amount,
                            category=cat, location=loc, notes="⚠ simulated duplicate"))
    elif kind == "huge":
        shop = [e.amount for e in db.scalars(select(Expense).where(Expense.category == "Shopping"))]
        med = median(shop) if shop else 1500.0
        amount = round(med * rng.uniform(14, 16) / 10) * 10 + 9
        targets.append(_add(db, date=now.date(), time=now.strftime("%H:%M"), merchant="LuxeTime Watch Boutique",
                            amount=float(amount), category="Shopping", location="Online",
                            notes="⚠ simulated huge purchase"))
    elif kind == "night":
        t = now.replace(hour=3, minute=rng.randint(5, 50))
        targets.append(_add(db, date=now.date(), time=t.strftime("%H:%M"), merchant="Midnight Gadgets Online",
                            amount=float(rng.choice([7499, 7999, 8299])), category="Shopping", location="Online",
                            notes="⚠ simulated 3 AM purchase"))
    else:  # travel
        before = now - timedelta(minutes=rng.randint(18, 35))
        created.append(_add(db, date=before.date(), time=before.strftime("%H:%M"), merchant="Third Wave Coffee",
                            amount=float(rng.randint(260, 340)), category="Food", location="Bengaluru",
                            payment_method="UPI", notes="card present"))
        targets.append(_add(db, date=now.date(), time=now.strftime("%H:%M"), merchant="Delhi Duty Free Electronics",
                            amount=float(rng.choice([14500, 15990, 16450])), category="Shopping", location="Delhi",
                            notes="⚠ simulated impossible travel"))
    db.commit()
    events = detect_and_notify(db, [t.id for t in targets])
    return {"kind": kind, "label": SIM_KINDS[kind], "created_ids": [e.id for e in created + targets], "events": events}
