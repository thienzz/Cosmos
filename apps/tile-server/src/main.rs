//! Entry point for the Cosmos Explorer tile server.

use std::sync::Arc;

use cosmos_tile_server::{build_router, AppConfig, FilesystemTileStore};

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
    let app = build_router(config.clone(), store);

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
