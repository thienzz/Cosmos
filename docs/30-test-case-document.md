# Cosmos Explorer — Test Case Document

**Document:** 30 — Test Case Document (SRS-Mapped)  
**Version:** 1.0  
**Date:** 2026-04-19  
**Status:** Published  
**Product:** Cosmos Explorer — Interactive 3D Universe Visualization  
**Depends On:** SRS (Requirements Traceability), Doc 13 (Testing Strategy), Doc 26 (API Contract), Doc 27 (Frontend State)  
**Consumed By:** CI pipeline, QA team

---

## Table of Contents

1. [Overview & Conventions](#1-overview--conventions)
2. [TS-COORD — Coordinate & Math Tests](#2-ts-coord--coordinate--math-tests)
3. [TS-RENDER — Rendering & Visual Tests](#3-ts-render--rendering--visual-tests)
4. [TS-NAV — Navigation & Camera Tests](#4-ts-nav--navigation--camera-tests)
5. [TS-ENTITY — Entity Data & Selection Tests](#5-ts-entity--entity-data--selection-tests)
6. [TS-SEARCH — Search & Autocomplete Tests](#6-ts-search--search--autocomplete-tests)
7. [TS-TIME — Time Simulation & Ephemeris Tests](#7-ts-time--time-simulation--ephemeris-tests)
8. [TS-TILE — Tile Streaming & LOD Tests](#8-ts-tile--tile-streaming--lod-tests)
9. [TS-API — API Contract Tests](#9-ts-api--api-contract-tests)
10. [TS-MODE — Application Mode Tests](#10-ts-mode--application-mode-tests)
11. [TS-AUDIO — Audio System Tests](#11-ts-audio--audio-system-tests)
12. [TS-PERF — Performance Tests](#12-ts-perf--performance-tests)
13. [TS-A11Y — Accessibility Tests](#13-ts-a11y--accessibility-tests)
14. [TS-E2E — End-to-End Journey Tests](#14-ts-e2e--end-to-end-journey-tests)
15. [TS-VQA — Visual QA Acceptance Tests](#15-ts-vqa--visual-qa-acceptance-tests)
16. [TS-DATA — Data Accuracy Validation Tests](#16-ts-data--data-accuracy-validation-tests)
17. [TS-SEC — Security Tests](#17-ts-sec--security-tests)
18. [Traceability Matrix](#18-traceability-matrix)

---

## 1. Overview & Conventions

### 1.1 Test Case Format

Each test case uses the following structure:

| Field | Description |
|-------|-------------|
| **ID** | `TS-{SUITE}-{NNN}` (e.g., `TS-COORD-001`) |
| **Title** | Short descriptive name |
| **SRS Ref** | Requirement ID(s) from the SRS this test covers |
| **Priority** | P0 (critical), P1 (high), P2 (medium), P3 (low) |
| **Type** | Unit, Integration, E2E, Visual, Performance |
| **Preconditions** | Required state or setup before execution |
| **Steps** | Numbered test steps |
| **Expected Result** | What constitutes a pass |
| **Tolerance** | Acceptable margin of error (for numerical tests) |

### 1.2 Execution Environment

- **Unit tests:** Vitest, jsdom, runs in CI (<2 min total)
- **Integration tests:** Vitest + mock servers, runs in CI (<5 min)
- **E2E tests:** Playwright (Chrome, Firefox, WebKit), runs against staging (<10 min)
- **Visual QA tests:** Headless Chrome with canvas capture, runs in CI (<15 min)
- **Performance tests:** Lighthouse CI + custom profiler, runs on staging hardware

### 1.3 Test Data

Standard reference objects used across test suites:

| Object | RA (°) | Dec (°) | Distance (pc) | Mag | Type |
|--------|--------|---------|---------------|-----|------|
| Sirius | 101.2865 | −16.7161 | 2.636 | −1.46 | Star (A1V) |
| Polaris | 37.9546 | 89.2641 | 132.9 | 1.98 | Star (F7Ib) |
| Betelgeuse | 88.7929 | 7.4070 | 168.1 | 0.50 | Star (M1-2Ia) |
| Orion Nebula (M42) | 83.8221 | −5.3911 | 412 | 4.0 | Nebula |
| Andromeda (M31) | 10.6847 | 41.2688 | 778,000 | 3.44 | Galaxy |
| Earth (NAIF 399) | — | — | 1 AU | — | Planet |
| Jupiter (NAIF 599) | — | — | 5.2 AU | — | Planet |

---

## 2. TS-COORD — Coordinate & Math Tests

### TS-COORD-001: Equatorial to Galactic Conversion — Sirius
- **SRS Ref:** SRS §3.2.1 (Coordinate Systems)
- **Priority:** P0 | **Type:** Unit
- **Steps:** Convert Sirius (RA=101.2865°, Dec=−16.7161°) to galactic coordinates
- **Expected:** l=227.23°, b=−8.89° | **Tolerance:** ±0.01°

### TS-COORD-002: Equatorial to Galactic Conversion — Galactic Center
- **SRS Ref:** SRS §3.2.1
- **Priority:** P0 | **Type:** Unit
- **Steps:** Convert Galactic Center (RA=266.405°, Dec=−28.936°) to galactic coordinates
- **Expected:** l=0.0°, b=0.0° | **Tolerance:** ±0.1°

### TS-COORD-003: Spherical to Cartesian Round-Trip
- **SRS Ref:** SRS §3.2.1
- **Priority:** P0 | **Type:** Unit
- **Steps:** Convert RA/Dec/distance → Cartesian → back to RA/Dec/distance for 100 random positions
- **Expected:** All values match within tolerance | **Tolerance:** RA ±0.0001°, Dec ±0.0001°, dist ±0.001 pc

### TS-COORD-004: Polar Singularity — North Pole
- **SRS Ref:** SRS §3.2.1
- **Priority:** P1 | **Type:** Unit
- **Steps:** Convert Dec=+90° (any RA) to Cartesian and back
- **Expected:** No NaN, no division-by-zero; Dec=90° preserved, RA=0° (degenerate)

### TS-COORD-005: Polar Singularity — South Pole
- **SRS Ref:** SRS §3.2.1
- **Priority:** P1 | **Type:** Unit
- **Steps:** Convert Dec=−90° to Cartesian and back
- **Expected:** No NaN; Dec=−90° preserved

### TS-COORD-006: Kepler Equation Solver — Circular Orbit (e=0)
- **SRS Ref:** SRS §3.3 (Orbital Mechanics)
- **Priority:** P0 | **Type:** Unit
- **Steps:** Solve M=90° with e=0
- **Expected:** E=90° (eccentric anomaly = mean anomaly for circular orbits) | **Tolerance:** ±1e-10 rad

### TS-COORD-007: Kepler Equation Solver — Eccentric Orbit (e=0.9)
- **SRS Ref:** SRS §3.3
- **Priority:** P0 | **Type:** Unit
- **Steps:** Solve M=1.0 rad with e=0.9, verify via M = E − e·sin(E)
- **Expected:** |M − (E − e·sin(E))| < 1e-12 rad

### TS-COORD-008: Kepler Solver — Near-Parabolic (e=0.999)
- **SRS Ref:** SRS §3.3
- **Priority:** P1 | **Type:** Unit
- **Steps:** Solve for e=0.999, M=0.5 rad
- **Expected:** Converges within 50 iterations; residual < 1e-10

### TS-COORD-009: Distance Parsec ↔ Light-Year Conversion
- **SRS Ref:** SRS §3.2.1
- **Priority:** P0 | **Type:** Unit
- **Steps:** Convert 1 pc → ly and back
- **Expected:** 1 pc = 3.26156 ly | **Tolerance:** ±0.00001 ly

### TS-COORD-010: Spectral Type to Color Temperature
- **SRS Ref:** SRS §3.4 (Stellar Properties)
- **Priority:** P1 | **Type:** Unit
- **Steps:** Convert O5V → T_eff, verify ≈40,000 K; G2V → ≈5,778 K; M5V → ≈3,000 K
- **Expected:** Within 10% of standard values

---

## 3. TS-RENDER — Rendering & Visual Tests

### TS-RENDER-001: Star Point Rendering — Correct Color by Spectral Type
- **SRS Ref:** SRS §3.4.1 (Star Visualization)
- **Priority:** P0 | **Type:** Visual
- **Steps:** Render stars of types O, B, A, F, G, K, M; capture colors
- **Expected:** O=blue-white, B=blue, A=white, F=yellow-white, G=yellow, K=orange, M=red. ΔE2000 < 5.0 vs reference palette

### TS-RENDER-002: Star Brightness Scales with Magnitude
- **SRS Ref:** SRS §3.4.1
- **Priority:** P0 | **Type:** Visual
- **Steps:** Render Sirius (mag −1.46) and a mag +6.0 star side-by-side
- **Expected:** Sirius visually significantly brighter; luminance ratio ≥ 100:1 (7.46 magnitudes difference)

### TS-RENDER-003: Planet Procedural PBR Shader — Earth Recognizable
- **SRS Ref:** PRD FR-032 (Procedural PBR Shaders)
- **Priority:** P0 | **Type:** Visual
- **Steps:** Render Earth with procedural PBR shader pipeline
- **Expected:** Recognizable blue/green/white globe; ΔE2000 < 5.0 vs NASA reference image

### TS-RENDER-004: Planet Procedural PBR Shader — Jupiter Banding
- **SRS Ref:** PRD FR-032
- **Priority:** P1 | **Type:** Visual
- **Steps:** Render Jupiter with procedural shader
- **Expected:** Visible equatorial cloud bands; SSIM > 0.65 vs reference

### TS-RENDER-005: Nebula Volumetric Rendering — Orion Nebula
- **SRS Ref:** SRS §3.5 (Nebula Visualization)
- **Priority:** P1 | **Type:** Visual
- **Steps:** Render M42 with volumetric shader
- **Expected:** Recognizable nebula morphology; ΔE2000 < 4.0 vs reference colors

### TS-RENDER-006: Post-Processing — Bloom Effect
- **SRS Ref:** SRS §3.7.1 (Post-Processing)
- **Priority:** P2 | **Type:** Visual
- **Steps:** Render bright star with bloom enabled/disabled; compare
- **Expected:** Bloom creates visible glow halo extending beyond point; no bloom artifacts on faint stars

### TS-RENDER-007: AETHER V4 CRT Scanlines
- **SRS Ref:** Doc 24 §3.4 (AETHER Effects)
- **Priority:** P2 | **Type:** Visual
- **Steps:** Enable CRT scanlines effect; capture screenshot
- **Expected:** Horizontal scan lines visible at ~2px spacing; no interference with readability

### TS-RENDER-008: WebGL Context Loss and Recovery
- **SRS Ref:** SRS §4.3 (Reliability)
- **Priority:** P0 | **Type:** Integration
- **Steps:** Trigger `webglcontextlost` event; wait; trigger `webglcontextrestored`
- **Expected:** Render loop pauses, "Restoring…" overlay shows, rendering resumes within 10s

### TS-RENDER-009: LOD Transition Smoothness
- **SRS Ref:** SRS §3.7.3 (Level of Detail)
- **Priority:** P1 | **Type:** Visual
- **Steps:** Zoom from stellar to solar system scale; observe LOD transitions
- **Expected:** No visible popping; objects fade/crossfade between LOD levels over ≥200ms

### TS-RENDER-010: Draw Call Budget
- **SRS Ref:** Doc 10 §3 (Geometry Constraints)
- **Priority:** P0 | **Type:** Performance
- **Steps:** Render full star field at default view; count draw calls via `renderer.info`
- **Expected:** ≤500 draw calls per frame

---

## 4. TS-NAV — Navigation & Camera Tests

### TS-NAV-001: Free-Flight Navigation — WASD Keys
- **SRS Ref:** SRS §3.1.1 (Navigation Controls)
- **Priority:** P0 | **Type:** E2E
- **Steps:** Press W, verify camera moves forward; A=left; S=back; D=right
- **Expected:** Camera position changes in correct direction; movement speed proportional to current scale

### TS-NAV-002: Orbit Mode — Click and Orbit Entity
- **SRS Ref:** SRS §3.1.2 (Orbit Mode)
- **Priority:** P0 | **Type:** E2E
- **Steps:** Click on Sirius; verify camera enters orbit mode; drag to orbit
- **Expected:** Camera orbits around Sirius maintaining constant distance; entity stays centered

### TS-NAV-003: Fly-To Animation
- **SRS Ref:** SRS §3.1.3 (Fly-To)
- **Priority:** P0 | **Type:** Integration
- **Steps:** From default view, trigger flyTo(Sirius); measure duration and path
- **Expected:** Smooth camera transition over 2–5 seconds; no frame drops below 30 FPS during transit

### TS-NAV-004: Scale Regime Transition — Solar to Stellar
- **SRS Ref:** SRS §3.2.2 (Scale Transitions), Doc 27 §9
- **Priority:** P0 | **Type:** Integration
- **Steps:** Start at Earth (AU scale), zoom out past 500 AU threshold
- **Expected:** Scale regime changes to `stellar`; unit display switches to pc/ly; solar system objects fade

### TS-NAV-005: Scale Regime Hysteresis
- **SRS Ref:** Doc 27 §9.2
- **Priority:** P1 | **Type:** Unit
- **Steps:** Zoom out to 550 AU (past threshold), zoom back in to 480 AU (within hysteresis band)
- **Expected:** Regime stays `stellar` (does not flicker back to `solar_system`)

### TS-NAV-006: Logarithmic Depth Buffer — No Z-Fighting
- **SRS Ref:** SRS §3.7.2 (Rendering Quality)
- **Priority:** P0 | **Type:** Visual
- **Steps:** View Saturn's rings edge-on at close range
- **Expected:** No z-fighting artifacts between ring layers and planet surface

### TS-NAV-007: Camera Near/Far Clipping Across Scales
- **SRS Ref:** SRS §3.7.2
- **Priority:** P1 | **Type:** Integration
- **Steps:** Navigate from asteroid surface (1 km) to cosmic web view (100 Mpc); verify no clipping
- **Expected:** Objects visible at all scales; no near-plane clipping of close objects, no far-plane loss of distant objects

---

## 5. TS-ENTITY — Entity Data & Selection Tests

### TS-ENTITY-001: Select Star — Info Panel Displays Correct Data
- **SRS Ref:** SRS §3.6.1 (Entity Information)
- **Priority:** P0 | **Type:** E2E
- **Steps:** Click Sirius; verify info panel shows name, spectral type, distance, magnitude
- **Expected:** Name="Sirius", Spectral="A1V", Distance=8.60 ly, Magnitude=−1.46

### TS-ENTITY-002: Select Planet — Orbital Elements Displayed
- **SRS Ref:** SRS §3.6.2
- **Priority:** P0 | **Type:** E2E
- **Steps:** Click Earth in solar system view; check info panel
- **Expected:** Semi-major axis ≈ 1.0 AU, eccentricity ≈ 0.0167, period ≈ 365.26 days

### TS-ENTITY-003: Entity Toggles — Star Corona
- **SRS Ref:** PRD FR-047 (Interactive Toggles)
- **Priority:** P1 | **Type:** E2E
- **Steps:** Select Sirius; toggle "corona" on and off
- **Expected:** Corona effect appears/disappears; no other visual changes

### TS-ENTITY-004: Selection History — Back/Forward
- **SRS Ref:** Doc 27 §5.2
- **Priority:** P2 | **Type:** Integration
- **Steps:** Select Sirius, then Polaris, then Betelgeuse; press Back twice; press Forward once
- **Expected:** Back→Polaris, Back→Sirius, Forward→Polaris

### TS-ENTITY-005: Entity by ENT ID — All 9 Categories Have Representatives
- **SRS Ref:** Doc 17 (Entity Catalog)
- **Priority:** P1 | **Type:** Integration
- **Steps:** Fetch entities ENT-1001, ENT-2001, ENT-3001, ENT-4001, ENT-5001, ENT-6001, ENT-7001, ENT-8001, ENT-9001
- **Expected:** All return valid entity data; each has correct `category` value

---

## 6. TS-SEARCH — Search & Autocomplete Tests

### TS-SEARCH-001: Basic Text Search — "Sirius"
- **SRS Ref:** SRS §3.8.1 (Search)
- **Priority:** P0 | **Type:** Integration
- **Steps:** Search "Sirius"
- **Expected:** Sirius appears as first result; score > 90

### TS-SEARCH-002: Partial Search — "Sir"
- **SRS Ref:** SRS §3.8.1
- **Priority:** P0 | **Type:** Integration
- **Steps:** Search "Sir"
- **Expected:** Sirius in results (prefix match)

### TS-SEARCH-003: Autocomplete Speed
- **SRS Ref:** SRS §4.1 (Performance)
- **Priority:** P0 | **Type:** Performance
- **Steps:** Trigger autocomplete for "and"; measure response time
- **Expected:** Results returned in <50ms (P95)

### TS-SEARCH-004: Catalog ID Search — "M42"
- **SRS Ref:** SRS §3.8.2
- **Priority:** P1 | **Type:** Integration
- **Steps:** Search "M42"
- **Expected:** Orion Nebula appears as first result

### TS-SEARCH-005: Cone Search — Solar Neighborhood
- **SRS Ref:** SRS §3.8.3 (Spatial Search)
- **Priority:** P1 | **Type:** Integration
- **Steps:** Cone search at RA=101.29, Dec=−16.72, radius=1°
- **Expected:** Sirius in results; all results within 1° of center

### TS-SEARCH-006: Advanced Search — Temperature Filter
- **SRS Ref:** SRS §3.8.4 (Advanced Search)
- **Priority:** P1 | **Type:** Integration
- **Steps:** Advanced search: category=1, temperature_k between 5000 and 7000
- **Expected:** All returned stars have T_eff in [5000, 7000] K

### TS-SEARCH-007: Empty Results
- **SRS Ref:** SRS §3.8.1
- **Priority:** P2 | **Type:** Integration
- **Steps:** Search "xyznonexistent123"
- **Expected:** Empty results array; total=0; no error

---

## 7. TS-TIME — Time Simulation & Ephemeris Tests

### TS-TIME-001: Earth Position at J2000.0
- **SRS Ref:** SRS §3.3.1 (Ephemeris Accuracy)
- **Priority:** P0 | **Type:** Unit
- **Steps:** Query ephemeris for NAIF 399 at JD 2451545.0 (J2000.0)
- **Expected:** Position matches JPL Horizons reference | **Tolerance:** ±0.001 AU per axis

### TS-TIME-002: Jupiter Position at Known Opposition
- **SRS Ref:** SRS §3.3.1
- **Priority:** P0 | **Type:** Unit
- **Steps:** Query Jupiter at 2026 opposition epoch
- **Expected:** Position matches JPL Horizons | **Tolerance:** ±0.01 AU

### TS-TIME-003: Time Slider — Playback Forward
- **SRS Ref:** SRS §3.9.1 (Time Controls)
- **Priority:** P0 | **Type:** E2E
- **Steps:** Set epoch to 2020-01-01; press Play at 365.25× speed; wait 2 seconds
- **Expected:** Epoch advances by ~2 years; planet positions update visually

### TS-TIME-004: Time Slider — Set Specific Date
- **SRS Ref:** SRS §3.9.1
- **Priority:** P1 | **Type:** E2E
- **Steps:** Enter date 1969-07-20 in time input
- **Expected:** Epoch sets to JD 2440423.5; Moon near Earth (Apollo 11 epoch)

### TS-TIME-005: Epoch Boundary — Minimum (1550 CE)
- **SRS Ref:** Doc 26 §8.1 (Epoch Out of Range)
- **Priority:** P1 | **Type:** Integration
- **Steps:** Attempt to set epoch to 1500 CE (below SPICE range)
- **Expected:** Clamped to JD 2287184.5 (1550 CE); warning shown

### TS-TIME-006: Batch Ephemeris — All Planets
- **SRS Ref:** Doc 26 §8.2
- **Priority:** P0 | **Type:** Integration
- **Steps:** Batch request for 8 planets at 3 epochs
- **Expected:** 24 position results; all within tolerance of JPL Horizons

### TS-TIME-007: Ephemeris WebSocket Push
- **SRS Ref:** Doc 26 §14.3.2
- **Priority:** P1 | **Type:** Integration
- **Steps:** Connect WebSocket; send `time_update`; verify `ephemeris_push` received
- **Expected:** Push message contains all requested body positions within 200ms

---

## 8. TS-TILE — Tile Streaming & LOD Tests

### TS-TILE-001: Manifest Fetch on Startup
- **SRS Ref:** Doc 26 §7.4
- **Priority:** P0 | **Type:** Integration
- **Steps:** Load app; verify manifest fetched and parsed
- **Expected:** `tileStore.manifest` is non-null; contains star, galaxy, cosmic_web sections

### TS-TILE-002: Star Tile Decode — Binary Format
- **SRS Ref:** Doc 11 §4.1 (Star Tile Format)
- **Priority:** P0 | **Type:** Unit
- **Steps:** Decode a known tile binary; verify header fields and first 3 star records
- **Expected:** Star count, coordinates, magnitude, color index match expected values

### TS-TILE-003: Tile LRU Eviction
- **SRS Ref:** Doc 27 §8.5 (Memory Management)
- **Priority:** P1 | **Type:** Unit
- **Steps:** Load tiles until GPU memory exceeds 90% of budget; verify eviction
- **Expected:** Least-recently-accessed tiles evicted; memory drops below 85%

### TS-TILE-004: Tile Cache Hit — IndexedDB
- **SRS Ref:** Doc 27 §13.2
- **Priority:** P1 | **Type:** Integration
- **Steps:** Load tile A; navigate away; navigate back (tile A visible again)
- **Expected:** Tile A loaded from IndexedDB (no network request); load time <5ms

### TS-TILE-005: Tile 404 Handling — Empty Region
- **SRS Ref:** Doc 26 §7.1 (TILE_NOT_FOUND)
- **Priority:** P1 | **Type:** Integration
- **Steps:** Request tile at coordinates known to be empty space
- **Expected:** 404 returned; tile marked as `failed` in store; no retry loop; render continues

### TS-TILE-006: Galaxy HEALPix Tile Decode
- **SRS Ref:** Doc 11 §4.2
- **Priority:** P0 | **Type:** Unit
- **Steps:** Decode galaxy tile binary; verify header and first 3 galaxy records
- **Expected:** Galaxy count, RA, Dec, redshift, magnitude match expected values

---

## 9. TS-API — API Contract Tests

### TS-API-001: Entity by ID — 200 Response Matches Schema
- **SRS Ref:** Doc 26 §5.1
- **Priority:** P0 | **Type:** Integration
- **Steps:** GET /entities/{id} for Sirius; validate response against OpenAPI schema
- **Expected:** All required fields present; types match; `_links` present

### TS-API-002: Entity Not Found — 404
- **SRS Ref:** Doc 26 §5.1
- **Priority:** P1 | **Type:** Integration
- **Steps:** GET /entities/999999999999
- **Expected:** 404 with `error.code = "ENTITY_NOT_FOUND"`

### TS-API-003: Rate Limit — 429 Response
- **SRS Ref:** Doc 26 §3.3
- **Priority:** P0 | **Type:** Integration
- **Steps:** Send 65 requests in 1 minute as anonymous user
- **Expected:** 61st+ requests return 429 with `retry_after_seconds` field

### TS-API-004: Search — Pagination
- **SRS Ref:** Doc 26 §16.1
- **Priority:** P1 | **Type:** Integration
- **Steps:** Search "star" with limit=5; verify `pagination.has_more=true`; follow `next` URL
- **Expected:** Second page returns different results; offsets correct

### TS-API-005: Health Endpoint
- **SRS Ref:** Doc 26 §13.1
- **Priority:** P0 | **Type:** Integration
- **Steps:** GET /health
- **Expected:** 200 with all services "up"

### TS-API-006: Version Endpoint — Data Version
- **SRS Ref:** Doc 26 §13.2
- **Priority:** P1 | **Type:** Integration
- **Steps:** GET /version
- **Expected:** `data_version` matches `X-Data-Version` header format

### TS-API-007: CORS Headers
- **SRS Ref:** Doc 26 §2.4
- **Priority:** P0 | **Type:** Integration
- **Steps:** Send OPTIONS preflight request from allowed origin
- **Expected:** `Access-Control-Allow-Origin` header present and correct

### TS-API-008: ETag Caching — Conditional GET
- **SRS Ref:** Doc 26 §2.4
- **Priority:** P2 | **Type:** Integration
- **Steps:** GET entity; save ETag; re-request with `If-None-Match`
- **Expected:** 304 Not Modified (no body)

---

## 10. TS-MODE — Application Mode Tests

### TS-MODE-001: Default Mode is Exploration
- **SRS Ref:** Doc 24 §4 (Application Modes)
- **Priority:** P0 | **Type:** E2E
- **Steps:** Load app; check mode store
- **Expected:** `activeMode = 'exploration'`

### TS-MODE-002: Switch to Research Mode
- **SRS Ref:** Doc 24 §4, Doc 27 §10
- **Priority:** P1 | **Type:** E2E
- **Steps:** Click Research mode button
- **Expected:** Mode switches; advanced search becomes available; FITS import button appears

### TS-MODE-003: Guided Tour — Start and Navigate
- **SRS Ref:** SRS §3.10 (Guided Tours)
- **Priority:** P1 | **Type:** E2E
- **Steps:** Enter Education mode; start "Solar System Tour"; click Next 3 times
- **Expected:** Camera follows scripted path; tour step counter advances; narration text updates

### TS-MODE-004: Guided Tour — Exit Mid-Tour
- **SRS Ref:** Doc 27 §10.2
- **Priority:** P2 | **Type:** E2E
- **Steps:** Start a tour; advance 2 steps; click Exit
- **Expected:** Tour exits; mode reverts to Exploration; camera stays at current position

### TS-MODE-005: Mode Switch Preserves Camera
- **SRS Ref:** Doc 27 §10.2
- **Priority:** P2 | **Type:** Integration
- **Steps:** Navigate to Orion Nebula in Exploration; switch to Observation mode
- **Expected:** Camera position unchanged; Orion Nebula still visible

---

## 11. TS-AUDIO — Audio System Tests

### TS-AUDIO-001: Audio Context Initializes on User Interaction
- **SRS Ref:** SRS §3.11 (Audio System)
- **Priority:** P1 | **Type:** E2E
- **Steps:** Load app; verify no audio plays; click anywhere
- **Expected:** AudioContext created after first user gesture (browser autoplay policy)

### TS-AUDIO-002: Volume Control
- **SRS Ref:** SRS §3.11.2
- **Priority:** P1 | **Type:** Integration
- **Steps:** Set masterVolume to 0.5; verify audio output level
- **Expected:** Audio gain node set to 0.5

### TS-AUDIO-003: Mute Toggle
- **SRS Ref:** SRS §3.11.2
- **Priority:** P1 | **Type:** E2E
- **Steps:** Toggle mute on; verify silence; toggle off; verify audio resumes
- **Expected:** Audio gain = 0 when muted; restores to previous level on unmute

### TS-AUDIO-004: Scale-Dependent Soundscape
- **SRS Ref:** SRS §3.11.1
- **Priority:** P2 | **Type:** Integration
- **Steps:** Navigate from solar system to galactic scale; monitor active oscillators
- **Expected:** Soundscape changes character at scale transitions; no audio glitches

---

## 12. TS-PERF — Performance Tests

### TS-PERF-001: Frame Rate — Mid-Tier GPU Baseline
- **SRS Ref:** SRS §4.1.1 (Frame Rate), Doc 10 §3
- **Priority:** P0 | **Type:** Performance
- **Steps:** Render default star field for 30 seconds; measure FPS
- **Expected:** Average ≥55 FPS; P1 ≥45 FPS; zero frames >33ms on mid-tier GPU

### TS-PERF-002: First Contentful Paint
- **SRS Ref:** Doc 27 §14.1
- **Priority:** P0 | **Type:** Performance
- **Steps:** Lighthouse CI audit
- **Expected:** FCP <1.5s

### TS-PERF-003: Time to Interactive
- **SRS Ref:** Doc 27 §14.1
- **Priority:** P0 | **Type:** Performance
- **Steps:** Lighthouse CI audit
- **Expected:** TTI <3.5s

### TS-PERF-004: Bundle Size
- **SRS Ref:** Doc 27 §14.1
- **Priority:** P0 | **Type:** Performance
- **Steps:** Build production; measure gzipped JS bundle
- **Expected:** <500 KB total JS (gzipped)

### TS-PERF-005: Memory — No Leak After 10-Minute Session
- **SRS Ref:** SRS §4.1.3 (Memory)
- **Priority:** P0 | **Type:** Performance
- **Steps:** Automate 10-minute exploration session (navigate, search, select, zoom); measure heap
- **Expected:** JS heap does not grow >50 MB beyond baseline; no monotonic increase

### TS-PERF-006: Tile Load Latency
- **SRS Ref:** Doc 25 §7.2 (Tile Server Performance)
- **Priority:** P1 | **Type:** Performance
- **Steps:** Request 100 star tiles; measure P50 and P99 latency
- **Expected:** P50 <25ms (cache miss); P99 <100ms

### TS-PERF-007: Main Thread Long Tasks
- **SRS Ref:** Doc 27 §14.2
- **Priority:** P1 | **Type:** Performance
- **Steps:** Profile main thread during typical navigation for 30 seconds
- **Expected:** No individual task >50ms on main thread

---

## 13. TS-A11Y — Accessibility Tests

### TS-A11Y-001: Keyboard Navigation — All Controls Reachable
- **SRS Ref:** SRS §4.4 (Accessibility), Doc 16
- **Priority:** P0 | **Type:** E2E
- **Steps:** Tab through all UI controls; verify focus ring visible; verify all interactive elements reachable
- **Expected:** Every button, input, slider, panel reachable via Tab/Shift+Tab

### TS-A11Y-002: Screen Reader — Entity Info Announced
- **SRS Ref:** SRS §4.4, Doc 16
- **Priority:** P0 | **Type:** E2E
- **Steps:** Select Sirius with screen reader active; verify ARIA live region announces entity data
- **Expected:** Screen reader announces "Sirius, Main Sequence Star, distance 8.6 light-years"

### TS-A11Y-003: Reduced Motion — Animations Disabled
- **SRS Ref:** SRS §4.4.2
- **Priority:** P1 | **Type:** E2E
- **Steps:** Set `prefers-reduced-motion: reduce` in OS/browser; reload
- **Expected:** Fly-to animations instant; no bloom pulsing; CRT scanline animation stopped

### TS-A11Y-004: Color Contrast — WCAG AA
- **SRS Ref:** SRS §4.4.1, Doc 16
- **Priority:** P0 | **Type:** Visual
- **Steps:** Run axe-core audit on all panels and overlays
- **Expected:** All text meets WCAG 2.1 AA contrast ratio (4.5:1 normal text, 3:1 large text)

### TS-A11Y-005: High Contrast Mode
- **SRS Ref:** Doc 27 §5.7
- **Priority:** P2 | **Type:** E2E
- **Steps:** Enable highContrast setting; verify UI adjusts
- **Expected:** All text meets WCAG AAA (7:1); borders enhanced; no visual information lost

---

## 14. TS-E2E — End-to-End Journey Tests

### TS-E2E-001: Journey J1 — First Contact (Casual Explorer)
- **SRS Ref:** Doc 21 (Journey Screen Designs), Doc 05 §J1
- **Priority:** P0 | **Type:** E2E
- **Steps:** Load app → see loading screen → star field appears → zoom to Earth → click Earth → read info panel → close panel → search "Jupiter" → fly to Jupiter → view Jupiter
- **Expected:** Complete journey <60 seconds; no errors; all transitions smooth

### TS-E2E-002: Journey J2 — Educator Demo
- **SRS Ref:** Doc 21 §J2, Doc 05 §J2
- **Priority:** P1 | **Type:** E2E
- **Steps:** Switch to Education mode → start Solar System Tour → advance through 5 steps → exit tour → switch to Exploration
- **Expected:** Tour narration displayed at each step; camera follows path; clean exit

### TS-E2E-003: Journey J5 — Research Workflow
- **SRS Ref:** Doc 21 §J5, Doc 05 §J5
- **Priority:** P1 | **Type:** E2E
- **Steps:** Switch to Research mode → open advanced search → filter stars by temperature → select result → view data overlay → export image
- **Expected:** Filter works; overlay displays; export job completes

### TS-E2E-004: Bookmark Create, Persist, Retrieve
- **SRS Ref:** SRS §3.12 (Bookmarks)
- **Priority:** P1 | **Type:** E2E
- **Steps:** Select Sirius → create bookmark "My Sirius" → close info panel → open bookmarks panel → click bookmark
- **Expected:** Camera returns to Sirius; info panel opens; bookmark label matches

### TS-E2E-005: Cross-Browser — Chrome, Firefox, Safari
- **SRS Ref:** SRS §4.2 (Browser Support)
- **Priority:** P0 | **Type:** E2E
- **Steps:** Run TS-E2E-001 in Chrome, Firefox, and Safari (WebKit)
- **Expected:** All three browsers pass; no browser-specific failures

---

## 15. TS-VQA — Visual QA Acceptance Tests

Per Doc 13 §4 (Visual QA Acceptance Criteria):

### TS-VQA-001: Color Accuracy — Stars (CIE ΔE2000)
- **Priority:** P0 | **Type:** Visual
- **Steps:** Render 100 reference stars; measure ΔE2000 against reference palette
- **Expected:** Mean ΔE < 3.0; no individual star ΔE > 5.0

### TS-VQA-002: Color Accuracy — Planets (CIE ΔE2000)
- **Priority:** P0 | **Type:** Visual
- **Steps:** Render all 8 planets; measure ΔE against NASA reference images
- **Expected:** Mean ΔE < 5.0

### TS-VQA-003: Color Accuracy — Nebulae (CIE ΔE2000)
- **Priority:** P1 | **Type:** Visual
- **Steps:** Render 10 reference nebulae; measure ΔE
- **Expected:** Mean ΔE < 4.0

### TS-VQA-004: Structural Similarity — Planets (SSIM)
- **Priority:** P1 | **Type:** Visual
- **Steps:** Render Earth, Jupiter, Saturn; compare SSIM against reference
- **Expected:** SSIM > 0.65 for each planet

### TS-VQA-005: Perceptual Hash Regression (pHash)
- **Priority:** P0 | **Type:** Visual
- **Steps:** Render 20 reference scenes; compare pHash against baseline
- **Expected:** Hamming distance ≤8 for all scenes (>8 triggers manual review)

### TS-VQA-006: Animation FPS — Star Corona
- **Priority:** P1 | **Type:** Performance
- **Steps:** Animate star corona for 10 seconds; measure FPS
- **Expected:** ≥55 FPS sustained

### TS-VQA-007: Animation FPS — Black Hole Accretion
- **Priority:** P1 | **Type:** Performance
- **Steps:** Animate black hole accretion disk for 10 seconds; measure FPS
- **Expected:** ≥40 FPS sustained

---

## 16. TS-DATA — Data Accuracy Validation Tests

### TS-DATA-001: Sirius Position Matches Gaia DR3
- **SRS Ref:** SRS §3.2.1
- **Priority:** P0 | **Type:** Unit
- **Steps:** Query Sirius from database; compare RA, Dec, parallax against Gaia DR3 catalog
- **Expected:** RA within ±0.001°, Dec within ±0.001°, parallax within ±0.1 mas

### TS-DATA-002: Andromeda Distance
- **Priority:** P0 | **Type:** Unit
- **Steps:** Query M31 distance from database
- **Expected:** 778 kpc ± 33 kpc (per NED/literature value)

### TS-DATA-003: Solar System Body Count
- **Priority:** P0 | **Type:** Integration
- **Steps:** Query all solar system bodies
- **Expected:** ≥8 planets, ≥5 dwarf planets, ≥200 moons

### TS-DATA-004: Star Count in Database
- **Priority:** P1 | **Type:** Integration
- **Steps:** Count total star entities
- **Expected:** ≥1.5 billion (may vary by ETL version)

### TS-DATA-005: Entity Category Coverage — All 9 Categories
- **Priority:** P0 | **Type:** Integration
- **Steps:** Count entities per category
- **Expected:** All 9 categories have ≥1 entity

### TS-DATA-006: Catalog Cross-Reference — Messier Objects
- **Priority:** P1 | **Type:** Integration
- **Steps:** Look up M1 through M110 by catalog endpoint
- **Expected:** All 110 Messier objects resolved; each has correct category

---

## 17. TS-SEC — Security Tests

### TS-SEC-001: HTTPS Redirect
- **SRS Ref:** Doc 26 §1 (Protocol)
- **Priority:** P0 | **Type:** Integration
- **Steps:** Send HTTP request to API
- **Expected:** 301 redirect to HTTPS

### TS-SEC-002: API Key Validation — Invalid Key
- **Priority:** P0 | **Type:** Integration
- **Steps:** Send request with `Authorization: Bearer invalid_key`
- **Expected:** 401 Unauthorized

### TS-SEC-003: SQL Injection — Search Parameter
- **Priority:** P0 | **Type:** Integration
- **Steps:** Search with `q='; DROP TABLE entities; --`
- **Expected:** Normal search result (empty or matched); no database error

### TS-SEC-004: XSS — Entity Name
- **Priority:** P0 | **Type:** Integration
- **Steps:** Attempt to create bookmark with label `<script>alert(1)</script>`
- **Expected:** Label stored as escaped text; no script execution on display

### TS-SEC-005: CORS — Disallowed Origin
- **Priority:** P1 | **Type:** Integration
- **Steps:** Send request from `Origin: https://evil.example.com`
- **Expected:** No `Access-Control-Allow-Origin` header in response

### TS-SEC-006: Rate Limit — Burst Protection
- **Priority:** P0 | **Type:** Integration
- **Steps:** Send 15 requests in 1 second (exceeds burst limit of 10/s for anonymous)
- **Expected:** 11th+ requests get 429

---

## 18. Traceability Matrix

| SRS Requirement Area | Test Suites | Key Test Cases | Coverage |
|---------------------|------------|----------------|----------|
| Coordinate Systems (§3.2) | TS-COORD | 001–005, 009 | 6 tests |
| Orbital Mechanics (§3.3) | TS-COORD, TS-TIME | 006–008, TIME-001–006 | 9 tests |
| Star Visualization (§3.4) | TS-RENDER, TS-VQA | RENDER-001–002, VQA-001 | 3 tests |
| Planet Visualization (§3.4) | TS-RENDER, TS-VQA | RENDER-003–004, VQA-002–004 | 5 tests |
| Nebula Visualization (§3.5) | TS-RENDER, TS-VQA | RENDER-005, VQA-003 | 2 tests |
| Entity Information (§3.6) | TS-ENTITY | 001–005 | 5 tests |
| Rendering Quality (§3.7) | TS-RENDER | 006–010 | 5 tests |
| Search (§3.8) | TS-SEARCH | 001–007 | 7 tests |
| Time Simulation (§3.9) | TS-TIME | 001–007 | 7 tests |
| Guided Tours (§3.10) | TS-MODE | 003–004 | 2 tests |
| Audio (§3.11) | TS-AUDIO | 001–004 | 4 tests |
| Bookmarks (§3.12) | TS-E2E | 004 | 1 test |
| Navigation (§3.1) | TS-NAV | 001–007 | 7 tests |
| Performance (§4.1) | TS-PERF | 001–007 | 7 tests |
| Browser Support (§4.2) | TS-E2E | 005 | 1 test |
| Reliability (§4.3) | TS-RENDER | 008 | 1 test |
| Accessibility (§4.4) | TS-A11Y | 001–005 | 5 tests |
| API Contract (Doc 26) | TS-API | 001–008 | 8 tests |
| Tile System (Doc 11, 25) | TS-TILE | 001–006 | 6 tests |
| Visual QA (Doc 13) | TS-VQA | 001–007 | 7 tests |
| Data Accuracy | TS-DATA | 001–006 | 6 tests |
| Security | TS-SEC | 001–006 | 6 tests |
| User Journeys (Doc 21) | TS-E2E | 001–005 | 5 tests |

**Total: 113 test cases across 16 test suites**

---

**Revision History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-19 | System | Initial test case document with SRS traceability |

---

*Document 30 of 33 — Cosmos Explorer Technical Documentation Suite*  
*Cross-references: SRS (Requirements), Doc 13 (Testing Strategy), Doc 26 (API Contract), Doc 27 (Frontend State)*
