"""Anomaly Court: a Prosecutor and a Defender argue over a flagged transaction."""
from __future__ import annotations

from statistics import median
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from . import detector as det
from . import llm
from .models import Anomaly, Expense


def _history(db: Session, anomaly: Anomaly) -> dict[str, Any]:
    e = anomaly.expense
    others = [x for x in db.scalars(select(Expense)) if x.id != e.id]
    same_merchant = [x for x in others if x.merchant.lower() == e.merchant.lower()]
    same_cat = [x.amount for x in others if x.category == e.category]
    hours = [x.timestamp.hour for x in others]
    night_share = sum(1 for h in hours if h < 5) / max(len(hours), 1) * 100
    return {
        "merchant_visits": len(same_merchant),
        "merchant_first_seen": min((x.date for x in same_merchant), default=None),
        "category_median": float(median(same_cat)) if same_cat else 0.0,
        "category_count": len(same_cat),
        "max_category": max(same_cat, default=0.0),
        "night_share": night_share,
        "total_txns": len(others),
    }


def _template(anomaly: Anomaly, h: dict[str, Any]) -> list[dict[str, str]]:
    """Deterministic arguments built purely from stored evidence and history."""
    e = anomaly.expense
    contribs = sorted(anomaly.contributions or [], key=lambda c: -c.get("score", 0))
    pos = [c for c in contribs if c.get("score", 0) > 0]
    top = pos[0] if pos else {"label": "risk signal", "reason": "Detector evidence on file."}
    second = pos[1] if len(pos) > 1 else None

    p1 = (f"Your Honour, transaction #{e.id} - {det.inr(e.amount)} at {e.merchant} - scored "
          f"{anomaly.risk_score}/100. Exhibit A, {top['label']}: {top['reason']}")
    if second:
        p1 += f" Exhibit B, {second['label']}: {second['reason']}"

    if h["merchant_visits"]:
        d1 = (f"Objection. My client has paid {e.merchant} {h['merchant_visits']} time(s) before"
              f"{' since ' + h['merchant_first_seen'].strftime('%d %b') if h['merchant_first_seen'] else ''}. "
              f"This is a known relationship, not a stranger.")
    else:
        d1 = (f"Every merchant is new once, Your Honour. My client has {h['category_count']} {e.category} "
              f"transactions on record and spent up to {det.inr(h['max_category'])} in this category before.")
    if e.timestamp.hour >= 5:
        d1 += f" It happened at {e.time}, well within normal waking hours."

    remaining = [c for c in pos[2:]] or ([second] if second else [])
    if anomaly.counterfactuals:
        p2 = (f"The defence ignores the arithmetic. {anomaly.counterfactuals[0]} "
              f"{'Also, ' + remaining[0]['reason'] if remaining else 'The pattern simply does not fit this user.'}")
    else:
        p2 = f"{len(pos)} independent detectors agree. Coincidence at this scale is unlikely."

    ratio = e.amount / h["category_median"] if h["category_median"] else 0
    d2 = (f"Closing: a {ratio:.1f}× spike over the {e.category} median ({det.inr(h['category_median'])}) can be a "
          f"planned purchase, a festival, a gift. With {h['total_txns']} clean transactions of history, "
          f"I ask the court to rule Legit unless the user does not recognise it.")
    return [
        {"speaker": "prosecutor", "round": 1, "text": p1},
        {"speaker": "defender", "round": 1, "text": d1},
        {"speaker": "prosecutor", "round": 2, "text": p2},
        {"speaker": "defender", "round": 2, "text": d2},
    ]


def hold_court(db: Session, anomaly: Anomaly) -> dict[str, Any]:
    e = anomaly.expense
    h = _history(db, anomaly)
    evidence = [c for c in (anomaly.contributions or []) if c.get("score", 0) > 0]
    prompt = f"""You are staging a short courtroom debate about a possibly fraudulent card/UPI transaction for an Indian user.
Transaction: #{e.id} {e.merchant}, ₹{e.amount:,.0f}, category {e.category}, {e.date} {e.time}, location {e.location}, method {e.payment_method}.
Risk score {anomaly.risk_score}/100 ({anomaly.severity}).
Detector evidence: {[c['reason'] for c in evidence]}
Counterfactuals: {anomaly.counterfactuals}
User history: {h['merchant_visits']} prior payments to this merchant; {h['category_count']} {e.category} transactions,
median ₹{h['category_median']:,.0f}, max ₹{h['max_category']:,.0f}; {h['night_share']:.1f}% of spending between 0-5 AM; {h['total_txns']} transactions total.
Write exactly 4 turns alternating prosecutor, defender, prosecutor, defender. Prosecutor argues fraud or mistake citing the detector evidence.
Defender argues legitimate citing the history. Each turn max 55 words, vivid courtroom tone, use ₹ and Indian number formatting.
Return ONLY JSON: {{"rounds":[{{"speaker":"prosecutor","round":1,"text":"..."}},...]}}"""
    data = llm.generate_json(prompt, timeout=14)
    rounds = None
    if isinstance(data, dict) and isinstance(data.get("rounds"), list) and len(data["rounds"]) >= 4:
        try:
            rounds = [{"speaker": str(r["speaker"]).lower(), "round": int(r.get("round", i // 2 + 1)),
                       "text": str(r["text"])[:600]} for i, r in enumerate(data["rounds"][:4])]
            if [r["speaker"] for r in rounds] != ["prosecutor", "defender", "prosecutor", "defender"]:
                rounds = None
        except (KeyError, TypeError, ValueError):
            rounds = None
    source = "gemini" if rounds else "template"
    rounds = rounds or _template(anomaly, h)
    return {
        "anomaly_id": anomaly.id, "source": source, "rounds": rounds,
        "evidence": evidence, "counterfactuals": anomaly.counterfactuals, "history": {
            k: (v.isoformat() if hasattr(v, "isoformat") else v) for k, v in h.items()
        },
    }
