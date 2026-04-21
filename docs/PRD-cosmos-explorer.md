# PRODUCT REQUIREMENTS DOCUMENT
# Cosmos Explorer v2.0
## Interactive 3D Universe Visualization Platform

**Document Version:** 2.0  
**Last Updated:** 2026-04-16  
**Status:** Final  
**Confidentiality:** Public / Open Source

---

## 1. DOCUMENT CONTROL

### 1.1 Version History

| Version | Date | Author | Changes | Status |
|---------|------|--------|---------|--------|
| 0.1 | 2026-02-01 | Product Team | Initial draft | Draft |
| 0.5 | 2026-02-15 | Product Team | First stakeholder review | Review |
| 0.8 | 2026-03-01 | Product Team | Data integration specs added | Review |
| 1.0 | 2026-04-16 | Product Team | Final release candidate | Approved |

### 1.2 Approval Signatures

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Manager | [TBD] | 2026-04-16 | \_\_\_\_\_\_\_\_\_\_\_ |
| Engineering Lead | [TBD] | 2026-04-16 | \_\_\_\_\_\_\_\_\_\_\_ |
| Design Lead | [TBD] | 2026-04-16 | \_\_\_\_\_\_\_\_\_\_\_ |
| Science Advisor | [TBD] | 2026-04-16 | \_\_\_\_\_\_\_\_\_\_\_ |

### 1.3 Distribution List

- Product Management Team
- Engineering Team (Frontend, Backend, DevOps)
- Design Team
- Science Advisory Board
- Marketing & Education Teams
- Open Source Community (upon release)

### 1.4 Document Purpose

This PRD defines the complete product specification for Cosmos Explorer, a browser-based 3D interactive visualization of the observable universe. It serves as the authoritative reference for all product decisions, development priorities, acceptance criteria, and success metrics throughout MVP through v2.0 release cycles.

### 1.5 Scope Statement

Cosmos Explorer enables users to interactively explore the universe from the Solar System to the observable universe boundary using real astronomical data (Gaia DR3, JPL Horizons, SDSS, IllustrisTNG) rendered in a browser without plugins or logins. The product supports professional/educational use, mass-market public engagement, and serves as a platform for future astronomy education tools.

**Entity Catalog Scope:** Cosmos Explorer shall support the complete catalog of 96 distinct entity types as defined in Doc 22 — Interactive Toggle Features v4.2, spanning Stars (16), Rocky Planets (7), Gas Giants (9), Moons (6), Small Bodies (11), Nebulae (6), Galaxies (17), Large-Scale Structure (7), and Exotic Objects (17).

### 1.6 Glossary of Terms & Acronyms

| Term | Definition |
|------|----------|
| **AU** | Astronomical Unit (149.6 million km, Earth-Sun distance) |
| **Magnitude** | Measure of star brightness; lower = brighter. Apparent magnitude from Earth; absolute magnitude standardized to 10 pc distance |
| **Spectral Type** | Classification of stars by temperature/color (O, B, A, F, G, K, M from hottest to coolest) |
| **Redshift (z)** | Measure of cosmic expansion; (wavelength_observed - wavelength_rest) / wavelength_rest. Higher z = farther distance |
| **Parsec (pc)** | Distance at which 1 AU subtends 1 arcsecond; 3.26 light-years |
| **Light-year (ly)** | Distance light travels in one year; 9.46 trillion km |
| **Gaia DR3** | ESA Gaia satellite Data Release 3; 1.8 billion stars with positions, magnitudes, colors, proper motions, parallaxes |
| **Hipparcos** | ESA satellite catalog; 118,218 bright stars with high-precision astrometry (obsolete but historical value) |
| **JPL Horizons** | NASA solar system ephemeris system; positions/velocities of planets, moons, asteroids, comets |
| **SDSS DR18** | Sloan Digital Sky Survey Data Release 18; ~1 million galaxies with photometry, redshifts, spectra |
| **IllustrisTNG** | Simulation suite of universe structure formation; cosmic web, filaments, voids |
| **Keplerian Orbit** | Elliptical orbit defined by 6 orbital elements (semi-major axis, eccentricity, inclination, longitude of ascending node, argument of periapsis, mean anomaly) |
| **LOD (Level of Detail)** | Rendering technique using progressively lower-resolution models at distance; reduces draw calls |
| **Bloom Effect** | Post-process shader brightening bright pixels; simulates lens bloom or human eye response to bright objects |
| **Lensing Distortion** | Post-process shader simulating gravitational lensing or chromatic aberration |
| **Point Sprite** | GPU-accelerated 2D texture rendering at point primitive location; efficient for distant stars |
| **Billboard** | Flat 2D quad always facing camera; common for nebulae, distant galaxies |
| **Volumetric Rendering** | Ray-marching through 3D density field to render atmosphere/corona effects |
| **Procedural Generation** | Algorithm-driven creation of content (e.g., Web Audio API procedural music) rather than pre-recorded |
| **Cosmic Web** | Large-scale structure of universe: filaments (high density), sheets (medium density), voids (low density) |
| **CMB (Cosmic Microwave Background)** | Radiation left over from Big Bang; maps universe at redshift z ≈ 1100 (~380,000 years after Big Bang) |
| **Observable Universe** | Sphere of radius 46.5 billion light-years (comoving distance) centered on Earth; edge of universe we can observe |
| **Comoving Distance** | Distance accounting for universe expansion; differs from light-travel distance |
| **Hubble Law** | v = H₀ × d; recession velocity proportional to distance (H₀ ≈ 67.4 km/s/Mpc) |
| **Lagrange Point** | Point in 2-body system where gravitational forces balance; L1, L2, L3, L4, L5 |
| **Orbital Elements** | Parameters defining orbit: a (semi-major axis), e (eccentricity), i (inclination), Ω (longitude ascending node), ω (argument periapsis), M (mean anomaly) |
| **Proper Motion** | Star's angular motion across sky (perpendicular to line of sight); measured in arcseconds/year |
| **Extinction** | Dimming of starlight by dust; reddening of light (Milky Way dust lane) |
| **Exoplanet** | Planet orbiting star other than Sun; 5,500+ confirmed as of 2026 |
| **Variable Star** | Star whose apparent brightness changes with time; Cepheids (period-luminosity relation), RR Lyrae (globular clusters) |
| **Globular Cluster** | Dense spherical cluster of 100,000-1 million old stars; satellite of galaxy |
| **Open Cluster** | Loose cluster of 100-10,000 young stars; embedded in galaxy disk |
| **Emission Nebula** | Gas cloud emitting light from internal energy source (star formation) or external UV source |
| **Planetary Nebula** | Expanding shell of glowing gas ejected by dying star; not related to planets |
| **Supernova Remnant** | Expanding debris cloud from stellar explosion |
| **Active Galactic Nucleus (AGN)** | Galaxy with central supermassive black hole accreting material; jets visible at radio/X-ray wavelengths |
| **Quasar** | Quasi-stellar radio source; distant AGN appearing star-like; high redshift, extreme luminosity |
| **Seyfert Galaxy** | Galaxy with actively accreting supermassive black hole; Seyfert 1 & 2 differ by dust obscuration |
| **Blazar** | AGN with relativistic jet pointed toward Earth; extreme variability, high-energy emission |
| **Laniakea Supercluster** | Local supercluster containing Milky Way; "immense heaven" in Hawaiian; 100,000 galaxies |
| **Virgo Supercluster** | Ancient term; now understood as part of larger Laniakea structure |
| **Abell Catalog** | Catalog of galaxy clusters; 4,073 Abell clusters (Abell 1656 = Coma Cluster) |
| **NGC/IC Catalog** | New General Catalog / Index Catalog; 13,226 deep-sky objects (galaxies, nebulae, clusters) |
| **WebGL 2.0** | Browser 3D graphics API based on OpenGL ES 3.0; supported in Chrome, Firefox, Safari 16+, Edge |
| **Three.js** | JavaScript 3D library abstracting WebGL; reduces code complexity, cross-browser compatibility |
| **React 18+** | JavaScript UI library; component-based, hooks, concurrent rendering |
| **TypeScript 5+** | Typed superset of JavaScript; static type checking, better IDE support, refactoring safety |
| **Vertex Shader** | GPU program processing each vertex (position transformation, lighting setup) |
| **Fragment Shader** | GPU program computing color for each pixel (texture sampling, lighting, effects) |
| **Shader Program** | Compiled vertex + fragment shaders executing on GPU |
| **Draw Call** | Command to GPU to render primitives (points, lines, triangles); overhead limits performance |
| **Instancing** | GPU technique rendering multiple copies of same geometry with different parameters in single draw call |
| **Batching** | Combining multiple geometries into single mesh to reduce draw calls |
| **WCAG 2.1** | Web Content Accessibility Guidelines 2.1; AA level = good accessibility; AAA = highest |
| **CSP (Content Security Policy)** | HTTP header restricting resource loading; prevents XSS, clickjacking attacks |
| **HTTPS** | HTTP with TLS encryption; protects data in transit, required for Web Audio, Geolocation APIs |
| **MoSCoW** | Prioritization method: Must, Should, Could, Won't have (this release vs. future) |
| **OKR** | Objectives & Key Results; goal-setting framework (qualitative objective, quantitative key results) |
| **KPI** | Key Performance Indicator; measurable metric tracking business/product health |
| **MAU / DAU** | Monthly/Daily Active Users; standard engagement metrics |
| **TTI (Time to Interactive)** | How long before page responds to user interaction; Core Web Vital threshold < 2.5s |
| **FCP (First Contentful Paint)** | How long before first content appears; Core Web Vital threshold < 1.5s |
| **FPS** | Frames Per Second; 60 FPS smooth, 30 FPS playable, <20 FPS sluggish |
| **p50 / p95** | 50th/95th percentile; median & tail performance; p95 captures slow cases |
| **MRR / LTV / Churn** | Monthly Recurring Revenue, Lifetime Value, churn rate; SaaS metrics (Phase 2) |

---

## 2. PRODUCT OVERVIEW

### 2.1 Product Vision

Cosmos Explorer democratizes access to the universe by enabling anyone with a browser to interactively explore real astronomical data across 13 orders of magnitude—from Earth to the cosmic horizon—with the visual fidelity and scientific accuracy of planetaria combined with the interactivity and accessibility of consumer software. We envision a future where astronomy education, public engagement, and professional research converge in a single, freely available platform built collaboratively with the open-source community.

### 2.2 Positioning Statement

For **students, educators, and space enthusiasts** who **want to understand the structure and scale of the universe**, **Cosmos Explorer** is a **browser-based 3D visualization platform** that **enables interactive navigation across all scales from planets to galaxy clusters with real astronomical data**. Unlike **Planetarium software (Stellarium, Space Engine)** which require desktop installation and focus on sky observation, or **casual web experiences (Universe Sandbox, SkySafari)** which lack scientific depth, **Cosmos Explorer combines professional-grade data accuracy, browser accessibility, and open-source transparency in a unified experience**.

### 2.3 Target Users & Personas

| Persona | Role | Key Need | Segment |
|---------|------|----------|---------|
| **Dr. Sarah Chen** | Astronomy Educator (College) | Interactive tool for lectures, student visualization assignments | Education (35%) |
| **Alex Torres** | High School Student | Understand scale, explore curiosity about universe, study for exams | Education / Youth (25%) |
| **Marcus Johnson** | Amateur Astronomer | Plan observations, identify objects, learn constellations | Consumer (15%) |
| **Dr. Elena Volkov** | Computational Astrophysicist | Verify simulations (IllustrisTNG), explore cosmic web structure | Professional/Research (10%) |
| **Jamie Lee** | Museum/Planetarium Director | Supplement exhibits, create immersive experiences, educational content | Institution (10%) |
| **Global Casual User** | Web Visitor (All Ages) | Sense of wonder, share with friends, "click and explore" | Consumer/Engagement (5%) |

### 2.4 Key Value Propositions

1. **Accessibility Without Compromise**: No software installation, no account creation, no plugins. Professional astronomical data in the browser.

2. **Scientific Accuracy at Scale**: 1.8B stars (Gaia DR3), real orbital mechanics (JPL Horizons), galaxy distributions (SDSS), cosmic structure (IllustrisTNG)—not artistic approximations.

3. **Seamless Multi-Scale Exploration**: Travel from Earth to observable universe boundary (46.5 billion light-years) with no loading screens, maintaining context and orientation.

4. **Guided Discovery**: Curated tours with narration, educator mode, interactive quizzes transform exploration into learning.

5. **Open & Extensible**: MIT-licensed code, published data pipeline, plugin API (v2.0) enable community contributions and integration with research workflows.

### 2.5 Product Principles

1. **Scientific Integrity First**: Every visualization rooted in published astronomical data; when rendering choices require approximation, document and explain.

2. **Elegance Through Simplicity**: Minimal, uncluttered UI; let the universe be the interface. Complexity surfaces on demand.

3. **Progressive Revelation**: Novice users see Solar System; educators unlock lesson plans; researchers access advanced filtering.

4. **Performance is a Feature**: 60 FPS on mid-range hardware; better to show 10K accurately rendered stars than lag with millions.

5. **Open Collaboration**: Core code, data pipeline, research partnerships are public. Community contributions shape roadmap.

6. **Accessibility by Default**: WCAG AA compliance, keyboard navigation, screen reader support, color-blindness modes built in—not retrofitted.

7. **Immersive Wonder**: Technical excellence exists to serve awe. Design every feature to evoke curiosity.

8. **Mobile-First Adaptability**: Touch controls, responsive UI scale without feature loss; 30 FPS acceptable on mobile; tap-to-explore as natural as scroll.

### 2.6 Assumptions

1. WebGL 2.0 support available in 95%+ of target browsers by v1.0 release.
2. Users have >4 Mbps connection for initial 50MB data load; subsequent sessions cached locally.
3. Gaia DR3, JPL Horizons, SDSS, IllustrisTNG datasets remain publicly accessible and stable.
4. Three.js and React ecosystems continue active maintenance and GPU optimization.
5. Audio Web API (spatial panner, oscillators) functions reliably across Safari, Chrome, Firefox, Edge.
6. Educational market will adopt tool if lesson plans + educator mode provided within 6 months of v1.0.
7. Open-source release will attract 100+ community contributors within 12 months based on similar projects.
8. Users tolerate 2-50MB initial load for seamless exploration benefit vs. smaller-load/frequent-reload alternatives.
9. Tablet/touch-screen usage will reach 30% of MAU by Year 2.
10. Professional researchers (astrophysicists) will use tool for data exploration, simulation verification, publication prep.

