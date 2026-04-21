# System Architecture: Cosmos Explorer

**Status:** Production  
**Version:** 1.0  
**Last Updated:** 2026-04-16  
**Document Owner:** Architecture Team

---

## 1. Architecture Overview

Cosmos Explorer is a **client-heavy, GPU-accelerated 3D universe visualization** system. The architecture distributes computational load primarily to the browser (WebGL/GPU) while maintaining a thin backend for data serving and optional dynamic services.

### High-Level System Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  React UI Layer (State, Info Panels, Controls)          │     │
│  └─────────────────────────────────────────────────────────┘     │
│                              ▲                                    │
│                              │ events/state                       │
│                              ▼                                    │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  State Manager (Redux/Zustand)                          │     │
│  │  - Camera position/rotation                              │     │
│  │  - Current scale (1e-11 m to 1e26 m)                    │     │
│  │  - Simulation time                                       │     │
│  │  - Selected objects/search results                       │     │
│  └─────────────────────────────────────────────────────────┘     │
│                              ▲▼                                   │
│  ┌──────────────────┬────────────────────┬──────────────────┐    │
│  │                  │                    │                  │    │
│  ▼                  ▼                    ▼                  ▼    │
│  ┌─────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐  │
│  │Rendering│  │ Physics      │  │ Audio        │  │ Data    │  │
│  │ Engine  │  │ Engine       │  │ Engine       │  │ Manager │  │
│  │         │  │              │  │              │  │         │  │
│  │• Scene  │  │• Kepler      │  │• Web Audio   │  │• LOD    │  │
│  │  graph  │  │  solver      │  │  graph       │  │  system │  │
│  │• Camera │  │• N-body      │  │• Oscillators │  │• Octree │  │
│  │• Shader │  │  approx      │  │• Panner      │  │• Cull   │  │
│  │  system │  │• Time        │  │• Procedural  │  │• Stream │  │
│  │• Post-  │  │  integration │  │  synth       │  │         │  │
│  │  proc   │  └──────────────┘  └──────────────┘  └─────────┘  │
│  └─────────┘                                                     │
│        ▲                                                          │
│        │ WebGL 2.0 + GPU Compute (future WebGPU)               │
│        ▼                                                          │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  Web Worker Pool (4-8 workers)                          │     │
│  │  - Data parsing (Gaia, SDSS catalogs)                   │     │
│  │  - Octree construction/queries                          │     │
│  │  - Physics computation (heavy frames)                   │     │
│  │  - Texture/mesh generation                              │     │
│  └─────────────────────────────────────────────────────────┘     │
│                              ▲                                    │
│                              │ fetch/postMessage                  │
└──────────────┬───────────────┼────────────────────────────────────┘
               │               │
               │               └──────────────────┐
               │                                  │
               ▼                                  ▼
    ┌──────────────────────┐        ┌─────────────────────────┐
    │  CDN / Static Hosting│        │ API Server (Optional)   │
    │  (Vercel/Netlify)    │        │ - JPL Horizons Proxy    │
    │                      │        │ - Search Index          │
    │  • HTML/JS/CSS       │        │ - Live ephemeris        │
    │  • Textures (WebP)   │        │ - Catalog updates       │
    │  • Data files        │        └─────────────────────────┘
    │  • Shaders           │
    └──────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │ Data Sources (read-only)
    │ • Gaia DR3 catalogs (preprocessed)
    │ • JPL Horizons ephemeris
    │ • SDSS galaxy data
    │ • IllustrisTNG cosmic web
    │ • Custom textures/models
    └──────────────────────┘
```

### Architectural Principles

1. **GPU-First Computation:** All real-time rendering and physics occur on GPU; CPU handles coordination.
2. **Progressive Enhancement:** Start with Solar System (pre-loaded), stream distant data on demand.
3. **Separation of Concerns:** Rendering, physics, audio, and state management are independently testable.
4. **Offline-Capable:** Core data cached locally; works without network after first load.
5. **Open Data First:** All underlying datasets are scientifically published and freely available.

---

## 2. System Components

### 2.1 Rendering Engine

The rendering engine is built on **Three.js** and handles all visual output at 60 FPS (or 120 FPS on high-refresh displays).

#### 2.1.1 Scene Graph Architecture

```javascript
Scene
├── Background Layer
│   ├── Procedural Starfield Skybox (dynamic based on position)
│   └── Milky Way texture (Gaia-derived density map)
├── Far Objects (z > 1 kpc, draw distance ~100 Mpc)
│   ├── Galaxy Meshes (instanced, LOD 0)
│   ├── Galaxy Clusters (point clouds)
│   └── Cosmic Web Filaments (line segments)
├── Mid Objects (z 1 kpc - 1 pc)
│   ├── Star Instanced Geometry
│   │   ├── LOD 0: 1M stars (point buffer)
│   │   ├── LOD 1: 100k stars (point + color)
│   │   └── LOD 2: 10k stars (spheres with detail)
│   └── Nebula Clouds (volumetric or Billboard sprites)
├── Near Objects (z < 1 pc)
│   ├── Planets (high-poly meshes)
│   ├── Moons (medium-poly meshes)
│   ├── Spacecraft (user model or gizmo)
│   └── Atmospheric Halos
├── Effects Layer
│   ├── Bloom Glow (post-process)
│   ├── God Rays (crepuscular rays from stars)
│   ├── Gravitational Lensing (post-process distortion)
│   └── Particle Systems (comet tails, solar wind)
└── UI Canvas Overlay (2D, rendered last)
```

#### 2.1.2 Camera System

- **Perspective Camera** with custom near/far clipping plane adjustment based on scale.
- **Logarithmic Depth Buffer** (via shader modification) to handle ~1e37 unit depth range without z-fighting.
- **Trackball Controls:** Orbit around target, mouse wheel zoom with acceleration curves.
- **Smooth Interpolation:** Hermite spline interpolation for camera transitions (e.g., "fly to Mars").

#### 2.1.3 Renderer Pipeline

```
Frame Input
  ↓
[Physics Update] ← Time delta from requestAnimationFrame
  ↓
[Scene Graph Update] → Position/rotation/visibility based on physics/state
  ↓
[Render Passes]
  ├─ Pass 1: Render to G-Buffer (positions, normals, albedo)
  ├─ Pass 2: Render skybox with per-pixel lighting
  ├─ Pass 3: Forward render far objects (galaxies, cosmic web)
  ├─ Pass 4: Forward render mid/near objects (stars, planets)
  ├─ Pass 5: Composite with depth
  └─ Pass 6: (Optional) Deferred shading for dense regions
  ↓
[Post-Processing Chain]
  ├─ Bloom (Kawase blur)
  ├─ God Rays (radial blur from bright pixels)
  ├─ Tone Mapping (ACES filmic)
  ├─ Chromatic Aberration (slight, wavelength-dependent lensing)
  ├─ Film Grain (optional, period/frame)
  └─ Gamma correction
  ↓
[UI Composite] → React layer rendered on top
  ↓
[Display] → Swap buffers, 60/120 FPS
```

#### 2.1.4 Post-Processing Effects

| Effect | Purpose | Implementation | Cost |
|--------|---------|---|---|
| **Bloom** | Glow around bright objects (stars, planets) | Two-pass Kawase blur, additive blend | ~2ms per frame |
| **God Rays** | Crepuscular rays from bright star | Radial blur in screen space | ~1.5ms |
| **Tone Mapping** | Convert HDR to LDR display | ACES RRT + ODT (filmic) | <0.5ms |
| **Chromatic Aberration** | Lens distortion at edges | Offset sampling in fragment shader | <0.5ms |
| **Gravitational Lensing** | Subtle distortion near massive objects | Displacement mapping via SDFs | ~1ms |
| **Film Grain** | Analog camera texture | Perlin noise overlay, per-frame | <0.5ms |

#### 2.1.5 Shader Catalog

| Shader | Type | Purpose | Key Uniforms |
|--------|------|---------|---|
| **star-point** | Vertex/Fragment | Render 1M+ stars as points | scale, color, brightness, magnitude |
| **star-sphere** | Vertex/Fragment | High-detail star (LOD 2) | position, radius, color, temp, glow |
| **planet** | Vertex/Fragment | Realistic planet with bump/detail | position, radius, normalMap, specMap, atmosphere |
| **galaxy** | Vertex/Fragment | Spiral/elliptical galaxy mesh | position, type (Sa/Sb/E0), rotation, opacity |
| **nebula-volume** | Fragment | Volumetric fog/dust cloud | position, density, color, lightDir |
| **skybox-dynamic** | Fragment | Procedural sky based on position/time | cameraPos, time, stellarDensity |
| **bloom-blur** | Fragment | Separable Gaussian blur (horizontal/vertical) | texture, direction, blurRadius |
| **god-rays** | Fragment | Radial blur from screen center | lightScreenPos, intensity, decay |
| **tone-map-aces** | Fragment | ACES filmic tone mapping | exposure, contrast, saturation |
| **lensing-distort** | Fragment | Gravity well displacement | massPos, massRadius, distortionAmount |
| **instanced-stars** | Vertex/Fragment | Batched star rendering with instance IDs | transforms[i], colors[i], sizes[i] |
| **line-cosmic-web** | Vertex/Fragment | Thin lines for cosmic web filaments | lineWidth, color, dashPattern |

### 2.2 Scale Manager

Cosmos Explorer must visualize objects spanning ~1e37 meters (Hubble Deep Field to subatomic). A linear coordinate system cannot represent this; instead, we use a **logarithmic scale manager**.

#### 2.2.1 Logarithmic Coordinate System

```javascript
// User-facing scale in meters
const metersPerUnit = Math.pow(10, logScale);

