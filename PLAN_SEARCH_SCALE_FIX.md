# Plan Fix — Search Coverage, Fly‑To Distance & Visual Scale

> **Scope:** 4 triệu chứng user báo (2026‑04‑21):
> 1. Search bar không ra **Andromeda, Sirius, Sgr A\*, Europa, Halley, Orion…**
> 2. Click vào kết quả → vị trí/khoảng cách **sai**
> 3. Solar system **quá nhỏ, quá gần nhau** về mặt cảm nhận
> 4. Moons của planets **sai/thiếu**
>
> **Ngày tạo:** 2026‑04‑21
> **Bổ sung cho:** `PLAN_SCALE_FIX.md` (plan cũ fix positioning). Plan cũ đã xong phần Kepler & orbit; plan này tấn công **search + fly‑to + visual scale**, là ba thứ user thấy ngay.
> **Ước tính:** 6 ngày làm việc (~1 sprint).

---

## 1. Chẩn đoán — bằng chứng từ live preview

Live probe trên `http://localhost:5173` xác nhận 4 fact quan trọng (điểm 1.1–1.4) — **không phải tất cả vấn đề đều cùng 1 root cause**, mỗi triệu chứng cần fix riêng.

### 1.1 Planet positioning ĐÚNG — không phải bug

`__cosmosEngine.solarSystem.planets[i].group.position` tại JD J2000 cho:

| Planet | Scene position (u) | |r| scene | AU = |r|/12 | Kỳ vọng | Sai lệch |
|---|---|---|---|---|---|
| Mercury | (−1.56, −0.30, 5.37) | 5.59 | 0.466 | 0.307–0.467 AU | ✅ |
| Venus   | (−8.62, 0.49, 0.39) | 8.64 | 0.720 | 0.72 AU | ✅ 0% |
| Earth   | (−2.36, ~0, −11.56) | 11.80 | 0.983 | 0.983 AU | ✅ 0% |
| Mars    | (16.69, −0.41, 0.17) | 16.70 | 1.392 | 1.39 AU | ✅ 0.1% |
| Jupiter | (47.98, −1.22, −35.34) | 59.58 | 4.965 | 4.97 AU | ✅ 0.1% |
| Saturn  | (77.12, −4.44, −78.56) | 110.1 | 9.173 | 9.17 AU | ✅ 0% |
| Uranus  | (178.74, −2.91, 158.99) | 239.1 | 19.93 | 19.9 AU | ✅ 0.1% |
| Neptune | (199.10, 1.64, 302.48) | 362.1 | 30.18 | 30.1 AU | ✅ 0.3% |

**Kết luận:** Phase 0 của `PLAN_SCALE_FIX.md` đã xong đúng. Kepler fallback hoạt động. Planets, dwarfs, moons về đúng quỹ đạo heliocentric. **Không cần fix layer này.**

### 1.2 Local search index THIẾU 90% catalog

`apps/web/src/data/localSearchIndex.ts:89‑131` chỉ index **6 catalog**:

```
✅ SUN (1)
✅ PLANETS (8)
✅ DWARF_PLANETS (5)
✅ MAJOR_MOONS (21)
✅ NAMED_ASTEROIDS (~10)
✅ NOTABLE_EXOPLANETS (~20)
   = ~65 entries
```

**Thiếu** (user tìm không ra):

| Catalog | File | Entries | Ví dụ user thử |
|---|---|---|---|
| `IAU_NAMED_STARS` | `constellations.ts:510` | **91** | Sirius, Betelgeuse, Vega, Proxima, Polaris |
| `GALAXY_CATALOG` | `galaxyCatalog.ts:53` | **21** | **Andromeda (M31)**, M33, LMC, SMC, M87 |
| `NEBULA_CATALOG` | `nebulaCatalog.ts:66` | **30** | Orion (M42), Crab (M1), Eagle (M16), Horsehead |
| `EXOTIC_CATALOG` | `exoticCatalog.ts` | **11** | **Sgr A\***, M87\*, Cygnus X‑1, Crab pulsar |
| `NAMED_COMETS` | `namedComets.ts:60` | **7** | Halley, Hale‑Bopp, NEOWISE |
| `ALL_MINOR_MOONS` | `minorMoons.ts` | **~30** | Styx, Nix, Hydra, Metis, Thebe… |
| `LARGE_SCALE_STRUCTURE_CATALOG` | `largeScaleStructureCatalog.ts` | **47** | Virgo, Coma, Perseus clusters |
| `IAU_CONSTELLATIONS` | `constellations.ts:77` | **88** | Orion (constellation), UMa, Crux |

