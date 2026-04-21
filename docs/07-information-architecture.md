# Information Architecture: Cosmos Explorer

**Version:** 2.0  
**Date:** 2026-04-16  
**Status:** Approved  
**Product:** Cosmos Explorer (Browser-based 3D Universe Visualization)  
**Entity Taxonomy:** Doc 22 — Interactive Toggle Features v4.2 (96 entity types, 9 categories)

---

## 1. Content Inventory

### 1.1 Celestial Objects

**Entity Taxonomy (Doc 22 v4.2):** 96 entity types across 9 categories:
1. **Stars (ENT-1000)** — 31 types
2. **Planets (ENT-2000)** — 27 types
3. **Moons & Satellites (ENT-3000)** — 15 types
4. **Small Bodies (ENT-4000)** — 20 types (asteroids, comets, dwarf planets, KBOs, centaurs, trojans)
5. **Nebulae & ISM (ENT-5000)** — 14 types
6. **Galaxies (ENT-6000)** — 19 types
7. **Large-Scale Structure (ENT-7000)** — 12 types (clusters, cosmic web, CMB)
8. **Exotic Objects (ENT-8000)** — 16 types

#### Stars
- Catalog identifiers (Hipparcos, SAO, HD, Yale Bright Star)
- Position (Right Ascension, Declination, Distance in parsecs/light-years)
- Spectral classification (OBAFGKM types)
- Apparent magnitude, absolute magnitude
- Effective temperature (Kelvin)
- Luminosity (solar units)
- Mass (solar masses)
- Radius (solar radii)
- Age (billions of years)
- Parent constellation
- Proper motion vectors
- Parallax data
- Distance uncertainties
- Notable facts/observational history
- Discoverer/catalog source

#### Planets
- Name, designation (e.g., TRAPPIST-1b)
- Parent star reference
- Orbital elements (semi-major axis, eccentricity, period, inclination)
- Physical properties (radius, mass, density)
- Surface/atmospheric composition
- Temperature (surface, equilibrium)
- Habitability indicators
- Moon count and names
- Ring system properties
- Texture/appearance assets
- Discovery date and discoverer
- Detection method
- Transit/radial velocity data

#### Galaxies
- Name (NGC, Messier, Andromeda, etc.)
- Galactic coordinates (galactic longitude/latitude)
- Distance (redshift, megaparsecs)
- Morphological type (spiral, elliptical, irregular, lenticular)
- Redshift value
- Size estimates (kiloparsecs)
- Mass estimates (solar masses × 10^9 or 10^10)
- Notable features (dust lanes, bars, rings, active nucleus)
- Star formation rate
- Historical observations
- Observatories of discovery
- Supermassive black hole estimates

#### Small Bodies
- Asteroid/comet/dwarf planet designation
- Orbital elements (semi-major axis, eccentricity, inclination)
- Physical properties (diameter, mass, density)
- Orbital classification (main belt, Kuiper Belt object, centaur, trojan, etc.)
- Spectral type / composition
- Rotation period
- Notable features (craters, composition, outgassing)
- Discovery date and discoverer
- Proper motion and orbital mechanics

#### Nebulae & ISM
- Name and catalog IDs
- Position (RA/Dec and galactic coordinates)
- Type (emission, reflection, dark, planetary, supernova remnant)
- Size (angular and physical)
- Distance
- Associated stellar clusters/stars
- Emission lines present
- Temperature estimates
- Ionizing source stars
- Notable features
- Appearance/texture assets

#### Large-Scale Structure
- **Star Clusters** (globular, open, association)
  - Name (M13, NGC 104, etc.)
  - Type and classification
  - Position and distance
  - Member star count (estimated)
  - Physical extent (parsecs)
  - Age and metallicity [Fe/H]
  - Core/tidal radius
- **Galaxy Clusters & Cosmic Web**
  - Cluster/supercluster name and ID
  - Member galaxy count
  - Total mass and physical scale
  - Redshift and recession velocity
  - Filament structure and void mapping
- **Cosmic Microwave Background (CMB)**
  - Surface properties and temperature anisotropies
  - Reference frame and coordinate system

#### Exotic Objects
- Black holes (stellar, intermediate, supermassive)
- Neutron stars and pulsars
- White dwarfs and subdwarfs
- Quasars and active galactic nuclei
- Supernovae remnants and transients
- Gravitational lensing systems
- Relativistic jets and accretion disks
- Other high-energy phenomena

### 1.2 UI Content

- Navigation labels (Free-Fly, Orbit, Teleport, Guided Tour)
- Scale level labels (Solar System, Stars, Galaxy, Clusters, Cosmic Web)
- Info panel headers and field labels
- Search result listings
- Settings options and descriptions
- Tooltips and contextual help
- Tutorial/onboarding text
- Share/export format descriptions

### 1.3 Educational Content

- Constellation mythology
- Stellar evolution concepts
- Exoplanet habitability explanations
- Cosmic distance scales
- Redshift definitions
- Galaxy classification
- Historical mission data (Gaia, Kepler, JWST)

---

## 2. Site/App Map (Hierarchical Structure)

