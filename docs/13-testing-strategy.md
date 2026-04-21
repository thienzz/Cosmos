# Cosmos Explorer: Testing Strategy

**Version:** 2.1  
**Date:** 2026-04-19  
**Status:** Active

---

## 1. Testing Philosophy

Quality is non-negotiable for scientific software. Cosmos Explorer presents astronomical data to users worldwide—accuracy and reliability directly impact scientific understanding and trust.

### Core Principles

- **Data Accuracy = Trust**: Incorrect celestial coordinates or planet positions undermine scientific credibility. Every calculation must be verified against authoritative sources (JPL Horizons, Gaia DR3, SDSS).
- **Performance = Usability**: A beautiful visualization is worthless at 15 FPS or with 5-second load times. Real-time interaction demands consistently high frame rates across device tiers.
- **Accessibility = Inclusion**: Astronomical research spans diverse audiences. Keyboard navigation, screen readers, and color-blind-friendly rendering are functional requirements, not afterthoughts.
- **Regression Prevention**: Each feature added must preserve existing behavior. Visual regression testing, performance baselines, and data validation gates prevent silent degradation.

---

## 2. Test Pyramid

Cosmos Explorer employs a balanced test pyramid optimized for scientific visualization software:

```
         E2E Tests (10%)
       /              \
      /   Integration  \
     /   Tests (20%)    \
    /____________________\
   /                      \
  /   Unit Tests (70%)     \
 /____________________________\
```

- **Unit Tests (70%)**: Pure, deterministic functions with isolated dependencies
- **Integration Tests (20%)**: Cross-module interactions (data pipeline, rendering system, UI state)
- **E2E Tests (10%)**: Complete user journeys with real browser rendering

This distribution favors fast unit tests (quick feedback) while maintaining coverage of complex workflows through integration tests.

---

## 3. Unit Testing

### Framework: Vitest

- **Why Vitest**: ESM-native, built for Vite, instant HMR, excellent snapshot support
- **Configuration**: Includes jsdom environment for DOM APIs, happy-dom for lighter testing
- **Test Discovery**: Files matching `**/*.test.ts`, `**/*.spec.ts`

### Coverage Targets

| Module Category | Target | Rationale |
|---|---|---|
| Core physics/math | >90% | Kepler solver, coordinate transforms—mission-critical |
| Data parsers | >85% | Binary parsing, validation—must handle edge cases |
| Utility functions | >80% | General threshold for algorithm/logic coverage |
| UI components | >70% | Lower threshold acceptable (more visual/contextual) |
| Integration layer | >75% | API clients, data loaders |

### Key Test Areas

#### 3.1 Coordinate Conversions

Test bidirectional transformations with known reference values:

- **Equatorial ↔ Galactic**: Convert Sirius (RA: 6h 45m 08.92s, Dec: +16° 42′ 58.0″) to galactic coordinates and back
- **Ecliptic ↔ Equatorial**: J2000 Earth position at vernal equinox
- **Cartesian ↔ Spherical**: Verify no singularity errors at poles
- **Precession**: Test precession from J2000 to current epoch (< 0.001 arcsecond error)

Test cases should include:
- Standard reference objects (Sirius, Polaris, Andromeda)
- Boundary conditions (poles, 0h RA, ecliptic bounds)
- Extreme values (high declinations, large distances)

#### 3.2 Kepler Equation Solver

The Kepler solver is critical for orbit visualization. Validation:

- **Accuracy**: Solutions must match JPL Horizons positions to < 0.01 AU
- **Reference objects**: Test against known ephemeris for Earth, Moon, Mars, Jupiter
- **Convergence**: Verify numerical solver converges in < 10 iterations
- **Edge cases**: High-eccentricity orbits (Comet Halley: e=0.967), test near perihelion and aphelion
- **Regression**: Maintain suite of 20+ ephemeris points (daily) validated against JPL

Sample test:
```javascript
test('Kepler solver: Earth position on 2026-04-16 matches JPL Horizons', () => {
  const position = keplerSolver(earthOrbitalElements, jd2026_04_16);
  expect(position.x).toBeCloseTo(jpIsoldes.earth.x, 6); // AU precision
  expect(position.distance).toBeLessThan(1.02); // Validate Earth's orbit bounds
});
```

#### 3.3 Spectral Type → Color Mapping

Validate star color rendering:

- **B-V Index conversion**: Test standard stars (Sirius B-V: 0.00, Betelgeuse B-V: 1.50)
- **RGB output**: Colors must match reference images (e.g., Betelgeuse = warm orange)
- **Edge cases**: Blue stars (B-V < -0.3), red dwarfs (B-V > 1.6)
- **Luminosity adjustment**: Brighter stars must appear more saturated
- **Gamma correction**: Verify perceptual brightness matches physical luminosity

#### 3.4 Logarithmic Scale Calculations

For depth-of-field and magnitude mapping:

- **Scale factors**: Verify log(distance) transforms maintain render order
- **Magnitude to brightness**: Test apparent magnitude → pixel brightness (20 mag → barely visible, 0 mag → saturated)
- **No NaN/Infinity**: Test with zero distances, negative magnitudes, extreme values
- **Performance**: Logarithm calculations must complete in < 1ms for 100k objects