### 2.7 Constraints

1. **Browser-Only Execution**: No server-side 3D rendering; all processing on client (WebGL 2.0 GPU).
2. **Bundle Size Cap**: Core application code (excluding data) must be <2MB gzipped.
3. **No Authentication System**: Free/public by design; no user accounts, logins, or persistent identity (v1.0-v1.1).
4. **Offline Capability**: Initial load downloads data; app must function without network after first load (except live data updates, v2.0+).
5. **Static Hosting Compatibility**: Must deploy to CDN (CloudFront, Cloudflare) without server-side compute.
6. **Data Freshness Limits**: Ephemeris data (planets) accurate ±5 years; stellar positions accurate ±100 years (proper motion); galaxies static (no cosmological updates).
7. **No Real-Time Collaboration**: v1.0 single-user; shared sessions (v2.0).
8. **Mobile Performance Floor**: 30 FPS minimum on iPad Air 2 (2014) with integrated GPU.
9. **Accessibility Compliance**: WCAG 2.1 AA required by v1.0; AAA deferred to v2.0.
10. **Open Source License**: MIT only; no GPL, AGPL, or proprietary dependencies in core.

### 2.8 Dependencies

1. **Gaia DR3 Catalog Access**: ESA hosts; ~500GB uncompressed; must preprocess to 1.8B star subset before release.
2. **JPL Horizons API (Initial Data)**: Fetch planetary positions for past/future 100 years during build; precompute orbit tables.
3. **SDSS DR18 Galaxy Catalog**: 1M+ galaxies; requires preprocessing, culling, LOD generation.
4. **IllustrisTNG Simulation Data**: Cosmic web reconstruction; depends on TNG-300 simulation snapshots (TNG team partnership).
5. **Three.js GPU Optimization**: r184+; WebGL 2.0 instancing requires latest ShaderLib.
6. **React 18 Concurrent Rendering**: Async data loading UI; depends on React Query/SWR for state management.
7. **Web Audio API Specification**: Spatial audio panner, oscillator nodes; requires browser support (all targets support by 2026).
8. **Mapbox GL / D3.js (Optional)**: For minimap/2D projections; optional dependency, lazy-loaded.
9. **TypeScript 5 Type System**: Strict mode; ~500 type definitions for astronomical domains (custom lib).
10. **Webpack 5 / Vite Module Bundler**: Asset splitting, dynamic imports for data chunks.
11. **Testing Framework**: Jest + React Testing Library; headless browser automation (Playwright/Puppeteer).
12. **CI/CD Pipeline**: GitHub Actions for builds; automated performance regression tests.
13. **CDN & Global Hosting**: CloudFront / Cloudflare for 99.9% uptime SLA.
14. **Planetarium Software (Reference)**: Stellarium, Celestia compatibility (data formats) for future import capability.

---

## 3. GOALS & SUCCESS METRICS

### 3.1 Business Goals & OKRs

#### Goal 1: Establish Market Leadership in Interactive Astronomy Education
- **Objective**: Become the #1 free web-based universe visualization tool used by educators globally.
- **Key Result 1**: 100+ educator-designed lesson plans integrated into product within 18 months.
- **Key Result 2**: 10,000+ institutional adoptions (schools, universities, planetaria) with active usage.
- **Key Result 3**: 50% of astronomy education searches include "Cosmos Explorer" in SERP top 5.

#### Goal 2: Drive Community-Powered Open Source Growth
- **Objective**: Build sustainable open-source project with 100+ active contributors, 5K+ GitHub stars.
- **Key Result 1**: 500 merged pull requests from community in Year 1.
- **Key Result 2**: 50+ community-built plugins/extensions on v2.0 plugin marketplace.
- **Key Result 3**: 10+ scientific papers published using Cosmos Explorer for research visualization.

#### Goal 3: Achieve Mass-Market Public Engagement
- **Objective**: Make universe exploration accessible to general audience; build brand as "astronomy for everyone."
- **Key Result 1**: 1 million monthly active users (MAU) by end of Year 2.
- **Key Result 2**: 50% return visitor rate; average session duration >15 minutes.
- **Key Result 3**: 500K+ social media shares/embeds; viral effect on Reddit, Twitter, educational platforms.

#### Goal 4: Establish Foundation for Revenue (Phase 2)
- **Objective**: Freemium model enabling sustainable development while preserving free core.
- **Key Result 1**: Premium educator tier (lesson plans, team features, advanced analytics) achieves 5% educator conversion by Year 3.
- **Key Result 2**: Commercial licensing (VR, kiosk mode) generates $100K MRR by Year 3.
- **Key Result 3**: Institutional partnerships (NASA, ESA, astronomy societies) provide sponsorship/funding.

#### Goal 5: Push Scientific & Technical Boundaries
- **Objective**: Pioneer real-time, GPU-accelerated astronomical visualization; set new bar for browser 3D graphics.
- **Key Result 1**: 60 FPS performance with 100M+ visible objects (stars, galaxies, particles).
- **Key Result 2**: VR mode (WebXR) fully functional by v2.0; 90 FPS on tethered VR headsets.
- **Key Result 3**: Real-time collaboration (multi-user shared sessions) enables classroom/research synchronization.

### 3.2 User Goals Per Persona (Table)

| Persona | Goal | Metric | Target |
|---------|------|--------|--------|
| **Educator** | Design engaging astronomy lessons without external tools | Lesson plans created, time-to-lesson-prep | 10+ plans/user; <30 min prep/lesson |
| **Student** | Understand universe scale and structure through exploration | Concepts mastered (quiz scores), engagement time | 80%+ quiz pass rate; 20+ min/session |
| **Amateur Astronomer** | Plan observations, identify objects, learn constellations | Objects identified, observation plans created | 100+ IDs/session; 1K+ bookmarks |
| **Researcher** | Explore cosmic web, verify simulations, visualize data | Data visualization quality, publication mentions | Paper citations increase 50%; research time -30% |
| **Casual Explorer** | Experience sense of wonder, share universe with friends | Social shares, return visits | 1K+ shares/user lifetime; 30% return rate |
| **Museum Director** | Create immersive educational exhibits | Visitor engagement, exhibit setup time | 90% visitor satisfaction; 50% less setup time |

### 3.3 Technical Goals

1. **GPU Efficiency**: Render 10M+ triangles/frame at 60 FPS mid-range GPU; achieve <500 draw calls/frame through instancing, batching, LOD.

2. **Network Efficiency**: Compress data to <50MB initial load; support resume on connection loss; delta updates for time-series data.

3. **Cross-Platform Compatibility**: Single codebase; automatic degradation on low-end hardware; mobile touch controls equal to desktop mouse/keyboard.

4. **Code Quality**: >80% test coverage; TypeScript strict mode; zero security vulnerabilities (npm audit clean); <2sec code review time.

5. **Scalability**: Support 100K concurrent sessions on static hosting; <100ms global latency p95 (CDN); <1KB HTML, <2MB JS, <2MB CSS (total gzipped).

### 3.4 KPI Dashboard Specification

#### 3.4.1 Engagement Metrics

| KPI | Definition | Target (v1.0) | Target (v1.1) | Target (v2.0) | Measurement |
|-----|-----------|------------|------------|------------|-------------|
| **MAU** | Unique users / month (cookie-based, privacy-respecting) | 50K | 200K | 1M | Google Analytics 4 |
| **DAU** | Unique users / day | 5K | 25K | 150K | GA4 |
| **DAU/MAU Ratio** | Daily / monthly; retention proxy | 10% | 15% | 20% | GA4 cohort |
| **Session Duration** | Avg minutes per session | 8 | 12 | 15 | GA4 session.duration |
| **Bounce Rate** | Users leaving after <10sec | <40% | <35% | <30% | GA4 bounce_rate |
| **Pages/Session** | Avg UI interactions per session | 3 | 5 | 7 | GA4 page_view / session |
| **Return Visitor %** | % of DAU who visited 7+ days ago | 5% | 10% | 25% | GA4 new_users vs. users |
| **Tour Completions** | % of users finishing guided tour | 20% | 35% | 45% | Custom event tracking |
| **Objects Bookmarked** | Avg bookmarks per user | 5 | 15 | 30 | Analytics custom event |

#### 3.4.2 Performance Metrics

| KPI | Definition | Target | Measurement | Tool |
|-----|-----------|--------|-------------|------|
| **FPS p50** | 50th percentile frames/second (mid-session) | 55+ | Real-time profiler | Three.js WebGL stats |
| **FPS p95** | 95th percentile (worst 5% of frames) | 35+ | Percentile histogram | Custom perf monitor |
| **Time to Interactive** | User can interact (TTI) | <2.5s | Lighthouse audit, RUM | Web Vitals, PerformanceObserver |
| **First Contentful Paint** | First pixel appears (FCP) | <1.5s | Lighthouse audit, RUM | Web Vitals |
| **Largest Contentful Paint** | LCP threshold | <4s | Lighthouse audit, RUM | Web Vitals |
| **Cumulative Layout Shift** | CLS (visual stability) | <0.1 | Lighthouse audit, RUM | Web Vitals |
| **Initial Load Time** | Time to first rendered frame (p50/p95) | 2s / 5s | Waterfall profiler | Chrome DevTools, WebPageTest |
| **Data Load Latency** | Time to load all visible data | 3s | Network waterfall | XHR/Fetch timing |
| **Memory (Avg)** | Peak memory mid-session | <256MB | Performance.memory API | Custom monitoring |
| **Draw Calls** | GPU commands/frame | <500 | WebGL debug info | Three.js renderer stats |
| **Bundle Size (gzip)** | JS+CSS+Assets | <2MB code | Webpack bundle analyzer | Lighthouse |

#### 3.4.3 Growth Metrics

| KPI | Definition | Target (12mo) | Measurement |
|-----|-----------|--------------|-------------|
| **Organic Traffic %** | Users from SEO (non-paid) | 60% | GA4 source/medium |
| **Referral Rate** | Traffic from external sites | 20% | GA4 source (referrer) |
| **GitHub Stars** | Community interest signal | 5K | GitHub repo |
| **GitHub Forks** | Community contributions | 500 | GitHub repo |
| **Active Contributors** | Monthly PR submitters | 100+ | GitHub insights |
| **NPM Package Downloads** | Library usage (for v1.1+) | 10K/month | npm.js stats |
| **Press Mentions** | News/media coverage | 50+ articles | Google Alerts, PR tracking |

#### 3.4.4 Education Metrics

| KPI | Definition | Target (18mo) | Measurement |
|-----|-----------|--------------|-------------|
| **Educator Adoptions** | Schools/universities using tool | 1K+ institutions | Custom survey form |
| **Lesson Plans Created** | User-generated curriculum | 500+ | Content database |
| **Student Engagement (via Educator Mode)** | % of students completing assignments | 75%+ | LMS integration analytics |
| **Quiz Completion Rate** | Post-tour quiz attempts | 40%+ of tour users | Custom event tracking |
| **Educator Satisfaction (NPS)** | Net Promoter Score, education segment | >60 | Quarterly survey |
| **Teacher Time-Saved (Est)** | Avg lesson prep time reduction | 30% | Post-survey self-report |

#### 3.4.5 Revenue Metrics (Phase 2, v1.2+)

| KPI | Definition | Target (Year 3) | Measurement |
|-----|-----------|----------------|-------------|
| **Premium Conversion Rate** | % of DAU upgrading to paid plans | 2-5% | Stripe events |
| **Monthly Recurring Revenue (MRR)** | Educator + commercial subscriptions | $50K | Stripe dashboard |
| **Lifetime Value (LTV)** | Avg revenue per paying user lifetime | $500 | Cohort analysis |
| **Churn Rate** | % of subscribers canceling/month | <5% | Retention cohorts |
| **ARPU** | Average revenue per user (all users) | $0.05-0.10 | MRR / DAU |
| **Logo Retention** | % of institutional customers staying 12+ months | 85%+ | Renewal tracking |

### 3.5 Reporting Cadence

- **Weekly**: DAU, session duration, error rate, performance p95 (dashboards for engineering team).
- **Monthly**: Full KPI dashboard, cohort analysis, feature adoption, community growth.
- **Quarterly**: OKR progress review, stakeholder update, roadmap adjustments.
- **Annually**: Business metrics review, competitive analysis, long-term planning.

---

## 4. SCOPE DEFINITION

### 4.1 In-Scope Features by Release

#### MVP (v0.1) — Minimal Viable Product
- **Timeline**: Months 1-2
- **Core Functionality**:
  - Solar System with 8 planets + major moons, accurate orbital mechanics.
  - 10K brightest stars (Gaia DR3 subset) with realistic colors/magnitudes.
  - Basic camera control (WASD, mouse look).
  - Time simulation (play/pause, speed control, ±100 year range).
  - Single info panel (click star/planet → show name, distance, basic properties).
  - Minimal HUD: scale indicator, FPS counter.
  - Responsive design (desktop primary, mobile secondary).
  - Static hosting on CDN.

#### v1.0 — Initial Release
- **Timeline**: Months 3-6
- **Additions**:
  - Full Milky Way structure (spiral arms, galactic center, dust lane).
  - 100K+ stars (Gaia DR3); constellation lines + IAU boundaries.
  - Nebulae (20 major emission, planetary, dark nebulae) with real imagery.
  - Star clusters (Pleiades, M13, etc.).
  - Guided tours (5-10 curated paths with narration).
  - Audio system: procedural ambient + spatial audio for nearby objects.
  - Advanced info panel: 20+ fields per object (spectral type, distance, proper motion, external links).
  - Search bar (name, catalog ID, coordinates).
  - Bookmarks (save/load camera positions).
  - Settings panel (graphics quality, audio levels, units toggle, language).
  - Keyboard shortcuts cheat sheet.
  - WCAG 2.1 AA accessibility compliance.
  - Touch controls (pinch zoom, two-finger rotate, swipe pan).
  - Social sharing (URL encoding full state, Twitter/Reddit share buttons).
  - Screenshot button (PNG export, high-res render).
  - Bloom/lensing post-process shaders.
  - Multiple camera modes (free-fly, orbit, teleport, guided).

