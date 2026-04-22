# Doc 17 ENT-ID Coverage Checklist

> Authoritative tally of every Doc 17 subtype to shader file + owning task + status.
> Driven by `scripts/check-ent-coverage.mjs` — CI gate for Phase 2 (T41–T48).
> Source of truth: [docs/17-universe-entity-catalog.md](17-universe-entity-catalog.md) §"Summary of Entity Types".

## Rules

- One row per ENT-ID. Tổng = **154** (Doc 17 footer line 14003–14010 count).
  - CLAUDE.md legacy line nói "152"; Doc 17 là authoritative. Khi gate ship xong T48, cập nhật CLAUDE.md thành 154.
- `status` ∈ { `planned`, `in-progress`, `shipped`, `deferred` }.
  - `deferred` cho phép với speculative Doc 22 §2.1 nhưng phải có note lý do ở cột `notes`.
- `shader file` = path từ repo root. Nếu ENT-ID chia sẻ shader (ví dụ 7 loại M-dwarf dùng chung `star-mainseq.frag` via `#define`), ghi cùng path — script gom theo file để verify consolidation ≤ 5 per family.
- `task` = task ID chịu trách nhiệm ship. Có thể liệt kê nhiều nếu cross-task (ví dụ T28 ship bản đầu, T41 extend).
- `notes` — double-count có giải thích (Cataclysmic NS nằm cả `star-remnant` lẫn `star-variable` vì vật lý binary), speculative confidence tag (1–5), reference image link, etc.

## Stars (ENT-1000 series) — 31 subtypes, owner T41 (+ T28 for ENT-1031/1032)

| ENT-ID | Subtype | Shader file | Task | Status | Notes |
|--------|---------|-------------|------|--------|-------|
| ENT-1010 | O-Type Main Sequence | `apps/web/src/shaders/star-mainseq.frag` | T41 | shipped | `#define SPECTRAL_O` |
| ENT-1011 | B-Type Main Sequence | `apps/web/src/shaders/star-mainseq.frag` | T41 | shipped | `#define SPECTRAL_B` |
| ENT-1012 | A-Type Main Sequence | `apps/web/src/shaders/star-mainseq.frag` | T41 | shipped | `#define SPECTRAL_A` |
| ENT-1013 | F-Type Main Sequence | `apps/web/src/shaders/star-mainseq.frag` | T41 | shipped | `#define SPECTRAL_F` |
| ENT-1014 | G-Type Main Sequence | `apps/web/src/shaders/star-mainseq.frag` | T41 | shipped | `#define SPECTRAL_G` |
| ENT-1015 | K-Type Main Sequence | `apps/web/src/shaders/star-mainseq.frag` | T41 | shipped | `#define SPECTRAL_K` |
| ENT-1016 | M-Type Main Sequence | `apps/web/src/shaders/star-mainseq.frag` | T41 | shipped | `#define SPECTRAL_M` |
| ENT-1017 | L-Type Brown Dwarf | `apps/web/src/shaders/star-mainseq.frag` | T41 | shipped | `#define SPECTRAL_L` |
| ENT-1018 | T-Type Brown Dwarf | `apps/web/src/shaders/star-mainseq.frag` | T41 | shipped | `#define SPECTRAL_T` |
| ENT-1019 | Y-Type Brown Dwarf | `apps/web/src/shaders/star-mainseq.frag` | T41 | shipped | `#define SPECTRAL_Y` |
| ENT-1020 | Protostar / T Tauri | `apps/web/src/shaders/star-evolved.frag` | T41 | shipped | accretion disk + bipolar jets |
| ENT-1021 | Main Sequence (General) | `apps/web/src/shaders/star-mainseq.frag` | T41 | shipped | classification-only bucket |
| ENT-1022 | Subgiant | `apps/web/src/shaders/star-evolved.frag` | T41 | shipped | `u_phase` near MS→RGB |
| ENT-1023 | Red Giant / Supergiant | `apps/web/src/shaders/star-evolved.frag` | T41 | shipped | RGB + RSG combined |
| ENT-1024 | Blue Supergiant | `apps/web/src/shaders/star-evolved.frag` | T41 | shipped | |
| ENT-1025 | AGB Star | `apps/web/src/shaders/star-evolved.frag` | T41 | shipped | mass-loss wisps |
| ENT-1026 | Horizontal Branch | `apps/web/src/shaders/star-evolved.frag` | T41 | shipped | |
| ENT-1027 | Wolf-Rayet | `apps/web/src/shaders/star-evolved.frag` | T41 | shipped | ejected envelope |
| ENT-1028 | Luminous Blue Variable | `apps/web/src/shaders/star-evolved.frag` | T41 | shipped | S-Doradus cycles |
| ENT-1029 | Carbon Star | `apps/web/src/shaders/star-evolved.frag` | T41 | shipped | dust-shrouded |
| ENT-1030 | White Dwarf | `apps/web/src/shaders/star-remnant.frag` | T41 | shipped | |
| ENT-1031 | Neutron Star / Pulsar | `apps/web/src/shaders/star-remnant.frag` | T28 / T41 | shipped | T41 extends T28 exotic pulsar |
| ENT-1032 | Black Hole (stellar) | `apps/web/src/shaders/exotic-blackhole.frag` | T28 | shipped | gravitational lensing + accretion disk |
| ENT-1033 | Cepheid Variable | `apps/web/src/shaders/star-variable.frag` | T41 | shipped | P-L relation |
| ENT-1034 | RR Lyrae Variable | `apps/web/src/shaders/star-variable.frag` | T41 | shipped | |
| ENT-1035 | Mira Variable | `apps/web/src/shaders/star-variable.frag` | T41 | shipped | long-period |
| ENT-1036 | Eclipsing Binary | `apps/web/src/shaders/star-variable.frag` | T41 | shipped | + `star-binary.frag` overlay |
| ENT-1037 | Cataclysmic Variable | `apps/web/src/shaders/star-variable.frag` | T41 | shipped | double-count: also uses `star-remnant.frag` (WD component) — physical binary |
| ENT-1038 | Symbiotic | `apps/web/src/shaders/star-variable.frag` | T41 | shipped | |
| ENT-1039 | Blue Straggler | `apps/web/src/shaders/star-variable.frag` | T41 | shipped | |
| ENT-1040 | Hypergiant | `apps/web/src/shaders/star-evolved.frag` | T41 | shipped | extreme mass-loss |

