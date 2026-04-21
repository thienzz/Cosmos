# Performance & Optimization Strategy
## Cosmos Explorer — Interactive 3D Universe Visualization

**Version:** 1.0  
**Date:** 2026-04-16  
**Status:** Active  
**Technology:** Three.js / WebGL 2.0  

---

## Executive Summary

Cosmos Explorer is a real-time 3D web visualization rendering hundreds of thousands of celestial objects across multiple zoom scales. This document establishes performance budgets, optimization strategies, and monitoring frameworks to maintain 60 FPS rendering while managing GPU memory, data bandwidth, and CPU overhead across diverse device tiers.

---

## 1. Performance Budget

Performance budgets define hard constraints for each metric, measured across the device tier matrix.

### 1.1 Frame Rendering

| Metric | Target | Minimum | Notes |
|--------|--------|---------|-------|
| Frame Time | 16.7ms @ 60 FPS | 33.3ms @ 30 FPS | Includes CPU + GPU time |
| Latency (input to render) | <50ms | <100ms | Camera movement responsiveness |
| Jank (frame >50ms) | <5% of frames | <15% of frames | Detected via requestAnimationFrame delta |

**Monitoring:** Continuous FPS telemetry in development; sample-based RUM (1% of users, privacy-first) in production.

### 1.2 Load Time

| Phase | Target | Threshold | User Action |
|-------|--------|-----------|-------------|
| First Contentful Paint (FCP) | <1.5s | <2s | Initial 3D canvas visible |
| Time to Interactive (TTI) | <2.5s | <3.5s | Core controls responsive |
| Core Load (Solar System) | <3s | <4s | Zoom level 0–3 interactive |
| Full Load (500 light-years) | <8s | <12s | Background; user can interact |

**Metric Definitions:**
- **FCP:** Moment when 3D canvas first renders (Babylon.js ready, first frame drawn)
- **TTI:** Camera controls, zoom, search fully functional
- **Core Load:** Solar System (Sun, planets, major moons) with orbital mechanics
- **Full Load:** Extended star catalog and near-galaxy data loaded

### 1.3 Bundle Size

| Asset Type | Gzipped | Brotli | Device Target |
|------------|---------|--------|---------------|
| JavaScript (app + Three.js) | <2MB | <1.5MB | All tiers |
| WebWorker bundles | <500KB | <350KB | Included in app |
| Initial data (Solar System) | <5MB | <3MB | All tiers (progressive) |
| Textures (at load) | <20MB | <15MB | Tier 1+2 (optional) |

**Strategy:** Code-split by feature; lazy-load extended astronomy data; use WebAssembly for physics compute on supported devices.

### 1.4 Memory Constraints

| Device Tier | Budget | Peak Allocation | Notes |
|-------------|--------|-----------------|-------|
| High (Tier 1) | 512MB | 450MB | Desktop GPU; 16GB+ RAM |
| Mid (Tier 2) | 256MB | 220MB | Laptop/tablet; 8GB RAM |
| Low (Tier 3) | 128MB | 110MB | Mobile; 4GB RAM or less |

**Includes:** GPU memory, JavaScript heap, texture cache, geometry buffers. Excludes browser overhead, extensions.

### 1.5 GPU Draw Calls & Geometry

| Metric | Target | Tier 1 | Tier 2 | Tier 3 |
|--------|--------|--------|--------|--------|
| Draw calls/frame | <500 | <300 | <200 | <100 |
| Vertices/frame | <2M | <1.5M | <500K | <100K |
| Textures in VRAM | <100MB | <50MB | <20MB | <10MB |

**Optimization:** Instanced rendering reduces draw calls logarithmically; LOD system reduces vertex count by 10–50× at distance.

---

## 2. Device Tier Strategy

Cosmos Explorer detects device capabilities and applies tier-appropriate settings automatically, with user override via quality slider.

### 2.1 Tier Classifications

#### **Tier 1: High-End (Desktop/Workstation)**
- **GPU:** Dedicated NVIDIA/AMD; ≥4GB VRAM
- **CPU:** Multi-core (≥8); ≥3.5 GHz
- **RAM:** ≥16GB
- **Supported APIs:** WebGL 2.0, WebGPU (experimental)

**Configuration:**
- Star density: 500,000 (full catalog)
- Texture resolution: 8K (planets, star atlases)
- Particle effects: Full (nebulae, star fields, comet trails)
- Physics tick: 60 Hz (per-frame orbital updates)
- Shader quality: Physically-based rendering (PBR); normal maps, parallax mapping
- Geometry complexity: Full models for major bodies; complex surfaces
- Ambient occlusion: Real-time screen-space AO
- Bloom/glow: Full-intensity HDR post-processing

#### **Tier 2: Mid-Range (Laptop/Tablet)**
- **GPU:** Integrated or older discrete; 1–2GB VRAM
- **CPU:** Dual/quad-core; ≥2.5 GHz
- **RAM:** 8–16GB

**Configuration:**
- Star density: 100,000 (curated selection)
- Texture resolution: 4K (downsampled to 2K at distance)
- Particle effects: Reduced (20% overdraw vs. Tier 1)
- Physics tick: 30 Hz (every other frame update)
- Shader quality: Simplified PBR; baked lighting, no parallax
- Geometry complexity: LOD meshes; decimated at distance
- Ambient occlusion: Baked only
- Bloom/glow: Tone-mapped (no full HDR)

