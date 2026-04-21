# Cosmos Explorer — Technical Specifications

**Document Version:** 1.0  
**Date:** 2026-04-16  
**Status:** Active

---

## 1. Browser & Device Requirements

### Minimum Specifications

| Category | Requirement |
|----------|-------------|
| **Browser** | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ |
| **WebGL** | WebGL 2.0 (mandatory) |
| **CPU** | Dual-core 2.0 GHz processor |
| **RAM** | 2 GB available system memory |
| **GPU** | Integrated graphics with 256 MB VRAM |
| **Display** | 1024×768 minimum resolution |
| **Network** | 3G or better (1 Mbps sustained) |

### Recommended Specifications

| Category | Specification |
|----------|---------------|
| **Browser** | Chrome 120+, Firefox 121+, Safari 17+, Edge 120+ |
| **CPU** | Quad-core 3.0 GHz or higher |
| **RAM** | 8 GB or more |
| **GPU** | Dedicated GPU (GTX 1050 Ti, RTX 3050, M1/M2 Pro, or equivalent) |
| **VRAM** | 2 GB or more |
| **Display** | 1920×1080 or higher, 60 Hz refresh rate minimum |
| **Network** | 5G or broadband (10 Mbps sustained) |

### GPU Tier Classification

#### Low-Tier GPUs
- Intel UHD Graphics 630, Iris Xe
- AMD Radeon Vega (integrated)
- Apple M1/M2 base
- Qualcomm Adreno 660+
- **Target:** 30 FPS, reduced geometry, 128 MB texture budget
- **Max triangles/frame:** 500K

#### Mid-Tier GPUs
- NVIDIA GTX 1650, RTX 3050
- AMD RX 6600
- Apple M1/M2 Pro
- **Target:** 60 FPS, full geometry, 256 MB texture budget
- **Max triangles/frame:** 1.5M

#### High-Tier GPUs
- NVIDIA RTX 3070, RTX 4080
- AMD RX 6800 XT, RX 7900
- Apple M3 Max
- **Target:** 60+ FPS, max detail, 512 MB texture budget
- **Max triangles/frame:** 2M

### Memory Requirements by Scale

| Use Case | RAM Required |
|----------|--------------|
| Basic star field view | 512 MB |
| Solar system with detail | 1.5 GB |
| Full galaxy with orbital mechanics | 3 GB |
| Multi-galaxy exploration | 4-6 GB |
| Extended session with cache | 6-8 GB |

### Screen Size Optimization

- **Mobile (< 768px):** Simplified UI, instanced rendering only, 1× resolution
- **Tablet (768px–1440px):** Full features, 1.5× resolution, touch-optimized controls
- **Desktop (1440px+):** All features, 2× resolution, keyboard+mouse support
- **Ultra-wide (> 2560px):** Dual-panel mode, enhanced sidebar

---

## 2. Technology Stack Details

### Runtime Environment

- **TypeScript:** 5.4+ (strict mode mandatory)
- **React:** 18.3+ (strict component mode)
- **Vite:** 5.1+ (dev server and build orchestration)
- **Node.js:** 18.17+ LTS

### 3D Graphics & Rendering

- **Three.js:** r184+ (selective imports for tree-shaking; ES modules only)
- **Custom GLSL:** GLSL ES 3.0 for WebGL 2.0
- **WebGL:** 2.0 (required), with progressive enhancement to WebGPU
- **Shader Compilation:** Dynamic, with fallback to simpler variants on error

### State Management

- **Primary:** Zustand 4.4+ (lightweight, Redux DevTools support)
- **Alternative:** Jotai 2.4+ (for atom-based composition)
- **Persistence:** Zustand persist middleware with IndexedDB backend

### Audio System

- **Web Audio API:** Native browser audio context
- **Tone.js:** 14.8+ (synthesis, scheduling, effects)
- **Spatial Audio:** PannerNode for 3D positioning
- **Compression:** Tone.Compressor, Tone.Limiter for dynamic range

### Data Management

- **IndexedDB:** Via Dexie.js 4.0+ (object-oriented wrapper)
- **Binary Data:** Float32Array, Uint8Array, Float16Array (BigInt64Array for timestamps)
- **Serialization:** JSON (metadata), Protocol Buffers (optional for future optimization)
- **Cache Strategy:** LRU with generational garbage collection

### Testing Framework

- **Unit & Integration:** Vitest 1.0+ (Vite-native, fast parallel execution)
- **E2E:** Playwright 1.40+ (headless Chrome, Firefox, WebKit)
- **3D Rendering Tests:** Three.js test utils, canvas snapshot comparison
- **Performance:** Lighthouse CI for FPS and Core Web Vitals

### Build System

- **Bundler:** Vite 5.1+ with Rollup 4.0+
- **Minification:** ESBuild (default), Terser as fallback
- **Code Splitting:** Entry-point and dynamic import-based chunks
- **Asset Pipeline:** Built-in support for WebP/AVIF, base64 inlining for small assets

### Code Quality

- **Linting:** ESLint 8.54+ with React, TypeScript, import plugins
- **Formatting:** Prettier 3.1+ (enforced in pre-commit)
- **Type Checking:** TypeScript strict mode (no implicit any, strict null checks)
- **Accessibility:** axe-core for automated A11y testing

### CI/CD Pipeline

- **Platform:** GitHub Actions
- **Workflows:**
  - **Test:** Trigger on PR to main, run Vitest + Playwright
  - **Build:** On merge to main, generate optimized bundle
  - **Deploy:** Automatic to staging, manual approval to production
  - **Performance:** Lighthouse CI on every build, fail if Core Web Vitals degrade > 10%
  - **Security:** Dependabot for supply chain, npm audit in CI

