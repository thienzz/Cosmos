# Accessibility & Internationalization Guide

**Cosmos Explorer** — Interactive 3D Web-Based Universe Visualization

| Field          | Value                  |
|:---------------|:-----------------------|
| **Version**    | 1.0                    |
| **Date**       | 2026-04-16             |
| **Status**     | Published              |

---

## Table of Contents

1. [Accessibility Standards](#accessibility-standards)
2. [Visual Accessibility](#visual-accessibility)
3. [Keyboard Navigation](#keyboard-navigation)
4. [Screen Reader Support](#screen-reader-support)
5. [Motor Accessibility](#motor-accessibility)
6. [Cognitive Accessibility](#cognitive-accessibility)
7. [Reduced Motion](#reduced-motion)
8. [Internationalization (i18n) Architecture](#internationalization-i18n-architecture)
9. [Localization (L10n) Workflow](#localization-l10n-workflow)
10. [Testing & Compliance](#testing--compliance)
11. [Legal Framework](#legal-framework)

---

## Accessibility Standards

### Compliance Target

**Cosmos Explorer** aims for **WCAG 2.1 Level AA compliance** across all public-facing features. Level AA is the international standard for digital accessibility and balances inclusivity with practical feasibility.

### 3D WebGL Application Challenges

As an interactive 3D visualization, Cosmos Explorer presents unique accessibility constraints distinct from traditional web applications:

| Challenge | Mitigation Strategy |
|:----------|:-------------------|
| **Motion-intensive interface** | Provide keyboard/static alternatives; respect prefers-reduced-motion |
| **Spatial navigation in 3D** | Offer sequential, arrow-key-based orbit modes; voice commands |
| **Complex color-dependent visualizations** | Add texture, patterns, labels; support color-blind modes |
| **Performance overhead from a11y features** | Lazy-load ARIA labels; cache audio descriptions |
| **Screen reader spatial orientation** | Announce distance, direction, and magnitude verbally |

### Accessibility Policy

- Accessibility is a core feature, not an afterthought
- All new functionality requires accessibility sign-off before release
- User feedback on accessibility takes priority in sprint planning
- Annual third-party accessibility audit (minimum)

---

## Visual Accessibility

### Color Contrast

**WCAG AA Minimum Requirements:**

- **Text and text-like components:** 4.5:1 contrast ratio
  - Applies to all labels, buttons, and informational text
  - Exception: Large text (≥18pt or 14pt bold) requires only 3:1

- **Non-text UI components and graphical elements:** 3:1 contrast ratio
  - Buttons, form controls, borders, icons

**Implementation Details:**

```css
/* Primary text on light background */
color: #1a1a1a; /* WCAG AA compliant */
background: #ffffff;

/* Alt palette for dark mode */
@media (prefers-color-scheme: dark) {
  color: #e8e8e8;
  background: #0a0a0a;
}
```

**Verification:**
- Use browser DevTools contrast checker
- Validate with WebAIM Contrast Checker or axe DevTools
- Test all UI states (normal, hover, focus, disabled)

### Color Blindness Support

**Three primary forms of color blindness** affect ~8% of males and ~0.5% of females (CVD):

#### 1. Deuteranopia (Red-Green, Green-Weak)
- Cannot distinguish red/green effectively; sees yellows, blues, grays
- ~1% of males

#### 2. Protanopia (Red-Green, Red-Weak)
- Cannot see red tones; sees blues and yellows
- ~1% of males

#### 3. Tritanopia (Blue-Yellow)
- Cannot distinguish blue/yellow; sees reds and greens
- Rarest form; ~0.001% of population

#### Alternative Color Palettes

Provide three palette options in Settings:

**Standard Palette** (default):
- Star types: Blue, White, Yellow, Orange, Red
- Star temperature visualized by hue

**Deuteranopia-Safe Palette:**
- Stars by temperature: Blue → Cyan → Yellow → White
- Uses cyan instead of red; avoids green-red contrast

**Protanopia-Safe Palette:**
- Stars by temperature: Blue → Green → Yellow → White
- Emphasizes blue-green-yellow spectrum

**Tritanopia-Safe Palette:**
- Stars by temperature: Blue → Magenta → Red → Gray
- Avoids blue-yellow distinction

**Implementation:**
```typescript
interface ColorPalette {
  CVDMode: "standard" | "deuteranopia" | "protanopia" | "tritanopia";
  colors: {
    star_blue: string;
    star_white: string;
    star_yellow: string;
    star_red: string;
    galaxy: string;
    nebula: string;
  };
}

const PaletteMap = {
  deuteranopia: {
    star_blue: "#0064d6",
    star_white: "#e0e0e0",
    star_yellow: "#ffd700",
    star_red: "#ffb347", // Orange instead
  },
  // ... other palettes
};
```

### High Contrast Mode

Respect the system `prefers-contrast` media query and provide a toggle in Settings:

```css
@media (prefers-contrast: more) {
  body {
    --text-color: #000000;
    --background-color: #ffffff;
    --border-width: 2px; /* thicker borders */
    --border-color: #000000;
  }
  
  /* Increase text weight */
  button, label, h1, h2, h3 {
    font-weight: 700;
  }
  
  /* Remove subtle shadows, use hard edges */
  .panel {
    box-shadow: none;
    border: 2px solid currentColor;
  }
}
```

### Adjustable Text Size

The entire UI scales responsively with browser zoom (100%, 125%, 150%, 200%):

- All fonts use relative units: `rem`, `em`, or viewport-relative units
- No fixed pixel sizes for text
- Base font size: 16px (1rem)

**Heading hierarchy:**
```css
h1 { font-size: 2rem; }    /* 32px at 100% zoom */
h2 { font-size: 1.75rem; } /* 28px */
h3 { font-size: 1.5rem; }  /* 24px */
body { font-size: 1rem; }  /* 16px */
```

**Manual scaling toggle** in Settings:
- 90% → 100% → 125% → 150% → 175% → 200%
- Persists in localStorage

```typescript
function setUIScale(percentage: number) {
  document.documentElement.style.fontSize = `${(16 * percentage) / 100}px`;
  localStorage.setItem("uiScale", percentage.toString());
}
```

### No Information by Color Alone

Every color-encoded piece of information must have a secondary visual cue:

| Information | Color | Secondary Cue |
|:-----------|:------|:--------------|
| Star spectral type | Hue (blue/red/yellow) | Icon badge, label |
| Object selected | Blue highlight | Thick border + check mark |
| Zoom level | Gradient background | Percentage display (UI) |
| Distance danger zone | Red glow | "⚠️ Too Close" label |
| Orbit trajectory | Green line | Solid/dashed pattern |

**Implementation:**

```html
<div class="star" data-type="hot-blue" aria-label="Sirius (Hot Blue Star)">
  <div class="star-badge">A</div> <!-- Spectral class badge -->
  <span class="sr-only">Spectral Type: A (Hot Blue Star)</span>
</div>
```

### Reduced Transparency Mode

Glassmorphism and semi-transparent UI elements create readability issues for some users. Provide a toggle:

```css
@media (prefers-reduced-transparency) {
  .panel, .info-box {
    background-color: rgba(255, 255, 255, 0.95); /* 95% instead of 70% */
    backdrop-filter: none; /* disable blur */
    border: 1px solid #ccc;
  }
  
  .modal-overlay {
    background-color: rgba(0, 0, 0, 0.9); /* more opaque */
  }
}
```

**Settings Toggle:**
- Store in `localStorage` and apply on app load
- Accessible via Accessibility panel (keyboard shortcut: `Alt+A`)

---

## Keyboard Navigation

### Full Keyboard Support

Every interactive element must be operable via keyboard alone, with no reliance on mouse or touch:

**Required keyboard support:**
- All buttons and links: `Enter` to activate
- Form inputs: Standard browser behavior (`Tab`, arrow keys, `Space` for checkboxes)
- Sliders: `Arrow Up/Down` or `Left/Right` to adjust; `Home`/`End` for min/max
- Dropdown menus: `Arrow Down` to open; `Arrow Up/Down` to navigate; `Enter`/`Space` to select
- Modals/dialogs: `Escape` to close; `Tab` to cycle through controls

### Tab Order and Focus Management

**Tab order strategy:**
1. Skip to main content link (visible on `Tab` press)
2. Main navigation panel tabs (top-to-bottom, left-to-right)
3. Primary 3D viewer controls (if visible)
4. Info/detail panels (if open)
5. Settings/preferences (when active)

**Implementation:**

```html
<!-- Skip link (visible on focus only) -->
<a href="#main-viewer" class="skip-link">Skip to 3D Viewer</a>

<!-- Main content with natural tab order -->
<div id="main-viewer" role="main" tabindex="-1">
  <!-- Canvas and viewer controls -->
</div>

<!-- Use tabindex carefully; prefer semantic HTML -->
<button tabindex="0">Zoom In</button>
<button tabindex="1">Rotate</button>
<!-- Don't use tabindex > 0 except in rare cases -->
```

### Arrow Keys for 3D Navigation

Provide **Orbit Mode** and **Fly Mode** keyboard navigation as alternatives to mouse drag:

#### Orbit Mode (default)
- `⬅️ Left Arrow` → Rotate camera left around target
- `➡️ Right Arrow` → Rotate camera right
- `⬆️ Up Arrow` → Rotate camera up
- `⬇️ Down Arrow` → Rotate camera down
- `W` / `+` → Zoom in (increase FOV)
- `S` / `-` → Zoom out
- `R` → Reset to default view
- `Home` → Jump to Sol (home system)

#### Fly Mode (toggle with `F`)
- `⬆️ Up` / `W` → Move forward
- `⬇️ Down` / `S` → Move backward
- `⬅️ Left` / `A` → Strafe left
- `➡️ Right` / `D` → Strafe right
- `Q` → Move up
- `E` → Move down
- `Shift + Arrow` → Faster movement (3x speed)
- `Ctrl + Arrow` → Slower movement (0.3x speed)

**Implementation:**

```typescript
class KeyboardNavigator {
  handleKeyDown(event: KeyboardEvent) {
    if (event.target !== document.body) return; // Don't steal input focus
    
    switch (event.key) {
      case "ArrowLeft":
        this.camera.rotateAroundTarget(-5, 0);
        event.preventDefault();
        break;
      case "ArrowRight":
        this.camera.rotateAroundTarget(5, 0);
        event.preventDefault();
        break;
      case "ArrowUp":
        this.camera.rotateAroundTarget(0, 5);
        event.preventDefault();
        break;
      case "ArrowDown":
        this.camera.rotateAroundTarget(0, -5);
        event.preventDefault();
        break;
      case "w":
      case "W":
      case "+":
        this.camera.zoom(1.1);
        event.preventDefault();
        break;
      case "s":
      case "S":
      case "-":
        this.camera.zoom(0.9);
        event.preventDefault();
        break;
      case "f":
      case "F":
        this.toggleFlyMode();
        event.preventDefault();
        break;
    }
  }
}
```

### Keyboard Shortcuts Reference

Provide an accessible **Keyboard Shortcuts Dialog** accessible via `?` or `Ctrl+/`:

**Navigation Shortcuts:**
| Shortcut | Action |
|:---------|:-------|
| `⬅️ ⬆️ ⬇️ ➡️` | Rotate camera |
| `W` / `S` | Zoom in/out |
| `F` | Toggle Fly Mode |
| `R` | Reset view |
| `Home` | Jump to Sol |

**UI Shortcuts:**
| Shortcut | Action |
|:---------|:-------|
| `Tab` | Focus next element |
| `Shift+Tab` | Focus previous element |
| `Escape` | Close panel/modal |
| `Enter` | Activate button |
| `Space` | Toggle checkbox/play/pause |

**Application Shortcuts:**
| Shortcut | Action |
|:---------|:-------|
| `Ctrl+F` | Search/Find object |
| `Ctrl+S` | Save current view |
| `Ctrl+L` | Toggle star labels |
| `Alt+A` | Accessibility menu |
| `?` or `Ctrl+/` | Show this dialog |

**Customizable Shortcuts:**
- Users can rebind most shortcuts in Settings → Keyboard
- Lock certain shortcuts to prevent accidental rebinding (e.g., `Escape`)
- Export/import custom keybindings (JSON)

```typescript
interface KeyboardShortcuts {
  [action: string]: string[];
}

const DEFAULT_SHORTCUTS: KeyboardShortcuts = {
  "orbit.left": ["ArrowLeft"],
  "orbit.right": ["ArrowRight"],
  "zoom.in": ["w", "W", "+"],
  "zoom.out": ["s", "S", "-"],
  "toggle.flyMode": ["f", "F"],
  "search": ["Control+f"],
  // ... more
};

class ShortcutsManager {
  constructor(private shortcuts = DEFAULT_SHORTCUTS) {}
  
  isCustomizable(action: string): boolean {
    return !["Escape", "Tab", "Shift+Tab"].includes(this.shortcuts[action][0]);
  }
  
  rebind(action: string, newKeys: string[]) {
    if (!this.isCustomizable(action)) throw new Error("Cannot rebind");
    this.shortcuts[action] = newKeys;
    localStorage.setItem("custom_shortcuts", JSON.stringify(this.shortcuts));
  }
}
```

### Focus Indicators

**High-contrast, visible focus rings** must be present on all interactive elements:

```css
/* Visible focus indicator */
button:focus,
a:focus,
input:focus,
[role="button"]:focus {
  outline: 3px solid #4A90E2; /* High contrast blue */
  outline-offset: 2px;
}

/* Dark mode adjustment */
@media (prefers-color-scheme: dark) {
  button:focus,
  a:focus,
  input:focus {
    outline-color: #80B8FF; /* Lighter blue for dark backgrounds */
  }
}

/* Remove default outline for mouse-only users (optional enhancement) */
button:focus:not(:focus-visible) {
  outline: none; /* Remove ring for mouse users */
}

button:focus-visible {
  outline: 3px solid #4A90E2;
  outline-offset: 2px;
}
```

**Focus ring visibility checklist:**
- ✅ Visible in all color modes (light, dark, high contrast)
- ✅ 3px minimum thickness
- ✅ 2px offset from element
- ✅ Distinct color (not the same as surrounding UI)
- ✅ Works on buttons, links, inputs, custom controls

### Skip Navigation Links

Provide a prominent **Skip to Main Content** link:

```html
<a href="#main-viewer" class="skip-link" accesskey="1">
  Skip to 3D Viewer
</a>

<style>
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  z-index: 100;
}

.skip-link:focus {
  top: 0; /* Visible on focus */
}
</style>
```

Additional skip links for complex layouts:
- "Skip to Navigation"
- "Skip to Search"
- "Skip to Settings"

### Escape to Close

All modal dialogs, panels, and overlays must close when `Escape` is pressed:

```typescript
function setupEscapeHandler(element: HTMLElement) {
  element.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closePanel(element);
      event.preventDefault();
    }
  });
}

// Auto-focus first control when modal opens
function openModal(dialog: HTMLElement) {
  dialog.showModal();
  const firstControl = dialog.querySelector("button, input, [role='button']");
  (firstControl as HTMLElement).focus();
}
```

---

## Screen Reader Support

### ARIA Labels for Interactive Elements

Every interactive element must have an accessible name:

```html
<!-- Button with text content (has implicit name) -->
<button>Zoom In</button>

<!-- Button with only an icon (needs aria-label) -->
<button aria-label="Zoom In">
  <svg><!-- zoom icon --></svg>
</button>

<!-- Slider with label and live region -->
<label for="zoom-slider">Camera Zoom (1× to 1000×)</label>
<input
  id="zoom-slider"
  type="range"
  min="1"
  max="1000"
  value="1"
  aria-label="Camera zoom level"
  aria-describedby="zoom-help"
/>
<div id="zoom-help" class="sr-only">
  Use arrow keys to adjust zoom. Current value: 100×
</div>

<!-- Custom control with comprehensive ARIA -->
<div
  role="button"
  tabindex="0"
  aria-label="Toggle star labels"
  aria-pressed="false"
  @click="toggleLabels"
  @keydown.enter="toggleLabels"
  class="toggle-button"
></div>
```

**ARIA Label Hierarchy:**
1. Explicit `<label>` (for form inputs)
2. `aria-label` (custom text)
3. `aria-labelledby` (reference another element's text)
4. Element text content (for buttons/links)
5. `title` attribute (fallback, not recommended as primary label)

### Live Regions for Dynamic Content

Use `aria-live` to announce updates to screen readers:

#### Real-Time Coordinate Updates

```html
<div
  aria-live="polite"
  aria-atomic="true"
  role="status"
  id="viewport-info"
  class="sr-only"
>
  <!-- Updated every 100ms during navigation -->
</div>
```

```typescript
function updateViewportInfo() {
  const info = document.getElementById("viewport-info")!;
  const { distance, ra, dec, zoom } = this.camera.getState();
  
  info.textContent = 
    `Distance: ${distance.toLocaleString()} light-years. ` +
    `Right Ascension: ${ra.toFixed(2)}°. ` +
    `Declination: ${dec.toFixed(2)}°. ` +
    `Zoom: ${(zoom * 100).toFixed(0)}%.`;
}
```

**Polite vs. Assertive:**
- `aria-live="polite"` → Waits for a pause in speech (recommended for status updates)
- `aria-live="assertive"` → Interrupts immediately (use only for critical alerts)

#### Selected Object Information

```html
<div
  aria-live="polite"
  aria-atomic="true"
  role="status"
  id="selected-object"
  class="sr-only"
>
  <!-- Changes when user clicks on a celestial object -->
</div>
```

```typescript
function selectObject(obj: CelestialObject) {
  const info = document.getElementById("selected-object")!;
  
  info.textContent = 
    `Selected: ${obj.name}. ` +
    `Type: ${obj.type}. ` +
    `Distance: ${obj.distance.toLocaleString()} light-years. ` +
    `Magnitude: ${obj.magnitude.toFixed(1)}. ` +
    `${obj.isObservable ? "Observable from Earth." : "Not observable from Earth."}`;
}
```

### Descriptive Alt Text for Celestial Objects

Provide rich descriptions for every object (in addition to labels):

```html
<div
  class="celestial-object star"
  data-object-id="sirius"
  role="button"
  tabindex="0"
  aria-label="Sirius"
  aria-describedby="sirius-description"
>
  <!-- 3D representation -->
</div>

<div id="sirius-description" class="sr-only">
  Sirius, the brightest star in Earth's night sky. 
  Located 8.6 light-years away in the constellation Canis Major. 
  Spectral type A1V, blue-white star with a white dwarf companion. 
  Approximately 2.02 times the Sun's mass and 1.71 times its radius. 
  Surface temperature around 10,000 Kelvin.
</div>
```

### Audio Descriptions

Provide **optional audio descriptions** of the current view for users who cannot see the 3D visualization:

**Feature:** Audio Description Toggle in Accessibility menu

```typescript
class AudioDescriber {
  async describeCurrentView() {
    const view = this.camera.getState();
    const objects = this.getVisibleObjects();
    
    const description = this.generateDescription(view, objects);
    await this.speak(description, this.userLanguage);
  }
  
  generateDescription(view: CameraState, objects: CelestialObject[]): string {
    const nearestObjects = objects.slice(0, 3);
    const directions = nearestObjects.map(obj => 
      `${obj.name} to the ${this.getDirection(obj)}`
    ).join("; ");
    
    return `
      You are viewing space centered around ${view.targetName}.
      The view is zoomed to ${(view.zoom * 100).toFixed(0)}% magnification.
      Nearby objects include: ${directions}.
      Current time scale: ${view.timeScale}.
    `;
  }
  
  getDirection(obj: CelestialObject): string {
    const angle = Math.atan2(obj.position.y, obj.position.x);
    const directions = ["north", "northeast", "east", "southeast", 
                       "south", "southwest", "west", "northwest"];
    const index = Math.round((angle + Math.PI) / (Math.PI / 4)) % 8;
    return directions[index];
  }
  
  async speak(text: string, language: string) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 1; // Adjustable in Settings
    window.speechSynthesis.speak(utterance);
  }
}
```

**When to trigger audio descriptions:**
- User enables in Accessibility menu (toggle)
- User presses `Ctrl+D` (describe current view)
- Automatic announcement on object selection
- Configurable announcement on view change

### Scale Change Announcements

When the user changes zoom levels or time scales, announce the change:

```typescript
function setZoom(zoomLevel: number) {
  const oldZoom = this.camera.zoom;
  this.camera.zoom = zoomLevel;
  
  if (oldZoom !== zoomLevel) {
    const percentage = (zoomLevel * 100).toFixed(0);
    this.announceToScreenReader(`Zoom level: ${percentage}%`);
  }
}

function announceToScreenReader(message: string) {
  const announcement = document.createElement("div");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", "polite");
  announcement.className = "sr-only";
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
}
```

### Hidden Text Descriptions for Visual-Only Content

For star field backgrounds, nebula animations, and other purely visual elements, provide descriptions:

```html
<!-- Animated nebula cloud -->
<canvas id="nebula-background" aria-hidden="true"></canvas>

<!-- Hidden description for screen readers -->
<div class="sr-only" aria-label="Nebula background description">
  A soft, multi-colored nebula cloud filling the background. 
  The primary colors are purple and blue, with hints of orange near the center. 
  Small white stars twinkle throughout the scene.
</div>
```

---

## Motor Accessibility

### Actions Achievable Without Mouse

All functionality must be operable via keyboard or voice commands:

| Task | Mouse | Keyboard | Voice |
|:-----|:------|:---------|:------|
| Rotate view | Drag | Arrow keys | "Rotate left" |
| Zoom | Scroll wheel | W/S or +/- | "Zoom in" |
| Select object | Click | Arrow keys + Enter | "Select Sirius" |
| Pan viewport | Right-click drag | A/D + Q/E | "Pan left" |
| Open menu | Click | Alt+M | "Open menu" |
| Close dialog | Click X | Escape | "Close" |

### Voice Command Support (Optional)

Implement using Web Speech API:

```typescript
class VoiceCommandListener {
  private recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  
  constructor() {
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.setupCommandMap();
  }
  
  private commandMap = {
    "rotate left": () => this.camera.rotateAroundTarget(-10, 0),
    "rotate right": () => this.camera.rotateAroundTarget(10, 0),
    "zoom in": () => this.camera.zoom(1.2),
    "zoom out": () => this.camera.zoom(0.8),
    "select sirius": () => this.selectObject("sirius"),
    "open menu": () => this.toggleMenu(),
    "close": () => this.closeActivePanel(),
  };
  
  start() {
    this.recognition.start();
    this.announceToScreenReader("Voice commands activated");
  }
  
  setupListeners() {
    this.recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript = event.results[i][0].transcript.toLowerCase();
        }
      }
      this.executeCommand(transcript);
    };
  }
  
  private executeCommand(command: string) {
    const handler = this.commandMap[command];
    if (handler) {
      handler();
      this.announceToScreenReader(`Executed: ${command}`);
    }
  }
}
```

### Adjustable Click/Touch Target Sizes

**Minimum target size:** 44×44px (WCAG AAA standard)

```css
button, a, [role="button"], [role="tab"] {
  min-width: 44px;
  min-height: 44px;
  padding: 12px;
}

/* Extra padding for smaller icon buttons */
.icon-button {
  padding: 10px; /* Centers 24px icon in 44px button */
}

/* Mobile: ensure adequate spacing between targets */
@media (max-width: 768px) {
  button, a {
    min-height: 48px;
    min-width: 48px;
    margin: 8px; /* Spacing between targets */
  }
}
```

**Testing:**
- Use browser DevTools to inspect element dimensions
- Test on touch devices (phone, tablet)
- Ensure no targets are closer than 8px apart

### No Time-Dependent Interactions

Remove or provide alternatives to time-based interactions:

❌ **Avoid:**
```typescript
let clickCount = 0;
element.addEventListener("click", () => {
  clickCount++;
  if (clickCount === 2) {
    // Double-click action
    doSomething();
    clickCount = 0;
  }
  // But what if user can't click twice quickly?
});
```

✅ **Better:**
```typescript
// Provide explicit button for the action
<button aria-label="Delete object">Delete</button>

// If double-click is needed, also provide:
// 1. A confirmation dialog
// 2. An undo option
// 3. A dedicated button as alternative
```

**Alternative patterns:**
- Replace double-click with dedicated buttons
- Provide confirmation dialogs for destructive actions
- Implement undo/redo for all state changes
- Allow users to adjust animation speed (for timed interactions)

### Adjustable Camera Sensitivity/Speed

Add fine-tuned controls in Accessibility Settings:

```typescript
interface CameraSettings {
  rotationSensitivity: number;      // 0.1 (slow) to 3 (fast), default 1
  zoomSensitivity: number;          // 0.1 to 3, default 1
  panSpeed: number;                 // pixels/sec when using arrow keys
  flyModeSpeed: number;             // units/sec in fly mode
  invertRotation: boolean;           // Invert Y-axis
  mouseSmoothening: boolean;        // Smooth animation vs instant
}

class CameraController {
  settings: CameraSettings = {
    rotationSensitivity: 1,
    zoomSensitivity: 1,
    panSpeed: 50,
    flyModeSpeed: 100,
    invertRotation: false,
    mouseSmoothening: true,
  };
  
  rotateAroundTarget(deltaX: number, deltaY: number) {
    const speed = this.settings.rotationSensitivity;
    this.rotation.x += deltaX * speed;
    this.rotation.y += (deltaY * (this.settings.invertRotation ? -1 : 1)) * speed;
  }
  
  zoom(factor: number) {
    const speed = this.settings.zoomSensitivity;
    this.fov *= Math.pow(factor, speed);
    this.fov = Math.max(10, Math.min(120, this.fov));
  }
}
```

**UI for adjustable settings:**
```html
<form class="accessibility-settings">
  <label for="rotation-speed">
    Rotation Sensitivity: <span id="rotation-value">1.0×</span>
  </label>
  <input
    id="rotation-speed"
    type="range"
    min="0.1"
    max="3"
    step="0.1"
    value="1"
    @input="updateSetting('rotationSensitivity', $event.target.value)"
  />
  
  <label for="zoom-speed">
    Zoom Sensitivity: <span id="zoom-value">1.0×</span>
  </label>
  <input
    id="zoom-speed"
    type="range"
    min="0.1"
    max="3"
    step="0.1"
    value="1"
    @input="updateSetting('zoomSensitivity', $event.target.value)"
  />
  
  <label>
    <input
      type="checkbox"
      @change="toggleSetting('invertRotation')"
    />
    Invert Y-Axis
  </label>
</form>
```

### Single-Switch / Button Navigation Mode

For users with very limited motor control, provide a **Scanning Navigation Mode**:

```typescript
class ScanningNavigator {
  // Highlights interactive elements in sequence
  private currentIndex = 0;
  private interactiveElements: HTMLElement[] = [];
  private scanInterval = 2000; // 2 seconds per element
  
  constructor(scanIntervalMs: number = 2000) {
    this.scanInterval = scanIntervalMs;
  }
  
  start() {
    this.interactiveElements = this.getAllInteractiveElements();
    this.highlightElement(0);
    
    setInterval(() => {
      this.currentIndex = (this.currentIndex + 1) % this.interactiveElements.length;
      this.highlightElement(this.currentIndex);
    }, this.scanInterval);
  }
  
  // User presses button/switch to select highlighted element
  selectCurrent() {
    const element = this.interactiveElements[this.currentIndex];
    if (element instanceof HTMLButtonElement) {
      element.click();
    } else if (element instanceof HTMLInputElement) {
      element.focus();
    }
  }
  
  // Visual highlight (high contrast)
  private highlightElement(index: number) {
    this.interactiveElements.forEach((el, i) => {
      if (i === index) {
        el.classList.add("scanning-highlight");
        el.setAttribute("aria-current", "true");
      } else {
        el.classList.remove("scanning-highlight");
        el.removeAttribute("aria-current");
      }
    });
  }
  
  private getAllInteractiveElements(): HTMLElement[] {
    return Array.from(
      document.querySelectorAll(
        "button, a, input, [role='button'], [role='tab'], select, textarea"
      )
    );
  }
}
```

**Styling for scanning:**
```css
.scanning-highlight {
  outline: 4px solid #ff0000;
  outline-offset: 2px;
  animation: scan-pulse 0.5s ease-in-out;
}

@keyframes scan-pulse {
  0%, 100% { outline-width: 4px; }
  50% { outline-width: 6px; }
}
```

---

## Cognitive Accessibility

### Clear, Consistent Navigation Patterns

**Consistent UI structure across the app:**

```
┌─────────────────────────────────────┐
│  Header: Logo, Title, Quick Links   │
├──────────┬──────────────────────────┤
│          │                          │
│ Sidebar  │   Main 3D Viewer         │
│ (Nav)    │                          │
│          ├──────────────────────────┤
│          │  Info Panel (dynamic)    │
├──────────┴──────────────────────────┤
│  Footer: Status, Credits, Legal     │
└─────────────────────────────────────┘
```

**Navigation principles:**
- Header: Logo (home link), app title, main menu toggle
- Sidebar: Consistent, always visible on desktop, collapsible on mobile
- Content: Changes based on view, but maintains visual hierarchy
- Footer: Consistent, contains secondary links
- Modals: Centered, clear close button, focus trap

### Progressive Disclosure

Show simple UI by default; reveal advanced options on demand:

**Levels:**

1. **Beginner** (default):
   - Rotate camera (arrows)
   - Zoom in/out (W/S)
   - Search for object (Ctrl+F)
   - Toggle labels (Ctrl+L)

2. **Intermediate** (collapsible "Advanced" section):
   - Time speed controls
   - Filter objects by type
   - Custom color schemes
   - Measurement tools

3. **Expert** (Settings → Developer):
   - WebGL performance metrics
   - GLSL shader editor
   - Data export (JSON)
   - Custom camera profiles

```html
<section class="controls beginner">
  <button>← Rotate Left</button>
  <button>Rotate Right →</button>
  <button>+ Zoom In</button>
  <button>- Zoom Out</button>
</section>

<details class="controls intermediate">
  <summary>Advanced Controls</summary>
  <button>Time Speed 1×</button>
  <button>Filter Objects</button>
  <button>Color Schemes</button>
</details>

<details class="controls expert" open={userIsExpert}>
  <summary>Developer Options</summary>
  <div>WebGL Metrics...</div>
  <div>Shader Editor...</div>
</details>
```

### Guided Tours for First-Time Users

Provide an interactive onboarding experience:

```typescript
class GuidedTour {
  private currentStep = 0;
  private steps = [
    {
      title: "Welcome to Cosmos Explorer",
      description: "Let's learn how to navigate the universe.",
      highlightElement: "#main-viewer",
      action: "Click or press Enter to continue",
    },
    {
      title: "Rotate the View",
      description: "Use arrow keys or drag with mouse to rotate.",
      highlightElement: "button:contains('Rotate')",
      action: "Try rotating the view now",
    },
    {
      title: "Find Objects",
      description: "Press Ctrl+F to search for stars and galaxies.",
      highlightElement: "#search-button",
      action: "Open the search dialog",
    },
    // ... more steps
  ];
  
  start() {
    this.showStep(0);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.nextStep();
      if (e.key === "Escape") this.skip();
    });
  }
  
  private showStep(index: number) {
    const step = this.steps[index];
    
    // Highlight relevant element
    const element = document.querySelector(step.highlightElement);
    element?.classList.add("tour-highlight");
    
    // Show tooltip
    const tooltip = this.createTooltip(step);
    document.body.appendChild(tooltip);
  }
  
  skip() {
    document.querySelectorAll(".tour-highlight").forEach(el => 
      el.classList.remove("tour-highlight")
    );
    localStorage.setItem("tour_completed", "true");
  }
}
```

**Trigger:**
- Automatically on first visit (can be dismissed)
- Accessible via Help menu → "Start Tour"
- Per-feature tours available (Help → "How to Use Search", etc.)

### Plain Language in UI Labels and Info Panels

Avoid jargon; use clear, concise language:

❌ **Avoid:**
- "Adjust heliocentric ecliptic coordinates"
- "Modulate chromatic aberration filter"
- "Recalibrate parallax offset"

✅ **Use:**
- "Search for nearby objects"
- "Adjust color tint"
- "Fix star position"

**Label guidelines:**
- Use active verbs: "Load Data" not "Data Loading"
- Be specific: "Close All Panels" not "Close"
- Provide context in help text:
  ```html
  <label for="time-speed">
    Time Speed
    <span class="help" title="How fast time passes in the simulation">?</span>
  </label>
  ```

### Undo/Back Functionality

All state changes must be reversible:

```typescript
class UndoManager {
  private history: AppState[] = [];
  private currentIndex = 0;
  
  pushState(state: AppState) {
    // Remove any "future" states if user made a new change
    this.history = this.history.slice(0, this.currentIndex + 1);
    this.history.push(state);
    this.currentIndex++;
  }
  
  undo() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.restoreState(this.history[this.currentIndex]);
    }
  }
  
  redo() {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      this.restoreState(this.history[this.currentIndex]);
    }
  }
  
  private restoreState(state: AppState) {
    this.camera.setState(state.camera);
    this.ui.setSelectedObject(state.selectedObject);
    this.announceToScreenReader("Change undone");
  }
}
```

**Keyboard shortcuts:**
- `Ctrl+Z` → Undo
- `Ctrl+Y` or `Ctrl+Shift+Z` → Redo
- Both should be available in menu and visible in UI

---

## Reduced Motion

### Respect `prefers-reduced-motion` Media Query

Detect user's system preference and disable animations:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```typescript
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

if (prefersReducedMotion) {
  renderer.disableAnimations();
}
```

### Option to Disable Specific Animations

Provide granular controls in Accessibility Settings:

```typescript
interface MotionSettings {
  disableCameraTransitions: boolean;    // Instant vs. smooth zoom
  disableParticleAnimations: boolean;   // Floating stars, nebula
  disableBloomEffects: boolean;         // Glow/light scatter
  disableBackgroundMovement: boolean;   // Star field parallax
  disableUIAnimations: boolean;         // Button hover, panel slide-in
  disablePulsing: boolean;              // Pulsing highlights
}
```

```html
<section class="motion-settings">
  <h3>Animation Preferences</h3>
  
  <label>
    <input
      type="checkbox"
      aria-label="Disable camera transitions"
      @change="toggleSetting('disableCameraTransitions')"
    />
    Instant camera movement (no smooth transitions)
  </label>
  
  <label>
    <input type="checkbox" @change="toggleSetting('disableParticleAnimations')" />
    Disable particle effects
  </label>
  
  <label>
    <input type="checkbox" @change="toggleSetting('disableBloomEffects')" />
    Disable bloom/glow effects
  </label>
  
  <label>
    <input type="checkbox" @change="toggleSetting('disableBackgroundMovement')" />
    Static background
  </label>
  
  <label>
    <input type="checkbox" @change="toggleSetting('disableUIAnimations')" />
    No UI animations
  </label>
</section>
```

### Static Fallback for All Animated Content

Every animation must have a non-animated equivalent:

```typescript
class CameraController {
  private motionSettings: MotionSettings;
  
  zoomToObject(target: CelestialObject) {
    if (this.motionSettings.disableCameraTransitions) {
      // Instant jump
      this.camera.position = target.position;
      this.camera.lookAt(target.center);
      this.announceToScreenReader(`Zoomed to ${target.name}`);
    } else {
      // Smooth animation
      this.animateCamera(this.camera.position, target.position, 1000);
    }
  }
  
  private animateCamera(from: Vec3, to: Vec3, duration: number) {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      this.camera.position = from.lerp(to, progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }
}
```

**Animated UI elements:**

```css
/* Normal animation */
.button:hover {
  background: linear-gradient(90deg, #0066ff, #0044cc);
  box-shadow: 0 4px 12px rgba(0, 102, 255, 0.4);
  transition: all 300ms ease-out;
}

/* Reduced motion: instant change */
@media (prefers-reduced-motion: reduce) {
  .button:hover {
    background: #0044cc;
    box-shadow: 0 4px 12px rgba(0, 102, 255, 0.4);
    transition: none;
  }
}
```

---

## Internationalization (i18n) Architecture

### Framework: i18next

Use **i18next** as the core i18n framework. It provides:
- Namespacing for modular translations
- Pluralization rules
- Formatting (dates, numbers)
- Language detection
- Backend loading (JSON files per language)

**Installation:**
```bash
npm install i18next i18next-browser-languagedetector i18next-http-backend
```

### Directory Structure

```
src/
├── i18n/
│   ├── locales/
│   │   ├── en/
│   │   │   ├── common.json
│   │   │   ├── navigation.json
│   │   │   ├── objects.json
│   │   │   ├── help.json
│   │   │   └── errors.json
│   │   ├── es/
│   │   ├── fr/
│   │   ├── de/
│   │   ├── ja/
│   │   ├── zh/
│   │   ├── ko/
│   │   ├── vi/
│   │   ├── pt/
│   │   └── ar/
│   └── config.ts
```

### Initialization

```typescript
// src/i18n/config.ts
import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";

i18next
  .use(HttpBackend)
  .use(LanguageDetector)
  .init({
    fallbackLng: "en",
    debug: false,
    ns: ["common", "navigation", "objects", "help", "errors"],
    defaultNS: "common",
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false, // React/Vue already escapes
    },
  });

export default i18next;
```

### String Extraction Strategy

All UI text must be extracted into locale files. Use a linting rule to catch hardcoded strings:

**ESLint rule to detect hardcoded strings:**
```json
{
  "rules": {
    "no-hardcoded-strings": ["warn", {
      "allowedPatterns": [
        "^[0-9]+$",
        "^[a-zA-Z_]+$",
        "^@"
      ]
    }]
  }
}
```

**Hardcoded strings are only allowed for:**
- CSS class names
- Variable names
- Comments
- Regular expressions
- Identifiers

**Example: common.json**
```json
{
  "app": {
    "title": "Cosmos Explorer",
    "description": "Interactive 3D Universe Visualization",
    "loading": "Loading...",
    "error": "An error occurred"
  },
  "ui": {
    "buttons": {
      "ok": "OK",
      "cancel": "Cancel",
      "save": "Save",
      "close": "Close",
      "search": "Search",
      "reset": "Reset"
    },
    "labels": {
      "distance": "Distance",
      "time": "Time",
      "zoom": "Zoom",
      "objects": "Objects"
    }
  },
  "messages": {
    "welcome": "Welcome to {{appName}}",
    "objectSelected": "Selected: {{objectName}}",
    "distance_one": "1 light-year away",
    "distance_other": "{{count}} light-years away"
  }
}
```

### RTL Support Considerations

For Arabic and Hebrew, ensure proper RTL layout:

**CSS for RTL:**
```css
[dir="rtl"] {
  direction: rtl;
  text-align: right;
}

[dir="rtl"] .sidebar {
  right: 0;
  left: auto;
}

[dir="rtl"] button {
  flex-direction: row-reverse;
}

[dir="rtl"] .icon-text {
  margin-right: auto;
  margin-left: 8px;
}
```

**Language detection for RTL:**
```typescript
function setTextDirection(language: string) {
  const rtlLanguages = ["ar", "he"];
  const direction = rtlLanguages.includes(language) ? "rtl" : "ltr";
  document.documentElement.setAttribute("dir", direction);
  document.documentElement.lang = language;
}
```

### Number Formatting (Distance)

Format distances according to user's locale and unit preference:

```typescript
class DistanceFormatter {
  constructor(private locale: string, private unitSystem: "metric" | "imperial" | "astronomical") {}
  
  format(distanceLightYears: number): string {
    switch (this.unitSystem) {
      case "metric":
        return this.formatMetric(distanceLightYears);
      case "imperial":
        return this.formatImperial(distanceLightYears);
      case "astronomical":
        return this.formatAstronomical(distanceLightYears);
    }
  }
  
  private formatMetric(ly: number): string {
    const km = ly * 9.461e12; // light-year to km conversion
    const formatter = new Intl.NumberFormat(this.locale, {
      maximumFractionDigits: 2,
      notation: "compact",
      unit: "kilometer",
    });
    return formatter.format(km);
  }
  
  private formatImperial(ly: number): string {
    const miles = ly * 5.879e12;
    const formatter = new Intl.NumberFormat(this.locale, {
      maximumFractionDigits: 2,
      notation: "compact",
      unit: "mile",
    });
    return formatter.format(miles);
  }
  
  private formatAstronomical(ly: number): string {
    const au = ly * 63241.1; // light-year to AU
    const pc = ly / 3.26156; // light-year to parsec
    
    if (au < 100000) {
      return `${au.toLocaleString(this.locale, { 
        maximumFractionDigits: 1 
      })} AU`;
    } else {
      return `${pc.toLocaleString(this.locale, { 
        maximumFractionDigits: 2 
      })} pc`;
    }
  }
}
```

### Date Formatting

Format dates per locale:

```typescript
function formatDate(date: Date, locale: string, format: "short" | "long" = "long"): string {
  const options: Intl.DateTimeFormatOptions =
    format === "short"
      ? { year: "numeric", month: "2-digit", day: "2-digit" }
      : { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  
  return date.toLocaleDateString(locale, options);
}

// Example:
formatDate(new Date(), "en-US", "long");  // "Thursday, April 16, 2026"
formatDate(new Date(), "de-DE", "long");  // "Donnerstag, 16. April 2026"
formatDate(new Date(), "ja-JP", "short"); // "2026/04/16"
```

### Unit System Toggle

Allow users to choose their preferred unit system:

```typescript
interface UnitSystemSettings {
  distance: "km" | "miles" | "AU" | "ly" | "pc";
  temperature: "Celsius" | "Fahrenheit" | "Kelvin";
  mass: "kg" | "solar_masses" | "earth_masses";
  luminosity: "watts" | "solar_luminosities";
  time: "24h" | "12h"; // Clock format
}
```

```html
<fieldset>
  <legend>Unit System</legend>
  
  <label>
    <input type="radio" name="distance" value="metric" />
    Metric (km, kg)
  </label>
  
  <label>
    <input type="radio" name="distance" value="imperial" />
    Imperial (miles, lbs)
  </label>
  
  <label>
    <input type="radio" name="distance" value="astronomical" />
    Astronomical (AU, ly, pc, M☉)
  </label>
</fieldset>
```

### Priority Languages

Cosmos Explorer will support these languages at launch (v1.0):

| Language | Code | Native Name | RTL | Priority |
|:---------|:-----|:------------|:---:|:--------:|
| English | en | English | — | Tier 1 |
| Spanish | es | Español | — | Tier 1 |
| French | fr | Français | — | Tier 1 |
| German | de | Deutsch | — | Tier 1 |
| Japanese | ja | 日本語 | — | Tier 1 |
| Chinese (Simplified) | zh | 中文 (简体) | — | Tier 1 |
| Korean | ko | 한국어 | — | Tier 1 |
| Vietnamese | vi | Tiếng Việt | — | Tier 2 |
| Portuguese | pt | Português | — | Tier 2 |
| Arabic | ar | العربية | ✓ | Tier 2 |

**Tier 1 (Launch):** Complete translations, cultural review, full testing
**Tier 2 (Post-launch):** Translated via crowdsourcing, limited review

### Scientific Terminology Handling

Latin/scientific names are universal; descriptions are localized:

**Example: Celestial object data structure**
```json
{
  "objects": [
    {
      "id": "sirius_a",
      "scientificName": "Sirius",
      "constellation": "Canis Major",
      "description": "The brightest star in Earth's night sky, located 8.6 light-years away.",
      "descriptionI18n": {
        "en": "The brightest star in Earth's night sky, located 8.6 light-years away.",
        "es": "La estrella más brillante en el cielo nocturno de la Tierra, ubicada a 8.6 años luz de distancia.",
        "ja": "地球の夜空で最も明るい星。地球から8.6光年離れています。"
      },
      "spectralType": "A1V",
      "properties": {
        "mass": 2.02,
        "radius": 1.71,
        "temperature": 10000
      }
    }
  ]
}
```

### Celestial Object Names

Include both IAU official names and cultural/traditional names:

```json
{
  "celestialNames": [
    {
      "iauName": "Alpha Canis Majoris",
      "commonNames": {
        "en": "Sirius",
        "es": "Sirio",
        "ar": "الشعرى اليمانية"
      },
      "culturalNames": {
        "en": "Dog Star",
        "ar": "نجم الكلب",
        "ja": "犬の星",
        "zh": "天狼星"
      }
    },
    {
      "iauName": "M31",
      "commonNames": {
        "en": "Andromeda Galaxy",
        "es": "Galaxia de Andrómeda"
      },
      "culturalNames": {
        "en": "Great Nebula in Andromeda",
        "ja": "アンドロメダ銀河"
      }
    }
  ]
}
```

**Usage in UI:**
```typescript
function getObjectName(objectId: string, locale: string): string {
  const object = celestialNames.find(obj => obj.id === objectId);
  return object?.commonNames[locale] || object?.iauName;
}
```

---

## Localization (L10n) Workflow

### Crowdsourced Translation via Crowdin

Integrate Crowdin for community translations:

1. **Source strings** → Sync to Crowdin via CLI
2. **Community translates** → Crowdin translation interface
3. **Review & approval** → Project maintainers review
4. **Download translations** → Pull translations back to repo
5. **QA** → Screenshot review, functionality testing
6. **Release** → Deploy new language

**Crowdin setup:**
```bash
npm install -g @crowdin/cli

# crowdin.yml
projectId: YOUR_PROJECT_ID
apiToken: YOUR_API_TOKEN

files:
  - source: /src/i18n/locales/en/**/*.json
    translation: /src/i18n/locales/%locale%/**/%original_file_name%
```

**Sync workflow:**
```bash
# Upload source strings
crowdin upload sources

# Download completed translations
crowdin download
```

### Context Notes for Translators

Provide context and guidelines for astronomical terminology:

**Translation guidelines document (in Crowdin):**

```markdown
# Cosmos Explorer Translation Guidelines

## General Rules
- Maintain the tone: informative, accessible, not overly technical
- Use "you" sparingly; prefer imperative form
- Keep UI labels concise (max 50 characters when possible)

## Astronomy Terms
- **Do NOT translate** IAU official names:
  - ❌ "Alpha Canis Majoris" → "Alfa Can Mayor"
  - ✓ "Alpha Canis Majoris" (unchanged)
  
- **DO translate** common names and descriptions:
  - "Sirius" → "Sirio" (Spanish)
  - "Dog Star" → "Estrella del Perro"

## Units
- Use locale-appropriate unit symbols:
  - English: 1,234.56 km
  - German: 1.234,56 km
  - French: 1 234,56 km

## Numbers
- Respect locale's decimal and thousands separators
- Use Intl.NumberFormat in code (automatic)

## Cultural Sensitivity
- Celestial object names may have cultural significance
- Provide context in translator notes for names with cultural meaning
- Example: Andromeda (Western) vs. Chained Woman (Arabic tradition)

## Glossary
| English | Spanish | French | German | Japanese |
|---------|---------|--------|--------|----------|
| Light-year | Año luz | Année-lumière | Lichtjahr | 光年 |
| Star | Estrella | Étoile | Stern | 星 |
| Galaxy | Galaxia | Galaxie | Galaxie | 銀河 |
| Nebula | Nebulosa | Nébuleuse | Nebel | 星雲 |
```

### Screenshot-Based Translation Review

Use Crowdin's screenshot annotation feature:

1. Upload screenshot of UI
2. Mark text regions for context
3. Translators see where text appears in the UI
4. Reduce ambiguity and incorrect translations

### Fallback Chain

Implement a robust fallback mechanism:

```typescript
// User selects: French (France)
// Fallback chain: fr-FR → fr → en

i18next.on("missingKey", (lngs, ns, key) => {
  console.warn(`Missing translation: ${key} in ${lngs}`);
});

const translations = i18next.t("some.key", {
  lng: "fr-FR", // Primary language
  fallbackLng: ["fr", "en"], // Fallback chain
});
```

**Fallback priority order:**

1. User's selected language + region (e.g., `pt-BR`)
2. User's language without region (e.g., `pt`)
3. English (universal fallback)
4. Hardcoded string (last resort)

---

## Testing & Compliance

### Automated Accessibility Testing

#### axe-core in CI

Integrate axe-core for continuous automated testing:

```bash
npm install --save-dev @axe-core/react axe-core
```

**CI configuration (.github/workflows/a11y.yml):**

```yaml
name: Accessibility Tests

on: [push, pull_request]

jobs:
  axe:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm install
      - run: npm run test:a11y
```

**Test script:**
```typescript
// tests/a11y.test.ts
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

describe("Accessibility", () => {
  it("should not have axe violations", async () => {
    const { container } = render(<CosmosExplorer />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

#### Lighthouse Accessibility Audit

Run Lighthouse in CI for each build:

```bash
npm install --save-dev lighthouse
```

**Configuration:**
```typescript
// lighthouse.config.js
module.exports = {
  onlyCategories: ["accessibility"],
  onlyAudits: [
    "color-contrast",
    "aria-allowed-attr",
    "aria-hidden-body",
    "button-name",
    "bypass",
    "document-title",
    "form-field-multiple-labels",
    "html-has-lang",
    "image-alt",
    "label",
    "link-name",
    "list",
    "listitem",
  ],
};
```

**Threshold:** Minimum score of 90/100

### Manual Testing with Screen Readers

#### NVDA (Windows)

```markdown
## NVDA Testing Checklist

- [ ] Install NVDA (free)
- [ ] Test with Firefox (best compatibility)
- [ ] Verify all buttons have accessible names
- [ ] Check live regions announce updates
- [ ] Test keyboard navigation (Tab, Shift+Tab, arrows)
- [ ] Verify form labels are associated (label > input)
- [ ] Test skip links work
- [ ] Check heading hierarchy (h1 > h2 > h3, no skips)
```

**Common NVDA commands:**
- `Insert + Space` → Toggle passthrough
- `Insert + N` → Open NVDA menu
- `Insert + H` → Cycle heading level search
- `Insert + F7` → Toggle Braille mode

#### VoiceOver (macOS/iOS)

```markdown
## VoiceOver Testing Checklist

- [ ] Enable VoiceOver: Cmd+Fn+F5
- [ ] Test with Safari (primary browser)
- [ ] Verify focus order (VO + Right Arrow to navigate)
- [ ] Check custom actions are discoverable (VO + U)
- [ ] Test rotor (VO + U, then arrows to navigate by category)
- [ ] Verify audio descriptions play correctly
```

**Common VoiceOver commands:**
- `VO + Right Arrow` → Read next item
- `VO + Left Arrow` → Read previous item
- `VO + Space` → Activate button
- `VO + U` → Open rotor (headings, links, form fields)

#### TalkBack (Android)

```markdown
## TalkBack Testing Checklist

- [ ] Enable TalkBack: Settings > Accessibility
- [ ] Test touch exploration (tap twice with two fingers)
- [ ] Verify local context menu works (swipe down then right)
- [ ] Check reading order is logical (left-to-right, top-to-bottom)
- [ ] Test custom actions are accessible
```

### User Testing with Disabled Users (Annual)

Conduct annual usability testing with real users:

**Participant recruitment:**
- Partner with accessibility organizations
- Offer honorarium ($50-100 per 1-hour session)
- Test with at least 3 users per disability category

**Test categories:**
- Blind (NVDA, VoiceOver)
- Low vision (high contrast, zoom)
- Motor disability (keyboard-only, single-switch)
- Deaf (captions, transcripts)
- Cognitive disability (clarity, progressive disclosure)

**Test script (1 hour):**
1. Brief intro and consent (5 min)
2. Warm-up task (find object via search) (5 min)
3. Core tasks (rotate view, select objects, read info) (30 min)
4. Advanced features (time controls, filters) (10 min)
5. Feedback & preferences (10 min)

### Accessibility Audit Checklist

**Pre-release checklist (for each feature):**

- [ ] **WCAG Compliance**
  - [ ] Color contrast verified (4.5:1 text, 3:1 UI)
  - [ ] Keyboard navigation complete
  - [ ] ARIA labels present and correct
  - [ ] Focus visible and in logical order

- [ ] **Screen Reader**
  - [ ] NVDA: No errors, logical reading order
  - [ ] VoiceOver: All controls announced
  - [ ] Live regions work correctly
  - [ ] Alt text/descriptions meaningful

- [ ] **Motor Accessibility**
  - [ ] All actions via keyboard only
  - [ ] Click targets ≥44×44px
  - [ ] No time-dependent interactions
  - [ ] Camera sensitivity adjustable

- [ ] **Cognitive**
  - [ ] Clear, consistent labels
  - [ ] Progressive disclosure used
  - [ ] Undo available
  - [ ] Error messages helpful

- [ ] **Reduced Motion**
  - [ ] Respects `prefers-reduced-motion`
  - [ ] Animations can be disabled
  - [ ] Static alternatives provided

- [ ] **i18n/L10n**
  - [ ] All strings in locale files
  - [ ] RTL tested (if Arabic/Hebrew)
  - [ ] Numbers/dates formatted per locale
  - [ ] Fallback chain works

- [ ] **Testing**
  - [ ] axe-core: 0 violations
  - [ ] Lighthouse: ≥90/100
  - [ ] Manual SR testing passed
  - [ ] No hardcoded strings

---

## Legal Framework

### ADA (Americans with Disabilities Act)

**Scope:** U.S. federal law; applies to all web-based services accessible to Americans

**Requirements:**
- Equal access to digital services
- Reasonable accommodations
- No discrimination based on disability

**Cosmos Explorer compliance:**
- Meets WCAG 2.1 AA (DOJ recommended standard)
- Provides alternative input methods (keyboard, voice)
- Supplies alt text and descriptions
- Maintains accessibility in updates

**Enforcement:**
- DOJ can investigate complaints
- Private lawsuits possible (ADA Title III)
- No statutory damages, but injunctive relief + attorney fees

### Section 508 (U.S. Federal Requirement)

**Scope:** U.S. federal agencies must provide accessible IT/web services

**Requirements:**
- Conforms to Revised Section 508 Standards (WCAG 2.0 AA + technical details)
- Applies to content, functionality, and support

**Cosmos Explorer:** Intended for public use; not directly subject, but following best practices prepares for government adoption.

### EN 301 549 (EU Standard)

**Scope:** European standardization; used for public procurement and compliance

**Requirements:**
- Functional accessibility requirements
- Technical specifications (based on WCAG 2.1 AA + AA+ extensions)
- Includes mobile, documents, support

**Cosmos Explorer compliance:**
- WCAG 2.1 AA compliance exceeds EN 301 549 baseline
- Mobile accessible
- Documentation provided in multiple formats

### AODA (Canada)

**Scope:** Ontario Accessibility for Ontarians with Disabilities Act; expanding across Canada

**Requirements:**
- Accessible websites (WCAG 2.1 AA as of 2025)
- Feedback mechanism for accessibility issues
- Accessibility statement on website

**Cosmos Explorer compliance:**
- Meets WCAG 2.1 AA
- Accessibility feedback form on website
- Annual self-assessment report

### Accessibility Statement (Public-Facing)

```markdown
# Accessibility Statement

## Commitment

Cosmos Explorer is committed to ensuring digital accessibility for people with disabilities. We continually improve user experience for all and apply relevant accessibility standards.

## Conformance Status

Cosmos Explorer conforms to **WCAG 2.1 Level AA** standards and is designed to be accessible to individuals with:
- Visual disabilities (blindness, low vision, color blindness)
- Hearing disabilities (deafness, hard of hearing)
- Motor disabilities (limited mobility, inability to use a mouse)
- Cognitive disabilities (dyslexia, ADHD, autism)

## Features

- Keyboard navigation with full functionality
- Screen reader compatibility (NVDA, VoiceOver, TalkBack)
- High contrast and color-blind friendly color schemes
- Adjustable text size and motion preferences
- Voice command support
- Multi-language support (10+ languages)

## Known Limitations

The 3D WebGL viewer requires JavaScript. A 2D alternative view is available for users who cannot use JavaScript.

## Feedback

We welcome feedback on accessibility. Please contact:
- **Email:** accessibility@cosmosexplorer.com
- **Form:** [Accessibility Feedback Form]
- **Phone:** +1-XXX-XXX-XXXX (TTY available)

We aim to respond within 5 business days.

## Third-Party Compliance

This statement was verified by an independent accessibility audit (date) and meets legal requirements under:
- Americans with Disabilities Act (ADA)
- Section 508
- EN 301 549 (EU)
- AODA (Canada)

**Last Updated:** 2026-04-16
**Audit Date:** [Date of last compliance audit]
```

---

## Summary & Recommendations

### Key Principles

1. **Accessibility first:** Built into every feature from the start
2. **Inclusive design:** Serve all users, not just after-the-fact fixes
3. **Testing:** Automated + manual + user feedback
4. **Continuous improvement:** Annual audits, user feedback loops

### Recommended Tooling

| Tool | Purpose | License |
|:-----|:--------|:--------|
| i18next | i18n framework | Open source |
| axe-core | Automated testing | Open source |
| axe DevTools | Browser testing | Free + Premium |
| Lighthouse | Audit & CI | Open source |
| NVDA | Screen reader testing | Free |
| WebAIM Contrast Checker | Color testing | Free |
| Crowdin | Translation management | Freemium |
| Pa11y | Automated testing CI | Open source |

### Timeline

- **Phase 1 (Launch):** WCAG 2.1 AA compliance + manual testing
- **Phase 2 (3 months):** i18n framework + Tier 1 languages
- **Phase 3 (6 months):** Tier 2 languages + annual audit
- **Ongoing:** User feedback, continuous improvement, accessibility updates

### Success Metrics

- **Automated:** 0 axe violations, ≥90 Lighthouse score
- **Manual:** 100% NVDA/VoiceOver functionality
- **User:** ≥90% satisfaction in accessibility survey
- **Compliance:** No legal complaints, pass annual audit

---

**Document Version:** 1.0  
**Status:** Published  
**Date:** 2026-04-16  
**Maintained by:** Accessibility & Internationalization Team