```
COSMOS EXPLORER (Root)
├── 3D VIEWPORT (Primary Content Area)
│   ├── Rendered celestial objects
│   ├── Visual UI overlays
│   └── Camera positioning system
│
├── NAVIGATION SYSTEM
│   ├── Navigation Modes
│   │   ├── Free-Fly Mode
│   │   │   ├── Keyboard/mouse controls
│   │   │   └── Speed adjustment slider
│   │   ├── Orbit Mode
│   │   │   ├── Target selection
│   │   │   └── Orbit radius/speed
│   │   ├── Teleport Mode
│   │   │   └── Location input/selection
│   │   └── Guided Tour Mode
│   │       ├── Tour list
│   │       └── Playback controls
│   │
│   └── Scale Level Navigation
│       ├── Solar System (50 AU scale)
│       ├── Stellar Neighborhood (1000 light-year scale)
│       ├── Galactic Scale (100,000 light-year scale)
│       ├── Galaxy Cluster Scale (10 million light-year scale)
│       └── Cosmic Web (Gigaparsec scale)
│
├── SEARCH SYSTEM
│   ├── Search Input Field
│   ├── Search Filters
│   │   ├── By Object Type
│   │   ├── By Constellation
│   │   ├── By Distance Range
│   │   └── By Catalog ID
│   ├── Autocomplete Suggestions
│   ├── Search Results List
│   └── "Nearby Objects" Panel
│
├── OBJECT INFO PANEL
│   ├── Object Header (Name, Type, Distance)
│   ├── Visual Preview/Thumbnail
│   ├── Physical Properties Section
│   ├── Observational Data Section
│   ├── Historical/Discovery Section
│   ├── Related Objects Links
│   ├── Bookmarking Controls
│   └── Share Controls
│
├── TIME CONTROLS
│   ├── Play/Pause Button
│   ├── Time Speed Slider (1x, 10x, 100x, 1000x)
│   ├── Date/Time Display
│   ├── Jump to Date Input
│   └── Reset to Present
│
├── AUDIO SYSTEM
│   ├── Background Music Toggle
│   ├── Narration Toggle
│   ├── Sound Effects Toggle
│   └── Volume Control
│
├── SETTINGS PANEL
│   ├── Graphics Settings
│   │   ├── Rendering Quality (low/med/high/ultra)
│   │   ├── Particle Effects Toggle
│   │   ├── Light Effects Toggle
│   │   └── Stars Density Slider
│   ├── Data Display Settings
│   │   ├── Label Density (minimal/normal/detailed)
│   │   ├── Grid/Coordinate System Toggle
│   │   ├── Orbital Paths Toggle
│   │   └── Constellation Lines Toggle
│   ├── Unit Settings
│   │   ├── Distance (km/AU/light-year/parsec)
│   │   ├── Temperature (Celsius/Fahrenheit/Kelvin)
│   │   └── Mass (Earth/Solar masses)
│   ├── Language Selection
│   ├── Accessibility Options
│   │   ├── Font Size
│   │   ├── High Contrast Mode
│   │   └── Screen Reader Support
│   └── Data Source Attribution
│
├── HELP & TUTORIAL OVERLAY
│   ├── Getting Started Guide
│   ├── Navigation Tutorial
│   ├── Search Tips
│   ├── Scale Explanation
│   ├── Keyboard Shortcuts
│   └── Context-Sensitive Help
│
└── SHARE & EXPORT
    ├── Share Current View (URL generation)
    ├── Export Bookmark List
    ├── Export Screenshot
    ├── Social Media Share Options
    └── Citation Generator (for objects)
```

---

## 3. Navigation Model

### 3.1 Primary Navigation Modes

**Free-Fly Mode**
- User has full 6-DOF control (pitch, yaw, roll, forward/back, strafe, up/down)
- Speed adjustable via slider or keyboard
- Camera inertia optional
- Collision detection disabled
- Best for exploration and discovery

**Orbit Mode**
- Camera orbits a selected object at fixed distance
- Adjustable orbit radius
- User controls latitude/longitude around target
- Focus always on target object
- Auto-zoom when entering very small scales

**Teleport Mode**
- Search for object → instant viewport centering
- Maintains current zoom scale or auto-adjusts
- Smooth camera transition (2-3 seconds)
- Best for objective-driven exploration

**Guided Tour Mode**
- Pre-scripted camera paths with narration
- Pre-selected tour topics (Solar System Overview, Exoplanet Hunt, Galaxy Gallery)
- Playback controls (play, pause, skip forward/back)
- Can exit and return to free exploration

### 3.2 Scale Navigation

Scale transitions trigger automatically based on zoom level or explicit level selection:

- **Level 0: Solar System** (0.1 AU to 200 AU) — All planets, Moon, major asteroids visible
- **Level 1: Stellar Neighborhood** (1 to 1000 light-years) — Nearby stars with proper motion
- **Level 2: Galactic Scale** (1000 to 100,000 light-years) — Galactic structure, star clusters
- **Level 3: Galaxy Cluster** (100k to 10M light-years) — Multiple galaxies, local group
- **Level 4: Cosmic Web** (10M to 13.8B light-years) — Galaxy filaments, voids, CMB surface

**Transition Logic:**
- Zoom out past threshold → next scale level auto-activates
- Objects fade/disappear based on level rules
- Stars show proper motion only in Levels 1-2
- Exoplanet data only visible in Level 0-1
- Cosmological redshift visible only in Level 4

### 3.3 State Diagram (Text-Based)

```
[LANDING STATE]
    ↓
[VIEWPORT + DEFAULT NAV MODE]
    ↓ (user selects)
    ├→ [FREE-FLY MODE] ↔ [ZOOM/SCALE CHANGE]
    ├→ [ORBIT MODE] (requires target selection)
    ├→ [TELEPORT MODE] → [SEARCH INTERFACE] → [RESULTS] → [OBJECT CENTERED]
    └→ [GUIDED TOUR MODE] → [TOUR PLAYING]
    ↓ (at any state)
    [CLICK OBJECT] → [INFO PANEL OPEN]
    ↓
    [INFO PANEL] ↔ [BOOKMARK/SHARE]
    ↓
    [CLOSE INFO PANEL] → [RETURN TO NAV]
    ↓ (at any state)
    [OPEN SETTINGS] ↔ [MODIFY PREFERENCES]
    ↓
    [OPEN HELP] ↔ [VIEW TUTORIALS/SHORTCUTS]
```

