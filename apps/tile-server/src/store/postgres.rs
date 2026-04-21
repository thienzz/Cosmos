//! Postgres-backed TileStore + Redis/LRU hot-cache.
//!
//! Doc 25 §7.1 + T40 scope-coupled refactor. The filesystem store is fine for
//! dev but the production tile pyramid (> 10 GB, 262k stellar tiles) lives in
//! Postgres so the ETL can write + the API can read through the same store.
//!
//! Layered design:
//!
//! ```text
//! Handler ─▶ PostgresTileStore ─▶ TileHotCache (Redis in prod, LRU in dev/tests)
//!                                     │
//!                                     └─▶ TileRowStore (tokio-postgres in prod,
//!                                                       in-memory in tests)
//! ```
//!
//! We *don't* pull `tokio-postgres` into this crate today — the trait
//! boundary is the important part so a Postgres driver can be swapped in
//! without the handlers changing. An in-memory `TileRowStore` is the test
//! double; switching it for a real driver is a later, additive change.

use std::collections::HashMap;
use std::sync::Arc;
use std::sync::Mutex;

use bytes::Bytes;

use crate::error::TileError;

use super::{
    validate_galaxy_address, validate_sector, validate_star_address, TileBytes, TileHotCache,
    TileStore,
};

/// Canonical row returned by the backend — bytes + manifest version stamp.
#[derive(Debug, Clone)]
pub struct TileRow {
    pub bytes: Bytes,
    pub version: Option<String>,
}

/// Backend abstraction that the production Postgres driver implements. The
/// key is the cache-layer key (e.g. `stars/3/12/5/2`, `galaxies/4096`,
/// `cosmic-web/3`, or `manifest`). Returns `Ok(None)` when the row is
/// missing — the caller turns that into a `TileNotFound`.
#[axum::async_trait]
pub trait TileRowStore: Send + Sync + 'static {
    async fn fetch(&self, key: &str) -> Result<Option<TileRow>, TileError>;
}

/// In-memory `TileRowStore` — the test double. Also useful for "load
/// fixtures into RAM and serve" workflows during demos.
#[derive(Debug, Default)]
pub struct InMemoryTileRowStore {
    rows: Mutex<HashMap<String, TileRow>>,
}

impl InMemoryTileRowStore {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn insert(&self, key: impl Into<String>, row: TileRow) {
        self.rows.lock().unwrap().insert(key.into(), row);
    }
}

#[axum::async_trait]
impl TileRowStore for InMemoryTileRowStore {
    async fn fetch(&self, key: &str) -> Result<Option<TileRow>, TileError> {
        let guard = self
            .rows
            .lock()
            .map_err(|e| TileError::Internal(format!("row-store lock: {e}")))?;
        Ok(guard.get(key).cloned())
    }
}

/// Wraps a `TileRowStore` behind a `TileHotCache` — the canonical
/// production topology.
#[derive(Clone)]
pub struct PostgresTileStore {
    backend: Arc<dyn TileRowStore>,
    cache: Arc<dyn TileHotCache>,
    /// Counters exposed for the `/metrics` endpoint (scrape-adjacent).
    hits: Arc<Mutex<u64>>,
    misses: Arc<Mutex<u64>>,
}

impl PostgresTileStore {
    pub fn new(backend: Arc<dyn TileRowStore>, cache: Arc<dyn TileHotCache>) -> Self {
        Self {
            backend,
            cache,
            hits: Arc::new(Mutex::new(0)),
            misses: Arc::new(Mutex::new(0)),
        }
    }

    /// Cache hit count — exposed for observability + test assertions.
    pub fn hit_count(&self) -> u64 {
        *self.hits.lock().unwrap()
    }

    /// Cache miss count.
    pub fn miss_count(&self) -> u64 {
        *self.misses.lock().unwrap()
    }

    async fn load(&self, key: &str, missing: TileError) -> Result<TileBytes, TileError> {
        if let Some(cached) = self.cache.get(key).await {
            *self.hits.lock().unwrap() += 1;
            return Ok(cached);
        }
        *self.misses.lock().unwrap() += 1;
        let Some(row) = self.backend.fetch(key).await? else {
            return Err(missing);
        };
        let out = TileBytes {
            bytes: row.bytes,
            version: row.version,
        };
        self.cache.put(key, out.clone()).await;
        Ok(out)
    }
}

