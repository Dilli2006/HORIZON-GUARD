"""Indian city coordinates + great-circle distance for impossible-travel detection."""
from __future__ import annotations

import math
from typing import Optional

CITY_COORDS: dict[str, tuple[float, float]] = {
    "bengaluru": (12.9716, 77.5946), "bangalore": (12.9716, 77.5946),
    "mumbai": (19.0760, 72.8777), "delhi": (28.6139, 77.2090), "new delhi": (28.6139, 77.2090),
    "gurugram": (28.4595, 77.0266), "noida": (28.5355, 77.3910), "chennai": (13.0827, 80.2707),
    "hyderabad": (17.3850, 78.4867), "kolkata": (22.5726, 88.3639), "pune": (18.5204, 73.8567),
    "ahmedabad": (23.0225, 72.5714), "jaipur": (26.9124, 75.7873), "goa": (15.2993, 74.1240),
    "panaji": (15.4909, 73.8278), "kochi": (9.9312, 76.2673), "mysuru": (12.2958, 76.6394),
    "mysore": (12.2958, 76.6394), "lucknow": (26.8467, 80.9462), "chandigarh": (30.7333, 76.7794),
    "indore": (22.7196, 75.8577), "bhopal": (23.2599, 77.4126), "coimbatore": (11.0168, 76.9558),
    "visakhapatnam": (17.6868, 83.2185), "patna": (25.5941, 85.1376), "surat": (21.1702, 72.8311),
    "nagpur": (21.1458, 79.0882), "thiruvananthapuram": (8.5241, 76.9366),
    "dubai": (25.2048, 55.2708), "singapore": (1.3521, 103.8198), "london": (51.5072, -0.1276),
}

MAX_TRAVEL_KMH = 800.0  # roughly commercial-jet cruise speed incl. nothing else


def coords(location: Optional[str]) -> Optional[tuple[float, float]]:
    """Look up coordinates for a free-text location ('Online' and unknown -> None)."""
    if not location:
        return None
    key = location.strip().lower()
    if key in CITY_COORDS:
        return CITY_COORDS[key]
    for name, c in CITY_COORDS.items():  # tolerate "Koramangala, Bengaluru"
        if name in key:
            return c
    return None


def haversine_km(a: tuple[float, float], b: tuple[float, float]) -> float:
    """Great-circle distance in kilometres."""
    lat1, lon1, lat2, lon2 = map(math.radians, (*a, *b))
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    return 2 * 6371.0 * math.asin(math.sqrt(h))