#### **Tier 3: Low-End (Mobile/Older Hardware)**
- **GPU:** Mobile GPU (Adreno, Mali, PowerVR); ≤512MB dedicated VRAM
- **CPU:** ARM mobile; ≥1.5 GHz
- **RAM:** 4–6GB (constrained)

**Configuration:**
- Star density: 10,000 (simplified; sampling algorithm)
- Texture resolution: 2K (compressed; KTX2 mandatory)
- Particle effects: Minimal or disabled
- Physics tick: 15 Hz or on-demand (on interaction only)
- Shader quality: Unlit rendering; vertex-only colors
- Geometry complexity: Spheres only; no surface detail meshes
- Ambient occlusion: None
- Bloom/glow: Disabled
- Mobile optimizations: WebGL Lose context recovery; aggressive garbage collection

### 2.2 Auto-Detection Algorithm

**First Load GPU Benchmark (non-blocking):**

```
1. Render 1000-vertex sphere with full PBR shader
2. Measure frame time; record GPU timing if EXT_disjoint_timer_query available
3. Compare against thresholds:
   - >16ms FCP-to-interactive: Tier 3
   - 12–16ms: Tier 2
   - <12ms: Tier 1
4. Cross-reference with gl.getParameter(gl.MAX_TEXTURE_SIZE), VRAM hints
5. Store in localStorage; allow user override
```

**Fallback:** If benchmark unavailable, use User-Agent heuristics (desktop→Tier 1, tablet→Tier 2, mobile→Tier 3).

### 2.3 Quality Slider

UI control in Settings panel:
- **Slider range:** 0–100 (0=minimum, 100=maximum within tier)
- **Adjusts:** Star count, texture resolution, effect intensity, physics frequency
- **Real-time updates:** Changes apply mid-session without full reload
- **Persistence:** Saved to localStorage; restored on next session

Example: Tier 2 user at slider=60 loads 60,000 stars (vs. tier default 100K).

---

## 3. Rendering Optimizations

### 3.1 Instanced Rendering

**Problem:** Rendering 500,000 individual stars = 500,000 draw calls → GPU bottleneck.

**Solution:** InstancedBufferGeometry with single draw call per LOD level.

```javascript
// Example: 500K stars in 1 draw call
const geometry = new THREE.InstancedBufferGeometry();
geometry.setAttribute('position', positionBuffer); // Shared: [x, y, z]
geometry.setAttribute('instancePosition', instancePositions); // Per-instance: [x, y, z]
geometry.setAttribute('instanceColor', instanceColors); // Per-instance: RGB
geometry.setAttribute('instanceSize', instanceSizes); // Per-instance: magnitude

const instances = 500000;
geometry.instanceCount = instances;

const mesh = new THREE.Mesh(geometry, material);
// Draw 500K stars: 1 draw call
```

**Impact:** Reduces draw calls from 500K → 5 (one per LOD tier, star type, etc.).

**Constraints:**
- WebGL 2.0 required (2018 spec; >95% browser coverage)
- Instancing not ideal for per-object physics; use for static or uniformly-updated data

### 3.2 Level of Detail (LOD)

Stars and galaxies use distance-based LOD to reduce geometry complexity.

#### **Star Rendering LOD Cascade**

| Distance | LOD Level | Representation | Geometry | Draw Calls | Vertex Count |
|----------|-----------|-----------------|----------|-----------|--------------|
| <1 AU | LOD 0 (Sphere) | Sphere (32 segments) | Complex | 1 call | ~2K verts |
| 1–100 AU | LOD 1 (Billboard) | Quad with particle shader | Simple | 1 call (instanced) | 4 verts per star |
| 100 AU–1 LY | LOD 2 (Point) | gl.POINTS + uniform color | Minimal | 1 call (instanced) | 1 vert per star |
| >1 LY | LOD 3 (Starfield) | Pre-rendered sprite (1K×1K atlas) | None (texture only) | 1 call | 0 verts |

**Transition Hysteresis:** ±15% distance band to prevent flickering on boundary.

#### **Galaxy Rendering LOD Cascade**

| Distance | Representation | Quality |
|----------|-----------------|---------|
| <1 MLY | Mesh (spiral arm detail) | High (PBR, 4K texture) |
| 1–5 MLY | Particle system (100K particles) | Medium (simple shader) |
| 5–100 MLY | Sprite with rotational velocity | Low (single texture) |
| >100 MLY | Pixel (single colored point) | Minimal |

**Implementation:** Three.js LODGroup; automatic camera distance → level selection.

### 3.3 Frustum Culling

**Three.js built-in frustum culling:** Objects outside camera view automatically skip rendering.

```javascript
const frustum = new THREE.Frustum();
const cameraProjectionMatrix = new THREE.Matrix4()
  .multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
frustum.setFromProjectionMatrix(cameraProjectionMatrix);

// Cull stars outside frustum
starMeshes.forEach(star => {
  star.visible = frustum.containsPoint(star.position);
});
```

**Performance gain:** Skips rendering for 70–90% of objects when zoomed/panned to sector.

### 3.4 Octree-Based Spatial Culling

For large datasets (e.g., 100K+ galaxies), instanced frustum culling is insufficient. Octree spatial partitioning pre-filters objects.

```javascript
// Build octree at load time
const octree = new Octree(new THREE.Box3().setFromArray(galaxyPositions), 10); // Max 10 objects per node
octree.insert(galaxyData);

// Query octree for frustum-visible objects
const visibleGalaxies = octree.search(frustumBox3);
```

