"""Hybrid, fully-explainable anomaly engine.

Every detector inspects one transaction against a ``DetectionContext`` built from the
user's real history and returns zero or more ``Signal`` objects (score contribution +
plain-English reason). Signals are combined into a 0-100 risk score.

Design notes
------------
* Pure Python / numpy / scikit-learn - no DB access here, which keeps it unit-testable.
* Detectors are *point-in-time aware* where it matters (first-time merchant, duplicates,
  impossible travel only look at **earlier** transactions).
* Recurring payments (rent, subscriptions - same merchant, similar amount, ~monthly)
  are recognised and excluded from amount-based detectors to avoid false alarms.
"""
from __future__ import annotations

import math
from bisect import bisect_left
from collections import Counter, defaultdict
from dataclasses import dataclass, field, replace
from datetime import datetime, timedelta
from statistics import median
from typing import Any, Iterable, Optional

import numpy as np

from .categorizer import CATEGORIES
from .cities import MAX_TRAVEL_KMH, coords, haversine_km

# ----------------------------------------------------------------------------- config
MIN_FLAG_SCORE = 12          # below this a transaction is not stored as an anomaly
ROBUST_Z_THRESHOLD = 3.5     # Iglewicz & Hoaglin recommendation
DUPLICATE_WINDOW_H = 48
DUPLICATE_MIN_AMOUNT = 200   # ignore ₹20 chai collisions
FIRST_TIME_MULTIPLIER = 3.0
FIRST_TIME_WARMUP_DAYS = 14  # need some history before "first time" means anything
BURST_MIN_COUNT = 5
ROUND_MIN_AMOUNT = 5000
LATE_NIGHT_HOURS = range(0, 5)
WHITELIST_FACTOR = 0.3       # whitelisted patterns are dampened, not silenced
ANTIBODY_FLOOR = 85          # antibody match forces at least this score

DETECTOR_LABELS: dict[str, str] = {
    "robust_z": "Amount outlier",
    "isolation_forest": "Behaviour anomaly (ML)",
    "duplicate": "Duplicate charge",
    "first_time_merchant": "New high-value merchant",
    "burst": "Spending burst",
    "impossible_travel": "Impossible travel",
    "round_number": "Round-number payment",
    "late_night": "Late-night purchase",
    "antibody": "Antibody match",
    "whitelist": "Whitelisted pattern",
}


def inr(x: float) -> str:
    """Indian-format currency string: 1234567 -> ₹12,34,567."""
    neg = x < 0
    n = int(round(abs(x)))
    s = str(n)
    if len(s) > 3:
        head, tail = s[:-3], s[-3:]
        parts = []
        while len(head) > 2:
            parts.insert(0, head[-2:])
            head = head[:-2]
        if head:
            parts.insert(0, head)
        s = ",".join(parts) + "," + tail
    return f"{'-' if neg else ''}₹{s}"


def severity_for(score: float) -> str:
    """Spec thresholds: Low <20, Medium 20-39, High 40+."""
    if score >= 40:
        return "High"
    if score >= 20:
        return "Medium"
    return "Low"


# ----------------------------------------------------------------------------- types
@dataclass(frozen=True)
class Txn:
    id: int
    ts: datetime
    merchant: str
    amount: float
    category: str
    location: str = ""

    @property
    def merchant_key(self) -> str:
        return " ".join(self.merchant.lower().split())


@dataclass
class Signal:
    detector: str
    score: float
    reason: str

    def as_dict(self) -> dict[str, Any]:
        return {
            "detector": self.detector,
            "label": DETECTOR_LABELS.get(self.detector, self.detector),
            "score": round(self.score, 1),
            "reason": self.reason,
        }


@dataclass
class Result:
    txn: Txn
    score: int
    severity: str
    signals: list[Signal] = field(default_factory=list)
    antibody_id: Optional[int] = None
    whitelist_id: Optional[int] = None

    @property
    def flagged(self) -> bool:
        return self.score >= MIN_FLAG_SCORE


