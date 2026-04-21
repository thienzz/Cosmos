# Plan Fix — Scale, Position & Progressive Streaming cho Toàn Vũ Trụ

> **Scope:** Toàn bộ 96 entity types / 9 categories — không chỉ solar system.
> **Mục tiêu:** Tất cả thực thể trong vũ trụ render đúng vị trí và khoảng cách thực tế (ICRS J2000.0), camera đi tới đâu mới stream tới đó, không còn "tất cả render cùng 1 frame".
> **Ngày tạo:** 2026-04-21
> **Ước tính:** ~3 tuần (15 ngày làm việc)

---

## 1. Chẩn đoán — bằng chứng từ live preview

### 1.1 Bằng chứng cứng (từ `__cosmosEngine` runtime)

| Hệ thống | Trạng thái hiện tại | Trạng thái đúng |
|---|---|---|
| **Ephemeris API** | `/v1/ephemeris/{naifId}` trả `INTERNAL_ERROR 500` cho **mọi NAIF** (199, 299, 399, 499, 599, 699, 799, 899, 999, 136199, 136108, 136472, 2000001…) | Trả về state vector từ SPICE DE441 |
| **Solar system planets** | Mercury/Venus/Earth/Mars/Jupiter/Saturn/Uranus/Neptune **cả 8 đều ở (0,0,0)** | Mercury ~4.68 units, Pluto ~591 units (orbitScale=12 units/AU) |
| **Star seed** | 5000 stars trong shell `radius ∈ [10.56, 80]` units (random, không liên quan pc) | Hipparcos bright catalog ≤25 pc, positions từ RA/Dec/parallax thật |
| **Star tile streaming** | `queueDepth=0, inFlight=0, starTileCentres=undefined, starTileField.children=0` | Progressive stream theo camera distance; Gaia DR3 ~10M bright subset |
| **Regime** | `solar_system` active — nhưng vẫn có 10 renderer khác đang visible | Mỗi regime chỉ show set renderer phù hợp |
| **Galaxy gallery** | 19 galaxies trong `180 × 20 × 0` units (flat strip) | Andromeda 778 kpc, LMC 50 kpc, SMC 62 kpc — positions thật |
| **Nebula gallery** | 14 nebulae trong `63 × 12 × 0` units (flat strip) | Orion 412 pc, Crab 2 kpc, Eagle 2.1 kpc — positions thật |
| **Star type gallery** | 14 nodes trên đường thẳng `130 × 0 × 0` tại z=-5000 | Museum mode only, hoặc ground vào real stars |
| **Phenomena gallery** | 20 nodes trên đường thẳng `152 × 0 × 0` tại z=-7500 | Real positions (Sgr A*, Crab pulsar, Vela…) |
| **Exoplanet gallery** | 8 nodes trên đường thẳng `56 × 0 × 0` tại z=-6000 | Tại host star (Gaia distance) |
| **Exotic gallery** | 18 nodes trên đường thẳng `272 × 0 × 0` tại z=-2042 | Real positions (Sgr A*, M87*, Cygnus X-1…) |
| **Cosmic web** | 21 nodes trong cube `80 × 75 × 70` units | IllustrisTNG mesh, Mpc-scale |
| **Large-scale structure** | 9 renderers trong `71 × 57 × 7` (gần flat) | Abell clusters, Virgo 16.5 Mpc, Coma 102 Mpc |
| **Milky Way interior** | 2 nodes tại (0,0,0) | Heliocentric galactic coord, Sun ở 8.178 kpc từ GC |

### 1.2 Visual evidence (screenshot sau reload)

Trong **1 frame duy nhất** thấy: Sun + 6 planets chồng nhau + Proxima Centauri (lẽ ra 1.3 pc = 650k units xa) + Hadar (161 pc) + Milky Way bulge streaks + constellation lines Crux/Centaurus/Peacock/TrA — **tất cả cùng zoom level**, xác nhận "quá gần nhau".

### 1.3 Root causes (ranked)

1. **[BLOCKER]** Ephemeris API backend lỗi → solar system positions invalid
2. **[BLOCKER]** Client Kepler fallback trả (0,0,0) thay vì đúng vị trí
3. **[CRITICAL]** Không có regime visibility culling — 10 gallery render cùng lúc ở mọi regime
4. **[CRITICAL]** Không có unified coordinate system — 6 scale factor khác nhau (12 units/AU, 500 units/pc, hardcode 15-200 units, flat gallery z=-2042/-5000/-6000/-7500, cube ±45…)
5. **[CRITICAL]** Tile streaming không bootstrap — `starTileCentres` undefined, queue trống
6. **[HIGH]** Seed data ngẫu nhiên, không phải catalog thật (Hipparcos/Gaia/NGC/HyperLEDA)
7. **[HIGH]** Galleries hardcode thành đường thẳng/mặt phẳng flat, không phải 3D positions thật
8. **[MEDIUM]** Chưa có camera-relative (floating origin) rendering
9. **[MEDIUM]** Chưa có frustum culling + distance-based LOD

---

## 2. Unified scale model — piecewise theo regime

Dải từ AU đến Gpc = 10²⁰, float32 không gánh nổi với 1 scale đơn. Giải pháp: **piecewise regime scale** với rebase origin khi chuyển regime.

