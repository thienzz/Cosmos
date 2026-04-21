# Data Model & API Design
## Cosmos Explorer: Interactive 3D Universe Visualization

**Version:** 1.0  
**Date:** 2026-04-16  
**Status:** Active  
**Author:** Engineering Team  
**Last Updated:** 2026-04-16

---

## 1. Data Sources Overview

This section details all primary data sources integrated into Cosmos Explorer, including their formats, update frequency, licensing, data volume, and fields used in the visualization.

| Data Source | Provider | Format | Update Frequency | License | Size | Key Fields |
|---|---|---|---|---|---|---|
| **Gaia DR3** | ESA | FITS, CSV | Quarterly releases | CC BY-SA 4.0 | ~500 GB | ra, dec, parallax, magnitude, color_indices, proper_motion, radial_velocity |
| **JPL Horizons** | NASA | ASCII ephemeris | Real-time (computed) | Public Domain | N/A (computed) | position, velocity, time_epoch |
| **SDSS DR18** | SDSS Collaboration | FITS | Annual updates | SDSS License | ~150 GB | ra, dec, redshift, magnitude, morphology, spectral_features |
| **IllustrisTNG** | Illustris Collaboration | HDF5 snapshots | Static simulation | Public License | ~300 GB | position, density, simulation_id, snapshot |
| **NGC/IC Catalog** | Multiple sources | ASCII text | Static (maintained) | Public Domain | ~5 MB | designation, type, position, size, magnitude, description |
| **Hipparcos-2** | ESA | FITS | Static (released 1997) | Public Domain | ~120 MB | hip_id, ra, dec, parallax, magnitude, spectral_type |
| **Tycho-2** | ESA | FITS | Static (released 2000) | Public Domain | ~50 MB | tyc_id, ra, dec, magnitude_bt, magnitude_vt, spectral_type |
| **NASA Exoplanet Archive** | NASA | JSON, VOTable | Weekly updates | Public Domain | ~500 MB | exoplanet_name, parent_star, orbital_period, equilibrium_temp |
| **Planck CMB Data** | ESA/Planck Collaboration | FITS HEALPix maps | Static (released 2018) | CC BY 4.0 | ~20 GB | temperature_anisotropy, polarization, frequency_bands |

### Data Source Fields & Usage

**Gaia DR3:**
- Primary stellar catalog for bright objects (G < 21 mag)
- Fields: `source_id`, `ra`, `dec`, `parallax`, `parallax_error`, `mag_g`, `bp_rp`, `teff_gspphot`, `radius_gspphot`, `luminosity_gspphot`, `mass_gspphot`, `pm_ra_cosdec`, `pm_dec`, `radial_velocity`
- Used for: star positions, colors, magnitudes, spectral properties, proper motion

**JPL Horizons:**
- Ephemeris service for solar system bodies
- Fields: computed from orbital elements (`a`, `e`, `i`, `Ω`, `ω`, `M`, `epoch`)
- Used for: planet/moon/asteroid positions at any epoch

**SDSS DR18:**
- Galaxy and quasar catalog
- Fields: `objid`, `ra`, `dec`, `z` (redshift), `petromag_u/g/r/i/z`, `specclass`, `subclass`, `sersic_n`, `axis_ratio`
- Used for: distant galaxies, galaxy morphology, luminosity distance

**IllustrisTNG:**
- Cosmic structure/web simulation data
- Fields: `pos` (3D position), `rho` (density), `type` (filament/void/sheet/knot)
- Used for: cosmic web visualization at z < 0.1

**NGC/IC Catalog:**
- Historical deep-sky object designations
- Fields: `catalog_id`, `type`, `ra`, `dec`, `angular_size`, `magnitude`, `common_name`
- Used for: nebulae, clusters, cross-reference with modern catalogs

**Hipparcos-2:**
- Ultra-precise astrometry for nearby bright stars
- Fields: `hip`, `ra`, `dec`, `parallax`, `parallax_error`, `vmag`, `sp_type`
- Used for: parallax validation, high-precision nearby star positions

**Tycho-2:**
- All-sky astrometric and photometric catalog
- Fields: `tyc1`, `tyc2`, `tyc3`, `ra`, `dec`, `bt_mag`, `vt_mag`, `spectral_type`
- Used for: filling gaps in Gaia for fainter stars, proper motion

**NASA Exoplanet Archive:**
- Confirmed exoplanet properties
- Fields: `pl_name`, `hostname`, `pl_bmassj` (mass), `pl_orbper` (period), `pl_eqt` (equilibrium temp), `pl_orbsmax` (semi-major axis)
- Used for: exoplanet orbital display, system properties

**Planck CMB:**
- Cosmic microwave background temperature anisotropies
- Fields: HEALPix map `Nside=2048`, temperature, polarization (`Q`, `U`)
- Used for: CMB visualization at z > 1000 (lookback display mode)

---

## 2. Data Processing Pipeline

The data processing pipeline transforms raw astronomical data from multiple sources into optimized, indexed structures suitable for interactive 3D visualization.

### 2.1 Raw Data Ingestion

**Process:**
1. Download from authoritative archives via HTTPS
2. Verify checksums (MD5/SHA-256) against published values
3. Store in versioned data warehouse (`/data/raw/{source}/{version}`)
4. Log ingestion metadata: timestamp, file sizes, record counts

**Ingestion Schedule:**
- Gaia DR3: Quarterly (April, July, October, January)
- SDSS: Annual (January)
- JPL Horizons: On-demand compute (no download needed)
- Exoplanet Archive: Weekly synchronization
- Others: Manual ingestion when released

### 2.2 Data Filtering & Quality Cuts

**Star Filtering (Gaia DR3):**
- Parallax error cut: `parallax_error < 0.05 * parallax` (parallax S/N > 20)
- Magnitude cut: `mag_g < 21` (visual limiting magnitude)
- Astrometric quality: `ruwe < 1.4` (Renormalized Unit Weight Error)
- Remove duplicates and known problematic sources

**Galaxy Filtering (SDSS DR18):**
- Redshift quality: `z_warning = 0` (reliable redshifts)
- Signal-to-noise: `survey_quality = 'good'`
- Magnitude limit: `petromag_r < 22`

**Solar System Bodies:**
- Exclude objects with poor orbital fits (eccentricity fit error > 10%)
- Include only objects with orbital period well-determined
- Remove withdrawn or merged entries

**Output:** Filtered datasets in intermediate format (CSV or HDF5), with filtering reasons logged for audit trail.

### 2.3 Data Transformation

**Coordinate Conversions:**
- ICRS → J2000 (negligible difference; ICRS is J2000 frame)
- Cartesian conversion: `x = (distance/parallax) * cos(dec) * cos(ra)`
- Epoch correction: proper motion application from reference epoch to J2000.0

**Color Calculation:**
- Gaia G and BP-RP indices → RGB color via Sekera et al. (2016) calibration
- SDSS ugriz photometry → RGB conversion using standard transformation matrices
- Clipping to [0, 255] range with gamma correction for display

**Stellar Property Derivation:**
- Effective temperature from `teff_gspphot` (Gaia GSP-Phot)
- Mass, radius, luminosity from `mass_gspphot`, `radius_gspphot`, `luminosity_gspphot`
- If missing, estimate from spectral type + magnitude using isochrone fitting