#### 3.5 Binary Data Parser

For efficient star catalog loading:

- **Format correctness**: Parse binary blocks, validate checksum (CRC32)
- **Byte order**: Test both little-endian and big-endian data
- **Truncation handling**: Gracefully handle truncated files (end at record boundary)
- **Type conversions**: Verify float32→float64 promotion without precision loss
- **Large catalog**: Parse 10M-record file in < 2 seconds
- **Malformed input**: Reject invalid headers, missing fields, corrupt checksums

#### 3.6 Search Algorithm & Relevance Ranking

Test search accuracy and performance:

- **Exact match**: "Sirius" returns Sirius first
- **Fuzzy match**: "Sirus" (typo) still ranks Sirius high
- **Category filtering**: Searching "stars" excludes galaxies
- **Distance-based ranking**: Nearby objects rank higher than distant ones for same name
- **Performance**: Search 1M catalog entries in < 100ms
- **Unicode handling**: Names with accents, non-Latin scripts

#### 3.7 Time Simulation Step Accuracy

Verify continuous and stepped time progression:

- **Step size**: Increment time by configurable steps (1 sec, 1 hour, 1 year)
- **Leap year handling**: 2000, 2004, 2100 test cases
- **Julian Date calculation**: Compare against USNO ephemeris
- **Continuity**: No time jumps when mode switches from auto-play to manual
- **Performance**: Update positions for 10k objects per frame at 60 FPS

### Test Data

Maintain a reference dataset of verified objects:

| Object | Type | RA | Dec | Distance | Magnitude | Source |
|---|---|---|---|---|---|---|
| Sirius | Star | 6h45m08.92s | +16°42'58.0" | 2.64 pc | -1.46 | Gaia DR3 |
| Earth | Planet | varies | varies | 1 AU | N/A | JPL Horizons |
| Andromeda Galaxy | Galaxy | 00h42m44.3s | +41°16'09" | 2.54 Mly | 3.44 | SDSS |
| Betelgeuse | Star | 5h55m10.3s | +7°24'25.4" | 550 ly | 0.45 | Gaia DR3 |
| Mars | Planet | varies | varies | varies | varies | JPL Horizons |

---

## 4. Visual Regression Testing

### Tool Selection: Playwright Screenshot Comparison + Chromatic

- **Playwright**: Built-in `toHaveScreenshot()` for pixel-perfect comparisons
- **Chromatic**: Optional cloud-based review for human approval on changes
- **Alternative**: Storybook + Percy for component-level visual testing

### Capture Strategy

Capture reference screenshots at each scale level:

- **Solar System scale** (10 AU viewport)
- **Inner planets scale** (2 AU viewport)
- **Earth-Moon scale** (0.01 AU viewport)
- **Galaxy scale** (1000 ly viewport)
- **Deep field** (1 billion ly viewport)
- **Settings combinations**: Light/dark theme, label density, rendering quality

### Detection & Tolerance

- **Unintended changes to detect**:
  - Star color shifts (spectral type → RGB mismap)
  - Label position drift (text offset > 2 pixels)
  - Orbit line thickness changes
  - UI layout shifts (buttons, sliders, panels)
  - Lighting/shadow artifacts

- **Tolerance**: < 0.5% pixel difference (accounts for anti-aliasing, text rasterization variance)
- **Flaky test mitigation**: 
  - Disable animations in headless tests
  - Fixed random seed for procedural generation
  - Wait for frame stability before capture

### CI Integration

```bash
# Run baseline comparison
playwright test --config=playwright-visual.config.ts

# On failure, review diffs at ./test-results/
# Approve new baseline if intentional
npx playwright show-report
```

### Visual QA Acceptance Criteria (Cross-Reference: Doc 18 §Visual QA)

The rendering pipeline uses scientific accuracy standards defined in **Doc 18 — Visual Rendering & Shader Specification §Visual QA Acceptance Criteria**. These criteria must be integrated into the CI visual regression suite.

**Color Accuracy — CIE ΔE2000:**

| Entity Category | Max Average ΔE | Max Single-Point ΔE | Tool |
|----------------|---------------|---------------------|------|
| Stars (spectral type → color) | 3.0 | 8.0 | `color-diff` npm package |
| Rocky/Gas Planets | 5.0 | 10.0 | `color-diff` npm package |
| Nebulae (emission/reflection) | 4.0 | 12.0 | `color-diff` npm package |
| Galaxies | 8.0 | 15.0 | `color-diff` npm package |
| Exoplanets (procedural) | 10.0 | 20.0 | `color-diff` npm package |

Reference samples: 100 random screen-space points per entity render vs. NASA/ESA reference imagery.

**Structural Similarity — SSIM:**

Each entity render at LOD 0 must achieve SSIM > 0.65 against reference baseline renders (not NASA photos — procedural shaders produce intentional artistic variation). Baseline snapshots are stored in `test/visual-baselines/` and updated per release.

