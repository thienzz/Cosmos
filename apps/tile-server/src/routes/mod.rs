//! HTTP route handlers that sit alongside the legacy handlers in
//! `crate::handlers`. New endpoints land here so the module tree mirrors
//! the URL space once the server has accumulated several sub-trees.

pub mod star_tiles;

pub use star_tiles::{
    healpix_star_tile, FilesystemHealpixStarStore, HealpixStarTileStore, SharedHealpixStarStore,
};
