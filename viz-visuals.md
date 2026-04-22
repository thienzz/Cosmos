# viz-visuals.md — Full shader coverage for all entity types

> **Companion to [viz.md](viz.md) and [viz-tasks.md](viz-tasks.md).** This file describes the "visual coverage" phases — writing + polishing every GLSL shader so each entity type (ENT-ID) renders with its spec-correct appearance per [docs/18-visual-rendering-specification.md](docs/18-visual-rendering-specification.md).
>
> **Target:** 262 distinct shader signatures — "100% realistic universe coverage" (beyond this is diminishing-return uniform tweaking). Split into 17 phases (V0..V16), ~5-7 weeks focused work.
>
> **Scope:** client-side only. Backend unchanged. Per CLAUDE.md §1, all visuals stay procedural (no new textures). Per CLAUDE.md §3, Three.js direct (no R3F).
>
> **Task ID scheme:** `T-V-NN` (no phase letter — Visuals is one track).
> **Branch:** `feat/T-V-NN-<slug>`.
> **Commit scope:** `feat(web): T-V-NN <title>` or `feat(shaders): T-V-NN ...`.
>
> **Legend:**
> - 🟢 safe — local-only, reversible in <1 min
> - 🟡 medium — touches render pipeline or multiple engine modules
> - 🔴 risky — changes shared family shader that multiple ENT-IDs depend on

---

## 0. Orientation

### 0.1 Current visual coverage (2026-04-22)

Per [docs/17-coverage-checklist.md](docs/17-coverage-checklist.md):

| Family | Total | Shipped | In-progress | Planned | Tier B adds |
|---|---|---|---|---|---|
| Stars (ENT-1xxx) | 31 | 31 ✓ | 0 | 0 | +20 |
| Planets (ENT-2xxx) | 27 | 1 | 6 | 21 (shader exists, needs polish) | +15 |
| Moons (ENT-3xxx) | 15 | 0 | 0 | 15 (shader exists, needs polish) | +10 |
| Small Bodies (ENT-4xxx) | 20 | 0 | 0 | 20 | +24 (Bus-DeMeo 20 + active/MBC/damocloid/Neptune-Trojan) |
| Nebulae (ENT-5xxx) | 14 | 2 | 4 | 9 | +10 |
| Galaxies (ENT-6xxx) | 19 | 1 | 3 | 15 | +10 |
| LSS (ENT-7xxx) | 12 | 0 | 5 | 7 | +5 |
| Exotic (ENT-8xxx) | 16 | 16 ✓ | 0 | 0 | +9 (IMBH/wandering/CCO + 6 WD cooling DA/DB/DC/DQ/DZ/DO) |
| Transient | 0 | — | — | — | +5 (new) |
| **Tier A total** | 154 | 51 | 18 | 87 | — |
| **Tier B total** | — | — | — | — | **+108 extensions** |

**End state:** 262 distinct shader signatures (154 Tier A polished + 108 Tier B new).

### 0.2 Missing shader files (must write from scratch)

12 files referenced in Doc 17 checklist but absent on disk:

```
apps/web/src/shaders/
├── smallbody-asteroid.frag          # C/S/M/V-type via #define
├── smallbody-asteroid-binary.frag   # two-lobe contact + orbital pair
├── smallbody-rubble.frag            # aggregate lighting (Bennu/Ryugu)
├── smallbody-kbo.frag               # tholin reddish, large TNO
├── smallbody-centaur.frag           # icy surface + sublimation
├── smallbody-trojan.frag            # L4/L5 indicator
├── meteoroid-stream.frag            # dust stream trail
├── cluster-open.frag                # sparse cluster of luminous points
├── cluster-globular.frag            # dense spherical halo
├── cluster-ob.frag                  # blue OB associations
├── cluster-collision.frag           # merging/disrupting cluster
└── lyman-alpha-blob.frag            # extended Lα emission nebula
```

(2 names in checklist — `nebula-snr.frag`, `nebula-wr.frag` — are stale aliases for `nebula-supernova.frag` + `nebula-wolfrayet.frag` which already exist; just update checklist, no new files needed.)

### 0.3 Target architecture

**Frontend-only rendering pipeline. Backend data API UNCHANGED.** Per architecture B in plan discussion: shaders stay bundled; per-entity uniforms/defines come from `render: { shader, defines, uniforms }` block in API response (added lazily as each family polishes).

```
┌───────────────────────────────────────────────────────────────┐
│                         BROWSER                               │
│                                                               │
│  Entity API response (unchanged endpoint, enriched payload):  │
│    {                                                          │
│      ent_id: "ENT-2011",                                      │
│      name: "Venus",                                           │
│      kind: "rocky_planet",                                    │
│      render: {                     ◄─── NEW (optional block)  │
│        shader: "planet-rocky",                                │
│        defines: { ROCKY_VENUS: 1, HAS_CO2_ATMOSPHERE: 1 },    │
│        uniforms: {                                            │
│          u_atmosphereColor: [0.96, 0.82, 0.5],                │
│          u_cloudThickness: 0.95,                              │
│          u_surfaceAlbedo: 0.67                                │
│        }                                                      │
│      }                                                        │
│    }                                                          │
│                                                               │
│  MaterialFactory.create(entity) → THREE.ShaderMaterial        │
│    ├─ reads render.shader to pick bundled GLSL strings        │
│    ├─ applies render.defines as compile-time #defines         │
│    ├─ binds render.uniforms                                   │
│    └─ falls back to kind→default if render block missing      │
│                                                               │
│  All 262 .frag/.vert bundled by Vite at build time.           │
└───────────────────────────────────────────────────────────────┘
```

**Fallback path:** if API response lacks `render` block (legacy, offline seed), MaterialFactory derives defaults from `kind`. Guarantees zero breakage during incremental rollout.

### 0.4 Rules each shader MUST follow

From CLAUDE.md + Doc 18:

1. **`#version 300 es`** header (GLSL ES 3.0, WebGL 2.0).
2. **Procedural only** — no `texture()` sampling unless CMB/SFD exceptions in CLAUDE.md §1 (only 3 allowed).
3. **Logarithmic depth:** `gl_FragDepth = log2(z) * u_logDepthCoef`.
4. **Camera-relative positions:** subtract `u_cameraRelativeOrigin` in vertex stage.
5. **Uniform prefix `u_`**, varying `v_`, attribute `a_`.
6. **Each uniform documented** with `// @param name description [range]` comment.
7. **Quality tiers:** `#ifdef QUALITY_HIGH/MID/LOW` around expensive ops (raymarch, volume).
8. **Doc 18 section reference** in file header comment.
9. **Max GLSL LOC 500** per fragment shader (split via common `lib/` if longer).

---

## 1. Pre-flight

Run these once before T-V-01. Abort if any fails.

### 1.1 Regression baseline green

```bash
pnpm test         # 1443+ tests pass
pnpm typecheck    # 10/10 turbo tasks
pnpm lint         # 6/6 green
```

### 1.2 Invariant baselines

```bash
# Shader file count — must not decrease
ls apps/web/src/shaders/ | wc -l    # = 65 at start
# Texture count — per CLAUDE.md §1
find apps/web/public -maxdepth 3 \( -name '*.png' -o -name '*.jpg' \) | wc -l   # ≤ 3
```

### 1.3 Preview running

```
preview_start({ name: "web-dev" })
```

### 1.4 References (read lazily when phase needs them)