**Perceptual Hash Regression — pHash:**

All entity types must be screenshotted at 5 canonical camera angles per release. Snapshots are compared against the previous release using perceptual hash (pHash). A Hamming distance > 8 triggers mandatory human review. Implementation: `imghash` or `blockhash-js`.

**Animation Quality Standards (from Doc 18):**

| Entity Type | Min Sustained FPS | Max Frame Jitter |
|-------------|-------------------|------------------|
| Star corona, surface convection | 55 FPS | < 3ms |
| Planet rotation, ring dynamics | 58 FPS | < 2ms |
| Nebula volumetric raymarching | 45 FPS | < 5ms |
| Black hole lensing + accretion disk | 40 FPS | < 6ms |
| Cosmic web filaments | 50 FPS | < 4ms |

These benchmarks apply at the target GPU tier (Desktop Mid: GTX 1660 equivalent). Lower-tier devices use the overbudget fallback strategy (Doc 18 §Shader Performance Budget).

**Integration into CI pipeline:**

```bash
# Run color accuracy tests
npm run test:visual-qa -- --suite=color-accuracy

# Run SSIM baseline comparison
npm run test:visual-qa -- --suite=ssim

# Run pHash regression
npm run test:visual-qa -- --suite=phash-regression

# Run animation benchmark (requires GPU runner)
npm run test:visual-qa -- --suite=animation-fps
```

---

## 5. Performance Testing

### Benchmark Suite

Measure three performance tiers at each scale level:

#### 5.1 Frame Rate & Timing

| Metric | Target | Tool |
|---|---|---|
| FPS (avg) | ≥58 @ 60Hz | Chromium DevTools, Playwright metrics |
| Frame time (p95) | ≤17ms | Performance Observer |
| Time to Interactive (TTI) | ≤3s | Lighthouse, custom instrumentation |
| First Contentful Paint (FCP) | ≤1.5s | WebVitals library |

#### 5.2 Load Time Testing

- **Cold start**: No cache, full bundle download + parse + render
  - Target: ≤4 seconds (including network latency)
- **Warm start**: JavaScript cached, only data fetch
  - Target: ≤1.5 seconds
- **Measure**: Network throttling (3G, 4G LTE), CPU throttling (mid-tier mobile)

#### 5.3 Stress Testing

Determine maximum objects before FPS degradation:

```javascript
test('Rendering performance: FPS stays ≥30 with 100k star objects', async () => {
  const catalog = generateTestCatalog(100000);
  const fps = await measureFPS(canvas, () => {
    renderStars(catalog);
    animate();
  });
  expect(fps).toBeGreaterThanOrEqual(30);
});
```

- Test incremental loads: 10k, 50k, 100k, 500k, 1M objects
- Record draw call count and memory usage at each level
- Target: Graceful degradation; LOD system reduces star count before FPS cliff

#### 5.4 Memory Leak Detection

Continuous navigation session (10 minutes):

- **Baseline**: Measure heap size after initial load (garbage collection)
- **Navigation loop**: Pan, zoom, search, time-step repeatedly
- **Final measurement**: Heap size should not grow > 10% above baseline
- **Tool**: Chrome DevTools heap snapshots, Playwright memory API
- **Automation**: CI script runs leak test, fails build if > 5% growth

```javascript
test('Memory stability: 10-minute navigation session', async ({ page }) => {
  const baseline = await getHeapSize(page);
  
  for (let i = 0; i < 100; i++) {
    await page.click('[data-nav="pan-left"]');
    await page.waitForFunction(() => !isAnimating());
    await page.evaluate(() => forceGarbageCollection());
  }
  
  const final = await getHeapSize(page);
  expect((final - baseline) / baseline).toBeLessThan(0.10);
});
```

#### 5.5 Device Matrix Testing

Test across three GPU tiers:

| Tier | Device | GPU | Target FPS |
|---|---|---|---|
| High | MacBook Pro M3 | 8-core GPU | 60 FPS @ 1M objects |
| Mid | iPad Air 5 | A14 Bionic | 50 FPS @ 100k objects |
| Low | Pixel 4a | Adreno 619 | 30 FPS @ 10k objects |

Run automated tests on physical devices via BrowserStack or Sauce Labs. Capture baseline FPS per device in CI reports.

#### 5.6 CI/CD Integration

```yaml
# .github/workflows/performance.yml
performance-test:
  runs-on: ubuntu-latest
  steps:
    - name: Run benchmark suite
      run: npm run test:performance
    - name: Compare against baseline
      run: |
        if [[ $(cat metrics.json | jq .fps) -lt $(cat baseline.json | jq .fps-1pct) ]]; then
          echo "FPS dropped > 10% from baseline"
          exit 1
        fi
    - name: Upload metrics
      uses: actions/upload-artifact@v3
      with:
        name: performance-metrics
        path: metrics.json
```

Fail build if FPS drops > 10% from baseline, allowing intentional optimizations to be approved in PR.

---

## 6. Data Accuracy Testing

Scientific credibility hinges on celestial data accuracy. Cosmos Explorer must verify that rendered positions match authoritative sources.

