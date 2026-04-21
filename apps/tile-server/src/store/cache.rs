//! Hot-cache layer in front of a slow backend (Postgres, object storage).
//!
//! Doc 25 §7.1 specifies Redis for the production hot-cache. We express the
//! cache as a trait so we can:
//!   - ship an in-process LRU impl today (zero infrastructure),
//!   - drop in a Redis client later (`redis` crate) without touching the
//!     `PostgresTileStore`,
//!   - keep tests deterministic (no external service in the loop).

use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{Duration, Instant};

use bytes::Bytes;

use super::TileBytes;

/// Simple trait — `get` returns the cached value if present, `put` stores it.
/// Expiry is driven by the underlying impl (LRU, TTL, etc.).
#[axum::async_trait]
pub trait TileHotCache: Send + Sync + 'static {
    async fn get(&self, key: &str) -> Option<TileBytes>;
    async fn put(&self, key: &str, value: TileBytes);
    /// Diagnostic — live entry count. Stays cheap; exact count not required.
    async fn len(&self) -> usize;
}

// ---------------------------------------------------------------------------
// In-process LRU — the default + the test double
// ---------------------------------------------------------------------------

struct Entry {
    bytes: Bytes,
    version: Option<String>,
    inserted_at: Instant,
    last_access: Instant,
}

/// Bounded LRU cache with optional TTL. Not production-grade (single-lock;
/// O(n) eviction), but correct and dependency-free — fine for dev + tests
/// and serves as the reference behaviour the Redis impl mirrors.
pub struct InMemoryLruCache {
    capacity: usize,
    ttl: Option<Duration>,
    inner: Mutex<HashMap<String, Entry>>,
}

impl InMemoryLruCache {
    pub fn new(capacity: usize, ttl: Option<Duration>) -> Self {
        Self {
            capacity,
            ttl,
            inner: Mutex::new(HashMap::with_capacity(capacity.min(1024))),
        }
    }
}

#[axum::async_trait]
impl TileHotCache for InMemoryLruCache {
    async fn get(&self, key: &str) -> Option<TileBytes> {
        let mut guard = self.inner.lock().ok()?;
        if let Some(ttl) = self.ttl {
            if let Some(entry) = guard.get(key) {
                if entry.inserted_at.elapsed() > ttl {
                    guard.remove(key);
                    return None;
                }
            }
        }
        let entry = guard.get_mut(key)?;
        entry.last_access = Instant::now();
        Some(TileBytes {
            bytes: entry.bytes.clone(),
            version: entry.version.clone(),
        })
    }

    async fn put(&self, key: &str, value: TileBytes) {
        let Ok(mut guard) = self.inner.lock() else {
            return;
        };
        if guard.len() >= self.capacity {
            // Evict least-recently-accessed. Cheap because capacity is small
            // and we're single-lock anyway.
            let oldest = guard
                .iter()
                .min_by_key(|(_, e)| e.last_access)
                .map(|(k, _)| k.clone());
            if let Some(k) = oldest {
                guard.remove(&k);
            }
        }
        let now = Instant::now();
        guard.insert(
            key.to_string(),
            Entry {
                bytes: value.bytes,
                version: value.version,
                inserted_at: now,
                last_access: now,
            },
        );
    }

    async fn len(&self) -> usize {
        self.inner.lock().map(|g| g.len()).unwrap_or(0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tb(payload: &[u8]) -> TileBytes {
        TileBytes {
            bytes: Bytes::copy_from_slice(payload),
            version: Some("v1".to_string()),
        }
    }

    #[tokio::test]
    async fn hit_and_miss() {
        let cache = InMemoryLruCache::new(2, None);
        assert!(cache.get("stars/0/0/0/0").await.is_none());
        cache.put("stars/0/0/0/0", tb(b"hello")).await;
        let hit = cache.get("stars/0/0/0/0").await.unwrap();
        assert_eq!(hit.bytes.as_ref(), b"hello");
        assert_eq!(hit.version.as_deref(), Some("v1"));
    }

    #[tokio::test]
    async fn evicts_least_recently_used() {
        let cache = InMemoryLruCache::new(2, None);
        cache.put("a", tb(b"a")).await;
        cache.put("b", tb(b"b")).await;
        // Touch "a" so it becomes the newest.
        let _ = cache.get("a").await;
        cache.put("c", tb(b"c")).await;
        // "b" was least recently accessed → evicted.
        assert!(cache.get("b").await.is_none());
        assert!(cache.get("a").await.is_some());
        assert!(cache.get("c").await.is_some());
        assert_eq!(cache.len().await, 2);
    }

    #[tokio::test]
    async fn respects_ttl() {
        let cache = InMemoryLruCache::new(4, Some(Duration::from_millis(15)));
        cache.put("k", tb(b"payload")).await;
        assert!(cache.get("k").await.is_some());
        tokio::time::sleep(Duration::from_millis(25)).await;
        assert!(cache.get("k").await.is_none());
    }
}
