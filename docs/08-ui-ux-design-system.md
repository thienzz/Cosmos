# Cosmos Explorer — UI/UX Design System

**Version:** 1.1  
**Date:** 2026-04-19  
**Status:** Superseded by Doc 24 (AETHER V4) — Retained as reference  
**Product:** Cosmos Explorer — Interactive 3D Universe Visualization  

---

> **⚠ SUPERSESSION NOTICE**
>
> This document defines the **original** (pre-AETHER) design system for Cosmos Explorer.
> The approved visual direction is now **AETHER V4 — Retro-Futuristic Terminal**, fully specified in
> **[Doc 24 — UI/UX Design Brief](./24-ui-ux-design-brief.md)**.
>
> **What Doc 24 replaces in this document:**
> - §2 Color System → Doc 24 §3.1 (neon accent palette on #0a0a0f base, replaces Cosmic Blue/Nebula Purple/Supernova Gold)
> - §3 Typography → Doc 24 §3.2 (Press Start 2P / Space Mono / IBM Plex Mono replaces Inter/JetBrains Mono)
> - §4 Spacing & Grid → Doc 24 §3.3 (same 4px base, updated layout zones)
> - §5 Component Library → Doc 24 §12 (all components re-specced with terminal chrome, scanline overlays, phosphor glow)
> - §6 Iconography → Doc 24 §12 (pixel-style icons replacing Lucide set)
> - §7 Animation & Motion → Doc 24 §16 (CRT power-on, scanline wipe, terminal typing)
> - §8 Responsive Design → Doc 24 §15 (same breakpoints, updated panel behaviors)
>
> **What remains valid from this document:**
> - §1 Design Philosophy core principles (immersion-first, minimal chrome, dark theme mandatory)
> - §9 Accessibility requirements (WCAG 2.1 AA, keyboard navigation patterns)
> - Overall structural approach to UI zones and overlay architecture
>
> All new implementation work MUST use Doc 24 specifications. This document is retained for historical
> context and to support any future design system evolution.

---

## 1. Design Philosophy

Cosmos Explorer's UI is built on the principle of **immersion-first design**: the universe itself is the interface. The user experience prioritizes the 3D viewport above all else, with UI elements serving as subtle, elegant overlays that inform without intruding.

### Core Principles

- **Immersion First:** The 3D starfield dominates the experience. UI chrome is minimal, functional, and never blocks the view.
- **Minimal Chrome:** Every UI element must justify its presence. Transparency, subtle borders, and dark neutrals keep focus on the cosmos.
- **Sci-Fi Elegance:** Inspired by the realistic, grounded aesthetics of Interstellar, The Martian, and Gravity—not neon cyberpunk. Think NASA mission control: purposeful, data-rich, beautiful restraint.
- **Discoverable Complexity:** Advanced controls are layered. Basic navigation is immediate; power-user tools live in contextual menus and modal panels.
- **Dark Theme Mandatory:** A dark, space-authentic visual foundation with carefully calibrated luminosity.
- **Planetarium Software Precedent:** Information architecture draws from professional tools (Stellarium, Celestia) adapted for cinematic interactivity.

### Visual Inspirations

- **Interstellar (2014):** Minimalist HUDs, data-driven overlays, cinematic camera language
- **The Martian (2015):** Practical interface design, readable data visualization, earth-to-rover aesthetic
- **Gravity (2013):** Stark, high-contrast overlays against the void
- **NASA Mission Control:** Real-time data feeds, status panels, legible typography in mission-critical contexts
- **Planetarium Software:** Coordinate systems, object catalogs, real-time simulation

---

## 2. Color System

The palette anchors to deep space blacks with strategic accent colors for visual hierarchy and functional feedback.

### Primary Colors

| Color | Purpose | Hex | RGB | HSL | Opacity |
|-------|---------|-----|-----|-----|---------|
| **Deep Space Black** | Background, dominant | #000000 | 0, 0, 0 | 0°, 0%, 0% | 100% |
| **Deep Space Black** | Background, subtle tint | #0a0a1a | 10, 10, 26 | 240°, 44%, 7% | 100% |
| **Void** | Deepest UI surface | #050510 | 5, 5, 16 | 240°, 52%, 4% | 100% |
| **Deep Space Black** | Neutral surface | #0f172a | 15, 23, 42 | 215°, 48%, 11% | 100% |

### Accent Colors

#### Cosmic Blue (Primary CTA, data, highlights)
| Variant | Hex | RGB | HSL | Use Case |
|---------|-----|-----|-----|----------|
| **50** | #eff6ff | 239, 246, 255 | 210°, 100%, 97% | Hover states |
| **100** | #dbeafe | 219, 234, 254 | 210°, 100%, 93% | Light backgrounds |
| **500** | #3b82f6 | 59, 130, 246 | 217°, 98%, 60% | Secondary elements |
| **600** | #2563eb | 37, 99, 235 | 217°, 91%, 53% | Primary action |
| **700** | #1d4ed8 | 29, 78, 216 | 218°, 76%, 48% | Hover, active |
| **800** | #1e40af | 30, 64, 175 | 217°, 71%, 40% | Deep state |
| **900** | #1a3a52 | 26, 58, 82 | 208°, 52%, 21% | Shadow, depth |

**Primary Use:** Links, interactive elements, primary buttons, data highlights, coordinate displays, active states.

#### Nebula Purple (Secondary accent, search, celestial filters)
| Variant | Hex | RGB | HSL | Use Case |
|---------|-----|-----|-----|----------|
| **400** | #a78bfa | 167, 139, 250 | 255°, 97%, 76% | Highlights |
| **500** | #8b5cf6 | 139, 92, 246 | 259°, 94%, 66% | Primary accent |
| **600** | #7c3aed | 124, 58, 237 | 262°, 80%, 58% | Deep accent |
| **700** | #6d28d9 | 109, 40, 217 | 263°, 70%, 50% | Active accent |
| **900** | #4c1d95 | 76, 29, 149 | 266°, 67%, 35% | Shadow, depth |

**Primary Use:** Search filters, celestial object types, secondary CTAs, feature toggles, nebula/star cluster indicators.

#### Supernova Gold (Discovery, landmarks, special objects)
| Variant | Hex | RGB | HSL | Use Case |
|---------|-----|-----|-----|----------|
| **300** | #fcd34d | 252, 211, 77 | 45°, 97%, 65% | Glow, highlights |
| **400** | #fbbf24 | 251, 191, 36 | 42°, 96%, 56% | Secondary highlight |
| **500** | #f59e0b | 245, 158, 11 | 38°, 92%, 50% | Primary emphasis |
| **600** | #d97706 | 217, 119, 6 | 35°, 92%, 44% | Active state |
| **700** | #b45309 | 180, 83, 9 | 34°, 90%, 37% | Deep state |

**Primary Use:** New discoveries, bookmarks, important landmarks (Sol, Andromeda, etc.), temporal markers, special annotations.

#### Aurora Green (Success, verified, positive states)
| Variant | Hex | RGB | HSL | Use Case |
|---------|-----|-----|-----|----------|
| **500** | #10b981 | 16, 185, 129 | 161°, 84%, 39% | Success feedback |
| **600** | #059669 | 5, 150, 105 | 162°, 94%, 30% | Deep success |
| **900** | #064e3b | 6, 78, 59 | 168°, 86%, 16% | Subtle success |

**Primary Use:** Data validation, loaded states, positive notifications, healthy simulation states.

#### Solar Orange (Warning, pending, caution)
| Variant | Hex | RGB | HSL | Use Case |
|---------|-----|-----|-----|----------|
| **400** | #fb923c | 251, 146, 60 | 32°, 96%, 61% | Warning highlight |
| **500** | #f97316 | 249, 115, 22 | 31°, 99%, 53% | Primary warning |
| **600** | #ea580c | 234, 88, 12 | 28°, 95%, 48% | Deep warning |

**Primary Use:** Loading states, pending actions, data quality warnings, simulation limits, non-critical alerts.

#### Red Giant (Error, danger, critical states)
| Variant | Hex | RGB | HSL | Use Case |
|---------|-----|-----|-----|----------|
| **500** | #ef4444 | 239, 68, 68 | 0°, 84%, 60% | Error state |
| **600** | #dc2626 | 220, 38, 38 | 0°, 74%, 50% | Deep error |
| **900** | #7f1d1d | 127, 29, 29 | 0°, 63%, 30% | Shadow, depth |

**Primary Use:** Critical errors, connection failures, invalid inputs, simulation critical states.

### Text & Surface Colors

| Color | Purpose | Hex | RGB | HSL |
|-------|---------|-----|-----|-----|
| **Starlight White** | Primary text, high contrast | #f8fafc | 248, 250, 252 | 215°, 13%, 98% |
| **Star Dust Gray** | Secondary text, labels | #cbd5e1 | 203, 213, 225 | 210°, 16%, 84% |
| **Dim Gray** | Tertiary text, muted | #94a3b8 | 148, 163, 184 | 210°, 14%, 65% |
| **Shadow Gray** | Disabled text, very muted | #64748b | 100, 116, 139 | 210°, 14%, 47% |
| **Deep Void** | UI surface base | #0f172a | 15, 23, 42 | 215°, 48%, 11% |
| **Surface Tint** | Card, panel backgrounds | #1e293b | 30, 41, 59 | 217°, 33%, 17% |

### Surface Opacity & Glassmorphism

All UI surfaces use **backdrop-blur** with strategic opacity for depth:

- **Primary UI Surface (Cards, Panels):** `rgba(15, 23, 42, 0.85)` + `backdrop-filter: blur(8px)`
- **Secondary Surface (Tooltips, Badges):** `rgba(15, 23, 42, 0.90)` + `backdrop-filter: blur(6px)`
- **Elevated Surface (Modals):** `rgba(15, 23, 42, 0.95)` + `backdrop-filter: blur(12px)`
- **Divider, Border:** `rgba(203, 213, 225, 0.1)` to `rgba(203, 213, 225, 0.2)`

### Theme Variants

#### Standard Dark
Uses the full palette above. Recommended for 99% of viewing conditions.

#### OLED Black
For OLED displays, use `#000000` exclusively for backgrounds to reduce power consumption:
- Background: #000000
- Surface: #0a0a1a
- Accents: unchanged

#### High Contrast
For accessibility (WCAG AAA):
- Increase text contrast to minimum 7:1
- Starlight White → #ffffff
- Cosmic Blue → #0055ff (increased saturation)
- Aurora Green → #00d968
- Solar Orange → #ff8c00
- Red Giant → #ff3333

---

## 3. Typography

A dual-typeface system: humanist sans-serif for UI, monospace for data and coordinates.

### Font Stack

#### Primary UI Font: Inter or Space Grotesk
- **Family:** Inter (preferred), fallback Space Grotesk
- **Weights:** 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)
- **Use Case:** All UI labels, headings, buttons, descriptive text
- **Characteristics:** Geometric, highly legible at small sizes, neutral warmth

