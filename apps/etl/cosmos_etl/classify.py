"""Doc 17 ENT-ID classifier.

Maps a row of catalog metadata to a Doc 17 ENT-XXXX identifier + category code.

The implementation is rule-based and conservative — when a row doesn't carry the
signals needed for fine subtype discrimination, it falls back to the category's
"general" bucket (e.g. stars without spectral class → ENT-1021 Main Sequence General).

Keep in sync with docs/17-coverage-checklist.md.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

# Category codes (stored as `entities.category` SMALLINT). Mirror of Doc 23 §6.4 order.
CAT_STAR = 1
CAT_PLANET = 2
CAT_MOON = 3
CAT_SMALL_BODY = 4
CAT_NEBULA = 5
CAT_GALAXY = 6
CAT_LSS = 7
CAT_EXOTIC = 8


@dataclass(frozen=True)
class Classification:
    ent_id: str         # "ENT-NNNN"
    category: int       # CAT_*
    subtype_note: str   # human-readable short label for debugging


# Messier-number → ENT-ID + category. Covers all 110 Messier entries.
# Source: classical Messier catalog + modern NGC cross-identifications.
_MESSIER_MAP: dict[int, tuple[str, int, str]] = {
    # Supernova remnant
    1: ("ENT-5050", CAT_NEBULA, "Crab Nebula (SNR shell; Plerion center)"),
    # Globular clusters
    **{m: ("ENT-7011", CAT_LSS, "Globular cluster") for m in (
        2, 3, 4, 5, 9, 10, 12, 13, 14, 15, 19, 22, 28, 30, 53, 54, 55, 56, 62,
        68, 69, 70, 71, 72, 75, 79, 80, 92, 107,
    )},
    # Open clusters
    **{m: ("ENT-7010", CAT_LSS, "Open cluster") for m in (
        6, 7, 11, 18, 21, 23, 25, 26, 29, 34, 35, 36, 37, 38, 39, 41, 44, 45,
        46, 47, 48, 50, 52, 67, 93, 103,
    )},
    # Emission / HII regions + related
    8:  ("ENT-5010", CAT_NEBULA, "Lagoon Nebula (HII giant)"),
    16: ("ENT-5010", CAT_NEBULA, "Eagle Nebula (HII + open cluster)"),
    17: ("ENT-5010", CAT_NEBULA, "Omega / Swan Nebula (HII giant)"),
    20: ("ENT-5010", CAT_NEBULA, "Trifid Nebula (HII + reflection + dark)"),
    42: ("ENT-5010", CAT_NEBULA, "Orion Nebula (HII giant)"),
    43: ("ENT-5010", CAT_NEBULA, "De Mairan's Nebula (HII)"),
    # Planetary nebulae
    27: ("ENT-5021", CAT_NEBULA, "Dumbbell Nebula (bipolar PN)"),
    57: ("ENT-5020", CAT_NEBULA, "Ring Nebula (spherical PN)"),
    76: ("ENT-5021", CAT_NEBULA, "Little Dumbbell (bipolar PN)"),
    97: ("ENT-5020", CAT_NEBULA, "Owl Nebula (spherical PN)"),
    # Reflection + nebulosity in open cluster
    78: ("ENT-5030", CAT_NEBULA, "Reflection nebula"),
    # Galaxies — Local Group + near
    31: ("ENT-6010", CAT_GALAXY, "Andromeda Galaxy (SA spiral)"),
    32: ("ENT-6021", CAT_GALAXY, "Dwarf elliptical companion to M31"),
    33: ("ENT-6010", CAT_GALAXY, "Triangulum Galaxy (SA spiral)"),
    49: ("ENT-6020", CAT_GALAXY, "Giant elliptical"),
    51: ("ENT-6055", CAT_GALAXY, "Whirlpool Galaxy (interacting)"),
    58: ("ENT-6011", CAT_GALAXY, "Barred spiral"),
    59: ("ENT-6020", CAT_GALAXY, "Giant elliptical"),
    60: ("ENT-6020", CAT_GALAXY, "Giant elliptical"),
    61: ("ENT-6011", CAT_GALAXY, "Barred spiral"),
    63: ("ENT-6010", CAT_GALAXY, "Sunflower Galaxy (SA spiral)"),
    64: ("ENT-6010", CAT_GALAXY, "Black Eye Galaxy (SA spiral)"),
    65: ("ENT-6010", CAT_GALAXY, "Leo Triplet spiral"),
    66: ("ENT-6011", CAT_GALAXY, "Leo Triplet barred spiral"),
    74: ("ENT-6010", CAT_GALAXY, "SA spiral"),
    77: ("ENT-6040", CAT_GALAXY, "Seyfert 2 (NGC 1068)"),
    81: ("ENT-6010", CAT_GALAXY, "Bode's Galaxy (SA spiral)"),
    82: ("ENT-6050", CAT_GALAXY, "Cigar Galaxy (starburst)"),
    83: ("ENT-6011", CAT_GALAXY, "Southern Pinwheel (barred spiral)"),
    84: ("ENT-6012", CAT_GALAXY, "Lenticular"),
    85: ("ENT-6012", CAT_GALAXY, "Lenticular"),
    86: ("ENT-6012", CAT_GALAXY, "Lenticular"),
    87: ("ENT-6042", CAT_GALAXY, "Virgo A (radio galaxy)"),
    88: ("ENT-6010", CAT_GALAXY, "SA spiral"),
    89: ("ENT-6020", CAT_GALAXY, "Giant elliptical"),
    90: ("ENT-6011", CAT_GALAXY, "Barred spiral"),
    91: ("ENT-6011", CAT_GALAXY, "Barred spiral"),
    94: ("ENT-6010", CAT_GALAXY, "Cat's Eye Galaxy (SA spiral)"),
    95: ("ENT-6011", CAT_GALAXY, "Barred spiral"),
    96: ("ENT-6010", CAT_GALAXY, "SA spiral"),
    98: ("ENT-6010", CAT_GALAXY, "SA spiral"),
    99: ("ENT-6010", CAT_GALAXY, "SA spiral"),
    100: ("ENT-6010", CAT_GALAXY, "SA spiral"),
    101: ("ENT-6010", CAT_GALAXY, "Pinwheel Galaxy (SA spiral)"),
    102: ("ENT-6012", CAT_GALAXY, "Lenticular"),
    104: ("ENT-6010", CAT_GALAXY, "Sombrero Galaxy (SA spiral w/ bulge)"),
    105: ("ENT-6020", CAT_GALAXY, "Giant elliptical"),
    106: ("ENT-6040", CAT_GALAXY, "Seyfert 2"),
    108: ("ENT-6011", CAT_GALAXY, "Barred spiral"),
    109: ("ENT-6011", CAT_GALAXY, "Barred spiral"),
    110: ("ENT-6021", CAT_GALAXY, "Dwarf elliptical companion to M31"),
    # Asterism (Messier's sole misidentification)
    24: ("ENT-7010", CAT_LSS, "Sagittarius Star Cloud (open-cluster-like MW field)"),
    # Double star
    40: ("ENT-1021", CAT_STAR, "Winnecke 4 — optical double, not a DSO"),
    # Diffuse dark nebulosity around Pleiades + Orion area sometimes lumped
    73: ("ENT-1021", CAT_STAR, "4-star asterism; classify as star field"),
}


def classify_messier(messier_number: int) -> Optional[Classification]:
    """Map a Messier number to its ENT-ID via the hand-curated table."""
    entry = _MESSIER_MAP.get(messier_number)
    if entry is None:
        return None
    ent_id, category, note = entry
    return Classification(ent_id=ent_id, category=category, subtype_note=note)


_EVOLVED_LUMINOSITY_PATTERNS = (
    "III",  # giant
    "II",   # bright giant
    "IB",   # less-luminous supergiant (Ib)
    "IAB",  # intermediate supergiant (Iab)
    "IA",   # most-luminous supergiant (Ia)
)


def _has_evolved_luminosity(sp: str) -> bool:
    """Detect MK giant / supergiant luminosity classes inside a stripped,
    upper-cased spectral string. Handles Ia / Iab / Ib / II / III and plain
    trailing "I" (subdwarfs like Sd I are rare and collapse harmlessly)."""
    # Extract the luminosity suffix — everything after the last alpha-numeric
    # stem (e.g. "B8Ia" → "IA", "M1-2Ia-Iab" → "IAB", "K1.5III" → "III").
    # Simple contains-check covers every variant the bright-star CSV uses.
    for pattern in _EVOLVED_LUMINOSITY_PATTERNS:
        if pattern in sp:
            return True
    # Trailing plain "I" — keep the original fall-through for catalogs that
    # use "I " or end with "I" without further modifier.
    return sp.endswith("I") and not sp.endswith("VI")  # VI dwarfs are MS


def classify_star_by_spectral(spectral_type: str | None) -> Classification:
    """Best-effort star subtype from spectral class string (e.g. 'G2V', 'M5III').

    Returns Main Sequence general bucket (ENT-1021) if nothing is known.
    T40 stellar ingest extends the MS-only logic with supergiant detection
    (Ia/Iab/Ib), giant branch (II/III), and the evolved-branch ENT-102X bucket.
    """
    if not spectral_type:
        return Classification("ENT-1021", CAT_STAR, "Main sequence (unknown spectral class)")
    sp = spectral_type.strip().upper()
    first = sp[0]

    if _has_evolved_luminosity(sp):
        # Evolved branch: giant or supergiant. Collapse to the doc 17 buckets:
        #   K/M giants + supergiants → ENT-1023 (red giant / RSG)
        #   O/B giants + supergiants → ENT-1024 (blue supergiant)
        #   F/G giants + supergiants → ENT-1023 (yellow supergiant classified
        #       with the red branch in the current stub; F/G supergiants get
        #       their own bucket in the full T41 shader family).
        if first in ("K", "M"):
            return Classification("ENT-1023", CAT_STAR, "Red giant / supergiant")
        if first in ("O", "B"):
            return Classification("ENT-1024", CAT_STAR, "Blue supergiant")
        if first in ("F", "G"):
            return Classification("ENT-1023", CAT_STAR, "Yellow giant / supergiant")
    # Main-sequence spectral mapping.
    main_seq = {
        "O": "ENT-1010", "B": "ENT-1011", "A": "ENT-1012",
        "F": "ENT-1013", "G": "ENT-1014", "K": "ENT-1015", "M": "ENT-1016",
        "L": "ENT-1017", "T": "ENT-1018", "Y": "ENT-1019",
    }
    if first in main_seq:
        return Classification(main_seq[first], CAT_STAR, f"{first}-type main sequence")
    return Classification("ENT-1021", CAT_STAR, f"Main sequence general (spectral '{sp}')")


def classify_ent_id(
    *,
    messier_number: int | None = None,
    spectral_type: str | None = None,
) -> Classification:
    """Top-level dispatcher used by ETL downloaders.

    Extend as new classifiers come online (T40 stellar, T45 nebulae, T46 galaxies).
    """
    if messier_number is not None:
        result = classify_messier(messier_number)
        if result is not None:
            return result
    if spectral_type is not None:
        return classify_star_by_spectral(spectral_type)
    # Unknown object — should never happen for curated catalogs; default to star general.
    return Classification("ENT-1021", CAT_STAR, "Unclassified (fallback)")
