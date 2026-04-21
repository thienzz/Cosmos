"""NAIF id → display name lookup.

Doc 26 §8.1's response schema includes a `"name"` field alongside the position
(e.g., `{"naif_id": 399, "name": "Earth", ...}`). Doc 26 Appendix A lists the
canonical bodies we care about; anything outside that list falls back to its
numeric NAIF id formatted as `"NAIF-<n>"` so the contract is always honoured.
"""

from __future__ import annotations

#: Doc 26 Appendix A plus the ssb / barycenters we rely on in tests.
NAIF_NAME_MAP: dict[int, str] = {
    0: "Solar System Barycenter",
    1: "Mercury Barycenter",
    2: "Venus Barycenter",
    3: "Earth-Moon Barycenter",
    4: "Mars Barycenter",
    5: "Jupiter Barycenter",
    6: "Saturn Barycenter",
    7: "Uranus Barycenter",
    8: "Neptune Barycenter",
    9: "Pluto Barycenter",
    10: "Sun",
    199: "Mercury",
    299: "Venus",
    399: "Earth",
    301: "Moon",
    499: "Mars",
    401: "Phobos",
    402: "Deimos",
    599: "Jupiter",
    501: "Io",
    502: "Europa",
    503: "Ganymede",
    504: "Callisto",
    699: "Saturn",
    601: "Mimas",
    602: "Enceladus",
    603: "Tethys",
    604: "Dione",
    605: "Rhea",
    606: "Titan",
    607: "Hyperion",
    608: "Iapetus",
    799: "Uranus",
    899: "Neptune",
    999: "Pluto",
    2_000_001: "Ceres",
    1_000_012: "67P/Churyumov-Gerasimenko",
}


def naif_name(naif_id: int) -> str:
    return NAIF_NAME_MAP.get(naif_id, f"NAIF-{naif_id}")
