# Cosmos Explorer — User Journey Screen Designs

**Project:** Cosmos Explorer - Interactive 3D Web-Based Universe Visualization  
**Version:** 2.1  
**Last Updated:** 2026-04-19  
**Design System:** AETHER V4 — Retro-Futuristic Terminal (see Doc 24)

---

> **⚠ AETHER V4 VISUAL DIRECTION NOTICE**
>
> The approved visual direction is **AETHER V4 — Retro-Futuristic Terminal**, specified in
> **[Doc 24 — UI/UX Design Brief](./24-ui-ux-design-brief.md)**.
>
> The ASCII wireframes and interaction flows below remain structurally valid. When implementing,
> apply the AETHER V4 visual tokens from Doc 24 §3.1–3.3 and Doc 24 §12 (Global Components)
> instead of the original tokens listed in the Design System Reference below.
>
> Screens in this document map to Doc 24 sections as follows:
> Journey 1 (First-Time Discovery) → Doc 24 §6, Journey 2 (Classroom) → Doc 24 §7,
> Journey 3 (Content Creation) → Doc 24 §8, Journey 4 (Casual) → Doc 24 §9,
> Journey 5 (Observation) → Doc 24 §10, Journey 6 (Research) → Doc 24 §11.
>
> Where Doc 24 provides a screen design for the same screen, **Doc 24 takes precedence** for
> visual styling. This document remains authoritative for interaction logic, state transitions,
> and edge case behaviors not covered in Doc 24.

## Design System Reference (Original Pre-AETHER Tokens — see Doc 24 §3 for current tokens)

### Color Palette (→ AETHER V4 mapping)
- **Deep Space Black:** #0a0a1a → `--bg-void` #0a0a0f
- **Cosmic Blue:** #2563eb → `--accent-pink` #ff6b9d
- **Nebula Purple:** #8b5cf6 → `--accent-purple` #c084fc
- **Supernova Gold:** #f59e0b → `--accent-amber` #fbbf24
- **Aurora Green:** #10b981 → `--accent-green` #4ade80
- **Panel Background:** rgba(15,23,42,0.85) → `--bg-surface` #0d0d14 + scanline overlay
- ~~**Backdrop Filter:** blur(8px)~~ → Terminal panel chrome (1px solid `--border-default`)

### Typography (→ AETHER V4 mapping)
- ~~**UI Font:** Inter~~ → **Space Mono** (400, 700)
- ~~**Data/Code Font:** JetBrains Mono~~ → **IBM Plex Mono** (400, 600)
- **Display Font (new):** Press Start 2P (400) — H1-H3 headings
- **Heading Sizes:** H1: 20px, H2: 14px, H3: 11px (Press Start 2P), Body: 13px (Space Mono), Small: 11px, Data: 13px (IBM Plex Mono)

### Spacing & Grid (unchanged)
- **Base Unit:** 4px
- **Common Spacing:** 8px, 12px, 16px, 24px, 32px, 48px
- ~~**Border Radius:** 4px (tight), 8px (default), 12px (large), 24px (full)~~ → **2px max** (terminal aesthetic)

### Interactive States (→ AETHER V4 mapping)
All buttons follow these states: Default → Hover (phosphor glow intensifies, border brightens to `--border-active`) → Active (glow pulses, 1px inset) → Disabled (50% opacity, no glow, no cursor). CRT text-shadow effect on hover for text buttons.

---

# JOURNEY 1: First-Time Discovery (Space Enthusiast)

## Screen 1.1: Landing Page

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ NAVBAR (height: 64px, bg: rgba(10,10,26,0.9), backdrop-blur(8px))  │  │
│  │                                                                      │  │
│  │  [≡] Cosmos        Search [___________]    About  Docs  [Moon Icon] │  │
│  │  Logo/Menu                                                           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ HERO SECTION (min-height: 600px, bg: animated starfield)           │  │
│  │                                                                      │  │
│  │                                                                      │  │
│  │                  ✦ ★ ✧ THE UNIVERSE AT YOUR ✦ ★ ✧               │  │
│  │                         FINGERTIPS                                   │  │
│  │                                                                      │  │
│  │              Explore galaxies, nebulae, and stars in                │  │
│  │           stunning 3D. No account needed. Start free.               │  │
│  │                                                                      │  │
│  │                   ┌────────────────────────────┐                    │  │
│  │                   │  LAUNCH EXPLORER  →        │                    │  │
│  │                   │ (Cosmic Blue, 48px tall)   │                    │  │
│  │                   └────────────────────────────┘                    │  │
│  │                   (Glow effect on hover, cursor changes to hand)     │  │
│  │                                                                      │  │
│  │              ★ No account needed    ★ Free forever                  │  │
│  │              ★ 100,000+ stars       ★ Real NASA data                │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ FEATURES SECTION (bg: #0a0a1a, padding: 48px)                      │  │
│  │                                                                      │  │
│  │  EXPLORE                    LEARN                    CREATE           │  │
│  │  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐ │  │
│  │  │ [🔭 icon]       │   │ [📚 icon]        │   │ [🎥 icon]        │ │  │
│  │  │ Rotate, zoom,   │   │ Real NASA data   │   │ Export views,    │ │  │
│  │  │ and search for  │   │ About celestial  │   │ create videos,   │ │  │
│  │  │ any celestial   │   │ objects across   │   │ and share your   │ │  │
│  │  │ object.         │   │ time and space.  │   │ discoveries.     │ │  │
│  │  └──────────────────┘   └──────────────────┘   └──────────────────┘ │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ DEVICE COMPATIBILITY (padding: 24px, text-align: center)            │  │
│  │                                                                      │  │
│  │  Works on Desktop, Tablet, and Mobile                               │  │
│  │  Chrome 90+ | Firefox 88+ | Safari 14+ | Edge 90+                   │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ FOOTER (bg: rgba(10,10,26,0.95), padding: 32px)                    │  │
│  │                                                                      │  │
│  │  About | Privacy | Terms | GitHub | Twitter    © 2026 Cosmos       │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Hero Background:** Animated starfield with parallax effect (slower at bottom on scroll)
- **Primary CTA Button:** 
  - Width: 200px, Height: 48px
  - Background: linear-gradient(135deg, #2563eb, #1d4ed8)
  - Border: 1px solid rgba(37, 99, 235, 0.5)
  - Hover: box-shadow: 0 0 24px rgba(37, 99, 235, 0.6), scale(1.02)
  - Active: box-shadow inset, translate(0, 2px)
  - Font: Inter 600, 16px, color: white
  - Border-radius: 8px
  - Transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)

- **Feature Cards (3 cards):**
  - Width: calc(33.333% - 16px) on desktop, 100% on mobile
  - Height: auto (min 200px)
  - Background: rgba(15, 23, 42, 0.7)
  - Border: 1px solid rgba(37, 99, 235, 0.2)
  - Padding: 24px
  - Gap between cards: 24px
  - Border-radius: 12px
  - Icon size: 48px
  - Font: Inter 500, 14px, color: #d1d5db
  - Hover: border-color becomes rgba(37, 99, 235, 0.5), background becomes rgba(15, 23, 42, 0.9)

- **Responsive:**
  - Desktop (1024px+): 3-column layout
  - Tablet (768px-1023px): 2-column layout, cards 48% width each
  - Mobile (<768px): 1-column, cards 100% width

---

## Screen 1.2: Loading State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                       bg: #0a0a1a (full screen)                           │
│                                                                             │
│                                                                             │
│                            ◐ ◑ ◒ ◓                                        │
│                       (Rotating spinner)                                    │
│                                                                             │
│                   Initializing engine...                                   │
│                                                                             │
│            ██████████░░░░░░░░░░░░░░░░░░░░░░ 35%                         │
│                                                                             │
│          Estimated time: 3 seconds                                         │
│                                                                             │
│               ┌──────────────────────┐                                     │
│               │    ← Back or Cancel   │                                     │
│               │ (subtle, text-only)   │                                     │
│               └──────────────────────┘                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Screen:**
  - Full viewport (100vw × 100vh)
  - Background: #0a0a1a
  - Display: flex, align-items: center, justify-content: center, flex-direction: column
  - Z-index: 9999

- **Spinner:**
  - Size: 64px × 64px
  - Color: #2563eb
  - Stroke-width: 3px
  - Animation: rotation 2s linear infinite
  - Margin-bottom: 32px

- **Status Text:**
  - Font: Inter 500, 14px
  - Color: #9ca3af
  - Margin-bottom: 24px
  - Min-height: 20px (prevents layout shift)

- **Progress Bar:**
  - Width: 200px, Height: 4px
  - Background: rgba(37, 99, 235, 0.2)
  - Fill: linear-gradient(90deg, #2563eb, #8b5cf6)
  - Border-radius: 2px
  - Margin-bottom: 12px
  - Animation: width changes smoothly as progress updates

- **Estimated Time:**
  - Font: Inter 400, 12px
  - Color: #6b7280
  - Margin-bottom: 32px

- **Back Button:**
  - Font: Inter 500, 12px
  - Color: #6b7280
  - Hover: color #9ca3af, text-decoration: underline
  - Cursor: pointer
  - No background/border
  - Padding: 8px 0

- **Progress Milestones** (sequentially displayed):
  1. "Initializing engine..." (0-15%)
  2. "Loading 100,000 stars..." (15-50%)
  3. "Rendering solar system..." (50-85%)
  4. "Ready!" (85-100%, then fade to next screen)

---

## Screen 1.3: First View — Solar System Default

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ TOP NAV (height: 56px, bg: rgba(15,23,42,0.9), backdrop-blur(8px)) │  │
│  │                                                                      │  │
│  │  [≡] Cosmos    [🔍 Search _______________]  [⚙ Settings] [?Help]  │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                        │ │
│  │                     3D VIEWPORT (main canvas)                         │ │
│  │                                                                        │ │
│  │                         ☀ (Sun, large)                               │ │
│  │                    ● ● ● ● ● ● ● ● ●                              │ │
│  │                  (8 planets with orbital paths)                       │ │
│  │                                                                        │ │
│  │          ┌─────────────────────────────────────────────┐             │ │
│  │          │ Drag to rotate. Scroll to zoom.            │             │ │
│  │          │ Click any object for details.              │             │ │
│  │          │ [Dismiss ✕]                                │             │ │
│  │          │ (Onboarding tooltip, top-left, 300px wide) │             │ │
│  │          └─────────────────────────────────────────────┘             │ │
│  │                                                                        │ │
│  │  ┌──────────────────────┐            ┌──────────────────────┐       │ │
│  │  │ 🎯 START TOUR        │            │ ⏱ TIME CONTROLS     │       │ │
│  │  │ (top-left corner,    │            │ (top-right corner)  │       │ │
│  │  │  40px, pulse anim)   │            │ (collapsible panel)  │       │ │
│  │  └──────────────────────┘            └──────────────────────┘       │ │
│  │                                                                        │ │
│  │                            (Bottom-left corner)                       │ │
│  │  ┌──────────────────────────────────────────────────┐               │ │
│  │  │ Observable Universe > Solar System > Earth Orbit │               │ │
│  │  │ (Breadcrumb navigation, font-size: 12px)        │               │ │
│  │  └──────────────────────────────────────────────────┘               │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ RIGHT PANEL (optional, width: 300px, hidden initially)              │  │
│  │ Slides in on object selection                                        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Top Navigation:**
  - Height: 56px
  - Background: rgba(15, 23, 42, 0.9)
  - Backdrop-filter: blur(8px)
  - Padding: 0 24px
  - Display: flex, align-items: center, justify-content: space-between
  - Z-index: 100

  - **Logo/Menu Button:**
    - Width: 40px, Height: 40px
    - Icon size: 24px
    - Hover: background rgba(37, 99, 235, 0.1)
    - Cursor: pointer
    - Border-radius: 6px

  - **Search Bar:**
    - Width: 280px, Height: 36px
    - Background: rgba(37, 99, 235, 0.1)
    - Border: 1px solid rgba(37, 99, 235, 0.2)
    - Padding: 0 12px
    - Font: Inter 400, 14px
    - Color: #9ca3af
    - Placeholder: "Search objects..."
    - Border-radius: 6px
    - Focus: border-color #2563eb, box-shadow 0 0 12px rgba(37, 99, 235, 0.3)

  - **Right Controls (Settings, Help):**
    - Gap: 12px
    - Each 40px × 40px, same hover/style as menu

- **Main Viewport:**
  - Flex: 1 (takes remaining space)
  - Background: radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a1a 100%)
  - Overflow: hidden
  - Position: relative

- **3D Scene (Threejs/Babylon.js Canvas):**
  - Full viewport size
  - Camera: positioned at distance 15 AU from Sun, looking at system
  - Planets rendered as 3D spheres with textures
  - Orbital lines visible, semi-transparent
  - Sun: self-luminous glow

- **Onboarding Tooltip:**
  - Position: absolute, top: 80px, left: 24px
  - Width: 300px
  - Background: rgba(15, 23, 42, 0.95)
  - Border: 1px solid rgba(37, 99, 235, 0.3)
  - Padding: 16px
  - Border-radius: 8px
  - Font: Inter 400, 13px
  - Color: #d1d5db
  - Z-index: 200
  - Animation: fade-in 400ms, fade-out 400ms
  - Arrow pointer: pointing to center of viewport
  - Close button (X): top-right corner, 20px × 20px

- **Tour Button:**
  - Position: absolute, top: 80px, left: 24px (or adjust if tooltip visible)
  - Width: 160px, Height: 40px
  - Background: rgba(139, 92, 246, 0.2)
  - Border: 1px solid #8b5cf6
  - Font: Inter 500, 13px, color: #a78bfa
  - Border-radius: 6px
  - Icon (🎯): 18px, margin-right: 8px
  - Hover: background rgba(139, 92, 246, 0.3), box-shadow: 0 0 16px rgba(139, 92, 246, 0.4)
  - Pulse animation: scale oscillates 1.0 → 1.05 over 2s, infinite
  - Cursor: pointer

- **Time Controls Panel (initially collapsed):**
  - Position: absolute, top: 80px, right: 24px
  - Width: 240px (expanded)
  - Background: rgba(15, 23, 42, 0.9)
  - Border: 1px solid rgba(37, 99, 235, 0.2)
  - Padding: 12px
  - Border-radius: 8px
  - Z-index: 150
  - Collapsed view: just a clock icon (32px × 32px button)
  - Expand animation: 300ms ease-out

- **Breadcrumb Navigation:**
  - Position: absolute, bottom: 24px, left: 24px
  - Font: Inter 400, 12px
  - Color: #6b7280
  - Format: "Observable Universe > Milky Way > Solar System"
  - Links underline on hover
  - Cursor: pointer on links

- **Right Info Panel (initially hidden):**
  - Position: fixed, right: 0, top: 56px
  - Width: 320px
  - Height: calc(100vh - 56px)
  - Background: rgba(15, 23, 42, 0.95)
  - Border-left: 1px solid rgba(37, 99, 235, 0.2)
  - Backdrop-filter: blur(8px)
  - Z-index: 120
  - Slide-in animation: transform translateX(320px) → translateX(0), 300ms ease-out
  - Will show on object selection (see Screen 1.6)

---

## Screen 1.4: Onboarding Tooltip Sequence

**Tooltip 1: "Drag to Rotate"**
```
Position: canvas center
Arrow: pointing down
Content: "Drag to rotate the view"
Timeout: Shows after 800ms, auto-dismisses after 5s or on first drag
```

**Tooltip 2: "Scroll to Zoom"**
```
Trigger: After first drag detected
Position: canvas center
Arrow: pointing down
Content: "Scroll up/down to zoom in and out"
Timeout: Auto-dismisses after 5s or on first scroll
```

**Tooltip 3: "Click for Details"**
```
Trigger: After first zoom detected
Position: above nearest planet
Arrow: pointing to planet
Content: "Click any object to see details"
Timeout: Auto-dismisses after 5s or on first click
```

**Tooltip 4: "Try Search"**
```
Trigger: After first object click
Position: pointing to search bar
Arrow: pointing up to search input
Content: "Use search to find any celestial object"
Timeout: Auto-dismisses after 5s or on search focus
```

**Specifications for all tooltips:**
- **Background:** rgba(15, 23, 42, 0.98)
- **Border:** 1px solid rgba(37, 99, 235, 0.4)
- **Padding:** 12px 16px
- **Border-radius:** 6px
- **Font:** Inter 400, 13px, color: #d1d5db
- **Max-width:** 240px
- **Box-shadow:** 0 8px 24px rgba(0, 0, 0, 0.4)
- **Z-index:** 300
- **Arrow:** 8px triangle, color matches border
- **Close button (✕):** top-right, 20px × 20px, hover color: #9ca3af
- **Animation in:** opacity 0 → 1, scale 0.95 → 1.0, 300ms ease-out
- **Animation out:** opacity 1 → 0, scale 1.0 → 0.95, 300ms ease-in

**Interaction Tracking:**
- Tooltip 1 dismisses automatically when: user drags canvas OR 5s elapsed
- Tooltip 2 shows only after Tooltip 1 dismissed AND drag detected
- Tooltip 3 shows only after Tooltip 2 dismissed AND zoom detected
- Tooltip 4 shows only after Tooltip 3 dismissed AND object click detected
- Each tooltip can be manually dismissed with X button (immediate removal)
- On mobile: Tooltips appear larger, positioned to avoid screen edges

---

## Screen 1.5: Object Hover State

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                         3D VIEWPORT                                        │
│                                                                             │
│                           ☀ (Sun)                                          │
│                                                                             │
│                    ●₁ ●₂ ●₃ ●₄ ●₅ ●₆ ●₇ ●₈                          │
│              (Mercury hovered - details appear above)                       │
│                                                                             │
│                    ┌───────────────┐                                       │
│                    │ MERCURY       │                                       │
│                    │ ⟡ Terrestrial │ (badge, 8px padding)                 │
│                    │ Planet        │                                       │
│                    └───────────────┘                                       │
│                    (outlines glowing, text label above)                     │
│                                                                             │
│                    ●₁ (with glow) ●₂ ●₃ ...                             │
│                    (Object has cyan/purple glow, 4px blur)                 │
│                                                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Cursor Change:** 
  - Default cursor: grab
  - Over clickable object: pointer
  - While dragging: grabbing

- **Label Popup:**
  - Position: absolute, follows object on screen
  - Offset: 12px above object center
  - Width: auto (min 120px)
  - Background: rgba(15, 23, 42, 0.95)
  - Border: 1px solid rgba(37, 99, 235, 0.5)
  - Padding: 6px 12px
  - Border-radius: 4px
  - Font: Inter 500, 12px
  - Color: #e5e7eb
  - Z-index: 180
  - Animation in: opacity 0 → 1, translateY(4px) → translateY(0), 200ms ease-out
  - Animation out: opacity 1 → 0, 150ms ease-in

- **Object Glow:**
  - Applied to 3D object in render pipeline
  - Color: rgba(37, 99, 235, 0.6)
  - Glow radius: 4px
  - Animation: opacity pulses 0.6 → 1.0 over 1.5s, smooth

- **Type Badge:**
  - Background: rgba(139, 92, 246, 0.3)
  - Border: 1px solid #8b5cf6
  - Padding: 2px 8px
  - Font: Inter 500, 10px, color: #a78bfa
  - Border-radius: 3px
  - Margin: 4px 0

- **Raycast Detection:**
  - Cone distance from camera: 10000 units
  - Any hovered object registers on mouse move
  - Label updates position 60fps (requestAnimationFrame)

---

## Screen 1.6: Object Selection & Info Panel

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────────────────────────────────────┐  ┌──────────────────────┐  │
│  │ 3D VIEWPORT                              │  │ INFO PANEL (300px)   │  │
│  │ (main canvas, now 75% width)             │  │ bg: rgba(15,23,...)  │  │
│  │                                          │  │                      │  │
│  │                ☀ (Sun)                   │  │ ┌──────────────────┐ │  │
│  │                                          │  │ │ MERCURY    ★ ✕    │ │  │
│  │         ●₁(selected) ●₂ ●₃ ...         │  │ ├──────────────────┤ │  │
│  │                                          │  │ │ ⟡ Terrestrial    │ │  │
│  │                                          │  │ │   Planet         │ │  │
│  │                                          │  │ ├──────────────────┤ │  │
│  │    (Mercury has thick highlight)         │  │ │ PROPERTIES       │ │  │
│  │                                          │  │ │ ────────────     │ │  │
│  │                                          │  │ │ Distance: 57.9M  │ │  │
│  │                                          │  │ │ km from Sun      │ │  │
│  │                                          │  │ │                  │ │  │
│  │                                          │  │ │ Diameter:        │ │  │
│  │                                          │  │ │ 4,879 km         │ │  │
│  │                                          │  │ │                  │ │  │
│  │                                          │  │ │ Mass: 3.285×10²³ │ │  │
│  │                                          │  │ │ kg               │ │  │
│  │                                          │  │ │                  │ │  │
│  │                                          │  │ │ Temp (Day):      │ │  │
│  │                                          │  │ │ 430°C            │ │  │
│  │                                          │  │ │                  │ │  │
│  │                                          │  │ │ Orbital Period:  │ │  │
│  │                                          │  │ │ 87.97 days       │ │  │
│  │                                          │  │ ├──────────────────┤ │  │
│  │                                          │  │ │ ▼ MORE INFO      │ │  │
│  │                                          │  │ │                  │ │  │
│  │                                          │  │ │ Fun fact: Mercury │ │  │
│  │                                          │  │ │ is the fastest   │ │  │
│  │                                          │  │ │ planet...        │ │  │
│  │                                          │  │ ├──────────────────┤ │  │
│  │                                          │  │ │ [Navigate To]    │ │  │
│  │                                          │  │ │ [Compare]        │ │  │
│  │                                          │  │ │ [Share]          │ │  │
│  │                                          │  │ └──────────────────┘ │  │
│  │                                          │  │                      │  │
│  └──────────────────────────────────────────┘  └──────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Panel Container:**
  - Position: fixed, right: 0, top: 56px
  - Width: 320px
  - Height: calc(100vh - 56px)
  - Background: rgba(15, 23, 42, 0.95)
  - Border-left: 1px solid rgba(37, 99, 235, 0.2)
  - Backdrop-filter: blur(8px)
  - Padding: 20px
  - Overflow-y: auto
  - Z-index: 120
  - Slide-in animation: translateX(320px) → translateX(0), 300ms cubic-bezier(0.34, 1.56, 0.64, 1)

- **Header:**
  - Display: flex, align-items: center, justify-content: space-between
  - Margin-bottom: 16px

  - **Title:**
    - Font: Inter 600, 20px
    - Color: #f3f4f6
    - Flex: 1

  - **Bookmark Button (★):**
    - Width: 32px, Height: 32px
    - Background: transparent
    - Border: 1px solid rgba(245, 158, 11, 0.3)
    - Color: #fbbf24
    - Font-size: 16px
    - Border-radius: 4px
    - Hover: background rgba(245, 158, 11, 0.1), border-color rgba(245, 158, 11, 0.6)
    - Click: fills in solid (bookmarked state)
    - Cursor: pointer

  - **Close Button (✕):**
    - Width: 32px, Height: 32px
    - Background: transparent
    - Color: #6b7280
    - Font-size: 18px
    - Hover: color #9ca3af
    - Cursor: pointer

- **Type Badge:**
  - Background: rgba(37, 99, 235, 0.15)
  - Border: 1px solid rgba(37, 99, 235, 0.3)
  - Padding: 4px 10px
  - Font: Inter 500, 11px, color: #60a5fa
  - Border-radius: 4px
  - Margin-bottom: 16px
  - Icon: 14px, margin-right: 6px

- **Properties Section:**
  - Font: Inter 400, 13px
  - Color: #d1d5db
  - Margin-bottom: 16px

  - **Property Row:**
    - Display: flex, justify-content: space-between
    - Padding: 8px 0
    - Border-bottom: 1px solid rgba(37, 99, 235, 0.1)
    - Last row: no border

    - **Label:** color #9ca3af, font-weight 500
    - **Value:** color #e5e7eb, font family JetBrains Mono

- **More Info Section:**
  - Margin-bottom: 16px
  - Expandable via click on "▼ MORE INFO"

  - **Toggle Button:**
    - Background: transparent
    - Border: 1px solid rgba(37, 99, 235, 0.2)
    - Padding: 8px 12px
    - Font: Inter 500, 12px, color: #9ca3af
    - Width: 100%
    - Text-align: left
    - Cursor: pointer
    - Hover: border-color rgba(37, 99, 235, 0.4), background rgba(37, 99, 235, 0.05)
    - Icon rotates 180° on expand

  - **Expandable Content:**
    - Max-height: 0 (collapsed) → auto (expanded)
    - Overflow: hidden
    - Transition: max-height 300ms ease-out
    - Padding-top: 12px
    - Border-top: 1px solid rgba(37, 99, 235, 0.1)
    - Font: Inter 400, 13px, color: #d1d5db
    - Line-height: 1.6

- **Action Buttons:**
  - Display: grid, grid-template-columns: 1fr
  - Gap: 8px
  - Margin-top: 16px

  - **Button (Navigate To, Compare, Share):**
    - Height: 40px
    - Background: rgba(37, 99, 235, 0.15)
    - Border: 1px solid rgba(37, 99, 235, 0.3)
    - Color: #60a5fa
    - Font: Inter 500, 13px
    - Border-radius: 6px
    - Cursor: pointer
    - Hover: background rgba(37, 99, 235, 0.25), border-color rgba(37, 99, 235, 0.6)
    - Active: background rgba(37, 99, 235, 0.35), transform translateY(1px)
    - Transition: all 200ms ease-out

- **Scrollbar:**
  - Width: 6px
  - Background: transparent
  - Track: rgba(37, 99, 235, 0.1)
  - Thumb: rgba(37, 99, 235, 0.4)
  - Thumb hover: rgba(37, 99, 235, 0.6)
  - Border-radius: 3px

---

## Screen 1.7: Zoomed Out — Milky Way View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ TOP NAV (same as 1.3)                                               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                        │ │
│  │                   3D VIEWPORT (Galaxy view)                           │ │
│  │                                                                        │ │
│  │                  (Spiral galaxy rendered from top)                    │ │
│  │                  (Milky Way arms labeled)                            │ │
│  │                                                                        │ │
│  │              ORION-CYGNUS ARM                                         │ │
│  │          SAGITTARIUS ARM      ★ (yellow dot)                        │ │
│  │                        "You are here"                                │ │
│  │          PERSEUS ARM                                                 │ │
│  │                                                                        │ │
│  │    ┌──────────────────────────────────────────────────┐             │ │
│  │    │ INFO PANEL - MILKY WAY                           │             │ │
│  │    │ ──────────────────────────                      │             │ │
│  │    │ Type: Spiral Galaxy                             │             │ │
│  │    │ Diameter: ~100,000 light-years                  │             │ │
│  │    │ Stars: ~100-400 billion                         │             │ │
│  │    │ Age: ~13.6 billion years                        │             │ │
│  │    │                                                  │             │ │
│  │    │ Our solar system orbits ~26,000 light-years     │             │ │
│  │    │ from the galactic center...                     │             │ │
│  │    │ [More Info ▼]                                   │             │ │
│  │    ├──────────────────────────────────────────────────┤             │ │
│  │    │ [Zoom to Center]    [Explore Further]           │             │ │
│  │    └──────────────────────────────────────────────────┘             │ │
│  │                                                                        │ │
│  │                  (Bottom-left)                                       │ │
│  │  ┌──────────────────────────────────────────────────┐               │ │
│  │  │ Observable Universe > Milky Way                  │               │ │
│  │  │ Scale: 1 ly (light-year) = 10px at this zoom    │               │ │
│  │  └──────────────────────────────────────────────────┘               │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **3D Galaxy Rendering:**
  - Camera: positioned above galaxy plane, looking down
  - Galaxy rendered as particle system: 10,000+ stars (density increases toward core)
  - Spiral arms: 4 main arms with varying colors (subtle nebula textures)
  - Central bulge: slightly brighter, denser
  - Disk thickness: visible but thin relative to diameter
  - Galaxy rotation: slow continuous rotation (1 revolution per 30s)

- **Labels on Galaxy:**
  - Font: Inter 600, 14px
  - Color: #a78bfa
  - Positioned on spiral arms, centered
  - Semi-transparent background: rgba(15, 23, 42, 0.8)
  - Padding: 4px 8px
  - Border-radius: 3px
  - Positioned outside galaxy to avoid overlap

- **"You Are Here" Marker:**
  - Position: 26,000 light-years from galactic center, on Orion-Cygnus arm
  - Visual: yellow star ★ with animated pulse glow
  - Label: "You are here" appears on hover
  - Font: Inter 500, 11px, color: #fbbf24

- **Scale Indicator:**
  - Position: bottom-left corner, in viewport coordinates
  - Format: "Scale: 1 light-year = Xpx"
  - Updates dynamically as camera zoom changes
  - Font: Inter 400, 12px, color: #6b7280

- **Info Panel (Milky Way focused):**
  - Same structure as Screen 1.6
  - Header: "Milky Way" (H2, 24px)
  - Type badge: "Spiral Galaxy"
  - Properties: Diameter, Star count, Age, Orbital position of Sun
  - Full description: 4-5 sentences about Milky Way
  - Buttons: [Zoom to Center] [Explore Further] [View Other Galaxies]

- **Breadcrumb Update:**
  - Now shows: "Observable Universe > Milky Way"
  - Links remain clickable for navigation

---

## Screen 1.8: Scale Comparison Feature

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ TOP NAV                                                              │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                        │ │
│  │        COMPARISON VIEW - SIDE BY SIDE                               │ │
│  │                                                                        │ │
│  │    ┌──────────────────────┐        ┌──────────────────────┐        │ │
│  │    │  MERCURY (left)      │        │  EARTH (right)       │        │ │
│  │    │  ═════════════════   │        │  ═════════════════   │        │ │
│  │    │                      │        │                      │        │ │
│  │    │      (●) small       │        │     (●●) larger      │        │ │
│  │    │  Diameter: 4,879 km  │        │  Diameter: 12,742 km │        │ │
│  │    │  Mass: 3.285×10²³ kg │        │  Mass: 5.972×10²⁴ kg │        │ │
│  │    │  Temp: 430°C         │        │  Temp: 15°C          │        │ │
│  │    │                      │        │                      │        │ │
│  │    └──────────────────────┘        └──────────────────────┘        │ │
│  │                                                                        │ │
│  │    SIZE VISUALIZATION (nested circles)                              │ │
│  │    ┌─────────────────────────────────────────────┐                 │ │
│  │    │ ┌─────────────────────────────────────────┐ │                 │ │
│  │    │ │ ┌───────────────────────────────────┐   │ │                 │ │
│  │    │ │ │  ┌────────────┐                   │   │ │                 │ │
│  │    │ │ │  │ Mercury    │ Earth (outer)     │   │ │                 │ │
│  │    │ │ │  │ (inner)    │                   │   │ │                 │ │
│  │    │ │ │  └────────────┘                   │   │ │                 │ │
│  │    │ │ └───────────────────────────────────┘   │ │                 │ │
│  │    │ └─────────────────────────────────────────┘ │                 │ │
│  │    └─────────────────────────────────────────────┘                 │ │
│  │                                                                        │ │
│  │    COMPARISON TABLE                                                  │ │
│  │    ┌─────────────────────────────────────────────────────────┐     │ │
│  │    │ Property          │ Mercury      │ Earth           │     │ │
│  │    │ ─────────────────────────────────────────────────────── │     │ │
│  │    │ Diameter          │ 4,879 km     │ 12,742 km (2.6x)│     │ │
│  │    │ Mass              │ 3.285×10²³   │ 5.972×10²⁴      │     │ │
│  │    │                   │ kg           │ kg (18.2x)      │     │ │
│  │    │ Surface Temp      │ 430°C        │ 15°C            │     │ │
│  │    │ Orbital Period    │ 87.97 days   │ 365.25 days     │     │ │
│  │    │ Surface Gravity   │ 3.7 m/s²     │ 9.8 m/s² (2.6x) │     │ │
│  │    └─────────────────────────────────────────────────────────┘     │ │
│  │                                                                        │ │
│  │    [← Previous Comparison]     [Next Comparison →]                  │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Comparison Mode Trigger:**
  - Button "Compare" on info panel (Screen 1.6)
  - Opens comparison modal overlay
  - Allows selecting two objects to compare

- **Comparison Modal:**
  - Position: fixed, center of screen
  - Width: min(90vw, 1000px), max-width: 1200px
  - Height: auto (min 400px, max 90vh)
  - Background: rgba(15, 23, 42, 0.98)
  - Border: 1px solid rgba(37, 99, 235, 0.3)
  - Padding: 32px
  - Border-radius: 12px
  - Z-index: 500
  - Box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6)
  - Backdrop: fixed overlay with rgba(0, 0, 0, 0.5)
  - Animation in: scale 0.95 → 1.0, opacity 0 → 1, 300ms ease-out
  - Close button (✕): top-right corner, 40px × 40px

- **Header:**
  - Font: Inter 600, 24px
  - Color: #f3f4f6
  - Margin-bottom: 24px
  - Text: "Compare [Object 1] and [Object 2]"

- **Side-by-Side Panels:**
  - Display: grid, grid-template-columns: 1fr 1fr
  - Gap: 32px
  - Margin-bottom: 32px

  - **Each Panel:**
    - Background: rgba(37, 99, 235, 0.08)
    - Border: 1px solid rgba(37, 99, 235, 0.2)
    - Padding: 20px
    - Border-radius: 8px

    - **Title:** Inter 600, 18px, color: #e5e7eb
    - **Type Badge:** (see Screen 1.6 specs)
    - **3D Model:** Small rendered preview (150px × 150px, center-aligned)
    - **Property List:** Font Inter 400, 13px, color: #d1d5db
      - Each property: label (400) and value (500, JetBrains Mono)
      - Padding: 8px 0
      - Border-bottom: 1px solid rgba(37, 99, 235, 0.1)

- **Size Visualization (Nested Circles):**
  - Margin-bottom: 24px
  - Container: 200px × 200px, center-aligned
  - Display concentric circles with both objects scaled relative to largest
  - Outer circle: largest object
  - Inner circle: smaller object
  - Circle colors: Cosmic Blue and Nebula Purple with transparency
  - Labels: centered, Font Inter 500, 12px, color: #d1d5db