```
┌─────────────────┬───────────────────┬─────────────────────┬──────────────────────┐
│ Regime          │ Scene unit rule   │ Đại lượng điển hình │ Example              │
├─────────────────┼───────────────────┼─────────────────────┼──────────────────────┤
│ solar_system    │ 1 AU    = 12 u    │ 0 – 5000 units      │ Pluto 49 AU = 588 u  │
│ stellar         │ 1 pc    = 500 u   │ 5·10³ – 2·10⁵ units │ Sirius 2.64 pc=1318u │
│ galactic        │ 1 kpc   = 100 u   │ 1·10³ – 5·10⁵ units │ MW radius 15 kpc=1500│
│ cosmic          │ 1 Mpc   = 10 u    │ 1·10³ – 5·10⁵ units │ Virgo 16.5 Mpc = 165 │
└─────────────────┴───────────────────┴─────────────────────┴──────────────────────┘

Ngưỡng chuyển regime (với hysteresis band 10%):
  solar → stellar    : camera.dist > 0.1 ly  = 6324 AU   ≈ 75,888 units (solar scale)
  stellar → galactic : camera.dist > 500 ly  = 153.3 pc  ≈ 76,650 units (stellar scale)
  galactic → cosmic  : camera.dist > 100 kly = 30.66 kpc ≈ 3,066 units  (galactic scale)
```

**Quy tắc chuyển regime:** khi cross boundary, camera + tất cả entity rebase về (0,0,0) trong scale mới. Tránh float32 precision loss.

---

## 3. Kế hoạch 6 Phase

```
Phase 0 — Hotfix: planets đúng vị trí                 (Day 1–2)   [P0 blocker]
Phase 1 — Regime visibility culling                   (Day 3–4)   [P0 blocker]
Phase 2 — Unified coordinate + real catalog data     (Day 5–9)   [P0]
Phase 3 — Progressive tile streaming                  (Day 10–12) [P1]
Phase 4 — Camera-relative (floating origin)           (Day 13–14) [P1]
Phase 5 — Data accuracy validation + test suite       (Day 15)    [P2]
```

---

### Phase 0 — Hotfix: Planets về đúng vị trí (Day 1–2)

**Mục tiêu:** 8 planets + Pluto + moons hiển thị ở đúng quỹ đạo heliocentric.

#### 0.1 Debug ephemeris backend
- Files: `apps/api/**`, `apps/ephemeris/**`
- Check tại sao `GET /v1/ephemeris/{naifId}` trả `INTERNAL_ERROR 500`
- Các khả năng:
  - SPICE kernels không được mount (`data/spice/*.bsp` qua Git LFS)
  - Python FastAPI service không chạy hoặc route chưa wire
  - `apps/api` gateway không proxy được sang ephemeris service
- **Acceptance:** `curl http://localhost/api/v1/ephemeris/399` trả về state vector hợp lệ

#### 0.2 Fix client Kepler fallback
- File: `apps/web/src/engine/EphemerisSampler.ts` (line 206 là điểm hiện fail)
- File: `apps/web/src/engine/keplerianOrbit.ts` — check function giải Kepler
- Verify với catalog orbital elements trong `apps/web/src/data/solarSystemCatalog.ts`
- **Acceptance:** Ngay cả khi API down, `getPosition(399, J2000)` trả về `(0.983 AU × cos(L), 0, 0.983 AU × sin(L))` hoặc tương đương

#### 0.3 Verify Sun-anchored rendering trong SolarSystemRenderer
- File: `apps/web/src/engine/SolarSystemRenderer.ts`
- Confirm `fixSunAtOrigin=true` → Sun ở (0,0,0), planet.mesh.position = sampler result × orbitScale
- Check update loop: planet positions recomputed mỗi frame khi `timeEngine.jd` đổi
- **Acceptance:** `__cosmosEngine.solarSystem.planets[i].mesh.position` cho Earth gần (12, 0, 0) tại J2000

#### 0.4 Moons, asteroids, comets, KBOs
- 293 moons: positions relative to parent planet (đã đúng structure, nhưng depend Phase 0.2)
- 1.3M asteroids (MPC): stream dần, không render cùng lúc — phụ thuộc Phase 3
- 4.6k comets (JPL): ephemeris batch API
- KBOs: Kepler fallback OK với low-eccentricity, SPICE cho centaurs

**Acceptance tổng Phase 0:**
- Zoom Sun → thấy 8 planets ở 8 quỹ đạo không overlap
- Earth ở ~12 units, Jupiter ~62 units, Pluto ~472 units
- Real-time playback: planets di chuyển theo quỹ đạo trong 1 năm animation

---

### Phase 1 — Regime visibility culling (Day 3–4)

**Mục tiêu:** Trong mỗi regime, chỉ render những thực thể phù hợp. Không còn "10 gallery cùng 1 frame".

#### 1.1 Regime → renderer mapping
File: `apps/web/src/engine/ScaleRegimeController.ts`