| Phase | Required docs |
|-------|-------------|
| V1, V11 | Doc 18 §Small Bodies, §Meteoroid Stream |
| V1, V14 | Doc 18 §Large-Scale Structures |
| V3 | Doc 18 §Rocky Planets, §Gas Giants, §Exotic Planet Types |
| V4 | Doc 18 §Moon Types |
| V5 | Doc 18 §Nebula Rendering |
| V6 | Doc 18 §Galaxy Rendering |
| V7 | Doc 18 §Large-Scale Structures |
| V8 | Doc 18 §Stellar Evolution Classes + extended spec |
| V15 | Doc 18 §Exotic Objects (ENT-8010..8025) — already shipped pattern |
| V16 | Doc 33 (data accuracy), Doc 30 (test cases) |

---

## 2. Phases

### Phase V0 — Infrastructure (3 tasks, ~10h)

Set up the visual-regression test harness BEFORE any shader work. Every subsequent task uses this harness to verify.

---

### T-V-00 — MaterialFactory + render-block schema ✅ DONE a3d6c7b 2026-04-22 🟢
**Depends:** —  **Est:** 4h
**Goal:** Client-side `MaterialFactory.create(entity)` that accepts optional `render: {shader, defines, uniforms}` from API, falls back to `kind→default`.
**Files:**
- `apps/web/src/engine/MaterialFactory.ts` (new)
- `apps/web/src/engine/MaterialFactory.test.ts` (new)
- `packages/shared-types/src/render.ts` (new — `EntityRenderBlock` type)
- `packages/shared-types/src/entities/base.ts` (extend with optional `render?` field)

**Do:**
1. Export type `EntityRenderBlock { shader: string; defines?: Record<string, boolean | number>; uniforms?: Record<string, number | readonly number[]> }`.
2. `MaterialFactory.create(entity)`:
   - If `entity.render` present: pick shader from bundled registry by `render.shader`, apply defines + uniforms.
   - Else: derive from `entity.kind` using legacy fallback (`'rocky_planet' → 'planet-rocky'` etc).
   - Always attach `u_logDepthCoef`, `u_cameraRelativeOrigin`, `u_time` (standard uniforms).
3. Unit tests: fallback path, render-block path, unknown shader → throws, uniform type mismatch → throws.

**Verify:**
```bash
pnpm --filter @cosmos/web test src/engine/MaterialFactory
pnpm typecheck
```
**Success:** tests pass; typecheck clean.

---

### T-V-01 — Visual regression harness ✅ DONE 6b37db0 2026-04-22 🟢
**Depends:** T-V-00  **Est:** 4h
**Goal:** Preview-driven screenshot comparison per ENT-ID. Detects regressions when a family shader changes.
**Files:**
- `apps/web/tests/visual/fly-to-ent.ts` (helper: fly camera to representative pose per kind)
- `apps/web/tests/visual/baseline/` (directory of reference screenshots, committed)
- `apps/web/tests/visual/runner.ts` (compare pHash + ΔE2000 per Doc 33)
- `apps/web/package.json` — `"test:visual": "vitest run visual"`

**Do:**
1. Per-kind camera pose: planets 3 body-radii away, moons 2, nebulae 50 pc, galaxies 500 kpc, LSS 200 Mpc.
2. Reference script `pnpm --filter @cosmos/web test:visual:capture ENT-2011` — fly to Venus, take screenshot, save to `baseline/planets/ENT-2011.jpg`.
3. Diff script: `pnpm --filter @cosmos/web test:visual` — rerun, diff current vs baseline. Fail if ΔE2000 > 5 or SSIM < 0.65.
4. Harness auto-excluded from default `pnpm test` (opt-in only — too slow for CI on every PR).

**Verify:** capture a baseline for ENT-1007 (Sun, already shipped), rerun, expect pass.
**Success:** harness detects synthetic regression (bump a uniform, verify diff > threshold).

---

### T-V-02 — Per-family MaterialFactory unit test harness ✅ DONE 4de53a1 2026-04-22 🟢
**Depends:** T-V-00  **Est:** 2h
**Goal:** Parameterized vitest — feed every ENT-ID in shared-types into `MaterialFactory.create()`, assert no throw + correct shader name.
**Files:**
- `apps/web/tests/materialFactory.coverage.test.ts`

**Do:**
1. Import all ENT-IDs from `@cosmos/shared-types`.
2. For each, build a fixture entity with minimum fields.
3. `expect(() => MaterialFactory.create(fixture)).not.toThrow()`.
4. Assert material.name matches expected shader key.

**Verify:** run locally — may fail initially for not-yet-wired subtypes; that's OK, becomes the work tracker.
**Success:** passes for all Tier A + B subtypes after sprint completes.

---

## Phase V1 — Small bodies: 7 new shader files + 20 Tier A subtypes (4 days)

### T-V-03 — `smallbody-asteroid.frag` ✅ DONE f7a8fc0 2026-04-22 🟢
**Depends:** T-V-02  **Est:** 3h
**Goal:** Unified asteroid shader covering C/S/M/V Tholen classes via `#define`.
**Files:** `apps/web/src/shaders/smallbody-asteroid.vert` (new), `smallbody-asteroid.frag` (new)

**Do:**
1. Vert: instanced billboard (asteroid is a point at most distances). Fade to mesh at close range.
2. Frag: ramped albedo + crater normal-noise + polarization angle variant:
   - `#ifdef TYPE_C` → albedo 0.05, spectral blue-grey
   - `#ifdef TYPE_S` → albedo 0.21, silicate reddish
   - `#ifdef TYPE_M` → albedo 0.15, metallic highlight
   - `#ifdef TYPE_V` → albedo 0.42, basaltic (Vesta-like)
3. Uniforms: `u_rotationSpeed`, `u_shapeSeed`, `u_type` (default via define).
4. Doc 18 §Small Bodies.

**Verify (preview_eval):**
```javascript
(async () => {
  const e = window.__cosmosEngine;
  e.spawnTestEntity({ ent_id: 'ENT-4010', kind: 'asteroid_c' });
  e.flyToCelestialCoord(0, 0, 0.001, { entId: 'ENT-4010', durationSec: 0 });
  await new Promise(r => setTimeout(r, 800));
  const mat = e.scene.getObjectByName('test-ent')?.material;
  return { shader: mat?.name, hasTypeC: mat?.defines?.TYPE_C === 1 };
})()
// Expect: shader='smallbody-asteroid:c', defines.TYPE_C=1
```
**Success:** 4 Tholen types render distinctly; FPS ≥ 55 mid-tier with 1000 instances visible.

---

### T-V-04 — `smallbody-asteroid-binary.frag` ✅ DONE c3a5a15 2026-04-22 🟢
**Depends:** T-V-03  **Est:** 2h
**Goal:** Binary asteroid pair rendered as 2-lobe contact binary (Arrokoth) or orbiting pair (Didymos/Dimorphos).
**Files:** `smallbody-asteroid-binary.frag`, `.vert`

**Do:**
1. Vert: two instance offsets + orbital angle uniform.
2. Frag: shared albedo; ambient occlusion in contact zone (`#ifdef CONTACT`).
3. Doc 18 §ENT-4016 Contact Binary.

**Verify:** preview_eval — spawn ENT-4014 + ENT-4016, assert both render with `smallbody-asteroid-binary`.
**Success:** contact binary shows mesh welded; orbital pair shows both visible + shadow cast.

---