#### Monospace Font: JetBrains Mono or Fira Code
- **Family:** JetBrains Mono (preferred), fallback Fira Code
- **Weights:** 400 (Regular), 600 (SemiBold)
- **Use Case:** Coordinates (RA/Dec, Galactic), distances, velocities, technical data
- **Characteristics:** Tabular figures, excellent code readability, retro-technical aesthetic

### Type Scale

| Role | Size | Weight | Line Height | Letter Spacing | Use Case |
|------|------|--------|-------------|----------------|----------|
| **H1** | 32px | 700 | 1.2 (38px) | -0.01em | Page titles, modal titles |
| **H2** | 28px | 700 | 1.2 (34px) | -0.01em | Section headings |
| **H3** | 24px | 600 | 1.3 (31px) | 0em | Subsection headings |
| **H4** | 20px | 600 | 1.4 (28px) | 0em | Card titles, panel heads |
| **H5** | 16px | 600 | 1.5 (24px) | 0em | UI labels, toggle labels |
| **H6** | 14px | 500 | 1.5 (21px) | 0em | Small labels, badges |
| **Body** | 14px | 400 | 1.6 (22px) | 0em | Primary descriptive text |
| **Body Small** | 12px | 400 | 1.6 (19px) | 0.5px | Secondary text, hints |
| **Caption** | 11px | 400 | 1.5 (17px) | 0.5px | Auxiliary info, timestamps |
| **Data Value** | 13px | 600 | 1.4 (18px) | 0em | Coordinates, numbers (monospace) |
| **Label** | 12px | 500 | 1.5 (18px) | 0.5px | Form labels, button text |

### Typographic Rules