**Distance Derivation:**
- From parallax: `distance = 1 / parallax` (in parsecs; parallax in arcsec)
- Error propagation: `δd = d² * δπ / π` for small errors
- Cross-validation with spectroscopic distance indicators where available

**Output:** Standardized entity records with all required fields, unit-checked and validated.

### 2.4 Spatial Indexing & Optimization

**Octree Construction for Stars:**
- Build 8-level hierarchical octree in Cartesian coordinates
- Root cell: [-200, 200] × [-200, 200] × [-200, 200] parsecs (covers ~90% of Gaia data)
- Each level subdivides parent cell into 8 children
- Leaf nodes (level 8) contain ~100-1000 stars each
- Tile addressing: `z/x/y/level` (map-tile convention extended to 3D)

**Healpix Indexing for Sky Objects:**
- Use HEALPix scheme (`Nside=256`) for full-sky distributed objects (galaxies, nebulae)
- Each HEALPix pixel maps to ~0.23 deg² area
- Enables efficient culling of off-screen objects

**Level-of-Detail (LOD) Pyramid:**
- LOD0: Individual stars (full precision)
- LOD1: Binned 100-star clusters (cluster center + aggregate properties)
- LOD2: Binned 10,000-star clusters
- LOD3+: Density halos (gaussian density field sampled at coarse resolution)
- Precompute all LOD levels during processing

**Output:** Indexed tile dataset with spatial metadata for efficient streaming.

### 2.5 Binary Packaging for GPU

**Star Tile Format (Per-Tile Binary):**
```
Header (16 bytes):
  - uint32: tile_id
  - uint32: star_count
  - float32: min_distance (parsecs)
  - float32: max_distance (parsecs)

Per-Star Records (16 bytes each, packed):
  - float16: x (relative to tile center, in parsecs)
  - float16: y (relative to tile center)
  - float16: z (relative to tile center)
  - uint8: magnitude (packed 0-255, maps to G=-5 to +21)
  - uint8: color_index (packed 0-255, maps to BP-RP=-0.5 to +3.5)
  - uint8: spectral_type (0-255, enum for O/B/A/F/G/K/M/unknown)
  - uint8: reserved / flags
```

**Galaxy Catalog Format:**
```
Header (16 bytes):
  - uint32: galaxy_count
  - float32: distance_min (Mpc)
  - float32: distance_max (Mpc)
  - uint32: flags (reserved)

Per-Galaxy Records (24 bytes each):
  - float32: ra (degrees)
  - float32: dec (degrees)
  - float32: redshift
  - float16: magnitude (apparent)
  - float16: angular_size (arcminutes)
  - uint8: morphology_type (0-10, enum)
  - uint8: reserved
```

**Cosmic Web Mesh Format:**
```
Header (20 bytes):
  - uint32: vertex_count
  - uint32: index_count
  - float32: density_scale
  - uint32: flags
  - uint16: reserved

Vertex Data:
  - float32[3]: position (in Mpc)
  - float32: density (normalized 0-1)

Index Data:
  - uint16[3] or uint32[3]: triangle indices (depends on vertex count)
```

**Octree Index Format:**
```
Tree Node (12 bytes per node):
  - uint32: tile_file_offset
  - uint32: tile_size_bytes
  - uint8: child_mask (8 bits, 1 per potential child)
  - uint8: depth
  - uint16: padding / flags
```

**Output:** Binary tile files organized as `tiles/z/x/y.bin`, with master index file `index.dat`.

### 2.6 Metadata Packaging

**JSON Metadata (per-entity):**
```json
{
  "id": "gaia_1234567890",
  "type": "star",
  "name": "Sirius",
  "aliases": ["Dog Star", "Alpha Canis Majoris"],
  "ra": 101.2865,
  "dec": -16.7161,
  "distance_pc": 2.636,
  "magnitude_apparent": -1.46,
  "spectral_type": "A1V",
  "temperature_K": 10000,
  "luminosity_solar": 25.4,
  "mass_solar": 2.02,
  "radius_solar": 1.711,
  "constellation": "Canis Major",
  "catalog_ids": {
    "hipparcos": 32622,
    "gaia_dr3": 5072708048013507072,
    "tycho2": "TYC 7931-237-1"
  },
  "proper_motion_ra": 546.01,
  "proper_motion_dec": -1223.08,
  "radial_velocity": -7.6,
  "data_quality": {
    "parallax_snr": 150.2,
    "astrometric_excess_noise": 0.15,
    "source": "gaia_dr3"
  }
}
```

**Output:** Compressed JSON files (gzip) per catalog, searchable via full-text index.

### 2.7 CDN Deployment Packaging

**Release Bundle Structure:**
```
cosmos-explorer-v2026.2/
├── tiles/                    # Binary tile data
│   ├── z0/ z1/ ... z8/      # Octree levels for stars
│   └── healpix/             # HEALPix tiles for galaxies, nebulae
├── metadata/                 # JSON catalogs
│   ├── stars.json.gz
│   ├── galaxies.json.gz
│   ├── nebulae.json.gz
│   └── exoplanets.json.gz
├── meshes/                   # Pre-computed mesh data
│   ├── cosmic_web.bin
│   └── cmb_sphere.bin
├── manifest.json            # Index of all files + checksums
└── VERSION.txt              # Release metadata
```

**Manifest Structure:**
```json
{
  "version": "2026.2",
  "release_date": "2026-04-16",
  "total_size_bytes": 8500000000,
  "files": [
    {
      "path": "tiles/z0/0/0/0.bin",
      "size_bytes": 12000,
      "checksum_sha256": "abc123...",
      "lod_level": 0,
      "bounds": {"min": [-200, -200, -200], "max": [200, 200, 200]}
    }
  ]
}
```

---

## 3. Entity Data Models

All entities are defined as TypeScript interfaces reflecting the data structures used throughout the application.

### 3.1 Star

```typescript
interface Star {
  // Identification
  id: string;                        // Unique identifier (e.g., "gaia_5072708...")
  names: string[];                   // Common names (e.g., ["Sirius", "Dog Star"])
  catalogIds: {
    hipparcos?: number;
    gaia_dr3?: string;
    tycho2?: string;
    hipparcos_new?: number;
  };

  // Position & Motion (ICRS, J2000.0)
  position: Vec3;                    // Cartesian coordinates (parsecs)
  ra: number;                        // Right Ascension (degrees, 0-360)
  dec: number;                       // Declination (degrees, -90 to +90)
  distance: number;                  // Distance (parsecs)
  parallax: number;                  // Parallax (arcseconds)
  parallax_error: number;            // Parallax uncertainty (arcseconds)

  proper_motion: {
    ra: number;                      // μ_α cos(δ) (mas/yr)
    dec: number;                     // μ_δ (mas/yr)
  };
  radial_velocity?: number;          // Radial velocity (km/s)

  // Photometry & Color
  magnitude: number;                 // Apparent magnitude (V band or G band)
  magnitude_absolute?: number;       // Absolute magnitude
  color: RGB;                        // RGB color for rendering [0-1]
  color_index_bp_rp?: number;        // Gaia BP-RP color index

  // Physical Properties
  spectral_type: string;             // MK classification (e.g., "A1V")
  temperature: number;               // Effective temperature (Kelvin)
  luminosity: number;                // Luminosity (solar luminosities)
  mass: number;                      // Mass (solar masses)
  radius: number;                    // Radius (solar radii)

  // Geometric Properties
  constellation: string;             // IAU constellation designation
  surface_gravity?: number;          // Log10(g) in CGS units

  // Data Quality
  data_quality: {
    source: 'gaia_dr3' | 'hipparcos2' | 'tycho2' | 'other';
    parallax_snr?: number;           // Signal-to-noise ratio of parallax
    astrometric_quality: number;     // Quality metric (0-1)
    last_updated: string;            // ISO date
  };
}

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface RGB {
  r: number;                         // 0-1
  g: number;                         // 0-1
  b: number;                         // 0-1
}
```

