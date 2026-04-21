//! Cosmos Explorer — Rust tile server (Doc 25 §7, Doc 26 §7).
//!
//! Serves pre-computed binary tiles (star octree, galaxy HEALPix, cosmic-web
//! sectors) plus the JSON tile manifest. Tile bytes come from a pluggable
//! `TileStore` — the in-tree impl reads from a filesystem root, which is what
//! the Airflow ETL (T-ETL) will write to. A Postgres/object-storage backend
//! can be layered on later without touching handlers.

pub mod config;
pub mod encoding;
pub mod error;
pub mod handlers;
pub mod healpix;
pub mod router;
pub mod store;

pub use config::AppConfig;
pub use error::TileError;
pub use router::{build_router, AppState};
pub use store::{
    FilesystemTileStore, InMemoryLruCache, PostgresTileStore, TileBytes, TileHotCache, TileRow,
    TileRowStore, TileStore,
};
