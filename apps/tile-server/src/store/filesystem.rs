//! Filesystem-backed TileStore.
//!
//! Reads tiles from a directory layout:
//!
//! ```text
//! <root>/manifest.json
//! <root>/stars/{z}/{x}/{y}/{level}.bin
//! <root>/galaxies/{healpix_idx}.bin
//! <root>/cosmic-web/{sector}.bin
//! ```

use std::path::{Path, PathBuf};

use bytes::Bytes;
use tokio::fs;
use tokio::io::AsyncReadExt;

use crate::error::TileError;

use super::{
    validate_galaxy_address, validate_sector, validate_star_address, TileBytes, TileStore,
};

#[derive(Debug, Clone)]
pub struct FilesystemTileStore {
    root: PathBuf,
    version_override: Option<String>,
}

impl FilesystemTileStore {
    pub fn new(root: impl Into<PathBuf>) -> Self {
        Self {
            root: root.into(),
            version_override: None,
        }
    }

    /// Fixed `X-Tile-Version` stamp returned with every tile. Useful when the
    /// manifest doesn't ship one (e.g. dev fixtures) or tests want a
    /// deterministic value.
    pub fn with_version(mut self, version: impl Into<String>) -> Self {
        self.version_override = Some(version.into());
        self
    }

    fn star_tile_path(&self, z: u32, x: u64, y: u64, level: u32) -> PathBuf {
        self.root
            .join("stars")
            .join(z.to_string())
            .join(x.to_string())
            .join(y.to_string())
            .join(format!("{level}.bin"))
    }

    fn galaxy_tile_path(&self, idx: u32) -> PathBuf {
        self.root.join("galaxies").join(format!("{idx}.bin"))
    }

    fn cosmic_web_path(&self, sector: u32) -> PathBuf {
        self.root.join("cosmic-web").join(format!("{sector}.bin"))
    }

    fn manifest_path(&self) -> PathBuf {
        self.root.join("manifest.json")
    }

    async fn read_file(&self, path: &Path, missing: TileError) -> Result<Bytes, TileError> {
        match fs::File::open(path).await {
            Ok(mut f) => {
                let mut buf = Vec::new();
                f.read_to_end(&mut buf)
                    .await
                    .map_err(|e| TileError::Internal(format!("read {}: {e}", path.display())))?;
                Ok(Bytes::from(buf))
            }
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Err(missing),
            Err(e) => Err(TileError::Internal(format!(
                "open {}: {e}",
                path.display()
            ))),
        }
    }
}

#[axum::async_trait]
impl TileStore for FilesystemTileStore {
    async fn star_tile(&self, z: u32, x: u64, y: u64, level: u32) -> Result<TileBytes, TileError> {
        validate_star_address(z, x, y, level)?;
        let path = self.star_tile_path(z, x, y, level);
        let bytes = self
            .read_file(
                &path,
                TileError::TileNotFound(format!("stars/{z}/{x}/{y}/{level}")),
            )
            .await?;
        Ok(TileBytes {
            bytes,
            version: self.version_override.clone(),
        })
    }

    async fn galaxy_tile(&self, healpix_idx: u32) -> Result<TileBytes, TileError> {
        validate_galaxy_address(healpix_idx)?;
        let path = self.galaxy_tile_path(healpix_idx);
        let bytes = self
            .read_file(
                &path,
                TileError::TileNotFound(format!("galaxies/{healpix_idx}")),
            )
            .await?;
        Ok(TileBytes {
            bytes,
            version: self.version_override.clone(),
        })
    }

    async fn cosmic_web_tile(&self, sector: u32) -> Result<TileBytes, TileError> {
        validate_sector(sector)?;
        let path = self.cosmic_web_path(sector);
        let bytes = self
            .read_file(
                &path,
                TileError::TileNotFound(format!("cosmic-web/{sector}")),
            )
            .await?;
        Ok(TileBytes {
            bytes,
            version: self.version_override.clone(),
        })
    }

    async fn manifest(&self) -> Result<TileBytes, TileError> {
        let path = self.manifest_path();
        let bytes = self
            .read_file(&path, TileError::ManifestUnavailable)
            .await?;
        Ok(TileBytes {
            bytes,
            version: self.version_override.clone(),
        })
    }
}