#### v1.1 — Extragalactic Expansion
- **Timeline**: Months 7-9
- **Additions**:
  - 1M+ galaxies (SDSS DR18 subset); proper galaxy morphologies (spiral, elliptical, irregular).
  - Local Group (Andromeda, Triangulum, Magellanic Clouds) detailed.
  - 100+ galaxy clusters (Abell catalog).
  - Superclusters (Laniakea, etc.).
  - Cosmic web structure (IllustrisTNG filaments, voids, sheets).
  - Redshift slider (navigate by z = 0 to 8).
  - CMB boundary sphere (Planck temperature map texture).
  - Observable universe boundary visualization.
  - Advanced filtering/search (redshift range, galaxy type, magnitude).
  - Comparison tool (side-by-side object stats).
  - Lesson plan templates (PDF download for educators).
  - Educator mode (larger fonts, simplified controls, disable time sim for kids).
  - Multi-language support (English, Spanish, Mandarin, French, German).
  - Community forum integration (discuss objects, share discoveries).
  - Data pipeline documentation (open-source on GitHub).

#### v1.2 — Refinement & Polish
- **Timeline**: Months 10-12
- **Additions**:
  - Premium educator tier (team management, assignment tracking, classroom sync, advanced lesson plan builder).
  - Commercial licensing (VR, kiosk mode, offline package distribution).
  - Advanced time simulation: historical events (Moon landing, Voyager launch, supernova 1054), future event prediction.
  - Exoplanet overlay (highlight stars with known planets, show exoplanet systems).
  - Variable star animation (Cepheids pulsing, RR Lyrae).
  - Mobile app wrappers (iOS, Android native; same web code, PWA + native wrapper).
  - Analytics dashboard for educators (see student usage, quiz performance).
  - Multiplayer (beta): shared sessions, synchronized viewing.

#### v2.0 — Platform & Extensibility
- **Timeline**: Months 13-18
- **Additions**:
  - VR support (WebXR, Oculus/HTC Vive/PlayStation VR; 90 FPS target).
  - Plugin API: community-built extensions (custom visualizations, data sources, tour modules).
  - Plugin marketplace (curated, community-reviewed extensions).
  - Real-time collaboration (multi-user cursor tracking, shared bookmarks).
  - Advanced rendering (WebGPU option, ray-tracing for nebulae, volumetric fog).
  - Machine learning features: "similar objects" recommendation, anomaly detection in galaxy morphology.
  - Data import API: researchers upload custom catalogs, simulations, visualization configs.
  - Streaming data (live exoplanet discoveries, supernova alerts, ISS tracking).
  - Desktop app (Electron wrapper, offline database, native performance).
  - Institutional dashboard (LMS integration: Blackboard, Canvas, Moodle).

### 4.2 Explicitly Out-of-Scope with Rationale

| Feature | Status | Rationale | Possible Future |
|---------|--------|-----------|-----------------|
| **User Accounts / Authentication** | Out (v1.0-v1.1) | Adds complexity, requires backend. Core experience public-by-design. | Phase 2 (v1.2) for premium features |
| **Real-Time Networking** | Out (v1.0-v1.1) | Requires server-side state management. Single-user experience sufficient for MVP. | v1.2 beta, v2.0 full support |
| **Procedural Planet Generation** | Out | Contradicts "real data" principle. Gaia, JPL, SDSS are authoritative sources. | Maybe artistic mode (v2.0 plugin) |
| **Space Simulation (N-Body Physics)** | Out | Too CPU-heavy; deferred to specialized tools. Reference real orbital elements instead. | Integration with Rebound.js (v2.0) |
| **Satellite Tracking (Real-Time)** | Out (v1.0) | Requires live API (Celestrak), adds latency. Historical positions sufficient. | v1.2 with opt-in updates |
| **Spectroscopy Viewer** | Out | Requires detailed spectral data not available for all objects. Link to external tools (SIMBAD). | v2.0 plugin system |
| **Gravitational Lensing (Physically Accurate)** | Out (v1.0) | Extreme computation cost; visual approximation post-process sufficient. | Future research feature |
| **Desktop-Only Features** | Out | Mobile parity principle. All UI responsive, touch-enabled. | VR-only features justified |
| **Localized Skymap (Alt/Az Coordinates)** | Out (v1.0) | Would require user location + time zone; privacy concerns. | v1.1+ with explicit opt-in |
| **Astrophotography Integration** | Out (v1.0) | Too specialized. Link to external tools (SkySafari, Stellarium). | v2.0 plugin system |
| **Asteroid/Comet Orbital Prediction** | Out (v1.0) | Too detailed; reference external tools (NASA JPL). | v1.1 with curated highlights |
| **Trade/Resell Product Branding** | Out | Open-source licensing forbids sublicensing. Partnerships only. | Partner program (v2.0) |

### 4.3 Future Considerations (Backlog Beyond v2.0)

1. **Augmented Reality Mode**: WebAR (iOS 16+, Android) overlay stars on real sky camera feed; compass integration.
2. **Advanced Simulations**: Integrate orbital mechanics simulator for asteroid impact predictions, orbital decay calculations.
3. **Personalization Engine**: ML-driven recommendations ("You explored nebulae, try supernova remnants"), adaptive difficulty.
4. **Community Discoveries**: Citizen science mode; contribute observations, report anomalies, earn achievements.
5. **Enterprise SaaS Dashboard**: Large institution licensing, seat-based pricing, admin controls, usage analytics, SAML/SSO integration.
6. **Blockchain Integration**: (Speculative) Tokenize "discoveries" (NFT), create virtual "claim" of new object discovery.
7. **AI-Powered Tour Guide**: Chatbot answering arbitrary astronomy questions while exploring (GPT-4 + universe context).
8. **Advanced Rendering**: PathTracing, volumetric fog, physically-based materials, real-time shadows.
9. **Streaming Live Data**: JWST image updates, exoplanet discovery feeds, gravitational wave event mapping.
10. **Haptic Feedback**: VR haptic gloves, tactile feedback for orbit, collision events.

---

## 5. DETAILED FEATURE REQUIREMENTS

### 5.1 Navigation & Camera System

**Overview**: Intuitive, multi-mode camera system enabling seamless exploration from km-scale to Gly-scale distances. Supports keyboard, mouse, touch, and gamepad input. Smooth transitions, bookmarkable positions, and undo/redo history.

**User Stories**:
1. As an educator, I want to quickly jump to Mars or Andromeda Galaxy during a lesson without fumbling with controls, so my students stay engaged.
2. As an amateur astronomer, I want to fly freely through space, orbit around objects, and teleport via search, so I can explore at my own pace.
3. As a casual user on mobile, I want to pinch-zoom and swipe to pan without learning keyboard shortcuts, so exploration feels natural.

**Detailed Requirements**:

| ID | Requirement | Acceptance Criteria | Priority | Effort |
|----|-------------|-------------------|----------|--------|
| **FR-101** | Free-fly Camera Mode | WASD = forward/back/left/right; Space/Ctrl = up/down; Mouse = pitch/yaw rotation. Shift = sprint (2x speed). Gamepad: left stick = movement, right stick = look. Speed adapts to scale. | Must | L |
| **FR-102** | Orbit Camera Mode | Click object → camera orbits around it. Middle-mouse = pan orbit center. Scroll = zoom distance. Right-click = exit orbit. | Must | L |
| **FR-103** | Teleport Camera Mode | Search result click → instant jump to object position, 5× object radius distance. Auto-orient camera toward object. | Must | S |
| **FR-104** | Guided Tour Mode | Predefined camera path (spline) with text narration. Play/pause, 0.5x-2x speed control. Pause → auto-hover. ESC = exit. | Must | M |
| **FR-105** | Camera Inertia | Smooth deceleration when releasing input; feels "weighty". Inertia amount adjustable in settings (0-1 scale). | Should | M |
| **FR-106** | Logarithmic Speed Control | Speed slider adapts to current scale (1-10,000 m/s at Solar System; 1-1E9 ly/s at cosmological scales). Speed always feels "right" for current zoom. | Must | L |
| **FR-107** | Smooth Scale Transitions | Zoom from scale A to B over 1-2 seconds; no loading screens or LOD pops. Camera height/angle maintained during transition. | Must | L |
| **FR-108** | Camera Bookmark System | Ctrl+B = save current position (camera pos, rotation, scale, time). Bookmark manager UI: load/delete/rename. 50 bookmark limit. | Should | M |
| **FR-109** | Undo/Back Button | Browser back button or Backspace = undo last camera movement/teleport. Up to 20-move history. | Should | S |
| **FR-110** | First-Person vs Third-Person | Toggle in settings. First-person: camera at object center (for planets, immersive). Third-person: default, orbital view. | Could | S |
| **FR-111** | Touch Controls (Mobile) | Pinch = zoom. Two-finger drag = rotate camera. Single-finger drag = pan (like Google Maps). Tap = select object. Long-press = context menu. | Must | M |
| **FR-112** | Gamepad Support | Xbox/PlayStation/generic HID gamepads. Left stick = translate, right stick = rotate, triggers = vertical, bumpers = scale speed. Vibration feedback on selection. | Should | L |
| **FR-113** | Speed Indicator HUD | Always-visible label: "Speed: 1000 km/s", "Distance to Sun: 4.2 ly", "Zoom level: 1.3e12 km". Update each frame. | Should | S |
| **FR-114** | Keyboard Shortcut Overlay | Press '?' → show all keybindings. Overlay searchable. Customizable keybindings in settings. | Should | M |
| **FR-115** | Mouse Look Sensitivity | Adjustable in settings (1-10 scale). Affects both free-fly and orbit modes. | Should | S |

---

### 5.2 Multi-Scale Management

**Overview**: Core system managing seamless transitions between 7 scale levels spanning 13 orders of magnitude (km to Gly). Level-of-Detail (LOD) system ensures <500 draw calls, <2M triangles per frame even with 1B visible objects.

**User Stories**:
1. As a student, I want to see Earth, then zoom out smoothly to see Solar System, Milky Way, and beyond, all without waiting for new data or experiencing jumps.
2. As a researcher, I want the cosmic web to be visible at 100 Mly scale with voids and filaments clear, and zoom into dense clusters seeing galaxies individually.
3. As a casual explorer, I want a "powers of ten" button that smoothly zooms through all scales, narrating the universe, so I understand the scale progression.

**Scale Levels & LOD Rules**:

| Scale Level | Distance Range | Key Objects | LOD Strategy | Particle Count |
|-------------|----------------|------------|---|---|
| **Planetary** | <0.01 AU | Earth, Moon, ISS, clouds | High-res sphere meshes, volumetric clouds | 1K |
| **Solar System** | 0.01–100 AU | Planets, moons, asteroid belt, comets | Medium-res spheres + orbit lines, billboards for far objects | 50K |
| **Stellar Neighborhood** | 100 AU–100 ly | Sun, nearby stars (50 pc), open clusters | Point sprites / billboards, constellation lines fade | 100K |
| **Galactic** | 100 ly–100 kly | Milky Way structure, giant stars, nebulae | Sparse point cloud, structure lines (arms, dust lane), billboard nebulae | 500K |
| **Intergalactic** | 100 kly–100 Mly | Local Group, Andromeda, nearby clusters | Galaxy billboards, sparse point cloud, cluster halos | 1M |
| **Cosmic** | 100 Mly–10 Gly | Galaxy superclusters, filaments, voids | Voxel density field or line meshes (IllustrisTNG), galaxy density points | 10M |
| **Observable Universe** | >10 Gly | CMB sphere, universe boundary, cosmic web | Extremely sparse, boundary texture, conceptual visualization | 100M (dense but simple) |

**Detailed Requirements**:

| ID | Requirement | Acceptance Criteria | Priority | Effort |
|----|-------------|-------------------|----------|--------|
| **FR-201** | Scale Level Detection | System tracks current camera distance from Solar System barycenter in log10 meters. Automatically determines active scale. UI always displays current scale. | Must | S |
| **FR-202** | Seamless LOD Transitions | As camera crosses scale boundary (e.g., 100 AU → 100.1 AU), visible object density increases/decreases smoothly. No pop-in, no frame rate drop. Geometry swaps LOD incrementally. | Must | L |
| **FR-203** | Logarithmic Coordinate System | Internal: all positions stored as log10 meters. Rendering: log-z buffer or dual-camera near/far. Prevents Z-fighting over huge distances. | Must | L |
| **FR-204** | LOD Streaming | Predeclare 7 data buckets (one per scale level). Stream/cache during idle. Visible scale always fully loaded; adjacent scales ~80% loaded. Background scales <20% RAM. | Must | L |
| **FR-205** | Scale Indicator HUD | Always-visible label: "Galactic Scale (100 ly–100 kly)" with reference distance (e.g., "Sun to Alpha Centauri: 4.37 ly"). Updates as scale changes. | Should | S |
| **FR-206** | Reference Object Overlay | Show distance to key milestones at current scale (e.g., at Stellar scale: "Earth to Sun: 1 AU | Sun to Sirius: 8.6 ly"). Helps user sense scale. | Should | M |
| **FR-207** | Powers of Ten Mode | Special camera path: starts at Earth (1 km), automatically zooms outward through all 7 scales, ending at observable universe boundary. Narration at each scale. 5-10 min duration. User can pause/reverse. | Should | L |
| **FR-208** | Coordinate System Toggle | Settings option: display current position in (1) Cartesian (X,Y,Z meters), (2) RA/Dec + distance, (3) Galactic (l,b) + distance, (4) Ecliptic lat/lon. | Could | M |
| **FR-209** | Zoom Speed Limiter | Speed slider capped per scale to prevent overshooting. At Planetary scale: max 1e6 m/s. At Observable Universe: max 1e26 m/s (cosmological). | Must | S |
| **FR-210** | Memory Budget Enforcement | Monitor heap size; if >512MB (high device), auto-reduce LOD or unload non-visible scales. Alert user if critical (>90% heap). | Should | M |

---

### 5.3 Solar System Visualization

**Overview**: Scientifically accurate rendering of Solar System using JPL Horizons ephemeris data. Includes Sun, 8 planets, dwarf planets, 200+ moons, asteroid/Kuiper belt samples, historical/active spacecraft, and Lagrange points. Real orbital mechanics with ±100 year historical/predicted positions.

**User Stories**:
1. As a student, I want to see the planets in their actual positions and orbits, learn about ring systems and moons, and understand why outer planets are so distant.
2. As an amateur astronomer, I want to find where Mars is right now, plan observations, and see upcoming conjunctions.
3. As a teacher, I want to rewind time 400 years to show how we discovered gravity, then fast-forward to show future space missions.

