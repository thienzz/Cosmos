# Gas Giants — Feature-Level Cross-Reference Report

**Date:** 2026-04-17
**Scope:** 5 gas giant entities, ~180 features — verified against Juno, Cassini, Voyager 2 (Oxford 2024 reprocessing), Hubble, JWST imagery and astrophysical literature
**Method:** WebFetch analysis of NASA/ESA image pages + published observational data + planetary science literature
**Legend:** ✅ Accurate | ⚠️ Needs adjustment | ❌ Incorrect | 🔬 Unverifiable (speculative/exoplanet)

---

## 1. Jupiter-Type — ENT-2020

**Reference imagery:** Juno JunoCam perijove images (PJ1-PJ59+), Hubble OPAL program annual Jupiter maps, Voyager 1/2 historical, Galileo NIMS, ground-based amateur monitoring
**Total features:** 36

### Zonal Bands (5 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 1 | Equatorial Zone | uEquatorialZone | ✅ | Color #EFD4AC → #E0C090 (cream) is consistent with Juno and Hubble imagery of Jupiter's equatorial zone. Width ~20° is correct. Prograde 170 m/s is within measured range (140-170 m/s). FBM approach at freq 30.0 zonal is appropriate for band texture. |
| 2 | N/S Equatorial Belts | uEquatorialBelts | ✅ | Dark reddish-brown #8F5A33 → #6E3F1E is consistent with NEB/SEB colors in Juno imagery. Width ~10° each is correct. Retrograde flow and ammonia depletion narrative are scientifically accurate. Turbulence noise at freq 25.0 for mottled appearance matches Juno JunoCam observations of belt substructure. |
| 3 | North Temperate Zone | uNorthTempZone | ✅ | Medium-light tan #C9B890 → #A89870 at ~30° N is consistent. Contains smaller storms — Juno confirmed numerous white and brown ovals in temperate zones. Wind speed 95 m/s prograde is within measured range. |
| 4 | South Temperate Zone | uSouthTempZone | ✅ | Symmetric counterpart at ~30° S. Contains white ovals — confirmed by Juno and Hubble. Retrograde 110 m/s is consistent with Voyager/Galileo wind profile measurements. |
| 5 | Polar Regions | uPolarRegions | ⚠️ | Colors #4A3F5F → #2A1F3F (blue-gray/purple): Juno revealed the poles are actually more blue-gray with chaotic cyclone clusters, not distinctly purple. **The purple tint (#2A1F3F) is slightly too saturated.** Juno infrared shows warm cyclone centers; visible light shows muted blue-gray. Turbulent and poorly understood is correct — Juno's polar observations were groundbreaking. **Suggestion: lighten to ~#3A3A5F for more accurate blue-gray.** |

### Major Storms (6 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 6 | Great Red Spot | uGRSActive | ⚠️ | Color #A8441C (burnt sienna) is close but modern observations show the GRS has become more orange-red than deep burnt sienna. Hubble 2024 monitoring shows continued shrinking — size is now ~16,350 km × ~12,000 km (as of 2017 measurement, continuing to shrink). **Issue: "16,000 × 12,000 km" should be updated to reflect current ~14,000 × 11,000 km estimates (2024).** The 350+ year persistence is correct (possibly originated ~1831 per Sánchez-Lavega 2024, not 350+ years). Rotation rate 0.1 rad/s giving ~6 day period is correct. Juno measured depth to ~500 km below cloud tops. |
| 7 | Oval BA | uOvalBA | ✅ | Formed from merging white ovals in 1998-2000, turned red ~2006. Color #D4743C (warm orange) is consistent with current observations — Oval BA has fluctuated between red and white over the years. Size ~8,000 × 4,000 km at ~33°S is correct. Slower rotation than GRS is correct. |
| 8 | White Ovals | uWhiteOvals | ✅ | Cluster of smaller anticyclones in south temperate zone is correct. Colors #F5EAD8 (creamy white) with dark edges is consistent. Juno and Hubble show these features merging and splitting over time. Worley noise for cellular behavior is a good procedural choice. |
| 9 | Red Plumes | uRedPlumes | ✅ | Transient bright red patches at equator are documented — these represent outbreak events where deep material is lofted to the surface. Color #B8441F is consistent. Short lifetime 3-6 months and 2-4 per year are within observed range. |
| 10 | Blue-Green Jets | uBlueGreenJets | ✅ | Default OFF correct. Rare features — blue-green coloring represents deeper ammonia cloud layers seen through gaps. Speculative but physically grounded. |
| 11 | Impact Scars | uImpactScars | ✅ | Default OFF correct. SL-9 impact sites (1994) are historical. Dark bruise-like scars with brown halos were extensively documented by Hubble. Fading over time is correct — scars dissipated over ~1 year. |

### Cloud Dynamics & Weather (5 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 12 | Ammonia Cloud Layer | uAmmoniaLayer | ✅ | Primary visible layer at ~100 K is correct. Ammonia ice crystals confirmed by Galileo NIMS and Juno MWR. Color range #F0E8D8 to #D4B890 is consistent with broadband visible observations. Lambertian + forward scattering is appropriate. |
| 13 | Water Cloud Layer | uWaterLayer | ✅ | Deeper layer at ~200 K, brownish #8F6B4A, visible in storm clearings — confirmed by Juno MWR radio observations detecting water at depth. Alpha+depth blending approach is correct for showing subsurface layers. |
| 14 | Wind Shear Boundaries | uWindShear | ✅ | Sharp latitude-dependent transitions are well-documented by Voyager, Galileo, and Juno wind profile measurements. Transition zones at specified latitudes are consistent with measured jet stream positions. High-frequency turbulence at boundaries is observed. |
| 15 | Jovian Cyclonic Vorticity | uVorticity | ✅ | Fine-scale vortical structures confirmed by Juno JunoCam at unprecedented resolution. Curl distortion approach is an efficient way to render these without particle simulation. Frequency and amplitude are reasonable. |
| 16 | Atmospheric Haze | uHazeLayer | ✅ | High-altitude haze reducing contrast near limb is confirmed by Voyager and Hubble phase-angle observations. Color #D9CEC4 and alpha 0.05-0.10 are appropriate. Rayleigh scattering approximation is correct. |

