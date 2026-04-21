"""HTTP-level tests against the FastAPI app."""

from __future__ import annotations

from typing import Any

import pytest
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# /health
# ---------------------------------------------------------------------------


class TestHealth:
    def test_health_returns_healthy_with_kernels(self, client: TestClient) -> None:
        response = client.get("/health")
        assert response.status_code == 200
        body = response.json()
        assert body["status"] == "healthy"
        assert "de440s.bsp" in body["kernels"]["loaded"]
        assert body["services"]["spice_kernels"] == "up"


# ---------------------------------------------------------------------------
# GET /v1/ephemeris/{naif_id}
# ---------------------------------------------------------------------------


class TestGetPosition:
    def test_earth_at_j2000_envelope(self, client: TestClient) -> None:
        response = client.get("/v1/ephemeris/399?epoch=2451545.0")
        assert response.status_code == 200
        body = response.json()

        # Envelope shape (Doc 26 §2.5)
        assert set(body.keys()) == {"data", "meta"}
        for key in ("request_id", "data_version", "timestamp"):
            assert key in body["meta"]

        # Payload shape (Doc 26 §8.1)
        data = body["data"]
        assert data["naif_id"] == 399
        assert data["name"] == "Earth"
        assert data["epoch_jd"] == 2451545.0
        assert data["frame"] == "ECLIPJ2000"
        assert data["observer"] == 10
        assert data["position_au"]["x"] == pytest.approx(-0.17713510, abs=1e-3)
        assert data["position_au"]["y"] == pytest.approx(0.96724169, abs=1e-3)
        assert data["light_time_s"] == pytest.approx(499, abs=10)

    def test_defaults_frame_and_observer(self, client: TestClient) -> None:
        response = client.get("/v1/ephemeris/399?epoch=2451545.0")
        assert response.status_code == 200
        data = response.json()["data"]
        assert data["frame"] == "ECLIPJ2000"
        assert data["observer"] == 10

    def test_rejects_missing_epoch(self, client: TestClient) -> None:
        response = client.get("/v1/ephemeris/399")
        assert response.status_code == 400
        body = response.json()
        assert body["error"]["code"] == "INVALID_PARAMETER"
        assert any(f["field"] == "epoch" for f in body["error"]["details"]["fields"])

    def test_rejects_invalid_frame(self, client: TestClient) -> None:
        response = client.get("/v1/ephemeris/399?epoch=2451545.0&frame=ICRF3")
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "INVALID_PARAMETER"

    def test_rejects_epoch_out_of_range(self, client: TestClient) -> None:
        # 1 CE is well below SPICE coverage (JD 1721423.5).
        response = client.get("/v1/ephemeris/399?epoch=1721423.5")
        assert response.status_code == 400
        body = response.json()
        assert body["error"]["code"] == "EPOCH_OUT_OF_RANGE"
        assert "min_jd" in body["error"]["details"]

    def test_unknown_naif_returns_invalid_naif_id(self, client: TestClient) -> None:
        response = client.get("/v1/ephemeris/987654?epoch=2451545.0")
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "INVALID_NAIF_ID"


# ---------------------------------------------------------------------------
# POST /v1/ephemeris/batch
# ---------------------------------------------------------------------------