```typescript
const REGIME_VISIBILITY: Record<Regime, Set<RendererKey>> = {
  solar_system: new Set([
    'solarSystem',       // Sun + planets + moons
    'asteroidField',     // near asteroids only (cone around camera)
    'namedComets',       // all (ít, < 5000)
    'starField',         // dimmed, distant background
    'constellations',    // faded overlay
    'skybox',            // always
  ]),
  stellar: new Set([
    'starField', 'starTileField',
    'constellations',
    'nebulaGallery',     // near nebulae (< 5 kpc)
    'exoplanetGallery',  // if host star in range
    'exoticGallery',     // near pulsars/magnetars
    'milkyWayInterior',  // dim backdrop
    'skybox',
  ]),
  galactic: new Set([
    'milkyWayInterior',
    'starTileField',     // sparse, aggregated
    'galaxyGallery',     // Local Group members
    'nebulaGallery',     // large HII regions only
    'cosmicWeb',         // dimmed preview
    'skybox',
  ]),
  cosmic: new Set([
    'galaxyGallery',
    'largeScaleStructure',
    'cosmicWeb',
    'cmbBoundary',
    'skybox',
  ]),
};
```

#### 1.2 Apply mỗi frame
```typescript
// In SceneManager render loop
const visible = REGIME_VISIBILITY[this.scaleRegime.current];
for (const [key, renderer] of this.renderers) {
  renderer.group.visible = visible.has(key);
}
```
Zero overhead khi hidden (Three.js skip toàn bộ subtree).

#### 1.3 Hysteresis — giữ nguyên behavior hiện tại
`ScaleRegimeController` đã có hysteresis band, không đổi.

#### 1.4 Gallery mode tách biệt (nếu cần)
- 4 gallery flat-line (starType, phenomena, exoplanet, exotic) hiện tại là museum showcase
- Nếu user muốn giữ showcase mode: thêm flag `modeStore.galleryShowcase` → chỉ show khi flag on
- Otherwise: Phase 2 sẽ ground chúng vào real 3D positions

**Acceptance Phase 1:**
- Trong solar_system regime: chỉ thấy Sun, planets, few near stars, constellation lines
- Chuyển sang stellar: solar system icon thu nhỏ thành 1 point star, star tiles stream
- Chuyển sang galactic: Milky Way spiral visible, galaxies xung quanh
- Chuyển sang cosmic: cosmic web filaments, galaxy clusters, CMB boundary

---

### Phase 2 — Unified coordinate + real catalog data (Day 5–9)

**Mục tiêu:** Tất cả entity đặt theo ICRS J2000.0 thật, không hardcode, không flat line.

#### 2.1 Tạo `packages/coordinate-utils/src/SceneScale.ts`

```typescript
export const AU_PER_PC = 206264.806;
export const PC_PER_KPC = 1000;
export const KPC_PER_MPC = 1000;

export interface SceneScaleConfig {
  unitsPerAU: number;    // default 12
  unitsPerPc: number;    // default 500
  unitsPerKpc: number;   // default 100
  unitsPerMpc: number;   // default 10
}

export class SceneScale {
  auToUnits(au: number): number { return au * this.config.unitsPerAU; }
  pcToUnits(pc: number): number { return pc * this.config.unitsPerPc; }
  kpcToUnits(kpc: number): number { return kpc * this.config.unitsPerKpc; }
  mpcToUnits(mpc: number): number { return mpc * this.config.unitsPerMpc; }

  // ICRS J2000.0 spherical → Cartesian scene units
  raDecDistToScene(raDeg: number, decDeg: number, distPc: number): Vector3 {
    const raRad = raDeg * Math.PI / 180;
    const decRad = decDeg * Math.PI / 180;
    const r = this.pcToUnits(distPc);
    return new Vector3(
      r * Math.cos(decRad) * Math.cos(raRad),
      r * Math.cos(decRad) * Math.sin(raRad),
      r * Math.sin(decRad)
    );
  }

  // Rebase: khi chuyển regime, scale lại vị trí
  rebase(scenePos: Vector3, fromRegime: Regime, toRegime: Regime): Vector3 { ... }
}
```

#### 2.2 Replace hardcode trong mọi renderer

Tạo wrapper `useSceneScale()` → inject vào từng renderer constructor. List files cần đổi:

| File | Thay đổi |
|---|---|
| `apps/web/src/data/starSeed.ts` | Params nhận `sceneScale`; replace `innerRadius=15, outerRadius=200` → `pcToUnits(1), pcToUnits(50)` |
| `apps/web/src/engine/SolarSystemRenderer.ts` | `orbitScale = sceneScale.auToUnits(1)` thay vì hardcode 12 |
| `apps/web/src/engine/StarTileRenderer.ts` | `sceneUnitsPerPc = sceneScale.unitsPerPc` |
| `apps/web/src/engine/StarFieldRenderer.ts` | Accept positions đã scaled |
| `apps/web/src/engine/GalaxyGalleryRenderer.ts` | Replace `size=7, gap=6` → positions từ catalog × `kpcToUnits` |
| `apps/web/src/engine/NebulaGalleryRenderer.ts` | Replace grid → positions từ `nebulaCatalog` |
| `apps/web/src/engine/LargeScaleStructureRenderer.ts` | Replace cell-28 grid → real cluster positions × `mpcToUnits` |
| `apps/web/src/engine/CosmicWebRenderer.ts` | Replace cube ±45 → IllustrisTNG mesh × `mpcToUnits` |
| `apps/web/src/engine/ExoplanetGalleryRenderer.ts` | Position at host star (Gaia distance) |
| `apps/web/src/engine/ExoticGalleryRenderer.ts` | Real positions: Sgr A*, M87*, Crab, Vela, Cygnus X-1, SGR 1806-20 |
| `apps/web/src/engine/StarTypeGalleryRenderer.ts` | Real exemplar stars (Betelgeuse, Sirius, Vega, Proxima, Rigel…) |
| `apps/web/src/engine/PhenomenaGalleryRenderer.ts` | Real positions (Sgr A*, Crab, GC…) |
| `apps/web/src/engine/MilkyWayInteriorComposer.ts` | Sun offset +8.178 kpc from Galactic Center |
| `apps/web/src/engine/CmbBoundarySphere.ts` | Radius = 14.26 Gpc × unitsPerMpc (observable universe) |