**Tổng thiếu:** ~325 thực thể có sẵn catalog nhưng **không bị index**. Đây là root cause #1 của "search không ra gì".

Ngoài ra không có **alias catalog‑id** (M31, M1, NGC224, HIP32349…) nên user gõ "M31" không ra.

### 1.3 Fly‑to deep‑sky IGNORE distance

`apps/web/src/engine/SceneManager.ts:1618‑1661` (`flyToCelestialCoord`):

```typescript
flyToCelestialCoord(
  raDeg: number,
  decDeg: number,
  _distancePc: number | null,   // ← underscore = explicitly unused!
  opts: { durationSec?: number } = {},
): boolean {
  ...
  const MARKER_DISTANCE = 120;   // ← hardcoded, mọi deep‑sky dùng chung
  const endTarget = dir.clone().multiplyScalar(MARKER_DISTANCE);
  const flyToArgs = { endTarget, orbitDistance: 40, ... };
```

Hệ quả:
- Click "Andromeda" (778 kpc) → camera bay tới **120 units** thay vì 778k × unitsPerKpc
- Click "Sirius" (2.637 pc) → camera bay tới **120 units** thay vì 2.637 × unitsPerPc = 1318 u
- Click "Sgr A\*" (8.178 kpc) → camera bay tới **120 units**
- Click "Proxima" (1.301 pc) → camera bay tới **120 units**

**Mọi deep‑sky landings đều ở cùng 1 điểm 120 units dọc theo direction vector.** Đây là root cause #2 của "click vào thì vị trí khoảng cách đều sai".

Comment tại line 1633‑1636 thừa nhận: *"Deep-sky objects have no mesh yet so we just anchor a viewing pose at 120u… The actual distance (Mpc, kpc) is informational — visualising it 1:1 would overshoot every scale regime."*

Nhưng thực tế SceneScale đã có piecewise regime rescale, nên việc "overshoot" KHÔNG còn đúng — fly‑to có thể chuyển regime và rebase, rồi đặt camera ở đúng distance trong scale mới.

### 1.4 Moons lite — 21 major thay vì 293

`SOLAR_SYSTEM_CATALOG` = SUN + PLANETS + DWARF_PLANETS + **MAJOR_MOONS (21)** + **ALL_MINOR_MOONS (~30)** + asteroids + comets.

Tổng moons hiện có ≈ **51**. CLAUDE.md §census yêu cầu **293 moons**. Thiếu ~242 moons (Jupiter có 95 moons nhưng catalog chỉ có Io/Europa/Ganymede/Callisto, Saturn có 146 moons nhưng catalog chỉ có 8 Titan‑class…).

Đây **không phải positioning bug** — 51 moons đang có đều ở đúng quỹ đạo. Chỉ là **data gap**.

### 1.5 Visual scale — inflation không cân bằng (perception issue)

Radius hiện tại:

| Body | Real radius (km) | Real/AU | Real scene (u) @12u/AU | Rendered (u) | Inflation |
|---|---|---|---|---|---|
| Sun | 696 000 | 0.00465 | **0.056** | 2.087 | **37×** |
| Jupiter | 69 911 | 0.000467 | 0.0056 | 1.398 | **250×** |
| Earth | 6 371 | 0.0000426 | 0.00051 | 0.600 | **1180×** |
| Mercury | 2 439 | 0.0000163 | 0.00020 | 0.600 | **3070×** |

Sun inflated **37×**, nhưng Earth inflated **1180×** → Sun/Earth rendered ratio = 3.48 nhưng real = 109. **Planets trông to quá so với Sun** từ góc nhìn user (cảm nhận "Sun nhỏ, planets đông đúc quanh Sun").

Đồng thời orbit tuyến tính đúng AU: Mercury@4.6u, Neptune@362u. Với camera ở 89u thấy Sun + 5 planets bên trong → cảm nhận "rất gần nhau" mặc dù orbit ratio đúng.

Đây là **tradeoff visibility ↔ accuracy** mặc định của Cosmos Explorer. Cần thêm một **"realistic mode" toggle** hoặc tune inflation profile.

### 1.6 Tile streaming chưa kick

`__cosmosEngine.tileStreaming.inFlight = 0`, không có `queueDepth`. Trong solar_system regime điều này **đúng** (REGIME_TILE_KINDS drop tất cả tile fetches) — không phải bug.

---

## 2. Root cause ranking

