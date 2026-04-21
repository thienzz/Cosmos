//! Entry point for the Cosmos Explorer tile server.

use std::sync::Arc;

use cosmos_tile_server::{
    build_router_with_healpix, AppConfig, FilesystemHealpixStarStore, FilesystemTileStore,
    InMemoryLruCache, LayeredTileCache, RedisTileCache,
};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let filter = tracing_subscriber::EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info"));
    tracing_subscriber::fmt()
        .with_env_filter(filter)
        .json()
        .init();

    let config = AppConfig::from_env();
    tracing::info!(
        bind = %config.bind_addr,
        tile_root = %config.tile_root.display(),
        data_version = %config.data_version,
        "starting cosmos tile server"
    );

    let store = Arc::new(
        FilesystemTileStore::new(config.tile_root.clone())
            .with_version(config.data_version.clone()),
    );
    let healpix_store = Arc::new(
        FilesystemHealpixStarStore::new(config.tile_root.clone())
            .with_version(config.data_version.clone()),
    );

    // L1: always on. L2: Redis if `REDIS_URL` is set and the connection
    // succeeds. On failure we log and fall through to L1-only so dev boxes
    // without Redis still serve tiles.
    let l1 = Arc::new(InMemoryLruCache::new(
        std::env::var("TILE_L1_CAPACITY")
            .ok()
            .and_then(|s| s.parse().ok())
            .unwrap_or(1024),
        None,
    ));
    let cache = match std::env::var("REDIS_URL") {
        Ok(url) => match RedisTileCache::connect(&url).await {
            Ok(redis) => {
                tracing::info!(%url, "redis L2 cache connected");
                LayeredTileCache::with_l2(l1, Arc::new(redis))
            }
            Err(err) => {
                tracing::warn!(error = %err, "redis L2 unavailable — L1-only");
                LayeredTileCache::new(l1)
            }
        },
        Err(_) => LayeredTileCache::new(l1),
    };

    let app = build_router_with_healpix(
        config.clone(),
        store,
        Some(healpix_store),
        Some(Arc::new(cache)),
    );

    let listener = tokio::net::TcpListener::bind(config.bind_addr).await?;
    tracing::info!(addr = %listener.local_addr()?, "tile-server listening");

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;
    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        let _ = tokio::signal::ctrl_c().await;
    };
    #[cfg(unix)]
    let terminate = async {
        if let Ok(mut sig) = tokio::signal::unix::signal(
            tokio::signal::unix::SignalKind::terminate(),
        ) {
            sig.recv().await;
        }
    };
    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => { tracing::info!("ctrl-c received — shutting down"); }
        _ = terminate => { tracing::info!("SIGTERM received — shutting down"); }
    }
}