**Detailed Requirements**:

| ID | Requirement | Acceptance Criteria | Priority | Effort |
|----|-------------|-------------------|----------|--------|
| **FR-301** | Sun Rendering | Volumetric sphere with Corona shader. Color: realistic ~5800K blackbody. Size: 1,391,000 km (no exaggeration for visibility at scale). Glow/bloom post-process. Solar flares: animated texture overlays (2-4 active at any time, spawn/despawn every 10-20 seconds in time-sim). Sunspots visible at close zoom. | Must | L |
| **FR-302** | Planet Rendering (8 Planets) | 8 textured spheres (Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune). Textures: 4K-8K resolution (LOD: 1K at distance). Axial tilt: accurate to NASA/JPL data. Rotation: accurate sidereal period. Size: true scale (no exaggeration). | Must | L |
| **FR-303** | Cloud Layers | Earth: thin cloud layer texture, semi-transparent. Jupiter: banded cloud layers (GRS animated). Saturn: subtle bands. Animate clouds rotating at planetary rotation rate. | Should | M |
| **FR-304** | Ring Systems | Saturn: 3 visible rings (A, B, C) with Cassini division. Uranus: fainter rings, tilted. Neptune: subtle rings. Jupiter: very faint gossamer rings (optional). Render rings as flat quads with transparent textures. Cast ring shadows on planet. | Should | M |
| **FR-305** | Dwarf Planets (5) | Pluto (0.5x Moon size), Ceres, Eris, Haumea, Makemake. Render as small spheres with low-res textures or procedural colors. Label visible at <1M km distance. | Should | S |
| **FR-306** | Moon Rendering (200+) | Major moons (Moon, Io, Europa, Ganymede, Titan, etc.): textured spheres, named, clickable. Minor moons (100+): unlabeled point sprites or small spheres, rendered with reduced LOD. Hierarchical orbit tree: moons orbit planets at correct rates. | Must | M |
| **FR-307** | Orbital Mechanics (Keplerian) | All bodies follow Keplerian orbits computed from 6 orbital elements (a, e, i, Ω, ω, M). Update mean anomaly each time step; solve Kepler equation to get true anomaly + radius. Positions accurate to <0.01 AU. Support time range: 2000-2100. | Must | L |
| **FR-308** | JPL Horizons Integration | Build pipeline: fetch JPL ephemeris for each body for 100-year range; precompute orbital elements + daily positions. Data size ~50 MB (compressed). Load at startup; interpolate positions during runtime. | Must | L |
| **FR-309** | Orbit Line Rendering | Toggleable in settings. For each planet/moon: render thin line along full orbit (ellipse). Color-code: terrestrial planets (brown), gas giants (orange), dwarf planets (gray). Orbit lines have glow effect. | Should | M |
| **FR-310** | Eclipse Shadows | Earth's shadow on Moon + moons of other planets. Real-time computation: if object positioned behind planet relative to Sun, render dark shadow side. | Could | L |
| **FR-311** | Asteroid Belt (Representative) | Don't render all 1.4 million asteroids. Instead: statistical distribution of ~50K point sprites between Mars-Jupiter orbits. Sparse, matches density of real belt. Clickable "asteroid" shows example data. | Should | M |
| **FR-312** | Kuiper Belt (Conceptual) | Beyond Neptune: thin halo of ~5K point sprites representing icy bodies. Density drops with distance. At extreme zoom, individual objects resolve. | Could | S |
| **FR-313** | Oort Cloud (Boundary) | Faint sphere at ~100,000 AU, illustrating theoretical boundary of gravitational influence. Transparent, non-interactive, visual reference only. | Could | S |
| **FR-314** | Notable Comets (5-10) | Halley's Comet, Comet NEOWISE, etc. Show at current position in time-sim. When near perihelion: render nucleus + tail (coma). Tail always points away from Sun (comet_position - sun_position). | Should | M |
| **FR-315** | Spacecraft Overlay | Voyager 1, Voyager 2, New Horizons, Pioneer 10, Pioneer 11 (optional). Show current/historical positions. Use JPL Horizons positions. Small icons or point sprites. Clickable → mission info panel. | Could | S |
| **FR-316** | Lagrange Points | Earth-Sun (L1, L2, L3, L4, L5): small sphere/point sprite + label at each Lagrange point. L4, L5 show cluster (asteroid swarms). Interesting for science education. | Could | M |
| **FR-317** | Time Accuracy Range | Ephemeris data valid for ±100 years from present (1950-2050). Outside range: extrapolate via orbital elements (less accurate). UI warning if time >50 years outside data range. | Should | S |

---

### 5.4 Stellar Rendering

**Overview**: Render 1.8 billion stars (Gaia DR3) with realistic colors, magnitudes, and proper motion. At distance: point sprites. At mid-range: billboards. Close-up: spheres + coronae. Spectral classification, variable star animation, binary systems.

**User Stories**:
1. As an astronomer, I want to navigate to Alpha Centauri and see the binary system with correct separations and colors.
2. As a teacher, I want to show students why Betelgeuse is red and Sirius is blue, and how brightness relates to distance.
3. As a developer, I want to extend the catalog with my own survey data and see it rendered with the same quality.

**Detailed Requirements**:

