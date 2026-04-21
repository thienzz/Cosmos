//! Three-tier tile cache (T-E-03, Doc 25 §7.1).
//!
//! ```text
//!            get(key)
//!              │
//!              ▼
//!        ┌───────────┐  miss   ┌───────────┐  miss   ┌─────────────┐
//!        │ L1: LRU   │ ──────► │ L2: Redis │ ──────► │ F (compute) │
//!        └───────────┘         └───────────┘         └─────────────┘
//!              │ hit ◄─────── populate both on miss ─────┘
//!              ▼
//!           TileBytes
//! ```
//!
//! L1 is always present (in-process, zero-infra, <1 ms warm reads); L2 is
//! optional — if you construct the cache without it, this module becomes
//! a single-tier wrapper that still offers `get_or_compute`. The Redis
//! backend is what production ships per Doc 25 §7.1, but our integration
//! tests deliberately use two stacked `InMemoryLruCache` instances so the
//! three-tier orchestration is exercised without a live Redis.

use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::Duration;

use bytes::Bytes;
use redis::aio::ConnectionManager;
use redis::AsyncCommands;

use crate::error::TileError;
use crate::store::{TileBytes, TileHotCache};

const DEFAULT_REDIS_TTL_SECONDS: u64 = 86_400; // Doc 25 §7.1 — 24h.
const DEFAULT_REDIS_KEY_PREFIX: &str = "cosmos:tile:";

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

/// Counters for a [`LayeredTileCache`] — cheap atomics so handlers can read
/// them on every request without contention. Cloneable so the router can
/// keep a handle for `/metrics` once the Prometheus endpoint lands.
#[derive(Default, Debug)]
pub struct CacheMetrics {
    pub l1_hits: AtomicU64,
    pub l2_hits: AtomicU64,
    pub misses: AtomicU64,
    pub l2_errors: AtomicU64,
}

impl CacheMetrics {
    pub fn snapshot(&self) -> CacheMetricsSnapshot {
        CacheMetricsSnapshot {
            l1_hits: self.l1_hits.load(Ordering::Relaxed),
            l2_hits: self.l2_hits.load(Ordering::Relaxed),
            misses: self.misses.load(Ordering::Relaxed),
            l2_errors: self.l2_errors.load(Ordering::Relaxed),
        }
    }
}

#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct CacheMetricsSnapshot {
    pub l1_hits: u64,
    pub l2_hits: u64,
    pub misses: u64,
    pub l2_errors: u64,
}

// ---------------------------------------------------------------------------
// LayeredTileCache
// ---------------------------------------------------------------------------

#[derive(Clone)]
pub struct LayeredTileCache {
    l1: Arc<dyn TileHotCache>,
    l2: Option<Arc<dyn TileHotCache>>,
    metrics: Arc<CacheMetrics>,
}

impl LayeredTileCache {
    /// L1-only cache — production flag `TILE_CACHE_L2=none`, or local dev
    /// without Redis attached.
    pub fn new(l1: Arc<dyn TileHotCache>) -> Self {
        Self {
            l1,
            l2: None,
            metrics: Arc::new(CacheMetrics::default()),
        }
    }

    pub fn with_l2(l1: Arc<dyn TileHotCache>, l2: Arc<dyn TileHotCache>) -> Self {
        Self {
            l1,
            l2: Some(l2),
            metrics: Arc::new(CacheMetrics::default()),
        }
    }

    pub fn metrics(&self) -> Arc<CacheMetrics> {
        Arc::clone(&self.metrics)
    }

    /// Probe both tiers and return the cached value or `None`. Populates
    /// L1 on an L2 hit so the next read is warm.
    pub async fn get(&self, key: &str) -> Option<TileBytes> {
        if let Some(v) = self.l1.get(key).await {
            self.metrics.l1_hits.fetch_add(1, Ordering::Relaxed);
            return Some(v);
        }
        if let Some(l2) = &self.l2 {
            if let Some(v) = l2.get(key).await {
                self.metrics.l2_hits.fetch_add(1, Ordering::Relaxed);
                self.l1.put(key, v.clone()).await;
                return Some(v);
            }
        }
        self.metrics.misses.fetch_add(1, Ordering::Relaxed);
        None
    }

    /// Store `value` in every tier. Infallible — individual tier failures
    /// (e.g. Redis down) only update the `l2_errors` counter and log.
    pub async fn put(&self, key: &str, value: TileBytes) {
        self.l1.put(key, value.clone()).await;
        if let Some(l2) = &self.l2 {
            l2.put(key, value).await;
        }
    }

    /// Read-through with on-miss compute. `compute` is only invoked when
    /// both tiers miss; its result is populated into every tier.
    pub async fn get_or_compute<F, Fut>(
        &self,
        key: &str,
        compute: F,
    ) -> Result<TileBytes, TileError>
    where
        F: FnOnce() -> Fut,
        Fut: std::future::Future<Output = Result<TileBytes, TileError>>,
    {
        if let Some(v) = self.get(key).await {
            return Ok(v);
        }
        let computed = compute().await?;
        self.put(key, computed.clone()).await;
        Ok(computed)
    }
}