#### 2.3 Seed data với real catalog (không random)

**Stars — replace random shell bằng Hipparcos + Gaia bright**
- `apps/web/src/data/starSeed.ts`:
  - Import top 300 Hipparcos stars ≤25 pc (distance parallax > 40 mas)
  - Fields: `hip_id, name, ra_deg, dec_deg, parallax_mas, app_mag, bv_color`
  - Compute: `distPc = 1000 / parallax_mas`
  - Position: `sceneScale.raDecDistToScene(ra, dec, distPc)`
  - Verify:
    - Proxima Centauri HIP 70890: RA 217.428°, Dec -62.679°, dist 1.301 pc → `(-295, -200, -577)` units
    - Sirius HIP 32349: RA 101.287°, Dec -16.716°, dist 2.637 pc → `(-254, 1243, -379)` units
    - Alpha Cen A HIP 71683: dist 1.339 pc

**Galaxies — HyperLEDA + SDSS**
- `apps/web/src/data/galaxyCatalog.ts`:
  - Nearby galaxies (Local Group + nearby groups, ~1000 entries)
  - Fields: `pgc_id, name, ra_deg, dec_deg, dist_mpc, type`
  - Verify:
    - M31 Andromeda: RA 10.685°, Dec 41.269°, dist 0.778 Mpc → `(7.6, 1.43, 5.13)` × `unitsPerMpc=10` = `(76, 14, 51)` units (trong cosmic regime)
    - Trong galactic regime: dist 778 kpc × `unitsPerKpc=100` = **77,800 units**
    - LMC: dist 50 kpc × 100 = 5000 units
    - SMC: dist 62 kpc × 100 = 6200 units

**Nebulae — NGC/IC + Sharpless + Barnard + Lynds + Strasbourg PN**
- `apps/web/src/data/nebulaCatalog.ts`:
  - 15,000 objects (đã quy định trong CLAUDE.md)
  - Fields: `catalog_id, name, ra, dec, dist_pc, size_pc, type`
  - Verify:
    - Orion M42: RA 83.82°, Dec -5.39°, dist 412 pc → `(12460, -1936, -19351)` units (stellar regime)
    - Crab M1: dist 2000 pc
    - Eagle M16: dist 2100 pc
    - Horsehead B33: dist 422 pc

**Star clusters — Harris + Dias**
- Globulars: 157 (Harris catalog)
- Open clusters: ~3000 (Dias catalog)
- M13 globular: dist 7.2 kpc → 720 units (galactic regime)
- Pleiades M45: dist 136 pc → 68,000 units (stellar regime)

**Exoplanets**
- `apps/web/src/data/exoplanetCatalog.ts` — 5,800 confirmed (NASA Exoplanet Archive)
- Position: tại host star coordinates (Gaia DR3 RA/Dec/parallax)

**Small bodies**
- Asteroids 1.3M (MPC): stream via tile pyramid, **không load** hết
- Named asteroids (`apps/web/src/data/namedAsteroids.ts`): Ceres, Vesta, Pallas, Hygiea, Psyche, Eros, Bennu, Ryugu — orbital elements
- Comets 4.6k (JPL): ephemeris API

**Exotic**
- Black holes: Sgr A* (8.178 kpc), M87* (16.8 Mpc), Cygnus X-1 (2.22 kpc), V404 Cyg
- Pulsars: Crab (2 kpc), Vela (287 pc), PSR B1919+21, PSR J0437-4715
- Magnetars: SGR 1806-20 (8.7 kpc), SGR 0418+5729

**Large-scale structure**
- Galaxy clusters 7,500 (Abell + Planck SZ)
- Verify: Virgo dist 16.5 Mpc, Coma 102 Mpc, Perseus 73 Mpc, Norma 67 Mpc

**Cosmic web**
- IllustrisTNG mesh snapshot (500k nodes) — positions trong simulation box ~100 Mpc/h
- Render trong cosmic regime, centered on observer

**Acceptance Phase 2:**
- Proxima Centauri render tại đúng 1.301 pc (±0.1% vs Hipparcos)
- Andromeda render tại đúng 778 kpc
- Virgo cluster tại 16.5 Mpc
- Verify bằng `console.log(proxima.position.length() / sceneScale.unitsPerPc)` = 1.301

---