### Validation Targets

#### 6.1 Star Positions (Gaia DR3)

- **Tolerance**: < 1 arcsecond error
- **Validation**: Compare rendered RA/Dec against Gaia DR3 catalog for 100+ reference stars
- **Test sample**: Sirius, Polaris, Betelgeuse, Aldebaran, Rigel, Procyon, Vega, Arcturus, etc.
- **Automation**: Batch query Gaia API, compare coordinates in test

```javascript
test('Star positions match Gaia DR3 to <1 arcsecond', async () => {
  const testStars = [
    { name: 'Sirius', ra: 101.287, dec: 16.716 }, // degrees
    { name: 'Betelgeuse', ra: 88.793, dec: 7.407 },
  ];
  
  for (const star of testStars) {
    const rendered = getRenderedPosition(star.name);
    const gaia = await gaiaAPI.query(star.ra, star.dec);
    
    const error = angularDistance(rendered, gaia);
    expect(error).toBeLessThan(1 / 3600); // 1 arcsecond in degrees
  }
});
```

#### 6.2 Planet Positions (JPL Horizons)

- **Tolerance**: < 0.01 AU (1.5 million km)
- **Validation**: Compare heliocentric coordinates for Sun, Earth, Mars, Jupiter, Saturn (8 positions per planet × 30 reference dates)
- **Frequency**: Verify on each build; regression test suite runs daily with JPL ephemeris

```javascript
test('Planet positions match JPL Horizons to <0.01 AU', async () => {
  const dates = generateTestDates(2020, 2030, interval=30days);
  
  for (const date of dates) {
    const jd = dateToJulianDate(date);
    const rendered = keplerSolver(earthOrbitalElements, jd);
    const jpl = await queryHorizons('399', jd); // Earth body ID
    
    const error = distance(rendered, jpl);
    expect(error).toBeLessThan(0.01); // AU
  }
});
```

#### 6.3 Galaxy Positions (SDSS)

- **Tolerance**: < 0.1 arcminute
- **Validation**: Spot-check 20 galaxies (Andromeda, M33, M51, etc.) against SDSS coordinates
- **Cross-validation**: Visually compare galaxy positions in Cosmos Explorer with reference images from Sloan Digital Sky Survey

#### 6.4 Cross-Validation with Reference Software

Compare rendering with authoritative planetarium software:

- **Stellarium**: Compare star field rendering at various scales
- **Gaia Sky**: Compare galaxy/nebula positions and colors
- **JPL Horizons Web**: Validate planet positions and visual magnitude

Process:
1. Set both applications to same date/time
2. Navigate to same sky region
3. Verify object positions align (< 1 arcminute variance)
4. Document any discrepancies with root cause analysis

### Regression Suite

Maintain a database of 50+ reference objects with known properties, verified each build:

| Object | Type | Property | Value | Source |
|---|---|---|---|---|
| Sirius | Star | Distance | 2.64 pc | Gaia DR3 |
| Sirius | Star | Absolute Mag | 1.42 | Gaia DR3 |
| Betelgeuse | Star | Color (B-V) | 1.50 | Hipparcos |
| Earth | Planet | Semi-major axis | 1.000 AU | IAU |
| Mars | Planet | Orbital period | 1.881 years | NASA |
| Andromeda | Galaxy | Distance | 2.54 Mly | NASA |

Automated test loads reference dataset, renders objects, and validates properties match within tolerance.

---

## 7. Integration Testing

### Framework: Vitest + Testing Library

Integration tests validate multi-component workflows without mocking external APIs.

### Key Flows

#### 7.1 Data Loading → Rendering

```javascript
test('Data pipeline: load catalog → parse → create buffers → render', async () => {
  const canvas = document.createElement('canvas');
  const scene = new Scene();
  
  const catalog = await loadCatalogFile('stars-gaia.bin');
  const mesh = createStarMesh(catalog);
  scene.add(mesh);
  
  expect(mesh.children.length).toBeGreaterThan(0);
  expect(mesh.geometry.attributes.position.array.length).toBe(catalog.length * 3);
});
```

#### 7.2 Search → Navigation

```javascript
test('Search integration: query → result highlight → camera animation', async ({ page }) => {
  await page.fill('input[aria-label="Search"]', 'Sirius');
  await page.click('button:has-text("Search")');
  
  const result = page.locator('[data-object-id="sirius"]');
  await expect(result).toBeVisible();
  
  // Camera should animate to object
  const camera = await page.evaluate(() => {
    return {
      x: window.cosmos.camera.position.x,
      y: window.cosmos.camera.position.y,
      z: window.cosmos.camera.position.z,
    };
  });
  
  expect(camera.z).toBeGreaterThan(0); // Zoomed in
});
```

#### 7.3 Time Simulation → Orbit Update

```javascript
test('Time system: increment time → recalculate orbits → update rendering', async ({ page }) => {
  const initialPos = await getObjectPosition(page, 'Earth');
  
  // Fast-forward 1 day
  await page.click('[data-control="time-day-forward"]');
  
  const newPos = await getObjectPosition(page, 'Earth');
  
  expect(newPos.x).not.toEqual(initialPos.x);
  expect(newPos.y).not.toEqual(initialPos.y);
  // Earth should have moved in its orbit
});
```

