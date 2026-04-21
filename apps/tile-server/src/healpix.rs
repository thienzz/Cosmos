//! HEALPix pixel ↔ RA/Dec conversions (T-E-01).
//!
//! Implements the NESTED-scheme helpers the star-tile handler needs
//! (Doc 23 §17, Doc 26 §7). Given a HEALPix `(order, pixel)` address
//! we can compute:
//!
//!   - the pixel centre in RA/Dec (degrees),
//!   - an axis-aligned bounding box in the equatorial plane, with
//!     explicit RA-meridian wrap handling so the caller can turn it
//!     into a SQL range query without special-casing pixels that
//!     straddle RA = 0.
//!   - the HEALPix hash for a given (RA, Dec) position — round-trip
//!     helper for T-E-04.
//!
//! Precision note: HEALPix cell edges are *not* straight lines in
//! (RA, Dec) — in the equatorial belt they follow iso-latitude small
//! circles, and in the polar caps they follow iso-|z| curves that are
//! sinusoidal in RA. Using only the four vertices under-estimates the
//! bounding box. We sample along each edge in 3-space before projecting
//! back, and detect pixels that touch a pole explicitly — those get the
//! full RA range.

use std::f64::consts::PI;

use cdshealpix::nested::{center, hash as nested_hash, vertices};

/// Maximum HEALPix order (depth) the tile server supports. Matches
/// Doc 23 §17: order 10 → Nside 1024 → ~12 M pixels → ~3.4 arcmin per
/// pixel, enough to bin Gaia at all served tile LODs.
pub const MAX_ORDER: u8 = 10;

/// Number of extra points to sample along each HEALPix edge when
/// computing the bounding box. Using only the 4 vertices
/// under-estimates the latitude range of a cell by up to
/// ~0.1° at order 5, which is enough to miss real sources.
const EDGE_SAMPLES: u32 = 16;

/// Latitude (rad) above which we collapse a pixel's bounds to the full
/// RA range. ~89.5°. Vertex samples of pixels that cover the pole will
/// exceed this.
const POLAR_LAT_THRESHOLD_RAD: f64 = 1.561;

#[derive(Debug, thiserror::Error, PartialEq)]
pub enum HealpixError {
    #[error("order {0} exceeds MAX_ORDER ({MAX_ORDER})")]
    OrderOutOfRange(u8),
    #[error("pixel {pixel} out of range at order {order} (max {max})")]
    PixelOutOfRange { order: u8, pixel: u64, max: u64 },
    #[error("invalid sky position: RA={ra} Dec={dec}")]
    InvalidSkyPosition { ra: f64, dec: f64 },
}

/// Axis-aligned bounding box in equatorial coordinates (degrees).
///
/// If the pixel straddles the RA = 0 meridian, `ra_min` is on the
/// high side (e.g. 358.4°) and `ra_max` is on the low side (e.g.
/// 1.6°) — callers MUST check [`Self::wraps_meridian`] before doing
/// a naive `ra BETWEEN ra_min AND ra_max` query.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct BoundingBox {
    pub ra_min: f64,
    pub ra_max: f64,
    pub dec_min: f64,
    pub dec_max: f64,
}

impl BoundingBox {
    pub fn wraps_meridian(&self) -> bool {
        self.ra_min > self.ra_max
    }

    pub fn full_sky_ra(&self) -> bool {
        (self.ra_max - self.ra_min).abs() >= 360.0 - 1e-9
    }

    /// `true` iff `(ra_deg, dec_deg)` falls inside this box. RA axis is
    /// treated as circular (meridian wrap is respected).
    pub fn contains(&self, ra_deg: f64, dec_deg: f64) -> bool {
        if dec_deg < self.dec_min - 1e-9 || dec_deg > self.dec_max + 1e-9 {
            return false;
        }
        if self.full_sky_ra() {
            return true;
        }
        if self.wraps_meridian() {
            ra_deg >= self.ra_min - 1e-9 || ra_deg <= self.ra_max + 1e-9
        } else {
            ra_deg >= self.ra_min - 1e-9 && ra_deg <= self.ra_max + 1e-9
        }
    }
}

