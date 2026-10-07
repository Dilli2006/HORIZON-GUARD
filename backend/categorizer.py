"""Rule-based merchant -> category auto-categorizer."""
from __future__ import annotations

import re

CATEGORIES: list[str] = [
    "Food", "Travel", "Shopping", "Bills", "Entertainment", "Health", "Education", "Other",
]

# Ordered keyword rules; first match wins. Keywords are matched as lowercase substrings.
_RULES: list[tuple[str, tuple[str, ...]]] = [
    ("Food", (
        "swiggy", "zomato", "starbucks", "chai", "cafe", "café", "coffee", "restaurant", "pizza",
        "domino", "mcdonald", "kfc", "burger", "bakery", "biryani", "meghana", "mtr", "truffles",
        "bigbasket", "blinkit", "zepto", "dmart", "grocer", "instamart", "dunzo", "food", "kitchen",
        "dhaba", "haldiram", "subway", "eatfit", "third wave",
    )),
    ("Travel", (
        "uber", "ola", "rapido", "metro", "irctc", "indigo", "air india", "vistara", "akasa",
        "makemytrip", "goibibo", "redbus", "petrol", "fuel", "indian oil", "hpcl", "bpcl", "shell",
        "fastag", "parking", "airport", "hotel", "oyo", "scooter", "taxi", "cleartrip",
    )),
    ("Bills", (
        "rent", "nobroker", "bescom", "electricity", "airtel", "jio", "vodafone", "vi ", "broadband",
        "act fibernet", "water", "gas", "insurance", "lic", "emi", "credit card", "bill",
        "maintenance", "society",
    )),
    ("Entertainment", (
        "netflix", "spotify", "prime video", "hotstar", "bookmyshow", "pvr", "inox", "steam",
        "playstation", "xbox", "youtube", "concert", "game", "zee5", "sonyliv", "apple music",
    )),
    ("Health", (
        "apollo", "pharmacy", "medplus", "1mg", "pharmeasy", "hospital", "clinic", "doctor",
        "cult", "gym", "diagnostic", "lab", "dental", "health", "netmeds", "practo",
    )),
    ("Education", (
        "udemy", "coursera", "byju", "unacademy", "kindle", "book", "school", "college",
        "tuition", "course", "edx", "skillshare", "exam", "upgrad",
    )),
    ("Shopping", (
        "amazon", "flipkart", "myntra", "ajio", "nykaa", "meesho", "croma", "reliance digital",
        "vijay sales", "decathlon", "ikea", "zara", "h&m", "lifestyle", "westside", "tata cliq",
        "store", "mall", "boutique", "electronics", "gadget", "shop", "mart", "duty free",
    )),
]


_COMPILED: list[tuple[str, re.Pattern[str]]] = [
    (cat, re.compile(r"(?<![a-z0-9])(?:" + "|".join(re.escape(k.strip()) for k in kws) + ")"))
    for cat, kws in _RULES
]


def categorize(merchant: str) -> str:
    """Return the best category for a merchant name, falling back to ``Other``.

    Keywords must start at a word boundary (so ``ola`` matches "Ola Cabs" but not
    "Chocolate Room").
    """
    name = (merchant or "").lower()
    for category, pattern in _COMPILED:
        if pattern.search(name):
            return category
    return "Other"