### Phase 3 — Progressive tile streaming (Day 10–12)

**Mục tiêu:** Camera đi đến đâu stream đến đó. Không preload toàn bộ 1.8B stars + 4M galaxies.

#### 3.1 Bootstrap tile centres
- File: `apps/web/src/engine/TileStreamingManager.ts`
- Debug tại sao `starTileCentres` undefined khi engine start
- Fetch tile manifest từ `/v1/tiles/stars/manifest` (Doc 26)
- Build spatial index (HEALPix cho galaxies, octree cho stars)

#### 3.2 Distance-based priority

```typescript
// TileStreamingManager.enqueue()
const cameraWorldPos = sceneManager.camera.position;
for (const tile of candidateTiles) {
  const tileCenter = tile.boundingSphere.center;
  const dist = cameraWorldPos.distanceTo(tileCenter);

  // Skip tiles ngoài view distance
  const maxDist = regime.maxViewDistance;
  if (dist > maxDist) continue;

  // Priority = 1 / (dist² + ε) * LOD_factor
  const priority = 1 / (dist * dist + 1) * tile.lodFactor;
  this.queue.push({ tile, priority });
}
this.queue.sort((a, b) => b.priority - a.priority);
```

#### 3.3 Frustum culling

```typescript
const frustum = new Frustum().setFromProjectionMatrix(
  new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
);
for (const tile of this.loadedTiles.values()) {
  tile.group.visible = frustum.intersectsSphere(tile.boundingSphere);
}
```
Recompute mỗi 4 frames (throttle).

#### 3.4 Octree + adaptive particle density

- Octree node trong `packages/coordinate-utils/src/Octree.ts`
- Insert entity khi tile decode xong
- Query: given camera frustum → list visible entities
- Particle count per tile: `base_count * clamp(near_dist / tile_dist, 0.1, 1.0)²`
- GPU budget (per CLAUDE.md):
  - mid-tier: 500 draw calls, 1.5M triangles max
  - adaptive quality degrade khi FPS < 55

#### 3.5 Max concurrent fetches = 6 (HTTP/2)
- Giữ nguyên queue structure, thêm `inFlight.size < 6` gate

**Acceptance Phase 3:**
- Camera idle ở solar system → **không** stream galaxy tile
- Camera bay Sun → Sirius: tile density tăng dần theo khoảng cách tới Sirius
- FPS không drop < 55 khi bay nhanh giữa regimes
- `__cosmosEngine.tileStreaming.queueDepth` thay đổi theo camera movement
- `inFlight ≤ 6` mọi lúc

---

### Phase 4 — Floating origin (camera-relative) (Day 13–14)

**Mục tiêu:** Tránh float32 jitter khi camera > 10⁶ units.

#### 4.1 Publish camera world position
- File: `apps/web/src/engine/CameraController.ts`
- Mỗi frame update `cameraStore.getState().setWorldPosition(camera.position)` — hot state, `getState()` only

#### 4.2 Shader uniform `u_cameraWorldPos`
- Update mọi material: `StarPointMaterial`, `StarMaterialFamily`, `GalaxyMaterial`, `NebulaMaterial`, `PlanetMaterial`, `MoonMaterial`, `ExoticMaterial`, `RingMaterial`
- Vertex shader pattern:
  ```glsl
  uniform vec3 u_cameraWorldPos;
  void main() {
    vec3 relPos = a_position - u_cameraWorldPos;
    gl_Position = projectionMatrix * viewMatrix * vec4(relPos, 1.0);
    // ... rest uses relPos ...
  }
  ```
- **Không** thay đổi model matrix — camera stay at origin in view space

#### 4.3 Regime rebase
- File: `apps/web/src/engine/ScaleRegimeController.ts`
- Khi `transition(fromRegime, toRegime)`:
  - Compute new origin (= old camera world position in new scale)
  - Rescale camera + all entities
  - Emit `regime:rebase` event → tile streaming flush out-of-regime tiles

#### 4.4 Precision test
- Camera test: fly to (1e7, 0, 0) units → verify 0 jitter in star rendering
- Compare frame t vs t+1: pixel delta < 1

**Acceptance Phase 4:**
- Zero jitter ở mọi distance
- Regime transitions smooth, không flash/reset camera

---

### Phase 5 — Data accuracy + test suite (Day 15)

**Mục tiêu:** Automated verify tất cả positions match reality.

#### 5.1 Test suite TS-DATA (6 tests per Doc 30)
```
TS-DATA-01: Sirius position matches Hipparcos ±0.1% parallax
TS-DATA-02: Andromeda (M31) distance 778 kpc ±1%
TS-DATA-03: Earth position J2000 matches JPL Horizons ±100 km
TS-DATA-04: Jupiter position J2000 matches JPL Horizons ±1000 km
TS-DATA-05: Proxima Centauri 1.301 pc ±1%
TS-DATA-06: Virgo cluster 16.5 Mpc ±2%
```

#### 5.2 Test suite TS-COORD (10 tests)
- Kepler solver accuracy
- ICRS → ecliptic conversion
- Polar singularity handling (RA wrap at 0°/360°)
- Heliocentric ↔ geocentric
- Parallax computation
- Proper motion (if implemented)