---

## 4. Content Model

### 4.1 Star Object

```
STAR {
  // Identity
  name: string (e.g., "Sirius A")
  commonNames: string[] (e.g., ["Alpha Canis Majoris", "Dog Star"])
  
  // Cataloging
  catalogIds: {
    hipparcos: integer,
    SAO: integer,
    HD: integer,
    SIMBAD: string,
    Gaia: string
  }
  
  // Position (ICRS J2000)
  rightAscension: degrees (0-360)
  declination: degrees (-90 to +90)
  parallax: milliarcseconds
  distance: {
    value: number,
    unit: "parsec" | "light-year",
    uncertainty: number
  }
  properMotion: {
    raComponent: milliarcseconds/year,
    decComponent: milliarcseconds/year,
    totalMotion: milliarcseconds/year,
    position_angle: degrees
  }
  radialVelocity: km/s
  
  // Physical Properties
  spectralType: string (e.g., "A1V")
  luminosityClass: "0"|"Ia"|"Ib"|"II"|"III"|"IV"|"V"|"VI"|"VII"
  effectiveTemperature: {
    value: Kelvin,
    uncertainty: Kelvin
  }
  luminosity: {
    value: number (solar luminosities),
    uncertainty: number
  }
  mass: {
    value: number (solar masses),
    uncertainty: number
  }
  radius: {
    value: number (solar radii),
    uncertainty: number
  }
  
  // Evolutionary State
  age: {
    value: number (billion years),
    uncertainty: number
  }
  mainSequenceStatus: "main-sequence" | "giant" | "white-dwarf" | "neutron-star"
  
  // Observational
  apparentMagnitude: number
  absoluteMagnitude: number
  constellation: string
  vMagnitude: number (V-band magnitude)
  colorIndex: {
    B_V: number,
    V_I: number
  }
  
  // Relationships
  binaryCompanion: boolean
  companionStarId: string (if binary)
  knownPlanets: Array<{planetId: string, name: string}>
  nearbyStars: Array<{starId: string, distance: number}>
  parentCluster: string (if member of cluster)
  
  // Historical & Educational
  discoveryDate: year
  discoverer: string
  notableFacts: string[]
  historicalObservations: Array<{date: year, observer: string, observation: string}>
  mythologyConstellation: string
  
  // Rendering
  textureAsset: string (URL or asset ID)
  colorHex: string (approximate stellar color)
  sizeMultiplier: number (for visual prominence)
}
```

### 4.2 Planet Object

```
PLANET {
  // Identity
  name: string (e.g., "TRAPPIST-1b")
  planetDesignation: string
  commonName: string (if applicable)
  
  // System
  parentStar: {
    starId: string,
    starName: string
  }
  orbitalIndex: integer (1st, 2nd, 3rd planet from star)
  
  // Orbital Elements
  orbitalPeriod: {
    value: number (Earth days),
    uncertainty: number
  }
  semiMajorAxis: {
    value: number (AU),
    uncertainty: number
  }
  eccentricity: {
    value: number,
    uncertainty: number
  }
  inclination: {
    value: degrees,
    uncertainty: degrees
  }
  argumentOfPeriapsis: degrees
  longitudeAscendingNode: degrees
  
  // Physical Properties
  radius: {
    value: number (Earth radii),
    uncertainty: number
  }
  mass: {
    value: number (Earth masses),
    uncertainty: number
  }
  density: {
    value: g/cm³,
    uncertainty: g/cm³
  }
  surfaceGravity: m/s²
  escapeVelocity: km/s
  
  // Atmosphere & Climate
  atmosphereComposition: Array<{gas: string, percentage: number}>
  atmosphericPressure: bar (if applicable)
  averageSurfaceTemperature: {
    value: Kelvin,
    min: Kelvin,
    max: Kelvin
  }
  equilibriumTemperature: Kelvin
  
  // Habitability Metrics
  habitabilityIndex: 0-1 (custom scoring)
  inHabitableZone: boolean
  fluxRelativeToEarth: number
  equilibriumTemperatureEarth: Kelvin
  
  // Moons & Rings
  moonCount: integer
  moons: Array<{name: string, radius: km, orbitalPeriod: days}>
  hasRings: boolean
  ringSystem: Array<{name: string, innerRadius: km, outerRadius: km}>
  
  // Discovery
  discoveryDate: year
  discoveryMethod: "transit" | "radial-velocity" | "imaging" | "timing" | "other"
  discoverer: string | Array<string>
  
  // Appearance
  textureAsset: string (URL or asset ID)
  colorHex: string
  typeClassification: "terrestrial" | "super-earth" | "neptune-like" | "jovian"
  albedo: 0-1
  
  // Observational Data
  transverseVelocity: km/s
  stellarFlux: W/m² (incident stellar energy)
  equilibriumTemperatureBlackBody: Kelvin
}
```

### 4.3 Galaxy Object

