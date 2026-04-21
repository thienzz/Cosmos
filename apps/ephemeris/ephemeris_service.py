"""Cosmos Explorer — Ephemeris Service (Doc 25 §9, Doc 26 §8).

Wraps NASA's SPICE toolkit (via SpiceyPy) and exposes:

- ``GET  /v1/ephemeris/{naifId}``          single-body position at epoch
- ``POST /v1/ephemeris/batch``             cartesian product of bodies × epochs
- ``GET  /v1/ephemeris/range/{naifId}``    dense time-series
- ``GET  /health``                         liveness + kernel-load summary

All JSON responses follow Doc 26 §2.5's envelope (``{ data, meta }``); errors
follow Doc 26 §15.1 (``{ error: { code, message, status, request_id, ... } }``).
"""

from __future__ import annotations

import logging
import os
import uuid
from contextlib import asynccontextmanager
from typing import Any, AsyncIterator

from fastapi import FastAPI, HTTPException, Path, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from calculator import (
    EphemerisCalculator,
    EphemerisError,
    EpochOutOfRangeError,
    InvalidFrameError,
    InvalidNaifIdError,
    KernelsNotLoadedError,
    MAX_JD,
    MIN_JD,
)
from kernel_loader import KernelLoadResult, load_kernels
from naif_names import naif_name
from schemas import (
    BatchEphemerisData,
    BatchEphemerisRequest,
    BatchEphemerisResponse,
    BatchEphemerisResult,
    EphemerisPositionData,
    EphemerisPositionResponse,
    EphemerisRangeData,
    EphemerisRangeResponse,
    ErrorBody,
    ErrorResponse,
    FrameLiteral,
    MAX_BATCH_COMPUTATIONS,
    RANGE_MAX_POINTS,
    RANGE_MAX_SPAN_DAYS,
    RANGE_MAX_STEP_DAYS,
    RANGE_MIN_STEP_DAYS,
    ResponseMeta,
    Vec3,
)

logger = logging.getLogger("cosmos.ephemeris")

# ---------------------------------------------------------------------------
# Service state
# ---------------------------------------------------------------------------

DATA_VERSION: str = os.environ.get("DATA_VERSION", "2026.Q1.3")
DOC_URL_BASE: str = "https://docs.cosmosexplorer.app/errors"

_calculator = EphemerisCalculator(kernels_loaded=False)
_kernel_result: KernelLoadResult = KernelLoadResult()


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------