impl std::fmt::Debug for LayeredTileCache {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("LayeredTileCache")
            .field("l2_enabled", &self.l2.is_some())
            .field("metrics", &self.metrics.snapshot())
            .finish()
    }
}

// ---------------------------------------------------------------------------
// Redis-backed L2
// ---------------------------------------------------------------------------

/// Redis-backed tile cache — Doc 25 §7.1 production L2.
///
/// Keys are namespaced under `cosmos:tile:` so this Redis instance can be
/// shared with other services. Values are stored as opaque bytes with a
/// 24-hour TTL by default. The optional `X-Tile-Version` stamp is stored
/// alongside at key `cosmos:tile:<k>:v` so range-level cache invalidation
/// (e.g. bumping the tile epoch) can be scripted.
#[derive(Clone)]
pub struct RedisTileCache {
    manager: ConnectionManager,
    key_prefix: String,
    ttl_seconds: u64,
}

impl RedisTileCache {
    /// Connect to Redis at `url`. Uses a `ConnectionManager` so the client
    /// auto-reconnects on transient failures (TLS resets, server restarts).
    pub async fn connect(url: &str) -> Result<Self, redis::RedisError> {
        let client = redis::Client::open(url)?;
        let manager = ConnectionManager::new(client).await?;
        Ok(Self {
            manager,
            key_prefix: DEFAULT_REDIS_KEY_PREFIX.to_string(),
            ttl_seconds: DEFAULT_REDIS_TTL_SECONDS,
        })
    }

    pub fn with_ttl(mut self, ttl: Duration) -> Self {
        self.ttl_seconds = ttl.as_secs();
        self
    }

    pub fn with_key_prefix(mut self, prefix: impl Into<String>) -> Self {
        self.key_prefix = prefix.into();
        self
    }

    fn bytes_key(&self, key: &str) -> String {
        format!("{}{}", self.key_prefix, key)
    }
    fn version_key(&self, key: &str) -> String {
        format!("{}{}:v", self.key_prefix, key)
    }
}

#[axum::async_trait]
impl TileHotCache for RedisTileCache {
    async fn get(&self, key: &str) -> Option<TileBytes> {
        let mut conn = self.manager.clone();
        let bytes_key = self.bytes_key(key);
        let bytes: Option<Vec<u8>> = match conn.get(&bytes_key).await {
            Ok(b) => b,
            Err(err) => {
                tracing::warn!(error = %err, key, "redis GET failed");
                return None;
            }
        };
        let bytes = bytes?;
        let version: Option<String> = conn.get(self.version_key(key)).await.ok().flatten();
        Some(TileBytes {
            bytes: Bytes::from(bytes),
            version,
        })
    }

    async fn put(&self, key: &str, value: TileBytes) {
        let mut conn = self.manager.clone();
        let payload = value.bytes.to_vec();
        if let Err(err) = conn
            .set_ex::<_, _, ()>(self.bytes_key(key), payload, self.ttl_seconds)
            .await
        {
            tracing::warn!(error = %err, key, "redis SET failed");
            return;
        }
        if let Some(version) = value.version.as_deref() {
            if let Err(err) = conn
                .set_ex::<_, _, ()>(self.version_key(key), version, self.ttl_seconds)
                .await
            {
                tracing::warn!(error = %err, key, "redis SET (version) failed");
            }
        }
    }

    async fn len(&self) -> usize {
        // Counting `cosmos:tile:*` keys would require `SCAN`; it's not
        // meaningful for a single-tier diagnostic. Return 0 so
        // `/metrics` doesn't block on a Redis RTT.
        0
    }
}

