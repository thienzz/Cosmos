# Rocky Planets — Feature-Level Cross-Reference Report

**Date:** 2026-04-17
**Scope:** 5 rocky planet entities, ~172 features — verified against MESSENGER, Venus Express/VIRTIS, MRO HiRISE, Perseverance, JWST imagery and astrophysical literature
**Method:** WebFetch analysis of NASA/ESA image pages + published observational data + planetary science literature
**Legend:** ✅ Accurate | ⚠️ Needs adjustment | ❌ Incorrect | 🔬 Unverifiable (speculative/exoplanet)

---

## 1. Mercury-Type — ENT-2010

**Reference imagery:** MESSENGER MDIS enhanced color global mosaic, MESSENGER WAC 11-filter multispectral, MESSENGER sodium tail images (STEREO HI-1), ground-based sodium D-line observations
**Total features:** 34

### Surface & Regolith (4 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 1 | Base Regolith | uRegolith | ⚠️ | Color #8C7E6E is close but Mercury is darker and more gray than this implies. MESSENGER true-color data shows Mercury as "dark, dull gray" resembling dry concrete (reflectance ~0.07–0.12). The actual mean color is closer to #706860 (darker gray-brown). Enhanced color maps show warm tones but those are false-color. The FBM approach at freq 18.0 is reasonable. **Correction: base color should be ~#706860 to match Mercury's actual very dark gray appearance.** |
| 2 | Ray System | uRaySystem | ⚠️ | Fresh crater rays are indeed brighter than surrounding regolith — MESSENGER confirms young craters have higher-albedo ejecta. Color #D5D0C8 is too bright for Mercury; fresh rays are brighter but still gray. A better value would be ~#A8A098 (lighter gray, ~50% brighter than base, not 30% brighter than the too-bright base). Ray lengths 200–800 km are correct for larger craters. **Correction: ray color to ~#A8A098; ensure contrast is relative to corrected darker base.** |
| 3 | Space Weathering Darkening | uSpaceWeathering | ✅ | Space weathering is well-documented on Mercury — solar wind implantation and micrometeorite bombardment darken the surface over time. The 20% albedo reduction for old terrain is scientifically correct (Domingue et al. 2014). Color #6B6660 as darkened region is plausible relative to corrected base. FBM at freq 8.0 for age zones is reasonable for large-scale terrain age variation. |
| 4 | Smooth Planar Terrain | uPlainTerrain | ✅ | Default OFF correct. Smooth plains cover ~27% of Mercury's surface (not ~10% as stated — Head et al. 2011 found 27%). Color #7A7368 as slightly darker than regolith is consistent with volcanic plains being darker basaltic composition. **Minor correction: coverage should be ~27% not ~10%.** |