| ID | Requirement | Acceptance Criteria | Priority | Effort |
|----|-------------|-------------------|----------|--------|
| **FR-401** | Gaia DR3 Catalog | 1.8 billion stars total. For MVP: subsample to 100K brightest. For v1.0: 100K + constellation stars (~500K total visible in Galactic view). Catalog format: binary or JSON gzipped. Include: position (RA/Dec/parallax), magnitude (V, G), color (B-V, G-Rp), proper motion (μα, μδ), radial velocity (optional). | Must | L |
| **FR-402** | Hipparcos Merger | For nearby stars (<1000 pc): use Hipparcos data (higher precision proper motion) where available, fallback to Gaia. Merge catalogs on parallax + proper motion agreement. | Should | M |
| **FR-403** | B-V Color to RGB | Implement Taffel et al. color index → RGB conversion. Input: B-V color index. Output: (R, G, B) matching spectral type (O=blue, B=blue-white, A=white, F=yellow-white, G=yellow, K=orange, M=red). | Must | S |
| **FR-404** | Apparent Magnitude → Brightness | Magnitude scale: apparent magnitude (m) from Gaia. Render brightness proportional to 10^(-m/2.5) (logarithmic eye response). Use HDR rendering with bloom post-process to simulate eye brightness perception. | Must | M |
| **FR-405** | Point Sprite Rendering (Distance) | At >100 ly: render star as textured point sprite (small circle texture with soft edge). Color: B-V derived. Size/brightness: magnitude. <10 draw calls for 100K stars via instancing. | Must | M |
| **FR-406** | Billboard Rendering (Mid-Range) | At 10-100 ly: render as flat quad (billboard) always facing camera. Texture: fuzzy star circle. Size adapts to distance + magnitude. | Should | M |
| **FR-407** | Sphere + Corona (Close) | At <10 ly: render as sphere mesh (subdivided icosahedron, 64-256 vertices). Color: B-V. Corona shader: bright halo around sphere, intensity = magnitude. Add lens flare post-process if very bright. | Should | L |
| **FR-408** | Proper Motion Animation | In time-sim: stars move across sky at their proper motion rate. Visible as slow drift over centuries. For Barnard's star (highest proper motion): perceptible movement over 10-50 year sim. | Should | M |
| **FR-409** | Variable Stars | Known variable stars (Cepheids, RR Lyrae, long-period variables) pulsate in brightness. Period & amplitude from catalog. Pulsation speed in time-sim tied to actual periods. | Could | M |
| **FR-410** | Binary/Multiple Systems | Close binary stars: when zoomed in (<1 ly), render as separate resolved objects with accurate separation. Orbital motion optional (simpler: static separation). | Could | L |
| **FR-411** | Spectral Classification Labels | Optional overlay: display spectral type (e.g., "G2V" for Sun) near star name. Only visible at <10 ly to avoid clutter. | Could | S |
| **FR-412** | Constellation Lines | IAU 88 constellation boundaries as line meshes. Main constellation lines (e.g., Orion's belt, Big Dipper) brighter; fainter at distance. Clickable → constellation info. | Should | M |
| **FR-413** | Constellation Art (Optional) | Mythological constellation art overlays (e.g., Orion figure). Semi-transparent, toggle in settings. Mostly for casual/educational appeal. | Could | M |
| **FR-414** | Notable Stars Enhanced | Sirius, Vega, Betelgeuse, Aldebaran, Polaris, etc.: 50 brightest/notable stars get enhanced detail. Name always visible at >1000 ly. Hover/click → detailed info. | Should | S |
| **FR-415** | Exoplanet Indicators | Stars with known exoplanets: special icon/indicator (small circle or star symbol nearby). Exoplanet count shown in info panel. Link to exoplanet data (NASA Exoplanet Archive). | Should | M |
| **FR-416** | Star Comparison Tool | Click star A, then Shift+Click star B → side-by-side comparison panel showing properties (distance, magnitude, type, proper motion, etc.). | Should | S |

---

## 6. CONTINUING FEATURE REQUIREMENTS (Sections 5.5-5.14)

**Due to token limits, continuing with remaining critical NFRs and sections:**

### 5.5 Nebulae & Star Clusters

| ID | Requirement | Acceptance Criteria | Priority | Effort |
|----|-------------|-------------------|----------|--------|
| **FR-501** | Emission Nebulae (20 Major) | Orion Nebula, Carina Nebula, Eagle Nebula, etc. Render as textured billboards using real Hubble/JWST imagery. Semi-transparent layers for depth. Clickable → info panel with distance, size, star formation data. | Should | M |
| **FR-502** | Planetary Nebulae (10) | Ring Nebula, Helix Nebula, Cat's Eye, etc. Distinctive morphologies (rings, shells). Render with volumetric corona effect. | Should | M |
| **FR-503** | Dark Nebulae (5) | Horsehead, Coalsack, Barnard's Loop. Render as opaque occlusion regions (obscure stars behind). Makes structure of Milky Way dust lane visible. | Should | M |
| **FR-504** | Supernova Remnants (5) | Crab Nebula, Veil Nebula, Tycho remnant. Render as expanding shell with filament texture. Age from historical records (Crab = 1054). | Could | M |
| **FR-505** | Globular Clusters (10 Major) | M13, Omega Centauri, M4, etc. Render as tight sphere of ~10K particles. Central concentration matches real structure. Clickable → member star count, age. | Should | L |
| **FR-506** | Open Clusters (15) | Pleiades, Hyades, Double Cluster. Stars individually resolved when zoomed in. Cluster membership determined by proximity <10 pc. | Should | M |
| **FR-507** | Cluster Info Panel | Name, distance, age, membership count, notable features. Links to SIMBAD, NED. Spectral classification of dominant stars. | Should | S |

### 5.6 Milky Way Galaxy Structure

| ID | Requirement | Acceptance Criteria | Priority | Effort |
|----|-------------|-------------------|----------|--------|
| **FR-601** | Spiral Arms (4 Major) | Perseus, Sagittarius, Scutum-Centaurus, Norma/Outer Arms. Render as density contours or line meshes in Galactic coordinates. Based on Gaia data dust distribution. | Must | L |
| **FR-602** | Galactic Center (Sgr A*) | Black hole rendering: accretion disk (textured orange/red disk), relativistic jets (two cones pointing up/down). Brightness hot-spot at center. Distance from Sun: 26,000 ly. Orbiting stars visible (S0-102 orbit visualization). | Should | L |
| **FR-603** | Galactic Bar | Central bar structure (misaligned 20° to spiral arms). Rendered as elongated density region. Visible at Galactic scale (5 kly view). | Could | M |
| **FR-604** | Thin/Thick Disk | Density distribution separates thin disk (young, active) from thick disk (old, metal-poor). Visual: thin disk bright/colorful; thick disk dimmer/redder. | Could | L |
| **FR-605** | Dust Lane | Central dust lane running through Galactic plane. Renders as semi-opaque layer; obscures stars behind, reddens light (extinction). Based on Gaia extinction map. | Should | M |
| **FR-606** | Galactic Halo | Optional: show globular cluster positions + dark matter halo (transparent sphere). Age, composition of halo (old, metal-poor). | Could | M |
| **FR-607** | Sun Position Marker | Clearly marked position in Orion Spur (minor arm, between major arms). Label "You are here: 26 kly from Galactic center". | Must | S |
| **FR-608** | Galactic Coordinates Overlay | Optional grid: Galactic longitude (l, 0-360°) and latitude (b, -90 to +90°). Checkbox to toggle in settings. | Should | M |
| **FR-609** | View Modes (Top/Side) | Toggle: viewing Milky Way from above (top-down, see spiral arms) vs. edge-on (side view, see disk/halo). Both views show same data, different perspective. | Should | S |
| **FR-610** | Rotation Animation (Time-Sim) | In time-sim: entire Milky Way rotates around galactic center. One rotation = ~225 million years (galactic year). Visible only at extreme time acceleration (100M years/sec+). | Should | M |

### 5.7 Extragalactic Objects & Galaxy Catalog

| ID | Requirement | Acceptance Criteria | Priority | Effort |
|----|-------------|-------------------|----------|--------|
| **FR-701** | Local Group Galaxies | Andromeda (M31): detailed large spiral, 2M ly distant. Triangulum (M33): smaller spiral. Magellanic Clouds (LMC/SMC): irregular dwarf galaxies, satellites of Milky Way. Render with realistic morphologies. | Should | L |
| **FR-702** | Galaxy Morphology Rendering | Spiral (Sa-Sd): flat disk with spiral arms, central bulge. Elliptical (E0-E7): spheroid, faintness increases with E-number. Irregular: asymmetric blob. Lenticular (S0): disk + bulge, no arms. Each type renders distinctly. | Should | L |
| **FR-703** | SDSS Galaxy Catalog | ~1 million galaxies from SDSS DR18. For MVP: use subset (10K nearest). For v1.1: full catalog. Data: coordinates (RA/Dec), redshift (z), morphology, magnitude. | Must | M |
| **FR-704** | Galaxy Clusters (50+) | Virgo Cluster (z~0.004, ~50M ly), Coma Cluster (z~0.023, ~300M ly), Perseus Cluster, Abell 1656, etc. Render as grouped galaxy populations. Cluster center marked. | Should | L |
| **FR-705** | Superclusters | Laniakea Supercluster (100,000 galaxies), local supercluster structure. Render as large-scale density regions. Laniakea "Great Attractor" visible as central concentration. | Should | M |
| **FR-706** | Active Galaxies (AGN) | Quasars (z > 1, extreme luminosity), Seyfert galaxies (AGN with visible jets), Blazars (jet-on). Render with special markers (bright point, jet cones). High energy emission implied visually. | Could | L |
| **FR-707** | Redshift-to-Distance Conversion | User input: redshift z. Compute comoving distance via Friedmann cosmology (H₀ = 67.4 km/s/Mpc, ΛCDM). Display distance in Mly, Gly. "Go to redshift" feature in search. | Should | M |
| **FR-708** | Galaxy Brightness (Magnitude) | Apparent magnitude → rendered brightness. Faint galaxies (m > 15) appear dimly; brightest (m < 10) very visible. HDR bloom emphasizes brightest. | Should | S |
| **FR-709** | Galaxy Info Panel | Name (NGC/Messier), redshift, distance, morphology, absolute magnitude, mass estimate (if available), star formation rate. External links: SIMBAD, NED, Wikipedia. | Should | S |

### 5.8 Cosmic Web & Large-Scale Structure

| ID | Requirement | Acceptance Criteria | Priority | Effort |
|----|-------------|-------------------|----------|--------|
| **FR-801** | Filaments Rendering | From IllustrisTNG simulation: density-connected structures (filaments) connecting clusters. Render as thin line meshes or volume density field. Color gradient: red (high density) → blue (low density). | Should | L |
| **FR-802** | Voids | Regions of low density between filaments. Render as "empty" space (barely visible, mostly black). Label major voids (Boötes Void, etc.). | Should | M |
| **FR-803** | Sheets | Wall-like structures (2D density concentrations). Visible when viewing cosmic web edge-on. | Could | M |
| **FR-804** | Knots (Clusters) | Intersections of filaments where high-density nodes form. Galaxy clusters concentrated at knots. | Should | S |
| **FR-805** | CMB Boundary Sphere | At z ≈ 1100 (comoving distance ≈ 46.5 Gly): rendered as large sphere surrounding observable universe. Texture: Planck CMB temperature map (dipole removed, microKelvin fluctuations). Semi-transparent glow. | Should | L |
| **FR-806** | Observable Universe Boundary | Outermost sphere at comoving distance ~46.5 Gly. Represents horizon beyond which we cannot see (light hasn't had time to reach us). Visual: semi-opaque boundary glow. | Must | M |
| **FR-807** | Hubble Volume | Concentric spheres showing distance shells: 1 Mly, 10 Mly, 100 Mly, 1 Gly (grid overlay). Helps user sense scale. Toggleable in settings. | Could | S |
| **FR-808** | Density Field Rendering | Alternative to line meshes: render cosmic web as volume density field (ray-marched fog). High-density = bright; low-density = transparent. Beautiful at cosmological zoom. | Could | L |
| **FR-809** | Large-Scale Structure Info | At Cosmic scale: show dominant filament/void/cluster name, density estimate, redshift range. | Could | S |

### 5.9 Scientific Information System

| ID | Requirement | Acceptance Criteria | Priority | Effort |
|----|-------------|-------------------|----------|--------|
| **FR-901** | Click-to-Info Panel | Click/tap any object → info panel appears (side panel, 30% screen width on desktop; full-width on mobile, dismissible). Always shows: name, object type, distance from camera. | Must | M |
| **FR-902** | Object Type-Specific Fields | Star: 20+ fields (RA, Dec, parallax, magnitude, color, spectral type, proper motion, radial velocity, nearby stars, exoplanets, distance from Sun). Planet: 25+ fields (radius, mass, orbital elements, composition, surface temp, moons, exploration missions). Galaxy: 15+ fields (morphology, redshift, distance, absolute magnitude, star formation rate, black hole mass, cluster membership). | Must | L |
| **FR-903** | Data Source Attribution | Every field displays source: "(Gaia DR3)", "(JPL Horizons)", "(SDSS DR18)", "(NASA Exoplanet Archive)", etc. Links clickable → original data source. | Should | M |
| **FR-904** | External Links | Info panel footer: links to Wikipedia, NASA official page, catalog entry (SIMBAD, NED, etc.), constellation page (for stars). | Should | S |
| **FR-905** | Fun Facts | Pop-up trivia: "Did you know? Alpha Centauri is the nearest star system to Earth (4.37 ly away)." 2-3 fun facts per popular object (manually curated). | Could | S |
| **FR-906** | Comparison Tool | Shift+Click object A, then object B → comparison panel showing side-by-side properties. Color-highlights differences (A in blue, B in red). | Should | M |
| **FR-907** | Units Toggle | Settings: metric (m, kg, K) / imperial (ft, lbs, °F) / astronomical (AU, M☉, ly). Info panel updates all numeric values instantly. | Should | S |
| **FR-908** | Distance Display Options | Show distance as: (1) distance from camera, (2) distance from Sun/Earth, (3) light-travel time to object. Dropdown or tabs in info panel. | Should | S |
| **FR-909** | Coordinate Systems | Toggle display of current object position in: (1) Cartesian (X,Y,Z meters), (2) RA/Dec + distance, (3) Galactic (l,b) + distance, (4) Ecliptic lat/lon. | Could | M |
| **FR-910** | Search Bar | Global search: type object name, catalog ID (NGC 224, M31, Gaia ID), coordinates (RA/Dec), or redshift range. Auto-complete with <50ms latency. Matches →autocomplete dropdown. Hit Enter → teleport to object. | Must | M |

### 5.10 Time Simulation Engine

| ID | Requirement | Acceptance Criteria | Priority | Effort |
|----|-------------|-------------------|----------|--------|
| **FR-1001** | Play/Pause Toggle | Spacebar or button → play/pause time simulation. Current time display: Julian Date (JD) + calendar date (YYYY-MM-DD). | Must | S |
| **FR-1002** | Forward/Reverse | Arrow buttons or play button with direction toggle. Time advances/reverses at speed set by slider. Supports continuous direction change. | Must | S |
| **FR-1003** | Speed Control Slider | Range: 1 second/second (real-time) to 1 billion years/second (cosmological). Logarithmic scale (10^x where x ∈ [-9, 9]). Label displays human-readable speed: "1 year/sec", "1 million years/sec". | Must | M |
| **FR-1004** | Epoch Display | Always-visible: "Time: JD 2451545 (2000-01-01 12:00:00 UTC)". Updates each frame. ISO 8601 format option in settings. | Should | S |
| **FR-1005** | Orbital Animation | Planets/moons/asteroids move along orbits proportional to elapsed time. Positions computed from Keplerian elements for accuracy. | Must | L |
| **FR-1006** | Stellar Proper Motion | At high time acceleration (>1000 years/sec): nearby stars visibly drift across sky at their proper motion rates. | Should | M |
| **FR-1007** | Galaxy Rotation | At extreme time acceleration (>100 million years/sec): Milky Way visibly rotates around galactic center (225 Myr period). | Could | M |
| **FR-1008** | Cosmic Expansion Visualization | At cosmological time scales (>1 billion years/sec): cosmic web expands visibly (scale factor a(t) from ΛCDM cosmology). Galaxies recede from each other. | Could | L |
| **FR-1009** | Historical Events Presets | Buttons: "Now" (J2000), "Moon Landing (1969-07-20)", "Voyager Launch (1977-09-05)", "Supernova 1054 (Crab)", "Dinosaur Extinction (66 MYA)", "Big Bang (13.8 BYA)". Jump to preset date, optionally auto-center camera on relevant object. | Should | M |
| **FR-1010** | Event Prediction | Upcoming solar eclipses, lunar eclipses, conjunctions, opposition dates within next 50 years. Filterable list in UI. Click → jump to event time & location. | Should | L |
| **FR-1011** | Time Range Validation | Ephemeris data accurate ±100 years (1950-2050 for modern data). Outside range: extrapolate via orbital elements or show warning. Cannot go before 1/1/1000 or after 12/31/3000. | Should | S |
| **FR-1012** | Pause-on-Hover | Optional setting: pause time-sim when user hovers over UI panel (to read info without time advancing). Resume when moving mouse back to canvas. | Could | S |

### 5.11 Audio & Soundscape System

| ID | Requirement | Acceptance Criteria | Priority | Effort |
|----|-------------|-------------------|----------|--------|
| **FR-1101** | Procedural Ambient Audio | Web Audio API: oscillators + filters generating atmospheric tones. Scale-dependent: Solar System = mechanical/synthesized; Galactic = ethereal/choir-like; Cosmic = deep bass/pad. Composition changes based on current scale. | Should | L |
| **FR-1102** | Scale-Dependent Mixing | Master mix has 3 channels: (1) Ambient base layer, (2) Spatial audio (objects), (3) UI sounds. Volume of each channel adjusts based on zoom level. At close zoom: more spatial, less ambient. At far zoom: more ambient. | Should | M |
| **FR-1103** | Spatial Audio (3D Panning) | Nearby prominent objects (Sun, Sirius, Andromeda) have Web Audio PannerNode attached. Sound pans left/right/front/back based on object direction relative to camera. Creates immersive 3D sound field. | Should | M |
| **FR-1104** | Object Sonification | Physical properties encoded as sound: (1) Temperature → pitch (hot = high pitch, cool = low pitch). (2) Luminosity → volume (bright = loud). (3) Mass → bass depth. Subtle, musical, not overwhelming. | Could | L |
| **FR-1105** | Transition Sounds | Scale transitions: whoosh/sweep effect (1-2 seconds). Object selection: soft chime. Bookmark save: ding. Subtle, never jarring. | Could | S |
| **FR-1106** | UI Sounds (Optional) | Click, hover, panel open/close, error sounds. All very subtle (volume -30dB relative to ambient). Toggle on/off in settings. | Could | S |
| **FR-1107** | Volume Controls | Master volume slider (0-100%). Per-channel sliders: Ambient, Spatial, UI. Sliders in settings panel. | Should | S |
| **FR-1108** | Mute Toggle | Checkbox to mute all audio. Browser tab hidden → audio pauses (respect user attention). | Should | S |
| **FR-1109** | NASA Sonification Mode | Inspired by real NASA data sonification projects. Toggle: transforms audio into data-driven tones (e.g., Gaia star magnitudes → pitch distribution). | Could | M |
| **FR-1110** | Audio Accessibility | All audio is secondary; all information conveys via visual UI (no audio-only alerts). WCAG compliance: audio descriptions available (optional narration for audio-visual content). | Should | M |

### 5.12 User Interface & HUD

| ID | Requirement | Acceptance Criteria | Priority | Effort |
|----|-------------|-------------------|----------|--------|
| **FR-1201** | Minimal HUD | Permanent on-screen: scale indicator, current coordinates, FPS counter (debug mode). Everything else hidden/panel-accessed. | Must | S |
| **FR-1202** | Scale Indicator | Top-left: "Galactic Scale (100 ly–100 kly) | Sun to Alpha Centauri: 4.37 ly". Updates per frame. | Must | S |
| **FR-1203** | Search Bar | Top of screen: search input, autocomplete dropdown showing matching objects + distance. Keyboard: Ctrl+K to focus search (Mac: Cmd+K). | Must | M |
| **FR-1204** | Settings Panel | Gear icon (top-right). Organized tabs: Graphics (quality, draw distance, fog, bloom), Audio (master volume, ambient, spatial, UI), Input (sensitivity, keybindings), Units (metric/imperial/astronomical), Language, Advanced (debug, cache size, data source). | Must | M |
| **FR-1205** | Bookmark Manager | Star icon (top-right). Sidebar listing saved camera positions. Click → load. Right-click → rename/delete. Drag to reorder. Limit 50 bookmarks. | Should | M |
| **FR-1206** | Tour Browser | Navigation icon. List available tours (10-20 curated paths). Click → launch tour (camera path + narration). | Should | M |
| **FR-1207** | Help Overlay | '?' key → overlay showing all keybindings (WASD, Space, Ctrl, mouse, gamepad). Searchable by binding name. Dismissible (Esc). | Should | M |
| **FR-1208** | Loading Screen | First load: progress bar (0-100%) with space facts rotating every 5 seconds. Estimated time remaining. "Loading star data (45/100K)...". | Should | M |
| **FR-1209** | Minimap (2D Projection) | Bottom-right corner: top-down 2D projection of current view. Camera frustum shown as outline. Objects rendered as dots (stars = white, planets = colored, galaxies = yellow). Click minimap → jump to location. | Could | L |
| **FR-1210** | Breadcrumb Navigation | Below scale indicator: "Universe > Laniakea > Milky Way > Orion Arm > Solar System > Earth". Each level clickable → jump to that scale. | Should | S |
| **FR-1211** | Notification Toasts | Bottom-right: transient notifications (2-3 sec fade). "Bookmark saved: Alpha Centauri", "Data loaded: 100K stars", "Error: offline (using cached data)". | Should | S |
| **FR-1212** | Context Menu | Right-click object → menu: "Go To", "Info", "Orbit Around", "Compare", "Bookmark", "Share". Select → execute action. | Should | M |
| **FR-1213** | Fullscreen Toggle | F11 or button → fullscreen mode (hides browser chrome). UI remains visible, scales to fit. | Should | S |
| **FR-1214** | Screenshot Button | Camera icon in toolbar. Click → render current view at 4K (3840×2160) asynchronously, download as PNG. Filename: "cosmos-explorer-YYYY-MM-DD-HHmmss.png". | Should | M |
| **FR-1215** | Recording Mode (Beta) | REC button → start recording visible canvas to WebM (VP9) or MP4 (h.264). Stop → save to file. Max recording length 10 minutes. Requires permission. | Could | L |
| **FR-1216** | Responsive UI | On mobile: hide breadcrumb, minimap. Scale buttons larger (44×44px min). Side panels stack as full-width sheets. Landscape mode optimized. | Must | L |
| **FR-1217** | Theme Toggle | Settings: Light/Dark theme. Dark by default (optimal for astronomy viewing). Affects UI panels, text, buttons. | Could | S |
| **FR-1218** | Accessibility Features | WCAG 2.1 AA: keyboard-navigable all UI, focus indicators, screen reader labels, high contrast mode, reduced motion mode, color blindness modes. | Must | L |

### 5.13 Sharing & Social Integration

| ID | Requirement | Acceptance Criteria | Priority | Effort |
|----|-------------|-------------------|----------|--------|
| **FR-1301** | Shareable URLs | Current state (camera position, time, settings) encoded in URL hash (#state=...) using base64 compression or URL-safe format. Share link → receiver sees identical view. URL length <2000 chars. | Should | M |
| **FR-1302** | Social Sharing Buttons | Share icon → buttons: Twitter/X, Facebook, Reddit, Email, Copy Link. Pre-filled message: "Check out [object] in Cosmos Explorer: [URL]". | Should | S |
| **FR-1303** | Embed Code | Share icon → copy iframe code: `<iframe src="cosmos-explorer.com#state=..."></iframe>`. Embedder customizes size, theme. | Should | M |
| **FR-1304** | Screenshot Sharing | After screenshot taken: offer "Share to Twitter/Facebook" button. Image + pre-filled message. | Should | S |
| **FR-1305** | Screenshot Metadata | PNG file includes exif: object viewed, coordinates, time simulated to, date screenshot taken. Tools can parse for archival/curation. | Could | S |
| **FR-1306** | Community Gallery (Future) | Optional v1.2+: user-submitted screenshots curated in gallery. Voting, comments, featured highlights. | Could | L |

### 5.14 Education & Guided Tours

| ID | Requirement | Acceptance Criteria | Priority | Effort |
|----|-------------|-------------------|----------|--------|
| **FR-1401** | Guided Tours (10+ Curated) | Pre-built camera paths: "Solar System 101" (15 min), "Life of a Star" (20 min), "Scale of the Universe" (30 min), "Cosmic Web" (25 min), "Exoplanets" (20 min). Each has narration, info overlays, optional interactive quiz. | Must | L |
| **FR-1402** | Tour Narration | Voice-over audio OR text captions (user selectable). Text auto-advances with camera. Professional audio (TBD: in-house or hire). | Should | L |
| **FR-1403** | Tour Pausing & Navigation | Play/pause during tour. Skip to next chapter (arrow buttons). Reverse to previous. Speed: 0.5x, 1x, 2x. Exit tour: Esc or back button. | Should | M |
| **FR-1404** | Tour Info Overlays | During tour: contextual info panels pop up automatically at key moments (camera reaching Andromeda → "This is the Andromeda Galaxy, 2.5 million light-years away"). | Should | M |
| **FR-1405** | Interactive Quizzes | Post-tour quiz: 3-5 multiple-choice questions testing understanding (e.g., "How far is the Sun from the Galactic center?" with A) 10 kly, B) 26 kly, C) 50 kly). Score shown after completion. | Should | M |
| **FR-1406** | Educator Mode | Simplified UI: no time controls, larger fonts, constellation art enabled, "fun facts" more prominent. Keybindings disabled (only click/tap to explore). Tooltips always visible. Target: K-12 age 8-18. | Should | L |
| **FR-1407** | Lesson Plan Templates | 5-10 downloadable PDF lesson plans (one per tour). Includes: learning objectives, background reading, discussion questions, worksheet, assessment rubric. Free for educators. | Should | L |
| **FR-1408** | Educator Dashboard (v1.2+) | Educators log in (optional feature): view which students used tool, time spent, quiz scores, common misconceptions. Anonymized analytics. | Could | L |
| **FR-1409** | Custom Tour Builder (v1.2+) | Teachers create custom tours: record camera path, add narration, attach lesson plan. Shareable with students via link. | Could | L |
| **FR-1410** | LMS Integration (v2.0) | Embed Cosmos Explorer in Blackboard, Canvas, Moodle. Tool tracks student usage → grade book. Assignment: "Explore Mars and answer 3 questions". | Could | L |