#[axum::async_trait]
impl TileStore for PostgresTileStore {
    async fn star_tile(&self, z: u32, x: u64, y: u64, level: u32) -> Result<TileBytes, TileError> {
        validate_star_address(z, x, y, level)?;
        let key = format!("stars/{z}/{x}/{y}/{level}");
        let missing = TileError::TileNotFound(key.clone());
        self.load(&key, missing).await
    }

    async fn galaxy_tile(&self, healpix_idx: u32) -> Result<TileBytes, TileError> {
        validate_galaxy_address(healpix_idx)?;
        let key = format!("galaxies/{healpix_idx}");
        let missing = TileError::TileNotFound(key.clone());
        self.load(&key, missing).await
    }

    async fn cosmic_web_tile(&self, sector: u32) -> Result<TileBytes, TileError> {
        validate_sector(sector)?;
        let key = format!("cosmic-web/{sector}");
        let missing = TileError::TileNotFound(key.clone());
        self.load(&key, missing).await
    }

    async fn manifest(&self) -> Result<TileBytes, TileError> {
        self.load("manifest", TileError::ManifestUnavailable).await
    }
}

#[cfg(test)]
mod tests {
    use std::time::Duration;

    use super::super::InMemoryLruCache;
    use super::*;

    fn row(payload: &[u8], version: &str) -> TileRow {
        TileRow {
            bytes: Bytes::copy_from_slice(payload),
            version: Some(version.to_string()),
        }
    }

    #[tokio::test]
    async fn serves_star_tile_from_backend_then_caches() {
        let backend = Arc::new(InMemoryTileRowStore::new());
        backend.insert("stars/0/0/0/0", row(b"tile-payload", "v42"));
        let cache = Arc::new(InMemoryLruCache::new(16, None));
        let store = PostgresTileStore::new(backend.clone(), cache);

        let first = store.star_tile(0, 0, 0, 0).await.unwrap();
        assert_eq!(first.bytes.as_ref(), b"tile-payload");
        assert_eq!(first.version.as_deref(), Some("v42"));
        assert_eq!(store.miss_count(), 1);
        assert_eq!(store.hit_count(), 0);

        let second = store.star_tile(0, 0, 0, 0).await.unwrap();
        assert_eq!(second.bytes.as_ref(), b"tile-payload");
        assert_eq!(store.hit_count(), 1);
    }

    #[tokio::test]
    async fn returns_not_found_when_backend_missing() {
        let backend = Arc::new(InMemoryTileRowStore::new());
        let cache = Arc::new(InMemoryLruCache::new(16, None));
        let store = PostgresTileStore::new(backend, cache);

        let err = store.galaxy_tile(123).await.unwrap_err();
        assert!(matches!(err, TileError::TileNotFound(_)));
    }

    #[tokio::test]
    async fn rejects_invalid_address_without_hitting_backend() {
        let backend = Arc::new(InMemoryTileRowStore::new());
        let cache = Arc::new(InMemoryLruCache::new(16, None));
        let store = PostgresTileStore::new(backend, cache);

        let err = store.star_tile(9, 0, 0, 0).await.unwrap_err();
        assert!(matches!(err, TileError::InvalidAddress(_)));
        assert_eq!(store.miss_count(), 0);
        assert_eq!(store.hit_count(), 0);
    }

    #[tokio::test]
    async fn serves_manifest() {
        let backend = Arc::new(InMemoryTileRowStore::new());
        backend.insert(
            "manifest",
            row(br#"{"version":"v42","totalTiles":1}"#, "v42"),
        );
        let cache = Arc::new(InMemoryLruCache::new(16, None));
        let store = PostgresTileStore::new(backend, cache);
        let manifest = store.manifest().await.unwrap();
        assert!(manifest.bytes.starts_with(b"{"));
    }

    #[tokio::test]
    async fn cache_ttl_forces_refetch() {
        let backend = Arc::new(InMemoryTileRowStore::new());
        backend.insert("cosmic-web/0", row(b"sector", "v1"));
        let cache = Arc::new(InMemoryLruCache::new(16, Some(Duration::from_millis(10))));
        let store = PostgresTileStore::new(backend, cache);
        store.cosmic_web_tile(0).await.unwrap();
        tokio::time::sleep(Duration::from_millis(20)).await;
        store.cosmic_web_tile(0).await.unwrap();
        // Two misses (ttl expired between calls) — no hits.
        assert_eq!(store.miss_count(), 2);
        assert_eq!(store.hit_count(), 0);
    }
}