#### 7.4 Settings Change → UI Update

Test that setting changes propagate correctly:

```javascript
test('Settings: toggle labels → DOM updates immediately', async ({ page }) => {
  const labelsBefore = await page.locator('[data-star-label]').count();
  expect(labelsBefore).toBeGreaterThan(0);
  
  await page.click('input[aria-label="Show labels"]');
  
  const labelsAfter = await page.locator('[data-star-label]').count();
  expect(labelsAfter).toBe(0);
});
```

---

## 8. End-to-End (E2E) Testing

### Framework: Playwright

E2E tests simulate real user journeys with full browser rendering.

### Key User Flows

#### 8.1 First Load & Orientation

```javascript
test('First load: page loads → stars render → user can interact', async ({ page }) => {
  await page.goto('https://cosmos-explorer.example.com');
  await page.waitForLoadState('networkidle');
  
  // Stars should be visible
  const canvas = await page.locator('canvas').first();
  await expect(canvas).toBeVisible();
  
  // Timeline visible
  await expect(page.locator('[data-component="timeline"]')).toBeVisible();
  
  // Can rotate viewport
  await canvas.click();
  await page.mouse.move(100, 100);
  await page.mouse.move(200, 200);
  // Visual change indicates rotation success
});
```

#### 8.2 Navigate Solar System

```javascript
test('Solar System navigation: zoom in/out, select planets, read info', async ({ page }) => {
  await page.goto('https://cosmos-explorer.example.com');
  
  // Initial view: full Solar System
  const earthDistance = await page.evaluate(() => 
    window.cosmos.getObjectPosition('Earth').z
  );
  
  // Click Earth
  await page.click('[data-object="Earth"]');
  
  // Camera animates to Earth
  await page.waitForFunction(() => {
    const newDist = window.cosmos.getObjectPosition('Earth').z;
    return Math.abs(newDist) < Math.abs(earthDistance) * 0.5;
  });
  
  // Info panel shows Earth data
  await expect(page.locator('[data-panel="info"]')).toContainText('Earth');
  await expect(page.locator('[data-panel="info"]')).toContainText('Diameter');
});
```

#### 8.3 Zoom to Galaxy

```javascript
test('Deep space navigation: navigate to distant galaxy, view details', async ({ page }) => {
  await page.goto('https://cosmos-explorer.example.com');
  
  // Search for Andromeda
  await page.fill('input[aria-label="Search"]', 'Andromeda');
  await page.click('button:has-text("Go")');
  
  // Wait for navigation animation
  await page.waitForTimeout(3000);
  
  // Galaxy info visible
  await expect(page.locator('[data-object="M31"]')).toBeInViewport();
  await expect(page.locator('[data-panel="info"]')).toContainText('2.54 million light-years');
});
```

#### 8.4 Search & Filter

```javascript
test('Search flow: search term → filter results → select object', async ({ page }) => {
  await page.fill('input[aria-label="Search"]', 'Betel');
  
  // Results dropdown visible
  const dropdown = page.locator('[data-component="search-results"]');
  await expect(dropdown).toBeVisible();
  
  // Betelgeuse listed
  await expect(dropdown).toContainText('Betelgeuse');
  
  // Click to navigate
  await page.click('text=Betelgeuse');
  
  // Camera animates
  await page.waitForFunction(() => {
    return window.cosmos.selectedObject?.name === 'Betelgeuse';
  });
});
```

#### 8.5 Share & Social

```javascript
test('Share feature: current view → generate URL → copy to clipboard', async ({ page }) => {
  // Navigate to specific view
  await navigateToObject(page, 'Mars');
  
  // Click share button
  await page.click('[data-action="share"]');
  
  // Share dialog appears
  const shareUrl = await page.locator('[data-field="share-url"]').inputValue();
  expect(shareUrl).toContain('cosmos-explorer.example.com');
  expect(shareUrl).toContain('object=Mars');
  
  // Copy button works
  await page.click('[data-action="copy-url"]');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('Mars');
});
```

#### 8.6 Settings & Preferences

```javascript
test('Settings: adjust rendering quality → verify impact', async ({ page }) => {
  await page.goto('https://cosmos-explorer.example.com');
  await page.click('[data-action="settings"]');
  
  // Toggle quality presets
  await page.click('[data-setting="quality-low"]');
  
  // Verify visual quality reduced (lower star count visible)
  const starCount = await page.evaluate(() => window.cosmos.renderer.info.render.triangles);
  expect(starCount).toBeLessThan(1000000);
});
```

### Browser Matrix

Test across multiple browsers and versions:

| Browser | Min Version | Testing |
|---|---|---|
| Chrome | Latest - 1 | CI/CD automated |
| Firefox | Latest - 1 | CI/CD automated |
| Safari | Latest - 1 | BrowserStack (iOS 15+) |
| Edge | Latest - 1 | CI/CD automated |