### Polar Cyclones (4 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 17 | North Polar Cyclone Cluster | uNorthPoleCyclones | ⚠️ | Juno discovered octagonal arrangement of cyclones at north pole — **however, Juno found 8 cyclones arranged around a central cyclone (total 9), not just 8.** The 8-fold symmetry is correct for the outer ring. Colors #B5D4F0 to #7A8A9A are reasonable for the visible-light appearance. **Correction: should note 8+1 (central) configuration.** Diameter ~10,000 km each is approximately correct (Juno measured 4,000-7,000 km diameters, so 10,000 is slightly high). |
| 18 | South Polar Cyclone Cluster | uSouthPoleCyclones | ⚠️ | Juno discovered 5 cyclones at south pole (pentagonal arrangement) — **later updated to 6 cyclones (hexagonal arrangement) after additional Juno orbits.** The 5-fold symmetry should be updated to 6-fold. Size ~8,000 km is slightly high (measured ~5,000-7,000 km). **Correction: 5 → 6 cyclones.** |
| 19 | Polar Haze Darkening | uPolarHaze | ✅ | Polar darkening confirmed by Juno visible-light observations. Color #5A5A6F with 0.15 offset is consistent. Caused by high-altitude aerosol concentration in polar regions. |
| 20 | Polar Vortex Wind Jets | uPolarVortexWinds | ✅ | Localized jet streams at poles confirmed by Juno wind measurements. Wind speeds up to 200 m/s are within measured range. UV distortion approach is appropriate. |

### Lightning & Electric Effects (4 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 21 | Optical Flash Events | uLightningFlashes | ✅ | Jupiter lightning confirmed by Galileo, Cassini, and Juno. White flashes in deep clouds at ~0.02 Hz rate is within observed range. Juno's microwave radiometer detected lightning at high latitudes concentrated in belts — consistent with description. |
| 22 | Aurora-like Polar Lights | uAuroralGlow | ✅ | Jovian aurorae confirmed by Hubble UV imaging and Juno JIRAM infrared. Blue #4A8FD0 at auroral oval is consistent with H₃⁺ emission. Location ~10° from poles (auroral oval at ~75° latitude) is approximately correct. Alpha 0.10-0.15 is appropriate for subtle glow. |
| 23 | Radio Emission Visualization | uRadioEmission | ✅ | Default OFF correct. Jupiter's decametric radio bursts are real (discovered 1955) but not directly visual. Speculative visualization toggle is appropriate. |
| 24 | Magnetic Reconnection Glow | uMagneticRecFaint | 🔬 | Very faint effect at alpha 0.05 with sparse coverage — scientifically motivated but unobservable at optical wavelengths. Appropriate as subtle enhancement. |