---

## 6. NON-FUNCTIONAL REQUIREMENTS

### 6.1 Performance Requirements

| ID | Requirement | Target | Measurement | Priority |
|----|-------------|--------|-------------|----------|
| **NFR-001** | FPS (mid-range GPU) | 60 FPS p50, 30+ FPS p95 | Real-time WebGL stats monitor, 60-sec run | Must |
| **NFR-002** | FPS (low-end GPU) | 30 FPS p50, 20+ FPS p95 | Same, integrated GPU device | Should |
| **NFR-003** | Time to Interactive (TTI) | <2.5 seconds | Lighthouse audit, RUM (PerformanceObserver) | Must |
| **NFR-004** | First Contentful Paint (FCP) | <1.5 seconds | Lighthouse, RUM | Must |
| **NFR-005** | Largest Contentful Paint (LCP) | <4 seconds | Lighthouse, RUM | Must |
| **NFR-006** | Cumulative Layout Shift (CLS) | <0.1 | Lighthouse, RUM | Should |
| **NFR-007** | Bundle Size (Code Only, Gzipped) | <2 MB | Webpack bundle analyzer | Must |
| **NFR-008** | Initial Data Load | <50 MB | Network tab waterfall, XHR latency | Must |
| **NFR-009** | Data Load Time (p50/p95) | 3s / 8s | Waterfall profiler | Should |
| **NFR-010** | Peak Memory Usage | <512 MB (high), <256 MB (mid), <128 MB (low) | Performance.memory API | Should |
| **NFR-011** | Draw Calls per Frame | <500 | WebGL debug info, Three.js renderer stats | Must |
| **NFR-012** | Triangles per Frame | <2 million | WebGL debug, mesh statistics | Should |
| **NFR-013** | Texture Memory | <256 MB total VRAM | GPU memory monitoring | Should |
| **NFR-014** | Network Requests (Concurrent) | <6 parallel downloads | HTTP waterfall | Should |
| **NFR-015** | Responsiveness (UI Input Lag) | <100 ms | Event-to-response timing, slow-motion video | Should |
| **NFR-016** | Animation Frame Rate Consistency | No frame drops >5 FPS per frame | Frame time histogram, jank monitoring | Should |
| **NFR-017** | Scroll/Pan Smoothness | 60 FPS during pan | Real-time FPS counter, frame time graph | Should |
| **NFR-018** | Data Fetch Resume on Disconnect | Yes, resume within 30 sec | Network throttle test, offline simulation | Should |
| **NFR-019** | Cache Hit Rate | >80% on repeat visits | Service Worker analytics | Should |
| **NFR-020** | CDN Edge-to-Client Latency | <100 ms p95 globally | CloudFront/Cloudflare analytics | Should |

### 6.2 Compatibility Requirements

| ID | Requirement | Target | Notes | Priority |
|----|-------------|--------|-------|----------|
| **NFR-021** | Browser Support | Chrome 100+, Firefox 100+, Safari 16+, Edge 100+ | WebGL 2.0 core requirement | Must |
| **NFR-022** | Device Support | Desktop + Tablet + Mobile | Progressive degradation; features scale by device power | Must |
| **NFR-023** | OS Support | Windows 10+, macOS 11+, Linux (Ubuntu 20.04+), iOS 16+, Android 11+ | Native browser, no special driver | Must |
| **NFR-024** | GPU Compatibility | NVIDIA, AMD, Intel integrated, Apple Silicon M1+ | WebGL 2.0 universal; no vendor-specific extensions | Must |
| **NFR-025** | Gamepad API Support | Xbox One, PlayStation 4, generic HID | Standard Gamepad API (W3C) | Should |
| **NFR-026** | WebAudio API | All target browsers | Spatial panning, oscillator nodes, filter nodes | Should |
| **NFR-027** | Responsive Design Breakpoints | 360px (mobile), 768px (tablet), 1024px (desktop), 1440px (wide), 2560px (4K) | Fluid layout, no horizontal scroll at any size | Must |
| **NFR-028** | Touch Input Precision | ±5mm touch target, 44×44px minimum | WCAG 2.1 AA standard | Should |
| **NFR-029** | Keyboard Navigation | All UI elements keyboard-accessible, Tab order logical | WCAG 2.1 AA compliance | Should |
| **NFR-030** | Screen Reader Compatibility | ARIA labels, semantic HTML, tested on NVDA/JAWS/VoiceOver | WCAG 2.1 AA | Should |

### 6.3 Reliability & Availability

| ID | Requirement | Target | Measurement | Priority |
|----|-------------|--------|-------------|----------|
| **NFR-031** | Uptime (Static Assets) | 99.9% | CloudFront/Cloudflare monitoring (SLA) | Must |
| **NFR-032** | Error Rate | <0.1% (1 error per 1000 requests) | Sentry/Rollbar error tracking | Should |
| **NFR-033** | Critical Bug Fix Time | <4 hours | Incident response SLA | Should |
| **NFR-034** | Data Corruption Probability | <0.01% | Checksum validation on load | Should |
| **NFR-035** | Graceful Degradation (No WebGL) | Show fallback message + link to compatible browser | Detect at startup, inform user | Should |
| **NFR-036** | Recovery on Context Loss | Auto-recover WebGL context within 2 sec, pause rendering until ready | WebGL context restore event | Should |
| **NFR-037** | Offline Data Persistence | IndexedDB cache survives browser restart | Service Worker + IDB | Should |
| **NFR-038** | Offline Mode Duration | Full functionality without network for ≥2 hours after initial load | Local cache, no API calls | Should |
| **NFR-039** | Failed Data Load Recovery | Retry with exponential backoff (1s, 2s, 4s), notify user after 3 failures | Custom fetch wrapper | Should |
| **NFR-040** | Crash Recovery | Auto-revert to known-good app state, preserve user progress | Browser session storage, version tracking | Should |

### 6.4 Security Requirements

| ID | Requirement | Target | Mechanism | Priority |
|----|-------------|--------|-----------|----------|
| **NFR-041** | HTTPS Only | All traffic encrypted TLS 1.2+ | HTTP → HTTPS redirect, HSTS headers | Must |
| **NFR-042** | Content Security Policy | Strict CSP preventing XSS, clickjacking, data exfiltration | CSP meta tag / HTTP header | Must |
| **NFR-043** | No Authentication Data Stored | Zero credential storage | No cookies, localStorage, sessionStorage with sensitive data | Must |
| **NFR-044** | Third-Party Script Audit | Minimize external JS; all scripts reviewed for security | Dependency scanning (npm audit), SCA tools | Should |
| **NFR-045** | Dependency Vulnerability Scanning | Weekly automated audits, <7 day fix SLA for high-severity | npm audit, Snyk, OWASP Dependency-Check | Should |
| **NFR-046** | Data Source Validation | Verify integrity of astronomy data before use (checksums) | SHA256 checksum files alongside data | Should |
| **NFR-047** | CORS Policy | Only allow cross-origin requests from trusted data domains (ESA, SDSS, JPL) | CORS headers, whitelist origins | Should |
| **NFR-048** | No Analytics PII | Analytics platform doesn't collect personally identifiable information | Configure Google Analytics 4 with anonymizeIp, no custom user ID | Must |
| **NFR-049** | Subresource Integrity (SRI) | CDN assets integrity-checked on load | SRI hashes in <script>, <link> tags | Should |
| **NFR-050** | Secure Headers | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, etc. | HTTP security headers configured | Should |

### 6.5 Accessibility Requirements

| ID | Requirement | Standard | Implementation | Priority |
|----|-------------|----------|-----------------|----------|
| **NFR-051** | WCAG 2.1 Level AA | AA compliance for all UI | Axe DevTools, manual WCAG testing | Must |
| **NFR-052** | Color Blindness Modes | Deuteranopia (red-green), Protanopia, Tritanopia | Shader filters, color palette adjustments | Should |
| **NFR-053** | High Contrast Mode | HC dark/light toggle, 7:1 contrast minimum | CSS custom properties, tested with contrast checker | Should |
| **NFR-054** | Reduced Motion Mode | Disable animations, transitions, parallax | prefers-reduced-motion media query | Should |
| **NFR-055** | Font Scaling | Support 125%, 150%, 200% browser font size | Responsive typography, rem units (not px) | Should |
| **NFR-056** | Keyboard Navigation | Tab, Shift+Tab, Enter, Arrow keys for all controls | ARIA attributes, focus management (JavaScript) | Should |
| **NFR-057** | Focus Indicators | Visible focus outline (min 3px, high contrast) | :focus-visible CSS, custom outlines | Should |
| **NFR-058** | Screen Reader Support | ARIA labels, live regions, semantic HTML | <label>, <button>, role attributes, aria-label | Should |
| **NFR-059** | Closed Captions | Tours have CC option; narration displayed as text | WebVTT files, <track> elements | Should |
| **NFR-060** | Accessible Forms | Labels, error messages, placeholder not label | <label> for=, aria-describedby, explicit feedback | Should |

### 6.6 Data & Privacy

| ID | Requirement | Scope | Details | Priority |
|----|-------------|-------|---------|----------|
| **NFR-061** | No User Account Required | Core experience fully functional without signup | Public-by-design, optional v1.2+ premium tier | Must |
| **NFR-062** | Minimal Analytics | GA4 aggregated, anonymized data only | No user IDs, no PII, anonymizeIp enabled | Should |
| **NFR-063** | Data Deletion | Users can clear all local data (IndexedDB, localStorage) in settings | "Clear Cache" button, deletes all app data | Should |
| **NFR-064** | Privacy Policy | Clear, concise explanation of data practices | Linked in footer, <500 words | Should |
| **NFR-065** | Compliance (GDPR/CCPA) | GDPR-compliant for EU users; CCPA for California | Consent banners (if using any tracking), data deletion rights | Should |
| **NFR-066** | Open Data Attribution | All data sources publicly attributed and downloadable | Links to Gaia, SDSS, JPL, IllustrisTNG repos | Must |

---

## 7. DATA REQUIREMENTS

### 7.1 Data Sources & Specifications