- **Comparison Table:**
  - Width: 100%
  - Background: transparent
  - Border-collapse: collapse
  - Margin-bottom: 24px

  - **Header Row:**
    - Background: rgba(37, 99, 235, 0.1)
    - Font: Inter 600, 12px, color: #9ca3af
    - Padding: 12px
    - Border-bottom: 2px solid rgba(37, 99, 235, 0.2)

  - **Data Rows:**
    - Padding: 12px
    - Border-bottom: 1px solid rgba(37, 99, 235, 0.1)
    - Font: Inter 400, 13px, color: #d1d5db

    - **First Column (Property Name):**
      - Font-weight: 500
      - Color: #9ca3af
      - Width: 30%

    - **Value Columns:**
      - Font-family: JetBrains Mono
      - Color: #e5e7eb
      - Width: 35% each

    - **Ratio Indicator (on largest values):**
      - Small text in parentheses
      - Color: #6b7280
      - Font-size: 11px
      - Format: "(2.6x larger)" or "(18.2x heavier)"

- **Navigation Buttons:**
  - Display: flex, justify-content: space-between
  - Gap: 16px
  - Margin-top: 24px

  - **Button (Previous/Next):**
    - Width: 200px, Height: 40px
    - Background: rgba(37, 99, 235, 0.2)
    - Border: 1px solid rgba(37, 99, 235, 0.4)
    - Color: #60a5fa
    - Font: Inter 500, 13px
    - Border-radius: 6px
    - Cursor: pointer
    - Hover: background rgba(37, 99, 235, 0.3), border-color rgba(37, 99, 235, 0.6)
    - Disabled: opacity 0.5, cursor not-allowed

---

## Screen 1.9: Time Simulation Controls

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ TIME CONTROL PANEL (expanded, top-right, width: 280px)              │   │
│  │ bg: rgba(15,23,42,0.95), border: 1px solid rgba(37,99,235,0.2)     │   │
│  │                                                                      │   │
│  │ ┌────────────────────────────────────────────────────────────────┐ │   │
│  │ │ ⏱ TIME CONTROLS                                           [✕] │ │   │
│  │ └────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                      │   │
│  │ Current Time: 2026-04-16 14:32:00 (in JetBrains Mono)              │   │
│  │ (updating in real-time)                                             │   │
│  │                                                                      │   │
│  │ ┌──────────────────────────────────────────────────────────────┐   │   │
│  │ │ [| >] [||] [< |]  [↻ Reset to Now]                         │   │   │
│  │ │ Play Pause Reverse                                           │   │   │
│  │ │ (each button 40px × 40px, grouped with 8px gap)            │   │   │
│  │ └──────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │ SPEED: 1x                                                           │   │
│  │ ├─●────────────────────────────────────────────────── ▶ 1M×       │   │
│  │ (Logarithmic slider, 1x to 1,000,000x, handle: 12px, track: 4px)  │   │
│  │                                                                      │   │
│  │ PRESETS:                                                            │   │
│  │ [+1hr] [+1day] [+1mo] [+1yr] [+10yr]                              │   │
│  │ (each 40px tall, fill width, 4px gap)                              │   │
│  │                                                                      │   │
│  │ ┌──────────────────────────────────────────────────────────────┐   │   │
│  │ │ SIMULATION DATA                                              │   │   │
│  │ │ ──────────────────                                           │   │   │
│  │ │ Mercury position: 47.2° orbital                              │   │   │
│  │ │ Venus position: 123.8° orbital                               │   │   │
│  │ │ Earth position: 87.1° orbital                                │   │   │
│  │ │ Mars position: 34.5° orbital                                 │   │   │
│  │ │ (shows current angular position for each planet)             │   │   │
│  │ └──────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Panel Header:**
  - Display: flex, align-items: center, justify-content: space-between
  - Margin-bottom: 16px
  - Padding-bottom: 12px
  - Border-bottom: 1px solid rgba(37, 99, 235, 0.1)

  - **Title:** Inter 600, 14px, color: #e5e7eb
  - **Close Button:** 28px × 28px, background transparent, color: #6b7280

- **Current Time Display:**
  - Font: JetBrains Mono 600, 13px
  - Color: #60a5fa
  - Margin-bottom: 16px
  - Format: "YYYY-MM-DD HH:MM:SS"
  - Updates every 100ms while simulation running