| # | Triệu chứng | Root cause | File:line | Độ phức tạp |
|---|---|---|---|---|
| 1 | "Search không ra Andromeda, Sirius, Sgr A\*" | Local index chỉ cover 6/14 catalog | `data/localSearchIndex.ts:89‑131` | **Low** |
| 2 | "Click kết quả → vị trí sai" | `flyToCelestialCoord` ignore distancePc, hardcode 120u | `engine/SceneManager.ts:1618‑1661` | **Medium** |
| 3 | "M31, NGC 224, Sirius B… không ra" | Không có alias + catalog ID index | `data/localSearchIndex.ts:96‑116` | **Low** |
| 4 | "Moons thiếu" | Catalog chỉ 51 moons thay vì 293 | `data/minorMoons.ts`, `solarSystemCatalog.ts:249` | **Medium** (data work) |
| 5 | "Sun quá to, planets vụn quanh" | Inflation Earth/Jupiter > Sun | `engine/SolarSystemRenderer.ts` (radius logic) | **Medium** |
| 6 | "Solar system quá nhỏ" | Initial camera 89u, thấy cả vòng Saturn | `engine/SceneManager.ts` init + defaultScene | **Low** |
| 7 | Search API 500 khi backend down | Expected behavior — local fallback hoạt động | — | **None** |

---

## 3. Kế hoạch — 4 Phase (6 ngày)

```
Phase A — Search coverage expansion               (Day 1–2) [P0 user‑facing]
Phase B — Fly‑to distance correctness             (Day 2–3) [P0 user‑facing]
Phase C — Moon catalog expansion                  (Day 4)   [P1]
Phase D — Visual scale rebalance + mode toggle    (Day 5–6) [P1]
```

---

### Phase A — Search coverage (Day 1–2) [P0]

**Mục tiêu:** `/search` autocomplete + full‑text trả về kết quả cho tất cả entity types user có thể tìm: stars, galaxies, nebulae, black holes, pulsars, moons, comets, asteroids, planets, constellations, galaxy clusters.

#### A.1 Mở rộng `IndexDoc` để chứa position/fly‑to payload

**File:** `apps/web/src/data/localSearchIndex.ts` — extend `IndexDoc` (line 65):

```typescript
interface IndexDoc {
  text: string;
  searchKey: string;
  aliases: readonly string[];
  ent_id: string;
  id: number | string;
  category: number;
  category_name: string;
  magnitude?: number;

  // NEW — position payload để SearchPanel có thể dispatch fly‑to đúng
  flyTarget:
    | { kind: 'naif'; naifId: number }                          // solar bodies
    | { kind: 'celestial'; raDeg: number; decDeg: number; distancePc: number }
    | { kind: 'constellation'; abbr: string }                   // special — fly to centroid
    | { kind: 'cluster'; raDeg: number; decDeg: number; distanceMpc: number };
}
```

#### A.2 Thêm 8 import nguồn catalog

Thay line 89–131:

```typescript
import { IAU_NAMED_STARS, IAU_CONSTELLATIONS } from './constellations';
import { GALAXY_CATALOG } from './galaxyCatalog';
import { NEBULA_CATALOG } from './nebulaCatalog';
import { EXOTIC_CATALOG } from './exoticCatalog';
import { NAMED_COMETS } from './namedComets';
import { ALL_MINOR_MOONS } from './minorMoons';
import { LARGE_SCALE_STRUCTURE_CATALOG } from './largeScaleStructureCatalog';
// existing: SUN, PLANETS, DWARF_PLANETS, MAJOR_MOONS, NAMED_ASTEROIDS, NOTABLE_EXOPLANETS
```

Add categories to CATEGORY map (line 33):

```typescript
const CATEGORY = {
  1: { id: 1, name: 'Stars' },
  2: { id: 2, name: 'Rocky planets' },
  3: { id: 3, name: 'Gas giants' },
  4: { id: 4, name: 'Moons' },
  5: { id: 5, name: 'Nebulae' },
  6: { id: 6, name: 'Galaxies' },
  7: { id: 7, name: 'Small bodies' },
  8: { id: 8, name: 'Large‑scale structure' },
  9: { id: 9, name: 'Exotic objects' },
  10: { id: 10, name: 'Constellations' },
} as const;
```

#### A.3 Index builder — gộp tất cả catalogs