```
GALAXY {
  // Identity
  name: string (e.g., "Andromeda")
  alternateNames: string[] (e.g., ["M31", "NGC 224"])
  catalogId: string
  
  // Position (ICRS J2000)
  rightAscension: degrees
  declination: degrees
  galacticLongitude: degrees
  galacticLatitude: degrees
  
  // Distance & Redshift
  distance: {
    value: number,
    unit: "megaparsec" | "million light-years",
    uncertainty: number,
    method: string (e.g., "Cepheid variables", "redshift")
  }
  redshift: {
    value: number,
    uncertainty: number
  }
  recessionalVelocity: km/s
  
  // Morphology
  morphologicalType: "E0" | "E7" | "S0" | "Sa" | "Sb" | "Sc" | "SBa" | "SBb" | "SBc" | "Irr"
  morphologyDescription: string (e.g., "barred spiral")
  activeNucleus: boolean
  AGNType: "Seyfert-1" | "Seyfert-2" | "LINER" | "none"
  
  // Physical Dimensions
  majorAxis: {
    value: kiloparsec,
    uncertainty: kiloparsec
  }
  minorAxis: {
    value: kiloparsec,
    uncertainty: kiloparsec
  }
  inclination: degrees
  physicalSize: {
    value: kiloparsec,
    uncertainly: kiloparsec
  }
  
  // Mass & Dynamics
  totalMass: {
    value: number (solar masses × 10^10),
    uncertainty: number
  }
  stellarMass: {
    value: number (solar masses × 10^10),
    uncertainty: number
  }
  darkMatterHalo: boolean
  rotationVelocity: km/s (if measurable)
  
  // Stellar Population
  starFormationRate: {
    value: solar_masses_per_year,
    uncertainty: number
  }
  averageMetallicity: "[Fe/H]" value
  dominantStellarPopulation: "young" | "intermediate" | "old"
  
  // Notable Features
  features: Array<{
    name: string,
    type: "dust-lane" | "bar" | "ring" | "tidal-stream" | "active-nucleus",
    description: string
  }>
  supernovaHistory: Array<{year: number, type: string, magnitude: number}>
  
  // Relationships
  localGroupMember: boolean
  parentCluster: string (if in cluster)
  companionGalaxies: Array<{galaxyId: string, galaxyName: string, distance: megaparsec}>
  tidalInteractions: Array<{galaxy: string, type: string}>
  
  // Black Hole
  centralBlackHole: boolean
  blackHoleMass: {
    value: number (solar masses × 10^6),
    uncertainty: number
  }
  
  // Discovery & Observation
  discoveryDate: year
  discoverer: string
  notableObservations: Array<{date: year, observatory: string, observation: string}>
  
  // Appearance
  textureAsset: string (URL or asset ID)
  bulgeProminence: 0-1 (visual prominence of bulge)
  dustLaneIntensity: 0-1
}
```

### 4.4 Nebula Object

```
NEBULA {
  // Identity
  name: string (e.g., "Orion Nebula")
  alternateNames: string[] (e.g., ["M42", "NGC 1976"])
  catalogId: string
  
  // Position
  rightAscension: degrees
  declination: degrees
  galacticLongitude: degrees
  galacticLatitude: degrees
  
  // Classification
  nebulaType: "emission" | "reflection" | "dark" | "planetary" | "supernova-remnant" | "protoplanetary"
  emissionLines: Array<{element: string, wavelength: nanometer, intensity: relative}>
  
  // Dimensions
  angularSize: {
    arcminutes: number
  }
  physicalSize: {
    value: kiloparsec,
    uncertainty: kiloparsec
  }
  
  // Distance
  distance: {
    value: number,
    unit: "parsec" | "light-year",
    uncertainty: number
  }
  distanceMethod: string (e.g., "parallax", "spectral fitting")
  
  // Physical State
  temperature: {
    value: Kelvin,
    uncertainty: Kelvin
  }
  density: number (particles per cm³)
  mass: {
    value: number (solar masses),
    uncertainty: number
  }
  ionizationState: string (e.g., "mostly ionized", "neutral")
  
  // Associated Objects
  ionizingStars: Array<{starId: string, starName: string, role: string}>
  embeddedStars: Array<{starId: string, temperature: Kelvin}>
  stellarCluster: {clusterId: string, clusterName: string}
  parentMolecularCloud: string
  
  // Notable Features
  features: Array<{name: string, description: string}>
  protozones: Array<{name: string, stellarMass: solar_masses}>
  darkDust: boolean
  dustOpacity: 0-1
  
  // Discovery & History
  discoveryDate: year
  discoverer: string
  historicalImaging: Array<{year: number, telescope: string, wavelength: string}>
  
  // Appearance
  textureAsset: string (URL or asset ID)
  dominantColor: string (emission line color)
  colorHex: Array<string> (for composite appearance)
}
```

### 4.5 Cluster Object

```
CLUSTER {
  // Identity
  name: string (e.g., "M13")
  alternateNames: string[]
  catalogId: string
  
  // Classification
  clusterType: "globular" | "open" | "association" | "OB-association"
  ageEstimate: {
    value: billion_years,
    uncertainty: billion_years
  }
  
  // Position
  rightAscension: degrees
  declination: degrees
  galacticLongitude: degrees
  galacticLatitude: degrees
  
  // Distance
  distance: {
    value: number (kiloparsec),
    uncertainty: number
  }
  distanceModulus: number
  
  // Physical Extent
  coreRadius: {
    value: parsec,
    uncertainty: parsec
  }
  tidalRadius: {
    value: parsec,
    uncertainty: parsec
  }
  halfLightRadius: parsec
  
  // Population
  memberStarCount: {
    estimate: integer,
    uncertainty: integer
  }
  concentrationParameter: number (tidal concentration)
  
  // Dynamics
  properMotion: {
    raComponent: mas/yr,
    decComponent: mas/yr
  }
  velocityDispersion: km/s
  orbitalParameters: {
    semiMajorAxis: kiloparsec,
    eccentricity: number,
    period: billion_years
  }
  
  // Chemical Composition
  metallicity: "[Fe/H]" value
  alphaElementEnhancement: number
  
  // Observational
  visualMagnitude: number
  absoluteMagnitude: number
  surfaceBrightness: mag/arcsec²
  color: string
  
  // Discovery
  discoveryDate: year
  discoverer: string
  discoveryObservatory: string
  
  // Notable Features
  features: Array<{name: string, type: string, description: string}>
  kinematics: string (description of motion relative to galaxy)
  
  // Appearance
  textureAsset: string (URL or asset ID)
  starDensityMultiplier: number (for visual prominence)
}
```