## Planets (ENT-2000 series) — 27 subtypes, owner T42

| ENT-ID | Subtype | Shader file | Task | Status | Notes |
|--------|---------|-------------|------|--------|-------|
| ENT-2010 | Mercury-Type | `apps/web/src/shaders/planet-rocky.frag` | T42 | shipped | `#define ROCKY_MERCURY`, T13 shipped base |
| ENT-2011 | Venus-Type | `apps/web/src/shaders/planet-rocky.frag` | T42 | shipped | dense CO₂ atmosphere |
| ENT-2012 | Earth-Type | `apps/web/src/shaders/planet-rocky.frag` | T42 | shipped | full PBR + water + clouds |
| ENT-2013 | Mars-Type | `apps/web/src/shaders/planet-rocky.frag` | T42 | shipped | polar caps + dust |
| ENT-2020 | Jupiter-Type | `apps/web/src/shaders/planet-gas.frag` | T42 | shipped | banding + GRS |
| ENT-2021 | Saturn-Type | `apps/web/src/shaders/planet-gas.frag` | T42 | shipped | ring system sub-model |
| ENT-2025 | Uranus-Type | `apps/web/src/shaders/planet-gas.frag` | T42 | shipped | axis tilt 97.77° |
| ENT-2026 | Neptune-Type | `apps/web/src/shaders/planet-gas.frag` | T42 | shipped | storm spots |
| ENT-2030 | Hot Jupiter | `apps/web/src/shaders/planet-gas.frag` | T42 | shipped | day-night terminator |
| ENT-2031 | Super-Earth | `apps/web/src/shaders/planet-rocky.frag` | T42 | shipped | |
| ENT-2032 | Mini-Neptune | `apps/web/src/shaders/planet-gas.frag` | T42 | shipped | |
| ENT-2033 | Hycean World | `apps/web/src/shaders/planet-extreme.frag` | T42 | shipped | ocean + H₂ atmosphere |
| ENT-2034 | Eyeball (Tidally Locked) | `apps/web/src/shaders/planet-extreme.frag` | T42 | shipped | substellar hot spot |
| ENT-2035 | Magma / Lava World | `apps/web/src/shaders/planet-rocky.frag` | T42 | shipped | glowing surface |
| ENT-2036 | Ocean World | `apps/web/src/shaders/planet-rocky.frag` | T42 | shipped | |
| ENT-2037 | Carbon / Diamond | `apps/web/src/shaders/planet-rocky.frag` | T42 | shipped | high albedo |
| ENT-2038 | Iron Planet | `apps/web/src/shaders/planet-rocky.frag` | T42 | shipped | |
| ENT-2039 | Desert World | `apps/web/src/shaders/planet-rocky.frag` | T42 | shipped | |
| ENT-2040 | Rogue Planet | `apps/web/src/shaders/planet-rocky.frag` | T42 | shipped | self-emission only |
| ENT-2041 | Puffy Planet | `apps/web/src/shaders/planet-gas.frag` | T42 | shipped | ultra-low density |
| ENT-2042 | Protoplanet | `apps/web/src/shaders/planet-rocky.frag` | T42 | shipped | partial differentiation |
| ENT-2043 | Tidally-Heated Io-Type | `apps/web/src/shaders/planet-extreme.frag` | T42 | shipped | shares uniforms with ENT-3010 |
| ENT-2044 | Water World | `apps/web/src/shaders/planet-rocky.frag` | T42 | shipped | deep ocean, high pressure |
| ENT-2045 | Helium Planet | `apps/web/src/shaders/planet-gas.frag` | T42 | shipped | |
| ENT-2046 | Circumbinary | `apps/web/src/shaders/planet-gas.frag` | T42 | shipped | binary host |
| ENT-2047 | Synestia | `apps/web/src/shaders/planet-extreme.frag` | T42 | shipped | post-impact debris disk |
| ENT-2050 | Chthonian | `apps/web/src/shaders/planet-rocky.frag` | T42 | shipped | stripped gas-giant core |