**Benefits:**
- O(log n) lookup vs. O(n) frustum checks
- Enables loading only visible tiles (like map applications)
- Reduces draw calls by deferring LOD0 loading for off-screen sectors

### 3.5 Object Pooling

Frequently created/destroyed objects (particles, temporary UI elements) reuse instances.

```javascript
class StarParticlePool {
  constructor(size = 10000) {
    this.available = [];
    this.inUse = new Set();
    
    for (let i = 0; i < size; i++) {
      this.available.push(createStarParticle());
    }
  }
  
  acquire() {
    const particle = this.available.pop() || createStarParticle();
    this.inUse.add(particle);
    return particle;
  }
  
  release(particle) {
    particle.reset();
    this.inUse.delete(particle);
    this.available.push(particle);
  }
}
```

**Impact:** Eliminates garbage collection pauses during interactive zoom/pan.

### 3.6 Shader Complexity Tiers

Shaders adapt to device tier:

#### **Tier 1: Full PBR Shader**
```glsl
// Physically-Based Rendering
uniform sampler2D albedoMap, normalMap, roughnessMap, metallicMap;
varying vec3 vNormal, vWorldPos;

void main() {
  vec3 albedo = texture2D(albedoMap, uv).rgb;
  vec3 normal = unpackNormal(texture2D(normalMap, uv)); // Normal mapping
  float roughness = texture2D(roughnessMap, uv).r;
  float metallic = texture2D(metallicMap, uv).r;
  
  vec3 radiance = calculateLighting(albedo, normal, roughness, metallic);
  gl_FragColor = vec4(radiance, 1.0);
}
```
- Cost: ~100–150 GPU instructions/pixel
- Supports: multiple light sources, shadows, ambient occlusion

#### **Tier 2: Simplified PBR**
```glsl
// Baked lighting; no dynamic effects
uniform sampler2D baseColor, bakedLighting;

void main() {
  vec3 color = texture2D(baseColor, uv).rgb;
  vec3 lighting = texture2D(bakedLighting, uv).rgb;
  gl_FragColor = vec4(color * lighting, 1.0);
}
```
- Cost: ~30–50 GPU instructions/pixel
- Removes: dynamic normal maps, parallax, real-time shadows

#### **Tier 3: Unlit Shader**
```glsl
// Vertex color; no textures
varying vec3 vColor;

void main() {
  gl_FragColor = vec4(vColor, 1.0);
}
```
- Cost: ~5 GPU instructions/pixel
- Minimal: vertex-only color, no texture lookups

**Automatic selection:** Shader tier determined by device tier; no user perception difference.

### 3.7 Render on Demand

By default, the scene only re-renders when:
1. Camera position/rotation changes
2. Time advances (orbital mechanics update)
3. User interaction (UI change)

```javascript
let needsRender = true;
let lastCameraPos = camera.position.clone();

function animate() {
  // Check if camera moved significantly (threshold: 0.1 units)
  if (lastCameraPos.distanceTo(camera.position) > 0.1) {
    needsRender = true;
    lastCameraPos.copy(camera.position);
  }
  
  if (needsRender) {
    renderer.render(scene, camera);
    needsRender = false;
  }
  
  requestAnimationFrame(animate);
}
```

**Benefit:** At idle (stationary camera), renders 0 FPS (CPU at 0%, GPU idle). Wakes on movement.

**Exception:** Tier 1 continuous 60 FPS for smooth animations (shader time uniforms, particle updates).

---

## 4. Data Loading Optimizations

### 4.1 Progressive Loading

Initial load prioritizes core Solar System data; extended universe loads in background.

**Phase 1: Core (FCP, <1.5s)**
- Sun, planets, major moons (30 objects)
- 2D star map (simple texture)
- Orbital mechanics (simplified Kepler solver)
- Compressed: ~1–2 MB

**Phase 2: Interactive (TTI, <2.5s)**
- Camera controls enabled
- Search index built
- Minor planets catalog (100K objects)
- Compressed: +3–5 MB

**Phase 3: Full (Background, <8s)**
- Extended star catalog (1M+ stars for Tier 1)
- Nearby galaxies (10K objects)
- Texture atlases
- Compressed: +10–20 MB

**Implementation:**
```javascript
// Load phases sequentially, reporting progress
await loadPhase('core');  // Blocks until TTI
reportProgress('Core loaded: 25%');

loadPhaseAsync('interactive').then(() => {
  reportProgress('Interactive: 50%');
  loadPhaseAsync('full').then(() => {
    reportProgress('Complete: 100%');
  });
});
```

### 4.2 Streaming & Tile-Based Loading

As the user navigates, data tiles load on demand (like map tile services).

```javascript
// Define 3D tiles (each ~5MB uncompressed)
const tileSize = 50; // light-years
const tiles = new Map();

camera.onChange(() => {
  const cameraTile = getTileKey(camera.position, tileSize);
  const adjacentTiles = getAdjacentTiles(cameraTile, radius=1);
  
  adjacentTiles.forEach(tile => {
    if (!tiles.has(tile)) {
      fetchTile(tile).then(data => {
        tiles.set(tile, parseStarData(data));
        needsRender = true;
      });
    }
  });
});
```

**Benefit:** As user zooms/pans 50 LY, new tile (~2–5 MB) fetches asynchronously. Only visible data in VRAM.

### 4.3 Binary Formats

JSON parsing is CPU-expensive for large arrays. Binary formats (MessagePack, Protocol Buffers) are 3–5× faster.

