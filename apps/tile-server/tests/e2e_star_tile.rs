//! End-to-end star tile round-trip (T-E-05).
//!
//! Exercises the full Doc 26 §7 request path for the HEALPix-addressed
//! star tile route:
//!
//!   1. Build a known `StarTile` with 5 stars at deterministic positions.
//!   2. Encode via [`cosmos_tile_server::encoding::encode_star_tile`] and
//!      write the resulting bytes to
//!      `<root>/stars/healpix/<order>/<pixel>.bin` — the same layout the
//!      Airflow ETL (T-F-04) will produce.
//!   3. Stand up the axum router with a real `FilesystemHealpixStarStore`
//!      pointed at that temp root.
//!   4. Make an HTTP request through the router and read the body bytes.
//!   5. Decode via the sibling Rust decoder and assert: star count +
//!      per-star (x, y, z) within f16 quantisation error + magnitude,
//!      colour index, spectral type, flags, catalog index all exact.
//!
//! The TS decoder in `packages/tile-decoder/src/starTile.ts` is exercised
//! against the same Doc 11 §4.1 layout by its own vitest suite (7 tests
//! in `__tests__/starTileEncode.test.ts`). Since the Rust encoder writes
//! byte-exact the same layout (enforced by the `encoding.rs` unit tests
//! for header endianness + padding), bytes produced here decode in TS
//! without modification — T-E-08 will exercise that path live in the
//! browser against a running tile-server.

use std::net::SocketAddr;
use std::path::PathBuf;
use std::str::FromStr;
use std::sync::Arc;

use axum::body::{to_bytes, Body};
use axum::http::{header, Request, StatusCode};
use cosmos_tile_server::encoding::{
    decode_star_tile, encode_star_tile, pack_color_index, pack_magnitude, StarRecord, StarTile,
    SPECTRAL_TYPE_A, SPECTRAL_TYPE_F, SPECTRAL_TYPE_G, SPECTRAL_TYPE_K, SPECTRAL_TYPE_M,
};
use cosmos_tile_server::{
    build_router_with_healpix, AppConfig, FilesystemHealpixStarStore, FilesystemTileStore,
};
use tempfile::TempDir;
use tokio::fs;
use tower::ServiceExt;

const FIVE_STARS: &[(f32, f32, f32, f32, f32, u8, u16)] = &[
    //   x,    y,    z,    mag,  bp-rp, spectral, cat_idx
    // Star A: Sirius-like at tile origin.
    (0.0, 0.0, 0.0, -1.46, 0.00, SPECTRAL_TYPE_A, 1001),
    // Star B: 2.6 pc due +x (Procyon-ish).
    (2.625, 0.0, 0.0, 0.34, 0.43, SPECTRAL_TYPE_F, 1002),
    // Star C: 11.9 pc along +y (below f16's +∞ limit of 65504).
    (0.0, 11.9, 0.0, 4.67, 0.82, SPECTRAL_TYPE_G, 1003),
    // Star D: diagonal.
    (-3.5, 2.25, -1.125, 9.53, 1.41, SPECTRAL_TYPE_K, 1004),
    // Star E: fractional position to stress f16 rounding.
    (0.3125, -0.0625, 0.9375, 11.0, 2.05, SPECTRAL_TYPE_M, 1005),
];

fn build_tile() -> StarTile {
    let stars: Vec<StarRecord> = FIVE_STARS
        .iter()
        .map(|&(x, y, z, mag, bpr, spec, cat)| StarRecord {
            x,
            y,
            z,
            magnitude: pack_magnitude(mag),
            color_index: pack_color_index(bpr),
            spectral_type: spec,
            flags: 0,
            catalog_index: cat,
        })
        .collect();
    StarTile {
        tile_id: 77,
        min_distance: 0.0,
        max_distance: 15.0,
        stars,
    }
}

async fn seed_tile_file(root: &std::path::Path, order: u8, pixel: u64, bytes: &[u8]) {
    let dir = root
        .join("stars")
        .join("healpix")
        .join(order.to_string());
    fs::create_dir_all(&dir).await.unwrap();
    fs::write(dir.join(format!("{pixel}.bin")), bytes).await.unwrap();
}

fn make_config(root: PathBuf) -> AppConfig {
    AppConfig {
        bind_addr: SocketAddr::from_str("127.0.0.1:0").unwrap(),
        tile_root: root,
        data_version: "test-e2e".into(),
    }
}