## Moons (ENT-3000 series) — 15 subtypes, owner T43

| ENT-ID | Subtype | Shader file | Task | Status | Notes |
|--------|---------|-------------|------|--------|-------|
| ENT-3010 | Volcanic (Io-type) | `apps/web/src/shaders/moon-volcanic.frag` | T43 | shipped | SO₂ plumes |
| ENT-3011 | Cracked Ice (Europa) | `apps/web/src/shaders/moon-icy.frag` | T43 | shipped | chaos terrain |
| ENT-3012 | Hazy Atmosphere (Titan) | `apps/web/src/shaders/moon-atmospheric.frag` | T43 | shipped | methane lakes |
| ENT-3013 | Cratered Rocky (Luna) | `apps/web/src/shaders/moon-rocky.frag` | T43 | shipped | mare + highlands |
| ENT-3014 | Irregular / Captured | `apps/web/src/shaders/moon-rocky.frag` | T43 | shipped | Phobos-like |
| ENT-3015 | Cryo-Geyser (Enceladus) | `apps/web/src/shaders/moon-icy.frag` | T43 | shipped | tiger stripes |
| ENT-3016 | Ancient Surface (Callisto) | `apps/web/src/shaders/moon-rocky.frag` | T43 | shipped | heavy cratering |
| ENT-3017 | Magnetosphere (Ganymede) | `apps/web/src/shaders/moon-icy.frag` | T43 | shipped | aurora |
| ENT-3018 | Retrograde Capture (Triton) | `apps/web/src/shaders/moon-extreme.frag` | T43 | shipped | N₂ geysers |
| ENT-3019 | Extreme Geology (Miranda) | `apps/web/src/shaders/moon-extreme.frag` | T43 | shipped | Verona Rupes |
| ENT-3020 | Sponge (Hyperion) | `apps/web/src/shaders/moon-extreme.frag` | T43 | shipped | porous regolith |
| ENT-3021 | Shepherd Moon | `apps/web/src/shaders/moon-minor.frag` | T43 | shipped | |
| ENT-3022 | Trojan Moon | `apps/web/src/shaders/moon-minor.frag` | T43 | shipped | L4/L5 indicator |
| ENT-3023 | Binary Moon | `apps/web/src/shaders/moon-minor.frag` | T43 | shipped | orbital dance |
| ENT-3024 | Subsurface Ocean (Generic) | `apps/web/src/shaders/moon-icy.frag` | T43 | shipped | educational toggle |

## Small Bodies (ENT-4000 series) — 20 subtypes, owner T44

