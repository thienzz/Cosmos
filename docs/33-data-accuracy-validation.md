# Cosmos Explorer — Data Accuracy Validation Specification

**Document:** 33 — Data Accuracy Validation Specification  
**Version:** 1.0  
**Date:** 2026-04-19  
**Status:** Published  
**Product:** Cosmos Explorer — Interactive 3D Universe Visualization  
**Depends On:** Doc 11 (Data Model), Doc 13 (Testing Strategy), Doc 18 (Visual Rendering), Doc 23 (Spatial Database), Doc 25 (Backend Architecture §8)  
**Consumed By:** Doc 30 (Test Cases — TS-DATA/TS-VQA), ETL pipeline, QA team

---

## Table of Contents

1. [Overview](#1-overview)
2. [Authoritative Reference Sources](#2-authoritative-reference-sources)
3. [Positional Accuracy](#3-positional-accuracy)
4. [Photometric Accuracy](#4-photometric-accuracy)
5. [Physical Property Accuracy](#5-physical-property-accuracy)
6. [Ephemeris Accuracy](#6-ephemeris-accuracy)
7. [Visual Rendering Accuracy](#7-visual-rendering-accuracy)
8. [Data Completeness](#8-data-completeness)
9. [Cross-Catalog Consistency](#9-cross-catalog-consistency)
10. [Automated Validation Pipeline](#10-automated-validation-pipeline)
11. [Manual Validation Procedures](#11-manual-validation-procedures)
12. [Accuracy Reporting](#12-accuracy-reporting)

---

## 1. Overview

### 1.1 Purpose

Cosmos Explorer presents astronomical data to users worldwide — educators, students, researchers, and the curious public. Inaccurate data undermines scientific credibility and educational value. This document defines the accuracy requirements, validation methods, and acceptance thresholds for all data in the system.

### 1.2 Validation Layers

```
Layer 1: Source Data Validation     — Verify integrity of ingested catalog data
Layer 2: Transform Validation       — Verify coordinate conversions and derived properties
Layer 3: Storage Validation         — Verify data correctly persisted in database and tiles
Layer 4: Delivery Validation        — Verify API responses match stored data
Layer 5: Visual Validation          — Verify rendered appearance matches scientific expectation
```

### 1.3 Reference Standard

All positional data is referenced to **ICRS J2000.0** (International Celestial Reference System, epoch J2000.0). Solar system positions are computed in **ECLIPJ2000** via NASA SPICE and converted to ICRS for display.

---

## 2. Authoritative Reference Sources

### 2.1 Source Hierarchy

When sources disagree, higher-ranked sources take precedence:

| Rank | Source | Coverage | Authority |
|------|--------|----------|-----------|
| 1 | Gaia DR3 | 1.8B stars | ESA — highest astrometric precision |
| 2 | Hipparcos2 | 117,955 stars | ESA — bright star benchmark |
| 3 | JPL Horizons / DE440 | Solar system bodies | NASA — definitive ephemerides |
| 4 | NASA Exoplanet Archive | 5,800+ exoplanets | NASA — curated exoplanet database |
| 5 | SDSS DR18 | ~2M galaxies | Sloan Foundation — spectroscopic survey |
| 6 | NGC/IC Project | 13,000+ deep-sky objects | Professional corrections to historical catalogs |
| 7 | IllustrisTNG | Cosmic web structure | Max Planck — N-body simulation |
| 8 | MPC | Minor planets, comets | IAU Minor Planet Center |

### 2.2 Validation Reference Objects

A curated set of 50 well-characterized objects used as primary validation anchors:

**Stars (20):**
Sirius, Canopus, Arcturus, Vega, Capella, Rigel, Procyon, Betelgeuse, Altair, Aldebaran, Antares, Spica, Pollux, Fomalhaut, Deneb, Polaris, Proxima Centauri, Barnard's Star, Wolf 359, Sirius B

**Solar System (10):**
Sun, Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto

**Deep Sky (10):**
M31 (Andromeda), M42 (Orion Nebula), M45 (Pleiades), M13 (Hercules Cluster), M1 (Crab Nebula), M57 (Ring Nebula), M104 (Sombrero), NGC 7293 (Helix), Sagittarius A*, LMC

**Galaxies (5):**
Andromeda (M31), Triangulum (M33), NGC 1277, IC 1101, Magellanic Clouds (LMC)

**Exotic (5):**
Crab Pulsar (PSR B0531+21), Cygnus X-1, Eta Carinae, SS 433, GRS 1915+105

---

## 3. Positional Accuracy

### 3.1 Star Positions

| Source | Precision Requirement | Validation Method |
|--------|----------------------|-------------------|
| Gaia DR3 stars (parallax S/N > 5) | RA, Dec: ±0.001° | Compare 1,000 random stars against Gaia DR3 catalog |
| Gaia DR3 stars (parallax S/N 3–5) | RA, Dec: ±0.005° | Compare 500 random stars |
| Hipparcos-only stars | RA, Dec: ±0.01° | Compare against Hipparcos2 catalog |
| Distance (from parallax) | ±10% for S/N > 10; ±20% for S/N 5–10 | Bayesian distance estimate comparison |

**Cartesian Conversion Accuracy:**

After converting RA/Dec/distance to Cartesian (parsecs):
- Round-trip error (spherical → Cartesian → spherical): <0.0001° in RA/Dec, <0.001 pc in distance
- Verified for all 50 reference objects plus 1,000 random samples

### 3.2 Galaxy Positions

| Source | Precision Requirement | Validation Method |
|--------|----------------------|-------------------|
| SDSS DR18 (spectroscopic z) | RA, Dec: ±0.005° | Compare 200 random galaxies against SDSS |
| SDSS DR18 (photometric z) | RA, Dec: ±0.01°; z: ±0.02 | Compare 200 random galaxies |
| Distance (from redshift) | ±15% (cosmological distance formula) | Compare with NED distances for 50 well-measured galaxies |

### 3.3 Solar System Bodies

| Body | Position Requirement | Validation Source |
|------|---------------------|-------------------|
| Planets (major 8) | ±0.001 AU at any epoch | JPL Horizons (web interface cross-check) |
| Major moons (Galilean, Titan, etc.) | ±0.01 AU | JPL Horizons |
| Minor bodies (named asteroids) | ±0.1 AU | MPC orbital elements |
| Comets | ±1.0 AU (orbits are chaotic) | MPC |

### 3.4 Deep-Sky Object Positions

| Object Type | Position Requirement | Source |
|-------------|---------------------|--------|
| Nebulae (Messier) | RA, Dec: ±0.01° | NGC/IC Project corrections |
| Star clusters | RA, Dec: ±0.01° | MWSC catalog |
| Supernova remnants | RA, Dec: ±0.05° | Green's catalog |

---

## 4. Photometric Accuracy

### 4.1 Stellar Magnitudes

| Property | Requirement | Source |
|----------|-------------|--------|
| Apparent magnitude (G band) | ±0.01 mag for Gaia; ±0.1 mag for Hipparcos | Gaia DR3, Hipparcos2 |
| Absolute magnitude | ±0.1 mag (derived from parallax + apparent) | Calculated |
| Color index (BP-RP) | ±0.01 mag | Gaia DR3 |

### 4.2 Spectral Type to Color Mapping

The visual color assigned to each star must be physically consistent:

| Spectral Type | Expected Color | Temperature Range (K) | Tolerance |
|---------------|---------------|----------------------|-----------|
| O | Blue-white | 30,000–50,000 | ΔE2000 < 3.0 |
| B | Blue | 10,000–30,000 | ΔE2000 < 3.0 |
| A | White | 7,500–10,000 | ΔE2000 < 3.0 |
| F | Yellow-white | 6,000–7,500 | ΔE2000 < 3.0 |
| G | Yellow | 5,200–6,000 | ΔE2000 < 3.0 |
| K | Orange | 3,700–5,200 | ΔE2000 < 3.0 |
| M | Red | 2,400–3,700 | ΔE2000 < 3.0 |

The color mapping function uses the Planck black-body spectrum → CIE XYZ → sRGB conversion pipeline described in Doc 18 §4.1.

### 4.3 Galaxy Magnitudes

| Property | Requirement | Source |
|----------|-------------|--------|
| Apparent magnitude (r-band) | ±0.1 mag | SDSS DR18 |
| Absolute magnitude | ±0.3 mag (includes distance uncertainty) | Derived |
| Redshift | ±0.0001 (spectroscopic), ±0.02 (photometric) | SDSS DR18 |

---

## 5. Physical Property Accuracy

### 5.1 Stellar Properties

| Property | Source | Requirement | Validation |
|----------|--------|-------------|-----------|
| Effective temperature (T_eff) | Gaia DR3 astrophysical params | ±200 K | Compare 100 stars against literature |
| Luminosity | Gaia DR3 (derived) | ±20% | Compare against Hipparcos benchmarks |
| Mass | Estimated from spectral type/luminosity | ±30% | Compare against binary star masses |
| Radius | Estimated from T_eff + luminosity | ±20% | Compare against interferometric measurements |
| Surface gravity (log g) | Gaia DR3 | ±0.3 dex | Compare against spectroscopic surveys |
| Metallicity ([Fe/H]) | Gaia DR3 (where available) | ±0.2 dex | Compare against APOGEE/GALAH |

### 5.2 Planetary Properties

| Property | Requirement | Source |
|----------|-------------|--------|
| Mass | ±1% for solar system planets | IAU values |
| Radius | ±0.1% for solar system planets | IAU values |
| Orbital elements | ±0.01% per element | JPL DE440 |
| Rotation period | ±0.01 hours | IAU values |
| Obliquity | ±0.01° | IAU values |

### 5.3 Galaxy Properties

| Property | Requirement | Source |
|----------|-------------|--------|
| Hubble type | Correct classification | Galaxy Zoo + SDSS pipeline |
| Axis ratio | ±0.05 | SDSS photometric pipeline |
| Angular size | ±10% | SDSS Petrosian radius |
| Stellar mass (where available) | ±0.3 dex | MPA-JHU catalog |

---

## 6. Ephemeris Accuracy

### 6.1 Validation Against JPL Horizons

The ephemeris service (Doc 25 §9) wraps NASA SPICE. Validation compares computed positions against JPL Horizons web interface for independent verification:

| Test | Bodies | Epochs | Tolerance per axis |
|------|--------|--------|--------------------|
| Major planets at J2000.0 | 8 planets | JD 2451545.0 | ±0.0001 AU |
| Major planets at current epoch | 8 planets | Today's JD | ±0.001 AU |
| Major planets at extreme epochs | 8 planets | JD 2287184.5 (1550 CE) | ±0.01 AU |
| Galilean moons | Io, Europa, Ganymede, Callisto | Today's JD | ±0.001 AU |
| Moon position | NAIF 301 | 50 random epochs in 1900–2100 | ±0.0001 AU |
| Pluto | NAIF 999 | 10 epochs in 2000–2050 | ±0.01 AU |

### 6.2 SPICE Kernel Verification

On each kernel update:
1. Verify kernel file checksums against NAIF published checksums
2. Compute 100 reference positions and compare against previous kernel results
3. Flag any position change >0.001 AU for investigation

### 6.3 Time System Accuracy

| Conversion | Requirement |
|------------|-------------|
| JD ↔ Calendar date | ±0 (exact, integer arithmetic) |
| UTC ↔ ET (Ephemeris Time) | Correct leap second handling per naif0012.tls |
| MJD ↔ JD | ±0 (exact: MJD = JD − 2400000.5) |

---

## 7. Visual Rendering Accuracy

### 7.1 Color Accuracy (CIE ΔE2000)

Per Doc 13 §4 (Visual QA Acceptance Criteria):

| Entity Type | ΔE2000 Threshold | Reference |
|-------------|-----------------|-----------|
| Stars | <3.0 (mean), <5.0 (individual) | Planck black-body reference palette |
| Planets (solar system) | <5.0 per planet | NASA true-color reference images |
| Nebulae | <4.0 (mean) | HST narrowband → RGB reference |
| Galaxies | <8.0 (mean) | SDSS color composites |
| Exoplanets | <10.0 (mean) | Estimated from equilibrium temperature |

### 7.2 Structural Similarity (SSIM)

Rendered images compared against reference renders at fixed camera positions:

| Scene | SSIM Threshold | Reference |
|-------|---------------|-----------|
| Solar system overview | >0.70 | Canonical render at v1.0 release |
| Star field (solar neighborhood) | >0.65 | Canonical render |
| Orion Nebula close-up | >0.60 | HST-derived reference |
| Andromeda Galaxy | >0.60 | SDSS-derived reference |
| Cosmic web overview | >0.55 | IllustrisTNG visualization reference |

### 7.3 Perceptual Hash Regression (pHash)

Every release, 20 canonical scenes are rendered and compared against baseline:
- Hamming distance ≤8: Pass (no significant visual change)
- Hamming distance 9–12: Warning (review required, may be intentional improvement)
- Hamming distance >12: Fail (significant regression, blocks release)

Baseline images updated when intentional visual changes are merged (requires explicit approval).

### 7.4 Animation Frame Rate

Per Doc 13 §4:

| Animation | FPS Threshold | GPU Tier |
|-----------|--------------|----------|
| Star corona | ≥55 FPS | Mid |
| Planet rotation | ≥58 FPS | Mid |
| Nebula volumetric | ≥45 FPS | Mid |
| Black hole accretion | ≥40 FPS | Mid |
| Cosmic web fly-through | ≥50 FPS | Mid |
| Time slider (solar system) | ≥55 FPS | Mid |

### 7.5 Procedural Shader Validation

Per PRD FR-032 (procedural PBR shaders):

| Planet | Visual Check | Automated Metric |
|--------|-------------|-----------------|
| Earth | Blue oceans, green/brown continents, white clouds | ΔE < 5.0 vs NASA Blue Marble |
| Jupiter | Equatorial bands, Great Red Spot region, cloud turbulence | SSIM > 0.60 vs reference |
| Saturn | Ring system, banding, ring shadow on surface | Ring gap positions ±2% |
| Mars | Red-orange surface, polar caps, Valles Marineris region | ΔE < 5.0 vs MOLA colorized |
| Venus | Yellow-white cloud cover, no surface features | ΔE < 3.0 |
| Mercury | Gray, cratered surface | SSIM > 0.50 vs MESSENGER |
| Uranus | Pale blue-green, minimal features | ΔE < 3.0 |
| Neptune | Deep blue, visible storm systems | ΔE < 5.0 vs Voyager |

---

## 8. Data Completeness

### 8.1 Entity Coverage Requirements

| Category | Minimum Count | Source |
|----------|--------------|--------|
| Stars | 1.5 billion | Gaia DR3 (G < 20.7, parallax S/N > 3) |
| Galaxies | 1.5 million | SDSS DR18 spectroscopic + photometric |
| Nebulae | 10,000 | NGC/IC + specialty catalogs |
| Star clusters | 3,000 | MWSC + Gaia-based discoveries |
| Solar system bodies | 6,000+ | JPL + MPC |
| Exoplanets | 5,500+ | NASA Exoplanet Archive |
| Cosmic web nodes | 500,000+ | IllustrisTNG |
| Exotic objects | 500+ | ATNF Pulsar Catalog + literature |

### 8.2 Messier Catalog Completeness

All 110 Messier objects must be present and correctly classified:
- Cross-referenced with NGC/IC IDs
- Correct category assignment (nebula, cluster, galaxy)
- Position within 0.01° of published coordinates

### 8.3 Named Star Completeness

All 88 IAU constellation boundary stars and all named stars in the IAU Working Group list must be present with:
- Common name(s) correctly associated
- Bayer/Flamsteed designations cross-referenced
- Constellation membership correct

---

## 9. Cross-Catalog Consistency

### 9.1 Entity Deduplication

The same physical object may appear in multiple catalogs (e.g., Sirius = HIP 32349 = HD 48915 = Gaia DR3 5072708048013507072). Validation ensures:

| Check | Method | Threshold |
|-------|--------|-----------|
| No duplicate entities for same physical object | Match on position (0.01°) + magnitude (0.5 mag) | 0 unresolved duplicates in Messier/NGC |
| Catalog ID cross-references correct | Verify HIP ↔ Gaia ↔ HD ↔ SAO mappings | >99% match rate for Hipparcos stars |
| Canonical name assigned correctly | IAU name takes precedence over historical | Manual review for 500 named objects |

### 9.2 Coordinate System Consistency

All positions in the database must be in ICRS J2000.0. Validation:
- Query 1,000 random entities; convert to galactic coordinates and back; verify round-trip
- Query 100 entities with known galactic coordinates; verify cross-system agreement
- Verify solar system positions at J2000.0 match ICRS frame (not ecliptic without conversion)

### 9.3 Unit Consistency

| Field | Expected Unit | Validation |
|-------|--------------|-----------|
| RA | Degrees (0–360) | Range check on all entities |
| Dec | Degrees (−90 to +90) | Range check on all entities |
| Distance (stars) | Parsecs | Verify Sirius = 2.636 pc |
| Distance (galaxies) | Megaparsecs | Verify M31 ≈ 0.778 Mpc |
| Temperature | Kelvin | Verify Sun ≈ 5,778 K |
| Mass (stars) | Solar masses | Verify Sun = 1.0 M☉ |
| Mass (planets) | Earth masses or kg | Verify Jupiter ≈ 317.8 M⊕ |
| Orbital elements | AU, degrees, days | Standard Keplerian conventions |

---

## 10. Automated Validation Pipeline

### 10.1 Pipeline Architecture

```
ETL Output → Validation Job (Airflow task) → Report → Gate Decision → Promote or Reject
```

The validation job runs after every ETL pipeline completion, before data promotion to production.

### 10.2 Validation Steps

```python
# validation_pipeline.py (pseudocode)

def validate_etl_output(staging_schema: str) -> ValidationReport:
    report = ValidationReport()

    # Step 1: Row count checks
    for table in ['stars', 'galaxies', 'nebulae', 'clusters', 'solar_system']:
        count = db.count(f"{staging_schema}.{table}")
        prev_count = db.count(f"production.{table}")
        delta_pct = abs(count - prev_count) / prev_count * 100
        report.add_check(f"{table}_row_count", delta_pct < 5.0, f"Delta: {delta_pct:.2f}%")

    # Step 2: Null rate checks (critical columns)
    for col in ['ra', 'dec', 'magnitude']:
        null_rate = db.null_rate(f"{staging_schema}.stars", col)
        report.add_check(f"stars_{col}_null_rate", null_rate < 0.001, f"Null rate: {null_rate:.4f}")

    # Step 3: Range checks
    ra_violations = db.count_where(f"{staging_schema}.stars", "ra < 0 OR ra >= 360")
    dec_violations = db.count_where(f"{staging_schema}.stars", "dec < -90 OR dec > 90")
    report.add_check("ra_range", ra_violations == 0, f"Violations: {ra_violations}")
    report.add_check("dec_range", dec_violations == 0, f"Violations: {dec_violations}")

    # Step 4: Reference object spot-checks
    for ref_obj in REFERENCE_OBJECTS_50:
        db_obj = db.get(f"{staging_schema}.entities", ref_obj.ent_id)
        pos_err = angular_distance(db_obj.ra, db_obj.dec, ref_obj.ra, ref_obj.dec)
        report.add_check(
            f"ref_{ref_obj.name}_position",
            pos_err < ref_obj.tolerance_deg,
            f"Error: {pos_err:.6f}° (tolerance: {ref_obj.tolerance_deg}°)"
        )

    # Step 5: Tile integrity
    for tile_path in random_sample(staging_tiles, 100):
        try:
            decoded = decode_tile(tile_path)
            assert decoded.star_count > 0
            report.add_check(f"tile_{tile_path}", True)
        except Exception as e:
            report.add_check(f"tile_{tile_path}", False, str(e))

    # Step 6: Catalog cross-reference
    messier_found = 0
    for m_num in range(1, 111):
        entity = db.get_by_catalog(f"{staging_schema}", "messier", m_num)
        if entity: messier_found += 1
    report.add_check("messier_completeness", messier_found == 110, f"Found: {messier_found}/110")

    return report
```

### 10.3 Gate Decision

| Result | Action |
|--------|--------|
| All checks pass | Promote to production automatically |
| Non-critical checks fail (warnings) | Promote with notification to data team |
| Critical checks fail | Block promotion; alert data engineering team |
| Any reference object position error >10× tolerance | Block promotion; SEV-2 alert |

---

## 11. Manual Validation Procedures

### 11.1 Quarterly Visual Audit

Every quarter, a manual visual audit of 20 canonical scenes:

1. Solar system overview (all planets visible, correct relative positions)
2. Sirius close-up (correct color, brightness, companion visible in toggle)
3. Orion constellation (star pattern recognizable, nebula visible)
4. Pleiades cluster (correct star count visible, blue reflection nebulae)
5. Orion Nebula close-up (volumetric rendering, correct morphology)
6. Jupiter with moons (banding visible, Galilean moons at correct positions)
7. Saturn with rings (ring gaps visible, Cassini division)
8. Earth from 1 AU (continents recognizable, clouds, terminator)
9. Milky Way edge-on (disk structure, central bulge)
10. Andromeda Galaxy (spiral arms, companion galaxies)
11. Crab Nebula (filamentary structure, pulsar at center)
12. Sagittarius A* region (dense star field, black hole visualization)
13. Cosmic web overview (filament structure, void regions)
14. Time slider: Earth at solstice (axial tilt visible)
15. Time slider: Jupiter opposition (correct position vs Earth)
16. Scale transition: Solar → Stellar (smooth, no popping)
17. Scale transition: Stellar → Galactic (smooth)
18. Scale transition: Galactic → Cosmic (smooth)
19. AETHER V4 UI at stellar scale (CRT scanlines, terminal chrome, legible text)
20. AETHER V4 UI at solar scale (phosphor glow on planet labels)

Each scene scored: Pass / Marginal / Fail. Marginal results require issue creation. Fail blocks release.

### 11.2 Annual Data Audit

Once per year, comprehensive data audit:
- Compare 500 random Gaia stars against the latest Gaia DR3 release
- Compare all solar system body masses/radii against IAU 2024 nominal values
- Verify all exoplanet entries against NASA Exoplanet Archive (deletions, additions, updated parameters)
- Review cosmic web visualization against latest IllustrisTNG rendering
- Verify SPICE kernels are current version from NAIF

---

## 12. Accuracy Reporting

### 12.1 Validation Report Format

Each ETL validation generates a report:

```json
{
  "report_id": "val_2026q1_003",
  "etl_version": "2026.Q1.3",
  "timestamp": "2026-04-15T04:30:00Z",
  "duration_s": 340,
  "summary": {
    "total_checks": 287,
    "passed": 285,
    "warnings": 2,
    "failed": 0
  },
  "gate_decision": "PROMOTE",
  "sections": {
    "row_counts": { "passed": 5, "warnings": 0, "failed": 0 },
    "null_rates": { "passed": 12, "warnings": 0, "failed": 0 },
    "range_checks": { "passed": 8, "warnings": 0, "failed": 0 },
    "reference_objects": { "passed": 50, "warnings": 0, "failed": 0 },
    "tile_integrity": { "passed": 100, "warnings": 0, "failed": 0 },
    "catalog_xref": { "passed": 110, "warnings": 2, "failed": 0 }
  },
  "warnings": [
    { "check": "ngc_7000_position", "message": "Position 0.015° off, tolerance 0.01°" },
    { "check": "ic_5146_magnitude", "message": "Magnitude 0.15 mag off, tolerance 0.10 mag" }
  ]
}
```

### 12.2 Dashboard Integration

Validation results feed into the ETL Pipeline dashboard (Doc 31 §5.1):
- Pass/warn/fail trend over time
- Per-category accuracy scores
- Reference object position error heatmap
- Data completeness percentage by category

### 12.3 Public Data Quality Statement

The application includes a "Data Sources & Accuracy" page accessible from the footer, documenting:
- Data sources and their update frequency
- Known limitations (e.g., photometric redshift uncertainty, exoplanet mass estimation)
- Data version and last update date
- Link to validation reports (summary, non-sensitive)

---

**Revision History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-19 | System | Initial data accuracy validation specification |

---

*Document 33 of 33 — Cosmos Explorer Technical Documentation Suite*  
*Cross-references: Doc 11 (Data Model), Doc 13 (Testing Strategy §4), Doc 18 (Visual Rendering), Doc 23 (Spatial Database), Doc 25 (Backend Architecture §8), Doc 30 (Test Cases — TS-DATA/TS-VQA)*