### T-V-05 — `smallbody-rubble.frag` ✅ DONE 6667811 2026-04-22 🟢
**Depends:** T-V-03  **Est:** 2h
**Goal:** Rubble-pile asteroid — aggregate boulders, porous shadow (Bennu/Ryugu-like).
**Files:** `smallbody-rubble.frag`, `.vert`

**Do:**
1. Frag: multi-octave Worley noise for boulder distribution; occlusion between boulders.
2. Doc 18 §ENT-4015.

**Verify:** screenshot ENT-4015 — visible "rubble" texture vs smooth asteroid.
**Success:** visibly distinct from C-type asteroid at >1 body-radius zoom.

---

### T-V-06 — `smallbody-kbo.frag` ✅ DONE 5b1e87f 2026-04-22 🟢
**Depends:** T-V-03  **Est:** 3h
**Goal:** Kuiper Belt Object — tholin reddish surface, larger body treatment (dwarf-planet-scale).
**Files:** `smallbody-kbo.frag`, `.vert`

**Do:**
1. Frag: reddish-brown albedo (tholin), polar ice caps via latitude falloff, cratered surface.
2. `#ifdef KBO_PLUTO` — heart-shaped Sputnik Planitia feature.
3. `#ifdef KBO_ERIS` — high-albedo snow.
4. Doc 18 §ENT-4030..4032.

**Verify:** preview fly-to Pluto (ENT-4030) — visible tholin red with bright heart.
**Success:** Pluto recognizable from geometry + color.

---

### T-V-07 — `smallbody-centaur.frag` ✅ DONE 7cf1c28 2026-04-22 🟢
**Depends:** T-V-06  **Est:** 2h
**Goal:** Centaur — Chiron/Chariklo-type with faint comet-like activity.
**Files:** `smallbody-centaur.frag`

**Do:**
1. Base albedo KBO-like; add optional dust coma halo.
2. `#ifdef CENTAUR_CHARIKLO` — ring system.
3. Doc 18 §ENT-4040.

**Verify:** screenshot — visible dust halo distinct from pure asteroid.
**Success:** Chariklo rings visible when `CHARIKLO_RINGS` define set.

---

### T-V-08 — `smallbody-trojan.frag` ✅ DONE b6790a4 2026-04-22 🟢
**Depends:** T-V-03  **Est:** 2h
**Goal:** Trojan — L4/L5 indicator overlay + asteroid base.
**Files:** `smallbody-trojan.frag`

**Do:**
1. Base: smallbody-asteroid (D-type dominant for Jupiter Trojans).
2. Overlay: faint gravitational potential well visualisation when `u_showLagrangePoint > 0.5`.
3. Doc 18 §ENT-4050.

**Verify:** preview — Jupiter Trojans swarm visible at L4/L5.
**Success:** swarm positions correct relative to Jupiter; shader renders cluster.

---

### T-V-09 — `meteoroid-stream.frag` ✅ DONE ffef279 2026-04-22 🟡
**Depends:** T-V-00  **Est:** 3h
**Goal:** Meteoroid stream — dust trail along comet orbit (Perseids, Leonids).
**Files:** `meteoroid-stream.frag`, `.vert`

**Do:**
1. Vert: ribbon mesh along orbital ellipse.
2. Frag: density falloff + brightness boost near radiant; subtle blue-white.
3. Doc 18 §Meteoroid Streams.

**Verify:** preview — Perseid stream (ENT-4060) visible as orbit-aligned ribbon.
**Success:** ribbon follows keplerian orbit path; fades at aphelion.

---

### T-V-10 — Wire small-body MaterialFactory mapping ✅ DONE d88fc22 2026-04-22 🟡
**Depends:** T-V-03..T-V-09  **Est:** 3h
**Goal:** Every ENT-4xxx resolves to correct shader + defines via `MaterialFactory`.
**Files:** `apps/web/src/engine/MaterialFactory.ts`, `apps/web/src/engine/AsteroidFieldRenderer.ts`

**Do:**
1. Add 20 ENT-4xxx entries to factory lookup table.
2. Each ENT-ID: shader + defines set.
3. AsteroidFieldRenderer: fetch shader from factory, not inline.
4. Unit test from T-V-02 passes for all ENT-4xxx.

**Verify:** `pnpm --filter @cosmos/web test materialFactory.coverage`
**Success:** 20/20 small-body ENT-IDs pass.

---

## Phase V2 — LSS/Clusters: 5 new shader files (3 days)

### T-V-11 — `cluster-open.frag` ✅ DONE 158627a 2026-04-22 🟢
**Depends:** T-V-00  **Est:** 3h
**Goal:** Open cluster (Pleiades, Hyades) — sparse point distribution with nebulous reflection dust.
**Files:** `cluster-open.frag`, `.vert`

**Do:**
1. Vert: instanced points with per-star Gaussian falloff.
2. Frag: blue-white star + optional reflection nebula halo when `NEBULOSITY_ON`.
3. Doc 18 §ENT-7010.

**Verify:** fly to Pleiades (ENT-OC-pleiades). Count point meshes > 100.
**Success:** Pleiades visually recognizable (blue haze).

---

### T-V-12 — `cluster-globular.frag` ✅ DONE 158627a 2026-04-22 🟢
**Depends:** T-V-11  **Est:** 3h
**Goal:** Globular cluster — dense spherical core (M13, ω Centauri) with Plummer density profile.
**Files:** `cluster-globular.frag`

**Do:**
1. Frag: radial density ∝ (1+r²/a²)^(-5/2) (Plummer model).
2. Color ramp: hot blue in core, yellow-orange in halo (aged stars).
3. Doc 18 §ENT-7020.

**Verify:** screenshot ENT-OC-m13 — visible core-halo gradient.
**Success:** central concentration visible vs flat open cluster.

---

### T-V-13 — `cluster-ob.frag` ✅ DONE 158627a 2026-04-22 🟢
**Depends:** T-V-11  **Est:** 2h
**Goal:** OB association — bright blue young stars, often associated with parent nebula.
**Files:** `cluster-ob.frag`

**Do:**
1. Base: cluster-open template.
2. Override star colors to O-B spectrum (deep blue to blue-white).
3. `#ifdef HAS_PARENT_NEBULA` — tint with nebula emission color.
4. Doc 18 §ENT-7030.

**Verify:** Orion OB1 (ENT-7030) renders with distinctly blue stars vs Pleiades.
**Success:** color difference visible; ΔE > 8 vs cluster-open.

---

### T-V-14 — `cluster-collision.frag` ✅ DONE 158627a 2026-04-22 🟡
**Depends:** T-V-11  **Est:** 3h
**Goal:** Disrupting / merging cluster — tidal tails, core asymmetry.
**Files:** `cluster-collision.frag`

**Do:**
1. Frag: two merging Plummer profiles + tidal streamer tail.
2. `u_mergePhase` 0..1 animates the collision.
3. Doc 18 §ENT-7035.

**Verify:** preview_eval — set `u_mergePhase` via engine hook, observe tidal tail extension.
**Success:** tail geometry changes with phase; no shader compilation error.

---

### T-V-15 — `lyman-alpha-blob.frag` ✅ DONE 158627a 2026-04-22 🟢
**Depends:** T-V-00  **Est:** 2h
**Goal:** Lyman-α blob — extended high-z Lα emission (LAB-1 Watson 2004).
**Files:** `lyman-alpha-blob.frag`

**Do:**
1. Volumetric ray-march; low density, high volume emission at 1216Å (redshifted to observer).
2. Purplish-blue color ramp.
3. Doc 18 §ENT-7080.

