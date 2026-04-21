//! Binary tile encoders (T-E-02, Doc 11 §4, Doc 26 §7).
//!
//! Byte-exact counterparts to the TypeScript encoders in
//! `packages/tile-decoder`. Every field is little-endian; records are
//! packed without intervening padding except where the spec calls for
//! explicit reserved bytes (bytes 12..15 of the star record, bytes
//! 20..23 of the galaxy record).
//!
//! The encoders take plain Rust structs and return [`Bytes`] so callers
//! can hand the payload straight to `axum::body::Body::from(...)`. Each
//! module re-exports tiny decode helpers used by the Rust-side tests;
//! the canonical decoder for the browser lives in
//! `packages/tile-decoder` and the e2e round-trip test in T-E-05
//! exercises encode (Rust) → decode (TS) across the process boundary.

use bytes::{BufMut, Bytes, BytesMut};
use half::f16;
use thiserror::Error;

// -------------------------------------------------------------------------
// Format constants (Doc 11 §4)
// -------------------------------------------------------------------------

pub const STAR_TILE_HEADER_BYTES: usize = 16;
pub const STAR_TILE_RECORD_BYTES: usize = 16;

pub const GALAXY_TILE_HEADER_BYTES: usize = 16;
pub const GALAXY_TILE_RECORD_BYTES: usize = 24;

pub const COSMIC_WEB_HEADER_BYTES: usize = 20;
pub const COSMIC_WEB_VERTEX_BYTES: usize = 16;

// Doc 11 §4.1 spectral-type enum.
pub const SPECTRAL_TYPE_O: u8 = 0;
pub const SPECTRAL_TYPE_B: u8 = 1;
pub const SPECTRAL_TYPE_A: u8 = 2;
pub const SPECTRAL_TYPE_F: u8 = 3;
pub const SPECTRAL_TYPE_G: u8 = 4;
pub const SPECTRAL_TYPE_K: u8 = 5;
pub const SPECTRAL_TYPE_M: u8 = 6;
pub const SPECTRAL_TYPE_UNKNOWN: u8 = 7;

// Doc 11 §4.3 index-width flag (bit 0 of the cosmic-web header flags).
pub const COSMIC_WEB_FLAG_U32_INDICES: u16 = 0x0001;

#[derive(Debug, Error)]
pub enum EncodingError {
    #[error("record count {0} exceeds u32::MAX")]
    RecordCountOverflow(usize),
}

// -------------------------------------------------------------------------
// Star tile (Doc 11 §4.1)
// -------------------------------------------------------------------------

/// One star record as it lives on disk. Coordinates are in parsecs,
/// relative to the tile centre, and are quantised to f16 on the wire.
/// `magnitude`, `color_index`, `spectral_type`, `flags`, and
/// `catalog_index` are already in their on-the-wire form — use
/// [`pack_magnitude`] / [`pack_color_index`] to derive the first two
/// from real astronomical values.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct StarRecord {
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub magnitude: u8,
    pub color_index: u8,
    pub spectral_type: u8,
    pub flags: u8,
    pub catalog_index: u16,
}

#[derive(Debug, Clone)]
pub struct StarTile {
    pub tile_id: u32,
    pub min_distance: f32,
    pub max_distance: f32,
    pub stars: Vec<StarRecord>,
}

pub fn encode_star_tile(tile: &StarTile) -> Result<Bytes, EncodingError> {
    let count = u32::try_from(tile.stars.len())
        .map_err(|_| EncodingError::RecordCountOverflow(tile.stars.len()))?;
    let total = STAR_TILE_HEADER_BYTES + tile.stars.len() * STAR_TILE_RECORD_BYTES;
    let mut out = BytesMut::with_capacity(total);

    // Header (16 B)
    out.put_u32_le(tile.tile_id);
    out.put_u32_le(count);
    out.put_f32_le(tile.min_distance);
    out.put_f32_le(tile.max_distance);

    // Records (16 B each)
    for s in &tile.stars {
        out.put_u16_le(f16::from_f32(s.x).to_bits());
        out.put_u16_le(f16::from_f32(s.y).to_bits());
        out.put_u16_le(f16::from_f32(s.z).to_bits());
        out.put_u8(s.magnitude);
        out.put_u8(s.color_index);
        out.put_u8(s.spectral_type);
        out.put_u8(s.flags);
        out.put_u16_le(s.catalog_index);
        out.put_u32_le(0); // 4 B reserved (§4.1 packing)
    }

    debug_assert_eq!(out.len(), total);
    Ok(out.freeze())
}