// ---------------------------------------------------------------------------
// Tests — drive the orchestrator with stacked LRUs (no live Redis required).
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use crate::store::InMemoryLruCache;
    use std::sync::atomic::{AtomicUsize, Ordering};
    use std::time::Instant;

    fn tb(payload: &[u8]) -> TileBytes {
        TileBytes {
            bytes: Bytes::copy_from_slice(payload),
            version: Some("v1".to_string()),
        }
    }

    fn new_cache() -> LayeredTileCache {
        let l1 = Arc::new(InMemoryLruCache::new(64, None));
        let l2 = Arc::new(InMemoryLruCache::new(1024, None));
        LayeredTileCache::with_l2(l1, l2)
    }

    #[tokio::test]
    async fn miss_invokes_compute_and_populates_both_tiers() {
        let cache = new_cache();
        let calls = AtomicUsize::new(0);

        let got = cache
            .get_or_compute("stars/0/0/0/0", || async {
                calls.fetch_add(1, Ordering::SeqCst);
                Ok(tb(b"payload"))
            })
            .await
            .unwrap();
        assert_eq!(got.bytes.as_ref(), b"payload");
        assert_eq!(calls.load(Ordering::SeqCst), 1);

        let snap = cache.metrics.snapshot();
        assert_eq!(snap.misses, 1);
        assert_eq!(snap.l1_hits, 0);
        assert_eq!(snap.l2_hits, 0);
    }

    #[tokio::test]
    async fn second_read_hits_l1_and_skips_compute() {
        let cache = new_cache();
        let calls = AtomicUsize::new(0);

        for _ in 0..3 {
            cache
                .get_or_compute("key", || async {
                    calls.fetch_add(1, Ordering::SeqCst);
                    Ok(tb(b"hello"))
                })
                .await
                .unwrap();
        }
        assert_eq!(calls.load(Ordering::SeqCst), 1);
        let snap = cache.metrics.snapshot();
        assert_eq!(snap.misses, 1);
        assert_eq!(snap.l1_hits, 2);
    }

    #[tokio::test]
    async fn l2_hit_rehydrates_l1() {
        let l1 = Arc::new(InMemoryLruCache::new(64, None));
        let l2 = Arc::new(InMemoryLruCache::new(1024, None));
        // Pre-populate only L2 — then look it up via the layered cache.
        l2.put("warm", tb(b"l2-only")).await;
        let cache = LayeredTileCache::with_l2(l1.clone(), l2);

        let first = cache.get("warm").await.expect("L2 should supply");
        assert_eq!(first.bytes.as_ref(), b"l2-only");
        let snap1 = cache.metrics.snapshot();
        assert_eq!(snap1.l2_hits, 1);
        assert_eq!(snap1.l1_hits, 0);

        // Second read should now be an L1 hit — no L2 round-trip.
        let second = cache.get("warm").await.unwrap();
        assert_eq!(second.bytes.as_ref(), b"l2-only");
        let snap2 = cache.metrics.snapshot();
        assert_eq!(snap2.l1_hits, 1);
        assert_eq!(snap2.l2_hits, 1, "L2 hits shouldn't increment further");
    }

    #[tokio::test]
    async fn warm_hit_is_fast() {
        // Not a microbenchmark — smoke check that an L1 hit completes well
        // under the 10 ms tile SLO on all reasonable hardware.
        let cache = new_cache();
        cache.put("k", tb(&vec![0u8; 16 * 1024])).await; // 16 KB payload.
        // Prime.
        let _ = cache.get("k").await.unwrap();
        let start = Instant::now();
        for _ in 0..1_000 {
            let _ = cache.get("k").await.unwrap();
        }
        let elapsed = start.elapsed();
        let per_call = elapsed / 1_000;
        assert!(
            per_call < Duration::from_millis(1),
            "L1 read took {per_call:?} per call; expected < 1 ms",
        );
    }

    #[tokio::test]
    async fn compute_errors_do_not_populate_cache() {
        let cache = new_cache();
        let calls = AtomicUsize::new(0);

        let err = cache
            .get_or_compute("bad", || {
                let count = calls.fetch_add(1, Ordering::SeqCst);
                async move {
                    if count < 2 {
                        Err(TileError::Internal("boom".into()))
                    } else {
                        Ok(tb(b"ok"))
                    }
                }
            })
            .await;
        assert!(err.is_err());
        let err2 = cache
            .get_or_compute("bad", || {
                let count = calls.fetch_add(1, Ordering::SeqCst);
                async move {
                    if count < 2 {
                        Err(TileError::Internal("boom".into()))
                    } else {
                        Ok(tb(b"ok"))
                    }
                }
            })
            .await;
        assert!(err2.is_err());

        let ok = cache
            .get_or_compute("bad", || {
                let count = calls.fetch_add(1, Ordering::SeqCst);
                async move {
                    if count < 2 {
                        Err(TileError::Internal("boom".into()))
                    } else {
                        Ok(tb(b"ok"))
                    }
                }
            })
            .await
            .unwrap();
        assert_eq!(ok.bytes.as_ref(), b"ok");

        // First two calls must actually have executed compute — no stale
        // cache entry from the error path.
        assert_eq!(calls.load(Ordering::SeqCst), 3);
    }

    #[tokio::test]
    async fn put_writes_to_every_tier() {
        let l1 = Arc::new(InMemoryLruCache::new(4, None));
        let l2 = Arc::new(InMemoryLruCache::new(4, None));
        let cache = LayeredTileCache::with_l2(l1.clone(), l2.clone());
        cache.put("xyz", tb(b"everywhere")).await;
        assert!(l1.get("xyz").await.is_some());
        assert!(l2.get("xyz").await.is_some());
    }

    #[tokio::test]
    async fn single_tier_cache_still_memoises() {
        let l1 = Arc::new(InMemoryLruCache::new(4, None));
        let cache = LayeredTileCache::new(l1);
        let calls = AtomicUsize::new(0);

        for _ in 0..5 {
            cache
                .get_or_compute("single", || async {
                    calls.fetch_add(1, Ordering::SeqCst);
                    Ok(tb(b"single-tier"))
                })
                .await
                .unwrap();
        }
        assert_eq!(calls.load(Ordering::SeqCst), 1);
    }
}