---

## 5. Taxonomy & Classification

### 5.1 Object Type Hierarchy (Doc 22 v4.2 — 8 Categories, 96 Entity Types)

```
CELESTIAL_OBJECT (Root)
├── STARS (ENT-1000) — 31 types
│   ├── Main Sequence (by spectral type: O, B, A, F, G, K, M)
│   ├── Giant
│   ├── Supergiant
│   ├── White Dwarf
│   ├── Neutron Star
│   └── Black Hole
├── PLANETS (ENT-2000) — 27 types
│   ├── Terrestrial
│   ├── Super-Earth
│   ├── Neptune-like
│   └── Jovian
├── MOONS & SATELLITES (ENT-3000) — 15 types
├── SMALL BODIES (ENT-4000) — 20 types
│   ├── Asteroid
│   ├── Comet
│   ├── Dwarf Planet
│   ├── Kuiper Belt Object
│   ├── Centaur
│   └── Trojan
├── GALAXIES (ENT-6000) — 19 types
│   ├── Elliptical (E0-E7)
│   ├── Lenticular (S0)
│   ├── Spiral (Sa, Sb, Sc)
│   ├── Barred Spiral (SBa, SBb, SBc)
│   └── Irregular
├── NEBULAE & ISM (ENT-5000) — 14 types
│   ├── Emission
│   ├── Reflection
│   ├── Dark
│   ├── Planetary
│   ├── Supernova Remnant
│   ├── Protoplanetary
│   └── ISM Structures
├── LARGE-SCALE STRUCTURE (ENT-7000) — 12 types
│   ├── Globular Cluster
│   ├── Open Cluster
│   ├── OB Association
│   ├── Moving Group
│   ├── Galaxy Cluster
│   ├── Supercluster
│   ├── Cosmic Filament
│   ├── Void
│   └── Cosmic Microwave Background
└── EXOTIC OBJECTS (ENT-8000) — 16 types
    ├── Quasar / AGN
    ├── Gravitational Lens
    ├── Relativistic Jet
    ├── Accretion Disk
    ├── Transient Source
    └── Other High-Energy Phenomena
```

### 5.2 Spatial Classification

- **By Distance:** Solar Neighborhood, Galactic Disk, Galactic Halo, Local Group, Virgo Cluster, Local Supercluster, Observable Universe
- **By Galactic Coordinates:** North/South Galactic Pole, Galactic Plane, Sagittarius Direction
- **By Constellation:** All 88 modern constellations (Andromeda through Vulpecula) — navigation/cultural overlay, not entity category

### 5.3 Catalog-Based Classification

- **Star Catalogs:** Hipparcos, SAO, HD, Yale Bright Star, SIMBAD, Gaia
- **Galaxy Catalogs:** Messier (M1-M110), New General Catalog (NGC), Index Catalog (IC)
- **Exoplanet Catalog:** NASA Exoplanet Archive ID
- **Variable Star Catalogs:** AAVSO

### 5.4 Scale-Based Visibility

- **Level 0 (Solar System):** Planets (ENT-2000), moons (ENT-3000), small bodies (ENT-4000), Sun
- **Level 1 (Stellar Neighborhood):** Stars (ENT-1000) within 1000 LY, nearby stellar associations
- **Level 2 (Galactic):** Star clusters & large-scale structure (ENT-7000), nebulae & ISM (ENT-5000), Milky Way structure, molecular clouds
- **Level 3 (Cluster):** Galaxies (ENT-6000) in Local Group and nearby clusters
- **Level 4 (Cosmic Web):** Galaxy superclusters, filaments, voids (ENT-7000), cosmic microwave background surface, exotic objects (ENT-8000)

---

## 6. Search & Findability

### 6.1 Search Algorithm Priorities

1. **Exact Match** — Name matches exactly (case-insensitive) with boost for common names
2. **Prefix Match** — Query matches start of name (e.g., "Alp" → "Alpha Centauri")
3. **Substring Match** — Query appears anywhere in name
4. **Catalog ID Match** — Match against HD, Hipparcos, NGC, M-number, etc.
5. **Fuzzy Match** — Typo-tolerant matching (Levenshtein distance < 2)
6. **Related Objects** — Objects in same constellation/cluster as query result

**Ranking Factors:**
- User view history (recently viewed objects ranked higher)
- Object brightness/size (more prominent objects boosted)
- Catalog popularity (Messier objects ranked above obscure NGC)
- Distance uncertainty (well-characterized objects prioritized)

### 6.2 Autocomplete Logic

- Trigger: After 2 characters typed
- Candidates: First 20 results from Algorithm Priorities above
- Grouping: Group by entity category (Stars, Planets, Moons & Satellites, Small Bodies, Nebulae & ISM, Galaxies, Large-Scale Structure, Exotic Objects)
- Format: `[Name] ([Type], [Distance])` e.g., "Sirius (Star, 2.6 pc)"
- Keyboard Navigation: Arrow keys, Enter to select

### 6.3 Filter System

**By Entity Category (Doc 22 v4.2):** Stars, Planets, Moons & Satellites, Small Bodies, Nebulae & ISM, Galaxies, Large-Scale Structure, Exotic Objects
**By Distance Range:** Slider from 0 LY to 13.8 billion LY, presets (Solar System, Milky Way, Local Group, Observable Universe)
**By Constellation:** Dropdown with all 88 constellations (navigation overlay only)
**By Catalog:** Hipparcos, Messier, NGC, HD, etc.
**By Physical Property:**
  - Star: Spectral type (O-M), Magnitude range
  - Planet: Habitability index, Earth radii range
  - Galaxy: Morphological type, Redshift range