### 3.2 Planet

```typescript
interface Planet {
  id: string;
  name: string;
  parentBody: string;                // Parent star ID (e.g., "gaia_123...")
  aliases: string[];

  // Orbital Dynamics (Keplerian Elements)
  orbitalElements: KeplerianElements;
  epoch: string;                     // Reference epoch (ISO date)

  // Physical Properties
  physicalProperties: {
    mass_earth_masses: number;       // Planet mass (Earth masses)
    radius_earth_radii: number;      // Planet radius (Earth radii)
    density: number;                 // kg/m³
    surface_gravity?: number;        // m/s² (if applicable)
    rotation_period?: number;        // hours
    obliquity?: number;              // axial tilt (degrees)
  };

  // Atmosphere (if present)
  atmosphere?: {
    composition: {
      molecule: string;
      abundance: number;             // Relative abundance (0-1)
    }[];
    scale_height: number;            // km
    surface_pressure?: number;       // Pa
  };

  // Ring System (if present)
  rings?: {
    semi_major_axis: number;         // km
    width: number;                   // km
    optical_depth: number;
    composition: string;
  }[];

  // Moons
  moons: string[];                   // Array of Moon IDs

  // Visualization
  texture?: string;                  // URL to texture map
  discovery_date?: string;           // ISO date
  discovery_method?: string;         // "radial_velocity", "transit", etc.
  
  // Equilibrium Temperature
  equilibrium_temperature?: number;  // Kelvin (for gaseous planets)
}

interface KeplerianElements {
  a: number;                         // Semi-major axis (AU)
  e: number;                         // Eccentricity (0-1)
  i: number;                         // Inclination (degrees)
  Omega: number;                     // Longitude of ascending node (degrees)
  omega: number;                     // Argument of perihelion (degrees)
  M: number;                         // Mean anomaly at epoch (degrees)
  P?: number;                        // Orbital period (days)
}
```

### 3.3 Moon

```typescript
interface Moon {
  id: string;
  name: string;
  parentPlanet: string;              // Parent planet ID
  
  // Orbital Dynamics
  orbitalElements: KeplerianElements;
  epoch: string;

  // Physical Properties
  physicalProperties: {
    mass_kg: number;
    radius_km: number;
    density: number;                 // kg/m³
    surface_gravity: number;         // m/s²
    escape_velocity: number;         // km/s
    rotation_period: number;         // hours (sidereal day)
    mean_surface_temperature?: number; // Kelvin
  };

  // Surface Properties
  albedo?: number;                   // Bond albedo (0-1)
  composition: string;               // e.g., "silicate_rock", "water_ice"
  
  // Visualization
  texture?: string;
  discovery_date?: string;
}
```

### 3.4 Galaxy

```typescript
interface Galaxy {
  id: string;
  name: string;
  aliases: string[];

  // Position & Distance
  position: Vec3;                    // Cartesian (Mpc, relative to Milky Way)
  ra: number;                        // degrees
  dec: number;                       // degrees
  redshift: number;                  // z
  distance_mpc: number;              // Comoving distance (Megaparsecs)
  distance_modulus?: number;         // For alternative distance derivation

  // Morphology
  type: GalaxyType;                  // Elliptical, Spiral, Lenticular, Irregular
  hubble_classification?: string;    // Extended Hubble sequence (e.g., "E5", "Sab")
  morphology: {
    axis_ratio: number;              // b/a (0-1)
    position_angle: number;          // degrees
    sersic_index?: number;           // Light profile (1.0=exponential, 4.0=de Vaucouleurs)
  };

  // Photometry
  magnitude: number;                 // Apparent magnitude (r-band typical)
  magnitude_absolute?: number;
  angular_size: number;              // Effective radius (arcminutes)
  
  // Physical Properties
  stellar_mass?: number;             // Solar masses
  star_formation_rate?: number;      // Solar masses/year
  metallicity?: number;              // [Fe/H] relative to solar
  age?: number;                      // Gigayears

  // Dynamics
  velocity_dispersion?: number;      // km/s (for elliptical galaxies)
  rotation_velocity?: number;        // km/s (for spiral galaxies)

  // Catalog References
  catalog_ids: {
    messier?: number;
    ngc?: number;
    pgc?: number;
    sdss?: string;
  };

  data_source: 'sdss_dr18' | 'illustris' | 'other';
}

type GalaxyType = 'elliptical' | 'spiral' | 'lenticular' | 'irregular' | 'unknown';
```

### 3.5 Nebula

```typescript
interface Nebula {
  id: string;
  name: string;
  aliases: string[];

  // Position & Size
  position: Vec3;                    // Cartesian (parsecs)
  ra: number;                        // degrees
  dec: number;                       // degrees
  distance: number;                  // parsecs
  angular_size: number;              // arcminutes

  // Classification
  type: NebulaType;
  morphology?: string;               // Descriptive text

  // Physical Properties
  temperature?: number;              // Kelvin
  density?: number;                  // particles/cm³
  mass?: number;                     // Solar masses
  ionizing_source?: string;          // Associated star ID (if any)

  // Spectroscopy
  emission_lines?: {
    wavelength_nm: number;
    line_id: string;                 // e.g., "H-alpha", "[OIII]"
    intensity: number;               // Relative intensity
  }[];

  // Associated Objects
  associated_stars: string[];        // Star IDs (if embedded in nebula)
  parent_cluster?: string;           // Cluster ID (if part of OB association)

  // Catalog References
  catalog_ids: {
    messier?: number;
    ngc?: number;
    ic?: number;
  };

  // Visualization
  texture?: string;
}

type NebulaType = 
  | 'emission'
  | 'reflection'
  | 'planetary'
  | 'supernova_remnant'
  | 'dark'
  | 'composite'
  | 'unknown';
```

### 3.6 Cluster

```typescript
interface Cluster {
  id: string;
  name: string;
  aliases: string[];

  // Position & Size
  position: Vec3;                    // Cartesian (parsecs)
  ra: number;                        // degrees
  dec: number;                       // degrees
  distance: number;                  // parsecs
  angular_size: number;              // arcminutes

  // Classification
  type: ClusterType;
  age?: number;                      // Megayears
  metallicity?: number;              // [Fe/H]

  // Membership
  member_count: number;
  member_stars?: string[];           // Array of member star IDs (optional, for small clusters)
  core_radius?: number;              // parsecs

  // Dynamics
  velocity_dispersion?: number;      // km/s

  // Catalog References
  catalog_ids: {
    messier?: number;
    ngc?: number;
  };
}

type ClusterType = 'globular' | 'open' | 'stellar_association' | 'unknown';
```

### 3.7 Cosmic Web Node

