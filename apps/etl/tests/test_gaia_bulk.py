"""Unit tests for cosmos_etl.loaders.gaia_bulk (T-D-05).

Tests the pure-function CSV formatter; the live COPY path is exercised
by the Phase D verify block against a running Postgres.
"""
from __future__ import annotations

import io
import json

import pytest

from cosmos_etl.loaders.gaia_bulk import (
    _chunked,
    _format_csv_value,
    entity_copy_line,
)
from cosmos_etl.transformers.gaia_to_entities import GaiaEntity


def _entity(**overrides: object) -> GaiaEntity:
    base: dict[str, object] = dict(
        ent_id="ENT-1000",
        entity_type=1000,
        category=1,
        name="Gaia DR3 12345",
        aliases=["12345"],
        catalog_ids={"gaia_dr3": 12345},
        ra_deg=10.5,
        dec_coord_deg=30.25,
        distance_pc=200.0,
        properties={"spectral_class": "G", "magnitude_apparent": 6.5},
        healpix_order6=42,
    )
    base.update(overrides)
    return GaiaEntity(**base)  # type: ignore[arg-type]


def test_format_csv_value_handles_nones_and_floats() -> None:
    assert _format_csv_value(None) == ""
    assert _format_csv_value(3.14) == "3.14"
    assert _format_csv_value(float("nan")) == ""
    assert _format_csv_value(float("inf")) == ""


def test_format_csv_value_quotes_special_chars() -> None:
    assert _format_csv_value("no, punct") == '"no, punct"'
    assert _format_csv_value('he said "hi"') == '"he said ""hi"""'


def test_entity_copy_line_has_twelve_fields() -> None:
    line = entity_copy_line(_entity())
    # Split respecting the quoted JSON fields (catalog_ids, properties, aliases).
    # Easier: count commas outside quotes.
    import csv as _csv
    reader = _csv.reader(io.StringIO(line))
    fields = next(reader)
    assert len(fields) == 12
    assert fields[0] == "ENT-1000"
    assert fields[1] == "1000"
    assert fields[2] == "1"
    assert fields[3] == "Gaia DR3 12345"
    # aliases literal
    assert fields[4] == '{"12345"}'
    # catalog_ids JSON
    assert json.loads(fields[5]) == {"gaia_dr3": 12345}
    assert fields[6] == "10.5"
    assert fields[7] == "30.25"
    assert fields[8] == "200.0"
    assert json.loads(fields[9]) == {"spectral_class": "G", "magnitude_apparent": 6.5}
    assert fields[10] == "gaia_dr3"
    assert fields[11] == "0.9"


def test_chunked_batches_correctly() -> None:
    items = [_entity() for _ in range(5)]
    batches = list(_chunked(iter(items), 2))
    assert [len(b) for b in batches] == [2, 2, 1]


def test_chunked_empty_input_yields_nothing() -> None:
    assert list(_chunked(iter([]), 10)) == []