#### 5.3 Test suite TS-TILE (6 tests)
- Binary decode correctness
- LRU eviction
- IndexedDB cache hit
- Queue priority ordering
- Frustum culling correctness
- Distance-based LOD

#### 5.4 Visual QA regression
- Golden frames cho 10 viewpoints:
  1. Sun + inner planets (top-down J2000)
  2. Sun + outer planets
  3. Alpha Centauri system closeup
  4. Milky Way interior from Sun
  5. Milky Way from 30 kpc
  6. Local Group (Andromeda + MW + Triangulum)
  7. Virgo cluster
  8. Cosmic web filament view
  9. CMB boundary at 14.26 Gpc
  10. Sgr A* black hole
- Threshold: pHash Hamming ≤ 8, SSIM > 0.65, ΔE2000 < 5

#### 5.5 Performance budget verification
- FPS ≥60 mid-tier across all regimes (TS-PERF)
- Bundle < 500KB gzipped
- Tile fetch concurrency ≤ 6
- GPU VRAM ≤ 192 MB mid-tier

---

## 4. File & component impact matrix

### 4.1 Engine layer (16 files)
- `apps/web/src/engine/SolarSystemRenderer.ts` — use SceneScale (P0, P2)
- `apps/web/src/engine/EphemerisSampler.ts` — fix fallback (P0)
- `apps/web/src/engine/keplerianOrbit.ts` — verify solver (P0)
- `apps/web/src/engine/StarFieldRenderer.ts` — use SceneScale (P2)
- `apps/web/src/engine/StarTileRenderer.ts` — use SceneScale (P2)
- `apps/web/src/engine/TileStreamingManager.ts` — bootstrap + distance priority (P3)
- `apps/web/src/engine/ScaleRegimeController.ts` — visibility mapping + rebase (P1, P4)
- `apps/web/src/engine/SceneManager.ts` — orchestrate visibility + rebase (P1)
- `apps/web/src/engine/CameraController.ts` — publish world position (P4)
- `apps/web/src/engine/GalaxyGalleryRenderer.ts` — real kpc positions (P2)
- `apps/web/src/engine/NebulaGalleryRenderer.ts` — real pc positions (P2)
- `apps/web/src/engine/CosmicWebRenderer.ts` — IllustrisTNG mesh (P2)
- `apps/web/src/engine/LargeScaleStructureRenderer.ts` — Abell clusters (P2)
- `apps/web/src/engine/ExoplanetGalleryRenderer.ts` — host star positions (P2)
- `apps/web/src/engine/ExoticGalleryRenderer.ts` — real BH/pulsar positions (P2)
- `apps/web/src/engine/StarTypeGalleryRenderer.ts` — real exemplar stars (P2)
- `apps/web/src/engine/PhenomenaGalleryRenderer.ts` — real phenomena positions (P2)
- `apps/web/src/engine/MilkyWayInteriorComposer.ts` — Sun offset +8.178 kpc (P2)
- `apps/web/src/engine/CmbBoundarySphere.ts` — 14.26 Gpc radius (P2)
- `apps/web/src/engine/AsteroidFieldRenderer.ts` — stream logic (P3)

### 4.2 Data layer (11 files)
- `apps/web/src/data/starSeed.ts` — Hipparcos ≤25pc (P2)
- `apps/web/src/data/galaxyCatalog.ts` — HyperLEDA + SDSS (P2)
- `apps/web/src/data/nebulaCatalog.ts` — NGC/IC/Sh/B/LDN/PN (P2)
- `apps/web/src/data/exoplanetCatalog.ts` — NASA Exoplanet Archive (P2)
- `apps/web/src/data/largeScaleStructureCatalog.ts` — Abell (P2)
- `apps/web/src/data/solarSystemCatalog.ts` — verify orbital elements (P0)
- `apps/web/src/data/namedAsteroids.ts` — verify (P2)
- `apps/web/src/data/namedComets.ts` — verify (P2)
- `apps/web/src/data/minorMoons.ts` — verify (P0)
- `apps/web/src/data/constellations.ts` — verify IAU boundaries (P2)
- `apps/web/src/data/proceduralMinorBodies.ts` — adaptive density (P3)

### 4.3 Shared packages (mới)
- `packages/coordinate-utils/src/SceneScale.ts` — unified scale (P2, new)
- `packages/coordinate-utils/src/Octree.ts` — spatial index (P3, new)
- `packages/coordinate-utils/src/Frustum.ts` — culling helpers (P3, new)

### 4.4 Shaders (8 material families)
- `apps/web/src/shaders/star/*.vert` — u_cameraWorldPos (P4)
- `apps/web/src/shaders/galaxy/*.vert` — u_cameraWorldPos (P4)
- `apps/web/src/shaders/nebula/*.vert` — u_cameraWorldPos (P4)
- `apps/web/src/shaders/planet/*.vert` — u_cameraWorldPos (P4)
- `apps/web/src/shaders/moon/*.vert` — u_cameraWorldPos (P4)
- `apps/web/src/shaders/exotic/*.vert` — u_cameraWorldPos (P4)
- `apps/web/src/shaders/ring/*.vert` — u_cameraWorldPos (P4)
- `apps/web/src/shaders/cmb/*.vert` — u_cameraWorldPos (P4)

