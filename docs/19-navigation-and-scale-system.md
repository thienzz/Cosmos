# Navigation System & Scale Transition Specification

**Project:** Cosmos Explorer  
**Purpose:** Complete specification of how users discover, navigate to, and explore every entity type in an interactive 3D web-based universe visualization using Three.js/WebGL  
**Version:** 2.0  
**Date:** 2026-04-16  
**Author:** Cosmos Explorer Development Team

---

## Table of Contents

1. [Scale Architecture](#scale-architecture)
2. [Logarithmic Scale System](#logarithmic-scale-system)
3. [Navigation Methods](#navigation-methods)
4. [Entity Discovery System](#entity-discovery-system)
5. [Scale Transition Animations](#scale-transition-animations)
6. [Coordinate Systems & Reference Frames](#coordinate-systems--reference-frames)
7. [User Interface During Navigation](#user-interface-during-navigation)
8. [Performance Optimization for Navigation](#performance-optimization-for-navigation)
9. [Accessibility Navigation](#accessibility-navigation)
10. [Navigation State Machine](#navigation-state-machine)
11. [URL Deep Linking](#url-deep-linking)

---

## Scale Architecture

The Cosmos Explorer visualization system spans the entire observable universe by leveraging a hierarchical 7-level scale architecture. Each level presents a progressively larger view with appropriate visual detail, entity visibility, and camera behavior optimized for comfortable user interaction.

### Scale Levels Overview

| Scale Level | Name | Range | Unit | Camera Speed | Example View |
|---|---|---|---|---|---|
| S0 | Surface | 0 — 10 km | km | 10 km/s | Standing on planet surface |
| S1 | Orbital | 10 km — 1 AU | km, AU | 0.1 AU/s | Orbiting a planet, viewing moons |
| S2 | Planetary System | 1 AU — 100 AU | AU | 5 AU/s | Full solar system view |
| S3 | Stellar Neighborhood | 100 AU — 100 ly | ly | 10 ly/s | Nearby stars, open clusters |
| S4 | Galactic | 100 ly — 100,000 ly | ly, kly | 1 kly/s | Milky Way spiral arms |
| S5 | Intergalactic | 100,000 ly — 500 Mly | Mly | 10 Mly/s | Galaxy clusters, local group |
| S6 | Cosmic | 500 Mly — 46.5 Gly | Gly | 1 Gly/s | Cosmic web, observable universe |

### S0: Surface Scale (0 — 10 km)

**Coordinate System:**  
Geodetic coordinates (latitude, longitude, altitude) relative to selected body's center. For game-like experience on large worlds, local Cartesian coordinates with tangent-plane approximation.

**Visible Entities:**
- Terrain/surface mesh with highest detail LOD
- Large topographic features (mountains, canyons, craters, oceans)
- Atmospheric effects (clouds, aurora, hazes)
- Large structures (bases, cities, landmarks where applicable)
- Shadows and lighting based on local time of day
- Orbital objects in sky above (visible moons, stars, planets)

**Invisible/Hidden Entities:**
- All distant planets, stars, and galaxies (unless extremely bright/close)
- Small asteroids, comets
- Distant moons at horizon (unless camera is elevated)

**LOD Transition Rules:**
- Terrain uses continuous LOD based on camera distance
- Mesh detail: full resolution within 100 km, progressively simplified beyond
- Texture resolution: 4K at camera position, 1K at 10 km distance
- At 10 km altitude, trigger transition to S1 (fade out surface detail, fade in orbital perspective)

**Camera Behavior:**
- Field of View (FOV): 75 degrees (standard first-person perspective)
- Near plane: 0.1 m (allows close inspection of small objects)
- Far plane: 1000 km (planet surface always visible)
- Movement speed: 10 km/s base (adjustable via shift boost to 50 km/s, or ctrl precision at 1 km/s)
- Free-look enabled: mouse moves camera direction, WASD or arrow keys move forward/strafe
- Camera collision detection: prevent clipping through solid terrain

**Background Rendering:**
- Sky dome with stars (constellation map visible at night side)
- Sun position realistic based on orbital mechanics
- Moon(s) visible at proper phase and position
- Milky Way (if on appropriate world) visible at night
- Atmospheric scatter: Rayleigh scattering for blue sky, sunset colors

**UI Elements:**
- Altitude indicator (meters or kilometers)
- Latitude/longitude display
- Local compass (cardinal directions + up/down)
- Nearby waypoints list (landmarks, bases, notable features)
- Time of day indicator
- Threat/proximity warnings (incoming asteroids, etc.)

---

### S1: Orbital Scale (10 km — 1 AU)

**Coordinate System:**  
Spherical coordinates (azimuth, elevation, distance) centered on selected body. Transition from body-centric to star-centric at 1 AU boundary.

**Visible Entities:**
- Target body as full detailed sphere (terrain mesh transitions to simple texture)
- Moons/satellites of target body in correct orbital positions
- Orbital paths drawn as elliptical paths (optional overlay)
- Nearby asteroids and debris
- Solar wind particles (as thin directional glow)
- Host star (if orbiting a planet) or host planet (if viewing moons)
- Distant background stars

**Invisible/Hidden Entities:**
- Target body terrain detail (replaced by high-resolution texture)
- Distant planets beyond orbital hill sphere
- Galaxies and nebulae (not visible at this scale)
- Small dust particles (too small at this distance)

**LOD Transition Rules:**
- Target body: transitions from terrain mesh to single textured sphere at ~100 km
- Moon detail: appears as simple spheres with texture until within 1000 km
- Orbital paths: appear at 100 km, remain visible throughout scale
- At 1 AU, trigger transition to S2 (fade out orbital paths, reveal entire solar system structure)

**Camera Behavior:**
- FOV: 60 degrees (wider context view)
- Near plane: 1 km (asteroids visible)
- Far plane: 5 AU (entire solar system visible in limited detail)
- Movement speed: 0.1 AU/s base (roughly 15 million km/s, tuned for comfortable panning)
- Speed boost: 5x multiplier to 0.5 AU/s
- Precision mode: 0.01 AU/s
- Free-orbit mode available: circular orbit around selected body at fixed distance
- Smooth damping on all movements (0.2 second decay time constant)

**Background Rendering:**
- Star field with thousands of background stars (magnitude-dependent brightness)
- Milky Way band visible if zoomed out enough
- Zodiacal light effect (dust cloud around star, visible at sunset/sunrise angles)
- Sun corona and solar prominences (shader-based effect)
- Solar radiation pressure: slight wind-like particle effect pointing away from star

**UI Elements:**
- Distance indicator (kilometers, AU, light-seconds)
- Orbital altitude above surface
- Orbital velocity indicator
- Object list: all moons and major bodies in system
- Scale indicator: progress bar showing position between S0 and S2
- Nearest object indicator
- Time dilation warning (if relativistic effects enabled)

---

### S2: Planetary System Scale (1 AU — 100 AU)

**Coordinate System:**  
Ecliptic heliocentric coordinates. Distances in AU, positions in 3D space centered on system's star.

**Visible Entities:**
- Star (host star) as bright center point
- All planets rendered as spheres with size roughly proportional to diameter (slight exaggeration for visibility)
- Orbital ellipses for all planets
- Asteroid belt as semi-transparent particle cloud (if present)
- Kuiper Belt as diffuse ring (if present)
- Oort Cloud as faint spherical halo (optional)
- Comets on inbound/outbound trajectories with tails
- Larger moons visible as small spheres
- Distant background stars

**Invisible/Hidden Entities:**
- Planetary surface detail (replaced by solid sphere with color texture)
- Stellar neighborhood beyond ~5 light-years (rendered as star field)
- Nebulae (visible only as distant colored patches)
- Individual asteroids (rendered as cloud unless zoomed in)

**LOD Transition Rules:**
- Planets: always rendered as full spheres at this scale
- Orbital paths: fade in at 1 AU boundary, remain visible throughout
- Asteroid belt: rendered as particle cloud until zoom triggers transition to S3
- Moons: appear as dots at planets' positions, detail increases when approached
- At 100 AU (distance to Oort Cloud outer boundary), transition to S3 begins (stars brighten, system shrinks to point, nearby stellar neighborhood fades in)

**Camera Behavior:**
- FOV: 50 degrees (wide view but focused perspective)
- Near plane: 0.01 AU (asteroid-level detail)
- Far plane: 200 AU (entire solar system and near interstellar space)
- Movement speed: 5 AU/s base (comfortable pan across system in ~20 seconds)
- Speed boost: 10x to 50 AU/s
- Precision mode: 0.5 AU/s
- Damping enabled: 0.3 second decay
- Inertial scrolling available

**Background Rendering:**
- Dense starfield (10,000+ background stars, magnitude-weighted)
- Galactic plane marked with dust lane (darker band of stars)
- Zodiacal light extending from star
- Milky Way structure visible (as band of brighter region)
- Sun glow effect (halo around bright star)
- Lighting on planets from host star is dynamic

**UI Elements:**
- Distance scale: AU indicator with grid overlay (optional)
- System name and classification
- Orbital period display for selected planet
- Planet catalog: clickable list of all bodies
- Asteroid belt composition (C-type, S-type, M-type percentages)
- Comets and notable visitors list
- Scale indicator: progress bar S2 position
- Time control (speed up orbital mechanics animation)
- Ecliptic plane orientation indicator

---

### S3: Stellar Neighborhood Scale (100 AU — 100 ly)

**Coordinate System:**  
Cartesian galactic coordinates relative to local neighborhood center. Transition from AU (small scale) to light-years (large scale) at ~10 light-year boundary.

**Visible Entities:**
- Individual stars as colored points (brightness indicates luminosity)
- Open star clusters when nearby
- Nearby planetary systems faded to single points
- Nebulae as colored gas clouds (emission nebulae pink, reflection nebulae blue)
- Dust lanes as dark patches
- Notable near-Earth objects (asteroids, Oort Cloud edge)
- Supernova remnants as expanding shells (optional)
- Constellation lines (optional overlay, can be toggled)
- Background galaxy hints (if looking perpendicular to galactic plane)

**Invisible/Hidden Entities:**
- Planetary system detail (solar systems shrink to single bright point)
- Individual planets and moons (too small to render)
- Individual asteroids (part of parent system cloud)
- Distant galaxies (rendered as faint points only in voids between stars)
- CMB radiation (not visible at this scale)

**LOD Transition Rules:**
- Stars: appear as color-coded points; size indicates spectral type
- Planetary systems: rendered as bright points at system position
- Nebulae: fade in at 1 light-year distance, peak detail at 10 light-years
- Dust lanes: become visible as dark patches between stars
- At 100 light-years, transition to S4 begins (Milky Way spiral structure emerges, nearby stars merge together, open clusters become points)

**Camera Behavior:**
- FOV: 45 degrees (focused context view)
- Near plane: 0.001 ly (0.1 AU, can inspect outer system)
- Far plane: 500 ly (entire stellar neighborhood and beyond)
- Movement speed: 10 ly/s base (cross neighborhood in ~10 seconds)
- Speed boost: 5x to 50 ly/s
- Precision mode: 1 ly/s
- Damping: 0.4 second decay
- Track selected object option: camera maintains relative position

**Background Rendering:**
- Dense starfield (50,000+ background stars)
- Milky Way band increasingly visible at higher zoom levels
- Nebula glow effects overlaid on stars
- Zodiacal light visible only near home system
- Cosmic infrared background (subtle reddish tint when looking away from galactic plane)
- Dust extinction: stars behind dust clouds appear dimmer/redder

**UI Elements:**
- Distance scale with light-year grid
- Nearest star indicator (always highlighted)
- Star catalog: searchable list with spectral types and distances
- Nebula list with types (emission, reflection, dark, planetary)
- Open cluster list
- Supernova remnant list
- Constellation map (with optional lines overlay)
- Navigation breadcrumb: Local Bubble > Orion Arm > Stellar Neighborhood

---

### S4: Galactic Scale (100 ly — 100,000 ly)

**Coordinate System:**  
Galactic coordinates (galactic longitude l, galactic latitude b, distance). Origin at galactic center.

**Visible Entities:**
- Milky Way rendered as detailed spiral structure with visible arms
- Galactic center as bright nuclear bulge
- Dark dust lanes along galactic plane as shadowing
- Spiral arms: Orion, Perseus, Cygnus, Sagittarius arms color-coded
- Open and globular clusters as small bright points
- Nebulae as colored clouds (pink emission, blue reflection, dark dust)
- Pulsars rendered as blinking points (optional)
- Black holes marked with gravitational lensing effects (especially Sagittarius A*)
- Nearby galaxies appearing at boundary (Magellanic Clouds, Andromeda if looking in that direction)
- Background galaxies as faint smudges (especially if zoomed far away)
- Cosmic dust distribution affecting visibility

**Invisible/Hidden Entities:**
- Individual stars (merged into galaxy structure)
- Planetary systems (far too small)
- Sub-nebula detail
- Stellar companions and binary systems
- Accretion disks around black holes (rendered as glow only)

**LOD Transition Rules:**
- Stellar objects: transition from individual points to merged galactic structure at ~100 light-years
- Spiral arms: appear as distinct structural features at 1000 light-year scale
- Galactic center: renders detailed dust lane and nuclear bulge at <10,000 light-year distance
- Satellite galaxies: appear as distinct points at boundary approaching S5
- At 100,000 light-years, transition to S5 (Milky Way shrinks to single galaxy point, nearby galaxies brighten, cosmic web structure emerges)

**Camera Behavior:**
- FOV: 40 degrees (fixed wide context view, best for appreciating galactic structure)
- Near plane: 0.01 kly (10 light-years, can zoom into detail)
- Far plane: 1000 kly (local group of galaxies barely visible)
- Movement speed: 1 kly/s base (cross galaxy in ~100 seconds)
- Speed boost: 10x to 10 kly/s
- Precision mode: 0.1 kly/s
- Damping: 0.5 second decay
- Galactic north indicator (always visible in corner)

**Background Rendering:**
- Extremely dense starfield (100,000+ background stars, rendered as texture for performance)
- Dark dust extinction visible throughout galactic plane
- Nebulae rendered with volumetric fog effects
- Cosmic microwave background (CMB) as subtle reddish glow in background
- Light-year distance haze (further away = slightly more atmosphere/dust)
- Spiral arm structure highlighted with color-coding

**UI Elements:**
- Distance scale with kilolight-year (kly) indicators
- Galactic structure indicator (which spiral arm currently viewing)
- Nebula catalog searchable
- Star cluster catalog (open clusters, globular clusters, associations)
- Black hole list with gravitational lensing magnitudes
- Pulsar list with rotation rates
- Notable objects (Crab Nebula, Pillars of Creation, etc.)
- Galactic census statistics (estimated star count, black hole count, etc.)
- Scale progress indicator

---

### S5: Intergalactic Scale (100,000 ly — 500 Mly)

**Coordinate System:**  
Supergalactic coordinates (SGl, SGb, distance in megalight-years). Origin at Local Group centroid (between Milky Way and Andromeda).

**Visible Entities:**
- Milky Way rendered as single large spiral galaxy (detail fades)
- Andromeda Galaxy as large spiral galaxy (distance ~2.5 Mly)
- Large Magellanic Cloud as satellite galaxy
- Small Magellanic Cloud as satellite galaxy
- Triangulum Galaxy (M33)
- Other Local Group members: Centaurus A, M31, dwarf elliptical and irregular galaxies
- Virgo Cluster emerging at far boundary (as point cluster)
- Fornax Cluster (distant point cluster)
- Perseus-Pisces Supercluster structure visible at extreme distance
- Cosmic web structure: filaments and voids becoming apparent
- Galaxy groups and clusters
- Background galaxies as points distributed through cosmic volume

**Invisible/Hidden Entities:**
- Individual stars in any galaxy (rendered as galaxy aggregate)
- Stellar clusters within galaxies (merged into galaxy point)
- Planetary systems and planets (far too small)
- Nebulae (too small, part of galaxy structure)
- Interstellar medium except as dust lanes within galaxies
- Quasar jets (rendered as glow only)

**LOD Transition Rules:**
- Milky Way: transitions from detailed spiral structure to single point galaxy at 100 kly (boundary of S4)
- Andromeda: becomes visible as distinct galaxy at ~500 kly distance (approaching S5)
- Nearby galaxies: maintain individual identity throughout S5
- Galaxy clusters: form visible point clouds starting at 10 Mly
- Superclusters: filament structure emerges at 100+ Mly
- At 500 Mly, transition to S6 (galaxies become starfield-like points, cosmic web dominant, CMB sphere appears)

**Camera Behavior:**
- FOV: 35 degrees (very wide context for cosmic scale)
- Near plane: 0.1 Mly (100,000 light-years, can zoom into galaxy structure)
- Far plane: 2000 Mly (observable universe nearly entirely visible, but at reduced detail)
- Movement speed: 10 Mly/s base (cross observable universe in ~5 seconds)
- Speed boost: 10x to 100 Mly/s
- Precision mode: 1 Mly/s
- Damping: 0.6 second decay
- Supergalactic coordinate indicator

**Background Rendering:**
- Cosmic web structure: filaments bright, voids dark
- Galaxies rendered as colored points (color indicates galaxy type)
- CMB anisotropy map (as subtle background color variation)
- Dust lanes between galaxy clusters
- Quasar light (ancient light from early universe, visible as point sources)
- Gravitational lensing effects around massive clusters
- Redshift gradient (more distant = slightly more redshifted)

**UI Elements:**
- Distance scale with megalight-year (Mly) indicators
- Galaxy classification guide (elliptical E0-E7, spiral Sa-Sd, barred spiral, irregular)
- Galaxy catalog: searchable by name, type, distance
- Local Group member list (highlighted and linked)
- Galaxy cluster list with masses
- Supercluster visualization and boundaries
- Large Quasar Group boundaries (if showing structure)
- Filament and void identification
- Scale progress indicator

---

### S6: Cosmic Scale (500 Mly — 46.5 Gly)

**Coordinate System:**  
Cosmic comoving coordinates. Distance in gigalight-years (Gly) from Earth. Includes cosmological redshift component.

**Visible Entities:**
- Galaxies as point sources distributed throughout volume
- Galaxy clusters as point cloud aggregates (Virgo, Coma, Perseus, etc.)
- Superclusters as filament structures (Laniakea, Shapley Supercluster)
- Cosmic web: bright filaments of galaxy clusters, dark voids between
- Gamma-ray burst sources as brief bright points (optional animation)
- Most distant quasars as point sources (z > 7, observed in early universe)
- CMB surface as sphere boundary
- Cosmic horizon as ultimate boundary sphere
- Redshift progression visualization (galaxies more redshifted at distance)

**Invisible/Hidden Entities:**
- Individual galaxies beyond ~1 Gly distance (rendered as statistical point cloud)
- Individual stars in any galaxy
- Black holes (except as part of quasar emission)
- Nebulae
- Planets and moons
- Dark matter (visualized structurally through galaxy distributions, not directly)

**LOD Transition Rules:**
- Nearby galaxies (within 500 Mly): maintain individual galaxy appearance, slowly transition to points
- Galaxy clusters: visible as point clouds throughout
- Superclusters: filament structure visible from 1 Gly onward
- CMB surface: always visible as outer sphere, detail depends on zoom level
- Cosmic horizon: appears as ultimate outer boundary, no zoom-out beyond

**Camera Behavior:**
- FOV: 30 degrees (extremely wide cosmic perspective)
- Near plane: 0.01 Gly (10 Mly, can zoom into local structure)
- Far plane: 100 Gly (entire observable universe, well beyond actual horizon)
- Movement speed: 1 Gly/s base (cross observable universe in ~46 seconds at maximum distance)
- Speed boost: 10x to 10 Gly/s
- Precision mode: 0.1 Gly/s
- Damping: 0.7 second decay
- Comoving coordinate indicator
- "You are here" marker at position of Earth

**Background Rendering:**
- Deep cosmic field: high-density point field of distant galaxies
- Cosmic web filaments: bright regions where galaxy clusters congregate
- Voids: dark empty regions between filaments (realistic density variations)
- CMB sphere: rendered at extreme boundary as glowing sphere with temperature fluctuations
- Cosmological redshift: color shift visible on distant objects (blue nearby, red far away)
- Gravitational lensing around supercluster-scale structures
- Primordial gravitational wave background (subtle background wave effect, optional)

**UI Elements:**
- Distance scale with gigalight-year (Gly) indicators
- Redshift indicator (for high-z objects)
- Cosmic expansion visualization (optional: show expansion rate as visual effect)
- Supercluster catalog with member galaxy clusters
- Observable universe statistics (galaxy count ~2 trillion, largest structures, etc.)
- Distance to cosmic horizon indicator
- Time-distance correlation (show age of universe when objects emitted observed light)
- Scale progress indicator showing position at maximum zoom-out
- Cosmic structure type identifier (filament, cluster, void, wall)

---

## Logarithmic Scale System

### Mathematical Foundation

The universe spans approximately 40+ orders of magnitude in scale, from subatomic particles (~10^-15 m) to the observable universe (~10^26 m). Linear coordinate systems cannot represent this range within typical floating-point precision. Cosmos Explorer uses a hybrid logarithmic-linear coordinate system to maintain visual clarity and numerical stability across all scales.

**Core Formula:**

```
position_rendered = sign(position_real) × log₁₀(1 + |position_real| / reference_unit)
```

Where:
- `position_real` = actual position in real units (meters)
- `reference_unit` = scale-dependent unit (1 m at S0, 1 AU at S2, 1 ly at S4, etc.)
- `sign(position_real)` = preserves directionality (+/-)
- `position_rendered` = GPU-rendered coordinate

**Example Calculation at S4 (Galactic Scale):**

For a star at distance 10,000 light-years (actual), with reference_unit = 1 ly:
- position_real = 10,000 ly
- position_rendered = log₁₀(1 + 10,000) = log₁₀(10,001) ≈ 4.0 (in relative units)

This compression allows vast distances to be represented in a manageable coordinate space while maintaining precision for nearby objects.

### Why Logarithmic Approach

1. **Precision Across Scales:** Same coordinate system remains valid from atomic scales to cosmic scales without loss of precision
2. **Visual Clarity:** Objects at all scales remain visually distinct; distant objects don't disappear into rendering artifacts
3. **Natural Perception:** Human perception of distance is logarithmic; perceived distance scales roughly with log(actual_distance)
4. **Computational Efficiency:** Avoids redundant rendering of extremely distant dim objects; LOD naturally follows from logarithmic compression
5. **Navigation Smoothness:** Zoom transitions remain smooth even when crossing multiple orders of magnitude

### Smooth Interpolation Between Linear and Logarithmic

Close objects should use linear coordinates for precision; distant objects use logarithmic. Smooth interpolation prevents jarring transitions:

**Blended Coordinate Formula:**

```
blend_factor = clamp((distance - threshold_linear) / (threshold_log - threshold_linear), 0, 1)
position_rendered = mix(
    position_linear,
    position_logarithmic,
    blend_factor
)
```

Configuration by scale level:

| Scale | Linear Zone | Transition Zone | Log Zone |
|---|---|---|---|
| S0 | 0—1 km | 1—10 km | 10+ km |
| S1 | 0.01—0.1 AU | 0.1—1 AU | 1+ AU |
| S2 | 0.1—1 AU | 1—10 AU | 10+ AU |
| S3 | 0.1—1 ly | 1—10 ly | 10+ ly |
| S4 | 100—1000 ly | 1—10 kly | 10+ kly |
| S5 | 10—100 kly | 100—1000 kly | 1+ Mly |
| S6 | 1—10 Mly | 10—100 Mly | 100+ Mly |

### Reference Frame Transitions

As users navigate across scales, the reference frame must continuously update. At any moment, the camera operates within a primary coordinate frame, with secondary frames available as context.

**S0 (Surface) - Planet-Centric Geodetic Frame:**
- Origin: planet surface at sea level (equator)
- Axes: East, North, Up (local tangent plane)
- Transition trigger: camera altitude > 10 km
- Parent frame: Planet-centric Cartesian (XYZ)

**S1 (Orbital) - Planet-Centric Ecliptic Frame:**
- Origin: planet center
- Axes: Ecliptic X (toward vernal equinox), Ecliptic Y (90° rotated), Z (ecliptic pole)
- Distance unit: km (automatically switches to AU at 100 AU)
- Transition trigger: camera distance > 1 AU
- Parent frame: Star-centric Ecliptic

**S2 (Planetary System) - Star-Centric Ecliptic Frame:**
- Origin: star center
- Axes: Ecliptic X (toward vernal equinox from solar perspective), Y, Z
- Distance unit: AU
- Transition trigger: camera distance > 100 AU
- Parent frame: Galactic frame

**S3 (Stellar Neighborhood) - Cartesian Galactic Frame:**
- Origin: center of Local Bubble
- Axes: Galactic X (toward galactic anticentre), Y (direction of rotation), Z (toward galactic north pole)
- Distance unit: light-years (ly)
- Transition trigger: camera distance > 100 ly
- Parent frame: Supergalactic frame

**S4 (Galactic) - Galactic Coordinates:**
- Origin: galactic center (Sagittarius A*)
- Coordinates: Galactic longitude (l), latitude (b), distance (d)
- Distance unit: kilolight-years (kly)
- Transition trigger: camera distance > 100 kly
- Parent frame: Supergalactic frame

**S5 (Intergalactic) - Supergalactic Coordinates:**
- Origin: Local Group barycenter
- Coordinates: Supergalactic longitude (SGL), latitude (SGB), distance
- Distance unit: megalight-years (Mly)
- Transition trigger: camera distance > 500 Mly
- Parent frame: Cosmic comoving frame

**S6 (Cosmic) - Cosmic Comoving Frame:**
- Origin: Earth (observer position)
- Coordinates: Right Ascension (RA), Declination (Dec), Luminosity distance / Redshift (z)
- Distance unit: gigalight-years (Gly)
- No parent frame (absolute reference)

**Frame Transition Mechanics:**

When crossing a scale boundary:

1. **Pre-transition (1 second before boundary):**
   - Start fade-in of new frame coordinate axes
   - Calculate transformation between old and new frames
   - Pre-load data for new scale level

2. **During transition (while crossing boundary):**
   - Smoothly interpolate coordinate system
   - Old frame coordinates → new frame coordinates
   - Camera position remains continuous in world space
   - Visual elements fade/morph according to transition animation

3. **Post-transition (0.5 seconds after boundary):**
   - Stabilize in new frame
   - Fade out old frame visualization
   - Lock UI to new coordinate system
   - Enable frame-specific controls and options

### Floating Origin Technique

To prevent floating-point precision loss, Cosmos Explorer uses a "floating origin" approach: the camera is always mathematically at (0, 0, 0) in local space, and the entire world moves around it.

**Implementation:**

```javascript
// Actual world position of camera in double precision
const camera_absolute_position = vec3d(1e20, 5e19, 3.2e19);

// Render space is camera-relative
const render_position_object = object_absolute_position - camera_absolute_position;

// Apply logarithmic transform only to render_position
const render_position_logarithmic = apply_log_transform(render_position_object);

// Render at logarithmic position
mesh.position.copy(render_position_logarithmic);
```

**Precision Management by Scale:**

| Scale | Absolute Coordinate Type | Precision | Render Coordinate Type |
|---|---|---|---|
| S0 | Float32 (meters) | mm | Float32 |
| S1 | Float32 (km) | 10 m | Float32 |
| S2 | Float64 (AU) | 1 m | Float32 |
| S3 | Float64 (ly) | km | Float32 |
| S4 | Float64 (ly) | 100 km | Float32 |
| S5 | Float64 (Mly) | Mly | Float32 |
| S6 | Float64 (Gly) | Mly | Float32 |

The floating origin is updated whenever the camera drifts more than 10 km (in render space) from center, preventing precision loss.

### Double-Precision Considerations

At S3 and beyond, single-precision floats (32-bit) lose precision when representing actual distances. Solution: use WebGL's EXT_frag_depth extension and compute logarithmic coordinates in shader with double-precision (via two float vec4s or native Float64Array in compute shaders).

**Shader-level double precision:**

```glsl
// High/low pair representing double-precision value
vec2 double_value = highp_part + lowp_part;

// Logarithmic transform in fragment shader with sufficient precision
float log_distance = log10(1.0 + length(double_value) / reference_scale);

// Apply to depth and position calculations
gl_FragDepth = log_distance;
```

Alternatively, for maximum performance on supported hardware:
- Use WebGPU compute shaders with native f64 support
- Fall back to Float32 with reduced precision for older hardware
- Warn user if navigating at scales requiring precision not available

---

## Navigation Methods

Cosmos Explorer provides multiple complementary navigation methods, each optimized for different use cases and user preferences. All methods integrate seamlessly with the logarithmic scale system to provide smooth, consistent movement across orders of magnitude.

### 4.1 Free Flight (WASD / Mouse)

**Overview:**  
The primary navigation method, allowing unrestricted movement through space in any direction. Movement is relative to the camera's current heading, enabling intuitive first-person-like exploration.

**Controls:**
- **WASD Keys:** Move forward (W), backward (S), strafe left (A), strafe right (D)
- **Arrow Keys:** Alternative to WASD (same function)
- **Mouse Movement:** Look around (rotate camera)
- **Mouse Buttons:** Right-click drag for rotation (alternative look control)
- **Shift Key:** Speed boost (5x movement speed multiplier)
- **Ctrl Key:** Precision mode (0.1x movement speed multiplier)
- **Spacebar:** Move up (when appropriate for scale)
- **Ctrl+Spacebar:** Move down

**Movement Behavior:**

Movement always occurs in camera-forward direction (or strafe perpendicular to forward). Speed adapts automatically to current scale level:

```javascript
const base_speed_by_scale = {
    S0: 10,        // km/s
    S1: 0.1,       // AU/s
    S2: 5,         // AU/s
    S3: 10,        // ly/s
    S4: 1,         // kly/s
    S5: 10,        // Mly/s
    S6: 1          // Gly/s
};

const current_speed = base_speed_by_scale[current_scale] * delta_time;
const boosted_speed = current_speed * (shift_held ? 5 : 1) * (ctrl_held ? 0.1 : 1);
camera_position += camera_forward * boosted_speed;
```

**Damping and Inertia:**

Movement is not instant; instead, velocity is smoothly interpolated to allow comfortable panning:

```javascript
const damping_factor = 0.2;  // seconds to 63% of target speed
target_velocity = input_direction * desired_speed;
current_velocity = lerp(current_velocity, target_velocity, 1 - exp(-delta_time / damping_factor));
camera_position += current_velocity * delta_time;
```

Effect: When user releases keys, camera smoothly decelerates over 0.5-1 second rather than stopping instantly.

**Collision Avoidance:**

At S0 (surface), collision detection prevents flying into solid terrain:

```javascript
const next_position = camera_position + camera_velocity * delta_time;
const terrain_height = sample_terrain_height(next_position.x, next_position.z);
const camera_height_above_ground = next_position.y - terrain_height;

if (camera_height_above_ground < MIN_CLEARANCE) {
    next_position.y = terrain_height + MIN_CLEARANCE;
    vertical_velocity = 0;
}
camera_position = next_position;
```

At other scales, collisions are non-blocking warnings only.

**Speed Boost Characteristics:**

- Shift key enables 5x multiplier (from 0.1x to 25x base speed)
- Useful for rapid transit across large scales
- Precise control compromised (coarse movement)
- Speed cap: cannot exceed 0.5 AU/s at S1 or faster than 1 Gly/s at S6

**Precision Mode Characteristics:**

- Ctrl key enables 0.1x multiplier (from 10x normal to 0.01x base speed)
- Useful for detailed inspection of small objects
- Smooth, fine control over camera
- Minimum speed: cannot move slower than 1 m/s at S0 or 1 Kly/s at S4

**Free Look Options:**

Toggle-able from settings menu:

- **Free Look Enabled (default):** Mouse moves camera, WASD moves character (like FPS game)
- **Fixed Look:** WASD moves character in direction of travel, mouse only rotates when right-click held
- **Velocity-Relative:** Movement direction is in camera's local frame; rotation changes heading without rotating view

---

### 4.2 Click-to-Navigate

**Overview:**  
Single-click navigation to any visible object. User clicks on any entity (star, planet, galaxy, etc.), and the camera smoothly flies to that object over 2-3 seconds, automatically maintaining safe distance.

**Interaction Flow:**

1. **Hover on Object:**
   - Object highlights (outline glow or color shift)
   - Tooltip appears with object name
   - Distance to object shown

2. **Click on Object:**
   - Animation begins immediately
   - "Approaching [Object Name]" status message appears
   - All free-flight inputs disabled during approach
   - Progress bar shows approach progress

3. **Arrival:**
   - Camera reaches approach distance (automatically calculated)
   - Smooth zoom-in concludes
   - Object-specific UI panel appears (details sidebar)
   - Free-flight controls re-enabled
   - Option to abort approach early (Esc key)

**Approach Distance Calculation:**

Distance = 2.5 × object_visual_radius + buffer

Where:
- **object_visual_radius** = rendered size on screen (in 3D space)
- **buffer** = scale-appropriate safety margin
  - S0: 100 m (can see surface features)
  - S1: 0.1 object radius (can see planet in full context)
  - S2+: 2x object radius (good viewing angle)

Examples:
- Click on Earth at S1: approach distance ≈ 25,000 km (stays outside atmosphere)
- Click on Sun at S2: approach distance ≈ 3 million km (good solar corona view)
- Click on Andromeda at S5: approach distance ≈ 10 Mly (full galaxy structure visible)

**Flight Path:**

Rather than straight-line approach, camera follows Bezier curve to avoid passing through objects:

```javascript
function compute_bezier_path(start, end, obstacle_center, obstacle_radius) {
    // Control points positioned to avoid obstacle
    const midpoint = lerp(start, end, 0.5);
    const to_obstacle = normalize(obstacle_center - midpoint);
    const perp = perpendicular(to_obstacle);
    
    const control_p1 = start + (end - start) * 0.25 + perp * obstacle_radius * 2;
    const control_p2 = start + (end - start) * 0.75 + perp * obstacle_radius * 2;
    
    return [start, control_p1, control_p2, end];  // cubic Bezier
}
```

**Travel Time:**

Always 2-3 seconds regardless of distance (logarithmic scaling):

```javascript
const distance_real = length(target_position - camera_position);
const travel_time = 2.5 + log10(distance_real / reference_distance) * 0.5;  // 2-3 seconds typically
```

This ensures that traveling to a nearby object (1 km away) takes similar time as traveling to a distant object (1 million km away), which is more comfortable for user experience than physics-accurate instant speeds.

**Object Highlighting During Hover:**

```glsl
// Outline effect in custom shader
void apply_outline() {
    float outline_width = 0.02 * distance_to_camera / object_radius;
    vec4 outline_color = vec4(1.0, 0.8, 0.0, 1.0);  // golden yellow
    
    if (is_outline_edge) {
        gl_FragColor = outline_color;
    }
}
```

**Selection State Persistence:**

After arriving at object:
- Object remains highlighted (color-coded selection glow)
- Selection persists until user clicks another object or presses Escape
- Sidebar shows detailed information about selected object
- Related object links clickable (orbit parent, nearby objects, etc.)

**Interruption Handling:**

If user presses Esc or clicks elsewhere during approach:
- Current animation halts smoothly
- Camera velocity returns to zero over 0.3 seconds
- Camera position is immediately usable for free-flight

---

### 4.3 Search & Jump

**Overview:**  
Text-based search allowing users to find any named entity and jump to it instantly with cinematic zoom animation.

**Search Interface:**

A search bar is always available in the top-center UI, togglable with Ctrl+F or clicking the search icon.

**Search Features:**

- **Autocomplete:** As user types, suggestions appear (up to 20 matches)
- **Icons:** Each suggestion shows icon indicating entity type (star, planet, galaxy, etc.)
- **Distance:** Shows distance from current position to suggested object
- **Search Scope:** Filters visible in dropdown
  - All objects
  - Stars only
  - Planets only
  - Galaxies only
  - Nebulae only
  - Catalog searches (Messier, NGC, Hipparcos, etc.)

**Search Database Content:**

- All 5 million named stars (Hipparcos + Gaia + Yale catalogs)
- All 5,600+ exoplanets (NASA Exoplanet Archive)
- All 200 billion+ stars in Milky Way (procedurally named if unnamed)
- All known galaxies with names (20,000+)
- All Messier objects (110)
- All NGC objects (7,840)
- All Caldwell objects (110)
- Famous historical objects (Betelgeuse, Sirius, etc.)
- User's saved locations (bookmarks)
- Recently visited objects

**Jump Animation Sequence:**

When user selects a search result:

1. **Zoom Out (0.5 seconds):**
   - Camera rapidly increases FOV (60° → 120°)
   - Camera backs away from current focus
   - Everything shrinks into distance
   - Audio cue: ascending sci-fi tone

2. **Rotate to Face (1 second):**
   - Camera rotates to face target
   - Target is centered in view
   - All intermediate objects rotate past view (cinematic effect)
   - Stars rotate around in background

3. **Zoom In (1 second):**
   - Camera moves toward target
   - FOV decreases (120° → 60°)
   - Target grows in view
   - Approach distance automatically calculated
   - Audio cue: descending sci-fi tone

**Total Jump Duration:** 2.5 seconds (consistent with click-to-navigate)

**Search Result Selection:**

Clicking a search result from autocomplete:

```javascript
{
    name: "Proxima Centauri",
    type: "M5.5V Red Dwarf",
    distance: "4.24 ly from Solar System",
    coordinates: {ra: "14h29m43s", dec: "-62°40'46""},
    link: "jump_to_object('proxima_centauri')"
}
```

**History and Bookmarks:**

Below search bar, two tabs:
- **Recent:** Last 20 objects visited, chronological order, click to revisit
- **Bookmarks:** User-marked favorites, can be renamed and organized into folders
  - Right-click any object → "Add to Bookmarks"
  - Bookmark edit dialog: name, color label, notes

**Search Tips Widget:**

Collapsible help section shows common searches:
- "Kepler 442 b" (specific exoplanet)
- "M31" (Andromeda Galaxy)
- "Betelgeuse" (famous star)
- "Moons of Jupiter" (object family)
- "Black holes" (object type)

---

### 4.4 Scale Wheel (Custom UI Control)

**Overview:**  
A specialized vertical slider showing the seven scale levels, allowing drag-based zoom in/out with visual feedback about current position.

**Visual Design:**

The scale wheel appears on the right side of the screen (customizable) as a vertical bar with:
- **Height:** 300 pixels
- **Labels:** S0 through S6 at proportional positions
- **Tick marks:** Major ticks at each scale level
- **Current Position:** Highlighted thumb slider
- **Color coding:** Graduated color from brown (surface) through blue (space) to black (cosmic)

**Interaction:**

- **Drag slider thumb:** Smooth zoom in/out to selected scale
- **Click on scale level name:** Jump directly to that scale
- **Scroll wheel over slider:** Increment/decrement scale, one level at a time
- **Shift+Scroll:** 10x speed zoom

**Current Location Indicator:**

Below the scale wheel, a small map shows:
- Hierarchical position: "Andromeda > Disk > 50 ly from center"
- Each level clickable to zoom out to that scale level
- Breadcrumb navigation

**Minimap Integration:**

The scale wheel includes a minimap showing:
- Current position in context (zoomed out view)
- Nearby notable objects
- Direction to nearest object
- Zoom level as concentric circles or brackets

Minimap updates continuously as camera moves, helping user maintain spatial awareness.

**Zoom Animation:**

When using scale wheel:

```javascript
const current_scale = 3.2;  // S3 at 0.4 between S3 and S4
const target_scale = user_dragged_to_2.8;  // S2 at 0.8 between S2 and S3

// Smooth zoom over 0.5-1.0 second
const zoom_animation_duration = 0.75;
const elapsed = get_frame_elapsed_time();

const progress = clamp(elapsed / zoom_animation_duration, 0, 1);
const eased_progress = ease_in_out_cubic(progress);

const new_scale = lerp(current_scale, target_scale, eased_progress);
apply_logarithmic_zoom(new_scale);
```

**Scale Transition Triggers:**

The scale wheel automatically shows when user is approaching a scale boundary:

```javascript
if (abs(current_scale - round(current_scale)) < 0.1) {
    scale_wheel_opacity = 1.0;  // Fully visible
    scale_wheel_flash_animation = true;  // Pulsing highlight of next level
}
```

**Keyboard Alternative:**

For users preferring keyboard:
- **Q / E keys:** Zoom out / zoom in (one scale level at a time)
- **Shift+Q / Shift+E:** Jump to next major scale level
- **Number keys 1-7:** Jump directly to scale S0-S6

---

### 4.5 Guided Tours

**Overview:**  
Pre-scripted camera paths that automatically guide the user through collections of notable objects, with accompanying narrative and educational information.

**Available Tours:**

Each tour is designed to take 3-15 minutes and teach the user about a specific aspect of the universe.

**Tour 1: Solar System Grand Tour**
- Duration: 8 minutes
- Waypoints:
  1. Earth surface (Mount Everest view)
  2. Earth orbit (Moon visible)
  3. Inner planets (Mercury, Venus, Earth, Mars in sequence)
  4. Asteroid Belt
  5. Jupiter and Galilean moons
  6. Saturn and ring system
  7. Distant ice giants (Uranus, Neptune)
  8. Oort Cloud boundary
- Narration: Brief facts about each object (planet composition, distance, orbital period)
- Educational focus: Scale of solar system, planetary order and composition

**Tour 2: Stellar Neighborhood**
- Duration: 5 minutes
- Waypoints:
  1. Solar System (zoomed out view)
  2. Proxima Centauri (nearest star)
  3. Alpha Centauri (binary star system)
  4. Sirius system
  5. Vega
  6. Local Bubble boundary
- Narration: Star types, distances, apparent brightness vs actual brightness
- Educational focus: Stars are distant suns, huge distances even to nearest stars

**Tour 3: Milky Way Structure**
- Duration: 10 minutes
- Waypoints:
  1. Local spiral arm (Orion Arm)
  2. Perseus Arm (neighboring arm)
  3. Sagittarius Arm
  4. Galactic center (Sagittarius A* black hole)
  5. Disk thickness (side view)
  6. Halo globular clusters
  7. Dwarf satellite galaxies (LMC, SMC)
- Narration: Spiral structure, disk density, supermassive black hole, stellar populations
- Educational focus: Galaxy structure, position of Solar System in galaxy, stellar nurseries

**Tour 4: Galaxy Types & Evolution**
- Duration: 7 minutes
- Waypoints:
  1. Spiral galaxy (M31 Andromeda)
  2. Barred spiral galaxy (M109)
  3. Elliptical galaxy (M87)
  4. Irregular galaxy (NGC 1313)
  5. Lenticular galaxy (M104 Sombrero)
  6. Active galactic nucleus (Centaurus A)
  7. Starburst galaxy (M82)
- Narration: Hubble classification, formation mechanisms, stellar populations by type
- Educational focus: Diversity of galaxy forms, relationship to age and environment

**Tour 5: Cosmic Web**
- Duration: 12 minutes
- Waypoints:
  1. Local Group (Milky Way, Andromeda, others)
  2. Virgo Cluster (nearest large cluster)
  3. Coma Cluster (mass distribution)
  4. Supercluster filament
  5. Large void (dark region between structures)
  6. Distant galaxy groups
  7. Ancient quasar (z > 6)
  8. Observable universe boundary (CMB sphere)
- Narration: Cosmological structure, dark matter distribution, early universe, expansion
- Educational focus: Universe is not uniform; structures form filaments and voids

**Tour 6: Stellar Evolution**
- Duration: 6 minutes
- Waypoints (all within single star-forming region):
  1. Star formation region (nebula)
  2. Protostar
  3. T-Tauri star (young star)
  4. Main sequence star (Sun-like)
  5. Evolved star (red giant)
  6. Planetary nebula (shedding layers)
  7. White dwarf (dense remnant)
  8. Neutron star (pulsar)
  9. Black hole
- Narration: Hertzsprung-Russell diagram context, timescales, stellar deaths
- Educational focus: Stars evolve; paths depend on mass; extreme objects possible

**Tour 7: Exoplanet Worlds**
- Duration: 9 minutes
- Waypoints:
  1. Hot Jupiter (WASP-12b or similar, extreme heat)
  2. Super-Earth (GJ 1132 b)
  3. Ocean world (K2-18b candidate)
  4. Terrestrial temperate world (Kepler-452b or similar)
  5. Pulsar planet (PSR 1257+12 b)
  6. Binary star system (Alpha Centauri Bb, if habitable-zone candidate)
  7. Habitable zone comparison (Earth, TRAPPIST-1e, etc.)
- Narration: Exoplanet detection methods, world types, habitability factors
- Educational focus: Planets around other stars are common; diversity of worlds

**Tour Control Interface:**

During a tour:
- **Pause Button:** Pauses at current waypoint; can explore freely without leaving tour path
- **Resume Button:** Continues tour from current waypoint
- **Skip Button:** Jump to next waypoint
- **Rewind Button:** Go back to previous waypoint
- **Exit Button:** Exit tour, return to free navigation
- **Narration Controls:** Play/pause narration, adjust volume, toggle narration on/off
- **Transcript Button:** Pop-up showing full tour script; click on paragraph to jump to that waypoint

**Waypoint Timing:**

```javascript
// Each waypoint includes:
{
    name: "Jupiter",
    narration: "Jupiter is the largest planet in our solar system...",
    position: {ra: ..., dec: ..., distance: ...},
    duration: 30,  // seconds to explore this waypoint
    zoom_level: 2.1,  // S2 scale, close to planet
    camera_rotation: {pitch: -15, yaw: 45},
    auto_zoom: true,  // automatically zoom in during transition
    on_waypoint_start: function() {
        highlight_moons();
        show_info_panel("Jupiter");
    }
}
```

**Tour Customization:**

Users can create custom tours:
- Record path as camera moves
- Add narration via voice or text
- Save as shareable tour
- Community tours available (peer-created)

---

### 4.6 Time Navigation

**Overview:**  
A time slider allowing users to view the universe at different moments in history (past, present, future), and play-back orbital mechanics at accelerated speeds.

**Time Slider Interface:**

A horizontal slider at the bottom of the screen shows:
- **Left edge:** "13.8 billion years ago" (Big Bang, earliest representable)
- **Center:** Present day (2026 CE)
- **Right edge:** "100 billion years in future"
- **Current time display:** "2026 CE" or "11.2 Billion Years Ago"
- **Drag to move:** Smooth time progression
- **Markable events:** Ticks at notable moments

**Notable Events with Preset Jumps:**

Users can jump to key moments:

- **Formation of Solar System:** 4.6 billion years ago
- **Formation of Earth:** 4.54 billion years ago
- **Emergence of Life:** 3.8 billion years ago
- **Cambrian Explosion:** 541 million years ago
- **Extinction of Dinosaurs:** 66 million years ago
- **Emergence of Homo sapiens:** 300,000 years ago
- **Industrial Revolution:** 200 years ago
- **Present Day:** 2026 CE
- **Heat Death Scenario:** 100 trillion years in future

Each event appears as a tick mark on the time slider; hover for description, click to jump.

**Speed Controls:**

A second slider below time slider controls playback speed:

| Speed | Multiplier | Real-Time Duration | Use Case |
|---|---|---|---|
| Paused | 0x | ∞ | Inspect static view |
| 1x | 1x | 1 second per second | Real-time planetary motion |
| 100x | 100x | 1 day per second | Orbital mechanics visible |
| 10,000x | 10,000x | 27 years per second | Annual cycles visible |
| 1Mx | 1,000,000x | 11,000 years per second | Centuries pass per second |
| 1Bx | 1,000,000,000x | 11 million years per second | Galactic rotation visible |

**Playback Controls:**

- **Play Button:** Start time progression at current speed
- **Pause Button:** Stop time progression
- **Reverse Button:** Reverse time (go backward at selected speed)
- **Speed Up / Speed Down:** Increment speed level

**Orbital Mechanics Animation:**

When time is progressing (speed > 0):

```javascript
// Calculate new orbital position based on time delta
const time_elapsed = current_time - time_at_last_frame;
const orbital_phase = (original_phase + 2*PI * time_elapsed / orbital_period) % (2*PI);

// Update position
object.position = orbit_ellipse.position_at_phase(orbital_phase);

// Update satellite orientation (axial rotation)
object.rotation.y += (2*PI / rotation_period) * time_elapsed;
```

Effects:
- Planets orbit their stars visibly
- Moons orbit planets visibly
- Comets trace visible paths with tails
- Asteroid belt particles drift
- Galactic rotation visible at high time-scales
- Binary star systems orbit each other

**Cosmological Changes:**

For extreme time scales, universe itself evolves:

**Past Direction (before present):**
- Galaxies were smaller and more chaotic (match observational data from Hubble Deep Field)
- Quasars were more common
- Star formation rate was higher
- Expansion rate was different (accelerating due to dark energy)

**Future Direction (after present):**
- Stars continue to form at decreasing rate
- Eventually all star formation ceases (100 billion years)
- Stars age and die (white dwarfs, neutron stars, black holes persist)
- Black holes slowly evaporate via Hawking radiation (10^100+ years)
- Heat death scenario: all energy dissipated, universe dark and cold

**Historical Snapshots:**

At certain time points, the system loads pre-computed or procedurally-generated historical states:

- **t = -13.8 Gya:** Big Bang singularity (not visually representable; show CMB instead)
- **t = -13.7 Gya:** Cosmic inflation ends, first particles form
- **t = -13.5 Gya:** First atoms form (recombination), CMB emitted
- **t = -13.3 Gya:** First galaxies form (dark age ends)
- **t = -10 Gya:** Milky Way forms
- **t = -4.6 Gya:** Solar system forms, Earth forms
- **t = Present:** Current state (2026 CE)

**Time Dilation (Relativistic Effects - Optional):**

If relativistic effects enabled, fast-moving objects show time dilation:

```glsl
// Time dilation factor: t' = t * sqrt(1 - v^2/c^2)
float lorentz_factor = sqrt(1.0 - (object_velocity / speed_of_light)^2);
float dilated_time = current_time * lorentz_factor;

// Apply to orbital calculations
float orbital_period_dilated = orbital_period / lorentz_factor;
```

(This is a visual/educational effect only; speed of light is not enforced on camera.)

**Time Travel Restrictions:**

At extremely low time speeds (1x):
- User cannot travel faster than speed of light to distant objects
- Traveling to Andromeda Galaxy at S5 scale and 1x speed takes ~2.5 million seconds (Earth's travel time due to finite light speed)

This teaches relativity without being cumbersome (automatically disabled in "gameplay" modes).

---

[Content continues in next section...]

---

## Entity Discovery System

### 5.1 How to Find Every Entity Type — Complete Mapping

The following section systematically describes how users discover, navigate to, filter, and explore every entity type visible in the Cosmos Explorer.

**Catalog Reference:** Entity types visible at each scale level are defined by the 96-type taxonomy in Doc 22 v4.2. See Doc 09 v2.0 Section 13 for scale-entity mapping.

#### Stars

**Discovery Methods:**

1. **Visual Discovery:**
   - Stars visible as colored points at S3 (Stellar Neighborhood) and beyond
   - Brightness indicates luminosity class
   - Color indicates spectral type (blue = hot O/B stars, yellow = G-class like Sun, red = cool M-class dwarfs)
   - Hover over any star to see name and distance

2. **Click-to-Navigate:**
   - Click any visible star to approach it
   - Zooms to S1 scale (orbital perspective around star)
   - Shows planetary system if present
   - Details sidebar shows star properties

3. **Search Function:**
   - Type star name (Sirius, Betelgeuse, Polaris, etc.)
   - Search returns matches with spectral type and distance
   - Autocomplete suggests cataloged stars

4. **Filter Panel:**
   - Access via left sidebar or Settings menu
   - Available filters:
     - **Spectral Type:** O, B, A, F, G, K, M (8 classes)
     - **Luminosity Class:** I (supergiants), II (bright giants), III (giants), IV (subgiants), V (main sequence dwarfs)
     - **Variability:** None, Pulsating, Eclipsing, Rotating, Flare stars
     - **Notable:** Nearest stars, brightest stars, famous stars (Sirius, Polaris, Betelgeuse), red giants, white dwarfs, neutron stars, black holes
     - **Distance Range:** 1-100 ly, 100-10,000 ly, 10,000+ ly
     - **Stellar Multiplicity:** Single stars, binary systems, multiple systems

5. **Hertzsprung-Russell Diagram:**
   - Interactive H-R diagram showing relationship between temperature and luminosity
   - X-axis: Temperature (hot right to cool left)
   - Y-axis: Luminosity (dim bottom to bright top)
   - Stars plotted as colored dots
   - Click any region to highlight those star types:
     - Main sequence: diagonal band from upper-left to lower-right
     - Red giants: upper-right region
     - White dwarfs: lower-left region
     - Supergiants: upper region
   - Select a region to navigate to nearest example

6. **Stellar Catalogs:**
   - **Hipparcos Catalog:** 118,000 brightest nearby stars (distance < 500 ly)
   - **Gaia Catalog:** All stars within 10,000 ly (5+ million stars)
   - **Yale Bright Star Catalog:** 9,000 brightest stars visible from Earth
   - **Messier Catalog:** Famous star clusters and nebulae
   - Browse any catalog by name or property

7. **Star Clusters:**
   - Open clusters (young star groups): Pleiades, Hyades, etc.
   - Globular clusters (old spherical clusters): M3, M4, M15, etc.
   - Click cluster name to zoom to cluster center
   - All member stars appear as colored points

8. **Famous Stars List:**
   - Curated list including:
     - Sirius (brightest in night sky)
     - Canopus (2nd brightest)
     - Polaris (North Star)
     - Betelgeuse (red supergiant)
     - Rigel (blue supergiant)
     - Vega (bright A0-class)
     - Altair
     - Spica
     - Antares (red supergiant)
     - Deneb
   - Click any to jump there via cinematic zoom

**Star Properties Display (Sidebar):**

When a star is selected, the sidebar shows:
- **Name:** Primary name and catalog designations (HIP, Gaia, HR numbers)
- **Type:** Spectral class (e.g., G2V for Sun-like)
- **Distance:** Parallax distance in light-years
- **Apparent Magnitude:** Brightness from Earth
- **Absolute Magnitude:** Intrinsic brightness
- **Temperature:** Effective surface temperature (Kelvin)
- **Radius:** Multiple of solar radius
- **Mass:** Multiple of solar mass
- **Luminosity:** Multiple of solar luminosity
- **Age:** Estimated age in billion years
- **Metallicity:** [Fe/H] value (metal content relative to Sun)
- **Proper Motion:** Movement across sky (arcsec/year)
- **Radial Velocity:** Movement toward/away from us (km/s)
- **Habitable Zone:** Visualization showing distance range where liquid water can exist
- **Planets:** List of known planets (if any)
- **Binary Status:** If part of multiple system, separation and orbital period
- **Variability:** If applicable, variation type and period

**Related Objects Links:**

In sidebar, clickable links for:
- "Nearby Stars" (10 nearest in distance)
- "Planets Around This Star"
- "Star Cluster (if member)"
- "Associated Nebula (if embedded)"

---

#### Planets (Including All Exotic Types)

**Discovery Methods:**

1. **Zoom to Star System:**
   - Navigate to any star using methods above
   - At S2 scale or closer (1 AU), all planets around that star appear
   - Each planet rendered as colored sphere
   - Orbital paths shown as white ellipses

2. **Exoplanet Catalog:**
   - Access via search bar or left sidebar "Exoplanets" section
   - Contains all 5,600+ confirmed exoplanets (as of 2026)
   - Searchable by:
     - Planet name (Kepler-452 b, TRAPPIST-1 e, etc.)
     - Host star name
     - Discovery method (transit, radial velocity, imaging, etc.)
     - Discovery year
   - Click to jump directly to planet

3. **Filter by Planet Type:**
   - **Rocky Planets:** Terrestrial, super-Earths, mini-Neptunes
   - **Gas Giants:** Hot Jupiters, cold Jupiters, eccentric gas giants
   - **Ice Giants:** Neptune-like
   - **Extreme Types:**
     - Lava worlds (very close orbits, scorched surface)
     - Ocean worlds (presumed water-covered)
     - Carbon planets (exotic carbon-rich composition)
     - Pulsar planets (orbiting neutron stars)
   - Filter by orbital distance, mass, equilibrium temperature

4. **Habitable Zone Visualization:**
   - Around each star, a ring shows the habitable zone (distance where liquid water could exist)
   - Planets in habitable zone highlighted in green
   - Planets too hot highlighted in red, too cold in blue
   - Select "Show Habitable Zone Indicators" to highlight across all systems

5. **Potentially Habitable Worlds List:**
   - Curated list: confirmed/candidate habitable planets:
     - Proxima Centauri b
     - TRAPPIST-1 e, f, g
     - Kepler-452 b
     - GJ 1132 b
     - Ross 128 b
     - Teegarden b, c
   - Click to navigate directly
   - Show distance from Earth, potentially habitable factors

6. **"Planet Types" Gallery:**
   - Visual catalog of planet type examples
   - Each type shows:
     - Representative image (procedural or based on exoplanet data)
     - Type characteristics (composition, temperature, pressure, etc.)
     - Example planets of this type
     - Clickable links to visit example planets
   - Types shown:
     - Rocky planets (Earth-sized, terrestrial)
     - Super-Earths (1.5-10 Earth masses)
     - Mini-Neptunes (5-20 Earth masses)
     - Hot Jupiters (Jupiter-mass, very close orbit)
     - Cold Jupiters (Jupiter-mass, far orbit)
     - Ice giants (Uranus/Neptune-like)
     - Lava worlds (extreme heat, molten surface)
     - Ocean worlds (water-covered)
     - Carbon planets (exotic diamond/graphite composition)
     - Iron planets (metal-rich, no atmosphere)

7. **Procedurally Generated Planets:**
   - For star systems without confirmed exoplanets, Cosmos Explorer generates plausible systems
   - Generation parameters based on:
     - Star's age, mass, metallicity
     - Known planetary system statistics
     - Formation theory predictions
   - Procedural planets marked as [Generated] in sidebar
   - Includes:
     - Planets in habitable zone (if star permits)
     - Gas giants at multiple distances
     - Asteroid belts
     - Reasonable orbital periods and masses

8. **Habitable Exoplanet Search:**
   - Filter: Habitable zone planets only
   - Sort by: distance from Earth, discovery date, likelihood of habitability
   - Shows metric: Earth Similarity Index (ESI, 0-1.0)
   - Filter by: K2-18 type (mini-Neptune), Earth-analog (terrestrial), super-Earth

**Planet Properties Display (Sidebar):**

When a planet is selected:
- **Name:** Primary name and alternate designations
- **Host Star:** Name and link to star
- **Type:** Classification (rocky, super-Earth, gas giant, etc.)
- **Mass:** Earth masses or Jupiter masses
- **Radius:** Earth radii or Jupiter radii
- **Density:** Inferred from mass and radius
- **Equilibrium Temperature:** Average surface temperature if lit by star only
- **Escape Velocity:** Required speed to leave atmosphere
- **Orbital Period:** Time to orbit star (days, years)
- **Semi-Major Axis:** Distance from star (AU)
- **Orbital Eccentricity:** How elliptical the orbit is (0 = circular, 1 = hyperbolic)
- **Insolation:** Energy received from star (relative to Earth)
- **Habitable Zone Status:** "Inside," "On edge," or "Outside"
- **Discovery Date:** When discovered
- **Discovery Method:** Transit photometry, radial velocity, direct imaging, etc.
- **Atmosphere:** Presence/composition if detected
- **Moons:** Known moons (if any)
- **Surface Conditions:** Inferred from data and models
  - For exoplanets: temperature, pressure, composition estimates
  - For Solar System planets: actual known conditions

**Related Object Links:**
- "Other Planets in This System"
- "Moons of This Planet"
- "Host Star Details"
- "Similar Planets in Catalog"
- "Habitable Zone Visualization"

---

#### Moons

**Discovery Methods:**

1. **Zoom to Planet:**
   - Navigate to any planet (above methods)
   - At S1 scale (orbital) or closer, all moons appear around planet
   - Each moon shown as smaller sphere in correct orbit

2. **Moon List (Per Planet):**
   - When planet selected in sidebar, "Moons" section shows:
     - All known moons listed
     - Sorted by distance from planet
     - Click any moon name to zoom to it

3. **Click on Moon Visually:**
   - Moons visible as dots around parent planet at S1-S2 scale
   - Click any moon to navigate to it
   - Autopsy distance computed for moon viewing

4. **Moon Filter:**
   - Filter moons by type:
     - **Rocky Moons:** Terrestrial composition
     - **Icy Moons:** Water/ice composition (Europa, Enceladus, etc.)
     - **Volcanic Moons:** Actively volcanic (Io, Enceladus)
     - **Captured Asteroids:** Irregular rocky bodies (Phobos, Deimos)
     - **Shepherd Moons:** Small moons maintaining ring structure (Saturn's)
     - **Trojan Moons:** At Lagrange points with planet
   - Filter by size range
   - Filter by orbital characteristics (near/far, synchronized rotation, etc.)

**Moon Properties Display:**

When moon selected:
- **Name:** Primary name and alternate designations
- **Parent Body:** Link to parent planet
- **Type:** Classification (rocky, icy, volcanic, etc.)
- **Mass:** Earth masses
- **Radius:** Kilometers or Earth radii
- **Density:** Implied composition indicator
- **Orbital Period:** Days or hours
- **Orbital Distance:** Kilometers or planet radii
- **Orbital Eccentricity:** How elliptical
- **Surface Temperature:** Estimated
- **Rotation Period:** Sidereal day length (often synchronized to orbital period)
- **Surface Composition:** Ice, rock, silicates, etc.
- **Notable Features:** Volcanoes (Io), subsurface oceans (Europa, Enceladus), ice canyons (Arrakis-analog), rings (Saturn's moons), etc.
- **Discovery Date:** When moon was discovered
- **Explorer Data:** If visited by spacecraft, show mission details

**Moon Showcase Highlights:**

Links to notable moons worth visiting:
- **Io:** Most volcanically active body in Solar System
- **Europa:** Possible subsurface ocean, potential life
- **Enceladus:** Geysers, subsurface ocean
- **Titan:** Thick atmosphere, liquid methane lakes
- **Mimas:** Large impact crater (Herschel), "Death Star" appearance
- **Triton:** Retrograde orbit, active geysers
- **Phobos:** Rapidly decaying Martian moon

---

#### Small Bodies (Asteroids, Comets, Dwarf Planets)

**Asteroid Belt Visualization:**

At S2 scale, asteroids appear as semi-transparent particle cloud between Mars and Jupiter orbits (Solar System). 

**Discovery Methods:**

1. **Visual Detection:**
   - Asteroid belt visible as cloudy region at S2 scale
   - Zoom in (toward S1) to see individual asteroids as small rocky bodies
   - Specific asteroids clickable when zoomed in sufficiently

2. **Asteroid Catalog:**
   - NASA Planetary Society Asteroid Database
   - 1 million+ named asteroids
   - Search by name or number (e.g., "1 Ceres", "433 Eros")
   - Filter by:
     - **Asteroid Type:** C-type (carbonaceous, most common), S-type (silicate), M-type (metal-rich), others
     - **Size Range:** Microns to 1000 km
     - **Orbital Family:** Main Belt, Near-Earth, Trojan, etc.
     - **Notable Examples:** Ceres, Vesta, Eros, Apophis, Bennu, etc.

3. **Near-Earth Asteroids (NEAs):**
   - Separate filter for asteroids that come close to Earth orbit
   - Includes potentially hazardous asteroids
   - Shows closest approach distance and date
   - Some (like Apophis) have encounter dates marked on time slider

4. **Kuiper Belt:**
   - Visible at S2-S3 as diffuse ring beyond Neptune orbit
   - Contains thousands of icy bodies, dwarf planets
   - Dwarf planet examples:
     - Pluto (most famous)
     - Eris (more massive than Pluto)
     - Makemake
     - Haumea
   - Click dwarf planet names to navigate

5. **Oort Cloud:**
   - Rendered as faint spherical halo at outermost S2 scale
   - Contains billions of comets (theoretical, not individually rendered)
   - Provides source of long-period comets
   - Shows as diffuse region rather than individual objects

6. **Comet Trajectories:**
   - Famous comets rendered with orbital paths:
     - Halley's Comet (periodic, 76-year orbit)
     - Hale-Bopp (long-period)
     - NEOWISE (recent bright comet)
   - During perihelion (closest approach to Sun), comets show visible tail
   - Tail rendered as glowing particle stream pointing away from Sun
   - Click comet name to track its approach

**Small Body Properties Display:**

When asteroid/comet selected:
- **Name and Number:** Designation (e.g., "252 Kleopatra")
- **Type:** C, S, M, X, or other classification
- **Mass:** Kilograms or Earth masses
- **Radius/Dimensions:** Mean radius or ellipsoid dimensions
- **Orbital Period:** Years or days
- **Orbital Elements:** Semi-major axis, eccentricity, inclination
- **Rotation Period:** Sidereal day
- **Surface Composition:** Spectroscopic classification
- **Density:** Inferred
- **Notable Features:** Moons (some asteroids have moons), unusual shape, historical impacts, exploration mission data (OSIRIS-REx, Hayabusa2)
- **Discovery Date:** When discovered
- **Explorer Data:** Spacecraft mission details if visited

---

#### Nebulae

**Discovery Methods:**

1. **Visual Detection:**
   - Nebulae visible as colored patches at S3 scale and beyond
   - Colors indicate composition:
     - Red/pink: Hydrogen-alpha (H-alpha) emission
     - Blue: Reflection nebulae scattering light
     - Dark: Dust clouds blocking background light
   - Named nebulae appear with labels at appropriate distance

2. **Nebula Catalog:**
   - **Messier Catalog (110 objects):** Famous nebulae (M42 Orion Nebula, M57 Ring Nebula, etc.)
   - **NGC Catalog (7,840 objects):** New General Catalog
   - **Caldwell Catalog (110 objects):** Caldwell's list of non-Messier objects
   - Search any catalog, click to navigate

3. **Nebula Type Filter:**
   - **Emission Nebulae:** Hot ionized gas, pink/red color (stellar nurseries)
     - Example: Orion Nebula (M42), Eagle Nebula, Lagoon Nebula
   - **Reflection Nebulae:** Dust scattering starlight, blue color
     - Example: Pleiades nebulosity, Witch Head Nebula
   - **Dark Nebulae:** Dust clouds blocking background light, appear as dark patches
     - Example: Pillars of Creation (Eagle Nebula), Horsehead Nebula
   - **Planetary Nebulae:** Expanding shells from dying stars, ring/disc shapes
     - Example: Ring Nebula (M57), Helix Nebula (NGC 7293), Dumbbell Nebula (M27)
   - **Supernova Remnants:** Expanding blast waves from stellar explosions
     - Example: Crab Nebula (M1), Veil Nebula, Cassiopeia A

4. **Nebula Famous List:**
   - Pre-curated links to most spectacular nebulae:
     - Orion Nebula (closest stellar nursery)
     - Crab Nebula (nearest supernova remnant)
     - Ring Nebula (beautiful planetary nebula)
     - Pillars of Creation (famous Hubble image)
     - Helix Nebula (largest planetary nebula)
     - Eagle Nebula (star formation)
     - Lagoon Nebula (beautiful emission)
     - Witch Head (reflection nebula)

**Nebula Properties Display:**

When nebula selected:
- **Name:** Messier/NGC/Caldwell designations
- **Type:** Emission, reflection, dark, planetary, supernova remnant
- **Distance:** Light-years
- **Angular Size:** Apparent diameter in arcminutes
- **Linear Size:** Actual diameter in light-years
- **Composition:** Hydrogen, helium, heavier elements
- **Ionization Source:** Star(s) illuminating the nebula
- **Density:** Particles per cubic centimeter
- **Temperature:** Electron temperature (K)
- **Notable Features:** Star-forming regions, pillars, dark knots, newly formed stars, central stars
- **Discovery Date:** When first cataloged
- **Observation Notes:** Best time to observe, recommended telescope, famous images (Hubble, etc.)

**Related Object Links:**
- "Embedded Stars"
- "Young Star Clusters Formed Here"
- "Central Star(s)"
- "Nearby Nebulae"

---

#### Galaxies

**Discovery Methods:**

1. **Visual Detection:**
   - Galaxies appear as individual extended objects at S5 scale (intergalactic)
   - Rendered with structure: spiral arms, elliptical shape, or irregular
   - Brightest galaxies appear as distinct objects at S4 boundary

2. **Click-to-Navigate:**
   - Click any visible galaxy to navigate to it
   - Zooms smoothly through S4 to S5, then approaches galaxy
   - Arrives at good viewing distance to see structure

3. **Galaxy Catalog:**
   - Contains 200+ billion galaxies (observable universe)
   - Practical catalog interface showing:
     - Named galaxies (Andromeda, M31, Triangulum, etc.)
     - Messier objects (M31-M110 include galaxies)
     - NGC galaxies
     - Specific notable galaxies
   - Search by name, distance, or type

4. **Galaxy Type Filter:**
   - **Spiral Galaxies (Hubble type S):**
     - Sa, Sb, Sc (increasing looseness of spiral arms)
     - Flat disk with two or more spiral arms
     - Contains young stars, gas, dust
     - Example: Milky Way (Sb-Sc), Andromeda (Sb)
   - **Barred Spiral Galaxies (Hubble type SB):**
     - SBa, SBb, SBc (increasing looseness)
     - Spiral arms extending from central bar
     - Example: Milky Way may have weak bar, many nearby galaxies are barred
   - **Elliptical Galaxies (Hubble type E):**
     - E0 (spherical) to E7 (highly elongated)
     - Older red stars, little gas/dust
     - Example: M87 (giant elliptical), M32 (dwarf elliptical)
   - **Lenticular Galaxies (Hubble type S0):**
     - Disk with central bulge, but no spiral arms
     - Intermediate between spirals and ellipticals
     - Example: M104 Sombrero Galaxy
   - **Irregular Galaxies (Hubble type I):**
     - No clear symmetry or structure
     - Often smaller, disrupted by gravity of neighbor
     - Example: LMC, SMC, M82

5. **Active Galaxy Filter:**
   - **Seyfert Galaxies:** Bright active nuclei, narrow and broad emission lines
   - **Quasars (QSOs):** Extremely luminous active nuclei, often at high redshift
   - **Blazars:** Quasars with jets pointing toward us
   - **Radio Galaxies:** Powerful radio emission from jets
   - **Starburst Galaxies:** Extreme star formation rate (M82)
   - View active nuclei with supermassive black hole accretion disks (rendered as glow)

6. **Local Group Highlight:**
   - Special filter/section showing Local Group members:
     - Milky Way (our galaxy, position marked "You are here")
     - Andromeda (M31, 2.5 Mly away, nearest large galaxy)
     - Triangulum Galaxy (M33, 2.7 Mly away, 3rd largest in group)
     - 50+ dwarf galaxies in group
   - Click any to navigate
   - Show distances and relative positions

7. **Distance & Redshift Filter:**
   - Filter by distance range (1 Mly, 10 Mly, 100 Mly, 1 Gly, etc.)
   - Filter by redshift (z value, indicator of age/distance in early universe)
   - High-z objects show as more distant and younger (looking back in time)

**Galaxy Properties Display:**

When galaxy selected:
- **Name:** Primary name and designations (M31, NGC 224, Andromeda)
- **Type:** Spiral/Barred Spiral/Elliptical/Lenticular/Irregular
- **Distance:** Light-years or megalight-years
- **Redshift (z):** If known (indicates expansion of space)
- **Estimated Age:** If determinable
- **Diameter:** Actual size in light-years
- **Mass:** Solar masses (estimated)
- **Stellar Population:** Billions or trillions of stars
- **Composition:** Star types, gas, dust percentages
- **Central Supermassive Black Hole:** Mass if known (M31: 1.4×10^8 solar masses)
- **Notable Features:** Spiral structure, dust lanes, bright regions, satellites, jets (if active)
- **Star Formation Rate:** Solar masses per year (if determinable)
- **Active Status:** Whether galaxy has active nucleus
- **Discovery Date:** When identified
- **Observation Data:** Famous observations, Hubble images, radio observations

**Related Object Links:**
- "Satellite Galaxies"
- "Nearby Galaxies"
- "Galaxies in Same Cluster"
- "Member of Supercluster"
- "Similar Galaxies in Catalog"

---

#### Large-Scale Structure (Galaxy Clusters, Superclusters, Filaments, Voids)

**Discovery Methods:**

1. **Visual Detection at S5-S6:**
   - At S5 scale, galaxy clusters visible as dense point clouds
   - At S6 scale, cosmic web structure emerges:
     - Bright filaments where clusters congregate
     - Dark voids between filaments
     - Supercluster boundaries visible

2. **Galaxy Cluster Catalog:**
   - Notable clusters:
     - **Virgo Cluster:** Nearest major cluster (~65 Mly away, 2,000+ galaxies)
     - **Coma Cluster:** Distant cluster with high density (~330 Mly, 3,000+ galaxies)
     - **Fornax Cluster:** 60 Mly away, ~340 galaxies
     - **Centaurus Cluster:** ~150 Mly away
     - **Perseus Cluster:** ~250 Mly, strong radio emissions
   - Click cluster name to navigate to cluster center
   - Show member galaxy count and mass estimate

3. **Supercluster Visualization:**
   - Superclusters outlined as regions containing multiple clusters
   - Notable superclusters:
     - **Laniakea Supercluster:** 520 Mly across, contains Milky Way and Virgo Cluster
     - **Shapley Supercluster:** Massive concentration of galaxies
     - **Perseus-Pisces Supercluster:** 300 Mly long filament
     - **Coma Supercluster:** Contains Coma Cluster
   - Navigate to supercluster center, see member clusters

4. **Cosmic Web Structure:**
   - Toggle "Show Cosmic Web" checkbox in settings
   - Renders:
     - Filaments as bright white/yellow strands (galaxy concentrations)
     - Voids as dark regions (sparse galaxies)
     - Wall structures (flat sheets of galaxies)
   - Helps visualize large-scale universe geometry

5. **Void Identification:**
   - Large dark regions between filaments (Boötes Void, etc.)
   - Click void region to show statistics:
     - Size (diameter in Mly)
     - Density (galaxies per cubic Mly)
     - Neighboring structures
   - Navigate to void center for empty space view

**Large-Scale Structure Properties Display:**

When cluster/supercluster/filament selected:
- **Name:** Official designation
- **Type:** Galaxy cluster, supercluster, filament, wall, or void
- **Distance:** To center, in Mly or Gly
- **Size:** Extent in light-years
- **Member Objects:** Number of galaxies, clusters, or superclusters
- **Total Mass:** Solar masses (estimate, mostly dark matter)
- **Density:** Galaxies per cubic megalight-year
- **Velocity Dispersion:** Internal motion of members (km/s)
- **Richness Class:** For clusters, indicates number of member galaxies
- **Dynamical Status:** Relaxed (old, stable) or unrelaxed (young, dynamic)
- **Notable Features:** Central dominant galaxy, cD galaxy, galaxy interactions
- **Age Estimate:** If determinable from member galaxies
- **Related Structures:** Neighboring clusters, parent supercluster, filaments

**Related Object Links:**
- "Member Galaxies"
- "Member Clusters (for superclusters)"
- "Neighboring Structures"
- "Part of Supercluster"
- "Nearby Voids"

---

#### Exotic Objects (Black Holes, Neutron Stars, Pulsars)

**Black Holes:**

**Discovery Methods:**

1. **Visual Markers:**
   - Black holes not directly visible, but marked with special icon
   - In galactic centers: appear as bright point with gravitational lensing effect
   - Rendered as distortion of background starfield around their position

2. **Black Hole Catalog:**
   - Stellar-mass black holes (5-20 solar masses)
   - Supermassive black holes (millions to billions of solar masses, in galaxy centers)
   - Known sources (Cygnus X-1, V404 Cygni, Sagittarius A*)
   - Search by name, distance, or mass range

3. **Accretion Disk Visualization:**
   - For some black holes, rendering shows:
     - Accretion disk (hot matter spiraling in)
     - Rendered as glowing ring
     - Jets (if active) extending from poles
     - Gravitational lensing warping background

4. **Event Horizon Illustration:**
   - Show theoretical event horizon size (Schwarzschild radius):
     - Earth-mass black hole: 1 cm
     - Solar-mass black hole: 3 km
     - Supermassive black hole (M87): millions of km

**Black Hole Properties Display:**

- **Name:** Source designation
- **Type:** Stellar-mass or supermassive
- **Mass:** Solar masses
- **Schwarzschild Radius:** Event horizon size
- **Spin Parameter:** If determinable (how fast it rotates)
- **Discovery Date:** When identified
- **Detection Method:** X-ray emission, radio jets, gravitational effects on companion, etc.
- **Companion Object:** If in binary system
- **Accretion Rate:** Mass falling in per year (if observable)
- **Jet Power:** Power in relativistic jets (if jets present)
- **Notable Features:** Tidal disruption events, flare activity

**Neutron Stars & Pulsars:**

**Discovery Methods:**

1. **Visual Markers:**
   - Marked with unique icon (spinning indicator)
   - Rendered as small bright point in S3+ scales
   - Some rendered as pulsing/blinking to show rotation

2. **Pulsar Catalog:**
   - 3,000+ known pulsars
   - Search by name (PSR designation)
   - Filter by:
     - **Period:** Millisecond pulsars (fastest), second pulsars (slowest)
     - **Type:** Radio pulsars, X-ray pulsars, gamma-ray pulsars
     - **Associated Objects:** Pulsar in supernova remnant, pulsar in binary, etc.

3. **Pulsar Timing Display:**
   - Show rotation period of selected pulsar
   - Render as rotating cylinder or sphere with spin indicator
   - Show spin-down rate (how quickly it's slowing)

4. **Supernova Remnant Context:**
   - Many pulsars found in SNR centers
   - Click SNR name to show central pulsar (if present)
   - Show remnant age estimate

**Pulsar Properties Display:**

- **Name:** PSR designation (e.g., PSR B1919+21)
- **Right Ascension / Declination:** Sky coordinates
- **Period:** Rotation period (milliseconds to seconds)
- **Period Derivative:** Spin-down rate
- **Distance:** Parallax distance (pc or kly)
- **Dispersion Measure:** Radio dispersion indicator (helps determine distance)
- **Spin-Down Age:** Estimate of pulsar age (τ = P / (2 × P_dot))
- **Surface Magnetic Field:** Strength (Tesla)
- **Companion Object:** If in binary system
- **Association:** If in supernova remnant, show SNR name
- **Emission Modes:** Radio, X-ray, gamma-ray, optical
- **Discovery Date:** When identified
- **Pulse Profile:** Shape of radio pulse

**Related Object Links:**
- "Supernova Remnant (if present)"
- "Companion Star"
- "Binary Orbital Parameters"
- "Similar Pulsars"

---

## Scale Transition Animations

Transitioning between scale levels is a critical user experience element. Each transition should feel smooth, cinematic, and educational—helping users understand the hierarchical structure of the universe.

### S0 → S1 (Surface to Orbital)

**Duration:** 1.5 seconds

**Visual Progression:**

- **0.0 sec:** Camera at surface level (first-person view of terrain)
- **0.25 sec:** Camera starts rising, terrain below shrinks
- **0.75 sec:** Atmosphere becomes visible as thin blue halo at horizon
- **1.0 sec:** Entire planet becomes visible as sphere; orbital perspective achieved
- **1.5 sec:** Camera settles at orbital viewing distance; transition complete

**Camera Animation:**

```javascript
const surface_camera_height = terrain_elevation + 10;  // 10m above ground
const orbital_camera_distance = planet_radius * 2.5;   // 2.5x planet radius

// Linear interpolation of camera position
const t = elapsed_time / 1.5;
camera.position = lerp(
    {x: 0, y: surface_camera_height, z: 0},
    {x: orbital_camera_distance, y: 0, z: 0},
    t
);

// FOV transition: narrow (surface) to medium (orbital)
camera.fov = lerp(75, 60, ease_in_out(t));
```

**Object Fading:**

- Terrain detail LOD: fade out highest-detail mesh, fade in simple textured sphere
- Atmosphere: fade in as thin blue line at horizon, reaches full opacity by 0.75 sec
- Moons in sky: fade in as camera rises (become increasingly visible)
- Background starfield: fade in gradually as atmosphere effect diminishes

**Background Changes:**

- **0.0 sec:** Blue sky (atmosphere scattering)
- **0.5 sec:** Sky gradually darkens (approaching space)
- **1.0 sec:** Black space with starfield fully visible
- **1.5 sec:** Distant stars clear and visible

**Audio/Effects:**

- Ascending whoosh sound (0.0-1.0 sec)
- Tone shift from "atmospheric" to "space" music
- Optional: cabin pressure change sound effect

**Collision Avoidance:**

If terrain or mountains in the way:
- Camera path adjusts to spiral upward or laterally
- Smooth arc avoids collisions

---

### S1 → S2 (Orbital to Planetary System)

**Duration:** 2 seconds

**Visual Progression:**

- **0.0 sec:** Camera orbiting target planet close-up
- **0.5 sec:** Planet visible in full frame; system center (star) becomes visible far away
- **1.0 sec:** Entire planetary system visible; other planets appear as spheres, orbital paths as ellipses
- **1.5 sec:** Asteroid belt fades in as diffuse cloud
- **2.0 sec:** Full solar system view; planets appropriately sized; camera settled

**Camera Animation:**

```javascript
const orbital_camera_distance = planet_radius * 2.5;   // S1 endpoint
const system_camera_distance = star_planet_distance * 1.5;  // ~1.5 AU viewing distance

const t = elapsed_time / 2.0;
camera.position = vec3_lerp(
    orbital_camera_distance * camera.forward,
    system_camera_distance * vec3_normalize_to_star,
    ease_in_out(t)
);

// FOV: medium (planet focus) to wide (system focus)
camera.fov = lerp(60, 50, ease_in_out(t));
```

**Object Transitions:**

- **Target Planet:**
  - Shrinks in apparent size as camera backs away
  - Terrain detail fades to texture (0.0-0.5 sec)
  - Becomes simple sphere by 1.0 sec
  - Orbit path appears at 0.5 sec (ellipse around star)

- **Moons of Target Planet:**
  - Fade out as camera backs away
  - Some moons remain visible as dots at target planet's position

- **Other Planets:**
  - Fade in starting at 0.5 sec
  - Grow in visibility to full opacity by 1.5 sec
  - Rendered as spheres with color indicating composition

- **Star:**
  - Becomes increasingly prominent as camera moves away
  - Glow effect (corona) becomes visible
  - Becomes primary light source

- **Asteroid Belt (if present):**
  - Fades in at 1.0 sec as particle cloud
  - Full opacity by 1.5 sec
  - Rendered between Mars and Jupiter orbits (Solar System) or equivalent position in other systems

- **Orbital Paths:**
  - Appear at 0.5 sec as thin ellipse lines
  - Fade to full opacity by 1.5 sec
  - Different colors per planet

**Background Changes:**

- **0.0 sec:** Black space with distant stars
- **0.75 sec:** Starfield remains constant; no atmospheric effects
- **1.5 sec:** Star glow increasingly visible
- **2.0 sec:** Zodiacal light visible extending from star

**Audio/Effects:**

- Continuous ascending tone (0.0-1.0 sec), then steady tone
- Transition from "planetary" music to "solar system" ambient
- Optional: solar wind effect sound

---

### S2 → S3 (Planetary System to Stellar Neighborhood)

**Duration:** 2 seconds

**Visual Progression:**

- **0.0 sec:** Camera viewing full solar system
- **0.5 sec:** Solar system shrinks; nearby stars fade in at horizon
- **1.0 sec:** Multiple stars visible; zodiacal light fades; galaxy backdrop visible
- **1.5 sec:** Stellar neighborhood structure visible (local bubble, nearby clusters)
- **2.0 sec:** Settled at S3 perspective; solar system reduced to single bright point

**Camera Animation:**

```javascript
const system_distance = 5 * AU;          // S2 endpoint
const neighborhood_distance = 10 * light_year;  // S3 viewing distance

const t = elapsed_time / 2.0;
camera.position = vec3_lerp(
    system_distance * camera.direction,
    neighborhood_distance * camera.direction,
    ease_in_out(t)
);

// FOV increases for wider context
camera.fov = lerp(50, 45, ease_in_out(t));
```

**Object Transitions:**

- **Solar System:**
  - Shrinks progressively
  - Individual planets disappear (too small at distance)
  - Star remains visible as bright point
  - By 2.0 sec: single point with slight glow

- **Nearby Stars:**
  - Fade in starting at 0.3 sec
  - Closest stars (Proxima Centauri, Alpha Centauri) brightest
  - Reach full opacity by 1.5 sec
  - Rendered as color-coded points (spectral type determines color)

- **Nebulae:**
  - Already visible at S2 boundary; maintain visibility
  - May increase in apparent size as camera position changes

- **Dust Lanes:**
  - Become more apparent at S3 scale
  - Fade in showing galactic dust structure

**Background Changes:**

- **0.0 sec:** Black space, distant stars
- **1.0 sec:** Milky Way band becomes visible
- **1.5 sec:** Galactic plane structure obvious
- **2.0 sec:** Dust extinction visible along galactic plane

**Audio/Effects:**

- Ascending tone (0.0-1.0 sec), sustained at higher pitch (1.0-2.0 sec)
- Music transitions to "stellar scale" theme
- Optional: subtle starfield rush sound

---

### S3 → S4 (Stellar Neighborhood to Galactic)

**Duration:** 2.5 seconds

**Visual Progression:**

- **0.0 sec:** Stellar neighborhood view; nearby stars visible as points
- **0.75 sec:** Stars increasingly merge; galactic structure emerges
- **1.5 sec:** Spiral arm structure clearly visible; galactic center bright
- **2.0 sec:** Full Milky Way structure; dark dust lane obvious
- **2.5 sec:** Complete galactic perspective; camera settled

**Camera Animation:**

```javascript
const neighborhood_distance = 50 * light_year;   // S3 endpoint
const galactic_distance = 20 * kilolight_year;   // S4 viewing distance

const t = elapsed_time / 2.5;
camera.position = vec3_lerp(
    neighborhood_distance * camera.direction,
    galactic_distance * camera.direction,
    ease_in_out_cubic(t)
);

// FOV widens significantly
camera.fov = lerp(45, 40, ease_in_out(t));
```

**Object Transitions:**

- **Individual Stars:**
  - Fade out progressively
  - At 0.5 sec, start blending together
  - By 1.5 sec: completely merged into galactic structure

- **Milky Way Structure:**
  - Fades in starting at 0.75 sec
  - Spiral arms become visible at 1.5 sec
  - Dust lanes appear at 2.0 sec
  - Galactic center brightens at 1.5 sec

- **Stellar Neighborhood Features (clusters, nebulae):**
  - Scale up in importance
  - Individual nebulae remain visible as colored clouds

- **Background Stars:**
  - Milky Way stars become the only "background" (entire view is galaxy)
  - Dust absorption visible as dark patches

**Background Changes:**

- **0.0 sec:** Black space, nearby stars visible, some nebulae
- **0.75 sec:** Galactic band begins to appear
- **1.5 sec:** Spiral structure obvious
- **2.0 sec:** Dark dust lane clearly visible along galactic plane
- **2.5 sec:** Milky Way structure complete; Earth position marked

**Audio/Effects:**

- Ascending tone increasing in pitch
- Drums/percussion enter music (representing galactic rotation)
- Optional: stellar collision/merger sound effect (stylized, not realistic)
- Lighting shift: cooler lighting toward galactic center

---

### S4 → S5 (Galactic to Intergalactic)

**Duration:** 2.5 seconds

**Visual Progression:**

- **0.0 sec:** Milky Way fills most of view
- **0.75 sec:** Milky Way shrinks; Andromeda becomes visible
- **1.5 sec:** Multiple galaxies clearly visible (Local Group members)
- **2.0 sec:** Local Group structure apparent; nearby clusters visible
- **2.5 sec:** Settled at intergalactic perspective; Milky Way single point

**Camera Animation:**

```javascript
const galactic_distance = 50 * kilolight_year;   // S4 endpoint
const intergalactic_distance = 2 * megalight_year;  // S5 viewing distance

const t = elapsed_time / 2.5;
camera.position = vec3_lerp(
    galactic_distance * camera.direction,
    intergalactic_distance * camera.direction,
    ease_in_out_cubic(t)
);

// FOV widens further
camera.fov = lerp(40, 35, ease_in_out(t));
```

**Object Transitions:**

- **Milky Way:**
  - Spiral structure detail fades out (0.0-1.5 sec)
  - Dust lanes disappear
  - By 1.5 sec: rendered as simple spiral galaxy
  - By 2.5 sec: rendered as point with faint spiral texture (too far to resolve detail)

- **Andromeda Galaxy:**
  - Becomes visible at 0.75 sec
  - Grows in apparent size through 2.5 sec
  - Rendered with spiral structure details
  - Remains larger than Milky Way throughout (intrinsically similar size, but clearly visible)

- **Small Magellanic Cloud & Large Magellanic Cloud:**
  - Fade in as distinct galaxies (smaller than Milky Way)
  - By 2.0 sec: clearly visible as satellite galaxies

- **Other Local Group Members:**
  - Dwarf ellipticals and irregulars fade in as small points
  - By 2.0 sec: dozens of small galaxies visible

- **Virgo Cluster:**
  - Becomes visible at far boundary at 2.5 sec
  - Rendered as point cluster

**Background Changes:**

- **0.0 sec:** Milky Way dominates; some distant galaxies visible beyond
- **1.5 sec:** Multiple large galaxies visible; structure emerges
- **2.0 sec:** Cosmic web structure starting to appear (filaments, voids)
- **2.5 sec:** Visible universe takes on web-like structure

**Audio/Effects:**

- Higher-pitched sustained tone
- Music transitions to "cosmic scale" theme
- Optional: subtle gravitational lens effect sound
- Lighting becomes more diffuse; no single dominant light source

---

### S5 → S6 (Intergalactic to Cosmic)

**Duration:** 3 seconds

**Visual Progression:**

- **0.0 sec:** Intergalactic view with Local Group prominent
- **1.0 sec:** Local Group shrinks; galaxy clusters fade in
- **1.5 sec:** Supercluster filaments become visible; voids appear
- **2.0 sec:** Cosmic web structure fully apparent
- **2.5 sec:** CMB sphere visible at boundary
- **3.0 sec:** Settled at cosmic perspective; Earth position shown

**Camera Animation:**

```javascript
const intergalactic_distance = 2 * megalight_year;  // S5 endpoint
const cosmic_distance = 15 * gigalight_year;        // S6 viewing distance

const t = elapsed_time / 3.0;
camera.position = vec3_lerp(
    intergalactic_distance * camera.direction,
    cosmic_distance * camera.direction,
    ease_in_out_cubic(t)
);

// FOV maximizes at cosmic scale
camera.fov = lerp(35, 30, ease_in_out(t));
```

**Object Transitions:**

- **Local Group Galaxies:**
  - Fade to point size progressively
  - By 2.0 sec: appear as single aggregated point cluster
  - Remain visible but small

- **Nearby Galaxy Clusters:**
  - Fade in starting at 1.0 sec
  - Virgo, Coma, Fornax, Perseus clusters become visible
  - Rendered as point clouds or small clusters

- **Supercluster Filaments:**
  - Become visible at 1.5 sec
  - Bright filaments show where galaxy clusters congregate
  - By 2.0 sec: web structure obvious

- **Cosmic Voids:**
  - Appear as dark regions between filaments
  - Enhance 3D perception of universe structure
  - By 2.0 sec: voids clearly visible

- **CMB Sphere:**
  - Appears at 2.5 sec as glowing sphere at boundary
  - Represents edge of observable universe
  - Shows temperature fluctuations (subtle color variations)

- **High-Redshift Galaxies/Quasars:**
  - May appear as point sources at extreme distance
  - Represent objects from early universe (ancient light)

**Background Changes:**

- **0.0 sec:** Black space with galaxies distributed
- **1.5 sec:** Cosmic web structure visible; filaments bright
- **2.0 sec:** Voids visible as dark regions; web fully structured
- **2.5 sec:** CMB sphere becomes visible
- **3.0 sec:** Entire observable universe visible in perspective

**Audio/Effects:**

- Sustained high tone throughout
- Music reaches crescendo representing cosmic scale
- Optional: subtle CMB radiation hum sound
- Lighting: soft ambient light from all directions (CMB origin)
- "You are here" marker shows Earth position

---

## Coordinate Systems & Reference Frames

### 7.1 Nested Reference Frames

Navigation seamlessly transitions between hierarchically nested reference frames, each appropriate to its scale.

**Planet Surface Frame (S0):**

Coordinates: (latitude, longitude, altitude)
- **Latitude:** -90° (south pole) to +90° (north pole)
- **Longitude:** -180° (antimeridian) to +180° (prime meridian)
- **Altitude:** meters above sea level (or terrain for non-water surfaces)
- Example: (40.7128°N, -74.0060°W, 10 m) = 10 meters above Manhattan

Conversion to Cartesian (for rendering):
```
x = planet_radius * cos(lat) * cos(lon)
y = planet_radius * cos(lat) * sin(lon)
z = planet_radius * sin(lat)
position += altitude * surface_normal
```

**Planet-Centric Frame (S1):**

Coordinates: (x, y, z) in kilometers, centered on planet center

Axes:
- **Z-axis:** Points to planet's north pole
- **X-axis:** Points to 0° longitude (prime meridian)
- **Y-axis:** Completes right-handed system (90° east)

Example: (10,000 km, 5,000 km, 0 km) = position 11,180 km from planet center, in equatorial plane

Useful for orbital mechanics calculations.

**Star-Centric Ecliptic Frame (S2):**

Coordinates: (x, y, z) in AU, centered on star

Axes:
- **Z-axis:** Perpendicular to orbital plane (ecliptic north pole)
- **X-axis:** Points toward vernal equinox (standard reference direction)
- **Y-axis:** Completes right-handed system

Example: (1.0 AU, 0.0 AU, 0.1 AU) = object at 1 AU from star, slightly above ecliptic plane

Useful for planetary orbital calculations (all planets in same system share frame).

**Galactic Frame (S3-S4):**

Coordinates: (Galactic X, Galactic Y, Galactic Z) in light-years or kly

Axes:
- **Galactic Z:** Points toward galactic north pole (right-hand coordinate system)
- **Galactic X:** Points toward galactic anticentre (away from Sagittarius A*)
- **Galactic Y:** Points in direction of galactic rotation

Example: (8,000 ly, 0 ly, 0 ly) = Solar System position (8,000 ly from galactic center in galactic XY plane)

Equivalent to galactic coordinates (l, b, d):
- **l (galactic longitude):** 0° toward galactic center, 90° toward galactic rotation direction
- **b (galactic latitude):** 0° in galactic plane, 90° toward galactic north pole
- **d (distance):** Actual distance from Sun

Conversion:
```
x = d * cos(b) * cos(l)
y = d * cos(b) * sin(l)
z = d * sin(b)
```

**Supergalactic Frame (S5):**

Coordinates: (SGX, SGY, SGZ) in megalight-years

Axes based on supergalactic plane (plane defined by major structures of local universe):
- **SGZ:** Perpendicular to supergalactic plane
- **SGX:** Points toward supergalactic center
- **SGY:** Completes right-handed system

Example: (0 Mly, 10 Mly, 5 Mly) = Milky Way approximate position

Equivalent to supergalactic coordinates (SGL, SGB, distance):
- **SGL (supergalactic longitude):** Measured along supergalactic plane
- **SGB (supergalactic latitude):** Measured perpendicular to plane
- **distance:** Distance in Mly

**Cosmic Comoving Frame (S6):**

Coordinates: (RA, Dec, distance / redshift)

- **RA (Right Ascension):** 0° to 360° (equivalently 0h to 24h), standard celestial coordinates
- **Dec (Declination):** -90° (south celestial pole) to +90° (north celestial pole)
- **Distance / Redshift:** Either luminosity distance (Mly/Gly) or redshift (z = Δλ/λ_rest)

Example: (RA: 180°, Dec: 45°, z: 0.5) = object at redshift 0.5, right ascension 180°, declination 45°

Relationship to distance:
```
// Simplified: comoving distance ≈ luminosity distance / (1+z)
// For precise calculations, use Friedmann equation with Hubble constant
luminosity_distance = comoving_distance * (1 + z)
```

### 7.2 Frame Transitions

**Automatic Frame Switching:**

The system automatically selects the most appropriate reference frame based on current scale:

| Scale | Primary Frame | Secondary Frame | Transition Zone |
|---|---|---|---|
| S0 | Geodetic | Planet-centric | 10 km altitude |
| S1 | Planet-centric | Star-centric ecliptic | 1 AU distance |
| S2 | Star-centric ecliptic | Galactic | 100 AU distance |
| S3 | Galactic | Supergalactic | 100 ly distance |
| S4 | Galactic | Supergalactic | 100 kly distance |
| S5 | Supergalactic | Cosmic comoving | 500 Mly distance |
| S6 | Cosmic comoving | — | — |

**During Frame Transition (when crossing boundary):**

1. **Calculate Transformation:**
   - Compute camera position in both old and new frame coordinates
   - Ensure continuity (same absolute position in world space)

2. **Smooth Coordinate System Morphing:**
   ```javascript
   // Blend between frame representations
   const blend_factor = clamp((distance - threshold_old) / (threshold_new - threshold_old), 0, 1);
   
   const position_old_frame = convert_to_frame(absolute_position, old_frame);
   const position_new_frame = convert_to_frame(absolute_position, new_frame);
   
   const position_displayed = mix(position_old_frame, position_new_frame, blend_factor);
   ```

3. **Update Floating Origin:**
   - Reset floating origin to new frame's reference point
   - Prevents floating-point precision loss

4. **Update UI Coordinate Display:**
   - Gradually transition distance units shown in HUD
   - Example: 99,999 km → 0.00067 AU → 0.000000011 ly

---

[Document continues with remaining sections...]

[Due to token limitations, I'll save the remaining content in the next section. The document framework is established with sections up through coordinate systems.]

To continue, I need to add sections 8-11 covering:
- User Interface During Navigation (HUD, minimap, breadcrumbs, sidebars)
- Performance Optimization
- Accessibility Navigation
- Navigation State Machine  
- URL Deep Linking

Would you like me to continue writing those remaining sections now?
---

## User Interface During Navigation

### 8.1 Heads-Up Display (HUD)

The HUD appears as a permanent overlay providing critical navigation and context information. Elements are semi-transparent and scale-adaptive, only showing information relevant to current scale.

**Top-Left Corner - Position & Scale:**

```
POSITION DISPLAY
Current Coordinates:
├─ Scale Level: S3 (Stellar Neighborhood)
├─ Distance: 42.5 light-years
├─ RA: 14h 29m 43s | Dec: -62° 40' 46"
└─ Reference: Proxima Centauri
```

Display adapts to scale:
- S0: Latitude 40.7128°N, Longitude 74.0060°W, Altitude 10 m
- S1: Distance 2,500 km, Orbital Velocity 7.8 km/s, Altitude above surface 250 km
- S2: Distance 1.2 AU, Heliocentric coordinates (1.0 AU, 0.2 AU, 0.05 AU)
- S3+: Galactic/supergalactic coordinates and light-year distances

**Top-Right Corner - Scale Indicator:**

Visual indicator showing current position within scale hierarchy:

```
[S0] [S1] [S2] [S3●●●] [S4] [S5] [S6]
                    ↑
              Current position (S3)
              with 3 units into scale
```

A filled progress bar between S3 and S4 shows exact position. Color-codes current scale for quick visual reference.

**Bottom-Left Corner - Nearest Notable Object:**

```
NEAREST OBJECT
→ Proxima Centauri
  Distance: 4.24 ly
  Type: M5.5V Red Dwarf
  [NAVIGATE]
```

Updates continuously as camera moves. Click "NAVIGATE" for click-to-navigate approach.

**Bottom-Right Corner - Speed & Heading:**

```
SPEED: 15 ly/s
HEADING: 217° (toward Sirius)
MODE: Free Flight | [Switch to Orbit]
BOOST: 5x Enabled (Shift held)
```

Shows current velocity, direction relative to local reference frame, and active navigation mode. Updates in real-time as user inputs change.

**Center - Directional Compass:**

A minimal compass rose or gyroscope indicator showing current heading. Rotates as camera rotates. Changes style based on scale:
- S0: Cardinal directions (N, E, S, W)
- S1: Ecliptic plane orientation (shows orbital north pole)
- S2+: Galactic plane orientation (shows direction to galactic center)

**Warning Indicators:**

Appear as animated alerts when relevant:
- "Entering Asteroid Belt" (when approaching dense region)
- "Approaching Stellar Hazard" (when near object collision path)
- "Precision Mode Active" (when Ctrl held)
- "Time Dilation Effects" (if traveling at relativistic speeds, if enabled)

---

### 8.2 Minimap

A small window showing current position in context of the next-larger scale. Position: top-right corner (customizable to any corner).

**Minimap Structure:**

For S0 (Surface):
- Shows region 100 km × 100 km around camera
- Terrain elevation as grayscale (darker = lower)
- Camera position as bright dot
- Nearby landmarks as icons

For S1 (Orbital):
- Shows planetary system in miniature
- Parent planet as large circle
- Moons as small circles in correct orbital positions
- Camera position as dot
- Orbital paths as faint ellipses

For S2 (Planetary System):
- Shows star at center
- Planets as appropriately-sized circles, actual orbital positions
- Camera position as dot
- Orbital paths as ellipses

For S3-S4 (Galactic):
- Shows local region 500 ly across
- Nearby stars as color-coded dots
- Spiral arm structure visible (if at S4)
- Galactic center direction indicated with arrow
- Camera position as central dot with circle showing current field of view radius

For S5-S6 (Intergalactic/Cosmic):
- Shows local universe 10 Mly across
- Galaxy clusters as dot clusters
- Filaments as lines
- Voids as dark regions
- Camera position marked
- FoV indicator shows what's currently visible

**Minimap Interaction:**

- Click any location on minimap to navigate there (click-to-navigate from minimap)
- Drag to pan the minimap view (changes what area is shown)
- Scroll to zoom minimap in/out
- Toggle minimap visibility with 'M' key
- Click edge of minimap to snap back to camera center position

**Color Coding in Minimap:**

- **Blue:** Water bodies, oceans, ice
- **Green:** Vegetation, habitable regions
- **Brown:** Rocky terrain, mountains
- **Red:** Volcanic regions, hot zones
- **Gray:** Airless bodies, asteroids
- **Yellow:** Stars (brightness indicates luminosity)
- **White:** Player position, selected object

---

### 8.3 Breadcrumb Trail

A hierarchical navigation path showing the nesting structure, positioned above the main viewport.

**Breadcrumb Visualization:**

```
Observable Universe > Laniakea Supercluster > Milky Way > Solar System > Earth > Surface
              ↓              ↓                      ↓           ↓        ↓       ↓
          [S6 link]    [S5 link]              [S4 link]   [S2 link] [S1 link] [S0 current]
```

Each breadcrumb is clickable to zoom out/jump to that level instantly.

**Dynamic Update:**

Breadcrumbs automatically update as user navigates:
- When zooming out, new level is added to right
- When navigating within a level, breadcrumbs remain constant
- When zooming in, new level is appended

Example navigation sequence:

```
Start: Observable Universe > Milky Way > Solar System
Navigate to Andromeda: Observable Universe > Andromeda Galaxy
Navigate to star in Andromeda: Observable Universe > Andromeda Galaxy > Star: Andromeda-P001
```

**Customization:**

Users can:
- Collapse/expand breadcrumb (hide some levels for cleaner interface)
- Show/hide full names (abbreviated form available)
- Change location in UI (move to bottom or side)

---

### 8.4 Entity Sidebar (when object selected)

When any object is clicked, a sidebar appears (right side by default, customizable) with detailed information.

**Sidebar Layout:**

```
┌──────────────────────────────────────────┐
│ ✕ [Object Name: Kepler-452b]             │
├──────────────────────────────────────────┤
│ [NAVIGATE] [PIN TO MAP] [BOOKMARK] [COPY]│
├──────────────────────────────────────────┤
│ OBJECT TYPE: Exoplanet                   │
│ Classification: Rocky, Habitable-zone    │
├──────────────────────────────────────────┤
│ PHYSICAL PROPERTIES                      │
│ ├─ Mass: 5.0 Earth masses                │
│ ├─ Radius: 1.6 Earth radii               │
│ ├─ Density: 5.5 g/cm³                    │
│ └─ Surface Temperature: 265 K            │
│                                          │
│ ORBITAL PROPERTIES                       │
│ ├─ Host Star: Kepler-452                 │
│ ├─ Orbital Period: 384.8 days            │
│ ├─ Semi-major Axis: 1.046 AU             │
│ ├─ Eccentricity: 0.0                     │
│ └─ Insolation: 1.1× Earth's              │
│                                          │
│ DISCOVERY                                │
│ ├─ Discovered: 2015                      │
│ ├─ Method: Transit Photometry             │
│ └─ Observatory: Kepler Space Telescope    │
│                                          │
│ RELATED OBJECTS                          │
│ [Other Planets] [Host Star] [Nearby]     │
│                                          │
│ TAGS: #exoplanet #habitable #terrestrial │
└──────────────────────────────────────────┘
```

**Sidebar Features:**

1. **Quick Actions (Top):**
   - Navigate: Approach this object
   - Pin to Map: Permanently mark location on minimap
   - Bookmark: Save for later
   - Copy: Copy object reference (for sharing)

2. **Object Identification:**
   - Name prominently displayed
   - Icon indicating type (star, planet, galaxy, etc.)
   - Alternative names and catalog numbers

3. **Categorized Properties:**
   - Physical properties (mass, radius, temperature, composition)
   - Orbital/positional properties
   - Discovery/observation data
   - Notable features or phenomena

4. **Related Object Links:**
   - Clickable links to related objects (host star, moons, nearby objects)
   - Embedded navigation—clicking link updates sidebar to show that object

5. **Search Tags:**
   - User-applicable tags for filtering
   - Pre-populated with classification tags
   - Allows custom tagging for research/collection

6. **Observation Tools:**
   - If applicable: show mission data (spacecraft visits, landing sites)
   - Observatory observation notes
   - Historical observation records

7. **Floating Mode:**
   - Sidebar can be dragged around screen by header
   - Can be docked to left side
   - Can be resized by dragging edge
   - Remember user position preference

---

### 8.5 Entity Info Panel

Appears as overlay when selecting objects, showing summary data without sidebar.

Compact version shows minimal information:
```
Name: Betelgeuse
Type: M2 Red Supergiant
Distance: 643 ly
Magnitude: 0.42 (variable)
```

Can be expanded to full sidebar or dismissed with Escape key.

---

## Performance Optimization for Navigation

Cosmos Explorer must maintain 60 FPS across scales while rendering realistic complexity.

### Frustum Culling Per Scale Level

Render only objects within camera's field of view:

```javascript
// For S0-S1 scales: frustum culling at object level
function cull_objects(camera, objects) {
    const frustum = new Frustum();
    frustum.setFromProjectionMatrix(camera.projection_matrix);
    
    return objects.filter(obj => {
        return frustum.containsPoint(obj.position) || 
               frustum.intersectsSphere(obj.position, obj.radius);
    });
}

// For S3-S6 scales: spatial partitioning with octree
class GalacticOctree {
    subdivide_recursively(node, depth) {
        if (depth > MAX_DEPTH || node.count < MIN_OBJECTS) return;
        // Create 8 child nodes, distribute objects
    }
    
    query_frustum(frustum) {
        // Return only octree nodes intersecting frustum
    }
}
```

### Octree/BVH Spatial Indexing

Clickable objects organized in Bounding Volume Hierarchy for fast raycasting (click detection):

```javascript
// BVH for click detection
class BVHNode {
    constructor(objects) {
        this.bounding_box = compute_aabb(objects);
        if (objects.length > SPLIT_THRESHOLD) {
            this.left = new BVHNode(objects.slice(0, mid));
            this.right = new BVHNode(objects.slice(mid));
        } else {
            this.objects = objects;
        }
    }
    
    raycast_query(ray) {
        if (!ray.intersects_box(this.bounding_box)) return [];
        if (this.objects) return this.objects.filter(obj => ray.intersects(obj));
        return [...this.left.raycast_query(ray), ...this.right.raycast_query(ray)];
    }
}
```

### Progressive Loading

Load detail data only when approaching objects:

```javascript
class DataLoadManager {
    // Predict where camera is going based on velocity
    predict_target_position(camera, lookahead_time = 5) {
        return camera.position + camera.velocity * lookahead_time;
    }
    
    // Preload data for objects that will be nearby in 5 seconds
    update_load_queue() {
        const upcoming_objects = spatial_index.query_sphere(
            this.predict_target_position(),
            LOOKAHEAD_DISTANCE
        );
        
        upcoming_objects.forEach(obj => {
            if (!obj.data_loaded) {
                fetch_object_data(obj.id);  // Async
            }
        });
    }
}
```

### Level of Detail (LOD) Transitions

Smooth morphing between mesh LODs at distance boundaries:

```javascript
// Vertex shader performs LOD blending
#version 300 es

uniform float lod_blend_factor;  // 0.0 = high detail, 1.0 = low detail
uniform sampler2D detail_texture;
uniform sampler2D lod_texture;

in vec3 position_detail;
in vec3 position_lod;

void main() {
    // Blend between two position attributes
    vec3 blended_position = mix(position_detail, position_lod, lod_blend_factor);
    gl_Position = projection * view * vec4(blended_position, 1.0);
    
    // Fade between textures
    vec4 detail_color = texture(detail_texture, uv);
    vec4 lod_color = texture(lod_texture, uv);
    frag_color = mix(detail_color, lod_color, lod_blend_factor);
}
```

### Object Pooling for Instanced Rendering

Reuse mesh instances for repeated objects (asteroids, stars):

```javascript
class ParticlePool {
    constructor(max_particles) {
        // Single mesh instanced many times
        this.instance_buffer = new InstancedBufferGeometry();
        this.max_particles = max_particles;
        this.active_particles = [];
    }
    
    spawn_particle(position, size) {
        const particle = this.active_particles.length < this.max_particles 
            ? this.create_particle() 
            : this.reuse_oldest_particle();
        
        particle.position = position;
        particle.size = size;
        particle.age = 0;
        
        return particle;
    }
    
    update(delta_time) {
        // Update all particles in single draw call
        this.active_particles.forEach(p => {
            p.age += delta_time;
            if (p.age > p.lifetime) this.recycle(p);
        });
        
        // Upload instance data in single buffer update
        this.update_instance_buffer();
        this.mesh.render_instances(this.active_particles.length);
    }
}
```

### Web Worker for Spatial Queries

Off-load expensive spatial calculations:

```javascript
// Main thread
class NavigationManager {
    find_nearby_objects() {
        this.worker.postMessage({
            method: 'query_radius',
            center: camera.position,
            radius: QUERY_RADIUS,
            scale: current_scale
        });
    }
}

// Worker thread (worker.js)
self.onmessage = function(event) {
    const {method, center, radius, scale} = event.data;
    
    if (method === 'query_radius') {
        const results = spatial_index.query_sphere(center, radius);
        self.postMessage({results: results, scale: scale});
    }
};
```

---

## Accessibility Navigation

Cosmos Explorer supports multiple accessibility modes ensuring all users can explore the universe.

### Keyboard-Only Navigation

All features accessible via keyboard:

**Movement:**
- **WASD / Arrow Keys:** Move forward/backward/left/right
- **Q / E:** Rotate view left/right
- **R / F:** Look up/down
- **Spacebar / Ctrl:** Move up/down

**Object Interaction:**
- **Tab:** Cycle through nearby objects (within 10 units)
- **Shift+Tab:** Reverse cycle
- **Enter:** Select/navigate to focused object
- **Escape:** Deselect current object
- **Ctrl+F:** Open search bar
- **1-7:** Jump to scale S0-S6 directly
- **[** / **]:** Zoom in/out one scale level

**UI Navigation:**
- **Tab:** Cycle through UI elements (sidebar, buttons, etc.)
- **Enter / Space:** Activate focused UI element
- **Escape:** Close open panels/menus

**Accessibility Features:**
- **Alt+U:** Toggle UI visibility (hide for immersive experience)
- **Alt+H:** Open keyboard shortcut help
- **Alt+A:** Toggle accessibility mode (enhanced contrast, larger text)

### Tab Navigation for Object Selection

When Tab is pressed repeatedly, focus cycles through nearby objects in order of proximity:

```javascript
function cycle_selection(direction = 1) {
    const nearby = get_nearby_objects(camera.position, TAB_SEARCH_RADIUS);
    const sorted = nearby.sort((a, b) => distance(camera, a) - distance(camera, b));
    
    current_selection_index = (current_selection_index + direction) % sorted.length;
    select_object(sorted[current_selection_index]);
    
    // Announce in screen reader
    announce(`Focused on ${sorted[current_selection_index].name}`);
}
```

### Screen Reader Support

Full integration with ARIA labels and semantic HTML:

```html
<button aria-label="Navigate to selected object" class="nav-button">
    Navigate
</button>

<div aria-live="polite" aria-atomic="true">
    <!-- Status messages announced automatically -->
</div>

<div role="region" aria-label="Object Information">
    <!-- Sidebar content -->
</div>
```

Announcements for:
- Object selection: "Focused on Betelgeuse, Red Supergiant, 643 light-years away"
- Scale transitions: "Zoomed to Stellar Neighborhood scale, 100 light-years view"
- Navigation completion: "Arrived at Kepler-452b, exoplanet in habitable zone"
- Warnings: "Approaching asteroid belt, many small objects nearby"

### High Contrast Mode

Toggle-able from settings:

```css
/* High contrast mode */
body.accessibility-high-contrast {
    --primary-color: #FFFF00;        /* Bright yellow */
    --secondary-color: #000000;      /* Pure black */
    --accent-color: #FF00FF;         /* Bright magenta */
    --background-color: #000000;
    --text-color: #FFFF00;
    
    /* Increase border widths */
    border-width: 3px;
    
    /* Increase font sizes */
    font-size: 1.2em;
    
    /* Increase opacity of UI elements */
    opacity: 1.0;
}
```

### Reduced Motion Option

Disable transition animations for users with motion sensitivity:

```javascript
const prefers_reduced_motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (prefers_reduced_motion) {
    // Instant transitions instead of smooth animations
    transition_scale(target_scale, INSTANT);  // duration = 0
    
    // No camera movement damping
    camera.damping_factor = 1.0;  // Instant acceleration
}
```

### Voice Command Navigation (Future)

Extensible framework for voice control:

```javascript
class VoiceCommandListener {
    commands = {
        'go to [object_name]': (name) => { navigate_to_object(name); },
        'zoom in': () => { scale_in(); },
        'zoom out': () => { scale_out(); },
        'show info': () => { show_sidebar(); },
        'hide ui': () => { toggle_ui(); },
    };
}
```

---

## Navigation State Machine

Navigation operates within a state machine with distinct states and transitions.

### Defined States

**IDLE:**
- Camera at rest, no input
- User can begin free-flight, search, or click object
- Transitions: → FREE_FLIGHT (on movement), → SEARCH (on Ctrl+F), → APPROACH (on click)

**FREE_FLIGHT:**
- User controlling camera with WASD/mouse
- Real-time velocity and damping applied
- Can transition out at any time
- Transitions: → IDLE (on no input, after damping), → APPROACH (on click), → SEARCH (on Ctrl+F)

**APPROACH:**
- Automatic camera animation toward clicked object
- User input disabled except Escape (abort)
- Duration: 2-3 seconds
- Transitions: → ARRIVED (on animation complete), → IDLE (on Escape pressed)

**ARRIVED:**
- Camera at safe distance from object
- Object info sidebar displayed
- Free-flight re-enabled
- Transitions: → FREE_FLIGHT (on movement), → APPROACH (on click related object), → SEARCH (on search)

**ORBITING:**
- Optional auto-orbit mode around selected object
- Camera maintains distance, slowly rotates around object
- User can toggle orbit on/off with 'O' key
- Transitions: → FREE_FLIGHT (on 'O' or movement), → SEARCH (on Ctrl+F)

**TOUR:**
- Automatic guided tour active
- Camera follows predetermined path
- User can pause/resume/skip/exit
- Transitions: → IDLE (on tour complete or user exits), → PAUSED (on pause)

**PAUSED:**
- Tour paused, camera held at current waypoint
- User can explore or skip to next waypoint
- Transitions: → TOUR (on resume), → IDLE (on exit)

**SEARCH:**
- Search interface active
- Camera and input frozen
- User typing search query
- Transitions: → IDLE (on Escape), → APPROACH (on search result selected)

**TRANSITION:**
- Scale level boundary crossing active
- Camera animating between scales
- User input queued but not processed
- Transitions: → (appropriate state for new scale) on completion

### State Transition Diagram

```
                    ┌──────────┐
                    │  IDLE    │
                    └──────────┘
                    /    |    \
                   /     |     \
        FREE_FLIGHT  SEARCH  APPROACH
            |           |        |
            └─────┬─────┘        |
                  |         ARRIVED
                  |           / |
                  └───────────  |
                            ORBIT
            
        TOUR ←───────────────┐
         | \                  |
    PAUSE  EXIT ──────────────┘
         | 
        (resume)
```

---

## URL Deep Linking

Every navigation state is encodable as a URL, allowing users to:
- Share exact views with others
- Bookmark favorite locations
- Embed specific views in web pages

### URL Structure

Base: `https://cosmos-explorer.com/`

**Format 1 - Named Object Navigation:**

```
#/object/{object_id}[?scale={scale}&zoom={zoom}]
```

Examples:
- `#/object/kepler-452-b` → Navigate to exoplanet Kepler-452b
- `#/object/andromeda-galaxy?scale=5` → Andromeda at S5 scale
- `#/object/earth?scale=0` → Earth surface view

**Format 2 - Coordinate-Based Navigation:**

```
#/position/{coordinates}[?scale={scale}&fov={fov}]
```

For S0 (surface):
- `#/position/40.7128,-74.0060,100m` → New York at 100m altitude

For S1 (orbital):
- `#/position/0,0,1AU?scale=1` → 1 AU from selected body's center

For S3+ (stellar/galactic):
- `#/position/ra:180/dec:45/dist:100ly` → RA 180°, Dec 45°, 100 ly from Earth
- `#/position/gal:0/dec:0/dist:10kly` → Galactic center direction, 10 kly distance

**Format 3 - Relative Position:**

```
#/nearobject/{object_id}?approach_distance={km}&fov={degrees}
```

Example:
- `#/nearobject/jupiter?approach_distance=100000` → 100,000 km from Jupiter

### URL Parameters

| Parameter | Scale | Values | Default |
|---|---|---|---|
| `scale` | All | 0-6 | Current |
| `zoom` | All | 0.1-10 | 1.0 |
| `fov` | All | 20-120 | Scale-dependent |
| `time` | All | ISO 8601 date or offset | Current |
| `speed` | All | 1x, 100x, 10000x, etc. | 1x |
| `tour` | All | Tour name | None |
| `guide` | All | boolean | false |

### URL Encoding Examples

**Full Exoplanet View:**
```
https://cosmos-explorer.com/#/object/trappist-1e?scale=2&fov=60&time=2026-01-01T00:00:00Z
```

Shows TRAPPIST-1e at scale 2 (orbital), 60° FOV, on specified date.

**Galactic Survey:**
```
https://cosmos-explorer.com/#/position/ra:0/dec:0/dist:1kly?scale=4&guide=true
```

Shows galactic region with narration guide enabled.

**Embedded in Webpage:**
```html
<iframe src="https://cosmos-explorer.com/#/object/betelgeuse?scale=3"></iframe>
```

Embed a view of Betelgeuse in a webpage.

**Time-Travel Link:**
```
https://cosmos-explorer.com/#/object/solar-system?time=2000-01-01&speed=100000x
```

Shows Solar System on Jan 1, 2000 with 100,000x time acceleration.

### Sharing Workflow

When user clicks "Share" button:

```javascript
function generate_share_link() {
    const current_state = {
        object: selected_object?.id,
        position: camera.position,
        scale: current_scale,
        fov: camera.fov,
        time: current_time,
        rotation: camera.rotation
    };
    
    const url = build_url(current_state);
    
    // Copy to clipboard
    navigator.clipboard.writeText(url);
    
    // Show notification
    show_notification("Link copied to clipboard!");
    
    return url;
}
```

### Loading from URL

On page load, parse URL and navigate:

```javascript
function load_from_url(hash) {
    const [target_type, target_data] = parse_hash(hash);
    
    switch(target_type) {
        case 'object':
            navigate_to_object(target_data.object_id);
            break;
        case 'position':
            navigate_to_position(target_data.coordinates, target_data.scale);
            break;
        case 'nearobject':
            navigate_near_object(target_data.object_id, target_data.approach_distance);
            break;
    }
    
    // Apply optional parameters
    if (url_params.has('time')) set_time(url_params.get('time'));
    if (url_params.has('scale')) set_scale(url_params.get('scale'));
    if (url_params.has('tour')) start_tour(url_params.get('tour'));
}

// On page load
window.addEventListener('hashchange', () => {
    load_from_url(window.location.hash);
});

// On initial page load
load_from_url(window.location.hash || '#/object/earth');
```

### Bookmarkable Waypoints

Users can create and save waypoint collections:

```javascript
class WaypointLibrary {
    save_waypoint(name, description) {
        const waypoint = {
            name: name,
            description: description,
            url: generate_share_link(),
            thumbnail: capture_screenshot(),
            created: new Date()
        };
        
        // Save to localStorage
        localStorage.setItem(`waypoint_${name}`, JSON.stringify(waypoint));
    }
    
    list_waypoints() {
        // Return all saved waypoints
    }
    
    load_waypoint(name) {
        // Navigate to waypoint URL
    }
}
```

---

## Conclusion

This Navigation System & Scale Transition Specification provides a complete framework for enabling seamless exploration of the universe across 40+ orders of magnitude. By combining logarithmic coordinate systems, adaptive interface elements, and thoughtful interaction patterns, Cosmos Explorer allows users to intuitively discover and navigate to every entity type—from planetary surfaces to cosmic structures spanning billions of light-years.

The specification is designed to be implementable in modern WebGL/Three.js while maintaining accessibility, performance, and educational value. Regular updates to this document should track improvements in navigation methods, new discovery systems, and performance optimizations as the application evolves.

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-16  
**Status:** Complete Specification  
**Next Review:** Upon major feature release or quarterly update cycle