```javascript
// Instead of: const stars = JSON.parse(jsonString); // 500ms for 100K stars
// Use:
const stars = msgpack.decode(binaryData); // 100–150ms for 100K stars
```

**Format choice:**
- **MessagePack:** Simpler; human-debuggable (with hex viewer)
- **Protocol Buffers:** More compact; better for sparse data
- **Custom binary:** 3D vectors as 3×float32, color as uint8×3

**Impact:** Reduces data parse time by 70% for large catalogs.

### 4.4 Compression Strategy

All network assets compressed; selection depends on device:

| Asset Type | Tier 1 | Tier 2 | Tier 3 | Notes |
|------------|--------|--------|--------|-------|
| Code bundles | Brotli | Gzip | Gzip | Brotli 15–20% smaller; slower decompression |
| Data tiles | Brotli | Gzip | Gzip | Star catalogs; galaxy positions |
| Textures | Basis Universal | WebP | WebP | GPU-compressed on transfer |
| Config/metadata | Gzip | Gzip | Gzip | Small files; minimal overhead |

**HTTP Header negotiation:**
```
Accept-Encoding: br, gzip
```

**Decompression:** Browser handles automatically for HTTP compression; client-side decompression for Basis/WebP.

### 4.5 Texture Compression

**GPU-Compressed Textures (KTX2 + Basis Universal):**

Instead of uploading 8K sRGB texture (~256 MB uncompressed), use Basis-compressed KTX2:
- Size: ~32 MB (8× reduction)
- Decompression: GPU-native; no CPU overhead
- Fallback: JPEG for unsupported browsers (16× smaller than sRGB)

```javascript
const textureUrl = supportsKTX2 ? 'planet.ktx2' : 'planet.jpg';
const texture = await textureLoader.loadAsync(textureUrl);
```

**Impact:** Reduces texture VRAM by 70–80%; faster download on metered connections.

### 4.6 Lazy Loading & Disposal

Textures load only when approached; unload when distant.

```javascript
const disposalDistance = 10; // Light-years
const loadDistance = 5;

scene.onUpdate(() => {
  Object.forEach(celestialBodies, body => {
    const dist = camera.position.distanceTo(body.position);
    
    if (dist < loadDistance && !body.texture) {
      loadTexture(body).then(tex => {
        body.material.map = tex;
        body.texture = tex;
      });
    } else if (dist > disposalDistance && body.texture) {
      body.texture.dispose();
      body.material.map = null;
      body.texture = null;
    }
  });
});
```

**Result:** High-res textures only in VRAM for ~10 nearby objects vs. all 100K+.

---

## 5. Memory Management

### 5.1 Texture & Geometry Disposal

Three.js objects must be explicitly freed; garbage collection alone is insufficient.

```javascript
// Dispose: frees GPU and heap memory
texture.dispose();
geometry.dispose();
material.dispose();

// Remove from scene
scene.remove(mesh);
mesh = null; // Help GC
```

**Audit pattern:**
```javascript
function auditMemory() {
  const renderer = gl.getParameter(gl.GPU_MEMORY_INFO_CURRENT_USAGE_INTEL); // Intel only
  console.log(`GPU memory: ${renderer / 1024 / 1024}MB`);
  
  if (renderer > budgets[deviceTier]) {
    console.warn('GPU memory exceeded; triggering emergency cleanup');
    emptyTextureCache();
  }
}
```

### 5.2 Buffer Recycling

Avoid creating new Float32Arrays for every data update. Reuse buffers.

```javascript
class StarBufferPool {
  constructor(maxStars = 100000) {
    this.positions = new Float32Array(maxStars * 3);
    this.colors = new Uint8Array(maxStars * 4);
    this.sizes = new Float32Array(maxStars);
    this.count = 0;
  }
  
  addStar(x, y, z, r, g, b, size) {
    const i = this.count++;
    this.positions[i*3] = x;
    this.positions[i*3+1] = y;
    this.positions[i*3+2] = z;
    this.colors[i*4] = r;
    this.colors[i*4+1] = g;
    this.colors[i*4+2] = b;
    this.sizes[i] = size;
  }
  
  reset() {
    this.count = 0;
  }
}
```

### 5.3 WeakRef for Cached Objects

Use WeakRef for optional caches; allow GC to collect if memory pressure rises.

```javascript
class TextureCache {
  constructor() {
    this.cache = new Map(); // WeakRef<Texture>
  }
  
  get(key) {
    const ref = this.cache.get(key);
    return ref ? ref.deref() : null;
  }
  
  set(key, texture) {
    // If texture is no longer referenced elsewhere, GC can collect it
    this.cache.set(key, new WeakRef(texture));
  }
}
```

### 5.4 Periodic Garbage Collection Hints

In long-running sessions, suggest GC at safe points (between data loads, after panning stops).

```javascript
function scheduleGCHint() {
  // Suggest GC via periodic idle callbacks (if supported)
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => {
      // If GC is available (Node.js-style V8 inspector), trigger it
      if (window.gc) {
        window.gc(false); // false = minor GC
      }
    }, { timeout: 5000 });
  }
}
```

**Note:** GC timing is not guaranteed in browsers; used as hint only.

### 5.5 Memory Leak Detection (Development)

In development builds, track object creation and disposal to detect leaks.

