//! End-to-end tests: build the router against a tempdir tile store, dispatch
//! requests via `tower::ServiceExt::oneshot`, assert response shape.

use std::path::{Path, PathBuf};
use std::sync::Arc;

use axum::body::Body;
use axum::http::{header, Request, StatusCode};
use cosmos_tile_server::{build_router, AppConfig, FilesystemTileStore};
use http_body_util::BodyExt;
use tempfile::TempDir;
use tower::ServiceExt;

fn test_config(root: &Path) -> AppConfig {
    AppConfig {
        bind_addr: "127.0.0.1:0".parse().unwrap(),
        tile_root: root.to_path_buf(),
        data_version: "test.v1".to_string(),
    }
}

fn make_app(root: &Path) -> axum::Router {
    let store = Arc::new(
        FilesystemTileStore::new(root.to_path_buf()).with_version("test.v1"),
    );
    build_router(test_config(root), store)
}

fn write_file(path: PathBuf, bytes: &[u8]) {
    std::fs::create_dir_all(path.parent().unwrap()).unwrap();
    std::fs::write(path, bytes).unwrap();
}

/// Build a minimal star tile: 16-byte header + 16 bytes per star.
fn fake_star_tile(tile_id: u32, star_count: u32) -> Vec<u8> {
    let mut buf = Vec::with_capacity(16 + star_count as usize * 16);
    buf.extend_from_slice(&tile_id.to_le_bytes());
    buf.extend_from_slice(&star_count.to_le_bytes());
    buf.extend_from_slice(&1.0f32.to_le_bytes()); // min_distance
    buf.extend_from_slice(&10.0f32.to_le_bytes()); // max_distance
    for i in 0..star_count {
        let mut record = [0u8; 16];
        record[0] = (i & 0xFF) as u8; // arbitrary filler
        buf.extend_from_slice(&record);
    }
    buf
}

/// Build a minimal galaxy tile: 16-byte header + 24 bytes per galaxy.
fn fake_galaxy_tile(galaxy_count: u32) -> Vec<u8> {
    let mut buf = Vec::with_capacity(16 + galaxy_count as usize * 24);
    buf.extend_from_slice(&galaxy_count.to_le_bytes());
    buf.extend_from_slice(&0.0f32.to_le_bytes());
    buf.extend_from_slice(&1000.0f32.to_le_bytes());
    buf.extend_from_slice(&0u32.to_le_bytes());
    for _ in 0..galaxy_count {
        buf.extend_from_slice(&[0u8; 24]);
    }
    buf
}

/// Build a minimal cosmic web tile: 20-byte header + vertices + indices.
fn fake_cosmic_web_tile(vertex_count: u32) -> Vec<u8> {
    let mut buf = Vec::with_capacity(20 + vertex_count as usize * 16);
    buf.extend_from_slice(&vertex_count.to_le_bytes());
    buf.extend_from_slice(&0u32.to_le_bytes()); // index_count
    buf.extend_from_slice(&1.0f32.to_le_bytes()); // density_scale
    buf.extend_from_slice(&1u32.to_le_bytes()); // version
    buf.extend_from_slice(&0u16.to_le_bytes()); // flags
    buf.extend_from_slice(&0u16.to_le_bytes()); // padding
    for _ in 0..vertex_count {
        buf.extend_from_slice(&[0u8; 16]);
    }
    buf
}

async fn dispatch(
    app: &axum::Router,
    path: &str,
) -> (StatusCode, axum::http::HeaderMap, bytes::Bytes) {
    let req = Request::builder()
        .uri(path)
        .method("GET")
        // Suppress gzip/br: tower-http compression is transparent but we
        // assert on raw bytes and count headers.
        .header(header::ACCEPT_ENCODING, "identity")
        .body(Body::empty())
        .unwrap();
    let response = app.clone().oneshot(req).await.unwrap();
    let status = response.status();
    let headers = response.headers().clone();
    let bytes = response.into_body().collect().await.unwrap().to_bytes();
    (status, headers, bytes)
}

// ---------------------------------------------------------------------------

#[tokio::test]
async fn health_returns_ok() {
    let tmp = TempDir::new().unwrap();
    let app = make_app(tmp.path());
    let (status, _, body) = dispatch(&app, "/health").await;
    assert_eq!(status, StatusCode::OK);
    assert!(body.windows(4).any(|w| w == b"\"ok\""));
}