class TestBatch:
    def test_batch_envelope_and_count(self, client: TestClient) -> None:
        # TS-TIME-006 — batch request for multiple bodies at 3 epochs.
        # Use only bodies available in DE440s: planet barycenters 1–8 + Sun.
        request_body = {
            "naif_ids": [1, 2, 3, 4, 5, 6, 7, 8],
            "epochs": [2451545.0, 2451645.0, 2451745.0],
            "frame": "ECLIPJ2000",
            "observer": 10,
        }
        response = client.post("/v1/ephemeris/batch", json=request_body)
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["data"]["count"] == 24  # 8 × 3
        assert len(body["data"]["results"]) == 24

        # Every result has the required fields.
        for entry in body["data"]["results"]:
            assert set(entry.keys()) == {"naif_id", "epoch_jd", "x", "y", "z"}

    def test_batch_rejects_too_many_bodies(self, client: TestClient) -> None:
        response = client.post(
            "/v1/ephemeris/batch",
            json={"naif_ids": list(range(60)), "epochs": [2451545.0]},
        )
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "INVALID_PARAMETER"

    def test_batch_rejects_too_many_total(self, client: TestClient) -> None:
        # 50 bodies × 250 epochs = 12,500 > 10,000 limit.
        response = client.post(
            "/v1/ephemeris/batch",
            json={
                "naif_ids": list(range(1, 51)),
                "epochs": [2451545.0 + i for i in range(250)],
            },
        )
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "BATCH_TOO_LARGE"

    def test_batch_rejects_empty_arrays(self, client: TestClient) -> None:
        response = client.post(
            "/v1/ephemeris/batch", json={"naif_ids": [], "epochs": []},
        )
        assert response.status_code == 400

    def test_batch_rejects_extra_fields(self, client: TestClient) -> None:
        response = client.post(
            "/v1/ephemeris/batch",
            json={
                "naif_ids": [399],
                "epochs": [2451545.0],
                "hint": "nope",
            },
        )
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "INVALID_PARAMETER"


# ---------------------------------------------------------------------------
# GET /v1/ephemeris/range/{naif_id}
# ---------------------------------------------------------------------------


class TestRange:
    def test_range_returns_compact_positions(self, client: TestClient) -> None:
        response = client.get(
            "/v1/ephemeris/range/399"
            "?start=2451545.0&end=2451555.0&step=1.0"
        )
        assert response.status_code == 200, response.text
        data = response.json()["data"]
        assert data["count"] == 11
        assert len(data["positions"]) == 11
        assert all(len(p) == 3 for p in data["positions"])
        assert data["naif_id"] == 399
        assert data["name"] == "Earth"

    def test_range_rejects_reversed_bounds(self, client: TestClient) -> None:
        response = client.get(
            "/v1/ephemeris/range/399?start=2451555.0&end=2451545.0"
        )
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "INVALID_PARAMETER"

    def test_range_rejects_too_small_step(self, client: TestClient) -> None:
        response = client.get(
            "/v1/ephemeris/range/399?start=2451545.0&end=2451546.0&step=0.001"
        )
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "INVALID_PARAMETER"

    def test_range_rejects_too_many_points(self, client: TestClient) -> None:
        # 2451545 → 2451545 + 50000 step 1.0 = 50,001 points; way over 10,000.
        response = client.get(
            "/v1/ephemeris/range/399?start=2451545.0&end=2501545.0&step=1.0"
        )
        assert response.status_code == 400
        body = response.json()
        # Either BATCH_TOO_LARGE (span gate) or BATCH_TOO_LARGE (point gate).
        assert body["error"]["code"] == "BATCH_TOO_LARGE"

    def test_range_rejects_span_over_200_years(self, client: TestClient) -> None:
        response = client.get(
            "/v1/ephemeris/range/399?start=2451545.0&end=2535000.0&step=365.25"
        )
        assert response.status_code == 400
        assert response.json()["error"]["code"] == "BATCH_TOO_LARGE"


# ---------------------------------------------------------------------------
# Error envelope
# ---------------------------------------------------------------------------


class TestErrorEnvelope:
    def test_error_envelope_shape(self, client: TestClient) -> None:
        response = client.get("/v1/ephemeris/999999999?epoch=2451545.0")
        assert response.status_code == 400
        body: dict[str, Any] = response.json()
        assert "error" in body
        error = body["error"]
        for key in ("code", "message", "status", "request_id", "details"):
            assert key in error
        assert error["status"] == 400

    def test_request_id_is_echoed(self, client: TestClient) -> None:
        rid = "req-12345-abcde"
        response = client.get(
            "/v1/ephemeris/987654?epoch=2451545.0",
            headers={"x-request-id": rid},
        )
        assert response.status_code == 400
        assert response.json()["error"]["request_id"] == rid