---

## 3. Rendering Specifications

### Frame Rate Targets

| GPU Tier | Target FPS | Minimum FPS | Render Budget |
|----------|-----------|------------|---------------|
| Low | 30 | 20 | 33.3 ms |
| Mid | 60 | 45 | 16.7 ms |
| High | 60+ | 60 | 16.7 ms |

### Geometry Constraints

- **Max draw calls per frame:** 500 (enforced via instancing and batching)
- **Max triangles per frame:**
  - Low-tier: 500K
  - Mid-tier: 1.5M
  - High-tier: 2M
- **Vertex buffer streaming:** Automatic LOD selection based on viewport

### Texture Memory Budget

| GPU Tier | Total Budget | Per-Scene | MIP-chain strategy |
|----------|--------------|-----------|-------------------|
| Low | 128 MB | 64 MB | Aggressive (1:1 ratio) |
| Mid | 256 MB | 192 MB | Balanced (2:1 ratio) |
| High | 512 MB | 384 MB | Conservative (4:1 ratio) |

### Post-Processing Pipeline

**Order of Application (per-frame):**
1. Render to HDR target (Float16)
2. UnrealBloom (Unreal Engine-style)
   - Threshold: 0.8
   - Strength: 1.5
   - Blur passes: 5 (mipmapped downsampling)
3. Tone mapping (ACES filmic)
   - Exposure: adaptive based on scene luminance
4. FXAA (Fast Approximate Anti-Aliasing)
   - Span: 12 pixels max
   - Reduce: 1/8
5. Optional: SSAO (Screen-Space Ambient Occlusion) on high-tier only

### Instancing Strategy

**Star Rendering:**
- Single draw call per star catalog
- InstancedBufferGeometry for position, color, magnitude
- Max 500K visible points per frame (LOD culling)
- Color stored as RGB888 in InstancedBufferAttribute
- Magnitude encoded in alpha channel (logarithmic scale)

**Other Objects:**
- Planets: per-planet draw call (typically 5-10 total)
- Asteroids: grouped by zone, instanced (max 50K per draw call)
- Galaxies: billboarded sprites, instanced

### Billboard Sprite System

- **Distant objects** (> 1 AU from camera): rendered as aligned billboards
- **Geometry:** Single quad per object, transformed by view matrix
- **Texture atlas:** 2048×2048, 16× grid (256 sprite variation slots)
- **Fade distance:** Smooth LOD transition over 20% viewport distance

---

## 4. Data Specifications

### Star Catalog Format

**Binary Packed Format (16 bytes per star):**
```
Bytes 0-11:   Position (3 × Float32, in parsecs)
Bytes 12-13:  Color index B-V (Float16, normalized -0.4 to 2.0)
Byte 14:      Magnitude (Uint8, log-encoded 0-255 maps to -2 to 16)
Byte 15:      Flags (Uint8: has_planet, is_binary, is_variable)
```

**Storage:**
- Raw binary file per magnitude slice (brightest N stars in separate files)
- Compressed with brotli (10:1 ratio typical)
- On-demand decompression in Worker thread

### Planet & Orbital Data

**Format: JSON (with schema validation)**
```json
{
  "id": "earth",
  "name": "Earth",
  "parent": "sun",
  "orbitalElements": {
    "semiMajorAxis": 1.0,
    "eccentricity": 0.0167,
    "inclination": 0.0,
    "longitudeAscendingNode": 0.0,
    "argumentPerihelion": 1.9946,
    "meanAnomalyEpoch": 0.0,
    "epoch": "J2000.0"
  },
  "physicalProperties": {
    "radius": 6371,
    "mass": 5.972e24,
    "rotationPeriod": 86400,
    "axialTilt": 0.4091
  }
}
```

### Galaxy Data Format

**Binary Packed (32 bytes per galaxy):**
```
Bytes 0-11:   Position (3 × Float32, Mpc)
Bytes 12-15:  Rotation quaternion (4 × Float16)
Bytes 16-19:  Velocity vector (3 × Float16)
Bytes 20-23:  Magnitude + morphology (Float32, encoded)
Bytes 24-27:  Redshift + distance (Float32 + Float16)
Bytes 28-31:  Metadata flags
```

### Texture Asset Specifications

| Format | Use Case | Compression | Max Size |
|--------|----------|-------------|----------|
| **WebP** | Diffuse maps, cloud layers | Lossy 80% quality | 2048×2048 |
| **AVIF** | High-quality astronomy imagery | Lossy 75% quality | 4096×4096 |
| **PNG** | Lossless (logos, UI), normal maps | Lossless | 512×512 |
| **KTX2** | GPU-compressed (on GPU, ASTC/ETC2) | GPU native | 2048×2048 |

### Data Budget

| Category | Core Experience | Full Detail | Streaming |
|----------|-----------------|------------|-----------|
| Star catalog | 40 MB | 120 MB | Progressive loading |
| Planets/moons | 5 MB | 20 MB | Lazy-loaded per system |
| Galaxy data | 30 MB | 80 MB | On-demand, cached |
| Textures | 80 MB | 400 MB | Mipmap streaming |
| **Total** | **155 MB** | **620 MB** | Up to 1 GB optional |

### Streaming Strategy

- **Tiles:** Subdivide all-sky into 12 base tiles (icosphere), load on demand
- **LOD:** Multiple resolution levels per asset, interpolate visibility
- **Caching:** IndexedDB with LRU eviction, fallback to RAM cache
- **Priority:** Viewport-centric loading, background preload of adjacent regions

---

## 5. Coordinate Systems

### Solar System Coordinates

