"""Schema-level tests: request validation, constraint enforcement, envelope shape."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from schemas import (
    BatchEphemerisRequest,
    MAX_BATCH_BODIES,
    MAX_BATCH_EPOCHS,
)


class TestBatchRequest:
    def test_rejects_empty_bodies(self) -> None:
        with pytest.raises(ValidationError):
            BatchEphemerisRequest(naif_ids=[], epochs=[2460780.5])

    def test_rejects_empty_epochs(self) -> None:
        with pytest.raises(ValidationError):
            BatchEphemerisRequest(naif_ids=[399], epochs=[])

    def test_rejects_too_many_bodies(self) -> None:
        with pytest.raises(ValidationError):
            BatchEphemerisRequest(
                naif_ids=list(range(MAX_BATCH_BODIES + 1)),
                epochs=[2460780.5],
            )

    def test_rejects_too_many_epochs(self) -> None:
        with pytest.raises(ValidationError):
            BatchEphemerisRequest(
                naif_ids=[399],
                epochs=[2460780.5 + i for i in range(MAX_BATCH_EPOCHS + 1)],
            )

    def test_defaults_to_eclipj2000(self) -> None:
        req = BatchEphemerisRequest(naif_ids=[399], epochs=[2460780.5])
        assert req.frame == "ECLIPJ2000"
        assert req.observer == 10

    def test_deduplicates_naif_ids(self) -> None:
        req = BatchEphemerisRequest(
            naif_ids=[399, 399, 5, 399], epochs=[2460780.5]
        )
        assert req.naif_ids == [399, 5]

    def test_total_computations_is_product(self) -> None:
        req = BatchEphemerisRequest(
            naif_ids=[399, 5, 10], epochs=[2460780.5, 2460781.5]
        )
        assert req.total_computations() == 6

    def test_rejects_invalid_frame(self) -> None:
        with pytest.raises(ValidationError):
            BatchEphemerisRequest(
                naif_ids=[399], epochs=[2460780.5], frame="GALACTIC_SUPERCLUSTER"
            )

    def test_rejects_extra_fields(self) -> None:
        with pytest.raises(ValidationError):
            BatchEphemerisRequest(
                naif_ids=[399],
                epochs=[2460780.5],
                observer_hint="Barnard",  # type: ignore[call-arg]
            )