```javascript
class MemoryTracker {
  constructor() {
    this.created = new Map();
  }
  
  trackCreation(name, obj) {
    if (!this.created.has(name)) this.created.set(name, 0);
    this.created.set(name, this.created.get(name) + 1);
  }
  
  trackDisposal(name) {
    if (!this.created.has(name)) this.created.set(name, 0);
    this.created.set(name, this.created.get(name) - 1);
  }
  
  report() {
    console.table(this.created);
    // Warn if any count > 0 and steady (not disposable)
  }
}
```

**Integration:** Track disposals in scene.remove(), texture.dispose(); warn on mismatches.

---

## 6. Web Worker Strategy

### 6.1 Worker Architecture

Four dedicated Web Workers handle CPU-intensive tasks off main thread.

#### **Worker 1: Data Parsing**
- **Task:** Binary → typed arrays (MessagePack/ProtoBuf decoding)
- **Input:** Compressed binary tile data
- **Output:** Typed arrays (Float32Array, Uint8Array)
- **Frequency:** Per-tile load (~5–10 MB chunks)
- **Speedup:** 100–200 ms CPU time off main thread

```javascript
// main.js
worker1.onmessage = (e) => {
  const { positions, colors, sizes } = e.data;
  addStarsToScene(positions, colors, sizes); // No parse lag on main
};
worker1.postMessage({ data: binaryTileData });
```

#### **Worker 2: Physics Computation**
- **Task:** Orbital mechanics (Kepler solver, N-body if simplified)
- **Input:** Body positions, velocities, time delta
- **Output:** Updated positions for next frame
- **Frequency:** Every frame (60 Hz on Tier 1, 30 Hz on Tier 2)
- **Speedup:** Physics off main; avoids blocking camera input

```javascript
// Update every frame
worker2.postMessage({ 
  bodies: currentBodies, 
  dt: deltaTime 
});
worker2.onmessage = (e) => {
  currentBodies = e.data; // Swap in computed positions
  needsRender = true;
};
```

#### **Worker 3: Octree Queries**
- **Task:** Spatial search (frustum intersection, nearest-neighbor)
- **Input:** Query box, octree structure, scene bounds
- **Output:** List of visible objects
- **Frequency:** Per-camera-move
- **Speedup:** Frustum checks parallelized; main thread unblocked

#### **Worker 4: Search Index**
- **Task:** Fuzzy string matching (celestial object names)
- **Input:** Query string, search index
- **Output:** Ranked results
- **Frequency:** Per keystroke (debounced 50ms)
- **Speedup:** Search does not block camera controls

### 6.2 SharedArrayBuffer & Transferable Objects

**SharedArrayBuffer (where supported):**
Zero-copy data transfer for large buffers. Worker and main thread share memory view.

```javascript
// Create shared buffer: 100K star positions
const sharedBuffer = new SharedArrayBuffer(100000 * 3 * Float32Array.BYTES_PER_ELEMENT);
const positions = new Float32Array(sharedBuffer);

// Pass reference to worker
worker.postMessage({ buffer: sharedBuffer, length: 100000 });

// Worker updates in-place; main thread sees changes immediately
```

**Fallback (Transferable Objects):**
For unsupported browsers, transfer buffers (move ownership to worker, get new buffer back).

```javascript
const buffer = new ArrayBuffer(1000000);
worker.postMessage({ buffer }, [buffer]); // Transfer ownership
// buffer is now empty in main thread; worker has it

worker.onmessage = (e) => {
  const { buffer } = e.data;
  // buffer is new; original transferred back
};
```

**Decision:** Use SharedArrayBuffer if `typeof SharedArrayBuffer !== 'undefined'`, else Transferable.

---

## 7. Network Optimization

### 7.1 CDN with Edge Caching

All static assets (code, textures, data tiles) served via CDN with aggressive caching.

**Provider:** Cloudflare (or equivalent)
- **Cache-Control:** `public, max-age=31536000` for versioned assets
- **Edge locations:** 200+ globally; latency <50ms for 99% of users
- **Compression:** Automatic Brotli/Gzip negotiation

**Example headers:**
```
Cache-Control: public, max-age=31536000, immutable
ETag: "abc123def456"
Vary: Accept-Encoding
```

### 7.2 HTTP/2 Multiplexing

HTTP/2 allows parallel requests on single TCP connection; reduces latency for multi-tile loads.

```
GET /tiles/sector_1.ktx2
GET /tiles/sector_2.ktx2
GET /tiles/galaxy_10.glb
GET /data/catalog.msgpack
```

All 4 requests on 1 connection; receive ~2–3× faster than HTTP/1.1.

### 7.3 Service Worker Caching

Service Worker caches tiles and code for offline use.

```javascript
// sw.js
const CACHE_NAME = 'cosmos-v1';

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/tiles/') || e.request.url.includes('/data/')) {
    e.respondWith(
      caches.match(e.request).then(response => {
        return response || fetch(e.request).then(r => {
          caches.open(CACHE_NAME).then(c => c.put(e.request, r.clone()));
          return r;
        });
      })
    );
  }
});
```

**Effect:** Repeat navigation (same user, next session) loads from cache; 100–500 ms faster.

### 7.4 Prefetch Hints

Based on current camera position and zoom level, prefetch likely next tiles.

```javascript
function prefetchAdjacentTiles(currentTile) {
  const adjacent = getAdjacentTiles(currentTile);
  adjacent.forEach(tile => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = `/tiles/${tile}.ktx2`;
    document.head.appendChild(link);
  });
}
```

**Timing:** Prefetch starts 500 ms after idle (after camera stops); avoids competing with main navigation.

### 7.5 Request Deduplication & Cancellation

