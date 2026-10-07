"""Financial Immune System: learning loop (antibodies, whitelist) and vaccine packs."""
from __future__ import annotations

import hashlib
import json
from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from . import detector as det
from .models import Anomaly, Antibody, LearningEvent, WhitelistPattern
from .services import immunity, run_detection, to_txn

VACCINE_FORMAT = "expenseguard-vaccine/v1"


def apply_verdict(db: Session, anomaly: Anomaly, verdict: str) -> dict[str, Any]:
    """Record the judge's verdict and feed the learning loop.

    fraud -> create an Antibody (future matches auto-flagged as "Blocked by antibody #N")
    legit -> create a whitelist pattern (similar transactions get dampened scores)
    Returns a before/after report proving the model changed.
    """
    if verdict not in ("legit", "fraud"):
        raise ValueError("verdict must be 'legit' or 'fraud'")
    open_before = sum(1 for a in db.scalars(select(Anomaly)) if a.status == "open")
    immunity_before = immunity(db)["score"]

    anomaly.status = verdict
    anomaly.resolved_at = datetime.now()
    txn = to_txn(anomaly.expense)
    created: dict[str, Any] = {}

    if verdict == "fraud":
        sig = det.build_signature(txn, band=0.25, hour_pad=2)
        already = any(a.pattern_signature == sig for a in db.scalars(select(Antibody)))
        if not already:
            ab = Antibody(
                pattern_signature=sig,
                description=f"Learned from {txn.merchant} {det.inr(txn.amount)} at {txn.ts:%H:%M} "
                            f"- {', '.join(det.DETECTOR_LABELS.get(c['detector'], c['detector']) for c in anomaly.contributions[:3])}",
                learned_from_anomaly_id=anomaly.id, learned_from_expense_id=txn.id, origin="learned",
            )
            db.add(ab)
            db.flush()
            created = {"type": "antibody", "id": ab.id, "signature": sig, "pretty": det.describe_signature(sig)}
    else:
        sig = det.build_signature(txn, band=0.3, hour_pad=2)
        wl = WhitelistPattern(
            pattern_signature=sig,
            description=f"Confirmed legit: {txn.merchant} around {det.inr(txn.amount)}",
            learned_from_anomaly_id=anomaly.id, learned_from_expense_id=txn.id,
        )
        db.add(wl)
        db.flush()
        created = {"type": "whitelist", "id": wl.id, "signature": sig, "pretty": det.describe_signature(sig)}
    db.commit()

    stats = run_detection(db)
    open_after = sum(1 for a in db.scalars(select(Anomaly)) if a.status == "open")
    immunity_after = immunity(db)["score"]
    note = (f"Antibody #{created.get('id')} now guards against this pattern."
            if verdict == "fraud" else f"Whitelist #{created.get('id')} will stop similar false alarms.")
    ev = LearningEvent(kind=verdict, anomaly_id=anomaly.id, open_before=open_before, open_after=open_after,
                       immunity_before=immunity_before, immunity_after=immunity_after, note=note)
    db.add(ev)
    db.commit()
    return {
        "anomaly_id": anomaly.id, "verdict": verdict, "learned": created,
        "open_before": open_before, "open_after": open_after,
        "immunity_before": immunity_before, "immunity_after": immunity_after,
        "detection": stats, "note": note,
    }


# ----------------------------------------------------------------------------- vaccines
def _checksum(items: list[dict[str, Any]]) -> str:
    return hashlib.sha256(json.dumps(items, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def export_vaccine(db: Session) -> dict[str, Any]:
    """Export learned antibodies as a shareable, tamper-evident 'vaccine pack'."""
    items = [{"signature": a.pattern_signature, "description": a.description}
             for a in db.scalars(select(Antibody).order_by(Antibody.id))]
    return {"format": VACCINE_FORMAT, "created_at": datetime.now().isoformat(timespec="seconds"),
            "count": len(items), "antibodies": items, "checksum": _checksum(items)}


def import_vaccine(db: Session, pack: dict[str, Any]) -> dict[str, Any]:
    """Import a vaccine pack (acquired immunity). Verifies format + checksum."""
    if pack.get("format") != VACCINE_FORMAT:
        raise ValueError("Unsupported vaccine format")
    items = pack.get("antibodies") or []
    if _checksum(items) != pack.get("checksum"):
        raise ValueError("Checksum mismatch - vaccine pack was modified")
    existing = [a.pattern_signature for a in db.scalars(select(Antibody))]
    added = 0
    for it in items:
        sig = it.get("signature")
        if not isinstance(sig, dict) or sig in existing:
            continue
        db.add(Antibody(pattern_signature=sig, description=f"Acquired: {it.get('description', '')}"[:500],
                        origin="acquired"))
        existing.append(sig)
        added += 1
    db.commit()
    stats = run_detection(db)
    return {"added": added, "skipped": len(items) - added, "detection": stats}