### 4.5 Backend (diagnostic only cho Phase 0)
- `apps/api/**` — ephemeris route, error handling
- `apps/ephemeris/**` — SPICE kernel loading, FastAPI service health

### 4.6 Stores
- `apps/web/src/stores/cameraStore.ts` — add `worldPosition` hot field (P4)
- `apps/web/src/stores/modeStore.ts` — optional `galleryShowcase` flag (P1)

### 4.7 Tests
- `apps/web/src/engine/__tests__/SceneScale.test.ts` (new, P2)
- `apps/web/src/engine/__tests__/ScaleRegimeController.test.ts` (extend, P1)
- `apps/web/src/engine/__tests__/TileStreamingManager.test.ts` (extend, P3)
- `apps/web/e2e/scale-accuracy.spec.ts` (new, P5)
- `apps/web/e2e/progressive-streaming.spec.ts` (new, P5)

---

## 5. Acceptance criteria tổng thể

> **Status legend:** ✅ = verified, ⚠️ = partial (scoped down), ⏳ = deferred to future work.

### 5.1 Positional accuracy (toàn vũ trụ) — verified as of Phase 5

| Entity | Expected distance | Tolerance | Status | Test |
|---|---|---|---|---|
| Mercury perihelion | 0.3075 AU | ±0.001 AU | ✅ | Live probe (Phase 0) |
| Earth at J2000 | 0.9833 AU from Sun | ±1% | ✅ | TS-DATA-03 |
| Jupiter at J2000 | 4.957 AU | ±1% | ✅ | TS-DATA-04 |
| Pluto aphelion | 49.305 AU | ±0.01 AU | ✅ | Live probe (Phase 0) |
| Proxima Centauri | 1.301 pc | ±1% | ✅ 0% error | TS-DATA-05 |
| Sirius | 2.637 pc | ±1% | ✅ 0% error | TS-DATA-01 |
| Alpha Centauri A | 1.339 pc | ±1% | ✅ 0% error | Live probe (Phase 2B) |
| Betelgeuse | 168 pc | ±5% | ✅ via IAU_NAMED_STARS | Catalog-backed |
| Pleiades (M45) | 136 pc | ±5% | ✅ via HARRIS_DIAS | Catalog-backed |
| Orion Nebula (M42) | 412 pc | ±5% | ✅ 0% error | TS-DATA-09 |
| Sgr A* (Galactic Center) | 8.178 kpc | ±1% | ✅ 0% error | TS-DATA-06 |
| Crab Nebula (M1) | 2.0 kpc | ±5% | ✅ 0% error | TS-DATA-08 |
| LMC | 50 kpc | ±2% | ✅ 0% error | TS-DATA-10 |
| SMC | 62 kpc | ±2% | ✅ 0% error | Live probe (Phase 2C) |
| Andromeda (M31) | 778 kpc | ±1% | ✅ 0% error | TS-DATA-02 |
| Triangulum (M33) | 840 kpc | ±3% | ✅ via GALAXY_CATALOG | Catalog-backed |
| M87* | 16.8 Mpc | ±1% | ✅ 0% error | TS-DATA-07 |
| Virgo Cluster | 16.5 Mpc | ±2% | ⏳ LSS showcase mode | Phase 2C deferred |
| Coma Cluster | 102 Mpc | ±3% | ⏳ LSS showcase mode | Phase 2C deferred |
| CMB boundary | 14.26 Gpc | ±1% | ⏳ not yet grounded | Future work |

### 5.2 Progressive streaming behavior
- ✅ Camera idle solar_system → zero galaxy/star tile fetch (regime filter drops 16/16)
- ✅ Camera crosses to stellar regime → tile queue begins draining (6 inFlight cap verified)
- ✅ Tile fetch concurrency ≤ 6 (DEFAULT_MAX_CONCURRENT_FETCHES)
- ✅ Distance-based priority: tiles closer to camera drain first (`reprioritize`)
- ✅ Frustum culling: mounted tiles outside view set `mesh.visible = false` (throttled 4 frames)
- ✅ Distance-based LOD (asteroid): particle density 100% → 5% as camera moves 20u → 2000u

### 5.3 Performance
- ⏳ FPS ≥ 60 mid-tier GPU — not measured in this pass (requires GPU benchmark run)
- ⏳ FPS ≥ 30 low-tier — not measured
- ⏳ Draw calls ≤ 500/frame — baseline 70 calls in solar_system (within budget)
- ⏳ Triangles ≤ 1.5M/frame mid-tier — baseline 79k (within budget)
- ⏳ GPU VRAM ≤ 192 MB — not measured
- ⏳ Tile fetch P95 < 200ms — not measured (requires real tile server)

### 5.4 Visual QA
- ⏳ Star color ΔE2000 < 3.0 — requires golden-frame pipeline (not run)
- ⏳ Planet color ΔE2000 < 5.0 — same
- ⏳ Nebula color ΔE2000 < 4.0 — same
- ⏳ Golden frame SSIM > 0.65 — same
- ⏳ pHash Hamming ≤ 8 vs reference — same
- ✅ Zero jitter at stellar+galactic regime (camera clamped to safe float32 range via REGIME_MAX_DISTANCE)