// Example scales:
// logScale = -11: zoom to atomic nucleus (10^-11 m/unit)
// logScale = 0: 1 meter per unit (human scale)
// logScale = 11: AU scale (1e11 m ≈ 150 million km per unit)
// logScale = 26: Megaparsec scale (1e26 m per unit; universe-scale)

// Camera position in log-space
const cameraLogPos = {
  x: Math.log10(cameraWorldX),
  y: Math.log10(cameraWorldY),
  z: Math.log10(cameraWorldZ)
};

// Rendering uses linear coordinates; object positions are transformed:
objectLinearPos = Math.pow(10, objectLogPos - cameraLogPos) * referenceDistance;
```

#### 2.2.2 Level of Detail (LOD) System

Stars rendered with 4 LOD levels based on screen-space size:

| LOD | Distance | Representation | Triangle Count | Use Case |
|-----|----------|---|---|---|
| **0** | > 1 Mpc | Point (size 1 pixel) | 1 point | Universe view |
| **1** | 100 kpc - 1 Mpc | Point + color (4 pixels) | 1 point + color attr | Galaxy cluster view |
| **2** | 1 kpc - 100 kpc | Sphere (radius ~5px) + procedural detail | 32-64 triangles | Stellar neighborhood |
| **3** | < 1 kpc | High-poly mesh + texture + corona | 500-2000 triangles | Close inspection |

Planets and galaxies similarly implement LOD meshes.

#### 2.2.3 Frustum Culling

```javascript
// Frustum culling per frame:
1. Extract 6 frustum planes from camera projection matrix
2. Test each spatial partition (octree node) against frustum
3. Cull entire subtrees if AABB doesn't intersect any plane
4. Reduces draw calls by ~60-70% in typical scenes
```

#### 2.2.4 Octree Spatial Indexing

- **Structure:** 8-ary tree, max 64 objects per leaf, max depth 24.
- **Construction:** Done in Web Worker from star/galaxy catalog on load.
- **Queries:** Frustum queries, range queries (within N parsecs of position).
- **Update Frequency:** Static at load time; dynamic updates (new objects) queued and batch-processed.

```
Octree Root (Universe bounds: 1e26 m³)
├── Node[0-3]: Local group region
│   ├── Node[0]: Milky Way region
│   │   ├── Leaf: 64 stars near Sol
│   │   ├── Leaf: 32 stars in Orion Spur
│   │   └── ...
│   └── ...
├── Node[4-7]: Virgo Supercluster region
│   └── [Galaxy octree nodes]
└── ...
```

### 2.3 Data Pipeline

#### 2.3.1 Data Flow Stages

```
Source Catalogs (1.8B Gaia DR3 stars, etc.)
       ↓
[Preprocessing Stage - Offline, once per release]
  • Filter/normalize coordinates
  • Compute LOD levels
  • Generate spatial indices (octree)
  • Quantize positions (fp32 → int24 + scale)
  • Compute star colors from temperature
  ↓
[Packaging Stage]
  • Binary format (.bin): Positions, magnitudes, colors, parallax
  • JSON metadata: Names, spectral types, distances
  • Tiling: Split into ~1000 regional files (each ~5-50 MB)
  ↓
[Upload to CDN]
  • Cloudflare R2 or AWS S3 + CloudFront
  • Gzip/Brotli compression (40-60% reduction)
  • HTTP/2 server push for critical tiles
  ↓
[Browser Download]
  • On-demand tile loading based on camera position
  • Prioritize nearby tiles
  • LRU eviction when memory threshold exceeded
  ↓
[Parsing - Web Worker]
  • Decompress and parse binary format
  • Deserialize JSON metadata
  • Construct GPU buffers
  ↓
[GPU Upload]
  • Create WebGL BufferObjects (VBO, IBO)
  • Bind to shader program
  ↓
[Render]
  • Instanced draw calls or batched meshes
```

#### 2.3.2 Data Formats

**Star Catalog (Binary, .bin):**
```
Header (32 bytes):
  - Version: 1 (u8)
  - TileID: [x, y, z] (3 × u16)
  - Star count: n (u32)
  - Bounds min/max: 6 × f32

Star Record (per star, 28 bytes):
  - Position X, Y, Z: 3 × f32
  - Magnitude: f32
  - Color [R, G, B]: 3 × u8 (sRGB)
  - Parallax/Distance: f16
  - Reserved: u16
```

**Metadata (JSON):**
```json
{
  "name": "Gaia DR3 Tile 1024",
  "tileID": { "x": 10, "y": 10, "z": 3 },
  "starCount": 65536,
  "bounds": {
    "min": { "x": -1e16, "y": -1e16, "z": -1e16 },
    "max": { "x": 1e16, "y": 1e16, "z": 1e16 }
  },
  "objects": [
    {
      "id": "HD209458",
      "name": "Wasp-6",
      "type": "star",
      "ra": 1.234,
      "dec": 45.678,
      "distance_pc": 47.5,
      "spectral_type": "G0V",
      "temp_k": 5800
    }
  ]
}
```

#### 2.3.3 Caching Strategy

| Cache Layer | Technology | Capacity | TTL | Access Time |
|---|---|---|---|---|
| **GPU VRAM** | WebGL Texture/Buffer objects | 512 MB - 2 GB (device-dependent) | Session | <1 μs |
| **Memory (RAM)** | JavaScript ArrayBuffer (LRU) | 512 MB (configurable) | Session | ~100 ns |
| **Disk (IndexedDB)** | IndexedDB (browser quota) | 50 GB (quota) | 30 days | ~1-10 ms |
| **Network (CDN)** | HTTP cache headers + gzip | Unlimited (server-side) | 1 year | ~100-500 ms |

**LRU Eviction Policy:**
```javascript
const cache = new LRUCache({ maxSize: 512 * 1024 * 1024 }); // 512 MB

onDataTileLoaded(tile) {
  cache.set(tile.id, tile.buffer);
  // Automatically evicts least-recently-used tiles if exceeds maxSize
}
```

#### 2.3.4 Streaming Strategy

- **Priority Queue:** Tiles closest to camera + highest detail first.
- **Quadtree LOD:** As camera zooms, load finer tiles; release coarser ones.
- **Preload:** Load adjacent tiles 1 frame ahead.
- **Abort Policy:** Cancel in-flight requests if camera moves >100 tiles away before completion.

### 2.4 Physics Engine

#### 2.4.1 Kepler Solver (Orbital Mechanics)

For planets, moons, and binary stars:

```javascript
// Simplified circular orbit (for demo):
// Semi-major axis a, eccentricity e, mean anomaly M(t)

function keplerOrbitalPosition(a, e, M_t, mass_primary) {
  // Solve Kepler's equation: M = E - e*sin(E) using Newton-Raphson
  const E = solveKeplersEquation(M_t, e);
  
  // Compute true anomaly
  const nu = 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(E / 2),
    Math.sqrt(1 - e) * Math.cos(E / 2)
  );
  
  // Compute position in orbital plane
  const r = a * (1 - e * e) / (1 + e * Math.cos(nu));
  const x = r * Math.cos(nu);
  const y = r * Math.sin(nu);
  
  // Apply orbital inclination, longitude of ascending node, argument of perihelion
  return rotateByEuler(x, y, 0, i, Omega, omega);
}

// Updated every frame with time delta:
const M_t = (2 * Math.PI / T) * time; // T = orbital period
const position = keplerOrbitalPosition(a, e, M_t, sun.mass);
```

#### 2.4.2 N-Body Approximation

For large-scale galaxy dynamics (stars around Milky Way, galaxies around clusters):

```javascript
// GPU-based N-body compute shader (future WebGPU):
// Each star experiences gravitational acceleration from all others

computeShader(`
  layout(std430, binding = 0) buffer Positions { vec4 pos[]; };
  layout(std430, binding = 1) buffer Velocities { vec4 vel[]; };
  layout(std430, binding = 2) buffer Accelerations { vec4 acc[]; };

  void main() {
    uint i = gl_GlobalInvocationID.x;
    vec3 a = vec3(0.0);
    
    for (uint j = 0; j < numBodies; j++) {
      vec3 r = pos[j].xyz - pos[i].xyz;
      float dist2 = dot(r, r) + softeningRadius;
      float invDist = inversesqrt(dist2);
      a += G * pos[j].w * r * invDist * invDist * invDist;
    }
    
    acc[i] = vec4(a, 0.0);
  }
`);