### Mobile Testing

| Platform | Device | Browser | Network |
|---|---|---|---|
| iOS | iPhone 13 Pro | Safari | 4G LTE, WiFi |
| Android | Pixel 6 Pro | Chrome | 4G LTE, WiFi |

Test on real devices via BrowserStack; verify touch interactions (pinch zoom, pan) work correctly.

---

## 9. Accessibility Testing

### Keyboard Navigation Audit

Ensure all interactive elements are keyboard-accessible:

- **Tab order**: Logical progression through search, controls, timeline
- **Enter key**: Activate buttons, submit search
- **Arrow keys**: Pan viewport, adjust timeline
- **Escape key**: Close dialogs, deselect objects
- **Space bar**: Play/pause time simulation

```javascript
test('Keyboard navigation: all controls accessible via Tab', async ({ page }) => {
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement?.getAttribute('role'))).toBe('button');
  
  // Continue tabbing through all controls
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab');
    const element = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'INPUT', 'A']).toContain(element);
  }
});
```

### Screen Reader Testing

Verify compatibility with assistive technologies:

- **Tools**: NVDA (Windows), VoiceOver (macOS/iOS), TalkBack (Android)
- **Key elements**:
  - Canvas labels (alt text for WebGL output)
  - Button labels (aria-label on icon buttons)
  - Object info panel (semantic HTML structure)
  - Search results (live region updates)

```javascript
test('Screen reader: info panel has semantic structure', async ({ page }) => {
  await page.click('[data-object="Sirius"]');
  
  const infoPanel = page.locator('[data-component="info-panel"]');
  
  // Verify heading structure
  const heading = infoPanel.locator('h2');
  await expect(heading).toHaveText('Sirius');
  
  // Verify list structure for properties
  const list = infoPanel.locator('ul');
  await expect(list).toBeVisible();
});
```

### Color Contrast Verification (WCAG AA)

All UI text must meet WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text):

```javascript
test('Color contrast: all text meets WCAG AA', async ({ page }) => {
  const contrast = await page.evaluate(async () => {
    const axe = require('axe-core');
    const results = await axe.run();
    return results.violations.filter(v => v.id === 'color-contrast');
  });
  
  expect(contrast).toHaveLength(0);
});
```

### Reduced Motion Testing

Respect user `prefers-reduced-motion` preferences:

```javascript
test('Reduced motion: animations disabled when preferred', async ({ page }) => {
  // Simulate user preference for reduced motion
  await page.emulateMedia({ reducedMotion: 'reduce' });
  
  const duration = await page.evaluate(() => {
    return window.getComputedStyle(document.querySelector('[data-animation]')).animationDuration;
  });
  
  expect(duration).toBe('0s');
});
```

### Automated Accessibility Checks (axe-core)

Integrate axe-core into CI for automated WCAG checks:

```javascript
test('Automated accessibility scan', async ({ page }) => {
  const { injectAxe, checkA11y } = require('axe-playwright');
  
  await injectAxe(page);
  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: { html: true },
  });
});
```

---

## 10. Audio Testing

Cosmos Explorer includes procedural audio for an immersive experience. Audio tests verify functionality without introducing test noise.

### Test Environment Setup

```javascript
// Disable audio in headless tests to avoid noise
beforeAll(() => {
  if (process.env.CI) {
    window.AudioContext = jest.fn(() => ({
      createOscillator: jest.fn(),
      createGain: jest.fn(),
      destination: {},
    }));
  }
});
```

### Audio Generation Tests

```javascript
test('Procedural audio: generates without errors', async () => {
  const audioSystem = new ProceduralAudio();
  
  expect(() => {
    audioSystem.generateToneForObject({
      name: 'Sirius',
      frequency: 440,
      duration: 1000,
    });
  }).not.toThrow();
});

test('Audio: volume levels within comfortable range', () => {
  const audio = new ProceduralAudio();
  const buffer = audio.generateToneForObject({ frequency: 440, duration: 1000 });
  
  // Verify max amplitude < 1.0 (prevents clipping)
  const maxAmplitude = Math.max(...buffer.getChannelData(0));
  expect(maxAmplitude).toBeLessThan(1.0);
});
```

### Spatial Audio Tests

```javascript
test('Spatial audio: panning works correctly', () => {
  const context = new AudioContext();
  const panner = context.createPanner();
  const source = context.createOscillator();
  
  source.connect(panner);
  panner.setPosition(1, 0, 0); // Right
  
  expect(panner.getPosition()[0]).toBe(1);
  expect(panner.getPosition()[1]).toBe(0);
});
```

### Audio Mute/Unmute

```javascript
test('Audio controls: mute/unmute toggles gain', () => {
  const audioSystem = new AudioSystem();
  const gain = audioSystem.masterGain.gain.value;
  
  audioSystem.mute();
  expect(audioSystem.masterGain.gain.value).toBe(0);
  
  audioSystem.unmute();
  expect(audioSystem.masterGain.gain.value).toBe(gain);
});
```

### Audio Glitch Detection

