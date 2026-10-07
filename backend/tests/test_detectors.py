"""Unit tests for each of the 7 anomaly detectors + antibodies & whitelist."""
from datetime import datetime
import pytest
from backend import detector as det

def test_robust_z_outlier():
    # 20 typical food txns around 300, plus one huge 5000 txn
    txns = [
        det.Txn(id=i, ts=datetime(2026, 9, 1, 12, 0), merchant="Swiggy", amount=300.0, category="Food")
        for i in range(1, 21)
    ]
    outlier = det.Txn(id=99, ts=datetime(2026, 9, 2, 13, 0), merchant="Swiggy", amount=4500.0, category="Food")
    ctx = det.DetectionContext(txns + [outlier], fit_model=False)
    res = ctx.score(outlier)
    assert res.score >= 20
    assert any(s.detector == "robust_z" for s in res.signals)

def test_duplicate_charge():
    t1 = det.Txn(id=1, ts=datetime(2026, 9, 10, 10, 0), merchant="Amazon", amount=1499.0, category="Shopping")
    t2 = det.Txn(id=2, ts=datetime(2026, 9, 10, 11, 30), merchant="Amazon", amount=1499.0, category="Shopping")
    ctx = det.DetectionContext([t1, t2], fit_model=False)
    res = ctx.score(t2)
    assert any(s.detector == "duplicate" for s in res.signals)

def test_first_time_merchant():
    txns = [
        det.Txn(id=i, ts=datetime(2026, 8, i, 12, 0), merchant="Known Store", amount=500.0, category="Shopping")
        for i in range(1, 16)
    ]
    new_m = det.Txn(id=99, ts=datetime(2026, 9, 1, 14, 0), merchant="Luxury Brand Store", amount=6500.0, category="Shopping")
    ctx = det.DetectionContext(txns + [new_m], fit_model=False)
    res = ctx.score(new_m)
    assert any(s.detector == "first_time_merchant" for s in res.signals)

def test_burst_detection():
    # 6 Shopping transactions in the same day
    txns = [
        det.Txn(id=i, ts=datetime(2026, 9, 15, 10 + i, 0), merchant=f"Shop {i}", amount=400.0, category="Shopping")
        for i in range(6)
    ]
    ctx = det.DetectionContext(txns, fit_model=False)
    res = ctx.score(txns[-1])
    assert any(s.detector == "burst" for s in res.signals)

def test_impossible_travel():
    t1 = det.Txn(id=1, ts=datetime(2026, 9, 20, 12, 0), merchant="Cafe", amount=250.0, category="Food", location="Bengaluru")
    t2 = det.Txn(id=2, ts=datetime(2026, 9, 20, 12, 45), merchant="Mall", amount=3500.0, category="Shopping", location="Delhi")
    ctx = det.DetectionContext([t1, t2], fit_model=False)
    res = ctx.score(t2)
    assert any(s.detector == "impossible_travel" for s in res.signals)

def test_round_number():
    t = det.Txn(id=1, ts=datetime(2026, 9, 5, 15, 0), merchant="Transfer Person", amount=10000.0, category="Other")
    ctx = det.DetectionContext([t], fit_model=False)
    res = ctx.score(t)
    assert any(s.detector == "round_number" for s in res.signals)

def test_late_night():
    t = det.Txn(id=1, ts=datetime(2026, 9, 5, 3, 30), merchant="Night Order", amount=1200.0, category="Food")
    ctx = det.DetectionContext([t], fit_model=False)
    res = ctx.score(t)
    assert any(s.detector == "late_night" for s in res.signals)

def test_antibody_blocks_future():
    t = det.Txn(id=10, ts=datetime(2026, 9, 5, 2, 0), merchant="Shady Shop", amount=5000.0, category="Shopping")
    sig = det.build_signature(t)
    antibodies = [(1, sig, 99)]
    ctx = det.DetectionContext([t], fit_model=False)
    res = ctx.score(t, antibodies=antibodies)
    assert res.score >= det.ANTIBODY_FLOOR
    assert res.antibody_id == 1