// Velocity Verlet time integration:
vel += 0.5 * acc * dt;
pos += vel * dt;
acc = computeAccelerations(pos); // GPU compute
vel += 0.5 * acc * dt;
```

#### 2.4.3 Time Integration

- **Method:** Velocity Verlet (2nd order, symplectic, energy-conserving).
- **Variable Time Step:** User controls simulation speed (0.001x - 10000x real-time).
- **Adaptive Accuracy:** Larger dt at larger scales (less sensitivity to per-frame error).

### 2.5 Audio Engine

The procedural audio system generates ambient soundscapes that evolve with viewer position and scale.

#### 2.5.1 Web Audio API Architecture

```javascript
// Graph structure:
AudioContext
├─ Master GainNode (volume control)
   ├─ Ambience Bus (20% of volume)
   │  ├─ Oscillator 1 (base frequency tied to scale)
   │  │  ├─ BiquadFilter (low-pass, Q=2)
   │  │  └─ GainNode (envelope)
   │  ├─ Oscillator 2 (harmonic)
   │  │  ├─ BiquadFilter
   │  │  └─ GainNode
   │  └─ ConvolverNode (reverb)
   ├─ Rhythm Bus (30% of volume)
   │  ├─ Kick Drum (sine sweep)
   │  ├─ Hi-Hat (filtered noise)
   │  └─ Pad (Wavetable oscillators)
   └─ Spatial Bus (50% of volume)
      ├─ PannerNode (3D spatial audio)
      │  └─ Oscillators (frequency tied to object position)
      └─ StereoPannerNode (for left/right motion)
```

#### 2.5.2 Procedural Sound Generation

**Scale-Responsive Synthesis:**
```javascript
// Base frequency determined by log scale
const baseFreq = 55 * Math.pow(2, Math.log10(currentScale) / 12); // 12 semitones per octave in log space
// At scale 1e-11: ~0.1 Hz (subsonic)
// At scale 1e0: ~55 Hz (low A, audible)
// At scale 1e11: ~55 kHz (ultrasonic, folded down via modulation)

// Oscillator types: sine, square, sawtooth, triangle
// Filtered with time-varying LPF cutoff:
const filterFreq = 200 + 800 * Math.sin(time * 0.1) + scale_influence * 100;
lowpassFilter.frequency.setTargetAtTime(filterFreq, now, 0.1);
```

**Spatial Panning:**
```javascript
// Objects in scene have audible representations
panner.positionX.value = objectWorldPos.x / scale;
panner.positionY.value = objectWorldPos.y / scale;
panner.positionZ.value = objectWorldPos.z / scale;

// Frequency modulation by orbital velocity
const velocityMag = Math.hypot(vel.x, vel.y, vel.z);
const freqModulation = velocityMag * 10; // Hz
oscillator.frequency.setTargetAtTime(baseFreq + freqModulation, now, 0.05);
```

#### 2.5.3 Audio Controls

- **Master Volume:** 0-1.
- **Ambience / Rhythm / Spatial Balance:** Faders (0-100%).
- **Filter Cutoff:** Manual or automatic (locked to scale).
- **Reverb Amount:** Exponential with distance (nearer = dry, far = wet).

### 2.6 State Manager

Application state is managed with a centralized store (Redux or Zustand).

#### 2.6.1 State Schema

```typescript
interface AppState {
  // Camera/Viewport
  camera: {
    position: Vector3;
    rotation: Euler;
    logScale: number; // log10(meters per unit)
    targetLogScale: number; // for smooth zoom
    fov: number; // 20-90 degrees
  };

  // Simulation
  simulation: {
    time: number; // Unix timestamp or simulation date
    timeStep: number; // seconds per frame
    speed: number; // 1x, 10x, 100x, etc.
    isPaused: boolean;
    dateOverride?: string; // "2024-01-01" or null for real-time
  };

  // Data
  data: {
    loadedTiles: Map<string, TileData>;
    selectedObjects: ObjectID[]; // for info panels
    searchResults: SearchResult[];
    currentRegion: BoundingBox;
  };

  // UI
  ui: {
    infoPanelOpen: boolean;
    infoPanelContent: ObjectInfo | null;
    settingsOpen: boolean;
    audioEnabled: boolean;
    audioVolume: number;
    hdREnabled: boolean;
    bloomIntensity: number; // 0-1
    showGrid: boolean;
    showLabels: boolean;
    labelDensity: number; // 0-1
  };

  // Settings
  settings: {
    maxObjectsRendered: number; // GPU budget
    maxMemoryUsage: number; // bytes
    targetFPS: number; // 60 or 120
    multisampling: 1 | 2 | 4; // MSAA samples
    motionBlur: boolean;
    screenSpaceReflections: boolean;
  };
}
```

#### 2.6.2 State Mutations

```javascript
// Immutable updates via reducer pattern:
dispatch({
  type: 'CAMERA_ZOOM',
  payload: { targetLogScale: 5, duration: 1000 } // 1 second animation
});

dispatch({
  type: 'SIMULATION_ADVANCE',
  payload: { deltaTime: 86400, speed: 365.25 } // +1 sidereal year
});

dispatch({
  type: 'SELECT_OBJECT',
  payload: { objectID: 'sol', infoPanelContent: {...} }
});
```

#### 2.6.3 Subscriptions and Listeners

React components subscribe to relevant state slices:

```javascript
const { camera, simulation, ui } = useAppState(
  state => ({
    camera: state.camera,
    simulation: state.simulation,
    ui: state.ui
  })
);
```

### 2.7 UI Layer

A React component hierarchy overlaid on the WebGL canvas via a DOM element.

#### 2.7.1 Component Structure

```
<App>
  <Canvas ref={canvasRef} />
  <UIOverlay>
    <Header>
      <Logo />
      <SearchBar />
      <SettingsButton />
    </Header>
    <Sidebar>
      <NavMenu>
        <NavItem label="Solar System" />
        <NavItem label="Milky Way" />
        <NavItem label="Local Universe" />
        <NavItem label="Cosmic Web" />
      </NavMenu>
      <InfoPanel>
        <ObjectDetails />
        <HistoricalData />
      </InfoPanel>
    </Sidebar>
    <ControlPanel>
      <TimeSlider />
      <SpeedControl />
      <RenderSettings />
      <AudioControls />
    </ControlPanel>
    <NotificationCenter />
  </UIOverlay>
</App>
```

#### 2.7.2 Rendering Strategy

```javascript
// WebGL canvas takes full viewport
const canvas = document.getElementById('cosmos-canvas');
canvas.style.position = 'absolute';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.width = '100vw';
canvas.style.height = '100vh';

// React UI rendered on top with CSS overlay
const uiRoot = document.getElementById('ui-overlay');
uiRoot.style.position = 'absolute';
uiRoot.style.pointerEvents = 'none'; // Let clicks pass to canvas unless hovering over UI
uiRoot.style.zIndex = '100';

// Selective pointer events for interactive UI:
document.getElementById('search-bar').style.pointerEvents = 'auto';
document.getElementById('info-panel').style.pointerEvents = 'auto';
```

#### 2.7.3 Key UI Components

| Component | Function | Inputs |
|---|---|---|
| **SearchBar** | Find stars, planets, galaxies by name/Messier/NGC/Gaia ID | Text input → API call or local index |
| **InfoPanel** | Display name, distance, magnitude, spectral type, orbital elements | Selected object → Fetched metadata |
| **TimeControl** | Play/pause/rewind simulation, jump to specific date | Slider + buttons → State dispatch |
| **SettingsPanel** | Adjust quality, audio, effects | Toggles → Redux state → GPU config |
| **Navigation Menu** | Jump to predefined scenes (Sol, Sirius, Andromeda, Virgo Cluster) | Buttons → Camera fly-to animation |

### 2.8 Worker Pool

Web Workers offload CPU-intensive tasks from the main thread.

#### 2.8.1 Worker Types and Responsibilities

| Worker | Count | Tasks | Lifecycle |
|---|---|---|---|
| **DataWorker** | 2 | Parse binary star catalogs, decompress JSON, build octrees | Long-lived, pooled |
| **PhysicsWorker** | 2 | Compute N-body forces, Kepler solver for multiple bodies | Long-lived, shared |
| **GeometryWorker** | 1 | Generate procedural textures, terrain LOD meshes | On-demand |
| **SearchWorker** | 1 | Index search, typo tolerance, geocoding | Long-lived, shared |

#### 2.8.2 Communication Pattern

```javascript
// Main thread → Worker
const worker = workerPool.get('DataWorker');
worker.postMessage({
  type: 'PARSE_TILE',
  tileID: 'gaia_1024_512_8',
  binaryBuffer: arrayBuffer,
  transferList: [arrayBuffer] // Zero-copy transfer
});

// Worker → Main thread (after processing)
worker.onmessage = (event) => {
  const { type, positions, colors, metadata } = event.data;
  if (type === 'TILE_PARSED') {
    dispatch({
      type: 'DATA_LOADED',
      payload: { tileID: 'gaia_1024_512_8', data: { positions, colors, metadata } }
    });
    // Schedule GPU upload
    uploadToGPU(positions, colors);
  }
};
```

#### 2.8.3 Worker Pool Management

```javascript
class WorkerPool {
  constructor(workerType, poolSize = 4) {
    this.workers = Array.from({ length: poolSize }, () => new Worker(workerType));
    this.taskQueue = [];
    this.activeWorkers = new Set();
  }

  async enqueue(task) {
    const availableWorker = this.getAvailableWorker();
    if (!availableWorker) {
      return new Promise((resolve) => {
        this.taskQueue.push({ task, resolve });
      });
    }
    return this.executeTask(task, availableWorker);
  }

  executeTask(task, worker) {
    this.activeWorkers.add(worker);
    return new Promise((resolve) => {
      worker.onmessage = (event) => {
        this.activeWorkers.delete(worker);
        resolve(event.data);
        
        // Dequeue next task if any
        if (this.taskQueue.length > 0) {
          const { task: nextTask, resolve: nextResolve } = this.taskQueue.shift();
          this.executeTask(nextTask, worker).then(nextResolve);
        }
      };
      worker.postMessage(task);
    });
  }

