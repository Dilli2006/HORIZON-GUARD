"""Seed 60 days of realistic INR transactions for a Bengaluru-based user + injected anomalies."""
from __future__ import annotations

import random
from datetime import date, datetime, timedelta
from typing import Any

from sqlalchemy import delete
from sqlalchemy.orm import Session

from .models import (Anomaly, Antibody, Budget, Expense, ImpulseLog, LearningEvent, User,
                     WhitelistPattern)
from .services import run_detection

DAYS = 60
HOME = "Bengaluru"

BUDGETS = {
    "Food": 14000, "Travel": 6000, "Shopping": 9000, "Bills": 32000,
    "Entertainment": 3000, "Health": 3500, "Education": 4000, "Other": 3000,
}

FOOD = [("Swiggy", 180, 650), ("Zomato", 200, 700), ("Starbucks", 280, 520), ("Chai Point", 60, 180),
        ("Meghana Foods", 350, 900), ("MTR Restaurant", 150, 420), ("Truffles", 300, 750), ("Third Wave Coffee", 220, 380)]
GROCERY = [("BigBasket", 700, 2400), ("Zepto", 250, 900), ("DMart", 900, 2600), ("Blinkit", 200, 800)]
CABS = [("Uber", 120, 460), ("Ola Cabs", 110, 420), ("Rapido", 45, 160)]
SHOP = [("Amazon", 299, 3200), ("Flipkart", 349, 2800), ("Myntra", 499, 2600), ("Nykaa", 299, 1500), ("Decathlon", 600, 2900)]
FUN = [("BookMyShow", 380, 1150), ("PVR Cinemas", 420, 980), ("Steam", 199, 899)]
HEALTH = [("Apollo Pharmacy", 150, 900), ("MedPlus", 120, 650), ("Practo Consultation", 400, 800)]
EDU = [("Udemy", 449, 799), ("Kindle Store", 149, 499)]
OTHER = [("Barber Shop", 200, 450), ("Dry Clean Express", 150, 400), ("Chemist Corner", 80, 260)]


def _hm(rng: random.Random, lo: int, hi: int) -> str:
    return f"{rng.randint(lo, hi):02d}:{rng.randint(0, 59):02d}"