**Verify:** fly-to LAB-1 (ENT-7080), visible as translucent volume.
**Success:** volume renders without z-fighting; log depth respected.

---

### T-V-16 — Wire cluster/LSS MaterialFactory mapping ✅ DONE 158627a 2026-04-22 🟡
**Depends:** T-V-11..T-V-15  **Est:** 3h
**Goal:** Every ENT-7xxx resolves correctly.
**Files:** `MaterialFactory.ts`, `LargeScaleStructureRenderer.ts`, `CosmicWebRenderer.ts`

**Do:**
1. Replace inline `new THREE.ShaderMaterial({vertexShader: OPEN_CLUSTER_VERT, ...})` with factory lookup.
2. Map 12 ENT-7xxx subtypes.
3. LSS renderer reads from factory.

**Verify:** `test materialFactory.coverage` passes for all ENT-7xxx.
**Success:** 12/12 LSS ENT-IDs pass.

---

## Phase V3 — Planets Tier A polish (4 days)

27 subtypes covered by 3 existing family shaders (`planet-rocky`, `planet-gas`, `planet-extreme`). Each gets a `#define` branch + uniform preset.

### T-V-17 — ENT-2010..2014 rocky planet defines (Mercury/Venus/Earth/Mars/Earth-analog) ✅ DONE 955216b 2026-04-22 🔴
**Depends:** T-V-00  **Est:** 4h
**Files:** `apps/web/src/shaders/planet-rocky.frag`

**Do:**
1. Mercury: `#ifdef ROCKY_MERCURY` — low albedo 0.12, heavy cratering, no atmosphere.
2. Venus: `#ifdef ROCKY_VENUS` — H2SO4 cloud deck, dense CO2 glow, sulfur-yellow.
3. Earth: `#ifdef ROCKY_EARTH` — PBR ocean + continents via noise, cloud layer, atmosphere rim.
4. Mars: `#ifdef ROCKY_MARS` — polar ice caps (latitude mask), iron-oxide dust, thin CO2 rim.
5. Earth-analog (ENT-2014): Earth preset + Kepler-specific offset.
6. All uniforms parameterised; `MaterialFactory` populates per ENT-ID.

**Verify:**
```javascript
// preview_eval
(async () => {
  const mats = ['ROCKY_MERCURY','ROCKY_VENUS','ROCKY_EARTH','ROCKY_MARS'].map(def =>
    window.__cosmosEngine.MaterialFactory.create({
      ent_id: 'TEST', kind: 'rocky_planet', render: { shader: 'planet-rocky', defines: { [def]: 1 } }
    })
  );
  return { allCompiled: mats.every(m => m.isShaderMaterial && !m.program?.getInfoLog?.().includes('ERROR')) };
})()
// Expect: allCompiled: true
```
**Success:** 5 planets distinctly rendered; screenshot baseline captured for each.

---

### T-V-18 — ENT-2020..2026 gas giant defines (Jupiter/Saturn/Uranus/Neptune) ✅ DONE 2cc1493 2026-04-22 🔴
**Depends:** T-V-00  **Est:** 4h
**Files:** `apps/web/src/shaders/planet-gas.frag`

**Do:**
1. Jupiter: zonal banding with noise perturbation, Great Red Spot hotspot.
2. Saturn: ringed, lower-contrast bands + cassini division in ring.
3. Uranus: axial tilt 97.77° (affects shading), methane-blue smooth surface.
4. Neptune: methane-blue darker + storm spots + zonal winds.
5. Ring system sub-shader `ring.frag` — already exists, just wire parameters.

**Verify:** screenshot each planet at standard pose. Saturn rings visible.
**Success:** 4 planets distinctly colored + banded.

---

### T-V-19 — ENT-2030..2039 exotic rocky defines (Hot Jupiter/Super-Earth/Hycean/Eyeball/Magma) ✅ DONE 2cc1493 2026-04-22 🟡
**Depends:** T-V-17, T-V-18  **Est:** 4h
**Files:** `planet-gas.frag`, `planet-extreme.frag`, `planet-rocky.frag`

**Do:**
1. Hot Jupiter: day-night terminator, T~2000K emission on dayside.
2. Super-Earth: scaled rocky + higher contrast.
3. Hycean: deep ocean + H2 atmosphere blue-white.
4. Eyeball (tidally locked): substellar hot spot + frozen dark side.
5. Magma: glowing surface with flowing lava noise.

**Verify:** preview each → visually distinct.
**Success:** eyeball visibly different from normal rocky at day/night poles.

---

### T-V-20 — ENT-2040..2050 rare types (Rogue/Puffy/Chthonian/Protoplanet/Desert/Ocean/Helium/Synestia) ✅ DONE 2cc1493 2026-04-22 🟡
**Depends:** T-V-19  **Est:** 4h

**Do:** Remaining 12 Tier A planets via `#define` preset per Doc 18 spec. Rogue = self-emission only. Chthonian = exposed metallic core. Synestia = post-impact disk.

**Verify:** material coverage test passes for all ENT-2xxx.
**Success:** 27/27 Tier A planets resolved.

---

### T-V-21 — Wire planet factory mapping ✅ DONE 2cc1493 2026-04-22 🟡
**Depends:** T-V-17..T-V-20  **Est:** 2h
**Files:** `PlanetMaterial.ts`, `MaterialFactory.ts`

**Do:** Update table; `PlanetMaterial.forEntity(entity)` delegates to factory.
**Verify:** `test materialFactory.coverage` — 27/27 ENT-2xxx pass.

---

## Phase V4 — Moons Tier A polish (2 days)

### T-V-22 — ENT-3010..3015 inner moons (Io/Europa/Ganymede/Callisto/Titan/Enceladus) ✅ DONE 0d885d9 2026-04-22 🔴
**Depends:** T-V-00  **Est:** 5h
**Files:** `moon-volcanic.frag`, `moon-icy.frag`, `moon-atmospheric.frag`

**Do:**
1. Io: SO2 plumes (volumetric puff), sulfur color palette, tidal-heating glow.
2. Europa: chaos terrain — crisscross lineae noise, ice albedo 0.67.
3. Ganymede: magnetic aurora tint at poles, dark+light terrain.
4. Callisto: heavy cratering, Valhalla impact ring.
5. Titan: methane haze atmosphere — orange/tan layered scattering.
6. Enceladus: tiger-stripe cracks + geyser plumes at south pole.

**Verify:** screenshot each; Titan visibly hazed, Io visibly yellow with spots.
**Success:** 6/6 distinct; ΔE > 10 between Io and Europa.

---

### T-V-23 — ENT-3016..3024 outer + minor moons (Triton/Miranda/Hyperion/shepherd/trojan/binary/subsurface-ocean) ✅ DONE 0d885d9 2026-04-22 🟡
**Depends:** T-V-22  **Est:** 3h
**Files:** `moon-extreme.frag`, `moon-minor.frag`

**Do:** Per Doc 18 spec each. Triton retrograde N2 geyser. Miranda Verona Rupes cliff face. Hyperion sponge surface.
**Verify:** coverage test 15/15 ENT-3xxx.

---

### T-V-24 — Wire moon factory mapping ✅ DONE 0d885d9 2026-04-22 🟡
**Depends:** T-V-22, T-V-23  **Est:** 2h

**Do:** Update MaterialFactory + MoonMaterial delegates.
**Verify:** 15/15 ENT-3xxx pass coverage test.

---

## Phase V5 — Nebulae Tier A polish (2 days)