#[tokio::test]
async fn star_tile_ok_with_headers() {
    let tmp = TempDir::new().unwrap();
    let tile = fake_star_tile(42, 5);
    write_file(
        tmp.path().join("stars/3/12/5/2.bin"),
        &tile,
    );
    let app = make_app(tmp.path());

    let (status, headers, body) = dispatch(&app, "/v1/tiles/stars/3/12/5/2").await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(
        headers.get(header::CONTENT_TYPE).unwrap(),
        "application/octet-stream"
    );
    assert_eq!(
        headers.get(header::CACHE_CONTROL).unwrap(),
        "public, max-age=86400, immutable"
    );
    assert_eq!(headers.get("x-tile-star-count").unwrap(), "5");
    assert_eq!(headers.get("x-tile-version").unwrap(), "test.v1");
    assert_eq!(headers.get("x-data-version").unwrap(), "test.v1");
    assert!(headers.get("x-request-id").is_some());
    assert_eq!(body.as_ref(), tile.as_slice());
}

#[tokio::test]
async fn star_tile_echoes_request_id() {
    let tmp = TempDir::new().unwrap();
    write_file(tmp.path().join("stars/0/0/0/0.bin"), &fake_star_tile(1, 1));
    let app = make_app(tmp.path());

    let req = Request::builder()
        .uri("/v1/tiles/stars/0/0/0/0")
        .header(header::ACCEPT_ENCODING, "identity")
        .header("x-request-id", "trace-42")
        .body(Body::empty())
        .unwrap();
    let response = app.oneshot(req).await.unwrap();
    assert_eq!(response.headers().get("x-request-id").unwrap(), "trace-42");
}

#[tokio::test]
async fn star_tile_404_not_found() {
    let tmp = TempDir::new().unwrap();
    let app = make_app(tmp.path());
    let (status, _, body) = dispatch(&app, "/v1/tiles/stars/3/12/5/2").await;
    assert_eq!(status, StatusCode::NOT_FOUND);
    let parsed: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(parsed["error"]["code"], "TILE_NOT_FOUND");
    assert_eq!(parsed["error"]["status"], 404);
    assert!(parsed["error"]["request_id"].is_string());
}

#[tokio::test]
async fn star_tile_400_invalid_address() {
    let tmp = TempDir::new().unwrap();
    let app = make_app(tmp.path());
    // z=9 exceeds max depth.
    let (status, _, body) = dispatch(&app, "/v1/tiles/stars/9/0/0/0").await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    let parsed: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(parsed["error"]["code"], "INVALID_TILE_ADDRESS");
}

