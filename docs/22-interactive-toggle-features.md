# Interactive Toggle Features — Cosmos Explorer

**Document Version:** 4.2
**Date:** 2026-04-18
**Status:** Active
**Author:** Engineering Team
**Scope:** Comprehensive feature specification for 96 entity types across 9 categories
**Companion:** [23-spatial-universe-database.md](./23-spatial-universe-database.md) — Spatial database, coordinates, catalogs, navigation

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-12 | Initial entity-feature specification (lightweight) |
| 2.0 | 2026-04-15 | Reorganized into 9 categories with Camera section per entity |
| 4.1 | 2026-04-18 | **Completion pass: 81 → 96 entity types.** Added 15 previously-missing entities: Protostar Class 0/I (Stars), Earth-type Habitable Planet (Rocky Planets), Wolf-Rayet Nebula (Nebulae), Blazar/BL Lac, Radio Galaxy FR I/II, Jellyfish Galaxy, Ultra-Diffuse Galaxy, Compact Elliptical (Galaxies), Oort Cloud, Zodiacal Light/IPD (Small Bodies), Supermassive Black Hole, X-ray Binary, Tidal Disruption Event, Heliosphere/Astrosphere (Exotic Objects), Lyman-alpha Blob (Large-Scale Structure). Total features: ~2,500+. |
| 4.0 | 2026-04-18 | **Major expansion to 81 entity types.** Added 43 new entities across all categories: 8 new star types (T Tauri, Red Dwarf M-type, Brown Dwarf, O-Type Blue Giant, Red Supergiant, Carbon Star, Cataclysmic Variable, Hypervelocity Star), 5 exoplanet types (Super-Earth, Mini-Neptune, Rogue Planet, Circumbinary Planet, Directly Imaged Giant), 6 small bodies (KBO, Centaur, Interstellar Object, Trojan Cluster, Meteoroid Stream, Dwarf Planet Ceres-type), 8 galaxy types (Lenticular S0, Barred Spiral, Ring Galaxy, Starburst, Dwarf Spheroidal, Seyfert, Galaxy Merger, Quasar), 6 large-scale structure objects (Galaxy Cluster, Cosmic Web Filament, Cosmic Void, Globular Cluster, Open Star Cluster, Galaxy Supercluster — new Section 12), 10 exotic/transient objects (Kilonova, Gamma-Ray Burst, Gravitational Lens, Pulsar Wind Nebula, Type Ia Supernova, Accretion Disk, Bow Shock Nebula, CMB, Fast Radio Burst Source, Circumstellar Envelope/AGB Shell). Each new entity: 7–8 sections, 25–27 features with hex colors, FBM parameters, shader hints, and real exemplar references. Total features: ~2,150+. |
| 3.4 | 2026-04-18 | **Full 38-entity visual cross-check (Round 4).** Downloaded 25 additional reference images (39 total) covering ALL 38 entities. Visually compared every entity against real NASA/ESA/JWST/ALMA imagery or best available concept art. 2 corrections applied: (1) Uranus base color #6AAFCA→#C4DFD6 (pale greenish-cyan, per Irwin et al. 2024 MNRAS true-color reprocessing showing Voyager 2 imagery was over-saturated; derivative colors updated: equatorial #A0E0D8→#D0E8E2, temperate #88CFCA→#B0D0CC, polar haze #78C0C8→#A8CFC8, sunlit pole #A8E8DF→#D4EDE6, polar inversion warm #5A7FA8→#7A9FB0, equatorial cool #8ACFD8→#B8DDD8); (2) Neptune base color #5A7FA8→#91B3CD (moderate blue, same Irwin 2024 correction; derivative: equatorial darker #2A4A7F→#5A7FA8). All other 36 entities confirmed accurate against reference imagery. Reference images saved to `reference-images/` (39 files). |
| 3.3 | 2026-04-18 | **Visual cross-check corrections (Round 3).** Downloaded 14 real NASA/ESA reference images (SDO Sun 171Å, MESSENGER Mercury enhanced color, Juno Jupiter GRS, Galileo Europa/Io, Cassini Saturn hexagon/Titan, LRO Moon, Magellan Venus, Rosetta 67P, Hubble Orion Nebula/M51, EHT M87). Visually compared each image against doc features. 4 corrections: Mercury Caloris Basin floor color fixed from #4A4A52 "very dark basaltic" to #7A7268 intermediate-albedo volcanic smooth plains (MESSENGER enhanced color confirms); Europa lineae trough color fixed from #C0C5D8 blue-gray to #8B6B50 reddish-brown (Galileo reprocessed color confirms irradiated sulfur/salt compounds); Europa double ridge trough fixed from #8B9BB0 to #7A6050; Saturn hexagon diameter corrected from ~25,000 km to ~30,000 km across (NASA/Cassini measurement). Reference images saved to `reference-images/`. |
| 3.2 | 2026-04-18 | **Comprehensive feature-level cross-reference corrections (Round 2).** Applied ~60 corrections across all 38 entities from 5 detailed cross-reference reports. Key fixes: Magnetar field units (Gauss/Tesla fix, energy corrections off by 19+ orders of magnitude), AGN Type 1/2 classification corrected, torus size reduced to 1-10 pc, Pluto nitrogen ice coverage 40%→5-10%, Cthulhu Macula relocated to equator, SNR shock radius expanded to 1-30 ly, GRS shrunk to 14,000×11,000 km, Saturn hexagon side length corrected, Uranus winds corrected from 600→100-250 m/s, Europa ice shell thinned to 20-30 km, Luna permanent shadow coverage increased 300-600×, Gilgamesh basin relocated to correct hemisphere, multiple default-state corrections (bow shock OFF, WD magnetic OFF, G-type field lines OFF). See `22-*-feature-crossref.md` reports for full analysis. |
| 3.1 | 2026-04-17 | **Cross-reference corrections (Round 1).** Applied 47 color corrections, 12 animation/dynamics fixes, 8 critical parameter errors, and 4 default-state changes based on real NASA/ESA/JWST/Hubble imagery cross-reference. Key fixes: Uranus/Neptune true colors (2024 Oxford reprocessing), Neutron Star Vela period (89ms not 8s), Blue Supergiant H-alpha red not blue, Asteroid C-type darkened to real albedo, Magnetar surface white not tan. See `22-cross-reference-report.md` for full analysis. |
| 3.0 | 2026-04-16 | **Major expansion.** Every entity now has 7-9 sections with 28-40 features, each described with hex colors, scale parameters, animation timing, noise/procedural details, and shader implementation hints. Matches the depth of the Earth reference implementation (36 features across 8 sections). Total feature count: ~1,280+. |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Design Principles](#2-design-principles)
3. [Feature Specification Template](#3-feature-specification-template)
4. [Stars](#4-stars)
   - [G-Type (Sun-like)](#41-g-type-sun-like)
   - [Red Giant](#42-red-giant)
   - [Blue Supergiant](#43-blue-supergiant)
   - [Neutron Star / Pulsar](#44-neutron-star--pulsar)
   - [White Dwarf](#45-white-dwarf)
   - [Wolf-Rayet](#46-wolf-rayet)
   - [Black Hole (Stellar)](#47-black-hole-stellar)
   - [T Tauri (Pre-Main-Sequence)](#48-t-tauri-pre-main-sequence)
   - [Red Dwarf (M-Type Main Sequence)](#49-red-dwarf-m-type-main-sequence)
   - [Brown Dwarf (L/T/Y-Type)](#410-brown-dwarf-lty-type)
   - [O-Type Blue Giant](#411-o-type-blue-giant)
   - [Red Supergiant (M-Type Supergiant)](#412-red-supergiant-m-type-supergiant)
   - [Carbon Star (C-Type AGB)](#413-carbon-star-c-type-agb)
   - [Cataclysmic Variable (Classical Nova)](#414-cataclysmic-variable-classical-nova)
   - [Hypervelocity Star](#415-hypervelocity-star)
   - [Protostar (Class 0/I)](#416-protostar-class-0--class-i)
5. [Rocky Planets](#5-rocky-planets)
   - [Mercury-Type](#51-mercury-type)
   - [Venus-Type](#52-venus-type)
   - [Mars-Type](#53-mars-type)
   - [Magma World (Lava)](#54-magma-world-lava)
   - [Ocean World (Hycean Planet)](#55-ocean-world-hycean-planet)
   - [Super-Earth](#56-super-earth)
   - [Earth-Type Habitable Planet](#57-earth-type-habitable-planet)
6. [Gas Giants](#6-gas-giants)
   - [Jupiter-Type](#61-jupiter-type)
   - [Saturn-Type](#62-saturn-type)
   - [Uranus-Type (Ice Giant)](#63-uranus-type-ice-giant)
   - [Neptune-Type (Ice Giant)](#64-neptune-type-ice-giant)
   - [Hot Jupiter (Exoplanet)](#65-hot-jupiter-exoplanet)
   - [Mini-Neptune / Sub-Neptune](#66-mini-neptune--sub-neptune)
   - [Rogue Planet](#67-rogue-planet)
   - [Circumbinary Planet](#68-circumbinary-planet)
   - [Directly Imaged Giant](#69-directly-imaged-giant)
7. [Moons](#7-moons)
   - [Luna (Earth Moon)](#71-luna-earth-moon)
   - [Io (Volcanic Moon)](#72-io-volcanic-moon)
   - [Europa (Ice Moon)](#73-europa-ice-moon)
   - [Titan (Hazy Moon)](#74-titan-hazy-moon)
   - [Enceladus (Cryo-Geyser Moon)](#75-enceladus-cryo-geyser-moon)
   - [Ganymede (Magnetic Moon)](#76-ganymede-magnetic-moon)
8. [Nebulae](#8-nebulae)
   - [Emission Nebula (H II Region)](#81-emission-nebula-h-ii-region)
   - [Planetary Nebula](#82-planetary-nebula)
   - [Reflection Nebula](#83-reflection-nebula)
   - [Dark Nebula / Molecular Cloud](#84-dark-nebula--molecular-cloud)
   - [Supernova Remnant](#85-supernova-remnant)
   - [Wolf-Rayet Nebula (Wind-Blown Bubble)](#86-wolf-rayet-nebula-wind-blown-bubble)
9. [Galaxies](#9-galaxies)
   - [Spiral Galaxy (Milky Way-type)](#91-spiral-galaxy-milky-way-type)
   - [Elliptical Galaxy](#92-elliptical-galaxy)
   - [Irregular Galaxy](#93-irregular-galaxy)
   - [Active Galaxy (AGN/Quasar)](#94-active-galaxy-agnquasar)
   - [Lenticular Galaxy (S0)](#95-lenticular-galaxy-s0)
   - [Barred Spiral Galaxy](#96-barred-spiral-galaxy)
   - [Ring Galaxy](#97-ring-galaxy)
   - [Starburst Galaxy](#98-starburst-galaxy)
   - [Dwarf Spheroidal Galaxy](#99-dwarf-spheroidal-galaxy)
   - [Seyfert Galaxy (AGN)](#910-seyfert-galaxy-agn)
   - [Galaxy Merger](#911-galaxy-merger)
   - [Quasar](#912-quasar)
   - [Blazar (BL Lac / FSRQ)](#913-blazar-bl-lac--fsrq)
   - [Radio Galaxy (FR I / FR II)](#914-radio-galaxy-fr-i--fr-ii)
   - [Jellyfish Galaxy](#915-jellyfish-galaxy)
   - [Ultra-Diffuse Galaxy (UDG)](#916-ultra-diffuse-galaxy-udg)
   - [Compact Elliptical Galaxy (cE)](#917-compact-elliptical-galaxy-ce)
10. [Small Bodies](#10-small-bodies)
    - [Asteroid (C/S/M-type)](#101-asteroid-csm-type)
    - [Comet](#102-comet)
    - [Dwarf Planet (Pluto-type)](#103-dwarf-planet-pluto-type)
    - [Kuiper Belt Object (KBO)](#104-kuiper-belt-object-kbo)
    - [Centaur Object](#105-centaur-object)
    - [Interstellar Object (ISO)](#106-interstellar-object-iso)
    - [Trojan Asteroid Cluster](#107-trojan-asteroid-cluster)
    - [Meteoroid Stream](#108-meteoroid-stream)
    - [Dwarf Planet Ceres-type](#109-dwarf-planet-ceres-type)
    - [Oort Cloud](#1010-oort-cloud)
    - [Zodiacal Light / Interplanetary Dust Cloud](#1011-zodiacal-light--interplanetary-dust-cloud)
11. [Exotic Objects](#11-exotic-objects)
    - [Magnetar](#111-magnetar)
    - [Binary Star System](#112-binary-star-system)
    - [Protoplanetary Disk](#113-protoplanetary-disk)
    - [Kilonova](#114-kilonova)
    - [Gamma-Ray Burst (Long GRB)](#115-gamma-ray-burst-long-grb)
    - [Gravitational Lens](#116-gravitational-lens)
    - [Pulsar Wind Nebula](#117-pulsar-wind-nebula)
    - [Type Ia Supernova](#118-type-ia-supernova)
    - [Accretion Disk (Standalone)](#119-accretion-disk-standalone)
    - [Bow Shock Nebula](#1110-bow-shock-nebula)
    - [Cosmic Microwave Background](#1111-cosmic-microwave-background)
    - [Fast Radio Burst Source (FRB Magnetar)](#1112-fast-radio-burst-source-frb-magnetar)
    - [Circumstellar Envelope / AGB Shell](#1113-circumstellar-envelope--agb-shell)
    - [Supermassive Black Hole (SMBH)](#1115-supermassive-black-hole-smbh)
    - [X-ray Binary (HMXB / LMXB)](#1116-x-ray-binary-hmxb--lmxb)
    - [Tidal Disruption Event (TDE)](#1117-tidal-disruption-event-tde)
    - [Heliosphere / Astrosphere](#1118-heliosphere--astrosphere)
12. [Large-Scale Structure](#12-large-scale-structure)
    - [Galaxy Cluster](#121-galaxy-cluster)
    - [Cosmic Web Filament](#122-cosmic-web-filament)
    - [Cosmic Void](#123-cosmic-void)
    - [Globular Cluster](#124-globular-cluster)
    - [Open Star Cluster](#125-open-star-cluster)
    - [Galaxy Supercluster](#126-galaxy-supercluster)
    - [Lyman-Alpha Blob (LAB)](#127-lyman-alpha-blob-lab)
13. [Spatial Database Integration](#13-spatial-database-integration)
14. [Implementation Notes](#14-implementation-notes)
15. [Audio System Integration](#15-audio-system-integration)
16. [Guided Tours, Comparison Mode, Bookmarks & Sharing](#16-guided-tours-comparison-mode-bookmarks--sharing)
17. [Accessibility & Mobile Layout](#17-accessibility--mobile-layout)
18. [References & Sources](#18-references--sources)

---

## 1. Overview

### 1.1 Purpose
Interactive Toggle Features allow users to selectively enable or disable visual characteristics of celestial objects in the Cosmos Explorer demo and detail views. Each entity type (star, planet, moon, nebula, galaxy, etc.) is composed of a **layered set of togglable visual elements**, each independently controlled via a single boolean shader uniform or a compact set of related uniforms.

This document specifies every toggleable feature for **96 distinct entity types** across **9 categories**. Features are grounded in real astrophysics, rendered with procedural GLSL shaders, and designed to be both scientifically accurate and visually compelling.

### 1.2 Companion Documents
- **Doc 17** — *Universe Entity Catalog & Taxonomy*: physical/taxonomic reference (superseded by this document for rendering specs).
- **Doc 18** — *Visual Rendering & Shader Specification*: GLSL shader implementations, noise functions, post-processing chain.
- **Doc 19** — *Navigation System & Scale Transitions*: how entities appear at different scales.
- **Doc 20** — *UI Specs per Persona*: how toggles are surfaced in the Explorer/Educator/Creator modes.

### 1.3 Earth as the Depth Reference
The Earth implementation (see `demo-earth-hq.html`) defines the **depth reference** per entity: **36 togglable features grouped into 8 sections** (Surface, Ocean, Weather, Atmosphere, Life, Intelligence, Megastructures, Camera). Other entities range from **20–35 features** depending on the complexity and observational data available for each type, with an average of **26.5 features/entity**.

### 1.4 Feature Count Summary

| Category | Entity Types | Total Features | Avg Features/Entity |
|---------|---------|---------|---------|
| Stars | 16 | ~416 | 26.0 |
| Rocky Planets | 7 | ~180 | 25.7 |
| Gas Giants | 9 | ~251 | 27.9 |
| Moons | 6 | ~148 | 24.7 |
| Nebulae | 6 | ~165 | 27.5 |
| Galaxies | 17 | ~436 | 25.6 |
| Small Bodies | 11 | ~256 | 23.3 |
| Exotic Objects | 17 | ~447 | 26.3 |
| Large-Scale Structure | 7 | ~178 | 25.4 |
| **TOTAL** | **96** | **~2,477** | **25.8** |

Each entity additionally includes a universal **Camera section** (3 features: Light Direction, Time Speed Multiplier, Auto-Rotate) that is consistent across all types.

---

## 2. Design Principles

### 2.1 Physical Realism First
Every visual feature must be grounded in one of:
- **Direct observation** (e.g., Jupiter's Great Red Spot, Saturn's rings, solar granulation, Mars dust storms).
- **Theoretically established physics** (e.g., Hawking radiation, frame-dragging near black holes, pulsar wind nebulae).
- **Plausible speculation with explicit labeling** (e.g., Europa's subsurface ocean glow, protoplanetary disk dead zones).

Speculative features are marked **(Speculative)** in their description and always default to OFF. Educational/pedagogical overlays (e.g., field-line visualizations, grid markings) are labeled **(Educational)** and also default OFF.

### 2.2 Entity Distinctiveness
Features are entity-specific. The same *category* of feature (e.g., "clouds") will have entirely different shader implementations, color palettes, and animation parameters for Earth, Venus, Titan, Jupiter, and Neptune. Reusing a Uniform name across different entity types is prohibited unless the physics is truly identical.

### 2.3 Default State Logic
- **Default ON** — Features representing the entity's canonical/recognizable appearance:
  - Sun: granulation, limb darkening, corona, sunspots.
  - Earth: oceans, continents, clouds, atmosphere.
  - Saturn: rings, banded atmosphere, polar hexagon.
  - Jupiter: Great Red Spot, zonal bands, faint ring.
- **Default OFF** — Exotic, speculative, educational, or high-performance-cost features:
  - Gravitational lensing around black holes.
  - Pulsar beam sweeping when star is isolated (not in binary).
  - Subsurface ocean glow on ice moons.
  - Interior cutaway mode (core visualization).
  - Magnetic-field-line wireframe overlays.

### 2.4 Shader Uniform Convention
All toggle uniforms follow the pattern `u[CamelCaseFeatureName]`. Because WebGL 1 does not support `bool` uniforms cleanly on all drivers, booleans are emulated as `float` (`0.0` = off, `1.0` = on):

```glsl
uniform float uGranulation;     // 0.0 or 1.0
uniform float uSolarFlares;
uniform float uDustStorms;
uniform float uCoronalLoops;
uniform float uPolarIceCaps;
uniform float uSubsurfaceOcean;
```

For multi-state features (e.g., a slider for cloud density), a second uniform `u[Name]Amount` of range [0.0, 1.0] may accompany the boolean toggle.

### 2.5 Camera Section (Universal)
Every entity has a 3-feature Camera section:

| Feature | Uniform | Purpose |
|---|---|---|
| Light Direction | `uLightDir` | vec3 pointing from object to primary light source (star, galaxy center, etc.) |
| Time Speed Multiplier | `uTimeSpeed` | Float controlling simulation speed; `1.0` = real-time |
| Auto-Rotate | `uAutoRotate` | Boolean (as float) — whether the camera orbits the object |

Time-speed defaults vary by entity physics: a pulsar rotates in milliseconds so `uTimeSpeed = 1000x`; galaxy dynamics run over gigayears so `uTimeSpeed = 1e9x`; a sun-like star's granulation has minute timescales so `uTimeSpeed = 86400x` (1 sec = 1 day).

### 2.6 Logical Section Grouping
Features within each entity are grouped into **7-9 logical sections** (plus Camera). Common section themes:

- **Surface / Photosphere** — visible outer layer texture and color
- **Interior / Core** — subsurface or cutaway features
- **Atmosphere** — gas layers, haze, scattering
- **Weather / Activity** — dynamic, time-varying phenomena
- **Magnetic Field** — field line structure, aurorae, magnetospheric effects
- **Rings / Disk** — orbiting particulate structures
- **Ejecta / Outflow** — jets, winds, outbursts
- **Moons / Satellites** — orbiting companion objects
- **Environmental Interaction** — bow shocks, tidal effects, torus interactions
- **Speculative / Advanced** — exotic or educational visualizations
- **Camera** — universal lighting, time, rotation controls

### 2.7 Description Depth Standard
Each feature's Description field must contain **2-4 rich sentences** covering:
1. **Physical basis** — what real phenomenon is being rendered.
2. **Visual appearance** — explicit hex color codes (`#RRGGBB`), brightness relative to base.
3. **Scale parameters** — quantitative size (km, AU, ly, radius multiples).
4. **Animation timing** — angular velocity (rad/s), period, or frame-rate-independent evolution.
5. **Noise / procedural details** — FBM octaves, Simplex/Worley frequencies, amplitudes.
6. **Shader implementation hint** — blend mode, modulation target, or pseudocode snippet.
7. **Default ON/OFF rationale** — why this default was chosen.

---

## 3. Feature Specification Template

Each entity section follows this structure:

```markdown
### <Entity Display Name>

**Entity ID:** ENT-XXXX
**Description:** <2-3 sentence physical overview with hex colors and real exemplars>

**Section Count:** <N> (<list of sections>)
**Total Feature Count:** <count>

#### <Section Name> (<feature count>)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| ... | ... | u<Name> | ON/OFF | Rich 2-4 sentence description with hex colors, scale, animation, noise, shader hint, rationale. |

... (repeat for all sections)

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Light Direction | uLightDir | <source> | ... |
| Camera | Time Speed Multiplier | uTimeSpeed | <multiplier> | ... |
| Camera | Auto-Rotate | uAutoRotate | ON/OFF | ... |

---
```

---

## 4. Stars

Stars are classified here by spectral type and evolutionary stage. Each has uniquely characteristic features: for main-sequence stars (G-Type), surface granulation and magnetic activity dominate; for evolved stars (Red Giant, Wolf-Rayet), mass loss and circumstellar material take center stage; for compact remnants (Neutron Star, White Dwarf, Black Hole), extreme physics (magnetospheres, lensing, relativistic jets) define the visualization.

### G-Type (Sun-like)

**Entity ID:** ENT-1007
**Description:** Sun-like main-sequence star (spectral class G2V) with moderate convection, 11-year magnetic cycle, and stable hydrogen-core fusion. Effective temperature ~5778 K produces yellow-white blackbody peak (#FFF4E0 centered, reddening toward limb at #FFB85C). Real exemplars: Sol, Alpha Centauri A, Tau Ceti.

**Section Count:** 8 (Core & Interior, Photosphere, Chromosphere, Corona, Activity, Magnetic Field, Solar Wind & Heliosphere, Camera)
**Total Feature Count:** 33

#### Core & Interior (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Core | Radiative Zone Glow | uRadiativeZone | OFF | Speculative cross-section visualization showing hot core (#FFFFFF, inner 25% radius) transitioning outward through radiative zone (#FFEFB3, 25–70% radius) where photons random-walk for ~170,000 years. Rendered as volumetric gradient only when cutaway view enabled. Implementation: radial FBM 3-octave Simplex noise (freq 2.2, amplitude 0.4) modulation on spherical-harmonic color ramp; operates in normalized depth gradient. |
| Core | Convection Zone Rolls | uConvectionZone | ON | Subsurface turbulent churn (70–100% radius) where plasma cells rise and sink at ~1 km/s. Visualized as subsurface flow with low-frequency 3D Simplex noise (freq 3.5, amplitude 0.3), visible in cutaway mode. Color: hot upwellings #FF9F3D against cooler downdrafts #B4561D. Animated with time-varying phase offset (0.003 rad/s). |
| Core | Helioseismic Modes | uHelioseismicModes | OFF | Standing-wave p-mode oscillations with characteristic 5-minute period visualized as overlaid spherical-harmonic grid (l=0..10, m modes). Educational overlay shown as faint blue-white wireframe (#7CB8FF @ 0.3 alpha) with Fresnel rim enhancement at 0.8 falloff. Oscillation amplitude ~1 cm/s scaled to visible sphere. |

#### Photosphere (6 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Photosphere | Granulation | uGranulation | ON | Convective cell pattern covering entire visible surface; ~1000 km cells with 8–20 minute lifetimes. Procedurally generated via Voronoi + FBM Simplex noise (freq 45.0, 3 octaves, amplitude 0.6) with bright centers (#FFE8B5, ~5900 K) and dark lanes (#C67A2D, ~5200 K). Subtly animated at 0.08 rad/s to suggest convective motion without distraction. Fills all uncovered pixels; essential for realism. |
| Photosphere | Supergranulation | uSupergranulation | ON | Larger-scale convective network (30,000 km cells, ~24-hour lifetime). Lower-frequency Simplex (freq 8.0, amplitude 0.15) overlays granulation, producing 5% brightness modulation. Color: subtle darkening in valleys. Drifts at 0.02 rad/s tangent to surface; modulates granulation intensity by ±20%. |
| Photosphere | Limb Darkening | uLimbDarkening | ON | Photosphere edge appears ~2.2× darker due to opacity gradient and temperature stratification. Implemented as pow(dot(N, V), 0.6) Fresnel falloff, ramped #FFF4E0 to #FF8844 across limb. Critical for realistic solar disk appearance and 3D perception. |
| Photosphere | Facular Brightening | uFacularBrightening | ON | Bright regions (active region precursors) surrounding sunspot magnetic fields. Voronoi-seeded bright spots (#FFFACD, +8% intensity) at fract(freq 20.0) locations. Correlates with spot cycle; features brighten 1–2 days before spots emerge. Animated with slow drift (0.01 rad/s). |
| Photosphere | Spicule Texture | uSpiculeTexture | OFF | Chromospheric needle-like jets penetrating photosphere, visible at limb. Rendered as fine radial texture (normal map, freq 120.0, 2-octave detail) with subtle height displacement (~0.5% radius). Only visible near terminator; alpha fade with rim effect. Speculative detail feature. |
| Photosphere | Photospheric Inflation | uPhotosphericInflation | OFF | Subtle radial expansion from base model (±0.2%) modulated by granulation intensity. Adds micro-relief detail visible under zoom. Implemented as displacement texture with FBM-driven amplitude; creates visual depth. |

#### Chromosphere (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Chromosphere | Chromosphere Layer | uChromosphereLayer | ON | Thin reddish layer (~3000 km, ~0.004 radius) above photosphere, visible during solar eclipses and at limb. Color: gradient from #FF6B4A (inner) to #FFA585 (outer), driven by H-alpha emission at 656.3 nm. Implemented as additive overlay sphere with Fresnel rim enhancement; alpha = pow(1-dot(N,V), 2.5) * 0.4. |
| Chromosphere | Spicule Forest | uSpiculeForest | ON | Thousands of upward-pointing jets extending 5–10 Mm above photosphere, creating flamelet appearance at limb. Rendered as thin needle geometry (lines) radiating outward from surface, grouped in clusters. Animated with oscillatory vertical motion (freq 0.05 rad/s, amplitude 0.003 radius). Color: pink (#FF8B7F) with exponential opacity falloff. |
| Chromosphere | Mottled Texture | uMottledTexture | ON | Fine-scale brightness variation in chromosphere from acoustic wave heating. FBM Simplex (freq 35.0, 4 octaves, amplitude 0.7) applied as additive color overlay. Slower animation (0.015 rad/s) than photosphere. Creates intricate detail visible at high zoom. |
| Chromosphere | Limb Prominences | uLimbProminences | ON | Arched plasma structures above chromosphere, often rooted at sunspot polarity reversals. Bezier-curve splines anchored at surface; ~50 major features. Animated vertical rise/fall (period 2.5 rad/s). Color: gradient #FF5A5A to #FF8B6A. Height: 20–100 Mm, scaled to visible sphere. |

#### Corona (5 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Corona | Corona Haze | uCoronaHaze | ON | Extended diffuse halo showing million-kelvin plasma. Rendered as additive sphere (1.05–3.0 radius) with color #F0E6D2 (slightly cooler than photosphere but ionized appearance) and exponential density falloff. Alpha: smoothstep(1.0, 1.2, radius) * 0.25. Critical for thermal energy visualization. |
| Corona | Coronal Loops | uCoronalLoops | ON | Bright magnetic field line structures threading through corona, bright loops bridging sunspots. Rendered as lines/tubes connecting spot pairs; ~100 major loops animated with time-varying brightness. Magnetic field direction computed from sunspot positions; loops follow Bezier paths. Color: bright white (#FFFFFF @ 0.7 intensity) with glow effect. Animation: pulsing opacity (freq 0.05 rad/s, amplitude ±0.3). |
| Corona | Helmet Streamers | uHelmetStreamers | ON | Helmet-shaped magnetic structures extending equatorially, especially near sunspot zones. Rendered as wide arches (tube geometry, 0.5 Mm width scaled) with gradient color (#FFFACD inner, #FFA500 outer). Height: 200–500 Mm. Count: ~8 major streamers. Animated latitude drift (0.01 rad/s) with solar rotation. |
| Corona | Coronal Mass Ejection (Animated) | uCoronalMassEjections | ON | Large eruptions ejecting plasma from corona at 500–3000 km/s. Triggered probabilistically every 6–24 simulated hours (scaled to activity level; real rate 0.5–6 CME/day at solar max). Rendered as expanding blob/cloud of white plasma (#FFFFFF, additive blend) accelerating outward from corona at ~0.001 radius/frame. Duration: 2–4 simulated hours. Creates dramatic energetic events. |
| Corona | Coronal Dimming | uCoronalDimming | OFF | Dark region in corona preceding/during CMEs where mass has been ejected (optical depth drop). Rendered as localized darkness overlay (negative additive color, -0.15 intensity) fading over 1 hour. Speculative feature; educational. |

#### Activity (5 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Activity | Sunspots | uSunspots | ON | Dark, cooler magnetic regions (3000–4500 K, #8B6914 to #4A3410) with 11-year cyclic activity. Spots consist of umbra (dark core, #4A3410) surrounded by penumbra (lighter, #8B6914). Procedurally placed via FBM (freq 5.0 + time offset) with lifetime 2–30 days. Size: 5,000–200,000 km. Butterfly diagram latitude distribution: peaks ±30–35° at cycle start, migrates toward equator. |
| Activity | Spot Magnetic Field | uSpotMagneticField | OFF | Explicit visualization of sunspot magnetic field lines; loops connecting umbra polarity regions. Rendered as curved lines (Bezier) with color gradient blue (#4169E1) to red (#DC143C) indicating field direction. Field strength visualization: line thickness ∝ field strength (10^3–10^4 Gauss). Speculative but scientifically motivated. |
| Activity | Solar Flares | uSolarFlares | ON | Sudden bright eruptions in active regions, releasing ~10^20–10^25 joules. Rendered as quick bright flashes (#FFFACD additive, peak 2–3× normal intensity) at sunspot locations, lasting 5–30 minutes. Probability correlates with spot count; multi-flare events possible. Animated expansion/contraction. |
| Activity | Eruptive Prominences | uEruptiveProminences | ON | Arched plasma structures above chromosphere, occasionally erupting. Animated upward acceleration (up to 500 km/s) followed by fallback. Duration: 1–2 simulated hours. Color: #FF7F50 with velocity-based brightness. Creates dynamic activity. |
| Activity | Plage Regions | uPlageRegions | ON | Bright facular regions in chromosphere above active regions, often preceding/surrounding sunspots. Rendered as Voronoi-seeded bright patches (#FFFFE0, +12% intensity) at freq 18.0. Lifetime matches associated spot (2–30 days). Adds complexity to magnetic activity. |

#### Magnetic Field (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Magnetic | Magnetic Field Lines (Global) | uMagneticFieldLines | OFF | Large-scale dipole + quadrupole field threading through corona. Rendered as bezier curves (200+ curves) with color gradient blue (#4169E1, north) to red (#DC143C, south) polarity. Field strength: ~1 Gauss surface, decaying as r^-3. Lines animated with slow precession (0.002 rad/s) reflecting 11-year cycle phase. |
| Magnetic | Polarity Reversal | uPolarityReversal | OFF | Magnetic field inversion at cycle maximum; brief period where old and new field coexist. Rendered as mixed blue/red field lines at poles, creating visual confusion. Duration: ~1 month simulated. Speculative educational feature. |
| Magnetic | Polar Coronal Holes | uPolarCoronalHoles | ON | Extended open-field regions at poles where solar wind escapes freely. Rendered as darker corona regions (0.5× normal intensity) with radial field lines extending outward. Color: darker #D0D0E8. Creates V-shaped appearance at poles. Rotates with star. |
| Magnetic | Heliosphere Boundary | uHeliosphereBoundary | OFF | Faint sphere marking heliopause (~120 AU), boundary of solar magnetic dominance. Rendered as translucent wireframe sphere (0.002 opacity, color #87CEEB). Speculative; educational only. Shows relative scale of solar influence. |

#### Solar Wind & Heliosphere (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| WindFlow | Solar Wind Streaks | uSolarWindStreaks | OFF | Visible streamlines showing outflowing solar wind (~400 km/s). Rendered as thin white lines (#FFFFFF @ 0.4 alpha) emanating from corona, diverging outward. Lines animated outward motion (0.002 radius/frame). Count: ~50 major streams. Educational visualization. |
| Orbital | Interplanetary Magnetic Field | uInterplanetaryMagneticField | OFF | Archimedean spiral structure of solar magnetic field wrapped by solar rotation; visible as rotating spiral pattern extending outward. Rendered as wireframe spiral (Parker spiral). Color: gradient blue–red. Speculative geometric visualization. |
| Radiation | Coronal Radiation Zones | uCoronalRadiationZones | OFF | High-energy particle zones in corona from magnetic reconnection events. Rendered as localized bright regions (#FFFF99, additive) around flare sites, fading over hours. Represents X-ray/UV burst zones. Educational feature. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Light Direction | uLightDir | SELF | Star IS the light source; uniform fixed to normalized view position. Surface shading uses radial view-angle dependency (Fresnel) instead of directional. |
| Camera | Time Speed Multiplier | uTimeSpeed | 86400x | 1 real second = 1 simulated day. Allows observing granulation lifetimes (~10 min ~ 0.7 real sec at 100x), rotation (25 days ~ 30 sec), and spot evolution. |
| Camera | Auto-Rotate | uAutoRotate | ON | Camera orbits at ~0.05 rad/s to reveal differential rotation (faster equator ~25 days vs. poles ~35 days), limb darkening variation, and 11-year spot cycle progression. |

---

### Red Giant

**Entity ID:** ENT-1012
**Description:** Evolved star with expanded envelope, cool photosphere (3000–4000 K), and intense convection. Ascending AGB branch with heavy mass loss and potential thermal pulsing. Real exemplars: Betelgeuse, Aldebaran, Arcturus.

**Section Count:** 8 (Expanded Envelope, Photosphere, Chromosphere, Pulsation, Mass Loss & Dust, Circumstellar Shell, Composition, Camera)
**Total Feature Count:** 28

#### Expanded Envelope (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Envelope | Huge Diffuse Envelope | uExpandedEnvelope | ON | Enormous diffuse outer layer; radius 100–1000 solar radii. Rendered as translucent sphere (1.1–2.5 radius, color #FF6B1A to #FFA54A gradient, alpha 0.15). Contains cool plasma at 3000–4000 K. Procedurally colored with FBM noise (freq 4.0, amplitude 0.3) to show density variation. Essential for visual scale contrast. |
| Envelope | Envelope Boundary Ripples | uEnvelopeBoundaryRipples | ON | Subtle undulations on envelope surface from acoustic waves and convective motion. Rendered as displacement map (FBM 2-octave, freq 12.0, amplitude 0.02 radius). Creates subtle depth and texture. Animated rotation (0.008 rad/s). |
| Envelope | Atmospheric Gradient | uAtmosphericGradient | ON | Continuous density/temperature falloff from photosphere to envelope edge. Implemented as exponential smoothstep transition with color gradient from #FF4A1A (core) to #8B4513 (edge). 1000 km above photosphere: intermediate #CC6B2A. Creates sense of depth. |
| Envelope | Convective Cell Shadows | uConvectiveCellShadows | ON | Giant convection cells (10,000+ km) visible as subtle brightness variations on envelope. Voronoi-based cell structure (freq 6.0) with ±3% intensity modulation. Slower animation (0.015 rad/s) than Sun. Fills envelope with texture. |

#### Photosphere (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Photosphere | Cool Red Coloration | uCoolRedColoration | ON | Photosphere color reflects cool temperature (3000–4000 K); deep orange-red (#FF7A2D, 3600 K reference). Implemented as base color with temperature-dependent tint (lower → redder). Limb color shifts to darker #B85A2A due to opacity. Defines star's primary visual character. |
| Photosphere | Giant Convection Cells | uMassiveConvectionCells | ON | Enormous visible convective granules (10,000–100,000 km cells); mottled pattern dominates surface. Rendered via Voronoi (freq 5.0) + FBM (freq 8.0, amplitude 0.25). Bright upwelling centers (#FF7A3A) vs. dark descending lanes (#CC4A1A, ~15% darker). Subtly animated (0.05 rad/s). |
| Photosphere | Titanium Oxide Bands | uTitaniumOxideBands | ON | Strong absorption by TiO molecules in cool atmosphere creates visible banding in spectrum (visual). Rendered as dark radial bands using spherical harmonics (l=2, m=1–3 modes). Color: dark streaks #6B3A1A overlaid on photosphere. Defining spectral feature of M-class cool stars — observationally confirmed in all M-type spectra. Essential for accurate spectral appearance. |
| Photosphere | Dark Spot Regions | uDarkSpotRegions | ON | Cool magnetic regions analogous to sunspots but larger and longer-lived. Rendered at freq 4.0 locations as darker patches (#4A2A0A, ~30% dimmer). Size: 50,000–500,000 km. Lifetime: 100+ days. Correlates with mass-loss rate variations. |

#### Chromosphere (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Chromosphere | Extended Chromosphere | uExtendedChromosphere | ON | Chromosphere extends to larger heights (~5–10× solar value) due to low gravity. Rendered as thin shell (1.008–1.040 radius) with color #FF8B6B (slightly brighter than photosphere, H-alpha driven). Alpha gradient: smoothstep(1.008, 1.04, r) * 0.35. Critical for AGB star appearance. |
| Chromosphere | Chromospheric Lines | uChromosphericLines | ON | Emission lines visible in chromosphere: H-alpha (656.3 nm, red), Ca II (violet), Mg II. Rendered as additive layer with Balmer-series color #FF5A4A. FBM modulation (freq 25.0) creates fine structure. Slow animation (0.01 rad/s). |
| Chromosphere | Shock Waves | uShockWaves | OFF | Acoustic shocks from convection cells can create observable emission features. Rendered as radial ripples emanating from cell centers; ephemeral. Speculative detail; ON during pulsation. |

#### Pulsation & Oscillation (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Pulsation | Radial Oscillation | uRadialOscillation | ON | Periodic radial expansion/contraction; fundamental mode period 50–200 days. Rendered as sphere radius modulation: radius(t) = r_base * (1 + 0.08 * sin(2π*t/T)). T ~100 days simulated (~2 sec at 86400x acceleration). Velocity reaches ±5 km/s at surface. Fundamental visual feature. |
| Pulsation | Multi-Mode Oscillations | uMultiModeOscillations | OFF | Higher-mode oscillations (2f, 3f, etc.) overlaid on fundamental; creates amplitude modulation. Amplitude: 0.005–0.02 (smaller). Visible as breathing texture variation. Speculative advanced feature. |
| Pulsation | Brightness Variation | uBrightnessVariation | ON | Photospheric brightness changes with pulsation phase; expansion → cooling → dimming (T ∝ L^0.25). Rendered as base intensity multiplier: brightness *= (1 + 0.20 * sin(phase)) for semi-regular variables; up to 0.50 for Miras. Creates visual depth. Period matches radial period. |
| Pulsation | Velocity Field Visualization | uVelocityFieldVisualization | OFF | Overlay arrows/glyphs showing radial velocity field during pulsation. Inflow (blue, convergent) vs. outflow (red, divergent). Speculative kinematic visualization; educational. |

#### Mass Loss & Dust (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Outflow | Stellar Wind | uStellarWind | ON | Dense, slow wind (10–100 times solar) driven by radiation pressure on dust. Rendered as faint outflow of cool gas (#AA6644, alpha 0.08) expanding from photosphere at 10–30 km/s. Wispy particle trails animated outward (0.001 radius/frame). Creates expanding halo effect. |
| Dust | Circumstellar Dust Shell | uCircumstellarDustShell | ON | Dust condenses in cool stellar wind, creating visible reddened/opaque shell. Rendered as darker, redder atmosphere (color #8B4513) with opacity ramp (0.05–0.15) from 1.05–1.30 radius. Dust temperature ~1000 K. Scatters/absorbs light. |
| Dust | Dust Clumping | uDustClumping | ON | Dust distribution is non-uniform; clumps driven by wind instabilities. Voronoi-seeded clumpy structure (freq 4.0) with ±2× density variation. Creates asymmetry; visible as brighter/darker patches in dust shell. |
| Dust | Infrared Excess | uInfraredExcess | OFF | Dust re-radiates stellar photons in infrared. Rendered as additive red glow (#AA5533, alpha 0.1) from dust shell, stronger on limb. Simulates dust temperature ~1500 K blackbody emission. Speculative; requires IR mode toggle. |

#### Circumstellar Shell (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Shell | Planetary Nebula Precursor Shell | uNebulaShellPrecursor | ON | Some AGB stars (pre-PN) exhibit detectable expanding shell. Rendered as thin, fast-expanding spherical shell (1.08–1.35 radius, velocity ~20 km/s). Color: nebula blue (#4A90E2, additive). Lifetime: 1000s simulated years. Speculative but observed in some systems. |
| Shell | Asymmetric Outflow Lobes | uAsymmetricOutflowLobes | OFF | Binary interaction or rapid rotation can create bipolar/asymmetric mass-loss geometry. Rendered as two opposed lobes (cone geometry, ±60° from rotation axis) with higher dust density. Highly speculative; only ON for specific binary configurations. |
| Shell | Shell Boundary Shock | uShellBoundaryShock | OFF | Shock front where fast old wind collides with slower new wind. Rendered as bright rim at shell edge (color #FFAA55, additive, thin). Speculative kinetic feature. |

#### Composition (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Chemistry | Carbon vs. Oxygen Ratio | uCarbonOxygenRatio | ON | C/O > 1 (carbon star) or C/O < 1 (oxygen-rich M giant). Affects color: C-rich → slightly greener/yellower (#FF8A1A), O-rich → redder (#FF4A1A). Implemented as color tint adjustment. Default: O-rich. Spectroscopically diagnostic. |
| Molecules | Molecule Absorption Bands | uMoleculeAbsorptionBands | OFF | Strong absorption from TiO, VO, CN (carbon stars). Rendered as dark absorption bands (normal map texture) at specific wavelengths. Color regions dark #4A3A2A. Speculative spectral visualization. |
| Isotopes | s-Process Abundance Indicators | uSProcessAbundanceIndicators | OFF | Enhanced heavy elements (strontium, barium) from s-process nucleosynthesis. Rendered as subtle color variations in photosphere/wind (slightly brightened regions). Very advanced speculative feature. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Light Direction | uLightDir | SELF | Star is primary light source. Radial view-angle dependency (Fresnel). |
| Camera | Time Speed Multiplier | uTimeSpeed | 2592000x | 1 real second = 30 simulated days. Shows pulsation period (100 days ~ 3.3 sec), rotation (1–2 years ~ 15–30 sec), and slow envelope expansion. |
| Camera | Auto-Rotate | uAutoRotate | ON | Slow orbital view (0.02 rad/s) reveals asymmetries in convection, dust shell structure, and outflow. |

---

### Blue Supergiant

**Entity ID:** ENT-1015
**Description:** Massive, luminous, short-lived star with surface temperature 20,000–40,000 K. Extreme mass loss (~10^-5–10^-6 M⊙/yr) creating dense circumstellar wind. Forerunner to supernova. Real exemplars: Rigel, Deneb, Albireo B.

**Section Count:** 8 (Photosphere, Stellar Wind, Bow Shock, UV Ionization, Surface Activity, Magnetic Field, Pre-Supernova, Camera)
**Total Feature Count:** 24

#### Photosphere (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Photosphere | Ultrahot Blue-White Disk | uUltrahotDisk | ON | Surface color reflects extreme temperature (25,000 K reference, color #A8C8FF to #CCE0FF for 40,000 K). Blackbody peak in far-UV. Implemented as color gradient with intensity boost; requires bloom/tone mapping. Limb color remains blue (#6B8CDD) due to atmospheric opacity. Defines supergiant appearance. |
| Photosphere | Extreme Limb Darkening | uExtremeLimbDarkening | ON | Pronounced limb darkening (2–3× darker than center) due to high gravity/temperature gradient. Implemented as pow(dot(N, V), 0.3) Fresnel falloff ramped #CCE0FF → #5B7CCD. Creates crisp edge definition. |
| Photosphere | Non-Uniform Rotation | uNonUniformRotation | ON | Surface rotation is rapid (equator 10–100× faster than solar) but often non-uniform. Rendered as latitude-dependent brightness variation (equatorial zone 10% brighter). Animated rotation with variable angular velocity. Creates visual interest. |
| Photosphere | Hot Spot Clusters | uHotSpotClusters | ON | Magnetic activity creates localized hot regions (T + 1000 K). Rendered as Voronoi-seeded bright patches (#E0F0FF, +5% intensity) at freq 8.0. Lifetime: weeks to months. Correlates with magnetic field strength. |

#### Stellar Wind (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Wind | Dense Line-Driven Outflow | uDenseLineOutflow | ON | Extreme mass loss driven by UV line radiation pressure. Wind velocity: 1000–3000 km/s. Rendered as visible expanding shell of gas (#B8D8FF, alpha 0.12) extending 2–5 stellar radii. Density decreases as r^-2. Animated outflow (0.002 radius/frame). Critical feature. |
| Wind | Wind Acceleration Zone | uWindAccelerationZone | ON | Rapid acceleration from ~50 km/s at surface to terminal velocity over ~2 radii. Rendered as gradient brightness (brighter closer to surface). Color blend #E8F8FF (inner) → #7BA8DD (outer). Shows kinetic energy release. |
| Wind | Clumpy Wind Structure | uClumpyWindStructure | ON | Wind instabilities create density clumps. Voronoi texture (freq 5.0) modulates wind opacity ±30%. Creates patchy appearance. Speculative but physically motivated. |
| Wind | Wind-ISM Interaction | uWindISMInteraction | ON | If supergiant moves through ISM, termination shock forms. Rendered as asymmetric bow-shock structure (cone, color #FF6B4A additive) compressed on front. Creates distinctive teardrop shape. Visible only if motion is enabled. |

#### Bow Shock & Termination (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Shock | Bow Shock Cone | uBowShockCone | OFF | Conical shock front where supersonic wind hits ISM; ~10× stellar radius scale. Rendered as bright rim (#FF8B6B, additive) with expanding outflow behind. Color gradient orange (#FF6B4A) to yellow (#FFD700). Animated outer envelope expansion (0.0005 radius/frame). |
| Shock | Shock Front Brightness | uShockFrontBrightness | ON | Thermal emission from shock-heated gas. Bright zone ~0.3 radii behind bow shock. Rendered as intense white (#FFFFFF, additive, peak 1.5× normal intensity). Temperature ~10,000+ K. |
| Shock | Bow Shock Stand-Off Distance | uBowShockStandOff | OFF | Standoff distance proportional to ram pressure: Δ ∝ (Ṁ*v_∞)/(ρ_ISM*v_star^2). Animated movement as function of motion velocity (slider control). Typically 0.5–2 AU for fast-moving supergiants. |

#### UV Ionization Field (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Ionization | H-Alpha Nebulosity | uHAlphaNebulosity | ON | Intense Lyman continuum from supergiant ionizes surrounding H; bright emission nebula. Rendered as red-pink nebulosity (#FF5A5A, additive) surrounding star — H-alpha (656.3 nm) emission from ionized hydrogen, with intensity inversely proportional to distance (∝ r^-2). Extends 1–10 parsecs (scaled). Critical visual feature. |
| Ionization | He II Ionization Halo | uHeIIIonizationHalo | OFF | Extreme UV ionizes helium; creates fainter outer ionization region. Rendered as blue halo (#5B88DD, additive, 0.06 alpha) extending 1.5× H-alpha region. Speculative but physically grounded. |
| Ionization | Strömgren Sphere Boundary | uStromgrenSphereBoundary | OFF | Sharp boundary of ionized region (Strömgren sphere). Rendered as thin bright rim where ionized meets neutral. Very speculative geometric feature. |

#### Surface Activity (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Activity | Magnetic Field Loops | uMagneticFieldLoops | ON | Stellar magnetic field creates visible loop structures above surface. Rendered as curved lines (Bezier) connecting opposite polarity regions; ~20 loops. Color: blue (#4169E1) to red (#DC143C). Field strength: 1000–10,000 Gauss (estimated). |
| Activity | Pulsations | uStellarPulsations | OFF | Many blue supergiants are variable; short-period oscillations (1–24 hours). Rendered as brightness variation: brightness *= (1 + 0.02 * sin(2π*t/T)). Amplitude ~2%. Speculative; depends on evolutionary state. |
| Activity | Rapid Rotation Effects | uRapidRotationEffects | ON | Rapid rotation creates equatorial bulge and temperature variation. Rendered as: 1) equatorial flattening (ellipsoid deformation, b/a ~ 0.85), 2) temperature map (equator +10%, poles -5%). Creates oblate appearance. |

#### Magnetic Field (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Magnetic | Magnetic Field Visualization | uMagneticField | OFF | Large-scale dipole field with surface strength 0.5–5 kG. Rendered as field lines (blue/red) extending outward; distorted by rapid rotation (compressed at equator). Speculative visualization. |
| Magnetic | Magnetosphere Wind Interaction | uMagnetosphereWindInteraction | OFF | Magnetic field confines wind, creating X-ray-emitting shock region at field boundary. Rendered as faint X-ray glow zone (#FF88AA, additive). Speculative kinetic feature. |

#### Pre-Supernova Signatures (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| SN | Surface Instability Indicators | uSurfaceInstabilities | OFF | Some pre-SN supergiants show surface instabilities (potential precursors). Rendered as transient brightness dips/flares on surface (flickering at ~0.5 Hz). Speculative; ON for specific scenarios. |
| SN | Enhanced Emission Lines | uEnhancedEmissionLines | OFF | Broadened emission lines in spectrum from rapid wind. Rendered as subtle texture modulation in photosphere (normal map oscillation). Speculative spectroscopic feature. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Light Direction | uLightDir | SELF | Star is light source. |
| Camera | Time Speed Multiplier | uTimeSpeed | 315360000x | 1 real second = 10 years. Shows long-term wind structure evolution, pulsation periods (hours ~ millisec), and rotational dynamics. |
| Camera | Auto-Rotate | uAutoRotate | ON | Reveals rotation, wind asymmetry, magnetic field structure, and bow shock orientation. Orbit speed: 0.02 rad/s. |

---

### Neutron Star / Pulsar

**Entity ID:** ENT-1020
**Description:** Compact stellar remnant, ~20 km radius, 1.4 M⊙, extreme density (~10^8 times nuclear). Ultra-strong magnetic field (10^8–10^15 Tesla). Pulsars emit beamed radiation with periods 1 ms–30 sec. Real exemplars: Crab Pulsar, Vela Pulsar, PSR J0437–4715.

**Section Count:** 8 (Magnetic Field, Emission Beams, Surface, Accretion (if binary), Relativistic Effects, Pulsar Wind Nebula, Spin Dynamics, Camera)
**Total Feature Count:** 25

#### Magnetic Field (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Magnetic | Ultra-Strong Magnetic Field | uUltraStrongField | ON | Extreme dipole field (10^8–10^14 Gauss surface strength). Rendered as distorted field lines emanating from magnetic poles; field geometry compressed at equator due to rotation. Color: blue (#4169E1) to red (#DC143C) polarity. Intensity visualization: line thickness ∝ field strength. |
| Magnetic | Field Line Dragging | uFieldLineDragging | ON | Rapid rotation drags field lines into spiral pattern. Rendered as twisted field geometry; lines rotate with star at observed rotation period. Creates winding spiral extending several km. Visual indicator of rotation rate. |
| Magnetic | Magnetosphere Shock | uMagnetosphereShock | ON | Magnetospheric shock forming at boundary where magnetic pressure balances ram pressure of accretion/wind. Rendered as spherical shell (~1500 km radius, light cylinder distance) with bright rim (#FF8B6B, additive). Only visible if accretion active. |
| Magnetic | Magnetic Reconnection Sites | uMagneticReconnectionSites | OFF | Localized regions where field lines reconnect, releasing energy as X-rays. Rendered as bright flashes (#FFFF99, additive) at random locations on field, lasting 0.1–1 second. Speculative kinetic feature. |

#### Emission Beams (5 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Emission | Twin Emission Beams | uTwinEmissionBeams | ON | Twin narrow beams of synchrotron radiation perpendicular to magnetic axis, emitted from magnetic pole caps. Rendered as two cone-shaped beams (#C0D8FF to #FFFFFF color — matching optical Crab pulsar appearance, additive, rotating with star). Beam opening angle: 10–30°. Pulsed as beams sweep past observer (periodic brightening). |
| Emission | Beam Lightness Curve | uBeamLightnessCurve | ON | Brightness modulation as beam sweeps past observer's line of sight. Implemented as time-varying intensity multiplier based on angle between beam and observer. Pulse period matches rotation period (tunable: 0.033 s for Crab to 0.089 s for Vela). |
| Emission | Pulse Jitter | uPulseJitter | ON | Small timing variations (~microsec) in pulse arrival. Rendered as brief brightness flickers (+5% intensity, duration ~1 ms) superimposed on main pulse profile. Creates realistic pulse structure. |
| Emission | Polarized Emission | uPolarizedEmission | OFF | Synchrotron radiation is linearly polarized. Rendered as subtle polarization vector field overlay on beams (optional visualization). Speculative educational feature. |
| Emission | High-Frequency Oscillations | uHighFreqOscillations | OFF | Coherent oscillations in burst emission (kHz QPOs) from accretion. Rendered as fine-scale time-domain intensity modulation (~MHz frequency, visible as ripple texture). Only ON if accretion active. |

#### Surface (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Surface | Compact Crust | uCompactCrust | ON | Incredibly dense surface (neutron matter or quark matter) rendered as smooth, featureless sphere. Color: #E0F0FF (hot blue-white at ~10⁶ K surface). Radius: 20 km (scaled). Emission region: magnetic pole caps rendered as brighter regions (#8B7B6E, +15% intensity). |
| Surface | Polar Cap Hotspots | uPolarCapHotspots | ON | Magnetic pole regions heated by infalling particles/magnetic reconnection. Rendered as two bright spots (#FF8B7B for north, #FF8B7B for south) at magnetic poles. Temperature ~10^6 K (radiation from surface). Size: ~1 km, ~5% of pole area. |
| Surface | Glitch Marks (Starquakes) | uGlitchMarks | OFF | Sudden spin-up events from crust fractures (starquakes); periodic visible cracks. Rendered as dark lines radiating from pole. Very speculative; occurs episodically on ~year timescales. |

#### Accretion (if Binary) (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Accretion | Accretion Hotspots | uAccretionHotspots | OFF | If in binary: impact zones where accretion stream hits surface. Rendered as bright regions (#FFFF99, +40% intensity) at two locations (both sides of equator; stream rotation). Visible only if accretion active (binary slider ON). |
| Accretion | X-Ray Flare Emission | uXRayFlareEmission | OFF | Sudden X-ray bursts from thermonuclear runaways on accreting surface. Rendered as intense white flashes (#FFFFFF, additive, 3× normal) lasting 1–10 seconds, sporadic frequency. Only active if accretion ON. |
| Accretion | Accretion Column | uAccretionColumn | OFF | Magnetosphere funnels infalling matter into columns at poles. Rendered as glowing cylinder geometry (color #FF8B6B, additive) extending from surface toward magnetosphere boundary. Only visible if accretion active. |

#### Relativistic Effects (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Relativity | Gravitational Lensing | uGravitationalLensing | OFF | Light from background starfield bends around neutron star gravity. Post-process shader distorts starfield near limb using Schwarzschild lens model. Distortion angle: ~few degrees (vs. ~arc-sec for black hole). Subtle but visible. Educational. |
| Relativity | Frame Dragging (Kerr Effect) | uFrameDragging | OFF | Rotating neutron star (millisecond pulsars) exhibit frame-dragging. Rendered as differential field line rotation; outer field drags with rotation axis (precession visible). Very speculative; requires Kerr solution approximation. |
| Relativity | Relativistic Beaming | uRelativisticBeaming | OFF | Doppler beaming concentrates emission in direction of motion (for fast pulsars). Rendered as asymmetric brightness in beam cones; approaching side 2–3× brighter. Only relevant if proper motion is enabled. |

#### Pulsar Wind Nebula (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| PWN | Pulsar Wind Nebula Bubble | uPulsarWindNebula | ON | Relativistic wind from pulsar inflates bubble of shocked particles/radiation. Rendered as expanding teal/blue nebulosity (#4A90E2, additive, alpha 0.12) surrounding pulsar. Radius: 0.5–2 pc (scaled). Filamentary structure (Simplex noise, freq 12.0). |
| PWN | PWN Spin-Down Luminosity | uPWNSpinDownLumi | ON | Energy flux from pulsar powers nebula; brightness correlates with spin-down rate. Implemented as intensity modifier inversely related to period: luminosity ∝ (Ω/2π / P)^2. Faster pulsars → brighter nebulae. |

#### Spin Dynamics (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Spin | Rotation Rate Control | uRotationRate | ON | Tunable rotation period (0.033 s Crab, 0.089 s Vela, down to 1.4 ms for fastest millisecond pulsars; slow pulsars reach 8+ s). Rendered as animated rotation; angular velocity = 2π / P. Pulse timing modulation follows rotation. User slider: 0–10 (period multiplier). |
| Spin | Spin-Down Effects | uSpinDownEffects | OFF | Gradual period increase due to magnetic braking. Rendered as slowly increasing rotation period over simulated years. Very long timescale (~10^6 years for Crab). Speculative feature; requires long time-scale simulation. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Light Direction | uLightDir | SELF | Pulsar is light source. Beams provide primary illumination. |
| Camera | Time Speed Multiplier | uTimeSpeed | 1000000x | 1 real second = ~1000 pulsar periods (for Crab). Shows pulse period, magnetospheric dynamics, and beam sweep across observer cone. |
| Camera | Auto-Rotate | uAutoRotate | ON | Orbital camera (0.02 rad/s) reveals magnetic field structure, beam geometry, and pulsar wind nebula. |

---

### White Dwarf

**Entity ID:** ENT-1025
**Description:** Dense stellar remnant; cooling relict of post-AGB evolution. Radius ~Earth size, mass ~0.6 M⊙. Surface temperature 5000–100,000 K (hydrogen DA or helium DB atmospheres). Often in binary systems. Real exemplars: Sirius B, Procyon B, 40 Eri B.

**Section Count:** 8 (Photosphere, Cooling Evolution, Atmospheric Composition, Magnetic Field, Crystallization, Binary Accretion, Circumstellar Debris, Camera)
**Total Feature Count:** 23

#### Photosphere (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Photosphere | Temperature-Dependent Color | uTemperatureDependentColor | ON | Surface color reflects cooling evolution: young (100,000 K) → #E0F0FF (blue-white), old (5,000 K) → #FFCC88 (yellow-white). Implemented as color gradient lookup driven by temperature slider. Default: 8,000 K (#C8D8FF). Fundamental visual state. |
| Photosphere | Photospheric Lines | uPhotosphericLines | ON | Hydrogen Balmer series (DA white dwarfs) or helium lines (DB white dwarfs). Rendered as dark absorption bands (normal map texture) at wavelengths corresponding to H-alpha (656 nm), H-beta (486 nm), etc. Creates spectral texture. |
| Photosphere | Limb Darkening | uLimbDarkening | ON | Pronounced limb darkening due to temperature/pressure gradient. Implemented as pow(dot(N, V), 0.4) falloff ramped from photosphere color to #3A5A6A (darker edge). Creates crisp rim definition. |
| Photosphere | Micro-Variable Flickering | uMicroVariableFlickering | OFF | Some white dwarfs show subtle brightness variations (<1%) from acoustic modes. Rendered as sinusoidal brightness modulation (~1 mHz, amplitude ±0.5%). Very subtle. Speculative. |

#### Cooling Evolution (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Cooling | Cooling Timescale Indicator | uCoolingTimescale | ON | Visual representation of cooling age through color/brightness. Younger → brighter, hotter color; older → dimmer, cooler color. Brightness *= 1.0 - age_fraction * 0.3. Color shift toward red with age. Implemented as slider (0–10 Gyr). |
| Cooling | Cooling Curve Visualization | uCoolingCurveViz | OFF | Optional overlay showing theoretical cooling curve (luminosity vs. age). Rendered as curve plot in corner (canvas overlay). Educational; shows current position on Hertzsprung-Russell diagram. Speculative. |
| Cooling | Thermal Stratification | uThermalStratification | ON | Interior becomes increasingly ordered as WD cools; outer layers cool first. Rendered as concentric color bands (outer → cooler/redder, inner → hotter/bluer). FBM-based boundary softening. Creates depth perception. |

#### Atmospheric Composition (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Atmosphere | Hydrogen Atmosphere (DA) | uHydrogenAtmosphere | ON | Pure hydrogen atmosphere (most common, ~80% of WDs). Color: #C8D8FF (blue-white), absorption bands from H Balmer series. Rendered as primary photosphere color. |
| Atmosphere | Helium Atmosphere (DB) | uHeliumAtmosphere | OFF | Pure helium (second most common, ~10% of WDs). Color: #D8D0FF (slightly different shade), weaker absorption features. Toggle to switch composition (changes color + bands). |
| Atmosphere | Metal Lines (DAZ/DBZ) | uMetalLines | OFF | Some WDs show metal absorption (Ca, Mg, Fe) from accretion. Rendered as additional dark absorption bands (normal map overlay). Indicates recent/ongoing accretion. Speculative composition. |

#### Magnetic Field (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Magnetic | Residual Magnetic Field | uResidualMagneticField | OFF | ~20% of WDs retain strong fields (kGauss to MGauss, inherited from progenitor). Rendered as field line structure (100+ lines) emanating from poles. Color: blue (#4169E1) to red (#DC143C). Field distorts any companion material. |
| Magnetic | Zeeman Splitting | uZeemanSplitting | OFF | Strong magnetic field splits spectral lines. Rendered as broadened/split absorption bands in photosphere (texture modulation). Observable as line widening in spectrum. Speculative spectroscopic feature. |
| Magnetic | Cyclotron Radiation (if accreting) | uCyclotronRadiation | OFF | Accreting WDs with B > 10^7 G emit cyclotron radiation from electrons spiraling in field. Rendered as additive colored layers (bright #FF7A7A, polarized appearance) in accretion zones. Only active if accretion ON. |

#### Crystallization (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Interior | Crystallization Front | uCrystallizationFront | ON | As WD cools, interior freezes into lattice (carbon-oxygen, iron-nickel core). Rendered as concentric spherical boundary advancing from core outward. Interior (crystallized) color: #6B5A5A (dark), exterior (liquid): #C8D8FF (light). Animated slow advance (0.0001 radius/frame at default timescale). |
| Interior | Latent Heat Release | uLatentHeatRelease | ON | Crystallization releases latent heat, slowing cooling. Implemented as reduced cooling rate multiplier (×0.7) when crystallization active. Creates brightness plateau in cooling evolution. |

#### Binary Accretion (if applicable) (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Accretion | Accretion Stream | uAccretionStream | OFF | Material flowing from companion star along Roche lobe. Rendered as curved stream of white gas (#FFFFFF, additive) from companion toward WD. Only visible if binary active. Animated flow (0.003 radius/frame). |
| Accretion | Accretion Disk | uAccretionDisk | OFF | Hot disk forming around WD; temperature 10^4–10^7 K. Rendered as glowing disk (orange #FF8B4A to white #FFFFFF gradient, additive) with thickness ~0.1 WD radius. Only active if accretion ON. |
| Accretion | Accretion Heating | uAccretionHeating | OFF | Accretion heats surface; WD becomes brighter/hotter. Brightness *= 1.0 + accretion_rate * 0.5. Color shift bluer (higher T from impact). Only active if accretion ON. |

#### Circumstellar Debris (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Debris | Dust/Asteroid Debris | uDebrisDisk | OFF | Some WDs show circumstellar dust from disrupted asteroids/planets. Rendered as thin disk or debris cloud (color #8B7355, alpha 0.08) orbiting WD. Radius: 0.5–5 WD radii. Dust temperature ~1000 K. Speculative but common in observations. |
| Debris | Debris Accretion Signature | uDebrisAccretionSignature | OFF | Metal absorption in atmosphere indicates recent debris accretion. Rendered as metal absorption bands + slight color brightening. Links dust disk to atmospheric composition. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Light Direction | uLightDir | SELF | WD is light source (if isolated) or companion light (if binary). |
| Camera | Time Speed Multiplier | uTimeSpeed | 31536000000x | 1 real second = 1000 years. Shows cooling evolution (1 Gyr ~ 1000 sec), crystallization advance, and accretion dynamics. |
| Camera | Auto-Rotate | uAutoRotate | OFF | Minimal visual interest in rotation; stationary view typical. Stationary viewing shows companion and accretion stream if binary. |

---

### Wolf-Rayet

**Entity ID:** ENT-1016
**Description:** Extreme massive stars (>20 M⊙) with stripped hydrogen envelopes, exposed helium/carbon cores. Violent stellar winds >1000 km/s, mass loss ~10^-5 M⊙/yr. Short lifetime (few million years). Real exemplars: WR 124, WR 104, WR 136.

**Section Count:** 8 (Core & Photosphere, Extreme Wind, Wind Bubble, Shock & Chemistry, Magnetic Activity, Binary (if applicable), Pre-Supernova, Camera)
**Total Feature Count:** 25

#### Core & Photosphere (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Core | Exposed Helium Core | uExposedHeliumCore | ON | Wolf-Rayet star is exposed helium or carbon-oxygen core. Surface temperature 30,000–200,000 K (color #A8C8FF to #E0F0FF depending on type). Rendered as bright blue-white disk. Small radius (~10 solar). Featureless surface; all visual interest in wind. |
| Core | Core Surface Roughness | uCoreSurfaceRoughness | OFF | Rapid rotation/magnetic field may create surface texture. Rendered as subtle normal map detail (FBM, freq 25.0, amplitude 0.02). Speculative. |
| Core | Continuum Brightness Variability | uContinuumVariability | OFF | Some WR stars show continuum emission variations from wind clumping. Rendered as 1–2% brightness modulation (period 0.1–1 day simulated). Speculative variability. |

#### Extreme Wind (5 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Wind | Ultra-Fast Outflow | uUltraFastOutflow | ON | Wind velocity >1000 km/s (some >3000 km/s). Rendered as expanding shell of bright blue-white gas (#7BA8FF, additive) extending 5–10 stellar radii. Density decreases as r^-2. Animated outflow (0.003 radius/frame). Dramatic, energetic feature. |
| Wind | Wind Mass-Loss Rate Indicator | uWindMassLossRate | ON | Opacity of wind correlates with mass-loss rate (10^-5 to 10^-6 M⊙/yr). Rendered as overall opacity/brightness of wind; higher Ṁ → more opaque/visible. User slider adjusts perceived Ṁ. |
| Wind | Terminal Velocity Achievement | uTerminalVelocityAchievement | ON | Wind accelerates from ~50 km/s at surface to terminal velocity over ~2–3 stellar radii. Rendered as gradient color (brighter near star where still accelerating, duller where terminal velocity reached). Creates visual depth. |
| Wind | Clumpy Wind Substructure | uClumpyWindSubstructure | ON | Wind instabilities (line-driven) create density clumps. Voronoi-based structure (freq 6.0) modulates wind opacity ±50%. Creates visible streaks/clumps in expanding shell. |
| Wind | Rotating Wind Spiral Pattern | uRotatingWindSpiral | OFF | Some WR winds show spiral pattern from rotating core + outflow. Rendered as spiral density modulation (Archimedean spiral in cylindrical coords). Color: modulation ±20% intensity. Speculative kinematic feature. |

#### Wind Bubble (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Bubble | Wind-Blown Bubble | uWindBlownBubble | ON | Hot fast wind expands, sweeping up ISM into thin shell. Rendered as hollow expanding sphere of swept-up ISM (color #6B6B8B, low opacity 0.05) surrounding WR wind. Outer radius ~10 pc (scaled). Faint but visible edge. |
| Bubble | Bubble Expansion Rate | uBubbleExpansionRate | ON | Bubble expands at ~10 km/s (slower than WR wind). Animated outer shell expansion (0.0003 radius/frame). Shows long-term dynamical evolution. |
| Bubble | WR Wind / ISM Interface | uWindISMInterface | ON | Bright thin shell where fast WR wind collides with swept-up ISM. Rendered as bright blue rim (#4A8BFF, additive, thin) at bubble edge. Temperature ~10,000 K from shock heating. |

#### Shock & Chemistry (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Chemistry | Emission Line Zones | uEmissionLineZones | ON | Wind consists of ionized gas emitting strong recombination lines. Rendered as entire wind with additive color tint (#7BA8FF for WN, #5BA8FF for WC). Color indicates nitrogen (WN) vs. carbon (WC) dominance. Essential visual marker. |
| Chemistry | Nitrogen Emission (WN-type) | uNitrogenEmission | ON | WN stars: strong N II lines at 500.3 nm (blue) and broader N III lines. Wind color: slightly greenish-blue #6BA8FF. Rendered as primary wind color for WN. |
| Chemistry | Carbon Emission (WC-type) | uCarbonEmission | OFF | WC stars: strong C II/III/IV lines; cooler color appearance. Wind color: white-blue #A8C8FF. Toggle to switch from WN to WC type. |
| Chemistry | Metal-Rich Wind Zones (WO) | uMetalRichWind | OFF | WO stars (rarest): strong oxygen lines. Wind color: pure blue #4A90E2. Very speculative; only for WO-type systems. |

#### Magnetic Activity (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Magnetic | Magnetic Field Threading | uMagneticFieldThreading | OFF | Some WR stars have detectable B fields (100s of Gauss to kGauss). Rendered as field lines threading through wind. Color: blue/red polarity. Field distorts wind geometry. Speculative. |
| Magnetic | Magnetic Reconnection Flares | uMagneticReconnectionFlares | OFF | Episodic magnetic reconnection releases energy as flares. Rendered as brief bright flashes (#FFFF99, additive) in wind, random locations, ~0.1 sec duration. Speculative activity. |

#### Binary (if applicable) (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Binary | Binary Wind Collision Zone | uBinaryWindCollision | OFF | If in binary: two WR winds collide, creating shock cone. Rendered as bright collision front (#FF6B4A, additive) between stars. Only visible if binary active. Creates dramatic interaction. |
| Binary | Orbital Motion | uOrbitalMotion | OFF | Binary WR stars orbit common center. Rendered as animated relative motion (orbital period slider). Shows binary separation and orbital dynamics. |
| Binary | X-Ray Hot Collision Region | uXRayHotCollision | OFF | Wind-wind collision heats gas to ~10^7 K; bright X-ray source. Rendered as bright blue-white zone (#4A90E2, additive, intense) at collision front. Only active if binary + collision ON. |

#### Pre-Supernova Signatures (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| SN | Eruptive Behavior Indicators | uEruptiveIndicators | OFF | Some WR stars show eruptive episodes (common envelope phases). Rendered as transient brightness pulses (×1.5 intensity, duration 1–10 days) and wind opacity spikes. Speculative variability. |
| SN | Final Stages: Supernova Precursor Glow | uSupernovaPrecursor | OFF | Late-stage WR shows enhanced wind heating and instability. Rendered as overall brightness increase (×1.2) and fine-scale flickering (1–5 Hz, amplitude ±10%). Speculative imminent-SN marker. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Light Direction | uLightDir | SELF | WR star is primary light source. |
| Camera | Time Speed Multiplier | uTimeSpeed | 3153600000x | 1 real second = 100 years. Shows wind evolution, bubble expansion, and binary orbital dynamics. |
| Camera | Auto-Rotate | uAutoRotate | ON | Orbital view (0.02 rad/s) reveals wind asymmetry, magnetic field structure, bubble geometry, and binary interaction (if present). |

---

### Black Hole (Stellar)

**Entity ID:** ENT-1030
**Description:** Stellar-mass black hole (5–100 M⊙) with accretion disk, relativistic jets, and extreme spacetime curvature. Event horizon at Schwarzschild radius (30–300 km). Real exemplars: Cygnus X-1, GRS 1915+105, V404 Cygni.

**Section Count:** 8 (Event Horizon & Photon Sphere, Accretion Disk, Disk Heating, Jets, Relativistic Effects, Tidal Disruption, Hawking Radiation, Camera)
**Total Feature Count:** 25

#### Event Horizon & Photon Sphere (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Gravity | Event Horizon | uEventHorizon | ON | Schwarzschild radius (r_s = 2GM/c²); mathematically black but not observational. Rendered as black circle (#000000) at precise calculated radius. For 10 M⊙: r_s ~ 30 km. Fundamental feature; critical for scale reference. |
| Gravity | Photon Ring | uPhotonRing | ON | Unstable orbit of light at r ~ 1.5 × r_s. Renders as faint bright halo (#7BA8FF, additive, 0.15 alpha) around event horizon. Background starfield lensed through photon ring. Critical relativistic feature. |
| Gravity | Event Horizon Precession | uEventHorizonPrecession | OFF | Rotating (Kerr) black hole: event horizon precesses. Rendered as slow rotation of ergosphere (if visible). Speculative Kerr metric visualization. |

#### Accretion Disk (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Disk | Accretion Disk Geometry | uAccretionDiskGeometry | ON | Hot, spinning disk of infalling material; radiates across EM spectrum. Thickness ~10% radius. Rendered as disk geometry with gradient color (inner → blue-white #4A90E2, outer → red-orange #FF6B1A). Opacity increases inward. |
| Disk | Disk Temperature Gradient | uDiskTemperatureGradient | ON | Inner disk hotter (blue/white, ~10^6 K) due to viscous heating; outer cooler (red/orange, ~10^4 K). Implemented as radial color gradient with exponential falloff. Color: blend from #FFFFFF (inner) to #FF4A1A (outer). Essential realism. |
| Disk | Disk Turbulence | uDiskTurbulence | ON | Animated swirls and vortices in disk from magnetohydrodynamic instability. Rendered as FBM-based texture modulation (freq 8.0, amplitude 0.2) on disk surface. Slow rotation (0.01 rad/s). Creates visual complexity. |
| Disk | Disk Shadowing | uDiskShadowing | ON | Disk casts shadow on accretion structure; bright side illuminated by disk self-emission. Rendered as shading map: light side (facing observer) bright, far side dimmer. Creates 3D depth perception. |

#### Disk Heating & Emission (3 features)

| Section | Feature | Uniform | DEFAULT | Description |
|---------|---------|---------|---------|-------------|
| Heating | Viscous Heating Zones | uViscousHeatingZones | ON | Innermost disk (ISCO, ~3–10 r_s) reaches peak temperature from viscous dissipation. Rendered as bright white-blue core (#FFFFFF, peak intensity ×2) with Gaussian falloff. Only visible within accretion disk radius. |
| Heating | Radiation Pressure Puffing | uRadiationPressurePuffing | OFF | Inner disk puffs up due to radiation pressure; creates X-shaped geometry. Rendered as disk flare/puffing deformation (vertical expansion ~10% in inner regions). Speculative detail. |
| Heating | Thermal Reverberation | uThermalReverberation | OFF | Disk responds to accretion rate variations; lags in response. Rendered as color/brightness waves propagating outward from inner disk (period ~hour to days simulated). Speculative kinetic feature. |

#### Jets (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Jets | Relativistic Jets | uRelativisticJets | ON | Collimated outflows along rotation axis at v ~ 0.9c. Rendered as two cone-shaped jets (30° half-angle) extending 10+ disk radii. Color: bright blue-white (#4A8BFF to #FFFFFF gradient, additive). Intense and energetic. |
| Jets | Jet Hotspots | uJetHotspots | ON | Shock acceleration zones within jets; bright knots. Rendered as 3–5 bright spots (#FFFF99, additive) spaced along jet length. Animated slow drift (0.001 radius/frame). Creates structure. |
| Jets | Jet Collimation Magnetic Field | uJetCollimationField | OFF | Magnetic field provides jet collimation. Rendered as field line visualization threading through jets (blue/red lines). Distorted by relativistic rotation. Speculative detail. |
| Jets | Relativistic Beaming | uRelativisticBeaming | ON | Doppler beaming; approaching jet brighter 3–5× than receding jet. Implemented as asymmetric intensity: approaching_intensity *= 1.5, receding_intensity *= 0.5. Creates directional visual asymmetry. |

#### Relativistic Effects (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Relativity | Gravitational Lensing | uGravitationalLensing | ON | Light from background starfield bends near black hole (Schwarzschild lens model). Distortion angle: ~10–30° near event horizon (vs. few arcmin for neutron star). Post-process shader distorts background. Critical relativistic feature. |
| Relativity | Frame Dragging (Kerr) | uFrameDragging | OFF | Rotating BH (Kerr metric) drags spacetime; field lines precess. Rendered as rotating field line structure; disk/jet axis precession visible. Advanced relativistic feature. |
| Relativity | Gravitational Redshift | uGravitationalRedshift | OFF | Photons lose energy climbing out of gravitational well. Rendered as color shift: inner disk redder (#FF4A1A) than outer (#FFB81A) due to redshift (in addition to temperature gradient). Speculative relativistic effect. |
| Relativity | Accretion Disk Precession | uAccretionDiskPrecession | ON | Tilted disk precesses around BH rotation axis (Lense-Thirring precession). Rendered as disk normal vector slowly rotating (~1 precession per 1000 orbital periods). Speculative Kerr effect. |

#### Tidal Disruption (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Disruption | Tidal Disruption Streams | uTidalDisruptionStreams | OFF | Infalling star/object stretched by tidal forces, creates glowing debris stream into disk. Rendered as curved stream of bright white (#FFFFFF, additive) spiraling into disk. Only active if disruption event active. |
| Disruption | Tidal Debris Heating Flare | uTidalFlare | OFF | Tidal disruption event creates bright transient flare (1000× normal luminosity) as debris accretes. Rendered as extreme brightness spike (#FFFF99, additive, intense glow) lasting hours to days simulated. Dramatic transient event. |

#### Hawking Radiation (Speculative) (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Exotic | Hawking Radiation Glow | uHawkingRadiation | OFF | Theoretical quantum evaporation at event horizon. For stellar BH: extremely weak (~10^-28 watts, unobservable). Rendered as faint blue glow (#4A8BFF, additive, 0.02 alpha) around horizon. Purely speculative; unobservable in practice. Educational. |
| Exotic | Quantum Pair Production | uQuantumPairProduction | OFF | Virtual particle pairs created near horizon. One escapes (Hawking radiation), one falls in. Rendered as brief bright flashes (#FFFF99, alpha 0.1) at horizon edge; random sporadic events. Extremely speculative. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Light Direction | uLightDir | DISK | Disk + jets are primary light sources; self-luminous. |
| Camera | Time Speed Multiplier | uTimeSpeed | 100000000x | 1 real second = ~30 orbital periods (for 10 M⊙). Shows disk dynamics, jet precession, and rapid variability. |
| Camera | Auto-Rotate | uAutoRotate | ON | Orbital camera (0.05 rad/s) reveals disk geometry, jets, gravitational lensing, and accretion structure from all angles. |

---

### Red Dwarf (M-Dwarf Star)

**Entity ID:** ENT-1040
**Description:** Most common star type in the universe (~75% of all stars). Cool, dim, long-lived main-sequence star with temperature 2400–3700 K, mass 0.08–0.45 M☉, radius 0.1–0.6 R☉. Dominant color #FF6A3A deep orange-red. Fully convective (below ~0.35 M☉) with no radiative core — entire star participates in convection, driving powerful magnetic dynamo. Frequent violent flares (UV/X-ray) despite low baseline luminosity. Starspot coverage 20–40% (far greater than Sun's <1%). Habitable zones extremely close (0.01–0.2 AU). Real exemplars: Proxima Centauri (0.12 M☉, flare star), TRAPPIST-1 (0.09 M☉, 7 planets), Barnard's Star (0.16 M☉), Wolf 359 (0.09 M☉).

**Section Count:** 8
**Total Feature Count:** 27

#### Photosphere & Convection (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Photosphere | Cool Photosphere Surface | uPhotosphere | ON | Base photosphere temperature 2400–3700 K, color #FF6A3A deep orange-red (blackbody). FBM 5-octave (freq 35.0, amplitude 0.10) for granulation pattern. Granule size ~500 km (smaller than solar 1000 km due to smaller scale height). Shader: temperature-dependent blackbody color mapping + Lambertian shading. Much dimmer than Sun (0.001–0.05 L☉). |
| Photosphere | Full Convective Granulation | uGranulation | ON | Entire star is convective (below 0.35 M☉), creating vigorous surface granulation. Rendered via Voronoi cells (freq 40.0) with bright centers #FF7A4A and dark intergranular lanes #A83A1A. Cell lifetime ~5 minutes (faster turnover than solar). Shader: Voronoi-based brightness modulation. Turbulent appearance. |
| Photosphere | Molecular Absorption Bands (TiO/VO) | uMolecularBands | ON | Cool photosphere allows TiO (titanium oxide) and VO (vanadium oxide) molecules to form, creating broad absorption bands that deepen the red color. Represented as subtle banding texture: dark #8A2A10 streaks overlaid at 5% opacity, FBM (freq 15.0 zonal, amplitude 0.04). Shader: additive dark band overlay. Distinguishes M-dwarfs from hotter stars. |
| Photosphere | Limb Darkening (Strong) | uLimbDark | ON | Pronounced limb darkening due to deep convective atmosphere; cos(θ)^0.8 falloff (steeper than solar 0.6). Edge color drops to #8A3018 dark brownish-red. Shader: view-angle-dependent intensity falloff. Creates strongly rounded appearance. |

#### Starspots & Magnetic Activity (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Spots | Large Starspot Complexes | uStarspots | ON | Enormous starspots covering 20–40% of surface (vs Sun's <1%). Spot temperature ~200–500 K below photosphere, color #6A2A10 very dark brown-red. Rendered as 3–8 large irregular dark patches via Voronoi domains (freq 5.0) with FBM edge modulation (freq 25.0, amplitude 0.08). Shader: dark color blend in spot zones. Dominant visual feature. |
| Spots | Spot Evolution & Rotation | uSpotEvolution | ON | Spots persist for months–years (longer than solar spots), rotating with star (period 20–130 days typical). Animated rotation with slow morphological change. Shader: time-dependent rotation + slow FBM phase drift. Shows stellar rotation. |
| Spots | Facular Brightening Around Spots | uFaculae | ON | Bright facular regions (#FF9060 warm orange, 10% brighter than photosphere) surrounding spot boundaries. Width ~0.1 spot radius. Shader: bright ring overlay at spot edges. Compensates ~5% of spot dimming. |
| Spots | Magnetic Flux Tubes | uFluxTubes | OFF | Speculative visualization of concentrated magnetic flux tubes emerging from spot regions. Rendered as thin bright #FFD080 arching lines connecting spot pairs. Shader: parametric arch geometry. Educational overlay. |

#### Flare Activity (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Flares | Stellar Flare Eruption | uFlares | ON | M-dwarfs are prolific flare stars; flare energy 10^29–10^34 erg (some "superflares" 10,000× strongest solar flares). Rendered as sudden brilliant white #FFFFFF flash at random surface location, rise time 0.1 s, decay 1–5 s. Brightness increase 10–100× local photosphere. Frequency: ~0.01 Hz (one every ~2 minutes visualization). Shader: stochastic time-based additive flash. Dramatic feature. |
| Flares | Flare UV/Blue Enhancement | uFlareUV | ON | Flares emit strongly in UV/blue, briefly making red dwarf appear much bluer. Rendered as blue-white #C8D8FF tint radiating from flare epicenter, alpha 0.3–0.5 during flare. Shader: time-dependent color shift toward blue at flare location. Shows spectral change. |
| Flares | Coronal Mass Ejection (CME) | uCME | ON | Flares accompanied by CMEs — expanding plasma bubbles. Rendered as expanding translucent shell #FF8060 (alpha 0.15) originating from flare site, expanding at ~500 km/s (scaled). Radius grows from 0 to ~3 R* over 2 seconds. Shader: expanding sphere geometry with FBM turbulence. |
| Flares | Post-Flare Loop Arcade | uFlareLoops | ON | After flare, cooling plasma traces magnetic loop structures. Rendered as bright #FFA060 arching loops (height 0.1–0.3 R*) at flare site, fading over 2–5 seconds. FBM along loop path (freq 60.0, amplitude 0.08). Shader: parametric loop geometry with temporal decay. |

#### Chromosphere & Corona (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Chromosphere | Chromospheric Emission Layer | uChromosphere | ON | Thin chromosphere (~1000 km above photosphere), temperature ~6000–10,000 K, emitting Hα. Rendered as faint red-pink #FF5040 rim glow at limb, alpha 0.12–0.18. Shader: rim-light additive pass, Fresnel-based. Visible during flare quiescence. |
| Chromosphere | Hot Corona (X-ray Active) | uCorona | ON | Despite low luminosity, M-dwarfs have proportionally active coronae (10^-4–10^-3 L_bol in X-rays). Rendered as faint blue-white #A8C8F0 extended glow, radius ~1.5 R*, alpha 0.08. FBM (freq 20.0, amplitude 0.06). Shader: volumetric corona rendering. Shows magnetic heating. |
| Chromosphere | Prominences & Filaments | uProminences | ON | Cool dense plasma suspended in corona by magnetic fields. Rendered as dark #8A3020 filamentary structures arching above limb, height 0.2–0.5 R*. Sparse (3–6 visible). FBM along filament path (freq 50.0, amplitude 0.10). Shader: dark silhouette arches against corona. |

#### Magnetic Field (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| MagField | Dipole Magnetic Field | uMagField | OFF | Global dipole field 100–5000 Gauss (100–1000× solar). Rendered as glowing field lines blue #4A8FD8 to red #FF5050 gradient. Much stronger and more organized than solar field due to full convection dynamo. Shader: parametric dipole B-field rendering. Off by default (visual clutter). |
| MagField | Multipolar Field Components | uMultipolar | OFF | M-dwarfs often show complex multipolar (quadrupole, octupole) field geometry rather than simple dipole. Rendered as additional field line families with higher-order symmetry. Color: purple #8A5FAF. Shader: superposed multipolar field visualization. |
| MagField | Magnetic Braking Spin-Down | uSpinDown | OFF | Speculative: magnetic braking gradually slows rotation over Gyr timescales. Represented by text overlay showing estimated rotation period and age. Educational. |

#### Habitable Zone Context (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| HZ | Habitable Zone Ring | uHZRing | OFF | Very close-in habitable zone (0.01–0.2 AU). When enabled, renders as faint green #50FF50 translucent torus around star at correct distance. Helps visualize planet habitability context. Shader: thin torus geometry, alpha 0.10. Educational overlay. |
| HZ | Tidal Locking Zone Indicator | uTidalLock | OFF | Planets in HZ likely tidally locked due to proximity. When enabled, shows tidal locking boundary as dashed yellow #FFD700 circle at ~0.1 AU. Educational. |
| HZ | UV Flux Hazard Indicator | uUVFlux | OFF | Flare UV flux at HZ distance dangerous for surface life. When enabled, visualizes UV radiation cone during flares as purple #8A3FD8 expanding overlay from flare site toward HZ distance. Educational. |

#### Planetary System Context (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Planets | TRAPPIST-1 Type Compact System | uCompactSystem | OFF | Many M-dwarfs host tightly-packed multi-planet systems (e.g., TRAPPIST-1 with 7 planets within 0.06 AU). When enabled, renders 3–7 small planet spheres at close orbital distances. Animated orbits (periods 1–20 days). Shader: sphere + orbital animation. Shows system context. |
| Planets | Transit Event Visualization | uTransit | OFF | Planets transiting M-dwarf produce large transit depth (1–5% dimming, much larger than solar transits). When enabled, shows planet crossing stellar disk with brightness dip indicator. Shader: occulting sphere + light curve overlay. |
| Planets | Reflected Light from Close Planet | uReflectedLight | OFF | Close-in planet reflects starlight, visible as faint #FF8060 glow at planet position. Alpha 0.05. Shader: point glow at orbital position. Subtle effect. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Default View | uCameraMode | ON | Camera at ~2.5 R* distance, 30° inclination. FOV 50°. Shows starspots, flares, and granulation. Slow rotation visible. |
| Camera | Flare Drama View | uCameraMode | OFF | Camera auto-repositions to face active flare region. Distance ~1.5 R*. FOV 40°. Captures flare eruption detail. |
| Camera | System Context View | uCameraMode | OFF | Zoomed out to ~50 R* showing star + habitable zone + planets (if enabled). FOV 60°. Shows relative scale. |

---

### Brown Dwarf (Substellar Object)

**Entity ID:** ENT-1042
**Description:** Failed star — substellar object too low-mass for sustained hydrogen fusion (13–80 M_Jupiter, 0.012–0.076 M☉). Surface temperature 250–2200 K spanning spectral types L, T, Y. Appearance transitions from cloudy red-brown (L-type, ~1400–2200 K) through methane-dominated (T-type, ~600–1400 K, #6A4A8A purple-magenta) to extremely cold (Y-type, ~250–600 K, #2A1A2A near-black). Silicate/iron cloud decks, weather-like banding, possible auroral emission, and rapid rotation (1–10 hour periods). Real exemplars: Luhman 16 (L/T binary, closest brown dwarf system 6.5 ly), WISE 0855-0714 (Y-type, ~250 K, coldest known), 2MASS J2139+0220 (patchy clouds detected).

**Section Count:** 8
**Total Feature Count:** 26

#### Photosphere & Temperature (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Photosphere | L-Type Surface (Default) | uLTypeSurface | ON | Base L-type brown dwarf surface, temperature ~1400–2200 K. Color: deep red-brown #8A4A2A (blackbody + molecular absorption by FeH, CrH, alkali metals Na/K). FBM 5-octave (freq 25.0, amplitude 0.10) for cloud texture. Shader: temperature-dependent color mapping. Dim self-luminous object (10^-4–10^-5 L☉). |
| Photosphere | T-Type Methane Surface (Toggle) | uTTypeSurface | OFF | T-type mode (~600–1400 K). Methane (CH4) absorption removes red, creating characteristic purple-magenta #6A4A8A hue. FBM 4-octave (freq 20.0, amplitude 0.08). Shader: swap color palette to methane-dominated. Dramatically different appearance. |
| Photosphere | Y-Type Ultra-Cool Surface (Toggle) | uYTypeSurface | OFF | Y-type mode (~250–600 K). Extremely dim, near-black #2A1A2A with faint thermal glow. Water clouds possible. FBM 3-octave (freq 15.0, amplitude 0.05). Barely visible. Shader: extremely low emissive intensity. |
| Photosphere | Rapid Rotation Oblateness | uOblateness | ON | Brown dwarfs rotate rapidly (period 1–10 hours), causing significant oblateness. Equatorial bulge ratio b/a ~0.85–0.95. Shader: ellipsoid geometry with rotation-dependent axis ratio. Visible flattening. |

#### Cloud Decks & Weather (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Clouds | Silicate/Iron Cloud Deck (L-type) | uSilicateClouds | ON | L-type brown dwarfs have thick clouds of enstatite (MgSiO3), forsterite (Mg2SiO4), and iron (Fe) droplets at ~1500–1800 K. Color: brownish #7A4A30 with brighter patches #A06A40. FBM 6-octave (freq 30.0, amplitude 0.12) for patchy appearance. Shader: multi-layer cloud rendering with opacity variation. |
| Clouds | Cloud Holes & Patchy Clearings | uCloudHoles | ON | Infrared observations reveal patchy clouds with clearings showing hotter deeper layers. Rendered as irregular bright spots #C88A50 (2–5× surrounding brightness) scattered via Voronoi (freq 8.0). Coverage ~20–30%. Shader: bright spots where cloud opacity drops. Key observational feature (Luhman 16 variability). |
| Clouds | Atmospheric Banding (Jupiter-like) | uBanding | ON | Rapid rotation creates latitude-dependent banding (like Jupiter but less organized). Alternating slightly lighter #9A6A4A and darker #5A3A20 bands. FBM 3-octave (freq 12.0 zonal, 4.0 meridional, amplitude 0.06). Shader: latitude-dependent color modulation. Subtle structure. |
| Clouds | Cloud Deck Vertical Structure | uCloudLayers | ON | Multiple cloud layers at different altitudes/temperatures. Represented as depth-dependent opacity: upper cloud deck (optically thick, alpha 0.7), lower deck visible through holes (alpha 0.4, warmer color #B88A50). Shader: layered cloud rendering. |

#### Atmospheric Dynamics (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Dynamics | Zonal Wind Circulation | uZonalWinds | ON | Rapid rotation drives zonal wind jets (~100–700 m/s). Rendered as latitudinal UV distortion: amplitude 0.15, freq 8.0. Creates shearing of cloud textures. Shader: velocity-dependent UV offset by latitude. |
| Dynamics | Storm Vortices | uStorms | ON | Large anticyclonic vortices (Jupiter-like storms) in cloud deck. Rendered as 1–3 oval bright spots #B88A50, diameter ~5000 km each, with spiral internal structure. FBM 4-octave (freq 40.0, amplitude 0.08) for turbulence. Shader: elliptical Gaussian vortex overlay. |
| Dynamics | Rain-Out (Cloud Settling) | uRainOut | OFF | At L/T transition (~1300 K), silicate clouds settle below photosphere ("rain out"), clearing atmosphere. When enabled, shows progressive clearing from poles toward equator. Shader: latitude-dependent cloud opacity reduction. Transition visualization. |

#### Auroral & Magnetic Activity (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Aurora | Radio-Detected Aurorae | uAurorae | ON | Brown dwarfs show powerful aurorae (detected via radio emission, 10^4× Jupiter's). Rendered as bright red-purple #FF3070 oval caps at magnetic poles, pulsating at rotation period. Alpha 0.20–0.30. FBM 3-octave (freq 40.0, amplitude 0.10). Shader: pole-centered pulsating glow. Surprising observational discovery. |
| Aurora | Magnetic Dipole Field | uMagField | OFF | Strong dipole field (10–5000 Gauss). Rendered as glowing field lines blue #4A8FD8 to red #FF5050. Shader: parametric dipole rendering. Off by default. |
| Aurora | Electron Cyclotron Maser Emission | uECMEmission | OFF | Radio emission mechanism producing narrow-band coherent radiation. When enabled, shows narrow beam #C8A0FF emanating from magnetic pole at angle to rotation axis. Shader: cone beam geometry. Educational. |

#### Spectral Classification Comparison (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Spectral | L/T/Y Type Comparison Mode | uSpectralMode | OFF | Side-by-side or morphing comparison of L→T→Y spectral types, showing color/cloud evolution with cooling. Shader: interpolation between three surface palettes based on user-adjustable temperature slider. Educational. |
| Spectral | Temperature & Luminosity Label | uTempLabel | OFF | Text overlay showing effective temperature, luminosity, spectral type. Educational annotation. |

#### Deuterium Burning & Evolution (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Evolution | Deuterium Burning Phase (Young) | uDeuterium | OFF | Brown dwarfs >13 M_Jup briefly burn deuterium (~10 Myr), slightly brighter during this phase. When enabled, shows enhanced surface brightness (+20%) and warmer color shift #FF7A4A. Shader: brightness boost + color warm shift. Early evolutionary phase. |
| Evolution | Cooling Track Visualization | uCoolingTrack | OFF | Brown dwarfs cool continuously over Gyr timescales (no sustained fusion). When enabled, shows temperature evolution annotation (color shifts red→dark over billions of years). Educational overlay. |
| Evolution | Lithium Test Indicator | uLithiumTest | OFF | Presence of lithium absorption line confirms substellar status (brown dwarf, not very low mass star). When enabled, shows spectral line annotation. Educational. |

#### Companion Context (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Companion | Binary Brown Dwarf System | uBinaryBD | OFF | ~15% of brown dwarfs are in binary systems (e.g., Luhman 16A+B). When enabled, renders second brown dwarf at ~3 AU separation with orbital animation. Shader: second sphere + orbit. |
| Companion | Giant Planet Companion | uPlanetCompanion | OFF | Some brown dwarfs host giant planets. When enabled, renders small Jupiter-like sphere at ~1 AU. Shader: planet sphere with orbital animation. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Default View | uCameraMode | ON | Camera at ~2 R* distance, 30° inclination. FOV 50°. Shows cloud patterns, spots, and rapid rotation. |
| Camera | Pole View (Aurora Focus) | uCameraMode | OFF | Camera above magnetic pole, ~1.5 R*. FOV 45°. Shows auroral ovals and polar circulation. |
| Camera | Cloud Variability Monitor | uCameraMode | OFF | Fixed equatorial view showing rotational modulation of cloud patterns. Distance ~2.5 R*. FOV 55°. |

---

### Cepheid Variable Star

**Entity ID:** ENT-1044
**Description:** Pulsating yellow supergiant/giant star used as cosmic distance ladder "standard candle." Radial pulsation driven by κ (kappa) mechanism in helium ionization zone, period 1–100 days, luminosity 500–300,000 L☉, temperature oscillates 5000–6500 K. Color cycles from yellow-white #FFF8D0 (hot/contracted) to orange #FFA050 (cool/expanded). Radius change 5–25%. Period-luminosity relation (Leavitt Law) makes them fundamental cosmological tools. Real exemplars: δ Cephei (5.37-day period, prototype), Polaris (3.97-day, low amplitude), RS Puppis (41.4-day, reflection nebula), η Aquilae (7.18-day).

**Section Count:** 8
**Total Feature Count:** 26

#### Pulsating Photosphere (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Photosphere | Pulsation Cycle Color Change | uPulsationColor | ON | Temperature oscillates 5000–6500 K over pulsation period. Color cycles: maximum compression (hottest) #FFF8D0 yellow-white → expansion (cooling) #FFA050 orange → minimum (coolest) #FF8A30 deep orange → contraction (reheating). Sinusoidal color interpolation. Shader: time-dependent blackbody color mapping tied to pulsation phase. Primary visual effect. |
| Photosphere | Radius Pulsation (5–25%) | uRadiusPulse | ON | Star physically expands/contracts by 5–25% in radius over period. Animated sphere scaling: R(t) = R0 × (1 + A × sin(2π t/P)), where A = 0.05–0.25. Shader: time-dependent sphere radius scaling. Creates breathing visual effect. |
| Photosphere | Surface Velocity Indicator | uVelocityInd | ON | Radial velocity oscillates ±30–50 km/s. Represented by subtle Doppler color shift: approaching hemisphere slightly blue-shifted #E8E8FF, receding slightly red-shifted #FFE8D8. Amplitude ~2% color variation. Shader: directional color modulation based on pulsation phase. |
| Photosphere | Limb Darkening (Phase-Dependent) | uLimbDarkPhase | ON | Limb darkening changes with pulsation phase: stronger at minimum (deeper atmosphere), weaker at maximum (expanded, more transparent). cos(θ)^n where n oscillates 0.5–0.8. Shader: phase-dependent limb darkening exponent. |

#### Kappa Mechanism Visualization (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Kappa | Helium Ionization Zone Glow | uHeliumZone | OFF | The κ-mechanism operates in the He II ionization zone (~40,000 K depth). When enabled, shows subsurface glow #FFE080 pulsating in antiphase with surface (brightest when surface is contracting). Alpha 0.15. Shader: subsurface additive glow tied to pulsation phase. Educational. |
| Kappa | Opacity-Driven Pressure Wave | uPressureWave | OFF | Radial pressure waves propagating outward through atmosphere. When enabled, shows concentric expanding rings #FFF0C0 at alpha 0.10, timing synchronized with pulsation. Shader: expanding ring overlay. Educational visualization. |
| Kappa | Instability Strip Position Label | uInstabilityStrip | OFF | Text annotation showing position on HR diagram instability strip. Educational overlay. |

#### Light Curve & Period (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| LightCurve | Brightness Oscillation | uBrightnessOsc | ON | Luminosity varies by 0.5–2.0 magnitudes (factor 1.5–6× in flux). Emissive intensity oscillates sinusoidally (with slight asymmetry: rise time faster than decline). Shader: time-dependent emissive intensity modulation. Drives overall brightness change. |
| LightCurve | Asymmetric Light Curve Shape | uAsymmetricLC | ON | Classical Cepheids have asymmetric light curves: rapid rise to maximum (~30% of period), slow decline (~70%). Rendered via modified sine wave with harmonic overtone: I(t) = I0 + A×sin(ωt) + 0.15A×sin(2ωt). Shader: asymmetric temporal modulation. Realistic waveform. |
| LightCurve | Period-Luminosity Relationship Label | uPLRelation | OFF | Overlay showing Leavitt Law: log(L) = a × log(P) + b. Annotates this star's period and derived luminosity/distance. Educational. |

#### Atmospheric Dynamics (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Atmosphere | Shock Wave at Minimum Radius | uShockWave | ON | When star reaches minimum radius (maximum compression), shock wave propagates outward through atmosphere. Rendered as bright #FFFFFF expanding ring from surface, speed ~50 km/s (scaled), alpha 0.20, fading over 0.5 seconds. Shader: expanding shock front overlay at specific pulsation phase. |
| Atmosphere | Extended Atmospheric Envelope | uEnvelope | ON | At maximum expansion, extended atmosphere creates enhanced limb glow. Rendered as warm #FFC080 halo extending to 1.3 R*, alpha 0.12, visible primarily at maximum phase. Shader: phase-dependent extended atmosphere rendering. |
| Atmosphere | Chromospheric Emission Variability | uChromoVar | ON | Chromospheric emission lines (Ca II, Hα) vary with pulsation phase, strongest near minimum radius. Rendered as pulsating red-pink #FF6050 rim glow, alpha oscillating 0.05–0.20 with phase. Shader: phase-dependent chromospheric emission intensity. |

#### Circumstellar Environment (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Circumstellar | Mass Loss Wind | uMassLossWind | ON | Cepheids lose mass via pulsation-enhanced winds (~10^-8–10^-6 M☉/yr). Rendered as faint radial streamers #FFD0A0 extending to 3–5 R*, alpha 0.06. FBM 3-octave (freq 30.0, amplitude 0.08). Shader: radial wind visualization. |
| Circumstellar | Light Echo Nebula (RS Pup-like) | uLightEcho | OFF | Some Cepheids embedded in nebulosity show light echoes — pulsating brightness propagating outward through surrounding dust. When enabled, renders expanding bright rings #FFE8C0 in surrounding nebula, delayed by light-travel time. Shader: time-delayed concentric ring rendering. Spectacular effect (RS Puppis). |
| Circumstellar | Infrared Excess Shell | uIRShell | OFF | Mass loss creates circumstellar dust shell detectable in IR. When enabled, renders faint warm #AA7050 shell at 10–50 R*, alpha 0.08. Shader: thin shell geometry. |

#### Evolutionary Context (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Evolution | Blue Loop Crossing Indicator | uBlueLoop | OFF | Cepheids are intermediate-mass stars (3–15 M☉) crossing the instability strip on "blue loop" evolutionary tracks. Text annotation showing evolutionary state. Educational. |
| Evolution | First/Second/Third Crossing Mode | uCrossingMode | OFF | Star may be on 1st (rapid), 2nd (slow, most likely), or 3rd crossing of instability strip. When enabled, labels current crossing and implied evolutionary state. |
| Evolution | Period Change Rate | uPeriodChange | OFF | Period changes measurably over decades (±seconds/year) revealing evolutionary direction. Text overlay showing dP/dt. Educational. |

#### Companion Star (if binary) (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Binary | Hot Companion Detection | uHotCompanion | OFF | ~50% of Cepheids have hot blue companions (B/A main sequence). When enabled, renders blue #A0C8FF companion at configurable separation. Shader: secondary star sphere. |
| Binary | Orbital Motion | uOrbitalMotion | OFF | If binary, orbital motion modulates radial velocity measurements. When enabled, shows orbit ellipse #FFD700. Period ~years. Shader: orbital ellipse overlay. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Pulsation Observation View | uCameraMode | ON | Camera at ~3 R* distance, 30° inclination. FOV 50°. Shows pulsation breathing and color change clearly. |
| Camera | Light Echo View (if nebula) | uCameraMode | OFF | Zoomed out to ~100 R* showing surrounding nebula and light echo propagation. FOV 65°. |
| Camera | HR Diagram Context | uCameraMode | OFF | Split view: star visualization + HR diagram showing instability strip position. Educational. |

---

### Luminous Blue Variable (Hypergiant)

**Entity ID:** ENT-1046
**Description:** Extremely luminous (10^5.5–10^6.5 L☉), massive (25–120+ M☉), unstable hot supergiant near the Eddington luminosity limit. Undergoes dramatic S Doradus-type eruptions with 1–2 magnitude brightness changes over years, and rare giant eruptions ejecting solar masses of material. Temperature oscillates 8,000–25,000 K between quiescent (hot blue #A0C8FF) and eruption (cool pseudo-photosphere #FFDA80). Surrounded by massive ejected nebula. Real exemplars: η Carinae (5 M☉ Homunculus Nebula, 10^6.7 L☉), P Cygni (17th century eruption), AG Carinae (ring nebula), S Doradus (prototype in LMC).

**Section Count:** 8
**Total Feature Count:** 28

#### Photosphere & Instability (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Photosphere | Hot Quiescent State | uHotState | ON | Quiescent temperature 15,000–25,000 K, color blue-white #A0C8FF to #D8E8FF. FBM 4-octave (freq 30.0, amplitude 0.08) for atmospheric turbulence. Luminosity ~10^6 L☉. Shader: hot star color with atmospheric texture. Default appearance. |
| Photosphere | S Doradus Eruption State | uEruptionState | OFF | During eruption (months–years), star expands dramatically, temperature drops to 8,000–9,000 K, color shifts to yellow-white #FFDA80. Radius increases 10–100×. When toggled, applies cool color palette + expanded radius. Shader: temperature/radius state change. Dramatic transformation. |
| Photosphere | Super-Eddington Wind | uSuperEddington | ON | Radiation pressure near/exceeding Eddington limit drives continuous dense wind (mass loss 10^-5–10^-3 M☉/yr). Rendered as thick radial streamers #C8E0FF at alpha 0.25, extending to 3–5 R*. FBM 5-octave (freq 20.0, amplitude 0.12). Shader: dense wind visualization. Dominant structural feature. |
| Photosphere | Photospheric Instability Ripples | uInstabilityRipples | ON | Near-Eddington luminosity creates strange-mode pulsational instabilities. Rendered as surface ripple pattern: concentric wave distortions, amplitude 0.05, frequency ~0.5 Hz. FBM modulation (freq 40.0). Shader: time-dependent surface displacement. Shows instability. |

#### Eruption Events (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Eruption | Giant Eruption Mass Ejection | uGiantEruption | OFF | Rare giant eruption (η Car 1840s-type): ejects 1–10 M☉ in months. When enabled, shows massive expanding shell #FFDA80 at alpha 0.40, expanding rapidly from star. Duration ~2 seconds (representing years). Shader: expanding dense shell geometry. Spectacular event. |
| Eruption | Bipolar Ejecta (Homunculus-type) | uBipolarEjecta | ON | Giant eruptions often produce bipolar nebula (Homunculus shape). Rendered as two expanding lobes along polar axis, color warm #FFE0A0 to reddish #AA6030 at edges. FBM 5-octave (freq 25.0, amplitude 0.12) for clumpy texture. Size ~0.1 ly. Shader: bipolar lobe geometry with FBM texture. Iconic η Car feature. |
| Eruption | Equatorial Disk/Skirt | uEquatorialDisk | ON | Dense equatorial disk of ejected material between bipolar lobes. Color: dusty #AA7040, alpha 0.30. Disk thickness ~0.01 ly. FBM 4-octave (freq 35.0, amplitude 0.10). Shader: thin equatorial torus. Connects bipolar structure. |
| Eruption | Blast Wave Through Nebula | uBlastWave | OFF | Eruption blast wave propagating through pre-existing wind. When enabled, shows expanding bright #FFFFFF shock front at edge of bipolar nebula. Shader: expanding shock surface. |

#### Circumstellar Nebula (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Nebula | Inner Ejected Shell (Recent) | uInnerShell | ON | Most recent eruption shell (age ~100–200 years), size ~0.1 ly. Clumpy, nitrogen-enriched. Color: warm #FFD0A0 to reddish #CC7040. FBM 6-octave (freq 30.0, amplitude 0.12) for complex filamentary structure. Shader: volumetric shell rendering with turbulence. |
| Nebula | Outer Fossil Shells (Older Eruptions) | uOuterShells | ON | Multiple older shells from previous eruptions (age ~1000–10,000 years), size 0.5–2 ly. Fainter, more diffuse. Color: pale #AA8070, alpha 0.10–0.15. Shader: concentric shell overlays at various radii. Shows eruptive history. |
| Nebula | Nebula Nitrogen Enhancement | uNitrogenNeb | ON | LBV nebulae strongly nitrogen-enriched (CNO-processed material). Represented by slight color shift: more reddish-pink #FF8070 compared to normal nebulae. Shader: color tint overlay on nebula. Chemical signature. |

#### Wind Variability & P Cygni Profile (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Wind | Wind Clumping & Density Variations | uWindClumps | ON | LBV winds are highly clumped (clumping factor 10–100). Rendered as dense bright knots #C8D8FF scattered through wind, size ~0.01 R* each. Poisson distribution, ~20–50 visible. Shader: scattered bright point overlay in wind volume. |
| Wind | Variable Mass Loss Rate | uVariableMLR | ON | Mass loss rate varies 10× between quiescent and eruption. Represented by wind density modulation tied to eruption state. Quiescent: sparse wind alpha 0.15. Eruption: dense wind alpha 0.40. Shader: state-dependent wind opacity. |
| Wind | P Cygni Spectral Profile Label | uPCygniLabel | OFF | Characteristic P Cygni profile (absorption + emission) indicating expanding atmosphere. Text annotation. Educational. |

#### Binary Companion (η Car-type) (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Binary | Hot Companion Star | uCompanion | OFF | η Carinae has a hot O-type companion in 5.54-year eccentric orbit. When enabled, renders blue-white #C8E0FF companion at elliptical orbital position. Shader: secondary star + orbital animation. |
| Binary | Colliding Wind Shock Cone | uWindShock | OFF | Where LBV and companion winds collide, a shock cone forms. When enabled, renders bright X-ray-emitting #8AC8FF cone between stars. Shader: cone geometry between two points. |
| Binary | Periastron Interaction Event | uPeriastron | OFF | At closest approach, dramatic wind interaction spike. When enabled, shows intensified shock and potential eruption trigger. Shader: phase-dependent brightness enhancement at periastron. |

#### Evolutionary State (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Evolution | Pre-Wolf-Rayet Transition | uPreWR | OFF | LBVs are transitional phase before Wolf-Rayet stage (stripped-envelope star). Label showing evolutionary context. Educational. |
| Evolution | HR Diagram Track | uHRTrack | OFF | Shows S Doradus instability strip and LBV's horizontal excursion on HR diagram. Educational overlay. |
| Evolution | Supernova Progenitor Context | uSNProgenitor | OFF | Some LBVs may explode directly as Type IIn supernovae (SN 2009ip-type). Label overlay. Educational. |

#### Dust Formation (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Dust | Dust Condensation in Ejecta | uDustCondensation | ON | Cooling ejecta forms dust at ~1500 K distance from star. Rendered as warm infrared #AA5030 glow in nebula, concentrated at 0.05–0.1 ly distance. Alpha 0.15. Shader: radial dust emission overlay. Major IR source. |
| Dust | Dust Lane Obscuration | uDustLane | ON | Dense equatorial dust obscures central star along certain viewing angles. Rendered as dark #3A2A1A absorption band across star in equatorial plane. Alpha 0.5 in densest regions. Shader: extinction overlay geometry. |
| Dust | Coronagraphic Mask Effect | uCoronagraph | OFF | Star so bright it's often observed with coronagraph. When enabled, masks central star to reveal faint nebula detail. Shader: central brightness suppression. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Star + Inner Nebula | uCameraMode | ON | Camera at ~0.1 ly distance, 30° inclination. FOV 55°. Shows star, bipolar ejecta, equatorial disk. |
| Camera | Full Nebula Context | uCameraMode | OFF | Camera at ~1 ly distance. FOV 70°. Shows entire Homunculus-type nebula + outer shells. |
| Camera | Eruption Close-Up | uCameraMode | OFF | Camera at ~5 R*, tracking eruption dynamics. FOV 40°. Shows photospheric instability detail. |

---

### O-Type Blue Main Sequence Star

**Entity ID:** ENT-1048
**Description:** Hottest, most luminous main-sequence star. Temperature 30,000–50,000 K, mass 15–120+ M☉, luminosity 30,000–1,000,000+ L☉, radius 6–15 R☉. Brilliant blue-white #C8D8FF to #E0E8FF color. Extremely powerful UV radiation ionizing surrounding ISM into HII region. Strong stellar wind (10^-6–10^-5 M☉/yr, 2000–3000 km/s). Lifetime only 1–10 Myr. Rare: <0.001% of all stars. Real exemplars: θ¹ Ori C (Trapezium, 39 M☉), ζ Puppis (59 M☉, fastest wind), 10 Lacertae (spectral standard O9V), HD 93129A (130 M☉, one of most luminous known).

**Section Count:** 8
**Total Feature Count:** 26

#### Photosphere (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Photosphere | Hot Blue-White Surface | uPhotosphere | ON | Surface temperature 30,000–50,000 K, color brilliant blue-white #C8D8FF (Wien peak in UV). FBM 3-octave (freq 25.0, amplitude 0.06) for subtle surface texture. Extremely high surface brightness. Shader: UV-peaked blackbody color + Lambertian. |
| Photosphere | Micro-Turbulence | uMicroTurb | ON | Surface shows micro-turbulent velocity fields (~10–20 km/s), creating subtle brightness variations. FBM 5-octave (freq 50.0, amplitude 0.04). Shader: high-frequency brightness modulation. Small effect but physically real. |
| Photosphere | Gravity Darkening (von Zeipel) | uGravDark | ON | Rapid rotation causes equatorial gravity darkening (von Zeipel effect): poles ~10% brighter and bluer #D0E0FF, equator slightly dimmer and redder #B8C8F0. Shader: latitude-dependent temperature/color. Affects apparent shape. |
| Photosphere | Limb Darkening (Weak) | uLimbDark | ON | Weak limb darkening (cos(θ)^0.4) due to hot, extended atmosphere. Edge barely darker. Shader: gentle view-angle falloff. |

#### Stellar Wind & Mass Loss (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Wind | Fast Radiative Wind | uFastWind | ON | Radiation-driven wind at 2000–3000 km/s, mass loss 10^-6–10^-5 M☉/yr. Rendered as radial streamers #C8E8FF blue-white, extending to 5–10 R*. FBM 4-octave (freq 20.0, amplitude 0.10). Alpha 0.15–0.20. Shader: radial wind visualization. Major structural feature. |
| Wind | Wind Clumping | uWindClumps | ON | O-star winds are highly structured with density clumps (filling factor ~0.1). Rendered as bright knots #E0F0FF scattered through wind volume. Sparse Poisson (freq 100.0, ~30% coverage). Shader: clumpy brightness modulation in wind. |
| Wind | Wind-Blown Bubble | uWindBubble | ON | Fast wind sweeps up ISM creating hot (~10^6 K) bubble surrounded by dense shell at ~1–10 pc. Rendered as faint blue #5A8FC8 extended glow, radius ~0.5 ly, alpha 0.08. Shader: large-scale bubble visualization. |
| Wind | Terminal Velocity Shock | uTermShock | OFF | Wind reaches terminal velocity and may form standing shock. When enabled, shows bright thin shell #FFFFFF at ~10 R*. Shader: thin spherical shock front. |

#### UV Radiation & HII Region (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| UV | Ionizing UV Radiation Field | uUVField | ON | O-stars emit 10^48–10^50 ionizing photons/s (Lyman continuum), creating HII regions. Represented by violet-blue #8A6FDF radial glow extending to ~10 pc (scaled). Alpha 0.08. Shader: extended UV field visualization. Defines environment. |
| UV | Strömgren Sphere (HII Region) | uStromgren | ON | Spherical ionized region (Strömgren sphere) radius 1–100 pc depending on density. Rendered as large pink-red #FF5070 shell at configured distance, alpha 0.12, FBM 4-octave (freq 15.0, amplitude 0.08) for clumpy edges. Shader: large ionized bubble. Iconic feature. |
| UV | Evaporating Gaseous Globules (EGGs) | uEGGs | OFF | Dense neutral gas knots being photo-evaporated by UV radiation, creating cometary tails pointing away from star. When enabled, renders small dark #3A3A4A blobs with bright #FF8070 rims at configured positions. Shader: small dark silhouettes + bright rims. Famous HST Eagle Nebula features. |

#### Rapid Rotation (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Rotation | Rotational Oblateness | uOblateness | ON | Many O-stars rotate at 100–400 km/s (significant fraction of breakup). Oblateness b/a ~0.80–0.95. Shader: ellipsoid geometry. Visible equatorial bulge. |
| Rotation | Be-Star Decretion Disk (if fast) | uDecretionDisk | OFF | Near-critical rotation ejects equatorial material forming gaseous disk. When enabled, renders thin bright #FF6090 Hα-emitting disk, alpha 0.20. Shader: thin equatorial torus geometry. Relevant for Oe/Be stars. |
| Rotation | Rotational Mixing Enhancement | uRotMixing | OFF | Fast rotation enhances internal mixing, bringing CNO-processed material to surface. Represented by subtle surface color shift (slightly nitrogen-enhanced blue). Educational. |

#### Binary Context (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Binary | O+O Binary System | uOBinary | OFF | >70% of O-stars are in binaries. When enabled, renders companion O-star at configurable separation. Both contribute ionizing flux. Shader: second star sphere + orbit. |
| Binary | Colliding Wind Region | uCollidingWinds | OFF | In O+O binaries, wind collision creates hot (~10^7 K) X-ray-emitting shock between stars. When enabled, renders bright blue-white #A8D8FF cone/sheet between stars. Shader: shock geometry. |
| Binary | Wind-Roche Lobe Interaction | uWindRoche | OFF | In close binaries, wind modified by Roche geometry. When enabled, shows asymmetric wind pattern. Shader: Roche-influenced wind streamlines. |

#### Feedback & Environment (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Feedback | Radiation Pressure on Dust | uRadPressure | OFF | Intense radiation clears dust from vicinity, creating dust-free cavity. When enabled, shows dark void around star with dusty #AA7050 boundary at ~0.1 ly. Shader: radial dust clearing visualization. |
| Feedback | Triggered Star Formation | uTriggeredSF | OFF | Expanding HII region compresses surrounding molecular cloud, triggering new star formation at boundary. When enabled, shows bright embedded sources at Strömgren sphere edge. Educational overlay. |
| Feedback | Cluster Membership Context | uClusterContext | OFF | O-stars are always born in clusters/associations. When enabled, shows surrounding OB association stars (multiple bright sources). Shader: scattered point sources. |

#### Short Lifetime & Evolution (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Evolution | Main Sequence Lifetime Label | uMSLifetime | OFF | O-stars live 1–10 Myr on main sequence (vs Sun's 10 Gyr). Text annotation. Educational. |
| Evolution | Core Hydrogen Depletion Track | uHDepletion | OFF | Shows evolutionary track toward supergiant/WR phase. HR diagram overlay. Educational. |
| Evolution | Supernova Fate Indicator | uSNFate | OFF | Labels expected death: core-collapse supernova (Type Ib/c or II), possibly gamma-ray burst for fastest rotators. Educational. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Star Close-Up | uCameraMode | ON | Camera at ~3 R* distance, 20° inclination. FOV 50°. Shows surface, wind structure. |
| Camera | HII Region Context | uCameraMode | OFF | Camera at ~10 pc distance. FOV 70°. Shows full Strömgren sphere and surrounding environment. |
| Camera | Binary System View | uCameraMode | OFF | Camera at ~20 R* showing both components and colliding winds. FOV 55°. |

---

### Carbon Star (AGB)

**Entity ID:** ENT-1050
**Description:** Cool asymptotic giant branch (AGB) star with carbon-enriched atmosphere (C/O > 1) from helium shell flash dredge-up. Temperature 2000–3000 K, luminosity 1000–10,000 L☉, radius 200–500 R☉. Distinctive deep ruby-red color #CC2200 (among the reddest stars visible) due to C2, CN, and C3 molecular absorption. Produces copious carbon-rich dust, forming thick circumstellar envelope. Thermal pulse cycle (10^4–10^5 years). Real exemplars: R Leporis (Hind's Crimson Star, C/O=1.1), CW Leonis (IRC+10216, thickest dust shell known, 0.5 ly envelope), V Hydrae (jet-producing), Y CVn (La Superba, vivid red).

**Section Count:** 8
**Total Feature Count:** 27

#### Deep Red Photosphere (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Photosphere | Carbon-Rich Surface | uCarbonSurface | ON | Temperature 2000–3000 K, extreme molecular absorption by C2 (Swan bands), CN, CH. Color: deep ruby-red #CC2200 at 2500 K, shifting to #FF4A1A near 3000 K. FBM 5-octave (freq 20.0, amplitude 0.12) for large convective cells. Shader: carbon-star color palette + Lambertian. Among reddest objects in sky. |
| Photosphere | Giant Convective Cells | uGiantCells | ON | AGB stars have few (~3–10) enormous convective cells spanning significant fraction of stellar surface. Rendered as Voronoi domains (freq 3.0) with bright center #FF5A2A and dark boundaries #8A1A0A. Cell diameter ~100 R☉. Shader: large-scale Voronoi brightness pattern. Causes photometric variability. |
| Photosphere | Long-Period Variability (Mira-type) | uLPV | ON | Pulsation period 100–500 days, amplitude 2–8 magnitudes in visual (due to molecular opacity changes). Brightness and color oscillate: bright phase #FF5A2A → faint phase #6A1A0A (nearly vanishing). Shader: time-dependent brightness + color modulation with long period. |
| Photosphere | Limb Darkening (Extreme) | uLimbDark | ON | Very extended atmosphere creates extreme limb darkening. cos(θ)^1.0–1.2. Edge nearly invisible. Shader: steep view-angle darkening. |

#### Circumstellar Dust Envelope (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Dust | Carbon Dust Shell | uCarbonDust | ON | Copious mass loss (10^-7–10^-4 M☉/yr) forms thick carbon (amorphous carbon, SiC) dust shell. Color: dark reddish-brown #5A2A10, extending from ~5 R* (dust condensation radius at ~1500 K) to ~1000+ R*. FBM 6-octave (freq 15.0, amplitude 0.15) for clumpy structure. Alpha varies 0.3–0.8 depending on density. Shader: volumetric dust shell raymarching. Can completely obscure star (IRC+10216). |
| Dust | Dust Formation Zone | uDustFormation | ON | Active dust condensation front at ~5–10 R* (temperature ~1000–1500 K). Rendered as bright warm #FF8050 ring/shell at condensation radius, alpha 0.20. FBM 4-octave (freq 40.0, amplitude 0.10) for nucleation patchiness. Shader: shell rendering at specific radius. Formation boundary. |
| Dust | Detached Shell (Thermal Pulse) | uDetachedShell | OFF | Thermal pulses eject discrete shells visible as detached rings at 0.01–0.1 ly. When enabled, renders thin bright #AA6030 ring at configured radius. Shader: thin shell geometry. Evidence of episodic mass loss. |
| Dust | Bipolar Outflow Shaping | uBipolarShape | OFF | Some carbon stars show bipolar dust distribution (possibly from binary companion or magnetic field). When enabled, applies bipolar density enhancement along axis. Shader: axial density modulation. |

#### Molecular Absorption Features (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Molecular | C2 Swan Band Absorption | uC2Bands | ON | C2 molecule absorbs strongly at 470, 517, 563 nm (Swan bands), removing green-blue light. Responsible for extreme red color. Represented by deepened red saturation relative to pure blackbody. Shader: spectral absorption color modification. |
| Molecular | CN Red System Bands | uCNBands | ON | CN molecule creates additional absorption in blue/violet, further reddening the star. Combined with C2 creates characteristic carbon-star SED. Shader: additional color filtering. |
| Molecular | SiC Dust Emission Feature | uSiCEmission | OFF | Silicon carbide (SiC) dust grains produce 11.3 μm emission feature. Not directly visible but represented by enhanced IR glow #AA5030 in dust shell. Shader: dust composition color indicator. |

#### Thermal Pulses & Dredge-Up (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| ThermalPulse | Helium Shell Flash Brightening | uShellFlash | OFF | Thermal pulse (helium shell flash every 10^4–10^5 years) briefly increases luminosity 10–100×. When enabled, shows sudden brightening event with luminosity spike. Duration ~1 second (representing centuries). Shader: time-dependent luminosity burst. |
| ThermalPulse | Third Dredge-Up Enhancement | uDredgeUp | OFF | Post-flash convection brings carbon from core to surface (third dredge-up), enriching C/O ratio. When enabled, shows subtle surface color deepening (more red). Educational visualization. |
| ThermalPulse | Technetium Detection Label | uTcDetection | OFF | Presence of radioactive technetium (Tc, half-life 4.2 Myr) on surface proves active dredge-up. Text annotation. Educational. |

#### Mass Loss & Wind (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Wind | Slow Dense Wind | uSlowWind | ON | Wind speed 10–25 km/s (radiation pressure on dust grains drives wind). Rendered as dense radial streamers #8A4020 extending from dust shell outward. FBM 3-octave (freq 12.0, amplitude 0.10). Alpha 0.15. Shader: radial wind visualization. |
| Wind | Spiral Wind Pattern (Binary) | uSpiralWind | OFF | If in binary system, orbital motion creates Archimedean spiral in wind (e.g., AFGL 3068). When enabled, shows spiral density pattern in dust shell. Shader: spiral geometry overlay. Spectacular ALMA feature. |
| Wind | Planetary Nebula Precursor | uPNPrecursor | OFF | Intense mass loss strips envelope, revealing hot core → future planetary nebula. Label showing evolutionary fate. Educational. |

#### Maser Emission (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Maser | SiO Maser Ring | uSiOMaser | OFF | SiO maser emission at ~2–4 R* (close to star, above photosphere). When enabled, renders thin bright #FF9060 ring at 3 R*, alpha 0.15. Shader: thin ring geometry. VLBI-resolvable. |
| Maser | H2O Maser Shell | uH2OMaser | OFF | Water maser emission at ~5–50 R* (in dust formation zone). When enabled, renders scattered bright #4AAFF0 points at configured radius. Shader: sparse bright point overlay. |
| Maser | OH Maser Outer Shell | uOHMaser | OFF | OH maser at ~100–1000 R* (outer envelope). When enabled, renders faint bright #50FF80 points at large radius. Shader: sparse outer point sources. |

#### Companion Effects (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Companion | Symbiotic Interaction (if WD companion) | uSymbiotic | OFF | If white dwarf companion accretes carbon-star wind, creates symbiotic system. When enabled, shows accretion glow on companion. Shader: WD + accretion. Cross-reference with Symbiotic Star entity. |
| Companion | Jet/Outflow (V Hya-type) | uJetOutflow | OFF | Some carbon stars with companions produce high-speed jets (~200 km/s). When enabled, renders bipolar cyan #4AAFDF jets from central region. Shader: jet cone geometry. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Star + Dust Shell | uCameraMode | ON | Camera at ~10 R* distance. FOV 55°. Shows star through dust shell with color and variability. |
| Camera | Full Envelope View | uCameraMode | OFF | Camera at ~500 R* showing complete circumstellar envelope. FOV 65°. Shows detached shells if enabled. |
| Camera | Close Photosphere View | uCameraMode | OFF | Camera at ~1.5 R*. FOV 40°. Shows giant convective cells and molecular features. |

---

### T Tauri Star (Pre-Main-Sequence)

**Entity ID:** ENT-1052
**Description:** Young (0.1–10 Myr) low-mass (0.1–2 M☉) pre-main-sequence star still contracting toward main sequence. Temperature 3000–5500 K, luminosity 0.1–10 L☉ (variable), radius 1–5 R☉ (inflated from gravitational contraction). Color: warm yellow-orange #FFD090 to orange-red #FF8040. Characterized by extreme variability (irregular, 1–3 mag), powerful magnetic activity, accretion from circumstellar disk, bipolar jets, and lithium-rich spectrum. Classical T Tauri (CTTS) have active accretion; Weak-lined T Tauri (WTTS) have cleared disks. Real exemplars: T Tauri (prototype, 0.5 Myr), HL Tau (disk imaged by ALMA), DG Tau (jets), BP Tau (magnetospheric accretion studied).

**Section Count:** 8
**Total Feature Count:** 27

#### Young Photosphere (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Photosphere | Inflated Pre-MS Photosphere | uPhotosphere | ON | Larger than MS equivalent (radius 1–5 R☉) due to ongoing contraction. Temperature 3000–5500 K, color yellow-orange #FFD090 (K-type) to orange-red #FF8040 (M-type). FBM 5-octave (freq 30.0, amplitude 0.12) for active convective texture. Shader: temperature-dependent color + Lambertian. Variable baseline. |
| Photosphere | Massive Starspot Coverage | uStarspots | ON | Extremely active magnetically: starspot coverage 30–60% (far exceeding any MS star). Spot temperature ~500–1000 K below photosphere, color #5A2A10 very dark. Voronoi domains (freq 4.0) with FBM edge modulation (freq 25.0). Shader: dark spot overlay. Causes irregular photometric variability. |
| Photosphere | Accretion Hotspots (Magnetic Funnel) | uAccretionHotspots | ON | Disk material channeled along magnetic field lines impacts stellar surface at poles, creating hot spots (6000–10,000 K). Color: bright white-yellow #FFE8C0 to blue-white #C8D8FF. 2 spots at magnetic poles, each covering ~1–5% of surface. Shader: polar-centered bright spots. Diagnostic of active accretion. |
| Photosphere | Veiling Continuum (Accretion Excess) | uVeiling | ON | Accretion luminosity adds continuum "veiling" emission (UV/blue excess). Represented by overall blue-ward color shift #F0E0D0 → #D8D0E0 at alpha 0.10–0.15. Shader: additive blue excess overlay. Spectroscopic signature of accretion. |

#### Magnetospheric Accretion (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Accretion | Magnetic Funnel Flows | uFunnelFlows | ON | Material from inner disk edge lifted along dipolar field lines to stellar surface. Rendered as bright #FFD080 curved streams from disk inner edge (~5 R*) to stellar poles. FBM 3-octave (freq 40.0, amplitude 0.10) along flow path. Shader: parametric funnel stream geometry. Key CTTS feature. |
| Accretion | Magnetospheric Cavity | uMagCavity | ON | Strong stellar magnetic field (1–3 kG) truncates disk at magnetospheric radius (~5 R*). Region inside disk inner edge is cleared (gas-free except funnel flows). Rendered as dark void between star and disk inner edge. Shader: cleared region rendering. |
| Accretion | Accretion Shock Luminosity | uAccShock | ON | Infalling material hits stellar surface at ~300 km/s, creating accretion shock. Bright UV emission at impact site. Rendered as very bright #FFFFFF flash zone at hotspot base, alpha 0.30–0.40. Shader: intense localized brightness at pole. Energy source for variability. |
| Accretion | Accretion Rate Variability | uAccRateVar | ON | Accretion rate varies on hours–days timescale (instabilities in disk/funnel flow). Represented by stochastic brightness modulation of accretion features (amplitude ±30%, frequency 0.01–0.1 Hz). Shader: noise-modulated accretion brightness. Creates irregular variability. |

#### Bipolar Jets & Outflows (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Jets | Bipolar Jet (Optical) | uOpticalJet | ON | Collimated bipolar jets (opening angle ~5–10°) at 150–400 km/s, extending 100–10,000 AU. Color: bright blue-green #4AAFDF ([O III], [S II] emission). FBM 4-octave (freq 35.0, amplitude 0.10) for knot structure. Shader: narrow cone geometry with turbulence. Dramatic outflow. |
| Jets | Herbig-Haro Shock Knots | uHHKnots | ON | Jet collides with ISM creating Herbig-Haro objects — bright emission knots (HH objects). Rendered as 3–8 bright #FF6070 bow-shaped shock features along jet length. FBM 3-octave local (freq 60.0, amplitude 0.08). Shader: bright knot overlays along jet. Observable features. |
| Jets | Jet Precession & Wiggle | uJetWiggle | ON | Jet axis may precess due to disk warping or binary companion, creating sinusoidal pattern. Rendered as helical jet path (amplitude ~5°, period ~10^3 years scaled). Shader: time-dependent jet axis modulation. Shows dynamical interaction. |

#### Extreme Variability (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Variability | Irregular Brightness Variations | uIrregVar | ON | Classical T Tauri stars show irregular variability: 0.5–3 magnitudes over days–weeks. Caused by combination of rotation (spots), accretion variations, and disk obscuration. Rendered as complex time-dependent brightness modulation. Shader: multi-frequency noise-driven brightness. |
| Variability | UX Ori-Type Eclipses | uUXOriDips | OFF | Disk material at disk rim occasionally eclipses star, causing deep (1–3 mag) dips lasting hours–days. When enabled, shows periodic deep brightness dips with reddening. Shader: extinction event simulation. |
| Variability | FU Orionis Outbursts | uFUOrBurst | OFF | Rare dramatic outburst (5–6 magnitude brightening over months) from thermal instability in inner disk causing massive accretion increase. When enabled, shows sustained extreme brightening. Shader: high-luminosity state. Rare but spectacular. |

#### Disk Interaction (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Disk | Inner Disk Rim (Wall) | uInnerRim | ON | Dust sublimation creates sharp inner edge at ~0.05–0.5 AU (temperature ~1500 K). Rendered as bright warm #E0B080 wall visible as ring around star. Shader: ring geometry at sublimation radius. Defines inner boundary. |
| Disk | Disk Wind (Thermal/Magnetic) | uDiskWind | ON | Warm disk wind rising from disk surface (10–50 km/s). Rendered as faint #AA9070 streamers rising from disk surface. FBM 3-octave (freq 25.0, amplitude 0.08). Alpha 0.10. Shader: streamers from disk surface. |
| Disk | CTTS vs WTTS Mode Toggle | uCTTSMode | ON | Toggle between Classical (with disk, accretion) and Weak-lined (diskless, no accretion) modes. WTTS shows star + spots only, no disk/funnel/jets. Shader: conditional feature visibility based on mode. |

#### Magnetic Activity (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Magnetic | Kilogauss Dipole Field | uKGField | OFF | T Tauri stars have ~1–3 kG surface dipole fields (10–30× solar peak). Rendered as bright blue #4A8FD8 field lines. Shader: parametric dipole rendering. Defines magnetospheric structure. |
| Magnetic | Coronal X-ray Emission | uCoronalXray | ON | Extremely active coronae (L_X/L_bol ~ 10^-3, saturated level). Rendered as hot blue-white #A0C8F0 coronal glow, radius ~2 R*, alpha 0.10. Shader: volumetric corona. |
| Magnetic | Mega-Flares | uMegaFlares | ON | T Tauri flares can reach 10^34–10^36 erg (10–1000× largest solar flares). Rendered as brilliant white #FFFFFF flash at random surface location. Frequency ~0.005 Hz. Duration 0.5–2 seconds. Shader: stochastic time-based flash. |

#### Evolutionary State (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Evolution | Hayashi Track Position | uHayashi | OFF | Star contracting along Hayashi track (fully convective, nearly vertical descent on HR diagram). Text label showing age and evolutionary state. Educational. |
| Evolution | Lithium Abundance Label | uLithium | OFF | T Tauri stars retain primordial lithium (destroyed by nuclear burning on MS). Spectroscopic age indicator. Text annotation. Educational. |
| Evolution | Disk Dissipation Timeline | uDiskDissipation | OFF | Disk typically dissipates within 1–10 Myr. When enabled, shows disk opacity decreasing over time (accelerated animation). Educational. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Star + Funnel Flows | uCameraMode | ON | Camera at ~10 R* distance, 30° inclination. FOV 55°. Shows star, hotspots, funnel flows, and inner disk rim. |
| Camera | Jet + HH Objects | uCameraMode | OFF | Camera at ~1000 AU showing full bipolar jet and Herbig-Haro knots. FOV 60°. |
| Camera | System Context (Star + Disk) | uCameraMode | OFF | Camera at ~200 AU, shows star + full protoplanetary disk. FOV 65°. Cross-references Protoplanetary Disk entity. |

---

### Symbiotic Star System

**Entity ID:** ENT-1054
**Description:** Interacting binary consisting of a cool red giant (M-type, 2500–3500 K) and a hot compact companion (usually white dwarf, T_WD > 50,000 K), connected by mass transfer. The red giant's wind or Roche lobe overflow feeds the white dwarf, creating ionized nebula, jets, and nova-like outbursts. Combines the reddest and bluest stellar components simultaneously. Orbital periods 200–1000+ days. Real exemplars: Z Andromedae (prototype, P=758d), Mira AB (Mira + WD at 70 AU), R Aquarii (jet-producing, P=44yr), CH Cygni (triple system), AG Draconis (outbursting).

**Section Count:** 8
**Total Feature Count:** 26

#### Red Giant Component (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| RedGiant | Cool Giant Photosphere | uRedGiant | ON | M-type giant, temperature 2500–3500 K, radius 50–200 R☉. Color: orange-red #FF5A2A. FBM 4-octave (freq 20.0, amplitude 0.10) for convective granulation. Shader: cool star rendering. Dominant visual element by size. |
| RedGiant | Giant Pulsation (Semi-Regular) | uGiantPulse | ON | Semi-regular pulsation (Mira or SRb type), period 100–500 days, amplitude 0.5–8 magnitudes. Radius oscillates ±10–20%. Shader: time-dependent radius + brightness modulation. Drives mass loss enhancement. |
| RedGiant | Mass Loss Wind | uGiantWind | ON | Slow dense wind (10–25 km/s, 10^-7–10^-5 M☉/yr). Rendered as radial dusty #AA6040 streamers from giant surface. FBM 3-octave (freq 15.0, amplitude 0.10). Alpha 0.12. Shader: radial wind from giant. Feeds companion. |

#### White Dwarf Companion (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| WD | Hot White Dwarf | uWhiteDwarf | ON | Compact companion, T = 50,000–200,000 K, radius ~0.01 R☉. Color: intense blue-white #D0E0FF (UV-dominant). Much smaller than giant but comparable luminosity due to extreme temperature. Shader: hot point source with glow. |
| WD | Accretion Luminosity | uAccLuminosity | ON | Accreting giant's wind at ~10^-8–10^-7 M☉/yr generates accretion luminosity (10–1000 L☉ in UV/soft X-ray). Rendered as bright #C8D8FF halo around WD, radius ~0.1 R_giant, alpha 0.30. Shader: bright accretion glow. |
| WD | Quasi-Steady Nuclear Burning | uQuasiBurning | ON | If accretion rate sufficient, hydrogen burns quasi-steadily on WD surface (supersoft source). Rendered as sustained bright #E0E8FF glow at WD surface. Shader: steady luminosity from WD. Distinguishes from nova explosions. |

#### Ionized Nebula (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Nebula | HII Ionization Nebula | uHIINebula | ON | WD's UV radiation ionizes portion of giant's wind, creating emission nebula. Rendered as bright pink-red #FF5070 ionized zone surrounding WD hemisphere (facing WD side ionized, facing away neutral). FBM 4-octave (freq 25.0, amplitude 0.10). Alpha 0.20. Shader: directional ionization rendering. Key diagnostic feature. |
| Nebula | Ionization Boundary (Strömgren) | uIonBoundary | ON | Sharp boundary between ionized (facing WD) and neutral (shadowed by giant) regions. Rendered as visible color discontinuity: ionized #FF5070 vs neutral #AA6040. Shader: geometric boundary based on WD-giant axis. |
| Nebula | Raman Scattered Emission | uRamanScatter | OFF | Characteristic Raman-scattered O VI emission at 6830/7088 Å unique to symbiotic stars. When enabled, shows faint red-shifted #FF3030 glow in neutral region. Shader: scattered emission overlay. Unique spectroscopic signature. |
| Nebula | Extended Bipolar Nebula | uBipolarNeb | OFF | Some symbiotics show large (0.1–1 ly) bipolar nebulae from accumulated outflow. When enabled, renders bipolar lobe structure #FF5070 + #8A4070 at large scale. Shader: bipolar lobe geometry. |

#### Jets & Outflows (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Jets | Collimated Jet (R Aqr-type) | uJet | OFF | Some symbiotics produce collimated jets from accretion disk (speed 100–500 km/s). When enabled, renders narrow bipolar jets #4AAFDF from WD position. Length 100–1000 AU. Shader: jet cone geometry. Spectacular in R Aquarii. |
| Jets | Jet Knots & Working Surface | uJetKnots | OFF | Jet interaction with ambient medium creates bright shock knots. When enabled, renders bright #FF8060 bow-shock features along jet. Shader: shock knot overlays. |
| Jets | Precessing Jet (Binary Orbit) | uJetPrecess | OFF | Jet precesses due to binary orbital motion, creating helical pattern. When enabled, renders helical jet path. Shader: time-dependent jet axis. |

#### Outburst Activity (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Outburst | Classical Symbiotic Nova | uSymbioticNova | OFF | Thermonuclear runaway on WD surface (months–years duration, 2–5 mag brightening). When enabled, shows dramatic WD brightening + expanding shell. Shader: nova explosion animation. Rare but important. |
| Outburst | Z And-Type Outburst | uZAndOutburst | ON | Recurrent outbursts (1–3 mag, months duration) from accretion disk instability. Rendered as periodic brightening of WD + accretion region. Period ~2–10 years (scaled). Shader: recurrent brightness enhancement. Characteristic behavior. |
| Outburst | Combination Spectrum | uComboSpectrum | OFF | Simultaneous red (giant) and blue (WD/nebula) spectral features visible. When enabled, applies split-color rendering showing dual nature. Educational visualization. |

#### Orbital Dynamics (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Orbit | Orbital Motion Animation | uOrbitalMotion | ON | Binary orbit period 200–1000+ days. WD orbits giant (or both orbit barycenter). Animated orbital positions. Shader: Keplerian orbital animation. |
| Orbit | Wind Accretion Cone | uWindCone | ON | WD accretes giant's wind via gravitational focusing, creating accretion wake/cone downstream. Rendered as denser #C8A080 region behind WD (relative to wind direction). Shader: Bondi-Hoyle accretion cone geometry. |
| Orbit | Roche Lobe Geometry | uRocheLobe | OFF | Roche lobe boundaries shown as wireframe. Giant may partially fill Roche lobe. Shader: Roche lobe wireframe overlay. |

#### Dust & Circumstellar Material (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Dust | Dust Formation in Cool Wind | uDustFormation | ON | Giant's wind forms dust grains on side away from WD (shielded from UV). Rendered as dusty #6A3A20 obscuration on anti-WD side. Alpha 0.15–0.25. Shader: directional dust formation. Creates asymmetric appearance. |
| Dust | Orbital Phase-Dependent Obscuration | uOrbitalDust | ON | As binary orbits, dust distribution changes viewing geometry, creating orbital-phase-dependent brightness/color changes. Shader: time-dependent extinction based on orbital angle. |
| Dust | Dust Destruction Zone | uDustDestruction | ON | WD's UV radiation destroys dust in its vicinity, creating dust-free cavity. Rendered as cleared region around WD position. Shader: radial clearing around WD. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | System Overview | uCameraMode | ON | Camera at ~5× orbital separation distance, 30° inclination. FOV 55°. Shows both components and ionized nebula. |
| Camera | Accretion Focus | uCameraMode | OFF | Camera positioned near WD, ~2 R_giant distance. FOV 40°. Shows accretion details and ionization boundary. |
| Camera | Jet Context (if active) | uCameraMode | OFF | Camera at ~1000 AU showing full jet extent. FOV 60°. |

---

### 4.16 Protostar (Class 0 / Class I)

**Entity ID:** ENT-1058
**Base Mesh:** Volumetric infalling envelope + bipolar outflow cavity + central compact source (unresolved)
**Shader Type:** Fragment (dusty envelope radiative transfer + outflow cavity scattering + accretion luminosity)
**Exemplar:** L1527 IRS (JWST iconic hourglass), HH 212, B335 (Class 0); HL Tau (late Class I/II transition)

Protostars are the earliest observable stage of star formation — deeply embedded in their natal molecular cloud core, accreting mass through an infalling envelope at rates of 10⁻⁶–10⁻⁴ M☉/yr. Class 0 objects have envelope mass exceeding central protostar mass; Class I have accreted most mass but retain significant envelopes. They are invisible at optical wavelengths (A_V > 50–100 mag) and only detectable in infrared and submillimeter. JWST's NIRCam image of L1527 revealed the spectacular hourglass-shaped bipolar cavities illuminated by scattered light — the defining visual of this entity.

| Section | Feature | Uniform Name | Default | Description |
|---------|---------|-------------|---------|-------------|
| Infalling Envelope | Dense Core Structure | uDenseCore | ON | Collapsing Bonnor-Ebert sphere, R ~ 5000–10000 AU. Density profile: ρ ∝ r⁻¹·⁵ (free-fall) inner, ρ ∝ r⁻² (static) outer. Central density ~10⁷ cm⁻³. Color: dark absorption #1A1008 against background; only visible in silhouette at optical. Temperature: 10K outer → 100K inner. FBM turbulent structure: 4-octave, freq 2.0, amplitude 0.15. |
| Infalling Envelope | Infall Velocity Field | uInfallVelocity | ON | Inside-out collapse: infall wave propagating outward at sound speed ~0.2 km/s. Material within collapse radius in free-fall v_ff = √(2GM/r) ~ 1–3 km/s at 100 AU. Rendered as radially inward-directed streamlines, color Doppler-coded: blue-shifted #4A6ACC (approaching), red-shifted #CC6A4A (receding). Rotation flattens infall into pseudo-disk at ~100–500 AU. |
| Infalling Envelope | Centrifugal Barrier | uCentrifugalBarrier | OFF | Where angular momentum halts radial infall — material piles up at centrifugal radius R_cb ~ 50–200 AU. Creates ring-like density enhancement. Accretion shock at barrier: T jumps to ~1000K. Rendered as bright ring #FFA840 within envelope. ALMA observations of L1527 and IRAS 16293 confirm this structure. Transition zone from envelope to disk. |
| Infalling Envelope | Envelope Opacity Gradient | uEnvelopeOpacity | ON | Massive dust extinction: A_V = 50–500 mag at center. Opacity gradient from τ_IR ~ 0.1 (outer) to τ_IR >> 1 (inner). Visualization: complete darkness at optical wavelengths; mid-IR reveals warm inner regions; submm traces full column density. Color: optical #000000 (opaque) → mid-IR false-color #FF8040 → submm false-color #4080FF. Multi-wavelength toggle essential. |
| Bipolar Cavity | Hourglass Outflow Cavities | uHourglassCavity | ON | THE defining visual: bipolar cavities carved by protostellar outflow into envelope. L1527 JWST archetype. Cavity walls: parabolic, opening angle 20°–60° increasing with age. Cavity interior: low-density (×0.01 of envelope), filled with scattered protostar light. Color: inner cavity #FF8030 (warm scattered), outer #4A7ACC (blue scattered). FBM structure on walls: 5-octave, freq 8.0, amplitude 0.12. |
| Bipolar Cavity | Cavity Wall Illumination | uCavityWallLight | ON | Scattered light from central protostar bouncing off cavity walls — this creates the JWST hourglass image. Color temperature gradient: warm #FFB860 near protostar → cool #6A90CC at cavity tips. Scattering efficiency depends on grain size: small grains → blue, large grains → red. L1527 shows orange-blue color gradient from grain growth. |
| Bipolar Cavity | Molecular Outflow | uMolecularOutflow | ON | CO molecular outflow: wide-angle (30°–90°), velocity 5–50 km/s. Traced by CO J=2-1 emission. Mass: 0.01–1 M☉ of swept-up envelope material. Rendered as expanding lobes #40A878 (false-color) within cavity, broader and slower than jet. Momentum: enough to unbind portions of envelope. Dynamical age: 10³–10⁴ yr. ALMA mapping reveals complex velocity structure. |
| Bipolar Cavity | Protostellar Jet (Atomic) | uProtostellarJet | ON | Highly collimated atomic/ionic jet: opening angle < 5°, velocity 100–500 km/s. Traced by [Fe II], [S II], Hα. Color: #4A8AFF (shock-ionized blue). Width: 10–50 AU. Knots: internal working surfaces from velocity variability, spacing ~100–500 AU. Terminal: Herbig-Haro bow shock #FF5060. HH 212 shows spectacular symmetric jet+knots in ALMA SiO. |
| Central Source | Protostar Photosphere | uProtostarCore | ON | Heavily accreting protostar: R ~ 3–5 R☉ (bloated by accretion), T_eff ~ 3000–5000K, L ~ 1–10 L☉ (mostly accretion luminosity L_acc = GM★Ṁ/R★). NOT directly visible — completely embedded. Rendered as unresolved point source #FFA030 seen only through scattered light in cavities. SED peaks at ~100 μm (reprocessed by dust). First Larson core → protostar transition. |
| Central Source | Accretion Disk (Embedded) | uEmbeddedDisk | ON | Keplerian disk forming within centrifugal barrier: R ~ 10–200 AU (smaller than T Tauri disks, still growing). Disk mass: 0.01–0.1 M☉. Disk feeds protostar through magnetospheric accretion. Rendered as dark midplane silhouette #0A0A08 bisecting hourglass cavities (edge-on) or warm glow #FF9050 (face-on). HL Tau ALMA image shows rings even at this early stage. |
| Central Source | Accretion Burst Events | uAccretionBurst | OFF | FU Orionis-type accretion outbursts: luminosity surges ×10–100 lasting decades. Accretion rate: 10⁻⁶ → 10⁻⁴ M☉/yr during burst. Triggered by gravitational instability or MRI in disk. Burst heats envelope dust, pushing sublimation radius outward. Rendered as dramatic brightening of central source + expanding warm front through envelope. V883 Ori, FU Ori archetypes. |
| Dust Properties | Grain Growth Indicators | uGrainGrowth | OFF | Dust grains growing from ISM 0.1 μm to >10 μm in dense regions. Evidence: spectral index β decreasing from 1.7 (ISM) to < 1.0 (disk). Visualization: inner regions rendered with redder scattering (large grains, color #E8A060) vs. outer with bluer scattering (small grains, #7090CC). ALMA continuum spectral index mapping confirms grain growth in envelopes. |
| Dust Properties | Ice Mantle Features | uIceMantles | OFF | Dust grains coated with volatile ices: H₂O (3 μm), CO₂ (4.27 μm), CO (4.67 μm), CH₃OH (3.53 μm). JWST-detected in absorption against protostar continuum. Rendered as absorption band indicators: ice zones #C8E8FF (cold outer envelope T < 20K) where CO frozen, vs. sublimation lines at characteristic temperatures. Snowlines: H₂O at ~150K, CO at ~20K. |
| Dust Properties | Submillimeter Continuum | uSubmmContinuum | ON | Thermal dust emission at 850 μm–1.3 mm traces total mass (optically thin). Peak flux: 0.1–10 Jy at 140 pc. Extended emission: envelope dominates on 1000–10000 AU scales. Compact component: disk dominates on < 100 AU. False-color: #5070B0 (submm/ALMA blue). ALMA/NOEMA/SMA primary observing mode for protostars. |
| Classification | Class 0 / Class I Toggle | uProtostarClass | Class 0 | Class 0: T_bol < 70K, L_submm/L_bol > 0.5%, envelope >> disk mass. Class I: T_bol 70–650K, L_submm/L_bol < 0.5%, most mass in star. Visual difference: Class 0 — larger envelope, narrower cavity, more embedded. Class I — thinner envelope, wider cavity, central source sometimes glimpsed in near-IR. Toggle switches morphology parameters simultaneously. |
| Classification | Bolometric Temperature Display | uTbolDisplay | OFF | T_bol = temperature of blackbody with same flux-weighted mean frequency as protostar SED. Class 0: 15–70K. Class I: 70–650K. Class II (T Tauri): 650–2880K. Displayed as overlay with SED shape. Lower T_bol = more embedded = younger. Diagnostic of evolutionary state independent of geometry. |
| Magnetic Field | Hourglass B-field | uHourglassBField | OFF | Magnetic field pinched into hourglass shape by gravitational collapse. Field strength: 0.1–1 mG at 1000 AU scale. Traced by polarized dust emission (ALMA polarization). Rendered as field lines: initial uniform → pinched hourglass morphology. Color: #8A8AFF, line density proportional to B. B-field partially supports envelope against collapse (ambipolar diffusion timescale ~10⁵ yr). |
| Magnetic Field | Pseudo-disk | uPseudoDisk | OFF | Flattened structure perpendicular to B-field (NOT a Keplerian disk): material slides along field lines, accumulates in midplane. Scale: 500–2000 AU. Density enhancement: ×3–10 over spherical. Rendered as oblate flattened envelope #4A3A20, opacity 0.2. Distinguished from true disk by non-Keplerian rotation. Transition from pseudo-disk to Keplerian disk at ~100 AU. |
| Environment | Natal Cloud Core Context | uCloudCore | ON | Surrounding molecular cloud core: R ~ 0.05–0.1 pc, M ~ 1–10 M☉, T ~ 10K. Traced by N₂H⁺, NH₃ line emission. Color: dark #0A0A08 with subtle submm glow #2A3040. Protostar positioned at density peak. Core may fragment → binary/multiple protostar formation. Core boundary: transition to lower-density ambient cloud. |
| Environment | Companion Protostar | uCompanionProto | OFF | >50% of protostars form in binary/multiple systems. Companion separation: 50–5000 AU. Renders second protostar with own outflow cavity (possibly misaligned). Circumbinary structures: shared envelope, circumbinary disk. Interaction: outflow cavities may overlap or create complex morphology. L1448 IRS3B shows triple protostar system. |
| Temporal | Envelope Dissipation | uEnvelopeDissipation | OFF | Time evolution: envelope dispersed by outflow + accretion over ~10⁵ yr. Class 0 → Class I → Class II transition animated. Cavity opening angle increases: 20° → 90° → fully dispersed. Envelope mass decreases exponentially. Central source becomes increasingly visible. Star emerges from cocoon → T Tauri phase. |
| Camera | Standard View | uCameraMode | ON | Default: hourglass cavities filling frame (L1527 JWST perspective). NIR false-color rendering. Scale bar: 1000 AU. Central dark lane (disk) bisecting hourglass. Color: warm scattered #FFB060 blending to blue #6A90CC at cavity edges. Background: dark molecular cloud. Distance: typical 140 pc (Taurus). |
| Camera | Submm/ALMA View | uCameraMode | OFF | ALMA continuum view: thermal dust emission rendering. Compact disk + extended envelope visible as concentric contours. False-color #5070B0. Outflow traced by CO emission overlaid in red/blue Doppler. Scale bar: 100 AU for disk detail. Demonstrates complementary information from different wavelengths. |
| Camera | Time Speed Multiplier | uTimeSpeed | 10⁴ yr/s | At default: Class 0 → I transition (~10⁵ yr) plays over ~10 seconds. Outflow jet knots propagate visibly. Accretion burst events visible as brief flashes. Slow to 10² yr/s for detailed jet dynamics, accretion variability. Envelope dissipation over 10⁵ yr → ~10 seconds at default speed. |

---

## 5. Rocky Planets

Rocky (terrestrial) planets have solid surfaces with a variety of compositions, atmospheres, and geological histories. Mercury is airless and heavily cratered; Venus is shrouded in dense sulfuric-acid clouds; Mars is a cold dusty desert with seasonal polar caps; Magma Worlds are molten-surfaced young or tidally-locked planets; Ocean Worlds are water-dominated (Hycean) exoplanets.

### Mercury-Type

**Entity ID:** ENT-2010
**Description:** Cratered, airless terrestrial world with heavily bombarded surface (#8C7E6E dominant regolith, #A89888 lighter rays), weak magnetic field, extreme thermal extremes (100–700 K surface swing), and permanent shadows hosting water ice in polar craters. 3:2 spin-orbit resonance creates two "hot poles" facing the sun at perihelion. Real exemplars: Mercury.

**Section Count:** 9 (Surface & Regolith, Crater Fields, Tectonic Scarps, Caloris Basin, Polar Ice Deposits, Exosphere & Sodium Tail, Solar Proximity Effects, Magnetic Field, Camera)
**Total Feature Count:** 28

#### Surface & Regolith (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Surface | Base Regolith | uRegolith | ON | Fine dark gray dust layer (#706860 mean, variation ±0.15 luminance via 5-octave Simplex FBM at freq 18.0). Reflects solar radiation weakly. Covers 95% of surface; regolith grain size ~0.1 mm typical. Shader: multiply base color with FBM modulation for subtle texture. |
| Surface | Ray System | uRaySystem | ON | Radiant ejecta streaks (#A8A098, ~20% brighter than base regolith, still dark on Mercury's low-albedo surface) extending 200–800 km from young impact craters. Generated via distance-field rays from crater centers; ray opacity fades with distance. Represents material disruption ~10 m thick at ray origin. Shader: additive overlay blend past distance threshold. |
| Surface | Space Weathering Darkening | uSpaceWeathering | ON | Cumulative darkening (#6B6660 in heavily bombarded regions) from solar wind implantation and cosmic ray damage over billions of years. Older terrain (>3.5 Gyr) shows ~20% darker albedo than fresh craters. FBM noise at freq 8.0 defines age zones. Shader: interpolate between old/new color based on procedural age map. |
| Surface | Smooth Planar Terrain | uPlainTerrain | OFF | Rare ~10% coverage of ancient lava plains (#7A7368 slightly darker than regolith, smoother normal map). Found in radar-bright regions. Shader: reduced normal perturbation amplitude in designated zones. |

#### Crater Fields (5 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Craters | Impact Crater Distribution | uCraters | ON | Multi-generational crater population: fresh craters (100 m–500 m, bright rays), intermediate (1–50 km, raised rims), and ancient basins (>100 km). Generated via Worley cellular noise at scales freq 5.0, 14.0, 28.0 with power-law size distribution. Crater density ~1.5 per 10^6 km² (higher than Moon). Rendered via heightmap perturbation on vertex shader. |
| Craters | Peak-Ring Basins | uPeakRingBasins | ON | Large impact structures (diameter 200–800 km) with raised central peak rings, dark mare-like interiors (#5A5A5A), and ejecta blankets. Examples: Caloris Basin (1500 km), Tolstoj. Rendered via multi-layer heightmap: raised rim gaussian, depressed center, central ring peaks. Normal map sharpening emphasizes relief. |
| Craters | Secondary Crater Clusters | uSecondaryCraters | OFF | Smaller craters (100 m–5 km) formed by ballistic ejecta from large impacts. Chain-like patterns radiate from parent crater. Worley noise sub-octave (freq 40.0) generates clustering. Toggle for performance. Shader: tessellation or displacement mapping for fine detail. |
| Craters | Crater Rim Shadows | uCraterShadows | ON | Self-shadow on crater rims and walls cast by sun. Adds 3D depth perception. Normal map perturbation encodes rim facets; shader computes shadow via dot(normal, lightDir). Particularly stark on terminator; contributes 40% of visual depth. |
| Craters | Ejecta Blankets | uEjectaBlankets | ON | Radial rays and rough texture surrounding craters >10 km. Higher albedo (#D5D0C8) than regolith, ~30 km extent. Modeled via distance-based color blend and heightmap roughness increase. Represents pulverized material; fades inward with exponential falloff. |

#### Tectonic Scarps (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Tectonic | Rupes Scarps | uRupesScarp | ON | Linear cliff scarps (height 1–3 km, length 100–1000 km) formed by thrust faulting during planetary contraction. Examples: Discovery Rupes, Beagle Rupes. Rendered as sharp raised ridgelines (#9A9180 sunlit face, #5A5A60 shadowed face) via vertex displacement at specified latitudes/longitudes. Shader: heightmap with extremely sharp gradients; normal map accentuates edge shadows. |
| Tectonic | Ridge Pattern Orientation | uRidgeOrientation | ON | Scarps cluster in certain hemispheres due to thermal contraction directional pattern. Procedural: Voronoi domains assign scarp orientation; edges aligned to domain boundaries. Creates ~30% coverage with anisotropic fractal pattern. |
| Tectonic | Basin Ring Structures | uBasinRings | ON | Concentric rings within large basins (Caloris, Rembrandt). Outer rings (#8C7E6E), inner rings progressively darker. Rendered via radial heightmap concentric gaussians. |

#### Caloris Basin (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Caloris | Basin Central Depression | uCalorisDepression | ON | Giant impact basin 1500 km diameter, ~2 km deep central depression filled with volcanic smooth plains (#7A7268 intermediate-albedo basaltic fill, slightly brighter than average Mercury regolith; #7A7A88 rim walls). Located at longitude ~162°E (MESSENGER coordinates). Rendered via large-scale heightmap depression with procedural color variation in floor (MESSENGER enhanced color shows Caloris plains distinctly tan/lighter than surroundings). Shader: specular highlights reduced in depression (smooth basalt texture). |
| Caloris | Radial Ridge Pattern | uCalorisRidges | ON | Spoke-like ridges radiating from basin center, extending 500 km outward. #8C7E6E slightly raised (100–300 m). Worley-based radial pattern from center point. Represents basin rim deformation. |
| Caloris | Hilly Terrain Antipode | uAntipodalHills | ON | At Caloris antipode, chaotic terrain with jumbled blocks and ridges (#6B6660 darker, highly roughened normal map). Caused by seismic waves focused from impact. ~300 km × 300 km region. Shader: increased normal perturbation frequency and amplitude. |

#### Polar Ice Deposits (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Polar | Permanent Shadow Regions | uPermanentShadow | ON | Radar-bright deposits at poles in permanently shadowed craters (temperatures <100 K in permanent shadow). Rendered as no-light zones; internal glow (#5F6E8C faint blue, 0.1 intensity) represents water ice detected by MESSENGER radar/neutron spectrometer. Coverage: ~10,000+ km² total across both poles (MESSENGER MLA terrain models). Shader: disable lighting in shadow region; add subtle emissive glow to indicate ice. |
| Polar | Water Ice Deposits | uWaterIce | ON | Actual H₂O ice (#E8F4FF bright blue-white, 0.85 albedo) in shadowed craters. Layer thickness 100 m–2 km modeled via height displacement. Animation: none (permanently frozen). Shader: mix blue-tinted color with high specularity. |
| Polar | Crater Subsurface Coldness Indicator | uCraterColdZones | OFF | Speculative visualization: craters >5 km diameter near poles show slightly higher blue tint (#7A8FAE) indicating cooler regolith. Depth of indicator increases with crater depth. Shader: add blue channel boost in shadow regions. |

#### Exosphere & Sodium Tail (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Exosphere | Sodium Emission | uSodiumTail | ON | Faint sodium D-line glow (#FFD700 golden-orange, 0.3 intensity halo) extending >100 planet radii antisolar (MESSENGER observations). Generated via ray-marching billboards or volumetric shader. Solar wind sputters sodium from surface; resonant scattering by sunlight creates visible tail. Updatable every frame to point antisolar. Shader: volumetric fog pass with high-frequency noise for structure. |
| Exosphere | Hydrogen Corona | uHydrogenCorona | OFF | Larger, fainter hydrogen/oxygen exosphere (~2 Rp extent). Procedural thermal escape. (#C0D8FF pale cyan, 0.15 intensity). Shader: low-frequency volumetric scatter. |
| Exosphere | Dayglow Brightening | uDayglowEffect | OFF | Localized brightening at subsolar point from atmospheric heating (though negligible atmosphere). Subtle rim glow #FFFFDD at 0.05 intensity. Shader: additive bloom pass on subsolar region. |

#### Solar Proximity Effects (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Solar | Subsolar Heating Glow | uSubsolarGlow | ON | Hottest region facing sun during close approach reaches ~700 K; modeled as localized #FF6B35 (bright orange-red) brightening and slight emissive glow (0.2 intensity) within ~30° of subsolar point. Intensity tied to 3:2 resonance orbital position (strongest at perihelion). Shader: radial glow around subsolar vector, intensity modulated by sin(orbital_phase). |
| Solar | Night-Side Cooling Indicator | uNightSideCold | ON | Anti-solar hemisphere rendered darker (#5A5A5C, 0.7 intensity reduction) to reflect extreme cold (~100 K). Sharp terminator edge. Shader: Fresnel-based rim darkening; abrupt falloff across terminator. |

#### Magnetic Field (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Magnetic | Dipole Field Lines | uMagFieldLines | OFF | Weak residual magnetic field (~1% Earth strength) rendered as faint blue field lines (#4A7FB5, 0.25 opacity) looping from poles. Dipole orientation tilted ~11° from spin axis. Modeled via line-rendering or volumetric field visualization. Shader: additive line rendering with Fresnel fade. |
| Magnetic | Magnetotail Region | uMagnetotail | OFF | Solar-wind-compressed magnetotail extends ~10 Rp antisolar. Faint blue glow (#5A7FBF, 0.2 intensity) in magnetotail region. Shader: volumetric fog shaped by external magnetic pressure direction. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Light Direction | uLightDir | AUTO | Distant star; auto-orbit reveals terminator shadows and craters' 3D depth. Tuned to show Caloris Basin and antipodal chaotic terrain on opposite hemispheres. |
| Camera | Time Speed Multiplier | uTimeSpeed | 30x | 1 real second = 1 Mercury minute (~2.4 seconds true anomaly). Full 3:2 resonance period (~176 Earth days) completes in ~5 real minutes. Subsolar heating glow intensity modulates smoothly with phase. |
| Camera | Auto-Rotate | uAutoRotate | ON | Reveals crater distribution, Caloris Basin, tectonic scarps, and thermal gradient from subsolar to night-side. |

---

### Venus-Type

**Entity ID:** ENT-2011
**Description:** Hellish high-pressure (#FFE5A3 sulfuric acid cloud deck at 55 km altitude), retrograde-rotating world with surface temperatures ~464°C (#D4A857 thick cloud tops masking surface), 90-bar atmosphere, and episodic volcanic activity. Super-rotating winds exceed 100 m/s. Greenhouse runaway from CO₂ and H₂SO₄ clouds. Real exemplars: Venus.

**Section Count:** 9 (Cloud Deck Morphology, Atmospheric Circulation, Sulfuric Acid Haze Layers, Volcanic Surface (speculative), Lightning Phenomena, Polar Vortex, Exosphere & Escape, Thermal Infrared Signature, Camera)
**Total Feature Count:** 26

#### Cloud Deck Morphology (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Clouds | Dense Cloud Top Layer | uCloudDeck | ON | Opaque upper cloud layer (#FFE5A3 light sulfur yellow, 0.95 opacity) at 55–70 km altitude. Generated via 6-octave Simplex FBM (freq 16.0) with curl-noise advection for rolling cloud streaks. Cloud top coverage 99.9%; only rare breaks visible. Rendered as volumetric fog sphere at high density. Shader: volumetric raymarching with Mie scattering approximation; high extinction coefficient. |
| Clouds | Equatorial Cloud Streaks | uEquatorialStreaks | ON | Brighter (#FFF8DC pale, 0.98 opacity) band of zonal cloud streaks aligned equator-to-pole at equator. Super-rotating winds (100 m/s) advect particles; visible as sinuous stripes with ~1 day period visible motion. Modeled via 2D cloud texture advection in polar coordinates. Shader: advect UV coordinates by wind velocity each frame. |
| Clouds | Polar Vortex Cloud Structure | uPolarVortex | ON | Distinctive swirling dipole vortex at poles (especially south), rotating anticyclonically. Spiral arm structure (#FFE5A3 center, #D4A857 darker outer), ~2,000–3,000 km diameter (far less than full planetary radius). Rendered via procedural spiral FBM centered at pole. Shader: two-layer spiral pattern with rotation animation. |
| Clouds | Hemispherical Asymmetry | uCloudAsymmetry | OFF | Subtle brightness variation (~3% albedo) between hemispheres; linked to atmospheric dynamics or rotation phase. Slight dimming on trailing hemisphere. Shader: hemispherical color modulation factor. |

#### Atmospheric Circulation (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Atmosphere | Hadley Cell Circulation | uHadleyCell | ON | Large-scale tropical circulation (subsolar -> poles aloft, return surface flow). Rendered as subtle haze gradient (#F0DFA0 brighter subsolar, #D4A857 darker limb). FBM cellular pattern at freq 12.0 models convective structure. Shader: mix cloud colors based on latitude-dependent Hadley cell function. |
| Atmosphere | Super-Rotation Bands | uSuperRotation | ON | Zonal (east-west) wind structure visible as distinct cloud bands moving retrograde (west) with period ~4 Earth days. Generated via time-dependent sinusoidal latitude function modulating cloud brightness. Each frame, add wind advection offset to cloud UVs. Shader: advect texture coordinates by (time * windSpeed). |
| Atmosphere | Vertical Wind Shear | uWindShear | OFF | Layered wind shear from surface (~0.3 m/s, slow retrograde) to cloud tops (100 m/s prograde relative to rotation). Modeled via color intensity gradient on cloud texture: darker (#D4A857) at lower levels, brighter (#FFF8DC) aloft. Shader: scale color brightness with (1.0 - altitude_normalized). |
| Atmosphere | Thermal Tides | uThermalTides | OFF | Day-night thermal tide waves propagating around planet with ~8-12 hour period. Subtle brightness undulation. Procedural: sin(latitude - time * wave_freq) modulation. Shader: add brightness oscillation based on local time. |

#### Sulfuric Acid Haze Layers (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Haze | Intermediate Haze Layer | uHazeLayer | ON | Suspended aerosol layer (45–70 km altitude) of sulfuric acid droplets (#F5E6D3 tan-yellow, density decreasing with altitude). Modeled as thick volumetric fog shell at 0.7 optical depth. FBM noise (freq 20.0, 5 octaves) creates layered structure. Shader: volumetric raymarching with exponential density falloff with altitude. |
| Haze | Radiative Opacity | uRadiativeOpacity | ON | Sulfuric acid clouds absorb & scatter solar radiation; no surface visible (always opaque). Albedo 0.76 (high reflectivity). Rendered as no-pass-through for any subsurface detail. Shader: fragment discard past cloud density threshold. |
| Haze | Aerosol Settling Gradient | uAerosolGradient | OFF | Fine particles settle slowly; upper haze (#FFF8DC) slightly brighter than middle (#F0DFA0) due to smaller particle size scattering more blue. Opacity gradient. Shader: interpolate haze color based on altitude sampled inside volumetric raymarch. |

#### Volcanic Surface (speculative, 3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Surface | Crustal Basalt Texture | uBasaltSurface | OFF | Speculative surface visible if clouds toggle off: dark basalt (#3A3A2C, rough texture), mafic composition, ~430 km³ lava volume estimated. Wrinkle ridges indicate tectonic stress. Shader: render below cloud deck; combine heightmap ridges with Worley-noise crater distribution. |
| Surface | Pancake Domes | uPancakeDomes | OFF | Low-profile volcanic features (20–65 km diameter, <1 km relief). #5A5A48 slightly raised domes from high-viscosity lava. Gaussian heightmap bumps. Shader: additive height displacement with smoothstep edge blending. |
| Surface | Rift Zones & Tessera | uTessera | OFF | Heavily deformed crustal blocks (tessera terrain) #4A4A3C at ~8% coverage (concentrated in equatorial highlands). Chaotic ridge patterns via multi-scale Worley noise. Toggle for performance / speculative toggle. |

#### Lightning Phenomena (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Lightning | Electrical Discharge Flashes | uLightningFlashes | ON | Episodic bright flashes (#FFFFFF white, 0.8–1.0 intensity) deep within clouds; brightness spike lasts 0.1–0.3 s, repeats ~every 0.5–2 s (random). Flash location randomized across surface. Modeled via procedural Poisson events with brightness keyframe animation. Shader: additive emissive pass; use step function for instantaneous flash. |
| Lightning | Lightning Glow Halo | uLightningGlow | ON | Soft glow (#FFF8DC pale yellow, 0.4 intensity, 30 km radius) surrounding each lightning flash. Gaussian blur pass. Shader: separate bloom pass; apply Gaussian blur with fixed kernel radius. |
| Lightning | Nightside Illumination | uNightsideFlash | ON | Lightning flashes on night-side (terminator) illuminate clouds internally; faint brightening (#FFE5A3, 0.2 intensity) visible on nightside. Contributes to observable glow. Shader: extend flash glow past terminator via volumetric scatter. |

#### Polar Vortex (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Polar | South Polar Dipole Structure | uSouthDipole | ON | Two-lobed anticyclonic vortex south pole; distinct "top" and "bottom" lobe visible as spiral brightness pattern (#FFE5A3 center lobes, #D4A857 outer). Periodic oscillations. Rendered as procedural radial spiral FBM centered south pole, animated rotation. Shader: spiral pattern via atan2 angle function; rotate by (time * angular_velocity). |
| Polar | Oscillating Dipole Orientation | uDipoleOscillation | OFF | South dipole structure wobbles/precesses with ~4-year oscillation period (in scaled time). Orientation angle oscillates ±45°. Shader: add sinusoidal term to spiral center offset: offset_angle = sin(time * precession_freq). |

#### Exosphere & Escape (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Exosphere | Hydrogen Escape Tail | uHydrogenTail | OFF | Faint hydrogen/oxygen dissociation products escape into space; long tail antisolar (~3 Rp extent). #7AC4E8 pale cyan, 0.15 opacity. Water photodissociation from ancient oceans; trace amounts remain. Shader: volumetric fog extending antisolar; fade with distance. |
| Exosphere | Limb Brightening | uLimbBrighten | ON | Rayleigh scattering at limb creates bright rim (#FFF8DC, 0.6 intensity, ~0.5 Rp width) around planetary disk. Fresnel-based: brighter at grazing incidence. Shader: rim light via (1.0 - dot(normal, view_direction)) * intensity. |

#### Thermal Infrared Signature (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Thermal | Subsolar Brightening | uSubsolarBright | ON | Subsolar point slightly brighter (#FFFACD brighter yellow, +0.05 intensity) due to direct sun heating of clouds. ~40° cone around subsolar point. Shader: multiply base cloud color by (1.0 + brightness_boost * dot(normal, lightDir)). |
| Thermal | Nightside Thermal Glow | uNightsideGlow | OFF | Speculative infrared thermal radiation from surface (~464°C) faintly visible on nightside as very faint #FF8C42 orange glow (0.05 intensity). Requires thermal camera mode. Shader: add emissive color to nightside fragment based on surface temperature parameter. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Light Direction | uLightDir | AUTO | Distant star; auto-orbit reveals retrograde cloud motion and polar vortex structure dynamically. |
| Camera | Time Speed Multiplier | uTimeSpeed | 60x | 1 real second = 1 Venus minute (~2.4 seconds true). Super-rotation 4-day period visible in ~4 real seconds. Lightning flashes occur every 0.5–2 real seconds. |
| Camera | Auto-Rotate | uAutoRotate | ON | Shows equatorial cloud streaks, polar vortex circulation, and lightning flash activity across surface. |

---

### Mars-Type

**Entity ID:** ENT-2013
**Description:** Cold desert world (#C14A1D iron-oxide regolith with darker basalt #8B3A1A and lighter dust #E08F5A), thin CO₂ atmosphere (~0.6% Earth pressure, 6 mbar), seasonal polar caps, episodic planet-wide dust storms, and ancient fluvial networks. No global magnetic field. Real exemplars: Mars.

**Section Count:** 9 (Surface Geology, Volcanic & Tectonic, Polar & Cryosphere, Dust & Aeolian, Ancient Water & Astrobiology, Atmosphere & Weather, Past Magnetic Field (fossil), Human Presence speculative, Camera)
**Total Feature Count:** 29

#### Surface Geology (5 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Surface | Base Regolith Color | uRegolith | ON | Iron-oxide red dust layer (#C14A1D average, FBM modulation between #8B3A1A darker basalt exposures and #E08F5A bright dust). 4-octave Simplex FBM at freq 12.0 generates subtle color variation. Covers 85% of surface as foundation. Shader: multiply base by FBM for subtle patchy weathering. |
| Surface | Crater Distribution | uCraters | ON | Multi-scale impact craters (100 m–2000 km). Worley cellular noise at freq 3.0, 8.0, 20.0 with raised rim (#A84020), dark basin floor (#6B2A15), and ejecta rays (#D86F40). Crater density ~400 per 10^6 km². Generated via heightmap perturbation on vertex shader with normal map sharpening. |
| Surface | Valles Marineris Canyon | uVallesMarineris | ON | Giant 4000 km east-west canyon system, 7 km deep. Floor #3F1810 (dark), walls #C14A1D (red). Spans latitudes ±10°, centered ~280°E longitude. Rendered via large-scale depression heightmap with sharp wall normal maps. Shader: heightmap-based vertex displacement; normal perturbation for cliff facets. |
| Surface | Olympus Mons Shield Volcano | uOlympusMons | ON | Largest volcano in solar system: 22 km tall, 600 km base diameter. #A84020 gentle slopes, #6B2A15 summit caldera. Positioned longitude 227°E, latitude 18°N. Smooth conical gaussian rise via vertex shader. Shader: radial gaussian height displacement; subtle radial flow streaks. |
| Surface | Hemispheric Dichotomy | uDichotomy | ON | North-south elevation split: northern lowlands (#D45F30, smoother, ~5 km below mean), southern highlands (#9A3512, heavily cratered, ~3 km above mean). Sharp boundary ~0°N–30°N. Visible as 0.3 unit luminance shift. Shader: hemispheric color interpolation; discontinuity at boundary. |

#### Volcanic & Tectonic (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Volcanic | Tharsis Bulge | uTharsis | ON | Massive volcanic plateau ~4000 km wide, 10 km high, containing three shield volcanoes. Centered ~250°W. Color #B04010 with lighter lava flow streaks #D96E40 radiating downslope. Rendered as broad gaussian uplift with radial streaks via texture overlay. Shader: additive lava-flow texture with distance-field fade. |
| Volcanic | Ancient Lava Plains | uLavaPlains | OFF | Smooth basaltic regions (#5B2A18, darker than regolith) from volcanism >3 Gyr ago. Located at Hellas, Utopia, Isidis basins. FBM modulated boundary softening. Shader: interpolate between plain and regolith color in designated zones. |
| Volcanic | Fissure Vent Lineaments | uFissureVents | OFF | Elongated volcanic rifts; linear bright lines (#C8461E) 100–500 km long along tectonic stress zones. Worley-based alignment to fractal domains. Shader: additive bright line rendering. |
| Volcanic | Wrinkle Ridge Network | uWrinkleRidges | OFF | Thrust ridges in ancient lava plains; subtle raised linear features (#8B6A47, raised 100–500 m). Network pattern via multi-scale FBM; oriented NW-SE. Shader: anisotropic normal perturbation; heightmap ridges with smoothstep blend. |

#### Polar & Cryosphere (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Polar | North Polar Cap | uNorthPolarCap | ON | Seasonal/perennial CO₂ and H₂O ice cap, ~1000 km diameter. Color #F5F0D8 white (CO₂ dominant ~75%, H₂O ~25%). Layered terrain visible as concentric ridges. Modeled via heightmap bulge at north pole (~3 km thick), with sinuous ridge texture (freq 8.0 FBM). Shader: ice-white color blend; specular highlights enhanced for ice. |
| Polar | South Polar Cap | uSouthPolarCap | ON | Permanent residual CO₂/H₂O ice cap ~400 km diameter. Slightly darker #FFF0D0 (more dust-covered than north). Seasonal sublimation pattern visible as surrounding frosted zones. Heightmap ~2 km elevation. Shader: layered terrain via concentric ridge texture overlay. |
| Polar | Permanent Frost Deposits | uPermanentFrost | ON | Perennial frozen ground in craters and depressions at latitudes >40°. Slight blue-white tint #F0F5FF over base regolith. FBM (freq 15.0) determines frost coverage. Shader: conditional color blend in high-latitude regions. |
| Polar | Seasonal Frost Sublimation | uSeasonalSublimation | ON | Seasonal CO₂ frost cycle; northern cap shrinks/expands every ~687 Earth days (1 Mars year). Animated cap size oscillation and surrounding "frosted ring" (#FFFACD pale yellow-white, 0.3 opacity, ~30 km extent). Shader: lerp cap radius based on sin(time / mars_year_seconds). |

#### Dust & Aeolian (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Dust | Dust Storm Activity | uDustStorms | ON | Episodic planet-wide or regional dust storms; wind-blown dust raises albedo in active zones. Dust opacity (#E8C480, opacity 0.2–0.4, ~2–5 km altitude) drifts slowly (~0.05 rad/s rotation). Modeled via time-dependent FBM (freq 10.0, 3 octaves) for swirling patterns. Shader: additive fog layer; animate UV scroll via time. |
| Dust | Dust Devil Plumes | uDustDevils | OFF | Small swirling vortex dust devils (50–100 m diameter, 1–2 km tall) appearing randomly. Bright tan spiral #E8C480 at 0.6 intensity, Gaussian halo. Procedural Poisson distribution; each devil has 1–3 minute lifetime. Shader: additive spiral billboard; fade in/out over lifetime via alpha keyframes. |
| Dust | Dust Deposition Streaks | uDustStreaks | ON | Downwind dust streaks extending from obstacles (craters, mountains) at ~30–200 km length. Lighter color #E8D5B0 (20% brighter than base). Oriented NW (dominant wind direction). FBM with directional bias. Shader: directional color modulation via spatial gradient. |
| Dust | Diurnal Dust Opacity Cycle | uDiurnalDustOpacity | OFF | Dust concentration peaks in afternoon local time (thermal circulation). Opacity oscillates ±0.1 (0.1–0.3 base, 0.2–0.4 afternoon) with 24.6 hour period. Shader: modulate dust layer opacity by sin((time + longitude) * diurnal_freq). |

#### Ancient Water & Astrobiology (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Astro | River Delta Networks | uRiverDeltas | OFF | Speculative visible remnants of ancient fluvial erosion: branching delta patterns (#8B7355 brown-tinted regolith) in basin floors (Jezero, Valles Marineris tributaries). Depth 50–200 m. FBM multi-scale branching network. Shader: darker color blend in channel regions; heightmap depression with tributary branching. |
| Astro | Possible Subsurface Water Indicator | uSubsurfaceWater | OFF | Speculative glow (#7AC4E8 pale blue, 0.1 intensity) in certain craters and depressions indicating subsurface ice or aquifer proximity. Detected via radar/neutron data analog. Shader: emissive color in designated zones. |
| Astro | Ancient Lake Beds | uAncientLakes | OFF | Flat, smooth basin floors (#9A8A7A tan-gray) in Hellas, Isidis, Argyre indicating former standing water. Smooth terrain, minimal craters (relatively young). Shader: color blend; lowered normal perturbation amplitude for smooth appearance. |

#### Atmosphere & Weather (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Atmosphere | Thin Atmosphere Haze | uAtmosphereHaze | ON | Faint tan haze (#D4A875, opacity 0.05) near limb and at terminator, scattering sunlight. Rendered as volumetric fog sphere at low density. Altitude ~30 km. Shader: volumetric raymarching with low extinction; Rayleigh scattering approximation. |
| Atmosphere | CO₂ Cloud Formation (polar) | uCO2Clouds | OFF | Rare CO₂ clouds forming near polar caps in winter; bright white patches (#FFFACD, 0.3 opacity, 5–20 km altitude). Procedural wisp pattern. Shader: additive cloud rendering at polar regions; low-frequency noise. |

#### Past Magnetic Field (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Magnetic | Fossil Magnetic Anomalies | uFossilAnomalies | OFF | Crustal magnetic anomalies (southern highlands show remanent magnetization). Rendered as subtle purple-tinted regions (#8B7FB5, 0.1 intensity overlay) in anomaly zones. Represents ancient dynamo field. Shader: conditional color overlay in high-latitude southern regions. |
| Magnetic | Crustal Magnetization Stripes | uMagnetizationStripes | OFF | Linear magnetic stripe patterns visible in southern highlands; alternating slightly brighter/darker regions (#D4C4A8 vs #A88A78) indicating sequential volcanic emplacement. Striped pattern via procedural sawtooth function. |

#### Human Presence (speculative, 2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Human | Settlement Sites (speculative future) | uSettlements | OFF | Speculative rendition of human bases (Curiosity, Perseverance rover sites, future human habs). Small bright pinpoints (#FFFFFF white, 0.5 intensity, ~5–10 km extent) at Gale, Jezero, Olympus Mons regions. Fixed world coordinates. Shader: additive point-light billboards. |
| Human | Solar Panel Arrays | uSolarPanels | OFF | Speculative bright reflective patches (#87CEEB blue-white, 0.6 intensity) representing massive solar farms. Small rectangular patches ~5–50 km. Shader: additive specular highlights at fixed locations. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Light Direction | uLightDir | AUTO | Distant star; auto-orbit reveals hemispheric dichotomy, Olympus Mons, Valles Marineris, and polar caps on rotation. |
| Camera | Time Speed Multiplier | uTimeSpeed | 50x | 1 real second = 1 Mars minute (~2.45 seconds true). Full sol (24h 39m) in ~25 real seconds. Dust storms evolve visibly; seasonal frost oscillation over ~687 sols in ~15 real minutes. |
| Camera | Auto-Rotate | uAutoRotate | ON | Full rotation reveals northern & southern dichotomy, major volcanic features, canyons, and polar regions. |

---

### Magma World (Lava)

**Entity ID:** ENT-2014
**Description:** Young, tidally-heated terrestrial exoplanet with exposed molten magma ocean surface (#FF3B00 bright magma, #1A0806 cooling crust), ultra-thin silicate vapor atmosphere, extreme day-side/night-side thermal contrast (2500+ K lit, <500 K dark side), rapid rotation (tidal locking tendency for M-dwarf orbits). Real exemplars: CoRoT-7b, 55 Cancri e, K2-10b.

**Section Count:** 8 (Molten Surface, Lava Seas & Flow, Crust Solidification, Tidal Flexing, Silicate Vapor Atmosphere, Thermal Contrast, Magnetic Field (speculative), Camera)
**Total Feature Count:** 23

#### Molten Surface (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Surface | Active Magma Ocean | uMagmaOcean | ON | Bright glowing magma (#FF3B00 dominant, #FF4400 brighter active zones, #1A0806 darkened cooling regions). Surface coverage ~85–95% active molten silicate/basalt. Animated lava flow via time-dependent FBM (freq 14.0, 4 octaves) with curl-noise advection. Temperature gradient encoded as brightness; hottest zones 2500 K (#FF4400), cooling edges 1500 K (#D94400). Shader: mix bright magma color with darker cooling color based on procedural heat map; emissive pass for glow. |
| Surface | Solidification Patterns | uSolidificationCrust | ON | Cooling lava crust forms floating plates (#3A2A1A dark brown-black, rough surface). Crust growth radial from cooling centers; Worley noise (freq 6.0) determines crack pattern. Plate size 10–100 km. Surface velocity ~0.1–1.0 m/s inward drift. Shader: dark color blend in crust zones; normal map roughness increase. |
| Surface | Magma Brightness Glow | uMagmaGlow | ON | High-temperature magma emits thermal radiation; bright zones (#FF3B00, emissive intensity 0.8) contribute to overall brightness and bloom. Shader: additive emissive pass on magma zones; bloom post-process for extreme brightness. |
| Surface | Thermal Stress Fractures | uStressFractures | ON | Linear cracks radiating from cooling centers, filled with brighter lava (#FF4400 exposed). FBM (freq 20.0) with directional bias. Line width 100–500 m. Shader: thin bright lines via distance-field rendering or texture-based crack overlay. |

#### Lava Seas & Flow (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Lava | Lava Flow Streams | uLavaFlows | ON | Large-scale lava rivers flowing from hot spots toward cooler regions, following gravity/pressure gradients. Flow direction animated via curl-noise velocity field. Color gradient: bright #FF4400 (flow center, hottest) to darker #B82A00 (flow edges). Width 10–50 km, length 100–500 km. Shader: directional color modulation; additive glow along flow centerline. |
| Lava | Convection Cells | uConvectionCells | ON | Large-scale fluid convection cells in molten interior; visible at surface as circulation patterns. Rendered as Bénard-cell structure via Voronoi diagram (freq 4.0) with circular boundary, bright center (#FF4400) cooling at edges (#8B2A00). Diameter 100–500 km. Shader: radial color gradient from cell center. |
| Lava | Sublimated Rock Vapor Plumes | uMagmaPlumes | OFF | Rising plumes of sublimated silicate vapor above hottest zones; whitish glow (#FFE5C4 very pale, 0.4 opacity) 1–2 Rp height. Procedural Poisson-distributed columns. Shader: volumetric plume rendering; additive transparency. |

#### Crust Solidification (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Crust | Floating Crustal Plates | uFloatingPlates | ON | Solid basaltic plates floating atop magma (#2A1A0A dark, surface smooth), slowly drifting. Plate boundaries marked by ridge lines (#FF3B00 glowing gap lines, 100 m wide). Plates collide, stack (ridge-building). Size distribution: 50–500 km diameter. Modeled via Voronoi domain plates with time-dependent drift velocity. Shader: plate color darker than magma; bright line rendering for ridge gaps. |
| Crust | Plate Collision Zones | uPlateCollisions | ON | Where plates collide, darker thicker crust forms (#1A0808 very dark) with raised ridge structures. Ridge height 100–1000 m. Generated via procedural collision detection at Voronoi domain boundaries with height displacement. Shader: additive height map at collision boundaries; darker color blend. |
| Crust | Cooling Crystal Patterns | uCrystalPatterns | OFF | As crust cools, crystalline structures form; dendritic or columnar patterns visible (#4A3A2A brown-gray). FBM (freq 25.0) with fractal dimension control. Shader: high-frequency normal perturbation for texture. |

#### Tidal Flexing (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Tidal | Tidal Bulge Deformation | uTidalBulge | ON | Exoplanet's sub-stellar point experiences tidal bulge; surface rises ~1–10 km at subsolar point. Modeled via spherical harmonic bulge (L=2 mode) at sub-stellar longitude. Rendered as elongated bulge via vertex displacement. Shader: height displacement at subsolar longitude; smooth gaussian falloff. |
| Tidal | Tidal Heating Rate Glow | uTidalHeatingGlow | ON | Tidal friction heats interior; highest heating at equator and sub-stellar point. Rendered as heightened brightness (#FF4400, +0.2 intensity) in tidal stress zones (sub-stellar longitude ±30°, equatorial band). Shader: conditional brightness boost based on latitude/longitude. |
| Tidal | Synchronous Rotation Wobble | uRotationWobble | OFF | If not perfectly tidally-locked, libration oscillation visible as subtle rotation angle modulation (amplitude ~5°) with orbital period. Shader: time-dependent rotation matrix with sinusoidal oscillation. |

#### Silicate Vapor Atmosphere (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Atmosphere | Silicate Vapor Haze | uSilicateVapor | ON | Ultra-thin silicate vapor exosphere (#E8B8A0 pale tan, opacity 0.08) near surface, mostly on day-side. Modeled as volumetric fog at low density. Shader: volumetric raymarching; density concentrated day-side via luminance falloff toward terminator. |
| Atmosphere | Vapor Condensation Limb | uVaporCondensation | ON | Silicate vapor condenses slightly at cooler limb; faint brightening (#FFC4A0, 0.1 opacity, ~0.3 Rp width). Fresnel-based rim effect. Shader: rim-light additive pass. |

#### Thermal Contrast (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Thermal | Day-Side Incandescence | uDaySideGlow | ON | Sub-stellar point glowing orange-white (#FFD4A0 at ~2700 K, emissive 1.0) with narrower cone than non-tidal planets. Glow extent ~60° half-angle. Shader: emissive color at subsolar point; bloom pass. |
| Thermal | Terminator Temperature Gradient | uTerminatorGradient | ON | Sharp color transition at terminator (day-night boundary); day-side bright (#FF3B00), night-side dark (#1A0806). Gradient transition width ~30 km simulates thin thermal skin depth. Shader: steep color interpolation at terminator edge. |
| Thermal | Night-Side Blackbody Radiation | uNightSideRadiation | OFF | Night-side emits faint thermal IR (#FF4400 extremely dim, 0.05 intensity) from cooled crust. Speculative thermal camera mode. Shader: low-intensity emissive color on night-side. |

#### Magnetic Field (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Magnetic | Induced Dipole Field | uInducedDipole | OFF | Speculative: if host star has magnetosphere, exoplanet's ionized silicate vapor creates induced magnetic field. Blue field lines (#4A7FB5, 0.2 opacity) looping from magnetic poles. Shader: additive line rendering. |
| Magnetic | Magnetosphere Interaction Glow | uMagnetosphereGlow | OFF | Speculative: solar wind interaction with planet's induced field creates subtle glow (#7AC4E8 pale, 0.1 intensity) in magnetotail region (anti-stellar). Shader: volumetric fog shape. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Light Direction | uLightDir | AUTO | Distant host star (e.g., M-dwarf); auto-orbit reveals tidal bulge at sub-stellar point and day-side/night-side thermal contrast. |
| Camera | Time Speed Multiplier | uTimeSpeed | 80x | 1 real second = 1 exoplanet minute (~0.1 seconds true). Short orbital period (1–3 Earth days) completes in ~1–3 real minutes. Lava convection motion visible. |
| Camera | Auto-Rotate | uAutoRotate | ON | Reveals tidal bulge, day-side/night-side incandescence contrast, lava flow patterns, and slowly-drifting crustal plates. |

---

### Ocean World (Hycean Planet)

**Entity ID:** ENT-2015
**Description:** Water-covered super-Earth exoplanet (#0E3A5F deep ocean, #7AC4E8 shallow zones, #FFFFFF ice cap or shell) with global aquatic environment, subsurface convection plumes, dynamic wave patterns, ice shell or open ocean, and speculative chemosynthetic habitable zones. Real exemplars: K2-18b (candidate Hycean), Kepler-22b, TRAPPIST-1d speculative.

**Section Count:** 8 (Ocean Depth & Color, Wave Patterns, Subsurface Convection, Ice Shell (if present), Atmospheric Cloud Layer, Chemosynthesis Zones, Currents & Upwelling, Camera)
**Total Feature Count:** 24

#### Ocean Depth & Color (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Ocean | Deep Ocean Baseline | uDeepOcean | ON | Planet-wide ocean depths 1–20 km (super-Earth, high gravity compresses). Base color #0E3A5F (very dark navy blue). Covered in 99% of surface. FBM (freq 10.0, 4 octaves) creates subtle depth variation via color brightness shifts. Shader: base color with FBM modulation for subtle depth layering. |
| Ocean | Shallow Sunlit Zones | uShallowZones | ON | Shallower regions (<1 km depth) around hydrothermal vent fields and seamount chains appear brighter #7AC4E8 (cyan-blue, 0.3 brightness boost). Coverage ~5–10%. Modeled via proximity to vent locations. Shader: lerp to bright blue near shallow zones. |
| Ocean | Underwater Light Scattering | uWaterScattering | ON | Volumetric light scattering through water layer; caustic-like patterns moving with time. Bright wavy pattern (#87CEEB pale, 0.2 opacity) animated at freq 0.3 rad/s. Represents light refraction through turbulent water. Shader: additive caustic-texture pass; animate UV scroll. |
| Ocean | Bioluminescence Glow (speculative) | uBiolumZones | OFF | Speculative chemosynthetic or photosynthetic organism bioluminescence; dim glowing patches (#7FE8FF bright cyan, 0.15 intensity, 10–100 km extent) near vent fields. Low-frequency FBM clusters. Shader: additive glow pass in designated zones. |

#### Wave Patterns (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Waves | Surface Wave Texture | uWaveTexture | ON | Animated wave pattern on surface (100 m–1 km amplitude in height, visible as brightness ripples). Generated via Gerstner waves (sum of sine waves at varying frequencies 0.5, 1.0, 2.0 rad/m). Wave animation period ~10–30 seconds. Modeled via normal map perturbation and brightness ripple overlay. Shader: animated normal map via time-dependent sine waves; additive ripple highlights. |
| Waves | Wind-Driven Wave Coherence | uWaveCoherence | ON | Dominant wave direction visible (direction of host star wind if tidal-locked, or general circulation). Waves elongated in preferred direction. Gerstner wave phase velocity biased toward wind. Shader: directional bias in wave normal map. |
| Waves | Storm Wave Crests | uStormWaves | OFF | Episodic storm cells produce larger waves (#A8D4E8 brighter crests, 0.4 intensity, 20–50 km wavelength). Procedurally scattered. Shader: additive bright foam-like crest rendering. |

#### Subsurface Convection (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Convection | Mantle Plumes | uMantlePlumes | ON | Hot upwelling plumes from rocky core rise through ocean; visible as bright upwelling zones #87CEEB (brighter cyan, 0.25 intensity). Plume centers ~50–200 km diameter. Procedural Poisson distribution; life span 0.1–1 million years (static for visualization). Shader: additive brightness in plume regions. |
| Convection | Hydrothermal Vent Fields | uVentFields | ON | Concentrated vent fields at plume heads; hot water (#B8D5F0 very bright blue-white, 0.5 intensity) ejected 100–500 m/s. Rendered as small bright pinpoints or short plume plumes (1–5 km tall). FBM (freq 15.0) determines vent cluster locations. Shader: bright emissive color at vent positions. |
| Convection | Convection Cell Boundary | uConvectionBoundary | OFF | Large-scale convection cells (Rayleigh-Bénard) create circulation patterns visible as opposing flow directions. Boundary visible as subtle color shift (#0A2A4F slightly different hue). Voronoi cells (freq 3.0). Shader: conditional color tint along cell boundaries. |
| Convection | Thermal Plume Rise Animation | uThermalAnimation | ON | Hot plumes rise slowly (0.01–0.1 m/s modeled). Height of bright region oscillates; procedural animation via sin(time * rise_frequency). Represents slow convective overturn. Shader: animate plume position via time-dependent offset. |

#### Ice Shell (if present, 3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Ice | Surface Ice Coverage (conditional) | uIceShell | OFF | If ice-covered ocean world (Europa-like), surface is frozen solid #FFFFFF (pure white, 0.95 albedo) or #EEF0F0 (slightly tinted). Coverage 100% if toggle ON. Can toggle between ice-shell and open-ocean modes. Shader: replace ocean color with ice white. |
| Ice | Ice Shelf Fracture Pattern | uIceShelfFractures | OFF | Large cracks and crevasses in ice shell due to tidal stress (if tidal locked). Linear #7AC4E8 bright features on white background, 1–10 km width, 100–1000 km length. Modeled via Worley noise (freq 5.0) for crack pattern. Shader: blue-tinted line rendering. |
| Ice | Sub-Ice Ocean Glow | uSubIceGlow | OFF | Faint glow (#87CEEB pale, 0.1 intensity) beneath ice cracks where liquid water/geothermal heat emerges. Speculative. Shader: additive glow through cracks. |

#### Atmospheric Cloud Layer (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Atmosphere | Water Vapor Cloud Deck | uCloudDeck | ON | Thick clouds (#E8F0F8 pale white-blue, 0.7 opacity) covering 60–80% of surface, altitude ~1–5 km. Generated via 5-octave Simplex FBM (freq 14.0) with curl-noise advection for dynamics. Modeled as volumetric fog sphere. Shader: volumetric raymarching; additive bloom. |
| Atmosphere | Tropical Cloud Belt | uTropicalBelt | ON | Brighter cloud band (#FFFFFF bright, 0.8 opacity) at equator (Hadley circulation analog). ~30° latitude width. FBM modulation. Shader: latitude-based brightness boost at tropical latitudes. |
| Atmosphere | Polar Cloud Vortex | uPolarVortex | ON | Anticyclonic vortex circulation at poles (similar to Venus/Earth). Spiral brightness pattern #E8F0F8 center, darker edge #D0E0F0. Animated rotation. Shader: spiral pattern via atan2 angle; rotate by time. |

#### Chemosynthesis Zones (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Chemo | Chemosynthetic Ecosystem Markers | uChemoLife | OFF | Speculative visible organisms/biofilms around vents; dark-reddish or golden patches (#8B4513 brown, #D4A857 golden, 0.2 intensity) clustered near vent fields. Represents energy-fixing bacteria/archaea. Shader: additive color overlay near vent zones. |
| Chemo | Mineral Deposit Discoloration | uMineralDeposits | OFF | Precipitated minerals (iron, silica, sulfide) from vent water create colorful sediment stains (#A0522D dark-red, #D2B48C tan, 0.15 intensity) surrounding vent fields. Shader: procedural color variation in vent proximity. |

#### Currents & Upwelling (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Currents | Ocean Current Streaks | uCurrentStreaks | ON | Large-scale ocean currents visible as directional color streaks; brighter zones (#87CEEB, 0.1 intensity boost) follow current flow. Direction animated via time-dependent curl-noise flow field. Shader: additive brightness along flowing streamlines. |
| Currents | Coastal Upwelling Plumes | uUpwellingPlumes | ON | Where currents collide with seamounts/ridges, nutrient-rich deep water upwells; bright zones (#A8D4E8 brighter, 0.3 intensity, 50–200 km extent). Modeled at fixed ridge locations. Shader: bright color in upwelling zones. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Light Direction | uLightDir | AUTO | Distant host star; auto-orbit reveals cloud patterns, wave dynamics, and convection plume activity. |
| Camera | Time Speed Multiplier | uTimeSpeed | 60x | 1 real second = 1 ocean-world hour (~1 Earth hour true). Waves and plume dynamics visible over ~10–30 real seconds. |
| Camera | Auto-Rotate | uAutoRotate | ON | Full rotation reveals cloud coverage, tropical belt, polar vortex, wave patterns, and vent field locations. |

---

### Super-Earth (Rocky Exoplanet)

**Entity ID:** ENT-2016
**Description:** Rocky exoplanet with mass 1.5–10 M⊕ and radius 1.2–2.0 R⊕, featuring enhanced geological activity due to higher internal heat and pressure, thicker atmospheres ranging from thin CO₂-dominated to dense steam/H₂ envelopes, potential plate tectonics or stagnant-lid regime, and surface gravity 1.2–3.0 g. Surface colors span from basaltic dark gray #4A4A4A to oxidized iron #C85A30, with possible vegetation biosignature tint #5A7A3A on habitable examples. Real exemplars: LHS 1140 b (temperate, 1.7 R⊕), Kepler-442b (habitable zone), K2-18b (sub-Neptune boundary), Proxima Centauri b (nearest), TRAPPIST-1 e/f (habitable zone candidates).

**Section Count:** 8 (Surface Geology, Atmosphere, Volcanism, Hydrosphere, Magnetosphere & Auroral, Weather Systems, Biosignature Indicators, Camera)
**Feature Count:** 28

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Surface Geology | Terrain Base Color | uTerrainBaseColor | ON | Basaltic crust ranging #4A4A4A (young fresh basalt) to #8A6A50 (weathered silicate). Higher surface gravity compresses topographic relief — max mountain height ~3–5 km vs Earth's 8.8 km (scales with 1/g). FBM terrain: 8 octaves, freq 2.5, lacunarity 2.1, gain 0.45. |
| Surface Geology | Continental Cratons | uContinentalCratons | ON | Large stable continental masses with oxidized surface #B87A50 (iron-rich regolith). If plate tectonics active: 4–8 major plates with visible suture zones. Stagnant-lid regime (more likely for >5 M⊕): single-plate surface with volcanic resurfacing. Voronoi cell pattern, 6–10 cells. |
| Surface Geology | Impact Basin Scars | uImpactBasins | ON | Ancient large impact basins partially erased by geological activity. Basin floors #3A3A40 (flooded basalt), rims eroded to ~500 m relief. 3–6 major basins visible on surface, decreasing preservation with increasing geological activity. Crater density ~0.3× Moon (active erosion). |
| Surface Geology | Tectonic Fracture Network | uTectonicFractures | ON | Visible fault lines and rift valleys. If plate tectonics: transform faults rendered as dark linear features #2A2A30, width 2–5 km scaled. If stagnant lid: radial fracture patterns around volcanic rises, coronae-like features (Venus analogy). Line noise displacement: freq 8.0, amp 0.02. |
| Surface Geology | Mineral Diversity Tinting | uMineralTinting | OFF | Regional color variation from mineral composition. Iron oxide provinces #C8553A, sulfur deposits #C8B830 near volcanic vents, carbonate platforms #E8E0D0 (if liquid water present), phyllosilicate clay regions #7A8A60. Blended via Voronoi region assignment, 15–25 provinces. |
| Atmosphere | Atmospheric Envelope | uAtmosphereEnvelope | ON | Thicker atmosphere than Earth due to higher mass retention — scale height H = kT/(μg), typically 5–8 km for CO₂-dominated, 12–18 km for H₂-rich. Rendered as volumetric shell with Rayleigh scattering. CO₂-rich: limb color #D0A870 (warm amber). H₂-rich: #8AB0D8 (pale blue). N₂/O₂-rich (habitable): #6A9FD8 (Earth-like blue). 48 raymarching steps. |
| Atmosphere | Cloud Deck Layers | uCloudDeckLayers | ON | Multi-layer cloud system. Low clouds #E8E8E8 (water/ice, altitude 5–15 km), mid clouds #D8C8A8 (sulfuric acid if Venus-like, 30–50 km), high cirrus #F0F0F8 (ice crystals, 40–60 km). Cloud coverage 40–80% depending on water inventory. FBM cloud texture: 6 octaves, freq 3.0, gain 0.5, animated advection. |
| Atmosphere | Atmospheric Haze | uAtmoHaze | ON | Photochemical haze layer for CO₂ or hydrocarbon atmospheres. Venus-like thick haze: #E8D8A0, opacity 0.6, altitude 60–80 km. Titan-like tholin haze: #C8A050, opacity 0.4. Clean habitable atmosphere: minimal haze opacity 0.05. Mie scattering forward peak factor 0.7. |
| Atmosphere | Terminator Scattering Glow | uTerminatorGlow | ON | Enhanced atmospheric scattering visible at terminator (day-night boundary). Refracted light extends ~2–5° beyond geometric terminator. Color shifts to #FF9050 (CO₂ atmosphere) or #FF7030 (thick steam). Ring-shaped glow during transit geometry, key observable for JWST atmospheric characterization. |
| Volcanism | Shield Volcano Complexes | uShieldVolcanoes | ON | Massive volcanic edifices, potentially larger than Olympus Mons due to sustained mantle plumes under higher pressure. 3–8 major shields per hemisphere, base diameter 200–600 km, summit calderas 20–50 km. Fresh lava flows #FF4A10 (basaltic, T~1400 K) radiating from summit. Caldera glow emission factor 0.8. |
| Volcanism | Volcanic Outgassing Plumes | uVolcanicPlumes | ON | Persistent volcanic outgassing columns rising to tropopause. SO₂/CO₂-rich plumes rendered as semi-transparent volumetric columns #C8C8B0 with opacity 0.3, height 30–60 km. 5–12 active plume sources across surface. Advected by upper atmospheric winds. Particle density falloff: exponential with scale height 15 km. |
| Volcanism | Lava Flow Networks | uLavaFlows | ON | Active surface lava channels and flow fields emanating from volcanic centers. Fresh flows: #FF3A00 (T~1500 K blackbody), cooling gradient to #8A2000 over 50–200 km distance. Flow morphology: channel-fed (narrow, sinuous) and sheet flows (broad, lobate). Night-side emission clearly visible. Width 1–10 km. |
| Volcanism | Volcanic Lightning | uVolcanicLightning | OFF | Electrical discharges within dense volcanic ash plumes. Brief flashes #E8E0FF, duration 50–200 ms, concentrated within 5 km of eruption column. 1–3 flashes per second during active eruption. Rendered as branching Lichtenberg figure, opacity 0.9 peak, rapid fadeout. |
| Hydrosphere | Surface Liquid Water | uSurfaceLiquidWater | OFF | Oceans and seas if within habitable zone with sufficient water inventory. Ocean color #1A4A8A (deep, iron-poor) to #2A6A5A (iron/mineral-rich). Specular reflection highlight on ocean surface, Fresnel coefficient 0.04 at normal incidence. Coverage 30–70% for habitable Super-Earths. Animated wave normal perturbation freq 4.0. |
| Hydrosphere | Ice Cap Coverage | uIceCaps | OFF | Polar ice deposits, extent depends on stellar flux and atmospheric greenhouse. Ice albedo #F0F5FF, edge transition zone 5–10° latitude width. If tidally locked: ice ring around anti-stellar hemisphere. Seasonal variation if obliquity >5°. Glacial flow texture: FBM 4 octaves, freq 6.0, directional stretch 2:1. |
| Hydrosphere | River/Channel Networks | uRiverNetworks | OFF | Visible drainage networks if active hydrological cycle present. Dendritic branching pattern from highlands to ocean basins. Water channels #2A5A7A, width 1–5 km (scaled). Higher gravity means steeper gradients, faster erosion — channels more deeply incised than Earth equivalent. Fractal branching: L-system 6 iterations. |
| Magnetosphere & Auroral | Magnetic Dipole Field Lines | uMagFieldLines | OFF | Intrinsic magnetic field visualization. Dipole strength estimated 1–5× Earth for active core dynamo (mass-dependent scaling). Field lines rendered as translucent tubes #4A7AB8, opacity 0.15, 12 lines per hemisphere. Magnetopause standoff distance 8–15 planetary radii depending on stellar wind pressure. |
| Magnetosphere & Auroral | Auroral Ovals | uAuroraeOvals | OFF | Polar auroral emission from magnetosphere-stellar wind interaction. Green oxygen line dominant #3AFF5A (557.7 nm analog), red oxygen #FF3A3A (630 nm) at higher altitude, nitrogen blue/purple #7A3AFF at lower altitude. Oval radius 15–25° colatitude. Curtain structure: vertical rays with FBM displacement, 5 octaves, freq 12.0. |
| Magnetosphere & Auroral | Radiation Belt Torus | uRadiationBelts | OFF | Trapped charged particle regions analogous to Van Allen belts. Inner belt at 1.5 Rp, outer belt at 3–5 Rp. Rendered as translucent toroidal volumes #6A8AB8, opacity 0.08. Intensity modulated by stellar activity — flare events cause belt inflation. |
| Weather Systems | Global Hadley Circulation | uHadleyCirculation | OFF | Atmospheric circulation cells visible through cloud banding. Wider Hadley cells than Earth due to slower rotation (if tidally locked: single hemisphere-scale cell). Ascending branch near substellar point: towering cumulonimbus #FFFFFF. Descending branch: clear sky desert regions. Cloud-free zones at cell boundaries. |
| Weather Systems | Cyclonic Storm Systems | uCyclonicStorms | ON | Tropical cyclone analogs, potentially much larger and more energetic than Earth hurricanes on warm ocean worlds. Eye diameter 50–200 km, spiral arm extent 500–2000 km. Cloud top #F0F0F0, eye wall #D8D8E0, eye clear to surface. Rotation: prograde hemisphere cyclonic. Animated spiral, period 0.5–2 days. |
| Weather Systems | Tidally Locked Day-Night Contrast | uTidalLockContrast | OFF | For tidally locked Super-Earths (common around M-dwarfs): permanent day-side/night-side dichotomy. Substellar point surface temperature +50–200 K above average, anti-stellar -100–300 K below. Visible as hemispheric color gradient. Day-side weathering #C87A40, night-side frost/ice #D0E0F0. Terminator habitability ring concept. |
| Biosignature Indicators | Vegetation Red Edge | uVegetationRedEdge | OFF | Hypothetical photosynthetic surface biosignature — sharp reflectance increase at ~700 nm (Earth analog). Surface tinting: vegetated regions #3A6A2A (visible green) transitioning to high NIR reflectance. Coverage: continental land between ±60° latitude. Seasonal variation if axial tilt >10°. Modeled after Earth's Normalized Difference Vegetation Index (NDVI). |
| Biosignature Indicators | Atmospheric O₂/O₃ Signature | uBioAtmosphereO2 | OFF | Ozone layer visualization as UV-absorbing shell at 20–40 km altitude. Rendered as thin translucent layer #A0B0D8, opacity 0.06. Presence indicates potential biological oxygen production (though abiotic false positives exist for M-dwarf planets via photolysis). Limb brightening at UV wavelengths. |
| Biosignature Indicators | Ocean Chlorophyll Bloom | uOceanBlooms | OFF | Surface ocean color modulation from hypothetical photosynthetic organisms. Bloom regions: #2A7A4A (chlorophyll-rich green), coverage 5–15% of ocean area, concentrated in upwelling zones and coastal shelves. Animated seasonal migration following stellar illumination patterns. Contrast against deep ocean #1A3A6A. |
| Camera | Light Direction | uLightDir | AUTO | Host star illumination; for M-dwarf hosted planets, star appears larger in sky (1–3° angular diameter vs Sun's 0.5° from Earth). Redder illuminant color temperature 2500–4000 K for M-dwarf host. Auto-orbit to reveal both hemispheres. |
| Camera | Time Speed Multiplier | uTimeSpeed | 30x | 1 real second = 30 planet-minutes. Weather systems, volcanic activity, and atmospheric dynamics visible over observation period. If tidally locked, time primarily shows weather evolution rather than rotation. |
| Camera | Auto-Rotate | uAutoRotate | ON | Full rotation reveals continental distribution, volcanic provinces, ocean/land fraction, atmospheric patterns, and terminator features. Period matches planet's rotation (if not tidally locked) or slow pan around substellar point (if locked). |

---

### 5.7 Earth-Type Habitable Planet

**Entity ID:** ENT-2043
**Base Mesh:** UV Sphere (128×64 segments, medium-distance LOD)
**Shader Type:** Fragment (multi-layer atmosphere + ocean specular + continental landmass + cloud dynamics)
**Exemplar:** Earth (archetype), Kepler-442b, TRAPPIST-1e (theoretical), Proxima Centauri b (speculative)

The Earth-type habitable planet represents a terrestrial world within its star's habitable zone with liquid surface water, a nitrogen-oxygen atmosphere, and active plate tectonics. This is distinct from the Earth reference implementation (which serves as the depth standard) — this entity represents the *generic class* of habitable planets as understood from exoplanet science, with parameterizable continental coverage, ocean fraction, atmospheric composition, and biosphere indicators. The entity encodes what we know about habitable zone requirements: stellar flux 0.35–1.1 S☉, planet mass 0.5–2.0 M⊕, sufficient atmospheric pressure for liquid water, and a protective magnetic field.

| Section | Feature | Uniform Name | Default | Description |
|---------|---------|-------------|---------|-------------|
| Surface | Continental Landmass | uContinents | ON | Randomized continental distribution: land fraction 20–40% (Earth: 29%). Color: temperate lowlands #5A8040 (vegetated), highlands #A09070 (exposed rock), deserts #D8C090 (arid interior), polar #F0F0F8 (ice/snow). Continental shapes generated via multi-octave FBM: 6-octave, freq 3.0, amplitude 0.4. Coastline complexity: fractal dimension ~1.2. Plate tectonics implied by linear mountain chains. |
| Surface | Ocean Coverage | uOceanCoverage | ON | Liquid water ocean: 60–80% surface coverage. Color: deep ocean #1A3A6A, shallow shelf #2A5A8A, coastal #3A7AAA. Specular reflection: Fresnel at sun angle, intensity 0.6. Wave texture: 2-octave simplex noise, freq 40.0, amplitude 0.005. Sun glint: concentrated specular hotspot #FFFFFF alpha 0.7 at solar reflection point. Ocean depth implied by color darkness. |
| Surface | Polar Ice Caps | uPolarIce | ON | Ice caps at both poles: extent depends on stellar flux and obliquity. Default coverage: 5–15% of surface area. Color: #F0F4FF (clean ice) to #E0E8F0 (older ice). Sea ice: thinner coverage #D8E8F8 extending equatorward in winter. Sharp ice edge transition over ~2° latitude. Glacial features: ice sheet flow lines at high zoom, crevasse texture. |
| Surface | Volcanic Activity | uVolcanism | ON | Active volcanism from plate tectonics: 10–50 visible volcanoes (analogous to Earth's Ring of Fire). Located at continental margins and hotspots. Plume: #C0C0C0 SO₂-rich, height 10–20 km. Night-side: lava glow #FF4A0A at active vents. Volcanic islands in ocean: dark basaltic #3A3A3A. Eruption frequency: 1–3 active at any time. Geologically alive. |
| Atmosphere | Rayleigh Scattering Limb | uRayleighLimb | ON | N₂-O₂ atmosphere: blue sky from Rayleigh scattering. Limb color: #6A9AFF (mid-atmosphere) → #4A6AE0 (upper) → black (space). Atmospheric scale height H ~ 8.5 km (Earth analog). Rendered as raymarched atmospheric shell, 50–100 km effective thickness. Scattering coefficient: λ⁻⁴ dependence giving blue. Sunset terminator: #FF8040 → #E06020 → #8A3010 (Rayleigh reddening at long path). |
| Atmosphere | Ozone Layer Absorption | uOzoneLayer | OFF | O₃ layer at 20–40 km altitude: UV absorption creates slight purple-blue tint #7A70C0 in upper atmosphere. Chappuis band absorption gives slight orange tint at sunset. Biomarker: O₃ implies O₂ implies photosynthesis. Rendered as thin colored layer within atmosphere. Diagnostic of biological oxygen production. |
| Atmosphere | Greenhouse Effect Indicator | uGreenhouseEffect | OFF | CO₂ + H₂O greenhouse warming: ΔT ~ +33K above blackbody (Earth: 255K → 288K). Visualization: thermal IR emission at TOA showing atmospheric absorption bands. False-color overlay: warm surface #FF6040 partially blocked by cool atmospheric emission #A08060 at greenhouse gas frequencies. Educational: shows habitable temperature maintenance mechanism. |
| Weather | Cloud Systems | uCloudSystems | ON | Multi-scale cloud coverage: 50–70% at any time. Cirrus (high): #FFFFFF alpha 0.3, wispy FBM 5-octave freq 6.0. Cumulus (mid): #F8F8FF alpha 0.6, billowing 4-octave freq 4.0. Stratus (low): #E8E8F0 alpha 0.5, smooth 2-octave freq 2.0. Cloud advection: wind-driven motion at 10–50 m/s. Tropical convective towers: tall bright columns #FFFFFF near equator. |
| Weather | Cyclone Systems | uCyclones | ON | Large rotating storm systems: 3–8 active at any time. Diameter: 500–2000 km. Spiral arm structure: golden-ratio spacing. Color: #F0F0FF (cloud tops). Eye: dark center #3A5A8A (ocean visible). Rotation: counterclockwise NH, clockwise SH (Coriolis). Extratropical: comma-shaped frontal systems at mid-latitudes. Movement: 20–40 km/hr along jet stream paths. |
| Weather | Seasonal Variation | uSeasonalChange | OFF | Axial tilt (0–45°) drives seasons. Animation: ice cap advance/retreat, vegetation color change (green summer #5A8A40 → brown winter #8A7A50 at mid-latitudes), cloud pattern shifts. Intertropical Convergence Zone (ITCZ) migration following sub-solar point. Full seasonal cycle over planet's orbital period. Earth-analog: 23.4° obliquity. |
| Biosphere | Vegetation Red Edge | uVegetationRedEdge | ON | CRITICAL BIOMARKER: vegetation reflects strongly at 700+ nm (red edge). Landmass color: green #4A8040 in visible but BRIGHT in near-IR #90C070. Red edge spectral signature: albedo jumps from 0.05 (visible) to 0.5 (NIR) at 700 nm. Visible primarily on illuminated continents. Seasonal: strongest in local summer hemisphere. This is the primary remotely-detectable biosignature for exoplanets. |
| Biosphere | Ocean Chlorophyll | uOceanChlorophyll | OFF | Phytoplankton in ocean: changes water color from deep blue #1A3A6A to green-tinged #2A5A5A in productive zones. Chlorophyll-a concentration: 0.01–10 mg/m³. Highest: coastal upwelling zones, polar spring blooms. Rendered as green color modulation on ocean surface. Seasonal bloom events: explosive greening of polar oceans in spring. Secondary biomarker after red edge. |
| Biosphere | Atmospheric O₂ Signature | uO2Signature | OFF | O₂ at 21% mixing ratio: strong A-band absorption at 760 nm. Detected in transmission spectroscopy during transit. Visualization: absorption line overlay on atmospheric limb spectrum. O₂ is thermodynamically unstable — requires continuous biological replenishment. The most robust gaseous biosignature. Combined with CH₄ creates disequilibrium diagnostic. |
| Biosphere | Nightside City Lights | uCityLights | OFF | SPECULATIVE: technological civilization indicator. Nightside artificial illumination: clustered along coastlines and river valleys. Color: warm #FFE0A0 (sodium lamp) or #E0E8FF (LED). Coverage: 0.1–5% of nightside landmass. Intensity: ~0.01% of dayside reflected light. Detectable by future telescopes (LUVOIR/HabEx concept). Renders as scattered point clusters on dark hemisphere. |
| Magnetosphere | Dipole Field Shield | uMagneticShield | ON | Planetary magnetic field B_eq ~ 25–65 μT (Earth: 31 μT). Dipole field lines rendered from poles, compressed on dayside by stellar wind. Magnetopause standoff: ~10 R_planet. Color: #6A6AFF, line density 20 at poles. Protects atmosphere from stellar wind erosion — essential for long-term habitability. Tilt: 0–15° from rotation axis. |
| Magnetosphere | Aurora | uAurora | OFF | Polar aurora from magnetospheric particle precipitation. Oval at magnetic latitude ~65–75°. Color: green #40FF60 (557.7 nm O I, 100–200 km), red #FF4040 (630 nm O I, 200+ km), purple #9A40FF (N₂, < 100 km). Curtain morphology: 100–500 km tall, FBM-structured. Activity correlated with stellar wind intensity. |
| Satellite | Moon(s) | uMoonPresence | OFF | Satellite(s) if present: stabilizes obliquity (critical for climate stability). Rendered as sphere(s) at orbital distance. Earth-analog: single large moon (R ~ 0.27 R_planet). Tidal effects: ocean tides, tidal heating if close. Phase cycle visible. Color: gray #A0A0A0 (rocky, airless). Moon presence may be requirement for long-term habitability. |
| Camera | Standard View | uCameraMode | ON | Default: planet filling frame, sun-illuminated hemisphere. Blue marble perspective: continents, clouds, ocean glint visible. Atmospheric limb blue glow. Scale bar: planet radius marked. Star type and HZ location annotated. Distance: typical exoplanet context (parsecs), shown as artist impression at close range. |
| Camera | Terminator View | uCameraMode | OFF | Camera positioned along day-night terminator: atmosphere backlit, showing atmospheric layers. Sunrise/sunset colors. Cloud silhouettes against bright limb. Ideal for transmission spectroscopy context — shows atmospheric depth and composition. |
| Camera | Time Speed Multiplier | uTimeSpeed | 60× | At default: 1 real second = 1 planet hour. Cloud evolution, cyclone rotation, day-night cycle visible over minutes. Seasonal change at 10⁴×. City lights (if enabled) flash into view during nightside passage. Auroral variability at default speed. |

---

## 6. Gas Giants

Gas giants are planets dominated by hydrogen-helium atmospheres with no solid surface (or a deep liquid metallic hydrogen interior). Jupiter- and Saturn-type giants have strong zonal jets and banded appearances; Uranus and Neptune are colder ice giants with methane-rich atmospheres; Hot Jupiters are tidally-locked exoplanets with extreme day/night dichotomy and atmospheric escape.

### Jupiter-Type

**Entity ID:** ENT-2020
**Description:** Gas giant with deep hydrogen-helium atmosphere, banded cloud structure driven by zonal jets, persistent anticyclonic storms, and faint dust rings. Visible colors span #FFFAF0 (zones) to #8F5A33 (belts) with Great Red Spot at #A8441C. Real exemplars: Jupiter.

**Section Count:** 9 (Zonal Bands, Major Storms, Cloud Dynamics & Weather, Polar Cyclones, Lightning Effects, Ring System, Magnetosphere, Galilean Moons, Camera)
**Total Feature Count:** 35

#### Zonal Bands (5 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Bands | Equatorial Zone | uEquatorialZone | ON | Bright cream-colored band straddling equator (#EFD4AC → #E0C090), ~20° latitude wide, prograde flow 170 m/s. Generated via latitude-dependent color ramp with FBM 5-octave Simplex (freq 30.0 zonal, freq 8.0 meridional) modulation, amplitude 0.12. Uses stretched domain sampling for bands in fragment shader. The dominant visual anchor. |
| Bands | North/South Equatorial Belts | uEquatorialBelts | ON | Dark reddish-brown twin belts flanking equatorial zone (#8F5A33 → #6E3F1E), retrograde relative to zone, ~10° wide each, superrotating wind structure at 120 m/s. Shader: mix with zone color via latitude smoothstep; additional 3-octave turbulence noise (freq 25.0) for mottled appearance with 0.08 amplitude. Represents ammonia depletion layer. |
| Bands | North Temperate Zone | uNorthTempZone | ON | Medium-light tan band (#C9B890 → #A89870) at ~30° north latitude, ~15° wide, contains smaller red ovals and brown patches. Noise: 4-octave FBM with 0.10 amplitude, freq 35.0 zonal, 12.0 meridional. Wind speed 95 m/s prograde. Shader uses periodic distortion to create subtle wave patterns. |
| Bands | South Temperate Zone | uSouthTempZone | ON | Symmetric counterpart to north temperate (#C9B890 → #A89870), ~30° south, contains white ovals and storm clusters. 4-octave FBM (freq 35.0 zonal, 12.0 meridional, amplitude 0.10). Retrograde wind 110 m/s. Fragment shader applies same periodic distortion for consistency. |
| Bands | Polar Regions | uPolarRegions | ON | Deep blue-gray zones (#4A4A6F → #3A3A5F blue-gray) at ±55° to poles, turbulent and poorly understood. FBM 6-octave (freq 40.0 zonal, 20.0 meridional, amplitude 0.14) creates complex cloud texture. Wind speeds highly variable, 50-150 m/s. Shader: elevated base color with additive noise for mottling. |

#### Major Storms (6 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Storms | Great Red Spot (GRS) | uGRSActive | ON | Iconic anticyclonic oval at 22°S, ~14,000 × 11,000 km (2024 measurement, shrinking), persistent 350+ years. Color: burnt sienna #A8441C with rotation rate 0.1 rad/s (one rotation ~6 Earth days). Shader: elliptical sampler with soft boundary Gaussian fade, internal turbulence via 3-octave Voronoi patterns (freq 50.0, amplitude 0.06). Decreasing trend in modern observations toggleable. |
| Storms | Oval BA (Brown Spot) | uOvalBA | ON | Anticyclonic storm at ~33°S, formed 1998, ~8,000 × 4,000 km. Color warm orange #D4743C, slower rotation 0.08 rad/s. Shader: ellipse with slightly sharper edges than GRS, internal vorticity via streamline noise (1D Perlin along meridian, freq 20.0). Position drifts ~0.5° per decade (optional animated drift). |
| Storms | White Ovals (South Temperate) | uWhiteOvals | ON | Cluster of 3-4 smaller anticyclonic storms at ~35°S, each ~2,000-4,000 km. Colors: creamy white #F5EAD8 with thin dark edges #6E4A2A. Rotation 0.12 rad/s (faster than GRS). Shader: Worley noise (freq 80.0) for cellular merging/splitting behavior, amplitude 0.04. Merge and divide over time toggle. |
| Storms | Red Plumes (North Equatorial) | uRedPlumes | ON | Transient bright red patches (#B8441F) appearing 2-4 per year at equator. Small scale ~1,000-2,000 km, short lifetime 3-6 months. Shader: stochastic Perlin noise (freq 45.0, 3-octave) with time-varying opacity to simulate eruptive birth/death. Amplitude 0.08, fades in/out via smoothstep on age. |
| Storms | Blue-Green Jets | uBlueGreenJets | OFF | Rare transient features, bright blue-green (#4A7F9F) at ~10-20° N/S. Size ~500-1,000 km, lifetime weeks. Shader: thin curved streaks via 1D noise along latitude circles, freq 60.0, amplitude 0.05. Represents break-through of deeper blue ammonia clouds. Off by default (speculative feature). |
| Storms | Impact Scars (Shoemaker-Levy 9) | uImpactScars | OFF | Historical scars at south polar region (#2A2A3A dark bruises), speculative visualization of SL-9 impact sites (1994). Color: blackish with faint brown halos #4A3020. Shader: scattered elliptical decals, fading over time via texture overlay. Off by default (historical, not current). |

#### Cloud Dynamics & Weather (5 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Dynamics | Ammonia Cloud Layer | uAmmoniaLayer | ON | Primary visible layer, composed of ammonia ice crystals at ~100 K, altitude ~100 km above 1-bar level. Base color #F0E8D8 to #D4B890, mottled via 5-octave FBM (freq 28.0 zonal, 10.0 meridional, amplitude 0.11). Shader: Lambertian + thin-cloud forward scattering approximation. Defines planet's visual hue. |
| Dynamics | Water Cloud Layer | uWaterLayer | ON | Deeper layer at ~200 K, altitude ~400 km below ammonia, brownish #8F6B4A, visible in cloud gaps. FBM 4-octave (freq 18.0 zonal, 8.0 meridional, amplitude 0.08). Shader: blended beneath ammonia via alpha+depth, adds visual depth and darker tones in storm regions. |
| Dynamics | Wind Shear Boundaries | uWindShear | ON | Sharp latitude-dependent color/texture transitions between zonal bands, visible as thin line artifacts at ~10°, ~20°, ~35° latitudes. Represented by 0.5-2° wide smoothstep transition zones with amplified turbulence (8-octave FBM, freq 80.0, amplitude 0.15). Shader: apply per-latitude wind vector, distort texture UVs by windspeed. |
| Dynamics | Jovian Cyclonic Vorticity | uVorticity | ON | Fine-scale swirling structures (~100-500 km) embedded in belts, anticyclonic storms in zones. Rendered via cross-product of velocity gradients, visualized as curl distortion field in fragment shader. Frequency 70.0, amplitude 0.07. Creates fine detail appearance without explicit particle sim. |
| Dynamics | Atmospheric Scattering & Haze | uHazeLayer | ON | Thin high-altitude haze (#D9CEC4 pale), reduces contrast near limb, adds Rayleigh scattering approximation. Alpha 0.05-0.10 depending on solar phase angle. Shader: factor in view-to-light angle, apply softening Gaussian blur at atmosphere edge. Altitude ~50 km. |

#### Polar Cyclones (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Poles | North Polar Cyclone Cluster | uNorthPoleCyclones | ON | Cluster of 8 anticyclonic cyclones arranged in regular polygon (~10,000 km diameter each) at north pole, discovered by Juno 2016. Colors: blue-white #B5D4F0 to gray #7A8A9A. Shader: 8-fold rotational symmetry via mod(theta, 2π/8), radial gradient for cone shape, Worley noise (freq 100.0) for turbulence. Rotation period ~4 days. |
| Poles | South Polar Cyclone Cluster | uSouthPoleCyclones | ON | Symmetric 6-cyclone arrangement at south pole (updated from Juno data), slightly smaller scale ~8,000 km each. Colors: similar blue-white palette. Shader: 6-fold symmetry, same Worley turbulence. Data from Juno orbits 2017-2019. Rotation synchronized with north cluster. |
| Poles | Polar Haze Darkening | uPolarHaze | ON | Darkened haze at both poles (#5A5A6F), caused by high-altitude aerosol concentration. Adds ~0.15 darkness offset to polar region colors. Shader: latitude-dependent mask centered at ±90°, Gaussian falloff width ~20°, additive darkening. |
| Poles | Polar Vortex Wind Jets | uPolarVortexWinds | ON | Localized superrotating jet streams at poles, visible as curved streaks. Wind speeds up to 200 m/s. Shader: apply strong latitudinal UV distortion (sin wave, amplitude 0.20, freq 15.0) in polar regions only (smoothstep falloff poleward of 70°). Creates swirling appearance. |

#### Lightning & Electric Effects (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Lightning | Optical Flash Events | uLightningFlashes | ON | Brief white #FFFFFF flashes in deep cloud layers, ~1-10 km scale, appear randomly in belt regions at ~0.02 Hz average rate. Shader: stochastic time-based trigger (hash noise of position+time), quick brightening (0.1 s rise, 0.3 s decay), 0.3× additive blend. Represents lightning in ammonia/water clouds. |
| Lightning | Aurora-like Polar Lights | uAuroralGlow | ON | Faint bluish glow #4A8FD0 along auroral oval (~10° from poles), caused by energetic particle precipitation. Alpha 0.10-0.15, softly glowing near terminator. Shader: latitude-band mask centered at ±75°, cosine brightness dependence on view angle, adds ethereal rim. |
| Lightning | Radio Emission Visualization | uRadioEmission | OFF | Speculative feature: white #FFFFFF strobe-like pulses at pole, representing Jovian decametric radio bursts. Frequency ~40 kHz (represented as ~0.5 Hz visual pulse for visibility). Shader: high-frequency time-based modulation, sharp on/off, only visible at pole regions. Off by default (not directly visual). |
| Lightning | Magnetic Reconnection Glow | uMagneticRecFaint | ON | Very faint orange #FF9040 glow scattered in storm regions, representing magnetic dissipation. Alpha ~0.05, high-frequency spatiotemporal noise (freq 100.0 time, 60.0 space), sparse (~10% pixel coverage). Shader: hash-based stochastic glow, additive blend. Subtle effect. |

#### Ring System (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Rings | Main Ring | uMainRing | ON | Faint dust ring at ~1.8 Rj (Jupiter radii), optically thin. Color: dull brown #2A1810, thickness ~30 km. Rendered as thin torus with sparse Worley noise (freq 120.0, amplitude 0.06) for clumping. Semi-transparent alpha 0.15. Shader: particle-like appearance via noise thresholding. Subtle visual presence. |
| Rings | Halo Ring | uHaloRing | ON | Diffuse inner ring structure, extends inward toward Io's orbit. Color #1A1308 very dark, thick and puffy (vert extent ~20 Rj). Rendered via radial gradient + 4-octave FBM (freq 25.0, amplitude 0.12). Alpha 0.10. Shader: volumetric-like appearance via falloff perpendicular to equatorial plane. |
| Rings | Ring Particle Clumps | uRingClumps | ON | Bright patches in ring system (#4A3020 dark brown with #6E5A40 bright spots), ~100-500 km scale. Represents dust aggregates. Shader: sparse Voronoi cells (freq 150.0) with intensity variation. Located primarily in main ring and halo. Density 5-10% of ring area. |

#### Magnetosphere (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|---------|
| Magnetosphere | Magnetic Field Lines | uMagFieldLines | ON | Visible fieldline structure extending to ~100 Rj (planet-ecliptic), dipole tilted 10° from rotation axis. Rendered as glowing yellow-to-orange gradient #FFFEF5 → #FF6030 based on field strength. Shader: parametric B-field lines via Kepler orbit + dipole superposition, line width modulated by log(|B|). Shows complex multi-lobe structure. |
| Magnetosphere | Io Torus | uIoTorus | ON | Bright toroidal plasma structure around Io's orbit (~6 Rj), greenish #7FD09F color from sulfur ions. Thickness ~1 Rj, brightness varies with Io orbital position. Shader: Gaussian torus with 2-octave sinusoidal modulation (freq 20.0 meridian, amplitude 0.10), fades beyond ±30° from equator. Real Io plasma torus. |
| Magnetosphere | Magnetotail Streamer | uMagnetotail | ON | Tail structure extending downwind (nightside), fading away, reddish #C84040 color. Rendered as widening ribbon from equatorial plane, length ~200 Rj (extends off-screen). Shader: inverse-square falloff, thin Voronoi noise (freq 40.0) for filamentary structure. Represents current sheet. |

#### Galilean Moons Backdrop (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Moons | Moon Positions (Io, Europa, Ganymede, Callisto) | uMoonPositions | ON | Render 4 moon positions at correct orbital distances (~6, 9.5, 15, 26 Rj) with orbital period animations (1.77, 3.55, 7.15, 16.69 days real-time, or scaled). Simple sphere billboards with labels. Io: #FFB020 yellow-orange, Europa: #D4C8B8 pale, Ganymede: #8A7F70 gray, Callisto: #4A4530 dark brown. Shader: unlit spheres with simple Lambertian shading. Reference points. |
| Moons | Moon Orbital Planes & Transit Shadows | uMoonShadows | ON | Optional: render thin lines showing moon orbits, shadows cast on Jupiter where moons transit. Orbit lines: light gray #A0A0A0, dashed. Moon shadows: soft gray #404040, Gaussian blur, alpha 0.20. Shader: raycast planet surface to determine shadow region, add soft shadow via distance field. Educational overlay. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Equatorial Sideview | uCameraMode | ON | Default view at 0° latitude, looking sideways at equatorial belt structure, distance ~3 Rj. Locked to planet rotation, follows Great Red Spot. FOV 60°. Smooth orbit animation (0.0001 rad/s rotation, negligible). Displays full zonal band structure. |
| Camera | Polar North-Looking | uCameraMode | OFF | Zoom to north pole (~50,000 km altitude), view down toward cyclone cluster. Shows 8-fold symmetry of north cyclones prominently. Distance ~5 Rj, FOV 45°. Optional animated slow orbit around pole (0.00005 rad/s). Highlights polar structure. |
| Camera | Storm-Chasing Dynamic | uCameraMode | OFF | Animated camera that orbits Great Red Spot, staying at ~2 Rj distance, FOV 50°, rotates around GRS at 0.0002 rad/s. Shows storm internal structure and surrounding zonal flow. Includes label "Great Red Spot". Excellent for detailed storm inspection. |

---

### Saturn-Type

**Entity ID:** ENT-2021
**Description:** Gas giant dominated by spectacular ring system (A, B, C, D, E rings and gaps), pale ammonia clouds, distinctive hexagonal polar vortex, and faint atmospheric storms. Ring colors span #C8B090 (A-ring) to #E8D4AE (B-ring) with dark Cassini Division #0A0A0A. Real exemplars: Saturn.

**Section Count:** 9 (Ring System & Structure, Atmosphere & Banding, Hexagonal Polar Vortex, Major Storms, Cloud Chemistry, Magnetosphere & Torus, Major Moons, Axial Tilt Dynamics, Camera)
**Total Feature Count:** 31

#### Ring System & Structure (7 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Rings | A-Ring Main Structure | uARingMain | ON | Outermost major ring, ~273,000 km radius, width ~14,600 km, color tan #C8B090. Rendered as thin torus quad with radial Voronoi noise (freq 100.0) to represent ring particle clumping, amplitude 0.08. Thickness perpendicular to plane: 1-5 km realistic, rendered as 0.02 Rj for visibility. Shader: stretched domain sampling along radial direction. |
| Rings | B-Ring (Brightest) | uBRingMain | ON | Widest ring, ~25,500 km width, innermost at ~92,000 km radius, brightest component #E8D4AE color. Alpha 0.85 (most opaque). Rendered via thin torus with 6-octave FBM (freq 40.0 radial, 60.0 azimuthal, amplitude 0.12) for dense particle texture. Shader: high opacity, detailed texture. Dominates visual ring appearance. |
| Rings | C-Ring (Crepe Ring) | uCRingMain | ON | Inner ring, ~17,500 km width, fainter than A/B (#D9C8A8 muted tan), semi-transparent alpha 0.40. FBM 5-octave (freq 50.0 radial, 40.0 azimuthal, amplitude 0.10). Shader: lower opacity to show planet through it. Less dense appearance. |
| Rings | Cassini Division | uCassiniDiv | ON | Dark gap between A and B rings, ~4,700 km wide, color nearly black #0A0A0A. Rendered as gap with sparse noise (freq 80.0, amplitude 0.04) to show occasional small particles. Shader: separate pass, low opacity 0.10, very dark base. Clean, distinct boundary. |
| Rings | Encke & Keeler Gaps | uEnckeKeekerGaps | ON | Smaller gaps in A-ring at specific radii, Encke ~333 km wide, Keeler ~35 km (tight). Rendered as thin dark stripes #1A1010 with shepherd moon Pan/Atlas influence visible. Shader: synthetic aperture sampling at precise ring radii, dark color, high-frequency modulation (freq 120.0) to simulate gap-edge waves. Real dynamical features. |
| Rings | D-Ring Inner Gossamer | uDRingGossamer | ON | Faint inner ring structure extending near atmosphere, very faint #8A7A70, alpha 0.15. Rendered via soft radial gradient + 3-octave noise (freq 30.0, amplitude 0.08). Represents dust particles. Less prominent, subtle effect. |
| Rings | E & G Ring Tenuous Outer | uERingOuter | OFF | Very faint outer rings from Enceladus & Mimas dust plumes, barely visible (alpha 0.05), color #A8A8A8 pale gray. Rendered only at very fine tessellation. Off by default (subtle, not essential for Saturn's iconic appearance). |

#### Atmosphere & Banding (5 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Atmosphere | Equatorial Zone | uEquatorialZone | ON | Bright cream zone at equator (#E8DCC8 → #D8CCBA), ~25° wide, color lighter than Jupiter due to Saturn's colder, higher altitude ammonia clouds. FBM 5-octave (freq 25.0 zonal, 8.0 meridional, amplitude 0.10). Wind: prograde ~450 m/s (faster than Jupiter). Shader: standard latitude-blended color ramp. |
| Atmosphere | Equatorial Belts & North/South Temperate | uTemperateBelts | ON | Darker brown-tan belts at ±10-15° (#C9A880 → #8F6F50), fainter than Jupiter's due to Saturn's atmospheric opacity and lower contrast. Flanking belts at ±30° also visible (#B89860 similar tone). FBM 4-octave (freq 28.0 zonal, 10.0 meridional, amplitude 0.09). Wind retrograde ~300 m/s in belts. Shader: darkening mix with zone color. |
| Atmosphere | Polar Regions & Detached Bands | uPolarRegions | ON | Deep blue-gray at poles (#5A7A9F → #3A4A6F), fainter and less pronounced than Jupiter. Additional detached bands at ~70° latitude, pale #C8B8A8. FBM 6-octave (freq 35.0 zonal, 15.0 meridional, amplitude 0.11). Creates intricate banding pattern. Shader: complex latitude-dependent color transition. |
| Atmosphere | Wind Shear & Jet Streams | uWindShear | ON | Sharp boundaries between zonal bands at ~15°, 30°, 45°, 65° latitudes. Rendered via 0.8-2° wide smoothstep transitions with amplified turbulence (8-octave FBM, freq 85.0, amplitude 0.14). Shader: apply strong latitudinal UV distortion by wind speed (450 m/s at equator, ~0 m/s at 45°). Shows wind shear dramatically. |
| Atmosphere | Upper Haze & Limb Darkening | uHazeLimb | ON | High-altitude haze layer (#D9CEC4 pale buff) with Rayleigh scattering, stronger than Jupiter due to Saturn's lower temperature. Alpha 0.12-0.18 depending on solar phase. Shader: view-angle dependent glow at limb, Gaussian falloff. Adds atmospheric depth. |

#### Hexagonal Polar Vortex (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Hexagon | North Polar Hexagon | uHexagonMain | ON | Iconic hexagonal jet stream at north pole, ~15,000 km side length (~30,000 km across vertex-to-vertex; NASA/Cassini measurement), discovered by Voyager 1 (1980). Color: pale yellow-tan #D4B870 with subtle mottling. Geometry: perfect hexagon (6-fold symmetry via mod(theta, π/3)) with rounded corners (softmax instead of sharp). Wind speed ~200 mph (320 km/h) along hexagon boundary. Shader: apply hexagonal symmetry mask, modulate interior color with 4-octave noise (freq 50.0, amplitude 0.08). |
| Hexagon | Hexagon Edge Jets | uHexagonEdges | ON | Sharp brown-orange edges #8A7A70 of hexagon, wind velocity ~100 m/s faster than surrounding. Rendered as thin lines following hexagon perimeter with slight waviness (1-octave sine, amplitude 0.02 radii). Shader: thin line overlay with elevated brightness. Shows dynamic edge structure. |
| Hexagon | Hexagon Interior Clouds | uHexagonInterior | ON | Patchy cream-white clouds #EFE4D8 scattered within hexagon interior. Sparse Voronoi noise (freq 120.0, amplitude 0.08, ~30% pixel coverage). Represents convective activity. Shader: additive blend, softly scattered pattern. Creates detailed hexagon appearance. |

#### Major Storms (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Storms | Great White Spot (Seasonal) | uGreatWhiteSpot | OFF | Massive anticyclonic storm appearing roughly every 29.5 years (Saturn's orbital period), observed 1933, 1960, 1990, 2010. When active: bright white #F5F5F0, ~10,000-15,000 km scale, rotation ~0.09 rad/s. Shader: elliptical Gaussian with internal turbulence (3-octave Voronoi, freq 60.0). Off by default (episodic, not persistent). Historical data allows activation toggle. |
| Storms | Storm Clusters (Temperate Zones) | uStormClusters | ON | Small anticyclonic ovals scattered in temperate regions, white #E8E0D8 to beige #D4C8B8, ~2,000-4,000 km scale each. Cluster positions vary yearly. Rendered via stochastic Worley noise (freq 100.0) with time-dependent cell positions (slow drift), amplitude 0.06. Shader: sparse cell selection and brightening. Multiple scattered storms. |
| Storms | Red Spot Analog (South) | uRedSpotSouth | OFF | Speculative: occasional warm-spot feature at ~35°S similar to Jupiter's GRS analog. Color rust #B8441F, size ~3,000 km. Shader: soft Gaussian ellipse with internal swirl. Off by default (not observed in modern era, speculative). |

#### Cloud Chemistry (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Chemistry | Ammonia Ice Clouds (Upper) | uAmmoniaLayer | ON | Primary cloud layer at ~0.5 bar pressure, temperature ~-110°C, altitude ~50-100 km, composed of ammonia ice crystals. Color: cream #E8DCC8 to pale beige #D8CCBA, less yellow than Jupiter. FBM 5-octave (freq 28.0 zonal, 10.0 meridional, amplitude 0.10). Shader: primary color layer, Lambertian shading. Defines Saturn's pale appearance. |
| Chemistry | Ammonium Hydrosulfide Layer (Mid-level) | uAmmoniumHS | ON | Intermediate cloud layer (~3 bar, ~-80°C), composition ammonium hydrosulfide (NH4SH). Color darker brown-gray #8A7A70. Visible in cloud gaps. FBM 4-octave (freq 22.0 zonal, 8.0 meridional, amplitude 0.09). Shader: blended beneath ammonia layer, adds depth. Less saturated than Jupiter's water layer. |
| Chemistry | Water Ice Clouds (Deep) | uWaterLayer | OFF | Deepest visible layer (~10 bar, ~0°C), composition water ice clouds. Very dark brownish #4A3A2A, only visible in large storm plumes. FBM 3-octave (freq 15.0, amplitude 0.07). Shader: ultra-low opacity (0.15), visible only in storm updraft regions. Off by default (not visible in typical view). |

#### Magnetosphere & Torus (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Magnetosphere | Dipole Field & Field Lines | uMagFieldLines | ON | Saturn's magnetic field, dipole aligned nearly parallel to rotation axis (~0.3° tilt), field lines extend to ~500 Rj. Rendered as glowing blue-cyan #4A9FDF to red #FF4040 gradient based on field strength. Shader: parametric B-field lines, modulated line width by |B|. Weaker than Jupiter (~0.2 Gauss at equator vs Jupiter's 4.2 G). |
| Magnetosphere | Enceladus Torus | uEnceladusTorus | ON | Faint water-group ion torus at Enceladus orbit (~4 Rj), greenish #7F9FA8 color. Thickness ~2 Rj, brightness varies slightly with Enceladus position. Shader: Gaussian torus with 2-octave sinusoidal ripples (freq 25.0), fades beyond ±35°. Fainter than Io torus on Jupiter. |
| Magnetosphere | Magnetotail Structure | uMagnetotail | ON | Nightside tail extending downwind, reddish-blue #6A5A7F color. Length ~400 Rj. Shader: inverse-square falloff with thin Voronoi filaments (freq 50.0, amplitude 0.08). Less pronounced than Jupiter's magnetotail. |

#### Major Moons (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Moons | Moon Orbital Positions (Titan, Rhea, Dione, Tethys, Iapetus, Enceladus) | uMoonPositions | ON | Render 6 major moon positions at orbital distances (~20.3, 8.7, 6.3, 4.9, 59.1, 3.9 Rs = Saturn radii) with correct periods (Titan 15.95 days, Rhea 4.52, Dione 2.74, Tethys 1.89, Iapetus 79.33, Enceladus 1.37 days). Titan: #FFB850 yellow-orange, Rhea/Dione: #B8A890 pale gray, Tethys: #D8CCC0 white, Iapetus: #5A4530 dark + #E8D8C8 bright (two-toned), Enceladus: #F0F0F0 white. Shader: unlit billboard spheres. Reference points. |
| Moons | Titan's Thick Atmosphere Haze | uTitanHaze | ON | Titan's substantial nitrogen atmosphere appears as bright haze around Titan position, orange-brown #C89050 glow, radius 1.5× Titan. Alpha 0.20. Shader: soft Gaussian haze centered on Titan, adds atmospheric depth. Only major moon with significant atmosphere. |

#### Axial Tilt Dynamics (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Tilt | Tilted Equatorial Plane | uAxialTilt | ON | Saturn's rotation axis tilted 26.7° from orbit normal (similar to Earth's 23.4°). Entire planet model rotated by this angle to show tilted ring orientation. Shader: apply rotation matrix to planet coordinates before rendering. Creates distinctive tilted-ring appearance that changes with orbital position. |
| Tilt | Seasonal Pole Illumination Variation | uSeasonalIllum | ON | As Saturn orbits Sun over 29.5 years, north/south poles transition between extreme illumination and darkness. Simulated via animated tilt angle or static show of different tilt angles. Shader: cosine-weighted illumination at each pole, varies from bright (winter) to dark (summer, twilight). Educational feature showing 29-year cycle. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Tilted Ring-Side View | uCameraMode | ON | Default camera at 0° equatorial latitude, tilted 30° above ring plane, distance ~4 Rs, showing rings at dramatic angle. FOV 55°. Locked to planet. Classic "side view" of Saturn with rings visible. |
| Camera | Ring Plane Direct View | uCameraMode | OFF | Camera positioned in Saturn's equatorial plane, looking along ring direction. Shows thin ring profile edge-on, very narrow appearance (realistic). Distance ~5 Rs, FOV 50°. Dramatic "edge-on" perspective. |
| Camera | Hexagon-Focused Polar | uCameraMode | OFF | Animated camera hovering above north pole at ~3 Rs altitude, directly looking down at hexagon. FOV 45°. Slow rotation around pole (0.00008 rad/s). Shows hexagon geometry prominently, interior structure visible. Educational for hexagon observation. |

---

### Uranus-Type (Ice Giant)

**Entity ID:** ENT-2022
**Description:** Ice giant with pale cyan methane-haze atmosphere, faint banding structure, extreme 98° axial tilt, thin dark ring system, and unusual magnetic field offset. Dominant color #C4DFD6 pale greenish-cyan (corrected per Irwin et al. 2024 true-color reprocessing; Voyager 2 imagery was over-saturated). Real exemplars: Uranus, with potential for ice giant exoplanet analogs.

**Section Count:** 9 (Methane Haze Atmosphere, Faint Banding, Extreme Axial Tilt & Seasonality, Polar Regions, Thin Ring System, Magnetosphere & Offset Dipole, Major Moons, Cold Stratosphere, Camera)
**Total Feature Count:** 26

#### Methane Haze Atmosphere (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Atmosphere | Methane Haze Layer | uMethaneLay | ON | Dominant upper atmosphere, composed of methane (CH4) ice crystals absorbing red light. Color: pale greenish-cyan #C4DFD6 (corrected true color per Irwin et al. 2024; significantly paler than Voyager 2 enhanced imagery suggested). FBM 4-octave (freq 20.0 zonal, 6.0 meridional, amplitude 0.07) creates subtle mottling. Shader: Lambertian shading + Rayleigh scattering for blue tint. Represents methane absorption. Featureless appearance compared to Jupiter/Saturn. |
| Atmosphere | Cloud Decks (Ammonia/H2S Layers) | uCloudDecks | ON | Occasional cloud breaks revealing deeper layers (~50 km below), light blue #A8D4E0 to darker #6A9FBF. Sparse FBM (freq 40.0, amplitude 0.05, ~20% coverage) to represent transient convective updrafts. Shader: additive blend beneath methane layer. Rare details. |
| Atmosphere | Atmospheric Zoning (Faint) | uFaintZoning | ON | Extremely faint latitude-dependent banding, barely visible. Equatorial zone slightly lighter #D0E8E2, temperate regions slightly darker #B0D0CC. Contrast <<1% (amplitude 0.03 FBM). Represents weak zonal jets compared to gas giants. Shader: subtle color gradient, hard to discern. |
| Atmosphere | Limb Haze & Rayleigh Scattering | uLimbHaze | ON | Blue haze at atmosphere limb due to Rayleigh scattering of methane, strongly blue-scattered #4A8FA8. Alpha 0.15-0.20 at 90° view angle, fades to 0 near equator. Shader: view-angle cosine weighting, adds atmospheric glow. Creates blue-glow effect at terminator. |

#### Faint Banding (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Banding | Equatorial Band | uEquatorialBand | ON | Subtle equatorial brightening, barely visible, color #A0E8DC slightly lighter than poles. Wind speed ~100–250 m/s (moderate; Neptune holds fastest winds record at ~2100 km/h), but velocity contrast with darker belts minimal. FBM 3-octave (freq 18.0 zonal, 5.0 meridional, amplitude 0.04). Shader: faint color modulation. Discovered by Voyager 2. |
| Banding | Mid-Latitude Latitudinal Features | uMidLatBands | ON | Very faint structure at ~30° and ±60° latitudes, color variation ±0.02 from base cyan. FBM 3-octave (freq 22.0, amplitude 0.04). Sparse appearance. Shader: minimal contrast blending. Modern HST observations confirm these subtle features. |
| Banding | Polar Brightening (Haze Hood) | uPolarBrighten | ON | Slight brightening toward poles from photochemical haze hood, color #A8CFC8 slightly darker than equator. Smooth latitude-dependent gradient (cosine function). FBM 4-octave (freq 25.0, amplitude 0.05) adds subtle texture. Shader: cosine-weighted latitude mask. Creates gentle polar shading. |

#### Extreme Axial Tilt & Seasonality (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Tilt | 98° Axial Tilt (Extreme) | uAxialTilt | ON | Unique extreme tilt: rotation axis nearly in orbital plane, 98° from north ecliptic pole. Causes poles to point nearly toward and away from Sun during orbit (84-year period = half-orbit). Rendered via rotation matrix applied to all planet geometry. Creates distinctive sideways appearance, with north pole experiencing intense sunlight, south pole complete darkness, then reversal. |
| Tilt | Seasonal Polar Illumination (84-Year Cycle) | uSeasonalIllum | ON | As Uranus orbits Sun over 84 years, illumination transitions from north-pole-day to south-pole-day. Animatable: show snapshots or continuous animation. Shader: pole-dependent illumination factor (dot product of pole vector with sun direction), affects brightness/temperature appearance. Currently (~2026), approaching northern solstice (~2028); next equinox ~2049. Educational visualization of extreme seasons. |
| Tilt | Atmospheric Wind Adaptation to Tilt | uPoleWind | ON | Atmospheric circulation adapted to extreme tilt: wind pattern follows rotation axis rather than traditional latitude bands. Represented by warped UV sampling in fragment shader, distortion amplitude varies with latitude, creating tilted flow pattern. Shader: apply rotation to UV domain, then sample texture. Subtle but noticeable effect on banding appearance. |

#### Polar Regions (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Poles | Sunlit Pole (Seasonal) | uSunlitPole | ON | Pole currently receiving sunlight (north pole ~2040 era). Brightened and warmed-toned #D4EDE6 compared to rest of atmosphere. Haze layer thicker due to enhanced convection. FBM 5-octave (freq 30.0, amplitude 0.08) for detailed cloud texture. Shader: elevated brightness and saturation at illuminated pole. Changes appearance over 84-year period. |
| Poles | Nightside Pole (Seasonal) | uNightPole | ON | Opposite pole in darkness/twilight. Very dark #4A6F88, faint thermal glow (infrared not visible to optical observer). Shader: near-zero illumination, slight additive glow from internal heat (~1% brightness). Visually understated. |
| Poles | Polar Temperature Inversion | uPolarInversion | ON | Surprising finding: dark poles are warmer than sunlit equator due to atmospheric circulation and internal heat. Represented by slight color inversion: dark poles rendered warmer-toned #7A9FB0 (hint of warm), equator cooler-toned #B8DDD8 (hint of blue). Shader: temperature-dependent color map applied inversely to illumination. Counterintuitive visualization. |

#### Thin Ring System (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Rings | Main Ring System (11 Rings) | uMainRings | ON | Uranus has 13 narrow rings (α, β, γ, δ, ε, λ, ν, η, ζ, ξ, π, σ, τ), dark and faint. Rendered as thin torus collection, color #3A3A3A very dark gray. Each ring has different radial position (~42,000-51,000 km) and width (~5-100 km). FBM 5-octave (freq 80.0, amplitude 0.08) for narrow particle clumping. Alpha 0.20-0.30 (dark). Shader: tight radial sampling, high-frequency modulation. |
| Rings | Epsilon Ring (Brightest) | uEpsilonRing | ON | Densest, brightest ring, ~100 km wide at ~51,000 km radius. Color: slightly brighter #5A5A5A dark gray. FBM 5-octave (freq 100.0, amplitude 0.10) with 2-octave radial wave pattern (freq 60.0, amplitude 0.04) for eccentricity structure. Shader: sharp radial boundaries, elevated brightness. Most prominent ring. |
| Rings | Ring Spokes & Shepherd Moons | uRingShepher | ON | Small shepherd moons (Cordelia, Ophelia) maintain ring structure via gravitational perturbations. Rendered as small sphere positions, causing thin curved wakes in nearby rings. Ring texture modulated by stochastic perturbation (freq 120.0, amplitude 0.06) near moon positions. Shader: apply radial distortion near moon longitude, decays with distance. Dynamical feature. |

#### Magnetosphere & Offset Dipole (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Magnetosphere | Tilted & Offset Magnetic Dipole | uMagDipole | ON | Uranus's magnetic field dipole tilted ~59° from rotation axis AND offset ~0.31 Ru from planet center (very unusual). Field strength ~0.23 Gauss (weaker than Earth). Rendered as off-center glowing field lines: blue #4A7FD8 to red #FF5050 gradient. Shader: parametric B-field from off-center dipole, lines modulated by |B|, creates asymmetric magnetosphere appearance. Unique feature. |
| Magnetosphere | Magnetosphere Offset Bulge | uMagBulge | ON | Offset dipole creates asymmetric magnetosphere, bulging toward one side. Rendered as warped torus of glowing plasma, brighter on one hemisphere. Color: cyan-blue #5A9FDF to orange #FF7050. Shader: modulate field strength visualization by dipole offset vector, creates lopsided appearance. Shows unique geometry. |
| Magnetosphere | Aurora-Like Glow (Offset Interaction) | uAuroralMag | ON | Offset dipole causes unusual auroral behavior, faint glow in unexpected regions. Rendered as blue-white #A8D8F0 glow scattered asymmetrically, primarily on one pole. Alpha 0.10-0.15, stochastic spatial distribution (freq 100.0). Shader: aurora glow from particle precipitation, offset pole weighting. |

#### Major Moons (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Moons | Major Moon Positions (Titania, Oberon, Umbriel, Ariel, Miranda) | uMoonPositions | ON | Render 5 major moons at orbital distances (Titania 43.6 Rs, Oberon 58.2, Umbriel 19.4, Ariel 12.1, Miranda 5.9 Ru = Uranus radii) with orbital periods. Titania: #A8A8A8 gray, Oberon: #909090 darker gray, Umbriel: #6A6A7A darkish, Ariel: #C8C8D8 lighter, Miranda: #9A8A80 brown-gray (cratered). Shader: unlit billboard spheres with diffuse shading. Notable moons with diverse surfaces. |
| Moons | Moon Orbital Inclinations | uMoonInclined | ON | Uranus moon orbits all lie in equatorial plane (aligned with 98° tilt), unlike other planets. Rendered as orbital plane overlay (thin gray circles #A0A0A0), tilted 98° from ecliptic. Optional labels. Shader: thin line overlay on equatorial plane. Educational feature showing unusual orbital geometry. |

#### Cold Stratosphere (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Stratosphere | High-Altitude Ice Crystal Haze | uStratoHaze | ON | Upper stratosphere very cold (~-220°C at top), contains methane and other hydrocarbon ice crystals. Rendered as extremely faint pale cyan haze #C8E8E8, alpha 0.08, high altitude (~100+ km above methane clouds). Shader: thin atmospheric layer at planet edge, Gaussian falloff. Adds subtle high-altitude detail. |
| Stratosphere | Thermal Emission from Internal Heat | uThermalEmit | ON | Uranus emits little thermal radiation (internal heat ~10% of input solar, unlike Jupiter/Saturn). Represented by very faint red-orange thermal glow #FF7050 at low alpha 0.05, scattered throughout atmosphere. Shader: additive thermal emission layer, sparse stochastic distribution (freq 80.0, ~5% coverage). Represents internal heat transport. Subtle effect. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Tilted-Pole View (Current Era ~2040) | uCameraMode | ON | Default camera positioned above north pole (currently illuminated), distance ~3.5 Ru, FOV 55°. Shows north pole bright and prominent, rest of planet in perspective. Locked to planet, slow rotation (0.0001 rad/s). Emphasizes extreme tilt. |
| Camera | Equatorial Band View | uCameraMode | OFF | Camera positioned at 0° equatorial latitude, distance ~3 Ru, looking sideways. Shows ring system in near-edge-on view (rings tilted ~98° to orbit), with thin dark rings visible as diagonal lines. FOV 50°. Educational view of ring orientation. |
| Camera | Orbital Context (Zodiacal) | uCameraMode | OFF | Zoomed-out camera showing Uranus orbiting Sun (simplified 2D view), with 84-year season indicators (arrows/labels showing pole orientation change over time). Distance ~30 Ru, FOV 80°. Animated Sun/planet relative motion. Shows long-term seasonal cycle. |


---

### Neptune-Type (Ice Giant)

**Entity ID:** ENT-2023
**Description:** Blue ice giant with dynamic atmosphere, dark spot cyclones analog to Great Dark Spot, supersonic winds (fastest in solar system ~2100 km/h), thin crescent cloud cap, and unusual magnetic offset. Dominant color #91B3CD moderate blue (corrected per Irwin et al. 2024 true-color reprocessing; Voyager 2 imagery exaggerated blue saturation. Neptune and Uranus are closer in color than previously depicted, though Neptune retains a slightly deeper blue). Real exemplars: Neptune, ice giant exoplanet analogs.

**Section Count:** 9 (Deep Blue Atmosphere, Dark Spot Cyclones, Supersonic Wind Bands, Methane Cirrus Clouds, Internal Heat Radiation, Thin Ring System, Triton Backdrop, Magnetosphere & Dipole Offset, Camera)
**Total Feature Count:** 26

#### Deep Blue Atmosphere (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Atmosphere | Blue Base Color | uBaseBlue | ON | Fundamental atmospheric color #91B3CD moderate blue (corrected per Irwin et al. 2024 true-color reprocessing), from methane absorption of red light (like Uranus but slightly deeper blue tint). FBM 4-octave (freq 22.0 zonal, 6.0 meridional, amplitude 0.08) creates subtle mottling. Shader: Lambertian + Rayleigh scattering for blue enhancement at limb. Represents methane ice crystal layer. |
| Atmosphere | Darker Equatorial Region | uEquatorialDarker | ON | Counterintuitive: equatorial region darker #5A7FA8 compared to temperate zones #91B3CD. Represents slight cloud opacity increase. FBM 3-octave (freq 20.0, amplitude 0.05). Shader: equatorial band darkening via latitude-dependent color ramp. Small contrast (~5%). |
| Atmosphere | Cloud Breaks & Brighter Patches | uCloudBreaks | ON | Transient white methane cirrus clouds #F0F0F0 appearing at high altitude, sparse distribution (Worley freq 100.0, ~15% coverage, amplitude 0.07). Represent convective updrafts. Shader: additive blend beneath base color. Adds detail and visual interest. |
| Atmosphere | Limb Haze & Scattering | uLimbHaze | ON | Strong blue haze at terminator, more pronounced than Uranus due to higher methane content. Color #6AAFEF bright blue, alpha 0.18-0.22. Shader: view-angle cosine weighting, creates brilliant blue glow at sunset. Striking visual feature. |

#### Dark Spot Cyclones (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Spots | Great Dark Spot (GDS) Analog | uGreatDarkSpot | OFF | Neptune's Great Dark Spot observed by Voyager 2 (1989) at ~22°S, ~12,000 × 8,000 km oval, then vanished (1994). Color: extremely dark navy #1A3A5E. When active: rotation rate 0.095 rad/s (~6 day period), surrounded by white methane clouds. Shader: elliptical Gaussian with sharp edges, internal Voronoi turbulence (freq 55.0, amplitude 0.07). Off by default (episodic). Historical data toggle. |
| Spots | Scooter Bright Feature | uScooter | ON | Bright white methane cloud #F5F5F0 at ~40°S, fast-moving (orbital period ~16 hours, faster than planet rotation). Size ~4,000 km, transient (weeks-months). Shader: rounded rectangle Gaussian with rapid orbital animation (angular velocity 0.0015 rad/s). Represents fast-moving cloud system. |
| Spots | Dark Spot Remnant (Small) | uDarkSpotSmall | ON | Smaller dark oval at ~50°S, much fainter than GDS, color dark gray #4A5A70. Size ~2,000 km, less distinctive. Shader: soft Gaussian ellipse with gentle turbulence. Semi-persistent feature. |
| Spots | Bright Oval Cluster (South Temperate) | uBrightOvals | ON | Cluster of 2-4 small white ovals #ECECEA scattered at ~35°S, each ~1,000-2,000 km, short-lived (weeks). Sparse Voronoi (freq 110.0, amplitude 0.06, ~20% coverage). Shader: additive overlaid spots with soft edges. Dynamic feature set. |

#### Supersonic Wind Bands (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Winds | Equatorial Jet (Fastest) | uEquatorialJet | ON | Most dramatic wind feature: prograde jet at equator reaching ~2100 km/h (~585 m/s), fastest planetary wind in solar system. Rendered via extreme latitudinal UV distortion in fragment shader: sin-wave amplitude 0.35, frequency 8.0. Creates dramatic shearing at equatorial boundary. |
| Winds | Retrograde Belts | uRetrogradeBelts | ON | Retrograde wind regions at ±20-30° latitude, speeds ~400-500 m/s. Shader: apply retrograde UV distortion (negative sign), amplitude 0.15, freq 12.0. Opposite-flowing bands create shear complexity. |
| Winds | Mid-Latitude Prograde Zones | uMidLatZones | ON | Prograde zones at ±45-60° latitude, speeds ~200-300 m/s, slower than equator. Shader: moderate UV distortion (amplitude 0.10), freq 15.0. Creates band-like structure from wind shear. |
| Winds | Polar Circulation | uPolarCirc | ON | Complex polar flow, speeds variable 100-200 m/s. Rendered via complex latitudinal modulation (combination of sine waves, freq 20.0-40.0, amplitude 0.12). Shader: high-frequency UV distortion in polar regions. Subtle but noticeable vorticity. |

#### Methane Cirrus Clouds (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Clouds | White Methane Cirrus Cap | uMethaneCirc | ON | Crescent-shaped bright methane ice cloud cap covering large region (~hemisphere), color white #F5F5F0 to pale blue #E0E8F0. Rendered as semi-transparent overlay with 5-octave FBM (freq 45.0 zonal, 15.0 meridional, amplitude 0.09). Alpha 0.25-0.35. Shader: cloud layer blended above base atmosphere. Dominates visual appearance. |
| Clouds | Cirrus Streaks & Waves | uCircusStreaks | ON | Thin curved white streaks #EFEFEA following wind flow lines, 5-10 km wide, lengths 1000-5000 km. Rendered via 1D noise along latitude circles (freq 60.0, amplitude 0.04). Sparse (30% pixel coverage). Shader: thin additive streaks following wind velocity vectors. Wind-aligned feature. |
| Clouds | Transient Convective Plumes | uConvectivePlumes | ON | Bright white plumes #FCFCF8 appearing at ~100 km/day drift rate, representing convective updrafts from internal heat. Sparse stochastic placement (freq 90.0, ~10% coverage), short lifetime (fade-out over time, ~1 day). Shader: additive bright spots with temporal fade. Represents dynamic convection. |

#### Internal Heat Radiation (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Heat | Thermal Infrared Glow | uThermalGlow | ON | Neptune radiates more internal heat than received from Sun (~2.6× solar input). Represented by faint red-orange thermal glow #FF6050 scattered throughout atmosphere. Alpha 0.08-0.12, sparse stochastic distribution (freq 80.0, ~8% coverage). Shader: additive thermal emission layer. Subtle but visible effect. |
| Heat | Warm Spot Hotness Modulation | uWarmSpots | ON | Internal heat creates slightly warmer regions, represented by thin warming tint #FF7050 overlaid at ~0.03 alpha in random locations. FBM 6-octave (freq 50.0, amplitude 0.08) for spatial variation. Shader: additive warmth tint, very subtle. Represents heat flow complexity. |

#### Thin Ring System (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Rings | Incomplete Ring Arcs | uRingArcs | ON | Neptune has 5 partial rings forming incomplete arcs at ~42,000-63,000 km radius. Named arcs: Liberté, Égalité, Fraternité (bright arcs), plus two fainter arcs. Colors: dark gray #4A4A4A for main structure, slightly brighter #6A6A6A for named arcs. FBM 5-octave (freq 100.0, amplitude 0.10) for clumping. Rendered as separate arc segments, not continuous rings. Shader: sector-based rendering (ring only visible in certain longitude ranges). |
| Rings | Ring Shepherd Dynamics | uRingShepher | ON | Small shepherd moons (Adams, Le Verrier) cause azimuthal gaps/clumping in arcs via perturbations. Ring texture modulated by stochastic high-frequency noise (freq 130.0) near shepherd longitudes, creating localized density enhancements. Shader: apply radial distortion near moon positions. Dynamical feature. |

#### Triton Backdrop (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Triton | Triton Moon Position & Retrograde Orbit | uTritonPos | ON | Triton orbits Neptune retrograde (orbital period 5.88 days, unusual). Rendered as sphere at correct orbital distance (~14.9 Rn = Neptune radii), with retrograde animation. Triton color: icy white #E8E8F0 with darker regions #7A7A8A. Shader: unlit billboard sphere with subtle cratered texture. Orbital decay (~3.6 cm/year) animation optional. |
| Triton | Triton's Frozen Surface & Geysers | uTritonGeysers | ON | Triton's surface below absolute detection range (too small), but geysers shooting nitrogen gas plumes to ~8 km altitude (Voyager 2 observations) can be visualized as thin white plumes #FFFFFF emanating from moon surface. Alpha 0.15, sparse stochastic emission (freq 110.0, ~5% coverage). Shader: additive geyser plumes fading away. Speculative but scientifically-grounded visualization. |

#### Magnetosphere & Dipole Offset (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Magnetosphere | Offset Tilted Magnetic Dipole | uMagDipole | ON | Neptune's magnetic dipole tilted ~47° from rotation axis AND offset ~0.55 Rn from planet center (extreme offset, like Uranus). Field strength ~0.14 Gauss. Rendered as off-center glowing field lines: cyan-blue #4A9FD8 to orange-red #FF5030 gradient based on |B|. Shader: parametric B-field from displaced dipole, creates highly asymmetric magnetosphere. Unique feature. |
| Magnetosphere | Asymmetric Aurora-Like Emission | uAuroralAsym | ON | Offset dipole creates asymmetric auroral glow, primarily on one hemisphere where field lines compress. Blue-white #A8D8FF glow with stochastic sparse distribution. Alpha 0.12-0.18. Shader: aurora glow with hemisphere-dependent weighting. Off-center dipole physics. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Great Dark Spot Historical View | uCameraMode | ON | Default camera positioned at 0° latitude, viewing Great Dark Spot at ~22°S (when active). Distance ~3.5 Rn, FOV 50°. Shows dark spot, surrounding bright clouds, and wind structure. Locked to planet rotation, historical era toggle to show 1989 data. |
| Camera | Scooter Chasing | uCameraMode | OFF | Animated camera following Scooter bright cloud, orbiting planet synchronized with Scooter's fast period (~16 hours). Distance ~2.5 Rn, FOV 45°. Shows Scooter with surrounding context. Dynamic follow view. |
| Camera | Pole Thermal Emission View | uCameraMode | OFF | Zoomed thermal-like perspective, emphasizing internal heat radiation via orange tinting/heat mapping. Distance ~3 Rn, FOV 55°. Shows thermal glow more prominently (enhanced alpha 0.15-0.20 for thermal layer). Speculative pseudo-infrared view. |

---

### Hot Jupiter (Exoplanet)

**Entity ID:** ENT-2025
**Description:** Tidally locked ultra-hot massive gas giant in tight 2-4 day orbit, exhibiting extreme day-side temperatures (1300-3000 K), rapid atmospheric circulation, silicate clouds, possible atmospheric escape. Day-side color #FFC08A warm, night-side #2A1F1A dark. Real exemplars: HD 189733b, KELT-9b, WASP-12b.

**Section Count:** 9 (Day-Side Photosphere, Night-Side Twilight Region, Terminator Jets & Circulation, Silicate Cloud Formation, Atmospheric Escape, Magnetic Reconnection Events, Tidal Bulge Distortion, Migration History Context, Camera)
**Total Feature Count:** 25

#### Day-Side Photosphere (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|---------|
| DaySide | Substellar Point Hotspot | uSubstellarHot | ON | Extreme heating directly facing star, temperature reaching 1300-3000 K depending on albedo and heat redistribution. Color: burnt orange-yellow #FFC08A at subsolar point, fading to orangered #FF9050 at edges. FBM 4-octave (freq 25.0 zonal, 10.0 meridional, amplitude 0.09) creates cloud mottling. Shader: temperature-dependent color mapping + Lambertian lighting. The hottest point on planet. |
| DaySide | Dayside Wind-Driven Circulation | uDaySideCirc | ON | Supersonic winds (~7 km/s) driven by extreme temperature gradient, flow pattern shows equator-to-poles circulation. Rendered via UV distortion: strong longitudinal modulation (amplitude 0.25, freq 15.0), latitudinal component (amplitude 0.12, freq 20.0). Shader: apply velocity-dependent UV offset, creates dramatic shearing effects. |
| DaySide | Silicate Haze & Cloud Top | uSilicateHaze | ON | Aluminum oxide and silicate clouds form at day-side temperatures, bright white-yellow #F0E8C0 color. Rendered as high-altitude haze layer with 5-octave FBM (freq 50.0, amplitude 0.10). Alpha 0.30-0.40. Shader: cloud layer above photosphere, adds reflectivity and bright appearance. Creates bright day-side appearance. |
| DaySide | Limb Brightening (Opacity Effect) | uLimbBright | ON | At day-side limb, strong limb-brightening from optically thick atmosphere. Rendered as bright rim #FFE0A0 with alpha gradient (sharper at limb, fades inward). Shader: view-angle-dependent brightening, inverse square falloff, creates glowing edge. |

#### Night-Side Twilight Region (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| NightSide | Night-Side Cooling & Darkness | uNightSideTemp | ON | Night-side much cooler, temperature ~100-400 K (depending on heat redistribution timescale). Color: dark reddish-brown #2A1F1A base. Sparse cloud texture via 3-octave FBM (freq 18.0, amplitude 0.06), very subdued. Shader: minimal illumination (small stellar phase angle), nearly unlit appearance. Represents radiative cooling. |
| NightSide | Thermal Emission Glow | uNightThermalGlow | ON | Night-side glows faintly from thermal radiation (~infrared), represented by red-orange #FF5030 tint at low alpha 0.08-0.12, sparse distribution (freq 80.0, ~10% coverage). Shader: additive thermal glow layer, low intensity. Speculative (not visible to naked eye at optical wavelengths). |
| NightSide | Atmospheric Circulation Hot Spot Lag | uHotSpotLag | ON | Due to atmospheric superrotation (winds ~2–5 km/s), hottest region offset ~30° eastward from substellar point (Spitzer/JWST phase curve observations), creating visible warm spot on night-side hemisphere. Color: warm orange #FF8040 at low alpha 0.15, positioned offset by ~30° longitude. Shader: time-independent offset (or slowly-drifting), represents steady circulation. |
| NightSide | Terminator Transition Band | uTerminatorBand | ON | Sharp transition band at day-night boundary (terminator), showing rapid temperature drop. Rendered as narrow band (~20° wide) with strong texture contrast: bright day-side blend to dark night-side. FBM 6-octave (freq 60.0, amplitude 0.12) creates turbulent boundary. Shader: steep color gradient transition. Dramatic visual feature. |

#### Terminator Jets & Circulation (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Terminator | Kelvin-Helmholtz Instability Waves | uKelvinHelmholtz | ON | Strong shear at terminator (day-hot vs night-cold) drives Kelvin-Helmholtz instability, creating wavy distortions. Rendered via high-frequency sinusoidal modulation along terminator line (amplitude 0.08, freq 40.0). Shader: apply UV wave distortion along terminator boundary, creates corrugated appearance. Plasma physics visualization. |
| Terminator | Eastward Superrotating Winds | uSuperrotating | ON | Atmospheric winds flow eastward (prograde, direction opposite orbital motion in some reference frames) at extreme speeds. Represented by strong longitudinal UV distortion (amplitude 0.30, freq 12.0) across entire day-side. Shader: velocity-driven texture offset, creates dramatic east-west streaking. Counterintuitive feature. |
| Terminator | Atmospheric Wake & Tail | uAtmosTail | ON | Extreme winds drag atmosphere, creating a visible wake/tail extending toward night-side, asymmetry in cloud distribution. Rendered via stochastic sparse cloud overlay on night-side shifted eastward (longitudinal offset ~20°). FBM freq 70.0, amplitude 0.08, ~20% coverage. Shader: sparse additive cloud streaks. Trailing effect. |

#### Silicate Cloud Formation (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Clouds | Aluminum Oxide (Corundum) Clouds | uAluminumOxide | ON | Forms at ~1500 K, settles at high altitudes on day-side. Color bright white #F5F0E0, sparse Voronoi cells (freq 100.0, amplitude 0.08, ~25% coverage). Shader: additive bright cloud spots, soft Gaussian edges. Represents ultra-high-altitude condensates. |
| Clouds | Silicate Glass Clouds | uSilicateGlass | ON | Forms at ~1200-1500 K, intermediate altitude layer. Color: pale yellow-white #FFFAEE. FBM 5-octave (freq 55.0, amplitude 0.09, alpha 0.35). Shader: cloud layer beneath aluminum oxide. Creates layered haze structure. |
| Clouds | Thermal Decomposition & Cloud Clearing | uCloudClearing | ON | Above ~1800 K, silicates vaporize (no clouds). Rendered as clear region on hottest day-side areas. Represented by reduced cloud texture density in substellar region (scaled down by temperature factor, ~0.2× normal amplitude). Shader: temperature-dependent cloud opacity masking. Shows atmospheric chemistry at extreme temps. |

#### Atmospheric Escape (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Escape | Hydrogen Exosphere Escape | uHydrogenEscape | ON | High atmospheric temperatures (~1500-3000 K) cause hydrogen atoms to escape (Jeans escape). Rendered as faint blue-white #C8E8FF thin streamer extending from day-side, pointing away from star (solar wind interaction). Alpha 0.10-0.15, sparse stochastic rays (freq 120.0, ~15% coverage). Shader: additive escape glow, inverse-square falloff with distance. Speculative but scientifically plausible. |
| Escape | Atmospheric Mass Loss Rate Display | uMassLossRate | OFF | Optional text/numeric overlay showing estimated mass-loss rate (~10^8-10^9 g/s typical), or animated "particle" stream visualization. Off by default (informational overlay). |

#### Magnetic Reconnection Events (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Magnetic | Localized Bright Flare-Like Events | uMagneticFlares | ON | Stellar magnetic reconnection in magnetosphere-atmosphere interaction region, visible as brief bright white #FFFFFF flashes at random locations on day-side. Stochastic triggering (hash noise of position+time, frequency ~0.01 Hz), quick rise/decay (0.2 s rise, 0.5 s decay). Shader: stochastic time-based bright spot additive blending. Represents energetic plasma events. |
| Magnetic | Magnetic Field Line Visualization | uMagFieldLines | ON | Exoplanet's intrinsic magnetic field (if present) interacting with star's field. Rendered as glowing field lines: blue #4A8FD8 to red #FF5050 based on field strength. Shader: parametric dipole field lines, modulated line width by |B|. Intrinsic field likely weak. Speculative visualization. |

#### Tidal Bulge Distortion (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Tidal | Tidal Bulge Elongation (Prolate) | uTidalBulge | ON | Extreme tidal forces from close proximity to star (2-4 day orbital period) elongate planet into prolate spheroid. Rendered via geometric deformation: apply ellipsoid geometry with axes scaled (e.g., 1.0, 1.0, 0.95 for 5% squashing). Shader: world-space geometry deformation. Subtle but visible flattening. |
| Tidal | Tidal Heating Hotspot Concentration | uTidalHeat | ON | Tidal dissipation concentrates heat at substellar point more sharply than radiation alone. Represented by tighter hotspot radius (Gaussian width ~10° vs ~20° without tidal effect) and elevated temperature contrast. Shader: tighter radial falloff of substellar hotspot. Enhances temperature gradient. |

#### Migration History Context (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|---------|
| Migration | Orbital Distance & Period Display | uOrbitalContext | ON | Overlay showing orbital period (2-4 days, labeled), distance to star (~0.03 AU), for reference. Text annotation or orbit visualization overlay. Shader: text rendering or simple orbit line. Educational context. |
| Migration | Planetary Density & Radius Anomaly Label | uAnomalyLabel | OFF | Optional annotation noting inflated radius anomaly (Hot Jupiters 20-50% larger than interior models predict), possibly due to atmospheric heating and/or internal heat sources. Text overlay. Off by default (informational). |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Sub-Stellar Point Facing | uCameraMode | ON | Default view: positioned at ~3 Rh (Hot Jupiter radii) distance, looking at substellar hotspot directly. Shows day-side bright colors, terminator winds, night-side darkness. FOV 50°. Locked to planet (corotation view). Emphasizes extreme day-night contrast. |
| Camera | Orbital Motion Context | uCameraMode | OFF | Zoomed-out view showing Hot Jupiter orbiting massive host star (simplified 2-body visualization, star rendered as large bright sphere #FFF8D0). Orbital period ~2-4 days (animated), distance ~0.03 AU (scaled for visibility). Shows orbital context. |
| Camera | Terminator Edge-On | uCameraMode | OFF | Positioned at terminator boundary, viewing along terminator line. Shows sharp day-night transition edge-on, kelvin-Helmholtz wave structure visible in profile. Distance ~2 Rh, FOV 45°. Dramatic angle emphasizing atmospheric shearing. |

---

### Mini-Neptune (Sub-Neptune)

**Entity ID:** ENT-2035
**Description:** Planet with radius 1.7–3.5 R⊕ and mass 5–20 M⊕, occupying the transition zone between rocky super-Earths and gas giants. Possesses a thick hydrogen-helium envelope (1–20% by mass) over a high-pressure ice/rock interior. No known Solar System analog — the most common planet type in the Milky Way yet absent from our system ("radius valley" boundary at ~1.7 R⊕). Atmosphere may be H₂/He-dominated with deep water/ammonia clouds, or steam-dominated (if extensive water inventory). Visible disk shows muted pastel banding: pale blue-gray #A8B8C8 to warm lavender #B8A8C0 depending on atmospheric metallicity and cloud composition. Real exemplars: K2-18b (habitable zone, 2.6 R⊕), GJ 1214b (flat featureless transmission spectrum, 2.7 R⊕), TOI-1452b (possible water world, 1.7 R⊕), Kepler-11 system (multiple sub-Neptunes).

**Section Count:** 8 (Atmospheric Envelope, Cloud Structure, Internal Glow & Thermal, Haze & Photochemistry, Weather Dynamics, Hydrogen Escape, Ring/Debris, Camera)
**Feature Count:** 27

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Atmospheric Envelope | Base Atmosphere Color | uBaseAtmoColor | ON | H₂/He-dominated atmosphere with high-metallicity Rayleigh scattering. Disk-center color: #A8B8C8 (low metallicity, pale blue-gray) to #B8A8C0 (high metallicity, warm lavender from hydrocarbon hazes). Limb darkening coefficient 0.35. Scattering scale height 200–800 km (puffy atmosphere, low gravity). |
| Atmospheric Envelope | Atmospheric Thickness Visualization | uAtmoThickness | ON | Visually exaggerated atmospheric shell to communicate the defining feature: enormous atmosphere relative to core. Rendered envelope extends 10–30% of visible radius. Gradient from opaque cloud deck to translucent exosphere. Inner boundary diffuse (no solid surface visible). 32 raymarching steps minimum. |
| Atmospheric Envelope | Pressure-Depth Gradient | uPressureGradient | OFF | Color gradient indicating atmospheric depth structure. Upper atmosphere #C8D8E8 (low pressure, 0.01–1 bar), mid-atmosphere #8A9AA8 (10–100 bar, condensation zones), deep atmosphere #4A5A6A (1000+ bar, supercritical fluid transition). Illustrates that "surface" is arbitrary pressure level. |
| Cloud Structure | Primary Cloud Deck | uPrimaryCloudDeck | ON | Main visible cloud layer at ~0.1–1 bar pressure level. Water ice clouds: #E0E8F0 (white-blue tint). If high metallicity: KCl/ZnS salt clouds #D8D0C0 (warm gray-cream, as suggested for GJ 1214b). Cloud coverage 70–95%. FBM texture: 7 octaves, freq 2.5, gain 0.48. |
| Cloud Structure | Secondary Deep Clouds | uDeepClouds | ON | Lower cloud deck at 10–100 bar, visible through gaps in primary deck. Water liquid clouds #B0C0D0 or NH₃ clouds #D0C8A0 depending on temperature profile. Glimpsed as darker undertones through primary cloud holes. Opacity 0.3 seen through gaps. Larger scale texture: FBM 5 octaves, freq 1.5. |
| Cloud Structure | Cloud Banding | uCloudBanding | ON | Weak latitudinal banding from zonal circulation. Much more muted than gas giants — bands are subtle pastel variations, not sharp contrasts. Zone/belt contrast ratio only 1.05–1.15 (vs Jupiter's 1.3+). 4–8 bands total, alternating #B8C8D8 (lighter) / #98A8B8 (darker). Sinusoidal noise perturbation amp 0.03. |
| Cloud Structure | Cloud Hole Hot Spots | uCloudHoles | OFF | Gaps in cloud deck revealing warmer deeper layers. Appear as slightly brighter/warmer spots #C0A880 in thermal emission. Diameter 500–3000 km. 3–8 visible on disk. Thermal contrast ΔT ~50–150 K above surrounding cloud tops. Key spectral window for JWST characterization. |
| Internal Glow & Thermal | Thermal Night-Side Emission | uNightThermal | ON | Internal heat glow visible on night side (if close enough to resolve). Equilibrium temperature 300–800 K for irradiated sub-Neptunes. Night-side color #5A2A1A (dim red-brown) to #8A3A1A (warmer). Emission factor 0.15. Higher than expected if strong day-to-night heat redistribution. |
| Internal Glow & Thermal | Internal Heat Flux | uInternalHeat | OFF | Residual formation heat contributing to atmospheric dynamics. Adds faint uniform glow from below cloud deck, color #4A2A1A, intensity 0.05. Drives convective overturn visible as cloud texture evolution. More significant for young (<1 Gyr) sub-Neptunes. |
| Haze & Photochemistry | High-Altitude Photochemical Haze | uPhotoHaze | ON | Hydrocarbon/tholin haze layer produced by UV photolysis of CH₄ in upper atmosphere. Altitude 0.001–0.01 bar. Color: #C8B8A0 (soot-like organics) for CH₄-rich, #D8D0C8 (sulfur haze) for H₂S-rich. Opacity 0.1–0.6 — responsible for the "flat" featureless transmission spectra observed for many sub-Neptunes (GJ 1214b archetype). Mie scattering, particle size ~0.1 μm. |
| Haze & Photochemistry | UV-Driven Haze Asymmetry | uHazeAsymmetry | OFF | Haze production concentrated on day side where UV flux is highest. Creates visible day/night haze opacity contrast: day-side limb more opaque by factor 1.5–3×. Substellar haze cap #D0C0A0. Haze transported to night side by zonal winds with ~90° phase lag. |
| Weather Dynamics | Equatorial Superrotating Jet | uSuperrotatingJet | ON | Broad equatorial eastward jet (superrotation), a generic feature of tidally influenced atmospheres. Visible as slightly displaced cloud patterns, eastward hotspot offset ~10–40° from substellar point. Wind speed 1–5 km/s. Animated cloud advection showing prograde motion at equator. |
| Weather Dynamics | Polar Vortex Structures | uPolarVortex | OFF | Cyclonic circulation at poles, collecting haze and cloud material. Compact polar cap features with spiral arm structure. Diameter ~15–25° colatitude. Slightly different color from main atmosphere: #90A0B8 (cooler, more condensation). Rotation period ~50–200 hours. FBM spiral: 4 octaves, freq 6.0. |
| Weather Dynamics | Convective Upwelling Cells | uConvectiveCells | OFF | Large-scale convective overturn visible as bright cloud clusters amid darker subsiding regions. Cell size 1000–5000 km (scaled with atmospheric scale height). Bright updraft centers #D0E0F0, dark subsidence #8898A8. 10–30 cells visible per hemisphere. Voronoi pattern, animated lifetime 10–50 hours. |
| Weather Dynamics | Day-Night Thermal Contrast | uDayNightContrast | OFF | For irradiated sub-Neptunes: visible temperature contrast between permanently illuminated and dark hemispheres. Day-side brighter/warmer #C0C8D0, night-side darker/cooler #7A8898. Contrast reduced by efficient heat redistribution (unlike hot Jupiters). Terminator band visible as intermediate tone. |
| Hydrogen Escape | Atmospheric Evaporation Trail | uAtmoEscape | OFF | Hydrodynamic hydrogen escape from upper atmosphere, forming a comet-like tail. Rendered as diffuse trail #D0D8E8, opacity 0.06, extending 3–10 planetary radii in anti-stellar direction. Mass loss rate ~10⁸–10¹⁰ g/s for close-in sub-Neptunes. Key process in "radius valley" sculpting — sub-Neptunes losing envelopes become super-Earths. |
| Hydrogen Escape | Roche Lobe Overflow Visualization | uRocheOverflow | OFF | For very close-in examples: atmosphere overflows Roche lobe creating mass transfer stream toward host star. Rendered as elongated teardrop shape with L1 point stream #B0C0D8, opacity 0.08. Only visible at extreme zoom-out showing star-planet system. Illustrates photoevaporation-driven atmospheric loss. |
| Ring/Debris | Tenuous Dust Ring | uTenuousDustRing | OFF | Hypothetical faint ring or debris disk from captured material or moon disruption. Rendered as near-transparent disk #C0C0C0, opacity 0.02, inner edge at 1.5 Rp, outer edge 3 Rp. Forward-scattering brightening at high phase angle. No confirmed sub-Neptune rings, but dynamically plausible. |
| Camera | Full Disk View | uCameraMode | ON | Default view at ~4 Rp distance showing full atmospheric disk. Emphasizes the puffy, cloud-shrouded appearance. FOV 50°. Shows cloud banding, haze limb, and any thermal emission features. Host star illumination from appropriate direction. |
| Camera | Transit Geometry View | uCameraMode | OFF | View along line of sight during transit, showing planet silhouette against host star disk. Atmospheric annulus visible as translucent ring — demonstrates how transmission spectroscopy works. Star rendered as background disk #FFF0D0. Atmospheric annulus exaggerated 3× for visibility. |
| Camera | Time Speed Multiplier | uTimeSpeed | 20x | 1 real second = 20 planet-minutes. Cloud evolution, jet stream advection, and haze dynamics visible. Typical sub-Neptune rotation period 10–30 hours. |

---

### Rogue Planet (Free-Floating Planet)

**Entity ID:** ENT-2037
**Description:** Planet ejected from its birth system or formed in isolation, drifting through interstellar space with no host star. Mass range 0.5–13 M_Jupiter (or down to Mars-mass for rocky rogues). Surface/atmosphere illuminated only by ambient galactic starlight, cosmic microwave background, and internal residual heat. Infrared-dark against sky, visible primarily through self-luminous thermal emission in mid-IR (young rogues T_eff ~500–1500 K) or gravitational microlensing events. Colors: warm young gas rogue #5A1A0A (deep infrared-red glow), cold ancient rogue #1A0A0A (near-black, barely visible), rocky rogue #2A2A2A (dark silhouette). Real exemplars: CFBDSIR 2149-0403 (probable rogue, ~4 M_Jup), OTS 44 (free-floating brown dwarf/planet boundary), MOA-2011-BLG-262 (microlensing candidate), JWST Orion population (~40 JuMBOs — Jupiter Mass Binary Objects).

**Section Count:** 8 (Thermal Self-Emission, Atmosphere, Surface/Interior, Ambient Illumination, Microlensing Effect, Companion/Binary, Interstellar Medium Interaction, Camera)
**Feature Count:** 26

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Thermal Self-Emission | Residual Heat Glow | uResidualHeat | ON | Primary visual feature: infrared self-luminosity from gravitational contraction and residual formation heat. Young rogue (<500 Myr): T_eff ~800–1500 K, visible as deep dull red glow #5A1A0A to #8A2A0A across full disk. Old rogue (>2 Gyr): T_eff <400 K, barely visible #1A0808, emission factor 0.02. Blackbody spectrum mapped to visible approximation. |
| Thermal Self-Emission | Thermal Banding Pattern | uThermalBanding | ON | For gas-type rogues: latitudinal thermal emission variation from internal convection-driven banding. Warmer bands #6A2010 alternating with cooler #4A1008. Very low contrast (ΔT ~20–50 K) — no stellar irradiation means no photosphere cloud color variation, only thermal structure. 4–8 bands, sinusoidal perturbation. |
| Thermal Self-Emission | Convective Hot Spots | uConvectiveHotSpots | OFF | Localized regions of enhanced thermal emission from deep convective plumes breaching cloud deck. Spots #8A3A1A, diameter 2000–10000 km, ΔT +100–300 K above surroundings. 2–5 visible hot spots. Animated evolution: formation, drift, dissipation over ~100 hour timescales. |
| Atmosphere | Dark Atmosphere Silhouette | uDarkAtmosphere | ON | Thick H₂/He atmosphere visible primarily as silhouette and limb effects. No reflected starlight — atmosphere appears as graduated darkness against background stars. Limb: faint #1A1A2A halo from molecular hydrogen CIA (collision-induced absorption) emission at ~2 μm. 24 raymarching steps. |
| Atmosphere | Cloud Deck (Infrared-Dark) | uDarkClouds | ON | Iron and silicate clouds at depth for warm rogues (T_eff >1000 K), water/ammonia clouds for cooler. Clouds seen only via thermal emission modulation — brighter cloud holes, dimmer cloud tops. Cloud color contribution: warm #4A2A1A (iron clouds), cool #2A1A1A (water ice). FBM: 6 octaves, freq 2.0, gain 0.45. |
| Atmosphere | Ammonia Ice Crystal Layer | uAmmoniaIce | OFF | For cooler rogues (T_eff 200–400 K): upper ammonia ice cloud deck. Visible only in reflected ambient galactic light as extremely faint #2A2A30 variation. Nearly invisible — included for completeness and IR rendering mode. Opacity 0.01 in ambient light. |
| Surface/Interior | Rocky Rogue Surface | uRockySurface | OFF | For ejected terrestrial planets: dark basaltic surface #2A2A2A with residual volcanic activity providing sparse emission points #FF3A00 (if young/massive enough for active geology). Surface temperature: cosmic microwave background equilibrium ~2.7 K + any geothermal contribution (~30–50 K for Earth-mass with radiogenic heating). Essentially black. |
| Surface/Interior | Subsurface Ocean Indicator | uSubsurfaceOcean | OFF | Theoretical: rocky rogues with thick H₂ atmosphere could maintain liquid water via pressure-greenhouse effect even without stellar input. Rendered as subtle bluish subsurface glow #1A2A4A, opacity 0.03, visible through volcanic vent regions. Speculative but physically modeled (Stevenson 1999, Abbot & Switzer 2011). |
| Surface/Interior | Cryogenic Surface Features | uCryoSurface | OFF | For cold rocky rogues: surface coated in condensed atmospheric gases — N₂ ice, CO ice, Ar frost. Smooth high-albedo patches #D0D0D8 (N₂ ice) and #E0D8C0 (CO ice), but essentially invisible without illumination. Shown in enhanced-visibility mode with amplified ambient light. Texture: Voronoi cells, 20 cells. |
| Ambient Illumination | Galactic Background Starlight | uGalacticLight | ON | Faint ambient illumination from integrated galactic starlight (~10⁻⁵ solar flux). Provides extremely dim illumination #0A0A12, rendering planet as barely discernible disk against star field. Direction: isotropic with slight galactic plane concentration. Creates ~0.001 lux surface illumination. |
| Ambient Illumination | Background Star Field | uBackgroundStars | ON | Dense star field behind rogue planet, emphasizing isolation. Planet visible as dark silhouette occluding background stars. Star density: 1000–5000 stars in FOV depending on galactic latitude. Stars rendered as point lights #FFFFFF varying magnitude. Occultation of stars by planet limb = key detection method. |
| Ambient Illumination | Cosmic Microwave Background | uCMBGlow | OFF | 2.725 K cosmic microwave background providing absolute minimum illumination. Rendered as very faint uniform ambient #020204. In reality invisible to optical cameras — included as scientifically accurate ambient floor. Isotropic illumination. |
| Microlensing Effect | Gravitational Microlensing Ring | uMicrolensingRing | OFF | Einstein ring visualization when rogue planet passes between observer and background star. Ring radius θ_E ≈ 1 mas (milliarcsecond) — rendered as magnified ring of background starlight around planet silhouette. Ring color: amplified background star color, magnification factor 10–1000×. #FFFFD0 for solar-type source. Animated approach-peak-departure over ~20 day event. |
| Microlensing Effect | Source Star Magnification | uSourceMagnification | OFF | Background source star brightening as rogue approaches alignment. Light curve: symmetric Paczyński shape. Source star brightness increases smoothly from baseline to peak (magnification 2–1000×). Rendered as growing bright point near planet position, color temperature preserved. Duration animation: 1–50 days compressed. |
| Companion/Binary | JuMBO Companion | uJuMBOCompanion | OFF | Jupiter-Mass Binary Object — paired rogue planets orbiting each other (discovered by JWST in Orion Nebula). Second body rendered at separation 25–400 AU (scaled), similar appearance to primary. Both showing thermal self-emission. Mutual orbit animated, period ~10⁴ years. Companion mass ratio 0.5–1.0. |
| Companion/Binary | Captured Moon System | uCapturedMoons | OFF | Hypothetical retained or captured satellites. 1–3 small dark bodies orbiting at 5–50 planetary radii. Rendered as dark points #1A1A1A, diameter ≪ planet. Orbital motion animated. Tidally heated inner moon could show faint emission #3A1A0A if Io-like heating operates. |
| Interstellar Medium Interaction | ISM Bow Shock | uISMBowShock | OFF | Interaction between rogue planet's residual magnetosphere/exosphere and interstellar medium. Faint bow-shaped emission #2A2A3A, opacity 0.03, at magnetopause standoff distance 10–50 Rp ahead of velocity vector. Interstellar velocity ~20–50 km/s (typical). Rendered as compressed arc shape. |
| Interstellar Medium Interaction | Hydrogen Wall | uHydrogenWall | OFF | Pileup of interstellar hydrogen at heliopause analog. Thin wall of enhanced neutral hydrogen density producing faint Lyman-alpha glow (rendered as #3A3A4A, opacity 0.02). Distance ~100–500 Rp from planet. Analogous to Sun's hydrogen wall detected by Voyager. |
| Camera | Thermal Emission View | uCameraMode | ON | Default view optimized for self-luminous thermal emission. Background dark sky with star field. Distance ~5 Rp. Shows thermal glow, banding, and hot spots against dark space. False-color enhancement toggle available to boost visibility of faint features. |
| Camera | Silhouette Transit View | uCameraMode | OFF | Planet positioned against dense star field or specific bright background star, showing occultation/microlensing geometry. Emphasizes detection method. Wide FOV 80° to show background star context. |
| Camera | Time Speed Multiplier | uTimeSpeed | 500x | 1 real second = ~8 planet-hours. Slow atmospheric evolution visible. Rotation period 2–20 hours (preserved from formation). Cloud pattern drift and hot spot evolution observable. |

---

### Circumbinary Planet (Tatooine-Type)

**Entity ID:** ENT-2039
**Description:** Planet orbiting a binary star system, experiencing double illumination with complex shadow patterns, quasi-periodic irradiation variations, and potentially extreme seasonal cycles. Orbit must be exterior to the binary (P-type orbit, typically >3× binary separation for stability). Atmospheric and surface appearance similar to corresponding single-star planet type but with distinctive double-star lighting geometry: overlapping shadows, binary eclipses visible from surface, and irradiation modulation on binary orbital timescale. Visual signature: dual specular highlights, time-varying illumination color (when binary components differ in spectral type), and shadow multiplicity. Real exemplars: Kepler-16b ("Tatooine," 0.7 M_Jup, Saturn-like), Kepler-34b, Kepler-47 system (multi-planet circumbinary), TOI-1338b (TESS discovery).

**Section Count:** 8 (Dual Illumination, Atmospheric Effects, Surface Lighting, Binary Eclipse Events, Orbital Dynamics, Planet Properties, Shadow Geometry, Camera)
**Feature Count:** 26

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Dual Illumination | Primary Star Light | uPrimaryStar | ON | Illumination from primary (more massive) binary component. Color based on spectral type: G-type #FFF8E0, K-type #FFE8C0, M-type #FFC8A0. Intensity proportional to L₁/d² where d = planet-primary distance. Casts shadow set A. Rendered as directional light with finite angular size 0.3–1.5° from planet. |
| Dual Illumination | Secondary Star Light | uSecondaryStar | ON | Illumination from secondary binary component. Typically cooler/dimmer: K-type #FFE0B0, M-type #FFC0A0. Intensity proportional to L₂/d². Casts shadow set B, offset from A by binary angular separation as seen from planet (0.5–5° typically). Combined illumination creates penumbral zones where shadows partially overlap. |
| Dual Illumination | Combined Color Temperature | uCombinedColorTemp | ON | Blended illumination color from both stars falling on surface/atmosphere. Weighted average: C_combined = (L₁·C₁ + L₂·C₂)/(L₁+L₂). For Kepler-16 analog (K+M binary): combined tint #FFE0B8, warmer than Sun. Varies with binary orbital phase — beat frequency modulation as stars orbit each other. |
| Dual Illumination | Illumination Variation Cycle | uIllumCycle | ON | Quasi-periodic total flux variation as binary separation (projected on sky from planet's view) changes. Period = binary orbital period (typically 10–60 days). Amplitude 5–30% total flux variation. Animated sinusoidal brightness modulation on ambient light intensity. Creates "flickering" seasons superimposed on orbital seasons. |
| Atmospheric Effects | Dual Rayleigh Scattering | uDualRayleigh | ON | Atmosphere scatters light from both stars independently. Sky color is sum of two Rayleigh-scattered components. If binary contains different spectral types: sky shows color gradient between two "suns" — e.g., blue-shifted toward primary, warmer toward secondary direction. Limb color: blended #A0B8D0. |
| Atmospheric Effects | Double Sunset/Sunrise | uDoubleSunset | OFF | Iconic Tatooine double-sun effect at terminator. Both stars visible in sky at limb, separated by 0.5–5°. Rendered as two distinct disks at horizon with individual Mie scattering halos merging. Primary disk: larger, brighter. Secondary: smaller, redder. Atmospheric refraction elongates both disks near horizon. |
| Atmospheric Effects | Binary-Modulated Cloud Patterns | uBinaryCloudMod | OFF | Cloud formation patterns responding to quasi-periodic irradiation changes from binary orbit. Enhanced convection during binary conjunction (both stars same sky direction = maximum flux), reduced during opposition. Cloud coverage oscillation ±10–20% on binary orbital timescale. FBM cloud texture modulated by u_binaryPhase uniform. |
| Surface Lighting | Double Shadow Casting | uDoubleShadow | ON | Every surface feature casts two shadows — one from each star. Shadow offset angle equals binary angular separation. Penumbra region between shadows has intermediate illumination. For close binaries: shadows nearly overlap. For wide binaries: distinct double shadows create unique surface lighting pattern. Shadow colors: #2A3040 (primary blocked) and #2A2830 (secondary blocked). |
| Surface Lighting | Antumbral Light Patches | uAntumbralPatches | OFF | Regions receiving light from one star but not the other, creating colored patches. Primary-only illuminated areas tinted toward primary color #FFF0D0. Secondary-only areas tinted toward secondary color #FFD8B0. Creates surface "patchwork" lighting effect unique to circumbinary worlds. Most dramatic when binary angular separation is large. |
| Surface Lighting | Surface Type Base | uSurfaceType | ON | Base planet appearance: gas giant (Kepler-16b analog, Saturn-like banded atmosphere #E8D8B0 zones, #C8A870 belts) or rocky (if in habitable zone, Earth-like surface with circumbinary-specific lighting applied). Default: Saturn-like gas giant matching Kepler-16b. FBM banding: 6 octaves, freq 2.0. |
| Binary Eclipse Events | Primary Eclipse | uPrimaryEclipse | OFF | Secondary star transits in front of primary (from planet's perspective). Causes measurable brightness dip — primary star partially/fully occluded for duration = binary crossing time (hours). Rendered as dark disk crossing bright primary, penumbral contact phases visible. Eclipse depth depends on size ratio. Duration: 2–12 hours typical. |
| Binary Eclipse Events | Secondary Eclipse | uSecondaryEclipse | OFF | Primary star occults secondary (from planet's perspective). Smaller brightness dip (secondary contributes less flux). Rendered as secondary disappearing behind primary disk. Combined with primary eclipse: full binary light curve is complex quasi-sinusoidal with two dips per binary orbit. |
| Binary Eclipse Events | Eclipse Shadow on Planet | uEclipseShadow | OFF | During binary mutual eclipse, planet receives reduced total flux. Surface darkening event — dramatic "mid-day dimming." Shadow deepens over eclipse ingress (minutes to hours), holds during totality, recovers during egress. Ambient light factor drops to 0.5–0.85 during eclipse. Surface temperature perturbation ΔT ~5–20 K. |
| Orbital Dynamics | Circumbinary Orbit Path | uOrbitPath | OFF | Visualization of planet's orbital trajectory around binary center of mass. Orbit is approximately elliptical but with small forced eccentricity oscillation from binary perturbation. Semi-major axis typically 0.5–2 AU. Rendered as translucent line #4A6A8A, opacity 0.12. Precession visible if animated over many orbits. |
| Orbital Dynamics | Binary Star Orbit | uBinaryOrbit | OFF | Inner binary orbital motion visualized. Two stars orbiting common center of mass with period 10–60 days. Rendered as two luminous points with orbit trails #FFE0A0 and #FFC080. Separation 0.05–0.5 AU (scaled). When combined with planet orbit: classic 3-body hierarchical visualization. |
| Orbital Dynamics | Stability Zone Indicator | uStabilityZone | OFF | Visual demarcation of inner stability limit (Holman & Wiegert 1999): planet must orbit beyond ~2.5–3.5× binary separation. Inner forbidden zone rendered as translucent red region #FF3A3A, opacity 0.05. Planet orbit safely exterior. Educational visualization of dynamical constraint. |
| Planet Properties | Atmospheric Banding | uAtmoBanding | ON | For gas giant circumbinary planets: standard banded atmosphere similar to Saturn-type. Zone colors #E8DCC0 (ammonia ice), belt colors #C8A870 (ammonium hydrosulfide). 8–12 bands. Banding pattern independent of binary illumination (interior-driven), but visible appearance modulated by changing light direction. FBM: 7 octaves, freq 2.0, gain 0.45. |
| Planet Properties | Ring System | uRingSystem | OFF | If Saturn-like: ring system with double-shadow effects from binary illumination. Ring plane #C8C0B0, opacity 0.4. Rings cast two shadows on planet (one per star). Planet casts two shadows on rings. Creates complex shadow pattern unique to circumbinary geometry. Cassini-division analog gap at 1.8× ring inner edge. |
| Planet Properties | Thermal Emission (Night Side) | uNightThermal | OFF | Night-side thermal glow from internal heat. Color #3A1A0A, emission factor 0.08. For circumbinary gas giants: "night side" shifts as binary orbital geometry changes — the darkest point moves with binary phase. Temperature ~100–150 K for Saturn analog. |
| Shadow Geometry | Penumbra Blending Zone | uPenumbraZone | ON | Region between the two cast shadows where one star is blocked but other illuminates. Creates intermediate-brightness zones with color tint of the unblocked star only. Width depends on binary angular separation and object height. Key visual differentiator from single-star illumination. Soft gradient transition, width 0.5–3° angular. |
| Shadow Geometry | Conjunction Unified Shadow | uConjunctionShadow | OFF | During binary conjunction (both stars at similar sky position from planet's view): shadows merge into single deeper shadow. Transition from double → merged → double shadow as binary orbits. Animated over binary orbital period. Shadow depth at conjunction: sum of individual shadows. |
| Camera | Dual-Star Illuminated View | uCameraMode | ON | Default view: planet at ~5 Rp distance, illuminated by both binary components visible in background. Shows double illumination effects, shadow multiplicity, and blended atmospheric scattering. FOV 50°. Both stars rendered as small disks with appropriate colors and sizes. |
| Camera | Binary System Overview | uCameraMode | OFF | Zoomed-out view: binary star pair at center, planet orbit visible. Shows hierarchical orbital architecture. Distance: 2× planet semi-major axis. Binary orbital motion animated (fast), planet orbital motion visible (slow). Scale indicators for separation distances. |
| Camera | Surface Double-Sunset View | uCameraMode | OFF | Low-angle view from planet surface/cloud-top level showing both stars near horizon. Iconic "Tatooine sunset" perspective. Stars rendered at appropriate angular sizes and separations. Atmospheric scattering halos for each star. Sky gradient blending two illumination colors. |
| Camera | Time Speed Multiplier | uTimeSpeed | 100x | 1 real second = ~1.5 hours. Binary orbital period (10-60 days) visible over 30-60 real seconds. Planet rotation visible. Eclipse events occur naturally during observation. |

---

### Directly Imaged Giant (Young Giant Exoplanet)

**Entity ID:** ENT-2041
**Description:** Young (10–100 Myr) massive giant planet (2–15 M_Jup) still glowing brightly from formation heat, detectable via direct imaging at wide orbital separations (10–200 AU). These planets are self-luminous with effective temperatures 800–2500 K, appearing as point sources or barely resolved disks in high-contrast coronagraphic observations. Colors range from deep red #8A2A0A (cooler, ~800 K, L-type spectral) through warm orange #C85A1A (~1500 K) to dull yellow #D8A840 (~2500 K, early formation). Thick silicate/iron cloud decks, vigorous atmospheric convection, and rapid rotation (~6–12 hour periods, spin preserved from formation). Real exemplars: HR 8799 b/c/d/e (4-planet system, ~30 Myr), Beta Pictoris b (12 M_Jup, ~23 Myr), 51 Eridani b (coolest directly imaged, ~2 M_Jup, ~20 Myr), AF Leporis b (JWST characterized).

**Section Count:** 8 (Thermal Luminosity, Cloud Structure, Atmospheric Dynamics, Formation Context, Spectral Features, Debris Interaction, Companion Planets, Camera)
**Feature Count:** 27

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Thermal Luminosity | Self-Luminous Disk | uSelfLuminous | ON | Primary visual feature: planet's own thermal emission dominates over reflected starlight (contrast ratio self/reflected > 10:1 at these ages). Full-disk glow: #8A2A0A (T_eff 800 K, late L-type) → #C85A1A (1200 K, mid L) → #D8A840 (2000 K, early L) → #E8C860 (2500 K, near formation). Blackbody color mapping with molecular absorption corrections. Luminosity ~10⁻⁵ to 10⁻³ L☉. |
| Thermal Luminosity | Luminosity Evolution Track | uLumiEvolution | OFF | Visualization of cooling over time. Planet fades and reddens: T_eff decreases ~50% per decade of log(age). Animated sequence showing 10 Myr → 100 Myr → 1 Gyr appearance. Color track: #E8C860 → #C85A1A → #5A1A0A. Size slightly contracts as planet cools (Kelvin-Helmholtz contraction). Demonstrates why youth enables direct imaging. |
| Thermal Luminosity | Bolometric Pulsation | uBoloPulsation | OFF | Low-amplitude (~1–5%) brightness variability from rotation-modulated cloud coverage and convective evolution. Period = rotation period (6–12 hours). Rendered as sinusoidal intensity modulation. Provides rotation period measurement technique. Light curve shape depends on cloud patchiness distribution. |
| Cloud Structure | Silicate Cloud Deck | uSilicateClouds | ON | Dominant cloud layer for T_eff > 1200 K: forsterite (Mg₂SiO₄) and enstatite (MgSiO₃) condensate clouds at 1–10 bar. Cloud color contribution: #A07050 (iron-bearing silicates add warm brown tint). Thick (optical depth τ > 3), veiling deeper hotter layers. Patchy coverage 60–90%. FBM: 8 octaves, freq 2.5, gain 0.5. |
| Cloud Structure | Iron Cloud Layer | uIronClouds | ON | Deeper cloud deck of liquid iron droplets (T_cond ~1800 K, at ~30–100 bar for hot young giants). Not directly visible but modulates emergent spectrum and contributes to "cloud holes" brightness variations. Color when glimpsed through silicate gaps: #6A3A1A (extremely hot deep layer). Optical depth τ > 5. |
| Cloud Structure | Cloud Holes (Clearings) | uCloudHoles | ON | Gaps in upper silicate cloud deck revealing deeper, hotter atmospheric layers. Appear as brighter spots: ΔT_brightness +200–500 K above cloud-top regions. Color in holes: #D07030 (hot deep atmosphere visible). Diameter 2000–15000 km. 3–8 major holes per hemisphere. Primary source of rotational variability signal (Apai et al. 2013 results for 2MASS J2139). |
| Cloud Structure | L-T Transition Patchy Clouds | uLTTransition | OFF | For planets at L/T spectral type boundary (~1200–1400 K): extremely patchy cloud coverage with large contrast between cloudy and clear regions. Cloud fraction decreasing dramatically. Cloudy patches #A07050, clear sky #D8A040 (methane/CO dominated). Creates highest-amplitude variability (up to 10–30%). Patchy Voronoi pattern, 8–15 patches. |
| Atmospheric Dynamics | Rotational Banding | uRotationalBanding | ON | Latitudinal banding from rapid rotation (6–12 hours). Coriolis-dominated circulation creates zonal jets similar to Jupiter but at higher temperatures. Band contrast: warm belts #C06A2A / cooler zones #9A5830. 6–10 bands. Rapidly rotating: oblateness (equatorial bulge) 2–5%. FBM band perturbation: freq 3.0, amp 0.05. |
| Atmospheric Dynamics | Equatorial Jet Stream | uEquatorialJet | ON | Strong prograde equatorial superrotation. Wind speed 1–5 km/s (faster than Jupiter's 0.15 km/s due to higher internal heat flux driving). Visible as cloud pattern advection — equatorial features move ahead of higher-latitude features. Animated cloud drift, equatorial velocity 2× polar velocity. |
| Atmospheric Dynamics | Convective Storm Plumes | uConvectiveStorms | ON | Vigorous convective overturn from enormous internal heat flux (10⁴–10⁵× Jupiter's). Large convective cells breach cloud deck: bright #D88040 plume tops emerging through darker cloud layer. Cell size 5000–20000 km. Lifetime 1–10 hours. 5–15 active plumes visible, continuously forming and dissipating. |
| Atmospheric Dynamics | Vertical Mixing Haze | uVerticalHaze | OFF | Chemical disequilibrium haze from strong vertical mixing (CO/CH₄ and N₂/NH₃ interconversion quenching). Thin high-altitude haze #B09070, opacity 0.08, at 0.01–0.1 bar. Reduces amplitude of molecular features in spectrum. More prominent in lower-gravity (younger/less massive) planets. |
| Formation Context | Protoplanetary Disk Remnant | uProtoDiskRemnant | OFF | For youngest examples (<20 Myr): residual circumplanetary disk material. Rendered as faint disk/torus #806040, opacity 0.04, at 5–50 R_Jup. May feed satellite formation (forming its own moon system). Edge-on appearance as dark band with scattered-light surfaces. |
| Formation Context | Accretion Luminosity Component | uAccretionLumi | OFF | For actively accreting young giants: additional luminosity from gas infall. Adds blueshifted emission component — hydrogen Balmer-series recombination at accretion shock. Rendered as UV-bright patches #A0A0FF at magnetic poles or disk edge, contributing 10–50% extra luminosity. PDS 70 b/c analog. |
| Formation Context | Hot-Start vs Cold-Start Indicator | uFormationModel | OFF | Toggle between "hot start" (gravitational instability, high initial entropy, brighter at given age) and "cold start" (core accretion, lower initial entropy, dimmer) evolutionary models. Hot start: 3–10× brighter than cold start at same age/mass. Affects all luminosity/color calculations. Default: hot start (most directly imaged planets consistent with this). |
| Spectral Features | CO/CH₄ Band Visualization | uCOCH4Bands | OFF | Molecular absorption band visualization in atmosphere. CO absorption at 4.7 μm dominant for T > 1200 K. CH₄ at 3.3 μm becomes dominant for T < 1200 K (L→T transition marker). Rendered as color-coded atmospheric opacity layer: CO-dominated #D0A060, CH₄-dominated #6A8A5A. Educational: shows spectral typing basis. |
| Spectral Features | Water Vapor Absorption | uH2OAbsorption | OFF | Strong H₂O absorption bands throughout near-IR. Renders as selective opacity in atmospheric shell — deepens limb darkening at specific wavelengths. Visual effect: slight blue-ward shift of emergent color compared to pure blackbody (water removes red/IR flux). Limb darkening enhanced by factor 1.3 due to water opacity. |
| Debris Interaction | Hill Sphere Boundary | uHillSphere | OFF | Gravitational sphere of influence visualization. Radius R_Hill = a(M_p/3M_star)^(1/3), typically 1–10 AU for wide-orbit giants. Rendered as translucent sphere #4A5A6A, opacity 0.03. Debris/moons bound within this sphere. Tidal truncation of circumplanetary disk at ~R_Hill/3. |
| Debris Interaction | Debris Ring/Belt Interaction | uDebrisInteraction | OFF | Planet's gravitational influence on host system's debris disk. Creates gap in debris disk (Wisdom gap ∝ M_p^(2/7)), scatters planetesimals creating zodiacal dust. Rendered at system-scale zoom: debris disk #C8B890, gap centered on planet orbit. Gap width indicator of planet mass — diagnostic used in disk imaging. |
| Companion Planets | Multi-Planet System | uMultiPlanet | OFF | For HR 8799-type systems: additional directly imaged companions at different orbital radii. Render up to 4 companions (HR 8799 b/c/d/e) at 14, 24, 38, 68 AU with appropriate T_eff and colors for each. Each companion self-luminous with own cloud structure. Orbital motion animated (periods ~50–500 years). |
| Companion Planets | Planet-Planet Interaction | uPPInteraction | OFF | Gravitational interaction visualization between companions. Mean-motion resonance indicators: orbital period ratios displayed. For HR 8799: near 1:2:4:8 resonance chain. Rendered as connecting lines between companions during conjunction, color #5A7A9A, opacity 0.1. Illustrates dynamical stability mechanism. |
| Camera | Coronagraphic View | uCameraMode | ON | Default view: planet as resolved point/disk with host star blocked by coronagraph. Central occulting spot #000000 blocking star, planet visible at separation. Diffraction pattern artifacts (speckles) faintly rendered around mask. Planet at ~500 Rp from star in field. Mimics actual high-contrast imaging. |
| Camera | Resolved Disk View | uCameraMode | OFF | Zoomed to planet surface level, ~4 Rp distance. Shows cloud structure, banding, hot spots, and rotation as if future telescope could resolve disk. Self-luminous glow dominates visual — no reflected starlight needed. FOV 50°. Emphasizes what these worlds would look like up close. |
| Camera | System Architecture View | uCameraMode | OFF | Zoomed out to show full planetary system: host star, multiple companions at various distances, debris disk. Orbital paths rendered. Educational context: shows how direct imaging targets are wide-separation worlds. Scale: 200 AU field width. |
| Camera | Time Speed Multiplier | uTimeSpeed | 200x | 1 real second = ~3 planet-hours. Rapid rotation (6–12 hr period) clearly visible. Cloud evolution, storm formation/dissipation, and rotational variability apparent. Full rotation in ~3–6 real seconds. |

---

## 7. Moons

Moons exhibit extraordinary diversity despite sharing the "natural satellite" classification. Luna is a relatively quiet gray rocky moon; Io is the most volcanically active body in the Solar System; Europa hides a deep subsurface ocean beneath an ice crust; Titan has a thick nitrogen-methane atmosphere and liquid hydrocarbon lakes; Enceladus shoots cryogeysers into space; Ganymede has an intrinsic magnetic dynamo.

### Luna (Earth Moon)

**Entity ID:** ENT-3001
**Description:** Earth's natural satellite, ancient cratered terrestrial body with dark maria (#5A5C5E dark basalt) and bright highlands (#9A9A9A lighter anorthosite), prominent crater ray system (Tycho), near-side tidal locking, permanent shadows hosting water ice, and thin exosphere. Real exemplars: The Moon.

**Section Count:** 9 (Highlands & Maria, Crater System, Regolith Texture, Rays & Ejecta, Earthshine Illumination, Terminator Shadows, Polar Water Ice, Thin Exosphere, Human Artifacts speculative, Camera)
**Total Feature Count:** 27

#### Highlands & Maria (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Surface | Lunar Highlands | uHighlands | ON | Bright, heavily cratered uplands (#9A9A9A light gray, coverage ~83%). Ancient anorthosite-rich crust. Detailed crater distribution via Worley noise (freq 8.0, 12.0, 18.0) at all scales. Darker regions (#7A7A8A slightly tinted) in deep crater shadows. Modeled via heightmap with sharp rim shadows. Shader: high-frequency normal perturbation; crater rim shadow via normal map. |
| Surface | Lunar Maria | uMaria | ON | Dark basaltic plains (#5A5C5E very dark gray, coverage ~15%). Younger lava flows from ~1–2 Gyr ago. Smoother texture, fewer craters. Located in large basins (Mare Imbrium, Mare Tranquillitatis, Mare Serenitatis, Oceanus Procellarum, Mare Crisium). FBM (freq 6.0) for subtle surface roughness. Shader: darker base color; reduced normal perturbation amplitude. |
| Surface | Mare-Upland Boundary | uMariaBoundary | ON | Sharp boundaries between maria and highlands; color transition #5A5C5E to #9A9A9A over ~10–50 km. Rendered via interpolated color boundary in transition zones. Represents geological contact. Shader: sharp color interpolation at domain boundaries. |
| Surface | Swirls & Albedo Variations | uSwirls | OFF | Bright wispy features (TiO₂-rich regions, magnetic anomaly associations). Examples: Reiner Gamma. Color #B0B0C0 (brighter, 0.15 luminance boost), ~10–50 km width, hundreds of km length. FBM-modulated bright streaks. Shader: additive bright line/patch overlay. |

#### Crater System (5 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Craters | Impact Crater Distribution | uCraters | ON | Multi-generational crater population: ancient (heavily degraded), intermediate (sharp rims), fresh (bright rays). Size range 100 m–2500 km. Worley cellular noise at scales freq 5.0, 12.0, 25.0. Crater density ~150 per 10^6 km² (highlands more saturated than Mercury). Rendered via heightmap + normal map rim sharpening. Shader: height displacement; per-crater rim shadow computation. |
| Craters | Tycho Crater Rays | uTychoCrater | ON | Prominent fresh crater Tycho (~86 km diameter, latitude –43.3°, longitude –11.4°W) with brilliant ray system extending 1500+ km radially. Ray color #D5D0C8 (very bright, 0.25 luminance boost). Ray opacity fades with distance via exponential decay. Rendered as radiant distance-field rays from Tycho center. Shader: ray distance field; additive overlay blend. |
| Craters | Central Peak Craters | uCentralPeaks | ON | Large craters (>20 km) show central peak/ring structure. Peak height 100–1000 m above crater floor. Generated via multi-layer heightmap: depressed basin + raised central peaks via gaussian bumps. Examples: Copernicus, Aristarchus. Shader: heightmap layers; normal map for peak facets. |
| Craters | Ejecta & Rays | uEjectaRays | ON | Radial ejecta blankets surrounding craters >5 km diameter. Brighter (#E8E0D8, 0.1 boost) rough texture extending 10–30 crater radii. Modeled via distance-based color/height modulation. Shader: distance-field alpha falloff; additive glow. |
| Craters | Secondary Crater Chains | uSecondaryChains | OFF | Smaller craters (<5 km) from ballistic ejecta form radial chains from large impact sources. Chains extend 10–100 km. Worley sub-octave (freq 35.0) with directional bias. Shader: tessellation/displacement for fine detail. |

#### Regolith Texture (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Surface | Regolith Grain Structure | uRegolith | ON | Fine dust layer (grain size ~0.1 mm average) creates rough surface appearance. FBM noise (freq 22.0, 6 octaves) modulates normal map for bumpy texture. Represents ~1–20 m of fine regolith blanket across surface. Shader: high-frequency normal perturbation; additive microcavity shadows. |
| Surface | Space Weathering Reddening | uSpaceWeathering | OFF | Solar wind sputtering and cosmic ray damage darken surface slightly over time. Reddish tint (#8A7A7A subtle brown) develops on older regolith. Age-dependent color darkening. Shader: conditional color tint in old-regolith zones. |

#### Rays & Ejecta (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Rays | Bright Ray Systems | uRaySystems | ON | High-albedo ejecta rays from fresh young craters (Tycho, Copernicus, Aristarchus). Rays #D5D0C8 bright, extend 100–1500 km. Multiple ray families from different craters visible simultaneously. Generated via multi-center radial distance fields. Shader: additive ray rendering; opacity fades with distance. |
| Rays | Ray Degradation Over Time | uRayDegradation | OFF | Older rays gradually darken as space weathering accumulates. Procedural age-map causes Tycho rays to brighten while older rays dimmer. Shader: lerp ray color based on procedural age gradient. |

#### Earthshine Illumination (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Earthshine | Earthshine Illumination | uEarthshine | ON | Night-side of Moon faintly illuminated by sunlight reflected from Earth. Dim secondary light source adding ~0.1–0.3 illumination to night-side craters. Modeled via additional directional light from opposite direction of sun (Earth is opposite sun from Moon perspective). Shader: secondary directional light pass; low intensity diffuse contribution. |
| Earthshine | Earthshine Color Tint | uEarthshineTint | OFF | Earth reflects blue-tinted light (ocean/atmosphere scattering); subtle blue tint (#7AC4E8, 0.05 intensity) visible on Moon night-side. Speculative accurate color. Shader: blue-tinted secondary light contribution. |

#### Terminator Shadows (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Terminator | Crater Rim Shadowing | uTerminatorShadow | ON | Craters at terminator cast deep shadows into basins. Shadow length increases as sun approaches horizon (exaggerated 3D relief). Self-shadowing via normal map dot product. Contributes 50%+ of perceived depth. Shader: per-pixel shadow computation via dot(normal, lightDir) with smoothstep threshold. |
| Terminator | Terminator Brightness Gradient | uTerminatorGradient | ON | Sharp color transition at terminator; lit side bright (#9A9A9A), shadow side dim (#4A4A5A). Gradient width ~30 km. Rendered via Fresnel-based rim darkening with steep falloff. Shader: Fresnel brightness modulation; abrupt transition. |

#### Polar Water Ice (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Polar | Permanent Shadow Craters | uPermanentShadow | ON | Radar-dark regions at poles (N & S) in permanently shadowed craters; sunlight never reaches. Rendered as no-light zones; add faint internal glow (#5F6E8C very dim blue, 0.05 intensity) to indicate water ice detected by LOLA/radar. Coverage ~13,000–16,000 km² per pole (~31,000 km² total). Shader: suppress lighting in shadow; add subtle emissive glow. |
| Polar | Water Ice Deposits | uWaterIce | ON | Actual H₂O ice (#E8F4FF bright blue-white, albedo 0.85) in permanent shadow craters, ~1 m–100 m depth layer. Thickness modeled via height displacement. Animation: none (static). Shader: bright blue-tinted color; high specularity. |
| Polar | Transient Frost Rings | uFrostRings | OFF | Seasonal frost formation at high latitudes (>75°) during polar winter; rim of frost (#F0F5FF pale blue-white, 0.3 opacity, ~5–20 km width) around pole. Animated appearance/disappearance with lunar day/night cycle. Shader: conditional color blend at high latitudes; lerp opacity with time. |

#### Thin Exosphere (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Exosphere | Sodium & Potassium Emissions | uExosphereEmission | OFF | Faint sodium (D-line) and potassium emissions from solar wind sputtering. Faint golden (#FFD700, 0.1 intensity) halo ~0.2 Rp extent. Procedural glow. Shader: additive glow pass at limb. |
| Exosphere | Exosphere Dust | uExosphereDust | OFF | Lunar dust in exosphere from micrometeorite bombardment; very faint haze (#B0B0C0, 0.05 opacity) near surface. Shader: volumetric fog at low density near surface. |

#### Human Artifacts (speculative, 2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Human | Apollo Landing Sites | uApolloSites | OFF | Speculative highlight of Apollo 11–17 landing sites: small bright patches (#FFFFFF white, 0.3 intensity, ~5–10 km extent) at Mare Tranquillitatis (A11), Descartes Highlands (A16), Hadley-Apennine (A15), etc. Fixed world coordinates. Shader: additive point-light billboards. |
| Human | Lunar Base Infrastructure (speculative future) | uLunarBase | OFF | Speculative future permanent habitats; brighter pinpoints (#87CEEB blue-white, 0.4 intensity) at poles (water ice proximity) or equator (thermal stability). Shader: additive emissive patches. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Light Direction | uLightDir | AUTO | Distant sun; auto-orbit reveals crater distribution, Tycho rays, terminator shadows, and earthshine on night-side. |
| Camera | Time Speed Multiplier | uTimeSpeed | 30x | 1 real second = 1 lunar hour (~2.55 hours true). Full 29.5-day lunar month in ~35 real minutes. Terminator shadow progression and earthshine variation visible. |
| Camera | Auto-Rotate | uAutoRotate | ON | Full rotation reveals mare/highland distribution, major craters (Tycho, Copernicus), ray systems, and polar regions. |

---

### Io (Volcanic Moon)

**Entity ID:** ENT-3010
**Description:** Jupiter's innermost large moon, extraordinarily volcanically active (#F8E68E yellow sulfur surface with orange allotropes #F4943E, dark basaltic regions #701E0B), tidally-heated interior, 300+ km-tall plumes, SO₂ frost deposits, and magnetic flux tube interaction. Real exemplars: Io.

**Section Count:** 9 (Molten Interior & Tidal Heating, Active Volcanoes, Sulfur Surface, Lava Lakes, Volcanic Plumes, SO₂ Frost, Torus Exosphere, Magnetic Flux Tube, Camera)
**Total Feature Count:** 26

#### Molten Interior & Tidal Heating (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Tidal | Tidal Heating Dissipation | uTidalHeating | ON | Intense tidal flexing by Jupiter's gravity (eccentricity 0.004, semi-major axis 421,700 km) heats interior to ~1200+ K. Rendered as heightened surface glow (#FF4400 bright orange, +0.3 intensity) with hotspot concentration. Tidal heating varies with orbital position; brightest at periapsis. Shader: time-dependent brightness modulation based on orbital phase; emissive pass. |
| Tidal | Volcanic Activity Distribution | uVolcanicActivity | ON | ~150–400+ active volcanic vents (evolving count) scattered across surface. High concentration at equator and mid-latitudes (tidal stress zones). Rendered as procedural bright pinpoints (#FF6B35, emissive 0.7) clustered via Worley noise (freq 4.0). Shader: procedurally placed emissive points. |
| Tidal | Subsurface Magma Channels | uMagmaChannels | OFF | Glowing pathways of subsurface magma visible as bright linear features (#FF4400, 0.2 intensity) connecting volcanoes. Represents magma conduit network. FBM-based branching. Shader: bright line rendering. |

#### Active Volcanoes (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Volcanoes | Loki Patera Volcano | uLokiPatera | ON | Largest active volcano, ~200 km diameter lava lake. Central island (#701E0B dark basalt) surrounded by bright #F8E68E yellow sulfur plains. Lake edge glows #FF4400 (hot lava, emissive 0.6). Located longitude ~180°, latitude ~15°S. Rendered as circular bright zone with dark center island via Voronoi structure. Shader: concentric brightness zones; emissive ring. |
| Volcanoes | Multiple Patera Systems | uPateraNetwork | ON | Other major calderas (Prometheus, Pele, Ra Patera, etc.); each ~10–150 km diameter with bright yellow (#F8E68E) floor and dark rim. Distributed around moon. Worley-based patera positioning. Shader: Voronoi cells mark patera floors; dark rim normal map. |
| Volcanoes | Volcanic Cone Structures | uVolcanicCones | OFF | Smaller cinder cones and shield volcanoes (#8B5A2B brown-red, raised 100–1000 m). Scattered across surface. Gaussian heightmap bumps. Shader: height displacement; radial slope shading. |
| Volcanoes | Lava Flow Networks | uLavaFlowNetwork | ON | Large-scale lava flows from vents spreading 50–200 km outward. Bright #FF6B35 (hot, emissive 0.5) flow cores with darker #8B4513 (cooling edges). Animated flow animation via time-dependent curl-noise velocity field. Shader: directional color modulation; additive glow along flows. |

#### Sulfur Surface (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Surface | Bright Yellow Sulfur Plains | uYellowSulfur | ON | Dominant surface composition: elemental sulfur (#F8E68E bright yellow, #F5E6D3 pale sulfur deposits). Allotropic color variations from S8 red (#D46B3E) to yellow (#F8E68E) to white (#F0E8E0) in crystalline forms. FBM (freq 12.0, 4 octaves) creates color-mixing patches. Coverage ~60%. Shader: mix multiple sulfur colors via FBM. |
| Surface | Dark Sulfur Allotropes | uDarkSulfur | ON | Dark-reddish sulfur allotropes (#701E0B very dark, #8B4513 brown-red). Found at active lava margins and older deposits. Coverage ~20%. Darker regions indicate different polymorphs or contaminated sulfur. Shader: color blend based on procedural age/temperature map. |
| Surface | Sulfur Crust Cracking | uSulfurCracks | ON | Thermal cycling causes brittle sulfur crust to crack. Linear cracks (#8B4513 dark, 100 m–1 km width) visible on yellow plains. Generated via Worley lines (freq 6.0) with junction pattern. Shader: dark line overlay via distance field. |

#### Lava Lakes (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Lava | Molten Lava Lake Cores | uMoltenLakes | ON | Active lava lakes within calderas; molten basalt (#FF4400 bright orange, emissive 0.8). Surface ~10–30 km diameter. Animated subtle surface ripples via time-dependent sine waves. Brightness pulses with ~1–2 min period. Shader: emissive color; additive bloom; ripple normal map animation. |
| Lava | Cooling Lava Crust | uLavaCrust | ON | Lava lake margins show cooling crust: dark solid basalt (#701E0B) with bright #FF6B35 active edges. Crust advancement animated at ~m/s rates. Modeled via radial color gradient from lake center. Shader: radial lerp from bright to dark; height displacement at boundary. |
| Lava | Lava Fountain Ejection | uLavaFountains | OFF | Molten lava fountains from high-viscosity sulfur/lava mix; bright jets #FF4400 extending 100–500 m upward. Procedural Poisson-scattered geysers. Shader: additive particle-like rendering; fade over height. |

#### Volcanic Plumes (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Plumes | Umbrella Plumes | uUmbrellaPlumes | ON | Classical S-O₂ plumes rise 50–300 km (Pele, Loki-style). Upper canopy flattens into distinctive mushroom/umbrella shape. Modeled as tall bright cone (brown #8B6F47 lower, #B8A0A0 mid, #E8D8D0 upper). Rendered via cone geometry or volumetric billboard. Initial core bright (#F8E68E), expansion region paler. Shader: volumetric plume rendering with gaussian profile; additive transparency. |
| Plumes | Plume Fallout Rings | uPlumeFallout | ON | S-O₂ snow fallout from plume creates elliptical bright rings (#F5E6D3 pale tan, 200–1000 km extent) downwind. Multiple overlapping rings from different eruptions visible. Generated via distance-field from plume locations with Gaussian spread. Shader: additive bright overlay; feathered edges. |
| Plumes | Plume Dynamics Animation | uPlumeAnimation | ON | Plumes rise, expand, and decay. Modeled via time-dependent height and radius oscillation: height = base_height + amplitude * sin(time / period). Plume base brightens, canopy dims. Period ~1–3 minutes (scaled). Shader: animated cone geometry or billboard scaling; lerp brightness. |
| Plumes | SO₂ Gas Spectral Emission | uSO2Emission | OFF | Speculative sulfur dioxide gas emission glow (#A0A8C0 pale purple, 0.2 intensity) visible at night-side from solar photodissociation. Faint halo around active vents. Shader: additive emissive glow. |

#### SO₂ Frost (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|---------|
| Frost | SO₂ Snow Deposits | uSO2Frost | ON | Solid SO₂ frost from condensed plume material; white (#F5F0D8 very pale, 0.9 albedo) deposits covering ~15–25% of surface. Primarily equatorial and mid-latitude zones. FBM (freq 14.0) determines frost coverage. Shader: white color blend; specularity increase. |
| Frost | Frost Boundary Sublimation | uFrostSublimation | ON | SO₂ frost sublimes in daytime heating (~120 K sublimation threshold on lit side); frost sublimation front visible as color gradient from white (#F5F0D8) to yellow sulfur (#F8E68E) over ~10 km. Shader: temperature-dependent color interpolation based on local insolation. |
| Frost | Frost Color Contamination | uFrostContamination | OFF | Some SO₂ frost contaminated by dark material (#F5E6D3 tan-tinted, 0.15 dimmer). Represents mixture of frost and fallout dust. Procedural blending. Shader: color tinting. |

#### Torus Exosphere (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Torus | Plasma Torus Glow (Io-centric) | uPlasmaGlow | OFF | Speculative: faint glow (#7AC4E8 pale cyan, 0.15 intensity) indicating interaction with Jupiter's magnetosphere plasma torus. Concentrated at equator. Shader: additive glow at equatorial region. |
| Torus | Neutral Sodium Cloud | uSodiumCloud | OFF | Neutral sodium from thermal escape creates faint yellow glow (#FFD700, 0.1 intensity, ~2 Rp extent) around Io. Represents source of Jupiter's sodium torus. Shader: limb glow via Fresnel. |

#### Magnetic Flux Tube (1 feature)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|---------|
| Magnetic | Footprint Brightening | uMagneticFootprint | OFF | Faint aurora-like brightening (#7AC4E8 pale cyan, 0.1 intensity) at magnetic flux tube footprint (connection points to Jupiter magnetosphere). Located at fixed high latitudes. Speculative. Shader: additive glow in footprint regions. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Light Direction | uLightDir | AUTO | Distant Sun & nearby Jupiter light; auto-orbit reveals volcanic plumes, lava lakes, and SO₂ frost distribution. |
| Camera | Time Speed Multiplier | uTimeSpeed | 100x | 1 real second = 1 Io minute (~0.02 seconds true). 1.77 Earth day orbital period completes in ~1.5 real minutes. Plume dynamics and lava lake pulsing visible. |
| Camera | Auto-Rotate | uAutoRotate | ON | Full rotation reveals Loki Patera, multiple patera systems, volcanic plumes, sulfur plains, and SO₂ frost rings. |

---

### Europa (Ice Moon)

**Entity ID:** ENT-3011
**Description:** Jupiter's moon with fractured water-ice crust (#EEF0F0 bright white, #B8A880 tan non-ice compounds), extensive lineae ridge systems, chaos terrain, and subsurface liquid ocean (~100 km deep). Tidal heating maintains ocean liquid state. Real exemplars: Europa.

**Section Count:** 9 (Ice Crust, Lineae & Ridges, Chaos Terrain, Subsurface Ocean (speculative), Cryovolcanism, Tidal Cracks, Induced Magnetic Field, Salt Deposits, Camera)
**Total Feature Count:** 25

#### Ice Crust (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Ice | Water Ice Surface | uIceCrust | ON | Bright white water ice (#EEF0F0, ~0.67 geometric albedo) covering 85–90% of surface. Smooth texture (no craters >10 km due to convective refreshing). FBM (freq 10.0, 3 octaves) creates subtle undulation. Represents ~20–30 km thick icy shell (Juno 2022: 29±10 km). Shader: high-specularity blue-white color; low normal perturbation. |
| Ice | Ice Thickness Variation | uIceThickness | OFF | Thicker ice (light #F0F5FF) at poles, thinner (~1 km) at equator (thermal convection). Subtle color variation (#EEF0F0 vs #F0F5FF) across latitudes. Shader: latitude-based color interpolation. |
| Ice | Radiation Darkening | uRadiationDarkening | ON | Jovian magnetosphere radiation (particularly high-energy electrons) darkens ice; darker patches (#D0D5E8 slightly tinted, 0.15% darker) at high latitudes and leading hemisphere. Represented via procedural age/radiation map. Shader: conditional color darkening. |
| Ice | Residual Crater Structures | uCraterRemnants | OFF | Rare ancient craters now relaxed to subtle depressions (few km relief). Detected via radar/shadow. Modeled as gentle depressions with faint rim brightening. Shader: low-relief heightmap. |

#### Lineae & Ridges (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Lineae | Linear Ridge Systems | uLinearLineae | ON | Prominent linear features (lineae); bright ice ridges (#F0F5FF very pale, 0.1 luminance boost) flanking reddish-brown troughs (#8B6B50 warm brown from irradiated sulfur/salt non-ice material, 0.15 reduction). Width 1–3 km, length 100–1000 km. Oriented globally via directional FBM (freq 8.0) with anisotropic bias. Ridge shadows add 3D depth at terminator. Galileo reprocessed color imagery confirms distinctly reddish-brown lineae color. Shader: directional normal perturbation; anisotropic heightmap. |
| Lineae | Double Ridge Features | uDoubleRidges | ON | Characteristic double-ridge structure: central trough (#7A6050 warm reddish-brown from non-ice material — sulfates, irradiated sulfur compounds) flanked by raised ice ridges (#F0F5FF bright). Represents strike-slip faulting or cryovolcanic intrusion. Width separation ~1–2 km. Modeled via two parallel heightmap ridges. Shader: heightmap with dual-ridge profile. |
| Lineae | Triple Ridge Pattern | uTripleRidges | OFF | Some regions show triple or more ridges. Speculative. Shader: additive ridge pattern overlay. |
| Lineae | Lineae Age Variation | uLinaeAge | OFF | Older lineae darker (#D0D5E8 tinted), younger brighter (#F0F5FF). Procedural age-map determines color. Shader: lerp ridge color based on procedural age. |

#### Chaos Terrain (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Chaos | Conamara Chaos Region | uConamaraIceChaos | ON | Major chaotic terrain: jumbled blocks of ice, tilted plates, and refrozen cracks. Located ~75°E, 10°N. Covers ~50,000 km². Rendered as highly broken heightmap with rapid elevation changes. Color mix #D8E0E8 (tilted plates) with darker #A0A8B8 (deep rifts). Normal map highly perturbed. Shader: multi-layer heightmap; high-frequency normal perturbation. |
| Chaos | Chaos Block Displacement | uChaosBlocks | ON | Displaced crustal blocks indicate subsurface disruption (possible upwelling or overturn event). Block outlines visible as subtle color boundaries (#C0C5D8 block edges) with ~1–2 km relief differences. Voronoi-based block generation. Shader: Voronoi cell boundaries with height variation. |
| Chaos | Subsurface Access Points | uChaosUpwelling | OFF | Speculative: chaotic regions may represent areas of subsurface water upwelling. Faint blue glow (#7AC4E8, 0.1 intensity) in chaos zones indicates ocean contact. Shader: additive glow in chaos regions. |

#### Subsurface Ocean (speculative, 2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Ocean | Ocean Glow Indicator | uOceanGlow | OFF | Speculative: faint blue luminescence (#87CEEB pale, 0.08 intensity) representing bioluminescent organisms or thermal activity in subsurface ocean, visible through thin ice cracks. Concentrated at chaos and vent regions. Shader: additive glow pass through ice. |
| Ocean | Tidal Heating Warmth Signature | uThermalSignature | OFF | Speculative thermal IR glow (#FF6B35 dim orange, 0.05 intensity) from subsurface tidal heating, detectable via cracks. Shader: emissive color in fracture zones. |

#### Cryovolcanism (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Cryo | Cryovolcanic Plumes (Hubble detection) | uCryoPlumes | OFF | Speculative: water plumes detected by HST; bright jets (#E8F0F8 pale white, 0.5 intensity) extending 100–200 km from south polar region. Plume life ~1 minute (rapid freezing). Procedural geyser animation. Shader: additive cone billboard; fade with time. |
| Cryo | Ice Eruption Deposits | uIceEruptionDeposits | OFF | Speculative: cryovolcanic deposits form bright patches (#F5F0D8 very pale, 0.85 albedo, larger than radiation damage zones). Located at suspected vent fields. Procedural placement. Shader: bright color blend. |

#### Tidal Cracks (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Tidal | Tidal Flexure Fractures | uTidalFractures | ON | Tidal stress from orbital eccentricity (0.009) causes cyclic flexure; fractures visible as network of intersecting cracks. Generated via procedural fractal crack network (FBM at freq 5.0, 12.0). Dark lines (#6B7B8B, 0.2 opacity, 100 m–1 km width) span continents. Shader: crack network overlay; additive shadow. |
| Tidal | Rift Zone Widening | uRiftZones | OFF | Specific zones (e.g., Pwyll region) show widening rifts indicating active spreading. Rift width animation: oscillates width by ±10% with ~orbital period. Shader: time-dependent line width modulation. |
| Tidal | Tidal Stress Direction Indicator | uStressDirection | OFF | Tidal stress is tidally-locked (sub-Jovian point experiences maximum stress). Crack orientation predominantly aligned E-W and N-S (quadrupole pattern). Shader: oriented line rendering via 2D orientation field. |

#### Induced Magnetic Field (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Magnetic | Induced Dipole Field Lines | uInducedDipole | OFF | Europa's subsurface ocean is conductive; induces dipole field in response to Jupiter's magnetosphere. Blue field lines (#4A7FB5, 0.2 opacity) looping from magnetic poles. Modeled via line-rendering or volumetric visualization. Shader: additive line rendering with Fresnel fade. |
| Magnetic | Magnetotail Region | uMagnetotail | OFF | Magnetotail extends anti-Jovian; faint glow (#5A7FBF, 0.15 intensity, ~5 Rp extent). Shader: volumetric fog shaped by magnetosphere pressure direction. |

#### Salt Deposits (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Salt | Chloride Salt Deposits | uSaltDeposits | ON | Mineral deposits (magnesium sulfate, sodium chloride) from ocean upwelling; tan-reddish patches (#B8A880 prominent, #D4B8A0 lighter, 0.1 brighter than pure ice). Concentrated at chaos regions and presumed vent zones. FBM (freq 12.0) determines distribution. Shader: color blend in designated zones. |
| Salt | Salt Color Variation | uSaltVariation | OFF | Salt deposits show color variation (#A0805F dark brown) to (#F0C8A0 light tan) based on mineral type. Procedural color diversity. Shader: multi-color salt blend via FBM. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Light Direction | uLightDir | AUTO | Distant sun & nearby Jupiter; auto-orbit reveals lineae patterns, chaos terrain, and salt deposit distribution. |
| Camera | Time Speed Multiplier | uTimeSpeed | 50x | 1 real second = 1 Europa hour (~3.55 hours true). 3.55 Earth day orbital period completes in ~8.5 real minutes. Tidal crack animation and potential plume activity visible. |
| Camera | Auto-Rotate | uAutoRotate | ON | Full rotation reveals global lineae system, Conamara chaos, north/south poles, and regional salt concentrations. |

---

### Titan (Hazy Moon)

**Entity ID:** ENT-3020
**Description:** Saturn's largest moon, shrouded in thick nitrogen atmosphere with organic haze (#E8B866 orange-tan upper layer, dense opacity), surface of water-ice bedrock with hydrocarbon lakes/seas (#1A2A4A dark regions), methane rain, cryovolcanic features, and prebiotic chemistry. Real exemplars: Titan.

**Section Count:** 9 (Thick Nitrogen Atmosphere, Upper Haze Layers, Surface Topography, Hydrocarbon Lakes & Seas, Methane Weather, Cryovolcanic Features, Dune Fields, Seasonal Wind Patterns, Camera)
**Total Feature Count:** 25

#### Thick Nitrogen Atmosphere (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Atmosphere | Atmospheric Haze Opacity | uAtmosphereHaze | ON | Opaque nitrogen-methane atmosphere with organic aerosol haze (#E8B866 tan-orange dominant, #D9A456 darker mid-layer, #D8A85F lighter upper). Optical depth ~7–8; surface never directly visible from space. Volumetric fog sphere at high density. Altitude ~200 km. Shader: volumetric raymarching with exponential density falloff. |
| Atmosphere | Upper Haze Layer Brightness | uUpperHaze | ON | Upper atmosphere layer (#D8A85F pale orange) brighter due to lower aerosol density. Altitude 100–200 km. Fresnel-based rim brightening. Shader: Rayleigh-like scattering; brighter at limb. |
| Atmosphere | Stratospheric Temperature Inversion | uStratosphere | OFF | Upper stratosphere (~200+ km) slightly cooler, causing subtle color tint shift (#D0A875 slightly different hue). Procedural. Shader: conditional color tint at upper altitude. |
| Atmosphere | Atmospheric Circulation Bands | uAtmosBands | ON | Zonal bands of different haze intensity (latitude-dependent circulation). Banding visible as subtle brightness stripes (#E8B866 bright bands alternating #D9A456 darker). Latitude-based sinusoidal brightness modulation. Shader: latitude-dependent color multiplier. |

#### Upper Haze Layers (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Haze | Tholin Organic Haze | uTholinHaze | ON | Complex organic molecules (tholins) created by UV photochemistry; create orange color. FBM (freq 16.0, 5 octaves) creates cloudy texture structure within haze. Modeled as volumetric fog with internal structure. Shader: volumetric fog with fractal pattern inside. |
| Haze | Methane Condensation Clouds | uMethaneClouds | ON | Methane vapor condenses into ice crystals at high altitudes, forming white cloud layers (#F8F8E8 pale white, 0.6 opacity, ~8–30 km altitude per Huygens/Cassini). Coverage ~30% variable. FBM (freq 12.0) determines cloud distribution. Shader: additive cloud layer; curl-noise advection for dynamics. |
| Haze | Haze Color Variation | uHazeVariation | OFF | Seasonal variation in tholin production; haze color oscillates slightly (#E8B866 bright) to (#D9A456 darker) with period ~29.5 Earth years (Titan year). Shader: time-dependent color tint. |

#### Surface Topography (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Surface | Water-Ice Bedrock Elevation | uBedrockElevation | ON | Surface beneath haze (not directly visible) is water-ice bedrock at ~94 K. Topography varies; high mountains (Xanadu plateau ~2 km relief), plains, and dune-filled regions. Modeled via procedural heightmap (FBM freq 6.0). Shader: heightmap-based vertex displacement; normal map for relief. |
| Surface | Xanadu Region (bright terrain) | uXanaduRegion | OFF | Speculative visible: bright equatorial region (Xanadu), covered in icy highland terrain (#D0E0F0 pale blue-white if visible). Size ~4000 × 2000 km. Shader: conditional bright color overlay for speculative transparency toggle. |

#### Hydrocarbon Lakes & Seas (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Hydro | Kraken Mare (liquid hydrocarbon sea) | uKrakenMare | OFF | Largest hydrocarbon sea at north pole; liquid methane/ethane. If surface visible: #1A2A4A very dark navy blue (#0A1A3A deepest areas). Diameter ~1000 km. Flat surface with subtle ripples. Shader: dark liquid color; low normal perturbation. |
| Hydro | Ligeia Mare | uLigeiaMare | OFF | Second-largest sea, polar region; similar color #1A2A4A. Diameter ~500 km. Shader: dark liquid rendering. |
| Hydro | Small Lakes & Ponds | uSmallLakes | OFF | Numerous small methane/ethane lakes (<50 km). Scattered globally at polar latitudes. #1A2A4A dark patches. Worley-based lake distribution. Shader: dark liquid color in designated zones. |
| Hydro | Coastline Detail | uCoastlineDetail | OFF | Shoreline between ice and liquid shows complex structure (dendritic channels, deltas). If visible: thin darker lines (#0A1A3A, 100 m–1 km width) at lake margins. Procedural branching network. Shader: additive dark line rendering. |

#### Methane Weather (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Weather | Methane Precipitation (rain) | uMethaneRain | OFF | Methane rain falls from clouds (~10% probability at any moment). Rendered as faint diagonal streaks (#8FB9D9 pale blue-gray, 0.3 opacity, 10–50 km extent, 3–5 km/s velocity). Procedural Poisson-distributed rain cells. Shader: additive streak rendering; fade with distance. |
| Weather | Cumulonimbus Towers | uCumulonimbusUpper | OFF | Tall convective clouds extend above haze layer; bright white towers (#FFFACD pale, 0.6 intensity, 10–20 km tall). Rare (1–2% coverage). Procedurally scattered. Shader: additive tower billboard; gaussian falloff. |
| Weather | Wind Streaking & Advection | uWindStreaks | ON | Methane clouds advected by winds (~1–2 m/s typical, up to 10 m/s polar). Visible as streaked cloud patterns. Cloud UVs advected each frame: uv += windVelocity * time. Shader: time-dependent texture coordinate scrolling. |

#### Cryovolcanic Features (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Cryo | Cryovolcanic Domes | uCryoDomes | OFF | Speculative ice volcanic features; raised domes (#D0E0F0 pale blue, relief ~1 km) with calderas. If surface visible: gaussian heightmap bumps. Shader: height displacement; brightened dome color. |
| Cryo | Cryolava Flows | uCryoLavaFlows | OFF | Speculative water-ammonia flows from cryovolcanism; slightly darker stripes (#A0C0E0, 0.1 dimmer) on ice bedrock. Procedural flow patterns. Shader: directional color overlay. |

#### Dune Fields (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Dunes | Equatorial Sand Dunes | uSandDunes | OFF | Organic (hydrocarbon) dune fields cover ~20% of surface equatorially. If visible: tan-reddish dune patterns (#B8A88A tan, #8B7A68 darker inter-dune). Dunes oriented E-W (trade wind direction). FBM (freq 8.0) with directional anisotropy. Shader: anisotropic heightmap; directional normal perturbation. |
| Dunes | Dune Migration Animation | uDuneMigration | OFF | Winds slowly migrate dunes. Dune pattern slowly shifts via time-dependent UV scroll. Period ~10 Titan years (300+ Earth years, simulated in ~10 real minutes at high time speed). Shader: time-dependent texture coordinate animation. |

#### Seasonal Wind Patterns (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Winds | Jet Stream Circulation | uJetStreamWind | ON | Superrotating atmosphere with zonal jet streams; wind speed increases toward poles. Visible as cloud advection direction. Wind speed modeled via latitude-dependent velocity. Clouds advected faster at higher latitudes. Shader: latitude-dependent wind speed for texture advection. |
| Winds | Seasonal Wind Reversal | uSeasonalWindReversal | OFF | Over Titan's 29.5-year orbit, wind direction reverses due to seasonal heating. Dominant wind direction oscillates ±90° with 29.5-year period. Simulated: advection direction time-dependent. Shader: time-dependent wind direction vector. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Light Direction | uLightDir | AUTO | Distant sun (dimmer at Saturn distance, ~1% Earth brightness); auto-orbit reveals haze layer structure, cloud patterns, and atmospheric dynamics. |
| Camera | Time Speed Multiplier | uTimeSpeed | 120x | 1 real second = 1 Titan hour (~1.5 real seconds true). 15.9 Earth day orbital period in ~6 real minutes. Methane weather cycles, cloud advection, and seasonal changes visible. |
| Camera | Auto-Rotate | uAutoRotate | ON | Full rotation reveals haze opacity variation, methane cloud distribution, and bright Xanadu region (if visible). |

---

### Enceladus (Cryo-Geyser Moon)

**Entity ID:** ENT-3021
**Description:** Saturn's moon with brilliant white ice surface (#FFFFFF pure, #B8D5F0 blue-tinted regions), prominent south-polar tiger stripe fracture system, active 400 m/s water plumes, subsurface liquid ocean, and E-ring particle contribution. Real exemplars: Enceladus.

**Section Count:** 8 (Ice Crust, Tiger Stripe Fractures, Geyser Plumes, South Polar Hotspots, Subsurface Ocean (speculative), E-Ring Contribution, Blue-Tinted Terrain, Camera)
**Total Feature Count:** 20

#### Ice Crust (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Ice | Brilliant White Ice | uWhiteIce | ON | Extremely bright water-ice surface (#FFFFFF pure white, 0.99 albedo) due to frequent geysers replenishing surface. Coverage ~95%. Smooth texture with low crater density (young surface). FBM (freq 14.0, 3 octaves) creates subtle surface ripple. Shader: high-specularity white; low normal perturbation; strong specular highlights. |
| Ice | Cratered Old Terrain | uOldTerrain | ON | Older, more heavily cratered regions (~5% coverage, primarily northern hemisphere) show slight darkening (#E8F0F8 pale blue, 0.95 albedo). Crater distribution via Worley (freq 10.0). Craters <20 km typical. Shader: slightly darker color blend; normal map crater rims. |
| Ice | Ice Grain Size Variation | uIceGrainSize | OFF | Finer ice grains in geyser fallback zones (#FFFAFF extremely bright, 0.995 albedo); coarser grains elsewhere (#F0F5FF, 0.95 albedo). Subtle 0.05 albedo variation. Shader: conditional specularity boost in geyser zones. |

#### Tiger Stripe Fractures (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Fracture | Tiger Stripe Linear Fractures | uTigerStripes | ON | Four prominent south-polar fracture zones (Baghdad, Cairo, Damascus, Alexandria sulci); linear features 100–200 km length, 2–3 km wide. #B8D5F0 blue-tinted walls (exposed fresher ice). Center darker #7A9FB0 (thermal signature or fine grain). Generated via linear heightmap depression with normal map sharpening. Shader: sharp-edged linear features; blue tint in fracture walls. |
| Fracture | Fracture Wall Height | uFractureWallHeight | ON | Tiger stripe walls rise ~100–500 m above surrounding terrain. Heightmap raised ridges flanking central trough. Rendered via heightmap with sharp walls. Shader: heightmap-based vertex displacement; faceted normal map. |
| Fracture | Fracture Thermal Glow | uFractureGlow | ON | Fractures are hotspots from subsurface geothermal activity; slight brightening (#E8F8FF pale, 0.1 intensity boost) and thermal IR glow (#FF8855 dim orange, 0.05 intensity, speculative thermal camera). Shader: additive glow pass; thermal channel emissive. |

#### Geyser Plumes (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Geyser | Water Plume Jets | uWaterPlumes | ON | Active water plumes erupt from tiger stripes at ~400 m/s. Plumes bright white (#FFFFFF, opacity 0.8, emissive 0.3) rising 50–200 km. Rendered as tall cone geometry or volumetric billboard. Multiple plumes (~5–8 active simultaneously) distributed along tiger stripes. Procedural geyser positioning. Shader: additive cone/plume rendering; Gaussian profile. |
| Geyser | Plume Spread & Expansion | uPlumeSpreading | ON | Plumes expand as they rise (velocity decreases with altitude). Cone angle increases from base (~5°) to top (~30°). Modeled via tapered cone or animated quad expansion. Shader: scaled cone geometry; lerp opacity based on height. |
| Geyser | Plume Particle Fall | uPlumeFallback | ON | Water particles fall back to surface, creating bright fallback deposits (#FFFACD very pale, coverage 500 km² from plume). Particles fall over ~3–5 minutes. Animated particle arc trajectories. Shader: additive particle trails; fade with time. |
| Geyser | Geyser Eruption Frequency | uEruptionFrequency | ON | Geysers erupt quasi-periodically (~10 min mean interval, variable). Modeled via random Poisson events; each geyser independently active/inactive. Duration ~1–2 min per eruption. Shader: time-dependent geyser visibility & height. |

#### South Polar Hotspots (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Hotspot | Thermal Hotspot Concentration | uSouthPolarHeat | ON | South polar region (latitude <60°S) shows concentrated warmth signatures. Rendered as subtle pink-orange tint (#FFB8A0, 0.08 intensity) in south polar zone. Thermal gradient from warm south to cool north. Shader: latitude-dependent color tint. |
| Hotspot | Hotspot Location Variability | uHotspotShifting | OFF | Hotspot locations shift slowly (migration of subsurface convection). Geyser cluster center drifts ~1°/year (simulated). Shader: time-dependent geyser position offset. |

#### Subsurface Ocean (speculative, 2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Ocean | Ocean Plume Origin Glow | uOceanGlow | OFF | Speculative: faint blue glow (#7AC4E8, 0.1 intensity) visible at geyser plume origins, indicating subsurface ocean water. Shader: additive glow at plume base fractures. |
| Ocean | Subsurface Thermal Signature | uOceanThermal | OFF | Speculative thermal IR (#FF6B35 dim orange, 0.05 intensity) from geothermal heating deep in subsurface, barely detectable. Shader: emissive color in geyser zones. |

#### E-Ring Contribution (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Ring | Plume-Derived Particles | uEringParticles | OFF | Water particles from plumes escape to Saturn orbit, forming E-ring. Speculative: faint wispy haze (#E8F4FF pale, 0.1 opacity, ~1–3 Rp extent) representing E-ring particle cloud around Enceladus. Shader: volumetric fog shell extending outward. |
| Ring | Particle Ejection Direction | uEjectionCone | OFF | Particles ejected anti-Saturnward from south pole; directional cone. Haze concentration antisolar from plume direction. Shader: directional volumetric fog. |

#### Blue-Tinted Terrain (1 feature)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Terrain | Blue Plains & Ridges | uBlueTerrain | ON | Regions with exposed relatively pure water ice and thermal disturbance show #B8D5F0 blue tint. Scattered across surface, concentrated south polar. FBM (freq 11.0) determines blue zone distribution. Shader: conditional blue color blend. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Light Direction | uLightDir | AUTO | Distant sun (Saturn-distance dimness); auto-orbit reveals tiger stripe distribution, active geysers, and south polar hotspot region. |
| Camera | Time Speed Multiplier | uTimeSpeed | 100x | 1 real second = 1 Enceladus hour (~2 hours true). 1.37 Earth day orbital period in ~1.3 real minutes. Geyser eruptions and plume dynamics visible over ~1–5 real seconds. |
| Camera | Auto-Rotate | uAutoRotate | ON | Full rotation reveals tiger stripe fracture system, geysers, bright ice coverage, and regional color variation. |

---

### Ganymede (Magnetic Moon)

**Entity ID:** ENT-3012
**Description:** Jupiter's largest moon, only moon with its own magnetic dynamo field, dichotomy of dark ancient terrain (#5A5A6A dark gray) and light grooved regions (#B5B5BD light gray), giant palimpsest craters, subsurface ocean, and induced auroral phenomena. Real exemplars: Ganymede.

**Section Count:** 9 (Dark Ancient Terrain, Grooved Terrain System, Crater Distribution, Crater Rays, Subsurface Ocean Structure, Intrinsic Magnetic Field, Induced Magnetic Field, Aurorae, Camera)
**Total Feature Count:** 25

#### Dark Ancient Terrain (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Terrain | Heavily Cratered Dark Regions | uDarkTerrain | ON | Ancient (~3.5+ Gyr) dark terrain (#5A5A6A dark gray, 0.4 albedo) covering ~40% of surface. Heavily saturated with impact craters. Worley noise (freq 5.0, 8.0, 15.0) generates multi-scale crater distribution. Craters <50 km abundant; central peaks visible on large craters. Shader: dark base color; high-frequency normal perturbation. |
| Terrain | Crater Ray Patterns | uDarkRays | ON | Bright rays from fresh impacts on dark terrain appear very bright (#D5D0C8, 0.25 brighter). Radiant patterns extend 50–500 km from crater sources. Distance-field rays from crater centers. Shader: additive ray overlay; exponential falloff. |
| Terrain | Terrain Roughness | uTerrainRoughness | ON | Dark terrain highly cratered; rough surface texture via high-frequency normal perturbation (FBM freq 24.0). Roughness higher in older regions. Shader: increased normal map amplitude. |
| Terrain | Magnetic Anomaly Correlation | uMagneticAnomaly | OFF | Dark regions show correlation with magnetic anomalies (crustal remanent field). Subtle purple tint (#8B7FB5, 0.05 intensity overlay) indicates anomaly zones. Shader: conditional color overlay. |

#### Grooved Terrain System (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Groove | Bright Grooved Terrain | uGroovedTerrain | ON | Younger (~1–2 Gyr) grooved terrain (#B5B5BD light gray, 0.5 albedo) covering ~60–65% of surface. Consisting of parallel ridges and valleys (groove width 1–2 km, length 10–100 km). FBM (freq 10.0) with anisotropic bias generates groove orientation. Smoother than dark terrain; fewer large craters. Shader: directional normal perturbation; additive groove shadow. |
| Groove | Groove Ridge Structure | uGrooveRidges | ON | Light ridges (#D5D5DD very bright, 0.55 albedo) separated by darker valley troughs (#9A9AA8 darker, 0.45 albedo). Ridge height 100–500 m. Modeled via heightmap with periodic wave profile. Shader: sinusoidal heightmap; alternating bright/dark normal map. |
| Groove | Groove Orientation | uGrooveOrientation | ON | Grooves oriented in distinctive patterns (radial from impact basins, concentric rings, crosscutting sets). Orientation field generated via superposition of directional FBM components. Shader: directional texture anisotropy. |
| Groove | Crosscutting Groove Sets | uCrosscuttingGrooves | ON | Multiple groove generations visible at various orientations, indicating episodic tectonism. Younger grooves overprint older. Rendered via layered texture advection with different orientation angles. Shader: blended normal maps at different rotations. |

#### Crater Distribution (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Craters | Gilgamesh Impact Basin | uGilgameshBasin | ON | Large multi-ring impact basin (~580 km diameter, ~3 km deep). Located longitude ~123°W, latitude ~62°S. Dark basin floor (#3A3A4A very dark), raised rim rings (#8A8A98 lighter), central peak ring visible. Rendered via large-scale depression heightmap with raised rings. Shader: multi-layer heightmap; rim shadow computation. |
| Craters | Palimpsest Crater Structure | uPalimpsests | ON | Ghost crater rings from heavily eroded ancient impacts (Gilgamesh, others). Faint concentric ring features (#9A9AA8 slightly raised rims, relief <100 m). Multiple overlapping rings. Rendered via faint heightmap rings with low amplitude. Shader: subtle heightmap; soft shadow rendering. |
| Craters | Crater Central Peaks | uCentralPeaks | ON | Large craters (>30 km) show central peaks or peak rings. Peak height 500–1500 m. Generated via gaussian bumps at crater centers with separate heightmap layer. Shader: layered heightmap; sharp normal map at peaks. |

#### Crater Rays (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Rays | Bright Ejecta Rays | uRayEjecta | ON | Fresh impact craters produce bright rays of ejecta (#D5D0C8, 0.2 brighter, width 10–50 km, extent 100–500 km). Multiple ray families visible. Rendered via multi-center radial distance fields. Shader: additive ray overlay with exponential distance falloff. |
| Rays | Ray Color Fading | uRayFading | OFF | Rays gradually darken from space weathering; older rays (#A0A0B0, 0.1 darker) visible alongside bright recent rays. Age-dependent color. Shader: lerp ray color based on procedural age map. |

#### Subsurface Ocean Structure (speculative, 2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Ocean | Ocean Convection Pattern Glow | uOceanConvection | OFF | Speculative: subsurface ocean convection pattern reflects in surface gravity variations. Faint blue glow (#7AC4E8, 0.08 intensity) at convection cell boundaries. Voronoi-based convection cell visualization. Shader: additive glow at cell boundaries. |
| Ocean | Magnetic Field - Ocean Conductivity Indicator | uOceanConductivity | OFF | Speculative: conductive subsurface ocean is source of intrinsic magnetic field. Subtle glow (#5A7FBF, 0.1 intensity) indicates ocean presence below. Shader: global emissive layer. |

#### Intrinsic Magnetic Field (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Magnetic | Ganymede Dipole Field | uDipoleField | ON | Ganymede is only moon with intrinsic magnetic field (weak, ~0.7 mG at surface, likely from subsurface ocean). Rendered as blue field lines (#4A7FB5, 0.3 opacity) emanating from magnetic poles. Dipole moment ~1.3 × 10^13 T⋅m³. Modeled via line-rendering or volumetric field visualization. Shader: additive line rendering; Fresnel fade toward camera. |
| Magnetic | Magnetic Pole Offsets | uMagneticPoles | ON | Magnetic poles offset from rotation poles (tilt ~10°). Rendered via tilted field-line visualization. Field lines loop from N to S magnetic poles. Shader: rotated dipole field rendering. |
| Magnetic | Magnetosphere Interaction Region | uMagnetosphereSize | OFF | Ganymede's intrinsic field carves out magnetosphere within Jupiter's magnetosphere. Faint glow (#5A7FBF, 0.15 intensity, ~3 Rp extent) indicating magnetosphere boundary. Shader: volumetric fog shape. |

#### Induced Magnetic Field (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Induced | Induced Dipole Interaction | uInducedDipole | OFF | Additional induced dipole from subsurface ocean conductivity (interaction with Jupiter magnetosphere). Modulates intrinsic field; faint purple-blue tint (#7A6FBF, 0.1 intensity overlay). Shader: conditional color overlay on field region. |
| Induced | Magnetotail Structure | uMagnetotail | OFF | Magnetotail behind Ganymede (anti-Jovian direction) from solar wind compression. Faint glow (#5A7FBF, 0.15 intensity, ~5 Rp extent). Shader: volumetric fog tail shape. |

#### Aurorae (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Aurora | Magnetic Polar Aurorae (Hubble-detected) | uAurorae | ON | Hubble observations detected aurorae at Ganymede's magnetic poles; bright glowing regions (#7AC4E8 cyan, 0.4 intensity, ~500 km footprint per pole). Caused by charged particles from Jupiter magnetosphere spiraling along field lines. Rendered as bright polar caps. Shader: conditional brightening at magnetic pole regions; additive glow. |
| Aurora | Aurora Intensity Variability | uAuroraVariability | OFF | Aurora intensity oscillates with Jupiter magnetosphere activity (modulation frequency ~day-like period). Brightness oscillates ±0.15 intensity. Shader: time-dependent brightness multiplier on aurora regions. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Light Direction | uLightDir | AUTO | Distant sun & nearby Jupiter light; auto-orbit reveals dichotomy of dark & light terrain, crater distribution, and auroral glowing magnetic poles. |
| Camera | Time Speed Multiplier | uTimeSpeed | 60x | 1 real second = 1 Ganymede hour (~7 hours true). 7.15 Earth day orbital period in ~8 real minutes. Magnetic field visualization and aurora activity visible dynamically. |
| Camera | Auto-Rotate | uAutoRotate | ON | Full rotation reveals dark/light terrain dichotomy, grooved terrain system, major impact basins (Gilgamesh), bright rays, and auroral magnetic poles. |

---

## 8. Nebulae

Nebulae are clouds of gas and dust spanning light-years. Emission nebulae are ionized H II regions surrounding hot young stars; planetary nebulae are the expanding shells of dying stars; reflection nebulae scatter nearby starlight without self-emission; dark (molecular) clouds are cold and dense silhouettes blocking background light; supernova remnants are the expanding debris of exploded stars.

### Emission Nebula (H II Region)

**Entity ID:** ENT-5010
**Description:** Diffuse ionized hydrogen cloud surrounding one or more hot O/B-type stars. Bright Hα emission (#FF5540 red) dominates the visible spectrum; oxygen forbidden lines (#3FCFA8 teal-green) and nitrogen (#FF7F4A orange) add complexity. Dust lanes cut through as silhouettes. Shock fronts, pillars of creation, and embedded protostars complete the structure. Real exemplars: Orion Nebula (M42), Eagle Nebula (M16), Lagoon Nebula (M8).

**Section Count:** 8
**Total Feature Count:** 31

#### Ionization & Core Emission (5 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Ionization & Core Emission | Hα Emission Glow | uHAlphaGlow | ON | Hydrogen-alpha recombination line at 656.3 nm dominates visible emission in #FF5540 crimson-pink. Rendered as raymarched volumetric density with 5-octave FBM Simplex noise (frequency 3.5, amplitude 0.6) driving opacity, additive blended at full intensity. Brightness scales with inverse-square distance to ionizing star(s); typical radius 2–5 ly. |
| Ionization & Core Emission | OIII Teal Emission | uOIIIEmission | ON | Doubly-ionized oxygen forbidden lines at 500.7/495.9 nm produce #3FCFA8 teal-green glow, concentrated near brightest ionizing stars where UV flux is hardest (>13.6 eV). Rendered as separate raymarched layer with higher spatial frequency (FBM freq 7.2, octaves 4) and 30% opacity multiplied against Hα for chromatic separation and richness. |
| Ionization & Core Emission | NII Orange-Red Overlay | uNIIEmission | ON | Singly-ionized nitrogen forbidden lines doublet at 654.8/658.4 nm produce #FF7F4A orange-red emission, distributed throughout nebula but peaked at moderate ionization zones. 3-octave FBM (freq 4.8) with temporal drift of 0.002 rad/s creates slow swirling veils. Blended with 20% opacity over base Hα for warm undertone. |
| Ionization & Core Emission | SII Deep Red Fringes | uSIIEmission | ON | Singly-ionized sulfur lines at 673.1/672.4 nm add #E63060 deep red fringes along ionization fronts and shock boundaries. Rendered using 2-octave FBM (freq 2.1) for broad structure; typically 40% opacity of Hα peak. Reveals shock-compressed gas where velocity gradients accelerate ionization. |
| Ionization & Core Emission | HeII Ultraviolet Glow | uHeIIEmission | OFF | Ionized helium at 468.6 nm (#5A7FFF violet-blue) traces regions of extreme UV hardness; confined near O-type stars. Very sparse spatial distribution via 1-octave Worley noise (frequency 0.8, sparse cell density). When enabled, adds 15% contrast enhancement near star cores; rarely visible unless star catalog is toggled. Physically accurate but visually subtle. |

#### Nebular Structure (6 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Nebular Structure | Strömgren Sphere Boundary | uStromgrenBoundary | ON | Sharp ionization front marking transition from ionized H+ to neutral H; spherical approximation around star cluster with radius 2.5 ly typical. Rendered as density gradient discontinuity using step function on raymarched distance field (gradient threshold 0.04). Produces visible "edge glow" in #FF6080 hot pink where density switches. |
| Nebular Structure | Density Wave Ripples | uDensityWaves | ON | Spiral or radial undulations in nebular gas driven by rotating ionizing star(s) or internal gravity; wavelength ~0.3 ly, amplitude ±15% density modulation. Implemented as 2D Perlin noise warped by spiral function (rotation 0.08 rad/s) combined additively with base FBM. Creates subtle striations visible under high contrast. |
| Nebular Structure | Nebular Filaments | uFilaments | ON | Fine thread-like structures from turbulent gas dynamics; widths 0.01–0.05 ly, lengths 0.5–2 ly. Rendered via 8-octave FBM (freq 12.0, lacunarity 2.1) with high-pass filter isolating peaks. Colored in #FF5080 following emission-weighted gradient; drift velocity 0.005 rad/s. Crucial for visual complexity and realism. |
| Nebular Structure | Gas Finger Protrusions | uGasFingers | ON | Dense fingers of gas extending radially outward from nebular rim under radiation pressure; length 0.2–0.8 ly, spacing ~0.4 ly. Modeled as elongated 3D Voronoi seed points radially projected outward, then raymarched with directional bias. Colored #FF4070; visible as spiky protrusions when edge-lit. |
| Nebular Structure | Micro-Cavities & Bubbles | uBubbles | OFF | Spherical low-density zones carved by stellar winds or protostellar jets; radii 0.05–0.3 ly. Rendered as negative-space inverted density bumps (subtractive), creating apparent "holes" in emission. Toggle for visual clarity when studying internal structure; minor visual contribution when ON. |
| Nebular Structure | Velocity Field Shear | uVelocityShear | OFF | Differential rotation and bulk outflow imprint visible distortion via texture coordinate warping (max warp 0.15 texture units, time-varying). Speculative feature showing gas dynamics; rotation period ~100 kyr. When enabled, observable as temporal "twist" in filament alignment over 10+ second animation. |

#### Dust & Pillars (5 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Dust & Pillars | Pillar of Creation Structures | uPillars | ON | Dense dust pillars (extinction Av 5–20 mag) perpendicular to radiation field, heights 0.3–0.8 ly, widths 0.05 ly. Rendered as raymarched opaque cylinders using 3-octave FBM (freq 6.5) modulating density along height. Color #1A1410 near-black with #4A3020 rim-lighting. Real exemplar: Eagle Nebula pillars. |
| Dust & Pillars | Dust Lane Extinction | uDustLanes | ON | Foreground silhouette dust across nebula face; optical depth τ 1–5 (blocks 60–99% of light). Implemented as heightfield-based raymarched volume with 2-octave Simplex (freq 2.2) driving extinction coefficient. Color #2A1F18 warm brown-black. Crucial for depth and obscuration appearance. |
| Dust & Pillars | Bok Globules (Dark Knots) | uBokGlobules | ON | Isolated dark condensations (radius 0.01–0.1 ly) marking sites of future star formation; optical depth 3–8. Rendered as small dense spheres in 3D texture space with high-frequency FBM (freq 9.0, octaves 3), positioned via sparse Worley noise. Colored #0A0A10 near-black with thin #5A3A20 halo. |
| Dust & Pillars | Dust Grain Scattering Halo | uDustHalo | ON | Forward-scattered light from dust particles surrounding pillars and globules, producing apparent "glow" in #FF7060 warm orange-red at edges. Raymarched as exponential attenuation shell around dark structures (attenuation distance 0.15 ly). Physically represents radiative transfer near dust. |
| Dust & Pillars | Polycyclic Aromatic Hydrocarbon (PAH) Emission | uPAHEmission | OFF | Aromatic molecules emit broad #FFB850 yellow-orange band at 3–15 µm (IR); visible as speculative false-color toggle. Rendered as smooth FBM layer (freq 1.8, octaves 2) with 10% opacity overlay on dust lanes. When enabled, reveals hidden warm dust structures absent in optical view. |

#### Shock Fronts & Dynamics (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Shock Fronts & Dynamics | Bow Shock Structures | uBowShocks | ON | Curved shock surfaces from high-velocity stellar winds impacting ambient gas; curvature radius ~0.2 ly, shock thickness ~0.02 ly. Rendered as Voronoi-seeded surface with inward-directed velocity bias, raymarched with sharp density gradient (multiplier 3.0). Color transitions #FF5080 → #FF8040 across shock front. Real: bow shocks around Herbig-Haro objects. |
| Shock Fronts & Dynamics | Shock-Heated Rim Brightening | uShockRims | ON | Enhanced emission (#FF4050 bright red) at shock fronts where gas compression raises temperature to 10,000–15,000 K. Raymarched density field with directional partial derivative applied to edges (Sobel-like filter). Additive blend at 150% intensity. Visible as thin bright lines along nebula periphery. |
| Shock Fronts & Dynamics | Herbig-Haro Jet Objects | uHHObjects | ON | Bipolar outflow jets from embedded protostars; velocity 100–300 km/s, visible as #4A7FFF bright blue collimated beams. Rendered as raymarched directional emission cones (opening angle 8°, length 0.5 ly) with 6-octave FBM interior structure and temporal velocity warp (drift 0.02 rad/s). Real exemplars: HH 111, HH 46/47. |
| Shock Fronts & Dynamics | Supersonic Turbulence Cascade | uTurbulence | OFF | Kolmogorov-spectrum turbulent cascade visible as multi-scale density variations (scales 0.001–0.2 ly). Implemented via spectral synthesis of FBM (octaves 6–12, freq range 1.0–128.0). When enabled, adds fine granular texture; computationally expensive, toggleable for performance. |

#### Embedded Objects (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Embedded Objects | Ionizing Star Cores | uStarCores | ON | O/B-type stars (Teff 30,000–50,000 K) embedded within nebula; radius ~0.005 ly, brightness dominates local region. Rendered as point lights with inverse-square falloff (falloff radius 3.0 ly) colored #FFFFFF with outer halo #FFE8C0. Typically 1–3 stars per large nebula. Position controls ionization field strength. |
| Embedded Objects | Deeply Embedded Protostars (IR-only) | uEmbeddedProtostars | OFF | Young stars buried in dust (visual extinction 10–30 mag); only visible in IR wavelength toggle. Rendered as #FF8060 orange point sources positioned within dark globules/pillars. When enabled, reveals ~5–10 point sources per nebula. Speculative but physically motivated; toggle reveals "hidden" structure. |
| Embedded Objects | O/B Star Wind Momentum Balance | uStellarWinds | OFF | Visible imprint of stellar wind dynamic pressure on surrounding gas; manifests as slight radial density depression (~5 ly radius) and accelerated outflow velocity. Raymarched as radial velocity field warp (max displacement 0.1 texture units). When toggled, reveals wind cavity structure around bright stars. |

#### Spectral Overlays (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Spectral Overlays | False-Color Emission Map | uFalseColor | OFF | Speculative overlay assigning Hα→Red, OIII→Green, NII→Blue for intuitive ionization-state visualization (NASA Hubble style). Requires simultaneous rendering of three emission layers mapped to RGB channels. When enabled, converts view to #FF0000/#00FF00/#0000FF channel-weighted composite. Aids scientific understanding of chemical zonation. |
| Spectral Overlays | Doppler Velocity Tint (Edge Highlight) | uDopplerTint | OFF | Speculative edge coloring based on radial velocity; approaching gas #3F7FFF blue-shifted, receding #FF7F3F red-shifted, zero-velocity #FFFFFF neutral. Rendered as velocity-field sampling along raymarched surface normal, max tint saturation 30%. Reveals kinematic structure; physically intuitive but unobservable without spectroscopy. |

#### Boundary & Cocoon (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Boundary & Cocoon | Ionization Front Sharp Boundary | uIonizationFront | ON | Abrupt transition zone (thickness ~0.02 ly) between fully ionized H+ (bright interior) and neutral H (dark exterior). Raymarched using Heaviside step function convolved with small Gaussian (width 0.015 ly). Produces visible dark "edge" in #1A1410 against bright interior #FF5540. Fundamental to nebula silhouette. |
| Boundary & Cocoon | Neutral Hydrogen Shell Halo | uNeutralHalo | ON | Faint #CC9966 warm neutral gas halo extending beyond ionization front (radius +0.5–1.0 ly beyond boundary); optical depth 0.1–0.3. Rendered as low-opacity FBM outer shell with 2-octave structure (freq 1.5) and exponential falloff. Represents ISM being gently heated/ionized at nebula edge. |
| Boundary & Cocoon | Molecular Cloud Envelope (Infrared) | uMolecularEnvelope | OFF | Speculative cold molecular gas enveloping nebula exterior; visible only in infrared toggle. Temperature 10–20 K, density ~100 cm^-3. Rendered as very faint #CC6040 brownish halo (opacity 5%) extending to ~2 ly beyond ionization front. When enabled, reveals larger parent cloud context. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Default Zoom Level | uCameraZoom | 1.0 | Preset camera distance 3.5 ly from nebula center, allowing full structure visibility with comfortable field-of-view (45°). Distance units in Cartesian light-years within shader space. Provides balanced overview of pillar structure and ionization geometry. |
| Camera | Pivot Point Centering | uCameraTarget | 0.0, 0.0, 0.0 | Camera orbits around nebula geometric center (centroid of ionized region). Fixed at origin by default; overridable via interactive control. Enables smooth rotation and examination from all angles. |
| Camera | Orthographic / Perspective Toggle | uCameraMode | Perspective | Perspective projection (true) mimics physical observer; orthographic (false) simplifies depth perception for comparative studies. Perspective mode default for immersive visualization. |

---

### Planetary Nebula

**Entity ID:** ENT-5030
**Description:** Remnant ejected by dying asymptotic giant branch (AGB) star, forming expanding ionized shell lit by central hot white dwarf (Teff 80,000–150,000 K). Shells exhibit diverse morphologies: spherical (Helix), bipolar (Butterfly), or ring-like (Ring Nebula). Emission blends Hα (#FF5540), OIII (#3FCFA8), and HeII (#5A7FFF). Slow expansion (~20 km/s) creates observable proper motion over decades. Real exemplars: Ring Nebula (M57), Helix (NGC 7293), Cat's Eye (NGC 6543), Butterfly (MyCn18).

**Section Count:** 8
**Total Feature Count:** 27

#### Shell Structure (5 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Shell Structure | Main Shell Brightness | uMainShell | ON | Primary expanding spherical/ellipsoidal shell (radius 0.15–0.4 ly) of ionized gas ejected during PN formation phase. Rendered as raymarched spherical shell with 4-octave FBM (freq 4.2, lacunarity 2.0) modulating internal density. Color #FF5540 base Hα dominated, brightness peaks 2.0× typical nebula. Expansion age 3,000–8,000 years typical. |
| Shell Structure | Outer Halo Envelope | uOuterHalo | ON | Faint extended outer envelope (radius 0.4–0.8 ly) from earlier, slower mass-loss phase; optical depth 0.05–0.2. Rendered as low-opacity FBM layer (freq 1.8, octaves 2) with exponential radial falloff. Color #CC7080 dim mauve-red. Represents 50,000+ year-old ejecta no longer efficiently ionized. |
| Shell Structure | Inner Dense Ring | uInnerRing | ON | Circumstellar disk or equatorial density enhancement (thickness ~0.05 ly, radius 0.1–0.25 ly) from anisotropic mass loss. Raymarched toroidal geometry with 5-octave FBM (freq 6.8) concentration toward equatorial plane. Color #FF5090 bright magenta-red. Visible as bright equatorial band when shell inclined. Real: Ring Nebula inclined view shows obvious equatorial brightening. |
| Shell Structure | Filamentary Shell Texture | uFilaments | ON | Fine fibrous thread-like internal structure from gas cooling and instability; filament widths ~0.005 ly. Generated via 9-octave FBM (freq 11.0, lacunarity 2.2) with high-pass filtering isolating peaks. Colored #FF4080 in emission. Crucial for visual realism; breakup of smooth shell into intricate web-like pattern. |
| Shell Structure | Irregular Shell Clumping | uShellClumps | ON | Non-uniform density variations (scales 0.01–0.1 ly) from Rayleigh-Taylor instability or rotation. Rendered as lower-frequency FBM (freq 3.0, octaves 3) multiplied against shell density. Creates apparent "clumpy" shell texture with 20–40% local brightness variations. Physically motivated by fluid instabilities. |

#### Central Hot Star (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Central Hot Star | White Dwarf Core Point Light | uWhiteDwarf | ON | Stellar remnant at PN center; surface temperature 80,000–150,000 K (hotter than blue supergiants). Rendered as intense point light #FFFFFF with slight #FFE0B0 warm tint, radius ~0.0005 ly (physically accurate; 1 solar mass in Earth-size volume). Falloff radius 0.6 ly; primary ionization source for shell. |
| Central Hot Star | Photosphere Limb Darkening | uLimbDarkening | ON | Apparent darkening of stellar limb due to temperature gradient and absorption; subtle effect. Rendered as radial gradient on star sprite (center brightness 1.0, edge 0.7). Adds realism and prevents artificial "flat" appearance of point light. Computationally cheap; always default ON. |
| Central Hot Star | Stellar Wind from Star | uStellarWind | OFF | Hot, fast wind from white dwarf (velocity ~1,000 km/s) creating central low-density cavity. Rendered as radial density depletion zone (inner radius 0.01 ly, falloff ~exponential with e-folding 0.02 ly). When enabled, creates apparent dark "hole" at center visible when edge-lit. Speculative but physically motivated. |

#### Bipolar / Polar Lobes (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Bipolar / Polar Lobes | Bipolar Lobe Geometry | uBipolarLobes | ON | Collimated ejection along rotation axis creating two opposing lobes (length 0.2–0.5 ly, opening angle 15–35°); manifested in ~50% of PNe. Rendered as raymarched double-cone geometry with 4-octave FBM (freq 5.0) interior structure. Color #FF5540 base. Morphology controlled by uBipolarity parameter (0.0 = spherical, 1.0 = extreme bipolar). |
| Bipolar / Polar Lobes | Lobe Pinching & Ansae Knots | uAnsae | ON | Bright condensations at lobe tips (ansae; "handles" in Latin); radius 0.02–0.05 ly, brightness 1.5–2.5× main shell. Rendered as Worley-seed positioned spheres with high-frequency FBM interior (freq 8.0, octaves 3). Color #FF5090 bright magenta. Real: Butterfly Nebula (MyCn18) shows dramatic paired ansae. |
| Bipolar / Polar Lobes | Lobe Collimation Boundaries | uLobeEdges | ON | Sharp edges of bipolar lobes from magnetic field or rotation axis confinement. Rendered as raymarched step-function density transition (thickness ~0.01 ly) along cone surface. Creates visible dark silhouette line tracing lobe boundary. Color transition #FF5540 interior → #000000 exterior. |
| Bipolar / Polar Lobes | Lobe-Shell Interaction Region | uLobeShellIntersection | OFF | Zone where bipolar lobe material encounters expanding shell; density enhancement and shock heating. Rendered as intersection geometry of cone and sphere with additional 3-octave FBM (freq 4.0) overlay. When enabled, adds complexity to morphology; visual contribution ~15%. |

#### Equatorial Disk / Ring (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Equatorial Disk / Ring | Thick Equatorial Disk | uEquatorialDisk | ON | Anisotropic mass-loss concentrates material in equatorial plane; thickness ~0.03 ly, radius 0.08–0.25 ly, optical depth 0.5–2.0. Raymarched toroidal volume with 5-octave FBM (freq 6.8, lacunarity 2.1) concentration toward equator. Color #FF4070 bright magenta. Morphologically defines PN viewing angle effect. Real: Ring Nebula is actually seen nearly face-on (~30° inclination), looking down the barrel of its bipolar structure; the ring is the equatorial torus viewed from above. |
| Equatorial Disk / Ring | Disk Rotation Signature | uDiskRotation | OFF | Speculative Doppler tint revealing rotation; approaching side #3F7FFF blue, receding side #FF7F3F red. Rendered via velocity-field mapping along disk normal (rotation period ~1000 years speculative). When enabled, creates subtle color gradient across disk; aids understanding of angular momentum. |
| Equatorial Disk / Ring | Ring Gap / Inner Hole | uRingGap | ON | Low-density zone interior to equatorial ring from stellar wind evacuation; diameter ~0.05 ly. Rendered as inverse (subtractive) density bump at disk center. Creates apparent "donut" morphology when edge-on. Color contrast: dark #000000 interior vs bright #FF4070 ring surround. |

#### Fast Low-Ionization Emission Regions (FLIERs) (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Fast Low-Ionization Emission Regions (FLIERs) | FLIER Knots High-Velocity Outflows | uFLIERs | ON | Collimated high-speed jets (velocity 500–2000 km/s) along polar or equatorial axes; knots appear as bright #4A7FFF blue-white structures at distance 0.1–0.4 ly from center. Rendered as raymarched directional cones with 6-octave FBM interior (freq 7.5, velocity-warped). Multiple knots positioned via sparse Worley distribution. Real: Cat's Eye, Hen 1357 show prominent FLIERs. |
| Fast Low-Ionization Emission Regions (FLIERs) | FLIER Shock Ionization Halos | uFLIERHalos | ON | Shock-heated gas around FLIER impacts creating extended low-ionization emission (#FF5A4A orangish-red); zone radius ~0.02 ly per FLIER. Rendered as Gaussian halo around FLIER position with 2-octave FBM texture overlay (freq 3.0). Additive blend at 50% opacity. Reveals shock physics in PN winds. |

#### Shock Ionization & Chemical Evolution (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Shock Ionization & Chemical Evolution | Shock-Heated Rim Fluorescence | uShockRims | ON | Gas compressed at PN expansion interface experiences shock heating (T 5,000–15,000 K) enhancing emission; manifests as bright rim brightening (~15% increase). Rendered via Sobel edge-detection on raymarched density field, additive overlay. Color #FF5540 emphasizes Hα channel. Visible as thin bright boundary along shell interior. |
| Shock Ionization & Chemical Evolution | Chemical Abundance Zoning | uChemicalZones | OFF | Different ionization potentials create nested zones: Hα inner → OIII middle → NII outer (proceeding outward). Speculative color-coded visualization assigns zones RGB (Hα=Red, OIII=Green, NII=Blue). Requires simultaneous multi-channel emission rendering. When enabled, reveals ionization state stratification; scientifically rich but rarely directly observable. |
| Shock Ionization & Chemical Evolution | Recombination Cascade Fading | uRecombinationFade | OFF | Progressive dimming (timescale 10,000 years) as central star cools and UV ionization weakens; shell becomes less efficient radiator. Speculative feature: manually adjustable age parameter (0–15,000 years) scales total emission amplitude (bright young → faint old). When enabled, allows exploration of PN aging sequence. |

#### Dust Formation Zones (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Dust Formation Zones | Dust Shell Outer Regions | uDustShell | ON | Cool outer shell (T <1000 K) allows dust nucleation; extinction coefficient τ 0.1–0.3 typical. Rendered as faint #8A5040 warm-brown FBM layer (freq 2.0, octaves 2) additive blend at 20% opacity. Concentrated equatorially in disk region. Represents carbonaceous/silicate grain formation. Real: evolved PNe show observable dust continuum. |
| Dust Formation Zones | Central Dust Depletion Zone | uCentralVoid | OFF | Hot central region (T >5000 K) sublimes dust; low opacity zone around white dwarf (radius 0.05 ly). Rendered as radial density reduction with exponential falloff. When enabled, creates apparent "glow-through" transparency near star; minor visual contribution (~5%). |

#### Interface with Surrounding ISM (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Interface with Surrounding ISM | Neutral Envelope Halo | uNeutralHalo | ON | Faint neutral hydrogen envelope (#AA8866 brownish-tan) at PN periphery representing shocked/ionized ISM; radius 0.5–1.0 ly beyond shell, optical depth 0.02–0.1. Raymarched as 1-octave Simplex (freq 0.8) with exponential falloff. Subtle but important for context. |
| Interface with Surrounding ISM | Interaction Shock Front | uInteractionShock | OFF | PN expansion shock as it encounters ambient ISM; visible as thin bright line at outermost boundary. Rendered as raymarched discontinuity (thickness 0.01 ly) with additive glow #FF6050. When enabled, reveals outer shock structure; computationally inexpensive toggle. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Default Zoom Level | uCameraZoom | 1.0 | Preset camera distance 0.6 ly from PN center (close-up view optimizing shell detail visibility). Field-of-view 45°. Appropriate for resolving inner ring and lobe structure. |
| Camera | Pivot Point Centering | uCameraTarget | 0.0, 0.0, 0.0 | Camera orbits around white dwarf position at PN geometric center. Enables 360° morphology examination, revealing bipolarity and disk orientation. |
| Camera | Orthographic / Perspective Toggle | uCameraMode | Perspective | Perspective projection (true) default for immersive view; orthographic (false) flattens depth for comparative morphology study. |

---

### Reflection Nebula

**Entity ID:** ENT-5020
**Description:** Dust cloud scattering light from nearby bright stars via Rayleigh scattering. Blue scattered light (#5A8FFF) dominates since short wavelengths scatter ~λ^-4 more efficiently. NO intrinsic emission (passive scatter only). Often superimposed on H II regions. Real exemplars: Witch Head Nebula (IC 2118), Pleiades reflection nebulae (Maia, Merope), NGC 1999 (dark keyhole feature).

**Section Count:** 8
**Total Feature Count:** 26

#### Scattering Regions (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Scattering Regions | Rayleigh Blue Scattering Core | uRayleighScatter | ON | Primary scattering zone near illuminating star(s); Rayleigh λ^-4 law produces characteristic #5A8FFF blue color (peak near 450 nm). Rendered as raymarched scattering-driven volume (volumetric absorption coefficient tuned for ~0.3 mean optical depth). Brightness scales as inverse-square falloff from star (falloff radius 1.0 ly). Physically accurate representation of Mie/Rayleigh scattering cross-section. |
| Scattering Regions | Extended Scattering Halo | uExtendedScatter | ON | Outer fainter scattering envelope (radius 1.0–3.0 ly beyond core) where multiply-scattered light creates diffuse #7A8FFF slightly paler blue glow. Rendered as smooth exponential falloff volume (e-folding distance 0.8 ly) with 2-octave FBM texture (freq 1.5, amplitude 0.3). Opacity ~30% of core. Represents forward and multiple-scattering contribution. |
| Scattering Regions | Dust Grain Aligned Structure | uGrainAlignment | ON | Dust grain alignment by stellar magnetic field or radiation pressure creates subtle directional anisotropy in scattering. Visible as slight linear polarization texture along field lines (speculative). Rendered as directional FBM (freq 3.0, octaves 3) with elongation bias perpendicular to radial direction. When enabled (default), adds fine structure; visual contribution ~10%. |
| Scattering Regions | Scattered Photon Age | uPhotonAging | OFF | Speculative temporal aging: photons scatter multiple times before reaching eye, acquiring subtle reddening (#6B8FFF → #7B7FFF over 10 scatter events speculative). Rendered via modified scattering coloration with optional progressive red shift parameter. When enabled, adds temporal depth; minor visual realism gain (~5%). Computationally trivial addition. |

#### Illuminating Star(s) (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Illuminating Star(s) | Primary Star Point Light | uPrimaryLight | ON | Bright O/B-type star (Teff 15,000–30,000 K) dominating scattering illumination. Rendered as point light #FFFFFF with slight #FFF8E8 warm core tint, radius 0.001 ly (unresolved). Falloff radius 2.5 ly. Exact position (controlled by uLightPos uniform) critical to scattering geometry; typical distance 0.5–2.0 ly from nebula centroid. Multiple stars possible; render as additive separate lights. |
| Illuminating Star(s) | Star Position Offset from Nebula | uLightOffset | 0.3, 0.2, 0.5 | Illuminating star(s) positioned offset from nebula center (not central as in H II region). Distance 0.3–1.5 ly typical. Asymmetric positioning creates realistic one-sided illumination and crescent scattering pattern. Interactively adjustable to examine scattering geometry. |
| Illuminating Star(s) | Stellar Continuum Color Bias | uStarColor | FFFFFF | Star color temperature determines scattering wavelength peak; B-type star (#FFF8E8 neutral white) produces strong blue scatter, while A-type (#F5F0D8 warmer) reduces UV component. Adjustable parameter for exploring color sensitivity. Real: Pleiades stars range A0 (Alcyone) to B8 (Electra), producing varied nebula colors (#4A7FFF to #7A9FFF). |

#### Spectrum & Wavelength Dependence (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Spectrum & Wavelength Dependence | Rayleigh λ^-4 Wavelength Dependence | uWavelengthDependence | ON | Blue scatter (#5A8FFF, λ~450 nm) dominates over green (#7A8FFF, λ~550 nm) and red (#8FA070, λ~650 nm) due to λ^-4 law. Implemented as multiplicative wavelength bias: opacity(λ) ∝ λ^-4. When enabled (default), automatically produces realistic blue-dominated palette. Critical for visual accuracy; disabling produces unrealistic white/neutral scatter. |
| Spectrum & Wavelength Dependence | Forward Scattering Asymmetry | uForwardScatter | ON | Anisotropic scattering angle distribution (scattering angle 0–30° more probable than 90°–180°) produces brighter scattering toward star direction. Rendered via raymarched dot-product bias toward light direction (max enhancement ~1.3×). Creates crescent or one-sided appearance typical of reflection nebulae. Real: Witch Head shows bright crescent near IC 2118 star. |
| Spectrum & Wavelength Dependence | Extinction Correction (Optional) | uExtinctionCorrection | OFF | Speculative inclusion of dust extinction (AV 0.1–1.0 mag) reddening distant light; shifts color #5A8FFF → #7A8FBF slightly. Rendered as wavelength-dependent opacity increasing with distance along ray. When enabled, adds subtle reddening to outer regions; visual realism gain ~8%. |

#### Dark Lanes & Embedded Structure (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Dark Lanes & Embedded Structure | Dust Extinction Lanes | uDustLanes | ON | Dark silhouette lanes (optical depth 1–5, blocking 60–99% light) crossing nebula, carved by denser dust filaments. Rendered as raymarched high-opacity zones using 3-octave Simplex FBM (freq 4.0, lacunarity 2.1). Color #1A1510 warm near-black. Critical for visual complexity and depth; produces web-like structure. Real: NGC 1999 shows dark central keyhole. |
| Dark Lanes & Embedded Structure | Bok Globule Aggregates | uBokGlobules | ON | Small dark globules (radius 0.01–0.05 ly, optical depth 3–8) scattered throughout nebula; future star-forming cores. Rendered as Worley-positioned dense spheres with high-frequency FBM interior (freq 10.0, octaves 3). Color #0A0A10 near-black with thin #5A6A8F blue rim-lit halo. |
| Dark Lanes & Embedded Structure | Filamentary Dust Threads | uDustFilaments | ON | Fine dust filaments (width 0.002–0.01 ly, length 0.1–0.5 ly) from turbulent gas structure and magnetic field alignment. Rendered via 10-octave FBM (freq 13.0, lacunarity 2.2) with high-pass filter isolating peaks, colored #1A1510 dark near-black. Provides intricate visual texture; crucial for realism. |
| Dark Lanes & Embedded Structure | Microstructure Clumping | uMicrostructure | ON | Small-scale clumps (scales 0.01–0.1 ly) from dust grain aggregation and turbulence. Rendered as 4-octave FBM (freq 5.0) layered beneath filaments. When enabled (default), creates realistic granular appearance. Opacity modulation ±20% of base structure. |

#### Embedded Young Stars (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Embedded Young Stars | T Tauri Protostars (IR-only Visible) | uProtostars | OFF | Young pre-main-sequence stars deeply embedded in dust (visual extinction AV 5–15 mag) but visible in infrared. When IR toggle enabled, renders as #FF8060 warm orange-red point sources positioned within dark globules. Typical density ~3–5 protostars per large nebula. Speculative but physically motivated; reveals active star formation hidden in optical. |
| Embedded Young Stars | Protostar IR Heating Halos | uProtostarHalos | OFF | Infrared emission from dust heated by embedded protostars; surrounds each protostar with warm #FF9070 orange halo (radius ~0.05 ly). Rendered as Gaussian blur around IR-source position. When enabled alongside uProtostars toggle, reveals dust heating signature. Visual contribution ~10% when both enabled. |

#### Cometary Globules (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Cometary Globules | Cometary Tail Formation | uCometaryGlobules | ON | Dense globules (head radius 0.02 ly, tail length 0.1–0.3 ly) shaped by stellar radiation pressure into comet-like form. Head points away from illuminating star; tail aligns radially outward. Rendered as teardrop geometry with 4-octave FBM interior (freq 5.5) producing filamented appearance. Color #0A0A10 near-black head, #1A1510 tail gradation. Real: Witch Head Nebula shows prominent cometaries. |
| Cometary Globules | Tail Density Gradient | uTailGradient | ON | Cometary tail density decreases along length (head ρ >> tail ρ) due to radiation pressure stripping. Rendered as exponential density falloff along tail direction (e-folding length 0.08 ly). Creates appearance of "wispy" tail trailing from dense head. Physically accurate representation of radiation pressure sculpting. |

#### Magnetic Field Alignment (Speculative) (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Magnetic Field Alignment (Speculative) | Magnetic Field Dust Alignment | uMagneticAlignment | OFF | Speculative feature: dust grain alignment by nebular magnetic field (typical B 10–100 µG) produces polarization pattern visible as aligned filament/globule orientation. Rendered as directional FBM texture with elongation bias along field lines (spiral or radial patterns). When enabled, adds coherent structure; visual contribution ~15%. Physically motivated but not directly observable in optical imaging. |
| Magnetic Field Alignment (Speculative) | Polarization Pattern Visualization | uPolarizationVis | OFF | Speculative overlay showing magnetic field pattern via false-color polarization map. Rendered as oriented texture orientation field color-mapped (#3F7FFF blue for one direction, #FF7F3F orange for perpendicular). When enabled simultaneously with uMagneticAlignment, reveals hidden field structure; scientifically rich but speculative. |

#### Fine Structure & Filaments (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Fine Structure & Filaments | Filamentary Branching Network | uBranchingNetwork | ON | Dust filaments form interconnected web via gravity and pressure balance; branching fractal-like structure. Rendered via L-system-inspired procedural generation seeded by Voronoi points, raymarched with variable thickness (0.002–0.01 ly). Color #0A0A10 near-black with #5A6A8F blue rim-lighting. Crucial for visual complexity and organic appearance. |
| Fine Structure & Filaments | Substructure within Globules | uGlobuleSubstructure | ON | Small-scale density variations within dark globules (scales 0.001–0.01 ly) from internal fragmentation and turbulence. Rendered via 8-octave FBM (freq 12.0, lacunarity 2.0) layered within globule raymarching. When enabled (default), prevents smooth appearance; adds grainy texture. |
| Fine Structure & Filaments | Diffuse Halo Fringing | uDiffuseHalo | ON | Scattered light "glow" surrounding dark dust structures via forward scattering; faint #5A7FFF blue halo (width ~0.02 ly, opacity 15% of core). Rendered as directional Gaussian blur around dark structure boundaries, oriented toward light source. Adds subtle brightening effect at dust edges. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Default Zoom Level | uCameraZoom | 1.0 | Preset camera distance 1.5 ly from nebula center, accommodating overall morphology and internal dust lane structure. Field-of-view 45°. Balanced view of extended scattering and dark lanes. |
| Camera | Pivot Point Centering | uCameraTarget | 0.0, 0.0, 0.0 | Camera orbits around dust nebula centroid. Enables 360° viewing of asymmetric illumination and scattering geometry from all angles. |
| Camera | Orthographic / Perspective Toggle | uCameraMode | Perspective | Perspective projection (true) default; orthographic (false) available for comparative flat visualization. |

---

### Dark Nebula / Molecular Cloud

**Entity ID:** ENT-5040
**Description:** Cold (10–20 K), dense (100–10,000 cm^-3) cloud of gas and dust blocking background starlight. Appears as dark silhouette via extinction (optical depth 1–10+). Contains embedded protostars and molecular chemistry (H₂, CO, complex organics). Forms as precursor to star formation. Realizes as absence/void rather than emission. Real exemplars: Horsehead Nebula, Coalsack, Barnard 68 (isolated bok globule), Orion Molecular Cloud (OMC-1).

**Section Count:** 8
**Total Feature Count:** 27

#### Extinction Silhouette (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Extinction Silhouette | Primary Extinction Cloud Body | uExtinctionMass | ON | Main dark cloud structure blocking background light; optical depth 2–8 (blocks 85–99.9% of background). Rendered as raymarched high-opacity volume using 4-octave Simplex FBM (freq 4.5, amplitude 0.7, lacunarity 2.0) producing realistic cloud morphology. Color #0A0808 near-black with #1A1208 warm brown-black interior gradation. Defines overall cloud silhouette boundary sharply against background. |
| Extinction Silhouette | Extinction Gradient Edges | uExtinctionGradient | ON | Soft boundary layer (thickness ~0.1 ly) transitioning from opaque interior (τ 5) to transparent exterior (τ 0); exponential falloff profile. Raymarched with gentle density gradient (e-folding distance 0.08 ly). Creates realistic soft edge rather than knife-sharp boundary. Color transition #0A0808 → #0F0F0F subtly perceptible. |
| Extinction Silhouette | Fine Extinction Filaments | uExtinctionFilaments | ON | Sub-structures within main cloud body: elongated high-optical-depth filaments (width 0.01–0.05 ly, length 0.2–1.0 ly) from gas density perturbations. Rendered via 7-octave FBM (freq 9.0, lacunarity 2.1) with directional bias. Color #000000 pure black at filament cores. Adds visual complexity and realistic fragmentation appearance. |
| Extinction Silhouette | Dust Grain Opacity Variation | uGrainOpacity | OFF | Speculative grain-size variation: larger grains (submicron) scatter more than absorb, creating color-dependent extinction (reddening). When enabled, applies wavelength-dependent opacity increasing toward IR (shorter wavelengths more transparent). Renders subtle reddish tint (#1A0A08) to interior. Physically motivated but minor visual contribution (~5%). |

#### Shape & Morphology (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Shape & Morphology | Horsehead Prominence | uHorseheadShape | ON | Distinctive elephant-head or seahorse-head projection (height 0.15–0.3 ly, base width 0.1 ly) extending from main cloud body. Rendered as tapered extrusion using 2-octave Simplex FBM (freq 2.0) along predefined "horn" direction vector. Color #0A0808. Morphological "signature" feature directly observable in real Horsehead Nebula. |
| Shape & Morphology | Pipe/Serpentine Curl | uPipeStructure | ON | Elongated curved filamentary structure (length 0.5–2.0 ly, width 0.05 ly) resembling tobacco pipe or snake coil. Rendered as raymarched Bezier-curve-traced tube with 4-octave FBM interior (freq 5.2, amplitude 0.6). Creates organic flowing morphology. Real exemplar: Pipe Nebula complex. |
| Shape & Morphology | Fragmentation Clumping | uFragmentation | ON | Hierarchical density structure from gravitational fragmentation: main cloud contains ~5–10 major clumps (radius 0.1–0.3 ly), which contain ~3–5 sub-clumps (radius 0.02–0.08 ly). Rendered as multi-scale FBM hierarchy (freq 2.0 for large clumps, freq 8.0 for substructure). Color remains #0A0808. Crucial for realistic appearance; prevents smooth blob aesthetic. |
| Shape & Morphology | Tail Wisp Trailing | uTailWisps | ON | Diffuse density tail extending from main clump body along preferred direction (wind-like or pressure-driven elongation). Width 0.02 ly, length 0.3–0.8 ly, low opacity. Rendered as 2-octave FBM (freq 1.8) with exponential density falloff. Color #0F0F08 very dark brown-black. Adds dynamical appearance suggesting gentle winds/pressure. |

#### Embedded Protostars (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Embedded Protostars | Embedded Protostars (IR-visible) | uProtostars | OFF | Young stars buried in high extinction (visual AV 5–30 mag) but radiating in infrared. When IR toggle enabled, renders as #FF7040 orange point sources at positions within dark globules. Typical density 2–6 protostars per large cloud. Spectral energy distribution peaks near 10–100 µm. When enabled, reveals hidden star-formation activity. Real: OMC-1 contains dozens of embedded sources. |
| Embedded Protostars | Protostar Outflow Jets | uProtostarJets | OFF | Bipolar jets from accreting protostars (velocity 50–200 km/s); ionization by shocks produces #4A7FFF blue-white narrow cones (opening angle 5–10°). When IR toggle active, jets visible as thin blue lines extending 0.2–0.5 ly from protostar center. Rendered as directional raymarched cones with 5-octave FBM (freq 6.5). Reveals dynamic accretion physics. |
| Embedded Protostars | Protostar Heating Halos | uProtostarHalos | OFF | Dust heated by embedded protostar radiation; renders as warm #FF9070 orange halo (radius 0.1 ly, opacity 20%) surrounding each IR-visible protostar. When enabled alongside IR protostars, reveals thermal environment around star-forming cores. Gaussian-blurred. Minor visual contribution (~8% when enabled). |

#### Magnetic Fields (Speculative) (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Magnetic Fields (Speculative) | Magnetic Field Direction Alignment | uMagneticField | OFF | Speculative feature: interstellar magnetic field (typical B 10–100 µG) aligns dust grain long axes and molecular cloud filaments perpendicular to field. Rendered as directional FBM texture with elongation bias (fractal dimension oriented along field lines). Field topology can be spiral, radial, or dipole. When enabled, adds coherent structure; visual realism ~12%. |
| Magnetic Fields (Speculative) | Polarized Dust Grain Tracing | uPolarizationMap | OFF | Speculative overlay: dust grain polarization measurable via submillimeter observations creates vector field visualization. Rendered as oriented line elements color-mapped by direction (#3F7FFF blue for one orientation, #FF7F3F orange perpendicular). When enabled simultaneously with uMagneticField, reveals hidden magnetic topology. Scientifically rich but entirely speculative. |
| Magnetic Fields (Speculative) | Magnetic Pressure Confinement | uMagneticPressure | OFF | Speculative subtle effect: magnetic pressure partially supports cloud against gravitational collapse; manifests as slight radial pressure-support term reducing infall density gradient. Raymarched as modified density profile with flattened core. When enabled, prevents unrealistic steep density gradients. Visual contribution ~3%; computationally trivial. |

#### Molecular Chemistry Zones (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Molecular Chemistry Zones | Molecular H₂ Zone (Coldest Interior) | uH2Zone | OFF | Speculative: molecular hydrogen dominates interior (temperature 10–20 K, density 1000–10,000 cm^-3). When enabled, toggles highest-density core visualization with densest FBM concentration and darkest color #000000. Physically interior zone but visually subtle (appears as slightly darker core). |
| Molecular Chemistry Zones | Carbon Monoxide (CO) Transition Zone | uCOZone | OFF | Speculative: CO abundance peaks at intermediate density/temperature (~20–50 K, 100–1000 cm^-3). When enabled, highlights transition shell between H2 interior and atomic H exterior via faint #0A0808 ring structure. Renders as raymarched shell with Gaussian cross-section. Visual contribution minimal (~3%). |
| Molecular Chemistry Zones | Complex Organic Molecule (COM) Halo | uCOMHalo | OFF | Speculative: complex organics (HNCO, CH3CN, etc.) concentrate in warm outer regions near embedded sources. When enabled, renders as faint #1A1010 reddish tint in outer 0.2 ly of cloud. Gaussian smooth. Minor visual contribution (~2%). Scientifically motivated but invisible to naked eye. |

#### Turbulence & Velocity Structure (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Turbulence & Velocity Structure | Supersonic Turbulence Cascade | uTurbulence | OFF | Molecular clouds exhibit supersonic turbulence (Mach 5–10); cascading velocity fluctuations across scales 0.001–1.0 ly. When enabled, applies spectral-synthesis temporal warp to FBM texture (octaves 6–12, frequencies 2–256 Hz time-varying). Creates subtle "twitching" motions simulating turbulent eddies. Computationally expensive; toggleable for performance. |
| Turbulence & Velocity Structure | Velocity Shear Indicator (Speculative) | uVelocityShear | OFF | Speculative color-coded velocity visualization: approaching gas #3F7FFF blue-shifted, receding #FF7F3F red-shifted. Rendered via velocity-field sampling along raymarched ray direction. When enabled, adds color gradient across cloud revealing kinematic structure; aids scientific understanding but unobservable without spectroscopy. |

#### Star Formation Regions & YSOs (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Star Formation Regions & YSOs | Young Stellar Object (YSO) Clustering | uYSOClusters | OFF | Dense aggregations of protostars (5–20 per cluster, spaced ~0.05 ly apart) marking active star formation pockets. When enabled alongside IR toggle, renders clusters of #FF7040 orange point sources within densest cloud regions. Typical spacing determines clustering frequency. Real: OMC-1 South shows OB1 cluster. |
| Star Formation Regions & YSOs | YSO Bipolar Outflow Markers | uOutflowMarkers | OFF | Collective bipolar outflows from multiple YSOs create cavities and shock fronts. When IR toggle active, renders as faint #4A7FFF blue cones/lobes around YSO clusters. Additive blend at 20% opacity. When enabled, reveals outflow structure; visual contribution ~10%. |
| Star Formation Regions & YSOs | Herbig-Haro Emission (Shock Ionization) | uHHObjects | OFF | High-velocity shocks from YSO jets ionize gas, producing #FF5050 red Hα emission in narrow HH objects (width 0.01 ly, length 0.2–0.5 ly). When optical Hα toggle enabled, renders as thin red lines near embedded protostars. Emission-only (not extinction). When enabled, adds red shock tracers. |

#### Interface with H II Regions (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Interface with H II Regions | Ionization Front Boundary | uIonizationFront | ON | Sharp transition (thickness 0.05 ly) between ionized H+ (bright H II region exterior) and neutral/molecular H (dark cloud interior). Rendered as raymarched step-function discontinuity in density and ionization state. Color boundary #0A0808 (dark) vs #FF5540 (bright emission region exterior). Visually defines cloud-HII interface. |
| Interface with H II Regions | Photodissociation Region (PDR) Halo | uPDRHalo | ON | Intermediate zone (width 0.1–0.2 ly) where photons dissociate molecules; temperature rises 50–500 K but insufficient ionization (<1%). Renders as faint #1A1208 brownish halo at cloud periphery with soft exponential transition. Physically represents UV shielding gradient. Visual contribution ~5% but scientifically important. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Default Zoom Level | uCameraZoom | 1.0 | Preset camera distance 1.0 ly from cloud centroid, optimizing silhouette visibility against background. Field-of-view 50°. Appropriate for observing overall cloud morphology and fragmentation structure. |
| Camera | Pivot Point Centering | uCameraTarget | 0.0, 0.0, 0.0 | Camera orbits around densest cloud region centroid. Enables 360° inspection of 3D morphology; particularly reveals horsehead/pipe projections from various angles. |
| Camera | Orthographic / Perspective Toggle | uCameraMode | Perspective | Perspective projection (true) default for immersive silhouette visualization; orthographic (false) available for flat morphology comparison. |

---

### Supernova Remnant

**Entity ID:** ENT-5050
**Description:** Expanding shock shell (10–100 kpc diameter typical) ejected by stellar explosion. Multi-wavelength appearance: synchrotron emission (#3F96FF blue optical), X-ray hot corona (#FF5540 pink theoretical), dust-heated infrared (#FF8040 warm), molecular hydrogen shocks (#4A7FFF blue). Age-dependent morphology: young smooth (shell), middle clumpy (filaments), old fading into ISM. Central compact object (neutron star / pulsar / black hole) possible. Supernova remnants crucial for cosmic ray acceleration and ISM enrichment. Real exemplars: Crab Nebula (M1, young), Cassiopeia A (Cas A, clumpy), SN 1006 (smooth shell), Tycho (historic), Vela pulsar (middle-age).

**Section Count:** 8
**Total Feature Count:** 33

#### Expanding Shock Shell (5 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Expanding Shock Shell | Primary Shock Shell Boundary | uShockShell | ON | Main expanding spherical shock front (radius 1–30 ly, typical velocity 1,500–14,500 km/s giving motion ~0.01 ly/year). Rendered as raymarched spherical shell with 4-octave Simplex FBM (freq 4.0, amplitude 0.7) creating roughness. Color #4A7FFF blue-white synchrotron emission. Thickness approximately 0.01 ly (shock compression zone). Critical primary structure. |
| Expanding Shock Shell | Shell Thickness Gradient | uShellThickness | ON | Shock compression thickness varies with ambient density heterogeneity (0.005–0.03 ly); denser regions show thicker shell. Rendered as variable-thickness raymarched surface (thickness modulated by local 2-octave FBM, freq 2.5). Creates realistic undulation in shell apparent width. Physical basis: stronger compression at higher density. |
| Expanding Shock Shell | Shock Front Curvature Instability | uRayleighTaylor | ON | Rayleigh-Taylor instability develops along shock as cooler ejecta pushes lighter swept-up ISM; creates wrinkled appearance. Rendered via high-frequency FBM perturbation (freq 8.0, octaves 3) applied to shell geometry (amplitude ±0.02 ly). Produces characteristic "corrugated" shell morphology. Real: Cassiopeia A shows prominent corrugations. |
| Expanding Shock Shell | Reverse Shock Interior | uReverseShock | ON | Lower-density interior shock (moving inward through ejecta) creates secondary brightness depression interior to shell. Rendered as raymarched dark zone (density ~20% of main shell) within shell thickness. Color #1A3050 dark blue. Subtle but physically important for accurate SNR structure. Visible only when edge-lit appropriately. |
| Expanding Shock Shell | Expansion Proper Motion (Speculative Velocity) | uExpansionVelocity | OFF | Speculative temporal evolution: shell expands at 0.01 ly/year (typical); toggling enables time-lapse simulation over hours representing kiloannual evolution. Rendered as radius scaling over simulation time parameter (0–10,000 years adjustable). When enabled, shows SNR aging sequence. Computationally simple animation. |

#### Synchrotron Emission (Optical / Radio) (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Synchrotron Emission (Optical / Radio) | Synchrotron Radio-to-Optical Continuum | uSynchrotron | ON | Non-thermal emission from relativistic electrons spiraling in magnetic field (~1–10 µG); peaks radio (1 GHz at cm wavelengths) but extends to X-ray. Optical representation uses #4A7FFF blue color reflecting typical radio-optical synchrotron spectrum. Raymarched emission volume following shell geometry (4-octave FBM, freq 4.5). Brightness ~100% of shell intensity. |
| Synchrotron Emission (Optical / Radio) | Synchrotron Spectral Hardness Gradient | uSpectralHardness | ON | Synchrotron spectrum index α hardness varies spatially: young remnants steeper (α~0.5, faint), evolved remnants flatter (α~0.3, bright). Rendered as spatial gradient in brightness: shell brightest near shock (younger ejecta), dimmer interior (older ejecta), opacity scaling with local energy release. Creates brightness stratification. |
| Synchrotron Emission (Optical / Radio) | Magnetic Field Amplification Zones | uMagneticAmplification | OFF | Shock compression amplifies magnetic field (B ∝ ρ^(2/3) for adiabatic) creating brighter synchrotron zones at density concentrations. When enabled, renders brightness enhancement (~20% boost) at filamentary structure intersections. Raymarched as secondary additive glow layer (freq 6.0 FBM). Computationally inexpensive. |
| Synchrotron Emission (Optical / Radio) | Polarization Structure (Speculative) | uPolarizationField | OFF | Speculative synchrotron polarization visualization: magnetic field directionality produces linear polarization. When enabled, renders as oriented texture elements color-mapped (#3F7FFF blue for one B-direction, #FF7F3F orange perpendicular). Adds directional structure indication but visually subtle. |

#### X-ray Corona (Hot Shocked Gas) (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| X-ray Corona (Hot Shocked Gas) | X-ray Hot Gas Interior | uXrayCorona | OFF | Shocked thermal plasma (temperature 1–10 million K) interior to shock shell emits X-ray bremsstrahlung (#FF5540 theoretical pink, unobservable optically). When X-ray toggle enabled, renders as inner halo (#FF6080, opacity 40%) surrounding shell. Raymarched Gaussian profile (e-folding radius 0.05 ly beyond shell). Computationally cheap overlay. Real: visible in Chandra X-ray Observatory images. |
| X-ray Corona (Hot Shocked Gas) | Thermal Ion Lines (OIII, FeXXV, NeMX) | uThermalLines | OFF | Hot plasma emits characteristic strong forbidden lines: OIII (#3FCFA8 teal), iron (#FF5080 red), neon (#A0C0FF pale blue). When X-ray mode enabled, renders as multi-channel emission composite (additive blend of three colors). Creates "hot pink" composite appearance characteristic of hot SNR interiors. Minor visual contribution (~8% when enabled). |
| X-ray Corona (Hot Shocked Gas) | Ejecta Heating Zone | uEjectaHeating | OFF | Shock compresses and heats ejecta to ~1 million K; appears as intermediate-temperature zone interior to reverse shock. When enabled, renders as secondary emission shell (#FF8050 warm orange) at distance ~0.02 ly interior to primary shock. Gaussian-smoothed. Physical basis: reverse shock compression. |
| X-ray Corona (Hot Shocked Gas) | Diffuse Thermal Halo | uThermalHalo | OFF | Extended thermal halo (radius 0.1–0.5 ly beyond shell) from hot swept-up ISM; temperature 10,000–100,000 K (intermediate X-ray softness). When X-ray toggle enabled, renders as very faint #FF7060 warm pink exponential halo (opacity 10%, e-folding 0.15 ly). Subtle but scientifically important outer boundary. |

#### Central Compact Object (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Central Compact Object | Neutron Star / Pulsar Core | uCompactObject | ON | Collapsed stellar core at SNR center; radius ~0.0003 ly (10 km; 1.4 solar masses, unresolved in visualization). Rendered as point light #FFFFFF with slight #FFD0A0 thermal tint, falloff radius 0.15 ly. Primary energy source for young SNR via pulsar wind nebula (if applicable). Position fixed at origin. Real: Crab Nebula contains Crab Pulsar. |
| Central Compact Object | Pulsar Spin-Down Luminosity | uPulsarLuminosity | ON | Pulsar releases rotational kinetic energy (~10^32 erg/s young, ~10^30 erg/s old) illuminating surroundings. Rendered as point-light brightness scaling with age parameter (bright young, faint old). Falloff radius 0.2 ly typical. When age parameter adjusted, brightness dynamically scales mimicking SNR evolution. |
| Central Compact Object | Neutron Star Magnetic Field Perturbation | uMagneticPerturbation | OFF | Pulsar's intense magnetic field (~10^12 Gauss) creates subtle density/velocity perturbations in surrounding SNR gas. Speculative visualization: renders as faint swirl/rotation pattern around central region. When enabled, adds visual marker of compact object presence; minor contribution (~5%). |

#### Pulsar Wind Nebula (PWN) (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Pulsar Wind Nebula (PWN) | PWN Toroidal/Torus Structure | uPWN | OFF | High-velocity pulsar wind (velocity ~0.1c, Lorentz factor γ~1000) collides with SNR ejecta, forming termination shock; often creates toroidal or torus-like structure. When enabled, renders as raymarched torus (major radius 0.05 ly, minor radius 0.02 ly) with bright #4A7FFF blue synchrotron emission (4-octave FBM interior, freq 6.0). Center position fixed at central compact object. Real: Crab Nebula PWN visible as central feature. |
| Pulsar Wind Nebula (PWN) | PWN Jets (Bipolar) | uPWNJets | OFF | Pulsar magnetic field collimation produces bipolar jets along rotation axis; velocity ~0.3c, length 0.15–0.3 ly. When enabled, renders as pair of bright #4A7FFF blue cones (opening angle 20°) extending along z-axis from compact object. Raymarched with 5-octave FBM interior (freq 7.0). Real: Vela pulsar shows prominent jets. |

#### Ejecta Filaments (Clumped Material) (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Ejecta Filaments (Clumped Material) | Oxygen-Rich Filament Knots | uOxygenFilaments | ON | Oxygen-rich ejecta (nuclear burning product) appears as bright #FF4050 red knots/filaments within SNR interior. Width 0.02–0.1 ly, distributed non-uniformly. Rendered as high-frequency FBM (freq 7.0, octaves 4) concentration at specific spatial regions, colored red. Emission dominates at shock fronts where kinetic energy converts to heat. Real: Cassiopeia A shows prominent oxygen-rich clumps. |
| Ejecta Filaments (Clumped Material) | Sulfur-Rich Filament Regions | uSulfurFilaments | ON | Sulfur-rich ejecta (#E63060 deep red) concentrated in separate zones from oxygen (different nuclear burning origin). Rendered as second frequency FBM layer (freq 5.5) non-overlapping with oxygen knots. Creates color variation across SNR. Real: Cas A shows spatially distinct S and O zones. |
| Ejecta Filaments (Clumped Material) | Iron-Peak Element Ejecta | uIronEjecta | ON | Iron/nickel core material (#FF7050 orange-red) most interior; slowest-moving, densest ejecta. Rendered as low-frequency FBM concentration (freq 2.0) toward center, color #FF7050. Dimmest of ejecta components optically (bright in iron lines but faint continuum). Creates inner core appearance. |
| Ejecta Filaments (Clumped Material) | Hydrogen/Helium Swept-up Envelope | uSweepUpLayer | ON | Low-density outer envelope of swept-up ISM hydrogen/helium; dominates shell outer regions. Rendered as smooth FBM layer (freq 1.5) forming shell boundary at radius ~0.015 ly beyond shock. Color #4A7FFF pale blue (synchrotron). Optically dominant; often only visible component in young SNR. |

#### Ionized Oxygen Shells (Speculative) (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Ionized Oxygen Shells (Speculative) | OIII Forbidden Line Emission (#3FCFA8) | uOIIIShell | OFF | Speculative: doubly-ionized oxygen produces strong #3FCFA8 teal forbidden emission at shock fronts. When enabled, adds secondary emission shell at shock location with ~30% opacity overlay. Raymarched as thin Gaussian shell. When combined with radio/optical synchrotron, creates composite multi-colored appearance. Computationally trivial addition. |
| Ionized Oxygen Shells (Speculative) | Hα Recombination Emission | uHAlpha | OFF | Speculative: hydrogen recombination produces #FF5540 Hα 656.3 nm line (weaker than oxygen but bright). When enabled, adds faint red overlay at shock front. Opacity 20%, Gaussian profile (width 0.005 ly). Real SNR images show Hα as important diagnostic. Visual realism gain ~8%. |

#### Dust Formation Zones (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Dust Formation Zones | Dust Condensation Zones | uDustZones | ON | SNR ejecta cools behind reverse shock, allowing dust nucleation (T 200–1000 K). Renders as faint #8A5040 warm-brown FBM zones (freq 3.0, octaves 2) distributed throughout ejecta. Opacity 20%. Represents carbonaceous/silicate grain formation. Real: Cas A shows evidence of significant dust formation. |
| Dust Formation Zones | Infrared Emission from Hot Dust | uIRDust | OFF | Dust heated by shock/pulsar wind radiates in infrared (#FF9070 orange theoretical). When IR toggle enabled, renders as warm orange halo zones overlaid on dust condensation regions. Gaussian smooth. When enabled, reveals thermal signature; visual contribution ~10%. |
| Dust Formation Zones | Dust Grain Destruction Shock | uDustDestruction | OFF | Sputtering/destruction of dust grains in very hot post-shock region (T >5000 K); creates low-dust zone around shock front. When enabled, renders as narrow dark zone (opacity reduction ~30%) at shock boundary. Subtle effect but physically important for SNR chemistry. Visual contribution ~3%. |

#### Ambient Interaction & Morphology Evolution (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Ambient Interaction & Morphology Evolution | Ambient ISM Density Modulation | uAmbientDensity | ON | Heterogeneous ambient ISM density (0.1–10 cm^-3) creates asymmetric SNR expansion. Rendered as low-frequency FBM spatial variation (freq 1.0, octaves 1) applied as radial scaling to shell radius (±20% variation). Creates "lumpy" expansion morphology. Real: SNRs rarely perfectly spherical due to ISM clumping. |
| Ambient Interaction & Morphology Evolution | Shell Deceleration (Age-Dependent) | uDeceleration | OFF | SNR shock decelerates over time as swept-up ISM mass increases (velocity ∝ t^-3/5 Sedov phase). When enabled, shell expansion velocity parameter controlled by age (0–10,000 years); older SNR moves slower. Manifests as time-dependent radius scaling in animation. |
| Ambient Interaction & Morphology Evolution | Fragmentation into Supergiant Shells | uSupergiantShells | OFF | Speculative: cooling instabilities fragment shell into discrete supergiant shell structures (radius 0.1–0.5 ly). When enabled, adds secondary shell structure with ~50% opacity at scaled radius (e.g., 1.2× primary shell radius). Computationally inexpensive. Visual realism gain ~12%. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Default Zoom Level | uCameraZoom | 1.0 | Preset camera distance 2.0 ly from SNR center, optimizing shell and ejecta filament visibility. Field-of-view 45°. Appropriate for observing clumpy morphology and filament structure. |
| Camera | Pivot Point Centering | uCameraTarget | 0.0, 0.0, 0.0 | Camera orbits around SNR geometric center (compact object position). Enables 360° morphology examination revealing asymmetries and filament distribution. |
| Camera | Orthographic / Perspective Toggle | uCameraMode | Perspective | Perspective projection (true) default for immersive visualization; orthographic (false) available for flat shell geometry study. |

---

### 8.6 Wolf-Rayet Nebula (Wind-Blown Bubble)

**Entity ID:** ENT-5052
**Base Mesh:** Nested spherical shells (wind bubble + swept-up shell + ISM boundary)
**Shader Type:** Fragment (volumetric emission + shell dynamics + WR wind interaction)
**Exemplar:** NGC 6888 (Crescent Nebula, WR 136), M1-67 (WR 124, JWST), NGC 2359 (Thor's Helmet, WR 7), NGC 3199 (WR 18)

Wolf-Rayet nebulae are wind-blown bubbles created when the powerful stellar wind of a Wolf-Rayet star (v_w ~ 1000–3000 km/s, Ṁ ~ 10⁻⁵ M☉/yr) sweeps up material ejected during the star's prior red supergiant or LBV phase. The resulting structure has a classic Weaver et al. (1977) bubble morphology: a free-streaming WR wind zone, a hot shocked-wind interior, a thin dense shell of swept-up RSG/LBV ejecta, and the undisturbed ISM. These nebulae are distinct from planetary nebulae (lower-mass progenitor), SNR (explosion-driven), and H II regions (photoionization-driven). JWST's image of M1-67 around WR 124 revealed extraordinary clumpy detail in the ejected shell.

| Section | Feature | Uniform Name | Default | Description |
|---------|---------|-------------|---------|-------------|
| Central Star | WR Star Core | uWRStarCore | ON | Central Wolf-Rayet star: T_eff ~ 40,000–100,000K, L ~ 10⁵–10⁶ L☉. Color: WN subtype #A0B8FF (nitrogen-rich, cooler), WC subtype #C8D8FF (carbon-rich, hotter). Broad emission lines dominate spectrum. Point source at bubble center. Rendered with intense UV glow halo #D0E0FF, alpha 0.3, radius ~0.01 pc. |
| Central Star | Fast Wind Zone | uFastWind | ON | Free-streaming WR wind: v ~ 1500–3000 km/s, Ṁ ~ 10⁻⁵ M☉/yr. Fills inner cavity R ~ 0.5–2 pc. Low density: n ~ 1–10 cm⁻³. Essentially transparent. Rendered as very faint radial streaks #C8D8FF, alpha 0.02 emanating from star. Kinetic energy: L_wind = ½Ṁv² ~ 10³⁷ erg/s. This wind powers the entire bubble expansion. |
| Bubble Structure | Hot Shocked Wind Interior | uHotInterior | ON | WR wind shock-heated to T ~ 10⁷–10⁸ K (X-ray emitting). Fills volume between wind termination shock and swept-up shell. Pressure-driven expansion. Rendered: diffuse #5A7AAA, alpha 0.03, filling bubble interior. Chandra/XMM detection: soft X-ray emission. Thermal pressure: P/k ~ 10⁶–10⁷ K cm⁻³. Drives shell expansion. |
| Bubble Structure | Swept-Up Ejecta Shell | uEjectaShell | ON | THE defining visual: dense shell of swept-up RSG/LBV ejecta. R ~ 2–5 pc, thickness ΔR ~ 0.1–0.5 pc. Mass: 5–25 M☉. Clumpy structure: JWST reveals hundreds of dense knots. Color: Hα #FF5540 dominant, [N II] enhanced #FF7A50 (nitrogen-enriched ejecta). FBM clumping: 6-octave, freq 8.0, amplitude 0.25. Filamentary structure with Rayleigh-Taylor fingers pointing inward. |
| Bubble Structure | Shell Fragmentation & Clumps | uShellClumps | ON | Dense clumps within shell: n ~ 10³–10⁴ cm⁻³, size 0.01–0.1 pc. M1-67 (JWST): >100 resolved clumps. Clump color: brighter #FF6050, embedded in diffuse shell #FF5540. Clumps survive as they're denser than shell average — Kelvin-Helmholtz and Rayleigh-Taylor instabilities at clump boundaries. Individual clump mass: 10⁻³–10⁻¹ M☉. |
| Bubble Structure | Outer Shock / ISM Boundary | uOuterShock | OFF | Outermost boundary: forward shock into undisturbed ISM. Compression: ×4 for strong adiabatic shock. Weak emission compared to ejecta shell. Color: faint #4A6AFF (shock-ionized), alpha 0.05. Radius: ~5–10 pc. Expansion velocity: 20–50 km/s (decelerated from initial wind speed). Often invisible observationally — dominated by bright ejecta shell. |
| Emission | Hα / [N II] Dominance | uHalphaNII | ON | NGC 6888 defining feature: [N II] 6583Å emission comparable to or exceeding Hα — signature of CNO-processed ejecta (nitrogen-enriched). [N II]/Hα ratio: 1–3 (vs. ~0.3 for normal H II regions). Color rendering: warmer red-orange #FF6A40 compared to pure Hα #FF5540. Diagnostic of WR nebula vs. H II region. Spatial variation: [N II] enhanced at shell leading edge. |
| Emission | [O III] Emission | uOIIIEmission | ON | Doubly-ionized oxygen 5007Å: teal-green #3FCFA8. Strongest near central star (high ionization parameter). [O III]/Hβ ratio: 3–10. Creates blue-green halo interior to Hα shell. Ionization stratification: [O III] closer to star, [N II]/Hα at shell. NGC 2359 (Thor's Helmet) shows dramatic [O III] vs Hα morphological difference. |
| Emission | Dust Emission (IR) | uDustIR | OFF | Warm dust in shell: T ~ 50–100K, emitting at 24–70 μm. JWST MIRI: M1-67 spectacular in mid-IR revealing dust-rich clumps. Color false-color: #FF8A40 (warm dust). Dust-to-gas ratio enhanced in ejecta (dust formed in RSG/LBV wind). Spatial correlation: dust emission traces densest clumps. Spitzer/Herschel: extended far-IR emission from swept-up ISM dust. |
| Morphology | Crescent / Limb-Brightened Shape | uCrescentShape | ON | NGC 6888 archetype: crescent (limb-brightened ellipse) morphology. Caused by: density gradient in pre-existing RSG wind (denser in one direction), or stellar motion through ISM creating bow-shock asymmetry. Brightness ratio: bright limb / faint limb ~ 3–10. Rendered as ellipsoidal shell with asymmetric brightness. Major axis: 5–8 pc. |
| Morphology | Bipolar Lobes | uBipolarLobes | OFF | Some WR nebulae show bipolar structure (NGC 6164/5 around HD 148937). Caused by: equatorial density enhancement from rapid rotation or binary interaction during RSG/LBV phase. Two opposed lobes with equatorial waist. Lobe color: #FF5A40, waist: brighter #FF7A50. Opening angle: 40°–80°. Alternative to spherical/crescent morphology. |
| Morphology | Radial Filaments | uRadialFilaments | ON | Fine radial filamentary structure: streamers pointing inward from shell toward star. Width: 0.01–0.05 pc, length: 0.5–2 pc. Rayleigh-Taylor instability fingers from hot interior pushing into dense shell. Color: same as shell #FF5540 but thinner, alpha 0.4. FBM variation along length: 3-octave, freq 15.0. ~20–50 visible filaments per hemisphere. |
| Dynamics | Shell Expansion Velocity | uShellExpansion | ON | Shell expanding at 50–100 km/s (measurable via emission line splitting). Rendered as radially outward motion vectors on shell. Expansion age: R/v_exp ~ 10⁴–10⁵ yr. Deceleration as shell sweeps up more material. Proper motion: ~0.01–0.1 arcsec/yr at typical distances. Animation: slow outward drift of shell structure. |
| Dynamics | Wind-Shell Interaction Zone | uWindShellInteraction | OFF | Kelvin-Helmholtz instabilities at interface between hot interior and dense shell. Mixing: hot gas entraining cool shell material. Renders as turbulent boundary layer #8A7ACC between interior and shell. Conductive evaporation: shell material heated to X-ray temperatures. Controls mass loading and energy budget of bubble. |
| Environment | Pre-existing RSG Wind | uRSGWind | OFF | Red supergiant wind swept up by WR bubble: v_RSG ~ 10–30 km/s, Ṁ_RSG ~ 10⁻⁵ M☉/yr. Creates slow dense medium into which WR wind expands. Density: n ~ 10²–10³ cm⁻³ at 1 pc. Color: warm #C89870, alpha 0.08. Partially visible beyond main bubble shell. Mass: 5–20 M☉ (most of original star's envelope). WR bubble expands into this medium, not pristine ISM. |
| Environment | Surrounding H II Region | uHIIRegion | OFF | WR star's UV ionizes ISM beyond nebula: extended H II region R ~ 10–30 pc. Color: faint #FF5540, alpha 0.03. Lower surface brightness than WR nebula shell. May be indistinguishable from field H II regions. NGC 2359 embedded in larger H II region. Provides context for WR nebula as small bright structure within larger ionized volume. |
| Camera | Standard View | uCameraMode | ON | Default: full nebula filling frame. Narrowband composite: Hα+[N II] (red/orange) + [O III] (teal). Scale bar: 2 pc marked. Central WR star as bright point. Crescent or elliptical morphology visible. Distance: typical 1–5 kpc. Clumpy shell structure resolved. |
| Camera | JWST Mid-IR View | uCameraMode | OFF | M1-67/WR 124 JWST perspective: mid-IR false-color showing dust-rich clumps in extraordinary detail. Color: #FF8A40 → #FFC060 (MIRI bands). Reveals dust structures invisible in optical. Individual clumps and filaments resolved at ~0.01 pc scale. |
| Camera | Time Speed Multiplier | uTimeSpeed | 10⁴ yr/s | At default: shell expansion (~10⁵ yr timescale) visible over ~10 seconds. Clump evolution and instability growth visible. Slow to 10² yr/s for wind-shell interaction dynamics. Full WR phase duration (~5×10⁵ yr) → ~50 seconds. |

---


---

## 9. Galaxies

Galaxies are gravitationally bound systems of stars, gas, dust, and dark matter. Spiral galaxies (like the Milky Way) have flattened disks with winding arms and central bulges; elliptical galaxies are smooth, gas-poor, and dominated by old stars; irregular galaxies lack symmetric structure, often due to gravitational interactions; active galaxies (AGN/Quasars) host supermassive black holes that outshine their stellar populations.

### Spiral Galaxy (Milky Way-type)

**Entity ID:** ENT-6010
**Description:** Disk galaxy with 2–4 logarithmic spiral arms extending from a central bulge. Blue star-forming regions (#B8D0FF) light the arms; older yellow/red bulge (#FFD8A0) dominates center. Dust lanes (#3A2F28 dark brown-black) carve dust extinction across disk plane. Halo of globular clusters and dark matter extends far beyond disk. Central supermassive black hole (10^6–10^10 solar masses) anchors rotation. Differential rotation (core: ~25 km/s at 2 kpc, disk: ~200 km/s outer edge) visible via speculative Doppler edge-tint. Stellar streams and satellite galaxies (possible) visible around halo. Real exemplars: Milky Way (seen edge-on via our position), Andromeda (M31, face-on), Pinwheel (M101, face-on), Whirlpool (M51, interacting).

**Section Count:** 8
**Total Feature Count:** 35

#### Galactic Bulge & Bar (5 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Galactic Bulge & Bar | Central Bulge (Spheroid) | uBulge | ON | Dense stellar spheroid (semi-major axis 0.5–2.0 kpc) composed of old red/yellow stars (age >8 Gyr, population II). Rendered as raymarched Sérsic density profile (n~4, roughly r^(-1/4) radial falloff) with 3-octave FBM interior (freq 2.0, amplitude 0.3) creating roughness. Color #FFD8A0 warm yellow-gold. Brightness peaks centrally; dominates galaxy luminosity interior 3 kpc. Real: Milky Way bulge ~1 kpc half-light radius. |
| Galactic Bulge & Bar | Bar Structure (If Present) | uBar | ON | Linear concentration of old stars stretching 1–3 kpc from center along major axis; ~50–70% of disk galaxies show bar structure. Rendered as elongated density enhancement along x-axis (aspect ratio 1:3 typical) using anisotropic FBM (freq 3.0, directional bias). Color #E8C070 warm yellow. Position angle adjustable (default ~25–30° from Sun-Galactic center line). Real: Milky Way shows moderate bar ~3–5 kpc half-length. |
| Galactic Bulge & Bar | Bulge Velocity Dispersion Signature | uBulgeDispersion | OFF | High stellar velocity dispersion (σ~100 km/s) in bulge contrasts disk rotation. Speculative feature: when enabled, applies radial texture warping (max displacement 0.1 kpc) simulating velocity anisotropy. Creates slightly turbulent visual appearance in bulge region. Computationally cheap; visual contribution ~8%. |
| Galactic Bulge & Bar | Central Star Density Enhancement | uCoreConcentration | ON | Innermost ~0.2 kpc shows enhanced stellar concentration (power-law cusp ρ ∝ r^-α, α~1.5–2) from stellar sedimentation toward SMBH. Rendered as additional high-frequency FBM layer (freq 6.0, octaves 2) concentrated toward origin. Subtle brightening at bulge core. |
| Galactic Bulge & Bar | Bulge Metallicity Gradient | uMetallicityGradient | OFF | Speculative: bulge metallicity decreases radially (higher Z near center from older, more enriched stars). When enabled, applies color gradient from #FFF8D0 (very warm, high-Z center) to #D8B880 (cooler, lower-Z outer bulge). Subtle visual distinction; realism gain ~5%. |

#### Spiral Arms (6 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Spiral Arms | Logarithmic Spiral Geometry | uSpiralArms | ON | Primary structural element: 2–4 logarithmic spiral arms (pitch angle 12–26°, default 18°) extending outward from bar/bulge to disk edge (~10 kpc typical). Rendered as raymarched parametric logarithmic spiral (r = r₀ exp(θ cot(pitch))), 4-octave FBM interior (freq 5.0) creating filamentary structure. Color #B0D8FF bright blue-white young stars. |
| Spiral Arms | Spiral Arm Star Formation | uArmStarFormation | ON | High-density spiral density wave triggers star formation; HII regions (#FF5540 bright red) glow inside spiral arms at 0.2–0.5 kpc spacing. Rendered as bright emission knots positioned along spiral arms using 2D Poisson distribution (density ~3 per arm). Each HII region ~0.1 kpc diameter, bright #FF5540 Hα emission. Real: M51 shows bright HII knots strung along arms. |
| Spiral Arms | Spiral Shock Front Compression | uSpiralShock | ON | Density wave creates modest compression shock (Δρ/ρ ~20%) at spiral arm leading edge, visible as slight brightening. Raymarched as narrow Gaussian-profile ridge (width 0.05 kpc) along spiral curve with additive brightness boost (~15% intensity increase). Color #C8D8FF slightly brighter than arm base. |
| Spiral Arms | Multiple Arm Overlap & Interweaving | uMultipleArms | ON | 2–4 arms create complex overlapping pattern (2-armed → grand design, 3+ → flocculent). Rendered as superposition of spiral parametric functions (phase shifts 90°, 180°, 270° between arms). Results in complex density map with arm crossing zones. Controlled by uArmCount uniform (typically 2 or 3 default). |
| Spiral Arms | Pitch Angle Variation with Radius | uPitchVariation | OFF | Speculative: pitch angle gradually changes radius (inner arms tight pitch~20°, outer arms loose pitch~25°). When enabled, modulates spiral function pitch parameter as r-dependent function. Creates gradually unwinding appearance. Visual realism gain ~8%; computationally inexpensive. |
| Spiral Arms | Trailing/Leading Arm Orientation | uArmOrientation | ON | Spiral arms trail behind galactic rotation (standard trailing configuration; angle ~20° lag). Leading arms rare (tightly wound, unstable). Default trailing; adjustable for morphological variation. Affects visual direction of spiral curvature. Real: Milky Way trailing arms, M101 trailing. |

#### Disk & Dust Lanes (5 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Disk & Dust Lanes | Thin Stellar Disk | uThinDisk | ON | Primary disk of young/intermediate stars (age 0.1–5 Gyr, population I); scale height ~0.3 kpc, scale radius ~3 kpc. Color #B8D0FF bright blue-white. Rendered as raymarched disk volume with exponential radial falloff (radius profile e^(-r/3 kpc)) and Gaussian vertical profile (σz = 0.15 kpc). Brightness dominates at intermediate radii (1–8 kpc). |
| Disk & Dust Lanes | Thick Disk (Halo Disk) | uThickDisk | ON | Secondary disk (age >5 Gyr, lower metallicity) with larger scale height ~1.0 kpc, contributing ~10–15% disk light. Rendered as outer exponential disk (scale radius 4 kpc, scale height 1 kpc) with #D8C080 warmer color. Opacity ~20% of thin disk. Real: Milky Way thick disk well-measured from stellar kinematics. |
| Disk & Dust Lanes | Dust Lane Extinction | uDustLanes | ON | Dark dust lanes (#3A2F28 dark brown-black) carving across disk, concentrated in spiral arms; optical depth 0.5–3.0 typical. Rendered as 3-octave Simplex FBM (freq 3.5, lacunarity 2.1) modulating local density/opacity, concentrated at z~0 (disk midplane). Creates patchy dark obscuration across disk. Crucial for visual realism. |
| Disk & Dust Lanes | Atomic Hydrogen (HI) Layer | uHILayer | ON | Neutral hydrogen extends beyond stellar disk (radius ~12–15 kpc, scale height ~0.4 kpc); dominates radial extent. Rendered as very low-opacity (#AA9080 reddish-tan halo) outer envelope using 1-octave FBM (freq 1.0). Opacity ~5–10% of disk peak. Represents diffuse ISM. |
| Disk & Dust Lanes | Warped Outer Disk (Speculative) | uWarp | OFF | Many galaxies show z-warping at large radius (>8 kpc); disk plane tilts ~20° at edges. When enabled, applies sinusoidal z-offset to disk structure at large radii (amplitude ±0.3 kpc, period ~180° azimuth). Creates slight wave-like appearance when viewed edge-on. Visually subtle but realistic; ~5% contribution. |

#### Star-Forming Regions & HII Regions (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Star-Forming Regions & HII Regions | Giant HII Region Complexes | uHIIRegions | ON | Massive star-forming regions (diameter 0.2–1.0 kpc, luminosity ~10^39 erg/s); typically located in spiral arms. Rendered as bright #FF5540 red emission knots (FBM interior freq 6.0, octaves 3) scattered along arms via Poisson distribution. Density ~5–10 regions per 5 kpc arm segment. Real: M51 Whirlpool, NGC 7331 show prominent HII regions. |
| Star-Forming Regions & HII Regions | Ionized Hydrogen Nebulosity | uNebulosity | ON | Diffuse Hα ionized gas surrounding HII regions and distributed throughout disk; fainter than HII knots. Rendered as low-intensity #FF5080 overlay (opacity 20%, FBM freq 2.0) following spiral-arm-correlated density pattern. Creates apparent "glow" within spiral structure. Additive blend. |
| Star-Forming Regions & HII Regions | Stellar Population Age Gradient | uAgeGradient | ON | Star formation concentrates in spiral arms (young ~50 Myr age), outer disk older. Rendered as color gradient: arm stars #B0D8FF bright blue, inter-arm regions #FFD8A0 warmer yellow. Smooth interpolation between arm and inter-arm color. Reveals star-formation geography. |
| Star-Forming Regions & HII Regions | Wolf-Rayet & OB Association Markers | uOBAssociations | OFF | Massive short-lived stars (WR, OB) located in active star-forming spiral arms; age <5 Myr. When enabled, renders as small bright #8AB0FF violet-blue point clusters scattered throughout spiral arms (density ~0.5 per 1 kpc). Speculative cosmetic layer; visual contribution ~3%. |

#### Halo & Globular Clusters (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Halo & Globular Clusters | Galactic Halo Stellar Distribution | uHalo | ON | Extended spherical halo of old stars (population II, age >10 Gyr) with metallicity Z/Z☉ ~0.3–0.001. Color #8A7060 warm reddish-brown. Rendered as raymarched spherical halo with power-law density profile (ρ ∝ r^-3.5 typical). Radius extends 30–50 kpc (far beyond disk). Brightness ~1–5% disk peak; subtle but essential context. |
| Halo & Globular Clusters | Globular Cluster Population | uGlobularClusters | ON | Spherical collections of ~10^5–10^6 old stars (age >10 Gyr), distributed throughout halo and concentrated toward bulge. Rendered as small bright #FFD8A0 warm spheres (radius 0.1–0.3 kpc apparent size) positioned randomly within halo (density ~50–200 clusters per galaxy typical). Each cluster rendered as raymarched sphere with Sérsic profile. Real: Milky Way ~150 globular clusters. |
| Halo & Globular Clusters | Cluster Concentration Toward Bulge | uClusterBulgeConcentration | ON | Globular cluster spatial distribution weighted toward galactic center (power-law radial concentration). Rendered as spatial density modulation of cluster positions (higher density near bulge, falloff with radius). Creates visual concentration of bright points toward center. |
| Halo & Globular Clusters | Halo Substructure & Streams | uStellarStreams | OFF | Tidal disruption of satellite galaxies and globular clusters creates long thin stellar streams (length 10–50 kpc, width 0.5–2 kpc). When enabled, renders as faint #A08080 brownish streams extending from halo, traced via sparse elongated FBM (freq 1.0). Subtle effect; ~8% visual contribution when enabled. |

#### Central Supermassive Black Hole Region (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Central Supermassive Black Hole Region | SMBH Gravitational Sphere of Influence | uSMBH | ON | Central supermassive black hole (mass ~10^6–10^10 solar masses, unresolved in visualization); gravitational sphere of influence radius ~0.01–1 kpc (depends on mass). Position fixed at galaxy center. Rendered as point mass affecting nearby star orbits (speculative orbital warp). Falloff radius 0.5 kpc typical. Visual marker via subtle density concentration. |
| Central Supermassive Black Hole Region | Nuclear Star Cluster | uNuclearCluster | ON | Dense concentration of stars surrounding SMBH; mass ~10^7–10^8 solar masses (comparable to SMBH itself). Rendered as bright #FFE0B0 warm-white sphere (radius 0.05–0.1 kpc) at galaxy center. Color slightly hotter than bulge. Real: Milky Way's Sagittarius A* surrounded by ~10^7 solar masses in stars. |
| Central Supermassive Black Hole Region | Circumnuclear Disk (Speculative) | uCircumnuclearDisk | OFF | Speculative: disk of gas/stars in equatorial plane around SMBH (radius 0.01–0.1 kpc); observed in some AGN. When enabled, renders as thin bright disk (#FFD8A0 warm) perpendicular to rotation axis at galaxy center. Visual marker of SMBH environment; ~5% contribution. |
| Central Supermassive Black Hole Region | SMBH Orbital Perturbation (Speculative) | uOrbitalPerturbation | OFF | Speculative: nearby stars show orbital perturbations from SMBH gravity; manifests as slight radial density depletion (cavity) around SMBH. When enabled, raymarches reduced density within 0.1 kpc of center. Very subtle effect; visual contribution <1%. |

#### Satellite Galaxies & Companions (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Satellite Galaxies & Companions | Satellite Galaxy Dwarf Companions | uSatellites | ON | Satellite dwarf galaxies orbiting main galaxy at 10–50 kpc distance (e.g., M31's M32, M110). Rendered as smaller secondary galaxy models (1–10% main galaxy mass) positioned randomly in halo. Each satellite rendered as miniature spiral/elliptical following uSatelliteType morphology. Typical count ~5–10 companions. Real: Milky Way has Large/Small Magellanic Clouds. |
| Satellite Galaxies & Companions | Satellite Tidal Stream Interaction | uTidalStreams | OFF | Satellite tidal disruption creates tidal tails or streams (length 10–50 kpc) extending from satellite toward/away from main galaxy. When enabled, renders faint #A08080 brownish stream connecting satellite to main halo. Raymarched low-opacity filament. Visual realism gain ~10%. |

#### Differential Rotation & Dynamics (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Differential Rotation & Dynamics | Differential Rotation Velocity Profile | uRotation | ON | Galactic rotation curve: core rising steeply, ~200 km/s already at ~1 kpc; disk ~220 km/s (8 kpc), remaining flat or slightly rising outward (flat rotation curve is key evidence for dark matter). Speculative representation: applies rotational velocity-field warp to disk texture coordinates. Rotation period ~2.5 × 10^8 years (250 Myr solar neighborhood). When enabled (default), creates subtle visual twist/rotation appearance over long time scales. |
| Differential Rotation & Dynamics | Doppler Velocity Tint (Speculative Edge Color) | uDopplerTint | OFF | Speculative: approaching disk rotation (near side) rendered #3F7FFF blue-shifted, receding side (far side) #FF7F3F red-shifted. Requires velocity-field sampling and edge-based coloration. When enabled, adds dynamical visual signature; ~10% realism gain but physically intuitive representation of kinematics. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Default Zoom Level | uCameraZoom | 1.0 | Preset camera distance 15 kpc from galaxy center (face-on viewing angle default), optimizing full spiral arm/disk visibility. Field-of-view 45°. Appropriate for overall morphology examination. |
| Camera | Pivot Point Centering | uCameraTarget | 0.0, 0.0, 0.0 | Camera orbits around galaxy center (SMBH position). Enables 360° rotation from face-on (0° inclination) to edge-on (90° inclination). Inclination angle adjustable to explore disk geometry from all orientations. |
| Camera | Orthographic / Perspective Toggle | uCameraMode | Perspective | Perspective projection (true) default for immersive disk visualization; orthographic (false) available for comparative flat morphology study. Inclination angle also affects 3D appearance. |

---

### Elliptical Galaxy

**Entity ID:** ENT-6020
**Description:** Featureless smooth stellar system ranging E0 (spherical) to E7 (highly elongated; aspect ratio 3:1 or flatter). Dominates high-mass galaxy population; mass range 10^8–10^13 solar masses. Composed nearly entirely of old red/yellow stars (population II, age >10 Gyr, metallicity Z/Z☉ 0.5–5.0). Negligible dust and gas; essentially zero star formation. Surface brightness profile follows de Vaucouleurs r^(1/4) law (bright core, gradual fading). Hot X-ray halo (10^7 K) surrounds system. Globular cluster population ~10–100% of Milky Way. Evidence of past mergers common: shell structures, kinematic misalignment, tidal streams. Supermassive black hole central mass 10^8–10^10 solar masses. Real exemplars: Elliptical giants M87 (10^13 solar masses, dominant galaxy in Virgo Cluster), NGC 1316 (shell structure from merger), NGC 4261 (central jet), M32 (satellite of M31).

**Section Count:** 8
**Total Feature Count:** 26

#### Stellar Halo & Core Profile (5 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Stellar Halo & Core Profile | de Vaucouleurs r^(1/4) Brightness Profile | uCoreBrightness | ON | Fundamental morphological profile: surface brightness I(r) ∝ exp(-b r^(1/4)); steep bright core, gradual outer falloff over large radii. Rendered as raymarched Sérsic density profile (n=4, roughly r^(-1/4) radial decay). Radius extends 30–50 kpc typical. Color #FFC080 warm yellow-gold (old stars). Brightness doubles within inner 0.1 Re (effective radius). |
| Stellar Halo & Core Profile | Effective Radius Scaling | uEffectiveRadius | 2.0 | Scale parameter defining characteristic galaxy size; effective radius Re where integrated light is half total. Typical range 1–30 kpc (giant ellipticals at far end). Rendered as parameterized Sérsic profile scaling (e-folding radius ~Re kpc). Adjustable for size variations; affects overall scale. Default 2 kpc (intermediate elliptical). |
| Stellar Halo & Core Profile | Core Excess / Nucleus Brightening | uCoreExcess | ON | Inner ~0.01 Re shows excess brightness from nuclear star cluster and/or central SMBH influence. Rendered as additional high-frequency component (FBM freq 6.0, octaves 2) concentrated within 0.1 kpc of center. Adds slight brightening spike at very center. Real: many ellipticals show nuclei. |
| Stellar Halo & Core Profile | Outer Envelope Faintness | uOuterEnvelope | ON | Outer regions fade to very low surface brightness (<27 mag/arcsec^2); extended halo dominates mass. Rendered as low-opacity FBM envelope (freq 0.5, octaves 1) extending to 3–5 Re with exponential falloff. Color #8A7060 warm reddish-brown. Subtle but essential for visual extent. |
| Stellar Halo & Core Profile | Boxy/Disky Isophotes (Speculative Shape) | uIsophoteShape | OFF | Speculative: isophotal shapes vary (boxy vs disky); related to angular momentum. Boxy shape appears "puffy," disky shape flattened. When enabled, applies subtle axial ratio variation with radius (minor axis increases/decreases with radius asymmetrically). Visual effect ~3–5%; adds morphological nuance. |

#### Color Gradient (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Color Gradient | Core-to-Halo Color Gradient | uColorGradient | ON | Radial metallicity/age gradient: high-Z warm yellow-gold core (#FFDA80) → lower-Z cooler red halo (#8A5040). Rendered as radial color interpolation (Hue shift ~30°, saturation reduction toward halo). Realistic representation of stellar population mixing. |
| Color Gradient | Radial Metallicity Enhancement | uMetallicityGradient | ON | Metallicity decreases outward (Z(r=0)/Z(r=Re) ~2–5 typical). When rendered, applies color reddening toward core, blueing toward halo. Produced via blend ratio adjustment of core (#FFF0C0 very warm core) vs halo (#A07050 cooler halo). |
| Color Gradient | Population Age Variation | uAgeGradient | OFF | Speculative: inner regions slightly younger from recent star formation or mergers (age ~9 Gyr) vs outer halo very old (age >13 Gyr). When enabled, applies subtle color distinction (core #FFDA80 slightly yellower, halo #8A5040 slightly redder). Visual contribution ~3%. |

#### Globular Cluster Population (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Globular Cluster Population | Globular Cluster System | uGlobularClusters | ON | Spherical halo of ~100–10,000 globular clusters (scaling with galaxy mass: dwarf ~10, giant ~1000). Rendered as small bright #FFD8A0 warm spheres (radius 0.05–0.2 kpc apparent size) positioned throughout galaxy volume via Poisson random distribution, radial density weighted by main galaxy density profile. Real: M87 hosts ~15,000 globular clusters. |
| Globular Cluster Population | Cluster Color Bimodality | uClusterBimodality | ON | Globular clusters exhibit bimodal color distribution: blue (young, low-Z, ~40%) vs red (old, high-Z, ~60%). Rendered as color assignment: ~40% clusters #8AB0FF blue, ~60% #FFD080 warm yellow. Creates visual color heterogeneity among cluster population. |
| Globular Cluster Population | Cluster Radial Distribution | uClusterProfile | ON | Globular cluster spatial distribution follows specific profile: more concentrated toward center than stars (power-law ρ_cl ∝ r^-2 typical vs star profile r^-1/4). Rendered as higher cluster density in inner regions. Creates visual concentration of bright points toward galaxy center. |

#### Hot X-ray Gas Halo (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Hot X-ray Gas Halo | X-ray Corona Thermal Halo | uXrayHalo | OFF | Hot diffuse gas (temperature 10^6–10^7 K) fills halo; radiates primarily in X-ray (unobservable optically). When X-ray toggle enabled, renders as faint #FF7060 warm pink halo (opacity 15%, FBM freq 0.8, octaves 1) extending 2–3 Re beyond stellar halo. Gaussian exponential falloff. Real: observed in Chandra X-ray Observatory images of giant ellipticals. |
| Hot X-ray Gas Halo | Intracluster Light (ICL) Component | uICL | ON | Diffuse intracluster light (unclaimed stars) fills outer galaxy regions; likely tidal disruption debris from galaxy-galaxy mergers. Rendered as very faint #AAA080 grayish halo (opacity 10–20%, extending to 5+ Re). Represents accumulated tidal streams/debris. Visual contribution ~8% but important for extended appearance. |
| Hot X-ray Gas Halo | Diffuse Outer Halo | uOuterHalo | ON | Faint outer envelope (3–10 Re) representing extended stellar population/tidal debris. Rendered as very low-opacity (#9A8070) smooth FBM (freq 0.3, octaves 1) with exponential falloff. Opacity <5%. Creates sense of extended halo environment. |

#### Shell Structure (From Past Mergers) (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Shell Structure (From Past Mergers) | Radial Shell Rings | uShellStructure | OFF | Evidence of past mergers: shell structures manifest as bright concentric rings at specific radii (spacing ~0.5–2 kpc), produced by tidal interactions during galaxy-galaxy merger. When enabled, renders as thin bright rings (#FFE8B0 warm, thickness 0.05 kpc) at select radii (e.g., 1, 2.5, 4 kpc). Raymarched as additive Gaussian shells. Real: NGC 1316 shows prominent shells. |
| Shell Structure (From Past Mergers) | Shell Asymmetry | uShellAsymmetry | OFF | Shells often asymmetric, appearing only in certain quadrants due to orbit geometry of merging satellite. When enabled, modulates shell brightness azimuthally (angle-dependent variation). Creates non-uniform shell appearance. Visual contribution ~5%. |
| Shell Structure (From Past Mergers) | Tidal Tails from Merger | uTidalTails | OFF | Violent mergers create long thin tidal tails extending far from main galaxy (length 20–50 kpc). When enabled, renders 1–2 faint #AA8080 brownish tails extending from galaxy in opposite directions. Raymarched as low-opacity thin filaments. Real: NGC 1316 shows faint tails. |

#### Central Supermassive Black Hole (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Central Supermassive Black Hole | Central SMBH Sphere of Influence | uSMBH | ON | Supermassive black hole at galaxy center (mass 10^8–10^10 solar masses); gravitational sphere of influence radius ~0.01–0.5 kpc (mass-dependent). Position fixed at origin. Rendered as density concentration (high-frequency FBM near center) marking gravitational dominance region. Subtle but important dynamical anchor. |
| Central Supermassive Black Hole | Nuclear Star Cluster | uNuclearCluster | ON | Dense stellar concentration surrounding SMBH (mass ~10^7–10^8 solar masses, comparable to SMBH). Rendered as bright #FFE8B0 warm-white inner core (radius 0.1 kpc, brightness 3–5× main galaxy profile at same radius). Real: most ellipticals host nuclear clusters. |

#### Stellar Streams & Kinematic Misalignment (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Stellar Streams & Kinematic Misalignment | Tidal Stellar Streams | uStellarStreams | OFF | Extended faint stellar streams (length 10–50 kpc, width 0.5–2 kpc) from tidal disruption of satellite galaxies; signatures of past/ongoing interactions. When enabled, renders 1–4 faint #A08080 brownish streams extending from galaxy through outer halo. Raymarched as low-opacity FBM filaments. Visual realism gain ~12%. |
| Stellar Streams & Kinematic Misalignment | Kinematic Velocity Misalignment | uKinematicMisalignment | OFF | Speculative: rotation axis may misalign with major axis due to merger history (rotation offset up to 30° possible). When enabled, applies rotational velocity-field offset from principal axis, creating observable kinematic twist. When visible, adds dynamical nuance; visual contribution ~8%. |

#### Dust Lanes (Rare but Dramatic) (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Dust Lanes (Rare but Dramatic) | Dust Lane Absorption Features | uDustLanes | OFF | Rare dust features in some ellipticals (e.g., NGC 1316) from recent gas-rich merger. When enabled, renders dark #3A2F28 dust lanes crossing galaxy disk-like plane. Rendered as 2-octave Simplex FBM (freq 3.0) with high opacity in equatorial zone. Visual contribution ~10% when enabled. Real: NGC 4526 shows prominent dust lanes. |
| Dust Lanes (Rare but Dramatic) | Dust-Free Core | uDustFreeCoreOption | ON | Typical elliptical has negligible dust; very clean appearance. Rendered as essentially dust-free volume (no dust lane FBM). Emphasizes smooth stellar profile. Toggle-able for comparison with dust-lane variants. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Default Zoom Level | uCameraZoom | 1.0 | Preset camera distance 8 kpc from galaxy center (viewing angle 45° inclination, between face-on and edge-on), optimizing 3D spherical appearance and halo visibility. Field-of-view 45°. |
| Camera | Pivot Point Centering | uCameraTarget | 0.0, 0.0, 0.0 | Camera orbits around galaxy center (SMBH position). Enables 360° rotation and variable inclination (0°–90°) to view spherical morphology from all angles. Isophotal shape variations visible at various inclinations. |
| Camera | Orthographic / Perspective Toggle | uCameraMode | Perspective | Perspective projection (true) default for immersive spheroidal visualization; orthographic (false) available for flat structural analysis. |

---

### Irregular Galaxy

**Entity ID:** ENT-6030
**Description:** Chaotic galaxy morphology lacking organized disk/bulge structure. Mergers, interactions, and tidal disruption create asymmetric appearance. Composed primarily of young blue stars (#A0C8FF) indicating active star formation post-interaction. Extensive HII regions (#FF4080 pink) from massive star formation bursts. Dust lanes (#3A2F28 dark brown) distributed randomly. Often exhibits bridge/stream structures connecting to nearby interacting galaxy. Real exemplars: Large Magellanic Cloud (LMC; 2×10^10 solar masses, with Tarantula Nebula prominent), Small Magellanic Cloud (SMC; satellite of Milky Way), NGC 4449 (post-merger dwarf), NGC 1569 (starburst dwarf), M82 (prototypical starburst irregular).

**Section Count:** 8
**Total Feature Count:** 25

#### Chaotic Structure (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Chaotic Structure | Asymmetric Overall Morphology | uChaotic | ON | Primary characteristic: lack of organized disk or bulge; overall shape irregular/amorphous. Rendered as random low-frequency FBM (freq 0.8, octaves 2) driving density distribution, producing lumpy appearance. No preferred axis (vs spiral's clear disk, elliptical's smooth profile). Color mix #A0C8FF blue (young) + #FFD8A0 yellow (older) heterogeneous throughout. |
| Chaotic Structure | Multiple Density Clumps | uDensityClusters | ON | Galaxy appears as collection of semi-independent star clusters/clumps (radius 0.2–1.0 kpc each, spacing 1–3 kpc) rather than coherent system. Rendered as ~5–10 bright FBM-based clumps distributed randomly throughout main body using Poisson distribution. Each clump has ~20% brightness variation. Creates "lumpy" visual appearance. |
| Chaotic Structure | Filamentary Inter-Clump Gas | uFilaments | ON | Gas filaments connecting density clumps; extends from merger-driven tidal forces. Rendered as low-opacity (#AA9080 reddish-tan) connecting threads between clumps. FBM freq 2.0 tracing Delaunay-like connectivity. Creates web-like appearance linking major star-forming regions. |
| Chaotic Structure | Tidal Disruption Asymmetry | uTidalAsymmetry | ON | Asymmetric tidal forces from nearby massive galaxy or recent merger create elongated/distorted appearance along tidal axis. Rendered as overall density compression along one direction (aspect ratio 1.5:1 typical); opposite side more dispersed. Color/density enhanced on tidal-axis-compressed side. |

#### Tidal Distortion (If Interacting) (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Tidal Distortion (If Interacting) | Tidal Bridge to Companion | uTidalBridge | ON | Filamentary structure connecting to nearby companion galaxy or showing bridge of gas/stars between interaction pair. Rendered as faint #AA8070 brownish elongated structure (width 0.5 kpc, length 5–10 kpc) spanning gap between irregulars. Real: LMC-SMC exhibit bridge structure; NGC 4449 shows tidal connection. |
| Tidal Distortion (If Interacting) | Tidal Tail Appendage | uTidalTail | ON | Long thin tail extending from galaxy body due to tidal shear (length 10–30 kpc, width 0.3 kpc). Rendered as faint #A08080 brownish tail with exponential density falloff along length. Traced from main galaxy body. Real: NGC 4449 shows prominent tail. |
| Tidal Distortion (If Interacting) | Encounter Geometry Markers | uEncounterGeometry | OFF | Speculative: visual indicators of interaction geometry (closest approach location, relative velocity direction). When enabled, adds subtle directional cues via faint asymmetry orientation. Visual contribution ~5%. |

#### Star Formation Bursts (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Star Formation Bursts | Starburst Regions & Clumps | uStarburst | ON | Intense star formation (SFR ~1–100 solar masses/year) concentrated in 2–5 major clumps. Rendered as very bright #FFB850 warm orange regions (brightness 3–5× surrounding areas) scattered throughout galaxy. Each clump radius ~0.3 kpc. Real: M82 shows bright starburst regions; LMC Tarantula Nebula dominates. |
| Star Formation Bursts | Supernova Remnant Population | uSNRs | ON | Recent starburst produces numerous young SNRs (age 1,000–10,000 years); rendered as small bright #4A7FFF blue-white point sources scattered in starburst clumps. Density ~0.5 per 1 kpc^2 in star-forming regions. Represents supernova feedback. Real: M82 contains hundreds of young SNRs. |
| Star Formation Bursts | Stellar Wind-Blown Bubbles | uWindBubbles | ON | Hot O/B-star winds carve low-density bubbles (radius 0.1–0.5 kpc) in surrounding gas; manifests as slightly darker zones around bright star clusters. Rendered as inverse (subtractive) density bumps at cluster positions (amplitude -20%). Creates apparent "holes" around massive star concentrations. |
| Star Formation Bursts | Ionization Front Halos | uHIIHalos | ON | Bright HII region halos (#FF5070 pink, radius 0.2–0.5 kpc per region) surrounding massive star clusters. Rendered as Gaussian halos (FBM freq 2.0, octaves 2) centered on starburst clumps. Additive blend at 70% opacity. Creates apparent emission nebulosity. Real: LMC Tarantula surrounded by extensive HII region. |

#### HII Regions & Nebulosity (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| HII Regions & Nebulosity | Diffuse Ionized Gas | uIonizedGas | ON | Extensive ionized hydrogen from massive star formation; permeates entire galaxy. Rendered as low-opacity (#FF5070 pink) FBM layer (freq 1.5, octaves 2) blended at 30% over main body. Creates apparent "pink glow" throughout. Real: LMC/SMC appear pink-tinged in Hα imaging. |
| HII Regions & Nebulosity | Spectral Line Emission Overlay | uSpectralLines | OFF | Speculative false-color overlay assigning Hα→Red, OIII→Green, NII→Blue (NASA Hubble style). When enabled, renders composite color image emphasizing ionization state. Requires simultaneous multi-channel rendering. Visual realism gain ~15%. |
| HII Regions & Nebulosity | Dark Dust Complexes | uDarkDust | ON | Dark dust lanes (#3A2F28 dark brown) distributed randomly throughout (optical depth 0.5–2.0), particularly concentrated in star-forming regions. Rendered as 3-octave Simplex FBM (freq 3.5) with scattered high-opacity zones. Creates patchy obscuration. |

#### Open Stellar Clusters (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Open Stellar Clusters | Young Open Star Clusters | uOpenClusters | ON | Associations of ~100–10,000 young stars (age 1–500 Myr) scattered throughout galaxy, particularly in star-forming regions. Rendered as bright #B0D8FF blue-white point cloud aggregates (density ~3–5 clusters per 5 kpc region) using sparse Worley distribution. Real: LMC 30 Doradus region hosts numerous clusters. |
| Open Stellar Clusters | Cluster Disruption Tidal Streams | uClusterTides | OFF | Young clusters gradually disrupted by tidal forces; creates stellar streams extending from cluster centers. When enabled, renders faint #9AAFBF pale blue thin streams emanating from cluster positions. Visual contribution ~8%. |

#### Bridge / Stream Between Interactors (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Bridge / Stream Between Interactors | Gaseous Bridge Structure | uBridge | ON | Filamentary gas bridge (width 0.3–1.0 kpc, length 5–15 kpc) connecting main galaxy to nearby companion, pulled by tidal forces. Rendered as #AA8070 brownish low-opacity structure using 2-octave FBM (freq 1.8) tracing path between galaxy centers. Real: LMC-SMC bridge, interacting irregular pairs. |
| Bridge / Stream Between Interactors | Bridge Clumpiness & Knots | uBridgeClumps | ON | Bridge exhibits clumpy structure with bright knots (diameter 0.5 kpc) marking density concentrations. Rendered as bright spots along bridge path (Poisson distribution, density ~2 per 10 kpc bridge length). Color #FFB850 warm orange. Represents localized star formation within bridge. |

#### Small Scale Supergiant Shells (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Small Scale Supergiant Shells | Supergiant Shell Rings | uSupergiantShells | OFF | Large expanding shells (radius 0.3–1.0 kpc, age ~10–100 Myr) carved by collective stellar winds and SNe from massive star clusters. When enabled, renders as faint ring boundaries (#FF6070 reddish, opacity 20%, thickness 0.05 kpc) at specific radii. Real: M82 shows prominent shells. |
| Small Scale Supergiant Shells | Shell Dynamics & Motion | uShellMotion | OFF | Speculative: shells expand at ~10 km/s; toggling enables time-lapse showing expansion over hours (representing 1000s of years evolution). When enabled, radius parameter time-scales. Visual contribution ~5%. |

#### Foreground / Background Context (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Foreground / Background Context | Background Field Stars | uFieldStars | ON | Sparse background galaxy halo/field stellar population; often shows tidal streams and extended structure beyond main visible body. Rendered as faint distributed point sources (density ~0.1 per kpc^2) using Poisson distribution. Color #AAAAAA neutral gray. Provides context of extended halo. |
| Foreground / Background Context | Companion Galaxy Satellite | uCompanion | ON | Nearby gravitationally-bound companion (LMC-SMC separation ~20 kpc typical; mass ratio ~1:10–1:1). Rendered as separate irregular galaxy model (50–100% main galaxy brightness) positioned nearby. Real: LMC-SMC, NGC 4449 + companions. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Default Zoom Level | uCameraZoom | 1.0 | Preset camera distance 12 kpc from galaxy center (45° inclination, showing 3D asymmetric structure well), optimizing chaotic structure visibility. Field-of-view 45°. |
| Camera | Pivot Point Centering | uCameraTarget | 0.0, 0.0, 0.0 | Camera orbits around main galaxy centroid. Enables 360° rotation revealing asymmetries and tidal distortion from all angles. Companion galaxy remains visible throughout orbit. |
| Camera | Orthographic / Perspective Toggle | uCameraMode | Perspective | Perspective projection (true) default for immersive interactive visualization; orthographic (false) available for flat morphology comparison. |

---

### Active Galaxy (AGN/Quasar)

**Entity ID:** ENT-6040
**Description:** Galaxy with extremely luminous active galactic nucleus (AGN) powered by accretion onto central supermassive black hole (mass 10^6–10^10 solar masses). Accretion disk radiates 10^40–10^48 erg/s across all wavelengths (radio to gamma-ray). Relativistic bipolar jets extend kpc to Mpc scales, producing synchrotron emission (#4A7FFF blue) and radio lobes at jet termination shocks. Type 1 (face-on, broad-line region visible, unobstructed view) vs Type 2 (edge-on, dusty torus obscures BLR, narrow-line regions visible). Host galaxy often obscured by central glare. Gravitational lensing (speculative) possible for nearby sources. Real exemplars: Quasar 3C 273 (nearest, z=0.158, Mv=-26.7), M87 (giant elliptical with one-sided jet), Centaurus A (NGC 5128, face-on view of jets), 3C 48 (radio-loud quasar).

**Section Count:** 9
**Total Feature Count:** 32

#### Core Accretion Disk (5 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Core Accretion Disk | Accretion Disk Inner Region | uAccretionDisk | ON | Hot inner accretion disk (radius 0.001–0.1 pc, temperature 10,000–1,000,000 K, not individually resolved). Renders as bright compact core #FFFFFF blazing white-blue, overlaid point source of extreme luminosity (falloff radius 1 kpc, intense point light). Radiates entire EM spectrum. Brightness dominates all other galaxy components. |
| Core Accretion Disk | Disk Radiation Continuum (Multi-wavelength) | uDiskContinuum | ON | Accretion disk radiates power-law continuum (flux ∝ ν^(-α), α~0.5–1.0); peaks UV/X-ray but extends radio–gamma-ray. Rendered as white-blue core with spectral hardness parameter adjustable. Center #FFFFFF, outer halo #FFF8E8 slightly warmer. Brightness scaling ~100,000× main galaxy starlight. |
| Core Accretion Disk | Accretion Rate Variability | uVariability | ON | Core brightness fluctuates with accretion rate variations (timescale 0.01–10 years; unresolved but luminosity modulation observable). Rendered as time-varying brightness oscillation (sinusoid ~0.05 Hz frequency, amplitude ±20% intensity). Creates flickering/pulsing effect. When enabled, adds dynamical appearance. |
| Core Accretion Disk | Doppler Beaming / Relativistic Enhancement | uDopplerBeaming | OFF | Speculative: relativistic Doppler boosting toward observer (jet approaching at velocity ~0.9c) enhances observed brightness ~Γ^3 (Γ~5–10 Lorentz factor). When enabled, brightens jet/core significantly (factor 10–50×) for face-on orientation, dims for edge-on. Requires viewing angle calculation. |
| Core Accretion Disk | Coronal X-ray Emission | uCorona | OFF | Speculative: hot electron corona above disk (T~100 keV) inverse-Compton scatters disk photons to hard X-rays. When enabled, renders faint #FF7050 orange-red halo around core (radius 0.01 pc, opacity 20%). Physical basis: observed in X-ray spectra. |

#### Relativistic Jets (Bipolar Kpc-Scale) (5 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Relativistic Jets (Bipolar Kpc-Scale) | Primary Jet Beams | uJets | ON | Collimated bipolar jets ejected at velocity ~0.995–0.99995c (Lorentz factor Γ~10–100); extend 10–1000 kpc typical. Rendered as pair of bright #4A7FFF blue cones (opening angle 5–15°, length 100–500 kpc adjustable) extending from core along z-axis. Raymarched with 6-octave FBM interior (freq 7.0) creating filamentary texture. Synchrotron emission dominates. Real: M87 one-sided, 3C 273 one-sided (Doppler-boosted approaching jet). |
| Relativistic Jets (Bipolar Kpc-Scale) | Jet Synchrotron Emission (Blue) | uJetSynchrotron | ON | Non-thermal emission from relativistic electrons spiraling in jet magnetic field; produces #4A7FFF blue color (peak near 10 GHz radio, extends optical). Rendered as bright columnar emission along jet centerline and surrounding volume. Opacity modulates as r^-2 falloff from jet axis (width 1–10 kpc typical). |
| Relativistic Jets (Bipolar Kpc-Scale) | Jet Collimation Magnetic Field | uMagneticCollimation | OFF | Speculative: magnetic field (B~mG range) confines jet through magnetic pressure, maintaining collimation over vast distances. When enabled, renders faint spiral pattern around jet axis (#4A7FFF slightly darker blue, opacity 10%), indicating field geometry. Subtle visual enhancement; ~5% contribution. |
| Relativistic Jets (Bipolar Kpc-Scale) | Superluminal Motion Illusion | uSuperluminal | OFF | Speculative: jet motion at velocity ~0.95c at small angle (<30°) appears superluminal (~5–10c illusion) when projected; manifests as apparent rapid "knot" motions along jet. When enabled, applies temporal position warp to jet internal structure (texture coordinate advancement). Subtle dynamical effect. |
| Relativistic Jets (Bipolar Kpc-Scale) | Jet Kinetic Luminosity Dominance | uJetPower | ON | Jet kinetic power often exceeds accretion disk radiation (L_jet / L_disk ~0.1–10 possible). Rendered as jet brightness comparable to or exceeding core brightness (scaling by uJetKineticFraction uniform, 0–1 range, default 0.5). Creates visually prominent jets. |

#### Dusty Torus Obscuration (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Dusty Torus Obscuration | Equatorial Obscuring Torus | uTorus | ON | Dense dusty torus (inner radius ~0.1 pc, outer radius ~1–10 pc, height ~1–5 pc (modern VLTI/ALMA observations show compact torus), optical depth >10) blocks view of inner disk/BLR depending on inclination. Rendered as raymarched toroidal volume (major radius 0.5 kpc apparent, minor radius 0.3 kpc) using 4-octave FBM (freq 5.0) with high opacity concentrated toward equatorial plane. Color #3A2F28 dark brown-black. Controls AGN Type classification (Type 1 = face-on/pole-on, unobscured view of BLR; Type 2 = edge-on, torus obscures BLR, only NLR visible). |
| Dusty Torus Obscuration | Torus Dust Sublimation Region | uSublimationRegion | OFF | Inner torus boundary (~1000 K dust sublimation temperature) marks sharp density transition. When enabled, renders thin bright rim (#FF8050 warm orange, opacity 20%, width 0.02 kpc) at torus inner edge. Physical basis: hot dust thermal emission. |
| Dusty Torus Obscuration | Polar Dust Evacuation | uPolarEvacuation | ON | Jets/winds evacuate dust from polar regions, creating ~10–30° half-opening-angle dust-free cone above/below disk. Rendered as cone-shaped density reduction (opacity reduction to 5% within cone). Creates visible "funnel" through torus toward core. Observable in Type 1 AGN. |

#### Broad Line Region (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Broad Line Region | Broad Line Region Gas Clouds | uBLR | ON | High-velocity gas clouds (velocity ~5,000 km/s, temperature ~10,000 K) orbiting within 0.1 pc of core; rapidly responding to accretion disk UV ionization. Visible only in Type 1 (face-on) orientation when not obscured by torus. Rendered as faint #FF5070 pink nebulosity surrounding core (radius 0.05 kpc, opacity 30%, FBM freq 4.0). Creates soft glow when observable. Real: broad Balmer lines (Hα, Hβ) characterize Type 1 AGN. |
| Broad Line Region | Broad Line Emission Feature | uBLREmission | OFF | Speculative false-color display of broad-line gas as bright spot annotation when BLR theoretically visible. When enabled, renders bright #FF4070 red region (sector ~45° opening angle, radius 0.1 kpc) in direction of torus opening. Type-1-only feature. |
| Broad Line Region | Disk-BLR Ionizing Continuum | uBLRIonization | ON | Accretion disk UV ionizes BLR gas, producing UV absorption/emission lines (Lyman α, CIV, MgII). When Type 1 observable, incorporated into BLR glow intensity (scales with disk luminosity). |

#### Narrow Line Region (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Narrow Line Region | Extended Narrow Line Region | uNLR | ON | Extended ionized gas region (radius 1–10 kpc) with modest velocity dispersion (~500 km/s) from photoionization by AGN continuum. Visible in both Type 1 and Type 2. Rendered as faint #3FCFA8 teal-green nebulosity (FBM freq 1.5, octaves 2, opacity 20%) concentrated along jets (gas accelerated by jet bow shocks). Creates elongated halo structure. Real: observed in [OIII] narrow line emission. |
| Narrow Line Region | NLR Kinematics Alignment | uNLRJets | ON | NLR gas preferentially aligned along jet direction (ionization cones), producing cone-like morphology around jet axis. Rendered as directional FBM bias along jet direction (0.3 kpc width, extending 10 kpc). Creates wispy appearance tracing jet-gas interaction. |

#### Host Galaxy (If Visible Beyond Glare) (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Host Galaxy (If Visible Beyond Glare) | Host Galaxy Obscured Bulge | uHostGalaxy | ON | AGN host galaxy often appears as faint bulge beneath bright nucleus; typically giant elliptical. Rendered as #D0A070 warm brownish spheroidal halo surrounding core (Sérsic n=4 profile, scale radius 3 kpc, opacity 20–30% of core brightness). Observable only if core brightness manually dimmed. Real: M87 is giant elliptical hosting AGN. |
| Host Galaxy (If Visible Beyond Glare) | Host Galaxy Tidal Interaction Signatures | uHostDistortion | OFF | Speculative: recent galaxy merger triggers AGN activity; creates tidal distortion signatures in host galaxy. When enabled, applies subtle asymmetry to host galaxy structure. Visual contribution ~8%. |
| Host Galaxy (If Visible Beyond Glare) | Scattered Quasar Light | uScatteredLight | OFF | Speculative: scattering of central quasar light in surrounding dust/gas creates faint diffuse halo. When enabled, renders very faint #C0B8A8 light grayish halo (radius 5–10 kpc, opacity 5%). Computationally cheap addition. |

#### Radio Lobes (Terminal Shocks) (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Radio Lobes (Terminal Shocks) | Radio Lobe Termination Shocks | uRadioLobes | ON | Jets decelerate upon striking ambient medium, forming bright regions (hotspots) at lobe tips (radius 1–10 kpc from core, separated ~100 kpc typical). Rendered as bright #4A7FFF blue expanding lobes (Gaussian-profiled clouds, scale ~30 kpc radius each) positioned along jet axis at distant ends. Synchrotron emission dominates. Real: Cygnus A, 3C 48 show prominent lobes. |
| Radio Lobes (Terminal Shocks) | Lobe Expansion Age Evolution | uLobeAge | OFF | Speculative: lobes expand at ~0.001c, age-dating via size. Old lobes (>100 Myr) very extended (>100 kpc), young lobes (1 Myr) compact. When enabled, lobe size parameter scales with adjustable age (0–1000 Myr). Manifests as lobe radius change over time. |
| Radio Lobes (Terminal Shocks) | Lobe Magnetic Field Structure | uLobeMagneticField | OFF | Speculative: magnetic field (B~µG) fills lobes, organized by turbulence. When enabled, renders faint swirl/curl texture within lobes (#4A7FFF slightly darker). Visual contribution ~5%. |
| Radio Lobes (Terminal Shocks) | Relic Radio Lobes | uRelicLobes | OFF | Speculative: very old, detached lobes (age >100 Myr) from previous jet eruption; brightness faded but still faintly emitting. When enabled, renders secondary pair of faint lobes at larger separation (2×primary lobe distance), much dimmer color #3A6FBF dark blue. Visual realism gain ~8%. |

#### Gravitational Lensing (Speculative) (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Gravitational Lensing (Speculative) | Einstein Ring / Multiple Images (If Background Source) | uLensing | OFF | Speculative: foreground massive galaxy/AGN acts as gravitational lens, bending light from background source into multiple images or Einstein ring. When enabled, renders faint ghost images or ring-like structure around AGN (#6A7FFF pale blue, opacity 20%, radius 5–10 arcsec apparent). Requires background source assumption. Visual contribution ~10%. |
| Gravitational Lensing (Speculative) | Microlensing Variability | uMicroLensing | OFF | Speculative: individual stellar-mass objects within lensing galaxy create brief magnification events ("microlensing"), causing rapid brightness spikes in lensed image. When enabled, applies random brightness transients (amplitude ±40%, duration ~days speculative). Visually subtle effect. |

#### Hot Spot Kpc-Jet Interactions (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Hot Spot Kpc-Jet Interactions | Jet Knot / Hot Spot Structures | uJetKnots | ON | Bright condensations within jet at 0.1–10 kpc separation; internal shocks or magnetic reconnection events. Rendered as bright #3A9FFF blue spherical knots (diameter 0.5–1.0 kpc, brightness 1.5–2.5× surrounding jet) positioned regularly along jet axis. Raymarched with 5-octave FBM interior (freq 6.0). Real: M87 jet shows prominent knots. |
| Hot Spot Kpc-Jet Interactions | Knot Proper Motion (Speculative) | uKnotMotion | OFF | Speculative: jet knots move along jet at fraction light-speed; apparent motion observable over months–years in nearby objects. When enabled, applies temporal position advance along jet axis (velocity 0.1–0.5c parametric, time-lapsed). Creates animated "pearls on string" appearance. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Default Zoom Level | uCameraZoom | 1.0 | Preset camera distance 300 kpc from AGN center, optimizing full jet/lobe structure and host galaxy visibility simultaneously. Field-of-view 45°. Appropriate for grand-scale AGN morphology. |
| Camera | Pivot Point Centering | uCameraTarget | 0.0, 0.0, 0.0 | Camera orbits around AGN accretion disk position at origin. Enables 360° rotation and variable inclination (0°–90°) to observe Type 1 (face-on) vs Type 2 (edge-on) morphology differences, jet orientation, and lobe geometry. |
| Camera | Orthographic / Perspective Toggle | uCameraMode | Perspective | Perspective projection (true) default for immersive AGN visualization; orthographic (false) available for flat lobe geometry comparison. Inclination angle significantly affects visual appearance. |

---

### Lenticular Galaxy (S0)

**Entity ID:** ENT-6031
**Description:** Transitional galaxy morphology between elliptical and spiral — possessing a prominent disk + bulge structure (like spirals) but lacking significant spiral arm structure and ongoing star formation (like ellipticals). Smooth disk of old yellow-red stars with a large central bulge. May contain subtle dust lanes, faint ring structures, and trace residual gas but no HII regions or blue star-forming complexes. Hubble tuning-fork "bridge" between Sa and E7. Colors: dominant old stellar population #F0D8A0 (warm yellow), bulge #F8E0B0 (slightly warmer), disk edge #D0B880 (cooler/redder). Often found in galaxy cluster environments (ram-pressure stripping removed gas). Real exemplars: NGC 2787, NGC 4526, NGC 5866 (edge-on with prominent dust lane), Spindle Galaxy.

**Section Count:** 7 (Stellar Disk, Central Bulge, Dust Lane Structure, Outer Features, Globular Cluster System, Environmental Context, Camera)
**Feature Count:** 25

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Stellar Disk | Smooth Disk Component | uSmoothDisk | ON | Featureless stellar disk of old (>5 Gyr) population: smooth exponential brightness profile I(r) = I₀ exp(-r/h) with scale length h = 3–8 kpc. Color: #F0D8A0 (old K-giant dominated, T_eff ~4500 K population). No spiral arm perturbation — just smooth azimuthally symmetric light distribution. Disk inclination variable (face-on to edge-on). FBM texture: 4 octaves, freq 1.5, gain 0.3 (very subtle — disk is smooth). |
| Stellar Disk | Disk Thickness Profile | uDiskThickness | ON | Vertical structure: sech²(z/z₀) with scale height z₀ = 0.5–1.5 kpc (thicker than spiral disks due to secular heating over Gyr). Edge-on view shows "puffy" disk. Color gradient: midplane #E8D0A0 (denser, warmer) to disk edge #C0A880 (fainter, redder). Disk axis ratio ~5:1 to 10:1 (thick to thin variants). |
| Stellar Disk | Lens Component | uLensComponent | OFF | Many S0s have a "lens" — a shelf-like brightness plateau interior to the disk edge. Lens radius ~0.5–0.8× disk radius. Sharp outer edge (truncated brightness profile). Color: #E8D8A8 (old stellar population, slightly brighter than outer disk). Feature distinguishes S0 from elliptical when viewed face-on. Rendered as radial brightness step function smoothed by 0.5 kpc. |
| Central Bulge | Classical Bulge | uClassicalBulge | ON | Large central bulge: Sérsic profile with index n = 2–4 (between exponential disk and r^(1/4) elliptical). Bulge-to-total luminosity ratio B/T = 0.3–0.6 (larger than spiral bulges). Color: #F8E0B0 (old, metal-rich, redder than disk). Effective radius R_e = 1–5 kpc. Velocity dispersion σ = 100–250 km/s. 3D shape: oblate spheroid, axis ratio 0.6–0.8. |
| Central Bulge | Nuclear Disk/Ring | uNuclearDisk | OFF | Many S0s harbor a small nuclear disk (r < 500 pc) with distinct kinematics (counter-rotating in some cases). Color: #E0C890, slightly different from main bulge. May contain trace younger population #D0C8A0 if recent minor merger brought gas. Kinematically decoupled core indicator. Rendered as small bright inner disk with separate orientation. |
| Central Bulge | Central Point Source (AGN) | uCentralAGN | OFF | Low-luminosity AGN common in S0s (LINER type). Faint central point source #FFFFD0, luminosity 10⁻⁴ to 10⁻² of Seyfert. Powered by residual gas accretion onto SMBH. No broad-line region visible. Subtle central brightness enhancement, barely exceeding bulge surface brightness profile. |
| Dust Lane Structure | Equatorial Dust Lane | uDustLane | ON | Thin dust lane in disk midplane — most prominent in edge-on view. Color: #2A2018 (dark absorption against stellar background). Width 200–500 pc. Optical depth τ_V = 0.5–3 (partially transparent to fully opaque). Dust mass ~10⁵–10⁷ M☉ (much less than spirals). FBM filamentary texture: 6 octaves, freq 4.0, amp 0.03. NGC 5866 archetype: spectacular edge-on dust lane. |
| Dust Lane Structure | Dust Ring Structure | uDustRing | OFF | Settled dust in ring configuration (common in face-on S0 view). Ring radius 2–8 kpc, width ~1 kpc. Color: #3A2A1A (absorption silhouette against stellar disk). Likely origin: minor merger brought external gas/dust that settled into ring. Inner dust ring also possible at r < 1 kpc. Ring circularity: slight ellipticity from bar perturbation. |
| Dust Lane Structure | Dust Temperature Gradient | uDustTempGrad | OFF | Dust heated by ambient stellar radiation field. Central regions: T_dust ~30–40 K, outer: ~15–20 K. Far-IR emission visualization: inner dust #4A2A1A (warmer, brighter in IR), outer #2A1A0A (cooler). Gradient mapped as color overlay in IR-rendering mode. Total dust luminosity ~10⁷–10⁸ L☉. |
| Outer Features | Outer Ring (R-type) | uOuterRing | OFF | Some S0s have outer stellar ring at ~2× bar radius (if barred) or outer Lindblad resonance. Faint stellar enhancement #D8C8A0, 5–10% above surrounding disk brightness. Ring width ~1 kpc. Origin: gas accumulated at resonance, formed stars, gas depleted but stellar ring persists. Morphological subclass: SB0(r) or SA0(r). |
| Outer Features | Shell Structure | uShellStructure | OFF | Concentric stellar shells from past minor merger — phase-wrapped debris from cannibalized dwarf galaxy. 2–5 shells at radii 10–50 kpc. Color: #E0D0A0 (old stellar population of accreted dwarf), surface brightness ~26–28 mag/arcsec² (very faint). Interleaved on alternating sides of galaxy center (phase-wrap signature). Sharp outer edges. |
| Outer Features | Tidal Streams | uTidalStreams | OFF | Narrow stellar streams from ongoing dwarf galaxy disruption. Color: #D0C090 (old stars), width 0.5–2 kpc, length 20–100 kpc, wrapping around S0 halo. Surface brightness ~27–29 mag/arcsec² (extremely faint). 1–3 streams from different accretion events. Indicates ongoing hierarchical assembly even for "dead" galaxies. FBM perturbation: freq 2.0, amp 0.05. |
| Globular Cluster System | GC Population Visualization | uGCPopulation | OFF | Globular cluster system: 200–5000 GCs depending on galaxy luminosity. Bimodal color distribution: blue (metal-poor) #5A7AA0 and red (metal-rich) #C8A070. Blue GCs: more extended, isotropic distribution. Red GCs: concentrated toward bulge, disk-like distribution. Rendered as point particles at representative positions. Specific frequency S_N = 2–6 (higher than spirals). |
| Globular Cluster System | GC Spatial Distribution | uGCSpatial | OFF | Radial profile of GC system: follows galaxy light profile but more extended (effective radius 2–3× stellar R_e). Blue GCs dominate at large radii. Red GCs concentrated within 2 R_e. Power-law density profile: n(r) ∝ r^(-1.5 to -2.5). Rendered as density heatmap overlay #5A6A8A at opacity 0.05. |
| Environmental Context | ICM Ram Pressure Stripping | uRamPressure | OFF | Visualization of intra-cluster medium stripping gas from S0 disk. Compressed leading edge #6A8AAA, opacity 0.03, with trailing stripped-gas tail #4A6A8A, opacity 0.02. Tail length 20–100 kpc. Explains gas depletion and star formation quenching — transformation from spiral to S0 in cluster environment. Galaxy velocity through ICM: 500–2000 km/s. |
| Environmental Context | Hot Gas Halo | uHotGasHalo | OFF | X-ray emitting hot gas halo (T ~10⁶–10⁷ K). Extent: 20–100 kpc. Rendered as diffuse spherical glow #3A4A6A, opacity 0.02. Less luminous than elliptical X-ray halos. Gas mass ~10⁸–10⁹ M☉. Thermal bremsstrahlung emission. Halo truncated by ram pressure in cluster environment. |
| Camera | Face-On View | uCameraMode | ON | Default: looking down disk pole. Shows smooth featureless disk, large bulge, dust ring (if present), and lens component. Distance: 150 kpc. FOV 40°. Emphasizes S0's "spiral without arms" character. Symmetric appearance. |
| Camera | Edge-On View | uCameraMode | OFF | Viewing through disk plane. Shows prominent dust lane bisecting bulge, thick disk profile, and boxy/peanut bulge shape. Most dramatic viewing angle for S0 galaxies (NGC 5866 presentation). Distance: 150 kpc. |
| Camera | Time Speed Multiplier | uTimeSpeed | 10⁷ yr/s | Extremely compressed: 1 real second = 10 million years. Shell structures and tidal streams evolve slowly. Stellar population aging barely perceptible over visualization timescale. Rotation period ~200 Myr visible as slow disk rotation. |

---

### Barred Spiral Galaxy (SBb/SBc)

**Entity ID:** ENT-6032
**Description:** Spiral galaxy with prominent central stellar bar channeling gas inward, triggering enhanced nuclear activity and shaping spiral arm morphology. Bar structure: elongated stellar overdensity 5–15 kpc long, composed of old stars (#E8D0A0) on aligned elliptical orbits. Bars are remarkably common: ~60–70% of disk galaxies are barred (including the Milky Way). Spiral arms originate from bar ends, often with enhanced star formation at bar-arm connection points. Bar drives secular evolution: funneling gas inward builds pseudobulge, rings form at orbital resonances (nuclear ring, inner ring, outer ring). Colors: bar old stars #E8D0A0, bar dust lanes #2A2018, arm HII regions #FF5080, nuclear starburst ring #FF4060. Real exemplars: NGC 1300 (grand-design barred, Hubble Heritage icon), NGC 1365 (Fornax, barred+AGN), NGC 7552 (nuclear starburst ring), Milky Way (weak bar, ~5 kpc half-length).

**Section Count:** 8 (Bar Structure, Spiral Arms, Nuclear Region, Ring Resonances, Dust & Gas, Star Formation, Outer Disk, Camera)
**Feature Count:** 27

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Bar Structure | Stellar Bar | uStellarBar | ON | Elongated stellar overdensity: half-length 3–8 kpc, axis ratio ~3:1 to 5:1. Color: #E8D0A0 (old K-giant population, age 5–10 Gyr). Surface brightness: 2–5× above underlying disk at bar center. Smooth isophotes with boxy outer shape (box/peanut in edge-on). Pattern speed: Ω_bar = 30–60 km/s/kpc (rigid rotation). Orientation angle relative to line-of-nodes variable. |
| Bar Structure | Bar Dust Lanes | uBarDustLanes | ON | Offset dust lanes along leading edge of bar (offset by bar shear). Two parallel lanes, one per bar side. Color: #2A2018 (dark absorption). Width 200–500 pc, length matching bar. Lanes curve from bar end inward to nuclear region — gas inflow channels. Optical depth τ_V = 1–5. Shock front where gas enters bar potential. FBM filamentary: 5 octaves, freq 6.0, amp 0.02. |
| Bar Structure | Bar Ansae (Handle Features) | uBarAnsae | OFF | Enhanced brightness at bar ends — "handles" where stellar orbits bunch at apoapse. Color: #F0D8A0, brightness 20–50% above bar average. Diameter ~1 kpc each. Distinctive morphological feature of strong bars. Bar-arm transition occurs at/near ansae position. |
| Bar Structure | Bar Pattern Speed Indicator | uBarPatternSpeed | OFF | Animated rigid rotation of bar pattern at Ω_bar. Bar rotates as solid body (stars orbit through it, but pattern maintains shape). Spiral arms trail from bar ends and wind up relative to bar over time. Corotation radius (where bar speed = disk circular velocity) marked as faint circle #5A8A5A, opacity 0.05. |
| Spiral Arms | Grand-Design Arms | uGrandDesignArms | ON | Two primary spiral arms originating from bar ends. Arms defined by: young blue stars #8AB0E8, HII regions #FF5080, dust lanes #3A2A1A on concave side. Arm pitch angle: 15–25° (SBb) to 25–40° (SBc). Logarithmic spiral: r(θ) = a·exp(b·θ). Arm width 1–3 kpc. Arm-interarm contrast: 2–5× in blue light. FBM arm perturbation: 6 octaves, freq 3.0, amp 0.08. |
| Spiral Arms | Arm Dust Lanes | uArmDustLanes | ON | Narrow dust lane on concave (inner) edge of each spiral arm — density wave shock front where gas enters arm. Color: #2A1A0A (dark). Width 100–300 pc. Star formation triggered downstream (convex side) of dust lane. Key indicator of density wave nature of arms. Offset from stellar arm peak by ~0.5–1 kpc in direction of rotation. |
| Spiral Arms | HII Region Chain | uHIIRegionChain | ON | Chain of HII (ionized hydrogen) regions along spiral arms — visible star-forming complexes. Color: #FF5080 (Hα emission pink). Individual HII region diameter 50–500 pc. Spacing ~500–2000 pc along arm. Luminosity function: few bright giant HII + many faint compact regions. Total: 50–200 visible major HII regions per arm. Emission factor 0.5 (self-luminous). |
| Spiral Arms | OB Association Clusters | uOBAssociations | OFF | Young (<30 Myr) stellar associations concentrated in spiral arms. Color: #A0C8FF (blue-white, hot OB stars). Each association 50–200 pc diameter, containing 10–100 OB stars. Positioned downstream of dust lane, correlated with HII regions. 100–500 associations per arm. Point rendering with blue halo, alpha 0.4. |
| Nuclear Region | Nuclear Starburst Ring | uNuclearRing | ON | Ring of intense star formation at inner Lindblad resonance (ILR), radius 200–1000 pc. Bar-driven gas accumulation triggers starburst. Color: bright #FF4060 (Hα) + #A0C0FF (blue young stars). Star formation rate ~1–10 M☉/yr concentrated in ring (vs ~1 M☉/yr total for quiescent spiral). 10–30 super star clusters visible in ring. NGC 7552 archetype. Emission factor 0.7. |
| Nuclear Region | Pseudobulge | uPseudobulge | ON | Disk-like central bulge built by bar-driven inflow (not merger-built like classical bulges). Sérsic index n < 2 (disk-like, flat). Color: #E8D0A0 (mix of old and intermediate-age stars). R_e = 0.5–2 kpc. Contains nuclear disk with ongoing star formation. Low velocity dispersion relative to luminosity. Exponential profile rather than r^(1/4). |
| Nuclear Region | Nuclear Bar | uNuclearBar | OFF | Secondary bar within primary bar (nested bars, sometimes orthogonal orientation). Length: 200–500 pc. Same old-stellar color #E8D0A0 but distinct orientation from primary bar. Drives gas inflow to even smaller scales — feeds AGN. Decoupled pattern speed (faster than primary bar). 20–30% of barred galaxies host nuclear bars. |
| Ring Resonances | Inner Ring (ILR) | uInnerRing | OFF | Stellar/gaseous ring at inner Lindblad resonance, coincident with bar ends. Radius ~0.5–1.0× bar length. Enhanced star formation where bar-driven spiral arms connect. Color: old stars #E0D0A0 + young stars #8AB0D8 + HII #FF5080. Ring width ~1 kpc. Morphological class: SB(r). |
| Ring Resonances | Outer Ring (OLR) | uOuterRing | OFF | Ring or pseudoring at outer Lindblad resonance, radius ~2.0–2.5× bar length. Faint stellar enhancement #D8C890, 3–10% above disk. Often broken into segments or pseudoring (arms wrapping 180° to connect). Star formation ongoing but at lower rate than inner ring. Morphological class: (R)SB. |
| Dust & Gas | Molecular Gas Distribution | uMolecularGas | OFF | CO emission tracing molecular gas concentrated in bar dust lanes, nuclear ring, and spiral arms. Rendered as orange-tinted overlay #D09050, opacity 0.06 where gas density >10 M☉/pc². Gas follows bar potential — offset from stellar bar. Bar channels gas from corotation inward at rate ~1–10 M☉/yr. Total molecular gas: 10⁹–10¹⁰ M☉. |
| Dust & Gas | HI Gas Disk | uHIDisk | OFF | Atomic hydrogen disk extending beyond optical disk to 1.5–2× R₂₅. Color: #5A8A9A (21 cm emission rendered), opacity 0.03. Warped outer HI disk common. Central HI hole (gas converted to H₂ or blown out by bar shear). HI mass: 10⁹–10¹⁰ M☉. Spiral structure visible in HI extending beyond optical arms. |
| Star Formation | Bar-End Star Formation | uBarEndSF | ON | Enhanced star formation where bar meets spiral arm — gas compression at bar ansae. Bright HII complexes #FF6080 at both bar-arm junctions. Giant molecular associations (10⁶–10⁷ M☉ GMCs). Star formation rate locally 5–10× above disk average. 5–10 major HII regions at each bar end. |
| Star Formation | Inter-Arm Star Formation | uInterArmSF | OFF | Low-level star formation between spiral arms. Faint scattered HII regions #FF5080 at opacity 0.2 (dimmer than arm HII). Spacing: sparse, 3–10× lower surface density than in arms. Represents spontaneous gravitational collapse not triggered by density wave. Shows arms enhance but don't monopolize star formation. |
| Outer Disk | Disk Truncation | uDiskTruncation | OFF | Sharp outer edge of stellar disk at radius R_break = 2–4× scale length. Surface brightness drops steeply (steeper exponential or threshold cutoff). Color transition: disk #E0D0A0 → background. Origin: maximum angular momentum of initial gas, or star formation threshold. Break visible as brightness contour crowding. |
| Outer Disk | Extended UV Disk | uExtendedUVDisk | OFF | Star formation beyond optical disk edge, detected in GALEX UV. Faint blue complexes #8AA0D0, opacity 0.1, at 1.5–3× R₂₅. Sparse but present: isolated HII regions in outer HI gas disk. Shows galaxy is larger than optical appearance suggests. XUV disk phenomenon. |
| Camera | Face-On View | uCameraMode | ON | Default: face-on showing full bar, spiral arms, nuclear ring, and disk structure. Distance: 200 kpc. FOV 40°. Bar orientation ~30° from horizontal for visual clarity. Shows NGC 1300-like grand design barred spiral. |
| Camera | Edge-On View | uCameraMode | OFF | Disk seen edge-on: shows box/peanut (X-shaped) bulge structure formed by bar vertical instability. Prominent dust lane. Boxy isophotes diagnostic of bar viewed side-on. Distance: 200 kpc. |
| Camera | Time Speed Multiplier | uTimeSpeed | 10⁷ yr/s | 1 real second = 10 Myr. Bar rotation period (~200 Myr) visible in ~20 seconds. Spiral arm winding and HII region lifecycle (few Myr) visible as flickering. |

---

### Ring Galaxy (Collisional)

**Entity ID:** ENT-6034
**Description:** Spectacular galaxy formed by a nearly head-on collision of a smaller "bullet" galaxy through the center of a larger disk galaxy. The collision triggers an expanding density wave (like a ripple in a pond) that compresses gas into a bright ring of vigorous star formation propagating outward at 100–200 km/s. Ring diameter 20–100 kpc, expanding over ~300 Myr timescale. Central region depleted of gas ("empty" nucleus). Colors: ring young stars #8AB0E8 (blue, OB associations) + HII regions #FF5080 (pink), central depleted zone #E8D0A0 (old stars only), intruder galaxy #D0C090 (disrupted). Only ~0.01% of galaxies — extremely rare. Real exemplars: Cartwheel Galaxy (ESO 350-40, classic archetype), Hoag's Object (peculiar, possibly not collisional), AM 0644-741 (Lindsay-Shapley Ring), Arp 147 (perfect ring+intruder pair).

**Section Count:** 7 (Star-Forming Ring, Central Region, Intruder Galaxy, Ring Dynamics, Spokes & Structure, Gas & Dust, Camera)
**Feature Count:** 25

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Star-Forming Ring | Blue Star Formation Ring | uBlueRing | ON | Dominant visual feature: brilliant ring of young OB stars and HII regions. Ring diameter 30–80 kpc (Cartwheel: ~44 kpc). Width 5–10 kpc. Color: #8AB0E8 (young hot stars, age <30 Myr) with embedded #FF5080 (HII regions). Star formation rate in ring: 10–50 M☉/yr (starburst level). Ring luminosity: 50–80% of total galaxy. Rendered as bright annulus with FBM clumping: 6 octaves, freq 4.0, gain 0.4. Emission factor 0.5 (partially self-luminous HII). |
| Star-Forming Ring | Ring Clumpiness | uRingClumps | ON | Ring is not uniform — breaks into massive star-forming complexes (super-star clusters). 10–30 major clumps along ring, each containing 10⁴–10⁶ young stars. Clump diameter 500–2000 pc. Brightest clumps: #A0C8FF (blue) + #FF6090 (pink HII). Clump luminosity variation: factor 5–20 between brightest and faintest. Asymmetric clump distribution (ring not perfectly centered). |
| Star-Forming Ring | Ring Expansion Visualization | uRingExpansion | OFF | Animated ring expansion at ~200 km/s outward velocity. Ring diameter increases by ~1 kpc per 5 Myr. Inside ring: post-wave region where star formation has ceased, stars aging from blue → white → yellow. Creates radial color gradient: inner #E8D8B0 (old post-burst), middle #B0C0D8 (intermediate), outer edge #8AB0E8 (active). Density wave nature clearly demonstrated. |
| Star-Forming Ring | Inner Ring (If Present) | uInnerRing | OFF | Cartwheel Galaxy has secondary inner ring at ~12 kpc diameter — reflected density wave. Less luminous than outer ring. Color: #A0B0C8 (moderate star formation). Not all ring galaxies have double rings — depends on collision geometry and timing. Ring width ~3 kpc. 30–50% of outer ring luminosity. |
| Central Region | Depleted Nucleus | uDepletedNucleus | ON | Central region (r < 5–10 kpc) cleared of gas by expanding density wave. Old stellar population remains: #E8D0A0 (yellow-orange, age >5 Gyr). No current star formation. Smooth featureless appearance. Hub-like morphology. Surface brightness: normal elliptical-like profile but "dead" (quenched by gas removal). May contain nuclear star cluster or AGN remnant. |
| Central Region | Central Dust Knot | uCentralDust | OFF | Residual dust concentration at nucleus. Color: #3A2820 (absorption), optical depth τ_V = 0.3–1. Diameter ~1 kpc. Residual molecular gas not fully swept by wave. May fuel low-level AGN activity. Visible as dark patch against old stellar background. |
| Central Region | Post-Wave Stellar Aging | uPostWaveAging | OFF | Radial color gradient from ring inward: stars formed at earlier ring passages now aging. Outermost: blue #8AB0E8 (current ring, <30 Myr), mid: #A0B0C0 (100 Myr post-wave), inner: #D0C8A0 (300 Myr post-wave), center: #E8D0A0 (pre-collision old stars). Creates "bullseye" color pattern revealing collision history. |
| Intruder Galaxy | Bullet Galaxy Position | uBulletGalaxy | ON | The smaller "intruder" galaxy that punched through the disk. Currently located 50–200 kpc from ring center (having passed through and continuing). Color: #D0C090 (disturbed, stripped). Mass: 0.1–0.3× target galaxy. May show tidal distortion, stripped gas tail. Rendered as small irregular galaxy with tidal tails. Connecting tidal bridge to ring galaxy possible. |
| Intruder Galaxy | Intruder Trajectory | uIntruderTrajectory | OFF | Path of intruder galaxy through target disk. Rendered as dotted line #FF8040, opacity 0.1. Entry point near ring center, exit point beyond current position. Impact parameter: <5 kpc for clean ring morphology (nearly bullseye). Larger impact parameter creates asymmetric or partial rings. Animated approach-impact-departure. |
| Intruder Galaxy | Tidal Bridge | uTidalBridge | OFF | Stellar and gaseous bridge connecting ring galaxy to intruder. Tidal debris torn from both galaxies during passage. Color: #C8B890 (old stars) + #5A7A9A (ionized gas). Width 5–15 kpc, length 50–200 kpc. Surface brightness: very faint, ~27 mag/arcsec². FBM texture: 4 octaves, freq 2.0, amp 0.1. |
| Ring Dynamics | Density Wave Front | uDensityWaveFront | OFF | Visualization of the propagating density wave causing the ring. Wave compression ratio: 3–10× ambient density. Rendered as thin bright arc #C0D0E0, opacity 0.15 at outer ring edge (leading edge of wave). Star formation triggered 1–5 Myr after gas compression. Wave speed: 100–200 km/s (depends on disk mass). |
| Ring Dynamics | Velocity Field | uVelocityField | OFF | Radial expansion velocity + residual rotation. Expansion: 100–200 km/s outward beyond ring. Interior: infall back toward center. Rotation: perturbed but preserved from original disk. Rendered as vector field arrows #5A8A5A, opacity 0.08. Combined expansion + rotation creates spiral-like kinematic pattern despite circular appearance. |
| Spokes & Structure | Radial Spokes | uRadialSpokes | ON | Cartwheel Galaxy's iconic radial "spokes" connecting nucleus to outer ring. Remnant spiral arm structure from pre-collision disk, now stretched radially by expanding wave. 4–8 spokes visible. Color: #C8B8A0 (old + intermediate age stars). Width 1–3 kpc, length 15–30 kpc. Surface brightness: faint (10–20% of ring). Dust lanes visible within spokes #3A2A1A. |
| Spokes & Structure | Ring Asymmetry | uRingAsymmetry | ON | Ring rarely perfectly circular — offset nucleus, elliptical ring, brightness asymmetry. Offset: 1–5 kpc (intruder didn't hit exact center). One side brighter than other (factor 1.5–3×). Ellipticity ε = 0.1–0.3. Morphological asymmetry records collision geometry. Most dramatically asymmetric for off-center collisions. |
| Spokes & Structure | Double Ring Structure | uDoubleRing | OFF | If collision occurred >200 Myr ago: both outgoing and reflected (returning) density waves visible as two concentric rings. Outer ring: expanding, currently star-forming. Inner ring: returned from center, also star-forming but typically fainter. Ring spacing records wave speed and time since collision. |
| Gas & Dust | HI Gas Ring | uHIGasRing | OFF | Atomic hydrogen concentrated in and ahead of star-forming ring. HI ring diameter slightly larger than stellar ring (gas leads wave). Mass: 10⁹–10¹⁰ M☉. Rendered as extended haze #5A8A9A, opacity 0.03, coincident with outer ring. Post-wave interior: HI depleted to <10% of pre-collision value. |
| Gas & Dust | Hot X-ray Gas | uXrayGas | OFF | Shock-heated gas at wave front and in intergalactic space around system. T ~10⁶–10⁷ K, X-ray luminous. Diffuse emission: #4A5A8A, opacity 0.02, elongated along collision axis. Hot gas also fills ring galaxy interior where ISM was shock-heated by passage. Total L_X ~10⁴⁰–10⁴¹ erg/s. |
| Camera | Face-On Ring View | uCameraMode | ON | Default: face-on to ring plane showing full ring + spokes + nucleus + intruder. Distance: 300 kpc. FOV 45°. Dramatic presentation of ring morphology. Intruder visible offset from center. Cartwheel Galaxy orientation. |
| Camera | System Overview | uCameraMode | OFF | Zoomed out showing ring galaxy + intruder + tidal bridge in context. Distance: 500 kpc. Shows collision geometry and current separation. Both galaxies visible with connecting features. |
| Camera | Time Speed Multiplier | uTimeSpeed | 10⁷ yr/s | 1 real second = 10 Myr. Ring expansion visible: ~2 kpc per second of viewing. Star formation ignition and aging gradient develops over 30 real seconds of observation. |

---

### Starburst Galaxy

**Entity ID:** ENT-6036
**Description:** Galaxy experiencing extreme star formation rate 10–1000× higher than normal spirals (SFR 10–1000 M☉/yr vs ~1 M☉/yr for Milky Way). Often triggered by galaxy interaction/merger compressing gas into central region. Characterized by: luminous infrared emission (dust-reprocessed UV from massive young stars), bipolar superwind driven by collective supernova energy, intense UV radiation field, and extreme molecular gas densities. Visible appearance: bright blue-white nuclear region partially obscured by dust, filamentary outflow structures, disturbed morphology from merger interaction. Colors: starburst nucleus #A0C8FF (blue, young stars seen through patchy dust), dust lanes #2A1A0A, superwind filaments #FF5050 (Hα shock-excited), far-IR dust glow #C8A080. Real exemplars: M82 (Cigar Galaxy, archetypal nearby starburst), NGC 253, Arp 220 (ULIRG, extreme buried starburst), Henize 2-10 (dwarf starburst).

**Section Count:** 8 (Starburst Nucleus, Galactic Superwind, Dust Obscuration, Star Formation Complexes, Molecular Gas, Merger Morphology, Multi-Wavelength, Camera)
**Feature Count:** 27

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Starburst Nucleus | Nuclear Starburst Region | uStarburstNucleus | ON | Compact (<1 kpc) region of extreme star formation at galaxy center. Surface brightness: 100–1000× normal disk. Color: patchy blue-white #A0C8FF (young OB stars, <10 Myr) showing through dust gaps. SFR surface density: 10–100 M☉/yr/kpc² (vs ~0.01 for normal disk). FBM clumpy texture: 8 octaves, freq 6.0, gain 0.5. Emission factor 0.6 (strongly self-luminous). |
| Starburst Nucleus | Super Star Clusters | uSuperStarClusters | ON | Ultra-dense young star clusters (proto-globular clusters) within starburst. Mass: 10⁵–10⁷ M☉ each, radius 1–10 pc (unresolved at galaxy distance). Color: #B0D0FF (blue-white, age <10 Myr). 10–100 SSCs in nuclear region. Brightest SSCs contribute 10–50% of nuclear UV luminosity. Rendered as bright point sources clustered in nucleus. |
| Starburst Nucleus | Embedded IR Sources | uEmbeddedIR | OFF | Deeply dust-embedded star-forming regions visible only in IR. Hidden behind A_V > 10–50 magnitudes of dust. Rendered as warm glow #C8A060 emerging through dust (IR visualization mode). Arp 220 archetype: nuclear starburst entirely invisible in optical, luminosity 10¹² L☉ emerges in far-IR. Temperature: T_dust 40–80 K. |
| Galactic Superwind | Bipolar Outflow Cone | uSuperwindCone | ON | Collective energy from thousands of supernovae and stellar winds drives galactic-scale superwind perpendicular to disk plane. Bipolar cone structure: half-opening angle 30–60°, extent 5–15 kpc per side. Filamentary Hα emission: #FF5050 (shock-excited hydrogen). Wind speed: 500–2000 km/s. Mass outflow rate: 10–100 M☉/yr. M82 archetype. FBM filamentary: 7 octaves, freq 5.0, amp 0.08. |
| Galactic Superwind | Superwind Shock Front | uSuperwindShock | ON | Swept-up ISM/IGM at superwind leading edge forming bow shock. Shell-like structure at 5–15 kpc from disk. Color: #FF6060 (Hα) + #4A6A9A (X-ray hot gas). Shell expansion velocity 300–800 km/s. Fragmented and clumpy (Rayleigh-Taylor instability). Shell thickness ~1 kpc. Surface brightness decreasing with distance from disk. |
| Galactic Superwind | Hot Phase X-ray Gas | uXrayHotPhase | OFF | Superwind hot phase: T ~10⁷–10⁸ K, filling wind cone interior. X-ray luminosity L_X ~10⁴⁰–10⁴¹ erg/s. Rendered as diffuse blue-white glow #7090B0, opacity 0.04 filling cone volume. Smooth, less filamentary than Hα. Temperature decreasing with distance from nucleus. Metal-enriched gas (O, Fe from SNe) being expelled to IGM. |
| Galactic Superwind | Entrained Dust Filaments | uEntrainedDust | ON | Cool dusty filaments entrained in hot superwind — not destroyed, dragged out along wind. Absorb and re-emit IR radiation. Dark filaments #3A2A1A against superwind glow, width 50–200 pc, length 1–5 kpc. Also scatter nuclear light creating reflection nebula effect: #D0B890 in scattered starlight. 20–50 filaments per cone. |
| Dust Obscuration | Nuclear Dust Shroud | uNuclearDust | ON | Thick dust layer partially obscuring starburst nucleus. Optical depth: τ_V = 5–100 (extreme). Color: #2A1A0A (dark absorption patches). Patchy: ~30–50% of nucleus visible through gaps in optical. UV/blue light most absorbed; red less so. Dust mass: 10⁷–10⁸ M☉. FBM patchy extinction: 6 octaves, freq 4.0, gain 0.45. Creates dramatic "looking through holes in dust" appearance. |
| Dust Obscuration | Far-IR Dust Emission | uFIRDustEmission | OFF | Dust-reprocessed starburst luminosity emerging in far-IR. L_FIR = 10¹⁰–10¹² L☉ (LIRG to ULIRG regime). Rendered as warm extended glow #C8A060, opacity 0.08, centered on nucleus, FWHM 1–5 kpc. Dust temperature gradient: 60–80 K nuclear to 20–30 K outer. FIR luminosity greatly exceeds optical — most energy output invisible to eye. |
| Dust Obscuration | Dust Lanes (Disk) | uDiskDustLanes | ON | Dust lanes in galaxy disk silhouetted against stellar background. Prominent in edge-on view (M82 archetype). Color: #2A1A0A, optical depth τ_V = 1–5. Irregular, disturbed by merger interaction — not regular spiral-arm dust lanes. Width 200–1000 pc. Multiple intersecting lanes creating complex absorption pattern. |
| Star Formation Complexes | Giant HII Region Complexes | uGiantHII | ON | Enormous HII regions ionized by SSC radiation. Diameter 200–1000 pc (vs 10–100 pc for normal galaxy HII). Color: #FF5080 (Hα emission), some with [OIII] component #50D0B0 in higher-ionization zones. 30–100 giant HII regions in starburst area. Luminosity per region: 10³⁹–10⁴¹ erg/s (10–1000× Orion Nebula). Emission factor 0.7. |
| Star Formation Complexes | Supernova Rate Indicator | uSNRate | OFF | Visual representation of extreme supernova rate: 0.1–1 SN per year (vs ~0.02/yr for Milky Way). Rendered as stochastic flash events #FFFFFF, duration 0.5s, random position within starburst region. Frequency: 1 flash per 1–10 real seconds. Each flash illuminates surrounding region briefly. Cumulative SN energy powers superwind. |
| Molecular Gas | Dense Molecular Core | uMolecularCore | OFF | Concentrated molecular gas reservoir feeding starburst. Mass: 10⁹–10¹⁰ M☉ within central kpc. Surface density: 10³–10⁴ M☉/pc² (100–1000× normal). Rendered as orange-tinted overlay #D09050, opacity 0.08. Gas consumption timescale: 10⁷–10⁸ yr (short — starburst is self-limiting). CO emission brightness temperature > 50 K. |
| Molecular Gas | Molecular Outflow | uMolecularOutflow | OFF | Cold molecular gas entrained in superwind — surprising discovery that even molecular gas is expelled. Mass outflow rate in molecular phase: 10–200 M☉/yr (comparable to SFR). Rendered as cold dense clumps #A08050, opacity 0.04 within superwind cone. Velocity 100–500 km/s. Traced by CO emission at wind velocities. Major mass-loss channel. |
| Merger Morphology | Tidal Tails | uTidalTails | ON | Disturbed morphology from triggering merger/interaction. 1–2 tidal tails extending 20–100 kpc. Color: #D0C090 (old + intermediate age stars drawn from disk). Width 3–10 kpc. Tidal tail star formation: scattered young clusters #8AB0D0 forming in compressed tidal gas. Tails curve from gravitational torque. FBM: 4 octaves, freq 2.0, amp 0.05. |
| Merger Morphology | Interaction Companion | uCompanionGalaxy | OFF | Merger companion galaxy (if still distinct). May be partially absorbed or at moderate separation. Color: #D8C8A0 (disturbed normal galaxy). Connected by tidal bridge. Mass ratio: 1:1 (major merger) to 1:10 (minor merger). Minor mergers sufficient to trigger starburst in some cases. Rendered at current separation with tidal distortion. |
| Merger Morphology | Double Nucleus | uDoubleNucleus | OFF | For advanced mergers (Arp 220 type): two galactic nuclei within shared envelope. Separation: 0.3–5 kpc. Each nucleus independently luminous: #C8A060 + #C0A050. Shared dust shroud. Will eventually merge into single nucleus. Diagnostic of merger stage — ULIRG phase occurs during double-nucleus stage. |
| Multi-Wavelength | UV Starburst View | uUVView | OFF | UV-wavelength visualization emphasizing young stellar population. Starburst region 10–100× brighter in UV than optical (before dust correction). Color rendering: #B0C8FF (UV-bright). Dust-unobscured regions show as brilliant UV sources. UV traces star formation directly. Contrast with dust-obscured IR view shows complementary information. |
| Multi-Wavelength | Radio Continuum | uRadioContinuum | OFF | Synchrotron + free-free radio emission. Synchrotron from supernova remnant electrons: extended, filling superwind cone. Free-free from HII regions: concentrated in nucleus. Rendered as diffuse red-tinted overlay #C05050, opacity 0.04, extended along superwind axis. Radio-FIR correlation: tight for starbursts (L_radio ∝ L_FIR). |
| Camera | Edge-On Superwind View | uCameraMode | ON | Default: M82-like edge-on view showing disk dust lanes, nuclear starburst peeking through, and dramatic bipolar superwind structure extending above and below disk. Distance: 100 kpc. FOV 50°. Most visually spectacular orientation. |
| Camera | Face-On Starburst View | uCameraMode | OFF | Looking down on disk: nuclear starburst region visible, dust lanes crossing, tidal tails extending. Shows spatial distribution of star formation. Superwind cones seen as circular brightening around nucleus. Distance: 100 kpc. |
| Camera | Time Speed Multiplier | uTimeSpeed | 10⁶ yr/s | 1 real second = 1 Myr. Superwind expansion (10 kpc in ~10 Myr) visible over viewing session. SN events flash. SSC evolution visible. Starburst duration ~10–100 Myr — entire starburst lifecycle compressible to ~100 real seconds. |

---

### Dwarf Spheroidal Galaxy (dSph)

**Entity ID:** ENT-6038
**Description:** Smallest, faintest, and most dark-matter-dominated galaxies known — low-luminosity (10³–10⁷ L☉), low surface brightness (>25 mag/arcsec²), composed almost entirely of old (>10 Gyr) metal-poor stars with little or no gas or recent star formation. Resolved into individual stars at distances of Local Group satellites. Extremely high mass-to-light ratios (M/L = 10–1000 M☉/L☉) — among the strongest evidence for dark matter. Morphology: diffuse, roughly spherical/ellipsoidal stellar cloud with no disk, no nucleus, no dust. Colors: ancient metal-poor red giant stars #E8C8A0 (warm yellow-orange), blue horizontal branch stars #A0B8D8, RR Lyrae variables. Real exemplars: Sculptor dSph, Fornax dSph (most luminous classical satellite), Draco dSph, Segue 1 (ultra-faint, M/L ~3400), Sagittarius dSph (being tidally disrupted by Milky Way).

**Section Count:** 7 (Stellar Population, Structural Properties, Dark Matter Halo, Tidal Interaction, Internal Kinematics, Star Formation History, Camera)
**Feature Count:** 25

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Stellar Population | Resolved Star Field | uResolvedStars | ON | Individual stars rendered as discrete points (galaxy resolved at Local Group distances). Red giant branch stars: #E8C8A0 (dominant population, old metal-poor). Blue horizontal branch: #A0B8D8 (hot evolved stars). RR Lyrae variables: #D0C0A0 (pulsating, flickering). Main sequence turnoff: too faint to resolve at >50 kpc. Total: 10³–10⁶ stars rendered as points with color/magnitude distribution. |
| Stellar Population | Red Giant Branch Stars | uRGBStars | ON | Dominant visible population: old (>10 Gyr) metal-poor red giants. Color: #E8C8A0 to #F0D0A0 (temperature 3500–4500 K). Metallicity spread: [Fe/H] = -3 to -1 (extremely metal-poor). Tip of RGB at M_I ≈ -4 (distance indicator). 50–90% of resolved stars are RGB. Spatial distribution follows smooth exponential profile. |
| Stellar Population | Blue Horizontal Branch | uBHBStars | OFF | Hot evolved stars on horizontal branch: temperature 7000–10000 K, color #A0B8D8. Presence indicates old (>10 Gyr), metal-poor ([Fe/H] < -1.5) population. BHB/RGB ratio varies between dSphs. Fornax: fewer BHB (more metal-rich). Sculptor: prominent BHB (more metal-poor). Spatial distribution: more extended than RGB in some dSphs. |
| Stellar Population | RR Lyrae Variables | uRRLyrae | OFF | Pulsating variable stars: period 0.2–1.0 days, amplitude 0.3–1.5 mag. Color oscillation: #D8C0A0 (bright, hotter phase) ↔ #C8A880 (faint, cooler phase). Standard candles for distance. 10–1000 RR Lyrae per dSph. Animated pulsation with individual random phases. Population tracer for old stellar component. |
| Structural Properties | Exponential/Plummer Profile | uSurfaceBrightness | ON | Surface brightness profile: Plummer or exponential. Half-light radius R_h = 100–1000 pc (classical dSphs), 10–100 pc (ultra-faint). Central surface brightness: 24–28 mag/arcsec² (extremely faint). Ellipticity ε = 0.1–0.5. Rendered as smooth stellar density gradient. No nucleus or central concentration beyond profile. Background galaxy barely distinguishable from field stars. |
| Structural Properties | Ellipsoidal Shape | uEllipsoidalShape | ON | Intrinsic 3D shape: triaxial ellipsoid with axis ratios b/a = 0.5–0.9, c/a = 0.3–0.8. Projected ellipticity ε = 1 - b/a. Position angle of major axis. Shape may be tidally distorted by host galaxy. Rendered as elliptical isodensity contours. No isophotal twist (simple ellipsoid, not merger-distorted). |
| Structural Properties | King Tidal Radius | uTidalRadius | OFF | Limiting radius where host galaxy tidal field truncates dSph. King profile tidal radius: 1–5 kpc for classical dSphs. Beyond this: stellar density drops to zero (or transitions to tidal debris). Rendered as outer boundary circle #5A6A7A, opacity 0.05. Concentration parameter c = log(r_t/r_c) = 0.5–1.5. Stars beyond r_t being stripped. |
| Dark Matter Halo | DM Halo Visualization | uDMHalo | OFF | Inferred dark matter halo extending far beyond stellar distribution. NFW profile: concentration c = 10–30, scale radius r_s = 0.5–5 kpc. Halo extends to virial radius ~30–100 kpc (much larger than stellar R_h). Rendered as diffuse blue glow #3A4A6A, opacity 0.03, extent 10× stellar R_h. M/L ratio indicator displayed: 10–1000. The defining feature of dSphs as DM laboratories. |
| Dark Matter Halo | Mass-to-Light Ratio Profile | uMLProfile | OFF | Visualization of M/L increasing with radius. Central: M/L ~5–10. At R_h: M/L ~50–500. At r_t: M/L ~100–3000. Rendered as color-coded radial zones: inner (less DM dominated) #C8B090, outer (extreme DM dominance) #3A4A8A. Demonstrates that outskirts are almost entirely dark matter. Educational visualization. |
| Dark Matter Halo | DM Annihilation Signal | uDMAnnihilation | OFF | Theoretical dark matter annihilation signal (if DM is WIMP). Expected J-factor (astrophysical factor for annihilation signal) proportional to ρ² integrated along line of sight. Rendered as faint glow #5A3A8A, opacity 0.01 concentrated at center (cuspy NFW) or uniform (cored profile). Ultra-faint dSphs: among best targets for indirect DM detection due to proximity and high DM density. |
| Tidal Interaction | Tidal Tails/Streams | uTidalTails | OFF | Stars stripped by host galaxy tidal field forming extended tidal streams. Sagittarius dSph archetype: wraps 360° around Milky Way. Stream width: 1–5 kpc, length: up to 100+ kpc. Color: #D0C0A0 (same old stars as main body, just unbound). Surface brightness: 30–32 mag/arcsec² (near detection limit). Leading and trailing arms. |
| Tidal Interaction | Extra-Tidal Stars | uExtraTidalStars | OFF | Stars beyond King tidal radius but not yet in organized stream. Diffuse halo of recently stripped stars. Surface density: 10–100× lower than within tidal radius. Detected via matched-filter star counts. Rendered as sparse star points beyond tidal boundary, density decreasing with radius. Indicator of ongoing tidal stripping. |
| Tidal Interaction | Morphological Distortion | uMorphDistortion | OFF | Tidal stretching: elongation toward host galaxy (pointing effect). S-shaped isophotal twist from differential tidal acceleration. Position angle of outer isophotes rotates toward host. Ellipticity increases at larger radii. Rendered as isodensity contours showing twist: inner circular, outer elongated toward host direction. |
| Internal Kinematics | Velocity Dispersion Map | uVelDispMap | OFF | Line-of-sight stellar velocity dispersion: σ = 5–15 km/s (small but measurable). Flat or slowly declining profile with radius — signature of DM halo (stars alone predict declining σ). Rendered as color-coded overlay: higher σ = warmer color #D0A050, lower σ = cooler #5A7AA0. Central σ constrains enclosed DM mass. |
| Internal Kinematics | Stellar Rotation | uStellarRotation | OFF | Most dSphs show no significant rotation (pressure-supported systems, v_rot/σ < 0.5). Exception: some transitional dIrr/dSph show residual rotation. If present: rotation axis rendered with gradient (approaching side #5A5AFF, receding #FF5A5A). Rotation amplitude 0–5 km/s vs dispersion 5–15 km/s. |
| Star Formation History | Stellar Population Gradient | uPopGradient | OFF | Many dSphs show spatial population gradient: metal-rich (younger) stars more centrally concentrated, metal-poor (older) stars more extended. Center: [Fe/H] ≈ -1, #E8D0A8 (warmer). Outskirts: [Fe/H] ≈ -2.5, #D0B8A0 (cooler, bluer). Gradient mapped as radial color change. Fornax and Sculptor show this clearly. |
| Star Formation History | Ancient Burst Visualization | uAncientBurst | OFF | Most dSphs formed majority of stars >10 Gyr ago in single burst. Some (Fornax, Carina) show extended/multiple bursts. Visualization: color-coded stars by age — ancient >10 Gyr: #D8B8A0, intermediate 3–10 Gyr: #C8B8A8, young <3 Gyr: #A0B0C0 (rare, Fornax only). Animated "clock" showing when stars formed. |
| Star Formation History | Gas Content (If Any) | uGasContent | OFF | Most classical dSphs: no detectable gas (completely stripped/consumed). Upper limits: <10⁴ M☉ HI. Exception: transition types (dIrr/dSph like Phoenix, LGS 3) retain small gas reservoirs. If gas present: #5A8A9A, opacity 0.02, offset from stellar center (ram-pressure displaced). |
| Camera | Resolved Star View | uCameraMode | ON | Default: individual stars visible against dark background. Distance scaled to fill frame with stellar distribution to ~2 R_h. FOV 40°. Background field stars rendered at lower density. Shows diffuse, low-surface-brightness nature. Milky Way foreground stars brighter than dSph members. |
| Camera | Host Galaxy Context | uCameraMode | OFF | Zoomed out showing dSph position relative to host galaxy (Milky Way). Tidal stream visible if enabled. Scale: 100+ kpc field showing satellite orbit context. Multiple dSph satellites visible for Local Group overview. |
| Camera | Time Speed Multiplier | uTimeSpeed | 10⁸ yr/s | 1 real second = 100 Myr. Orbital period around host (~1–2 Gyr) visible over 10–20 seconds. Tidal stripping visible over observation. Star formation history spans ~10 seconds of viewing. RR Lyrae pulsation far too fast to resolve — rendered as steady. |

---

### Seyfert Galaxy (Active Galactic Nucleus)

**Entity ID:** ENT-6041
**Description:** Spiral galaxy hosting a luminous active galactic nucleus — the low-luminosity cousin of quasars, close enough to resolve both AGN and host galaxy. Central engine: supermassive black hole (10⁶–10⁸ M☉) accreting at 1–10% Eddington rate. Seyfert 1: broad-line region visible (face-on to torus), bright point-like nucleus outshining inner galaxy. Seyfert 2: BLR hidden by dusty torus (edge-on), narrow-line region visible, ionization cones prominent. Nucleus colors: Sy1 bright blue-white #D0E0FF (thermal accretion disk), Sy2 reddened #E8C890 (dust-scattered AGN light). Ionization cone emission: [OIII] #50D0B0. Real exemplars: NGC 1068 (M77, Sy2 archetype), NGC 4151 (Sy1.5, "Eye of Sauron"), NGC 5548 (Sy1, reverberation mapping pioneer), NGC 7469 (Sy1 + circumnuclear starburst ring).

**Section Count:** 8 (AGN Central Engine, Broad-Line Region, Narrow-Line Region, Dusty Torus, Ionization Cones, Host Galaxy, AGN Variability, Camera)
**Feature Count:** 26

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| AGN Central Engine | Accretion Disk | uAccretionDisk | ON | Geometrically thin, optically thick disk feeding SMBH. Temperature profile T(r) ∝ r^(-3/4), peaking at ~10⁵ K innermost stable orbit. Color: inner #D0E0FF (UV/blue-white), outer #E8D0A0 (cooler IR). Disk diameter: ~10⁻⁴–10⁻² pc (unresolvable — rendered as point or small disk at extreme zoom). Luminosity 10⁴²–10⁴⁴ erg/s. Emission factor 1.0 (self-luminous). |
| AGN Central Engine | X-ray Corona | uXrayCorona | OFF | Hot electron corona (T ~10⁹ K) above accretion disk. Inverse-Compton scatters disk UV photons to X-ray. Compact: r ~10 R_g (gravitational radii). Rendered as small diffuse glow #B0C0E0, opacity 0.3, surrounding disk center. X-ray luminosity 10–30% of bolometric. Variability on timescale hours–days (light-crossing time of corona). |
| AGN Central Engine | Relativistic Jet (If Present) | uAGNJet | OFF | ~10% of Seyferts have detectable radio jets (radio-quiet AGN can still have weak jets). Mildly relativistic: v ~ 0.1–0.5c. Length: 0.1–10 kpc (much smaller than radio galaxy jets). Color: #7090C0 (synchrotron, blue-shifted). Bilateral, perpendicular to disk plane. Jet power: 10⁴²–10⁴³ erg/s. Rendered as narrow collimated beam from nucleus. |
| Broad-Line Region | BLR Visualization (Sy1) | uBLRVisualization | ON | Fast-moving gas clouds (v = 1000–10000 km/s) at 0.01–0.1 pc from SMBH. Produces broad emission lines (FWHM 1000–10000 km/s). Rendered as compact cloud swarm orbiting nucleus: #E0D0C0, opacity 0.2. Cloud distribution: flattened disk-like or bowl-shaped. Size from reverberation mapping: light-days to light-weeks. Only visible in Sy1 (unobscured line of sight). |
| Broad-Line Region | BLR Emission Spectrum Indicator | uBLRSpectrum | OFF | Visualization of broad emission line contributions. Hα #FF5050 (broad wings), Hβ #40C8B0, MgII #6060D0, CIV #5050A0. Each line: FWHM indicated by rendered width. Line ratios constrain BLR density and ionization. Educational: shows spectral decomposition of AGN light. |
| Narrow-Line Region | NLR Cloud Distribution | uNLRClouds | ON | Spatially resolved ionized gas clouds at 10–1000 pc from nucleus. Velocity 200–900 km/s. Color: [OIII]λ5007 #50D0B0 (dominant narrow line). Cloud distribution: concentrated in ionization cones but also scattered. Individual clouds 1–50 pc diameter. Total NLR extent: 100–3000 pc. Rendered as discrete clumps within cone volume. |
| Narrow-Line Region | [OIII] Emission Map | uOIIIMap | ON | [OIII]λ5007 emission distribution: strongest narrowband AGN diagnostic. Color: #50D0B0, emission factor 0.6. Concentrated along ionization cone axis. Surface brightness decreasing with distance from nucleus: I ∝ r^(-2). Extended emission at 1–3 kpc from nucleus. NGC 1068 [OIII] image archetype: spectacular biconical structure. |
| Dusty Torus | Obscuring Torus | uDustyTorus | ON | Geometrically thick dusty structure (height/radius ~1) surrounding nucleus at 0.1–10 pc. Provides orientation-dependent obscuration (Unified Model). Inner wall: T_dust ~1500 K (sublimation temperature), color #C8A050 (warm IR glow). Outer: T_dust ~200–500 K, #6A4A2A (cooler, absorbing). Torus opening angle: 60–120° (sets Sy1 vs Sy2 fraction). Optical depth: τ_V > 50 through equator. |
| Dusty Torus | Torus Inner Wall Glow | uTorusInnerGlow | OFF | Hot dust at sublimation radius (r_sub ∝ L^(1/2), typically 0.1–1 pc). T_dust = 1200–1500 K. Near-IR (K-band) dominant emission: #C89040. Resolved by IR interferometry in nearest AGN. Rendered as bright inner ring of torus in cross-section or edge-on view. Reverberation lag: weeks–months (light travel time to torus). |
| Dusty Torus | Polar Dust Component | uPolarDust | OFF | Dust present above/below torus plane (not just equatorial) — observed in mid-IR interferometry. Warm polar dust: #A08050, opacity 0.05, filling ionization cone partially. May be outflowing dusty wind from torus inner edge. Modifies simple Unified Model geometry. Visible as diffuse warm emission within NLR cone volume. |
| Ionization Cones | Biconical Ionization Structure | uIonizationCones | ON | AGN radiation escaping through torus opening creates biconical ionized region. Half-opening angle 30–60°. Cone axis perpendicular to torus equator. Filled with [OIII]-emitting NLR clouds. Cone edge: sharp (defined by torus shadow). Color: #50D0B0 (dominant [OIII]). Extent: 1–10 kpc per cone. NGC 1068 and NGC 5252 archetypes. Rendered as semi-transparent conical volumes. |
| Ionization Cones | Cone-ISM Interaction | uConeISMInteract | OFF | Ionization cone interacting with host galaxy ISM. Where cone intersects disk gas: enhanced line emission, shock-excited regions #FF5050 (Hα). Ionization front creates bright rim. Shadows from individual ISM clouds within cone: dark patches in [OIII] map. Cone geometry reveals 3D orientation of AGN relative to host disk. |
| Ionization Cones | Shadow/Light Pattern | uShadowLightPattern | OFF | Sharp-edged ionization cone creating light/shadow pattern on galaxy ISM. Illuminated gas glows #50D0B0. Shadowed gas dark (neutral). Edge of cone: particularly bright (compression and ionization front). Creates dramatic "searchlight beam" effect in face-on Seyfert 2s. Educational: directly shows torus orientation relative to observer. |
| Host Galaxy | Spiral Host Disk | uHostDisk | ON | Seyferts preferentially in spiral galaxies (75%+ in spirals, not ellipticals). Normal spiral disk: #E0D0A0 (old population) with spiral arms containing #8AB0E8 (young stars) and #FF5080 (HII). AGN contribution: bright point source at center, 10–100× brighter than surrounding bulge in Sy1. Bulge present with normal Sérsic profile. Standard exponential disk. |
| Host Galaxy | Circumnuclear Starburst Ring | uCNStarburstRing | OFF | Ring of star formation at 200–1000 pc triggered by bar-driven gas inflow (same gas that feeds AGN). NGC 7469 archetype. Color: #FF4060 (Hα) + #A0C0FF (blue young stars). SFR in ring: 1–10 M☉/yr. Competes with AGN luminosity at some wavelengths. Morphologically similar to barred spiral nuclear rings but coexisting with AGN. |
| Host Galaxy | Bar/Interaction Trigger | uBarInteraction | OFF | AGN fueling mechanism visualization: galactic bar funneling gas inward, or tidal interaction with companion providing torque to remove angular momentum. Bar: #E8D0A0 elongated structure (if present). Companion: disrupted galaxy 50–200 kpc away with tidal bridge. Shows physical connection between large-scale dynamics and nuclear feeding. |
| AGN Variability | Optical Variability | uOpticalVariability | ON | AGN brightness varies by 0.1–2 magnitudes over weeks–years. Stochastic (damped random walk): τ_damp ~100–300 days. Amplitude: Sy1 > Sy2 (direct view of variable disk vs scattered/reflected light). Rendered as slow sinusoidal + stochastic brightness modulation of nuclear point source. Color slightly bluer when brighter (hotter disk state). |
| AGN Variability | Reverberation Mapping Echo | uReverberationEcho | OFF | BLR responds to continuum variations with time lag (light-travel delay). Visualized: nucleus brightens → BLR brightens τ_BLR later → NLR brightens τ_NLR later (much longer). Echo animation: pulse of light expanding outward from nucleus at c. BLR echo: days–weeks. NLR echo: years–decades. Size indicator rendered as expanding light ring. |
| Camera | Type 1 (Face-On Torus) View | uCameraMode | ON | Default Sy1 view: looking down torus axis, BLR visible, nucleus bright. Distance: 50 kpc. FOV 40°. Central bright point + host galaxy. Ionization cones projected as circular brightening around nucleus. Nucleus overwhelms inner galaxy in brightness. |
| Camera | Type 2 (Edge-On Torus) View | uCameraMode | OFF | Sy2 view: looking through torus equator. Nucleus hidden, NLR and ionization cones prominent. Scattered AGN light in cones. Dust lane possibly visible across nucleus. NGC 1068 presentation. Same physical object, different viewing angle — Unified Model demonstration. |
| Camera | Time Speed Multiplier | uTimeSpeed | 10 days/s | 1 real second = 10 days. AGN variability visible. Reverberation echoes propagate. NLR much slower — essentially static. Host galaxy rotation undetectable at this timescale. |

---

### Galaxy Merger (Major Merger)

**Entity ID:** ENT-6042
**Description:** Two galaxies of comparable mass (mass ratio 1:1 to 1:3) in the process of gravitational merger — one of the most dramatic events in the cosmos, spanning ~1–2 Gyr from first approach to coalescence. Produces spectacular tidal tails, bridges, shells, starbursts, and dual AGN. Merger sequence: first passage → maximum separation → second passage → coalescence → relaxation to elliptical. Colors: tidal tails #D0C090 (old stars), starburst nuclei #A0C8FF (blue, young stars), tidal dwarf galaxies #8AB0D0 (forming in tail tips), shock-heated intergalactic gas #4A6A9A. Final product: elliptical galaxy. Real exemplars: NGC 4038/4039 (Antennae, mid-merger), NGC 7252 (Atoms for Peace, late merger), Arp 299 (dual starburst nuclei), NGC 6240 (dual AGN, ULIRG), Mice Galaxies (NGC 4676, first passage).

**Section Count:** 8 (Tidal Structure, Dual Nuclei, Starburst Activity, Tidal Dwarf Galaxies, Gas Dynamics, Stellar Dynamics, Merger Stage, Camera)
**Feature Count:** 27

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Tidal Structure | Primary Tidal Tails | uPrimaryTails | ON | Two major tidal tails (one from each galaxy) flung outward by gravitational torque during close passage. Length: 50–300 kpc. Width: 5–20 kpc. Color: #D0C090 (old stellar population drawn from disks). Curvature reflects orbital geometry. Tails can contain 10–30% of total stellar mass. FBM internal texture: 5 octaves, freq 2.0, gain 0.3. Antennae Galaxy tails archetype. |
| Tidal Structure | Tidal Bridge | uTidalBridge | ON | Connecting stellar/gaseous bridge between the two galaxy centers during close passage. Length: 20–100 kpc. Width: 5–15 kpc. Color: #C8B890 (mixed stellar populations). Gas-rich bridge can trigger star formation. Bridge prominent during and shortly after close passage, dissipating during coalescence. Opacity: 0.3 at center, tapering to edges. |
| Tidal Structure | Shell Structures | uShellStructures | OFF | Phase-wrapped stellar debris forming concentric shells around merger remnant (late stage). 3–10 shells at radii 10–100 kpc. Interleaved on alternating sides. Color: #E0D0A0 (old stars), surface brightness 26–28 mag/arcsec² (faint). Sharp outer edges, diffuse inner edges. Form ~0.5–1 Gyr after coalescence. NGC 7252 shows developing shells. |
| Tidal Structure | Ripple/Fan Features | uRippleFans | OFF | Fine-structure features in merger remnant: fans, plumes, and ripples at 5–30 kpc. Distinct from shells — more open geometry. Color: #D8C8A0, surface brightness ~27 mag/arcsec². Trace specific orbital configurations of infalling material. Lifetime: 1–3 Gyr before phase-mixing erases them. 2–5 fans/plumes visible. |
| Dual Nuclei | Double Nucleus | uDoubleNucleus | ON | Two galaxy cores, each with own stellar bulge and potentially SMBH. Separation: 1–50 kpc (decreasing through merger). Primary nucleus: #E8D8B0, secondary: #E0D0A0 (slight color difference from different stellar populations). Both surrounded by shared envelope of debris. Separation decreasing through merger stages. Each may host independent nuclear starburst or AGN. |
| Dual Nuclei | Dual AGN | uDualAGN | OFF | Both SMBHs actively accreting — dual AGN. Separation 1–50 kpc. Each nucleus: bright point source #D0E0FF (if unobscured) or #E8C890 (if dust-shrouded). Dual AGN: ~3–10% of merging pairs at kpc separation. NGC 6240 archetype (dual hard X-ray AGN at 1.4 kpc separation). Both ionization cones may be visible, potentially overlapping. |
| Dual Nuclei | SMBH Binary Inspiral | uSMBHInspiral | OFF | Final stages: two SMBHs orbiting each other at <100 pc separation. Orbital period years–centuries. Rendered as two bright points in rapid orbit within shared nuclear region. Separation shrinking via dynamical friction → stellar scattering → gravitational wave emission. Eventually merge (LISA-detectable gravitational waves). Speculative visualization of sub-resolution dynamics. |
| Starburst Activity | Merger-Induced Starburst | uMergerStarburst | ON | Enhanced star formation triggered by gas compression during passages. SFR: 10–100× pre-merger level. Concentrated in overlap region between nuclei and in compressed gas. Color: #A0C8FF (young blue clusters) + #FF5080 (HII emission). SFR peaks during close passages and coalescence. Extends 1–10 kpc around each nucleus. Emission factor 0.5. |
| Starburst Activity | Overlap Region Starburst | uOverlapStarburst | ON | Region between two galaxy disks where gas from each collides at hundreds of km/s. Most intense off-nuclear star formation. Antennae "overlap region" archetype: most luminous part of system in IR. Color: heavily dust-obscured in optical #3A2A1A, brilliant in IR #C8A060. SFR surface density: 10–100 M☉/yr/kpc². Size 5–15 kpc. |
| Starburst Activity | Young Massive Clusters | uYoungMassiveClusters | OFF | Proto-globular clusters forming in merger: mass 10⁵–10⁷ M☉, age <50 Myr. 100–1000 YMCs in active merger. Color: #A0D0FF (blue-white, young). Concentrated in starburst regions but also scattered along tidal features. Antennae: ~10000 young clusters detected. Radius 1–10 pc each (unresolved at typical distance). Rendered as bright blue point sources. |
| Tidal Dwarf Galaxies | TDG Formation at Tail Tips | uTDGFormation | OFF | Gravitational collapse of accumulated material at tidal tail tips forming new dwarf galaxies. Mass: 10⁷–10⁹ M☉. Color: #8AB0D0 (young stellar population from triggered star formation in tidal gas). Diameter 1–5 kpc. 0–3 TDGs per merger. Self-gravitating: may become long-lived satellite galaxies. Located at tail extremity, 100–300 kpc from merger center. |
| Tidal Dwarf Galaxies | HII Regions in Tails | uTailHIIRegions | OFF | Star formation occurring along tidal tail length (not just tips). Scattered HII regions #FF5080, emission factor 0.4. Spacing: 5–20 kpc along tail. Triggered by self-gravity of dense gas clumps within tail. Each HII complex: 100–500 pc diameter. Less intense than nuclear starburst but diagnostic of gas content in tails. |
| Gas Dynamics | Gas Bridge/Streams | uGasStreams | ON | Gaseous streams between galaxies — gas dissipative (loses energy in collisions) while stars pass through. Gas concentrates in bridges, compressed regions, and inflow streams toward nuclei. Rendered: #5A8A9A (neutral HI), opacity 0.04, with dense molecular concentrations #D09050, opacity 0.06 at compression points. Gas morphology dramatically different from stellar morphology. |
| Gas Dynamics | Hot Intergalactic Gas | uHotIGGas | OFF | Shock-heated gas at 10⁷ K produced by galaxy-galaxy collision. Fills space between and around merging galaxies. X-ray luminosity 10⁴⁰–10⁴¹ erg/s. Rendered: #4A6A9A, opacity 0.02, filling 50–200 kpc region around merger. Most extensive at first passage when disks collide at highest velocity. Temperature decreasing from center outward. |
| Gas Dynamics | Tidal Gas Tails | uGasTails | OFF | Gas component of tidal tails — extends further than stellar tails (gas on more loosely bound orbits). HI mass in tails: 10⁹–10¹⁰ M☉ (up to 50% of pre-merger HI). Color: #5A8A9A, opacity 0.02. Gas tails 1.5–2× longer than stellar tails. Contains molecular gas clumps — sites of future TDG formation. |
| Stellar Dynamics | Stellar Stream Morphology | uStellarStreams | OFF | Fine structure in stellar distribution: streams, loops, and plumes from specific orbital passages. Each stream represents stars stripped during a particular encounter. Color: #D0C8A0, surface brightness 27–29 mag/arcsec² (very faint). 3–8 distinct streams identifiable in deep imaging. Each stream has coherent velocity — kinematic fossil of merger history. |
| Stellar Dynamics | Phase-Space Visualization | uPhaseSpace | OFF | Stars occupy distinct regions in position-velocity space (phase space) recording their origin. Educational visualization: overlay showing velocity vectors on stellar distribution. Stars from Galaxy A vs Galaxy B colored differently: #D0B890 vs #B0C0D0. Counter-rotating cores, kinematic substructure revealed. Shows how merger history is encoded in kinematics. |
| Merger Stage | Pre-Merger (First Approach) | uPreMerger | OFF | Early stage: two distinct galaxies approaching, mild tidal distortion. Separation: 50–200 kpc. Tidal bulges developing. Bridge barely forming. Mice Galaxies (NGC 4676) archetype. Star formation slightly enhanced. Morphology still recognizable as two spiral galaxies. |
| Merger Stage | Mid-Merger (Close Passage) | uMidMerger | ON | Default stage: maximum interaction. Long tidal tails fully developed. Overlap region starbursting. Nuclei visible but connected by bridge. Separation: 5–30 kpc. Antennae Galaxies archetype. Most visually spectacular phase. Dual starburst nuclei. Gas streaming toward center. |
| Merger Stage | Post-Merger (Coalescence) | uPostMerger | OFF | Late stage: single merged body forming, tidal features fading. Proto-elliptical: smooth stellar body #E8D0A0 with fine structure (shells, ripples) at large radii. Central starburst winding down. SMBH binary at center. NGC 7252 archetype. Transformation from spiral to elliptical nearly complete. |
| Camera | Wide-Field Merger View | uCameraMode | ON | Default: full system showing both galaxies + tidal tails + bridge. Distance: 500 kpc. FOV 50°. Encompasses 200+ kpc of tidal extent. Shows grand spectacle of interaction. |
| Camera | Overlap Region Zoom | uCameraMode | OFF | Zoomed to starburst region between nuclei. Distance: 50 kpc. Shows intense star formation, dust lanes, young cluster population. Individual giant HII regions resolved. Most luminous region of system. |
| Camera | Time Speed Multiplier | uTimeSpeed | 10⁷ yr/s | 1 real second = 10 Myr. Full merger sequence (~1 Gyr) compressible to ~100 seconds. Tidal tail development, nuclear spiraling, and coalescence visible. Starburst ignition and fading over merger phases. |

---

### Quasar (Quasi-Stellar Object)

**Entity ID:** ENT-6044
**Description:** Most luminous persistent objects in the universe — supermassive black holes (10⁸–10¹⁰ M☉) accreting near Eddington limit, outshining entire host galaxy by factors of 10–1000. Luminosity 10⁴⁵–10⁴⁷ erg/s (10¹¹–10¹³ L☉). Appear as brilliant point sources with fuzzy host galaxy barely detectable underneath. Broad emission lines (v > 10000 km/s), powerful jets (radio-loud subset, ~10%), and massive outflows. Most common at z ~ 2–3 (cosmic noon, ~10 Gyr ago) — beacons of the early universe. Colors: quasar nucleus #E0F0FF (blue-white, UV-bright accretion disk), host galaxy #D0C090 (underlying, much fainter), jet #6080C0 (synchrotron blue), BAL outflow #8070A0 (UV-absorbing). Real exemplars: 3C 273 (first identified quasar, z=0.158), 3C 279 (blazar), APM 08279+5255 (gravitationally lensed), ULAS J1342+0928 (z=7.54, most distant known at discovery).

**Section Count:** 8 (Central Engine, Emission Regions, Relativistic Jet, Outflows & Feedback, Host Galaxy, Gravitational Lensing, Cosmological Context, Camera)
**Feature Count:** 27

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Central Engine | Quasar Nucleus Point Source | uQuasarNucleus | ON | Overwhelmingly bright point source: L_bol = 10⁴⁵–10⁴⁷ erg/s. Color: #E0F0FF (blue-white, UV-excess "big blue bump" from accretion disk). Nucleus 10–1000× brighter than host galaxy. Rendered as brilliant point with diffraction spikes and PSF wings (mimicking actual HST observations). Emission factor 1.0. Central spike bloom radius proportional to log(luminosity). |
| Central Engine | Accretion Disk Structure | uAccDiskStructure | OFF | Zoom to accretion disk: geometrically thin, optically thick, temperature T(r) ∝ r^(-3/4). Inner edge at ISCO (6 R_g for Schwarzschild, 1.2 R_g for maximal Kerr). T_max ~10⁵ K (UV emission). Color gradient: inner #D0E0FF → outer #F8E0C0. Disk diameter ~10⁻² pc (unresolvable — schematic visualization). Relativistic effects: gravitational redshift, beaming, light bending at inner edge. |
| Central Engine | Broad Absorption Line Wind | uBALWind | OFF | High-velocity outflow (v = 0.01–0.3c) launched from accretion disk. ~15% of quasars are BAL quasars showing broad absorption troughs. Rendered as wide-angle wind from disk surface: #8070A0 (UV-absorbing material), opacity 0.1, opening angle 10–30° from disk plane. Mass outflow rate: 1–100 M☉/yr. Kinetic power: 0.1–10% L_bol. Key AGN feedback mechanism. |
| Emission Regions | Broad-Line Region | uBLR | ON | Gas clouds at 0.01–1 pc, velocity 3000–30000 km/s. Produces Lyα, CIV, MgII, Hα broad emission lines. Rendered as compact cloud swarm #E0D0C0, opacity 0.15, orbiting nucleus within parsec. Size from reverberation: R_BLR ∝ L^(0.5), ranging light-days to light-years. BLR mass: ~10⁴ M☉. Covers ~10% of sky as seen from nucleus. |
| Emission Regions | Narrow-Line Region | uNLR | ON | Extended ionized gas at 100–10000 pc. Velocity 300–1000 km/s. [OIII] dominant: #50D0B0. Spatially resolved in nearest quasars. Biconical geometry defined by torus opening angle. Extent scales with luminosity: R_NLR ∝ L^(0.5), up to 30 kpc for luminous quasars. NLR mass: ~10⁷ M☉. Photoionized by quasar UV continuum. |
| Emission Regions | Lyα Nebula (Extended) | uLyaNebula | OFF | Giant Lyα-emitting nebula surrounding quasar at high redshift. Extent: 50–500 kpc (for z > 2 quasars). Color: #7080D0 (Lyα mapped to visible blue-violet). Powered by quasar photoionization of circumgalactic medium and/or cooling radiation from infalling gas. Filamentary morphology tracing cosmic web. Enormous Lyα Blob (LAB) analogs. Opacity 0.03. |
| Relativistic Jet | One-Sided Jet | uOneSidedJet | OFF | Radio-loud quasars (~10%): powerful relativistic jet from spinning SMBH + accretion disk. Jet velocity 0.9–0.999c. Doppler boosting makes approaching jet bright, receding jet invisible. Length: 10 kpc–1 Mpc. Color: #6080C0 (synchrotron, polarized). Knots of enhanced emission along jet: shock-compressed plasma. 3C 273 jet archetype. |
| Relativistic Jet | Superluminal Motion | uSuperluminalMotion | OFF | Apparent faster-than-light motion of jet knots — relativistic illusion from jet pointed near line of sight. Apparent speed: 2–40c (geometric projection effect). Animated knot motion along jet. 3C 279 archetype: knots at apparent 7c. Rendered as bright knot #A0B0D0 moving along jet axis at apparent superluminal speed. Educational: shows geometry explanation. |
| Relativistic Jet | Radio Lobes | uRadioLobes | OFF | Terminal structures where jet impacts intergalactic medium: inflated cocoons of relativistic plasma. Two lobes, 50 kpc–1 Mpc from nucleus. Color: #8060A0 (aged synchrotron emission, redder/steeper spectrum than jet). Volume: enormous, ~10⁶ kpc³ each. Pressure-confined by ICM. Hotspots at lobe tips #A080C0 where jet currently terminates. |
| Outflows & Feedback | Quasar-Mode Feedback | uQuasarFeedback | OFF | Energy output coupling to host galaxy ISM, driving gas out and suppressing star formation. Visualization: expanding energy bubble around nucleus #FF8040, opacity 0.04, pushing galaxy gas outward. Bubble speed 500–2000 km/s. Swept-up shell of compressed/shocked gas at bubble edge. Key mechanism for M-σ relation and galaxy mass function cutoff. |
| Outflows & Feedback | Molecular Outflow | uMolOutflow | OFF | Massive molecular gas outflow driven by quasar radiation/wind pressure. Mass rate: 100–5000 M☉/yr (can exceed SFR). Velocity 500–1500 km/s. Rendered: cool dense streams #A08050, opacity 0.05, being swept out of host galaxy. Detected in CO, OH absorption. Directly observed in many z~2 quasars. Major galaxy quenching mechanism. |
| Outflows & Feedback | Fermi Bubble Analog | uFermiBubbles | OFF | Quasar-inflated bubbles in circumgalactic medium, analogous to Milky Way's Fermi Bubbles but much larger. Bubble diameter: 50–200 kpc. Color: #5A4A8A (gamma-ray/radio emitting relativistic plasma). Bilateral, perpendicular to host disk. Sharp edges from magnetic draping. Long-lived: visible 10⁸ yr after quasar fades. |
| Host Galaxy | Faint Host Galaxy | uHostGalaxy | ON | Galaxy underlying quasar — detectable only after PSF subtraction of brilliant nucleus. Typically massive elliptical at low-z, disk/irregular at high-z. Color: #D0C090 (old stellar population). Apparent magnitude 2–8 mag fainter than nucleus. Effective radius R_e = 5–20 kpc. Often morphologically disturbed (merger-triggered quasar). Rendered as diffuse fuzz around point source. |
| Host Galaxy | Companion/Merger | uCompanionMerger | OFF | ~30–50% of quasar hosts show signs of recent/ongoing merger. Companion galaxy: #C8B890, separation 10–100 kpc. Tidal tails, bridges, morphological disturbance. Merger may have triggered quasar activity by driving gas to nucleus. Rendered: secondary galaxy with connecting features. |
| Gravitational Lensing | Strong Lensing (Multiple Images) | uStrongLensing | OFF | Foreground galaxy/cluster creates multiple images of background quasar. Einstein ring, double, or quad image configuration. Each image: same color #E0F0FF but different magnification and time delay. Lens galaxy: #D0C0A0 between images. Magnificent example: Einstein Cross (Q2237+0305, quad image around foreground spiral). Rendered: 2–4 quasar images + lens galaxy. |
| Gravitational Lensing | Microlensing Variability | uMicrolensing | OFF | Individual stars in lensing galaxy cause additional magnification fluctuations. Timescale: weeks–months. Amplitude: 0.1–1 magnitude per image. Probes accretion disk structure at micro-arcsecond resolution. Rendered as brightness fluctuation of lensed images, uncorrelated between images. Size of emission region encoded in variability amplitude. |
| Cosmological Context | Redshift Visualization | uRedshiftViz | OFF | Quasar light cosmologically redshifted: z = 0.1–7.5. UV emission shifted through optical to infrared. Color shift visualization: z=0 #D0E0FF → z=2 #F0E8D0 → z=7 #F8E0C0 (Lyα moves from UV through entire visible range to NIR). Spectral features labeled at observed wavelengths. Demonstrates cosmological expansion. |
| Cosmological Context | Cosmic Timeline Indicator | uCosmicTimeline | OFF | Position on cosmic timeline: z=2 corresponds to 10.3 Gyr ago, z=7 to 12.9 Gyr ago. Universe age indicator and lookback time. Rendered as timeline bar showing quasar epoch relative to Big Bang, present day, and major cosmic milestones. Educational: quasars are lighthouses from the young universe. |
| Cosmological Context | Proximity Zone (High-z) | uProximityZone | OFF | For z > 6 quasars: ionized bubble in surrounding neutral intergalactic medium (before/during reionization). Proximity zone radius: 1–10 proper Mpc. Neutral IGM #1A1A2A (Gunn-Peterson absorption — complete Lyα absorption). Ionized zone #3A4A6A (transparent). Shows quasar's role in cosmic reionization. Sphere of influence in dark early universe. |
| Camera | Point Source View | uCameraMode | ON | Default: quasar as brilliant point source with faint host galaxy halo underneath. Distance: 1 Mpc. FOV 30°. Mimics HST/ground-based observation. Diffraction spikes and scattered light from PSF. Host galaxy barely perceptible. Standard "quasar as star-like object" view. |
| Camera | Host Galaxy Revealed | uCameraMode | OFF | Nucleus PSF-subtracted (or dimmed) revealing underlying host galaxy morphology. Shows merger features, tidal tails, companion if present. Nucleus reduced to 1% brightness. Distance: 500 kpc. Reveals the galaxy behind the glare. |
| Camera | Time Speed Multiplier | uTimeSpeed | 30 days/s | 1 real second = 30 days. AGN variability visible (timescale weeks–months). Jet knot motion visible for nearby quasars. Microlensing events evolve. Host galaxy and large-scale structure static at this timescale. |

---

### 9.13 Blazar (BL Lac / FSRQ)

**Entity ID:** ENT-6050
**Base Mesh:** Point source + relativistic jet (nearly on-axis) + host galaxy background
**Shader Type:** Fragment (Doppler-boosted jet + superluminal knots + rapid variability)
**Exemplar:** Markarian 421 (BL Lac, HSP), 3C 279 (FSRQ), BL Lacertae (prototype), PKS 2155-304 (TeV blazar)

Blazars are AGN with a relativistic jet pointed nearly directly at the observer (viewing angle θ < 10°–15°). This geometric alignment causes extreme Doppler boosting (δ ~ 10–50), making the jet emission dominate over all other components. Two subtypes: BL Lac objects (featureless continuum, weak/absent emission lines) and Flat-Spectrum Radio Quasars (FSRQs, strong broad emission lines, more luminous). Blazars show the most extreme variability of any persistent extragalactic source — flux changes of ×10–100 on timescales of minutes to months. Superluminal apparent motion of jet knots is directly observable with VLBI.

| Section | Feature | Uniform Name | Default | Description |
|---------|---------|-------------|---------|-------------|
| Jet Core | Doppler-Boosted Core | uDopplerCore | ON | Unresolved blazar core: dominant emission component. Brightness temperature T_B ~ 10¹¹–10¹³ K (Doppler-boosted synchrotron). Color: #E0E8FF (flat-spectrum, roughly white). Variability: stochastic flickering ±50% on minute timescale (intra-day variability). Renders as intense central point source with fluctuating brightness. Outshines entire host galaxy by ×10–1000. |
| Jet Core | Superluminal Knot Ejection | uSuperluminalKnots | ON | Jet knots with apparent velocity β_app = 2–40c (Lorentz factor Γ ~ 5–50). Rendered: bright condensations #D0D8FF ejected from core along jet axis. Proper motion: 0.1–2 mas/yr. Knot brightness: peaks at ejection then fades downstream. 2–5 knots visible at once. Animation: knots moving faster-than-light along jet (apparent, geometric effect). Dramatic visualization of special relativity. |
| Jet Core | Jet Opening Angle | uJetOpenAngle | ON | Apparent jet width: 1°–5° opening angle (intrinsic ~0.1° multiplied by 1/sin θ projection). Jet length: up to ~100 kpc projected but foreshortened from near-on-axis viewing. Rendered as narrow cone #A0B0D0, alpha 0.15 from core. One-sided: counterjet Doppler-deboosted to invisibility. Brightness ratio jet/counterjet: δ³ ~ 10³–10⁵. |
| Variability | Rapid Optical Flaring | uOpticalFlaring | ON | Optical variability: Δm ~ 1–5 magnitudes on hours-to-weeks timescale. Violent optical flares: brightening by ×10 in hours. Rendered as stochastic brightness modulation with occasional spike events. Color: shifts slightly during flares (bluer-when-brighter for synchrotron). Power spectral density: red noise (P ∝ f^−1.5). IDV (intra-day variability) in BL Lacs. |
| Variability | Gamma-Ray Flaring | uGammaFlare | ON | Fermi LAT detects GeV flares: flux increase ×10–100 over days. Some blazars detected at TeV by Cherenkov telescopes (Mrk 421, PKS 2155-304). Rendered: high-energy glow #C0A0FF overlay on core during flare. Gamma-ray emission zone: < 0.1 pc from BH, within BLR radius. PKS 2155-304 showed minute-timescale TeV variability (causality: R < cΔt ~ 10¹³ cm). |
| Variability | Multi-Wavelength Correlation | uMWLCorrelation | OFF | Radio-optical-X-ray-gamma correlated variability with frequency-dependent time lags. Radio lags optical by weeks-months (emission zone at different jet distances). Rendered: sequential brightening from gamma (instant) → optical (hours) → radio (weeks). Educational: demonstrates jet structure through timing. |
| Polarization | High Optical Polarization | uOpticalPol | ON | Optical polarization: 3–40% (vs. <1% for normal galaxies). Synchrotron origin. Polarization angle: variable, sometimes rotating through 180°+ during flares (EVPA swing). Rendered: polarization vector overlaid on core, length proportional to degree, angle showing PA. Rotation events: PA swings at ~10°/day during major flares. Diagnostic of magnetic field geometry. |
| Polarization | VLBI Jet Polarization | uVLBIPol | OFF | Parsec-scale jet magnetic field structure from VLBI polarimetry. B-field: toroidal/helical in jet (PA perpendicular to jet), longitudinal at shocks (PA parallel). Faraday rotation: RM gradients across jet indicating helical field. Rendered as field line overlays on jet: helical coils #7A8AFF wrapped around jet axis. |
| SED | Synchrotron Peak | uSynchPeak | OFF | First SED bump: synchrotron radiation from relativistic electrons. Peak frequency: IR (LSP/LBL, 10¹³ Hz) → UV/X-ray (HSP/HBL, 10¹⁷ Hz). Visualization: SED curve overlay showing synchrotron hump. HSP blazars (Mrk 421): synchrotron extends to X-ray, hence X-ray bright and variable. LSP (3C 279): synchrotron peaks in IR, weaker in X-ray. |
| SED | Inverse Compton Peak | uICPeak | OFF | Second SED bump: inverse Compton scattering (electrons upscatter photons to gamma-ray). SSC (synchrotron self-Compton): same electrons, same photons. EC (external Compton): BLR/torus seed photons (FSRQs). Peak: GeV-TeV. Compton dominance: L_IC/L_syn ~ 0.3 (HSP) to ~100 (FSRQ). Rendered: second hump on SED overlay, amplitude relative to first. |
| Host Galaxy | Underlying Galaxy | uHostGalaxy | OFF | BL Lac hosts: giant elliptical galaxies (M_R ~ −22 to −24). Difficult to detect beneath blazar glare. Color: #F0D8A0 (old stellar population). De Vaucouleurs profile R^(1/4). Effective radius: 5–15 kpc. FSRQs: host often undetectable due to higher nuclear luminosity. When enabled, renders smooth elliptical at 1–10% core brightness. |
| Host Galaxy | Cluster Environment | uClusterEnv | OFF | Many BL Lacs in galaxy groups/poor clusters. 5–20 companion galaxies within 500 kpc. Renders as scattered elliptical galaxies #F0D8A0 around blazar host. ICM: faint X-ray gas. Environment: over-dense compared to field. FSRQs: typically at higher z, environment less well-characterized. |
| Camera | Standard View | uCameraMode | ON | Default: blazar core dominating frame, jet extending from core. Superluminal knots visible. Host galaxy as faint halo beneath nuclear glare. Scale bar: 10 kpc. Variability animation active. One-sided jet morphology. Distance: annotated in Mpc with redshift. |
| Camera | VLBI Parsec-Scale | uCameraMode | OFF | Zoomed to parsec-scale jet: VLBI resolution. Core + inner jet knots. Scale bar: 1 pc. Superluminal motion clearly visible. Polarization vectors if enabled. Counterjet invisible. Individual knot trajectories trackable. |
| Camera | Time Speed Multiplier | uTimeSpeed | 1 day/s | At default: intra-day variability visible as flickering. Major flares build and decay over seconds. Superluminal knots inch along jet. Month-timescale flux evolution visible over ~30 seconds. Slow to 1 hr/s for minute-timescale TeV variability (PKS 2155-304 type). |

---

### 9.14 Radio Galaxy (FR I / FR II)

**Entity ID:** ENT-6052
**Base Mesh:** Elliptical galaxy + bilateral jets + radio lobes (volumetric)
**Shader Type:** Fragment (synchrotron lobe emission + jet dynamics + hotspot physics)
**Exemplar:** Cygnus A (FR II archetype), Centaurus A (FR I/II hybrid), M87 (FR I), Hercules A (spectacular jets)

Radio galaxies are AGN where the dominant emission at radio wavelengths comes from enormous bipolar jets and lobes extending far beyond the host galaxy — from tens of kiloparsecs to megaparsecs. The Fanaroff-Riley classification divides them by morphology: FR I (edge-darkened, decelerating jets, lower power, P_178MHz < 10²⁵ W/Hz) and FR II (edge-brightened with terminal hotspots, powerful collimated jets, P > 10²⁵ W/Hz). Cygnus A's FR II lobes span 150 kpc with spectacular hotspots; M87's FR I jet is resolved from pc to kpc scales. These are among the largest coherent structures produced by single objects in the universe.

| Section | Feature | Uniform Name | Default | Description |
|---------|---------|-------------|---------|-------------|
| Host Galaxy | Elliptical Host | uEllipticalHost | ON | Giant elliptical galaxy: M_R ~ −22 to −24, effective radius 10–30 kpc. Color: old stellar population #F0D8A0. De Vaucouleurs R^(1/4) profile. Dust lane: 30% of radio galaxies show dust (Centaurus A archetype: prominent dust lane #3A2A1A bisecting galaxy). Stellar mass: 10¹¹–10¹² M☉. Host renders as background beneath jet structure. |
| Host Galaxy | Nuclear Point Source | uNuclearSource | ON | AGN core: unresolved at galaxy scale. Luminosity depends on FR type: FR II nuclei brighter (more aligned to jet). Color: #D0D8FF, point source at galaxy center. Radio core: flat-spectrum synchrotron. May be obscured by dust lane in some orientations. Power source: SMBH mass 10⁸–10¹⁰ M☉. |
| Jets | Inner Jet (kpc-scale) | uInnerJet | ON | Collimated jet from nucleus: FR I — bright near core, fading outward (decelerating). FR II — faint near core, terminating at bright hotspot. Color: synchrotron blue #8AA0D0. Width: 0.1–1 kpc. Length: 5–50 kpc per side. FBM structure: 4-octave, freq 5.0, amplitude 0.1. M87 jet: resolved knots including HST-1 at 60 pc. Bilateral but usually one side brighter (Doppler). |
| Jets | FR I Jet Deceleration | uFRIDeceleration | ON | FR I characteristic: jet decelerates from relativistic (v ~ 0.5c at core) to sub-relativistic (v ~ 0.01c at kpc scale) through entrainment of surrounding gas. Jet widens: opening angle increases from <5° to 20°–30°. Brightness: fades smoothly outward. Renders as flaring, dimming jet. Surface brightness: I ∝ r^(−1.5). 3C 31 archetype. |
| Jets | FR II Jet Collimation | uFRIICollimation | OFF | FR II characteristic: jet remains highly collimated (opening angle < 5°) all the way to hotspot at ~50–300 kpc. Faint between core and hotspot (jet "invisible" in some FR IIs). Brightness: concentrated at core and terminal hotspot. Cygnus A: jet traced by faint continuous emission. Internal Mach number: M ~ 3–10 (supersonic throughout). |
| Lobes | Radio Lobe Morphology | uRadioLobes | ON | Enormous synchrotron-emitting plasma lobes: bilateral, filled with relativistic electrons + magnetic field. FR I: relaxed, diffuse, edge-darkened. FR II: elongated, edge-brightened. Size: 20–500 kpc per side (Cygnus A: 75 kpc per lobe). Color: false-color synchrotron orange-red #FF8A40, alpha 0.1. Magnetic field: 1–10 μG. Energy content: 10⁵⁸–10⁶¹ erg. FBM internal structure: 5-octave, freq 3.0, amplitude 0.2. |
| Lobes | FR II Hotspots | uHotspots | ON | FR II defining feature: bright compact hotspots at lobe termini where jet impacts lobe/ICM. Size: 0.5–5 kpc. Brightness: dominates lobe emission. Color: bright #FFD080 (synchrotron, flat spectrum). Multiple hotspots common (primary + secondary). Particle acceleration to ultra-high energies. Cygnus A: two hotspots per lobe. Standoff: ~10–30 kpc ahead of secondary hotspot. |
| Lobes | Lobe Spectral Aging | uSpectralAging | OFF | Synchrotron electrons lose energy: higher frequency emission fades first. Spectral index steepens from hotspot (α ~ 0.5) to lobe interior (α ~ 1.0–2.0). Rendered as color gradient: hotspot #FFD080 (flat) → mid-lobe #FF8A40 → back-flow #C06030 (steep, reddened). Break frequency maps lobe age: t ~ 10⁷–10⁸ yr. Diagnostic of lobe dynamics and expansion history. |
| Lobes | Lobe-ICM Interaction | uLobeICM | OFF | Radio lobes displacing intracluster medium: X-ray cavities visible in cluster gas. Cavity boundaries: sharp. Cavity enthalpy: 10⁵⁸–10⁶² erg (dominates cluster energy budget). Rendered: X-ray false-color #5A7ABA showing dark cavities coincident with radio lobes. AGN feedback: this energy heats ICM, preventing cooling flow. MS 0735: most energetic known cavities. |
| Environment | X-ray Atmosphere | uXrayAtmosphere | OFF | Hot gaseous atmosphere around host galaxy: T ~ 10⁷ K, kT ~ 0.5–2 keV. Luminosity: 10⁴¹–10⁴³ erg/s. Rendered: diffuse #5A7AAA, alpha 0.05, β-model profile. Radio lobe cavities punch through this atmosphere. Cygnus A: cocoon shock visible in X-rays at lobe boundary. Ram pressure confines lobes in some cases. |
| Environment | Companion Radio Tails | uRadioTails | OFF | Head-tail morphology: galaxy moving through ICM bends radio lobes backward (narrow-angle tail NAT, or wide-angle tail WAT). Renders as swept-back lobe structure. WAT: 3C 75 shows two interacting radio galaxies. NAT: IC 310. Diagnostic of galaxy velocity and ICM density. Tail length: up to ~1 Mpc. |
| Scale | Total Linear Size | uTotalSize | ON | End-to-end size annotation: 50 kpc to >4 Mpc (giant radio galaxies: Alcyoneus at 4.99 Mpc largest known). Scale bar rendered at bottom. Comparison: lobe extent vs. host galaxy (typically lobes 10–100× larger than host). Among largest structures produced by single objects in the universe. |
| Camera | Standard View | uCameraMode | ON | Default: full lobe-to-lobe extent visible. Host galaxy as central bright elliptical. Jets and lobes bilateral. Scale bar: 100 kpc. False-color: radio (orange/red) overlaid on optical (blue/white host galaxy). Classic radio galaxy composite image style. |
| Camera | Jet Detail View | uCameraMode | OFF | Zoomed to inner 10 kpc: resolved jet structure, knots, jet-counterjet asymmetry. M87 jet perspective. HST-1 knot and helical structure visible. Scale bar: 1 kpc. Optical synchrotron blue #8AA0D0 against elliptical background. |
| Camera | Time Speed Multiplier | uTimeSpeed | 10⁶ yr/s | At default: lobe expansion (10⁷–10⁸ yr) visible over 10–100 seconds. Hotspot advance at ~0.01c visible. Jet knot proper motion (if nearby). Spectral aging gradient develops. Slow to 10⁴ yr/s for jet variability and knot ejection. |

---

### 9.15 Jellyfish Galaxy

**Entity ID:** ENT-6054
**Base Mesh:** Disk galaxy + trailing gas/star tails (volumetric + particle)
**Shader Type:** Fragment (ram-pressure stripping + tail star formation + ICM interaction)
**Exemplar:** ESO 137-001 (Norma cluster), JO206, JW100, D100 (Coma cluster)

Jellyfish galaxies are disk galaxies undergoing extreme ram-pressure stripping (RPS) as they plunge through the hot intracluster medium (ICM) of a galaxy cluster at 1000–3000 km/s. The ICM wind strips gas from the galaxy, creating spectacular multi-wavelength tails extending 50–150 kpc behind the galaxy — far longer than the galaxy disk itself. JWST, HST, and MUSE observations reveal that star formation continues in the stripped tail gas, producing "orphan" star-forming knots and young stellar streams with no parent galaxy disk. The GASP survey has cataloged and studied dozens of these objects.

| Section | Feature | Uniform Name | Default | Description |
|---------|---------|-------------|---------|-------------|
| Galaxy Disk | Surviving Disk | uSurvivingDisk | ON | Disk galaxy partially stripped: outer gas removed, inner gas surviving within truncation radius R_strip ~ 5–15 kpc (depending on stripping stage). Stellar disk intact (stars not stripped). Color: inner disk #F0D8A0 + blue spiral arms #8AB0D8 (continuing star formation). Disk inclination: random, but most dramatic when viewed edge-on to stripping direction. |
| Galaxy Disk | Stripping Truncation | uStrippingTruncation | ON | Sharp gas truncation radius: inside R_strip, normal ISM; outside, gas removed. Gunn & Gott criterion: ρ_ICM × v² > 2πGΣ_star × Σ_gas. Rendered as sharp edge where blue (gas-rich) disk transitions to red (gas-free) stellar disk. Inner galaxy may show enhanced SF from gas compression (jellyfish galaxies have elevated central SFR). |
| Galaxy Disk | Central AGN Triggering | uCentralAGN | OFF | Ram pressure funnels gas toward galaxy center, triggering AGN activity. ~50% of jellyfish galaxies host AGN (GASP survey). Nuclear point source: #D0D8FF. Seyfert-type. AGN feedback + RPS: dual gas removal mechanism. AGN ionization cones may extend into stripped tail. JO206: spectacular AGN + stripping combination. |
| Stripped Tail | Main Gas Tail | uGasTail | ON | THE defining visual: stripped ISM trailing behind galaxy. Length: 50–150 kpc (ESO 137-001: ~80 kpc tail). Width: 10–30 kpc. Multi-phase: hot (X-ray #5A7AAA), warm (Hα #FF5540), cold (CO/HI #4A8A6A). Hα tail: filamentary, clumpy. FBM structure: 6-octave, freq 4.0, amplitude 0.3. Tail direction: opposite to galaxy motion through ICM. Alpha: 0.15 fading to 0.02 at tail end. |
| Stripped Tail | Tail Star Formation Knots | uTailSFKnots | ON | Star formation in stripped tail gas: "fireball" knots. 10–50 knots per tail. Size: 0.5–2 kpc each. Color: blue young stars #6AA0D0 + Hα #FF5050 emission. SFR per knot: 10⁻³–10⁻¹ M☉/yr. Some knots forming dwarf galaxy-mass stellar systems. These stars are born outside any galaxy — orphan populations. MUSE spectroscopy confirms in-situ formation. |
| Stripped Tail | Tail Magnetic Field Draping | uTailBField | OFF | ICM magnetic field drapes around galaxy and threads through tail. B ~ 1–10 μG in tail (compressed from ~1 μG ICM). Field lines: aligned along tail direction. Polarized synchrotron emission: radio tails detected. Rendered as streamlines #7A8AFF along tail. Magnetic tension helps confine tail gas, preventing rapid mixing with ICM. |
| Stripped Tail | Tail X-ray Emission | uTailXray | OFF | Hot phase of stripped gas: T ~ 10⁶–10⁷ K. Chandra imaging: X-ray tails in ESO 137-001, D100. Two tails in ESO 137-001 (main + secondary). Color: #5A7AAA false-color. Mixing of cool stripped ISM with hot ICM creates intermediate-temperature gas. X-ray luminosity of tail: 10⁴⁰–10⁴¹ erg/s. Thermal conduction at ICM-tail interface. |
| Stripped Tail | Molecular Gas Filaments | uMolecularFilaments | OFF | ALMA CO observations: cold molecular gas survives in tail for ~10⁸ yr. Filamentary: narrow (0.5–1 kpc wide) threads within broader warm tail. Color: #4A8A6A false-color. Molecular mass in tail: 10⁸–10⁹ M☉. CO clumps coincide with Hα knots — star formation sites. Gas survives by magnetic confinement and insufficient mixing time. |
| ICM Interaction | Bow Shock | uBowShock | ON | Galaxy plunging supersonically through ICM: Mach 1–3. Bow shock ahead of galaxy: standoff distance R_s ~ 10–20 kpc. Shock-heated ICM: T jumps ×3–5 at shock front. Rendered: faint compressed zone #7A90B0, alpha 0.05 ahead of galaxy leading edge. Detectable in X-rays for high-Mach objects. Shock geometry: parabolic, wrapping around disk. |
| ICM Interaction | ICM Wind Visualization | uICMWind | ON | False-color rendering of ICM flow around galaxy: streamlines showing wind sweeping past disk and continuing behind as turbulent wake. Wind speed: 1000–3000 km/s. Color: #4A6A8A streamlines, alpha 0.03. Kelvin-Helmholtz instabilities at disk-ICM interface: wavy perturbations on disk edge. Viscous stripping vs. thermal evaporation operating simultaneously. |
| ICM Interaction | Mixing Layer | uMixingLayer | OFF | Interface between stripped ISM and ICM: turbulent mixing layer. T ~ 10⁵–10⁶ K (intermediate). Width: 1–5 kpc. UV/optical emission lines: mixing diagnostics. Rendered as turbulent boundary #8A8ACC, alpha 0.08 between tail and ICM. Kelvin-Helmholtz roll-ups visible at boundary. This layer mediates mass transfer between tail and ICM. |
| Evolution | Stripping Stage | uStrippingStage | ON | Toggle through stripping phases: (1) Initial — outer HI stripping begins, disk appears normal. (2) Active — dramatic tail, truncated disk, enhanced central SF. (3) Post-stripping — tail detached, galaxy is "red and dead" S0/E. JW100 stage 2, D100 stage 2-3. Stage determines visual appearance and tail prominence. Full stripping: ~0.5–1 Gyr. |
| Evolution | Unwinding Spiral Arms | uUnwindingArms | OFF | Ram pressure can unwind and distort spiral arms on the leading side. Leading arm compressed, trailing arm extended. Asymmetry: leading vs. trailing brightness ratio ~2–5. Spiral pattern disruption visible as one arm truncated while other stretches into tail. NGC 4522: classic half-stripped Virgo spiral. |
| Environment | Cluster Context | uClusterContext | OFF | Galaxy cluster environment: 5–20 nearby cluster members visible. ICM: diffuse #5A7AAA. Galaxy falls from cluster outskirts toward center — stripping intensifies at pericenter passage. Clustercentric radius determines stripping intensity. Multiple jellyfish galaxies possible in same cluster (GASP finds 5–15% of cluster spirals are stripping). |
| Camera | Standard View | uCameraMode | ON | Default: galaxy + full tail visible. Hα (red) + stellar (blue/white) composite. Tail streaming behind galaxy. Star-forming knots dotting tail. Scale bar: 50 kpc. ICM flow direction indicated. Most dramatic at 30°–60° angle to stripping direction. |
| Camera | Multi-Wavelength | uCameraMode | OFF | Side-by-side or overlay: optical (stars), Hα (warm gas), X-ray (hot gas), CO (cold gas). Shows different tail components at different wavelengths. Each phase reveals different physical processes. ESO 137-001 composite: classic demonstration. |
| Camera | Time Speed Multiplier | uTimeSpeed | 10⁷ yr/s | At default: full stripping sequence (~10⁹ yr) plays over ~100 seconds. Tail elongation and SF knot formation visible. Galaxy transformation from blue spiral to red S0 over stripping duration. Slow to 10⁵ yr/s for tail dynamics and knot evolution. |

---

### 9.16 Ultra-Diffuse Galaxy (UDG)

**Entity ID:** ENT-6056
**Base Mesh:** Diffuse elliptical/irregular halo (very low surface brightness)
**Shader Type:** Fragment (extremely low SB rendering + resolved globular clusters + DM halo inference)
**Exemplar:** Dragonfly 44 (Coma), DF2/DF4 (lacking DM), VCC 1287, Nube (ultra-diffuse)

Ultra-diffuse galaxies have the stellar mass of a dwarf galaxy (10⁷–10⁹ M☉) but the physical size of a Milky Way-type galaxy (effective radius R_e = 1.5–10 kpc). Their central surface brightness is extraordinarily low: μ₀ > 24 mag/arcsec² (100–1000× fainter than normal galaxies). Discovered in large numbers by the Dragonfly Telephoto Array and confirmed by HST. UDGs challenge galaxy formation models: some (Dragonfly 44) have dark matter halos as massive as the Milky Way's (M_halo ~ 10¹² M☉), while others (NGC 1052-DF2, DF4) appear to lack dark matter entirely. They span the extremes of the mass-to-light ratio distribution.

| Section | Feature | Uniform Name | Default | Description |
|---------|---------|-------------|---------|-------------|
| Stellar Body | Diffuse Stellar Halo | uDiffuseHalo | ON | Extremely low surface brightness: μ₀,g ~ 24–28 mag/arcsec². Color: old stellar population #F0D8A0 (red sequence) or blue #B0C8D8 (field UDGs with young stars). Sérsic profile: n ~ 0.5–1.0 (exponential-like). R_e: 1.5–10 kpc. Rendered with very low alpha: 0.01–0.05 maximum. Barely visible against dark sky — defines the "ultra-diffuse" character. Smooth, featureless appearance. |
| Stellar Body | Tidal Distortion | uTidalDistortion | OFF | Some UDGs show tidal features from cluster environment: elongation toward cluster center, tidal tails. Rendered as asymmetric stellar distribution: axis ratio b/a < 0.6 with faint extensions #F0D8A0, alpha 0.005. Tidal stripping may be how some UDGs formed: puffed-up dwarfs losing mass. S-shaped tidal distortion if undergoing disruption. |
| Globular Clusters | GC Population | uGlobularClusters | ON | KEY DIAGNOSTIC: GC systems reveal total halo mass. Dragonfly 44: ~100 GCs (implying massive DM halo). DF2/DF4: ~20 GCs (anomalously few for their luminosity). Rendered as individually resolved point sources #F0E0C0 scattered through halo. GC luminosity function: Gaussian, peak at M_V ~ −7.5. GC specific frequency S_N: 5–100 (extremely high for some UDGs). |
| Globular Clusters | GC Luminous Fraction | uGCLuminousFraction | OFF | In DF2/DF4: GCs are anomalously luminous (peak at M_V ~ −9, 2 mag brighter than normal). This led to the controversial DM-free interpretation. Rendered: GCs visibly brighter than typical, color #FFE8C0. DF2 GCs may be ultra-compact dwarfs rather than normal GCs. Alternative: wrong distance estimate would change GC luminosities. |
| Dark Matter | DM Halo Visualization | uDMHalo | OFF | Inferred dark matter halo: wireframe or density contour rendering. Dragonfly 44: M_halo ~ 10¹² M☉, M/L ~ 50 (DM-dominated). DF2/DF4: M/L ~ 1–3 (little to no DM). Rendered as blue #4A6ACC wireframe contours showing total gravitating mass extent. Virial radius: 100–300 kpc for massive halos. DM fraction: 0% (DF2) to 99.99% (Dragonfly 44). |
| Dark Matter | DM-Free Toggle | uDMFreeMode | OFF | Special mode for DF2/DF4-type galaxies: no DM halo. GC velocity dispersion: σ ~ 8 km/s (vs. ~50 km/s expected for DM-normal). Galaxy appears identical visually but kinematically different. Annotation: mass budget showing stellar mass ≈ total mass. Formation: possibly tidal dwarf origin (from galaxy interaction debris). |
| Environment | Cluster Membership | uClusterMembership | ON | Most UDGs found in galaxy clusters (Coma, Virgo, Fornax). Clustercentric distance: 0.1–1.0 R_virial. Rendered: 3–5 nearby bright cluster members as context. UDG positioned in cluster outskirts. ICM: faint #5A7AAA context. Formation scenarios: failed galaxies (early quenching), puffed-up dwarfs (tidal heating), or high-spin halos. |
| Environment | Field UDG Variant | uFieldUDG | OFF | Some UDGs found in isolation (field). These tend to be bluer (ongoing star formation), gas-rich (HI detected). Color: #B0C8D8 (blue, younger). HI gas: #4A8A6A overlay showing extended gas disk. Nube: extreme example (R_e ~ 6.9 kpc, virtually invisible). Formation: high angular momentum halo + low star formation efficiency. |
| Properties | Surface Brightness Profile | uSBProfile | OFF | Sérsic profile visualization: log I vs. R^(1/n) plot overlay. μ₀ = 24–28 mag/arcsec² at center. Comparison with normal galaxies shown: UDG profile identical shape but shifted 3–5 mag fainter. Educational: demonstrates that UDGs are not just distance artifacts but intrinsically diffuse. Isophote contours rendered on galaxy. |
| Camera | Standard View | uCameraMode | ON | Default: UDG centered, extremely faint against dark background. GCs as brightest features (individually resolved). Scale bar: 5 kpc. Surface brightness so low that galaxy nearly invisible — GC system defines the object. Background sky: enhanced contrast to reveal diffuse light. |
| Camera | Deep Imaging View | uCameraMode | OFF | Enhanced contrast: surface brightness stretched to reveal full extent. Tidal features and outer halo visible. Mimics deep Dragonfly/HST imaging. Background galaxies visible through UDG (it's that transparent). Demonstrates observational challenge of UDG detection. |
| Camera | Time Speed Multiplier | uTimeSpeed | 10⁸ yr/s | UDGs are essentially static. No internal dynamics visible at human timescales. At default: orbital motion around cluster center (period ~Gyr) visible. Tidal evolution over Gyr timescale. Minimal variability — appropriate for these quiescent objects. |

---

### 9.17 Compact Elliptical Galaxy (cE)

**Entity ID:** ENT-6058
**Base Mesh:** Small compact ellipsoid (high surface brightness)
**Shader Type:** Fragment (high-SB old population + tidal truncation + nuclear star cluster)
**Exemplar:** M32 (prototype, Andromeda satellite), NGC 4486B (M87 companion), A496cE

Compact elliptical galaxies are the opposite extreme from UDGs: small (R_e ~ 0.1–1 kpc) but with high surface brightness (μ_e ~ 18–22 mag/arcsec²). Stellar mass: 10⁸–10¹⁰ M☉. M32 (companion to Andromeda) is the prototype. These galaxies are thought to be remnant cores of once-larger galaxies, tidally stripped by a massive neighbor. Their compact size and high stellar density make them observationally distinct from both normal dwarf ellipticals and giant ellipticals. They contain old stellar populations, sometimes with a nuclear star cluster, and show evidence of their stripping history through tidal truncation.

| Section | Feature | Uniform Name | Default | Description |
|---------|---------|-------------|---------|-------------|
| Stellar Body | Compact High-SB Core | uCompactCore | ON | High surface brightness: μ_e ~ 18–21 mag/arcsec² (10–100× brighter than dwarf ellipticals of same mass). Color: old metal-rich population #F0D090 (redder than typical dwarfs due to higher metallicity). Sérsic profile: n ~ 2–4 (concentrated). R_e: 0.1–1 kpc. Sharp outer truncation from tidal stripping. Rendered at high brightness — visually dense and compact. |
| Stellar Body | Nuclear Star Cluster | uNSC | ON | Dense stellar nucleus at galaxy center: R ~ 5–20 pc, M ~ 10⁶–10⁸ M☉. Color: #FFE0A0 (brightest pixel). M32 nucleus: among densest stellar systems known. Possibly former nuclear star cluster of progenitor galaxy. May contain intermediate-mass black hole (IMBH, M ~ 10³–10⁵ M☉). Surface brightness: μ ~ 12–14 mag/arcsec² (extremely bright). |
| Stellar Body | Tidal Truncation Edge | uTidalTruncation | ON | Defining feature: abrupt stellar density drop at tidal radius. R_tidal ~ 0.5–3 kpc. Density drops by ×10 over <0.5 kpc — much sharper than normal elliptical profiles. Rendered as clear outer boundary: stellar light #F0D090 dropping to near-zero. M32: truncation at ~1 kpc obvious in deep imaging. Evidence of stripping origin. |
| Stellar Population | Old Metal-Rich Stars | uOldMetalRich | ON | Dominant population: age 5–10 Gyr, [Fe/H] ~ −0.2 to +0.2 (near-solar to super-solar). Higher metallicity than dwarf ellipticals of same mass — signature of more massive progenitor. Color: warm #F0D090. CMD: prominent red giant branch at M_I ~ −4. Intermediate-age AGB stars present in M32 (2–5 Gyr component). |
| Stellar Population | Residual Young Stars | uResidualYoung | OFF | M32 contains ~2–5 Gyr intermediate-age population in nucleus (unusual for elliptical). Blue stragglers or genuine young stars. Color contribution: subtle #B8C0D0 tint in nuclear region. SFR: ~0 currently but was active until ~2 Gyr ago. May relate to gas inflow during final stripping epoch. |
| Progenitor | Tidal Stream Remnants | uTidalStream | OFF | Faint tidal debris from stripping: stellar stream connecting cE to massive neighbor. M32: possible tidal stream extending ~10 kpc toward M31. Color: #F0D090, alpha 0.01 (extremely faint). Stream mass: 10⁷–10⁸ M☉. Diagnostic of stripping history and orbital dynamics. Detection requires deep surface photometry. |
| Progenitor | Progenitor Size Indicator | uProgenitorSize | OFF | Educational: wireframe showing estimated size of pre-stripping progenitor galaxy. M32 progenitor: possibly R_e ~ 5–10 kpc, M★ ~ 10¹⁰ M☉ (normal elliptical, now stripped to 3×10⁹ M☉). Wireframe #8A8AAA, dashed outline surrounding current compact body. Shows how much mass was lost. |
| Environment | Massive Neighbor | uMassiveNeighbor | ON | Companion giant galaxy responsible for tidal stripping. M32 → M31, NGC 4486B → M87. Rendered as massive galaxy at separation 5–50 kpc. Tidal field: Roche lobe boundary shown as wireframe #6A6AAA. cE orbits within massive neighbor's tidal influence. Current projected separation and velocity annotated. |
| Camera | Standard View | uCameraMode | ON | Default: cE centered, compact bright body. Tidal truncation edge visible. NSC as bright central point. Massive neighbor visible at edge of frame. Scale bar: 1 kpc. High surface brightness makes this easy to observe despite small size. |
| Camera | Context View | uCameraMode | OFF | Wide field: cE shown as tiny satellite of massive host galaxy. M32 next to Andromeda: demonstrates size contrast. Scale bar: 10 kpc. cE as small dense speck against giant neighbor's diffuse halo. |
| Camera | Time Speed Multiplier | uTimeSpeed | 10⁸ yr/s | cE orbit around host: period ~0.5–2 Gyr. At default speed, orbital motion visible. Tidal stripping ongoing but slow. Essentially static on human timescales. Deep potential well: internal dynamics (stellar orbits) much faster than orbital timescale. |

---

## 10. Small Bodies

Small bodies populate the solar system in vast numbers. Asteroids are rocky/metallic leftovers from planet formation in the inner solar system; comets are icy bodies that develop dramatic comae and tails when heated by the Sun; dwarf planets (like Pluto) are large enough to be round but have not cleared their orbital neighborhoods.

### Asteroid (C/S/M-type)

**Entity ID:** ENT-4010
**Description:** Irregular small solar system body with diverse mineralogy (carbonaceous, silicaceous, metallic types), cratered surface, regolith, axial rotation, and possible binary companion. Colors range #0F0F0E (C-type) to #8A7A6A (M-type) to #6A5A4A (S-type). Real exemplars: Itokawa, Bennu, Psyche, Apophis.

**Section Count:** 9 (Irregular Shape & Topography, Surface Regolith & Composition, Craters & Impact Features, Boulder Fields, Axial Rotation & YORP, Thermal Variation, Binary Companion (Optional), Orbital Context, Camera)
**Total Feature Count:** 25

#### Irregular Shape & Topography (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Shape | Non-Spherical Lumpy Geometry | uLumpyShape | ON | Irregular shape via displaced sphere (icosphere with vertex displacement ~0.3-0.5 radius perturbation). Generated using 3-4 octave FBM (freq 8.0 spatial, amplitude 0.4). Represents natural asteroid shape without spherical symmetry. Shader: displacement in vertex shader using sampled noise. Fundamental shape feature. |
| Shape | Large Impact Basins | uImpactBasins | ON | Major topographic depressions from giant impacts, deep concave regions. Rendered via large-scale (~20° latitude) concave depressions in geometry, amplified noise (6-octave FBM, freq 5.0, amplitude 0.35). Color darkening in basins (#2A2520 dark) vs ridges (#5A5045 bright). Shader: curvature-dependent darkening. Multiple basin features. |
| Shape | Ridge & Mountain Features | uMountains | ON | Linear ridges ~1-5 km height (scaled to asteroid size), running across surface. Rendered via elongated displacement bumps (2-octave Perlin, freq 3.0 along longitude, freq 0.5 latitude, amplitude 0.20). Create dramatic topographic complexity. Shader: heightmap-based shading. Multiple ridges. |
| Shape | Regolith Surface Roughness | uRoughness | ON | Fine-scale surface roughness from millimeter-to-meter scale regolith. Rendered via very high-frequency displacement (10-octave FBM, freq 50.0, amplitude 0.05) applied last. Creates micro-bumpy appearance. Shader: high-frequency normal map sampled during fragment shading. Adds surface detail. |

#### Surface Regolith & Composition (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Regolith | C-Type Carbonaceous Dark Surface | uCTypeCarb | ON | For carbonaceous asteroids, base color #0F0F0E very dark brown-gray, albedo ~0.06 (very dark). Represents organic-rich carbonaceous chondrite composition. FBM 5-octave (freq 25.0, amplitude 0.08) for subtle mottling. Shader: dark base color, minimal reflectivity. Bennu, Ryugu example. |
| Regolith | S-Type Silicaceous Medium Tone | uSTypePhot | ON | For silicaceous asteroids, base color #6A5A4A tan-brown, albedo ~0.20. Represents olivine-rich composition. FBM 4-octave (freq 20.0, amplitude 0.07). Shader: standard Lambertian shading. Itokawa example. |
| Regolith | M-Type Metallic Bright Surface | uMTypeMetal | ON | For metallic asteroids, base color #8A7A6A pale tan to bright gray, albedo ~0.30-0.40 (bright). Represents iron-nickel composition. FBM 3-octave (freq 15.0, amplitude 0.06). Shader: elevated reflectivity, specular highlights. Psyche example (speculative exoplanet analog). |
| Regolith | Regolith Particle Size Variation | uRegolithGrain | ON | Regolith grain size varies with location (compacted regions finer, freshly-ejected coarser). Represented via spatially-varying noise frequency (blend of 3-octave and 8-octave FBM, weights modulated by separate 2-octave noise). Shader: dynamic frequency switching based on location. Subtle geological effect. |

#### Craters & Impact Features (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Craters | Large Impact Craters (Primary Craters) | uLargeCraters | ON | Major craters ~0.5-2 km diameter (scaled to asteroid size ~100-1000 m). Rendered as deep circular/elliptical depressions with central peaks, bright ejecta blanket. Crater: dark #2A2015 interior, bright #6A5A45 rim/ejecta. FBM 7-octave (freq 40.0, amplitude 0.12) for rim roughness. Shader: depression geometry + ejecta layer overlay. Multiple large craters. |
| Craters | Small Impact Pits (Secondary Craters) | uSmallCraters | ON | Abundant smaller craters ~10-100 m diameter, sparse coverage (~20-30% of surface). Rendered via high-frequency Worley noise (freq 150.0) thresholded to pit-like shapes, amplitude 0.08. Shader: Worley-based pit rendering with depth gradient. Adds surface detail. |
| Craters | Fresh Ejecta Rays | uEjectaRays | ON | Bright ray-like streaks radiating from young craters, representing fresh impact ejecta. Color: bright #7A6A55 much lighter than surroundings. Sparse linear features extending 1-5× crater radius. FBM 1D along ray direction (freq 60.0, amplitude 0.06). Shader: sparse additive rays, fading with distance. Highlights young impacts. |
| Craters | Erosion & Space Weathering Darkening | uSpaceWeathering | ON | Cosmic ray exposure darkens fresh ejecta over time (~10^8 years), creating age gradient. Represented by FBM-modulated darkening overlay (freq 20.0, amplitude 0.10), darker in old regions, lighter in fresh ejecta. Shader: additive darkening layer. Shows geological history. |

#### Boulder Fields (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Boulders | Surface Boulder Distribution | uBoulderField | ON | Large boulders (~10-100 m scale) scattered across surface, from impact fragmentation and landslides. Rendered via sparse Voronoi clusters (freq 80.0, amplitude 0.15, ~15% coverage) with shadowing via curvature-dependent darkening. Each boulder represented as bright spot (#5A5045) with dark shadow edge (#2A2020). Shader: Voronoi-based boulder placement + shadow gradient. Creates rough terrain appearance. |
| Boulders | Boulder-Induced Shadows & Texture | uBoulderShadow | ON | Shadows cast by boulders enhance relief perception. Rendered via secondary shadow layer: stochastic sparse dark patches (#1A1510) positioned offset downhill from bright spots (to simulate sun position). Alpha 0.20-0.30. Shader: additive shadow overlay, low opacity. Enhances 3D appearance. |

#### Axial Rotation & YORP (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Rotation | Spin State & Tumble Mode | uRotationState | ON | Most asteroids spin steadily (rotation period 2-24 hours typical), some tumble chaotically. Rendered via animated rotation: steady spin mode applies constant angular velocity ~0.001 rad/s (12 hour period, tunable). Tumble mode: apply multiple angular velocities simultaneously (e.g., 0.001 rad/s + 0.0005 rad/s orthogonal, creating complex precession). Shader: world-space rotation matrix applied per frame. |
| Rotation | YORP Effect (Spin-up/Down) | uYORPEffect | ON | Yarkovsky-O'Keefe-Radzievskii-Paddack (YORP) effect from asymmetric thermal emission causes gradual spin-up or spin-down (timescale ~10^6 years). Rendered as slow angular velocity change: apply time-dependent rotation rate scaling (rate increases/decreases over animation duration ~5-10 seconds to represent 10^6 year timescale, scaled). Shader: modulate rotation matrix angular velocity by scaled time. Shows long-term dynamical evolution. |

#### Thermal Variation (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Thermal | Day-Side Heating | uDaySideHeat | ON | Solar-facing side heated to ~350-500 K (asteroid temperatures), represented by warm orange-red tint #FF7050 at low alpha 0.10-0.15, concentrated on illuminated hemisphere. Shader: additive thermal tint, weighted by dot(normal, sunDirection). |
| Thermal | Night-Side Radiative Cooling | uNightSideCool | ON | Night-side cools rapidly (no atmosphere), temperature drops to ~150-200 K (extreme cold). Represented by slight blue-tinted color shift #4A6F8F at alpha 0.08. Shader: color-dependent on illumination angle, bluish tint on dark side. |

#### Binary Companion (Optional) (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Binary | Secondary Asteroid Companion | uBinaryCompanion | OFF | Some asteroids have binary companions (e.g., Didymos/Dimorphos, Apophis/secondary candidate). Rendered as second smaller sphere orbiting primary at ~0.1-1 Rp distance (primary radius Rp), with orbital period ~12-100 hours. Shader: second sphere geometry, same material as primary, orbital animation. Off by default (optional feature for specific asteroids). |
| Binary | Mutual Tidal Heating | uMutualTidal | OFF | Close binary asteroids tidally heat each other, causing thermal glow. Represented by warm tint (#FF5050, alpha 0.08) on surfaces facing companion. Shader: directional glow toward companion position. Off by default. |

#### Orbital Context (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Orbit | Orbital Ellipse Visualization | uOrbit | ON | Render thin yellow #FFD700 elliptical orbit line showing asteroid's heliocentric path. Semi-major axis ~1-3 AU (scaled for visibility). Shader: parametric ellipse curve rendering. Reference frame. |
| Orbit | Impact Probability (Hazardous Asteroids) | uImpactRisk | OFF | For near-Earth asteroids (NEAs), optional overlay showing impact probability as text/percentage or risk color gradient (red for high risk). Off by default (informational). |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Close-Up Surface Detail View | uCameraMode | ON | Default camera positioned at 1.5× asteroid radius, close enough to see crater and boulder detail. FOV 45°. Locked to asteroid surface, slowly rotating to show all sides. Shows topographic complexity. |
| Camera | Tumbling Rotation View | uCameraMode | OFF | If tumble-mode spin activated, camera fixed in inertial frame, watching asteroid tumble. Shows complex multi-axis rotation. Distance 2× radius, FOV 50°. |
| Camera | Orbital Context Zoom-Out | uCameraMode | OFF | Zoomed-out view showing asteroid in orbit, Sun position visible (bright yellow sphere), orbital ellipse overlay. Shows asteroid as tiny speck in solar system context. |

---

### Comet

**Entity ID:** ENT-4020
**Description:** Icy small body with active volatile outgassing, dirty snowball nucleus, prominent gas coma and dust tail, ion tail, hydrogen envelope, and dramatic brightest-around-perihelion behavior. Nucleus color #1A1308 very dark, coma/tail colors #F5E6D3 (dust) to #4A8FC8 (ion). Real exemplars: 67P/Churyumov-Gerasimenko, Halley, C/2020 F3 NEOWISE.

**Section Count:** 9 (Nucleus Core, Outgassing Jets, Coma Envelope, Dust Tail, Ion Tail, Hydrogen Envelope, Fragmentation Events, Orbital Trajectory, Camera)
**Total Feature Count:** 27

#### Nucleus Core (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Nucleus | Dirty Snowball Nucleus | uNucleus | ON | Solid icy core composed of water, methane, ammonia ices mixed with dust (albedo ~0.04, very dark). Shape: irregular elongated ellipsoid. Color: #1A1308 charcoal black, FBM 5-octave (freq 15.0, amplitude 0.20) for rough surface texture. Size scale: 1-10 km typical. Shader: dark Lambertian surface. Real Rosetta observations (67P shape). |
| Nucleus | Surface Ice Deposits | uIceDeposits | ON | Bright water-ice patches on nucleus surface exposed by sublimation and erosion. Color: pale blue-white #D0C8B8. Sparse Voronoi clusters (freq 60.0, amplitude 0.08, ~20% coverage). Located preferentially on pole-facing regions (due to insolation variation). Shader: additive bright spots over dark nucleus. |
| Nucleus | Jet Outgassing Sources | uJetSources | ON | Localized active regions where jets emanate, marked by brightest surface areas #6A5A4F (brighter than dark nucleus). Sparse point distribution (Worley freq 100.0, ~5-8 points). Position: fixed on nucleus (corotating). Shader: bright spot overlay, used as jet origins. Defines outgassing pattern. |
| Nucleus | Impact Craters & Surface Roughness | uNucleusCraters | ON | Ancient craters from long history (could be billions of years old), small-scale roughness from sublimation erosion. Rendered via 6-octave FBM (freq 30.0, amplitude 0.15) for fine texture. Craters: dark #0A0505 interior. Shader: curvature-dependent darkening for crater relief. Adds surface complexity. |

#### Outgassing Jets (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Jets | Active Sublimation Jets | uActiveJets | ON | Narrow jets of vaporized ice/dust ejecting from nucleus at ~300-1000 m/s, emanating from fixed nucleus locations (jet sources). Color: white-gray #C8C0B0, narrow cone geometry with opening angle ~10-20°. FBM 2D along jet axis (freq 50.0, amplitude 0.10) creates turbulence/wiggle. Shader: cone geometry with additive blending, fading outward. Multiple jets active. |
| Jets | Jet Brightness Variation (Activity Cycle) | uJetActivity | ON | Comet activity varies with heliocentric distance (strongest near perihelion). Represented by time-modulated jet brightness: brightness ∝ inverse-square distance to Sun (or distance-dependent parameter). Jets fade as comet recedes from Sun. Shader: multiplicative brightness scaling based on orbital phase. Shows seasonal outgassing variation. |
| Jets | Jet Fragmentation & Plumes | uJetPlumes | ON | Jets fragment and expand into plumes as they leave nucleus, creating mushroom-cloud-like structures. Rendered via jets that widen and become more sparse (Voronoi opacity fade-out, freq 80.0, amplitude 0.12) at increasing distance from nucleus. Shader: variable-width cone with decreasing opacity along length. |

#### Coma Envelope (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Coma | Gas Coma Halo | uGasComa | ON | Coma: rarefied gas envelope (primarily H2O + CO2 + CN), surrounds nucleus. Radius: ~10,000-1,000,000 km depending on activity (scale adjustable). Color: pale tan-white #E8D8C0 with greenish tint #9FBF9F (from CN radical). Rendered as large semi-transparent sphere (alpha 0.25-0.40) with FBM 4-octave (freq 12.0, amplitude 0.12). Shader: spherical halo with radial gradient falloff. Dominates visual size. |
| Coma | Dust Scattering in Coma | uDustScatter | ON | Dust particles in coma scatter sunlight, creating extended bright appearance. Color: yellowish #E0D4A0 (dust reflection). FBM 5-octave (freq 20.0, amplitude 0.14) creates clumpy appearance. Alpha 0.30-0.45. Shader: cloud-like texture blended over gas coma. Dust-dominated appearance. |
| Coma | Coma Radiance Temperature | uComaRadiance | ON | Coma glows faintly from fluorescence (UV excitation by sunlight) and thermal emission. Rendered as additive orange-red glow #FF8050 at low alpha 0.05-0.10, particularly bright at coma center. Shader: additive thermal/fluorescence glow layer. Subtle effect. |
| Coma | Anti-Tail Artifact | uAntiTail | OFF | Rarely, an anti-tail (pointing toward Sun) may appear due to forward-scattering geometry in inner coma. Rendered as bright feature in opposite direction from main tail. Off by default (rare, obscure feature). |

#### Dust Tail (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| DustTail | Dust Tail Main Structure | uDustTail | ON | Curved yellowish-white #F5E6D3 tail extending from comet, sweeping from nucleus, length ~1,000,000-10,000,000 km (scales with activity). Dust particles follow ballistic orbits, creating curved tail that lags behind comet's motion. Rendered as gradient fade-out cone/ribbon shape. Color gradient: bright near nucleus (#F5E6D3) to dark at far end (#7A6A50). Shader: parametric tail geometry with radial falloff opacity. Iconic visual feature. |
| DustTail | Dust Tail Curvature & Synchrones | uTailCurve | ON | Tail curves due to dust particle drag and solar radiation pressure. Curvature creates crescent shape in orbital plane. Synchrone structure: shells of particles ejected at different times appear as concentric curved layers. Rendered via multiple curved ribbons (5-7 synchrones) slightly offset in color (gradient #F5E6D3 to #6A5A4A). Shader: parametric synchrone curves. Shows orbital mechanics. |
| DustTail | Tail Striations & Striae | uTailStriae | ON | Fine structure in tail: dark thin streaks running along tail axis, representing dust-poor regions or density waves. FBM 1D along tail length (freq 80.0, amplitude 0.08, ~30% coverage). Color: dark #5A4A40. Shader: sparse thin stripes overlaid on tail. Adds fine detail. |
| DustTail | Tail Brightening Toward Comet | uTailBright | ON | Dust tail brightest near nucleus, fades with distance. Rendered via radial opacity gradient: alpha = 1.0 near nucleus, decreasing to ~0.05 at far end. Shader: distance-dependent alpha falloff. Natural perspective. |

#### Ion Tail (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| IonTail | Ion Tail (Blue Straight) | uIonTail | ON | Ion tail composed of ionized gas (H2O+, CO+, CN+), extremely straight and pointing directly anti-sunward. Color: deep blue #4A8FC8. Length similar to dust tail (~1,000,000 km scale). Much narrower than dust tail (~0.1× width). Rendered as thin ribbon with sharp edges. FBM 1D along tail (freq 60.0, amplitude 0.06). Shader: thin bright line with blue color, precise directionality. Dramatically straight. |
| IonTail | Ion Tail Solar Wind Interaction | uIonWind | ON | Ion tail deflected by solar wind plasma, creating kinks and waves. Rendered via sinusoidal modulation of tail path (amplitude 0.15, freq 5.0 along tail length), representing solar wind buffeting. Shader: curved parametric ion tail path. Shows plasma interaction. |
| IonTail | Ion Disconnection Events | uIonDisconnect | OFF | Sudden ion tail disconnections (rare, ~few years between events), where tail severs and reconnects, caused by solar wind magnetic field reversals. Rendered as separated ion tail segment drifting away. Off by default (rare, episodic). Historical data toggle. |

#### Hydrogen Envelope (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Hydrogen | Lyman-Alpha Hydrogen Envelope | uLymanAlpha | ON | Ultraviolet fluorescence of hydrogen envelope (excited by solar UV), not visible optically but detected in UV. Speculative visualization: faint pale blue glow #B8D8F0 at very low alpha 0.08, extending beyond visible coma (radius ~3-5× coma radius). Shader: very large faint halo. Represents UV-detected extended envelope. |
| Hydrogen | Hydrogen Envelope Asymmetry | uHydrogenAsym | ON | Hydrogen envelope non-uniform due to comet's motion and solar wind interaction, brighter on Sun-facing side. Rendered via directional brightness modulation: cosine falloff toward/away from Sun direction. Shader: directional glow intensity. Shows solar wind pressure. |

#### Fragmentation Events (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Fragment | Nucleus Fragmentation (if breaking apart) | uFragmentation | OFF | Some comets break into fragments (e.g., Shoemaker-Levy 9 before impact). Rendered as multiple nucleus spheres orbiting each other, separation increasing over time (~animation spanning 10 seconds representing months). Fragments connected by dust bridges initially, separating. Shader: multiple nucleus geometries, orbital trajectories. Off by default, activated for fragmenting comets. |
| Fragment | Ejected Fragment Tails | uFragmentTails | OFF | Each fragment develops its own small tail/coma if fragmenting. Rendered as multiple miniature comet-like features branching from main nucleus area. Off by default. |

#### Orbital Trajectory (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Orbit | Heliocentric Elliptical Orbit | uOrbit | ON | Render elliptical orbit around Sun (or parabolic/hyperbolic for long-period/escape comets). Orbit line: pale yellow #FFD700. Perihelion point marked. Animated comet position on orbit. Shader: parametric ellipse/parabola. Shows orbital context. |
| Orbit | Perihelion-Aphelion Distance Display | uOrbitalLabel | ON | Text annotations showing perihelion distance (closest approach to Sun, e.g., 0.05 AU), aphelion distance (e.g., 30 AU), and orbital period (e.g., 75 years for Halley). Educational overlay. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Close Nucleus View | uCameraMode | ON | Default camera positioned at ~1× nucleus radius distance, showing nucleus detail, jets, and inner coma. FOV 40°. Locked to comet, slowly rotating. Shows fine details. |
| Camera | Full Coma & Tail View | uCameraMode | OFF | Zoomed-out camera at ~10× coma radius, showing entire coma, full dust tail, and ion tail simultaneously. FOV 60°. Rotated to show tail in profile. Shows full comet structure. |
| Camera | Orbital Motion Context | uCameraMode | OFF | Very zoomed out, showing comet in heliocentric orbit, Sun position visible (#FFF8D0 bright sphere). Orbital ellipse overlay. Distance ~50 AU (scaled). Shows comet's journey through solar system. |

---

### Dwarf Planet (Pluto-type)

**Entity ID:** ENT-4030
**Description:** Small icy body with diverse geology, enormous relative moon (Charon), subsurface water ocean (speculative), methane/nitrogen ices, atmospheric hazes, and complex surface dichotomy. Primary colors #C3A688 (tholins) and #F5F5F5 (nitrogen ice). Real exemplars: Pluto, Eris, Makemake, Haumea.

**Section Count:** 9 (Surface Heart/Bright Region, Mountain Ranges, Nitrogen Ice Plains, Methane Snow Caps, Atmospheric Haze, Tholin Red Staining, Charon Tidal Bulge, Dark Cthulhu Region, Camera)
**Total Feature Count:** 25

#### Surface Heart / Bright Region (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Heart | Sputnik Planitia (Heart Feature) | uSputnikPlanitia | ON | Enormous bright heart-shaped impact basin filled with nitrogen ice at high altitude (Tombaugh Regio), ~1,000 × 1,200 km in size. Base color: brilliant white-pale blue #F5F5F5. FBM 3-octave (freq 8.0, amplitude 0.10) creates subtle texture. Shader: bright base color with gentle slope-shading. Iconic Pluto feature. |
| Heart | Nitrogen Ice Convection Cells | uConvectionCells | ON | Nitrogen ice in Sputnik undergoes convection, creating cellular patterns (~10-50 km cells). Rendered via Voronoi diagram (freq 100.0, cell amplitude 0.08) with color variation: cell centers #F5F5F5 bright, cell edges #D0D8E0 slightly darker. Shader: Voronoi-based polygon rendering. Shows cryovolcanic dynamics. |
| Heart | Scarps & Boundary Cliffs | uHeartScarps | ON | Sharp boundary between bright Sputnik and darker surrounding terrain, cliff faces ~3-5 km high. Rendered via sharp color boundary at Sputnik edge (#F5F5F5 to #5A4A40 dark), thin dark-shadow stripe ~0.5° wide representing scarp. Shader: discontinuity blending at border. Shows topographic boundary. |
| Heart | Thermal Anomaly Glow | uHeartGlow | ON | Sputnik slightly warmer due to tidal heating (Pluto's internal heat, though modest). Represented by faint orange-red thermal tint #FF7050 at alpha 0.05, concentrated in Sputnik region. Shader: additive thermal glow overlay. Subtle effect. |

#### Mountain Ranges (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Mountains | Water Ice Mountains | uWaterMountains | ON | Enormous water ice mountains at Sputnik boundary, heights 3-5 km, some approaching 10 km (higher than Earth's Mt. Everest relative to Pluto size). Color: white-gray #D0D8E0 (water ice), rendered as sharp peaks with steep slopes. FBM 6-octave (freq 20.0, amplitude 0.25) for jagged peaks. Shader: elevation-dependent shading, steep normals. Dramatic topography. |
| Mountains | Ridgelines & Scarps | uMountainRidges | ON | Sharp ridgelines running across Sputnik boundary, thin dark shadows #3A3A4A at ridge bases (~0.3° wide). Multiple parallel ridges (5-8 major ridges). Rendered via thin dark line overlays following ridge curves. Shader: additive shadow lines. Enhances mountain profile. |
| Mountains | Mountain Peak Snow Caps | uPeakSnow | ON | White snow/frost caps on mountain peaks, bright #F5F5F0. Sparse sparse regions at high elevations (altitude-dependent masking, only top 20% of peak heights). FBM 5-octave (freq 40.0, amplitude 0.10). Shader: elevation-dependent bright overlay. |
| Mountains | Landslide Scars & Weathering | uWeathering | ON | Evidence of ancient landslides and erosion on mountain slopes. Rendered as dark streaks #4A4A5A running downslope (~5-10 streaks), sparse distribution (Worley freq 80.0, ~15% coverage). Shader: thin downslope-aligned streaks with soft falloff. Shows geological history. |

#### Nitrogen Ice Plains (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Plains | Nitrogen Ice Sputnik Planitia (Primary) | uNitrogenIce | ON | Large nitrogen ice deposits, frozen at ~35 K. Color: pale white #F0F0F5 with slight blue tint #E0E8F0. FBM 4-octave (freq 12.0, amplitude 0.08) for subtle texture. Represents ~5–10% of Pluto's surface (concentrated in Sputnik Planitia basin with dispersed frost elsewhere). Shader: bright base color with gentle Lambertian shading. Dominant visual feature. |
| Plains | Nitrogen Sublimation Patterns | uSublimat | ON | Nitrogen ice sublimate in sunlit regions and redeposit in cold regions, creating thin layering. Represented via thin parallel lines/bands (1-octave sine wave, freq 40.0 along latitude, amplitude 0.03 color variation). Color alternates #F5F5F5 ↔ #D8DFE8. Shader: thin banding overlay. Shows ice deposition patterns. |
| Plains | Nitrogen Ice Polygon Fractures | uFractures | ON | Nitrogen ice contracts/expands thermally, creating large polygonal fracture patterns. Rendered via Voronoi-like fracture lines (freq 60.0, line width ~0.5°), dark #4A4A5A color. Shader: thin fracture line overlay. Creates tiled appearance. |

#### Methane Snow Caps (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Methane | Methane Frost Deposits | uMethaneSnow | ON | Methane ice concentrated at poles and in cold regions, frozen at ~30 K. Color: pale tan-white #E8E0D8 with slight brown tint. Sparse patchy distribution (Worley freq 90.0, ~25% coverage). FBM 4-octave (freq 18.0, amplitude 0.09). Shader: additive overlay on base surface. Secondary ice component. |
| Methane | Methane-Nitrogen Ice Boundary | uIceBoundary | ON | Sharp boundary between methane and nitrogen ice deposits, visible as color discontinuity (#E8E0D8 methane vs #F5F5F5 nitrogen). Thin transition zone (~2-5° wide). Shader: color boundary blending. Shows ice segregation. |

#### Atmospheric Haze (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Atmosphere | Thin Nitrogen Atmosphere | uAtmosphere | ON | Pluto's thin nitrogen atmosphere (pressure ~10 μbar, extremely thin), appears as pale blue haze #A8CADE at planet limb. Alpha 0.12-0.18. Shader: atmospheric halo at atmosphere edge, view-angle dependent glow. Very subtle effect. |
| Atmosphere | Atmospheric Scattering Haze | uHaze | ON | High-altitude haze layer from methane/nitrogen frost and dust particles. Pale blue-gray #C0D0D8, alpha 0.08. FBM 4-octave (freq 25.0, amplitude 0.10) for cloud-like texture. Shader: high-altitude haze layer overlay. Adds atmospheric depth. |

#### Tholin Red Staining (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Tholin | Tholin Red Complex (Cthulhu Macula) | uTholinRed | ON | Dark reddish-brown tholin complexes (organic polymer compounds) concentrated in one hemisphere, particularly the large "Cthulhu Macula" (~2,990 × ~750 km elongated equatorial band). Color: dark brown-red #3A2F25 to reddish #8F5A50. FBM 5-octave (freq 15.0, amplitude 0.12). Shader: warm dark color overlay in specific regions. Stark contrast with bright nitrogen ice. |
| Tholin | Tholin Composition Variation | uTholinVar | ON | Tholin concentration varies with location, creating color gradients. Represented by FBM-modulated tholin overlay (freq 20.0, amplitude 0.08), color varies #4A3A2A (very dark) to #8F5A50 (reddish). Shader: spatially-varying warm color tint. Shows compositional complexity. |
| Tholin | Tholin-Water Ice Contact Zones | uTholinContact | ON | Boundaries between tholin-rich and ice-rich regions show color transition. Rendered via gradient transition zones (~10° wide), colors blend #3A2F25 tholin to #F5F5F5 ice. Sharp contrasts accentuate dichotomy. Shader: smooth color interpolation at boundaries. Shows surface dichotomy. |

#### Charon Tidal Bulge & Relationship (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Charon | Charon Moon Position & Synchronous Orbit | uCharonPos | ON | Charon orbits Pluto at ~19,600 km distance (very close, ~6.4 Pluto radii), orbital period 6.39 days synchronized with Pluto's rotation (mutually tidally locked). Rendered as sphere position at correct orbital location, with synchronous orbital animation. Charon color: pale gray #D8D8D8 with darker regions #8A8A9A. Shader: unlit billboard sphere with diffuse shading. Unique massive moon system. |
| Charon | Tidal Bulge Toward Charon | uTidalBulge | ON | Pluto tidally distorted toward Charon, creating bulge. Rendered via geometric deformation: apply ellipsoid geometry with elongation toward Charon direction (~3% stretching along Charon-Pluto axis). Shader: world-space geometry deformation. Subtle but present. |

#### Dark Cthulhu Region (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Cthulhu | Cthulhu Macula Dark Patch | uCthulu | ON | Enormous dark feature (~2,990 × ~750 km elongated band), reddish-brown color #3A2F25. Located in equatorial region. FBM 5-octave (freq 10.0, amplitude 0.10) for texture. Represents tholin-rich ancient crust. Shader: dark warm color layer in specific region. Stark contrast with bright Sputnik. |
| Cthulhu | Cthulhu-Sputnik Dichotomy | uDichotomy | ON | Pluto shows extreme surface dichotomy: bright nitrogen Sputnik (~white) adjacent to dark Cthulhu (~reddish-brown). This stark contrast is rendered deliberately, with sharp boundaries between regions. FBM-blended color gradient (freq 12.0, amplitude 0.15) across hemispheres. Shader: strong color contrast, highlights geological diversity. Defining characteristic. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Sputnik Heart-Facing View | uCameraMode | ON | Default camera positioned to face Sputnik Planitia directly, distance ~3 Rp (Pluto radii). FOV 55°. Shows bright heart feature with surrounding dark tholin and mountains. Locked to Pluto rotation. Iconic view. |
| Camera | Charon-Pluto System View | uCameraMode | OFF | Camera pulled back to show both Pluto and Charon in frame, ~0.5× orbital distance away. Shows mutual tidal locking and size relationship (Charon ~0.5× Pluto radius). Shows binary system dynamics. |
| Camera | Pole-Looking-Down View | uCameraMode | OFF | Camera positioned above Pluto's south pole (~3 Rp altitude), looking down at Sputnik and surrounding regions. FOV 50°. Shows Cthulhu dark region beneath bright Sputnik. Dramatic polar perspective. |

---

### Kuiper Belt Object (Classical KBO)

**Entity ID:** ENT-4021
**Description:** Icy body orbiting in the Kuiper Belt (30–50 AU), typically 50–500 km diameter, composed of water ice, methane ice, ammonia ice, and dark organic tholins. Surface exhibits strong color dichotomy: ultra-red organic-rich surfaces (#A04020, among the reddest objects in the Solar System) vs neutral gray water-ice surfaces (#A0A0A0). Low albedos (0.04–0.20) with occasional high-albedo icy patches. Extremely cold surface temperatures 30–50 K. Many are contact binaries or close binary pairs (30–40% binary fraction for classical KBOs). Real exemplars: Arrokoth/2014 MU69 (New Horizons flyby, contact binary, ultra-red), Quaoar (1100 km, ring system), Makemake (dwarf planet boundary), Gonggong.

**Section Count:** 8 (Surface Composition, Shape & Geology, Volatile Activity, Binary/Contact Properties, Ring System, Thermal Properties, Space Weathering, Camera)
**Feature Count:** 26

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Surface Composition | Ultra-Red Organic Surface | uUltraRedSurface | ON | Dominant surface color from complex organic tholins (irradiated methanol, ammonia ice). Color: #A04020 (ultra-red matter, spectral slope > 30%/100nm). Most primitive surface material in Solar System — minimally processed since formation 4.5 Gyr ago. FBM texture: 6 octaves, freq 3.0, gain 0.45. Albedo 0.04–0.08 (very dark despite red color). |
| Surface Composition | Water Ice Exposures | uWaterIcePatches | ON | Localized patches of exposed H₂O ice amid organic crust. Color: #A8B0B8 (neutral gray, higher albedo ~0.15–0.30). Coverage 10–30% of surface area, concentrated in impact craters and structural fractures that breach organic layer. Specular micro-highlight at phase angle 0°. Voronoi patch distribution, 8–15 patches. |
| Surface Composition | Methane/CO Ice Deposits | uMethaneIce | OFF | For larger KBOs (>500 km) that retain volatiles: methane and carbon monoxide frost deposits. Bright patches #E0E0D8 (albedo 0.5–0.8, very high contrast against dark surface). Concentrated at poles and in permanent shadow regions. Sublimation-deposition cycle at ~40 K. Thin veneer, sub-mm to cm thickness. |
| Surface Composition | Ammonia Hydrate Features | uAmmoniaHydrate | OFF | NH₃·H₂O deposits indicating possible past cryovolcanic resurfacing or pristine primordial composition. Distinctive spectral signature at 2.2 μm. Surface color contribution: #C8C0B0 (slightly warm neutral). Found on Charon and some mid-sized KBOs. Patches 5–50 km diameter. |
| Shape & Geology | Bilobed Contact Binary Shape | uContactBinary | ON | Arrokoth-type contact binary morphology — two lobes joined at narrow neck. Lobe diameter ratio 0.6–0.9. Neck region: structural collapse zone with smoother terrain #806040 (compacted material). Each lobe independently cratered. Shape rendered as two overlapping ellipsoids with smooth blending at junction. Extremely common: ~50% of small KBOs may be contact binaries. |
| Shape & Geology | Impact Cratering | uImpactCraters | ON | Low-velocity impact craters (impact speeds ~1 km/s in KB, vs ~20 km/s inner solar system). Shallow, bowl-shaped craters with subdued rims. Crater floors: slightly brighter #888880 (excavated ice). Crater density varies with surface age. Size distribution: 0.5–20 km diameter visible. Crater depth/diameter ratio ~0.1 (shallow). 15–40 craters visible. |
| Shape & Geology | Smooth Terrain Units | uSmoothTerrain | OFF | Surprisingly smooth plains observed on Arrokoth. Possible origin: granular flow infilling of topographic lows, or volatile-loss deflation. Color: slightly different shade #905030 from surrounding rough terrain. Coverage: 20–40% of each lobe's surface. Low roughness: FBM amplitude 0.01 (vs 0.05 for rough terrain). |
| Shape & Geology | Bright Collar/Ring Feature | uBrightCollar | OFF | Bright annular feature at contact binary neck (Arrokoth's "bright collar"). Color: #B8A898 (brighter than surrounding, albedo ~0.12 vs 0.04). Width 1–3 km. Origin: mass wasting from lobe flanks, fresh material exposure, or volatile cold-trapping at neck concavity. Torus-shaped bright band. |
| Volatile Activity | Cometary-Like Activity | uCometaryActivity | OFF | Occasional outgassing observed for active KBOs/Centaur-transition objects. Faint coma #D0D0E0, opacity 0.02, extending 100–1000 km. CO or CO₂-driven sublimation (too cold for water ice activity at 30–50 AU). Activity sporadic, possibly impact-triggered or crystallization of amorphous ice. Tail direction: anti-solar. |
| Volatile Activity | Sublimation Patterning | uSublimationPattern | OFF | Differential sublimation creating surface texture on volatile-rich KBOs. Penitente-like pinnacle terrain from CH₄ sublimation (as on Pluto's Tartarus Dorsa). Texture: high-frequency FBM, 8 octaves, freq 12.0, amp 0.02, directionally aligned with solar direction. Scale: 100–500 m pinnacle spacing. |
| Binary/Contact Properties | Separated Binary Companion | uBinaryCompanion | OFF | For non-contact binary KBOs: resolved secondary body orbiting primary. Mass ratio typically 0.1–1.0 (KBO binaries remarkably equal-mass). Separation 1000–100000 km. Secondary rendered with similar surface properties but potentially different color/albedo. Mutual orbit animated, period days–months. ~30% of cold classical KBOs are binaries. |
| Binary/Contact Properties | Mutual Tide Effects | uMutualTides | OFF | For close binaries: tidal bulge distortion visible on both components. Elongation toward companion, amplitude 1–5% radius. Tidal heating negligible at current separations but may have driven past activity. Rendered as subtle ellipsoidal deformation. Both bodies tidally locked (double synchronous state). |
| Ring System | Narrow Dense Ring | uNarrowRing | OFF | Quaoar-type ring system — narrow, dense ring at anomalously large distance (7.4 Rp for Quaoar, beyond classical Roche limit). Ring color #B0A890, optical depth 0.05–0.3, width 5–20 km. Challenges classical ring confinement theory. Chariklo and Haumea also possess rings — rings may be common on mid-sized KBOs. Forward-scattering at high phase angle. |
| Ring System | Ring Shadow on Surface | uRingShadow | OFF | Shadow of ring cast on KBO surface when viewing geometry permits. Narrow shadow line #3A3028 on surface, width proportional to ring width. Visible at low solar elevation angles. Shadow curves across surface following ring plane projection. |
| Thermal Properties | Thermal Inertia Contrast | uThermalContrast | OFF | Surface temperature variation from rotation — day side ~45 K, night side ~35 K. Very low thermal inertia (fluffy, porous surface). Rendered as subtle IR-emission color variation: sunlit side #2A1A10 (faint warm glow), night side #0A0808 (near black). Only visible in IR-enhanced rendering mode. |
| Thermal Properties | Radiative Cooling Pattern | uRadiativeCooling | OFF | Surface cools rapidly past terminator due to low thermal inertia. Temperature follows cos^(1/4)(solar zenith angle) distribution. Subsolar point warmest, limb and night side approach CMB equilibrium. Rendered as gradient map overlay. Educational feature demonstrating thermal physics of airless bodies. |
| Space Weathering | Solar Wind Reddening | uSolarWindRedden | OFF | Visualization of space weathering process: solar wind and cosmic ray bombardment converts simple ices to complex red organics over ~10⁸ year timescales. Fresh exposure sites (recent craters) appear bluer/grayer; ancient surfaces appear ultra-red. Weathering gradient from crater centers (young, neutral #909090) outward (old, red #A04020). |
| Space Weathering | Cosmic Ray Mantle | uCosmicRayMantle | OFF | Galactic cosmic ray irradiation creates dark, carbonized surface mantle over top 1–2 meters. Lowers albedo to 0.02–0.05 (among darkest surfaces in Solar System). Mantle color #3A2A1A. Disrupted by impacts revealing brighter subsurface. Mantle depth visualization as opacity layer over base color. |
| Camera | New Horizons Flyby View | uCameraMode | ON | Default view mimicking approach geometry: ~3 body-radii distance, sunlit crescent showing surface color and shape. Phase angle ~20–40° for good texture visibility. FOV 45°. Shows bilobed shape, surface color dichotomy, and cratering. Solar illumination from ~40 AU distance (dim but sufficient). |
| Camera | Binary System View | uCameraMode | OFF | If binary: zoomed out to show both components with orbital paths. Distance: 2× binary separation. Shows size ratio and orbital dynamics. If contact binary: rotated to show neck junction clearly. |
| Camera | Time Speed Multiplier | uTimeSpeed | 300x | 1 real second = 5 rotation-hours. Typical rotation period 6–12 hours for singles, synchronous for binaries. Shape and surface feature rotation visible. Very slow orbital motion at 30–50 AU (period 200–300 years). |

---

### Centaur Object

**Entity ID:** ENT-4022
**Description:** Small icy body on unstable orbit between Jupiter and Neptune (5.2–30 AU), transitioning between Kuiper Belt reservoir and inner Solar System cometary activity. Dynamical lifetime ~10⁶–10⁷ years (short — continually replenished from KB). Exhibits dramatic color bimodality: either ultra-red (#A04020, pristine KBO surface) or neutral gray (#7A7A7A, recently resurfaced/active). Size 10–300 km. Many show cometary activity at distances far too great for water ice sublimation — driven by CO, CO₂, or crystallization of amorphous ice. Spectacular outbursts with brightness increases of 1–7 magnitudes. Real exemplars: Chiron (rings + coma, 200 km), Chariklo (ring system, 250 km), 29P/Schwassmann-Wachmann 1 (quasi-periodic outbursts), Echeclus, Pholus (ultra-red).

**Section Count:** 7 (Surface & Color, Cometary Activity, Ring System, Outburst Events, Shape & Structure, Thermal Evolution, Camera)
**Feature Count:** 25

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Surface & Color | Surface Color State | uSurfaceColor | ON | Bimodal color: ultra-red (#A04020, preserved KBO organics, like Pholus — spectral slope 30%+/100nm) OR neutral-gray (#7A7A7A, freshly exposed ice surface from recent activity, like Chiron). Toggle between states. The bimodality suggests resurfacing events strip organic mantles, revealing subsurface ice. Albedo: red 0.04–0.08, gray 0.08–0.15. |
| Surface & Color | Water Ice Surface Fraction | uWaterIceFraction | ON | H₂O crystalline ice patches visible on gray-type Centaurs. Color: #B0B8C0, albedo 0.20. Coverage 20–60% for active Centaurs (Chiron archetype). Absorption feature at 1.5/2.0 μm. Patchy distribution: Voronoi cells, 10–20 patches. Intermixed with darker regolith #606060. |
| Surface & Color | CO₂ Ice Deposits | uCO2Ice | OFF | Carbon dioxide ice accumulations at surface. Sublimation onset T ~80 K (drives activity at 10–15 AU). Bright deposits #E0E0E0 in shadow regions and polar zones. Sublimation pits form as CO₂ escapes, creating swiss-cheese texture (Mars south cap analog). FBM pitting: freq 15.0, amp 0.01, 4 octaves. |
| Cometary Activity | Asymmetric Coma | uAsymComa | ON | Gas and dust coma from sublimation of super-volatiles (CO, CO₂). Not spherically symmetric — jets from active regions create asymmetric coma. Color: #D0D8E0 (dust-scattered sunlight), opacity 0.04, extending 1000–50000 km. Jet-driven asymmetry: 2–4 active source regions on sunlit hemisphere. Tailward elongation. |
| Cometary Activity | Dust Tail | uDustTail | ON | Curved dust tail from radiation pressure on ejected particles. Tail direction: anti-solar with curvature from orbital motion (syndyne/synchrone structure). Color: #D0C8B8 (reddened sunlight), opacity 0.02. Length 10⁴–10⁶ km. Width increases with distance from nucleus. Rendered as tapered volumetric cone with FBM turbulence, 4 octaves. |
| Cometary Activity | CO-Driven Activity | uCOActivity | OFF | Carbon monoxide sublimation producing activity at extreme distances (>15 AU, where CO₂ and H₂O are frozen). CO jets: invisible gas but entrains dust. Jet speed ~0.3 km/s. Dust mantle disruption pattern: localized blowout regions where CO pressure exceeds overburden. 29P/SW1 archetype — continuous low-level activity. |
| Ring System | Narrow Ring System | uNarrowRings | OFF | Chariklo-type ring system — two narrow dense rings (2013 discovery, first rings found on small body). Ring 1: semi-major axis 391 km, width 7 km, optical depth 0.4. Ring 2: 405 km, width 3 km, optical depth 0.06. Color: #B0A890 (icy particles). Shepherd moon hypothesis for confinement. Forward-scattering brightening at high phase. |
| Ring System | Ring-Coma Interaction | uRingComaInteract | OFF | For active ring-bearing Centaurs (Chiron): coma material interacting with ring system. Ring absorption/scattering of coma dust. Ring plane visible as gap in coma. Dust deposition onto ring particles darkening them over time. Complex interplay visualization: ring silhouette #3A3A3A within coma envelope. |
| Outburst Events | Major Outburst | uMajorOutburst | OFF | Dramatic brightness increase (1–7 magnitudes) over hours to days. Expanding dust shell #E0D8C8, velocity 100–300 m/s, opacity 0.3 at center decreasing with r². Shell radius grows: R(t) = v·t, reaching 10⁴–10⁵ km over days. Multiple shells from repeated outbursts (29P/SW1 shows several per year). Trigger: subsurface CO pocket blowout, amorphous→crystalline ice transition. |
| Outburst Events | Outburst Ejecta Fan | uOutburstFan | OFF | Directional ejecta from localized outburst source. Fan opening angle 30–120°. Color #D8D0C0, highest opacity 0.5 near source. Ejecta speed distribution: median 150 m/s with tail to 500 m/s. Fan rotates with nucleus rotation, creating spiral pattern over time. Animated expansion over hours-days timescale. |
| Outburst Events | Quiescent↔Active Toggle | uActivityState | ON | Toggle between quiescent state (bare surface, no coma) and active state (coma, tail, jets visible). Many Centaurs transition between states as orbital distance changes or stochastic outbursts occur. Quiescent: surface-only rendering. Active: adds all coma/tail features. Default: active (more visually interesting). |
| Shape & Structure | Irregular Elongated Shape | uIrregularShape | ON | Non-spherical shape (too small for self-gravity to impose sphere). Axis ratios 1.0:0.7:0.5 typical. Irregular surface with large-scale concavities and protrusions. Rendered as deformed ellipsoid with FBM surface displacement: 6 octaves, freq 2.0, amp 0.1. Rotation may be complex (tumbling) for recently disrupted objects. |
| Shape & Structure | Surface Cratering | uSurfaceCraters | ON | Impact craters from Centaur belt collisions and KB-era bombardment. Lower crater density than KBOs (resurfacing by activity erases craters). Fresh craters expose bright ice #B0B8C0 below dark surface. 10–25 visible craters, diameter 0.5–20 km. Depth/diameter 0.1–0.15. Some craters may be active sublimation sources. |
| Shape & Structure | Rubble Pile Interior | uRubblePile | OFF | Visualization of internal structure: gravitationally bound aggregate of smaller fragments with 30–50% porosity. Cross-section view showing component blocks 0.1–10 km, interstitial voids, and loose regolith fill. Internal colors: fresh ice #B0C0D0 (block interiors), void #000000, regolith fill #605040. Educational cutaway rendering. |
| Thermal Evolution | Crystallization Front | uCrystalFront | OFF | Amorphous-to-crystalline ice transition front propagating inward as Centaur approaches Sun. Exothermic reaction releases trapped gases (CO, N₂) — energy source for distant activity. Front depth: ~10–100 m below surface at 10 AU. Rendered as subsurface glowing layer #4A5A6A, depth varying with solar distance. Cross-section view. |
| Thermal Evolution | Thermal Skin Depth | uThermalSkin | OFF | Diurnal and seasonal thermal wave penetration depth. Diurnal skin depth ~1–10 cm (low thermal inertia). Seasonal skin depth ~1–10 m. Temperature gradient from ~100 K (sunlit surface at 10 AU) to ~50 K (deep interior). Rendered as color gradient in cross-section: warm surface #3A1A0A to cold interior #0A0A10. |
| Camera | Active Approach View | uCameraMode | ON | Default view at ~5 body-radii distance, showing nucleus plus coma/tail context. Sunlit hemisphere facing camera. Phase angle ~30°. Shows activity features (coma, jets) alongside surface. FOV 50°. |
| Camera | Nucleus Close-Up | uCameraMode | OFF | Zoomed to ~2 body-radii, filling frame with surface detail. Shows cratering, color variations, active jet sources. Coma features extend beyond FOV. Emphasizes geological surface character. |
| Camera | Time Speed Multiplier | uTimeSpeed | 100x | 1 real second = ~1.5 hours. Rotation period 5–20 hours visible. Jet rotation, coma evolution, and outburst expansion observable. Orbital timescale far too slow for visible motion. |

---

### Interstellar Object (ISO)

**Entity ID:** ENT-4024
**Description:** Body originating from another star system, passing through our Solar System on a hyperbolic trajectory (eccentricity >1.0). Unbound to Sun — first confirmed detections 2017–2019. Extreme diversity expected: rocky, icy, or exotic compositions not found in our system. Encounter velocity 10–80 km/s relative to Sun. Two confirmed exemplars with radically different appearances: 1I/'Oumuamua (2017, no coma, extreme 6:1–10:1 elongation, reddish #B08060, possible N₂ ice or H₂ outgassing acceleration), 2I/Borisov (2019, classic cometary appearance, CO-rich, hyperactive). Future detections expected at rate of ~1/year with Vera Rubin Observatory. Colors: rocky ISO #B08060 (neutral-reddish), cometary ISO #D0D8E0 (dust-scattered coma).

**Section Count:** 7 (Surface & Composition, Activity State, Trajectory & Dynamics, Shape Properties, Interstellar Medium Signatures, Detection Context, Camera)
**Feature Count:** 25

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Surface & Composition | Alien Surface Material | uAlienSurface | ON | Surface composition potentially unlike any Solar System object. Default: reddish-neutral #B08060 ('Oumuamua analog, organic irradiation mantle from Gyr in interstellar space). Alternative: fresh ice #C0C8D0 (Borisov analog, less space-weathered or recently fragmented). Albedo 0.04–0.10 (dark, consistent with extreme cosmic ray processing). FBM texture: 7 octaves, freq 3.0, gain 0.4. |
| Surface & Composition | Cosmic Ray Processed Crust | uCosmicRayCrust | ON | Gyr-scale galactic cosmic ray bombardment creates carbonized radiation mantle 1–10 m thick. Extremely dark and refractory. Color: #3A2A1A overlay at opacity 0.4 on base surface color. Processed depth far greater than Solar System small bodies (much longer exposure). Disrupted only by recent thermal processing during solar approach. |
| Surface & Composition | Exotic Ice Composition | uExoticIce | OFF | Potential ices not common in our system: molecular nitrogen N₂ (#E8E8F0), molecular hydrogen H₂ (#F0F0F0, nearly invisible), argon (#D0D0D8). N₂ ice hypothesis for 'Oumuamua's non-gravitational acceleration without visible coma (Desch & Jackson 2021). Sublimation-driven mass loss reshaping body over ~10⁸ year timescale. |
| Activity State | Cometary Coma (Active ISO) | uISOComa | OFF | Borisov-type: vigorous cometary activity with CO-dominated coma. Color: #D0D8E0, extending 10⁴–10⁵ km. CO production rate 10× typical Solar System comet at same distance (hyperactive). Dust-to-gas ratio may differ from solar composition. Ion tail (blue #4A6A9A) and dust tail (yellow-white #D8D0B8) present. |
| Activity State | Non-Gravitational Acceleration | uNonGravAccel | OFF | 'Oumuamua-type: anomalous acceleration away from Sun without visible coma or dust. Magnitude: ~5×10⁻⁶ m/s² at 1 AU, ∝ r⁻². Possible explanations: N₂ outgassing (transparent, no dust entrainment), H₂ outgassing from amorphous ice, radiation pressure on thin geometry. Rendered as subtle thrust vector indicator #A0D0A0, arrow from anti-solar face. |
| Activity State | Fragmentation Event | uISOFragment | OFF | Tidal or thermal fragmentation during solar approach. Nucleus splitting into 2–5 major fragments plus debris trail. Fragment separation velocity ~1–5 m/s. Debris color #B0A890, forming linear chain along orbit. Borisov showed evidence of pre-perihelion fragmentation. Animated separation over days-weeks timescale. |
| Trajectory & Dynamics | Hyperbolic Trajectory | uHyperbolicOrbit | ON | Unbound orbit with e > 1.0, asymptotic velocity v∞ = 10–80 km/s. Rendered as open hyperbolic curve through inner solar system, color #FF8040, opacity 0.15. Perihelion distance varies: 0.2–5 AU. Asymptotic incoming/outgoing directions indicate origin/destination in galaxy. 'Oumuamua: v∞ = 26 km/s. Borisov: v∞ = 32 km/s. |
| Trajectory & Dynamics | Solar System Context | uSolarSystemContext | OFF | Zoomed-out view showing ISO trajectory cutting through Solar System with planetary orbits for scale. Highlights transient nature — crossing time ~months to years. Planet positions at closest approach marked. Gravitational deflection angle small for typical encounter. Rendered planet orbits #4A6A8A, ISO path #FF8040. |
| Trajectory & Dynamics | Velocity Vector Visualization | uVelocityVector | OFF | Arrow showing current velocity relative to Sun. Color: #E0A040, length proportional to speed. At perihelion: >40 km/s (faster than any bound solar system object at same distance). Speed comparison indicator vs solar escape velocity at current distance. Demonstrates unbound nature. |
| Shape Properties | Extreme Elongation ('Oumuamua-Type) | uExtremeElongation | ON | Highly elongated shape: aspect ratio 6:1 to 10:1 (unprecedented for known Solar System small bodies). Dimensions approximately 230×35×35 m (or 115×111×19 m for oblate disk alternative). Cigar or pancake shape — both explain light curve amplitude (factor ~10 brightness variation). Default: elongated ellipsoid with tumbling rotation. |
| Shape Properties | Tumbling Rotation | uTumblingRotation | ON | Non-principal-axis rotation (tumbling). Period ~7.3 hours ('Oumuamua) but complex — not simple spin. Excited rotational state implies recent perturbation (tidal torque during formation ejection?). Rendered as combined spin about long axis + precession. Light curve: quasi-periodic with varying amplitude. Damping timescale > 10⁹ years. |
| Shape Properties | Surface Albedo Variation | uAlbedoVariation | OFF | Possible albedo markings contributing to light curve alongside shape. Bright patches #C0A880 (albedo 0.10) on generally dark surface (albedo 0.04). Alternatively, uniform albedo with shape-only light curve. Toggle between shape-dominated and albedo-contributing models. 3–5 bright patches randomly distributed. |
| Interstellar Medium Signatures | ISM Erosion Features | uISMErosion | OFF | Surface sculpting from ~10⁸–10⁹ year drift through interstellar medium. Micrometeorite bombardment at ~20 km/s creating surface roughening. Leading-face erosion: smoother, more processed surface. Trailing face: preserved features. Erosion rate ~0.1–1 m/Myr. Rendered as hemispherical texture asymmetry — smoother on velocity-facing hemisphere. |
| Interstellar Medium Signatures | Interstellar Dust Mantle | uISDustMantle | OFF | Accumulated interstellar dust grains on surface during galactic transit. Layer thickness ~μm to mm over 10⁸–10⁹ years. Ultra-fine grained, dark material #2A1A1A. May contain presolar grains, interstellar organics, and isotopic anomalies. Rendered as darkening overlay on base texture, opacity 0.2. |
| Detection Context | Discovery Brightness Profile | uDiscoveryProfile | OFF | Light curve at discovery showing rapid brightening (approach) and fading (departure). 'Oumuamua: discovered post-perihelion, already departing. Borisov: discovered pre-perihelion. Rendered as brightness trail along trajectory — bright near perihelion, fading at distance. Trail color intensity mapped to apparent magnitude. |
| Detection Context | Follow-Up Window Indicator | uFollowUpWindow | OFF | Visualization of the limited observation window. ISOs are observable for weeks to months before becoming too faint. Window rendered as highlighted trajectory segment #40FF40, with countdown/distance markers. Emphasizes urgency of rapid response. Future: Vera Rubin will provide earlier detection for intercept missions. |
| Camera | Tumbling Approach View | uCameraMode | ON | Default view at ~10 body-lengths distance, showing tumbling rotation and full shape. Phase angle ~30°. Solar illumination reveals extreme elongation during rotation. Star field background. FOV 40°. Shape changes dramatically with viewing angle. |
| Camera | Trajectory Context View | uCameraMode | OFF | Zoomed out showing hyperbolic trajectory arc with Sun and inner planets. ISO rendered as bright point. Path curvature around Sun visible. Shows approach direction and departure vector. Scale: 5 AU field width. |
| Camera | Time Speed Multiplier | uTimeSpeed | 50x | 1 real second = ~1 tumbling period. Rotation/tumbling clearly visible. Light curve variation from shape apparent. Trajectory motion perceptible at high compression. Coma evolution (if active) visible over hours. |

---

### Trojan Asteroid Cluster

**Entity ID:** ENT-4026
**Description:** Swarm of asteroids gravitationally trapped at a planet's L4 or L5 Lagrange points, leading or trailing the planet by ~60° in its orbit. Jupiter's Trojans are the largest known population (~10⁷ objects >1 km), but Neptune, Mars, and Earth also host Trojans. Individual bodies are dark (albedo 0.04–0.10), D-type and P-type taxonomy: very red to neutral dark surfaces from primitive organic-rich composition. Population rendered as a collective swarm with statistical properties rather than individual body detail. Swarm spans ~10–20° of orbital longitude, ±10° in inclination, distributed in a kidney-shaped cloud around L4/L5. Real exemplars: Jupiter L4 ("Greek camp") and L5 ("Trojan camp"), (3548) Eurybates (Lucy mission target), (617) Patroclus-Menoetius (binary, Lucy target), Neptune Trojans, Earth's sole known Trojan 2010 TK₇.

**Section Count:** 7 (Swarm Visualization, Individual Body Properties, Lagrange Point Dynamics, Population Statistics, Collisional Families, Binary Fraction, Camera)
**Feature Count:** 25

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Swarm Visualization | Particle Cloud Rendering | uParticleCloud | ON | Swarm rendered as point-particle cloud: 1000–5000 representative particles filling L4/L5 Lagrange region. Each particle: color #8A6A50 (mean Trojan color), brightness scaled by size distribution (power law, cumulative slope α ~2.1). Kidney-bean shaped distribution in co-rotating frame. Cloud extent: ~2 AU × 1 AU × 0.5 AU (radial × along-orbit × vertical). Particle jitter animation for dynamical libration. |
| Swarm Visualization | Libration Tadpole Orbits | uTadpoleOrbits | ON | Each Trojan librates around L4/L5 on tadpole-shaped orbit in co-rotating frame. Render 5–20 representative tadpole orbit paths #6A8A5A, opacity 0.08. Libration amplitude 10–40° in longitude. Period: 150–200 years for Jupiter Trojans. Animated particles following tadpole paths. Some extreme amplitudes approach horseshoe orbits (transitional). |
| Swarm Visualization | Swarm Density Map | uSwarmDensity | OFF | Color-coded density visualization of Trojan cloud. Core density highest (bright #C8A880), outer regions sparser (dim #4A3A2A). Density peak slightly leading L4/L5 point. Contour rendering with 5–8 density levels. Shows that "Lagrange point" is a region, not a point — Trojans are spread over enormous volume. |
| Swarm Visualization | L4 vs L5 Asymmetry | uL4L5Asymmetry | OFF | Jupiter's L4 (leading, Greek) camp has ~1.5–2× more members than L5 (trailing, Trojan) camp. Rendered as visibly denser leading swarm vs trailing. Asymmetry origin: stochastic capture during Nice model planetary migration, or Jupiter's orbital eccentricity breaking symmetry. Toggle to show one camp or both. |
| Individual Body Properties | Representative Body Surface | uRepBodySurface | OFF | Zoom to single representative Trojan asteroid showing surface detail. D-type surface: #7A5A40 (very red, organic-rich, primitive), albedo 0.04–0.06. P-type alternative: #6A6A5A (less red, silicate-organic mix), albedo 0.03–0.06. Irregular shape, axis ratio 1.0:0.7:0.5. FBM surface: 7 octaves, freq 3.0, gain 0.45. Size: 10–150 km diameter. |
| Individual Body Properties | Surface Cratering (Individual) | uIndividualCraters | OFF | Impact cratering on individual body. Crater density moderate — collisional evolution within swarm over 4 Gyr. Craters 0.1–10 km diameter, 15–30 visible on surface. Shallow bowl shapes, depth/diameter 0.1. Crater floors slightly brighter #8A7A60 (excavated fresher material beneath space-weathered crust). |
| Individual Body Properties | Regolith & Dust Layer | uRegolithLayer | OFF | Fine-grained regolith mantle on larger Trojans. Depth ~1–100 m. Smooth at small scales, masking topography on bodies >50 km. Color: #6A5040 (slightly darker than bedrock due to impact gardening and solar wind implantation). Thermal inertia: very low (~5–30 J m⁻² K⁻¹ s⁻¹/²). Rendered as soft-shadow terrain with low FBM amplitude 0.02. |
| Lagrange Point Dynamics | L4/L5 Point Marker | uLagrangeMarker | ON | Exact Lagrange point position marked with subtle indicator: concentric rings #5A8A5A, opacity 0.1, at L4 and/or L5 position. Point itself is empty (Trojans librate around it, not at it). Marker scales: inner ring at 0.1 AU radius, outer at 0.5 AU. Shows gravitational equilibrium position. |
| Lagrange Point Dynamics | Co-Rotating Frame | uCoRotatingFrame | ON | Visualization in frame co-rotating with planet's orbital motion. In this frame, L4/L5 are fixed points and Trojans execute tadpole librations. Planet stationary, Sun stationary. Reference grid lines #3A4A5A, opacity 0.05 showing co-rotating coordinates. Essential for understanding Trojan dynamics. |
| Lagrange Point Dynamics | Effective Potential Surface | uPotentialSurface | OFF | Roche potential (gravity + centrifugal) visualization as 3D surface or contour map in orbital plane. L4/L5 as local maxima (saddle points in 3D). L1/L2/L3 as saddle points. Color-coded: deep potential (blue #2A3A6A) at Sun and planet, high potential (red #8A3A2A) at L4/L5. Contour lines at 8 levels. Educational: shows why L4/L5 are stable despite being potential maxima (Coriolis effect stabilizes). |
| Lagrange Point Dynamics | Horseshoe Orbit Transition | uHorseshoeOrbit | OFF | Some Trojans on wide libration amplitudes execute horseshoe orbits: oscillating between L4 and L5, passing inside and outside planet's orbit. Rendered as full horseshoe path #A08050, opacity 0.10 in co-rotating frame. Period: ~hundreds of orbital periods. Transition boundary between tadpole and horseshoe regimes. |
| Population Statistics | Size-Frequency Distribution | uSizeFreqDist | OFF | Visual representation of population size distribution. Render particles with sizes following measured power law: differential slope q ≈ 2.1 for D > 10 km, steeper for smaller. Histogram overlay showing number vs size. Total population estimate: ~6300 D>10 km, ~10⁷ D>1 km for Jupiter L4+L5. |
| Population Statistics | Orbital Element Spread | uOrbitalSpread | OFF | Scatter plot visualization of Trojan orbital elements. Inclination: 0–35° (broad distribution, broader than main belt). Eccentricity: 0–0.2. Semi-major axis: clustered near Jupiter's 5.2 AU ± 0.3 AU. Points color-coded by size or taxonomy. Shows 3D volume occupation of Trojan swarm. |
| Collisional Families | Eurybates Family | uEurybatesFamily | OFF | Collisional family within L4 Trojans — fragments from catastrophic disruption of parent body. ~200 members sharing similar orbital elements. Highlighted in distinct color #4A8A8A within swarm. Eurybates itself: 64 km diameter, C/P type (less red than average Trojans — excavated interior?). Lucy mission primary target. |
| Collisional Families | Family Velocity Dispersion | uFamilyVelocity | OFF | Visualization of collisional family members' velocity dispersion around family center. V-shaped spread in semi-major axis vs size (Yarkovsky effect). Ejection velocity 10–100 m/s. Family age estimatable from dispersal: Eurybates ~1–4 Gyr old. Rendered as color gradient showing velocity offset from family center. |
| Binary Fraction | Binary Trojan Visualization | uBinaryTrojan | OFF | 10–25% of Trojans are binaries (Patroclus-Menoetius archetype, nearly equal-mass ~110 km each). Render representative binary at zoom: two irregular bodies orbiting common center, separation ~680 km, period ~4.3 days. Both D-type surface #7A5A40. Mutual orbit animated. Binary fraction much higher than main belt — primordial formation signature. |
| Binary Fraction | Contact Binary Fraction | uContactBinaryFraction | OFF | Many Trojans are bilobed/contact binaries (like KBOs). Render representative contact binary shape. Axis ratio ~0.5–0.7 (two lobes). Neck region smoother #6A5040. Light curve: large amplitude (0.5–1.0 mag) from shape. Estimated 10–20% contact binary fraction. Shape rendered as dual-ellipsoid with smooth blending kernel. |
| Camera | Swarm Overview (L4) | uCameraMode | ON | Default view: positioned above orbital plane looking down at L4 region, distance ~5 AU from swarm center. Jupiter and Sun visible for orbital context. Swarm rendered as particle cloud. FOV 60°. Shows kidney-bean distribution shape and overall scale relative to Jupiter's orbit. |
| Camera | Individual Flythrough | uCameraMode | OFF | Camera placed within swarm, traveling through at representative density. Nearest neighbors ~10⁵ km apart (vast spacing — cannot see one Trojan from another). Particles drift slowly past. Shows emptiness of space even in "dense" asteroid populations. Star field background dominant. |
| Camera | Time Speed Multiplier | uTimeSpeed | 10000x | 1 real second = ~3 months. Jupiter orbital period (12 years) = ~48 real seconds. Tadpole libration (150–200 years) visible over longer observation. Swarm breathing motion around L4/L5 apparent. |

---

### Meteoroid Stream (Meteor Shower)

**Entity ID:** ENT-4028
**Description:** Stream of cometary or asteroidal debris particles distributed along a parent body's orbit, producing meteor showers when Earth intersects the stream. Individual meteoroids range from dust grains (~100 μm) to pebbles (~10 cm), with typical mass 10⁻⁶ to 10⁻¹ g. Entry velocities 11–72 km/s depending on stream geometry. Meteor colors encode composition: sodium #FFA030 (orange), magnesium #60FF80 (green), calcium #D070FF (violet), iron #FFD050 (yellow), nitrogen/oxygen from atmospheric excitation #40FF40 (green) and #FF4040 (red). Persistent trains from chemiluminescence of metallic atoms last seconds to minutes. Real exemplars: Perseids (109P/Swift-Tuttle parent), Leonids (55P/Tempel-Tuttle, storm-producing), Geminids (Phaethon, asteroidal parent), Eta Aquariids (1P/Halley).

**Section Count:** 7 (Individual Meteor, Shower Radiant, Stream Structure, Atmospheric Interaction, Train Persistence, Parent Body Context, Camera)
**Feature Count:** 25

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Individual Meteor | Head Plasma Ball | uMeteorHead | ON | Compressed shock-heated atmospheric gas and ablating meteoroid material forming bright leading point. Color: white-hot core #FFFFFF (T > 10000 K in shock front), surrounded by element-specific emission: Na #FFA030, Mg #60FF80, Fe #FFD050. Diameter: 0.1–10 m depending on meteoroid mass. Rendered as bright point with element-color corona, 3-layer glow. Fresnel emission factor 1.0 (self-luminous). |
| Individual Meteor | Luminous Trail | uMeteorTrail | ON | Ionized and excited atmospheric column left behind meteor head. Length: 10–100 km (velocity-dependent — faster meteors produce longer trails). Width: 1–10 m initially, expanding. Color gradient: front-to-rear from white-hot #FFFFFF through #FFA030 (Na dominant) to #FF5030 (cooling recombination). Trail fades over 0.1–2 seconds. Rendered as tapered cylinder with radial gaussian falloff, animated extinction. |
| Individual Meteor | Fragmentation Events | uMeteorFragmentation | ON | Meteoroid breakup during atmospheric entry: mass > 10⁻² g often fragments at 80–90 km altitude. Produces flare (brightness increase 1–3 magnitudes) and multiple daughter trails diverging at small angles (1–5°). 1–4 fragmentation events per bright meteor. Flare flash #FFFFFF, duration 50–100 ms. Daughter trails inherit parent color but dimmer. |
| Individual Meteor | Terminal Burst | uTerminalBurst | OFF | Final catastrophic disruption of meteoroid at 60–80 km altitude. Brief flash 10–100× brighter than steady-state luminosity. Color: white #FFFFFF with green Mg afterglow #60FF80. Duration 20–50 ms. Debris cloud expands and fades over 0.5–2 seconds as hot expanding sphere #FFA850 at opacity 0.4 decreasing. Marks end of visible meteor. |
| Individual Meteor | Wake Structure | uMeteorWake | OFF | Turbulent wake behind meteor head containing cooling ablation products. Length: 0.5–5 km immediately behind head. Shows von Kármán vortex street structure at Reynolds numbers ~10⁶. Color: dimmer version of head #D0A050, opacity 0.3. Turbulent texture: FBM 5 octaves, freq 8.0, amp 0.04. Distinct from luminous trail (wake is immediate, trail is persistent). |
| Shower Radiant | Radiant Point | uRadiantPoint | ON | Apparent convergence point of all shower meteors on sky (perspective effect — parallel trajectories appear to diverge from single point). Rendered as subtle crosshair/ring #A0A0FF, opacity 0.2 at constellation position. All meteor trails perspective-corrected to originate from this point. Radiant drifts ~1°/day during shower activity period. |
| Shower Radiant | Radiant Altitude Effect | uRadiantAltitude | ON | Meteor rate modulated by radiant altitude above horizon. Maximum rate when radiant at zenith (all atmosphere visible). Decreasing to zero when radiant below horizon. Zenith hourly rate × sin(altitude) = actual rate. Rendered as spatial density of meteors higher toward radiant. Correct geometric perspective projection. |
| Shower Radiant | Meteor Rate (ZHR) | uZHR | ON | Zenithal Hourly Rate controlling shower intensity. Quiet: ZHR 5–20 (background), normal shower: 20–100 (Perseids ~100), strong shower: 100–1000 (Geminids peak ~150), storm: 1000–100000 (Leonids storms 1999: ~3000/hr). Rendered as meteor frequency: 1 meteor per (3600/ZHR) seconds. Default: 100 ZHR. |
| Stream Structure | Orbital Tube Visualization | uStreamTube | OFF | Debris stream rendered as translucent tube following parent comet's orbit. Tube cross-section: elliptical, semi-minor 0.01–0.1 AU, semi-major 0.05–0.5 AU. Color: #A08060, opacity 0.02. Dense filaments (trails from specific perihelion passages) visible within tube as brighter threads. Old streams: wider, more diffuse. Young streams: narrow, filamentary. |
| Stream Structure | Dust Trail Filaments | uDustFilaments | OFF | Individual dust trails from specific perihelion passages of parent body. Each trail: narrow arc following slightly different orbit (ejection velocity ±10–100 m/s). Filament color #C0A880, opacity 0.01. When Earth crosses specific filament: enhanced rates (Leonid storms occur when crossing 1–3 revolution old trails). 5–15 filaments rendered from different epochs. |
| Stream Structure | Stream Age Gradient | uStreamAge | OFF | Color-coded stream age: fresh (< 100 yr old trails) #E0C8A0 (bright, concentrated) to ancient (>10⁴ yr) #6A5A4A (diffuse, spread). Newer trails: narrow, high density. Older trails: wider from differential orbital precession. Radial spreading rate ~10⁻⁴ AU/century from radiation pressure size-sorting. Educational visualization of stream evolution. |
| Atmospheric Interaction | Atmospheric Entry Corridor | uEntryZone | ON | Altitude zone where meteors become luminous: 120–80 km. Below 80 km: complete ablation for most. Above 120 km: insufficient atmospheric density. Rendered as translucent atmospheric shell, inner boundary #2A2020 at 80 km, outer #1A1A30 at 120 km. Meteors appear and disappear within this corridor. Shell opacity 0.02. |
| Atmospheric Interaction | Ionization Column | uIonColumn | OFF | Free electron column left by meteor passage — detectable by radar. Electron line density: 10¹²–10¹⁶ electrons/m for visual meteors. Rendered as faint blue glow #4040A0, opacity 0.02, persisting 0.1–10 seconds depending on altitude (slower diffusion at higher altitude). Overdense columns (>10¹⁴/m) reflect radar, underdense scatter. |
| Atmospheric Interaction | Shock-Heated Atmosphere | uShockHeating | OFF | Bow shock front ahead of meteoroid heating air to >10000 K. N₂ and O₂ dissociation/ionization. Shock standoff distance: ~10× meteoroid radius. Rendered as compressed arc ahead of head, color: blue-white #D0D0FF (excited N₂ second positive system). Width: ~0.01× trail width. Only visible on zoomed-in view of individual meteor. |
| Train Persistence | Persistent Train | uPersistentTrain | OFF | Glowing wake lasting seconds to minutes after bright fireball (magnitude < -2). Chemiluminescence from metallic oxides (FeO, MgO, NaO). Color: #60D080 initially (green, FeO/MgO), shifting to #D08050 (orange-red, Na afterglow) over 10–60 seconds. Train becomes twisted by upper atmospheric winds, distorting into complex shapes. FBM turbulence: 4 octaves, freq 2.0, animated drift. |
| Train Persistence | Wind Shear Distortion | uWindShear | OFF | Persistent train deformed by mesospheric wind shear. Train bends, kinks, and develops billow instabilities over 10–300 seconds. Kelvin-Helmholtz wave formation visible on train edges. Wind speed differential: 10–50 m/s per km altitude. Animated deformation of initially straight train into S-curves and spirals. |
| Parent Body Context | Parent Comet Visualization | uParentComet | OFF | Parent body rendered at current orbital position: comet nucleus with coma if near perihelion. Orbital path coincident with stream center. Shows physical connection between comet and meteor shower. Comet nucleus #4A3A2A, coma #D0D8E0 (if active). Comet and stream share same orbit within dispersion. Size exaggerated for visibility. |
| Parent Body Context | Earth-Stream Intersection | uEarthIntersection | OFF | Zoomed-out view showing Earth's orbit crossing debris stream tube. Intersection geometry determines shower duration (days to weeks) and peak timing. Earth's orbital velocity component through stream determines entry speed. Rendered: Earth orbit #4A8AFF, stream tube, intersection zone highlighted #FF8040. Calendar date markers along Earth orbit. |
| Camera | Sky View (Ground Observer) | uCameraMode | ON | Default view: ground-based perspective looking up at night sky with radiant near center. Meteors streak outward from radiant across FOV. Star field background with constellation stick-figures. Dark adapted (no light pollution). FOV 100° (naked-eye experience). Rate: ZHR-scaled. Most natural/immersive viewing mode. |
| Camera | Orbital Mechanics View | uCameraMode | OFF | View from above ecliptic plane showing Earth, stream tube, and parent body orbit. Scale: 2 AU field width. Earth shown crossing through stream. Demonstrates geometry of meteor shower occurrence. Educational perspective. |
| Camera | Time Speed Multiplier | uTimeSpeed | 1x | Real-time meteor observation. 1 second = 1 second. Meteors cross sky in 0.2–3 seconds (true speed). ZHR determines frequency. For shower context: speed up to 60× to compress 1-hour session into 1 minute. |

---

### Dwarf Planet (Ceres-Type)

**Entity ID:** ENT-4031
**Description:** Intermediate body large enough for hydrostatic equilibrium (roughly spherical, D > 400 km) but not having cleared its orbital neighborhood — occupying the classification between asteroid and planet. Unlike icy dwarf planets (Pluto already specified), Ceres-type represents rocky/hydrated dwarf planets in the inner Solar System asteroid belt. Surface: dark (#6A6A70 mean albedo 0.09), water-ice rich subsurface, widespread phyllosilicate clay minerals, ammoniated minerals (indicating formation beyond snow line or ammonia-rich ice incorporation), localized bright salt deposits (sodium carbonate, Na₂CO₃) with albedo up to 0.5. Evidence of past and possibly ongoing aqueous geochemical activity. Real exemplars: 1 Ceres (only inner solar system dwarf planet, Dawn mission), potentially 4 Vesta (differentiated but not perfectly round).

**Section Count:** 8 (Surface Composition, Bright Spots & Cryovolcanism, Geological Features, Internal Structure, Thin Exosphere, Dust Environment, Thermal Properties, Camera)
**Feature Count:** 26

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Surface Composition | Dark Phyllosilicate Surface | uPhyllosilicateSurface | ON | Dominant surface material: Mg-serpentine and NH₄-bearing phyllosilicates (ammoniated clays). Very dark: albedo 0.09, color #6A6A70 (dark neutral gray with slight blue tint from magnetite). Globally homogeneous at large scales — aqueous alteration affected entire body. FBM texture: 7 octaves, freq 3.0, gain 0.45. Smooth at large scales (relaxed topography). |
| Surface Composition | Carbon-Rich Dark Material | uCarbonDarkMaterial | ON | Organic-rich surface component contributing to low albedo. Distributed globally but concentrated in specific regions. Color: #3A3A40 (very dark, carbon-bearing). 20–50% organic matter by mass in surface regolith. Similar to carbonaceous chondrite CI/CM meteorites. Organic detection by Dawn VIR spectrometer confirmed. Blended with phyllosilicate base via multiplicative overlay. |
| Surface Composition | Ammoniated Mineral Signature | uAmmoniatedMinerals | OFF | NH₄-bearing species detected globally — unusual, implies formation in outer solar system or incorporation of ammonia-rich ice. Color shift: #6A6A78 (slightly bluer than pure phyllosilicate). Spectral feature at 3.06 μm. Visualization: subtle blue-tinting overlay on surface at opacity 0.1. Key constraint on Ceres' formation location. |
| Bright Spots & Cryovolcanism | Occator Bright Deposits | uOccatorBrights | ON | Cerealia Facula and Vinalia Faculae — brilliant salt deposits (sodium carbonate, Na₂CO₃) within 92-km Occator crater. Central bright spot: albedo 0.5 (6× surrounding terrain), color #E8E0D0 (warm white). Diameter ~15 km central dome (Cerealia) + scattered smaller faculae. The brightest features on any asteroid-belt body. Emission factor 0.0 (reflected light only, not self-luminous). |
| Bright Spots & Cryovolcanism | Distributed Bright Spots | uDistributedBrights | ON | 130+ additional bright spots across Ceres' surface, mostly crater-associated. Albedo 0.1–0.3 (bright relative to 0.09 background). Color: #C8C0B0 to #D8D0C0. Diameter 1–10 km each. Concentrated in young craters, suggesting excavation of subsurface briny material or impact-triggered cryovolcanic emplacement. Voronoi-distributed, 15–30 visible at viewing resolution. |
| Bright Spots & Cryovolcanism | Ahuna Mons Cryovolcano | uAhunaMons | ON | Isolated mountain: 4 km tall, 17 km base, steep flanks (30–40° slope). Cryovolcanic dome — extruded briny mud/salt slurry from subsurface. Surface: bright streaks #C8B8A0 (salt deposits) on dark flanks #5A5A60. Morphologically similar to terrestrial volcanic domes. Age: ~200 Myr (geologically young). Summit: flattened, possible caldera depression 2 km across. |
| Bright Spots & Cryovolcanism | Seasonal Haze/Exosphere | uSeasonalHaze | OFF | Transient haze detected above Occator bright spots (Dawn observations). Water vapor sublimating from exposed ice/salt deposits when sunlit. Extremely thin: column density ~10¹⁶ cm⁻². Rendered as faint localized haze #D0D0E0, opacity 0.01, altitude 0–20 km above faculae. Only present on sunlit faculae. Diurnal variation. |
| Geological Features | Impact Crater Population | uCraterPopulation | ON | Crater-saturated surface with deficit of large (D > 100 km) craters relative to expectation — evidence of viscous relaxation erasing ancient basins. Visible craters: 20–50 at rendering resolution, diameter 5–280 km (Kerwan, largest). Fresh craters: sharp rims #7A7A80, floors darker #5A5A60. Degraded craters: subdued rims, infilled. Depth/diameter ratio 0.08–0.12 (shallow, relaxed). |
| Geological Features | Viscous Relaxation | uViscousRelax | OFF | Large craters and topography flattened over time by ice-rich subsurface flowing under gravity. Effect strongest for D > 100 km craters — Ceres "missing" several expected large basins. Visualization: overlay showing expected vs actual topographic relief. Fresh crater profile vs relaxed profile comparison. Relaxation timescale: ~10⁸–10⁹ yr for 100 km features. |
| Geological Features | Linear Features & Fractures | uLinearFeatures | ON | Crater-associated and regional fracture systems. Radial fractures around large impacts, concentric grabens. Width 1–5 km, length 10–100 km. Color: #505060 (shadow in fracture). Associated with subsurface stress from impacts and possible tectonic adjustment. 20–40 linear features visible. Line noise: freq 6.0, amp 0.01. |
| Geological Features | Smooth Crater Floors | uSmoothFloors | OFF | Several craters have anomalously smooth floors — possible cryolava/brine infill. Floor albedo slightly higher than rim: #707078. Smooth texture contrast with rough crater walls. Most prominent in young large craters. Evidence: spectral signature of hydrated sodium carbonate on smooth floors. Indicator of subsurface liquid mobilization. |
| Internal Structure | Differentiated Interior Cutaway | uInteriorCutaway | OFF | Cross-section showing layered interior: thin regolith (0–10 km, dark), ice-rich crust (10–40 km, #8890A0), briny muddy mantle (~40–400 km, #5A6A7A), possible rocky-metalite core (~50–200 km radius, #A08060). Not fully differentiated — gradient rather than sharp layers. Residual liquid brine pockets in mantle layer. Educational visualization. |
| Internal Structure | Subsurface Brine Reservoir | uBrineReservoir | OFF | Deep brine reservoir beneath Occator region, depth ~35–40 km. Composition: water + dissolved salts (NaCl, Na₂CO₃, NH₄Cl). Temperature: ~250–270 K (above eutectic freezing point of brine). Rendered in cutaway as liquid pocket #4A6A8A, connecting to surface via conduit channels. Dawn gravity data suggests regional density anomaly consistent with liquid. |
| Thin Exosphere | Water Vapor Exosphere | uWaterExosphere | OFF | Tenuous water vapor exosphere detected by Herschel (2014). Column density ~10¹⁶ cm⁻². Source: sublimation from bright spot ice exposures. Sputtering by solar wind ions. Rendered as ultra-thin shell #C0C8D0, opacity 0.005, scale height ~20 km. Concentrated above sunlit bright spots. Loss rate: ~6 kg/s. Marginal detection — at limit of observability. |
| Thin Exosphere | Sputtered Particle Envelope | uSputteredParticles | OFF | Solar wind ion sputtering removing surface atoms. Creates extended neutral atom envelope (Na, K, Ca detected around some asteroids). Extremely tenuous — rendered as faint glow #D0C8B0, opacity 0.003, extending ~100 km. Directional: anti-sunward tail from radiation pressure on sputtered atoms. |
| Dust Environment | Ejecta Dust Halo | uEjectaDustHalo | OFF | Micrometeorite impact-generated dust cloud around Ceres. Dust lofted to ~100 km, residence time hours–days. Extremely tenuous: optical depth ~10⁻¹⁰. Rendered as faint haze #A0A0A0, opacity 0.002 (exaggerated for visibility). Asymmetric: enhanced in apex direction of Ceres' heliocentric motion. |
| Thermal Properties | Surface Temperature Map | uSurfaceTempMap | OFF | Diurnal temperature variation: subsolar point ~235 K, terminator ~170 K, night side ~100 K. Rendered as color overlay: warm #4A2A0A (subsolar), cold #1A1A2A (night). Seasonal variation from 3° axial tilt. Poles permanently cold: < 110 K, potential cold-trap ice reservoirs. Thermal inertia: 15 J m⁻² K⁻¹ s⁻¹/² (fine regolith). |
| Thermal Properties | Permanently Shadowed Craters | uPermanentShadow | OFF | Polar crater floors in permanent shadow: T < 110 K. Water ice directly detected in several shadowed craters by Dawn (Juling, Oxo). Ice patches #D0D8E0 on shadowed crater floors. Coverage: small fraction of crater floor area. Slow sublimation vs deposition equilibrium. Analog to lunar permanently shadowed regions. |
| Camera | Dawn Approach View | uCameraMode | ON | Default view mimicking Dawn spacecraft approach: ~3 Rp distance, sunlit hemisphere. Shows global surface character, prominent craters, and bright spots. Phase angle ~20°. FOV 45°. Emphasizes contrast between dark surface and brilliant Occator faculae. |
| Camera | Occator Close-Up | uCameraMode | OFF | Zoomed to Occator crater, ~300 km altitude. Fills frame with 92-km crater showing central bright dome (Cerealia Facula), scattered bright spots (Vinalia), and smooth floor deposits. Dramatic contrast. FOV 35°. |
| Camera | Time Speed Multiplier | uTimeSpeed | 200x | 1 real second = ~3 hours. Rotation period 9.07 hours visible in ~3 seconds. Seasonal haze variation, thermal cycling, and illumination changes observable. Orbital period 4.6 years far too slow for visible orbital motion. |

---

### 10.10 Oort Cloud

**Entity ID:** ENT-4034
**Base Mesh:** Spherical shell particle distribution (point cloud, 10⁴–10⁵ particles representing 10¹¹–10¹² objects)
**Shader Type:** Fragment (particle cloud + gravitational boundary + stellar perturbation)
**Exemplar:** Theoretical (Jan Oort 1950), inferred from long-period comet orbits; Sedna (inner Oort Cloud candidate)

The Oort Cloud is a vast, roughly spherical shell of icy planetesimals surrounding the solar system at distances of 2,000–200,000 AU (0.03–3 ly). Never directly observed as a population, it is inferred from the isotropic distribution of long-period comet orbital inclinations and the need for a reservoir to replenish dynamically short-lived comets. Estimated population: 10¹¹–10¹² objects with total mass 1–10 M⊕. The inner Oort Cloud (Hills Cloud, 2,000–20,000 AU) is denser and disk-like; the outer cloud (20,000–200,000 AU) is spherically distributed. Stellar passages and galactic tidal forces perturb objects into the inner solar system as long-period comets.

| Section | Feature | Uniform Name | Default | Description |
|---------|---------|-------------|---------|-------------|
| Structure | Outer Spherical Shell | uOuterShell | ON | Spherically distributed population: 20,000–200,000 AU. Isotropic — comets arrive from all sky directions equally. Rendered as sparse point cloud: ~10,000 particles, uniform angular distribution. Particle color: icy #C8D8E8, alpha 0.02 per particle. Density: ~1 object per ~10 AU³ (extraordinarily sparse). Outer boundary: ~100,000–200,000 AU where solar gravity equals galactic tidal force (Hill sphere of Sun). |
| Structure | Inner Hills Cloud | uHillsCloud | ON | Denser inner component (Hills Cloud): 2,000–20,000 AU. More disk-like (inclination ±30° of ecliptic). 5–10× denser than outer cloud. Rendered as flattened distribution #C8D0D8, alpha 0.03. Particle count: ~10⁴ rendered (representing 10¹² actual). This component is dynamically decoupled from outer cloud — requires stronger perturbation to inject comets into inner solar system. Sedna (a ~ 500 AU, q ~ 76 AU) may be inner Oort member. |
| Structure | Density Radial Profile | uDensityProfile | OFF | Number density: n(r) ∝ r^(−3.5) (outer cloud). Visualization: density color map on meridional slice. Transition zone: ~20,000 AU where disk-like inner meets spherical outer. Total mass: 1–10 M⊕ (mostly ice+rock). Individual object mass: 10¹²–10¹⁸ kg (1–100 km diameter). Objects too far apart to interact: mean separation ~10⁶ km. |
| Objects | Individual Icy Bodies | uIcyBodies | ON | Comet nuclei: 1–50 km diameter, composition similar to KBOs. Albedo: 0.02–0.10 (very dark). Color: #5A5A60 (dark ice/organics). Too small and far to resolve individually — rendered as point particles. Composition: H₂O, CO, CO₂, organics, silicates (primordial material from solar nebula, ~4.5 Gyr unchanged). Temperatures: 4–10 K (barely above CMB). |
| Objects | Sedna-Type Inner Cloud Objects | uSednaType | OFF | Extreme trans-Neptunian objects with perihelia > 50 AU: Sedna (q=76 AU, a=506 AU), 2012 VP₁₁₃. Too tightly bound for outer Oort Cloud — inner cloud or fossil scattered disk. Rendered as highlighted particles #FF8060 at specific positions. Currently 2–3 known. Discovery of more would constrain inner Oort Cloud mass and structure. Orbits: highly eccentric, i ~ 12–24°. |
| Perturbations | Galactic Tidal Perturbation | uGalacticTide | ON | Differential galactic gravitational field: primary mechanism torquing Oort Cloud orbits. Tidal force: F_tide = 4πGρ_gal × r (proportional to distance from Sun). At ~50,000 AU: tidal force ~ solar gravity. Perihelion precession: q decreases until object enters inner solar system. Rendered as tidal field arrows #6A8AAA showing differential force across cloud. Preferred injection from galactic poles. |
| Perturbations | Stellar Flyby Perturbation | uStellarFlyby | OFF | Passing stars (~10 within 1 pc per Myr) perturb cloud. Close passage (< 0.5 pc): shower of comets injected into inner solar system. Rendered: passing star trajectory #FFE0A0, perturbed orbits highlighted in #FF6040. Gliese 710 will pass within ~10,000 AU in ~1.3 Myr — potential major perturbation. Rendered as approaching star with cone of influence. |
| Perturbations | Comet Injection Trajectory | uCometInjection | ON | Long-period comet (LPC) orbit: a ~ 10,000–100,000 AU, highly eccentric (e > 0.999). Rendered: single representative trajectory from cloud to inner solar system #40C8FF, showing extreme ellipse. Travel time: ~10⁶ yr from cloud to perihelion. Perihelion: 0.5–5 AU. This connects the distant cloud to observable comets. ~7 new LPCs per year reach q < 2 AU. |
| Boundaries | Solar Hill Sphere | uSolarHillSphere | OFF | Gravitational sphere of influence: R_Hill ~ 1–2 ly (100,000–200,000 AU). Beyond this: objects escape to interstellar space. Rendered as wireframe sphere #6A6A8A, dashed. Objects near boundary: marginally bound, easily lost to passing stars. Cloud gradually transitions to unbound interstellar population at boundary. Milky Way tidal field defines this limit. |
| Scale | Solar System Scale Context | uSolarSystemScale | ON | Scale comparison: Neptune orbit (30 AU) shown as tiny dot at center. Kuiper Belt (30–50 AU): barely visible ring. Inner Oort Cloud begins at ~2,000 AU. Outer Oort Cloud extends to ~100,000 AU. Alpha Centauri: ~270,000 AU. Visualization demonstrates vast emptiness — solar system's gravitational dominion extending 40% of the way to nearest star. |
| Camera | Standard View | uCameraMode | ON | Default: full cloud visible as spherical haze of particles. Sun as bright point at center. Scale bar: 10,000 AU. Inner/outer cloud visible as density gradient. Ecliptic plane marked. Nearest stars annotated at frame edge. Sparse, ghostly appearance — reflecting the theoretical nature. |
| Camera | Cross-Section View | uCameraMode | OFF | Meridional slice: density structure revealed. Inner disk-like component + outer spherical component. Color: density mapping from sparse outer #1A1A2A to denser inner #4A5A6A. Comet injection trajectories shown as inward-plunging paths. Galactic tidal vector indicated. |
| Camera | Time Speed Multiplier | uTimeSpeed | 10⁶ yr/s | At default: stellar flybys occur every ~0.1 seconds (one per ~10⁵ yr). Comet injection visible as occasional inward trajectory. Cloud precession under galactic tide: very slow. Individual object orbital periods: 10⁵–10⁷ yr. Cloud is quasi-static on shorter timescales. |

---

### 10.11 Zodiacal Light / Interplanetary Dust Cloud

**Entity ID:** ENT-4036
**Base Mesh:** Flattened disk (ecliptic plane) + diffuse volumetric scattering
**Shader Type:** Fragment (Mie scattering + thermal emission + resonant ring structure)
**Exemplar:** Zodiacal light (naked-eye observable), Gegenschein, Earth's co-orbital dust ring, IRAS/COBE/JWST zodiacal observations

The zodiacal dust cloud is a flattened disk of interplanetary dust particles (1–300 μm) extending from near the Sun to beyond Mars orbit, concentrated in the ecliptic plane. It produces the zodiacal light — a faint, diffuse triangular glow visible before dawn or after dusk along the ecliptic, caused by sunlight scattered off these particles. The Gegenschein (counterglow) is an enhancement at the antisolar point from backscattering. Sources: asteroid collisions (~90%), Jupiter-family comets (~10%). The cloud is continuously replenished as particles spiral sunward via Poynting-Robertson drag (lifetime ~10⁵ yr for 100 μm particles). JWST's NIR observations are dominated by zodiacal foreground, making it both a nuisance and a subject of study.

| Section | Feature | Uniform Name | Default | Description |
|---------|---------|-------------|---------|-------------|
| Dust Distribution | Main Zodiacal Disk | uZodiacalDisk | ON | Flattened dust disk: concentrated within ±10° of ecliptic plane. Radial extent: 0.1–3.5 AU (peak density ~1–2 AU). Number density: ~10⁻²⁰ g/cm³ at 1 AU. Rendered as diffuse glow #FFF0D0, alpha 0.04, concentrated in ecliptic. Surface brightness: ~22 mag/arcsec² at elongation 90° (300× fainter than Milky Way). FBM smoothness: 2-octave, freq 0.5, amplitude 0.02 (very smooth). |
| Dust Distribution | Inclination & Symmetry Plane | uDustPlane | ON | Dust cloud symmetry plane: inclined 1.5°–3° from ecliptic (intermediate between ecliptic and invariable plane). Warp: inner cloud tilted toward Jupiter's orbital plane. Rendered as slightly tilted disk. Solar offset: cloud center displaced ~0.01 AU from Sun due to planetary perturbations. Extremely smooth — no discrete structures at large scale. |
| Dust Distribution | Solar F-Corona Extension | uFCorona | OFF | Innermost dust: F-corona (Fraunhofer corona) from ~4 R☉ to ~0.3 AU. Dust sublimation zone: T > 1500K, creates dust-free zone inside ~4 R☉. F-corona brightness: exceeds K-corona (electron scattering) beyond ~5 R☉. Color: #FFF8E0 (scattered photospheric light). Parker Solar Probe observations: dust density increase and then depletion near Sun. |
| Scattering | Forward-Scattered Zodiacal Light | uZodiacalGlow | ON | Classic zodiacal light: triangular glow extending 60°–90° from Sun along ecliptic. Brightest near Sun (elongation 20°–30°). Color: solar-spectrum #FFF0D0 (forward Mie scattering preserves solar color). Brightness: ΔμV ~ 23–24 mag/arcsec² at 45° elongation. Seasonal visibility: best at equinoxes when ecliptic is steep relative to horizon. Observable naked-eye from dark sites. |
| Scattering | Gegenschein (Counterglow) | uGegenschein | ON | Diffuse brightening at antisolar point (elongation 180°): ~10° diameter patch. Caused by backscattering (opposition effect) from particles near 1 AU. Brightness: ~1.5× zodiacal background at same elongation. Color: #FFF0D0 (identical to zodiacal light). Combined with zodiacal band (faint connection along ecliptic at 120°–180°). Subtle but confirmed by COBE/DIRBE. |
| Scattering | Zodiacal Band | uZodiacalBand | OFF | Faint continuous glow along entire ecliptic: connects zodiacal light (near Sun) to Gegenschein (antisolar). Surface brightness: ~24–25 mag/arcsec² (extremely faint). Color: #FFF0D0. Detectable photometrically but rarely visible to eye. Complete 360° ring of scattered light. COBE/DIRBE mapping provides definitive measurement. |
| Thermal Emission | Mid-IR Thermal Glow | uThermalIR | OFF | Warm dust thermal emission: peak at ~10–25 μm (T ~ 260K at 1 AU). IRAS 25 μm: zodiacal emission dominates mid-IR sky. Color false-color: #FF8A40. Emission bands: silicate 10 μm feature detected. JWST NIRCam/MIRI: zodiacal foreground is primary noise source, must be modeled and subtracted. Spatial structure: smooth, follows dust distribution. |
| Structure | Asteroid Dust Bands | uAsteroidBands | OFF | IRAS discovery: 3 narrow dust bands at ecliptic latitudes ±1.4°, ±2.1°, ±9.3° associated with asteroid families (Eos, Koronis, Themis). Brightness enhancement: ~5–10% above smooth zodiacal. Rendered as thin bright rings #FFE8C0 slightly above/below ecliptic. Origin: collisional debris from asteroid family-forming events. Structure persists for ~10⁶ yr. |
| Structure | Earth's Co-orbital Dust Ring | uEarthDustRing | OFF | Gravitational focusing: Earth's gravity creates ~10% dust density enhancement in co-orbital ring at 1 AU. Ring leads Earth by ~60° (gravitational wake). Detected by COBE/DIRBE. Rendered as slight brightness enhancement #FFF0D0 along Earth's orbit. Similar rings at Venus and Mars orbits (less well-characterized). |
| Dynamics | Poynting-Robertson Inspiral | uPRDrag | OFF | Particles spiral sunward due to radiation pressure asymmetry. Inspiral time: t_PR ~ 700 × (s/1μm) × (r/1AU)² years. 100 μm particle at 1 AU: ~7×10⁴ yr. Rendered: representative particle trajectories spiraling inward #C8B080. Cloud must be continuously replenished — total mass loss rate ~10⁴ kg/s. Sources: asteroid collisions + cometary activity. |
| Dynamics | Radiation Pressure Blowout | uRadiationBlowout | OFF | Particles < 0.5 μm: radiation pressure exceeds gravity → blown out of solar system on hyperbolic orbits. β = F_rad/F_grav > 0.5 for small grains. Creates β-meteoroid flux streaming outward. Rendered as outward particle stream #D8C890. These particles contribute to interstellar dust. Size distribution: ~r^(−3.5) power law, modified by blowout cutoff. |
| Context | Solar System Planets | uPlanetPositions | ON | Planet positions marked for scale: Mercury through Mars (main dust zone). Jupiter (source of JFC comets). Asteroid belt at 2.3 AU. Earth at 1 AU (observer position). Rendered as labeled points. Demonstrates that zodiacal cloud fills the inner solar system — we live immersed in it. |
| Camera | Standard View | uCameraMode | ON | Default: ecliptic plane edge-on, Sun at center. Zodiacal glow extending along ecliptic. Planet positions marked. Gegenschein at antisolar point. Scale bar: 1 AU. Faint, diffuse appearance — demonstrates the subtle beauty of this naked-eye phenomenon. |
| Camera | Observer Ground View | uCameraMode | OFF | Simulated naked-eye view from Earth's surface: triangular zodiacal light extending from horizon along ecliptic after sunset. Stars visible through it. False dawn appearance. Gegenschein as faint patch overhead. Atmospheric extinction at horizon. Approximates actual visual experience. |
| Camera | Time Speed Multiplier | uTimeSpeed | 30 days/s | At default: Earth's orbital motion visible — zodiacal light cone shifts relative to background stars. Seasonal geometry changes. Particle inspiral (PR drag) too slow to see even at this speed. Gegenschein tracks antisolar point as Earth orbits. Annual cycle visible in ~12 seconds. |

---

## 11. Exotic Objects

Exotic objects encompass rare or extreme astrophysical phenomena. Magnetars are neutron stars with the most extreme magnetic fields in the universe; binary star systems show complex gravitational and mass-transfer dynamics; protoplanetary disks are the cradles of planet formation around young stars.

### Magnetar

**Entity ID:** ENT-8010
**Description:** Ultra-dense neutron star with extreme magnetic field (10^15 Tesla, 10^12× Earth's field), starquake events, giant flares, magnetosphere tearing, and visible hot polar caps. Surface color #FFFAF0 tan, magnetosphere intensity map #FFD700 (yellow) to #FF3030 (red). Real exemplars: SGR 1806-20, 4U 0142+61, AXP 1E 1048.1-5937.

**Section Count:** 9 (Compact Surface & Crust, Extreme Magnetic Field Geometry, Starquake Bursts, Giant Flares, Magnetosphere Distortion, Twisted Magnetic Field Lines, Polar Cap Hotspots, Pulsar Wind Nebula, SGR/AXP Activity Modes, Camera)
**Total Feature Count:** 28

#### Compact Surface & Crust (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Surface | Neutron Star Surface (10 km radius) | uSurface | ON | Ultra-dense neutron star, typical radius ~10-15 km, mass 1.4-2.0 solar masses. Surface color: tan-gray #FFFAF0, representing iron crust. FBM 4-octave (freq 30.0, amplitude 0.12) for surface roughness. Shader: Lambertian + subtle specular highlights. Extremely compact. |
| Surface | Crustal Plates & Cracks | uCrustalPlates | ON | Outer crust (iron-nickel), ~1 km thick, under extreme pressure and magnetic stress, forming fracture patterns. Rendered via thin dark line network (Voronoi-like, freq 80.0) representing cracks, color #4A3A3A. Shader: sparse line overlay. Shows crustal stress. |
| Surface | Magnetic Field Induced Distortion | uMagDistortion | ON | Extreme magnetic field distorts electron distributions in crust, creating visible anisotropy. Rendered via directional texture modulation aligned with magnetic field axis (strongest along poles). Shader: apply anisotropic texture sampling along B-field direction. Subtle but present. |
| Surface | Temperature Gradient (Hot Poles) | uTempGradient | ON | Surface temperature ~10^6 K at poles (hottest), dropping toward equator. Rendered via latitudinal color gradient: poles warmer-toned #E0A080, equator cooler #C8A880. Shader: latitude-dependent color ramp. Shows thermal structure. |

#### Extreme Magnetic Field Geometry (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| MagField | Dipole Magnetic Field Lines | uMagFieldLines | ON | Magnetar's magnetic field is dipolar (like neutron stars generally), but field strength extreme: ~10^15 Gauss = ~10^11 Tesla at surface (~10^19× Earth's field). Field lines rendered as glowing yellow #FFD700 to red #FF3030 gradient based on field strength magnitude. Line width modulated by log(B). Shader: parametric dipole B-field, intensity-weighted line rendering. Dominates visual appearance. |
| MagField | Magnetic Reconnection Zones | uReconnection | ON | Regions of complex field-line crossing (null points), where magnetic energy dissipates. Rendered as bright white-blue #FFFFFF to #7FAFD8 glowing hotspots scattered along field structure. Sparse stochastic placement (freq 100.0, ~8-12 hotspots). Alpha 0.25-0.35. Shader: additive bright glow overlays. |
| MagField | Poloidal-Toroidal Field Interaction | uToroidalField | ON | Magnetars may have tangled toroidal field components (twisted field lines), not just simple dipole. Rendered via additional twisted field-line geometry overlaid on dipole, creating helical patterns. Color: purple-blue #6A4FA8. Frequency multiplier ~3-4× dipole patterns. Shader: superposed helical field visualization. Represents complex topology. |
| MagField | Field Line Braiding & Tangles | uFieldTangles | ON | Extreme stress causes field lines to braid and tangle, creating 3D complex geometry. Rendered via sinusoidal modulation of field lines (amplitude 0.20, freq 10.0 along field-line path), creating wavy/braided appearance. Shader: parametric field line with modulation. Shows dynamic field stress. |

#### Starquake Bursts (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Starquake | Starquake Flash Burst | uStarquake | ON | Sudden energy release from crust fracturing (starquakes), releasing ~10^37–10^41 J (enormously energetic crustal fracturing events). Rendered as brief intense white #FFFFFF flash lasting ~0.1-0.5 seconds, with rapid expansion shockwave. Brightest at epicenter (random location on surface), brightness decays radially. Triggered stochastically (frequency ~0.001 Hz = once per 1000 seconds = ~17 minutes). Shader: time-based bright flash, radial Gaussian fade. |
| Starquake | Energetic Particle Precipitation | uParticlePrecip | ON | Starquake releases relativistic particles into magnetosphere, visible as energetic radiation glow. Rendered as blue-white precipitation streaks #A8D8F0 streaming outward from epicenter, fading away. FBM 2D radial (freq 80.0, amplitude 0.10). Alpha 0.20-0.30. Shader: additive precipitation overlay, radial origin. Shows energetic aftermath. |
| Starquake | Magnetic Field Line Restructuring | uFieldRestructure | ON | Post-starquake, magnetic field lines rearrange to new configuration. Rendered as rapid morphing of field line geometry (transition over 0.5-1 second) after starquake event. Field strength briefly elevated (brightness +20%), then returns to normal. Shader: time-dependent field line geometry interpolation. Shows field dynamics post-quake. |

#### Giant Flares (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Flare | Giant Flare Mega-Burst | uGiantFlare | OFF | Rare "giant flare" events (only ~3 observed in modern era), releasing ~10^38–10^40 J in ~0.1 second (SGR 1806-20 released ~2×10^39 J). Renders as extremely bright white #FFFFFF explosion lasting 0.2 seconds, more intense than starquake. Brightness peaks at ~10× normal surface brightness. Triggered manually (off by default, rare event). Shader: ultra-bright additive flash, extreme intensity. Represents event like SGR 1806-20 December 2004 flare. |
| Flare | Flare-Induced Magnetosphere Disruption | uFlareDisrupt | OFF | Giant flare disrupts magnetosphere dramatically, field lines blown away and restructured. Rendered as field line vanishing/reforming animation (field intensity drops to ~0.1× normal over 0.1 s, recovers over 1 s). Magnetosphere briefly becomes very dim. Off by default. |
| Flare | Energetic Burst Radiation | uBurstRad | OFF | Giant flare emits energetic X-rays/gamma rays (Bursts reaching Earth detectable, represent strongest radiation source briefly observed). Rendered as intense multi-directional radiation streaks #FFD700 → #FF3030 shooting outward in all directions. Alpha 0.40-0.60. Off by default. |

#### Magnetosphere Distortion (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Magnetosphere | Magnetosphere Confined Geometry | uMagConfinement | ON | Extreme magnetic pressure confines plasma tightly near star, creating compact magnetosphere. Rendered via field lines constrained close to surface (no long extension like solar corona). Field transition sharply from bright near star to dim far. Shader: inverse-square falloff of field visualization intensity. Shows extreme confinement. |
| Magnetosphere | Magnetosphere Tearing & Reconnection Events | uMagTearing | ON | Ongoing magnetic reconnection throughout magnetosphere, tearing field lines and releasing energy. Rendered as thin blue-white #A8D8F0 bright streaks representing tearing events scattered throughout field region. Sparse stochastic placement (freq 100.0, ~15-20 streaks), fading/renewing over time. Shader: additive reconnection glow overlay. Dynamic appearance. |
| Magnetosphere | Pulsar Wind Interaction (if active) | uPulsarWind | ON | If magnetar is rotating (or even slowly rotating), relativistic wind expands into magnetosphere. Rendered as expanding shell from magnetar, glowing yellow-orange #FFD700 → #FF9050. Radius growing slowly, constant refresh rate (outer edge expands ~0.1 Rn per second). Shader: expanding spherical shell with additive glow. |

#### Twisted Magnetic Field Lines (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Twisted | Helical Field Line Winding | uHelicalField | ON | Field lines exhibit twist/helicity due to crust rotation and magnetic stress, creating helical/spiral patterns. Rendered via field lines that coil around rotation axis (helical pitch ~0.5 Rn per rotation). Color modulation: bright at top of helix, darker at bottom (directional shading). Shader: parametric helical field geometry with height-dependent brightness. Shows twist structure. |
| Twisted | Field Line Discontinuities & Jumps | uFieldJumps | ON | Abrupt field direction changes at certain surfaces (discontinuities in field topology). Rendered as thin bright boundaries #F0F0F0 between different field regions, separating regions of opposite field direction. Sparse placement, ~5-8 major discontinuities. Shader: thin bright boundary lines. Shows topology complexity. |

#### Polar Cap Hotspots (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Poles | Polar Cap Thermal Hotspots | uPolarCaps | ON | Magnetic poles concentrate heat, temperature reaches 10^6 K, appearing as bright orange-red #FF6050 spots at poles (area ~1% of surface area each pole). FBM 3-octave (freq 50.0, amplitude 0.10) for internal structure. Alpha 0.40-0.50. Shader: polar-centered bright color overlay with Gaussian falloff. Visible heating concentration. |
| Poles | Polar Cap Particle Acceleration | uPolarAcc | ON | Intense magnetic field at poles accelerates particles, creating visible glow from bremsstrahlung radiation. Rendered as blue-white acceleration glow #A8D8F0 surrounding polar caps, radius ~2× cap size. Alpha 0.20-0.30. FBM 4-octave (freq 40.0, amplitude 0.08). Shader: additive glow halo around poles. Shows particle acceleration region. |

#### Pulsar Wind Nebula (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Nebula | Surrounding Supernova Remnant (if young) | uSNR | ON | If magnetar is young (<10,000 years), surrounded by expanding supernova remnant nebula. Rendered as large glowing shell structure (radius ~5-10 Rn) with filamentary structure, color blue-cyan #4AAFDF. FBM 6-octave (freq 20.0, amplitude 0.12) for ragged edges. Alpha 0.20-0.30. Shader: large spherical nebula with turbulent texture. Educational context. |
| Nebula | Nebula Expansion Motion | uNebulaMot | ON | Supernova remnant expands outward over time (observed expansion ~0.1-1% per year). Rendered as slowly expanding shell radius (radius increases linearly with time, ~0.05 Rn per second animation). Shader: dynamically-scaled nebula geometry. Shows ongoing expansion. |

#### SGR/AXP Activity Modes (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Activity | Soft Gamma Repeater Mode (SGR) | uSGRMode | ON | SGRs emit recurring bursts (Soft Gamma-ray Repeaters). Rendered as periodic flashing behavior: brightness pulses at ~0.1-1 Hz rate, amplitude ±30% from baseline. Flashes concentrated at pole regions. Shader: time-periodic modulation of glow intensity. Shows repeating transient behavior. |
| Activity | Anomalous X-ray Pulsar Mode (AXP) | uAXPMode | ON | AXPs (Anomalous X-ray Pulsars) spin-down rapidly and emit persistent X-ray emission. Rendered as constant elevated glow #FF9050 at low alpha 0.15, without repeated bursts (unlike SGR). Steady baseline. Shader: additive thermal-like glow layer. Distinct from SGR behavior. |

#### Camera (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Magnetosphere Overview | uCameraMode | ON | Default camera positioned at ~30 Rn distance, showing magnetar and surrounding field structure. FOV 55°. Shows magnetic field geometry prominently, surface detail visible. Locked rotation. |
| Camera | Polar Region Close-Up | uCameraMode | OFF | Zoomed to ~3 Rn, focused on magnetic pole region showing hotspots and field line convergence. FOV 40°. Rotated to emphasize pole structure. |
| Camera | Flare Event Drama View | uCameraMode | OFF | Dynamic camera synchronized with giant flare timing (if flare active), pulls back to ~50 Rn distance during flare for dramatic effect, zooms back in afterward. FOV varies 40-60°. Shows event context. |

---

### Binary Star System

**Entity ID:** ENT-8020
**Description:** Two stars in mutual orbit, separated by ~0.1-100 AU depending on type, exhibiting orbital mechanics, tidal distortion, potential mass transfer, accretion disks (if close), and Roche lobe geometry. Primary color #FFFEF5 yellow-hot to #FF6030 orange-cool. Real exemplars: Algol, Beta Lyrae, Mizar, Cataclysmic Variables, X-ray Binaries.

**Section Count:** 9 (Primary Star, Secondary Star, Orbital Mechanics & Kepler, Roche Lobe Geometry, Mass Transfer Stream (if close), Accretion Disk Structure, Tidal Distortion, Lagrange Points Visualization, Orbital Decay/GW Radiation, Camera)
**Total Feature Count:** 30

#### Primary Star (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Primary | Primary Star Type Selection | uPrimaryStar | ON | Primary star: user-selectable type (Main-sequence Hot/Cool, Giant, Supergiant, White Dwarf, etc.). For Hot primary (25,000 K): color #FFFEF5 yellow-white, radius ~5 Rsun. Cool primary (3,500 K): color #FF6030 orange-red, radius ~100 Rsun (if giant). Shader: temperature-dependent color mapping + Lambertian shading + limb darkening. Central visual reference. |
| Primary | Rotational Distortion | uPrimaryRotation | ON | Rapid rotation (especially if compact) causes centrifugal oblateness. Rendered as prolate spheroid (b/a ratio ~0.85-0.95 depending on rotation rate ω). Faster rotation = more distortion. Shader: ellipsoid geometry with axis ratios modulated by spin rate. Affects Roche lobe geometry. |
| Primary | Surface Features (Starspots/Granulation) | uPrimaryFeatures | ON | Surface texture: hot stars show granulation, cool stars show starspots. Rendered via FBM 5-octave (freq 40.0, amplitude 0.10) for fine convection pattern detail or large dark spots. Color variation ±5% around base. Shader: spatially-varying albedo texture. Adds realism. |
| Primary | Photospheric Glow & Limb Darkening | uPrimaryLimb | ON | Limb darkening: intensity darker near limb (cos(theta)^0.6 typical). Rendered via normalized cos-law falloff from center to edge. Glow: faint atmospheric layer at edge, color #FFFADB pale, alpha 0.08. Shader: view-angle-dependent darkening + limb glow overlay. Shows stellar atmosphere. |

#### Secondary Star (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Secondary | Secondary Star Type (Typically Smaller) | uSecondaryStar | ON | Secondary star: independent type selection. Often lower mass/luminosity than primary (e.g., K-dwarf orbiting F-star), or occasionally higher (e.g., black hole or white dwarf primary with red giant secondary). Color/size adjusted accordingly. Shader: temperature-dependent color + Lambertian shading. |
| Secondary | Orbital Position Animation | uSecondaryOrbit | ON | Secondary star animated to orbit primary in elliptical orbit (configurable eccentricity, semi-major axis). Orbital period user-tunable (1-1000 days range, scaled for visibility). Animated position updated per frame via Kepler orbit equations. Shader: world-space position update. Core binary interaction. |
| Secondary | Tidal Bulge Toward Primary | uSecondaryTide | ON | Secondary distorted by primary's gravity, forming tidal bulge pointing toward primary. Rendered as prolate ellipsoid elongation along star-star axis (~5-20% elongation depending on separation). Shader: ellipsoid geometry deformation along primary-secondary axis. Shows tidal coupling. |
| Secondary | Surface Hotspot (if tidally heated) | uSecondaryHot | ON | If secondary is very close (< Roche limit), tidal heating creates hotspot facing primary. Rendered as bright orange-red spot #FF7050 on face toward primary. Alpha 0.20-0.30, concentrated in substellar hemisphere. Shader: directional thermal glow. Shows tidal interaction. |

#### Orbital Mechanics & Kepler (4 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Orbit | Orbital Ellipse Visualization | uOrbitEllipse | ON | Draw visible orbit ellipse (thin yellow #FFD700 line) showing combined barycentric orbits (or individual orbits if labeled). Semi-major axis user-configurable (0.01-100 AU), eccentricity 0-0.95 range. Animated positions of stars placed on ellipse. Shader: parametric ellipse curve rendering. Shows orbital geometry. |
| Orbit | Orbital Period Display | uOrbitalPeriod | ON | Text overlay showing orbital period (1-1000 day range, or 1-100 year range depending on separation). Period relates to semi-major axis via Kepler's 3rd law (scaled). Educational. |
| Orbit | Orbital Velocity Vectors | uVelocityVectors | OFF | Optional: render velocity vectors at each star position (arrow indicators), direction tangent to orbit, length proportional to velocity magnitude. Color: cyan #4AAFDF. Off by default (optional educational overlay). |
| Orbit | Orbital Energy & Angular Momentum Labels | uOrbitalEnergy | OFF | Optional: text display of orbital energy, angular momentum, escape velocity. Off by default (advanced feature). |

#### Roche Lobe Geometry (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| RocheLobe | Primary's Roche Lobe | uRocheLobePrimary | ON | Roche lobe boundary (equipotential surface in rotating frame): teardrop-shaped surface surrounding primary, extending toward secondary. Rendered as wireframe mesh (cyan #4AAFDF lines) showing 3D geometry. Size determined by mass ratio and separation. Shader: parametric Roche lobe surface rendering, transparent wireframe overlay. Shows tidal boundary. |
| RocheLobe | Secondary's Roche Lobe | uRocheLobeSecond | ON | Secondary's Roche lobe: similarly teardrop-shaped, smaller if secondary is less massive. Rendered as separate wireframe mesh (magenta #D04FDF color to distinguish). Shows asymmetry due to mass ratio. Shader: parametric surface, transparent overlay. |
| RocheLobe | L1 Lagrange Point (Inner) | uL1Point | ON | L1 point: critical Lagrange point between stars, innermost gravitational equilibrium. Rendered as bright sphere marker #FFD700 yellow. Position calculated from mass ratio and separation. If secondary over-fills Roche lobe, mass transfer can cross L1. Shader: point geometry, glow effect. |

#### Mass Transfer Stream (if Close) (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| MassTransfer | Roche-Lobe-Filling Stream | uMassStream | ON | If secondary star fills (or overflows) its Roche lobe, material streams from secondary through L1 toward primary. Rendered as curved ribbon of glowing gas, color #FFA050 orange, width ~0.1 separation distance. Stream follows ballistic trajectory (Lagrangian/SPH-like curve). FBM 2D along stream (freq 60.0, amplitude 0.08) for turbulent appearance. Shader: ribbon geometry with additive glow overlay. Dramatic mass-transfer feature. |
| MassTransfer | Stream Density Waves | uStreamWaves | ON | Orbital motion causes stream to oscillate (spiral pattern). Rendered via sinusoidal modulation of stream path (amplitude ~0.05× separation, freq 3-5 Hz = orbital frequency). Shader: time-dependent stream geometry path. Shows density wave propagation. |
| MassTransfer | Stream Impact on Primary Surface | uStreamImpact | ON | Mass stream impacts primary's atmosphere/surface, creating hot impact spot. Rendered as bright white-orange glow #FFFFF0 at impact location (calculated as stream trajectory end-point on primary). FBM 2D local (freq 80.0, amplitude 0.12) for turbulent impact region. Shader: directional thermal glow at stream endpoint. Shows energy dissipation. |

#### Accretion Disk Structure (3 features)

| Section | Feature | Unsigned | Default | Description |
|---------|---------|---------|---------|-------------|
| Disk | Accretion Disk (if Present) | uAccretionDisk | ON | In close binaries with compact primary (white dwarf, neutron star) and mass transfer, accretion disk forms around primary. Rendered as thin equatorial torus (thickness ~0.1× outer radius), color gradient yellow-white #FFFFF0 (inner) to dark red #8F3030 (outer). FBM 5-octave (freq 50.0 azimuthal, 20.0 radial, amplitude 0.12) for turbulent structure. Shader: disk geometry with radial color gradient + turbulence. |
| Disk | Disk Accretion Hotspot | uDiskHotspot | ON | Inner edge of disk (innermost stable circular orbit ISCO if around black hole, or stellar surface if white dwarf) has hottest, brightest region. Rendered as bright yellow-white spot #FFFADB in disk plane, concentrated at inner edge. FBM 3-octave (freq 100.0, amplitude 0.10). Shader: high-brightness overlay at inner disk region. Shows energy concentration. |
| Disk | Disk Vertical Puffiness & Scale Height | uDiskHeight | ON | Accretion disk has vertical extent (scale height H/R ~0.1-0.3, decreases outward). Rendered as puffed-up torus geometry (thick inner, thin outer), not razor-thin disk. Shader: 3D torus geometry with realistic proportions. Shows hydrostatic structure. |

#### Tidal Distortion (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Tidal | Mutual Tidal Elongation | uTidalDistort | ON | Both stars tidally elongated toward each other (prolate along star-star axis). Rendered as both primary and secondary as ellipsoids with b/a ratio elongated. Elongation amount proportional to (R/a)^3 × (M_other/M_self). Shader: ellipsoid geometry scaling. Shows gravitational coupling. |
| Tidal | Tidal Heating (if Close) | uTidalHeat | ON | Tidal dissipation heats stellar interiors (especially in eccentric orbits). Rendered as elevated surface temperature tint, warm orange #FF7050 overlay at low alpha 0.08 on both stars (stronger if eccentric). Shader: additive thermal tint. Shows energy dissipation. |

#### Lagrange Points Visualization (2 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Lagrange | L1-L5 Lagrange Points Display | uLagrangePoints | ON | Render all 5 Lagrange points (L1-L5) as colored spheres. L1: yellow #FFD700 (unstable, on star-star axis). L2: orange #FF9050 (unstable, beyond secondary). L3: red #FF3030 (unstable, opposite side). L4/L5: cyan #4AAFDF (stable, 60° ahead/behind secondary orbit). Shader: point geometry with glow. Educational overlay. |
| Lagrange | L1 Stream Path (if active) | uStreamPath | ON | If mass transfer active, render faint trajectory path from secondary's L1-escaping point toward primary, showing computed ballistic path (3-body trajectory). Color: cyan #6AAFDF thin line, dashed. Shader: parametric path curve. Shows dynamics. |

#### Orbital Decay & GW Radiation (2 features)

| Section | Feature | Unsigned | Default | Description |
|---------|---------|---------|---------|-------------|
| Decay | Gravitational Wave Radiation Decay | uGWDecay | ON | Close binaries lose orbital energy to gravitational waves (GW), causing orbital decay (visible in pulsar binaries, merging black holes, etc.). Rendered as slow reduction of orbital separation over time (animation timescale: separation decreases ~0.1% per 5 seconds, representing 10^9 year timescale). Shader: time-dependent semi-major axis scaling. Shows long-term evolution. |
| Decay | Orbital Decay Warning (Near-Merger) | uMergerWarning | OFF | If orbital decay advanced far (separation <5 stellar radii), render red warning overlay or pulsing glow on both stars #FF3030. Indicates imminent merger (merger timescale <days/years depending on mass). Off by default (applies to extreme close binaries). |

#### Camera (3 features)

| Section | Feature | Unsigned | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Orbital Plane Side View | uCameraMode | ON | Default camera positioned in orbital plane, side view showing both stars in profile, orbit ellipse visible edge-on. Distance ~10× separation. FOV 50°. Shows orbital motion clearly. |
| Camera | Orbital Plane Face-On View | uCameraMode | OFF | Top-down view perpendicular to orbital plane, looking down at elliptical orbit from above. Distance ~15× separation, FOV 55°. Shows orbital ellipse geometry directly. |
| Camera | Mass Transfer Stream Focus | uCameraMode | OFF | Dynamically positioned camera orbiting around binary, focused on mass transfer stream (if active). Distance ~5× separation, FOV 45°. Shows stream detail and impact. |

---

### Protoplanetary Disk

**Entity ID:** ENT-8030
**Description:** Circumstellar accretion disk around young T Tauri star, containing dust and gas at various temperatures, exhibiting spiral density waves, gaps from planet formation, snow lines, bipolar outflow, and embedded proto-planets. Disk colors #C8B8A8 (inner) to #4A3E30 (outer). Real exemplars: HL Tau, TW Hydrae, PDS 70.

**Section Count:** 9 (Central T Tauri Star, Disk Structure & Radial Profile, Spiral Density Waves, Planet-Forming Gaps, Inner Dust Wall/Sublimation Line, Snow Lines, Bipolar Molecular Outflows, Embedded Protoplanets, Camera)
**Total Feature Count:** 29

#### Central T Tauri Star (3 features)

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Star | T Tauri Star Photosphere | uTTauriStar | ON | Young pre-main-sequence star, age ~0.1-10 Myr, mass ~0.1-2 Msun. Temperature ~4000-6000 K (orange-yellow), radius ~2-5 Rsun (inflated due to youth/contraction). Color: #FFF8D0 pale yellow. FBM 3-octave (freq 50.0, amplitude 0.12) for chromospheric activity/starspot texture. Shader: young star appearance, elevated Lambertian illumination. Central source. |
| Star | T Tauri Accretion Hotspot | uAccretionHotspot | ON | Accretion from disk onto star's poles creates hot spots (magnetic channeling of accretion flow). Rendered as bright white-orange #FFD700 regions at magnetic poles (typically ~2 hotspots at opposite poles). Size ~1000 km scale, temperature ~6000-8000 K. Shader: pole-centered bright glow. Shows active accretion. |
| Star | T Tauri Stellar Wind | uStellarWind | ON | Young T Tauri stars have strong stellar winds (~100-500 km/s). Rendered as wispy blue-white streamers #C8E8FF extending outward from star, becoming part of bipolar outflow jets. Sparse FBM 3-octave (freq 40.0, amplitude 0.10). Alpha 0.15-0.25. Shader: additive wind streamers from star. Feeds outflow structure. |

#### Disk Structure & Radial Profile (4 features)

| Section | Feature | Unsigned | Default | Description |
|---------|---------|---------|---------|-------------|
| Disk | Disk Outer Radius (~100-1000 AU) | uDiskRadius | ON | Protoplanetary disks extend to 100-1000 AU (some >10,000 AU). Inner radius ~0.1 AU (dust sublimation), outer radius configurable 100-1000 AU. Thin disk geometry (~scale height H/R ~0.05-0.10). Rendered as large flat torus. Shader: disk geometry scaling. Sets overall disk size. |
| Disk | Disk Radial Color/Temperature Gradient | uDiskGradient | ON | Disk temperature drops radially: inner regions hotter (yellow #C8B8A8 at ~0.5 AU, temp ~300 K), outer regions cooler (dark brown #4A3E30 at ~100 AU, temp ~20 K). Rendered via radial color gradient, FBM 5-octave (freq 20.0, amplitude 0.08) for clumping. Shader: radial color ramp + turbulence overlay. Shows temperature profile. |
| Disk | Dust Scale Height Variation | uScaleHeight | ON | Disk puffiness increases outward (scale height increases radially, H/R ~0.05 inner to ~0.15 outer). Rendered as disk vertical thickness increasing with radius. Shader: radially-varying disk thickness geometry. Shows hydrostatic balance. |
| Disk | Disk Optical Depth Variation | uOpticalDepth | ON | Inner disk optically thick (tau > 1, dark appearance), outer disk optically thin (tau < 1, more transparent). Rendered via radially-modulated opacity: alpha high (~0.7) inner, low (~0.3) outer. FBM modulation (freq 25.0, amplitude 0.10). Shader: radially-varying alpha channel. Shows dust distribution. |

#### Spiral Density Waves (3 features)

| Section | Feature | Unsigned | Default | Description |
|---------|---------|---------|---------|-------------|
| Spirals | m=2 Spiral Pattern | uSpiral2 | ON | Two-armed spiral pattern (m=2 symmetry), common in models and ALMA observations (e.g., HL Tau). Rendered via 2D sinusoidal modulation in disk plane: brightness variation ∝ cos(2×phi - omega_p×t), where phi = azimuthal angle, omega_p = spiral pattern speed. Amplitude ~15% brightness variation. Shader: spiral pattern overlay on disk texture. Shows density wave structure. |
| Spirals | m=3-4 Spiral Modes (Optional) | uSpiral34 | OFF | Higher-order spiral modes (m=3 or m=4) possible (e.g., PDS 70 may have m=3). Rendered as additional spiral patterns with higher spatial frequency. Off by default, can be toggled. Shader: additional sinusoidal modulation terms. |
| Spirals | Spiral Asymmetry & Non-Steady | uSpiralAsym | ON | Spirals are often non-axisymmetric (lopsided), with varying arm brightness. Rendered via FBM-modulated spiral amplitude (freq 30.0, amplitude 0.10) creating non-uniform arm brightness. Shader: modulated spiral pattern amplitude. Shows realistic complexity. |

#### Planet-Forming Gaps (4 features)

| Section | Feature | Unsigned | Default | Description |
|---------|---------|---------|---------|-------------|
| Gaps | Gap Carving from Embedded Planet | uPlanetGap | ON | Massive gap opened in disk (width ~2-3× planet scale height) from dynamical interaction with embedded massive planet. Rendered as dark radial band in disk (dark #5A4A3A color), width ~0.5 separation distance. Color contrast sharp (dark vs bright surrounding disk). FBM 4-octave (freq 60.0, amplitude 0.08) for gap edge roughness. Shader: radial dark band overlay. Most obvious planet signature. |
| Gaps | Multiple Gap Zones (Several Planets) | uMultipleGaps | ON | Disks with multiple giant planets show multiple gaps (e.g., HL Tau with 3+ gaps). Rendered as multiple dark radial bands at different radii (e.g., 0.3, 0.5, 0.8 AU inner radius). Gaps separated by bright regions. FBM modulation at each gap. Shader: multiple dark band overlays. Shows multi-planet system. |
| Gaps | Gap Edge Dust Walls | uGapEdges | ON | Sharp dust density edges at gap boundaries, creating bright walls on gap sides. Rendered as thin bright lines #F5E6D3 on inner and outer gap edges, width ~0.05× separation distance. FBM 2D along edge (freq 80.0, amplitude 0.08). Shader: thin bright line overlays marking gap edges. Shows density structure. |
| Gaps | Vortex Anticyclone in Gap | uGapVortex | ON | Gaps may trap large anticyclonic vortices (dust concentration zones). Rendered as localized bright spot #F0E0B8 within gap, Gaussian profile, ~1/3 gap width. Sparse spatial occurrence (not in all gaps). Shader: additive vortex glow overlay. |

#### Inner Dust Wall & Sublimation Line (3 features)

| Section | Feature | Unsigned | Default | Description |
|---------|---------|---------|---------|-------------|
| InnerDisk | Dust Sublimation Front | uSublimationFront | ON | Dust sublimates (evaporates) at ~1200 K, creating sharp inner edge to dust disk at ~0.1 AU (depends on stellar luminosity). Inner disk region has no dust (only gas, invisible). Rendered as sharp color discontinuity: bright disk edge #C8B8A8 at sublimation radius, darkness/transparency inside. Shader: step function boundary at sublimation radius. Clear edge feature. |
| InnerDisk | Vertical Dust Wall Appearance | uDustWall | ON | Inner dust boundary appears as vertical wall-like feature when viewed edge-on, creating dramatic silhouette. Rendered as sharp vertical edge in disk profile, heightened by color contrast. Shader: edge detection rendering, sharp boundary. Creates dramatic visual effect. |
| InnerDisk | Gas Disk Interior (Hot) | uGasInterior | ON | Interior region (inside sublimation line) is pure gas (no dust), hottest region (~1500+ K near star surface). Rendered as dim/dark region inside dust wall (gas is transparent in optical). Or represented as faint reddish thermal emission #FF7050 at alpha 0.05. Shader: low-opacity gas visualization. |

#### Snow Lines (3 features)

| Section | Feature | Unsigned | Default | Description |
|---------|---------|---------|---------|-------------|
| SnowLine | H2O Snow Line | uH2OSnowLine | ON | Water snow line at ~3 AU (changes with disk profile). Volatiles freeze out, increasing solid density. Rendered as subtle color/brightness boundary in disk, transition from yellowish #C8B8A8 to slightly bluer #D0B888. Thin transition zone ~0.2 AU wide. FBM modulation (freq 40.0, amplitude 0.05) for roughness. Shader: smooth radial color transition. Represents phase boundary. |
| SnowLine | CO2/CO Frost Lines (Outer) | uCOSnowLine | ON | CO2 frost line at ~20 AU, CO frost line at ~30+ AU (very outer disk). Multiple snow lines create compositional zones. Rendered as additional subtle color transition bands (progressively cooler tones #A8906F outer). Narrow boundaries. Shader: radial color gradient transitions. Shows chemical zoning. |
| SnowLine | Snow Line Dynamical Motion | uSnowLineMotion | OFF | Snow lines move inward/outward over time due to disk evolution (heating, migration). Rendered as slow radial drift of snow line position (~0.5% per 10 seconds animation). Off by default (long-timescale effect). Shader: time-dependent boundary position. |

#### Bipolar Molecular Outflows (3 features)

| Section | Feature | Unsigned | Default | Description |
|---------|---------|---------|---------|-------------|
| Outflow | Bipolar Jet Axis | uBipolarAxis | ON | Two high-velocity outflow jets (bipolar jets) emanate from star's rotation axis (typically perpendicular to disk), speeds ~100-500 km/s. Rendered as two opposite cone-shaped jets, blue-white #C8E8FF color, opening angle ~30°, extending ~1000 AU length. FBM 2D along jet axis (freq 50.0, amplitude 0.10) for turbulent appearance. Shader: cone geometry with additive glow. Dramatic outflow. |
| Outflow | Jet Precession (if precessing) | uJetPrecession | ON | Some jets precess (wobble around rotation axis), creating helical patterns. Rendered via sinusoidal modulation of jet axis direction (amplitude ~5°, freq 2-3 Hz = precession frequency). Shader: time-dependent jet axis orientation. Shows dynamic behavior. |
| Outflow | Outflow Shock Interaction with ISM | uOutflowShock | ON | Bipolar jets collide with surrounding interstellar medium (ISM), creating bright shock front. Rendered as bright white #FFFFFF region at jet tips, Gaussian glow, radius ~100 AU. FBM 2D local (freq 100.0, amplitude 0.08). Shader: additive shock glow at jet termination. |

#### Embedded Protoplanets (3 features)

| Section | Feature | Unsigned | Default | Description |
|---------|---------|---------|---------|-------------|
| Planets | Protoplanet Positions in Gaps | uProtoPlanets | ON | Render 1-4 embedded protoplanets (forming planets) orbiting within gaps carved in disk. Sizes ~0.1-10 Jupiter masses (scale for visibility), positions at gap centers. Colors: yellow #FFD700 (hot, close-in) to blue #6AAFEF (cool, outer). Animated orbital motion around star. Shader: sphere geometry with orbital animation. Shows planet formation context. |
| Planets | Protoplanet Accretion Glow | uProtoAccretion | ON | Protoplanets heat up from ongoing accretion (rapid mass growth), radiating energy. Rendered as orange-red thermal glow #FF7050 around each planet, alpha 0.15-0.25. FBM 3-octave (freq 60.0, amplitude 0.10). Shader: additive glow halo. Shows energy dissipation. |
| Planets | Protoplanet Orbital Velocity Vectors | uPlanetVelocity | OFF | Optional: show velocity vectors (arrows) at each planet position, color cyan #4AAFDF, length ∝ orbital velocity. Off by default. Shader: vector visualization overlay. |

#### Camera (3 features)

| Section | Feature | Unsigned | Default | Description |
|---------|---------|---------|---------|-------------|
| Camera | Disk Face-On Top-Down View | uCameraMode | ON | Default camera positioned perpendicular to disk plane, looking down at disk from above. Distance ~200 AU (disk outer edge visible). FOV 60°. Shows spiral patterns, gaps, and overall disk structure clearly. Star centered. |
| Camera | Edge-On Disk Profile View | uCameraMode | OFF | Camera positioned in disk plane, looking edge-on at thin disk profile. Distance ~150 AU sideways. Shows disk thickness, vertical structure, and silhouette against star. FOV 45°. Dramatic thin-disk appearance. |
| Camera | Protoplanet System Context | uCameraMode | OFF | Zoomed to show star + disk + embedded planets prominently, orbital paths visible. Distance ~100 AU. FOV 55°. Shows multiple planets' positions and orbital geometry. |

---

### Kilonova (Neutron Star Merger)

**Entity ID:** ENT-8021
**Description:** Transient electromagnetic emission from the merger of two neutron stars (or NS-BH), powered by radioactive decay of r-process nuclei synthesized in neutron-rich ejecta — the origin site of most elements heavier than iron (gold, platinum, uranium). Duration: days to weeks. Luminosity: 10³–10⁴× classical novae (10⁴⁰–10⁴¹ erg/s). Ejecta mass: 0.01–0.1 M☉ at 0.1–0.3c. Color evolution: early (hours–1 day) blue #8AB0E8 (lanthanide-poor polar ejecta, T ~10⁴ K), transition #E8D0A0, late (days–weeks) deep red #A03020 (lanthanide-rich equatorial ejecta, extreme opacity). Accompanied by gravitational waves and short gamma-ray burst. Real exemplars: GW170817/AT2017gfo (first observed, defining event, NGC 4993 host).

**Section Count:** 8 (Ejecta Components, Color Evolution, r-Process Nucleosynthesis, Gravitational Wave Context, GRB Association, Remnant, Host Galaxy, Camera)
**Feature Count:** 26

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Ejecta Components | Blue/Polar Ejecta | uBlueEjecta | ON | Fast, lanthanide-poor ejecta concentrated in polar directions (±30° from merger axis). Velocity: 0.2–0.3c. Mass: 0.01–0.03 M☉. Color: #8AB0E8 (blue, T ~10⁴ K at 1 day, low opacity κ ~1 cm²/g). Peaks at ~1 day post-merger. Shape: bipolar lobes. Powered by β-decay of light r-process elements (Sr, Y, Zr). Rendered as expanding bipolar luminous volume. |
| Ejecta Components | Red/Equatorial Ejecta | uRedEjecta | ON | Slower, lanthanide-rich tidal ejecta concentrated in equatorial plane. Velocity: 0.1–0.2c. Mass: 0.01–0.05 M☉. Color: #A03020 (deep red, T ~2000–3000 K at peak, extremely high opacity κ ~10 cm²/g from lanthanide/actinide line blanketing). Peaks at 3–7 days. Toroidal shape. Contains heaviest r-process elements (Au, Pt, U). |
| Ejecta Components | Dynamical Ejecta (Tidal) | uDynamicalEjecta | OFF | Material torn from NS surfaces during tidal disruption at merger. Launched in equatorial plane at 0.1–0.3c. Neutron-rich (Y_e < 0.2): produces heaviest r-process (3rd peak, A ~195). Mass: 10⁻³–10⁻² M☉. Color contribution: extremely red due to actinide/lanthanide opacity. Crescent/arm-shaped morphology from tidal torque. |
| Ejecta Components | Wind Ejecta (Disk Wind) | uWindEjecta | OFF | Neutrino-driven and magnetically driven wind from accretion disk formed after merger. Less neutron-rich (Y_e ~0.25–0.40): produces lighter r-process (1st/2nd peak elements). Mass: 0.01–0.05 M☉, velocity 0.05–0.15c. Quasi-spherical. Color: intermediate #D0A070. Dominates total ejecta mass. Powers transition-phase emission (2–5 days). |
| Color Evolution | Light Curve Evolution | uLightCurve | ON | Rapid color evolution: blue→red over ~1 week. Day 0.5: peak blue (M_V ≈ -16), color #8AB0E8. Day 1–2: transition, #D0C090. Day 3–5: peak red/IR (M_J ≈ -16), color #A03020. Day 7+: rapid fading in all bands. Animated color transition of expanding ejecta. Faster than any supernova evolution. Total radiated energy: ~10⁴⁶ erg. |
| Color Evolution | Photospheric Recession | uPhotosphericRecession | OFF | Photosphere recedes through expanding ejecta as opacity decreases. Early: photosphere at outer edge (blue, T ~10⁴ K). Late: photosphere retreats inward revealing lanthanide-rich inner layers (red). Rendered as shrinking bright surface within expanding ejecta cloud. Recession velocity: ~0.1c initially, slowing as ejecta becomes transparent. |
| r-Process Nucleosynthesis | Element Production Visualization | uElementProduction | OFF | Visualization of r-process elements being synthesized. Color-coded by atomic number: light r-process (Z=38–56, Sr-Ba) #8AB0E8, heavy r-process (Z=57–71, lanthanides) #D0A050, heaviest (Z=90+, actinides) #A03020. Fraction of each component mapped to ejecta regions. Single NS merger produces ~10 Earth masses of gold, ~30 Earth masses of platinum. |
| r-Process Nucleosynthesis | Radioactive Heating Curve | uRadioactiveHeating | OFF | Heating rate from β-decay, α-decay, and fission of freshly synthesized r-process nuclei. Power law: Q(t) ∝ t^(-1.3). Visualization: ejecta brightness proportional to heating rate. Early: dominated by β-decay of N~82 nuclei. Late: α-decay of trans-lead nuclei and spontaneous fission. Rendered as time-varying emission intensity map. |
| Gravitational Wave Context | GW Signal Indicator | uGWSignal | OFF | Gravitational wave chirp signal from inspiral. Frequency sweeps from ~10 Hz to ~1000 Hz in final seconds. Amplitude increases ∝ f^(2/3) (inspiral) then peaks at merger. Rendered as expanding concentric wave pattern #6A8AAA, opacity 0.05 emanating from merger site. GW170817: detected ~100 seconds before merger. GW energy: ~0.05 M☉c² radiated. |
| Gravitational Wave Context | Pre-Merger NS Binary | uPreMergerBinary | OFF | Two neutron stars in final inspiral: separation 100–10 km, orbital period milliseconds to seconds. Each NS: 10–15 km diameter, #B0B8C8. Orbital decay visible as spiraling inward. GW emission carrying away angular momentum. Final orbits at ~0.1c velocity. Tidal deformation of NSs visible in last orbits. Animated inspiral and merger. |
| GRB Association | Short GRB Jet | uShortGRBJet | OFF | Ultrarelativistic jet (Γ ~100–1000) launched from merger remnant, producing short gamma-ray burst. Jet: narrow (opening angle 5–15°), bilateral, aligned with NS spin axis. Color: #E0E0FF (high-energy indicator). Length: develops over seconds to hours. On-axis: brief gamma-ray flash (duration <2 s). Off-axis (GW170817): delayed, long-lived afterglow. Jet cocoon interaction with ejecta. |
| GRB Association | Afterglow (Multi-Wavelength) | uAfterGlow | OFF | Synchrotron emission from jet-ISM interaction. Rises over days–weeks (off-axis geometry), peaks at months. Radio, optical, X-ray. Color: #A0B0C0 (broadband synchrotron). Expanding ring morphology (superluminal apparent motion detected for GW170817 by VLBI). Rendered as expanding luminous ring at jet-ISM interface, radius increasing at apparent 4c. |
| Remnant | Remnant State | uRemnantState | OFF | Post-merger remnant: hypermassive NS (survives milliseconds, vibrating → collapses), supramassive NS (survives seconds–minutes, spinning down → collapses), or stable NS (if total mass < TOV limit). BH formation: final state for most mergers. Rendered as central compact object: NS #B0C0D0 (if surviving) or BH #000000 with accretion disk #D0A050. Remnant determines jet launching and ejecta properties. |
| Remnant | Accretion Disk/Torus | uRemnantDisk | OFF | Massive accretion torus (0.01–0.1 M☉) around remnant compact object. T ~10⁹–10¹⁰ K. Viscous timescale: 10–100 ms. Provides energy for jet launching and source of disk wind ejecta. Rendered as thick torus #E8A050 around central object, rapidly accreting. Neutrino emission from disk surfaces. Disk lifetime: 0.1–10 seconds. |
| Host Galaxy | Host Galaxy Context | uHostGalaxy | OFF | Kilonova occurs within host galaxy. GW170817: NGC 4993 (elliptical galaxy, 40 Mpc). NS mergers have long delay times (10⁷–10¹⁰ yr from formation): found in all galaxy types, often offset 5–50 kpc from center (natal kick from SN). Host rendered as background galaxy #D0C090. Kilonova position marked relative to host. |
| Host Galaxy | Offset from Host Center | uHostOffset | OFF | NS merger systems receive natal kicks during SN formation: travel kpc–tens of kpc from birth site before merging. Projected offset: 0–100 kpc from host center. Visualization: line connecting host center to kilonova position. Offset distribution constrains NS kick velocities and merger delay times. |
| Camera | Ejecta Expansion View | uCameraMode | ON | Default: expanding kilonova ejecta showing blue polar + red equatorial components. Distance: ~0.01 pc (1000 AU). FOV 40°. Bipolar blue + equatorial red clearly distinguishable. Animated expansion. Star field background. |
| Camera | Multi-Messenger Timeline | uCameraMode | OFF | Timeline visualization: GW detection (t-100s) → merger (t=0) → short GRB (t+2s) → blue kilonova (t+hours) → red kilonova (t+days) → afterglow (t+weeks). Shows temporal sequence of multi-messenger observations. Educational: demonstrates multi-messenger astronomy paradigm. |
| Camera | Time Speed Multiplier | uTimeSpeed | 2 hr/s | 1 real second = 2 hours. Day-timescale color evolution visible over ~12 seconds. Blue→red transition clear. Ejecta expansion visible. Full kilonova lifecycle (~2 weeks) compressible to ~170 seconds. |

---

### Gamma-Ray Burst (Long GRB)

**Entity ID:** ENT-8022
**Description:** Most energetic electromagnetic explosions in the universe — collimated ultrarelativistic jets (Γ > 100) from core-collapse of massive stars (collapsars), producing prompt gamma-ray emission lasting 2–1000 seconds followed by broadband afterglow lasting weeks–months. Isotropic-equivalent energy: 10⁵¹–10⁵⁴ erg (with beaming correction: true energy ~10⁵⁰–10⁵¹ erg). Jet opening angle: 3–10°. Associated with Type Ic-BL supernovae (stripped-envelope, broad-lined). Occur preferentially in low-metallicity, star-forming galaxies. Colors: prompt jet #E0E0FF (gamma/X-ray representation), afterglow early #D0E0FF (X-ray/UV), afterglow late #E8C890 (optical/IR declining), associated SN #D0B890 (emerging after ~2 weeks). Real exemplars: GRB 030329 (first SN association confirmed), GRB 080319B (naked-eye visible, z=0.937), GRB 221009A ("BOAT" — brightest of all time).

**Section Count:** 7 (Relativistic Jet, Prompt Emission, Afterglow, Associated Supernova, Host Galaxy, Jet Structure, Camera)
**Feature Count:** 25

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Relativistic Jet | Ultrarelativistic Jet Core | uJetCore | ON | Central jet spine: Γ = 100–1000, opening half-angle 2–5°. Powered by BH accretion from collapsar disk. Duration: 2–1000 s (engine active). Color: #E0E0FF (high-energy representation). Internal energy: 10⁵⁰–10⁵¹ erg. Jet drills through stellar envelope (breakout time ~10 s for Wolf-Rayet progenitor). Rendered as narrow bilateral beam from central engine. |
| Relativistic Jet | Jet Cocoon | uJetCocoon | ON | Shocked jet material and shocked stellar envelope forming cocoon around jet. Wider angle than jet core (20–40° opening). Color: #A0B0C8, opacity 0.15. Mildly relativistic (Γ ~5–30). Contains ~10× jet core energy. Cocoon breakout produces prompt thermal emission (precursor). Cocoon visible from wider viewing angles than jet core. |
| Relativistic Jet | Jet Breakout from Star | uJetBreakout | OFF | Jet punching through stellar surface: breakout flash in UV/X-ray. Stellar radius ~10¹¹ cm (WR star). Breakout time ~10 s after jet launch. Flash duration ~1 s. Color: #D0E0FF burst at stellar surface. Jet transitions from confined (within star) to free expansion. Cocoon material also breaks out, wider angle. Animated: jet emergence from expanding/disrupting stellar envelope. |
| Prompt Emission | Internal Shock Emission | uInternalShocks | ON | Prompt gamma-ray emission from collisions between variable-velocity shells within jet. Emission radius: 10¹³–10¹⁵ cm. Highly variable light curve: pulses with 10ms–10s timescale superimposed on overall envelope. Color: #FFE0FF (gamma-ray representation, pulsing). Each pulse: fast rise (~0.1×duration), exponential decay. Spectral peak: 100–500 keV (Band function). |
| Prompt Emission | Photospheric Emission | uPhotosphericEmission | OFF | Thermal radiation from jet photosphere (where optical depth τ = 1). Quasi-thermal spectrum: blackbody-like with peak at ~100 keV. Color: #F0E8D0 (thermal component). Contributes 10–50% of prompt flux in some GRBs. Emission radius: ~10¹² cm. Smoother temporal structure than internal shocks. GRB 090902B archetype for strong photospheric component. |
| Prompt Emission | Prompt Light Curve | uPromptLC | OFF | Time-resolved gamma-ray light curve visualization. Highly irregular: FRED pulses (Fast Rise Exponential Decay), quiescent intervals, intensity variations spanning 10²×. Total duration T₉₀ = 2–1000 s. Rendered as brightness modulation of jet with pulse timing. GRB 080319B: visible to naked eye during prompt phase (V ~ 5.3 at z=0.937). |
| Afterglow | Forward Shock Afterglow | uForwardShock | ON | Synchrotron emission from jet-decelerated material shocking ISM/CSM. Broadband: X-ray → optical → radio. Rises to peak (minutes in X-ray, hours in optical, days in radio) then power-law decay (F ∝ t^(-α), α ~1–2). Color evolution: early #D0E0FF (X-ray bright) → #D0D8C0 (optical peak) → #E8C890 (fading). Expanding blast wave radius: R(t) ∝ t^(1/4) (deceleration phase). |
| Afterglow | Reverse Shock Flash | uReverseShock | OFF | Shock propagating back into jet material when jet encounters ISM. Produces bright optical/IR flash at ~100–1000 s. Color: #FFD060 (bright optical flash, can rival prompt emission at lower frequency). Duration: 10–100 s. GRB 990123 archetype: reverse shock optical flash reached V = 9 at z = 1.6. Not all GRBs have detectable reverse shock. |
| Afterglow | Jet Break | uJetBreak | OFF | When jet decelerates to Γ ~1/θ_jet: edge of jet becomes visible, spreading begins. Achromatic steepening of afterglow light curve (t^(-1.2) → t^(-2.2)). Break time: 0.5–10 days. Visualization: expanding jet cone widening as it decelerates. Before break: appears spherical from aberration. After break: true jet geometry revealed. Key diagnostic for jet opening angle and true energy. |
| Afterglow | Afterglow Expansion Ring | uExpansionRing | OFF | At late times: afterglow resolves into expanding ring (limb-brightened geometry). Ring radius: milliarcsecond scale (barely resolvable by VLBI). Ring expansion velocity: initially ~c, decelerating. Rendered as expanding luminous ring #C0C8D0, radius growing, intensity decreasing. GRB 030329: ring expansion detected by radio VLBI. |
| Associated Supernova | Emerging Supernova | uAssociatedSN | OFF | Type Ic-BL supernova emerging from afterglow after ~10–20 days: red bump in light curve. SN peak: M_V ≈ -19 (10⁴²–10⁴³ erg/s). Color: #D0B890 (SN photosphere). Broad absorption features (v ~30000 km/s: Si II, Ca II). Rises to peak at ~15 days, contributes ~20–50% of optical flux at peak. SN 1998bw archetype (GRB 980425). |
| Associated Supernova | SN Ejecta | uSNEjecta | OFF | Supernova ejecta expanding at ~30000 km/s (0.1c). Mass: 3–10 M☉. Homologous expansion: v ∝ r. Outer layers: fast, low-density. Inner: slow, dense, Ni-56 enriched. Color: outer #C0A880 (normal SN), inner #D0A050 (Ni decay glow). SN ejecta much slower and more massive than GRB jet — arrives long after jet phenomena. |
| Host Galaxy | Star-Forming Host | uSFHost | OFF | Long GRBs in actively star-forming, low-metallicity galaxies. Host: irregular/compact blue galaxy #8AB0D8 (young stellar population). Z ~0.1–0.5 Z☉ (metal-poor preference). SFR: 1–100 M☉/yr. GRB position: within brightest UV regions (massive star-forming complexes). Offset from host center: 0–5 kpc. Host magnitude: faint (M_B ≈ -18 to -21). |
| Host Galaxy | Absorption Line System | uAbsorptionSystem | OFF | GRB afterglow as background flashlight: intervening gas imprints absorption lines. Damped Lyα at host redshift (N_HI > 10²⁰ cm⁻²). Multiple metal absorption systems from intervening galaxies along sightline. Visualization: schematic of afterglow light passing through host ISM and intervening systems. Tool for studying early universe gas. |
| Jet Structure | Top-Hat vs Structured Jet | uJetStructure | OFF | Toggle between uniform "top-hat" jet (constant Γ within opening angle, zero outside) and structured jet (Γ and energy decreasing with angle from axis). Structured: Gaussian or power-law profile. Structured jet explains off-axis GRBs and cocoon emission. Visualized: cross-section showing energy/Γ distribution. GRB 170817A: first confirmed off-axis structured jet view. |
| Jet Structure | Viewing Angle Effect | uViewingAngle | OFF | Appearance depends on observer angle relative to jet axis. On-axis (θ < θ_jet): classical bright GRB. Off-axis (θ > θ_jet): initially faint, brightening as jet decelerates and beaming cone widens. Far off-axis: only cocoon and SN visible. GW170817: first observed off-axis (θ_obs ~20–30°). Animated rotation showing appearance vs angle. |
| Camera | Prompt Phase View | uCameraMode | ON | Default: jet active, prompt emission phase. Distance: 10¹⁶ cm (~1000 AU). FOV 30°. Bilateral jet with cocoon, internal shock emission visible. Progenitor star disrupting. Most dramatic phase. |
| Camera | Afterglow Phase View | uCameraMode | OFF | Later phase: jet decelerating, expanding blast wave. Distance: 10¹⁸ cm (~0.1 pc). Forward shock front visible as expanding sphere. Reverse shock region. Associated SN emerging if days post-burst. Broader view of interaction with environment. |
| Camera | Time Speed Multiplier | uTimeSpeed | 10 s/s | Prompt phase: 1 real second = 10 seconds. GRB duration (100 s) plays out in ~10 real seconds. For afterglow mode: switch to 1 hr/s to show day-timescale evolution. SN emergence at ~15 days = ~360 real seconds at 1 hr/s. |

---

### Gravitational Lens (Strong Lensing System)

**Entity ID:** ENT-8024
**Description:** Foreground massive object (galaxy or galaxy cluster) bending light from a background source via general relativistic spacetime curvature, creating multiple images, arcs, or Einstein rings. Spectacular demonstration of GR predictions. Lens mass determines geometry: galaxy-scale lens (10¹¹–10¹³ M☉) → Einstein radius ~1 arcsec, cluster-scale → ~20–40 arcsec. Source magnification: 2–100× (enables study of distant, otherwise unobservable objects). Colors: lens galaxy #E8D0A0 (typically massive elliptical), lensed arcs #8AB0E8 (blue star-forming background galaxy magnified), Einstein ring #A0C8E0. Real exemplars: Einstein Cross (Q2237+030, quasar quadruply imaged), Cosmic Horseshoe, SDSS J1038+4849 (smiley face), SDP.81 (ALMA Einstein ring), Abell 370 (cluster arc "the Dragon").

**Section Count:** 7 (Lens Properties, Lensed Images, Einstein Ring, Magnification Effects, Time Delay, Mass Reconstruction, Camera)
**Feature Count:** 25

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Lens Properties | Lens Galaxy | uLensGalaxy | ON | Foreground lensing galaxy: typically massive elliptical (M ~10¹²–10¹³ M☉). Color: #E8D0A0 (old stellar population, red and dead). Sérsic profile n = 4. Effective radius 5–20 kpc. Positioned at center of lensing configuration. Redshift z_l = 0.1–1.0 typically. Light from this galaxy blends with lensed images. Ellipticity affects image configuration. |
| Lens Properties | Dark Matter Halo | uDMHaloLens | OFF | DM halo providing majority of lensing mass. NFW profile extending to ~300 kpc. Total mass within Einstein radius: 10¹¹–10¹² M☉ for galaxy lens. Rendered as diffuse blue volume #3A4A6A, opacity 0.03. M/L ratio within Einstein radius ~5–15 (dark matter dominated). Halo ellipticity may differ from visible galaxy. |
| Lens Properties | Substructure in Lens | uLensSubstructure | OFF | Small-scale DM subhalos (10⁶–10⁹ M☉) within lens galaxy perturbing image positions at milliarcsecond level. Detectable via flux ratio anomalies in quad lenses. Rendered: small dense concentrations #4A5A6A within halo. Substructure mass fraction constrains DM particle physics (warm DM predicts fewer subhalos). Key test of CDM on small scales. |
| Lensed Images | Multiple Image Configuration | uMultipleImages | ON | Background source lensed into multiple images: doubles (2 images), quads (4), or odd-number (central image usually demagnified below detection). Color: each image #8AB0E8 (same source, same color). Image separation: 1–5 arcsec (galaxy lens). Parity: some images mirrored (saddle points vs minima of time delay surface). Brightness ratios ~1:1 to 1:100. |
| Lensed Images | Arc Morphology | uArcMorphology | ON | Extended background sources stretched into arcs tangential to lens center. Arc length: 2–30 arcsec (galaxy scale), up to 200 arcsec (cluster scale). Width: 0.1–2 arcsec (source intrinsic size divided by magnification). Color: #8AB0E8 to #A0D0F0 (blue, star-forming galaxies preferentially lensed due to high surface brightness). Giant arcs: magnification > 10×. Rendered as curved elongated structures. |
| Lensed Images | Counter-Image | uCounterImage | ON | For giant arcs: demagnified counter-image on opposite side of lens. Typically much fainter (0.1–0.01× arc brightness). Same color as arc #8AB0E8 but compact (less magnification). Confirms lensing interpretation. Separation from lens center: comparable to Einstein radius but on opposite side. |
| Einstein Ring | Full Einstein Ring | uEinsteinRing | ON | Perfect alignment → complete ring of light. Einstein radius: θ_E = √(4GM D_ls/(c² D_l D_s)) ≈ 1 arcsec (galaxy) to 30 arcsec (cluster). Color: magnified source color #A0C8E0. Ring width: source size divided by magnification. ALMA SDP.81: beautiful submm Einstein ring. Rendered as luminous circle centered on lens. |
| Einstein Ring | Partial Ring/Broken Arc | uPartialRing | OFF | Imperfect alignment → partial ring or bright arc. More common than full rings. Arc length proportional to source-lens alignment quality. Larger source → broader but less complete ring. Multiple arcs from multiple background sources at different redshifts (cluster lenses). Color varies by source: #8AB0E8, #A0D0B0, #D0A890 (different source galaxies). |
| Einstein Ring | Ring Thickness Variation | uRingThickness | OFF | Ring not uniform thickness — varies with source structure. Bright knots in ring correspond to compact features in source (star-forming regions, AGN). Thin segments: smoother source regions. Resolved source structure magnified differently at different ring positions (differential magnification). Knot colors: #A0C8FF (SF regions), #FFD0A0 (AGN component). |
| Magnification Effects | Magnification Map | uMagnificationMap | OFF | 2D map of magnification factor across source plane. High magnification along caustic curves: μ → ∞ formally (fold and cusp caustics). Astroid caustic for elliptical lens. Rendered as color-coded overlay: low magnification #3A5A3A (μ ~1), moderate #5A8A5A (μ ~5), high #8ACA8A (μ ~20+), caustic #FFFFFF (μ → ∞). Source position relative to caustics determines image configuration. |
| Magnification Effects | Source Reconstruction | uSourceRecon | OFF | Inferred un-lensed source appearance reconstructed by "de-lensing." Shows what background galaxy actually looks like at 10–100× finer effective resolution than unaided telescope. Typical source: z = 1–3 spiral or irregular galaxy, radius 1–5 kpc. Color: #8AB0D8 with SF knots. Split view: lensed appearance vs reconstructed source. |
| Magnification Effects | Flux Magnification Factor | uFluxMagnification | OFF | Total magnification factor for each image. Typical: μ_total = 2–100 (sum over all images). Brighter images have higher magnification. Critical curve (Einstein ring location): infinite magnification (for point source). Rendered as brightness scaling indicators on each image. Enables study of sources 10–100× fainter than normal detection limit. |
| Time Delay | Time Delay Between Images | uTimeDelay | OFF | Different images arrive at different times due to different path lengths through curved spacetime. Delay: days to years for galaxy lenses, months to years for cluster lenses. Δt = (1+z_l)/(c) × (geometric delay + Shapiro delay). Rendered as temporal offset animation: one image varies first, others follow with delay. Cosmographic tool: measures H₀ independently (H0LiCOW, TDCOSMO programs). |
| Time Delay | Microlensing Variability | uMicrolensingVar | OFF | Stars in lens galaxy act as secondary microlenses. Caustic crossings create rapid (~weeks) brightness fluctuations of ~0.1–1 mag in individual images, uncorrelated between images. Probes quasar accretion disk structure at micro-arcsecond scale. Rendered as stochastic brightness variation of lensed images. Einstein Cross: well-studied microlensing laboratory. |
| Mass Reconstruction | Lens Mass Model | uLensMassModel | OFF | Inferred mass distribution from image positions. Parametric model: Singular Isothermal Ellipsoid (SIE) or NFW+baryons. Total mass within Einstein radius displayed. Mass-to-light ratio constraint. Rendered as mass contour overlay on lens: #4A6A8A contours, 5–8 levels. Demonstrates that image geometry directly encodes mass distribution. |
| Mass Reconstruction | Critical and Caustic Curves | uCriticalCaustic | OFF | Critical curve: locus in image plane where magnification → ∞. Caustic: corresponding curve in source plane. For SIE lens: tangential critical curve = Einstein ring; caustic = diamond astroid. Rendered: critical curve #FF8040 in lens plane, caustic #40FF80 in source plane (split or overlay view). Image formation/destruction occurs as source crosses caustic. |
| Camera | Lensing System View | uCameraMode | ON | Default: face-on view of complete lensing system. Lens galaxy at center, lensed images/arcs/ring visible around it. Distance: appropriate to show full Einstein radius + images. FOV 20° (narrow, high-resolution view). Shows spatial relationship of all components. |
| Camera | Source Plane View | uCameraMode | OFF | View of unlensed source plane (what it would look like without lens). Side-by-side with lensed view for comparison. Demonstrates magnification and distortion effects. Source: small faint galaxy vs lensed: bright dramatic arcs. Educational comparison. |
| Camera | Time Speed Multiplier | uTimeSpeed | 30 days/s | 1 real second = 30 days. Microlensing variability visible over seconds. Quasar variability + time delays between images visible: one image varies, others follow with measured delay. Year-timescale monitoring compressed to ~12 seconds. |

---

### Pulsar Wind Nebula

**Entity ID:** ENT-8026
**Description:** Bubble of relativistic particles and magnetic field inflated by a pulsar's rotational energy loss, confined by surrounding supernova remnant. Synchrotron emission from radio to X-ray/gamma-ray. Morphology: central pulsar + equatorial torus + polar jets + diffuse synchrotron halo. Total luminosity: 10³⁴–10³⁸ erg/s (powered by pulsar spin-down). Colors: X-ray torus/jets #7090C0 (synchrotron blue-white), radio nebula #A08060 (lower-energy synchrotron), optical wisps #C0D0E0. Particle energy: up to ~10¹⁵ eV (PeV — nature's most efficient accelerator). Real exemplars: Crab Nebula (M1, archetypal, PSR B0531+21), Vela PWN, 3C 58, MSH 15-52 ("Hand of God" in X-ray).

**Section Count:** 7 (Central Pulsar, Equatorial Torus, Polar Jets, Synchrotron Nebula, Wisps & Variability, Surrounding SNR, Camera)
**Feature Count:** 26

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Central Pulsar | Pulsar Point Source | uPulsarPoint | ON | Rapidly rotating neutron star (P = 16–300 ms for young energetic pulsars). Pulsed emission: lighthouse beam sweeping observer. Color: #D0D8FF (hot NS surface, T ~10⁶ K). Spin-down luminosity Ė = 4π²I·Ṗ/P³ ≈ 10³⁴–10³⁸ erg/s. Crab: P = 33 ms, Ė = 4.6×10³⁸ erg/s. Rendered as bright point with rotating beam indicator. |
| Central Pulsar | Pulsar Magnetosphere | uPulsarMagnetosphere | OFF | Co-rotating magnetosphere within light cylinder (R_LC = cP/2π ≈ 1600 km for Crab). Dipole field: B ~10¹²–10¹³ G at surface. Open field line region above magnetic poles: particle acceleration zone. Rendered as dipole field lines #5A7AB0, opacity 0.15, within light cylinder. Current sheet at equatorial plane beyond light cylinder — magnetic reconnection site. |
| Central Pulsar | Pulsar Wind Zone | uPulsarWind | OFF | Ultrarelativistic magnetized wind from pulsar (Γ_wind ~10⁴–10⁶). Cold, magnetically dominated flow between light cylinder and termination shock. Nearly invisible — particle energy in bulk flow, not radiation. Rendered as expanding flow #4A5A6A, opacity 0.02, from pulsar to termination shock. σ-problem: wind must convert from magnetically dominated to particle-dominated before shock. |
| Equatorial Torus | Termination Shock Torus | uTermShockTorus | ON | Pulsar wind terminates at standing shock: equatorial ring/torus where wind Γ drops from ~10⁶ to ~10³. Torus radius: 0.1–0.5 pc (Crab: ~0.15 pc). Brightest X-ray feature. Color: #7090C0 (synchrotron X-ray). Torus thickness: 0.02–0.1 pc. Magnetic field compressed at shock: B ~0.1–1 mG. Emission strongly polarized (up to 60%). Rendered as bright equatorial ring. |
| Equatorial Torus | Torus Inner Ring | uTorusInnerRing | ON | Sharp inner edge of termination shock. X-ray bright: surface brightness peak at shock front. Color: #8098C8, intensity highest at inner boundary, decreasing outward. Knot-like structures along inner ring from shock instabilities (Rayleigh-Taylor, kink). 5–10 bright knots, varying on month timescale. Crab: inner ring clearly resolved by Chandra. |
| Equatorial Torus | Torus Wisps | uTorusWisps | ON | Rapidly variable filamentary features in and near equatorial torus. Outward motion at 0.3–0.7c (apparent). Color: #A0B0D0 (X-ray/optical synchrotron). Width: ~0.01 pc. Lifetime: weeks to months. New wisps emerge near pulsar, propagate outward, fade. Crab: wisp motion movie from HST. Rendered as thin arcs propagating outward from termination shock. |
| Polar Jets | Synchrotron Jets | uSynchrotronJets | ON | Collimated outflows along pulsar spin axis. Length: 0.5–2 pc per side. Width: 0.05–0.2 pc. Mildly relativistic (v ~0.3–0.7c). Color: #6A80B0 (X-ray synchrotron, bluer/harder spectrum than torus). Knots along jet: shock-compressed regions. Jet bends at large distances due to interaction with SNR reverse shock. Crab NW and SE jets. Bilateral but often asymmetric. |
| Polar Jets | Jet Knots and Instabilities | uJetKnots | OFF | Bright condensations along jet from internal shocks or kink instabilities. Knot spacing: 0.05–0.3 pc. Color: #8098C8 (brighter than inter-knot jet). Knot proper motion: 0.1–0.5c (closer to pulsar: faster). Variability: months timescale. 3–8 knots per jet. Kelvin-Helmholtz and kink instabilities create sinusoidal jet deflection. |
| Synchrotron Nebula | Extended Radio Nebula | uRadioNebula | ON | Large-scale synchrotron emission at radio frequencies: older, lower-energy electrons that have diffused from injection site. Extent: 1–5 pc (larger than X-ray nebula, lower-energy electrons have longer synchrotron lifetime). Color: #A08060 (warm, lower-energy synchrotron). Amorphous, fills SNR interior. Spectral index α ~0.3 (flat, injection spectrum). Polarization: 20–40%. FBM texture: 5 octaves, freq 2.0, gain 0.3. |
| Synchrotron Nebula | X-ray Nebula (Compact) | uXrayNebula | ON | Higher-energy synchrotron emission: concentrated near pulsar (synchrotron cooling shrinks X-ray nebula). Extent: 0.3–2 pc. Color: #7090C0. Brighter features: torus, jets, wisps. Diffuse component: #5A7090, opacity 0.1, filling interior of torus. Spectral index steepening with distance from pulsar (synchrotron burn-off). |
| Synchrotron Nebula | Spectral Index Gradient | uSpectralGradient | OFF | Synchrotron spectral index steepens (spectrum softer) with distance from pulsar — electrons radiating away energy during transport. Near pulsar: α ~0.3 (hard, fresh injection). At nebula edge: α ~0.8 (soft, aged electrons). Rendered as color gradient: inner #6A80B0 (harder/bluer), outer #A08060 (softer/redder). Key diagnostic of electron transport physics. |
| Wisps & Variability | Dynamic Wisps | uDynamicWisps | ON | Month-timescale morphological changes: wisps appearing, propagating, fading. Most dramatic in optical and X-ray. Outward propagation velocity ~0.5c. Pattern: new wisp forms near pulsar → propagates outward 0.1–0.3 pc → fades as electrons radiate. Cycle repeats with ~months cadence. Animated: wisp emergence and propagation. Crab Nebula movie archetype. |
| Wisps & Variability | Flare Events | uFlareEvents | OFF | Sudden brightness increases (gamma-ray flares) at GeV energies: Crab flares lasting ~days, luminosity increase 10–30×. Origin: magnetic reconnection at/near termination shock or in wind. Rendered as brief brightening #D0D8FF of torus region, duration ~0.5 seconds at animation timescale. First Crab flare: 2010 (Fermi/AGILE). Accelerates electrons to >10¹⁵ eV (above classical synchrotron limit). |
| Surrounding SNR | SNR Shell (Confining) | uSNRShell | ON | Supernova remnant shell surrounding and confining PWN. Shell radius: 2–10 pc (depending on age). Filamentary, expanding at 1000–5000 km/s. Color: #FF6050 (Hα from radiative shocks in filaments). Shell mass: 5–10 M☉ (swept-up ISM + SN ejecta). Crab: distinctive filamentary shell with synchrotron continuum + emission line filaments. FBM filamentary: 7 octaves, freq 5.0, gain 0.08. |
| Surrounding SNR | SNR-PWN Interaction | uSNRPWNInteract | OFF | SNR reverse shock compressing PWN from outside. Young systems: PWN freely expanding within SNR. Older (>few kyr): reverse shock crushes PWN, creating asymmetric "relic" PWN offset from pulsar. Rendered as compressed boundary layer where SNR reverse shock meets PWN outer edge. Instabilities at interface. PWN shape distorted by asymmetric reverse shock. |
| Camera | Full Nebula View | uCameraMode | ON | Default: showing complete PWN structure — central pulsar, torus, jets, and surrounding SNR shell. Distance: 5 pc. FOV 40°. Shows hierarchical structure from pulsar to SNR. Crab Nebula-like presentation. |
| Camera | Torus Close-Up | uCameraMode | OFF | Zoomed to equatorial torus and jet base region. Distance: 0.5 pc. FOV 25°. Wisp dynamics, torus structure, jet knots visible in detail. Chandra X-ray image perspective. |
| Camera | Time Speed Multiplier | uTimeSpeed | 1 month/s | 1 real second = 1 month. Wisp propagation clearly visible (~0.5c outward motion). Flare events appear as brief flashes. Torus variability on month timescale matches real-time observation cadence. Pulsar rotation far too fast to resolve. |

---

### Type Ia Supernova

**Entity ID:** ENT-8028
**Description:** Thermonuclear detonation of a carbon-oxygen white dwarf — standardizable candle used to discover cosmic acceleration (dark energy). Peak luminosity: M_B ≈ -19.3 (5×10⁹ L☉), standardizable to ~7% distance accuracy via Phillips relation (brighter-slower). Explosion mechanism: deflagration → detonation transition (DDT). Ejecta: ~0.6 M☉ of ⁵⁶Ni (radioactive → powers light curve), total mass ~1.4 M☉, velocity ~10⁴ km/s. No remnant (complete disruption). Progenitor debate: single-degenerate (WD + companion accretion to Chandrasekhar limit) vs double-degenerate (WD-WD merger). Colors: peak #FFFAE0 (blue-white, T ~12000 K), 2 weeks #FFE8C0 (cooling, ~8000 K), nebular #FFD0A0 (Fe-group dominated, >60 days). Real exemplars: SN 2011fe (nearby, well-observed, M101), SN 1994D (prototypical), SN 2014J (nearest in decades, M82).

**Section Count:** 7 (Explosion Dynamics, Light Curve, Ejecta Structure, Spectral Evolution, Progenitor System, Remnant/Aftermath, Camera)
**Feature Count:** 25

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Explosion Dynamics | Deflagration Phase | uDeflagrationPhase | ON | Initial subsonic thermonuclear burning front: deflagration flame propagating through WD interior. Flame speed: ~100–1000 km/s (subsonic in degenerate matter). Buoyancy-driven: hot ash rises, flame surface wrinkles (Rayleigh-Taylor). Burning produces intermediate-mass elements (Si, S, Ca) and some ⁵⁶Ni. Color: #FFE0A0 (burning front, T ~5×10⁹ K). WD expands, density decreases. |
| Explosion Dynamics | Detonation Transition | uDetonationTransition | OFF | Deflagration-to-detonation transition (DDT): when pre-expanded WD density drops to ~10⁷ g/cm³, detonation wave ignites. Supersonic burning: sweeps through remaining fuel in ~1 second. Completes nucleosynthesis: C/O → ⁵⁶Ni + IME. Color: #FFFFFF (detonation shock, extreme brightness). DDT explains layered ejecta structure. Animated: flame → sudden bright flash → expanding debris. |
| Explosion Dynamics | Asymmetric Ignition | uAsymmetricIgnition | OFF | Deflagration may ignite off-center (one or few ignition points near WD center). Creates inherent asymmetry in explosion. Single-bubble ignition → strong asymmetry. Multi-bubble → more symmetric. Viewed from different angles: SN Ia appearance varies by ~0.1–0.3 mag (viewing angle effect). Rendered as asymmetric burning region within expanding WD. |
| Light Curve | Rise to Peak | uRiseToPeak | ON | Brightness increases over ~17–20 days from explosion to B-band maximum. Powered by expanding and heating photosphere + increasing ⁵⁶Ni → ⁵⁶Co decay deposition. Color: rapidly bluing #FFE0B0 → #FFFAE0. Peak luminosity: M_B ≈ -19.3 ± 0.3 (before standardization). Photosphere recedes through ejecta as opacity decreases. |
| Light Curve | Phillips Relation | uPhillipsRelation | OFF | Brighter SNe Ia decline slower: Δm₁₅(B) correlation (magnitude decline in 15 days post-peak). Range: Δm₁₅ = 0.8 (bright, slow, 91T-like) to 1.9 (faint, fast, 91bg-like). Standardization reduces dispersion to ~0.12 mag → 6% distance accuracy. Visualization: light curve shape variation with brightness overlaid. Cosmological distance ladder keystone. |
| Light Curve | Nebular Phase Decline | uNebularDecline | ON | After ~60 days: ejecta optically thin, "nebular" phase. Powered by ⁵⁶Co → ⁵⁶Fe decay (τ = 77 days). Decline rate: ~1 mag per 60 days (if full γ-ray trapping). Late-time (>200 days): ⁵⁷Co and possibly positron escape modify rate. Color: #FFD0A0 (Fe-group emission lines dominate). Rendered as slowly fading, reddening expanding cloud. |
| Ejecta Structure | Layered Composition | uLayeredEjecta | ON | DDT produces stratified ejecta: outer (fastest, >15000 km/s) — unburned C/O + IME (Si, S, Ca), #C8C0B0. Middle (10000–15000 km/s) — IME-dominated, #D0B890. Inner (slow, <10000 km/s) — ⁵⁶Ni/Fe-group, #E8C070 (radioactive glow). Layering directly visible in time-evolving spectra as photosphere recedes through layers. Cross-section visualization. |
| Ejecta Structure | ⁵⁶Ni Distribution | uNi56Distribution | ON | Radioactive ⁵⁶Ni mass: 0.4–0.9 M☉ (determines peak luminosity). Concentrated in inner ejecta but some mixing outward during deflagration phase. Rendered: inner bright core #FFD050 (radioactive heating), decreasing outward. Ni mass directly proportional to peak luminosity and light curve width. Casts "glow from within" illuminating outer layers. |
| Ejecta Structure | Ejecta Expansion | uEjectaExpansion | ON | Homologous expansion: v ∝ r (free expansion after ~10 seconds). Maximum velocity: ~30000 km/s (outer edge). Ejecta radius: R(t) = v_max × t. At peak (~20 days): R ~10¹⁵ cm (~70 AU). Animated: smoothly expanding, photosphere receding. Opacity: decreasing as ρ drops ∝ t⁻³. Color: cooling from blue-white to yellow-orange. |
| Spectral Evolution | Photospheric Phase Spectra | uPhotosphericSpectra | OFF | First ~60 days: photosphere present, absorption lines with P Cygni profiles. Dominant features: Si II λ6355 (defining feature — "silicon signature"), Ca II, S II, Fe II. Velocity from blueshift: ~10000–15000 km/s near peak. Visualization: expanding shell with labeled absorption regions. Si line velocity evolution diagnostic of explosion physics. |
| Spectral Evolution | Nebular Emission Lines | uNebularEmission | OFF | After ~60 days: forbidden emission lines from optically thin ejecta. Dominant: [Fe II], [Fe III], [Co III] (inner ejecta), [Ca II], [O I] (outer layers if unburned material present). Color-coded emission: Fe #D0A050, Ca #8AB0C0, O #5A8A5A. Line profiles reveal 3D distribution of elements. Asymmetry indicators. |
| Progenitor System | Single-Degenerate Progenitor | uSDProgenitor | OFF | WD accreting from companion star (red giant, subgiant, or main sequence). Accretion rate: ~10⁻⁷ M☉/yr. WD grows toward Chandrasekhar limit (1.38 M☉). Pre-explosion: binary system with Roche lobe overflow. Rendered: WD #E0E8F0 + companion #FF8040 (red giant) with accretion stream. Carbon ignition when M_WD → M_Ch. Companion may survive (hypervelocity star). |
| Progenitor System | Double-Degenerate Progenitor | uDDProgenitor | OFF | Two WDs inspiraling via gravitational wave emission, merging in violent event. Total mass ≥ 1.2 M☉ (sub-Chandrasekhar or super-Chandrasekhar). Merger timescale: 10⁶–10¹⁰ years after formation. Rendered: two WDs #E0E8F0 spiraling inward, merger disruption, detonation. No surviving companion (key observational discriminant). GW emission in LISA band pre-merger. |
| Progenitor System | Companion Interaction Signs | uCompanionSigns | OFF | If single-degenerate: signatures of companion in SN. Stripped hydrogen from companion: narrow Hα emission at late times. Shock interaction with companion: UV/X-ray flash in first hours. Companion shadow: asymmetry in early light curve. Rendered: asymmetric early emission, companion star at edge of ejecta. No convincing companion detection yet — favoring DD channel? |
| Remnant/Aftermath | No Compact Remnant | uNoRemnant | ON | Complete thermonuclear disruption — no neutron star or black hole left. Distinguished from core-collapse SN (which leaves NS/BH). Ejecta freely expand into ISM. Center of explosion: empty. Rendered: expanding debris cloud with vacant center (contrast with core-collapse where central object remains). |
| Remnant/Aftermath | Ia SNR (Remnant) | uIaSNR | OFF | Supernova remnant from Ia: Sedov-Taylor blast wave expanding into ISM. Age: centuries to millennia. Shell-type morphology (no central pulsar/PWN). Fe-rich interior (Ia nucleosynthesis fingerprint) surrounded by IME-rich shell. Color: #FF6050 (shock-heated filaments). Tycho's SNR (SN 1572): prototypical Ia remnant. Balmer-dominated shocks at outer edge. |
| Camera | Peak Brightness View | uCameraMode | ON | Default: SN Ia at peak luminosity, showing blue-white photospheric disk. Distance: 10¹⁵ cm (~70 AU). FOV 30°. Single brilliant sphere of light. Host galaxy background. Photosphere: ~10000 km/s expansion visible as growing sphere over observation. |
| Camera | Ejecta Structure View | uCameraMode | OFF | Cross-section or transparent view showing layered ejecta composition. Inner ⁵⁶Ni core, IME middle, unburned outer shell. Educational: shows nucleosynthetic structure. Distance: 10¹⁵ cm. Composition color-coded. |
| Camera | Time Speed Multiplier | uTimeSpeed | 1 day/s | 1 real second = 1 day. Rise to peak: ~20 real seconds. Peak → nebular transition over ~60 seconds. Full light curve evolution (200 days) in ~3 minutes. Ejecta expansion clearly visible. |

---

### Accretion Disk (Standalone)

**Entity ID:** ENT-8031
**Description:** Rotating structure of gas and dust spiraling inward toward a central gravitating body, converting gravitational potential energy to thermal radiation and kinetic energy — the most efficient energy source in astrophysics (up to 42% mass-energy conversion for maximally spinning BH, vs 0.7% for nuclear fusion). Standalone visualization: generic accretion disk applicable to multiple contexts (SMBH, stellar-mass BH, WD, protostar). Temperature profile: T(r) ∝ r^(-3/4) (Shakura-Sunyaev thin disk). Colors: inner disk #D0E0FF (UV-blue-white, T ~10⁵–10⁷ K for BH), outer disk #E8D0A0 (optical/IR, T ~10³–10⁴ K), corona #A0B0D0 (hot, T ~10⁹ K), jet #6A80B0 (synchrotron). Disk luminosity: L = ηṀc² where η = 0.06–0.42. Real exemplars: M87* (EHT imaged shadow), Cygnus X-1 (stellar-mass BH), SS 433 (precessing jets).

**Section Count:** 8 (Disk Structure, Temperature Profile, Relativistic Effects, Corona & X-ray, Jet Launching, Variability, Disk States, Camera)
**Feature Count:** 27

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Disk Structure | Geometrically Thin Disk | uThinDisk | ON | Standard Shakura-Sunyaev α-disk: H/R ≈ 0.01–0.1 (geometrically thin, optically thick). Surface density Σ(r) decreasing outward. Vertical structure: isothermal to first order. Disk extends from ISCO (innermost stable circular orbit) to outer truncation radius. Color: radial gradient inner #D0E0FF → outer #E8D0A0. Aspect ratio exaggerated 2–5× for visibility. |
| Disk Structure | Inner Edge (ISCO) | uISCO | ON | Inner disk edge at ISCO: r_ISCO = 6 R_g (non-spinning BH, Schwarzschild) to 1.235 R_g (maximally spinning prograde, Kerr). Inside ISCO: gas plunges radially, no stable orbits. Sharp brightness cutoff at ISCO. Rendered as distinct inner boundary. Spin parameter a* determines ISCO radius → determines radiative efficiency. Toggle: a* = 0 vs 0.998. |
| Disk Structure | Spiral Density Waves | uSpiralDensity | OFF | Non-axisymmetric structure: spiral density perturbations from disk self-gravity or companion tidal effects. 2–4 trailing spiral arms in disk surface density. Enhancement: 10–50% above azimuthal average. Color: slightly brighter #E0D8C0 along spiral ridges. Spiral pattern rotates at pattern speed (not material speed). Visible in simulations, inferred observationally. |
| Disk Structure | Disk Warp | uDiskWarp | OFF | Misalignment between BH spin axis and outer disk angular momentum → Bardeen-Petterson warped disk. Inner disk aligns with BH spin. Outer disk retains original orientation. Warp transition radius: 10–100 R_g. Rendered as smoothly twisted disk surface. Warp causes apparent disk shape variation with viewing angle. Precessing warp creates quasi-periodic oscillations (QPOs). |
| Temperature Profile | Radial Temperature Gradient | uTempGradient | ON | T(r) = T_max × (r/r_in)^(-3/4) × f(r) where f accounts for zero-torque boundary. T_max at ~1.36× ISCO: 10⁵–10⁷ K (SMBH) or 10⁷–10⁸ K (stellar BH). Rendered as smooth color gradient: inner UV-white #D0E0FF → mid optical #F8E8D0 → outer IR #E8C890. Blackbody spectrum at each radius (multi-temperature disk model). |
| Temperature Profile | Hotspot at ISCO | uHotspotISCO | OFF | Maximum temperature slightly outside ISCO (viscous dissipation peak). Annular bright region at ~1.3–1.5 × r_ISCO. T_peak: 10⁷ K (stellar BH, 10 M☉), 10⁵ K (SMBH, 10⁸ M☉). Color: #D8E8FF (peak emission). Luminosity: 50% of disk emission from inner few ISCO radii. Most intensely radiating region. |
| Temperature Profile | Spectral Energy Distribution | uSED | OFF | Multi-temperature blackbody SED visualization. Each annulus contributes Planck function at local T. Sum: "disk spectrum" — broader than single blackbody, peaking at kT_max. UV bump in AGN spectra = "big blue bump." Rendered as color bars showing spectral components from different disk radii. Educational: connects spatial structure to observed spectrum. |
| Relativistic Effects | Gravitational Redshift | uGravRedshift | ON | Light from inner disk gravitationally redshifted: Δλ/λ = (1 - R_s/r)^(-1/2) - 1. At ISCO (Schwarzschild): z_grav = 0.41. Color shift: inner disk appears redder than intrinsic temperature. Rendered: inner disk shifted from intrinsic #D0E0FF toward #D8E0D0 (visible gravitational reddening). More pronounced closer to BH. |
| Relativistic Effects | Doppler Beaming/Boosting | uDopplerBeaming | ON | Approaching side of disk (blue-shifted, boosted) appears brighter than receding side (red-shifted, dimmed). Orbital velocity at ISCO: 0.3–0.5c → significant beaming. Asymmetry factor: up to 3–5× brightness ratio approaching vs receding. Rendered as brightness asymmetry across disk. Approaching limb: #C8E0FF (blue-shifted, bright). Receding: #E0D0B0 (red-shifted, dim). |
| Relativistic Effects | Light Bending / Photon Ring | uLightBending | ON | Photons from back side of disk bent over BH, creating apparent "wrapping" of disk behind BH. At inclination ~70°: far side of disk appears to fold up above BH shadow. Photon ring at ~2.6 R_g (unstable photon orbit) creates thin bright ring. M87* EHT image: photon ring dominates appearance. Rendered with ray-traced light paths around BH. |
| Relativistic Effects | Black Hole Shadow | uBHShadow | ON | Dark silhouette of BH against bright disk emission. Shadow diameter: ~5.2 R_g (Schwarzschild) = 10.4 GM/c². For M87*: ~42 μas. Rendered as dark central circle/crescent (shape depends on spin and inclination). Brightest ring at shadow edge: lensed photon ring. EHT observation at 230 GHz resolved M87* shadow. |
| Corona & X-ray | Hot Corona | uHotCorona | OFF | Compact region (r ~5–30 R_g) of hot electrons: T ~10⁹ K (100 keV). Geometry: slab above disk, sphere, or lamppost (on jet axis above BH). Inverse-Compton scatters disk UV photons to X-ray. Produces power-law X-ray spectrum (Γ ~1.5–2.5). Rendered as diffuse glow #A0B0D0, opacity 0.15 above disk center. 10–50% of bolometric luminosity in corona. |
| Corona & X-ray | Coronal Flares | uCoronalFlares | OFF | Rapid X-ray brightness variations: factor 2–10 over hours–days. Magnetic reconnection events in corona. Duration: hours. Color: bright flash #C0D0E0 from corona region. Coronal height changes inferred from reverberation. Rendered as stochastic brightness enhancement of corona. Analogy with solar flares but ~10⁸× more energetic. |
| Jet Launching | Relativistic Jet | uRelJet | OFF | Collimated outflow along BH spin axis, powered by Blandford-Znajek mechanism (extracting BH rotational energy via magnetic fields). Jet speed: 0.9–0.999c. Opening angle: 1–5°. Color: #6A80B0 (synchrotron emission). Jet power: up to ~ĖBZ = (a*/M)² × Ṁc². Bilateral, perpendicular to disk. Magnetic field: helical, collimating jet via hoop stress. |
| Jet Launching | Jet Base/Footprint | uJetBase | OFF | Jet launching region near BH: funnel-shaped zone above/below disk along rotation axis. Magnetic field lines threading BH ergosphere extract spin energy. Jet base: broad (~30° cone), collimating to ~5° within 10² R_g. Color: #8098C8. Poynting flux dominated near base → kinetic flux dominated far from base. Rendered as funnel opening into collimated jet. |
| Variability | Quasi-Periodic Oscillations | uQPOs | OFF | Quasi-periodic brightness modulations: frequencies 0.1–450 Hz (stellar-mass BH). Low-frequency QPO: ~1–10 Hz (possibly disk precession). High-frequency QPO: ~100–450 Hz (possibly orbital frequency at ISCO). Rendered as periodic intensity modulation of inner disk brightness, shown as ripple animation. QPO frequency constrains BH mass and spin. |
| Variability | Accretion Rate Fluctuations | uAccrateFluctuations | OFF | Stochastic accretion rate variations propagating inward through disk. Outer disk variability (timescale ~days–months) modulates inner disk emission (timescale ~ms–s). Log-normal flux distribution. Rendered as brightness "waves" propagating inward through disk on viscous timescale. Explains X-ray variability power spectrum (1/f type). |
| Disk States | High/Soft State | uHighSoftState | ON | Default state: geometrically thin, optically thick disk extending to ISCO. Spectrum dominated by thermal disk component (blackbody, kT ~1 keV). High luminosity: L > 0.1 L_Edd. Disk color: bright #C0D8F0. Steady, low variability. Standard Shakura-Sunyaev disk. |
| Disk States | Low/Hard State | uLowHardState | OFF | Low accretion rate state: inner disk evaporates to hot optically thin flow (RIAF/ADAF). Inner disk truncated at 10–100 R_g (not at ISCO). Spectrum: hard power-law from corona/RIAF. Disk dimmer: #D0C8A0 (outer only). Inner region filled with hot flow #8A7A5A (ADAF, T ~10¹⁰ K, radiatively inefficient). Strong jet often present in this state. |
| Disk States | Super-Eddington State | uSuperEddington | OFF | Accretion rate exceeds Eddington: Ṁ > Ṁ_Edd. Disk puffs up (H/R ~1, geometrically thick). Radiation-driven outflow/wind from disk surface. Effective temperature: capped at ~T(L_Edd). Color: bright #D0E8FF but with wind/funnel structure. Photon trapping in inner regions. SS 433 archetype (super-Eddington with precessing jets). ULX sources may be super-Eddington. |
| Camera | Edge-On Relativistic View | uCameraMode | ON | Default: disk at ~75° inclination showing full relativistic effects — Doppler asymmetry, gravitational redshift, light bending, BH shadow, photon ring. Distance: 100 R_g. FOV 30°. M87*-like presentation showing crescent asymmetry. Most scientifically interesting viewing angle. |
| Camera | Face-On Thermal View | uCameraMode | OFF | Looking down disk axis: shows circular disk with radial temperature gradient. BH shadow as dark central spot. No Doppler asymmetry (face-on). Symmetric appearance. Distance: 200 R_g. FOV 40°. Shows temperature profile cleanly. |
| Camera | Time Speed Multiplier | uTimeSpeed | 100 R_g/c per s | 1 real second = 100 gravitational time units. Orbital period at ISCO (ms for stellar BH, hours for SMBH) visible as rotation. Variability patterns (QPOs, flares) visible. Relativistic effects apparent in inner disk dynamics. |

---

### Bow Shock Nebula (Stellar)

**Entity ID:** ENT-8032
**Description:** Arc-shaped nebula formed where a star's wind or magnetosphere collides with the interstellar medium as the star moves supersonically through space. Stand-off distance: R_0 = √(Ṁv_w/(4πρ_ISM v_*²)) — balance between stellar wind ram pressure and ISM ram pressure. Morphology: parabolic shock front on leading side, elongated tail on trailing side. Common around: runaway O/B stars, pulsars, AGB stars, red supergiants. Colors: shock-heated gas #FF5050 (Hα, if radiative shock), stellar wind bubble #6A8AAA (hot interior), ISM pile-up #D0C8B0. Mach number: 1–30 depending on stellar velocity (10–200 km/s) and ISM sound speed (~10 km/s). Real exemplars: Zeta Ophiuchi (runaway O star, IR bow shock), LL Orionis (in Orion Nebula), Vela pulsar bow shock, Mira's UV tail (300 pc long).

**Section Count:** 7 (Shock Structure, Stellar Wind, ISM Interaction, Tail Structure, Emission Properties, Stellar Context, Camera)
**Feature Count:** 25

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Shock Structure | Parabolic Shock Front | uShockFront | ON | Leading bow shock: parabolic shape (Wilkin 1996 analytic solution for thin-shell limit). Stand-off distance: 0.01–1 pc from star depending on wind power and ISM density. Shock front: compressed ISM and wind material. Color: #FF5050 (Hα emission from radiative shock, T ~10⁴ K post-shock). Shock thickness: ~0.01 R₀. Mach number determines compression ratio (4:1 for strong shock). FBM ripple: freq 8.0, amp 0.02 (instabilities). |
| Shock Structure | Contact Discontinuity | uContactDiscontinuity | ON | Interface between shocked stellar wind (hot, tenuous) and shocked ISM (warm, dense). Inside contact: #6A8AAA (hot wind, T ~10⁶–10⁷ K, low density). Outside contact: #D0C0A0 (warm ISM, T ~10⁴ K, higher density). Kelvin-Helmholtz instabilities at interface: corrugated surface with wavelength ~0.1 R₀. Rendered as transition layer between two fluid colors. |
| Shock Structure | Reverse Shock | uReverseShock | OFF | Inner shock where stellar wind decelerates from free expansion. Reverse shock radius: ~0.5 R₀ from star (in forward direction). Wind velocity drops from 1000–2000 km/s to near-stationary. Temperature jump: wind heated to T ~10⁷ K. Rendered as inner arc #5A7A9A, opacity 0.1. Space between reverse shock and contact discontinuity filled with hot shocked wind. |
| Stellar Wind | Wind Bubble Interior | uWindBubble | ON | Hot shocked stellar wind filling interior between star and contact discontinuity. T ~10⁶–10⁷ K (adiabatic shock for fast winds). Pressure-confined by ISM. Rendered as diffuse X-ray emitting volume #6A8AAA, opacity 0.04. Bubble elongated trailing star (hydrodynamic flow). Total thermal energy: 10⁴⁴–10⁴⁸ erg depending on wind power and age. |
| Stellar Wind | Free-Streaming Wind Region | uFreeWind | OFF | Unshocked stellar wind between star and reverse shock. Expanding radially at terminal velocity v_∞ = 1000–3000 km/s (OB star winds), 10–30 km/s (AGB/RSG winds). Density: ρ ∝ r⁻² (free expansion). Nearly invisible (low density, high velocity). Rendered as radial flow lines #A0B8C0, opacity 0.02 from star to reverse shock. |
| Stellar Wind | Wind Mass-Loss Indicator | uWindMassLoss | OFF | Visualization of stellar wind parameters. Ṁ = 10⁻⁹–10⁻⁵ M☉/yr (depending on stellar type: 10⁻⁵ for O star, 10⁻⁷ for AGB). v_∞ = 10–3000 km/s. Ṁv_∞ = wind momentum rate, determining stand-off distance. Rendered as scaled particle density in wind. Wind kinetic energy: 10³³–10³⁷ erg/s. |
| ISM Interaction | ISM Pile-Up Layer | uISMPileUp | ON | Compressed ambient ISM accumulated ahead of bow shock. Density enhancement: 4× (strong shock) to 2× (weak shock). Layer thickness: ~0.05–0.2 R₀. Color: #D0C8B0 (compressed dust and gas, enhanced thermal IR emission). Dust heated by shock to T ~50–200 K (mid-IR bright). Zeta Ophiuchi: spectacular IR bow shock from Spitzer/WISE. |
| ISM Interaction | ISM Density Variations | uISMDensity | OFF | Non-uniform ISM creates asymmetric bow shock. Higher density side: smaller stand-off distance, brighter shock. Lower density: larger distance, fainter. Rendered: asymmetric shock with variable brightness and distance from star. Ripples and instabilities enhanced where ISM is clumpy. Cloud-shock interactions produce bright knots. |
| ISM Interaction | Dust Wave | uDustWave | OFF | For radiation-dominant stars: dust grains pushed ahead of gas by radiation pressure, creating a "dust wave" leading the gas shock. Dust wave radius: slightly larger than gas shock. Infrared bright: #D0B890, opacity 0.05. Dust wave and gas shock separation: ~10–30% of R₀. Detected in IR around Zeta Ophiuchi and other O stars. |
| Tail Structure | Trailing Tail | uTrailingTail | ON | Wake extending behind star (opposite to velocity direction). Stripped stellar wind and ISM material flowing into elongated tail. Length: 1–100× R₀ (can extend parsecs). Width: gradually widening downstream. Color: #A09880 (mixed wind + ISM, fading). Instabilities: Kelvin-Helmholtz vortex street visible in tail. FBM turbulence: 6 octaves, freq 3.0, amp 0.05. |
| Tail Structure | Mira-Type Extended Tail | uExtendedTail | OFF | Extreme case: Mira's tail extending ~4 pc (13 light-years), visible in UV. Created by UV fluorescence of material shed by AGB star over ~30000 years. Color: #7090B0 (UV emission), extremely faint in visible. Tail traces stellar trajectory through space. Knots from mass-loss variations. Rendered as very long, narrow structure behind star. |
| Tail Structure | Vortex Shedding | uVortexShedding | OFF | Von Kármán vortex street in bow shock wake at moderate Reynolds numbers. Alternating vortices shed from shock flanks. Vortex spacing: ~2–4× R₀. Rendered as alternating circulation patterns #8A9A8A in tail. Visible in hydrodynamic simulations, potentially in high-resolution observations. Animation: vortices forming and advecting downstream. |
| Emission Properties | Hα Emission Map | uHalphaEmission | ON | Hydrogen-alpha emission from shock-heated gas at 10⁴ K. Brightest at shock apex, fading along flanks. Color: #FF5050, emission factor 0.5. Surface brightness: 10–1000 Rayleigh. Morphology: thin arc following shock shape plus diffuse emission in post-shock cooling zone. Width of Hα arc: cooling length ~0.01 R₀. Limb-brightened (edge brighter than face). |
| Emission Properties | IR Dust Continuum | uIRDustContinuum | OFF | Thermal IR emission from shock-heated dust. Peak wavelength: 24–70 μm (warm dust, T ~100–200 K). Brightest in pile-up layer where ISM dust compressed and heated. Color rendering: #C8A870 (IR-warm). WISE/Spitzer/JWST imaging: many stellar bow shocks discovered in IR. Spatial offset from Hα: dust emission slightly ahead of Hα (dust heated before gas ionization). |
| Emission Properties | X-ray Hot Interior | uXrayInterior | OFF | Hot gas in shocked wind interior: T ~10⁶–10⁷ K. X-ray luminosity: 10²⁸–10³² erg/s (faint). Rendered: #5A7A9A, opacity 0.03, filling bow shock interior. Only detectable for nearby, powerful wind sources. Chandra and XMM-Newton: few X-ray bow shocks detected. Diagnostic of wind parameters independent of IR/optical. |
| Stellar Context | Runaway Star Trajectory | uRunawayTrajectory | OFF | Many bow shock stars are runaways: ejected from birth cluster by dynamical ejection or supernova kick. Velocity: 20–200 km/s. Trajectory: straight line from birth cluster position. Rendered as dotted line #FF8040, opacity 0.08 trailing from star back toward birth association. Travel time: 10⁵–10⁷ years from ejection. Bow shock direction indicates velocity vector. |
| Stellar Context | Central Star | uCentralStar | ON | Star generating the wind. OB runaway: #B0C8FF (hot, luminous). AGB/RSG: #FF8040 (cool, extended). Pulsar: #D0D8FF (compact point). Star positioned at focus of bow parabola, offset from shock apex by R₀. Star's motion relative to ISM generates entire structure. Luminosity class determines wind properties and hence bow shock size. |
| Camera | Bow Shock Head-On | uCameraMode | ON | Default: viewing bow shock from slightly off-axis, showing parabolic front, tail extending behind. Distance: 5 R₀. FOV 40°. Star visible at parabola focus. Full shock morphology. ISM flow direction indicated. |
| Camera | Edge-On Arc View | uCameraMode | OFF | Viewing along direction perpendicular to star motion: shock appears as arc spanning ~90–180°. Limb-brightened. Tail extending to one side. Distance: 3 R₀. Shows cross-section geometry. |
| Camera | Time Speed Multiplier | uTimeSpeed | 10³ yr/s | 1 real second = 1000 years. Shock structure relatively stable (dynamical time R₀/v* ~10⁴ yr). Instabilities develop and advect. ISM density variations create time-varying shock shape. Star motion visible as drift. |

---

### Cosmic Microwave Background

**Entity ID:** ENT-8034
**Description:** Relic radiation from the Big Bang — the oldest observable light in the universe, emitted when the cosmos became transparent at age ~380,000 years (z ≈ 1100). Perfect blackbody spectrum at T = 2.7255 ± 0.0006 K. Isotropic to 1 part in 100000, with tiny temperature anisotropies (ΔT/T ~10⁻⁵) encoding initial density fluctuations that seeded all cosmic structure. Angular power spectrum: acoustic peaks from baryon-photon fluid oscillations before recombination. Measured by: COBE (discovery of anisotropies, 1992), WMAP, Planck (2018 final results). Colors: CMB at actual temperature invisible (peak at 160 GHz / 1.9 mm microwave), rendered as: dipole #D04040 (hot) to #4040D0 (cold), anisotropy map uses conventional red-blue colormap.

**Section Count:** 7 (Blackbody Spectrum, Temperature Anisotropies, Angular Power Spectrum, Polarization, Foreground Contamination, Cosmic History Context, Camera)
**Feature Count:** 25

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Blackbody Spectrum | Perfect Blackbody Visualization | uBlackbodySpectrum | ON | Most perfect blackbody in nature: T = 2.7255 K, peak at ν = 160.2 GHz (λ = 1.87 mm). COBE/FIRAS measurement: deviation from Planck function < 50 ppm. Rendered as smooth spectral curve overlay. Photon density: 411 photons/cm³ (most abundant particles in universe). Energy density: 0.26 eV/cm³. Rendered as uniform warm glow #0A0A12 (barely visible representation of microwave background). |
| Blackbody Spectrum | Redshift History | uRedshiftHistory | OFF | CMB temperature scales with redshift: T(z) = T₀(1+z). At emission (z=1100): T ≈ 3000 K (visible orange-red light #FF8040). Today: 2.725 K (microwave). Animated: sphere of last scattering cooling from glowing orange to invisible microwave as universe expands. Demonstrates cosmic cooling. Photon wavelength stretches from ~1 μm to ~1.9 mm. |
| Blackbody Spectrum | SZ Effect Spectral Distortion | uSZEffect | OFF | Sunyaev-Zel'dovich effect: CMB photons scattered by hot ICM electrons in galaxy clusters. Spectral distortion: decrement below 218 GHz, increment above. ΔT/T ~10⁻⁴ toward clusters. Rendered as cluster-associated cold/hot spot: cold #3A3AA0 at low frequency, hot #A03A3A at high frequency. Size: cluster angular diameter (~10 arcmin). Independent of cluster distance — unique cosmological probe. |
| Temperature Anisotropies | Dipole Anisotropy | uDipoleAniso | ON | Largest anisotropy: ΔT = 3.36 mK dipole from Solar System motion through CMB rest frame. Velocity: 369.82 ± 0.11 km/s toward (l,b) = (264°,48°). Hot hemisphere: #D05050 (+3.36 mK). Cold hemisphere: #5050D0 (-3.36 mK). Rendered as hemisphere coloring on sky sphere. Must be subtracted to see primordial signal. Doppler effect: approaching CMB photons blue-shifted. |
| Temperature Anisotropies | Primary Anisotropy Map | uPrimaryAniso | ON | Primordial temperature fluctuations: ΔT/T ~10⁻⁵ (±200 μK). Seeds of all cosmic structure — density variations at recombination. Angular scale: 0.1° to 180°. Color map: conventional red (#C03030) = hot (+200 μK), blue (#3030C0) = cold (-200 μK), neutral #808080 (average). Rendered on celestial sphere in Mollweide projection or as surrounding sky. Planck satellite resolution: 5 arcmin. |
| Temperature Anisotropies | Cold Spot | uColdSpot | OFF | Anomalously cold region at (l,b) ≈ (210°,-57°): ~70 μK colder and ~10° diameter, 3σ outlier from ΛCDM expectation. Possible origins: supervoid (ISW effect), texture (topological defect), statistical fluke. Rendered as distinctive cold patch #2A2AA0 on anisotropy map. One of several "CMB anomalies" testing standard cosmological model. |
| Temperature Anisotropies | Hot and Cold Spots Statistics | uSpotStatistics | OFF | Spot size distribution: characteristic scale ~1° (first acoustic peak). Hot spots (peaks) and cold spots (troughs) equally abundant (Gaussian random field). Topology: hot spots surrounded by cold annuli and vice versa (oscillation pattern). Genus statistic: number of hot spots minus cold spots ≈ 0 for Gaussian field. Rendered with spot identification markers. |
| Angular Power Spectrum | Acoustic Peak Structure | uAcousticPeaks | OFF | CMB angular power spectrum: ℓ(ℓ+1)C_ℓ vs multipole ℓ. Seven acoustic peaks detected by Planck. First peak at ℓ ≈ 220 (~1°): sound horizon at recombination. Peak ratios encode: Ω_b (odd/even ratio), Ω_m (overall envelope), Ω_k (first peak position). Rendered as spectral curve overlay. Each peak = harmonic of baryon-photon fluid oscillation. "Music of the cosmos." |
| Angular Power Spectrum | Silk Damping Tail | uSilkDamping | OFF | Small-scale anisotropies suppressed by photon diffusion (Silk damping). Scale: ℓ > 1000 (< 0.2°). Exponential cutoff in power spectrum. Damping length depends on matter-radiation ratio. Rendered as power spectrum showing steep decline at high ℓ. Measures: photon mean free path at recombination, epoch of matter-radiation equality. |
| Polarization | E-Mode Polarization | uEModePol | OFF | CMB polarization from Thomson scattering of anisotropic radiation at last scattering surface. E-mode: curl-free pattern aligned with temperature anisotropies. Amplitude: ~5 μK (10× weaker than temperature). Rendered as line segments on CMB map showing polarization direction/amplitude. E-modes measured by Planck, DASI, BICEP. Confirms standard recombination model. |
| Polarization | B-Mode Polarization (Lensing) | uBModeLensing | OFF | B-mode (divergence-free) polarization generated by gravitational lensing of E-modes by large-scale structure. Amplitude: ~0.1 μK. Rendered as curl-pattern line segments. Measured by POLARBEAR, SPTpol, BICEP2/Keck. Lensing B-modes confirmed — "guaranteed" signal from known physics. Maps mass distribution along line of sight. |
| Polarization | Primordial B-Modes (GW) | uPrimordialBModes | OFF | Hypothetical B-mode signature from inflationary gravitational waves. Amplitude parameterized by tensor-to-scalar ratio r. Current upper limit: r < 0.036 (BICEP/Keck 2021). If detected: direct evidence of inflation. Rendered as large-scale curl pattern #5A8A5A at low-ℓ (>2° scales). Smoking gun for inflation — major experimental target (CMB-S4, LiteBIRD). |
| Foreground Contamination | Galactic Synchrotron | uGalacticSync | OFF | Milky Way synchrotron radiation contaminating low-frequency CMB observations. Concentrated along galactic plane. Color: #A06050 (dominates at ν < 70 GHz). Must be separated from CMB using multi-frequency observations. Rendered as bright band #A06050 along galactic plane on CMB sky. Component separation algorithms remove this to reveal CMB. |
| Foreground Contamination | Galactic Dust Emission | uGalacticDust | OFF | Milky Way thermal dust emission contaminating high-frequency CMB. Concentrated along galactic plane, especially in molecular cloud regions. Color: #C0A080 (dominates at ν > 300 GHz). Must be separated from CMB. BICEP2 2014 initially mistook dust B-modes for primordial signal. Rendered as warm-colored band along galactic plane. |
| Foreground Contamination | Clean CMB Sky Mask | uCMBMask | OFF | Regions of sky where galactic contamination is too strong to extract CMB signal. Masked in analysis: ~20–30% of sky (galactic plane region). Clean sky fraction: 70–80%. Rendered as grayed-out galactic zone #505050, with CMB visible in unmasked regions. Mask design balances sky coverage vs foreground contamination. |
| Cosmic History Context | Surface of Last Scattering | uLastScattering | OFF | CMB photons originate from surface of last scattering: thin shell at z ≈ 1100 (age 380,000 years), thickness Δz ~80 (not infinitely thin). Everything inside this sphere occurred after photon decoupling. Rendered as translucent spherical shell #D0D0E0, opacity 0.05 at comoving distance 46 Gly (conformal). Observer at center. All of observable universe inside this sphere. |
| Cosmic History Context | Recombination Epoch | uRecombination | OFF | Epoch when electrons combine with protons to form neutral hydrogen: T ~3000 K, z ~1100. Before: universe opaque (Thomson scattering). After: transparent (photons free-stream). Transition: over Δz ~80 (not instant — Peebles recombination theory). Animated: opacity transition from opaque orange #FF8040 (coupled) to transparent (free-streaming CMB). Cosmic phase transition. |
| Camera | Full-Sky Map View | uCameraMode | ON | Default: Mollweide projection of full CMB sky. Temperature anisotropy color map filling entire view. Shows large-scale structure: dipole (if enabled), primary anisotropies, cold spot. Scale bar: ΔT in μK. Planck satellite data presentation style. Distance: N/A (observer at center of last scattering sphere). |
| Camera | Zoom to Feature | uCameraMode | OFF | Zoomed to specific angular region (~10° field): shows fine-scale anisotropy structure. Individual hot/cold spots resolved. Polarization vectors visible if enabled. Scale bar: angular size and corresponding physical size at z=1100. Sub-degree structure visible. |
| Camera | Time Speed Multiplier | uTimeSpeed | 10⁹ yr/s | CMB is static snapshot — no temporal evolution observable. Time slider instead controls "look-back" visualization: z=0 → z=1100 animation showing universe heating and becoming opaque. Educational: demonstrates cosmic history. At this time speed, 13.8 Gyr = ~14 real seconds. |

---

### 11.13 Fast Radio Burst Source (FRB Magnetar)

**Entity ID:** ENT-8036
**Base Mesh:** Point source + volumetric burst cone + persistent source halo
**Shader Type:** Fragment (burst dynamics + coherent radio emission visualization)
**Exemplar:** FRB 20200120E (globular cluster), FRB 20180916B (periodic), SGR 1935+2154 (Galactic magnetar FRB)

Fast radio bursts are millisecond-duration coherent radio pulses of extraordinary luminosity (10³⁶–10⁴³ erg), originating at cosmological distances. The confirmed association of FRB 200428 with Galactic magnetar SGR 1935+2154 established magnetars as at least one FRB progenitor class. Repeating FRBs show complex burst morphology — downward frequency drift ("sad trombone"), sub-burst structure, and polarization angle swings consistent with magnetospheric emission. The persistent radio source (PRS) associated with some repeaters (FRB 20121102A) suggests a synchrotron nebula powered by the magnetar wind.

| Section | Feature | Uniform Name | Default | Description |
|---------|---------|-------------|---------|-------------|
| Magnetar Source | Surface Field Visualization | uMagnetarBField | ON | Ultra-strong magnetic dipole field B ~ 10¹⁴–10¹⁵ G. Field lines rendered as curved streamlines from magnetic poles. Color: blue-white #E8E8FF at poles fading to deep violet #4A0A6A at equator. Line density proportional to local B: ~50 lines visible at poles, thinning at equator. Dipole + quadrupole components for realistic non-axisymmetric geometry. |
| Magnetar Source | Neutron Star Core | uNSCore | ON | Compact central object R ~ 10 km. Surface color: cool magnetar #4A4A6A (quiescent) transitioning to burst white #FFFFFF during active state. Surface hotspots at magnetic poles: T ~ 5×10⁶ K, color #8A8AFF. Subtle surface texture from crustal magnetic stress patterns — irregular patches suggesting plate boundaries. |
| Magnetar Source | Magnetosphere Structure | uMagnetosphere | ON | Closed magnetosphere within light cylinder R_LC = c/Ω ~ 5×10⁴ km. Twisted field lines from crustal shear — helical distortion rendered as coil-like perturbation on dipole baseline. Twist angle Δφ ~ 1 radian. Charge-filled magnetosphere: plasma density visualized as faint luminous fog #6A4ABA alpha 0.05 filling closed field region. |
| Magnetar Source | Crustal Fracture Event | uCrustalFracture | ON | Starquake trigger visualization: sudden crack pattern propagating across neutron star surface. Fracture line: bright yellow-white #FFE8A0, width ~0.1 km equivalent. Propagation speed ~0.1c shown as expanding front. Triggers Alfvén wave launch into magnetosphere. Seismic energy release ~10⁴⁴ erg shown as surface brightening wave. |
| Burst Emission | Primary Burst Cone | uBurstCone | ON | Coherent radio emission beam: narrow cone half-angle ~1°–10° aligned with magnetic axis. Visualization: pulsed conical beam, color radio-false-color cyan #00E8FF at peak, fading to #004A6A at edges. Burst duration ~1 ms (stretched for visibility to ~0.5s render time). Peak luminosity ~10⁴² erg/s mapped to brightness. Cone interior: interference-like banding suggesting coherent emission mechanism. |
| Burst Emission | Sub-burst Downward Drift | uSubBurstDrift | ON | "Sad trombone" effect: within each burst, emission drifts from high to low frequency. Visualized as color gradient within burst cone: starts blue-white #C8E8FF (high ν) → shifts to warm gold #FFD868 (low ν) over burst duration. Drift rate dν/dt ~ −200 MHz/ms. Multiple sub-bursts: 2–5 temporal components separated by ~1 ms gaps, each showing independent drift. |
| Burst Emission | Burst Repetition Pattern | uBurstRepetition | ON | Repeating FRB behavior: clustered burst activity within activity windows. Burst rate: variable from 1/hour to 100/hour during active phase. Visualization: stochastic burst firing with Weibull-distributed wait times. Activity window: periodic for FRB 20180916B-type (16.35-day period, ~5-day active window). Burst energy distribution: power-law dN/dE ∝ E^(−1.7). |
| Burst Emission | Polarization Swing | uPolarizationSwing | OFF | Linear polarization angle evolution across burst: PA swing up to 180° suggesting emission from rotating magnetosphere. Rendered as rotating polarization vector overlaid on burst cone. Rotation Measure RM ~ 10⁴–10⁵ rad/m² indicating extreme magneto-ionic environment. Circular polarization: up to ~60% in some bursts, shown as helical twist on beam. |
| Propagation Effects | Dispersion Sweep | uDispersionSweep | ON | Interstellar/intergalactic dispersion: ν⁻² frequency-dependent delay. DM ~ 100–2000 pc/cm³. Visualized as burst cone "stretching" with high-frequency (blue) leading low-frequency (red) by ΔT = 4.15 ms × DM × (ν₁⁻² − ν₂⁻²). At DM=500, 1 GHz arrives ~2 seconds after 2 GHz. Dramatic visual demonstration of electromagnetic dispersion. |
| Propagation Effects | Scattering Tail | uScatteringTail | ON | Multi-path scattering by turbulent plasma: exponential tail on burst profile. Scattering time τ_scat ∝ ν⁻⁴, ranging from ~0.01 ms to >10 ms. Visualized as asymmetric temporal broadening — sharp rise, exponential decay. Scatter-broadened burst appears as comet-like smear. Color: burst color #00E8FF fading through #006A8A to transparent over τ_scat timescale. |
| Propagation Effects | Scintillation Pattern | uScintillation | OFF | Diffractive and refractive scintillation from intervening plasma. Intensity modulations: Δν_diff ~ 0.1–10 MHz decorrelation bandwidth. Visualized as time-frequency waterfall: dynamic spectrum with intensity islands (scintles). Color: bright scintles #40FFFF, nulls #001A2A. Refractive: slow ~day timescale intensity variation, amplitude ~30%. |
| Propagation Effects | Plasma Lensing Events | uPlasmaLensing | OFF | Extreme magnification events from plasma structures along sightline. Magnification factor up to ~100×. Visualized as dramatic brightening + chromatic distortion of burst: different frequencies arrive from different angular positions. Plasma lens: thin sheet at ~100 pc, convergence pattern rendering as shimmering distortion around source. Duration ~hours. |
| Environment | Persistent Radio Source | uPersistentSource | ON | Synchrotron nebula around magnetar (FRB 20121102A archetype). Size ~1 pc. Luminosity ~10²⁹ erg/s/Hz at 1 GHz. Color: warm synchrotron orange #FF8A40 alpha 0.15, centrally concentrated with r⁻² falloff. Spectral index α ~ −0.5 (Fν ∝ ν^α). Powered by magnetar wind: total energy ~10⁴⁸–10⁴⁹ erg, age ~10–100 yr. Slowly fading on decade timescale. |
| Environment | Host Galaxy Context | uHostGalaxy | ON | FRB host galaxy rendered as background: diverse morphologies (dwarf irregular for FRB 20121102A, massive spiral for FRB 20180916B). FRB offset from host center: 0–10 kpc. Some FRBs in globular clusters (FRB 20200120E in M81 GC). Host galaxy as diffuse background glow, color matched to galaxy type. Redshift range z ~ 0.01–1+. |
| Environment | Supernova Remnant Shell | uSNRShell | OFF | If young magnetar: surrounding supernova remnant shell. Age-dependent: <1000 yr old, expanding shell R ~ 1–5 pc. Shell color: shock-heated #FF4A4A at forward shock, cooler filaments #4A8AFF. FRB must propagate through SNR adding DM ~ 1–100 pc/cm³ and scattering. Shell becomes increasingly diffuse with age; >10⁴ yr effectively invisible. |
| Environment | Magnetar Wind Nebula | uWindNebula | OFF | Relativistic e⁺e⁻ wind from magnetar: confined by SNR or ambient medium. Luminosity ~10³⁴ erg/s (X-ray). Morphology: equatorial torus + polar jets (Crab-like). Color: synchrotron blue-white #A8C8FF alpha 0.1. Wind termination shock at R_s ~ 0.01–0.1 pc. Wisps and knots from wind variability. Provides persistent emission context for FRB source. |
| Temporal | Burst Waterfall Display | uWaterfallDisplay | ON | Dynamic spectrum (time-frequency) visualization: horizontal axis = time (ms), vertical axis = frequency (GHz). Burst appears as dispersed sweep from upper-left to lower-right. Color: intensity mapped #000A1A (background) → #00A8FF (moderate) → #FFFFFF (peak). Sub-burst components visible as separate drift bands. Standard radio astronomy visualization format. |
| Temporal | Activity Cycle | uActivityCycle | OFF | Long-term activity modulation: periodic (P ~ 16 days for FRB 20180916B) or stochastic (Poisson-clustered for FRB 20121102A). Active window visualization: magnetar brightens during active phase. Cycle represented as orbital indicator or rotating lighthouse beam for periodic type. Burst rate histogram overlay showing temporal clustering. |
| Temporal | Wait-Time Distribution | uWaitTimeViz | OFF | Statistical visualization of inter-burst intervals. Bimodal distribution: short waits ~10 ms (sub-burst clustering) + long waits ~minutes-hours (between burst groups). Histogram overlay: log-normal + Poisson components. Weibull shape parameter k ~ 0.7 indicating non-Poisson clustering. Color: histogram bars #40C8FF on dark background #0A0A1A. |
| Physics | Coherent Emission Mechanism | uCoherentMech | OFF | Visualization of proposed emission mechanism: bunched curvature radiation or synchrotron maser. Charge bunches: groups of ~10²⁵ particles radiating coherently (brightness temperature T_B ~ 10³⁶ K). Rendered as tight particle clumps along curved field lines, each emitting in-phase wavefronts. Constructive interference pattern shown as reinforced wave crests. |
| Physics | Magnetic Reconnection | uMagReconnection | OFF | Alternative/complementary mechanism: magnetic field annihilation in magnetosphere. Current sheet formation at Y-point. Reconnection rate ~0.1 v_A. Plasmoid chain: multiple magnetic islands (#FF6AFF outlines) ejected along current sheet. Particle acceleration to Lorentz factor γ ~ 10³–10⁴. Energy release ~10³⁹ erg per reconnection event. |
| Physics | Energy Budget Display | uEnergyBudget | OFF | Isotropic equivalent energy per burst: E_iso ~ 10³⁶–10⁴³ erg (beaming-corrected: ÷10²–10⁴). Total energy budget comparison: magnetar rotational energy E_rot ~ 2×10⁴⁶ erg, magnetic energy E_mag ~ 3×10⁴⁷ erg (for B=10¹⁵ G). Displayed as energy bar chart overlay. Cumulative burst energy shown as depleting reservoir. |
| Camera | Standard View | uCameraMode | ON | Default: magnetar at center with magnetosphere structure visible. Burst cone extending toward observer (foreshortened). Persistent source as diffuse halo. Scale bar: light-cylinder radius marked. Host galaxy as background. Distance: labeled in Mpc with redshift z annotation. DM contribution breakdown: MW, host, IGM components. |
| Camera | Burst Close-Up | uCameraMode | OFF | Zoomed to magnetar surface during burst event. Crustal fracture visible, Alfvén wave propagating upward, charge bunches accelerating along field lines, coherent emission cone forming at ~10 stellar radii. Millisecond-timescale animation. Dramatic perspective showing extreme physics in compact region <100 km. |
| Camera | Time Speed Multiplier | uTimeSpeed | 10⁶× | At default: 1 ms burst rendered over ~1 second. Activity cycle visible over minutes. Burst clustering apparent. Slowdown to 1× for detailed sub-burst structure (each sub-burst occupies ~0.5 seconds render time). Speed up to 10⁹× for activity window cycling and long-term rate evolution. |

---

### 11.14 Circumstellar Envelope / AGB Shell

**Entity ID:** ENT-8038
**Base Mesh:** Nested spherical shells + bipolar/multipolar outflow cones + detached arcs
**Shader Type:** Fragment (dusty envelope radiative transfer + molecular emission + mass-loss history)
**Exemplar:** IRC+10216 (carbon-rich), Mira (omi Cet, oxygen-rich), CW Leonis, R Sculptoris (detached shell), AFGL 2688 (Egg Nebula, proto-PN)

Asymptotic giant branch (AGB) stars lose mass at prodigious rates (10⁻⁷–10⁻⁴ M☉/yr) through pulsation-driven dust-condensation winds, building extensive circumstellar envelopes (CSEs) extending to ~1 pc. These envelopes record the star's mass-loss history in their radial density structure — thermal pulses create discrete shells, and the transition from spherical AGB wind to aspherical proto-planetary nebula reveals the onset of fast bipolar outflows. The CSE chemistry (C-rich vs O-rich) determines dust mineralogy and molecular inventory, producing dramatically different spectral signatures and visual appearances. CSEs are primary sites of cosmic dust production and molecular complexity, seeding the ISM with processed material.

| Section | Feature | Uniform Name | Default | Description |
|---------|---------|-------------|---------|-------------|
| Central Star | AGB Star Photosphere | uAGBPhotosphere | ON | Luminous cool giant: L ~ 3000–10000 L☉, T_eff ~ 2000–3500 K, R ~ 1–3 AU. Color: deep orange-red #FF4A0A (M-type O-rich) or warm red #E83A0A (C-type carbon star). Mira-type pulsation: ΔR/R ~ 20%, period 200–500 days. Visual magnitude variation ΔV ~ 2–8 mag. Surface: large convection cells visible as 3–5 bright patches on limb-darkened disk. |
| Central Star | Pulsation Cycle | uPulsationCycle | ON | Radial pulsation drives mass loss: star expands and cools → dust condenses → radiation pressure on dust accelerates wind. Pulsation period P ~ 300 days (Mira archetype). Visualization: star radius oscillates sinusoidally with 20% amplitude. Color shifts: maximum compression T~3500K #FF8A2A → maximum expansion T~2000K #CC2A0A. Phase-dependent dust formation zone highlighted. |
| Central Star | TDU Surface Composition | uTDUComposition | ON | Third dredge-up (TDU) brings ¹²C from He-shell flashes to surface. C/O ratio determines chemistry: <1 = M-star (O-rich, TiO bands, silicate dust), >1 = carbon star (C₂, CN bands, SiC/amorphous carbon dust). Visualized as surface color tint: O-rich #FF6A2A (TiO absorption), C-rich #E84A0A (C₂/CN deep red). S-star intermediate C/O≈1: #F05A1A. |
| Dust Formation | Inner Dust Condensation Zone | uDustCondensation | ON | Dust forms where T drops below condensation temperature at R ~ 2–5 R★ (2–10 AU). O-rich: Al₂O₃ at ~1500K first (#D8C8B8), then silicates at ~1000K (#C8B090). C-rich: amorphous carbon at ~1500K (#3A2A1A), SiC at ~1200K (#8A7A5A). Condensation front rendered as semi-transparent shell, opacity building outward. Grain size ~0.01–1 μm. |
| Dust Formation | Dust Shell Opacity | uDustOpacity | ON | Circumstellar dust extinction: τ_V ~ 1–100 depending on mass-loss rate. Visualization: central star progressively obscured by dust — at Ṁ > 10⁻⁵ M☉/yr, star invisible at optical, envelope appears as infrared source only. Shell color transitions: inner hot dust #FFA860 (near-IR glow) → outer cool dust #4A2A1A (far-IR only, rendered as dark absorption against background). |
| Dust Formation | Dust Grain Scattering | uGrainScattering | OFF | Dust scattering creates reflection nebulosity: scattered starlight visible in near-IR even when direct starlight extinguished. Color: wavelength-dependent — blue-shifted scattering #FFB878 for larger grains (not Rayleigh). Scattering asymmetry parameter g ~ 0.5 (forward-throwing). Creates bright central peak in scattered light images with diffuse halo. Phase function: Henyey-Greenstein. |
| Wind Structure | Steady-State Wind Profile | uSteadyWind | ON | Smooth r⁻² density profile from constant mass-loss rate. Terminal velocity v_∞ ~ 5–25 km/s (slow compared to hot-star winds). Velocity profile: β-law v(r) = v_∞(1 − R★/r)^β with β ~ 0.5–1. Density: n(r) = Ṁ/(4πr²v(r)μm_H). Visualization: radially decreasing opacity, color gradient from warm inner #C88A50 to cool outer #4A3A2A. Extent: 10⁴–10⁵ AU. |
| Wind Structure | Thermal Pulse Shells | uThermalPulseShells | ON | He-shell thermal pulses (every ~10⁴ yr for ~3 M☉ AGB) cause mass-loss rate surges. Creates concentric detached shells in CSE. R Sculptoris archetype: shell at R ~ 1500 AU, ΔR/R ~ 0.05 (geometrically thin). Each shell: enhanced density (×3–10 over steady wind), visible as ring in scattered light. Color: dust-scattered starlight #E8C890 alpha 0.3. Typically 3–10 shells visible within 0.5 pc. |
| Wind Structure | Bipolar Outflow Onset | uBipolarOutflow | OFF | Transition from spherical AGB wind to aspherical proto-PN: fast collimated outflow (~100–200 km/s) breaks through slow AGB envelope. AFGL 2688 (Egg Nebula) archetype. Bipolar lobes: scattering nebulae #FFE8C0 illuminated by obscured central star through equatorial dust torus. Lobe opening angle: 20°–60°. Equatorial density enhancement: ×10–100 over polar directions. |
| Wind Structure | Spiral/Arc Pattern | uSpiralArc | OFF | Binary companion sculpts wind into Archimedean spiral. CW Leonis (IRC+10216) archetype: spiral arm spacing = v_wind × P_orb ≈ 100–1000 AU. Visualized as incomplete arcs seen in cross-section. Density enhancement in spiral ~×2–5 over inter-arm. Color: dust-scattered #D8B880 alpha 0.2. Binary separation: 10–100 AU typically. Creates beautiful geometric pattern in envelope. |
| Molecular Emission | CO Rotational Lines | uCOEmission | ON | CO J-transitions trace entire wind: CO is last molecule photodissociated (R_phot ~ 10¹⁷ cm). Line profiles: parabolic (resolved, optically thick) or flat-topped (marginally resolved). Visualization: molecular emission zone as green-blue false-color #40A878 overlay on envelope, extent from dust formation zone to CO photodissociation radius. Traces kinematics: expanding shell creates characteristic double-peaked profile. |
| Molecular Emission | SiO Maser Shell | uSiOMaser | ON | SiO masers at R ~ 2–4 R★ (within dust formation zone). T ~ 1000–2000K. Maser spots: compact (~1 AU), bright, clustered in ring around star. Color: intense green #40FF40 (false-color radio). Ring radius varies with pulsation phase. Proper motions track wind acceleration zone. Spots: 10–50 per ring, individually resolved in VLBI. Variability correlated with optical pulsation. |
| Molecular Emission | H₂O Maser Shell | uH2OMaser | OFF | Water masers at R ~ 5–50 R★ (outer dust formation/wind acceleration zone). Stronger in O-rich envelopes. Maser spots color: cyan #00FFE8 (false-color). Shell geometry: roughly spherical but clumpy. Velocities: show wind acceleration in progress. Some super-masers at L ~ 1 L☉ maser luminosity. Proper motions measurable on ~year timescales. |
| Molecular Emission | OH Maser Shell | uOHMaser | OFF | Hydroxyl masers at R ~ 10¹⁵–10¹⁶ cm (outer envelope). 1612 MHz main-line. Double-peaked spectrum: blue and red peaks from front and back of expanding shell. Color: orange #FF8A00 (false-color). O-rich only. Amplifies background continuum (stellar radio emission). Shell radius measurable via time delay between blue/red peak variations (phase-lag method for distance). |
| Molecular Emission | Carbon Chain Chemistry | uCarbonChains | OFF | C-rich CSE: extraordinary molecular complexity. >80 molecules detected in IRC+10216. Concentric shells of different species at characteristic photodissociation radii: inner — HCN, C₂H₂, SiC₂ (#FF4040 false-color); middle — HC₃N, C₄H (#FF8040); outer — CN, C₂H, C₃N shell-like distributions (#FFCC40). Each species' peak radius reflects UV-driven chemistry. |
| Infrared Emission | Near-IR Scattered Light | uNearIRScatter | ON | 1–5 μm: combination of hot dust thermal emission + scattered starlight. Inner envelope R < 100 AU dominates. Color: warm gold #FFC860. Morphology: centrally peaked, reveals asymmetries (disk, bipolar, clumps). Polarization: high (up to 50%) indicating scattering — polarization vectors tangential to star direction. IRC+10216 shows time-variable clumpy structure at this scale. |
| Infrared Emission | Mid-IR Dust Features | uMidIRFeatures | ON | 8–30 μm: diagnostic dust features. O-rich: 9.7 μm silicate (absorption in high-τ, emission in low-τ), 18 μm silicate. C-rich: 11.3 μm SiC emission, 30 μm MgS feature. Visualization: false-color thermal emission #FF6830 for warm dust, spectral feature overlay as colored rings at characteristic temperatures. Feature strength indicates optical depth and dust composition unambiguously. |
| Infrared Emission | Far-IR Cool Dust | uFarIRDust | OFF | 30–500 μm: cool outer envelope dust T ~ 20–100K. Dominates total luminosity budget for high-Ṁ sources. Extended structure: R ~ 10⁴–10⁵ AU. Color: deep red false-color #8A2A1A for 50K, transitioning to #3A1A0A for 20K outer regions. Traces integrated mass-loss history over ~10⁴ years. Herschel/ALMA observations resolve multiple shells at these wavelengths. |
| Interaction | ISM Bow Shock | uISMBowShock | ON | Fast-moving AGB star (v★ ~ 20–80 km/s) sweeps up ISM ahead of wind. Mira (omi Cet) archetype: spectacular UV bow shock + 4 pc cometary tail. Parabolic standoff distance R_s = √(Ṁv_w/(4πρ_ISM v★²)) ~ 0.01–0.1 pc. Shock color: compressed ISM #6A4AFF (UV emission from Mira), heated dust #FF4A2A. Tail: stripped envelope material trailing behind, ~2–4× star extent. |
| Interaction | UV Photodissociation Front | uPhotodissociation | ON | External ISRF UV defines outer envelope boundary. CO photodissociation at R ~ 10¹⁶–10¹⁷ cm. H₂ photodissociation farther out. Front visualization: transition from molecular (color #4A6A3A, molecule-bearing) to atomic (#8A8AAA, neutral) to ionized (#AAA0FF, if near UV source) gas. Sharp boundary for CO, more gradual for H₂. Asymmetric if near hot star: photodissociation region compressed on facing side. |
| Interaction | Detached Shell Evolution | uDetachedShellEvol | OFF | Old thermal-pulse shells expand and thin: R(t) = R₀ + v_w × Δt. Shell merges with ISM at R ~ 0.5–1 pc. Interaction with ISM: deceleration, instabilities at shell-ISM boundary. Rayleigh-Taylor fingers developing at ×10⁴ yr age. Multiple shells at different radii show different evolutionary stages. Oldest shells nearly indistinguishable from ISM — only ALMA CO mapping reveals them. |
| Temporal | Mass-Loss History Reconstruction | uMLHistory | ON | Radial density profile encodes mass-loss history: ρ(r) → Ṁ(t) via t = r/v_w. Visualization: color-coded density map with timeline annotation. Thermal pulse spikes: sudden Ṁ increase ×10 for ~100 yr every ~10⁴ yr. Superwind phase: final ~10⁴ yr with Ṁ > 10⁻⁵ M☉/yr (up to 10⁻⁴). Transition to proto-PN: wind velocity jump + collimation onset. Timeline spans ~10⁵ yr of stellar evolution. |
| Temporal | Maser Variability Animation | uMaserVariability | OFF | Maser spot positions, velocities, and intensities animated over pulsation cycle. SiO: ring contracts/expands with phase, spots appear/disappear. Period: 300–500 days. H₂O: less regular variability, some spots persist for years. OH: smooth sinusoidal variation with ~1-year delay from optical (light-travel time across envelope). Beautiful demonstration of CSE dynamics at different radii. |
| Chemistry | C-rich vs O-rich Toggle | uChemistryType | C-rich | Master toggle selecting carbon-rich or oxygen-rich chemistry. C-rich (C/O>1): amorphous carbon + SiC dust, carbon chains (HC₃N, C₄H, C₆H), PAHs in outer shell. Color palette: deeper reds #CC3A0A, darker dust #2A1A0A. O-rich (C/O<1): silicate + alumina dust, TiO/VO molecular absorption, OH/H₂O masers dominant. Color palette: warmer oranges #FF6A2A, brighter scattering #E8C8A0. Switches all dependent features simultaneously. |
| Chemistry | Dust-to-Gas Ratio | uDustToGas | 0.005 | Ψ = M_dust/M_gas ~ 0.001–0.01 (C-rich higher than O-rich). Controls overall opacity: higher Ψ → more obscured star, stronger IR emission. Visualization: slider adjusts envelope transparency. At Ψ = 0.001: star barely veiled, #FFA840 tint. At Ψ = 0.01: star fully obscured, envelope opaque, color shifts to pure IR emission #FF3A0A → #8A1A0A. Determines wind driving efficiency: higher Ψ → faster, denser wind. |
| Camera | Standard View | uCameraMode | ON | Default: envelope filling frame, central star as bright point (if visible through dust). Concentric shell structure visible in scattered light. Scale bar: 10⁴ AU marked. Maser spot positions overlaid if enabled. Color: composite of scattered light + thermal emission. For heavily obscured sources: IR false-color rendering showing dust glow. |
| Camera | Cross-Section View | uCameraMode | OFF | Meridional slice through envelope: density structure revealed. Color map: log density from outer ISM #0A0A1A through wind #4A3A2A to dust formation zone #FFA040 to stellar surface #FF4A0A. Shell structures, bipolar cavities, spiral patterns visible in cross-section. Annotations: v(r) velocity vectors, T(r) temperature contours, R_dust, R_CO marked. Educational view of entire CSE physics. |
| Camera | Time Speed Multiplier | uTimeSpeed | 10⁸× | At default: pulsation cycle (~1 yr) completes in ~0.3 seconds. Thermal pulse interval (~10⁴ yr) → ~3 seconds between shell ejections. Wind crossing time (~10⁵ yr) → ~30 seconds for full envelope evolution. Maser variability visible as flickering at default speed. Slow to 1× for detailed pulsation dynamics, maser proper motions. |

---

### 11.15 Supermassive Black Hole (SMBH)

**Entity ID:** ENT-8040
**Base Mesh:** Accretion flow + photon ring + jet (optional) + stellar orbits
**Shader Type:** Fragment (GR ray-tracing + accretion flow + photon sphere + shadow)
**Exemplar:** M87* (EHT first image, 6.5×10⁹ M☉), Sgr A* (EHT, 4×10⁶ M☉), TON 618 (6.6×10¹⁰ M☉)

Supermassive black holes (10⁶–10¹⁰ M☉) reside at the centers of virtually all massive galaxies. Unlike stellar-mass BHs (which are already in the doc), SMBHs have event horizons spanning AU-scale sizes, accretion physics operating on hours-to-years timescales, and direct gravitational influence over entire galactic nuclei. The Event Horizon Telescope produced humanity's first direct images of M87* (2019) and Sgr A* (2022), revealing the photon ring and black hole shadow. This entity focuses on the SMBH-specific phenomena distinct from the stellar BH entity: the photon ring morphology, stellar dynamics around the BH, the M-σ relation context, and the EHT-resolved structure.

| Section | Feature | Uniform Name | Default | Description |
|---------|---------|-------------|---------|-------------|
| Shadow & Photon Ring | Black Hole Shadow | uBHShadow | ON | Dark central region: photon capture cross-section = 27 R_s²/4 (Schwarzschild), appearing as dark disk of radius ~2.6 R_s (gravitational lensing enlarges shadow beyond horizon). M87*: shadow diameter ~42 μas, R_s ~ 60 AU. Sgr A*: ~52 μas, R_s ~ 0.08 AU. Color: #000000 (absolute dark). This IS the EHT image's central feature. Shape: nearly circular for moderate spin, D-shaped for maximal spin (a → 1). |
| Shadow & Photon Ring | Photon Ring | uPhotonRing | ON | Bright ring of radius ~2.6 R_s: lensed emission from all azimuths around BH. THE defining EHT feature. Color: M87* — asymmetric brightness #FFD080 (south brighter, Doppler from clockwise rotation). Sgr A* — variable brightness, stochastic hotspot orbits. Ring width: unresolved by EHT but predicted to contain nested sub-rings (n=1,2,3... images). Each sub-ring: exponentially thinner (demagnification factor e^(−2π)). |
| Shadow & Photon Ring | Photon Ring Asymmetry | uRingAsymmetry | ON | Brightness asymmetry from Doppler boosting: approaching side of accretion flow brighter by factor ~δ³ ~ 2–10. M87*: south side brighter (jet approaching from NW). Sgr A*: asymmetry direction varies (hotspot orbital motion). Rendered: ring brightness varies sinusoidally around azimuth. Brightness ratio: 2:1 to 10:1 depending on inclination and spin. |
| Accretion | RIAF / ADAF Flow | uRIAFFlow | ON | Sgr A* accretion: radiatively inefficient accretion flow (RIAF/ADAF). Ṁ ~ 10⁻⁸ M☉/yr (far below Eddington). Hot ions T_i ~ 10¹² K, cooler electrons T_e ~ 10¹⁰ K. Geometrically thick, optically thin. Color: #FF8A40 (synchrotron, peaks at ~230 GHz = EHT frequency). Turbulent structure: MAD (magnetically arrested disk) state. FBM: 5-octave, freq 6.0, amplitude 0.3. |
| Accretion | Orbiting Hotspots | uOrbitingHotspots | ON | Sgr A*-specific: bright hotspots orbiting near ISCO. Period: ~30 minutes at ISCO for Sgr A* (R_ISCO = 6 R_g for a=0). GRAVITY instrument: detected clockwise orbital motion during flares. Rendered: 1–2 bright knots #FFD060 orbiting in accretion flow. Apparent motion: projected ellipse due to strong-field lensing. Brightness: flare by ×10–100. Duration: ~1–2 hours. |
| Accretion | Magnetically Arrested Disk (MAD) | uMADState | OFF | Accumulated magnetic flux near BH reaches saturation: ΦBH ~ √(Ṁc). Magnetic pressure ≈ ram pressure. Creates magnetically dominated funnel along polar axis. Rendered: strong ordered B-field lines #6A6AFF near BH, magnetic flux tubes visible. MAD state: prerequisite for powerful jet launching. M87*: inferred to be in MAD state from jet power and EHT polarization. |
| Jet | Relativistic Jet Base | uJetBase | OFF | M87* jet: resolved by EHT at base. Jet launching zone: within ~10 R_g. Parabolic collimation: z ∝ r^(1.7) (M87 jet profile). Base diameter: ~5 R_s. Lorentz factor: Γ ~ 2–5 at base, accelerating to Γ ~ 10+ at 1000 R_g. Color: #8AA0D0 (synchrotron). Blandford-Znajek mechanism: jet power extracted from BH spin. P_jet ~ 10⁴²–10⁴⁵ erg/s. |
| Jet | Jet Polarization Structure | uJetPolarization | OFF | EHT polarization: reveals magnetic field geometry at jet base. M87*: ordered spiral B-field pattern in photon ring region. Polarization fraction: 5–15% (partially ordered field). EVPA pattern: azimuthal spiral suggesting vertical + toroidal field. Rendered: polarization tick marks overlaid on photon ring. Confirms MAD state and connects horizon-scale physics to kpc-scale jet. |
| Stellar Environment | S-Star Orbits (Sgr A*) | uSStarOrbits | ON | Stars orbiting Sgr A*: S2/S0-2 (P = 16 yr, a = 1000 AU, v_max = 7650 km/s = 2.5% c). Rendered: elliptical orbits #FFE0A0 around central BH. Multiple stars: S2, S62 (P = 9.9 yr), S4711 (P = 7.6 yr). Gravitational redshift and Schwarzschild precession detected in S2 orbit. Pericenter: 120 AU = 1400 R_s. These orbits PROVED the BH. |
| Stellar Environment | Stellar Cusp / Core | uStellarCusp | OFF | Nuclear star cluster around SMBH: R ~ 1–5 pc, M ~ 10⁷ M☉ (Sgr A*) or 10⁸–10⁹ M☉ (M87*). Stellar density: rising toward center as ρ ∝ r^(−1.5 to −1.8). Rendered as increasing stellar density #F0D8A0 toward center. Core: possible Bahcall-Wolf cusp vs. observed core (depletion within ~0.1 pc). Young stars: paradox of youth near Sgr A* — disk of young O/B stars at 0.04–0.4 pc. |
| Scaling | Mass Scale Comparison | uMassScale | OFF | Educational: SMBH mass range visualization. Sgr A*: 4×10⁶ M☉ (R_s = 0.08 AU, fits inside Mercury orbit). M87*: 6.5×10⁹ M☉ (R_s = 130 AU, larger than solar system to Pluto). TON 618: 6.6×10¹⁰ M☉ (R_s = 1300 AU). Size comparison overlay with solar system. M-σ relation: BH mass correlates with galaxy bulge velocity dispersion. |
| Camera | Standard View (EHT-style) | uCameraMode | ON | Default: EHT-style rendering. Photon ring + shadow dominating frame. Asymmetric brightness. Accretion flow structure visible. Scale bar: R_s marked. Color: M87* style #FFD080 asymmetric ring on #000000 background. Inclination: M87* at ~17° from face-on, Sgr A* at ~30°. |
| Camera | S-Star Orbit View | uCameraMode | OFF | Sgr A* perspective: stellar orbits around invisible central mass. S2 orbit filling frame. Scale bar: 1000 AU. Stars as moving points, orbital tracks traced. Demonstrates mass measurement by Keplerian fitting. BH invisible except through gravitational effects. Complementary to EHT view. |
| Camera | Time Speed Multiplier | uTimeSpeed | 1 yr/s | Sgr A* hotspot orbit (30 min) visible at 10⁴× speed. S2 orbit (16 yr) at default: ~16 seconds. M87* EHT variability (days-weeks) visible. Jet evolution at 10⁶ yr/s. Accretion flow turbulence: slow to 1 hr/s for Sgr A* flare dynamics. |

---

### 11.16 X-ray Binary (HMXB / LMXB)

**Entity ID:** ENT-8042
**Base Mesh:** Binary system (compact object + donor star + accretion stream/disk)
**Shader Type:** Fragment (accretion disk + Roche geometry + X-ray illumination + jet)
**Exemplar:** Cygnus X-1 (HMXB, BH), Scorpius X-1 (LMXB, NS), GRS 1915+105 (microquasar), Her X-1 (LMXB, pulsing NS)

X-ray binaries are systems where a compact object (neutron star or black hole) accretes matter from a companion star, producing luminous X-ray emission (L_X ~ 10³⁶–10³⁹ erg/s). High-mass X-ray binaries (HMXBs) have O/B star donors with wind-fed or Roche-lobe overflow accretion; low-mass X-ray binaries (LMXBs) have K/M star donors with Roche-lobe overflow. Microquasars (GRS 1915+105, SS 433) produce relativistic jets analogous to scaled-down AGN jets. X-ray binaries cycle through spectral states (hard/soft) reflecting accretion geometry changes, show quasi-periodic oscillations (QPOs), and in the case of NS accretors, X-ray bursts from thermonuclear runaways.

| Section | Feature | Uniform Name | Default | Description |
|---------|---------|-------------|---------|-------------|
| Compact Object | Neutron Star / Black Hole | uCompactObject | BH | Toggle: BH (no surface, ISCO at 6 R_g) or NS (surface R ~ 10 km, magnetic poles). BH: #000000 central dark object, only accretion disk visible. NS: #D8D8FF surface with hotspots at magnetic poles #FFFFFF. BH mass: 5–20 M☉ (Cyg X-1: 21 M☉). NS mass: 1.4–2.1 M☉. This toggle changes multiple dependent features (surface emission, bursts, pulsations). |
| Compact Object | NS Magnetic Poles / X-ray Pulsations | uNSPulsations | OFF | NS only: magnetic field (B ~ 10⁸–10¹² G) channels accretion onto polar caps. Hotspot T ~ 10⁷–10⁸ K, size ~1 km. Color: #FFFFFF (X-ray bright). Pulsation: rotation sweeps hotspot across line of sight. Period: 0.001–1000 s. Pulse fraction: 10–80%. Her X-1 (P = 1.24 s), Cen X-3 (P = 4.8 s). Rendered as rotating lighthouse beam from NS surface. |
| Donor Star | Donor Star Rendering | uDonorStar | ON | HMXB donor: O/B supergiant, R ~ 20–30 R☉, T ~ 25,000–40,000K, color #B0C8FF. Fills or nearly fills Roche lobe. Strong stellar wind: Ṁ ~ 10⁻⁶ M☉/yr. LMXB donor: K/M dwarf, R ~ 0.5–1 R☉, T ~ 3500–5000K, color #FFA040. Fills Roche lobe (mass transfer through L1). Irradiation: X-ray heated face of donor brighter #FFE8D0. |
| Donor Star | Roche Lobe Geometry | uRocheLobe | ON | Equipotential surfaces of binary: rendered as wireframe #6A6AAA. L1 point: mass transfer nozzle. Donor fills its Roche lobe (LMXB) or wind passes through accretion radius (HMXB). Mass ratio q = M_donor/M_compact determines lobe geometry. L1 stream: visible as bright accretion stream #FFB060 connecting donor to disk. |
| Accretion | Accretion Disk | uAccretionDisk | ON | Standard thin disk (Shakura-Sunyaev) for LMXB/HMXB Roche-lobe overflow. R_out ~ 0.3–0.5 × orbital separation. R_in = ISCO (BH) or NS surface. T profile: T(r) ∝ r^(−3/4), T_max ~ 10⁷ K (inner disk). Color gradient: outer disk #FF6030 → inner disk #D0E0FF → #FFFFFF (X-ray hot). FBM structure: 4-octave, freq 12.0, amplitude 0.08. Disk precession: superhumps in some systems. |
| Accretion | Accretion Stream from L1 | uL1Stream | ON | Matter flowing through L1 Lagrange point: ballistic stream then circularizing at disk. Stream color: #FFA060, width ~10⁹ cm. Impact point on disk outer edge: bright spot #FFE0A0 (hotspot). Stream velocity: ~freefall speed at L1 ~ 100 km/s. Rendered as curved stream from donor to disk, with bright impact region. Hotspot can dominate optical lightcurve. |
| Accretion | Spectral State Changes | uSpectralState | ON | Hard state: geometrically thick, optically thin inner flow (hot corona #D0D0FF around compact object, truncated thin disk). Soft state: thin disk extends to ISCO, no corona. Intermediate: both present. Toggle switches accretion geometry. BH XRBs: state transitions on weeks-months timescale (outburst cycle). Hysteresis: hard→soft at higher luminosity than soft→hard. |
| Accretion | X-ray Corona | uXrayCorona | ON | Hot electron corona: T_e ~ 10⁹ K, τ ~ 0.5–2. Compton upscatters disk photons to X-ray. Geometry: sandwich (above/below disk) or lamppost (on jet axis above BH). Color: #C0D0FF, alpha 0.15, compact region near compact object. Size: ~10–100 R_g. Hard state: corona dominant. Soft state: corona weak. Power-law X-ray spectrum: Γ ~ 1.5–3.0. |
| Jets | Relativistic Jet (Microquasar) | uMicroJet | OFF | Steady compact jet in hard state: flat-spectrum synchrotron, Lorentz factor Γ ~ 2–5. Color: #8AA0D0. Continuous, compact, often unresolved. Jet power: ~10% of accretion luminosity. Quenched in soft state (jet-disk coupling). GRS 1915+105: superluminal ejections β_app ~ 1.5c. SS 433: precessing jets at 0.26c, corkscrew morphology. |
| Jets | Discrete Jet Ejection | uJetEjection | OFF | Transient jet ejections during hard-to-soft state transition: bright radio blobs. Lorentz factor Γ ~ 2–10. Bilateral but usually one-sided (Doppler). Ejection events: ~1 per outburst cycle. GRS 1915+105 archetype. Rendered: bright knots #C0D0FF ejected bilaterally from compact object. Proper motion: arcsec/day at kpc distance. Dramatic transient events. |
| Variability | QPO (Quasi-Periodic Oscillation) | uQPO | OFF | Characteristic X-ray timing feature: quasi-periodic modulation at 0.01–1000 Hz. Low-frequency QPO: 0.1–30 Hz (accretion flow precession). High-frequency QPO: 100–450 Hz (orbital frequency near ISCO — GR diagnostic). Rendered as pulsating brightness on accretion flow. kHz QPOs in NS systems: twin peaks at ν₁, ν₂ with Δν related to NS spin. |
| Variability | X-ray Burst (NS only) | uXrayBurst | OFF | Type I X-ray burst: thermonuclear runaway on NS surface. Duration: 10–100 s. Peak luminosity: near Eddington L_E ~ 2×10³⁸ erg/s. Burst oscillations: ~300–600 Hz (NS spin). Rendered: dramatic brightening of NS surface #FFFFFF, expanding photosphere (super-Eddington bursts). Recurrence: hours to days. Superbursts: 10³ × longer from carbon burning. |
| Variability | Outburst Cycle (BH) | uOutburstCycle | OFF | BH LMXB transients: quiescent (L_X ~ 10³¹ erg/s) → outburst (L_X ~ 10³⁸ erg/s). Outburst duration: weeks-months. Recurrence: years-decades. Hardness-intensity diagram: q-shaped track. Rendered as slow brightening → state transition → slow fading. A0620-00, GRS 1915+105 (perpetual outburst 1992–2018). |
| Orbital | Orbital Motion | uOrbitalMotion | ON | Binary orbital period: HMXB 1–10 days, LMXB 0.5–12 hours (ultra-compact: 10–40 minutes). Rendered: orbital animation showing both components. Cyg X-1: P = 5.6 days. Sco X-1: P = 18.9 hr. Eclipses if i ~ 90°: partial/total eclipses of X-ray source by donor. Ellipsoidal variations: donor tidally distorted, lightcurve modulated at P_orb. |
| Camera | Standard View | uCameraMode | ON | Default: binary system viewed at ~45° inclination. Donor star, accretion disk, stream, and compact object visible. X-ray glow from inner disk. Scale bar: R☉ for LMXB, 10 R☉ for HMXB. Orbital motion animated. Roche lobe wireframe shown. |
| Camera | Accretion Close-Up | uCameraMode | OFF | Zoomed to inner accretion disk: ISCO region, corona, jet base. NS: surface with hotspots visible. BH: shadow and innermost disk. Scale bar: 100 km (NS) or R_g (BH). X-ray emission region dominates. QPO modulation visible if enabled. |
| Camera | Time Speed Multiplier | uTimeSpeed | 100× | At default: orbital period visible in seconds (LMXB P ~ 2 hr → 72 seconds). State transitions (weeks) → minutes. X-ray bursts (seconds) need 1× speed. QPOs need 0.01× or slower. Outburst cycle: 10⁵× to see years-long evolution. |

---

### 11.17 Tidal Disruption Event (TDE)

**Entity ID:** ENT-8044
**Base Mesh:** SMBH + disrupting star + accretion stream + debris disk
**Shader Type:** Fragment (tidal deformation + stream dynamics + super-Eddington accretion + optical/UV flare)
**Exemplar:** AT2019dsg (neutrino-associated), ASASSN-14li (canonical), AT2022cmc (jetted TDE), PS1-10jh (early discovery)

A tidal disruption event occurs when a star approaches a supermassive black hole within its tidal radius R_t = R★(M_BH/M★)^(1/3), where tidal forces exceed the star's self-gravity, tearing it apart. Half the stellar debris becomes bound and returns to pericenter, forming an accretion disk and producing a luminous flare (L ~ 10⁴³–10⁴⁵ erg/s) lasting months to years. TDEs probe otherwise-dormant SMBHs in quiescent galaxies, provide real-time laboratories for accretion physics, and occasionally launch relativistic jets (AT2022cmc). ~100+ TDEs discovered, mostly by optical transient surveys (ZTF, ASAS-SN). Detection rate: ~10⁻⁵ per galaxy per year.

| Section | Feature | Uniform Name | Default | Description |
|---------|---------|-------------|---------|-------------|
| Pre-Disruption | Approaching Star | uApproachingStar | ON | Solar-type star on nearly parabolic orbit: periapsis at R_t = R★(M_BH/M★)^(1/3) ~ 50 R☉ for M_BH = 10⁶ M☉. Star color: #FFF0D0 (Sun-like). Approach velocity: ~10,000 km/s at R_t. Star initially spherical, begins elongating at ~3 R_t as tidal force ramps up. Rendered: star moving on parabolic trajectory toward central SMBH (shown as dark point #000000). |
| Pre-Disruption | Tidal Deformation | uTidalDeformation | ON | Star stretched along radial direction, compressed perpendicular: prolate spheroid → cigar → spaghetti. Axis ratio at R_t: ~3:1. At pericenter (R_p ~ R_t): extreme elongation ~10:1+. Color: #FFF0D0 stretching into elongated stream. Central density increases (compression heating). Dramatic visualization of tidal forces. Duration: ~hours from first distortion to complete disruption. |
| Disruption | Stellar Destruction | uStellarDestruction | ON | At pericenter: star fully disrupted. Debris spread along orbital path: half bound (E < 0), half unbound (E > 0). Energy spread: ΔE ~ GM_BH × R★ / R_t². Rendered: expanding debris fan #FFD080 → #FF8040 surrounding SMBH. Unbound debris streams outward on hyperbolic orbits. Bound debris: highly eccentric elliptical orbits. Self-intersection of debris stream: key dissipation mechanism. |
| Disruption | Debris Stream | uDebrisStream | ON | Bound debris returns to pericenter: fallback rate Ṁ ∝ t^(−5/3) (canonical). Peak fallback: ~1–10 M☉/yr (super-Eddington for M_BH ~ 10⁶ M☉). Stream: narrow (width ~ R★), long (length ~ orbital scale). Color: #FFA060, thin curved arc around SMBH. Self-intersection: stream crosses itself, shock-heats to ~10⁷ K at intersection point. This dissipation enables disk formation. |
| Accretion | Forming Accretion Disk | uTDEDisk | ON | Circularized debris forms compact accretion disk over ~weeks. R_disk ~ 2 R_t ~ 100 R☉. Super-Eddington: Ṁ >> Ṁ_Edd at peak. Disk color: inner #D0E0FF (X-ray hot, ~10⁶ K), outer #FF8040 (optical/UV, ~3×10⁴ K). Thick disk geometry (slim disk or ADAF-like). FBM turbulence: 4-octave, freq 8.0, amplitude 0.15. Disk mass: up to 0.5 M☉. |
| Accretion | Super-Eddington Wind / Outflow | uSuperEddWind | ON | Super-Eddington accretion drives powerful outflow: v ~ 10,000–30,000 km/s. Outflow mass rate: comparable to accretion rate. Creates quasi-spherical reprocessing envelope. Color: #FFE8C0, alpha 0.1, extending to ~10¹⁵ cm. This envelope reprocesses X-ray emission into optical/UV — explains why most TDEs peak in optical not X-ray. Temperature: ~2–4 × 10⁴ K (spectral peak: UV). |
| Emission | Optical/UV Lightcurve | uOpticalUVFlare | ON | Peak luminosity: 10⁴³–10⁴⁴ erg/s in optical/UV. Rise time: ~2–4 weeks. Decay: L ∝ t^(−5/3) (canonical fallback rate). T_eff ~ 30,000–50,000 K (blue/UV). Color: #C0D0FF during peak (blue), slowly reddening. Duration: months (optical) to years (declining). Blackbody radius: ~10¹⁴–10¹⁵ cm (>> disk size: reprocessing). Light curve: smooth, monotonic decline after peak. |
| Emission | Bowen Fluorescence Lines | uBowenLines | OFF | TDE-specific spectral feature: N III λ4640 Bowen fluorescence excited by He II Ly-α. Color overlay: #4A8AFF emission line indicator. Requires extreme UV irradiation + nitrogen — uniquely TDE diagnostic. Also: broad H, He emission lines (v ~ 10,000–20,000 km/s FWHM). Spectral class: TDE-H (hydrogen-rich), TDE-He (helium-rich), TDE-H+He (both). |
| Emission | X-ray Emission | uXrayEmission | OFF | Direct disk/corona X-ray: L_X ~ 10⁴³–10⁴⁵ erg/s. Soft X-ray: kT ~ 50–100 eV (inner disk). Some TDEs X-ray bright (ASASSN-14li), others X-ray faint (optically bright). X-ray lag: delayed relative to optical by weeks (disk formation time). Rendered: #5A7AAA glow from inner disk region. QPOs detected in some TDEs (period ~100–200 s): ISCO orbital timescale. |
| Jet | Relativistic Jet (Rare) | uTDEJet | OFF | ~1% of TDEs launch relativistic jets: AT2022cmc (z=1.2, most distant jetted TDE), Swift J1644+57. Lorentz factor Γ ~ 10+. Jet power: 10⁴⁶–10⁴⁸ erg/s (briefly exceeding total galaxy luminosity). Color: #8AA0D0, narrow beam from SMBH. Duration: weeks-months. Radio afterglow: jet interacting with CNM. These are TDE analogs of GRBs. |
| Temporal | Fallback Rate Evolution | uFallbackRate | ON | Ṁ(t) = Ṁ_peak × (t/t_peak)^(−5/3) after peak. t_peak ~ 1–3 months (depends on M_BH, M★). Peak Ṁ: 1–100 M☉/yr (super-Eddington). Rendered: evolving accretion rate shown as brightness and disk size evolution. Late-time: Ṁ sub-Eddington → standard thin disk. Full event: ~1–3 years for major decline. Some TDEs show plateaus, rebrightenings (partial disruptions repeating). |
| Temporal | Partial vs Full Disruption | uPartialDisruption | OFF | If R_p > R_t: partial disruption — stellar core survives. Loses ~10–50% of mass. Core exits on bound orbit, returns for subsequent pericenter passages. Repeating TDEs: ASASSN-14ko (P ~ 114 days). Rendered: elongated debris stream BUT central stellar core (dimmer, distorted) continuing on orbit. Subsequent disruptions: weaker. Eventually full disruption or orbital evolution. |
| Host Galaxy | Quiescent Galaxy Host | uHostGalaxy | ON | Most TDE hosts: post-starburst (E+A) galaxies (overrepresented ×30–100). Green valley galaxies. SMBH mass: 10⁵·⁵–10⁷·⁵ M☉ (above ~10⁸ M☉: star swallowed whole, no flare). Host as background #F0D8A0 elliptical/S0. TDE position: nuclear (< 0.1 arcsec from galaxy center). Galaxy otherwise unremarkable — TDE reveals hidden SMBH. |
| Camera | Standard View | uCameraMode | ON | Default: disruption event mid-flare. Debris stream arcing around SMBH. Forming disk. Outflow envelope. Scale bar: 100 AU. Dramatic: star being destroyed in real-time. Color: warm #FFD080 debris against dark SMBH. |
| Camera | Lightcurve View | uCameraMode | OFF | Time-series: lightcurve overlay showing L(t) evolution. Multi-band: UV (blue), optical (green), X-ray (purple). t^(−5/3) fit line. Current time marker. Shows full temporal evolution of event from detection to late decline. |
| Camera | Time Speed Multiplier | uTimeSpeed | 1 day/s | At default: rise to peak (~30 days) over ~30 seconds. Decay visible over minutes. Debris stream circularization (weeks) visible. Slow to 1 hr/s for disruption dynamics at pericenter. Speed up to 30 days/s for full year-long evolution. |

---

### 11.18 Heliosphere / Astrosphere

**Entity ID:** ENT-8046
**Base Mesh:** Bullet-shaped cavity (termination shock + heliopause + bow wave) + solar wind flow
**Shader Type:** Fragment (solar wind flow + shock structure + ISM interaction + energetic particles)
**Exemplar:** Heliosphere (Voyager 1/2 crossed boundaries), Astrospheres of other stars (detected in Lyman-alpha absorption)

The heliosphere is the vast bubble of solar wind plasma that surrounds the entire solar system, extending ~120 AU sunward to ~350+ AU tailward, carved out of the local interstellar medium (LISM). Voyager 1 crossed the heliopause (the boundary between solar and interstellar plasma) at 121.6 AU in 2012; Voyager 2 at 119.0 AU in 2018 — humanity's first direct measurements of the interstellar medium. The heliosphere has a complex multi-shell structure: supersonic solar wind → termination shock → subsonic heliosheath → heliopause → interstellar medium (with possible bow shock or bow wave). This entity also generalizes to astrospheres of other stars.

| Section | Feature | Uniform Name | Default | Description |
|---------|---------|-------------|---------|-------------|
| Solar Wind | Inner Supersonic Wind | uSupersonicWind | ON | Solar wind from Sun: v ~ 400 km/s (slow, equatorial) to 800 km/s (fast, polar). Density: n ∝ r⁻² falling from ~5 cm⁻³ at 1 AU to ~0.001 cm⁻³ at 100 AU. Temperature: ~10⁵ K. Rendered as radial streamlines #FFE8A0, alpha 0.02 from Sun outward. Parker spiral: magnetic field wound into Archimedean spiral by solar rotation. Spiral angle: 45° at 1 AU, nearly transverse at ~10 AU. |
| Solar Wind | Solar Wind Sector Structure | uSectorStructure | OFF | Heliospheric current sheet (HCS): warped surface separating magnetic polarity. Ballerina skirt shape. Above/below HCS: opposite magnetic polarity sectors. Period: ~27 days (solar rotation). Tilt: 0°–70° varying with solar cycle. Rendered as wavy sheet #8A8AAA, alpha 0.05 through equatorial plane. Co-rotating interaction regions (CIRs) where fast/slow wind collide: compression fronts. |
| Termination Shock | Termination Shock Surface | uTerminationShock | ON | Solar wind decelerates from supersonic to subsonic: strong termination shock. Distance: ~80–100 AU (sunward), asymmetric (closer upwind, farther downwind). Voyager 1: 94 AU (2004), Voyager 2: 84 AU (2007). Compression ratio: ~2.5 (weaker than expected — energy goes into pickup ion acceleration). Rendered as surface #6AA0FF, alpha 0.1. Shape: oblate, compressed on upwind side. |
| Termination Shock | Pickup Ion Heating | uPickupIonHeat | OFF | Interstellar neutrals enter heliosphere, ionized by charge exchange/UV → pickup ions. At termination shock: pickup ions carry ~80% of energy but only ~20% of particles. Preferentially heated: T_pickup ~ 10⁸–10⁹ K (vs T_thermal ~ 10⁵ K). Renders as hot component #FF6040, alpha 0.05 in heliosheath. These become anomalous cosmic rays (ACRs) through further acceleration. |
| Heliosheath | Heliosheath Region | uHeliosheath | ON | Subsonic, turbulent solar wind between termination shock and heliopause. Width: ~30–40 AU (upwind). Plasma: hot (~10⁶ K), compressed, turbulent. Magnetic field: pile-up against heliopause. Voyager 1/2 traversed this region. Rendered: turbulent #8AB0D0, alpha 0.06 filling region between shock and heliopause. Voyager: detected magnetic field direction changes, plasma wave oscillations. |
| Heliosheath | Magnetic Barrier / Wall | uMagneticBarrier | OFF | Just inside heliopause: magnetic field pile-up (field strength ×2–3 of upstream). Voyager 1: detected magnetic field increase in "magnetic highway" region before heliopause crossing. Stagnation region: plasma velocity → 0. Rendered as enhanced blue #4A6ACC layer inside heliopause. Width: ~5–10 AU. Draping of heliospheric field along heliopause surface. |
| Heliopause | Heliopause Boundary | uHeliopause | ON | THE boundary: solar plasma meets interstellar plasma. Contact discontinuity: density jump, temperature jump, magnetic field direction change. Voyager 1: 121.6 AU (Aug 2012), Voyager 2: 119.0 AU (Nov 2018). Rendered: surface #4AE8FF, alpha 0.15 (brighter than other boundaries — the key boundary). Thickness: < 1 AU (sharp transition). Voyager detection: cosmic ray increase, solar particle decrease, plasma density jump. |
| Heliopause | Heliopause Instabilities | uHeliopauseInstab | OFF | Rayleigh-Taylor and Kelvin-Helmholtz instabilities at heliopause. Interchange instability from charge-exchange momentum deposition. Renders as wavy, rippled heliopause surface with amplitude ~5–10 AU perturbations. IBEX and Voyager data suggest heliopause is dynamic, not smooth. May allow interstellar plasma to penetrate into heliosheath through "fingers." |
| Interstellar Medium | LISM Flow | uLISMFlow | ON | Local interstellar medium: v_ISM ~ 26 km/s relative to Sun (from direction of Scorpius-Ophiuchus). T ~ 7500 K, n ~ 0.07 cm⁻³ (warm, partially ionized). Rendered as streamlines #8A8ACC flowing past heliosphere from upper-left (upstream). LISM magnetic field: B ~ 3 μG, direction ~40° from inflow. Hydrogen wall: enhanced neutral H ahead of heliopause from charge exchange pileup. |
| Interstellar Medium | Bow Wave / Bow Shock | uBowWave | ON | Controversial: IBEX data suggest no bow shock (Sun moves subsonically relative to LISM fast magnetosonic speed). Instead: bow wave — gradual compression. Rendered: gentle density enhancement #6A7AAA, alpha 0.04 at ~200–300 AU upwind. If bow shock exists: sharper surface at ~230 AU. Current evidence: no shock, only wave. IBEX/Voyager observations inconclusive. |
| Interstellar Medium | Interstellar Neutral Penetration | uISNeutrals | OFF | Interstellar neutral atoms (H, He) flow freely through heliopause (not deflected by magnetic fields). Helium focusing cone: downstream gravitational focusing at ~0.5 AU. Hydrogen: filtered by charge exchange at heliopause, creating hydrogen wall upstream and depletion downstream. Rendered: neutral flow lines #A0A0C0 passing through heliosphere, focusing downstream. |
| Shape | Overall Heliosphere Shape | uHelioShape | ON | Bullet/comet-shaped: compressed upwind (nose at ~120 AU), elongated downwind (heliotail). Tail extent: 350–1000+ AU (poorly constrained). IBEX/Cassini INCA: suggest more croissant/deflated-balloon shape than comet-tail. Rendered: asymmetric cavity. Upwind: rounded nose. Downwind: two-lobe heliotail (from solar magnetic polarity). Width: ~600 AU. |
| Shape | Heliotail Structure | uHeliotail | OFF | Downwind extension: two distinct lobes (north/south magnetic hemisphere) separated by heliospheric current sheet extension. Slow wind fills lobes (→ lower energy, broader), fast wind between lobes. Length: >350 AU, may extend >1000 AU. Rendered: two-channel tail #8AB0D0, alpha 0.04 extending downwind. IBEX: detected multi-lobe structure in energetic neutral atoms (ENAs). |
| Voyager | Voyager 1 & 2 Positions | uVoyagerPositions | ON | Voyager 1: launched 1977, currently ~162 AU (2026), in interstellar space. Direction: toward Ophiuchus (upwind offset). Voyager 2: ~137 AU, in interstellar space. Direction: toward southern sky. Rendered as two point markers #FFD080 with trajectory lines from Sun. Labels: "V1: IS" and "V2: IS" (interstellar). Humanity's farthest artifacts, still transmitting. |
| Camera | Standard View | uCameraMode | ON | Default: full heliosphere visible, bullet shape. Sun as bright point at center. Termination shock, heliosheath, heliopause layers visible. LISM flow from upper left. Voyager positions marked. Scale bar: 50 AU. ISM streamlines flowing around heliosphere. |
| Camera | Voyager Perspective | uCameraMode | OFF | View from Voyager 1 position (162 AU): looking back at Sun as distant star. Heliosphere structure visible from outside. Heliopause as faintly glowing boundary in distance. Interstellar space surrounds observer. Dramatic perspective: humanity's most distant viewpoint. |
| Camera | Time Speed Multiplier | uTimeSpeed | 1 yr/s | At default: Voyager motion visible (~3 AU/yr). Solar cycle (11 yr) → 11 seconds: heliosphere breathes (termination shock moves in/out by ~10 AU). Solar wind structures (CIRs) propagate outward. Slow to 1 day/s for solar wind transient propagation. |

---

## 12. Large-Scale Structure

Large-scale structure encompasses the cosmic web of matter on scales from hundreds of kiloparsecs to gigaparsecs — galaxy clusters bound by gravity, superclusters connected by filaments, vast cosmic voids, and the dense stellar systems (globular and open clusters) that populate individual galaxies. These objects define the architecture of the universe at every scale above individual galaxies.

### Galaxy Cluster

**Entity ID:** ENT-7010
**Description:** Gravitationally bound collection of 100–10000 galaxies embedded in hot intracluster medium (ICM) plasma and a massive dark matter halo. Total mass 10¹⁴–10¹⁵ M☉ (largest gravitationally bound structures in the universe). Diameter 2–10 Mpc. ICM temperature 10⁷–10⁸ K (keV-scale), emitting X-rays via thermal bremsstrahlung. BCG (Brightest Cluster Galaxy) at center: giant elliptical, often cD-type with extended stellar envelope. Strong gravitational lensing of background galaxies into arcs. Colors: member galaxies #E8D0A0 (red sequence, old ellipticals), ICM #4A6A9A (X-ray hot gas rendering), BCG #F0D8A0, lensed arcs #8AB0E8 (blue background galaxies). Real exemplars: Coma Cluster, Virgo Cluster (nearest major), Abell 1689 (strong lensing), Bullet Cluster (merging, DM evidence), Perseus Cluster (cool-core, AGN feedback cavities).

**Section Count:** 8 (Galaxy Population, Intracluster Medium, Central BCG, Gravitational Lensing, Dark Matter, Cluster Dynamics, Intracluster Light, Camera)
**Feature Count:** 27

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Galaxy Population | Red Sequence Galaxies | uRedSequence | ON | Early-type (elliptical + S0) galaxies forming tight red sequence in color-magnitude diagram. Color: #E8D0A0 (old, red, passively evolving). 60–80% of cluster galaxies are red sequence. Spatial distribution: concentrated toward center (morphology-density relation). 50–500 rendered as ellipsoidal point-sources with sizes proportional to luminosity. NFW-like radial distribution. |
| Galaxy Population | Blue Cloud Galaxies | uBlueCloudGalaxies | OFF | Late-type (spiral, irregular) galaxies — minority in clusters (20–40%), more common in outskirts. Color: #8AB0D8 (blue, star-forming). Avoid cluster core (ram-pressure stripping removes gas, killing star formation → red sequence). Concentrated at 0.5–1.5× virial radius. Infalling population. 20–100 blue galaxies rendered. |
| Galaxy Population | Galaxy Size Distribution | uGalaxySizes | ON | Luminosity function: Schechter function with M* and faint-end slope α ~ -1.2. BCG: 10–100× typical galaxy luminosity. Giant ellipticals: R_e = 10–50 kpc. Dwarf galaxies: R_e = 0.5–5 kpc, far more numerous. Size rendered proportional to √luminosity. Dwarfs: #D8C0A0 (red, passively evolved), near-unresolved at cluster distance. |
| Intracluster Medium | Hot ICM Gas | uICMGas | ON | Diffuse plasma at T = 2–15 keV (10⁷–10⁸ K), filling cluster volume. Density: 10⁻³–10⁻¹ cm⁻³ (center to edge). X-ray luminosity: 10⁴³–10⁴⁵ erg/s. Rendered as diffuse volume: #4A6A9A, opacity 0.06 at center, decreasing with radius as β-model: I(r) ∝ (1 + (r/r_c)²)^(-3β+1/2). ICM mass: 5–10× total stellar mass. 32 raymarching steps. |
| Intracluster Medium | Cool Core | uCoolCore | OFF | Central ICM cooling below T_vir in relaxed clusters. Cooling time < Hubble time within r < 50–100 kpc. Cooler central gas: #3A5A8A (denser, brighter X-ray). Temperature drop: central T ~0.3–0.5× outer T. Perseus Cluster archetype. Cool core fuels BCG AGN activity. Rendered as brighter, denser central ICM concentration. |
| Intracluster Medium | AGN Feedback Cavities | uAGNFeedCavities | OFF | BCG AGN jets inflate X-ray cavities (bubbles) in ICM. Cavity diameter: 10–100 kpc. Filled with relativistic plasma — appear as "holes" in X-ray emission. Rendered as dark bubbles #1A2A3A (X-ray depleted) within ICM, bilateral along jet axis. Perseus: spectacular nested cavity system. Cavities rise buoyantly. Sound waves/weak shocks in surrounding ICM. Energy: 10⁵⁸–10⁶¹ erg per cavity. |
| Intracluster Medium | Merger Shock Fronts | uMergerShocks | OFF | Shock and cold fronts from cluster-cluster mergers. Bullet Cluster archetype: Mach ~3 bow shock ahead of infalling subcluster. Shock surface: #6A8AAA, opacity 0.08, sharp arc shape. Cold front: sharp contact discontinuity at merging subcluster boundary. Temperature jump across shock: factor 2–5×. Renders dramatic arc structure in ICM. |
| Central BCG | Brightest Cluster Galaxy | uBCG | ON | Giant cD-type elliptical at cluster potential minimum. Mass: 10¹²–10¹³ M☉. Color: #F0D8A0 (old, metal-rich stellar population). Extended diffuse envelope out to 100–500 kpc (cD halo, tidal origin). Sérsic n = 4–8. Often hosts AGN with radio jets. Multiple nuclei in some BCGs (cannibalized galaxies). Central position: within 50 kpc of X-ray peak. |
| Central BCG | BCG Star Formation (Cool Core) | uBCGStarFormation | OFF | In cool-core clusters: BCG shows modest star formation (1–100 M☉/yr) from cooled ICM gas. Blue UV knots #A0C8FF in otherwise red galaxy. Filamentary Hα emission #FF5080 extending 20–50 kpc from BCG. Cool gas filaments following magnetic field topology. Perseus NGC 1275 archetype: spectacular Hα filament system. |
| Gravitational Lensing | Strong Lensing Arcs | uStrongLensArcs | ON | Background galaxies distorted into arcs by cluster gravitational potential. Arc length: 10–100 arcsec (5–50 kpc at lens distance). Color: #8AB0E8 (blue, lensed background star-forming galaxies at z~1–6). Typically 1–30 arcs per massive cluster. Giant arcs near critical curve (Einstein radius ~20–40 arcsec for massive clusters). Rendered as curved thin structures tangential to cluster center. |
| Gravitational Lensing | Weak Lensing Shear | uWeakLensShear | OFF | Systematic tangential alignment of background galaxy shapes by cluster mass. Shear amplitude: 1–10% ellipticity alignment. Not visible by eye — statistical effect. Visualization: background galaxies with alignment indicator vectors. Shear field: tangential around cluster center, decreasing with radius. Maps total mass (including DM). Educational: shows how WL mass mapping works. |
| Gravitational Lensing | Einstein Ring | uEinsteinRing | OFF | Perfect alignment: background source at exactly twice lens distance on same sightline. Creates full Einstein ring of lensed image. Ring radius: 20–50 arcsec for massive clusters. Color: magnified source color #8AB0E8. Extremely rare for full ring — partial arcs much more common. Abell 1689: closest to full ring. Rendered as luminous circle centered on cluster. |
| Dark Matter | DM Halo Visualization | uDMHalo | OFF | NFW dark matter halo: M_200 = 10¹⁴–10¹⁵ M☉, concentration c = 3–8, virial radius R_200 = 1–3 Mpc. DM constitutes ~85% of total mass. Rendered as diffuse blue volume #3A4A6A, opacity 0.03, following NFW density profile. Extends well beyond galaxy and ICM distribution. Bullet Cluster: DM halo offset from ICM (key DM evidence) — visualizable. |
| Dark Matter | DM Subhalos | uDMSubhalos | OFF | Individual DM halos of member galaxies embedded within cluster halo. Tidally truncated to ~50–100 kpc. Rendered as smaller blue spheres #4A5A7A, opacity 0.02, centered on each galaxy. Subhalo mass function: dN/dM ∝ M^(-1.9). Substructure fraction ~5–15% of cluster mass. CDM prediction: more subhalos than observed galaxies (missing satellite problem). |
| Cluster Dynamics | Velocity Dispersion Indicator | uVelDispersion | OFF | Galaxy velocity dispersion: σ = 500–1500 km/s (virial equilibrium). Rendered as velocity vector field on galaxies: random velocities, length proportional to speed. Color-coded: approaching #5A5AFF, receding #FF5A5A. Virial theorem: σ² ∝ M/R. Dispersion measurement was first evidence for dark matter in clusters (Zwicky 1933). |
| Cluster Dynamics | Substructure/Merging Subclusters | uSubstructure | OFF | Many clusters not fully relaxed — contain merging subclusters. 1–3 subgroups visible as galaxy overdensities offset from main center. Each with own ICM component (cold front between). Rendered as distinct galaxy concentrations #E0D0A0 with separate ICM blobs. Indicator of recent/ongoing merger activity. |
| Intracluster Light | ICL Diffuse Component | uICLDiffuse | OFF | Diffuse starlight between galaxies from tidally stripped stars. 10–30% of total cluster stellar mass in ICL. Color: #E8D8B8 (old stars), surface brightness 26–30 mag/arcsec² (very faint). Follows cluster potential, more extended than BCG. Smooth, featureless. Detected in deep imaging: ghostly glow between galaxies. Rendered as diffuse luminous haze centered on BCG, R_e ~100–300 kpc. Opacity 0.03. |
| Intracluster Light | Tidal Streams in ICL | uICLStreams | OFF | Coherent tidal streams within ICL from specific stripping events. Individual streams: #D8C8A0, width 1–5 kpc, length 50–200 kpc. 3–10 streams visible in deep imaging. Each traces orbit of disrupted galaxy. Kinematically cold (low velocity dispersion within stream). Younger/higher surface brightness than surrounding diffuse ICL. |
| Camera | Cluster Overview | uCameraMode | ON | Default: showing full cluster extent with member galaxies, ICM (if enabled), and BCG at center. Distance: 10 Mpc. FOV 45°. Shows ~200 member galaxies distributed in NFW profile. ICM as diffuse background glow. Lensing arcs near center. |
| Camera | Core Region Zoom | uCameraMode | OFF | Zoomed to central 500 kpc: BCG, cool core, AGN cavities, inner member galaxies, and strongest lensing arcs. Distance: 2 Mpc. Rich detail in central region. FOV 35°. |
| Camera | Time Speed Multiplier | uTimeSpeed | 10⁸ yr/s | 1 real second = 100 Myr. Galaxy orbital periods (1–5 Gyr) visible in 10–50 seconds. ICM features evolve slowly. Merger dynamics for non-relaxed clusters visible. Cooling flow develops. |

---

### Cosmic Web Filament

**Entity ID:** ENT-7020
**Description:** Thread-like structures of dark matter, gas, and galaxies connecting galaxy clusters across tens of megaparsecs — the defining architecture of the large-scale universe. Filaments contain ~50% of all matter in the universe. Width: 1–10 Mpc. Length: 10–200 Mpc between nodes (clusters). Internal structure: dark matter backbone (dominant), warm-hot intergalactic medium (WHIM, T = 10⁵–10⁷ K, the "missing baryon" reservoir), and chains of galaxies. Filament intersections = galaxy clusters. Colors: galaxy chain #E0D0A0 (visible), WHIM #3A5A7A (extremely faint, barely detected), DM backbone #2A3A5A (invisible, inferred). Real exemplars: Sloan Great Wall, Pisces-Cetus Supercluster Complex, cosmic web from Millennium simulation, detected WHIM in FRB observations.

**Section Count:** 7 (Galaxy Distribution, WHIM Gas, Dark Matter Backbone, Filament Topology, Galaxy Properties, Cosmic Context, Camera)
**Feature Count:** 25

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Galaxy Distribution | Galaxy Chain | uGalaxyChain | ON | Galaxies distributed along filament axis: linear density ~10–100 galaxies per Mpc (bright end). Mix of types: spirals #8AB0D8 (blue, gas-rich, more common in filament outskirts), ellipticals #E8D0A0 (red, more common near nodes). Chain width: 1–5 Mpc. Density enhancement 5–20× over cosmic mean. Rendered as galaxy point sources with color and size variation. |
| Galaxy Distribution | Galaxy Groups Along Filament | uGalaxyGroups | ON | Filaments contain embedded galaxy groups (3–30 members, M ~10¹³ M☉). 5–20 groups along a 50 Mpc filament. Each group: small cluster of points with own hot gas halo. Group spacing: 5–15 Mpc. Groups are intermediate-density environments between field and cluster. Rendered as local galaxy concentrations with faint X-ray halos #4A6A8A, opacity 0.02. |
| Galaxy Distribution | Density Gradient Across Filament | uDensityGradient | OFF | Galaxy density decreases from filament spine to edge. Cross-section: Gaussian-like density profile, FWHM 2–5 Mpc. Spine: highest density (approaching group-level). Edge: transitions to void density. Rendered as radial brightness gradient perpendicular to filament axis. Color: #D0C0A0 to background darkness. |
| WHIM Gas | Warm-Hot Intergalactic Medium | uWHIMGas | ON | Diffuse plasma at T = 10⁵–10⁷ K filling filament volume — predicted home of 40–50% of cosmic baryons ("missing baryons"). Density: 10–100× cosmic mean. Extremely faint: barely detected via X-ray, SZ effect, and FRB dispersion. Rendered as diffuse volume #3A5A7A, opacity 0.04 along filament axis. Emission: soft X-ray and UV (OVI, OVII absorption lines). |
| WHIM Gas | WHIM Temperature Structure | uWHIMTemp | OFF | Temperature gradient within WHIM: hotter near cluster nodes (~10⁷ K, #5A7A9A), cooler in mid-filament (~10⁵ K, #3A4A5A). Accretion shocks at filament surface heat infalling gas. Core: adiabatically compressed, hotter. Rendered as color gradient along and across filament. Temperature map aids understanding of baryon thermodynamics. |
| WHIM Gas | Accretion Shock Surface | uAccretionShock | OFF | Boundary where infalling void gas impacts filament: virial accretion shock. Shock Mach number ~10–100 (strong shock). Surface temperature jump: 10⁴ K → 10⁵–10⁶ K. Rendered as thin shell #5A8AAA, opacity 0.03 at filament boundary. Shock geometry follows filament surface. Source of cosmic ray acceleration. |
| Dark Matter Backbone | DM Filament Visualization | uDMFilament | OFF | Dark matter density field defining filament: continuous from cluster halo to cluster halo. Density enhancement: 5–50× cosmic mean along spine. NFW-like cross-section with concentration c ~5. Rendered as diffuse blue volume #2A3A5A, opacity 0.05. DM constitutes ~85% of filament mass. Width: slightly broader than galaxy distribution. |
| Dark Matter Backbone | DM Subhalos in Filament | uDMFilamentSubhalos | OFF | Dark matter halos of individual galaxies embedded within filament DM. Tidally stretched along filament axis (tidal elongation). Halo mass function following cosmic prediction down to 10⁸ M☉. Many DM halos without visible galaxies (below star formation threshold). Rendered as small blue spheres #3A4A6A, opacity 0.02 along filament. |
| Filament Topology | Node Connections | uNodeConnections | ON | Filament connects two or more cluster nodes. Node-filament junction: density increases smoothly from filament to cluster. 3–5 filaments typically connect to each cluster (cosmic web coordination number). Junction zone: 2–5 Mpc region where filament broadens into cluster outskirts. Rendered as thickening of filament approaching cluster nodes, with cluster rendered as dense galaxy concentration. |
| Filament Topology | Filament Bifurcation | uFilamentBifurcation | OFF | Filaments can branch and merge. Y-junction where one filament splits into two (or two merge). Junction point: overdense, may contain galaxy group. Rendered as branching structure. Topology: filaments, nodes (clusters), walls (sheet-like structures between filaments), and voids (bounded by walls and filaments). |
| Filament Topology | Cosmic Wall/Sheet | uCosmicWall | OFF | Sheet-like structures connecting filaments — thinner, lower density than filaments. Walls bound cosmic voids. Galaxy density: 2–5× cosmic mean (lower than filaments). Rendered as semi-transparent plane #D0C8A0, opacity 0.01, connecting parallel filaments. Walls contain ~5–10% of cosmic matter. Great Wall structures in galaxy surveys. |
| Galaxy Properties | Star Formation Gradient | uSFGradient | OFF | Star formation rate decreases from filament outskirts to spine (pre-processing of galaxies before entering clusters). Outer filament: blue star-forming galaxies #8AB0D8 dominate. Inner filament: red quenched galaxies #E8D0A0 dominate. Same morphology-density relation as clusters but weaker. Color gradient across filament cross-section showing environmental quenching. |
| Galaxy Properties | Galaxy Alignment | uGalaxyAlignment | OFF | Galaxies preferentially aligned with filament axis (spin perpendicular to filament for massive galaxies, parallel for low-mass). Alignment amplitude: 5–15% excess. Rendered as galaxy orientation indicators showing tendency to point along/across filament. Tidal torque theory prediction confirmed by observations and simulations. |
| Cosmic Context | Cosmic Web Network | uCosmicWebNetwork | OFF | Multiple connected filaments forming local cosmic web. 5–10 filaments rendered showing network topology. Nodes (clusters) at intersections. Voids between filaments. Scale: 100–300 Mpc. Rendered as translucent threads #4A5A6A, opacity 0.04 connecting bright nodes (clusters). Visualization of Millennium Simulation or SDSS-type survey structure. |
| Cosmic Context | Void Boundaries | uVoidBoundaries | OFF | Filaments define edges of cosmic voids. Adjacent void: near-empty region (galaxy density <0.2× mean), diameter 20–100 Mpc. Filament forms one wall of void. Void interior rendered as darker region #0A0A0A with sparse galaxy points. Sharp density transition at filament-void boundary. Void galaxies: bluer, more actively star-forming. |
| Camera | Filament Overview | uCameraMode | ON | Default: filament seen from side, showing full length between two cluster nodes. Distance: 100 Mpc from filament center. FOV 50°. Galaxy chain visible. WHIM as faint glow. Cluster nodes at each end. Scale bar showing 10 Mpc. |
| Camera | Cross-Section View | uCameraMode | OFF | Looking along filament axis (down the barrel). Shows cross-section: density concentration at center, galaxy distribution, WHIM extent, surrounding void. Distance: 50 Mpc. Cluster node visible as bright concentration at center. |
| Camera | Time Speed Multiplier | uTimeSpeed | 10⁹ yr/s | 1 real second = 1 Gyr. Filament evolution: grows denser over cosmic time as matter accretes. Galaxy infall along filament toward cluster visible. Cosmic web evolves over Hubble time (~13.8 seconds of viewing). |

---

### Cosmic Void

**Entity ID:** ENT-7030
**Description:** Vast underdense regions of space between cosmic web filaments and walls, containing very few galaxies — the dominant volume component of the universe (voids occupy ~60% of cosmic volume). Diameter: 20–200 Mpc (mean ~35 Mpc). Galaxy density: 0.1–0.2× cosmic mean. Interior: extremely sparse galaxy distribution, lower metallicity, and more actively star-forming galaxies than cluster environments. Void centers: near-perfect vacuum (~10⁻³⁰ g/cm³ baryon density). Shape: roughly spherical to elongated, bounded by filaments and walls. Voids expand faster than Hubble flow (super-Hubble expansion from underdensity). Real exemplars: Boötes Void (330 Mpc diameter, only ~60 galaxies), Local Void (adjacent to Milky Way), KBC Void (possible local underdensity), Eridanus Supervoid (Cold Spot connection).

**Section Count:** 7 (Void Interior, Galaxy Population, Boundary Structure, Dark Matter Distribution, Expansion Dynamics, Void Hierarchy, Camera)
**Feature Count:** 25

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Void Interior | Empty Volume Visualization | uEmptyVolume | ON | Primary visual feature: the absence of structure. Rendered as very sparse region against background. Void center: virtually galaxy-free zone spanning 10–50 Mpc. Background: distant large-scale structure faintly visible through void. Very dark: #0A0A10 (less background light than filament sightlines). Void is bounded by visible filaments/walls on all sides. |
| Void Interior | Residual Cosmic Web | uResidualWeb | OFF | Within larger voids: faint sub-filamentary structure (tenuous "tendril" connections between sparse void galaxies). Density enhancement: 1.5–3× void mean (still underdense relative to cosmic mean). Rendered as extremely faint threads #2A2A3A, opacity 0.01 connecting void galaxies. Voronoi-like substructure within main void. Visible only at very low surface brightness. |
| Void Interior | CMB Cold Spot Correlation | uCMBColdSpot | OFF | Large voids produce Integrated Sachs-Wolfe (ISW) effect: CMB photons lose energy traversing expanding void. Results in cold spot in CMB map. Eridanus Supervoid possible origin of anomalous CMB Cold Spot. Rendered as faint temperature decrement #1A1A3A overlay on background, ΔT ~10 μK. Educational: shows void-CMB connection. |
| Galaxy Population | Void Galaxies | uVoidGalaxies | ON | Sparse galaxy population: 10–100 galaxies per void (Boötes Void: ~60). Systematically different from cluster galaxies: bluer #7AA0C8 (more star-forming), smaller (dwarf-dominated), lower metallicity, more disk-dominated. Spatial distribution: sparse but not random — concentrated in void walls and sub-filaments. Rendered as small blue point sources. |
| Galaxy Population | Void Galaxy Properties | uVoidGalaxyProps | OFF | Enhanced visualization of void galaxy characteristics. Compared to cluster galaxies: higher gas fraction (HI-rich), lower stellar mass (M* ~10⁸–10¹⁰ M☉), active star formation (SFR/M* higher), higher spin parameter. Rendered with galaxy info overlays showing property differences. Void environment = less quenching, more pristine evolution. |
| Galaxy Population | Void Dwarf Galaxies | uVoidDwarfs | OFF | Ultra-faint dwarf galaxies in voids — potentially most pristine (low metallicity, gas-rich, unevolved) galaxies in the universe. Mass: 10⁶–10⁸ M☉. Color: #8AB8D0 (blue, actively forming stars from primordial gas). Near-primordial composition: [Fe/H] < -2. Extremely rare/hard to detect. 0–10 per void at current survey depth. |
| Boundary Structure | Filament Walls | uFilamentWalls | ON | Surrounding filaments and walls defining void boundary. Galaxy density increases sharply at boundary: void → wall transition over ~2–5 Mpc. Boundary rendered as visible filaments/walls #D0C8A0 framing void. 4–10 filaments define typical void boundary. Boundary not sharp — gradual density gradient over 5–10% of void diameter. |
| Boundary Structure | Void Ridge Galaxies | uVoidRidgeGalaxies | OFF | Galaxies at void-wall boundary — transition population. Properties intermediate between void interior and filament: color #A0B8C0 (intermediate blue), moderate gas fraction. Density: 0.5–1.0× cosmic mean. Shell of galaxies at void edge thickening toward filament nodes. 30–50% of "void" galaxies actually in boundary ridge. |
| Boundary Structure | Void Wall Substructure | uWallSubstructure | OFF | Walls bounding voids have internal structure: tendrils, clumps, and sub-voids. Wall thickness 2–10 Mpc. Rendered as semi-transparent sheet #C0B890, opacity 0.02 with embedded galaxy groups. Walls contain ~5–10% of cosmic matter. Interface between void expansion and filament accretion. |
| Dark Matter Distribution | DM Void Profile | uDMVoidProfile | OFF | Dark matter density in void follows similar underdensity as baryons. Central density: 0.1–0.3× cosmic mean. Compensated: void wall slightly overdense (compensation wall). NFW-like but inverted: density increasing outward. Rendered as very faint blue volume #1A2A3A, opacity 0.02, brightest at edges. DM void profile constrains cosmological models. |
| Dark Matter Distribution | Void DM Halos | uVoidDMHalos | OFF | Dark matter halos in voids: exist but skewed to lower masses (no high-mass halos). Halo mass function suppressed above ~10¹² M☉ in voids. Each void galaxy sits in a DM halo. Rendered as small blue spheres #3A4A5A, opacity 0.02 centered on void galaxies. Smaller average size than field halos. Fewer subhalos per halo. |
| Expansion Dynamics | Super-Hubble Expansion | uSuperHubbleExpansion | OFF | Voids expand faster than cosmic mean Hubble flow. Interior galaxies move outward relative to void center at ~10–20% above Hubble rate. Rendered as velocity vectors on void galaxies pointing outward from center, length proportional to super-Hubble component. Void grows over cosmic time. Differential expansion creates void asphericity. |
| Expansion Dynamics | Void Evacuation | uVoidEvacuation | OFF | Animated visualization of matter flowing out of void onto surrounding filaments. Mass flux through void boundary. Void becomes emptier over time while walls become denser. Time evolution: void at z=2 (smaller, less empty) → z=0 (larger, emptier). Demonstrates gravitational instability in underdense regions. |
| Expansion Dynamics | Void Merging | uVoidMerging | OFF | Small voids merge to form larger voids over cosmic time (void hierarchy). Two adjacent voids separated by thin wall — wall dissolves as voids expand and merge. Animated merger sequence. Final void: larger diameter, more spherical. "Void-in-cloud" vs "void-in-void" scenarios (Sheth & van de Weygaert 2004). |
| Void Hierarchy | Void-in-Void Structure | uVoidInVoid | OFF | Nested void hierarchy: large voids contain sub-voids separated by internal ridges. Sub-void diameter: 5–20 Mpc within parent void of 50+ Mpc. 2–5 sub-voids per major void. Ridges between sub-voids: galaxy density slightly above void average. Fractal-like hierarchy similar to dark matter halo hierarchy. |
| Void Hierarchy | Void Size Distribution | uVoidSizeDist | OFF | Statistical visualization: void size distribution follows near-log-normal with peak at ~35 Mpc. Range: 10–200 Mpc. Rendered as schematic showing multiple voids at various sizes. Larger voids rarer. Size distribution constrains cosmological parameters (σ₈, Ω_m). Histogram overlay in educational mode. |
| Camera | Interior View | uCameraMode | ON | Default: positioned inside void looking toward boundary. Void galaxies sparse around camera. Filament walls visible as distant dense structures framing emptiness. Scale bar: 50 Mpc. FOV 80° (wide, to emphasize emptiness). Dramatic sense of cosmic loneliness. |
| Camera | Cross-Section View | uCameraMode | OFF | Side view showing void as spherical underdensity within cosmic web. Filaments visible above and below. Void galaxies at edges. Scale: 200 Mpc field showing void in context of surrounding structure. Density color-map overlay available. |
| Camera | Time Speed Multiplier | uTimeSpeed | 10⁹ yr/s | 1 real second = 1 Gyr. Void expansion and evacuation visible. Galaxy migration toward walls. Void merger events visible over several seconds. Full cosmic evolution: ~14 seconds from Big Bang to present. |

---

### Globular Cluster

**Entity ID:** ENT-7040
**Description:** Dense, gravitationally bound spherical collection of 10⁴–10⁶ old stars, orbiting in galaxy halos. Among the oldest objects in the universe (age 10–13 Gyr), formed during or shortly after galaxy formation. Core stellar density: 10³–10⁶ stars/pc³ (vs ~0.1 stars/pc³ in solar neighborhood — 10⁴–10⁷× denser). Tidal radius: 20–100 pc. Colors: dominant old red giant + horizontal branch populations: RGB stars #E8C8A0 (warm orange), RHB/AGB #F0D0A0 (bright yellow-orange), blue HB #A0B8D8 (hot evolved), turnoff #F0E8D0 (warm white, ~6000 K). Bimodal metallicity: metal-poor [Fe/H]~-2 (bluer) and metal-rich [Fe/H]~-0.5 (redder). Real exemplars: 47 Tucanae (massive, metal-rich), Omega Centauri (most massive MW GC, possible stripped dwarf nucleus), M13 (Hercules), NGC 6397 (nearest core-collapsed), M92 (very old, metal-poor).

**Section Count:** 7 (Stellar Population, Structural Profile, Core Dynamics, Stellar Exotica, Multiple Populations, Tidal Features, Camera)
**Feature Count:** 26

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Stellar Population | Red Giant Branch Stars | uRGBStars | ON | Dominant visible population: old red giants (T_eff 3500–5000 K). Color: #E8C8A0 to #F0D0A0. Luminosity: 10–1000 L☉. Tip of RGB: M_I ≈ -4. 50–70% of visually prominent stars are RGB. Concentrated toward center (mass segregation — heavier stars sink). Rendered as colored points with size ∝ √luminosity. |
| Stellar Population | Horizontal Branch Stars | uHBStars | ON | Post-RGB evolved stars: "horizontal" branch in H-R diagram. Blue HB: #A0B8D8 (T_eff 8000–25000 K, metal-poor GCs). Red HB: #E8D0A0 (T_eff 4500–5500 K, metal-rich GCs). BHB/RHB ratio determines "second parameter" appearance. RR Lyrae gap between blue and red HB. Rendered with appropriate colors based on metallicity setting. |
| Stellar Population | RR Lyrae Variables | uRRLyrae | OFF | Pulsating variables in instability strip: period 0.2–1.0 days. Fundamental mode (RRab): asymmetric light curve, ΔV ~0.5–1.5 mag. Color oscillation: #D8C8A0 (bright, hot) ↔ #C8A880 (faint, cool). Standard candles: M_V ≈ +0.6. 10–200 per GC. Animated pulsation with random phases. Clustered at HB instability strip position. |
| Stellar Population | Main Sequence Turnoff | uMSTurnoff | OFF | Point where main sequence curves to subgiant branch — age diagnostic. Color: #F0E8D0 (T_eff ~6000 K for 12 Gyr). Magnitude: M_V ≈ +4 (faint, resolved only in nearest GCs). Turnoff mass: ~0.8 M☉ (all more massive stars already evolved). Turnoff luminosity directly gives age. Thousands of turnoff stars in a GC. |
| Structural Profile | King Profile Surface Brightness | uKingProfile | ON | Surface brightness follows King (1966) model: core radius r_c (where I drops to 0.5× central), tidal radius r_t (truncation). Concentration c = log(r_t/r_c): 0.5 (low, diffuse) to 2.5 (high, concentrated). Typical: c ~1.5, r_c = 1–5 pc, r_t = 30–100 pc. Rendered as smooth radial brightness gradient. Central surface brightness: 10²–10⁵ L☉/pc². |
| Structural Profile | Core Density Cusp | uCoreCusp | OFF | Core-collapsed GCs: central power-law cusp replacing flat core. Density ∝ r^(-0.7 to -1.0) into center. ~20% of MW GCs are core-collapsed. Central luminosity density: >10⁶ L☉/pc³. Rendered as extremely bright central concentration, steeper than King profile. NGC 6397, M15 archetypes. Cusp driven by gravothermal catastrophe. |
| Structural Profile | Half-Light Radius Marker | uHalfLightRadius | OFF | Radius containing 50% of total light: R_h = 2–10 pc typically. Rendered as faint circle #5A8A5A, opacity 0.08 at R_h distance. Key structural parameter correlating with mass, age, and environment. Compact GCs (R_h ~2 pc): more massive, denser. Extended GCs (R_h ~10+ pc): may be stripped dwarf galaxy nuclei. |
| Core Dynamics | Mass Segregation | uMassSegregation | ON | Heavier stars (giants, remnants) concentrated toward center; lighter stars (main sequence) pushed outward by dynamical friction. Equipartition timescale: ~10⁸ yr for core. Rendered: giants concentrated in inner R_h, main sequence more uniform. Center appears redder/brighter (giant-dominated). Visual gradient: core redder #F0D0A0, outskirts bluer #E0D8C0. |
| Core Dynamics | Binary Star Heating | uBinaryHeating | OFF | Binary star interactions in dense core provide energy source preventing total collapse. Hard binaries (tight) harden further, releasing kinetic energy to surrounding singles. Binary fraction in core: 5–50%. Rendered: binary indicators (paired points) concentrated in core. Binary-single and binary-binary interactions (3-body and 4-body) animated occasionally. |
| Core Dynamics | Stellar Ejection Events | uStellarEjections | OFF | High-velocity stars ejected from GC by 3-body encounters or binary disruption. Ejection velocity: 10–50 km/s (exceeding escape velocity ~20 km/s). Rendered as fast-moving star leaving cluster with velocity vector #FF8040. 1 ejection per ~10⁶ years. Creates tidal tail of escaped stars. Builds up extra-tidal population over Gyr. |
| Stellar Exotica | Blue Straggler Stars | uBlueStraggers | ON | Stars appearing younger (bluer, more massive) than turnoff — shouldn't exist in old GC. Origin: stellar mergers or mass transfer in binaries. Color: #B0C8E0 (bluer/hotter than turnoff). Magnitude: 0.5–2.5 mag brighter than turnoff. 10–100 per GC. Concentrated in core (binary formation channel) and sometimes at R_h (collisional channel). Distinct blue points among red giants. |
| Stellar Exotica | Millisecond Pulsars | uMSPulsars | OFF | Recycled pulsars spun up by accretion from companion: period 1–30 ms. GC cores: dense environments produce many MSPs. 47 Tuc: 25+ known MSPs. Rendered as rotating beam indicators #C0C0FF at precise positions within core. Spin period far too fast to animate at true rate — indicated as rapid flashing point. Each MSP with radio beam cone. |
| Stellar Exotica | Cataclysmic Variables | uCataclysmicVars | OFF | White dwarf accreting from close binary companion. Dwarf novae: irregular brightening by 2–5 magnitudes over days–weeks. 10–50 CVs per dense GC. Color: quiescent #D0C8B0, outburst #C0D0FF (hot accretion disk). Concentrated in core (binary interactions). Rendered as occasional flaring points in core region. |
| Stellar Exotica | X-ray Binaries | uXrayBinaries | OFF | Low-mass X-ray binaries: neutron star + low-mass companion. GCs have ~100× higher LMXB rate per stellar mass than field (dynamical formation). L_X = 10³⁶–10³⁸ erg/s. 0–5 per GC. Rendered as bright X-ray point source #8090D0 in core. Brightest X-ray sources in some GCs. Transient: alternate between quiescence and outburst. |
| Multiple Populations | Light Element Variations | uLightElementVar | OFF | Multiple populations with different He, C, N, O, Na abundances — not simple stellar population. 2–3 distinct populations per GC. Population 1 (primordial): normal composition, #E0C8A0. Population 2 (enriched): Na-enhanced, O-depleted, He-enriched, #D8C0B0 (slightly hotter main sequence from higher He). Population 2 more centrally concentrated. |
| Multiple Populations | Helium Enrichment Effect | uHeliumEnrichment | OFF | He-enriched population (Y = 0.28–0.40 vs normal 0.25) has bluer main sequence and HB. Extreme: Omega Centauri has multiple main sequences (5+ populations). Rendered: He-rich stars slightly bluer at same magnitude. HB morphology dramatically affected — very blue HB from He-rich population. Color difference: #E0D0A8 (normal He) vs #D0C8B0 (high He). |
| Tidal Features | Tidal Tails | uTidalTails | OFF | Stars stripped by galactic tidal field forming leading + trailing tidal tails. Tail length: up to 10–20° on sky (kpc scale). Width: ~50 pc. Density: sparse but detectable via matched-filter photometry. Color: same as GC population #E0D0A0. Tails follow GC orbit — trace orbital path. Pal 5 archetype: spectacular tidal tails discovered by SDSS. |
| Tidal Features | Extra-Tidal Halo | uExtraTidalHalo | OFF | Diffuse halo of recently escaped stars beyond tidal radius. Surface density: 1–10% of tidal boundary value. Extent: 1–3× tidal radius. Intermediate between bound cluster and organized tidal tail. Potential energy (unbound) stars diffusing outward. Rendered as sparse stellar haze beyond King profile truncation. |
| Camera | Core View | uCameraMode | ON | Default: centered on GC at distance showing resolved stars across core and half-light radius. Distance: 200 pc. FOV 30°. Dense stellar field with color variety (RGB orange, HB blue, turnoff white). Central brightness peak. Most stars overlap at center (realistic crowding). |
| Camera | Full Cluster View | uCameraMode | OFF | Zoomed out to show full GC extent to tidal radius. Distance: 500 pc. FOV 50°. Shows radial density falloff from bright core to sparse halo. Tidal tails visible if enabled. Background field stars for context. |
| Camera | Time Speed Multiplier | uTimeSpeed | 10⁵ yr/s | 1 real second = 100000 years. Stellar orbital periods in core (~10⁵ yr) visible. Mass segregation evolution visible over long observation. RR Lyrae pulsation far too fast — rendered as steady brightness. Relaxation time: ~10⁸–10⁹ yr. |

---

### Open Star Cluster

**Entity ID:** ENT-7050
**Description:** Loosely bound group of 10–10000 stars formed together from the same molecular cloud, typically young (<1 Gyr) and located in the galactic disk. Unlike globular clusters: lower stellar density, younger age, higher metallicity, irregular shape, and doomed to dissolve via tidal stripping within ~10⁸–10⁹ years. Star colors span full main sequence: hot O/B stars #B0C8FF (young clusters) through solar-type #FFF8E0 to red M dwarfs #FFB880. Clusters often embedded in or near birth nebula remnants. Stellar distribution: fractal substructure in young clusters, smoother in older. Real exemplars: Pleiades (M45, 100 Myr, reflection nebulosity), Hyades (625 Myr, nearest, dissolving), Praesepe/Beehive (M44, 600 Myr), NGC 3603 (very young, massive, HII region embedded), Double Cluster h+χ Persei.

**Section Count:** 7 (Stellar Population, Cluster Structure, Nebular Environment, Stellar Evolution, Dynamics & Dissolution, Binary/Multiple Systems, Camera)
**Feature Count:** 25

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Stellar Population | Main Sequence Stars | uMainSequence | ON | Full main sequence from O to M depending on cluster age. Young cluster (<10 Myr): hot OB stars #B0C8FF (M_V = -5 to -1) dominating visually. Old cluster (>500 Myr): turnoff at A/F type #F8F0D0 (M_V ≈ +2), most luminous stars are K/M giants. Mass range: 0.1–50 M☉ (Kroupa/Chabrier IMF). Color-magnitude diagram: clean single isochrone (all stars same age and composition). |
| Stellar Population | Red Giants (If Old Enough) | uRedGiants | OFF | Clusters >200 Myr develop red giant branch. RGB stars: #F0D0A0 to #E8B880 (T_eff 3500–5000 K). Luminosity: 10–100 L☉. Clump giants at ~1 Gyr: #E8C890 (helium-burning). Very few per cluster (short evolutionary phase): 1–20 giants visible. Brightest non-OB stars. Hyades has 4 giants. |
| Stellar Population | Pre-Main-Sequence Stars | uPreMSStars | OFF | In very young clusters (<10 Myr): stars still contracting toward main sequence. T Tauri stars: #FFD090 (cooler/more luminous than MS at same mass). Located above MS in H-R diagram. Circumstellar disks present (accretion indicators). 30–50% of young cluster members. Rendered as slightly brighter, redder points above main sequence locus. |
| Stellar Population | White Dwarf Population | uWhiteDwarfs | OFF | Dead stellar remnants of massive (>1 M☉) stars that already evolved. In clusters >100 Myr: faint WDs accumulate. Color: #E0E0F0 (hot, blue-white, fading). Magnitude: M_V ≈ +10 to +15 (very faint). WD cooling sequence provides independent age estimate. 10–100 WDs in old open clusters. Concentrated in core by mass segregation then ejected. |
| Cluster Structure | Irregular/Fractal Shape | uFractalShape | ON | Young clusters (<50 Myr): filamentary, fractal substructure reflecting birth cloud morphology. Fractal dimension ~1.5–2.0. No central concentration — distributed irregularly. Subgroups/subclusters identifiable. Fractal structure erased by dynamical mixing over ~10 crossing times (~50 Myr). FBM point distribution: fractal dimension 1.8, filament-like patterns. |
| Cluster Structure | Core-Halo Structure | uCoreHalo | ON | Older clusters (>50 Myr): dynamically relaxed, developing core-halo structure. Core radius 1–3 pc, tidal radius 5–20 pc. Surface brightness: decreasing exponential/King profile from core. Mass segregation: massive stars in core, low-mass in halo. Core density: 1–100 stars/pc³ (much lower than GC). Halo merges gradually with field stars. |
| Cluster Structure | Stellar Corona | uStellarCorona | OFF | Extended halo of marginally bound and recently unbound stars around cluster. Extends to 2–3× tidal radius. Density: gradually merging with galactic field. Stars in corona: being tidally stripped, forming moving groups. Rendered as sparse stellar extension beyond formal cluster boundary. Transition zone between cluster and field. |
| Nebular Environment | Reflection Nebulosity | uReflectionNeb | OFF | Residual dust from birth cloud illuminated by cluster stars (not ionized — scattered light). Pleiades archetype: delicate blue reflection nebulae around bright stars. Color: #B0C8E8 (blue, Rayleigh scattered). Irregular filamentary morphology wrapping around individual stars. Opacity 0.05–0.15. FBM texture: 6 octaves, freq 3.0, gain 0.4. Only in young clusters where birth cloud remnant persists. |
| Nebular Environment | HII Region (Very Young) | uHIIRegion | OFF | For clusters <5 Myr with O-type stars: ionized gas bubble surrounding cluster. Color: #FF5080 (Hα emission). Extent: 1–30 pc (Strömgren radius from O-star UV). NGC 3603, Westerlund 2 archetypes: cluster embedded in HII region. Emission factor 0.5. Density: 10–1000 cm⁻³. Shape: roughly spherical with ionization front at edge, sculpted by O-star winds. |
| Nebular Environment | Molecular Cloud Remnant | uMolCloudRemnant | OFF | For youngest clusters (<3 Myr): still partially embedded in birth molecular cloud. Dark cloud material: #1A1A20 (opaque at optical, τ_V > 3). Cloud dispersal ongoing via stellar winds and radiation. Pillars of creation-type edge structures. Cloud covers 30–70% of cluster in projection. Star formation possibly still ongoing at cloud edges. |
| Stellar Evolution | Turnoff Point Animation | uTurnoffAnim | OFF | Animated demonstration of main sequence turnoff moving to fainter/redder stars as cluster ages. At 1 Myr: turnoff at O2 (#A0B0FF, M_V = -6). At 100 Myr: turnoff at B5 (#C0D0FF, M_V = -1). At 1 Gyr: turnoff at F5 (#F8F0D0, M_V = +3). Stars above turnoff evolving to giants. "Cosmic clock" visualization. Educational: isochrone evolution. |
| Stellar Evolution | Blue Loop Giants | uBlueLoopGiants | OFF | Intermediate-mass (3–9 M☉) stars execute "blue loop" in H-R diagram during helium burning. Temporarily become hotter (bluer) before returning to giant branch. Color: #D0D8E0 (B-F type supergiants). Crosses instability strip → Cepheid variable. 0–5 per young cluster. Short-lived phase: ~10⁶ yr. Classical Cepheids in young clusters calibrate period-luminosity relation. |
| Dynamics & Dissolution | Tidal Tail Streams | uOCTidalTails | OFF | Stars stripped by galactic tidal field forming leading + trailing streams. Length: 10–200 pc (shorter than GC tails — less massive cluster). Width: ~5–10 pc. Contain 10–50% of original members for old clusters. Hyades: tidal tails extend ~200 pc. Streams eventually form moving groups indistinguishable from field. Rendered as sparse elongated extensions along orbit. |
| Dynamics & Dissolution | Mass Loss Visualization | uMassLoss | OFF | Cluster losing mass through tidal stripping and two-body relaxation ejection. Evaporation timescale: 10⁸–10⁹ yr for typical open cluster. Animated: stars occasionally leaving cluster boundary. Mass halving time: ~few × 10⁸ yr. Shows why most open clusters dissolve within 1 Gyr. Stars join galactic field population — most field stars were born in clusters. |
| Dynamics & Dissolution | Dynamical Age Indicator | uDynamicalAge | OFF | Ratio of cluster age to relaxation time: indicates how evolved dynamically. Young (<1 crossing time): fractal, unevolved. Moderate (1–10 crossing times): partially relaxed, substructure erasing. Old (>10 crossing times): fully relaxed, concentrated. Rendered as structural morphology transition with age slider. |
| Binary/Multiple Systems | Binary Fraction | uBinaryFraction | OFF | Open clusters: 30–70% binary fraction (similar to field). Binaries concentrated in core (mass segregation of heavier system). Rendered: paired stars with orbital indicators in core region. Bright binaries appear 0.75 mag brighter than single stars at same color (equal-mass binary sequence above MS). Binary sequence visible in CMD as parallel track. |
| Binary/Multiple Systems | Hierarchical Multiples | uHierarchicalMulti | OFF | Triple and higher-order systems: 5–15% of all systems. Hierarchical configuration: close inner binary + wide outer companion. Inner binary: period days–years. Outer: period 10²–10⁵ years. Rendered as clustered point sources with orbital hierarchy indicated. Trapezium-type (non-hierarchical) multiples in very young clusters — dynamically unstable, will eject members. |
| Camera | Star Field View | uCameraMode | ON | Default: resolved stellar field showing full cluster membership against background stars. Distance: 50 pc. FOV 40°. Cluster stars distinguishable from field by concentration and color coherence. Rich star field with cluster superimposed. Naked-eye/binocular observation experience. |
| Camera | H-R Diagram Overlay | uCameraMode | OFF | Split view: spatial cluster image + adjacent color-magnitude diagram (H-R diagram) with cluster stars plotted. Isochrone overlay for age determination. Main sequence, turnoff, RGB, HB visible as distinct features. Educational: connects spatial view to fundamental diagnostic diagram. |
| Camera | Time Speed Multiplier | uTimeSpeed | 10⁶ yr/s | 1 real second = 1 Myr. Cluster dissolution visible over ~1000 seconds (1 Gyr). Stellar evolution: turnoff migration visible. Binary orbital motion: far too fast to see (periods hours–years). Nebula dispersal for young clusters visible in first seconds. |

---

### Galaxy Supercluster

**Entity ID:** ENT-7060
**Description:** Largest coherent structures in the observable universe — collections of galaxy clusters and groups connected by filaments, spanning 100–300 Mpc. NOT gravitationally bound (expansion wins over gravity at this scale), but represent density enhancements above cosmic mean. Contains 2–20 galaxy clusters plus associated filaments, walls, and galaxy groups. Total mass: 10¹⁵–10¹⁷ M☉. Superclusters are converging (locally overdense) but will never collapse as a unit — dark energy dominates. Shape: elongated, filamentary, sheet-like or branching. Real exemplars: Laniakea Supercluster (our home, ~160 Mpc diameter, ~10¹⁷ M☉), Shapley Supercluster (most massive nearby, ~200 Mpc), Perseus-Pisces, Saraswati (one of largest known, z=0.28).

**Section Count:** 7 (Cluster Nodes, Connecting Filaments, Velocity Field, Boundary Definition, Internal Voids, Member Properties, Camera)
**Feature Count:** 25

| Section | Feature | Uniform | Default | Description |
|---------|---------|---------|---------|-------------|
| Cluster Nodes | Major Cluster Nodes | uMajorClusters | ON | 2–10 major galaxy clusters (M > 10¹⁴ M☉) forming supercluster backbone. Each rendered as bright concentration of galaxies with ICM glow. Colors: #F0D8A0 (BCG-like central brightness), #4A6A9A (ICM halo). Cluster separation: 20–80 Mpc. Connected by filaments. Relative positions define supercluster shape — typically elongated/flattened. |
| Cluster Nodes | Galaxy Groups | uGalaxyGroups | ON | 10–100 galaxy groups (M ~10¹³ M☉) filling space between major clusters. Each: 3–30 galaxies with modest hot gas halo. Color: #E0D0A0 (galaxy light), #3A5A7A (faint X-ray halo, opacity 0.01). Groups distributed along filaments. Outnumber clusters 10:1 but much less massive individually. Groups are primary environment for galaxy transformation. |
| Cluster Nodes | Cluster Mass Indicators | uClusterMassIndicators | OFF | Visual mass ranking of member clusters. Size/brightness of cluster node proportional to mass (richness class). Most massive cluster (supercluster "center of mass"): largest rendering. Mass range: 10¹⁴ to 10¹⁵ M☉ among members. Shapley: central cluster A3558 (10¹⁵ M☉). Laniakea: Great Attractor region (Norma cluster). |
| Connecting Filaments | Inter-Cluster Filaments | uInterClusterFilaments | ON | Cosmic web filaments connecting cluster nodes. Length: 20–80 Mpc. Width: 2–10 Mpc. Galaxy density: 5–20× cosmic mean. Color: #C0B890 (galaxy chain light), opacity 0.03. WHIM gas filling filaments: #3A5A7A, opacity 0.02. 10–30 filament segments defining supercluster topology. Filaments thicken approaching cluster nodes. |
| Connecting Filaments | Wall/Sheet Structures | uWallStructures | OFF | Planar galaxy concentrations forming walls between filaments. Walls thinner than filaments but wider. Galaxy density: 2–5× cosmic mean. Rendered as semi-transparent sheets #C8C0A0, opacity 0.01 connecting filaments. Walls bound internal voids within supercluster. Sloan Great Wall: ~400 Mpc long, one of largest known walls. |
| Connecting Filaments | Bridge Structures | uBridgeStructures | OFF | Galaxy bridges connecting adjacent clusters — shorter, denser than typical filaments. Length: 10–30 Mpc. Evidence of cluster-cluster interaction/pre-merger. Galaxy density: higher than filament average. Color: #D0C0A0 with enhanced galaxy concentration. May contain hot shocked gas #5A7A9A from cluster virial region overlap. |
| Velocity Field | Peculiar Velocity Flow | uPeculiarVelocity | ON | Galaxies flowing toward supercluster center of mass (overdensity attracts surrounding matter). Peculiar velocity: 100–600 km/s above Hubble flow. Great Attractor: ~600 km/s pull toward Norma/Centaurus. Rendered as velocity vectors on member galaxies/clusters, converging toward mass center. Arrow color: #5A8A5A, length ∝ velocity. Demonstrates gravitational attraction at 100 Mpc scale. |
| Velocity Field | Hubble Flow Distortion | uHubbleFlowDistortion | OFF | Supercluster overdensity distorts Hubble flow: clusters on near side have redshifts lower than pure Hubble (falling toward center), far side higher (falling toward center from other side). Creates "finger of God" and Kaiser effect in redshift space. Rendered as redshift-space distortion visualization: compressed infall pattern. |
| Velocity Field | Turnaround Surface | uTurnaroundSurface | OFF | Theoretical surface where expansion velocity equals infall velocity — divides collapsing region from expanding. Radius: ~15–30 Mpc from supercluster center. Most superclusters: turnaround surface does NOT encompass entire supercluster (not bound). Laniakea boundary partially defined by velocity field divergence. Rendered as translucent shell #5A7A5A, opacity 0.03. |
| Boundary Definition | Laniakea-Type Watershed | uWatershedBoundary | OFF | Supercluster boundary defined by velocity field watershed (Tully 2014 method): galaxy flow lines converge toward supercluster attractor vs diverge to neighboring supercluster. Boundary is saddle point in velocity potential. Rendered as translucent boundary surface #5A5A7A, opacity 0.02 enclosing converging flow region. Laniakea: ~160 Mpc diameter by this definition. |
| Boundary Definition | Density Contrast Boundary | uDensityBoundary | OFF | Alternative boundary: density contrast δ = 0 surface (above mean density inside, below outside). More conservative than watershed — most superclusters smaller by this criterion. Rendered as denser region boundary #7A7A5A, opacity 0.02. Interior: δ = 0–5 overdense. Exterior: δ < 0 (void-like). |
| Internal Voids | Embedded Voids | uEmbeddedVoids | OFF | Voids within supercluster boundary — lower density but not as empty as field voids. Diameter: 10–40 Mpc. Galaxy density: 0.3–0.7× cosmic mean (less empty than field voids). 2–5 embedded voids per supercluster. Rendered as darker regions #0A0A10 between filament network. Voids bounded by supercluster filaments and walls. |
| Member Properties | Galaxy Type Distribution | uGalaxyTypeDist | OFF | Morphological mix varies with environment within supercluster. Cluster cores: 80% elliptical/S0 #E8D0A0. Filaments: 50/50 mix. Voids: 80% spiral/irregular #8AB0D8. Color-coded rendering showing environmental dependence of galaxy properties. Morphology-density relation at supercluster scale. |
| Member Properties | Luminosity Function | uLuminosityFunction | OFF | Galaxy luminosity distribution following Schechter function: exponential cutoff at bright end (L*), power-law at faint end (α ~-1.2). Brighter in clusters than field. Rendered as size variation with luminosity function statistics overlay. L* brighter in denser environments. Faint-end slope steeper in clusters (more dwarfs). |
| Camera | Full Supercluster View | uCameraMode | ON | Default: entire supercluster visible showing cluster nodes, filament connections, and overall morphology. Distance: 500 Mpc. FOV 50°. Clusters as bright nodes, filaments as tenuous connections. Scale bar: 50 Mpc. Shows coherent large-scale structure. |
| Camera | Velocity Flow Visualization | uCameraMode | OFF | Same spatial view with velocity field overlay: flow lines converging toward attractor. Shows dynamical definition of supercluster. Arrows on all member galaxies. Great Attractor direction highlighted. Educational: connects structure to dynamics. |
| Camera | Time Speed Multiplier | uTimeSpeed | 10⁹ yr/s | 1 real second = 1 Gyr. Supercluster barely evolves at this timescale — structures at this scale formed relatively recently and evolve slowly. Galaxy migration along filaments visible. Cluster growth at nodes visible. Full cosmic history in ~14 seconds. |

---

### 12.7 Lyman-Alpha Blob (LAB)

**Entity ID:** ENT-7080
**Base Mesh:** Amorphous volumetric nebula (100–300 kpc extent)
**Shader Type:** Fragment (Lyman-alpha resonant scattering + embedded sources + cosmological context)
**Exemplar:** LAB-1 (SSA22 protocluster, z=3.1), Himiko (z=6.6), MAMMOTH-1 (z=2.3)

Lyman-alpha blobs are enormous (100–300 kpc) nebulae of hydrogen gas glowing in Lyman-alpha emission (λ_rest = 1216 Å, observed at ~5000–8500 Å for z=3–6). Among the largest individual nebulae in the universe. Found preferentially in protoclusters at z=2–6 — the densest environments in the early universe. Power sources debated: (1) cooling radiation from cold gas accretion onto dark matter halos, (2) photoionization by embedded AGN/starbursts, (3) resonant scattering of Lyman-alpha from embedded galaxies through surrounding neutral hydrogen. LABs may represent galaxies in formation — the observational signature of cold-mode accretion predicted by cosmological simulations.

| Section | Feature | Uniform Name | Default | Description |
|---------|---------|-------------|---------|-------------|
| Lyman-alpha Emission | Main Nebular Glow | uLyaNebula | ON | Extended Lyman-alpha emission: L_Lyα ~ 10⁴³–10⁴⁴ erg/s. Extent: 50–300 kpc (physical). Surface brightness: ~10⁻¹⁸ erg/s/cm²/arcsec². Color: observed wavelength depends on redshift — z=3.1: ~4990 Å (green-blue #40C880), z=6.6: ~9240 Å (NIR, rendered as false-color #FF6040). Rendered: amorphous, filamentary blob #40C880, alpha 0.06. FBM structure: 6-octave, freq 2.0, amplitude 0.35 (clumpy, irregular morphology). |
| Lyman-alpha Emission | Filamentary Sub-structure | uLyaFilaments | ON | Internal filamentary morphology: MUSE IFU reveals narrow (5–10 kpc wide) filaments and bridges connecting embedded galaxies. Color: same Lyman-alpha emission but brighter along filaments #60E8A0, alpha 0.1. Filaments may trace cold gas streams feeding galaxies (cosmological cold-flow accretion). 3–8 visible filaments per blob. FBM along filament axis: 4-octave, freq 6.0. |
| Lyman-alpha Emission | Lyman-alpha Spectral Profile | uLyaProfile | OFF | Resonant scattering: Lyman-alpha photons scatter ~10⁶ times before escaping. Creates characteristic double-peaked spectral profile: blue peak (backscattered) and red peak (transmitted). Red peak typically dominant (outflow). Rendered: spectral overlay showing asymmetric double peak. Peak separation: 200–800 km/s. Profile shape diagnoses gas kinematics (inflow vs. outflow vs. static). |
| Embedded Sources | Embedded Galaxies | uEmbeddedGalaxies | ON | 1–5 galaxies embedded within blob. LAB-1: at least 2 sub-mm galaxies (SMGs, dusty starbursts). Color: UV-bright #A0C0FF (Lyman-break galaxies) or IR-only #FF8040 (dust-obscured). SFR: 100–1000 M☉/yr combined. These galaxies may power Lyman-alpha via photoionization. Positioned at density peaks within blob. Galaxy UV photons resonantly scattered by surrounding HI. |
| Embedded Sources | Embedded AGN | uEmbeddedAGN | OFF | Some LABs contain obscured AGN: detectable via hard X-ray or mid-IR. AGN photoionizes surrounding gas → Lyman-alpha. Power: L_AGN ~ 10⁴⁴–10⁴⁵ erg/s sufficient to power observed Lyman-alpha. Rendered: bright point source #D0D8FF at blob center. AGN ionization cone: directional enhancement #40C880 along cone axis. LAB-1: X-ray detected AGN in one embedded galaxy. |
| Gas Physics | Cold Accretion Streams | uColdAccretion | ON | Cosmological cold-mode accretion: gas flowing along dark matter filaments into halo at T ~ 10⁴ K (never shock-heated). Velocity: 200–400 km/s inflow. Rendered: narrow (10–20 kpc wide) streams #40A070 converging on blob center from 2–3 directions. Cooling radiation from this accretion: L_cool ~ gravitational potential energy release. This mechanism can power Lyman-alpha WITHOUT embedded sources. |
| Gas Physics | Neutral Hydrogen Column | uHIColumn | OFF | Surrounding HI: N_HI ~ 10²⁰–10²¹ cm⁻² (optically thick to Lyman-alpha). Creates scattering halo: photons random-walk through HI, emerging at larger radii with frequency shifts. Rendered: neutral gas as diffuse #2A4A3A outer envelope around emission region. Scattering extends apparent size by ×2–3 beyond intrinsic emission. Damping wing absorption visible in spectra. |
| Gas Physics | Gas Temperature / Cooling | uGasCooling | OFF | Multi-phase gas: T ~ 10⁴ K (warm neutral/ionized, Lyman-alpha emitting), T ~ 10⁵·⁵ K (warm-hot, UV metal lines), T ~ 10⁷ K (hot halo, X-ray). Cooling rate: Λ(T) peaks at ~10⁴ K (hydrogen) and ~10⁵·⁵ K (metal lines). Rendered: temperature-color map from cool #40C880 through warm #C0A060 to hot #5A7AAA. Cooling flow: gas cooling from virial temperature → Lyman-alpha emission. |
| Polarization | Lyman-alpha Polarization | uLyaPolarization | OFF | Scattered Lyman-alpha is polarized: tangential polarization pattern around central source. Polarization degree: 10–20% at blob outskirts. Detected in LAB-1 by Subaru. Diagnostic: confirms scattering (central illumination) vs. in-situ emission (cooling radiation). Rendered: polarization tick marks #FFFFFF overlaid, tangential to blob center. Higher polarization at edges → scattering-dominated. |
| Environment | Protocluster Context | uProtoclusterCtx | ON | LABs found in densest environments at z=2–6: protoclusters. SSA22 protocluster (z=3.1): contains LAB-1, LAB-2, dozens of Lyman-break galaxies. Galaxy overdensity: ×5–20 over field. Rendered: surrounding galaxies as scattered points #A0C0FF within ~10 Mpc (comoving). Filamentary galaxy distribution. Protocluster evolving into massive galaxy cluster by z=0. |
| Environment | IGM / CGM Context | uIGMContext | OFF | Circum-galactic medium (CGM) of forming halo: M_halo ~ 10¹²–10¹³ M☉ (massive). CGM extent: ~200 kpc (comparable to blob). Gas metallicity: ~0.1 Z☉ (enriched by embedded galaxy outflows). Rendered: diffuse #3A5A4A halo around blob, alpha 0.02. Transition zone between cosmic web gas and galaxy ISM. |
| Camera | Standard View | uCameraMode | ON | Default: blob filling frame. Filamentary Lyman-alpha emission in false-color (green for z~3, red for z~6). Embedded galaxies as brighter knots. Scale bar: 100 kpc (physical). Redshift annotated. Protocluster context at frame edges. Amorphous, ghostly appearance. |
| Camera | Multi-wavelength Comparison | uCameraMode | OFF | Split view: Lyman-alpha (narrowband), UV continuum (LBG positions), sub-mm (dusty galaxies), X-ray (AGN/hot gas). Shows how different components contribute to blob. Lyman-alpha extended beyond all other wavelengths. Educational: multi-wavelength astronomy demonstration. |
| Camera | Time Speed Multiplier | uTimeSpeed | 10⁸ yr/s | LAB lifetimes: ~10⁸–10⁹ yr (duration of major accretion episode). At default: blob forms, peaks, and fades over ~10 seconds. Cold accretion stream evolution visible. Embedded galaxy growth. Protocluster assembly. Slow to 10⁶ yr/s for gas dynamics and galaxy interaction. |

---

## 13. Spatial Database Integration

This section links entity rendering specifications (this document) to the spatial universe database (doc 23: `23-spatial-universe-database.md`).

### 13.1 Entity Type ↔ Real Object Mapping

Each entity type defined in this document (ENT-xxxx) maps to real astronomical objects in the spatial database. When the user navigates to a real object, the spatial database determines which entity type to render, and this document's feature tables define how it looks.

**Mapping flow:**

```
User navigates to "Betelgeuse"
  → Spatial DB: Gaia DR3 source, SpT=M1-2Ia-Iab, T_eff=3600K
  → Classification: Red Giant (ENT-1012)
  → This document: ENT-1012 feature table
  → Shader: Red Giant fragment shader with 26 toggle uniforms
  → Physical params from Gaia: T_eff=3600K → uPhotosphereColor, R=887R☉ → mesh scale
```

### 13.2 Entity Type Registry (Cross-Reference)

| ENT ID | Entity Type | Doc 22 Section | Real Object Count | Primary Catalog |
|--------|-------------|----------------|-------------------|-----------------|
| 1010 | G-Type (Sun-like) | §4 | ~200M (est. F5–K2 dwarfs in Gaia) | Gaia DR3 |
| 1012 | Red Giant | §4 | ~100M (est. K/M giants in Gaia) | Gaia DR3 |
| 1014 | Blue Supergiant | §4 | ~50,000 | Gaia DR3 |
| 1016 | Neutron Star / Pulsar | §4 | ~3,400 | ATNF Pulsar Cat |
| 1018 | White Dwarf | §4 | ~360,000 (Gaia DR3 WD catalog) | Gaia DR3 |
| 1020 | Wolf-Rayet | §4 | ~600 | Galactic WR Catalogue |
| 1022 | Black Hole (Stellar) | §4 | ~70 (confirmed in X-ray binaries) | Various |
| 1024 | Red Dwarf (M-Dwarf) | §4 | ~1.3B (est. 70% of all stars) | Gaia DR3 |
| 1026 | Brown Dwarf | §4 | ~3,000 (L/T/Y dwarfs known) | Gaia + WISE |
| 1028 | Cepheid Variable | §4 | ~3,000 | Gaia DR3 + GCVS |
| 2010–2026 | Planets (Solar System) | §5–§6 | 8 | JPL DE441 |
| 2030–2040 | Exoplanet types | §5–§6 | ~5,800 | NASA Exoplanet Archive |
| 2043 | Earth-Type Habitable | §5 | 1 (Earth) + candidates | — |
| 3010–3020 | Major Moons | §7 | ~30 major | JPL |
| 4010–4050 | Small Bodies | §10 | ~1,300,000 | MPC + JPL |
| 5010–5052 | Nebulae | §8 | ~15,000 | NGC/IC + specialized |
| 6010–6062 | Galaxies | §9 | ~4,000,000 | HyperLEDA + SDSS |
| 8010–8046 | Exotic Objects | §11 | ~5,000 | Various |

### 13.3 Shader Parameter Injection

When a real object is selected for full entity rendering (camera distance < LOD threshold), the spatial database injects physical parameters into the doc 22 shader uniforms:

| Spatial DB Field | → Shader Uniform Pattern | Example |
|------------------|-------------------------|---------|
| temperature_K | uPhotosphereTemp / uPhotosphereColor | 5772K → #FFF4E8 |
| radius_meters | Mesh scale | 6.957 × 10⁸ m → sphere radius |
| luminosity_solar | uLuminosity (bloom intensity) | 1.0 L☉ |
| spectral_type | Entity type selection + color tuning | G2V → ENT-1010 |
| metallicity | uMetallicity (if feature exists) | [Fe/H] = 0.0 |
| variability_period | uPulsationPeriod (Cepheids, etc.) | 5.366 days |
| axis_ratio + position_angle | Galaxy orientation | b/a = 0.32, PA = 35° |
| morphology_type | Spiral arm count, bar presence | SBbc → 2 arms + bar |

### 13.4 Companion Document

Full spatial database specification, including coordinate systems, octree indexing, all catalog sources, Solar System ephemeris, Milky Way structure, galaxy positions, large-scale structure, navigation/warp system, and GPU pipeline, is in:

**→ [23-spatial-universe-database.md](./23-spatial-universe-database.md)**

---

## 14. Implementation Notes

### 14.1 Shader Architecture

All features are implemented as `float` uniforms in entity-specific GLSL fragment shaders. Each feature contributes an additive, multiplicative, or mix-based modification to the base color computed by the shader. A typical fragment shader dispatch pattern:

```glsl
// === Example: G-Type Star Fragment Shader ===
precision highp float;

uniform vec3 uSunDir;
uniform float uTime;

// Photosphere section
uniform float uGranulation;
uniform float uSupergranulation;
uniform float uLimbDarkening;
uniform float uFacularBrightening;
uniform float uSpiculeTexture;
uniform float uPhotosphericInflation;

// Chromosphere section
uniform float uChromosphereLayer;
uniform float uSpiculeForest;
uniform float uMottledTexture;
uniform float uLimbProminences;

// Corona section
uniform float uCoronaHaze;
uniform float uCoronalLoops;
uniform float uHelmetStreamers;
uniform float uCoronalMassEjections;
uniform float uCoronalDimming;

// Activity section
uniform float uSunspots;
uniform float uSpotMagneticField;
uniform float uSolarFlares;
uniform float uEruptiveProminences;
uniform float uPlageRegions;

// Magnetic section
uniform float uMagneticFieldLines;
uniform float uPolarityReversal;
uniform float uPolarCoronalHoles;
uniform float uHeliosphereBoundary;

// Solar wind section
uniform float uSolarWindStreaks;
uniform float uInterplanetaryMagneticField;
uniform float uCoronalRadiationZones;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

// Ashima/Gustavson GLSL Simplex noise
float snoise(vec3 v) { /* ... */ }

// Multi-octave FBM
float fbm(vec3 p, int octaves, float freq, float amp) {
    float sum = 0.0;
    for (int i = 0; i < 8; i++) {
        if (i >= octaves) break;
        sum += snoise(p * freq) * amp;
        freq *= 2.0; amp *= 0.5;
    }
    return sum;
}

vec3 photosphereColor(vec3 p, vec3 N, vec3 V) {
    vec3 base = vec3(1.0, 0.956, 0.878); // #FFF4E0

    // Granulation
    if (uGranulation > 0.5) {
        float g = fbm(p * 45.0, 3, 1.0, 0.6);
        vec3 hot = vec3(1.0, 0.910, 0.710);   // #FFE8B5
        vec3 cool = vec3(0.776, 0.478, 0.176); // #C67A2D
        base = mix(cool, hot, g * 0.5 + 0.5);
    }

    // Supergranulation
    if (uSupergranulation > 0.5) {
        float sg = fbm(p * 8.0 + vec3(uTime * 0.02), 2, 1.0, 0.3);
        base *= 1.0 + sg * 0.05;
    }

    // Limb darkening
    if (uLimbDarkening > 0.5) {
        float mu = max(0.0, dot(N, V));
        base *= mix(vec3(1.0, 0.627, 0.259), vec3(1.0), pow(mu, 0.6)); // #FFA042 limb
    }

    // Facular brightening (Voronoi-seeded)
    if (uFacularBrightening > 0.5) {
        float f = step(0.8, snoise(p * 20.0));
        base += vec3(0.0, 0.0, -0.05) * f + vec3(0.08) * f; // facular boost
    }

    return base;
}

void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vPosition);

    vec3 col = photosphereColor(vPosition, N, V);
    // ... chromosphere, corona, activity layers composited additively
    gl_FragColor = vec4(col, 1.0);
}
```

### 14.2 UI Integration

Toggle features are exposed via a feature panel rendered beside the 3D canvas, following the UI specs defined in Doc 20 (UI Specs per Persona).

1. **Layout:**
   - Collapsible section headers (`<details>` element with rotating chevron).
   - Checkbox (for booleans) or slider (for `[0..1]` amounts) per feature.
   - Tooltip on hover showing the Description field text.
   - "Default" reset button per section.
   - Persisted to `localStorage` per entity type.

2. **Keyboard shortcuts:**
   - `1..9` — toggle sections expanded/collapsed.
   - `Shift+R` — reset all toggles to defaults.
   - `Shift+A` — toggle all features in the currently focused section.

3. **Performance Considerations:**
   - Features default to ON/OFF based on performance cost:
     - Cheap (baseline color, limb darkening, simple noise) — always ON.
     - Mid-cost (animated noise, multi-octave FBM, Worley) — ON for Tier-1+ GPUs.
     - Expensive (raymarched volumetrics, relativistic lensing, many-spline magnetic field overlay) — OFF by default.
   - Mobile / Tier-2 GPUs automatically disable OFF-by-default features even if user toggles them (subject to warning modal).

4. **State transitions:**
   - Toggle changes update shader uniforms in real-time (`material.uniforms.uGranulation.value = checked ? 1.0 : 0.0`).
   - No scene reload required.
   - Smooth cross-fade (300 ms easing) applied when possible via intermediate `uniformAmount` modulation.

### 14.3 Testing & Validation

- **Visual regression tests:** For each entity, render a reference screenshot with all toggles at defaults. CI compares against stored baseline with SSIM threshold 0.96.
- **Combinatorial smoke tests:** For each entity, enable each feature individually with all others disabled; verify no shader compilation errors or visual artifacts.
- **Performance profiling:** Each entity must sustain ≥60 FPS on Tier-1 GPU with all default-ON features enabled; ≥30 FPS on Tier-2 GPU with minimal feature set.
- **Physical accuracy review:** A domain expert (astronomy consultant) reviews each entity annually against NASA/ESA imagery and peer-reviewed papers. Deviations that lose scientific accuracy trigger a revision ticket.
- **Accessibility:** Toggle panels follow WCAG 2.1 AA contrast and keyboard navigation. Features that rely exclusively on color differences (e.g., magnetic polarity) have alternative patterns/labels when high-contrast mode is active.

### 14.4 Performance Budgets (per entity)

| Tier | GPU Class | Max Default-ON Uniforms Active | Target FPS |
|---------|---------|---------|---------|-------------|
| T0 (Desktop HQ) | RTX 3070+ / M1 Pro+ | All 30-40 features | 60+ |
| T1 (Desktop) | GTX 1060 / Intel Iris | ~25 features | 60 |
| T2 (Laptop / Tablet) | Intel UHD / Adreno 650+ | ~15 core features | 45 |
| T3 (Mobile) | Adreno 630 / Mali-G76 | ~8 essential features | 30 |

When a user's GPU falls below the tier for full defaults, the UI auto-reduces ON features (following priority order: essential > structural > dynamic > speculative/exotic) and shows a one-time notice.

### 14.5 Feature Ownership & Extensibility

New features are added via a YAML schema entry in `src/entities/<entity>/features.yaml`:

```yaml
- name: CoronalLoops
  section: Corona
  uniform: uCoronalLoops
  default: on
  cost: medium
  description: >
    Bright magnetic field line structures threading through corona ...
```

A build step generates TypeScript types, uniform registrations, and UI panel schemas from this file. Addition of a feature requires:
1. YAML entry.
2. GLSL shader implementation (may refactor existing shader).
3. Visual regression baseline update.
4. Description review by domain expert.

---

## 15. Audio System Integration

### 15.1 Per-Entity Audio Triggers

Each entity type generates a unique procedural audio signature via Tone.js / Web Audio API. Audio parameters are derived from physical properties and toggled features.

| Entity Category | Audio Synthesis | Trigger | Spatial |
|----------------|----------------|---------|---------|
| Stars | Oscillator (sine/sawtooth) tuned to spectral class; T_eff → frequency mapping (3000 K = 80 Hz, 30000 K = 2000 Hz) | Object selection or proximity (<10 AU) | 3D PannerNode at object position |
| Rocky Planets | Low-pass filtered noise (wind); frequency mapped to atmospheric pressure; resonant peaks at surface composition | Proximity (<1 AU) or detail view | 3D PannerNode; gain ∝ 1/distance² |
| Gas Giants | Multi-oscillator drone (3 detuned sines at ratios 1:1.5:2); LFO modulation ∝ rotation period; storm features add ring-modulated bursts | Proximity (<5 AU) or detail view | 3D PannerNode; stereo spread for large objects |
| Moons | Attenuated parent planet audio + subtle surface tone (ice cracking for icy moons, volcanic rumble for Io-type) | Proximity (<0.1 AU) | 3D PannerNode |
| Small Bodies | Short percussive clicks (asteroid tumble); swooping filtered noise (comet tail); rate ∝ rotation period | Selection or proximity | 3D PannerNode |
| Nebulae | Reverb-heavy pad synthesis; spectral content from emission line wavelengths (Hα → C4, OIII → G5, NII → A3) | Scale 3–4 proximity | Omnidirectional ambient; gain ∝ angular size |
| Galaxies | Layered noise (star population → white noise density); modulated by morphological type (spiral = rhythmic pulsing, elliptical = smooth) | Scale 5–6 proximity | Omnidirectional ambient |
| Large-Scale Structure | Deep sub-bass drone (20–40 Hz); cosmic web density → gain; void = silence | Scale 7+ | Omnidirectional |
| Exotic Objects | Unique per type: black hole = gravitational wave chirp (LIGO-inspired), pulsar = periodic click at P_rot, magnetar = chaotic burst | Selection or proximity | 3D PannerNode |

### 15.2 Audio-Toggle Coupling

When a toggle feature is changed, audio parameters update in real-time:

- `uGranulation` ON → adds granulation noise layer (crackling, 0.1–1 kHz white noise bursts at convection timescale)
- `uGreatRedSpot` ON → adds low-frequency oscillation (storm rumble, 30–60 Hz AM modulation)
- `uAccretionDisk` ON → adds disk harmonic series (Keplerian frequency gradient from inner to outer radius)
- `uHawkingRadiation` ON → adds faint high-frequency hiss (thermal noise at Hawking temperature mapping)

**Rule:** Audio changes follow the same 300 ms cross-fade easing as visual toggles.

### 15.3 Scale-Aware Audio Mixing

| Scale Level | Audio Content | Master Gain | Reverb |
|------------|--------------|-------------|--------|
| 1 (Solar System) | Individual object audio, orbital mechanics | 1.0 | Dry (space) |
| 2–3 (Stellar) | Star cluster drone, nearest-star pings | 0.8 | Medium hall |
| 4 (Milky Way) | Galactic drone, spiral arm density modulation | 0.6 | Large cathedral |
| 5–6 (Extragalactic) | Galaxy cluster wash, void silence | 0.4 | Infinite (100% wet) |
| 7–9 (Cosmic) | Sub-bass cosmic web drone, CMB hiss | 0.3 | 100% wet |

### 15.4 Audio Requirements

- **AUD-001**: Audio context SHALL be created on first user interaction (browser autoplay policy compliance)
- **AUD-002**: All audio SHALL be procedurally generated — no pre-recorded samples
- **AUD-003**: Spatial audio SHALL use HRTF panning model for headphone users
- **AUD-004**: Audio SHALL be independently mutable per category (stars, planets, ambient, UI)
- **AUD-005**: Audio latency SHALL be <100 ms from trigger to output
- **AUD-006**: CPU budget for audio SHALL not exceed 5% of frame time

---

## 16. Guided Tours, Comparison Mode, Bookmarks & Sharing

### 16.1 Guided Tour System

Guided tours are scripted sequences of camera movements, object selections, and narration text that guide users through educational content.

#### Tour Data Schema

```yaml
tour:
  id: "solar-system-101"
  title: "Our Solar System"
  description: "A guided journey through the 8 planets"
  duration_minutes: 12
  difficulty: beginner
  chapters:
    - id: "ch1-sun"
      title: "The Sun"
      target: { ra: 0, dec: 0, distance: 0, ent_id: 1001 }
      camera: { distance_au: 50, pitch: -15, yaw: 0 }
      narration: "Our journey begins at the center..."
      toggles: { uGranulation: true, uSunspots: true, uCorona: false }
      duration_sec: 60
      auto_advance: true
    - id: "ch2-mercury"
      # ...
```

#### Tour Requirements

- **TOUR-001**: The system SHALL support at least 10 pre-built tours covering Solar System, Stars, Galaxies, and Cosmic Web
- **TOUR-002**: Each tour chapter SHALL smoothly animate the camera from current position to the target (Hermite spline interpolation, 2–4 second transition)
- **TOUR-003**: Tour narration text SHALL be displayed in a non-modal overlay panel with previous/next/pause controls
- **TOUR-004**: Toggle states SHALL be set per-chapter (restoring user's custom toggles when tour ends)
- **TOUR-005**: Users SHALL be able to create custom tours by recording camera waypoints and adding text annotations
- **TOUR-006**: Custom tours SHALL be stored in IndexedDB (`custom_tours` table) and exportable as JSON
- **TOUR-007**: Tours SHALL be shareable via URL-encoded state (tour_id + chapter_index)

### 16.2 Comparison Mode

Side-by-side or overlay comparison of two entity instances (e.g., Earth vs. Mars, spiral vs. elliptical galaxy).

- **COMP-001**: The system SHALL support split-screen comparison (50/50 vertical split, draggable divider)
- **COMP-002**: Each half SHALL have independent camera controls but linked zoom level
- **COMP-003**: Toggle panels SHALL be mirrored — toggling a feature in one half optionally toggles in both
- **COMP-004**: A properties comparison table SHALL display side-by-side physical parameters (mass, radius, temperature, etc.)
- **COMP-005**: Comparison state SHALL be URL-encodable (`?compare=2001,2003`)
- **COMP-006**: Scale overlay SHALL show relative size comparison (e.g., "Earth is 11.2× smaller than Jupiter")

### 16.3 Bookmark System

- **BOOK-001**: Users SHALL save viewpoints as named bookmarks (camera position, rotation, scale level, selected object, time epoch, toggle states)
- **BOOK-002**: Bookmarks SHALL be stored in IndexedDB (`bookmarks` table) with auto-generated thumbnails (canvas snapshot, 256×144 px)
- **BOOK-003**: The bookmark panel SHALL display a scrollable list with thumbnail, name, and creation date
- **BOOK-004**: Clicking a bookmark SHALL animate the camera to the saved viewpoint (same Hermite interpolation as tours)
- **BOOK-005**: Bookmarks SHALL be exportable/importable as JSON
- **BOOK-006**: The system SHALL provide 5 pre-loaded "featured" bookmarks (Earth from ISS, Saturn's rings, Andromeda, Eagle Nebula, Cosmic Web node)

### 16.4 Sharing System

- **SHARE-001**: The system SHALL encode current view state as a URL parameter string (camera, selection, toggles, time, scale)
- **SHARE-002**: URL state SHALL be <2 KB total (compressed base64)
- **SHARE-003**: The system SHALL provide a "Copy Link" button and native Share API integration (mobile)
- **SHARE-004**: The system SHALL support screenshot capture (canvas.toBlob → downloadable PNG, 1920×1080 or current viewport size)
- **SHARE-005**: Screenshots SHALL include optional watermark ("Cosmos Explorer" + coordinates + timestamp)
- **SHARE-006**: The system SHALL support sharing to social media (Twitter/X, Facebook, Reddit) via Open Graph meta tags and share intent URLs

---

## 17. Accessibility & Mobile Layout

### 17.1 WCAG 2.1 AA Compliance

| Requirement | Implementation | Priority |
|------------|---------------|----------|
| **Keyboard Navigation** | All UI controls reachable via Tab/Shift-Tab; Enter/Space to activate; Arrow keys for sliders; Escape to close modals | MUST |
| **Focus Indicators** | 2px solid outline (#4A90D9) on all focusable elements; visible on both light and dark backgrounds | MUST |
| **Screen Reader Support** | `aria-label` on all controls; `aria-live` for dynamic content (info panel updates, tour narration); `role="application"` on 3D canvas | MUST |
| **Color Contrast** | All text ≥4.5:1 contrast ratio (AA); large text ≥3:1; UI chrome ≥3:1 against background | MUST |
| **Reduced Motion** | Respect `prefers-reduced-motion: reduce` — disable auto-rotate, slow camera transitions to instant, disable particle animations | MUST |
| **Text Scaling** | UI text scales with browser zoom (rem units); info panels reflow at 200% zoom | SHOULD |
| **High Contrast Mode** | Detect `prefers-contrast: more` — increase UI chrome borders, use solid fills instead of gradients | SHOULD |
| **Alternative Text** | All informational images/icons have alt text; decorative icons have `aria-hidden="true"` | MUST |

#### 3D Canvas Accessibility

The 3D canvas presents unique accessibility challenges:

- **A11Y-3D-001**: Object names SHALL be announced via `aria-live` region when selection changes
- **A11Y-3D-002**: A text-based object list (alternative to visual browsing) SHALL be available as a panel
- **A11Y-3D-003**: Keyboard camera controls (WASD/arrows) SHALL work without mouse
- **A11Y-3D-004**: Scale level and current distance SHALL be announced when they change
- **A11Y-3D-005**: Toggle feature descriptions SHALL be readable by screen readers
- **A11Y-3D-006**: Search autocomplete SHALL be navigable with arrow keys + announce selected option

### 17.2 Mobile & Tablet Layout

#### Viewport Breakpoints

| Breakpoint | Width | Layout | Navigation |
|-----------|-------|--------|-----------|
| Mobile S | <375px | Full-screen canvas; bottom sheet for info; hamburger menu | Touch: pinch-zoom, drag-pan, tap-select |
| Mobile L | 375–768px | Full-screen canvas; slide-up panels | Touch: pinch-zoom, drag-pan, two-finger-rotate |
| Tablet | 768–1024px | Canvas with collapsible side panel (40% width) | Touch + optional keyboard |
| Desktop | 1024–1440px | Canvas with persistent side panel (320px) | Mouse + keyboard |
| Desktop XL | >1440px | Canvas with wide side panel (400px); optional dual-panel | Mouse + keyboard |

#### Touch Gesture Mapping

| Gesture | Action |
|--------|--------|
| Single finger drag | Pan camera (orbit mode) / Look around (free-flight) |
| Pinch (two fingers) | Zoom in/out (logarithmic scale) |
| Two-finger rotate | Roll camera |
| Tap | Select object (raycast) |
| Double-tap | Zoom to object (fly-to animation) |
| Long press | Open context menu (info, bookmark, compare) |
| Three-finger swipe up | Open search |
| Edge swipe (left) | Open toggle panel |
| Edge swipe (right) | Open info panel |

#### Mobile Performance Tiers

| Tier | Device Class | Max Features | Resolution Scale | Target FPS |
|------|-------------|-------------|-----------------|-----------|
| M-High | iPhone 15 Pro, Galaxy S24, iPad Pro M2 | ~20 toggles | 1.5× | 60 |
| M-Mid | iPhone 13, Galaxy S21, iPad Air | ~12 toggles | 1.0× | 45 |
| M-Low | iPhone 11, Galaxy A54, older iPads | ~6 toggles | 0.75× | 30 |

- **MOBILE-001**: The system SHALL detect device capability via GPU renderer string and adjust feature tier automatically
- **MOBILE-002**: Touch targets SHALL be ≥44×44 CSS pixels (Apple HIG guideline)
- **MOBILE-003**: The system SHALL enter low-power mode when battery <20% (reduce FPS target to 30, disable non-essential toggles)
- **MOBILE-004**: Orientation change SHALL re-render without losing state
- **MOBILE-005**: The system SHALL support PWA installation (manifest.json, service worker, offline-capable core)

---

## 18. References & Sources

### 18.1 Primary Astronomical Sources
- **NASA Jet Propulsion Laboratory (JPL)** — Solar System Exploration; planetary textures and ephemeris data.
- **European Space Agency (ESA)** — Gaia DR3, Rosetta, Cassini, Hubble legacy archives.
- **Space Telescope Science Institute (STScI)** — Hubble & JWST imagery and spectra.
- **NASA Solar Dynamics Observatory (SDO)** — Reference imagery for all G-Type star surface features.
- **Juno, Cassini, New Horizons** mission data — Jupiter, Saturn, Pluto detailed surface and atmospheric features.

### 18.2 Scientific References per Category
- **Stars:** Carroll & Ostlie, *An Introduction to Modern Astrophysics* (2017); Prialnik, *Stellar Structure and Evolution* (2009).
- **Planetary Atmospheres:** Sanchez-Lavega, *Introduction to Planetary Atmospheres* (2011).
- **Nebulae:** Osterbrock & Ferland, *Astrophysics of Gaseous Nebulae and AGN* (2006).
- **Galaxies:** Binney & Tremaine, *Galactic Dynamics* (2008); Mo, van den Bosch, & White, *Galaxy Formation and Evolution* (2010).
- **Compact Objects:** Shapiro & Teukolsky, *Black Holes, White Dwarfs, and Neutron Stars* (2004).
- **Relativistic Effects:** Misner, Thorne, Wheeler, *Gravitation* (2017 reprint).

### 18.3 Rendering & Shader References
- **Simplex Noise:** Ashima/Ian McEwan, *Simplex Noise for WebGL* (2012).
- **FBM & Turbulence:** Ken Perlin, *Improving Noise* (2002).
- **Volumetric Rendering:** Raymarching techniques from Shadertoy community, Inigo Quilez (`iq`) tutorials.
- **SpaceEngine** — Reference for stellar physics-driven rendering pipeline.
- **Celestia** — Open-source educational reference.

### 18.4 Calibration Databases
- **Gaia DR3** — Stellar parallax, proper motion, photometry.
- **SDSS DR18** — Galaxy morphology and photometry.
- **2MASS** — Near-IR stellar photometry.
- **ALMA Archive** — Protoplanetary disk images (HL Tau, PDS 70).
- **Event Horizon Telescope** — M87 and Sgr A* black hole reference imagery.

---

**Document End**

Last Updated: 2026-04-18 | Version 4.3 | Status: Active | Scope: 96 entities × avg 25.8 features = ~2,477 feature specifications + Audio (§15) + Tours/Bookmarks/Sharing (§16) + Accessibility/Mobile (§17)
