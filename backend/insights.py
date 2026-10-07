"""Analytics: summary, forecast, subscriptions, fever/timeline, Spend DNA, merchant trust, impulse guard."""
from __future__ import annotations

import hashlib
from calendar import monthrange
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta
from statistics import median
from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from .categorizer import CATEGORIES
from .detector import inr
from .models import Anomaly, Antibody, Budget, Expense, ImpulseLog, LearningEvent, WhitelistPattern
from .services import budget_status, immunity, month_bounds

WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def _ordinal(n: int) -> str:
    suffix = "th" if 11 <= n % 100 <= 13 else {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{suffix}"


# ----------------------------------------------------------------------------- summary
def summary(db: Session) -> dict[str, Any]:
    today = date.today()
    expenses = list(db.scalars(select(Expense)))
    anomalies = list(db.scalars(select(Anomaly)))
    m_start, _ = month_bounds(today)
    lm_end = m_start - timedelta(days=1)
    lm_start = lm_end.replace(day=1)
    lm_same_day = lm_start + timedelta(days=min(today.day, monthrange(lm_start.year, lm_start.month)[1]) - 1)

    this_month = sum(e.amount for e in expenses if e.date >= m_start)
    last_month_to_date = sum(e.amount for e in expenses if lm_start <= e.date <= lm_same_day)
    last_month = sum(e.amount for e in expenses if lm_start <= e.date <= lm_end)
    change = ((this_month - last_month_to_date) / last_month_to_date * 100) if last_month_to_date else 0.0

    open_anoms = [a for a in anomalies if a.status == "open"]
    at_risk = sum(a.expense.amount for a in open_anoms)

    by_cat: dict[str, float] = defaultdict(float)
    by_cat_month: dict[str, float] = defaultdict(float)
    daily: dict[date, dict[str, Any]] = {}
    weekday = [0.0] * 7
    weekday_n = [0] * 7
    hourly = [0] * 24
    anom_by_exp = {a.expense_id: a for a in anomalies}
    for e in expenses:
        by_cat[e.category] += e.amount
        if e.date >= m_start:
            by_cat_month[e.category] += e.amount
        d = daily.setdefault(e.date, {"total": 0.0, "count": 0, "risk": 0, "anomalies": 0})
        d["total"] += e.amount
        d["count"] += 1
        a = anom_by_exp.get(e.id)
        if a is not None and a.status != "legit":
            d["anomalies"] += 1
            d["risk"] = max(d["risk"], a.risk_score)
        weekday[e.date.weekday()] += 1
        weekday_n[e.date.weekday()] += 0
        hourly[e.timestamp.hour] += 1

    start = min(daily) if daily else today
    series = []
    cur = start
    while cur <= today:
        d = daily.get(cur, {"total": 0.0, "count": 0, "risk": 0, "anomalies": 0})
        series.append({"date": cur.isoformat(), "label": cur.strftime("%d %b"), "total": round(d["total"], 2),
                       "count": d["count"], "anomalous": d["anomalies"] > 0, "risk": d["risk"]})
        cur += timedelta(days=1)

    guard = guard_stats(db)
    events = list(db.scalars(select(LearningEvent).order_by(LearningEvent.id.desc()).limit(5)))
    return {
        "user": "Aarav Sharma",
        "total_spend": round(sum(e.amount for e in expenses), 2),
        "this_month": round(this_month, 2),
        "last_month": round(last_month, 2),
        "month_change_pct": round(change, 1),
        "transactions": len(expenses),
        "transactions_this_month": sum(1 for e in expenses if e.date >= m_start),
        "open_anomalies": len(open_anoms),
        "open_by_severity": dict(Counter(a.severity for a in open_anoms)),
        "amount_at_risk": round(at_risk, 2),
        "by_category": [{"category": c, "total": round(v, 2)} for c, v in sorted(by_cat.items(), key=lambda kv: -kv[1])],
        "by_category_month": [{"category": c, "total": round(v, 2)} for c, v in sorted(by_cat_month.items(), key=lambda kv: -kv[1])],
        "daily": series,
        "weekday": [{"day": WEEKDAYS[i], "count": int(weekday[i])} for i in range(7)],
        "hourly": [{"hour": h, "count": hourly[h]} for h in range(24)],
        "budgets": budget_status(db),
        "immunity": immunity(db),
        "impulse": guard,
        "learning": [{"kind": e.kind, "open_before": e.open_before, "open_after": e.open_after,
                      "immunity_before": e.immunity_before, "immunity_after": e.immunity_after,
                      "note": e.note, "created_at": e.created_at.isoformat()} for e in events],
        "antibody_hits": sum(a.hits for a in db.scalars(select(Antibody))),
    }


# ----------------------------------------------------------------------------- forecast
def forecast(db: Session, today: Optional[date] = None) -> list[dict[str, Any]]:
    """Linear month-end projection per budgeted category."""
    today = today or date.today()
    start, end = month_bounds(today)
    days_in_month, elapsed = end.day, today.day
    rows = list(db.scalars(select(Expense).where(Expense.date >= start, Expense.date <= today)))
    out = []
    for b in db.scalars(select(Budget).order_by(Budget.category)):
        items = sorted((e for e in rows if e.category == b.category), key=lambda e: e.date)
        spent = sum(e.amount for e in items)
        rate = spent / elapsed if elapsed else 0
        projected = rate * days_in_month
        status, message, day = "ok", f"{b.category} is on track ({inr(projected)} projected of {inr(b.monthly_limit)}).", None
        if spent > b.monthly_limit:
            running = 0.0
            for e in items:
                running += e.amount
                if running > b.monthly_limit:
                    day = e.date.day
                    break
            status = "over"
            message = f"{b.category} already exceeded its {inr(b.monthly_limit)} budget on the {_ordinal(day or today.day)}."
        elif projected > b.monthly_limit and rate > 0:
            day = min(days_in_month, int(b.monthly_limit / rate) + 1)
            status = "warning"
            message = f"At this pace, {b.category} exceeds budget by the {_ordinal(day)} (projected {inr(projected)})."
        out.append({"category": b.category, "spent": round(spent, 2), "projected": round(projected, 2),
                    "limit": b.monthly_limit, "status": status, "day": day, "message": message,
                    "pct_projected": round(projected / b.monthly_limit * 100, 1) if b.monthly_limit else 0})
    order = {"over": 0, "warning": 1, "ok": 2}
    return sorted(out, key=lambda r: (order[r["status"]], -r["pct_projected"]))


# ----------------------------------------------------------------------------- subscriptions
def subscriptions(db: Session) -> list[dict[str, Any]]:
    """Recurring charges (~monthly, similar amount) and silent price increases."""
    by_merchant: dict[str, list[Expense]] = defaultdict(list)
    for e in db.scalars(select(Expense)):
        by_merchant[e.merchant].append(e)
    out = []
    for merchant, items in by_merchant.items():
        items.sort(key=lambda e: e.timestamp)
        if len(items) < 2:
            continue
        gaps = [(b.date - a.date).days for a, b in zip(items, items[1:])]
        amounts = [e.amount for e in items]
        base = median(amounts[:-1])
        monthly = all(25 <= g <= 35 for g in gaps)
        weekly = all(6 <= g <= 8 for g in gaps) and len(items) >= 3
        similar = all(abs(a - base) <= 0.3 * base for a in amounts)
        if not ((monthly or weekly) and similar):
            continue
        last = amounts[-1]
        change = (last - amounts[-2]) / amounts[-2] * 100 if amounts[-2] else 0
        nxt = items[-1].date + timedelta(days=round(sum(gaps) / len(gaps)))
        out.append({
            "merchant": merchant, "category": items[-1].category, "amount": last,
            "previous_amount": amounts[-2], "change_pct": round(change, 1), "cadence": "monthly" if monthly else "weekly",
            "occurrences": len(items), "next_expected": nxt.isoformat(), "annual_cost": round(last * (12 if monthly else 52)),
            "alert": (f"Silent price increase: {merchant} went from {inr(amounts[-2])} to {inr(last)} (+{change:.0f}%)."
                      if change > 3 else None),
        })
    return sorted(out, key=lambda s: (s["alert"] is None, -s["amount"]))


# ----------------------------------------------------------------------------- fever / timeline
def timeline(db: Session) -> list[dict[str, Any]]:
    """Per-day replay for the Fever chart and the Immunity Time-Machine."""
    expenses = sorted(db.scalars(select(Expense)), key=lambda e: e.timestamp)
    if not expenses:
        return []
    anomalies = {a.expense_id: a for a in db.scalars(select(Anomaly))}
    antibodies = list(db.scalars(select(Antibody)))
    whitelist = list(db.scalars(select(WhitelistPattern)))
    budgets = {b.category: b.monthly_limit for b in db.scalars(select(Budget))}
    start, today = expenses[0].date, date.today()
    out = []
    cum = 0.0
    month_spend: dict[tuple[int, int, str], float] = defaultdict(float)
    flagged_total = resolved_total = 0
    idx = 0
    cur = start
    while cur <= today:
        day_spend, day_risk, day_flags = 0.0, 0, 0
        while idx < len(expenses) and expenses[idx].date == cur:
            e = expenses[idx]
            day_spend += e.amount
            month_spend[(cur.year, cur.month, e.category)] += e.amount
            a = anomalies.get(e.id)
            if a is not None:
                flagged_total += 1
                day_flags += 1
                day_risk += a.risk_score
            idx += 1
        cum += day_spend
        end_of_day = datetime.combine(cur, datetime.max.time())
        resolved_total = sum(1 for a in anomalies.values()
                             if a.resolved_at and a.resolved_at <= end_of_day and a.expense.date <= cur)
        over = sum(1 for c, lim in budgets.items() if month_spend[(cur.year, cur.month, c)] > lim)
        n_ab = sum(1 for a in antibodies if a.created_at <= end_of_day)
        n_wl = sum(1 for w in whitelist if w.created_at <= end_of_day)
        resolution = 40 * (resolved_total / flagged_total) if flagged_total else 40
        learning = min(30, n_ab * 6 + n_wl * 3)
        adherence = 30 * ((len(budgets) - over) / len(budgets)) if budgets else 30
        temp = 36.5 + min(2.6, day_risk / 45) + 0.25 * over
        out.append({
            "date": cur.isoformat(), "label": cur.strftime("%d %b"), "spend": round(day_spend, 2),
            "cumulative": round(cum, 2), "flags": day_flags, "flagged_total": flagged_total,
            "resolved_total": resolved_total, "antibodies": n_ab, "temperature": round(min(temp, 40.5), 1),
            "immunity": int(round(resolution + learning + adherence)),
        })
        cur += timedelta(days=1)
    return out


# ----------------------------------------------------------------------------- Spend DNA
def spend_dna(db: Session) -> dict[str, Any]:
    expenses = list(db.scalars(select(Expense)))
    total = sum(e.amount for e in expenses) or 1.0
    cat = {c: 0.0 for c in CATEGORIES}
    hours = [0.0] * 24
    week = [0.0] * 7
    for e in expenses:
        cat[e.category if e.category in cat else "Other"] += e.amount
        hours[e.timestamp.hour] += 1
        week[e.date.weekday()] += e.amount
    hmax, wmax = max(hours) or 1, max(week) or 1
    glitches = []
    for a in db.scalars(select(Anomaly)):
        if a.status == "legit":
            continue
        e = a.expense
        glitches.append({"anomaly_id": a.id, "hour": e.timestamp.hour + e.timestamp.minute / 60, "category": e.category,
                         "weekday": e.date.weekday(), "score": a.risk_score, "severity": a.severity,
                         "status": a.status, "merchant": e.merchant, "amount": e.amount})
    shares = {c: round(v / total, 4) for c, v in cat.items()}
    fingerprint = hashlib.sha1(repr(sorted(shares.items())).encode()).hexdigest()[:12]
    dominant = max(shares, key=shares.get) if expenses else "Other"
    peak_hour = max(range(24), key=lambda h: hours[h])
    return {
        "categories": [{"category": c, "share": s} for c, s in shares.items()],
        "hours": [round(h / hmax, 3) for h in hours],
        "weekdays": [round(w / wmax, 3) for w in week],
        "glitches": glitches, "fingerprint": fingerprint,
        "traits": [f"{dominant}-dominant", f"Peak hour {peak_hour:02d}:00",
                   f"Busiest day {WEEKDAYS[max(range(7), key=lambda i: week[i])]}"],
    }


# ----------------------------------------------------------------------------- merchant trust
def merchant_trust(db: Session) -> dict[str, dict[str, Any]]:
    """0-100 trust per merchant from tenure, frequency and verdict history."""
    today = date.today()
    groups: dict[str, list[Expense]] = defaultdict(list)
    for e in db.scalars(select(Expense)):
        groups[e.merchant].append(e)
    out = {}
    for m, items in groups.items():
        first = min(e.date for e in items)
        tenure = min(30.0, (today - first).days / 2)
        freq = min(30.0, len(items) * 3.0)
        statuses = [e.anomaly.status for e in items if e.anomaly is not None]
        score = 40 + tenure + freq - 12 * statuses.count("open") + 6 * statuses.count("legit")
        if "fraud" in statuses:
            score = min(score, 5)
        score = int(max(0, min(100, score)))
        out[m] = {"merchant": m, "trust": score, "visits": len(items), "first_seen": first.isoformat(),
                  "level": "trusted" if score >= 70 else "neutral" if score >= 40 else "risky"}
    return out


# ----------------------------------------------------------------------------- impulse guard
def guard_check(db: Session, merchant: str, amount: float, category: str, time_str: Optional[str]) -> dict[str, Any]:
    """Emotional Spending Guard: late-night and stress-spike detection before saving."""
    reasons: list[str] = []
    now = datetime.now()
    hour = int(time_str.split(":")[0]) if time_str and ":" in time_str else now.hour
    if hour >= 23 or hour < 5:
        reasons.append(f"It's {hour:02d}:00 - late-night purchases are 3× more likely to be regretted.")
    cat_amounts = [e.amount for e in db.scalars(select(Expense).where(Expense.category == category))]
    if len(cat_amounts) >= 5:
        med = median(cat_amounts)
        if amount > 2.5 * med and amount >= 1000:
            reasons.append(f"{inr(amount)} is {amount / med:.1f}× your usual {category} spend ({inr(med)}).")
    today_spend = sum(e.amount for e in db.scalars(select(Expense).where(Expense.date == now.date())))
    recent = list(db.scalars(select(Expense).where(Expense.date >= now.date() - timedelta(days=30), Expense.date < now.date())))
    baseline = (sum(e.amount for e in recent) / 30) if recent else 0
    if baseline and today_spend + amount > 2 * baseline and amount >= 500:
        reasons.append(f"Today's spending would hit {inr(today_spend + amount)} - over 2× your daily baseline "
                       f"({inr(baseline)}). Stress spending pattern detected.")
    return {
        "triggered": bool(reasons), "reasons": reasons, "cooling_seconds": 600,
        "message": ("Take a breath. Sleep on it - if you still want it in 10 minutes, it's probably a real need."
                    if reasons else "Looks like a normal purchase."),
    }


def guard_stats(db: Session) -> dict[str, Any]:
    logs = list(db.scalars(select(ImpulseLog)))
    avoided = sum(l.amount for l in logs if l.decision == "cancelled")
    return {"avoided": round(avoided, 2), "cancelled": sum(1 for l in logs if l.decision == "cancelled"),
            "proceeded": sum(1 for l in logs if l.decision == "proceeded")}