- **Reference frame:** Heliocentric ecliptic J2000.0
- **Unit:** Astronomical Unit (AU, 1 AU ≈ 149,597,870.7 km)
- **Plane:** Ecliptic plane of Earth's orbit
- **Epoch:** January 1, 2000 12:00 TT (J2000.0)
- **Conversion:** From KOE (Keplerian orbital elements) via Kepler solver

### Stellar Coordinates

- **Reference frame:** Galactic Cartesian
- **Unit:** Parsec (pc, 1 pc ≈ 3.086 × 10^16 m)
- **Origin:** Solar neighborhood center
- **Axes:** X (toward galactic center), Y (direction of galactic rotation), Z (galactic north)
- **Data source:** Gaia EDR3 (parallax + proper motion)

### Extragalactic Coordinates

- **Reference frame:** Supergalactic Cartesian
- **Unit:** Megaparsec (Mpc, 10^6 pc)
- **Origin:** Local group barycenter
- **Plane:** Supergalactic plane (contains major galaxy clusters)
- **Conversion:** Via redshift and Hubble relation (H0 = 67.4 km/s/Mpc)

### Internal Unified Coordinates

- **Logarithmic scale:** log₁₀(meters) from solar system barycenter
- **Range:** -10 (Planck scale) to +26 (observable universe edge)
- **Rationale:** Allows seamless zoom across 36 orders of magnitude
- **Conversion math:**
  ```
  internal = log10(meters)
  meters = 10^internal
  ```

### Coordinate Conversion Functions

**Solar System ↔ Internal:**
```
AU to internal: log10(AU × 1.496e11)
internal to AU: 10^internal / 1.496e11
```

**Stellar ↔ Internal:**
```
parsec to internal: log10(parsec × 3.086e16)
internal to parsec: 10^internal / 3.086e16
```

**Extragalactic ↔ Internal:**
```
Mpc to internal: log10(Mpc × 3.086e22)
internal to Mpc: 10^internal / 3.086e22
```

**Spherical to Cartesian (galactic):**
```
l, b (ecliptic) → RA, Dec → galactic l, b → (x, y, z)
[Requires rotation matrices: precession, nutation, aberration]
```

---

## 6. Shader Specifications

> **Note:** This section provides the technical shader interface summary for all 24 shader families. For full GLSL implementations, procedural parameters, and per-entity animation specs, see [Doc 18 — Visual Rendering & Shader Specification](./18-visual-rendering-specification.md) (5,000+ lines). For per-entity toggle feature → shader uniform mappings, see [Doc 22 — Interactive Toggle Features](./22-interactive-toggle-features.md).

### 6.1 Shader Family Registry (24 Families)

The rendering system organizes shaders into 24 families, resolved at runtime via ENT ID → shader family mapping (FR-SHDR-001):

| # | Family | Entity Types | Technique | LOD Fallback |
|---|--------|-------------|-----------|-------------|
| 1 | `star-point` | All stars at LOD 3-4 | Instanced point sprites, B-V color, twinkle | N/A (lowest) |
| 2 | `star-billboard` | All stars at LOD 2 | Camera-aligned quad, spectral color, scintillation | → `star-point` |
| 3 | `star-sphere` | All stars at LOD 0-1 | Sphere mesh, corona (Perlin+Worley), granulation, limb darkening | → `star-billboard` |
| 4 | `star-evolved` | Red Giant, Supergiant, Wolf-Rayet, AGB | Extends `star-sphere` + pulsation, envelope, dust disk | → `star-sphere` |
| 5 | `star-compact` | Neutron Star, Pulsar, Magnetar, White Dwarf | Beam sweep, magnetic field lines, X-ray hotspot | → `star-point` |
| 6 | `planet-rocky` | Mercury, Venus, Mars, Earth, Super-Earth, Magma, Ocean | PBR (Cook-Torrance), Rayleigh atmosphere, cloud layers | → `planet-billboard` |
| 7 | `planet-gas` | Jupiter, Saturn, Ice Giants, Hot Jupiter, Mini-Neptune | Band structure, storm systems, ring systems | → `planet-billboard` |
| 8 | `planet-exotic` | Carbon, Rogue, Eyeball, Circumbinary, Directly Imaged | Diamond facets, tidal-lock contrast, dual-shadow | → `planet-billboard` |
| 9 | `planet-billboard` | All planets at LOD 3-4 | Camera-aligned quad with morphology texture | N/A (lowest) |
| 10 | `moon-surface` | Luna, Ganymede, Callisto | Crater shader, regolith, mare/highland | → `planet-billboard` |
| 11 | `moon-active` | Io, Europa, Enceladus, Titan | Volcanic, cryogenic, geyser, hazy atmosphere | → `moon-surface` |
| 12 | `ring-system` | Saturn, Uranus, Neptune, exoplanet rings | Radial opacity/color, Cassini division, shadow casting | N/A |
| 13 | `asteroid-instanced` | C/S/M/V asteroids, KBO, Centaur, Trojan | Instanced irregular geometry, tumbling rotation | → point |
| 14 | `comet-full` | Comets, interstellar objects | Nucleus + coma (1M particles) + dual tails + jets | → `comet-simple` |
| 15 | `comet-simple` | Comets at LOD 2+ | Billboard nucleus + streak tail | N/A |
| 16 | `nebula-volumetric` | Emission, Planetary, Reflection, Dark, SNR, WR nebulae | **Raymarching 48-128 steps** (FR-SHDR-005), FBM density, emission lines | → `nebula-billboard` |
| 17 | `nebula-billboard` | Nebulae at LOD 3-4 | Camera-aligned quad, emission spectrum LUT, soft gradient | N/A |
| 18 | `galaxy-particle` | Spiral, Barred Spiral, Irregular, Starburst, Merger | Particle cloud (10K-100K), density function, dust lane mask | → `galaxy-billboard` |
| 19 | `galaxy-elliptical` | Elliptical, Lenticular, Dwarf Spheroidal, UDG, cE | Sérsic profile, age-based color gradient | → `galaxy-billboard` |
| 20 | `galaxy-agn` | AGN, Seyfert, Quasar, Blazar, Radio Galaxy | Accretion disk + jets + torus | → `galaxy-billboard` |
| 21 | `galaxy-billboard` | All galaxies at LOD 4 | Morphology template sprite, instanced | N/A |
| 22 | `blackhole` | Stellar BH, SMBH, Primordial BH | Schwarzschild lensing, accretion disk (Doppler), Einstein ring, jets | → point |
| 23 | `cosmic-web` | Filaments, Walls, Voids, Supercluster | Density-weighted line/mesh, IllustrisTNG data | N/A |
| 24 | `generic-glow` | **Fallback** (FR-ENT-COMMON-006) | Emissive sphere, category-based color, bloom | N/A |

