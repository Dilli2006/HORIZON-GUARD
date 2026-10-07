"""Receipt scan: Gemini Vision extraction with a deterministic heuristic fallback."""
from __future__ import annotations

import io
import re
from datetime import date
from typing import Any

from . import llm
from .categorizer import CATEGORIES, categorize


def _fallback(filename: str, image_bytes: bytes) -> dict[str, Any]:
    """Heuristic pre-fill from filename (e.g. 'dmart_1240_2026-10-05.jpg') + EXIF date."""
    stem = re.sub(r"\.[a-z0-9]+$", "", filename or "", flags=re.I)
    tokens = re.split(r"[_\-\s]+", stem)
    amount = next((float(t) for t in tokens if re.fullmatch(r"\d{2,7}(\.\d{1,2})?", t)), None)
    words = [t for t in tokens if re.fullmatch(r"[A-Za-z][A-Za-z&]+", t) and t.lower() not in {"img", "receipt", "scan", "image", "photo", "whatsapp", "pxl"}]
    merchant = " ".join(w.title() for w in words[:3]) or "Unknown Merchant"
    d = None
    m = re.search(r"(20\d{2})[-_]?(\d{2})[-_]?(\d{2})", stem)
    if m:
        try:
            d = date(int(m.group(1)), int(m.group(2)), int(m.group(3))).isoformat()
        except ValueError:
            d = None
    if d is None:
        try:
            from PIL import Image

            exif = Image.open(io.BytesIO(image_bytes)).getexif()
            raw = exif.get(306) or exif.get(36867)
            if raw:
                d = raw[:10].replace(":", "-")
        except Exception:
            d = None
    return {"merchant": merchant, "amount": amount, "date": d or date.today().isoformat(),
            "category": categorize(merchant), "source": "fallback",
            "note": "Gemini unavailable - fields pre-filled heuristically. Please verify before saving."}


def scan(filename: str, content_type: str, image_bytes: bytes) -> dict[str, Any]:
    prompt = (f"Extract fields from this purchase receipt. Return ONLY JSON: "
              f'{{"merchant": str, "amount": number (grand total in INR), "date": "YYYY-MM-DD", '
              f'"category": one of {CATEGORIES}}}. Today is {date.today().isoformat()}.')
    data = llm.generate_json(prompt, timeout=20, parts=[{"mime_type": content_type or "image/jpeg", "data": image_bytes}])
    if isinstance(data, dict) and data.get("merchant"):
        try:
            amount = float(str(data.get("amount", "0")).replace(",", "").replace("₹", "")) or None
        except ValueError:
            amount = None
        cat = data.get("category") if data.get("category") in CATEGORIES else categorize(str(data["merchant"]))
        return {"merchant": str(data["merchant"])[:160], "amount": amount,
                "date": str(data.get("date") or date.today().isoformat())[:10], "category": cat,
                "source": "gemini", "note": "Extracted by Gemini Vision - review and save."}
    return _fallback(filename, image_bytes)
