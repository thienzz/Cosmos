"""SIMBAD 1″ positional cross-match utility.

Per Doc 23 §6.3 step 2, every ingested object is cross-matched against SIMBAD to
resolve catalog-native identifiers and collapse duplicates. Uses the astroquery
SIMBAD service (HTTP) with conservative rate limiting.

Online mode requires `astroquery`. Offline unit tests use the `FakeCrossMatcher`
implementation at apps/etl/tests/test_messier_ingest.py.
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class SimbadHit:
    main_id: str
    otype: str
    ra_deg: float
    dec_deg: float
    ids: list[str] = field(default_factory=list)


class SimbadCrossMatcher:
    """Thin wrapper around astroquery.Simbad for positional cross-match.

    Public methods:
      resolve_by_name(name) -> SimbadHit | None
      resolve_by_cone(ra, dec, radius_arcsec=1.0) -> list[SimbadHit]
    """

    def __init__(self, rate_limit_sec: float = 0.2) -> None:
        self._rate_limit = rate_limit_sec
        self._last_call: float = 0.0
        # Lazy import so unit tests don't need astroquery installed.
        from astroquery.simbad import Simbad  # type: ignore

        self._simbad = Simbad()
        self._simbad.add_votable_fields("ids", "otype", "ra(d)", "dec(d)")
        self._simbad.TIMEOUT = 30

    def _wait(self) -> None:
        elapsed = time.time() - self._last_call
        if elapsed < self._rate_limit:
            time.sleep(self._rate_limit - elapsed)
        self._last_call = time.time()

    def resolve_by_name(self, name: str) -> Optional[SimbadHit]:
        self._wait()
        try:
            result = self._simbad.query_object(name)
        except Exception:  # network / parse errors are non-fatal for ingest
            return None
        if result is None or len(result) == 0:
            return None
        row = result[0]
        ids = [s.strip() for s in str(row.get("IDS", "")).split("|") if s.strip()]
        return SimbadHit(
            main_id=str(row["MAIN_ID"]),
            otype=str(row.get("OTYPE", "")),
            ra_deg=float(row["RA_d"]),
            dec_deg=float(row["DEC_d"]),
            ids=ids,
        )

    def resolve_by_cone(
        self, ra_deg: float, dec_deg: float, radius_arcsec: float = 1.0
    ) -> list[SimbadHit]:
        from astropy.coordinates import SkyCoord  # type: ignore
        from astropy import units as u  # type: ignore

        self._wait()
        coord = SkyCoord(ra_deg, dec_deg, unit="deg")
        try:
            result = self._simbad.query_region(coord, radius=radius_arcsec * u.arcsec)
        except Exception:
            return []
        if result is None or len(result) == 0:
            return []
        out: list[SimbadHit] = []
        for row in result:
            ids = [s.strip() for s in str(row.get("IDS", "")).split("|") if s.strip()]
            out.append(
                SimbadHit(
                    main_id=str(row["MAIN_ID"]),
                    otype=str(row.get("OTYPE", "")),
                    ra_deg=float(row["RA_d"]),
                    dec_deg=float(row["DEC_d"]),
                    ids=ids,
                )
            )
        return out