#[tokio::test]
async fn http_round_trip_returns_byte_identical_payload() {
    let tile = build_tile();
    let encoded = encode_star_tile(&tile).unwrap();
    let dir = TempDir::new().unwrap();
    let root = dir.path().to_path_buf();
    const ORDER: u8 = 6;
    const PIXEL: u64 = 12_345;
    seed_tile_file(&root, ORDER, PIXEL, &encoded).await;

    let legacy_store = Arc::new(FilesystemTileStore::new(root.clone()));
    let healpix_store = Arc::new(FilesystemHealpixStarStore::new(root.clone()).with_version("v7"));
    let router =
        build_router_with_healpix(make_config(root), legacy_store, Some(healpix_store), None);

    let response = router
        .oneshot(
            Request::builder()
                .uri(format!("/v1/tiles/stars/healpix/{ORDER}/{PIXEL}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    assert_eq!(
        response.headers().get(header::CONTENT_TYPE).unwrap(),
        "application/octet-stream",
    );
    assert_eq!(
        response
            .headers()
            .get("x-tile-star-count")
            .and_then(|v| v.to_str().ok()),
        Some("5"),
    );
    assert_eq!(
        response
            .headers()
            .get("x-tile-version")
            .and_then(|v| v.to_str().ok()),
        Some("v7"),
    );
    assert!(response.headers().get(header::ETAG).is_some());

    let body = to_bytes(response.into_body(), 1024 * 1024).await.unwrap();
    assert_eq!(body.as_ref(), encoded.as_ref(), "HTTP body != encoded bytes");

    // Decode and compare field-by-field.
    let (header, records) = decode_star_tile(&body).expect("decode succeeds");
    assert_eq!(header.tile_id, 77);
    assert_eq!(header.star_count, 5);
    assert_eq!(header.min_distance, 0.0);
    assert_eq!(header.max_distance, 15.0);

    for (i, (expected, got)) in tile.stars.iter().zip(records.iter()).enumerate() {
        assert!(
            (expected.x - got.x).abs() < 1e-2,
            "[{i}] x: encoded {} decoded {}",
            expected.x,
            got.x,
        );
        assert!(
            (expected.y - got.y).abs() < 1e-2,
            "[{i}] y: encoded {} decoded {}",
            expected.y,
            got.y,
        );
        assert!(
            (expected.z - got.z).abs() < 1e-2,
            "[{i}] z: encoded {} decoded {}",
            expected.z,
            got.z,
        );
        assert_eq!(expected.magnitude, got.magnitude, "[{i}] magnitude byte");
        assert_eq!(expected.color_index, got.color_index, "[{i}] colour index byte");
        assert_eq!(expected.spectral_type, got.spectral_type, "[{i}] spectral type");
        assert_eq!(expected.flags, got.flags, "[{i}] flags");
        assert_eq!(expected.catalog_index, got.catalog_index, "[{i}] catalog index");
    }
}

#[tokio::test]
async fn second_request_with_matching_etag_returns_304() {
    let tile = build_tile();
    let encoded = encode_star_tile(&tile).unwrap();
    let dir = TempDir::new().unwrap();
    let root = dir.path().to_path_buf();
    const ORDER: u8 = 5;
    const PIXEL: u64 = 999;
    seed_tile_file(&root, ORDER, PIXEL, &encoded).await;

    let legacy_store = Arc::new(FilesystemTileStore::new(root.clone()));
    let healpix_store = Arc::new(
        FilesystemHealpixStarStore::new(root.clone()).with_version("etag-test"),
    );
    let router =
        build_router_with_healpix(make_config(root), legacy_store, Some(healpix_store), None);

    // First request — capture ETag.
    let first = router
        .clone()
        .oneshot(
            Request::builder()
                .uri(format!("/v1/tiles/stars/healpix/{ORDER}/{PIXEL}"))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(first.status(), StatusCode::OK);
    let etag = first
        .headers()
        .get(header::ETAG)
        .unwrap()
        .to_str()
        .unwrap()
        .to_string();
    assert!(etag.contains("etag-test"), "etag {etag} carries version");

    let body = to_bytes(first.into_body(), 1024 * 1024).await.unwrap();
    assert_eq!(body.len(), encoded.len());

    // Second request — send If-None-Match.
    let second = router
        .oneshot(
            Request::builder()
                .uri(format!("/v1/tiles/stars/healpix/{ORDER}/{PIXEL}"))
                .header(header::IF_NONE_MATCH, &etag)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(second.status(), StatusCode::NOT_MODIFIED);
    let body2 = to_bytes(second.into_body(), 1024 * 1024).await.unwrap();
    assert!(body2.is_empty(), "304 body must be empty");
}

#[tokio::test]
async fn missing_tile_returns_404_envelope() {
    let dir = TempDir::new().unwrap();
    let root = dir.path().to_path_buf();
    let legacy_store = Arc::new(FilesystemTileStore::new(root.clone()));
    let healpix_store = Arc::new(FilesystemHealpixStarStore::new(root.clone()));
    let router =
        build_router_with_healpix(make_config(root), legacy_store, Some(healpix_store), None);

    let response = router
        .oneshot(
            Request::builder()
                .uri("/v1/tiles/stars/healpix/3/1")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::NOT_FOUND);
    let body = to_bytes(response.into_body(), 64 * 1024).await.unwrap();
    let json: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(json["error"]["code"], "TILE_NOT_FOUND");
}