### 6.2 Star Point Sprite Shader (`star-point`)

**Purpose:** Render up to 500K stars as instanced points in a single draw call.

- **Vertex:** position (3×Float32), color (RGB888), magnitude (Uint8 log-encoded), flags (Uint8). Point size: `size = 2.0 + log2(magnitude) * 0.5`. Twinkle phase: pre-computed per-star instance attribute.
- **Fragment:** Discard outside unit circle. B-V → RGB via blackbody LUT (Ballesteros 2012). Bloom: `pow(brightness, 2.0)`. Twinkle: `0.7 + 0.3 * sin(time * phase)`.
- **Uniforms:** `uTime`, `uCameraDistance`, `uBloomThreshold` (default 0.8)

### 6.3 Planet PBR Shader (`planet-rocky`, `planet-gas`)

**Purpose:** Render planets with physically-based surface, atmosphere, and clouds.

- **Material:** Diffuse albedo (sRGB), tangent-space normal map, packed metallic/roughness, emission (cloud glow, city lights, lava)
- **Lighting:** Cook-Torrance BRDF, sun as primary directional. Specular on water/ice. Rim: `pow(1.0 - dot(N, V), 2.0) * 0.5`
- **Atmosphere:** Nested spheres, Rayleigh scattering (blue sky → orange terminator). Cloud layer: 2-layer Perlin noise, latitude-dependent drift
- **LOD:** Sphere segments: 256 (LOD 0) → 128 → 64 → 32 → billboard (LOD 4)
- **Uniforms:** `uSunPosition`, `uTextureDiffuse`, `uTextureNormal`, `uTexturePBR`, `uTime`, `uAtmosphereColor`

### 6.4 Nebula Volumetric Shader (`nebula-volumetric`)

**Purpose:** Render nebulae as volumetric gas clouds via raymarching. Billboards are LOD 3-4 fallback only.

