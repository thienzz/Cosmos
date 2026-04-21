//! Error types + Doc 26 §15 JSON envelope response.
//!
//! Handler fallibility maps 1:1 to the `TileError` enum. `IntoResponse`
//! serialises the error body as `{ "error": { code, message, status,
//! request_id, details? } }` with the correct HTTP status and `X-Request-ID`
//! echoed (or generated) so every client error is traceable.

use axum::http::{header, HeaderValue, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde::Serialize;
use thiserror::Error;

/// Canonical set of errors a tile handler can return. Variants map to Doc 26
/// §15.2 error codes + HTTP status.
#[derive(Debug, Error)]
pub enum TileError {
    /// Tile exists in the address space but no data on disk (sparse octree).
    #[error("tile not found: {0}")]
    TileNotFound(String),

    /// Address components fall outside the documented range (z>8, out-of-box
    /// x/y, healpix_idx ≥ 786_432, sector ≥ 64, …).
    #[error("invalid tile address: {0}")]
    InvalidAddress(String),

    /// Manifest file missing from the tile root. Semantic 404 but with a
    /// distinct code so the client can tell it apart from an empty tile.
    #[error("manifest not available")]
    ManifestUnavailable,

    /// IO / decode / serialisation problem inside the server.
    #[error("internal error: {0}")]
    Internal(String),
}

impl TileError {
    pub fn code(&self) -> &'static str {
        match self {
            TileError::TileNotFound(_) => "TILE_NOT_FOUND",
            TileError::InvalidAddress(_) => "INVALID_TILE_ADDRESS",
            TileError::ManifestUnavailable => "MANIFEST_NOT_AVAILABLE",
            TileError::Internal(_) => "INTERNAL_ERROR",
        }
    }

    pub fn status(&self) -> StatusCode {
        match self {
            TileError::TileNotFound(_) => StatusCode::NOT_FOUND,
            TileError::InvalidAddress(_) => StatusCode::BAD_REQUEST,
            TileError::ManifestUnavailable => StatusCode::NOT_FOUND,
            TileError::Internal(_) => StatusCode::INTERNAL_SERVER_ERROR,
        }
    }
}

#[derive(Debug, Serialize)]
struct ErrorEnvelope<'a> {
    error: ErrorBody<'a>,
}

#[derive(Debug, Serialize)]
struct ErrorBody<'a> {
    code: &'a str,
    message: String,
    status: u16,
    request_id: String,
}

impl IntoResponse for TileError {
    fn into_response(self) -> Response {
        let status = self.status();
        let request_id = uuid::Uuid::new_v4().to_string();
        let body = ErrorEnvelope {
            error: ErrorBody {
                code: self.code(),
                message: self.to_string(),
                status: status.as_u16(),
                request_id: request_id.clone(),
            },
        };
        if matches!(self, TileError::Internal(_)) {
            tracing::error!(%request_id, code = self.code(), error = %self, "tile handler failed");
        } else {
            tracing::debug!(%request_id, code = self.code(), "tile handler rejected");
        }
        let mut response = (status, Json(body)).into_response();
        if let Ok(value) = HeaderValue::from_str(&request_id) {
            response.headers_mut().insert("x-request-id", value);
        }
        response
            .headers_mut()
            .insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
        response
    }
}