def build_rows(today: date, rng: random.Random) -> list[dict[str, Any]]:
    """Return expense dicts (normal behaviour + injected anomalies)."""
    start = today - timedelta(days=DAYS - 1)
    rows: list[dict[str, Any]] = []
    seen_amounts: dict[str, set[float]] = {}

    def add(d: date, t: str, merchant: str, amount: float, category: str, method: str = "UPI",
            location: str = HOME, notes: str = "", source: str = "seed") -> None:
        amount = float(round(amount))
        # avoid accidental duplicates in the normal data (detector would rightly flag them)
        used = seen_amounts.setdefault(merchant, set())
        while source == "seed" and amount in used:
            amount += rng.choice([7, 11, 13])
        used.add(amount)
        rows.append(dict(date=d, time=t, merchant=merchant, amount=amount, category=category,
                         payment_method=method, location=location, notes=notes, source=source))

    goa_trip = {start + timedelta(days=d) for d in (31, 32, 33)}
    for i in range(DAYS):
        d = start + timedelta(days=i)
        city = "Goa" if d in goa_trip else HOME
        weekend = d.weekday() >= 5
        # --- Food: 1-3 meals/coffees a day, groceries ~2x/week (max 4 food/day)
        for _ in range(rng.randint(1, 3)):
            m, lo, hi = rng.choice(FOOD)
            add(d, _hm(rng, 8, 22), m, rng.uniform(lo, hi), "Food", location=city)
        if rng.random() < 0.28 and city == HOME:
            m, lo, hi = rng.choice(GROCERY)
            add(d, _hm(rng, 9, 21), m, rng.uniform(lo, hi), "Food", "Debit Card")
        # --- Travel: cabs on weekdays, fuel weekly
        if city == HOME:
            for _ in range(rng.randint(0, 2) if not weekend else rng.randint(0, 1)):
                m, lo, hi = rng.choice(CABS)
                add(d, _hm(rng, 8, 21), m, rng.uniform(lo, hi), "Travel")
            if d.weekday() == 6:
                add(d, _hm(rng, 9, 19), "Indian Oil Petrol", rng.uniform(1400, 2300), "Travel", "Credit Card")
        # --- Shopping ~ twice a week
        if rng.random() < 0.27:
            m, lo, hi = rng.choice(SHOP)
            add(d, _hm(rng, 10, 22), m, rng.uniform(lo, hi), "Shopping", "Credit Card", "Online")
        # --- Entertainment on weekends
        if weekend and rng.random() < 0.6:
            m, lo, hi = rng.choice(FUN)
            add(d, _hm(rng, 13, 22), m, rng.uniform(lo, hi), "Entertainment",
                location="Online" if m == "Steam" else HOME)
        if rng.random() < 0.08:
            m, lo, hi = rng.choice(HEALTH)
            add(d, _hm(rng, 9, 20), m, rng.uniform(lo, hi), "Health")
        if rng.random() < 0.05:
            m, lo, hi = rng.choice(EDU)
            add(d, _hm(rng, 18, 22), m, rng.uniform(lo, hi), "Education", "Credit Card", "Online")
        if rng.random() < 0.07:
            m, lo, hi = rng.choice(OTHER)
            add(d, _hm(rng, 10, 20), m, rng.uniform(lo, hi), "Other", "Cash")

        # --- Recurring monthly bills & subscriptions (by day of month)
        dom = d.day
        if dom == 1:
            add(d, "09:05", "NoBroker Rent", 25000, "Bills", "Net Banking", "Online", "Monthly rent")
        if dom == 3:
            add(d, "11:20", "BESCOM Electricity", rng.uniform(1550, 1900), "Bills", "UPI", "Online")
        if dom == 5:
            add(d, "08:00", "Airtel Postpaid", 799, "Bills", "Credit Card", "Online")
        if dom == 7:
            add(d, "07:30", "Netflix", 649, "Entertainment", "Credit Card", "Online")
        if dom == 12:
            # silent price increase on the most recent cycle
            price = 139 if (today - d).days < 25 else 119
            add(d, "07:45", "Spotify Premium", price, "Entertainment", "Credit Card", "Online")
        if dom == 15:
            add(d, "06:30", "Cult.fit Membership", 1499, "Health", "Credit Card", "Online")
        if dom == 20:
            add(d, "10:00", "ACT Fibernet", 1059, "Bills", "UPI", "Online")

    # --- Goa trip: booked early (warm-up period), travel day morning in Bengaluru
    trip0 = min(goa_trip)
    add(start + timedelta(days=2), "21:10", "IndiGo Airlines", 6480, "Travel", "Credit Card", "Online", "BLR-GOI return")
    add(start + timedelta(days=2), "21:25", "MakeMyTrip Hotels", 8740, "Travel", "Credit Card", "Online", "Goa stay")
    add(trip0, "06:10", "Uber", 640, "Travel", "UPI", HOME, "to airport")
    add(trip0, "13:40", "Goa Scooter Rentals", 900, "Travel", "Cash", "Goa")

    # ----------------------------------------------------------------- injected anomalies
    inj = "seed-anomaly"
    # 1) 10x amount outlier at a familiar merchant
    add(today - timedelta(days=9), "15:12", "Amazon", 42999, "Shopping", "Credit Card", "Online",
        "Unrecognised order?", inj)
    # 2) duplicate charge (same merchant, same amount, 2 h apart)
    dd = today - timedelta(days=17)
    add(dd, "12:20", "Myntra", 2349, "Shopping", "Credit Card", "Online", "", inj)
    add(dd, "14:22", "Myntra", 2349, "Shopping", "Credit Card", "Online", "charged twice?", inj)
    # 3) burst of 6 shopping transactions in one day
    bd = today - timedelta(days=24)
    for k, (m, amt) in enumerate([("Flipkart", 899), ("Ajio", 1299), ("Meesho", 649), ("Nykaa", 1150),
                                   ("Tata CLiQ", 1799), ("Amazon", 1049)]):
        add(bd, f"{11 + k}:{rng.randint(0, 59):02d}", m, amt, "Shopping", "Credit Card", "Online", "", inj)
    # 4) first-time high-value merchant
    add(today - timedelta(days=5), "16:45", "Vijay Sales Electronics", 18750 + 9, "Shopping", "Credit Card",
        HOME, "", inj)
    # 5) 2-4 AM purchases
    add(today - timedelta(days=13), "02:41", "Steam", 2999, "Entertainment", "Credit Card", "Online", "", inj)
    add(today - timedelta(days=11), "03:17", "Amazon", 1899, "Shopping", "Credit Card", "Online", "", inj)
    add(today - timedelta(days=3), "03:52", "Swiggy Instamart", 1240, "Food", "UPI", HOME, "", inj)
    # 6) impossible travel pair: Bengaluru -> Delhi in 45 minutes
    td = today - timedelta(days=7)
    add(td, "13:05", "Third Wave Coffee", 320, "Food", "UPI", HOME, "", inj)
    add(td, "13:50", "Select Citywalk Store", 6400, "Shopping", "Credit Card", "Delhi", "", inj)
    # 7) round-number transfer to an unknown payee
    add(today - timedelta(days=2), "19:30", "PhonePe Transfer - R. Verma", 10000, "Other", "UPI", HOME, "", inj)

    # never seed transactions in the future
    now = datetime.now()
    rows = [r for r in rows if datetime.combine(r["date"], datetime.strptime(r["time"], "%H:%M").time()) <= now]
    return rows


def seed(db: Session, today: date | None = None) -> dict[str, Any]:
    """Wipe and re-create demo data, then run the real detection pipeline."""
    today = today or date.today()
    for model in (Anomaly, Antibody, WhitelistPattern, LearningEvent, ImpulseLog, Expense, Budget, User):
        db.execute(delete(model))
    db.commit()
    db.add(User(id=1, name="Aarav Sharma", email="aarav@example.in", home_city=HOME))
    for cat, lim in BUDGETS.items():
        db.add(Budget(user_id=1, category=cat, monthly_limit=lim))
    rows = build_rows(today, random.Random(42))
    for r in rows:
        db.add(Expense(user_id=1, **r))
    db.commit()
    stats = run_detection(db)
    return {"expenses": len(rows), **stats}