### 6.4 "Nearby Objects" Feature

**Trigger:** User selects any object
**Radius:** Configurable (default 100 LY for stars, 1 Mpc for galaxies)
**Display:** Card list sorted by distance with:
  - Object name & type
  - Distance from selected object
  - Quick-link to center view on object
**Update:** Recalculates when scale level changes or user changes radius setting

### 6.5 Advanced Search Operators

- `type:star` — Filter by object type
- `distance:10..100pc` — Distance range
- `constellation:orion` — By constellation
- `catalog:M1..M110` — By catalog range
- `magnitude:..-2` — By apparent magnitude
- `habitability:>0.8` — By custom scores

---

## 7. UI Component Hierarchy

### 7.1 Always-Visible Components

- **3D Viewport** (95% of screen)
- **Navigation Mode Indicator** (top-left, minimal)
- **Scale Level Indicator** (top-right, minimal)
- **FPS/Performance Counter** (top-right, small, toggleable)
- **Central Crosshair/Reticle** (center screen, subtle)
- **Escape Key Hint** (bottom-right, tiny, fades after 5 sec on first load)

### 7.2 Always-Accessible (Toggle-able)

- **Search Bar** (ctrl/cmd+K shortcut, top-center)
- **Settings Button** (gear icon, top-right)
- **Help Button** (? icon, top-right)
- **Bookmarks Sidebar** (left edge, collapsible)

### 7.3 Contextual Components (Appear on Demand)

**On Object Click:**
- **Info Panel** (right side, 30% width, slides in)
  - Object header (name, type, distance)
  - Tabs: Overview, Specifications, Discovery, Related Objects
  - Bookmark button, Share button, Close button

**On Search:**
- **Search Results Dropdown** (below search bar, scrollable, 8 results visible)
- **Filter Sidebar** (left side, appears with search active)

**On Guided Tour Start:**
- **Tour Controls** (bottom-center, play/pause/next/exit buttons)
- **Narration Subtitle Text** (bottom-center, below controls)

**On Settings Open:**
- **Modal Settings Panel** (center screen, 500px wide)
  - Tabbed interface (Graphics, Data, Units, Language, Accessibility)
  - Sliders for continuous values
  - Toggle switches for boolean values
  - Dropdown selectors for categorized options

**On Help Requested:**
- **Help Overlay** (full-screen modal or side panel)
  - Collapsible sections: Getting Started, Navigation, Search, Scales, Glossary, Shortcuts

### 7.4 Temporary/Transient Components

- **Toast Notifications** (bottom-left, auto-fade after 4 sec)
  - Examples: "Bookmarked!", "Copied to clipboard", "Data loading..."
- **Tooltip on Hover** (follow cursor, 200ms delay)
- **Context Menu on Right-Click** (object-specific options)

---

## 8. Scale Transition Logic

### 8.1 Visibility Rules by Scale Level

| Object Type | Level 0 (SS) | Level 1 (Star) | Level 2 (Gal) | Level 3 (Cluster) | Level 4 (Web) |
|---|---|---|---|---|---|
| **Planets** | Full detail | Fades | Hidden | Hidden | Hidden |
| **Stars** | Sun only | Full detail | Points of light | Clusters visible | Filaments only |
| **Nebulae** | Hidden | Full detail | Full detail | Fades | Hidden |
| **Clusters** | Hidden | Visible | Full detail | Full detail | Hidden |
| **Galaxies** | Hidden | Hidden | Full detail | Full detail | Full detail |
| **CMB Surface** | Hidden | Hidden | Hidden | Hidden | Visible background |

### 8.2 Transition Triggers

**Zoom Out (camera distance increases):**
- 50 AU → 200 AU: Level 0 (Solar System stays visible)
- 500 AU → 1000 LY: Transition to Level 1; planets fade, stars become prominent
- 1000 LY → 100 kLY: Transition to Level 2; stars fade to points, galaxy structure appears
- 100 kLY → 10 MLY: Transition to Level 3; individual stars hidden, galaxy details fade
- 10 MLY → 13.8 BLY: Transition to Level 4; CMB background, cosmic web visible

**Zoom In (camera distance decreases):**
- Reverse of above with hysteresis (0.7x threshold to prevent flickering)

### 8.3 Data Density Rules

- **Level 0:** All catalog data loaded (Hipparcos, HD catalogs)
- **Level 1:** Primary star catalog (Hipparcos) + nearby subset of exoplanet data
- **Level 2:** Messier + brightest NGC objects; star clusters; bright nebulae
- **Level 3:** Local Group galaxies + major nearby clusters
- **Level 4:** Galaxy superclusters (Abell catalog), cosmic filaments, voids

### 8.4 Rendering Optimizations

- **Level 0-1:** Full procedural rendering of stellar surfaces
- **Level 2-3:** Billboard/sprite rendering for distant objects
- **Level 4:** Texture-mapped galactic filaments; point clouds for high-density regions
- **LOD System:** Automatically swap high-poly to low-poly models at distance thresholds

---

## 8. Entity Categories & Classification (Doc 22 v4.2)

The following 8 entity categories organize 96 distinct celestial object types:

