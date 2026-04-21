"""Fire the `data_version_update` notification per Doc 26 §14.3.4.

The Fastify API gateway exposes a privileged endpoint that fan-outs the event
over the WebSocket to all connected clients. The ETL calls this after a blue-green
table swap + manifest update.

Endpoint shape (server-side contract in apps/api):
    POST /v1/internal/data-version-update
    Headers: X-Internal-Secret: <shared secret>
    Body:    { "old_version": "...", "new_version": "...", "message": "...", "manifest_url": "..." }

This is a *best-effort* client — never raises on transport errors (we don't want
to block ETL promotion on notification failure). Returns True on success, False
with a logged warning otherwise.
"""
from __future__ import annotations

import logging
import os
from typing import Optional

import requests

logger = logging.getLogger(__name__)


def notify_data_version_update(
    *,
    old_version: str,
    new_version: str,
    message: str,
    manifest_url: str = "/v1/tiles/manifest",
    api_base_url: Optional[str] = None,
    internal_secret: Optional[str] = None,
    timeout_sec: float = 10.0,
) -> bool:
    api_url = (api_base_url or os.environ.get("API_BASE_URL", "http://localhost:3000")).rstrip("/")
    secret = internal_secret or os.environ.get("ETL_INTERNAL_SECRET", "")
    if not secret:
        logger.warning("ETL_INTERNAL_SECRET not set; skipping data_version_update notification")
        return False
    body = {
        "old_version": old_version,
        "new_version": new_version,
        "message": message,
        "manifest_url": manifest_url,
    }
    try:
        resp = requests.post(
            f"{api_url}/v1/internal/data-version-update",
            json=body,
            headers={"X-Internal-Secret": secret},
            timeout=timeout_sec,
        )
    except requests.RequestException as e:
        logger.warning("data_version_update notify failed: %s", e)
        return False
    if resp.status_code >= 400:
        logger.warning(
            "data_version_update notify returned %d: %s", resp.status_code, resp.text
        )
        return False
    return True