```typescript
export function getLocalSearchIndex(): IndexDoc[] {
  if (cachedIndex) return cachedIndex;
  const docs: IndexDoc[] = [];

  // Solar bodies (existing path, just add minor moons)
  for (const body of [SUN, ...PLANETS, ...DWARF_PLANETS, ...MAJOR_MOONS, ...ALL_MINOR_MOONS]) {
    docs.push({
      text: body.name,
      searchKey: body.name.toLowerCase(),
      aliases: [String(body.naifId)],
      ent_id: `NAIF-${body.naifId}`,
      id: body.naifId,
      category: categoryForBody(body).id,
      category_name: categoryForBody(body).name,
      flyTarget: { kind: 'naif', naifId: body.naifId },
    });
  }

  // Named asteroids + named comets — same pattern
  for (const a of [...NAMED_ASTEROIDS, ...NAMED_COMETS]) {
    docs.push({ /* ... flyTarget: {kind:'naif',naifId:a.naifId} */ });
  }

  // IAU bright stars (91) — flyTarget uses ICRS + distance
  for (const s of IAU_NAMED_STARS) {
    const aliases = [
      s.bayer, s.flamsteed,
      s.hip ? `HIP${s.hip}` : null,
      s.hd ? `HD${s.hd}` : null,
    ].filter(Boolean).map(x => x!.toLowerCase());
    docs.push({
      text: s.name,
      searchKey: s.name.toLowerCase(),
      aliases,
      ent_id: `HIP-${s.hip}`,
      id: s.hip ?? s.name,
      category: 1, category_name: 'Stars',
      magnitude: s.magV,
      flyTarget: { kind:'celestial', raDeg:s.raDeg, decDeg:s.decDeg, distancePc:s.distancePc },
    });
  }

  // Galaxies (21) — alias: Messier number, NGC, PGC
  for (const g of GALAXY_CATALOG) {
    const aliases = [
      g.id,
      g.messier ? `M${g.messier}` : null,
      g.ngc ? `NGC${g.ngc}` : null,
      g.pgc ? `PGC${g.pgc}` : null,
      ...(g.aliases ?? []),
    ].filter(Boolean).map(x => x!.toLowerCase());
    docs.push({
      text: g.name, searchKey: g.name.toLowerCase(), aliases,
      ent_id: `GAL-${g.id}`, id: g.id,
      category: 6, category_name: 'Galaxies',
      magnitude: g.magnitude,
      flyTarget: { kind:'celestial', raDeg:g.ra_deg, decDeg:g.dec_deg, distancePc:g.distance_kpc * 1000 },
    });
  }

  // Nebulae (30) — same pattern
  // Exotic (11) — black holes, pulsars, magnetars
  // Large‑scale structure (47) — Abell/Virgo clusters, flyTarget kind:'cluster'
  // IAU constellations (88) — flyTarget kind:'constellation'
  //   (renderer will fly to centroid of constellation stars)

  cachedIndex = docs;
  return docs;
}
```

#### A.4 Category filter UI update

`apps/web/src/ui/SearchPanel.tsx` — thêm 4 category options (Nebulae, Galaxies, LSS, Exotic, Constellations) vào dropdown.

#### A.5 Search tests

Tạo/mở rộng `apps/web/src/data/__tests__/localSearchIndex.test.ts`:

- Assert `searchLocalAutocomplete('andromeda')` → 1 hit, ent_id `GAL-m31`, category 6
- Assert `searchLocalAutocomplete('sirius')` → 1 hit, magnitude −1.46
- Assert `searchLocalAutocomplete('sgr a')` or `'sagittarius a'` → Sgr A\* (exotic)
- Assert `searchLocalAutocomplete('m31')` → Andromeda (alias match)
- Assert `searchLocalAutocomplete('hip32349')` → Sirius
- Assert `searchLocalAutocomplete('europa')` → Europa (moon, not exoplanet)
- Assert `searchLocalAutocomplete('halley')` → Halley's Comet
- Assert `searchLocalAutocomplete('virgo cluster')` → Virgo cluster (LSS)
- Assert total index size ≥ 300

**Acceptance Phase A:**
- Search `andromeda` returns M31 (Galaxies, dist 778 kpc)
- Search `sirius` returns HIP32349 (Stars)
- Search `sgr a*` returns Sgr A* (Exotic)
- Search `orion` returns **two** rows: Orion Nebula (M42) + Orion Constellation
- Search `m` with category filter "Galaxies" shows M31, M33, M87, M81…
- Unit tests green, ≥ 300 entries indexed

---

### Phase B — Fly‑to distance correctness (Day 2–3) [P0]

**Mục tiêu:** Click search result → camera bay đến **đúng vị trí thật** trong scale regime thích hợp, không phải 120u hardcoded.

#### B.1 Rewrite `flyToCelestialCoord`

**File:** `apps/web/src/engine/SceneManager.ts:1618‑1661`