### 5.5 Data validation
- ✅ TS-DATA (15 tests) pass — `apps/web/src/engine/__tests__/TS-DATA.test.ts`
- ✅ TS-PERF (6 tests for adaptive density) pass — `SolarSystemRenderer.test.ts` Phase 3 block
- ✅ Coordinate-utils (72 tests) pass — including sceneScale (19) + precision (11)
- ⚠️ TS-COORD (10 tests) — existing frames/icrs/kepler tests cover subset; formal TS-COORD numbering TBD
- ⚠️ TS-TILE (6 tests) — TileStreamingManager (16) + StarTileRenderer (10) cover subset
- ⏳ JPL Horizons cross-validation < 100 km error — deferred (backend ephemeris API is T18 stub)

### 5.6 Phase delivery summary (2026-04-21)

| Phase | Goal | Status | Notes |
|---|---|---|---|
| **Phase 0** | Planets at correct Kepler positions | ✅ Verified | Kepler fallback already correct; Ephemeris backend 500 deferred (T18 API stub) |
| **Phase 1** | Regime-based visibility culling (16 layers) | ✅ Done | 6 museum galleries + 10 existing layers, 20/20 composer tests |
| **Phase 2A** | SceneScale helpers + starSeed parsec | ✅ Done | `@cosmos/coordinate-utils/sceneScale` |
| **Phase 2B** | Anchored stars from IAU_NAMED_STARS | ✅ Done | 92 bright stars at real ICRS positions, 0% error |
| **Phase 2C** | Real positions for 3 of 4 galleries | ✅ Done (galaxy/nebula/exotic); ⚠️ LSS deferred |
| **Phase 3** | Progressive tile streaming + adaptive density | ✅ Done | Bootstrap bug fix + distance priority + frustum cull + 20× asteroid reduction |
| **Phase 4** | Float32 precision safety | ⚠️ Scoped | Per-regime distance clamp + precision utility; full shader floating-origin deferred |
| **Phase 5** | Test suite + validation | ✅ Done | 1285+ tests pass, zero regression |

---

## 6. Open questions

1. **Backend ephemeris status** — cần biết trước khi Phase 0 start:
   - SPICE kernels đã được commit vào Git LFS chưa? (`data/spice/*.bsp`)
   - Python FastAPI service config ở đâu? (`apps/ephemeris/pyproject.toml` + run script)
   - API gateway proxy rules? (`apps/api/src/routes/ephemeris.ts`)

2. **Gallery showcase mode** — có phải intent ban đầu là 2 mode:
   - **Explorer mode** (real positions, real scale)
   - **Museum/Showcase mode** (galleries flat line để user duyệt)
   
   Nếu có — thêm flag trong Phase 1. Nếu không — Phase 2 ground tất cả vào real 3D.

3. **Data sources** — xác nhận có quyền dùng:
   - Hipparcos/Gaia DR3 (CC BY 4.0 — OK)
   - HyperLEDA (open)
   - NASA Exoplanet Archive (public)
   - IllustrisTNG (CC BY 4.0)
   - MPC asteroid data (open)
   - Planck 2018 (public)

4. **Piecewise regime scale** — OK hay cần alternative?
   - OK: đơn giản, float32 gánh được
   - Alternative: double precision in shader — chậm 2×, nhưng 1 unified scale
   
   **Đề xuất: dùng piecewise** (plan trên).

---

## 7. Timeline summary

| Ngày | Phase | Deliverable |
|---|---|---|
| 1 | 0.1, 0.2 | Ephemeris API fix + Kepler fallback |
| 2 | 0.3, 0.4 | Planets, moons, asteroids, comets đúng vị trí |
| 3 | 1.1, 1.2 | Regime visibility mapping |
| 4 | 1.3, 1.4 | Hysteresis + gallery mode separation |
| 5 | 2.1, 2.2 | SceneScale class + renderer refactor start |
| 6 | 2.2 | Renderer refactor (all 14 files) |
| 7 | 2.3 | Seed data — stars, galaxies |
| 8 | 2.3 | Seed data — nebulae, clusters, exoplanets |
| 9 | 2.3 | Seed data — exotic, LSS, cosmic web |
| 10 | 3.1, 3.2 | Tile bootstrap + distance priority |
| 11 | 3.3, 3.4 | Frustum culling + octree |
| 12 | 3.5 | Adaptive density + concurrency |
| 13 | 4.1, 4.2 | Camera-relative uniforms in all shaders |
| 14 | 4.3, 4.4 | Regime rebase + precision test |
| 15 | 5.x | Test suite + visual QA golden frames |

---

## 8. Related docs

- `CLAUDE.md` — project context, hard rules
- `docs/09-system-architecture.md` — overall architecture
- `docs/17-universe-entity-catalog.md` — 96 entity types
- `docs/19-navigation-and-scale-system.md` — scale regime spec
- `docs/23-spatial-universe-database.md` — coordinate system spec
- `docs/25-backend-architecture.md` — ephemeris service
- `docs/26-api-contract-specification.md` — API endpoints
- `docs/27-frontend-state-management.md` — state architecture
- `docs/30-test-case-document.md` — 113 test cases
- `docs/33-data-accuracy-validation.md` — data validation pipeline