1. **Stars (ENT-1000, 31 types)** — Main sequence stars (O-M spectral types), giants, supergiants, white dwarfs, neutron stars, black holes, and stellar remnants
2. **Planets (ENT-2000, 27 types)** — Terrestrial planets, super-Earths, neptune-likes, jovian planets, and various exoplanet types
3. **Moons & Satellites (ENT-3000, 15 types)** — Natural satellites, major moons, irregular moons, and ring systems
4. **Small Bodies (ENT-4000, 20 types)** — Asteroids, comets, dwarf planets, Kuiper Belt objects, centaurs, trojans, and similar bodies
5. **Nebulae & ISM (ENT-5000, 14 types)** — Emission, reflection, dark nebulae, planetary nebulae, supernova remnants, protoplanetary disks, and interstellar medium structures
6. **Galaxies (ENT-6000, 19 types)** — Elliptical, lenticular, spiral, barred spiral, irregular galaxies, and morphological variants
7. **Large-Scale Structure (ENT-7000, 12 types)** — Star clusters (globular, open, associations), galaxy clusters, superclusters, cosmic filaments, voids, and CMB surface
8. **Exotic Objects (ENT-8000, 16 types)** — Quasars, AGN, gravitational lenses, relativistic jets, accretion disks, transient sources, and high-energy phenomena

---

## 9. Wireframe Descriptions

### 9.1 Landing/Splash Screen State

```
┌─────────────────────────────────────────────────────────────┐
│  [Cosmos Explorer Logo] [centered, large, animated]         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              [EXPLORE THE UNIVERSE]                         │
│              [Launch Experience] [button]                   │
│                                                             │
│  [Get Started]  [Tutorial]  [Settings]  [Help]             │
│                                                             │
│  [Featured Object Carousel: Auto-rotating 3 objects]       │
│  "Sirius - brightest star in night sky"                    │
│  ← [swipe/arrows] →                                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Exploration View (Viewport + Minimal UI)

```
┌─────────────────────────────────────────────────────────────┐
│ [Search] (ctrl+k)   [FPS: 60]  [⚙️Settings] [?Help]        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    [3D VIEWPORT]                            │
│               (Stars, planets, galaxies)                    │
│                                                             │
│                  [+ Crosshair center]                       │
│                                                             │
│  [Bookmarks ▶] │                                │           │
│                │        [Scale Level indicator]│           │
│                │         "Stellar Neighborhood"│           │
│                │          1,523 LY zoom level │           │
│                │                              │           │
│                                                             │
│              [Free-Fly] [Orbit] [Teleport]                 │
│              [◀ Guided Tour ▶]                             │
│                    [▶ Play]  [■ Stop]                      │
│                                                             │
│  [Escape] [Keyboard: ?, WASD: move, Mouse: look]          │
└─────────────────────────────────────────────────────────────┘
```

### 9.3 Object Info Panel (Right Side)

```
┌──────────────────────────────┐
│ Sirius A        [★ bookmark] │ [×close]
│ Star, 2.64 pc   [↗ share]    │
├──────────────────────────────┤
│ [Preview sphere/texture]     │
│                              │
├──────────────────────────────┤
│ [Overview] [Specs] [History] │
│                              │
│ Apparent Magnitude: -1.46    │
│ Spectral Type:      A1V      │
│ Temperature:        9,940 K  │
│ Luminosity:         26 L☉    │
│ Mass:               2.02 M☉  │
│ Distance:           2.64 pc  │
│ Parallax:           123.4 mas│
│                              │
│ [Related Objects ▼]          │
│  • Sirius B (0.50 pc)        │
│  • Procyon (3.48 pc)         │
│  • Alpha Centauri (1.28 pc)  │
│                              │
│ [Center View] [Orbit Mode]   │
└──────────────────────────────┘
```

### 9.4 Search Interface

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [Search cosmos...           ]  [×]                        │
│  ┌──────────────────────────────┐                          │
│  │ [★ recent] [Recent searches] │                          │
│  │                              │                          │
│  │ STARS                        │                          │
│  │ • Sirius (Star, 2.6 pc)      │                          │
│  │ • Vega (Star, 7.8 pc)        │                          │
│  │                              │                          │
│  │ GALAXIES                     │                          │
│  │ • Andromeda (Galaxy, 0.77M pc)                          │
│  │ • Triangulum (Galaxy, 3.2M pc)                          │
│  │                              │                          │
│  │ NEBULAE & ISM                │                          │
│  │ • Orion (Nebula, 426 pc)     │                          │
│  └──────────────────────────────┘                          │
│                                                             │
│  [Filters ▼]  Distance [━━●━━] 1-1000 LY                   │
│               Category: ☑Stars ☑Planets ☐Galaxies ☐Other  │
│               Constellation: [Dropdown: All]               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 9.5 Settings Modal

```
┌────────────────────────────────────────┐
│   COSMOS EXPLORER SETTINGS       [×]   │
├────────────────────────────────────────┤
│ [Graphics] [Data] [Units] [Language]   │
├────────────────────────────────────────┤
│                                        │
│ GRAPHICS                               │
│ ☑ Particles Enabled                    │
│ ☑ Light Effects                        │
│ Rendering Quality: [Low] [Med] [High]  │
│ Stars Density:     [━━━●━━] 75%       │
│                                        │
│ DATA DISPLAY                           │
│ Label Density: [━●━━━] Normal          │
│ ☑ Show Grid                            │
│ ☑ Show Orbital Paths                   │
│ ☑ Show Constellations                  │
│                                        │
│                           [OK] [Reset] │
└────────────────────────────────────────┘
```

### 9.6 Share Modal

```
┌────────────────────────────────────────┐
│   SHARE CURRENT VIEW                   │
├────────────────────────────────────────┤
│                                        │
│ Current Location:                      │
│ "Orion Constellation, 600 LY scale"    │
│                                        │
│ [Copy URL]  [✓ Copied!]                │
│                                        │
│ Share Via:                             │
│ [Twitter] [Facebook] [Email]           │
│                                        │
│ Export Options:                        │
│ ☑ Include Bookmarks                    │
│ ☑ Include Settings                     │
│ [Export as JSON] [Export as CSV]       │
│                                        │
│ Citation (for academic use):           │
│ "Cosmos Explorer v1.0 (2026-04-16)    │
│  Data: Gaia EDR3, NASA Exoplanet      │
│  Archive, SIMBAD, 2MASS Catalog"      │
│                                        │
│                                [Close] │
└────────────────────────────────────────┘
```

### 9.7 Guided Tour Interface

```
┌─────────────────────────────────────────────────────────────┐
│                    [3D VIEWPORT]                            │
│             (Camera following scripted path)                │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ "Welcome to Cosmos Explorer! In the next 15 minutes   │ │
│  │ we'll explore the Solar System, nearby stars, and     │ │
│  │ distant galaxies. Let's begin..."                     │ │
│  │                          - Narrator [narration 0:05s] │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│              [◀ Prev] [⏸ Pause] [Play ▶]                    │
│              "Solar System Overview (5 min)" [5:23 remaining]│
│              [━━━━●━━━━] progress bar                       │
│              [Exit Tour]                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Interaction Patterns & Behaviors