| Source | Provider | Format | Size | Fields Used | Update Frequency | License | Preprocessing |
|--------|----------|--------|------|-------------|-----------------|---------|---|
| **Gaia DR3** | ESA | Binary (parquet) or CSV | 500 GB (uncompressed) | RA, Dec, parallax, Gmag, B-V, proper motion (μα, μδ), RV | 6 years (next release DR4) | CC-BY 4.0 | Filter by magnitude; compress; generate LOD trees |
| **Hipparcos** | ESA | VOTable XML | 1 GB | RA, Dec, Hp mag, proper motion, parallax | Static (1997) | CC0 | Merge with Gaia on high-proper-motion objects |
| **JPL Horizons** | NASA JPL | API + export | 2 GB (precomputed tables) | Position, velocity, ephemeris, orbital elements | Daily (real-time) | Public domain | Precompute 100-year orbits; store as JSON |
| **SDSS DR18** | SDSS Collaboration | FITS, CAS database | 50 GB (subset) | RA, Dec, photometry (u,g,r,i,z), redshift, spec type | Annual | CC-BY-SA 4.0 | LOD tree, redshift binning, morphology classification |
| **IllustrisTNG** | Springel et al. | HDF5 snapshots | 100 GB (subset) | Dark matter + baryon density field, galaxy positions | Static (simulation) | CC-BY 4.0 | Downsample density field; render as volume/mesh |
| **Planck CMB** | ESA Planck | FITS (all-sky map) | 50 MB | Temperature fluctuations (CMB_I_map) | Static | CC-BY 4.0 | Downsample to 1024×512; tone-map for visualization |
| **NGC/IC Catalog** | Hipparcos & Tycho Catalogs | CSV | 10 MB | Object ID, type, RA, Dec, size, magnitude | Static | Public domain | Merge duplicates; cross-reference with Gaia |
| **Tycho-2 Catalog** | ESA Hipparcos | VOTable | 200 MB | RA, Dec, B, V magnitude, proper motion | Static | CC0 | Merge with Gaia high-magnitude objects |
| **Nearby Exoplanets** | NASA Exoplanet Archive | JSON API | 5 MB | Host star, planet name, semi-major axis, radius, type | Monthly | CC0 | Filter to confirmed planets; link host stars |
| **Constellation Boundaries** | IAU WG | CSV (Hipparcos format) | 100 KB | RA, Dec per constellation edge | Static | Public domain | Render as line meshes |

### 7.2 Data Quality Requirements

| Aspect | Requirement | Verification |
|--------|-------------|---|
| **Positional Accuracy** | Stars accurate ±0.1 arcsec (Gaia astrometric error typical 5-30 μas); planets accurate ±0.01 AU | Compare with published ephemerides (JPL, IAU) |
| **Magnitude Accuracy** | Star magnitudes within ±0.1 mag (photometric error ~0.02 mag typical) | Magnitude statistics vs. published surveys |
| **Completeness** | Gaia: 99.86% completeness m_G < 21; SDSS: >90% magnitude-limited to r < 23 | Survey completeness statements |
| **No Duplicates** | Cross-catalog objects deduplicated on RA/Dec proximity (<1 arcsec) | Automated matching routine, manual spot-check |
| **Metadata Quality** | All objects have required minimum fields (ID, RA, Dec, magnitude/redshift). Missing values indicated. | Schema validation, NaN/null frequency <0.1% |
| **Temporal Validity** | Ephemeris data current to within 1 year; proper motion extrapolation valid ±50 years | Date check at load; extrapolation tests |

### 7.3 Data Pipeline

1. **Acquisition** (Month 1): Download Gaia DR3 (500 GB), SDSS DR18 (50 GB subset), JPL ephemerides, IllustrisTNG snapshots.
2. **Cleaning** (Month 2): Deduplicate, remove invalid records, merge catalogs on celestial coordinates.
3. **Processing** (Month 2-3): 
   - Star catalog: subsample to 100K (v0.1) → 500K (v1.0) → 1.8B (v1.1) via LOD binning. Precompute LOD trees (octree).
   - Galaxies: apply magnitude cuts, redshift binning, morphology classification.
   - Ephemeris: precompute orbital elements + position tables for planets (100 years at 1-day resolution).
   - Cosmic web: extract density field from TNG snapshot; compress as 3D texture.
4. **Validation** (Month 3): Unit tests on coordinate transforms, magnitude-brightness mappings, orbit accuracy.
5. **Compression** (Month 3): GZIP or Brotli compress; store as JSON/msgpack for fast parsing.
6. **Distribution** (Month 4): Upload to CDN (CloudFront); version tagged (e.g., "gaia-dr3-v1.0.json.gz").
7. **Monitoring** (Ongoing): Hourly integrity checks (SHA256), daily cache refresh, alert if data unavailable.

---

## 8. TECHNICAL CONSTRAINTS & ARCHITECTURE

### 8.1 Core Technical Constraints

| Constraint | Rationale | Implication |
|-----------|-----------|-------------|
| **Browser-Only Execution** | No plugin/installation friction; maximizes accessibility | All 3D rendering on GPU (WebGL 2.0); no server-side compute |
| **Static Hosting Compatibility** | No backend server required; infinite scalability via CDN | Data must be preprocessed; no dynamic queries or filters server-side |
| **No User Authentication (v1.0)** | Public-by-design; privacy-first | No user accounts, no persistent identity tracking, no session state |
| **Offline Capability** | Rural/low-bandwidth users; classroom reliability | Initial 50 MB download cached; app functions without network (except live updates, v2.0+) |
| **Open Source (MIT License)** | Community collaboration, transparency, sustainability | All dependencies MIT/Apache/BSD compatible; no GPL, no proprietary code |
| **Responsive Single Codebase** | One app, all devices | No native iOS/Android apps (v1.0-v1.1); web wrapper for app stores |
| **Sub-2 Minute TTI** | User retention & SEO | Lazy-load data, code-splitting, service worker prefetch |
| **No Real-Time Backend** | Simplify deployment, avoid synchronization complexity | Multi-user sharing deferred to v1.2+ (local P2P via WebRTC or centralized v2.0) |

### 8.2 Recommended Architecture Stack

```
Frontend:
  - React 18+ (UI component framework)
  - Three.js r184+ (WebGL 3D abstraction)
  - TypeScript 5+ (type safety)
  - Vite (build bundler, <2MB output)
  - React Query / SWR (async state management)
  - GSAP (animation library, smooth transitions)
  - Web Audio API (native, no external lib)

Data & Storage:
  - IndexedDB (local cache, persistent across sessions)
  - Service Worker (offline capability, data prefetching)
  - msgpack / Protocol Buffers (compact serialization)
  - Brotli compression (CDN pre-compress)

Testing & QA:
  - Jest (unit tests, >80% coverage target)
  - React Testing Library (component tests)
  - Playwright / Puppeteer (e2e tests, headless browser automation)
  - Lighthouse CI (performance regression testing)
  - Axe DevTools (accessibility testing)

DevOps & Deployment:
  - GitHub Actions (CI/CD pipelines)
  - AWS CloudFront or Cloudflare (CDN, 99.9% uptime SLA)
  - Sentry / Rollbar (error tracking)
  - Google Analytics 4 (anonymized analytics)
  - Webpack / Esbuild (asset bundling, code splitting)

Development Environment:
  - Node.js 18+ LTS
  - npm 9+ or pnpm (package management)
  - ESLint + Prettier (code style, formatting)
  - Pre-commit hooks (husky, lint-staged)
  - Docker (local dev environment parity)
```

### 8.3 Scalability Considerations

| Aspect | Target | Strategy |
|--------|--------|----------|
| **Concurrent Users** | 100K CCU on static hosting | CDN edge caching + Service Worker (no backend bottleneck) |
| **Data Load Growth** | 1.8B stars, 1M galaxies, cosmic web | LOD + spatial indexing (octree); on-demand loading per viewport |
| **Network Bandwidth** | <50 MB initial, <1 Mbps sustained | Compression (Brotli), progressive data loading, aggressive LOD |
| **Memory Footprint** | <256 MB mid-range device | GPU memory pooling, texture atlasing, indexed drawing calls |
| **Future Data Sources** | Custom catalogs, real-time updates | Plugin API (v2.0) + data import interface |

---

## 9. RELEASE PLAN & ROADMAP

### 9.1 MVP (v0.1) — Months 1-2
**Goal**: Proof of concept; demonstrate seamless multi-scale exploration.
- Solar System (planets, major moons, accurate orbits).
- 10K brightest stars + constellation lines.
- Basic camera (WASD + mouse), time simulation, info panel.
- FPS: 60 on GTX 1060; TTI <3s.

### 9.2 v1.0 — Months 3-6
**Goal**: Production-ready, feature-complete for educators & enthusiasts.
- Full Milky Way (spiral arms, galactic center, dust lane).
- 100K+ stars; nebulae (20 major); clusters.
- Guided tours (5) with narration; audio system.
- Advanced search, bookmarks, settings, WCAG AA accessibility.
- Mobile touch controls; social sharing.

### 9.3 v1.1 — Months 7-9
**Goal**: Extragalactic expansion; community growth.
- 1M+ galaxies; galaxy clusters; superclusters.
- Cosmic web (filaments, voids, sheets).
- CMB boundary; observable universe visualization.
- Educator templates, multi-language support.
- Data pipeline publicly documented (GitHub).

### 9.4 v1.2 — Months 10-12
**Goal**: Polish, monetization foundation, educator features.
- Premium educator tier (team management, analytics).
- Commercial licensing (VR, kiosk).
- Advanced time-sim (historical events, predictions).
- Exoplanet overlay; variable stars; improved mobile.
- Multiplayer beta (shared sessions).

### 9.5 v2.0 — Months 13-18
**Goal**: Platform extensibility, VR, research integration.
- WebXR VR support (90 FPS target).
- Plugin API + marketplace.
- Real-time collaboration (multi-user).
- ML recommendations, data import API.
- Desktop app (Electron), LMS integrations.

---

## 10. MOSCOW PRIORITIZATION MATRIX

### Must Have (v1.0 Release)

| Feature | ID | Justification |
|---------|----|----|
| Solar System rendering | FR-301, FR-306 | Foundation; users expect planets |
| 100K+ stars | FR-401 | Core experience; Galactic scale |
| Camera navigation (WASD + mouse) | FR-101, FR-102 | Primary input method |
| Time simulation | FR-1001–FR-1011 | Core mechanic for orbital dynamics |
| Info panel (click object) | FR-901–FR-909 | Science education value |
| Responsive UI (mobile + desktop) | FR-1201–FR-1218 | Accessibility, market coverage |
| WCAG 2.1 AA accessibility | NFR-051–NFR-060 | Legal requirement, inclusive design |
| Static hosting deployment | (Architecture) | Scalability, no backend cost |
| Performance (60 FPS, <2.5s TTI) | NFR-001–NFR-020 | Core value; determines usability |
| Search functionality | FR-1210 | Essential UX for 1B objects |

### Should Have (v1.1 Release)

| Feature | ID | Justification |
|---------|----|----|
| Guided tours with narration | FR-1401–FR-1405 | Education market acquisition |
| Audio system (ambient + spatial) | FR-1101–FR-1110 | Immersion, content differentiation |
| 1M+ galaxies (extragalactic) | FR-701–FR-707 | Cosmological scale story |
| Milky Way detailed structure | FR-601–FR-610 | Localizes user experience |
| Bookmarks / saved views | FR-108 | UX convenience, retention |
| Settings panel | FR-1204 | User customization |
| Social sharing | FR-1301–FR-1306 | Viral growth, user engagement |
| Educator templates | FR-1407 | Education market expansion |
| Touch controls (mobile) | FR-111 | Mobile usability |
| Multiple camera modes (orbit, teleport, guided) | FR-102, FR-103, FR-104 | Interaction variety |

### Could Have (v1.2–v2.0)

| Feature | ID | Timeline |
|---------|----|----|
| VR support (WebXR) | (Full VR system) | v2.0 |
| Plugin API + marketplace | (Platform extensibility) | v2.0 |
| Premium educator tier | (Freemium model) | v1.2 |
| Commercial licensing | (Revenue model) | v1.2 |
| Real-time collaboration | (Multiplayer) | v1.2–v2.0 |
| ML recommendations | (Personalization) | v2.0 |
| Desktop app (Electron) | (Native distribution) | v2.0 |
| Institutional LMS integration | (Blackboard, Canvas, Moodle) | v2.0 |
| Advanced time-sim (events, predictions) | FR-1009, FR-1010 | v1.2 |
| Exoplanet system overlay | FR-415 | v1.2 |
| Variable star animation | FR-409 | v1.2 |
| Procedural nebula generation | (Out of scope, v2.0 plugin) | Won't (core) |

### Won't Have (Beyond Scope)

| Feature | Rationale |
|---------|-----------|
| Real N-Body physics simulation | Contradicts "real data" principle; CPU-heavy; reference external tools |
| User-generated 3D assets | Moderation burden; data integrity risk |
| Satellite real-time tracking | Privacy (user location inference); depends on live API availability |
| Spectroscopy viewer (full) | Data availability; specialized use case; reference SIMBAD |
| Procedural planet generation | Contradicts "real data"; only if alternate-reality mode (v2.0 plugin) |
| Game-like scoring / achievement systems | Contradicts serious astronomy tone; opaque in educational context |
| Ads / intrusive monetization | Contradicts free-by-default; premium tier only (v1.2+) |
| Desktop-only features | Responsive design principle; all features mobile-capable |

---

## 11. RISKS & MITIGATIONS (SUMMARY)

### High-Risk Areas

| Risk | Impact | Probability | Mitigation |
|------|--------|-----------|-----------|
| **WebGL 2.0 adoption <95%** | v0.1 unusable for 5%+ users | Medium | Fallback canvas 2D rendering for non-WebGL browsers; graceful degradation |
| **Gaia DR3 data licensing ambiguity** | Legal challenge to data use | Low | Written confirmation from ESA; CC-BY 4.0 license documented |
| **Performance regression at scale (1M+ objects)** | App unusable at full catalog | Medium | Aggressive LOD testing; performance budgets in CI/CD; early scale testing with 100K → 1M progression |
| **Community adoption slower than projected** | Revenue model at risk; slower feature velocity | Medium | Active marketing (Reddit, Twitter, astronomy forums); GitHub sponsorship; educational partnerships |
| **Graphics regression on specific GPU drivers** | Crashes on certain configurations | Medium | Comprehensive GPU testing lab (NVIDIA/AMD/Intel); WebGL error reporting telemetry; driver-specific workarounds |
| **Mobile platform fragmentation** | Inconsistent iOS/Android experience | Low | Progressive enhancement; test on 5+ popular devices per OS; Browserstack automated testing |
| **Time-sim accuracy concerns from researchers** | Credibility loss; research use rejected | Low | Peer review of orbital mechanics; cross-validation with JPL; publish methodology paper |
| **Audio Web API latency issues** | Spatial audio panning lags video | Low | Implement audio loop-back testing; graceful disable if latency >100ms detected |
| **CDN outage during critical press event** | Bad publicity; lost opportunity | Low | Multi-CDN strategy (CloudFront primary, Cloudflare secondary); status page; offline data bundle |
| **Accessibility audit fails at 11th hour** | v1.0 delayed; market opportunity lost | Medium | Early WCAG testing (month 2); hire accessibility consultant (month 3); Axe DevTools in CI |

