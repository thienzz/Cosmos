//! HEALPix-addressed star tile route (T-E-04, viz.md Phase E).
//!
//! The legacy octree route (`/v1/tiles/stars/{z}/{x}/{y}/{level}`) in
//! `crate::handlers::star_tile` continues to serve the Doc 26 §7.1 octree
//! format. This module adds the HEALPix-addressed sibling endpoint used
//! by the Gaia DR3 pipeline (T-D-04 added a `healpix_order6` column):
//!
//! ```text
//! GET /v1/tiles/stars/healpix/{order}/{pixel}
//! ```
//!
//! Request pipeline:
//!
//! ```text
//!  client ──► addr validation ──► cache.get_or_compute ──► store.get
//!                                          │
//!                                          └── miss ──► store (disk / pg)
//! ```
//!
//! The store abstraction — [`HealpixStarTileStore`] — lets the Rust
//! integration tests drive the handler with an in-memory fixture while
//! production uses [`FilesystemHealpixStarStore`] against the Airflow
//! ETL's tile output (`data/tiles/stars/healpix/{order}/{pixel}.bin`).

use std::path::{Path, PathBuf};
use std::sync::Arc;

use axum::body::Body;
use axum::extract::{Path as AxPath, State};
use axum::http::{header, HeaderMap, HeaderName, HeaderValue, Response, StatusCode};
use bytes::Bytes;
use tokio::fs;
use tokio::io::AsyncReadExt;

use crate::error::TileError;
use crate::healpix::{npix, MAX_ORDER};
use crate::router::AppState;
use crate::store::TileBytes;

const CACHE_CONTROL_TILE: &str = "public, max-age=86400, immutable";

// ---------------------------------------------------------------------------
// Store abstraction
// ---------------------------------------------------------------------------

/// Anything that can materialise a HEALPix-addressed star tile. Signature
/// mirrors [`crate::store::TileStore`] so the two abstractions can share
/// test rigs, but the input is `(order, pixel)` not `(z, x, y, level)`.
#[axum::async_trait]
pub trait HealpixStarTileStore: Send + Sync + 'static {
    async fn get(&self, order: u8, pixel: u64) -> Result<TileBytes, TileError>;
}

pub type SharedHealpixStarStore = Arc<dyn HealpixStarTileStore>;

/// Reads `{root}/stars/healpix/{order}/{pixel}.bin`. Nested dir-per-order
/// keeps the leaf directory size manageable — at order 10 there are 12M
/// pixels, sharded across 11 order dirs so no single dir exceeds ~1.5M
/// files (which most filesystems handle; going deeper is overkill).
#[derive(Debug, Clone)]
pub struct FilesystemHealpixStarStore {
    root: PathBuf,
    version: Option<String>,
}

impl FilesystemHealpixStarStore {
    pub fn new(root: impl Into<PathBuf>) -> Self {
        Self {
            root: root.into(),
            version: None,
        }
    }

    pub fn with_version(mut self, v: impl Into<String>) -> Self {
        self.version = Some(v.into());
        self
    }

    fn tile_path(&self, order: u8, pixel: u64) -> PathBuf {
        self.root
            .join("stars")
            .join("healpix")
            .join(order.to_string())
            .join(format!("{pixel}.bin"))
    }

    async fn read_file(&self, path: &Path) -> Result<Bytes, TileError> {
        match fs::File::open(path).await {
            Ok(mut f) => {
                let mut buf = Vec::new();
                f.read_to_end(&mut buf).await.map_err(|e| {
                    TileError::Internal(format!("read {}: {e}", path.display()))
                })?;
                Ok(Bytes::from(buf))
            }
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Err(TileError::TileNotFound(
                format!("{}", path.display()),
            )),
            Err(e) => Err(TileError::Internal(format!(
                "open {}: {e}",
                path.display()
            ))),
        }
    }
}