- **Headings:** Always SemiBold or Bold, never regular weight.
- **Body Text:** Regular weight, generous line height (1.5–1.6) for screen readability.
- **Data Values:** Monospace, SemiBold for emphasis, tabular figures enabled.
- **Links:** Cosmic Blue (#2563eb), underline on hover.
- **Disabled Text:** Shadow Gray (#64748b) at 50% opacity.
- **Focus Indicators:** 2px outline in Cosmic Blue, 4px offset.

---

## 4. Spacing & Grid

A 4px base unit system provides flexible, scalable spacing.

### Spacing Scale

| Unit | Value | Use Case |
|------|-------|----------|
| **xs** | 4px | Micro-interactions, icon padding, tight grouping |
| **sm** | 8px | Component padding, small gaps |
| **md** | 12px | Standard spacing, form row gaps |
| **lg** | 16px | Panel padding, section gaps |
| **xl** | 24px | Large section gaps, major spacing |
| **2xl** | 32px | Between major sections |
| **3xl** | 48px | Large negative space |
| **4xl** | 64px | Screen-level spacing |
| **5xl** | 96px | Full-height spacing |

### Layout Zones

The Cosmos Explorer interface uses a **full-screen 3D viewport** with **overlay zones** for contextual information.

```
┌─────────────────────────────────────────────────────────────────┐
│ [TL: Search/Info] ██████████████████████████ [TR: Time/Object]  │
│                                                                     │
│ [FULL-SCREEN 3D VIEWPORT — STARS, NEBULAE, GALAXIES]          │
│                                                                     │
│                                                                     │
│ [BL: Navigation]                      [BC: Scale Indicator]        │
└─────────────────────────────────────────────────────────────────┘
```

#### Overlay Areas

- **Top-Left:** Search bar, quick info card, object discovery
- **Top-Right:** Time control, current object details, simulation info
- **Bottom-Left:** Navigation compass, minimap, zoom indicators
- **Bottom-Center:** Scale/distance ruler, current zoom level
- **Bottom-Right:** Settings, share, fullscreen toggle (optional)
- **Floating:** Object labels, context menus (on right-click)

#### Padding & Margins

- **Screen Edge Padding:** 16px (md) minimum from viewport edges
- **Panel Padding:** 16px (lg) horizontal, 12px (md) vertical for compact; 24px (xl) for spacious modals
- **Inter-element Gap:** 8px (sm) for tight groups, 16px (lg) for sections
- **Icon Spacing:** 4px (xs) between icon and text

### Grid & Responsive Widths

#### Desktop Grid (1440px viewport)
- **Columns:** 12-column grid, each ~120px (including gutters)
- **Gutter:** 16px (lg)
- **Max Content Width:** 1408px (leaving 16px margin on each side)

#### Tablet Grid (768px viewport)
- **Columns:** 8-column grid, each ~96px
- **Gutter:** 12px (md)

#### Mobile Grid (<768px viewport)
- **Columns:** 4-column grid, each ~72px
- **Gutter:** 8px (sm)
- **Stack vertically:** All panels

---

## 5. Component Library

Detailed specifications for each UI component used in Cosmos Explorer.

### 5.1 Info Card / Panel

**Purpose:** Display celestial object details, simulation stats, or contextual information.

**Anatomy:**
```
┌─────────────────────────────┐
│ Object Name          [✕]    │  ← Header
├─────────────────────────────┤
│ Distance: 2.5 Mpc           │  ← Content rows
│ Magnitude: 3.2              │
│ RA: 00h42m44s               │
│ Dec: +41°16'09"             │
│                             │
│ [View Details] [Bookmark]   │  ← Actions
└─────────────────────────────┘
```

**Styling:**
- **Background:** `rgba(15, 23, 42, 0.85)` + `backdrop-filter: blur(8px)`
- **Border:** 1px solid `rgba(203, 213, 225, 0.1)`
- **Border Radius:** 8px
- **Min Width:** 240px
- **Max Width:** 360px
- **Padding:** 12px (md) all sides, content 16px (lg)
- **Shadow:** None (depth via glass and border)

**Typography:**
- **Title:** H4 (20px, SemiBold), Starlight White
- **Labels:** Label (12px, 500), Star Dust Gray
- **Values:** Data Value (13px, 600), Cosmic Blue
- **Actions:** Label (12px, 500), Cosmic Blue, hover underline

**Behavior:**
- Open on object selection
- Pin toggle to keep open while exploring
- Close with Escape or [✕] button
- Smooth fade-in (150ms)
- Auto-hide during cinematic camera moves (if user not hovering)

### 5.2 Search Bar

**Purpose:** Query and navigate to celestial objects, constellations, or coordinates.

**Anatomy:**
```
┌──────────────────────────────────────────┐
│ 🔍 Search objects, coords...   [✕]      │
├──────────────────────────────────────────┤
│ › Andromeda Galaxy (0.77 Mpc)           │  ← Autocomplete
│ › Solar System (reference frame)         │
│ › NGC 2254 (Open Cluster)               │
└──────────────────────────────────────────┘
```

**Styling:**
- **Width:** Full-width in overlay zone, max 360px
- **Height:** 40px (input), 30px per suggestion
- **Background:** Input = `rgba(15, 23, 42, 0.90)` + `blur(6px)`
- **Border:** 1px solid `rgba(59, 130, 246, 0.3)` (unfocused); `rgba(59, 130, 246, 1)` (focused)
- **Border Radius:** 6px
- **Padding:** 8px (sm) horizontal, 12px (md) vertical
- **Icon:** 20px Lucide search icon, Dim Gray (#94a3b8)

**Focus State:**
- **Outline:** 2px solid Cosmic Blue (#2563eb), 2px offset
- **Background Blur:** Increase to 12px
- **Placeholder:** Fade to transparent

**Dropdown:**
- **Max Height:** 300px (scrollable)
- **Item Height:** 32px
- **Hover:** Background `rgba(59, 130, 246, 0.1)`
- **Selected:** Left border 3px Cosmic Blue, background `rgba(59, 130, 246, 0.15)`

**Keyboard Navigation:**
- Arrow Up/Down to navigate suggestions
- Enter to select
- Escape to close dropdown

### 5.3 Scale Indicator

**Purpose:** Show current zoom level and distance scale via visual ruler.

**Anatomy:**
```
┌─────────────────────────────┐
│ 1 Mpc ▬▬▬▬▬ ──┴──           │
│ Zoom: 1e+22 m              │
└─────────────────────────────┘
```

**Styling:**
- **Position:** Bottom-center overlay
- **Width:** 200px
- **Background:** `rgba(15, 23, 42, 0.80)` + `blur(6px)`
- **Padding:** 12px (md)
- **Border:** 1px solid `rgba(203, 213, 225, 0.15)`
- **Border Radius:** 6px

**Content:**
- **Ruler:** Horizontal line, 60% of width, 2px tall, Dim Gray
- **Tick Marks:** 3px tall, spaced at log scale transitions
- **Label:** Data Value (12px, 600), left-aligned, Supernova Gold for emphasis
- **Zoom Display:** Body Small (12px), Star Dust Gray, scientific notation

**Behavior:**
- Update as user zooms in/out
- Smooth number transitions (150ms)
- Hide during initial scene load, show after 1s
- Fade out during 3s+ of inactivity, re-appear on zoom

### 5.4 Time Control Bar

**Purpose:** Play/pause simulation, adjust speed, display epoch/date.

**Anatomy:**
```
┌──────────────────────────────────────────────┐
│ ⏵︎  ⏸︎  ⊕───●─────⊖   Speed: 1000x   │
│                                              │
│ Epoch: J2000 (2000-01-01 12:00:00 UTC)    │
└──────────────────────────────────────────────┘
```

**Styling:**
- **Position:** Top-right overlay
- **Width:** 360px min
- **Background:** `rgba(15, 23, 42, 0.85)` + `blur(8px)`
- **Padding:** 12px (md)
- **Border:** 1px solid `rgba(203, 213, 225, 0.1)`
- **Border Radius:** 8px

**Controls:**
- **Play/Pause Buttons:** 36px square, Icon-only (Lucide), Cosmic Blue on hover, white on active
- **Speed Slider:** Custom range slider, 160px wide (see Slider section)
- **Speed Label:** Data Value (13px, 600), updates in real-time
- **Epoch Display:** Body Small (12px), Dim Gray, ISO 8601 format

**Keyboard Shortcuts:**
- Space → Play/Pause
- `+` / `-` → Increase/Decrease speed (×2, ÷2 increments)
- `R` → Reset to real-time

**Behavior:**
- Smooth color transitions (150ms)
- Slider responds instantly to mouse/touch
- Speed value updates live as slider moves

### 5.5 Coordinate Display

**Purpose:** Show current view center, selected object position in RA/Dec or Galactic coordinates.

**Anatomy:**
```
┌──────────────────────────────────┐
│ View Center                      │
│ RA  00h 42m 44.3s               │
│ Dec +41° 16' 08.6"              │
│                                  │
│ Gal Lon 121.174°                │
│ Gal Lat -21.573°                │
└──────────────────────────────────┘
```

**Styling:**
- **Position:** Floating, top-left or bottom-left corner
- **Width:** 220px
- **Background:** `rgba(15, 23, 42, 0.85)` + `blur(6px)`
- **Padding:** 8px (sm) horizontal, 12px (md) vertical
- **Border:** 1px solid `rgba(203, 213, 225, 0.1)`
- **Border Radius:** 6px

**Content:**
- **Header:** H6 (14px, 500), Starlight White
- **Labels:** Label (11px, 500), Dim Gray
- **Values:** Data Value (13px, 600), Cosmic Blue, monospace

**Behavior:**
- Update in real-time as camera moves
- Highlight changed coordinates via brief glow (150ms)
- Copy-to-clipboard on click (Cosmic Blue icon appears on hover)
- Optional: Display selection type (object, region) in header

### 5.6 Navigation Compass / Minimap

**Purpose:** Show viewing orientation and allow quick navigation to cardinal points.

**Compass Variant (Preferred):**
```
          N
          ↑
    [◆ 0° ▲]
   W ◀  ⊕  ▶ E
       ↓ S
```

**Minimap Variant (Alternative):**
```
┌──────────────────┐
│ ● ○ ○            │  ← Star positions
│ ○ ● ○            │
│ ○ ○ ○ ▶(cursor)  │
└──────────────────┘
```

**Compass Styling (Preferred):**
- **Size:** 64px × 64px (main circle)
- **Background:** `rgba(15, 23, 42, 0.80)` + `blur(4px)`
- **Border:** 1px solid `rgba(203, 213, 225, 0.15)`
- **Border Radius:** 50% (perfect circle)
- **Center:** Cosmic Blue circle (8px), user's viewing direction
- **Cardinal Points:** N/S/E/W labels in Dim Gray (8px)
- **Pointer:** Supernova Gold arrow (12px), pointing forward

**Minimap Styling (Alternative):**
- **Size:** 120px × 120px
- **Background:** `rgba(15, 23, 42, 0.85)` + `blur(4px)`
- **Border:** 1px solid `rgba(203, 213, 225, 0.15)`
- **Border Radius:** 4px
- **Viewport Frustum:** Light outline rectangle showing current view bounds

**Behavior:**
- Update compass heading in real-time
- Click cardinal points to rotate view to that direction (smooth 500ms animation)
- Compass click-to-rotate: click offset from center to rotate
- Minimap click to navigate (cinematic zoom+pan to that region)
- Hide during cinematic camera transitions

### 5.7 Object Label

**Purpose:** Floating 3D labels above celestial objects in the viewport.

**Anatomy:**
```
     ┌─────────────┐
     │ Sol (Sun)   │
     │ -26.74 mag  │
     └─────────────┘
           ↓ (line to object)
          *
```

**Styling:**
- **Background:** `rgba(15, 23, 42, 0.90)` + `blur(8px)` for solid labels
- **Alternative:** Gradient background from object color, 0.6 opacity
- **Border:** 1px solid `rgba(203, 213, 225, 0.1)`
- **Border Radius:** 4px
- **Padding:** 4px (xs) horizontal, 2px (xs) vertical
- **Pointer Line:** 1px Dim Gray, connects label to object center

**Typography:**
- **Object Name:** Label (12px, 500), Starlight White
- **Details:** Caption (10px, 400), Dim Gray

**Behavior:**
- Fade in/out on object approach (500ms)
- Follow object position in 3D space (parallax with camera)
- Avoid overlap via automatic repositioning
- Collision detection: hide labels if they occlude viewport edges
- Show on object hover (150ms fade-in)
- Always visible for bookmarked objects

**Variants:**
- **Selected Object:** Yellow/Supernova Gold border, larger (20px label text)
- **Bookmarked Object:** Supernova Gold background tint
- **Search Result:** Cosmic Blue border, subtle pulse

### 5.8 Button Styles

**Purpose:** Call-to-action controls for navigation, settings, and primary interactions.

#### 5.8.1 Primary Button

```
┌─────────────────────┐
│   Explore More      │  ← Text
└─────────────────────┘
```

**Styling:**
- **Background:** Cosmic Blue (#2563eb)
- **Text:** Starlight White (12px, 500)
- **Padding:** 8px (sm) horizontal, 10px vertical (asymmetric for optical balance)
- **Height:** 36px
- **Border Radius:** 6px
- **Border:** None
- **Cursor:** Pointer

**States:**
- **Default:** Cosmic Blue, full opacity
- **Hover:** Darken to #1d4ed8, subtle blur increase
- **Active/Pressed:** Darken further to #1e40af
- **Focus:** 2px outline Cosmic Blue, 2px offset
- **Disabled:** Shadow Gray, 50% opacity, no cursor change

**Animation:**
- **Transition:** 150ms ease-out for color/blur
- **Click Feedback:** Brief scale 0.98x (50ms)

#### 5.8.2 Secondary Button

```
┌─────────────────────┐
│   Bookmark          │
└─────────────────────┘
```

**Styling:**
- **Background:** `rgba(15, 23, 42, 0.70)` + `blur(4px)`
- **Border:** 1px solid `rgba(203, 213, 225, 0.2)`
- **Text:** Cosmic Blue (12px, 500)
- **Padding:** 8px (sm) horizontal, 10px vertical
- **Height:** 36px
- **Border Radius:** 6px

**States:**
- **Hover:** Border → Cosmic Blue, background opacity → 0.85
- **Active:** Background → `rgba(59, 130, 246, 0.15)`
- **Focus:** 2px outline Cosmic Blue
- **Disabled:** Text → Shadow Gray, 50% opacity

#### 5.8.3 Ghost Button

**Styling:**
- **Background:** Transparent
- **Border:** 1px solid `rgba(203, 213, 225, 0.3)`
- **Text:** Dim Gray (12px, 500)
- **Padding:** 6px (sm) horizontal, 8px vertical
- **Height:** 32px
- **Border Radius:** 4px

**States:**
- **Hover:** Text → Starlight White, border → Cosmic Blue
- **Active:** Background → `rgba(203, 213, 225, 0.05)`
- **Focus:** 2px outline Cosmic Blue

#### 5.8.4 Icon-Only Button

**Styling:**
- **Size:** 40px × 40px (icon buttons)
- **Icon Size:** 20px (Lucide)
- **Background:** Transparent
- **Color:** Dim Gray, hover → Starlight White
- **Padding:** 10px all sides (for 40px total)
- **Border Radius:** 6px
- **Cursor:** Pointer

**States:**
- **Hover:** Background `rgba(203, 213, 225, 0.1)`, icon color → Starlight White
- **Active:** Background `rgba(59, 130, 246, 0.2)`, icon color → Cosmic Blue
- **Focus:** 2px outline Cosmic Blue
- **Tooltip:** Show on hover (150ms delay)

### 5.9 Slider

**Purpose:** Adjust continuous values (time speed, graphics quality, transparency).

**Anatomy:**
```
Speed: 1x  ⊕───●─────⊖  Max: 10000x
           ▬▬▬▬●▬▬▬▬▬
           Track  Thumb
```

**Styling:**
- **Track:** 4px tall, `rgba(203, 213, 225, 0.15)` background
- **Filled Track:** 4px tall, Cosmic Blue (#2563eb), extends from start to thumb
- **Thumb:** 16px circle, Cosmic Blue (#2563eb), shadow `0 2px 8px rgba(59, 130, 246, 0.3)`
- **Width:** 160px (standard), responsive
- **Border Radius:** 2px (track), 50% (thumb)

**States:**
- **Default:** Thumb centered, track at baseline
- **Hover:** Thumb glow increases, shadow → `0 4px 12px rgba(59, 130, 246, 0.5)`
- **Drag:** Thumb opacity → 1.0, track opacity → 1.0
- **Focus:** 2px outline around thumb, 2px offset

**Behavior:**
- Smooth drag (no snapping, unless tickmarks present)
- Keyboard: Arrow Left/Right to adjust ±1 unit
- Step function: 0.1 increments per arrow key
- Live value feedback (display next to slider)

### 5.10 Toggle

**Purpose:** Enable/disable features (data layers, audio, grid overlay).

**Anatomy:**
```
Show Grid  [◯⚬]    ← Off        Show Grid  [●◯]    ← On
            Stem  Ring                        Stem  Ring
```

**Styling:**
- **Size:** 48px wide × 24px tall
- **Border Radius:** 12px (pill-shaped)
- **Background (Off):** `rgba(203, 213, 225, 0.15)`
- **Background (On):** Cosmic Blue (#2563eb)
- **Ring:** 1px border, `rgba(203, 213, 225, 0.2)`
- **Thumb:** 20px circle, white, absolute positioned at -2px offset
- **Transition:** 200ms ease-out

**States:**
- **Hover:** Background opacity increases, subtle scale
- **Active (On):** Background → Cosmic Blue, thumb fully visible
- **Disabled:** 50% opacity, no interaction

**Behavior:**
- Click toggle to flip state
- Keyboard: Space/Enter to toggle
- Smooth animation on state change

### 5.11 Tooltip

**Purpose:** Show brief context on hover (labels, shortcuts, hints).

**Anatomy:**
```
   ┌──────────────┐
   │ Bookmark (B) │
   └──────────────┘
         ▼
```

**Styling:**
- **Background:** `rgba(15, 23, 42, 0.95)` + `blur(6px)`
- **Border:** 1px solid `rgba(203, 213, 225, 0.2)`
- **Text:** Body Small (12px, 400), Starlight White
- **Padding:** 6px (sm) horizontal, 4px (xs) vertical
- **Border Radius:** 4px
- **Arrow:** 6px triangle, solid match background
- **Max Width:** 200px
- **z-index:** Highest (tooltips above modals)

**Behavior:**
- Show after 150ms hover delay
- Fade in (100ms)
- Follow mouse position (top-center by default, adjust if near viewport edge)
- Hide on mouse leave (fade out 100ms)
- Never block interact-able elements

### 5.12 Modal

**Purpose:** Present detailed object information, settings, or share dialog.

**Anatomy:**
```
┌────────────────────────────────────┐
│ Object Details            [−] [□] [×] │  ← Header
├────────────────────────────────────┤
│ Name: Andromeda Galaxy (M31)        │
│ Type: Spiral Galaxy                │
│ Distance: 2.537 ± 0.033 Mpc        │
│ Redshift: z = -0.001                │
│                                    │
│ [View in Skymap]  [Close]         │  ← Actions
└────────────────────────────────────┘
```

**Styling:**
- **Overlay:** `rgba(0, 0, 0, 0.5)` backdrop
- **Panel Background:** `rgba(15, 23, 42, 0.95)` + `blur(12px)`
- **Border:** 1px solid `rgba(203, 213, 225, 0.15)`
- **Border Radius:** 8px
- **Width:** 480px (desktop), 90vw (mobile), max 100vw
- **Max Height:** 80vh (scrollable content)
- **Padding:** 20px (xl) for header, 16px (lg) for content
- **Shadow:** `0 20px 60px rgba(0, 0, 0, 0.5)`
- **z-index:** High (above most elements except tooltips)

**Header:**
- **Title:** H3 (24px, 600), Starlight White
- **Close Button:** Icon-only, top-right corner, 36px square

**Content:**
- **Sections:** Separated by 16px (lg) vertical gap
- **Labels:** Body Small (12px, 400), Dim Gray
- **Values:** Body (14px, 400), Starlight White
- **Data Values:** Data Value (13px, 600), Cosmic Blue, monospace

**Footer (Actions):**
- **Gap:** 8px (sm) between buttons
- **Alignment:** Right-aligned, optional "Always Show" toggle left

**Behavior:**
- Open on object double-click or [Details] button
- Close with [×] or Escape key
- Smooth fade-in (200ms)
- Content scrolls if exceeds max height
- Lock scroll on body while modal open

### 5.13 Toast / Notification

**Purpose:** Transient feedback (copied to clipboard, simulation paused, etc.).

**Anatomy:**
```
┌──────────────────────────────┐
│ ✓ Coordinates copied!  [×]   │
└──────────────────────────────┘
```

**Styling:**
- **Position:** Bottom-right, 16px (lg) from edges
- **Background:** Varies by type:
  - Success: `rgba(16, 185, 129, 0.9)` + `blur(4px)`
  - Warning: `rgba(249, 115, 22, 0.9)` + `blur(4px)`
  - Error: `rgba(239, 68, 68, 0.9)` + `blur(4px)`
  - Info: `rgba(59, 130, 246, 0.9)` + `blur(4px)`
- **Border:** 1px solid matching color, 0.3 opacity
- **Border Radius:** 6px
- **Padding:** 12px (md)
- **Text:** Body Small (12px, 400), white
- **Icon:** 16px Lucide, white, left-aligned
- **Close Button:** Icon-only, 24px, right side

**Behavior:**
- Auto-dismiss after 4s (error/warning) or 3s (success/info)
- Fade out (200ms)
- Stack vertically if multiple (max 3 visible)
- Dismiss on click or [×] button
- Keyboard: Escape to dismiss top toast

### 5.14 Loading States

**Purpose:** Provide feedback during data fetches or scene transitions.

#### Initial Load Spinner

```
     ◻◻◻◻◻◻◻◻
    ◻         ◻
   ◻    ⟳     ◻
    ◻         ◻
     ◻◻◻◻◻◻◻◻

Initializing universe (47%)...
```

**Styling:**
- **Spinner:** Rotating 40px ring, 3px stroke, Cosmic Blue
- **Speed:** 1 rotation per 1.5s (moderate)
- **Background:** Center screen, `rgba(15, 23, 42, 0.80)` circle, 80px diameter
- **Text:** Body Small (12px), Dim Gray, below spinner

#### Scale Transition Pulse

```
Current display:
     ▬▬▬▬▬▬▬▬
    ▒▒▒▒▒▒▒▒  ← Subtle pulsing glow
```

**Styling:**
- **Effect:** Subtle opacity pulse (0.8 → 1.0 → 0.8), 1200ms duration
- **Color:** Supernova Gold glow on scale boundaries (2 Mpc → 100 Mpc transition)
- **Easing:** ease-in-out

#### Data Fetch Skeleton

For async data loads in cards:
```
┌────────────────────────┐
│ [████] ██              │  ← Shimmer animation
│ ██████ ████████       │
│ ██ ██████████         │
└────────────────────────┘
```

**Styling:**
- **Placeholder:** Light gray `rgba(203, 213, 225, 0.1)` with rounded corners
- **Shimmer:** Linear gradient `transparent → rgba(203, 213, 225, 0.2) → transparent`, slides left-to-right, 2s infinite
- **Lines:** 8px tall, 8px gap, variable widths

### 5.15 Context Menu

**Purpose:** Right-click actions on objects (bookmark, share, add to observation list).

**Anatomy:**
```
┌─────────────────────┐
│ 📌 Bookmark         │
│ 🔗 Share            │
│ 💾 Save Position    │
│ ─────────────────── │
│ 📊 Object Details   │
│ 🔍 Search Similar   │
└─────────────────────┘
```

**Styling:**
- **Background:** `rgba(15, 23, 42, 0.90)` + `blur(8px)`
- **Border:** 1px solid `rgba(203, 213, 225, 0.15)`
- **Border Radius:** 6px
- **Min Width:** 160px
- **Padding:** 4px (xs) vertical, 0px horizontal

**Item:**
- **Height:** 32px
- **Padding:** 8px (sm) horizontal, 0px vertical (vertical padding on container)
- **Text:** Label (12px, 500), Starlight White
- **Icon:** 16px Lucide, left, Dim Gray
- **Separator:** 1px `rgba(203, 213, 225, 0.1)`, 4px vertical margin

**States:**
- **Hover:** Background `rgba(59, 130, 246, 0.15)`, text → Cosmic Blue
- **Disabled:** Text → Shadow Gray, 50% opacity, no hover effect

**Behavior:**
- Appear on right-click, mouse position + 8px offset
- Auto-reposition if near viewport edge
- Dismiss on click, Escape, or click elsewhere
- Fade in (100ms), fade out (150ms)

---

## 6. Iconography

Cosmos Explorer uses Lucide icons for a consistent, minimal, technical aesthetic.

### Icon Set

#### Navigation & Exploration
| Icon | Usage | Notes |
|------|-------|-------|
| `Search` | Search bar | 20px default |
| `ChevronUp` / `ChevronDown` | Collapse/expand, dropdowns | 16px |
| `ChevronLeft` / `ChevronRight` | Navigation | 16px |
| `Compass` | Navigation compass | 24px |
| `Map` | Minimap toggle | 20px |
| `ZoomIn` / `ZoomOut` | Zoom controls | 20px |
| `Maximize2` | Fullscreen toggle | 20px |

#### Celestial Objects
| Icon | Usage | Notes |
|------|-------|-------|
| `Sun` / `Star` | Star symbol, Sol | 16–24px |
| `Globe` | Planet symbol | 16–24px |
| `Moon` | Moon/satellite | 16–24px |
| `Zap` | Supernova, burst | 16px, accent color |
| `Cloud` | Nebula | 16px |
| `Layers` | Galaxy/layered object | 16px |

#### Controls & Media
| Icon | Usage | Notes |
|------|-------|-------|
| `Play` | Simulation play | 20px |
| `Pause` | Simulation pause | 20px |
| `SkipBack` | Rewind simulation | 20px |
| `SkipForward` | Fast-forward simulation | 20px |
| `Volume2` / `VolumeX` | Audio toggle | 20px |
| `Slider` | Adjustment, controls | 20px |

#### UI Actions
| Icon | Usage | Notes |
|------|-------|-------|
| `Info` | Info panel, help | 16–20px |
| `Settings` | Settings panel | 20px |
| `Share2` | Share object/position | 20px |
| `Bookmark` | Bookmark object | 16px |
| `Heart` | Favorite, like | 16px |
| `Copy` | Copy to clipboard | 16px, success on click |
| `ExternalLink` | Open external, link out | 14px |
| `X` / `XCircle` | Close, dismiss, delete | 16–20px |
| `Menu` | Hamburger, more actions | 20px |

#### Data & Status
| Icon | Usage | Notes |
|------|-------|-------|
| `Check` / `CheckCircle` | Success, valid | 16px |
| `AlertCircle` / `AlertTriangle` | Warning, caution | 16px |
| `XCircle` | Error, critical | 16px |
| `Loader` | Loading spinner | 20px, animated rotation |
| `Eye` / `EyeOff` | Visibility toggle, layers | 16px |
| `Grid` | Grid overlay toggle | 20px |
| `Database` | Catalog, data | 16px |

### Icon Sizing

| Context | Size | Guidelines |
|---------|------|-----------|
| **Button Icons** | 20px | Centered in 40px button, 10px padding |
| **Label Icons** | 16px | Left-aligned, 4px gap to text |
| **UI Controls** | 20px | Standard for sliders, toggles, time bar |
| **Navigation** | 24px | Compass, minimap elements |
| **Data/Status** | 16px | Inline with text, captions |
| **Toast/Alert** | 16px | Icon + text pair |

### Icon Color Rules

- **Default:** Dim Gray (#94a3b8)
- **Interactive (Hover):** Starlight White (#f8fafc)
- **Active/Selected:** Cosmic Blue (#2563eb)
- **Success:** Aurora Green (#10b981)
- **Warning:** Solar Orange (#f97316)
- **Error:** Red Giant (#ef4444)
- **Accent:** Supernova Gold (#f59e0b) for discoveries, bookmarks

### Icon Stroke & Weight

All Lucide icons use:
- **Stroke Width:** 2px (default Lucide)
- **No Fill:** Icons are outline-only, never solid
- **Consistency:** Always the same stroke width across the UI

---

## 7. Animation & Motion

Motion serves immersion and legibility without distraction.

### Transition Durations

| Duration | Easing | Use Case |
|----------|--------|----------|
| **Fast (150ms)** | `ease-out` | UI interactions (button press, tooltip), micro-interactions |
| **Normal (300ms)** | `ease-out` | Panel open/close, property changes |
| **Slow (500ms)** | `ease-in-out` | Navigation, view rotation, zoom steps |
| **Cinematic (1000–3000ms)** | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Camera fly-through, scale transitions, discovery reveals |

### Easing Functions

**UI Easing (Fast, responsive feel):**
```
ease-out: cubic-bezier(0.0, 0.0, 0.2, 1.0)
```

**Navigation Easing (Smooth, cinematic):**
```
cubic-bezier(0.25, 0.46, 0.45, 0.94)
```

**Elastic Return (Bounce feedback, accent features):**
```
cubic-bezier(0.68, -0.55, 0.265, 1.55)
```

### Panel Animations

#### Open (Fade + Slide)
```
Opacity:    0 → 1         (300ms, ease-out, start immediately)
Transform:  translateY(10px) → 0  (300ms, ease-out, start immediately)
Blur:       12px → 8px    (300ms, parallel)
```

#### Close (Fade + Slide Reverse)
```
Opacity:    1 → 0         (150ms, ease-out)
Transform:  0 → translateY(10px)  (150ms, ease-out)
Blur:       8px → 12px    (150ms, parallel)
```

### Object Hover / Select

**Hover (Brief highlight):**
```
Scale:      1.0 → 1.02   (200ms, ease-out)
Opacity:    1.0 → 1.1    (200ms, ease-out, if glowing)
Glow:       none → 0 4px 12px (200ms, ease-out)
```

**Select (Persistent highlight):**
```
Scale:      1.0 → 1.05   (300ms, ease-out)
Border:     transparent → Cosmic Blue (300ms, ease-out)
Glow:       none → 0 6px 24px Cosmic Blue (300ms, ease-out)
```

### Scale Transition Effects

When zooming between major scales (e.g., Solar System ↔ Milky Way):

**Transition Sequence:**
1. **Fade Out (500ms, ease-out):** Current UI opacity 1.0 → 0.3
2. **Zoom & Pan (1500ms, cinematic easing):** Camera moves to new viewpoint
3. **Scale Label Pulse (1200ms):** Scale indicator glows Supernova Gold
4. **Fade In (500ms, ease-out):** New UI opacity 0.3 → 1.0

**Example Timeline:**
```
0ms:     User selects "Milky Way" object
0ms–500ms: Current view fades, label disappears
0ms–1500ms: Camera fly-through (cinematic)
500ms–1000ms: Scale label pulses (supernova gold glow)
1500ms: New scale active, UI fades in
1500ms–2000ms: Panels slide in from edges (staggered 100ms each)
2000ms: Full interaction restored
```

### Loading Spinner

**Rotation:**
```
transform: rotate(0deg) → rotate(360deg)
duration: 1.5s
iteration: infinite
timing: linear
```

**Pulsing Opacity (Subtle):**
```
opacity: 0.7 → 1.0 → 0.7
duration: 1.5s (synced with rotation)
easing: ease-in-out
```

### Button Press Feedback

**Click Animation:**
```
scale:  1.0 → 0.98  (50ms, ease-out, immediate feedback)
scale:  0.98 → 1.0  (100ms, ease-out, spring back)
```

### Slider Thumb

**On Drag:**
```
box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3) → 0 4px 16px rgba(59, 130, 246, 0.6)
duration: 150ms
easing: ease-out
```

### Notification Toast Entry/Exit

**Enter (Slide + Fade):**
```
transform:  translateX(400px) → 0
opacity:    0 → 1
duration:   200ms
easing:     ease-out
```

**Exit (Slide + Fade):**
```
transform:  0 → translateX(400px)
opacity:    1 → 0
duration:   200ms
easing:     ease-in
```

### Reduced Motion Mode

For users with `prefers-reduced-motion: reduce`:

- **Disable all animations** except essential focus/active states
- **Duration:** Set to 0ms or remove entirely
- **Alternative:** Show/hide instant, no fades/slides
- **Exceptions:** Keep focus outline visible (no animation needed)

---

## 8. Responsive Breakpoints

Cosmos Explorer adapts layout and controls to screen size while maintaining the immersive full-screen viewport.

### Breakpoint Definitions

| Device Type | Width Range | Key Characteristics |
|-------------|-------------|-------------------|
| **Mobile** | <768px | Touch controls, simplified HUD, single-column panels |
| **Tablet** | 768px–1024px | Hybrid touch/mouse, compact panels, side overlay |
| **Desktop** | 1024px–1440px | Full UI, mouse-optimized, all features visible |
| **Large (4K)** | >1440px | Expanded spacing, larger fonts, grouped panels |

### Mobile (<768px)

**Layout Adjustments:**
- **Search Bar:** Full width (minus 32px margins), max-width removed
- **Info Card:** Full width, positioned as bottom sheet or modal
- **Time Control:** Stack vertically, larger touch targets (44px minimum)
- **Compass:** Smaller (48px), positioned bottom-left
- **Scale Indicator:** Hidden until user taps zoom controls
- **Coordinate Display:** Hidden by default, accessible via info icon

**Touch Controls:**
- **Min Touch Target:** 44px × 44px (WCAG recommendation)
- **Gesture:** Pinch to zoom, two-finger rotate for orientation
- **Long-press:** Open context menu
- **Swipe:** Open/close side panels

**Fonts:**
- **H1–H3:** Reduce by 2–4px
- **Body:** 13px (from 14px)
- **Label:** 11px (from 12px)
- **Line Height:** Increase 0.1 for readability

**Spacing:**
- **Screen Edge:** 12px (sm) padding minimum
- **Panel Padding:** 12px (md)
- **Inter-element Gap:** 8px (sm)

### Tablet (768px–1024px)

**Layout Adjustments:**
- **Search Bar:** Max-width 320px, top-left
- **Time Control:** Horizontal (unchanged), top-right, more compact
- **Info Card:** Small sidebar right side, 280px wide
- **Compass:** 56px, bottom-left
- **Scale Indicator:** Visible, bottom-center
- **Navigation:** Side panel for advanced options

**Touch & Mouse Hybrid:**
- Primary: Touch gestures
- Secondary: Mouse hover for tooltips, right-click for context

**Fonts:**
- Maintain desktop sizes
- Line height: Standard (1.5–1.6)

**Spacing:**
- **Screen Edge:** 16px (lg)
- **Panel Padding:** 16px (lg)
- **Inter-element Gap:** 12px (md)

### Desktop (1024px–1440px)

**Layout (Standard):**
- All UI zones visible: top-left, top-right, bottom-left, bottom-center
- Full-featured search, time control, coordinate display
- Modals: centered, 480px width
- Tooltips: full display, no truncation

**Fonts:** Full type scale

**Spacing:** Full spacing scale

### Large (>1440px)

**Layout Adjustments:**
- **Panel Padding:** 24px (xl) for visual spaciousness
- **Info Card:** 400px max-width (from 360px)
- **Modals:** Up to 600px width for expanded info
- **Spacing Scale:** Generous 20% increase overall
- **Screen Edge Margin:** 24px (xl)

**Typography:**
- **H1–H6:** +2px each
- **Body:** 15px (from 14px)
- Maintain line heights

**Grouped Panels:**
- Multiple cards can group horizontally
- Dedicated "Dashboard" mode for multi-monitor setups

### Responsive Component Changes

#### Search Bar
| Breakpoint | Width | Max-Width | Font | Suggestions |
|------------|-------|-----------|------|------------|
| Mobile | 100% | — | 13px | 5 visible |
| Tablet | Auto | 320px | 13px | 6 visible |
| Desktop | Auto | 360px | 14px | 8 visible |
| Large | Auto | 400px | 14px | 10 visible |

#### Time Control
| Breakpoint | Layout | Width | Icon Size | Visible |
|------------|--------|-------|-----------|---------|
| Mobile | Vertical stack | 100% | 32px | Time only |
| Tablet | Compact horizontal | Auto | 32px | All |
| Desktop | Full horizontal | 360px | 36px | All |
| Large | Expanded horizontal | 420px | 40px | All + labels |

#### Modals
| Breakpoint | Width | Max Height | Padding | Scrollable |
|-----------|-------|-----------|---------|-----------|
| Mobile | 90vw | 80vh | 12px | Yes |
| Tablet | 85vw | 80vh | 16px | Yes |
| Desktop | 480px | 80vh | 20px | Yes |
| Large | 600px | 85vh | 24px | Yes |

---

## 9. Accessibility

Cosmos Explorer is designed to be inclusive and usable by people with diverse abilities.

### Color Contrast

All text meets **WCAG AA minimum (4.5:1)** for normal text, **3:1 for large text (18px+)**.

#### Contrast Verification Table

| Foreground | Background | Ratio | Standard | Pass |
|-----------|-----------|-------|----------|------|
| #f8fafc (White) | #0f172a (Deep) | 14.8:1 | AA/AAA | ✓ |
| #f8fafc (White) | #0a0a1a (Black) | 16.0:1 | AA/AAA | ✓ |
| #2563eb (Cosmic Blue) | #0f172a (Deep) | 4.7:1 | AA | ✓ |
| #7c3aed (Nebula Purple) | #0f172a (Deep) | 3.8:1 | AA | ✓ |
| #f59e0b (Gold) | #0f172a (Deep) | 6.2:1 | AA/AAA | ✓ |
| #94a3b8 (Dim Gray) | #0f172a (Deep) | 4.1:1 | AA | ✓ |
| #64748b (Shadow Gray) | #0f172a (Deep) | 2.1:1 | Fail | ✗ (use only for disabled) |

**Disabled State Fix:** Use Shadow Gray with 50% opacity + slightly lighter background `rgba(15, 23, 42, 1.0)` for sufficient contrast.

### Focus States

**Focus Indicator Standard:**
- **Outline:** 2px solid Cosmic Blue (#2563eb)
- **Offset:** 2px (space between element and outline)
- **Visible on:** All interactive elements (buttons, links, inputs, toggles)
- **Keyboard Navigation:** Tab to focus, Shift+Tab to navigate backward

**Focus Ring Code:**
```css
:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}
```

### Keyboard Navigation

#### Primary Shortcuts

| Key(s) | Action | Context |
|--------|--------|---------|
| **Tab / Shift+Tab** | Navigate between UI elements | Global |
| **Enter / Space** | Activate button, toggle, or select | All interactive elements |
| **Escape** | Close modal, dismiss tooltip, cancel dialog | Modal/overlay-focused |
| **Arrow Keys** | Navigate within components (sliders, dropdowns) | Component-specific |
| **Space** | Play/pause simulation | Time control (when focused) |
| **+** | Increase simulation speed | Time control |
| **-** | Decrease simulation speed | Time control |
| **R** | Reset to real-time | Time control |
| **?** | Show help/shortcuts overlay | Global |
| **S** | Focus search bar | Global |
| **(0–9)** | Quick preset bookmarks | Global |

#### Search Navigation

- **Arrow Up/Down:** Navigate autocomplete suggestions
- **Enter:** Select highlighted suggestion
- **Escape:** Clear search, close dropdown

#### Modal Navigation

- **Tab:** Move to next focusable element
- **Escape:** Close modal (if safe, no unsaved changes)
- **Enter:** Submit form (if present)

### Screen Reader Support

#### ARIA Labels & Roles

- **Buttons:** `role="button"`, label via text or `aria-label`
- **Icons:** `aria-label="Close"` for icon-only buttons
- **Toggles:** `role="switch"`, `aria-checked="true|false"`
- **Sliders:** `role="slider"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- **Links:** Text describes destination, avoid "click here"
- **Forms:** `<label for="id">` paired with inputs
- **Modals:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby="title-id"`
- **Live Regions:** `aria-live="polite"` for notifications, toasts
- **Disabled:** `aria-disabled="true"` or native `disabled` attribute

#### Semantic HTML

- Use `<button>` for buttons (not `<div role="button">`)
- Use `<a href="">` for links (not buttons disguised as links)
- Use `<label>` for form labels
- Use `<nav>` for navigation regions
- Headings: `<h1>` → `<h6>` in logical order (no skipping levels)

#### Text Alternatives

- **Images/Icons:** Descriptive alt text or aria-label
- **Data Values:** Accompany with text (not visual color alone)
- **Charts/Graphs:** Provide text description or table alternative

### Reduced Motion Mode

For users with `prefers-reduced-motion: reduce`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Practical Impact:**
- All fade/slide transitions removed
- Focus outline remains visible (no animation)
- Hover states activate on click instead of hover
- Auto-playing media disabled
- Animations replaced with instant state changes

### High Contrast Mode

For Windows High Contrast and user-enabled high-contrast preferences:

```css
@media (prefers-contrast: more) {
  --color-cosmic-blue: #0055ff;  /* More saturated */
  --color-text: #ffffff;          /* Pure white */
  --color-border: #ffffff;        /* White borders */
  
  /* Increase all borders */
  * {
    border-width: 2px;
  }
}
```

### Color Blindness Accommodations

1. **Do not rely on color alone** to convey information (e.g., "red warning" must also say "warning")
2. **Use patterns or icons** alongside color (checkmark + green, X + red, etc.)
3. **Test with color blindness simulators** (CVsimulator, Color Oracle)
4. **Provide legend** for color-coded data

#### Color-Blind Safe Palette
- **Primary/Secondary:** Blue + Gray (works for all color blindness types)
- **Success + Error:** Green + Red (distinguish via brightness + shape)
- **Orange + Purple:** Avoid as sole differentiators (hard for red-blind)

### Dyslexia Friendly

- **Font:** Use sans-serif (Inter) with generous letter spacing (0.5px on body text)
- **Line Height:** 1.6 (above standard, improves readability)
- **Line Length:** Max 60 characters per line for body text (achieved via max-width on panels)
- **Alignment:** Avoid justified text, use left-aligned
- **Italics:** Use sparingly, avoid for long passages

### Motor & Dexterity Considerations

- **Touch Targets:** Minimum 44px × 44px (WCAG recommendation)
- **Spacing:** Adequate gap between clickable elements (8px minimum)
- **Drag Tolerance:** Sliders accept ±5px click deviation
- **Double-Click:** Avoid critical actions; provide keyboard alternative
- **Hover States:** Ensure keyboard focus states match (not mouse-only)
- **Gestures:** Provide button alternatives to complex multi-touch (pinch → zoom buttons)

---

## 10. Dark Theme Variants

All themes use the dark backgrounds defined in the Color System (Section 2). Three variants serve different preferences and device capabilities.

### Standard Dark (Default)

Uses the full Color System palette as defined:
- **Background:** #0a0a1a (slight blue tint)
- **Surfaces:** #0f172a (slightly lighter for hierarchy)
- **Accents:** Full saturation (Cosmic Blue #2563eb, Nebula Purple #7c3aed, Gold #f59e0b)
- **Text:** #f8fafc (Starlight White) and #94a3b8 (Dim Gray)
- **Recommended For:** OLED, LED, and standard LCD displays

**Use Case:** Primary theme for all users unless explicitly selecting alternatives.

### OLED Black (Power-Saving Variant)

Optimized for OLED displays to reduce power consumption via pure black pixels:
- **Background:** #000000 (pure black, pixels off)
- **Surfaces:** #0a0a1a → #050510 (slightly tinted, deeper)
- **Accents:** Slightly desaturated to avoid OLED burn-in risk
  - Cosmic Blue: #2563eb → #1e40af (darker)
  - Nebula Purple: #7c3aed → #6d28d9 (darker)
  - Gold: #f59e0b → #d97706 (darker)
- **Text:** Unchanged (#f8fafc, #94a3b8)
- **Recommended For:** Users with OLED phones/tablets wanting extended battery

**Burn-in Mitigation:**
- Reduce max brightness of static elements (UI panels)
- Encourage frequent view changes (full viewport navigation, not static overlays)
- Auto-hide inactive panels after 30s
- Note: "OLED Black Mode" in settings with warning about reduced brightness

### High Contrast Variant (Accessibility)

Maximized contrast for users with low vision or visual impairment (WCAG AAA compliance):
- **Background:** #000000 (pure black)
- **Surfaces:** #1a1a2e (visible separation from background)
- **Accents:** Maximum saturation
  - Cosmic Blue: #0055ff (pure, high saturation)
  - Nebula Purple: #9933ff (bright purple)
  - Gold: #ffaa00 (bright gold)
  - Aurora Green: #00ff00 (bright lime green)
  - Solar Orange: #ff8800 (bright orange)
  - Red Giant: #ff3333 (bright red)
- **Text:** Pure white #ffffff
- **Borders:** Visible 2px borders on all elements (vs. 1px standard)
- **Disabled State:** Cross-hatch pattern + color (not just opacity reduction)

**Implementation:**
```css
@media (prefers-contrast: more) {
  /* Apply high-contrast palette */
}
```

**Recommended For:** Accessibility requirement, users with vision impairment, high-ambient-light environments

---

## 11. Do's and Don'ts

### Design Guidelines with Examples

#### DO: Prioritize the Viewport

**✓ Good:** Minimal chrome, full 3D view, UI as subtle overlay
```
┌──────────────────────────────────┐
│ 🔍 Search  [Time: 1000x]         │  ← Minimal, 48px tall
├──────────────────────────────────┤
│                                  │
│      [Full 3D Starfield]        │
│      with floating labels       │  ← Viewport dominates (95%+)
│                                  │
├──────────────────────────────────┤
│   ◆ Compass   │ Scale: 1 Mpc    │  ← Subtle footer (32px)
└──────────────────────────────────┘
```

**✗ Bad:** Heavy UI chrome, panels blocking viewport
```
┌──────────────────────────────────┐
│ File Edit View Help Menu         │  ← Menubar
├──────────────────────────────────┤
│ [←] [→] [Home] [Bookmarks] 🔍    │  ← Toolbar
├─────────────────────────────────┐│
│ Object Tree                     ││
│ • Solar System                  ││
│ • Milky Way                     ││ ← Panels block
│ • Andromeda                     ││   viewport
│ • Triangulum                    ││
│                                 ││
│ Properties Panel                ││
└─────────────────────────────────┘│
│ [50% of screen, viewport only]  │
└──────────────────────────────────┘
```

#### DO: Use Glassmorphism Sparingly

**✓ Good:** Subtle translucent panels with backdrop blur
```
Card with blur:
┌─────────────────┐
│ Andromeda Galaxy│  ← Semi-transparent,
│ 2.5 Mpc         │     starfield visible behind
│ [View Details]  │
└─────────────────┘
```

**✗ Bad:** Opaque blocks, no context
```
┌─────────────────┐
│ Andromeda Galaxy│  ← Solid background,
│ 2.5 Mpc         │     viewport completely hidden
│ [View Details]  │
└─────────────────┘
```

#### DO: Match Sci-Fi Elegance, Not Cyberpunk

**✓ Good:** Subtle, functional, NASA-inspired
```
Clean, data-rich typography
Minimal neon (only accent colors)
Dark, vast backgrounds (infinity)
Restrained use of animation
```

**✗ Bad:** Over-styled, overwrought
```
Excessive glows and gradients
Neon everywhere (#00ff00, #ff00ff)
Beveled buttons (retro 2000s)
Spinning animations constantly
```

#### DO: Maintain Consistency

**✓ Good:** Same spacing, fonts, and colors throughout
- All buttons: 36px height, 8px padding
- All panels: Cosmic Blue #2563eb for interactive elements
- All text: Inter font family
- All spacing: 4px base unit

**✗ Bad:** Inconsistent design
- Button A: 36px, Button B: 40px
- Some panels Cosmic Blue, some Nebula Purple (when not intentional)
- Mix of fonts (Inter + Roboto + custom)
- Random spacing (5px, 10px, 15px)

#### DO: Provide Clear Feedback

**✓ Good:** Users know something happened
```
Button click:     Color change + brief scale (50ms)
Search result:    Highlight, smooth scroll into view
Simulation state: Time control color + toast notification
Object selected:  Border glow + label highlight
```

**✗ Bad:** No feedback, user unsure of state
```
Button click:     No visual change
Search result:    Silent, no indication
Simulation state: Silent, hard to tell if changed
Object selected:  No indication, user doesn't know
```

#### DO: Use Icons Purposefully

**✓ Good:** Icons aid quick scanning, paired with labels
```
🔖 Bookmark      ← Icon + label, clear intent
🎬 Play          ← Standard symbol
⚙️ Settings      ← Universally recognized
```

**✗ Bad:** Icon-only or ambiguous
```
◆    ← Unclear intent (diamond?)
⊕    ← Add or expand? Unclear
P    ← Could mean Play, Pause, Print?
```

#### DO: Respect White Space

**✓ Good:** Generous spacing, breathing room
```
Title
12px gap

Description text, paragraph
16px gap

[Action Button]
```

**✗ Bad:** Cramped, dense
```
Title
Description text, paragraph immediately below
[Action Button] [Action Button 2]
No gaps, hard to read
```

#### DO: Ensure Text Readability

**✓ Good:** High contrast, appropriate size, adequate line height
```
Font: 14px Inter, Regular
Color: #f8fafc on #0f172a (14.8:1 contrast)
Line height: 1.6 (22px)
Line length: ~60 chars (max-width 400px)
```

**✗ Bad:** Low contrast, small fonts, tight lines
```
Font: 10px, custom serif
Color: #64748b on #0a0a1a (2:1 contrast, fails AA)
Line height: 1.2 (12px)
Line length: 100+ chars (eye strain)
```

#### DO: Layer Information Hierarchically

**✓ Good:** Basic info visible, details on demand
```
Quick view (card):
• Object name
• Distance
• [View Details] button

Detailed view (modal):
• All properties
• Scientific references
• Share/bookmark options
```

**✗ Bad:** All information everywhere
```
Every object shows:
• 50 properties in small text
• Mathematical equations
• Historical data
• Hard to find what you need
```

#### DO: Use Color Intentionally

**✓ Good:** Color serves function (hierarchy, feedback, meaning)
```
Cosmic Blue:     Interactive, primary CTAs
Supernova Gold:  Discovery, bookmarks (stands out)
Aurora Green:    Success, valid states
Solar Orange:    Warning, pending
Red Giant:       Error, critical
Dim Gray:        Secondary, disabled
```

**✗ Bad:** Random color choices
```
Button A: Red
Button B: Purple
Button C: Green
No consistent meaning, confusing to users
```

#### DO: Mobile-First, Scale Up

**✓ Good:** Design for mobile constraints first, enhance for desktop
```
Mobile: Tap targets 44px, single column
Tablet: Add side panel, 56px targets
Desktop: Multi-column layout, full UI
```

**✗ Bad:** Desktop-only design, awkward on mobile
```
Desktop: Small buttons (24px), complex menus
Mobile: Impossible to tap, panels overflow
```

#### DO: Test Accessibility Early

**✓ Good:** Built-in from the start
```
• Keyboard navigation planned
• Color contrast verified
• Screen reader labels added
• Focus states defined
```

**✗ Bad:** Accessibility afterthought
```
• Keyboard nav added last (incomplete)
• Contrast not tested (fails WCAG)
• No alt text on icons
• Focus states invisible
```

---

## 12. Component Implementation Notes

### CSS-in-JS / Tailwind Recommendations

For rapid, consistent implementation:

#### Tailwind CSS Utilities

```tailwind
/* Glassmorphic panels */
@apply bg-deep-void bg-opacity-85 backdrop-blur-lg border border-white border-opacity-10 rounded-lg

/* Dark surface */
@apply bg-void-surface border border-slate-600 border-opacity-10

/* Cosmic Blue button */
@apply bg-blue-600 hover:bg-blue-700 focus:outline-2 focus:outline-offset-2 focus:outline-blue-500

/* Dim text */
@apply text-slate-400 hover:text-white transition-colors duration-150

/* Base spacing (4px) */
@apply gap-1 (4px) gap-2 (8px) gap-3 (12px) gap-4 (16px)
```

#### Custom CSS Variables

```css
:root {
  /* Colors */
  --color-deep-black: #000000;
  --color-void: #050510;
  --color-deep-void: #0f172a;
  --color-surface: #1e293b;
  
  --color-cosmic-blue: #2563eb;
  --color-cosmic-blue-dark: #1e40af;
  --color-nebula-purple: #7c3aed;
  --color-gold: #f59e0b;
  --color-green: #10b981;
  --color-orange: #f97316;
  --color-red: #ef4444;
  
  --color-text-primary: #f8fafc;
  --color-text-secondary: #cbd5e1;
  --color-text-dim: #94a3b8;
  --color-text-shadow: #64748b;
  
  /* Spacing (4px base) */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 24px;
  --space-2xl: 32px;
  
  /* Transitions */
  --transition-fast: 150ms ease-out;
  --transition-normal: 300ms ease-out;
  --transition-slow: 500ms ease-in-out;
  --transition-cinematic: 2000ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

### Animation Library Recommendations

- **Framer Motion** (React): Built-in spring physics, orchestrated animations
- **Gsap** (Vanilla JS): Powerful for cinematic camera movements
- **Animate.css** (Quick prototyping): Pre-made animations, customizable
- **Custom CSS:** For simple transitions (preferred for performance)

### Responsive Design Tools

- **CSS Grid:** Full viewport layout, overlay zones
- **Flexbox:** Component-level alignment (buttons, menus)
- **Container Queries:** Component-level responsive (upcoming CSS standard)
- **Viewport Units:** Scale with screen size (use sparingly, performance impact)

---

## 13. Future Extensibility

### Planned Variants

- **Cinder Theme:** Warmer darks (#1a1515), copper accents (#b87333)
- **Void Variant:** Deeper blacks (#000000), minimal color (grayscale + single accent)
- **Science Mode:** Higher contrast, more data densification, tabular layouts

### Component Expansions

- **Data Tables:** Scientific data display (object catalogs)
- **Spectrum Viewer:** Spectral analysis visualization
- **Timeline Widget:** Historical/future epoch selection
- **Observation Planner:** Multi-target mission builder
- **AR Mode:** Augmented reality viewport overlay (mobile)

---

## Document Metadata

| Property | Value |
|----------|-------|
| **Author** | Cosmos Explorer Design Team |
| **Version** | 1.0 |
| **Last Updated** | 2026-04-16 |
| **Status** | Published |
| **License** | Internal Use Only |
| **Next Review** | 2026-07-16 (Q3) |

---

### Change Log

#### Version 1.0 (2026-04-16)
- Initial design system publication
- Complete color palette with opacity variants
- 11-component library with detailed specs
- Accessibility (WCAG AA/AAA) guidelines
- 3 responsive breakpoints
- Dark theme variants
- Animation & motion standards

---

**End of Document**