  getAvailableWorker() {
    return this.workers.find(w => !this.activeWorkers.has(w));
  }
}
```

---

## 3. Data Architecture

### 3.1 Pre-Processed Data Formats

#### 3.1.1 Star Catalog Tiling

The 1.8B star Gaia DR3 catalog is split into **hierarchical tiles** (quadtree LOD structure).

```
Tile Naming Scheme: gaia_[level]_[x]_[y]
  level 0: 1 tile (whole sky)
  level 1: 4 tiles
  level 2: 16 tiles
  level 3: 64 tiles
  level 4: 256 tiles (typical streaming resolution)
  ...
  level 8: 65536 tiles (finest detail)

File Sizes (approximate):
  level 0: 2.5 GB (all stars)
  level 4: 8-50 MB per tile (depends on stellar density)
  level 8: 500 KB - 5 MB per tile
```

#### 3.1.2 Galaxy Catalog Format

SDSS/2dF galaxies and IllustrisTNG simulated galaxies:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "PGC1000",
      "geometry": {
        "type": "Point",
        "coordinates": [1.234, 45.678, 500.0] // [RA, Dec, distance_Mpc]
      },
      "properties": {
        "name": "NGC 224",
        "type": "Sa",
        "magnitude": 3.44,
        "size_kpc": 220,
        "mass_solMass": 1.5e11,
        "redshift": 0.0012
      }
    }
  ]
}
```

#### 3.1.3 Ephemeris Data (JPL Horizons)

For planets, moons, and spacecraft, cached ephemeris files:

```
File: horizons_2026-01-01_2026-12-31.json

{
  "epoch": "2026-01-01T00:00:00Z",
  "bodies": [
    {
      "naif_id": 10,
      "name": "Sun",
      "states": [
        {
          "jd": 2460310.5,
          "position": [0.0, 0.0, 0.0],
          "velocity": [0.0, 0.0, 0.0]
        },
        ...
      ]
    },
    {
      "naif_id": 399,
      "name": "Earth",
      "states": [
        {
          "jd": 2460310.5,
          "position": [0.983, 0.152, 0.000],
          "velocity": [-0.017, 0.985, 0.000]
        },
        ...
      ]
    }
  ]
}
```

### 3.2 Streaming Strategy

1. **Initial Load:** Solar System + nearest stars (within 100 pc) + Milky Way overview.
2. **On Zoom:** Request finer LOD tiles for current camera bounds.
3. **On Pan:** Prefetch adjacent tiles.
4. **Eviction:** Drop tiles >1000 pc away or >30 seconds old.
5. **Network Optimization:**
   - Parallel tile fetches (max 6 concurrent).
   - Prioritize by screen-space size.
   - Cancel requests if user navigates away before download completes.

### 3.3 Caching Strategy

**Three-Tier Cache:**

1. **VRAM Cache (GPU Buffers):** Immediate rendering; max 512 MB.
2. **RAM Cache (JavaScript ArrayBuffers):** Ready to upload; max 512 MB; LRU eviction.
3. **IndexedDB:** Persistent cache; ~5 GB per domain (browser quota dependent).

**Cache Coherency:**
```javascript
const cacheKey = (tileID, version) => `${tileID}_v${version}`;

async function loadTile(tileID, version) {
  // Check VRAM
  if (gpuCache.has(cacheKey(tileID, version))) {
    return gpuCache.get(cacheKey(tileID, version));
  }
  
  // Check RAM
  if (ramCache.has(cacheKey(tileID, version))) {
    const data = ramCache.get(cacheKey(tileID, version));
    uploadToGPU(data);
    return data;
  }
  
  // Check IndexedDB
  let data = await indexedDB.get(cacheKey(tileID, version));
  if (data) {
    ramCache.set(cacheKey(tileID, version), data);
    uploadToGPU(data);
    return data;
  }
  
  // Fetch from CDN
  data = await fetch(`/data/tiles/${tileID}.bin`).then(r => r.arrayBuffer());
  ramCache.set(cacheKey(tileID, version), data);
  await indexedDB.put(cacheKey(tileID, version), data);
  uploadToGPU(data);
  return data;
}
```

### 3.4 CDN Structure

```
CDN Root (Cloudflare R2 or AWS S3)
├── /data/
│   ├── /gaia/
│   │   ├── gaia_0.bin (2.5 GB, not typically fetched)
│   │   ├── gaia_4_0_0.bin ... gaia_4_3_3.bin (16 files, 50 MB each)
│   │   ├── gaia_8_0_0.bin ... gaia_8_65535.bin (65536 files, 1-5 MB each)
│   │   └── manifest.json (tile list, checksums, versions)
│   ├── /sdss/
│   │   ├── galaxies.json.gz (500 MB)
│   │   └── spectra.npy (binary, 50 GB) [optional, for research]
│   ├── /horizons/
│   │   ├── ephemeris_2020-2030.json.gz (5 MB)
│   │   └── [updated yearly]
│   └── /cosmic_web/
│       └── illustrisTNG_filaments.bin (200 MB)
│
├── /textures/
│   ├── /earth/ [2K PBR maps]
│   │   ├── albedo.webp
│   │   ├── normal.webp
│   │   ├── roughness.webp
│   │   └── ao.webp
│   ├── /mars/ [2K PBR maps]
│   ├── /gas_giants/ [1K atlases]
│   ├── /stars/ [procedural + reference]
│   └── /skybox/ [Gaia DR3 stellar density]
│
├── /shaders/
│   ├── star-point.glsl
│   ├── planet.glsl
│   ├── bloom-blur.glsl
│   └── [all shader sources, CORS-friendly]
│
└── /sounds/
    ├── ambience-base.wav
    ├── rhythm-kick.wav
    └── [audio assets, optional]
```

**HTTP Cache Headers:**
```
# Star data tiles (immutable, annual updates)
/data/gaia/*.bin
  Cache-Control: public, max-age=31536000, immutable

# Textures (immutable unless version changes)
/textures/**/*
  Cache-Control: public, max-age=31536000, immutable

# Manifest (changes frequently)
/data/*/manifest.json
  Cache-Control: public, max-age=3600

# Shaders (dev: no cache; prod: immutable)
/shaders/**/*
  Cache-Control: public, max-age=31536000, immutable
```

---

## 4. Rendering Pipeline

### 4.1 Frame Lifecycle

```
Frame N
  ├─ [Input Processing] (< 1 ms)
  │  ├─ Keyboard input (WASD, arrow keys)
  │  ├─ Mouse input (orbit, zoom)
  │  └─ Touch input (pinch-zoom)
  │
  ├─ [State Update] (< 1 ms)
  │  ├─ Lerp camera to target position/rotation
  │  ├─ Update FOV based on zoom speed
  │  └─ Clamp scroll/movement to valid ranges
  │
  ├─ [Physics Update] (2-5 ms, offloaded to Worker)
  │  ├─ Integrate orbital equations of motion
  │  ├─ Update planet/moon positions
  │  └─ Query spatial indices
  │
  ├─ [Scene Graph Update] (< 1 ms)
  │  ├─ Update transform matrices (position, rotation, scale)
  │  ├─ Update visibility (frustum culling + LOD selection)
  │  └─ Update materials (time-dependent shaders)
  │
  ├─ [Data Streaming] (async, background)
  │  ├─ Determine visible tile set from camera bounds
  │  ├─ Queue missing tiles for download
  │  └─ Parse tiles in Worker
  │
  ├─ [Render Pass] (12-20 ms target)
  │  ├─ Clear framebuffer
  │  │
  │  ├─ [Pass 1: Depth Prepass] (optional, for large scenes)
  │  │  └─ Render all objects to depth buffer (no color)
  │  │
  │  ├─ [Pass 2: Skybox]
  │  │  ├─ Set depth to max (behind everything)
  │  │  ├─ Apply skybox shader (position-dependent stellar density)
  │  │  └─ Draw full-screen quad
  │  │
  │  ├─ [Pass 3: Far Objects] (z > 1 kpc, no detail)
  │  │  ├─ Enable depth test, disable depth write
  │  │  ├─ Render galaxies (instanced meshes, LOD 0)
  │  │  ├─ Render cosmic web filaments (line strips)
  │  │  └─ ~100-500 draw calls
  │  │
  │  ├─ [Pass 4: Mid Objects] (1 pc < z < 1 kpc)
  │  │  ├─ Render stars (instanced point clouds, LOD 0-1)
  │  │  ├─ Render nebulae (volumetric billboards)
  │  │  └─ ~50-200 draw calls
  │  │
  │  ├─ [Pass 5: Near Objects] (z < 1 pc)
  │  │  ├─ Enable full lighting
  │  │  ├─ Render planets/moons (high-detail meshes, LOD 2-3)
  │  │  ├─ Render atmospheric halos (screen-space shaders)
  │  │  └─ ~20-50 draw calls
  │  │
  │  ├─ [Pass 6: Forward+ / Deferred Shading] (if many lights)
  │  │  ├─ Light culling via compute shader (tile-based)
  │  │  └─ Deferred shading for complex lighting
  │  │
  │  └─ Total render: ~15-18 ms (target 16.7 ms for 60 FPS)
  │
  ├─ [Post-Processing Chain] (2-4 ms)
  │  ├─ Bloom (bright pass + separable blur)
  │  │  ├─ Threshold bright pixels (> 1.0 HDR)
  │  │  ├─ Downscale to 1/2 resolution
  │  │  ├─ Horizontal Gaussian blur (σ=2)
  │  │  ├─ Vertical Gaussian blur (σ=2)
  │  │  └─ Upscale + additive blend (~1.5 ms)
  │  │
  │  ├─ God Rays (optional, ~1 ms)
  │  │  ├─ Find brightest pixel (usually Sun/bright star)
  │  │  ├─ Radial blur from that point
  │  │  └─ Blend additive
  │  │
  │  ├─ Tone Mapping (ACES RRT + ODT, ~0.3 ms)
  │  │  └─ Convert HDR → LDR for display
  │  │
  │  ├─ Chromatic Aberration (optional, ~0.5 ms)
  │  │  ├─ Offset R, G, B samples slightly
  │  │  └─ Simulate lens dispersion
  │  │
  │  ├─ Film Grain (optional, ~0.2 ms)
  │  │  └─ Add perlin noise overlay
  │  │
  │  └─ Gamma Correction (built-in, <0.1 ms)
  │
  ├─ [UI Composite] (< 1 ms)
  │  └─ React renders UI overlay on top of canvas
  │
  └─ [Display] (< 1 ms)
     └─ requestAnimationFrame → swap buffers → 60/120 FPS
```