- **Method:** Per-pixel raymarching through bounding volume. Steps: 48 (low-tier) to 128 (high-tier), adaptive per FR-SHDR-005. Density: FBM noise (6 octaves). Color: narrowband emission lines (Hα=#FF4444, OIII=#00CCCC, SII=#FF6600). Central star illumination for PNe.
- **Animation:** Noise offset advection per frame (slow turbulence, ~10% feature size per simulated hour)
- **Uniforms:** `uStepCount`, `uDensityScale`, `uEmissionColor`, `uAbsorptionCoeff`, `uNoiseTexture`, `uTime`

### 6.5 Black Hole Lensing Shader (`blackhole`)

**Purpose:** Physically-motivated gravitational lensing with accretion disk and jets.

- **Method:** Schwarzschild metric ray deflection: `deflectionAngle = 2 * R_s / impactParameter`. Background starfield sampled with bent ray. Full ray bending — NOT simple UV distortion. See Doc 18 for complete GLSL.
- **Components:** Event horizon (pure black), photon sphere (1.5× R_s), accretion disk (T(r) ~ 1/sqrt(r), Doppler beaming ±30%), relativistic jets (collimated cone, synchrotron blue, turbulent knots), frame dragging (Kerr)
- **Uniforms:** `uBackgroundTexture`, `uBHCenter`, `uBHMass`, `uBHRadius`, `uDiskInnerRadius`, `uDiskOuterRadius`, `uJetAxis`, `uTime`

### 6.6 Galaxy Particle Shader (`galaxy-particle`, `galaxy-elliptical`)

**Purpose:** Render galaxies as rotating particle clouds with morphology-specific density functions.

- **Geometry:** 10K–100K particles per galaxy (LOD-based). Per-particle: position, velocity, age, type (disk/bulge)
- **Morphology:** Spiral arms via logarithmic spiral density, bar component, Sérsic profile for ellipticals. Dust lane darkening via mask texture
- **Uniforms:** `uTime`, `uRotationMatrix`, `uDustLaneMask`, `uMorphologyType`

### 6.7 Cosmic Web Shader (`cosmic-web`)

**Purpose:** Render filamentary large-scale structure from IllustrisTNG data.

- **Geometry:** Density-weighted line segments and mesh faces. Color: `mix(darkColor, brightColor, density / maxDensity)`, high-density glow.
- **LOD:** L0 (full mesh, <10 Mpc), L1 (simplified, 10-100 Mpc), L2 (statistical, >100 Mpc)
- **Uniforms:** `uDensityScale`, `uColorRamp` (1D LUT)

### 6.8 Shader Compilation & Caching

- **Lazy compilation:** Max 2 shaders per frame, max 50ms each (FR-SHDR-003)
- **Cache:** Max 32 compiled programs, LRU eviction (FR-SHDR-004)
- **Fallback:** Compilation error → `generic-glow` shader (FR-ENT-COMMON-006)
- **Warm-up:** Pre-compile `star-point`, `planet-rocky`, `generic-glow` at startup

---

## 7. Audio Specifications

### Audio Synthesis Chain

**Signal Flow:**
```
OscillatorNode (sine/triangle/square)
  ↓
BiquadFilterNode (low-pass, resonance)
  ↓
GainNode (volume control)
  ↓
PannerNode (3D spatial positioning)
  ↓
Compressor (optional, for dynamics)
  ↓
Destination (speaker output)
```

### Frequency Mapping

**Scale-dependent pitch:**
- **Cosmic scale** (Mpc): 20–50 Hz (subsonic, felt more than heard)
- **Galactic scale** (kpc): 50–200 Hz (low tones)
- **Stellar scale** (AU): 200–800 Hz (mid-range)
- **Planetary scale** (m): 800–2000 Hz (high tones)

**Calculation:**
```
baseFreq = 20 * 2^(log10(distance) / 2)
[Normalized to human hearing range, 20 Hz–20 kHz]
```

### Spatial Audio Positioning

- **PannerNode distance model:** inverse distance model
- **Reference distance:** 100 AU (auditory "sweet spot")
- **Max distance:** 10,000 AU (attenuates to silence)
- **Doppler effect:** simulated via pitch shift when object approaches/recedes
- **3D panning:** updated per frame for nearby objects (< 1 Mpc)

### Dynamic Volume Control

**Auto-ducking:**
- UI interaction reduces background music by 6 dB
- Navigation or data display reduces by 3 dB
- Full intensity when user is passive/exploring

**Normalization:**
- Prevent clipping via Compressor node
- Threshold: -24 dB, ratio: 4:1
- Attack: 0.003 s, release: 0.25 s

### Latency Target

- **Total audio latency:** < 50 ms (imperceptible to humans)
- **Synthesis latency:** < 10 ms (OscillatorNode native)
- **Filter latency:** < 5 ms (BiquadFilter)
- **Spatial processing latency:** < 20 ms (PannerNode, frame-synced)
- **Output latency:** varies by OS (20–30 ms typical)

### Tone.js Integration

**Key Components:**
- `Tone.Synth()` for melodic elements
- `Tone.MetalSynth()` or `Tone.PluckSynth()` for percussion
- `Tone.Scheduler` for event timing
- `Tone.Transport` for global BPM/timeline control

**Example Loop:**
```javascript
const synth = new Tone.Synth().toDestination();
Tone.Transport.bpm.value = 60;
Tone.Transport.schedule((time) => {
  synth.triggerAttackRelease("C4", "4n", time);
}, "+1");
Tone.Transport.start();
```

---

## 8. API Specifications

### Internal Event Bus (Pub/Sub)

**Implementation:** Custom emitter using Map<eventType, listeners[]>

**Core Events:**
```typescript
// Navigation
'camera:zoom' → { scale: number }
'camera:pan' → { x: number, y: number }
'camera:orient' → { rotation: Quaternion }

// Selection
'object:select' → { id: string, type: ObjectType }
'object:deselect' → { id: string }
'object:highlight' → { id: string }

// Playback
'simulation:play' → { }
'simulation:pause' → { }
'simulation:reset' → { }
'time:changed' → { timestamp: number }

// Data
'catalog:loaded' → { source: string, count: number }
'catalog:error' → { error: Error }

// UI
'ui:toggle-panel' → { panel: string, visible: boolean }
'ui:settings-changed' → { setting: string, value: any }

// Performance
'perf:fps' → { fps: number }
'perf:warning' → { issue: string }
```

**Listener Registration:**
```typescript
eventBus.on('camera:zoom', (data) => {
  // Handle zoom
});

eventBus.emit('camera:zoom', { scale: 1.5 });
eventBus.off('camera:zoom', handler);
```

### URL State Encoding

**Format:** Base64-encoded JSON in query parameter

**Structure:**
```
/?state=eyJjYW1lcmEiOnsicG9zIjpbMCwwLDEwXSwicm90IjpbMCwwLDAsMV0sInpvb20iOjEuMH19
```

**Decoded:**
```json
{
  "camera": {
    "pos": [0, 0, 10],
    "rot": [0, 0, 0, 1],
    "zoom": 1.0
  },
  "time": 1234567890,
  "selected": "earth",
  "layers": ["stars", "planets"]
}
```

**Max URL length:** 2048 chars (browser limit)

**Share API Integration:**
```javascript
navigator.share({
  title: "Cosmos Explorer",
  text: "Check out this view of the universe!",
  url: `${window.location.origin}/?state=${encodedState}`
});
```

### Embed API (iframe with postMessage)

**Parent → Child Messages:**
```javascript
iframe.contentWindow.postMessage({
  type: 'navigate',
  target: 'earth'
}, '*');

iframe.contentWindow.postMessage({
  type: 'setCameraState',
  state: { pos: [1, 0, 0], rot: [0, 0, 0, 1] }
}, '*');

iframe.contentWindow.postMessage({
  type: 'setTime',
  timestamp: 1234567890
}, '*');
```

**Child → Parent Messages:**
```javascript
window.parent.postMessage({
  type: 'objectSelected',
  data: { id: 'earth', type: 'planet' }
}, '*');

window.parent.postMessage({
  type: 'cameraChanged',
  data: { pos: [1, 0, 0], rot: [0, 0, 0, 1] }
}, '*');
```

**Example Embed:**
```html
<iframe 
  src="https://cosmos.example.com/embed?state=..." 
  width="800" 
  height="600"
  allow="autoplay; fullscreen"
></iframe>
```

### Plugin API

**Plugin Registration:**
```typescript
cosmosExplorer.registerPlugin({
  id: 'my-plugin',
  version: '1.0.0',
  
  // Custom objects (rendered via Three.js geometry)
  objects: {
    'custom-feature': {
      create: () => THREE.Group,
      update: (group, time) => void,
      dispose: (group) => void
    }
  },
  
  // Custom layers (enable/disable groups)
  layers: {
    'my-layer': {
      visible: true,
      objects: ['custom-feature']
    }
  },
  
  // Custom UI panels
  panels: {
    'my-panel': {
      title: 'My Panel',
      component: React.ComponentType,
      defaultPosition: 'right'
    }
  },
  
  // Event hooks
  hooks: {
    'onObjectSelect': (id) => void,
    'onTimeChange': (timestamp) => void
  }
});
```

**Plugin Lifecycle:**
1. Load plugin metadata from registry
2. Execute plugin setup in Worker (if heavy)
3. Register with main thread
4. Subscribe to relevant events
5. Expose custom UI components
6. Dispose on unload

---

## 9. Build & Bundle Specifications

### Target Bundle Size

- **Main code (gzipped):** < 2 MB
  - React + Three.js + utilities: ~1.5 MB
  - Application logic: ~0.5 MB
- **Assets (gzipped, initial load):** < 1 MB
  - Star catalog (brightest ~1000 stars): ~0.5 MB
  - Shaders (pre-compiled): ~0.3 MB
  - Textures (lowres preview): ~0.2 MB

### Code Splitting Strategy

**Chunks:**
1. **main.js** (~600 KB gzipped): Core rendering, UI, state
2. **vendors.js** (~900 KB gzipped): React, Three.js, Tone.js
3. **shaders.js** (~100 KB gzipped): Compiled GLSL
4. **planets-<scale>.js**: Per-scale planet data (lazy-loaded)
5. **galaxies.js**: Galaxy catalog + textures (on-demand)
6. **plugins.js**: Plugin system (optional load)

**Lazy Loading Triggers:**
- Planets: when entering solar system scale
- Galaxies: when user navigates to galactic scale
- High-res textures: when zooming within 0.1 AU

### Tree Shaking Configuration

**Three.js Selective Imports:**
```javascript
// ✓ Properly tree-shakeable
import { Scene, Camera, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// ✗ Avoid; imports entire library
import * as THREE from 'three';
```

**Vite Config:**
```javascript
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'react': ['react', 'react-dom']
        }
      }
    }
  }
};
```

### Asset Loading Pipeline

**Progressive Loading (Waterfall):**
1. **Immediate (on load):** Brightest 100 stars (~10 KB)
2. **Low-res preview (2s):** Full star catalog lowres (~500 KB)
3. **Background (5–30s):** High-res textures, planet data
4. **On-demand:** Zoom-specific LOD levels

**Implementation via Suspense + React.lazy:**
```javascript
const PlanetModule = React.lazy(() => import('./planets'));

<Suspense fallback={<LoadingSpinner />}>
  <PlanetModule />
</Suspense>
```

**Service Worker Caching:**
- Cache-first for static assets (versioned filenames)
- Network-first for star catalog (dynamic updates)
- Stale-while-revalidate for metadata

### Build Output Verification

**Metrics to Track:**
- Bundle size: `npm run analyze` (rollup-plugin-visualizer)
- Entry point: `npm run build` output logs
- Chunk sizes: every chunk < 500 KB gzipped (except main)
- JS parse time: < 200 ms on 4G connection
- LCP (Largest Contentful Paint): < 2.5 s

---

## 10. Error Handling & Logging

### WebGL Context Loss Recovery

**Detection & Recovery Flow:**
```javascript
const canvas = renderer.domElement;

canvas.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  renderer.forceContextLoss();
  showNotification('WebGL context lost, reloading...');
});

canvas.addEventListener('webglcontextrestored', () => {
  // Rebuild textures, shaders, buffers
  reloadAssets();
  renderer.render(scene, camera);
  hideNotification();
});
```

**Timeout:** Attempt recovery for 5 seconds; if fails, prompt full page reload

### Data Fetch Retry Strategy

**Exponential Backoff:**
```
Attempt 1: immediate
Attempt 2: 1 second
Attempt 3: 2 seconds
Attempt 4: 4 seconds
Attempt 5: 8 seconds
Total: max 15 second retry window
```

**Failure Handling:**
- Show cached version if available
- Degrade gracefully (skip non-critical data)
- Log error with context (URL, timestamp, status code)
- Provide user-facing message after 3 failures

### Performance Monitoring

**Metrics Collected:**
- **FPS:** frame rate over 60-frame window (target 60)
- **Memory:** heap usage via performance.memory (warn at 80%)
- **Draw calls:** per frame (warn if > 600)
- **Shader compile time:** per asset load (warn if > 100 ms)
- **TTI (Time to Interactive):** measure first user interaction opportunity

**Implementation:**
```javascript
const perfMonitor = {
  fps: 0,
  memory: 0,
  drawCalls: 0,
  update() {
    this.fps = getRecentFPS();
    this.memory = performance.memory.usedJSHeapSize;
    this.drawCalls = renderer.info.render.calls;
  }
};
```

**UI Indicator:**
- FPS counter (top-right, toggle via settings)
- Color-coded: green (60), yellow (45), red (< 30)

### Error Boundary for React Components

**Implementation:**
```javascript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    logErrorToService(error, info);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

**Catch Zones:**
- Main app wrapper (fatal errors)
- UI panels (isolated panel failures)
- 3D viewer (falls back to static canvas)

### Telemetry & Analytics (Opt-in, Privacy-first)

**Data Collected (only with consent):**
- Session start/end times
- Camera navigation patterns (anonymized positions)
- Performance metrics (FPS, render time percentiles)
- Feature usage (which layers toggled, zoom depth)
- Error events (error type, stack trace, user action)

**Privacy Measures:**
- No personal data (IP, user agent fingerprinting)
- No texture/shader code transmission
- Client-side aggregation before sending
- Data encrypted in transit (TLS)
- 30-day retention policy
- User can opt-out via settings → Privacy

**Endpoint:** `/api/v1/telemetry` (batched POST, max 1 request/minute)

**Example Payload:**
```json
{
  "sessionId": "uuid",
  "events": [
    {
      "type": "navigation",
      "timestamp": 1234567890,
      "data": { "scale": "galactic", "fpsAverage": 58 }
    }
  ]
}
```

---

## 14. Extended Shader Specifications (Added v2.0)

### 14.1 Shader Compilation Strategy for 96 Entity Types

Entity types (Doc 22 v4.2) are mapped to 24 shader families. Each family is a single GLSL program with parameterized uniforms.

**Compilation approach:**
- **Eager compilation** (on load): 6 most-used families — `star-surface`, `planet-rocky`, `planet-gas`, `nebula-emission`, `galaxy-spiral`, `largescale-cosmic`
- **Lazy compilation** (on approach): remaining 18 families compiled when entity enters camera frustum at LOD L2 or closer
- **Compile budget**: max 2 shader compilations per frame (to avoid jank)
- **Cache**: `Map<ShaderFamilyID, WebGLProgram>`, max 32 programs. LRU eviction.
- **Fallback**: on compile failure → `generic-glow` shader (ambient color + bloom)

### 14.2 Shader Uniform Structure

```glsl
// Shared uniforms (all shaders)
uniform float uTime;
uniform vec3 uCameraPosition;
uniform float uScaleLevel; // 0-6
uniform float uLODLevel;   // 0-4
uniform mat4 uModelViewProjection;

// Entity-specific uniforms (per shader family)
// Example: star-surface
uniform float uTemperature;     // 2400-50000 K
uniform float uLimbDarkening;   // 0.3-0.8
uniform float uRotationSpeed;   // rad/s
uniform float uRadius;          // in current scale units
uniform vec3 uBaseColor;        // from spectral type
uniform float uSunspotCoverage; // 0.0-0.4
uniform float uFlareFrequency;  // events per second
uniform float uWindParticles;   // count

// Example: planet-exotic (carbon planet)
uniform float uDiamondCoverage;  // 0.0-1.0
uniform float uGraphiteCoverage; // 0.0-1.0
uniform float uSiCCoverage;      // 0.0-1.0
uniform float uTarSeaCoverage;   // 0.0-1.0
uniform float uCORatio;          // 0.8-1.2
uniform float uSubsurfaceScatter;// IOR for diamond (2.42)
uniform vec3 uDiamondColor;      // #E8F4FF
uniform vec3 uGraphiteColor;     // #1A1A1A
uniform vec3 uSiCColor;          // #88AACC (iridescent)
```

### 14.3 Draw Call Budget (Updated)

| Scene Complexity | Max Draw Calls | Max Triangles | Max Particles | Max Raymarched Volumes |
|---|---|---|---|---|
| S0-S1 (Surface/Planetary) | 200 | 2M | 50K | 0 |
| S2 (Solar System) | 300 | 1M | 100K | 1 |
| S3 (Interstellar) | 400 | 500K | 200K (instanced stars) | 2 |
| S4 (Galactic) | 500 | 300K | 500K (galaxy particles) | 3 |
| S5-S6 (Intergalactic/Cosmic) | 300 | 200K | 1M (cosmic web) | 1 |

---

## 15. Volumetric Raymarching Specifications (Added v2.0)

### 15.1 Raymarching Pipeline

Nebulae (14 types, ENT-5000 series) use fragment-shader raymarching:

```
For each pixel:
  1. Cast ray from camera through pixel into volume bounding box
  2. March along ray in fixed steps (48-160 depending on quality tier)
  3. At each step: sample 3D density function (FBM noise)
  4. Accumulate: color += density × emissionColor × transmittance × stepSize
  5. Accumulate: transmittance *= exp(-density × absorptionCoeff × stepSize)
  6. Early exit: if transmittance < 0.01
```

### 15.2 Density Functions per Nebula Type

| Nebula Type | Density Function | Noise | Octaves | Special |
|---|---|---|---|---|
| H II Region (ENT-5010) | Spherical falloff + FBM | Perlin 3D | 6 | Pillar structures via directional noise |
| Compact H II (ENT-5011) | Gaussian core + sharp edge | Simplex 3D | 4 | Ionization front = density discontinuity |
| Planetary Nebula Spherical (ENT-5020) | Hollow shell | Perlin 3D | 5 | Multiple shells, 1/r² falloff from center |
| Planetary Nebula Bipolar (ENT-5021) | Hourglass (cos²θ modulated) | Simplex 3D | 5 | Equatorial torus blocks equator |
| Reflection Nebula (ENT-5030) | Irregular cloud + star proximity | Worley + Perlin | 5 | Blue scattering color, no emission |
| Dark Nebula (ENT-5040) | Dense filamentary | Perlin 3D | 7 | Absorption only, no emission |
| SNR Shell (ENT-5050) | Expanding shell + filaments | Voronoi + FBM | 6 | Shock front = thin bright edge |
| Pulsar Wind (ENT-5051) | Torus + polar jets | Simplex 3D | 4 | Synchrotron blue, very bright core |
| Wolf-Rayet (ENT-5060) | Ring/bubble | Perlin 3D | 5 | Wind-blown cavity |
| Protoplanetary Disk (ENT-5070) | Thin disk (Keplerian) | Perlin 2D (r,θ) | 4 | Gap structures from planets |
| Superbubble (ENT-5080) | Large hollow sphere | Perlin 3D | 4 | Hot interior, swept-up shell |

### 15.3 Emission Color Mapping

| Emission Line | Wavelength | Hex Color | Used By |
|---|---|---|---|
| Hα (Hydrogen-alpha) | 656.3 nm | #FF4444 | H II regions, SNRs, planetary nebulae |
| [O III] | 500.7 nm | #00FF88 | Planetary nebulae (dominant), H II |
| [S II] | 671.6/673.1 nm | #FF8800 | SNRs, H II edges |
| [N II] | 658.4 nm | #FF6644 | H II regions, planetary nebulae |
| Hβ (Hydrogen-beta) | 486.1 nm | #44AAFF | H II regions (blue component) |
| Continuum (scattered) | broadband | #4488FF | Reflection nebulae |
| Synchrotron | broadband | #6644FF | Pulsar wind nebulae, radio lobes |

### 15.4 Performance Targets

| Tier | Steps | Resolution | Octaves | Budget/frame |
|---|---|---|---|---|
| High | 128 | Full res | 6 | 4ms |
| Medium | 80 | Half res | 4 | 3ms |
| Low | 48 | Quarter res | 3 | 2ms |

---

## 16. Adaptive Camera & Coordinate Precision (Added v2.0)

### 16.1 Floating Origin System

At scale levels S2+, standard Float32 loses precision. Solution:

- Camera position stored as `Float64Array(3)` in JavaScript
- Each frame: compute `offset = entity.position - camera.position` in Float64
- Pass `offset` to GPU as `vec3` (Float32) — now relative to camera, small values, full precision
- Reset origin when camera moves >10,000 units from current origin

### 16.2 Logarithmic Depth Buffer

At scale levels S4+ (galactic and above):
- Enable logarithmic depth: `gl_FragDepth = log2(max(1e-6, gl_FragCoord.w * C + 1.0)) * logBufFC`
- Where `C = 1.0`, `logBufFC = 2.0 / log2(farPlane + 1.0)`
- Eliminates z-fighting across 10+ orders of magnitude in single view

### 16.3 Adaptive Near/Far Planes

| Scale Level | Near Plane | Far Plane | Depth Buffer Mode |
|---|---|---|---|
| S0 Surface | 0.1 m | 10 km | Standard |
| S1 Planetary | 1 km | 10^10 m | Standard |
| S2 Solar System | 10^6 m | 10^14 m | Floating origin |
| S3 Interstellar | 10^10 m | 10^18 m | Floating origin + log depth |
| S4 Galactic | 10^14 m | 10^22 m | Log depth |
| S5 Intergalactic | 10^18 m | 10^24 m | Log depth |
| S6 Cosmic | 10^22 m | 10^27 m | Log depth |

---

## 17. Particle System Budget (Added v2.0)

### 17.1 Global Particle Budget

| Device Tier | Max Total Particles | Max Per Entity | Max Instanced Points (stars/galaxies) |
|---|---|---|---|
| High (desktop) | 2,000,000 | 500,000 | 5,000,000 |
| Medium (laptop) | 500,000 | 100,000 | 1,000,000 |
| Low (mobile) | 100,000 | 20,000 | 200,000 |

### 17.2 Particle Allocation by Entity Type

| Entity Category | Particles Per Entity | Use |
|---|---|---|
| Star corona/wind | 500–2,000 | Corona glow, stellar wind streams |
| Comet tails | 5,000–20,000 | Ion tail + dust tail |
| Galaxy (spiral) | 50,000–200,000 | Disk + bulge + halo star particles |
| Galaxy (elliptical) | 100,000–500,000 | Isotropic distribution |
| Globular cluster | 50,000–100,000 | King profile distribution |
| Open cluster | 500–5,000 | Loose distribution |
| Cosmic web | 500,000–2,000,000 | Filament + void structure |
| Relativistic jets | 2,000–10,000 | AGN/quasar/blazar jets |
| Supernova remnant particles | 5,000–20,000 | Expanding shell filaments |

---

## Summary of Key Constraints

| Aspect | Value |
|--------|-------|
| **Min browser** | Chrome 90+, WebGL 2.0 |
| **Target FPS** | 60 (mid-tier), 30 (low-tier) |
| **Max draw calls** | 500/frame |
| **Texture budget** | 128–512 MB (tier-dependent) |
| **Bundle size** | < 2 MB gzipped |
| **Latency (audio)** | < 50 ms |
| **Data budget** | 155 MB (core), 1 GB (extended) |
| **Coordinate range** | ±36 orders of magnitude |
| **Shader compile time** | < 100 ms |
| **Error recovery** | 5 second timeout, graceful degradation |

---

## Document Metadata

**Version:** 2.0  
**Date:** 2026-04-16  
**Last Updated:** 2026-04-16  
**Status:** Active  

**Notable Changes (v2.0):**
- Updated to align with Doc 22 v4.2 (96 entity types), Doc 18 (shader specs), Doc 19 (navigation/scale system)
- Added sections 14–17: Extended Shader Specifications, Volumetric Raymarching, Adaptive Camera/Coordinate Precision, Particle System Budget
- Updated draw call budgets per scene complexity
- Added detailed density functions for 11 nebula types with emission color mapping
- Specified floating-origin and logarithmic depth techniques for large-scale precision

---

**End of Technical Specifications Document**

*For questions or updates, contact the Cosmos Explorer engineering team.*