```typescript
interface CosmicWebNode {
  position: Vec3;                    // Cartesian (Mpc)
  density: number;                   // Normalized density (0-1)
  type: CosmicWebStructure;          // Classification

  // Optional detailed properties
  velocity_divergence?: number;      // ∇·v (1/Gyr)
  tidal_tensor?: number[][];         // 3x3 matrix for principal components
}

type CosmicWebStructure = 'filament' | 'void' | 'sheet' | 'knot' | 'unclassified';
```

### 3.8 Asteroid

```typescript
interface Asteroid {
  id: string;
  name: string;
  designation: string;               // e.g., "2023 FV13"
  aliases: string[];

  // Orbital Elements (Keplerian)
  orbitalElements: KeplerianElements;
  epoch: string;

  // Physical Properties
  diameter?: number;                 // km
  albedo?: number;                   // Bond albedo (0-1)
  absolute_magnitude?: number;
  taxonomic_type?: string;           // e.g., "C", "S", "M", "D"
  composition?: string;              // Spectral classification details

  // Dynamical Properties
  mean_motion?: number;              // degrees/day
  ascending_node_longitude?: number;
  
  // Catalog References
  catalog_ids: {
    mpc?: number;                    // Minor Planet Center number
    jplsmd?: string;                 // JPL Small-Body Node ID
  };

  // Discovery Information
  discovery_date?: string;           // ISO date
  discoverer?: string;
}
```

### 3.9 Comet

```typescript
interface Comet {
  id: string;
  name: string;
  designation: string;               // e.g., "6P/d'Arrest"
  
  // Orbital Elements
  orbitalElements: KeplerianElements;
  perihelion_distance: number;       // AU
  perihelion_date: string;           // ISO date
  aphelion_distance?: number;        // AU

  // Photometry & Activity
  magnitude: number;                 // Absolute magnitude (H parameter)
  activity_parameter?: number;       // k exponent (mag ∝ r^(-k))
  coma_diameter?: number;            // km (when active)
  tail_length?: number;              // km (at discovery/apparition)

  // Composition
  composition: {
    volatile: string[];              // e.g., ["H2O", "CO2", "CO"]
    dust_production?: number;        // kg/s at 1 AU
  };

  // Catalog References
  catalog_ids: {
    mpc?: string;
    iau_designation?: string;
  };

  // Orbital History
  number_of_apparitions?: number;
  last_perihelion?: string;          // ISO date
  next_perihelion?: string;          // ISO date (predicted)
}
```

---

## 4. Binary Data Formats

### 4.1 Star Tile Format

Each star tile is a binary file containing a header and packed star records, optimized for GPU streaming.

**File: `tiles/z{depth}/x{x}/y{y}.bin`**

**Total Header Size: 16 bytes**
```
Offset  Type      Name              Description
0       uint32    tile_id           Unique tile identifier
4       uint32    star_count        Number of star records in this tile
8       float32   min_distance      Minimum distance in tile (parsecs)
12      float32   max_distance      Maximum distance in tile (parsecs)
```

**Per-Star Record: 16 bytes (packed)**
```
Offset  Type      Name              Description
0       float16   x                 X coordinate relative to tile center (parsecs)
2       float16   y                 Y coordinate relative to tile center (parsecs)
4       float16   z                 Z coordinate relative to tile center (parsecs)
6       uint8     magnitude         G magnitude packed (0=G+5, 255=G+21)
7       uint8     color_index       BP-RP color packed (0=BP-RP-0.5, 255=BP-RP+3.5)
8       uint8     spectral_type     Spectral type enum (0=O, 1=B, ..., 7=M, 8=Unknown)
9       uint8     flags             Bit flags: has_velocity[0], has_temp[1], reserved[6]
10      uint16    catalog_index     Index into metadata JSON for full details
```

**Record Packing Details:**
- Coordinates quantized to 0.01 pc resolution (sufficient within tile)
- Magnitude range [-5, 21] mapped to [0, 255] linearly
- Color index range [-0.5, 3.5] mapped to [0, 255] linearly
- Spectral type: lookup table { O:0, B:1, A:2, F:3, G:4, K:5, M:6, Unknown:7 }

### 4.2 Galaxy Catalog Format

Full-sky galaxy catalog in binary format, indexed by HEALPix.

**File: `tiles/healpix/nside256/pix{healpix_index}.bin`**

**Total Header Size: 16 bytes**
```
Offset  Type      Name              Description
0       uint32    galaxy_count      Number of galaxies in this HEALPix pixel
4       float32   distance_min      Minimum comoving distance (Mpc)
8       float32   distance_max      Maximum comoving distance (Mpc)
12      uint32    flags             Reserved for future use
```

**Per-Galaxy Record: 24 bytes (packed)**
```
Offset  Type      Name              Description
0       float32   ra                Right Ascension (degrees, 0-360)
4       float32   dec               Declination (degrees, -90 to 90)
8       float32   redshift          Redshift (z)
12      float16   magnitude         Apparent magnitude (0.1 mag precision)
14      float16   angular_size      Angular size (arcsminutes, 0.01 precision)
16      uint8     morphology_type   Galaxy type: 0=E, 1=S0, 2=Sa, ..., 10=Irr
17      uint8     flags             Reserved
18      uint16    metadata_index    Index into metadata JSON
```

### 4.3 Cosmic Web Mesh Format

Pre-computed mesh data for cosmic web structure (filaments, voids, sheets) from N-body simulations.

**File: `meshes/cosmic_web.bin`**

**Header: 20 bytes**
```
Offset  Type      Name              Description
0       uint32    vertex_count      Total number of vertices
4       uint32    index_count       Total number of indices (for triangles: 3N)
8       float32   density_scale     Normalization factor for density values
12      uint32    version           Format version (1)
16      uint16    flags             Bit 0: indices are uint32 (else uint16)
18      uint16    padding           Reserved
```

**Vertex Data: variable**
```
Per Vertex (16 bytes if 32-bit indices, else 12 bytes):
  float32   x                 Position X (Mpc)
  float32   y                 Position Y (Mpc)
  float32   z                 Position Z (Mpc)
  float32   density           Normalized density (0-1, relative to density_scale)
```

**Index Data: variable**
```
If flags & 0x01:
  uint32[] triangle_indices   3 indices per triangle (12 bytes per triangle)
Else:
  uint16[] triangle_indices   3 indices per triangle (6 bytes per triangle)
```

### 4.4 Octree Index Format

Hierarchical index enabling fast tree traversal for spatial queries.

**File: `tiles/index.dat`**

**Root Header: 20 bytes**
```
Offset  Type      Name              Description
0       uint32    num_nodes         Total number of tree nodes
4       float32   root_x_min        Root cell X minimum (parsecs)
8       float32   root_x_max        Root cell X maximum (parsecs)
12      uint32    max_depth         Maximum tree depth (8)
16      uint32    star_count_total  Total stars across all tiles
```

**Per-Node: 12 bytes**
```
Offset  Type      Name              Description
0       uint32    tile_offset       File offset of corresponding .bin tile (or 0 if no tile)
4       uint32    tile_size         Size of tile in bytes
8       uint8     child_mask        8 bits: bit i = 1 if child i exists
9       uint8     depth             Depth in tree (0=root, 8=leaf)
10      uint16    flags             Reserved
```

