# Cosmos Explorer — Backend Architecture & Data Infrastructure

**Document:** 25 — Backend Architecture & Data Infrastructure  
**Version:** 1.0  
**Date:** 2026-04-19  
**Status:** Published  
**Product:** Cosmos Explorer — Interactive 3D Universe Visualization  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Data Scale Analysis](#3-data-scale-analysis)
4. [Database Layer](#4-database-layer)
5. [Search Infrastructure](#5-search-infrastructure)
6. [API Gateway & Service Layer](#6-api-gateway)
7. [Tile Server — Spatial Data Streaming](#7-tile-server)
8. [ETL Pipeline — Data Ingestion & Processing](#8-etl-pipeline)
9. [Ephemeris Computation Service](#9-ephemeris-service)
10. [FITS File Processing Service](#10-fits-processing)
11. [Caching Architecture](#11-caching-architecture)
12. [CDN & Edge Distribution](#12-cdn-edge)
13. [Scaling Strategy & Capacity Planning](#13-scaling)
14. [Observability & Monitoring](#14-observability)
15. [Security & Data Governance](#15-security)
16. [Disaster Recovery & Data Durability](#16-disaster-recovery)
17. [Infrastructure Cost Model](#17-cost-model)
18. [Deployment Architecture](#18-deployment)
19. [SRS Cross-Reference](#19-srs-crossref)

---

## 1. Executive Summary

This document defines the complete backend architecture for Cosmos Explorer — the server-side infrastructure required to serve, process, search, and stream astronomical data at scale. It addresses critical gaps in the current documentation (Docs 09–12), which specify a client-heavy architecture with a "thin backend." While the frontend rendering pipeline is well-designed for GPU-bound visualization, the data volumes involved (~1.2 TB raw from 9 scientific sources) demand a production-grade backend with spatial databases, search indexing, tile streaming, caching layers, and computational services.

### Why a Backend Is Mandatory

The client-side architecture described in Doc 09 works for a prototype serving pre-computed tiles from static CDN. For a production system serving the full scope of Cosmos Explorer's requirements, the following capabilities require server-side infrastructure:

**Search at scale.** 1.8 billion stars (Gaia DR3) + 1 million galaxies (SDSS DR18) + 5,800 exoplanetary systems cannot be indexed client-side. A full-text and spatial search engine is required.

**Dynamic spatial queries.** Observer and Research modes require filtering by magnitude, spectral type, redshift, distance, constellation, and arbitrary catalog fields. These are database queries, not pre-computed tiles.

**Ephemeris computation.** Calculating positions of 200+ solar system bodies at arbitrary epochs requires server-side numerical integration (JPL SPICE kernels), not client-side JavaScript.

**FITS file processing.** Research mode data import accepts FITS format — a binary astronomical data standard that requires specialized parsing libraries (astropy/cfitsio) unavailable in browsers.

**Tile generation and streaming.** The 8.5 GB tile dataset must be served with spatial awareness — loading only tiles visible in the viewport frustum at the current LOD level, with sub-100ms latency.

**Data freshness.** Gaia updates quarterly, SDSS annually, exoplanet archive weekly. An ETL pipeline must ingest, validate, transform, and deploy new data without downtime.

### Architecture Principles

1. **Compute where appropriate.** Heavy spatial queries, ephemeris math, and FITS parsing run server-side. Rendering, physics simulation, and interactive state run client-side.
2. **Pre-compute aggressively.** Static tile pyramids, search indices, and LOD hierarchies are built during ETL, not at query time.
3. **Stream progressively.** The client never downloads the full dataset. It streams tiles based on viewport, LOD, and user intent.
4. **Cache everything cacheable.** Tile responses, search results, and ephemeris calculations are deterministic and highly cacheable.
5. **Scale horizontally.** Stateless API services behind a load balancer, with shared state only in databases and caches.

### Cross-Reference Documents

| Doc | Relationship |
|-----|-------------|
| 09 — System Architecture | Frontend architecture → this doc extends with backend |
| 10 — Technical Specifications | Client tech stack → this doc specifies server tech stack |
| 11 — Data Model & API Design | Data sources & formats → this doc specifies production pipeline |
| 12 — Performance & Optimization | Client performance → this doc specifies server performance |
| 23 — Spatial Universe Database | Catalog definitions → this doc specifies how catalogs are stored/served |
| SRS | Functional requirements → mapped in Section 19 |

---

## 2. Architecture Overview

### 2.1 High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER'S BROWSER                                  │
│                                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ React UI     │  │ Three.js     │  │ Web Workers  │  │ IndexedDB    │    │
│  │ (State/Panels│  │ Renderer     │  │ (Data Parse  │  │ (Local Cache │    │
│  │  Controls)   │  │ (WebGL 2.0)  │  │  Octree)     │  │  Offline)    │    │
│  └──────┬───────┘  └──────────────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                                     │                 │            │
│         └────────────────┬────────────────────┘                 │            │
│                          │ HTTP/REST + WebSocket                │            │
└──────────────────────────┼──────────────────────────────────────┼────────────┘
                           │                                      │
                           ▼                                      ▼
┌──────────────────────────────────────────────┐    ┌─────────────────────────┐
│              CDN EDGE LAYER                   │    │   IndexedDB Sync        │
│  (CloudFront / Fastly / Cloudflare)          │    │   (Service Worker)      │
│                                               │    └─────────────────────────┘
│  • Static assets (JS/CSS/fonts)              │
│  • Pre-computed tile pyramids                 │
│  • Texture atlases (KTX2/WebP)               │
│  • Cached API responses (TTL-based)          │
│  • Edge compute (Cloudflare Workers)         │
│                                               │
└──────────────────┬───────────────────────────┘
                   │ Cache MISS → Origin
                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY                                        │
│  (Kong / AWS API Gateway / Traefik)                                          │
│                                                                               │
│  • Rate limiting (per-IP, per-key)                                           │
│  • Request routing                                                           │
│  • API key validation (Research mode)                                        │
│  • CORS enforcement                                                          │
│  • Request/response logging                                                  │
│  • WebSocket upgrade handling                                                │
│                                                                               │
└──────┬──────────┬──────────┬──────────┬──────────┬──────────┬───────────────┘
       │          │          │          │          │          │
       ▼          ▼          ▼          ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ TILE     │ │ SEARCH   │ │ CATALOG  │ │ EPHEMERIS│ │ FITS     │ │ EXPORT   │
│ SERVER   │ │ SERVICE  │ │ API      │ │ SERVICE  │ │ PROCESSOR│ │ SERVICE  │
│          │ │          │ │          │ │          │ │          │ │          │
│ Spatial  │ │ Elastic- │ │ PostGIS  │ │ SPICE    │ │ astropy  │ │ Render   │
│ tile     │ │ search   │ │ queries  │ │ kernel   │ │ cfitsio  │ │ queue    │
│ streaming│ │ 8.x      │ │ REST     │ │ compute  │ │ parse    │ │ video    │
│          │ │          │ │          │ │          │ │          │ │ export   │
└────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
     │            │            │            │            │            │
     ▼            ▼            ▼            ▼            ▼            ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                        │
│                                                                               │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                 │
│  │ PostgreSQL 16  │  │ Elasticsearch  │  │ Redis Cluster  │                 │
│  │ + PostGIS 3.4  │  │ 8.x            │  │ 7.x            │                 │
│  │                │  │                │  │                │                 │
│  │ • Star catalog │  │ • Full-text    │  │ • Tile cache   │                 │
│  │ • Galaxy cat.  │  │   search index │  │ • Ephemeris    │                 │
│  │ • Exoplanets   │  │ • Autocomplete │  │   cache        │                 │
│  │ • Spatial idx  │  │ • Fuzzy match  │  │ • Session      │                 │
│  │ • Entity meta  │  │ • Faceted      │  │   state        │                 │
│  │ • User data    │  │   filters      │  │ • Rate limit   │                 │
│  └────────────────┘  └────────────────┘  │   counters     │                 │
│                                           └────────────────┘                 │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                 │
│  │ Object Storage │  │ TimescaleDB    │  │ Message Queue  │                 │
│  │ (S3 / MinIO)   │  │ (Timeseries)   │  │ (RabbitMQ /    │                 │
│  │                │  │                │  │  Bull)          │                 │
│  │ • Raw catalogs │  │ • Ephemeris    │  │                │                 │
│  │ • Tile files   │  │   pre-computed │  │ • ETL jobs     │                 │
│  │ • Textures     │  │ • Telemetry    │  │ • Export queue │                 │
│  │ • FITS uploads │  │ • Usage stats  │  │ • FITS parse   │                 │
│  │ • Export files │  │                │  │   jobs         │                 │
│  └────────────────┘  └────────────────┘  └────────────────┘                 │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                         ETL PIPELINE (OFFLINE)                               │
│                                                                               │
│  ┌─────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐ │
│  │ Ingest  │ →  │ Validate │ →  │Transform │ →  │  Index   │ →  │ Deploy │ │
│  │         │    │ & Filter │    │ & Enrich │    │ & Tile   │    │ & Swap │ │
│  │ Gaia    │    │          │    │          │    │          │    │        │ │
│  │ SDSS    │    │ Quality  │    │ Coord    │    │ Octree   │    │ Blue/  │ │
│  │ JPL     │    │ cuts     │    │ convert  │    │ build    │    │ Green  │ │
│  │ Exo.Arc │    │ Dedup    │    │ Color    │    │ ES index │    │ deploy │ │
│  │ Planck  │    │ Checksums│    │ derive   │    │ Tile gen │    │        │ │
│  └─────────┘    └──────────┘    └──────────┘    └──────────┘    └────────┘ │
│                                                                               │
│  Orchestration: Apache Airflow / Dagster                                     │
│  Compute: Kubernetes Jobs / AWS Batch                                        │
│  Storage: S3 raw → S3 processed → PostGIS + ES + CDN                        │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Service Inventory

| Service | Language | Purpose | Instances | Stateless |
|---------|----------|---------|-----------|-----------|
| Tile Server | Rust / Go | Spatial tile streaming, binary serialization | 2-8 | Yes |
| Search Service | Node.js / Python | Elasticsearch queries, autocomplete, facets | 2-4 | Yes |
| Catalog API | Node.js (Fastify) | Entity CRUD, filtering, metadata, user data | 2-4 | Yes |
| Ephemeris Service | Python (FastAPI) | SPICE kernel computation, orbit propagation | 2-4 | Yes |
| FITS Processor | Python (Celery) | Async FITS parsing, column detection, preview | 1-2 | Yes |
| Export Service | Node.js / Python | Video render queue, publication figure export | 1-2 | Yes |
| ETL Pipeline | Python (Airflow) | Data ingestion, transformation, deployment | 1 (scheduler) | N/A |
| API Gateway | Kong / Traefik | Routing, rate limiting, auth, CORS | 2 (HA) | Yes |

---

## 3. Data Scale Analysis

### 3.1 Raw Data Volumes

| Source | Raw Size | Records | Update Frequency | Processing Time |
|--------|----------|---------|-----------------|-----------------|
| Gaia DR3 | 500 GB | 1.8 billion stars | Quarterly | ~12 hours |
| SDSS DR18 | 150 GB | 1 million galaxies (spectroscopic) | Annual | ~4 hours |
| IllustrisTNG | 300 GB | Simulation snapshots | Static | ~8 hours (one-time) |
| NASA Exoplanet Archive | 500 MB | 5,800+ systems | Weekly | ~5 minutes |
| NGC/IC Catalog | 5 MB | ~13,000 objects | Static | <1 minute |
| Hipparcos-2 | 120 MB | 118,218 stars | Static | <1 minute |
| Tycho-2 | 50 MB | 2.5 million stars | Static | ~2 minutes |
| Planck CMB | 20 GB | HEALPix Nside=2048 | Static | ~1 hour |
| JPL SPICE Kernels | 2 GB | Solar system ephemerides | Semi-annual | ~10 minutes |
| **TOTAL** | **~973 GB** | **~1.8 billion** | — | — |

### 3.2 Processed Data Volumes

After quality filtering, transformation, and indexing:

| Dataset | Processed Size | Record Count | Storage Format |
|---------|---------------|-------------|----------------|
| Star catalog (PostGIS) | 85 GB | 117,955,000 (filtered from 1.8B) | PostgreSQL rows |
| Star tiles (binary) | 6.2 GB | 117.9M stars in octree tiles | Binary .bin files |
| Galaxy catalog (PostGIS) | 4.8 GB | 932,000 galaxies | PostgreSQL rows |
| Galaxy tiles (binary) | 420 MB | 932K in HEALPix tiles | Binary .bin files |
| Exoplanet catalog | 180 MB | 5,800 systems, 6,200 planets | PostgreSQL + JSON |
| Nebulae/clusters | 95 MB | 18,000 objects | PostgreSQL rows |
| Cosmic web mesh | 1.2 GB | ~50M vertices | Binary mesh files |
| CMB sphere | 320 MB | HEALPix Nside=512 (downsampled) | Binary texture |
| Search index (ES) | 12 GB | All entities combined | Elasticsearch shards |
| Ephemeris pre-computed | 2.4 GB | 200 bodies × 100 years × 1-day step | TimescaleDB |
| Texture atlas | 8.5 GB | Planet/nebula/galaxy textures | KTX2 + WebP |
| **TOTAL (production)** | **~121 GB** | — | — |

### 3.3 Filtering Strategy — Why 117.9M Not 1.8B

The full Gaia DR3 catalog of 1.8 billion sources cannot be served to browser clients. The filtering strategy reduces to 117.9 million high-quality stars:

**Parallax S/N > 5:** Eliminates stars with unreliable distances (removes ~1.2B sources). Parallax_error < 0.2 * parallax ensures positional accuracy within 20%.

**Magnitude cut G < 20.7:** Removes the faintest objects below practical visualization threshold. Stars fainter than G=20.7 are invisible at any useful rendering scale.

**RUWE < 1.4:** Renormalized Unit Weight Error filter removes astrometrically problematic sources (binaries with poor fits, artifacts).

**Duplicate removal:** Cross-match Gaia with Hipparcos-2 and Tycho-2, preferring Gaia measurements but retaining legacy catalog IDs.

**Result:** 117.9 million stars with reliable 3D positions (RA, Dec, distance), colors (BP-RP), magnitudes (G), and temperatures (Teff). This is the largest high-quality 3D star catalog deliverable to a web client via progressive tile streaming.

---

## 4. Database Layer

### 4.1 PostgreSQL 16 + PostGIS 3.4

**Primary relational database** for all structured entity data with spatial indexing.

#### Schema Design

```sql
-- Core entity table (all celestial objects)
CREATE TABLE entities (
    id              BIGSERIAL PRIMARY KEY,
    ent_id          VARCHAR(10) NOT NULL UNIQUE,  -- ENT-1001, ENT-2003, etc.
    entity_type     SMALLINT NOT NULL,            -- Doc 22 type code
    category        SMALLINT NOT NULL,            -- 1=Star, 2=Planet, ... 8=Exotic
    name            TEXT NOT NULL,
    aliases         TEXT[],                        -- Alternative names
    catalog_ids     JSONB,                         -- {hipparcos: 32349, gaia_dr3: "..."}
    
    -- Spatial (ICRS J2000.0)
    ra              DOUBLE PRECISION NOT NULL,     -- degrees, 0-360
    dec_coord       DOUBLE PRECISION NOT NULL,     -- degrees, -90 to +90
    distance_pc     DOUBLE PRECISION,              -- parsecs (NULL for unknown)
    galactic_l      DOUBLE PRECISION,              -- galactic longitude
    galactic_b      DOUBLE PRECISION,              -- galactic latitude
    position_3d     geometry(PointZ, 4326),         -- PostGIS 3D point (RA, Dec, distance)
    
    -- Physical properties (JSONB for schema flexibility per type)
    properties      JSONB NOT NULL DEFAULT '{}',
    
    -- Metadata
    data_source     VARCHAR(20),                   -- gaia_dr3, sdss_dr18, jpl, etc.
    data_quality    REAL,                          -- 0-1 quality score
    last_updated    TIMESTAMPTZ DEFAULT NOW(),
    
    -- Search optimization
    search_vector   tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', name), 'A') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(aliases, ' '), '')), 'B')
    ) STORED
);

-- Spatial index (R-tree via GIST)
CREATE INDEX idx_entities_position ON entities USING GIST (position_3d);

-- Category + magnitude compound index for filtered queries
CREATE INDEX idx_entities_category_mag ON entities (category, (properties->>'magnitude_apparent')::real);

-- Full-text search index
CREATE INDEX idx_entities_search ON entities USING GIN (search_vector);

-- ENT ID lookup
CREATE INDEX idx_entities_ent_id ON entities (ent_id);

-- Constellation filter
CREATE INDEX idx_entities_constellation ON entities ((properties->>'constellation'));
```

```sql
-- Star-specific table (denormalized for performance on 117.9M rows)
CREATE TABLE stars (
    id                  BIGSERIAL PRIMARY KEY,
    entity_id           BIGINT REFERENCES entities(id),
    source_id_gaia      BIGINT,                    -- Gaia DR3 source_id
    
    -- Astrometry
    ra                  DOUBLE PRECISION NOT NULL,
    dec_coord           DOUBLE PRECISION NOT NULL,
    parallax            REAL,                       -- mas
    parallax_error      REAL,                       -- mas
    pm_ra               REAL,                       -- mas/yr (proper motion)
    pm_dec              REAL,                       -- mas/yr
    radial_velocity     REAL,                       -- km/s
    
    -- Photometry
    mag_g               REAL NOT NULL,              -- Gaia G magnitude
    mag_bp              REAL,                       -- Blue photometer
    mag_rp              REAL,                       -- Red photometer
    bp_rp               REAL,                       -- Color index
    
    -- Derived properties
    teff                REAL,                       -- Effective temperature (K)
    luminosity          REAL,                       -- Solar luminosities
    radius_solar        REAL,                       -- Solar radii
    mass_solar          REAL,                       -- Solar masses
    spectral_type       VARCHAR(10),                -- O5V, G2V, M3III, etc.
    
    -- Rendering (pre-computed for GPU)
    color_rgb           INTEGER,                    -- Packed RGB (0xRRGGBB)
    render_size         REAL,                       -- Apparent size in viewport units
    lod_level           SMALLINT,                   -- Pre-assigned LOD tier
    
    -- Spatial
    position_3d         geometry(PointZ, 4326),
    octree_tile_id      INTEGER                     -- Pre-assigned tile
) PARTITION BY RANGE (mag_g);

-- Partition by magnitude for query performance
CREATE TABLE stars_bright    PARTITION OF stars FOR VALUES FROM (MINVALUE) TO (6.0);
CREATE TABLE stars_naked_eye PARTITION OF stars FOR VALUES FROM (6.0) TO (10.0);
CREATE TABLE stars_binocular PARTITION OF stars FOR VALUES FROM (10.0) TO (14.0);
CREATE TABLE stars_telescope PARTITION OF stars FOR VALUES FROM (14.0) TO (18.0);
CREATE TABLE stars_faint     PARTITION OF stars FOR VALUES FROM (18.0) TO (MAXVALUE);

-- Spatial index per partition
CREATE INDEX idx_stars_bright_pos ON stars_bright USING GIST (position_3d);
CREATE INDEX idx_stars_naked_pos  ON stars_naked_eye USING GIST (position_3d);
CREATE INDEX idx_stars_binoc_pos  ON stars_binocular USING GIST (position_3d);
CREATE INDEX idx_stars_tele_pos   ON stars_telescope USING GIST (position_3d);
CREATE INDEX idx_stars_faint_pos  ON stars_faint USING GIST (position_3d);

-- Composite index for tile server queries
CREATE INDEX idx_stars_tile ON stars (octree_tile_id, lod_level);
```

```sql
-- Galaxy catalog
CREATE TABLE galaxies (
    id              BIGSERIAL PRIMARY KEY,
    entity_id       BIGINT REFERENCES entities(id),
    objid_sdss      BIGINT,
    
    ra              DOUBLE PRECISION NOT NULL,
    dec_coord       DOUBLE PRECISION NOT NULL,
    redshift        REAL,
    distance_mpc    REAL,                          -- Megaparsecs
    
    mag_u           REAL,
    mag_g           REAL,
    mag_r           REAL,
    mag_i           REAL,
    mag_z           REAL,
    
    morphology      VARCHAR(10),                   -- Sa, Sb, E0, Irr, etc.
    sersic_n        REAL,
    axis_ratio      REAL,
    angular_size    REAL,                          -- arcminutes
    
    mass_solar      DOUBLE PRECISION,              -- Solar masses
    sfr             REAL,                          -- Star formation rate (M☉/yr)
    has_agn         BOOLEAN DEFAULT FALSE,
    
    position_3d     geometry(PointZ, 4326),
    healpix_idx     INTEGER                        -- HEALPix Nside=256 pixel
);

CREATE INDEX idx_galaxies_pos ON galaxies USING GIST (position_3d);
CREATE INDEX idx_galaxies_redshift ON galaxies (redshift);
CREATE INDEX idx_galaxies_healpix ON galaxies (healpix_idx);
CREATE INDEX idx_galaxies_morphology ON galaxies (morphology);
```

```sql
-- Solar system bodies (planets, moons, asteroids, comets)
CREATE TABLE solar_system_bodies (
    id              SERIAL PRIMARY KEY,
    entity_id       BIGINT REFERENCES entities(id),
    naif_id         INTEGER UNIQUE,                -- JPL NAIF SPICE ID
    body_type       VARCHAR(20),                   -- planet, moon, asteroid, comet, dwarf_planet
    parent_naif_id  INTEGER,                       -- Parent body (Sun=10, Jupiter=599, etc.)
    
    -- Keplerian elements (J2000.0 epoch)
    semi_major_au   DOUBLE PRECISION,
    eccentricity    DOUBLE PRECISION,
    inclination     DOUBLE PRECISION,              -- degrees
    lon_asc_node    DOUBLE PRECISION,              -- degrees
    arg_periapsis   DOUBLE PRECISION,              -- degrees
    mean_anomaly    DOUBLE PRECISION,              -- degrees at epoch
    epoch_jd        DOUBLE PRECISION,              -- Julian date of elements
    
    -- Physical
    mass_kg         DOUBLE PRECISION,
    radius_km       DOUBLE PRECISION,
    density         REAL,                          -- g/cm³
    albedo          REAL,
    rotation_period DOUBLE PRECISION,              -- hours
    axial_tilt      REAL,                          -- degrees
    
    -- Atmosphere & composition
    atmosphere      JSONB,                         -- {N2: 78.08, O2: 20.95, ...}
    surface_comp    JSONB,
    
    -- Rendering
    texture_id      VARCHAR(50),                   -- Reference to texture asset
    ring_system     JSONB,                         -- Ring parameters if applicable
    moon_count      INTEGER DEFAULT 0
);

CREATE INDEX idx_ssb_naif ON solar_system_bodies (naif_id);
CREATE INDEX idx_ssb_parent ON solar_system_bodies (parent_naif_id);
CREATE INDEX idx_ssb_type ON solar_system_bodies (body_type);
```

```sql
-- Exoplanet systems
CREATE TABLE exoplanets (
    id              SERIAL PRIMARY KEY,
    entity_id       BIGINT REFERENCES entities(id),
    planet_name     TEXT NOT NULL,
    host_star       TEXT NOT NULL,
    
    -- Orbital
    orbital_period  DOUBLE PRECISION,              -- days
    semi_major_au   DOUBLE PRECISION,
    eccentricity    REAL,
    inclination     REAL,                          -- degrees
    
    -- Physical
    mass_jupiter    REAL,
    radius_jupiter  REAL,
    density         REAL,                          -- g/cm³
    equilibrium_temp REAL,                         -- K
    
    -- Detection
    detection_method VARCHAR(30),                  -- transit, radial_velocity, imaging, etc.
    discovery_year  INTEGER,
    discovery_facility TEXT,
    
    -- Habitability
    in_habitable_zone BOOLEAN,
    esi              REAL,                         -- Earth Similarity Index (0-1)
    
    -- Host star reference
    host_star_entity_id BIGINT REFERENCES entities(id)
);

CREATE INDEX idx_exo_host ON exoplanets (host_star);
CREATE INDEX idx_exo_method ON exoplanets (detection_method);
CREATE INDEX idx_exo_hz ON exoplanets (in_habitable_zone) WHERE in_habitable_zone = TRUE;
```

```sql
-- User bookmarks & observation logs
CREATE TABLE user_bookmarks (
    id          SERIAL PRIMARY KEY,
    session_id  UUID NOT NULL,                     -- Anonymous session (no login required)
    entity_id   BIGINT REFERENCES entities(id),
    label       TEXT,
    notes       TEXT,
    view_state  JSONB,                             -- Camera position, zoom, time
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE observation_logs (
    id          SERIAL PRIMARY KEY,
    session_id  UUID NOT NULL,
    entity_id   BIGINT REFERENCES entities(id),
    observed_at TIMESTAMPTZ,
    location    geometry(Point, 4326),             -- Observer location
    conditions  JSONB,                             -- Seeing, transparency, etc.
    notes       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

#### PostgreSQL Configuration (Production)

```
# postgresql.conf (tuned for spatial queries on 117.9M rows)
shared_buffers = 16GB              # 25% of 64GB RAM
effective_cache_size = 48GB        # 75% of RAM
work_mem = 256MB                   # Per-query sort/hash memory
maintenance_work_mem = 2GB         # For VACUUM, CREATE INDEX
max_worker_processes = 16
max_parallel_workers_per_gather = 8
max_parallel_workers = 16

# WAL configuration
wal_level = replica
max_wal_size = 4GB
checkpoint_completion_target = 0.9

# PostGIS specific
random_page_cost = 1.1             # SSD storage
effective_io_concurrency = 200     # SSD parallel reads

# Connection pooling (use PgBouncer)
max_connections = 200
```

**Hardware:** 64GB RAM, 16 cores, 2TB NVMe SSD, PostgreSQL 16 with PostGIS 3.4.

---

### 4.2 TimescaleDB — Ephemeris Time Series

Pre-computed positions for solar system bodies stored as hypertable:

```sql
CREATE TABLE ephemeris_positions (
    body_naif_id    INTEGER NOT NULL,
    epoch_jd        DOUBLE PRECISION NOT NULL,     -- Julian date
    x_au            DOUBLE PRECISION NOT NULL,     -- Heliocentric X (AU)
    y_au            DOUBLE PRECISION NOT NULL,
    z_au            DOUBLE PRECISION NOT NULL,
    vx_au_day       DOUBLE PRECISION,              -- Velocity X (AU/day)
    vy_au_day       DOUBLE PRECISION,
    vz_au_day       DOUBLE PRECISION,
    PRIMARY KEY (body_naif_id, epoch_jd)
);

-- Convert to hypertable (TimescaleDB)
SELECT create_hypertable('ephemeris_positions', 'epoch_jd',
    chunk_time_interval => 365.25);  -- 1-year chunks

-- Continuous aggregate for quick lookups
CREATE MATERIALIZED VIEW ephemeris_daily
WITH (timescaledb.continuous) AS
SELECT body_naif_id,
       time_bucket(1.0, epoch_jd) AS epoch_day,
       AVG(x_au) AS x_au, AVG(y_au) AS y_au, AVG(z_au) AS z_au
FROM ephemeris_positions
GROUP BY body_naif_id, time_bucket(1.0, epoch_jd);
```

**Pre-computed range:** 200 bodies × 36,525 days (1900–2100) × 1-day resolution = 7.3 million rows. Sub-day precision computed on-demand by the Ephemeris Service using SPICE kernel interpolation.

---

## 5. Search Infrastructure

### 5.1 Elasticsearch 8.x

Full-text search, autocomplete, and faceted filtering for all entity types.

#### Index Design

```json
{
  "cosmos_entities": {
    "settings": {
      "number_of_shards": 5,
      "number_of_replicas": 1,
      "analysis": {
        "analyzer": {
          "entity_name": {
            "type": "custom",
            "tokenizer": "standard",
            "filter": ["lowercase", "asciifolding", "edge_ngram_filter"]
          },
          "catalog_id": {
            "type": "custom",
            "tokenizer": "keyword",
            "filter": ["lowercase"]
          }
        },
        "filter": {
          "edge_ngram_filter": {
            "type": "edge_ngram",
            "min_gram": 2,
            "max_gram": 15
          }
        }
      }
    },
    "mappings": {
      "properties": {
        "name":             { "type": "text", "analyzer": "entity_name",
                              "fields": { "raw": { "type": "keyword" } } },
        "aliases":          { "type": "text", "analyzer": "entity_name" },
        "ent_id":           { "type": "keyword" },
        "category":         { "type": "integer" },
        "entity_type":      { "type": "integer" },
        "constellation":    { "type": "keyword" },
        "catalog_ids":      { "type": "object", "enabled": true },
        
        "ra":               { "type": "double" },
        "dec":              { "type": "double" },
        "distance_pc":      { "type": "double" },
        "position_geo":     { "type": "geo_point" },
        
        "magnitude":        { "type": "float" },
        "spectral_type":    { "type": "keyword" },
        "temperature":      { "type": "float" },
        "luminosity":       { "type": "float" },
        "mass_solar":       { "type": "float" },
        "redshift":         { "type": "float" },
        "morphology":       { "type": "keyword" },
        
        "data_source":      { "type": "keyword" },
        "data_quality":     { "type": "float" },
        
        "suggest":          { "type": "completion",
                              "contexts": [
                                { "name": "category", "type": "category" }
                              ] }
      }
    }
  }
}
```

#### Search Query Types

**Autocomplete (as-you-type):**
```json
{
  "suggest": {
    "entity-suggest": {
      "prefix": "andro",
      "completion": {
        "field": "suggest",
        "size": 10,
        "contexts": { "category": ["star", "galaxy"] },
        "fuzzy": { "fuzziness": 1 }
      }
    }
  }
}
```
Target latency: <50ms. Returns: "Andromeda Galaxy", "Andromeda Constellation", "Andromedae (Lambda)".

**Full-text search with filters:**
```json
{
  "query": {
    "bool": {
      "must": [
        { "multi_match": {
            "query": "emission nebula orion",
            "fields": ["name^3", "aliases^2", "constellation"],
            "type": "best_fields",
            "fuzziness": "AUTO"
        }}
      ],
      "filter": [
        { "term": { "category": 5 } },
        { "range": { "magnitude": { "lte": 10.0 } } },
        { "range": { "distance_pc": { "lte": 2000 } } }
      ]
    }
  },
  "highlight": { "fields": { "name": {}, "aliases": {} } },
  "size": 20
}
```
Target latency: <100ms for 12GB index.

**Spatial search (cone search):**
```json
{
  "query": {
    "bool": {
      "filter": [
        { "geo_distance": {
            "distance": "5deg",
            "position_geo": { "lat": -5.39, "lon": 83.82 }
        }},
        { "range": { "magnitude": { "lte": 12.0 } } }
      ]
    }
  },
  "sort": [{ "magnitude": "asc" }],
  "size": 100
}
```

**Catalog ID lookup:**
```json
{
  "query": {
    "bool": {
      "should": [
        { "term": { "catalog_ids.messier": "M42" } },
        { "term": { "catalog_ids.ngc": "NGC 1976" } },
        { "term": { "catalog_ids.hipparcos": 26727 } }
      ]
    }
  }
}
```

### 5.2 Search Performance Targets

| Query Type | Latency P50 | Latency P99 | Index Size |
|-----------|-------------|-------------|-----------|
| Autocomplete | <30ms | <80ms | 12 GB |
| Full-text + filters | <80ms | <200ms | 12 GB |
| Cone search (5° radius) | <100ms | <300ms | 12 GB |
| Catalog ID lookup | <10ms | <30ms | 12 GB |
| Faceted aggregation | <150ms | <400ms | 12 GB |

---

## 6. API Gateway & Service Layer

### 6.1 API Endpoints

```
BASE URL: https://api.cosmosexplorer.app/v1

── Entities ──────────────────────────────────────────────
GET    /entities/:id                    Single entity by internal ID
GET    /entities/ent/:entId             Single entity by ENT ID (ENT-1001)
GET    /entities/catalog/:catalog/:id   Lookup by catalog (messier/M42, ngc/NGC1976)

── Search ────────────────────────────────────────────────
GET    /search?q=...&category=...&mag_max=...&limit=...
GET    /search/autocomplete?q=...&category=...
GET    /search/cone?ra=...&dec=...&radius=...&mag_max=...
POST   /search/advanced                 Complex query with JSONB filters

── Tiles ─────────────────────────────────────────────────
GET    /tiles/stars/:z/:x/:y/:level     Binary star tile by octree address
GET    /tiles/galaxies/:healpix_idx     Binary galaxy tile by HEALPix pixel
GET    /tiles/cosmic-web/:sector        Cosmic web mesh sector
GET    /tiles/manifest                  Tile manifest with checksums

── Ephemeris ─────────────────────────────────────────────
GET    /ephemeris/:naifId?epoch=...     Single body position at epoch (JD)
POST   /ephemeris/batch                 Multiple bodies at multiple epochs
GET    /ephemeris/range/:naifId?start=...&end=...&step=...

── Solar System ──────────────────────────────────────────
GET    /solar-system/bodies             All solar system bodies with elements
GET    /solar-system/bodies/:naifId     Single body with full properties

── FITS Processing ───────────────────────────────────────
POST   /fits/upload                     Upload FITS file for parsing
GET    /fits/:jobId/status              Check parse job status
GET    /fits/:jobId/preview             Get parsed data preview (first 100 rows)
GET    /fits/:jobId/columns             Get detected column metadata
POST   /fits/:jobId/render              Submit render request with column mapping

── Export ────────────────────────────────────────────────
POST   /export/video                    Submit video render job
POST   /export/image                    High-res image render
GET    /export/:jobId/status            Check export job status
GET    /export/:jobId/download          Download completed export

── User Data ─────────────────────────────────────────────
POST   /bookmarks                       Save bookmark (session-based)
GET    /bookmarks?session=...           List bookmarks for session
DELETE /bookmarks/:id
POST   /observations                    Save observation log entry
GET    /observations?session=...        List observations

── System ────────────────────────────────────────────────
GET    /health                          Health check
GET    /version                         API version, data version, last ETL
GET    /stats                           Public usage statistics
```

### 6.2 Response Formats

**Entity response (JSON):**
```json
{
  "id": 5072708048,
  "ent_id": "ENT-1001",
  "name": "Sirius",
  "category": 1,
  "category_name": "Stars",
  "entity_type": 1001,
  "type_name": "Main Sequence Star",
  "aliases": ["Dog Star", "Alpha Canis Majoris", "HIP 32349"],
  "position": {
    "ra": 101.2865,
    "dec": -16.7161,
    "distance_pc": 2.636,
    "distance_ly": 8.60,
    "galactic_l": 227.23,
    "galactic_b": -8.89,
    "cartesian": { "x": -1.81, "y": 0.72, "z": -1.78 }
  },
  "properties": {
    "spectral_type": "A1V",
    "temperature_k": 9940,
    "luminosity_solar": 25.4,
    "mass_solar": 2.063,
    "radius_solar": 1.711,
    "magnitude_apparent": -1.46,
    "magnitude_absolute": 1.42,
    "age_gyr": 0.242,
    "constellation": "Canis Major",
    "proper_motion_ra": -546.01,
    "proper_motion_dec": -1223.08,
    "radial_velocity_kms": -5.5,
    "bp_rp_color": 0.009,
    "companion": "Sirius B (white dwarf)"
  },
  "catalog_ids": {
    "hipparcos": 32349,
    "gaia_dr3": "5072708048013507072",
    "tycho2": "TYC 5949-2777-1",
    "hd": 48915,
    "sao": 151881
  },
  "data_source": "gaia_dr3",
  "data_quality": 0.99,
  "toggles": ["corona", "chromosphere", "stellar_wind", "companion_orbit"],
  "_links": {
    "self": "/v1/entities/ent/ENT-1001",
    "tile": "/v1/tiles/stars/3/12/5/2",
    "neighbors": "/v1/search/cone?ra=101.29&dec=-16.72&radius=1&mag_max=6"
  }
}
```

**Tile response (Binary):** As specified in Doc 11 Section 2.5 — packed binary with 16-byte header + 16 bytes per star. Served with `Content-Type: application/octet-stream`, `Content-Encoding: br` (Brotli).

### 6.3 Rate Limiting

| Tier | Requests/min | Burst | Tile bandwidth/hr | Auth |
|------|-------------|-------|-------------------|------|
| Anonymous | 60 | 10/s | 500 MB | None |
| Registered | 300 | 30/s | 2 GB | API key |
| Research | 1,000 | 100/s | 10 GB | API key + institution |
| Internal | Unlimited | — | Unlimited | Service token |

---

## 7. Tile Server — Spatial Data Streaming

### 7.1 Architecture

The tile server is the highest-traffic backend service. It serves pre-computed binary tiles to the client based on viewport frustum and LOD level. Written in **Rust** for maximum throughput and minimal latency.

```
Client Request: GET /tiles/stars/5/128/64/3
                     ↓
                  z=5 (octree depth)
                  x=128, y=64 (tile coordinates)
                  level=3 (LOD level)
                     ↓
┌──────────────────────────────────────┐
│ Tile Server (Rust, actix-web)        │
│                                      │
│ 1. Check Redis cache                 │
│    → HIT: return cached binary       │
│    → MISS: continue                  │
│                                      │
│ 2. Map tile address to file path     │
│    tiles/z5/128/64.bin               │
│                                      │
│ 3. Read from SSD / Object Storage    │
│                                      │
│ 4. Apply LOD filter if level < max   │
│    (downsample to requested LOD)     │
│                                      │
│ 5. Compress (Brotli level 4)         │
│                                      │
│ 6. Cache in Redis (TTL 24h)          │
│                                      │
│ 7. Return binary response            │
│    Content-Type: application/octet   │
│    Cache-Control: public, max-age=   │
│       86400, immutable               │
└──────────────────────────────────────┘
```

### 7.2 Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Latency P50 (cache hit) | <5ms | Redis in-memory |
| Latency P50 (cache miss) | <25ms | SSD read + Brotli compress |
| Latency P99 | <100ms | Under load |
| Throughput | 50,000 req/s | Per instance (Rust) |
| Tile size (compressed) | 10-200 KB | Varies by density |
| Concurrent connections | 10,000 | Per instance |

### 7.3 Tile Addressing

**Star tiles (octree):** `z/x/y/level` — z=octree depth (0-8), x,y=octree coordinates, level=LOD level (0-3). Total tiles: ~65,000 at max depth.

**Galaxy tiles (HEALPix):** `healpix_idx` — Nside=256 yields 786,432 pixels. ~60% populated with data. Total tiles: ~470,000.

**Cosmic web (sectors):** 64 sectors (4×4×4 grid), each containing mesh vertices for filament/void structure. Total: 64 tiles, ~20 MB each.

### 7.4 Adaptive Tile Loading

The client requests tiles based on viewport frustum + camera distance:

```
Camera at 10 AU from Sun → load star tiles z=6-8 (nearby, high detail)
Camera at 1 kpc          → load star tiles z=3-5 (medium detail)
Camera at 1 Mpc          → load galaxy tiles (HEALPix)
Camera at 100 Mpc        → load cosmic web sectors
```

The tile manifest (served once, cached indefinitely) contains bounding boxes for all tiles, enabling the client to compute which tiles to request without server-side frustum queries.

---

## 8. ETL Pipeline — Data Ingestion & Processing

### 8.1 Pipeline Architecture (Apache Airflow)

```
DAG: cosmos_etl_gaia_quarterly
├── Task: download_gaia_dr3_update
│   ├── Source: https://gea.esac.esa.int/archive/
│   ├── Format: FITS tables (CSV export)
│   └── Size: ~50-100 GB per quarterly delta
├── Task: validate_checksums
├── Task: apply_quality_filters
│   ├── Parallax S/N > 5
│   ├── RUWE < 1.4
│   └── Magnitude < 20.7
├── Task: transform_coordinates
│   ├── ICRS → Cartesian 3D
│   ├── Compute galactic coords
│   └── Apply proper motion to J2000.0
├── Task: derive_properties
│   ├── BP-RP → RGB color
│   ├── Parallax → distance
│   └── Teff → spectral type (if missing)
├── Task: build_octree_tiles
│   ├── Assign stars to octree nodes
│   ├── Generate binary tile files
│   └── Compute LOD pyramids
├── Task: update_postgres
│   ├── Upsert into stars table
│   └── Update entities table
├── Task: rebuild_elasticsearch_index
│   ├── Re-index affected entities
│   └── Rebuild completion suggestions
├── Task: deploy_tiles_to_cdn
│   ├── Upload new tiles to S3
│   ├── Invalidate CDN cache for changed tiles
│   └── Update tile manifest
├── Task: run_validation_tests
│   ├── Spot-check 100 random stars
│   ├── Verify total counts
│   └── Compare with previous release
└── Task: notify_completion
    └── Slack / email notification
```

### 8.2 ETL Schedule

| Pipeline | Frequency | Duration | Data Volume | Trigger |
|----------|-----------|----------|------------|---------|
| Gaia DR3 quarterly | Every 3 months | ~12 hours | 50-100 GB delta | Scheduled |
| SDSS DR18 annual | Yearly (Jan) | ~4 hours | 10-20 GB delta | Manual |
| Exoplanet Archive | Weekly (Sun 02:00) | ~5 minutes | <10 MB delta | Scheduled |
| JPL SPICE kernels | Semi-annual | ~10 minutes | <500 MB | Manual |
| NGC/IC corrections | Ad-hoc | <1 minute | <1 MB | Manual |

### 8.3 Blue-Green Deployment for Data

Data updates use blue-green deployment to avoid downtime:

1. ETL writes to **staging** tables (stars_staging, entities_staging)
2. Validation tests run against staging data
3. If passed: atomic table swap (`ALTER TABLE stars RENAME TO stars_old; ALTER TABLE stars_staging RENAME TO stars;`)
4. CDN tile deployment via versioned paths (`/tiles/v2026.3/...`)
5. Client fetches new manifest → discovers new tile version → streams updated tiles
6. Old data retained for 7 days, then dropped

---

## 9. Ephemeris Computation Service

### 9.1 Architecture

Python FastAPI service wrapping NASA's SPICE toolkit (SpiceyPy) for precise solar system body positions at arbitrary epochs.

```python
# ephemeris_service.py
from fastapi import FastAPI, Query
from spiceypy import spiceypy as spice
import numpy as np

app = FastAPI()

# Load SPICE kernels at startup
KERNELS = [
    "de440.bsp",          # Planetary ephemeris (1550-2650)
    "jup365.bsp",         # Jupiter system
    "sat441.bsp",         # Saturn system
    "ura111.bsp",         # Uranus system
    "nep097.bsp",         # Neptune system
    "plu058.bsp",         # Pluto system
    "naif0012.tls",       # Leap seconds
    "pck00011.tpc",       # Planetary constants
]

@app.on_event("startup")
def load_kernels():
    for k in KERNELS:
        spice.furnsh(f"/data/spice/{k}")

@app.get("/v1/ephemeris/{naif_id}")
async def get_position(
    naif_id: int,
    epoch: float = Query(..., description="Julian Date"),
    frame: str = Query("ECLIPJ2000", description="Reference frame"),
    observer: int = Query(10, description="Observer NAIF ID (10=Sun)")
):
    """Compute position of body at given epoch."""
    et = spice.unitim(epoch, "JED", "ET")
    state, lt = spice.spkez(naif_id, et, frame, "NONE", observer)
    
    pos_km = state[:3]
    vel_kms = state[3:]
    pos_au = pos_km / 149597870.7  # km to AU
    
    return {
        "naif_id": naif_id,
        "epoch_jd": epoch,
        "frame": frame,
        "position_au": {"x": pos_au[0], "y": pos_au[1], "z": pos_au[2]},
        "velocity_au_day": {
            "x": vel_kms[0] * 86400 / 149597870.7,
            "y": vel_kms[1] * 86400 / 149597870.7,
            "z": vel_kms[2] * 86400 / 149597870.7
        },
        "light_time_s": lt
    }

@app.post("/v1/ephemeris/batch")
async def batch_positions(request: BatchRequest):
    """Compute positions of multiple bodies at multiple epochs."""
    results = []
    for body_id in request.naif_ids:
        for epoch in request.epochs:
            et = spice.unitim(epoch, "JED", "ET")
            state, lt = spice.spkez(body_id, et, request.frame, "NONE", request.observer)
            pos_au = state[:3] / 149597870.7
            results.append({
                "naif_id": body_id,
                "epoch_jd": epoch,
                "x": pos_au[0], "y": pos_au[1], "z": pos_au[2]
            })
    return {"results": results, "count": len(results)}
```

### 9.2 Pre-computation Strategy

For common time ranges, positions are pre-computed and stored in TimescaleDB (Section 4.2):

| Range | Bodies | Step | Rows | Purpose |
|-------|--------|------|------|---------|
| 1900–2100 | 8 planets + Sun | 1 day | 1.3M | Time slider default range |
| 1900–2100 | 200 moons | 1 day | 14.6M | Moon positions |
| 1900–2100 | 50 major asteroids | 1 day | 3.7M | Named asteroid visualization |
| 2020–2030 | 5,800 exoplanet hosts | 10 days | 2.1M | Exoplanet system animation |

**On-demand computation:** For epochs outside pre-computed range, or for sub-day precision (needed during time slider scrubbing), the Ephemeris Service computes in real-time using SPICE. Latency: <5ms per body per epoch.

### 9.3 Caching

Ephemeris results are deterministic (same inputs → same outputs). Redis caching with composite key:

```
Key:   eph:{naif_id}:{epoch_jd_rounded}:{frame}
TTL:   30 days (data never changes for given epoch)
Size:  ~100 bytes per entry
```

Cache hit ratio target: >95% during typical time slider usage (users tend to explore nearby epochs).

---

## 10. FITS File Processing Service

### 10.1 Architecture

Asynchronous file processing service for Research mode data import (Doc 24, Screen S-13.0). Accepts FITS, CSV, and VOTable uploads.

```
Client uploads file → POST /v1/fits/upload
                      ↓
              ┌───────────────────┐
              │ API receives file  │
              │ Validates size     │
              │ (<500 MB limit)    │
              │ Assigns job ID     │
              │ Stores in S3       │
              └───────┬───────────┘
                      │ Enqueue job
                      ▼
              ┌───────────────────┐
              │ Celery Worker      │
              │                    │
              │ 1. Download from   │
              │    S3              │
              │ 2. Detect format   │
              │    (FITS/CSV/VOT)  │
              │ 3. Parse headers   │
              │ 4. Auto-detect     │
              │    columns:        │
              │    - RA (degrees)  │
              │    - Dec (degrees) │
              │    - Redshift      │
              │    - Magnitude     │
              │    - Name/label    │
              │ 5. Extract first   │
              │    100 rows for    │
              │    preview         │
              │ 6. Compute stats   │
              │    (min/max/mean   │
              │     per column)    │
              │ 7. Store results   │
              │    in Redis        │
              │ 8. Update job      │
              │    status          │
              └───────────────────┘
```

### 10.2 Column Auto-Detection

```python
# FITS column name patterns → semantic mapping
COLUMN_PATTERNS = {
    'ra': [r'^ra$', r'^raj2000$', r'^ra_j2000$', r'^right.?asc', r'^_raj2000$'],
    'dec': [r'^dec$', r'^dej2000$', r'^dec_j2000$', r'^declination', r'^_dej2000$'],
    'redshift': [r'^z$', r'^redshift$', r'^z_spec$', r'^z_phot$'],
    'magnitude': [r'^mag', r'^vmag$', r'^gmag$', r'^rmag$', r'^petromag'],
    'name': [r'^name$', r'^object$', r'^target$', r'^designation$'],
    'distance': [r'^dist', r'^distance$', r'^parallax$'],
}
```

### 10.3 Limits

| Parameter | Limit | Reason |
|-----------|-------|--------|
| File size | 500 MB | Worker memory constraint |
| Row count | 1,000,000 | Client rendering limit |
| Column count | 100 | Practical UI limit |
| Concurrent jobs | 10 | Worker pool size |
| Job TTL | 24 hours | Cleanup expired results |
| Preview rows | 100 | Quick validation |

---

## 11. Caching Architecture

### 11.1 Redis Cluster 7.x

Three-tier caching strategy:

```
┌─────────────────────────────────────────────────┐
│                   L1: CDN Edge                   │
│  TTL: 24h (tiles), 1h (search), 5m (ephemeris)  │
│  Hit ratio target: 85%                           │
└───────────────────────┬─────────────────────────┘
                        │ MISS
                        ▼
┌─────────────────────────────────────────────────┐
│                  L2: Redis Cluster               │
│  6 nodes (3 primary + 3 replica)                │
│  Memory: 32 GB total (16 GB per primary)         │
│  Hit ratio target: 95%                           │
└───────────────────────┬─────────────────────────┘
                        │ MISS
                        ▼
┌─────────────────────────────────────────────────┐
│              L3: PostgreSQL / S3                  │
│  Source of truth                                 │
└─────────────────────────────────────────────────┘
```

### 11.2 Cache Key Design

```
# Tile cache
tile:stars:{z}:{x}:{y}:{level}:{data_version}
tile:galaxies:{healpix_idx}:{data_version}
tile:cosmic_web:{sector}:{data_version}

# Search cache
search:{sha256(query_json)}
autocomplete:{prefix}:{category}

# Ephemeris cache
eph:{naif_id}:{epoch_jd_floor}:{frame}

# Entity cache
entity:{ent_id}
entity:catalog:{catalog}:{id}

# FITS job cache
fits:{job_id}:status
fits:{job_id}:preview
fits:{job_id}:columns

# Rate limit counters
ratelimit:{ip}:{minute}
ratelimit:{api_key}:{minute}
```

### 11.3 Cache Invalidation

**Tile invalidation:** Tiles are versioned (`data_version` in key). New ETL produces new version → old keys expire naturally (TTL 7 days). No explicit invalidation needed.

**Search invalidation:** Elasticsearch index rebuilt during ETL → Redis search cache TTL = 1 hour (short enough to pick up changes within 1 hour of ETL completion).

**Ephemeris invalidation:** Deterministic results → never invalidated. SPICE kernel update → increment version in key.

### 11.4 Redis Memory Budget

| Cache Type | Key Count | Avg Value Size | Total Memory |
|-----------|-----------|---------------|-------------|
| Star tiles (hot) | ~10,000 | 50 KB | 500 MB |
| Galaxy tiles (hot) | ~5,000 | 30 KB | 150 MB |
| Search results | ~50,000 | 2 KB | 100 MB |
| Autocomplete | ~100,000 | 500 B | 50 MB |
| Ephemeris | ~500,000 | 100 B | 50 MB |
| Entity detail | ~200,000 | 1 KB | 200 MB |
| Rate limit counters | ~100,000 | 16 B | 2 MB |
| FITS jobs | ~1,000 | 10 KB | 10 MB |
| **Total** | — | — | **~1.1 GB** |

Well within 16 GB per primary node. Remaining capacity handles spikes and hot-key amplification.

---

## 12. CDN & Edge Distribution

### 12.1 CDN Strategy (CloudFront / Fastly)

```
Origin: api.cosmosexplorer.app (API Gateway)
       + tiles.cosmosexplorer.app (S3 tile bucket)
       + static.cosmosexplorer.app (S3 static assets)

Edge PoPs: 200+ global locations
Cache behaviors:

  /static/*          → TTL: 1 year, immutable (hashed filenames)
  /tiles/v*/stars/*  → TTL: 7 days (versioned tiles)
  /tiles/v*/galaxies/* → TTL: 7 days
  /textures/*        → TTL: 30 days (KTX2/WebP, immutable with hash)
  /v1/search/*       → TTL: 60s (short, varies with query)
  /v1/ephemeris/*    → TTL: 24h (deterministic)
  /v1/entities/*     → TTL: 1h
  /v1/fits/*         → TTL: 0 (no cache, dynamic)
  /v1/export/*       → TTL: 0 (no cache, dynamic)
```

### 12.2 Bandwidth Budget

| Traffic Tier | Concurrent Users | Tile Requests/s | Bandwidth/hr | Monthly Cost Est. |
|-------------|-----------------|----------------|-------------|-------------------|
| Low (launch) | 100 | 500 | 50 GB | $50 |
| Medium | 1,000 | 5,000 | 500 GB | $400 |
| High | 10,000 | 50,000 | 5 TB | $3,000 |
| Viral spike | 100,000 | 500,000 | 50 TB | $25,000 |

**Mitigation for viral spike:** CDN edge caching absorbs 85%+ of tile traffic. Only cache misses hit origin. Auto-scaling tile server from 2 → 8 instances handles origin load.

### 12.3 Edge Compute (Optional)

Cloudflare Workers or CloudFront Functions for lightweight edge-side logic:

- Geo-based redirect (serve closest tile mirror)
- API key validation at edge (reject invalid keys before reaching origin)
- Request coalescing (deduplicate identical concurrent requests)
- A/B testing for new tile formats

---

## 13. Scaling Strategy & Capacity Planning

### 13.1 Horizontal Scaling

All API services are stateless. Scaling is horizontal behind a load balancer:

| Service | Min Instances | Max Instances | Scale Trigger | Scale Metric |
|---------|-------------|-------------|---------------|-------------|
| Tile Server | 2 | 16 | CPU > 60% for 2 min | req/s per instance |
| Search Service | 2 | 8 | Latency P99 > 300ms | query latency |
| Catalog API | 2 | 8 | CPU > 70% | req/s |
| Ephemeris Service | 2 | 6 | CPU > 80% | compute time/req |
| FITS Processor | 1 | 4 | Queue depth > 10 | pending jobs |
| Export Service | 1 | 4 | Queue depth > 5 | pending jobs |

### 13.2 Database Scaling

**PostgreSQL:** Vertical scaling to 128GB RAM, 32 cores for write primary. Read replicas (2) for search and tile server queries. Connection pooling via PgBouncer (max 200 connections → 2000 client connections).

**Elasticsearch:** 5 shards × 2 replicas = 15 shard copies across 3 data nodes. Each node: 32GB RAM (16GB heap), 8 cores, 500GB SSD.

**Redis:** 3 primary + 3 replica cluster. Each node: 16GB RAM. Automatic failover via Sentinel.

### 13.3 Storage Scaling

| Storage Type | Current | 1-Year Growth | 3-Year Growth |
|-------------|---------|--------------|--------------|
| PostgreSQL | 100 GB | 120 GB (+20%) | 160 GB (+60%) |
| Elasticsearch | 12 GB | 15 GB (+25%) | 20 GB (+67%) |
| Tile files (S3) | 8 GB | 10 GB (+25%) | 15 GB (+88%) |
| Textures (S3) | 8.5 GB | 12 GB (+41%) | 20 GB (+135%) |
| Raw catalog archive | 1 TB | 1.5 TB (+50%) | 3 TB (+200%) |
| TimescaleDB | 2.4 GB | 3 GB (+25%) | 5 GB (+108%) |
| **Total** | **~1.13 TB** | **~1.66 TB** | **~3.22 TB** |

---

## 14. Observability & Monitoring

### 14.1 Metrics Stack

**Prometheus + Grafana** for infrastructure and application metrics:

```
# Key dashboards:

API Performance
├── Request rate (req/s by endpoint)
├── Latency histograms (P50, P90, P99 by endpoint)
├── Error rate (4xx, 5xx by endpoint)
└── Active connections

Tile Server
├── Tile requests/s by z/level
├── Cache hit ratio (L1, L2, L3)
├── Binary serialization time
└── Brotli compression time

Search
├── Query latency by type (autocomplete, full-text, cone)
├── Elasticsearch cluster health
├── Index size and document count
└── Slow query log (>500ms)

Database
├── PostgreSQL: connections, query time, cache hit ratio, replication lag
├── Redis: memory usage, hit/miss ratio, evictions, connected clients
├── TimescaleDB: chunk count, compression ratio, query time
└── Elasticsearch: shard status, JVM heap, indexing rate

Infrastructure
├── CPU, memory, disk, network per service
├── Kubernetes pod health and restart count
├── CDN hit ratio and origin bandwidth
└── S3 request count and data transfer
```

### 14.2 Alerting Rules

| Alert | Condition | Severity | Response |
|-------|-----------|----------|----------|
| API latency P99 > 500ms | 5 consecutive minutes | Warning | Scale up service |
| API error rate > 5% | 2 consecutive minutes | Critical | Page on-call |
| Tile server latency > 200ms | 5 consecutive minutes | Warning | Check Redis, scale up |
| Redis memory > 80% | Sustained | Warning | Review eviction policy |
| PostgreSQL replication lag > 10s | Sustained | Critical | Investigate replica |
| Elasticsearch cluster RED | Any | Critical | Page on-call |
| CDN origin bandwidth > 80% budget | Hourly check | Warning | Review caching |
| ETL pipeline failure | Any task failure | Critical | Review Airflow logs |
| Disk usage > 85% | Any volume | Warning | Expand or cleanup |

### 14.3 Structured Logging

JSON-structured logs shipped to Elasticsearch (ELK stack) or Loki:

```json
{
  "timestamp": "2026-04-19T10:30:15.123Z",
  "level": "info",
  "service": "tile-server",
  "instance": "tile-server-2",
  "method": "GET",
  "path": "/v1/tiles/stars/5/128/64/3",
  "status": 200,
  "duration_ms": 12,
  "cache": "redis_hit",
  "tile_size_bytes": 48200,
  "client_ip_hash": "a3f2...",
  "user_agent": "CosmosExplorer/2.0",
  "request_id": "req_abc123"
}
```

---

## 15. Security & Data Governance

### 15.1 Network Security

- All traffic HTTPS (TLS 1.3)
- API Gateway enforces CORS: `Access-Control-Allow-Origin: https://cosmosexplorer.app`
- Rate limiting at edge (CDN) and gateway (Kong)
- DDoS protection via CloudFront/Cloudflare Shield
- Internal services communicate over private VPC, no public IPs

### 15.2 Data Security

- All astronomical data is public domain or CC-licensed — no PII concerns
- User bookmarks/observations stored with anonymous session IDs (UUID), not user accounts
- FITS uploads scanned for size limits, stored encrypted at rest in S3
- FITS files auto-deleted after 24 hours
- API keys for Research tier: SHA-256 hashed in database, never logged in plaintext

### 15.3 Data Attribution

All API responses include `data_source` field. The `/v1/version` endpoint returns data provenance:

```json
{
  "api_version": "1.0.0",
  "data_version": "2026.2",
  "sources": {
    "gaia_dr3": { "version": "DR3.1", "date": "2026-01-15", "license": "CC BY-SA 4.0" },
    "sdss_dr18": { "version": "DR18", "date": "2025-12-01", "license": "SDSS License" },
    "jpl_horizons": { "kernel": "de440", "date": "2026-03-01", "license": "Public Domain" },
    "exoplanet_archive": { "date": "2026-04-14", "license": "Public Domain" }
  }
}
```

---

## 16. Disaster Recovery & Data Durability

### 16.1 Backup Strategy

| System | Backup Method | Frequency | Retention | RTO | RPO |
|--------|-------------|-----------|-----------|-----|-----|
| PostgreSQL | pg_basebackup + WAL archiving | Continuous WAL, daily base | 30 days | 1 hour | 5 minutes |
| Elasticsearch | Snapshot to S3 | Daily | 14 days | 2 hours | 24 hours |
| Redis | RDB snapshots + AOF | Every 5 minutes | 7 days | 10 minutes | 5 minutes |
| S3 (tiles, textures) | Cross-region replication | Continuous | Indefinite | 0 (multi-AZ) | 0 |
| TimescaleDB | pg_dump | Daily | 30 days | 2 hours | 24 hours |

### 16.2 Failure Scenarios

**Single service crash:** Kubernetes restarts pod automatically (<30s). Load balancer routes to healthy instances. Zero user impact if ≥2 instances running.

**Database primary failure:** Automatic failover to replica (PgBouncer detects within 10s). Read replicas continue serving. Write operations pause for ~30s during promotion.

**Redis cluster node failure:** Sentinel promotes replica to primary within 5s. Client libraries auto-discover new topology. Cache misses increase temporarily.

**Complete datacenter failure:** DNS failover to secondary region (5-minute TTL). Cold start of services against S3 replicated data. RTO: 2 hours.

**CDN failure (CloudFront outage):** Extremely rare. Fallback: direct origin serving with increased latency. Client-side IndexedDB cache serves previously loaded tiles.

---

## 17. Infrastructure Cost Model

### 17.1 Monthly Cost Estimate (AWS, Medium Traffic Tier)

| Component | Instance Type | Count | Monthly Cost |
|-----------|-------------|-------|-------------|
| Tile Server | c6g.large (ARM, 2c/4GB) | 3 | $180 |
| Search Service | t3.medium (2c/4GB) | 2 | $120 |
| Catalog API | t3.medium | 2 | $120 |
| Ephemeris Service | c6g.medium | 2 | $90 |
| FITS Processor | t3.large (2c/8GB) | 1 | $90 |
| Export Service | t3.large | 1 | $90 |
| PostgreSQL (RDS) | db.r6g.xlarge (4c/32GB) | 1 primary + 1 replica | $850 |
| Elasticsearch | r6g.large.search (3-node) | 3 | $650 |
| Redis (ElastiCache) | r6g.large (6-node cluster) | 6 | $480 |
| TimescaleDB | db.t3.large | 1 | $130 |
| S3 Storage | 1.5 TB | — | $35 |
| CloudFront CDN | 5 TB transfer | — | $400 |
| Load Balancer (ALB) | — | 1 | $25 |
| EKS (Kubernetes) | — | 1 cluster | $75 |
| Monitoring (CloudWatch) | — | — | $50 |
| **TOTAL** | — | — | **~$3,385/mo** |

### 17.2 Cost Optimization Levers

- **Reserved Instances:** 1-year RI for database and persistent services → 30-40% savings
- **Spot Instances:** Tile server and Celery workers on spot → 60-70% savings
- **ARM instances (Graviton):** 20% cheaper than x86 for compute workloads
- **S3 Intelligent-Tiering:** Raw archive data auto-tiers to Glacier → 70% storage savings
- **CDN caching optimization:** Higher cache hit ratio → lower origin traffic → fewer tile servers

**Optimized monthly cost (with RI + Spot):** ~$1,800–2,200/mo.

---

## 18. Deployment Architecture

### 18.1 Kubernetes (EKS) Layout

```yaml
# Namespace: cosmos-production
Deployments:
  - tile-server:      replicas: 3, resources: {cpu: 1, memory: 2Gi}
  - search-service:   replicas: 2, resources: {cpu: 1, memory: 2Gi}
  - catalog-api:      replicas: 2, resources: {cpu: 500m, memory: 1Gi}
  - ephemeris-svc:    replicas: 2, resources: {cpu: 1, memory: 1Gi}
  - fits-worker:      replicas: 1, resources: {cpu: 2, memory: 4Gi}
  - export-worker:    replicas: 1, resources: {cpu: 2, memory: 4Gi}

Services:
  - tile-server:      ClusterIP → ALB ingress /v1/tiles/*
  - search-service:   ClusterIP → ALB ingress /v1/search/*
  - catalog-api:      ClusterIP → ALB ingress /v1/entities/*, /v1/solar-system/*
  - ephemeris-svc:    ClusterIP → ALB ingress /v1/ephemeris/*
  - fits-worker:      No ingress (queue-based)
  - export-worker:    No ingress (queue-based)

Ingress:
  - ALB with path-based routing
  - TLS termination at ALB
  - Health checks: /health on each service

HPA (Horizontal Pod Autoscaler):
  - tile-server:      min: 2, max: 16, target CPU: 60%
  - search-service:   min: 2, max: 8, target CPU: 70%
  - catalog-api:      min: 2, max: 8, target CPU: 70%
  - ephemeris-svc:    min: 2, max: 6, target CPU: 80%
```

### 18.2 CI/CD Pipeline

```
GitHub Push → GitHub Actions
  ├── Lint + Unit Tests
  ├── Build Docker images (multi-arch: amd64 + arm64)
  ├── Push to ECR
  ├── Deploy to staging (auto)
  ├── Integration tests against staging
  ├── Manual approval gate
  └── Rolling deploy to production (zero-downtime)
```

### 18.3 Environment Matrix

| Environment | Purpose | Data | Scale |
|-------------|---------|------|-------|
| Local (Docker Compose) | Development | 1,000 stars, 100 galaxies (sample) | Single instance |
| Staging | Integration testing | 100,000 stars, 10,000 galaxies | 1 instance each |
| Production | Live | 117.9M stars, 932K galaxies, full data | Auto-scaled |

---

## 19. SRS Cross-Reference

### 19.1 Requirements Addressed by Backend

| SRS Requirement | Backend Service | Implementation |
|----------------|----------------|----------------|
| F-SEARCH-001 (Quick search) | Search Service | Elasticsearch autocomplete, <50ms |
| F-SEARCH-002 (Advanced search) | Search Service | Full-text + faceted filters |
| F-SEARCH-003 (Search results) | Search Service + Catalog API | Paginated results with entity links |
| F-NAV-001–007 (Scale viewports) | Tile Server | Progressive tile streaming per scale |
| F-INFO-001–003 (Entity info) | Catalog API | Full entity JSON response |
| F-TIME-001 (Time control) | Ephemeris Service | Real-time position computation |
| F-TIME-002 (Time presets) | Ephemeris Service | Batch computation for time ranges |
| F-IMPORT-001–003 (Data import) | FITS Processor | Async file parsing, column detection |
| F-EXPORT-001–003 (Export) | Export Service | Async video/image render queue |
| F-CAT-001 (Catalog browser) | Catalog API + Search | Filtered queries with PostGIS spatial |
| F-OBS-001 (Observability) | Ephemeris Service + Catalog API | Alt/Az computation for location+time |
| F-BOOK-001 (Bookmarks) | Catalog API | Session-based bookmark CRUD |
| F-LOG-001 (Observation log) | Catalog API | Observation entry CRUD |
| F-TOGGLE-001–002 (Entity toggles) | Catalog API | Toggle metadata served per entity type |
| D-001–008 (Data accuracy) | ETL Pipeline | Quality filtering, validation tests |
| HW-001 (System requirements) | CDN + Tile Server | Adaptive quality, progressive loading |
| A-001–003 (Accessibility) | All services | ARIA-compliant API responses |

### 19.2 Performance Requirements

| SRS Requirement | Target | Backend Guarantee |
|----------------|--------|------------------|
| F-PERF-001 (Load time) | <4s desktop | Core tiles <1 MB, CDN edge-cached |
| 60 FPS rendering | 16.7ms/frame | Tile latency <25ms, no blocking |
| Search latency | <100ms | Elasticsearch P50 <80ms |
| Ephemeris computation | <50ms | SPICE P50 <5ms + Redis cache |
| Tile streaming | <100ms per tile | Rust server + Redis cache + CDN |
| Data import (FITS) | <30s for 500 objects | Celery worker, async processing |

---

**End of Document**

*This document defines the server-side infrastructure for Cosmos Explorer. It should be read alongside Doc 09 (frontend architecture), Doc 11 (data model), Doc 12 (client performance), and Doc 23 (spatial database) for complete system understanding. All backend services are designed to be incrementally deployable — the application can launch with a static CDN + pre-computed tiles (as described in Doc 09), then progressively adopt backend services as traffic and feature requirements grow.*
