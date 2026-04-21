# Visual Rendering & Shader Specification
## Cosmos Explorer

**Project:** Cosmos Explorer  
**Version:** 1.0  
**Date:** 2026-04-16  
**Purpose:** Precise rendering, texture, shader, and animation specifications for every entity type in the interactive 3D universe visualization.  
**Cross-reference:** For per-entity interactive toggle features (checkbox/slider UI controls with shader uniform mappings), see [Doc 22 — Interactive Toggle Features](./22-interactive-toggle-features.md).

---

## Table of Contents

1. [Rendering Architecture Overview](#rendering-architecture-overview)
2. [Star Rendering (Main Sequence)](#star-rendering-main-sequence)
3. [Stellar Evolution Classes](#stellar-evolution-classes)
4. [Stellar Systems](#stellar-systems)
5. [Rocky Planets](#rocky-planets)
6. [Gas Giants](#gas-giants)
7. [Ice Giants](#ice-giants)
8. [Exotic Planet Types](#exotic-planet-types)
9. [Moon Types](#moon-types)
10. [Small Bodies](#small-bodies)
11. [Nebula Rendering](#nebula-rendering)
12. [Galaxy Rendering](#galaxy-rendering)
13. [Large-Scale Structures](#large-scale-structures)
14. [Post-Processing & Global Effects](#post-processing--global-effects)
15. [Animation Specifications](#animation-specifications)
16. [Sound Design Mapping](#sound-design-mapping)

---

## Rendering Architecture Overview

### 3.1 Three.js Scene Graph Structure

The Cosmos Explorer rendering system is organized as a hierarchical Three.js scene graph:

```
THREE.Scene
├── Skybox (CubeCamera for environment mapping)
├── Lights
│  ├── Directional lights (per stellar system center)
│  ├── Point lights (stars, supernovae)
│  └── Ambient light (galactic background)
├── Celestial Objects Group
│  ├── Stars (Instanced BufferGeometry)
│  ├── Planets (Mesh with custom materials)
│  ├── Moons (Mesh group per planet)
│  ├── Small Bodies (Instanced for asteroids/comets)
│  └── Stellar Features (Particle systems, volumetric effects)
├── Nebulae (Volumetric meshes with raymarching)
├── Galaxies (Billboard sprites + particle clouds for detail)
├── Post-Processing Chain (EffectComposer)
└── Atmosphere/Haze (Screen-space shader)
```

### 3.2 Render Pipeline

The complete rendering flow:

1. **Geometry Phase**: All meshes rendered to framebuffer with depth buffer
2. **Material Phase**: Custom materials apply textures, normals, parallax mapping
3. **Shader Phase**: Per-pixel GLSL shaders compute lighting, atmosphere, corona effects
4. **Post-Processing**: Applied in sequence:
   - UnrealBloomPass (emissive glow)
   - ToneMapping (exposure compensation)
   - FXAA (anti-aliasing)
   - ChromaticAberration (color fringing at edges)
   - FilmGrain (adds photographic realism)
5. **Screen Output**: Final composite rendered to canvas

### 3.3 Level of Detail (LOD) System

Five LOD levels govern rendering complexity:

**LOD 0 (Ultra-Close: 0.1 - 1.0 AU)**
- Full high-resolution surface textures (4K minimum)
- Per-pixel parallax mapping
- Individual crater shadows
- Animated atmospheric convection cells
- Full particle effects (dust storms, lava fountains)
- Real-time shadow casting

**LOD 1 (Close: 1.0 - 10 AU)**
- High-resolution textures (2K)
- Normal maps for surface relief
- Global atmospheric effects animated
- Simplified particle systems
- Dynamic shadows at reduced resolution

**LOD 2 (Medium: 10 - 100 AU)**
- Medium textures (1K)
- Baked lighting on surface
- Atmospheric glow simplified to texture-based
- Static particle effects
- No per-object shadows; use pre-baked shadow texture

**LOD 3 (Far: 100 - 1000 AU)**
- Low-resolution textures (512px)
- Simplified geometry (reduced polygon count)
- Solid color or gradient material
- Atmospheric haze applied as edge glow only
- No particle effects; only bloom

**LOD 4 (Icon/Distant: >1000 AU)**
- Billboard sprite (single quad with 256px texture)
- Pure emissive glow color
- No geometry, no particles
- Only bloom and color visible
- Minimal draw call overhead

Transitions between LOD levels use cross-fade blending over 0.5 seconds to prevent popping.

### 3.4 Instanced Rendering

For bulk rendering of similar objects:

- **Stars**: Up to 10,000 stars per system use `InstancedBufferGeometry`
  - Positions, colors, sizes stored in buffer attributes
  - Single material with instanced shader
  - Reduces draw calls from 10,000 to 1

- **Asteroids**: Asteroid fields up to 100,000 use instanced rendering
  - Each instance rotates independently via shader
  - Multiple meshes in cluster share single material
  - Culling removes off-screen instances

- **Star Particles**: Nebula star fields use point cloud instancing
  - 1M+ points rendered as single draw call
  - Custom shader controls per-point size, brightness, color

### 3.5 Post-Processing Chain

Applied in this order:

**UnrealBloomPass**
- Threshold: 0.8 (values > 0.8 brightness bloom)
- Strength: 1.5
- Radius: 8
- Per-object bloom intensity controlled by object emissive value
- Stars: high bloom (1.5 - 3.0)
- Planets: low bloom (0.2 - 0.5)
- Nebulae: medium bloom (0.8 - 1.5)

**ToneMapping (ACESFilmic)**
- Exposure: 1.0 (adjustable in settings, 0.5 - 2.0 range)
- Gives cinematic, slightly desaturated look
- Prevents overexposure of bright stars

**FXAA (Fast Approximate Anti-Aliasing)**
- Reduces jagged edges on geometry
- Applied last before chromatic aberration
- Minimal performance impact

**Chromatic Aberration**
- Intensity: 0.002 (very subtle)
- Only visible at screen edges
- Radius: 50px from edge
- Imitates lens imperfections

**Film Grain**
- Opacity: 0.03 (very subtle)
- Grain size: 2x2 pixel blocks
- Animated over time (permute seed each frame)
- Adds tactile realism, reduces digital appearance

---

## Star Rendering (Main Sequence)

### O-Type Star

**Base Specifications**
- Color (hexadecimal): #0080FF
- Color (RGB): (0, 128, 255) — vivid blue
- Surface temperature: 30,000 - 50,000 K
- Radius scale: 10 - 20 solar radii
- Mass: 15 - 90 solar masses

**Corona/Atmosphere Shader (GLSL Fragment)**

```glsl
#version 300 es
precision highp float;

uniform float time;
uniform vec3 starCenter;
uniform float starRadius;
uniform sampler2D perlinTexture;
uniform sampler2D worleyTexture;

varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  vec3 dir = normalize(vPosition - starCenter);
  float dist = length(vPosition - starCenter);
  float surfDist = dist - starRadius;
  
  // Corona falloff: e^(-surfDist / coronaWidth)
  float coronaIntensity = exp(-surfDist / (starRadius * 0.3)) * 0.8;
  
  // Perlin noise for turbulence
  vec3 noiseCoord = vPosition * 0.01 + vec3(time * 0.05);
  float noise = texture(perlinTexture, noiseCoord.xy).r;
  
  // Worley noise for cellular structure
  float worley = texture(worleyTexture, noiseCoord.xy * 2.0).r;
  
  // Combine for corona structure
  float coronaNoise = mix(noise, worley, 0.6) * 0.5 + 0.5;
  coronaIntensity *= coronaNoise;
  
  // Temperature gradient: hottest (white) at core
  vec3 color = vec3(0.0, 0.5, 1.0); // Base blue
  if (coronaIntensity > 0.5) {
    color = mix(color, vec3(1.0, 1.0, 1.0), coronaIntensity - 0.5);
  }
  
  gl_FragColor = vec4(color, coronaIntensity);
}
```

**Surface Texture**
- Procedural granulation using Voronoi cells (convection cells)
- Cell size: 2-5% of star radius
- Brightness variation: ±10% around base color
- Sunspot density: 0.5% of surface area
- Spot color: darker, more saturated blue (#004488)
- Faculae (bright regions): +20% brightness, smaller, more frequent than spots
- Limb darkening: `intensity = baseIntensity * (1.0 - 0.6 * (1.0 - cos(angle)))`

**Animation Parameters**
- Surface convection: cells rotate/shift with period 2-5 hours
- Spot emergence/decay: 7-10 day lifetime
- Rotation period: 20-50 days at equator
- Pulsation (if β Cephei variable): ±2% radius oscillation, 3-6 hour period

**Bloom Settings**
- Intensity: 2.5
- Radius: 12
- Color falloff: maintain blue hue in glow

**Size Scaling**
- `radiusInUnits = log10(solarRadii) * 0.5`
- Range at LOD0: 0.1 - 1.0 units

---

### B-Type Star

**Base Specifications**
- Color (hex): #0099FF
- Color (RGB): (0, 153, 255) — bright blue
- Surface temperature: 10,000 - 30,000 K
- Radius scale: 3 - 10 solar radii
- Mass: 2.1 - 16 solar masses

**Corona/Atmosphere Shader**
- Corona width: 0.4 × starRadius (slightly wider than O-type)
- Perlin noise octaves: 4 (more detail)
- Worley cell size: 3-6% of radius
- Temperature gradient: white core fading to blue edges
- Color mix transition at coronaIntensity > 0.4

**Surface Texture**
- Granulation period: 4-8 hours (slower than O-type)
- Sunspot density: 0.3%
- Faculae density: 0.7%
- Spot color: #003366 (darker blue)
- Limb darkening coefficient: 0.5

**Animation Parameters**
- Surface rotation: 50-100 days
- Spot lifetime: 10-15 days
- Pulsation (if β Cephei): ±1.5% radius, 6-8 hour period
- Stellar wind animation (particle system): thin ionized gas escaping at equator, visible only at LOD0

**Bloom Settings**
- Intensity: 2.2
- Radius: 10
- Falloff curve: quadratic

**Size Scaling**
- `radiusInUnits = log10(solarRadii) * 0.45`

---

### A-Type Star

**Base Specifications**
- Color (hex): #00CCFF
- Color (RGB): (0, 204, 255) — cyan-blue
- Surface temperature: 7,500 - 10,000 K
- Radius scale: 1.4 - 2.1 solar radii
- Mass: 1.04 - 2.1 solar masses

**Corona/Atmosphere Shader**
- Corona width: 0.35 × starRadius
- Perlin noise octaves: 3
- Worley detail: 4-7% of radius
- Base color: cyan with white core
- Corona: mostly transparent, subtle texture

**Surface Texture**
- Granulation: less prominent than B-type
- Period: 6-12 hours
- Sunspot density: 0.15% (very rare)
- Faculae: 0.4%
- Limb darkening: 0.45

**Animation Parameters**
- Rotation: 100-150 days (slow rotator)
- Spot lifetime: 15-20 days (longer-lived, fewer total)
- No strong pulsation for normal A-type
- Stellar wind: very weak, barely visible

**Bloom Settings**
- Intensity: 1.9
- Radius: 8
- Color: maintain cyan hue

**Size Scaling**
- `radiusInUnits = log10(solarRadii) * 0.40`

---

### F-Type Star

**Base Specifications**
- Color (hex): #FFFFCC
- Color (RGB): (255, 255, 204) — pale yellow
- Surface temperature: 6,000 - 7,500 K
- Radius scale: 1.04 - 1.4 solar radii
- Mass: 1.04 - 1.4 solar masses

**Corona/Atmosphere Shader**
- Corona width: 0.3 × starRadius
- Perlin noise octaves: 3
- Worley scale: 5-8% of radius
- Base color: yellow with white core
- Corona gradient: yellow → white → pale yellow halo

**Surface Texture**
- Granulation: visible but subtle
- Period: 8-14 hours
- Sunspot density: 0.1%
- Faculae: 0.3%
- Limb darkening: 0.40

**Animation Parameters**
- Rotation: 150-300 days
- Spot lifetime: 20-30 days
- No pulsation
- Stellar wind: negligible

**Bloom Settings**
- Intensity: 1.6
- Radius: 7
- Color: soft yellow

**Size Scaling**
- `radiusInUnits = log10(solarRadii) * 0.38`

---

### G-Type Star (Sun-like)

**Base Specifications**
- Color (hex): #FFFF99
- Color (RGB): (255, 255, 153) — yellow
- Surface temperature: 5,200 - 6,000 K
- Radius scale: 0.96 - 1.04 solar radii
- Mass: 0.8 - 1.04 solar masses
- **Reference**: Our Sun

**Corona/Atmosphere Shader**
- Corona width: 0.25 × starRadius (tight, concentrated)
- Perlin noise octaves: 3
- Worley scale: 6-9% of radius
- Base color: warm yellow
- Core white, fading to yellow halo
- Slight orange tint at deepest convection zones

**Surface Texture (Critical Detail)**
- Granulation cells: 700-900 km typical size on Sun
  - Procedural generation using Voronoi + noise
  - Bright center (+15% brightness), dark edges (-10%)
  - Cell lifetime: 10-20 minutes (animated)
  - Entire pattern refreshes every 20 minutes
- Sunspots:
  - Density: 0.2% of surface area (11-year cycle variation)
  - Spot color: #996600 (very dark, reddish)
  - Umbra (core): -50% brightness
  - Penumbra (edge): -25% brightness
  - Spot size range: 1,000 - 200,000 km
  - Lifetime: days to months
  - Emergence pattern: butterfly diagram (move toward equator over cycle)
- Faculae:
  - Associated with sunspot decay
  - Brightness: +20%
  - Lifetime: weeks to months
  - Color: slightly whiter than base
- Limb darkening: `intensity = base * (1.0 - 0.6 * (1.0 - cos(latAngle)))`

**Animation Parameters**
- Rotation period: 25.4 days at equator, 35 days at poles
- Differential rotation shader: `rotationSpeed = 14.18 - 2.7 * sin²(latitude)` degrees/day
- Granulation animation: cells evolve and disappear over 20-minute simulated time
- Spot animations:
  - Emergence: 0-2 weeks to reach full size
  - Decay: 0.3-1 week to disappear
  - Internal structure: penumbra pattern slowly evolves
  - Magnetic loops visible as thin arcs between spots (particle system)
- 11-year solar cycle: spot number varies from 0 to ~200
  - Simulated as: `spotDensity = 0.002 * (1.0 + sin(time / 11.0 years))`

**Bloom Settings**
- Intensity: 1.4
- Radius: 6
- Color: warm yellow

**Size Scaling**
- `radiusInUnits = 0.45` (reference scale, 1 solar radius = 0.45 units)

---

### K-Type Star

**Base Specifications**
- Color (hex): #FFCC99
- Color (RGB): (255, 204, 153) — orange-yellow
- Surface temperature: 3,700 - 5,200 K
- Radius scale: 0.7 - 0.96 solar radii
- Mass: 0.45 - 0.8 solar masses

**Corona/Atmosphere Shader**
- Corona width: 0.22 × starRadius
- Perlin noise octaves: 2
- Worley scale: 7-10% of radius
- Base color: warm orange
- Halo: orange-red, extending smoothly

**Surface Texture**
- Granulation: less visible than G-type
- Period: 10-18 hours
- Sunspot density: 0.15%
- Faculae: 0.2%
- Spot color: #663300
- Limb darkening: 0.35

**Animation Parameters**
- Rotation: 25-40 days
- Spot lifetime: 25-35 days
- Possible long-term activity cycles (22-year analogs)
- Stellar wind: minimal

**Bloom Settings**
- Intensity: 1.2
- Radius: 5
- Color: orange

**Size Scaling**
- `radiusInUnits = log10(solarRadii) * 0.35`

---

### M-Type Star

**Base Specifications**
- Color (hex): #FF9966
- Color (RGB): (255, 150, 102) — deep orange
- Surface temperature: 2,400 - 3,700 K
- Radius scale: 0.1 - 0.7 solar radii
- Mass: 0.08 - 0.45 solar masses
- **Note**: M-dwarfs are dim; bloom visibility depends on distance

**Corona/Atmosphere Shader**
- Corona width: 0.2 × starRadius
- Perlin noise octaves: 2
- Worley scale: 8-12% of radius
- Base color: deep orange
- Halo: reddish, very subtle (M-dwarfs have weaker chromospheres)

**Surface Texture**
- Granulation: barely visible
- Period: 12-24 hours
- Sunspot density: 0.1% (modest but persistent)
- Faculae: 0.15%
- Spot color: #553300
- Limb darkening: 0.30

**Animation Parameters**
- Rotation: 30-100 days (highly variable)
- Spot lifetime: 30-60 days (long-lived)
- Frequent starflare events (superflares):
  - Random bright flashes across surface
  - Frequency: 0.5 - 10 per day depending on activity level
  - Duration: 10 - 100 seconds
  - Intensity: up to 10x normal brightness in local region
  - Color: white hotspot briefly appearing
  - Particle effect: X-ray burst (blue glow at poles)
- Chromospheric emission: H-alpha glow visible at edges

**Bloom Settings**
- Intensity: 1.0 (dim star, bloom still noticeable)
- Radius: 4
- Color: maintain orange

**Size Scaling**
- `radiusInUnits = log10(solarRadii) * 0.30`
- Smallest M-dwarfs at LOD4 appear as small orange dots

---

## Stellar Evolution Classes

### Red Giant (RGB - Red Giant Branch)

**General Specifications**
- Radius: 10 - 100 solar radii (bloated, luminous)
- Color: orange-red (#FF6633 to #FF3333)
- Surface temperature: 3,500 - 5,500 K
- Luminosity: 100 - 10,000 times the Sun

**Envelope Shader (Semi-Transparent Outer Layer)**

The red giant's envelope is partially transparent, showing convection beneath:

```glsl
#version 300 es
precision highp float;

uniform float time;
uniform vec3 starCenter;
uniform float starRadius;
uniform sampler2D noiseTexture;

varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  vec3 dir = normalize(vPosition - starCenter);
  float dist = length(vPosition - starCenter);
  
  // Core surface (inner 80%)
  float coreAlpha = 1.0; // Solid
  
  // Envelope (outer 20%)
  float envelopeWidth = starRadius * 0.2;
  float envelopeStart = starRadius * 0.8;
  
  if (dist > envelopeStart) {
    float envProgress = (dist - envelopeStart) / envelopeWidth;
    
    // Noise-based transparency
    vec3 noiseCoord = vPosition * 0.01 + vec3(time * 0.02);
    float noise = texture(noiseTexture, noiseCoord.xy).r;
    
    float alpha = max(0.0, 1.0 - envProgress * envProgress);
    alpha *= noise * 0.6 + 0.4;
    coreAlpha = mix(coreAlpha, 0.0, alpha);
  }
  
  // Color gradient: cooler at surface
  vec3 color = mix(vec3(1.0, 0.6, 0.3), vec3(1.0, 0.4, 0.2), 1.0 - dist / (starRadius * 1.2));
  
  gl_FragColor = vec4(color, coreAlpha);
}
```

**Pulsation Animation**

Red giants are long-period variables:

- Pulsation type: Mira-type (for AGB red giants) or semi-regular
- Period: 100 - 800 days (simulated by `sin(time / period)`)
- Amplitude: ±15% radius change
- Brightness oscillation: ±0.5 magnitude
- Shader update each frame:
  ```glsl
  float pulseFactor = 1.0 + 0.15 * sin(2.0 * 3.14159 * time / 300.0); // 300-day period
  vec3 pulsedPos = starCenter + (vPosition - starCenter) * pulseFactor;
  float distToPulse = length(vPosition - pulsedPos);
  ```

**Convection Cell Animation**

Large-scale convection dominates:

- Cell size: 10-20% of star radius
- Cells slowly rotate and merge
- Bright cells (+20% brightness) rise from interior
- Dark cells (-20%) sink back down
- Animation period: 24-72 hours (slow)
- Particle system: convective updrafts visible as rising bright plumes
- Frequency: 3-5 plumes visible at any time
- Lifetime per plume: 6-12 hours

**Dusty Envelope Particle System**

Circumstellar dust disk:

- Particles: 10,000 - 100,000 dust grains
- Layout: thin toroidal disk around equator
- Opacity: decreases with distance (dust density falloff)
- Color: reddish-brown (#663333)
- Animation: slow drift around star (orbital speed ≈ 10 km/s)
- Visibility: prominent at LOD0-1, fades at LOD2+
- Optional: dust comet-like tail if stellar wind is strong

**Surface Texture (Simplified)**
- Granulation: visible at LOD0, subtle
- Spots: rare (M-giants may show spots)
- Limb darkening: 0.4

**Bloom Settings**
- Intensity: 1.2 (high luminosity but red light less visible)
- Radius: 15 (larger star, broader glow)

**Size Scaling**
- `radiusInUnits = log10(solarRadii) * 0.6`
- Typical red giant: 0.9 - 1.5 units

---

### Red Supergiant

**General Specifications**
- Radius: 100 - 1000+ solar radii (immense)
- Color: deep red (#CC3333 to #990000)
- Surface temperature: 3,000 - 4,500 K
- Luminosity: 100,000 - 1,000,000 solar luminosities
- Example: Betelgeuse, Antares, VY Canis Majoris

**Visual Characteristics**

Red supergiants are among the largest known stars. At LOD0, they fill a significant portion of the viewport.

**Envelope Shader**

Much thicker and more opaque than red giants:

- Opacity gradient: fully opaque core, semi-transparent edges
- Convection cells: enormous, visible as 5-10% of star radius
- Cell boundaries: dark lanes between cells
- Temperature variation: hottest (brightest) at center, cooler at edges
- Color gradient: deep red core fading to orange halo

**Pulsation Animation**

Even more dramatic than red giants:

- Period: 200 - 2000+ days
- Amplitude: ±25% radius change
- Brightness oscillation: ±1.0 magnitude
- Shader implementation: scale all vertices by pulseFactor per frame
- Effect: star visibly swells and shrinks

**Convection Animation**

Extremely large convective cells:

- Cell size: 20-40% of star radius
- Number of visible cells: 6-12 at any time
- Rise/sink speed: slow, majestic movement
- Bright plumes: +30% brightness
- Dark sinking regions: -30% brightness
- Lifetime: 24-48 hours per cell
- Particle effect: vigorous updrafts with dust/gas ejection

**Dusty Envelope (Prominent)**

- Much denser than red giants
- Particle count: 500,000 - 2,000,000
- Dust color: varying from red (#990000) to brown (#663333)
- Extent: reaches 5-10% beyond stellar surface
- Opacity variation: patchy, with denser clumps
- Animation: dust slowly drifts outward and dissipates
- Temperature-based emission: dust IR-glowing (faint red tint)
- Wind speed: 10-50 km/s (noticeable particle drift)

**Mass Loss Visualization**

Stellar wind material:

- Particle system: thin streams of gas leaving surface
- Origin: random locations on surface
- Direction: radially outward (slight rotation)
- Speed: 5-20 km/s (slower than O-star winds)
- Color: orange-red, fading to transparent
- Opacity curve: exponential falloff with distance
- Extent: visible up to 10-20 stellar radii
- Density: sparse, but visible against starfield

**Limb Darkening**
- Coefficient: 0.5 (moderate)
- Effect: edges appear slightly darker/cooler

**Bloom Settings**
- Intensity: 1.5 (very luminous)
- Radius: 25 (massive star, huge glow)
- Color: deep red

**Size Scaling**
- `radiusInUnits = log10(solarRadii) * 0.7`
- Typical red supergiant: 1.4 - 3.0 units (fills screen at LOD1)

---

### White Dwarf

**General Specifications**
- Radius: 0.008 - 0.02 solar radii (Earth-sized, massive)
- Color: white (#FFFFFF) to blue-white (#CCDDFF)
- Surface temperature: 8,000 - 200,000 K
- Luminosity: 0.001 - 1.0 solar luminosities
- Density: 1 million times that of the Sun
- Mass: 0.5 - 1.4 solar masses (Chandrasekhar limit)

**Appearance**

White dwarfs are incredibly dense, compact remnants:

- Very small, intensely bright points of light
- Despite small radius, high luminosity due to extreme temperature
- Color depends on age: hot young WD is blue, older WD is white to red

**Core Shader (Temperature-Based)**

```glsl
#version 300 es
precision highp float;

uniform float temperature; // 8000 to 200000 K
uniform float age; // 0.0 to 10.0 (billions of years)

varying vec3 vPosition;

void main() {
  // Temperature to color mapping
  vec3 color;
  if (temperature > 100000.0) {
    // Ultra-hot: blue-white
    color = vec3(0.8, 0.9, 1.0);
  } else if (temperature > 50000.0) {
    // Hot: bright white
    color = vec3(1.0, 1.0, 0.95);
  } else if (temperature > 20000.0) {
    // Warm: white
    color = vec3(1.0, 0.98, 0.95);
  } else if (temperature > 10000.0) {
    // Cooling: yellow-white
    color = mix(vec3(1.0, 0.98, 0.95), vec3(1.0, 0.9, 0.7), (50000.0 - temperature) / 40000.0);
  } else {
    // Old: yellow to red
    color = mix(vec3(1.0, 0.7, 0.3), vec3(1.0, 0.3, 0.1), age / 10.0);
  }
  
  // Age-based dimming: WD cools over time
  float brightnessDecay = 1.0 / (1.0 + age * 0.1);
  
  gl_FragColor = vec4(color * brightnessDecay, 1.0);
}
```

**Surface Texture (Simplified)**

White dwarfs are too small to show significant surface features at most LODs:

- LOD0 only: faint crystalline facets visible
  - Procedural: diamond-like sparkle pattern
  - Animated: very subtle twinkling (±2% brightness)
  - Pattern: hexagonal or cubic lattice
- Higher LODs: smooth, featureless sphere

**Gravitational Reddening**

Near white dwarfs, Einstein gravitational redshift affects observed light:

- Effect: light escaping strong gravity is shifted to redder wavelengths
- Shader: color shift toward red at the limb
- Amount: `redshiftFactor = 1.0 + 0.3 * (1.0 - cos(angle))`
- Visible at LOD0-1 only

**Accretion Disk (if Binary Companion)**

If white dwarf has a companion star:

- Disk shader: spiral pattern with temperature gradient
- Color gradient (from surface outward):
  - Inner (0-0.1 disk radius): blue (#0099FF) — hottest (10,000 - 50,000 K)
  - Middle (0.1-0.5): white (#FFFFFF) — moderate (5,000 - 10,000 K)
  - Outer (0.5-1.0): yellow-orange (#FFCC00) — coolest (3,000 - 5,000 K)
- Density profile: Gaussian, peak at 0.3 radius
- Animation: disk rotates rapidly (period 1-5 minutes)
  - Disk rotation speed determined by: `period = sqrt(r³ / GM)` (Keplerian)
  - Doppler beaming: approaching side brighter/bluer, receding side dimmer/redder
  - Shader implementation:
    ```glsl
    float diskSpeed = sqrt(1.0 / pow(r, 3.0)); // Normalized
    float phase = mod(time * diskSpeed, 1.0);
    float doppler = (velocity / c) * 0.1; // Subtle effect
    color = mix(color, vec3(0.8, 1.0, 1.0), doppler); // Shift blue with velocity
    ```

**Bloom Settings**
- Intensity: 2.0 (white dwarf is bright despite small size)
- Radius: 4 (small star, concentrated glow)
- Color: white or blue-white

**Size Scaling**
- `radiusInUnits = 0.02` (typically smaller than planets at LOD0)
- May be obscured by larger companion star in binary systems

---

### Neutron Star / Pulsar

**General Specifications**
- Radius: 10 - 20 km (golf-ball sized, Earth-mass)
- Color: white (#FFFFFF) to blue-white
- Surface temperature: 600,000 - 6,000,000 K
- Density: 100 billion times denser than lead
- Mass: 1.4 - 2.0 solar masses
- Rotation: milliseconds to seconds per revolution
- Magnetic field: 10^12 - 10^15 Gauss (quintillion times Earth's)

**Appearance at Different Scales**

- LOD0-1: visible as intense point source with rotating beam
- LOD2-3: point light with visible beam sweeping across space
- LOD4: blinking point (if pulsar visible in optical)

**Core Shader (Temperature Dominated)**

Neutron star surface is incredibly hot:

```glsl
#version 300 es
precision highp float;

uniform float temperature;
uniform float magneticField; // Log scale, 12 to 15

varying vec3 vPosition;

void main() {
  // Hot surface: white with slight blue tint from temperature
  vec3 color = vec3(1.0, 0.98, 1.0); // Very white
  
  // Magnetic field effects: dark spots along magnetic poles
  float poles = abs(sin(acos(vPosition.y / length(vPosition))));
  poles = pow(poles, 0.1); // Concentration near poles
  
  float magneticEffect = 0.3 * (1.0 - poles); // Dark spots at poles
  color *= (1.0 - magneticEffect);
  
  gl_FragColor = vec4(color, 1.0);
}
```

**Rotating Beam Shader (Pulsar Wind)**

The pulsar's rotating magnetic field beams out energy:

```glsl
#version 300 es
precision highp float;

uniform float time;
uniform float pulseFrequency; // 0.001 to 1000 Hz
uniform vec3 beamAxis; // Rotation axis
uniform float beamOpeningAngle; // ~10-20 degrees

varying vec3 vDirection; // Ray direction from star center

void main() {
  // Current beam rotation angle
  float angle = mod(time * 2.0 * 3.14159 * pulseFrequency, 6.28318);
  
  // Check if this direction is within the beam cone
  float cosBeam = cos(beamOpeningAngle * 0.5 * 3.14159 / 180.0);
  float beamDot = dot(normalize(vDirection), beamAxis);
  
  // Account for 180-degree rotation (two beams)
  float beamRotated = mod(angle + atan(vDirection.y, vDirection.x), 3.14159);
  float beamIntensity = smoothstep(cosBeam, cosBeam + 0.05, abs(cos(beamRotated)));
  
  // Beam color: intense white-blue
  vec3 beamColor = vec3(0.9, 1.0, 1.0) * beamIntensity;
  
  gl_FragColor = vec4(beamColor, beamIntensity);
}
```

**Magnetic Field Line Visualization**

Invisible magnetic field made visible as particle system:

- Particle type: magnetic field lines
- Count: 50-100 field lines
- Origin: distributed across star surface
- Path: follow dipole field geometry
  - North/south poles separated by 180°
  - Field lines arc from north to south
  - Density: closer near equator
- Particle lifetime: infinite (static field)
- Color: subtle blue (#4169E1) glow
- Brightness: low (background), spikes when aligned with beam
- Length: 3-5 stellar radii
- Animation: none (magnetic field doesn't change)
- Visible only at LOD0-1

**X-Ray Hotspot**

Accretion-powered neutron star (if in binary):

- Two hotspots at magnetic poles (where matter accretes)
- Size: ~1-5 km across
- Color: intense white (#FFFFFF)
- Temperature: 10,000,000+ K (hypothetical, not true surface)
- Emission: primarily X-ray, not visible but affects bloom
- Particle effect: thin streams of accreting material feeding into poles
- Animation: material rapidly falls in, heating spots
- Visible only if companion star present

**Pulsar Wind Nebula (PWN)**

The rapidly rotating pulsar creates a wind:

- Nebula type: synchrotron emission from relativistic particles
- Geometry: expanding ellipsoid (widens behind pulsar if moving)
- Size: ~1-10 light-years (at LOD1-2, visible as extended glow)
- Color: blue-white (#AAAAFF) from synchrotron
- Density: decreases with distance from pulsar
- Animation:
  - Expansion: nebula slowly expands (expansion speed ≈ 1000s km/s)
  - Shader updates vertex positions: `newPos = pos * (1.0 + time / nebulaeAge)`
  - Internal structure: turbulent filaments visible
  - Filamentation animation: Perlin noise driven turbulent motion

**Crab Pulsar Example**

If rendering Crab Pulsar specifically:

- Rotation period: 33.5 ms
- Beam frequency: 29.9 Hz (same as rotation)
- Nebula size: 11' × 7' (parsec scale)
- Nebula color: distinctive blue filaments + red synchrotron haze
- Internal dynamics: visible jets (symmetrical north-south)
- Age: 962 years (young, active PWN)

**Bloom Settings**
- Intensity: 2.5 (incredibly bright despite small size)
- Radius: 6 (concentrated, hot glow)
- Color: white

**Size Scaling**
- `radiusInUnits = 0.005` (essentially invisible at most scales, pure point light)
- Visible only when zoomed to LOD0

---

### Black Hole

**General Specifications**
- Event horizon radius: 3 - 100+ km (depends on mass: 1.4 - 1,000,000 solar masses)
- Color: pure black (absorbs all light)
- Observed appearance: black disk with glowing surroundings
- Distinguished by: accretion disk, jets, lensing effects, shadows

**Event Horizon (Schwarzschild Sphere)**

The true event horizon is rendered as a perfect black sphere:

- Geometry: icosphere with 8+ subdivisions (smooth sphere)
- Material: emissive black (#000000)
- Shader override: all fragments output `vec4(0.0, 0.0, 0.0, 1.0)`
- No lighting, no reflection, no texture
- Size: `radiusInUnits = log10(mass) * 0.1` (larger BH = bigger event horizon)

**Gravitational Lensing Shader**

The space around a black hole bends light according to general relativity. This is the primary visual effect:

```glsl
#version 300 es
precision highp float

uniform sampler2D starfield; // Background star texture
uniform vec3 bhCenter;
uniform float bhMass; // In solar masses
uniform float bhRadius; // Event horizon radius

varying vec2 vUv;

void main() {
  // Convert screen position to 3D ray direction
  vec3 rayDir = normalize(vec3(vUv - 0.5, 1.0)); // Simple perspective
  vec3 rayOrigin = vec3(0.0, 0.0, -10.0); // Observer position
  
  // Schwarzschild metric ray bending
  // Simplified: deflection angle ~ 2 * bhRadius / impactParameter
  float impactParam = length(cross(rayDir, normalize(bhCenter - rayOrigin)));
  float deflectionAngle = 2.0 * bhRadius / max(impactParam, bhRadius * 0.5);
  
  // Bend ray
  vec3 bendAxis = normalize(cross(rayDir, vec3(0.0, 1.0, 0.0)));
  float cosDeflect = cos(deflectionAngle);
  float sinDeflect = sin(deflectionAngle);
  mat3 bendMatrix = mat3(
    cosDeflect + bendAxis.x * bendAxis.x * (1.0 - cosDeflect),
    bendAxis.x * bendAxis.y * (1.0 - cosDeflect) - bendAxis.z * sinDeflect,
    bendAxis.x * bendAxis.z * (1.0 - cosDeflect) + bendAxis.y * sinDeflect,
    // ... (complete rotation matrix)
  );
  vec3 bentDir = bendMatrix * rayDir;
  
  // Sample starfield with bent direction
  vec2 sampleUv = bentDir.xy * 0.5 + 0.5;
  vec3 color = texture(starfield, sampleUv).rgb;
  
  // Check if ray crosses event horizon
  float distToBH = length(rayOrigin + rayDir * 100.0 - bhCenter);
  if (distToBH < bhRadius) {
    color = vec3(0.0); // Black hole
  }
  
  gl_FragColor = vec4(color, 1.0);
}
```

**Einstein Ring**

The photon sphere (closest orbit around BH) creates a distinctive visual feature:

- Radius: 1.5 × Schwarzschild radius
- Appearance: bright ring of light surrounding BH shadow
- Mechanism: light is bent around BH and appears concentrated
- Shader: render an bright emissive ring geometry
- Animation: none (ring is static)
- Color: white with blue tint (#CCDDFF)
- Visibility: prominent at all LODs (dramatic visual feature)

**Accretion Disk**

Matter spiraling into black hole glows intensely:

```glsl
#version 300 es
precision highp float

uniform float time;
uniform float diskInnerRadius;
uniform float diskOuterRadius;

varying vec3 vPosition;

void main() {
  // Distance from BH center in disk plane
  float r = length(vPosition.xy);
  
  if (r < diskInnerRadius || r > diskOuterRadius) discard;
  
  // Temperature gradient (inner = hotter)
  // T(r) ~ 1 / sqrt(r) for thin disk
  float temp = 1.0 / sqrt(r / diskInnerRadius);
  
  // Temperature to color mapping
  vec3 color;
  if (temp > 0.8) {
    // Very hot: blue
    color = mix(vec3(0.5, 0.8, 1.0), vec3(0.8, 1.0, 1.0), (temp - 0.8) / 0.2);
  } else if (temp > 0.5) {
    // Hot: white
    color = mix(vec3(1.0, 0.7, 0.3), vec3(1.0, 1.0, 1.0), (temp - 0.5) / 0.3);
  } else if (temp > 0.2) {
    // Warm: yellow-orange
    color = mix(vec3(1.0, 0.3, 0.0), vec3(1.0, 0.7, 0.3), (temp - 0.2) / 0.3);
  } else {
    // Cool: red
    color = vec3(1.0, 0.1, 0.0);
  }
  
  // Doppler beaming: approaching side brighter, receding dimmer
  float vAzimuth = atan(vPosition.y, vPosition.x);
  float vRotation = mod(time * sqrt(1.0 / pow(r, 3.0)), 6.28318);
  float doppler = 1.0 + 0.3 * cos(vAzimuth - vRotation); // Approaching: +30%, Receding: -30%
  
  color *= doppler;
  
  // Disk opacity/density falls off with radius
  float opacity = 1.0 / (1.0 + pow((r - diskInnerRadius) / (diskOuterRadius - diskInnerRadius), 2.0));
  
  gl_FragColor = vec4(color, opacity);
}
```

**Photon Sphere Glow**

The region where light orbits the black hole:

- Rendered as: emissive ring (thin toroid)
- Radius: 1.5 × Schwarzschild radius
- Color: bright white-blue (#DDEEFF)
- Brightness: very high (concentrated light)
- Shader: simple emissive material, no texture

**Relativistic Jets**

Bipolar jets are ejected perpendicular to accretion disk:

```glsl
#version 300 es
precision highp float

uniform float time;
uniform vec3 jetAxis; // North pole direction
uniform float bhRadius;

varying vec3 vPosition;

void main() {
  // Distance from jet axis
  float distFromAxis = length(cross(vPosition, jetAxis));
  float distAlongAxis = dot(vPosition, jetAxis);
  
  // Jet is collimated cone
  float jetOpeningAngle = 0.1; // Radians, ~5.7 degrees
  float jetWidth = distAlongAxis * tan(jetOpeningAngle);
  
  // Inside jet cone?
  if (distFromAxis > jetWidth) discard;
  
  // Jet color: synchrotron blue (relativistic electrons)
  vec3 color = vec3(0.4, 0.7, 1.0);
  
  // Brightness decreases with distance from BH
  float brightness = 1.0 / (1.0 + distAlongAxis / (bhRadius * 100.0));
  
  // Internal structure: turbulent knots
  float knots = sin(distAlongAxis * 0.1 + time * 0.5) * cos(atan(vPosition.y, vPosition.x) * 3.0);
  knots = smoothstep(0.3, 0.7, knots);
  
  color *= mix(brightness, brightness * knots, 0.6);
  
  gl_FragColor = vec4(color, brightness);
}
```

**Frame Dragging Distortion**

Rotating black holes (Kerr metric) drag spacetime, causing nearby objects to precess:

- Effect: nearby stars and dust appear to swirl around BH
- Shader: apply a rotation to object positions based on proximity to BH
- Magnitude: small (a few degrees), only noticeable at LOD0
- Animation: smooth precession, period depends on distance
- Example: dust particles orbit at rates slightly offset from Keplerian

**Hawking Radiation (Primordial BH)**

Primordial black holes are small and actively evaporate:

- Visible effect: subtle blue glow from evaporation (not physically accurate, artistic)
- Particle system: tiny particles escaping from event horizon
- Lifetime: particles disappear after traveling 1-2 light-seconds
- Color: pale blue (#CCDDFF)
- Intensity: very faint (barely visible, mostly symbolic)
- Only visible at LOD0

**Bloom Settings**
- Intensity: 3.0 (accretion disk and jets are extremely bright)
- Radius: 10 (large glowing region around compact core)
- Color: blue (jets dominate visual appearance)

**Size Scaling**
- Event horizon: `radiusInUnits = log10(massSolarMasses) * 0.1`
- Accretion disk extends 10-100× event horizon
- Jets extend 1000×+ event horizon (limited by LOD)

---

### Wolf-Rayet Star

**General Specifications**
- Radius: 1-2 solar radii (small, dense)
- Color: intense blue-white (#0080FF)
- Surface temperature: 25,000 - 210,000 K
- Luminosity: 100,000 - 10,000,000 times the Sun
- Mass: 8-60+ solar masses
- Distinctive feature: expanding nebular shell from massive stellar wind

**Core Shader**

Extremely hot, blue-white core:

- Base color: #0080FF (vivid blue)
- Surface temperature: 50,000-200,000 K
- Corona: intense, extending 0.3× stellar radius
- Limb darkening: severe (0.6+)

**Expanding Nebular Shell**

Particles representing ejected material:

- Particle system: 50,000 - 500,000 particles
- Initial velocity field: radially outward at wind speed (1000+ km/s)
- Color gradient with velocity:
  - Fast (inner): blue (#0080FF)
  - Medium: white (#FFFFFF)
  - Slow (outer): orange (#FF8800)
- Shell structure: multiple shells visible (ejection episodes)
- Opacity: decreases with distance
- Animation: particles stream outward continuously
- New particles spawn from surface each frame
- Lifetime: particles fade after traveling 5-10 stellar radii

**Stellar Wind Visualization**

Continuous mass loss:

- Wind speed: 1500-5000 km/s
- Mass loss rate: 10^-6 to 10^-4 solar masses/year
- Particle emitter: distributed over entire stellar surface
- Particle color: blue tinted (ionized, contains trace elements)
- Density: sparse but visible against starfield
- Animation: smooth, continuous outflow

**Nebular Ring Structure**

If Wolf-Rayet is in a binary:

- Previous wind ejected before mass transfer
- Rendered as: glowing ring of ejected material (shell)
- Color: blue-white
- Radius: 0.5 - 2.0 light-years (visible at LOD2-3)
- Expansion: slow, over hundreds of years
- Shape: spherical or elliptical (depending on binary orientation)

**Bloom Settings**
- Intensity: 2.8 (extremely bright)
- Radius: 12 (large extended glow)
- Color: blue

**Size Scaling**
- `radiusInUnits = 0.5` (small, dense)
- Wind extends far beyond star itself at lower LODs

---

## Stellar Systems

### Binary/Multiple Star Systems

**Roche Lobe Visualization**

When stars orbit closely, gravity distorts them. The Roche lobe is the critical surface:

- Geometry: figure-8 shaped surface (8-point Bézier mesh)
- Color: semi-transparent blue (#0080FF)
- Opacity: 0.2-0.3 (barely visible)
- Edges: glowing outline (#0099FF)
- Only visible at LOD0-1, and only when zoom level < 5 AU

**Mass Transfer Stream**

Material flowing from one star to another:

- Particle system: 10,000 - 50,000 particles
- Origin: Lagrange point L1 (between stars)
- Path: curving trajectory under both stars' gravity
- Destination: landing on companion star surface
- Color: white-blue (#DDEEFF), matching hot transferred material
- Animation: continuous stream, particles flow along ballistic trajectory
  ```glsl
  // Trajectory under two-body gravity
  vec3 pos = L1Position + time * velocity;
  vec3 acc = -star1Pos / pow(distance(pos, star1Pos), 3.0) - star2Pos / pow(distance(pos, star2Pos), 3.0);
  pos += acc * time * time * 0.5;
  ```

**Accretion Disk on Companion**

If primary (e.g., white dwarf) accretes from secondary:

- Disk shader: similar to black hole accretion disk
- Temperature gradient: 2000 K to 10,000 K (outer to inner)
- Color gradient: red → yellow → white → blue
- Size: typically 0.01 - 0.1 AU radius
- Rotation: Keplerian, period 1-10 minutes
- Animation: disk rotates, density waves visible (spiral structure)
- Doppler beaming: approaching side brighter/bluer

**Eclipse Animation**

If binary plane is aligned with observer:

- Detection: calculate line of sight to each star
- When occulted: star brightness drops
  - For primary eclipse: `brightness = 1.0 - (shadowArea / starArea)`
  - For secondary eclipse: smaller effect if secondary is smaller
- Duration: calculated from orbital geometry and star sizes
- Shader implementation: discard fragments if behind companion
- Optional visual effect: Doppler shifts wavelengths (reddening/blueing)

**Orbital Mechanics Animation**

Stars orbit their common center of mass:

- Kepler's third law: `P² = a³ / (m1 + m2)`
- Position calculation per frame:
  ```glsl
  float phase = mod(time * 2.0 * 3.14159 / period, 6.28318);
  vec3 pos1 = centerOfMass + mass2 / (mass1 + mass2) * separation * vec3(cos(phase), 0.0, sin(phase));
  vec3 pos2 = centerOfMass - mass1 / (mass1 + mass2) * separation * vec3(cos(phase), 0.0, sin(phase));
  ```
- Rotation vector (spin axis precession) if relativistic effects significant
- Display: orbital ellipse as faint wireframe (optional, debug mode)

---

## Rocky Planets

### Mercury-Type World

**General Specifications**
- Radius: 0.38 - 0.5 Earth radii
- Density: 5.4 - 5.5 g/cm³
- Surface temperature: 430 K (day) to 180 K (night)
- Atmosphere: essentially none (exosphere of sodium)
- Color: gray to brownish-gray
- Notable features: cratered, dark plains (basalt), light highlands

**Surface Texture (Detailed)**

Mercury's surface is heavily cratered with large impact basins:

```glsl
#version 300 es
precision highp float

uniform sampler2D craterTexture; // Procedural crater map
uniform sampler2D normalMap;
uniform vec3 lightDir;

varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  // Base color: gray with slight brown tint
  vec3 baseColor = vec3(0.55, 0.50, 0.48);
  
  // Crater texture: Voronoi-based craters
  vec4 craters = texture(craterTexture, vPosition.xy * 0.01);
  
  // Crater types: multi-scale from basins (large) to microcraters
  // Scale 1 (basins, 1000 km): sparse
  float basins = craters.r;
  vec3 basinColor = vec3(0.45, 0.40, 0.38); // Slightly darker
  
  // Scale 2 (craters, 10-100 km): more frequent
  float craters2 = craters.g;
  
  // Scale 3 (small craters, <10 km): very frequent
  float craters3 = craters.b;
  
  // Combine scales
  vec3 surfaceColor = mix(baseColor, basinColor, basins * 0.3);
  
  // Ray systems (bright ejected material)
  vec3 rayColor = vec3(0.75, 0.70, 0.68);
  float rays = craters.a;
  surfaceColor = mix(surfaceColor, rayColor, rays * 0.2);
  
  // Normal map from crater structure
  vec3 normal = normalize(texture(normalMap, vPosition.xy * 0.01).rgb * 2.0 - 1.0);
  normal = normalize(normal + vNormal);
  
  // Lighting
  float diffuse = max(0.0, dot(normal, normalize(lightDir)));
  vec3 finalColor = surfaceColor * (0.3 + 0.7 * diffuse);
  
  gl_FragColor = vec4(finalColor, 1.0);
}
```

**Crater Shader Detail**

Each crater has specific morphology:

- Large basin (>100 km): wide, smooth floor, terraced walls
  - Rim shadow: dark (-20% brightness)
  - Central peak: bright, jagged peak in center
  - Ejecta blanket: radiates outward, fading
  - Texture: procedurally generated radial gradient
  
- Medium crater (10-100 km): simple structure
  - Single ring with raised rim
  - Central pit or flat floor
  - Ejecta: visible ray system extending 2-3× crater radius
  
- Small crater (<10 km): simple bowl shape
  - No central peak
  - Minimal rim height
  - Rays faint or absent

**Rim Shadows & Central Peaks**

Crater morphology is critical for realism:

- Rim shadow depth: `shadowIntensity = 0.2 * (craterRimHeight / craterRadius)`
- Central peak height: only for craters >15 km radius
- Peak angle: 30-45 degrees (steep, jagged)
- Peak shadow: cast shadow on crater floor

**Ray Systems**

High-velocity ejecta creates bright rays:

- Extend up to 10-20 crater radii
- Color: brighter than surrounding terrain (#BBBBBB)
- Opacity: decreases exponentially with distance
- Particle system optional: dust particles radially ejected from crater

**Limb Darkening**
- Coefficient: 0.4 (moderate)

**Thermal Effects**

Mercury has extreme temperature variation:

- Day side: slight orange tint (#998877) from heating
- Night side: very dark (#333333) and cold
- Terminator zone: harsh gradient from day to night
- Shader: temperature = 1.0 if sunlit, ~0.3 if night side
  - Color shift: `color = mix(color, orange, (1.0 - temperature) * 0.15)`

**Sodium Tail**

Faint exospheric tail of sodium atoms:

- Particle system: 100,000+ particles
- Origin: distributed across dayside surface
- Direction: away from sun (solar wind pressure)
- Color: faint yellow (#FFFF99), very transparent
- Extent: 1-10 million km (visible only at LOD2+)
- Animation: particles slowly drift away and fade

**Bloom Settings**
- Intensity: 0.2 (cratered terrain is not bright)
- Radius: 2 (minimal glow)

**Size Scaling**
- `radiusInUnits = 0.38` (relative to Earth size)

---

### Venus-Type World

**General Specifications**
- Radius: 0.95 Earth radii
- Atmosphere: 92 bar pressure, 96% CO2, 3% N2
- Cloud composition: sulfuric acid droplets
- Surface temperature: 735 K (464°C)
- Atmospheric color: yellow-orange-white
- Rotation: retrograde (backward), extremely slow (243 Earth days)
- Notable features: thick cloud cover, sulfuric rain, volcanic surface

**Atmospheric Shader (Multi-Layer)**

Venus's atmosphere is the dominant visual feature:

```glsl
#version 300 es
precision highp float

uniform float time;
uniform sampler2D cloudTexture;
uniform vec3 planetCenter;
uniform float planetRadius;

varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  // Layer 1: Upper clouds (60-70 km altitude)
  // Yellow-white sulfuric acid clouds
  vec3 upperCloudColor = vec3(0.95, 0.92, 0.75); // Pale yellow
  
  // Layer 2: Middle clouds (45-60 km)
  // Denser, brownish
  vec3 middleCloudColor = vec3(0.80, 0.70, 0.50);
  
  // Layer 3: Lower haze (0-45 km)
  // Hot, orange glow from surface
  vec3 lowerHazeColor = vec3(1.0, 0.70, 0.40); // Orange
  
  // Procedural cloud layer
  vec3 cloudCoord = vPosition * 0.02 + vec3(time * 0.01);
  float cloudNoise = texture(cloudTexture, cloudCoord.xy).r;
  
  // Cloud density increases toward equator and at cloud tops
  float latitude = acos(vPosition.y / length(vPosition)) * 180.0 / 3.14159;
  float latitudeFactor = 1.0 - abs(latitude - 45.0) / 90.0; // Peak density near 45°
  
  // Upper cloud layer (most visible)
  float upperCloudDensity = mix(0.4, 1.0, cloudNoise) * latitudeFactor;
  
  // Middle layer (partially visible through upper)
  float middleCloudDensity = mix(0.5, 0.8, cloudNoise) * (1.0 - upperCloudDensity * 0.7);
  
  // Lower haze (always visible, gives glow)
  float lowerDensity = 0.6;
  
  // Combine layers (front-to-back alpha blending)
  vec3 color = upperCloudColor;
  color = mix(color, middleCloudColor, middleCloudDensity);
  color = mix(color, lowerHazeColor, lowerDensity * 0.3);
  
  // Brightness variation with solar angle
  float sunDot = dot(vNormal, vec3(0.0, 0.0, 1.0)); // Sun direction
  float brightness = 0.7 + 0.3 * max(0.0, sunDot);
  color *= brightness;
  
  float alpha = min(1.0, upperCloudDensity + middleCloudDensity * 0.3 + lowerDensity * 0.2);
  
  gl_FragColor = vec4(color, alpha);
}
```

**Cloud Animation**

Venus has the fastest super-rotating atmosphere (retrograde, 4-day period):

- Upper cloud animation: move northward at ~100 m/s
  - Texture coordinate offset: `offset.y += time * 0.01`
  - Rotation: clouds also drift westward (retrograde)
- Kelvin-Helmholtz waves: visible undulations at cloud top
  - Wave shader: add sine waves at specific latitudes
  - Wavelength: ~500 km typical
  - Amplitude: subtle (±5% cloud height variation)
- Vortex circulation at poles:
  - Two counter-rotating vortices (north and south poles)
  - Shape: spiral arms of enhanced cloud density
  - Animation: rotation period ~5 Earth days

**Surface Rendering (When Close)**

At LOD0, can see surface beneath translucent clouds:

- Terrain: procedural volcanic plains and uplands
- Volcanic features:
  - Pancake domes: broad, flat volcanic structures (10-100 km diameter)
  - Tessera terrain: densely ridged, heavily deformed crust
  - Lava channels: flowing from volcanic centers
- Color: gray-brown (#775533) with reddish tint from iron oxidation
- Texture resolution: 2K at LOD0, 1K at LOD1
- Limb darkening: 0.3 (thin, low-altitude features)

**Lightning Flashes**

Occasional lightning in atmosphere:

- Frequency: 1-5 flashes per minute (variable)
- Location: random cloud positions
- Effect: sudden bright white glow lasting 0.5 seconds
  - Shader: temporarily boost brightness of local region
  - Particle effect: faint streaks of light
- Color: white-blue (#DDEEFF)
- Brightness: up to 1.5× normal cloud brightness

**Greenhouse Glow**

Light from surface bouncing back through atmosphere:

- Effect: orange-red glow visible at edges, especially at terminator
- Shader: increase emission of lower haze layers at limb
- Color: orange-red (#FF6633)
- Intensity: visible at all LODs, more prominent at larger distance
- Calculation:
  ```glsl
  float limbGlow = 1.0 - cos(0.5 * 3.14159 * (1.0 - sunDot));
  color += limbGlow * vec3(1.0, 0.6, 0.3) * 0.3;
  ```

**Bloom Settings**
- Intensity: 1.3 (clouds are bright, glow from internal heating)
- Radius: 10 (thick atmosphere, broad glow)
- Color: yellow-orange

**Size Scaling**
- `radiusInUnits = 0.95` (nearly Earth-sized)

---

### Earth-Type World

**General Specifications**
- Radius: 1.0 Earth radius (reference)
- Surface composition: 71% water, 29% land
- Atmosphere: 78% N2, 21% O2, 1% Ar/CO2
- Rotation: 24 hours
- Axial tilt: 23.5°
- Notable features: life, liquid water, dynamic weather, civilization lights

**Cloud Layer (Critical)**

Clouds dominate Earth's appearance:

```glsl
#version 300 es
precision highp float

uniform float time;
uniform sampler2D cloudMap;
uniform vec3 sunDir;

varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  // Cloud layer at ~10 km altitude
  vec3 cloudCoord = vPosition * 0.05 + vec3(time * 0.003); // Drift westward
  
  // Two-layer Perlin noise for cloud structure
  float clouds1 = texture(cloudMap, cloudCoord.xy).r;
  float clouds2 = texture(cloudMap, cloudCoord.xy * 2.0 + vec2(time * 0.002, 0.0)).r;
  float clouds = mix(clouds1, clouds2, 0.6);
  
  // Cloud density map (sparse -> dense regions)
  float cloudDensity = smoothstep(0.3, 0.7, clouds);
  
  // Cloud color: white with slight gray/blue
  vec3 cloudColor = mix(vec3(0.95, 0.95, 0.95), vec3(0.70, 0.75, 0.85), cloudDensity * 0.3);
  
  // Shading from sun
  float sunDot = dot(vNormal, sunDir);
  float cloudShading = 0.6 + 0.4 * max(0.0, sunDot);
  
  // Cast shadows on surface below
  float shadowCast = cloudDensity * 0.3;
  
  gl_FragColor = vec4(cloudColor * cloudShading, cloudDensity);
}
```

**Cloud Animation**

Clouds drift with wind patterns:

- Latitude-dependent drift speed:
  - Poles: slow (10 m/s westward)
  - 30-60° latitude: fast (50-100 m/s westward, trade winds)
  - Equator: slow (20 m/s westward, doldrums)
- Individual cloud cells: Lagrangian tracking
  - Cell lifetime: 3-10 days
  - New cells spawn from disturbances
  - Merge/dissipate based on thermodynamic model
- Seasonal variation: hemisphere-dependent cloud cover

**Ocean Shader**

Water covers 71% of surface:

- Base color: deep blue (#006994)
- Fresnel effect: edges appear lighter/whiter
- Wave normal maps: multi-scale waves animated
  - Large waves: 100-200 m wavelength, period 10 seconds
  - Medium waves: 5-20 m wavelength, period 5 seconds
  - Ripples: 0.3-1 m wavelength, period 1 second
- Specular reflection: bright sun glint on water surface
  - Glint size: varies with viewing angle
  - Intensity: very strong (bright white)
- Depth variation: deeper (darker) in trenches, lighter on shelves
- Foam/whitecaps: visible on rough water

**Continent Shader**

Land areas with biome diversity:

```glsl
#version 300 es
precision highp float

uniform sampler2D biomeMap; // R: desert, G: forest, B: mountain, A: ice
uniform sampler2D normalMap;
uniform vec3 sunDir;

varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  vec4 biome = texture(biomeMap, vPosition.xy * 0.01);
  
  // Desert: tan-orange
  vec3 desertColor = vec3(0.85, 0.75, 0.50);
  
  // Forest: green
  vec3 forestColor = vec3(0.20, 0.45, 0.25);
  
  // Mountain: gray with brown tint
  vec3 mountainColor = vec3(0.55, 0.50, 0.45);
  
  // Ice: white
  vec3 iceColor = vec3(0.95, 0.95, 0.98);
  
  // Blend biomes
  vec3 color = vec3(0.0);
  color += biome.r * desertColor;
  color += biome.g * forestColor;
  color += biome.b * mountainColor;
  color += biome.a * iceColor;
  
  // Lighting
  vec3 normal = texture(normalMap, vPosition.xy * 0.01).rgb * 2.0 - 1.0;
  normal = normalize(normal + vNormal);
  float diffuse = max(0.2, dot(normal, sunDir));
  color *= diffuse;
  
  gl_FragColor = vec4(color, 1.0);
}
```

**Biome Details**

- Desert: sandy, tan (#D4A574), sparse clouds
- Forest: green (#20B24F), higher cloud cover
- Mountain: gray/brown (#6B5A47), snow-capped peaks
- Ice cap: bright white (#F0F8FF), smooth texture
- Urban areas: gray with lights visible at night

**Atmosphere Rendering (Rayleigh Scattering)**

Air molecules scatter light based on wavelength:

```glsl
#version 300 es
precision highp float

uniform vec3 sunDir;
uniform float atmosphereThickness;
uniform sampler2D earthTexture;

varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  // Sample Earth surface
  vec3 surfaceColor = texture(earthTexture, vPosition.xy * 0.01).rgb;
  
  // Rayleigh scattering: blue (short wavelength) scatters more
  vec3 scatterColor = vec3(0.4, 0.6, 1.0) * 0.3; // Blue sky color
  
  // Scattering intensity based on view angle
  float viewAngle = dot(normalize(vPosition), vNormal);
  float scatter = atmosphereThickness * (1.0 - abs(viewAngle));
  
  // At terminator (dawn/dusk): orange/red scattering (Rayleigh dominates)
  float sunAngle = dot(vNormal, sunDir);
  if (sunAngle < 0.2 && sunAngle > -0.2) {
    // Terminator zone
    scatterColor = mix(vec3(0.4, 0.6, 1.0), vec3(1.0, 0.4, 0.1), 0.7);
  }
  
  // Blend surface with atmosphere
  vec3 finalColor = mix(surfaceColor, scatterColor, scatter);
  
  gl_FragColor = vec4(finalColor, 1.0);
}
```

**Atmospheric Haze/Glow at Limb**

The limb (edge) of the planet shows atmospheric light bending:

- Effect: thin bright line at edge of planet
- Color: blue on lit side, red/orange at terminator
- Shader: render thin rim around planet mesh
- Brightness: high (concentration of scattering)
- Visibility: prominent at all LODs

**City Lights (Night Side)**

Human civilization emits light:

- Texture: emissive map of major cities, grids, coastlines
- Visibility: only on night side (opposite sun)
- Color: yellow-orange (#FFD700)
- Brightness: moderate (0.5-0.8 relative to surface)
- Animation: subtle flicker (electrical grid modulation)
- Detail: cities cluster in latitudes 30-60° (temperate zones)

**Aurora (Polar Lights)**

Magnetospheric interaction creates polar auroras:

- Location: ovals around magnetic poles (~70° geomagnetic latitude)
- Color: green (#00FF00) for common auroras, red (#FF0000) for high altitude
- Shape: curtain or oval depending on geomagnetic activity
- Animation:
  - Waves: curtains ripple with ~10 minute period
  - Intensity: varies with time (geomagnetic activity)
  - Visible only at night side, above pole
- Particle system: emulates light from ionized O and N atoms

**Seasonal Ice Cap Variation**

Arctic and Antarctic ice extent varies:

- Northern hemisphere winter (Jan): maximum Arctic ice
- Southern hemisphere winter (Jul): maximum Antarctic ice
- Animation: ice extent oscillates with 365-day period
- Shader: modulate ice cap biome extent based on season

**Bloom Settings**
- Intensity: 0.8 (life-bearing planet is not intrinsically bright)
- Radius: 8 (moderate atmospheric glow)
- Color: cyan (atmospheric blue)

**Size Scaling**
- `radiusInUnits = 1.0` (reference scale)

---

### Mars-Type World

**General Specifications**
- Radius: 0.53 Earth radii
- Atmosphere: thin (600 Pa), 95% CO2
- Surface temperature: 210 K avg (-63°C)
- Color: rusty red-orange
- Notable features: polar ice caps, canyons, volcanoes, dust storms

**Surface Texture (Iron Oxide)**

Mars is covered in iron oxide (rust):

- Base color: rust red (#C1440E)
- Variation: tan (#D4874F) in bright regions, dark (#663311) in dark regions
- Texture: heavily cratered with ancient river valleys
- Equatorial region: bright, dusty
- Polar regions: ice caps visible
- Olympus Mons: broad, low-slope volcano (visible as subtle elevation)
- Valles Marineris: massive canyon system (visible at LOD0-1)

**Dust Storm Rendering**

Dust storms are common and dramatic:

- Particle system: 100,000 - 1,000,000 particles
- Color: red-orange, same as surface
- Opacity: variable, can grow to cover entire planet
- Animation:
  - Storm size: grows and shrinks over days/weeks
  - Location: moves around planet with wind patterns
  - Speed: dust particles move at ~50-100 m/s
- At global scale: planet appears obscured by haze
- Shader: multiply surface color by dust opacity

**Polar Ice Caps**

Frozen CO2 and H2O:

- Color: bright white (#FFFACD)
- Extent: polar regions, approximately to ±60° latitude
- Animation: seasonal variation (slight shrink/grow with 687-day cycle)
- Thickness appearance: visible at all LODs
- Polar vortex: slight clearing in center (south pole has residual cap year-round)

**Thin Atmosphere**

Very thin atmospheric effects:

- Rayleigh scattering: slight blue haze at limb
- Color: faint blue (#6666FF), much less pronounced than Earth
- Opacity: low (0.1-0.2)
- Dust scattering: dominant over Rayleigh scattering
- Shader: very subtle atmospheric color blend

**Dust Devils**

Small rotating vortices:

- Particle system: 5-20 visible dust devils at any time
- Size: small, ~1-3 km diameter visible from orbit
- Color: same red as surface dust
- Animation:
  - Rotation: spiral updraft, period ~1 minute
  - Lifetime: 10-30 minutes
  - Location: scattered randomly, especially near equator
  - Movement: drift with wind (~20 m/s)
- Visibility: prominent at LOD1-2

**Limb Darkening**
- Coefficient: 0.35

**Bloom Settings**
- Intensity: 0.3 (Mars is dark and cold)
- Radius: 4 (dim glow)

**Size Scaling**
- `radiusInUnits = 0.53`

---

## Gas Giants

### Jupiter-Type World

**General Specifications**
- Radius: 11.2 Earth radii (enormous)
- Atmospheric composition: 89% H2, 10% He, 1% other
- No solid surface (gas throughout)
- Distinctive feature: banded structure with zones and belts
- Rotation: 10 hours (rapid)
- Notable features: Great Red Spot, radiation belts, ring system

**Banded Atmosphere Shader**

The banded appearance is Jupiter's most distinctive feature:

```glsl
#version 300 es
precision highp float

uniform float time;
uniform sampler2D zoneTexture; // Cloud patterns
uniform sampler2D beltTexture;

varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  // Latitude-based bands
  float latitude = acos(vPosition.y / length(vPosition));
  
  // Zone locations (bright bands)
  float zone1 = smoothstep(-0.1, 0.1, sin(latitude * 4.0)); // Multiple zones
  float zone = smoothstep(0.0, 1.0, zone1);
  
  // Belt locations (dark bands)
  float belt = smoothstep(0.0, 1.0, 1.0 - zone1);
  
  // Zone color: cream-tan
  vec3 zoneColor = vec3(0.93, 0.85, 0.65);
  
  // Belt color: brown
  vec3 beltColor = vec3(0.55, 0.40, 0.20);
  
  // Cloud texture adds detail
  vec3 cloudCoord = vPosition * 0.03 + vec3(time * 0.005 * sign(latitude - 1.57));
  float cloudDetail = texture(zoneTexture, cloudCoord.xy).r;
  
  // Modulate color with cloud detail
  zoneColor += cloudDetail * 0.1;
  beltColor += cloudDetail * 0.05;
  
  // Blend zones and belts
  vec3 color = mix(beltColor, zoneColor, zone);
  
  // Differential rotation: zones move at different speeds
  // Equatorial zone: fastest
  // Higher latitudes: slower
  float rotationSpeed = 0.01 * (1.0 - abs(sin(latitude)) * 0.5);
  
  gl_FragColor = vec4(color, 1.0);
}
```

**Zone & Belt Animation**

Each latitude band rotates at a different speed:

- Equatorial zone (±10° latitude): rotation period ~9.8 hours
- North/south temperate zones: ~9.9 hours
- High latitudes: up to ~10.2 hours
- Animation: each band's texture shifts with its own speed
  ```glsl
  float bandSpeed = 360.0 / rotationPeriod; // degrees/hour
  float phase = mod(time * bandSpeed / 360.0, 1.0); // 0-1 per rotation
  uv.x += phase; // Shift texture by phase
  ```

**Great Red Spot**

Persistent anticyclonic storm:

- Location: ~-22° latitude (south tropical zone)
- Size: ~1.3 Earth diameters wide, ~0.7 Earth diameters tall
- Color: orange-red (#B22222) with orange-yellow border (#FF8C00)
- Animation:
  - Rotation: counterclockwise, ~6 Earth days per rotation
  - Slow drift: drifts westward (~90 m/s relative to mean rotation)
  - Shape: oval that slowly morphs over years
- Shader: render as local enhancement of belt color
  ```glsl
  float spotLat = -22.0 * 3.14159 / 180.0;
  float spotDist = distance(latitude, spotLat) + distance(longitude, spotLongitude);
  float spotIntensity = exp(-spotDist * spotDist / (2.0 * spotSize * spotSize));
  color = mix(color, spotColor, spotIntensity);
  ```

**Storm Ovals & Features**

Smaller storms and features:

- White ovals: bright anticyclonic storms (less stable than GRS)
  - Color: bright white (#F5F5F5)
  - Size: 0.2 - 0.5 Earth diameters
  - Lifetime: months to years
- Brown barges: dark cyclonic features
  - Color: dark brown (#4B2F1F)
  - Location: within belts
  - Lifetime: variable

**Lightning Flashes**

Rare lightning in upper atmosphere:

- Frequency: sparse, 1 flash per day (highly variable)
- Location: random within storm systems
- Effect: brief white glow
- Color: bright white (#FFFFFF)
- Particle system: faint arc streaks

**Polar Aurora**

UV/infrared glow at poles (from magnetosphere interaction):

- Location: oval around north and south magnetic poles
- Color: faint blue (#6699FF)
- Intensity: low (barely visible unless zoomed)
- Shader: emissive glow at poles

**Radiation Belts**

Toroidal magnetic field traps radiation:

- Visible in data/science visualization mode only
- Appearance: faint toroidal glow around equator
- Color: orange-red (#FF8800)
- Opacity: very low (0.1-0.2)
- Shader: render as volumetric torus

**Ring System**

Jupiter has faint rings:

- Main ring: thin, primary ring
- Gossamer rings: very faint, extend outward
- Color: gray-brown (#8B8B7A)
- Opacity: very low compared to Saturn
- Shadow: cast shadow on planet's equator

**Bloom Settings**
- Intensity: 1.0 (gas giant is bright but not intensely)
- Radius: 18 (very large planet)
- Color: pale tan-white

**Size Scaling**
- `radiusInUnits = 11.2`
- At LOD1, fills significant portion of screen

---

### Saturn-Type World

**General Specifications**
- Radius: 9.4 Earth radii
- Atmospheric composition: 96% H2, 3% He, 1% other
- Color: pale yellow (#F0E68C)
- Notable features: spectacular ring system, hexagonal polar vortex
- Rotation: 10.7 hours

**Banded Atmosphere Shader**

Similar to Jupiter but more muted colors:

```glsl
#version 300 es
precision highp float

uniform float time;

varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  float latitude = acos(vPosition.y / length(vPosition));
  
  // Subtle banding (less pronounced than Jupiter)
  float zone = 0.7 + 0.3 * sin(latitude * 3.0);
  
  // Zone color: pale yellow-tan
  vec3 zoneColor = vec3(0.94, 0.93, 0.75);
  
  // Belt color: muted tan-brown
  vec3 beltColor = vec3(0.85, 0.81, 0.60);
  
  // Blend
  vec3 color = mix(beltColor, zoneColor, zone);
  
  gl_FragColor = vec4(color, 1.0);
}
```

**Hexagonal Polar Vortex**

Distinctive hexagonal jet stream at north pole:

- Location: north pole (90° latitude)
- Shape: perfect hexagon with ~25,000 km side length
- Color: slightly deeper than surrounding atmosphere
- Animation:
  - Rotation: hexagon rotates with planet's rotation period
  - Stability: hexagon is stable (has persisted for decades)
  - Shader: procedurally generate hexagonal wave pattern
    ```glsl
    // Polar coordinates near north pole
    float angle = atan(position.x, position.z);
    float radius = length(position.xz);
    
    // Hexagonal wave
    float hexWave = cos(angle * 3.0) * 0.2; // 3 = 6 sides / 2
    float hexagon = radius + hexWave;
    
    // Enhance darkness within hexagon
    float hexIntensity = smoothstep(1.5, 0.5, hexagon);
    color -= hexIntensity * vec3(0.1, 0.05, 0.05); // Darker within hex
    ```

**Wind Animation**

Rapid wind circulation:

- Equatorial winds: eastward at ~100 m/s
- High-latitude winds: westward at ~100 m/s
- Animation: bands shift with differential rotation
- Cloud features: moved by wind patterns

**Ring System (CRITICAL — Must be Stunning)**

Saturn's rings are the most visually distinctive feature:

**Ring Components:**

- A Ring: outermost main ring, bright
  - Radius: 122,500 km
  - Width: 14,600 km
  - Color: pale tan (#D4D4B8)
  - Opacity: 0.8 (translucent)
  - Particle density: high

- Cassini Division: gap between A and B rings
  - Width: 4,700 km (empty)
  - Shader: transparent, shows planet through it
  - Visual effect: dramatic separation

- B Ring: brightest, densest ring
  - Radius: 117,500 km
  - Width: 25,500 km
  - Color: bright tan-white (#FFFFDD)
  - Opacity: 1.0 (nearly opaque)
  - Particle density: very high

- C Ring (Crepe Ring): faint, inner ring
  - Radius: 90,000 km
  - Width: 17,500 km
  - Color: very pale (#F0F0E0)
  - Opacity: 0.3 (very transparent)

- D, F, G, E Rings: faint, narrow
  - Very low opacity
  - Difficult to see without enhancement

**Ring Shader:**

```glsl
#version 300 es
precision highp float

uniform sampler2D ringTexture; // Ring particle pattern
uniform float time;
uniform vec3 sunDir;
uniform vec3 planetCenter;
uniform float planetRadius;

varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  // Distance from planet center in ring plane
  float r = length(vPosition.xy);
  
  // Determine which ring
  vec3 ringColor = vec3(0.0);
  float ringOpacity = 0.0;
  
  if (r > 122500.0 && r < 137100.0) {
    // A Ring
    ringColor = vec3(0.83, 0.83, 0.72);
    ringOpacity = 0.8;
  } else if (r > 117500.0 && r < 122500.0) {
    // Cassini Division (transparent)
    ringOpacity = 0.0;
  } else if (r > 92000.0 && r < 117500.0) {
    // B Ring
    ringColor = vec3(1.0, 1.0, 0.87);
    ringOpacity = 1.0;
  } else if (r > 74500.0 && r < 92000.0) {
    // C Ring
    ringColor = vec3(0.94, 0.94, 0.88);
    ringOpacity = 0.3;
  } else {
    discard; // Outside ring system
  }
  
  // Ring texture: particle density variation
  vec2 ringCoord = vec2(atan(vPosition.y, vPosition.x) / (2.0 * 3.14159), r / 150000.0);
  float texture = texture(ringTexture, ringCoord).r;
  ringOpacity *= mix(0.7, 1.0, texture);
  
  // Light scattering
  float sunDot = dot(vNormal, sunDir);
  
  // Forward scattering (bright when backlit)
  float forwardScatter = max(0.0, -sunDot); // Opposite side bright
  
  // Side scattering (both sides moderately lit)
  float sideScatter = 1.0;
  
  // Brightness based on scattering angle
  float brightness = mix(sideScatter, forwardScatter + 1.0, 0.5);
  ringColor *= brightness;
  
  // Shadow of planet on rings
  float shadowDist = length(vPosition.xy - planetCenter.xy);
  if (shadowDist < planetRadius) {
    ringColor *= 0.5; // Darken in shadow
  }
  
  // Shadow of rings on planet (darkens planet limb)
  // Handled in separate pass
  
  gl_FragColor = vec4(ringColor, ringOpacity);
}
```

**Ring Particle Sparkle**

Individual ring particles catch sunlight:

- Particle system: 1000s of particles distributed around rings
- Sparkle: bright white (#FFFFFF) when directly illuminated
- Animation: subtle shimmer, particles twinkle as they rotate
- Effect: gives rings texture and life

**Encke Gap**

Narrow division within A ring:

- Width: ~325 km
- Location: at ~133,700 km from center
- Effect: subtle dark line within A ring
- Cause: shepherd moons (Pan) clearing particles

**Spoke Features**

Transient dark radial markings in B ring:

- Appearance: dark radial streaks
- Location: only in B ring
- Color: dark gray (#555555)
- Animation:
  - Spokes rotate with magnetic field, not orbital motion
  - Period: ~10.7 hours (planet's rotation)
  - Lifetime: weeks to months
  - Visibility: fades in and out
- Mechanism: electrostatic charging levitates particles

**Lower Density Visual**

Saturn is less dense than Jupiter:

- Subtle oblateness (flattening): equatorial bulge ±5%
- Shader: slight stretching of bands at equator
- Effect: star appears slightly flattened

**Bloom Settings**
- Intensity: 1.2 (rings add significant visual brightness)
- Radius: 20 (very large planet + rings)
- Color: pale yellow

**Size Scaling**
- `radiusInUnits = 9.4`
- Rings extend to ~2.3× planet radius
- At LOD1, rings are spectacular visual feature

---

### Uranus-Type World

**General Specifications**
- Radius: 4.0 Earth radii
- Color: cyan-blue (#AFEEEE to #87CEEB)
- Atmosphere: methane absorption shifts color
- Axial tilt: 97.77° (rotates on side)
- Rotation: 17 hours
- Notable features: extreme tilt, faint rings, bland surface

**Pale Cyan Shader**

Methane absorption in upper atmosphere:

- Base color: pale cyan (#AFEEEE)
- Variation: slightly darker at poles (#7FBFFF)
- Methane absorption: removes red light, enhancing blue
- Cloud features: faint, barely visible
- Limb: subtle blue gradient

**Featureless Appearance**

Uranus shows minimal cloud activity at distance:

- At LOD0-1: faint bands visible with high magnification
- At LOD2+: smooth gradient color sphere
- Cloud detection: computational challenge even with Hubble

**Faint Bands (LOD0 Only)**

When zoomed in, some structure appears:

- Zone/belt pattern: similar to Jupiter but very faint
- Contrast: only ~5-10% brightness variation
- Color variation: subtle gray tones
- Animation: slow rotation (17 hours)

**Extreme Axial Tilt**

Rotates on its side:

- North pole points roughly at sun (per orbit)
- Visual effect: rotation axis visible as polar tilt
- Seasonal effects: extreme (42-year seasons)
- Shader: rotate planet mesh by 97.77° around orbital axis

**Faint Ring System**

Dark, narrow rings:

- Composition: dark particles (similar to Jupiter's gossamer rings)
- Color: dark gray-brown (#6B6B5B)
- Opacity: very low (0.1-0.2)
- Count: 13 known rings (very faint, not all visible)
- Visibility: only at LOD0-1 with careful observation

**Bloom Settings**
- Intensity: 0.6 (dim, cold world)
- Radius: 12 (moderate planet size)
- Color: cyan

**Size Scaling**
- `radiusInUnits = 4.0`

---

### Neptune-Type World

**General Specifications**
- Radius: 3.9 Earth radii
- Color: deep vivid blue (#0000CD to #4169E1)
- Atmosphere: methane + unknown chromophore (absorber)
- Wind speeds: fastest in solar system (~2100 m/s)
- Rotation: 16 hours
- Notable features: dramatic dark storm, bright cloud companion

**Deep Blue Shader**

Methane absorption is extreme:

- Base color: deep vivid blue (#0000CD)
- Variation: darker at poles (#000080)
- Gradient: subtle darkening toward edges
- Unknown chromophore: creates intense coloration (theoretical cause unknown)

**Great Dark Spot Analog**

Similar to Jupiter's GRS:

- Location: ~-20° latitude (previous observation)
- Size: comparable to GRS
- Color: dark gray-blue (#1F3F5F)
- Animation:
  - Counter-clockwise rotation (anticyclonic)
  - Movement: storm drifts westward at ~100 m/s
  - Lifetime: observed 1989-1994, disappeared, may reappear
- Shader: local darkening in band structure

**Bright Companion Clouds**

High-altitude methane ice cirrus clouds:

- Color: bright white (#FFFFFF)
- Altitude: upper stratosphere
- Location: various latitudes, often near dark spot
- Animation: move with wind circulation

**Rapid Band Animation**

Fastest planetary winds:

- Wind speeds: 100-2100 m/s (extremely fast)
- Band structure: subtle horizontal streaks
- Animation: rapid westward motion
  - At equator: ~2000 m/s
  - At higher latitudes: variable
- Shader: texture scrolls at high speed

**Faint Ring Arcs**

Neptune has incomplete ring arcs:

- Adams Ring: mostly gapped, forms arcs
- Le Verrier Ring: complete, narrow
- Lassell Ring: broader, fainter
- Color: dark gray-brown
- Opacity: very low
- Visibility: barely visible

**Bloom Settings**
- Intensity: 0.7 (cold, distant world)
- Radius: 12
- Color: blue

**Size Scaling**
- `radiusInUnits = 3.9`

---

## Exotic Planet Types

### Lava/Magma World

**General Specifications**
- Surface: fully molten lava ocean
- Temperature: 1000 - 2000 K
- No atmosphere or minimal silicate vapor
- Orbital characteristics: typically close to star (tidal locking possible)
- Color: glowing orange-red-yellow
- Hellish appearance: most extreme visually

**Glowing Magma Ocean Shader**

The surface is animated lava:

```glsl
#version 300 es
precision highp float

uniform float time;
uniform sampler2D magmaTexture;
uniform vec3 sunDir;

varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  // Base dark crust color
  vec3 crustColor = vec3(0.10, 0.05, 0.00); // Very dark brown
  
  // Procedural cracks revealing lava
  vec3 crackCoord = vPosition * 0.02 + vec3(time * 0.01);
  float crackNoise = texture(magmaTexture, crackCoord.xy).r;
  
  // Voronoi crack pattern (sharp cell boundaries)
  float cracks = smoothstep(0.4, 0.6, fract(crackNoise * 5.0));
  
  // Lava color: bright orange-red-yellow gradient
  vec3 lavaColorDim = vec3(1.0, 0.35, 0.0); // Orange
  vec3 lavaColorBright = vec3(1.0, 0.9, 0.3); // Yellow-orange
  
  // Cracks open and close: shift cracks over time
  float crackPhase = mod(time * 0.5, 1.0);
  cracks = smoothstep(0.3 + crackPhase * 0.2, 0.7 + crackPhase * 0.2, fract(crackNoise * 5.0));
  
  // Blend crust and lava
  vec3 color = mix(crustColor, lavaColorDim, cracks);
  
  // Brighter lava in cracks
  color = mix(color, lavaColorBright, cracks * 0.7);
  
  // Hotter regions near substellar point emit more light
  float sunDot = dot(vNormal, sunDir);
  float heatingFactor = 0.5 + 0.5 * max(0.0, sunDot); // Tidally locked: one side much hotter
  
  // Emission: lava glows
  vec3 emission = (lavaColorBright * cracks + color * (1.0 - cracks)) * 0.5 * heatingFactor;
  
  // Temperature-based brightness boost
  color += emission;
  color = clamp(color, 0.0, 1.0);
  
  gl_FragColor = vec4(color, 1.0);
}
```

**Magma Convection Animation**

Surface magma slowly churns:

- Cell pattern: bright and dark patches rotating
- Animation: patches move in convective cells
  - Cell size: ~10-20% of planet radius
  - Cell motion: slow, ~1 meter/second real-world, ~100 pixel/second at LOD0
  - Lifetime: cells form, merge, dissipate over hours (simulated)
- Shader update: shifts Perlin noise coordinates per frame
- Effect: surface appears alive and turbulent

**Magma Fountains/Geysers**

Occasional eruptions:

- Particle system: 20,000 - 100,000 particles per fountain
- Spawn rate: 2-5 new fountains per second
- Particle color: orange-red (#FF4500) at base, fades to transparent
- Particle velocity: upward at 100+ m/s, spreading angle ~30 degrees
- Height: fountains reach 10-50 km altitude (visible at LOD0-1)
- Lifetime: particles disappear after ~5 seconds
- Location: spawn randomly, more frequent near substellar point (hotter)

**Cooling Crust Animation**

Bright lava slowly cools to dark crust:

- Animation: cracks darken over time as they cool
- Color transition: bright orange → dark brown
- Shader: assign age to each crack, darken based on age
- Effect: cracks appear to be fresh lava cooling and solidifying
- New cracks continuously open (convection forces)

**Glowing Atmosphere (Silicate Vapor)**

Thin atmosphere of vaporized rock:

- Color: orange haze (#FF8800)
- Opacity: low (0.2-0.3)
- Shader: thin glow at limb
- Effect: halo around glowing planet

**Bloom Settings**
- Intensity: 2.5 (magma glows intensely)
- Radius: 10
- Color: orange-red

**Size Scaling**
- `radiusInUnits = log10(solarRadii) * 0.5`

---

### Ocean World

**General Specifications**
- Surface: global ocean, no visible land (or rare islands)
- Ocean depth: kilometers (some with subsurface oceans)
- Color: deep blue-teal
- Atmosphere: water vapor clouds
- Notable feature: extreme water availability

**Ocean Surface Shader**

Multi-layered water with waves:

```glsl
#version 300 es
precision highp float

uniform float time;
uniform sampler2D waveNormal1;
uniform sampler2D waveNormal2;
uniform vec3 sunDir;

varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  // Base ocean color: deep blue-teal
  vec3 oceanColor = vec3(0.0, 0.5, 0.5);
  
  // Wave normal maps at different scales
  vec2 uv = vPosition.xy * 0.1;
  vec3 normal1 = texture(waveNormal1, uv + time * 0.01).rgb * 2.0 - 1.0;
  vec3 normal2 = texture(waveNormal2, uv * 2.0 + time * 0.02).rgb * 2.0 - 1.0;
  
  // Combine normals
  vec3 waveNormal = normalize(normal1 + normal2 * 0.5);
  
  // Lighting
  float diffuse = max(0.2, dot(waveNormal, sunDir));
  
  // Specular reflection (sun glint)
  vec3 viewDir = normalize(vPosition);
  vec3 reflectDir = reflect(-sunDir, waveNormal);
  float spec = pow(max(0.0, dot(viewDir, reflectDir)), 32.0);
  
  vec3 color = oceanColor * diffuse + vec3(1.0) * spec * 0.8;
  
  // Fresnel effect: edges appear whiter
  float fresnel = pow(1.0 - abs(dot(vNormal, viewDir)), 3.0);
  color = mix(color, vec3(0.8, 0.9, 1.0), fresnel * 0.3);
  
  // Depth variation: deeper = darker
  float depth = 1.0 - pow(oceanColor.r + oceanColor.g, 2.0);
  color *= mix(0.6, 1.0, depth);
  
  gl_FragColor = vec4(color, 1.0);
}
```

**Wave Animation**

Animated surface waves:

- Large waves: 100-200 m wavelength, period ~10 seconds
  - Normal map scrolls at wind speed
- Medium waves: 5-20 m wavelength, period ~5 seconds
- Ripples: 0.3-1 m wavelength, period ~1 second
- Combined using multiple octaves of Perlin noise

**Specular Sun Glint**

Bright sun reflection:

- Shader: Phong specular with high shininess (32-64)
- Intensity: very bright (white, 0.8+ intensity)
- Size: varies with viewing angle (larger glint when viewed at shallow angle)
- Animation: glint moves as planet rotates

**Underwater Bioluminescence (Optional)**

Glowing organisms beneath surface:

- Particle system: 10,000 - 50,000 particles scattered throughout ocean
- Color: blue-green (#00FF99), faint
- Animation: particles twinkle randomly
- Visibility: subtle, barely visible, adds life-like quality
- Opacity: very low (0.2-0.3)

**Water Vapor Atmosphere**

Humidity creates cloud cover:

- Cloud shader: similar to Earth clouds
- Coverage: typically 80-100% (water world climate)
- Color: white (#FFFFFF)
- Visible on dark side: thin cloud layer visible by starlight

**Possible Polar Ice Caps**

If far from star:

- Ice caps at both poles
- Color: bright white (#F0F8FF)
- Size: varies with temperature
- Animated: seasonal variation possible

**Bloom Settings**
- Intensity: 0.6 (water is not intrinsically bright)
- Radius: 8
- Color: cyan (water atmosphere)

**Size Scaling**
- `radiusInUnits = log10(solarRadii) * 0.5`

---

### Hot Jupiter

**General Specifications**
- Radius: 1-2 Jupiter radii (inflated)
- Temperature: 1000 - 3000 K (much hotter than normal Jupiter)
- Orbital period: days to weeks (very close to star)
- Surface gravity: high
- Distinctive feature: tidally locked, extreme day/night temperature gradient

**Tidally Locked Appearance**

Half the planet faces the star perpetually:

- Day side: incandescent, glowing yellow-white
- Night side: deep dark red to black
- Terminator zone: dramatic transition with violent winds

**Day Side Shader**

Extremely hot, glowing atmosphere:

```glsl
#version 300 es
precision highp float

uniform vec3 sunDir;

varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  // Incandescent glow: white-yellow
  vec3 baseColor = vec3(1.0, 1.0, 0.8);
  
  // Limb darkening reduced (hot atmospheric expansion)
  float sunDot = dot(vNormal, sunDir);
  
  if (sunDot < 0.3) {
    // Terminator region: hotter, glowing
    baseColor = vec3(1.0, 0.8, 0.5); // Yellow-orange at terminator
  }
  
  // Emission from heat
  float emission = 0.7 + 0.3 * max(0.0, sunDot);
  vec3 color = baseColor * emission;
  
  // Na/K absorption features (dark lines in spectrum)
  // Render as subtle dark bands
  float bands = sin(vPosition.y * 10.0) * 0.1;
  color *= (1.0 - bands);
  
  gl_FragColor = vec4(color, 1.0);
}
```

**Night Side Shader**

Cold, dark side with faint glow from internal heat:

```glsl
#version 300 es
precision highp float

uniform vec3 sunDir;

varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  // Check if night side
  float sunDot = dot(vNormal, sunDir);
  
  if (sunDot > -0.1) {
    // Twilight zone: mix day and night
    discard; // Handled by day side shader
  }
  
  // Night side: deep red from residual heat
  vec3 nightColor = vec3(0.2, 0.05, 0.0); // Deep red
  
  // Slight internal heat glow
  float heatGlow = 0.3 * (1.0 + abs(vNormal.y)); // Glow from internal heat
  vec3 color = nightColor * heatGlow;
  
  gl_FragColor = vec4(color, 1.0);
}
```

**Terminator Transition Zone**

Violent wind circulation at day-night boundary:

- Color gradient: from white (day) → yellow → orange → red → dark (night)
- Cloud animation: rapid, turbulent motion
  - Wind speeds: hurricane-force (300+ m/s)
  - Cloud bands: tightly packed, high contrast
  - Shader: enhanced cloud detail and animation at terminator
- Particle effect: violent storm clouds visible as billowing structures

**Atmospheric Escape**

Hydrogen and helium escaping to space:

- Particle system: 100,000 - 500,000 particles
- Origin: distributed across day-side upper atmosphere
- Direction: away from sun (radiation pressure and stellar wind)
- Color: white-blue (#DDEEFF)
- Motion: forms comet-like tail trailing behind planet
  - Tail extends 1-5 planetary radii
  - Curves backward due to stellar wind pressure
- Opacity: decreases with distance, fades to invisible
- Animation: continuous, particles spawn and drift away

**Cloud Structure**

Silicate and iron clouds on night side:

- Day side: clear, cloud-free (too hot)
- Terminator: thick clouds forming from day-night convection
- Night side: silicate/iron clouds condense and precipitate
- Color contrast: day (white) → terminator (dark) → night (gray clouds)
- Animation: clouds continuously form and dissipate

**Bloom Settings**
- Intensity: 2.2 (incandescent glow)
- Radius: 12
- Color: white-yellow

**Size Scaling**
- `radiusInUnits = log10(solarRadii) * 0.6`

---

### Carbon Planet

**General Specifications**
- Surface: graphite and diamond
- Color: very dark gray (#2F2F2F)
- Atmosphere: hydrocarbon-rich
- Temperature: 1000 - 3000 K (variable)
- Notable features: crystalline, metallic appearance

**Diamond Facet Surface Shader**

Crystalline, reflective surface:

```glsl
#version 300 es
precision highp float

uniform vec3 sunDir;

varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  // Dark graphite base
  vec3 baseColor = vec3(0.18, 0.18, 0.18);
  
  // Diamond facets: bright specular highlights
  float specular = pow(max(0.0, dot(normalize(vPosition), sunDir)), 64.0);
  
  // Graphite appearance: directional, less shiny
  float diffuse = max(0.2, dot(vNormal, sunDir));
  
  vec3 color = baseColor * diffuse + vec3(1.0) * specular * 0.6;
  
  // Crystalline surface pattern
  float crystal = sin(vPosition.x * 10.0) * sin(vPosition.y * 10.0) * sin(vPosition.z * 10.0);
  crystal = crystal * 0.1 + 0.5; // Shift to 0.4-0.6 range
  
  color *= mix(0.8, 1.2, crystal);
  
  gl_FragColor = vec4(color, 1.0);
}
```

**Silicon Carbide Terrain**

Angular, crystalline surface patterns:

- Texture: sharp, angular features
- Color: dark gray with slight blue tint (#4A4A4A)
- Appearance: faceted, geometric look (crystalline structure)
- Animation: none (static)

**Tar/Hydrocarbon Lakes**

Dark liquid features:

- Color: very dark, nearly black (#1A1A1A)
- Appearance: smooth, viscous-looking
- Location: scattered across surface
- Animation: subtle surface shimmer (implied fluidity)

**Hydrocarbon Atmosphere**

Orange-brown haze:

- Color: yellow-orange (#FFAA00)
- Opacity: moderate
- Effect: dims surface visibility at distance
- Shader: apply atmospheric glow similar to Venus

**Bloom Settings**
- Intensity: 0.3 (very dark, minimal intrinsic brightness)
- Radius: 6
- Color: dark orange

**Size Scaling**
- `radiusInUnits = log10(solarRadii) * 0.5`

---

### Rogue Planet

**General Specifications**
- No parent star (orphan planet)
- Surface: frozen, no illumination
- Temperature: extremely cold (50-200 K)
- Appearance: nearly invisible against starfield
- Visualization: dark sphere with faint thermal glow

**Darkness Shader**

Rogue planets are extremely dim:

```glsl
#version 300 es
precision highp float

uniform float ageOrInternalHeat;

varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  // No external illumination: planet is dark
  // Only internal heat provides glow
  
  // Base: nearly black
  vec3 color = vec3(0.0);
  
  // Thermal glow from radioactive decay (if young enough)
  float heatGlow = ageOrInternalHeat * 0.5;
  
  // Deep infrared glow: barely visible deep red
  color += vec3(0.3, 0.05, 0.0) * heatGlow;
  
  gl_FragColor = vec4(color, 1.0);
}
```

**Frozen Atmosphere**

Thin frozen atmosphere on surface:

- Color: pale blue-white (frozen CO2, CH4, NH3)
- Appearance: thin layer of frost
- Animation: none (static)

**Auroral Activity**

Magnetic field interacting with interstellar medium:

- Particle system: animated aurora-like effect
- Color: faint green (#00FF00) or red (#FF0000)
- Animation: waves and pulses in magnetic field interaction
- Location: at magnetic poles
- Visibility: one of few visible features

**Bloom Settings**
- Intensity: 0.0 (no bloom for dark planets)
- Radius: 0
- Color: none

**Size Scaling**
- `radiusInUnits = log10(solarRadii) * 0.5`
- At LOD3+: nearly invisible, only visible by occlusion of stars behind it

---

### Eyeball Planet (Tidally Locked)

**General Specifications**
- Tidally locked to star
- Day side: potentially habitable ring
- Night side: frozen ice ball
- Distinctive appearance: sharp contrast between hemispheres
- Notable feature: habitable terminator ring

**Day Side Shader**

Warm, potentially habitable:

- Color: varied by biome (similar to Earth)
- Clouds: abundant
- Blue water
- Green vegetation possible

**Night Side Shader**

Frozen hemisphere:

- Color: white-blue (#ADD8E6)
- Appearance: icy, frozen
- Temperature: far below freezing

**Terminator Ring**

The only habitable zone:

- Location: ~23° latitude band around terminator
- Features: liquid water, clouds, vegetation
- Color: blue water, green vegetation, white clouds
- Size: narrow ring, typically 2-10° wide
- Vegetation: possible greenish tint (#228B22)
- Atmospheric circulation: rapid, driven by extreme temperature gradient

**Dramatic Visual Contrast**

The visual impact is the primary feature:

- Bright warm day side (yellow-orange lighting)
- Dark cold night side (blue-black)
- Thin habitable ring at boundary
- Shader: sharp transition at terminator

**Atmospheric Circulation**

Wind flows from day to night side:

- Wind animation: visible clouds moving from day → terminator → night
- Particle effect: thin stream of atmosphere attempting to flow nightward
- Effect: creates dynamic, unusual appearance

**Bloom Settings**
- Intensity: 0.7
- Radius: 8
- Color: blue-green

**Size Scaling**
- `radiusInUnits = log10(solarRadii) * 0.5`

---

### Super-Earth

**General Specifications**
- Radius: 1.5 - 2.0 Earth radii
- Gravity: 2-3 times Earth
- Atmosphere: thicker than Earth
- Cloud coverage: typically higher
- Terrain: flatter (gravity squashes features)

**Thick Atmosphere Shader**

More opaque, more scattering:

```glsl
#version 300 es
precision highp float

uniform sampler2D atmosphereTexture;
uniform vec3 sunDir;

varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  // Thicker atmosphere: more scattering
  float atmosphereThickness = 1.5; // vs 1.0 for Earth
  
  // Cloud coverage: higher than Earth
  vec3 cloudColor = vec3(0.90, 0.90, 0.95);
  
  // Atmospheric haze
  float haze = atmosphereThickness * 0.4;
  
  // Surface color (if visible)
  vec3 surfaceColor = vec3(0.5, 0.4, 0.3);
  
  // Blend atmosphere over surface
  vec3 color = mix(surfaceColor, cloudColor, haze);
  
  // Limb: strong atmospheric glow
  float limbGlow = (1.0 - dot(normalize(vPosition), vNormal)) * atmosphereThickness;
  color = mix(color, vec3(0.8, 0.9, 1.0), limbGlow * 0.2);
  
  gl_FragColor = vec4(color, 1.0);
}
```

**Flatter Terrain**

Stronger gravity compresses vertical features:

- Mountain heights: 50% of Earth equivalent
- Ocean depth: deeper (gravity compresses)
- Crust thickness: thinner (gravity induced isostatic balance)
- Appearance: smoother, less dramatic relief

**Enhanced Cloud Coverage**

More water in thicker atmosphere:

- Cloud percentage: 70-90% (vs 60% on Earth)
- Cloud types: more diverse (stratus, cumulus, cirrus)
- Storm systems: larger, more powerful

**Plate Tectonics (Optional)**

Larger scale tectonics possible:

- Continents: larger and fewer
- Mid-ocean ridges: broader, gentler
- Subduction zones: deeper, more active
- Volcanic activity: potentially more intense

**Bloom Settings**
- Intensity: 0.9
- Radius: 10
- Color: cyan

**Size Scaling**
- `radiusInUnits = 1.5 to 2.0`

---

## Moon Types

### Volcanic Moon (Io-Type)

**General Specifications**
- Radius: 0.28 Earth radii (medium moon)
- Surface: sulfur-dominated
- Temperature: 50 - 1600 K (lava lakes)
- Notable features: active volcanism, sulfur colors, rapid resurfacing

**Sulfur Surface Shader**

Multiple sulfur allotropes create varied colors:

```glsl
#version 300 es
precision highp float

uniform sampler2D sulfurTexture;
uniform float time;

varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  // Different sulfur colors
  vec3 yellowSulfur = vec3(1.0, 0.85, 0.0); // Pure yellow
  vec3 orangeSulfur = vec3(1.0, 0.65, 0.0); // Orange
  vec3 redSulfur = vec3(0.85, 0.25, 0.0); // Red
  vec3 whiteSulfur = vec3(1.0, 1.0, 0.95); // White
  
  // Procedural sulfur allotrope variation
  vec3 sulfurCoord = vPosition * 0.01;
  float sulfurType = texture(sulfurTexture, sulfurCoord.xy).r;
  
  vec3 color = vec3(0.0);
  if (sulfurType < 0.25) {
    color = yellowSulfur;
  } else if (sulfurType < 0.5) {
    color = orangeSulfur;
  } else if (sulfurType < 0.75) {
    color = redSulfur;
  } else {
    color = whiteSulfur;
  }
  
  // Lava lakes: bright orange-red spots
  float lavaDensity = fract(sulfurCoord.x * 10.0) * fract(sulfurCoord.y * 10.0);
  if (lavaDensity > 0.8) {
    color = mix(color, vec3(1.0, 0.4, 0.0), 0.6); // Lava lakes
  }
  
  gl_FragColor = vec4(color, 1.0);
}
```

**Active Volcanic Eruptions**

Continuous sulfurous eruptions:

- Particle system: 20-50 active volcanoes at any time
- Particle count per volcano: 50,000 - 200,000
- Color gradient: bright orange-red at base, yellow at height
- Velocity: 1000+ m/s (very fast, exceeds escape velocity locally)
- Height: 100-300 km altitude (visible from orbit)
- Particle lifetime: 1-5 minutes
- Sulfur dioxide: white plume visible against colored surface
- Continuous emission: volcanoes erupt perpetually

**Lava Lakes**

Glowing lava features:

- Color: bright orange (#FF6600)
- Shape: irregular lakes and rivers
- Animation: lava slowly flows and solidifies
- Emission: bright glow, high bloom
- Location: concentrated near volcanoes
- Cooling: lava cools to dark sulfur (color shift)
- New lava: continuously flows from volcanic vents

**Surface Constantly Changing**

Young surface geology:

- Lava flows: fresh bright material covering old dark terrain
- Age: some regions < 1 million years old
- Absence of craters: rapidly covered by lava
- Scarps: steep, new volcanic features
- Sulfur frost: bright deposits on poles

**Tidal Flexing Animation**

Jupiter's gravity deforms the moon:

- Radius oscillation: subtle +/- 1 km variation
- Period: synchronized with orbit (~42 hours)
- Effect: subtle bulging on planet-facing side
- Shader: very subtle vertex displacement, barely visible

**Bloom Settings**
- Intensity: 1.5 (hot lava glows)
- Radius: 8
- Color: orange-red

**Size Scaling**
- `radiusInUnits = 0.28`

---

### Icy Moon with Subsurface Ocean (Europa-Type)

**General Specifications**
- Radius: 0.25 Earth radii
- Surface: water ice (white-tan)
- Subsurface: liquid water ocean (50-100 km beneath surface)
- Distinctive features: linear cracks (lineae), cryovolcanic plumes
- Temperature: 110 K at poles, 125 K at equator

**Cracked Ice Surface Shader**

Distinctive linear fracture patterns:

```glsl
#version 300 es
precision highp float

uniform sampler2D crackTexture;
uniform vec3 sunDir;

varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  // Base ice color: white-tan
  vec3 iceColor = vec3(0.95, 0.90, 0.85);
  
  // Linear crack patterns (tidal stress)
  vec3 crackCoord = vPosition * 0.05;
  float cracks = texture(crackTexture, crackCoord.xy).r;
  cracks = step(0.7, cracks); // Sharp cracks
  
  // Crack color: brownish (contamination from subsurface organics)
  vec3 crackColor = vec3(0.55, 0.48, 0.42);
  
  // Blend ice and cracks
  vec3 color = mix(iceColor, crackColor, cracks);
  
  // Lighting
  float diffuse = max(0.3, dot(vNormal, sunDir));
  color *= diffuse;
  
  // Specular ice shine
  float spec = pow(max(0.0, dot(reflect(-sunDir, vNormal), vNormal)), 16.0);
  color += vec3(1.0) * spec * 0.3;
  
  gl_FragColor = vec4(color, 1.0);
}
```

**Lineae Pattern (Tidal Stress)**

Complex crack network from tidal forces:

- Pattern: procedural crack network using Voronoi/Perlin
- Color: dark brown (#8B7355) from organic contamination
- Shape: linear, often crossing other lineae
- Density: varies from sparse to dense (chaotic terrain)
- Direction: preferentially aligned with tidal stress axis (points toward Jupiter)
- Animation: cracks slowly open and close due to tidal heating cycle

**Cryovolcanic Plumes**

Water geysers erupting from subsurface:

- Particle system: 5-10 active plumes at any time
- Particle count: 50,000 - 100,000 per plume
- Composition: water vapor and ice particles
- Color: white (#FFFFFF)
- Velocity: 200-500 m/s (water vapor jets)
- Height: 100-200 km (visible from distance)
- Backlit by sun: creates bright halos
- Animation: continuous but variable intensity
- Frozen particles: create frost deposits around plume sources

**Plume Source Locations**

Geysers emerge from specific hot spots:

- Source color: slightly darker than surrounding ice (warm region)
- Size: small (1-10 km diameter)
- Frequency: plumes erupt from same locations repeatedly (structural weakness)
- Particle trail: faint trail of particles spreading outward from vent

**Subtle Orange-Brown Contamination**

Salts and organics from subsurface:

- Color: tan to orange-brown (#8B6914)
- Distribution: concentrated in lineae and around plumes
- Origin: subsurface material exposed by cryovolcanism
- Animation: slowly spreads along cracks

**Smooth Young Surface**

Few craters visible:

- Crater density: 10-100× lower than most moons
- Craters present: mostly small, recent impacts
- Crater appearance: surrounded by fresh ejecta
- Implications: surface is young (< 100 million years)

**Limb Darkening**
- Coefficient: 0.25 (icy surface, low contrast)

**Bloom Settings**
- Intensity: 0.5 (ice reflects light, but not intrinsically bright)
- Radius: 6
- Color: cyan (water ice)

**Size Scaling**
- `radiusInUnits = 0.25`

---

### Atmospheric Moon (Titan-Type)

**General Specifications**
- Radius: 0.40 Earth radii
- Atmosphere: dense methane-nitrogen (1.5 bar)
- Surface: hydrocarbon dunes and icy highlands
- Color: orange-brown haze
- Temperature: 94 K (-179°C)
- Notable features: methane rain, liquid methane lakes, thick haze

**Thick Orange Haze Shader**

Opaque atmosphere of organic haze:

```glsl
#version 300 es
precision highp float

uniform sampler2D hazeDensity;
uniform vec3 sunDir;

varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  // Haze color: orange-brown
  vec3 hazeColor = vec3(0.80, 0.55, 0.30); // Deep orange
  
  // Haze density variation
  vec3 hazeCoord = vPosition * 0.02;
  float hazeDens = texture(hazeDensity, hazeCoord.xy).r;
  
  // Modulate haze color with density
  vec3 color = hazeColor * (0.5 + hazeDens);
  
  // Limb brightening: sun scattered through thick atmosphere
  float limbBright = 1.0 - abs(dot(vNormal, vPosition / length(vPosition)));
  color += limbBright * vec3(1.0, 0.7, 0.3) * 0.3;
  
  gl_FragColor = vec4(color, 1.0);
}
```

**Multi-Layer Haze**

Visible stratification:

- Upper layer: thin, less opaque
- Middle layer: denser organic haze (#CC7000)
- Lower layer: densest, orange-brown (#B8860B)
- Effect: layered appearance at limb (visible at LOD0-1)

**Cloud Formations**

Methane clouds in upper atmosphere:

- Color: white (#FFFFFF)
- Density: variable, 30-50% coverage
- Animation: slow drift with wind patterns
- Visibility: seen as bright spots through haze at distance

**Methane Rain & Lakes**

Liquid methane precipitation:

- Rain: visible at LOD0, dark streaks in atmosphere
- Lakes: liquid methane bodies on surface
  - Color: very dark brown-black (#1A1A1A)
  - Appearance: smooth, liquid surface
  - Location: polar regions, low-lying areas
  - Size: some larger than terrestrial lakes

**Surface Features (Beneath Haze)**

At LOD0, surface becomes visible:

- Hydrocarbon dunes: dark sand dunes (organic material)
  - Color: dark brown (#4B2F1F)
  - Shape: parallel dunes, wind-aligned
  - Coverage: 10-20% of surface
- Ice highlands: bright water-ice mountains
  - Color: bright white-tan (#FFFACD)
  - Height: several km above average surface
  - Coverage: 20-30% of surface
- Craters: impact basins, dark rims
- Cryovolcanoes: hypothetical water-lava features

**Drizzle/Rain Animation**

Occasional methane precipitation:

- Particle system: 100,000 - 200,000 rain particles
- Color: dark gray-blue (#4B5A6F)
- Velocity: slow, ~5 m/s (low gravity)
- Direction: vertical downward
- Duration: rain lasts 10-30 seconds (simulated)
- Frequency: rare, perhaps once per simulated day
- Effect: briefly obscures surface

**Haze Layers at Limb**

Multiple visible atmospheric layers:

- Upper layer (altitude 100+ km): thin, barely visible
- Middle layer (50-100 km): golden brown
- Lower layer (0-50 km): dense orange
- Animation: subtle, haze circulation over weeks/months (simulated)

**Limb Darkening**
- Coefficient: 0.4 (haze reduces contrast)

**Bloom Settings**
- Intensity: 0.4 (haze is partially opaque)
- Radius: 10 (extended atmosphere)
- Color: orange

**Size Scaling**
- `radiusInUnits = 0.40`

---

### Standard Rocky Moon (Luna-Type)

**General Specifications**
- Radius: 0.27 Earth radii (medium moon, similar to Earth's Moon)
- Surface: cratered, dark basaltic plains (mare), bright highlands
- Color: gray with dark patches
- Temperature: 120 K (night) to 390 K (day)
- Notable features: large impact basins, no atmosphere

**Cratered Terrain Shader**

Heavily impacted surface:

```glsl
#version 300 es
precision highp float

uniform sampler2D craterMap;
uniform sampler2D normalMap;
uniform vec3 sunDir;

varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  // Base color: gray
  vec3 baseColor = vec3(0.60, 0.60, 0.60);
  
  // Crater texture
  vec3 craterCoord = vPosition * 0.01;
  float craters = texture(craterMap, craterCoord.xy).r;
  
  // Mare (dark basaltic plains)
  vec3 mareColor = vec3(0.30, 0.30, 0.30);
  
  // Highlands (bright anorthosite)
  vec3 highlightColor = vec3(0.75, 0.75, 0.75);
  
  // Mix based on crater map
  vec3 color = mix(baseColor, mareColor, craters * 0.4);
  color = mix(color, highlightColor, (1.0 - craters) * 0.3);
  
  // Normal mapping for surface detail
  vec3 normal = texture(normalMap, craterCoord.xy).rgb * 2.0 - 1.0;
  normal = normalize(normal + vNormal);
  
  // Lighting
  float diffuse = max(0.0, dot(normal, sunDir));
  float ambient = 0.1; // Moon surface in shadows still visible
  
  vec3 finalColor = color * (ambient + diffuse * 0.9);
  
  // Rim shadows: darker at crater rims
  float rimShadow = sin(craters * 20.0) * 0.1;
  finalColor -= rimShadow * (1.0 - diffuse) * 0.2;
  
  gl_FragColor = vec4(finalColor, 1.0);
}
```

**Mare & Highlands**

Two distinct surface types:

- Mare (dark plains): lava-flooded impact basins, dark gray
  - Color: #4C4C4C
  - Smooth texture, fewer craters (filled in by lava)
  - Names: Sea of Tranquility, Sea of Serenity, etc.

- Highlands (bright regions): anorthosite-rich, heavily cratered
  - Color: #BEBEBE
  - Rough, chaotic terrain
  - Names: Lunar mountains, feldspathic highlands

**Crater Types**

Multi-scale crater morphology:

- Large basins (100+ km): complex structure
  - Terraced walls
  - Central peaks or rings
  - Extensive ray systems
  
- Medium craters (10-100 km): simple structure
  - Sharp rim
  - Central peak or pit
  - Moderate ray system

- Small craters (<10 km): simple bowl shape
  - No central peaks
  - Faint rays

**Ray Systems**

High-velocity ejecta creates bright rays:

- Extend from young craters
- Color: brighter gray (#CCCCCC)
- Most prominent: Tycho crater (south) and Copernicus (center)
- Animation: rays fade over time (space weathering)

**Regolith Texture**

Fine dust covering surface:

- Appearance: granular, slightly rough texture
- Color: gray, slightly darker than exposed bedrock
- Distribution: everywhere except fresh crater ejecta

**Earthshine on Night Side**

Faint illumination from Earth:

- Visible at LOD0-1 when Earth is crescent from Moon's perspective
- Effect: night side dimly visible (not pure black)
- Color: faint blue-gray (Earth's light)
- Animation: varies with Earth's phase

**Limb Darkening**
- Coefficient: 0.35

**Bloom Settings**
- Intensity: 0.0 (Moon is not bright)
- Radius: 0
- Color: none

**Size Scaling**
- `radiusInUnits = 0.27`

---

## Small Bodies

### Asteroids by Type

**C-Type (Carbonaceous)**

Most common asteroid type:

- Color: very dark gray (#3C3C3C)
- Texture: rough, porous surface
- Material: carbonaceous compounds, hydrated minerals
- Reflectivity: low (~5%)
- Shader: dark, minimal specular reflection
- Shape: irregular, tumbling
- Size: typically < 1 km

**S-Type (Silicate)**

Rocky asteroids:

- Color: bright gray-brown (#B8860B)
- Material: silicate minerals, some metal
- Reflectivity: moderate (~20%)
- Shader: directional lighting, some specularity
- Shape: angular, faceted
- Size: variable

**M-Type (Metallic)**

Metallic asteroids:

- Color: steel gray (#808080)
- Material: iron-nickel alloys
- Reflectivity: very high (~40%+)
- Shader: strong specular highlights, metallic appearance
- Animation: glints and sparkles as asteroid rotates
- Shape: irregular, chunky

**V-Type (Basaltic)**

Volcanic asteroids:

- Color: dark gray (#696969)
- Material: basalt from differentiated parent body
- Reflectivity: low-moderate (~15%)
- Shader: matte finish, slight specularity
- Shape: irregular

**Irregular Shape Geometry**

Asteroids are not spheres:

- Mesh: irregular polyhedron or procedurally generated lumpy sphere
- Dimensions: aspect ratios 1:2 to 1:5 typical
- Surface features: facets, jagged edges, impact craters
- Rendering: at LOD0-1, individual surface details visible

**Tumbling Rotation Animation**

All asteroids spin:

```glsl
// Per-frame, rotate asteroid by angular velocity
vec3 rotationAxis = normalize(randomVector); // Random axis
float rotationSpeed = 0.1 * (randomFloat()); // Radians/frame
mat4 rotationMatrix = rotationMatrixFromAxisAngle(rotationAxis, rotationSpeed);

asteroidMesh.quaternion.multiplyMatrices(rotationMatrix, asteroidMesh.quaternion);
```

- Rotation axis: random, typically slow
- Period: minutes to hours (simulated)
- Nutation: secondary wobble (precession of rotation axis)

**Rubble Pile vs. Monolith**

Visual distinction:

- Rubble pile asteroids: chunky appearance, composite-looking
  - Shader: multiple facet colors, misaligned surfaces
  - Particle effect: optional loose regolith around surface
  
- Monolithic asteroids: more uniform, solid appearance
  - Shader: cohesive color, smooth transitions between facets

**Crater Detail**

Asteroids have small impact craters:

- Crater density: lower than Moon (smaller time-integrated impacts)
- Crater size: mostly sub-kilometer
- Appearance: shallow, bowl-shaped
- Shader: subtle rim shadows and rays

**Bloom Settings**
- Intensity: 0.0 (asteroids are dim)
- Radius: 0

**Size Scaling**
- `radiusInUnits = size_km / 1000.0`
- Range: 0.001 - 0.1 units for visible asteroids

---

### Comets

**Nucleus**

Solid core of ice and rock:

- Shape: irregular "potato" shape
- Color: very dark (#1C1C1C), nearly black
- Material: water ice, frozen gases, embedded rock
- Size: typically 1-10 km
- Texture: rough, cratered surface
- Animation: tumbles slowly

**Coma (Nebulosity)**

Expanding halo of gas and dust:

- Particle system: 1,000,000+ particles
- Shape: expanding sphere
- Color: yellow-white (#FFFACD)
- Animation: particles stream outward radially
  - Velocity: 0.5-1 km/s
  - Density: decreases with distance
  - Lifetime: particles visible for 1-5 minutes before fading

**Dust Tail**

Visible, curved stream of dust:

- Particle system: 500,000 - 2,000,000 particles
- Color: yellow-white (#FFFACD), slightly warmer than coma
- Shape: curved, follows orbital path
- Curvature: caused by solar radiation pressure (not actual wind)
- Animation:
  - Particles drift sunward (radiation pressure)
  - Tail grows as comet approaches sun
  - Tail shrinks and detaches as comet recedes
- Length: can exceed 100 million km (visible at LOD2+)

**Ion Tail**

Straight, blue tail:

- Particle system: 100,000 - 500,000 particles
- Color: bright blue (#4169E1)
- Shape: straight, points directly away from sun
- Composition: ionized gases (CO+, etc.)
- Animation: particles move away from sun directly
- Visibility: fainter than dust tail, visible only at LOD0-2

**Cometary Jets**

Active outgassing regions:

- Particle system: narrow streams of gas from sunlit side
- Origin: specific regions where ice sublimates
- Direction: perpendicular to surface (ice sublimation direction)
- Color: white (#FFFFFF)
- Animation: particles eject from nucleus, contributing to coma
- Frequency: new particles spawn continuously during outgassing

**Tail Growth/Shrinkage**

Comet activity varies with distance:

- Animation: tail size modulated by proximity to star
  - At perihelion (closest): maximum outgassing, largest tail
  - At aphelion (farthest): minimal outgassing, tail nearly invisible
- Shader: scale particle emission rate based on star distance

**Surface Composition Variation**

Different ices sublime at different rates:

- Water ice sublimation: dominant until ~2 AU from sun
- CO and CO2 sublimation: at larger distances
- Dust-to-gas ratio: changes over time
- Visual effect: tail characteristics change as composition shifts

**Bloom Settings**
- Intensity: 1.2 (coma and tails glow from sunlight scattering)
- Radius: 12
- Color: white-yellow

**Size Scaling**
- Nucleus: 0.001 - 0.01 units
- Coma: extends to 0.1 - 1.0 units
- Tail: extends beyond visible at most LODs

---

## Nebula Rendering

### Emission Nebula (H II Region)

**General Specifications**
- Composition: ionized hydrogen, helium, trace elements
- Color: characterized by narrowband emission lines
- Temperature: 7,000 - 10,000 K
- Density: 100 - 10,000 particles/cm³

**Volumetric Shader using Raymarching**

Volumetric nebulae are rendered with raymarching:

```glsl
#version 300 es
precision highp float

#define STEPS 64
#define STEP_SIZE 0.1

uniform sampler3D nebulaDensity;
uniform vec3 cameraPos;
uniform mat4 volumeMatrix;

varying vec3 vPosition;

void main() {
  vec3 rayDir = normalize(vPosition - cameraPos);
  vec3 rayPos = cameraPos;
  
  vec3 color = vec3(0.0);
  float alpha = 0.0;
  
  for (int i = 0; i < STEPS; i++) {
    // Sample 3D density at current position
    vec3 samplePos = (volumeMatrix * vec4(rayPos, 1.0)).xyz;
    float density = texture(nebulaDensity, samplePos).r;
    
    // Temperature-based color (H-alpha, OIII, SII)
    vec3 emissionColor;
    if (density > 0.7) {
      emissionColor = vec3(1.0, 0.2, 0.0); // H-alpha red
    } else if (density > 0.4) {
      emissionColor = vec3(0.0, 1.0, 1.0); // OIII cyan
    } else if (density > 0.1) {
      emissionColor = vec3(1.0, 0.0, 0.5); // SII magenta
    } else {
      emissionColor = vec3(0.0);
    }
    
    // Accumulate color
    color += emissionColor * density * (1.0 - alpha);
    alpha += density * 0.1 * (1.0 - alpha);
    
    rayPos += rayDir * STEP_SIZE;
    
    if (alpha > 0.99) break;
  }
  
  gl_FragColor = vec4(color, alpha);
}
```

**Color Mapping (Hubble Palette)**

Narrowband imaging assigns colors to emission lines:

- H-alpha (656 nm, red): hydrogen recombination (#FF4444)
- OIII (496-501 nm, blue-green): doubly-ionized oxygen (#00CED1)
- SII (671-673 nm, red): singly-ionized sulfur (#8B0000)

Traditional mapping:
- Red channel: SII
- Green channel: H-alpha
- Blue channel: OIII

Shader implementation: sample density at each wavelength, assign to RGB

**Density Variations**

Complex internal structure:

- Pillars of Creation: tall, dense columns (stars forming)
- Globules: small, dense knots (gravitational collapse)
- Elephant trunks: long, thin protrusions
- Shader: Perlin/Voronoi noise creates hierarchical structure
- Animation: slow turbulent motion over hours/days (simulated time)

**Embedded Young Stars**

Stars illuminating nebula:

- Particle system: few to hundreds of stars embedded in nebula
- Color: hot blue-white (#DDEEFF)
- Emission: bright glow illuminating surrounding gas
- Effect: creates brightness gradients in nebula
- Shader: reduce nebula density near bright stars (stellar wind clearing)

**Ionization Front**

Boundary where UV light ionizes gas:

- Appearance: bright edge of nebula where ionization begins
- Color: transition from bright (ionized) to dark (neutral)
- Shader: sharp boundary between high and low density regions
- Effect: creates dramatic illumination

**Animation: Turbulence**

Slow turbulent motion:

```glsl
// Animate noise offset over time
vec3 animatedSamplePos = samplePos + vec3(time * 0.01);
float density = texture(nebulaDensity, animatedSamplePos).r;
```

- Velocity field: Perlin noise derivatives push particles
- Period: hours to days (simulated)
- Magnitude: subtle (10-20% of feature size drift)

**Bloom Settings**
- Intensity: 2.0 (emission nebulae are bright)
- Radius: 15 (large, glowing structure)
- Color: red (#FF4444) or mixed (Hubble palette)

**Size Scaling**
- Extent: 1-10 light-years visible at LOD2+
- Rendered as: billboard with volumetric depth when close

---

### Reflection Nebula

**General Specifications**
- Composition: dust with nearby hot star
- Color: blue from scattered light
- Density: lower than emission nebulae
- Illumination: entirely from external star

**Blue Scattered Light Shader**

Dust scatters blue light:

```glsl
#version 300 es
precision highp float

uniform sampler3D dustTexture;
uniform vec3 starPosition;
uniform vec3 cameraPos;

varying vec3 vPosition;

void main() {
  // Sample dust density
  vec3 samplePos = vPosition;
  float dustDensity = texture(dustTexture, samplePos * 0.01).r;
  
  // Scattered light from star
  vec3 toStar = normalize(starPosition - vPosition);
  float scatterAngle = dot(normalize(vPosition - cameraPos), -toStar);
  
  // Rayleigh scattering: blue dominates
  vec3 scatterColor = vec3(0.6, 0.8, 1.0); // Blue
  
  // Scattering intensity increases with dust density and forward scatter
  float scatter = dustDensity * (0.5 + 0.5 * max(0.0, scatterAngle));
  
  vec3 color = scatterColor * scatter;
  
  gl_FragColor = vec4(color, scatter);
}
```

**Filamentary Structure**

Dust arranged in filaments:

- Appearance: thin, elongated features
- Origin: magnetic field alignment
- Shader: Perlin noise with strong directional bias
- Color gradient: brighter toward illuminating star

**Lower Opacity**

Less dense than emission nebulae:

- Transparency: stars visible through nebula
- Brightness: moderate (not as bright as emission nebulae)
- Extent: can be large (1+ light-years)

**Bloom Settings**
- Intensity: 1.2 (scattered light)
- Radius: 12
- Color: blue (#6495ED)

---

### Dark Nebula

**General Specifications**
- Composition: dense dust and gas
- Appearance: dark lane against starfield
- Mechanism: absorption of background light
- Notable examples: Horsehead Nebula, Coalsack

**Rendering Approach**

Dark nebulae are rendered by SUBTRACTING stars behind them:

```glsl
#version 300 es
precision highp float

uniform sampler2D starfield;
uniform sampler3D darkDensity;
uniform vec3 cameraPos;

varying vec3 vPosition;

void main() {
  // Sample background starfield
  vec2 bgUv = normalize(vPosition).xy * 0.5 + 0.5;
  vec3 bgColor = texture(starfield, bgUv).rgb;
  
  // Sample dark nebula density
  float darkness = texture(darkDensity, vPosition * 0.01).r;
  
  // Absorption: reduce background by darkness
  vec3 color = bgColor * (1.0 - darkness);
  
  // Reddening: dust scatters blue light more (extinction increases toward red)
  color *= vec3(1.0, 0.9, 0.7) * (0.5 + 0.5 * (1.0 - darkness));
  
  gl_FragColor = vec4(color, 1.0);
}
```

**Bok Globules**

Small, dense, round nebulae:

- Appearance: very dark, nearly opaque spheres
- Composition: densest regions, actively collapsing
- Color: nearly black (#000000)
- Size: typically 0.01 - 0.1 light-years
- Effect: almost completely block background stars

**Reddening**

Dust scatters blue light preferentially:

- Stars seen through dark nebula appear redder
- Color shift: shift RGB toward red and infrared
- Effect visible at LOD1-2

**Bloom Settings**
- Intensity: 0.0 (dark nebulae emit no light)
- Radius: 0

---

### Planetary Nebula

**General Specifications**
- Composition: ionized gas shells from dying star
- Central star: white dwarf
- Structure: concentric shells, often bipolar
- Temperature: 10,000 K

**Concentric Shell Rendering**

Multiple nested glowing shells:

```glsl
#version 300 es
precision highp float

uniform vec3 starCenter;
uniform float time;

varying vec3 vPosition;

void main() {
  // Distance from central star
  float r = length(vPosition - starCenter);
  
  // Multiple shell radii
  float shell1Radius = 0.5;
  float shell2Radius = 0.7;
  float shell3Radius = 1.0;
  
  // Shell thickness
  float thickness = 0.05;
  
  vec3 color = vec3(0.0);
  
  // Innermost shell: OIII green
  float shell1 = smoothstep(shell1Radius - thickness, shell1Radius, r) 
                 * smoothstep(shell1Radius + thickness, shell1Radius, r);
  color += shell1 * vec3(0.0, 1.0, 1.0); // Cyan
  
  // Middle shell: NII red
  float shell2 = smoothstep(shell2Radius - thickness, shell2Radius, r) 
                 * smoothstep(shell2Radius + thickness, shell2Radius, r);
  color += shell2 * vec3(1.0, 0.5, 0.0); // Orange-red
  
  // Outer shell: H-alpha red
  float shell3 = smoothstep(shell3Radius - thickness, shell3Radius, r) 
                 * smoothstep(shell3Radius + thickness, shell3Radius, r);
  color += shell3 * vec3(1.0, 0.2, 0.2); // Red
  
  // Expansion animation: slowly grow radius
  float expansion = 1.0 + time * 0.001; // Very slow
  r *= expansion;
  
  gl_FragColor = vec4(color, 0.8);
}
```

**Central White Dwarf**

Bright white star illuminating nebula:

- Appearance: bright point source
- Color: white (#FFFFFF)
- Emission: high bloom
- Effect: illuminates and ionizes surrounding gas

**Bipolar Structure**

Complex morphologies:

- Bipolar: two lobes extending north-south from center
- Elliptical: more regular, round overall shape
- Point-symmetric: multiple lobes at different angles
- Ring: ring or torus geometry
- Shader: procedurally generate desired morphology

**FLIER Knots**

Fast Low-Ionization Emission Regions:

- Appearance: small bright knots in nebular shells
- Color: different color from shell (depends on ion)
- Mechanism: clumpy ejecta moving fast
- Shader: add random bright spots along shell

**Expansion Animation**

Nebula slowly expands:

```glsl
// Very slow expansion over simulated time
float expansion = 1.0 + time / 100000.0; // Expand over "100,000" units of time
vec3 expandedPos = starCenter + (vPosition - starCenter) * expansion;
```

- Period: very long (thousands of years)
- Visible effect: subtle over simulation timescale

**Bloom Settings**
- Intensity: 1.8 (ionized gas glows)
- Radius: 12
- Color: cyan (OIII dominates)

---

### Supernova Remnant

**General Specifications**
- Age: 0 - 10,000+ years
- Structure: filamentary shock fronts
- Composition: ejecta from explosion
- Mechanism: expanding shock wave

**Filamentary Shock Structure**

Thin glowing filaments:

```glsl
#version 300 es
precision highp float

uniform sampler2D filamentsTexture;
uniform vec3 remnantCenter;
uniform float age;

varying vec3 vPosition;

void main() {
  // Distance from center
  float r = length(vPosition - remnantCenter);
  
  // Filament texture (sharp, thin structures)
  vec3 filamCoord = normalize(vPosition - remnantCenter);
  float filaments = texture(filamentsTexture, filamCoord.xy).r;
  
  // Synchrotron blue glow from relativistic electrons
  vec3 color = vec3(0.4, 0.7, 1.0);
  
  // Filament brightness peaks at shell radius
  float shellRadius = age * 0.1; // Expands with time
  float shellSharpness = 2.0 / (1.0 + age * 0.01); // Broadens with age
  
  float shellBrightness = exp(-pow((r - shellRadius) * shellSharpness, 2.0));
  
  // Combine filaments with shell brightness
  color *= filaments * shellBrightness;
  
  gl_FragColor = vec4(color, shellBrightness);
}
```

**Synchrotron Blue Glow**

Relativistic electrons emit blue light:

- Color: bright blue (#6495ED)
- Mechanism: non-thermal emission from shock-accelerated electrons
- Intensity: highest at young remnants, fades over millennia

**Crab Nebula Example**

The most famous supernova remnant:

- Age: 962 years (observed in 1054 AD)
- Structure: distinctive filament pattern
- Central pulsar: rotating neutron star
- Filament pattern: visible in detail
- Synchrotron structure: dominates appearance
- Color palette:
  - Innermost (densest): intense blue-violet
  - Middle: bright blue
  - Outer (dilute): blue fading to background
- Animation: visible expansion over observation timescale

**Expansion Animation**

Shell expands at 1000+ km/s:

```glsl
float shellRadius = initialRadius + expansionVelocity * time;
```

- Period: expansion visible over decades to centuries of simulation
- Deceleration: shock slows as it sweeps up ISM
- Effect: shell broadens and dims over time

**Heavy Element Synthesis Glow**

Products of explosion:

- Nickel-56 decay: radioactive heating
- Iron-peak elements: emit in infrared
- Effect: faint glow even in dark regions
- Visible only at LOD0 with spectroscopic visualization

**Bloom Settings**
- Intensity: 1.5 (synchrotron emission bright)
- Radius: 15
- Color: blue (#6495ED)

---

## Galaxy Rendering

### Spiral Galaxy

**General Specifications**
- Structure: disk with logarithmic spiral arms
- Composition: stars, dust, gas, central bulge
- Rotation: slow, kiloparsec-scale rotation curves
- Typical size: 20-100 kpc diameter

**Logarithmic Spiral Arms**

Spiral structure uses logarithmic spiral geometry:

```glsl
#version 300 es
precision highp float

uniform sampler2D armTexture;
uniform float time;

varying vec3 vPosition;
varying vec3 vNormal;

void main() {
  // Convert to polar coordinates (disk plane)
  float r = length(vPosition.xy);
  float theta = atan(vPosition.y, vPosition.x);
  
  // Logarithmic spiral: r = a * e^(b * theta)
  // For visual style, use inverted check: do we fall in a spiral arm?
  float spiralAngle = theta - log(r) * 1.5; // 1.5 is pitch angle parameter
  spiralAngle = mod(spiralAngle, 6.28318 / 2.0); // 2 arms (can vary)
  
  // Arm density: peak in arm, valleys between
  float inArm = smoothstep(0.5, 1.5, sin(spiralAngle * 2.0));
  
  // Arm color: bright blue-white
  vec3 armColor = vec3(0.6, 0.8, 1.0);
  
  // Inter-arm color: reddish (older stars)
  vec3 interArmColor = vec3(0.8, 0.6, 0.4);
  
  // Blend arms and inter-arm
  vec3 color = mix(interArmColor, armColor, inArm);
  
  // Bulge: yellow-orange central concentration
  float bulgeRadius = 2.0;
  if (r < bulgeRadius) {
    vec3 bulgeColor = vec3(1.0, 0.8, 0.3);
    color = mix(color, bulgeColor, 1.0 - r / bulgeRadius);
  }
  
  gl_FragColor = vec4(color, 1.0);
}
```

**Spiral Arm Shader**

Density wave pattern:

- Pattern: two or more spiral arms (logarithmic curve)
- Pitch angle: 5-30° (parameter controls arm openness)
- Arm width: 2-5 kpc (broad, diffuse structures)
- Arm contrast: enhanced star formation (H II regions visible)

**Star Formation in Arms**

Arms are sites of active star formation:

- H II regions: bright pink (#FF4444) spots along arms
  - Emission from ionized hydrogen
  - Size: 100 - 1000 pc
  - Associated with young, hot stars
- Dust lanes: dark absorption lanes along inner edges of arms
  - Color: dark gray-brown (#4B4B4B)
  - Offset from brightest arm part
  - Result of density wave compressing gas, forming dust clouds

**Central Bulge**

Older stellar population in center:

- Color: yellow-orange (#FFD700 to #FFA500)
- Shape: ellipsoidal concentration
- Composition: mostly old stars (Population II)
- Size: 2-10 kpc radius depending on galaxy

**Disk Colors**

Age-based color gradation:

- Spiral arms: blue-white (young stars)
- Inter-arm regions: yellow-white (older stars)
- Center (bulge): orange-yellow (oldest stars)
- Smooth gradient with distance from center

**Dust Lanes**

Dark absorption features:

- Color: dark gray-brown
- Appearance: thin, wispy lanes
- Shape: follow spiral arm pattern
- Animation: none (static)

**Central Supermassive Black Hole**

Massive BH at galaxy center:

- Appearance: bright point source if active (AGN)
- Glow: yellow-white (#FFFACD)
- Effect: surrounding stars orbit rapidly
- Shader: bright emissive point at galactic center

**Bar Structure (Barred Spirals)**

Some spirals have central bar:

- Shape: elongated rectangle through center
- Color: brighter than disk, similar color to disk
- Spiral origin: arms emanate from bar ends
- Animation: bar rotates slowly with galactic rotation (pattern speed < orbital speed)

**Rotation Animation**

Slow galactic rotation:

```glsl
// Rotation speed: approximately 200-300 km/s at sun's distance (~8 kpc)
// Period at 8 kpc: ~230 million years
float rotationPeriod = 230000000.0; // Years
float phase = mod(time / rotationPeriod, 1.0);
float rotationAngle = phase * 6.28318;
vec2 rotatedPos = rotation(vPosition.xy, rotationAngle);
```

- Pattern: entire spiral rotates slowly
- Period: 100 million - 1 billion years
- Effect: subtle, visible over long simulation timescales

**LOD System for Galaxies**

- LOD0 (close): visible particle/star cloud structure
- LOD1: high-res disk texture with spiral detail
- LOD2: medium-res disk, arms visible
- LOD3: low-res disk texture as single sprite
- LOD4: single billboard with galaxy icon

**Bloom Settings**
- Intensity: 1.2 (young blue stars bright)
- Radius: 20 (large, extended structure)
- Color: blue (#87CEEB)

**Size Scaling**
- At LOD2: 10-20 kpc visible
- At LOD3: 100+ kpc visible (entire galaxy)
- Rendered as sprite at LOD4

---

(Continuing with remaining galaxy and large-scale structure sections...)

### Elliptical Galaxy

Smooth, featureless distribution of old stars:

- Shape: ellipsoid (can be very elongated)
- Color: uniform warm yellow (#FFD700)
- Distribution: de Vaucouleurs profile (r^1/4)
- Dust lanes: none (gas already consumed)
- Young stars: none (quenched)
- Halo: extended, faint envelope

**Shader:**

```glsl
#version 300 es
precision highp float

uniform float ellipticity; // 0 = spherical, 1 = highly elongated

varying vec3 vPosition;

void main() {
  // De Vaucouleurs profile
  float r = length(vPosition);
  float surfaceBrightness = pow(r, -0.25); // r^-0.25 profile
  
  // Old stellar population: warm yellow-orange
  vec3 color = vec3(1.0, 0.8, 0.3);
  
  // Fade toward edges
  color *= surfaceBrightness;
  
  gl_FragColor = vec4(color, surfaceBrightness);
}
```

**Bloom Settings**
- Intensity: 0.6 (old stars are dim)
- Radius: 15
- Color: yellow

---

### Irregular Galaxy

Chaotic structure, no symmetry:

- Composition: mix of young and old stars
- Dust: patchy distribution
- H II regions: bright blue-pink spots scattered
- Appearance: chaotic, disturbed

**Shader:**

Random placement of bright regions simulates irregular star formation.

**Bloom Settings**
- Intensity: 1.0
- Radius: 12

---

### Active Galaxy (AGN)

Bright nucleus outshining entire galaxy:

- Nuclear source: supermassive black hole accreting
- Jets: collimated beams of relativistic particles
  - Color: blue synchrotron (#4169E1)
  - Length: can extend millions of light-years
- Radio lobes: diffuse emission at jet termini
- Accretion disk: visible as bright nucleus
- Quasar (extreme case): nucleus so bright it dominates over galaxy

**Bloom Settings**
- Intensity: 3.0 (extremely bright nuclear source)
- Radius: 25 (large glowing jets)

---

### Interacting/Merging Galaxies

Two or more galaxies close together:

- Tidal tails: long streams of stars extending from each galaxy
- Bridges: material connecting galaxies
- Enhanced star formation: bright blue regions
- Distorted arms: spiral structure disrupted
- Animation: merger sequence shows evolution

**Bloom Settings**
- Intensity: 1.3
- Radius: 18

---

## Large-Scale Structures

### Open Star Cluster

Loose association of 100-10,000 young stars:

- Shape: no particular structure
- Distribution: irregular cloud
- Age: young (< 1 billion years)
- Size: 1-10 pc
- Embedded nebulosity: remnant birth cloud visible

**Rendering:**

Particle system of stars + volumetric nebula background.

---

### Globular Cluster

Dense, spherical collection of old stars:

- Shape: spherically symmetric
- Distribution: King profile (dense core, sparse halo)
- Age: old (10+ billion years)
- Color: warm yellow-orange (Population II)
- Size: 10-100 pc
- Number of stars: 100,000 - 10 million

**Shader:**

- LOD0-1: resolved individual stars
- LOD2: smooth gradient of star distribution
- LOD3-4: single bright sphere with glow

**Color:** Uniform warm yellow (#FFD700)

---

### Galaxy Cluster

Hundreds to thousands of galaxies in gravitational system:

- Size: millions of light-years across
- Central dominant (cD) galaxy: brightest, largest
- Intracluster medium: hot X-ray gas
- Gravitational lensing: background objects distorted

**Rendering:**

- Individual galaxies as billboards or low-detail meshes
- Intracluster gas: volumetric glow (faint, mostly invisible, optional)
- Central dominant galaxy: much brighter, larger

---

### Cosmic Filaments

Thread-like structures connecting galaxy clusters:

- Size: 10-100 million light-years
- Composition: galaxies arranged along filament
- Dark matter: scaffolding structure
- Rendered as: linear arrangement of galaxy clusters with connecting glow

---

### Cosmic Voids

Near-empty regions bounded by filaments:

- Appearance: sparse galaxy distribution
- Size: millions of light-years across
- Rendered as: regions with reduced galaxy density, slight darkening

---

### Cosmic Microwave Background

Radiation released at recombination (z ~ 1089):

- Rendered on: enormous enclosing sphere (edge of observable universe)
- Surface: temperature anisotropy map (WMAP/Planck data)
- Color scheme: false-color, blue (cool, -200 μK) to red (hot, +200 μK relative to 2.7 K)
- Animation: none (static)
- Effect: represents edge of observable universe

**Shader:**

```glsl
#version 300 es
precision highp float

uniform sampler2D wmapTexture; // WMAP/Planck map

varying vec2 vUv;

void main() {
  // Sample WMAP temperature anisotropy
  float temperature = texture(wmapTexture, vUv).r;
  
  // False color mapping
  vec3 color;
  if (temperature > 0.5) {
    // Hot: red
    color = vec3(1.0, 0.0, 0.0);
  } else if (temperature > 0.25) {
    // Warm: orange-red
    color = vec3(1.0, 0.5, 0.0);
  } else if (temperature < -0.5) {
    // Cold: deep blue
    color = vec3(0.0, 0.0, 1.0);
  } else if (temperature < -0.25) {
    // Cool: blue-cyan
    color = vec3(0.0, 0.5, 1.0);
  } else {
    // Neutral: white
    color = vec3(1.0, 1.0, 1.0);
  }
  
  gl_FragColor = vec4(color, 1.0);
}
```

---

## Post-Processing & Global Effects

### UnrealBloomPass Settings

Parameters vary by scene:

- **Stars**: Threshold 0.7, Strength 2.5, Radius 12
- **Planets**: Threshold 0.8, Strength 0.8, Radius 6
- **Nebulae**: Threshold 0.5, Strength 1.8, Radius 15
- **Galaxies**: Threshold 0.6, Strength 1.2, Radius 18

### Lens Flare

Procedural lens flare for bright stars:

- Trigger: stars with bloom > 1.5
- Shape: 6-point star or ghosting pattern
- Color: white or colored (matches star color)
- Position: along line from star to screen center
- Intensity: scales with star brightness
- Animation: none (static position)

### God Rays

Light rays from bright objects:

- Source: bright stars or nebulae
- Direction: from object toward camera
- Color: white or yellow
- Animation: subtle turbulent animation
- Intensity: moderate (doesn't dominate)

### Ambient Occlusion

For close-range surface detail (LOD0-1 only):

- Kernel size: 8 samples
- Radius: 0.5 units
- Intensity: 0.5 (subtle)
- Only applied to planets/moons with surface texture

### Color Grading

Cinematic space look:

- Saturation: -0.1 (slightly desaturated)
- Contrast: +0.15 (slight boost)
- Blue channel: +0.05 (boost blues, cinematic look)
- Orange/red channel: +0.03 (boost warm tones)
- Curves: slight S-curve for contrast

### Film Grain

Added noise for photographic quality:

- Opacity: 0.03 (very subtle)
- Grain size: 2x2 pixels
- Animated: seed changes per frame for continuous variation
- Effect: adds texture, reduces digital appearance

### Chromatic Aberration

Lens color fringing:

- Intensity: 0.002 (very subtle)
- Radius: 50 pixels from screen edge (only at edges)
- Effect: color channels shift slightly, mimics real lens aberration

### Depth of Field (Optional, Cinematic Mode)

When enabled:

- Focus distance: 50 units (adjustable)
- Focal length: 35mm equivalent
- F-stop: f/4 (moderate blur)
- Technique: circular blur in out-of-focus regions
- Performance: significant cost, optional quality setting

### Motion Blur (During Travel)

When camera moves rapidly:

- Shutter speed: 1/60 second (adjustable)
- Samples: 8 samples along motion vector
- Intensity: 0.3 - 0.8 (adjustable)
- Effect: creates sense of speed during fast camera movement

---

## Animation Specifications

### General Animation Framework

For every animated element, specify:

**1. Animation Type**
- Procedural: computed per-frame via shader/script
- Keyframe: predefined motion curve
- Particle: physics-based or velocity-field-driven
- Physics-based: gravity, collisions, forces
- Noise-driven: Perlin/Worley noise animates properties

**2. Speed/Frequency Parameters**
- Period: time for complete cycle (seconds)
- Frequency: cycles per unit time (Hz)
- Speed: units per second (linear motion)
- Amplitude: magnitude of oscillation

**3. Shader Uniform Names**
- `uniform float time;` - total elapsed time
- `uniform float speed;` - animation speed multiplier
- `uniform vec3 basePosition;` - reference position
- `uniform float amplitude;` - oscillation magnitude

**4. Performance Considerations**
- Instancing: use hardware instancing for bulk animations
- LOD: reduce animation complexity at distance
- Culling: skip animations for off-screen objects
- Baking: precompute complex animations offline when possible

### Star-Specific Animations

**Convection Cell Animation**
- Type: Procedural (Perlin noise-based)
- Period: 20-minute cells for solar-type stars
- Shader: offset texture coordinates by velocity field
- Performance: 1-2 texture samples per frame

**Sunspot Emergence/Decay**
- Type: Keyframe + Procedural
- Duration: 7-10 days emergence, 3-7 days decay
- Shader: animate spot position and shape over time
- Performance: per-spot cost minimal if < 20 spots

**Pulsation (Variable Stars)**
- Type: Procedural (sine/cosine wave)
- Period: defined per star (e.g., 300 days for Mira)
- Magnitude: ±15% radius for red giants
- Implementation: vertex shader scales position by pulsation factor
- Performance: single sine() call per vertex

**Stellar Wind (Particle System)**
- Type: Physics-based particles
- Emission rate: 1000s particles/second
- Velocity: radial outward at wind speed
- Lifetime: 5-30 seconds
- Performance: batch particles into single draw call

### Planet-Specific Animations

**Cloud Drift**
- Type: Procedural (texture coordinate offset)
- Speed: 20-100 m/s (simulated, rescaled for visibility)
- Implementation: `uv += time * windSpeed;`
- Performance: zero additional cost (built into texture sampling)

**Ocean Waves**
- Type: Procedural (multi-scale normal maps)
- Frequencies: 3 octaves at 0.1, 0.5, 2.0 Hz
- Implementation: sample multiple normal maps at different speeds
- Performance: 3-4 texture samples per pixel

**Rotating Accretion Disk**
- Type: Procedural (radial rotation)
- Speed: Keplerian (`period = sqrt(r³ / GM)`)
- Implementation: rotate texture coordinates around center
- Performance: cheap (rotation matrix)

**Tidal Locking Wobble (Eyeball Planet)**
- Type: Procedural (continuous rotation offset)
- Period: tidal locking period
- Magnitude: subtle (few degrees)
- Implementation: rotate vertex positions by small angle
- Performance: rotation matrix cost

### Nebula Animations

**Volumetric Turbulence**
- Type: Procedural (3D Perlin noise advection)
- Speed: slow, ~10% feature size per simulated hour
- Implementation: advance noise octave offset per frame
- Performance: GPU-efficient (shader-based)

**Filament Evolution**
- Type: Noise-driven
- Speed: slow undulation visible over hours
- Implementation: add time-varying noise to filament density
- Performance: minimal (noise texture lookups)

**Expansion**
- Type: Procedural (scale transform)
- Speed: inverse-square law for pressure decline
- Implementation: `scale = 1.0 + time * expansionRate;`
- Performance: cheap (single scale)

### Galaxy Animations

**Spiral Rotation**
- Type: Procedural (polar coordinate rotation)
- Speed: slow (230 million year period for Milky Way-like)
- Implementation: modify atan(y, x) by rotation angle
- Performance: negligible (arithmetic only)

**Star Field Update**
- Type: Particle-based
- Method: update positions, brightness with age
- Performance: batched, GPU-computed if possible

### Summary Table: Animation Costs

| Animation Type | Cost per Frame | LOD Reduction |
|---|---|---|
| Texture offset | O(1) | None needed |
| Normal map animation | O(1-2) samples | Skip at LOD3+ |
| Vertex scaling/rotation | O(V) vertices | Reduce vertices at LOD2+ |
| Particle system | O(N) particles | Reduce count at LOD2+ |
| Volumetric raymarching | O(steps × cost) | Reduce steps at LOD2+, skip LOD4 |
| Procedural Perlin noise | O(octaves) | Reduce octaves at LOD2+ |

---

## Extended Entity Rendering Specifications

This section provides rendering specifications for entity types defined in Doc 22 v4.2 that were not covered in the original sections above. Each entry specifies shader technique, visual parameters, animation, bloom, and LOD behavior consistent with the established rendering pipeline.

### Stars — Extended Types

#### T Tauri (Pre-Main-Sequence) — ENT-1008

**Shader Family:** `star-sphere` + `nebula-volumetric` (embedded in protoplanetary disk)

- **Surface:** Young, magnetically active. Base color #FFCC66 (warm yellow, 3500-4500 K). Large starspots covering 10-30% of surface (vs 0.2% for Sun). Spot color: #AA6600. Spot lifetime: weeks-months, migration pattern chaotic.
- **Accretion Shock:** Hot spots at magnetic poles where infalling material strikes surface. Color: white #FFFFFF, temperature 8000-10000 K. Size: 5-10% of stellar radius. Animation: intensity flickers irregularly (accretion rate variability).
- **Protoplanetary Disk:** Rendered as semi-transparent torus around star. Inner edge: 0.05 AU (sublimation radius), outer edge: 100-500 AU. Color gradient: inner (#FFD700 hot dust) → outer (#553300 cold dust). Density: FBM noise with gaps (possible planet formation). Disk thickness: H/R ~ 0.1 (geometrically thin). Shader: `nebula-volumetric` with reduced step count (32 steps), additive blending.
- **Bipolar Outflow/Jets:** Particle system along rotation axis. Color: blue #4488FF (shock-excited gas). Opening angle: 10-30°. Speed: 100-300 km/s (animated). Length: 0.1-1 pc. 50,000 particles per jet.
- **Variability:** Irregular brightness changes ±1.5 magnitudes over days-weeks. `brightness = base * (1.0 + 0.5 * fbm(time * 0.3))`
- **Bloom:** 1.6, radius 8, warm yellow

#### Red Dwarf (M-Type Main Sequence) — ENT-1009

**Shader Family:** `star-sphere` (extends M-Type Star from Section 2)

- **Surface:** Deep orange-red #FF6633 to #CC3300 (2400-3700 K). Granulation barely visible. Starspots: persistent, covering 5-15% of surface, long-lived (months-years).
- **Superflares:** Critical visual feature — M-dwarfs flare violently. Frequency: 0.5-10 per day. Duration: 10-100 seconds. Peak intensity: up to 1000× quiescent in local region. Animation: random surface point suddenly brightens to white #FFFFFF, expanding to 2-5% of surface, then fading. Particle effect: UV/X-ray burst shown as blue glow at magnetic poles. `flareIntensity = step(random, flareProb) * pow(sin(flareTime / duration * PI), 2.0)`
- **Chromospheric Emission:** Persistent Hα emission visible at limb. Color: deep red #CC0000. Rim glow: 5-10% of stellar radius.
- **Bloom:** 0.8, radius 4, orange-red (dim star)

#### Brown Dwarf (L/T/Y-Type) — ENT-1010

**Shader Family:** `star-sphere` (minimal corona) + `planet-gas` hybrid

- **L-Type (1300-2200 K):** Deep red #993300 to brown #663300. Surface shows cloud bands similar to gas giants (iron, silicate clouds). Band structure: 3-5 dark/light alternating bands. Cloud animation: slow drift, period 2-10 hours.
- **T-Type (700-1300 K):** Purple-brown #442266. Methane absorption creates blue-purple tint. Cloud clearings reveal deeper hotter layers (bright spots). Variability: cloud coverage changes over hours.
- **Y-Type (<700 K):** Near-infrared only, barely visible. Base color: very dark red #330000. Internal heat glow: faint deep red emission. Essentially invisible at most scales.
- **Weather:** Gas giant-like atmospheric dynamics — storms, vortices, cloud bands. FBM noise for cloud patterns, 4 octaves. Wind speed bands: latitude-dependent.
- **Bloom:** 0.3 (L), 0.1 (T), 0.0 (Y) — extremely dim

#### Carbon Star (C-Type AGB) — ENT-1013

**Shader Family:** `star-evolved` + `nebula-volumetric` (circumstellar envelope)

- **Surface:** Intensely red #CC0000 to #990000, one of the reddest objects in the sky. Surface temperature 2000-3500 K. Molecular absorption bands (C₂, CN) create the extreme red color.
- **Circumstellar Dust Shell:** Dense carbon-rich dust envelope. Inner radius: 2-5 stellar radii. Outer radius: 100-1000 stellar radii. Color: deep red-brown #440000, becoming darker with distance. Raymarching: 32 steps, absorption-dominated. Opacity: very high (star partially obscured).
- **Pulsation:** Mira-type variability. Period: 200-500 days. Amplitude: ±30% radius, ±2 magnitudes brightness. `radius = base * (1.0 + 0.3 * sin(2π * time / period))`
- **Mass Loss Wind:** Particle system: slow stellar wind (10-15 km/s). Dust particles stream outward. 100,000 particles. Color: dark red #660000 fading to transparent.
- **Bloom:** 1.0, radius 10 (bright but very red light)

#### Cataclysmic Variable (Classical Nova) — ENT-1014

**Shader Family:** `star-compact` + `star-sphere` (binary system)

- **System Components:** White dwarf (primary, tiny, hot) + companion (red dwarf or giant, larger, cool). Separation: 0.01-0.1 AU. Both rendered at LOD 0-1.
- **Accretion Disk:** Material from companion spirals onto white dwarf. Thin disk, inner hot (blue-white #AADDFF) → outer cool (yellow-orange #FFAA33). Keplerian rotation with hotspot where accretion stream impacts disk edge. Animation: rapid rotation, period minutes-hours.
- **Accretion Stream:** Particle trail from companion L1 point to disk. Color: yellow-white. 50,000 particles. Ballistic trajectory curving due to Coriolis force.
- **Nova Eruption (Toggle):** When enabled: sudden brightening to 10,000× normal over 1-2 days. Expanding shell of ejected material. Shell color: initially white → yellow → red as it cools. Shell expansion: 500-3000 km/s. Particle system: 500,000 particles in expanding sphere.
- **Bloom:** 1.5 (quiescent), 4.0 (nova eruption)

#### Hypervelocity Star — ENT-1015

**Shader Family:** `star-sphere` (same as appropriate spectral type) + motion trail

- **Appearance:** Same as its spectral type (typically B/A-type: blue-white). Distinguished by **motion trail** effect.
- **Motion Trail:** Particle system showing recent trajectory. 10,000 particles in thin streak behind star. Color: same as star but fading to transparent. Length: proportional to velocity (500-1700 km/s). Trail persists for visual reference.
- **Bow Shock (Toggle):** If traveling through ISM, compressed gas ahead of star. Parabolic shape. Color: Hα red #FF4444. Size: 0.01-0.1 pc. Rendered as thin mesh with emission shader.
- **Bloom:** Same as underlying spectral type

#### Protostar (Class 0/I) — ENT-1016

**Shader Family:** `nebula-volumetric` (primary) — star itself invisible inside dense envelope

- **Dense Envelope:** Star is completely enshrouded. Volumetric raymarching, 64 steps. Density: very high at center, decreasing outward. Color: dark red-brown to infrared #880000 (only thermal emission visible). Size: 0.01-0.1 pc.
- **Bipolar Outflow Cavities:** Two cone-shaped cavities carved by jets. Opening angle: 20-40°. Interior: brighter (scattered light from hidden protostar). Color: blue-white #88AAFF at cavity walls. Particle system: 100,000 particles per jet.
- **Disk Shadow:** Dark equatorial band where disk blocks light. Creates "hamburger" or "butterfly" shape in scattered light.
- **Infrared Glow:** Entire envelope glows in IR. Shader: emission color weighted by temperature profile. Central region brighter.
- **Bloom:** 0.5 (obscured), radius 15 (extended nebulosity)

### Planets — Extended Types

#### Mini-Neptune / Sub-Neptune — ENT-2009

**Shader Family:** `planet-gas` (scaled down)

- **Appearance:** Smaller than Neptune, puffy. Radius: 1.7-3.9 Earth radii. Thick H/He envelope over rocky/icy core.
- **Atmosphere:** Blue-green #66BBAA to gray-blue #8899AA. Less vivid bands than ice giants. Cloud layers: thin, high-altitude haze. FBM noise, 3 octaves, subtle contrast.
- **Haze Layer:** Thick photochemical haze (similar to Titan). Color: pale yellow #DDCC88. Reduces surface feature visibility.
- **Animation:** Slow atmospheric rotation. Wind bands: 3-4 broad zones. Cloud drift: 50-100 m/s.
- **Bloom:** 0.4, radius 6

#### Circumbinary Planet — ENT-2012

**Shader Family:** `planet-rocky` or `planet-gas` (depends on type) + dual-shadow

- **Unique Feature:** Orbits two stars → receives illumination from two light sources → casts two shadows, has two terminators.
- **Dual Lighting Shader Extension:** Fragment shader samples lighting from two sun positions. `totalLight = max(0.0, dot(N, sunDir1)) * sun1Color + max(0.0, dot(N, sunDir2)) * sun2Color`. Creates complex shadow patterns — no location ever fully dark unless both stars eclipsed.
- **Eclipse Events:** When planet transits between the two stars, rapid brightness changes. Animated as periodic dimming events.
- **Surface:** Same as underlying planet type (rocky or gaseous)
- **Bloom:** Same as underlying type

#### Directly Imaged Giant — ENT-2013

**Shader Family:** `planet-gas` + self-luminous

- **Self-Luminous:** Young (<100 Myr), hot, still contracting. Internal heat visible as infrared glow. Color: deep red #CC3300 to orange #FF6600 (1000-2000 K). NO illumination from parent star needed.
- **Surface:** Gas giant cloud bands but emitting their own light. Band contrast lower than mature giants. Silicate/iron cloud layers. Color: dark red-brown bands on orange-red background.
- **Atmosphere:** Thick, puffy (low gravity for size). Scale height large. Atmospheric glow at limb: orange-red.
- **Animation:** Slow rotation (10-20 hours). Cloud evolution: faster than mature giants (convection vigorous).
- **Bloom:** 1.2 (self-luminous), radius 8, deep red-orange

### Galaxies — Extended Types

#### Lenticular Galaxy (S0) — ENT-3005

**Shader Family:** `galaxy-elliptical` + disk component

- **Morphology:** Disk + bulge but no spiral arms. Intermediate between spiral and elliptical. Disk visible as flattened ellipsoid.
- **Color:** Old stellar population: yellow-red #DDAA66 (bulge) + paler yellow #CCBB88 (disk). Minimal blue (no star formation).
- **Dust Lane (Toggle):** Some S0 galaxies have prominent dust lanes. Thin dark band across disk plane. Rendered as absorption mask.
- **Particle Count:** 20K-50K. Distribution: de Vaucouleurs bulge + exponential disk.
- **Bloom:** 0.6, radius 8

#### Barred Spiral Galaxy — ENT-3006

**Shader Family:** `galaxy-particle` + bar density function

- **Morphology:** Spiral arms originate from ends of a central bar (not from center). Bar: elongated region of higher stellar density.
- **Bar Shader:** Bar rendered as rectangular density enhancement. `barDensity = exp(-pow(abs(x/barLength), 2.0) - pow(y/barWidth, 4.0))`. Bar color: yellow-orange (older stars). Arms transition to blue (star-forming) at bar endpoints.
- **Spiral Arms:** 2-4 arms, logarithmic spiral from bar tips. Arm color: blue #4488CC (young stars) + pink #FF6688 (H II regions).
- **Dust Lanes:** Leading edges of bar and arms. Dark absorption.
- **Particle Count:** 30K-80K. Bar: 30% of particles. Arms: 40%. Disk: 20%. Bulge: 10%.
- **Bloom:** 0.7, radius 10

#### Ring Galaxy — ENT-3007

**Shader Family:** `galaxy-particle` + ring density function

- **Morphology:** Collision product — ring of intense star formation surrounding depleted center. Dramatic visual.
- **Ring Shader:** Toroidal density enhancement at specific radius. `ringDensity = exp(-pow((r - ringRadius) / ringWidth, 2.0))`. Ring color: intense blue #3366FF (vigorous star formation) + pink H II knots.
- **Center:** Depleted, dim yellow #AA8844 (old stars pulled outward by collision).
- **Spoke Features:** Faint radial features connecting ring to center. Color: pale blue #8899CC.
- **Animation:** Ring expansion (very slow, ~50 km/s). Rotation within ring.
- **Particle Count:** 40K-80K. Ring: 70% of particles.
- **Bloom:** 1.0, radius 12 (intense star formation in ring)

#### Starburst Galaxy — ENT-3008

**Shader Family:** `galaxy-particle` + enhanced emission

- **Morphology:** Irregular or disturbed shape, extremely high star formation rate (10-100× normal).
- **Color:** Dominated by blue #3355CC (massive young stars) + bright pink #FF5588 (H II regions) + obscuring red-brown dust #663322.
- **Superwind (Toggle):** Galactic-scale outflow driven by supernovae. Bipolar cone of hot gas. Color: red Hα #FF4444. Particle system: 100K particles in biconical flow. Extent: 5-30 kpc.
- **Infrared Glow:** Dust re-emits starlight in IR. Shader: warm emission halo around galaxy. Color: orange-red #CC6633.
- **Particle Count:** 50K-100K. Star-forming clumps: 40%. Diffuse: 40%. Dust: 20%.
- **Bloom:** 1.5, radius 14 (extremely luminous)

#### Dwarf Spheroidal Galaxy — ENT-3009

**Shader Family:** `galaxy-elliptical` (minimal)

- **Morphology:** Small, diffuse, low surface brightness. Nearly invisible against background. Faint blob of old stars.
- **Color:** Pale yellow-red #CCAA88. Uniform, no structure. Ancient stellar population.
- **Size:** Small — 0.1-1 kpc diameter (vs 30 kpc for Milky Way).
- **Particle Count:** 5K-15K. Diffuse, no concentration.
- **Dark Matter:** DM-dominated. Visual indicator (toggle): faint extended blue halo showing DM extent (10× visible radius).
- **Bloom:** 0.2 (very faint)

#### Seyfert Galaxy (AGN) — ENT-3010

**Shader Family:** `galaxy-agn` (moderate AGN activity)

- **Morphology:** Spiral galaxy with bright AGN core. Host galaxy clearly visible (unlike quasars).
- **AGN Core:** Point-like bright nucleus. Type 1: unobscured, blue-white #AACCFF continuum. Type 2: obscured by torus, reddened #FFAA66.
- **Narrow-Line Region:** Biconical ionized gas. Color: green OIII #00CCCC + red Hα #FF4444. Extent: 100 pc - 1 kpc. Rendered as two translucent cones.
- **Host Galaxy:** Normal spiral structure surrounds AGN. Rendered with `galaxy-particle` shader.
- **Variability:** AGN brightness fluctuates over weeks-months. `agnBrightness = base * (1.0 + 0.3 * sin(time * 0.1))`
- **Bloom:** 2.0 (bright AGN core), radius 6 (compact)

#### Galaxy Merger — ENT-3011

**Shader Family:** `galaxy-particle` × 2 + tidal interaction

- **Morphology:** Two galaxies in collision. Tidal tails, bridges, distorted spiral arms.
- **Tidal Tails:** Long streams of stars and gas pulled out by gravitational interaction. Particle system: 30K-50K particles per tail. Color: blue (star-forming) + pale yellow (stripped old stars). Length: 50-200 kpc.
- **Bridge:** Material connecting two galaxy cores. Dense, star-forming. Color: blue-pink.
- **Starburst Regions:** Collision triggers intense star formation at interaction zones. Bright blue-pink knots.
- **Animation:** Extremely slow (collision timescale ~500 Myr). At time-acceleration: galaxies approach, tidal features develop, cores merge.
- **Particle Count:** 60K-120K (both galaxies combined). Tidal features: 30%.
- **Bloom:** 1.2, radius 15 (extended)

#### Quasar — ENT-3012

**Shader Family:** `galaxy-agn` (extreme)

- **Morphology:** AGN so bright it outshines entire host galaxy. Appears point-like at most distances.
- **Core:** Extremely bright blue-white #CCDDFF. Luminosity: 10¹²-10¹⁴ L☉. Dominates all visual output.
- **Accretion Disk:** Same as black hole accretion disk shader but scaled up. Inner: blue-white. Outer: yellow. Doppler beaming prominent.
- **Host Galaxy:** Faint, visible only at LOD 0 with AGN toggled dim. Typically elliptical or disturbed morphology.
- **Broad Absorption Lines (Toggle):** Some quasars show outflowing gas. Rendered as blue-shifted absorption halo.
- **Lyman-alpha Nebula (Toggle):** Extended Lyα emission around some quasars. Green-blue halo #44CCAA, 50-300 kpc extent.
- **Bloom:** 4.0 (extremely bright), radius 8 (compact but intense)

#### Blazar (BL Lac / FSRQ) — ENT-3013

**Shader Family:** `galaxy-agn` + jet pointed at observer

- **Morphology:** AGN with relativistic jet pointed directly at observer. Extreme brightness and variability.
- **Jet:** Appears as single bright jet (counter-jet Doppler-dimmed to invisibility). Color: blue-white #88AAFF. Superluminal knots: bright clumps moving along jet at apparent >c speed. Animation: knots propagate outward.
- **Core:** Featureless continuum, no emission lines (BL Lac) or broad lines (FSRQ). Color: blue-white to white.
- **Variability:** Rapid — minutes to days. `brightness = base * (1.0 + amplitude * fbm(time * 2.0))`. Amplitude: 0.5-3.0.
- **Host Galaxy:** Elliptical, very faint relative to blazar core.
- **Bloom:** 3.5, radius 6

#### Radio Galaxy (FR I / FR II) — ENT-3014

**Shader Family:** `galaxy-agn` + extended radio lobes

- **Morphology:** Giant elliptical galaxy with enormous radio-emitting lobes.
- **FR I (Low Power):** Jets decelerate, plumes fan out. Lobe shape: diffuse, edge-darkened. Particle system: 200K particles per lobe. Color: faint blue-purple #6666AA (synchrotron). Extent: 50-500 kpc.
- **FR II (High Power):** Jets remain collimated, terminate in bright hotspots. Lobe shape: edge-brightened with hotspot at terminus. Hotspot: bright white-blue #AABBFF. Extent: 100 kpc - 1 Mpc.
- **Host Galaxy:** Giant elliptical, yellow-red #DDAA55.
- **Jet Rendering:** Same as black hole jets but extended. Length: 10-500 kpc.
- **Bloom:** 1.5 (host) + 2.5 (hotspots in FR II)

#### Jellyfish Galaxy — ENT-3015

**Shader Family:** `galaxy-particle` + ram-pressure stripping tails

- **Morphology:** Spiral galaxy falling through galaxy cluster ICM. Gas stripped into trailing tentacles.
- **Disk:** Normal spiral but truncated. Leading edge: gas-depleted, redder. Trailing edge: compressed, enhanced star formation (blue).
- **Tentacles:** 3-6 long gaseous tails trailing behind galaxy. Particle system: 50K-100K particles per tail. Color: blue #4488CC (in-situ star formation) + pink Hα #FF6688 (ionized gas). Length: 30-100 kpc. Tails curve due to galaxy orbital motion.
- **Stripped Gas:** Diffuse warm gas between tails. Faint X-ray emission. Color: very faint blue-purple #443366.
- **Animation:** Galaxy moves through ICM. Tails stream behind.
- **Bloom:** 1.0, radius 12 (extended tails)

#### Ultra-Diffuse Galaxy (UDG) — ENT-3016

**Shader Family:** `galaxy-elliptical` (ultra-low surface brightness)

- **Morphology:** Size of Milky Way but 100-1000× fewer stars. Nearly invisible. The challenge is making it visible while conveying its ghostliness.
- **Color:** Pale yellow-red #BBAA88, extremely faint. Surface brightness: 24-28 mag/arcsec² (barely above sky background).
- **Rendering Strategy:** Render as very faint particle cloud with enhanced transparency. Alpha: 0.1-0.3 at maximum. Visible mainly by contrast against darker void behind it.
- **Globular Clusters:** UDGs are rich in GCs. Render 5-20 bright point sources embedded in faint halo.
- **Particle Count:** 5K-10K, very diffuse distribution.
- **Bloom:** 0.05 (nearly zero)

#### Compact Elliptical Galaxy (cE) — ENT-3017

**Shader Family:** `galaxy-elliptical` (concentrated)

- **Morphology:** Very small but dense. Stellar density comparable to globular cluster core. Radius: 0.1-1 kpc.
- **Color:** Yellow-orange #DDAA44 (old stellar population). Bright core, steep luminosity gradient.
- **Sérsic Profile:** High Sérsic index (n=4-6). Concentrated light profile. `brightness = exp(-b_n * ((r/r_e)^(1/n) - 1))`
- **Tidal Features (Toggle):** Stripped tidal debris if near giant galaxy. Faint streams extending 5-10× galaxy radius.
- **Particle Count:** 15K-30K, highly concentrated.
- **Bloom:** 0.8, radius 4 (small but bright)

### Small Bodies — Extended Types

#### Kuiper Belt Object (KBO) — ENT-4007

**Shader Family:** `asteroid-instanced` (icy variant)

- **Surface:** Icy surface, reddish color from irradiated organics. Color: #AA7755 (classical KBO) to #CCAA88 (scattered disk object). Some bluish-white #DDDDEE (resurfaced by collision/outgassing).
- **Shape:** Irregular at small sizes. Larger KBOs (>400 km) approach spherical.
- **Companion:** Many KBOs are binaries. Render as two bodies orbiting common center. Mutual orbit period: days to months.
- **Atmosphere (Toggle, Pluto-like):** Thin nitrogen/methane atmosphere for largest KBOs. Faint blue limb haze #AABBDD.
- **Bloom:** 0.0 (reflected sunlight only, very dim)

#### Centaur — ENT-4008

**Shader Family:** `asteroid-instanced` + optional cometary activity

- **Surface:** Intermediate between asteroid and comet. Color: red-gray #887766. Some show cometary activity (coma/tail) at perihelion.
- **Cometary Activity (Toggle):** When near Sun: faint coma. Particle system: 10K-50K particles. Color: pale yellow-white. Much fainter than true comets.
- **Bloom:** 0.0-0.3 (depends on activity)

#### Interstellar Object — ENT-4009

**Shader Family:** `asteroid-instanced` or `comet-full` (hyperbolic trajectory)

- **Appearance:** Same as asteroid or comet but on hyperbolic orbit (e>1). Distinguished by trajectory visualization.
- **Trajectory Trail:** Hyperbolic path rendered as dotted line. Color: cyan #00FFFF (distinct from elliptical orbit lines). Shows incoming direction and outgoing direction.
- **Outgassing (Toggle):** Some ISOs show cometary activity (like 2I/Borisov). Use comet shader if active.
- **Surface:** Unknown composition. Color: gray #888888 (neutral) or reddish #AA6644 (like 'Oumuamua).
- **Bloom:** 0.0

#### Trojan Cluster — ENT-4010

**Shader Family:** `asteroid-instanced` (cluster rendering)

- **Morphology:** Cloud of asteroids at L4/L5 Lagrange points. Rendered as instanced asteroid field.
- **Distribution:** Elongated cloud, 60° ahead/behind planet. Extent: ~30° in orbital longitude.
- **Instance Count:** 10K-50K per cluster. Each instance: randomly rotated irregular mesh.
- **Color:** C-type dominant: dark gray #3C3C3C. Some D-type: reddish #774422.
- **Bloom:** 0.0

#### Meteoroid Stream — ENT-4011

**Shader Family:** particle system (orbital tube)

- **Morphology:** Debris trail along cometary orbit. Rendered as thin tube of particles following orbital path.
- **Particle System:** 100K-500K particles distributed along orbital ellipse. Tube cross-section: 0.01-0.1 AU radius.
- **Color:** Faint gray-white #AAAAAA. Individual particles barely visible.
- **Intersection Visualization (Toggle):** When Earth's orbit intersects stream, highlight intersection region. Color: bright yellow #FFDD00. Shows meteor shower radiant point.
- **Bloom:** 0.0

#### Dwarf Planet (Ceres-type) — ENT-4012

**Shader Family:** `planet-rocky` (simplified, small)

- **Surface:** Cratered, gray with bright spots (sodium carbonate deposits on Ceres). Base color: dark gray #555555. Bright spots: white #FFFFFF, scattered.
- **Shape:** Oblate spheroid (rotation-flattened). Oblateness: 0.02-0.08.
- **Craters:** Multi-scale crater field similar to Moon but shallower. Central peaks in large craters.
- **Haze/Outgassing (Toggle):** Some dwarf planets show transient atmosphere/haze. Faint water vapor haze: #BBCCDD.
- **Bloom:** 0.0

### Large-Scale Structure — Extended Types

#### Galaxy Cluster — ENT-5001

**Shader Family:** `galaxy-billboard` (members) + `nebula-volumetric` (ICM)

- **Member Galaxies:** 100-1000+ galaxies rendered as billboard sprites at cluster scale. Concentrated toward center. Dominant galaxy: brightest, yellow-red.
- **Intracluster Medium (ICM):** Hot gas fills cluster volume. Rendered as faint volumetric emission. Color: very faint blue-purple #221133 (X-ray emission, represented visually). Raymarching: 24 steps (performance-conscious). Extent: 1-5 Mpc.
- **Gravitational Lensing (Toggle):** Background galaxies distorted into arcs. Use lensing shader from blackhole family, scaled up. Arc color: blue (high-z galaxies).
- **Bloom:** 0.3 (diffuse ICM glow)

#### Cosmic Void — ENT-5003

**Shader Family:** minimal — render as absence

- **Morphology:** Near-empty region 20-300 Mpc across. Defined by what ISN'T there.
- **Rendering Strategy:** Reduce background star/galaxy density to near-zero within void boundary. Dark region contrasted against surrounding filaments.
- **Boundary Indicator (Toggle):** Faint wireframe sphere or shell showing void extent. Color: dim gray #333333, dashed lines. Transparency: 0.1-0.2.
- **Void Galaxy (Rare):** Occasional isolated galaxy within void. Emphasized by isolation.
- **Bloom:** 0.0

#### Globular Cluster — ENT-5004

**Shader Family:** `star-point` (instanced, dense)

- **Morphology:** Spherical, dense star cluster. 100K-1M stars. Central density: extremely high (thousands of stars per cubic pc).
- **Rendering:** Instanced point sprites, 10K-50K rendered stars (LOD-dependent). King profile density: `density = k / (1 + (r/r_c)²)`. Color: predominantly yellow-red #DDAA66 (old population). Blue stragglers: rare blue points #4488FF scattered in core.
- **Core Collapse (Toggle):** Some GCs have collapsed cores. Higher central concentration, brighter core.
- **Tidal Tails (Toggle):** Faint stellar streams extending from cluster. 5K-10K particles in two opposing tails.
- **Bloom:** 0.8, radius 6 (concentrated brightness)

#### Open Star Cluster — ENT-5005

**Shader Family:** `star-point` (instanced, loose)

- **Morphology:** Loose, irregular grouping of 50-3000 stars. Young, blue-dominated.
- **Rendering:** Instanced points, 500-3000 rendered stars. Irregular shape, no clear center. Color: blue-white #88AADD (young OB associations) mixed with yellow #DDCC88 (older members).
- **Nebulosity (Toggle):** Young clusters embedded in remnant birth nebula. Faint blue reflection nebulosity around cluster. Raymarching: 16 steps, very faint.
- **Proper Motion (Toggle):** Show convergent point — arrows indicating common motion of cluster members.
- **Bloom:** 0.5, radius 8 (diffuse)

#### Galaxy Supercluster — ENT-5006

**Shader Family:** `cosmic-web` (sub-region)

- **Morphology:** Collection of galaxy clusters connected by filaments. Extent: 100-300 Mpc.
- **Rendering:** Cluster nodes (bright points) + connecting filaments (density-weighted lines). Color: filaments #444466, nodes #8888AA (brighter). Void regions between: dark.
- **Member Highlighting (Toggle):** Named member clusters highlighted with labels and connection lines.
- **Bloom:** 0.2 (diffuse)

#### Lyman-alpha Blob — ENT-5007

**Shader Family:** `nebula-volumetric` (extragalactic scale)

- **Morphology:** Giant cloud of hydrogen gas glowing in Lyα emission. Size: 100-300 kpc. Found at high redshift (z=2-6).
- **Color:** Green-blue #44CCAA (Lyα at rest frame, shifted to visible for display purposes). Irregular, blobby shape.
- **Density:** FBM noise, 4 octaves. Clumpy, filamentary internal structure.
- **Embedded Galaxies (Toggle):** 1-3 galaxies visible inside blob. Starburst or AGN-powered.
- **Raymarching:** 32 steps. Emission-dominated (no absorption).
- **Bloom:** 1.0, radius 15 (large, diffuse glow)

### Exotic Objects — Extended Types

#### Kilonova — ENT-6001

**Shader Family:** `star-sphere` (transient) + expanding ejecta

- **Event:** Neutron star merger. Brief, brilliant event.
- **Initial Flash:** Blue-white #AACCFF, fading to red #FF4444 over days. `color = mix(blue, red, min(1.0, timeSinceEvent / 7.0))` (7-day transition).
- **Ejecta:** Expanding cloud of r-process elements. Particle system: 200K particles in expanding sphere. Speed: 0.1-0.3c. Color: transitions blue → red → infrared over days.
- **Opacity:** Lanthanide-rich ejecta becomes very opaque (red), lanthanide-poor stays blue. Two-component model: polar (blue) + equatorial (red).
- **Gravitational Wave Indicator (Toggle):** Concentric rings expanding from merger site. Color: cyan #00FFFF, wireframe. Represents GW emission.
- **Bloom:** 3.0 (peak), decaying to 0.5 over 2 weeks

#### Gamma-Ray Burst (GRB) — ENT-6002

**Shader Family:** `star-compact` + jet (extreme)

- **Jet:** Ultra-relativistic jet. Beamed emission. Color: intense white-blue #CCDDFF. Opening angle: 3-10°. Extends 0.01-1 pc initially.
- **Afterglow:** Jet decelerates in ISM, creating broadband afterglow. Expanding ring of emission. Color: transitions from X-ray blue → optical white → radio red over hours-months.
- **Host Galaxy:** Often faint, irregular, star-forming galaxy in background.
- **Duration Indicator:** Short GRB (<2s) = NS merger. Long GRB (>2s) = collapsar. Visual: short = compact flash, long = sustained beam.
- **Bloom:** 5.0 (brightest transient in universe), radius 4 (collimated)

#### Gravitational Lens — ENT-6003

**Shader Family:** `blackhole` lensing shader (scaled to galaxy/cluster mass)

- **Morphology:** Foreground mass (galaxy or cluster) bending light from background source into arcs, rings, or multiple images.
- **Einstein Ring:** Complete ring if alignment perfect. Color: blue #4488CC (lensed high-z galaxy). Ring radius depends on mass and geometry.
- **Partial Arcs:** More common than full ring. 2-4 distorted arc images of same background source.
- **Magnification Map (Toggle):** Show caustic/critical curves as overlay. Color: cyan wireframe #00FFFF.
- **Lensing Shader:** Same Schwarzschild deflection as blackhole shader but with extended mass distribution (SIS or NFW profile).
- **Bloom:** 1.0 (lensed images can be magnified 10-100×)

#### Pulsar Wind Nebula — ENT-6004

**Shader Family:** `nebula-volumetric` + `star-compact` (central pulsar)

- **Central Pulsar:** Rendered with `star-compact` shader (beam sweep, magnetic field).
- **Nebula:** Synchrotron emission from relativistic particles. Color: blue-white #AAAAFF. Shape: expanding ellipsoid, jet-torus structure. Torus: equatorial, brighter. Jets: polar, narrower.
- **Internal Structure:** Wisps and knots moving outward from pulsar. Particle system: 50K particles. Animation: outward expansion at ~1000 km/s.
- **Interaction with SNR (Toggle):** If embedded in supernova remnant, show PWN inside SNR shell. Two nested volumetric renders.
- **Raymarching:** 32 steps for nebula. Emission-dominated.
- **Bloom:** 1.5, radius 10

#### Type Ia Supernova — ENT-6005

**Shader Family:** `star-sphere` (transient) + expanding ejecta

- **Peak Brightness:** Standardizable candle. Peak: absolute magnitude -19.3. Color at peak: blue-white #CCDDFF.
- **Light Curve Animation:** Rise to peak over ~17 days, then decline. `brightness = peak * exp(-0.5 * pow((time - tPeak) / sigma, 2.0))` with `sigma` ~12 days rise, ~30 days decline.
- **Ejecta:** Expanding shell of iron-group elements. Speed: 10,000-15,000 km/s. Particle system: 300K particles in expanding sphere. Color: initially white → yellow → red over weeks.
- **Silicon Absorption (Toggle):** Si II absorption feature visible as blue-shifted dark band in spectrum. Visual: dark ring around ejecta at specific radius.
- **Bloom:** 4.0 (peak), decaying following light curve

#### Accretion Disk (Generic) — ENT-6006

**Shader Family:** `blackhole` accretion sub-shader (reusable)

- **Geometry:** Thin disk from innermost stable circular orbit (ISCO) to truncation radius. Inclination: variable (face-on to edge-on).
- **Temperature Profile:** `T(r) = T_inner * (r_inner / r)^(3/4)`. Inner: blue-white 10⁷ K. Outer: red 10³ K.
- **Doppler Beaming:** Approaching side brighter, receding dimmer. `doppler = 1.0 + 0.3 * cos(azimuth - orbitalPhase)`
- **Turbulence:** FBM noise on disk surface for density variations. Spiral density waves.
- **Edge-On View:** Disk appears as thin bright line with central dark gap (shadow of compact object).
- **Bloom:** 2.5, radius 8

#### Bow Shock Nebula — ENT-6007

**Shader Family:** `nebula-volumetric` (thin shell)

- **Morphology:** Parabolic shock front ahead of fast-moving star. Compressed ISM glows.
- **Shape:** Stand-off distance: 0.01-0.5 pc from star. Parabolic to hyperbolic curvature. Thin shell, 0.001-0.01 pc thickness.
- **Color:** Infrared-bright (24 μm), represented as warm orange-red #FF6633 for visibility. Inner edge: brighter (shock-heated). Outer edge: fainter.
- **Raymarching:** 16 steps (thin shell, few steps needed). Emission-dominated.
- **Central Star:** Rendered behind bow shock. O/B-type or runaway star.
- **Bloom:** 0.5, radius 6

#### Cosmic Microwave Background — ENT-6008

**Shader Family:** Skybox texture shader (equirectangular)

- **Rendering:** Rendered as spherical shell at maximum rendering distance (edge of observable universe). Equirectangular projection of temperature map.
- **Color Mapping:** Temperature anisotropies ΔT/T ~ 10⁻⁵. False color: cool (blue #4444FF) → average (green #44CC44) → hot (red #FF4444). Planck color scale.
- **Texture:** Pre-baked from Planck data, downsampled to HEALPix Nside=512 → equirectangular 2048×1024 KTX2.
- **Dipole (Toggle):** Show CMB dipole (our motion relative to CMB frame). One hemisphere hotter (red), opposite cooler (blue).
- **Multipole Decomposition (Toggle, Research Mode):** Show individual spherical harmonic components l=2, l=3, etc.
- **Bloom:** 0.0 (uniform background)

#### Fast Radio Burst Source — ENT-6009

**Shader Family:** `star-compact` + burst flash

- **Quiescent:** Appears as compact object (magnetar?) in host galaxy. Dim, point-like.
- **Burst Event:** Millisecond-duration flash. Animation: sudden brightening to 10⁶× quiescent, then immediate fade. Duration: 1-10 ms (rendered as 3-5 frames at 60 FPS for visibility). Color: white #FFFFFF.
- **Dispersion Visualization (Toggle):** Show frequency-dependent arrival time. Higher frequency arrives first. Rendered as rainbow-colored expanding ring: violet inner → red outer.
- **Repeater Indicator:** Some FRBs repeat. Show periodic burst pattern if repeater.
- **Bloom:** 5.0 (peak, brief), 0.0 (quiescent)

#### Circumstellar Envelope / AGB Shell — ENT-6010

**Shader Family:** `nebula-volumetric` (concentric shells)

- **Morphology:** Nested shells of ejected material from AGB star mass loss episodes. 3-10 concentric shells.
- **Shell Rendering:** Each shell: thin spherical surface with density variations. Radii: 0.01-1 pc. Separation: 1000-10000 year intervals → geometric spacing.
- **Color:** Inner shells: warm yellow-orange #FFAA44 (recent, warm dust). Outer shells: cool red-brown #663322 (old, cold dust). Central star visible through gaps between shells.
- **Raymarching:** 48 steps. Multiple density peaks at shell radii.
- **Animation:** Shells expand slowly outward. Inner shell faster (more recent ejection).
- **Bloom:** 0.5, radius 12

#### Supermassive Black Hole — ENT-6011

**Shader Family:** `blackhole` (scaled up)

- **Same as stellar black hole shader** but with parameters scaled to 10⁶-10¹⁰ M☉. Event horizon: 0.001-400 AU.
- **Accretion Disk:** Larger, cooler outer regions. Inner: UV/X-ray hot (blue-white). Outer: optical-IR (yellow-orange). Extends to ~1000 R_s.
- **Jet Scale:** Jets extend kpc-Mpc scale. Visible at galaxy scale. Uses `galaxy-agn` jet sub-shader for extended rendering.
- **Sphere of Influence (Toggle):** Show gravitational influence radius. Wireframe sphere at r_influence. Color: dim yellow #666633.
- **Star Orbits (Toggle):** Nearby stars on tight orbits (like S-stars around Sgr A*). Render orbital ellipses. Animation: stars orbit at relativistic speeds near pericenter.
- **Bloom:** 3.0 (accretion), radius 10

#### X-ray Binary — ENT-6012

**Shader Family:** `star-compact` + `star-sphere` (binary)

- **System:** Compact object (NS or BH) + companion star. Separation: tight, 0.01-1 AU.
- **Accretion Stream:** Material flows from companion via Roche lobe overflow. Particle system: 50K particles along ballistic trajectory from L1 point.
- **Accretion Disk (smaller than AGN):** Compact, hot disk around compact object. Inner: extremely hot blue-white #CCDDFF. Outer: cooler yellow. Fast rotation.
- **X-ray Emission (Toggle):** Bright point source at compact object. Color: blue-purple #8866FF (representing X-ray). Variability: rapid flickering (ms-seconds).
- **Jet (Toggle):** Some X-ray binaries (microquasars) have jets. Scaled-down version of AGN jets. Length: 0.01-1 pc.
- **Bloom:** 2.0, radius 4

#### Tidal Disruption Event (TDE) — ENT-6013

**Shader Family:** `blackhole` + disrupted star debris

- **Event:** Star torn apart by SMBH tidal forces. Dramatic transient.
- **Disruption Animation:** Star mesh stretches into elongated stream as it approaches BH. Vertex shader: apply tidal deformation `stretch = tidalForce * (pos - center)`. Star material forms thin stream orbiting BH.
- **Debris Stream:** Half the star falls into BH (forms accretion disk), half escapes on hyperbolic orbits. Particle system: 300K particles. Bound material: spiraling inward (bright, hot). Unbound material: escaping outward (fading).
- **Accretion Flare:** Brightens over weeks as debris circularizes. Peak luminosity: ~10⁴⁴ erg/s. Color: UV-blue #6688FF initially, transitioning to optical white-yellow over months.
- **Light Curve:** Rise: ~30 days. Decay: t^(-5/3) power law. `brightness = peak * pow(max(0.0, time - tPeak) / t0 + 1.0, -5.0/3.0)`
- **Bloom:** 3.5 (peak), decaying with light curve

#### Heliosphere / Astrosphere — ENT-6014

**Shader Family:** boundary surface shader (thin shell)

- **Morphology:** Teardrop-shaped boundary where stellar wind meets ISM. Leading edge (nose): 100-200 AU. Trailing edge (heliotail): 1000+ AU.
- **Termination Shock:** Inner boundary where solar wind decelerates from supersonic. Rendered as faint inner shell. Color: yellow #DDCC44, wireframe with partial fill.
- **Heliopause:** Outer boundary, contact surface between solar and interstellar plasma. Rendered as outer shell. Color: blue #4488AA. Semi-transparent.
- **Bow Shock (Optional):** If star moves supersonically through ISM. Rendered as outermost parabolic surface. Color: red #CC4444.
- **Heliosheath:** Region between termination shock and heliopause. Faint volumetric fill. Color: purple #664488, very low opacity.
- **Bloom:** 0.0 (diagnostic overlay, not emissive)

---

## Exotic Objects (ENT-8010..8025) — Full Shader Specs (T48.0)

This section expands the 1-liner Doc 17 entries into Doc-18-grade shader specs:
uniform list, palette, animation rule, speculative confidence tag (1–5, where
1 = well-characterised, 5 = pure theory), raymarch strategy, and reference
image when available. Magnetar (ENT-8020) is already covered under §Neutron
Star / Pulsar; the remaining 15 entries below own three shipped kinds (Black
Hole, Pulsar, Magnetar were shipped in T28 against aliased ENT-IDs) and 13
newly specced kinds delivered by T48.1.

Global conventions (apply to every shader in this section unless noted):

- **Geometry:** `BoxGeometry(2, 2, 2)` — unit cube in mesh-local space.
  Fragment shader raymarches the cube; helper `cosmos_rayAabb` returns
  `(tNear, tFar)`. Mirrors T27 nebula convention.
- **Vertex shader:** shared `exotic.vert`. Passes `v_modelPos` +
  `v_rayOriginLocal` (camera pre-inverted on CPU to save a per-vertex
  `inverse`).
- **Blending:** `NormalBlending`, `transparent: true`, `depthWrite: false`,
  `DoubleSide` — safe fly-through.
- **Raymarch step count:** `#define EXOTIC_STEPS` (default 48; speculative
  kinds that only modulate a thin shell drop to 32).
- **Speculative badge:** Doc 22 §2.1 mandates confidence tier ≥ 4 entries
  default OFF + carry `[SPECULATIVE]` label in InfoPanel. Confidence tags
  below gate the default-OFF behaviour; the shader itself always renders.
- **HDR multiplier:** every emissive term multiplied by a per-kind
  `intensity` uniform so the bloom pass picks up the feature. Dark-halo /
  void kinds use non-emissive alpha compositing.

Cross-reference summary:

| ENT-ID | Name | Shader file | Family | Confidence | Default |
|--------|------|-------------|--------|-----------:|---------|
| ENT-8010 | Quark Star | `exotic-compact.frag` | Compact | 4 | ON |
| ENT-8011 | Strange Star | `exotic-compact.frag` | Compact | 4 | ON |
| ENT-8012 | Preon Star | `exotic-compact.frag` | Compact | 5 | OFF |
| ENT-8013 | Boson Star | `exotic-compact.frag` | Compact | 5 | OFF |
| ENT-8014 | Gravastar | `exotic-compact.frag` | Compact | 5 | OFF |
| ENT-8015 | White Hole | `exotic-gr-extreme.frag` | GR-extreme | 5 | OFF |
| ENT-8016 | Wormhole | `exotic-gr-extreme.frag` | GR-extreme | 5 | OFF |
| ENT-8017 | Cosmic String | `exotic-topology.frag` | Topology | 4 | ON |
| ENT-8018 | Dark Matter Halo | `exotic-dark.frag` | Dark | 2 | ON (educational) |
| ENT-8019 | Dark Energy Void | `exotic-dark.frag` | Dark | 2 | ON (educational) |
| ENT-8020 | Magnetar | `exotic-magnetar.frag` | (shipped) | 1 | ON |
| ENT-8021 | Thorne-Żytkow | `exotic-tzo.frag` | TZO | 3 | ON |
| ENT-8022 | Primordial BH | `exotic-primordial.frag` | Primordial | 3 | ON |
| ENT-8023 | Quasi-Star | `exotic-quasi-star.frag` | Quasi | 4 | ON |
| ENT-8024 | Planck Star | `exotic-planck.frag` | Quantum | 5 | OFF |
| ENT-8025 | Naked Singularity | `exotic-gr-extreme.frag` | GR-extreme | 5 | OFF |

---

### ENT-8010 — Quark Star (shader family `exotic-compact`)

**Doc 17 cross-ref:** §ENT-8010 (CFL-phase variant).

- **Surface approach:** sphere, `u_surfaceRadius = 0.22` (local units inside
  the unit-cube). Shaded via `cosmos_fbm(p × u_surfaceFbmScale, 4)` for
  fine-scale ripple.
- **Palette:** `u_surfaceColor = #551199` (deep purple, CFL). Alternative
  cyan `#004466` dialect exposed via palette swap; production uses purple.
- **Animation rule:** `surface = base * (0.85 + 0.15 × fbm)`; subtle shimmer
  via `sin(u_time × 0.5)` modulation of `fbm` seed.
- **Interior hint:** radial red-orange glow `#FF6644` via `exp(-r × 4)` term.
- **Cooling burst (optional):** faint blue `#CCDDFF` pulse every
  `~10/u_burstRate` seconds — Gaussian in time, amplitude driven by
  `u_burstIntensity`.
- **Uniforms (kind-specific):** `u_surfaceRadius`, `u_surfaceFbmScale`,
  `u_surfaceColor`, `u_interiorColor`, `u_interiorFalloff`,
  `u_shimmerSpeed`.
- **Confidence:** 4 — no confirmed observation; PSR J1614-2230 proposed.
- **Reference:** none (artist's impression only).

### ENT-8011 — Strange Star (shader family `exotic-compact`)

- **Surface approach:** same sphere geometry as Quark Star;
  `u_surfaceRadius = 0.24` (slightly larger).
- **Palette:** `u_surfaceColor = #00FFDD`. Flavour-asymmetry tint adds a
  low-frequency gradient to `#0044FF` via `cosmos_valueNoise(p × 1.5)`.
- **Animation rule:** iridescence from `mix(baseCyan, deepBlue, lfNoise)` —
  sweeps as `u_time × 0.05` rotates the noise seed.
- **Crystalline bump:** fine `cosmos_fbm(p × 10, 3)` modulates `surface`
  brightness ±0.15.
- **Uniforms:** shared compact family; kind selected via `#define
  EXOTIC_COMPACT_STRANGE`.
- **Confidence:** 4 — RXJ1856-3754 proposed, NS interpretation preferred.

### ENT-8012 — Preon Star (shader family `exotic-compact`)

- **Surface approach:** diffuse fuzzy point. Emission term uses
  `exp(-(r/R)²) × shimmer` with `R = u_surfaceRadius × (1 + 0.1 ×
  sin(u_time × 10 + hash))` — quantum uncertainty makes the radius wobble.
- **Palette:** core `#0A0A0F`; quantum-foam shimmer `#001100` (green) +
  `#100010` (purple) alternating per cell.
- **Virtual pairs:** sparse stochastic `cosmos_hash31(cell)` gating fires
  tiny red+blue flashes near surface.
- **Confidence:** 5 — purely theoretical.

### ENT-8013 — Boson Star (shader family `exotic-compact`)

- **Surface approach:** essentially invisible Gaussian density envelope.
  Render a faint lavender outline contour at `r = u_surfaceRadius` plus a
  dim lensing-wobble term (Henyey-Greenstein-style `cosmos_henyeyGreenstein`
  forward-peak at `g = 0.6`).
- **Palette:** outline `#5533FF` @ α 0.15; inner contour `#8866FF` @ α 0.05.
- **Breathing pulsation:** `u_radius * (1 + 0.03 × sin(u_time ×
  u_pulseRate))`.
- **Lensing hint:** UV-style wobble of background via `fwidth` approx
  (no true screen-space pass inside the cube — keep it cheap; full lensing
  handled by post `BlackHoleLensingPass` downstream).
- **Confidence:** 5 — axionic dark matter candidates only.

### ENT-8014 — Gravastar (shader family `exotic-compact`)

- **Surface approach:** thin `cosmos_shellBrightness(r, r_shell, 0.01)`
  shell. Inside shell: de Sitter glow `#FFFFCC` at α 0.08. Outside shell:
  photon-ring highlight `#FFAA00` (torus at `r = 1.5 × r_shell`).
- **Palette:** shell `#AADDFF`; interior `#FFFFCC`; photon ring `#FFAA00`.
- **Shell oscillation:** `r_shell *= 1 + 0.02 × sin(u_time × 0.5)` —
  slow breathing.
- **Confidence:** 5 — Mazur-Mottola proposal; observational GW-echo
  signature under search.

---

### ENT-8015 — White Hole (shader family `exotic-gr-extreme`)

**Doc 17 cross-ref:** §ENT-8015.

- **Core:** bright sphere at `r = u_coreRadius × (1 + 0.05 sin)`, colour
  `#FFFFDD`, intensity ×5. Dominates bloom.
- **Jet pair:** bipolar cones along +Y / -Y (same `cosmos_bipolarMask`
  as pulsar). Jet palette `#FF8844 → #FFFF44`, velocity indicator via
  `cosmos_fbm(vec3(p.x, p.y + u_time × u_jetFlowRate, p.z))`.
- **Outflow particles:** radial wisps from core, encoded as additive
  `pow(1 - r, 2) × shimmer` layer.
- **Animation rule:** time-reversed accretion — jets *emit* outward (positive
  divergence); contrast with BH accretion which `-u_time` seeds.
- **Uniforms:** `u_coreColor`, `u_jetColor1`, `u_jetColor2`,
  `u_jetHalfAngle`, `u_jetLength`, `u_jetFlowRate`.
- **Confidence:** 5 — speculative endpoint of BH evaporation.

### ENT-8016 — Wormhole (shader family `exotic-gr-extreme`)

- **Throat geometry:** approximated by a torus-like band at `r = u_throatRadius`.
  Inside the throat (`r < u_throatRadius`): fake "tunnel" glow via
  exponential decay plus a deep blue gradient. Outside: normal empty
  space.
- **Light ring:** bright `#FFFF88` torus at `r = u_lightRingRadius`,
  additive, intensity ×3. Slowly precesses with `u_time × 0.01`.
- **Background lensing stand-in:** since full screen-space lensing lives in
  `BlackHoleLensingPass`, the shader only adds a rim-lit indicator — a
  swirled stripe pattern that reads as "warped" without requiring the
  post pass.
- **Palette:** throat `#4455AA` @ α 0.3; light ring `#FFFF88` ×3; interior
  darkening `#0A0A1F`.
- **Confidence:** 5 — Morris-Thorne requires exotic negative-energy matter.

### ENT-8025 — Naked Singularity (shader family `exotic-gr-extreme`)

- **Point emission:** single bright point at origin, `#FF44FF` magenta,
  intensity ×8. Rendered as Gaussian `exp(-(r × 40)²)` so it reads as a
  sharp speckle at the cube centre.
- **Extreme lensing wake:** pseudo-caustic radial streaks via
  `cos(atan(p.z, p.x) × 12 + u_time)` modulated by `pow(1 - r, 4)` —
  looks like light streaking around the singularity.
- **Photon-sphere hint:** dim cyan `#AACCFF` ring at `r = 0.3`.
- **Confidence:** 5 — cosmic censorship violation; likely forbidden by
  quantum gravity.

---

### ENT-8017 — Cosmic String (shader family `exotic-topology`)

**Doc 17 cross-ref:** §ENT-8017.

- **Geometry stand-in:** axial line along Y with exponential radial falloff
  `exp(-(ρ / u_stringRadius)²)`. The true cosmic string is 1D but we glow
  it to 2–4 pixel wide so it's visible.
- **Palette:** `u_stringColor = #AAFFFF`, intensity ×4. Additive.
- **Gentle undulation:** `ρ'= ρ + 0.03 × sin(p.y × 3 + u_time × 0.4)` —
  oscillation amplitude tunable via `u_waveAmp`.
- **Lensing-wake indicator:** two ghost copies of the string offset by
  `±u_lensingOffset` in X, dimmer alpha, illustrates the double-image
  lensing signature without the full screen-space pass.
- **Confidence:** 4 — no confirmed observations but constraints exist
  from Planck CMB (Gμ/c² < 10⁻⁷).

---

### ENT-8018 — Dark Matter Halo (shader family `exotic-dark`)

**Doc 17 cross-ref:** §ENT-8018. Default-ON educational overlay.

- **Density volume:** NFW profile `ρ(r) = ρ_s / (x(1+x)²)` where `x = r/r_s`.
  Accumulate additive emission through the raymarch.
- **Palette:** colour map on density: high → `#FF4444`, mid → `#FF9944`,
  low → `#4444FF`. Alpha scaled with `density × 0.4`.
- **Isodensity contour:** `#FFDDAA` ring at a configurable iso-level
  (toggle via `u_isoLevel`).
- **Animation rule:** static density field; optional slow rotation.
- **Confidence:** 2 — dark matter existence well-established; NFW profile
  standard ΛCDM prediction.
- **Reference:** Millennium simulation screenshots.

### ENT-8019 — Dark Energy Void (shader family `exotic-dark`)

**Doc 17 cross-ref:** §ENT-8019.

- **Inverse density volume:** density *drops* with proximity to centre
  (opposite of halo). `ρ(r) = smoothstep(0, u_voidRadius, r)`.
- **Palette:** interior `#000010` (cold/empty); boundary `#2040AA`
  (cosmological horizon hint).
- **Hubble-flow arrows (optional toggle):** small radial streaks via
  `cosmos_hash31(cell)` gated particles. Outward-flowing via time
  advection `p.z += u_time × u_hubbleRate`.
- **Confidence:** 2 — dark energy detected via Planck + SN Ia surveys;
  voids surveyed in SDSS BOSS.

---

### ENT-8021 — Thorne-Żytkow Object (shader `exotic-tzo`)

**Doc 17 cross-ref:** §ENT-8021.

- **Outer envelope:** large red-giant sphere `u_envelopeRadius = 0.9`.
  FBM granulation (`cosmos_fbm(p × 1.5, 4)`) modulates thickness.
- **Core:** tiny bright neutron-star nucleus at origin `#6699FF` intensity
  ×10 — reads as a bright speckle through the envelope.
- **Thermal gradient:** near-core zone `#FFFF88` (10⁵–10⁶ K hot shell
  inside envelope).
- **Palette:** envelope `#DD4444`; core `#6699FF`; hot-shell `#FFFF88`.
- **Animation rule:** slow envelope rotation (`u_time × 0.02`), very slow
  core pulsation.
- **Confidence:** 3 — HV 2112 strong candidate, not confirmed.

---

### ENT-8022 — Primordial Black Hole (shader `exotic-primordial`)

**Doc 17 cross-ref:** §ENT-8022.

- **Core:** small black sphere `r = u_horizonRadius = 0.08` (smaller than
  stellar BH per mass-asteroid default).
- **Hawking radiation glow:** thermal Planck-spectrum approximation. Colour
  depends on effective temperature `u_hawkingTemperature`:
  - T ∈ [0.1, 10] K → `#FF4444` (faint IR/red)
  - T ∈ [10, 100] K → `#FFDD88`
  - T ∈ [100, 1e4] K → `#CCFFFF` (hot blue-white)
- **Evaporation jets (optional, for evaporating regime):** isotropic
  particle wisps.
- **Photon ring:** thin `#FFAA44` ring at `r = 1.5 × u_horizonRadius`.
- **Palette:** `u_hawkingColor` (temperature-mapped), `u_horizonColor =
  #000000`.
- **Confidence:** 3 — viable dark matter candidate in specific mass ranges.

---

### ENT-8023 — Quasi-Star (shader `exotic-quasi-star`)

**Doc 17 cross-ref:** §ENT-8023.

- **Envelope:** very large yellow-white sphere `u_envelopeRadius = 0.95`.
  Pale `#FFFFDD` with low-frequency FBM granulation (cells ~100 R☉, scale
  0.8).
- **Interior glow:** volumetric additive `exp(-r × 3)` layer `#FF9944` —
  the embedded BH accretion bleeding through.
- **Polar hot-spot indicator:** faint temperature gradient to whiter at
  poles, yellower at equator.
- **Wind emission:** outward `cosmos_fbm(p × 2 + vec3(0, u_time × 0.1, 0))`
  modulates thin halo outside envelope.
- **Palette:** envelope `#FFFFDD`; interior `#FF9944`; wind `#FFFF99`.
- **Confidence:** 4 — JWST candidates under search; theoretical early-BH
  seed mechanism.

---

### ENT-8024 — Planck Star (shader `exotic-planck`)

**Doc 17 cross-ref:** §ENT-8024.

- **Core:** extremely small point at origin. Gaussian `exp(-(r × 80)²) ×
  shimmer`, colour rapidly cycled through `#FF88FF ↔ #88FFFF ↔ #FFFF88` via
  `u_time × u_hueSpeed`.
- **Quantum fuzz halo:** volumetric high-frequency noise `cosmos_fbm(p ×
  20 + u_time × 5, 3)` layered as additive shimmer.
- **Bounce ripple (optional):** expanding bright shell triggered by event
  uniform `u_bouncePhase` ∈ [0, 1].
- **Palette:** core rainbow cycle; shimmer `#4444FF` subtle.
- **Confidence:** 5 — loop quantum gravity speculation.

---

Implementation notes shared across T48.1 shaders:

- Every shader #includes `lib/noise.glsl` + `lib/volumetric.glsl`.
- Front-to-back compositing loop mirrors `exotic-magnetar.frag` (§shipped):
  `accumColor += (1 - accumAlpha) × emission × stepSize`.
- Outputs `vec4(accumColor, accumAlpha)` into `GLSL3` `out fragColor`.
- Logarithmic depth handled identically to other exotic shaders under
  `#ifdef USE_LOGARITHMIC_DEPTH_BUFFER`.
- CLAUDE.md Rule #1 (no textures) — every colour and structure is
  procedural.

---

## Sound Design Mapping

Each entity type should have procedural audio characteristics:

### Star Types

**O-Type Star**
- Base frequency: 200-300 Hz (deep, powerful)
- Waveform: sine wave
- Modulation: 10-20 Hz (pulsing rhythm)
- Timbre: pure, resonant
- Volume: loud

**G-Type Star (Solar)**
- Base frequency: 100-150 Hz
- Waveform: sine + slight harmonics
- Modulation: 5-10 Hz
- Timbre: warm, familiar
- Volume: moderate

**M-Type Star**
- Base frequency: 50-100 Hz
- Waveform: rich harmonics
- Modulation: slow, subtle
- Timbre: deep, almost subsonic
- Volume: quiet

**Red Giant**
- Base frequency: 80-120 Hz
- Waveform: multiple harmonics
- Modulation: 0.5-2 Hz (slow pulsation)
- Timbre: whooshing, swelling
- Volume: moderate to loud

**White Dwarf**
- Base frequency: 500-1000 Hz
- Waveform: pure sine, high harmonics
- Modulation: rapid (10+ Hz)
- Timbre: bright, piercing
- Volume: high-pitched, attention-grabbing

**Neutron Star / Pulsar**
- Base frequency: 50-5000 Hz (pulsar frequency)
- Waveform: sharp pulses
- Modulation: 0.001 - 1000 Hz (rotation rate)
- Timbre: clicking, pulsing
- Volume: variable with pulse

**Black Hole**
- Base frequency: sub-audible, 1-20 Hz
- Waveform: deep sine
- Modulation: chaotic/turbulent
- Timbre: ominous, unsettling
- Volume: low rumble

### Planet Types

**Gas Giants**
- Base frequency: 150-250 Hz
- Waveform: complex, multi-harmonic
- Modulation: 1-5 Hz (wind/storm patterns)
- Timbre: swirling, ethereal
- Volume: moderate

**Terrestrial Planets**
- Base frequency: 100-200 Hz
- Waveform: sine + noise (atmosphere)
- Modulation: subtle
- Timbre: calm, stable
- Volume: low to moderate

**Lava World**
- Base frequency: 200-400 Hz
- Waveform: crackling, pop-like (magma)
- Modulation: rapid, chaotic
- Timbre: harsh, roiling
- Volume: loud, intense

**Ocean World**
- Base frequency: 100-200 Hz
- Waveform: sine with wave-like modulation
- Modulation: 0.1-1 Hz (wave motion)
- Timbre: soothing, rhythmic
- Volume: moderate

### Nebulae

**Emission Nebula**
- Base frequency: 200-400 Hz
- Waveform: harmonic series
- Modulation: slow, 0.1-0.5 Hz
- Timbre: choir-like, ethereal
- Volume: moderate

**Dark Nebula**
- Base frequency: 50-100 Hz (sub-bass)
- Waveform: deep drone
- Modulation: minimal
- Timbre: ominous, empty
- Volume: low, barely audible

**Supernova Remnant**
- Base frequency: 300-600 Hz
- Waveform: explosive burst + fading
- Modulation: rapid decay
- Timbre: shocking, then fading to hum
- Volume: very loud initially, then quiet

### Galaxies

**Spiral Galaxy**
- Base frequency: 80-150 Hz
- Waveform: harmonic complex
- Modulation: 0.01-0.1 Hz (very slow rotation)
- Timbre: grand, majestic
- Volume: moderate

**Black Hole / AGN**
- Base frequency: 20-100 Hz
- Waveform: chaotic, turbulent
- Modulation: rapid, unpredictable
- Timbre: ominous, powerful
- Volume: very loud

### Implementation Notes

- **Real-time synthesis**: use Web Audio API to generate procedural sound
- **Layering**: combine base tone + modulation + harmonics
- **Distance attenuation**: volume decreases with distance (inverse square law)
- **Doppler shift**: frequency shifts based on relative motion (if applicable)
- **Muting**: disable audio in silent mode or when zoomed far out

---

## FINAL SPECIFICATIONS SUMMARY

This document provides complete rendering and animation specifications for all entity types in Cosmos Explorer. Key design principles:

1. **Realism through detail**: Every entity has realistic surface features, lighting, and behavior.
2. **Performance scaling**: LOD system ensures 60 FPS across all devices.
3. **Aesthetic excellence**: Colors, bloom, and shaders create visually stunning results.
4. **Scientific accuracy**: Rendering respects physical laws while allowing artistic enhancement.
5. **Immersive experience**: Animations, sound, and post-processing create an engaging, cinematic universe.

All specifications are implementation-agnostic and can be adapted to any rendering framework (Three.js, Babylon.js, WebGL, etc.).

---

## SRS / PRD Cross-Reference Matrix

Every rendering specification in this document maps to one or more formal requirements. This matrix provides full traceability for QA verification.

### Star Rendering

| Doc 18 Section | SRS Requirement | PRD Requirement | Description |
|----------------|----------------|-----------------|-------------|
| Star Rendering (Main Sequence) O–M types | FR-STAR-001 – FR-STAR-016 | FR-CORE-001, FR-055, FR-056, FR-057 | Per-spectral-type shader, point/billboard/sphere LOD |
| Stellar Evolution Classes | FR-STAR-001 – FR-STAR-016 | FR-057 | Red Giant, Supergiant, Wolf-Rayet, White Dwarf evolution rendering |
| Neutron Star / Pulsar | FR-STAR-001 – FR-STAR-016 | FR-148 | Beam sweep, magnetic field, PWN, rotation animation |
| Black Hole | FR-SHDR-001, FR-SHDR-005 | FR-079, FR-095, FR-111, FR-149 | Lensing shader, accretion disk, jets, Einstein ring |

### Planet Rendering

| Doc 18 Section | SRS Requirement | PRD Requirement | Description |
|----------------|----------------|-----------------|-------------|
| Rocky Planets (Mercury, Venus, Mars, Earth) | FR-PLAN-R-001 – FR-PLAN-R-007 | FR-032, FR-047 | Surface shaders, atmosphere, clouds, weather |
| Gas Giants (Jupiter, Saturn, Uranus, Neptune) | FR-PLAN-G-001 – FR-PLAN-G-009 | FR-032, FR-034, FR-047 | Band structure, storms, ring systems, ice giant shaders |
| Exotic Planets (Magma, Ocean, Carbon, Rogue, Eyeball) | FR-PLAN-R-001 – FR-PLAN-R-007 | FR-CORE-001 | Lava flow, ocean dynamics, tidally-locked rendering |
| Hot Jupiter | FR-PLAN-G-001 – FR-PLAN-G-009 | FR-CORE-001 | Incandescent atmosphere, evaporating envelope |

### Moon Rendering

| Doc 18 Section | SRS Requirement | PRD Requirement | Description |
|----------------|----------------|-----------------|-------------|
| Luna | FR-ENT-COMMON-001 | FR-033 | Mare/highland distinction, crater morphology, earthshine |
| Io, Europa, Titan, Enceladus, Ganymede | FR-ENT-COMMON-001 | FR-033 | Volcanic, cryogenic, hazy, geyser, magnetic moon shaders |

### Small Bodies

| Doc 18 Section | SRS Requirement | PRD Requirement | Description |
|----------------|----------------|-----------------|-------------|
| Asteroids (C/S/M/V types) | FR-ENT-COMMON-001 | FR-037 | Irregular geometry, tumbling rotation, rubble/monolith distinction |
| Comets | FR-ENT-COMMON-001 | FR-038 | Nucleus + coma + dual tails (dust/ion) + jets, perihelion activity |

### Nebula Rendering

| Doc 18 Section | SRS Requirement | PRD Requirement | Description |
|----------------|----------------|-----------------|-------------|
| Emission Nebula (Volumetric Raymarching) | FR-SHDR-005, FR-ISM-001 | FR-CORE-001 | 64-step raymarching, Hα/OIII/SII emission lines |
| Planetary Nebula | FR-SHDR-005 | FR-CORE-001 | Shell structure, central star illumination |
| Dark Nebula | FR-ISM-001 – FR-ISM-003 | FR-CORE-001 | Absorption shader, background star occlusion |
| Supernova Remnant | FR-ENT-COMMON-001 | FR-CORE-001 | Expanding shock shell, filamentary structure |

### Galaxy Rendering

| Doc 18 Section | SRS Requirement | PRD Requirement | Description |
|----------------|----------------|-----------------|-------------|
| Spiral Galaxy | FR-ENT-COMMON-001 | FR-076, FR-077, FR-081, FR-083, FR-084 | Density function, spiral arms, dust lanes, particle system |
| Elliptical Galaxy | FR-ENT-COMMON-001 | FR-081 | Smooth gradient, de Vaucouleurs profile |
| Irregular Galaxy | FR-ENT-COMMON-001 | FR-081 | Chaotic structure, star-forming regions |
| Active Galaxy / AGN | FR-ENT-COMMON-001 | FR-095 | Accretion disk, jets, torus |

### Large-Scale Structure

| Doc 18 Section | SRS Requirement | PRD Requirement | Description |
|----------------|----------------|-----------------|-------------|
| Cosmic Web | FR-CSWEB-001 – FR-CSWEB-004 | FR-101, FR-102, FR-103 | Filament shader, void visualization, density-weighted rendering |

### Cross-Cutting Systems

| Doc 18 Section | SRS Requirement | PRD Requirement | Description |
|----------------|----------------|-----------------|-------------|
| LOD System (5 levels) | FR-ENT-COMMON-004, SRS-F002 | FR-019, FR-021 | Cross-fade transitions, texture/geometry/particle LOD |
| Post-Processing Chain | FR-SHDR-001 | FR-174 | Bloom, tone mapping, FXAA, chromatic aberration, film grain |
| Instanced Rendering | SRS-NF019 | FR-055 | 10K stars/draw call, 100K asteroids, 1M+ particles |
| Animation Specifications | FR-ENT-COMMON-001 | FR-CORE-001 | Per-entity animation params, cost table |
| Sound Design Mapping | FR-ENT-COMMON-001 | FR-151 | Procedural audio per entity type |
| Toggle Feature Integration | FR-TOGGLE-001 – FR-TOGGLE-003 | FR-174 | Shader uniform mappings (see Doc 22) |

### Non-Functional Requirements

| Doc 18 Section | SRS Requirement | PRD Requirement | Description |
|----------------|----------------|-----------------|-------------|
| LOD system & instancing | SRS-NF001, SRS-NF019 | 60 FPS / 30 FPS targets | Performance scaling across GPU tiers |
| Shader fallback | FR-ENT-COMMON-006 | Graceful degradation | generic-glow fallback on compilation failure |
| Animation cost table | SRS-NF001 | Frame budget compliance | Per-animation-type cost and LOD reduction strategy |

---

## Shader Performance Budget

### Per-Entity Shader Cost (Target: Mid-Tier GPU, 16.7ms total frame budget)

| Shader Category | Max Cost per Instance | Max Concurrent | Notes |
|----------------|----------------------|----------------|-------|
| Star Point Sprite | 0.01 ms | 500,000 | Instanced, single draw call |
| Star Sphere (LOD 2-3) | 0.5 ms | 20 | Corona + granulation + limb darkening |
| Planet PBR (full) | 2.0 ms | 3 | Surface + atmosphere + clouds + city lights |
| Planet PBR (simplified) | 0.8 ms | 8 | Surface + atmosphere only |
| Moon Surface | 0.6 ms | 5 | Crater shader + regolith |
| Black Hole (full) | 3.0 ms | 1 | Lensing raytracing + accretion disk + jets |
| Nebula Volumetric | 2.5 ms | 2 | 64-step raymarching |
| Nebula Billboard | 0.1 ms | 50 | LOD 3-4 fallback |
| Galaxy Particle | 1.0 ms | 5 | 10K-100K particles per galaxy |
| Galaxy Billboard | 0.05 ms | 1,000 | LOD 4 fallback |
| Asteroid Instanced | 0.3 ms | 100,000 (batched) | Single draw call per zone |
| Comet (full) | 1.5 ms | 2 | Nucleus + coma + dual tails (2M particles) |
| Cosmic Web | 1.0 ms | 1 | Density-weighted line/mesh shader |
| Post-Processing Chain | 4.0 ms | 1 (global) | Bloom + Tone Map + FXAA + CA + Grain |

### Frame Budget Allocation (16.7ms target)

| Phase | Budget | Description |
|-------|--------|-------------|
| Scene Graph Update | 1.0 ms | Physics, position updates, LOD selection |
| Geometry Pass | 3.0 ms | All opaque geometry rendering |
| Forward Pass (stars) | 2.0 ms | Instanced star field |
| Forward Pass (planets/moons) | 3.0 ms | Max 3 full-detail planets visible |
| Volumetric Pass (nebulae) | 2.5 ms | Max 2 concurrent volumetric renders |
| Special Effects Pass | 1.5 ms | Black hole lensing, comet tails, aurora |
| Post-Processing | 3.0 ms | Full chain (reduced on low-tier) |
| UI Composite | 0.7 ms | React overlay rendering |
| **Total** | **16.7 ms** | **= 60 FPS** |

### Overbudget Fallback Strategy

When frame time exceeds 16.7ms for 10 consecutive frames:

1. **Level 1 (17-20ms):** Reduce nebula raymarching steps 64→32, disable film grain
2. **Level 2 (20-25ms):** Switch all galaxies to billboard mode, reduce star count 50%, disable chromatic aberration
3. **Level 3 (25-33ms):** Disable volumetric nebulae entirely (use billboard), reduce post-processing to bloom-only, cap star count at 100K
4. **Level 4 (>33ms):** Emergency LOD — all entities drop 2 LOD levels, disable all post-processing except tone mapping

Recovery: when frame time drops below 14ms for 30 consecutive frames, restore one quality level.

---

## Texture Pipeline Specification

### Texture Categories & Generation Method

| Category | Source | Generation Method | Format | Max Resolution | Count |
|----------|--------|-------------------|--------|---------------|-------|
| Planet Surface (diffuse) | NASA GEBCO/USGS base + procedural enhancement | Baked from satellite data + procedural detail overlay | KTX2 (ASTC) | 4096×2048 | 12 |
| Planet Surface (normal) | Height map → normal conversion | Sobel filter on height data, baked offline | KTX2 (ASTC) | 4096×2048 | 12 |
| Planet Clouds | Procedural (runtime) | 2-layer Perlin noise, generated per frame in shader | N/A (shader) | N/A | 0 |
| Noise Textures (Perlin) | Procedural (offline) | Pre-baked 3D Perlin noise, tiling | PNG R8 | 256×256×4 slices | 4 |
| Noise Textures (Worley) | Procedural (offline) | Pre-baked Worley/Voronoi cells, tiling | PNG R8 | 256×256×4 slices | 4 |
| Noise Textures (FBM) | Procedural (offline) | Pre-baked Fractal Brownian Motion, 6 octaves | PNG R8 | 512×512 | 8 |
| Star Corona | Procedural (runtime) | Perlin + Worley noise in fragment shader | N/A (shader) | N/A | 0 |
| Nebula Density | Procedural (runtime) | FBM noise raymarching in fragment shader | N/A (shader) | N/A | 0 |
| Galaxy Morphology Templates | Baked (offline) | Density functions for spiral/elliptical/irregular | PNG RGBA | 1024×1024 | 6 |
| Galaxy Dust Lane Masks | Baked (offline) | Hand-authored + noise overlay | PNG R8 | 1024×1024 | 4 |
| Asteroid Surface | Procedural (runtime) | Crater noise + faceted geometry in vertex shader | N/A (shader) | N/A | 0 |
| Moon Surface | NASA/USGS base + procedural craters | Baked base + runtime crater overlay | KTX2 (ASTC) | 2048×2048 | 6 |
| Biome Map (Earth-type) | Procedural (offline) | Climate model → biome classification, RGBA channels | PNG RGBA | 2048×1024 | 3 |
| City Lights (emissive) | Satellite data (DMSP/VIIRS) | Baked from satellite nighttime imagery | WebP | 2048×1024 | 1 |
| Ring System (Saturn-type) | Procedural (offline) | Radial opacity/color function based on Cassini data | PNG RGBA | 2048×64 | 3 |
| CMB Temperature Map | Planck satellite data | Downsampled HEALPix → equirectangular projection | KTX2 | 2048×1024 | 1 |
| Emission Spectrum LUT | Computed (offline) | Blackbody + emission line lookup tables | PNG R8 | 256×1 | 5 |
| **Total Baked Textures** | — | — | — | — | **~69 files** |
| **Total Texture Storage** | — | — | — | — | **~420 MB** |

### Noise Texture Library

Pre-baked noise textures are critical for procedural rendering. All are tileable (seamless edges):

| Texture | Resolution | Channels | Use |
|---------|-----------|----------|-----|
| `perlin_3d_256.png` (×4 slices) | 256×256 | R | Star corona, granulation, convection |
| `worley_3d_256.png` (×4 slices) | 256×256 | R | Star cellular structure, nebula clumps |
| `fbm_6oct_512.png` (×8 variants) | 512×512 | R | Nebula density, gas giant bands, lava flow |
| `curl_noise_256.png` (×2) | 256×256 | RG | Particle advection (comet tails, stellar wind) |
| `blue_noise_256.png` | 256×256 | R | Dithering, film grain seed |
| `voronoi_cells_512.png` (×4) | 512×512 | RG | Star granulation, crater distribution |

### Mipmap Strategy

| GPU Tier | Strategy | Max Loaded Resolution | Mip Bias |
|----------|----------|----------------------|----------|
| Low | Aggressive (skip top 2 mips) | 1024×1024 | +2.0 |
| Mid | Balanced (skip top 1 mip) | 2048×2048 | +1.0 |
| High | Conservative (full chain) | 4096×4096 | 0.0 |

All KTX2 textures include pre-computed mipmap chains (generated at build time using `basisu` encoder). WebP textures generate mipmaps at runtime via `generateMipmaps: true` on Three.js texture.

### Texture Streaming Priority Order

When user navigates to a new region, textures load in this order:

1. **Immediate (frame 0):** Noise textures (already in GPU memory, never evicted)
2. **Priority 1 (frame 1-5):** Selected/focused entity's diffuse + normal map
3. **Priority 2 (frame 5-15):** Nearby planets/moons within 10 AU
4. **Priority 3 (frame 15-30):** Galaxy morphology templates for visible galaxies
5. **Priority 4 (frame 30+):** Background textures (CMB, skybox, ring systems)
6. **Eviction:** LRU policy, textures not visible for 60+ seconds are evicted from GPU memory

### Normal Map Generation Workflow

```
Source Height Data (NASA SRTM/LOLA/MOLA)
  ↓
Sobel Filter (3×3 kernel, XY gradients)
  ↓
Tangent-Space Normal Map (RGB: XYZ → 128+127*N)
  ↓
Detail Normal Overlay (procedural crater/ridge noise)
  ↓
Composite (blend base + detail at 70/30 ratio)
  ↓
KTX2 Encode (ASTC 4×4 compression, sRGB=false)
  ↓
Mipmap Chain Generation (basisu, box filter)
  ↓
CDN Deploy (CloudFront, Cache-Control: max-age=31536000)
```

---

## Visual Quality Acceptance Criteria

### Per-Entity Visual Verification Protocol

Each of the 96 entity types must pass visual verification before release:

**Step 1 — Reference Acquisition**
- Acquire 2-3 real reference images per entity from NASA/ESA/JWST/Hubble public domain archives
- Store in `reference-images/{entity-type}/` (already 39 images from Doc 22 cross-check rounds)
- Document source URL, instrument, wavelength band for each reference

**Step 2 — Render Capture**
- Render entity at LOD 0 (maximum detail) with default toggle states
- Capture at 1920×1080, PNG lossless
- Capture 3 angles: front-lit, side-lit, back-lit (for atmosphere/corona verification)
- Capture at LOD 1, 2, 3, 4 for LOD transition verification

**Step 3 — Automated Comparison**

| Metric | Method | Threshold | Tool |
|--------|--------|-----------|------|
| Color Accuracy | CIE ΔE2000 between render and reference (sampled at 100 points) | ΔE < 5.0 average, ΔE < 10.0 max | `color-diff` npm package |
| Structural Similarity | SSIM index between render and reference | SSIM > 0.65 (accounting for procedural variation) | `ssim.js` |
| Bloom Halo | Measure bloom radius in pixels at known distance | ±20% of spec value | Custom pixel analysis |
| Animation Smoothness | Frame time variance during animation playback | Std dev < 2ms over 300 frames | Performance profiler |
| LOD Transition | No visible "pop" during 0.5s cross-fade | Human review + pixel diff < 5% between frames | Snapshot comparison |

**Step 4 — Human Expert Review**

| Criterion | Reviewer | Pass Condition |
|-----------|----------|---------------|
| "Does this look like a real [entity type]?" | Domain expert (astronomer or science communicator) | Subjective approval |
| Feature completeness | QA engineer with Doc 22 checklist | All toggle features render correctly |
| Scale correctness | QA engineer | Entity size relative to reference objects matches physical data |
| Color blindness accessibility | Accessibility reviewer | Entity remains distinguishable in deuteranopia/protanopia simulation |

**Step 5 — Regression Testing**

After each shader change:
- Capture snapshots of all 96 entity types at LOD 0
- Compare against baseline snapshots using perceptual hash (pHash)
- Hamming distance > 8 triggers manual review
- Baseline snapshots updated only after explicit approval

### Color Accuracy Standards

| Entity Category | Color Source | Tolerance (ΔE2000) | Notes |
|----------------|-------------|-------------------|-------|
| Stars (OBAFGKM) | Blackbody color from Teff (Ballesteros 2012 formula) | ΔE < 3.0 | Physically computed, tight tolerance |
| Planets (Solar System) | NASA/JPL true-color imagery (calibrated) | ΔE < 5.0 | Reference: Irwin et al. 2024 for Uranus/Neptune |
| Exoplanets | Theoretical models (procedural) | ΔE < 10.0 | No ground truth; artistic latitude |
| Nebulae | Narrowband emission line colors (Hα=#FF4444, OIII=#00CCCC, SII=#FF6600) | ΔE < 4.0 | Well-defined emission wavelengths |
| Galaxies | Composite RGB from survey data | ΔE < 8.0 | Color varies with filter combination |

### Animation Quality Standards

| Animation Type | Min Frame Rate | Max Jitter | Smoothness Test |
|---------------|---------------|------------|-----------------|
| Star rotation | 60 FPS | <1ms variance | No visible stutter over 10-second observation |
| Planet cloud drift | 60 FPS | <2ms variance | Smooth texture coordinate interpolation |
| Pulsar beam sweep | 60 FPS | <0.5ms variance | Critical: beam position must be frame-accurate |
| Comet tail particles | 30 FPS (particle update) | <3ms variance | Particles stream smoothly, no clumping |
| Nebula volumetric | 60 FPS | <2ms variance | No raymarching band artifacts |
| Black hole accretion | 60 FPS | <1ms variance | Doppler beaming rotation must be smooth |
| LOD cross-fade | 60 FPS | 0 dropped frames | 0.5s linear alpha blend, no pop |

---

**Document Version:** 2.0  
**Date:** 2026-04-19  
**Project:** Cosmos Explorer  
**Status:** Final Specification  

**Revision History**

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-16 | Initial rendering specification for all entity types |
| 2.0 | 2026-04-19 | Added: SRS/PRD cross-reference matrix (§17), Shader Performance Budget (§18), Texture Pipeline Specification (§19), Visual QA Acceptance Criteria (§20). Addresses Gaps 1, 4, 6, 7 from rendering audit. |
