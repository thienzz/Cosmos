//! Axum router construction. Shared between the `main` binary and the
//! integration test binary — keep it side-effect free (no socket binds).

use std::sync::Arc;

use axum::routing::get;
use axum::Router;
use tower_http::compression::CompressionLayer;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

use crate::config::AppConfig;
use crate::handlers;
use crate::store::SharedTileStore;

pub struct AppState {
    pub config: AppConfig,
    pub store: SharedTileStore,
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
    let state = Arc::new(AppState { config, store });

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
        .route("/v1/tiles/galaxies/:healpix_idx", get(handlers::galaxy_tile))
        .route("/v1/tiles/cosmic-web/:sector", get(handlers::cosmic_web_tile))
        .route("/health", get(handlers::health))
        .with_state(state)
        .layer(compression)
        .layer(cors)
        .layer(TraceLayer::new_for_http())
}