Thay vì hardcode `MARKER_DISTANCE = 120`, chuyển sang **regime‑aware target**:

```typescript
flyToCelestialCoord(
  raDeg: number,
  decDeg: number,
  distancePc: number | null,   // <- unused underscore removed
  opts: { durationSec?: number } = {},
): boolean {
  const ra = (raDeg * Math.PI) / 180;
  const dec = (decDeg * Math.PI) / 180;
  const cosDec = Math.cos(dec);
  const dir = new THREE.Vector3(cosDec * Math.cos(ra), cosDec * Math.sin(ra), Math.sin(dec));

  // Real scene position using current SceneScale + regime.
  //   distancePc === null  → fallback marker (e.g. constellation centroid)
  //   else compute scene distance in the regime that would host this object.
  const { scenePos, targetRegime, orbitDistance } =
    this.resolveCelestialScenePosition(dir, distancePc);

  // ICRS (X,Y,Z) → Three.js (X, Z, -Y)
  const endTarget = new THREE.Vector3(scenePos.x, scenePos.z, -scenePos.y);

  // Trigger regime transition BEFORE fly‑to starts so rebase happens first.
  if (targetRegime !== this.scaleRegime.current) {
    this.scaleRegime.requestTransitionTo(targetRegime);
  }

  const flyToArgs = { endTarget, orbitDistance, ... };
  // rest as before
}

private resolveCelestialScenePosition(
  dir: THREE.Vector3,
  distancePc: number | null,
): { scenePos: THREE.Vector3; targetRegime: Regime; orbitDistance: number } {
  if (distancePc == null) {
    // Constellation / sky direction only — use marker inside current regime.
    const marker = dir.clone().multiplyScalar(this.scaleRegime.markerDistance());
    return { scenePos: marker, targetRegime: this.scaleRegime.current, orbitDistance: 40 };
  }

  const scale = this.sceneScale;
  let distScene: number;
  let regime: Regime;
  if (distancePc < 6324) {                  // < 0.1 ly → still solar regime? no, stellar.
    regime = 'stellar';
    distScene = distancePc * scale.unitsPerPc;     // e.g. Sirius 2.637pc × 500 = 1318u
  } else if (distancePc < 30_660) {         // 100 kly boundary
    regime = 'galactic';
    distScene = (distancePc / 1000) * scale.unitsPerKpc;  // Sgr A* 8178pc → 8.178 × 100 = 818u
  } else {
    regime = 'cosmic';
    distScene = (distancePc / 1_000_000) * scale.unitsPerMpc;  // Andromeda 778000pc → 0.778 × 10 = 7.78u
  }
  const scenePos = dir.clone().multiplyScalar(distScene);
  // Orbit distance = 5–15 % of distScene so camera doesn't overshoot.
  const orbitDistance = Math.max(5, Math.min(distScene * 0.08, 2000));
  return { scenePos, targetRegime: regime, orbitDistance };
}
```

#### B.2 Wire SearchPanel fly dispatch

**File:** `apps/web/src/ui/SearchPanel.tsx:235‑317`

Thay 3 code paths hiện tại bằng switch trên `doc.flyTarget.kind`:

```typescript
switch (result.flyTarget?.kind) {
  case 'naif':
    requestFlyToEntity(result.flyTarget.naifId);
    break;
  case 'celestial':
    requestFlyToCelestialCoord(
      result.flyTarget.raDeg,
      result.flyTarget.decDeg,
      result.flyTarget.distancePc,
    );
    break;
  case 'cluster':
    requestFlyToCelestialCoord(
      result.flyTarget.raDeg,
      result.flyTarget.decDeg,
      result.flyTarget.distanceMpc * 1_000_000,  // Mpc→pc
    );
    break;
  case 'constellation':
    // Use centroid of constellation stars
    const centroid = constellationCentroid(result.flyTarget.abbr);
    requestFlyToCelestialCoord(centroid.raDeg, centroid.decDeg, null);
    break;
}
```

#### B.3 Ensure regime rebase does NOT teleport camera

`ScaleRegimeController.requestTransitionTo()` currently only sets the regime flag; it does not move entities (Phase 4 of old plan deferred). Để giữ kỳ vọng fly‑to mượt:

- Nếu `targetRegime === current`: chỉ cần fly‑to trong scene hiện tại.
- Nếu `targetRegime !== current`: transition ra **ngay trước** `controls.flyTo` — controls.flyTo dùng endTarget đã scaled theo scale regime mới. SceneManager cần re‑compute `endTarget` AFTER transition nếu scale changes. Thực tế dễ nhất: có 1 helper `convertScenePos(fromRegime,toRegime,pos)` dựa trên ratio unitsPerPc → unitsPerKpc.