**Addressing Scheme:**
- Breadth-first layout in file
- Child nodes of node N are at indices: `node_index * 8 + (child_0 to child_7)`
- Empty children skipped (indicated by child_mask)

---

## 5. Spatial Indexing

### 5.1 Octree for Stars (3D Cartesian)

**Construction Parameters:**
- Root bounds: [-200, 200] × [-200, 200] × [-200, 200] parsecs (origin at Sun)
- Depth: 8 levels
- Total tiles: ~60,000 (8¹ + 8² + ... + 8⁸)
- Estimated stars per leaf: 100-1000 (depends on galactic structure)

**Tile Addressing:**
```
z0:  0/0/0                                      (single root tile)
z1:  0/0/0, 1/0/0, 0/1/0, ...                  (8 tiles)
z2:  0/0/0, 1/0/0, 2/0/0, ...                  (64 tiles)
...
z8:  (individual tiles for ~1000-star regions)
```

**Coordinate Mapping:**
```typescript
// Given world position (x, y, z) and depth d:
function worldToTile(x: number, y: number, z: number, depth: number): [number, number, number] {
  const rootSize = 400;  // [-200, 200]
  const cellSize = rootSize / Math.pow(2, depth);
  
  const tx = Math.floor((x + 200) / cellSize);
  const ty = Math.floor((y + 200) / cellSize);
  const tz = Math.floor((z + 200) / cellSize);
  
  return [tx, ty, tz];
}
```

**Level-of-Detail Strategy:**
- LOD0 (individual stars): load when distance < 10 pc
- LOD1 (100-star bins): load when 10 < distance < 50 pc
- LOD2 (10K-star bins): load when 50 < distance < 500 pc
- LOD3+ (density fields): load when distance > 500 pc

### 5.2 Healpix for Sky Objects (Spherical)

**Parameters:**
- Nside = 256 (49,152 pixels, each ~0.23 deg²)
- Used for: galaxies, nebulae, clusters

**Pixel Indexing:**
```typescript
function raDecToHealpix(ra: number, dec: number, nside: number): number {
  // Convert RA/Dec (degrees) to theta/phi (radians)
  const theta = (90 - dec) * Math.PI / 180;
  const phi = ra * Math.PI / 180;
  return healpixLibrary.ang2pix(nside, theta, phi);
}
```

**Loading Strategy:**
- Fetch HEALPix pixel when camera points toward it
- Prefetch neighboring pixels (27-pixel cone around view center)
- Cull based on angular distance from camera center

### 5.3 Tile Loading Strategy

**Frustum Culling:**
1. Compute camera frustum (6 planes)
2. For each octree node, test AABB against frustum
3. Load tiles if node is visible and within max distance

**Distance-Based LOD:**
```typescript
function selectLOD(distance: number, pixel_size: number): number {
  if (distance < 10) return 0;          // Full resolution
  if (distance < 50) return 1;          // 10x binned
  if (distance < 500) return 2;         // 100x binned
  return 3;                             // Density field
}
```

**Streaming Priority:**
1. Tiles within frustum and close distance (LOD0) — highest priority
2. Tiles within frustum, mid distance (LOD1-2)
3. Tiles adjacent to frustum
4. Prefetch tiles along predicted camera trajectory

---

## 6. Caching Strategy

### 6.1 Multi-Level Cache Hierarchy

**L1: GPU Buffer (VRAM)**
- **Capacity:** 512 MB - 2 GB (modern GPUs)
- **Contents:** Currently visible tiles in GPU vertex/index buffers
- **Lifetime:** Frames where tile is in viewport
- **Eviction:** LRU, immediate when tile leaves frustum
- **Metrics:** Hit rate typically 95%+ for smooth camera motion

**L2: JavaScript Heap (RAM)**
- **Capacity:** 256 MB - 1 GB (browser-dependent)
- **Contents:** Recently loaded tile data, pending GPU upload
- **Lifetime:** Last 50-100 viewed tiles
- **Eviction:** LRU when capacity exceeded
- **Metrics:** Hit rate 70-80% for typical exploration sessions

**L3: IndexedDB (Persistent Storage)**
- **Capacity:** 500 MB - 2 GB (browser quota)
- **Contents:** Previously downloaded tiles, metadata catalogs
- **Lifetime:** Across sessions (until quota exceeded)
- **Eviction:** LRU with TTL (14-day expiry for tile data)
- **Metrics:** Reduces bandwidth by 30-50% for returning users

**L4: CDN (Source of Truth)**
- **Capacity:** Unlimited (S3, CloudFlare, etc.)
- **Contents:** Full dataset, all tiles and catalogs
- **Lifetime:** Permanent (versioned releases)
- **Eviction:** N/A
- **Latency:** 50-500 ms global average

### 6.2 Cache Policies

**L1 (GPU) Eviction:**
```typescript
// FIFO with frame-based timeout
if (tile.lastSeenFrame < currentFrame - 2) {
  evictFromGPU(tile);
}
```

**L2 (Heap) Eviction:**
```typescript
// LRU with soft limit
if (heapCache.size > HEAP_LIMIT) {
  const lruTile = heapCache.sortByAccessTime()[0];
  heapCache.delete(lruTile.id);
}
```

**L3 (IndexedDB) Eviction:**
```typescript
// LRU with TTL
const tileAge = Date.now() - tile.cachedAt;
if (idbCache.size > INDEXED_DB_LIMIT || tileAge > 14 * 86400000) {
  deleteFromIndexedDB(tile.id);
}
```

**Cross-Cache Coordination:**
- Tile in L1 → skip L2/L3 fetch
- Tile in L2 → queue for L1 upload, skip L3 fetch
- Tile in L3 → load to L2, queue for L1
- Tile missing → fetch from L4 CDN, populate L2 + L3

### 6.3 Preemptive Caching

**Camera Trajectory Prediction:**
```typescript
// Predict next position based on velocity
const predictedPos = camera.position + camera.velocity * 0.5;  // 0.5s ahead
const predictedTiles = octreeIndex.query(frustumAhead);
prefetchTiles(predictedTiles);
```

**Search Result Preloading:**
```typescript
// When user searches for object, load its nearby tiles immediately
searchResult.id -> fetch star details
             -> load octree path to object
             -> preload adjacent tiles at object's distance
```

---

## 7. Internal API Design

### 7.1 Data Manager

```typescript
interface DataManager {
  /**
   * Load all tiles within bounds at specified scale and LOD.
   * @param bounds 3D bounding box in parsecs
   * @param scale Zoom level (0=full sky, 1=hemisphere, etc.)
   * @param lod Level of detail (0=full res, 3=density field)
   * @returns Promise resolving to tile data array
   */
  loadRegion(
    bounds: { min: Vec3; max: Vec3 },
    scale: number,
    lod: number
  ): Promise<TileData[]>;

  /**
   * Prefetch tiles along predicted camera path.
   */
  prefetchAhead(
    predictedPosition: Vec3,
    predictedFrustum: Frustum
  ): void;

  /**
   * Clear caches at specified level.
   */
  clearCache(level: 'all' | 'gpu' | 'heap' | 'idb'): void;

  /**
   * Get cache statistics.
   */
  getCacheStats(): {
    gpu: { used_bytes: number; capacity_bytes: number };
    heap: { used_bytes: number; capacity_bytes: number };
    idb: { used_bytes: number; capacity_bytes: number };
  };
}

interface TileData {
  id: string;
  stars: Star[];
  bounds: { min: Vec3; max: Vec3 };
  lodLevel: number;
}
```