---

## 12. APPENDICES

### APPENDIX A: EXTENDED GLOSSARY (40+ Terms)

[Glossary section 1.6 above — duplicated here for comprehensive reference in appendices]

### APPENDIX B: ASTRONOMICAL CONSTANTS

| Constant | Symbol | Value | Units | Context |
|----------|--------|-------|-------|---------|
| **Astronomical Unit** | AU | 149,597,870.7 | km | Earth-Sun distance (definition) |
| **Light-Year** | ly | 9.461×10¹² | km | Distance light travels in vacuum per year |
| **Parsec** | pc | 3.086×10¹³ | km | 1 pc = distance at which 1 AU subtends 1 arcsecond |
| **Solar Radius** | R☉ | 695,700 | km | Sun's photospheric radius |
| **Solar Mass** | M☉ | 1.989×10³⁰ | kg | Mass of the Sun |
| **Solar Luminosity** | L☉ | 3.828×10²⁶ | W | Sun's total power output |
| **Earth Mass** | M⊕ | 5.972×10²⁴ | kg | Mass of Earth |
| **Earth Radius** | R⊕ | 6,371 | km | Mean Earth radius |
| **Moon Mass** | M☾ | 7.342×10²² | kg | Mass of Earth's Moon |
| **Moon Orbital Period** | P☾ | 27.322 | days | Sidereal month |
| **Earth Rotation Period** | P⊕ | 0.997 | days | Sidereal day |
| **Earth Orbital Period** | T⊕ | 365.256 | days | Tropical year (J2000.0) |
| **Solar System Escape Velocity** | v_esc | 42.1 | km/s | At Earth's orbit |
| **Hubble Constant** | H₀ | 67.4 ± 0.5 | km/s/Mpc | Expansion rate (Planck 2018) |
| **Cosmic Microwave Background Temperature** | T_CMB | 2.72548 ± 0.00057 | K | Current universe temperature |
| **Hubble Radius** | R_H | 1.4×10²⁶ | m | c / H₀ (approximate universe age × c) |
| **Planck Constant** | h | 6.62607015×10⁻³⁴ | J·s | Quantum action unit |
| **Speed of Light** | c | 299,792,458 | m/s | Maximum velocity in vacuum |
| **Gravitational Constant** | G | 6.67430×10⁻¹¹ | m³/(kg·s²) | Newton's constant |
| **Boltzmann Constant** | k_B | 1.380649×10⁻²³ | J/K | Thermal energy unit |
| **Stefan-Boltzmann Constant** | σ | 5.670374×10⁻⁸ | W/(m²·K⁴) | Blackbody radiation intensity |
| **Age of Universe** | t_0 | 13.787 ± 0.020 | Gyr | Current cosmic age (Planck 2018) |
| **Observable Universe Radius** | R_obs | 4.40×10²⁶ | m | Comoving distance to surface of last scattering (CMB) |
| **Galaxy Count (Observed)** | N_gal | ~2×10¹¹ | unitless | Updated estimate from Conselice et al. 2016 |
| **Milky Way Mass** | M_MW | 1.5–2.0×10¹² | M☉ | Total (dark + luminous) |
| **Milky Way Disk Radius** | R_disk | ~15 | kpc | Stellar disk visible extent |
| **Galactic Year** | T_gal | 225–250 | Myr | Sun's orbital period around GC |
| **Sun's Galactocentric Distance** | d_GC | 26.673 ± 0.165 | kly | Distance to Galactic center |
| **Andromeda Distance** | d_M31 | 2.537 ± 0.024 | Mly | Most precise current estimate |
| **Andromeda Mass** | M_M31 | 1.0×10¹² | M☉ | Total mass (dark + visible) |
| **Virgo Cluster Distance** | d_Virgo | 65 ± 3 | Mly | Dominant nearby cluster |
| **Coma Cluster Distance** | d_Coma | 320 ± 10 | Mly | Major galaxy cluster |
| **Laniakea Radius** | R_Laniakea | ~250 | Mly | Local supercluster extent |
| **Crab Nebula Distance** | d_Crab | 2.0 ± 0.2 | kly | Supernova remnant (1054) |
| **Orion Nebula Distance** | d_Orion | 430 ± 20 | pc | Star-forming region |
| **Betelgeuse Distance** | d_Betelgeuse | 764 ± 116 | ly | Red supergiant (Gaia EDR3) |
| **Sirius Distance** | d_Sirius | 8.6 ± 0.04 | ly | Brightest star |
| **Proxima Centauri Distance** | d_ProxCen | 4.24 | ly | Nearest star |
| **Polaris Distance** | d_Polaris | 430–460 | ly | North Pole Star (binary system) |

### APPENDIX C: STELLAR SPECTRAL CLASSIFICATION TABLE

| Spectral Type | Effective Temp (K) | Color | B-V Index | Mass (M☉) | Luminosity (L☉) | Examples | Fraction (%) |
|---|---|---|---|---|---|---|---|
| **O** | 30,000–50,000 | Blue | -0.40 to -0.30 | >16 | >30,000 | Rigel, Zeta Orionis | 0.00003 |
| **B** | 10,000–30,000 | Blue-white | -0.30 to -0.02 | 2.1–16 | 25–30,000 | Sirius B, Spica, Vega | 0.13 |
| **A** | 7,500–10,000 | White | -0.02 to +0.06 | 1.4–2.1 | 5–25 | Sirius, Altair, Vega | 0.6 |
| **F** | 6,000–7,500 | Yellow-white | +0.06 to +0.30 | 1.04–1.4 | 1.5–5 | Procyon A, Canopus | 3.0 |
| **G** | 5,200–6,000 | Yellow | +0.30 to +0.63 | 0.8–1.04 | 0.6–1.5 | **Sun (G2V)**, Alpha Centauri A | 7.6 |
| **K** | 3,700–5,200 | Orange | +0.63 to +1.15 | 0.45–0.8 | 0.08–0.6 | Aldebaran, Arcturus | 12.3 |
| **M** | 2,400–3,700 | Red | >+1.15 | 0.08–0.45 | 0.0001–0.08 | Betelgeuse (M2), Proxima Centauri (M5.5) | 76.45 |

**Luminosity Classes (added to type)**:
- Ia: Hypergiant (e.g., Deneb A)
- Ib: Bright supergiant (e.g., Betelgeuse, M2Ib)
- II: Bright giant (e.g., Polaris, F7Ib-II)
- III: Giant (e.g., Aldebaran, K5III)
- IV: Subgiant (e.g., Procyon A, F5IV-V)
- V: Main sequence / Dwarf (e.g., Sun, G2V; Proxima Centauri, M5.5V)
- VI: Subdwarf (e.g., LHS 288, M6.5VI)
- VII: White dwarf (e.g., Sirius B, DA2)

### APPENDIX D: COORDINATE SYSTEM CONVERSIONS

| From | To | Formula | Libraries |
|------|----|---------|----|
| **Equatorial (RA, Dec) to Cartesian (X, Y, Z)** | Cartesian (pc) | X = d × cos(Dec) × cos(RA); Y = d × cos(Dec) × sin(RA); Z = d × sin(Dec) | astropy.coordinates |
| **Galactic (l, b) to Equatorial** | RA, Dec | Via rotation matrix (Hipparcos frame → Galactic frame) | astropy |
| **Ecliptic (λ, β) to Equatorial** | RA, Dec | λ' = λ, β' = β rotated by obliquity ε = 23.44° | astropy |
| **Proper Motion (μα, μδ) to Cartesian Velocity** | V_x, V_y, V_z (km/s) | Component of 3D velocity perpendicular to sight line | Custom; astropy |
| **Parallax (p, arcsec) to Distance** | d (parsec) | d = 1 / p (in arcsec); 1 pc ≈ 3.086 × 10¹³ km | Direct; astropy |
| **Apparent Magnitude (m) to Absolute Magnitude (M)** | M | M = m - 5 × log₁₀(d) + 5 (d in parsecs) | Custom formula |
| **B-V Color Index to RGB** | (R, G, B) | Taffel et al. polynomials; spectral type lookup | Colorsys; custom |
| **Redshift (z) to Distance (Comoving)** | d_c (Mpc) | Friedmann integral: d_c = (c / H₀) × ∫[0 to z] dz' / E(z') | astropy.cosmology |
| **Radial Velocity to Recession Velocity** | v_r (km/s) | v_r ≈ z × c (for z < 0.1); else relativistic correction | Custom formula |

**Recommended Libraries**:
- `astropy.coordinates`: Professional-grade coordinate transformations.
- `astropy.cosmology`: ΛCDM cosmological calculations.
- Custom Three.js shaders: GPU-accelerated coordinate space conversion in vertex shaders.

### APPENDIX E: USER INTERFACE WIREFRAME DESCRIPTIONS

#### E1. Main Canvas Layout (Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│  Cosmos Explorer                             [?] [⚙] [☆] [≡] │  <- Header (minimal)
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ╔════════════════════════════════════════════════════════╗  │
│  ║                                                        ║  │
│  ║            3D WEBGL CANVAS                            ║  │
│  ║         (Planets, Stars, Galaxies)                    ║  │
│  ║                                                        ║  │
│  ║  [Scale Indicator: Galactic Scale (100 ly–100 kly)]  ║  │ <- HUD (overlay)
│  ║  [Coordinates: RA 12h30m Dec +45°]                   ║  │
│  ║  [Speed: 1000 km/s]                                  ║  │
│  ║                                                        ║  │
│  ╚════════════════════════════════════════════════════════╝  │
│                                                               │
│  [◀ Back] [Search: "Alpha Centauri"...] [Play ▶] [Speed ━] │ <- Footer (controls)
│  [FPS: 60]  [Memory: 156 MB]                                 │
└─────────────────────────────────────────────────────────────┘

  Right-Click Context Menu (on object):
  ├─ 📍 Go To
  ├─ ℹ Info
  ├─ 🔄 Orbit Around
  ├─ 📊 Compare
  ├─ 📌 Bookmark
  └─ 🔗 Share
```

#### E2. Info Panel (Right Sidebar, 30% width)

```
┌──────────────────────────┐
│ ✕ Sirius                  │  <- Title, close button
├──────────────────────────┤
│                          │
│ Type: Star (A1V)         │
│ Distance: 8.6 ly         │
│ RA: 06h45m09s            │
│ Dec: -16°42'46"          │
│ Apparent Mag: -1.46      │
│ Abs Mag: +1.42           │
│ Color (B-V): +0.00       │
│ Spectral Type: A1V       │
│ Mass: 2.02 M☉            │
│ Radius: 1.71 R☉          │
│ Luminosity: 25.4 L☉      │
│ Proper Motion: -546, 1223 mas/yr │
│ Radial Velocity: -5.5 km/s │
│                          │
│ 📖 Sirius (Wikipedia)     │
│ 🔗 SIMBAD Entry          │
│ 🔗 NASA StarCharts       │
│                          │
│ [━━ Hide Info ━━]        │
└──────────────────────────┘
```

#### E3. Settings Panel (Modal, Center)

```
┌────────────────────────────────────────┐
│ ⚙ Settings                       [✕]   │
├────────────────────────────────────────┤
│ [Graphics] [Audio] [Input] [Units]    │
├────────────────────────────────────────┤
│ GRAPHICS                               │
│ ├─ Quality:         [Low ▼]            │
│ ├─ Draw Distance:   [100 ly ▼]        │
│ ├─ Bloom Effect:    [✓]               │
│ ├─ Lensing:         [☐]               │
│ ├─ Motion Blur:     [☐]               │
│ └─ FPS Limit:       [60 ▼]            │
│                                        │
│ AUDIO                                  │
│ ├─ Master Volume:   [━━━━━━ 75%]      │
│ ├─ Ambient:         [━━━━━ 60%]       │
│ ├─ Spatial:         [━━━━━━━ 85%]     │
│ ├─ UI Sounds:       [✓]               │
│ └─ Mute on Tab Hide: [✓]              │
│                                        │
│               [Save] [Cancel]          │
└────────────────────────────────────────┘
```

#### E4. Mobile Layout (Portrait, <768px)

```
┌──────────────────────────┐
│ Cosmos Explorer   [≡]    │  <- Header icons only
├──────────────────────────┤
│                          │
│  ╔════════════════════╗  │
│  ║                    ║  │
│  ║   3D CANVAS        ║  │
│  ║                    ║  │
│  ║  [HUD Compact]     ║  │
│  ║  Scale: Galactic   ║  │
│  ║                    ║  │
│  ╚════════════════════╝  │
│                          │
│  [Search...]             │
│  [Play ▶] [+] [Speed]   │
│                          │
│  ┌────────────────────┐  │  <- Full-screen sheet
│  │ ✕ Sirius         │  │     (swipe up from bottom)
│  │                  │  │
│  │ Star, 8.6 ly     │  │
│  │ RA: 06h45m09s    │  │
│  │ Dec: -16°42'46"  │  │
│  │ Mag: -1.46       │  │
│  │                  │  │
│  │ [More Info ▼]    │  │
│  └────────────────────┘  │
└──────────────────────────┘
```

---

## CONCLUSION

This PRD specifies Cosmos Explorer as a comprehensive, scientifically grounded, open-source browser-based universe visualization platform. Success hinges on:

1. **Seamless multi-scale navigation** without loading screens (technical challenge; core differentiator).
2. **Real astronomical data accuracy** (Gaia, SDSS, JPL) with transparent attribution (credibility).
3. **Accessibility & ease-of-use** for learners, educators, and casual explorers (market reach).
4. **Performance excellence** (60 FPS, <2.5s TTI) on commodity hardware (usability, adoption).
5. **Community-driven open-source model** (sustainability, extensibility, trust).

Metrics for success: 1M MAU by Year 2; 100+ educator adoptions; 5K GitHub stars; positive community sentiment; research citations; sustainable revenue model (freemium, v1.2+).

---

**Document End**

**Next Steps for Development Team**:
- Assign technical leads per feature area (navigation, rendering, data pipeline, audio, UI).
- Define sprint structure (2-week sprints; feature-based planning).
- Establish performance budgets and testing CI/CD.
- Schedule stakeholder reviews at end of each milestone (MVP, v1.0, v1.1).
- Create detailed technical specifications from this PRD (TDD-driven development).