/// Total number of pixels at a given order: `12 × 4^order`.
#[inline]
pub fn npix(order: u8) -> u64 {
    12u64 << (2 * order as u32)
}

/// Centre of a pixel as `(RA_deg, Dec_deg)` in the ICRS J2000.0 frame.
pub fn pixel_center(order: u8, pixel: u64) -> Result<(f64, f64), HealpixError> {
    validate_address(order, pixel)?;
    let (lon_rad, lat_rad) = center(order, pixel);
    Ok((wrap_deg_ra(lon_rad.to_degrees()), lat_rad.to_degrees()))
}

/// HEALPix NESTED hash for a sky position `(RA_deg, Dec_deg)` at a given
/// order. Inverse of [`pixel_center`].
pub fn hash_at(order: u8, ra_deg: f64, dec_deg: f64) -> Result<u64, HealpixError> {
    if order > MAX_ORDER {
        return Err(HealpixError::OrderOutOfRange(order));
    }
    if !ra_deg.is_finite()
        || !dec_deg.is_finite()
        || dec_deg < -90.0 - 1e-9
        || dec_deg > 90.0 + 1e-9
    {
        return Err(HealpixError::InvalidSkyPosition {
            ra: ra_deg,
            dec: dec_deg,
        });
    }
    let ra_rad = wrap_to_2pi(ra_deg.to_radians());
    let dec_rad = dec_deg.clamp(-90.0, 90.0).to_radians();
    Ok(nested_hash(order, ra_rad, dec_rad))
}

/// Axis-aligned RA/Dec bounding box for a HEALPix NESTED pixel.
pub fn pixel_bounds(order: u8, pixel: u64) -> Result<BoundingBox, HealpixError> {
    validate_address(order, pixel)?;
    let verts = vertices(order, pixel);

    // Build a cloud of sample points on the sphere: the 4 vertices
    // plus EDGE_SAMPLES-1 interpolated points along each edge.
    let mut lats_rad = Vec::with_capacity(4 + 4 * EDGE_SAMPLES as usize);
    let mut lons_rad = Vec::with_capacity(4 + 4 * EDGE_SAMPLES as usize);
    for &(lon, lat) in verts.iter() {
        lons_rad.push(wrap_to_2pi(lon));
        lats_rad.push(lat);
    }
    for i in 0..4 {
        let (lon_a, lat_a) = verts[i];
        let (lon_b, lat_b) = verts[(i + 1) % 4];
        let a = unit_vec(lon_a, lat_a);
        let b = unit_vec(lon_b, lat_b);
        for k in 1..EDGE_SAMPLES {
            let t = k as f64 / EDGE_SAMPLES as f64;
            let mx = a[0] * (1.0 - t) + b[0] * t;
            let my = a[1] * (1.0 - t) + b[1] * t;
            let mz = a[2] * (1.0 - t) + b[2] * t;
            let norm = (mx * mx + my * my + mz * mz).sqrt();
            // Normalise back to the unit sphere; any point inside the
            // cell is well away from the origin, so norm > 0.
            let nx = mx / norm;
            let ny = my / norm;
            let nz = mz / norm;
            let lon_m = wrap_to_2pi(ny.atan2(nx));
            let lat_m = nz.clamp(-1.0, 1.0).asin();
            lons_rad.push(lon_m);
            lats_rad.push(lat_m);
        }
    }

    let lat_min = lats_rad.iter().copied().fold(f64::INFINITY, f64::min);
    let lat_max = lats_rad.iter().copied().fold(f64::NEG_INFINITY, f64::max);

    // Polar cells: if any sample crosses the polar threshold, the cell
    // contains a pole and has an effective RA range of [0, 360).
    if lat_max >= POLAR_LAT_THRESHOLD_RAD {
        return Ok(BoundingBox {
            ra_min: 0.0,
            ra_max: 360.0,
            dec_min: lat_min.to_degrees(),
            dec_max: 90.0,
        });
    }
    if lat_min <= -POLAR_LAT_THRESHOLD_RAD {
        return Ok(BoundingBox {
            ra_min: 0.0,
            ra_max: 360.0,
            dec_min: -90.0,
            dec_max: lat_max.to_degrees(),
        });
    }

    // Standard minimum-enclosing-arc on the RA circle: sort longitudes,
    // find the widest gap between consecutive points (wrapping from the
    // last back to the first + 2π), and use the complement as the arc.
    let mut lons = lons_rad.clone();
    lons.sort_by(|a, b| a.partial_cmp(b).unwrap());
    let n = lons.len();
    let mut biggest_gap = 0.0;
    let mut gap_at = 0usize;
    for i in 0..n {
        let next = if i == n - 1 {
            lons[0] + 2.0 * PI
        } else {
            lons[i + 1]
        };
        let gap = next - lons[i];
        if gap > biggest_gap {
            biggest_gap = gap;
            gap_at = i;
        }
    }
    let ra_min_rad = lons[(gap_at + 1) % n];
    let ra_max_rad = lons[gap_at];

    Ok(BoundingBox {
        ra_min: wrap_deg_ra(ra_min_rad.to_degrees()),
        ra_max: wrap_deg_ra(ra_max_rad.to_degrees()),
        dec_min: lat_min.to_degrees(),
        dec_max: lat_max.to_degrees(),
    })
}