### T-V-25 — ENT-5000..5040 nebula polish (emission/reflection/dark/planetary/supernova/protoplanetary/superbubble/WR) ✅ DONE b4daec7 2026-04-22 🔴
**Depends:** T-V-00  **Est:** 6h
**Files:** `nebula-*.frag` (all 8 existing)

**Do:**
1. Emission (HII): Hα red + OIII green-cyan bands per sub-region.
2. Reflection: scattered starlight blue — tune Rayleigh phase per ENT-ID.
3. Dark (LBN/LDN): absorption against background stars.
4. Planetary nebula: bipolar lobes via `#ifdef PN_BIPOLAR`, ring via `#ifdef PN_RING`, halo via `#ifdef PN_HALO`.
5. Supernova remnant: shock front expanding shell + synchrotron emission.
6. Protoplanetary: disk + bipolar jets.
7. Superbubble: hot ionized cavity with ragged edge.
8. Wolf-Rayet: wind-blown bubble + ionization front.

**Verify:** fly-to Orion Nebula (ENT-NEB-m42), Ring Nebula (ENT-NEB-m57), Cas A — each distinctly rendered.

---

### T-V-26 — Wire nebula factory + checklist rename ✅ DONE b4daec7 2026-04-22 🟢
**Depends:** T-V-25  **Est:** 2h

**Do:**
1. Update 14 ENT-5xxx in MaterialFactory.
2. Rename checklist aliases: `nebula-snr.frag` → `nebula-supernova.frag`, `nebula-wr.frag` → `nebula-wolfrayet.frag`.
3. Coverage test passes for all ENT-5xxx.

**Verify:** 14/14 ENT-5xxx pass.

---

## Phase V6 — Galaxies Tier A polish (3 days)

### T-V-27 — ENT-6010..6055 galaxy Hubble types polish ✅ DONE 5a4546e 2026-04-22 🔴
**Depends:** T-V-00  **Est:** 8h
**Files:** `galaxy-*.frag` (7 existing)

**Do:**
1. Spiral Sa: tight-wound arms, large bulge.
2. Spiral Sb: moderate-wound arms (Milky Way, M31-like).
3. Spiral Sc: loose-wound arms, small bulge.
4. Barred Sa/Sb/Sc: add `#ifdef HAS_BAR` — cross-bar structure through core.
5. Lenticular S0: smooth disk, no arms.
6. Elliptical E0-E7: ellipticity via `u_ellipticity`, de Vaucouleurs r^(1/4) profile.
7. Dwarf spheroidal (dSph): ultra-low surface brightness elliptical.
8. Irregular: no structure, clumpy noise.
9. AGN Seyfert-1: visible broad-line region (emission spike) at core.
10. AGN Seyfert-2: obscured core (dust torus).
11. Quasar (ENT-6041): unresolved point + host galaxy.
12. Blazar: central aligned jet dominating.
13. Starburst: concentrated blue emission.
14. Ring galaxy: ring of star formation + empty core (Cartwheel-like).
15. Merging / Jellyfish: tidal tails via shader displacement.

**Verify:** 15+ galaxy screenshots; Hubble-sequence morphology recognizable.
**Success:** 19/19 ENT-6xxx distinctly rendered.

---

### T-V-28 — Wire galaxy factory mapping ✅ DONE 5a4546e 2026-04-22 🟡
**Depends:** T-V-27  **Est:** 2h

**Do:** Update 19 ENT-6xxx in MaterialFactory + GalaxyMaterial.
**Verify:** coverage 19/19.

---

## Phase V7 — LSS Tier A polish (1 day)

### T-V-29 — ENT-7040..7085 polish (superclusters/filaments/voids/cosmic web) ✅ DONE 67db7b5 2026-04-22 🟡
**Depends:** T-V-11..T-V-15  **Est:** 4h
**Files:** inline shaders in LargeScaleStructureRenderer.ts → externalize

**Do:**
1. Move 4 inline shaders from `LargeScaleStructureRenderer.ts` to standalone `.frag` files.
2. Add ENT-ID defines per structure (R0 to R3+ Abell richness).
3. Superclusters: enormous sparse sphere.
4. Cosmic-web filament: extended tube with density taper.
5. Void: spherical dimming.
6. Knot: concentrated point in filament junction.

**Verify:** coverage 12/12 ENT-7xxx.

---

## Phase V8 — Tier B: Star extensions (+20 subtypes, 4 days)

### T-V-30 — Brown dwarfs: L, T, Y classes ✅ DONE 53b8575 2026-04-22 🟢
**Depends:** T-V-00  **Est:** 3h
**Files:** `apps/web/src/shaders/star-brown-dwarf.frag` (new)

**Do:**
1. Surface T: L (1300-2000K), T (500-1300K), Y (<500K).
2. Color ramp: magenta (L) → reddish (T) → invisible dark (Y, thermal emission only).
3. Weather: `#ifdef HAS_CLOUDS` — methane/ammonia clouds.
4. Doc 18 §Stellar Evolution Classes (extend).

**Verify:** fly to L dwarf test entity, visible magenta. T visibly redder. Y near-invisible dark.

---

### T-V-31 — Sub-dwarfs sdO, sdB ✅ DONE 53b8575 2026-04-22 🟢
**Depends:** T-V-00  **Est:** 2h
**Files:** `star-subdwarf.frag` (new)

**Do:**
1. sdO: hot bluer-than-main-sequence, low luminosity.
2. sdB: cooler helium-core-burning remnant.
3. Position on HR diagram — below main sequence, left of red dwarfs.

**Verify:** sdO visibly different from MS O star (lower luminosity at same color).

---

### T-V-32 — Carbon stars C-R, C-N, C-J ✅ DONE 53b8575 2026-04-22 🟢
**Depends:** T-V-00  **Est:** 2h
**Files:** `star-carbon.frag` (new)

**Do:**
1. C-R: classical carbon star, ruby-red continuum.
2. C-N: N-type intense C2 absorption, deep red-orange.
3. C-J: J-type, ^13C enhanced, slightly different spectrum tint.
4. Doc 18 spec: photosphere absorption bands visible as color dithering.

**Verify:** 3 color variants distinguishable side-by-side.

---

### T-V-33 — Pre-main-sequence: Herbig Ae/Be, T Tauri (classical + weak-lined), FU Ori ✅ DONE 53b8575 2026-04-22 🟢
**Depends:** T-V-00  **Est:** 4h
**Files:** `star-pms.frag` (new)

**Do:**
1. Herbig Ae (A-type PMS): blue-white with dust disk halo.
2. Herbig Be (B-type PMS): hotter blue.
3. Classical T Tauri: K/M dwarf + accretion funnel UV.
4. Weak-lined T Tauri: bare photosphere, no accretion hot spot.
5. FU Orionis: outburst phase — dramatic luminosity spike + rapid disk heating.

**Verify:** 5 variants visibly distinct; FU Ori visibly brighter in outburst.

---

### T-V-34 — Variable types: LBV, Be star, AM CVn ✅ DONE 53b8575 2026-04-22 🟢
**Depends:** T-V-00  **Est:** 3h
**Files:** extend `star-variable.frag`

**Do:**
1. LBV: unstable super-luminous blue (η Car template) — episodic brightening, mass-loss shell.
2. Be star: B-type with Hα emission decretion disk.
3. AM CVn: ultra-compact WD binary with AM CVn accretion.

**Verify:** defines added; coverage test passes.

---

### T-V-35 — Post-AGB + late-stage: post-AGB, horizontal branch, RGB tip, extreme AGB ✅ DONE 53b8575 2026-04-22 🟢
**Depends:** T-V-00  **Est:** 3h
**Files:** extend `star-evolved.frag`