| ENT-ID | Subtype | Shader file | Task | Status | Notes |
|--------|---------|-------------|------|--------|-------|
| ENT-4010 | C-Type Asteroid | `apps/web/src/shaders/smallbody-asteroid.frag` | T44 | shipped | carbonaceous albedo |
| ENT-4011 | S-Type Asteroid | `apps/web/src/shaders/smallbody-asteroid.frag` | T44 | shipped | silicaceous |
| ENT-4012 | M-Type Asteroid | `apps/web/src/shaders/smallbody-asteroid.frag` | T44 | shipped | metallic |
| ENT-4013 | V-Type Asteroid | `apps/web/src/shaders/smallbody-asteroid.frag` | T44 | shipped | basaltic |
| ENT-4014 | Binary Asteroid | `apps/web/src/shaders/smallbody-asteroid-binary.frag` | T44 | shipped | two-lobe |
| ENT-4015 | Rubble-Pile | `apps/web/src/shaders/smallbody-rubble.frag` | T44 | shipped | aggregate lighting |
| ENT-4016 | Contact Binary | `apps/web/src/shaders/smallbody-asteroid-binary.frag` | T44 | shipped | Arrokoth-like |
| ENT-4020 | Short-Period Comet | `apps/web/src/shaders/smallbody-comet.frag` | T44 | shipped | two-tail model |
| ENT-4021 | Long-Period Comet | `apps/web/src/shaders/smallbody-comet.frag` | T44 | shipped | |
| ENT-4022 | Halley-Type Comet | `apps/web/src/shaders/smallbody-comet.frag` | T44 | shipped | retrograde |
| ENT-4023 | Interstellar Object | `apps/web/src/shaders/smallbody-comet.frag` | T44 | shipped | hyperbolic |
| ENT-4030 | Dwarf Planet (Pluto) | `apps/web/src/shaders/smallbody-kbo.frag` | T44 | shipped | tholin reddish |
| ENT-4031 | Dwarf Planet (Ceres) | `apps/web/src/shaders/smallbody-kbo.frag` | T44 | shipped | water-ice bright spots |
| ENT-4032 | Dwarf Planet (Eris) | `apps/web/src/shaders/smallbody-kbo.frag` | T44 | shipped | methane frost |
| ENT-4040 | Classical KBO | `apps/web/src/shaders/smallbody-kbo.frag` | T44 | shipped | |
| ENT-4041 | Resonant KBO (Plutino) | `apps/web/src/shaders/smallbody-kbo.frag` | T44 | shipped | 2:3 with Neptune |
| ENT-4042 | Scattered Disk Object | `apps/web/src/shaders/smallbody-kbo.frag` | T44 | shipped | |
| ENT-4050 | Centaur | `apps/web/src/shaders/smallbody-centaur.frag` | T44 | shipped | cometary-asteroidal mix |
| ENT-4051 | Jupiter Trojan | `apps/web/src/shaders/smallbody-trojan.frag` | T44 | shipped | L4/L5 indicator |
| ENT-4060 | Meteoroid Stream | `apps/web/src/shaders/meteoroid-stream.frag` | T44 | shipped | particle system |

## Nebulae (ENT-5000 series) — 14 subtypes, owner T45 (+ T27 base)

| ENT-ID | Subtype | Shader file | Task | Status | Notes |
|--------|---------|-------------|------|--------|-------|
| ENT-5010 | H II Region (Giant) | `apps/web/src/shaders/nebula-emission.frag` | T27 / T45 | shipped | T27 base shipped |
| ENT-5011 | H II Region (Compact) | `apps/web/src/shaders/nebula-emission.frag` | T45 | shipped | |
| ENT-5012 | H I Region | `apps/web/src/shaders/nebula-emission.frag` | T45 | shipped | 21cm hint |
| ENT-5020 | Planetary Nebula (Spherical) | `apps/web/src/shaders/nebula-planetary.frag` | T27 / T45 | shipped | |
| ENT-5021 | Planetary Nebula (Bipolar) | `apps/web/src/shaders/nebula-planetary.frag` | T45 | shipped | |
| ENT-5022 | Planetary Nebula (Irregular) | `apps/web/src/shaders/nebula-planetary.frag` | T45 | shipped | |
| ENT-5030 | Reflection Nebula | `apps/web/src/shaders/nebula-reflection.frag` | T27 | shipped | |
| ENT-5040 | Dark Nebula / MC | `apps/web/src/shaders/nebula-dark.frag` | T27 / T45 | shipped | |
| ENT-5041 | Bok Globule | `apps/web/src/shaders/nebula-dark.frag` | T45 | shipped | smaller silhouette |
| ENT-5050 | SNR (Shell) | `apps/web/src/shaders/nebula-supernova.frag` | T27 / T45 | shipped | |
| ENT-5051 | SNR (Plerion / PWN) | `apps/web/src/shaders/nebula-supernova.frag` | T45 | shipped | center-bright |
| ENT-5060 | Wolf-Rayet Nebula | `apps/web/src/shaders/nebula-wolfrayet.frag` | T45 | shipped | ring bubble |
| ENT-5070 | Protoplanetary Disk | `apps/web/src/shaders/nebula-protoplanetary.frag` | T45 | shipped | gaps + cavity |
| ENT-5080 | Superbubble | `apps/web/src/shaders/nebula-superbubble.frag` | T45 | shipped | low-density cavity |