If user rapidly pans/zooms, prevent duplicate requests for same tile; cancel requests for off-screen tiles.

```javascript
class TileLoader {
  constructor() {
    this.pending = new Map(); // tile → AbortController
    this.cache = new Map();
  }
  
  async load(tileKey) {
    if (this.cache.has(tileKey)) return this.cache.get(tileKey);
    if (this.pending.has(tileKey)) return this.pending.get(tileKey).promise;
    
    const controller = new AbortController();
    const promise = fetch(`/tiles/${tileKey}`, { signal: controller.signal })
      .then(r => r.arrayBuffer())
      .then(data => this.cache.set(tileKey, data));
    
    this.pending.set(tileKey, controller);
    return promise.finally(() => this.pending.delete(tileKey));
  }
  
  cancel(tileKey) {
    this.pending.get(tileKey)?.abort();
  }
}
```

---

## 8. Monitoring & Profiling

### 8.1 Built-in Performance UI

Overlay showing real-time metrics (toggle with Ctrl+Shift+P):

```javascript
class PerformanceMonitor {
  constructor() {
    this.fpsCounter = 0;
    this.frameTime = 0;
    this.drawCalls = 0;
    this.memory = 0;
  }
  
  update(renderer, camera) {
    // FPS: measure requestAnimationFrame delta
    const now = performance.now();
    this.frameTime = now - this.lastTime;
    this.lastTime = now;
    this.fps = 1000 / this.frameTime;
    
    // Draw calls: query from renderer
    this.drawCalls = renderer.info.render.calls;
    
    // Memory: attempt to get from performance API (if available)
    if (performance.memory) {
      this.memory = performance.memory.usedJSHeapSize / 1024 / 1024;
    }
    
    this.render(); // Draw overlay
  }
  
  render() {
    const text = `
      FPS: ${this.fps.toFixed(1)}
      Frame: ${this.frameTime.toFixed(1)}ms
      Draws: ${this.drawCalls}
      Memory: ${this.memory.toFixed(1)}MB
    `;
    // Render to canvas/DOM
  }
}
```

### 8.2 Performance.mark / Performance.measure

For custom metrics (tile load time, search latency):

```javascript
performance.mark('tile-load-start');
await loadTile(tileKey);
performance.mark('tile-load-end');

performance.measure('tile-load', 'tile-load-start', 'tile-load-end');
const measure = performance.getEntriesByName('tile-load')[0];
console.log(`Tile load: ${measure.duration.toFixed(2)}ms`);
```

**Dashboard:** Collect marks via Performance Observer; send to telemetry.

### 8.3 GPU Timing (EXT_disjoint_timer_query)

Measure GPU-side render time (if extension available).

```javascript
const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
const query = gl.createQuery();

gl.beginQuery(ext.TIME_ELAPSED_EXT, query);
renderer.render(scene, camera);
gl.endQuery(ext.TIME_ELAPSED_EXT);

gl.getQueryParameter(query, ext.QUERY_RESULT, (result) => {
  const gpuTime = result / 1000000; // ns → ms
  console.log(`GPU render time: ${gpuTime.toFixed(2)}ms`);
});
```

**Availability:** ~80% of WebGL2 devices; gracefully skipped if unavailable.

### 8.4 Lighthouse CI Integration

Automated performance regression detection.

**lighthouse-ci.json:**
```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000"],
      "numberOfRuns": 3
    },
    "upload": {
      "target": "temporary-public-storage"
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "first-contentful-paint": ["error", {"maxNumericValue": 1500}],
        "speed-index": ["error", {"maxNumericValue": 3000}]
      }
    }
  }
}
```

**CI workflow:** Run on each commit; fail if FCP >1.5s or Speed Index >3s.

### 8.5 Real User Monitoring (Optional, Privacy-First)

Sample 1% of sessions; collect anonymized performance data (no PII).

```javascript
if (Math.random() < 0.01) { // 1% sample
  const perfData = {
    fcp: performance.timing.firstContentfulPaint - performance.timing.navigationStart,
    tti: performance.timing.loadEventEnd - performance.timing.navigationStart,
    deviceTier: detectedTier,
    fps: averageFPS,
  };
  
  // Send to telemetry (POST, no sensitive data)
  beacon('/api/perf', JSON.stringify(perfData));
}
```

**Privacy:** No user identifiers, IP anonymization, opt-out via DNT header.

---

## 9. WebGPU Migration Path

### 9.1 Current Architecture

**Renderer:** Three.js WebGLRenderer (WebGL 2.0)
- Mature, stable, wide browser support (>95%)
- CPU-bottlenecked for large draw counts

### 9.2 WebGPU Transition

**Phase 1 (2026):** Experimental WebGPURenderer in Three.js
- Requires explicit opt-in (query param: `?renderer=webgpu`)
- Validate feature parity, performance gains
- Gather feedback from beta users

**Phase 2 (2027, est. 80% browser support):** Make default
- Toggle in settings; fallback to WebGL2 for unsupported browsers
- Expect 20–40% FPS increase on same hardware (due to lower CPU overhead)

### 9.3 WebGPU Benefits

| Feature | WebGL 2.0 | WebGPU | Benefit |
|---------|-----------|--------|---------|
| Draw call overhead | ~0.1–0.2ms per | ~0.01ms per | 10× reduction for 1000 calls |
| Instancing | Supported (extension) | Native | Simpler, faster |
| Compute shaders | No | Yes | Physics on GPU; no CPU upload |
| Async texture uploads | No | Yes | Non-blocking texture streaming |
| Barriers/sync | Implicit | Explicit | Fine-grained optimization |
| Validation | Loose | Strict | Easier debugging |

