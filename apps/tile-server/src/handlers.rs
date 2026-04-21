//! Route handlers. Binary tile responses attach Doc 26 §7 headers; the
//! manifest endpoint serves JSON with an ETag derived from the payload's
//! `version` field (or the file contents as a fallback).

use std::sync::Arc;

use axum::body::Body;
use axum::extract::{Path, State};
use axum::http::{header, HeaderMap, HeaderName, HeaderValue, Response, StatusCode};
use axum::response::IntoResponse;
use bytes::Bytes;

use crate::error::TileError;
use crate::router::AppState;
use crate::store::TileBytes;

const CACHE_CONTROL_TILE: &str = "public, max-age=86400, immutable";
const CACHE_CONTROL_MANIFEST: &str = "public, max-age=3600";

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

pub async fn health() -> impl IntoResponse {
    axum::Json(serde_json::json!({ "status": "ok" }))
}

// ---------------------------------------------------------------------------
// Star tile — /v1/tiles/stars/:z/:x/:y/:level
// ---------------------------------------------------------------------------

pub async fn star_tile(
    State(state): State<Arc<AppState>>,
    Path((z, x, y, level)): Path<(u32, u64, u64, u32)>,
    headers: HeaderMap,
) -> Result<Response<Body>, TileError> {
    let tile = state.store.star_tile(z, x, y, level).await?;
    // Doc 11 §4.1: header is [u32 tile_id | u32 star_count | f32 min | f32 max].
    let star_count = read_u32_le(&tile.bytes, 4);
    let mut response = binary_response(&tile);
    if let Some(count) = star_count {
        insert_static_num(response.headers_mut(), "x-tile-star-count", count);
    }
    attach_common(&mut response, &state, &headers);
    Ok(response)
}

// ---------------------------------------------------------------------------
// Galaxy tile — /v1/tiles/galaxies/:healpix_idx
// ---------------------------------------------------------------------------

pub async fn galaxy_tile(
    State(state): State<Arc<AppState>>,
    Path(healpix_idx): Path<u32>,
    headers: HeaderMap,
) -> Result<Response<Body>, TileError> {
    let tile = state.store.galaxy_tile(healpix_idx).await?;
    // Doc 11 §4.2: galaxy_count at offset 0.
    let galaxy_count = read_u32_le(&tile.bytes, 0);
    let mut response = binary_response(&tile);
    if let Some(count) = galaxy_count {
        insert_static_num(response.headers_mut(), "x-tile-galaxy-count", count);
    }
    attach_common(&mut response, &state, &headers);
    Ok(response)
}

// ---------------------------------------------------------------------------
// Cosmic-web tile — /v1/tiles/cosmic-web/:sector
// ---------------------------------------------------------------------------

pub async fn cosmic_web_tile(
    State(state): State<Arc<AppState>>,
    Path(sector): Path<u32>,
    headers: HeaderMap,
) -> Result<Response<Body>, TileError> {
    let tile = state.store.cosmic_web_tile(sector).await?;
    // Doc 11 §4.3: vertex_count at offset 0.
    let vertex_count = read_u32_le(&tile.bytes, 0);
    let mut response = binary_response(&tile);
    if let Some(count) = vertex_count {
        insert_static_num(response.headers_mut(), "x-tile-vertex-count", count);
    }
    attach_common(&mut response, &state, &headers);
    Ok(response)
}

// ---------------------------------------------------------------------------
// Manifest — /v1/tiles/manifest
// ---------------------------------------------------------------------------

