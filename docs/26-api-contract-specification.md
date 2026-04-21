# Cosmos Explorer — API Contract Specification

**Document:** 26 — API Contract Specification  
**Version:** 1.0  
**Date:** 2026-04-19  
**Status:** Published  
**Product:** Cosmos Explorer — Interactive 3D Universe Visualization  
**Depends On:** Doc 11 (Data Model), Doc 25 (Backend Architecture)  
**Consumed By:** Doc 27 (Frontend State Management), Doc 28 (Developer Setup), Doc 30 (Test Cases)

---

## Table of Contents

1. [Overview](#1-overview)
2. [API Conventions](#2-api-conventions)
3. [Authentication & Rate Limiting](#3-authentication--rate-limiting)
4. [Common Schemas](#4-common-schemas)
5. [Entity Endpoints](#5-entity-endpoints)
6. [Search Endpoints](#6-search-endpoints)
7. [Tile Endpoints](#7-tile-endpoints)
8. [Ephemeris Endpoints](#8-ephemeris-endpoints)
9. [Solar System Endpoints](#9-solar-system-endpoints)
10. [FITS Processing Endpoints](#10-fits-processing-endpoints)
11. [Export Endpoints](#11-export-endpoints)
12. [User Data Endpoints](#12-user-data-endpoints)
13. [System Endpoints](#13-system-endpoints)
14. [WebSocket Events](#14-websocket-events)
15. [Error Handling](#15-error-handling)
16. [Pagination, Filtering & Sorting](#16-pagination-filtering--sorting)
17. [Versioning Strategy](#17-versioning-strategy)
18. [SDK & Client Generation](#18-sdk--client-generation)

---

## 1. Overview

This document defines the complete REST API contract for Cosmos Explorer using the OpenAPI 3.1 specification. Every endpoint listed in Doc 25 §6.1 is specified here with full request/response schemas, error codes, and examples. The WebSocket event protocol for real-time tile streaming and time-slider synchronization is defined in §14.

**Base URL:** `https://api.cosmosexplorer.app/v1`

**Protocol:** HTTPS only (TLS 1.3). HTTP requests receive `301` redirect to HTTPS.

**Content Types:**
- JSON endpoints: `application/json; charset=utf-8`
- Tile endpoints: `application/octet-stream` with `Content-Encoding: br` (Brotli)
- Export downloads: `application/octet-stream` or `image/png`

**Cross-References:**
- Data model interfaces (TypeScript): Doc 11 §3
- Binary tile formats: Doc 11 §4
- Backend service architecture: Doc 25 §6–10
- Rate limiting tiers: Doc 25 §6.3
- Frontend state consumers: Doc 27 (pending)
- Test cases for each endpoint: Doc 30 (pending)

---

## 2. API Conventions

### 2.1 URL Structure

All resource URLs follow the pattern:

```
/{version}/{resource}[/{identifier}][/{sub-resource}]
```

- Version prefix: `/v1` (see §17 for versioning strategy)
- Resource names: plural nouns, lowercase, kebab-case for multi-word (`solar-system`)
- Identifiers: entity IDs are integers; ENT IDs are strings (`ENT-1001`); catalog lookups use `{catalog}/{id}` pairs

### 2.2 HTTP Methods

| Method | Semantics | Idempotent | Request Body |
|--------|-----------|------------|--------------|
| GET | Read resource(s) | Yes | No |
| POST | Create resource or trigger computation | No | Yes (JSON) |
| DELETE | Remove resource | Yes | No |

PUT and PATCH are not used in v1. All mutations are POST (create) or DELETE (remove).

### 2.3 Request Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Accept` | No | `application/json` (default) or `application/octet-stream` |
| `Authorization` | Conditional | `Bearer {api_key}` — required for Registered/Research tiers |
| `X-Request-ID` | No | UUID for request tracing; server generates if absent |
| `Accept-Encoding` | No | `br, gzip` recommended; Brotli preferred for tile responses |
| `If-None-Match` | No | ETag-based caching for entity and search responses |

### 2.4 Response Headers

| Header | Present | Description |
|--------|---------|-------------|
| `Content-Type` | Always | `application/json; charset=utf-8` or `application/octet-stream` |
| `X-Request-ID` | Always | Echoes or generates request trace ID |
| `X-RateLimit-Limit` | Always | Max requests per minute for current tier |
| `X-RateLimit-Remaining` | Always | Remaining requests in current window |
| `X-RateLimit-Reset` | Always | Unix timestamp when window resets |
| `ETag` | GET JSON | Weak ETag for conditional caching |
| `Cache-Control` | Tiles/manifests | `public, max-age=86400, immutable` for tiles |
| `X-Data-Version` | Always | ETL data version stamp (e.g., `2026.Q1.3`) |

### 2.5 Envelope Format

All JSON responses share a common envelope:

```json
{
  "data": { ... },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "data_version": "2026.Q1.3",
    "timestamp": "2026-04-19T12:00:00Z"
  }
}
```

Collection responses add pagination:

```json
{
  "data": [ ... ],
  "meta": { ... },
  "pagination": {
    "total": 1452,
    "limit": 50,
    "offset": 0,
    "has_more": true,
    "next": "/v1/search?q=sirius&offset=50&limit=50"
  }
}
```

Error responses use a distinct shape (see §15).

---

## 3. Authentication & Rate Limiting

### 3.1 Authentication Tiers

Authentication is optional for basic browsing but required for higher rate limits and user data features.

| Tier | Auth Method | Rate Limit | Tile Bandwidth/hr | Access |
|------|-------------|------------|-------------------|--------|
| Anonymous | None | 60 req/min, burst 10/s | 500 MB | Read-only entities, search, tiles |
| Registered | `Bearer {api_key}` | 300 req/min, burst 30/s | 2 GB | + bookmarks, observations, exports |
| Research | `Bearer {api_key}` + institution header | 1,000 req/min, burst 100/s | 10 GB | + FITS upload, batch ephemeris, advanced search |
| Internal | Service token (mTLS) | Unlimited | Unlimited | All endpoints, admin |

### 3.2 API Key Format

```
ce_{tier}_{base62_random_32}
```

Examples:
- `ce_reg_A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6`
- `ce_res_X9y8Z7w6V5u4T3s2R1q0P9o8N7m6L5k4`

Keys are issued through the account settings UI. Research keys require institution email verification.

### 3.3 Rate Limit Response

When rate limit is exceeded, the API returns `429 Too Many Requests`:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. 60 requests per minute allowed for anonymous tier.",
    "retry_after_seconds": 42,
    "tier": "anonymous",
    "upgrade_url": "https://cosmosexplorer.app/account/upgrade"
  }
}
```

### 3.4 Institution Header (Research Tier)

Research-tier requests must include:

```
X-Institution: ror.org/03yrm5c26
```

Value is a ROR (Research Organization Registry) identifier. Validated on key issuance; sent for audit logging only.

---

## 4. Common Schemas

### 4.1 Position

```yaml
Position:
  type: object
  required: [ra, dec, distance_pc]
  properties:
    ra:
      type: number
      format: double
      minimum: 0
      exclusiveMaximum: 360
      description: "Right Ascension (degrees, ICRS J2000.0)"
    dec:
      type: number
      format: double
      minimum: -90
      maximum: 90
      description: "Declination (degrees, ICRS J2000.0)"
    distance_pc:
      type: number
      format: double
      minimum: 0
      description: "Distance in parsecs"
    distance_ly:
      type: number
      format: double
      description: "Distance in light-years (derived)"
    galactic_l:
      type: number
      format: double
      description: "Galactic longitude (degrees)"
    galactic_b:
      type: number
      format: double
      description: "Galactic latitude (degrees)"
    cartesian:
      $ref: '#/components/schemas/Vec3'
```

### 4.2 Vec3

```yaml
Vec3:
  type: object
  required: [x, y, z]
  properties:
    x:
      type: number
      format: double
    y:
      type: number
      format: double
    z:
      type: number
      format: double
```

### 4.3 KeplerianElements

```yaml
KeplerianElements:
  type: object
  required: [a, e, i, Omega, omega, M]
  properties:
    a:
      type: number
      format: double
      description: "Semi-major axis (AU)"
    e:
      type: number
      format: double
      minimum: 0
      maximum: 1
      description: "Eccentricity"
    i:
      type: number
      format: double
      minimum: 0
      maximum: 180
      description: "Inclination (degrees)"
    Omega:
      type: number
      format: double
      description: "Longitude of ascending node (degrees)"
    omega:
      type: number
      format: double
      description: "Argument of perihelion (degrees)"
    M:
      type: number
      format: double
      description: "Mean anomaly at epoch (degrees)"
    P:
      type: number
      format: double
      description: "Orbital period (days)"
```

### 4.4 CatalogIds

```yaml
CatalogIds:
  type: object
  properties:
    hipparcos:
      type: integer
    gaia_dr3:
      type: string
    tycho2:
      type: string
    hd:
      type: integer
    sao:
      type: integer
    messier:
      type: integer
    ngc:
      type: integer
    ic:
      type: integer
    pgc:
      type: integer
    sdss:
      type: string
    mpc:
      type: string
    jplsmd:
      type: string
  additionalProperties: false
```

### 4.5 EntityCategory Enum

```yaml
EntityCategory:
  type: integer
  enum: [1, 2, 3, 4, 5, 6, 7, 8, 9]
  x-enum-labels:
    1: "Stars"
    2: "Planets"
    3: "Moons"
    4: "Galaxies"
    5: "Nebulae"
    6: "Star Clusters"
    7: "Cosmic Web"
    8: "Small Bodies"
    9: "Exotic Objects"
  description: |
    Category codes for the 9 entity families (96 entity types total).
    Stars: ENT-1000–1099, Planets: ENT-2000–2099, Moons: ENT-3000–3099,
    Galaxies: ENT-4000–4099, Nebulae: ENT-5000–5099, Clusters: ENT-6000–6099,
    Cosmic Web: ENT-7000–7099, Small Bodies: ENT-8000–8099, Exotic: ENT-9000–9099.
```

### 4.6 HATEOASLinks

```yaml
HATEOASLinks:
  type: object
  properties:
    self:
      type: string
      format: uri-reference
    tile:
      type: string
      format: uri-reference
    neighbors:
      type: string
      format: uri-reference
    parent:
      type: string
      format: uri-reference
  additionalProperties:
    type: string
    format: uri-reference
```

### 4.7 DataQualityInfo

```yaml
DataQualityInfo:
  type: object
  properties:
    source:
      type: string
      enum: [gaia_dr3, hipparcos2, tycho2, sdss_dr18, illustris, nasa_exoplanet_archive, jpl_horizons, mpc, other]
    quality_score:
      type: number
      minimum: 0
      maximum: 1
      description: "Composite quality metric (0=unknown, 1=highest)"
    last_updated:
      type: string
      format: date
```

---

## 5. Entity Endpoints

### 5.1 GET /entities/{id}

Retrieve a single entity by internal numeric ID.

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `id` | integer | Internal entity ID (e.g., `5072708048`) |

**Response 200:**

```json
{
  "data": {
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
  },
  "meta": {
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "data_version": "2026.Q1.3",
    "timestamp": "2026-04-19T12:00:00Z"
  }
}
```

**Error Responses:**
- `404` — `ENTITY_NOT_FOUND`: No entity with the given ID
- `400` — `INVALID_ID`: ID is not a valid integer

### 5.2 GET /entities/ent/{entId}

Retrieve a single entity by its ENT classification ID.

**Path Parameters:**

| Name | Type | Pattern | Description |
|------|------|---------|-------------|
| `entId` | string | `ENT-\d{4}` | Entity type code (e.g., `ENT-1001`) |

**Response:** Same schema as §5.1.

**Notes:** Returns the canonical instance for that entity type. For entity types with multiple instances (e.g., ENT-1001 "Main Sequence Star" maps to millions of stars), this endpoint returns the flagship representative (Sirius for ENT-1001) with a `_links.browse` URL for browsing all instances.

### 5.3 GET /entities/catalog/{catalog}/{id}

Lookup entity by catalog designation.

**Path Parameters:**

| Name | Type | Examples | Description |
|------|------|----------|-------------|
| `catalog` | string | `messier`, `ngc`, `ic`, `hip`, `gaia`, `hd` | Catalog system name |
| `id` | string | `M42`, `NGC1976`, `32349`, `5072708048013507072` | Catalog-specific identifier |

**Response:** Same schema as §5.1.

**Error Responses:**
- `404` — `CATALOG_ENTRY_NOT_FOUND`: No match in the specified catalog
- `400` — `INVALID_CATALOG`: Unrecognized catalog name

**Supported Catalogs:**

| Catalog Key | Full Name | ID Format |
|-------------|-----------|-----------|
| `messier` | Messier Catalog | `M` + integer (e.g., `M42`) |
| `ngc` | New General Catalogue | `NGC` + integer (e.g., `NGC1976`) |
| `ic` | Index Catalogue | `IC` + integer |
| `hip` | Hipparcos | Integer |
| `gaia` | Gaia DR3 | Integer string (19 digits) |
| `hd` | Henry Draper | Integer |
| `sao` | SAO Star Catalog | Integer |
| `tycho2` | Tycho-2 | `TYC` format |
| `sdss` | SDSS DR18 | SDSS object ID string |
| `mpc` | Minor Planet Center | Integer or provisional designation |

---

## 6. Search Endpoints

### 6.1 GET /search

Full-text search across all entity names, aliases, and catalog IDs.

**Query Parameters:**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `q` | string | Yes | — | Search query string (min 1 char) |
| `category` | integer | No | — | Filter by EntityCategory (1–9) |
| `mag_max` | number | No | — | Maximum apparent magnitude filter |
| `distance_max_pc` | number | No | — | Maximum distance in parsecs |
| `limit` | integer | No | 50 | Results per page (1–200) |
| `offset` | integer | No | 0 | Pagination offset |
| `sort` | string | No | `_score` | Sort field: `_score`, `name`, `magnitude`, `distance` |
| `order` | string | No | `desc` for `_score`, `asc` otherwise | `asc` or `desc` |

**Response 200:**

```json
{
  "data": [
    {
      "id": 5072708048,
      "ent_id": "ENT-1001",
      "name": "Sirius",
      "category": 1,
      "category_name": "Stars",
      "type_name": "Main Sequence Star",
      "magnitude_apparent": -1.46,
      "distance_ly": 8.60,
      "constellation": "Canis Major",
      "_score": 98.5,
      "_links": {
        "self": "/v1/entities/5072708048"
      }
    }
  ],
  "meta": { ... },
  "pagination": {
    "total": 3,
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}
```

**Implementation Notes:**
- Backed by Elasticsearch 8.x (Doc 25 §5)
- Uses `match_phrase_prefix` for partial matches
- Boosting: exact name match ×10, alias match ×5, catalog ID match ×3, description match ×1
- Response includes lightweight entity summaries, not full entity objects; use `_links.self` for full detail

### 6.2 GET /search/autocomplete

Prefix-based autocomplete for the search bar UI. Returns suggestions as the user types.

**Query Parameters:**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `q` | string | Yes | — | Prefix query (min 1 char) |
| `category` | integer | No | — | Filter by EntityCategory |
| `limit` | integer | No | 10 | Max suggestions (1–20) |

**Response 200:**

```json
{
  "data": [
    {
      "text": "Sirius",
      "ent_id": "ENT-1001",
      "category": 1,
      "category_name": "Stars",
      "magnitude": -1.46,
      "highlight": "<em>Sir</em>ius"
    },
    {
      "text": "Sirius B",
      "ent_id": "ENT-1006",
      "category": 1,
      "category_name": "Stars",
      "magnitude": 8.44,
      "highlight": "<em>Sir</em>ius B"
    }
  ],
  "meta": { ... }
}
```

**Performance Target:** <50ms P95 latency. Uses Elasticsearch completion suggester with pre-built suggest index.

### 6.3 GET /search/cone

Spatial cone search — find all entities within an angular radius of a sky position. Essential for the "nearby objects" panel in the Entity Detail view (Doc 24 §10).

**Query Parameters:**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `ra` | number | Yes | — | Center RA (degrees, 0–360) |
| `dec` | number | Yes | — | Center Dec (degrees, -90 to +90) |
| `radius` | number | Yes | — | Search radius (degrees, max 10.0) |
| `mag_max` | number | No | — | Maximum apparent magnitude |
| `category` | integer | No | — | Filter by EntityCategory |
| `limit` | integer | No | 100 | Results per page (1–500) |
| `offset` | integer | No | 0 | Pagination offset |

**Response:** Same collection schema as §6.1 with additional `angular_separation_deg` field per result.

**Implementation:** PostGIS `ST_DWithin` on `geography(Point)` column (Doc 25 §4.1). Indexed with SP-GiST.

### 6.4 POST /search/advanced

Complex query with JSONB filter expressions, range queries, and boolean logic. Intended for Research mode (Doc 24 §9, Screen S-13.0).

**Request Body:**

```json
{
  "filters": [
    {
      "field": "properties.temperature_k",
      "op": "between",
      "value": [5000, 7000]
    },
    {
      "field": "properties.luminosity_solar",
      "op": "gt",
      "value": 10
    },
    {
      "field": "category",
      "op": "eq",
      "value": 1
    }
  ],
  "logic": "AND",
  "sort": "properties.temperature_k",
  "order": "desc",
  "limit": 50,
  "offset": 0
}
```

**Filter Operators:**

| Operator | Description | Value Type |
|----------|-------------|------------|
| `eq` | Equals | string, number, integer |
| `neq` | Not equals | string, number, integer |
| `gt` | Greater than | number |
| `gte` | Greater than or equal | number |
| `lt` | Less than | number |
| `lte` | Less than or equal | number |
| `between` | Inclusive range | [number, number] |
| `in` | Value in set | array |
| `contains` | Text contains | string |
| `exists` | Field is non-null | boolean |

**Supported Filter Fields:**

| Field Path | Type | Category |
|------------|------|----------|
| `category` | integer | All |
| `entity_type` | integer | All |
| `name` | string | All |
| `position.ra` | number | All |
| `position.dec` | number | All |
| `position.distance_pc` | number | All |
| `properties.spectral_type` | string | Stars |
| `properties.temperature_k` | number | Stars |
| `properties.luminosity_solar` | number | Stars |
| `properties.mass_solar` | number | Stars |
| `properties.magnitude_apparent` | number | Stars, Galaxies |
| `properties.magnitude_absolute` | number | Stars, Galaxies |
| `properties.constellation` | string | Stars |
| `properties.mass_earth_masses` | number | Planets |
| `properties.radius_earth_radii` | number | Planets |
| `properties.hubble_classification` | string | Galaxies |
| `properties.redshift` | number | Galaxies |
| `properties.stellar_mass` | number | Galaxies |
| `properties.type` | string | Nebulae |
| `catalog_ids.messier` | integer | Stars, Nebulae, Galaxies, Clusters |
| `catalog_ids.ngc` | integer | Nebulae, Galaxies, Clusters |
| `data_source` | string | All |
| `data_quality` | number | All |

**Response:** Same collection schema as §6.1.

**Rate Limit:** Research tier only. Anonymous and Registered tiers receive `403 INSUFFICIENT_TIER`.

---

## 7. Tile Endpoints

Tile endpoints return binary data optimized for GPU streaming. Formats are defined in Doc 11 §4. All tile responses use `Content-Type: application/octet-stream` with `Content-Encoding: br` (Brotli) and aggressive cache headers.

### 7.1 GET /tiles/stars/{z}/{x}/{y}/{level}

Retrieve a binary star tile from the octree.

**Path Parameters:**

| Name | Type | Range | Description |
|------|------|-------|-------------|
| `z` | integer | 0–8 | Octree depth |
| `x` | integer | 0–(8^z − 1) | Octree X coordinate |
| `y` | integer | 0–(8^z − 1) | Octree Y coordinate |
| `level` | integer | 0–3 | LOD level (0=lowest detail, 3=highest) |

**Response 200:** Binary data per Doc 11 §4.1: 16-byte header + 16 bytes per star record.

**Response Headers:**
- `Content-Type: application/octet-stream`
- `Content-Encoding: br`
- `Cache-Control: public, max-age=86400, immutable`
- `X-Tile-Star-Count: 847`
- `X-Tile-Version: 2026.Q1.3`

**Error Responses:**
- `404` — `TILE_NOT_FOUND`: No tile at the given coordinates (empty region)
- `400` — `INVALID_TILE_ADDRESS`: Coordinates out of range for given depth

**Performance:** P50 <5ms (cache hit), P50 <25ms (cache miss), P99 <100ms. See Doc 25 §7.2.

### 7.2 GET /tiles/galaxies/{healpix_idx}

Retrieve binary galaxy data for a HEALPix pixel.

**Path Parameters:**

| Name | Type | Range | Description |
|------|------|-------|-------------|
| `healpix_idx` | integer | 0–786,431 | HEALPix pixel index (Nside=256) |

**Response 200:** Binary data per Doc 11 §4.2: 16-byte header + 24 bytes per galaxy record.

**Response Headers:** Same caching pattern as §7.1 with `X-Tile-Galaxy-Count`.

### 7.3 GET /tiles/cosmic-web/{sector}

Retrieve cosmic web mesh data for a spatial sector.

**Path Parameters:**

| Name | Type | Range | Description |
|------|------|-------|-------------|
| `sector` | integer | 0–63 | Sector index (4×4×4 grid) |

**Response 200:** Binary mesh data per Doc 11 §4.3: 20-byte header + vertex data + index data.

### 7.4 GET /tiles/manifest

Retrieve the tile manifest — a JSON document listing all available tiles with bounding boxes and checksums. The client fetches this once at startup and uses it for frustum-based tile loading decisions.

**Response 200:**

```json
{
  "data": {
    "version": "2026.Q1.3",
    "generated_at": "2026-04-15T03:00:00Z",
    "stars": {
      "total_tiles": 64893,
      "total_stars": 1811709771,
      "max_depth": 8,
      "lod_levels": 4,
      "bounds": {
        "min": { "x": -200, "y": -200, "z": -200 },
        "max": { "x": 200, "y": 200, "z": 200 }
      },
      "tiles": [
        {
          "address": "3/12/5/2",
          "bounds": { "min": { "x": -25, "y": 25, "z": 0 }, "max": { "x": 0, "y": 50, "z": 25 } },
          "star_count": 847,
          "size_bytes": 13568,
          "checksum_xxh3": "a1b2c3d4e5f6"
        }
      ]
    },
    "galaxies": {
      "total_tiles": 472108,
      "total_galaxies": 2000000000,
      "healpix_nside": 256,
      "tiles": [
        {
          "healpix_idx": 1024,
          "galaxy_count": 4231,
          "size_bytes": 101560,
          "checksum_xxh3": "f6e5d4c3b2a1"
        }
      ]
    },
    "cosmic_web": {
      "total_sectors": 64,
      "grid": [4, 4, 4],
      "sectors": [
        {
          "sector": 0,
          "vertex_count": 125000,
          "size_bytes": 2048000,
          "checksum_xxh3": "1a2b3c4d5e6f"
        }
      ]
    }
  },
  "meta": { ... }
}
```

**Cache:** `Cache-Control: public, max-age=3600` (1 hour). The manifest is ~5 MB compressed; the client caches it in IndexedDB and uses `If-None-Match` for subsequent requests.

---

## 8. Ephemeris Endpoints

Compute precise positions of solar system bodies at arbitrary epochs using NASA SPICE kernels. Backend: FastAPI + SpiceyPy (Doc 25 §9).

### 8.1 GET /ephemeris/{naifId}

Position of a single body at a given epoch.

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `naifId` | integer | NAIF SPICE ID (e.g., 399=Earth, 599=Jupiter, 301=Moon) |

**Query Parameters:**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `epoch` | number | Yes | — | Julian Date (e.g., 2460780.5) |
| `frame` | string | No | `ECLIPJ2000` | Reference frame (`ECLIPJ2000`, `J2000`, `GALACTIC`) |
| `observer` | integer | No | 10 | Observer NAIF ID (10=Sun center) |

**Response 200:**

```json
{
  "data": {
    "naif_id": 399,
    "name": "Earth",
    "epoch_jd": 2460780.5,
    "frame": "ECLIPJ2000",
    "observer": 10,
    "position_au": { "x": -0.1747, "y": 0.9673, "z": 0.0000 },
    "velocity_au_day": { "x": -0.01720, "y": -0.00310, "z": 0.00000 },
    "light_time_s": 499.004
  },
  "meta": { ... }
}
```

**Error Responses:**
- `400` — `INVALID_NAIF_ID`: Unknown NAIF body ID
- `400` — `EPOCH_OUT_OF_RANGE`: Epoch outside SPICE kernel coverage (valid: JD 2287184.5–2688976.5, roughly 1550–2650 CE)
- `400` — `INVALID_FRAME`: Unrecognized reference frame

### 8.2 POST /ephemeris/batch

Compute positions for multiple bodies at multiple epochs in a single request. Essential for animating the solar system during time-slider scrubbing.

**Request Body:**

```json
{
  "naif_ids": [199, 299, 399, 499, 599, 699, 799, 899],
  "epochs": [2460780.5, 2460781.5, 2460782.5],
  "frame": "ECLIPJ2000",
  "observer": 10
}
```

**Constraints:**
- Max 50 body IDs per request
- Max 1000 epochs per request
- Max 10,000 total computations (bodies × epochs) per request

**Response 200:**

```json
{
  "data": {
    "results": [
      {
        "naif_id": 199,
        "epoch_jd": 2460780.5,
        "x": 0.3075,
        "y": -0.1245,
        "z": -0.0387
      }
    ],
    "count": 24
  },
  "meta": { ... }
}
```

**Rate Limit:** Research tier only for >100 computations per request.

### 8.3 GET /ephemeris/range/{naifId}

Pre-computed ephemeris over a time range with fixed step. Optimized for time-slider animation — returns a compact array instead of individual objects.

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `naifId` | integer | NAIF SPICE ID |

**Query Parameters:**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `start` | number | Yes | — | Start epoch (Julian Date) |
| `end` | number | Yes | — | End epoch (Julian Date) |
| `step` | number | No | 1.0 | Step size in days (min 0.01, max 365.25) |
| `frame` | string | No | `ECLIPJ2000` | Reference frame |

**Constraints:**
- Max range: 200 years (73,050 days)
- Max data points per request: 10,000

**Response 200:**

```json
{
  "data": {
    "naif_id": 399,
    "name": "Earth",
    "frame": "ECLIPJ2000",
    "observer": 10,
    "start_jd": 2460780.5,
    "end_jd": 2461145.5,
    "step_days": 1.0,
    "positions": [
      [-0.1747, 0.9673, 0.0000],
      [-0.1918, 0.9641, 0.0000]
    ],
    "count": 366
  },
  "meta": { ... }
}
```

**Note:** The compact array format (`positions` as `[x, y, z][]`) saves ~60% bandwidth compared to named object format. Client should index by `start_jd + index * step_days` to recover epochs.

---

## 9. Solar System Endpoints

Static (non-ephemeris) solar system body data — physical properties, orbital elements, and metadata.

### 9.1 GET /solar-system/bodies

List all solar system bodies with their properties.

**Query Parameters:**

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `type` | string | No | — | Filter: `planet`, `dwarf_planet`, `moon`, `asteroid`, `comet` |
| `parent` | integer | No | — | Filter by parent NAIF ID (e.g., 599 for Jupiter's moons) |
| `limit` | integer | No | 100 | Results per page (1–500) |
| `offset` | integer | No | 0 | Pagination offset |

**Response 200:**

```json
{
  "data": [
    {
      "naif_id": 399,
      "name": "Earth",
      "type": "planet",
      "parent_naif_id": 10,
      "ent_id": "ENT-2001",
      "orbital_elements": {
        "a": 1.00000261,
        "e": 0.01671123,
        "i": 0.00005,
        "Omega": -11.26064,
        "omega": 102.93768,
        "M": 100.46435,
        "P": 365.256363
      },
      "epoch": "J2000.0",
      "physical": {
        "mass_kg": 5.972e24,
        "radius_km": 6371.0,
        "density_kgm3": 5514,
        "surface_gravity_ms2": 9.807,
        "rotation_period_hours": 23.9345,
        "obliquity_deg": 23.44,
        "albedo": 0.306,
        "equilibrium_temperature_k": 255
      },
      "atmosphere": {
        "composition": [
          { "molecule": "N2", "abundance": 0.7808 },
          { "molecule": "O2", "abundance": 0.2095 },
          { "molecule": "Ar", "abundance": 0.0093 }
        ],
        "surface_pressure_pa": 101325,
        "scale_height_km": 8.5
      },
      "rings": null,
      "moon_count": 1,
      "_links": {
        "self": "/v1/solar-system/bodies/399",
        "entity": "/v1/entities/ent/ENT-2001",
        "moons": "/v1/solar-system/bodies?parent=399",
        "ephemeris": "/v1/ephemeris/399"
      }
    }
  ],
  "meta": { ... },
  "pagination": { ... }
}
```

### 9.2 GET /solar-system/bodies/{naifId}

Single body with full properties including ring system, atmosphere detail, and linked moons.

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `naifId` | integer | NAIF SPICE ID |

**Response:** Same schema as individual items in §9.1 with full `atmosphere`, `rings`, and expanded `moons` array containing NAIF IDs and names.

---

## 10. FITS Processing Endpoints

Asynchronous FITS/CSV/VOTable file processing for Research mode custom dataset import (Doc 24 Screen S-13.0, Doc 25 §10).

### 10.1 POST /fits/upload

Upload a data file for parsing. Returns a job ID for polling status.

**Request:**
- `Content-Type: multipart/form-data`
- Field `file`: the FITS, CSV, or VOTable file (max 500 MB)

**Response 202:**

```json
{
  "data": {
    "job_id": "fit_a1b2c3d4e5f6",
    "status": "queued",
    "filename": "my_stars.fits",
    "file_size_bytes": 52428800,
    "estimated_duration_s": 30
  },
  "meta": { ... }
}
```

**Error Responses:**
- `400` — `INVALID_FILE_FORMAT`: Not a recognized FITS/CSV/VOTable file
- `413` — `FILE_TOO_LARGE`: File exceeds 500 MB limit
- `403` — `INSUFFICIENT_TIER`: FITS upload requires Research tier

### 10.2 GET /fits/{jobId}/status

Poll the status of a FITS processing job.

**Path Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `jobId` | string | Job ID from upload response |

**Response 200:**

```json
{
  "data": {
    "job_id": "fit_a1b2c3d4e5f6",
    "status": "completed",
    "filename": "my_stars.fits",
    "progress_percent": 100,
    "rows_parsed": 15420,
    "columns_detected": 12,
    "duration_s": 18.4,
    "created_at": "2026-04-19T12:00:00Z",
    "completed_at": "2026-04-19T12:00:18Z"
  },
  "meta": { ... }
}
```

**Status Values:** `queued` → `processing` → `completed` | `failed`

### 10.3 GET /fits/{jobId}/preview

Get a preview of parsed data (first 100 rows).

**Response 200:**

```json
{
  "data": {
    "job_id": "fit_a1b2c3d4e5f6",
    "columns": [
      { "name": "ra", "type": "float64", "unit": "deg", "null_count": 0 },
      { "name": "dec", "type": "float64", "unit": "deg", "null_count": 0 },
      { "name": "parallax", "type": "float64", "unit": "mas", "null_count": 23 },
      { "name": "phot_g_mean_mag", "type": "float32", "unit": "mag", "null_count": 0 }
    ],
    "preview_rows": [
      [101.2865, -16.7161, 379.21, -1.46],
      [297.6958, 8.8683, 194.95, 0.77]
    ],
    "total_rows": 15420
  },
  "meta": { ... }
}
```

### 10.4 GET /fits/{jobId}/columns

Get detected column metadata with auto-inferred semantic types.

**Response 200:**

```json
{
  "data": {
    "columns": [
      {
        "index": 0,
        "name": "ra",
        "type": "float64",
        "unit": "deg",
        "semantic": "right_ascension",
        "min": 0.0012,
        "max": 359.9987,
        "null_count": 0,
        "sample_values": [101.2865, 297.6958, 45.1234]
      }
    ],
    "auto_mapping": {
      "ra_column": "ra",
      "dec_column": "dec",
      "distance_column": null,
      "parallax_column": "parallax",
      "magnitude_column": "phot_g_mean_mag",
      "confidence": 0.95
    }
  },
  "meta": { ... }
}
```

### 10.5 POST /fits/{jobId}/render

Submit a render request — map detected columns to visualization parameters and generate entities for 3D display.

**Request Body:**

```json
{
  "column_mapping": {
    "ra": "ra",
    "dec": "dec",
    "parallax": "parallax",
    "magnitude": "phot_g_mean_mag",
    "color": null
  },
  "filters": {
    "parallax_min": 0.1,
    "magnitude_max": 15.0
  },
  "visualization": {
    "color_by": "magnitude",
    "size_by": "magnitude",
    "label_top_n": 50
  }
}
```

**Response 202:**

```json
{
  "data": {
    "render_id": "rnd_x9y8z7w6",
    "status": "processing",
    "entity_count_estimate": 12840
  },
  "meta": { ... }
}
```

The rendered dataset is available via a temporary tile endpoint: `GET /tiles/custom/{render_id}/{z}/{x}/{y}/{level}` using the same binary format as star tiles.

---

## 11. Export Endpoints

Asynchronous rendering of high-resolution images and video captures from the 3D viewport.

### 11.1 POST /export/video

Submit a video render job.

**Request Body:**

```json
{
  "camera_path": [
    {
      "position": { "x": 0, "y": 0, "z": 50 },
      "look_at": { "x": 0, "y": 0, "z": 0 },
      "timestamp_s": 0.0
    },
    {
      "position": { "x": 50, "y": 0, "z": 0 },
      "look_at": { "x": 0, "y": 0, "z": 0 },
      "timestamp_s": 10.0
    }
  ],
  "resolution": { "width": 3840, "height": 2160 },
  "fps": 60,
  "format": "mp4",
  "codec": "h264",
  "quality": "high",
  "include_ui": false
}
```

**Response 202:**

```json
{
  "data": {
    "job_id": "exp_v1a2b3c4",
    "status": "queued",
    "estimated_duration_s": 300,
    "estimated_size_mb": 150
  },
  "meta": { ... }
}
```

### 11.2 POST /export/image

Submit a high-resolution image render.

**Request Body:**

```json
{
  "camera": {
    "position": { "x": 0, "y": 0, "z": 50 },
    "look_at": { "x": 0, "y": 0, "z": 0 },
    "fov_deg": 60
  },
  "resolution": { "width": 7680, "height": 4320 },
  "format": "png",
  "include_ui": false,
  "include_labels": true,
  "supersampling": 2
}
```

**Response 202:** Same schema as §11.1 with `estimated_size_mb`.

### 11.3 GET /export/{jobId}/status

Poll export job status.

**Response 200:**

```json
{
  "data": {
    "job_id": "exp_v1a2b3c4",
    "status": "completed",
    "progress_percent": 100,
    "file_size_bytes": 157286400,
    "download_url": "/v1/export/exp_v1a2b3c4/download",
    "download_expires_at": "2026-04-20T12:00:00Z"
  },
  "meta": { ... }
}
```

**Status Values:** `queued` → `rendering` → `encoding` → `completed` | `failed`

### 11.4 GET /export/{jobId}/download

Download the completed export file. Returns the binary file with appropriate `Content-Type`.

**Response 200:**
- Video: `Content-Type: video/mp4`
- Image: `Content-Type: image/png`
- `Content-Disposition: attachment; filename="cosmos_export_exp_v1a2b3c4.mp4"`

**Response 404:** Job not found or download expired.

**Note:** Download URLs expire 24 hours after job completion.

---

## 12. User Data Endpoints

Session-based bookmarks and observation logs. No account required — data is keyed to a client session token stored in `localStorage`.

### 12.1 POST /bookmarks

Save a bookmark.

**Request Body:**

```json
{
  "session": "sess_a1b2c3d4",
  "entity_id": 5072708048,
  "camera": {
    "position": { "x": -1.81, "y": 0.72, "z": -1.78 },
    "look_at": { "x": -1.81, "y": 0.72, "z": -1.78 },
    "fov_deg": 30
  },
  "label": "Sirius close-up",
  "mode": "observation",
  "epoch_jd": 2460780.5
}
```

**Response 201:**

```json
{
  "data": {
    "id": "bk_x9y8z7w6",
    "entity_id": 5072708048,
    "entity_name": "Sirius",
    "label": "Sirius close-up",
    "created_at": "2026-04-19T12:00:00Z",
    "_links": {
      "self": "/v1/bookmarks/bk_x9y8z7w6",
      "entity": "/v1/entities/5072708048"
    }
  },
  "meta": { ... }
}
```

### 12.2 GET /bookmarks

List bookmarks for a session.

**Query Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `session` | string | Yes | Session token |
| `limit` | integer | No | Results per page (default 50) |
| `offset` | integer | No | Pagination offset |

**Response 200:** Collection of bookmark objects.

### 12.3 DELETE /bookmarks/{id}

Delete a bookmark.

**Query Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `session` | string | Yes | Session token (must match bookmark owner) |

**Response 204:** No content.

**Error:** `403` — `SESSION_MISMATCH`: Session token does not match bookmark owner.

### 12.4 POST /observations

Save an observation log entry.

**Request Body:**

```json
{
  "session": "sess_a1b2c3d4",
  "entity_id": 5072708048,
  "entity_name": "Sirius",
  "notes": "Brightest star visible tonight. Companion Sirius B visible in toggle overlay.",
  "epoch_jd": 2460780.5,
  "camera": { ... },
  "tags": ["binary_system", "naked_eye"]
}
```

**Response 201:** Observation object with generated ID and timestamp.

### 12.5 GET /observations

List observations for a session.

**Query Parameters:** Same as §12.2 with additional `tag` filter.

---

## 13. System Endpoints

### 13.1 GET /health

Health check endpoint for load balancers and monitoring.

**Response 200:**

```json
{
  "status": "healthy",
  "services": {
    "postgres": "up",
    "elasticsearch": "up",
    "redis": "up",
    "tile_server": "up",
    "ephemeris": "up"
  },
  "uptime_s": 864000
}
```

**Response 503:** One or more services degraded. Body includes which service is down.

### 13.2 GET /version

API and data version information.

**Response 200:**

```json
{
  "data": {
    "api_version": "1.0.0",
    "data_version": "2026.Q1.3",
    "last_etl_run": "2026-04-15T03:00:00Z",
    "entity_count": {
      "total": 1813709771,
      "stars": 1811709771,
      "galaxies": 2000000,
      "nebulae": 12500,
      "clusters": 5200,
      "solar_system": 6300,
      "cosmic_web_nodes": 1000000
    },
    "spice_kernel_epoch_range": {
      "start_jd": 2287184.5,
      "end_jd": 2688976.5,
      "description": "1550-01-01 to 2650-01-01 CE"
    }
  },
  "meta": { ... }
}
```

### 13.3 GET /stats

Public usage statistics.

**Response 200:**

```json
{
  "data": {
    "requests_today": 1452387,
    "unique_sessions_today": 23451,
    "most_viewed_entities": [
      { "ent_id": "ENT-1001", "name": "Sirius", "views": 8923 },
      { "ent_id": "ENT-5001", "name": "Orion Nebula", "views": 7651 }
    ],
    "most_searched_terms": ["andromeda", "black hole", "jupiter", "sirius"],
    "tiles_served_today": 45230000,
    "data_transferred_tb_today": 2.3
  },
  "meta": { ... }
}
```

---

## 14. WebSocket Events

### 14.1 Connection

WebSocket endpoint for real-time events: tile streaming priority updates, time-slider synchronization, and live export progress.

**URL:** `wss://api.cosmosexplorer.app/v1/ws`

**Connection Parameters (query string):**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `session` | string | Yes | Session token |
| `api_key` | string | No | API key for Registered/Research tier |

**Handshake Response:**

```json
{
  "type": "connected",
  "session_id": "sess_a1b2c3d4",
  "tier": "anonymous",
  "server_time": "2026-04-19T12:00:00Z"
}
```

### 14.2 Client → Server Messages

#### 14.2.1 Viewport Update

Sent when the camera moves. The server uses this to prioritize tile delivery.

```json
{
  "type": "viewport_update",
  "frustum": {
    "position": { "x": 0, "y": 0, "z": 50 },
    "direction": { "x": 0, "y": 0, "z": -1 },
    "fov_deg": 60,
    "aspect": 1.778,
    "near": 0.001,
    "far": 100000
  },
  "lod_bias": 0
}
```

#### 14.2.2 Time Update

Sent when the time slider changes epoch — the server pushes pre-computed ephemeris data.

```json
{
  "type": "time_update",
  "epoch_jd": 2460780.5,
  "playback_speed": 1.0,
  "bodies_requested": [199, 299, 399, 499, 599, 699, 799, 899]
}
```

#### 14.2.3 Subscribe Export

Subscribe to progress events for an export job.

```json
{
  "type": "subscribe_export",
  "job_id": "exp_v1a2b3c4"
}
```

### 14.3 Server → Client Messages

#### 14.3.1 Tile Priority

Server informs client which tiles to load next based on viewport.

```json
{
  "type": "tile_priority",
  "tiles": [
    { "url": "/v1/tiles/stars/5/128/64/3", "priority": 1.0 },
    { "url": "/v1/tiles/stars/5/128/65/3", "priority": 0.9 },
    { "url": "/v1/tiles/galaxies/1024", "priority": 0.3 }
  ]
}
```

#### 14.3.2 Ephemeris Push

Server pushes pre-computed positions in response to `time_update`.

```json
{
  "type": "ephemeris_push",
  "epoch_jd": 2460780.5,
  "bodies": [
    { "naif_id": 399, "x": -0.1747, "y": 0.9673, "z": 0.0000 },
    { "naif_id": 599, "x": 3.9782, "y": 2.9652, "z": -0.1012 }
  ]
}
```

#### 14.3.3 Export Progress

Real-time progress updates for subscribed export jobs.

```json
{
  "type": "export_progress",
  "job_id": "exp_v1a2b3c4",
  "status": "rendering",
  "progress_percent": 45,
  "frames_rendered": 270,
  "frames_total": 600,
  "eta_seconds": 55
}
```

#### 14.3.4 Data Version Update

Broadcast when new ETL data is deployed.

```json
{
  "type": "data_version_update",
  "old_version": "2026.Q1.2",
  "new_version": "2026.Q1.3",
  "message": "Gaia DR3 quarterly update applied. Reload manifest for updated tiles.",
  "manifest_url": "/v1/tiles/manifest"
}
```

### 14.4 Heartbeat

Client sends `ping` every 30 seconds; server responds with `pong`. Connection closes after 60 seconds of silence.

```json
{ "type": "ping" }
{ "type": "pong", "server_time": "2026-04-19T12:00:30Z" }
```

---

## 15. Error Handling

### 15.1 Error Response Format

All errors follow a consistent JSON structure:

```json
{
  "error": {
    "code": "ENTITY_NOT_FOUND",
    "message": "No entity found with ID 999999999.",
    "status": 404,
    "request_id": "550e8400-e29b-41d4-a716-446655440000",
    "details": {},
    "documentation_url": "https://docs.cosmosexplorer.app/errors/ENTITY_NOT_FOUND"
  }
}
```

### 15.2 Error Code Catalog

| HTTP Status | Code | Description | Endpoints |
|-------------|------|-------------|-----------|
| 400 | `INVALID_PARAMETER` | Query parameter validation failed | All |
| 400 | `INVALID_ID` | Entity ID is not a valid integer | Entities |
| 400 | `INVALID_CATALOG` | Unrecognized catalog name | Entities |
| 400 | `INVALID_TILE_ADDRESS` | Tile coordinates out of range | Tiles |
| 400 | `INVALID_NAIF_ID` | Unknown NAIF body identifier | Ephemeris |
| 400 | `EPOCH_OUT_OF_RANGE` | Epoch outside SPICE kernel coverage | Ephemeris |
| 400 | `INVALID_FRAME` | Unrecognized reference frame | Ephemeris |
| 400 | `INVALID_FILE_FORMAT` | Uploaded file is not FITS/CSV/VOTable | FITS |
| 400 | `INVALID_COLUMN_MAPPING` | Column mapping references non-existent columns | FITS |
| 400 | `BATCH_TOO_LARGE` | Batch request exceeds size limits | Ephemeris |
| 400 | `INVALID_FILTER` | Advanced search filter is malformed | Search |
| 401 | `UNAUTHORIZED` | Missing or invalid API key | Authenticated endpoints |
| 403 | `INSUFFICIENT_TIER` | Endpoint requires higher auth tier | FITS, advanced search |
| 403 | `SESSION_MISMATCH` | Session token doesn't match resource | Bookmarks, observations |
| 404 | `ENTITY_NOT_FOUND` | No entity with given ID | Entities |
| 404 | `CATALOG_ENTRY_NOT_FOUND` | No match in specified catalog | Entities |
| 404 | `TILE_NOT_FOUND` | No tile at given coordinates | Tiles |
| 404 | `JOB_NOT_FOUND` | Processing job not found | FITS, Export |
| 409 | `JOB_ALREADY_EXISTS` | Duplicate upload for same file hash | FITS |
| 413 | `FILE_TOO_LARGE` | Upload exceeds 500 MB limit | FITS |
| 422 | `UNPROCESSABLE_ENTITY` | Request body schema valid but semantically wrong | Search, Export |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests for current tier | All |
| 500 | `INTERNAL_ERROR` | Unexpected server error | All |
| 502 | `UPSTREAM_TIMEOUT` | Backend service (SPICE, Elasticsearch) timed out | Ephemeris, Search |
| 503 | `SERVICE_UNAVAILABLE` | Service temporarily unavailable | All |

### 15.3 Validation Error Details

When `INVALID_PARAMETER` is returned, the `details` field contains per-field errors:

```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Request validation failed.",
    "status": 400,
    "details": {
      "fields": [
        {
          "field": "ra",
          "message": "Must be between 0 and 360",
          "value": 400.5
        },
        {
          "field": "radius",
          "message": "Must not exceed 10.0 degrees",
          "value": 15.0
        }
      ]
    }
  }
}
```

---

## 16. Pagination, Filtering & Sorting

### 16.1 Pagination

All collection endpoints use offset-based pagination:

| Parameter | Type | Default | Max | Description |
|-----------|------|---------|-----|-------------|
| `limit` | integer | 50 | 200 (500 for tiles) | Items per page |
| `offset` | integer | 0 | — | Starting index |

The `pagination` object in the response provides `total`, `has_more`, and `next` URL for convenience.

**Cursor-based pagination** (for large result sets >10,000): available via `cursor` parameter on `/search` and `/search/advanced`. When `cursor` is provided, `offset` is ignored.

```
GET /search?q=star&limit=50&cursor=eyJzY29yZSI6NDIuNSwiaWQiOjEyMzR9
```

### 16.2 Sorting

| Parameter | Values | Default |
|-----------|--------|---------|
| `sort` | `_score`, `name`, `magnitude`, `distance`, `data_quality`, `created_at` | `_score` for search, `name` for listings |
| `order` | `asc`, `desc` | `desc` for `_score`, `asc` for others |

Multiple sort fields: `sort=category,name&order=asc,asc` (comma-separated, paired).

### 16.3 Field Filtering (Sparse Fieldsets)

Reduce response payload by requesting only needed fields:

```
GET /entities/5072708048?fields=id,name,position,properties.magnitude_apparent
```

The `fields` parameter accepts a comma-separated list of dot-notation paths. `_links` and `meta` are always included.

---

## 17. Versioning Strategy

### 17.1 URL Versioning

The API uses URL-based versioning with the prefix `/v1`, `/v2`, etc. Major version changes indicate breaking changes to the contract.

### 17.2 Compatibility Guarantees

Within a major version, the API guarantees:

- Existing fields are never removed or renamed
- Existing endpoint URLs are never changed
- New optional fields may be added to responses
- New optional query parameters may be added
- New endpoints may be added
- Error codes are never reused with different meanings

### 17.3 Deprecation Policy

- Deprecated endpoints return `Sunset` header with removal date
- `Deprecation: true` header added to responses
- Minimum 6-month notice before removal
- Deprecated endpoints continue to work until the sunset date
- `/v1/version` response includes deprecation notices

### 17.4 Data Versioning

Separate from API versioning, data has its own version stamp (`X-Data-Version` header) reflecting ETL pipeline updates. Data version format: `YYYY.Q{quarter}.{revision}` (e.g., `2026.Q1.3`).

Client can check `X-Data-Version` against its cached manifest version to decide whether to re-fetch tiles.

---

## 18. SDK & Client Generation

### 18.1 OpenAPI Specification File

The full OpenAPI 3.1 spec is machine-readable at:

```
GET /v1/openapi.json    — JSON format
GET /v1/openapi.yaml    — YAML format
```

These are auto-generated from the API codebase and always reflect the deployed version.

### 18.2 Client SDK Generation

The OpenAPI spec supports code generation via `openapi-generator-cli` for:

| Language | Generator | Package Name |
|----------|-----------|-------------|
| TypeScript | `typescript-fetch` | `@cosmos-explorer/api-client` |
| Python | `python` | `cosmos-explorer-client` |
| Rust | `rust` | `cosmos_explorer_client` |

**TypeScript client example:**

```typescript
import { EntitiesApi, SearchApi, EphemerisApi, Configuration } from '@cosmos-explorer/api-client';

const config = new Configuration({
  basePath: 'https://api.cosmosexplorer.app/v1',
  apiKey: 'ce_reg_...',  // optional
});

const entities = new EntitiesApi(config);
const search = new SearchApi(config);
const ephemeris = new EphemerisApi(config);

// Fetch entity by ENT ID
const sirius = await entities.getEntityByEntId({ entId: 'ENT-1001' });

// Search with filters
const results = await search.search({ q: 'orion', category: 5, limit: 10 });

// Get Earth position at epoch
const earth = await ephemeris.getPosition({ naifId: 399, epoch: 2460780.5 });
```

### 18.3 Binary Tile Decoder

Since tile endpoints return binary data not representable in OpenAPI, a standalone decoder library is provided:

```typescript
import { StarTileDecoder, GalaxyTileDecoder } from '@cosmos-explorer/tile-decoder';

const response = await fetch('/v1/tiles/stars/5/128/64/3');
const buffer = await response.arrayBuffer();

const tile = StarTileDecoder.decode(buffer);
// tile.header: { tileId, starCount, minDistance, maxDistance }
// tile.stars: Array<{ x, y, z, magnitude, colorIndex, spectralType, flags, catalogIndex }>
```

---

## Appendix A — NAIF ID Quick Reference

| NAIF ID | Body | Type |
|---------|------|------|
| 10 | Sun | Star |
| 199 | Mercury | Planet |
| 299 | Venus | Planet |
| 399 | Earth | Planet |
| 301 | Moon | Moon |
| 499 | Mars | Planet |
| 401 | Phobos | Moon |
| 402 | Deimos | Moon |
| 599 | Jupiter | Planet |
| 501–504 | Io, Europa, Ganymede, Callisto | Moon |
| 699 | Saturn | Planet |
| 601–608 | Mimas through Iapetus | Moon |
| 799 | Uranus | Planet |
| 899 | Neptune | Planet |
| 999 | Pluto | Dwarf planet |
| 2000001 | Ceres | Dwarf planet |
| 1000012 | 67P/Churyumov-Gerasimenko | Comet |

Full list: NASA NAIF IDs (https://naif.jpl.nasa.gov/pub/naif/toolkit_docs/C/req/naif_ids.html).

---

## Appendix B — Cross-Reference Matrix

| Endpoint Group | Doc 11 Section | Doc 25 Section | Doc 24 Screen | Doc 30 Test Suite |
|---------------|---------------|----------------|---------------|-------------------|
| Entities | §3.1–3.9 | §6.1 | S-3.0, S-4.0 | TS-API-ENT |
| Search | §5 | §5, §6.1 | S-2.0, S-13.0 | TS-API-SEARCH |
| Tiles | §4.1–4.4 | §7 | — (internal) | TS-API-TILE |
| Ephemeris | — | §9 | S-7.0 | TS-API-EPH |
| Solar System | §3.2, §3.3 | §6.1 | S-5.0, S-6.0 | TS-API-SOLAR |
| FITS | — | §10 | S-13.0 | TS-API-FITS |
| Export | — | §6.1 | S-12.0 | TS-API-EXPORT |
| User Data | — | §6.1 | S-11.0 | TS-API-USER |
| System | — | §6.1, §14 | — | TS-API-SYS |
| WebSocket | — | §7 (tile priority) | — | TS-API-WS |

---

**Revision History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-19 | System | Initial API contract specification |

---

*Document 26 of 33 — Cosmos Explorer Technical Documentation Suite*  
*Cross-references: Doc 11 (Data Model), Doc 25 (Backend Architecture), Doc 24 (AETHER V4 Design), Doc 27 (Frontend State — pending), Doc 30 (Test Cases — pending)*