- **Playback Controls:**
  - Display: flex, gap: 8px
  - Margin-bottom: 16px
  - Justify-content: center

  - **Play Button (|>):**
    - Width: 40px, Height: 40px
    - Background: rgba(16, 185, 129, 0.2)
    - Border: 1px solid #10b981
    - Color: #6ee7b7
    - Font-size: 18px
    - Border-radius: 4px
    - Cursor: pointer
    - Hover: background rgba(16, 185, 129, 0.3), box-shadow 0 0 12px rgba(16, 185, 129, 0.4)
    - Active state: background rgba(16, 185, 129, 0.4), pressed down 1px
    - When paused: visible
    - When playing: hidden or shows as "pause" icon (||)

  - **Pause Button (||):**
    - Same specs as Play, but orange (#f59e0b)
    - Visible only when playing
    - Color: #fbbf24

  - **Reverse Button (< |):**
    - Same style as Play/Pause, gray (#9ca3af)
    - Toggleable: when active, time flows backward

  - **Reset Button (↻):**
    - Width: 160px, Height: 40px
    - Background: rgba(37, 99, 235, 0.2)
    - Border: 1px solid rgba(37, 99, 235, 0.4)
    - Color: #60a5fa
    - Font: Inter 500, 12px
    - Border-radius: 4px
    - Cursor: pointer
    - Hover: background rgba(37, 99, 235, 0.3)

- **Speed Label:**
  - Font: Inter 500, 11px
  - Color: #9ca3af
  - Margin-bottom: 4px

- **Speed Slider:**
  - Width: 100%
  - Height: 4px (track)
  - Background: rgba(37, 99, 235, 0.2)
  - Accent (filled): linear-gradient(90deg, #2563eb, #8b5cf6)
  - Handle: width 12px, height 12px, circle, background #2563eb, border 2px solid rgba(37, 99, 235, 0.5)
  - Handle hover: box-shadow 0 0 12px rgba(37, 99, 235, 0.6), scale 1.2
  - Range: 1x to 1,000,000x (logarithmic scale)
  - Step: logarithmic (0.1x increments in log10 space)
  - Margin-bottom: 16px
  - Input type: range

  - **Speed Value Display:**
    - Right-aligned, 40px from slider
    - Font: JetBrains Mono 600, 12px
    - Color: #a78bfa
    - Updates in real-time as slider moves

- **Preset Buttons:**
  - Display: grid, grid-template-columns: 1fr 1fr
  - Gap: 4px
  - Margin-bottom: 16px

  - **Button (each preset):**
    - Height: 32px
    - Background: rgba(37, 99, 235, 0.15)
    - Border: 1px solid rgba(37, 99, 235, 0.2)
    - Color: #60a5fa
    - Font: Inter 500, 11px
    - Border-radius: 4px
    - Cursor: pointer
    - Hover: background rgba(37, 99, 235, 0.25), border-color rgba(37, 99, 235, 0.4)
    - Click: applies time offset and plays simulation
    - Transition: all 200ms ease-out

- **Simulation Data Section:**
  - Background: rgba(37, 99, 235, 0.05)
  - Border: 1px solid rgba(37, 99, 235, 0.15)
  - Padding: 12px
  - Border-radius: 6px
  - Font: Inter 400, 11px
  - Color: #d1d5db

  - **Header:** Inter 500, 12px, color: #9ca3af, margin-bottom: 8px
  - **Data Rows:** Each row shows object and current simulation value
    - Object name: 18% width
    - Value: monospace, right-aligned, 82% width
    - Padding: 4px 0
    - Font: JetBrains Mono 400, 11px, color: #60a5fa

---

## Screen 1.10: Share Dialog

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ SHARE DIALOG (modal, centered, width: 500px)                        │   │
│  │ bg: rgba(15,23,42,0.98), border: 1px solid rgba(37,99,235,0.3)     │   │
│  │                                                                      │   │
│  │ ┌──────────────────────────────────────────────────────────────┐   │   │
│  │ │ SHARE YOUR VIEW                                          [✕] │   │   │
│  │ └──────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │ ┌──────────────────────────────────────────────────────────────┐   │   │
│  │ │ PREVIEW THUMBNAIL (300px × 200px)                           │   │   │
│  │ │ (Screenshot of current 3D view)                              │   │   │
│  │ │                                                              │   │   │
│  │ │  ☀ [Mercury] ●  ●  ●  ●  ●  ●  ●  ●                      │   │   │
│  │ │                                                              │   │   │
│  │ │                                                              │   │   │
│  │ └──────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │ SHAREABLE URL:                                                      │   │
│  │ ┌──────────────────────────────────────────────────────────────┐   │   │
│  │ │ https://cosmos.exp/view?x=-0.45&y=0.12&z=15.2&object=Mercury │   │   │
│  │ │ (read-only, auto-selectable, monospace)                      │   │   │
│  │ │                          [Copy Link ✓]                        │   │   │
│  │ └──────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │ SHARE ON SOCIAL:                                                    │   │
│  │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                     │   │
│  │ │  🐦  │ │  f   │ │  🔗  │ │  💬  │ │ Copy │                     │   │
│  │ │Twitt │ │Face  │ │Linked│ │WApp  │ │Link  │                     │   │
│  │ │  er  │ │ book │ │ In   │ │      │ │      │                     │   │
│  │ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                     │   │
│  │ (each 50px × 50px, hover glow effect)                              │   │
│  │                                                                      │   │
│  │ QR CODE:                                                            │   │
│  │ ┌──────────────────────────────────────────────────────────────┐   │   │
│  │ │          █████████████████████████                           │   │   │
│  │ │          ██░░░░░░░░░░░░░░░░░░░██                           │   │   │
│  │ │          ██░░ QR CODE ░░░░░░░██                           │   │   │
│  │ │          ██░░░░░░░░░░░░░░░░░░░██                           │   │   │
│  │ │          █████████████████████████                           │   │   │
│  │ │                                                              │   │   │
│  │ │ (160px × 160px, centered, with download option)             │   │   │
│  │ └──────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │ ┌──────────────────────────────────────────────────────────────┐   │   │
│  │ │ [📥 Download Screenshot (PNG)]  [↓ Download QR Code]        │   │   │
│  │ └──────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Backdrop: fixed overlay with rgba(0, 0, 0, 0.5)                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Modal Container:**
  - Position: fixed, center of viewport
  - Width: 500px (mobile: 90vw, max 100%)
  - Height: auto
  - Background: rgba(15, 23, 42, 0.98)
  - Border: 1px solid rgba(37, 99, 235, 0.3)
  - Padding: 24px
  - Border-radius: 12px
  - Z-index: 600
  - Box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6)
  - Animation in: scale 0.9 → 1.0, opacity 0 → 1, 300ms ease-out

- **Header:**
  - Display: flex, justify-content: space-between, align-items: center
  - Margin-bottom: 24px
  - Padding-bottom: 16px
  - Border-bottom: 1px solid rgba(37, 99, 235, 0.1)

  - **Title:** Inter 600, 20px, color: #f3f4f6
  - **Close Button:** 32px × 32px, background transparent, color: #6b7280, hover color: #9ca3af

- **Thumbnail Preview:**
  - Width: 100%
  - Height: 200px
  - Background: rgba(37, 99, 235, 0.1)
  - Border: 1px solid rgba(37, 99, 235, 0.2)
  - Border-radius: 8px
  - Margin-bottom: 20px
  - Object-fit: cover
  - Display: flex, align-items: center, justify-content: center
  - Fallback text: "Loading screenshot..."

- **Shareable URL Section:**
  - Margin-bottom: 24px

  - **Label:** Inter 500, 12px, color: #9ca3af, margin-bottom: 8px

  - **URL Input:**
    - Width: 100%
    - Height: 40px
    - Background: rgba(37, 99, 235, 0.1)
    - Border: 1px solid rgba(37, 99, 235, 0.2)
    - Padding: 0 12px
    - Font: JetBrains Mono 400, 12px, color: #60a5fa
    - Border-radius: 6px
    - Display: flex, align-items: center, justify-content: space-between

  - **Copy Button:**
    - Background: transparent (inside input field, right-aligned)
    - Icon: 📋 or ✓
    - Color: #6b7280
    - Hover: color #9ca3af
    - Click: copies URL to clipboard, shows "Copied ✓" feedback for 2s
    - Cursor: pointer
    - Font-size: 14px

- **Social Share Buttons:**
  - Display: flex, gap: 12px, justify-content: center
  - Margin-bottom: 24px
  - Flex-wrap: wrap

  - **Button (each social icon):**
    - Width: 50px, Height: 50px
    - Background: rgba(37, 99, 235, 0.15)
    - Border: 1px solid rgba(37, 99, 235, 0.2)
    - Border-radius: 6px
    - Font-size: 24px
    - Display: flex, align-items: center, justify-content: center
    - Cursor: pointer
    - Hover: background rgba(37, 99, 235, 0.3), transform scale(1.05)
    - Click: opens social share intent URL in new tab
    - Transition: all 200ms ease-out

  - **Social Icons Colors:**
    - Twitter: #1DA1F2
    - Facebook: #1877F2
    - LinkedIn: #0A66C2
    - WhatsApp: #25D366
    - Copy Link: #6b7280 → #9ca3af on hover

- **QR Code Section:**
  - Margin-bottom: 20px
  - Text-align: center

  - **Label:** Inter 500, 12px, color: #9ca3af, margin-bottom: 12px

  - **QR Code Image:**
    - Width: 160px, Height: 160px
    - Background: white
    - Border: 2px solid rgba(37, 99, 235, 0.2)
    - Border-radius: 8px
    - Margin: 0 auto 12px
    - Cursor: pointer
    - Hover: border-color rgba(37, 99, 235, 0.5)

- **Download Buttons:**
  - Display: flex, gap: 12px
  - Justify-content: space-between

  - **Button (Screenshot/QR):**
    - Flex: 1
    - Height: 40px
    - Background: rgba(37, 99, 235, 0.2)
    - Border: 1px solid rgba(37, 99, 235, 0.4)
    - Color: #60a5fa
    - Font: Inter 500, 13px
    - Border-radius: 6px
    - Cursor: pointer
    - Hover: background rgba(37, 99, 235, 0.3), border-color rgba(37, 99, 235, 0.6)
    - Click: triggers file download with appropriate format
    - Icon: 📥 or ↓, margin-right: 6px

---

## Screen 1.11: Search Results

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ TOP NAV with SEARCH ACTIVE                                          │  │
│  │                                                                      │  │
│  │  [≡]   [🔍 Mercury _____________ ✕]    [⚙] [?]                  │  │
│  │                                                                      │  │
│  │  SEARCH RESULTS (dropdown, 320px wide, below search input)         │  │
│  │  bg: rgba(15,23,42,0.98), border: 1px solid rgba(37,99,235,0.3) │  │
│  │                                                                      │  │
│  │  ┌────────────────────────────────────────────────────────────┐   │  │
│  │  │ CELESTIAL OBJECTS (6 results)                              │   │  │
│  │  ├────────────────────────────────────────────────────────────┤   │  │
│  │  │ ☿ Mercury           ⟡ Terrestrial Planet                  │   │  │
│  │  │   Distance: 57.9M km        4,879 km diameter              │   │  │
│  │  │                                                             │   │  │
│  │  │ ★ Mercury (crater)   💫 Impact Crater                      │   │  │
│  │  │   On Moon, named after Roman god                           │   │  │
│  │  │                                                             │   │  │
│  │  │ 🌟 Merope             ⭐ Star (Pleiades cluster)           │   │  │
│  │  │   Apparent Mag: 4.18        Distance: 400 ly               │   │  │
│  │  │                                                             │   │  │
│  │  │ [↓ Load more results]                                       │   │  │
│  │  └────────────────────────────────────────────────────────────┘   │  │
│  │                                                                      │  │
│  │  FILTERS (below search results):                                   │  │
│  │  ┌────────────────────────────────────────────────────────────┐   │  │
│  │  │ Type: [All ▼]  Distance: [All ▼]  Brightness: [All ▼]    │   │  │
│  │  │ (filter chips, 28px tall, apply immediately)              │   │  │
│  │  └────────────────────────────────────────────────────────────┘   │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ 3D VIEWPORT (grayed out slightly while search open)                   │ │
│  │                                                                        │ │
│  │  (main view remains visible but interaction disabled)                 │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Search Input (in Top Nav):**
  - Width: 320px (focus: 400px)
  - Height: 36px
  - Background: rgba(37, 99, 235, 0.1)
  - Border: 1px solid rgba(37, 99, 235, 0.2)
  - Padding: 0 12px 0 36px (icon on left)
  - Font: Inter 400, 14px
  - Color: #d1d5db
  - Placeholder: "Search objects..." (color: #6b7280)
  - Border-radius: 6px
  - Focus: border-color #2563eb, box-shadow 0 0 12px rgba(37, 99, 235, 0.3)
  - Transition: all 200ms ease-out

  - **Search Icon:**
    - Position: absolute, left 10px, top 50%, translateY(-50%)
    - Size: 18px
    - Color: #6b7280
    - Pointer-events: none

  - **Clear Button (✕):**
    - Position: absolute, right 8px
    - Size: 24px × 24px
    - Background: transparent
    - Color: #6b7280
    - Hover: color #9ca3af
    - Cursor: pointer
    - Display: none (shown only when input has text)

- **Search Results Dropdown:**
  - Position: absolute, top: calc(100% + 8px), left: 0
  - Width: 100% (at least 320px, max 500px)
  - Background: rgba(15, 23, 42, 0.98)
  - Border: 1px solid rgba(37, 99, 235, 0.3)
  - Border-radius: 8px
  - Box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4)
  - Padding: 12px 0
  - Max-height: 400px
  - Overflow-y: auto
  - Z-index: 250
  - Animation in: opacity 0 → 1, translateY(-8px) → translateY(0), 200ms ease-out

- **Results Group Header:**
  - Font: Inter 600, 11px, color: #6b7280
  - Padding: 8px 16px
  - Background: rgba(37, 99, 235, 0.05)
  - Border-bottom: 1px solid rgba(37, 99, 235, 0.1)
  - Text-transform: uppercase
  - Letter-spacing: 0.5px

- **Result Item:**
  - Padding: 12px 16px
  - Border-bottom: 1px solid rgba(37, 99, 235, 0.1)
  - Cursor: pointer
  - Hover: background rgba(37, 99, 235, 0.08)
  - Last item: no border-bottom

  - **Title Row:**
    - Display: flex, align-items: center, gap: 8px
    - Margin-bottom: 4px

    - **Icon:** 20px, colored (varies by type)
    - **Name:** Inter 500, 13px, color: #e5e7eb
    - **Type Badge:** Inter 500, 10px, color: #60a5fa, background rgba(37, 99, 235, 0.2), padding: 2px 6px, border-radius: 3px

  - **Description Row:**
    - Font: Inter 400, 12px, color: #9ca3af
    - Line-height: 1.4

- **Load More Button:**
  - Width: calc(100% - 32px)
  - Height: 36px
  - Margin: 8px 16px
  - Background: rgba(37, 99, 235, 0.15)
  - Border: 1px dashed rgba(37, 99, 235, 0.3)
  - Color: #60a5fa
  - Font: Inter 500, 12px
  - Border-radius: 4px
  - Cursor: pointer
  - Hover: background rgba(37, 99, 235, 0.25), border-style solid
  - Transition: all 200ms ease-out

- **Filters Section:**
  - Margin-top: 8px
  - Padding: 8px 16px
  - Border-top: 1px solid rgba(37, 99, 235, 0.1)
  - Display: flex, gap: 8px, flex-wrap: wrap

  - **Filter Dropdown:**
    - Height: 28px
    - Padding: 0 10px
    - Background: rgba(37, 99, 235, 0.1)
    - Border: 1px solid rgba(37, 99, 235, 0.2)
    - Font: Inter 400, 12px, color: #9ca3af
    - Border-radius: 4px
    - Cursor: pointer
    - Hover: border-color rgba(37, 99, 235, 0.4)

- **Viewport Overlay (during search):**
  - Position: fixed, inset: 0
  - Background: transparent (or very subtle rgba(0, 0, 0, 0.1))
  - Z-index: 200 (below dropdown, above viewport)
  - Click to close search dropdown
  - Pointer-events: auto

- **Scrollbar (in results):**
  - Width: 6px
  - Background: transparent
  - Thumb: rgba(37, 99, 235, 0.3)
  - Thumb hover: rgba(37, 99, 235, 0.5)
  - Border-radius: 3px

---

## Screen 1.12: Bookmarks Panel

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ BOOKMARKS PANEL (left sidebar, width: 280px, hidden by default)      │  │
│  │ bg: rgba(15,23,42,0.95), border-right: 1px solid rgba(37,99,235...)  │  │
│  │                                                                      │  │
│  │ ┌────────────────────────────────────────────────────────────────┐  │  │
│  │ │ ★ BOOKMARKS                                              [✕]  │  │  │
│  │ │ Your saved locations and objects                              │  │  │
│  │ └────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                      │  │
│  │ ┌────────────────────────────────────────────────────────────────┐  │  │
│  │ │ [Search bookmarks ...]                                         │  │  │
│  │ │ (36px tall, rounded search box)                                │  │  │
│  │ └────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                      │  │
│  │ SAVED VIEWS (8):                                                    │  │
│  │ ├────────────────────────────────────────────────────────────────┤  │  │
│  │ │ ☀ Solar System Overview     📍 2026-04-16 14:32:00           │  │  │
│  │ │                                                  [⋮ delete]    │  │  │
│  │ │                                                                │  │  │
│  │ │ ☿ Mercury (closeup)         📍 2026-04-16 10:22:00           │  │  │
│  │ │                                                  [⋮ delete]    │  │  │
│  │ │                                                                │  │  │
│  │ │ 🌍 Earth Orbit View          📍 2026-04-15 22:15:00           │  │  │
│  │ │                                                  [⋮ delete]    │  │  │
│  │ │                                                                │  │  │
│  │ │ 🌌 Milky Way Galaxy          📍 2026-04-15 18:45:00           │  │  │
│  │ │                                                  [⋮ delete]    │  │  │
│  │ │                                                                │  │  │
│  │ │ [↓ Load more bookmarks]                                       │  │  │
│  │ └────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                      │  │
│  │ SHARED VIEWS (3):                                                   │  │
│  │ ├────────────────────────────────────────────────────────────────┤  │  │
│  │ │ 🌟 Pleiades Cluster (friend)                   2026-04-16      │  │  │
│  │ │                                                  [⋮ unshare]   │  │  │
│  │ │                                                                │  │  │
│  │ │ 🪐 Saturn & Rings (shared)                      2026-04-15     │  │  │
│  │ │                                                  [⋮ unshare]   │  │  │
│  │ └────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Panel Container:**
  - Position: fixed, left: -280px, top: 56px
  - Width: 280px
  - Height: calc(100vh - 56px)
  - Background: rgba(15, 23, 42, 0.95)
  - Border-right: 1px solid rgba(37, 99, 235, 0.2)
  - Backdrop-filter: blur(8px)
  - Padding: 16px
  - Overflow-y: auto
  - Z-index: 110
  - Transition: left 300ms cubic-bezier(0.34, 1.56, 0.64, 1)
  - Toggle via hamburger menu in top nav
  - On toggle open: left 0

- **Header:**
  - Display: flex, justify-content: space-between, align-items: center
  - Margin-bottom: 16px
  - Padding-bottom: 12px
  - Border-bottom: 1px solid rgba(37, 99, 235, 0.1)

  - **Title:** Inter 600, 16px, color: #e5e7eb
  - **Icon (★):** 18px, color: #fbbf24
  - **Close Button:** 28px × 28px, transparent, color: #6b7280

- **Subtitle:**
  - Font: Inter 400, 12px
  - Color: #6b7280
  - Margin-bottom: 16px

- **Search Input:**
  - Width: 100%
  - Height: 36px
  - Background: rgba(37, 99, 235, 0.1)
  - Border: 1px solid rgba(37, 99, 235, 0.2)
  - Padding: 0 12px
  - Font: Inter 400, 12px
  - Color: #d1d5db
  - Placeholder: "Search bookmarks..." (color: #6b7280)
  - Border-radius: 6px
  - Margin-bottom: 16px
  - Focus: border-color #2563eb, box-shadow 0 0 12px rgba(37, 99, 235, 0.3)

- **Section (Saved Views / Shared Views):**
  - Margin-bottom: 24px

  - **Section Header:**
    - Font: Inter 600, 11px, color: #6b7280
    - Text-transform: uppercase
    - Letter-spacing: 0.5px
    - Margin-bottom: 8px
    - Padding: 8px 0

  - **Bookmark Item:**
    - Padding: 12px
    - Background: rgba(37, 99, 235, 0.05)
    - Border: 1px solid rgba(37, 99, 235, 0.1)
    - Border-radius: 6px
    - Margin-bottom: 8px
    - Cursor: pointer
    - Hover: background rgba(37, 99, 235, 0.12), border-color rgba(37, 99, 235, 0.2)
    - Click: navigates to saved view (animates camera to view state)
    - Transition: all 200ms ease-out

    - **Title Row:**
      - Display: flex, justify-content: space-between, align-items: flex-start
      - Margin-bottom: 4px

      - **Title:** Inter 500, 13px, color: #e5e7eb
      - **Menu (⋮):** Button, 28px × 28px, transparent, color: #6b7280, hover color: #9ca3af

    - **Date:** Inter 400, 11px, color: #6b7280, margin-bottom: 4px
    - **Location Badge (📍):** Inter 400, 11px, color: #9ca3af

  - **Menu Dropdown (on ⋮ click):**
    - Position: absolute, 200px wide
    - Background: rgba(15, 23, 42, 0.98)
    - Border: 1px solid rgba(37, 99, 235, 0.2)
    - Padding: 8px 0
    - Border-radius: 6px
    - Box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4)
    - Z-index: 300

    - **Item (Delete, Rename, Export):**
      - Padding: 10px 16px
      - Font: Inter 400, 12px, color: #d1d5db
      - Cursor: pointer
      - Hover: background rgba(37, 99, 235, 0.15)

- **Load More Button:**
  - Width: 100%
  - Height: 36px
  - Background: rgba(37, 99, 235, 0.15)
  - Border: 1px dashed rgba(37, 99, 235, 0.3)
  - Color: #60a5fa
  - Font: Inter 500, 12px
  - Border-radius: 6px
  - Cursor: pointer
  - Hover: border-style solid, background rgba(37, 99, 235, 0.25)
  - Margin-top: 8px

- **Empty State:**
  - If no bookmarks: display centered placeholder
  - Icon: 48px, color #6b7280
  - Text: "No bookmarks yet", Inter 400, 13px, color #6b7280
  - Subtext: "Click the ★ button to save views", Inter 400, 11px, color #4b5563

---

## Screen 1.13: Settings Panel

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ SETTINGS MODAL (centered, width: 500px)                             │  │
│  │ bg: rgba(15,23,42,0.98), border: 1px solid rgba(37,99,235,0.3)     │  │
│  │                                                                      │  │
│  │ ┌────────────────────────────────────────────────────────────────┐  │  │
│  │ │ ⚙ SETTINGS                                                 [✕] │  │  │
│  │ │ Customize your experience                                      │  │  │
│  │ └────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                      │  │
│  │ TAB NAVIGATION:                                                     │  │
│  │ ┌─────────────┬─────────────┬──────────────┬──────────────────┐    │  │
│  │ │ Display     │ Performance │ Data         │ About            │    │  │
│  │ │ (selected)  │             │              │                  │    │  │
│  │ └─────────────┴─────────────┴──────────────┴──────────────────┘    │  │
│  │                                                                      │  │
│  │ ┌────────────────────────────────────────────────────────────────┐  │  │
│  │ │ DISPLAY SETTINGS                                               │  │  │
│  │ │                                                                │  │  │
│  │ │ Theme:                                                        │  │  │
│  │ │ ◉ Dark (default)    ○ Light    ○ System                       │  │  │
│  │ │                                                                │  │  │
│  │ │ UI Scale:                                                     │  │  │
│  │ │ [──●───] 100% (slider, 80-150%)                              │  │  │
│  │ │                                                                │  │  │
│  │ │ Graphics Quality:                                             │  │  │
│  │ │ ○ Low    ○ Medium    ◉ High    ○ Ultra                       │  │  │
│  │ │                                                                │  │  │
│  │ │ Show Tooltips:    [Toggle ◌→●] ON                            │  │  │
│  │ │ Show Grid:        [Toggle ◌→●] OFF                           │  │  │
│  │ │ Fullscreen Mode:  [Toggle ◌→●] OFF                           │  │  │
│  │ │                                                                │  │  │
│  │ └────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                      │  │
│  │ [Restore Defaults]  [Save Settings]                                │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Modal Container:** (same as Share Dialog, Screen 1.10)
  - Position: fixed, center
  - Width: 500px, Height: auto
  - Background: rgba(15, 23, 42, 0.98)
  - Border: 1px solid rgba(37, 99, 235, 0.3)
  - Padding: 24px
  - Border-radius: 12px
  - Z-index: 600

- **Tab Navigation:**
  - Display: flex, gap: 0
  - Margin-bottom: 24px
  - Border-bottom: 2px solid rgba(37, 99, 235, 0.1)

  - **Tab Button:**
    - Flex: 1
    - Height: 44px
    - Background: transparent
    - Border: none
    - Border-bottom: 3px solid transparent
    - Font: Inter 500, 13px, color: #9ca3af
    - Cursor: pointer
    - Hover: color: #d1d5db
    - Active: border-color #2563eb, color #e5e7eb
    - Transition: all 200ms ease-out

- **Settings Sections (per tab):**
  - Display: flex, flex-direction: column, gap: 20px

  - **Setting Group:**
    - Padding-bottom: 16px
    - Border-bottom: 1px solid rgba(37, 99, 235, 0.1)
    - Last group: no border

    - **Label:** Inter 500, 13px, color: #d1d5db, margin-bottom: 8px

    - **Radio Buttons:**
      - Display: flex, gap: 16px

      - **Option:**
        - Display: flex, align-items: center, gap: 8px
        - Cursor: pointer

        - **Radio Circle:** 18px × 18px, border 2px solid #6b7280
          - Unchecked: background transparent
          - Checked: background #2563eb, border-color #2563eb
          - Hover: border-color #9ca3af
          - Inner dot (checked): 8px circle, background #0a0a1a

        - **Text:** Inter 400, 12px, color: #d1d5db

    - **Slider:**
      - Width: 100%
      - Height: 4px
      - Background: rgba(37, 99, 235, 0.2)
      - Accent: linear-gradient(90deg, #2563eb, #8b5cf6)
      - Handle: 12px circle, background #2563eb
      - Margin: 8px 0
      - Value display (right-aligned): JetBrains Mono, 12px, color #60a5fa

    - **Toggle Switch:**
      - Width: 48px, Height: 28px
      - Background: rgba(37, 99, 235, 0.3)
      - Border: 1px solid rgba(37, 99, 235, 0.5)
      - Border-radius: 14px
      - Position: relative
      - Cursor: pointer

      - **Toggle Circle:**
        - Size: 24px
        - Background: white
        - Position: absolute, left: 2px, top: 50%, translateY(-50%)
        - Border-radius: 50%
        - Transition: left 200ms ease-out

      - **Active state:**
        - Background: rgba(16, 185, 129, 0.4)
        - Border-color: #10b981
        - Circle left: 22px

- **Button (Restore/Save):**
  - Display: flex, gap: 12px, margin-top: 24px
  - Justify-content: flex-end

  - **Button:**
    - Height: 40px
    - Padding: 0 20px
    - Background: rgba(37, 99, 235, 0.2)
    - Border: 1px solid rgba(37, 99, 235, 0.4)
    - Color: #60a5fa
    - Font: Inter 500, 13px
    - Border-radius: 6px
    - Cursor: pointer
    - Hover: background rgba(37, 99, 235, 0.3), border-color rgba(37, 99, 235, 0.6)
    - Transition: all 200ms ease-out

  - **Save Button:** (primary styling)
    - Background: rgba(37, 99, 235, 0.3)
    - Border-color: rgba(37, 99, 235, 0.6)
    - Color: #60a5fa

---

## Screen 1.14: Tutorial / Tour Mode

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ TOP NAV (slightly faded background)                                 │  │
│  │                                                                      │  │
│  │  [≡]  Cosmos    [🔍 ...]    [⚙]    [?]  (slightly grayed out)      │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ 3D VIEWPORT (with tour overlay)                                      │ │
│  │                                                                        │ │
│  │                      (Solar System scene)                             │ │
│  │                                                                        │ │
│  │                                                                        │ │
│  │  ┌────────────────────────────────────────────────────────────┐     │ │
│  │  │ TOUR NARRATION PANEL (bottom, 600px wide)                 │     │ │
│  │  │ bg: rgba(15,23,42,0.95), border: 1px solid ...            │     │ │
│  │  │                                                             │     │ │
│  │  │ STEP 3 of 8: Explore the Planets                           │     │ │
│  │  │                                                             │     │ │
│  │  │ "Zoom in on the planets to learn about their             │     │ │
│  │  │  characteristics. Each planet has unique features,        │     │ │
│  │  │  atmospheres, and orbital patterns."                      │     │ │
│  │  │                                                             │     │ │
│  │  │ [✕ End Tour]  [← Back]  [Next Step →]                     │     │ │
│  │  │ (buttons at bottom, equal spacing)                        │     │ │
│  │  │                                                             │     │ │
│  │  │ Progress: ███████░░░░░░░░░░░░░░░░░░░ 38%                 │     │ │
│  │  └────────────────────────────────────────────────────────────┘     │ │
│  │                                                                        │ │
│  │  SPOTLIGHT (animated beam on specific UI element or 3D object)      │ │
│  │  - Semi-transparent overlay darkens non-target areas                │ │
│  │  - Target area has glow/highlight effect                            │ │
│  │  - Optional: arrow pointing to target area                          │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Tour Overlay (full viewport):**
  - Position: fixed, inset 0
  - Background: rgba(0, 0, 0, 0.6)
  - Z-index: 400
  - Pointer-events: none (to allow viewport interaction)

- **Spotlight:**
  - Position: absolute, on target element or 3D object
  - Size: varies (min 100px, max 500px radius)
  - Border-radius: varies (circle for objects, rounded rect for UI)
  - Box-shadow: inset 0 0 24px rgba(37, 99, 235, 0.6) (glow inside)
  - Outer glow: box-shadow 0 0 48px rgba(37, 99, 235, 0.4) (outside)
  - Animation: glow pulses 0.6s, opacity oscillates slightly
  - Background: transparent (revealed canvas below)
  - Pointer-events: auto (allows interaction within spotlight)

- **Narration Panel:**
  - Position: fixed, bottom: 32px, left: 50%, translateX(-50%)
  - Width: clamp(300px, 90vw, 600px)
  - Height: auto (min 160px)
  - Background: rgba(15, 23, 42, 0.95)
  - Border: 1px solid rgba(37, 99, 235, 0.3)
  - Padding: 20px
  - Border-radius: 12px
  - Z-index: 450
  - Box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5)
  - Animation in: translateY(24px) → translateY(0), opacity 0 → 1, 300ms ease-out

- **Panel Header:**
  - Font: Inter 500, 12px, color: #6b7280
  - Text-transform: uppercase
  - Letter-spacing: 0.5px
  - Margin-bottom: 8px
  - Format: "STEP X of Y: [Title]"

- **Panel Title:**
  - Font: Inter 600, 18px, color: #e5e7eb
  - Margin-bottom: 12px

- **Panel Text:**
  - Font: Inter 400, 13px, color: #d1d5db
  - Line-height: 1.6
  - Margin-bottom: 16px
  - Max-height: 80px
  - Overflow-y: auto

- **Control Buttons:**
  - Display: flex, gap: 12px, justify-content: space-between
  - Margin-bottom: 12px

  - **Button (End Tour):**
    - Background: rgba(239, 68, 68, 0.2)
    - Border: 1px solid rgba(239, 68, 68, 0.3)
    - Color: #fca5a5
    - Font: Inter 500, 12px
    - Padding: 8px 12px
    - Border-radius: 4px
    - Cursor: pointer
    - Hover: background rgba(239, 68, 68, 0.3)

  - **Button (Back/Next):**
    - Background: rgba(37, 99, 235, 0.2)
    - Border: 1px solid rgba(37, 99, 235, 0.4)
    - Color: #60a5fa
    - Font: Inter 500, 12px
    - Padding: 8px 16px
    - Border-radius: 4px
    - Cursor: pointer
    - Hover: background rgba(37, 99, 235, 0.3)
    - Disabled: opacity 0.5, cursor not-allowed

  - **Navigation order:** [End Tour] [Back] [Next Step]

- **Progress Bar:**
  - Width: 100%
  - Height: 3px
  - Background: rgba(37, 99, 235, 0.15)
  - Accent: linear-gradient(90deg, #2563eb, #8b5cf6)
  - Border-radius: 1.5px
  - Margin-top: 8px
  - Filled width: based on current step / total steps

---

## Screen 1.15: Achievements & Gamification

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ACHIEVEMENTS MODAL (centered, width: 600px)                         │  │
│  │ bg: rgba(15,23,42,0.98), border: 1px solid rgba(37,99,235,0.3)     │  │
│  │                                                                      │  │
│  │ ┌────────────────────────────────────────────────────────────────┐  │  │
│  │ │ 🏆 ACHIEVEMENTS                                            [✕] │  │  │
│  │ │ You've explored X objects and earned Y badges               │  │  │
│  │ └────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                      │  │
│  │ RECENT ACHIEVEMENTS (last 7 days):                                  │  │
│  │ ┌────────────────────────────────────────────────────────────────┐  │  │
│  │ │ ✨ First 100 Stars!                    UNLOCKED 2 hours ago   │  │  │
│  │ │ ⭐⭐⭐ Viewed 100 different celestial objects               │  │  │
│  │ │                                                                │  │  │
│  │ │ 🔭 Deep Explorer                       UNLOCKED 1 day ago    │  │  │
│  │ │ ⭐⭐⭐ Zoomed to galaxy scale 10 times                      │  │  │
│  │ │                                                                │  │  │
│  │ │ 🌍 Planet Master                       UNLOCKED 3 days ago   │  │  │
│  │ │ ⭐⭐⭐⭐ Viewed all 8 planets in detail                    │  │  │
│  │ │                                                                │  │  │
│  │ │ [↓ Show all achievements]                                    │  │  │
│  │ └────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                      │  │
│  │ STATS:                                                              │  │
│  │ ┌────────────────────────────────────────────────────────────────┐  │  │
│  │ │ Objects Explored: 142               Longest Session: 47 min   │  │  │
│  │ │ Time Spent: 12.5 hours              Tour Completions: 3       │  │  │
│  │ │ Screenshots Taken: 28                Bookmarks Created: 12     │  │  │
│  │ │                                                                │  │  │
│  │ │ All-Time Rank: #2,847 globally                                │  │  │
│  │ │ (among 5.2M users)                                            │  │  │
│  │ └────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                      │  │
│  │ [Share Achievements]    [View Leaderboard]                          │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Modal Container:** (same as Settings, Screen 1.13)
  - Position: fixed, center, width: 600px
  - Background: rgba(15, 23, 42, 0.98)
  - Border: 1px solid rgba(37, 99, 235, 0.3)
  - Padding: 24px
  - Border-radius: 12px
  - Z-index: 600

- **Header:**
  - Display: flex, align-items: center, gap: 12px
  - Margin-bottom: 24px
  - Padding-bottom: 16px
  - Border-bottom: 1px solid rgba(37, 99, 235, 0.1)

  - **Icon:** 28px, color: #fbbf24
  - **Title:** Inter 600, 22px, color: #f3f4f6
  - **Subtitle:** Inter 400, 12px, color: #6b7280

- **Section (Recent Achievements):**
  - Margin-bottom: 24px

  - **Header:** Inter 600, 12px, color: #6b7280, text-transform: uppercase, letter-spacing: 0.5px
  - Margin-bottom: 12px

  - **Achievement Item:**
    - Padding: 16px
    - Background: rgba(37, 99, 235, 0.08)
    - Border: 1px solid rgba(37, 99, 235, 0.15)
    - Border-radius: 8px
    - Margin-bottom: 12px
    - Cursor: default

    - **Achievement Header:**
      - Display: flex, justify-content: space-between, align-items: center
      - Margin-bottom: 4px

      - **Icon:** 24px, colored (varies per achievement)
      - **Title:** Inter 600, 13px, color: #e5e7eb
      - **Unlock Date:** Inter 400, 11px, color: #6b7280, format: "UNLOCKED X days ago"

    - **Description:**
      - Font: Inter 400, 12px, color: #9ca3af
      - Margin-left: 32px (aligns under title)

    - **Star Rating (below description):**
      - ⭐ symbols (1-5 stars), color: #fbbf24
      - Spacing: 2px between stars

  - **Load More:**
    - Height: 36px
    - Width: 100%
    - Background: rgba(37, 99, 235, 0.15)
    - Border: 1px dashed rgba(37, 99, 235, 0.3)
    - Color: #60a5fa
    - Font: Inter 500, 12px
    - Border-radius: 6px
    - Cursor: pointer
    - Hover: border-style solid, background rgba(37, 99, 235, 0.25)

- **Stats Section:**
  - Background: rgba(37, 99, 235, 0.05)
  - Border: 1px solid rgba(37, 99, 235, 0.15)
  - Padding: 16px
  - Border-radius: 8px
  - Margin-bottom: 20px

  - **Stats Grid:**
    - Display: grid, grid-template-columns: 1fr 1fr
    - Gap: 16px

    - **Stat Item:**
      - **Label:** Inter 500, 11px, color: #9ca3af, margin-bottom: 4px
      - **Value:** Inter 600, 16px, color: #e5e7eb
      - **Unit (small):** Inter 400, 11px, color: #6b7280

  - **Global Rank:**
    - Margin-top: 12px
    - Padding-top: 12px
    - Border-top: 1px solid rgba(37, 99, 235, 0.1)
    - Font: Inter 500, 13px, color: #d1d5db
    - Subtext: Inter 400, 11px, color: #6b7280

- **Buttons:**
  - Display: flex, gap: 12px
  - Justify-content: center

  - **Button (Share/Leaderboard):**
    - Height: 40px
    - Padding: 0 24px
    - Background: rgba(37, 99, 235, 0.2)
    - Border: 1px solid rgba(37, 99, 235, 0.4)
    - Color: #60a5fa
    - Font: Inter 500, 13px
    - Border-radius: 6px
    - Cursor: pointer
    - Hover: background rgba(37, 99, 235, 0.3)
    - Transition: all 200ms ease-out

---

---

# JOURNEY 2: Classroom Lesson (Educator)

## Screen 2.1: Educator Landing Page

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ NAVBAR                                                               │  │
│  │ [≡] Cosmos for Educators    [Get Started]  [Documentation] [Help]   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ HERO (height: 500px, bg: space with educational imagery)           │  │
│  │                                                                      │  │
│  │     Teach the Universe to Your Students                             │  │
│  │                                                                      │  │
│  │  Interactive 3D lessons tailored for classrooms and                │  │
│  │  planetariums. No setup. No accounts. Just learning.               │  │
│  │                                                                      │  │
│  │           ┌──────────────────────────────┐                          │  │
│  │           │ CREATE FREE LESSON NOW →     │                          │  │
│  │           │ (Cosmic Blue, 48px tall)    │                          │  │
│  │           └──────────────────────────────┘                          │  │
│  │                                                                      │  │
│  │     OR: Browse pre-made lesson plans ↓                             │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ FEATURES FOR EDUCATORS (3 cards)                                    │  │
│  │                                                                      │  │
│  │ ┌────────┐          ┌────────┐          ┌────────┐                 │  │
│  │ │📋 Lesson│          │👥 Sync │          │🎬 Record│                 │  │
│  │ │ Plans   │          │ Students│          │ Sessions│                 │  │
│  │ │         │          │         │          │         │                 │  │
│  │ │Templates│          │Display  │          │Export   │                 │  │
│  │ │Saved    │          │mode for │          │video &  │                 │  │
│  │ │Plans    │          │group    │          │data     │                 │  │
│  │ └────────┘          └────────┘          └────────┘                 │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ LESSON TEMPLATES (carousel, 4 visible cards)                        │  │
│  │                                                                      │  │
│  │ ◄ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ►            │  │
│  │   │ Planets  │ │ Galaxies │ │ Exoplanets│ │ Black    │              │  │
│  │   │ 101      │ │ & Nebulae│ │ Search   │ │ Holes    │              │  │
│  │   │ Grade 6+ │ │ Grade 8+ │ │ Grade 9+ │ │ Grade 10│              │  │
│  │   │ [Use]    │ │ [Use]    │ │ [Use]    │ │ [Use]   │              │  │
│  │   └──────────┘ └──────────┘ └──────────┘ └──────────┘              │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ FOOTER (stats)                                                       │  │
│  │                                                                      │  │
│  │ 50,000+ Teachers | 2M+ Students | 95% Positive Reviews             │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Header:** Same nav structure as Journey 1, but "For Educators" added
- **Hero:** Dark blue gradient bg with subtle planet illustrations, height 500px
- **Main CTA:** 56px tall, Nebula Purple (#8b5cf6) background on hover
- **Feature Cards:** 3-column grid on desktop, 1-column on mobile, 280px width each
- **Lesson Templates:** Horizontal scroll carousel, cards 200px × 240px
  - Each card: border 1px solid rgba(37, 99, 235, 0.2), hover: elevation shadow

---

## Screen 2.2: Classroom Mode Activation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ TOP NAV (Cosmos for Educators)                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ LESSON SETUP MODAL (centered, 600px wide)                            │ │
│  │                                                                        │ │
│  │ ┌──────────────────────────────────────────────────────────────────┐ │ │
│  │ │ START CLASSROOM SESSION                                      [✕] │ │ │
│  │ │ Create interactive lesson for your students                      │ │ │
│  │ └──────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                        │ │
│  │ ┌──────────────────────────────────────────────────────────────────┐ │ │
│  │ │ STEP 1: SESSION SETUP                                           │ │ │
│  │ │                                                                  │ │ │
│  │ │ Session Name:                                                  │ │ │
│  │ │ ┌──────────────────────────────────────────────────────────┐   │ │ │
│  │ │ │ My Astronomy Lesson - Period 3        [clear button]   │   │ │ │
│  │ │ └──────────────────────────────────────────────────────────┘   │ │ │
│  │ │                                                                  │ │ │
│  │ │ Mode:                                                            │ │ │
│  │ │ ◉ Presenter View (you control navigation)                      │ │ │
│  │ │ ○ Free Exploration (students explore freely)                   │ │ │
│  │ │ ○ Guided Tour (lock students to your view)                     │ │ │
│  │ │                                                                  │ │ │
│  │ │ Max Students:  [Select: 30 ▼]   (optional, no limit if blank) │ │ │
│  │ │                                                                  │ │ │
│  │ │ [← Back]  [Next Step →]                                         │ │ │
│  │ │                                                                  │ │ │
│  │ └──────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Modal:** Position fixed center, width 600px, height auto
- **Background:** rgba(15, 23, 42, 0.98), border 1px solid rgba(37, 99, 235, 0.3)
- **Padding:** 24px, border-radius 12px, box-shadow 0 20px 60px rgba(0, 0, 0, 0.6)
- **Header:** 24px, color #f3f4f6, bottom border 1px solid rgba(37, 99, 235, 0.1)
- **Form Fields:**
  - Input: width 100%, height 40px, background rgba(37, 99, 235, 0.1), border 1px solid rgba(37, 99, 235, 0.2)
  - Radio buttons: same as Settings (Screen 1.13)
  - Select dropdown: 120px width, height 36px
- **Step Progress:** display "STEP 1 of 3" at top
- **Buttons:** [Back] and [Next] at bottom, gap 12px, each 40px tall

---

## Screen 2.3: Student Session Code Display

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ STUDENT CODE DISPLAY (modal or full-screen, before lesson starts)   │  │
│  │ bg: linear-gradient(135deg, rgba(37,99,235,0.3), rgba(139,92,...) │  │
│  │                                                                      │  │
│  │                   "Give This Code to Your Students"                 │  │
│  │                                                                      │  │
│  │           ┌────────────────────────────────────┐                    │  │
│  │           │                                    │                    │  │
│  │           │           CLASSROOM CODE           │                    │  │
│  │           │                                    │                    │  │
│  │           │         █████ ██ █████             │                    │  │
│  │           │         ███   ██ ██                │                    │  │
│  │           │         ████  ██ ███               │                    │  │
│  │           │         ██    ██ ██                │                    │  │
│  │           │         █████ ██ █████             │                    │  │
│  │           │                                    │                    │  │
│  │           │           A7M9K2 (QR code inside) │                    │  │
│  │           │                                    │                    │  │
│  │           │  Students enter at: cosmos.exp   │                    │  │
│  │           │                                    │                    │  │
│  │           │    Expires in: 45 minutes          │                    │  │
│  │           │    Students joined: 0/30          │                    │  │
│  │           │                                    │                    │  │
│  │           │     [Copy Code] [Share Screen]    │                    │  │
│  │           │     [Start Lesson →]              │                    │  │
│  │           │                                    │                    │  │
│  │           └────────────────────────────────────┘                    │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Modal:** Center, 500px wide, 600px tall
- **Gradient Background:** linear-gradient(135deg, rgba(37,99,235,0.15), rgba(139,92,246,0.15))
- **Card Container:** 400px wide, 500px tall, border 2px solid #2563eb, border-radius 12px, padding 24px
- **Title:** Inter 600, 16px, color #e5e7eb, margin-bottom 12px
- **Code Display:** JetBrains Mono 700, 48px, color #2563eb, letter-spacing 8px
- **QR Code:** 160px × 160px, white background, border 2px solid #2563eb
- **Subtitle:** Inter 400, 12px, color #6b7280
- **Timer:** Inter 500, 13px, color #f59e0b, updates every second
- **Student Count:** Inter 500, 13px, color #10b981
- **Buttons:** [Copy Code] [Share Screen] 140px each, [Start Lesson] 200px, height 40px

---

## Screen 2.4: Lesson Plan Interface

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ TOP NAV (Classroom Mode)                                             │  │
│  │ [≡] Cosmos Classroom    Lesson: Planets 101 (Period 3)  [⚙] [?]    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌────────┐ ┌─────────────────────────────────────────────────────────┐  │
│  │ LESSON │ │ 3D VIEWPORT (main canvas, takes 75% width)             │  │
│  │ PLAN   │ │                                                         │  │
│  │ PANEL  │ │ (Solar System view with annotations)                   │  │
│  │ (left, │ │                                                         │  │
│  │ 280px) │ │                                                         │  │
│  │        │ │                                                         │  │
│  │┌──────┐│ │                                                         │  │
│  ││ Sect. │ │                                                         │  │
│  ││  1:   │ │                                                         │  │
│  ││Intro │ │                                                         │  │
│  ││to Pl. │ │                                                         │  │
│  │└──────┘│ │                                                         │  │
│  │(open) ││ │                                                         │  │
│  │        │ │                                                         │  │
│  │┌──────┐│ │                                                         │  │
│  ││ Sect. │ │                                                         │  │
│  ││  2:   │ │                                                         │  │
│  ││ Merc. │ │                                                         │  │
│  ││ Detail│ │                                                         │  │
│  │└──────┘│ │                                                         │  │
│  │(ready)││ │                                                         │  │
│  │        │ │                                                         │  │
│  │[Next   │ │                                                         │  │
│  │ Section]│ │                                                         │  │
│  │        │ │ ┌─────────────────────────────┐                        │  │
│  │        │ │ │ NOTES PANEL (bottom-right)  │                        │  │
│  │        │ │ │ bg: rgba(15,23,42,0.9)     │                        │  │
│  │        │ │ │                             │                        │  │
│  │        │ │ │ Topic: Mercury              │                        │  │
│  │        │ │ │ "Smallest rocky planet,     │                        │  │
│  │        │ │ │ closest to the sun..."      │                        │  │
│  │        │ │ │                             │                        │  │
│  │        │ │ │ [Show to Class] [Annotate] │                        │  │
│  │        │ │ └─────────────────────────────┘                        │  │
│  │        │ │                                                         │  │
│  └────────┘ └─────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Left Panel (Lesson Plan):**
  - Position: fixed left, width 280px, height calc(100vh - 56px), top 56px
  - Background: rgba(15, 23, 42, 0.9), border-right 1px solid rgba(37, 99, 235, 0.2)
  - Padding: 16px, overflow-y: auto
  - Z-index: 100

  - **Section Card:**
    - Background: rgba(37, 99, 235, 0.08) or rgba(37, 99, 235, 0.15) when open/ready
    - Border: 1px solid rgba(37, 99, 235, 0.2)
    - Padding: 12px
    - Border-radius: 6px
    - Margin-bottom: 8px
    - Cursor: pointer
    - Hover: border-color rgba(37, 99, 235, 0.4)

    - **Title:** Inter 600, 12px, color #e5e7eb
    - **Status Badge:** Inter 500, 10px, color #60a5fa (or green for completed)

  - **Next Button:** width 100%, height 40px, margin-top 12px

- **Viewport:** margin-left 280px, takes remaining space
- **Notes Panel:**
  - Position: fixed, bottom 24px, right 24px, width 320px
  - Background: rgba(15, 23, 42, 0.95), border 1px solid rgba(37, 99, 235, 0.2)
  - Padding: 16px, border-radius 8px
  - Z-index: 150

---

## Screen 2.5: Time Simulation with Kepler's Law Presets

```
See Screen 1.9 (Time Controls) for base specifications.

EDUCATOR-SPECIFIC ADDITIONS:
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│ TIME CONTROL PANEL (expanded, top-right)                                   │
│ bg: rgba(15,23,42,0.95)                                                    │
│                                                                             │
│ [Play] [Pause] [Reverse]    [Reset to Now]                                 │
│                                                                             │
│ SPEED: 1x  ├─●──────────────────────── ▶ 1M×                              │
│                                                                             │
│ EDUCATOR PRESETS:                                                          │
│ [Kepler's Law 1]  [Mercury Orbit]  [Venus-Earth]  [Mars-Jupiter Sync]     │
│ (Demonstrates orbital mechanics with specific configurations)              │
│                                                                             │
│ [Synchronized Seasons Demo]                                               │
│ (Shows Earth's axial tilt and seasonal variations)                        │
│                                                                             │
│ ANNOTATIONS:                                                               │
│ ☑ Show orbital paths                                                       │
│ ☑ Show velocity vectors                                                    │
│ ☑ Show distance markers                                                    │
│ ☐ Show COM (center of mass)                                                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Educator Presets:** 4 preset buttons (120px each, 2-column grid)
  - Each: height 36px, background rgba(139, 92, 246, 0.2), border 1px solid #8b5cf6
  - Click: applies specific time simulation that demonstrates physics principle

- **Annotation Checkboxes:**
  - Display: flex, flex-direction: column, gap: 8px
  - Margin-top: 12px
  - Each: checkbox (18px × 18px) + label (Inter 400, 12px, color #d1d5db)
  - Hover: background rgba(37, 99, 235, 0.05)

---

## Screen 2.6: Student Sync View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ TOP NAV: Classroom Mode - Students Connected: 12/30                 │  │
│  │                                                                      │  │
│  │ [Connected ●]  [Students ▼]  [Mute All]  [Disconnect All]          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌────────┐ ┌──────────────────────────────────────────────────────────┐  │
│  │ LESSON │ │ 3D VIEWPORT                                             │  │
│  │ PANEL  │ │ (Teacher's view - main teaching interface)              │  │
│  │        │ │                                                         │  │
│  │ [Sect. │ │ (All students see the same view, locked to teacher)    │  │
│  │  1]    │ │                                                         │  │
│  │        │ │ ☀ [Mercury selected]                                   │  │
│  │ [Sect. │ │                                                         │  │
│  │  2]    │ │ ┌──────────────────────────────────┐                   │  │
│  │ (live) │ │ │ STUDENT PANEL (right side)      │                   │  │
│  │        │ │ ├──────────────────────────────────┤                   │  │
│  │        │ │ │ 🟢 Alice (attending)            │                   │  │
│  │ [Next] │ │ │ 🟢 Bob (attending)              │                   │  │
│  │        │ │ │ 🔴 Carol (camera off)           │                   │  │
│  │        │ │ │ ⚠️  Dan (connection unstable)   │                   │  │
│  │        │ │ │ 🟢 Emma (attending)             │                   │  │
│  │        │ │ │                                 │                   │  │
│  │        │ │ │ [Show Student View]             │                   │  │
│  │        │ │ │ [Raise Hands: 2]   [⋮ menu]    │                   │  │
│  │        │ │ └──────────────────────────────────┘                   │  │
│  │        │ │                                                         │  │
│  └────────┘ └──────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Student Sync Panel (right side):**
  - Position: fixed right 0, top 56px, width 280px
  - Background: rgba(15, 23, 42, 0.95), border-left 1px solid rgba(37, 99, 235, 0.2)
  - Padding: 16px, height calc(100vh - 56px), overflow-y: auto
  - Z-index: 100

  - **Header:** "CONNECTED STUDENTS", font Inter 600, 12px, color #10b981
  - **Count:** Inter 500, 14px, color #6ee7b7, format "X/Y connected"

  - **Student Item:**
    - Display: flex, align-items: center, gap: 8px
    - Padding: 8px 0
    - Border-bottom: 1px solid rgba(37, 99, 235, 0.1)

    - **Status Indicator:** 8px circle, colors:
      - 🟢 Green #10b981 = attending
      - 🔴 Red #ef4444 = offline
      - ⚠️ Yellow #f59e0b = connection issues

    - **Name:** Inter 400, 12px, color #d1d5db
    - **Menu (⋮):** Button, 24px × 24px, color #6b7280

  - **Actions Section:**
    - [Show Student View]: 100%, height 36px, background rgba(37, 99, 235, 0.2), border 1px solid rgba(37, 99, 235, 0.4)
    - Raised hands indicator: Inter 600, 12px, color #f59e0b

---

## Screen 2.7: Fullscreen Presentation Mode

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│ (NO UI ELEMENTS - just viewport)                                           │
│                                                                             │
│                         3D VIEWPORT (fullscreen)                           │
│                                                                             │
│                              ☀ (Sun)                                       │
│                                                                             │
│                    ● ● ● ● ● ● ● ● ●                                     │
│                  (Planets with orbital paths)                              │
│                                                                             │
│                                                                             │
│ (Minimal HUD, invisible by default)                                        │
│ - Breadcrumb (bottom-left, small, semi-transparent)                        │
│ - Time display (bottom-center, JetBrains Mono, small)                      │
│ - Help hint (top-left, fades away after 5s): "Press [ESC] or [H] for menu"│
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Fullscreen Mode Trigger:** Button in educator controls (top nav)
- **CSS:** F11 or custom fullscreen API (document.documentElement.requestFullscreen)
- **Minimal HUD:**
  - Breadcrumb: position bottom-left, font Inter 400, 10px, color rgba(107, 114, 128, 0.7)
  - Time: position bottom-center, font JetBrains Mono 400, 12px, color rgba(96, 165, 250, 0.5)
  - Help hint: position top-left, font Inter 400, 11px, color rgba(107, 114, 128, 0.8)

- **Exit Fullscreen:**
  - Press ESC key
  - Click menu button (if visible)
  - Automatically exits on disconnect

---

## Screen 2.8: Student View (Read-Only, Synced)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ TOP NAV: Attending: Planets 101 (Period 3)  [Teacher: Mr. Smith]    │  │
│  │                                                                      │  │
│  │ [✓ Connected] [Raise Hand 🙋] [Mute Audio] [Settings]               │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                        │ │
│  │                      3D VIEWPORT (read-only)                          │ │
│  │                                                                        │ │
│  │                  (Shows teacher's view, synced)                      │ │
│  │                  (Student cannot rotate, zoom, or click)             │ │
│  │                                                                        │ │
│  │                           ☀ [Mercury]                                │ │
│  │                                                                        │ │
│  │                                                                        │ │
│  │                                                                        │ │
│  │  ┌──────────────────────────────────────────────┐                   │ │
│  │  │ NOTES PANEL (right side, teacher narration)  │                   │ │
│  │  │ ────────────────────────────────────────     │                   │ │
│  │  │ Mr. Smith: "Mercury is the smallest rocky   │                   │ │
│  │  │ planet. Notice its close orbit to the sun   │                   │ │
│  │  │ causes extreme temperature variations..."   │                   │ │
│  │  │                                              │                   │ │
│  │  │ [Mark as Important]                          │                   │ │
│  │  │ [Add to My Notes]                            │                   │ │
│  │  └──────────────────────────────────────────────┘                   │ │
│  │                                                                        │ │
│  │  [Q&A Section Below]                                                 │ │
│  │  Your questions will appear here                                     │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Student View:** Read-only, fully synced to teacher's view
- **Top Nav:**
  - Status badge (✓ Connected): green with checkmark
  - Raise Hand button: 44px tall, background rgba(245, 158, 11, 0.2), border 1px solid #f59e0b, color #fbbf24
  - Indicates number of raised hands globally (e.g., "Raise Hand [3 hands raised]")

- **Viewport:** No interactive controls, pointer-events: none on canvas except for Raise Hand UI
- **Notes Panel:**
  - Position: fixed right 0, top 56px, width 300px
  - Background: rgba(15, 23, 42, 0.9), border-left 1px solid rgba(37, 99, 235, 0.2)
  - Padding: 16px
  - Font: Inter 400, 12px, color #d1d5db
  - Buttons: [Mark Important] [Add to Notes] each 140px, height 32px

---

## Screen 2.9: Lesson Completion Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ COMPLETION MODAL (centered, 550px wide)                             │  │
│  │ bg: rgba(15,23,42,0.98)                                             │  │
│  │                                                                      │  │
│  │ ┌────────────────────────────────────────────────────────────────┐  │  │
│  │ │ ✓ LESSON COMPLETED                                        [✕] │  │  │
│  │ │ Planets 101 - Period 3                                        │  │  │
│  │ │ 2026-04-16 | 45 minutes                                       │  │  │
│  │ └────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                      │  │
│  │ SESSION SUMMARY                                                     │  │
│  │ ┌────────────────────────────────────────────────────────────────┐  │  │
│  │ │ Students Attended: 28/30                                      │  │  │
│  │ │ Duration: 45 minutes                                          │  │  │
│  │ │ Topics Covered: 8 (Mercury, Venus, Earth, Mars, ...)         │  │  │
│  │ │ Q&A Count: 14                                                 │  │  │
│  │ │ Hands Raised: 23                                              │  │  │
│  │ │ Data Accessed: 142 object views                               │  │  │
│  │ └────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                      │  │
│  │ STUDENT ENGAGEMENT                                                  │  │
│  │ ┌────────────────────────────────────────────────────────────────┐  │  │
│  │ │ Participation: ████████░░ 78%                                 │  │  │
│  │ │ Avg Session Duration: 43 min (from 28 students)              │  │  │
│  │ │ Most Viewed: Mercury (100%), Venus (96%), Earth (87%)        │  │  │
│  │ │ Dropout Rate: 2 (6.7%)                                        │  │  │
│  │ └────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                      │  │
│  │ RESOURCES EXPORTED                                                  │  │
│  │ ┌────────────────────────────────────────────────────────────────┐  │  │
│  │ │ ☑ Session recording (video: 12.3 MB)                         │  │  │
│  │ │ ☑ Lesson transcript (PDF: 2.1 MB)                            │  │  │
│  │ │ ☑ Student attendance log (CSV)                                │  │  │
│  │ │ ☑ Data export (all objects viewed)                            │  │  │
│  │ │ ☑ Analytics report (engagement metrics)                       │  │  │
│  │ └────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                      │  │
│  │ ┌─────────────────────────────────────────────────────────────┐    │  │
│  │ │ [Download All]  [Share with Students]  [Save as Template]   │    │  │
│  │ │                                                             │    │  │
│  │ │ [Back to Lessons]                                          │    │  │
│  │ └─────────────────────────────────────────────────────────────┘    │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Modal:** Position fixed center, width 550px, height auto
- **Header:** Inter 600, 22px, color #e5e7eb, with ✓ checkmark (green #10b981)
- **Subtitle:** Inter 400, 13px, color #6b7280
- **Sections:** 3 sections (Summary, Engagement, Exports)

- **Summary Items:**
  - Font: Inter 400, 12px, color #d1d5db
  - Format: "Label: value" or "Label: X/Y"
  - Padding: 8px 0
  - Border-bottom: 1px solid rgba(37, 99, 235, 0.1)

- **Progress Bars:**
  - Background: rgba(37, 99, 235, 0.15)
  - Accent: linear-gradient(90deg, #2563eb, #8b5cf6)
  - Height: 8px, border-radius: 4px
  - Percentage label: right-aligned, Inter 500, 11px, color #9ca3af

- **Checkboxes:** Checked by default, clickable to toggle which exports to include
- **Buttons:** [Download All] [Share] [Template] each 160px, height 40px

---

## Screen 2.10: Resource Export Panel

```
Triggered by [Download All] or individual resource downloads.

┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  EXPORT DIALOG (modal or sidebar, 480px wide)                             │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ EXPORT LESSON RESOURCES                                         [✕] │  │
│  │ Planets 101 - April 16, 2026                                        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  FORMAT:                                                                    │
│  ○ Export as ZIP (all files combined)                                     │  │
│  ◉ Individual downloads                                                   │  │
│                                                                             │
│  RESOURCES:                                                                 │
│                                                                             │
│  ☑ Video Recording              12.3 MB                [↓ Download]       │  │
│     Format: [MP4 ▼]  Quality: [1080p ▼]                                 │  │
│                                                                             │
│  ☑ Transcript                    2.1 MB                [↓ Download]       │  │
│     Format: [PDF ▼]              Include timestamps: ☑                    │  │
│                                                                             │
│  ☑ Attendance Log                45 KB                 [↓ Download]       │  │
│     Format: [CSV ▼]              Include details: ☑                       │  │
│                                                                             │
│  ☑ Object Data Export            1.2 MB                [↓ Download]       │  │
│     Format: [JSON ▼] [Excel ▼]                                           │  │
│                                                                             │
│  ☑ Analytics Report              890 KB                [↓ Download]       │  │
│     Format: [PDF ▼]              Include charts: ☑                        │  │
│                                                                             │
│  ┌────────────────────────────────────────────────────┐                  │  │
│  │ [↓ Download All (14.5 MB)] [✓ Copy Share Link]    │                  │  │
│  └────────────────────────────────────────────────────┘                  │  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Dialog:** modal or sidebar-modal, position fixed, 480px wide
- **Resource Items:**
  - Checkbox (18px × 18px) + name + size + [↓ Download] button
  - Padding: 12px, background rgba(37, 99, 235, 0.05), border-bottom 1px solid rgba(37, 99, 235, 0.1)
  - Format dropdown: 100px wide, height 32px
  - Options checkbox: 14px, margin-left: auto

- **Download Button:**
  - Width: 120px, height: 32px
  - Background: rgba(37, 99, 235, 0.2), border 1px solid rgba(37, 99, 235, 0.4)
  - Color: #60a5fa, font Inter 500, 11px

- **Download All Button:**
  - Width: 100%, height: 40px
  - Background: rgba(37, 99, 235, 0.3), border 1px solid rgba(37, 99, 235, 0.6)
  - Color: #60a5fa, font Inter 600, 13px

---

# JOURNEY 3: Content Creation (YouTuber)

## Screen 3.1: Creator Tools Discovery

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ NAVBAR: Cosmos for Creators                                         │  │
│  │ [≡]  [🎥 Creators] [Documentation] [Community] [?]                 │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ HERO: "Create Stunning Space Content"                               │  │
│  │ Professional-grade tools for video creators, artists, educators     │  │
│  │                                                                      │  │
│  │              ┌──────────────────────────────┐                        │  │
│  │              │ START CREATING FREE →        │                        │  │
│  │              │ (Nebula Purple)              │                        │  │
│  │              └──────────────────────────────┘                        │  │
│  │                                                                      │  │
│  │              Watch Demo Videos ↓                                    │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  CREATOR TOOLS (3-column grid)                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                        │  │
│  │🎬 CAMERA   │  │📸 SCREENSHOT │  │📊 DATA      │                        │  │
│  │PATH EDITOR │  │ CAPTURE      │  │ EXPORT      │                        │  │
│  │             │  │              │  │             │                        │  │
│  │Animate your │  │High-res frame│  │Export 3D   │                        │  │
│  │view with   │  │grabs for     │  │data for    │                        │  │
│  │keyframes   │  │thumbnails,   │  │analysis    │                        │  │
│  │and smooth  │  │backgrounds   │  │and        │                        │  │
│  │transitions │  │              │  │reference  │                        │  │
│  │             │  │              │  │            │                        │  │
│  │ [Try Tool] │  │ [Try Tool]   │  │ [Try Tool]│                        │  │
│  └─────────────┘  └─────────────┘  └─────────────┘                        │  │
│                                                                             │
│  RECOMMENDED FOR YOU (carousel)                                            │  │
│  ◄ [Inspiration Project 1] [Project 2] [Project 3] ►                     │  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Feature Cards:**
  - Grid: 3 columns on desktop, 2 on tablet, 1 on mobile
  - Each card: 280px × 320px, background rgba(37, 99, 235, 0.08), border 1px solid rgba(37, 99, 235, 0.2)
  - Padding: 20px, border-radius: 12px
  - Icon: 48px, colors vary (blue, purple, gold)
  - Title: Inter 600, 16px, color #e5e7eb, margin-bottom: 8px
  - Description: Inter 400, 13px, color #9ca3af, margin-bottom: 16px
  - Button: 100%, height 36px, background rgba(37, 99, 235, 0.2), border 1px solid rgba(37, 99, 235, 0.4)

---

## Screen 3.2: Camera Path Editor

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ TOP NAV: Camera Path Editor - Untitled Project   [Save] [Export]    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────┐ ┌─────────────────────────────────────────────────────┐     │  │
│  │ KEYFRAME │ │ 3D VIEWPORT (main editing area)                    │     │  │
│  │ LIST     │ │                                                     │     │  │
│  │ (left)   │ │ (Shows camera path as a curve/spline in space)    │     │  │
│  │          │ │ (Keyframe points visible as spheres on path)       │     │  │
│  │ ┌──────┐ │ │                                                     │     │  │
│  │ │Frame │ │ │ ☀ (Sun)     ☀ ─ ────  ☀ ─ ─ ─                   │     │  │
│  │ │  1   │ │ │              ↘      ↙  (path curve)                │     │  │
│  │ │ 0.0s │ │ │           ● ─────── ●  (keyframe 1 and 2)         │     │  │
│  │ │[Edit]│ │ │                     ●  (keyframe 3)                │     │  │
│  │ │[Delete]├─┤                                                     │     │  │
│  │ └──────┘ │ │                                                     │     │  │
│  │          │ │                                                     │     │  │
│  │ ┌──────┐ │ │ TIMELINE (bottom of viewport)                     │     │  │
│  │ │Frame │ │ │ ┌─────────────────────────────────────────────┐  │     │  │
│  │ │  2   │ │ │ │●─────●──────────●────────────●  (keyframes) │  │     │  │
│  │ │ 3.2s │ │ │ │0s   2s        5s           8s             │  │     │  │
│  │ │[Edit]│ │ │ │Play ► | Duration: 8.5s | Speed: 1x       │  │     │  │
│  │ │[Delete]├─┤ └─────────────────────────────────────────────┘  │     │  │
│  │ └──────┘ │ │                                                     │     │  │
│  │          │ │                                                     │     │  │
│  │ ┌──────┐ │ │                                                     │     │  │
│  │ │Frame │ │ │                                                     │     │  │
│  │ │  3   │ │ │                                                     │     │  │
│  │ │ 8.0s │ │ │                                                     │     │  │
│  │ │[Edit]│ │ │                                                     │     │  │
│  │ │[Delete]├─┤                                                     │     │  │
│  │ └──────┘ │ │                                                     │     │  │
│  │          │ │                                                     │     │  │
│  │ [+Add    │ │                                                     │     │  │
│  │ Keyframe]│ │                                                     │     │  │
│  │          │ │                                                     │     │  │
│  └──────────┘ └─────────────────────────────────────────────────────┘     │  │
│                                                                             │
│  PROPERTIES PANEL (right, optional, collapsible)                           │  │
│  ┌──────────────────────────────────────────────────────────────┐         │  │
│  │ Keyframe 2 (Selected)                                         │         │  │
│  │ ────────────────────                                          │         │  │
│  │ Time: 3.2s [slider or input]                                │         │  │
│  │ Position: X: -2.5  Y: 1.2  Z: 8.5                           │         │  │
│  │ Rotation: X: 45°   Y: 90°   Z: 0°                           │         │  │
│  │ Ease Function: [Linear ▼]                                   │         │  │
│  │ (other options: Ease In, Ease Out, Ease In-Out)            │         │  │
│  │                                                              │         │  │
│  │ [Preview at this keyframe] [Copy coordinates]              │         │  │
│  └──────────────────────────────────────────────────────────────┘         │  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Left Panel (Keyframe List):**
  - Width: 200px, background rgba(15, 23, 42, 0.95), border-right 1px solid rgba(37, 99, 235, 0.2)
  - Padding: 12px, height calc(100vh - 56px), overflow-y: auto
  - Z-index: 100

  - **Keyframe Item:**
    - Background: rgba(37, 99, 235, 0.08) or rgba(37, 99, 235, 0.2) when selected
    - Border: 1px solid rgba(37, 99, 235, 0.15) or 1px solid rgba(37, 99, 235, 0.4) when selected
    - Padding: 8px
    - Border-radius: 4px
    - Margin-bottom: 6px
    - Cursor: pointer
    - Hover: border-color rgba(37, 99, 235, 0.4)

    - **Title:** Inter 600, 12px, color #e5e7eb
    - **Time:** Inter 400, 11px, color #6b7280
    - **Buttons (Edit, Delete):** 24px × 24px each, transparent background, color #6b7280

  - **Add Keyframe Button:**
    - Width: 100%, height: 32px
    - Margin-top: 8px
    - Background: rgba(37, 99, 235, 0.15)
    - Border: 1px dashed rgba(37, 99, 235, 0.3)
    - Color: #60a5fa, font Inter 500, 11px

- **3D Viewport:**
  - Margin-left: 200px
  - Camera path visible as smooth curve through space
  - Keyframe points: sphere 8px diameter, color #2563eb
  - Selected keyframe: color #8b5cf6, size 12px
  - Path line: stroke 2px, color rgba(37, 99, 235, 0.5)

- **Timeline (bottom of viewport):**
  - Height: 60px
  - Background: rgba(15, 23, 42, 0.95)
  - Border-top: 1px solid rgba(37, 99, 235, 0.2)
  - Padding: 12px

  - **Timeline Scrubber:**
    - Width: calc(100% - 200px), height: 4px
    - Background: rgba(37, 99, 235, 0.2)
    - Accent: linear-gradient(90deg, #2563eb, #8b5cf6)
    - Handle: 12px circle, drag-able

  - **Time Display:** JetBrains Mono 600, 12px, color #60a5fa
  - **Duration Display:** Inter 400, 11px, color #6b7280
  - **Speed Selector:** [1x ▼] or similar dropdown

- **Properties Panel (right, optional):**
  - Width: 280px (hidden by default, toggle via button)
  - Position: fixed right 0, top 56px
  - Background: rgba(15, 23, 42, 0.95), border-left 1px solid rgba(37, 99, 235, 0.2)
  - Padding: 16px, height calc(100vh - 56px), overflow-y: auto
  - Z-index: 90

  - **Input Fields:**
    - Time, Position XYZ, Rotation XYZ
    - Each: height 32px, background rgba(37, 99, 235, 0.1), border 1px solid rgba(37, 99, 235, 0.2)
    - Font: Inter 400, 12px

---

## Screen 3.3: Keyframe Timeline View

See Screen 3.2 for timeline base specifications.

**DETAILED TIMELINE SPECIFICATIONS:**

```
Timeline Layout (bottom portion of Screen 3.2):

┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ TIMELINE RULER (8.5s total duration, marked at 0s, 2s, 5s, 8s)        │ │
│ │                                                                         │ │
│ │  0s    1s    2s    3s    4s    5s    6s    7s    8s                  │ │
│ │  |     |     |     |     |     |     |     |     |                  │ │
│ │  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤                  │ │
│ │  ▼ (playhead - draggable, 2px width, color #60a5fa)                │ │
│ │                                                                         │ │
│ │ TRACK 1: Camera Position                                              │ │
│ │ ├─────●(kf1 at 0s)──────●(kf2 at 3.2s)────────●(kf3 at 8s)─┤      │ │
│ │ │                                                              │       │ │
│ │ │ Animation: Moving toward Sun                                │       │ │
│ │                                                                         │ │
│ │ TRACK 2: Camera Rotation                                              │ │
│ │ ├─────●(kf1 at 0s)──────●(kf2 at 3.2s)────────●(kf3 at 8s)─┤      │ │
│ │ │                                                              │       │ │
│ │ │ Animation: Rotating around target                           │       │ │
│ │                                                                         │ │
│ │ TRACK 3: Field of View (FOV)                                          │ │
│ │ ├─────●(kf1 at 0s)──────────────●(kf2 at 5s)────────────────┤      │ │
│ │ │                                                              │       │ │
│ │ │ Animation: Zoom in from 45° to 30° FOV                     │       │ │
│ │                                                                         │ │
│ │ [▶ Play] [| |Pause] | Duration: 8.5s | Speed: 1.0x | [Fit Timeline] │ │
│ │                                                                         │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Timeline Container:**
  - Height: 200px (expandable)
  - Background: rgba(15, 23, 42, 0.98)
  - Border-top: 1px solid rgba(37, 99, 235, 0.2)
  - Padding: 12px

- **Ruler:**
  - Height: 24px
  - Background: rgba(37, 99, 235, 0.05)
  - Tick marks: 1px height, color #6b7280
  - Labels: Inter 400, 10px, color #6b7280
  - Major ticks (1s intervals): 8px tall
  - Minor ticks (0.5s): 4px tall

- **Playhead:**
  - Position: absolute, vertical line
  - Width: 2px, color #60a5fa
  - Height: 100% of timeline
  - Cursor: ew-resize (when hovering)
  - Draggable via interaction
  - Z-index: 10

- **Track:**
  - Height: 40px
  - Background: alternating rgba(37, 99, 235, 0.02) and transparent
  - Border-bottom: 1px solid rgba(37, 99, 235, 0.1)
  - Margin-bottom: 4px

  - **Keyframe Node (on track):**
    - Size: 10px circle
    - Color: #2563eb or #8b5cf6 if selected
    - Border: 1px solid rgba(37, 99, 235, 0.5)
    - Hover: size increases to 12px, box-shadow 0 0 8px rgba(37, 99, 235, 0.6)
    - Draggable horizontally (changes keyframe time)
    - Cursor: grab or grabbing

  - **Keyframe Line (between nodes):**
    - Stroke: 1.5px, color rgba(37, 99, 235, 0.3)
    - Represents ease function curve (not visual representation, just connection)

- **Playback Controls:**
  - Display: flex, gap: 8px, align-items: center
  - Margin-top: 12px

  - **Play/Pause Button:** 32px × 32px, background rgba(37, 99, 235, 0.2), border 1px solid rgba(37, 99, 235, 0.4)
  - **Time Display:** JetBrains Mono 600, 12px, color #60a5fa
  - **Speed Selector:** 80px wide, background rgba(37, 99, 235, 0.1)

---

## Screen 3.4: Camera Position Save Dialog

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ SAVE CAMERA POSITION (modal, 450px wide)                            │  │
│  │ bg: rgba(15,23,42,0.98)                                             │  │
│  │                                                                      │  │
│  │ ┌────────────────────────────────────────────────────────────────┐  │  │
│  │ │ SAVE KEYFRAME                                              [✕] │  │  │
│  │ │ Add this camera position as a keyframe to your timeline       │  │  │
│  │ └────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                      │  │
│  │ Keyframe Name:                                                      │  │
│  │ ┌────────────────────────────────────────────────────────────────┐  │  │
│  │ │ Planet Mercury Approach (orbit 3)  [clear]                    │  │  │
│  │ └────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                      │  │
│  │ Insert Time:                                                        │  │
│  │ ┌────────────────────────────────────────────────────────────────┐  │  │
│  │ │ 3.2 (seconds)   [or use: ◉ Current time]                     │  │  │
│  │ │ [Slider showing timeline position]                           │  │  │
│  │ └────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                      │  │
│  │ CAMERA DATA (read-only preview):                                    │  │
│  │ ┌────────────────────────────────────────────────────────────────┐  │  │
│  │ │ Position:     X: -2.543  Y: 1.245  Z: 8.762 AU               │  │  │
│  │ │ Rotation:     X: 45.2°   Y: 90.0°  Z: -22.5°                 │  │  │
│  │ │ FOV:          35.0°                                            │  │  │
│  │ │ Target:       Mercury (manually set, or linked to object)     │  │  │
│  │ │                                                                │  │  │
│  │ │ Focus on: [Mercury ▼]  (auto-follow object)                   │  │  │
│  │ └────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                      │  │
│  │ Easing Function for next segment:                                   │  │
│  │ ◉ Linear    ○ Ease In    ○ Ease Out    ○ Ease In-Out              │  │
│  │                                                                      │  │
│  │ [Cancel]  [Save Keyframe]                                           │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Modal:** Position fixed center, width 450px, height auto
- **Input Fields:** Name, Time
  - Background: rgba(37, 99, 235, 0.1), border 1px solid rgba(37, 99, 235, 0.2)
  - Height: 40px, padding: 0 12px
  - Focus: border-color #2563eb, box-shadow 0 0 12px rgba(37, 99, 235, 0.3)

- **Camera Data Display:**
  - Background: rgba(37, 99, 235, 0.05), border 1px solid rgba(37, 99, 235, 0.15)
  - Padding: 12px, border-radius: 6px
  - Font: JetBrains Mono 400, 11px, color #60a5fa
  - Format: "Label: value [unit]" per line

- **Easing Options:** Radio buttons, 4 options in a row
- **Buttons:** [Cancel] [Save Keyframe], width 120px each, height 40px

---

## Screen 3.5: Batch Screenshot Capture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ BATCH SCREENSHOT CAPTURE (modal or sidebar-modal)                   │  │
│  │ bg: rgba(15,23,42,0.98)                                             │  │
│  │                                                                      │  │
│  │ ┌────────────────────────────────────────────────────────────────┐  │  │
│  │ │ BATCH CAPTURE SETTINGS                                     [✕] │  │  │
│  │ │ Generate frames from your camera path                        │  │  │
│  │ └────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                      │  │
│  │ INTERVAL SETTINGS:                                                  │  │
│  │ ┌────────────────────────────────────────────────────────────────┐  │  │
│  │ │ Capture every: [0.5 ▼] seconds                                 │  │  │
│  │ │ (With 8.5s path: ~17 frames)                                  │  │  │
│  │ │                                                                │  │  │
│  │ │ OR specify count: [16 ▼] frames (adjust interval to fit)     │  │  │
│  │ │                                                                │  │  │
│  │ │ Estimated file size: 45 MB (16 frames × 2048px each)         │  │  │
│  │ │                                                                │  │  │
│  │ └────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                      │  │
│  │ OUTPUT SETTINGS:                                                    │  │
│  │ ┌────────────────────────────────────────────────────────────────┐  │  │
│  │ │ Resolution: [2560x1440 ▼] (for YouTube, 4K content)          │  │  │
│  │ │ Format: ◉ PNG (lossless)  ○ JPEG (compressed)               │  │  │
│  │ │ Quality (JPEG): [████████░] 85%                               │  │  │
│  │ │ Background: ◉ Transparent  ○ Black                            │  │  │
│  │ │ Name prefix: [mercury_approach_] (filename prefix)            │  │  │
│  │ │                                                                │  │  │
│  │ └────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                      │  │
│  │ POST-PROCESSING:                                                    │  │
│  │ ☑ Add watermark (logo bottom-right)                                │  │
│  │ ☑ Add timestamp to corner                                          │  │
│  │ ☐ Auto-enhance color                                               │  │
│  │                                                                      │  │
│  │ [← Back]  [Preview First Frame]  [Start Capture →]                 │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Modal:** Position fixed center, width 500px
- **Interval Section:**
  - Inputs: [0.5 seconds], [16 frames] with spinners (±)
  - Frame count calculated and displayed dynamically
  - File size estimate: bottom, Inter 400, 12px, color #9ca3af

- **Resolution Dropdown:** 80px wide, options like 1920x1080, 2560x1440, 4096x2160
- **Format Radio:** PNG (lossless, larger) vs JPEG (compressed)
- **Quality Slider:** Visible only when JPEG selected, width 100%, shows percentage
- **Background Toggle:** Transparent (for compositing) or Black
- **Checkboxes:** Watermark, Timestamp, Color enhancement

- **Buttons:**
  - [Preview]: 120px, shows single frame preview
  - [Start Capture]: 150px, initiates batch process

---

## Screen 3.6: Recording in Progress Overlay

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 3D VIEWPORT (capturing in background)                               │  │
│  │                                                                      │  │
│  │ (slightly grayed or dimmed background)                              │  │
│  │                                                                      │  │
│  │                                                                      │  │
│  │       ┌─────────────────────────────────────────┐                  │  │
│  │       │  ● CAPTURING FRAMES...               [✕]│                  │  │
│  │       │                                         │                  │  │
│  │       │  Progress: ███████░░░░░░░░░░░ 42%    │                  │  │
│  │       │                                         │                  │  │
│  │       │  Elapsed: 00:45    Remaining: 01:02  │                  │  │
│  │       │                                         │                  │
│  │       │  Captured: 7 / 16 frames               │                  │  │
│  │       │  Current frame size: 2.8 MB            │                  │  │
│  │       │  Total size so far: 19.6 MB            │                  │  │
│  │       │                                         │                  │  │
│  │       │  ⚙ Settings   [Pause]   [Cancel]      │                  │  │
│  │       │                                         │                  │  │
│  │       └─────────────────────────────────────────┘                  │  │
│  │                                                                      │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Overlay Modal:**
  - Position: fixed center, width 350px, height auto
  - Background: rgba(15, 23, 42, 0.95), border 2px solid #2563eb
  - Padding: 24px, border-radius: 12px
  - Z-index: 600
  - Box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6)

- **Recording Indicator (●):**
  - Size: 12px circle, color #ef4444
  - Animation: pulse (opacity 1 → 0.5 over 1s, infinite)
  - Margin-right: 8px

- **Title:** Inter 600, 16px, color #f3f4f6

- **Progress Bar:**
  - Width: 100%, height: 6px
  - Background: rgba(37, 99, 235, 0.2)
  - Accent: linear-gradient(90deg, #2563eb, #8b5cf6)
  - Border-radius: 3px
  - Margin: 12px 0

- **Stats:**
  - Font: Inter 400, 12px, color #d1d5db
  - Format: "Label: value"
  - Line-height: 1.8

- **Buttons:**
  - ⚙ Settings: transparent background, color #6b7280
  - [Pause]: 80px, background rgba(245, 158, 11, 0.2), border 1px solid #f59e0b
  - [Cancel]: 80px, background rgba(239, 68, 68, 0.2), border 1px solid #ef4444

---

# JOURNEY 4: CASUAL EVENING EXPLORATION

**Persona:** Jennifer — Casual Explorer, evening browsing on iPad  
**Device:** iPad (1024x768 landscape), also supports iPhone (375x812 portrait)  
**Context:** Leisure discovery, social sharing, guided tours for non-experts  
**Design Approach:** Touch-first, large tap targets, visual storytelling, minimal jargon

---

## Screen 4.1: Simplified Home (iPad Touch-First)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ≡              Cosmos Explorer              ♡  ⋮                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Good Evening, Jennifer!                                                   │
│  Your personalized sky awaits.                                             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                                                                     │  │
│  │              [START GUIDED TOUR]                                   │  │
│  │          Tap to explore tonight's best objects                     │  │
│  │                                                                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ━━━━ CURATED FOR YOU ━━━━                                                │
│                                                                             │
│  Swipe left for more ↻                                                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│  │                  │  │                  │  │                  │         │
│  │   ◈              │  │   ◈              │  │   ◈              │         │
│  │                  │  │                  │  │                  │         │
│  │ M42 Orion Nebula │  │  Andromeda (M31) │  │ Pleiades Cluster │         │
│  │                  │  │                  │  │                  │         │
│  │ A stellar        │  │ Nearest large    │  │ Beautiful open   │         │
│  │ nursery 1,344 ly │  │ galaxy, 2.5M ly  │  │ cluster, 440 ly  │         │
│  │                  │  │                  │  │                  │         │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘         │
│                                                                             │
│  ━━━━ RECENT BOOKMARKS ━━━━                                               │
│                                                                             │
│  [Saturn] [Vega] [Ring Nebula] [Betelgeuse]  [+ Browse all]              │
│                                                                             │
│  ━━━━ QUICK ACTIONS ━━━━                                                  │
│                                                                             │
│  [☀ Browse by Type]  [🔍 Search]  [🗓 Calendar]  [⚙ Settings]            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Screen Layout:**
  - Viewport: 1024x768px (iPad landscape)
  - Safe area insets: 16px all edges (landscape safe area)
  - Background: Deep Space Black #0a0a1a

- **Header:**
  - Height: 56px, Inter 600, 18px, color #f3f4f6
  - Left: Menu icon (≡), width 44px × 44px tap target
  - Center: "Cosmos Explorer" text
  - Right: Heart icon (♡) 44px × 44px, More menu (⋮) 44px × 44px
  - Bottom border: 1px solid rgba(37, 99, 235, 0.3)

- **Greeting Section:**
  - Margin-top: 24px
  - "Good Evening, Jennifer!" — Inter 600, 24px, color #f3f4f6
  - Subtext — Inter 400, 14px, color #9ca3af
  - Margin-bottom: 24px

- **Start Tour Button:**
  - Width: calc(100% - 32px), height: 72px
  - Background: linear-gradient(135deg, #2563eb, #8b5cf6)
  - Border-radius: 16px
  - Text: Inter 700, 16px, color #ffffff
  - Box-shadow: 0 4px 16px rgba(37, 99, 235, 0.3)
  - Tap states:
    - **Active:** scale 0.98, shadow increases
    - **Hover (pointer):** shadow 0 6px 20px rgba(37, 99, 235, 0.4)

- **Curated Carousel Section:**
  - Title: Inter 600, 14px, color #d1d5db, all-caps, letter-spacing 1px
  - Swipe indicator: Inter 400, 12px, color #6b7280, right-aligned
  - Card width: 280px, height: 220px each
  - Card background: rgba(37, 99, 235, 0.1), border 1px solid rgba(37, 99, 235, 0.3)
  - Border-radius: 12px, overflow hidden
  - Spacing between cards: 12px
  - Horizontal scroll enabled, snap to card
  - Card content:
    - Object icon (◈): size 48px, color #f59e0b, centered top
    - Object name: Inter 700, 16px, color #ffffff
    - Description: Inter 400, 12px, color #d1d5db, max 2 lines
    - Tap expands card, triggers navigation to detailed view

- **Recent Bookmarks:**
  - Title: Inter 600, 14px, color #d1d5db, all-caps
  - Buttons: height 32px, background rgba(139, 92, 246, 0.15), border 1px solid #8b5cf6
  - Text: Inter 500, 12px, color #a78bfa
  - Border-radius: 6px, padding 8px 12px
  - "+ Browse all" — 48px wide
  - Horizontal scroll with snap

- **Quick Actions:**
  - Title: Inter 600, 14px, color #d1d5db, all-caps
  - 4 buttons in grid: 2×2 on phone (375px), 4×1 on tablet (1024px)
  - Button height: 48px, width: calc(25% - 9px)
  - Background: rgba(37, 99, 235, 0.15), border 1px solid rgba(37, 99, 235, 0.3)
  - Border-radius: 12px
  - Text: Inter 600, 13px, color #93c5fd
  - Icon size: 20px, color #60a5fa
  - Tap: ripple effect, scale 0.96

---

## Screen 4.2: Curated Highlights Carousel

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ◄              M42 Orion Nebula              ✓  ⋮                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ╔═════════════════════════════════════════════════════════════════════╗  │
│  ║                                                                     ║  │
│  ║                      [Object Preview Area]                         ║  │
│  ║                  (High-res image or 3D render)                     ║  │
│  ║                                                                     ║  │
│  ║                                                                     ║  │
│  ║                                                                     ║  │
│  ╚═════════════════════════════════════════════════════════════════════╝  │
│                                                                             │
│  M42 Orion Nebula                                                          │
│                                                                             │
│  A vast cloud of gas and dust where stars are being born. Located in      │
│  Orion's sword, it's one of the most famous stellar nurseries.            │
│                                                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                             │
│  Distance: 1,344 light-years  |  Size: ~13 light-years wide              │
│                                                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                             │
│  [📸 Screenshot]   [♡ Bookmark]   [EXPLORE IN 3D →]                      │
│                                                                             │
│  ◄  Swipe left for next ▼                                                 │
│                                                                             │
│  ○ ● ○  (Carousel indicator)                                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Screen Layout:**
  - Background: Deep Space Black #0a0a1a
  - Full-screen carousel card experience

- **Header:**
  - Height: 56px
  - Left: Back arrow (◄), 44px × 44px tap target
  - Center: Object name (title), Inter 600, 16px, color #f3f4f6
  - Right: Checkmark (✓) indicating in tour, more menu (⋮)

- **Preview Container:**
  - Width: calc(100% - 32px), height: 380px
  - Border: 2px solid rgba(37, 99, 235, 0.4)
  - Border-radius: 16px
  - Background: linear-gradient(135deg, rgba(37, 99, 235, 0.05), rgba(139, 92, 246, 0.05))
  - Image/render: object-fit cover, aspect-ratio preserved
  - Placeholder animation: shimmer (linear-gradient animation left-to-right, 2s infinite)

- **Object Title:**
  - Inter 700, 24px, color #ffffff, margin-top: 20px

- **Description Text:**
  - Inter 400, 14px, color #d1d5db
  - Line-height: 1.6
  - Max-width: 100%, margin: 12px 0 20px 0

- **Divider:**
  - 1px solid rgba(37, 99, 235, 0.3), margin: 12px 0

- **Key Facts Row:**
  - Grid: 2 columns
  - Distance: Inter 600, 12px, color #60a5fa, label above in Inter 400, 10px, #9ca3af
  - Size: Inter 600, 12px, color #60a5fa, label above in Inter 400, 10px, #9ca3af
  - Divider between: 1px solid rgba(37, 99, 235, 0.3)

- **Action Buttons:**
  - Width: calc(33.33% - 8px), height: 44px
  - Background: rgba(37, 99, 235, 0.2), border 1px solid #2563eb
  - Border-radius: 8px
  - Text: Inter 600, 12px, color #93c5fd
  - Tap states:
    - **Active:** background rgba(37, 99, 235, 0.4), shadow 0 4px 12px
    - **Ripple:** white ripple animation from center

- **Carousel Navigation:**
  - Swipe left: advance to next object
  - Swipe right: go to previous object
  - Indicator dots below: 8px circles, spacing 8px, inactive #6b7280, active #2563eb

- **Gesture Feedback:**
  - On swipe start: opacity of card slightly decreases
  - On swipe mid-gesture: translate card with finger
  - On swipe complete: snap to next card with spring animation (stiffness 200, damping 25)

---

## Screen 4.3: Touch Gesture Onboarding

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ≡              Cosmos Explorer              ✕                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Learn How to Explore                                                      │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                                                                     │  │
│  │                      ╭─────────┐                                   │  │
│  │              ╭───────┤  PINCH   ├────────╮                         │  │
│  │              │       ╰─────────┘        │                         │  │
│  │              ↙                          ↘                         │  │
│  │         ┌─────┐                    ┌─────┐                        │  │
│  │         │  ◈  │        ZOOM        │  ◈  │ (larger)              │  │
│  │         └─────┘                    └─────┘                        │  │
│  │                                                                     │  │
│  │  Spread two fingers to zoom in, pinch to zoom out                 │  │
│  │                                                                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                                                                     │  │
│  │           ╔══════╗                    ╔══════╗                     │  │
│  │       ───→║  ◈   ║ ←DRAG/ROTATE→ ║  ◈  ║←──               │  │
│  │           ╚══════╝                    ╚══════╝                     │  │
│  │                                                                     │  │
│  │  Drag one finger to rotate the universe view                       │  │
│  │                                                                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                                                                     │  │
│  │                       ◈ TAP TO SELECT                              │  │
│  │                         │                                           │  │
│  │                         ▼                                           │  │
│  │            ╔════════════════════╗                                  │  │
│  │            ║  Name: M42 Nebula  ║ (info panel appears)            │  │
│  │            ╚════════════════════╝                                  │  │
│  │                                                                     │  │
│  │  Tap any star or object to see information                         │  │
│  │                                                                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                                                                     │  │
│  │                    ◈  DOUBLE-TAP TO FLY                            │  │
│  │                    │                                                │  │
│  │                    ▼▼  (camera zooms & flies)                      │  │
│  │            ╔════════════════════╗                                  │  │
│  │            ║   Entering M42...  ║                                  │  │
│  │            ╚════════════════════╝                                  │  │
│  │                                                                     │  │
│  │  Double-tap to fly directly to an object                           │  │
│  │                                                                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  [Got it! Start exploring →]                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Modal/Full Screen:**
  - Background: Deep Space Black #0a0a1a
  - Can be dismissed with ✕ button (top-right, 44px × 44px)
  - Can be dismissed by swiping down (threshold 100px)

- **Title:**
  - Inter 700, 28px, color #ffffff
  - Margin-bottom: 24px

- **Gesture Card (4 total):**
  - Width: calc(100% - 32px), background: rgba(37, 99, 235, 0.1)
  - Border: 2px solid rgba(37, 99, 235, 0.4), border-radius: 12px
  - Padding: 20px
  - Margin-bottom: 16px

- **Gesture Animation Area:**
  - Height: 120px, centered
  - Contains illustrated hand/gesture SVGs with animation

- **Gesture Label:**
  - Inter 700, 14px, color #f59e0b, all-caps, centered
  - Margin-bottom: 8px

- **Gesture Description:**
  - Inter 400, 13px, color #d1d5db
  - Text-align: center
  - Margin-top: 12px

- **Animations:**
  - **Pinch gesture:** Two circles start 80px apart, animate to 40px apart, repeat every 2s
  - **Drag gesture:** Circle slides left-right continuously (3s duration, ease-in-out)
  - **Double-tap gesture:** Tap animation + zoom-in animation staggered
  - All animations use 500ms ease-out for gesture completion

- **CTA Button:**
  - Width: calc(100% - 32px), height: 56px
  - Background: linear-gradient(135deg, #2563eb, #8b5cf6)
  - Border-radius: 12px
  - Text: Inter 700, 16px, color #ffffff
  - Margin-top: 24px
  - Tap: scale 0.96, ripple

---

## Screen 4.4: Guided Tour In Progress

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ◄              Tonight's Best Objects (4 of 7)              ✕              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║                                                                       ║  │
│  ║                     [3D Visualization Area]                          ║  │
│  ║                  Auto-navigating to next target                      ║  │
│  ║                                                                       ║  │
│  ║                          ◈ M57 Ring Nebula                           ║  │
│  ║                                                                       ║  │
│  ║                                                                       ║  │
│  ║                                                                       ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  🔊 Narration: "This beautiful planetary nebula is a shell of      │  │
│  │  glowing gas ejected by a dying star. Its ring shape makes it one  │  │
│  │  of the most striking objects in the summer sky."                  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Progress: ████████░░░░░░░░░░ 4 of 7 objects                             │
│                                                                             │
│  [◄◄ Previous]  [⏸ Pause]  [⏭ Skip]  [Next ▶▶]                           │
│                                                                             │
│  ● ● ○ ○ ○ ○ ○   (Dot indicator for each object in tour)                │
│                                                                             │
│  Next: Vega (brightest star in Lyra)                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Header:**
  - Height: 56px
  - Left: Back arrow (◄)
  - Center: "Tonight's Best Objects (X of Y)", Inter 600, 16px, color #f3f4f6
  - Right: Close (✕)

- **3D Viewport:**
  - Width: calc(100% - 32px), aspect-ratio: 16/9 (responsive)
  - Border: 2px solid rgba(37, 99, 235, 0.3)
  - Border-radius: 12px
  - Background: linear-gradient(to bottom, rgba(37, 99, 235, 0.05), rgba(139, 92, 246, 0.05))
  - Displays WebGL rendered 3D universe with current object centered
  - Auto-rotation every 3-5 seconds (camera orbit animation)

- **Current Object Label (overlay on viewport):**
  - Position: bottom-center, offset 12px from edge
  - Background: rgba(10, 10, 26, 0.8), backdrop-filter blur(8px)
  - Padding: 12px 16px, border-radius: 8px
  - Text: Inter 600, 14px, color #60a5fa

- **Narration Box:**
  - Background: rgba(37, 99, 235, 0.15), border 1px solid rgba(37, 99, 235, 0.3)
  - Border-radius: 12px, padding: 16px
  - Margin: 16px 0

- **Narration Icon (🔊):**
  - Size: 20px, color #f59e0b
  - Margin-right: 8px, vertical-align: text-top

- **Narration Text:**
  - Inter 400, 13px, color #d1d5db
  - Line-height: 1.6
  - Max-height: 80px, overflow: hidden, text-overflow: ellipsis
  - Animated text reveal: characters appear at 50ms interval

- **Progress Bar:**
  - Width: calc(100% - 32px), height: 6px
  - Background: rgba(37, 99, 235, 0.2)
  - Accent: linear-gradient(90deg, #2563eb, #8b5cf6)
  - Border-radius: 3px
  - Percentage label right: Inter 400, 11px, color #9ca3af

- **Control Buttons:**
  - Grid: 4 equal columns, height: 44px
  - Background: rgba(37, 99, 235, 0.15), border 1px solid rgba(37, 99, 235, 0.3)
  - Text: Inter 600, 12px, color #93c5fd
  - Border-radius: 8px
  - Tap: ripple + scale 0.96

- **Progress Dots:**
  - 8px circles, spacing 8px, inactive #6b7280, active #2563eb
  - Filled dots for visited objects, outline for upcoming
  - Margin: 12px 0

- **Next Preview:**
  - Inter 400, 12px, color #9ca3af
  - Format: "Next: [Object Name] (brief descriptor)"

---

## Screen 4.5: Simplified Object Info (No Jargon)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ◄              M31 Andromeda Galaxy              ⋮                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║                                                                       ║  │
│  ║                     [High-res image/render]                          ║  │
│  ║                                                                       ║  │
│  ║                                                                       ║  │
│  ║                                                                       ║  │
│  ║                                                                       ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                             │
│  Andromeda Galaxy (M31)                                                    │
│  Our neighbor, 2.5 million light-years away                               │
│                                                                             │
│  What Is It?                                                               │
│  A massive spiral galaxy very similar to our Milky Way. It contains over  │
│  1 trillion stars and is on a collision course with the Milky Way in     │
│  about 4.5 billion years.                                                 │
│                                                                             │
│  Did You Know?                                                             │
│  ⭐ Andromeda is the most distant object you can see with your naked eye  │
│  ⭐ Its light has been traveling for 2.5 million years to reach us        │
│  ⭐ It's actually 3 times wider in the sky than the full moon             │
│                                                                             │
│  Size Comparison                                                           │
│  ├─ Moon (as seen from Earth): [████]                                    │
│  ├─ Andromeda (as seen from Earth): [████████████████████████████]        │
│  └─ (Andromeda spans ~6 full moons across the sky!)                      │
│                                                                             │
│  Distance: 2.537 million light-years                                      │
│  (In person: impossible. By light-speed craft: 2.537 million years)       │
│                                                                             │
│  Best Time to View: September to February                                 │
│  Look: Northeast sky after sunset                                         │
│                                                                             │
│  [📸 Screenshot]  [♡ Save]  [➤ Share to Instagram]  [➤ Share to Msg]    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Header:**
  - Height: 56px, back button + title + more menu (⋮)

- **Image Container:**
  - Width: calc(100% - 32px), aspect-ratio: 1, border-radius: 12px
  - Border: 2px solid rgba(37, 99, 235, 0.3)
  - Background: linear-gradient(135deg, rgba(37, 99, 235, 0.05), rgba(139, 92, 246, 0.05))
  - Margin-bottom: 20px

- **Object Title:**
  - Inter 700, 24px, color #ffffff
  - Subtitle below: Inter 400, 13px, color #9ca3af

- **Section Headers:**
  - Inter 700, 14px, color #f3f4f6, all-caps, letter-spacing 0.5px
  - Margin-top: 16px, margin-bottom: 8px

- **Description Text:**
  - Inter 400, 13px, color #d1d5db, line-height: 1.6

- **Did You Know Section:**
  - Background: rgba(139, 92, 246, 0.1), border-left 3px solid #8b5cf6
  - Padding: 12px 12px 12px 16px, border-radius: 4px
  - Each fact: Inter 400, 12px, color #d1d5db, bullet ⭐, margin-bottom: 6px

- **Size Comparison:**
  - Comparison bars: background rgba(37, 99, 235, 0.2), height 24px
  - Label: Inter 500, 11px, color #9ca3af, right-aligned
  - Bar fill: #2563eb with rounded ends
  - Explanation below: Inter 400, 11px, color #9ca3af, italics

- **Key Facts:**
  - Format: "Label: value"
  - Label: Inter 600, 11px, color #9ca3af
  - Value: Inter 600, 12px, color #60a5fa
  - Additional context: Inter 400, 11px, color #9ca3af, below
  - Dividers: 1px solid rgba(37, 99, 235, 0.3) between facts

- **Viewing Guide:**
  - Background: rgba(16, 185, 129, 0.1), border-left 3px solid #10b981
  - Padding: 12px 16px, border-radius: 4px
  - Lines: "Best Time:" (Inter 600, 12px, #10b981) + value (Inter 400, 12px, #d1d5db)

- **Action Buttons:**
  - Width: calc(25% - 9px), height: 44px (4-column grid on tablet)
  - On mobile: 2-column grid, stacked buttons
  - Background: rgba(37, 99, 235, 0.15), border 1px solid rgba(37, 99, 235, 0.3)
  - Text: Inter 600, 11px, color #93c5fd
  - Border-radius: 8px
  - Tap: ripple + scale 0.96

---

## Screen 4.6: Screenshot Capture (Social-Optimized)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║                                                                       ║  │
│  ║                     [3D Viewport - Full Screen]                      ║  │
│  ║                   (all UI hidden for clean shot)                     ║  │
│  ║                                                                       ║  │
│  ║                          ◈ M42 Orion Nebula                          ║  │
│  ║                                                                       ║  │
│  ║                                                                       ║  │
│  ║                                                                       ║  │
│  ║                                                                       ║  │
│  ║                                                                       ║  │
│  ║                                                                       ║  │
│  ║                                                                       ║  │
│  ║                                                                       ║  │
│  ║                                                                       ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                             │
│                                                                             │
│         ┌─────────────────────────────────────────┐                        │
│         │  ADD A CAPTION                          │                        │
│         │  ┌──────────────────────────────────┐  │                        │
│         │  │ "Just captured this amazing...   │  │                        │
│         │  │ #CosmosExplorer #Astronomy"      │  │                        │
│         │  └──────────────────────────────────┘  │                        │
│         │                                         │                        │
│         │  [✓ Add caption]                       │                        │
│         └─────────────────────────────────────────┘                        │
│                                                                             │
│  [← Back]  [📸 Take Another]  [➤ Instagram]  [➤ Messages]               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Full-Screen Viewport:**
  - Background: Deep Space Black #0a0a1a
  - WebGL canvas fills entire screen
  - All UI elements hidden (opacity: 0, pointer-events: none)
  - Z-index isolated from normal document flow

- **Captured Image Resolution:**
  - Device native: 1024×768 (iPad landscape) or 375×812 (iPhone portrait)
  - Export resolution: 2× scale (2048×1536 or 750×1624)
  - Format: PNG 32-bit for transparency support
  - Save to device camera roll automatically after capture

- **Caption Overlay Modal (appears after capture):**
  - Position: fixed bottom, width 100%, background rgba(10, 10, 26, 0.95)
  - Border-top: 1px solid rgba(37, 99, 235, 0.3)
  - Padding: 20px
  - Border-radius-top: 12px (on mobile), 0 on tablet

- **Caption Input:**
  - Text area, height 80px, width calc(100% - 32px)
  - Background: rgba(37, 99, 235, 0.1), border 1px solid rgba(37, 99, 235, 0.3)
  - Border-radius: 8px, padding: 12px
  - Font: Inter 400, 13px, color #ffffff
  - Placeholder: "Add a caption (optional)", color #6b7280
  - Max length: 280 characters
  - Character counter below: Inter 400, 10px, color #9ca3af

- **Checkbox:**
  - ☑ "Add caption" toggle, default unchecked
  - When checked: caption input appears with slide-down animation (200ms ease-out)

- **Action Buttons:**
  - [← Back]: 80px width, background transparent, border none, text color #6b7280
  - [📸 Take Another]: 120px, background rgba(37, 99, 235, 0.15), border 1px solid #2563eb
  - [➤ Instagram]: 120px, background rgba(59, 130, 246, 0.2), border 1px solid #3b82f6
  - [➤ Messages]: 120px, background rgba(139, 92, 246, 0.2), border 1px solid #8b5cf6
  - Height: 44px all, Inter 600, 12px
  - Tap: ripple + scale 0.96

- **Share Integration:**
  - Clicking Instagram/Messages opens native share sheet (iOS) or share dialog (Android)
  - Pre-fills caption if provided
  - Tags: #CosmosExplorer, #Astronomy, object name hashtag
  - Auto-adds watermark (Cosmos Explorer logo) bottom-right corner (40px × 40px, opacity 0.7)

---

## Screen 4.7: "More Like This" Recommendations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ◄              M42 Orion Nebula              ♡                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║                       [Object Image/Render]                          ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                             │
│  M42 Orion Nebula                                                          │
│  A stellar nursery 1,344 light-years away                                 │
│                                                                             │
│  ━━━━ SIMILAR NEBULAE ━━━━                                                │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                     │
│  │              │  │              │  │              │                     │
│  │      ◈       │  │      ◈       │  │      ◈       │                     │
│  │              │  │              │  │              │                     │
│  │  M20 Trifid  │  │ M16 Eagle    │  │ M27 Dumbbell │                     │
│  │  Nebula      │  │ Nebula       │  │ Nebula       │                     │
│  │              │  │              │  │              │                     │
│  │  3,900 ly    │  │  7,000 ly    │  │  1,200 ly    │                     │
│  │              │  │              │  │              │                     │
│  └──────────────┘  └──────────────┘  └──────────────┘                     │
│        △                  △                  △                             │
│       Tap to explore                                                       │
│                                                                             │
│  ━━━━ BROWSE CATEGORIES ━━━━                                              │
│                                                                             │
│  [🌫 More Nebulae]  [⭐ More Star Clusters]  [🌌 More Galaxies]           │
│                                                                             │
│  ━━━━ YOU MIGHT ALSO LIKE (Based on your views) ━━━━                     │
│                                                                             │
│  ┌────────────────────────────────────────┐                               │
│  │ Horsehead Nebula (B33)                 │  3,900 ly                     │
│  │ A dark nebula that looks like a horse  │  Similar: emission nebula     │
│  └────────────────────────────────────────┘                               │
│                                                                             │
│  ┌────────────────────────────────────────┐                               │
│  │ Crab Nebula (M1)                       │  6,500 ly                     │
│  │ Remnant of a supernova explosion       │  Similar: cosmic event        │
│  └────────────────────────────────────────┘                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Header & Main Image:**
  - Standard header (56px) with back, title, bookmark heart
  - Image container: width calc(100% - 32px), aspect-ratio 1, border-radius 12px

- **Object Title & Description:**
  - Title: Inter 700, 20px, color #ffffff
  - Subtitle: Inter 400, 12px, color #9ca3af

- **Similar Objects Section:**
  - Title: Inter 600, 12px, color #d1d5db, all-caps, letter-spacing 1px
  - Card grid: 3 columns on tablet, 2 on phone
  - Card dimensions: width calc(33.33% - 8px), height 180px
  - Card background: rgba(37, 99, 235, 0.1), border 1px solid rgba(37, 99, 235, 0.3)
  - Border-radius: 12px, overflow hidden

- **Card Content:**
  - Image area: height 100px, object-fit cover
  - Object icon (◈): 32px, color #f59e0b, centered in image
  - Title: Inter 600, 13px, color #ffffff, padding: 8px 12px
  - Distance: Inter 400, 11px, color #9ca3af
  - Tap: ripple effect + scale 0.97, navigates to that object

- **Category Buttons:**
  - Width: calc(33.33% - 8px), height: 44px
  - Background: rgba(37, 99, 235, 0.15), border 1px solid rgba(37, 99, 235, 0.3)
  - Text: Inter 600, 12px, color #93c5fd
  - Border-radius: 8px
  - Icon: 16px, margin-right 6px

- **"You Might Also Like" Section:**
  - Title: Inter 600, 12px, color #d1d5db, all-caps
  - Recommendation cards: full-width (calc(100% - 32px))
  - Background: rgba(139, 92, 246, 0.1), border 1px solid rgba(139, 92, 246, 0.3)
  - Border-radius: 8px, padding: 12px

- **Recommendation Card Content:**
  - Title: Inter 600, 14px, color #ffffff
  - Distance: Inter 400, 11px, color #9ca3af, right-aligned
  - Description: Inter 400, 12px, color #d1d5db, margin-top: 4px
  - Similar note: Inter 400, 11px, color #a78bfa, italics
  - Tap: navigates to object detail

---

## Screen 4.8: Session Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ◄              Session Summary              ✕                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ✓ Great Evening of Exploring!                                            │
│                                                                             │
│  You explored 5 cosmic objects tonight                                     │
│  Time spent: 24 minutes                                                    │
│  Distance traveled: 2.5 million light-years (virtually!)                   │
│                                                                             │
│  ━━━━ TONIGHT'S DISCOVERIES ━━━━                                          │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                     │
│  │              │  │              │  │              │                     │
│  │      ◈       │  │      ◈       │  │      ◈       │                     │
│  │              │  │              │  │              │                     │
│  │ M42 Orion    │  │  M31 Galaxy  │  │  M57 Ring    │                     │
│  │              │  │              │  │              │                     │
│  └──────────────┘  └──────────────┘  └──────────────┘                     │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐                                        │
│  │              │  │              │                                        │
│  │      ◈       │  │      ◈       │                                        │
│  │              │  │              │                                        │
│  │  Pleiades    │  │  Saturn      │                                        │
│  │              │  │              │                                        │
│  └──────────────┘  └──────────────┘                                        │
│                                                                             │
│  ━━━━ YOUR BOOKMARKS ━━━━                                                 │
│                                                                             │
│  3 objects saved to explore later                                          │
│  [View All Bookmarks]                                                      │
│                                                                             │
│  ━━━━ ACHIEVEMENTS UNLOCKED ━━━━                                          │
│                                                                             │
│  🏆 First Steps: Completed your first guided tour                         │
│  🏆 Explorer: Viewed 5 different objects in one session                   │
│                                                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                             │
│  [Continue Tomorrow?]                                                      │
│                                                                             │
│  Set a reminder for tomorrow at 8:00 PM to resume your exploration        │
│  [Yes, remind me]  [Maybe later]                                           │
│                                                                             │
│  [← Back to Home]                                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Header:**
  - Height: 56px, title + close button

- **Success Message:**
  - ✓ Icon: 32px, color #10b981, circular background rgba(16, 185, 129, 0.2)
  - Title: Inter 700, 20px, color #10b981
  - Stats below: Inter 400, 12px, color #d1d5db, line-height: 1.8
  - Margin-bottom: 24px

- **Discoveries Grid:**
  - Title: Inter 600, 12px, color #d1d5db, all-caps
  - Grid: 3 columns on tablet, 2 on phone
  - Card dimensions: width calc(33.33% - 8px), height 150px
  - Card background: rgba(37, 99, 235, 0.1), border 1px solid rgba(37, 99, 235, 0.3)
  - Border-radius: 12px, overflow hidden, object-fit cover
  - Title: Inter 600, 12px, color #ffffff, center bottom, padding: 8px
  - Background-image: gradient overlay (top transparent to rgba(10, 10, 26, 0.9) bottom)

- **Bookmarks Section:**
  - Title: Inter 600, 12px, color #d1d5db, all-caps
  - Count: Inter 600, 14px, color #60a5fa
  - Button: [View All Bookmarks], width calc(100% - 32px), height 40px
  - Background: rgba(139, 92, 246, 0.15), border 1px solid #8b5cf6
  - Text: Inter 600, 12px, color #a78bfa

- **Achievements Section:**
  - Title: Inter 600, 12px, color #d1d5db, all-caps
  - Achievement items:
    - 🏆 Icon: 24px, color #f59e0b
    - Title: Inter 600, 12px, color #ffffff
    - Description: Inter 400, 11px, color #9ca3af
    - Background: rgba(245, 158, 11, 0.1), border-left 3px solid #f59e0b
    - Padding: 12px 12px 12px 16px, border-radius: 4px
    - Margin-bottom: 8px

- **Divider:**
  - 2px dashed, color rgba(37, 99, 235, 0.3), margin: 20px 0

- **Reminder Section:**
  - Title: Inter 600, 14px, color #ffffff
  - Subtitle: Inter 400, 12px, color #d1d5db
  - Buttons:
    - [Yes, remind me]: width calc(50% - 6px), height 44px, background linear-gradient(135deg, #2563eb, #8b5cf6)
    - [Maybe later]: width calc(50% - 6px), height 44px, background rgba(37, 99, 235, 0.15), border 1px solid #2563eb
  - Text: Inter 600, 12px, color #ffffff / #93c5fd
  - Border-radius: 8px
  - Tap: ripple + scale 0.96

- **Back Button:**
  - [← Back to Home], width calc(100% - 32px), height 44px
  - Background: transparent, border none, text color #6b7280
  - Margin-top: 16px

---

# JOURNEY 5: OBSERVATION PLANNING

**Persona:** Bob — Amateur Astronomer, pursuing Messier Catalog completionist goals  
**Device:** Desktop/Tablet (1920×1080 landscape preferred, responsive to 1024px)  
**Context:** Planning nightly observations, tracking observations, optimizing sky conditions  
**Design Approach:** Data-rich, precise controls, technical accuracy, session-focused workflow

---

## Screen 5.1: Location & Time Setup

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ◄              Observation Planner              ⋮                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  OBSERVATION LOCATION & TIME                                               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                                                                     │  │
│  │  Location                                                           │  │
│  │  ┌────────────────────────────────────┐                           │  │
│  │  │ Type your city or coordinates    ▼ │                           │  │
│  │  │ Search: Austin, TX                │                           │  │
│  │  └────────────────────────────────────┘                           │  │
│  │                                                                     │  │
│  │  [🗺 Use My Current Location (GPS)]                               │  │
│  │                                                                     │  │
│  │  Latitude: 30.2672° N                                              │  │
│  │  Longitude: 97.7431° W                                             │  │
│  │  Elevation: 165 m                                                  │  │
│  │  Timezone: America/Chicago (CDT, UTC-5)                            │  │
│  │                                                                     │  │
│  │  ─────────────────────────────────────────────────────             │  │
│  │                                                                     │  │
│  │  Observation Date                                                   │  │
│  │  [Today, April 16] ▼    [April 2026] ▼    [2026] ▼               │  │
│  │                                                                     │  │
│  │  Observation Start Time                                             │  │
│  │  [08 : 00 PM] ▼                                                    │  │
│  │  (Local time; will auto-update for twilight events)                │  │
│  │                                                                     │  │
│  │  ─────────────────────────────────────────────────────             │  │
│  │                                                                     │  │
│  │  ☑ Automatically adjust for civil twilight (sunset + 15 min)      │  │
│  │  ☑ Include astronomical twilight (sunset + 50 min) for alerts     │  │
│  │                                                                     │  │
│  │  ─────────────────────────────────────────────────────             │  │
│  │                                                                     │  │
│  │  [← Back]  [Next: Tonight's Sky →]                                │  │
│  │                                                                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Title Section:**
  - Header: 56px, back button + title + menu
  - Section title: Inter 700, 18px, color #f3f4f6

- **Location Card:**
  - Background: rgba(37, 99, 235, 0.1), border 1px solid rgba(37, 99, 235, 0.3)
  - Border-radius: 12px, padding: 20px
  - Margin-bottom: 24px

- **Location Search Input:**
  - Width: calc(100% - 32px), height: 44px
  - Background: rgba(10, 10, 26, 0.6), border 1px solid rgba(37, 99, 235, 0.4)
  - Border-radius: 8px, padding: 12px 16px
  - Font: Inter 400, 13px, color #f3f4f6
  - Placeholder: "Type your city or coordinates", color #6b7280
  - Dropdown indicator (▼): color #9ca3af, right: 12px
  - Focus: border-color #2563eb, box-shadow 0 0 0 3px rgba(37, 99, 235, 0.2)
  - Autocomplete results: list below, max-height 200px, overflow-y auto

- **GPS Button:**
  - Width: calc(100% - 32px), height: 40px
  - Background: rgba(16, 185, 129, 0.15), border 1px solid #10b981
  - Text: Inter 600, 12px, color #6ee7b7
  - Border-radius: 8px
  - Icon (🗺): margin-right 8px
  - Tap: ripple + scale 0.96

- **Coordinate Display:**
  - Background: transparent, no border
  - Latitude: Inter 600, 12px, color #60a5fa, label Inter 400, 10px, #9ca3af
  - Longitude: same styling
  - Elevation: same styling
  - Timezone: Inter 600, 12px, color #a78bfa, label Inter 400, 10px, #9ca3af
  - Format: editable fields (click to edit manually)
  - Line-height: 2

- **Divider:**
  - 1px solid rgba(37, 99, 235, 0.3), margin: 16px 0

- **Date/Time Section:**
  - Background: transparent
  - Labels: Inter 600, 11px, color #9ca3af, all-caps, letter-spacing 0.5px

- **Date Picker:**
  - 3 dropdowns in a row: Day, Month, Year
  - Each: height 40px, background rgba(10, 10, 26, 0.6), border 1px solid rgba(37, 99, 235, 0.4)
  - Width: calc(33.33% - 8px), border-radius: 6px
  - Text: Inter 500, 12px, color #f3f4f6

- **Time Picker:**
  - Format: HH : MM AM/PM
  - 2 input fields (hours, minutes) with spinner buttons (↑↓)
  - Width: 80px each, height: 40px
  - Background: rgba(10, 10, 26, 0.6), border 1px solid rgba(37, 99, 235, 0.4)
  - Spinner buttons: 24px wide, background transparent, color #9ca3af
  - Increment on click, wraps at 24h / 60m

- **Checkboxes:**
  - 16px × 16px, background transparent, border 2px solid rgba(37, 99, 235, 0.4)
  - When checked: background #2563eb, checkmark ✓ white
  - Label next to: Inter 400, 12px, color #d1d5db
  - Margin: 8px 0

- **Navigation Buttons:**
  - [← Back]: 80px width, background transparent, text #6b7280
  - [Next: Tonight's Sky →]: calc(100% - 88px), background linear-gradient(135deg, #2563eb, #8b5cf6)
  - Height: 44px, text: Inter 600, 12px, color #ffffff / #6b7280
  - Border-radius: 8px
  - Tap: ripple + scale 0.96

---

## Screen 5.2: Tonight's Sky View

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ◄              Tonight's Sky — Austin, TX @ 8:00 PM              ⋮        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║                                                                       ║  │
│  ║          [3D Horizon Overlay Visualization]                          ║  │
│  ║                                                                       ║  │
│  ║       N (blue line = horizon)                                        ║  │
│  ║      ◇────────◇────────◇                                             ║  │
│  ║     ╱  ◈ ◈  ╱ (objects above horizon)                               ║  │
│  ║    ╱════════╱ (objects highlighted)                                 ║  │
│  ║   ╱         ╱                                                         ║  │
│  ║  ═════════════════════════════════════════════                       ║  │
│  ║  (horizon line, N-E-S-W marked)                                      ║  │
│  ║                                                                       ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                             │
│  VIEWING CONDITIONS & FILTERS                                              │
│  ┌──────────────────────────────────────────────────────────┐              │
│  │ Magnitude Limit: ◄ 6.0 ► (brighter ← → dimmer)          │              │
│  │ (based on typical light pollution for Austin)            │              │
│  │                                                            │              │
│  │ ☑ Show planets  ☑ Show bright stars (mag < 2)           │              │
│  │ ☑ Show DSO (nebulae, clusters, galaxies)  ☑ Observed    │              │
│  │                                                            │              │
│  │ Altitude: ◄ 20° ► (show only objects above horizon)      │              │
│  │                                                            │              │
│  │ [⚙ Advanced Filters]                                      │              │
│  └──────────────────────────────────────────────────────────┘              │
│                                                                             │
│  QUICK STATS                                                               │
│  Sunset: 7:28 PM (civil twilight ends: 7:45 PM, astro: 8:16 PM)          │
│  Moon: Waxing Gibbous 76%, rises 11:33 PM                                │
│  Visible Objects: 247 (filtered by magnitude & altitude)                  │
│                                                                             │
│  [← Back]  [Browse Catalog →]                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Header:**
  - Title format: "Tonight's Sky — [Location] @ [Time]"
  - Title: Inter 600, 16px, color #f3f4f6

- **Horizon Visualization (3D Canvas):**
  - Dimensions: calc(100% - 32px) × 300px
  - Background: linear-gradient(to bottom, rgba(37, 99, 235, 0.1), rgba(10, 10, 26, 0.8))
  - Horizon line: 2px solid rgba(37, 99, 235, 0.6)
  - Cardinal directions (N/E/S/W): Inter 600, 12px, color #60a5fa, positioned at compass points
  - Objects: circles, size varies by brightness, color varies by type:
    - Stars: #ffffff
    - Planets: #f59e0b
    - Nebulae: #8b5cf6
    - Clusters: #10b981
  - Observed objects: overlay small ✓ icon, opacity 0.7
  - Interactive: hover shows name + altitude + azimuth, click selects

- **Viewing Conditions Card:**
  - Background: rgba(37, 99, 235, 0.1), border 1px solid rgba(37, 99, 235, 0.3)
  - Border-radius: 12px, padding: 16px
  - Margin: 16px 0

- **Magnitude Slider:**
  - Label: Inter 600, 11px, color #9ca3af, all-caps
  - Range input: width 100%, height 6px
  - Track background: rgba(37, 99, 235, 0.2)
  - Track active: linear-gradient(90deg, #2563eb, #8b5cf6)
  - Thumb: 16px circle, background #2563eb, box-shadow 0 2px 8px
  - Value display: Inter 600, 12px, color #60a5fa, right-aligned
  - Context: Inter 400, 10px, color #9ca3af, below

- **Checkboxes:**
  - 16px × 16px, 2-3 per row, spacing 16px
  - Label: Inter 400, 12px, color #d1d5db

- **Altitude Slider:**
  - Same as magnitude slider

- **Advanced Filters Button:**
  - Width: 160px, height: 40px
  - Background: transparent, border 1px solid rgba(37, 99, 235, 0.4)
  - Text: Inter 600, 12px, color #93c5fd
  - Icon (⚙): 16px, margin-right 6px
  - Tap: opens modal with expanded filter options

- **Quick Stats Section:**
  - Background: transparent
  - Title: Inter 700, 12px, color #d1d5db, all-caps
  - Stat lines: Inter 400, 12px, color #9ca3af
  - Highlighted value: Inter 600, 12px, color #60a5fa
  - Format: "Label: value (context)", spacing 4px between lines

- **Navigation Buttons:**
  - [← Back]: 100px, transparent background, text #6b7280
  - [Browse Catalog →]: calc(100% - 108px), background linear-gradient(135deg, #2563eb, #8b5cf6)
  - Height: 44px

---

## Screen 5.3: Catalog Browser

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ◄              Catalog Browser — Austin, TX @ 8:00 PM            ⋮        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CATALOG TYPE TABS                                                         │
│  [Messier ▼] [NGC] [Named Stars] [Constellations] [My Favorites]         │
│                                                                             │
│  FILTERS                                                                    │
│  Type: ☐ All ☑ Nebulae ☑ Galaxies ☐ Star Clusters ☐ Doubles             │
│  Magnitude Range: ◄ 2.0 - 6.0 ►  Altitude: ◄ 20° - 90° ►                │
│  Observed: ☐ All ☑ Not Yet ☐ Already Observed                             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ SORT: Name ▼  |  SEARCH: [________]  [Reset Filters]              │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  Results: 43 objects                                                       │
│                                                                             │
│  ┌──────┬──────────────────┬──────────┬──────────┬────────┬─────────┐     │
│  │ Name │ Type             │ Mag      │ Alt      │ Status │ RA/Dec  │     │
│  ├──────┼──────────────────┼──────────┼──────────┼────────┼─────────┤     │
│  │ M42  │ Emission Nebula  │ 4.0      │ 35°      │ ○ NEW  │ 05:35:4 │     │
│  ├──────┼──────────────────┼──────────┼──────────┼────────┼─────────┤     │
│  │ M43  │ Emission Nebula  │ 7.0      │ 35°      │ ○ NEW  │ 05:35:3 │     │
│  ├──────┼──────────────────┼──────────┼──────────┼────────┼─────────┤     │
│  │ M57  │ Planetary Nebula │ 8.8      │ 62°      │ ✓ OBS  │ 18:53:3 │     │
│  ├──────┼──────────────────┼──────────┼──────────┼────────┼─────────┤     │
│  │ M82  │ Galaxy           │ 9.3      │ 78°      │ ○ NEW  │ 09:55:5 │     │
│  ├──────┼──────────────────┼──────────┼──────────┼────────┼─────────┤     │
│  │ NGC  │ Open Cluster     │ 5.2      │ 45°      │ ○ NEW  │ 08:44:2 │     │
│  └──────┴──────────────────┴──────────┴──────────┴────────┴─────────┘     │
│                                          ▼ (more rows below)               │
│                                                                             │
│  [← Back]  [+ Add to Tonight's List]  [View Selected on Sky →]            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Tab Navigation:**
  - 5 tabs: Messier, NGC, Named Stars, Constellations, My Favorites
  - Active tab: background #2563eb, text #ffffff
  - Inactive tab: background transparent, text #9ca3af
  - Height: 44px, padding: 0 16px
  - Border-bottom: 2px solid #2563eb (active only)
  - Font: Inter 600, 12px

- **Filters Section:**
  - Background: rgba(37, 99, 235, 0.1), border-bottom 1px solid rgba(37, 99, 235, 0.3)
  - Padding: 16px, padding-bottom: 12px
  - Checkboxes: 12px × 12px, margin-right 8px
  - Labels: Inter 400, 12px, color #d1d5db
  - Sliders: same as previous screens

- **Search & Sort Bar:**
  - Background: rgba(37, 99, 235, 0.1), border 1px solid rgba(37, 99, 235, 0.3)
  - Border-radius: 8px, padding: 12px
  - Margin: 12px 0

- **Sort Dropdown:**
  - Width: 120px, height: 40px
  - Background: rgba(10, 10, 26, 0.6), border 1px solid rgba(37, 99, 235, 0.4)
  - Text: Inter 500, 12px, color #f3f4f6
  - Options: Name, Magnitude, Altitude, RA, Dec, Type

- **Search Input:**
  - Width: calc(100% - 140px), height: 40px
  - Background: rgba(10, 10, 26, 0.6), border 1px solid rgba(37, 99, 235, 0.4)
  - Font: Inter 400, 12px
  - Placeholder: "Search by name or ID..."
  - Instant filter on keystroke

- **Reset Button:**
  - Width: 120px, height: 40px
  - Background: transparent, border 1px solid rgba(37, 99, 235, 0.4)
  - Text: Inter 600, 11px, color #93c5fd

- **Results Counter:**
  - Inter 400, 12px, color #9ca3af
  - Margin: 8px 0

- **Data Table:**
  - Columns: Name (100px), Type (150px), Mag (80px), Alt (80px), Status (80px), RA/Dec (100px)
  - Header row: background rgba(37, 99, 235, 0.2), text Inter 600, 11px, color #93c5fd, all-caps
  - Data rows: background transparent, text Inter 400, 12px, color #d1d5db
  - Row borders: 1px solid rgba(37, 99, 235, 0.2)
  - Row hover: background rgba(37, 99, 235, 0.1)
  - Row click: highlight with 2px left border #2563eb, navigate to object detail
  - Status icon: ○ (circle outline) for NEW, ✓ (checkmark) for OBS
  - Scrollable: height 400px, horizontal scroll for table overflow

- **Navigation Buttons:**
  - [← Back]: 80px
  - [+ Add to Tonight's List]: 160px, background rgba(16, 185, 129, 0.2), border 1px solid #10b981, text #6ee7b7
  - [View Selected on Sky →]: calc(100% - 248px), background linear-gradient(135deg, #2563eb, #8b5cf6)
  - Height: 44px

---

## Screen 5.4: Object Detail (Observer)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ◄              M57 Ring Nebula (NGC 6720)              ⋮                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║                                                                       ║  │
│  ║                     [Object Image/Render]                            ║  │
│  ║                                                                       ║  │
│  ║                                                                       ║  │
│  ║                                                                       ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                             │
│  ━━━━ CATALOG INFORMATION ━━━━                                            │
│  Common Name: Ring Nebula                                                  │
│  Catalog IDs: M57, NGC 6720, PK 057+4.7                                   │
│  Type: Planetary Nebula                                                    │
│                                                                             │
│  ━━━━ OBSERVATIONAL DATA ━━━━                                             │
│  Distance: 2,270 light-years (estimated ±430 ly)                          │
│  Size (visual): 1.4' × 1.0' (at surface brightness 21 mag/arcsec²)        │
│  Surface Brightness: 20.2 mag/arcsec²                                      │
│                                                                             │
│  ━━━━ TONIGHT (Austin, TX @ 8:00 PM) ━━━━                                │
│  Altitude Now: 62° 18' (excellent for viewing)                            │
│  Azimuth Now: 293° (W, roughly Southwest)                                │
│                                                                             │
│  Rise Time: 04:33 PM                                                       │
│  Transit (culmination): 06:52 PM (highest in sky)                         │
│  Set Time: 09:11 PM                                                        │
│                                                                             │
│  Best Viewing Window: 06:00 PM — 08:30 PM (near transit, Alt 55°+)       │
│  ✓ IDEAL CONDITIONS RIGHT NOW                                             │
│                                                                             │
│  ━━━━ OBSERVING NOTES (from community) ━━━━                              │
│  "With binoculars: barely visible, looks like a tiny fuzzy spot"          │
│  "With 6" reflector: obvious ring structure, central star not obvious"     │
│  "With 10" Dobsonian: stunning! Rings clearly defined, colors visible"     │
│                                                                             │
│  ━━━━ YOUR OBSERVATION LOG ━━━━                                           │
│  Last observed: April 2, 2024 (14 days ago) via 8" Newtonian            │
│  [Edit Last Entry]  [Log New Observation]  [View History]               │
│                                                                             │
│  [← Back]  [+ Add to Tonight]  [📊 Compare Similar]  [🔍 Find on Sky]    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Header:**
  - Title: "[Name] ([Catalog ID])", Inter 600, 18px, color #f3f4f6

- **Image Container:**
  - Width: calc(100% - 32px), aspect-ratio 16/9, border-radius: 12px
  - Border: 2px solid rgba(37, 99, 235, 0.3)
  - Background: linear-gradient(135deg, rgba(37, 99, 235, 0.05), rgba(139, 92, 246, 0.05))
  - Margin-bottom: 20px

- **Section Headers (repeated pattern):**
  - Inter 700, 11px, color #d1d5db, all-caps, letter-spacing 1px
  - Top border: 1px solid rgba(37, 99, 235, 0.3), padding-top: 12px
  - Margin: 12px 0 8px 0

- **Catalog Information:**
  - "Common Name:" Inter 600, 12px, #9ca3af
  - Value: Inter 600, 13px, #f3f4f6
  - "Catalog IDs:" same, value is monospace (JetBrains Mono 12px)
  - "Type:" same

- **Observational Data:**
  - Distance: Inter 600, 12px, #9ca3af + value Inter 600, 13px, #60a5fa
  - Size (visual): same, unit in parentheses Inter 400, 11px, #9ca3af
  - Surface Brightness: same, unit explanation available on hover

- **Tonight's Data (highlighted):**
  - Background: rgba(16, 185, 129, 0.1), border-left 3px solid #10b981
  - Padding: 12px 12px 12px 16px, border-radius: 4px
  - Altitude Now: Inter 600, 12px, #10b981 + value Inter 700, 14px, #6ee7b7
  - Azimuth Now: same styling
  - Rise/Transit/Set: Inter 600, 11px, #9ca3af + time Inter 600, 12px, #60a5fa
  - Best Viewing Window: background, full-width highlight, text Inter 500, 12px, #10b981
  - Ideal indicator: ✓ IDEAL CONDITIONS RIGHT NOW, Inter 700, 11px, color #10b981

- **Community Notes:**
  - Background: rgba(139, 92, 246, 0.1), border-left 3px solid #8b5cf6
  - Padding: 12px 16px, border-radius: 4px
  - Bullet format: " • Note text", Inter 400, 12px, #d1d5db

- **Observation Log Section:**
  - Last observed: Inter 600, 12px, #f3f4f6 + "14 days ago via 8" Newtonian" Inter 400, 11px, #9ca3af
  - Buttons:
    - [Edit Last Entry]: 140px, background rgba(245, 158, 11, 0.15), border 1px solid #f59e0b, text #fbbf24
    - [Log New Observation]: 160px, background rgba(139, 92, 246, 0.15), border 1px solid #8b5cf6, text #a78bfa
    - [View History]: 120px, background transparent, border 1px solid rgba(37, 99, 235, 0.4), text #93c5fd
  - Height: 40px, Inter 600, 11px

- **Navigation Buttons:**
  - [← Back]: 80px, transparent, text #6b7280
  - [+ Add to Tonight]: 120px, background rgba(16, 185, 129, 0.2), border 1px solid #10b981, text #6ee7b7
  - [📊 Compare Similar]: 150px, background rgba(37, 99, 235, 0.15), border 1px solid #2563eb, text #93c5fd
  - [🔍 Find on Sky]: 130px, background linear-gradient(135deg, #2563eb, #8b5cf6), text #ffffff
  - Height: 44px, Inter 600, 12px

---

## Screen 5.5: Observation Log Entry

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ◄              Log Observation: M57 Ring Nebula              ⋮             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  OBSERVATION DETAILS                                                       │
│                                                                             │
│  Date Observed                                                              │
│  [April 16, 2026] ▼   [08:15 PM] ▼   (auto-filled with current)          │
│                                                                             │
│  Location                                                                   │
│  Austin, TX (latitude/longitude auto-filled from setup)                   │
│                                                                             │
│  ━━━━ OBSERVING CONDITIONS ━━━━                                           │
│  Seeing (1=poor, 5=excellent): [3] ●━━━━━                                │
│  Transparency (1=poor, 5=excellent): [4] ━●━━━                           │
│  (Seeing = atmospheric stability; Transparency = atmospheric clarity)     │
│                                                                             │
│  ━━━━ EQUIPMENT USED ━━━━                                                │
│  Telescope: [8" Newtonian Reflector] ▼  (from saved equipment)            │
│  Eyepiece: [25mm Plössl, 32× magnification] ▼                            │
│  Filters: ☐ None ☑ Moon Filter ☐ OIII Filter ☑ Nebula Booster          │
│  Additional: [Optional notes on filters/barlows used]                     │
│                                                                             │
│  ━━━━ OBSERVATION NOTES ━━━━                                              │
│  ┌─────────────────────────────────────────────────────────────┐          │
│  │ Beautiful ring structure tonight! Central star region vague  │          │
│  │ but halo is well-defined. Used OIII filter - much clearer.  │          │
│  │ Seeing was decent, could have used higher magnification.    │          │
│  │ Noted slight color tinting, almost violet hue on NE edge.   │          │
│  │ Best view around 8:10 PM when object at zenith.             │          │
│  │                                                               │          │
│  └─────────────────────────────────────────────────────────────┘          │
│  (500 characters remaining)                                                │
│                                                                             │
│  ━━━━ RATING & SKETCH ━━━━                                               │
│  How well did you observe this?                                            │
│  ★★★★☆ (4 out of 5)                                                       │
│                                                                             │
│  ┌─────────────────────────────┐                                          │
│  │  [📸 Attach Photo/Sketch]   │                                          │
│  │  or drag & drop here        │                                          │
│  └─────────────────────────────┘                                          │
│                                                                             │
│  ━━━━ SAVE OPTIONS ━━━━                                                  │
│  ☑ Make public for community  ☐ Share observing data with friends        │
│                                                                             │
│  [← Back]  [Save Observation]  [Save & Log Another]                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Header:**
  - Title: "Log Observation: [Object Name]", Inter 600, 16px

- **Date/Time Inputs:**
  - 2 dropdowns in row: Date (width 180px), Time (width 120px)
  - Height: 40px each, background rgba(10, 10, 26, 0.6), border 1px solid rgba(37, 99, 235, 0.4)
  - Text: Inter 500, 12px, color #f3f4f6
  - Note below: Inter 400, 10px, color #9ca3af, "(auto-filled with current)"

- **Location Display:**
  - Non-editable text, Inter 400, 12px, color #d1d5db
  - Parenthetical note: Inter 400, 10px, color #9ca3af

- **Observing Conditions (Section):**
  - Subtitle: Inter 400, 10px, color #9ca3af, "(explanation text)"
  - Sliders: width calc(100% - 32px), height 6px
  - Value display: bold number in [brackets] left of slider, 28px wide
  - Labels: Inter 400, 11px, color #9ca3af

- **Equipment Section:**
  - Telescope dropdown: width 100%, height 40px, background rgba(10, 10, 26, 0.6)
  - Text: Inter 500, 12px
  - Eyepiece dropdown: same, shows "magnification" metadata
  - Checkboxes: 12px × 12px, 3 filters shown, custom spacing
  - Additional input: width 100%, height 40px, placeholder "Additional notes..."

- **Observation Notes Textarea:**
  - Width: calc(100% - 32px), height: 120px
  - Background: rgba(10, 10, 26, 0.6), border 1px solid rgba(37, 99, 235, 0.4)
  - Border-radius: 8px, padding: 12px
  - Font: Inter 400, 12px, color #f3f4f6
  - Placeholder: "Describe what you observed..."
  - Resize: vertical only, min-height 120px, max-height 300px
  - Character counter below: Inter 400, 10px, color #9ca3af, right-aligned

- **Rating Stars:**
  - ★ icon: 24px, color #f59e0b, spacing 4px
  - Clickable: updates filled count, scale animation on click
  - Label right: Inter 400, 11px, color #9ca3af, "(X out of 5)"

- **Photo/Sketch Upload:**
  - Dashed border: 2px dashed rgba(37, 99, 235, 0.4)
  - Background: rgba(37, 99, 235, 0.05)
  - Border-radius: 8px, padding: 32px
  - Text: Inter 600, 12px, color #93c5fd, centered
  - Icon (📸): 32px, color #60a5fa, centered above text
  - Hover: background rgba(37, 99, 235, 0.15), border-color #2563eb
  - Drag-over: background rgba(37, 99, 235, 0.25)
  - Click: file picker dialog (image files)

- **Checkboxes:**
  - 12px × 12px, spacing 16px
  - Label: Inter 400, 12px, color #d1d5db

- **Navigation Buttons:**
  - [← Back]: 80px, transparent, text #6b7280
  - [Save Observation]: 150px, background linear-gradient(135deg, #2563eb, #8b5cf6), text #ffffff
  - [Save & Log Another]: 180px, background rgba(16, 185, 129, 0.2), border 1px solid #10b981, text #6ee7b7
  - Height: 44px, Inter 600, 12px
  - Tap: ripple + scale 0.96

---

## Screen 5.6: 3D Spatial Context

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ◄              M57 Ring Nebula — 3D Context              ⋮                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║                                                                       ║  │
│  ║                    [3D Visualization]                                ║  │
│  ║  ◈ (M57 at center, highlighted in blue)                             ║  │
│  ║                                                                       ║  │
│  ║    ◇ M56 (nearby cluster)                                            ║  │
│  ║         ◇ NGC 6720 (companion)                                       ║  │
│  ║              ◈ M57 (center)                                          ║  │
│  ║    ◇ Epsilon Lyrae (navigation star)                                 ║  │
│  ║                                                                       ║  │
│  ║  [Depth axis shows distance from Earth: 2270 ly]                    ║  │
│  ║                                                                       ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                             │
│  NEARBY OBJECTS IN 3D SPACE                                                │
│  ┌─────────────────────────────────────────────────────────────┐           │
│  │ Name              Distance    Type        Angular Sep  │           │
│  │ M56               29,000 ly   Cluster     2.5° away    │           │
│  │ NGC 6720          2,270 ly    Nebula      (this object)│           │
│  │ Epsilon Lyrae     162 ly      Double Star 0.8° away    │           │
│  │ M29               6,000 ly    Cluster     8° away      │           │
│  └─────────────────────────────────────────────────────────────┘           │
│                                                                             │
│  WHY IT LOOKS LIKE THIS FROM EARTH                                         │
│  M57 appears as a tiny ring (~1.4 arcminutes wide) because:               │
│  • You're viewing a disk-shaped nebula nearly edge-on                    │
│  • It's over 2 million light-years away, so appears tiny                 │
│  • The ring structure is created by a toroidal (donut) shell of gas      │
│  • Darker center due to dust obscuring the central white dwarf star      │
│                                                                             │
│  If you were 10 light-years away (still impossibly far!):                 │
│  M57 would appear 80 times larger, spanning 1.6 degrees (3 full moons)   │
│                                                                             │
│  VIEWING GEOMETRY                                                          │
│  Your viewing angle: 15° off edge-on                                       │
│  (If perfectly edge-on, nebula would appear as a line)                     │
│  (If perfectly face-on, you'd see symmetric concentric rings)              │
│                                                                             │
│  [← Back]  [↻ Rotate View]  [← Zoom Out to 10° FOV]  [Telescope FOV →]  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Header:**
  - Title: "[Name] — 3D Context", Inter 600, 16px

- **3D Visualization (WebGL Canvas):**
  - Dimensions: calc(100% - 32px) × 350px
  - Background: linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(139, 92, 246, 0.05))
  - Border: 2px solid rgba(37, 99, 235, 0.3), border-radius: 12px
  - Objects displayed as colored spheres (size by brightness/magnitude):
    - Primary object (M57): 32px, color #2563eb, glowing halo
    - Nearby objects: 20px, color #f59e0b (clusters), #8b5cf6 (nebulae), #60a5fa (stars)
  - Depth axis labeled, grid lines optional
  - Interactive: drag to rotate, scroll/pinch to zoom
  - Annotations: labels on hover, small distance values displayed

- **Nearby Objects Table:**
  - Columns: Name (120px), Distance (100px), Type (100px), Angular Sep (120px)
  - Background: rgba(37, 99, 235, 0.1), border 1px solid rgba(37, 99, 235, 0.3)
  - Border-radius: 8px, padding: 12px
  - Data: Inter 400, 12px, color #d1d5db
  - Header: Inter 600, 11px, color #93c5fd, all-caps

- **Why It Looks Like This Section:**
  - Title: Inter 700, 13px, color #f3f4f6
  - Bullet points: Inter 400, 12px, color #d1d5db, line-height: 1.6
  - Hypothetical scenario: background rgba(245, 158, 11, 0.1), border-left 3px solid #f59e0b
  - Padding: 12px 12px 12px 16px, border-radius: 4px

- **Viewing Geometry Section:**
  - Same title/content styling as above
  - Parenthetical explanations: Inter 400, 11px, color #9ca3af, italics

- **Navigation Buttons:**
  - [← Back]: 80px, transparent
  - [↻ Rotate View]: 120px, background rgba(37, 99, 235, 0.15), border 1px solid #2563eb
  - [← Zoom Out to 10° FOV]: 160px, background rgba(139, 92, 246, 0.15), border 1px solid #8b5cf6
  - [Telescope FOV →]: 140px, background linear-gradient(135deg, #2563eb, #8b5cf6)
  - Height: 44px, Inter 600, 11px

---

## Screen 5.7: Telescope FOV Overlay

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ◄              M57 Ring Nebula — Telescope View             ⋮              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║                                                                       ║  │
│  ║              [3D Visualization with FOV Circle Overlay]              ║  │
│  ║                                                                       ║  │
│  ║                            ◇                                          ║  │
│  ║                     ◇                                                 ║  │
│  ║                  ◇  ◯◯◯◯◯  ◇                                         ║  │
│  ║                  ◯  (FOV circle centered on M57)                     ║  │
│  ║              ◈◈ ◯◯◯◯◯◯◯◯◯◯ ◈◈                                       ║  │
│  ║                  ◯  M57 center marker  ◯                             ║  │
│  ║                  ◯◯◯◯◯◯◯◯◯◯ (dashed)                                ║  │
│  ║                     ◇       ◇                                         ║  │
│  ║                      ◇                                                ║  │
│  ║                                                                       ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                             │
│  TELESCOPE CONFIGURATION                                                   │
│  Telescope: [8" Newtonian Reflector] ▼  (f/6, focal length 1200mm)       │
│  Eyepiece: [25mm Plössl] ▼  (field of view: 50°)                         │
│  Magnification: 48× (calculated: 1200mm ÷ 25mm)                           │
│                                                                             │
│  FIELD OF VIEW CALCULATION                                                │
│  Telescope FOV with this eyepiece: 1.04° (62 arcminutes)                 │
│  M57 angular size: 1.4' × 1.0' (will fit comfortably in center)          │
│  ✓ EXCELLENT MATCH - Object clearly visible with room for navigation     │
│                                                                             │
│  EXPECTED APPEARANCE (at 48× magnification)                                │
│  "Ring nebula will appear ~20 pixels wide in your eyepiece"              │
│  "You'll see the ring structure but central star may be subtle"           │
│  "At 48×, brightness sufficient for visual detection"                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────┐          │
│  │ Adjust FOV Circle Diameter: [1.04°] ◄━━━●━━━► [5.0°]       │          │
│  │ (Drag to change, auto-updates for different eyepieces)     │          │
│  └─────────────────────────────────────────────────────────────┘          │
│                                                                             │
│  [← Back]  [Change Eyepiece]  [📋 Print Finder Chart]  [🔍 Navigate →]   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Header:**
  - Title: "[Name] — Telescope View", Inter 600, 16px

- **3D Visualization:**
  - Same dimensions/styling as Screen 5.6 (calc(100% - 32px) × 350px)
  - FOV Circle (SVG overlay on canvas):
    - Stroke: 2px dashed #60a5fa, opacity 0.8
    - Center marker: small crosshair (+), color #60a5fa
    - Radius: variable based on eyepiece FOV (calculated value)
    - Interactive: drag circle center to pan view, shows coordinates

- **Telescope Configuration Section:**
  - Telescope dropdown: width 100%, height 40px, background rgba(10, 10, 26, 0.6)
  - Text: Inter 500, 12px, color #f3f4f6
  - Note below: Inter 400, 10px, color #9ca3af, "(specs in parentheses)"
  - Eyepiece dropdown: same styling, note shows "field of view: value"
  - Magnification display: Inter 600, 12px, color #60a5fa
  - Calculation note: Inter 400, 10px, color #9ca3af, "(calculation formula)"

- **FOV Calculation Section:**
  - Title: Inter 700, 12px, color #f3f4f6
  - Calculated values: Inter 600, 12px, color #60a5fa
  - Object size: Inter 400, 12px, color #d1d5db
  - Match indicator: background rgba(16, 185, 129, 0.1), border-left 3px solid #10b981
  - Status text: ✓ EXCELLENT/GOOD/FAIR, color #10b981 / #f59e0b / #ef4444

- **Expected Appearance Section:**
  - Title: Inter 700, 12px, color #f3f4f6
  - Bullet points: Inter 400, 12px, color #d1d5db

- **FOV Slider:**
  - Label: Inter 600, 11px, color #9ca3af, all-caps
  - Range input: width calc(100% - 32px), height 6px
  - Value inputs (left/right): 60px width, height 32px, background rgba(10, 10, 26, 0.6), border 1px solid rgba(37, 99, 235, 0.4)
  - Text: Inter 500, 12px, color #f3f4f6, centered
  - Note below: Inter 400, 10px, color #9ca3af

- **Navigation Buttons:**
  - [← Back]: 80px, transparent
  - [Change Eyepiece]: 130px, background rgba(245, 158, 11, 0.15), border 1px solid #f59e0b, text #fbbf24
  - [📋 Print Finder Chart]: 150px, background rgba(139, 92, 246, 0.15), border 1px solid #8b5cf6, text #a78bfa
  - [🔍 Navigate →]: 120px, background linear-gradient(135deg, #2563eb, #8b5cf6), text #ffffff
  - Height: 44px, Inter 600, 11px

---

## Screen 5.8: Club Presentation Mode

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [← Back to List]        Tonight's Best Objects — Club Presentation        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║                                                                       ║  │
│  ║                     [3D Visualization - Large]                       ║  │
│  ║                                                                       ║  │
│  ║                          ◈ M42 Orion Nebula                          ║  │
│  ║                                                                       ║  │
│  ║                                                                       ║  │
│  ║                                                                       ║  │
│  ║                                                                       ║  │
│  ║                                                                       ║  │
│  ║                                                                       ║  │
│  ║                                                                       ║  │
│  ║                                                                       ║  │
│  ║                                                                       ║  │
│  ║                                                                       ║  │
│  ║                                                                       ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                             │
│  M42 ORION NEBULA                                                          │
│  Distance: 1,344 light-years | Type: Emission Nebula | Magnitude: 4.0    │
│  Tonight: Alt 35°, Azimuth 293° W | Best Viewing: 6:00 PM - 8:00 PM     │
│                                                                             │
│  A vast cloud of gas where stars are being born. The inner region, the    │
│  Orion Nebula proper, is ionized by the intense radiation from the hot    │
│  young stars at its core. Observable with binoculars; magnificent with    │
│  telescopes. The greenish tint you may see is due to ionized oxygen.      │
│                                                                             │
│  NEXT: M43 (nearby nebula)  |  PREVIOUS: Saturn                            │
│                                                                             │
│  [◀ Previous]  [Pause]  [Next ▶]                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Full-Screen Layout:**
  - Removed all sidebar UI, focus on 3D canvas and content
  - Top bar: only back button (left) + title (center), minimal styling
  - Background: Deep Space Black #0a0a1a

- **3D Visualization (expanded):**
  - Height: calc(100vh - 350px), width: calc(100% - 32px)
  - Border: 2px solid rgba(37, 99, 235, 0.3), border-radius: 12px
  - Margin-bottom: 16px
  - Fills majority of viewport

- **Object Title (large):**
  - Inter 700, 32px, color #f3f4f6
  - All-caps

- **Metadata Line:**
  - Inter 600, 13px, color #60a5fa, pipe-separated fields
  - Format: "Distance: X | Type: Y | Magnitude: Z | Tonight: Alt/Az | Best Time: range"

- **Description Text:**
  - Inter 400, 14px, color #d1d5db
  - Line-height: 1.7
  - Max-width: 100%, wrapped naturally

- **Navigation Info:**
  - Inter 400, 12px, color #9ca3af
  - Format: "NEXT: [name] (descriptor) | PREVIOUS: [name]"
  - Margin: 12px 0

- **Control Buttons:**
  - Grid: 3 equal columns, height: 44px
  - [◀ Previous]: background rgba(37, 99, 235, 0.15), border 1px solid #2563eb
  - [Pause]: background transparent, border 1px solid rgba(37, 99, 235, 0.4)
  - [Next ▶]: background linear-gradient(135deg, #2563eb, #8b5cf6)
  - Text: Inter 700, 13px, color varies
  - Border-radius: 8px
  - Tap: ripple + scale 0.96

- **Design Notes:**
  - Font sizes increased 20% for readability from distance
  - Contrast enhanced: stronger shadows, bolder typography
  - Minimal chrome: no advanced filters, no small UI elements
  - Large tap targets: buttons 44px minimum, spacing 12px

---

## Screen 5.9: Export Observation Plan

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ◄              Export Tonight's Plan              ⋮                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  EXPORT TONIGHT'S OBSERVATION TARGET LIST                                  │
│                                                                             │
│  Location: Austin, TX (30.27°N, 97.74°W)                                  │
│  Date: April 16, 2026                                                      │
│  Start Time: 8:00 PM CDT                                                   │
│  Number of Targets: 12                                                     │
│                                                                             │
│  ━━━━ FORMAT ━━━━                                                          │
│  ☑ PDF (printable, includes finder charts)                                │
│  ☐ CSV (spreadsheet, data only)                                            │
│  ☐ JSON (data + metadata, for import to other apps)                       │
│                                                                             │
│  ━━━━ CONTENT OPTIONS ━━━━                                                │
│  ☑ Include RA/Dec coordinates                                              │
│  ☑ Include Alt/Az (for tonight at configured time)                        │
│  ☑ Include rise/transit/set times                                          │
│  ☑ Include finder charts (PDF only)                                        │
│  ☑ Include observing notes from community                                  │
│  ☐ Include my observation history (previous observations)                 │
│  ☑ Show equipment configuration                                            │
│                                                                             │
│  ━━━━ PDF-SPECIFIC OPTIONS ━━━━                                           │
│  Paper Size: [Letter (8.5" × 11")] ▼                                     │
│  Layout: ☑ Single column (easier to handle at scope)                      │
│         ☐ Two columns (more compact)                                      │
│  Orientation: ☑ Portrait  ☐ Landscape                                     │
│  Font Size: [Normal] ▼  (adjusts for readability)                          │
│  ☑ Include observing tips for each object                                  │
│  ☑ Add dark-friendly mode (inverted colors for night vision)              │
│                                                                             │
│  PREVIEW                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐          │
│  │ Page 1 of 2 Preview                                         │          │
│  │ ────────────────────────────                                │          │
│  │ TONIGHT'S OBSERVATION PLAN                                  │          │
│  │ Austin, TX | April 16, 2026 | Start: 8:00 PM              │          │
│  │                                                              │          │
│  │ M42 Orion Nebula                                            │          │
│  │ RA: 05:35:24 | Dec: -05:23 | Tonight: Alt 35° Az 293° W   │          │
│  │ Rise: 4:33 PM | Transit: 6:52 PM | Set: 9:11 PM           │          │
│  │ Distance: 1,344 ly | Magnitude: 4.0 | Type: Emission Neb  │          │
│  │ [finder chart image area]                                   │          │
│  │                                                              │          │
│  │ Equipment: 8" Newtonian (f/6) + 25mm Plössl (48×)          │          │
│  │ Observing notes: Excellent for all apertures...            │          │
│  │ ────────────────────────────────                            │          │
│  └─────────────────────────────────────────────────────────────┘          │
│  [◄ Previous Page]  [Page 1 of 2]  [Next Page ▶]                          │
│                                                                             │
│  [← Back]  [Download PDF]  [Email to Self]  [Open in Print Dialog]        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Header:**
  - Title: "Export Tonight's Plan", Inter 600, 16px

- **Meta Info Section:**
  - Location: Inter 600, 12px, #60a5fa
  - Date/Time: Inter 600, 12px, #60a5fa
  - Target count: Inter 600, 12px, #60a5fa
  - Labels: Inter 400, 10px, #9ca3af above each

- **Format Radios:**
  - ☑ PDF, ☐ CSV, ☐ JSON
  - Circle size: 16px, spacing 16px between options
  - Label: Inter 400, 12px, color #d1d5db
  - Selected background: rgba(37, 99, 235, 0.1)
  - Padding: 8px 12px, border-radius: 4px

- **Content Options (Checkboxes):**
  - Checkbox: 16px × 16px
  - Label: Inter 400, 12px, color #d1d5db
  - Section headers: Inter 700, 11px, color #d1d5db, all-caps, letter-spacing 1px
  - Grid: 2 columns on tablet, 1 on phone
  - Margin: 8px 0 per item

- **PDF-Specific Section:**
  - Visible only when PDF radio selected
  - Slide-down animation (200ms ease-out)
  - Dropdowns: width 180px, height 40px, background rgba(10, 10, 26, 0.6)
  - Text: Inter 500, 12px

- **Preview Container:**
  - Width: calc(100% - 32px), height: 300px
  - Background: rgba(10, 10, 26, 0.6), border 1px solid rgba(37, 99, 235, 0.3)
  - Border-radius: 8px, padding: 16px
  - Overflow-y: auto
  - Content: monospace font (JetBrains Mono 10px, #d1d5db), simulating PDF text
  - Page indicator: Inter 400, 11px, color #9ca3af, centered bottom
  - Navigation buttons (prev/next page): 100px width, height 36px, background rgba(37, 99, 235, 0.15)

- **Navigation Buttons:**
  - [← Back]: 80px, transparent
  - [Download PDF]: 130px, background linear-gradient(135deg, #2563eb, #8b5cf6), text #ffffff
  - [Email to Self]: 130px, background rgba(139, 92, 246, 0.15), border 1px solid #8b5cf6, text #a78bfa
  - [Open in Print Dialog]: 160px, background rgba(16, 185, 129, 0.15), border 1px solid #10b981, text #6ee7b7
  - Height: 44px, Inter 600, 12px

---

## Screen 5.10: Observation History

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ◄              Observation History              ⋮                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  OBSERVATION STATISTICS (2026)                                             │
│                                                                             │
│  Total Observations: 47  |  Unique Objects: 31  |  Nights Observing: 12  │
│  Messier Progress: 39 / 110 (35%)  [████████════════════════════]        │
│                                                                             │
│  OBSERVATIONS BY TYPE                                                      │
│  ┌──────────────────────────────────────────────────────────────┐         │
│  │ Galaxies:        12 observed (34%)                           │         │
│  │ Nebulae:         13 observed (37%)                           │         │
│  │ Star Clusters:   10 observed (29%)                           │         │
│  │ Planets:          8 observed                                  │         │
│  │ Double Stars:     4 observed                                  │         │
│  │ Constellations:  15 covered (varies by definition)           │         │
│  └──────────────────────────────────────────────────────────────┘         │
│                                                                             │
│  OBSERVATION CALENDAR (April 2026)                                         │
│  ┌──────────────────────────────────────────────────────────────┐         │
│  │ Sun  Mon  Tue  Wed  Thu  Fri  Sat                           │         │
│  │                               1    2    3                   │         │
│  │  4    5    6    7    8    9    10                           │         │
│  │ 11   12   13   14   15  [16]  17   ← Today (3 objects)     │         │
│  │ 18   19   20   21   22   23   24                           │         │
│  │ 25   26   27   28   29   30                                │         │
│  │                                                              │         │
│  │ Legend: ○ = 1-2 objects   ◐ = 3-5 objects   ● = 6+ objects │         │
│  └──────────────────────────────────────────────────────────────┘         │
│                                                                             │
│  RECENT OBSERVATIONS                                                       │
│  ┌──────────────────────────────────────────────────────────────┐         │
│  │ Apr 16 - M42 Orion Nebula                    Rating: ★★★★★ │         │
│  │ Apr 16 - M43 Nebula                          Rating: ★★★☆☆ │         │
│  │ Apr 16 - M57 Ring Nebula                     Rating: ★★★★☆ │         │
│  │ Apr 14 - Saturn                              Rating: ★★★★★ │         │
│  │ Apr 10 - Andromeda Galaxy (M31)              Rating: ★★★★☆ │         │
│  │ Apr 8 - Pleiades Cluster (M45)               Rating: ★★★★★ │         │
│  │                                               [View more...] │         │
│  └──────────────────────────────────────────────────────────────┘         │
│                                                                             │
│  BEST OBJECTS (by your ratings)                                           │
│  1. Saturn (★★★★★) — April 14                                           │
│  2. M42 Orion Nebula (★★★★★) — April 16                                 │
│  3. Pleiades Cluster (★★★★★) — April 8                                  │
│  4. M57 Ring Nebula (★★★★☆) — April 16                                  │
│  5. M31 Andromeda (★★★★☆) — April 10                                    │
│                                                                             │
│  NEXT MILESTONES                                                           │
│  ○ Messier 50: 11 more objects needed                                     │
│  ○ Summer Sky Tour: 8 more Messier objects in Cygnus                      │
│  ○ Bright Star Challenge: 3 more double stars logged                      │
│                                                                             │
│  [← Back]  [📊 Export Stats]  [📧 Email Report]  [⚙ Analyze Patterns]  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Header:**
  - Title: "Observation History", Inter 600, 16px

- **Statistics Banner:**
  - Background: rgba(16, 185, 129, 0.1), border-bottom 1px solid rgba(16, 185, 129, 0.3)
  - Padding: 16px
  - Stat format: "Label: value | Label: value | Label: value"
  - Value: Inter 700, 14px, color #6ee7b7
  - Label: Inter 400, 11px, color #9ca3af, above value
  - Messier progress bar: width 100%, height 8px, background rgba(37, 99, 235, 0.2)
  - Accent: linear-gradient(90deg, #2563eb, #8b5cf6)
  - Percentage: Inter 600, 11px, color #60a5fa, right of bar

- **Observations by Type Section:**
  - Title: Inter 700, 12px, color #f3f4f6, all-caps
  - Card: background rgba(37, 99, 235, 0.1), border 1px solid rgba(37, 99, 235, 0.3)
  - Border-radius: 8px, padding: 16px
  - Type lines: Inter 600, 11px, #d1d5db (label) + count Inter 700, 12px, #60a5fa (value)
  - Percentage: Inter 400, 10px, #9ca3af, parenthetical
  - Margin: 12px 0 per line

- **Calendar Section:**
  - Title: Inter 700, 12px, color #f3f4f6, all-caps
  - Card: background rgba(37, 99, 235, 0.1), border 1px solid rgba(37, 99, 235, 0.3)
  - Border-radius: 8px, padding: 16px
  - Calendar grid: Inter 400, 11px, color #d1d5db
  - Day cells: 32px × 32px, text-align center
  - Today marker: border 2px solid #2563eb, background rgba(37, 99, 235, 0.2)
  - Observation dots: ○ (1-2), ◐ (3-5), ● (6+), size 8px, color #60a5fa
  - Legend: Inter 400, 10px, color #9ca3af, below calendar

- **Recent Observations Section:**
  - Title: Inter 700, 12px, color #f3f4f6, all-caps
  - Card: background rgba(37, 99, 235, 0.1), border 1px solid rgba(37, 99, 235, 0.3)
  - Border-radius: 8px, padding: 12px
  - Observation rows: background transparent, border-bottom 1px solid rgba(37, 99, 235, 0.2)
  - Last row: no border
  - Format: "Date - Object Name" (left, Inter 600, 12px, #f3f4f6) + "Rating: ★★★★☆" (right, Inter 600, 11px, #f59e0b)
  - Row hover: background rgba(37, 99, 235, 0.1)
  - "View more..." link: Inter 600, 11px, color #93c5fd, cursor pointer

- **Best Objects Section:**
  - Title: Inter 700, 12px, color #f3f4f6
  - Ranking format: "N. Name (rating) — Date"
  - Num: Inter 700, 14px, color #f59e0b
  - Name: Inter 600, 12px, color #f3f4f6
  - Rating: Inter 600, 11px, color #f59e0b
  - Date: Inter 400, 10px, color #9ca3af
  - Spacing: 8px between items

- **Milestones Section:**
  - Title: Inter 700, 12px, color #f3f4f6, all-caps
  - Format: "○ Milestone: progress description"
  - Circle: 12px, color #8b5cf6, margin-right 8px
  - Text: Inter 400, 12px, color #d1d5db
  - Progress hint: Inter 600, 11px, color #60a5fa, bold

- **Navigation Buttons:**
  - [← Back]: 80px, transparent
  - [📊 Export Stats]: 130px, background rgba(139, 92, 246, 0.15), border 1px solid #8b5cf6, text #a78bfa
  - [📧 Email Report]: 140px, background rgba(37, 99, 235, 0.15), border 1px solid #2563eb, text #93c5fd
  - [⚙ Analyze Patterns]: 150px, background linear-gradient(135deg, #2563eb, #8b5cf6), text #ffffff
  - Height: 44px, Inter 600, 11px

---

# JOURNEY 6: RESEARCH VISUALIZATION

**Persona:** Dr. Priya — PhD Researcher, studying stellar populations and galaxy clusters  
**Device:** Desktop/High-res display (2560×1440 preferred, minimum 1920×1080)  
**Context:** Data import, advanced analysis, publication-ready visualizations  
**Design Approach:** Professional grade, data-centric, extensible, reproducible workflows

---

## Screen 6.1: Data Import Wizard Step 1

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ◄              Data Import Wizard              ⋮                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP 1 OF 4: UPLOAD YOUR DATA                                            │
│                                                                             │
│  Progress: ████████████░░░░░░░░░░░░░░░░░░░░░░░░░ 25%                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                                                                     │  │
│  │                    ⬆ DRAG & DROP YOUR FILE                        │  │
│  │                                                                     │  │
│  │              Or [Browse Computer]  [Paste from Clipboard]          │  │
│  │                                                                     │  │
│  │  Supported Formats:                                                │  │
│  │  • CSV/TSV (spreadsheet data)                                     │  │
│  │  • FITS (astronomical images & tables)                            │  │
│  │  • VOTable (Virtual Observatory format)                           │  │
│  │  • JSON (structured data, must have coordinates or array)         │  │
│  │  • HDF5 (hierarchical scientific data)                            │  │
│  │                                                                     │  │
│  │  Maximum size: 100 MB | Estimated upload time (for 50 MB): 2 min │  │
│  │                                                                     │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ━━━━ FILE PREVIEW ━━━━                                                   │
│                                                                             │
│  No file selected yet.                                                     │
│                                                                             │
│  [← Back]  [Next Step →]                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Header:**
  - Back arrow (44px × 44px) + title "Data Import Wizard" + menu

- **Progress Indicator:**
  - "STEP 1 OF 4: UPLOAD YOUR DATA", Inter 700, 14px, color #f3f4f6
  - Progress bar: width calc(100% - 32px), height 8px
  - Background: rgba(37, 99, 235, 0.2), accent #2563eb, border-radius 4px
  - Percentage: 25%, right-aligned, Inter 600, 11px, color #60a5fa

- **Drop Zone Card:**
  - Width: calc(100% - 32px), height: 200px
  - Background: linear-gradient(135deg, rgba(37, 99, 235, 0.05), rgba(139, 92, 246, 0.05))
  - Border: 2px dashed rgba(37, 99, 235, 0.4)
  - Border-radius: 12px
  - Flex center, flex-direction column
  - Cursor: pointer

- **Drop Icon (⬆):**
  - Size: 48px, color #2563eb
  - Margin-bottom: 12px

- **Drop Text:**
  - Inter 700, 16px, color #f3f4f6
  - Text: "DRAG & DROP YOUR FILE"
  - Margin-bottom: 16px

- **Browse Buttons:**
  - [Browse Computer]: 160px width, height 40px
  - Background: rgba(37, 99, 235, 0.2), border 1px solid #2563eb
  - Text: Inter 600, 12px, color #93c5fd
  - Border-radius: 6px
  - Margin-right: 12px
  - [Paste from Clipboard]: 160px, background transparent, border 1px solid rgba(37, 99, 235, 0.4)
  - Inline with browse button

- **Supported Formats List:**
  - Margin: 16px 0
  - Bullet points: Inter 400, 12px, color #d1d5db
  - Each bullet: • symbol, color #60a5fa, margin-right 8px

- **File Size Info:**
  - Background: rgba(245, 158, 11, 0.1), border-left 3px solid #f59e0b
  - Padding: 12px 12px 12px 16px, border-radius: 4px
  - Text: Inter 400, 11px, color #d1d5db

- **File Preview Section:**
  - Title: Inter 700, 12px, color #d1d5db, all-caps, letter-spacing 1px
  - Placeholder: "No file selected yet.", Inter 400, 12px, color #6b7280
  - When file selected: table preview (max 5 rows, all columns)
  - Table: background rgba(37, 99, 235, 0.1), border 1px solid rgba(37, 99, 235, 0.3)
  - Max-height: 150px, overflow-y: auto

- **Navigation Buttons:**
  - [← Back]: 80px, background transparent, text #6b7280
  - [Next Step →]: calc(100% - 88px), background linear-gradient(135deg, #2563eb, #8b5cf6), text #ffffff
  - Height: 44px, border-radius: 8px
  - Next button disabled if no file: opacity 0.5, cursor not-allowed

- **Drag-Over State:**
  - Drop zone background: rgba(37, 99, 235, 0.2)
  - Border: 2px dashed #2563eb
  - Box-shadow: inset 0 0 16px rgba(37, 99, 235, 0.3)

---

## Screen 6.2: Column Mapping (Step 2)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ◄              Data Import Wizard              ⋮                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP 2 OF 4: MAP YOUR COLUMNS                                            │
│                                                                             │
│  Progress: ████████████████████░░░░░░░░░░░░░░░░ 50%                       │
│                                                                             │
│  Instruction: Match your data columns (left) to standard fields (right).   │
│  Unmapped columns will be ignored. Auto-detected suggestions in GREEN.     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │ YOUR COLUMNS          │  MAPPING  │  TARGET FIELDS                  │  │
│  ├───────────────────────┼───────────┼─────────────────────────────────┤  │
│  │ ra (✓ auto)          │ ──────→   │ Right Ascension (REQUIRED)      │  │
│  │ dec (✓ auto)         │ ──────→   │ Declination (REQUIRED)          │  │
│  │ distance_kpc (✓ auto)│ ──────→   │ Distance (REQUIRED)             │  │
│  │ source_name          │ ──────→   │ Object Name (optional)          │  │
│  │ mag_v                │ ──────→   │ Magnitude (optional)            │  │
│  │ luminosity_log       │ ──────→   │ [Unmapped - drag to assign]     │  │
│  │ color_index          │ ──────→   │ [Unmapped - drag to assign]     │  │
│  │ metallicity_dex      │ ──────→   │ [Unmapped - drag to assign]     │  │
│  │ [+Add Custom Field]  │           │ [Surface Brightness (opt)]      │  │
│  │                      │           │ [Redshift (opt)]                │  │
│  │                      │           │ [Other Metadata (opt)]          │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  FIELD REQUIREMENTS                                                        │
│  ✓ Right Ascension (RA) — provided as: Degrees, Hours:Minutes:Seconds,   │
│                            Radians, or auto-detect                        │
│  ✓ Declination (Dec) — provided as: Degrees, Degrees:Arcminutes:Arcsec,  │
│                        Radians, or auto-detect                           │
│  ✓ Distance — required for 3D positioning (light-years, parsecs, kpc)   │
│  ○ Object Name — helps with selection queries and labels                │
│  ○ Magnitude/Luminosity — for color mapping and filtering               │
│                                                                             │
│  [← Back]  [Next Step →]                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Header:**
  - Progress: 50%, same styling as Step 1

- **Instruction Text:**
  - Inter 400, 12px, color #d1d5db
  - Suggestions highlighted: Inter 600, 12px, color #10b981, "(suggestions in GREEN)"

- **Mapping Table:**
  - 3-column layout: Source Columns | Arrows | Target Fields
  - Width: calc(100% - 32px)
  - Background: rgba(37, 99, 235, 0.1), border 1px solid rgba(37, 99, 235, 0.3)
  - Border-radius: 8px, overflow hidden

- **Column Headers (Table):**
  - Background: rgba(37, 99, 235, 0.2)
  - Text: Inter 700, 11px, color #93c5fd, all-caps
  - Padding: 12px 16px
  - Borders: 1px solid rgba(37, 99, 235, 0.3)

- **Source Columns (left side):**
  - Width: 35%
  - Rows: background transparent, border-bottom 1px solid rgba(37, 99, 235, 0.2)
  - Last row: no border
  - Text: Inter 600, 12px, color #f3f4f6
  - Auto-detected: background rgba(16, 185, 129, 0.1), text #6ee7b7
  - Auto indicator (✓): checkmark, color #10b981, margin-right 6px
  - Hover: background rgba(37, 99, 235, 0.1)
  - Draggable: cursor grab/grabbing on hover
  - [+Add Custom]: Inter 600, 12px, color #60a5fa, cursor pointer

- **Arrow Connector:**
  - Text: "──────→", color #9ca3af, centered, monospace (JetBrains Mono 12px)

- **Target Fields (right side):**
  - Width: 45%
  - Dropdowns for each field
  - Required fields: red asterisk (*), text Inter 400, 11px, color #ef4444
  - Optional fields: label "(optional)", text Inter 400, 11px, color #9ca3af
  - Unmapped fields: "[Unmapped - drag to assign]", text Inter 400, 11px, color #6b7280
  - Selection: background rgba(37, 99, 235, 0.2), border 1px solid #2563eb when active

- **Field Requirements Section:**
  - Title: Inter 700, 12px, color #f3f4f6, all-caps
  - Checkmark/Circle: ✓ (green) for required, ○ (gray) for optional
  - Field name: Inter 700, 11px, color #f3f4f6
  - Description: Inter 400, 11px, color #9ca3af, wrapped below name
  - Margin: 8px 0 per field

- **Navigation Buttons:**
  - [← Back]: 80px, transparent, text #6b7280
  - [Next Step →]: calc(100% - 88px), background linear-gradient, text #ffffff
  - Height: 44px

---

## Screen 6.3: Coordinate System & Options (Step 3)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ◄              Data Import Wizard              ⋮                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP 3 OF 4: COORDINATE SYSTEM & OPTIONS                                │
│                                                                             │
│  Progress: ████████████████████████████░░░░░░░░░░ 75%                     │
│                                                                             │
│  COORDINATE SYSTEM                                                         │
│  ⚙ RA/Dec in which system?                                                │
│  ◉ ICRS (International Celestial Reference System) — Default, J2000.0    │
│  ◯ Galactic (Galactic center at origin)                                   │
│  ◯ Ecliptic (Earth's orbital plane)                                       │
│  ◯ Supergalactic (Local Supercluster plane)                               │
│                                                                             │
│  DISTANCE UNITS                                                            │
│  Your data uses: [kiloparsecs (kpc)] ▼                                   │
│  ↳ Convert to: [light-years (ly)] ▼  for internal 3D representation      │
│  (1 kpc = 3,261.6 ly)                                                     │
│                                                                             │
│  ━━━━ DISTANCE/REDSHIFT MODE ━━━━                                        │
│  Your distance column contains:                                            │
│  ◉ Physical distance (parsecs/kpc/light-years)                            │
│  ◯ Redshift value (z) — Convert to luminosity distance using:            │
│     Cosmology: [Λ-CDM (H0=67.4 km/s/Mpc, ΩM=0.315, ΩΛ=0.685)] ▼        │
│                                                                             │
│  PREVIEW 3D SCATTER                                                       │
│  ┌─────────────────────────────────────────────────────────────┐          │
│  │                                                               │          │
│  │           [3D Preview Canvas - 200px height]                 │          │
│  │  (Shows sample of data with current settings applied)       │          │
│  │                                                               │          │
│  │  Axes: RA (blue), Dec (green), Distance (red)               │          │
│  │  ◈ Points: ~ 200 objects plotted                            │          │
│  │                                                               │          │
│  └─────────────────────────────────────────────────────────────┘          │
│                                                                             │
│  Preview stats: 5,247 objects loaded. 12 removed (missing distance).     │
│  Coordinate range: RA [0-24h], Dec [-90 to +60°], Distance [1-8 Mpc]    │
│                                                                             │
│  [← Back]  [Next Step →]                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Progress Bar:**
  - 75% filled, same styling as Step 1

- **Coordinate System Section:**
  - Title: Inter 700, 12px, color #f3f4f6, all-caps
  - Subtitle: Inter 400, 11px, color #9ca3af
  - Radio buttons: 16px circles, spacing 12px between options
  - Selected: background #2563eb, white inner circle
  - Unselected: background transparent, border 2px solid rgba(37, 99, 235, 0.4)
  - Label: Inter 400, 12px, color #d1d5db, margin-left 8px
  - Description (smaller): Inter 400, 10px, color #9ca3af, below label

- **Distance Units Section:**
  - Label: "Your data uses:", Inter 600, 11px, color #9ca3af
  - Dropdown 1: width 180px, height 40px, background rgba(10, 10, 26, 0.6), border 1px solid rgba(37, 99, 235, 0.4)
  - Arrow: "↳ Convert to:", Inter 600, 11px, color #9ca3af, margin-left 16px
  - Dropdown 2: same styling
  - Conversion note: Inter 400, 10px, color #9ca3af, "(1 unit = X unit)"

- **Distance/Redshift Mode Section:**
  - Title: Inter 600, 11px, color #9ca3af
  - Radio buttons: same styling as coordinate system
  - Cosmology dropdown: appears only when "Redshift" selected
  - Options: Planck 2018, WMAP9, Flat ΛCDM custom, etc.
  - Dropdown: width 280px, height 40px

- **3D Preview Canvas:**
  - Width: calc(100% - 32px), height: 200px
  - Background: linear-gradient(135deg, rgba(37, 99, 235, 0.05), rgba(139, 92, 246, 0.05))
  - Border: 2px solid rgba(37, 99, 235, 0.3), border-radius: 12px
  - WebGL or SVG 3D visualization
  - Points: small circles (8px), color #60a5fa, semi-transparent
  - Axes: colored lines (RA=blue, Dec=green, Distance=red), 2px width
  - Axis labels: Inter 400, 10px, color #9ca3af

- **Preview Stats:**
  - Inter 400, 11px, color #d1d5db
  - Format: "X objects loaded. Y removed (reason)."
  - Coordinate range: "Coordinate: [min-max]", Inter 600, 11px, color #60a5fa

- **Navigation Buttons:**
  - [← Back]: 80px, transparent, text #6b7280
  - [Next Step →]: calc(100% - 88px), gradient background, text #ffffff
  - Height: 44px

---

## Screen 6.4: 3D Visualization Active

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ◄              Data Visualization: Galaxy Cluster Sample       ⋮           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║                                                                       ║  │
│  ║                    [Full WebGL 3D Canvas]                            ║  │
│  ║                                                                       ║  │
│  ║                ◈ ◇  ◈  ◇◇ ◈ ◇  ◈  ◆                                  ║  │
│  ║              ◈◈  ◈ ◇◇◇ ◈ ◇ ◇◇ ◈ ◆◆ ◈                              ║  │
│  ║             ◈ ◇◇◇ ◈◈◈ ◇ ◆◆◆ ◈ ◇ ◆◆◈                               ║  │
│  ║            ◈ ◇ ◈◈◈◈◇ ◈ ◆◆◆◆ ◈◈ ◇ ◈◈                              ║  │
│  ║           ◇ ◈◈◈ (universe context, smaller)                         ║  │
│  ║                                                                       ║  │
│  ║  Interactive: Drag to rotate, scroll to zoom, click to select points ║  │
│  ║  Current selection: None                                             ║  │
│  ║                                                                       ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                             │
│  Selection: None selected  |  Data range: RA [0-24h], Dec [-90°-+60°]    │
│  Color mapping: Magnitude (blue=bright, red=dim)  |  Size: Luminosity    │
│                                                                             │
│  TOOLS SIDEBAR (right)                                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ [🎨 Color & Size]  [📋 Selection]  [📊 Stats]  [📡 Coordinates]     │  │
│  │                                                                      │  │
│  │ Visualization: ⊙ Scatter Points  ○ Density Map  ○ Contours        │  │
│  │                                                                      │  │
│  │ Show Legend: ☑  Grid: ☑  Axes: ☑                                 │  │
│  │                                                                      │  │
│  │ [⚙ Advanced]  [💾 Save View]  [📤 Export]                         │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  [← Back to Import]  [→ Selection Tools]                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Header:**
  - Title: "Data Visualization: [Dataset Name]", Inter 600, 16px, color #f3f4f6
  - Subtitle: "Working with X data points", Inter 400, 12px, color #9ca3af

- **Main 3D Canvas:**
  - Width: calc(100% - 320px), height: calc(100vh - 200px) on desktop
  - Background: linear-gradient(135deg, rgba(37, 99, 235, 0.05), rgba(10, 10, 26, 0.9))
  - Border: 2px solid rgba(37, 99, 235, 0.3), border-radius: 12px
  - WebGL rendering (Three.js recommended for performance)
  - Points rendered as spheres or custom geometries
  - Color: by magnitude, redshift, or custom field (user-selected)
  - Size: by luminosity, magnitude error, or custom field
  - Universe context layer: fainter points/mesh in background (opacity 0.3)
  - Interactive rotations: drag X→rotate-y, drag Y→rotate-x
  - Zoom: scroll wheel or pinch, smooth animation
  - Selection: click to select single point or drag to box-select multiple

- **Info Bar (below canvas):**
  - Background: rgba(37, 99, 235, 0.1), border-top 1px solid rgba(37, 99, 235, 0.3)
  - Padding: 12px 16px
  - Selection status: "Selection: None selected  |  X selected", Inter 600, 11px, color #60a5fa
  - Data range: "RA [...], Dec [...], Distance [...]", Inter 400, 10px, color #9ca3af
  - Color mapping: "Color: [field name]  |  Size: [field name]", Inter 600, 11px, color #93c5fd

- **Tools Sidebar (right):**
  - Width: 300px, fixed position
  - Background: rgba(37, 99, 235, 0.1), border-left 1px solid rgba(37, 99, 235, 0.3)
  - Padding: 16px
  - Overflow-y: auto

- **Tool Buttons (horizontal tabs in sidebar header):**
  - 4 tabs: Color & Size, Selection, Stats, Coordinates
  - Each: 70px width, height: 36px
  - Background: rgba(37, 99, 235, 0.15), border-bottom 2px solid transparent
  - Active tab: border-color #2563eb, background rgba(37, 99, 235, 0.3)
  - Text: Inter 600, 11px, color #93c5fd / #6b7280
  - Icon before text: 14px, margin-right 6px

- **Visualization Type Selector:**
  - Title: Inter 600, 11px, color #9ca3af, all-caps
  - Radio buttons: 3 options (Scatter, Density, Contours)
  - Spacing: 12px between options
  - Label: Inter 400, 11px, color #d1d5db

- **Checkboxes:**
  - ☑ Show Legend, ☑ Grid, ☑ Axes
  - 16px × 16px, spacing: 12px between
  - Label: Inter 400, 11px, color #d1d5db

- **Sidebar Buttons:**
  - [⚙ Advanced]: 100% width, height 36px, background rgba(37, 99, 235, 0.15), border 1px solid rgba(37, 99, 235, 0.4)
  - [💾 Save View]: 100% width, height 36px, same styling
  - [📤 Export]: 100% width, height 36px, background linear-gradient(135deg, #2563eb, #8b5cf6), text #ffffff
  - Text: Inter 600, 11px
  - Margin: 8px 0 between buttons
  - Tap: ripple + scale 0.96

- **Navigation Buttons (bottom):**
  - [← Back to Import]: 150px, background transparent, border 1px solid rgba(37, 99, 235, 0.4), text #93c5fd
  - [→ Selection Tools]: calc(100% - 158px), gradient background, text #ffffff
  - Height: 44px

---

## Screen 6.5: Selection Tools Panel

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ◄              Data Visualization: Galaxy Cluster Sample       ⋮           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║                                                                       ║  │
│  ║              [3D Canvas with selection tools active]                  ║  │
│  ║                                                                       ║  │
│  ║             ◈ ◇ ◈ [✓selection box visible]                           ║  │
│  ║            ◈◈ ◇◇◇ ◈ ┌─────────┐  ◇ ◇  ◈                             ║  │
│  ║           ◈◇◇◇◈◈◈◇ │  ◈ ◈◈ ◇ │ ◆ ◈ ◇ ◆                             ║  │
│  ║          ◈ ◇ ◈◈◈◇ ◈ │◈ ◇◇◇◇ │ ◈ ◇ ◆◆                             ║  │
│  ║         ◇ ◈◈◈ ◇◇◇ ◈ └─────────┘ ◈◈ ◇ ◈                              ║  │
│  ║                                                                       ║  │
│  ║  Selected: 247 points (4.7% of dataset) shown in yellow highlight   ║  │
│  ║                                                                       ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                             │
│  SELECTION TOOLS SIDEBAR                                                   │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ SELECTION MODE                                                      │  │
│  │ ◉ Box Select (drag rectangle)                                      │  │
│  │ ◯ Lasso Select (free draw)                                         │  │
│  │ ◯ Radius Select (click center, set radius)                         │  │
│  │ ◯ Invert Selection (toggle selected/unselected)                    │  │
│  │                                                                      │  │
│  │ SELECTION ACTIONS                                                   │  │
│  │ [Clear Selection]  [Invert]  [Expand 10%]  [Contract 10%]          │  │
│  │                                                                      │  │
│  │ SELECTION INFO                                                      │  │
│  │ Points selected: 247  |  Percentage: 4.7%                          │  │
│  │                                                                      │  │
│  │ Properties of selected:                                             │  │
│  │ • Mean Magnitude: 8.3 ± 0.2 (mag)                                 │  │
│  │ • Mean RA: 10.45h ± 2.1h                                           │  │
│  │ • Mean Dec: +15.2° ± 8.5°                                         │  │
│  │ • Distance range: 2.1 - 8.4 Mpc                                    │  │
│  │                                                                      │  │
│  │ [✓ Copy Selection to Clipboard]  [Export as CSV]                  │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  [← Back]  [→ Color & Size Mapping]                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **3D Canvas:**
  - Same as Screen 6.4, with selection box overlay visible
  - Selected points: highlighted in yellow (#f59e0b), slightly enlarged (1.2× scale)
  - Selection box: 2px dashed border #f59e0b, background rgba(245, 158, 11, 0.1)

- **Sidebar Title:**
  - "SELECTION TOOLS", Inter 700, 12px, color #f3f4f6, all-caps

- **Selection Mode Radios:**
  - ◉ Box Select, ◯ Lasso Select, ◯ Radius Select, ◯ Invert Selection
  - Radio circles: 16px, selected #f59e0b, unselected rgba(37, 99, 235, 0.4)
  - Labels: Inter 400, 11px, color #d1d5db
  - Descriptions: Inter 400, 10px, color #9ca3af, parenthetical

- **Selection Actions (buttons):**
  - 4 buttons, equal width, grid layout
  - Height: 36px, background rgba(245, 158, 11, 0.15), border 1px solid #f59e0b
  - Text: Inter 600, 11px, color #fbbf24
  - Border-radius: 6px
  - Tap: ripple + scale 0.96

- **Selection Info Section:**
  - Title: Inter 700, 11px, color #f3f4f6, all-caps
  - Count: "Points selected: 247", Inter 600, 12px, color #60a5fa
  - Percentage: "4.7%", Inter 600, 12px, color #60a5fa
  - Divider: 1px solid rgba(37, 99, 235, 0.3), margin: 8px 0

- **Properties List:**
  - Title: Inter 600, 11px, color #9ca3af, all-caps
  - Properties: bullet list, each line Inter 400, 11px, color #d1d5db
  - Format: "• Property: value ± error (unit)"
  - Metric values: Inter 600, 12px, color #60a5fa

- **Export Buttons:**
  - [✓ Copy to Clipboard]: 100% width, height 36px, background rgba(16, 185, 129, 0.15), border 1px solid #10b981, text #6ee7b7
  - [Export as CSV]: 100% width, height 36px, background transparent, border 1px solid rgba(37, 99, 235, 0.4), text #93c5fd
  - Text: Inter 600, 11px
  - Margin: 8px 0

- **Navigation Buttons:**
  - [← Back]: 80px, transparent, text #6b7280
  - [→ Color & Size Mapping]: calc(100% - 88px), gradient, text #ffffff
  - Height: 44px

---

## Screen 6.6: Color & Size Mapping Controls

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ◄              Data Visualization: Galaxy Cluster Sample       ⋮           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║                                                                       ║  │
│  ║              [3D Canvas with color gradient applied]                  ║  │
│  ║                                                                       ║  │
│  ║             ■ □ ■ (points now colored by selected property)          ║  │
│  ║            ■■ ■■■ ■ ░░░░ ░ ■ ■ ░░■                                  ║  │
│  ║           ■░░░■■■░ ■ ░░░░ ■ ░ ░░░                                   ║  │
│  ║          ■ □ ■■■░ ■ ░░░░░ ■■ □ ■■                                  ║  │
│  ║         □ ■■■ □░░░ ■ ░░ ░ ■                                         ║  │
│  ║                                                                       ║  │
│  ║  Legend (bottom-left):                                               ║  │
│  ║  Blue [──────────────────] Red                                      ║  │
│  ║  Low Magnitude              High Magnitude                           ║  │
│  ║                                                                       ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                             │
│  COLOR & SIZE MAPPING SIDEBAR                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ COLOR MAPPING                                                        │  │
│  │ Map color to: [Magnitude] ▼                                         │  │
│  │ Available columns: Luminosity, Distance, Redshift, Metallicity,     │  │
│  │                   Temperature, Size_arcmin, ...                     │  │
│  │                                                                      │  │
│  │ Color Scale: ◉ Sequential  ◯ Diverging  ◯ Categorical             │  │
│  │                                                                      │  │
│  │ Gradient Editor:                                                     │  │
│  │ [Blue] ━━━━━━━━━━━━━━━ [Cyan] ━━━━━━━ [Red]                        │  │
│  │  (low)  10%  20%  30%  40%  50%  60%  70%  80%  90%  (high)        │  │
│  │ Click to adjust color stops                                          │  │
│  │                                                                      │  │
│  │ [Add Color Stop]  [Remove Stop]  [Reset Gradient]                  │  │
│  │                                                                      │  │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━            │  │
│  │                                                                      │  │
│  │ SIZE MAPPING                                                         │  │
│  │ Map size to: [Luminosity] ▼                                         │  │
│  │ Size scale: ◄ 0.5 ──●────────────── 3.0 ► (multiplier)             │  │
│  │ ◉ Linear scaling  ◯ Logarithmic (for wide dynamic range)           │  │
│  │                                                                      │  │
│  │ [Reset Colors]  [Reset Sizes]  [Save Mapping Preset]               │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  [← Back]  [→ Statistics & Analysis]                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **3D Canvas:**
  - Points colored according to selected property
  - Sizes scaled according to size mapping
  - Legend overlay (bottom-left): gradient bar with labels
  - Legend background: rgba(10, 10, 26, 0.8), border 1px solid rgba(37, 99, 235, 0.3)
  - Padding: 8px, border-radius: 4px

- **Sidebar Title:**
  - "COLOR & SIZE MAPPING", Inter 700, 12px, #f3f4f6

- **Color Mapping Section:**
  - Label: "Map color to:", Inter 600, 11px, #9ca3af
  - Dropdown: width 100%, height 40px, background rgba(10, 10, 26, 0.6)
  - Available columns: Inter 400, 10px, #9ca3af, wrapped below

- **Color Scale Selector:**
  - 3 radio buttons: Sequential, Diverging, Categorical
  - Radio: 14px, selected #2563eb, unselected rgba(37, 99, 235, 0.4)
  - Labels: Inter 400, 11px, #d1d5db
  - Margin: 8px 0

- **Gradient Editor:**
  - Background: rgba(37, 99, 235, 0.1), border 1px solid rgba(37, 99, 235, 0.3)
  - Border-radius: 8px, padding: 12px
  - Color bar: height 20px, border 1px solid rgba(37, 99, 235, 0.3), border-radius: 3px
  - Gradient: rendered smoothly between color stops
  - Color stops: small circles (8px) positioned at percentages
  - Click stop: color picker opens, allows adjustment
  - Percentage labels: Inter 400, 8px, #9ca3af, below bar

- **Gradient Buttons:**
  - [Add Color Stop], [Remove Stop], [Reset Gradient]
  - Width: calc(33.33% - 8px), height: 32px
  - Background: rgba(37, 99, 235, 0.15), border 1px solid rgba(37, 99, 235, 0.3)
  - Text: Inter 600, 10px, #93c5fd
  - Margin: 8px 0

- **Size Mapping Section:**
  - Divider: 1px solid rgba(37, 99, 235, 0.3), margin: 12px 0
  - Label: "Map size to:", Inter 600, 11px, #9ca3af
  - Dropdown: width 100%, height 40px

- **Size Scale Slider:**
  - Label: "Size scale:", Inter 600, 11px, #9ca3af
  - Range input: width 100%, height 6px
  - Track: background rgba(37, 99, 235, 0.2), accent #8b5cf6
  - Thumb: 16px, background #8b5cf6
  - Value display: [0.5] and [3.0], width 40px each, height 32px, text Inter 500, 11px
  - Multiplier note: Inter 400, 10px, #9ca3af

- **Scaling Mode:**
  - 2 radios: Linear, Logarithmic
  - Labels: Inter 400, 11px, #d1d5db
  - Description: Inter 400, 10px, #9ca3af, parenthetical

- **Bottom Buttons:**
  - [Reset Colors], [Reset Sizes]: each 100% width, height 36px, background rgba(37, 99, 235, 0.15), border 1px solid #2563eb
  - [Save Mapping Preset]: 100% width, height 36px, background rgba(139, 92, 246, 0.15), border 1px solid #8b5cf6, text #a78bfa
  - Text: Inter 600, 11px
  - Margin: 6px 0 between buttons

- **Navigation Buttons:**
  - [← Back]: 80px, transparent
  - [→ Statistics & Analysis]: calc(100% - 88px), gradient background
  - Height: 44px

---

## Screen 6.7: Properties & Statistics Panel

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ◄              Data Visualization: Galaxy Cluster Sample       ⋮           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║                                                                       ║  │
│  ║              [3D Canvas with property panel visible]                 ║  │
│  ║                                                                       ║  │
│  ║  (click point → info displays in sidebar)                           ║  │
│  ║                                                                       ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                             │
│  PROPERTIES & STATISTICS SIDEBAR                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ SELECTED OBJECT PROPERTIES (click point to inspect)                 │  │
│  │                                                                      │  │
│  │ Object ID: M74_G123                                                 │  │
│  │ RA: 11h 26m 54.6s (171.728°)    |  Dec: +15° 47' 14" (+15.787°)   │  │
│  │ Distance: 6.47 ± 0.32 Mpc       |  Redshift: z = 0.00305          │  │
│  │ Magnitude (V-band): 8.24 ± 0.05 |  Surface Brightness: 18.3 mag   │  │
│  │ Luminosity (B-V): 1.08 ± 0.08   |  Morphology: Spiral (Sb)        │  │
│  │ Size (angular): 28.6 × 25.3'    |  PA (position angle): 35°        │  │
│  │                                                                      │  │
│  │ ━━━━ DISTRIBUTION STATISTICS (current selection: 247 objects) ━━━  │  │
│  │                                                                      │  │
│  │ MAGNITUDE HISTOGRAM                                                  │  │
│  │ ┌──────────────────────────────────────────────────────────────┐  │  │
│  │ │  Freq                                                        │  │  │
│  │ │     ║  ╔╗ ╔╗      ║ ║                                       │  │  │
│  │ │     ║  ║║ ║║ ║╗   ║ ║                                       │  │  │
│  │ │  ███║███║████║███████                                       │  │  │
│  │ │  ███║███║████║███████                                       │  │  │
│  │ │  ───┴──┴─┴───┴───────────────────────────────────────      │  │  │
│  │ │      6    8    10    12    14    16    Magnitude           │  │  │
│  │ │  Mean: 8.3 ± 0.21  |  Median: 8.2  |  Mode: 8.1           │  │  │
│  │ │  Min: 6.04 | Max: 14.67 | Σ: 247 objects                 │  │  │
│  │ └──────────────────────────────────────────────────────────────┘  │  │
│  │                                                                      │  │
│  │ DISTANCE vs MAGNITUDE (Scatter Plot)                               │  │
│  │ ┌──────────────────────────────────────────────────────────────┐  │  │
│  │ │ Distance                                                     │  │  │
│  │ │ (Mpc)     ◆◆ ◆ ◇  ◆◆◆                                       │  │  │
│  │ │   10  ◆◇◆◇◆◇◆  ◆◇  ◆◆ ◆◇                                   │  │  │
│  │ │    8  ◆◇ ◆◇◆◇◆◆  ◇ ◆                                       │  │  │
│  │ │    6      ◇  ◇                                              │  │  │
│  │ │    4                                                        │  │  │
│  │ │    ───────────────────────────────────────────────────────  │  │  │
│  │ │        6     8    10    12    14    Magnitude (V)           │  │  │
│  │ │  Correlation: 0.034 (very weak)                            │  │  │
│  │ └──────────────────────────────────────────────────────────────┘  │  │
│  │                                                                      │  │
│  │ [Export Statistics CSV]  [Fit Model]  [More Plots ▼]              │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  [← Back]  [→ Publication Export]                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Sidebar Title:**
  - "PROPERTIES & STATISTICS", Inter 700, 12px, #f3f4f6, all-caps

- **Selected Object Properties:**
  - Title: Inter 600, 11px, #9ca3af, "(click point to inspect)"
  - Properties in grid: 2 columns
  - Property name: Inter 600, 11px, #d1d5db
  - Value: Inter 700, 12px, #60a5fa
  - Unit/note: Inter 400, 10px, #9ca3af, parenthetical
  - Divider: 1px solid rgba(37, 99, 235, 0.3), margin: 8px 0

- **Distribution Statistics Section:**
  - Title: Inter 700, 11px, #9ca3af, all-caps
  - Subtitle: Inter 400, 10px, #9ca3af, "(current selection info)"
  - Divider: 1px solid rgba(37, 99, 235, 0.3)

- **Histogram:**
  - Container: width 100%, height 120px
  - Background: rgba(37, 99, 235, 0.1), border 1px solid rgba(37, 99, 235, 0.3)
  - Border-radius: 6px, padding: 12px
  - SVG bar chart: bars #2563eb, opacity 0.8
  - Axes: monospace font (JetBrains Mono 9px), color #9ca3af
  - Grid lines: 1px dashed rgba(37, 99, 235, 0.2)
  - Statistics row below: "Mean: 8.3 ± 0.21 | Median: 8.2 | Mode: 8.1", Inter 600, 10px, #60a5fa
  - Range row: "Min/Max/Count", Inter 400, 9px, #9ca3af

- **Scatter Plot (Distance vs Magnitude):**
  - Container: width 100%, height 140px
  - Background: rgba(37, 99, 235, 0.1), border 1px solid rgba(37, 99, 235, 0.3)
  - Border-radius: 6px, padding: 12px
  - SVG scatter plot: points #8b5cf6, opacity 0.7, size 6px
  - Axes: monospace font, color #9ca3af
  - Grid: dashed lines rgba(37, 99, 235, 0.2)
  - Correlation value below: "Correlation: 0.034 (very weak)", Inter 600, 10px, #60a5fa

- **Export Buttons:**
  - [Export Statistics CSV]: width calc(100% - 170px), height 36px, background rgba(16, 185, 129, 0.15), border 1px solid #10b981, text #6ee7b7
  - [Fit Model]: 80px, background rgba(139, 92, 246, 0.15), border 1px solid #8b5cf6, text #a78bfa
  - [More Plots ▼]: 100px, background transparent, border 1px solid rgba(37, 99, 235, 0.4), text #93c5fd
  - Text: Inter 600, 10px
  - Margin: 8px 0

- **Navigation Buttons:**
  - [← Back]: 80px, transparent
  - [→ Publication Export]: calc(100% - 88px), gradient background
  - Height: 44px

---

## Screen 6.8: Publication Export Dialog

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ◄              Data Visualization: Galaxy Cluster Sample       ⋮           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [Fixed position dialog overlaid on canvas]                               │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │  Export for Publication                              [✕]          │   │
│  ├────────────────────────────────────────────────────────────────────┤   │
│  │                                                                    │   │
│  │  CANVAS PREVIEW (thumbnail)                                       │   │
│  │  ┌──────────────────────────────────────────────────────────────┐ │   │
│  │  │  (Preview of 3D canvas at export resolution)                │ │   │
│  │  │                                                              │ │   │
│  │  │   ■ □ ■                                                     │ │   │
│  │  │  ■■ ■■■ ■  (size corresponds to selected output)           │ │   │
│  │  │ ■□□□■■■□                                                   │ │   │
│  │  │                                                              │ │   │
│  │  │  Legend: [color bar]                                        │ │   │
│  │  │                                                              │ │   │
│  │  └──────────────────────────────────────────────────────────────┘ │   │
│  │                                                                    │   │
│  │  FORMAT & RESOLUTION                                              │   │
│  │  Format: ◉ PNG (high-quality raster)  ◯ SVG (vector)  ◯ PDF    │   │
│  │  Resolution: [3840 x 2160] (4K) ▼                               │   │
│  │  (options: 1920x1080, 2560x1440, 3840x2160, 7680x4320)          │   │
│  │  DPI (for PDF): [300] ▼  (typical print: 300 DPI)              │   │
│  │                                                                    │   │
│  │  AXES & LABELS                                                    │   │
│  │  ☑ Show axes (RA, Dec, Distance)                               │   │
│  │  ☑ Show axis labels                                             │   │
│  │  ☑ Show tick marks                                              │   │
│  │  ☑ Show legend (color/size mapping)                             │   │
│  │  ☑ Show scale bar (distance reference)                          │   │
│  │  ☑ Show grid                                                    │   │
│  │                                                                    │   │
│  │  TEXT & ANNOTATIONS                                               │   │
│  │  Title: [My Galaxy Cluster (SDSS)] ▼                            │   │
│  │  Subtitle: [Dataset: 5,247 galaxies] ▼                          │   │
│  │  Include publication metadata: ☐                                 │   │
│  │                                                                    │   │
│  │  BACKGROUND                                                       │   │
│  │  ◉ Transparent  ◯ White  ◯ Black  ◯ Custom                    │   │
│  │  (white background recommended for print)                         │   │
│  │                                                                    │   │
│  │  CAMERA SETTINGS                                                  │   │
│  │  ☑ Use current view orientation                                 │   │
│  │  Rotation: [Current]  [Reset to Default]  [Front View]  [Top]  │   │
│  │                                                                    │   │
│  │  QUALITY OPTIONS                                                  │   │
│  │  ☑ Render at highest quality (slower)                           │   │
│  │  ☑ Smooth point rendering (anti-aliasing)                       │   │
│  │  ☑ Depth of field effect (blur distant points)                 │   │
│  │                                                                    │   │
│  │  [Save as Template]  [← Preview]  [Export →]                    │   │
│  │                                                                    │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **Modal Dialog:**
  - Position: fixed center, width 650px, height calc(100vh - 100px)
  - Background: rgba(15, 23, 42, 0.98), border 2px solid #2563eb
  - Border-radius: 12px, padding: 24px
  - Z-index: 1000
  - Box-shadow: 0 16px 48px rgba(0, 0, 0, 0.8)
  - Overflow-y: auto
  - Close button (✕): top-right 16px, size 24px, color #9ca3af

- **Title:**
  - Inter 700, 18px, color #f3f4f6
  - Margin-bottom: 16px

- **Canvas Preview (thumbnail):**
  - Width: calc(100% - 16px), height: 180px
  - Background: linear-gradient(135deg, rgba(37, 99, 235, 0.05), rgba(139, 92, 246, 0.05))
  - Border: 1px solid rgba(37, 99, 235, 0.3), border-radius: 8px
  - Padding: 12px, margin-bottom: 16px
  - Rendered canvas preview (static image)

- **Format & Resolution Section:**
  - Title: Inter 700, 11px, color #d1d5db, all-caps, letter-spacing 1px
  - Radios: 3 options (PNG, SVG, PDF)
  - Radio: 14px, selected #2563eb, unselected rgba(37, 99, 235, 0.4)
  - Labels: Inter 400, 11px, color #d1d5db
  - Dropdowns: width calc(100% - 32px), height 40px, background rgba(10, 10, 26, 0.6)
  - Text: Inter 500, 12px, color #f3f4f6
  - DPI input: width 80px, height 40px, appears only for PDF

- **Checkboxes Section:**
  - Multiple checkbox groups with dividers
  - Checkbox: 16px × 16px
  - Label: Inter 400, 11px, color #d1d5db
  - Divider: 1px solid rgba(37, 99, 235, 0.3), margin: 12px 0

- **Text Input Fields:**
  - Title field: width calc(100% - 32px), height 40px, background rgba(10, 10, 26, 0.6)
  - Placeholder: "Enter title", Inter 400, 12px, color #6b7280
  - Same styling for subtitle

- **Camera Settings:**
  - Current view button: background rgba(37, 99, 235, 0.15), border 1px solid #2563eb, text #93c5fd
  - [Reset to Default], [Front View], [Top]: same styling, width calc(25% - 9px)
  - Height: 36px, Inter 600, 10px

- **Bottom Buttons:**
  - [Save as Template]: 140px, background transparent, border 1px solid rgba(37, 99, 235, 0.4), text #93c5fd
  - [← Preview]: 100px, background transparent, border 1px solid rgba(37, 99, 235, 0.4), text #6b7280
  - [Export →]: 100px, background linear-gradient(135deg, #2563eb, #8b5cf6), text #ffffff
  - Height: 44px, Inter 600, 12px
  - Grid layout: 3 equal widths

---

## Screen 6.9: Coordinate System Switcher

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ◄              Data Visualization: Galaxy Cluster Sample       ⋮           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║                                                                       ║  │
│  ║              [3D Canvas with coordinate system overlay]              ║  │
│  ║                                                                       ║  │
│  ║          X (Red) ←───●───→ Y (Green)                                ║  │
│  ║                      ↑                                                ║  │
│  ║                      Z (Blue)                                        ║  │
│  ║                                                                       ║  │
│  ║   ■ □ ■  [Data reoriented to match selected system]               ║  │
│  ║  ■■ ■■■ ■                                                           ║  │
│  ║ ■□□□■■■□ ◈  (previous points in faded, new position bright)       ║  │
│  ║                                                                       ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                             │
│  COORDINATE SYSTEM SIDEBAR                                                │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ACTIVE COORDINATE SYSTEM                                            │  │
│  │ Current: ◉ ICRS (RA/Dec/Distance)                                  │  │
│  │          ◯ Galactic (L/B/Distance)                                 │  │
│  │          ◯ Ecliptic (λ/β/Distance)                                │  │
│  │          ◯ Supergalactic (SGL/SGB/Distance)                       │  │
│  │          ◯ Custom (user-defined transformation)                   │  │
│  │                                                                      │  │
│  │ COORDINATE DISPLAY CONVENTIONS                                      │  │
│  │ Longitude format: ◉ Degrees (0-360°)  ◯ Hours (0-24h)             │  │
│  │ Declination format: ◉ Decimal (±90°)  ◯ DMS (D:M:S)              │  │
│  │                                                                      │  │
│  │ ━━━━ VISUALIZATION OPTIONS ━━━━                                    │  │
│  │ ☑ Show coordinate axes (XYZ with labels)                           │  │
│  │ ☑ Show grid lines (reference frame grid overlay)                   │  │
│  │ ☑ Show ecliptic plane (if Ecliptic or Galactic system)           │  │
│  │ ☐ Show galactic plane                                              │  │
│  │ ☐ Show supergalactic plane                                         │  │
│  │                                                                      │  │
│  │ Axis color scheme: ◉ Standard (R/G/B)  ◯ High contrast             │  │
│  │ Grid opacity: [50%] ◄─────────●────────► [100%]                   │  │
│  │                                                                      │  │
│  │ ━━━━ EPOCH & PRECESSION ━━━━                                       │  │
│  │ (For ICRS coordinates)                                              │  │
│  │ Epoch: [J2000.0] ▼  (reference epoch for RA/Dec)                   │  │
│  │ Apply precession/nutation: ☑  (auto for different epochs)          │  │
│  │                                                                      │  │
│  │ ━━━━ QUICK PRESETS ━━━━                                            │  │
│  │ [Load ICRS]  [Load Galactic]  [Load Ecliptic]  [Save Current]      │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  [← Back]  [→ API Console]                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **3D Canvas:**
  - Shows 3D axis indicators at origin (X red, Y green, Z blue)
  - Grid lines projected on major planes (optional)
  - Data reoriented when system changes (smooth animation 500ms)

- **Sidebar Title:**
  - "COORDINATE SYSTEM", Inter 700, 12px, #f3f4f6, all-caps

- **Active System Radios:**
  - 5 options: ICRS, Galactic, Ecliptic, Supergalactic, Custom
  - Radio: 16px, selected #2563eb, unselected rgba(37, 99, 235, 0.4)
  - Labels: Inter 600, 11px, color #d1d5db
  - Description: Inter 400, 10px, color #9ca3af, in parentheses

- **Convention Selector:**
  - Title: Inter 700, 11px, color #9ca3af, all-caps
  - 2 rows of radio buttons
  - Radio: 14px, spacing: 12px
  - Labels: Inter 400, 11px, color #d1d5db

- **Visualization Options:**
  - Checkboxes: 16px × 16px
  - Labels: Inter 400, 11px, color #d1d5db
  - Margin: 8px 0 per checkbox

- **Opacity Slider:**
  - Label: "Grid opacity:", Inter 600, 11px, color #9ca3af
  - Range input: width calc(100% - 80px), height 6px
  - Values: [50%] and [100%], width 40px each
  - Text: Inter 500, 11px, color #f3f4f6

- **Epoch & Precession:**
  - Title: Inter 700, 11px, color #9ca3af, all-caps
  - Note: "(For ICRS coordinates)", Inter 400, 10px, color #9ca3af
  - Dropdown: width 180px, height 40px
  - Checkbox: 16px × 16px, label Inter 400, 11px

- **Quick Preset Buttons:**
  - 4 buttons, equal width, grid layout
  - Height: 36px, background rgba(37, 99, 235, 0.15), border 1px solid rgba(37, 99, 235, 0.3)
  - Text: Inter 600, 11px, color #93c5fd
  - Tap: ripple + scale 0.96

- **Navigation Buttons:**
  - [← Back]: 80px, transparent
  - [→ API Console]: calc(100% - 88px), gradient background
  - Height: 44px

---

## Screen 6.10: API Console & Collaboration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ◄              Data Visualization: Galaxy Cluster Sample       ⋮           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║                                                                       ║  │
│  ║              [3D Canvas - smaller, left side]                        ║  │
│  ║                                                                       ║  │
│  ║   ■ □ ■                                                              ║  │
│  ║  ■■ ■■■ ■  (canvas updates as you code)                            ║  │
│  ║ ■□□□■■■□                                                            ║  │
│  ║                                                                       ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                             │
│  CODE EDITOR SIDEBAR (right side)                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ API CONSOLE & SCRIPTING                                             │  │
│  │ Language: ◉ JavaScript  ◯ Python                                   │  │
│  │                                                                      │  │
│  │ Code Editor:                                                         │  │
│  │ ┌──────────────────────────────────────────────────────────────────┐│  │
│  │ │1  // Query: Find all galaxies brighter than mag 10              ││  │
│  │ │2  const result = data.query({                                   ││  │
│  │ │3    magnitude: { $lte: 10 },                                    ││  │
│  │ │4    distance: { $gte: 2, $lte: 10 }  // Mpc                    ││  │
│  │ │5  });                                                            ││  │
│  │ │6  result.colorBy('magnitude');                                  ││  │
│  │ │7  result.sizeBy('luminosity', 0.5, 3.0);                        ││  │
│  │ │8  result.show();                                                ││  │
│  │ │9                                                                 ││  │
│  │ │10                                                                ││  │
│  │ └──────────────────────────────────────────────────────────────────┘│  │
│  │ [Run Query (Ctrl+Enter)]  [Clear]  [Format]  [Save Snippet]        │  │
│  │                                                                      │  │
│  │ OUTPUT / RESULTS:                                                    │  │
│  │ ┌──────────────────────────────────────────────────────────────────┐│  │
│  │ │ ✓ Query executed successfully (156 ms)                          ││  │
│  │ │ Matched 187 objects                                             ││  │
│  │ │ Mean magnitude: 8.2 ± 0.3                                       ││  │
│  │ │ Mean distance: 5.6 ± 1.2 Mpc                                    ││  │
│  │ │                                                                  ││  │
│  │ │ [Copy results]  [Export as CSV]  [Export as JSON]              ││  │
│  │ └──────────────────────────────────────────────────────────────────┘│  │
│  │                                                                      │  │
│  │ ━━━━ COLLABORATION & SHARING ━━━━                                  │  │
│  │ Share this view: [Generate Share Link]  [📋 Copy URL]            │  │
│  │ Share Link: https://cosmosxplr.app/v/abc123def456                │  │
│  │                                                                      │  │
│  │ Viewers can: ◉ View only  ◯ View + comment  ◯ Edit              │  │
│  │ Link expires: [Never] ▼                                            │  │
│  │ ☑ Require password                                                 │  │
│  │ ☐ Track viewer analytics                                           │  │
│  │                                                                      │  │
│  │ [Manage Sharing]  [Unshare]                                        │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  [← Back]  [↻ Refresh Data]  [💾 Save Session]  [📤 Export All]           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- **3D Canvas (left side):**
  - Width: calc(100% - 320px), height: calc(100vh - 200px)
  - Live updates as code executes
  - Slightly reduced from full-screen

- **Sidebar (right side):**
  - Width: 300px, position: fixed right
  - Background: rgba(37, 99, 235, 0.1), border-left 1px solid rgba(37, 99, 235, 0.3)
  - Padding: 16px, overflow-y: auto

- **Sidebar Title:**
  - "API CONSOLE & SCRIPTING", Inter 700, 12px, #f3f4f6, all-caps

- **Language Toggle:**
  - ◉ JavaScript, ◯ Python
  - Radio: 14px, selected #2563eb, unselected rgba(37, 99, 235, 0.4)
  - Label: Inter 400, 11px, color #d1d5db

- **Code Editor:**
  - Background: rgba(10, 10, 26, 0.8), border 1px solid rgba(37, 99, 235, 0.3)
  - Border-radius: 6px, padding: 12px
  - Height: 200px, overflow-y: auto, overflow-x: auto
  - Font: JetBrains Mono 11px, color #d1d5db
  - Line numbers: color #6b7280, right-aligned, width 32px
  - Syntax highlighting:
    - Keywords (const, let, etc.): color #f59e0b
    - Strings: color #10b981
    - Comments: color #6b7280, italics
    - Numbers: color #60a5fa
  - Tab width: 2 spaces
  - Cursor: thin vertical line, color #60a5fa

- **Editor Buttons:**
  - [Run Query (Ctrl+Enter)]: width calc(100% - 90px), height 32px, background linear-gradient(135deg, #2563eb, #8b5cf6), text #ffffff
  - [Clear]: 50px, background transparent, border 1px solid rgba(37, 99, 235, 0.4)
  - [Format]: 60px, background transparent, border 1px solid rgba(37, 99, 235, 0.4)
  - [Save Snippet]: 90px, background rgba(139, 92, 246, 0.15), border 1px solid #8b5cf6, text #a78bfa
  - Text: Inter 600, 10px
  - Margin: 8px 0

- **Output Panel:**
  - Background: rgba(10, 10, 26, 0.6), border 1px solid rgba(37, 99, 235, 0.3)
  - Border-radius: 6px, padding: 12px
  - Height: 120px, overflow-y: auto
  - Font: JetBrains Mono 10px, color #d1d5db
  - Success icon (✓): color #10b981
  - Line 1: Inter 700, 11px, color #10b981 (status)
  - Results: Inter 400, 10px, color #9ca3af

- **Output Buttons:**
  - [Copy results], [Export as CSV], [Export as JSON]
  - Width: calc(33.33% - 8px), height: 28px
  - Background: rgba(37, 99, 235, 0.15), border 1px solid rgba(37, 99, 235, 0.3)
  - Text: Inter 600, 9px, color #93c5fd

- **Sharing Section:**
  - Title: Inter 700, 11px, color #9ca3af, all-caps
  - Divider: 1px solid rgba(37, 99, 235, 0.3), margin: 12px 0

- **Share Link Button:**
  - [Generate Share Link]: 100% width, height 36px, background rgba(16, 185, 129, 0.15), border 1px solid #10b981, text #6ee7b7
  - [📋 Copy URL]: 100% width, height 36px, background transparent, border 1px solid rgba(37, 99, 235, 0.4), text #93c5fd

- **Share Link Display:**
  - URL: monospace (JetBrains Mono 9px), color #60a5fa, selectable text
  - Background: rgba(37, 99, 235, 0.1), padding: 8px 12px, border-radius: 4px

- **Share Settings:**
  - Viewer permissions: 3 radios, labels Inter 400, 11px
  - Expires dropdown: width 140px, height 36px
  - Checkboxes: 12px × 12px, labels Inter 400, 11px
  - Margin: 8px 0

- **Management Buttons:**
  - [Manage Sharing]: 100% width, height 36px, background transparent, border 1px solid rgba(37, 99, 235, 0.4), text #93c5fd
  - [Unshare]: 100% width, height 36px, background rgba(239, 68, 68, 0.15), border 1px solid #ef4444, text #fca5a5
  - Text: Inter 600, 10px

- **Navigation Buttons (bottom):**
  - [← Back]: 80px, transparent, text #6b7280
  - [↻ Refresh Data]: 130px, background rgba(37, 99, 235, 0.15), border 1px solid #2563eb, text #93c5fd
  - [💾 Save Session]: 130px, background rgba(139, 92, 246, 0.15), border 1px solid #8b5cf6, text #a78bfa
  - [📤 Export All]: 120px, background linear-gradient(135deg, #2563eb, #8b5cf6), text #ffffff
  - Height: 44px, Inter 600, 11px

---

# CROSS-JOURNEY PATTERNS

**Entity Catalog Integration:** All journey screens reference entity types from Doc 22 v4.2 (96 types). Screen designs should showcase representative examples from all 9 categories, not just planets and galaxies.

## Navigation Hierarchy

**Primary Navigation (Header):**
- Back button (◄): 44px × 44px, top-left, always available
- Title: center-aligned, Inter 600, 16-18px, color #f3f4f6
- Right actions: menu (⋮) or context buttons, 44px × 44px

**Breadcrumb Trail (optional for complex flows):**
- Home › Catalog › Object Detail › Observation Log
- Inter 400, 12px, color #9ca3af
- Arrows (›) in Supernova Gold #f59e0b

**Modal Dialogs:**
- Fixed position center-screen
- Z-index: 1000 (above all content)
- Backdrop: rgba(10, 10, 26, 0.85), click to close
- Border-radius: 12px
- Close button (✕): top-right 16px, color #9ca3af

---

## Error States

**Network Error Modal:**
```
┌──────────────────────────────────────────┐
│ ⚠ Connection Lost                    [✕]│
│                                          │
│ Unable to load data. Check your network │
│ and try again.                          │
│                                          │
│ Error code: 500 Internal Server Error   │
│                                          │
│ [← Go Back]  [Retry]  [Report Issue]   │
└──────────────────────────────────────────┘
```

- **Icon:** ⚠ size 32px, color #ef4444
- **Title:** Inter 700, 16px, color #ef4444
- **Message:** Inter 400, 13px, color #d1d5db, line-height 1.6
- **Error Code:** Inter 400, 11px, color #9ca3af, monospace
- **Buttons:**
  - [← Go Back]: transparent, text #6b7280
  - [Retry]: background rgba(239, 68, 68, 0.2), border 1px solid #ef4444, text #fca5a5
  - [Report Issue]: transparent, text #93c5fd

**WebGL Failure (3D canvas unavailable):**
```
┌──────────────────────────────────────────┐
│ 🖥 WebGL Not Supported                  │
│                                          │
│ Your device doesn't support 3D graphics.│
│ Try:                                     │
│ • Update your browser                   │
│ • Use a different device               │
│ • View 2D charts instead                │
│                                          │
│ [View 2D Alternative] [Get Help]        │
└──────────────────────────────────────────┘
```

- **Icon:** 🖥 size 40px, color #f59e0b
- **Title:** Inter 700, 16px, color #f59e0b
- **Message:** Inter 400, 12px, color #d1d5db
- **List:** bullets Inter 400, 11px, color #9ca3af
- **Buttons:** 2-column grid, height 44px

**Data Load Error (Timeout, invalid format, etc.):**
```
┌──────────────────────────────────────────┐
│ ⚠ Failed to Import Data              [✕]│
│                                          │
│ Problem: "Field 'distance' missing in   │
│ CSV (required for 3D visualization)"   │
│                                          │
│ Solution:                                │
│ 1. Check your CSV headers               │
│ 2. Ensure 'distance' column exists     │
│ 3. Try again                            │
│                                          │
│ [View Sample Format]  [← Go Back]       │
└──────────────────────────────────────────┘
```

- **Icon:** ⚠ size 32px, color #ef4444
- **Title:** Inter 700, 14px, color #ef4444
- **Problem:** Inter 600, 12px, color #fca5a5 (bold), quoted text monospace
- **Solution steps:** numbered list Inter 400, 11px, color #d1d5db
- **Buttons:** [View Sample]: background rgba(16, 185, 129, 0.15), border #10b981
  - [← Go Back]: transparent

---

## Empty States

**No Bookmarks:**
```
┌──────────────────────────────────────────────────┐
│                                                   │
│                  ☆ (empty star)                  │
│                                                   │
│            No Bookmarks Yet                       │
│                                                   │
│  Tap the heart icon to save objects you want    │
│  to revisit later. They'll appear here.         │
│                                                   │
│  [← Explore Objects]                             │
│                                                   │
└──────────────────────────────────────────────────┘
```

- **Icon:** ☆ size 48px, color #6b7280
- **Title:** Inter 700, 16px, color #f3f4f6
- **Message:** Inter 400, 12px, color #9ca3af, centered
- **CTA Button:** [← Explore Objects], background rgba(37, 99, 235, 0.15), border #2563eb

**No Search Results:**
```
┌──────────────────────────────────────────────────┐
│                                                   │
│                  🔍 (search icon)                │
│                                                   │
│            No Results Found                       │
│                                                   │
│  Try:                                            │
│  • Refine your search terms                     │
│  • Check spelling                                │
│  • Use fewer filters                            │
│                                                   │
│  [Clear Filters]  [← Go Back]                    │
│                                                   │
└──────────────────────────────────────────────────┘
```

- **Icon:** 🔍 size 48px, color #6b7280
- **Title:** Inter 700, 16px, color #f3f4f6
- **Tips:** bullet list Inter 400, 11px, color #9ca3af
- **Buttons:** [Clear Filters] (background rgba(139, 92, 246, 0.15)), [← Go Back] (transparent)

**No Observation History:**
```
┌──────────────────────────────────────────────────┐
│                                                   │
│                   📋 (calendar)                   │
│                                                   │
│         No Observations Logged Yet                │
│                                                   │
│  Start your first observation to track your      │
│  viewing experiences and build your catalog.     │
│                                                   │
│  [Log First Observation]                         │
│                                                   │
└──────────────────────────────────────────────────┘
```

- **Icon:** 📋 size 48px, color #6b7280
- **Title:** Inter 700, 16px, color #f3f4f6
- **Message:** Inter 400, 12px, color #9ca3af
- **CTA:** background linear-gradient(135deg, #2563eb, #8b5cf6), text #ffffff

---

## Loading States

**Skeleton Loader (for data tables/lists):**
```
┌────────────────────────────────────────┐
│ ░░░░░░ | ░░░░░░░░░░ | ░░░░░░ | ░░░░░  │
│ ░░░░░░ | ░░░░░░░░░░ | ░░░░░░ | ░░░░░  │ (repeated)
│ ░░░░░░ | ░░░░░░░░░░ | ░░░░░░ | ░░░░░  │
└────────────────────────────────────────┘
```

- **Skeleton blocks:** background rgba(37, 99, 235, 0.2), border-radius 4px
- **Animation:** shimmer effect (background-position animation, left-to-right, 2s infinite)
  - CSS: `background: linear-gradient(90deg, rgba(37, 99, 235, 0.2), rgba(37, 99, 235, 0.4), rgba(37, 99, 235, 0.2))`
  - `background-size: 200% 100%`
  - `animation: shimmer 2s infinite`

**Spinner (for async operations):**
```
    ◜◝ ← rotating circle
    ◟◞
```

- **Size:** 32px or 48px (context-dependent)
- **Color:** linear-gradient(90deg, #2563eb, #8b5cf6)
- **Animation:** rotate 360° over 1s, infinite, linear
- **Position:** centered, with label below if needed

**Progress Bar (multi-step wizard):**
```
████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 25%
```

- **Height:** 8px, border-radius 4px
- **Background:** rgba(37, 99, 235, 0.2)
- **Accent:** linear-gradient(90deg, #2563eb, #8b5cf6)
- **Percentage label:** Inter 600, 11px, color #60a5fa, right-aligned
- **Animation (indeterminate):** background-position pulse 1.5s ease-in-out

---

## Notification & Toast Patterns

**Success Toast (discovery, achievement):**
```
┌──────────────────────────────────────┐
│ ✓ Object Added to Tonight's List    │
└──────────────────────────────────────┘
```

- **Position:** bottom-left, margin 16px
- **Background:** rgba(16, 185, 129, 0.9), border 1px solid #10b981
- **Border-radius:** 8px, padding: 12px 16px
- **Icon (✓):** size 20px, color #10b981
- **Text:** Inter 600, 13px, color #ffffff
- **Animation:** slide-in from bottom (300ms ease-out), auto-dismiss after 3s (slide-out 300ms ease-in)

**Error Toast:**
```
┌──────────────────────────────────────┐
│ ✕ Failed to Save Observation         │
└──────────────────────────────────────┘
```

- **Background:** rgba(239, 68, 68, 0.9), border 1px solid #ef4444
- **Icon (✕):** size 20px, color #ef4444
- **Text:** Inter 600, 13px, color #ffffff
- **Animation:** same as success, duration 4s

**Info Toast (general notification):**
```
┌──────────────────────────────────────┐
│ ℹ Data imported successfully        │
└──────────────────────────────────────┘
```

- **Background:** rgba(37, 99, 235, 0.9), border 1px solid #2563eb
- **Icon (ℹ):** size 20px, color #60a5fa
- **Text:** Inter 600, 13px, color #ffffff

**Undo Toast (reversible actions):**
```
┌──────────────────────────────────────┐
│ ✓ Observation deleted    [Undo]     │
└──────────────────────────────────────┘
```

- **Background:** rgba(16, 185, 129, 0.9)
- **Undo button:** Inter 600, 12px, color #ffffff, underlined
- **Duration:** 5s, auto-dismiss

---

## Progressive Disclosure (Onboarding Across Sessions)

**Session 1 - First Time User:**
1. Brief welcome overlay (50% opacity backdrop)
2. Gesture onboarding (touch hints, animated hands)
3. Guided tour through interface highlights
4. Bookmark or skip onboarding for future sessions

**Session 2 - Returning User:**
1. Brief tip of the day (collapsible)
2. "New feature" badge on recently added functionality
3. No forced onboarding

**Per-Feature Onboarding:**
- First time accessing Color Mapping → tooltip + brief explanation
- First time exporting data → step-by-step wizard highlighted
- Tooltips appear on hover (Inter 400, 11px, color #f3f4f6, background rgba(10, 10, 26, 0.95), border 1px solid #2563eb)

---

## Micro-Interaction Library

### Button States

**Primary Action Button (CTA):**
- **Default:** background linear-gradient(135deg, #2563eb, #8b5cf6), color #ffffff, box-shadow 0 4px 12px rgba(37, 99, 235, 0.3)
- **Hover (pointer):** shadow 0 6px 16px rgba(37, 99, 235, 0.4), no scale change
- **Active (pressed):** shadow 0 2px 8px rgba(37, 99, 235, 0.3), scale 0.98
- **Focus (keyboard):** outline 2px solid rgba(37, 99, 235, 0.6), offset 2px
- **Disabled:** opacity 0.5, cursor not-allowed, shadow none
- **Ripple animation:** white ripple from click center, opacity fade over 600ms, radial-gradient

**Secondary Button:**
- **Default:** background transparent, border 1px solid rgba(37, 99, 235, 0.4), color #93c5fd
- **Hover:** background rgba(37, 99, 235, 0.15), border-color #2563eb
- **Active:** background rgba(37, 99, 235, 0.25), scale 0.96
- **Focus:** outline 2px solid rgba(37, 99, 235, 0.6)
- **Ripple:** same as primary

**Danger Button:**
- **Default:** background transparent, border 1px solid rgba(239, 68, 68, 0.4), color #fca5a5
- **Hover:** background rgba(239, 68, 68, 0.15), border-color #ef4444
- **Active:** background rgba(239, 68, 68, 0.25), scale 0.96
- **Ripple:** red ripple (rgba(239, 68, 68, 0.3))

---

### Form Inputs

**Text Input Field:**
- **Default:** background rgba(10, 10, 26, 0.6), border 1px solid rgba(37, 99, 235, 0.4), color #f3f4f6, padding 12px 16px, border-radius 8px
- **Focus:** border-color #2563eb, box-shadow 0 0 0 3px rgba(37, 99, 235, 0.2)
- **Filled:** text color #f3f4f6
- **Placeholder:** color #6b7280
- **Error:** border-color #ef4444, box-shadow 0 0 0 3px rgba(239, 68, 68, 0.2)
- **Typing animation:** cursor blinking (1s infinite)
- **Transition:** border-color 200ms ease-out, box-shadow 200ms ease-out

**Checkbox:**
- **Default:** background transparent, border 2px solid rgba(37, 99, 235, 0.4), size 16px × 16px, border-radius 3px
- **Hover:** border-color #2563eb
- **Checked:** background #2563eb, checkmark ✓ color white (size 12px), animation: scale 0.7 → 1.0 over 200ms
- **Focus:** outline 2px solid rgba(37, 99, 235, 0.6), offset 2px
- **Disabled:** opacity 0.5, cursor not-allowed

**Radio Button:**
- **Default:** outer circle 16px diameter, border 2px solid rgba(37, 99, 235, 0.4), inner transparent
- **Hover:** border-color #2563eb
- **Checked:** inner circle 6px diameter, color #2563eb, animation: scale 0.5 → 1.0 over 200ms
- **Focus:** outline 2px solid rgba(37, 99, 235, 0.6), offset 2px

**Slider / Range Input:**
- **Track:** background rgba(37, 99, 235, 0.2), height 6px, border-radius 3px
- **Active track:** linear-gradient(90deg, #2563eb, #8b5cf6)
- **Thumb:** circle 16px diameter, background #2563eb, box-shadow 0 2px 8px rgba(37, 99, 235, 0.3)
- **Thumb hover:** scale 1.2, shadow 0 4px 12px rgba(37, 99, 235, 0.4)
- **Thumb active:** scale 1.15

**Dropdown / Select:**
- **Default:** background rgba(10, 10, 26, 0.6), border 1px solid rgba(37, 99, 235, 0.4), color #f3f4f6, padding 12px 16px, border-radius 8px
- **Hover:** border-color #2563eb
- **Open:** border-color #2563eb, box-shadow 0 8px 24px rgba(0, 0, 0, 0.4)
- **Options list:** background rgba(15, 23, 42, 0.95), border 1px solid #2563eb, border-radius 6px, max-height 250px, overflow-y auto
- **Option item:** padding 12px 16px, hover: background rgba(37, 99, 235, 0.15)
- **Selected option:** background rgba(37, 99, 235, 0.2), checkmark left, color #60a5fa

---

### Interactive Elements

**Hover Effects:**
- Scale: 1.0 → 1.02 (for cards/items)
- Color shift: +10% brightness on backgrounds
- Shadow increase: y-offset +2px, blur +4px
- Transition: 200ms ease-out

**Click/Tap Effects:**
- Ripple animation: radial-gradient circle expanding from click point, opacity 1 → 0 over 600ms
- Scale press: 1.0 → 0.96, duration 100ms ease-out
- Visual feedback immediate (< 50ms)

**Focus States (keyboard navigation):**
- Outline: 2px solid rgba(37, 99, 235, 0.6)
- Offset: 2px
- Z-index: increased for visibility
- Animation: pulse (opacity 1 → 0.7) over 1s infinite (subtle)

**Loading States:**
- Spinner: rotate 360° / 1s, linear, infinite, colors #2563eb → #8b5cf6
- Skeleton shimmer: background-position animate left-to-right, 2s infinite
- Progress bar: width animate 0% → 100%, color gradient shift

**Error States:**
- Border: 1px solid #ef4444 (or change from previous)
- Icon: ⚠ color #ef4444, shake animation (±2px left-right, 200ms)
- Message: color #fca5a5, appear with slide-down animation (200ms ease-out)
- Field glow: box-shadow 0 0 8px rgba(239, 68, 68, 0.2)

**Success States:**
- Border: 1px solid #10b981
- Icon: ✓ color #10b981, scale animation (0.5 → 1.0, 300ms spring)
- Message: color #6ee7b7, appear with slide-down animation
- Field glow: box-shadow 0 0 8px rgba(16, 185, 129, 0.2)

---

### Page Transitions

**Navigation Transition:**
- **Forward:** previous page slides out left (-100% x), new page slides in right (100% → 0% x), 300ms ease-out
- **Backward:** previous page slides in right (0% ← 100% x), new page slides out left (0% → -100% x), 300ms ease-out
- **Fade alternative:** previous page opacity 1 → 0 (150ms), new page opacity 0 → 1 (150ms, staggered start 75ms), simultaneous

**Modal Entrance:**
- **Backdrop fade:** opacity 0 → 0.85, 200ms ease-out
- **Modal scale:** scale 0.8 → 1.0, opacity 0 → 1, 300ms cubic-bezier(0.34, 1.56, 0.64, 1) (spring)

**List Item Entrance (staggered):**
- Each item: translateY 20px → 0, opacity 0 → 1, 300ms ease-out
- Stagger delay: 50ms between items

---

### Gesture Feedback (Mobile)

**Tap Feedback:**
- Visual: ripple from tap point, white/light circle expanding, opacity fade
- Haptic: light haptic pulse (if device supports), 50ms
- Latency: < 100ms perceived response

**Swipe Feedback:**
- Visual: content follows finger, slight acceleration on release (spring physics, stiffness 200, damping 25)
- Haptic: light impact on successful swipe completion, 30ms
- Resistance visual: slight opacity change as user approaches swipe threshold

**Long-Press Feedback:**
- Visual: item scales up 1.0 → 1.05, opacity slight increase
- Haptic: medium haptic on activation, 100ms
- Duration: 500ms before activation

**Gesture Cancel:**
- Visual: item scales back down (spring animation), opacity returns normal
- Haptic: light haptic pulse, 30ms

---

### Data Visualization Interactions

**3D Canvas Interactions:**
- **Hover over point:** point scales 1.0 → 1.2, color brightness increases, label appears below/near point (white text on dark background, Inter 400, 10px)
- **Click to select:** point color shifts to #f59e0b, adds glow effect (box-shadow 0 0 12px rgba(245, 158, 11, 0.5)), info panel updates
- **Drag to rotate:** camera rotates smoothly following mouse/touch movement, inertia continues briefly on release
- **Scroll to zoom:** smooth zoom animation (spring physics), clamps between min/max zoom levels

**Legend Interaction:**
- **Hover over legend item:** corresponding points on canvas highlight (opacity increase), other points fade slightly
- **Click legend item:** filter to show only that category, others opacity 0.2
- **Double-click:** reset filter

**Color Gradient Editor:**
- **Drag color stop:** smooth repositioning, live canvas update, cursor changes to grab/grabbing
- **Click to add stop:** new stop appears at click position, color picker opens below
- **Right-click to remove:** confirmation tooltip, animate removal

---

### Accessibility & Inclusive Design

**Keyboard Navigation:**
- Tab order: logical left-to-right, top-to-bottom
- Focus visible: 2px outline, offset 2px, all interactive elements
- Enter/Space: activate buttons, checkboxes, radios, selects
- Arrow keys: navigate sliders, dropdowns, radio groups
- Escape: close modals, dialogs

**Contrast Ratios:**
- Normal text: 7:1 (WCAG AAA)
- Large text (18px+): 4.5:1 minimum
- Interactive elements: 3:1 minimum

**Color Not Only:**
- Error messages: red border + icon + text message (not color alone)
- Success states: green border + ✓ icon + text (not color alone)
- Status: icon + text + color (triple redundancy)

**Text Sizing:**
- Minimum 12px for body text (14px preferred)
- Headers: 16px+ minimum
- Labels: 11px minimum (with 12px recommended)

---

This comprehensive design system ensures consistency, accessibility, and delightful interactions across all user journeys in Cosmos Explorer. Each pattern is tested for both desktop and mobile responsiveness, with fallbacks for older browsers and devices with limited capabilities.