### 10.1 Object Selection

- **Click on star/planet/galaxy:** Highlights object, opens info panel (right side)
- **Double-click:** Centers object in viewport + auto-zoom to optimal viewing distance
- **Right-click:** Context menu (Center, Orbit, Bookmark, Share, Remove Label)
- **Hover:** Tooltip with name + key facts (50ms delay to avoid clutter)

### 10.2 Camera Controls (Free-Fly Mode)

- **WASD:** Forward/backward, strafe left/right
- **Space/Ctrl:** Up/down
- **Mouse drag:** Pitch/yaw rotation
- **Scroll wheel:** Speed adjustment (x0.1 to x10)
- **Shift + drag:** Roll rotation
- **R key:** Reset to forward view (no roll)

### 10.3 Bookmarking Workflow

- **Click bookmark icon** on info panel or in search results
- **Toast notification:** "Added to bookmarks: Sirius A"
- **Bookmark list** updates in left sidebar
- **Click bookmark in sidebar:** Instant teleport to that object
- **Right-click bookmark:** Edit name, delete, or navigate to nearest unvisited object

### 10.4 Scale Navigation Gestures

- **Scroll wheel:** Continuous zoom (smooth scroll)
- **Pinch (touch):** Zoom in/out (mobile)
- **+/- keyboard:** Jump to next/previous scale level
- **Numpad 0-4:** Direct jump to scale level 0-4

### 10.5 Time Control Interaction

- **Play button:** Simulation starts; calendar accelerates
- **Speed slider:** Scrub between 1x (real-time) and 10000x (1 day/frame)
- **Click date field:** Manual date picker (calendar widget)
- **Left/right arrows:** ±1 hour / ±1 day (depending on current speed)
- **Reset button:** Return to present time

---

## 11. Accessibility Considerations

### 11.1 Keyboard Navigation

- All UI elements accessible via Tab key
- Screen reader support (ARIA labels on all interactive elements)
- Keyboard shortcuts for power users (Alt+N for navigation mode, Ctrl+S for search)

### 11.2 Visual Accessibility

- High contrast mode (inverts colors, increases line thickness)
- Colorblind mode (deuteranopia, protanopia, tritanopia presets)
- Font size adjustment (60%, 80%, 100%, 120%, 150%)
- Text labels always accompanied by icons
- Minimum color contrast ratio 4.5:1 (WCAG AA)

### 11.3 Audio Accessibility

- Captions/subtitles for all narration in guided tours
- Adjustable narration speed
- Transcripts available for all tours

### 11.4 Motor Accessibility

- All interactions possible without mouse/trackpad
- Remappable controls
- Large tap targets (min 44x44 px on touch devices)
- No time-limited interactions (except optional auto-tour advance)

---

## 12. Data Attribution & Sources

### 12.1 Data Sources Referenced

- **Gaia EDR3:** Star positions, parallaxes, proper motions
- **Hipparcos Catalog:** Bright star data (magnitude < 12.5)
- **NASA Exoplanet Archive:** Exoplanet orbital & physical data
- **SIMBAD:** Object names, cross-references, spectral types
- **NED (NASA Extragalactic Database):** Galaxy data, redshifts
- **2MASS Catalog:** Infrared star & galaxy survey
- **SDSS (Sloan Digital Sky Survey):** Galaxy spectroscopy, morphology
- **Various observatory images:** Hubble, JWST, Chandra (for textures/rendering)

### 12.2 Attribution UI

- Accessed via Settings → Data Sources
- Lists all catalogs with versions, access dates, and license information
- Links to original data providers
- Citation template for academic use

---

## Conclusion

This Information Architecture provides a comprehensive framework for Cosmos Explorer's content organization, navigation, and interaction patterns. The multi-scale model supports seamless exploration from the Solar System to the cosmic web, while the flexible search and filtering system ensures users can discover celestial objects by multiple criteria. The component hierarchy balances visual clarity with feature accessibility, and the detailed content models ensure all celestial data is consistently structured across the platform.

**Next Steps:** Implement prototypes of key views (landing, exploration viewport, info panel), conduct user testing on scale transition logic, and validate data models against production catalogs.

---

**Document Control**  
Version: 2.0  
Last Updated: 2026-04-16  
Author: Information Architecture Team  
Status: Approved for Implementation  
Entity Taxonomy Reference: Doc 22 — Interactive Toggle Features v4.2 (96 entity types, 9 categories)