### 9.4 Implementation Strategy

**Abstraction layer:** Create rendering backend interface.

```typescript
interface Renderer {
  render(scene: Scene, camera: Camera): void;
  createTexture(data: ImageData): Texture;
  dispose(): void;
}

class WebGLBackend implements Renderer { /* ... */ }
class WebGPUBackend implements Renderer { /* ... */ }

const renderer = supportsWebGPU ? new WebGPUBackend() : new WebGLBackend();
```

**Phased rollout:**
- 2026 Q2: WebGPU backend complete, experimental
- 2026 Q3: Beta testing (10% of users)
- 2027 Q1: Default renderer (80%+ browser support)
- 2027 Q2: WebGL support deprecated (maintained, not improved)

---

## 10. Benchmark Suite

### 10.1 Automated Performance Tests

Continuous integration runs benchmarks on each commit.

```javascript
// tests/performance.test.js
describe('Performance', () => {
  test('FPS maintained at Solar System scale', async () => {
    const fps = await measureFPS(camera.zoomTo(0), samples=60);
    expect(fps).toBeGreaterThan(50); // Tier 1: >50 FPS
  });
  
  test('Load time <3s for core data', async () => {
    const startTime = performance.now();
    await loadPhase('core');
    const duration = performance.now() - startTime;
    expect(duration).toBeLessThan(3000);
  });
  
  test('Memory peak <450MB on Tier 1', async () => {
    const peak = await measureMemoryPeak(loadFullCatalog);
    expect(peak).toBeLessThan(450 * 1024 * 1024);
  });
});
```

### 10.2 Device Matrix

Test on 5 representative devices per tier.

| Tier | Device Examples | OS | Browser |
|------|-----------------|----|----|
| Tier 1 | MacBook Pro 16", RTX 3080 | macOS 13, Ubuntu 22 | Chrome 120, Firefox 121, Safari 17 |
| Tier 2 | iPad Pro 11", ThinkPad X1 | iOS 17, Windows 11 | Safari 17, Chrome 120 |
| Tier 3 | iPhone 12, Samsung A52 | iOS 17, Android 13 | Safari, Chrome Mobile |

**Metrics:** FPS, load time, memory, battery drain (mobile).

### 10.3 Regression Detection

If any benchmark drops >10% vs. previous commit, alert engineering.

```javascript
async function detectRegression(currentMetrics, baselineMetrics) {
  const regressions = [];
  
  Object.entries(currentMetrics).forEach(([name, current]) => {
    const baseline = baselineMetrics[name];
    const delta = (baseline - current) / baseline;
    
    if (delta > 0.1) { // >10% worse
      regressions.push({
        metric: name,
        baseline,
        current,
        delta: (delta * 100).toFixed(1) + '%'
      });
    }
  });
  
  if (regressions.length > 0) {
    await notifySlack(`Performance regression detected:\n${JSON.stringify(regressions)}`);
  }
}
```

---

## Implementation Timeline

### Phase 1: Foundation (Q2 2026)
- Performance budget definition
- Device tier detection & auto-configuration
- Instanced rendering (stars, galaxies)
- Memory audit & disposal framework

### Phase 2: Optimization (Q3 2026)
- LOD system implementation
- Tile-based streaming & octree culling
- Web Worker architecture
- Compression (Brotli, KTX2)

### Phase 3: Monitoring (Q4 2026)
- Performance UI dashboard
- Lighthouse CI integration
- RUM data collection
- Benchmark suite & regression detection

### Phase 4: Advanced (2027)
- WebGPU experimentation
- Compute shader physics
- Advanced spatial caching
- Potential: WASM for critical paths

---

## Success Criteria

- **Core load <3s on all tiers**
- **FPS >50 at Solar System zoom on Tier 1–2; >30 on Tier 3**
- **Memory peak within budget for 99% of sessions**
- **No regressions >10% FPS between releases**
- **User-facing metrics: FCP <1.5s, TTI <2.5s**

---

## References & Appendices

### A. Relevant Web APIs & Extensions
- WebGL 2.0 Specification
- EXT_disjoint_timer_query (GPU timing)
- WEBGL_compressed_texture_s3tc, WEBGL_compressed_texture_astc (texture compression)
- OffscreenCanvas, Web Workers (parallelization)
- Performance Observer API
- Service Worker API

### B. Three.js-Specific Optimization Patterns
- `InstancedBufferGeometry` (instancing)
- `LODGroup` (level-of-detail)
- `THREE.Frustum` (culling)
- `geometry.dispose()`, `texture.dispose()` (cleanup)
- `THREE.ObjectPool` (object pooling)

### C. Benchmark Tools
- Lighthouse CLI (`npm install -g lighthouse`)
- WebGL Inspector (browser extension)
- Three.js Stats.js (FPS/memory overlay)
- Chrome DevTools Performance tab

---

## 10. Volumetric Rendering Performance (Added v2.0)

### 10.1 Raymarching Budget

Nebulae (14 types, ENT-5000 series from Doc 22 v4.2) use fragment-shader raymarching with strict budgets:

| Quality Tier | Max Steps/Pixel | Resolution Scale | Max Simultaneous Volumes | Frame Budget |
|---|---|---|---|---|
| High (desktop GPU) | 128 | 1.0x (full) | 3 | 4ms |
| Medium (laptop GPU) | 80 | 0.5x (half) | 2 | 3ms |
| Low (integrated/mobile) | 48 | 0.25x (quarter) | 1 | 2ms |

