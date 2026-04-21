//! Axum router construction. Shared between the `main` binary and the
//! integration test binary — keep it side-effect free (no socket binds).

use std::sync::Arc;

use axum::routing::get;
use axum::Router;
use tower_http::compression::CompressionLayer;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

use crate::cache::LayeredTileCache;
use crate::config::AppConfig;
use crate::handlers;
use crate::routes::{self, SharedHealpixStarStore};
use crate::store::SharedTileStore;

pub struct AppState {
    pub config: AppConfig,
    pub store: SharedTileStore,
    /// HEALPix-addressed star tile store (Gaia DR3 pipeline, T-E-04).
    /// Legacy octree route continues to use `store`.
    pub healpix_stars: Option<SharedHealpixStarStore>,
    /// Optional three-tier cache in front of `healpix_stars`. Kept as
    /// `Option` so tests can opt out; main.rs wires one by default.
    pub healpix_star_cache: Option<Arc<LayeredTileCache>>,
}

impl std::fmt::Debug for AppState {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("AppState")
            .field("config", &self.config)
            .field("store", &"<dyn TileStore>")
            .finish()
    }
}

pub fn build_router(config: AppConfig, store: SharedTileStore) -> Router {
    build_router_with_healpix(config, store, None, None)
}

/// Variant that accepts the HEALPix store + cache. `main.rs` uses this;
/// legacy callers keep the 2-arg constructor.
pub fn build_router_with_healpix(
    config: AppConfig,
    store: SharedTileStore,
    healpix_stars: Option<SharedHealpixStarStore>,
    healpix_star_cache: Option<Arc<LayeredTileCache>>,
) -> Router {
    let state = Arc::new(AppState {
        config,
        store,
        healpix_stars,
        healpix_star_cache,
    });

    // Doc 26 §7: tile responses are brotli-encoded. CompressionLayer picks up
    // `Accept-Encoding: br` / `gzip` transparently; identity passes through.
    let compression = CompressionLayer::new().br(true);

    // Tile server is public-read; auth and narrower CORS live at the API
    // gateway. Permissive here until we gate on API keys.
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any)
        .expose_headers(Any);

    Router::new()
        .route("/v1/tiles/manifest", get(handlers::manifest))
        .route(
            "/v1/tiles/stars/:z/:x/:y/:level",
            get(handlers::star_tile),
        )
        .route(
            "/v1/tiles/stars/healpix/:order/:pixel",
            get(routes::healpix_star_tile),
        )
        .route("/v1/tiles/galaxies/:healpix_idx", get(handlers::galaxy_tile))
        .route("/v1/tiles/cosmic-web/:sector", get(handlers::cosmic_web_tile))
        .route("/health", get(handlers::health))
        .with_state(state)
        .layer(compression)
        .layer(cors)
        .layer(TraceLayer::new_for_http())
}
