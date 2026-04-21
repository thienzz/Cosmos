#!/usr/bin/env python3
"""Apply (or update) the cosmos_entities index template.

Idempotent — run any number of times. Usage:
    ELASTICSEARCH_URL=http://localhost:9200 python apply_template.py
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import requests

TEMPLATE_PATH = Path(__file__).parent / "cosmos_entities_template.json"
TEMPLATE_NAME = "cosmos_entities_template"


def main() -> int:
    es_url = os.environ.get("ELASTICSEARCH_URL", "http://localhost:9200").rstrip("/")
    body = json.loads(TEMPLATE_PATH.read_text())
    resp = requests.put(
        f"{es_url}/_index_template/{TEMPLATE_NAME}",
        json=body,
        timeout=30,
    )
    if resp.status_code >= 400:
        print(f"ERROR {resp.status_code}: {resp.text}", file=sys.stderr)
        return 1
    print(f"OK: index template '{TEMPLATE_NAME}' applied to {es_url}")
    # Create the primary index if it does not exist (will inherit the template).
    ack = requests.head(f"{es_url}/cosmos_entities", timeout=10)
    if ack.status_code == 404:
        create = requests.put(f"{es_url}/cosmos_entities", timeout=30)
        if create.status_code >= 400:
            print(f"index create failed: {create.text}", file=sys.stderr)
            return 1
        print("OK: cosmos_entities index created")
    else:
        print("OK: cosmos_entities index already exists")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