### 7.2 Catalog Service

```typescript
interface CatalogService {
  /**
   * Search for objects by name, position, or properties.
   * @param query Search term or filter object
   * @param filters Optional additional filters
   * @returns Array of matching results with scores
   */
  search(
    query: string | SearchFilter,
    filters?: SearchFilter
  ): Promise<SearchResult[]>;

  /**
   * Get all objects near specified position within radius.
   */
  nearbyObjects(
    position: Vec3,
    radiusParSecs: number,
    types?: ObjectType[]
  ): Promise<CelestialObject[]>;

  /**
   * Cross-match between catalogs.
   */
  crossmatch(
    objectId: string,
    catalogs: string[]
  ): Promise<Map<string, string>>;

  /**
   * Get detailed information about object.
   */
  getObject(objectId: string): Promise<CelestialObject | null>;
}

interface SearchFilter {
  type?: ObjectType;              // Filter by object type
  ra?: { min: number; max: number };
  dec?: { min: number; max: number };
  distance?: { min: number; max: number };
  magnitude?: { min: number; max: number };
}

type ObjectType = 'star' | 'planet' | 'galaxy' | 'nebula' | 'cluster' | 'asteroid' | 'comet';

interface SearchResult {
  objectId: string;
  objectType: ObjectType;
  displayName: string;
  score: number;               // Search relevance (0-1)
  position: Vec3;
  distance: number;            // parsecs
}
```

### 7.3 Ephemeris Service

```typescript
interface EphemerisService {
  /**
   * Get position of celestial body at specified epoch.
   * Computed client-side from orbital elements, no server calls.
   */
  getPosition(
    bodyId: string,
    epochJD: number              // Julian Date
  ): Vec3;

  /**
   * Get velocity vector at epoch.
   */
  getVelocity(
    bodyId: string,
    epochJD: number
  ): Vec3;

  /**
   * Solve Kepler's equation for any N-body system.
   */
  solveMeanAnomaly(
    meanAnomaly: number,         // radians
    eccentricity: number
  ): number;                     // true anomaly in radians

  /**
   * Get all orbital elements for body.
   */
  getOrbitalElements(
    bodyId: string,
    epochJD: number
  ): KeplerianElements;

  /**
   * Compute planet positions at current app time.
   */
  getPlanetPositions(epochJD: number): Map<string, Vec3>;

  /**
   * Compute rise/set times for object at observer location.
   */
  getRiseSetTimes(
    objectId: string,
    observerLocation: { lat: number; lon: number; elevation: number },
    startJD: number,
    endJD: number
  ): { rise: number; set: number; transit: number }[];
}
```

### 7.4 Info Service

```typescript
interface InfoService {
  /**
   * Get complete detailed information for object.
   * Includes all properties from data models.
   */
  getDetails(objectId: string): Promise<ObjectDetails>;

  /**
   * Get formatted description for UI display.
   */
  getDisplayText(objectId: string): Promise<string>;

  /**
   * Get all references to object in scientific literature.
   * (Loaded from cached metadata, not API calls)
   */
  getReferences(
    objectId: string
  ): Array<{ bibcode: string; title: string; authors: string }>;

  /**
   * Get image/texture URLs for object.
   */
  getMediaUrls(objectId: string): Promise<{
    image?: string;
    texture?: string;
    spectrumChart?: string;
  }>;
}

interface ObjectDetails {
  star?: Star;
  planet?: Planet;
  galaxy?: Galaxy;
  [key: string]: any;           // Other entity types
}
```

### 7.5 Event Bus

```typescript
interface EventBus {
  /**
   * Object selected by user.
   */
  on('object:select', (event: {
    objectId: string;
    objectType: ObjectType;
    position: Vec3;
  }) => void): void;

  /**
   * Camera scale/zoom changed.
   */
  on('scale:change', (event: {
    oldScale: number;
    newScale: number;
    lodLevel: number;
  }) => void): void;

  /**
   * Simulation time updated.
   */
  on('time:update', (event: {
    epochJD: number;
    realTime: number;           // ms elapsed
    timeScale: number;          // 1.0 = real-time, 86400 = 1 day/sec
  }) => void): void;

  /**
   * Tile loaded into cache.
   */
  on('tile:loaded', (event: {
    tileId: string;
    lodLevel: number;
    stars: number;
  }) => void): void;

  /**
   * Tile evicted from cache.
   */
  on('tile:evicted', (event: {
    tileId: string;
  }) => void): void;

  /**
   * Search completed.
   */
  on('search:complete', (event: {
    query: string;
    results: SearchResult[];
    timeMs: number;
  }) => void): void;
}
```

---

## 8. External API Design

### 8.1 URL Scheme

The application supports deep-linking via URL parameters for sharing specific views.

**Base URL:** `https://cosmos-explorer.app/`

**Parameters:**
```
#/pos=<ra>,<dec>,<distance>
  &scale=<zoom_level>
  &time=<epoch_jd>
  &obj=<object_id>
  &mode=<visualization_mode>
```

**Examples:**

```
# View Sirius at distance 2.6 pc
https://cosmos-explorer.app/#/pos=101.3,-16.7,2.6&scale=2&obj=gaia_5072708...

# View Andromeda Galaxy
https://cosmos-explorer.app/#/pos=10.7,-41.3,770000&scale=5&obj=ngc_224

# View solar system (Sun at origin)
https://cosmos-explorer.app/#/pos=0,0,0&scale=-5&time=2451545.0

# View cosmic web structure
https://cosmos-explorer.app/#/scale=8&mode=cosmic_web
```

**Parameter Details:**

| Parameter | Type | Range | Default | Description |
|---|---|---|---|---|
| `ra` | float | 0-360 | 0 | Right ascension (degrees) |
| `dec` | float | -90 to 90 | 0 | Declination (degrees) |
| `distance` | float | 0.001-Mpc | 50 | Distance (parsecs for nearby, Mpc for distant) |
| `scale` | float | -10 to 10 | 0 | Log-scale zoom (0=1 kpc, ±1 = 10x change) |
| `time` | float | - | current | Epoch as Julian Date (2451545 = J2000.0) |
| `obj` | string | - | none | Object ID to center/highlight |
| `mode` | string | stars, planets, galaxies, nebulae, cosmic_web, cmb | stars | Display mode |

### 8.2 iframe Embed

Applications can embed Cosmos Explorer in an iframe and communicate via postMessage.

**HTML Embedding:**
```html
<iframe
  id="cosmos-explorer"
  src="https://cosmos-explorer.app/embed"
  style="width: 800px; height: 600px;"
  allow="fullscreen"
></iframe>
```

**postMessage API:**

```typescript
// Parent page sends command to iframe
const explorer = document.getElementById('cosmos-explorer');

// Navigate to object
explorer.contentWindow.postMessage({
  action: 'navigate',
  payload: {
    objectId: 'gaia_5072708...',
    duration: 2000  // animation duration in ms
  }
}, 'https://cosmos-explorer.app');

// Listen for events from iframe
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://cosmos-explorer.app') return;
  
  const { action, payload } = event.data;
  
  if (action === 'object:selected') {
    console.log('User selected:', payload.objectId);
  }
});
```