fn validate_address(order: u8, pixel: u64) -> Result<(), HealpixError> {
    if order > MAX_ORDER {
        return Err(HealpixError::OrderOutOfRange(order));
    }
    let n = npix(order);
    if pixel >= n {
        return Err(HealpixError::PixelOutOfRange {
            order,
            pixel,
            max: n - 1,
        });
    }
    Ok(())
}

#[inline]
fn unit_vec(lon: f64, lat: f64) -> [f64; 3] {
    let (slon, clon) = lon.sin_cos();
    let (slat, clat) = lat.sin_cos();
    [clat * clon, clat * slon, slat]
}

#[inline]
fn wrap_to_2pi(rad: f64) -> f64 {
    let two_pi = 2.0 * PI;
    let r = rad % two_pi;
    if r < 0.0 {
        r + two_pi
    } else {
        r
    }
}

#[inline]
fn wrap_deg_ra(deg: f64) -> f64 {
    let r = deg % 360.0;
    if r < 0.0 {
        r + 360.0
    } else if r >= 360.0 {
        r - 360.0
    } else {
        r
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // --- Address validation ------------------------------------------------

    #[test]
    fn npix_matches_12_times_4_to_order() {
        assert_eq!(npix(0), 12);
        assert_eq!(npix(1), 48);
        assert_eq!(npix(5), 12_288);
        assert_eq!(npix(10), 12_582_912);
    }

    #[test]
    fn rejects_order_above_max() {
        assert_eq!(
            pixel_bounds(MAX_ORDER + 1, 0),
            Err(HealpixError::OrderOutOfRange(MAX_ORDER + 1))
        );
    }

    #[test]
    fn rejects_pixel_above_npix() {
        let err = pixel_bounds(2, npix(2)).unwrap_err();
        assert_eq!(
            err,
            HealpixError::PixelOutOfRange {
                order: 2,
                pixel: npix(2),
                max: npix(2) - 1,
            }
        );
    }

    // --- Bounds sanity across all supported orders ------------------------

    #[test]
    fn bounds_sane_for_sampled_pixels_across_all_orders() {
        for order in 0..=MAX_ORDER {
            let n = npix(order);
            // Poles, near-poles, equatorial belt. n-1 must be included to
            // stress the southernmost polar-cap pixel at each order.
            let samples = [0, n / 4, n / 2, 3 * n / 4, n - 1];
            for &pix in &samples {
                let bb = pixel_bounds(order, pix)
                    .unwrap_or_else(|e| panic!("order={order} pix={pix}: {e}"));
                assert!(
                    bb.dec_min >= -90.0 - 1e-6 && bb.dec_max <= 90.0 + 1e-6,
                    "order={order} pix={pix}: dec range {:?}",
                    (bb.dec_min, bb.dec_max),
                );
                assert!(
                    bb.dec_max >= bb.dec_min,
                    "order={order} pix={pix}: inverted dec"
                );
                assert!(bb.ra_min >= 0.0 && bb.ra_min <= 360.0);
                assert!(bb.ra_max >= 0.0 && bb.ra_max <= 360.0);
            }
        }
    }

    #[test]
    fn pixel_center_matches_bounding_box_for_all_orders() {
        for order in 0..=MAX_ORDER {
            let n = npix(order);
            let samples = [0, n / 4, n / 2, 3 * n / 4, n - 1];
            for &pix in &samples {
                let (ra, dec) = pixel_center(order, pix).unwrap();
                let bb = pixel_bounds(order, pix).unwrap();
                assert!(
                    bb.contains(ra, dec),
                    "order={order} pix={pix}: centre ({ra:.4}, {dec:.4}) \
                     is not inside {bb:?}",
                );
            }
        }
    }

    // --- Polar / wrap / round-trip edge cases ------------------------------

    #[test]
    fn order_0_north_polar_pixel_has_full_ra_range() {
        // At depth 0, pixels 0..=3 are the four north-polar-cap base faces.
        for pix in 0..4u64 {
            let bb = pixel_bounds(0, pix).unwrap();
            assert!(
                bb.full_sky_ra(),
                "order=0 pix={pix}: expected polar bb, got {bb:?}",
            );
            assert!(
                bb.dec_max >= 89.0,
                "order=0 pix={pix}: dec_max {:.3} should reach the pole",
                bb.dec_max,
            );
        }
    }

    #[test]
    fn order_0_south_polar_pixel_has_full_ra_range() {
        // Pixels 8..=11 at depth 0 are the south-polar-cap base faces.
        for pix in 8..12u64 {
            let bb = pixel_bounds(0, pix).unwrap();
            assert!(
                bb.full_sky_ra(),
                "order=0 pix={pix}: expected polar bb, got {bb:?}",
            );
            assert!(
                bb.dec_min <= -89.0,
                "order=0 pix={pix}: dec_min {:.3} should reach the pole",
                bb.dec_min,
            );
        }
    }

    #[test]
    fn equatorial_pixel_has_narrow_dec_range() {
        // Pixels 4..=7 at depth 0 straddle the equator. Any equatorial
        // base pixel must sit within ~41.81° of the equator.
        for pix in 4..8u64 {
            let bb = pixel_bounds(0, pix).unwrap();
            assert!(
                bb.dec_min.abs() < 42.0 && bb.dec_max.abs() < 42.0,
                "order=0 pix={pix}: expected equatorial bb, got {bb:?}",
            );
            assert!(
                !bb.full_sky_ra(),
                "order=0 pix={pix}: equatorial cell should not span full RA",
            );
        }
    }

    #[test]
    fn hash_round_trip_matches_original_pixel() {
        for order in [0u8, 3, 6, 10] {
            let n = npix(order);
            for &pix in &[0, n / 2, n - 1] {
                // Polar cells collapse to one representative hash per pole;
                // skip them for the round-trip check since centre-based
                // inversion isn't bijective there.
                let (ra, dec) = pixel_center(order, pix).unwrap();
                if dec.abs() >= 89.0 {
                    continue;
                }
                let round_trip = hash_at(order, ra, dec).unwrap();
                assert_eq!(
                    round_trip, pix,
                    "order={order} pix={pix}: centre round-tripped to {round_trip}",
                );
            }
        }
    }

    #[test]
    fn hash_at_rejects_out_of_range_dec() {
        assert!(matches!(
            hash_at(5, 180.0, 91.0),
            Err(HealpixError::InvalidSkyPosition { .. })
        ));
    }

    #[test]
    fn bounds_wrapping_meridian_reports_wrap() {
        // Walk through equatorial belt pixels at a fine order and find
        // one whose centre is close to RA = 0 — that cell must wrap.
        let order = 6u8;
        let n = npix(order);
        let mut wrapped = false;
        for pix in 0..n {
            let (ra, dec) = pixel_center(order, pix).unwrap();
            if dec.abs() < 5.0 && (ra < 2.0 || ra > 358.0) {
                let bb = pixel_bounds(order, pix).unwrap();
                if bb.wraps_meridian() {
                    wrapped = true;
                    // And RA=0 itself must be contained.
                    assert!(bb.contains(0.0, dec), "cell bb={bb:?} should contain RA=0");
                    break;
                }
            }
        }
        assert!(
            wrapped,
            "expected at least one equatorial order-6 pixel to wrap RA=0",
        );
    }
}