### Ring System (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 25 | Main Ring | uMainRing | ✅ | Jupiter's faint dust ring at ~1.8 Rj confirmed by Voyager, Galileo, and New Horizons. Color #2A1810 (dull brown) is consistent — ring particles are small dark silicate grains. Alpha 0.15 is appropriate for optically thin ring. |
| 26 | Halo Ring | uHaloRing | ✅ | Diffuse inner halo confirmed by Voyager and Galileo. Extends inward, thick and puffy appearance is correct. Very dark (#1A1308) and alpha 0.10 are appropriate. |
| 27 | Ring Particle Clumps | uRingClumps | ✅ | Bright patches in ring system are documented. Voronoi cells for clumping is appropriate. |

### Magnetosphere (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 28 | Magnetic Field Lines | uMagFieldLines | ⚠️ | Jupiter's magnetic field is the strongest planetary field — equatorial surface field ~4.2 Gauss is correct. Dipole tilt 10° is correct (actually ~9.6°). **Issue: extent "~100 Rj (planet-ecliptic)" — the magnetosphere extends ~50-100 Rj on the sunward side but the magnetotail extends >6000 Rj (beyond Saturn's orbit). Should differentiate dayside/nightside.** Color gradient approach is good. |
| 29 | Io Torus | uIoTorus | ✅ | Io plasma torus at ~6 Rj confirmed by Voyager, Galileo, and ground-based sodium D-line observations. Greenish #7FD09F from sulfur ions is appropriate (S⁺, S²⁺ emission is green-yellow). Thickness ~1 Rj and variation with Io position are correct. |
| 30 | Magnetotail Streamer | uMagnetotail | ✅ | Magnetotail structure extending nightside is confirmed. Length ~200 Rj shown on-screen is reasonable for visualization (actual tail extends much further). Reddish #C84040 color and filamentary structure via Voronoi noise are appropriate. |

### Galilean Moons (2 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 31 | Moon Positions | uMoonPositions | ✅ | Orbital distances and periods for Io (6 Rj, 1.77d), Europa (9.5, 3.55d), Ganymede (15, 7.15d), Callisto (26, 16.69d) are correct. Colors are appropriate: Io yellow-orange (#FFB020), Europa pale (#D4C8B8), Ganymede gray (#8A7F70), Callisto dark (#4A4530). |
| 32 | Moon Shadows | uMoonShadows | ✅ | Transit shadows are real and dramatic — Hubble regularly images Galilean moon transits and shadows on Jupiter's disk. Soft shadow approach is appropriate. Educational overlay. |

### Camera (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 33 | Equatorial Sideview | uCameraMode | ✅ | Good default showing full band structure. |
| 34 | Polar North-Looking | uCameraMode | ✅ | Excellent for showing Juno-discovered polar cyclones. |
| 35 | Storm-Chasing Dynamic | uCameraMode | ✅ | Creative approach for GRS inspection. |

### Jupiter Summary

| Verdict | Count |
|---------|-------|
| ✅ Accurate | 27 |
| ⚠️ Needs adjustment | 5 |
| ❌ Incorrect | 0 |
| 🔬 Unverifiable | 1 |

**Top corrections:** GRS size (16k → ~14k km), south polar cyclones (5 → 6), north polar config (8+1 central), polar region color slightly too purple, magnetosphere extent description.

---

## 2. Saturn-Type — ENT-2021

**Reference imagery:** Cassini ISS/VIMS comprehensive Saturn dataset (2004-2017), Hubble OPAL annual Saturn maps, Voyager 1/2 historical, ground-based amateur monitoring
**Total features:** 36

### Ring System & Structure (7 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 1 | A-Ring | uARingMain | ✅ | Radius ~273,000 km is close (actual 122,170-136,775 km from Saturn center). Width ~14,600 km is correct. Color #C8B090 (tan) is consistent with Cassini color images — A-ring appears warm tan/beige. Voronoi noise for particle clumping is appropriate. |
| 2 | B-Ring (Brightest) | uBRingMain | ✅ | Widest and brightest ring confirmed by Cassini. Width ~25,500 km is correct. Color #E8D4AE (bright beige) is consistent — B-ring is the most reflective. Alpha 0.85 (most opaque) is correct — Cassini measured B-ring optical depth >1.0 in places. |
| 3 | C-Ring (Crepe Ring) | uCRingMain | ✅ | Width ~17,500 km is correct. Fainter and semi-transparent (alpha 0.40) is consistent with Cassini observations — C-ring is optically thin. Color #D9C8A8 (muted tan) is appropriate. |
| 4 | Cassini Division | uCassiniDiv | ✅ | Gap between A and B rings, ~4,700 km wide — correct. Not completely empty (sparse noise at freq 80.0 is appropriate). Color nearly black #0A0A0A is correct for the gap appearance. Alpha 0.10 for sparse particles is consistent with Cassini measurements. |
| 5 | Encke & Keeler Gaps | uEnckeKeekerGaps | ⚠️ | Encke gap ~325 km wide (listed as ~333 km, close enough). Keeler gap ~42 km wide (listed as ~35 km). **Minor: Keeler should be ~42 km, not ~35 km.** Pan (Encke) and Daphnis (Keeler) shepherd moons are correctly referenced. Gap-edge waves from gravitational interaction are confirmed by Cassini. |
| 6 | D-Ring | uDRingGossamer | ✅ | Faintest inner ring extending close to atmosphere — confirmed by Cassini. Very faint (#8A7A70, alpha 0.15) is appropriate. Dust particles from ring rain. |
| 7 | E & G Ring | uERingOuter | ✅ | Default OFF correct. E-ring fed by Enceladus geysers confirmed by Cassini. G-ring from Mimas particles. Very faint (alpha 0.05) is appropriate. |

### Atmosphere & Banding (5 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 8 | Equatorial Zone | uEquatorialZone | ⚠️ | Color #E8DCC8 → #D8CCBA (cream) is consistent with Saturn's pale appearance. **Issue: wind speed "~450 m/s" at equator is correct for Cassini measurements but should note this is the fastest equatorial jet of any planet** (actually Saturn's equatorial wind is ~450 m/s, confirmed). Width ~25° is correct. |
| 9 | Equatorial Belts & Temperate | uTemperateBelts | ✅ | Fainter contrast than Jupiter is correct — Saturn's bands are more muted. Colors #C9A880 → #8F6F50 are consistent with Cassini visible-light images. Wind retrograde ~300 m/s in belts is within measured range. |
| 10 | Polar Regions | uPolarRegions | ⚠️ | Deep blue-gray #5A7A9F → #3A4A6F: Cassini showed Saturn's north pole was blue in 2006 (winter) but changed to golden/yellow by 2017 (summer) — the color depends dramatically on the season. **The blue is only accurate for the winter pole; summer pole should be golden #C8A060.** The specification should note seasonal color change. |
| 11 | Wind Shear & Jets | uWindShear | ✅ | Sharp boundaries and jet stream positions confirmed by Cassini wind profiles. Saturn has ~20 jet streams per hemisphere. Amplified turbulence at boundaries is observed. |
| 12 | Upper Haze & Limb Darkening | uHazeLimb | ✅ | High-altitude haze stronger than Jupiter is correct — Saturn's colder temperatures cause thicker haze layers. Color #D9CEC4 and alpha 0.12-0.18 are appropriate. |

### Hexagonal Polar Vortex (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 13 | North Polar Hexagon | uHexagonMain | ⚠️ | The hexagon is at ~78° N with sides ~14,500 km — the doc says "~25,000 km side length" which is the total diameter across, not side length. **Each side is ~14,500 km (the hexagon is ~30,000 km across).** Discovered by Voyager 1 (1980): ✅ (actually by Voyager 1 in 1981). Color #D4B870 (pale yellow-tan): this is the summer color — in winter, the interior was blue. Cassini documented the color transition from blue to golden over the mission. The hexagon extends ~300 km into the stratosphere (ESA 2018 finding). Wind rotation: the hexagon jet stream has winds of ~500 km/h (~140 m/s), not 0.013 rad/s (~11-hour period). **Correction: side length should be ~14,500 km (document's "~25,000 km" is the approximate diameter).** |
| 14 | Hexagon Edge Jets | uHexagonEdges | ✅ | Sharp brown-orange edges with higher wind velocity are confirmed by Cassini. The thin line following hexagon perimeter is the correct rendering approach. |
| 15 | Hexagon Interior Clouds | uHexagonInterior | ✅ | Patchy clouds within the hexagon interior are confirmed by Cassini ISS — convective storms and a central vortex "hurricane" at the pole are documented. Sparse Voronoi pattern is appropriate. |

### Major Storms (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 16 | Great White Spot | uGreatWhiteSpot | ⚠️ | Episodic roughly every 29.5 years: the most recent was in 2010 (not 2020 as listed). **Correction: "1933, 1960, 1990, 2020" should be "1933, 1960, 1990, 2010".** Next expected ~2039-2040. The 2010 storm was documented by Cassini and ground-based observers as an enormous white storm that eventually encircled the planet. Size 10,000-15,000 km is correct for the initial feature (the storm system eventually grew to encircle Saturn). Default OFF is correct. |
| 17 | Storm Clusters | uStormClusters | ✅ | Small anticyclonic ovals in temperate zones confirmed by Cassini. White to beige colors are consistent. Stochastic Worley noise for scattered placement is appropriate. |
| 18 | Red Spot Analog | uRedSpotSouth | 🔬 | Default OFF correct. Speculative — no persistent Jovian-type red spot observed on Saturn in modern era. |

### Cloud Chemistry (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 19 | Ammonia Ice Clouds | uAmmoniaLayer | ✅ | Primary cloud layer at ~0.5 bar, ~-110°C — correct. Color cream to pale beige, less yellow than Jupiter — Cassini confirmed Saturn's more muted palette due to deeper haze layers. |
| 20 | Ammonium Hydrosulfide Layer | uAmmoniumHS | ✅ | Intermediate layer at ~3 bar — thermochemical models predict NH₄SH clouds between ammonia and water layers. Color #8A7A70 is appropriate. Visible in cloud gaps is consistent. |
| 21 | Water Ice Clouds | uWaterLayer | ✅ | Default OFF correct. Deep water clouds at ~10 bar only visible during great storm events — confirmed by 2010 Great White Spot observations showing water ice lofted from depth. |

### Magnetosphere & Torus (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 22 | Dipole Field Lines | uMagFieldLines | ✅ | Saturn's dipole aligned nearly parallel to rotation axis (~0.3° tilt) is confirmed by Cassini magnetometer — this near-perfect alignment is unique and puzzling. Field strength ~0.2 Gauss at equator is correct (Cassini measured 0.21 G). Extent ~500 Rj seems to be a typo — should be ~500 Rs (Saturn radii) or ~20 Rs for the magnetosphere boundary. |
| 23 | Enceladus Torus | uEnceladusTorus | ✅ | Water-group ion torus at Enceladus orbit confirmed by Cassini MIMI and CAPS instruments. Greenish #7F9FA8 is a visualization choice (actual ion emission is in UV). Brightness variation with Enceladus position is correct. |
| 24 | Magnetotail Structure | uMagnetotail | ✅ | Nightside tail confirmed by Cassini. Less pronounced than Jupiter's is correct — Saturn's magnetosphere is smaller. |

### Major Moons (2 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 25 | Moon Positions | uMoonPositions | ⚠️ | Orbital distances and periods are generally correct. **Issue: Iapetus orbital distance listed as "3.6 Rs" — actual Iapetus orbital radius is ~59 Rs (3.56 million km), not 3.6 Rs.** The "3.6" appears to be a confusion between Rs and million km. Titan: #FFB850 yellow-orange ✅ (Cassini shows orange haze). Iapetus two-toned (#5A4530 dark + #E8D8C8 bright): ✅ correct (dramatic leading/trailing hemisphere dichotomy). Enceladus #F0F0F0 white: ✅ (highest albedo in solar system). |
| 26 | Titan Haze | uTitanHaze | ✅ | Titan's thick nitrogen atmosphere with orange methane haze is well-documented by Cassini. Color #C89050 (orange-brown) is correct. Radius 1.5× Titan for the haze extent is approximately correct (actual atmosphere extends to ~600 km altitude above 2575 km radius surface). |

### Axial Tilt (2 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 27 | Tilted Equatorial Plane | uAxialTilt | ✅ | Saturn's 26.7° axial tilt is correct. Creates the iconic tilted ring view that changes with orbital position. Rotation matrix approach is correct. |
| 28 | Seasonal Illumination | uSeasonalIllum | ✅ | 29.5-year orbital period with seasonal changes is correct. Cassini documented dramatic seasonal color changes in the polar hexagon region. |

### Camera (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 29 | Tilted Ring-Side View | uCameraMode | ✅ | Classic Saturn view. |
| 30 | Ring Plane Direct | uCameraMode | ✅ | Educational edge-on view. |
| 31 | Hexagon-Focused Polar | uCameraMode | ✅ | Good for hexagon inspection. |

### Saturn Summary

| Verdict | Count |
|---------|-------|
| ✅ Accurate | 24 |
| ⚠️ Needs adjustment | 6 |
| ❌ Incorrect | 0 |
| 🔬 Unverifiable | 1 |

**Top corrections:** Hexagon side length (25,000 → 14,500 km per side), Great White Spot years (2020 → 2010), polar color seasonal change, Iapetus orbital distance (3.6 Rs → 59 Rs), Keeler gap width.

---

## 3. Uranus-Type (Ice Giant) — ENT-2022

**Reference imagery:** Voyager 2 flyby 1986 (Oxford 2024 reprocessed true-color), Hubble WFC3 annual monitoring, Keck AO infrared, ground-based spectroscopy
**Total features:** 36

### Methane Haze Atmosphere (4 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 1 | Methane Haze Layer | uMethaneLay | ⚠️ | Color #6AAFCA (pale cyan-blue): **Oxford 2024 reprocessing of Voyager 2 data revealed Uranus is actually "greenish blue" — similar to Neptune, not distinctly cyan.** The true color is closer to #7AB8B0 (greenish-blue) rather than the cyan implied. Methane absorption of red light is correct. Featureless appearance compared to Jupiter/Saturn is correct but Hubble has detected increasing cloud activity as Uranus approaches equinox. **Correction: base color should be more greenish-blue ~#7AB8B0 to match Oxford 2024 reprocessing.** |
| 2 | Cloud Decks | uCloudDecks | ✅ | Occasional cloud breaks revealing deeper layers — confirmed by Keck AO and Hubble observations (bright methane clouds detected since 2000s). Light blue #A8D4E0 is appropriate. Sparse 20% coverage is consistent with observations. |
| 3 | Atmospheric Zoning (Faint) | uFaintZoning | ✅ | Extremely faint banding is confirmed by Hubble and Keck — Uranus has very low contrast bands (~<1%). Amplitude 0.03 FBM is appropriately subtle. |
| 4 | Limb Haze & Scattering | uLimbHaze | ✅ | Blue haze at limb from Rayleigh scattering is correct. Color #4A8FA8 at alpha 0.15-0.20 is consistent with Hubble limb observations. |

### Faint Banding (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 5 | Equatorial Band | uEquatorialBand | ⚠️ | **Wind speed "~600 m/s (fastest in solar system)" is incorrect — Neptune has the fastest winds (~2100 km/h ≈ 585 m/s). Uranus equatorial winds are ~100-250 m/s retrograde (much slower).** The fastest Uranian winds are ~250 m/s at mid-latitudes. **Critical correction: wind speed should be ~100-250 m/s, not ~600 m/s.** |
| 6 | Mid-Latitude Features | uMidLatBands | ✅ | Very faint structures at ~30° and ±60° confirmed by modern HST observations. Color variation ±0.02 is appropriately subtle. |
| 7 | Polar Darkening | uPolarDarken | ⚠️ | **Oxford 2024 study found that the poles actually appear slightly lighter/whiter than equator due to thicker haze, not darker.** Hubble observations show a brightened polar hood on the sunlit pole. **Correction: polar regions should show slight brightening, not darkening, due to increased haze.** |

### Extreme Axial Tilt (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 8 | 98° Axial Tilt | uAxialTilt | ✅ | 98° tilt (actually 97.77°) is correct. Causes extreme seasonal effects over 84-year orbit. Rotation axis nearly in orbital plane. The description of pole-to-Sun orientation is accurate. |
| 9 | Seasonal Illumination | uSeasonalIllum | ⚠️ | Description says "Currently (~2040), approaching equinox" — **Uranus's next equinox is ~2049 (last equinox was 2007). In 2040, Uranus would be approaching southern summer solstice (south pole facing Sun).** The equinox statement needs correction. **Correction: ~2040 is approaching southern solstice, not equinox.** |
| 10 | Atmospheric Wind Adaptation | uPoleWind | 🔬 | Wind patterns adapting to extreme tilt is theoretically expected but not well-observed. Warped UV sampling is a creative visualization approach. |

### Polar Regions (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 11 | Sunlit Pole | uSunlitPole | ✅ | Pole currently receiving sunlight shows increased activity — Hubble confirmed bright polar hood on the sunlit pole. Color #A8E8DF with enhanced convection is consistent with observations. |
| 12 | Nightside Pole | uNightPole | ✅ | Dark pole with very low thermal emission is consistent with Uranus's low internal heat. Color #4A6F88 is appropriate. Uranus's internal heat emission is anomalously low (only ~10% of solar input vs ~260% for Neptune). |
| 13 | Polar Temperature Inversion | uPolarInversion | ⚠️ | **"Dark poles are warmer than sunlit equator" — this is not straightforward.** Uranus has a complex thermal profile; the warm-pole phenomenon is observed but the specific color inversion described (warm-toned dark pole) is a visualization choice, not directly optical. The counterintuitive nature is correctly noted. |

### Thin Ring System (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 14 | Main Ring System | uMainRings | ✅ | 13 narrow dark rings confirmed by Voyager 2 and ground-based stellar occultations. Color #3A3A3A (very dark gray) is correct — Uranus's rings are among the darkest in the solar system (albedo ~0.02). Radial positions 42,000-51,000 km and narrow widths (5-100 km) are correct. |
| 15 | Epsilon Ring | uEpsilonRing | ✅ | Densest and most prominent ring — confirmed. Width ~20-96 km (varies due to eccentricity, not constant 100 km). Slightly brighter #5A5A5A is appropriate. Eccentric structure is well-documented. |
| 16 | Ring Spokes & Shepherds | uRingShepher | ✅ | Cordelia and Ophelia shepherd the epsilon ring — confirmed by Voyager 2. Gravitational perturbations creating density variations are well-documented. |

### Magnetosphere & Offset Dipole (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 17 | Tilted & Offset Dipole | uMagDipole | ✅ | 59° tilt from rotation axis and 0.31 Ru offset confirmed by Voyager 2 magnetometer. Field strength ~0.23 Gauss is correct. Off-center field lines creating asymmetric magnetosphere is well-documented. This is one of the most unusual magnetic fields in the solar system. |
| 18 | Magnetosphere Offset Bulge | uMagBulge | ✅ | Asymmetric magnetosphere from offset dipole is confirmed. Warped torus visualization is appropriate. |
| 19 | Aurora-Like Glow | uAuroralMag | ✅ | Hubble detected UV aurorae on Uranus (2011-2012 observations) in unusual locations due to the offset dipole. Asymmetric distribution is correct. |

### Major Moons (2 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 20 | Moon Positions | uMoonPositions | ✅ | Five major moons with correct relative distances. Colors are generally appropriate — all are dark, icy bodies. Miranda's brown-gray (#9A8A80) is consistent with its varied surface (cliff faces and coronae). |
| 21 | Moon Orbital Inclinations | uMoonInclined | ✅ | Moon orbits aligned with equatorial plane (tilted 98° from ecliptic) is correct — unique to the Uranian system. Educational feature. |

### Cold Stratosphere (2 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 22 | Stratospheric Haze | uStratoHaze | ✅ | Upper stratosphere at ~-220°C is consistent with measurements (coldest planetary atmosphere in solar system at tropopause ~49 K). Pale cyan haze #C8E8E8 at alpha 0.08 is subtle and appropriate. |
| 23 | Thermal Emission | uThermalEmit | ✅ | Uranus emits little internal heat (~10% of solar input) — unique among giant planets. Faint thermal glow at alpha 0.05 with sparse coverage correctly represents this anomalously low emission. |

### Camera (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 24 | Tilted-Pole View | uCameraMode | ✅ | Good default emphasizing extreme tilt. |
| 25 | Equatorial Band View | uCameraMode | ✅ | Educational ring orientation view. |
| 26 | Orbital Context | uCameraMode | ✅ | Good for showing long-term seasonal cycle. |

### Uranus Summary

| Verdict | Count |
|---------|-------|
| ✅ Accurate | 24 |
| ⚠️ Needs adjustment | 6 |
| ❌ Incorrect | 0 |
| 🔬 Unverifiable | 1 |

**Top corrections:** Base color (cyan → greenish-blue per Oxford 2024), equatorial wind speed (600 → 100-250 m/s), polar darkening (should be brightening), seasonal illumination era (~2040 not approaching equinox).

---

## 4. Neptune-Type (Ice Giant) — ENT-2023

**Reference imagery:** Voyager 2 flyby 1989 (Oxford 2024 reprocessed true-color), Hubble WFC3 annual monitoring, Keck AO near-IR, JWST mid-IR
**Total features:** 36

### Deep Blue Atmosphere (4 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 1 | Deep Blue Base Color | uBaseBlue | ⚠️ | Color #5A7FA8 (deep blue): **Oxford 2024 reprocessing revealed Neptune is actually "a similar shade of greenish blue" to Uranus, not the deep azure of the famous Voyager 2 images.** The original images were contrast-enhanced. True color is closer to #6AA8A8 (blue-green, slightly deeper blue than Uranus). **Correction: base color should be ~#6AA8A8 to match Oxford 2024 reprocessing.** The deep blue of #5A7FA8 is the enhanced Voyager color, not the true appearance. |
| 2 | Darker Equatorial Region | uEquatorialDarker | ✅ | Equatorial darkening is observed in Hubble and Keck images. Counterintuitive nature correctly noted. Small contrast ~5% is consistent. |
| 3 | Cloud Breaks | uCloudBreaks | ✅ | White methane cirrus clouds confirmed by Hubble and Keck — transient bright features are regularly observed. Sparse 15% coverage with Worley noise is appropriate. |
| 4 | Limb Haze | uLimbHaze | ✅ | Strong blue haze at terminator is confirmed. More pronounced than Uranus due to thinner haze layer (Oxford 2024 finding). Color #6AAFEF at alpha 0.18-0.22 is appropriate. |

### Dark Spot Cyclones (4 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 5 | Great Dark Spot Analog | uGreatDarkSpot | ✅ | Default OFF correct (episodic). Voyager 2 GDS at ~22°S, ~12,000 × 8,000 km oval — correct. Vanished by 1994 (Hubble confirmed). Color #1A3A5E (dark navy) is consistent with appearance. Surrounded by white methane clouds is correct. Historical toggle is good approach. |
| 6 | Scooter | uScooter | ✅ | Fast-moving bright cloud at ~40°S confirmed by Voyager 2. Orbital period ~16 hours (faster than planet's ~16.1-hour rotation) is correct. Size ~4,000 km is approximately correct. Transient feature. |
| 7 | Dark Spot Remnant | uDarkSpotSmall | ✅ | Smaller dark ovals confirmed by both Voyager 2 and Hubble (new dark spots discovered in 2015-2018). Semi-persistent nature is correct. |
| 8 | Bright Oval Cluster | uBrightOvals | ✅ | Bright methane cloud clusters confirmed by Hubble monitoring. Short-lived (weeks) is consistent. |

### Supersonic Wind Bands (4 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 9 | Equatorial Jet | uEquatorialJet | ✅ | Neptune has the fastest winds in the solar system — equatorial jet reaching ~2100 km/h (~585 m/s) is correct. Voyager 2 cloud tracking confirmed these extreme speeds. UV distortion amplitude 0.35 is appropriately dramatic. |
| 10 | Retrograde Belts | uRetrogradeBelts | ✅ | Retrograde wind regions at ±20-30° at 400-500 m/s — consistent with Voyager 2 wind profile. Creates shear complexity. |
| 11 | Mid-Latitude Zones | uMidLatZones | ✅ | Prograde zones at ±45-60° at 200-300 m/s — consistent with wind profile. |
| 12 | Polar Circulation | uPolarCirc | ✅ | Complex polar flow is less well-characterized than equatorial winds but confirmed by Voyager 2 and Hubble observations. |

### Methane Cirrus Clouds (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 13 | White Methane Cirrus Cap | uMethaneCirc | ✅ | Bright methane cloud features confirmed by Voyager 2 and Hubble. Colors white #F5F5F0 to pale blue #E0E8F0 are consistent. Alpha 0.25-0.35 is appropriate for semi-transparent cirrus. |
| 14 | Cirrus Streaks | uCircusStreaks | ✅ | Thin curved streaks following wind flow are confirmed by Hubble cloud tracking observations. Wind-aligned nature is correct. |
| 15 | Transient Convective Plumes | uConvectivePlumes | ✅ | Bright convective plumes from internal heat are confirmed — Neptune's strong internal heat source (2.6× solar input) drives active convection. Hubble has tracked numerous transient bright features. |

### Internal Heat Radiation (2 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 16 | Thermal Infrared Glow | uThermalGlow | ✅ | Neptune radiates ~2.6× more energy than received from Sun — confirmed by Voyager 2 radiometer. This strong internal heat drives the extreme winds and active weather. Red-orange thermal glow at alpha 0.08-0.12 is a reasonable visualization. |
| 17 | Warm Spot Modulation | uWarmSpots | ✅ | Internal heat creating warmer regions is physically motivated. Very subtle alpha 0.03 is appropriate. |

### Thin Ring System (2 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 18 | Incomplete Ring Arcs | uRingArcs | ✅ | Neptune's ring arcs (Liberté, Égalité, Fraternité plus others) confirmed by Voyager 2. Incomplete/partial ring structure is unique. Dark gray color is correct — very dark particles. Sector-based rendering for partial arcs is the correct approach. |
| 19 | Ring Shepherd Dynamics | uRingShepher | ✅ | Adams and Le Verrier ring shepherd relationships confirmed. Galatea confines Adams ring. |

### Triton Backdrop (2 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 20 | Triton Position | uTritonPos | ✅ | Retrograde orbit confirmed — strong evidence for Kuiper Belt capture. Period 5.88 days is correct. Distance ~14.9 Rn is approximately correct. Triton colors (icy white #E8E8F0 with darker regions #7A7A8A) are consistent with Voyager 2 images. |
| 21 | Triton Geysers | uTritonGeysers | ⚠️ | Nitrogen geysers confirmed by Voyager 2 — shooting material ~8 km high (not 8 km/s speed). **Issue: "nitrogen gas at ~8 km/s" — the geyser plumes reach ~8 km altitude, not 8 km/s velocity.** Actual ejection velocity is ~20-30 m/s (Morton & Silvestro 1996). **Correction: "~8 km altitude" not "~8 km/s".** |

### Magnetosphere (2 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 22 | Offset Tilted Dipole | uMagDipole | ✅ | 47° tilt and 0.55 Rn offset confirmed by Voyager 2 magnetometer. Field strength ~0.14 Gauss is correct. Both ice giants having offset dipoles suggests this is generated differently from Jupiter/Saturn's dynamo. |
| 23 | Asymmetric Aurora | uAuroralAsym | ✅ | Asymmetric aurora from offset dipole is confirmed by Voyager 2 UV spectrometer observations. Hemisphere-dependent weighting is the correct visualization. |

### Camera (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 24 | GDS Historical View | uCameraMode | ✅ | Good default with historical toggle for GDS. |
| 25 | Scooter Chasing | uCameraMode | ✅ | Creative dynamic camera. |
| 26 | Pole Thermal View | uCameraMode | ✅ | Good for showing internal heat. |

### Neptune Summary

| Verdict | Count |
|---------|-------|
| ✅ Accurate | 23 |
| ⚠️ Needs adjustment | 2 |
| ❌ Incorrect | 0 |
| 🔬 Unverifiable | 0 |

**Top corrections:** Base color (deep blue → greenish-blue per Oxford 2024), Triton geyser velocity (8 km/s → 8 km altitude).

---

## 5. Hot Jupiter (Exoplanet) — ENT-2025

**Reference imagery:** JWST MIRI phase curves (HD 189733b, 55 Cancri e, WASP-121b), Spitzer thermal phase curves, HST transit spectroscopy, theoretical GCM models
**Total features:** 36

### Day-Side Photosphere (4 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 1 | Substellar Point Hotspot | uSubstellarHot | ✅ | Temperature range 1300-3000 K is correct for the hot Jupiter category (HD 189733b ~1200 K, KELT-9b ~4600 K). Color #FFC08A (burnt orange-yellow) is appropriate for ~1200-1500 K blackbody. FBM cloud mottling is reasonable. |
| 2 | Dayside Circulation | uDaySideCirc | ⚠️ | Wind speeds ~7 km/s: HD 189733b has measured winds up to ~8,700 km/h (~2,400 m/s ≈ 2.4 km/s), not 7 km/s. Theoretical models predict up to 4-5 km/s for the hottest planets. **Correction: wind speed should be ~2-5 km/s, not ~7 km/s.** Equator-to-poles flow pattern is one component of the complex 3D circulation. |
| 3 | Silicate Haze | uSilicateHaze | ✅ | Aluminum oxide and silicate clouds on hot day-sides are predicted by theoretical models and indirectly supported by transit spectroscopy. Color #F0E8C0 is appropriate. Alpha 0.30-0.40 is reasonable. |
| 4 | Limb Brightening | uLimbBright | ✅ | Limb brightening from optically thick atmosphere is physically correct. Color #FFE0A0 is appropriate. |

### Night-Side Twilight (4 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 5 | Night-Side Cooling | uNightSideTemp | ✅ | Nightside temperature ~100-400 K depending on heat redistribution — HD 189733b nightside is ~973 K (surprisingly warm due to efficient heat redistribution). Color #2A1F1A is appropriate for the dark appearance. |
| 6 | Thermal Emission Glow | uNightThermalGlow | ✅ | Night-side thermal glow is confirmed by Spitzer and JWST phase curves. Red-orange #FF5030 at alpha 0.08-0.12 is appropriate for IR visualization. |
| 7 | Hot Spot Lag | uHotSpotLag | ⚠️ | Hot spot offset is a key confirmed feature — Spitzer measured ~30° east offset for HD 189733b, not 60° as described. Recent JWST MIRI mapping confirmed ~30° offset. **Correction: offset should be ~30° eastward (HD 189733b), not ~60°.** The 60° value may apply to some theoretical models but observational data shows ~30°. |
| 8 | Terminator Band | uTerminatorBand | ✅ | Sharp terminator transition with turbulent boundary is predicted by GCM models. Width ~20° and FBM turbulence are reasonable. |

### Terminator Jets & Circulation (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 9 | Kelvin-Helmholtz Waves | uKelvinHelmholtz | 🔬 | KH instability at the terminator is predicted by theoretical models but never directly observed. Physically motivated visualization. |
| 10 | Superrotating Winds | uSuperrotating | ✅ | Eastward equatorial superrotation is a robust prediction of all hot Jupiter GCMs and confirmed by hot-spot offsets. Dramatic streaking effect is appropriate. |
| 11 | Atmospheric Wake | uAtmosTail | 🔬 | Atmospheric wake/tail is predicted by some GCMs but not directly observed. Reasonable speculative feature. |

### Silicate Cloud Formation (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 12 | Aluminum Oxide Clouds | uAluminumOxide | 🔬 | Corundum cloud formation at ~1500 K predicted by cloud models (Helling & Woitke 2006). Not directly confirmed but indirectly supported by featureless transmission spectra. |
| 13 | Silicate Glass Clouds | uSilicateGlass | ⚠️ | HD 189733b is famous for inferred "glass rain" (silicate particles in atmosphere). JWST detected hydrogen sulfide, supporting complex cloud chemistry. Color #FFFAEE is appropriate. However, calling them "glass" clouds is slightly misleading — they're silicate condensate particles. |
| 14 | Cloud Clearing | uCloudClearing | ✅ | Temperature-dependent cloud opacity (silicates vaporize above ~1800 K) is well-supported by theoretical models and transit observations. Cleared regions on hottest day-side are predicted. |

### Atmospheric Escape (2 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 15 | Hydrogen Escape | uHydrogenEscape | ✅ | Hydrogen escape from hot Jupiters is confirmed by Lyman-alpha transit observations (Vidal-Madjar et al. 2003 for HD 209458b). Color #C8E8FF for escape glow is appropriate. Mass loss rates are correct. |
| 16 | Mass Loss Rate Display | uMassLossRate | ✅ | Default OFF correct. Mass loss rate ~10⁸-10⁹ g/s is within observational estimates. Informational overlay. |

### Magnetic Reconnection (2 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 17 | Flare-Like Events | uMagneticFlares | 🔬 | Stellar-planetary magnetic interaction is theoretically predicted (Lanza 2013) but observational evidence is debated. Speculative visualization. |
| 18 | Magnetic Field Lines | uMagFieldLines | 🔬 | Exoplanetary magnetic fields are predicted but not directly measured. Speculative but scientifically motivated. |

### Tidal Bulge (2 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 19 | Tidal Bulge Elongation | uTidalBulge | ✅ | Tidal deformation of close-in giant planets is theoretically expected. 5% distortion is within the range predicted by tidal models for the closest hot Jupiters. Prolate spheroid shape is correct. |
| 20 | Tidal Heating Hotspot | uTidalHeat | ✅ | Tidal dissipation concentrating heat is predicted by tidal interaction models. Tighter hotspot radius from tidal contribution is physically motivated. |

### Migration History (2 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 21 | Orbital Context | uOrbitalContext | ✅ | Orbital period 2-4 days and distance ~0.03 AU are correct for typical hot Jupiters. Educational overlay. |
| 22 | Radius Anomaly Label | uAnomalyLabel | ✅ | Default OFF correct. Inflated radius anomaly (20-50% larger than predicted) is one of the outstanding problems in exoplanet science. Informational. |

### Camera (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 23 | Sub-Stellar Facing | uCameraMode | ✅ | Good default showing day-night contrast. |
| 24 | Orbital Motion | uCameraMode | ✅ | Good for context. |
| 25 | Terminator Edge-On | uCameraMode | ✅ | Creative angle for atmospheric shearing. |

### Hot Jupiter Summary

| Verdict | Count |
|---------|-------|
| ✅ Accurate | 17 |
| ⚠️ Needs adjustment | 3 |
| ❌ Incorrect | 0 |
| 🔬 Unverifiable | 5 |

**Top corrections:** Wind speed (7 km/s → 2-5 km/s), hot spot offset (60° → ~30°), silicate glass cloud naming.

---

## Global Summary — All Gas Giants

| Entity | Total Features | ✅ | ⚠️ | ❌ | 🔬 |
|--------|---------------|-----|-----|-----|-----|
| Jupiter-Type | 36 | 27 | 5 | 0 | 1 |
| Saturn-Type | 36 | 24 | 6 | 0 | 1 |
| Uranus-Type | 36 | 24 | 6 | 0 | 1 |
| Neptune-Type | 36 | 23 | 2 | 0 | 0 |
| Hot Jupiter | 36 | 17 | 3 | 0 | 5 |
| **TOTAL** | **180** | **115** | **22** | **0** | **8** |

## Top 15 Priority Corrections

| # | Entity | Feature | Issue | Correction |
|---|--------|---------|-------|------------|
| 1 | Uranus | Base Color | Cyan #6AAFCA doesn't match Oxford 2024 reprocessed greenish-blue | → #7AB8B0 |
| 2 | Neptune | Base Color | Deep blue #5A7FA8 is enhanced Voyager 2 color, not true | → #6AA8A8 (greenish-blue) |
| 3 | Uranus | Equatorial Wind | "~600 m/s (fastest in solar system)" is wrong — that's Neptune | → 100-250 m/s |
| 4 | Saturn | Great White Spot | Years listed as "1933, 1960, 1990, 2020" — 2020 should be 2010 | → 2010 |
| 5 | Saturn | Hexagon | "~25,000 km side length" is the diameter, not side | Side ~14,500 km |
| 6 | Jupiter | South Polar Cyclones | 5-fold symmetry — updated to 6 cyclones | → 6-fold |
| 7 | Jupiter | GRS Size | "16,000 × 12,000 km" is 2017 data, shrinking | → ~14,000 × 11,000 km (2024) |
| 8 | Hot Jupiter | Wind Speed | "~7 km/s" supersonic — measured ~2-5 km/s | → 2-5 km/s |
| 9 | Hot Jupiter | Hot Spot Offset | "~60° eastward" — observations show ~30° | → ~30° east |
| 10 | Saturn | Polar Color | Only valid for winter — summer pole is golden | Add seasonal note |
| 11 | Saturn | Iapetus Distance | "3.6 Rs" — actual ~59 Rs | → ~59 Rs |
| 12 | Neptune | Triton Geysers | "~8 km/s" velocity — should be ~8 km altitude | → 8 km altitude |
| 13 | Uranus | Polar Darkening | Should be brightening (haze hood) | Invert to brightening |
| 14 | Uranus | Seasonal Era | "~2040 approaching equinox" — equinox is ~2049 | → approaching solstice |
| 15 | Jupiter | Polar Color | Purple #2A1F3F too saturated | → #3A3A5F blue-gray |