**Supported Messages:**

```typescript
// From parent → iframe
interface PostMessageCommand {
  action: 'navigate' | 'search' | 'setTime' | 'setMode';
  payload: any;
}

// Navigate to object
{ action: 'navigate', payload: { objectId: string, duration: number } }

// Search for object
{ action: 'search', payload: { query: string } }

// Set simulation time
{ action: 'setTime', payload: { epochJD: number } }

// Change display mode
{ action: 'setMode', payload: { mode: 'stars' | 'planets' | 'galaxies' | 'cosmic_web' } }

// From iframe → parent
interface PostMessageEvent {
  action: 'object:selected' | 'search:complete' | 'error';
  payload: any;
}

// Object was selected
{ action: 'object:selected', payload: { objectId: string, objectType: string } }

// Search completed
{ action: 'search:complete', payload: { query: string, results: SearchResult[] } }

// Error occurred
{ action: 'error', payload: { message: string, code: string } }
```

### 8.3 Plugin Interface

Custom data layers can be registered via a plugin system.

```typescript
interface CosmosExplorerPlugin {
  /**
   * Plugin metadata
   */
  name: string;
  version: string;
  description: string;

  /**
   * Initialize plugin when app loads
   */
  initialize(api: CosmosExplorerAPI): Promise<void>;

  /**
   * Register custom data layer
   */
  registerDataLayer(layer: CustomDataLayer): void;

  /**
   * Handle object selection in custom layer
   */
  onObjectSelect?(objectId: string): void;

  /**
   * Cleanup on unload
   */
  destroy?(): void;
}

interface CustomDataLayer {
  /**
   * Unique identifier for layer
   */
  id: string;

  /**
   * Display name in UI
   */
  label: string;

  /**
   * Get objects in region
   */
  queryRegion(
    bounds: { min: Vec3; max: Vec3 }
  ): Promise<CustomObject[]>;

  /**
   * Render layer to canvas/WebGL context
   */
  render(
    context: WebGLRenderingContext,
    mvpMatrix: Matrix4
  ): void;
}

interface CustomObject {
  id: string;
  position: Vec3;
  label: string;
  color?: RGB;
  size?: number;
  metadata?: Record<string, any>;
}

/**
 * API exposed to plugins
 */
interface CosmosExplorerAPI {
  /**
   * Get current camera state
   */
  getCamera(): CameraState;

  /**
   * Navigate to position
   */
  navigateTo(position: Vec3, duration: number): Promise<void>;

  /**
   * Register custom object type for selection
   */
  registerObjectType(
    type: string,
    handler: (objectId: string) => void
  ): void;

  /**
   * Access data manager for caching
   */
  dataManager: DataManager;

  /**
   * Get event bus for listening to app events
   */
  events: EventBus;
}
```

**Plugin Registration:**
```typescript
// Load plugin from URL
import plugin from 'https://example.com/my-plugin.js';
cosmosExplorer.registerPlugin(plugin);
```

---

## 9. Data Refresh Strategy

### 9.1 Static Data Releases

**Release Schedule:**
- **Quarterly:** New Gaia DR3 data, updated astrometry, proper motions
- **Annual:** SDSS updates, exoplanet archive updates
- **Ad-hoc:** When new major surveys available (LSST, Vera Rubin)

**Release Process:**
1. Download latest catalogs from archives
2. Run data processing pipeline (filter, transform, index)
3. Generate tile set and metadata
4. Create versioned bundle: `cosmos-explorer-v{YYYY.Q}.tar.gz`
5. Upload to CDN with versioning
6. Publish release notes with changelog
7. Auto-update app manifest

**Versioning Scheme:**
- `v2026.2` = 2026, Q2 release (April-June)
- `v2026.2.1` = patch release (bug fixes to 2026.2 data)

### 9.2 Computed Data (No Runtime API Calls)

**JPL Horizons Ephemeris:**
- All planet/moon positions computed client-side from orbital elements
- Kepler solver runs in JavaScript worker
- No network requests needed at runtime
- Orbital elements updated with data releases (quarterly)

**Exoplanet Orbits:**
- Semi-major axis, eccentricity from NASA Exoplanet Archive
- Stored in metadata catalogs
- Positions computed on-demand from Keplerian elements

**Coordinate Transformations:**
- All coordinate conversions (ICRS, galactic, ecliptic) computed locally
- No external service dependencies
- Pre-computed for static data at release time

### 9.3 Future: Live Updates

**Planned (Post-v1.0):**
- Near-Earth Object Confirmation Page API (NASA)
  - Live asteroid positions
  - Real-time discovery alerts
  - Impact probability estimates
- International Astronomical Union (IAU) Name Resolution
  - Newly named objects
  - Designation updates

**Architecture:**
- Optional API module (disabled by default)
- Cached responses in IndexedDB
- Fallback to static catalog if API unavailable
- Rate limiting (max 100 req/min per session)

---

## 10. Data Validation & Quality

### 10.1 Cross-Reference Validation

**Gaia ↔ Hipparcos Matching:**
```typescript
// Verify consistency between catalogs for bright nearby stars
function validateGaiaHipparcosMatch(gaiaStar: Star, hipparcosStar: Star): QualityScore {
  const posDelta = distance(gaiaStar.position, hipparcosStar.position);
  const magDelta = Math.abs(gaiaStar.magnitude - hipparcosStar.magnitude);
  
  // Both should agree within measurement errors
  return {
    astrometricQuality: 1.0 - Math.min(1.0, posDelta / 0.001),  // <1 mas match
    photometricQuality: 1.0 - Math.min(1.0, magDelta / 0.1),    // <0.1 mag match
    overallScore: 0.5 * astrometricQuality + 0.5 * photometricQuality
  };
}
```

**Parallax Validation:**
- Reject parallax measurements with error > 20% of value
- Cross-check with photometric distance estimates
- Flag parallax zero-points drift (systematic errors)

**Magnitude Consistency:**
- Ensure no star has impossible color indices (e.g., BP-RP < -0.5)
- Verify magnitude ordering across bands: u < g < r < i < z
- Reject outliers (> 5σ from color-magnitude relation)

### 10.2 Outlier Detection

**Color-Magnitude Diagram Outliers:**
```typescript
function detectOutliers(stars: Star[]): Star[] {
  // Fit reference sequence for each spectral type
  const sequences = fitColorMagnitudeSequences(stars);
  
  // Mark stars deviating > 3σ from sequence
  return stars.filter(star => {
    const expectedMag = sequences[star.spectralType].predictMagnitude(star.color);
    const deviance = Math.abs(star.magnitude - expectedMag) / sequences[star.spectralType].sigma;
    return deviance > 3.0;  // 3σ outliers
  });
}
```

**Proper Motion Outliers:**
- Flag stars with proper motion > 10 arcsec/yr (high-velocity objects)
- Cross-check against known stellar associations
- Verify against galactic rotation models

**Radial Velocity Outliers:**
- Check for consistency with spectroscopic parallax
- Verify high-velocity stars are not binaries (spectral widening)

### 10.3 Unit Testing