**Safer path:** Fly‑to luôn happen **trong regime hiện tại**, convert `distancePc` → units theo scale regime **hiện tại**. Sau fly‑to kết thúc, `ScaleRegimeController.update()` thấy camera distance > ngưỡng → auto‑transit. Không cần force regime trong flyTo.

→ Implement **safer path** đầu tiên; defer full regime‑rebase tới Phase 4 của plan cũ.

#### B.4 Distance conversion unit tests

`apps/web/src/engine/__tests__/flyToCelestialCoord.test.ts` (new):

- Sirius (2.637 pc, stellar): endTarget |r| = 1318 u ±1%
- Andromeda (778000 pc, cosmic): endTarget |r| = 7.78 u (in cosmic regime scale) OR in current regime: if piecewise → use matching scale
- Constellation centroid fallback: |r| == `markerDistance()` of current regime
- Direction vector accuracy: RA 0° Dec 0° → (1,0,0), RA 90° Dec 0° → (0,1,0), Dec 90° → (0,0,1)

**Acceptance Phase B:**
- Click Andromeda → camera lands **gần M31 position** (not 120u)
- Click Sirius → camera lands tại 1318u from Sun (current stellar scale)
- Click Sgr A\* → camera lands tại 818u (galactic regime target)
- Distance displayed in InfoPanel matches catalog distance
- Unit tests green

---

### Phase C — Moon catalog expansion (Day 4) [P1]

**Mục tiêu:** Nâng từ 51 moons lên ≥ **150 moons** (covering ≥ 50% of known major satellites of Jupiter/Saturn/Uranus/Neptune/Pluto/Mars).

#### C.1 Enrich `minorMoons.ts`

Target counts (Doc 23 §8 reference):

| Parent | Known moons | Target in catalog |
|---|---|---|
| Mars | 2 | 2 ✅ |
| Jupiter | 95 | 30 (4 Galilean + 8 inner + 18 irregulars) |
| Saturn | 146 | 40 (8 Titan‑group + 10 inner + 22 irregulars) |
| Uranus | 28 | 20 |
| Neptune | 16 | 10 |
| Pluto/Charon | 5 | 5 ✅ |
| Eris | 1 | 1 |
| Haumea | 2 | 2 |
| Makemake | 1 | 1 |

Total target: **~110 moons** (≥ 2× current). Fetched from **JPL Horizons catalog** (Doc 25 §9) — orbital elements already standardised. List file pattern matches existing entries:

```typescript
export const ALL_MINOR_MOONS: readonly SolarSystemBody[] = [
  // Jupiter inner small satellites
  { naifId: 515, name: 'Amalthea', kind:'moon', parentNaifId:599, renderAs:'rocky_moon',
    orbit: { a_km: 181_366, e: 0.0031, i_deg: 0.374, ... } },
  // ... etc
];
```

#### C.2 Moon rendering already handles N moons

`SolarSystemRenderer.ts:296‑300` iterates `MAJOR_MOONS` + `ALL_MINOR_MOONS.filter(parentNaifId === body.naifId)`. No code change; just data.

#### C.3 Visual scale of moons

Line 474‑482: `moonOrbitScale * visualRadius / maxA` normalises farthest moon to the scale. Với 30 Jupiter moons, xa nhất ≈ Sinope at 23M km → moons near Jupiter (Metis 128k km) scale xuống rất nhỏ. **Optional:** log‑scale inflation để moons inner vẫn resolvable. Ghi Task sau cho Phase D.

**Acceptance Phase C:**
- `ALL_MINOR_MOONS.length + MAJOR_MOONS.length ≥ 130`
- Jupiter has ≥ 20 moons rendered
- All moons resolve via search (Phase A includes ALL_MINOR_MOONS)
- Existing TS‑DATA solar system test suite still green

---

### Phase D — Visual scale rebalance + realistic mode (Day 5–6) [P1]

**Mục tiêu:** Giải quyết cảm nhận "hệ mặt trời quá nhỏ, planets vụn quanh Sun".

#### D.1 Analysis — inflation hiện tại không cân bằng

Đo từ live runtime:

| Body | Real R (km) | Real R scene | Rendered R | Inflation |
|---|---|---|---|---|
| Sun | 696 000 | 0.056u | 2.087u | **37×** |
| Jupiter | 69 911 | 0.0056u | 1.398u | 250× |
| Earth | 6 371 | 0.00051u | 0.600u | **1180×** |
| Mercury | 2 439 | 0.00020u | 0.600u | **3070×** |