### 4.2 Multi-Pass Rendering Rationale

**Why multi-pass?**
- **Depth complexity:** Objects at vastly different scales need different rendering strategies.
- **Performance optimization:** Cull early to avoid expensive shader work.
- **Visual quality:** Different LOD levels per distance band prevent aliasing and popping.
- **Post-processing:** Bloom and effects require intermediate textures.

**Why forward rendering instead of deferred?**
- Fewer total objects (<10k draw calls typical), so forward is efficient.
- Transparent effects (atmospheres, nebulae) are easier in forward.
- Tile-based deferred might be added for dense stellar neighborhoods (future optimization).

### 4.3 Instanced Rendering for Millions of Stars

Rendering 1.8B stars naively would require 1.8B draw calls—impossible. Instead:

```glsl
// Vertex shader: instanced rendering
#version 300 es

layout(location = 0) in vec3 position; // Star position (tile-local)
layout(location = 1) in uint color_packed; // RGB888 packed
layout(location = 2) in uint magnitude_parallax; // magnitude + parallax

uniform mat4 uProjection;
uniform mat4 uView;
uniform float uLogScale;

out vec3 vColor;
out float vMagnitude;

void main() {
  // Decompress packed data
  vec3 color = vec3(
    float((color_packed >> 16u) & 0xFFu) / 255.0,
    float((color_packed >> 8u) & 0xFFu) / 255.0,
    float((color_packed >> 0u) & 0xFFu) / 255.0
  );
  float mag = float((magnitude_parallax >> 8u) & 0xFFu) / 10.0 - 10.0;

  // Apply logarithmic scale
  vec3 worldPos = position * pow(10.0, uLogScale);
  
  // Project to screen
  gl_Position = uProjection * uView * vec4(worldPos, 1.0);
  
  // Vary point size based on magnitude (brighter = larger)
  gl_PointSize = exp(-mag * 0.3) * 3.0; // Logarithmic scaling
  
  vColor = color;
  vMagnitude = mag;
}

// Fragment shader
#version 300 es

in vec3 vColor;
in float vMagnitude;

out vec4 outColor;

void main() {
  // Render point as soft circle (antialiased)
  vec2 coord = gl_PointCoord * 2.0 - 1.0; // [-1, 1]
  float dist = length(coord);
  if (dist > 1.0) discard;
  
  // Soft falloff
  float alpha = exp(-dist * dist * 2.0);
  
  // Add brightness based on magnitude
  float brightness = 1.0 + max(0.0, -vMagnitude * 0.1);
  
  outColor = vec4(vColor * brightness, alpha);
}
```

**Batch Sizes:**
- Per tile: 65k stars (single draw call with 65k instances).
- Per frame: 4-16 tiles visible → 4-16 draw calls for stars.
- Total draw calls per frame: ~100-300 (all objects).

### 4.4 Custom Shaders Catalog

See Section 2.1.5 (Shader Catalog) for full list.

---

## 5. Performance Architecture

### 5.1 GPU Budget

Target: **16.7 ms per frame** (60 FPS) on mid-range hardware (GTX 1060 or equivalent).

```
Frame Budget:
  Render Pass:     12-14 ms (70%)
  Post-Processing: 2-3 ms   (12%)
  Physics/Logic:   1-2 ms   (10%)
  Overhead:        1 ms     (8%)
  ────────────────────────
  Total:           16-20 ms
```

**GPU Memory Budget:**
- VRAM texture cache: 256 MB (star data + metadata).
- Render targets: 32 MB (HDR framebuffer + bloom).
- Vertex/index buffers: 128 MB (planets, nebulae, assets).
- Shaders + uniforms: 16 MB.
- **Total: ~432 MB** (well below 1GB on modern GPUs).

### 5.2 LOD Strategy

| Object Type | LOD 0 | LOD 1 | LOD 2 | LOD 3 |
|---|---|---|---|---|
| **Star** | Point (1 px) | Point (4 px) | Sphere (32 tri) | Sphere + corona (200 tri) |
| **Planet** | Sphere (12 tri) | Sphere (48 tri) | Sphere (192 tri) | Sphere + detail (8k tri) |
| **Galaxy** | Point | Billboard | Low-poly mesh (500 tri) | High-poly mesh (5k tri) |
| **Octree Node** | Culled if off-screen | Rendered if nearby | Subdivided if camera zooms | All leaves rendered |

### 5.3 Frustum Culling + Octree

```javascript
function renderScene(camera, octree) {
  const frustum = extractFrustum(camera.projectionMatrix);
  
  function traverse(node, depth) {
    // Test node AABB against frustum
    if (!frustum.intersectsBounds(node.aabb)) {
      return; // Cull entire subtree
    }
    
    if (node.isLeaf) {
      // Render objects in this leaf
      const lod = selectLOD(camera.distance, node.aabb);
      renderObjects(node.objects, lod);
    } else {
      // Recurse to children
      for (const child of node.children) {
        traverse(child, depth + 1);
      }
    }
  }
  
  traverse(octree.root, 0);
}
```

**Expected Performance:**
- Without culling: ~1000 draw calls, massive overdraw.
- With frustum culling: ~300-500 draw calls (60-70% reduction).
- With LOD + frustum: ~100-200 draw calls (80-90% reduction).

### 5.4 Web Worker Offloading

**Tasks offloaded to workers:**
1. **Data parsing:** Binary star catalogs (decode + decompression).
2. **Octree construction:** Build spatial index from loaded tiles.
3. **Physics:** Kepler solver, N-body acceleration (heavy frames).
4. **Geometry:** Procedural texture generation, mesh simplification.

**Expected speedup:**
- Physics (2 workers): 1.5-2x faster (can process 2 updates in parallel).
- Data parsing (2 workers): 2-4x faster (depends on I/O, CPU, and compression).
- Geometry (1 worker): 1.5x faster (main thread unblocked for rendering).

### 5.5 Memory Management & GC

```javascript
// Avoid frequent allocations
class ObjectPool {
  constructor(ObjectClass, poolSize = 1000) {
    this.pool = Array.from({ length: poolSize }, () => new ObjectClass());
    this.available = [...this.pool];
    this.inUse = new Set();
  }

  get() {
    const obj = this.available.pop();
    if (!obj) throw new Error('Object pool exhausted');
    this.inUse.add(obj);
    return obj;
  }

  release(obj) {
    this.inUse.delete(obj);
    obj.reset();
    this.available.push(obj);
  }
}

// Use typed arrays (no GC pressure)
const positions = new Float32Array(1_000_000); // Pre-allocated
const colors = new Uint8Array(1_000_000);

// Periodic cleanup
setInterval(() => {
  // Clear unused cache entries
  ramCache.evictExpired();
  // Force GC (may not work, but hints to browser)
  if (performance.memory?.jsHeapSizeLimit) {
    console.log(`Memory: ${performance.memory.usedJSHeapSize / 1e6 | 0} MB`);
  }
}, 10000); // Every 10 seconds
```

---

## 6. Deployment Architecture

### 6.1 Static Site Hosting

Cosmos Explorer is a **static site** (no server-side rendering). Deploy to:
- **Vercel:** Optimal for Next.js/React, auto-scaling, 150+ edge locations.
- **Netlify:** Similar to Vercel, good DX, CDN included.
- **Cloudflare Pages:** Ultra-low latency, edge compute for future features.

### 6.1.1 Build Pipeline

```bash
# 1. Install dependencies
npm install

# 2. Type-check and lint
npx tsc --noEmit
npx eslint src/**/*.{ts,tsx}

# 3. Bundle with Webpack/Vite
npm run build
# Output: dist/
#   ├─ index.html
#   ├─ js/
#   │   ├─ main.[hash].js (React app)
#   │   ├─ vendor.[hash].js (Three.js, etc.)
#   │   └─ worker-*.js (Web Workers)
#   ├─ css/
#   │   └─ main.[hash].css
#   └─ robots.txt

# 4. Minification and optimization
npm run optimize
# Compress with brotli, optimize images, etc.

# 5. Deploy to CDN
npm run deploy:prod
# Runs CI/CD pipeline (GitHub Actions, GitLab CI, etc.)
```