# ----------------------------------------------------------------------------- patterns
def match_pattern(sig: dict[str, Any], t: Txn) -> bool:
    """Fuzzy signature match used by antibodies and the whitelist.

    signature keys: category, amount_min, amount_max, hour_start, hour_end (inclusive,
    may wrap past midnight), merchant (optional lowercase token).
    """
    if sig.get("category") and sig["category"] != t.category:
        return False
    if not (sig.get("amount_min", 0) <= t.amount <= sig.get("amount_max", math.inf)):
        return False
    hs, he, h = sig.get("hour_start", 0), sig.get("hour_end", 23), t.ts.hour
    in_window = hs <= h <= he if hs <= he else (h >= hs or h <= he)
    if not in_window:
        return False
    token = sig.get("merchant")
    if token and token not in t.merchant_key:
        return False
    return True


def build_signature(t: Txn, band: float = 0.25, hour_pad: int = 2) -> dict[str, Any]:
    """Derive a fuzzy pattern signature from a transaction."""
    return {
        "merchant": t.merchant_key,
        "category": t.category,
        "amount_min": round(t.amount * (1 - band), 2),
        "amount_max": round(t.amount * (1 + band), 2),
        "hour_start": (t.ts.hour - hour_pad) % 24,
        "hour_end": (t.ts.hour + hour_pad) % 24,
    }


def describe_signature(sig: dict[str, Any]) -> str:
    merchant = sig.get("merchant") or "any merchant"
    return (
        f"{merchant.title()} · {sig.get('category', 'any')} · "
        f"{inr(sig.get('amount_min', 0))}-{inr(sig.get('amount_max', 0))} · "
        f"{sig.get('hour_start', 0):02d}:00-{sig.get('hour_end', 23):02d}:59"
    )


# ----------------------------------------------------------------------------- context
def _mad(values: list[float]) -> tuple[float, float]:
    med = float(median(values))
    mad = float(median([abs(v - med) for v in values]))
    return med, mad