/// Decode helper used by Rust tests; the browser decoder is authoritative
/// (`packages/tile-decoder/src/starTile.ts`) and round-trips against this
/// in T-E-05.
pub fn decode_star_tile(buf: &[u8]) -> Option<(StarTileHeader, Vec<StarRecord>)> {
    if buf.len() < STAR_TILE_HEADER_BYTES {
        return None;
    }
    let header = StarTileHeader {
        tile_id: read_u32_le(buf, 0)?,
        star_count: read_u32_le(buf, 4)?,
        min_distance: read_f32_le(buf, 8)?,
        max_distance: read_f32_le(buf, 12)?,
    };
    let expected =
        STAR_TILE_HEADER_BYTES + (header.star_count as usize) * STAR_TILE_RECORD_BYTES;
    if buf.len() < expected {
        return None;
    }

    let mut records = Vec::with_capacity(header.star_count as usize);
    for i in 0..header.star_count as usize {
        let off = STAR_TILE_HEADER_BYTES + i * STAR_TILE_RECORD_BYTES;
        records.push(StarRecord {
            x: f16::from_bits(read_u16_le(buf, off)?).to_f32(),
            y: f16::from_bits(read_u16_le(buf, off + 2)?).to_f32(),
            z: f16::from_bits(read_u16_le(buf, off + 4)?).to_f32(),
            magnitude: buf[off + 6],
            color_index: buf[off + 7],
            spectral_type: buf[off + 8],
            flags: buf[off + 9],
            catalog_index: read_u16_le(buf, off + 10)?,
        });
    }
    Some((header, records))
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct StarTileHeader {
    pub tile_id: u32,
    pub star_count: u32,
    pub min_distance: f32,
    pub max_distance: f32,
}

/// Quantise a G-magnitude value into the Doc 11 §4.1 byte.
/// Range [-5, 21] → [0, 255] linearly, clamped. Inverse of
/// [`unpack_magnitude`].
pub fn pack_magnitude(magnitude: f32) -> u8 {
    if !magnitude.is_finite() {
        return 0;
    }
    let clamped = magnitude.clamp(-5.0, 21.0);
    (((clamped + 5.0) / 26.0) * 255.0).round().clamp(0.0, 255.0) as u8
}

/// Quantise a BP-RP colour index into the Doc 11 §4.1 byte.
/// Range [-0.5, 3.5] → [0, 255] linearly, clamped.
pub fn pack_color_index(bp_rp: f32) -> u8 {
    if !bp_rp.is_finite() {
        return 0;
    }
    let clamped = bp_rp.clamp(-0.5, 3.5);
    (((clamped + 0.5) / 4.0) * 255.0).round().clamp(0.0, 255.0) as u8
}

pub fn unpack_magnitude(byte: u8) -> f32 {
    -5.0 + (byte as f32 / 255.0) * 26.0
}

pub fn unpack_color_index(byte: u8) -> f32 {
    -0.5 + (byte as f32 / 255.0) * 4.0
}

// -------------------------------------------------------------------------
// Galaxy tile (Doc 11 §4.2)
// -------------------------------------------------------------------------

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct GalaxyRecord {
    pub ra_deg: f32,
    pub dec_deg: f32,
    pub redshift: f32,
    /// Apparent magnitude (f16 on the wire).
    pub magnitude: f32,
    /// Angular size in arcminutes (f16 on the wire).
    pub angular_size: f32,
    /// 0=E, 1=S0, … 10=Irr.
    pub morphology_type: u8,
    pub flags: u8,
    pub metadata_index: u16,
}

#[derive(Debug, Clone)]
pub struct GalaxyTile {
    pub distance_min: f32,
    pub distance_max: f32,
    pub flags: u32,
    pub galaxies: Vec<GalaxyRecord>,
}

pub fn encode_galaxy_tile(tile: &GalaxyTile) -> Result<Bytes, EncodingError> {
    let count = u32::try_from(tile.galaxies.len())
        .map_err(|_| EncodingError::RecordCountOverflow(tile.galaxies.len()))?;
    let total = GALAXY_TILE_HEADER_BYTES + tile.galaxies.len() * GALAXY_TILE_RECORD_BYTES;
    let mut out = BytesMut::with_capacity(total);

    out.put_u32_le(count);
    out.put_f32_le(tile.distance_min);
    out.put_f32_le(tile.distance_max);
    out.put_u32_le(tile.flags);

    for g in &tile.galaxies {
        out.put_f32_le(g.ra_deg);
        out.put_f32_le(g.dec_deg);
        out.put_f32_le(g.redshift);
        out.put_u16_le(f16::from_f32(g.magnitude).to_bits());
        out.put_u16_le(f16::from_f32(g.angular_size).to_bits());
        out.put_u8(g.morphology_type);
        out.put_u8(g.flags);
        out.put_u16_le(g.metadata_index);
        out.put_u32_le(0); // 4 B reserved
    }

    debug_assert_eq!(out.len(), total);
    Ok(out.freeze())
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct GalaxyTileHeader {
    pub galaxy_count: u32,
    pub distance_min: f32,
    pub distance_max: f32,
    pub flags: u32,
}

pub fn decode_galaxy_tile(buf: &[u8]) -> Option<(GalaxyTileHeader, Vec<GalaxyRecord>)> {
    if buf.len() < GALAXY_TILE_HEADER_BYTES {
        return None;
    }
    let header = GalaxyTileHeader {
        galaxy_count: read_u32_le(buf, 0)?,
        distance_min: read_f32_le(buf, 4)?,
        distance_max: read_f32_le(buf, 8)?,
        flags: read_u32_le(buf, 12)?,
    };
    let expected =
        GALAXY_TILE_HEADER_BYTES + (header.galaxy_count as usize) * GALAXY_TILE_RECORD_BYTES;
    if buf.len() < expected {
        return None;
    }
    let mut records = Vec::with_capacity(header.galaxy_count as usize);
    for i in 0..header.galaxy_count as usize {
        let off = GALAXY_TILE_HEADER_BYTES + i * GALAXY_TILE_RECORD_BYTES;
        records.push(GalaxyRecord {
            ra_deg: read_f32_le(buf, off)?,
            dec_deg: read_f32_le(buf, off + 4)?,
            redshift: read_f32_le(buf, off + 8)?,
            magnitude: f16::from_bits(read_u16_le(buf, off + 12)?).to_f32(),
            angular_size: f16::from_bits(read_u16_le(buf, off + 14)?).to_f32(),
            morphology_type: buf[off + 16],
            flags: buf[off + 17],
            metadata_index: read_u16_le(buf, off + 18)?,
        });
    }
    Some((header, records))
}

// -------------------------------------------------------------------------
// Cosmic web mesh (Doc 11 §4.3)
// -------------------------------------------------------------------------

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CosmicWebVertex {
    pub x: f32,
    pub y: f32,
    pub z: f32,
    /// Normalised density (0..1) relative to `density_scale`.
    pub density: f32,
}

#[derive(Debug, Clone)]
pub struct CosmicWebMesh {
    pub density_scale: f32,
    pub version: u32,
    pub use_u32_indices: bool,
    pub vertices: Vec<CosmicWebVertex>,
    pub indices: Vec<u32>,
}

pub fn encode_cosmic_web_mesh(mesh: &CosmicWebMesh) -> Result<Bytes, EncodingError> {
    let vcount = u32::try_from(mesh.vertices.len())
        .map_err(|_| EncodingError::RecordCountOverflow(mesh.vertices.len()))?;
    let icount = u32::try_from(mesh.indices.len())
        .map_err(|_| EncodingError::RecordCountOverflow(mesh.indices.len()))?;

    let index_size = if mesh.use_u32_indices { 4 } else { 2 };
    let total = COSMIC_WEB_HEADER_BYTES
        + mesh.vertices.len() * COSMIC_WEB_VERTEX_BYTES
        + mesh.indices.len() * index_size;

    let mut out = BytesMut::with_capacity(total);
    out.put_u32_le(vcount);
    out.put_u32_le(icount);
    out.put_f32_le(mesh.density_scale);
    out.put_u32_le(mesh.version);
    let flags = if mesh.use_u32_indices {
        COSMIC_WEB_FLAG_U32_INDICES
    } else {
        0
    };
    out.put_u16_le(flags);
    out.put_u16_le(0); // padding

    for v in &mesh.vertices {
        out.put_f32_le(v.x);
        out.put_f32_le(v.y);
        out.put_f32_le(v.z);
        out.put_f32_le(v.density);
    }
    for &idx in &mesh.indices {
        if mesh.use_u32_indices {
            out.put_u32_le(idx);
        } else {
            out.put_u16_le(idx as u16);
        }
    }

    debug_assert_eq!(out.len(), total);
    Ok(out.freeze())
}

// -------------------------------------------------------------------------
// Byte helpers
// -------------------------------------------------------------------------

fn read_u16_le(buf: &[u8], offset: usize) -> Option<u16> {
    buf.get(offset..offset + 2)
        .map(|b| u16::from_le_bytes([b[0], b[1]]))
}

fn read_u32_le(buf: &[u8], offset: usize) -> Option<u32> {
    buf.get(offset..offset + 4)
        .map(|b| u32::from_le_bytes([b[0], b[1], b[2], b[3]]))
}

fn read_f32_le(buf: &[u8], offset: usize) -> Option<f32> {
    read_u32_le(buf, offset).map(f32::from_bits)
}

// -------------------------------------------------------------------------
// Tests
// -------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    // --- Star tile --------------------------------------------------------

    fn sample_star() -> StarRecord {
        StarRecord {
            x: 1.25,
            y: -2.5,
            z: 3.125,
            magnitude: pack_magnitude(8.5),
            color_index: pack_color_index(1.2),
            spectral_type: SPECTRAL_TYPE_G,
            flags: 0b0000_0011,
            catalog_index: 42,
        }
    }

    #[test]
    fn star_tile_byte_length_matches_spec() {
        for n in [0usize, 1, 3, 100] {
            let tile = StarTile {
                tile_id: 7,
                min_distance: 0.0,
                max_distance: 10.0,
                stars: vec![sample_star(); n],
            };
            let bytes = encode_star_tile(&tile).unwrap();
            assert_eq!(
                bytes.len(),
                STAR_TILE_HEADER_BYTES + n * STAR_TILE_RECORD_BYTES,
                "n={n}: unexpected length {}",
                bytes.len(),
            );
        }
    }

    #[test]
    fn star_tile_header_is_little_endian() {
        let tile = StarTile {
            tile_id: 0x0403_0201,
            min_distance: 1.0,
            max_distance: 2.0,
            stars: vec![],
        };
        let bytes = encode_star_tile(&tile).unwrap();
        assert_eq!(&bytes[0..4], &[0x01, 0x02, 0x03, 0x04]);
        assert_eq!(&bytes[4..8], &[0, 0, 0, 0]); // star_count = 0
        assert_eq!(&bytes[8..12], &1.0f32.to_le_bytes());
        assert_eq!(&bytes[12..16], &2.0f32.to_le_bytes());
    }

    #[test]
    fn star_tile_round_trip_preserves_records_within_f16_error() {
        let stars = vec![
            sample_star(),
            StarRecord {
                x: 0.0,
                y: 0.0,
                z: 0.0,
                magnitude: 128,
                color_index: 200,
                spectral_type: SPECTRAL_TYPE_M,
                flags: 0,
                catalog_index: 65_535,
            },
            StarRecord {
                x: -50.0,
                y: 12.75,
                z: -0.125,
                magnitude: 0,
                color_index: 255,
                spectral_type: SPECTRAL_TYPE_UNKNOWN,
                flags: 0xff,
                catalog_index: 0,
            },
        ];
        let tile = StarTile {
            tile_id: 12_345,
            min_distance: 0.1,
            max_distance: 100.0,
            stars: stars.clone(),
        };
        let bytes = encode_star_tile(&tile).unwrap();
        let (hdr, out) = decode_star_tile(&bytes).expect("decode succeeds");

        assert_eq!(hdr.tile_id, 12_345);
        assert_eq!(hdr.star_count, 3);
        assert_eq!(hdr.min_distance, 0.1);
        assert_eq!(hdr.max_distance, 100.0);

        for (a, b) in stars.iter().zip(out.iter()) {
            // f16 has ~3 decimal digits of precision for |x| < 2048.
            assert!((a.x - b.x).abs() < 1e-2, "x: {} vs {}", a.x, b.x);
            assert!((a.y - b.y).abs() < 1e-2, "y: {} vs {}", a.y, b.y);
            assert!((a.z - b.z).abs() < 1e-2, "z: {} vs {}", a.z, b.z);
            assert_eq!(a.magnitude, b.magnitude);
            assert_eq!(a.color_index, b.color_index);
            assert_eq!(a.spectral_type, b.spectral_type);
            assert_eq!(a.flags, b.flags);
            assert_eq!(a.catalog_index, b.catalog_index);
        }
    }

    #[test]
    fn star_tile_padding_bytes_are_zero() {
        let tile = StarTile {
            tile_id: 1,
            min_distance: 0.0,
            max_distance: 1.0,
            stars: vec![sample_star()],
        };
        let bytes = encode_star_tile(&tile).unwrap();
        // Record starts at offset 16; padding is 12..16 of the record.
        assert_eq!(&bytes[STAR_TILE_HEADER_BYTES + 12..STAR_TILE_HEADER_BYTES + 16], &[0, 0, 0, 0]);
    }

    // --- Magnitude / colour quantisation ----------------------------------

    #[test]
    fn magnitude_round_trip_matches_ts_quantisation() {
        for mag in [-5.0, 0.0, 4.5, 10.0, 21.0] {
            let byte = pack_magnitude(mag);
            let back = unpack_magnitude(byte);
            // Step size is 26 / 255 ≈ 0.102 mag.
            assert!((mag - back).abs() < 0.11, "mag={mag} → {byte} → {back}");
        }
        // Out-of-range values clamp to the endpoints.
        assert_eq!(pack_magnitude(-100.0), pack_magnitude(-5.0));
        assert_eq!(pack_magnitude(100.0), pack_magnitude(21.0));
        assert_eq!(pack_magnitude(f32::NAN), 0);
    }

    #[test]
    fn color_index_round_trip_matches_ts_quantisation() {
        for ci in [-0.5, 0.0, 1.0, 2.25, 3.5] {
            let byte = pack_color_index(ci);
            let back = unpack_color_index(byte);
            // Step size is 4 / 255 ≈ 0.0157.
            assert!((ci - back).abs() < 0.02, "ci={ci} → {byte} → {back}");
        }
        assert_eq!(pack_color_index(-5.0), pack_color_index(-0.5));
        assert_eq!(pack_color_index(10.0), pack_color_index(3.5));
    }

    // --- Galaxy tile ------------------------------------------------------

    #[test]
    fn galaxy_tile_round_trip() {
        let galaxies = vec![
            GalaxyRecord {
                ra_deg: 10.6847,
                dec_deg: 41.2688,
                redshift: -0.001,
                magnitude: 3.44,
                angular_size: 190.0,
                morphology_type: 2,
                flags: 0,
                metadata_index: 1,
            },
            GalaxyRecord {
                ra_deg: 201.365,
                dec_deg: -43.019,
                redshift: 0.00167,
                magnitude: 8.0,
                angular_size: 11.2,
                morphology_type: 10,
                flags: 0x80,
                metadata_index: 512,
            },
        ];
        let tile = GalaxyTile {
            distance_min: 0.001,
            distance_max: 8000.0,
            flags: 0,
            galaxies: galaxies.clone(),
        };
        let bytes = encode_galaxy_tile(&tile).unwrap();
        assert_eq!(
            bytes.len(),
            GALAXY_TILE_HEADER_BYTES + galaxies.len() * GALAXY_TILE_RECORD_BYTES,
        );
        let (hdr, out) = decode_galaxy_tile(&bytes).unwrap();
        assert_eq!(hdr.galaxy_count, 2);
        assert_eq!(hdr.distance_min, 0.001);
        assert_eq!(hdr.distance_max, 8000.0);

        for (a, b) in galaxies.iter().zip(out.iter()) {
            assert!((a.ra_deg - b.ra_deg).abs() < 1e-4);
            assert!((a.dec_deg - b.dec_deg).abs() < 1e-4);
            assert!((a.redshift - b.redshift).abs() < 1e-6);
            // f16 precision for magnitude.
            assert!((a.magnitude - b.magnitude).abs() < 1e-2);
            // Angular size up to ~190 arcmin — f16 still has ~0.1 precision.
            assert!((a.angular_size - b.angular_size).abs() < 0.2);
            assert_eq!(a.morphology_type, b.morphology_type);
            assert_eq!(a.flags, b.flags);
            assert_eq!(a.metadata_index, b.metadata_index);
        }
    }

    // --- Cosmic web mesh --------------------------------------------------

    fn sample_mesh(use_u32: bool) -> CosmicWebMesh {
        CosmicWebMesh {
            density_scale: 1.0,
            version: 1,
            use_u32_indices: use_u32,
            vertices: vec![
                CosmicWebVertex { x: 0.0, y: 0.0, z: 0.0, density: 0.5 },
                CosmicWebVertex { x: 1.0, y: 0.0, z: 0.0, density: 0.25 },
                CosmicWebVertex { x: 0.0, y: 1.0, z: 0.0, density: 0.75 },
                CosmicWebVertex { x: 0.0, y: 0.0, z: 1.0, density: 1.0 },
            ],
            indices: vec![0, 1, 2, 0, 2, 3, 0, 3, 1, 1, 3, 2],
        }
    }

    #[test]
    fn cosmic_web_u16_indices_length_matches_spec() {
        let mesh = sample_mesh(false);
        let bytes = encode_cosmic_web_mesh(&mesh).unwrap();
        let expected =
            COSMIC_WEB_HEADER_BYTES + mesh.vertices.len() * COSMIC_WEB_VERTEX_BYTES + mesh.indices.len() * 2;
        assert_eq!(bytes.len(), expected);
        // flags field at offset 16.
        assert_eq!(&bytes[16..18], &0u16.to_le_bytes());
    }

    #[test]
    fn cosmic_web_u32_indices_set_flag_bit() {
        let mesh = sample_mesh(true);
        let bytes = encode_cosmic_web_mesh(&mesh).unwrap();
        let expected =
            COSMIC_WEB_HEADER_BYTES + mesh.vertices.len() * COSMIC_WEB_VERTEX_BYTES + mesh.indices.len() * 4;
        assert_eq!(bytes.len(), expected);
        assert_eq!(
            &bytes[16..18],
            &COSMIC_WEB_FLAG_U32_INDICES.to_le_bytes(),
        );
    }

    #[test]
    fn cosmic_web_vertex_count_and_index_count_match_header() {
        let mesh = sample_mesh(true);
        let bytes = encode_cosmic_web_mesh(&mesh).unwrap();
        assert_eq!(read_u32_le(&bytes, 0).unwrap() as usize, mesh.vertices.len());
        assert_eq!(read_u32_le(&bytes, 4).unwrap() as usize, mesh.indices.len());
        assert_eq!(read_f32_le(&bytes, 8).unwrap(), mesh.density_scale);
        assert_eq!(read_u32_le(&bytes, 12).unwrap(), mesh.version);
    }

    // --- Error handling ---------------------------------------------------

    #[test]
    fn empty_star_tile_encodes_to_just_a_header() {
        let tile = StarTile {
            tile_id: 0,
            min_distance: 0.0,
            max_distance: 0.0,
            stars: vec![],
        };
        let bytes = encode_star_tile(&tile).unwrap();
        assert_eq!(bytes.len(), STAR_TILE_HEADER_BYTES);
        let (hdr, records) = decode_star_tile(&bytes).unwrap();
        assert_eq!(hdr.star_count, 0);
        assert!(records.is_empty());
    }

    #[test]
    fn truncated_buffer_fails_to_decode() {
        let tile = StarTile {
            tile_id: 0,
            min_distance: 0.0,
            max_distance: 0.0,
            stars: vec![sample_star()],
        };
        let bytes = encode_star_tile(&tile).unwrap();
        // Chop a byte off the end; decoder must refuse.
        assert!(decode_star_tile(&bytes[..bytes.len() - 1]).is_none());
        // Also refuse buffers smaller than the header itself.
        assert!(decode_star_tile(&bytes[..4]).is_none());
    }
}