@asynccontextmanager
async def _lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Furnish SPICE kernels at startup, release them at shutdown."""
    global _kernel_result
    _kernel_result = load_kernels()
    _calculator.mark_kernels_loaded(_kernel_result.ok)
    yield
    # On shutdown we deliberately do NOT `kclear`: tests furnish kernels
    # via a session fixture that outlives the app, and clearing here would
    # trash the pool mid-session.


app = FastAPI(
    title="Cosmos Ephemeris Service",
    version="1.0.0",
    lifespan=_lifespan,
)

# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------


def _request_id(request: Request) -> str:
    """Return the client-supplied request id, or synthesise one."""
    return request.headers.get("x-request-id") or str(uuid.uuid4())


def _meta(request: Request) -> ResponseMeta:
    return ResponseMeta.now(request_id=_request_id(request), data_version=DATA_VERSION)


def _error_response(
    *,
    code: str,
    message: str,
    status: int,
    request_id: str,
    details: dict | None = None,
) -> JSONResponse:
    body = ErrorResponse(
        error=ErrorBody(
            code=code,
            message=message,
            status=status,
            request_id=request_id,
            details=details or {},
            documentation_url=f"{DOC_URL_BASE}/{code}",
        )
    )
    return JSONResponse(status_code=status, content=body.model_dump())


# ---------------------------------------------------------------------------
# Exception handlers (map calculator exceptions → Doc 26 §15.2 codes)
# ---------------------------------------------------------------------------


@app.exception_handler(InvalidNaifIdError)
async def _handle_invalid_naif(request: Request, exc: InvalidNaifIdError) -> JSONResponse:
    return _error_response(
        code="INVALID_NAIF_ID",
        message=str(exc) or "Unknown NAIF body identifier.",
        status=400,
        request_id=_request_id(request),
    )


@app.exception_handler(InvalidFrameError)
async def _handle_invalid_frame(request: Request, exc: InvalidFrameError) -> JSONResponse:
    return _error_response(
        code="INVALID_FRAME",
        message=str(exc) or "Unknown reference frame.",
        status=400,
        request_id=_request_id(request),
    )


@app.exception_handler(EpochOutOfRangeError)
async def _handle_epoch_range(request: Request, exc: EpochOutOfRangeError) -> JSONResponse:
    return _error_response(
        code="EPOCH_OUT_OF_RANGE",
        message=str(exc) or "Epoch outside SPICE kernel coverage.",
        status=400,
        request_id=_request_id(request),
        details={"min_jd": MIN_JD, "max_jd": MAX_JD},
    )


@app.exception_handler(KernelsNotLoadedError)
async def _handle_no_kernels(request: Request, exc: KernelsNotLoadedError) -> JSONResponse:
    return _error_response(
        code="SERVICE_UNAVAILABLE",
        message="SPICE kernels are not loaded on this node.",
        status=503,
        request_id=_request_id(request),
    )


@app.exception_handler(EphemerisError)
async def _handle_generic_ephemeris(request: Request, exc: EphemerisError) -> JSONResponse:
    return _error_response(
        code="UPSTREAM_TIMEOUT",
        message=str(exc) or "SPICE computation failed.",
        status=502,
        request_id=_request_id(request),
    )


@app.exception_handler(RequestValidationError)
async def _handle_request_validation(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    fields = [
        {
            "field": ".".join(str(part) for part in err["loc"][1:]),
            "message": err["msg"],
            "value": err.get("input"),
        }
        for err in exc.errors()
    ]
    return _error_response(
        code="INVALID_PARAMETER",
        message="Request validation failed.",
        status=400,
        request_id=_request_id(request),
        details={"fields": fields},
    )


@app.exception_handler(ValidationError)
async def _handle_pydantic_validation(request: Request, exc: ValidationError) -> JSONResponse:
    fields = [
        {
            "field": ".".join(str(part) for part in err["loc"]),
            "message": err["msg"],
            "value": err.get("input"),
        }
        for err in exc.errors()
    ]
    return _error_response(
        code="INVALID_PARAMETER",
        message="Request validation failed.",
        status=400,
        request_id=_request_id(request),
        details={"fields": fields},
    )


@app.exception_handler(HTTPException)
async def _handle_http(request: Request, exc: HTTPException) -> JSONResponse:
    if isinstance(exc.detail, dict) and "code" in exc.detail:
        return _error_response(
            code=exc.detail["code"],
            message=exc.detail.get("message", "Request failed."),
            status=exc.status_code,
            request_id=_request_id(request),
            details=exc.detail.get("details"),
        )
    return _error_response(
        code="INTERNAL_ERROR",
        message=str(exc.detail) if exc.detail else "Internal server error.",
        status=exc.status_code,
        request_id=_request_id(request),
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/health")
async def health() -> dict[str, Any]:
    status = "healthy" if _calculator.kernels_loaded else "degraded"
    return {
        "status": status,
        "services": {
            "spice_kernels": "up" if _calculator.kernels_loaded else "down",
        },
        "kernels": {
            "directory": _kernel_result.directory,
            "loaded": _kernel_result.loaded,
            "missing": _kernel_result.missing,
        },
    }


@app.get(
    "/v1/ephemeris/{naif_id}",
    response_model=EphemerisPositionResponse,
    responses={
        400: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
    },
)
async def get_position(
    request: Request,
    naif_id: int = Path(..., description="NAIF SPICE ID (e.g., 399=Earth)"),
    epoch: float = Query(..., description="Julian Date (TDB)"),
    frame: FrameLiteral = Query("ECLIPJ2000", description="Reference frame"),
    observer: int = Query(10, description="Observer NAIF ID (10=Sun)"),
) -> EphemerisPositionResponse:
    state = _calculator.state(
        naif_id=naif_id, epoch_jd=epoch, frame=frame, observer=observer,
    )
    return EphemerisPositionResponse(
        data=EphemerisPositionData(
            naif_id=naif_id,
            name=naif_name(naif_id),
            epoch_jd=epoch,
            frame=frame,
            observer=observer,
            position_au=Vec3(
                x=state.position_au[0],
                y=state.position_au[1],
                z=state.position_au[2],
            ),
            velocity_au_day=Vec3(
                x=state.velocity_au_day[0],
                y=state.velocity_au_day[1],
                z=state.velocity_au_day[2],
            ),
            light_time_s=state.light_time_s,
        ),
        meta=_meta(request),
    )


@app.post(
    "/v1/ephemeris/batch",
    response_model=BatchEphemerisResponse,
    responses={
        400: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
    },
)
async def batch_positions(
    request: Request,
    body: BatchEphemerisRequest,
) -> BatchEphemerisResponse:
    # Doc 26 §8.2: "Max 10,000 total computations (bodies × epochs)"
    if body.total_computations() > MAX_BATCH_COMPUTATIONS:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "BATCH_TOO_LARGE",
                "message": (
                    f"Batch exceeds limit of {MAX_BATCH_COMPUTATIONS} total "
                    f"computations (got {body.total_computations()})."
                ),
                "details": {
                    "max_total": MAX_BATCH_COMPUTATIONS,
                    "requested_bodies": len(body.naif_ids),
                    "requested_epochs": len(body.epochs),
                    "requested_total": body.total_computations(),
                },
            },
        )

    results: list[BatchEphemerisResult] = []
    for body_id, epoch_jd, state in _calculator.batch(
        naif_ids=body.naif_ids,
        epochs=body.epochs,
        frame=body.frame,
        observer=body.observer,
    ):
        results.append(
            BatchEphemerisResult(
                naif_id=body_id,
                epoch_jd=epoch_jd,
                x=state.position_au[0],
                y=state.position_au[1],
                z=state.position_au[2],
            )
        )
    return BatchEphemerisResponse(
        data=BatchEphemerisData(results=results, count=len(results)),
        meta=_meta(request),
    )


@app.get(
    "/v1/ephemeris/range/{naif_id}",
    response_model=EphemerisRangeResponse,
    responses={
        400: {"model": ErrorResponse},
        503: {"model": ErrorResponse},
    },
)
async def get_range(
    request: Request,
    naif_id: int = Path(..., description="NAIF SPICE ID"),
    start: float = Query(..., description="Start epoch (Julian Date)"),
    end: float = Query(..., description="End epoch (Julian Date)"),
    step: float = Query(1.0, description="Step size in days"),
    frame: FrameLiteral = Query("ECLIPJ2000", description="Reference frame"),
    observer: int = Query(10, description="Observer NAIF ID (10=Sun)"),
) -> EphemerisRangeResponse:
    # Validate step / span before invoking SPICE — saves a network round-trip.
    if end < start:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "INVALID_PARAMETER",
                "message": "Query parameter 'end' must be ≥ 'start'.",
                "details": {"start_jd": start, "end_jd": end},
            },
        )
    if not (RANGE_MIN_STEP_DAYS <= step <= RANGE_MAX_STEP_DAYS):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "INVALID_PARAMETER",
                "message": (
                    f"Query parameter 'step' must be between {RANGE_MIN_STEP_DAYS} "
                    f"and {RANGE_MAX_STEP_DAYS} days."
                ),
                "details": {"step_days": step},
            },
        )
    span = end - start
    if span > RANGE_MAX_SPAN_DAYS:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "BATCH_TOO_LARGE",
                "message": (
                    f"Range span {span:.1f} days exceeds "
                    f"{RANGE_MAX_SPAN_DAYS:.1f}-day (200-year) limit."
                ),
                "details": {"span_days": span, "max_span_days": RANGE_MAX_SPAN_DAYS},
            },
        )
    # +1 for the inclusive endpoint.
    projected_points = int(span / step) + 1
    if projected_points > RANGE_MAX_POINTS:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "BATCH_TOO_LARGE",
                "message": (
                    f"Range would produce {projected_points} points; limit is "
                    f"{RANGE_MAX_POINTS}. Increase 'step' or shrink the span."
                ),
                "details": {
                    "projected_points": projected_points,
                    "max_points": RANGE_MAX_POINTS,
                },
            },
        )

    positions, count = _calculator.range(
        naif_id=naif_id,
        start_jd=start,
        end_jd=end,
        step_days=step,
        frame=frame,
        observer=observer,
    )
    return EphemerisRangeResponse(
        data=EphemerisRangeData(
            naif_id=naif_id,
            name=naif_name(naif_id),
            frame=frame,
            observer=observer,
            start_jd=start,
            end_jd=end,
            step_days=step,
            positions=positions,
            count=count,
        ),
        meta=_meta(request),
    )