#[tokio::test]
async fn star_tile_400_level_out_of_range() {
    let tmp = TempDir::new().unwrap();
    let app = make_app(tmp.path());
    let (status, _, _) = dispatch(&app, "/v1/tiles/stars/2/0/0/4").await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn galaxy_tile_ok_with_count_header() {
    let tmp = TempDir::new().unwrap();
    write_file(tmp.path().join("galaxies/1024.bin"), &fake_galaxy_tile(17));
    let app = make_app(tmp.path());

    let (status, headers, body) = dispatch(&app, "/v1/tiles/galaxies/1024").await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(headers.get("x-tile-galaxy-count").unwrap(), "17");
    assert_eq!(body.len(), 16 + 17 * 24);
}

#[tokio::test]
async fn galaxy_tile_400_out_of_range() {
    let tmp = TempDir::new().unwrap();
    let app = make_app(tmp.path());
    // Nside=256 → 786_432 pixels → 786_432 is out of range.
    let (status, _, body) = dispatch(&app, "/v1/tiles/galaxies/786432").await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    let parsed: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(parsed["error"]["code"], "INVALID_TILE_ADDRESS");
}

#[tokio::test]
async fn cosmic_web_tile_ok_with_vertex_count() {
    let tmp = TempDir::new().unwrap();
    write_file(
        tmp.path().join("cosmic-web/3.bin"),
        &fake_cosmic_web_tile(10),
    );
    let app = make_app(tmp.path());

    let (status, headers, _) = dispatch(&app, "/v1/tiles/cosmic-web/3").await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(headers.get("x-tile-vertex-count").unwrap(), "10");
}

#[tokio::test]
async fn cosmic_web_tile_400_out_of_range() {
    let tmp = TempDir::new().unwrap();
    let app = make_app(tmp.path());
    let (status, _, _) = dispatch(&app, "/v1/tiles/cosmic-web/64").await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn manifest_ok_with_etag_and_cache_control() {
    let tmp = TempDir::new().unwrap();
    let body = serde_json::json!({
        "data": {
            "version": "2026.Q1.3",
            "generated_at": "2026-04-15T03:00:00Z",
            "stars": {
                "total_tiles": 0, "total_stars": 0, "max_depth": 8, "lod_levels": 4,
                "bounds": { "min": {"x":0,"y":0,"z":0}, "max": {"x":0,"y":0,"z":0} },
                "tiles": []
            },
            "galaxies": { "total_tiles": 0, "total_galaxies": 0, "healpix_nside": 256, "tiles": [] },
            "cosmic_web": { "total_sectors": 0, "grid": [4,4,4], "sectors": [] }
        },
        "meta": {}
    });
    write_file(tmp.path().join("manifest.json"), body.to_string().as_bytes());
    let app = make_app(tmp.path());

    let (status, headers, bytes) = dispatch(&app, "/v1/tiles/manifest").await;
    assert_eq!(status, StatusCode::OK);
    let ct = headers.get(header::CONTENT_TYPE).unwrap().to_str().unwrap();
    assert!(ct.starts_with("application/json"), "got {ct}");
    assert_eq!(headers.get(header::CACHE_CONTROL).unwrap(), "public, max-age=3600");
    assert_eq!(headers.get(header::ETAG).unwrap(), "W/\"2026.Q1.3\"");
    let parsed: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
    assert_eq!(parsed["data"]["version"], "2026.Q1.3");
}

#[tokio::test]
async fn manifest_304_on_if_none_match() {
    let tmp = TempDir::new().unwrap();
    write_file(
        tmp.path().join("manifest.json"),
        br#"{"version":"2026.Q1.3","generated_at":"2026","stars":{"total_tiles":0,"total_stars":0,"max_depth":0,"lod_levels":0,"bounds":{"min":{"x":0,"y":0,"z":0},"max":{"x":0,"y":0,"z":0}},"tiles":[]},"galaxies":{"total_tiles":0,"total_galaxies":0,"healpix_nside":256,"tiles":[]},"cosmic_web":{"total_sectors":0,"grid":[4,4,4],"sectors":[]}}"#,
    );
    let app = make_app(tmp.path());

    let req = Request::builder()
        .uri("/v1/tiles/manifest")
        .header(header::IF_NONE_MATCH, "W/\"2026.Q1.3\"")
        .header(header::ACCEPT_ENCODING, "identity")
        .body(Body::empty())
        .unwrap();
    let response = app.oneshot(req).await.unwrap();
    assert_eq!(response.status(), StatusCode::NOT_MODIFIED);
    assert_eq!(response.headers().get(header::ETAG).unwrap(), "W/\"2026.Q1.3\"");
}

#[tokio::test]
async fn manifest_404_when_missing() {
    let tmp = TempDir::new().unwrap();
    let app = make_app(tmp.path());
    let (status, _, body) = dispatch(&app, "/v1/tiles/manifest").await;
    assert_eq!(status, StatusCode::NOT_FOUND);
    let parsed: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(parsed["error"]["code"], "MANIFEST_NOT_AVAILABLE");
}

#[tokio::test]
async fn cors_preflight_allowed() {
    let tmp = TempDir::new().unwrap();
    let app = make_app(tmp.path());
    let req = Request::builder()
        .method("OPTIONS")
        .uri("/v1/tiles/stars/0/0/0/0")
        .header("origin", "https://cosmosexplorer.app")
        .header("access-control-request-method", "GET")
        .body(Body::empty())
        .unwrap();
    let response = app.oneshot(req).await.unwrap();
    // tower-http CORS handles OPTIONS as preflight.
    assert!(response.status().is_success() || response.status().as_u16() == 204);
    assert!(response
        .headers()
        .get("access-control-allow-origin")
        .is_some());
}