class DetectionContext:
    """Pre-computed statistics over the user's full transaction history."""

    def __init__(self, txns: Iterable[Txn], fit_model: bool = True) -> None:
        self.txns: list[Txn] = sorted(txns, key=lambda t: (t.ts, t.id))
        self.ts_list = [t.ts for t in self.txns]
        self.by_merchant: dict[str, list[Txn]] = defaultdict(list)
        self.by_category: dict[str, list[Txn]] = defaultdict(list)
        self.by_day_cat: Counter[tuple[Any, str]] = Counter()
        for t in self.txns:
            self.by_merchant[t.merchant_key].append(t)
            self.by_category[t.category].append(t)
            self.by_day_cat[(t.ts.date(), t.category)] += 1

        self.overall_median = float(median([t.amount for t in self.txns])) if self.txns else 0.0
        self.first_ts = self.txns[0].ts if self.txns else None
        self.cat_stats: dict[str, tuple[float, float, int]] = {}
        for cat, items in self.by_category.items():
            amounts = [t.amount for t in items if not self.is_recurring(t)]
            if len(amounts) >= 5:
                med, mad = _mad(amounts)
                self.cat_stats[cat] = (med, mad, len(amounts))
        hours = Counter(t.ts.hour for t in self.txns)
        self.hour_share = {h: hours.get(h, 0) / max(len(self.txns), 1) for h in range(24)}
        daily = Counter(t.ts.date() for t in self.txns)
        self.typical_daily_cat = {
            cat: max(1, int(np.percentile([self.by_day_cat[(d, cat)] for d in daily], 95)))
            for cat in self.by_category
        } if daily else {}

        self.model = None
        self._feature_cache: dict[int, list[float]] = {}
        self._if_threshold = 0.0
        self._if_min = -1.0
        if fit_model and len(self.txns) >= 30:
            self._fit_isolation_forest()

    # -- helpers -----------------------------------------------------------------
    def is_recurring(self, t: Txn) -> bool:
        """Same merchant, amount within 20 %, consecutive gaps of 20-40 days."""
        items = [x for x in self.by_merchant.get(t.merchant_key, []) if abs(x.amount - t.amount) <= 0.2 * t.amount]
        if len(items) < 2:
            return False
        items.sort(key=lambda x: x.ts)
        for a, b in zip(items, items[1:]):
            if 20 <= (b.ts - a.ts).days <= 40 and (a.id == t.id or b.id == t.id):
                return True
        return False

    def prior(self, t: Txn) -> list[Txn]:
        """All transactions strictly before ``t`` (ties broken by id)."""
        i = bisect_left(self.ts_list, t.ts)
        earlier = self.txns[:i]
        # include same-timestamp rows with smaller ids
        j = i
        while j < len(self.txns) and self.txns[j].ts == t.ts:
            if self.txns[j].id < t.id:
                earlier.append(self.txns[j])
            j += 1
        return [x for x in earlier if x.id != t.id]

    def _features(self, t: Txn) -> list[float]:
        merchant_freq = sum(1 for x in self.by_merchant.get(t.merchant_key, []) if x.id != t.id)
        prev_cat = [x for x in self.by_category.get(t.category, []) if x.ts < t.ts and x.id != t.id]
        days_since = (t.ts - prev_cat[-1].ts).total_seconds() / 86400 if prev_cat else 30.0
        cat_idx = CATEGORIES.index(t.category) if t.category in CATEGORIES else len(CATEGORIES) - 1
        hour = t.ts.hour + t.ts.minute / 60
        return [
            math.log1p(t.amount),
            math.sin(2 * math.pi * hour / 24), math.cos(2 * math.pi * hour / 24),
            float(t.ts.weekday()),
            float(cat_idx),
            math.log1p(merchant_freq),
            min(days_since, 30.0),
        ]

    def _fit_isolation_forest(self) -> None:
        from sklearn.ensemble import IsolationForest

        X = np.array([self._features(t) for t in self.txns])
        self.model = IsolationForest(n_estimators=200, contamination=0.04, random_state=42)
        self.model.fit(X)
        scores = self.model.decision_function(X)
        self._if_min = float(scores.min())
        self._X_mean, self._X_std = X.mean(axis=0), X.std(axis=0) + 1e-9

    # -- detectors -----------------------------------------------------------------
    def detect_robust_z(self, t: Txn) -> list[Signal]:
        stats = self.cat_stats.get(t.category)
        if not stats or self.is_recurring(t):
            return []
        med, mad, _n = stats
        scale = mad if mad > 0 else max(med * 0.25, 1.0)
        z = 0.6745 * (t.amount - med) / scale
        if z <= ROBUST_Z_THRESHOLD:
            return []
        score = min(40.0, 14 + (z - ROBUST_Z_THRESHOLD) * 2.5)
        mult = t.amount / med if med else 0
        return [Signal("robust_z", score,
                       f"{inr(t.amount)} is {mult:.1f}× your typical {t.category} spend "
                       f"(median {inr(med)}); robust z-score {z:.1f} > {ROBUST_Z_THRESHOLD}.")]

    def detect_isolation_forest(self, t: Txn) -> list[Signal]:
        if self.model is None or self.is_recurring(t):
            return []
        f = np.array([self._features(t)])
        s = float(self.model.decision_function(f)[0])
        if s >= self._if_threshold:
            return []
        norm = min(1.0, (self._if_threshold - s) / max(self._if_threshold - self._if_min, 1e-6))
        score = 6 + 14 * norm
        # explain: which features deviate most from the population
        z = (f[0] - self._X_mean) / self._X_std
        names = ["amount", "hour", "hour", "weekday", "category", "merchant familiarity", "category gap"]
        top: list[str] = []
        for idx in np.argsort(-np.abs(z)):
            name = names[idx]
            if name not in top:
                top.append(name)
            if len(top) == 2:
                break
        detail = {
            "amount": f"amount {inr(t.amount)}",
            "hour": f"time {t.ts:%H:%M}",
            "weekday": f"{t.ts:%A}",
            "category": f"category {t.category}",
            "merchant familiarity": "rarely-used merchant",
            "category gap": "unusual gap since last purchase in category",
        }
        return [Signal("isolation_forest", score,
                       f"IsolationForest isolated this transaction quickly (score {s:.3f}); "
                       f"most unusual: {', '.join(detail[n] for n in top)}.")]

    def detect_duplicate(self, t: Txn) -> list[Signal]:
        if t.amount < DUPLICATE_MIN_AMOUNT:
            return []
        for x in reversed(self.by_merchant.get(t.merchant_key, [])):
            if x.id == t.id or abs(x.amount - t.amount) > 0.01:
                continue
            gap = (t.ts - x.ts).total_seconds() / 3600
            if 0 <= gap <= DUPLICATE_WINDOW_H and (gap > 0 or x.id < t.id):
                when = f"{gap * 60:.0f} min" if gap < 1 else f"{gap:.1f} h"
                return [Signal("duplicate", 30,
                               f"Possible duplicate: {t.merchant} charged the identical amount "
                               f"{inr(t.amount)} {when} earlier (txn #{x.id}).")]
        return []

    def detect_first_time_merchant(self, t: Txn) -> list[Signal]:
        if self.first_ts is None or (t.ts - self.first_ts).days < FIRST_TIME_WARMUP_DAYS:
            return []
        earlier_same = [x for x in self.by_merchant.get(t.merchant_key, []) if x.id != t.id and
                        (x.ts < t.ts or (x.ts == t.ts and x.id < t.id))]
        if earlier_same:
            return []
        prior = self.prior(t)
        if len(prior) < 10:
            return []
        base = float(median([x.amount for x in prior]))
        if t.amount <= FIRST_TIME_MULTIPLIER * base:
            return []
        return [Signal("first_time_merchant", 22,
                       f"First-ever payment to {t.merchant}, and {inr(t.amount)} is "
                       f"{t.amount / base:.1f}× your median transaction ({inr(base)}).")]

    def detect_burst(self, t: Txn) -> list[Signal]:
        n = self.by_day_cat.get((t.ts.date(), t.category), 0)
        if n < BURST_MIN_COUNT:
            return []
        typical = self.typical_daily_cat.get(t.category, 2)
        return [Signal("burst", min(30.0, 18 + 3 * (n - BURST_MIN_COUNT)),
                       f"Burst: {n} {t.category} transactions on {t.ts:%d %b} "
                       f"(you normally make ≤{typical} per day).")]

    def detect_impossible_travel(self, t: Txn) -> list[Signal]:
        here = coords(t.location)
        if here is None:
            return []
        for x in reversed(self.prior(t)):
            there = coords(x.location)
            if there is None:
                continue
            dist = haversine_km(there, here)
            if dist < 50:
                return []  # last known location is the same city
            hours = max((t.ts - x.ts).total_seconds() / 3600, 1 / 60)
            speed = dist / hours
            if speed > MAX_TRAVEL_KMH:
                gap = f"{hours * 60:.0f} min" if hours < 1 else f"{hours:.1f} h"
                return [Signal("impossible_travel", 35,
                               f"Impossible travel: {x.location} → {t.location} ({dist:,.0f} km) "
                               f"in {gap} would need {speed:,.0f} km/h (txn #{x.id}).")]
            return []
        return []

    def detect_round_number(self, t: Txn) -> list[Signal]:
        if t.amount < ROUND_MIN_AMOUNT or t.amount % 1000 != 0 or self.is_recurring(t):
            return []
        return [Signal("round_number", 12,
                       f"Large round-number payment of {inr(t.amount)} - common in scams, "
                       f"advance-fee and social-engineering transfers.")]

    def detect_late_night(self, t: Txn) -> list[Signal]:
        if t.ts.hour not in LATE_NIGHT_HOURS:
            return []
        share = sum(self.hour_share.get(h, 0) for h in LATE_NIGHT_HOURS) * 100
        return [Signal("late_night", 15,
                       f"Made at {t.ts:%I:%M %p}; only {share:.1f}% of your spending happens "
                       f"between midnight and 5 AM.")]

    DETECTORS = (
        "detect_robust_z", "detect_isolation_forest", "detect_duplicate",
        "detect_first_time_merchant", "detect_burst", "detect_impossible_travel",
        "detect_round_number", "detect_late_night",
    )

    # -- combination ----------------------------------------------------------------
    def raw_signals(self, t: Txn) -> list[Signal]:
        out: list[Signal] = []
        for name in self.DETECTORS:
            try:
                out.extend(getattr(self, name)(t))
            except Exception as exc:  # a single detector must never break the pipeline
                out.append(Signal(name.replace("detect_", ""), 0, f"detector error: {exc}"))
        return [s for s in out if s.score > 0]

    def score(
        self,
        t: Txn,
        antibodies: Optional[list[tuple[int, dict[str, Any], Optional[int]]]] = None,
        whitelist: Optional[list[tuple[int, dict[str, Any], Optional[int]]]] = None,
    ) -> Result:
        """Score a transaction. antibodies/whitelist: [(id, signature, source_expense_id)]."""
        signals = self.raw_signals(t)
        total = min(100.0, sum(s.score for s in signals))
        antibody_id = whitelist_id = None

        for wid, sig, src in whitelist or []:
            if src != t.id and match_pattern(sig, t) and total > 0:
                reduced = total * WHITELIST_FACTOR
                signals.append(Signal("whitelist", reduced - total,
                                      f"Reduced: matches a pattern you confirmed as legit (whitelist #{wid})."))
                total, whitelist_id = reduced, wid
                break
        for aid, sig, src in antibodies or []:
            if src != t.id and match_pattern(sig, t):
                boost = max(0.0, ANTIBODY_FLOOR - total)
                signals.insert(0, Signal("antibody", boost,
                                         f"Blocked by antibody #{aid}: matches a fraud pattern you "
                                         f"confirmed ({describe_signature(sig)})."))
                total, antibody_id, whitelist_id = max(total, ANTIBODY_FLOOR), aid, None
                break

        final = int(round(max(0.0, min(100.0, total))))
        return Result(t, final, severity_for(final), signals, antibody_id, whitelist_id)

    # -- counterfactuals --------------------------------------------------------------
    def counterfactuals(self, t: Txn, **kw: Any) -> list[str]:
        """Smallest single changes that would bring the score below ``MIN_FLAG_SCORE``."""
        base = self.score(t, **kw)
        if not base.flagged or base.antibody_id:
            return ["Matches a learned fraud antibody - only a verdict of Legit would clear it."] if base.antibody_id else []
        out: list[str] = []
        detectors = {s.detector for s in base.signals}

        # 1. amount: binary-search the largest amount that clears the flag
        lo, hi = 1.0, t.amount
        if self.score(replace(t, amount=lo), **kw).flagged is False:
            for _ in range(18):
                mid = (lo + hi) / 2
                if self.score(replace(t, amount=mid), **kw).flagged:
                    hi = mid
                else:
                    lo = mid
            if lo < t.amount * 0.98:
                out.append(f"Would not be flagged if the amount were ≤ {inr(lo)} (instead of {inr(t.amount)}).")

        # 2. time of day
        if detectors & {"late_night", "isolation_forest"}:
            for hour in (14, 11, 19):
                alt = replace(t, ts=t.ts.replace(hour=hour))
                if not self.score(alt, **kw).flagged:
                    out.append(f"Would not be flagged if made during the day (e.g. {hour % 12 or 12} {'PM' if hour >= 12 else 'AM'}).")
                    break

        # 3. location
        if "impossible_travel" in detectors:
            prev = next((x for x in reversed(self.prior(t)) if coords(x.location)), None)
            if prev and not self.score(replace(t, location=prev.location), **kw).flagged:
                out.append(f"Would not be flagged if it had happened in {prev.location} (your last known city).")

        # 4. structural reasons have no numeric fix
        if "duplicate" in detectors and len(out) < 3:
            out.append("Would not be flagged if this were the only identical charge within 48 hours.")
        if "burst" in detectors and len(out) < 3:
            out.append(f"Would not be flagged with fewer than {BURST_MIN_COUNT} {t.category} purchases that day.")
        if "first_time_merchant" in detectors and len(out) < 3:
            out.append("Would carry less risk at a merchant you've paid before.")
        return out[:3]


def detect_all(
    txns: list[Txn],
    antibodies: Optional[list[tuple[int, dict[str, Any], Optional[int]]]] = None,
    whitelist: Optional[list[tuple[int, dict[str, Any], Optional[int]]]] = None,
    with_counterfactuals: bool = True,
) -> tuple[DetectionContext, dict[int, Result], dict[int, list[str]]]:
    """Run every detector over every transaction."""
    ctx = DetectionContext(txns)
    results = {t.id: ctx.score(t, antibodies=antibodies, whitelist=whitelist) for t in ctx.txns}
    cfs: dict[int, list[str]] = {}
    if with_counterfactuals:
        for tid, r in results.items():
            if r.flagged:
                cfs[tid] = ctx.counterfactuals(r.txn, antibodies=antibodies, whitelist=whitelist)
    return ctx, results, cfs