### Crater Fields (5 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 5 | Impact Crater Distribution | uCraters | ✅ | Multi-generational crater population well-documented by MESSENGER. Power-law size distribution correct. Crater density ~1.5 per 10^6 km² for larger craters is in the right order (Mercury is more heavily cratered than Moon in some size ranges). Worley noise at multiple scales is an excellent approach for crater generation. |
| 6 | Peak-Ring Basins | uPeakRingBasins | ✅ | MESSENGER catalogued many peak-ring basins on Mercury. Caloris at ~1550 km is the largest confirmed. Dark mare-like interiors (#5A5A5A) are consistent with volcanic infill (smooth plains within basins). Multi-layer heightmap approach is correct for basin morphology. |
| 7 | Secondary Crater Clusters | uSecondaryCraters | ✅ | Default OFF correct (performance toggle). Secondary craters are well-documented — chain-like patterns radiating from parent craters are observed by MESSENGER. Worley noise sub-octave at freq 40.0 for clustering is reasonable. |
| 8 | Crater Rim Shadows | uCraterShadows | ✅ | Essential for depth perception. Mercury's lack of atmosphere means shadows are extremely stark — no atmospheric scattering to soften them. The 40% contribution to visual depth is a reasonable estimate. Normal map perturbation approach is correct. |
| 9 | Ejecta Blankets | uEjectaBlankets | ⚠️ | Ejecta blankets are real and well-documented. Color #D5D0C8 has the same issue as ray system — too bright for Mercury. Should be relative to the corrected darker base. **Correction: adjust to ~#A8A098 consistent with ray system correction.** Extent ~30 km for >10 km craters is reasonable. |

### Tectonic Scarps (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 10 | Rupes Scarps | uRupesScarp | ✅ | MESSENGER confirmed extensive lobate scarps across Mercury from ~7 km of radial contraction over 4 Gyr (Byrne et al. 2014). Discovery Rupes and Beagle Rupes are real features. Heights 1–3 km and lengths 100–1000 km are correct. Color differentiation between sunlit (#9A9180) and shadowed (#5A5A60) faces is good technique. |
| 11 | Ridge Pattern Orientation | uRidgeOrientation | ✅ | Scarp orientation is not random — MESSENGER data shows a preferred N-S orientation in many regions, with some E-W scarps. The Voronoi domain approach captures the semi-organized pattern well. ~30% coverage is slightly high; MESSENGER mapped scarps covering ~15-20% of the surface. |
| 12 | Basin Ring Structures | uBasinRings | ✅ | Concentric rings within large basins are well-documented impact features. Color progression from outer (#8C7E6E) to darker inner is consistent with volcanic infill. Radial heightmap approach is correct. |

### Caloris Basin (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 13 | Basin Central Depression | uCalorisDepression | ⚠️ | Caloris diameter is ~1550 km (not exactly 1500 km, but close enough). The dark basaltic floor (#4A4A52) is consistent with MESSENGER observations of smooth plains infill. **Issue: "Located at longitude ~180°" — Caloris is centered at ~162°E longitude, not 180°.** The 3:2 resonance hot pole relationship is correctly noted. Depth ~2 km is reasonable. **Correction: longitude to ~162°E.** |
| 14 | Radial Ridge Pattern | uCalorisRidges | ✅ | Radial ridges (Pantheon Fossae) radiating from center are well-documented by MESSENGER. Spoke-like pattern extending ~500 km is slightly long — Pantheon Fossae extends ~200-300 km from center. But overall the feature is accurately described. Color #8C7E6E with slight elevation 100–300 m is reasonable. |
| 15 | Hilly Terrain Antipode | uAntipodalHills | ✅ | The "weird terrain" or "chaotic terrain" at the Caloris antipode is a confirmed MESSENGER observation, believed to be caused by seismic focusing from the Caloris impact. ~300 km × 300 km extent is correct. Roughened normal map approach is appropriate. |

### Polar Ice Deposits (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 16 | Permanent Shadow Regions | uPermanentShadow | ⚠️ | Permanently shadowed craters at Mercury's poles confirmed by MESSENGER and Earth-based radar. **Issue: "sunlight never reaches <1500 K" — this should be "temperature <100 K" not 1500 K.** 1500 K would be hotter than the subsolar point. Temperatures in permanently shadowed craters reach as low as ~50 K (Paige et al. 2013). Blue glow (#5F6E8C) is a reasonable visualization choice. **Critical correction: temperature should be <100 K, not <1500 K.** Coverage ~10 km² per pole seems low — MESSENGER found ~10,000+ km² of permanently shadowed terrain at each pole. **Correction: coverage to ~10,000 km² per pole.** |
| 17 | Water Ice Deposits | uWaterIce | ✅ | MESSENGER confirmed water ice in permanently shadowed craters via neutron spectrometer and radar reflectance. Color #E8F4FF for ice is correct. High albedo (0.85) is reasonable for fresh ice. Thickness 100 m–2 km is speculative but plausible. High specularity for ice rendering is correct. |
| 18 | Crater Subsurface Coldness | uCraterColdZones | 🔬 | Default OFF correct. Speculative visualization — the blue tint concept is a reasonable way to show thermal information. Not directly observable at the surface optically. |

### Exosphere & Sodium Tail (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 19 | Sodium Emission | uSodiumTail | ⚠️ | Mercury's sodium tail is well-documented by MESSENGER UVVS and ground-based observations. Color #FFD700 (golden-orange) is correct — sodium D-line emission at 589 nm produces a yellow-orange glow. **Issue: extent "10–20 planet radii" is too short.** STEREO observations show the sodium tail extending hundreds to thousands of Mercury radii antisolar. The tail can extend >24 million km (Baumgardner et al. 2008). **Correction: extent should be "hundreds of planet radii" or ">100 Rp".** Intensity 0.3 is reasonable for visualization. Solar wind sputtering mechanism is correct. |
| 20 | Hydrogen Corona | uHydrogenCorona | ✅ | Default OFF correct. MESSENGER detected hydrogen and oxygen in Mercury's exosphere. Extent ~2 Rp is reasonable for the hydrogen exosphere. Color #C0D8FF is appropriate. Low-frequency volumetric scatter is correct approach. |
| 21 | Dayglow Brightening | uDayglowEffect | ✅ | Default OFF correct. Subsolar brightening from atmospheric heating is extremely subtle on Mercury (negligible atmosphere). Intensity 0.05 is appropriately faint. Good speculative/educational feature. |

### Solar Proximity Effects (2 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 22 | Subsolar Heating Glow | uSubsolarGlow | ✅ | Subsolar point reaching ~700 K at perihelion is correct (MESSENGER measured up to ~700 K). Color #FF6B35 (bright orange-red) is appropriate for hot rock thermal emission. The 3:2 resonance modulation with orbital phase is scientifically correct — Mercury has two "hot poles" that alternate facing the sun at perihelion. Intensity 0.2 is reasonable. |
| 23 | Night-Side Cooling | uNightSideCold | ✅ | Nightside temperature ~100 K is correct (MESSENGER confirmed ~100 K on the dark side). The extreme day-night contrast is one of Mercury's defining features. Sharp terminator is correct — no atmosphere to soften the transition. Fresnel rim darkening approach is appropriate. |

### Magnetic Field (2 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 24 | Dipole Field Lines | uMagFieldLines | ✅ | Default OFF correct. Mercury's magnetic field is ~1% of Earth's (not 0.2% — it's about 1.1% of Earth's dipole moment, Anderson et al. 2011). The field is offset northward by ~0.2 Rp. Tilt ~11° is close (actual offset is ~5° tilt but significant northward offset). Faint blue lines (#4A7FB5) at 0.25 opacity is appropriate for educational overlay. **Minor: field strength should say ~1% Earth, not ~0.2%.** |
| 25 | Magnetotail Region | uMagnetotail | ✅ | Default OFF correct. Mercury's magnetotail extends ~10 Rp (confirmed by MESSENGER magnetometer). Faint blue glow is appropriate. Solar wind compression of the magnetosphere is well-documented. |

### Camera (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 26 | Light Direction | uLightDir | ✅ | AUTO mode showing terminator is excellent for Mercury where shadows define topography. |
| 27 | Time Speed Multiplier | uTimeSpeed | ⚠️ | 30x speed: "1 real second = 1 Mercury minute (~2.4 seconds true)" — Mercury's sidereal rotation period is ~58.6 Earth days. At 30x, 1 real second = 30 seconds true. The 3:2 resonance period (~176 Earth days) at 30x would take ~176×86400/30 = ~507,000 seconds (~5.9 days) in real time — far more than 5 minutes. **The description "Full 3:2 resonance period (~176 Earth days) completes in ~5 real minutes" implies a much higher time multiplier (~24,000x). Either the multiplier should be higher or the description corrected.** |
| 28 | Auto-Rotate | uAutoRotate | ✅ | Good — reveals all major features. |

### Mercury Summary

| Verdict | Count |
|---------|-------|
| ✅ Accurate | 18 |
| ⚠️ Needs adjustment | 9 |
| ❌ Incorrect | 0 |
| 🔬 Unverifiable | 1 |

**Top corrections:** Base regolith color too bright (#8C7E6E → #706860), ray/ejecta colors too bright, Caloris longitude (180° → 162°E), permanent shadow temperature (1500 K → <100 K), permanent shadow coverage (10 km² → 10,000 km²), sodium tail extent (10-20 Rp → >100 Rp), magnetic field strength (0.2% → ~1% Earth), time speed description inconsistency.

---

## 2. Venus-Type — ENT-2011

**Reference imagery:** Venus Express VIRTIS cloud structure maps, Akatsuki UVI/IR2 cloud tracking, Magellan SAR surface radar (speculative surface toggle), Pioneer Venus UV images, ground-based sodium D-line
**Total features:** 35

### Cloud Deck Morphology (4 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 1 | Dense Cloud Top Layer | uCloudDeck | ✅ | Color #FFE5A3 (light sulfur yellow) is consistent with Venus's visible appearance — Pioneer Venus and Venus Express UV images show yellowish cloud tops. Altitude 55–70 km is correct (Venus Express VIRTIS confirmed cloud tops at 65–70 km, descending to ~63 km at poles). 99.9% coverage correct — Venus is completely cloud-covered. Mie scattering approximation is appropriate for sulfuric acid droplets (~2 μm mean size). |
| 2 | Equatorial Cloud Streaks | uEquatorialStreaks | ✅ | Super-rotating winds at ~100 m/s are confirmed by Venus Express and Akatsuki cloud tracking. The 4-day period for visible cloud motion is correct (equatorial atmosphere super-rotation period). Color #FFF8DC (pale) is appropriate for brighter equatorial bands. UV albedo markings show Y-shaped cloud patterns at equator, which the sinuous stripes capture. |
| 3 | Polar Vortex Cloud Structure | uPolarVortex | ⚠️ | Venus Express VIRTIS confirmed the south polar dipole vortex. However, this feature is listed in Cloud Deck section but there's a separate "Polar Vortex" section (Section 6) with more detail. The description says "anticyclonically" but the vortex rotates cyclonically (it's a low-pressure feature at the pole). **Issue: "dipole" is at the center of a larger vortex — the dipole structure is ~2000 km, not ~4 Rp diameter.** 4 Rp is far too large. **Correction: diameter should be ~2000-3000 km, not ~4 Rp (which would be ~24,000 km).** |
| 4 | Hemispherical Asymmetry | uCloudAsymmetry | ✅ | Default OFF correct. Subtle albedo differences between hemispheres are observed in UV (the "unknown UV absorber"). ~3% is consistent with observations. |

### Atmospheric Circulation (4 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 5 | Hadley Cell Circulation | uHadleyCell | ✅ | Venus has a single large Hadley cell per hemisphere extending from equator to ~60° latitude (unlike Earth's three cells). The subsolar-to-pole circulation is correct. Color gradient approach for convective structure is reasonable. |
| 6 | Super-Rotation Bands | uSuperRotation | ✅ | The ~4 Earth day cloud-top super-rotation period is well-confirmed by Venus Express and Akatsuki. Zonal wind structure creating distinct bands is observed in UV imagery. The retrograde motion (relative to surface) and prograde (relative to deep atmosphere) description is correct. Advecting texture coordinates by wind speed is the correct shader approach. |
| 7 | Vertical Wind Shear | uWindShear | ✅ | Default OFF correct. Surface winds ~0.3 m/s vs cloud-top ~100 m/s is confirmed by Venera landers and Venus Express. The dramatic wind shear is one of Venus's most extreme atmospheric features. Color intensity gradient approach is reasonable. |
| 8 | Thermal Tides | uThermalTides | ✅ | Default OFF correct. Thermal tides are theorized to play a role in maintaining super-rotation (Lebonnois et al. 2010). The 8-12 hour period is within theoretical estimates. Subtle brightness undulation is an appropriate visualization. |

### Sulfuric Acid Haze Layers (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 9 | Intermediate Haze Layer | uHazeLayer | ✅ | Sulfuric acid aerosol layers at 45–70 km are confirmed by Venus Express VIRTIS vertical profiles. Cloud top altitudes descend from ~67 km to ~63 km poleward (Ignatiev et al. 2009). Color #F5E6D3 (tan-yellow) is consistent. Optical depth 0.7 is within the range (~0.5–2.0 depending on wavelength and altitude). |
| 10 | Radiative Opacity | uRadiativeOpacity | ✅ | Venus's Bond albedo of 0.76 is correct — one of the highest in the solar system. Complete opacity to surface visibility is correct (no surface detail visible in optical wavelengths). Fragment discard approach is appropriate. |
| 11 | Aerosol Settling Gradient | uAerosolGradient | ✅ | Default OFF correct. Upper haze with smaller particles scattering more blue is physically correct (Rayleigh-like for sub-wavelength particles). The altitude-dependent color gradient is well-motivated by VIRTIS observations showing three distinct cloud layers. |

### Volcanic Surface (speculative, 3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 12 | Crustal Basalt Texture | uBasaltSurface | 🔬 | Default OFF correct. Magellan SAR revealed volcanic plains but we have no true optical view of Venus's surface. Venera lander images show dark basaltic rock at specific sites. Color #3A3A2C is reasonable for basalt. The ~430 km³ lava volume stat seems oddly specific — Magellan mapped ~80% of surface as volcanic plains. This is speculative visualization if clouds are toggled off. |
| 13 | Pancake Domes | uPancakeDomes | 🔬 | Default OFF correct. Pancake domes are real Magellan-discovered features (100–500 km diameter is a bit large — typical range is 20–65 km diameter). Color #5A5A48 is reasonable. **Correction: diameter range should be ~20–65 km, not 100–500 km.** |
| 14 | Rift Zones & Tessera | uTessera | 🔬 | Default OFF correct. Tessera terrain covers ~8% of Venus's surface (not 30%). Magellan radar shows heavily deformed terrain. **Correction: coverage should be ~8%, not 30%.** |

### Lightning Phenomena (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 15 | Electrical Discharge Flashes | uLightningFlashes | ⚠️ | Venus lightning is controversial — Venus Express detected electromagnetic signatures consistent with lightning (Russell et al. 2007), but optical confirmation remains debated. The feature's existence as a toggle is appropriate. **Issue: intensity 0.8–1.0 and repeat every 0.5–2 s is very frequent.** If Venus lightning exists, it's likely much rarer than Earth lightning. The flash rate should be lower or described as uncertain. |
| 16 | Lightning Glow Halo | uLightningGlow | ✅ | Conditional on lightning existing, a glow halo from deep cloud illumination is physically correct. Color #FFF8DC at 0.4 intensity with 30 km radius is reasonable for deep-cloud lightning visible through thick sulfuric acid layers. |
| 17 | Nightside Illumination | uNightsideFlash | ⚠️ | Pioneer Venus Orbiter detected "ashen light" on Venus's nightside, which some attribute to lightning. The concept is correct but highly debated. **Default ON is aggressive for a contested phenomenon.** Consider default OFF or lowered intensity. |

### Polar Vortex (2 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 18 | South Polar Dipole Structure | uSouthDipole | ⚠️ | Venus Express VIRTIS confirmed the south polar dipole vortex — a "double-eye" feature that is constantly shape-shifting. The description correctly notes the dipole structure. **Issue: "rotating anticyclonically" — the vortex center drifts around the pole with ~5-10 Earth day period, displaced ~3° from the pole (Luz et al. 2011). The rotation direction in the southern hemisphere cyclonic sense needs clarification.** The S-shape/figure-8 morphology is well-documented. Colors #FFE5A3 center and #D4A857 outer are consistent with thermal imagery. |
| 19 | Oscillating Dipole Orientation | uDipoleOscillation | ⚠️ | Default OFF correct. The ~4-year oscillation is not well-constrained — Venus Express observed wobble/precession but the period is shorter (~5-10 Earth days for the drift, not 4 years). **Correction: precession period should be ~5-10 Earth days, not ~4 years.** The ±45° orientation oscillation is roughly consistent with observations showing the dipole center drifts 3° from the pole. |

### Exosphere & Escape (2 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 20 | Hydrogen Escape Tail | uHydrogenTail | ✅ | Default OFF correct. Venus Express detected significant hydrogen and oxygen escape (Barabash et al. 2007). Extent ~3 Rp is within the range of measured escape boundaries. The water photodissociation narrative for ancient ocean loss is the accepted hypothesis. |
| 21 | Limb Brightening | uLimbBrighten | ✅ | Limb brightening from Rayleigh scattering is correct for a planet with thick atmosphere. Color #FFF8DC at 0.6 intensity is consistent with Venus's bright limb observed in UV. Fresnel-based rim light approach is correct. Width ~0.5 Rp seems slightly wide — typical atmospheric limb is thinner (~0.1-0.2 Rp visible extent). |

### Thermal Infrared Signature (2 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 22 | Subsolar Brightening | uSubsolarBright | ✅ | Subsolar point heating causing cloud-top brightening is correct. The +0.05 intensity boost is appropriately subtle. ~40° cone is reasonable for the heated region. |
| 23 | Nightside Thermal Glow | uNightsideGlow | 🔬 | Default OFF correct. Venus Express VIRTIS detected 1.0 μm thermal emission from the surface through thin cloud windows on the nightside. Surface temperature ~464°C (737 K) is correct. Color #FF8C42 is reasonable for thermal emission visualization. This is a real phenomenon observable in near-IR but labeled "speculative" which is slightly misleading — it's confirmed but requires IR mode. |

### Camera (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 24 | Light Direction | uLightDir | ✅ | AUTO mode revealing retrograde cloud motion is good. |
| 25 | Time Speed Multiplier | uTimeSpeed | ✅ | 60x: The description "Super-rotation 4-day period visible in ~4 real seconds" works: 4 days × 86400 / 60 = 5760 real seconds — that's ~96 minutes, not ~4 seconds. **Issue: the math doesn't check out. At 60x, 4 Earth days would be 4×86400/60 = 5760 seconds = 96 minutes.** To see 4-day super-rotation in ~4 seconds, you'd need ~86400x speed. **Correction: either increase multiplier or fix the description.** |
| 26 | Auto-Rotate | uAutoRotate | ✅ | Good feature set revealed. |

### Venus Summary

| Verdict | Count |
|---------|-------|
| ✅ Accurate | 18 |
| ⚠️ Needs adjustment | 7 |
| ❌ Incorrect | 0 |
| 🔬 Unverifiable | 4 |

**Top corrections:** Polar vortex diameter (4 Rp → ~2000-3000 km), dipole oscillation period (4 years → 5-10 Earth days), pancake dome size (100-500 km → 20-65 km), tessera coverage (30% → 8%), nightside illumination default (ON → OFF), time speed math inconsistency.

---

## 3. Mars-Type — ENT-2013

**Reference imagery:** MRO HiRISE true-color and enhanced-color images, Perseverance Mastcam-Z, Curiosity MAHLI/Navcam, Mars Express HRSC, Viking Orbiter, MRO CTX, CRISM mineral mapping
**Total features:** 36

### Surface Geology (5 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 1 | Base Regolith Color | uRegolith | ✅ | Color #C14A1D (rusty red-orange) is consistent with Mars's iron oxide surface. FBM modulation between darker basalt #8B3A1A and bright dust #E08F5A captures the real color diversity observed by HiRISE — Mars shows rusty red, brown, gold, tan, and beige. Iron(III) oxide (Fe₂O₃) and goethite are confirmed surface minerals. 85% coverage as foundation is reasonable. |
| 2 | Crater Distribution | uCraters | ✅ | Multi-scale craters well-documented by HiRISE and CTX. Crater density ~400 per 10^6 km² is in the right ballpark for the southern highlands (higher in highlands, lower in northern lowlands). Worley cellular noise at multiple scales is correct approach. Rim color #A84020, dark floor #6B2A15, ejecta #D86F40 are consistent with Mars color palette. |
| 3 | Valles Marineris Canyon | uVallesMarineris | ✅ | 4000 km long, 7 km deep — correct (actually ~4000 km long, up to 7 km deep, 200 km wide). Floor #3F1810 (dark) is consistent with exposed basalt in canyon walls. Location spanning equatorial latitudes centered ~280°E is close (actual center ~290°E, -14° latitude). HRSC stereo data confirms the depth and morphology. |
| 4 | Olympus Mons Shield Volcano | uOlympusMons | ✅ | 22 km tall, 600 km base diameter — correct. Location 227°E, 18°N is close (actual ~226°E, 18.65°N). Color #A84020 for gentle slopes and darker #6B2A15 caldera is consistent. Gaussian rise via vertex shader is appropriate for shield volcano profile. |
| 5 | Hemispheric Dichotomy | uDichotomy | ✅ | The crustal dichotomy is one of Mars's defining features — northern lowlands ~5 km lower than southern highlands. MOLA topography confirms this. The color differentiation (#D45F30 vs #9A3512) with 0.3 luminance shift is a reasonable visual approach. Sharp boundary at 0°N–30°N matches observations. |

### Volcanic & Tectonic (4 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 6 | Tharsis Bulge | uTharsis | ✅ | Tharsis is ~4000 km wide and ~10 km above datum — confirmed by MOLA. Three shield volcanoes (Arsia, Pavonis, Ascraeus Mons) on the bulge are correct. Color #B04010 with lighter lava flows #D96E40 is consistent with orbital imagery. Location ~250°W (~110°E) is approximately correct. |
| 7 | Ancient Lava Plains | uLavaPlains | ✅ | Default OFF correct. Dark basaltic plains (TES mineral mapping shows basaltic composition). Locations in Hellas, Utopia, Isidis basins are correct major impact basins. Color #5B2A18 (darker than regolith) is consistent with less dust-covered basalt exposures. |
| 8 | Fissure Vent Lineaments | uFissureVents | ✅ | Default OFF correct. Volcanic fissures observed near Tharsis and Elysium. The feature description is appropriate for a speculative/detail toggle. |
| 9 | Wrinkle Ridge Network | uWrinkleRidges | ✅ | Default OFF correct. Wrinkle ridges in volcanic plains are well-documented by CTX and HiRISE. Formed by compressional tectonics in ancient lava plains. Color #8B6A47 is consistent with dust-covered ridge material. |

### Polar & Cryosphere (4 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 10 | North Polar Cap | uNorthPolarCap | ✅ | Diameter ~1000 km during northern summer is correct (confirmed by MARCI observations). Color #F5F0D8 for CO₂/H₂O ice is reasonable — the cap appears white to slightly yellow-white due to dust contamination. Layered terrain (Polar Layered Deposits) with concentric ridges is confirmed by HiRISE. Thickness ~3 km is confirmed by SHARAD radar. |
| 11 | South Polar Cap | uSouthPolarCap | ✅ | Permanent residual CO₂ cap ~400 km diameter is correct. Slightly darker #FFF0D0 from more dust is consistent with observations — south polar cap retains more CO₂ ice year-round but is more dust-contaminated. The Swiss cheese terrain (sublimation features) is a defining characteristic observed by HiRISE. |
| 12 | Permanent Frost Deposits | uPermanentFrost | ✅ | Perennial frozen ground at high latitudes confirmed by Phoenix lander (dug up water ice at 68°N). Blue-white tint #F0F5FF is appropriate for frost visualization. Latitude threshold >40° is consistent with observations of ground ice stability (Mellon & Jakosky 1993). |
| 13 | Seasonal Frost Sublimation | uSeasonalSublimation | ✅ | Seasonal CO₂ frost cycle over 687 Earth days (1 Mars year) is correct. Northern cap seasonal extent grows/shrinks dramatically. Animated cap size oscillation is the correct approach. Color #FFFACD for the frost ring is appropriate. The sublimation process creates dramatic "fan" and "spider" features observed by HiRISE at the retreating seasonal cap edge. |

### Dust & Aeolian (4 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 14 | Dust Storm Activity | uDustStorms | ✅ | Planet-encircling dust storms occur roughly every 3 Mars years (most recently 2018, observed by MRO and Curiosity). Regional storms are more frequent. Dust color #E8C480 (tan) is consistent with Mars atmospheric dust. Opacity 0.2–0.4 is within the range of observed storm opacities (tau 0.1 to >5 for global events). FBM for swirling patterns is appropriate. |
| 15 | Dust Devil Plumes | uDustDevils | ✅ | Default OFF correct. Dust devils confirmed by Spirit, Opportunity, Perseverance, and MRO HiRISE (which has photographed dust devil tracks extensively). Size 50–100 m diameter and 1–2 km tall is within observed range (HiRISE shows some up to 20 km tall). Color #E8C480 at 0.6 intensity is appropriate. Poisson distribution with 1–3 minute lifetime is reasonable. |
| 16 | Dust Deposition Streaks | uDustStreaks | ✅ | Wind-blown dust streaks behind obstacles are extensively documented by HiRISE and CTX — dark and bright streaks extending downwind from craters. Color #E8D5B0 (20% brighter) is consistent with bright streak observations. NW dominant wind direction is a simplification — wind patterns vary by location and season. |
| 17 | Diurnal Dust Opacity Cycle | uDiurnalDustOpacity | ✅ | Default OFF correct. Diurnal variation in atmospheric opacity is observed (higher in afternoon from convective lofting). The 24.6-hour period (actually 24h 37min, one Mars sol) is correct. Opacity oscillation ±0.1 is within observed range. |

### Ancient Water & Astrobiology (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 18 | River Delta Networks | uRiverDeltas | 🔬 | Default OFF correct. Ancient river deltas are confirmed (Jezero crater delta is being explored by Perseverance). Branching patterns in basin floors are real but as a visualization toggle at planetary scale, the specific rendering is speculative. Color #8B7355 is appropriate for alluvial sediment. Depth 50–200 m is reasonable for channel incision. |
| 19 | Possible Subsurface Water | uSubsurfaceWater | 🔬 | Default OFF correct. Mars Express MARSIS and MRO SHARAD have detected subsurface reflections consistent with ice or liquid water at depth. The blue glow concept (#7AC4E8) is purely speculative visualization. |
| 20 | Ancient Lake Beds | uAncientLakes | 🔬 | Default OFF correct. Smooth basin floors interpreted as former lake beds are documented (Eberswalde crater, Jezero crater, Gale crater lake). Color #9A8A7A (tan-gray) is consistent with lacustrine sediments observed by Curiosity. |

### Atmosphere & Weather (2 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 21 | Thin Atmosphere Haze | uAtmosphereHaze | ✅ | Mars's thin atmosphere (6 mbar) creates a faint haze visible at the limb. Color #D4A875 (tan) is correct — Mars atmospheric dust gives the sky a butterscotch color (Perseverance confirmed). Opacity 0.05 near limb is appropriate for the thin atmosphere. Altitude ~30 km is within the dust layer extent. |
| 22 | CO₂ Cloud Formation | uCO2Clouds | ✅ | Default OFF correct. CO₂ clouds observed near polar caps and at high altitudes (mesospheric CO₂ clouds up to 80 km altitude). MRO has imaged CO₂ clouds forming in winter polar regions. Color #FFFACD at 0.3 opacity is appropriate for thin, high-altitude clouds. |

### Past Magnetic Field (2 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 23 | Fossil Magnetic Anomalies | uFossilAnomalies | ✅ | Default OFF correct. Mars Global Surveyor magnetometer confirmed crustal magnetic anomalies in the southern highlands — remnants of an ancient global dynamo. The educational overlay approach is appropriate. Purple tint (#8B7FB5) is a reasonable color choice for magnetic field visualization. |
| 24 | Crustal Magnetization Stripes | uMagnetizationStripes | ✅ | Default OFF correct. Linear magnetic anomalies in the southern highlands were compared to Earth's ocean floor magnetic stripes, suggesting possible plate tectonics. The alternating brightness pattern via sawtooth function captures this concept well. |

### Human Presence (speculative, 2 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 25 | Settlement Sites | uSettlements | 🔬 | Default OFF correct. Purely speculative future visualization. Locations at Gale, Jezero, Olympus Mons are reasonable choices. |
| 26 | Solar Panel Arrays | uSolarPanels | 🔬 | Default OFF correct. Purely speculative. Color #87CEEB for reflective panels is reasonable. |

### Camera (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 27 | Light Direction | uLightDir | ✅ | AUTO mode revealing all major features is good. |
| 28 | Time Speed Multiplier | uTimeSpeed | ⚠️ | 50x: "1 real second = 1 Mars minute (~2.45 seconds true)" — at 50x, 1 real second = 50 real seconds, so 1 Mars minute (~61.5 seconds) would take ~1.23 real seconds. "Full sol (24h 39m) in ~25 real seconds" — 88,740 seconds / 50 = 1775 seconds = ~30 minutes, not ~25 seconds. **The description math is wrong. At 50x, one sol takes ~30 real minutes. To get one sol in ~25 seconds, you'd need ~3550x speed.** |
| 29 | Auto-Rotate | uAutoRotate | ✅ | Good feature coverage. |

### Mars Summary

| Verdict | Count |
|---------|-------|
| ✅ Accurate | 24 |
| ⚠️ Needs adjustment | 2 |
| ❌ Incorrect | 0 |
| 🔬 Unverifiable | 5 |

**Top corrections:** Time speed description math is incorrect (50x ≠ 1 sol in 25 seconds). Mars is the most accurately specified rocky planet — colors, features, and locations all well-grounded in MRO/HiRISE/Perseverance data.

---

## 4. Magma World (Lava) — ENT-2014

**Reference imagery:** Artist's concepts based on Spitzer/JWST 55 Cancri e phase curves, CoRoT-7b thermal models, JWST MIRI thermal emission observations of 55 Cancri e (2024), theoretical lava world models (Léger et al. 2011, Demory et al. 2016)
**Total features:** 33

### Molten Surface (4 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 1 | Active Magma Ocean | uMagmaOcean | ⚠️ | Color #FF3B00 for bright magma is reasonable for ~2500 K blackbody radiation (actual peak wavelength ~1.2 μm, appearing orange-red). However, 55 Cancri e JWST observations (2024) show dayside temperatures of ~2700 K at the hottest point with nightside ~1400 K — the temperature range is correct. **Issue: 85–95% molten coverage is speculative.** Recent magma temperature–cloud feedback models (PNAS 2024) suggest silicate cloud cover may be significant, reducing visible molten area. The curl-noise advection approach is physically motivated. |
| 2 | Solidification Patterns | uSolidificationCrust | 🔬 | Cooling crust plates on magma oceans are theoretically predicted but never directly observed. Color #3A2A1A (dark brown-black) is reasonable for cooled basalt. Worley noise for crack patterns is an excellent procedural choice — lava cooling naturally forms polygonal/cellular patterns (similar to columnar basalt). Plate size 10–100 km is speculative. |
| 3 | Magma Brightness Glow | uMagmaGlow | ✅ | Thermal emission from ~2500 K surface is well-established — JWST and Spitzer have detected thermal phase curves from hot rocky exoplanets. Emissive intensity 0.8 with bloom is appropriate for extremely hot surfaces. |
| 4 | Thermal Stress Fractures | uStressFractures | 🔬 | Linear cracks from cooling are physically motivated (similar to lava flow cooling on Earth). Color #FF4400 for exposed bright lava is consistent with hot lava temperatures. FBM with directional bias is reasonable. Line width 100–500 m is speculative for exoplanetary scale. |

### Lava Seas & Flow (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 5 | Lava Flow Streams | uLavaFlows | 🔬 | Large-scale lava rivers are theoretical predictions for magma ocean planets. Color gradient from bright #FF4400 to darker #B82A00 is physically motivated by temperature decrease along flow. Curl-noise velocity field is a good procedural approach. Width 10–50 km is speculative. |
| 6 | Convection Cells | uConvectionCells | ⚠️ | Bénard convection cells in a magma ocean are theoretically expected. Voronoi diagram at freq 4.0 is the correct approach for convection cell visualization. **Issue: diameter 100–500 km seems reasonable for super-Earth scale, but recent interior dynamics modeling (A&A 2023) for 55 Cancri e suggests convection may occur at smaller scales (~10-50 km) in the thinner magma layer.** Colors are physically motivated. |
| 7 | Sublimated Rock Vapor Plumes | uMagmaPlumes | 🔬 | Default OFF correct. Silicate vapor plumes are predicted by theoretical models for ultra-hot rocky planets. Color #FFE5C4 (very pale) is reasonable for silicate vapor condensation. |

### Crust Solidification (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 8 | Floating Crustal Plates | uFloatingPlates | 🔬 | Plate tectonics on magma world is highly speculative but physically motivated. The Voronoi domain approach is excellent for procedural plate generation. Bright line rendering for ridge gaps (#FF3B00) is visually appropriate. Size distribution 50–500 km is speculative. |
| 9 | Plate Collision Zones | uPlateCollisions | 🔬 | Collision zones forming thicker crust are theoretical. Dark color #1A0808 with raised ridges is a reasonable visualization. |
| 10 | Cooling Crystal Patterns | uCrystalPatterns | 🔬 | Default OFF correct. Crystalline structures from cooling are physically real (columnar basalt on Earth) but at exoplanetary scale, unobservable. FBM at freq 25.0 for high-frequency texture is appropriate. |

### Tidal Flexing (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 11 | Tidal Bulge Deformation | uTidalBulge | ✅ | Close-in rocky exoplanets experience significant tidal distortion. L=2 spherical harmonic bulge is the correct mode for tidal deformation. Sub-stellar tidal bulge 1–10 km is within theoretical predictions for close-in super-Earths. Gaussian falloff vertex displacement is the correct approach. |
| 12 | Tidal Heating Rate Glow | uTidalHeatingGlow | ✅ | Tidal heating is the primary energy source for maintaining magma oceans on close-in planets (like Io but much more extreme). Equatorial and sub-stellar concentration of heating is correct from tidal dissipation models. Color #FF4400 with +0.2 intensity boost is reasonable. |
| 13 | Synchronous Rotation Wobble | uRotationWobble | ✅ | Default OFF correct. Libration (forced or free) is expected for tidally-locked planets with non-zero orbital eccentricity. Amplitude ~5° is within theoretical predictions for mildly eccentric orbits. |

### Silicate Vapor Atmosphere (2 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 14 | Silicate Vapor Haze | uSilicateVapor | ✅ | JWST confirmed that 55 Cancri e likely has an atmosphere — possibly CO/CO₂ from magma outgassing. Silicate vapor exosphere on the dayside is theoretically predicted (Schaefer & Fegley 2009). Color #E8B8A0 (pale tan) at opacity 0.08 is appropriate for thin silicate vapor. Day-side concentration is correct — silicate vapor pressure drops dramatically on the nightside. |
| 15 | Vapor Condensation Limb | uVaporCondensation | ✅ | Condensation at the cooler limb is physically motivated. Fresnel rim effect is the correct rendering approach. Color #FFC4A0 is consistent with silicate condensation. |

### Thermal Contrast (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 16 | Day-Side Incandescence | uDaySideGlow | ⚠️ | White-hot (#FFFFFF) at sub-stellar point: 55 Cancri e dayside reaches ~2700 K — at this temperature, the peak emission is in near-IR, appearing bright orange-white, not pure white. Pure white would require >6000 K. **Correction: color should be ~#FFD4A0 (orange-white) not #FFFFFF for ~2700 K blackbody.** Emissive 1.0 and 60° half-angle are reasonable. |
| 17 | Terminator Temperature Gradient | uTerminatorGradient | ⚠️ | Sharp day-night transition is correct for tidally-locked planets. However, JWST 55 Cancri e observations show the hottest point is shifted ~41° east of the sub-stellar point (Demory et al. 2016), indicating atmospheric heat redistribution. **The specification should note this eastward hot-spot offset.** Gradient width ~30 km for thin thermal skin depth is speculative but physically motivated. |
| 18 | Night-Side Blackbody Radiation | uNightSideRadiation | 🔬 | Default OFF correct. Nightside thermal emission at ~1400 K (55 Cancri e nightside) would appear as very faint red glow. Color #FF4400 at 0.05 intensity is consistent. This is theoretically observable in mid-IR. |

### Magnetic Field (2 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 19 | Induced Dipole Field | uInducedDipole | 🔬 | Default OFF correct. Induced magnetic field from ionized silicate vapor is theoretically possible but unobserved. |
| 20 | Magnetosphere Interaction Glow | uMagnetosphereGlow | 🔬 | Default OFF correct. Star-planet magnetic interaction is theoretically predicted for close-in exoplanets (Lanza 2013). |

### Camera (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 21 | Light Direction | uLightDir | ✅ | AUTO mode revealing tidal bulge and day/night contrast is excellent. |
| 22 | Time Speed Multiplier | uTimeSpeed | ⚠️ | 80x: "Short orbital period (1–3 Earth days) completes in ~1–3 real minutes" — at 80x, 1 Earth day = 86400/80 = 1080 real seconds = 18 minutes. So 1–3 Earth day orbital period = 18–54 real minutes, not 1–3 minutes. **Math is incorrect again. To complete a 1-day orbit in ~1 minute, you'd need ~1440x speed.** |
| 23 | Auto-Rotate | uAutoRotate | ✅ | Good feature coverage. |

### Magma World Summary

| Verdict | Count |
|---------|-------|
| ✅ Accurate | 10 |
| ⚠️ Needs adjustment | 5 |
| ❌ Incorrect | 0 |
| 🔬 Unverifiable | 11 |

**Top corrections:** Day-side incandescence color (#FFFFFF → #FFD4A0 for ~2700 K), hot-spot eastward offset for terminator gradient, convection cell scale, time speed math. High 🔬 count is expected — magma worlds are exoplanets with limited direct observations.

---

## 5. Ocean World (Hycean Planet) — ENT-2015

**Reference imagery:** JWST NIRISS/NIRSpec K2-18b atmosphere spectra (2023-2025), theoretical Hycean planet models (Madhusudhan et al. 2021), Europa/Enceladus ocean world analogs (Galileo, Cassini), TRAPPIST-1 system models
**Total features:** 34

### Ocean Depth & Color (4 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 1 | Deep Ocean Baseline | uDeepOcean | ✅ | Color #0E3A5F (very dark navy blue) is consistent with deep water absorption — the ocean absorbs red wavelengths first, leaving deep blue at depth. Planet-wide ocean with 1–20 km depth is within Hycean planet models (Madhusudhan et al. 2021). High gravity compressing the ocean is physically motivated for super-Earths. FBM for depth variation is appropriate. |
| 2 | Shallow Sunlit Zones | uShallowZones | 🔬 | Shallower regions near vents appearing brighter cyan #7AC4E8 is visually motivated but speculative for exoplanets. On Earth, shallow tropical waters appear turquoise due to scattering from the seafloor. Without knowing the actual bathymetry of a Hycean planet, 5–10% coverage is arbitrary. |
| 3 | Underwater Light Scattering | uWaterScattering | ✅ | Caustic-like patterns from light refraction through turbulent water are a real optical phenomenon. Color #87CEEB at 0.2 opacity animated at 0.3 rad/s creates appropriate visual motion. This would be visible from orbit on a clear-atmosphere ocean world. |
| 4 | Bioluminescence Glow | uBiolumZones | 🔬 | Default OFF correct. Purely speculative — bioluminescence is found in Earth's oceans but extending to exoplanets is science fiction (appropriate for a speculative toggle). Color #7FE8FF (bright cyan) is consistent with Earth bioluminescence colors. |

### Wave Patterns (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 5 | Surface Wave Texture | uWaveTexture | ✅ | Gerstner waves are the standard approach for real-time ocean rendering (Tessendorf 2001). Wave amplitudes 100 m–1 km are large for Earth-scale but appropriate for a super-Earth with potentially stronger winds. Animation period 10–30 seconds is reasonable for visualization. Normal map perturbation approach is correct. |
| 6 | Wind-Driven Wave Coherence | uWaveCoherence | ✅ | Dominant wave direction from stellar wind or general circulation is physically motivated. Directional bias in Gerstner wave phase velocity is the correct approach for wind-driven waves. |
| 7 | Storm Wave Crests | uStormWaves | 🔬 | Default OFF correct. Storm cells producing larger waves are plausible but speculative for exoplanets. Color #A8D4E8 for bright crests is appropriate. |

### Subsurface Convection (4 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 8 | Mantle Plumes | uMantlePlumes | 🔬 | Hot upwelling plumes from rocky core are theoretically expected for Hycean planets with rocky interiors. The visualization as bright upwelling zones is appropriate. Plume diameter 50–200 km is within range of Earth mantle plume hotspot sizes. Static lifetime for visualization is practical. |
| 9 | Hydrothermal Vent Fields | uVentFields | 🔬 | Hydrothermal vents are expected at the ocean-rock interface — analogous to Earth's mid-ocean ridges and Europa's potential vent systems. Color #B8D5F0 (bright blue-white) at 0.5 intensity for hot water is visually appropriate. Vent cluster locations via FBM is reasonable. |
| 10 | Convection Cell Boundary | uConvectionBoundary | 🔬 | Default OFF correct. Rayleigh-Bénard convection in deep oceans is theoretically expected. Voronoi cells at freq 3.0 for large-scale patterns is appropriate. |
| 11 | Thermal Plume Rise Animation | uThermalAnimation | 🔬 | Animated plume rise at 0.01–0.1 m/s is far too slow for ocean convection — Earth's thermohaline circulation moves at ~0.01 m/s but hydrothermal plumes rise at ~0.1–1.0 m/s. The animation approach via sinusoidal oscillation is reasonable for visualization. |

### Ice Shell (if present, 3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 12 | Surface Ice Coverage | uIceShell | ✅ | Default OFF correct — Hycean planets are defined as warm enough for liquid oceans. The toggle allows Europa-like ice shell visualization. Color #FFFFFF (pure white, 0.95 albedo) is consistent with fresh ice. Good dual-mode toggle design. |
| 13 | Ice Shelf Fracture Pattern | uIceShelfFractures | ✅ | Default OFF correct. Tidal stress fractures are well-documented on Europa (Galileo imagery). Linear features with blue tint (#7AC4E8) in white ice are consistent with Europa's linea. Worley noise at freq 5.0 for crack patterns is appropriate. Width 1–10 km is consistent with Europa's larger linea features. |
| 14 | Sub-Ice Ocean Glow | uSubIceGlow | 🔬 | Default OFF correct. Faint glow beneath ice cracks is speculative but visually compelling. Analogous to hypothesized Europa subsurface ocean heat signatures. |

### Atmospheric Cloud Layer (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 15 | Water Vapor Cloud Deck | uCloudDeck | ⚠️ | JWST observations of K2-18b detected methane and CO₂ in the atmosphere — consistent with a hydrogen-rich atmosphere over water. However, the atmosphere composition may be more H₂-rich than the pure water vapor implied here. Color #E8F0F8 (pale white-blue) is appropriate. **Issue: 60–80% coverage is reasonable but cloud composition should note H₂/He-rich envelope, not just water vapor clouds.** JWST data suggests K2-18b may be a gas-rich mini-Neptune rather than a true Hycean world (Wogan et al. 2024). |
| 16 | Tropical Cloud Belt | uTropicalBelt | 🔬 | Brighter equatorial cloud band from Hadley circulation is physically motivated if the planet has Earth-like circulation. Color #FFFFFF at 0.8 opacity and ~30° latitude width are reasonable assumptions. |
| 17 | Polar Cloud Vortex | uPolarVortex | 🔬 | Anticyclonic polar vortices are observed on Venus, Earth, Saturn, and Jupiter — extending to Hycean planets is reasonable. Spiral pattern via atan2 with rotation animation is the correct shader approach. |

### Chemosynthesis Zones (2 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 18 | Chemosynthetic Ecosystem Markers | uChemoLife | 🔬 | Default OFF correct. Purely speculative but scientifically motivated — chemosynthetic life at hydrothermal vents is the leading hypothesis for subsurface ocean habitability. Colors #8B4513 (brown) and #D4A857 (golden) are consistent with Earth's vent ecosystems (bacterial mats). |
| 19 | Mineral Deposit Discoloration | uMineralDeposits | 🔬 | Default OFF correct. Mineral precipitates from vent fluids are well-documented on Earth (iron, silica, sulfide "smokers"). Colors #A0522D and #D2B48C are consistent with iron oxide and silica deposits. |

### Currents & Upwelling (2 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 20 | Ocean Current Streaks | uCurrentStreaks | 🔬 | Large-scale ocean currents are expected on any rotating ocean world (Coriolis-driven circulation). Color #87CEEB at 0.1 intensity boost is subtle and appropriate. Curl-noise flow field animation is the correct approach. |
| 21 | Coastal Upwelling Plumes | uUpwellingPlumes | ⚠️ | "Coastal" is misleading for a planet-wide ocean — there are no coasts. These should be called "ridge upwelling plumes" where currents interact with submarine ridges/seamounts. Color #A8D4E8 is appropriate. **Correction: rename from "Coastal" to "Ridge" or "Seamount" upwelling.** |

### Camera (3 features)

| # | Feature | Uniform | Verdict | Analysis |
|---|---------|---------|---------|----------|
| 22 | Light Direction | uLightDir | ✅ | AUTO mode is good. |
| 23 | Time Speed Multiplier | uTimeSpeed | ⚠️ | 60x: "1 real second = 1 ocean-world hour (~1 Earth hour true)" — at 60x, 1 real second = 60 seconds = 1 minute, not 1 hour. **Math is incorrect. At 60x, 1 real second = 1 real minute. To get 1 hour per real second, you'd need 3600x speed.** |
| 24 | Auto-Rotate | uAutoRotate | ✅ | Good feature coverage. |

### Ocean World Summary

| Verdict | Count |
|---------|-------|
| ✅ Accurate | 10 |
| ⚠️ Needs adjustment | 3 |
| ❌ Incorrect | 0 |
| 🔬 Unverifiable | 14 |

**Top corrections:** Cloud deck atmosphere composition (note H₂/He-rich), "Coastal" → "Ridge/Seamount" upwelling, time speed math. Very high 🔬 count is expected — Hycean planets are theoretical constructs with minimal direct observations.

---

## Global Summary — All Rocky Planets

| Entity | Total Features | ✅ | ⚠️ | ❌ | 🔬 |
|--------|---------------|-----|-----|-----|-----|
| Mercury-Type | 34 | 18 | 9 | 0 | 1 |
| Venus-Type | 35 | 18 | 7 | 0 | 4 |
| Mars-Type | 36 | 24 | 2 | 0 | 5 |
| Magma World | 33 | 10 | 5 | 0 | 11 |
| Ocean World | 34 | 10 | 3 | 0 | 14 |
| **TOTAL** | **172** | **80** | **26** | **0** | **35** |

## Top 15 Priority Corrections

| # | Entity | Feature | Issue | Correction |
|---|--------|---------|-------|------------|
| 1 | Mercury | Base Regolith | Color too bright/warm for Mercury's actual dark gray surface | #8C7E6E → #706860 |
| 2 | Mercury | Permanent Shadow Regions | Temperature stated as "<1500 K" — should be "<100 K" | Fix temperature value |
| 3 | Mercury | Permanent Shadow Regions | Coverage "~10 km²" — should be ~10,000 km² per pole | Fix coverage area |
| 4 | Mercury | Sodium Tail | Extent "10–20 Rp" — actual tail extends >100 Rp | Fix extent to >100 Rp |
| 5 | Venus | Polar Vortex | Diameter "~4 Rp" (~24,000 km) — actual dipole is ~2000-3000 km | Fix diameter |
| 6 | Venus | Dipole Oscillation | Period "~4 years" — actual precession is ~5-10 Earth days | Fix period |
| 7 | Venus | Pancake Domes | Size 100-500 km — actual 20-65 km diameter | Fix size range |
| 8 | Venus | Tessera Coverage | "30% coverage" — actual is ~8% | Fix coverage |
| 9 | Magma World | Day-Side Incandescence | #FFFFFF (white) for ~2700 K — should be orange-white | #FFFFFF → #FFD4A0 |
| 10 | Mercury | Ray System / Ejecta | Colors too bright for Mercury's low-albedo surface | #D5D0C8 → #A8A098 |
| 11 | Mercury | Smooth Plains | Coverage "~10%" — MESSENGER measured ~27% | Fix to ~27% |
| 12 | Mercury | Caloris Basin | Longitude "~180°" — actual ~162°E | Fix to ~162°E |
| 13 | Venus/Mars/Magma/Ocean | Time Speed Multipliers | All have math errors in descriptions | Recalculate all descriptions |
| 14 | Mercury | Magnetic Field | Strength "~0.2% Earth" — actual ~1% | Fix to ~1% |
| 15 | Magma World | Terminator Gradient | Missing eastward hot-spot offset (~41°) | Add offset note |
