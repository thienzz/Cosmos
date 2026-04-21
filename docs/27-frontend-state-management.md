# Cosmos Explorer — Frontend State Management & App Architecture

**Document:** 27 — Frontend State Management & App Architecture  
**Version:** 1.0  
**Date:** 2026-04-19  
**Status:** Published  
**Product:** Cosmos Explorer — Interactive 3D Universe Visualization  
**Depends On:** Doc 09 (System Architecture), Doc 10 (Tech Specs), Doc 24 (AETHER V4 Design), Doc 26 (API Contract)  
**Consumed By:** Doc 28 (Developer Setup), Doc 30 (Test Cases)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Technology Decisions](#2-technology-decisions)
3. [Application Shell & Module Structure](#3-application-shell--module-structure)
4. [State Architecture](#4-state-architecture)
5. [Store Definitions](#5-store-definitions)
6. [Rendering–UI Synchronization](#6-renderingui-synchronization)
7. [Data Flow & API Integration](#7-data-flow--api-integration)
8. [Tile Streaming Pipeline](#8-tile-streaming-pipeline)
9. [Navigation & Scale State Machine](#9-navigation--scale-state-machine)
10. [Mode State Machine](#10-mode-state-machine)
11. [Event Bus](#11-event-bus)
12. [Web Worker Orchestration](#12-web-worker-orchestration)
13. [Persistence & Offline Strategy](#13-persistence--offline-strategy)
14. [Performance Budgets](#14-performance-budgets)
15. [Error Boundaries & Recovery](#15-error-boundaries--recovery)
16. [Testing Approach](#16-testing-approach)

---

## 1. Overview

Cosmos Explorer is a **client-heavy, GPU-accelerated** application where the browser handles rendering of 1.8 billion stars, physics computation, and audio synthesis. The frontend architecture must reconcile two fundamentally different update loops: the React UI at 60 Hz declarative renders and the Three.js render loop at 60 Hz imperative GPU frames.

This document defines how state flows between those two worlds, how data streams from the API through Web Workers into GPU buffers, and how user interactions propagate through the system.

**Key Architectural Constraints:**
- React 18.3+ with concurrent features (Suspense, transitions)
- Zustand 4.4+ as primary state manager (Doc 10 §2)
- Three.js r184 render loop runs outside React's reconciliation
- 4–8 Web Workers for data parsing, octree queries, physics
- IndexedDB (via Dexie.js 4.0+) for tile caching and persistence
- WebSocket connection for real-time tile priority and ephemeris push (Doc 26 §14)

---

## 2. Technology Decisions

### 2.1 Zustand over Redux

| Criterion | Zustand | Redux Toolkit |
|-----------|---------|---------------|
| Bundle size | ~1 KB | ~11 KB |
| Boilerplate | Minimal — function-based stores | Slices, reducers, actions, selectors |
| Three.js integration | Direct mutation in render loop via `getState()` | Dispatch overhead in hot path |
| DevTools | Redux DevTools compatible | Native |
| Middleware | Persist, immer, subscribeWithSelector | RTK Query, thunk, saga |
| Learning curve | Low | Moderate |

**Decision:** Zustand. The critical path is the render loop reading camera/selection state 60 times per second. Zustand's `getState()` is a direct object read with zero overhead — essential when the Three.js `requestAnimationFrame` callback cannot afford dispatch latency.

### 2.2 Jotai for Derived Atoms

Jotai 2.4+ is used alongside Zustand for **computed/derived values** that depend on multiple stores. Examples: the formatted distance string (depends on camera store + settings store + i18n store), the current LOD level (depends on camera distance + GPU tier + performance metrics).

### 2.3 React Three Fiber — Not Used

R3F was evaluated but rejected:
- Cosmos Explorer requires custom render pipeline (multi-pass, deferred shading, post-processing)
- Entity count (1.8B) far exceeds R3F's scene-graph model
- Custom LOD streaming, octree traversal, and GPU instancing need direct Three.js access
- R3F would add an abstraction layer with no benefit for this use case

The Three.js scene is mounted as a single `<canvas>` element managed by the Rendering Engine; React owns everything outside that canvas.

---

## 3. Application Shell & Module Structure

### 3.1 Module Map

```
src/
├── app/                        # Application shell
│   ├── App.tsx                 # Root component, providers, error boundary
│   ├── AppProviders.tsx        # Zustand, Jotai, i18n, theme providers
│   └── routes.tsx              # Client-side routing (optional, mostly single-page)
│
├── stores/                     # Zustand stores (§5)
│   ├── cameraStore.ts
│   ├── selectionStore.ts
│   ├── timeStore.ts
│   ├── modeStore.ts
│   ├── searchStore.ts
│   ├── settingsStore.ts
│   ├── tileStore.ts
│   ├── uiStore.ts
│   └── index.ts               # Re-exports
│
├── atoms/                      # Jotai derived atoms (§2.2)
│   ├── scaleAtoms.ts
│   ├── performanceAtoms.ts
│   └── displayAtoms.ts
│
├── engine/                     # Three.js rendering engine
│   ├── Engine.ts               # Main render loop, scene setup
│   ├── CameraController.ts     # Multi-scale camera with logarithmic depth
│   ├── SceneGraph.ts           # LOD scene management
│   ├── ShaderManager.ts        # Shader compilation, variant selection
│   ├── PostProcessing.ts       # Bloom, CRT scanlines, chromatic aberration
│   └── passes/                 # Individual render passes
│       ├── StarFieldPass.ts
│       ├── NebulaePass.ts
│       ├── GalaxyPass.ts
│       ├── SolarSystemPass.ts
│       ├── CosmicWebPass.ts
│       └── UIOverlayPass.ts
│
├── workers/                    # Web Worker pool (§12)
│   ├── WorkerPool.ts           # Pool manager with task queue
│   ├── tileParser.worker.ts    # Binary tile decoding
│   ├── octreeQuery.worker.ts   # Frustum culling, LOD selection
│   ├── physicsEngine.worker.ts # Kepler solver, N-body approximation
│   └── dataTransform.worker.ts # FITS parsing, coordinate transforms
│
├── api/                        # API client layer (§7)
│   ├── client.ts               # Configured fetch wrapper
│   ├── websocket.ts            # WebSocket manager
│   ├── entities.ts             # Entity endpoint functions
│   ├── search.ts               # Search endpoint functions
│   ├── tiles.ts                # Tile endpoint functions
│   ├── ephemeris.ts            # Ephemeris endpoint functions
│   └── types.ts                # Generated from OpenAPI spec (Doc 26)
│
├── ui/                         # React UI components (AETHER V4)
│   ├── panels/                 # Side panels, info panels
│   ├── controls/               # Navigation controls, time slider
│   ├── hud/                    # HUD overlays, crosshair, scale bar
│   ├── search/                 # Search bar, autocomplete
│   ├── modals/                 # Settings, FITS import, export
│   └── shared/                 # Buttons, tooltips, terminal chrome
│
├── hooks/                      # Custom React hooks
│   ├── useEntity.ts            # Fetch + cache entity data
│   ├── useSearch.ts            # Debounced search with autocomplete
│   ├── useTileStream.ts        # Subscribe to tile loading state
│   ├── useEphemeris.ts         # Subscribe to ephemeris updates
│   ├── usePerformance.ts       # FPS, memory, GPU metrics
│   └── useKeyboard.ts          # Keyboard shortcut bindings
│
├── services/                   # Cross-cutting services
│   ├── AudioEngine.ts          # Web Audio API, Tone.js
│   ├── PersistenceService.ts   # IndexedDB via Dexie.js
│   ├── AnalyticsService.ts     # Usage tracking (privacy-respecting)
│   └── ErrorReporter.ts        # Error aggregation, Sentry integration
│
└── utils/                      # Pure utility functions
    ├── coordinates.ts           # RA/Dec ↔ Cartesian, galactic transforms
    ├── scales.ts                # Logarithmic scale conversions
    ├── colors.ts                # Spectral type → RGB, color temperature
    └── format.ts                # Number formatting, distance strings
```

### 3.2 Dependency Flow

```
UI Components ──→ Hooks ──→ Stores (Zustand) ──→ API Client
                                ↕                     ↕
                          Engine (Three.js)      WebSocket
                                ↕
                          Worker Pool ──→ Tile Cache (IndexedDB)
```

Rules:
- `ui/` imports from `hooks/`, `stores/`, `atoms/` — never from `engine/` directly
- `engine/` reads from `stores/` via `getState()` — never calls React hooks
- `workers/` communicate via `postMessage` only — no shared memory (except SharedArrayBuffer for tile data when available)
- `api/` is pure functions with no side effects — stores call api functions, not the reverse

---

## 4. State Architecture

### 4.1 State Categories

State is divided into four categories by update frequency and consumer:

| Category | Update Frequency | Primary Consumer | Storage |
|----------|-----------------|------------------|---------|
| **Hot** | Every frame (16.7ms) | Rendering engine | Zustand `getState()` direct read |
| **Warm** | On user interaction (~100ms) | React UI + engine | Zustand with React subscriptions |
| **Cool** | On navigation/mode change | React UI | Zustand with React subscriptions |
| **Cold** | On app load / settings change | React UI, persisted | Zustand persist → IndexedDB |

### 4.2 Hot State — Render Loop

These values are read every frame by `Engine.ts` and must have zero-overhead access:

- Camera position (Vec3), rotation (Quaternion), FOV
- Current simulation epoch (Julian Date)
- Active LOD levels per tile
- GPU buffer references (typed arrays)
- Animation time accumulators

**Access pattern:** `cameraStore.getState().position` — synchronous, no subscription overhead.

**Write pattern:** The render loop writes camera state directly via `cameraStore.setState()`. React UI subscribes to camera state via `useStore(cameraStore, selector)` with a 100ms throttle to avoid re-render storms.

### 4.3 Warm State — Interactive

Updated on click, search, panel open/close:

- Selected entity ID and data
- Search query and results
- Panel visibility (info panel, settings, etc.)
- Time slider position (when scrubbing)
- Hover target

### 4.4 Cool State — Navigation

Updated when user changes mode, enters/exits a journey, or navigates scale:

- Active mode (Exploration, Observation, Education, Guided Tour, Research)
- Current journey step
- Scale regime (Solar System, Stellar, Galactic, Cosmic)
- Entity detail expansion state

### 4.5 Cold State — Persisted

Loaded from IndexedDB on startup, saved on change:

- User preferences (language, units, quality preset)
- Bookmarks and observations
- Session token
- Accessibility settings
- Audio volume and mute state
- Recent searches

---

## 5. Store Definitions

### 5.1 Camera Store

```typescript
interface CameraState {
  // Position in ICRS Cartesian (parsecs for stellar, AU for solar system)
  position: Vec3;
  // Quaternion rotation
  rotation: Quaternion;
  // Field of view (degrees)
  fov: number;
  // Current distance to focal target (parsecs)
  targetDistance: number;
  // Focal target entity ID (null if free-flying)
  targetEntityId: number | null;
  // Scale regime derived from camera position
  scaleRegime: 'solar_system' | 'stellar' | 'galactic' | 'cosmic';
  // Velocity for smooth transitions (parsecs/second in world time)
  velocity: Vec3;
  // Whether camera is in animated transition
  isTransitioning: boolean;

  // Actions
  setPosition: (pos: Vec3) => void;
  setRotation: (rot: Quaternion) => void;
  flyTo: (target: Vec3, duration: number) => void;
  orbitAround: (entityId: number, radius: number) => void;
  resetToDefault: () => void;
}
```

### 5.2 Selection Store

```typescript
interface SelectionState {
  // Currently selected entity
  selectedEntityId: number | null;
  selectedEntity: EntityData | null;
  // Loading state for entity detail fetch
  isLoadingEntity: boolean;
  // Hover preview (lightweight, not full fetch)
  hoveredEntityId: number | null;
  hoveredEntityPreview: EntityPreview | null;
  // Selection history for back/forward navigation
  history: number[];
  historyIndex: number;

  // Actions
  selectEntity: (id: number) => Promise<void>;
  clearSelection: () => void;
  setHover: (id: number | null, preview?: EntityPreview) => void;
  goBack: () => void;
  goForward: () => void;
}
```

### 5.3 Time Store

```typescript
interface TimeState {
  // Current simulation epoch (Julian Date)
  epochJD: number;
  // Playback state
  isPlaying: boolean;
  playbackSpeed: number;  // 1.0 = real-time, 365.25 = 1 year/second
  // Time range bounds (from SPICE kernels)
  minEpochJD: number;     // 2287184.5 (1550 CE)
  maxEpochJD: number;     // 2688976.5 (2650 CE)
  // Current display format
  displayFormat: 'gregorian' | 'julian_date' | 'mjd';

  // Actions
  setEpoch: (jd: number) => void;
  play: () => void;
  pause: () => void;
  setSpeed: (speed: number) => void;
  stepForward: (days: number) => void;
  stepBackward: (days: number) => void;
  goToNow: () => void;
}
```

### 5.4 Mode Store

```typescript
type AppMode = 'exploration' | 'observation' | 'education' | 'guided_tour' | 'research';

interface ModeState {
  // Active application mode (maps to Doc 24 §4 modes)
  activeMode: AppMode;
  // Guided tour state (if in guided_tour mode)
  tourId: string | null;
  tourStep: number;
  tourTotalSteps: number;
  // Education mode state
  educationTopic: string | null;
  // Research mode state
  researchDatasetId: string | null;

  // Actions
  setMode: (mode: AppMode) => void;
  startTour: (tourId: string) => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  exitTour: () => void;
}
```

### 5.5 Search Store

```typescript
interface SearchState {
  query: string;
  results: SearchResult[];
  autocomplete: AutocompleteSuggestion[];
  isSearching: boolean;
  filters: {
    category: number | null;
    magnitudeMax: number | null;
    distanceMaxPc: number | null;
  };
  totalResults: number;
  pagination: { offset: number; limit: number; hasMore: boolean };

  // Actions
  setQuery: (q: string) => void;
  search: () => Promise<void>;
  fetchAutocomplete: () => Promise<void>;
  setFilter: (key: string, value: any) => void;
  loadMore: () => Promise<void>;
  clear: () => void;
}
```

### 5.6 Tile Store

```typescript
interface TileState {
  // Loaded tile registry: tileAddress → LoadState
  loadedTiles: Map<string, TileLoadState>;
  // Currently loading tiles
  pendingTiles: Set<string>;
  // Tile manifest (fetched once at startup)
  manifest: TileManifest | null;
  manifestVersion: string | null;
  // Memory usage tracking
  gpuMemoryUsedBytes: number;
  gpuMemoryBudgetBytes: number;
  // Tile cache statistics
  cacheHitRate: number;
  tilesInMemory: number;
  tilesOnDisk: number;

  // Actions
  setManifest: (manifest: TileManifest) => void;
  markTileLoading: (address: string) => void;
  markTileLoaded: (address: string, data: ArrayBuffer) => void;
  markTileFailed: (address: string, error: string) => void;
  evictTile: (address: string) => void;
  evictLRU: (targetBytes: number) => void;
}

type TileLoadState = 
  | { status: 'pending' }
  | { status: 'loading'; startedAt: number }
  | { status: 'loaded'; buffer: ArrayBuffer; loadedAt: number; lastAccessedAt: number; sizeBytes: number }
  | { status: 'failed'; error: string; failedAt: number; retryCount: number };
```

### 5.7 Settings Store (Persisted)

```typescript
interface SettingsState {
  // Display
  language: string;           // ISO 639-1
  units: 'metric' | 'imperial' | 'astronomical';
  distanceUnit: 'ly' | 'pc' | 'au' | 'km';
  coordinateFormat: 'decimal' | 'hms_dms';
  // Graphics
  qualityPreset: 'low' | 'medium' | 'high' | 'ultra' | 'auto';
  gpuTier: 'low' | 'mid' | 'high';  // Auto-detected, overridable
  bloomIntensity: number;     // 0–1
  crtScanlines: boolean;      // AETHER V4 CRT effect
  phosphorGlow: boolean;      // AETHER V4 phosphor effect
  starPointSize: number;      // Multiplier 0.5–2.0
  // Audio
  masterVolume: number;       // 0–1
  isMuted: boolean;
  ambienceVolume: number;     // 0–1
  effectsVolume: number;      // 0–1
  // Accessibility
  reducedMotion: boolean;
  highContrast: boolean;
  screenReaderMode: boolean;
  // Session
  sessionToken: string;
  recentSearches: string[];

  // Actions
  setSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void;
  resetToDefaults: () => void;
  importSettings: (json: string) => void;
  exportSettings: () => string;
}
```

### 5.8 UI Store

```typescript
interface UIState {
  // Panel visibility
  infoPanelOpen: boolean;
  searchPanelOpen: boolean;
  settingsPanelOpen: boolean;
  timelinePanelOpen: boolean;
  miniMapVisible: boolean;
  // Modal state
  activeModal: string | null;   // 'fits_import' | 'export' | 'share' | null
  // Sidebar width (resizable)
  sidebarWidth: number;
  // Loading indicators
  globalLoading: boolean;
  loadingMessage: string | null;
  // Notifications / toasts
  notifications: Notification[];
  // HUD toggles
  showGrid: boolean;
  showConstellationLines: boolean;
  showLabels: boolean;
  showOrbitalPaths: boolean;
  showScaleBar: boolean;

  // Actions
  togglePanel: (panel: string) => void;
  openModal: (modal: string) => void;
  closeModal: () => void;
  addNotification: (n: Notification) => void;
  dismissNotification: (id: string) => void;
  toggleHUD: (element: string) => void;
}
```

---

## 6. Rendering–UI Synchronization

### 6.1 The Two-Loop Problem

React and Three.js each run their own update loops:

```
React:    setState → reconcile → commit → paint (variable, ~16ms batched)
Three.js: rAF → update → render → swap (locked at 16.7ms / 60fps)
```

These loops are **decoupled**. The render loop reads state synchronously via `getState()` and never triggers React re-renders. React subscribes to state changes with throttled selectors.

### 6.2 State Flow Diagram

```
┌──────────────────────────────────────────────────┐
│                   User Input                       │
│  (click, key, scroll, touch, search, slider)      │
└───────────────────────┬──────────────────────────┘
                        │
            ┌───────────┴───────────┐
            ▼                       ▼
    ┌──────────────┐       ┌──────────────┐
    │  React Event │       │  Canvas Event │
    │  Handler     │       │  (pointer,    │
    │              │       │   wheel)      │
    └──────┬───────┘       └──────┬───────┘
           │                      │
           ▼                      ▼
    ┌──────────────┐       ┌──────────────┐
    │  Zustand     │       │  Engine      │
    │  setState()  │◄─────►│  direct      │
    │              │       │  getState()  │
    └──────┬───────┘       └──────┬───────┘
           │                      │
    ┌──────┴───────┐       ┌──────┴───────┐
    │  React       │       │  Three.js    │
    │  re-render   │       │  render loop │
    │  (throttled) │       │  (60fps)     │
    └──────────────┘       └──────────────┘
```

### 6.3 Throttled Subscriptions

React components subscribe to hot state with a 100ms throttle to prevent re-render floods:

```typescript
// In a React component
const cameraPosition = useCameraStore(
  (state) => state.position,
  // Custom equality: only re-render if position moved > 0.01 pc
  (a, b) => vec3Distance(a, b) < 0.01
);
```

For the info panel's "current coordinates" display, a 200ms debounce is used instead — the text doesn't need 60fps updates.

### 6.4 Engine → Store Writes

The render loop writes camera state on every frame:

```typescript
// Inside Engine.ts rAF callback
function animate() {
  requestAnimationFrame(animate);

  // Update camera from controls
  controls.update(delta);

  // Write to store (synchronous, no dispatch)
  cameraStore.setState({
    position: camera.position.clone(),
    rotation: camera.quaternion.clone(),
    fov: camera.fov,
  });

  // Read selection state for highlight rendering
  const { selectedEntityId } = selectionStore.getState();

  // Render
  renderer.render(scene, camera);
}
```

---

## 7. Data Flow & API Integration

### 7.1 API Client Architecture

The API client is a thin wrapper around `fetch` with built-in retry, rate-limit handling, and type safety (generated from Doc 26 OpenAPI spec):

```typescript
// api/client.ts
class CosmosApiClient {
  private baseUrl = 'https://api.cosmosexplorer.app/v1';
  private apiKey: string | null = null;

  async get<T>(path: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const url = new URL(path, this.baseUrl);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));

    const response = await fetch(url.toString(), {
      headers: this.buildHeaders(),
    });

    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '5');
      await sleep(retryAfter * 1000);
      return this.get<T>(path, params);  // Single retry
    }

    if (!response.ok) throw new ApiError(await response.json());
    return response.json();
  }
}
```

### 7.2 Data Fetching Strategy

| Data Type | Strategy | Cache | Invalidation |
|-----------|----------|-------|-------------|
| Entity detail | Fetch on select, cache in memory | LRU 500 entries | On data version change |
| Search results | Fetch on query, no cache | — | — |
| Autocomplete | Fetch on keystroke (debounced 150ms) | LRU 100 queries | On data version change |
| Tile manifest | Fetch once at startup | IndexedDB | On `data_version_update` WS event |
| Tile binary data | Fetch on viewport demand | IndexedDB + GPU memory | LRU eviction |
| Ephemeris | Fetch on time change | Redis-backed server cache | Deterministic (never invalidated) |
| Solar system bodies | Fetch once at startup | Memory | On data version change |
| Bookmarks | Fetch on panel open | Memory | On write |

### 7.3 WebSocket Integration

The WebSocket connection (Doc 26 §14) is managed by `api/websocket.ts`:

```typescript
class CosmosWebSocket {
  private ws: WebSocket;
  private reconnectAttempts = 0;

  connect(sessionToken: string) {
    this.ws = new WebSocket(`wss://api.cosmosexplorer.app/v1/ws?session=${sessionToken}`);

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case 'tile_priority':
          tileStore.getState().updatePriorities(msg.tiles);
          break;
        case 'ephemeris_push':
          timeStore.getState().updateEphemeris(msg.epoch_jd, msg.bodies);
          break;
        case 'data_version_update':
          tileStore.getState().invalidateManifest(msg.new_version);
          break;
        case 'export_progress':
          uiStore.getState().updateExportProgress(msg);
          break;
      }
    };

    // Heartbeat every 30s
    setInterval(() => this.ws.send(JSON.stringify({ type: 'ping' })), 30000);
  }

  sendViewportUpdate(frustum: Frustum) {
    this.ws.send(JSON.stringify({ type: 'viewport_update', frustum }));
  }

  sendTimeUpdate(epochJD: number, speed: number, bodies: number[]) {
    this.ws.send(JSON.stringify({
      type: 'time_update',
      epoch_jd: epochJD,
      playback_speed: speed,
      bodies_requested: bodies
    }));
  }
}
```

---

## 8. Tile Streaming Pipeline

### 8.1 Pipeline Stages

```
Camera Update → Frustum Cull → LOD Select → Priority Queue → Fetch → Decode → GPU Upload
     │              │              │              │            │        │          │
  Engine.ts    octreeQuery     tileStore      TileLoader   fetch()  Worker   Renderer
              .worker.ts                                           Pool
```

### 8.2 Frustum Culling (Web Worker)

On every camera update (throttled to 10 Hz for the server, per-frame for local culling):

1. **Engine** sends frustum parameters to `octreeQuery.worker.ts`
2. Worker traverses the octree index (loaded from tile manifest)
3. Worker returns a list of visible tile addresses with priority scores
4. Scores based on: screen-space size, angular distance from center, current LOD gap

### 8.3 Priority Queue

The tile store maintains a priority queue sorted by score:

```typescript
interface TilePriority {
  address: string;
  priority: number;   // 0–1, higher = more urgent
  estimatedSize: number;
  inCache: boolean;   // true if in IndexedDB
}
```

The loader processes tiles in priority order, with max 6 concurrent fetches (browser connection limit per origin).

### 8.4 Decode Pipeline

Binary tile data is decoded in a Web Worker to avoid blocking the main thread:

1. `fetch()` returns `ArrayBuffer`
2. `tileParser.worker.ts` decodes header + records per Doc 11 §4 format
3. Worker returns typed arrays ready for GPU upload
4. Main thread calls `bufferGeometry.setAttribute()` to upload to VRAM

### 8.5 Memory Management

| Resource | Budget (Mid-Tier GPU) | Eviction |
|----------|----------------------|----------|
| GPU VRAM (tile buffers) | 192 MB | LRU by `lastAccessedAt` |
| RAM (decoded tiles) | 256 MB | LRU, also purged on visibility loss |
| IndexedDB (raw tiles) | 500 MB | LRU with 7-day TTL |

When GPU memory exceeds 90% of budget, the tile store triggers `evictLRU()` to free the least-recently-viewed tiles.

---

## 9. Navigation & Scale State Machine

### 9.1 Scale Regimes

The camera operates in four scale regimes (Doc 19). The state machine governs transitions between them:

```
┌─────────────┐  zoom out   ┌──────────┐  zoom out   ┌───────────┐  zoom out   ┌─────────┐
│ Solar System│ ──────────→ │ Stellar  │ ──────────→ │ Galactic  │ ──────────→ │ Cosmic  │
│ (AU)        │ ←────────── │ (pc)     │ ←────────── │ (kpc/Mpc) │ ←────────── │ (Gpc)   │
└─────────────┘  zoom in    └──────────┘  zoom in    └───────────┘  zoom in    └─────────┘
```

### 9.2 Transition Thresholds

| From | To | Distance Threshold | Hysteresis |
|------|----|--------------------|------------|
| Solar System → Stellar | Camera > 500 AU from Sun | 100 AU band |
| Stellar → Galactic | Camera > 1 kpc from Sun | 200 pc band |
| Galactic → Cosmic | Camera > 1 Mpc from Milky Way center | 0.2 Mpc band |

Hysteresis prevents flickering at boundaries. The camera must cross the threshold + hysteresis band before the regime changes back.

### 9.3 Regime-Specific Behavior

| Regime | Unit System | Visible Entities | Tile Source | Background |
|--------|-------------|-------------------|-------------|------------|
| Solar System | AU, km | Planets, moons, asteroids, comets | N/A (discrete objects) | Star field skybox |
| Stellar | pc, ly | Individual stars, nebulae, clusters | Star octree tiles | Dark, no galaxies |
| Galactic | kpc, Mpc | Star clusters fade → galaxy points | Galaxy HEALPix tiles | Cosmic web faint |
| Cosmic | Mpc, Gpc | Galaxy clusters, cosmic web filaments | Cosmic web sectors | CMB limit at horizon |

---

## 10. Mode State Machine

### 10.1 Mode Definitions

Five application modes per Doc 24 §4:

```
                         ┌───────────────┐
                    ┌───→│  Exploration   │←───┐
                    │    └───────┬───────┘    │
                    │            │            │
            ┌───────┴──────┐    │    ┌───────┴──────┐
            │  Observation │    │    │   Research    │
            └───────┬──────┘    │    └───────┬──────┘
                    │            │            │
                    │    ┌───────┴───────┐    │
                    └───→│   Education   │←───┘
                         └───────┬───────┘
                                 │
                         ┌───────┴───────┐
                         │  Guided Tour  │
                         └───────────────┘
```

All modes can transition to any other mode. Guided Tour can only be entered from Education or Exploration.

### 10.2 Mode Effects on State

| Mode | Time Slider | Search | Entity Toggles | FITS Import | Camera Lock |
|------|------------|--------|----------------|-------------|-------------|
| Exploration | Enabled | Full | All available | No | Free |
| Observation | Enabled | Filtered to visible | Physical only | No | Orbit target |
| Education | Read-only preset | Simplified | Curated subset | No | Guided |
| Guided Tour | Disabled | Disabled | Disabled | No | Scripted path |
| Research | Enabled | Advanced + filters | All + data overlays | Yes | Free |

---

## 11. Event Bus

### 11.1 Purpose

The event bus handles **cross-cutting communication** between modules that don't have a direct dependency:

- Engine → UI: "Entity clicked at screen position (x, y)"
- Worker → Engine: "Tile decoded, buffer ready for upload"
- API → Engine: "Data version changed, invalidate tiles"
- Audio → Engine: "Beat event for audio-reactive visuals"

### 11.2 Implementation

```typescript
type EventMap = {
  'entity:clicked': { entityId: number; screenX: number; screenY: number };
  'entity:hovered': { entityId: number | null };
  'tile:decoded': { address: string; buffer: ArrayBuffer };
  'tile:evicted': { address: string };
  'camera:regime-changed': { from: ScaleRegime; to: ScaleRegime };
  'time:epoch-changed': { epochJD: number };
  'mode:changed': { from: AppMode; to: AppMode };
  'data:version-updated': { oldVersion: string; newVersion: string };
  'export:progress': { jobId: string; percent: number };
  'error:gpu': { message: string; shader?: string };
  'error:network': { url: string; status: number };
  'performance:fps-drop': { currentFPS: number; targetFPS: number };
};

class EventBus {
  private listeners = new Map<string, Set<Function>>();

  on<K extends keyof EventMap>(event: K, handler: (data: EventMap[K]) => void): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(handler);
    return () => this.listeners.get(event)!.delete(handler);
  }

  emit<K extends keyof EventMap>(event: K, data: EventMap[K]) {
    this.listeners.get(event)?.forEach(handler => handler(data));
  }
}

export const eventBus = new EventBus();
```

### 11.3 Usage Rules

- Events are fire-and-forget — no return values, no promises
- Event handlers must not throw — wrap in try/catch
- Use events for notifications, not for data fetching (use stores/API for that)
- Maximum 50 event types — if growing beyond that, reconsider architecture

---

## 12. Web Worker Orchestration

### 12.1 Worker Pool

```typescript
class WorkerPool {
  private workers: Worker[];
  private taskQueue: Task[];
  private busyWorkers: Set<number>;
  private workerCount: number;

  constructor(workerCount: number = navigator.hardwareConcurrency || 4) {
    this.workerCount = Math.min(workerCount, 8);  // Cap at 8
    this.workers = Array.from({ length: this.workerCount }, (_, i) =>
      new Worker(new URL('./genericWorker.ts', import.meta.url), { type: 'module' })
    );
  }

  async dispatch<T>(taskType: string, data: Transferable[], transfer: Transferable[] = []): Promise<T> {
    const workerIndex = await this.acquireWorker();
    return new Promise((resolve, reject) => {
      this.workers[workerIndex].onmessage = (e) => {
        this.releaseWorker(workerIndex);
        if (e.data.error) reject(new Error(e.data.error));
        else resolve(e.data.result);
      };
      this.workers[workerIndex].postMessage({ type: taskType, data }, transfer);
    });
  }
}
```

### 12.2 Worker Task Types

| Worker | Task | Input | Output | Frequency |
|--------|------|-------|--------|-----------|
| `tileParser` | Decode binary tile | `ArrayBuffer` | `{ header, records: Float32Array }` | Per tile load (~10/s) |
| `octreeQuery` | Frustum culling | Frustum params + octree index | `TilePriority[]` | 10 Hz (throttled) |
| `physicsEngine` | Kepler solve | Orbital elements + epoch | `Vec3[]` positions | Per time step |
| `physicsEngine` | N-body approximate | Body masses + positions | Perturbed `Vec3[]` | Per time step |
| `dataTransform` | FITS parse | `ArrayBuffer` (FITS file) | Column metadata + preview | On upload |
| `dataTransform` | Coordinate transform | RA/Dec array | Cartesian Vec3 array | On dataset import |

### 12.3 SharedArrayBuffer (When Available)

For browsers supporting `SharedArrayBuffer` (requires `Cross-Origin-Isolation` headers):

- Tile data decoded in workers is written directly to shared buffers
- Main thread reads from same buffer — zero-copy transfer to GPU
- Reduces memory pressure by ~40% for tile data

Fallback: `Transferable` ArrayBuffers (ownership transfer, not shared).

---

## 13. Persistence & Offline Strategy

### 13.1 IndexedDB Schema (Dexie.js)

```typescript
const db = new Dexie('CosmosExplorer');
db.version(1).stores({
  tiles: 'address, loadedAt, lastAccessedAt, sizeBytes, version',
  entities: 'id, ent_id, name, category',
  bookmarks: 'id, sessionToken, entityId, createdAt',
  observations: 'id, sessionToken, entityId, createdAt',
  settings: 'key',
  manifest: 'version',
});
```

### 13.2 Cache Hierarchy

```
Request → GPU VRAM (fastest, ~192 MB)
       → RAM LRU cache (fast, ~256 MB)
       → IndexedDB (medium, ~500 MB)
       → Network fetch (slow, unlimited)
```

### 13.3 Offline Capability

Cosmos Explorer is not a full offline app, but provides graceful degradation:

- **Service Worker** caches: app shell, shaders, UI assets (~10 MB)
- **IndexedDB** caches: recently viewed tiles, entity data, manifest
- **Offline banner**: shown when network is unavailable; cached tiles still render
- **Queue**: bookmarks and observations created offline are synced when connection restores

---

## 14. Performance Budgets

### 14.1 Startup Performance

| Metric | Budget | Measurement |
|--------|--------|-------------|
| First Contentful Paint (FCP) | <1.5s | Lighthouse CI |
| Largest Contentful Paint (LCP) | <2.5s | Lighthouse CI |
| Time to Interactive (TTI) | <3.5s | Lighthouse CI |
| First star field render | <4.0s | Custom metric: first tile painted |
| Total JS bundle (gzipped) | <500 KB | Vite build output |
| Initial data fetch (manifest) | <2.0s | Network timing |

### 14.2 Runtime Performance

| Metric | Budget | Action if Exceeded |
|--------|--------|--------------------|
| Frame rate | ≥55 FPS (mid-tier) | Reduce LOD, disable post-processing |
| Frame time P99 | <20ms | Profile, optimize hot path |
| Main thread long tasks | <50ms each | Move to Web Worker |
| Memory (JS heap) | <512 MB | Evict tile cache, reduce history |
| GPU memory | <budget per tier | LRU eviction |
| WebSocket latency | <100ms RTT | Reconnect, increase heartbeat |

### 14.3 Adaptive Quality

The performance monitor (`usePerformance` hook) tracks rolling FPS and triggers quality adjustments:

| FPS Range | Action |
|-----------|--------|
| ≥55 | No change |
| 45–54 | Reduce bloom quality, disable CRT scanlines |
| 35–44 | Reduce tile LOD by 1 level, disable phosphor glow |
| 25–34 | Disable all post-processing, reduce star point count |
| <25 | Emergency: skip render frames, show quality warning |

---

## 15. Error Boundaries & Recovery

### 15.1 React Error Boundaries

```
<AppErrorBoundary>           ← Catches fatal React errors, shows full-page fallback
  <EngineErrorBoundary>      ← Catches WebGL context loss, offers reload
    <canvas />
  </EngineErrorBoundary>
  <PanelErrorBoundary>       ← Catches panel render errors, collapses panel
    <InfoPanel />
    <SearchPanel />
  </PanelErrorBoundary>
</AppErrorBoundary>
```

### 15.2 WebGL Context Loss

WebGL context can be lost due to GPU driver issues or resource exhaustion:

1. `webglcontextlost` event fires on canvas
2. Engine pauses render loop
3. UI shows "Restoring 3D view…" overlay
4. On `webglcontextrestored`, engine reinitializes shaders and re-uploads visible tile buffers
5. If context not restored within 10s, offer full page reload

### 15.3 Network Error Recovery

| Error | Recovery |
|-------|----------|
| API 5xx | Exponential backoff (1s, 2s, 4s), max 3 retries |
| API 429 | Wait `retry_after_seconds` from response |
| WebSocket disconnect | Reconnect with exponential backoff, resend viewport |
| Tile fetch failed | Retry once, then mark tile as failed (render lower LOD) |
| Manifest fetch failed | Use cached manifest from IndexedDB |

### 15.4 State Corruption Recovery

If a store enters an inconsistent state (detected by invariant checks):

1. Log the corruption event to `ErrorReporter`
2. Reset the affected store to defaults via `resetToDefaults()`
3. Show toast notification: "Something went wrong. View has been reset."
4. If camera store is corrupted, fly to default position (Sun at 50 AU)

---

## 16. Testing Approach

### 16.1 Store Tests (Vitest)

Each Zustand store has unit tests covering:
- Initial state correctness
- Action side effects
- Selector derivations
- Edge cases (empty selections, boundary values)
- Persistence round-trip (serialize → deserialize)

### 16.2 Integration Tests

- API client → mock server → store update → UI re-render
- WebSocket message → store update → engine state change
- Worker message → tile store update → GPU buffer upload (mocked)

### 16.3 Render Loop Tests

- Camera state written at 60fps does not cause React re-render flood
- Throttled subscriptions update at correct intervals
- Entity selection triggers correct API fetch and panel update

### 16.4 E2E Tests (Playwright)

- Search → select entity → info panel displays correct data
- Time slider → ephemeris positions update → planets move visually
- Mode switch → correct UI elements show/hide
- Bookmark create → persist → reload → bookmark present

---

**Revision History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-19 | System | Initial frontend state management specification |

---

*Document 27 of 33 — Cosmos Explorer Technical Documentation Suite*  
*Cross-references: Doc 09 (System Architecture), Doc 10 (Tech Specs), Doc 24 (AETHER V4 Design), Doc 26 (API Contract)*