**Do:**
1. Post-AGB: transition to PN, faint + extended envelope.
2. Horizontal branch: stable helium-burning, specific T/L locus.
3. RGB tip: peak red-giant luminosity before helium flash.
4. Extreme AGB: high-mass-loss dust shell.

**Verify:** 4 sub-stages render on HR diagram.

---

### T-V-36 — Wire Tier B star factory ✅ DONE 53b8575 2026-04-22 🟡
**Depends:** T-V-30..T-V-35  **Est:** 2h

**Do:** Add 20 Tier B stellar ENT-IDs (ENT-1050..1070 reserved range) to shared-types + MaterialFactory.
**Verify:** coverage +20 entries pass.

---

## Phase V9 — Tier B: Planet extensions (+15 subtypes, 3 days)

### T-V-37 — Composition variants: Helium planet, Carbon/Diamond, Iron ✅ DONE ad2a85b 2026-04-22 🟢
**Depends:** T-V-17..T-V-21  **Est:** 3h

**Do:** Extend `planet-rocky.frag` + `planet-gas.frag`:
1. Helium planet: ultra-low density, pale yellowish-white bands.
2. Carbon (diamond): high-albedo white/pearl surface.
3. Iron: dark metallic sheen, magnetospheric glow.

---

### T-V-38 — Ocean/ice sub-types: Water world (H2O), Ocean (H2+H2O), Ice ammonia/methane ✅ DONE ad2a85b 2026-04-22 🟢
**Depends:** T-V-17  **Est:** 3h

**Do:** Extend planet-extreme + planet-rocky with 4 ocean composition variants.

---

### T-V-39 — Evolution stages: Protoplanet early/middle/late, Chthonian stripping ✅ DONE ad2a85b 2026-04-22 🟢
**Depends:** T-V-17  **Est:** 3h

**Do:** Composition + mass ramps through 3 protoplanet stages. Chthonian = exposed stripped core at 3 severity levels.

---

### T-V-40 — Special variants: Super-puff, Bloated Saturn, Helium-shelled HJ, Magma ocean ✅ DONE ad2a85b 2026-04-22 🟢
**Depends:** T-V-18  **Est:** 3h

**Do:** 4 gas-giant variants with extreme density/radius/temperature presets.

---

### T-V-41 — Wire Tier B planet factory ✅ DONE ad2a85b 2026-04-22 🟡
**Depends:** T-V-37..T-V-40  **Est:** 2h

**Do:** Add 15 Tier B planet ENT-IDs.
**Verify:** +15 coverage entries pass.

---

## Phase V10 — Tier B: Moon extensions (+10 subtypes, 2 days)

### T-V-42 — Orbital-type moons ✅ DONE 137e672 2026-04-22 🟢
**Depends:** T-V-22..T-V-24  **Est:** 4h