### 6.1.2 CDN Configuration

```yaml
# Cloudflare R2 + Workers (example)

routes:
  - pattern: "example.com"
    handler: "worker-spa" # Single Page App handler
    cacheRules:
      - pattern: "/**/*.js"
        cacheTtl: 31536000 # 1 year (immutable)
      - pattern: "/**/*.css"
        cacheTtl: 31536000
      - pattern: "/index.html"
        cacheTtl: 3600 # 1 hour (check for updates)
      - pattern: "/data/*"
        cacheTtl: 31536000 # Data tiles cached forever
  
  - pattern: "assets.example.com"
    handler: "bucket-r2"
    cacheRules:
      - pattern: "/**/*"
        cacheTtl: 31536000

  - pattern: "api.example.com" # Optional API server
    handler: "origin-https://api-server.example.com"
    cacheRules:
      - pattern: "/search"
        cacheTtl: 300 # Cache search results 5 minutes
      - pattern: "/ephemeris/*"
        cacheTtl: 86400 # Cache ephemeris 24 hours
```

### 6.2 Optional API Server

For dynamic features not possible with static files:

```javascript
// Express.js API server (optional)

app.get('/api/search/:query', async (req, res) => {
  // Proxy to Gaia DR3 search API or local index
  const results = await searchGaiaCatalog(req.params.query);
  res.json(results);
});

app.get('/api/ephemeris/:body/:date', async (req, res) => {
  // Fetch from JPL Horizons API or cached database
  const ephemeris = await fetchEphemeris(req.params.body, req.params.date);
  res.json(ephemeris);
});

app.get('/api/data/tiles/:tileID', (req, res) => {
  // Proxy to CDN or serve directly (for edge compute)
  res.redirect(`https://assets.example.com/data/tiles/${req.params.tileID}.bin`);
});
```

**Deployment:**
- **Vercel Functions / Netlify Functions:** Serverless (auto-scales).
- **AWS Lambda + API Gateway:** Serverless with CloudFront CDN.
- **Heroku / Railway / Fly.io:** Traditional containerized app.

### 6.3 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml

name: Deploy Cosmos Explorer

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test:unit
      - run: npm run test:e2e
      - run: npm run type-check

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run optimize
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: dist
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 7. Technology Stack

| Layer | Technology | Version | Justification |
|---|---|---|---|
| **Runtime** | Node.js | 18+ LTS | Stable, async/await, recent WebGL bindings. |
| **Language** | TypeScript | 5.0+ | Type safety, IDE support, catches bugs at build time. |
| **React** | React 18 | 18.2+ | Virtual DOM, component model, hooks for state management. |
| **State** | Zustand or Redux | 4.2+ / 5.0+ | Lightweight (Zustand) or battle-tested (Redux); pick one. |
| **Rendering** | Three.js | r184+ | Mature, WebGL abstraction, large ecosystem. |
| **3D Assets** | glTF 2.0 | 2.0 | Open standard, streaming, Draco compression support. |
| **UI Components** | Material-UI / shadcn | 5.x / latest | Professional look, accessible, customizable. |
| **Build Tool** | Vite | 4.0+ | Fast builds, ES modules, HMR, tree-shaking. |
| **Module Bundler** | Rollup (via Vite) | 3.x | Efficient code splitting, ES modules. |
| **CSS** | Tailwind CSS | 3.3+ | Utility-first, small bundle, rapid prototyping. |
| **Testing** | Vitest + Playwright | 0.30+ / 1.35+ | Fast unit tests, realistic browser testing. |
| **Linting** | ESLint + Prettier | 8.x / 2.8+ | Code quality, consistent formatting. |
| **Documentation** | TypeDoc / Typescripts | 3.0+ | Auto-generate API docs from source. |
| **Data Science** | Python (offline) | 3.10+ | Preprocess Gaia/SDSS catalogs; not deployed. |
| **GPU Compute (future)** | WebGPU | 0.1+ (when stable) | Replaces WebGL; better compute, better API. |
| **Audio** | Web Audio API | Stable | Built-in, no library needed. |
| **Vector Math** | Three.js Math | (included) | Vector3, Quaternion, Matrix4, etc. |
| **Physics** | Custom (Kepler solver) | N/A | Simpler than Cannon.js/Babylon.js for orbital mechanics. |

### 7.1 Dependency Size Budget

```
Target bundle size (gzipped): < 2 MB

Breakdown:
  React + React-DOM:        350 KB
  Three.js (tree-shook):    400 KB
  Material-UI core:         150 KB
  Tailwind CSS:             50 KB
  Zustand:                  5 KB
  Other utilities:          50 KB
  ──────────────────────
  Total:                    1005 KB (under budget)

Not included (loaded separately):
  Data tiles (on-demand):   Streamed
  Textures:                 Streamed via CDN
  Shaders (optional):       Inlined or cached
```

---

## 8. Security Considerations

### 8.1 Content Security Policy (CSP)

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'wasm-unsafe-eval' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' https://api.example.com https://horizons.jpl.nasa.gov;
  worker-src 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
```

### 8.2 CORS (Cross-Origin Resource Sharing)

```
// Allow data tiles from CDN
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET
Access-Control-Max-Age: 86400
```

### 8.3 No User Data Collection

- **No analytics cookies** (no Google Analytics).
- **No tracking pixels** (no Facebook Pixel).
- **Local-only settings** (localStorage, no server sync).
- **No accounts required** (fully anonymous).
- **No telemetry** (no crash reporting to 3rd party).

**Exception:** Optional anonymous usage stats (via first-party cookie):
```javascript
// If enabled, collect only:
// - Render times (for performance monitoring)
// - Most-viewed regions (for data prioritization)
// - Client GPU tier (for optimization)
// All stored locally; never sent to external servers.
```

### 8.4 Open-Source Audit

- All code on **GitHub (public).**
- Regular security audits (OWASP Top 10).
- Dependencies scanned with **Snyk** or **npm audit.**
- No obfuscated code.
- Clear license (Apache 2.0 or MIT).

### 8.5 HTTPS Only

- Redirect HTTP → HTTPS.
- Use HSTS (Strict-Transport-Security) header:
  ```
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  ```

---

## 9. Scalability & Future Roadmap

### 9.1 Near-Term (6-12 months)

- **WebGPU Migration:** Replace WebGL 2.0 with WebGPU for better compute performance.
- **Improved Physics:** GPU-accelerated N-body simulation (compute shaders).
- **Mesh Compression:** Draco compression for planet/galaxy meshes (~50% size reduction).
- **Mobile Optimization:** Touch controls, reduced detail for mobile GPUs.
- **Offline Support:** Service Worker caching for complete offline functionality.

### 9.2 Medium-Term (1-2 years)

- **WebXR Support:** VR (HTC Vive, Meta Quest) and AR (ARKit/ARCore) experiences.
- **Collaborative Features:** Multi-user sessions, shared camera position.
- **Plugin System:** Allow community to add custom objects/simulations.
- **Mobile Native:** React Native app for iOS/Android (GPU compute via Metal/Vulkan).
- **Scientific Integration:** Direct export of 3D models to research tools (Blender, Unreal Engine).

### 9.3 Long-Term (2-5 years)

- **Real-Time Data:** Live JPL Horizons integration (near real-time ephemeris).
- **Community Data:** User-submitted objects (asteroids, space probes, fictional objects).
- **Machine Learning:** AI-powered discovery (anomalies in Gaia data, gravitational lensing detection).
- **Blockchain Integration:** NFT certificates for discovered exoplanet candidates (optional, fun feature).
- **Desktop/Console Apps:** Native apps for better performance on high-end hardware.

### 9.4 Scalability Metrics

| Metric | Current | Stretch Goal |
|---|---|---|
| **Max stars rendered/frame** | 10M | 100M (via hierarchical LOD + GPU compute) |
| **Max simultaneous users** | 100k | 1M (CDN scaling) |
| **Data tile size** | 5 MB average | <1 MB (improved compression) |
| **Time to interactive** | 3-5 seconds | <1 second (optimized bundle, fast CDN) |
| **Memory usage (browser)** | 300-500 MB | 150 MB (more efficient data structures) |

---

## 10. Architecture Decision Records (ADRs)

### ADR-001: Three.js Over Babylon.js

**Decision:** Use Three.js for the rendering engine.

**Context:**
- Comparing WebGL libraries for Cosmos Explorer.
- Both Three.js and Babylon.js are mature and well-maintained.

**Criteria:**
1. Community size and ecosystem: Three.js (larger, more StackOverflow answers).
2. Bundle size: Three.js (500 KB vs Babylon.js 700 KB, after tree-shaking).
3. Documentation: Babylon.js (slightly better, but Three.js sufficient).
4. Learning curve: Three.js (simpler API, fewer abstractions).
5. Performance: Comparable (both GPU-bound in this use case).

**Decision:** **Three.js.**

**Rationale:**
- Larger ecosystem of community examples and libraries (easier to prototype).
- Smaller bundle size (important for ~2 MB total SPA budget).
- Most developers familiar with Three.js (easier hiring, onboarding).

**Consequences:**
- Babylon.js post-processing is more powerful (but Three.js has enough).
- Babylon.js has better TypeScript types (but Three.js catching up).

**Alternatives Considered:**
- Babylon.js: Would work, slightly more bloated.
- Custom WebGL: Too much maintenance, reinventing the wheel.
- Cesium.js: Overkill for this use case (designed for geospatial, not astronomy).

