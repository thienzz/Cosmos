//! Tile storage abstraction.
//!
//! Handlers depend on the `TileStore` trait, not a concrete backend. Two
//! impls ship:
//!
//!   - [`FilesystemTileStore`] — reads tiles from a directory tree. What the
//!     Airflow ETL writes into `data/tiles` locally, and what object-storage
//!     will sync into CDN-adjacent volumes in dev. Simple, no external deps.
//!
//!   - [`PostgresTileStore`] (T40, Doc 25 §7.1) — reads tiles out of the
//!     relational store, with an LRU hot-cache in front to absorb the high
//!     read concurrency the Rust server sees. The hot-cache layer is the
//!     Redis slot per Doc 25 §7.1 but swaps for an in-process LRU in tests
//!     and offline dev; the same interface works either way.
//!
//! Address validation is enforced per Doc 26 §7.1–§7.3:
//!   - Stars: z ∈ [0, 8], x,y ∈ [0, 8^z), level ∈ [0, 3]
//!   - Galaxies: healpix_idx ∈ [0, 786_432)
//!   - Cosmic web: sector ∈ [0, 64)

use std::sync::Arc;

use bytes::Bytes;

use crate::error::TileError;

pub mod cache;
pub mod filesystem;
pub mod postgres;

pub use cache::{InMemoryLruCache, TileHotCache};
pub use filesystem::FilesystemTileStore;
pub use postgres::{PostgresTileStore, TileRow, TileRowStore};

/// Address-space bounds (Doc 26 §7.1).
pub const STAR_MAX_Z: u32 = 8;
pub const STAR_MAX_LEVEL: u32 = 3;
pub const GALAXY_HEALPIX_COUNT: u32 = 786_432; // Nside=256
pub const COSMIC_WEB_SECTOR_COUNT: u32 = 64; // 4×4×4

/// Loaded tile — bytes + an optional version stamp (usually comes from the
/// companion manifest so callers emit `X-Tile-Version`).
#[derive(Debug, Clone)]
pub struct TileBytes {
    pub bytes: Bytes,
    pub version: Option<String>,
}

#[axum::async_trait]
pub trait TileStore: Send + Sync + 'static {
    async fn star_tile(&self, z: u32, x: u64, y: u64, level: u32) -> Result<TileBytes, TileError>;
    async fn galaxy_tile(&self, healpix_idx: u32) -> Result<TileBytes, TileError>;
    async fn cosmic_web_tile(&self, sector: u32) -> Result<TileBytes, TileError>;
    async fn manifest(&self) -> Result<TileBytes, TileError>;
}

pub type SharedTileStore = Arc<dyn TileStore>;

// ---------------------------------------------------------------------------
// Address validation
// ---------------------------------------------------------------------------

pub fn validate_star_address(z: u32, x: u64, y: u64, level: u32) -> Result<(), TileError> {
    if z > STAR_MAX_Z {
        return Err(TileError::InvalidAddress(format!(
            "z={z} exceeds max depth {STAR_MAX_Z}"
        )));
    }
    if level > STAR_MAX_LEVEL {
        return Err(TileError::InvalidAddress(format!(
            "level={level} exceeds max LOD {STAR_MAX_LEVEL}"
        )));
    }
    // Doc 26 §7.1: x,y ∈ [0, 8^z). Computed in u64 to avoid overflow at z=8.
    let max_xy = 8u64.pow(z);
    if x >= max_xy || y >= max_xy {
        return Err(TileError::InvalidAddress(format!(
            "x={x}, y={y} exceed bound {max_xy} at z={z}"
        )));
    }
    Ok(())
}

pub fn validate_galaxy_address(healpix_idx: u32) -> Result<(), TileError> {
    if healpix_idx >= GALAXY_HEALPIX_COUNT {
        return Err(TileError::InvalidAddress(format!(
            "healpix_idx={healpix_idx} must be < {GALAXY_HEALPIX_COUNT}"
        )));
    }
    Ok(())
}

pub fn validate_sector(sector: u32) -> Result<(), TileError> {
    if sector >= COSMIC_WEB_SECTOR_COUNT {
        return Err(TileError::InvalidAddress(format!(
            "sector={sector} must be < {COSMIC_WEB_SECTOR_COUNT}"
        )));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn star_address_accepts_boundaries() {
        validate_star_address(0, 0, 0, 0).unwrap();
        validate_star_address(8, 8u64.pow(8) - 1, 8u64.pow(8) - 1, 3).unwrap();
    }

    #[test]
    fn star_address_rejects_out_of_range() {
        assert!(validate_star_address(9, 0, 0, 0).is_err());
        assert!(validate_star_address(3, 8u64.pow(3), 0, 0).is_err());
        assert!(validate_star_address(3, 0, 8u64.pow(3), 0).is_err());
        assert!(validate_star_address(3, 0, 0, 4).is_err());
    }

    #[test]
    fn galaxy_address_bounds() {
        validate_galaxy_address(0).unwrap();
        validate_galaxy_address(GALAXY_HEALPIX_COUNT - 1).unwrap();
        assert!(validate_galaxy_address(GALAXY_HEALPIX_COUNT).is_err());
    }

    #[test]
    fn sector_bounds() {
        validate_sector(0).unwrap();
        validate_sector(COSMIC_WEB_SECTOR_COUNT - 1).unwrap();
        assert!(validate_sector(COSMIC_WEB_SECTOR_COUNT).is_err());
    }
}