Đề xuất inflation profile thống nhất hơn:

**Option 1 — Log inflation** (visibility‑first, compact):
```
visualR = baseR_real * log10(R_real + 1) * k    (khá nhiều tuning)
```

**Option 2 — Piecewise clamp** (đơn giản, đủ):
```
visualR = max(minVisualR, realR * globalInflation)
  minVisualR = 0.3u    # floor for visibility
  globalInflation = 200   # consistent ratio
```

Với Option 2 (recommended):

| Body | realR_scene × 200 | After floor | Ratio vs Sun |
|---|---|---|---|
| Sun | 11.2u | 11.2u | 1.0 |
| Jupiter | 1.12u | 1.12u | 0.10 (real 0.103 ✅) |
| Earth | 0.102u | **0.3u** (floor) | 0.027 |
| Mercury | 0.040u | **0.3u** (floor) | 0.027 |

Sun bây giờ visibly dominant (11.2u) với Jupiter nhỏ hơn ~10× (đúng tỷ lệ), các rocky planet vẫn nhìn được (0.3u floor).

#### D.2 Add "Realistic scale" toggle trong Settings

`apps/web/src/stores/settingsStore.ts` — thêm:

```typescript
interface SettingsState {
  ...
  solarSystemScaleMode: 'default' | 'realistic' | 'educational';
}
```

- `default` (current behaviour) — planets inflated cao để luôn visible
- `realistic` (new) — Sun dominant, Option 2 profile, users có thể zoom để thấy planets
- `educational` (future) — textbook spacing với labels

#### D.3 Tune initial camera + fly‑to orbit distances

`apps/web/src/engine/SceneManager.ts` initial camera = `(−1, 40, 80)` → adjust to put user near Earth orbit first:

```typescript
// Default initial camera — Earth at 12u orbit, camera at (15, 4, 10) = ~19u from Sun
// shows Sun + inner rocky planets comfortably without Jupiter crowding frame.
camera.position.set(15, 4, 10);
controls.target.set(0, 0, 0);
```

Sau đó UI cho phép "zoom out" to see outer planets.

#### D.4 First‑Contact tour adjusts per mode

`apps/web/src/engine/tourCatalog.ts` — J1 First Contact step 1 (show solar system) should use `mode === 'realistic'` camera pose if toggle on.

#### D.5 Visual regression screenshots

Baseline screenshot cho mỗi mode × 3 viewpoints (inner, outer, full) → commit vào `apps/web/tests/visual/solarSystem-*.png`. Phase 5 của plan cũ đã có VQA pipeline (SSIM > 0.65).

**Acceptance Phase D:**
- Toggle Realistic mode → Sun visually dominant (≥ 8× wider than Jupiter), rocky planets still visible
- Initial camera pose comfortable for novice (inner planets visible, outer implied)
- Screenshot tests green
- Regression: Educator tour J1 step 1 still frames solar system properly

---

## 4. File impact matrix

| File | Phase | Delta |
|---|---|---|
| `apps/web/src/data/localSearchIndex.ts` | A | +150 LOC (imports, category map, index builder for 8 catalogs) |
| `apps/web/src/data/__tests__/localSearchIndex.test.ts` | A | +80 LOC (9 new assertions) |
| `apps/web/src/ui/SearchPanel.tsx` | A, B | +40 LOC (category options, flyTarget dispatch switch) |
| `apps/web/src/engine/engineBridge.ts` | B | No signature change; `distancePc` already in param |
| `apps/web/src/engine/SceneManager.ts` | B | ~60 LOC rewrite of `flyToCelestialCoord` + new `resolveCelestialScenePosition` helper |
| `apps/web/src/engine/__tests__/flyToCelestialCoord.test.ts` | B | New file ~100 LOC |
| `apps/web/src/data/minorMoons.ts` | C | +100 LOC (moon entries) |
| `apps/web/src/data/__tests__/solarSystemCatalog.test.ts` | C | Update expected counts |
| `apps/web/src/stores/settingsStore.ts` | D | +1 field + migration |
| `apps/web/src/engine/SolarSystemRenderer.ts` | D | ~30 LOC (visualRadius formula driven by scaleMode) |
| `apps/web/src/ui/SettingsPanel.tsx` | D | +1 control (scale mode dropdown) |
| `apps/web/tests/visual/solarSystem-*.png` | D | 3 baseline screenshots |

**Total estimated**: ~460 LOC code + ~230 LOC tests across **10 files**.