#[axum::async_trait]
impl HealpixStarTileStore for FilesystemHealpixStarStore {
    async fn get(&self, order: u8, pixel: u64) -> Result<TileBytes, TileError> {
        validate_address(order, pixel)?;
        let path = self.tile_path(order, pixel);
        let bytes = self.read_file(&path).await?;
        Ok(TileBytes {
            bytes,
            version: self.version.clone(),
        })
    }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

/// `GET /v1/tiles/stars/healpix/:order/:pixel`
pub async fn healpix_star_tile(
    State(state): State<Arc<AppState>>,
    AxPath((order, pixel)): AxPath<(u8, u64)>,
    headers: HeaderMap,
) -> Result<Response<Body>, TileError> {
    validate_address(order, pixel)?;

    let store = state
        .healpix_stars
        .as_ref()
        .ok_or_else(|| {
            TileError::Internal("healpix star store not configured".to_string())
        })?;
    let cache = state.healpix_star_cache.clone();

    let key = format!("stars/healpix/{order}/{pixel}");
    let tile = match cache.as_ref() {
        Some(c) => {
            let store = store.clone();
            c.get_or_compute(&key, move || async move { store.get(order, pixel).await })
                .await?
        }
        None => store.get(order, pixel).await?,
    };

    // ETag based on the version stamp (content hash would be nicer but the
    // version already changes on every tile regen). If the client already
    // has the current version, return 304.
    let etag = etag_for(&tile, &state.config.data_version);
    if matches_inm(&headers, &etag) {
        let mut response = Response::builder()
            .status(StatusCode::NOT_MODIFIED)
            .body(Body::empty())
            .unwrap_or_else(|_| Response::new(Body::empty()));
        attach_headers(response.headers_mut(), &state, &tile, &etag, &headers);
        return Ok(response);
    }

    // Header sniff: Doc 11 §4.1 places star_count at offset 4 of the header.
    let star_count = read_u32_le(&tile.bytes, 4);

    let mut response = Response::builder()
        .status(StatusCode::OK)
        .body(Body::from(tile.bytes.clone()))
        .map_err(|e| TileError::Internal(format!("build response: {e}")))?;
    {
        let h = response.headers_mut();
        h.insert(
            header::CONTENT_TYPE,
            HeaderValue::from_static("application/octet-stream"),
        );
        h.insert(
            header::CACHE_CONTROL,
            HeaderValue::from_static(CACHE_CONTROL_TILE),
        );
        if let Ok(v) = HeaderValue::from_str(&etag) {
            h.insert(header::ETAG, v);
        }
        if let Some(count) = star_count {
            if let Ok(v) = HeaderValue::from_str(&count.to_string()) {
                h.insert(HeaderName::from_static("x-tile-star-count"), v);
            }
        }
    }
    attach_headers(response.headers_mut(), &state, &tile, &etag, &headers);
    Ok(response)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn validate_address(order: u8, pixel: u64) -> Result<(), TileError> {
    if order > MAX_ORDER {
        return Err(TileError::InvalidAddress(format!(
            "order={order} exceeds MAX_ORDER ({MAX_ORDER})"
        )));
    }
    let n = npix(order);
    if pixel >= n {
        return Err(TileError::InvalidAddress(format!(
            "pixel={pixel} out of range at order {order} (max {})",
            n - 1
        )));
    }
    Ok(())
}

fn etag_for(tile: &TileBytes, fallback_version: &str) -> String {
    let version = tile.version.as_deref().unwrap_or(fallback_version);
    format!("W/\"{version}-{}\"", tile.bytes.len())
}

fn matches_inm(headers: &HeaderMap, etag: &str) -> bool {
    headers
        .get(header::IF_NONE_MATCH)
        .and_then(|v| v.to_str().ok())
        .map(|v| v == etag)
        .unwrap_or(false)
}

fn attach_headers(
    h: &mut HeaderMap,
    state: &AppState,
    tile: &TileBytes,
    etag: &str,
    req_headers: &HeaderMap,
) {
    if !h.contains_key(header::ETAG) {
        if let Ok(v) = HeaderValue::from_str(etag) {
            h.insert(header::ETAG, v);
        }
    }
    if !h.contains_key(header::CACHE_CONTROL) {
        h.insert(
            header::CACHE_CONTROL,
            HeaderValue::from_static(CACHE_CONTROL_TILE),
        );
    }
    let version = tile
        .version
        .as_deref()
        .unwrap_or(&state.config.data_version);
    if let Ok(v) = HeaderValue::from_str(version) {
        h.insert(HeaderName::from_static("x-tile-version"), v.clone());
        h.insert(HeaderName::from_static("x-data-version"), v);
    }
    let request_id = req_headers
        .get("x-request-id")
        .and_then(|v| v.to_str().ok())
        .map(str::to_owned)
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
    if let Ok(v) = HeaderValue::from_str(&request_id) {
        h.insert(HeaderName::from_static("x-request-id"), v);
    }
}

fn read_u32_le(bytes: &Bytes, offset: usize) -> Option<u32> {
    if bytes.len() < offset + 4 {
        return None;
    }
    let s = &bytes[offset..offset + 4];
    Some(u32::from_le_bytes([s[0], s[1], s[2], s[3]]))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use crate::cache::LayeredTileCache;
    use crate::config::AppConfig;
    use crate::store::{FilesystemTileStore, InMemoryLruCache};
    use axum::body::to_bytes;
    use axum::http::Request;
    use std::net::SocketAddr;
    use std::str::FromStr;
    use std::time::Duration;
    use tempfile::TempDir;
    use tower::ServiceExt;

    fn make_config(root: &Path) -> AppConfig {
        AppConfig {
            bind_addr: SocketAddr::from_str("127.0.0.1:0").unwrap(),
            tile_root: root.to_path_buf(),
            data_version: "test-v1".into(),
        }
    }

    struct StubStore {
        tile: Option<TileBytes>,
    }

    #[axum::async_trait]
    impl HealpixStarTileStore for StubStore {
        async fn get(&self, _order: u8, _pixel: u64) -> Result<TileBytes, TileError> {
            self.tile
                .clone()
                .ok_or_else(|| TileError::TileNotFound("stub".into()))
        }
    }

    fn demo_tile_bytes(star_count: u32) -> Bytes {
        // Doc 11 §4.1 header: tile_id | star_count | min_dist | max_dist.
        let mut buf = Vec::with_capacity(16 + star_count as usize * 16);
        buf.extend_from_slice(&42u32.to_le_bytes()); // tile_id
        buf.extend_from_slice(&star_count.to_le_bytes());
        buf.extend_from_slice(&0.0f32.to_le_bytes());
        buf.extend_from_slice(&100.0f32.to_le_bytes());
        // Zero-filled records — handler only inspects the header.
        buf.resize(16 + star_count as usize * 16, 0);
        Bytes::from(buf)
    }

    fn router_with(
        store: SharedHealpixStarStore,
        cache: Option<LayeredTileCache>,
    ) -> axum::Router {
        use axum::routing::get;
        let config = AppConfig {
            bind_addr: SocketAddr::from_str("127.0.0.1:0").unwrap(),
            tile_root: PathBuf::from("."),
            data_version: "test-v1".into(),
        };
        let filesystem_store =
            Arc::new(FilesystemTileStore::new(config.tile_root.clone())) as _;
        let state = Arc::new(AppState {
            config,
            store: filesystem_store,
            healpix_stars: Some(store),
            healpix_star_cache: cache.map(Arc::new),
        });
        axum::Router::new()
            .route(
                "/v1/tiles/stars/healpix/:order/:pixel",
                get(healpix_star_tile),
            )
            .with_state(state)
    }

    #[tokio::test]
    async fn healpix_tile_returns_bytes_and_star_count_header() {
        let store = Arc::new(StubStore {
            tile: Some(TileBytes {
                bytes: demo_tile_bytes(3),
                version: Some("v42".to_string()),
            }),
        });
        let app = router_with(store, None);
        let response = app
            .oneshot(
                Request::builder()
                    .uri("/v1/tiles/stars/healpix/3/42")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(
            response
                .headers()
                .get("x-tile-star-count")
                .and_then(|v| v.to_str().ok()),
            Some("3"),
        );
        assert_eq!(
            response
                .headers()
                .get(header::CONTENT_TYPE)
                .and_then(|v| v.to_str().ok()),
            Some("application/octet-stream"),
        );
        assert_eq!(
            response
                .headers()
                .get(header::CACHE_CONTROL)
                .and_then(|v| v.to_str().ok()),
            Some(CACHE_CONTROL_TILE),
        );
        let etag = response
            .headers()
            .get(header::ETAG)
            .and_then(|v| v.to_str().ok())
            .unwrap()
            .to_string();
        assert!(etag.contains("v42"), "etag {etag} should carry tile version");

        let body = to_bytes(response.into_body(), 1024 * 1024).await.unwrap();
        assert_eq!(body.len(), 16 + 3 * 16);
    }

    #[tokio::test]
    async fn healpix_tile_304_on_if_none_match() {
        let store = Arc::new(StubStore {
            tile: Some(TileBytes {
                bytes: demo_tile_bytes(1),
                version: Some("v42".to_string()),
            }),
        });
        let app = router_with(store, None);
        // First call — capture ETag.
        let first = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/v1/tiles/stars/healpix/3/42")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        let etag = first
            .headers()
            .get(header::ETAG)
            .unwrap()
            .to_str()
            .unwrap()
            .to_string();

        // Second call — re-use ETag, expect 304.
        let second = app
            .oneshot(
                Request::builder()
                    .uri("/v1/tiles/stars/healpix/3/42")
                    .header(header::IF_NONE_MATCH, &etag)
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(second.status(), StatusCode::NOT_MODIFIED);
        assert_eq!(
            second
                .headers()
                .get(header::ETAG)
                .and_then(|v| v.to_str().ok()),
            Some(etag.as_str()),
        );
        let body = to_bytes(second.into_body(), 1024).await.unwrap();
        assert_eq!(body.len(), 0);
    }

    #[tokio::test]
    async fn bad_order_rejected_with_400() {
        let store = Arc::new(StubStore { tile: None });
        let app = router_with(store, None);
        let response = app
            .oneshot(
                Request::builder()
                    .uri("/v1/tiles/stars/healpix/255/0")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn bad_pixel_rejected_with_400() {
        let store = Arc::new(StubStore { tile: None });
        let app = router_with(store, None);
        // order=2 has 192 pixels; 999 is out of range.
        let response = app
            .oneshot(
                Request::builder()
                    .uri("/v1/tiles/stars/healpix/2/999")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[tokio::test]
    async fn missing_tile_returns_404() {
        let store = Arc::new(StubStore { tile: None });
        let app = router_with(store, None);
        let response = app
            .oneshot(
                Request::builder()
                    .uri("/v1/tiles/stars/healpix/2/0")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    #[tokio::test]
    async fn cache_hit_short_circuits_store() {
        use std::sync::atomic::{AtomicUsize, Ordering};
        struct CountingStore {
            inner: TileBytes,
            calls: Arc<AtomicUsize>,
        }
        #[axum::async_trait]
        impl HealpixStarTileStore for CountingStore {
            async fn get(&self, _o: u8, _p: u64) -> Result<TileBytes, TileError> {
                self.calls.fetch_add(1, Ordering::SeqCst);
                Ok(self.inner.clone())
            }
        }
        let calls = Arc::new(AtomicUsize::new(0));
        let store = Arc::new(CountingStore {
            inner: TileBytes {
                bytes: demo_tile_bytes(1),
                version: Some("v7".to_string()),
            },
            calls: Arc::clone(&calls),
        });
        let l1 = Arc::new(InMemoryLruCache::new(16, None));
        let cache = LayeredTileCache::new(l1);
        let app = router_with(store, Some(cache));

        for _ in 0..4 {
            let response = app
                .clone()
                .oneshot(
                    Request::builder()
                        .uri("/v1/tiles/stars/healpix/3/42")
                        .body(Body::empty())
                        .unwrap(),
                )
                .await
                .unwrap();
            assert_eq!(response.status(), StatusCode::OK);
        }
        assert_eq!(calls.load(Ordering::SeqCst), 1, "store hit once; cache served the rest");
    }

    #[tokio::test]
    async fn filesystem_store_reads_tile_from_disk() {
        let dir = TempDir::new().unwrap();
        let root = dir.path();
        let tile_path = root.join("stars").join("healpix").join("3").join("42.bin");
        fs::create_dir_all(tile_path.parent().unwrap()).await.unwrap();
        fs::write(&tile_path, demo_tile_bytes(2).as_ref()).await.unwrap();

        let store = FilesystemHealpixStarStore::new(root).with_version("disk-v1");
        let tile = store.get(3, 42).await.unwrap();
        assert_eq!(tile.bytes.len(), 16 + 2 * 16);
        assert_eq!(tile.version.as_deref(), Some("disk-v1"));
    }

    #[tokio::test]
    async fn filesystem_store_returns_404_for_missing_file() {
        let dir = TempDir::new().unwrap();
        let store = FilesystemHealpixStarStore::new(dir.path());
        match store.get(1, 0).await {
            Err(TileError::TileNotFound(_)) => {}
            other => panic!("expected TileNotFound, got {other:?}"),
        }
    }

    #[tokio::test]
    async fn filesystem_store_validates_address() {
        let dir = TempDir::new().unwrap();
        let store = FilesystemHealpixStarStore::new(dir.path());
        // MAX_ORDER is 10.
        assert!(matches!(
            store.get(11, 0).await,
            Err(TileError::InvalidAddress(_))
        ));
        // Out-of-range pixel.
        assert!(matches!(
            store.get(1, 48).await,
            Err(TileError::InvalidAddress(_))
        ));
    }

    #[tokio::test]
    async fn config_helper_is_used_for_fallback_version() {
        // A tile without a version uses AppConfig.data_version as the fallback
        // — covers the "ETL didn't stamp the tile" case.
        let store = Arc::new(StubStore {
            tile: Some(TileBytes {
                bytes: demo_tile_bytes(0),
                version: None,
            }),
        });
        let app = router_with(store, None);
        let response = app
            .oneshot(
                Request::builder()
                    .uri("/v1/tiles/stars/healpix/0/0")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        let xtv = response
            .headers()
            .get("x-tile-version")
            .and_then(|v| v.to_str().ok())
            .unwrap();
        assert_eq!(xtv, "test-v1");
        let _ = make_config; // silence unused-import warnings if test order shifts.
        let _ = Duration::from_secs(0);
    }
}