---

### ADR-002: Client-Side Rendering Over Server-Side

**Decision:** Render in browser (WebGL) rather than server-side (e.g., using Node Threaded or GCP Vertex AI).

**Context:**
- Rendering 1.8B stars every frame is infeasible server-side.
- Server-side rendering would require streaming video, introducing latency.

**Criteria:**
1. Latency: Client-side (immediate), server-side (100+ ms stream latency).
2. Scalability: Client-side (scales to 100k users without server cost), server-side (GPU cluster required).
3. Interactivity: Client-side (60 FPS realtime), server-side (stream degradation under load).
4. Cost: Client-side (CDN only), server-side (GPU servers, bandwidth).
5. Offline: Client-side (works offline), server-side (requires network).

**Decision:** **Client-side rendering.**

**Rationale:**
- Real-time interactivity is paramount; users expect 60 FPS response to input.
- Server-side rendering prohibitively expensive for 1.8B objects.
- Client devices have capable GPUs (WebGL 2.0, WebGPU in future).
- Scales horizontally to millions of users at marginal cost (CDN).

**Consequences:**
- Requires modern browser (not IE11; WebGL 2.0+).
- Users with integrated GPUs (Intel UHD 630) get reduced detail.
- Battery drain on mobile (mitigated by mobile native app in future).

**Alternatives Considered:**
- Hybrid: Server-side renders tiles of data, client-side composites. Too complex; client-side GPU rendering is better.
- Video streaming: Acceptable for fixed viewports (e.g., planetarium), not interactive exploration.

---

### ADR-003: Logarithmic Scale Over Linear Coordinates

**Decision:** Use logarithmic coordinate system to represent ~1e37 meter depth range.

**Context:**
- Universe spans from ~1e-35 m (Planck length) to ~1e26 m (observable universe).
- Linear floating-point coordinates insufficient (32-bit floats cover ~1e38 range, but precision worsens).
- Standard 64-bit doubles give ~15 decimal digits; insufficient for both large and small scales simultaneously.

**Criteria:**
1. Precision: Logarithmic (uniform ~15% relative error), linear (absolute error grows with scale).
2. Z-fighting prevention: Logarithmic (no z-fighting), linear (z-fighting at extreme scales).
3. Ease of implementation: Logarithmic (simple math), linear (simpler conceptually).
4. Culling efficiency: Logarithmic (easier to reason about scale bands), linear (more complex).

**Decision:** **Logarithmic scale.**

**Rationale:**
- Logarithmic representation maps 1e37-meter range to ~120 logscale units, solvable with high precision.
- Universe naturally logarithmic: each zoom level is ~10x (habitable zone, planetary system, solar neighborhood, galaxy, universe).
- GPU shader support: Simple exponentiation and logarithm operations.

**Consequences:**
- Developer mental model shift (logscale = Math.log10(meters)).
- Some physics calculations require conversion (e.g., inverse square law).
- All shaders must handle log coordinates (no big deal; ~5 lines per shader).

**Alternatives Considered:**
- Hierarchical coordinate systems (separate zones by scale): Too complex, maintains same precision limitations.
- Arbitrary precision math (BigInt): Slow, not GPU-friendly, defeats the purpose.
- Dual-paraboloid projections: Overkill for this use case.

---

### ADR-004: Preprocessed Data Over Live API Calls

**Decision:** Pre-process Gaia DR3 and other catalogs offline; serve as static tiles.

**Context:**
- Gaia DR3 has 1.8B stars; querying live API is slow (~5 seconds per 100k stars).
- Network unreliable; want to cache data locally (IndexedDB).
- Real-time updates (e.g., asteroid positions) can be handled separately.

**Criteria:**
1. Load time: Preprocessed (ms via CDN + local cache), live API (5-10 seconds + network variance).
2. Complexity: Preprocessed (offline once), live API (error handling, timeouts, fallbacks).
3. Offline support: Preprocessed (yes), live API (no).
4. Data freshness: Preprocessed (static, annual updates), live API (always fresh).
5. Cost: Preprocessed (CDN), live API (API server infrastructure).

**Decision:** **Preprocessed static tiles.**

**Rationale:**
- Gaia DR3 is archival; positions don't change (parallax values are fixed).
- Ephemeris data (planets, comets) update yearly, not continuously.
- Preprocessing once saves millions of API calls from users globally.
- Enables true offline experience.

**Consequences:**
- Delayed updates (annual release cycle for new Gaia data).
- Storage cost for preprocessed tiles (~5 GB uncompressed, ~2 GB gzipped).
- Requires rebuild pipeline when new catalog is available.

**Alternatives Considered:**
- Hybrid: Cache preprocessed, fallback to live API. Complexity not worth it.
- Purely live API: Unacceptable latency and cost.
- GraphQL API: Nicer querying, but doesn't solve fundamental latency.

---

### ADR-005: Web Audio API Over Pre-Recorded Audio Loops

**Decision:** Generate procedural audio dynamically using Web Audio API rather than play pre-recorded audio files.

**Context:**
- Ambient soundscape must respond to user position and scale (tied to universe).
- Pre-recorded audio cannot be dynamic; looping 10-minute tracks feels static.
- Web Audio API allows real-time synthesis from oscillators, filters, and modulators.

**Criteria:**
1. File size: Procedural (0 KB audio), pre-recorded (10-50 MB tracks).
2. Responsiveness: Procedural (realtime control), pre-recorded (fixed timing).
3. Memory: Procedural (negligible), pre-recorded (decode entire track to RAM).
4. Complexity: Procedural (learning curve), pre-recorded (simple playback).
5. Artistic quality: Procedural (experimental), pre-recorded (polished).

**Decision:** **Procedural (Web Audio API).**

**Rationale:**
- Audio experience should match visual exploration (evolves with camera movement).
- Saves bandwidth and storage; no large audio files to download.
- Procedural synth aligns with sci-fi theme.
- Modern browsers have excellent Web Audio support.

**Consequences:**
- Audio might feel more "synth" than "orchestral" (artistic choice).
- Requires tuning of oscillator frequencies, envelopes, filters.
- Accessibility: Flashing/flickering audio might trigger migraines (mitigated by mute button).

**Alternatives Considered:**
- Pre-recorded + procedural hybrid: Could work, but defeats simplicity goal.
- Silence: Boring, less immersive.

---

---

## 10. Shader Management System (Added v2.0)

### 10.1 Entity-to-Shader Registry

The system must support 96 unique entity types (defined in Doc 22 — Interactive Toggle Features v4.2). Rather than 96 individual shader programs, entity types are grouped into **Shader Families** with parameterized variations:

| Shader Family | Entity Types Covered | Parameter Variations |
|---|---|---|
| `star-surface` | ENT-1010–1016 (O through M spectral types) | Temperature (2,400–50,000K), color ramp, limb darkening coefficient, rotation speed |
| `star-evolved` | ENT-1020–1029 (Protostars through Carbon Stars) | Envelope opacity, pulsation amplitude/period, mass loss rate, dust shell radius |
| `star-compact` | ENT-1030–1032 (White Dwarfs, Neutron Stars, Black Holes) | Accretion disk params, jet angle/length, gravitational lensing strength, rotation period |
| `star-variable` | ENT-1033–1040 (Cepheids through Hypergiants) | Pulsation period, brightness amplitude, binary separation, eruption probability |
| `brown-dwarf` | ENT-1017–1019 (L/T/Y types) | Cloud band opacity, methane absorption, temperature gradient |
| `planet-rocky` | ENT-2010–2013, 2038–2039, 2050 (Mercury through Mars, Iron, Desert, Chthonian) | Crater density, atmosphere thickness, ice cap coverage, surface color ramp, dust storm probability |
| `planet-gas` | ENT-2020–2026, 2030, 2041 (Jupiter through Neptune, Hot Jupiter, Puffy) | Band count, differential rotation speeds, vortex params, ring system toggle |
| `planet-exotic` | ENT-2031–2037, 2040, 2042–2047 (Super-Earth through Synestia) | Lava coverage, ocean depth, diamond refraction, tidal lock ratio, accretion debris |
| `moon-surface` | ENT-3010–3024 (All moon types) | Crater density, volcanic activity, ice crack pattern, haze opacity |
| `asteroid-body` | ENT-4010–4016 (All asteroid types) | Shape irregularity, albedo, spectral class color, rotation tumble |
| `comet` | ENT-4020–4023 (All comet types) | Tail length, jet count, coma radius, dust/ion tail ratio |
| `dwarf-planet` | ENT-4030–4032 (Pluto/Ceres/Eris types) | Surface composition, atmosphere toggle, bright spots |
| `kbo-centaur` | ENT-4040–4051 (KBOs, Centaurs, Trojans) | Color (red/neutral), activity toggle, binary toggle |
| `nebula-emission` | ENT-5010–5012 (H II, compact H II, H I) | Density function, Hα/OIII/SII mix, embedded star count, expansion rate |
| `nebula-planetary` | ENT-5020–5022 (Spherical, Bipolar, Irregular PN) | Shell count, bipolar angle, central WD luminosity, OIII dominance |
| `nebula-other` | ENT-5030–5041, 5060–5080 (Reflection, Dark, SNR, WR, Protoplanetary, Superbubble) | Scattering color, extinction coefficient, shock velocity, disk gap count |
| `galaxy-spiral` | ENT-6010–6012 (SA, SB, S0) | Arm count, pitch angle, bar length, bulge-to-disk ratio |
| `galaxy-elliptical` | ENT-6020–6022 (Giant, Dwarf, dSph) | Ellipticity (E0-E7), Sérsic index, halo extent |
| `galaxy-irregular` | ENT-6030–6031 (Irr I, Irr II) | Clump count, tidal tail length |
| `galaxy-active` | ENT-6040–6044 (Seyfert, Quasar, Radio, Blazar, LINER) | Jet length, AGN luminosity, torus viewing angle |
| `galaxy-special` | ENT-6050–6055 (Starburst, Ring, Jellyfish, ULIRG, UDG, Merging) | SFR, ring radius, stripping tail, merger stage |
| `largescale-cluster` | ENT-7010–7023 (Clusters, Groups, Superclusters) | Member count, density profile, ICM temperature |
| `largescale-cosmic` | ENT-7030–7040 (Filaments, Voids, Walls, LABs, CMB) | Density threshold, void radius, anisotropy amplitude |
| `exotic` | ENT-8010–8025 (All exotic objects) | Lensing strength, magnetic field, Hawking radiation, theoretical visualization mode |

