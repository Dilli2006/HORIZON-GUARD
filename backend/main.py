"""ExpenseGuard FastAPI application main entrypoint."""
from __future__ import annotations

import csv
import io
from datetime import date, datetime
from typing import Any, Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from sqlalchemy import delete, desc, select
from sqlalchemy.orm import Session

from . import (antibodies as ab_lib, assistant, categorizer, court, database,
               events, insights, receipt, schemas, seed as seed_lib,
               services, simulator)
from .database import get_db, init_db
from .models import Anomaly, Antibody, Budget, Expense, ImpulseLog, WhitelistPattern

load_dotenv()
init_db()

app = FastAPI(
    title="ExpenseGuard API",
    description="The Financial Immune System - Explainable Anomaly Detection & Self-Learning Defense",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "app": "ExpenseGuard", "timestamp": datetime.now().isoformat()}


@app.get("/events")
async def events_stream(last_event_id: Optional[int] = Query(None, alias="lastEventId")):
    """Server-Sent Events endpoint for real-time anomaly alerts."""
    return StreamingResponse(
        events.broker.stream(last_event_id=last_event_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


# -----------------------------------------------------------------------------
# SEED
# -----------------------------------------------------------------------------
@app.post("/seed")
def seed_endpoint(db: Session = Depends(get_db)):
    result = seed_lib.seed(db)
    events.broker.publish({"type": "refresh", "message": "Demo data reseeded"})
    return {"message": "Database seeded successfully with 60 days of data + anomalies", "stats": result}


# -----------------------------------------------------------------------------
# EXPENSES
# -----------------------------------------------------------------------------
@app.get("/expenses", response_model=list[schemas.ExpenseOut])
def get_expenses(
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 150,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    stmt = select(Expense).order_by(desc(Expense.date), desc(Expense.time))
    if category:
        stmt = stmt.where(Expense.category == category)
    if search:
        kw = f"%{search.strip()}%"
        stmt = stmt.where(Expense.merchant.ilike(kw) | Expense.notes.ilike(kw))
    stmt = stmt.offset(offset).limit(limit)
    return list(db.scalars(stmt))


@app.post("/expenses", response_model=schemas.ExpenseOut)
def create_expense(data: schemas.ExpenseIn, db: Session = Depends(get_db)):
    cat = data.category or categorizer.categorize(data.merchant)
    exp = Expense(
        user_id=1,
        date=data.date,
        time=data.time,
        merchant=data.merchant,
        amount=data.amount,
        category=cat,
        payment_method=data.payment_method,
        location=data.location,
        notes=data.notes,
        source=data.source,
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)

    # Immediately trigger detector & notify
    simulator.detect_and_notify(db, [exp.id])
    db.refresh(exp)
    return exp


@app.put("/expenses/{expense_id}", response_model=schemas.ExpenseOut)
def update_expense(expense_id: int, data: schemas.ExpenseIn, db: Session = Depends(get_db)):
    exp = db.get(Expense, expense_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Expense not found")
    exp.date = data.date
    exp.time = data.time
    exp.merchant = data.merchant
    exp.amount = data.amount
    exp.category = data.category or categorizer.categorize(data.merchant)
    exp.payment_method = data.payment_method
    exp.location = data.location
    exp.notes = data.notes
    db.commit()
    simulator.detect_and_notify(db, [exp.id])
    db.refresh(exp)
    return exp


@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    exp = db.get(Expense, expense_id)
    if not exp:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(exp)
    db.commit()
    services.run_detection(db)
    events.broker.publish({"type": "refresh"})
    return {"message": "Expense deleted"}


@app.post("/expenses/import")
async def import_expenses(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = content.decode("latin-1")
    
    reader = csv.DictReader(io.StringIO(text))
    created_ids = []
    for row in reader:
        # Expected cols: date, amount, merchant, [category], [time], [payment_method], [location], [notes]
        m = row.get("merchant") or row.get("Merchant") or "Unknown"
        amt_str = row.get("amount") or row.get("Amount") or "0"
        try:
            amt = float(amt_str.replace("₹", "").replace(",", "").strip())
        except ValueError:
            continue
        d_str = row.get("date") or row.get("Date") or date.today().isoformat()
        try:
            d_val = datetime.strptime(d_str[:10], "%Y-%m-%d").date()
        except Exception:
            d_val = date.today()
        
        t_val = row.get("time") or row.get("Time") or "12:00"
        cat = row.get("category") or row.get("Category") or categorizer.categorize(m)
        pm = row.get("payment_method") or row.get("Payment Method") or "UPI"
        loc = row.get("location") or row.get("Location") or "Bengaluru"
        notes = row.get("notes") or row.get("Notes") or "Imported CSV"

        e = Expense(
            user_id=1,
            date=d_val,
            time=t_val[:5],
            merchant=m,
            amount=amt,
            category=cat,
            payment_method=pm,
            location=loc,
            notes=notes,
            source="csv_import",
        )
        db.add(e)
        db.flush()
        created_ids.append(e.id)

    db.commit()
    if created_ids:
        simulator.detect_and_notify(db, created_ids)
    return {"imported": len(created_ids)}


@app.get("/expenses/export")
def export_expenses(db: Session = Depends(get_db)):
    expenses = db.scalars(select(Expense).order_by(Expense.date.desc())).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "date", "time", "merchant", "amount", "category", "payment_method", "location", "notes", "status"])
    for e in expenses:
        status = e.anomaly.status if e.anomaly else "normal"
        writer.writerow([e.id, e.date, e.time, e.merchant, e.amount, e.category, e.payment_method, e.location, e.notes, status])
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=expenses_{date.today().isoformat()}.csv"},
    )


# -----------------------------------------------------------------------------
# BUDGETS & SUMMARY
# -----------------------------------------------------------------------------
@app.get("/budgets")
def get_budgets(db: Session = Depends(get_db)):
    return services.budget_status(db)


@app.put("/budgets")
def update_budget(data: schemas.BudgetIn, db: Session = Depends(get_db)):
    b = db.scalar(select(Budget).where(Budget.category == data.category))
    if not b:
        b = Budget(user_id=1, category=data.category, monthly_limit=data.monthly_limit)
        db.add(b)
    else:
        b.monthly_limit = data.monthly_limit
    db.commit()
    events.broker.publish({"type": "refresh"})
    return {"message": "Budget updated", "category": data.category, "limit": data.monthly_limit}


@app.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    return insights.summary(db)


# -----------------------------------------------------------------------------
# ANOMALIES & DETECTION
# -----------------------------------------------------------------------------
@app.get("/anomalies")
def get_anomalies(status: Optional[str] = None, severity: Optional[str] = None, db: Session = Depends(get_db)):
    stmt = select(Anomaly).join(Expense).order_by(desc(Anomaly.risk_score))
    if status:
        stmt = stmt.where(Anomaly.status == status)
    if severity:
        stmt = stmt.where(Anomaly.severity == severity)
    anoms = list(db.scalars(stmt))
    return [
        {
            "id": a.id,
            "expense_id": a.expense_id,
            "risk_score": a.risk_score,
            "severity": a.severity,
            "reasons": a.reasons,
            "contributions": a.contributions,
            "counterfactuals": a.counterfactuals,
            "status": a.status,
            "blocked_by_antibody_id": a.blocked_by_antibody_id,
            "created_at": a.created_at.isoformat(),
            "expense": {
                "id": a.expense.id,
                "date": a.expense.date.isoformat(),
                "time": a.expense.time,
                "merchant": a.expense.merchant,
                "amount": a.expense.amount,
                "category": a.expense.category,
                "payment_method": a.expense.payment_method,
                "location": a.expense.location,
            },
        }
        for a in anoms
    ]


@app.post("/detect/run")
def trigger_detection(db: Session = Depends(get_db)):
    stats = services.run_detection(db)
    events.broker.publish({"type": "refresh", "immunity": services.immunity(db)["score"]})
    return {"message": "Anomaly detection completed", "stats": stats}


# -----------------------------------------------------------------------------
# COURT & LEARNING LOOP
# -----------------------------------------------------------------------------
@app.post("/court/{anomaly_id}")
def get_court_debate(anomaly_id: int, db: Session = Depends(get_db)):
    a = db.get(Anomaly, anomaly_id)
    if not a:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    return court.hold_court(db, a)


@app.post("/verdict/{anomaly_id}")
def record_verdict(anomaly_id: int, payload: schemas.VerdictIn, db: Session = Depends(get_db)):
    a = db.get(Anomaly, anomaly_id)
    if not a:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    report = ab_lib.apply_verdict(db, a, payload.verdict)
    events.broker.publish({"type": "verdict", "report": report})
    return report


# -----------------------------------------------------------------------------
# ANTIBODIES & VACCINES
# -----------------------------------------------------------------------------
@app.get("/antibodies")
def list_antibodies(db: Session = Depends(get_db)):
    antibodies = list(db.scalars(select(Antibody).order_by(Antibody.hits.desc(), Antibody.id.desc())))
    whitelists = list(db.scalars(select(WhitelistPattern).order_by(WhitelistPattern.hits.desc())))
    return {
        "antibodies": [
            {
                "id": ab.id,
                "pattern_signature": ab.pattern_signature,
                "description": ab.description,
                "hits": ab.hits,
                "origin": ab.origin,
                "created_at": ab.created_at.isoformat(),
            }
            for ab in antibodies
        ],
        "whitelist": [
            {
                "id": w.id,
                "pattern_signature": w.pattern_signature,
                "description": w.description,
                "hits": w.hits,
                "created_at": w.created_at.isoformat(),
            }
            for w in whitelists
        ],
    }


@app.get("/vaccine/export")
def export_vaccine_pack(db: Session = Depends(get_db)):
    return ab_lib.export_vaccine(db)


@app.post("/vaccine/import")
def import_vaccine_pack(pack: schemas.VaccineIn, db: Session = Depends(get_db)):
    try:
        res = ab_lib.import_vaccine(db, pack.model_dump())
        events.broker.publish({"type": "refresh"})
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# -----------------------------------------------------------------------------
# SIMULATOR & ASSISTANT & EXTRAS
# -----------------------------------------------------------------------------
@app.post("/simulator/inject")
def inject_simulation(kind: str = Query(..., regex="^(duplicate|huge|night|travel)$"), db: Session = Depends(get_db)):
    res = simulator.simulate(db, kind)
    return res


@app.post("/assistant/ask")
def ask_assistant(req: schemas.AskIn, db: Session = Depends(get_db)):
    return assistant.ask(db, req.question)


@app.get("/forecast")
def get_forecast(db: Session = Depends(get_db)):
    return insights.forecast(db)


@app.get("/subscriptions")
def get_subscriptions(db: Session = Depends(get_db)):
    return insights.subscriptions(db)


@app.get("/timeline")
def get_timeline(db: Session = Depends(get_db)):
    return insights.timeline(db)


@app.get("/spend-dna")
def get_spend_dna(db: Session = Depends(get_db)):
    return insights.spend_dna(db)


@app.get("/merchant-trust")
def get_merchant_trust(db: Session = Depends(get_db)):
    return insights.merchant_trust(db)


@app.post("/guard/check")
def check_impulse_guard(req: schemas.GuardCheckIn, db: Session = Depends(get_db)):
    cat = req.category or categorizer.categorize(req.merchant)
    return insights.guard_check(db, req.merchant, req.amount, cat, req.time)


@app.post("/guard/log")
def log_impulse_guard(req: schemas.GuardLogIn, db: Session = Depends(get_db)):
    entry = ImpulseLog(
        merchant=req.merchant,
        amount=req.amount,
        category=req.category,
        reasons=req.reasons,
        decision=req.decision,
    )
    db.add(entry)
    db.commit()
    events.broker.publish({"type": "refresh"})
    return {"message": "Impulse decision recorded", "avoided": req.amount if req.decision == "cancelled" else 0}


@app.post("/receipt/scan")
async def scan_receipt_image(file: UploadFile = File(...)):
    raw = await file.read()
    return receipt.scan(file.filename or "receipt.jpg", file.content_type or "image/jpeg", raw)