```javascript
test('Audio: no glitches during scale transitions', async () => {
  const audio = new ProceduralAudio();
  
  for (let scale = 0; scale < 10; scale++) {
    expect(() => {
      audio.updateForScale(scale);
    }).not.toThrow();
  }
});
```

---

## 11. CI/CD Integration

### Pre-Commit Hooks

```bash
# .husky/pre-commit
#!/bin/sh

# Lint and type check
npm run lint --staged
npm run type-check

# Quick unit tests (< 5 seconds)
npm run test:unit -- --bail --maxWorkers=4
```

### Pull Request Checks

```yaml
# .github/workflows/pr.yml
name: PR Checks

on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Unit tests
        run: npm run test:unit -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
      
      - name: Visual regression tests
        run: npm run test:visual
      
      - name: Performance benchmark
        run: npm run test:performance
        continue-on-error: true
      
      - name: Data accuracy tests
        run: npm run test:data-accuracy
```

### Main Branch Checks

```yaml
# .github/workflows/main.yml
name: Main Branch Deploy

on:
  push:
    branches: [main]

jobs:
  full-test-suite:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e
      - run: npm run test:data-accuracy
      - run: npm run test:performance
      - run: npm run test:a11y
      - run: npm run build
```

### Release Branch Checks

```yaml
# .github/workflows/release.yml
name: Release Testing

on:
  push:
    branches: [release/**]

jobs:
  release-validation:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
        device: ['desktop', 'mobile']
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      
      - name: Full E2E suite (${{ matrix.browser }}, ${{ matrix.device }})
        run: npm run test:e2e -- --project=${{ matrix.browser }}-${{ matrix.device }}
      
      - name: Manual QA checklist
        run: echo "⚠️ Manual QA checklist required before release"
      
      - name: Data accuracy regression
        run: npm run test:data-accuracy -- --verbose
      
      - name: Performance validation
        run: npm run test:performance -- --fail-on-regression
```

---

## 12. Manual QA Checklist

For each release candidate, perform these 30+ manual checks:

### Visual & Interaction (10 items)

- [ ] Stars render with correct colors (cross-check with Stellarium)
- [ ] Labels positioned correctly at all zoom levels
- [ ] Orbit paths draw smoothly without glitches
- [ ] Pan/zoom/rotate controls are smooth and responsive
- [ ] UI layout is clean on desktop (1920×1080), tablet (iPad), phone (iPhone 12)
- [ ] No visual artifacts or z-fighting in star fields
- [ ] Search suggestions display correctly
- [ ] Info panels format numbers consistently (e.g., distances, magnitudes)
- [ ] Theme toggle (light/dark) works without visual breaks
- [ ] Loading spinner displays during data fetch

### Functionality (10 items)

- [ ] Time simulation advances correctly (1 day, 1 month, 1 year steps)
- [ ] Planet positions update as time advances (verify against JPL)
- [ ] Keyboard shortcuts work (Tab, Enter, Space, Escape, Arrow keys)
- [ ] Search finds objects by name, catalog number, and type
- [ ] Share URL encodes current view and can be restored
- [ ] Settings persist across page reload (localStorage)
- [ ] Can navigate Solar System, galaxy scale, and deep field sequentially
- [ ] Time scrubber seeks smoothly without jumps
- [ ] Undo/redo for navigation history works
- [ ] Audio mutes/unmutes without errors

### Performance (5 items)

- [ ] Page loads in < 4 seconds on 4G LTE network (Chrome DevTools throttling)
- [ ] FPS stays ≥ 58 when panning/rotating star field with 100k objects
- [ ] No lag when advancing time rapidly
- [ ] Memory doesn't grow visibly during 5-minute continuous interaction
- [ ] No timeout errors when loading 10M star catalog

### Accessibility (3 items)

- [ ] Can navigate all controls using Tab key only
- [ ] Screen reader announces object names and info panel contents
- [ ] Color contrast passes WCAG AA (DevTools Lighthouse Accessibility audit)

### Data Accuracy (2 items)

- [ ] Sirius position matches Gaia DR3 (within 1 arcsecond)
- [ ] Earth position matches JPL Horizons (within 0.01 AU)

### Browser/Device (optional, device-permitting)

- [ ] Works in Chrome, Firefox, Safari (latest versions)
- [ ] Works on iPhone 13+ (Safari), Pixel 6+ (Chrome)

---

## 13. Bug Severity Classification

All bugs logged must include severity level to prioritize fixes:

| Level | Description | Example | SLA |
|---|---|---|---|
| **P0** | Crash, data loss, security vulnerability | App crashes on startup; user data deleted | Fix within 24 hours |
| **P1** | Data inaccuracy, core feature broken | Planet position wrong by 1 AU; search returns no results | Fix within 48 hours |
| **P2** | Visual glitch, performance degradation | Star color renders as gray; FPS drops to 20 | Fix within 1 week |
| **P3** | Cosmetic/UX polish | Label font size off by 1px; button tooltip missing | Fix within 2 weeks |
| **P4** | Enhancement request, nice-to-have | Add new color theme; improve zoom animation | Backlog |

