//! Runtime configuration — environment-driven (12-factor).
//!
//! - `TILE_SERVER_PORT`: bind port (default `3001`).
//! - `TILE_SERVER_BIND`: bind address host (default `0.0.0.0`).
//! - `COSMOS_TILE_ROOT`: filesystem root containing `stars/`, `galaxies/`,
//!   `cosmic-web/` subdirs and `manifest.json`. Required when using the
//!   filesystem store (default `./data/tiles`).
//! - `COSMOS_DATA_VERSION`: fallback `X-Data-Version` header value when the
//!   manifest doesn't declare one (default `dev`).

use std::net::{IpAddr, SocketAddr};
use std::path::PathBuf;
use std::str::FromStr;

#[derive(Debug, Clone)]
pub struct AppConfig {
    pub bind_addr: SocketAddr,
    pub tile_root: PathBuf,
    pub data_version: String,
}

impl AppConfig {
    pub fn from_env() -> Self {
        let port: u16 = std::env::var("TILE_SERVER_PORT")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(3001);
        let host: IpAddr = std::env::var("TILE_SERVER_BIND")
            .ok()
            .and_then(|v| IpAddr::from_str(&v).ok())
            .unwrap_or(IpAddr::from([0, 0, 0, 0]));
        let tile_root = std::env::var("COSMOS_TILE_ROOT")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from("./data/tiles"));
        let data_version =
            std::env::var("COSMOS_DATA_VERSION").unwrap_or_else(|_| "dev".to_string());
        Self {
            bind_addr: SocketAddr::new(host, port),
            tile_root,
            data_version,
        }
    }
}