pub async fn manifest(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> Result<Response<Body>, TileError> {
    let tile = state.store.manifest().await?;
    let version = manifest_version(&tile.bytes)
        .or_else(|| tile.version.clone())
        .unwrap_or_else(|| state.config.data_version.clone());
    let etag = format!("W/\"{version}\"");

    // §2.4 / §7.4 conditional GET: if client sends `If-None-Match` with our
    // current ETag, reply 304 Not Modified with no body.
    if let Some(ifnm) = headers.get(header::IF_NONE_MATCH).and_then(|v| v.to_str().ok()) {
        if ifnm == etag {
            let mut response = Response::builder()
                .status(StatusCode::NOT_MODIFIED)
                .body(Body::empty())
                .unwrap_or_else(|_| Response::new(Body::empty()));
            response.headers_mut().insert(header::ETAG, header_value(&etag));
            response.headers_mut().insert(
                header::CACHE_CONTROL,
                HeaderValue::from_static(CACHE_CONTROL_MANIFEST),
            );
            attach_common_manifest(&mut response, &state, &headers, &version);
            return Ok(response);
        }
    }

    let mut response = Response::builder()
        .status(StatusCode::OK)
        .body(Body::from(tile.bytes))
        .map_err(|e| TileError::Internal(format!("build manifest response: {e}")))?;
    response.headers_mut().insert(
        header::CONTENT_TYPE,
        HeaderValue::from_static("application/json; charset=utf-8"),
    );
    response.headers_mut().insert(
        header::CACHE_CONTROL,
        HeaderValue::from_static(CACHE_CONTROL_MANIFEST),
    );
    response.headers_mut().insert(header::ETAG, header_value(&etag));
    attach_common_manifest(&mut response, &state, &headers, &version);
    Ok(response)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn binary_response(tile: &TileBytes) -> Response<Body> {
    let mut response = Response::builder()
        .status(StatusCode::OK)
        .body(Body::from(tile.bytes.clone()))
        .unwrap_or_else(|_| Response::new(Body::empty()));
    let h = response.headers_mut();
    h.insert(
        header::CONTENT_TYPE,
        HeaderValue::from_static("application/octet-stream"),
    );
    h.insert(
        header::CACHE_CONTROL,
        HeaderValue::from_static(CACHE_CONTROL_TILE),
    );
    if let Some(version) = tile.version.as_deref() {
        if let Ok(value) = HeaderValue::from_str(version) {
            h.insert(HeaderName::from_static("x-tile-version"), value);
        }
    }
    response
}

fn attach_common(response: &mut Response<Body>, state: &AppState, req_headers: &HeaderMap) {
    let h = response.headers_mut();
    // X-Tile-Version fallback from config.
    if !h.contains_key("x-tile-version") {
        if let Ok(value) = HeaderValue::from_str(&state.config.data_version) {
            h.insert(HeaderName::from_static("x-tile-version"), value);
        }
    }
    attach_data_version(h, &state.config.data_version);
    attach_request_id(h, req_headers);
}

fn attach_common_manifest(
    response: &mut Response<Body>,
    state: &AppState,
    req_headers: &HeaderMap,
    version: &str,
) {
    let h = response.headers_mut();
    attach_data_version(h, version);
    let fallback_version = &state.config.data_version;
    if !h.contains_key("x-data-version") {
        attach_data_version(h, fallback_version);
    }
    attach_request_id(h, req_headers);
}

fn attach_data_version(h: &mut HeaderMap, version: &str) {
    if let Ok(value) = HeaderValue::from_str(version) {
        h.insert(HeaderName::from_static("x-data-version"), value);
    }
}

fn attach_request_id(h: &mut HeaderMap, req_headers: &HeaderMap) {
    let incoming = req_headers
        .get("x-request-id")
        .and_then(|v| v.to_str().ok())
        .map(str::to_owned);
    let request_id = incoming.unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    if let Ok(value) = HeaderValue::from_str(&request_id) {
        h.insert(HeaderName::from_static("x-request-id"), value);
    }
}

fn insert_static_num(h: &mut HeaderMap, name: &'static str, value: u32) {
    if let Ok(v) = HeaderValue::from_str(&value.to_string()) {
        h.insert(HeaderName::from_static(name), v);
    }
}

fn header_value(s: &str) -> HeaderValue {
    HeaderValue::from_str(s).unwrap_or_else(|_| HeaderValue::from_static(""))
}

fn read_u32_le(bytes: &Bytes, offset: usize) -> Option<u32> {
    if bytes.len() < offset + 4 {
        return None;
    }
    let s = &bytes[offset..offset + 4];
    Some(u32::from_le_bytes([s[0], s[1], s[2], s[3]]))
}

fn manifest_version(bytes: &Bytes) -> Option<String> {
    // Be lenient: accept either `{ "version": "…" }` at top level or inside
    // `{ "data": { "version": "…" } }` (Doc 26 §2.5 envelope).
    let value: serde_json::Value = serde_json::from_slice(bytes).ok()?;
    let direct = value.get("version").and_then(|v| v.as_str());
    let enveloped = value
        .get("data")
        .and_then(|d| d.get("version"))
        .and_then(|v| v.as_str());
    direct.or(enveloped).map(str::to_owned)
}