**Coordinate Conversion Tests:**
```typescript
describe('Coordinate Conversion', () => {
  test('ICRS to Cartesian and back', () => {
    const ra = 101.2865;
    const dec = -16.7161;
    const distance = 2.636;
    
    const cartesian = icrsToCartesian(ra, dec, distance);
    const [ra2, dec2, dist2] = cartesianToICRS(cartesian);
    
    expect(ra2).toBeCloseTo(ra, 6);
    expect(dec2).toBeCloseTo(dec, 6);
    expect(dist2).toBeCloseTo(distance, 4);
  });
});
```

**Magnitude Calculation:**
```typescript
test('Color index to RGB conversion', () => {
  const bpRp = 0.5;  // A-type star
  const rgb = bpRpToRGB(bpRp);
  
  // A-type stars should be white (equal RGB)
  expect(rgb.r).toBeCloseTo(255, 10);
  expect(rgb.g).toBeCloseTo(255, 10);
  expect(rgb.b).toBeCloseTo(230, 10);  // Slightly blue-deficient
});
```

### 10.4 Regression Testing

**Known Object Positions:**
Test against verified astronomical databases for well-known objects.

```typescript
const knownObjects = [
  { id: 'sirius', expectedRa: 101.2865, expectedDec: -16.7161, epoch: 2000.0 },
  { id: 'vega', expectedRa: 279.2345, expectedDec: 38.7849, epoch: 2000.0 },
  { id: 'polaris', expectedRa: 37.9537, expectedDec: 89.2642, epoch: 2000.0 },
];

knownObjects.forEach(obj => {
  test(`Position of ${obj.id}`, () => {
    const star = catalog.getObject(obj.id);
    expect(star.ra).toBeCloseTo(obj.expectedRa, 4);
    expect(star.dec).toBeCloseTo(obj.expectedDec, 4);
  });
});
```

**Ephemeris Regression:**
```typescript
test('Planet position matches JPL Horizons', () => {
  const epoch = 2451545.0;  // J2000.0
  const marsPos = ephemeris.getPosition('mars', epoch);
  const expectedPos = jplHorizonsTruth.getPosition('mars', epoch);
  
  // Should match within 0.1 AU over 2 centuries
  expect(marsPos).toBeVectorCloseTo(expectedPos, 0.0001);
});
```

---

## Appendix: Change Log

### Version 1.0 (2026-04-16)
- Initial release
- 9 primary data sources integrated
- 8-level octree with 60K tiles
- Full TypeScript entity models
- Binary tile formats optimized for GPU
- Multi-level caching architecture
- Internal API (DataManager, CatalogService, EphemerisService)
- External API with URL scheme and iframe embed
- Plugin system for custom data layers
- Data validation and quality checking framework

---

## 10. Extended Entity Type System (Added v2.0)

### 10.1 Entity Classification Schema

All 96 entity types from Doc 22 v4.2 are classified using a hierarchical ID system:

```typescript
type EntityCategory = 
  | 'stars'        // ENT-1000 series, 31 types
  | 'planets'      // ENT-2000 series, 27 types
  | 'moons'        // ENT-3000 series, 15 types
  | 'small-bodies' // ENT-4000 series, 20 types
  | 'nebulae'      // ENT-5000 series, 14 types
  | 'galaxies'     // ENT-6000 series, 19 types
  | 'large-scale'  // ENT-7000 series, 12 types
  | 'exotic';      // ENT-8000 series, 16 types

interface EntityTypeDefinition {
  id: string;              // e.g., "ENT-2037"
  category: EntityCategory;
  name: string;            // e.g., "Carbon Planet (Diamond World)"
  shaderFamily: string;    // e.g., "planet-exotic"
  
  // Physical properties (from Doc 22)
  properties: {
    temperature?: { min: number; max: number; unit: 'K' };
    mass?: { min: number; max: number; unit: string };
    radius?: { min: number; max: number; unit: string };
    luminosity?: { min: number; max: number; unit: string };
    color: string;         // hex color
    [key: string]: any;    // type-specific properties
  };
  
  // Rendering configuration
  rendering: {
    shaderFamily: string;
    uniforms: Record<string, number | number[]>;
    particleCount?: { min: number; max: number };
    lodLevels: LODConfig[];
    volumetric?: boolean;  // true for nebulae
  };
  
  // Scale visibility
  visibleAtScales: number[];  // which S0-S6 levels show this entity
  
  // Search/browse metadata
  searchTerms: string[];
  realExamples: { name: string; data: Record<string, any> }[];
}

interface LODConfig {
  level: 0 | 1 | 2 | 3 | 4;
  maxDistance: number;     // in current scale units
  renderMethod: 'full' | 'simplified' | 'billboard' | 'point' | 'icon';
  particleMultiplier: number;  // 1.0 at L0, 0.0 at L4
}
```

### 10.2 Entity Instance Schema

```typescript
interface EntityInstance {
  id: string;              // unique instance ID
  typeId: string;          // references EntityTypeDefinition.id
  name: string;            // e.g., "55 Cancri e"
  
  // Position in universe
  position: {
    x: number; y: number; z: number;  // log-scale coordinates
    scaleLevel: number;               // primary scale level
  };
  
  // Instance-specific overrides
  propertyOverrides?: Partial<EntityTypeDefinition['properties']>;
  renderingOverrides?: Partial<EntityTypeDefinition['rendering']>;
  
  // Relationships
  parentId?: string;       // e.g., planet's star, moon's planet
  childIds?: string[];     // e.g., star's planets
  
  // Data source
  catalogIds?: {           // cross-references to real catalogs
    hipparcos?: string;
    gaia?: string;
    ngc?: string;
    messier?: string;
    exoplanetArchive?: string;
  };
}
```

### 10.3 Binary Data Format Extensions

Extend existing binary formats to support 96 types:

```
EntityRecord (48 bytes):
  - position: Float32 × 3 = 12 bytes
  - typeId: Uint16 = 2 bytes (supports up to 65535 types)
  - instanceFlags: Uint16 = 2 bytes (LOD state, visibility, selection)
  - propertyPack: Float32 × 6 = 24 bytes (temperature, mass, radius, luminosity, color_r, color_g)
  - seed: Uint32 = 4 bytes (procedural variation seed)
  - reserved: 4 bytes
```

### 10.4 Spatial Index Extensions

Octree leaf nodes now store entity category for fast filtering:
```typescript
interface OctreeLeaf {
  entities: EntityInstance[];
  categoryCounts: Map<EntityCategory, number>;  // fast category filtering
  lodState: Map<string, number>;                // current LOD per entity
  boundingSphere: { center: vec3; radius: number };
}
```

### 10.5 API Extensions

```
GET /api/entities/types                    → all 96 type definitions
GET /api/entities/types/:category          → types in category
GET /api/entities/search?q=carbon&cat=planets → filtered search
GET /api/entities/nearby?x=&y=&z=&scale=  → spatial query
GET /api/entities/:id                      → single instance
GET /api/entities/:id/children             → hierarchical children
```

---

## Document Metadata

**Prepared by:** Cosmos Explorer Engineering Team  
**Version:** 2.0  
**Date:** 2026-04-16  
**Review Status:** Enterprise Grade  
**Audience:** Developers, Data Engineers, DevOps  
**Classification:** Public  
**Notes:** Extended to support 96 entity types (Doc 22 v4.2).  
**Related Documents:**
- 10-architecture-overview.md (system design)
- 12-rendering-pipeline.md (graphics implementation)
- 13-performance-optimization.md (benchmarks and tuning)
