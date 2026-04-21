"""Pydantic request / response schemas for the ephemeris service.

Schemas mirror Doc 26 §8 exactly — every field name and nesting matches the
API contract so the OpenAPI output can be consumed verbatim by the TypeScript
client generator (Doc 26 §18.2).
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

# ---------------------------------------------------------------------------
# Constraints (Doc 26 §8.2 + §8.3)
# ---------------------------------------------------------------------------

MAX_BATCH_BODIES: int = 50
MAX_BATCH_EPOCHS: int = 1000
MAX_BATCH_COMPUTATIONS: int = 10_000

RANGE_MIN_STEP_DAYS: float = 0.01
RANGE_MAX_STEP_DAYS: float = 365.25
RANGE_MAX_SPAN_DAYS: float = 200.0 * 365.25  # 200 years
RANGE_MAX_POINTS: int = 10_000

FrameLiteral = Literal["ECLIPJ2000", "J2000", "GALACTIC"]

# ---------------------------------------------------------------------------
# Value schemas
# ---------------------------------------------------------------------------


class Vec3(BaseModel):
    model_config = ConfigDict(extra="forbid")
    x: float
    y: float
    z: float


# ---------------------------------------------------------------------------
# Response envelope (Doc 26 §2.5)
# ---------------------------------------------------------------------------


class ResponseMeta(BaseModel):
    request_id: str
    data_version: str
    timestamp: str

    @staticmethod
    def now(request_id: str, data_version: str) -> "ResponseMeta":
        return ResponseMeta(
            request_id=request_id,
            data_version=data_version,
            timestamp=datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        )


# ---------------------------------------------------------------------------
# GET /ephemeris/{naifId} — single body
# ---------------------------------------------------------------------------


class EphemerisPositionData(BaseModel):
    model_config = ConfigDict(extra="forbid")
    naif_id: int
    name: str
    epoch_jd: float
    frame: FrameLiteral
    observer: int
    position_au: Vec3
    velocity_au_day: Vec3
    light_time_s: float


class EphemerisPositionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    data: EphemerisPositionData
    meta: ResponseMeta


# ---------------------------------------------------------------------------
# POST /ephemeris/batch — multi-body/multi-epoch
# ---------------------------------------------------------------------------


class BatchEphemerisRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    naif_ids: list[int] = Field(..., min_length=1, max_length=MAX_BATCH_BODIES)
    epochs: list[float] = Field(..., min_length=1, max_length=MAX_BATCH_EPOCHS)
    frame: FrameLiteral = "ECLIPJ2000"
    observer: int = 10

    @field_validator("naif_ids")
    @classmethod
    def _unique_bodies(cls, v: list[int]) -> list[int]:
        # Allow duplicates, but silently collapse them — the caller is paying
        # per total computation, and duplicates are almost always a bug in
        # hand-rolled requests. We keep order of first appearance.
        seen: set[int] = set()
        out: list[int] = []
        for body in v:
            if body in seen:
                continue
            seen.add(body)
            out.append(body)
        return out

    def total_computations(self) -> int:
        return len(self.naif_ids) * len(self.epochs)


class BatchEphemerisResult(BaseModel):
    model_config = ConfigDict(extra="forbid")
    naif_id: int
    epoch_jd: float
    x: float
    y: float
    z: float


class BatchEphemerisData(BaseModel):
    model_config = ConfigDict(extra="forbid")
    results: list[BatchEphemerisResult]
    count: int


class BatchEphemerisResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    data: BatchEphemerisData
    meta: ResponseMeta


# ---------------------------------------------------------------------------
# GET /ephemeris/range/{naifId} — dense time series
# ---------------------------------------------------------------------------


class EphemerisRangeData(BaseModel):
    model_config = ConfigDict(extra="forbid")
    naif_id: int
    name: str
    frame: FrameLiteral
    observer: int
    start_jd: float
    end_jd: float
    step_days: float
    positions: list[tuple[float, float, float]]
    count: int


class EphemerisRangeResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    data: EphemerisRangeData
    meta: ResponseMeta


# ---------------------------------------------------------------------------
# Error envelope (Doc 26 §15.1)
# ---------------------------------------------------------------------------


class ErrorBody(BaseModel):
    model_config = ConfigDict(extra="forbid")
    code: str
    message: str
    status: int
    request_id: str
    details: dict = Field(default_factory=dict)
    documentation_url: str | None = None


class ErrorResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    error: ErrorBody