## Galaxies (ENT-6000 series) — 19 subtypes, owner T46 (+ T29 base)

| ENT-ID | Subtype | Shader file | Task | Status | Notes |
|--------|---------|-------------|------|--------|-------|
| ENT-6010 | Spiral (SA) | `apps/web/src/shaders/galaxy-spiral.frag` | T29 / T46 | shipped | Milky Way from outside; inside-view via T46a MW composer |
| ENT-6011 | Barred Spiral (SB) | `apps/web/src/shaders/galaxy-spiral.frag` | T46 | shipped | `u_hasBar` |
| ENT-6012 | Lenticular (S0) | `apps/web/src/shaders/galaxy-lenticular.frag` | T29 | shipped | |
| ENT-6020 | Giant Elliptical | `apps/web/src/shaders/galaxy-elliptical.frag` | T29 / T46 | shipped | |
| ENT-6021 | Dwarf Elliptical (dE) | `apps/web/src/shaders/galaxy-elliptical.frag` | T46 | shipped | |
| ENT-6022 | Dwarf Spheroidal (dSph) | `apps/web/src/shaders/galaxy-elliptical.frag` | T46 | shipped | |
| ENT-6030 | Irregular (Irr I) | `apps/web/src/shaders/galaxy-irregular.frag` | T29 / T46 | shipped | |
| ENT-6031 | Irregular (Irr II) | `apps/web/src/shaders/galaxy-irregular.frag` | T46 | shipped | dust chaos |
| ENT-6040 | Seyfert 1/2 | `apps/web/src/shaders/galaxy-agn.frag` | T46 | shipped | ionization cone |
| ENT-6041 | Quasar | `apps/web/src/shaders/galaxy-agn.frag` | T46 | shipped | point-source dominant |
| ENT-6042 | Radio Galaxy | `apps/web/src/shaders/galaxy-agn.frag` | T46 | shipped | bipolar lobes |
| ENT-6043 | Blazar / BL Lac | `apps/web/src/shaders/galaxy-agn.frag` | T46 | shipped | jet pointed at us |
| ENT-6044 | LINER | `apps/web/src/shaders/galaxy-agn.frag` | T46 | shipped | |
| ENT-6050 | Starburst | `apps/web/src/shaders/galaxy-starburst.frag` | T46 | shipped | HII knot density |
| ENT-6051 | Ring Galaxy | `apps/web/src/shaders/galaxy-morphology-special.frag` | T46 | shipped | collision ring |
| ENT-6052 | Jellyfish Galaxy | `apps/web/src/shaders/galaxy-morphology-special.frag` | T46 | shipped | ram-pressure tail |
| ENT-6053 | ULIRG | `apps/web/src/shaders/galaxy-starburst.frag` | T46 | shipped | merger-driven SF |
| ENT-6054 | Ultra-Diffuse (UDG) | `apps/web/src/shaders/galaxy-morphology-special.frag` | T46 | shipped | low surface brightness |
| ENT-6055 | Merging / Interacting | `apps/web/src/shaders/galaxy-morphology-special.frag` | T46 | shipped | tidal bridges |

## Large-Scale Structure (ENT-7000 series) — 12 subtypes, owner T47 (+ T29 base)

