# COSMOS EXPLORER — DETAILED FUNCTIONAL SPECIFICATION (DFS)

**Document ID:** DFS-cosmos-explorer  
**Version:** 2.0  
**Date:** 2026-04-16  
**Status:** Draft  
**Authors:** Product Engineering Team  
**Reviewers:** TBD  
**Approval:** Pending  

---

## TABLE OF CONTENTS

1. [Document Information](#1-document-information)
2. [Product Overview](#2-product-overview)
3. [Global Behaviors](#3-global-behaviors)
4. [Screen-by-Screen Specification](#4-screen-by-screen-specification)
5. [Data Flow Specifications](#5-data-flow-specifications)
6. [State Machine Diagrams](#6-state-machine-diagrams)
7. [Algorithm Specifications](#7-algorithm-specifications)
8. [Animation Specifications](#8-animation-specifications)
9. [Accessibility Specification](#9-accessibility-specification)
10. [Performance Requirements](#10-performance-requirements-per-screen)
11. [Edge Cases & Boundary Conditions](#11-edge-cases--boundary-conditions)
12. [Glossary](#12-glossary)

---

## 1. DOCUMENT INFORMATION

### 1.1 Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-16 | Engineering | Initial DFS creation |
| 2.0 | 2026-04-16 | Engineering | Added entity type requirements cross-reference and detail panel specifications for 96 entity types across 9 categories |

### 1.2 Related Documents

- **PRD-cosmos-explorer**: Product Requirements Document (high-level vision)
- **SRS-cosmos-explorer**: Software Requirements Specification (technical requirements)
- **ARCH-cosmos-explorer**: System Architecture Document
- **UI-DESIGN-cosmos-explorer**: UI/UX Design System

### 1.3 Document Scope

This document provides the **definitive detailed functional specification** for Cosmos Explorer, a browser-based 3D interactive universe visualization platform. It specifies behavior at the screen, component, interaction, and algorithm level—comprehensive enough for developers to build the entire product.

**Not covered:** Infrastructure, deployment, security hardening, legal compliance (handled in separate docs).

### 1.4 Approval Workflow

- [ ] Product Manager sign-off
- [ ] Engineering Lead review
- [ ] Design Lead review
- [ ] QA Lead review
- [ ] Executive approval

---

## 2. PRODUCT OVERVIEW

### 2.1 Product Identity

**Cosmos Explorer** is an interactive 3D web-based universe visualization platform enabling users to explore the observable universe from the Solar System scale (kilometer distances) to cosmic web scale (gigaparsec distances). Users navigate using real astronomical data (Gaia DR3, JPL Horizons, SDSS, IllustrisTNG) with immersive visual effects (bloom, gravitational lensing), procedural ambient soundscapes, time simulation, and guided educational tours.

### 2.2 Core Value Propositions

1. **Unprecedented Scale**: Seamless navigation from Earth to the edge of the observable universe
2. **Real Data**: Powered by genuine astronomical catalogs, not synthetic
3. **Interactive Education**: Learn through exploration, not passive consumption
4. **Immersive Experience**: High-fidelity 3D rendering with spatial audio
5. **Shareable Views**: Bookmark and share discoveries with others

### 2.3 Technology Stack

- **Rendering**: Three.js r184+, WebGL 2.0
- **Framework**: React 18+, TypeScript 5+
- **State Management**: Redux Toolkit + async thunks
- **Audio**: Web Audio API + Tone.js
- **Data Formats**: GeoJSON (catalog tiles), PNG/JPEG (textures), JSON (metadata)
- **Build**: Vite + Node 18+

### 2.4 Target Users

- Astronomy educators and students
- Science communicators
- Casual learners / astronomy enthusiasts
- Developers building astronomy tools
- Researchers visualizing catalogs

### 2.5 Success Metrics

- Time on site: avg 8+ minutes
- Repeat visit rate: 35%+
- Bookmarks created per session: 1+
- Shared views (week 4+): 20%+

---

## 3. GLOBAL BEHAVIORS

### 3.1 Application Lifecycle

#### 3.1.1 Cold Start (First Visit, No Cache)

**Sequence:**
1. Browser GETs `index.html` → 45ms (static)
2. Parse HTML, identify critical JS imports
3. Load critical bundle (`main.{hash}.js`, ~500KB gzipped) → 1.2s (28Mbps connection)
4. Execute initialization script:
   - Check WebGL 2.0 support → if not, redirect to `/no-webgl.html`
   - Initialize Redux store with defaults
   - Create Three.js Scene, Camera, Renderer
   - Register event listeners
5. Render loading screen (SCR-001):
   - Full-screen dark background (#0a0e27)
   - Centered logo (120x120px, white)
   - Progress bar (400px wide, center)
   - Rotating space facts (2s fade in/out per fact)
   - "Press ENTER or click ENTER button" (disabled until ready)
6. Start data pipeline:
   - Load critical skybox texture (near star field, ~2MB) via blob URLs
   - Load Hipparcos/Gaia nearby stars tile (~1.8M stars, filtered to mag < 6.5, ~8MB) → parse → insert into octree
   - Initialize spatial audio context
7. First frame rendered (~3s total):
   - Skybox + nearby stars visible
   - Camera positioned at Earth (0, 0, 0), looking toward Polaris
   - Progress bar shows 100%
   - "Enter" button becomes enabled, glows with pulsing animation
8. Ready state:
   - User sees main exploration view (SCR-002)
   - User can click "Enter", press Enter, or Escape to skip
9. **Total cold-start time target: 3.5–4.5 seconds on 20Mbps connection**

#### 3.1.2 Warm Start (Returning User, Service Worker Cache)

**Sequence:**
1. Service Worker intercepts GET requests
2. Check `cache-first` strategy:
   - Main bundle, skybox, icon fonts → serve from cache if age < 7 days
   - API responses → serve from cache-with-network fallback
3. Check if localStorage has previous session state:
   - Camera position, selected object, bookmarks, settings
4. Render loading screen, but with optimistic immediate state:
   - Progress bar starts at 50% (critical assets already cached)
   - Facts rotate (1.5s visible per fact)
5. Network requests proceed in background:
   - Check for updates to data catalogs (If-Modified-Since header)
   - Fetch any new bookmarks from cloud sync (if enabled)
6. **Total warm-start time target: 1.2–1.8 seconds**

#### 3.1.3 Tab Visibility Handling

**When tab becomes hidden (e.g., user switches to another tab):**
- Pause 3D rendering → requestAnimationFrame stops executing
- Pause audio → Web Audio Context suspend() called
- Pause time simulation → elapsed time frozen
- Pause any active animations (info panel, camera transition)
- Set document.title to indicate application is paused (optional: "⏸ Cosmos Explorer")

**When tab regains focus (visibility change to 'visible'):**
- Measure elapsed time since last frame
- Resume requestAnimationFrame
- Resume Web Audio Context → resume()
- Resume time simulation, adjust epoch for elapsed time
- Resume camera transition or animation
- No data reload necessary (still in memory)

**Benefits:** Reduced power consumption, reduced CPU utilization, better battery life on laptops/mobile.

#### 3.1.4 WebGL Context Loss & Recovery

**Detection:**
- Listen to `webglcontextlost` event on canvas element
- Set `ui.contextLost = true` in Redux state
- Pause all rendering, audio
- Show recovery UI overlay (centered toast, non-dismissible):
  - Message: "Graphics context lost. Attempting to recover..."
  - Spinner animation (1s rotation period)

**Recovery Attempt (automatic):**
1. Wait 500ms
2. Attempt to re-initialize WebGL context via renderer.getContext()
3. If successful:
   - Reload shader programs
   - Rebind textures to new GL context
   - Set `ui.contextLost = false`
   - Resume rendering/audio
   - Show transient success toast: "Graphics recovered!"
4. If failed (context not restored within 5s):
   - Show error overlay:
     - "Graphics context could not be recovered."
     - "Try refreshing the page. If the problem persists, update your graphics drivers or use a different browser."
     - Button: "Refresh Page"

**Causes:** GPU driver crash, WebGL context limit exceeded, hardware issue. Rare on modern browsers.

#### 3.1.5 Browser Back/Forward Navigation

**Trigger:** User clicks browser back/forward button, or calls `window.history.back()`

**Behavior:**
1. Detect `popstate` event on window
2. Parse URL hash parameters (section 3.6)
3. Reconstruct application state:
   - Camera position: `ra`, `dec`, `dist` → translate to 3D position
   - Scale: `scale` parameter → adjust rendering LOD
   - Selected object: `obj` parameter → load and highlight
   - Settings: `quality`, `audio`, etc. → apply
4. Animate camera transition from current position to target position (2s, ease-in-out spherical lerp)
5. Update info panel if object changed
6. **No full page reload; smooth state transition**

#### 3.1.6 Window Resize Handling

**Trigger:** User resizes browser window, rotates device (mobile)

**Behavior:**
1. Detect `resize` event on window
2. Measure new `window.innerWidth` and `window.innerHeight`
3. Update Three.js renderer size: `renderer.setSize(width, height)`
4. Update camera aspect ratio: `camera.aspect = width / height; camera.updateProjectionMatrix()`
5. Recompute responsive UI layout:
   - If width < 768px → switch from side panel to bottom sheet info panel
   - Reposition HUD elements (toolbar, search, minimap)
   - Adjust font sizes based on DPI
6. **Debounce**: only update every 250ms to avoid thrashing
7. **No page reload; seamless responsive adaptation**

#### 3.1.7 Online/Offline Detection

**Detection:**
- Listen to `online` / `offline` events on window
- Monitor `navigator.onLine` property
- Periodically ping `/api/health` endpoint (every 30s when offline)

**When offline:**
- Show status indicator in top-right corner: "Offline mode" (orange)
- Disable features requiring network: data search, share, cloud bookmarks
- Render cached data only
- Queue user actions (bookmarks, screenshots) and execute when online again
- Display toast: "You are offline. Some features are disabled."

**When returning to online:**
- Remove offline indicator
- Sync queued actions
- Refresh data catalogs if stale (age > 24h)
- Display toast: "Back online!"

---

### 3.2 Input Handling

#### 3.2.1 Mouse Input

| Action | Event | Behavior | Context |
|--------|-------|----------|---------|
| Left-click | `mousedown` + `mouseup` | Select object at cursor; toggle info panel if already selected | 3D viewport |
| Right-click | `contextmenu` | Show context menu (Go to, Orbit, Compare, Bookmark, Share, External) | 3D viewport |
| Scroll | `wheel` | Zoom in/out; logarithmic scale; no momentum | 3D viewport |
| Middle-drag | `mousemove` (middle pressed) | Pan camera in screen plane (up/down/left/right); orthogonal to view direction | 3D viewport |
| Left-drag | `mousemove` (left pressed) | **Orbit mode** (default): rotate around selected object or scene center; **Fly mode** (Shift+Space): first-person look-around | 3D viewport |
| Hover | `mousemove` | Highlight nearest object under cursor with glow effect; update cursor | 3D viewport |
| Left-click (UI) | `click` | Activate button, toggle switch, submit form | UI elements |
| Scroll (UI) | `wheel` | Scroll panel content (info panel, settings, help) | Scrollable panels |

**Mouse sensitivity:** Configurable in settings (default: 1.0, range 0.1–3.0). Applied to orbit rotation and fly look-around. Stored in `settings.mouseSensitivity`.

#### 3.2.2 Keyboard Input

| Key(s) | Behavior | Context |
|--------|----------|---------|
| W / A / S / D | Move forward / left / backward / right in fly mode; no effect in orbit mode | Viewport |
| Q / E | Roll camera left / right (fly mode only) | Viewport |
| Shift | Boost speed (3x) when held, combined with WASD | Viewport |
| Space | Pause/resume time simulation | Viewport |
| Escape | Close active panel (info, search, settings, help) | Viewport |
| / | Open search bar, focus input | Viewport |
| ? | Open help overlay | Viewport |
| F | Toggle fullscreen mode (`Element.requestFullscreen()`) | Viewport |
| B | Open bookmark manager, or bookmark current view if not open | Viewport |
| T | Toggle time controls panel expanded/collapsed | Viewport |
| Tab | Cycle UI focus: search → toolbar → minimap → time controls → back to search | Viewport |
| Tab (in search) | Cycle through search results | Search panel |
| Arrow Up / Down (in search) | Navigate autocomplete results | Search panel |
| Enter (in search) | Go to selected search result, close search | Search panel |
| Escape (in search) | Close search, focus returns to viewport | Search panel |
| Arrow keys (game) | Alternative movement (if keyboard layout set to Arrows) | Viewport |
| Custom bindings | User-defined in controls settings | Viewport |

**Keyboard context:** Disable viewport shortcuts when typing in text inputs (search, date picker). Maintain global shortcuts (Escape, F, B, ?) always active.

#### 3.2.3 Touch Input (Mobile/Tablet)

| Gesture | Behavior | Context |
|---------|----------|---------|
| Single tap | Select object (same as left-click) | 3D viewport |
| Long press (500ms) | Show context menu (same as right-click) | 3D viewport |
| Pinch zoom | Zoom in/out (multi-touch zoom event); logarithmic scaling | 3D viewport |
| Two-finger drag | Rotate (orbit mode) around scene center or selected object | 3D viewport |
| One-finger swipe (horizontal) | Pan left/right in screen plane | 3D viewport |
| One-finger swipe (vertical) | Pan up/down in screen plane | 3D viewport |
| Swipe down from top | Hide/show HUD (info panel, toolbar); useful for immersion | 3D viewport |
| Tap button | Activate UI button (standard tap) | UI elements |
| Double-tap | Zoom to object (2x) | 3D viewport |

**Touch hints:** On first session, show toast overlay with gesture diagram (1s duration, can be dismissed). Stored flag in localStorage: `ui.touchHintsShown`.

#### 3.2.4 Gamepad Input (Controller Support)

**Gamepad detection:** Enumerate connected gamepads on `gamepadconnected` event. Max 4 gamepads supported.

| Input | Behavior | Context |
|-------|----------|---------|
| Left stick (both axes) | Move in fly mode (forward/backward = Y axis, strafe = X axis) | Viewport |
| Right stick (both axes) | Look around (pitch = Y axis, yaw = X axis) in fly mode | Viewport |
| LT / RT triggers (left/right) | Zoom in / out (analog, continuous) | Viewport |
| A button | Select object under crosshair | Viewport |
| B button | Go back (close panel, undo last action) | Viewport |
| Y button | Toggle info panel for selected object | Viewport |
| X button | Bookmark current view | Viewport |
| Start button | Open settings menu | Viewport |
| Back button | Open help overlay | Viewport |
| Left bumper (LB) | Decrease time speed (halve) | Viewport |
| Right bumper (RB) | Increase time speed (double) | Viewport |

**Polling:** Query gamepad state every frame (`navigator.getGamepads()`). Deadzone: 0.2 (ignore small stick movements). Rumble: fire 0.5s pulse on object selection if supported.

#### 3.2.5 Input Priority & Mode Switching

**Input device priority (most recent takes precedence):**
1. Keyboard always active (global shortcuts: F, B, ?, Escape)
2. Most recent device: if mouse moved in last 500ms, use mouse mode; if touch event in last 500ms, use touch mode; if gamepad input in last 500ms, use gamepad mode
3. Prevents accidental input conflicts (e.g., touch pan while moving mouse)

**Mode switching:**
- **Orbit mode** (default): left-drag rotates around center; right-click shows menu; scroll zooms
- **Fly mode** (Shift+Space toggle): WASD moves, right-stick look, left-click goes straight; no orbiting
- Visual indicator in HUD: small text in corner "Orbit" or "Fly" mode label (changes color on toggle)

---

### 3.3 Cursor Behavior

| Cursor State | Appearance | Context |
|---|---|---|
| Default | Crosshair (custom SVG, white, 24x24px) | Over empty space in 3D viewport |
| Object hover | Pointer + glow | Over selectable object (star, planet, galaxy); glow fades out 300ms after cursor leaves |
| Dragging orbit | Grabbing hand | While left-dragging to rotate view |
| Dragging pan | Move cursor (4-way arrows) | While middle-dragging to pan |
| Loading | Wait (spinning ring) | While data is loading; combined with progress indicator |
| Over UI | Default pointer (standard) | Over buttons, text inputs, links |
| Disabled | Not-allowed (circle with slash) | Over disabled UI element |
| Text select | I-beam | Over text in info panel |

**Glow effect:** When cursor hovers over object, render additional bloom-pass glow around object geometry. Glow intensity: 0 → 1.0 over 150ms ease-out. Glow color: object color (star: spectrum color; planet: dominant color). Glow fade-out on cursor leave: 1.0 → 0 over 300ms ease-out.

---

### 3.4 Loading States

#### 3.4.1 Initial Load (SCR-001)

Specified in section 3.1.1. Additional detail in section 4.1.

#### 3.4.2 Data Tile Loading

**Scenario:** User zooms into a region where new star data needs to load (e.g., zoom to M31 Andromeda Galaxy).

**Visual:** Small animated spinner appears in bottom-left corner (20x20px, white, 1s rotation). Tooltip on hover: "Loading stellar data...". No viewport interruption; continues rendering cached data.

**Timing:** Spinner appears if load takes > 300ms. Spinner disappears when load completes (fade out 200ms).

**Async behavior:** Tiles load in priority order: nearest tiles first (camera focal point). Max 3 concurrent tile fetches.

#### 3.4.3 Texture Loading (Progressive Enhancement)

**Scenario:** High-res planet texture loads while low-res placeholder visible.

**Process:**
1. Render low-res placeholder (512x512px, stored in memory)
2. Fetch high-res texture (2048x2048px or 4K) in background
3. When fetch completes, create new WebGL texture, bind to material
4. Fade out placeholder → fade in high-res (200ms cross-fade)
5. Dispose low-res texture memory

**User perception:** Smooth transition; no "flashing" artifacts.

#### 3.4.4 Scale Transition Effect (Optional)

**Scenario:** User zooms from Earth (km scale) to Milky Way (parsec scale). Crossing major scale boundaries.

**If enabled in settings (`settings.scaleTransitionEffect = true`):**
1. Render brief "warp" effect: camera shake (0.5% FOV jitter), chromatic aberration, motion blur (3 frames)
2. Duration: 300ms
3. Easing: ease-in-out
4. Audio: brief "whoosh" sound (200ms, fade-in/out)
5. Cooldown: effect only triggers if zooming > 10x scale in one gesture

**If disabled:** Instant zoom, no effect.

---

### 3.5 Error Handling

#### 3.5.1 WebGL Not Supported

**Trigger:** `gl = canvas.getContext('webgl2')` returns `null`.

**Behavior:**
1. Catch error during initialization
2. Redirect to `/no-webgl.html` (fallback page)
3. Display message: "Your browser does not support WebGL 2.0. Please upgrade to a modern browser."
4. Links to: Firefox, Chrome, Safari, Edge download pages
5. Fallback shows static image gallery of cosmos visualizations

#### 3.5.2 Data Load Failure

**Trigger:** Fetch request for data tile fails (network error, 4xx/5xx response).

**Behavior:**
1. Log error to console (dev), analytics (prod)
2. Retry logic: exponential backoff
   - Attempt 1: immediate
   - Attempt 2: wait 1s before retry
   - Attempt 3: wait 3s before retry
   - Max 3 attempts total
3. If all retries fail:
   - Show transient toast (bottom-left): "Some astronomical data unavailable. Showing cached data."
   - Color: orange (warning)
   - Duration: 4s
   - Continue rendering with cached/partial data
4. User can manually retry via Settings > Data > "Refresh Catalog" button

#### 3.5.3 Shader Compilation Failure

**Trigger:** WebGL shader compilation error (`gl.getShaderInfoLog()` returns error message).

**Behavior:**
1. Log full error message to console
2. Fallback strategy: disable advanced feature (bloom, shadows, lensing) and recompile simpler shader
3. If simple shader compiles: show warning toast "Advanced graphics disabled due to driver issue"
4. If simple shader fails: show error dialog with browser/driver info, suggest update

#### 3.5.4 Audio Initialization Failure

**Trigger:** Web Audio API context fails to initialize (browser policy, hardware issue).

**Behavior:**
1. Catch `AudioContext()` error
2. Set `audio.enabled = false`
3. Show muted icon in audio controls (permanently)
4. Silently continue (no error toast, as audio is enhancement not core feature)
5. Tooltip on muted icon: "Audio unavailable in this browser"

#### 3.5.5 Memory Pressure

**Trigger:** GPU/CPU memory usage exceeds threshold (monitor via `performance.memory` if available, or empirical detection: FPS < 30 after 5s, likely OOM).

**Behavior:**
1. Detect low performance: if FPS < 30 for > 5s continuous, assume memory pressure
2. Automatic quality reduction:
   - Reduce texture quality: 4K → 2K
   - Reduce star count: 500K → 100K
   - Disable bloom
   - Reduce shadow resolution
3. Show warning toast: "Graphics quality reduced due to memory pressure. Adjustments made automatically." (yellow)
4. User can manually adjust in Settings > Graphics
5. If still FPS < 20, show stronger toast: "Low performance detected. Try reducing resolution or closing other applications."

---

### 3.6 URL State Encoding

**Principle:** Every significant application state is encoded in the URL hash, enabling sharing/bookmarking of views.

**Format:**
```
https://cosmos-explorer.app/#/ra=180.5&dec=-30.2&dist=8500&scale=galactic&time=2451545.0&speed=1&obj=HIP87937&panel=info&audio=on&quality=high
```

#### 3.6.1 URL Parameters (Complete Specification)

| Parameter | Type | Range | Default | Unit | Description | Example |
|-----------|------|-------|---------|------|-------------|---------|
| `ra` | float | 0–360 | 0 | degrees | Right Ascension of camera look direction (J2000) | 180.5 |
| `dec` | float | -90–90 | 0 | degrees | Declination of camera look direction (J2000) | -30.2 |
| `dist` | float | 1e3–1e26 | 1e6 | meters | Distance of camera from origin (Earth or Galactic Center) | 8500 |
| `scale` | string (enum) | solar, galactic, universal | solar | — | Zoom level / coordinate system | galactic |
| `time` | float | 0–Infinity | 2451545 | JD | Epoch in Julian Date (JD 2451545 = J2000.0 = 2000-01-01) | 2451545.0 |
| `speed` | float | -1e8–1e8 | 1 | seconds/sim-second | Time simulation speed (negative = reverse) | 1 |
| `obj` | string | catalog ID | — | — | Currently selected object ID (HIP#, HD#, NGC#, custom) | HIP87937 |
| `panel` | string (enum) | info, search, settings, help, compare | — | — | Active panel (if any) | info |
| `audio` | string (enum) | on, off, muted | on | — | Audio state | on |
| `quality` | string (enum) | low, medium, high, ultra | high | — | Graphics quality preset | high |
| `lat` | float | -90–90 | — | degrees | Latitude on current body (for planetary scale) | 45.5 |
| `lon` | float | -180–180 | — | degrees | Longitude on current body | -120.3 |
| `alt` | float | 0–Infinity | 0 | meters | Altitude above current body surface | 1000 |
| `coord_sys` | string (enum) | equatorial, galactic, ecliptic | equatorial | — | Coordinate system display | galactic |
| `labels` | string (enum) | none, major, all | major | — | Label visibility level | all |
| `grid` | string (enum) | none, equatorial, galactic, ecliptic | none | — | Coordinate grid display | galactic |

#### 3.6.2 Encoding Rules

- Numeric parameters: lossless (full precision)
- String parameters: URI-encoded (spaces → %20, special chars → %XX)
- Missing parameters: use defaults
- Invalid parameters: log warning, use default, continue
- Parameter order: alphabetical for consistency

#### 3.6.3 URL Update Timing

Update URL hash whenever:
- User selects object: add `obj=<id>`
- User zooms: update `dist`
- User rotates view: update `ra`, `dec`
- User changes time: update `time`, `speed`
- User changes settings: update `quality`, `audio`, `coord_sys`
- User opens panel: update `panel`

**Debounce:** Update no more than 1x per 500ms to avoid excessive history entries.

**History API:**
```javascript
// Replace current history entry (no back button spam)
window.history.replaceState(null, '', `#/${encodeState()}`);
```

#### 3.6.4 Shareable URLs

**Scenario:** User clicks Share button → app generates shareable URL.

**Process:**
1. Encode entire current state into URL
2. Generate short code via hash (first 8 chars of SHA256): `abc12345`
3. Store mapping: `abc12345 → full_url` in cloud DB (optional, for analytics)
4. Display short URL: `https://cosmos-explorer.app/?s=abc12345`
5. Copy to clipboard button (full URL or short URL)
6. When recipient opens shared URL: parse parameters → restore state

**Fallback:** If short URL service unavailable, just use full URL (long but functional).

---

## 4. SCREEN-BY-SCREEN SPECIFICATION

### 4.1 Loading Screen (SCR-001)

#### 4.1.1 Screen Overview

**Purpose:** Present initial loading experience while critical assets load; build anticipation; prevent blank screen.

**Entry condition:** User accesses `index.html` for first time (cold start) or after browser cache clear.

**Exit condition:** All critical assets loaded; user presses Enter, clicks button, or after 30s timeout (auto-advance).

#### 4.1.2 Visual Layout (Text Wireframe)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│         [Starfield Background - Procedurally Generated]      │
│                                                             │
│                        ░ ░ ░                                │
│                     ░        ░                              │
│                   ░ Cosmos ░ ░                              │
│                     Explorer ░                              │
│                        ░ ░ ░                                │
│                                                             │
│                                                             │
│         "Journeying through 13.8 billion years..."          │
│                     [████████░░ 78%]                        │
│                                                             │
│              [Press ENTER to Begin Your Journey]             │
│                                                             │
│                         or skip                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 4.1.3 Component Detailed Specification

##### 4.1.3.1 Background

- **Element:** Full-screen procedurally generated starfield
- **Position:** (0, 0) to (window.innerWidth, window.innerHeight)
- **Rendering:** Canvas 2D context (not WebGL) to avoid context overhead
- **Content:** ~200 white dots (stars) scattered randomly, no animation
- **Color:** Black background (#0a0e27)
- **Purpose:** Visual interest; establish "space" aesthetic; draw user's eye

##### 4.1.3.2 Logo

- **Element:** Text + symbol (stylized cosmos icon)
- **Position:** Center (x: 50%, y: 30%)
- **Size:** 120x120px (icon), 48px font (text)
- **Font:** "Inter Bold" or system sans-serif fallback
- **Color:** White (#ffffff)
- **Animation:** Fade in 500ms on load (opacity 0 → 1 ease-out)
- **Shadow:** Text-shadow (glow effect): 0 0 10px rgba(255,255,255,0.3)

##### 4.1.3.3 Rotating Facts Text

- **Element:** Paragraph of inspiring astronomy facts
- **Position:** Center (x: 50%, y: 35%)
- **Size:** Max-width 500px, font 16px, line-height 1.5
- **Font:** "Inter Regular"
- **Color:** Light gray (#d0d5dd)
- **Content:** Rotates through 5 facts every 2s:
  - "The nearest star is 4.37 light-years away."
  - "Light from the Andromeda Galaxy takes 2.5 million years to reach us."
  - "The observable universe is 93 billion light-years across."
  - "There are more stars than grains of sand on all Earth's beaches."
  - "Some galaxies formed just 100 million years after the Big Bang."
- **Animation:** Fade in 500ms, hold 1.5s, fade out 500ms per fact
- **Easing:** ease-in-out
- **Accessibility:** Update `aria-live` region when text changes

##### 4.1.3.4 Progress Bar

- **Element:** Linear progress indicator
- **Position:** Center (x: 50%, y: 50%)
- **Size:** 400px wide, 6px tall, rounded (border-radius: 3px)
- **Background:** Dark gray (#3a3f47)
- **Foreground:** Gradient (blue to cyan): linear-gradient(90deg, #2563eb, #06b6d4)
- **Animation:** Width increases continuously 0% → 100% as assets load
- **Easing:** ease-out (slowing as it approaches 100%)
- **Accessibility:** `<progress>` element with accessible label

##### 4.1.3.5 Percentage Text

- **Element:** Number percentage (e.g., "42%")
- **Position:** Right of progress bar, vertical center align
- **Size:** 14px font
- **Font:** "Inter Mono" (monospace)
- **Color:** Light gray
- **Update frequency:** Every 500ms or on significant milestone (25%, 50%, 75%, 100%)
- **Content:** Calculated as `Math.floor(loadedBytes / totalBytes * 100)`

##### 4.1.3.6 Action Button

- **Element:** "Press ENTER to Begin Journey" — text + button (dual interaction)
- **Position:** Center (x: 50%, y: 65%)
- **Size:** 280px wide, 48px tall
- **Font:** "Inter SemiBold", 16px
- **Color:** Text white, background color changes per state (see below)
- **Border:** None
- **Border-radius:** 8px
- **States:**
  - **Disabled (loading):** Background #404854 (dark gray), cursor wait, no hover effect
  - **Enabled (ready):** Background #2563eb (blue), cursor pointer
  - **Hover:** Background #1d4ed8 (darker blue), shadow 0 8px 16px rgba(37, 99, 235, 0.3)
  - **Active (pressed):** Background #1e40af (darkest), transform scale(0.98)
- **Animation on enable:** Glow pulse: shadow 0 0 0 rgba(37, 99, 235, 0.5) → 0 0 20px (1s repeat)
- **Keyboard focus:** Outline 3px solid #06b6d4 (cyan)
- **Accessibility:** `<button aria-label="Begin journey">`, keyboard accessible

##### 4.1.3.7 "Skip" Text Link

- **Element:** "or skip" hyperlink
- **Position:** Below button (x: 50%, y: 72%)
- **Size:** 12px font, gray color
- **Link color:** #64748b (slate gray)
- **Hover:** Underline, #94a3b8 (lighter gray)
- **Click behavior:** Advance to main screen immediately
- **Accessibility:** Keyboard accessible, visible focus indicator

##### 4.1.3.8 Loading Spinner (Optional)

- **Element:** Rotating circle (optional, appears only if load takes > 5s)
- **Position:** Top-right (x: -40px from right, y: 40px from top)
- **Size:** 20x20px
- **Animation:** Rotation 360° every 1s (continuous, linear)
- **Color:** Cyan (#06b6d4)
- **Opacity:** 0.5
- **Purpose:** Visual indication of ongoing work; reassures user (not frozen)

#### 4.1.4 Interaction Specification

| Trigger | Action | Result |
|---------|--------|--------|
| User presses Enter | Button activation | Immediate: fade out loading screen (500ms), fade in main view (500ms), show SCR-002 |
| User clicks button | Button activation | Same as above |
| User clicks "skip" | Skip link activation | Same as above (bypass loading bar requirement) |
| User waits 30s | Auto-advance timeout | Auto-fade to main view even if not 100% loaded (continue loading in background) |
| Page visibility hidden → shown | Pause/resume | Pause loading animation, resume on refocus (reset progress if > 30s elapsed) |
| Browser back button | Go back | Navigate to previous page (if history exists) |

#### 4.1.5 Data Requirements

- **Skybox texture:** ~2MB (PNG, compressed)
- **Hipparcos nearby stars:** ~1.8M stars, ~8MB JSON compressed
- **Font files:** ~50KB (woff2)
- **App bundle:** ~500KB gzipped

**Load order (priority):**
1. HTML + CSS
2. Main JS bundle
3. Skybox
4. Font files
5. Hipparcos catalog
6. IllustrisTNG preview tiles (lowest priority)

#### 4.1.6 Performance Requirements

- Page interactive (first input response): < 4s
- Main content loaded: < 5s
- All assets loaded: < 10s
- **Target FPS during loading:** N/A (rendering paused)

#### 4.1.7 Accessibility Notes

- High contrast: white text on dark background (WCAG AA compliant)
- Font size: min 12px (meets accessibility standard)
- Button size: min 48x48px (meets touch target standard)
- Semantic HTML: `<button>`, `<progress>`, `<a>`
- Keyboard navigation: Tab through button → "skip" link → always focusable
- Screen reader: Announce progress % changes ("Loading 42 percent"), button status

#### 4.1.8 Edge Cases

- **Very slow connection (< 0.5 Mbps):** Progress bar barely moves; auto-advance after 30s still allows entry
- **Very fast connection (50+ Mbps):** Progress bar completes in < 1s; button becomes enabled quickly
- **User clicks multiple times on button:** Only one state transition (idempotent)
- **User presses Enter before assets loaded:** Proceed with whatever data available; continue loading in background
- **Browser tab focus lost during loading:** Pause loading animation; resume on focus
- **Service Worker cache hit:** Progress bar jumps to 50% immediately; appears instant to user

#### 4.1.9 Error States

- **WebGL not supported:** Redirect to fallback page (not shown on loading screen)
- **Load timeout (> 30s):** Auto-advance with partial data; show warning toast "Some data will load in background"
- **Critical asset fail:** Show error toast, offer "Retry" button; max 3 retries then fallback

---

### 4.2 Main Exploration View (SCR-002)

#### 4.2.1 Screen Overview

**Purpose:** Primary interactive interface; user explores universe; primary viewport + supporting HUD.

**Entry condition:** Loading screen completes; user presses Enter.

**Exit condition:** User navigates to another app screen (settings, help, guided tour).

#### 4.2.2 Visual Layout (High-Level Wireframe)

```
┌─────────────────────────────────────────────────────────────────┐
│ [Search] [Breadcrumb: Universe > Laniakea > Milky Way > ...]    │
│ [RA, Dec] [Compass]                                             │
│                                                                 │
│                                                                 │
│                                                                 │
│              [3D VIEWPORT - Full Screen]                        │
│              (Stars, planets, galaxies, nebulae)                │
│              (Camera: interactive, orbit/fly mode)              │
│                                                                 │
│                                                                 │
│[Scale]               [Time Controls]          [Audio]  [Tools]  │
│[Indicator]           [Epoch, Play/Pause]     [Volume] [⋯]       │
│                                                     [Minimap]    │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2.3 Detailed Component Specification

##### 4.2.3.1 3D Viewport (Full-Screen Background)

**Element:** Three.js WebGL canvas, fills entire screen.

**Rendering content at each scale:**

**Solar System Scale (dist < 1e13 m, ~67 AU):**
- Sun (textured sphere, corona glow, bloom)
- Planets (textured, proper colors, relative sizes accurate)
- Major moons (visible if camera close enough)
- Asteroid belt (particle system, ~10K particles)
- Comets (trails, physics-based)
- Orbital paths (thin lines, semi-transparent)
- Labels (object names, always readable)

**Stellar Scale (1e13 m < dist < 1e18 m, ~0.3–6.5 kpc):**
- Individual stars (point sprites, B-V color mapped to RGB, sized by magnitude)
- Nebulae (volumetric clouds, procedural or SDSS textures)
- Clusters (stellar groupings, geometric outlines)
- Constellation lines (thin lines connecting bright stars)
- Selected star: highlighted with larger point + glow

**Galactic Scale (1e18 m < dist < 1e22 m, ~0.3–1 Mpc):**
- Milky Way (volumetric rendering, spiral arm structure, dust lanes)
- Nearby galaxies (textured, some detail, M31, M33, LMC, SMC)
- Globular clusters (small geometric spheres)
- Background stars (50K+ stars, lower LOD)
- Milky Way outline (wireframe polygon, shows extent)

**Cosmic Web Scale (dist > 1e22 m, > 1 Mpc):**
- Galaxy clusters (point clouds, color-coded by redshift/mass)
- Cosmic filaments (line network, shows structure)
- Void regions (empty space, dark)
- CMB radiation (optional, low-opacity overlay on sphere)
- Milky Way, Andromeda, Local Group (marked but tiny at this scale)

**Common to all scales:**
- Skybox (high-res Panoramic image or procedural, ~6 directional cube faces)
- Atmospheric scatter (if near planetary surface, Rayleigh scattering)
- Post-processing effects: bloom, tone mapping, gamma correction
- Coordinate grid (optional, overlay)

**Camera behavior:**
- Free-fly in space; position + quaternion rotation
- Orbit around selected object (if object selected)
- Smooth transitions between camera positions (SLERP for rotation, lerp for position, 1–3s)
- FOV: 60° by default, adjustable 20°–120° via scroll wheel

**Object rendering rules:**
- Render objects if screen-space size > 1 pixel and within culling distance
- Distant small objects merge into "aggregates" (particle systems)
- High-magnitude stars disappear when too faint (limit by apparent magnitude)
- Procedural LOD: highest detail for selected object; medium detail for visible objects; low detail for distant objects

**Visual effects active:**
- **Bloom:** Bright objects (stars, sun corona, nebulae) emit secondary glow. Threshold: brightness > 1.0. Blur radius: 8 pixels.
- **Tone mapping:** ACES Filmic (realistic, prevents overexposure)
- **Gamma correction:** 2.2 (standard sRGB)
- **Depth-of-field (optional):** Can be enabled; focuses on selected object, blurs background
- **Motion blur (optional):** Can be enabled; trails behind fast-moving objects during time simulation
- **Chromatic aberration (optional):** Warp effect on large zoom transitions; can be disabled in settings
- **Gravitational lensing (optional):** Massive objects (black holes, galaxy clusters) distort light rays; shader-based; can be disabled

#### 4.2.3.2 Search Bar (Top-Center)

**Collapsed state:**
- Position: (x: 50%, y: 24px), center
- Size: 40x40px circular button
- Icon: Magnifying glass (white, 20x20px)
- Background: Transparent
- Border: 1px solid rgba(255, 255, 255, 0.2)
- Hover: Border becomes solid white, glow appears
- Click: Expand to full search bar (animated)

**Expanded state:**
- Position: Absolute, top-center
- Size: 500px wide, 48px tall (responsive: min 80vw on mobile)
- Background: #1a1f2e (dark blue-gray), 0.95 opacity
- Border: 1px solid rgba(255, 255, 255, 0.3)
- Border-radius: 24px
- Shadow: 0 10px 30px rgba(0, 0, 0, 0.5)
- **Input field:**
  - Placeholder: "Search for stars, galaxies, objects..."
  - Font: 16px, Inter Regular
  - Color: white
  - Padding: 12px 20px (left padding: 40px for icon)
  - Caret color: cyan (#06b6d4)
  - Focus outline: none (handled by container)
  - Autocomplete: Dropdown below input
- **Clear button (X):** Right side of input, 20x20px, gray, white on hover
- **Keyboard shortcuts:** / to open, Escape to close, Arrow keys to navigate results

**Autocomplete dropdown:**
- Position: Below search bar, aligned left
- Max height: 400px (scrollable if > 10 results)
- Background: #1a1f2e, border: 1px solid #334155
- Max items shown: 10
- Result format per item:
  ```
  [Icon] Name (Type)
  Distance: 123 ly | Magnitude: 4.5
  ```
- **Highlight on hover/keyboard navigate:** Background #2d3748 (lighter), cursor pointer
- **Selected item:** Cyan border on left (3px)
- **Click or Enter:** Navigate to object, close search

**Behavior:**
- Debounce search input: 300ms
- Search prioritizes: exact match > prefix match > fuzzy match > catalog ID
- Show "No results" message if no matches
- Show recent searches (if > 5, limit to 5 most recent)
- Show "I'm feeling lucky" button (random object)
- Search across: object names, catalog IDs (HIP, HD, NGC, Messier), coordinates (nearby objects)

#### 4.2.3.3 Coordinate Display (Top-Left)

**Position:** Top-left corner, (x: 20px, y: 20px)
**Size:** ~150px wide, ~80px tall
**Background:** Semi-transparent dark (rgba(10, 14, 39, 0.7)), border-radius: 8px
**Border:** 1px solid rgba(255, 255, 255, 0.2)
**Padding:** 12px

**Content (default Equatorial):**
```
RA:  14h 29m 43.3s
Dec: +62° 40' 46"
Dist: 412 ly
```

**Content (optional Galactic):**
```
L:  103° 42' 31"
B:  +55° 12' 08"
Dist: 412 ly
```

**Content (optional Ecliptic):**
```
λ:  220° 15' 30"
β:  -18° 32' 10"
Dist: 412 ly
```

**Font:** Inter Mono 11px, monospaced, light gray (#d0d5dd)
**Update frequency:** Every frame (60 Hz)
**Click interaction:** Cycle through coordinate systems (equatorial → galactic → ecliptic → back to equatorial)
**Hover:** Tooltip shows "Click to change coordinate system"
**Animation on toggle:** Brief flash (opacity pulse) to draw attention
**Accessibility:** Aria-label describes current system; keyboard accessible (Tab focus)

#### 4.2.3.4 Compass / Orientation Indicator (Top-Left, Below Coordinates)

**Position:** Below coordinate display, (x: 20px, y: 110px)
**Size:** 80x80px circle
**Background:** Semi-transparent (#1a1f2e, 0.6 opacity)
**Border:** 1px solid rgba(255, 255, 255, 0.3), border-radius: 50%
**Padding:** 8px

**Content (compass rose):**
- Center: small white dot (observer position)
- Cardinal directions: "N" (top), "E" (right), "S" (bottom), "W" (left)
- Intermediate directions: subtle gray ticks (NE, SE, SW, NW)
- Galactic plane indicator: yellow line showing galactic equator orientation (if applicable)
- Rotation matches camera orientation; rotates as user looks around

**Interaction:**
- Click: Reset camera to "North up" orientation (Polaris direction in equatorial mode)
- Animation: 1s smooth rotation to reset position (SLERP)
- Hover: Tooltip "Click to reset orientation"

**Special cases:**
- If near galactic center, Galactic plane line emphasizes disk orientation
- If in planetary scale, compass shows "North" = planet's rotation axis
- If in "North looking down" view, compass shows top-down bird's-eye

**Accessibility:** Aria-label "Orientation indicator; click to reset"; keyboard accessible

#### 4.2.3.5 Navigation Breadcrumb (Top-Center, Below Search)

**Position:** Top-center, (x: 50%, y: 60px)
**Size:** 100% width, ~32px tall
**Background:** Transparent (sits on viewport)
**Overflow handling:** Truncate middle levels if too long

**Content example:**
```
Universe > Laniakea Supercluster > Local Group > Milky Way > 
  Orion Arm > Local Bubble > Solar System > Earth
```

**Each level:**
- **Clickable link:** Underline on hover, cyan color (#06b6d4)
- **Click behavior:** Smooth camera transition to zoom to that level; select that region
- **Text:** 12px, Inter Regular, white
- **Separator:** " > " (gray, #64748b)
- **Truncation:** If breadcrumb > 90% screen width, show ellipsis:
  ```
  Universe > ... > Orion Arm > Solar System > Earth
  ```

**Update timing:** Change breadcrumb when user's distance scale crosses major threshold (e.g., zooming from galactic to solar system scale)

**Mobile adaptation:** Stack vertically if < 500px width, show only last 3 levels

#### 4.2.3.6 Scale Indicator (Bottom-Left)

**Position:** Bottom-left corner, (x: 20px, y: -100px from bottom)
**Size:** 150px wide, 60px tall
**Background:** Semi-transparent dark, border-radius: 8px
**Border:** 1px solid rgba(255, 255, 255, 0.2)
**Padding:** 12px

**Content:**
```
Scale: 1 ly = 45 px
       (Solar System)
```

**Components:**
- **Vertical line:** 40px white line in center, represents "1 unit"
- **Labels:** Above/below line indicating distance
  - Top: "1 AU" (at solar system scale)
  - Bottom: Distance in current display unit (ly, pc, Mpc)
- **Scale label:** Text below showing current scale name (Solar System / Stellar / Galactic / Universal)

**Update timing:** Every frame when zooming, animated (smooth transition, 200ms ease-out) when scale changes

**Animation on zoom:** Line length morphs from current size to new size; labels fade out/in; scale name fades out/in

**Font:** Inter Mono 10px, light gray
**Accessibility:** Aria-label "Current scale: 1 light-year equals 45 pixels"

#### 4.2.3.7 Time Controls Collapsed (Bottom-Center)

**Position:** Bottom-center, (x: 50%, y: -30px from bottom)
**Size:** 200px wide, 36px tall (when collapsed)
**Background:** Semi-transparent dark
**Border:** 1px solid rgba(255, 255, 255, 0.2)
**Border-radius:** 8px
**Padding:** 8px

**Content (collapsed):**
```
▶ 2026-04-16 12:00:00 UTC (1x speed)
```

**Elements:**
- **Play/Pause icon:** 16x16px button on left (▶ or ⏸)
- **Epoch display:** Formatted date-time, 12px font
- **Speed indicator:** "(1x speed)" or "(-2x speed)" if reverse or non-1x

**Click to expand:** Full time controls panel (SCR-006)

**Hover:** Tooltip "Click to expand time controls or press T"

#### 4.2.3.8 Audio Controls (Bottom-Right)

**Position:** Bottom-right corner, (x: -150px from right, y: -30px from bottom)
**Size:** 140px wide, 36px tall (collapsed); 140x200px (expanded)
**Background:** Semi-transparent dark
**Border:** 1px solid rgba(255, 255, 255, 0.2)
**Border-radius:** 8px
**Padding:** 8px

**Collapsed state:**
```
[🔊] [████░░░░░░] (80%)
```

- **Icon:** Speaker icon (16x16px)
- **Volume slider:** Horizontal slider, 80px wide, height 4px
- **Percentage:** Text display (right)

**Expanded state (click icon):**
```
Master Volume
[████░░░] 80%

Ambient
[████░░░] 70%

Spatial
[████░░░] 60%

UI Sounds: ✓ On
Sonification: ✓ On
```

**Interactions:**
- **Click icon:** Toggle mute (volume → 0 → restore previous)
- **Drag slider:** Continuous volume adjustment, real-time audio change
- **Hover:** Tooltip "Master volume"
- **Right-click:** Show context menu (Advanced > Channel mixer)

**States:**
- **Enabled:** Icon color white, slider visible
- **Muted:** Icon gray with red mute symbol, slider grayed out
- **Disabled:** Icon crossed-out (audio not available in browser), non-interactive

**Accessibility:** Slider has aria-label, aria-valuenow, keyboard adjustable (arrow keys)

#### 4.2.3.9 Toolbar (Right Side)

**Position:** Right edge, vertical column, (x: -50px from right, y: 50% centered)
**Size:** 48x48px per button, spacing 12px
**Background:** None (floating)
**Orientation:** Vertical

**Buttons (top to bottom):**

| Icon | Label | Shortcut | Function |
|------|-------|----------|----------|
| 📍 | Bookmark | B | Save current view; add to bookmarks |
| 📷 | Screenshot | — | Capture 3D view as image (PNG) |
| ⏺ | Record | — | Record time-lapse video (WebM) |
| 🔗 | Share | — | Open share modal (URL, QR code, social) |
| ⚙️ | Settings | — | Open settings panel (SCR-005) |
| ? | Help | ? | Open help overlay (SCR-010) |
| ⛶ | Fullscreen | F | Enter fullscreen mode |

**Button styling:**
- Size: 48x48px circle
- Background: Semi-transparent dark, rgba(26, 31, 46, 0.7)
- Border: 1px solid rgba(255, 255, 255, 0.2)
- Icon color: White, 20x20px
- Hover: Background brightens (#2d3748), glow appears
- Active (pressed): Background darker, scale(0.95)
- Focus: Cyan outline, 3px

**Animation:**
- Hover: Scale 1.05, rotate icon slightly (5°), shadow pulse
- Click: Scale 0.95, brief flash (opacity 0.5)

**Accessibility:**
- Aria-labels on each button
- Keyboard accessible (Tab focus, Enter/Space to activate)
- Tooltip on hover (200ms delay)

#### 4.2.3.10 Minimap (Bottom-Right Corner)

**Position:** Bottom-right corner, (x: -180px from right, y: -180px from bottom)
**Size:** 160x160px
**Background:** Semi-transparent dark
**Border:** 1px solid rgba(255, 255, 255, 0.3)
**Border-radius:** 8px

**Content (default 2D sky projection):**
- **Projection:** Aitoff equal-area projection (all-sky map)
- **Starfield:** 500 brightest stars as white dots, sized by magnitude
- **Constellations:** Optional constellation lines (thin, semi-transparent)
- **Current view indicator:** Yellow rectangle showing current viewport FOV
- **Center crosshair:** Small cyan + at center

**Content (alternative top-down galaxy view):**
- (Toggle in settings)
- **Projection:** Top-down bird's-eye view of galaxy plane
- **Galaxy position:** Shown as disk outline
- **Camera position:** Yellow dot, line showing view direction
- **Zoom level:** Adjusts minimap content granularity

**Interaction:**
- **Click on minimap:** Teleport camera to that coordinate
- **Drag viewport indicator (rectangle):** Pan camera to new position (smooth 1s transition)
- **Scroll in minimap:** Zoom minimap viewport (independent of main viewport)

**Mobile:** Minimap hidden by default (can be toggled in settings)

#### 4.2.3.11 Fullscreen Mode Indicator

**Position:** Top-right, (x: -20px from right, y: 20px)
**Size:** 16x16px icon
**Icon:** Fullscreen indicator (appears only in fullscreen mode)
**Tooltip on hover:** "Exit fullscreen (F)"
**Click:** Exit fullscreen

---

### 4.3 Object Selected State (SCR-003)

#### 4.3.1 Screen Overview

**Purpose:** Display detailed information panel about selected celestial object.

**Entry condition:** User left-clicks object in 3D viewport.

**Exit condition:** User right-clicks elsewhere, presses Escape, or clicks X button on panel.

#### 4.3.2 Info Panel Layout

**Position (Desktop):** Right side of screen, (x: window.innerWidth - 400px to window.innerWidth, y: 0 to window.innerHeight)
**Position (Mobile):** Bottom sheet, (x: 0 to window.innerWidth, y: 50% to window.innerHeight)
**Size (Desktop):** 400px wide, full height, scrollable
**Size (Mobile):** Full width, ~50% height (resizable via drag-down)
**Background:** #1a1f2e (dark blue), semi-transparent (#1a1f2e, 0.95)
**Border-left:** 1px solid rgba(255, 255, 255, 0.2)
**Shadow:** -10px 0 30px rgba(0, 0, 0, 0.5)
**Animation:** Slide in from right (300ms, ease-out); slide out on close (300ms, ease-in)
**Z-index:** 100 (above viewport)

#### 4.3.3 Info Panel Components

##### 4.3.3.1 Header Section

**Position:** Top of panel, fixed
**Height:** 60px
**Background:** Slightly darker gradient: linear-gradient(180deg, #0f1419 0%, #1a1f2e 100%)
**Border-bottom:** 1px solid rgba(255, 255, 255, 0.1)
**Padding:** 16px

**Content grid:**
```
[Object Icon] Object Name                    [X]
              [Type Badge] [Catalog IDs...]
```

**Elements:**
- **Icon** (16x16px): Object type symbol (star ★, planet 🌍, galaxy ◉, nebula ☁)
- **Object name:** 24px font, Inter SemiBold, white, main identifier
- **Type badge:** Inline badge, 11px font, dark background, colored text (star: yellow, planet: blue, galaxy: purple, etc.)
- **Catalog IDs:** Small text, 10px, gray, comma-separated (HIP 87937, HD 172051, Gaia DR3 5868250...)
- **Close button (X):** 20x20px button, top-right, icon color white, hover gray

##### 4.3.3.2 Hero Section

**Position:** Below header
**Height:** 200px
**Background:** Linear gradient (top: dark, bottom: slightly lighter)
**Content:** High-resolution rendered preview or texture

**For stars:**
- Render 3D sphere with star spectrum color, corona glow (bloom effect)
- Size proportional to radius (if available)
- Animation: slow rotation (30s per full revolution)
- Overlay: magnitude brightness indicator (bottom-left)

**For planets:**
- Render 3D sphere with planet texture
- Include rings (if applicable)
- Lighting from sun direction
- Animation: rotation synchronized with real angular velocity
- Overlay: scale indicator (bottom-left)

**For galaxies:**
- High-res image (SDSS, Hubble, or procedural render)
- Static or slow pan animation
- Overlay: type classification (spiral, elliptical, etc.)

**For nebulae:**
- High-res Hubble/Palomar image or volumetric render
- Animation: subtle color shift

**For comets, asteroids:**
- 3D model if available, or placeholder icon
- Name and designation prominent

#### 4.3.3.3 Quick Stats Cards (Scrollable Section)

**Position:** Below hero, in scrollable area
**Grid:** 2 columns (desktop), 1 column (mobile)
**Card size:** ~180px x 80px per card
**Spacing:** 12px between cards
**Padding:** 16px

**Card styling:**
- Background: rgba(255, 255, 255, 0.03)
- Border: 1px solid rgba(255, 255, 255, 0.1)
- Border-radius: 8px
- Padding: 12px
- Font: Inter, 11px label (gray), 16px value (white), monospace for numbers

**Example cards (star):**

```
┌─────────────────┐  ┌─────────────────┐
│ Distance        │  │ Apparent Mag    │
│ 412.3 ly        │  │ 4.83            │
└─────────────────┘  └─────────────────┘

┌─────────────────┐  ┌─────────────────┐
│ Temperature     │  │ Spectral Type   │
│ 5,778 K         │  │ G2V             │
└─────────────────┘  └─────────────────┘

┌─────────────────┐  ┌─────────────────┐
│ Luminosity      │  │ Radius          │
│ 1.00 L☉        │  │ 1.00 R☉        │
└─────────────────┘  └─────────────────┘
```

**For each object type, exact fields specified in section 4.3.5 below.**

#### 4.3.3.4 Detailed Tabs

**Position:** Below quick stats
**Tab bar:**
- Sticky (stays at top when scrolling content)
- Style: Minimal, underline active tab
- Font: 12px Inter, white text
- Active tab: Underline color cyan (#06b6d4), bottom border 2px
- Inactive tab: Hover shows gray underline
- Scrollable horizontally if many tabs

**Tabs (common to all object types):**

| Tab | Content |
|-----|---------|
| Overview | Narrative description, notable facts, discovery info |
| Physical Properties | Mass, radius, density, temperature, composition, etc. |
| Orbital Data | For orbiting objects: semi-major axis, eccentricity, inclination, period |
| Discovery | Discoverer, date, method, first observations |
| Gallery | Image gallery (if multiple images available) |

**Tab content area:**
- Padding: 16px
- Scrollable if content > 200px
- Font: Inter 13px, line-height 1.6
- Color: #d0d5dd (light gray)

**Field format in tabs:**
```
Field Label:  Value (with unit)
Distance:     412.3 light-years
Temperature:  5,778 K
Composition:  Hydrogen 73%, Helium 25%, heavier 2%
```

#### 4.3.3.5 Actions Section

**Position:** Below tabs, sticky at bottom of panel
**Height:** 48px
**Background:** Darker gradient
**Border-top:** 1px solid rgba(255, 255, 255, 0.1)
**Padding:** 8px

**Button layout (row, wrapping if needed):**
```
[Go To] [Orbit] [Compare] [Bookmark] [Share] [External Links ↗]
```

**Button styling:**
- Font: 12px Inter SemiBold
- Padding: 8px 12px
- Border-radius: 6px
- Border: 1px solid rgba(255, 255, 255, 0.2)
- Background: rgba(255, 255, 255, 0.05)
- Color: white
- Hover: Background #2d3748, border white
- Click: Scale 0.98

**Button functions:**

| Button | Function |
|--------|----------|
| **Go To** | Smoothly animate camera to object; zoom to object at comfortable viewing distance; highlight object with glow |
| **Orbit** | Toggle: enter "orbit mode" around object; lock camera to orbit path; adjust zoom to maintain object in frame; show orbital parameters |
| **Compare** | Open comparison mode (SCR-011); align two objects' stats side-by-side |
| **Bookmark** | Add current view to bookmarks; show toast "Bookmarked!"; icon changes to filled bookmark if already bookmarked |
| **Share** | Open share modal (SCR-009); pre-populate with current view + selected object |
| **External Links** | Dropdown menu with links to: Wikipedia, Simbad, NED, official space agency pages |

#### 4.3.3.6 Data Requirements for Info Panel

**Data sources per object type:**
- **Stars:** Gaia DR3, Hipparcos-2, SIMBAD, exoplanet.eu
- **Planets:** NASA JPL Horizons, NASA Planetary Fact Sheets
- **Galaxies:** SDSS, NED, Galaxy Zoo, Hubble archive
- **Nebulae:** Simbad, Hubble archive, professional surveys

**Data fields must be cached after first load to avoid repeated API calls.**

---

### 4.3.5 Per-Object-Type Info Panel Specification

#### 4.3.5.1 Star Info Panel

**Header:**
- Name (primary), Bayer designation (e.g., α Centauri), Flamsteed number (if exists)
- Catalog IDs: HIP#, HD#, Gaia DR3 #, SIMBAD ID

**Hero Section:**
- 3D rendered star sphere with correct spectral color
- Rotation animation
- Brightness scaled logarithmically to apparent magnitude

**Quick Stats (6 cards):**
1. **Distance:** Format: "412.3 light-years" or "126.4 parsecs" (auto-select unit)
2. **Apparent Magnitude:** Format: "4.83 mag"
3. **Absolute Magnitude:** Format: "4.87 mag"
4. **Temperature:** Format: "5,778 K"
5. **Spectral Type:** Format: "G2V" (one badge per character: G, 2, V)
6. **Luminosity:** Format: "1.00 L☉"

**Additional Quick Stats (if data available):**
7. **Radius:** Format: "1.00 R☉" or "696,000 km"
8. **Mass:** Format: "1.00 M☉" or "1.989e30 kg"
9. **Age:** Format: "4.6 billion years"
10. **Radial Velocity:** Format: "-16.4 km/s"
11. **Proper Motion:** Format: "3.86 ±0.04 mas/yr"

**Detailed Tabs:**

**Overview Tab:**
```
Constellation: Taurus
Visible to naked eye: Yes
Notable names: Sol, Sun

Alpha Centauri is the closest stellar system to the Sun, located 
4.37 light-years away. The system comprises three stars: Proxima 
Centauri (red dwarf), Alpha Centauri A (G2 star), and Alpha Centauri 
B (K1 star). Proxima is the closest individual star.

This star is notable for hosting the exoplanet Proxima Centauri b, 
a potentially habitable Earth-mass world in the habitable zone.

First spectrum analysis: 1868 (Father Secchi)
Distance measurement: 1888 (Thomas Henderson, parallax)
```

**Physical Properties Tab:**
```
Mass:                    1.100 M☉ ± 0.007
Radius:                  1.205 R☉ ± 0.018
Density:                 1.41 g/cm³
Surface Gravity:         4.38 m/s²
Escape Velocity:         618 km/s
Effective Temperature:   5,778 K ± 20
Luminosity:              1.0 L☉
Surface Age:             4.6 billion years

Composition (by mass):
  Hydrogen:              73.46%
  Helium:                24.85%
  Oxygen:                0.77%
  Carbon:                0.29%
  Iron:                  0.16%
  Neon:                  0.12%
  Nitrogen:              0.09%
  Silicon:               0.07%
  Magnesium:             0.05%
  Sulfur:                0.04%

Rotation Period:         25.05 days (equator)
Axial Tilt:              7.25° to ecliptic

Magnetic Field:          1 Gauss (at surface)
Sunspot Cycle:           ~11 years
```

**Orbital Data Tab:**
```
[Only if star is in binary/multiple system]

Orbital Period:          [if applicable]
Semi-Major Axis:         [if applicable]
Eccentricity:            [if applicable]
Inclination:             [if applicable]
Argument of Periapsis:   [if applicable]

Companion Stars:
  Alpha Centauri B (K1V) - 23.4 AU away
  Proxima Centauri (M5.5V) - 9,000 AU away
```

**Discovery Tab:**
```
First Catalog:           Flamsteed (1712)
Spectral Classification: Lockyer (1868)
Distance Measurement:    Henderson (1888) via parallax
Modern Catalog:          Hipparcos (1997), Gaia DR3 (2022)

Key Observations:
  • 1612: Galileo first telescopic observation
  • 1838: First successful parallax measurement (Henderson)
  • 1900: Mount Wilson Observatory begins spectroscopy
  • 1995: Hipparcos mission refines astrometry
  • 2022: Gaia DR3 provides high-precision positions/velocities
```

**Gallery Tab:**
```
[Grid of 2-4 images]
- Solar photosphere (SDO imaging)
- Solar corona (total eclipse composite)
- Solar spectrum (SOHO spectrograph)
- Solar interior cutaway (illustration)
```

**Actions:**
- Go To
- Orbit (if binary system)
- Compare
- Bookmark
- Share
- External Links → [Wikipedia, SIMBAD, NED, NASA]

---

#### 4.3.5.2 Planet Info Panel

**Header:**
- Name (e.g., "Jupiter")
- Type badge: "Gas Giant" / "Terrestrial" / "Ice Giant" / "Sub-Neptune"
- Catalog/designation: "Solar System" or "TRAPPIST-1e" (exoplanet)

**Hero Section:**
- High-fidelity 3D rendered planet with correct color, clouds, atmosphere
- Includes rings if applicable (Saturn, Jupiter has faint rings)
- Lighting from parent star
- Slow rotation synchronized with real day length

**Quick Stats (6 cards):**
1. **Orbital Period:** Format: "365.25 days" or "1.00 years"
2. **Semi-Major Axis:** Format: "1.00 AU" or "149.6 million km"
3. **Orbital Eccentricity:** Format: "0.0167"
4. **Surface Gravity:** Format: "9.81 m/s²" (or if no solid surface: "N/A")
5. **Mean Radius:** Format: "6,371 km"
6. **Mean Temperature:** Format: "288 K" or "15°C"

**Additional Quick Stats (if data available):**
7. **Rotation Period:** "23h 56m 4s" or "1 sidereal day"
8. **Axial Tilt:** "23.44°"
9. **Escape Velocity:** "11.19 km/s"
10. **Density:** "5.52 g/cm³"
11. **Mass:** "5.972e24 kg" or "1.00 M⊕"

**Detailed Tabs:**

**Overview Tab:**
```
Classification: Terrestrial, Rocky Planet
Number of Moons: 1 (The Moon)
Ring System: No

Earth is the third planet from the Sun and the only known world 
to harbor life. It features a diverse range of ecosystems, from 
tropical rainforests to polar ice caps. The planet's unique 
properties—liquid water on surface, protective magnetic field, 
and stable climate—make it suitable for complex organisms.

Key Features:
  • Oxygen-rich atmosphere (21% O₂, 78% N₂)
  • Single natural satellite (The Moon, 1 AU away)
  • Magnetic field generated by liquid iron core
  • Plate tectonics driven by internal heat
  • Life-bearing biosphere spanning sea, land, air

Notable Geological Regions:
  • Pacific Ring of Fire (volcanic activity)
  • Mid-Ocean Ridge system (tectonic spreading)
  • Himalayas (mountain belt, plate collision)
  • Amazon Rainforest (biodiversity hotspot)
```

**Physical Properties Tab:**
```
Mass:                    5.972 × 10²⁴ kg (1.00 M⊕)
Radius (equator):        6,378 km
Radius (pole):           6,357 km
Mean Density:            5.52 g/cm³
Surface Gravity:         9.807 m/s²
Escape Velocity:         11.19 km/s
Rotation Period:         23h 56m 4s (sidereal)
Axial Tilt:              23.44° (to ecliptic)

Atmospheric Composition (% by volume):
  Nitrogen (N₂):         78.08%
  Oxygen (O₂):           20.95%
  Argon (Ar):            0.93%
  Carbon Dioxide (CO₂):  0.041% (~415 ppm, variable)
  Neon:                  0.0018%
  Helium:                0.0005%

Surface Temperature:
  Mean:                  288 K (15°C / 59°F)
  Min:                   183 K (-90°C) [Antarctica]
  Max:                   331 K (58°C / 136°F) [Death Valley]

Magnetic Field:
  Strength (dipole):     ~30 µT at equator
  Polarity:              Currently N→S (reversals ~200k years apart)
  Generated by:          Convecting liquid iron outer core

Water Coverage:
  Total:                 71% of surface
  Oceans:                96.5% of water
  Ice caps/glaciers:     1.74%
  Groundwater:           1.76%
```

**Orbital Data Tab:**
```
Distance from Parent Star: 1.00 AU (149,597,870.7 km)
Orbital Period:            365.25 days (1 tropical year)
Orbital Eccentricity:      0.0167
Orbital Inclination:       0.00° (by definition, ecliptic plane)
Longitude of Ascending Node: 0° (by definition)
Argument of Perihelion:    102.94°
Mean Anomaly:              100.46°
Orbital Velocity:          29.78 km/s (avg)

Current Position (Epoch J2000.0):
  Right Ascension:         [computed from orbital elements]
  Declination:             [computed from orbital elements]

Perihelion (closest to Sun):
  Distance:                0.983 AU
  Date:                    ~January 3

Aphelion (farthest from Sun):
  Distance:                1.017 AU
  Date:                    ~July 4
```

**Discovery Tab:**
```
Known since:             Antiquity (recognized as separate world in ancient times)
First heliocentric model: Copernicus (1543)
Scientific era begins:   Galileo (1610) telescopic observation

Key Milestones:
  • 1687: Newton's law of gravitation explains orbital motion
  • 1798: Cavendish measures gravitational constant (enables mass calc.)
  • 1805: Laplace calculates Earth's mass and density
  • 1912: Wegener proposes continental drift theory
  • 1968: Apollo 8 orbits Moon, first humans see Earth from space
  • 1972: Apollo 17 (final Moon landing); "Blue Marble" photo
  • 2000s: Climate science models Earth's climate system
  • 2024: James Webb Space Telescope probes exoplanet atmospheres

Spacecraft Missions:
  • Sputnik 1 (1957): First satellite
  • Yuri Gagarin (1961): First human in space
  • Apollo program (1961-1972): Lunar exploration
  • Skylab/Space Station era: Orbital laboratories
  • ISS (1998-present): Continuous human habitation in space
```

**Gallery Tab:**
```
[Grid of high-resolution satellite images and photos]
- NASA "Blue Marble" composite (full disk, cloud cover, oceans)
- ISS perspective (limb, atmosphere, night city lights)
- Landsat false-color (vegetation, water, geology)
- Aurora borealis from space (NOAA satellite)
- Hurricane/cyclone imagery (weather systems)
- Polar ice cap composite (seasonal variation)
- Nighttime lights composite (human civilization)
```

**Moons section (if applicable):**
```
Moon name: The Moon
Radius: 1,737 km
Mass: 7.342 × 10²² kg
Orbital period: 27.32 days
Distance: 384,400 km (3.84e8 m)
Eccentricity: 0.0549
Status: Tidally locked to Earth

[Additional large moons if present]
```

**Rings section (if applicable):**
```
Ring A: Outer main ring, 76,000 km extent, icy
Ring B: Main ring, 25,500 km extent, densest, icy
Cassini Division: Gap between A and B
Ring C: Crepe ring, tenuous, icy
[Additional rings if present]
```

**Actions:**
- Go To
- Orbit (locks camera to orbital path around star)
- Compare
- Bookmark
- Share
- External Links → [NASA Planetary Fact Sheet, Wikipedia, Space Agency]

---

#### 4.3.5.3 Galaxy Info Panel

**Header:**
- Name (e.g., "Andromeda Galaxy")
- Alternate names (e.g., "M31, NGC 224")
- Type badge: "Spiral" / "Elliptical" / "Irregular"

**Hero Section:**
- High-resolution SDSS or Hubble imaging
- Shows spiral structure, dust lanes, nucleus (if visible)
- Subtle pan animation across image (slow, 10s loop)

**Quick Stats (6 cards):**
1. **Distance:** "2.54 million light-years"
2. **Redshift:** "z = -0.001" (negative = moving toward us)
3. **Apparent Magnitude:** "3.4 mag"
4. **Hubble Type:** "SA(s)b" (Brinchmann-de Vaucouleurs classification)
5. **Diameter:** "200,000 light-years"
6. **Est. Stellar Mass:** "1.0 trillion M☉"

**Additional Quick Stats:**
7. **Number of Stars:** "~1 trillion"
8. **Foreground Star Count:** "[for nearby Milky Way analogs]"

**Detailed Tabs:**

**Overview Tab:**
```
Classification: Spiral Galaxy (Type SA(s)b)
Distance: 2.54 ± 0.27 million light-years
Redshift: z = -0.001 (approaching at ~300 km/s)
Part of: Local Group

The Andromeda Galaxy is the nearest major galaxy to the Milky Way 
and the largest in the Local Group. It is a spiral galaxy with a 
prominent nucleus and well-defined spiral arms. Andromeda is expected 
to merge with the Milky Way in approximately 4.5 billion years, 
eventually forming an elliptical supergalaxy tentatively named 
Milkomeda.

Observational History:
  • 964 CE: Abd al-Rahman al-Sufi first documented observation
  • 1612: Simon Marius names it Andromeda
  • 1764: Charles Messier catalogues as M31
  • 1925: Edwin Hubble measures Andromeda's distance (proof of 
          external galaxies beyond Milky Way)
  • 1998: Hubble Space Telescope high-resolution imaging
  • 2022: JWST infrared observations reveal stellar populations

Notable Features:
  • Bulge: Dense central concentration
  • Disk: Thin disk with spiral arms
  • Halo: Extended spheroid of older stars and globular clusters
  • Nucleus: Possible supermassive black hole (1.4 × 10⁸ M☉)
  • Satellite Galaxies: M32, M110 (dwarf ellipticals)
```

**Physical Properties Tab:**
```
Morphology:              Spiral galaxy, Type SA(s)b
Total Diameter:          ~220,000 light-years
Disk Diameter:           ~110,000 light-years
Bulge Radius:            ~16,000 light-years

Stellar Population:
  Blue stars (young):    ~1% by mass
  Red stars (old):       ~99% by mass
  Globular clusters:     ~460 confirmed
  Supergiant stars:      Hundreds visible
  Black holes:           Estimated ~15-20 (including central SMBH)

Mass Estimates:
  Total Mass:            1.5 × 10¹² M☉ (including dark matter)
  Stellar Mass:          1.0 × 10¹⁰ M☉
  Gas Mass:              0.5 × 10¹⁰ M☉
  Dark Matter:           1.4 × 10¹² M☉ (~93% of total)

Supermassive Black Hole (central):
  Mass:                  1.4 × 10⁸ M☉
  Schwarzschild radius:  ~1.4 AU
  Event horizon:         ~100 AU

Dust:
  Average extinction:    AV ≈ 0.3 mag (in disk)
  Temperature:           ~20 K (cold dust in outer regions)
  Composition:           Silicates, carbon, ice

Halo Properties:
  Radius:                ~200,000 light-years
  Stellar density:       Very low, diffuse
  Globular cluster count: Elevated concentration toward edge
  Dark matter distribution: Isothermal sphere (dominant at large radii)
```

**Orbital Data Tab:**
```
Motion relative to Milky Way:
  Approach velocity:     ~300 km/s (toward Milky Way)
  Current distance:      2.54 Mly
  Orbital period:        ~24 billion years (Andromeda - MW orbit)
  
Merger timeline (projected):
  Approach phase:        -4.5 to -2.0 Ga (4.5-2.0 billion years ago)
  First periapse:        ~2.2 Ga
  Merger complete:       ~6 Ga (in future)
  Resulting galaxy name: "Milkomeda" or "Milkdromeda"

Satellite Galaxies:
  M110 (NGC 205):        -24.5 mag, 17 kly away
  M32 (NGC 221):         -16.4 mag, 8.5 kly away
  Triangulum Galaxy (M33): 2.7 Mly away, separate group member

Local Group Membership:
  Milky Way:             Dominant member (similar size to Andromeda)
  Triangulum Galaxy:     Third-largest member
  Smaller satellites:    30+ dwarf galaxies
```

**Discovery Tab:**
```
First observation:       Abd al-Rahman al-Sufi, 964 CE
Medieval name:           "Small cloud"
Messier catalog:         M31 (1774)
New General Catalogue:   NGC 224 (1888)
Index Catalogue:         IC 7 (1895)

Scientific Milestones:
  • 1612: Simon Marius recognizes nebular appearance
  • 1755: Kant speculates about "island universes"
  • 1785: William Herschel observes structure, proposes disk shape
  • 1888: Isaac Roberts creates first detailed photograph
  • 1924: Edwin Hubble measures distance, proves it's separate galaxy
  • 1950: Walter Baade resolves individual stars
  • 1970: Vera Rubin's rotation curve studies hint at dark matter
  • 1995: Hubble Space Telescope Key Project refines distance
  • 2022: JWST begins high-resolution infrared observations

Catalogs:
  Messier (M):           M31
  New General Catalogue: NGC 224
  Index Catalogue:       IC 7
  Henry Draper:          HD 5394 (brightest star in nucleus)
  Uppsala Observatory:   UGC 00454
  Principal Galaxy Catalogue: PGC 2557
```

**Gallery Tab:**
```
[Grid of 4-6 images]
- SDSS optical composite (full disk)
- Hubble high-resolution (central bulge + spiral arms)
- JWST infrared (recent, 2022)
- X-ray (Chandra, high-energy sources)
- Radio continuum (VLA observations, synchrotron emission)
- Dust lanes (optical + infrared composite)
- Satellite galaxies context image
- Artist's conception (merger simulation, future Milkomeda)
```

**Actions:**
- Go To
- Orbit (if in a system)
- Compare
- Bookmark
- Share
- External Links → [NASA, SIMBAD, NED, Wikipedia]

---

## [CONTINUED - Due to token limits, remaining sections provided in next part...]

(Document continues with sections 4.4–12, totaling 3000+ lines comprehensive specification)

### 4.4 Search Active State (SCR-004)

#### 4.4.1 Screen Overview

**Purpose:** Find and navigate to any catalogued object via keyword search.

**Entry condition:** User presses `/`, clicks search icon, or types in search bar.

**Exit condition:** User selects result, presses Escape, or clicks outside.

#### 4.4.2 Search Interface Layout

**Search bar:** (Expanded state per 4.2.3.2) filled with user input.

**Autocomplete dropdown:**
- Below search bar, aligned left, max 10 results visible
- Max height: 400px (scrollable)
- Background: #1a1f2e, border: 1px solid #334155
- Each result item: 48px tall, 500px wide (responsive)

**Result item format:**
```
[Type Icon] Object Name              Distance: 412 ly │ Mag: 4.5
Catalog: HIP 87937 · HD 172051 · Gaia DR3 5868250...
```

**Elements per item:**
- **Icon** (16x16px): Colored by type (star: ★ yellow, planet: 🌍 blue, galaxy: ◉ purple, nebula: ☁ cyan)
- **Name** (primary, 14px white)
- **Distance** (right-aligned, 12px gray)
- **Magnitude/Type** (right-aligned, 12px gray)
- **Catalog IDs** (second row, 10px dark gray, truncated)

**Hover state:** Background #2d3748, left border 3px cyan

**Selected state (keyboard):** Cyan outline, background #2d3748

#### 4.4.3 Search Behavior

**Input handling:**
- Debounce: 300ms after user stops typing
- Min characters: 2 (avoid searching for single letters)
- Case-insensitive matching

**Search order (priority):**
1. **Exact name match:** "Sirius" → exact match, ranked #1
2. **Prefix match:** "Sir" → "Sirius", "Sirus" [typo]
3. **Fuzzy match:** "Sriius" → "Sirius" (Levenshtein distance < 2)
4. **Catalog ID match:** "HIP 87937" → exact catalog lookup
5. **Nearby objects:** If input looks like coordinates (e.g., "180.5, -30.2"), list nearby objects

**Max results:** 10 shown in dropdown; user can scroll or load more

**Special queries:**
- **"I'm feeling lucky":** Random object from catalog
- **Coordinate search:** "RA 180.5 DEC -30" → find nearby objects (within 5°)
- **Catalog search:** "NGC 224" → direct lookup

#### 4.4.4 Keyboard Navigation

| Key | Behavior |
|-----|----------|
| Arrow Up | Move selection up in results |
| Arrow Down | Move selection down in results |
| Enter | Navigate to selected result, close search |
| Escape | Close search, focus returns to viewport |
| Tab | Move focus to next result (or close if at end) |
| Shift+Tab | Move focus to previous result |

#### 4.4.5 Recent Searches

**Storage:** localStorage, key `recentSearches` (JSON array of last 5 searches)

**Display:**
- If search bar empty, show "Recent searches" label + 5 items above autocomplete dropdown
- Format: Simple list, clickable links
- Clear button: Clears all recent searches

**Content:** Last 5 searches by user (e.g., ["Sirius", "Andromeda", "M31"])

#### 4.4.6 No Results State

**Trigger:** User searched for term with 0 matches.

**Display:**
```
No results for "xyz123"

Suggestions:
• Check spelling
• Try a catalog ID (e.g., NGC 224, HD 72905)
• Search by coordinate (e.g., RA 180.5 DEC -30)
```

---

### 4.5 Settings Panel (SCR-005)

#### 4.5.1 Screen Overview

**Purpose:** Configure application behavior and visual preferences.

**Entry condition:** User clicks settings icon in toolbar or presses ⚙.

**Exit condition:** User clicks X, presses Escape, or clicks outside.

#### 4.5.2 Settings UI Layout

**Position:** Center-screen modal or right-side panel
**Size:** 600px wide, 80% height max (responsive)
**Background:** #1a1f2e with slight gradient
**Animation:** Slide in from right or fade in (300ms ease-out)

**Structure:**
```
[⚙ Settings]                                  [X]

[Graphics] [Data] [Audio] [Units] [Controls] [Language]

────────────────────────────────────────────

[Content Area - Scrollable]

────────────────────────────────────────────

[Reset to Defaults]  [Close] [Apply]
```

#### 4.5.3 Tab: Graphics

**Content:**

| Setting | Type | Options | Default | Effect |
|---------|------|---------|---------|--------|
| **Quality Preset** | Radio | Low / Medium / High / Ultra / Custom | High | Adjusts multiple settings at once |
| **Resolution Scale** | Slider | 50% – 150% (increments 5%) | 100% | Scales internal render resolution |
| **Anti-Aliasing** | Dropdown | Off / FXAA / MSAA 2x / MSAA 4x | FXAA | Smooths jagged edges |
| **Bloom** | Dropdown | Off / Low / Medium / High | Medium | Glow on bright objects |
| **Shadows** | Toggle | On / Off | Off | Real-time shadow rendering |
| **Star Count** | Slider | 10K – 500K (log scale) | 100K | Density of background stars |
| **Texture Quality** | Dropdown | 1K / 2K / 4K / 8K | 4K | Planet/galaxy texture resolution |
| **Post-Processing** | Group | Multiple toggles | All On | Enable/disable each effect |
| **Depth of Field** | Toggle | On / Off | Off | Blur out-of-focus areas |
| **Motion Blur** | Toggle | On / Off | Off | Blur during camera movement |
| **Chromatic Aberration** | Toggle | On / Off | Off | Color separation effect |
| **Lens Flare** | Toggle | On / Off | On | Sun/light lens artifacts |
| **Gravitational Lensing** | Toggle | On / Off | On | Light bending near massive objects |
| **Volumetric Lighting** | Toggle | On / Off | Off | Crepuscular rays in atmosphere |

**Presets (clicking preset auto-sets multiple settings):**

**Low:**
- Resolution: 75%
- AA: Off
- Bloom: Off
- Shadows: Off
- Star count: 10K
- Texture: 1K
- Post-processing: All Off

**Medium:**
- Resolution: 100%
- AA: FXAA
- Bloom: Low
- Shadows: Off
- Star count: 100K
- Texture: 2K
- Post-processing: Bloom + Lens Flare on

**High:** (Default)
- Resolution: 100%
- AA: MSAA 2x
- Bloom: Medium
- Shadows: On
- Star count: 100K
- Texture: 4K
- Post-processing: All On

**Ultra:**
- Resolution: 150% (supersampling)
- AA: MSAA 4x
- Bloom: High
- Shadows: On (high res)
- Star count: 500K
- Texture: 8K
- Post-processing: All On (maximum quality)

**Custom:** Unlock all sliders for manual configuration

**Persistence:** Save to localStorage as JSON object `graphicsSettings`

#### 4.5.4 Tab: Data Layers

| Setting | Type | Options | Default | Effect |
|---------|------|---------|---------|--------|
| **Constellation Lines** | Toggle | On / Off | On | Draw lines connecting bright stars |
| **Constellation Boundaries** | Toggle | On / Off | Off | Draw IAU constellation boundaries |
| **Constellation Art** | Toggle | On / Off | Off | Overlay constellation artwork |
| **Orbit Lines** | Toggle | On / Off | On | Show planetary/satellite orbits |
| **Labels** | Dropdown | None / Major Only / All | Major | Object name labels visibility |
| **Coordinate Grid** | Dropdown | None / Equatorial / Galactic / Ecliptic | None | Overlay coordinate reference grid |
| **Milky Way Outline** | Toggle | On / Off | On | Show Milky Way boundary wireframe |
| **Cosmic Web** | Toggle | On / Off | On (at galactic scale) | Show cosmic filaments + voids |
| **CMB Radiation** | Toggle | On / Off | Off | Overlay cosmic microwave background |
| **Exoplanet Markers** | Toggle | On / Off | On | Mark known exoplanet host stars |
| **Black Hole Markers** | Toggle | On / Off | On | Mark known black holes |
| **Ecliptic Plane** | Toggle | On / Off | On | Draw solar system ecliptic plane |
| **Galactic Plane** | Toggle | On / Off | On | Draw galactic equator plane |

#### 4.5.5 Tab: Audio

| Setting | Type | Range/Options | Default | Effect |
|---------|------|---------------|---------|--------|
| **Master Volume** | Slider | 0% – 100% | 80% | Overall volume |
| **Ambient Volume** | Slider | 0% – 100% | 70% | Background cosmic soundscape |
| **Spatial Volume** | Slider | 0% – 100% | 60% | 3D spatial audio events |
| **UI Sounds** | Toggle | On / Off | On | Button clicks, notifications |
| **Sonification Mode** | Toggle | On / Off | Off | Sound pitch/tone indicates data values |

**Sonification details:**
- When enabled, objects emit tones based on attributes
- Star pitch: temperature (hotter = higher pitch)
- Star volume: brightness (brighter = louder)
- Galaxy tone: redshift (more redshifted = lower frequency)
- Spatial audio: panned based on screen position

#### 4.5.6 Tab: Units

| Setting | Type | Options | Default | Effect |
|---------|------|---------|---------|--------|
| **Distance Unit** | Dropdown | Auto / km / miles / AU / ly / pc / Mpc | Auto | Selects distance display unit globally |
| **Temperature Unit** | Dropdown | Kelvin / Celsius / Fahrenheit | Kelvin | Converts temperature displays |
| **Mass Unit** | Dropdown | kg / Earth masses / Solar masses | Solar masses | Converts mass displays |
| **Time Format** | Dropdown | UTC / Local / Julian Date | UTC | Epoch/time display format |
| **Coordinate System** | Dropdown | Equatorial / Galactic / Ecliptic | Equatorial | Primary coordinate reference frame |

**Auto distance unit behavior:**
- Solar System scale: km or AU
- Stellar scale: light-years
- Galactic scale: parsecs or kiloparsecs
- Universal scale: megaparsecs or giga-light-years

#### 4.5.7 Tab: Controls

| Setting | Type | Range/Options | Default |
|---------|------|---------------|---------|
| **Mouse Sensitivity** | Slider | 0.1 – 3.0 | 1.0 |
| **Camera Speed (Fly Mode)** | Slider | 0.5x – 5.0x | 1.0x |
| **Invert Y-Axis** | Toggle | On / Off | Off |
| **Keyboard Layout** | Radio | WASD / ZQSD / Arrow Keys | WASD |
| **Gamepad Enabled** | Toggle | On / Off | On (if controller detected) |
| **Deadzone** | Slider | 0.0 – 0.5 | 0.2 |

**Custom Keybindings:** (Advanced section, toggle to reveal)

| Action | Current Key | Rebind |
|--------|-------------|--------|
| Move Forward | W | [Click to rebind] |
| Move Left | A | [Click to rebind] |
| Move Backward | S | [Click to rebind] |
| Move Right | D | [Click to rebind] |
| Increase Time Speed | E | [Click to rebind] |
| Decrease Time Speed | Q | [Click to rebind] |
| Pause/Play Time | Space | [Click to rebind] |
| Fullscreen | F | [Click to rebind] |
| Search | / | [Click to rebind] |
| [More rebindable actions...] | — | — |

**Rebind interaction:**
- Click "Click to rebind" → input becomes active (listens for key press)
- User presses desired key → bound, highlight flashes green
- Press Escape during rebinding → cancel
- Conflicts detected: yellow warning "Already bound to [other action]"

#### 4.5.8 Tab: Language (Future)

Placeholder for future multi-language support. Currently English only.

#### 4.5.9 Settings Persistence

**Storage method:** localStorage as JSON

**Schema:**
```json
{
  "graphicsSettings": {
    "qualityPreset": "high",
    "resolutionScale": 1.0,
    "antiAliasing": "fxaa",
    "bloom": "medium",
    "shadows": false,
    "starCount": 100000,
    "textureQuality": "4k",
    ...
  },
  "dataLayers": {
    "constellationLines": true,
    "constellationBoundaries": false,
    "constellationArt": false,
    ...
  },
  "audioSettings": {
    "masterVolume": 0.8,
    "ambientVolume": 0.7,
    ...
  },
  ...
}
```

**Auto-save:** Settings save immediately on change (no "Apply" button needed; "Apply" button optional for UX convenience)

**Reset button:** Clears all settings, restores defaults, shows confirmation dialog

---

### 4.6 Time Controls Expanded (SCR-006)

#### 4.6.1 Component Overview

**Entry condition:** User clicks time display in HUD or presses T.

**Exit condition:** User clicks elsewhere, presses Escape, or T again.

#### 4.6.2 Layout (Full Expanded)

**Position:** Bottom-center, (x: 50%, y: -250px from bottom)
**Size:** 400px wide, 240px tall
**Background:** Semi-transparent dark gradient
**Border:** 1px solid rgba(255, 255, 255, 0.2)
**Border-radius:** 8px
**Padding:** 16px
**Animation:** Expand from collapsed state (250ms ease-in-out)

**Content grid:**
```
┌─────────────────────────────────────────────┐
│ Epoch: 2026-04-16 12:00:00 UTC              │
│        (JD 2461316.500000)                  │
│                                             │
│ [◀◀] [⏸] [▶▶]  Speed: [━━━━○───] 1.00 x   │
│                                             │
│ [⬅ Reverse] [Forward ➜]                     │
│                                             │
│ [Now] [Moon 1969] [Dinosaurs] [Big Bang]    │
│                                             │
│ Jump to Date/Time:  [Date Picker ▼]        │
│                                             │
│  Current Simulation: Playing                 │
│  Iteration Speed: Real-time                  │
└─────────────────────────────────────────────┘
```

#### 4.6.3 Component Specification

##### 4.6.3.1 Epoch Display

**Content:**
```
Epoch: 2026-04-16 12:00:00 UTC
       (JD 2461316.500000)
```

**Format:**
- Top line: ISO 8601 date-time (YYYY-MM-DD HH:MM:SS TZ)
- Bottom line: Julian Date (14 significant digits, compact format)

**Update frequency:** Every 100ms when time simulation running (or every frame if very fast speed)

**Editing:** Click to open date/time picker (modal dialog)

##### 4.6.3.2 Playback Control Buttons

**Layout:** [◀◀] [⏸/▶] [▶▶]

**[◀◀] Fast Rewind:**
- Size: 32x32px button
- Icon: Double-arrow left
- Behavior: Step backward 1 unit (at current speed scale) per click
- Hold: Continuous rewind (speeds up if held > 2s)
- Tooltip: "Step backward 1 time unit"

**[⏸/▶] Play / Pause:**
- Size: 32x32px button
- Icon: Play triangle (▶) or pause bars (⏸) depending on state
- Behavior: Toggle time simulation play/pause
- Tooltip: "Play/Pause simulation (Space)"

**[▶▶] Fast Forward:**
- Size: 32x32px button
- Icon: Double-arrow right
- Behavior: Step forward 1 unit (at current speed scale) per click
- Hold: Continuous forward (speeds up if held > 2s)
- Tooltip: "Step forward 1 time unit"

##### 4.6.3.3 Speed Slider

**Layout:** [━━━━○───] Slider with logarithmic scale

**Range:** -1e8 to +1e8 seconds per simulation-second (log scale)

**Labeled tick marks:**
```
-1Gyr/s    -1Myr/s    -1yr/s    0    +1yr/s    +1Myr/s    +1Gyr/s
   ↓          ↓         ↓        ↓       ↓        ↓         ↓
─────────────────────────────────●─────────────────────────────────
```

**Display (right of slider):** "1.00 x" (coefficient multiplier)

**Interaction:**
- Drag slider: Continuous speed adjustment
- Click on tick mark: Jump to that speed
- Hover: Tooltip showing time unit
- Reverse toggle: Flips slider direction (negative → positive)

**Speed interpretation:**
- 0: Time paused
- 1: Real-time (1 second per second)
- 60: 1 minute per frame (at 60 FPS = 1 second passes per frame)
- 3600: 1 hour per second
- 86400: 1 day per second
- 1 year ≈ 31,536,000 seconds
- 1 Myr ≈ 3.16e13 seconds

**Logarithmic scale formula:** `log(speed + 1e-9)` to handle zero and negative values

##### 4.6.3.4 Direction Toggles

**Layout:** [⬅ Reverse] [Forward ➜]

**[⬅ Reverse]:**
- Toggle button, on/off state
- When on: Time runs backward; speed slider flips polarity (right = negative, left = positive)
- Icon: Left arrow + colored background when active
- Tooltip: "Reverse time direction"

**[Forward ➜]:**
- Toggle button, on/off state
- When on: Time runs forward (normal); speed slider normal
- Icon: Right arrow + colored background when active
- Default: ON
- Tooltip: "Normal time direction"

**Mutual exclusivity:** Only one active at a time (radio-button behavior)

##### 4.6.3.5 Preset Buttons

**Layout:** Horizontal row, wrapping if necessary

**Presets:**

| Button | Target Date | Notes |
|--------|-------------|-------|
| **Now** | Current epoch | Returns to real-world present time |
| **Moon Landing** | 1969-07-20 12:30:00 UTC | Apollo 11 lunar landing moment |
| **Voyager Launch** | 1977-09-05 14:29:00 UTC | Voyager 1 launch |
| **Dinosaur Extinction** | -65,999,949 12:00:00 | K-Pg extinction event (66 Ma ago) |
| **Snowball Earth** | -719,999,950 12:00:00 | Cryogenian period (720 Ma ago) |
| **Solar System Formation** | -4,600,000,000 12:00:00 | ~4.6 billion years ago |
| **Big Bang** | -13,800,000,000 12:00:00 | ~13.8 billion years ago |

**Interaction:**
- Click: Jump to preset epoch (smooth camera transition, no position change)
- Tooltip: Shows full date/time of preset

##### 4.6.3.6 Manual Date Picker

**Layout:** "Jump to Date/Time: [Date Picker ▼]"

**Click behavior:**
- Opens modal dialog with calendar + time controls
- Calendar: Standard month-year view, clickable dates
- Time: Hours (0-23), minutes (0-59), seconds (0-59) spinners or input fields
- OK / Cancel buttons
- Validation: Check bounds (not beyond observable universe age)

**Input format:** Accepts ISO 8601 strings or natural language ("next year", "66 million years ago")

##### 4.6.3.7 Status Display

**Content:**
```
Current Simulation: Playing
Iteration Speed: Real-time (1.00x)
Time dilation: [physics note if relativistic effects modeled]
```

**Dynamic:** Updates as user adjusts controls

#### 4.6.4 Time Simulation Behavior (Physics)

**Epoch management:**
- Store epoch as Julian Date (double precision float)
- Each frame: `epoch += deltaTime * speedFactor`
- Clamp epoch to valid range: [0, 13.8e9 years]

**Coordinate updates:**
- For each solar system object: calculate position using Kepler orbit elements + current epoch
- For each galaxy: position constant (no orbital dynamics at galactic scale)
- For stars: position updates only if proper motion + parallax data available

**Special effects at time edges:**
- Approaching Big Bang (epoch < 1 billion years): render CMB-like radiation field, cosmic structures appear
- Approaching present (epoch ~ now): show modern landmarks (satellites, ISS) if data available

**Performance:**
- Physics update every frame (even if not visible, for consistency)
- Optimization: Use lookup tables for frequently-computed quantities (orbital positions, ephemerides)

---

### 4.7 Guided Tours (SCR-007)

#### 4.7.1 Tour System Overview

**Purpose:** Educate users via automated camera paths with narration.

**Entry condition:** User clicks "Take a Tour" or selects from tour menu.

**Exit condition:** Tour completes, user clicks "Skip Tour", or presses Escape.

#### 4.7.2 Available Tours

| Tour Name | Duration | Target | Narration |
|-----------|----------|--------|-----------|
| **Welcome to the Universe** | 5 min | Solar System → Milky Way | Overview of cosmic scales |
| **Journey to Andromeda** | 8 min | Solar System → Andromeda Galaxy | Nearest major galaxy |
| **Inside a Galaxy** | 6 min | Galactic center details | Structure of spiral galaxies |
| **The Local Group** | 7 min | Local Group members | Our cosmic neighborhood |
| **Deep Universe** | 10 min | Cosmic web | Structure of universe |
| **Exoplanet Worlds** | 6 min | Known exoplanets | Diversity of planetary systems |
| **Black Hole Mysteries** | 7 min | Sagittarius A* + others | Supermassive black holes |

#### 4.7.3 Tour HUD

**Position:** Bottom screen overlay during tour

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ [▶ Tour 1 of 3] Narration text appears here...         │
│                                                         │
│ "As we zoom toward the Andromeda Galaxy, the largest  │
│  in our Local Group, we see it's a spiral galaxy      │
│  similar to the Milky Way. It's approaching us at..."  │
│                                                         │
│ [◀ Previous] [⏸ Pause] [Skip ▶]  Progress: ████░░░░ │
└─────────────────────────────────────────────────────────┘
```

**Components:**

- **Progress text:** "Waypoint 1 of 3" (current / total)
- **Narration panel:** 
  - 3 lines max height, scrollable if longer
  - 14px font, light gray text
  - Fade in (500ms), hold for narration, fade out (300ms)
- **Control buttons:**
  - [◀ Previous]: Go back one waypoint
  - [⏸ Pause]: Pause camera motion, pause narration
  - [Skip ▶]: Advance to next waypoint
  - [⊗ Exit Tour]: Close tour UI, return to free navigation
- **Progress bar:** Visual indicator of tour completion (0% → 100%)

#### 4.7.4 Camera Behavior During Tours

**Path:** Pre-defined spline curve through 3D space

**Movement:**
- Smooth cubic hermite spline interpolation along path
- Duration: varies per tour segment (2-15s per waypoint)
- User can pause to look around freely (camera unlocked from path)
- Resume: camera smoothly re-aligns with path

**Highlights:** Objects mentioned in narration briefly glow (brighten, outline animation)

#### 4.7.5 Tour Data Format

**Storage:** JSON file per tour

**Schema:**
```json
{
  "id": "journey-andromeda",
  "name": "Journey to Andromeda",
  "description": "...",
  "duration": 480,
  "waypoints": [
    {
      "id": "wp1",
      "title": "Starting Point",
      "position": [0, 0, 1e6],
      "target": [0, 0, 0],
      "duration": 3,
      "narration": "Welcome to...",
      "highlights": ["Earth", "Sun"]
    },
    ...
  ]
}
```

---

### 4.8 Bookmark Manager (SCR-008)

#### 4.8.1 Manager Overview

**Purpose:** Save and manage favorite views.

**Entry condition:** User clicks bookmark icon in toolbar, or presses B.

**Exit condition:** User closes panel or navigates to a bookmark.

#### 4.8.2 UI Layout

**Position:** Center screen modal or side panel
**Size:** 700px wide, 600px tall (responsive)

**Structure:**
```
[📍 Bookmarks]                              [X]

[Search bookmarks...]  [Sort ▼]  [+ New]

────────────────────────────────────────────

[Grid of bookmark cards, 3 columns]

────────────────────────────────────────────

[Import] [Export]  [Delete Selected]
```

#### 4.8.3 Bookmark Card Format

**Size:** 200x180px per card
**Content:**
```
┌─────────────────────────────────────┐
│ [Thumbnail - 200x120px]             │
│                                     │
├─────────────────────────────────────┤
│ My Favorite Galaxy                  │
│ Created: 2026-04-10                 │
│ RA: 180.5°, Dec: -30.2°             │
│                                     │
│ [Go To] [Rename] [Delete] [Share]   │
└─────────────────────────────────────┘
```

**Thumbnail:** Rendered preview of saved view (pre-computed on save)

**Actions per card:**
- **Go To:** Navigate to saved view (smooth camera transition)
- **Rename:** Edit bookmark name (inline or modal)
- **Delete:** Remove bookmark (confirmation dialog)
- **Share:** Copy shareable link

#### 4.8.4 Bookmark Data Format

**Schema:**
```json
{
  "id": "bm_12345",
  "name": "My Favorite Galaxy",
  "createdDate": "2026-04-10T15:30:00Z",
  "state": {
    "ra": 180.5,
    "dec": -30.2,
    "dist": 8500,
    "scale": "galactic",
    "time": 2451545.0,
    "speed": 1,
    "obj": "NGC7331"
  },
  "thumbnail": "data:image/png;base64,...",
  "notes": "[optional user notes]"
}
```

**Storage:** localStorage + optional cloud sync

#### 4.8.5 Import/Export

**Format:** JSON file, encrypted or plaintext

**Export:** Download `.cosmos-bookmarks.json` file

**Import:** Upload file, validate schema, merge with existing bookmarks (no duplicates)

---

### 4.9 Share Modal (SCR-009)

#### 4.9.1 Modal Layout

**Position:** Center screen
**Size:** 500px wide, 450px tall
**Background:** Semi-transparent overlay + white modal
**Animation:** Fade in + scale (300ms)

**Structure:**
```
[🔗 Share View]                         [X]

Current View URL:
[https://cosmos-explorer.app/?s=abc123...] [Copy ✓]

────────────────────────────────────────────

Share on Social Media:
[f Facebook] [𝕏 Twitter] [/r Reddit] [⬤ Discord]

────────────────────────────────────────────

Embed Code:
[<iframe src="..." width="800" height="600" >]  [Copy]

────────────────────────────────────────────

QR Code:
        ██████████
       ██      ██
      ██  ░░░░  ██
       ██      ██
        ██████████

[Download QR as PNG]
```

#### 4.9.2 Components

**URL Display:**
- Full URL in text field, read-only or selectable
- Copy button: Copies to clipboard, shows toast "Copied!"
- Short URL option: Shows shortened URL if service available

**Social Media Buttons:**
- Facebook: Pre-fills post with view info + image
- Twitter/X: Pre-fills tweet with title + short URL
- Reddit: Opens Reddit post composer
- Discord: Shows embed code for Discord embed

**Embed Code:**
- Generates `<iframe>` HTML to embed view on website
- Configurable: Width, height, autoplay
- Copy button: Copies code to clipboard

**QR Code:**
- Encodes full URL as QR code
- Rendered on-the-fly (qrcode.js library)
- Download PNG button: Saves image to file

#### 4.9.3 Share State Encoding

(Specification in section 3.6)

---

### 4.10 Help Overlay (SCR-010)

#### 4.10.1 Help UI

**Entry:** Press ? or click help icon (toolbar)

**Exit:** Press Escape or click X

**Content:**

**Tabs:**
- Keyboard Shortcuts
- Mouse Controls
- Touch Gestures
- Quick Start
- Full Documentation Link

#### 4.10.2 Keyboard Shortcuts Reference

**Organization:** Grouped by category

```
NAVIGATION
─────────────────────────────────────
W, A, S, D         Move (fly mode)
Q, E               Roll camera
Shift              Speed boost
Right-click drag   Look around / Rotate
Scroll             Zoom in/out

TIME & SIMULATION
─────────────────────────────────────
Space              Play/Pause time
T                  Toggle time controls
< >                Speed down/up

INTERFACE
─────────────────────────────────────
/                  Open search
?                  Show help
Escape             Close panel
B                  Toggle bookmark manager
F                  Fullscreen
⚙                  Open settings

SPECIAL
─────────────────────────────────────
Click object       Select & info panel
Right-click        Context menu
Middle-drag        Pan camera
```

#### 4.10.3 Mouse/Touch Diagrams

**Mouse diagram:** Illustrated showing scroll (zoom), left-drag (rotate), right-click (menu), etc.

**Touch diagram:** Showing pinch (zoom), two-finger drag (rotate), swipe (pan), long-press (menu)

---

### 4.11 Comparison Mode (SCR-011)

#### 4.11.1 Purpose

Allow side-by-side comparison of two celestial objects.

#### 4.11.2 Layout

**Position:** Full-screen split view

**Structure:**
```
Object A (Left)            │ Object B (Right)
                          │
[Info Panel A]            │ [Info Panel B]

────────────────────────────────────────────
Comparison Metrics:
  Property               A      B      Ratio
  ────────────────────────────────────────
  Radius              696K km  6.4K km  108:1
  Mass              1.99e30 kg 5.97e24 kg (334:1)
  Temperature       5,778 K    288 K    20:1
  ...
────────────────────────────────────────────

[Swap Objects] [Edit Selection] [Close]
```

#### 4.11.3 Interaction

**Selecting objects for comparison:**
- User selects object A
- Clicks "Compare" action button
- Modal opens: "Select object B for comparison"
- User clicks/searches for object B
- Comparison view displays

**Metrics calculation:**
- Ratio: A / B (formatted as "N:1" if > 1, or "1:N" if < 1)
- Difference: (A - B) / B * 100% (percentage difference)
- Both shown for all numeric properties

---

### 4.12 Screenshot & Recording Mode (SCR-012)

#### 4.12.1 Screenshot Interface

**Entry:** Click screenshot icon in toolbar

**Modal:**
```
[📷 Capture Screenshot]

Resolution: [1920x1080] ▼
Format: [PNG] ▼
Include UI: [Toggle]

[Capture Preview]
[Download]  [Share]  [Cancel]
```

**Resolution options:** 1080p, 1440p, 4K, 8K, custom

**Format:** PNG (lossless) or JPEG (lossy, quality slider)

**Include UI:** Toggle shows/hides all HUD elements in capture

**Capture preview:** Shows what will be captured (before download)

**Download:** Saves as `.cosmos-{timestamp}.png`

#### 4.12.2 Recording Interface

**Entry:** Click record icon

**Modal:**
```
[⏺ Start Recording]

Resolution: [1920x1080] ▼
Duration: [30] seconds
Frame rate: [60] FPS
Format: [WebM] ▼

[Record Preview]
[Start]  [Cancel]
```

**Format:** WebM (VP9 codec) for good quality+size tradeoff

**Duration:** User sets max duration; can stop early

**File output:** `.cosmos-{timestamp}.webm`

**Note:** Rendering to offscreen canvas at target resolution; real-time recording not guaranteed (may be slower)

---

### 4.13 Mobile Layout (SCR-013)

#### 4.13.1 Responsive Adaptations

**Viewport < 768px width:**

- **Info panel:** Changes from right-side to bottom sheet (50% height, draggable)
- **Toolbar:** Floating action button (FAB) in bottom-right, radial menu on tap
- **Search bar:** Full width at top, expands down
- **Minimap:** Hidden by default, toggle via settings
- **Time controls:** Collapse by default, bottom-center
- **Coordinate display:** Smaller font, move to bottom-left
- **Scale indicator:** Smaller, move to bottom-left corner
- **Labels:** Larger font, reduced density (avoid clutter)

#### 4.13.2 Touch Interactions

- **Two-finger pinch:** Zoom (logarithmic scaling)
- **Two-finger drag:** Rotate/orbit
- **Single-finger swipe:** Pan
- **Tap:** Select object
- **Long-press:** Context menu
- **Double-tap:** Zoom to object

#### 4.13.3 Mobile-Specific UI

**Floating Action Button (FAB):**
- Position: Bottom-right, 56x56px circle
- Icon: Menu (three horizontal lines)
- Tap to expand radial menu:
  ```
         [?]
        Help
        
  [B]Bookmark    [⚙]Settings
  
        [Share]
        Share
  ```
- Each sub-button: 48x48px, arranged in circle

**Bottom sheet (info panel):**
- Drag handle at top (white bar)
- Swipe down to close
- Resizable by dragging handle up/down

#### 4.13.4 First-Time Mobile Experience

**On first load on mobile:**
- Show toast: "Tip: Pinch to zoom, two-finger drag to rotate. Long-press for menu."
- Storage flag: `ui.mobileFirstVisit`

---

## 5. DATA FLOW SPECIFICATIONS

### 5.1 "User Clicks a Star" (Object Selection Flow)

**Sequence:**

1. **Input capture** (T=0ms):
   - Mouse click event fired on canvas
   - Event coordinates: (clientX, clientY)

2. **Raycasting** (T=1ms):
   - Create Three.js Raycaster from camera through click point
   - Perform intersection test against visible object geometries
   - Filter out HUD/UI geometries
   - Return list of intersected objects, sorted by distance

3. **Object selection** (T=2ms):
   - Identify nearest intersection
   - Extract object ID from Three.js userData: `const objectId = intersection.object.userData.id`
   - Verify object ID is valid (exists in catalog, not placeholder)

4. **State update** (T=3ms):
   - Dispatch Redux action: `selectObject({ objectId, timestamp: Date.now() })`
   - Reducer updates state: `state.selectedObject = { id, catalog, ... }`
   - Trigger data fetch if object details not in cache

5. **Camera animation** (T=4ms):
   - Compute new camera position: positioned to orbit around selected object at comfortable distance
   - Distance = `max(object.radius * 3, 1000)` or from predefined LOD table
   - Target = object position
   - Animate camera over 1.5s using SLERP (spherical linear interpolation) for rotation, linear interpolation for position
   - Easing: ease-in-out cubic

6. **UI animation** (T=5ms):
   - Info panel animates in from right: slide-in 300ms ease-out
   - Panel position: initial x = window.innerWidth, final x = window.innerWidth - 400
   - Opacity: 0 → 1 fade-in 300ms

7. **Highlight effect** (T=6ms):
   - Render object with enhanced bloom: glow intensity 2x normal
   - Add outline effect (edge highlight shader)
   - Animation duration: fade in 200ms

8. **Audio** (T=7ms):
   - Play selection sound: 100ms harmonic chime (synthesized via Web Audio API)
   - Pitch: based on object temperature or magnitude (if available)
   - Volume: 0.5 (adjustable via settings)
   - Fade-out: 100ms

9. **Data load** (T=8ms):
   - Check Redux cache: `state.objects[objectId]`
   - If cache hit: display cached data immediately
   - If cache miss: 
     - Dispatch async thunk: `fetchObjectDetails(objectId)`
     - Fetch from API: `/api/catalogs/{catalog}/objects/{objectId}`
     - Parse response: extract fields per object type (section 4.3.5)
     - Display loading skeleton in info panel (gray placeholders)
     - Update UI when data arrives

10. **URL update** (T=9ms):
    - Debounce: only update if > 500ms since last update
    - Encode state: `EncodeURLState({ selectedObject: objectId, ... })`
    - Call `window.history.replaceState()`; update hash: `#obj=HIP87937`

11. **Analytics** (T=10ms):
    - Queue event: `{ event: 'object_selected', objectType: 'star', objectId: 'HIP87937', timestamp }`
    - Send to analytics endpoint (async, non-blocking)

**Total latency:** < 50ms from click to info panel visible

**Visual feedback:** Glow + selection sound provide immediate confirmation

---

### 5.2 "User Zooms from Earth to Andromeda Galaxy" (Scale Transition Flow)

**Setup:** User at Earth (dist = 1e7 m, solar system scale), zooms to M31 Andromeda (dist = 7.65e22 m, galactic scale)

**Sequence:**

1. **Scroll event** (T=0ms):
   - Wheel event fired on canvas
   - Extract deltaY (scroll direction)
   - If deltaY > 0: zoom out (increase dist)
   - If deltaY < 0: zoom in (decrease dist)

2. **Distance update** (T=1ms):
   - Current dist = 1e7 m
   - Zoom factor per scroll: `zoomFactor = 1.1` (10% per notch)
   - New dist = dist * (zoomFactor ^ scrollClicks)
   - Clamp: `dist = clamp(dist, 1e3, 1e26)` (1km to Hubble distance)

3. **Scale boundary detection** (T=2ms):
   - Define boundaries (meters):
     - Solar: dist < 1e13 m (~67 AU)
     - Stellar: 1e13 < dist < 1e18 m (0.3–6.5 kpc)
     - Galactic: 1e18 < dist < 1e22 m (0.3–1 Mpc)
     - Universal: dist > 1e22 m (> 1 Mpc)
   - Determine current scale: `scale = getScaleForDistance(dist)`
   - If scale changed: trigger data load (next step)

4. **Data load cascade** (T=3ms):
   - New scale = "universal"
   - Load data tiles for galactic scale:
     - Nearby galaxies catalog (< 10 Mpc): ~1 million galaxies, 40MB
     - Cosmic web filaments (low-res): 5MB
     - CMB sky background (optional): 20MB
   - Tiles load in priority order: nearest first
   - Show loading spinner in HUD if > 300ms

5. **Rendering LOD transition** (T=10ms):
   - Solar system scale → hide planets, asteroids, orbits
   - Show stars only
   - Stellar scale → hide individual stars, show star clusters
   - Galactic scale → show Milky Way + nearby galaxies (point sprites)
   - Universal scale → show galaxy clusters (point cloud)
   - Transition: smooth fade-in/fade-out of objects (500ms)

6. **Camera smoothing** (T=11ms):
   - Animate camera distance over time interval based on zoom speed:
     - Slow zoom (1-2 notches/sec): 1s transition
     - Fast zoom (> 5 notches/sec): 2s transition
   - Position interpolation: lerp(currentPos, targetPos, t) where t = time / duration
   - Easing: ease-out-cubic (slows down near target)

7. **HUD updates** (T=50ms):
   - Scale indicator (4.2.3.6) animates:
     - Visual ruler morphs from "1 AU = 50px" to "1 Mly = 50px"
     - Labels fade out/in
     - Duration: 200ms ease-out
   - Breadcrumb updates: "... > Laniakea > Milky Way" → "Universe > Laniakea > [Current position]"
   - Fade-in/out: 300ms

8. **Audio accompaniment** (optional, 4.1.4):
   - If scaleTransitionEffect enabled:
     - Play "whoosh" sound (200ms, fade-in/out)
     - Pitch change: low (current scale) → high (target scale)

9. **Camera shake + effects** (optional):
   - If enabled: brief chromatic aberration + motion blur
   - Duration: 300ms
   - Intensity: based on zoom distance (faster zoom = stronger effect)

10. **URL update** (T=100ms):
    - Debounce: update every 500ms
    - Encode new dist + scale: `#dist=7.65e22&scale=universal`
    - Call `window.history.replaceState()`

11. **Culling & performance**:
    - As dist increases, cull nearby objects (don't render if > culling distance)
    - As dist decreases, un-cull distant objects
    - Empirically: render objects where `(object_radius / dist) > 1 pixel` on screen

**Performance requirements:**
- FPS should remain > 30 during zoom
- If FPS drops below 30, reduce detail automatically
- Loading tiles should not block main thread (async)

**Total zoom time:** 2–3s from Earth to Andromeda

---

### 5.3 "User Starts Time Simulation at 1 Year/Second" (Time Simulation Flow)

**Setup:** User clicks play button, speed slider set to 1 year/second (≈ 31.5M seconds/second)

**Sequence:**

1. **Play button click** (T=0ms):
   - UI event: user clicks play icon (▶)
   - Dispatch action: `setTimePlayback({ playing: true })`
   - State: `simulation.isPlaying = true`

2. **Physics loop activation** (T=1ms):
   - If not already running, start `update()` function in animation loop:
     ```
     function update(deltaTime) {
       if (simulation.isPlaying) {
         epoch += deltaTime * simulation.speed;
       }
       render();
       requestAnimationFrame(update);
     }
     ```
   - DeltaTime: capped at 16ms (60 FPS), prevents jumps if frame drops

3. **Epoch advancement** (T=2ms per frame):
   - Current epoch: JD 2461316.5 (2026-04-16 12:00:00)
   - Speed: 1 year/second = 31,536,000 seconds/second
   - Per frame (16ms): epoch += 0.016 * 31,536,000 ≈ 504,576 seconds ≈ 5.84 days
   - So: epoch advances ~6 days per frame (at 60 FPS)

4. **Orbital position calculation** (T=3ms per object):
   - For each solar system object (planets, moons, asteroids):
     - Input: epoch (Julian Date), orbital elements (a, e, i, ω, Ω, M₀)
     - Compute mean anomaly: M = M₀ + sqrt(μ/a³) * (t - t₀)
     - Solve Kepler equation: E = M + e * sin(E) (Newton-Raphson, 3 iterations)
     - Compute true anomaly: ν = 2 * atan2(sqrt(1+e) * sin(E/2), sqrt(1-e) * cos(E/2))
     - Compute position in orbital plane
     - Transform to ecliptic/equatorial coordinates
     - Update object.position in Three.js scene

5. **Event detection** (T=4ms):
   - Check if any significant events occur at current epoch:
     - Moon eclipses Sun (date-based lookup table)
     - Planet conjunctions (position checks)
     - Solar system alignment (rare, calculated)
     - Historical events (e.g., Moon Landing 1969-07-20)
   - If event found: trigger notification (optional audio + visual highlight)

6. **Display update** (T=5ms):
   - Update epoch display (4.6.3.1):
     - Format epoch to ISO date-time
     - Format as Julian Date
     - Update UI text
   - Update speed indicator: "(6.00 days/frame) or (1 year/second)"

7. **Rendering** (T=6ms):
   - Three.js render() call with updated object positions
   - Planets now at new positions in their orbits
   - Camera follows if in "auto-track" mode (optional)

8. **Audio updates** (optional):
   - If sonification enabled: adjust pitch/volume of ambient sound based on objects' positions
   - Closer objects: higher pitch
   - Faster-moving objects: higher frequency modulation

9. **Pause button interaction**:
   - User clicks pause (⏸)
   - Dispatch action: `setTimePlayback({ playing: false })`
   - State: `simulation.isPlaying = false`
   - Physics loop continues but skips epoch update
   - Epoch frozen at current value

**Accuracy considerations:**
- Kepler solver: sufficient for < 1M year timescales
- For 1B+ year timescales: use simplified n-body models (galaxies assumed static)
- Epoch limits: clamp to [0, 13.8e9 years] (before Big Bang and after far future invalid)

---

### 5.4 "User Searches for 'Sirius'" (Search Flow)

**Sequence:**

1. **Input detection** (T=0ms):
   - User presses `/` key or clicks search icon
   - Dispatch action: `openSearch()`
   - Search bar expands (animated)
   - Focus input element: `input.focus()`

2. **User types** (T=50ms):
   - First character: "S"
   - Keystroke → input change event
   - Redux receives input value: `setSearchInput("S")`

3. **Debounce** (T=300ms):
   - Wait 300ms after last keystroke
   - If user still typing, restart 300ms timer
   - Once 300ms elapsed, proceed to search

4. **Query construction** (T=301ms):
   - Input: "Sirius"
   - Construct search query: `{ query: "sirius", limit: 10 }`

5. **Search execution** (T=302ms):
   - Query search index (all-in-memory, no backend call):
     - Fuzzy match: use Levenshtein distance algorithm
     - Results sorted by: exact match > prefix > fuzzy > distance
   - Catalog sources:
     - Star names (Hipparcos, Bayer, proper names): ~200K entries
     - Exoplanet names: ~5K entries
     - Galaxy names (NGC, Messier, UGC): ~1M entries
   - Results returned: top 10

6. **Results display** (T=303ms):
   - Autocomplete dropdown populated:
     ```
     [★ Sirius]           Distance: 8.6 ly    | Mag: -1.46
     HIP 48915, HD 48915, Gaia DR3 5571556...
     
     [★ Sirius B]         Distance: 8.6 ly    | Mag: 8.44
     ...
     
     [★ Sirius C]         (hypothetical, unseen)
     ...
     ```
   - Highlight first result (keyboard nav ready)
   - User can scroll or use arrow keys

7. **Result selection** (T=350ms):
   - User clicks result or presses Enter
   - Selected result: "Sirius" (Hipparcos 48915)

8. **Navigation** (T=351ms):
   - Dispatch action: `selectObject({ objectId: "HIP48915" })`
   - (Continue with object selection flow from 5.1)

9. **Search cleanup** (T=400ms):
   - Close search bar
   - Update recent searches: prepend "Sirius" to array
   - Clear input field

**Performance targets:**
- Search return < 50ms (in-memory index)
- Autocomplete appears instantly (< 100ms from keystroke start)

---

### 5.5 "User Takes a Screenshot" (Screenshot Flow)

**Sequence:**

1. **Icon click** (T=0ms):
   - User clicks screenshot icon in toolbar (4.2.3.9)
   - Dispatch action: `openScreenshotModal()`

2. **Modal render** (T=50ms):
   - SCR-012 modal displayed
   - Default settings: 1080p PNG, UI included
   - User can adjust resolution, format, UI toggle

3. **User confirms** (T=500ms):
   - User clicks "Capture" button
   - Dispatch action: `captureScreenshot({ resolution: "1920x1080", format: "png", includeUI: true })`

4. **Pre-capture setup** (T=501ms):
   - If includeUI = false: temporarily hide all HUD elements
   - Create offscreen canvas: `const offscreenCanvas = document.createElement('canvas')`
   - Set canvas size to target resolution: canvas.width = 1920, canvas.height = 1080
   - Get WebGL context from offscreen canvas

5. **Render to offscreen** (T=502ms):
   - Copy current Three.js renderer state (camera, scene, lights)
   - Render scene to offscreen canvas at target resolution
   - If resolution > screen resolution: perform supersampling (render at 2x, downscale)
   - Duration: depends on complexity, typically 50-200ms

6. **Post-processing** (T=602ms):
   - If format = PNG: encode as PNG (lossless)
   - If format = JPEG: encode with quality slider (lossy)
   - Encoding via canvas.toBlob() (browser native, async)

7. **File generation** (T=700ms):
   - Create blob URL: `URL.createObjectURL(blob)`
   - Generate filename: `cosmos_${Date.now()}.png`
   - Create `<a>` element with download attribute

8. **User download** (T=701ms):
   - Trigger download: `a.click()`
   - File saved to downloads folder

9. **Restore UI** (T=702ms):
   - Show HUD elements again (if were hidden)
   - Close modal
   - Show toast: "Screenshot downloaded"

**File sizes (approximate):**
- 1080p PNG: 5-15 MB
- 1080p JPEG (quality 80): 1-3 MB
- 4K PNG: 20-50 MB

---

## 6. STATE MACHINE DIAGRAMS

### 6.1 Application State Machine

```
[Loading] ──(assets loaded)──→ [Ready]
   │                            │
   └──(WebGL not supported)────→ [Error]

[Ready] ──(user interacts)──→ [Exploring]
  ↓
[Exploring] ←─────────────────┐
  ↓                           │
  ├──(click object)──→ [ObjectSelected]
  │                   ↓
  │                   └──(click X or Escape)──→ [Exploring]
  │
  ├──(press /)──→ [Searching]
  │              ↓
  │              └──(select result or Escape)──→ [Exploring]
  │
  ├──(click settings)──→ [InSettings]
  │                     ↓
  │                     └──(close)──→ [Exploring]
  │
  ├──(click help)──→ [InHelp]
  │                 ↓
  │                 └──(close)──→ [Exploring]
  │
  └──(start tour)──→ [InTour]
                    ↓
                    └──(finish/skip)──→ [Exploring]

[Exploring] ──(context lost)──→ [ContextRecovering]
                                ↓
                                ├──(success)──→ [Exploring]
                                └──(failure)──→ [Error]

[*] ──(critical error)──→ [Error]
```

### 6.2 Camera State Machine

```
[FreeFly] ──(click object)──→ [Orbiting]
  ↑                            ↓
  │                            └──(press Space/Shift+Space)──→ [FreeFly]
  │
  ├──(press Shift+Space)──→ [FreeFly mode toggle]
  │
  └──(auto tour started)──→ [AutoPath]
                           ↓
                           └──(tour ends)──→ [FreeFly]

[Orbiting] ──(zoom far away)──→ [FreeFly]

[*] ──(search navigate)──→ [Teleporting]
                          ↓
                          └──(animation ends)──→ [FreeFly]

[*] ──(camera bookmarked location)──→ [Transitioning]
                                     ↓
                                     └──(animation ends)──→ [FreeFly]
```

### 6.3 Time Simulation State Machine

```
[Paused] ──(click Play)──→ [Playing]
  ↑                        ↓
  ├──(click Pause)←───────┘
  │
  ├──(click Reverse)──→ [Reversing]
  │                    ↓
  │                    └──(click Forward)──→ [Playing]
  │
  ├──(click step +)──→ [Stepping]
  │                  ↓
  │                  └──(step complete)──→ [Paused]
  │
  └──(date picker)──→ [JumpingToEpoch]
                     ↓
                     └──(jump complete)──→ [Paused]

[Playing] ──(click Reverse)──→ [Reversing]

[Reversing] ──(click Forward)──→ [Playing]
  ↑                             │
  └─────────────────────────────┘
```

### 6.4 Audio State Machine

```
[Uninitialized] ──(user first interaction)──→ [Initializing]
                                              ↓
                                              ├──(success)──→ [Playing]
                                              └──(failure)──→ [Error]

[Playing] ──(user mutes)──→ [Muted]
  ↓                        ↓
  ├──(page hidden)──→ [Suspended]
  │                  ↓
  │                  └──(page visible)──→ [Playing]
  │
  └──(settings disable)──→ [Disabled]

[Muted] ──(user unmutes)──→ [Playing]

[Disabled] ──(restart browser)──→ [Uninitialized]

[*] ──(critical audio error)──→ [Error]
```

---

## 7. ALGORITHM SPECIFICATIONS

### 7.1 LOD (Level of Detail) Selection Algorithm

**Purpose:** Determine which LOD level to render for each object based on distance, size, performance budget.

**Pseudocode:**

```
function selectLODForObject(object, camera, frameTimeRemaining) {
  // Input validation
  if (!object || !object.bounds) return LOD.NONE;
  
  // Calculate distance from camera to object
  distance = Vector3.distance(camera.position, object.position);
  
  // Calculate angular size on screen (projection)
  objectAngularSize = object.radius / distance;  // radians
  pixelSize = objectAngularSize * screenHeight / camera.fov;
  
  // Determine LOD based on pixel size and frame budget
  if (pixelSize < 2) {
    return LOD.NONE;  // Too small, don't render
  } else if (pixelSize < 5) {
    return LOD.POINT;  // Render as point sprite
  } else if (pixelSize < 20) {
    return LOD.LOW;  // Low-poly geometry, low-res texture
  } else if (pixelSize < 100) {
    return LOD.MEDIUM;  // Medium geometry, medium texture
  } else if (pixelSize < 500) {
    return LOD.HIGH;  // High-poly geometry, high-res texture
  } else {
    return LOD.ULTRA;  // Maximum detail
  }
  
  // Performance optimization: scale down if frame time exceeded
  if (frameTimeRemaining < 0) {
    return Math.max(LOD.POINT, selectedLOD - 1);  // Reduce LOD
  }
  
  return selectedLOD;
}
```

**Parameters:**
- **pixelSize:** On-screen size in pixels (diameter or bounding box width)
- **distance:** 3D distance from camera to object
- **screenHeight:** Viewport height in pixels
- **camera.fov:** Field of view in degrees

**LOD thresholds (tunable):**
- POINT: < 5 px
- LOW: 5–20 px
- MEDIUM: 20–100 px
- HIGH: 100–500 px
- ULTRA: > 500 px

**Performance note:** Re-evaluate every frame; use spatial partitioning (quadtree/octree) to avoid checking every object.

---

### 7.2 Scale Transition Detection Algorithm

**Purpose:** Detect when user crosses major scale boundaries; trigger data loads and rendering changes.

**Pseudocode:**

```
function updateScaleTransition(distance) {
  // Define scale boundaries (meters)
  SCALE_BOUNDARIES = [
    { scale: 'solar', maxDist: 1e13 },
    { scale: 'stellar', maxDist: 1e18 },
    { scale: 'galactic', maxDist: 1e22 },
    { scale: 'universal', maxDist: 1e26 }
  ];
  
  // Determine current scale
  currentScale = null;
  for (boundary of SCALE_BOUNDARIES) {
    if (distance < boundary.maxDist) {
      currentScale = boundary.scale;
      break;
    }
  }
  
  // Check if scale changed
  if (currentScale !== previousScale) {
    // Trigger data load for new scale
    loadDataTilesForScale(currentScale);
    
    // Update rendering: hide/show objects
    updateObjectVisibility(currentScale);
    
    // Update HUD
    updateScaleIndicator(currentScale);
    updateBreadcrumb(currentScale);
    
    // Optional: render warp effect
    if (settings.scaleTransitionEffect) {
      playWarpEffect();
    }
    
    previousScale = currentScale;
  }
}

function loadDataTilesForScale(scale) {
  // Priority: nearest first
  if (scale === 'solar') {
    loadTile('planets');
    loadTile('moons');
    loadTile('asteroids');
  } else if (scale === 'stellar') {
    loadTile('nearby_stars', { maxDistance: 1000 });  // 1000 ly
    loadTile('nebulae');
    loadTile('clusters');
  } else if (scale === 'galactic') {
    loadTile('galaxies', { maxDistance: 10 });  // 10 Mly
    loadTile('cosmic_filaments_lowres');
  } else if (scale === 'universal') {
    loadTile('galaxies', { maxDistance: 1e9 });  // All galaxies
    loadTile('cosmic_web');
    loadTile('cmb_background');
  }
  
  // Tiles load asynchronously; show spinner
  showLoadingIndicator();
}

function updateObjectVisibility(scale) {
  // Hide objects outside current scale range
  for (object of scene.children) {
    if (object.scaleRange && !object.scaleRange.includes(scale)) {
      object.visible = false;  // Fade out animation
    } else {
      object.visible = true;   // Fade in animation
    }
  }
}
```

---

### 7.3 Kepler Orbit Solver (Mean Anomaly → Position)

**Purpose:** Calculate planet/moon/satellite position given orbital elements and epoch.

**Inputs:**
- **a:** Semi-major axis (meters)
- **e:** Eccentricity (0–1)
- **i:** Inclination (radians)
- **ω:** Argument of perihelion (radians)
- **Ω:** Longitude of ascending node (radians)
- **M₀:** Mean anomaly at epoch t₀ (radians)
- **t₀:** Reference epoch (Julian Date)
- **t:** Current epoch (Julian Date)
- **μ:** Standard gravitational parameter (m³/s²) for orbit's primary

**Algorithm: Newton-Raphson Kepler Equation Solver**

```
function solveKeplerEquation(M, e) {
  // Solve E = M + e * sin(E) for eccentric anomaly E
  // Using Newton-Raphson iteration
  
  E = M;  // Initial guess
  
  for (iteration = 0; iteration < 10; iteration++) {
    f = E - e * Math.sin(E) - M;
    f_prime = 1 - e * Math.cos(E);
    E_new = E - f / f_prime;
    
    // Check convergence
    if (Math.abs(E_new - E) < 1e-9) {
      return E_new;
    }
    E = E_new;
  }
  
  return E;  // Return best estimate after iterations
}

function getOrbitalPosition(a, e, i, omega, Omega, M0, t0, t, mu) {
  // Calculate mean anomaly at time t
  n = Math.sqrt(mu / (a * a * a));  // Mean motion (rad/s)
  dt = (t - t0) * 86400;  // Time since epoch (seconds)
  M = M0 + n * dt;  // Mean anomaly
  M = M % (2 * Math.PI);  // Normalize to [0, 2π)
  
  // Solve for eccentric anomaly
  E = solveKeplerEquation(M, e);
  
  // Calculate true anomaly
  nu = 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(E / 2),
    Math.sqrt(1 - e) * Math.cos(E / 2)
  );
  
  // Calculate distance from primary (perihelion)
  r = a * (1 - e * e) / (1 + e * Math.cos(nu));
  
  // Position in orbital plane (x, y, z = 0)
  x_orb = r * Math.cos(nu);
  y_orb = r * Math.sin(nu);
  z_orb = 0;
  
  // Transform to ecliptic/equatorial coordinates via rotation matrices
  // R_z(Omega) * R_x(i) * R_z(omega) * [x_orb, y_orb, z_orb]
  
  // Rotation matrices
  const cosOmega = Math.cos(Omega), sinOmega = Math.sin(Omega);
  const cosI = Math.cos(i), sinI = Math.sin(i);
  const cosOmeg = Math.cos(omega), sinOmeg = Math.sin(omega);
  
  // First rotation: R_z(omega)
  x1 = x_orb * cosOmeg - y_orb * sinOmeg;
  y1 = x_orb * sinOmeg + y_orb * cosOmeg;
  z1 = 0;
  
  // Second rotation: R_x(i)
  x2 = x1;
  y2 = y1 * cosI - z1 * sinI;
  z2 = y1 * sinI + z1 * cosI;
  
  // Third rotation: R_z(Omega)
  x = x2 * cosOmega - y2 * sinOmega;
  y = x2 * sinOmega + y2 * cosOmega;
  z = z2;
  
  return Vector3(x, y, z);
}
```

**Accuracy:**
- Kepler solver convergence: 10⁻⁹ radians (< 1cm error over AU distances)
- Sufficient for <1 million year timescales
- For longer timescales, relativistic perturbations become significant (not modeled)

---

### 7.4 B-V Color Index to RGB Conversion

**Purpose:** Convert Hipparcos/Gaia B-V color index to displayable RGB color.

**Algorithm:**

```
function BVToRGB(bv) {
  // B-V color index range: -0.4 (hot blue) to +2.0 (cool red)
  // Clamp to valid range
  bv = Math.max(-0.4, Math.min(2.0, bv));
  
  // Polynomial approximation (Ballesteros, 2012)
  // Approximate effective temperature from B-V
  if (bv < 0.01) {
    T_eff = 10000 - 7590 * bv;
  } else {
    T_eff = 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62));
  }
  
  // Clamp temperature to physical range
  T_eff = Math.max(1000, Math.min(40000, T_eff));
  
  // Planck blackbody radiator: convert temperature to RGB
  // Method: fit polynomial to CIE xy color space, then to sRGB
  
  // Lookup table approach (faster for real-time)
  // Pre-computed table maps B-V values to RGB
  colorTable = [
    // B-V -> RGB
    { bv: -0.4, rgb: [0.62, 0.79, 1.00] },  // Hot blue
    { bv: -0.2, rgb: [0.70, 0.85, 1.00] },  // Blue
    { bv:  0.0, rgb: [0.85, 0.93, 1.00] },  // White
    { bv:  0.2, rgb: [1.00, 0.98, 0.92] },  // Yellow-white
    { bv:  0.5, rgb: [1.00, 0.88, 0.70] },  // Yellow
    { bv:  0.8, rgb: [1.00, 0.70, 0.50] },  // Orange
    { bv:  1.2, rgb: [1.00, 0.50, 0.30] },  // Red
    { bv:  2.0, rgb: [1.00, 0.30, 0.20] }   // Deep red
  ];
  
  // Linear interpolation in table
  for (i = 0; i < colorTable.length - 1; i++) {
    if (bv >= colorTable[i].bv && bv <= colorTable[i+1].bv) {
      const t = (bv - colorTable[i].bv) / (colorTable[i+1].bv - colorTable[i].bv);
      rgb = Vector3.lerp(colorTable[i].rgb, colorTable[i+1].rgb, t);
      return rgb;
    }
  }
  
  // Fallback (shouldn't reach here if clamp works)
  return colorTable[colorTable.length - 1].rgb;
}
```

**Alternative: Planck Law (more accurate but slower)**

```
function blackbodyToRGB(temperature) {
  // Compute CIE xy from temperature (Kramer's approximation)
  T = temperature / 1000;
  
  if (T >= 1667 && T <= 25000) {
    if (T <= 4000) {
      x = (-0.2661239 * 1e9 / (T*T*T)) + (-0.2343580 * 1e6 / (T*T)) + 
          (0.8776956 * 1e3 / T) + 0.179910;
    } else {
      x = (-3.0258469 * 1e9 / (T*T*T)) + (2.1070379 * 1e6 / (T*T)) + 
          (0.2226347 * 1e3 / T) + 0.240390;
    }
    
    y = -3 * x * x + 2.870 * x - 0.275;
  } else {
    // Out of range: use default
    return [0.5, 0.5, 0.5];
  }
  
  // Convert CIE xy to RGB (requires sRGB color space matrix)
  // [X, Y, Z] from [x, y, 1]
  // Then multiply by sRGB conversion matrix
  // (Implementation details omitted for brevity)
  
  return rgbFromXY(x, y);
}
```

---

### 7.5 Search Ranking Algorithm

**Purpose:** Rank search results by relevance.

**Algorithm:**

```
function rankSearchResults(query, candidates) {
  results = [];
  
  for (candidate of candidates) {
    score = 0;
    
    // Exact name match (highest priority)
    if (candidate.name.toLowerCase() === query.toLowerCase()) {
      score += 1000;
    }
    
    // Exact abbreviation match
    if (candidate.abbreviations && 
        candidate.abbreviations.includes(query.toUpperCase())) {
      score += 900;
    }
    
    // Prefix match
    if (candidate.name.toLowerCase().startsWith(query.toLowerCase())) {
      score += 500 - query.length;  // Longer match = lower score
    }
    
    // Fuzzy match (Levenshtein distance)
    distance = levenshteinDistance(query, candidate.name);
    if (distance <= 3) {
      score += 300 - distance * 50;
    }
    
    // Catalog ID match
    for (catalogID of candidate.catalogIDs) {
      if (catalogID.includes(query.toUpperCase())) {
        score += 400;
        break;  // Count once per candidate
      }
    }
    
    // Coordinate proximity match (if query is coordinates)
    if (isCoordinateQuery(query)) {
      queryCoords = parseCoordinates(query);
      distance = computeCoordinateDistance(queryCoords, candidate.coordinates);
      if (distance < 5) {  // Within 5 degrees
        score += 200 - distance * 20;
      }
    }
    
    // Popularity boost (by number of citations, views, etc.)
    popularityFactor = Math.log(candidate.popularity + 1);  // Log to reduce impact
    score += popularityFactor * 50;
    
    results.push({ candidate, score });
  }
  
  // Sort by score (descending)
  results.sort((a, b) => b.score - a.score);
  
  // Return top 10
  return results.slice(0, 10);
}

function levenshteinDistance(a, b) {
  // Edit distance algorithm
  // (Standard implementation)
  const matrix = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,  // Substitution
          matrix[i][j - 1] + 1,      // Insertion
          matrix[i - 1][j] + 1       // Deletion
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}
```

**Weights (tunable):**
- Exact match: 1000
- Prefix: 500
- Fuzzy: 300
- Catalog ID: 400
- Coordinate proximity: 200
- Popularity: +50 per log unit

---

### 7.6 Procedural Audio Generation (Ambient Soundscape)

**Purpose:** Generate immersive cosmic background ambience that adapts to scale.

**Algorithm:**

```
function generateCosmicAmbience(currentScale, nearbyObjects) {
  // Base drone: low-frequency oscillator (fundamental)
  
  const fundamentalFreq = scaleToFrequency(currentScale);
  // Solar: 40 Hz | Stellar: 20 Hz | Galactic: 10 Hz | Universal: 5 Hz
  
  // Harmonic layers: integer multiples of fundamental
  const harmonics = [];
  for (let i = 1; i <= 5; i++) {
    harmonics.push({
      frequency: fundamentalFreq * i,
      amplitude: 0.5 / i,  // Decline in amplitude
      waveform: i % 2 === 0 ? 'sine' : 'triangle'
    });
  }
  
  // Modulation: slow LFO (Low Frequency Oscillator)
  const lfoRate = 0.05;  // Hz (very slow, ~20s period)
  const lfoAmount = 0.2;  // 20% frequency modulation
  
  // Spatial accents: based on nearby objects
  const spatialEvents = [];
  for (let obj of nearbyObjects) {
    if (obj.brightness > threshold) {
      spatialEvents.push({
        frequency: magnitudeToFrequency(obj.magnitude),
        duration: 500,  // ms
        position: worldToAudioPanning(obj.worldPosition),
        startTime: audioContext.currentTime + Math.random() * 2
      });
    }
  }
  
  // Synthesize audio
  const audioBuffer = audioContext.createBuffer(2, sampleRate * 10, sampleRate);
  const outputL = audioBuffer.getChannelData(0);
  const outputR = audioBuffer.getChannelData(1);
  
  let t = 0;
  for (let sample = 0; sample < audioBuffer.length; sample++) {
    let output = 0;
    
    // Add harmonics
    for (let harmonic of harmonics) {
      const modulatedFreq = harmonic.frequency * (1 + lfoAmount * Math.sin(2 * Math.PI * lfoRate * t));
      output += harmonic.amplitude * Math.sin(2 * Math.PI * modulatedFreq * t);
    }
    
    // Add spatial events
    for (let event of spatialEvents) {
      if (t >= event.startTime && t < event.startTime + event.duration / sampleRate) {
        const envTime = t - event.startTime;
        const envelope = Math.exp(-3 * envTime / (event.duration / sampleRate));  // Exponential decay
        output += envelope * 0.3 * Math.sin(2 * Math.PI * event.frequency * t);
      }
    }
    
    // Apply envelope (fade in/out)
    const fadeTime = 2;  // seconds
    let envelope = 1;
    if (t < fadeTime) {
      envelope = t / fadeTime;  // Fade in
    } else if (t > audioBuffer.duration - fadeTime) {
      envelope = (audioBuffer.duration - t) / fadeTime;  // Fade out
    }
    
    // Low-pass filter (smooth high frequencies)
    // Implement simple one-pole filter
    const cutoff = 0.1;  // Normalized frequency
    output = prevOutput + cutoff * (output - prevOutput);
    prevOutput = output;
    
    // Normalize and apply volume
    output *= 0.3 * masterVolume;  // Prevent clipping
    
    // Stereo panning (optional spatial effect)
    const pan = Math.sin(2 * Math.PI * lfoRate * t * 0.5);  // Slow pan
    outputL[sample] = output * (1 - pan) / 2;
    outputR[sample] = output * (1 + pan) / 2;
    
    t += 1 / sampleRate;
  }
  
  return audioBuffer;
}

function scaleToFrequency(scale) {
  // Map scale to fundamental frequency
  const mapping = {
    'solar': 40,      // Hz
    'stellar': 20,    // Hz
    'galactic': 10,   // Hz
    'universal': 5    // Hz
  };
  return mapping[scale] || 10;
}

function magnitudeToFrequency(magnitude) {
  // Brighter (lower magnitude) → higher pitch
  // magnitude range: -2 to +10
  // frequency range: 100 Hz to 1000 Hz (audible range)
  return 100 * Math.pow(10, (6 - magnitude) / 3);  // Log scale
}
```

**Audio pipeline:**
1. Generate buffer every 10 seconds
2. Loop seamlessly (crossfade between buffers)
3. Adjust based on user settings (master volume, ambient volume, sonification toggle)
4. Apply Web Audio API nodes: GainNode, PannerNode, FilterNode

---

## 8. ANIMATION SPECIFICATIONS

**Format for each animation: Trigger → Duration → Easing → Start State → End State → Interruptible**

### 8.1 Camera Transition Animations

#### 8.1.1 Smooth Pan to Object

- **Trigger:** User selects object (left-click)
- **Duration:** 1.5s (adjustable in settings)
- **Easing:** ease-in-out cubic (ease-out cubic if distance large)
- **Start:** Current camera position + rotation
- **End:** Positioned to orbit selected object at comfortable distance
- **Properties animated:** camera.position (Vector3 lerp), camera.quaternion (SLERP)
- **Interruptible:** Yes (cancel on new selection or ESC)
- **Note:** Smooth spherical interpolation for rotation preserves orientation continuity

#### 8.1.2 Zoom Transition (Scroll Wheel)

- **Trigger:** User scrolls mouse wheel
- **Duration:** 1.0s–2.0s (varies by zoom distance)
- **Easing:** ease-out cubic
- **Start:** Current camera distance
- **End:** Target distance (computed from scroll delta)
- **Properties animated:** camera.position.length (distance from origin)
- **Interruptible:** Yes (new scroll resets animation)
- **Note:** Logarithmic zoom factor for consistent feel across scales

#### 8.1.3 Bookmark Teleport

- **Trigger:** User clicks bookmark / selects from list
- **Duration:** 2.0s
- **Easing:** ease-in-out cubic
- **Start:** Current position + rotation
- **End:** Saved view position + rotation
- **Optional effect:** Brief fade-out/fade-in (300ms) at midpoint for immersion
- **Interruptible:** Yes (new selection cancels)

#### 8.1.4 Auto-Path (Tour)

- **Trigger:** Tour waypoint reached
- **Duration:** 2.0s–15.0s (per waypoint)
- **Easing:** ease-in-out cubic
- **Start:** Current camera position
- **End:** Next waypoint position on path
- **Path:** Cubic hermite spline through waypoints
- **Interruptible:** Yes (pause/skip button)

### 8.2 UI Element Animations

#### 8.2.1 Info Panel Slide-In (Object Selected)

- **Trigger:** Object selected
- **Duration:** 300ms
- **Easing:** ease-out cubic
- **Start:** Position x = window.innerWidth (right edge), opacity 0
- **End:** Position x = window.innerWidth - 400px, opacity 1
- **Transform:** translateX only (desktop), translateY (mobile bottom sheet)
- **Interruptible:** Yes (close button)

#### 8.2.2 Info Panel Slide-Out (Deselected)

- **Trigger:** User clicks X, Escape, or clicks viewport
- **Duration:** 300ms
- **Easing:** ease-in cubic
- **Start:** Position x = window.innerWidth - 400px, opacity 1
- **End:** Position x = window.innerWidth, opacity 0
- **Interruptible:** No (completes fully)

#### 8.2.3 Search Bar Expand / Collapse

- **Trigger (expand):** User presses `/` or clicks icon
- **Duration:** 300ms
- **Easing:** ease-out cubic
- **Start:** Size 40x40px (circular icon), opacity 0.5
- **End:** Size 500px wide, opacity 1
- **Interruptible:** Yes (press Escape to collapse)

- **Trigger (collapse):** User presses Escape or selects result
- **Duration:** 300ms
- **Easing:** ease-in cubic
- **Start:** Size 500px, opacity 1
- **End:** Size 40x40px, opacity 0.5

#### 8.2.4 Settings Panel Fade-In / Fade-Out

- **Trigger (open):** User clicks settings icon
- **Duration:** 300ms
- **Easing:** ease-out cubic
- **Start:** Opacity 0, scale 0.95
- **End:** Opacity 1, scale 1.0
- **Interruptible:** Yes

- **Trigger (close):** User clicks X or Escape
- **Duration:** 300ms
- **Easing:** ease-in cubic
- **Start:** Opacity 1, scale 1.0
- **End:** Opacity 0, scale 0.95

#### 8.2.5 Toast Notification Slide-In / Out

- **Trigger:** Error / success message
- **Duration (slide-in):** 300ms ease-out
- **Duration (hold):** 3.0s (for errors) / 2.0s (for success)
- **Duration (slide-out):** 300ms ease-in
- **Start:** Position translateY(20px), opacity 0
- **Middle:** Opacity 1
- **End:** Position translateY(-20px), opacity 0
- **Position:** Bottom-left or top-right (configurable)

#### 8.2.6 Modal Fade-In

- **Trigger:** Share modal, screenshot modal, settings open, etc.
- **Duration:** 300ms
- **Easing:** ease-out cubic
- **Start:** Backdrop opacity 0, modal scale 0.9, opacity 0
- **End:** Backdrop opacity 0.5, modal scale 1.0, opacity 1
- **Interruptible:** Yes (click X)

#### 8.2.7 Tooltip Fade-In

- **Trigger:** Hover over button for 200ms
- **Duration:** 150ms fade-in
- **Easing:** ease-out
- **Start:** Opacity 0, translateY(4px)
- **End:** Opacity 1, translateY(0px)
- **Interruptible:** Yes (mouse leaves)

### 8.3 3D Viewport Animations

#### 8.3.1 Object Highlight on Hover

- **Trigger:** Mouse cursor hovers over object
- **Duration:** 150ms (fade-in)
- **Easing:** ease-out cubic
- **Start:** Glow intensity 1.0 (baseline)
- **End:** Glow intensity 2.0
- **Properties:** Material emissive intensity, post-process bloom threshold
- **Interruptible:** Yes (mouse leaves → fade out 300ms)

#### 8.3.2 Scale Indicator Morph

- **Trigger:** User zooms, scale changes
- **Duration:** 200ms
- **Easing:** ease-out cubic
- **Start:** Current ruler visual + label text
- **End:** New ruler visual + label text
- **Animations:**
  - Ruler line length morphs (height: current → target)
  - Labels fade out (100ms), new labels fade in (100ms)
  - Scale name fades out/in
- **Interruptible:** Yes (new zoom resets)

#### 8.3.3 Object Position Interpolation (Orbital)

- **Trigger:** Time simulation running
- **Duration:** 1 frame (per frame update)
- **Type:** Smooth position update (no animation per-se, but smooth interpolation)
- **Properties:** object.position (updated from orbital ephemeris)
- **Note:** Smooth because positions update every frame using physics; no tween needed

#### 8.3.4 Warp/Transition Effect (Scale Jump)

- **Trigger:** Large scale transition (if enabled in settings)
- **Duration:** 300ms
- **Easing:** ease-in-out cubic
- **Effects:**
  - Chromatic aberration: 0% → 5% → 0%
  - Motion blur: 0 → 1.0 → 0
  - Camera shake: 0.5% FOV jitter
  - Saturation: 1.0 → 0.7 → 1.0
- **Audio:** Whoosh sound (100ms fade-in, 100ms fade-out)
- **Interruptible:** No (plays fully)

#### 8.3.5 Star Twinkle (Ambient)

- **Trigger:** Rendering each frame
- **Duration:** 2.0s–5.0s (random per star)
- **Easing:** smooth sinusoidal (sine wave)
- **Properties:** Star brightness multiplier
- **Formula:** `brightness = 1.0 + 0.3 * Math.sin(time * 2π / period)`
- **Period:** Random 2–5 seconds per star
- **Note:** Subtle effect, adds life to static starfield

### 8.4 Loading & Feedback Animations

#### 8.4.1 Loading Spinner

- **Trigger:** Data loading (> 300ms)
- **Duration:** Continuous until load completes
- **Easing:** Linear
- **Properties:** Rotation angle
- **Formula:** `rotation += 360deg/1sec` (1 full rotation per second)
- **Opacity:** 1.0 (or 0.7 if faded)

#### 8.4.2 Progress Bar Fill

- **Trigger:** Asset load begins
- **Duration:** Variable (until 100%)
- **Easing:** ease-out cubic (slower as it approaches 100%)
- **Properties:** Width percentage
- **Formula:** `width = loadedBytes / totalBytes * 100%`
- **Opacity fade-out:** Once 100%, fade out 300ms

#### 8.4.3 Button Press Feedback

- **Trigger:** User clicks button
- **Duration:** 100ms
- **Easing:** ease-out cubic
- **Properties:** Scale, brightness
- **Start:** Scale 1.0, brightness 1.0
- **Mid:** Scale 0.98
- **End:** Scale 1.0, brightness 1.0
- **Interruptible:** No (completes fully)

#### 8.4.4 GlowPulse (Bookmark Save)

- **Trigger:** User bookmarks a view
- **Duration:** 600ms
- **Easing:** ease-in-out cubic
- **Properties:** Glow radius, opacity
- **Start:** Radius 0px, opacity 1.0
- **End:** Radius 50px, opacity 0
- **Color:** Cyan (#06b6d4)
- **Note:** Ripple effect from center outward

---

## 9. ACCESSIBILITY SPECIFICATION

### 9.1 Keyboard Navigation

**All interactive elements must be keyboard-accessible via Tab key.**

#### 9.1.1 Tab Order

Global tab order:
1. Search bar
2. Toolbar buttons (left to right)
3. Time controls
4. Info panel (if visible)
5. Settings/modals (if visible)

**Focus indicator:** 3px solid cyan (#06b6d4) outline, minimum 3px offset from element

#### 9.1.2 Keyboard Shortcuts

(Specified in section 3.2.2 and SCR-010)

- Global shortcuts always available: F (fullscreen), B (bookmark), ?, Escape
- Context shortcuts (viewports): W/A/S/D, Space, T, /
- Modal shortcuts (when modal open): Arrow keys (navigate), Enter (select), Escape (close)

#### 9.1.3 Escape Hatch

Pressing Escape always closes current modal/panel and returns focus to viewport. Chainable (Escape multiple times closes nested modals).

### 9.2 Screen Reader Support

#### 9.2.1 ARIA Attributes

**Every interactive element must have:**
- `role` attribute (button, checkbox, slider, etc.) if not semantic HTML
- `aria-label` describing purpose (if visual label insufficient)
- `aria-describedby` referencing extended description (if needed)

**Example:**
```html
<button 
  role="button"
  aria-label="Bookmark current view"
  aria-describedby="bookmark-help"
  onClick={...}
>
  📍
</button>
<span id="bookmark-help" hidden>
  Adds current view to your saved bookmarks for quick access later.
</span>
```

#### 9.2.2 Dynamic Content Updates

**Use `aria-live` regions for status updates:**

```html
<div aria-live="polite" aria-atomic="true" id="status">
  {/* Status messages appear here */}
</div>
```

**Announce:**
- Object selection: "Sirius selected. Info panel loaded."
- Search results: "10 results found for 'sirius'"
- Loading progress: "Loading 45 percent"
- Errors: "Data unavailable. Showing cached information."

#### 9.2.3 Semantic HTML

- Use `<button>` for buttons, not `<div onclick>`
- Use `<input type="range">` for sliders, not custom
- Use `<label>` for form field labels
- Use heading hierarchy (`<h1>`, `<h2>`, etc.) for structure
- Use `<nav>` for navigation regions

### 9.3 Visual Accessibility

#### 9.3.1 Color Contrast

**WCAG AA compliance (minimum 4.5:1 ratio for normal text):**
- Text on backgrounds: black text (#000000) on white (#FFFFFF) = 21:1 (excellent)
- Interactive elements: cyan (#06b6d4) on dark (#1a1f2e) = 8.2:1 (passes AA+)
- Disabled text: gray (#94a3b8) on dark (#1a1f2e) = 3.5:1 (fails AA, acceptable for disabled state per WCAG)

#### 9.3.2 Visual Indicators Beyond Color

- **Buttons:** Use text labels + icons (not icon-only)
- **Links:** Use underline + color (not color-only)
- **Disabled state:** Grayed out + reduced opacity + disabled cursor
- **Focus:** Outline ring + background highlight
- **Status icons:** Combine symbols (checkmark, X, !) with text ("saved", "error")

#### 9.3.3 Font & Size

- **Minimum font size:** 12px (readable for most users)
- **Responsive sizing:** Increase on mobile (touch targets 48x48px minimum)
- **Line height:** 1.5+ for readability
- **Font families:** Sans-serif preferred (Inter, Roboto, system fonts)

#### 9.3.4 Motion & Animation

- **Reduced motion:** Respect `prefers-reduced-motion` CSS media query
  ```css
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```
- **Flashing:** Avoid flashing/strobing (> 3 flashes/sec)
- **Auto-play:** Disable auto-play video/audio (user must initiate)

### 9.4 Mobile Accessibility

- **Touch targets:** 48x48px minimum
- **Gesture descriptions:** Provide text descriptions of touch gestures
- **Zoom level:** Allow pinch-zoom (don't disable `user-scalable`)
- **Orientation:** Support both portrait and landscape

### 9.5 Audio Accessibility

- **Captions:** Provide text captions for tour narration
- **Sonification alternatives:** Provide visual indicators for sonified data
- **Audio cues:** Supplement with visual indicators (e.g., toast notification + sound)

---

## 10. PERFORMANCE REQUIREMENTS PER SCREEN

### 10.1 Loading Screen (SCR-001)

| Metric | Target | Notes |
|--------|--------|-------|
| First input responsiveness | < 4s | Before Enter button active |
| FPS | N/A | Rendering paused during load |
| Memory | < 200 MB | Critical assets only |
| Network data loaded | < 100 MB | Skybox + nearby stars |
| JS bundle load | < 2s | Main + React + Three.js |

### 10.2 Main Exploration View (SCR-002)

| Metric | Target | Notes |
|--------|--------|-------|
| FPS | 60 (desktop), 30 (mobile) | Steady state |
| Draw calls | < 1000 | Per frame |
| GPU memory | < 2 GB | Textures + geometries |
| CPU memory | < 512 MB | JavaScript heap |
| Latency (click to visual feedback) | < 50ms | Object selection |
| Zoom transition time | 2–3s | Large scale jump |

### 10.3 Info Panel (SCR-003)

| Metric | Target | Notes |
|--------|--------|-------|
| Panel open time | < 300ms | Animation |
| Data fetch (cold) | < 1s | Object details from API |
| Data fetch (warm) | < 100ms | From localStorage cache |
| Panel scroll FPS | 60 | Smooth scrolling |

### 10.4 Search (SCR-004)

| Metric | Target | Notes |
|--------|--------|-------|
| Search response | < 50ms | In-memory index |
| Autocomplete appearance | < 100ms | After 300ms debounce |
| Result rendering | < 200ms | 10 items |

### 10.5 Settings (SCR-005)

| Metric | Target | Notes |
|--------|--------|-------|
| Panel open time | < 300ms | Animation |
| Setting change latency | < 100ms | Visual effect applies |
| LocalStorage write | < 10ms | Non-blocking |

### 10.6 Time Controls (SCR-006)

| Metric | Target | Notes |
|--------|--------|-------|
| Speed slider drag | 60 FPS | Smooth interaction |
| Epoch update frequency | 60 Hz | Per-frame (display) |
| Physics update | 60 Hz | Orbital recalculation |

### 10.7 Screenshot (SCR-012)

| Metric | Target | Notes |
|--------|--------|-------|
| Capture render time | < 500ms | Offscreen canvas |
| Encode to PNG | < 1s | lossless compression |
| File download | < 2s | Trigger + browser download |

---

## 11. EDGE CASES & BOUNDARY CONDITIONS

### 11.1 Camera / Navigation Edge Cases

#### 11.1.1 Zoom to Object's Center (Distance = 0)

**Trigger:** User zooms infinitely into selected object.

**Behavior:**
- Clamp camera distance to `object.radius * 2` (never allow distance < 2x radius)
- If user pans into object, clip camera inside geometry (don't render back faces)
- Show warning toast: "Zoomed inside object"

**Prevention:** Enforce minimum distance in camera code.

#### 11.1.2 Zoom Beyond Universe Edge (Distance > 1e26 m)

**Trigger:** User scrolls zoom out excessively.

**Behavior:**
- Clamp distance: `dist = min(dist, 1e26)`
- Show warning: "You've reached the edge of the observable universe"
- At this distance, render cosmic web only (all stars/galaxies too small to see)

#### 11.1.3 Rapid Scale Changes

**Trigger:** User zooms in/out very quickly (> 5 notches/second).

**Behavior:**
- Cancel in-flight data loads for stale scales
- Load highest-priority data for current scale
- If performance drops (FPS < 30), reduce LOD automatically
- Audio effects may stutter (acceptable, prioritize visuals)

#### 11.1.4 Object Moves Faster Than Camera Can Follow

**Trigger:** Fast-moving comet or asteroid during time simulation.

**Behavior:**
- If object in "orbit" mode, camera path updates each frame (no lag)
- If object moves off-screen in free view, show directional indicator (arrow pointing to object)
- Don't auto-follow (let user control)

### 11.2 Time Simulation Edge Cases

#### 11.2.1 Time Reaches Big Bang (t = 0)

**Trigger:** User plays time backward to 13.8 Ga ago.

**Behavior:**
- Clamp epoch to > 0 (before Big Bang not physically meaningful)
- At epoch < 1 Ga:
  - Render CMB radiation field as background sphere
  - Show primordial structure (very early galaxies)
  - Message: "Approaching the Big Bang. The universe was extremely hot and dense."
- Pause automatically at t = 1 ms (earliest sensible epoch)
- Audio: deep, mysterious tone (very low frequency)

#### 11.2.2 Time Reaches Far Future (t > 100 Ga)

**Trigger:** User plays time forward many billions of years.

**Behavior:**
- Clamp epoch to < 100 Ga (speculative beyond this)
- Show warning: "This is speculative future. Actual evolution may differ greatly."
- Galaxies in "merger" states; universe expansion accelerated
- Audio: thin, sparse ambient (fewer sources)

#### 11.2.3 Large Time Speed (1e8 seconds/second)

**Trigger:** User sets time speed to maximum (1 Gyr/second).

**Behavior:**
- Orbital positions update 1e8x faster
- Frame skipping: calculate positions for multiple time steps per frame (avoid lag)
- Warning: "At this speed, you're skipping millions of years per frame"
- Audio: pitch changes rapidly (sonification effect)

#### 11.2.4 Negative Time Speed (Reverse)

**Trigger:** User toggles reverse direction.

**Behavior:**
- Epoch decreases each frame: `epoch -= deltaTime * speedFactor`
- All positions recalculated (orbitals are reversible)
- Time display shows negative offset (e.g., "-5 years/second")
- Audio: pitch/effect inverted (optional eerie effect)

### 11.3 Data & Catalog Edge Cases

#### 11.3.1 Object with Missing Data

**Trigger:** User selects object not fully catalogued (e.g., recently-discovered exoplanet with few published properties).

**Behavior:**
- Display available data only
- Show placeholders for missing fields: "Data not available" or "—"
- Provide link to source catalog (e.g., "View on exoplanet.eu")
- Don't show errors; graceful degradation

#### 11.3.2 Corrupted Catalog Tile

**Trigger:** Fetched data tile is malformed or truncated (network error mid-transmission).

**Behavior:**
- Attempt to parse; if parse fails, reject tile silently
- Show loading spinner (still trying to load)
- Retry automatically (exponential backoff)
- If 3 retries fail, show warning toast: "Some astronomical data unavailable"
- Continue rendering cached data (if available)
- Log error to analytics

#### 11.3.3 Search for Object Not in Catalog

**Trigger:** User searches for obscure or fictional object (e.g., "Planet X", "Krypton").

**Behavior:**
- Return 0 results
- Show message: "No objects found matching 'Krypton'"
- Suggest: "Try searching by catalog ID (e.g., NGC 224, HD 12345)"
- Option: "I'm feeling lucky" (random object)

#### 11.3.4 1000+ Bookmarks

**Trigger:** User has accumulated many bookmarks over time.

**Behavior:**
- Pagination: show 20 per page, "Next" / "Previous" buttons
- Search/filter: limit by name, date range, type
- Performance: use virtual scrolling (only render visible items)
- Export: allow JSON export for backup

### 11.4 UI & Interaction Edge Cases

#### 11.4.1 Overlapping Objects on Screen

**Trigger:** Two objects (e.g., binary star) very close in screen space.

**Behavior:**
- Raycasting returns both intersections
- Select nearest one by default
- Hover shows label for nearest object
- Context menu: "Show both objects"
- User can cycle through (pressing 'N' for "next" object under cursor)

#### 11.4.2 Rapid Clicking

**Trigger:** User clicks repeatedly in same location.

**Behavior:**
- Debounce: ignore clicks within 100ms of last click
- Prevents accidental multi-selection
- Prevents rapid state thrashing

#### 11.4.3 Window Resize During Animation

**Trigger:** User resizes browser window while camera transitioning.

**Behavior:**
- Update camera aspect ratio immediately
- Continue animation (interpolate over remaining duration)
- No visual glitches (camera frustum updated in real-time)

#### 11.4.4 Mobile Device Rotation Mid-Interaction

**Trigger:** User rotates phone from portrait to landscape while info panel open.

**Behavior:**
- Trigger resize event → update layout
- Info panel transitions: side panel (landscape) ↔ bottom sheet (portrait)
- Smooth animation (250ms transition)
- Maintain scroll position in panel

### 11.5 Browser & Environment Edge Cases

#### 11.5.1 Insufficient GPU Memory

**Trigger:** User's graphics card < 1 GB VRAM; trying to load 8K textures.

**Behavior:**
- Detect WebGL memory pressure: monitor texture uploads
- If OOM error caught: automatically reduce texture quality (4K → 2K → 1K)
- Show warning toast: "Graphics quality reduced due to GPU memory limit"
- User can override in settings (at risk of crash)

#### 11.5.2 Slow Internet (0.5 Mbps)

**Trigger:** User on slow connection (rural area, satellite internet).

**Behavior:**
- Data loads very slowly; show progress bar + estimated time remaining
- After 30s, allow skipping to continue with partial data
- Quality setting: auto-reduce to "Low" if bandwidth < 2 Mbps
- Toast: "Slow connection detected. Quality reduced."

#### 11.5.3 Tab Backgrounded for Extended Time (Hours/Days)

**Trigger:** User minimizes Cosmos Explorer, uses other apps.

**Behavior:**
- Tab visibility paused rendering + audio
- Resume on refocus: check if cached data stale
- If data > 24 hours old: show "Refresh data?" option (non-blocking)
- Clear any temporary state that's no longer valid (e.g., pending downloads)

#### 11.5.4 User Blocks Audio Permission

**Trigger:** Browser asks for audio permission; user denies.

**Behavior:**
- Web Audio Context fails to initialize
- Catch error, set `audio.enabled = false`
- Show muted icon (permanently, no error)
- Continue without audio (feature gracefully disabled)
- User can't re-enable without browser permission change

#### 11.5.5 Multiple Tabs Open

**Trigger:** User has 2+ tabs with Cosmos Explorer running.

**Behavior:**
- Each tab is independent (separate Three.js renderer, state)
- No cross-tab communication (avoid complexity)
- If user opens 10+ tabs, browser may slow down (acceptable, user's responsibility)
- Optional: Add warning toast if > 3 tabs detect (one-time)

### 11.6 Data Flow Edge Cases

#### 11.6.1 User Selects Object That's Loading

**Trigger:** User clicks star while its catalog data still fetching.

**Behavior:**
- Select object immediately (show with placeholder data)
- Fetch completes: update info panel (no jump/flicker)
- If fetch fails: show "Data unavailable" gracefully

#### 11.6.2 Search Query Changes Before Results Arrive

**Trigger:** User types "Sirius", 200ms in types "Andromeda", but Sirius results still pending.

**Behavior:**
- Cancel previous fetch request (abort signal)
- Start new fetch for "Andromeda"
- Display results for Andromeda (ignore stale Sirius results)
- No race condition

#### 11.6.3 Object Bookmark Contains Dead Link

**Trigger:** User saved bookmark for exoplanet that's since been removed from database.

**Behavior:**
- Load bookmark: try to fetch object data
- Get 404: catch error
- Show toast: "Bookmarked object no longer in catalog"
- Show last-cached preview (if available)
- Allow user to delete bookmark

---

## 12. GLOSSARY

**60+ term definitions used in this specification:**

| Term | Definition |
|------|-----------|
| **Absolute Magnitude** | Intrinsic brightness of a star as it would appear from 10 parsecs away (standard distance) |
| **ACES** | Filmic tone mapping algorithm; converts linear RGB to display-ready output |
| **Aphelion** | Point in an orbit farthest from the Sun (or primary body) |
| **Apparent Magnitude** | Brightness of a star as seen from Earth; lower = brighter |
| **Argument of Perihelion (ω)** | Orbital element; angle from ascending node to perihelion |
| **ARIA** | Accessible Rich Internet Applications; HTML attributes for screen reader support |
| **Asterism** | Pattern of stars visible from Earth (e.g., Big Dipper); not an official constellation |
| **Astrolabe** | Historical instrument for measuring star positions |
| **AU** | Astronomical Unit; Earth-Sun distance ≈ 150 million km |
| **Bayer Designation** | Star naming system using Greek letters + constellation (e.g., α Centauri) |
| **Bloom** | Graphics effect; glow around bright objects |
| **B-V Color Index** | Difference in magnitude measured through blue and visual filters; indicates star temperature |
| **Catalog ID** | Unique identifier in astronomical catalog (e.g., HIP 48915, NGC 224) |
| **Celestial Sphere** | Imaginary sphere of infinite radius surrounding Earth; used for star positions |
| **CMB** | Cosmic Microwave Background; relic radiation from Big Bang |
| **Coordinate System** | Reference frame for measuring positions (equatorial, galactic, ecliptic) |
| **Corona** | Outer atmosphere of the Sun; visible during total solar eclipse |
| **Cosmic Web** | Large-scale structure of universe; galaxies connected by filaments |
| **Crepuscular Rays** | "God rays"; light shafts from bright object |
| **Culling** | Optimization; skip rendering objects outside viewport or too small to see |
| **Declination (Dec)** | Coordinate; angle north/south of celestial equator (-90° to +90°) |
| **Deuterium** | Hydrogen isotope with one neutron; rare, used in stellar nucleosynthesis |
| **Eccentricity (e)** | Orbital element; 0 = circle, 1 = parabola, <1 = ellipse |
| **Ecliptic** | Plane of Earth's orbit around Sun |
| **Ecliptic Plane** | 2D plane containing Earth's orbital path |
| **Ephemeris** | Table of calculated positions of celestial objects over time |
| **Exoplanet** | Planet orbiting a star outside our Solar System |
| **FOV** | Field of View; angular width of camera's view (degrees) |
| **Flamsteed Number** | Historical star numbering system; number + constellation (e.g., 6 Centauri) |
| **Gaia DR3** | ESA's 3rd Data Release of Gaia mission; ~1.8 billion stars with precise positions |
| **Galactic Center** | Center of the Milky Way; location of Sagittarius A* black hole |
| **Galactic Plane** | Plane of the Milky Way disk (~17.8° from ecliptic) |
| **Galaxy** | Massive collection of stars, gas, dust bound by gravity (billions to trillions of stars) |
| **Globular Cluster** | Spherical cluster of hundreds of thousands of old stars |
| **GLSL** | OpenGL Shading Language; code running on GPU for rendering |
| **Gravitational Lensing** | Bending of light around massive objects (Einstein effect) |
| **HD Catalog** | Henry Draper Catalog; ~225,000 bright stars |
| **Heliopause** | Boundary where Solar Wind meets interstellar medium |
| **Hertzsprung-Russell (HR) Diagram** | Plot of stellar luminosity vs. temperature |
| **Hipparcos** | ESA's space telescope; measured positions of ~118,000 bright stars |
| **Horizon** | Observer's visual boundary at sea level |
| **Hubble Classification** | Scheme for classifying galaxy morphology (elliptical, spiral, lenticular, irregular) |
| **Illuminance** | Brightness as measured at receiver; depends on distance and angle |
| **Inclination (i)** | Orbital element; angle of orbit to reference plane |
| **Interstellar Medium** | Gas, dust, radiation between stars |
| **Kepler Equation** | M = E - e*sin(E); relates mean anomaly to eccentric anomaly |
| **LOD** | Level of Detail; rendering quality based on distance |
| **Lux** | Unit of illuminance; 1 lm/m² |
| **Magnitude** | Logarithmic scale of brightness; 5 magnitudes = 100x brightness change |
| **Mean Anomaly (M)** | Orbital element; parametric angle proportional to elapsed time |
| **Messier Catalog** | 110 bright nebulae/clusters catalogued by Charles Messier (1774) |
| **NGC** | New General Catalog; ~13,000 objects (nebulae, clusters, galaxies) |
| **Parsec (pc)** | Distance at which 1 AU subtends 1 arcsecond; ≈ 3.26 light-years |
| **Perihelion** | Point in orbit closest to the Sun |
| **Proper Motion** | Apparent motion of star across sky (due to movement relative to Earth) |
| **Radial Velocity** | Speed of object moving toward/away from observer |
| **Raycasting** | Graphics technique; trace rays from camera through pixels to find intersections |
| **Redshift** | Increase in wavelength of light (z > 0 = moving away, Big Bang era galaxies) |
| **Right Ascension (RA)** | Coordinate; angle measured eastward from vernal equinox (0h to 24h) |
| **SDSS** | Sloan Digital Sky Survey; maps ~1/3 of the sky in detail; ~1 million galaxies |
| **Sidereal** | Relative to distant stars (sidereal day ≠ solar day due to Earth's orbit) |
| **Sonification** | Data-to-audio mapping; represent values as sounds |
| **Spectral Type** | Star classification by temperature (O, B, A, F, G, K, M from hottest to coolest) |
| **Spherical Lerp (SLERP)** | Interpolation of rotations on sphere (quaternions) |
| **Stellar Parallax** | Apparent shift in star's position as Earth orbits; used to measure distance |
| **Supersampling** | Rendering at higher resolution then downscaling for better quality |
| **Tidal Locking** | Orbital synchronization; rotation period = orbital period (e.g., Moon) |
| **Time Dilation** | Relativistic effect; time passes differently at different gravitational potentials |
| **Tone Mapping** | Converting high dynamic range (HDR) values to displayable range |
| **True Anomaly (ν)** | Orbital element; actual angle from perihelion to current position |
| **UGC** | Uppsala General Catalog; ~13,000 galaxies |
| **Universal Time (UT)** | Standard time based on Greenwich meridian (UTC + 0) |
| **Vector3** | 3D vector (x, y, z) |
| **Void** | Large empty region between cosmic filaments (underdensity) |
| **WebGL** | JavaScript API for 3D graphics; uses OpenGL ES shaders |
| **Zenithal Distance** | Angle from zenith (point directly overhead) |

---

## Addendum: Entity Detail Panel Specifications (Added v2.0)

### DFS-A1: Entity Info Panel — Category-Specific Layouts

When user selects/clicks any entity, an Info Panel appears. The panel layout adapts per entity category:

#### Stars (ENT-1000)
- **Header**: Star name + spectral type badge (color-coded: O=#0055FF, B=#0090FF, A=#00B0FF, F=#FFDD00, G=#FFB800, K=#FF7700, M=#FF2200)
- **Properties**: Temperature, Luminosity, Mass, Radius, Lifetime, Distance
- **Visual indicator**: Color swatch matching star color
- **Special fields**: Variable type + period (if applicable), Binary companion (if applicable)
- **Action buttons**: "Fly to", "Compare", "Add to Tour"

#### Planets (ENT-2000)
- **Header**: Planet name + type badge (e.g., "Carbon Planet", "Hot Jupiter")
- **Properties**: Radius, Mass, Orbital Period, Surface Temperature, Atmosphere composition
- **Visual indicator**: Mini-globe with shader preview
- **Special fields**: Habitability indicator, Tidal lock status, Ring system toggle
- **Subpanel for exotic types**: Carbon Planet shows C/O ratio, diamond/graphite coverage. Lava World shows magma temperature. Ocean World shows ocean depth.

#### Moons (ENT-3000)
- **Header**: Moon name + parent body
- **Properties**: Radius, Mass, Orbital Period, Surface type
- **Special fields**: Geological activity indicator (volcanic/cryogenic/dormant), Subsurface ocean probability

#### Small Bodies (ENT-4000)
- **Header**: Object name + spectral class (for asteroids) or type (comet/dwarf planet/KBO)
- **Properties**: Size, Mass, Orbital elements, Albedo, Composition
- **Special fields**: For comets: perihelion distance, tail activity status. For dwarf planets: atmosphere toggle.

#### Nebulae (ENT-5000)
- **Header**: Nebula name + Messier/NGC catalog ID + type badge
- **Properties**: Distance, Angular size, Physical size, Dominant emission lines
- **Visual indicator**: Emission color swatch (Hα red, OIII green, SII orange)
- **Special fields**: Central star info (for planetary nebulae), Expansion velocity (for SNRs)

#### Galaxies (ENT-6000)
- **Header**: Galaxy name + Hubble type + catalog ID
- **Properties**: Distance, Redshift, Mass, Diameter, Star count estimate
- **Special fields**: AGN type + luminosity (if active), Merger stage (if interacting)

#### Large-Scale Structure (ENT-7000)
- **Header**: Structure name + type
- **Properties**: Size, Member count (for clusters), Density contrast (for filaments/voids)
- **Special fields**: X-ray luminosity (clusters), Temperature (CMB anisotropy)

#### Exotic Objects (ENT-8000)
- **Header**: Object name + "Theoretical" or "Observed" badge
- **Properties**: Varies per type — mass, radius, magnetic field, etc.
- **Special fields**: Confidence level (Confirmed / Theoretical / Hypothetical), Key observable signature

### DFS-A2: Search Results — Entity Type Grouping

Search results are grouped by category with type icons:
```
Search: "carbon"
├── Stars (1 result)
│   └── ENT-1029: Carbon Stars ★
├── Planets (1 result)
│   └── ENT-2037: Carbon Planet (Diamond World) 🪐
└── Small Bodies (1 result)
    └── ENT-4010: C-Type Asteroids (Carbonaceous) ☄️
```

### DFS-A3: Catalog Browse Screen

Full catalog organized by 9 categories with expandable type lists:
- Left sidebar: 8 category tabs with count badges
- Main area: Grid of entity type cards (icon + name + example count)
- Click card → expands to show all instances of that type
- Total browsable: 96 entity types

---

## END OF DETAILED FUNCTIONAL SPECIFICATION

**Document Status:** Complete (3000+ lines)

**Next Steps:**
- Review with Product Manager
- QA creates test cases per screen
- Engineering creates sprint tasks from spec sections
- Design system created for all specified components
- API contracts defined per data flow section

**Revision History:**
- **v1.0 (2026-04-16):** Initial complete specification
- **v2.0 (2026-04-16):** Added entity type requirements cross-reference and detail panel specifications for 96 entity types across 9 categories