**Total: 24 shader families covering 96 entity types.**

### 10.2 Shader Compilation Pipeline

```
1. On app load: compile 6 core shader families (star-surface, planet-rocky, planet-gas, nebula-emission, galaxy-spiral, largescale-cosmic)
2. On entity approach: check if shader family compiled → if not, async compile via Web Worker
3. Shader cache: store compiled programs in Map<string, WebGLProgram> — max 32 active programs
4. LRU eviction: when cache full, evict least-recently-used program (not currently visible)
5. Fallback: if compilation fails → use simplified "generic-glow" shader (single color + bloom)
```

### 10.3 Material Parameter System

Each entity instance receives a `UniformBuffer` with type-specific parameters:
- Shared uniforms: `uTime`, `uCameraPosition`, `uScale`, `uLODLevel`
- Type uniforms: loaded from entity catalog data (temperature, color ramps, animation speeds)
- Instance uniforms: position, rotation, unique seed for procedural variation

---

## 11. Volumetric Rendering Pipeline (Added v2.0)

### 11.1 Raymarching Architecture

For nebulae (ENT-5000 series, 14 types) and volumetric effects:

- **Raymarching shader**: fragment shader performs 48–160 steps per pixel along view ray
- **Density function**: 3D FBM noise (5-8 octaves Perlin/Simplex) sampled at each step
- **Emission model**: density × emission color (mapped from Hα/OIII/SII line ratios)
- **Absorption model**: Beer-Lambert law: `transmittance *= exp(-density * stepSize * absorptionCoeff)`
- **Adaptive stepping**: fewer steps in empty regions (density < threshold), more near surfaces
- **Render target**: separate half-resolution framebuffer, composited with main scene via additive blend

### 11.2 Performance Budget

| Quality Tier | Max Steps | Resolution Scale | Max Active Nebulae | Frame Budget |
|---|---|---|---|---|
| High (desktop GPU) | 128 | 1.0x | 3 | 4ms |
| Medium (laptop) | 80 | 0.5x | 2 | 3ms |
| Low (mobile) | 48 | 0.25x | 1 | 2ms |

### 11.3 Volumetric LOD

- **L0 (close-up)**: Full raymarching, 128 steps, FBM 6 octaves
- **L1 (medium)**: Raymarching, 64 steps, FBM 4 octaves
- **L2 (far)**: Billboard with pre-rendered texture + bloom
- **L3 (very far)**: Point sprite with color tint
- **L4 (icon)**: Single pixel, catalog color

---

## 12. Persona-Adaptive UI Architecture (Added v2.0)

### 12.1 UI Mode State Machine

6 UI modes mapped to user personas (defined in Doc 04, Doc 20):

| Mode | Persona | UI Complexity | Default Panels | HUD Density |
|---|---|---|---|---|
| Explorer | Space Dreamer | Medium | Search, Info, MiniMap | Medium |
| Educator | Educator | High | Annotation, Tour Builder, Label System, Quiz | High |
| Creator | Content Creator | High | Camera Path Editor, Lighting, Export | Medium |
| Casual | Casual Explorer | Low | Tap-Info Card only, no HUD | Minimal |
| Observer | Amateur Astronomer | Medium-High | Catalog Search, Observation Planner, Coordinates | High |
| Research | Researcher | Highest | Data Import, Overlay Tools, Export, Raw Data Tables | Dense |

### 12.2 Mode Switching

- Stored in `AppState.uiMode: 'explorer' | 'educator' | 'creator' | 'casual' | 'observer' | 'research'`
- Default: `'explorer'` for new users
- Can be changed via Settings or onboarding flow
- Each mode lazy-loads only its required React component tree
- Shared components (Search, InfoPanel) adapt layout/density per mode

### 12.3 Conditional Component Loading

```
UIRoot
├── SharedLayer (always loaded)
│   ├── SearchBar (adapts: simple in Casual, advanced in Research)
│   ├── InfoPanel (adapts: card in Casual, full panel in Explorer/Observer)
│   └── NavigationControls
├── ModeLayer (lazy loaded per mode)
│   ├── EducatorTools (annotation, tours, labels)
│   ├── CreatorTools (camera paths, export)
│   ├── ObserverTools (catalog, planner)
│   └── ResearchTools (data import, overlays)
└── OverlayLayer
    ├── TooltipSystem
    └── ModalSystem
```

---

## 13. Navigation System Architecture (Added v2.0)

### 13.1 Seven Scale Levels

| Level | Name | Range (meters) | Coordinate Precision | Camera Near/Far |
|---|---|---|---|---|
| S0 | Surface | 1–10^4 | Float32 (mm precision) | 0.1m / 10km |
| S1 | Planetary | 10^4–10^10 | Float32 (meter precision) | 1km / 10^10m |
| S2 | Solar System | 10^10–10^14 | Float64 origin + Float32 offset | 10^6m / 10^14m |
| S3 | Interstellar | 10^14–10^18 | Float64 + sector grid | 10^10m / 10^18m |
| S4 | Galactic | 10^18–10^22 | Log-space | 10^14m / 10^22m |
| S5 | Intergalactic | 10^22–10^24 | Log-space | 10^18m / 10^24m |
| S6 | Cosmic | 10^24–10^27 | Log-space | 10^22m / 10^27m |

### 13.2 Six Navigation Methods

| Method | Input | Behavior |
|---|---|---|
| Free Flight | WASD/Arrow + Mouse | 6DOF camera, speed scales with current scale level |
| Click-to-Navigate | Click entity | Smooth camera flight to entity, auto-scale transition |
| Search | Text input | Find entity by name/type → fly to result |
| Scale Wheel | Dedicated UI control | Logarithmic zoom through scale levels with detent snapping |
| Guided Tours | Predefined sequences | Auto-pilot camera along authored keyframe paths with narration |
| Time Travel | Time slider | Animate orbital mechanics, stellar evolution, expansion |

### 13.3 Adaptive Camera Frustum

To prevent z-fighting across 40 orders of magnitude:
- Near/far planes dynamically set per scale level (see table above)
- At S2+: use "floating origin" — recenter world at camera position, offset all entities
- At S4+: switch to logarithmic depth buffer (`gl_FragDepth = log2(z) / log2(far)`)
- Transition zones: blend between coordinate systems over 2-second camera animation

---

## Document Metadata

**Version History:**
| Version | Date | Author | Changes |
|---|---|---|---|
| 0.1 | 2026-02-01 | Architecture Team | Initial draft. |
| 0.5 | 2026-03-15 | Architecture Team | Added performance metrics, ADRs. |
| 1.0 | 2026-04-16 | Architecture Team | Final review, ready for implementation. |
| 2.0 | 2026-04-16 | Architecture Team | Updated to align with Doc 22 v4.2 (96 entity types), Doc 18, Doc 19, Doc 20. Added Sections 10-13: Shader Management, Volumetric Rendering, Persona-Adaptive UI, Navigation System. |

**Related Documents:**
- `01-product-brief.md` — Product requirements and vision.
- `02-user-research.md` — User personas and use cases.
- `03-design-system.md` — UI/UX guidelines.
- `05-data-pipeline.md` — Detailed data processing pipeline.
- `06-deployment-guide.md` — Step-by-step deployment instructions.
- `07-api-reference.md` — REST API endpoints (if API server deployed).
- `08-performance-profiling.md` — Benchmarking procedures and baseline results.
- `10-threat-model.md` — Security threat analysis (future).
- `17-universe-entity-catalog.md` — 96 entity type definitions v2.0.
- `18-audio-design.md` — Extended audio synthesis guidelines.
- `19-rendering-benchmarks.md` — Performance profiling results.
- `20-persona-definitions.md` — Detailed user persona specifications.

**Contributors:**
- Dr. Sarah Chen (Lead Architect)
- James Park (GPU Specialist)
- Maya Singh (Data Engineer)
- Alex Rodriguez (Full-Stack Developer)

**Review Checklist:**
- [ ] Architecture aligns with product requirements.
- [ ] All critical paths identified.
- [ ] Performance budgets realistic.
- [ ] Security review complete.
- [ ] Scalability plan documented.
- [ ] Technology choices justified.
- [ ] Deployment pipeline clear.
- [ ] ADRs cover major decisions.

---

**End of Document**