**Do:** Co-orbital, quasi-satellite, horseshoe, sesquinary, binary pair, shepherd (Pan/Daphnis gap pattern), Trojan moon (Tethys's Telesto).
**Files:** `moon-minor.frag` + `moon-orbit-overlay.frag` (new).

---

### T-V-43 — Irregular + resonant ✅ DONE 137e672 2026-04-22 🟢
**Depends:** T-V-42  **Est:** 3h

**Do:** Retrograde captured, resonant family (Jovian 1:2:4 Io-Europa-Ganymede Laplace), sesquinary chain.

---

### T-V-44 — Wire Tier B moon factory ✅ DONE 137e672 2026-04-22 🟡
**Depends:** T-V-42, T-V-43  **Est:** 1h

**Do:** +10 Tier B moon entries.

---

## Phase V11 — Tier B: Bus-DeMeo asteroid taxonomy (+24 subtypes, 4 days)

### T-V-45 — Bus-DeMeo primary classes: A, B, Cb, Cg, Cgh, Ch, D, K, L, Ld, O, Q, R, Sa, Sq, Sr, T, Xc, Xe, Xk ✅ DONE d51d8fe 2026-04-22 🟢
**Depends:** T-V-03  **Est:** 10h
**Files:** `smallbody-asteroid.frag` (extend with 24 `#define` class presets)

**Do:** Tolerance: Doc 18 Bus-DeMeo color/albedo table. Each class gets `#ifdef BDM_<code>` with unique albedo + color coordinates.

**Verify:** side-by-side screenshot of 24 classes — continuous color gradient across taxonomy.

---

### T-V-46 — Active asteroids, main-belt comets, damocloids, Neptune Trojans ✅ DONE d51d8fe 2026-04-22 🟢
**Depends:** T-V-45  **Est:** 4h

**Do:**
1. Active asteroid (ENT-4025): dust emission visible when `u_activity > 0`.
2. Main-belt comet (ENT-4026): semi-persistent coma.
3. Damocloid (ENT-4027): dark extinct-comet body on hyperbolic orbit.
4. Neptune Trojan (ENT-4028): extended family, D-type dominant.

---

### T-V-47 — Wire Tier B small-body factory ✅ DONE d51d8fe 2026-04-22 🟡
**Depends:** T-V-45, T-V-46  **Est:** 2h

**Do:** +24 Tier B small-body ENT-IDs.
**Verify:** coverage +24 entries pass.

---

## Phase V12 — Tier B: Nebula extensions (+10 subtypes, 2 days)

### T-V-48 — Star-forming objects ✅ DONE 2026-04-22 🟢
**Depends:** T-V-25  **Est:** 4h

**Do:**
1. Herbig-Haro objects (HH): jet-cloud collision fronts, Hα bow shock.
2. Bok globules: compact dark knots.
3. Evaporating gaseous globules (EGGs): pillar-tip structures.
4. Infrared dark clouds (IRDCs): silhouetted dark against mid-IR.
5. Pillars: erosion-sculpted columns.

**Files:** extend `nebula-dark.frag` + new `nebula-hh.frag`, `nebula-pillar.frag`.

---

### T-V-49 — Compact + molecular ✅ DONE 2026-04-22 🟢
**Depends:** T-V-48  **Est:** 3h

**Do:** Cometary globules, H2O maser sites, GMCs, Lyman-α forest, SNR-shocked molecular clouds.

---

### T-V-50 — Wire Tier B nebula factory ✅ DONE 2026-04-22 🟡
**Depends:** T-V-48, T-V-49  **Est:** 1h

**Do:** +10 Tier B nebula ENT-IDs.

---

## Phase V13 — Tier B: Galaxy extensions (+10 subtypes, 3 days)

### T-V-51 — de Vaucouleurs T-type full + dwarf variants ✅ DONE f0f842c 2026-04-22 🟡
**Depends:** T-V-27  **Est:** 5h

**Do:** Hubble types T=-6..+10 via uniform ramp; dwarf subclasses dE/dSph/UCD/UFD/BCD with unique size+brightness presets.

---

### T-V-52 — Morphology specials ✅ DONE f0f842c 2026-04-22 🟢
**Depends:** T-V-51  **Est:** 4h

**Do:** Green pea, polar ring, tidal dwarf, cD (central dominant in cluster), BCG (brightest cluster galaxy), chain (edge-on), ULIRG/HyLIRG sub-types.

---

### T-V-53 — Wire Tier B galaxy factory ✅ DONE f0f842c 2026-04-22 🟡
**Depends:** T-V-51, T-V-52  **Est:** 2h

**Do:** +10 Tier B galaxy entries.

---

## Phase V14 — Tier B: LSS + Transient + Exotic extensions (+19 subtypes, 3 days)

### T-V-54 — LSS extensions: Abell richness classes, SZ-detected, X-ray selected ✅ DONE 690835f 2026-04-22 🟢
**Depends:** T-V-29  **Est:** 3h

**Do:** +5 LSS subtypes with cluster-catalog-specific rendering tweaks.

---

### T-V-55 — Transient phenomena (NEW family) ✅ DONE 690835f 2026-04-22 🟢
**Depends:** T-V-00  **Est:** 5h
**Files:** `transient-*.frag` (new family, 5 files)

**Do:**
1. GRB afterglow: expanding fireball, color fade over time.
2. FRB site: millisecond flash indicator + host galaxy halo.
3. Tidal disruption event (TDE): stellar stream + accretion flare.
4. Kilonova remnant: fading r-process enriched glow.
5. X-ray burster: compact persistent + bursts.

---

### T-V-56 — Exotic Tier B extensions ✅ DONE 690835f 2026-04-22 🟢
**Depends:** T-V-00  **Est:** 4h
**Files:** extend `exotic-*.frag`

**Do:**
1. Intermediate-mass black hole (IMBH): ENT-8005 — between stellar and supermassive.
2. Wandering BH (ENT-8006): extragalactic isolated.
3. Compact central object (ENT-8007): neutron-star remnant sans pulsar mechanism.
4. WD cooling sequence DA, DB, DC, DQ, DZ, DO — 6 sub-types in `star-remnant.frag`.

---

### T-V-57 — Wire all remaining Tier B factories ✅ DONE 690835f 2026-04-22 🟡
**Depends:** T-V-54..T-V-56  **Est:** 3h

**Do:** +19 Tier B entries. Full 262 coverage.
**Verify:** coverage test passes 262/262.

---

## Phase V15 — Integration + polish (2 days)

### T-V-58 — MaterialFactory unification sweep 🔴
**Depends:** all V1..V14  **Est:** 6h
**Goal:** Eliminate every inline `new THREE.ShaderMaterial` in `apps/web/src/engine/*.ts` — everything goes through MaterialFactory.

**Files:** `AsteroidFieldRenderer.ts`, `LargeScaleStructureRenderer.ts`, `CosmicWebRenderer.ts`, `CmbBoundarySphere.ts`, `GalaxyLOD.ts`, `PhenomenaGalleryRenderer.ts`, `SearchTargetMarker.ts`.

**Do:** Replace 53 inline `new ShaderMaterial` with `MaterialFactory.create(kind, options)`.
**Verify:** `grep -c "new THREE.ShaderMaterial\|new THREE.RawShaderMaterial" apps/web/src/engine/*.ts` → 0.

---

### T-V-59 — Performance budget sweep 🟡
**Depends:** T-V-58  **Est:** 3h

**Goal:** FPS ≥ 55 mid-tier GPU with every family visible at once.

**Do:**
1. Preview stress test: fly camera to position with 20+ entity families in frame.
2. `PerformanceMonitor.getSnapshot()` before/after.
3. For any family exceeding budget, add `#ifdef QUALITY_LOW` fast-path.

**Verify:** preview_eval returns avgFps ≥ 55 with all-families-visible camera pose.

---

### T-V-60 — Doc 17 checklist update ✅ DONE 2026-04-22 🟢
**Depends:** T-V-57  **Est:** 2h

**Do:** Mark all 262 entries in [docs/17-coverage-checklist.md](docs/17-coverage-checklist.md) as `shipped`. Remove `planned` / `in-progress` markers. Rename stale aliases.

**Verify:** `grep -c "shipped" docs/17-coverage-checklist.md` = 262.

---

## Phase V16 — Final regression + baseline (2 days)

### T-V-61 — Visual baseline capture 🟢
**Depends:** T-V-57  **Est:** 5h

**Goal:** 262 reference screenshots committed to `apps/web/tests/visual/baseline/`.

**Do:**
1. Script `pnpm --filter @cosmos/web test:visual:capture-all` — for each of 262 ENT-IDs, fly to representative pose, screenshot.
2. Commit baseline. ~262 JPGs × ~50 KB = ~13 MB (acceptable in repo, not via LFS).

**Verify:** `ls apps/web/tests/visual/baseline/**/*.jpg | wc -l` = 262.

---

### T-V-62 — Visual regression CI 🟢
**Depends:** T-V-61  **Est:** 2h

**Do:**
1. `.github/workflows/visual-regression.yml` — runs on PR touching `apps/web/src/shaders/**` or `apps/web/src/engine/*Material*.ts`.
2. Preview + capture + diff vs baseline → fail if ΔE > 5 or SSIM < 0.65.

**Verify:** intentionally bump a uniform in a PR → CI catches.

---

### T-V-63 — Performance baseline ✅ DONE f9d816d 2026-04-22 🟢
**Depends:** T-V-59  **Est:** 2h

**Do:** Record FPS per regime (solar, stellar, galactic, cosmic) with all-families-visible poses. Commit to `apps/web/tests/perf/baseline.json`. CI compares subsequent runs, fails on >10% regression.

---

### T-V-64 — Documentation update ✅ DONE f9d816d 2026-04-22 🟢
**Depends:** T-V-60  **Est:** 2h

**Do:**
1. Update [CLAUDE.md](CLAUDE.md) "Entity System" section: 262 types across 9 categories (not 96).
2. Update [docs/18-visual-rendering-specification.md](docs/18-visual-rendering-specification.md) table of contents with new Tier B sections.
3. Add `docs/17a-tier-b-extensions.md` — research-grade taxonomy additions beyond Doc 17.

**Verify:** new CLAUDE.md entity count matches shader file count matches coverage test count = 262.

---

### T-V-65 — End-of-V regression 🟢
**Depends:** T-V-58..T-V-64  **Est:** 3h

**Do:** Run viz.md §3.5 regression + preview smoke + visual baseline capture + perf baseline + coverage test.
**Verify:**
```bash
pnpm test && pnpm typecheck && pnpm lint && \
pnpm --filter @cosmos/web test:e2e && \
pnpm --filter @cosmos/web test:visual && \
pnpm --filter @cosmos/web test:perf
```
**Success:** all green; 262/262 shader coverage; no FPS regression; visual baseline clean.

---

## 3. Task dependency graph

```
T-V-00 (factory) ─► T-V-01 (visual harness) ─► T-V-02 (coverage test)
                                                        │
         ┌─────────────────┬─────────────────┬──────────┴──────────┬─────────────┐
         ▼                 ▼                 ▼                     ▼             ▼
  V1 Small bodies    V2 Clusters       V3..V7 Polish          V8..V14 Tier B  V15 Integration
  T-V-03..10         T-V-11..16        T-V-17..29             T-V-30..57       T-V-58..60
         │                 │                 │                     │             │
         └────────────┬────┴────┬────────────┘                     │             │
                      ▼         ▼                                  ▼             ▼
                   V16 Regression + baseline + CI                T-V-61..65
```

Parallel: small-bodies + clusters + polish sprints can run parallel (different file areas). Tier B extensions depend on Tier A polish of the same family.

---

## 4. Task count summary

| Phase | Tasks | Est hours | Gate |
|-------|-------|-----------|------|
| V0 Infrastructure | 3 | 10h | Tests harness ready |
| V1 Small bodies (Tier A) | 8 | 22h | 20 ENT-4xxx render |
| V2 Clusters (Tier A) | 6 | 16h | 12 ENT-7xxx render |
| V3 Planets (Tier A) | 5 | 18h | 27 ENT-2xxx render |
| V4 Moons (Tier A) | 3 | 10h | 15 ENT-3xxx render |
| V5 Nebulae (Tier A) | 2 | 8h | 14 ENT-5xxx render |
| V6 Galaxies (Tier A) | 2 | 10h | 19 ENT-6xxx render |
| V7 LSS (Tier A) | 1 | 4h | 12 ENT-7xxx polished |
| V8 Stars Tier B | 7 | 17h | +20 subtypes |
| V9 Planets Tier B | 5 | 14h | +15 subtypes |
| V10 Moons Tier B | 3 | 8h | +10 subtypes |
| V11 Small bodies Tier B (Bus-DeMeo) | 3 | 16h | +24 subtypes |
| V12 Nebulae Tier B | 3 | 8h | +10 subtypes |
| V13 Galaxies Tier B | 3 | 11h | +10 subtypes |
| V14 LSS/Transient/Exotic Tier B | 4 | 15h | +19 subtypes (5 LSS + 5 transient + 9 exotic) |
| V15 Integration | 3 | 11h | Inline SM count = 0 |
| V16 Regression + baseline | 5 | 14h | 262 shaders, 262 screenshots |
| **Total** | **66 tasks** | **212h (~27 days focused)** | **262 distinct shaders** |

Calendar estimate: **5-7 weeks** at 1 dev 40h/week (assumes 75% effective focus).

---

## 5. How Claude Code executes this file

### 5.1 Pick next task
1. Find lowest-numbered task without `✅ DONE` note.
2. Check `Depends:` — all deps must be done.
3. Check `🔴` flag — if present, ping user before starting.
4. Open branch `feat/T-V-NN-<slug>`.
5. Do the work.
6. Run `Verify` block.
7. Append `✅ DONE <sha> <date>` to title.
8. Merge to main (fast-forward).

### 5.2 Verify for every task — mandatory

Each task's `Verify:` block must pass before marking done. Additionally:

```bash
pnpm typecheck                       # no new ts errors
pnpm --filter @cosmos/web test       # no regression
pnpm lint                            # no new lint errors
# Shader-specific:
ls apps/web/src/shaders/ | wc -l     # increased by new files
grep -c "shipped" docs/17-coverage-checklist.md   # increased by progress
```

### 5.3 When to ESCALATE (ask user, don't decide)

- Any 🔴 task (shared family shader change — affects multiple ENT-IDs).
- Any rollback that touches committed baseline screenshots (visual regression may need human judgement).
- Any deviation from Doc 18 spec (user may want different visual interpretation).
- Any performance budget miss that requires compromising visual quality.

### 5.4 Progress report template (paste to user after each family phase)

```
Phase V<N> complete.
  Shader files added: <count>
  ENT-IDs covered: <count> / 262
  Coverage test: <pass/fail count>
  Visual baseline: <new screenshots count>
  FPS at standard poses: solar=<fps>, stellar=<fps>, galactic=<fps>, cosmic=<fps>
  Next: Phase V<N+1> (<first task>)
```

---

## 6. Files this roadmap creates — final list

| Phase | Path | Action |
|-------|------|--------|
| V0 | `apps/web/src/engine/MaterialFactory.ts` | new |
| V0 | `packages/shared-types/src/render.ts` | new |
| V0 | `apps/web/tests/visual/` | new tree |
| V1 | `apps/web/src/shaders/smallbody-asteroid.frag` | new |
| V1 | `apps/web/src/shaders/smallbody-asteroid-binary.frag` | new |
| V1 | `apps/web/src/shaders/smallbody-rubble.frag` | new |
| V1 | `apps/web/src/shaders/smallbody-kbo.frag` | new |
| V1 | `apps/web/src/shaders/smallbody-centaur.frag` | new |
| V1 | `apps/web/src/shaders/smallbody-trojan.frag` | new |
| V1 | `apps/web/src/shaders/meteoroid-stream.frag` | new |
| V2 | `apps/web/src/shaders/cluster-open.frag` | new |
| V2 | `apps/web/src/shaders/cluster-globular.frag` | new |
| V2 | `apps/web/src/shaders/cluster-ob.frag` | new |
| V2 | `apps/web/src/shaders/cluster-collision.frag` | new |
| V2 | `apps/web/src/shaders/lyman-alpha-blob.frag` | new |
| V3..V7 | `apps/web/src/shaders/planet-rocky.frag` + others | edit (add #defines) |
| V8 | `apps/web/src/shaders/star-brown-dwarf.frag` | new |
| V8 | `apps/web/src/shaders/star-subdwarf.frag` | new |
| V8 | `apps/web/src/shaders/star-carbon.frag` | new |
| V8 | `apps/web/src/shaders/star-pms.frag` | new |
| V12 | `apps/web/src/shaders/nebula-hh.frag` | new |
| V12 | `apps/web/src/shaders/nebula-pillar.frag` | new |
| V14 | `apps/web/src/shaders/transient-grb.frag` | new |
| V14 | `apps/web/src/shaders/transient-frb.frag` | new |
| V14 | `apps/web/src/shaders/transient-tde.frag` | new |
| V14 | `apps/web/src/shaders/transient-kilonova.frag` | new |
| V14 | `apps/web/src/shaders/transient-xrb.frag` | new |
| V15 | `apps/web/src/engine/*Material*.ts` | edit (delegate to factory) |
| V16 | `apps/web/tests/visual/baseline/**/*.jpg` | new (262 files) |
| V16 | `apps/web/tests/perf/baseline.json` | new |
| V16 | `.github/workflows/visual-regression.yml` | new |
| V16 | [docs/17-coverage-checklist.md](docs/17-coverage-checklist.md) | edit (mark all shipped) |
| V16 | [CLAUDE.md](CLAUDE.md) | edit (entity count 262) |
| V16 | `docs/17a-tier-b-extensions.md` | new |

---

## 7. End-state checklist

When every task is done, this file should show all checkboxes ticked:

- [ ] V0 — MaterialFactory + visual regression + coverage test infrastructure
- [ ] V1 — 20 small-body subtypes + 7 new shader files
- [ ] V2 — 12 LSS/cluster subtypes + 5 new shader files
- [ ] V3 — 27 planet subtypes polished via #define
- [ ] V4 — 15 moon subtypes polished
- [ ] V5 — 14 nebula subtypes polished
- [ ] V6 — 19 galaxy subtypes polished
- [ ] V7 — 12 LSS subtypes polished
- [ ] V8 — 20 Tier B stellar extensions
- [ ] V9 — 15 Tier B planet extensions
- [ ] V10 — 10 Tier B moon extensions
- [ ] V11 — 24 Bus-DeMeo asteroid classes
- [ ] V12 — 10 Tier B nebula extensions
- [ ] V13 — 10 Tier B galaxy extensions
- [ ] V14 — 19 Tier B LSS/transient/exotic extensions (5 LSS + 5 transient + 9 exotic)
- [ ] V15 — Integration: zero inline ShaderMaterial
- [ ] V16 — Visual + perf baseline + CI + docs updated
- [ ] **End state: 262 distinct shaders, 262 screenshots baseline, 262 passing coverage entries, FPS budget green**

At end state: every ENT-ID in Cosmos Explorer renders with its Doc 18 spec-correct visual signature. The universe catalog is visually complete at "100% realistic saturation".

---

**End of viz-visuals.md.** Start at T-V-00.