### 10.2 Adaptive Quality

- **FPS-driven**: if frame time > 18ms for 10 consecutive frames → reduce step count by 25%
- **Distance-driven**: volumes beyond LOD L2 switch to billboard (zero raymarching cost)
- **Occlusion-driven**: skip raymarching for volumes fully behind opaque geometry
- **Early termination**: exit ray when transmittance < 0.01 (saves 20-40% steps on average)

### 10.3 Noise Optimization

FBM noise (most expensive part of raymarching):
- Use 3D texture lookup (256³ precomputed noise) instead of analytical noise at Low tier
- Analytical noise (Perlin/Simplex) at Medium/High for quality
- Reduce octaves: 3 (Low), 4 (Medium), 6 (High)
- Temporal reprojection: reuse previous frame's raymarching for static camera (save 50%+ cost)

---

## 11. Shader Compilation Performance (Added v2.0)

### 11.1 Budget

24 shader families cover 96 entity types (Doc 22 v4.2). Compilation strategy:

- **Eager** (app load): 6 core families — budget 500ms total during splash screen
- **Lazy** (on approach): max 2 compilations per frame, max 50ms each
- **Cache**: 32 compiled programs in LRU cache
- **Warm-up**: during idle time, precompile next-most-likely-needed shader families based on camera trajectory

### 11.2 Shader Complexity Tiers

| Tier | Uniforms | Texture Lookups | Instructions (est.) | Compile Time (est.) |
|---|---|---|---|---|
| Simple (brown-dwarf, kbo-centaur) | 8–12 | 0–1 | 200–500 | 10–20ms |
| Medium (planet-rocky, moon-surface) | 15–25 | 1–3 | 500–1500 | 20–50ms |
| Complex (planet-exotic, nebula-emission) | 25–40 | 2–4 | 1500–3000 | 50–100ms |
| Extreme (star-compact/black hole, exotic) | 30–50 | 3–5 | 3000–5000 | 80–150ms |

---

## 12. Extended Particle System Performance (Added v2.0)

### 12.1 Global Particle Budget

| Device Tier | Total Active Particles | Instanced Points (star fields) | GPU Memory for Particles |
|---|---|---|---|
| High | 2,000,000 | 5,000,000 | 256MB |
| Medium | 500,000 | 1,000,000 | 128MB |
| Low | 100,000 | 200,000 | 32MB |

### 12.2 LOD-Based Particle Reduction

| LOD Level | Particle Count Multiplier | Rendering Method |
|---|---|---|
| L0 (ultra close) | 1.0x | Individual geometry/billboard |
| L1 (close) | 0.5x | Billboard sprites |
| L2 (medium) | 0.1x | Point sprites |
| L3 (far) | 0.01x | Aggregate glow |
| L4 (icon) | 0x | Single colored pixel |

### 12.3 GPU Instancing Optimization

For star fields and galaxy particles (largest particle counts):
- Use `InstancedBufferGeometry` with `Float32Array` attribute buffers
- Per-instance attributes: position (vec3), color (vec3), size (float) = 28 bytes/instance
- At 5M instances: 140MB GPU memory
- Sort by depth only when transparency needed (galaxies at medium distance)
- Frustum cull entire instance groups (spatial grid of 1000 instances per group)

---

## 13. Device Tier Auto-Detection (Added v2.0)

### 13.1 Detection Algorithm

```
On first load:
1. Query WebGL capabilities:
   - MAX_TEXTURE_SIZE, MAX_RENDERBUFFER_SIZE
   - Renderer string (GPU model detection via WEBGL_debug_renderer_info)
   - MAX_VERTEX_UNIFORM_VECTORS
2. Run micro-benchmark (50ms):
   - Render 10K instanced points → measure FPS
   - Compile test shader → measure compile time
3. Classify:
   - High: ≥55 FPS on benchmark + dedicated GPU detected
   - Medium: 30-55 FPS or laptop GPU
   - Low: <30 FPS or mobile/integrated GPU
4. Store result in localStorage for subsequent visits
5. User can override in Settings
```

---

## 14. Memory Management for 96 Entity Types (Added v2.0)

### 14.1 Entity Data Streaming

Not all 96 entity types are loaded simultaneously. Load priority:
- **Always loaded**: current scale level's visible entities + 1 level above/below
- **On-demand**: entities that enter camera frustum (preload at LOD L3 distance)
- **Evict**: entities >2 scale levels away from current view

### 14.2 Memory Budget per Category

| Category | Shader Memory | Geometry/Particle Memory | Data Memory | Total per Entity |
|---|---|---|---|---|
| Stars (instanced) | 2KB (shared) | 28 bytes × count | 64 bytes | ~30KB per 1000 |
| Planets (individual) | 8KB | 50KB (sphere + atmo) | 256 bytes | ~60KB each |
| Nebulae (raymarched) | 12KB | Bounding box only | 512 bytes | ~15KB + GPU time |
| Galaxies (particles) | 8KB | 28 bytes × count | 1KB | ~1.4MB per 50K particles |

---

## Document Control

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-04-16 | Engineering Team | Initial release |
| 2.0 | 2026-04-16 | Engineering Team | Updated to align with Doc 22 v4.2 (96 entity types), volumetric rendering specs, particle system requirements. |

**Next Review:** Q3 2026 (post Phase 2 completion)