**P0 & P1 bugs block releases.** All others may be deferred with justification.

---

## 14. Test Execution & Reporting

### Local Development

```bash
# Run tests in watch mode
npm run test -- --watch

# Run specific test file
npm run test -- coordinate-conversion.test.ts

# Run with coverage report
npm run test -- --coverage

# Generate HTML coverage report
npm run test -- --coverage && open coverage/index.html
```

### CI Test Reports

- **Coverage reports**: Codecov badge in README, required > 80%
- **Performance reports**: Baseline comparisons in PR comments
- **Visual regression**: Side-by-side diff images on failure
- **E2E results**: Video recording on failure, HTML report artifact
- **Data accuracy**: Pass/fail per object, regression history

### Continuous Monitoring

- **Daily data accuracy regression**: Automated test compares rendered positions to JPL Horizons for 50 reference objects
- **Weekly performance profiling**: Measure FPS, memory, frame time on 4 browsers
- **Monthly user analytics**: Track load time, interaction patterns, reported issues

---

## 15. Risk Areas & Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| Incorrect ephemeris calculations | P0 (data inaccuracy) | Kepler solver unit tests + regression suite, cross-validate with JPL |
| WebGL rendering glitches | P2 (visual) | Visual regression testing, device matrix testing |
| Memory leaks on mobile | P2 (performance) | Automated memory leak detection, manual testing on low-end devices |
| Search performance degradation | P2 (usability) | Performance benchmarks in CI, test with 1M catalog entries |
| Accessibility regressions | P2 (inclusion) | axe-core CI checks, manual keyboard/screen reader audits |
| Time simulation desyncs from real time | P1 (confusion) | Unit tests for time step accuracy, manual spot checks |
| Share URLs break after updates | P2 (UX) | E2E tests for URL encoding/decoding, version migration tests |

---

## 16. Success Metrics

Cosmos Explorer testing is successful when:

1. **No high-severity bugs escape to production** (P0/P1 count = 0 at release)
2. **Data accuracy verified**: Star/planet/galaxy positions match reference within tolerance
3. **Performance maintained**: FPS ≥ 58 on mid-tier devices, load time ≤ 4 seconds
4. **Coverage maintained**: >80% unit test coverage, trending upward
5. **Accessibility compliance**: WCAG AA on all UI, keyboard-navigable
6. **Regression prevention**: Visual regression tests catch unintended changes
7. **User confidence**: No data accuracy complaints; smooth interactions across devices

---

## 12. Extended Test Coverage for 96 Entity Types (Added v2.0)

### 12.1 Shader Compilation Tests

For each of the 24 shader families (Doc 09 v2.0, Doc 22 v4.2):
- **Unit test**: shader compiles without error on WebGL 2.0
- **Visual regression test**: screenshot comparison at LOD L0, L1, L2
- **Performance test**: compile time < 150ms, render time < 2ms/frame per entity
- **Fallback test**: verify generic-glow fallback activates on compile failure

Total: 24 families × 4 tests = 96 shader tests

### 12.2 Entity Type Rendering Tests

For each of the 96 entity types:
- **Smoke test**: entity renders without error
- **Property test**: verify visual parameters match Doc 22 specs (color, size, animation)
- **LOD transition test**: smooth transition across L0-L4

Total: 96 types × 3 tests = 288 entity rendering tests

### 12.3 Volumetric Rendering Tests (Nebulae)

For each of 14 nebula types (ENT-5000 series):
- **Raymarching correctness**: density function produces expected shape
- **Performance**: frame time within budget (2-4ms per tier)
- **Adaptive quality**: verify step reduction under load
- **Early termination**: verify transmittance cutoff works

Total: 14 types × 4 tests = 56 volumetric tests

### 12.4 Particle System Stress Tests

| Test | Condition | Pass Criteria |
|---|---|---|
| Galaxy rendering | 500K particles | 60 FPS on High tier |
| Globular cluster | 100K particles | 60 FPS on High tier |
| Cosmic web | 2M particles | 30 FPS on High tier |
| Multi-entity | 5 galaxies + 3 nebulae + 10K stars | 30 FPS on High tier |
| Mobile stress | 100K total | 30 FPS on Low tier |

### 12.5 Scale Transition Tests

For each scale level pair (S0→S1, S1→S2, ... S5→S6):
- Camera frustum adapts correctly (near/far planes)
- Floating origin resets without visible pop
- Logarithmic depth buffer activates at S4+
- Entity LOD changes smoothly during zoom

### 12.6 Cross-Category Search Tests

- Search "carbon" → returns ENT-2037 (Carbon Planet), ENT-1029 (Carbon Star)
- Search by category filter → returns only that category
- Browse all 96 types → no missing entries
- Keyboard navigation through full entity list

---

## Document History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-04-16 | Engineering Team | Initial comprehensive testing strategy |
| 2.0 | 2026-04-16 | Engineering Team | Added Section 12: Extended test coverage for 96 entity types, shader compilation tests, volumetric rendering tests, particle system stress tests, scale transition tests, cross-category search tests |