| ENT-ID | Subtype | Shader file | Task | Status | Notes |
|--------|---------|-------------|------|--------|-------|
| ENT-7010 | Open Cluster | `apps/web/src/shaders/cluster-open.frag` | T47 | shipped | member-star list |
| ENT-7011 | Globular Cluster | `apps/web/src/shaders/cluster-globular.frag` | T47 | shipped | dense core |
| ENT-7012 | OB Association | `apps/web/src/shaders/cluster-ob.frag` | T47 | shipped | young-star grouping |
| ENT-7020 | Galaxy Group | *(T29 cluster node mesh extended)* | T29 / T47 | shipped | |
| ENT-7021 | Galaxy Cluster | *(T29 cluster node mesh extended)* | T29 / T47 | shipped | |
| ENT-7022 | Supercluster | *(T29 cluster node mesh extended)* | T29 / T47 | shipped | |
| ENT-7023 | Cluster Collision | `apps/web/src/shaders/cluster-collision.frag` | T47 | shipped | Bullet Cluster DM offset |
| ENT-7030 | Cosmic Filament | *(TubeGeometry, IllustrisTNG mesh)* | T29 / T47 | shipped | ≥500k nodes |
| ENT-7031 | Cosmic Void | *(sphere wireframe)* | T47 | shipped | Pan et al. catalog |
| ENT-7032 | Great Wall | *(LineSegments planar)* | T47 | shipped | Sloan + CfA2 |
| ENT-7033 | Lyman-α Blob | `apps/web/src/shaders/lyman-alpha-blob.frag` | T47 | shipped | diffuse sphere |
| ENT-7040 | CMB | *(Planck 2018 texture — exception per CLAUDE.md Rule #1)* | T29 / T47 | shipped | boundary sphere ~800u |

## Exotic Objects (ENT-8000 series) — 16 subtypes, owner T48 (+ T28 base)

| ENT-ID | Subtype | Shader file | Task | Status | Notes |
|--------|---------|-------------|------|--------|-------|
| ENT-8010 | Quark Star | `apps/web/src/shaders/exotic-compact.frag` | T48.1 | shipped | speculative tier-4, `#define EXOTIC_COMPACT_QUARK` |
| ENT-8011 | Strange Star | `apps/web/src/shaders/exotic-compact.frag` | T48.1 | shipped | speculative tier-4, `#define EXOTIC_COMPACT_STRANGE` |
| ENT-8012 | Preon Star | `apps/web/src/shaders/exotic-compact.frag` | T48.1 | shipped | speculative tier-5, default OFF |
| ENT-8013 | Boson Star | `apps/web/src/shaders/exotic-compact.frag` | T48.1 | shipped | speculative tier-5, default OFF |
| ENT-8014 | Gravastar | `apps/web/src/shaders/exotic-compact.frag` | T48.1 | shipped | speculative tier-5, default OFF |
| ENT-8015 | White Hole | `apps/web/src/shaders/exotic-gr-extreme.frag` | T48.1 | shipped | speculative tier-5, default OFF |
| ENT-8016 | Wormhole (Einstein-Rosen) | `apps/web/src/shaders/exotic-gr-extreme.frag` | T48.1 | shipped | speculative tier-5, default OFF |
| ENT-8017 | Cosmic String | `apps/web/src/shaders/exotic-topology.frag` | T48.1 | shipped | speculative tier-4 |
| ENT-8018 | Dark Matter Halo | `apps/web/src/shaders/exotic-dark.frag` | T48.1 | shipped | educational overlay |
| ENT-8019 | Dark Energy Void | `apps/web/src/shaders/exotic-dark.frag` | T48.1 | shipped | educational overlay, `#define EXOTIC_DARK_VOID` |
| ENT-8020 | Magnetar | `apps/web/src/shaders/exotic-magnetar.frag` | T28 | shipped | field-line rendering |
| ENT-8021 | Thorne-Żytkow Object | `apps/web/src/shaders/exotic-tzo.frag` | T48.1 | shipped | speculative tier-3 |
| ENT-8022 | Primordial Black Hole | `apps/web/src/shaders/exotic-primordial.frag` | T48.1 | shipped | speculative tier-3, Hawking glow |
| ENT-8023 | Quasi-Star | `apps/web/src/shaders/exotic-quasi-star.frag` | T48.1 | shipped | speculative tier-4 |
| ENT-8024 | Planck Star | `apps/web/src/shaders/exotic-planck.frag` | T48.1 | shipped | speculative tier-5, default OFF |
| ENT-8025 | Naked Singularity | `apps/web/src/shaders/exotic-gr-extreme.frag` | T48.1 | shipped | speculative tier-5, default OFF |

## Gate conditions

- `scripts/check-ent-coverage.mjs` parses this file's tables and asserts:
  1. Tổng số row = **154** (or update constant when Doc 17 itself changes).
  2. Không có duplicate ENT-ID.
  3. Mọi row có status ∈ `{planned, in-progress, shipped, deferred}`.
  4. `deferred` row phải có non-empty `notes`.
  5. Khi truyền `--require-shipped <range>`, mọi ENT-ID trong range đó phải có status `shipped`.
- Run locally: `node scripts/check-ent-coverage.mjs` hoặc `node scripts/check-ent-coverage.mjs --require-shipped 1010-1040` (khi đóng T41).