---

## 5. Risk & mitigation

| Risk | Likelihood | Mitigation |
|---|---|---|
| Search index > 500 entries causes UI slowness | Low | Current filter is O(N) substring match; at 500 entries ~0.2ms. If needed, add trigram index later. |
| `flyToCelestialCoord` distance > regime max causes float32 jitter | Medium | Clamp `distScene` to `regime.maxViewDistance`; deferred full fix = Phase 4 of old plan. |
| Moon orbit inflation formula overrides inner moons | Medium | `moonOrbitScale / maxA` logarithmic fallback — Task for Phase D.3. |
| Realistic scale mode breaks tour J1 framing | Medium | Tour steps use mode‑aware camera pose (Phase D.4). |
| Users search "black hole" (generic) not "Sgr A\*" | Medium | Add category synonyms: `{searchKey:'black hole', aliases: ['blackhole','bh']}` synthetic entry that expands into EXOTIC_CATALOG filter. |

---

## 6. Acceptance — toàn bộ 4 phase

User test scenarios (manual, post‑deploy):

1. **Search "andromeda"** → 1 result (M31, Galaxies, mag 3.44, dist 778 kpc). Click → camera bay to M31 direction at ~7700u (cosmic regime) hoặc appropriate scale. Info panel hiển thị distance.
2. **Search "sirius"** → Sirius (Stars, mag −1.46). Click → camera lands at 1318u in stellar regime.
3. **Search "sgr a*"** → Sgr A\* (Exotic). Click → camera lands at 818u.
4. **Search "europa"** → Europa (Moon of Jupiter). Click → camera bay to Europa position around Jupiter.
5. **Search "halley"** → Halley's Comet (Small bodies, naif 1000036 hoặc equiv).
6. **Search "orion"** → 2 results: Orion Nebula (M42, Nebulae) + Orion constellation (Constellations).
7. **Search "m31"** (catalog ID) → Andromeda (alias match).
8. **Solar system view** — toggle Realistic Mode → Sun becomes dominant, rocky planets still findable via search‑triggered fly‑to.
9. **Unit tests** — 1285+ existing tests remain green; new tests (~20) added for search + flyTo.

---

## 7. Đi vào vận hành

### Day‑by‑day delivery

| Day | Phase | Deliverable |
|---|---|---|
| 1 | A | localSearchIndex expanded to 8 catalogs, category map, flyTarget payload |
| 2 | A + B | Search UI category options; `flyToCelestialCoord` rewrite; first passes of unit tests |
| 3 | B | `resolveCelestialScenePosition` helper + tests + SearchPanel dispatch switch |
| 4 | C | Moon catalog expanded to ≥ 130 entries; tests updated |
| 5 | D | `solarSystemScaleMode` setting + radius formula update |
| 6 | D | Initial camera tuning + visual regression baselines + smoke E2E |

### Dependencies to old `PLAN_SCALE_FIX.md`

- **None blocking**. Old plan's Phase 0–2 (SceneScale + real catalog positions) is already merged. This plan consumes those primitives:
  - `SceneScale.unitsPerPc/unitsPerKpc/unitsPerMpc`
  - `ScaleRegimeController` transitions
  - `IAU_NAMED_STARS`, `GALAXY_CATALOG`, `NEBULA_CATALOG`, `EXOTIC_CATALOG` already exist with correct (ra, dec, distance) fields.

### What this plan does NOT fix (deferred)

- Backend ephemeris API returning 500 (ECONNREFUSED) — requires T18 SPICE service; Kepler fallback sufficient for UI.
- Full shader floating‑origin (Phase 4 of old plan, partial) — not user‑visible at current distances.
- IllustrisTNG cosmic web mesh — already rendered with placeholder positions; separate data work.
- 1.3M asteroid MPC tiles — Phase 3 of old plan ongoing (tile streaming works, data ingestion separate).
- 293 moons (full JPL list) — Phase C hits ~130, full 293 requires pipeline from Horizons.

---

## 8. Related

- `CLAUDE.md` — project rules (Zustand, Three.js r184, ICRS J2000.0)
- `PLAN_SCALE_FIX.md` — companion plan (positioning layer) — Phase 0–3 complete, Phase 4–5 partial
- `docs/17-universe-entity-catalog.md` — 96 entity types reference
- `docs/19-navigation-and-scale-system.md` — scale regime & hysteresis spec
- `docs/26-api-contract-specification.md` — `/search` endpoint contract
- `docs/30-test-case-document.md` — TS‑SEARCH (7 tests), TS‑DATA (15 tests)
