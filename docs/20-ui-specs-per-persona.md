# UI Specifications per Persona: Cosmos Explorer
## Interactive 3D Web Universe Visualization (Three.js/WebGL)

**Version:** 2.1  
**Date:** 2026-04-19  
**Application:** Cosmos Explorer - Educational & Creative Universe Visualization Platform  
**Tech Stack:** Three.js r184, WebGL 2.0, React, TailwindCSS, Framer Motion  

---

> **⚠ AETHER V4 VISUAL DIRECTION NOTICE**
>
> The approved visual direction for Cosmos Explorer is **AETHER V4 — Retro-Futuristic Terminal**,
> fully specified in **[Doc 24 — UI/UX Design Brief](./24-ui-ux-design-brief.md)**.
>
> The **Design System Reference** below shows the original (pre-AETHER) tokens used when this
> document was first authored. **For implementation, use the AETHER V4 token mapping below.**
> The component layouts, persona modes, and interaction patterns in this document remain valid —
> only the visual tokens (colors, fonts, border styles) must be swapped per the mapping table.
>
> **AETHER V4 Token Mapping (Doc 24 §3.1–3.3):**
>
> | Original Token (this doc) | AETHER V4 Token | Hex |
> |---------------------------|-----------------|-----|
> | Deep Space Black `#0a0a1a` | `--bg-void` | `#0a0a0f` |
> | Cosmic Blue `#2563eb` | `--accent-pink` | `#ff6b9d` |
> | Nebula Purple `#8b5cf6` | `--accent-purple` | `#c084fc` |
> | Supernova Gold `#f59e0b` | `--accent-amber` | `#fbbf24` |
> | Aurora Green `#10b981` | `--accent-green` | `#4ade80` |
> | Solar Orange `#f97316` | `--accent-orange` | `#fb923c` |
> | Red Giant `#ef4444` | `--accent-red` | `#f87171` |
> | Glass Background `rgba(15,23,42,0.85)` | `--bg-surface` + scanline overlay | `#0d0d14` |
> | Inter font | Space Mono (UI) / Press Start 2P (headings) | — |
> | JetBrains Mono | IBM Plex Mono (data) | — |
> | Glassmorphism blur | Terminal panel chrome (1px border, square corners) | — |
> | Border Radius 8px/12px | Border Radius 2px max (terminal aesthetic) | — |

## Design System Reference (Original Pre-AETHER Tokens)

**Color Palette:**
- Deep Space Black: `#0a0a1a` → AETHER V4: `--bg-void` `#0a0a0f`
- Cosmic Blue: `#2563eb` → AETHER V4: `--accent-pink` `#ff6b9d`
- Nebula Purple: `#8b5cf6` → AETHER V4: `--accent-purple` `#c084fc`
- Supernova Gold: `#f59e0b` → AETHER V4: `--accent-amber` `#fbbf24`
- Aurora Green: `#10b981` → AETHER V4: `--accent-green` `#4ade80`
- Solar Orange: `#f97316` → AETHER V4: `--accent-orange` `#fb923c`
- Red Giant: `#ef4444` → AETHER V4: `--accent-red` `#f87171`
- Glass Background: `rgba(15, 23, 42, 0.85)` → AETHER V4: `--bg-surface` `#0d0d14`

**Typography:**
- UI Font: ~~Inter~~ → AETHER V4: **Space Mono** (Regular 400, Bold 700)
- Display Font: → AETHER V4: **Press Start 2P** (400) for H1-H3
- Data Font: ~~JetBrains Mono~~ → AETHER V4: **IBM Plex Mono** (Regular 400, SemiBold 600)
- Base Spacing: 4px (xs: 4px, sm: 8px, md: 12px, lg: 16px, xl: 24px, 2xl: 32px) — unchanged

**Visual Effects:**
- ~~Glassmorphism~~: → AETHER V4: Terminal panel chrome (1px solid `--border-default`, `border-radius: 2px`)
- ~~Border Radius: 8px/12px~~: → AETHER V4: 2px max
- ~~Shadows: 0 4px 16px rgba(0,0,0,0.4)~~: → AETHER V4: Phosphor glow per accent color (e.g., `0 0 8px #ff6b9d40`)
- **New:** CRT scanline overlay (1px lines at 2px intervals, opacity 0.03–0.06)
- **New:** Pixel grid dot pattern (8px intervals, 1px dots, opacity 0.04)

---

## Section 1: Document Header & Persona-Adaptive UI Architecture

### 1.1 Application Overview

Cosmos Explorer is a multi-purpose 3D universe visualization platform that adapts its interface and capabilities based on user role and intent. The application employs a sophisticated mode system to serve five distinct user personas while maintaining visual consistency and performance.

### 1.2 Mode System Architecture

The application features **five primary modes**, each fundamentally restructuring the UI layout, toolbar capabilities, information depth, and export functions.

#### Mode Definitions:

**Explorer Mode (Default)**
- Primary audience: Casual learners, hobbyists, space enthusiasts
- Focus: Discovery, wonder, interactive exploration
- Persona: Marcus Chen (featured below)
- Key capabilities: Search, bookmarks, tours, basic info, social sharing
- Toolbar emphasis: Navigation, bookmarking, social features
- Data depth: Simplified, non-technical

**Educator Mode**
- Primary audience: Teachers, professors, science communicators
- Focus: Classroom instruction, student engagement, assessment
- Persona: Dr. Sarah Williams (featured below)
- Key capabilities: Annotation, lesson plans, student sync, presentation mode
- Toolbar emphasis: Teaching tools, class management, content customization
- Data depth: Adjustable (student-friendly ↔ advanced)

**Creator Mode**
- Primary audience: Content creators, animators, scientists
- Focus: Production workflows, recording, publishing
- Persona: Alex Rivera (featured below)
- Key capabilities: Camera paths, keyframing, batch export, embedding
- Toolbar emphasis: Timeline, export, recording controls
- Data depth: Technical, full metadata

**Observer Mode**
- Primary audience: Researchers, data analysts
- Focus: Data observation, measurements, scientific accuracy
- Key capabilities: Precise measurements, data overlays, CSV export
- Toolbar emphasis: Analysis tools, measurement suite
- Data depth: Maximum detail, scientific notation

**Research Mode**
- Primary audience: Astrophysicists, academic researchers
- Focus: Advanced analysis, simulation parameters, publication-ready exports
- Key capabilities: API access, parameter modification, batch processing
- Toolbar emphasis: Scientific instruments, data export
- Data depth: Full technical specifications

### 1.3 Mode Switching Mechanism

#### First-Time Launch Wizard (Entry Point)

**Step 1: Welcome Screen**
- Centered container: 600px width, 400px height
- Dark glassmorphic panel: `rgba(15, 23, 42, 0.95)`, border 1px `rgba(37, 99, 235, 0.3)`
- Title: Inter Bold 28px, Cosmic Blue #2563eb, margin-bottom 24px
- Description: Inter Regular 16px, text-gray-300, line-height 1.6
- Animation: Fade-in 600ms ease-out on load
- 5 mode cards below (120px height each):
  - Card layout: Flex column, 280px width, padding 16px
  - Icon top: 32px size, centered, color per mode
  - Mode name: Inter SemiBold 14px, margin-top 12px
  - Description: Inter Regular 12px, text-gray-400
  - On hover: bg color shift to `rgba(37, 99, 235, 0.15)`, border to Cosmic Blue
  - On click: Highlight animation (scale 1.02, shadow expand)

**Step 2: Mode Selection Confirmation**
- Modal overlay: `rgba(10, 10, 26, 0.7)`, backdrop-blur(8px)
- Confirmation panel: 500px width, 300px height
- Selected mode details display
- Two buttons at bottom: "Confirm" (Cosmic Blue) and "Back" (transparent border)
- Button size: 44px height, min-width 120px
- Transition: All mode selections slide + fade 400ms cubic-bezier(0.4, 0, 0.2, 1)

**Step 3: Initial Preferences**
- Conditional questions based on selected mode
- Explorer: "Enable notifications?" + "Join community?"
- Educator: "Class size?" (dropdown) + "Subject area?" (multi-select)
- Creator: "Export preferences?" (preset buttons) + "Recording quality?" (slider)
- Observer: "Measurement units?" (imperial/metric) + "Data format?" (CSV/JSON/XML)
- Research: "Simulation parameters?" (advanced panel) + "API key setup?" (optional)

#### Settings Toggle (Runtime Access)

**Settings Button Location:**
- Top-right corner, fixed position
- Size: 44px × 44px circle button
- Icon: Gear (Heroicons, 20px), color Nebula Purple #8b5cf6
- Background: `rgba(15, 23, 42, 0.6)`, border 1px `rgba(139, 92, 246, 0.4)`
- On hover: bg opacity to 0.8, scale 1.05, 200ms transition
- On click: Settings panel slides from right (300ms ease-out)

**Settings Panel Layout:**
- Width: 380px (desktop), 100% (mobile)
- Height: 100vh, position: fixed, right: 0
- Background: Glass `rgba(15, 23, 42, 0.95)`
- Header: 60px height, border-bottom 1px `rgba(37, 99, 235, 0.2)`
  - Close button top-right (20px from edges)
  - Title: "Settings" Inter SemiBold 18px
- Content: Scrollable, padding 24px
- Footer: Mode indicator bar (20px height) showing current mode name + icon

**Mode Switching in Settings:**
- Section: "Experience Mode"
- Subheading: Inter SemiBold 12px, text-gray-400, margin-top 24px
- 5 mode buttons (stacked vertically):
  - Height: 48px
  - Padding: 12px 16px
  - Border-radius: 8px
  - Border: 2px solid (inactive: transparent, active: mode color)
  - Background: inactive `rgba(139, 92, 246, 0.1)`, active `rgba(37, 99, 235, 0.2)`
  - Text: Inter Medium 14px, left-aligned
  - Icon: 16px, left side, 12px margin-right
  - On click: Confirmation prompt (1 second confirmation alert before switching)
  - Transition: All 300ms ease-out

### 1.4 Mode-Specific UI Adaptations

#### Toolbar Composition by Mode

**Explorer Mode Toolbar** (Top, persistent)
- Height: 56px, padding 12px 16px
- Components (L→R): Logo (24px), Search bar (320px), Spacer, Tour button, Screenshot button, Share button, Settings gear
- Background: Glassmorphic, fully opaque
- Shadow: Subtle drop-shadow below

**Educator Mode Toolbar** (Top)
- Height: 64px
- Components: Logo (24px), Class badge (student count), Spacer, Annotation toggle, Lesson progress bar (180px), Timer display, Sync indicator, Settings gear
- Annotation tools accessible via toggle (expands annotation toolbar below main toolbar)

**Creator Mode Toolbar** (Top + Timeline at bottom)
- Height: 56px (top), 120px (bottom timeline)
- Components (top): Logo, Title field (editable), Spacer, Recording toggle (red button), Camera path editor, Export button, Settings gear
- Timeline features: Scrubber, playhead, keyframe markers, zoom controls (bottom)

**Observer Mode Toolbar** (Top + Right sidebar)
- Height: 56px
- Components: Logo, Search, Measurement tools dropdown, Data overlay toggle, Export button, Settings gear
- Right sidebar: 280px width, measurements panel, formula builder

**Research Mode Toolbar** (Top + Left sidebar)
- Height: 56px
- Components: Logo, Advanced search, Parameter panel toggle, Batch export, API status, Settings gear
- Left sidebar: 320px width, simulation controls, parameter presets

#### Sidebar Behaviors by Mode

**Explorer Mode:**
- Right sidebar (hidden by default, toggle via "Info" button)
- Width: 360px, expands on object click
- Content: Object detail panel with basic info, links, related objects

**Educator Mode:**
- Left sidebar: 280px, persistent
- Content: Lesson plan steps, student list, discussion prompts
- Right sidebar: 360px, object detail panel (student-friendly toggle)

**Creator Mode:**
- Left sidebar (hidden): 320px, Camera path editor (expandable)
- Right sidebar (hidden): 300px, Export panel (expandable)
- Focus on canvas maximization

**Observer Mode:**
- Left sidebar (hidden): Expandable measurement tools
- Right sidebar: 360px, persistent, measurement details + graph
- Status bar: Bottom, real-time calculation display

**Research Mode:**
- Left sidebar: 380px, persistent, parameter panel
- Right sidebar (hidden): Data export panel (expandable)
- Bottom panel (hidden): Advanced metrics display

#### HUD (Heads-Up Display) Variations

**Explorer Mode HUD:**
- Compass widget (top-left, 120px × 120px)
- Scale bar (bottom-left, 160px × 40px)
- Search results count (top-right, floating, 80px × 32px)
- Notification toasts (bottom-right, stacked, max 3)
- All elements fade on inactivity (8 seconds), re-appear on mouse move

**Educator Mode HUD:**
- Student status indicator (top-left, 140px × 36px, green if >80% connected)
- Timer display (top-center, large, 120px × 60px, color changes at 5-min warning)
- Presentation mode toggle overlay (bottom-center when in presentation)
- Annotation indicator (top-right, shows active pen color + tool name)

**Creator Mode HUD:**
- Recording status (top-left red banner, 200px × 44px, blinking)
- Playhead time code (bottom-center, 160px × 32px, JetBrains Mono)
- Frame counter (bottom-right, 120px × 32px)
- Camera position display (top-right, 180px × 48px, toggleable)

**Observer Mode HUD:**
- Measurement crosshair (center, subtle, 40px × 40px)
- Distance readout (top-center, 200px × 40px, toggleable)
- Coordinate display (bottom-left, 220px × 48px, JetBrains Mono)
- Unit indicator (top-right, 100px × 32px)

**Research Mode HUD:**
- Parameter values (left side, 240px × varied, scrollable)
- Simulation status (top-center, 300px × 44px)
- FPS/performance metrics (top-right, 160px × 32px, toggleable)
- Data stream indicator (bottom-left, 140px × 28px)

#### Context Menu Adaptations

All modes support right-click context menus on 3D objects, but content varies:

**Explorer Mode:**
- Bookmark this object
- View related objects
- Get more info
- Share this view
- Open in fullscreen

**Educator Mode:**
- Bookmark (with class annotation option)
- Add to lesson plan
- Create discussion prompt
- Lock/unlock for students
- Take screenshot for slides

**Creator Mode:**
- Add waypoint to camera path
- Mark keyframe (if recording)
- Save camera position
- Capture high-res screenshot
- Copy object coordinates

**Observer Mode:**
- Measure to this object
- Log measurement
- Export coordinates
- Add annotation
- Reference in notes

**Research Mode:**
- Modify parameters
- Add to batch query
- Export object data
- Reference in paper
- Simulate variation

### 1.5 Mode Capability Comparison Table

| Capability | Explorer | Educator | Creator | Observer | Research |
|---|---|---|---|---|---|
| Search & Discover | ✓ | ✓ | ✓ | ✓ | ✓ |
| Bookmarking | ✓ | ✓ (class-tagged) | ✓ | ✓ | ✓ |
| Guided Tours | ✓ | ✓ (lesson-linked) | ✗ | ✗ | ✗ |
| Annotations | ✗ | ✓ (full suite) | ✓ (path/timeline) | ✓ (measurements) | ✓ (parameter notes) |
| Time Controls | Basic | Enhanced (presets) | Full (keyframe) | Full (precise) | Advanced (sim) |
| Export Options | Screenshot, Social | Screenshot, PDF, Social | Video, Frames, Embed | CSV, JSON, Images | API, Batch, Raw data |
| Student Management | ✗ | ✓ | ✗ | ✗ | ✗ |
| Real-time Collab | ✗ | ✓ (teacher → students) | ✗ | ✗ | ✗ |
| Camera Paths | ✗ | ✗ | ✓ (full editor) | ✗ | ✗ |
| Recording | Screenshot only | Screenshot only | ✓ (video) | Screenshot only | Screenshot only |
| Measurement Tools | ✗ | ✗ | ✗ | ✓ | ✓ |
| Parameter Control | ✗ | ✗ | ✗ | ✗ | ✓ |
| API Access | ✗ | ✗ | ✗ | ✗ | ✓ |
| Presentation Mode | ✗ | ✓ | ✗ | ✗ | ✗ |
| Data Overlays | ✗ | ✓ (optional) | ✓ (recording) | ✓ | ✓ |
| 3D Cursor/Tools | Compass only | Navigation compass | Full toolkit | Measurement tools | Parameter gizmos |

---

## Section 2: Explorer Mode — Marcus Chen, Space Dreamer (~500 lines)

### 2.1 Explorer Mode: Persona Overview

**User Profile:**
- Name: Marcus Chen
- Age: 28
- Background: Software engineer with childhood passion for astronomy
- Usage Pattern: 30-45 min sessions, 3-4 times per week
- Primary Goals: Explore the universe, discover facts, share findings with friends
- Technical Comfort: High (understands tech), but values simplicity in UX
- Device: 85% desktop (2560×1440), 15% tablet (iPad Pro)

**Motivations:**
- Wonder and discovery
- Learning bite-sized space facts
- Sharing "cool" discoveries socially
- Bookmarking favorite objects for return visits

### 2.2 Explorer Mode: Full Screen Layout ASCII Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [COSMOS] [Search: "Andromeda"...] [⭐ Tours] [📸 Screenshot] [🔗 Share] [⚙️]     │  56px
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│                                                                                 │
│                                                                                 │
│  [🧭 N]              ┌───────────────────────────────────────────────────────┐ │
│                      │                                                       │ │
│  3D CANVAS           │          3D UNIVERSE VISUALIZATION                    │ │
│  (Three.js)          │          (WebGL Rendering)                           │ │
│                      │                                                       │ │
│                      │  [Hovered: Andromeda Galaxy]                        │ │
│                      │   Distance: 2.5 million light-years                 │ │
│                      │   Type: Spiral Galaxy                               │ │
│                      │   [Learn More →]                                   │ │
│                      │                                                       │ │
│                      └───────────────────────────────────────────────────────┘ │
│                                                                                 │
│  [━━━━ 1 Parsec] ┌─────────────────────┐                [📬 Toast]            │
│  Scale Bar       │ Recent Searches:    │               Loading tour...        │
│                 │ ○ Andromeda         │                [████ 45%]             │
│                 │ ○ Mars              │                                       │
│                 │ ○ Betelgeuse        │                                       │
│                 └─────────────────────┘                                       │
│                                                                                 │
│  [⏯️ Play] [◀ Past] [Speed: 1x▼] [📅 Today] [🎂 Customize Time]              │  40px
└─────────────────────────────────────────────────────────────────────────────────┘

Right Sidebar (hidden, expands on click):
┌──────────────────────────┐
│ Andromeda Galaxy    [✕]  │ 360px
├──────────────────────────┤
│ Type: Spiral Galaxy      │
│ Distance: 2.5M ly        │
│ Diameter: 220k ly        │
│ Mass: 1T M☉              │
│ Redshift: -0.001         │
├──────────────────────────┤
│ [★ Bookmark]             │
│ [🔍 More Info]           │
│ [🔗 Wikipedia]           │
├──────────────────────────┤
│ Related Objects:         │
│ • Triangulum Galaxy      │
│ • M32 (Companion)        │
│ • M110 (Companion)       │
└──────────────────────────┘
```

### 2.3 Search Bar Component

**Dimensions & Position:**
- Position: Top toolbar, left of spacer
- Width: 320px (desktop), 100% - 400px (tablet), 100% - 180px (mobile)
- Height: 40px
- Margin: 0px left, 16px right
- Border-radius: 8px
- Background: `rgba(15, 23, 42, 0.6)`, border 1px `rgba(37, 99, 235, 0.4)`

**Typography:**
- Placeholder text: Inter Regular 14px, text-gray-500
- Input text: Inter Regular 14px, text-gray-100
- Focus: Border color shifts to Cosmic Blue #2563eb, shadow `0 0 12px rgba(37, 99, 235, 0.3)`

**States:**

*Default State:*
- Background: `rgba(15, 23, 42, 0.6)`
- Border: 1px `rgba(37, 99, 235, 0.4)`
- Icon left: Magnifying glass (16px, text-gray-500), padding 12px left
- Placeholder: "Search universe..."
- Cursor: Blinking text cursor

*Focus State:*
- Background: `rgba(15, 23, 42, 0.8)`
- Border: 1px Cosmic Blue #2563eb
- Shadow: `0 0 16px rgba(37, 99, 235, 0.4)`
- Icon: Color shifts to Cosmic Blue
- Transition: All 300ms ease-out

*Typing State:*
- Clear button appears (right side, 16px icon, 12px padding)
- Clear button color: text-gray-400, on hover Nebula Purple
- Type icons appear dynamically (3 small tags below search bar)

*Loading State:*
- Spinner animation: Rotating circle (12px) left of text
- Color: Cosmic Blue, rotation 2s linear infinite
- Background transitions to `rgba(37, 99, 235, 0.1)`

**Type Icons (Tags Below Search):**
- Appear after 200ms of typing, animated entrance (slide-up + fade)
- Max 3 icons shown, stacked horizontally
- Each icon: 20px × 20px, margin 4px, background `rgba(37, 99, 235, 0.2)`, border-radius 4px
- Types: 🌟 (Stars), 🌍 (Planets), 🌌 (Galaxies), 🌑 (Black holes), 👽 (Exoplanets)
- On hover: Background opacity to 0.35, scale 1.1

**Autocomplete Dropdown:**
- Position: Below search bar, aligned left
- Width: Same as search bar (320px)
- Background: `rgba(15, 23, 42, 0.95)`, border 1px `rgba(37, 99, 235, 0.3)`, border-top none
- Max height: 320px, scrollable
- Margin-top: 4px
- Entrance animation: Slide-down + fade 300ms ease-out

**Autocomplete Items:**
- Height: 40px each
- Padding: 12px 16px
- Spacing: 4px between items
- Layout: Icon (20px) + Name (240px) + Type tag (60px)
- Background: Default transparent, on hover `rgba(37, 99, 235, 0.1)`
- Text: Icon left, name Inter SemiBold 13px, type tag Inter Regular 11px right-aligned, text-gray-500
- On click: Name "Andromeda" + type "Galaxy" → selection animation (scale 0.95) then execute search

**Recent Searches Section:**
- Appears below autocomplete items if any exist
- Subheading: "Recent Searches" Inter Regular 11px, text-gray-600, padding 8px 16px
- List: Up to 6 items, same styling as autocomplete items
- Clear recent button: "Clear recent" Inter Regular 11px, text-red-500, right side, on hover text-red-400
- All recent items fade-out 300ms on clear

### 2.4 Object Info Tooltip Component (Hover)

**Trigger & Visibility:**
- Trigger: Hover over any 3D object (0.4s delay to prevent flicker)
- Fade-in animation: 200ms ease-out
- Fade-out animation: 100ms ease-out on mouse leave
- Z-index: 100 (above canvas, below modals)

**Position & Sizing:**
- Width: 280px
- Max height: 220px
- Position: Follows mouse cursor, offset 12px right and 12px down from cursor
- Boundary detection: If tooltip would go off-screen, mirror position (left if right edge exceeded, top if bottom edge exceeded)

**Visual Design:**
- Background: `rgba(15, 23, 42, 0.95)`, border 1px `rgba(139, 92, 246, 0.4)`
- Border-radius: 8px
- Padding: 16px
- Shadow: `0 8px 24px rgba(0, 0, 0, 0.6)`
- Backdrop: Subtle blur effect

**Content Structure:**
```
┌────────────────────────┐
│ 🌟 Andromeda Galaxy    │  Header: 20px
├────────────────────────┤
│ Type: Spiral           │  1 line: 14px
│ Distance: 2.5M ly      │  1 line: 14px
│ Mass: 1T M☉            │  1 line: 14px
├────────────────────────┤
│ [Learn More →]         │  Link: 12px, Cosmic Blue
└────────────────────────┘
```

**Header (20px total height):**
- Icon: 16px, left, object type emoji
- Name: Inter SemiBold 14px, text-gray-100, left-margin 8px
- Vertical center alignment

**Info Lines (3 lines, 14px each, 4px spacing between):**
- Label: Inter Regular 12px, text-gray-500
- Value: Inter Medium 12px, text-gray-200
- Layout: Flex row, space-between, padding 0
- Ex: "Type" left, "Spiral" right

**Learn More Link (12px):**
- Text: "Learn More →" Inter SemiBold 11px, Cosmic Blue #2563eb
- Padding: 4px 0
- On hover: Color shifts to Nebula Purple, arrow animates right (+2px)
- On click: Opens object detail panel (see Section 2.5)

### 2.5 Object Detail Panel Component (Click Expansion)

**Trigger & Visibility:**
- Trigger: Click on 3D object (or "Learn More" from tooltip)
- Entrance: Slide-in from right 400ms cubic-bezier(0.4, 0, 0.2, 1)
- Exit: Slide-out to right 300ms ease-in
- Overlay: Semi-transparent `rgba(10, 10, 26, 0.3)` appears on canvas during panel open

**Position & Sizing:**
- Position: Fixed, right side of screen
- Width: 360px (desktop), 100vw (tablet/mobile, takes full width as sheet)
- Height: 100vh
- Top: 0
- Padding: 0 (header has own padding)
- Background: `rgba(15, 23, 42, 0.98)`, border-left 1px `rgba(37, 99, 235, 0.2)`

**Header Section (72px):**
- Height: 72px
- Padding: 16px
- Border-bottom: 1px `rgba(37, 99, 235, 0.2)`
- Layout: Flex, space-between, items-center
- Close button (right): 32px × 32px circle, icon X (16px), Nebula Purple, on hover scale 1.1
- Title: Left side, Inter Bold 18px, text-gray-100 (object name)
- Spacer between title and close button

**Content Sections (scrollable, padding 24px):**

**1. Quick Facts Section (Always Visible)**
- Background: `rgba(37, 99, 235, 0.05)`, padding 16px, border-radius 8px
- Grid: 2 columns on desktop, 1 on mobile
- Item spacing: 12px

Each Fact Item:
- Label: Inter SemiBold 11px, text-gray-500, margin-bottom 4px
- Value: Inter SemiBold 16px, text-gray-100
- Example: "Type" → "Spiral Galaxy"
- On mobile: Stack vertically, full width

Typical Quick Facts (6-8 items):
- Type
- Distance
- Mass
- Diameter
- Composition
- Discovery Year
- Notable Features (if applicable)

**2. Detailed Description Section**
- Subheading: "About" Inter SemiBold 14px, text-gray-300, margin-top 24px, margin-bottom 12px
- Body text: Inter Regular 13px, line-height 1.6, text-gray-400
- Max length: 200-300 words, truncated with "Read More" link if longer
- "Read More" link: Cosmic Blue, on click expands smoothly (min-height transition 400ms ease-out)
- Padding: 0 (inherits from parent scrollable area)

**3. Related Objects Section**
- Subheading: "Related Objects" Inter SemiBold 14px, margin-top 24px, margin-bottom 12px
- List: Scrollable horizontally if needed
- Item card: 140px width, 160px height (mobile: full width)
- Each card:
  - Background: `rgba(139, 92, 246, 0.1)`, border 1px `rgba(139, 92, 246, 0.3)`, border-radius 8px
  - Padding: 12px
  - Image placeholder: Gradient background, 116px × 80px, border-radius 4px
  - Name: Inter SemiBold 12px, text-gray-200, margin-top 8px
  - Type: Inter Regular 10px, text-gray-500, margin-top 2px
  - On hover: Border color to Cosmic Blue, scale 1.02
  - On click: Switch panel to that object (cross-fade transition 300ms)

**4. Additional Resources Section**
- Subheading: "Learn More" Inter SemiBold 14px, margin-top 24px, margin-bottom 12px
- Links: List of 3-5 external links
- Each link:
  - Text: Inter Regular 12px, Cosmic Blue
  - Icon right: External link icon (12px)
  - Layout: Flex row, space-between
  - Padding: 8px 12px, margin-bottom 8px
  - Background on hover: `rgba(37, 99, 235, 0.1)`
  - On click: Open in new tab

**5. Bookmark & Share Section (Bottom, Sticky)**
- Padding: 16px 24px
- Border-top: 1px `rgba(37, 99, 235, 0.2)`
- Height: 60px
- Position: Sticky bottom of scrollable content
- Layout: Flex row, justify-between
- Two buttons:
  - Bookmark button: 44px height, flex-1, margin-right 12px
    - Background: `rgba(139, 92, 246, 0.2)`, border 1px `rgba(139, 92, 246, 0.4)`
    - Text: "★ Bookmark" Inter Medium 13px, text-gray-200
    - Icon: Star (16px)
    - On hover: Border to Nebula Purple, shadow expand
    - On click: Fill star, toast confirmation "Added to bookmarks"
  - Share button: 44px height, flex-1
    - Background: `rgba(37, 99, 235, 0.2)`, border 1px `rgba(37, 99, 235, 0.4)`
    - Text: "🔗 Share" Inter Medium 13px, text-gray-200
    - On click: Opens share menu (see Section 2.7)

**Responsive Adaptations:**
- Tablet (1024px): Panel width 320px
- Mobile (375px): Panel width 100vw, full height sheet, header 64px, padding 16px

### 2.6 Screenshot Button & Resolution Dropdown

**Button Position & Sizing:**
- Position: Top toolbar, left of Share button
- Size: 44px × 44px circle
- Icon: Camera (20px)
- Icon color: Solar Orange #f97316
- Background: `rgba(15, 23, 42, 0.6)`, border 1px `rgba(247, 144, 22, 0.4)`
- Border-radius: 50%

**Button States:**

*Default:*
- Background: `rgba(15, 23, 42, 0.6)`, border `rgba(247, 144, 22, 0.4)`
- Icon: Solar Orange

*Hover:*
- Background: `rgba(15, 23, 42, 0.8)`
- Border: Solar Orange #f97316
- Scale: 1.05
- Shadow: `0 0 12px rgba(247, 144, 22, 0.3)`
- Transition: 200ms ease-out

*Click (Active):*
- Background: `rgba(247, 144, 22, 0.2)`
- Border: Solar Orange (solid)
- Scale: 0.98 (brief)
- Dropdown opens below

**Resolution Dropdown:**
- Position: Below button, aligned right
- Width: 160px
- Background: `rgba(15, 23, 42, 0.95)`, border 1px `rgba(247, 144, 22, 0.4)`
- Border-radius: 8px
- Margin-top: 8px
- Entrance: Slide-down + fade 250ms ease-out
- Exit: Slide-up + fade 150ms ease-in
- Shadow: `0 8px 24px rgba(0, 0, 0, 0.6)`

**Dropdown Items (Resolutions):**
- Items: 1080p, 1440p, 2160p (4K), 4320p (8K)
- Height: 40px each
- Padding: 12px 16px
- Background: Default transparent, hover `rgba(247, 144, 22, 0.1)`, selected `rgba(247, 144, 22, 0.2)`
- Text: Inter Regular 13px, left-aligned
- Checkmark icon (12px): Right side, visible only on selected item
- On click: Selection animates (scale 0.95 then 1.0), dropdown closes (200ms fade-out)
- Tooltip: Small label "1080p" → "1080p (Recommended)" for default selection

**Screenshot Capture Flow:**
1. Click button → dropdown opens
2. Select resolution
3. Scene renders at selected resolution (can take 2-5s for 4K)
4. Progress indicator appears: "Capturing screenshot..." with spinner (20px)
5. File downloads automatically as "cosmos-[timestamp].png"
6. Toast notification: "Screenshot saved" (green, Aurora Green #10b981, 3s auto-dismiss)

### 2.7 Share Button & Social Integration

**Button Position & Sizing:**
- Position: Top toolbar, right of Screenshot button, left of Settings gear
- Size: 44px × 44px circle
- Icon: Share/link icon (20px)
- Icon color: Supernova Gold #f59e0b
- Background: `rgba(15, 23, 42, 0.6)`, border 1px `rgba(245, 158, 11, 0.4)`
- Border-radius: 50%

**Button States:**

*Default:*
- Background: `rgba(15, 23, 42, 0.6)`
- Border: `rgba(245, 158, 11, 0.4)`
- Icon: Supernova Gold

*Hover:*
- Background: `rgba(15, 23, 42, 0.8)`
- Border: Supernova Gold #f59e0b
- Scale: 1.05
- Shadow: `0 0 12px rgba(245, 158, 11, 0.3)`
- Transition: 200ms ease-out

*Click (Active):*
- Background: `rgba(245, 158, 11, 0.2)`
- Border: Supernova Gold (solid)
- Share menu opens

**Share Menu Modal:**
- Position: Center of screen (modal overlay)
- Width: 480px (desktop), 90vw (mobile)
- Max height: 600px
- Background: `rgba(15, 23, 42, 0.98)`, border 1px `rgba(245, 158, 11, 0.3)`
- Border-radius: 12px
- Padding: 24px
- Overlay: `rgba(10, 10, 26, 0.7)`, backdrop-blur(8px)
- Entrance: Scale + fade 300ms cubic-bezier(0.4, 0, 0.2, 1)

**Share Menu Content:**

**Header (28px):**
- Title: "Share This Discovery" Inter Bold 18px, text-gray-100
- Close button: Right side, circle 32px, icon X (16px), Nebula Purple, on hover scale 1.1

**Tabs (Below header, 48px height):**
- Tab 1: "Social" (selected by default)
- Tab 2: "QR Code"
- Tab 3: "Advanced"
- Tab styling:
  - Height: 44px
  - Text: Inter SemiBold 13px
  - Background: Inactive transparent, active `rgba(245, 158, 11, 0.1)`, border-bottom 2px (inactive transparent, active Supernova Gold)
  - On click: Fade-out current, fade-in new content (250ms)

**Tab 1: Social Sharing**
- Intro text: "Share this object with your friends:" Inter Regular 13px, text-gray-400, margin-bottom 16px
- Social buttons grid: 3 columns (mobile: 1 column)
- Button height: 48px, full width
- Padding: 12px 16px
- Background: Platform color with transparency
- Border: 1px platform color, border-radius 8px
- Text: Platform icon (16px) + name, Inter Medium 13px, left-aligned

Social Platforms:
1. **Twitter/X**
   - Background: `rgba(15, 23, 42, 0.8)`, border 1px `#ffffff40`
   - Icon: X (16px, white)
   - Text: "Share on X"
   - On click: Opens twitter.com/intent/tweet?text=[encoded]&url=[link]

2. **Facebook**
   - Background: `rgba(15, 23, 42, 0.8)`, border 1px `#1877f240`
   - Icon: Facebook (16px, #1877f2)
   - Text: "Share on Facebook"
   - On click: Opens facebook.com/sharer/sharer.php?u=[link]

3. **Reddit**
   - Background: `rgba(15, 23, 42, 0.8)`, border 1px `#ff451440`
   - Icon: Reddit (16px, #ff4514)
   - Text: "Share on Reddit"
   - On click: Opens reddit.com/submit?url=[link]

4. **Email**
   - Background: `rgba(15, 23, 42, 0.8)`, border 1px `#2563eb40`
   - Icon: Envelope (16px, #2563eb)
   - Text: "Share via Email"
   - On click: Opens mailto:?subject=[subject]&body=[body]

5. **Copy Link**
   - Background: `rgba(15, 23, 42, 0.8)`, border 1px `#10b98140`
   - Icon: Link (16px, #10b981)
   - Text: "Copy Link"
   - On click: Copies link to clipboard, shows toast "Link copied!" (2s auto-dismiss)

6. **Telegram**
   - Background: `rgba(15, 23, 42, 0.8)`, border 1px `#0088cc40`
   - Icon: Telegram (16px, #0088cc)
   - Text: "Share on Telegram"
   - On click: Opens t.me/share/url?url=[link]&text=[text]

**Tab 2: QR Code**
- Intro: "Scan to share:" Inter Regular 13px, text-gray-400, margin-bottom 16px
- QR code display:
  - Size: 240px × 240px
  - Background: White
  - Padding: 16px
  - Container background: `rgba(37, 99, 235, 0.1)`, border 1px `rgba(37, 99, 235, 0.3)`, border-radius 8px
  - Centered in modal
- Download button below QR:
  - Height: 44px, width 240px, margin-top 16px
  - Background: Cosmic Blue, border none
  - Text: "📥 Download QR Code" Inter Medium 13px, white
  - On hover: Opacity 0.9, scale 1.02
  - On click: Downloads QR as PNG "cosmos-qr-[timestamp].png"

**Tab 3: Advanced**
- Share URL preview:
  - Label: "Share URL" Inter SemiBold 12px, text-gray-400, margin-bottom 8px
  - Input field: 100% width, 40px height, mono font, read-only
  - Copy button: Right side (44px × 40px), icon copy (16px)
  - On click: Copies to clipboard, button icon changes to checkmark (1s), then reverts

- Custom message:
  - Label: "Custom Message" Inter SemiBold 12px, text-gray-400, margin-bottom 8px
  - Textarea: 100% width, 80px height, border-radius 8px, padding 12px
  - Character count: Right bottom, Inter Regular 11px, text-gray-600, "0 / 280"
  - Character limit: 280 (enforced, no overflow)

- Share settings:
  - Checkbox: "Include current camera view" Inter Regular 12px, text-gray-300
  - Checkbox: "Include object details" Inter Regular 12px, text-gray-300
  - Checkbox: "Generate public link" Inter Regular 12px, text-gray-300

### 2.8 Navigation Compass Component

**Position & Sizing:**
- Position: Fixed, top-left corner of canvas
- Size: 120px × 120px (desktop), 100px × 100px (tablet), 80px × 80px (mobile)
- Margins: 20px from top, 20px from left
- Z-index: 50 (above canvas, below UI)

**Visual Design:**
- Background: `rgba(15, 23, 42, 0.7)`, border 2px `rgba(37, 99, 235, 0.5)`
- Border-radius: 50% (circular)
- Shadow: `0 4px 16px rgba(37, 99, 235, 0.2)`
- Center dot: 8px diameter, Cosmic Blue #2563eb

**Compass Ring:**
- Outer diameter: 120px
- Inner diameter: 100px
- Compass directions: N, E, S, W (cardinal), NE, SE, SW, NW (intercardinal)
- Cardinal directions (N, E, S, W): Inter Bold 12px, Cosmic Blue, positioned at 0°, 90°, 180°, 270°
- Intercardinal directions: Inter Regular 10px, text-gray-600, positioned at 45°, 135°, 225°, 315°
- Direction markings: Small ticks at each direction (1px wide, 2px long, Cosmic Blue)

**Needle Rotation:**
- Central needle: Thin line (1px wide, 40px long), Nebula Purple #8b5cf6
- Needle points "up" in world space (to camera's forward direction in 3D)
- Smooth rotation: Updates continuously as camera rotates (no animation delay)
- Rotation formula: Based on camera quaternion orientation

**Interactive States:**

*Hover:*
- Border color: Cosmic Blue #2563eb
- Shadow: `0 4px 20px rgba(37, 99, 235, 0.4)`
- Scale: 1.05
- Transition: 200ms ease-out

*Click:*
- Function: Resets camera to face cardinal direction (north by default)
- On click: Camera smoothly rotates to face North (0°), takes 800ms animation
- Toast confirmation: "Reset to North" (small, bottom of compass, 2s auto-dismiss)

**Responsive Hiding:**
- Mobile portrait (< 640px): Hidden by default (saves space)
- Toggle button: 32px × 32px, top-left, below compass area, on tap shows compass as overlay
- Overlay compass: Positioned center-top on mobile, 80px × 80px, tappable to rotate, shows dismissal swipe hint

### 2.9 Scale Indicator Bar Component

**Position & Sizing:**
- Position: Fixed, bottom-left corner of canvas
- Width: 160px (desktop), 140px (tablet), 120px (mobile)
- Height: 40px
- Margins: 20px from bottom, 20px from left
- Z-index: 50

**Visual Design:**
- Background: `rgba(15, 23, 42, 0.8)`, border 1px `rgba(10, 181, 144, 0.4)` (Aurora Green)
- Border-radius: 6px
- Padding: 8px 12px
- Shadow: `0 4px 12px rgba(10, 181, 144, 0.2)`

**Scale Bar Components:**

**Top Row (Labels, 14px height):**
- Left label: Inter SemiBold 11px, text-gray-300
- Reads: "1 Parsec =" (or dynamically based on zoom level)
- Right value: Inter Bold 11px, Cosmic Blue
- Reads: "3.26 ly" or converts based on selected unit

**Bottom Row (Visual Bar, 20px height, margin-top 4px):**
- Horizontal line: 100% width, 2px height, Aurora Green #10b981
- Left cap: 4px tall, 1px wide, Aurora Green
- Right cap: 4px tall, 1px wide, Aurora Green
- Subdivisions: 4 small tick marks evenly spaced, 3px tall, 1px wide, text-gray-700

**Unit Selector (On Hover):**
- Trigger: Hover over scale bar (0.3s delay)
- Popup: Appears above bar, 120px width, background `rgba(15, 23, 42, 0.95)`, border 1px `rgba(10, 181, 144, 0.4)`
- Options: "1 Parsec", "1 Light-year", "1 AU", "1 Million km", "1000 km"
- Each option: 28px height, Inter Regular 11px, text-gray-300
- Selected option: Highlighted with `rgba(10, 181, 144, 0.3)` background
- On click: Updates scale bar immediately, popup closes

**Dynamic Scaling:**
- Updates every 100ms based on camera zoom level
- Scale unit auto-adjusts (shows largest relevant unit that still displays clearly)
- Example progression: 1 parsec → 1 light-year → 1 AU → 1 million km → 1000 km
- Transition: Smooth opacity fade when unit changes (200ms)

### 2.10 Settings Panel Component

**Access:**
- Opens from gear icon in top-right corner
- See Section 1.3 for panel opening mechanism

**Settings Sections (Within the right-sliding panel):**

**Graphics Settings (Section, 24px margin-top):**
- Subheading: "Graphics" Inter SemiBold 12px, text-gray-400, margin-bottom 12px
- Toggle: "High Quality Mode" Inter Regular 12px
  - Slider: 44px × 24px, rounded, background inactive `rgba(139, 92, 246, 0.2)`, active Nebula Purple
  - On/off circle: 20px × 20px, positioned left/right
  - Tooltip on hover: "Enables anti-aliasing and improved lighting (may impact performance)"
  - On toggle: Settings save automatically to localStorage
- Toggle: "Motion Blur" Inter Regular 12px, spacing 16px below previous
- Toggle: "Bloom Effect" Inter Regular 12px, spacing 16px below previous
- Slider: "Star Brightness" Inter Regular 12px
  - Slider: 100% width, 6px height, background `rgba(139, 92, 246, 0.2)`, thumb 16px, Nebula Purple
  - Range: 0 - 100%
  - Value display: Right side, Inter Regular 11px, text-gray-400
  - On change: Updates in real-time, 100ms debounce for complex calculations

**Sound Settings (Section, margin-top 24px):**
- Subheading: "Sound" Inter SemiBold 12px, text-gray-400, margin-bottom 12px
- Toggle: "Background Music" Inter Regular 12px
  - Slider next to toggle: 60px width, volume slider (0-100%)
  - On/off circle color: Aurora Green #10b981
- Toggle: "Click Sounds" Inter Regular 12px, spacing 16px below
- Toggle: "Notifications" Inter Regular 12px, spacing 16px below

**Control Settings (Section, margin-top 24px):**
- Subheading: "Controls" Inter SemiBold 12px, text-gray-400, margin-bottom 12px
- Radio buttons: "Mouse Controls" (selected by default)
- Radio buttons: "Touch Controls"
- Radio buttons: "Gamepad Controls"
- Selection indicator: Filled circle, Cosmic Blue
- Spacing: 12px between options
- On select: Text below updates with keybind hints
  - Mouse: "Left drag: Rotate | Right drag: Pan | Scroll: Zoom"
  - Touch: "1 finger: Rotate | 2 finger: Pan & Zoom"
  - Gamepad: "Right stick: Rotate | Triggers: Zoom | Face buttons: Presets"
  - Text: Inter Regular 11px, text-gray-600, margin-top 12px

**Data & Privacy (Section, margin-top 24px):**
- Subheading: "Data & Privacy" Inter SemiBold 12px, text-gray-400, margin-bottom 12px
- Text: "Bookmarks and settings are stored locally on your device." Inter Regular 11px, text-gray-600
- Toggle: "Allow Analytics" Inter Regular 12px, margin-top 12px
  - Tooltip: "Helps us improve your experience"
  - Toggle color: Supernova Gold #f59e0b
- Toggle: "Allow Crash Reports" Inter Regular 12px, spacing 12px below
- Button: "Clear Local Data" Inter Regular 12px, text-red-500, margin-top 12px
  - On hover: text-red-400, underline
  - On click: Confirmation modal, "This will clear all bookmarks and settings. Are you sure?" 2 buttons: "Clear" (red), "Cancel"

**About (Section, margin-top 24px):**
- Text: "Cosmos Explorer v1.0" Inter SemiBold 12px, text-gray-400
- Text: "Build 20260416" Inter Regular 11px, text-gray-600
- Text: "© 2026 Cosmos Collective" Inter Regular 10px, text-gray-700

### 2.11 Bookmark/Favorites System

**Bookmark Button (In Detail Panel):**
- See Section 2.5, "Bookmark & Share Section"

**Bookmarks Sidebar Access:**
- Button: Top toolbar, next to Search (if not already visible)
- Icon: Bookmark/ribbon icon (16px), Nebula Purple
- Text: "Bookmarks" Inter Medium 12px
- On click: Toggles right sidebar to Bookmarks view

**Bookmarks Sidebar Panel (360px width):**
- Header: "My Bookmarks" Inter Bold 16px, padding 16px
- Close button: Top-right, 32px × 32px circle, icon X
- Subheading: "Count" Inter Regular 11px, text-gray-600, "You have 12 bookmarks"
- Spacing: 16px below

**Bookmarks List:**
- Scrollable area, max-height calc(100vh - 120px)
- Search input: 100% width, 36px height, placeholder "Search bookmarks...", margin-bottom 12px
- Bookmark items: Stack vertically, 80px height each, spacing 12px

**Each Bookmark Item:**
- Layout: Flex row, items center
- Thumbnail: 60px × 60px, left side, border-radius 4px, gradient background
  - On click: Navigates to that object in 3D view, sidebar collapses
- Content: Flex column, margin-left 12px, flex 1
  - Name: Inter SemiBold 13px, text-gray-200
  - Type: Inter Regular 11px, text-gray-600
  - Date added: Inter Regular 10px, text-gray-700, "Added 3 days ago"
- Actions: Right side, 32px × 32px button
  - Icon: Three dots (vertical), Nebula Purple, on hover visible, otherwise text-gray-700
  - On click: Dropdown menu (see below)
- Background: Default transparent, hover `rgba(139, 92, 246, 0.1)`
- Transition: All 200ms ease-out

**Bookmark Context Menu (On Three-Dot Click):**
- Position: Absolute, above/below three-dot button
- Width: 160px
- Items:
  1. "View" (primary action)
  2. "Edit Name" (opens edit modal)
  3. "Remove" (immediate removal, no confirm, toast confirmation)
  4. "Share" (opens share menu)
- Spacing: 4px between items
- Item height: 36px, padding 8px 12px
- Text: Inter Regular 12px, text-gray-300
- Background on hover: `rgba(139, 92, 246, 0.2)`
- Entrance: Slide-down + fade 200ms ease-out

**Edit Name Modal (On "Edit Name" Click):**
- Position: Center modal overlay
- Width: 400px
- Title: "Edit Bookmark Name" Inter Bold 14px, margin-bottom 16px
- Input field: 100% width, 40px, padding 12px, border 1px `rgba(139, 92, 246, 0.4)`, placeholder "Object name..."
- Two buttons: "Save" (Nebula Purple) and "Cancel" (transparent border)
- On Save: Updates bookmark, modal closes, list re-renders (100ms fade)
- On Cancel: Closes without changes

**Empty State:**
- When no bookmarks exist, list shows centered message:
- Icon: Bookmark outline (32px), text-gray-700
- Text: "No bookmarks yet" Inter Medium 14px, text-gray-600, margin-top 8px
- Subtext: "Bookmark objects to save them for later" Inter Regular 12px, text-gray-700
- Button: "Start Exploring" (gradient background, Cosmic Blue to Nebula Purple)

### 2.12 Tour Launcher Component

**Tour Button (Top Toolbar):**
- Position: Toolbar, between Search and Screenshot button
- Icon: Play circle (20px), Supernova Gold #f59e0b
- Text: "Tours" Inter Medium 12px, margin-left 8px
- Background: `rgba(15, 23, 42, 0.6)`, border 1px `rgba(245, 158, 11, 0.4)`, height 40px, padding 8px 16px, border-radius 8px
- On click: Opens tours panel (see below)

**Tours Panel (Left Sidebar):**
- Width: 300px (desktop), overlays canvas on mobile
- Header: "Guided Tours" Inter Bold 16px, padding 16px
- Close button: Top-right
- Intro text: Inter Regular 12px, text-gray-600, "Explore curated tours of the universe"
- Spacing: 16px below

**Featured Tour Section:**
- Subheading: "Featured" Inter SemiBold 12px, text-gray-400, margin-bottom 12px
- Single large card: 100% width, 240px height, border-radius 12px
- Background: Gradient (top-left: Cosmic Blue #2563eb, bottom-right: Nebula Purple #8b5cf6)
- Content overlay: Dark gradient `rgba(10, 10, 26, 0.6)` (bottom half)
- Padding: 16px
- Image placeholder: Full card (background gradient)
- Title: Inter Bold 16px, text-gray-100, positioned at bottom
- Duration: Inter Regular 12px, text-gray-400, left-aligned, "8 minutes"
- Play button: Floating circle, 48px × 48px, right-bottom corner, icon play (20px, white), background Supernova Gold, on hover scale 1.1
- On card click: Starts featured tour

**Tours List:**
- Scrollable, max-height calc(100vh - 400px)
- Spacing: 12px between items
- Tours grouped by category: "Beginner", "Intermediate", "Advanced"
- Category subheading: Inter SemiBold 11px, text-gray-500, margin-top 16px, margin-bottom 8px (first category has no top margin)

**Each Tour Item:**
- Layout: Flex row, padding 12px, border-radius 8px
- Thumbnail: 60px × 60px, left, border-radius 4px, gradient background
  - Overlay: Play icon (16px, centered), white, on hover scale 1.2
- Content: Flex column, margin-left 12px, flex 1
  - Title: Inter SemiBold 12px, text-gray-200
  - Description: Inter Regular 11px, text-gray-600, max 2 lines, truncate
  - Duration: Inter Regular 10px, text-gray-700, "6 min"
- Background: Default transparent, hover `rgba(245, 158, 11, 0.1)`
- Border: Default none, hover 1px `rgba(245, 158, 11, 0.3)`
- On click: Starts tour

**Tour Player Overlay (While Playing):**
- Position: Bottom-right corner of canvas
- Size: 360px × 240px (desktop), 100vw × 200px (mobile)
- Background: `rgba(15, 23, 42, 0.95)`, border 1px `rgba(245, 158, 11, 0.3)`, border-radius 12px
- Padding: 16px
- Shadow: `0 8px 32px rgba(0, 0, 0, 0.6)`

Tour Player Content:
- Step counter: "Step 3 of 8" Inter Regular 11px, text-gray-600, top-left
- Pause button: Top-right, 32px circle, icon pause (16px), Supernova Gold
- Current step title: Inter Bold 14px, text-gray-100, margin-bottom 8px
- Current step description: Inter Regular 12px, text-gray-400, line-height 1.5, max height 60px, scrollable if needed
- Progress bar: 100% width, 3px height, background `rgba(245, 158, 11, 0.2)`, fill `rgba(245, 158, 11, 0.8)`, margin-top 12px
- Navigation buttons: Flex row, space-between, margin-top 12px
  - "← Previous" button: 44px height, flex 1, margin-right 8px, text Inter Medium 11px, on click goes to previous step
  - "Next →" button: 44px height, flex 1, text Inter Medium 11px, on click goes to next step
  - Last step: "Next" button changes to "Finish" (red accent)

Tour Camera Automation:
- While playing, camera automatically transitions to each step's view
- Transition duration: 1500ms cubic-bezier(0.25, 0.46, 0.45, 0.94)
- User can manually rotate/zoom (tour waits for next button)
- All changes in 3D automatically reflect in tour (objects highlighted, labels appear)

### 2.13 Time Controls Component

**Position & Sizing:**
- Position: Bottom toolbar/control bar
- Height: 40px
- Layout: Flex row, items-center, spacing 12px, padding 0px 16px
- Background: `rgba(15, 23, 42, 0.8)`, border-top 1px `rgba(37, 99, 235, 0.2)`
- Z-index: 40 (below top toolbar, above canvas)

**Play/Pause Button:**
- Size: 32px × 32px circle
- Icon: Play (14px) or Pause (14px), Cosmic Blue
- Background: `rgba(37, 99, 235, 0.2)`, border 1px `rgba(37, 99, 235, 0.4)`
- On hover: Border to Cosmic Blue, shadow expand
- On click: Toggles play state

**Time Direction Button:**
- Size: 32px × 32px circle, margin-left 8px
- Icon: Left arrow (14px) or Right arrow (14px)
- Background: `rgba(37, 99, 235, 0.2)`, border 1px `rgba(37, 99, 235, 0.4)`
- Default: Right arrow (forward time)
- Function: Reverses time direction (cosmically reverses animation)
- On click: Toggles direction, arrow flips

**Speed Slider:**
- Label: "Speed:" Inter Regular 11px, text-gray-500, margin-left 16px
- Slider: 80px width, 6px height, thumb 12px, Cosmic Blue
- Range: 0.1x to 10x
- Display: Right of slider, Inter Regular 11px, text-gray-400, "1x" (updates dynamically)
- On change: Real-time update

**Date/Time Display:**
- Layout: Flex column, margin-left 24px
- Date: Inter SemiBold 12px, text-gray-200, "July 4, 2024"
- Time: Inter Regular 10px, text-gray-600, "14:32:15 UTC"
- Background: `rgba(37, 99, 235, 0.1)`, padding 8px 12px, border-radius 4px
- On hover: Background opacity increases

**Date Customization Button:**
- Button: "📅" emoji + "Customize" Inter Regular 11px, text-gray-300
- Size: 36px height, padding 0px 12px
- Background: Transparent, border 1px `rgba(37, 99, 235, 0.3)`, border-radius 4px
- On hover: Border to Cosmic Blue
- On click: Opens date picker modal

**Date Picker Modal:**
- Position: Center overlay
- Width: 400px
- Title: "Set Custom Date/Time" Inter Bold 14px, margin-bottom 16px
- Inputs:
  - Date field: "YYYY-MM-DD" placeholder, 100% width, 40px height
  - Time field: "HH:MM:SS" placeholder, 100% width, 40px height, margin-top 12px
  - Timezone dropdown: "UTC" selected by default, margin-top 12px
- Preset buttons: "Today", "1 Week Ago", "1 Month Ago", "1 Year Ago" (4 buttons, 100% width grid, margin-top 16px)
- Buttons: "Set" (Cosmic Blue) and "Cancel" (transparent border), margin-top 16px

### 2.14 Notification Toasts

**Position:**
- Fixed position, bottom-right corner
- Stack from bottom upward (newest on top)
- Margins: 20px from bottom, 20px from right
- Max z-index: 200 (above all other UI)
- Max visible toasts: 3 (additional toasts queue)

**Toast Styling:**
- Width: 360px (desktop), 90vw (mobile)
- Min height: 48px
- Padding: 12px 16px
- Background: Mode-specific (see types below)
- Border: 1px (mode-specific color)
- Border-radius: 8px
- Shadow: `0 8px 24px rgba(0, 0, 0, 0.6)`
- Entrance: Slide-in from right + fade 300ms cubic-bezier(0.4, 0, 0.2, 1)
- Exit: Slide-out to right + fade 200ms ease-in

**Toast Content:**
- Icon: Left (16px), margin-right 12px
- Message: Inter Regular 13px, flex 1
- Close button: Right (circle 24px), icon X (12px), on hover opacity 0.7

**Toast Types:**

1. **Success (Green)**
   - Background: `rgba(16, 185, 129, 0.2)`
   - Border: 1px `rgba(16, 185, 129, 0.5)`
   - Icon: Checkmark circle (16px), Aurora Green #10b981
   - Text color: text-gray-200
   - Auto-dismiss: 3 seconds
   - Example: "Screenshot saved"

2. **Error (Red)**
   - Background: `rgba(239, 68, 68, 0.2)`
   - Border: 1px `rgba(239, 68, 68, 0.5)`
   - Icon: X circle (16px), Red Giant #ef4444
   - Text color: text-gray-200
   - Auto-dismiss: 4 seconds (longer for errors)
   - Example: "Failed to load object"

3. **Info (Blue)**
   - Background: `rgba(37, 99, 235, 0.2)`
   - Border: 1px `rgba(37, 99, 235, 0.5)`
   - Icon: Info circle (16px), Cosmic Blue #2563eb
   - Text color: text-gray-200
   - Auto-dismiss: 3 seconds
   - Example: "Tour started"

4. **Warning (Orange)**
   - Background: `rgba(249, 115, 22, 0.2)`
   - Border: 1px `rgba(249, 115, 22, 0.5)`
   - Icon: Exclamation circle (16px), Solar Orange #f97316
   - Text color: text-gray-200
   - Auto-dismiss: 4 seconds
   - Example: "High-quality rendering may impact performance"

5. **Loading (Purple)**
   - Background: `rgba(139, 92, 246, 0.2)`
   - Border: 1px `rgba(139, 92, 246, 0.5)`
   - Icon: Spinner (16px), rotating, Nebula Purple #8b5cf6
   - Text color: text-gray-200
   - Auto-dismiss: Never (user must close or it auto-closes when action completes)
   - Example: "Loading tour..."

---

## Section 3: Educator Mode — Dr. Sarah Williams, Science Communicator (~400 lines)

### 3.1 Educator Mode: Persona Overview

**User Profile:**
- Name: Dr. Sarah Williams
- Age: 42
- Background: Physics professor, 15 years teaching experience
- Usage Pattern: 45-90 min sessions, 2-3 times per week during semester
- Primary Goals: Teach concepts, annotate for students, assess understanding
- Technical Comfort: High (comfortable with software), values pedagogical effectiveness
- Device: Desktop (2560×1440), projector display (1920×1080 via HDMI)

**Motivations:**
- Student engagement and understanding
- Visualization of abstract concepts
- Real-time collaboration with students
- Creating reusable lesson materials

### 3.2 Educator Mode: Full Screen Layout ASCII Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [COSMOS] [Class: Physics 101] [👥 12 connected] [🔒 Lock] [⏱️ 08:35] [⚙️]       │  64px
├─────────────────────┬─────────────────────────────────────────────────────────┬─────┤
│ Lesson Plan         │                                                         │Info │
│ ───────────         │      3D UNIVERSE VISUALIZATION                          │Panel│
│ 1. ◉ Gravity        │      (WebGL with Annotations)                           │ 280 │
│ 2. ○ Orbits         │                                                         │px   │
│ 3. ○ Life Cycles    │  [Hovered: Jupiter]                                    │     │
│    [■━━━ 33%]       │   [🔴 Circle drawn by Dr. Williams]                    │     │
│                     │                                                         │     │
│ Students Sync:      │                                                         │     │
│ ✓ Marcus           │                                                         │     │
│ ✓ Emma             │                                                         │     │
│ ✓ Chen             │                                                         │     │
│ ⏳ (9 more)         │                                                         │     │
│                     │                                                         │     │
│ Discussion Prompt:  │                                                         │     │
│ "Why is Jupiter    │                                                         │     │
│  so large?"        │                                                         │     │
│ [Show] [Hide]      │                                                         │     │
└─────────────────────┴─────────────────────────────────────────────────────────┴─────┘

Annotation Toolbar (Below top bar):
┌──────────────────────────────────────────────────────────────────────────────────┐
│ [✏️ Pen] [➜ Arrow] [⭕ Circle] [📝 Text] [🧹 Eraser] [↶ Undo] [Color: ●]         │  40px
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Annotation Toolbar Component

**Dimensions & Position:**
- Position: Below main toolbar, full width
- Height: 40px
- Background: `rgba(15, 23, 42, 0.8)`, border-bottom 1px `rgba(139, 92, 246, 0.3)`
- Padding: 8px 16px
- Layout: Flex row, items-center, spacing 12px

**Tool Buttons (6 primary tools):**
- Each button: 40px × 40px circle
- Icon: 20px, centered
- Background: `rgba(139, 92, 246, 0.1)`, border 1px `rgba(139, 92, 246, 0.3)`, border-radius 50%
- Default icon color: Nebula Purple #8b5cf6
- Spacing between tools: 8px

**Tool States:**

*Inactive (default):*
- Background: `rgba(139, 92, 246, 0.1)`
- Border: `rgba(139, 92, 246, 0.3)`
- Icon: text-gray-500

*Active (selected):*
- Background: `rgba(139, 92, 246, 0.3)`
- Border: Nebula Purple #8b5cf6
- Icon: Nebula Purple
- Scale: 1.05

*Hover:*
- Background opacity: 0.2
- Scale: 1.05
- Transition: 200ms ease-out

**Tools:**

1. **Pen Tool** (✏️)
   - Freehand drawing
   - Line width: 2-4px (adjustable via slider)
   - Creates smooth Bezier curves

2. **Arrow Tool** (➜)
   - Click-drag to create directed arrows
   - Arrow size: Scales with distance
   - Default color: Nebula Purple

3. **Circle Tool** (⭕)
   - Click-drag to draw circles/ellipses
   - Outline only, no fill
   - Stroke width: 2px

4. **Text Tool** (📝)
   - Click to place text
   - Opens inline text input
   - Font: Inter SemiBold 14px
   - Color: Per color selector

5. **Eraser Tool** (🧹)
   - Click-drag to erase annotations
   - Eraser size: 20px radius
   - Soft eraser (feathered edges)

6. **Undo Button** (↶)
   - Removes last annotation
   - Disabled if no annotations exist
   - Icon color fades to gray-700 when disabled
   - On click: Removes, toast confirmation

**Color Picker (Right side of toolbar):**
- Button: 40px × 40px circle, colored dot, label "Color"
- Current color display: Filled circle, 16px diameter
- On click: Opens color palette popup
- Palette: 8 preset colors + custom color picker
  - Presets: Nebula Purple, Cosmic Blue, Supernova Gold, Aurora Green, Solar Orange, Red Giant, White, Yellow
  - Custom: "Pick custom color" button opens native color picker
- Selected color: White border around dot (2px)
- Position: Absolute, right side, above toolbar center

### 3.4 Lesson Plan Panel (Left Sidebar)

**Dimensions & Position:**
- Position: Fixed, left side
- Width: 280px
- Height: 100vh
- Top: 104px (below both toolbars)
- Background: `rgba(15, 23, 42, 0.9)`, border-right 1px `rgba(37, 99, 235, 0.2)`
- Padding: 20px 16px
- Scrollable content area

**Header Section (40px):**
- Title: "Lesson Plan" Inter SemiBold 14px, text-gray-100
- Icon: Bookmark (16px), Nebula Purple, left-aligned
- Spacing: 12px

**Step List:**
- Scrollable area, max-height calc(100vh - 300px)
- Spacing: 8px between steps

**Each Step Item (50px height):**
- Layout: Flex row, items-center, padding 12px, border-radius 6px
- Background: Default `rgba(139, 92, 246, 0.05)`, active `rgba(139, 92, 246, 0.15)`, hover `rgba(139, 92, 246, 0.1)`
- Border: 1px (default transparent, active Nebula Purple)

Step Indicator (Left):
- Circle: 24px diameter
- Number: Inter SemiBold 12px, centered
- Color: Default text-gray-600, active Nebula Purple, completed Aurora Green
- Completed steps: Checkmark icon instead of number

Step Text (Center, flex 1):
- Title: Inter SemiBold 12px, text-gray-200
- Subtext: Inter Regular 10px, text-gray-600
- Margin-left: 12px

On Click: Loads step content, highlights step, animates camera to step's viewpoint

**Progress Bar (Below steps, sticky):**
- Height: 6px, width 100%, border-radius 3px
- Background: `rgba(139, 92, 246, 0.1)`, border 1px `rgba(139, 92, 246, 0.2)`
- Fill: Nebula Purple, width: 33% (based on completed steps)
- Label above: "Progress" Inter Regular 10px, text-gray-600, margin-bottom 8px
- Step count label: "Step 1 of 3" Inter Regular 10px, text-gray-400, right-aligned

**Class Info Section (Bottom, 60px):**
- Border-top: 1px `rgba(37, 99, 235, 0.2)`
- Padding-top: 12px
- Spacing: 8px between items

Students Sync Status:
- Text: "Students Connected" Inter SemiBold 11px, text-gray-300
- Count: "12 of 12" Inter Bold 12px, Aurora Green (all connected) or Supernova Gold (some connected)
- Indicator dot: 8px, color per status, left-aligned
- List trigger: On click, expands to show student names (max 8, "8 more" link if more)

**Student List Expansion:**
- Overlay panel: 280px width, slides from left, covers lesson plan
- Dark background: `rgba(15, 23, 42, 0.95)`, border-right 1px `rgba(37, 99, 235, 0.2)`
- Header: "Connected Students" Inter Bold 12px, close button (X, top-right)
- List: Student names + status indicator (🟢 connected, 🟡 inactive, 🔴 offline)
- Scrollable if > 8 students

### 3.5 Student Sync Controls

**Sync Indicator (Top Toolbar, next to class badge):**
- Layout: Flex row, items-center, padding 8px 12px, border-radius 4px
- Background: `rgba(16, 185, 129, 0.1)`, border 1px `rgba(16, 185, 129, 0.3)`
- Indicator dot: 8px, Aurora Green, pulsing animation (opacity 0.5 → 1.0, 1.5s infinite)
- Text: "All synced" Inter Regular 11px, text-gray-300
- On hover: Background opacity to 0.2, cursor pointer

**Lock Toggle Button:**
- Position: Top toolbar, next to sync indicator
- Size: 44px × 44px circle
- Icon: Lock or Unlock (20px)
- Icon color: Aurora Green #10b981
- Background: `rgba(16, 185, 129, 0.1)`, border 1px `rgba(16, 185, 129, 0.3)`
- Default state: Unlocked (students can rotate/zoom freely)
- Locked state: Icon changes to locked, background more opaque

**On Click (Lock Toggle):**
- If unlocked: Locks, toast "Students view is locked", icon changes to locked
- If locked: Unlocks, toast "Students can explore freely", icon changes to unlocked
- Locked UI: Indicator appears in top-right "🔒 Student view locked"

### 3.6 Comparison Mode Panel

**Trigger:**
- Button in top toolbar: "Compare" Inter Medium 12px, icon 🔄 (16px)
- Position: Right of lock button

**Comparison Mode Layout:**
- Splits canvas into two equal halves (left/right)
- Vertical divider line: 2px, Cosmic Blue, center
- Each side: Independent 3D viewport
- Camera control: Each side has independent camera
- Sync option: Toggle button "Sync cameras" (top-center, between the two views)

**Comparison Panel (Right sidebar, 320px):**
- Header: "Compare Objects" Inter Bold 14px, padding 16px
- Close button: Top-right
- Instructions: "Select two objects to compare side-by-side" Inter Regular 11px, text-gray-600

**Object Selector (per side):**
- Label: "Left Object" or "Right Object" Inter SemiBold 11px
- Dropdown: 100% width, 40px height, shows selected object name
- On click: Opens object picker (search + recent list)

**Comparison Info Section:**
- Side-by-side property table
- Properties: Type, Distance, Mass, Diameter, Composition (configurable)
- Layout: 3 columns (Property label, Left value, Right value)
- Difference highlight: Values that differ highlighted in Supernova Gold

**Preset Comparisons:**
- Buttons: "Inner vs Outer Planets", "Terrestrial vs Gas Giants", "Galaxies by Size"
- On click: Auto-loads comparison set

### 3.7 Discussion Prompt Overlay

**Trigger:**
- Manual: Button in lesson plan, "Ask Question" Inter Regular 11px
- Auto: Triggered at specific lesson steps

**Overlay Positioning:**
- Position: Center of canvas
- Width: 500px (desktop), 90vw (mobile)
- Height: Auto, max 400px
- Background: `rgba(15, 23, 42, 0.98)`, border 2px Cosmic Blue #2563eb
- Border-radius: 12px
- Padding: 24px
- Shadow: `0 16px 48px rgba(37, 99, 235, 0.3)`
- Entrance: Scale + fade 350ms cubic-bezier(0.34, 1.56, 0.64, 1)

**Prompt Header:**
- Icon: 🤔 (24px)
- Title: "Discussion Prompt" Inter Bold 16px, text-gray-100
- Margin-bottom: 16px

**Question Text:**
- Content: Inter Regular 14px, line-height 1.6, text-gray-200
- Margin-bottom: 16px
- Example: "Why is Jupiter so large compared to other planets?"

**Timer (if applicable):**
- Display: "Think time: 2:30" Inter SemiBold 12px, Supernova Gold
- Countdown: Reduces in real-time
- Warning: Color shifts to Red Giant at 30 seconds remaining
- Margin-bottom: 16px

**Response Area (if enabled):**
- Text input: 100% width, 80px height, border 1px `rgba(37, 99, 235, 0.4)`, border-radius 6px
- Placeholder: "Type your thoughts..." Inter Regular 12px, text-gray-600
- Character count: Right bottom, "0 / 200" Inter Regular 10px, text-gray-700

**Action Buttons:**
- Row: Flex space-between, margin-top 20px
- Close button: "Close prompt" Inter Medium 12px, transparent border
- Submit button: "Share response" Inter Medium 12px, Cosmic Blue background (if response entered)

**Student Response Summary (shown to teacher only):**
- Below prompt: "Responses: 9 of 12 submitted" Inter Regular 11px, text-gray-600
- Progress bar: 100% width, 3px, showing submission percentage
- "View responses" link: Cosmic Blue, on hover underline

### 3.8 Presentation Mode

**Activation:**
- Button in top toolbar: "🎬 Present" Inter Medium 12px
- Keyboard shortcut: P key
- Confirmation: "Enter presentation mode? (UI will hide)" OK/Cancel

**Presentation Mode Layout:**
- Hides all toolbars, sidebars, panels
- Full-screen canvas (minus any permanent HUD elements)
- Annotation tools remain accessible via toolbar that auto-hides
- Auto-hide toolbar: Appears on mouse movement at top, fades after 3s of inactivity

**Presentation Toolbar (Auto-hide):**
- Position: Top center
- Height: 40px
- Background: `rgba(15, 23, 42, 0.9)`, border-radius 8px
- Entrance: Slide-down + fade 300ms ease-out
- Exit: Slide-up + fade 500ms ease-out (after 3s inactivity)

Toolbar content (centered):
- Annotation tools: Pen, Arrow, Circle, Text, Eraser (same as Annotation Toolbar)
- Color picker: Right side
- Exit button: "Esc to exit" Inter Regular 10px, text-gray-600, right-most

**Screen Share Indicator:**
- Top-right corner: "📺 Sharing to 12 students" Inter SemiBold 11px
- Background: `rgba(239, 68, 68, 0.2)`, border 1px Red Giant
- Pulsing animation: Scale 1.0 → 1.05, 1.5s infinite

### 3.9 High-Contrast Projector Toggle

**Button:**
- Position: Top toolbar, right of presentation button
- Icon: Sun (20px) or Moon (20px)
- Text: "High Contrast" Inter Regular 11px (optional, tooltip on hover)
- Size: 44px × 44px circle
- Background: `rgba(15, 23, 42, 0.6)`, border 1px `rgba(245, 158, 11, 0.4)`
- Icon color: Supernova Gold #f59e0b

**High-Contrast Mode (Enabled):**
- Increases contrast across all UI elements
- All backgrounds → darker (opacity increases)
- All text → whiter (text-gray-100 → white)
- Border colors → more saturated
- Annotation tools → thicker strokes (3px vs 2px)
- Font weight increases: Regular → Medium, SemiBold → Bold
- Toggle state: Icon changes, border becomes Supernova Gold

### 3.10 Text Size Slider

**Position:**
- Settings panel, under "Accessibility" section
- Or: Top toolbar as collapsible menu

**Slider Component:**
- Label: "Text Size" Inter SemiBold 12px, text-gray-300
- Range: 100% to 200% (5% increments)
- Slider: 100% width, 6px height, thumb 14px, Cosmic Blue
- Value display: Right side, "120%" Inter Regular 11px
- Icons: Small (12px) text on left, large (18px) text on right

**On Change:**
- All UI text scales proportionally
- Responsive re-layout (panels expand if needed)
- Settings save to localStorage
- Notification: "Text size updated to 120%" toast, 2s auto-dismiss

### 3.11 Enhanced Time Controls

**Position:**
- Below canvas, full-width bar (same as Explorer Mode, see Section 2.13)
- Height: 48px (taller for educator presets)

**Additional Educator Features:**

**Preset Buttons (New):**
- Row of 5 buttons: "1 Hour Ago", "Today", "1 Day Forward", "1 Week Forward", "Now"
- Each button: 80px height, Inter Medium 11px, padding 6px 8px
- Background: Default `rgba(37, 99, 235, 0.1)`, active `rgba(37, 99, 235, 0.2)`
- Border: 1px (default `rgba(37, 99, 235, 0.3)`, active Cosmic Blue)
- Spacing: 8px between buttons
- On click: Jumps to preset time instantly, updates display

**Precise Time Scrubber:**
- Below preset buttons, 100% width
- Height: 20px
- Background: `rgba(37, 99, 235, 0.05)`, border 1px `rgba(37, 99, 235, 0.2)`
- Playhead: 8px circle, Cosmic Blue, draggable
- Ticks: Major ticks every 6 hours (1px tall), minor every hour (0.5px)
- On drag: Real-time time update, smooth animation (no lag)
- Tooltip: Shows date/time near cursor while dragging

**Sync Indicator:**
- "Syncing with students..." text appears if students' views lag behind
- Color: Supernova Gold if lag detected, Aurora Green if in sync
- Spacing: Right side of controls

---

## Section 4: Creator Mode — Alex Rivera, Content Creator (~400 lines)

### 4.1 Creator Mode: Persona Overview

**User Profile:**
- Name: Alex Rivera
- Age: 34
- Background: Filmmaker, animator, science communicator
- Usage Pattern: 2-4 hour sessions, 4-5 times per week
- Primary Goals: Create videos, capture high-quality content, publish
- Technical Comfort: Very high (understands codecs, resolution, frame rates)
- Device: MacBook Pro 16" (3456×2234), dual monitors (2560×1440 each)

**Motivations:**
- Professional video content
- Recording and exporting quality footage
- Embedding interactive content in blogs
- Citation and metadata accuracy

### 4.2 Creator Mode: Full Screen Layout ASCII Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [COSMOS] [Project: Exoplanet Discovery] [🔴 Recording] [📤 Export] [⚙️]          │  56px
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  [Left Panel]        ┌────────────────────────────────────────────────────────┐ │
│  Camera Paths  280px │   3D UNIVERSE VISUALIZATION                            │ │
│  ─────────────       │   (WebGL Rendering at 60fps)                           │ │
│  1. Overview         │                                                        │ │
│  2. Zoom to Earth    │   [Recording indicator: REC 00:12:34.15]              │ │
│  3. Exoplanet Orbit  │   [Red border around viewport]                        │ │
│  [+ Add waypoint]    │                                                        │ │
│                      └────────────────────────────────────────────────────────┘ │
│                                                                                  │
│  Keyframe Timeline (Full width, 64px height):                                  │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │ 0s  [●]───────●────────────●──────────────────────●──────────────(→) 120s│  │
│  │ ▶ ┌────────────────────────────────────────────────────────────────┐    │  │
│  │   │ Zoom to Earth: 0-15s | Orbit: 15-45s | Flyby: 45-120s         │    │  │
│  │   └────────────────────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  [Export Settings] [Recording Controls] [Session Info]  (Right panel)  320px   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Camera Path Editor (Left Panel)

**Dimensions & Position:**
- Position: Fixed, left side
- Width: 280px
- Height: calc(100vh - 56px)
- Top: 56px
- Background: `rgba(15, 23, 42, 0.9)`, border-right 1px `rgba(37, 99, 235, 0.2)`
- Padding: 20px 16px
- Scrollable content

**Header:**
- Title: "Camera Paths" Inter SemiBold 14px, text-gray-100
- Icon: 🎬 (16px), left-aligned
- Add button: "+ Add Path" Inter Regular 11px, Cosmic Blue, right-aligned
- On click: Creates new path, prompt for name

**Paths List:**
- Scrollable, max-height calc(100vh - 200px)
- Spacing: 8px between items

**Each Path Item (60px height):**
- Layout: Flex row, padding 12px, border-radius 6px, items-center
- Background: Default `rgba(37, 99, 235, 0.05)`, active `rgba(37, 99, 235, 0.15)`
- Border: 1px (default transparent, active Cosmic Blue)

Path Indicator (Left):
- Status icon: ● (8px diameter)
- Color: Cosmic Blue (active), text-gray-700 (inactive)
- Margin-right: 8px

Path Info (Center, flex 1):
- Name: Inter SemiBold 12px, text-gray-200
- Duration: Inter Regular 10px, text-gray-600, "15 seconds"
- Waypoints: Inter Regular 10px, text-gray-700, "4 waypoints"

Actions (Right):
- Delete button: × (16px), opacity 0 by default, on hover opacity 1, text-red-500
- Margin-left: 8px

**On Click Path Item:**
- Highlights path (background becomes active color)
- Loads waypoint list below
- Camera previews path (plays animation if in preview mode)

**Waypoint List (Dynamic, below selected path):**
- Subheading: "Waypoints" Inter SemiBold 11px, text-gray-400, margin-top 16px, margin-bottom 8px
- List: Scrollable, max-height 200px
- Spacing: 4px between waypoints

**Each Waypoint Item (48px height):**
- Layout: Flex row, padding 8px 12px, border-radius 4px
- Background: Default transparent, hover `rgba(37, 99, 235, 0.1)`
- Border: 1px (default `rgba(37, 99, 235, 0.2)`, active Cosmic Blue)

Waypoint Number (Left):
- Circle: 20px diameter, background Nebula Purple
- Text: Inter SemiBold 10px, white, centered, "1", "2", etc.

Waypoint Details (Center, flex 1):
- Margin-left: 8px
- Time: Inter SemiBold 10px, text-gray-200, "0.0s"
- Position: Inter Regular 9px, text-gray-600, "X: -1.5, Y: 0.2, Z: 3.1"

Edit Button (Right):
- Icon: ✎ (14px), opacity 0 by default, on hover opacity 1
- On click: Opens waypoint editor modal (see Section 4.4)

**Waypoint Editor Modal:**
- Position: Center overlay
- Width: 500px
- Title: "Edit Waypoint 1" Inter Bold 14px
- Fields:
  - Time (seconds): Input field, 0-300, step 0.1
  - Position (X, Y, Z): 3 input fields, float values
  - Rotation (Pitch, Yaw, Roll): 3 sliders, degrees
  - Field of View (FOV): Slider, 10-120 degrees
  - Easing: Dropdown "Linear", "Ease-in", "Ease-out", "Ease-in-out"
- Buttons: "Save" (Cosmic Blue), "Delete" (Red Giant), "Cancel" (transparent)

**Add Waypoint Button (Bottom of panel):**
- Button: "[+] Add Waypoint" Inter Regular 11px, full width
- Height: 40px
- Background: `rgba(37, 99, 235, 0.1)`, border 1px dashed `rgba(37, 99, 235, 0.4)`
- On hover: Border solid, background opacity 0.2
- On click: Adds waypoint at current camera position, opens editor
- Margin-top: 12px

### 4.4 Keyframe Timeline (Bottom Bar)

**Dimensions & Position:**
- Position: Fixed, bottom of screen
- Width: 100%
- Height: 120px
- Top: calc(100vh - 120px)
- Background: `rgba(15, 23, 42, 0.95)`, border-top 2px Cosmic Blue #2563eb
- Z-index: 40

**Timeline Structure:**

**Ruler (Top, 24px height):**
- Background: `rgba(15, 23, 42, 0.8)`
- Time labels: 0s, 10s, 20s, 30s, etc. (major ticks every 10s)
- Label font: JetBrains Mono Regular 9px, text-gray-600
- Tick marks: Major (6px tall, 1px wide), minor (3px tall)
- All text-gray-700
- Horizontal scrolling: Timeline scrolls with content below

**Track Area (Below ruler, 60px height):**
- Background: `rgba(15, 23, 42, 0.6)`
- Padding: 8px 0
- Scrollable horizontally (synchronized with ruler)

**Camera Path Track:**
- Height: 44px
- Background: `rgba(37, 99, 235, 0.1)`, border 1px `rgba(37, 99, 235, 0.3)`, border-radius 4px
- Margin: 0 8px 8px 8px
- Waypoint markers: Circles (8px diameter), Cosmic Blue
- Position: Horizontally scaled by time
- On hover: Circle grows to 10px, shadow appears
- On click: Selects waypoint, opens editor
- Path curve: Thin line connecting waypoints, Cosmic Blue, 2px width
- Easing visualization: Curve between waypoints shows easing function

**Playhead:**
- Vertical line: 2px width, Supernova Gold #f59e0b
- Height: Full track height
- Top cap: Triangle (8px wide, 6px tall), Supernova Gold, pointing down
- Draggable: Can click-drag to scrub timeline
- Current time display: Follows playhead as tooltip, "12.5s"
- Position: Updates real-time during playback

**Zoom Controls (Right side of ruler, 60px):**
- Buttons: 🔍- (zoom out), 🔍+ (zoom in)
- Each button: 24px × 24px, text-gray-600, on hover text-gray-200
- Spacing: 4px between buttons
- Zoom range: 0.1x to 10x (100% = 1 second per 100px)
- Keyboard shortcuts: Ctrl+Scroll to zoom, Shift+Drag to pan

**Timeline Cursor Display:**
- Position: Below scrubber, center-left
- Format: "00:12:34.15" JetBrains Mono Regular 11px, text-gray-300
- Updates in real-time during playback/scrubbing

### 4.5 Recording Overlay & Controls

**Recording Indicator (Top-left of canvas, when recording):**
- Position: Fixed, top-left, 20px from edges
- Layout: Flex row, items-center
- Height: 44px
- Background: `rgba(239, 68, 68, 0.95)`, border 3px solid Red Giant #ef4444
- Border-radius: 4px
- Padding: 8px 12px
- Shadow: `0 4px 16px rgba(239, 68, 68, 0.5)`
- Z-index: 100

Blinking Record Icon:
- Circle: 8px diameter, Red Giant
- Animation: Scale 1.0 → 1.2, 1s infinite (pulsing)

Text Content:
- Label: "REC" Inter SemiBold 11px, text-gray-100, margin-left 8px
- Time code: "00:12:34.15" JetBrains Mono Bold 12px, text-gray-100, margin-left 8px

**Recording Start/Stop Button (Top toolbar):**
- Position: Top toolbar, right of project title
- Size: 44px × 44px circle
- Icon: Red circle (16px), filled when recording
- Background: `rgba(239, 68, 68, 0.2)`, border 2px Red Giant
- Icon color: Red Giant
- Pulsing animation when recording: Opacity 0.8 → 1.0, 1s infinite
- Text label: "Record" or "Stop" (tooltips)
- On click: Toggles recording state

**Pause/Resume Button (In recording overlay):**
- Only visible while recording
- Icon: Pause (16px) or Play (16px)
- Size: 32px × 32px circle
- Background: `rgba(15, 23, 42, 0.8)`, border 1px `rgba(239, 68, 68, 0.5)`
- On hover: Border Red Giant, scale 1.05
- Margin-left: 12px

**Recording Status Toast:**
- Appears when recording starts
- Content: "Recording started, 60fps" Inter Regular 12px, Cosmic Blue, checkmark icon
- Position: Bottom-right, auto-dismiss after 2s
- Another toast appears on stop: "Recording saved" with file size

### 4.6 Export Panel (Right Sidebar)

**Dimensions & Position:**
- Position: Fixed, right side (hidden by default, toggle via button)
- Width: 320px
- Height: 100vh
- Top: 0
- Background: `rgba(15, 23, 42, 0.9)`, border-left 1px `rgba(37, 99, 235, 0.2)`
- Padding: 20px 16px
- Scrollable content
- Entrance: Slide-in from right 300ms ease-out
- Exit: Slide-out to right 200ms ease-in

**Export Button (Top toolbar):**
- Position: Top toolbar, right of recording button
- Icon: Upload (20px), Solar Orange #f97316
- Text: "Export" Inter Medium 12px
- Size: 44px × 44px circle (if icon only) or 44px height + text
- Background: `rgba(247, 144, 22, 0.1)`, border 1px `rgba(247, 144, 22, 0.4)`
- On click: Toggles export panel

**Panel Header:**
- Title: "Export Settings" Inter SemiBold 14px, text-gray-100
- Close button: Top-right, X (16px)
- Border-bottom: 1px `rgba(37, 99, 235, 0.2)`
- Padding-bottom: 16px

**Video Export Section:**

**Format Dropdown:**
- Label: "Format" Inter SemiBold 11px, text-gray-400
- Options: "MP4 (H.264)", "WebM (VP9)", "QuickTime (ProRes)", "PNG Sequence"
- Height: 40px, width 100%, margin-bottom 12px
- Selected value displayed as button text

**Resolution Dropdown:**
- Label: "Resolution" Inter SemiBold 11px
- Options: "1080p (1920×1080)", "1440p (2560×1440)", "2160p (4K)", "3840p (8K)"
- Height: 40px, width 100%, margin-bottom 12px
- Recommended badge: "1440p (Recommended)" in smaller text

**Frame Rate Dropdown:**
- Label: "Frame Rate" Inter SemiBold 11px
- Options: "24 fps", "30 fps", "60 fps" (selected), "120 fps"
- Height: 40px, width 100%, margin-bottom 12px

**Bitrate Slider:**
- Label: "Quality/Bitrate" Inter SemiBold 11px
- Slider: 100% width, 6px height, thumb 12px
- Range: 10-300 Mbps
- Value display: Right side, "100 Mbps" Inter Regular 10px
- On change: Updates estimated file size in real-time

**Codec Options (Advanced):**
- Toggle: "Advanced Options" Inter Regular 11px, text-gray-600
- On toggle: Expands section below
- Options appear: "Hardware Acceleration", "Custom Bitrate", "Audio Encoding"
- Checkboxes for each option

**Estimated File Size:**
- Label: "Estimated Size" Inter SemiBold 11px, text-gray-400, margin-top 16px
- Display: "1.2 GB" Inter Bold 13px, text-gray-200
- Updates in real-time as settings change
- Time estimate: "Duration: 2 min 30 sec" Inter Regular 10px, text-gray-600

**Export Button:**
- Position: Bottom of panel (sticky)
- Button: "📤 Export Video" Inter Medium 13px, full width
- Height: 44px
- Background: Solar Orange #f97316
- Border: None
- On hover: Opacity 0.9, scale 1.02
- On click: Opens export progress dialog

**Export Progress Dialog:**
- Position: Center overlay (modal)
- Width: 500px
- Title: "Exporting..." Inter Bold 14px
- Progress bar: 100% width, 8px height, background `rgba(247, 144, 22, 0.2)`, fill Solar Orange
- Current phase text: "Rendering frame 1250 of 7500" Inter Regular 11px, text-gray-600
- Time elapsed / Estimated remaining: "02:34 elapsed | ~08:45 remaining" Inter Regular 10px
- Cancel button: Bottom, "Cancel export" Inter Medium 11px
- Pause button: Bottom, "Pause" Inter Medium 11px (can resume later)

**Export Complete Dialog:**
- Replaces progress dialog
- Checkmark icon: 48px, Aurora Green
- Message: "Export complete!" Inter Bold 16px
- File info: "Filename: cosmos-exoplanet.mp4 | 1.2 GB" Inter Regular 12px
- Buttons: "Open folder" (opens file location), "Share" (opens share menu), "Done"

### 4.7 Hide UI Toggle Button

**Position:**
- Top toolbar, between export button and settings gear
- Or: Keyboard shortcut H

**Button:**
- Size: 44px × 44px circle
- Icon: Eye or Eye-slash (20px), Nebula Purple
- Background: `rgba(139, 92, 246, 0.1)`, border 1px `rgba(139, 92, 246, 0.3)`
- On hover: Border Nebula Purple, shadow expand
- Tooltip: "Hide UI (H key)"

**On Click:**
- All UI elements fade out (200ms opacity transition)
- Canvas expands to full screen
- Toolbar reappears on mouse movement at top (auto-hide after 3s inactivity)
- Click button again to restore UI

### 4.8 Batch Screenshot Capture

**Access:**
- Menu in export panel or right-click context menu
- Or: Keyboard shortcut Ctrl+Shift+B

**Batch Screenshot Dialog:**
- Position: Center modal
- Width: 500px
- Title: "Batch Screenshot Capture" Inter Bold 14px

**Options:**
- Radio: "Current frame only" (selected by default)
- Radio: "All keyframes" → capture at every waypoint
- Radio: "Custom interval" → input field "Every N seconds"
- Radio: "Custom frame numbers" → textarea for comma-separated frame numbers

**Capture Settings:**
- Format: Dropdown "PNG", "JPEG", "WebP"
- Resolution: Same as video export (1080p, 1440p, 2160p, 4K)
- Include UI: Checkbox "Include UI elements"
- Color profile: Dropdown "sRGB" (default), "Adobe RGB", "Linear"

**Naming Pattern:**
- Input field: "cosmos-{index:04d}.png" (with variable help)
- Variables: {name}, {index}, {time}, {date}

**Buttons:**
- "Capture" (Solar Orange) → starts batch capture
- "Cancel"

**Batch Capture Progress:**
- Dialog shows real-time progress: "Captured 45 of 150 images"
- Progress bar: 30% full
- Current file: "cosmos-0045.png" in smaller text
- Cancel button available during capture
- ETA: "~2 minutes remaining"

**Batch Capture Complete:**
- Directory browser: Opens folder containing images
- Message: "150 images captured successfully"
- Button: "Open folder", "View images", "Done"

### 4.9 Embed Code Generator

**Access:**
- Top toolbar button: "Embed" Inter Medium 12px, or in export panel
- Icon: Code bracket (16px)

**Embed Generator Modal:**
- Position: Center, width 600px
- Title: "Generate Embed Code" Inter Bold 14px

**Embed Preview (Left side, 300px wide):**
- Mockup iframe: 280px × 210px
- Preview of embedded player
- Shows current camera path/animation
- Annotation: "Preview (renders at embed resolution)"

**Embed Settings (Right side, 280px wide):**

**Embed Type:**
- Radio: "Interactive player" (default)
- Radio: "Static image" → captures single frame
- Radio: "GIF loop" → generates animated GIF

**Dimensions:**
- Width input: 400px (numeric, pixels)
- Height input: 300px
- Aspect ratio lock: Toggle 🔒
- Presets: "Small (400×300)", "Medium (640×480)", "Large (1280×720)", "Full width"

**Interactive Options (if player selected):**
- Checkbox: "Allow user rotation"
- Checkbox: "Show controls"
- Checkbox: "Auto-play"
- Checkbox: "Loop animation"
- Checkbox: "Show annotation"

**Color Theme:**
- Radio: "Dark" (default)
- Radio: "Light"
- Radio: "Custom" → opens color picker

**Code Output:**
- Title: "Embed Code" Inter SemiBold 11px, margin-top 16px
- Code block: Monospace font, `<iframe src="..." width="400" height="300"></iframe>`
- Height: 60px, scrollable, selectable text
- Copy button: "📋 Copy code" right side
- On click: Copies to clipboard, button text changes to "✓ Copied" for 1s

**Buttons:**
- "Generate & Copy" (Cosmic Blue) → copies embed code
- "Download HTML" → downloads .html file with full page template
- "Cancel"

### 4.10 Citation Generator

**Access:**
- Right-click on 3D object → "Citation" or toolbar menu

**Citation Modal:**
- Position: Center, width 500px
- Title: "Generate Citation" Inter Bold 14px

**Object Info (Top section):**
- Object name: Inter Bold 13px, text-gray-200
- Type: Inter Regular 11px, text-gray-600
- Thumbnail: 100px × 100px left side

**Format Selection:**
- Label: "Citation Format" Inter SemiBold 11px
- Radio options: "APA", "MLA", "Chicago", "Harvard", "BibTeX"
- Default: APA

**Citation Preview (main area):**
- Background: `rgba(37, 99, 235, 0.05)`, padding 12px, border 1px `rgba(37, 99, 235, 0.3)`
- Content: Generated citation text (Inter Regular 11px, text-gray-300)
- Example: "Chen, A. & Rivera, A. (2026). Jupiter. Cosmos Explorer. https://cosmos.example.com/objects/jupiter"

**Custom Fields:**
- Access date: Input field, pre-filled with today's date
- Version: Input field, shows current app version
- URL: Shows the shareable object link

**Buttons:**
- "📋 Copy Citation" (Cosmic Blue) → copies to clipboard
- "Download BibTeX" → downloads .bib file
- "Cancel"

---

## Section 5: Casual Mode — Jennifer Thompson, iPad User (~400 lines)

### 5.1 Casual Mode: Persona Overview

**User Profile:**
- Name: Jennifer Thompson
- Age: 31
- Background: Marketing manager, space enthusiast
- Usage Pattern: 15-30 min sessions, 2-3 times per week
- Primary Goals: Relax, discover interesting facts, share with friends
- Technical Comfort: Medium (comfortable with apps, but not power user)
- Device: iPad Pro 12.9" (landscape primary), iPhone 13 Pro (occasional)

**Motivations:**
- Relaxation and wonder
- Quick discoveries and "did you know" facts
- Social sharing
- Beautiful visuals
- Guided experiences

### 5.2 Casual Mode: iPad Layout ASCII Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [COSMOS] [🔍 Search] [☆ Saved] [👤 Profile] [⚙️]                      (iPad) │ 56px
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                        │ │
│  │            FEATURED HIGHLIGHTS CAROUSEL (Swipe)                       │ │
│  │                                                                        │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐ │ │
│  │  │  [Image: Aurora Borealis]                                        │ │ │
│  │  │  Aurora Borealis: Earth's Light Show                            │ │ │
│  │  │  "Witness the magnificent dance of charged particles..."        │ │ │
│  │  │  ← [Tap to explore] [Share] →                                   │ │ │
│  │  │  [● ○ ○ ○ ○]  (Progress dots)                                  │ │ │
│  │  └──────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                        │ │
│  │  [Play] [Pause] [Skip]  Narration: "Let's explore the Aurora..."    │ │
│  │                         [━━━━━━━━ 0:45 / 2:30]                       │ │
│  │                                                                        │ │
│  │  3D CANVAS (Full width below carousel)                               │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐ │ │
│  │  │                                                                  │ │ │
│  │  │           [Aurora shimmering in 3D view]                        │ │ │
│  │  │                                                                  │ │ │
│  │  └──────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                        │ │
│  │  Object Info Card (Below canvas):                                    │ │
│  │  ┌──────────────────────────────────────────────────────────────────┐ │ │
│  │  │ Aurora Borealis                                                 │ │ │
│  │  │ Did you know? The Aurora is caused by solar wind...            │ │ │
│  │  │ [Learn more] [Map view] [Similar objects →]                    │ │ │
│  │  └──────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                        │ │
│  │  "More Like This" Carousel:                                          │ │
│  │  ┌────┐ ┌────┐ ┌────┐                                               │ │
│  │  │ 🌌 │ │ 🪐 │ │ ⭐ │ (Swipe to see more)                          │ │
│  │  │Dusk│ │Mars│ │Sirius                                              │ │
│  │  └────┘ └────┘ └────┘                                               │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  [☆ Save] [Share] [Relax]  (Bottom action buttons)                         │ 44px
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Tap Target Sizing

**Apple Human Interface Guidelines Compliance:**
- Minimum tap target: 44px × 44px
- Preferred spacing: 44-48px between targets
- Touch-friendly padding: 12px minimum around interactive elements

**Button Sizing Across UI:**
- Large buttons (primary actions): 48px × 48px circles or 44px height buttons
- Standard buttons: 44px × 44px
- Small buttons (secondary): 36px × 36px minimum
- Icon sizes: 20px-24px for primary icons, 16px for secondary
- Text sizing: Minimum 14px for body text, 12px for secondary text

### 5.4 Featured Highlights Carousel

**Carousel Container:**
- Position: Top of canvas area (below toolbar)
- Width: 100% of screen
- Height: 280px on iPad portrait, 320px landscape
- Background: Gradient overlay (top-left Cosmic Blue, bottom-right Nebula Purple)
- Border-radius: 12px
- Margin: 16px
- Shadow: `0 8px 24px rgba(37, 99, 235, 0.3)`

**Carousel Card Content:**
- Background image: Full-screen high-quality space photo
- Dark overlay: `rgba(10, 10, 26, 0.4)` on bottom half for text readability
- Padding: 20px

**Text Content (Bottom of card):**
- Title: Inter Bold 20px, text-gray-100, margin-bottom 8px
- Description: Inter Regular 14px, text-gray-300, line-height 1.5, max 3 lines, truncate
- Example: "Aurora Borealis: Earth's Light Show" → "Witness the magnificent dance of charged particles as they paint the sky..."

**Navigation:**
- Previous/Next arrows: 44px × 44px circles, left/right edges of carousel
- Arrow icon: 20px, Supernova Gold, on hover scale 1.1
- Swipe gesture: On iPad, swipe left/right to advance
- Progress dots: Below card, centered
  - Dots: 8px diameter each, spacing 8px
  - Current dot: Supernova Gold, others text-gray-600
  - Number of dots: Max 5 (scroll if more available)

**Interaction:**
- Auto-advance: Every 5 seconds (unless paused)
- On tap (anywhere on card): Expands to full-screen guided tour
- On drag (swipe): Immediately jumps to next/previous card

### 5.5 Guided Tour Controls

**Overlay Control Panel (Bottom, 64px):**
- Background: `rgba(15, 23, 42, 0.95)`, border-top 1px `rgba(37, 99, 235, 0.2)`
- Padding: 12px 16px

**Controls (Flex row, centered):**
- Play button: 44px × 44px circle, icon play (20px), Supernova Gold
- Pause button: 44px × 44px circle, icon pause (20px), shown when playing (replaces play)
- Skip button: "→ Next" Inter Medium 12px, 44px height, padding 12px 16px
- Progress bar: Full width (flex 1), below buttons
  - Format: "2:30 / 5:00" JetBrains Mono 11px, time display
  - Scrubber: Full-width bar, 4px height, blue fill showing progress
  - Draggable playhead

**Narration Text:**
- Position: Bottom-right of controls
- Text: "Let's explore the Aurora..." Inter Regular 12px, text-gray-400
- Updates with each new step/segment
- Font size scales down on small screens (minimum 11px)

**Tour Progress Indicator:**
- Position: Top-left of 3D canvas
- Format: "Step 2 of 5" Inter SemiBold 11px, text-gray-300
- Background: Subtle translucent pill
- Updates as tour progresses

### 5.6 Simplified Object Info Card

**Card Positioning:**
- Position: Below 3D canvas area
- Width: 100% - 32px (16px margins on each side)
- Height: Auto, min 120px
- Background: `rgba(15, 23, 42, 0.8)`, border 1px `rgba(139, 92, 246, 0.3)`, border-radius 12px
- Padding: 16px
- Margin: 16px

**Content Layout (Flex column):**

**Header (Flex row, items-center):**
- Icon/badge: 32px × 32px, emoji or icon
- Title: Inter SemiBold 16px, text-gray-100, margin-left 12px

**Body Text:**
- "Did you know?" section: "Did you know?" Inter SemiBold 12px, text-gray-400, margin-top 12px
- Fact text: Inter Regular 13px, text-gray-300, line-height 1.6, margin-top 4px
- Example: "The Aurora is caused by charged particles from the sun colliding with Earth's atmosphere, creating the green glow."
- Fact auto-rotates every 5 seconds (fade out, switch, fade in)

**Action Buttons (Flex row, space-between, margin-top 16px):**
- Button 1: "[🔍 Learn More]" Inter Medium 12px, 44px height
  - Background: `rgba(37, 99, 235, 0.1)`, border 1px `rgba(37, 99, 235, 0.3)`
  - On hover: Border Cosmic Blue, opacity 0.2
  - On click: Opens expanded info panel

- Button 2: "[🗺️ Map View]" Inter Medium 12px, 44px height
  - For Earth-based phenomena only
  - Shows location map
  - On click: Switches to map view overlay

- Button 3: "[Similar →]" Inter Medium 12px, 44px height, text-right
  - On click: Scrolls to "More Like This" section

### 5.7 Social Share Overlay (Instagram-Optimized)

**Access:**
- Share button in toolbar or card action buttons
- Icon: Share (20px), Supernova Gold

**Share Modal:**
- Position: Center of screen or bottom sheet (iPad portrait → bottom sheet, landscape → center modal)
- Width: 90vw (portrait), 500px (landscape)
- Height: Auto
- Background: `rgba(15, 23, 42, 0.98)`, border 1px `rgba(245, 158, 11, 0.3)`
- Border-radius: 12px (portrait bottom sheet: top radius only)

**Share Preview Section:**
- Screenshot preview: 280px × 400px (Instagram story aspect ratio) or 1080px × 1080px (Instagram feed)
- Shows current 3D view with text overlay
- Background: Gradient or current canvas capture
- Text overlay: Object name + fact

**Caption Editor:**
- Textarea: 100% width, 80px height, auto-expand
- Placeholder: "Add a caption..." Inter Regular 12px, text-gray-600
- Character count: Right bottom, "0 / 280" Inter Regular 10px
- Hashtag suggestions: Below textarea, "#space #astronomy #cosmos" (clickable)
- Example hashtags auto-populate based on object

**Sharing Options (Below caption):**
- Tabs or buttons: "Instagram", "Facebook", "Twitter", "Copy & Share"
- Button styling: Each platform color, 44px height
- Icons: Platform logos (16px)

**Instagram Specific:**
- Story format: 1080px × 1920px, preview shows vertical orientation
- Feed format: 1080px × 1080px, square preview
- Carousel option: Allow sharing multiple facts
- Sticker suggestions: Show relevant space/science stickers

**Share Button (Bottom):**
- Button: "[📤 Share to Instagram]" Inter Medium 13px
- Height: 48px, full width
- Background: Supernova Gold
- On click: Opens Instagram share intent
- Success message: "Image copied to clipboard. Open Instagram to paste." (if direct share not available)

### 5.8 "More Like This" Recommendation Cards

**Carousel Container:**
- Position: Below object info card
- Width: 100% - 32px (16px margins)
- Height: 200px
- Title above: "More Like This" Inter Bold 14px, text-gray-100, margin-bottom 12px
- Subtext: "Explore similar objects" Inter Regular 11px, text-gray-600

**Card Carousel:**
- Horizontal scrolling (swipe to see more)
- Visible cards: 2.5 on iPad portrait, 3.5 on landscape
- Spacing: 12px between cards

**Each Card (150px width, 180px height):**
- Background: Gradient (top-left Cosmic Blue, bottom-right Nebula Purple), 150px × 180px
- Border-radius: 12px
- Padding: 12px
- Shadow: `0 4px 12px rgba(37, 99, 235, 0.3)`

**Card Content:**
- Icon/emoji: 32px, top-left (🌌 galaxy, 🪐 planet, ⭐ star, etc.)
- Image placeholder: Gradient fill, 126px × 80px
- Title: Inter SemiBold 12px, text-gray-100, bottom, margin-top auto
- Subtext: Inter Regular 10px, text-gray-500, "Similar: Galaxy"

**Card Interaction:**
- On tap: Navigates to object (cross-fade to new 3D view)
- On long-press: Shows preview tooltip with quick facts
- On swipe: Carousel scrolls to next card

### 5.9 Relaxation Mode

**Access:**
- Button in bottom toolbar: "🧘 Relax" Inter Medium 12px, 44px height
- Or: Settings toggle

**Relaxation Mode Behavior:**

**UI Minimization:**
- Top toolbar: Fades to semi-transparent (opacity 0.4), only visible on tap
- Bottom controls: Hidden (tap canvas to show)
- Side panels: Hidden
- Info cards: Hidden (swiped down off-screen)
- Only 3D canvas visible

**Audio Background:**
- Ambient music: Soft instrumental space sounds
- Volume: Starts at 20%, adjustable via swipe gesture
- Options: "Aurora", "Nebula Drift", "Cosmic Wind", "Stellar Silence" (no music)

**Auto-Explore:**
- Camera slowly pans/rotates around scene
- Smooth orbiting motion, ~1 complete orbit per 60 seconds
- Occasionally zooms in/out to show different scales
- No jarring movements, very relaxing

**Time Controls:**
- Auto-set to sunset/night mode (optimal for relaxation)
- Slow time progression (if enabled): 1x simulated time = 4x real time
- Optional: "Pause time" for completely static scene

**Visual Enhancements (Optional):**
- Bloom effect: Subtle glow on stars/objects
- Motion blur: Very light (10% opacity)
- Reduced particle density: For less visual noise
- Warm color temperature: Slightly orange-shifted lighting

**Exit Relaxation:**
- Tap anywhere on canvas to resume normal controls
- Button in toolbar to toggle off
- Auto-exit after 30 min of inactivity

### 5.10 Session Summary Screen

**Trigger:**
- Shown on app exit or manually triggered
- Or: After guided tour completion (optional)

**Summary Layout:**
- Position: Full-screen modal overlay
- Width: 100% (sheets on iPad portrait)
- Height: 100%
- Background: Gradient (Cosmic Blue → Nebula Purple)
- Entrance: Slide-up + fade 400ms ease-out

**Content Structure:**

**Header Section:**
- Title: "Today's Discoveries" Inter Bold 24px, text-gray-100, centered, margin-top 40px
- Subtext: "3 objects explored" Inter Regular 14px, text-gray-500

**Discoveries List:**
- Scrollable area, max-height 300px
- Items display objects explored today
- Each item (flex row, 60px height, padding 12px, margin 8px):
  - Icon: 40px × 40px left, emoji or object icon
  - Name: Inter SemiBold 13px, text-gray-200
  - Time viewed: Inter Regular 11px, text-gray-600, "5 min"
  - On tap: Shows preview, option to "Explore again"

**Stats Section:**
- Layout: 3-column grid, centered
- Stat 1: "3" Inter Bold 18px, text-gray-100 / "Objects" Inter Regular 11px, text-gray-600
- Stat 2: "14" / "Minutes Explored"
- Stat 3: "2" / "Shares"

**Recommended Next Steps:**
- "Continue exploring?" text Inter Regular 13px
- Buttons: "Close" and "Keep Exploring" (48px height, full-width)
- Or: Show 1 featured highlight card for next session

**On Swipe Down:**
- Closes session summary, returns to last object view

---

## Section 6: Observer Mode — Bob Patterson, Amateur Astronomer (~400 lines)

### 6.1 Observer Mode: Persona Overview

**User Profile:**
- Name: Bob Patterson
- Age: 58
- Background: Amateur astronomer, 30 years hobby experience
- Usage Pattern: 1-2 hour sessions, 4-5 times per week (night observing sessions)
- Primary Goals: Identify objects, plan observations, track sky conditions
- Technical Comfort: Very high (comfortable with specialized instruments)
- Device: Laptop (1920×1080) on telescope mount, iPad for field notes

**Motivations:**
- Accurate object identification
- Observation planning and logging
- Sky condition assessment
- Precise measurements

### 6.2 Observer Mode: Full Screen Layout ASCII Wireframe

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ [COSMOS] [Search: Messier...▼] [Measurement Tools ▼] [Export CSV] [⚙️]        │  56px
├────────────────┬───────────────────────────────────────────────────────────┬──┤
│  Catalog &     │                                                           │My│
│  Search Tabs   │     3D UNIVERSE VISUALIZATION                             │Me│
│  ─────────     │     (Interactive Sky Map)                                 │as│
│  [Messier  ▼]  │                                                           │ure│
│  [NGC     ▼]   │  [🧭 N]  [Horizon overlay visible]                      │me│
│  [IC      ▼]   │                                                           │nts│
│  [Named ▼]     │  Object: Andromeda (M31)                                  │   │
│  [All    ▼]    │  Alt: 45°  Az: 315°  ⊙ [Measurement circle]             │   │
│                │  Mag: 3.4  Size: 3°×1°                                   │   │
│  Type: ○ Galaxy│                                                           │   │
│        ○ Star  │                                                           │   │
│        ○ Nebula│  [Observ. Log: Excellent seeing, 8mm eyepiece]          │   │
│                │                                                           │   │
│  Tonight's Sky:│                                                           │   │
│  ┌────────────┐│  ┌────────────────────────────────────────────────────┐  │   │
│  │ Messier 31 ││  │ Extended Object Info                              │  │   │
│  │ Alt: 45° ✓ ││  │ ─────────────────────────                         │  │   │
│  │ Transit: +5m││  │ RA: 00h42m44s ± 0.5s                            │  │   │
│  │ Set: 23:15 ││  │ Dec: +41°16' ± 30"                              │  │   │
│  └────────────┘│  │ Magnitude: 3.44 ± 0.01                           │  │   │
│                │  │ Angular Size: 3.2° × 1.1°                        │  │   │
│  [+ Log Entry] │  │ Distance: 2.54 Mly ± 0.15                        │  │   │
│                │  │ Catalog IDs: M31, NGC 224                         │  │   │
│                │  │                                                     │  │   │
│  [📍 Set Location]│ [○ Measure to object] [◆ Log observation]         │  │   │
│  [🕐 Set Time]   │ [↗ Elevation profile] [⊙ FOV circles]             │  │   │
│  [✓ Location OK] │                                                     │  │   │
│                │  └────────────────────────────────────────────────────┘  │   │
│                │                                                           │   │
│                │  Constellation overlay | Horizon | Cardinal directions   │   │
└────────────────┴───────────────────────────────────────────────────────┴──┘
```

### 6.3 Catalog Search Component

**Catalog Specification:** The catalog browse and search interfaces support all 96 entity types from Doc 22 v4.2, organized into 8 category tabs. Entity detail panels adapt per category — see DFS v2.0 Addendum DFS-A1.

**Search Bar:**
- Position: Top toolbar
- Width: 400px
- Height: 40px
- Background: `rgba(15, 23, 42, 0.6)`, border 1px `rgba(37, 99, 235, 0.4)`
- Placeholder: "Search (M31, NGC 224, Betelgeuse...)" Inter Regular 12px
- Icon: Magnifying glass (16px), left side
- Focus state: Border Cosmic Blue, shadow `0 0 16px rgba(37, 99, 235, 0.4)`

**Catalog Tabs (Below search):**
- Tabs: "Messier", "NGC", "IC", "Named Stars", "All"
- Each tab: 80px width, 36px height, Inter Regular 11px
- Active tab: Border-bottom 2px Cosmic Blue, background `rgba(37, 99, 235, 0.1)`
- Spacing: 0px (tabs are flush against each other)
- On tab click: Filters results to that catalog, search input remains active

**Search Results Dropdown:**
- Position: Below search bar
- Width: 400px
- Max height: 300px, scrollable
- Background: `rgba(15, 23, 42, 0.95)`, border 1px `rgba(37, 99, 235, 0.3)`, border-top none
- Margin-top: 4px

**Result Items:**
- Height: 44px each
- Padding: 12px 16px
- Layout: Icon (16px) + Name (180px) + Type (80px) + Magnitude (80px)
- Flex row, space-between
- Text: Inter Regular 12px, text-gray-300
- Magnitude: JetBrains Mono 11px, text-gray-600, right-aligned
- Background on hover: `rgba(37, 99, 235, 0.1)`, cursor pointer
- On click: Selects object, camera jumps to object, panel updates

### 6.4 Observation Planner Table

**Position & Sizing:**
- Below catalog search
- Width: 260px
- Height: max-height 200px, scrollable
- Border: 1px `rgba(37, 99, 235, 0.2)`, border-radius 4px
- Padding: 0

**Header Row (36px):**
- Columns: "Object" (120px) | "Alt/Az" (80px) | "Transit" (60px)
- Background: `rgba(37, 99, 235, 0.1)`, border-bottom 1px `rgba(37, 99, 235, 0.2)`
- Text: Inter SemiBold 10px, text-gray-500, padding 8px 12px

**Data Rows (38px each):**
- Layout: Flex, items-center
- Column 1 (Object): Name (Messier name preferred), Inter Regular 11px, text-gray-200
- Column 2 (Alt/Az): "45° / 315°" JetBrains Mono 10px, text-gray-600
- Column 3 (Transit): "+5m" or "Now" or "-2h" (time to transit), Inter Regular 10px, text-gray-600 (or Aurora Green if "Now")
- Background: Default transparent, hover `rgba(37, 99, 235, 0.05)`
- Right edge: Small checkbox (optional) for "observed" marking

**On Row Click:**
- Selects object in 3D view
- Highlights row with Cosmic Blue border
- Updates object info panel on right
- Emits toast "M31: Tonight at 23:15 UTC" (low-key notification)

**Tonight's Sky Header:**
- Above table, Inter SemiBold 11px, text-gray-400, "Tonight's Sky"
- Subtext: "Location: 40.0°N, 75.2°W | Time: 22:30 UTC" Inter Regular 10px, text-gray-600

### 6.5 Extended Object Info Panel (Right Sidebar)

**Dimensions & Position:**
- Position: Right side, persistent
- Width: 300px
- Height: 100vh
- Top: 0
- Background: `rgba(15, 23, 42, 0.9)`, border-left 1px `rgba(37, 99, 235, 0.2)`
- Padding: 20px 16px
- Scrollable content

**Object Header:**
- Icon: 24px (object type)
- Name: Inter SemiBold 16px, text-gray-100
- Type: Inter Regular 11px, text-gray-600, "Spiral Galaxy"
- Spacing: Below, line-height 1.4

**Core Properties Section:**

**Coordinates:**
- Label: "Coordinates" Inter SemiBold 11px, text-gray-400, margin-top 16px
- RA: "00h42m44.3s ± 0.5s" JetBrains Mono 10px, text-gray-300
- Dec: "+41°16'09" ± 30"" JetBrains Mono 10px, text-gray-300
- Format: Standard J2000.0
- Copy button: Small copy icon (12px), right side, on hover visible
- Tooltip on copy: "Coordinates copied to clipboard"

**Apparent Position (Alt/Az):**
- Label: "Apparent Position" Inter SemiBold 11px, text-gray-400, margin-top 12px
- Alt: "45.2° ± 0.5°" JetBrains Mono 10px
- Az: "315.1° ± 0.5°" JetBrains Mono 10px
- Note: "Updates with your location and time" Inter Regular 9px, text-gray-700

**Magnitude & Size:**
- Apparent magnitude: "3.44 ± 0.01 mag" Inter Regular 11px, text-gray-300
- Angular size: "3.2° × 1.1°" Inter Regular 11px, text-gray-300
- Actual distance: "2.54 ± 0.15 Mly" Inter Regular 11px, text-gray-300
- Surface brightness: "13.1 mag/arcmin²" Inter Regular 11px, text-gray-300
- All with margin-bottom 8px

**Catalog IDs:**
- Label: "Catalog IDs" Inter SemiBold 11px, text-gray-400, margin-top 12px
- List: "M31", "NGC 224", "Arp 31", "PGC 2557"
- Each ID: Button-like, 32px height, padding 4px 8px, background `rgba(37, 99, 235, 0.1)`, border 1px `rgba(37, 99, 235, 0.3)`
- On click: Searches for that ID, highlights result
- Spacing: 4px between IDs

**Rise, Transit, Set Times:**
- Label: "Tonight's Visibility" Inter SemiBold 11px, text-gray-400, margin-top 12px
- Rise: "19:45 ± 2m" Inter Regular 11px, text-gray-300
- Transit: "23:15 ± 2m" Inter Regular 11px, Aurora Green (if transit is tonight)
- Set: "02:45 ± 2m" Inter Regular 11px, text-gray-300
- Format: UTC, with precision indicator (±) for atmosphere/refraction
- Timing is live-updated based on current date/time

**Sky Conditions (if logged):**
- Label: "Recent Observations" Inter SemiBold 11px, text-gray-400, margin-top 12px
- Last observation date: "Oct 22, 2024" Inter Regular 11px, text-gray-300
- Seeing conditions: "Good seeing (Pickering 7)" Inter Regular 10px, text-gray-700
- Transparency: "Clear (Mag limit 5.5)" Inter Regular 10px, text-gray-700

### 6.6 Horizon Overlay Controls

**Toggle Button:**
- Position: 3D canvas HUD, bottom-right corner (or toolbar)
- Size: 44px × 44px circle
- Icon: Horizon line (20px), Aurora Green
- Background: `rgba(16, 185, 129, 0.1)`, border 1px `rgba(16, 185, 129, 0.3)`
- Label tooltip: "Show horizon overlay"

**Horizon Overlay (When Enabled):**
- Appearance: Semi-transparent dark band at horizon line
- Color: `rgba(16, 185, 129, 0.3)` below horizon, transparent above
- Smooth gradient: Fades at horizon boundary
- Rendered in 3D (horizon line respects observer location/altitude)

**Compass Rose (When Horizon Enabled):**
- Position: Center of horizon line, bottom-center of canvas
- Size: 120px × 120px
- Cardinal directions: N (top), E (right), S (bottom), W (left)
- Cardinal text: Inter Bold 12px, Aurora Green
- Intercardinal: NE, SE, SW, NW, Inter Regular 10px, text-gray-600
- Center dot: 8px, Aurora Green
- Rotating needle: Points to geographic North (not magnetic)
- All elements rotate as observer rotates view

**Sky Grid Toggle (Optional sub-control):**
- Checkbox: "Celestial grid" (RA/Dec lines)
- Adds thin lines every 15° in RA and Dec
- Color: `rgba(37, 99, 235, 0.2)`
- Labels: Every 30° (sparse to avoid clutter)

### 6.7 Telescope FOV Circle

**Draggable Circle Indicator:**
- Appearance: Thin circle (2px, Aurora Green) overlaid on 3D canvas
- Position: Center of canvas by default (observer's point of view)
- Draggable: Click-drag to move around sky
- Size: Resizable (details below)

**FOV Size Input:**
- Button/Input: In right sidebar or toolbar
- Label: "FOV Diameter" Inter SemiBold 11px
- Input: Numeric field, range 0.1° to 120°
- Unit indicator: "°" (degrees)
- Presets: Button row "1°", "0.5°", "0.25°", "Custom"
- Typical values:
  - Naked eye: ~45°
  - Binoculars: ~5-10°
  - Telescope wide field: ~1-2°
  - Telescope narrow field: ~0.25-0.5°

**Circle Appearance:**
- Outer circle: 2px solid Aurora Green
- Inner radial lines: 4 cross-hairs from center, 1px, Aurora Green
- Angular readout: Bottom of circle, "1.2°" JetBrains Mono 10px, text-gray-600
- All elements semi-transparent (opacity 0.6) to avoid obscuring view

**On Drag:**
- Circle follows mouse/touch
- Real-time position readout: Alt/Az near center
- Snapping: Snap to catalog objects when FOV circle overlaps object (highlight object)

**On Resize (scroll or handles):**
- Smooth animation to new size (200ms ease-out)
- Angular diameter updates live

### 6.8 Constellation Overlay Controls

**Controls Panel (In right sidebar):**
- Section: "Constellation Display" Inter SemiBold 11px, text-gray-400, margin-top 24px
- Checkboxes (each Inter Regular 11px, text-gray-300):
  - "Lines" (connects brightest stars, default enabled)
  - "Boundaries" (celestial boundaries, default disabled)
  - "Labels" (constellation names, default enabled)
  - "Mythology" (constellation stories popup on click, default disabled)
  - "Bright stars only" (show only mag < 5.0 in lines, default enabled)

**On Toggle "Lines":**
- Draws bright star-connected lines between constellation stars
- Color: Nebula Purple #8b5cf6, 1px width
- Opacity: 0.4 (semi-transparent)
- Smoothly animates in/out (300ms fade)

**On Toggle "Boundaries":**
- Draws thin lines showing celestial sphere divisions (IAU boundaries)
- Color: `rgba(37, 99, 235, 0.3)`, 1px width
- Entire celestial sphere divided into 88 regions
- Labels not shown for boundaries (only constellation names for "Lines")

**On Toggle "Labels":**
- Shows constellation names at constellation center
- Font: Inter SemiBold 12px, Nebula Purple, 0.7 opacity
- Only visible for constellations in current view
- Fade in/out with view changes

**On Toggle "Mythology":**
- When hovering/tapping constellation, shows popup:
  - Constellation name: Inter Bold 13px
  - Mythology: "In Greek mythology, Andromeda was..." Inter Regular 11px, max 100 words
  - Position: Cursor position, 300px width

### 6.9 Observation Log Panel

**Access:**
- Button in right sidebar: "📓 Observation Log" Inter Medium 12px, 44px height
- Or: Scrolled view within right sidebar

**Log List:**
- Scrollable area, max-height 300px
- Date header: Grouped by date "Oct 22, 2024" Inter SemiBold 11px, text-gray-500, sticky header
- Items spacing: 8px

**Each Log Entry (48px height):**
- Layout: Flex row, items-center, padding 12px, border-radius 6px
- Background: Default transparent, hover `rgba(37, 99, 235, 0.05)`

Log Item Content:
- Time: "22:45 UTC" JetBrains Mono 10px, text-gray-600, left (40px wide)
- Object: "M31 (Andromeda)" Inter Regular 11px, text-gray-200, flex 1
- Rating: "★★★★★" (5 stars, 16px wide, right side)
  - On hover: Show "Excellent seeing" tooltip
  - Clickable: Change rating

**Add New Entry Button:**
- Position: Below log list
- Button: "[+] New Entry" Inter Regular 11px, full width, 40px height
- Background: `rgba(37, 99, 235, 0.1)`, border 1px dashed `rgba(37, 99, 235, 0.4)`
- On hover: Border solid, background opacity 0.2

**Add Entry Form (Modal overlay):**
- Title: "Log Observation" Inter Bold 14px
- Object: Auto-selected (current object in 3D view), read-only
- Time: Auto-filled with current UTC time, editable
- Date: Auto-filled, editable date picker
- Seeing (Pickering scale): Dropdown 1-10 (10 = perfect)
- Transparency (Limiting magnitude): Input field, range 3.0-7.0
- Equipment used: Text input "8mm eyepiece, 10x50 binoculars"
- Notes: Textarea, 100-word limit
- Rating: 5-star selector
- Buttons: "Save" (Cosmic Blue), "Cancel"

**Log Entry Details (On click):**
- Shows expanded view with all fields
- Edit option available
- Delete option (with confirmation)
- Share option (exports as text or JSON)

### 6.10 Location & Time Input Panel

**Location Input:**
- Label: "📍 Observer Location" Inter SemiBold 11px, text-gray-400
- Current display: "40.0°N, 75.2°W, Elev: 150m" Inter Regular 11px, text-gray-300
- On click: Opens location editor

**Location Editor Modal:**
- Latitude input: "-90 to +90 degrees" (numeric, decimal)
- Longitude input: "-180 to +180 degrees" (numeric, decimal)
- Elevation input: "meters above sea level" (numeric, 0-8848)
- Preset locations: Dropdown "My Observatory", "Backyard", "Mountain site"
- Add preset: "Save as preset" button (saves location to localStorage)
- GPS button: "📍 Use GPS" (if available on device) → auto-fills location
- Buttons: "Set", "Cancel"

**Time Input:**
- Label: "🕐 Observer Time" Inter SemiBold 11px, text-gray-400
- Current display: "22:30:45 UTC" JetBrains Mono 11px, text-gray-300
- Status indicator: "✓ Synced with system" Inter Regular 9px, Aurora Green
- On click: Opens time editor

**Time Editor Modal:**
- Date picker: Interactive calendar
- Time input: HH:MM:SS (24-hour format)
- Timezone selector: "UTC" (selected), or local timezone
- "Now" button: Sets to current system time
- Buttons: "Set", "Cancel"

**Verification Status (Bottom of location/time section):**
- Icon: ✓ or ⚠️
- Text: "✓ Location and time verified" (green) or "⚠️ Time not set" (orange)
- Updates in real-time

### 6.11 Tonight's Sky Summary Card

**Position:**
- Bottom of left sidebar
- Width: 260px
- Height: Auto, 100-150px
- Background: `rgba(139, 92, 246, 0.1)`, border 1px `rgba(139, 92, 246, 0.3)`, border-radius 6px
- Padding: 12px

**Content:**
- Title: "Tonight's Sky" Inter SemiBold 12px, text-gray-100
- Best objects: List of 3-5 top observable objects tonight
  - Each item: "M13 (Great Globular)" Inter Regular 10px, text-gray-300
  - Transit time: "23:40" JetBrains Mono 9px, right side
- Sky conditions forecast: "Clear skies, mag limit 5.2" Inter Regular 10px, text-gray-600
- Refresh button: "🔄 Refresh" (small, right-aligned)
- On click: Updates forecast from live data (if available)

---

## Section 7: Research Mode — Dr. Priya Kapoor, Astrophysicist (~400 lines)

### 7.1 Research Mode: Persona Overview

**User Profile:**
- Name: Dr. Priya Kapoor
- Age: 45
- Background: PhD in astrophysics, 20 years research experience
- Usage Pattern: 2-4 hour sessions, daily (including batch jobs overnight)
- Primary Goals: Advanced analysis, parameter exploration, publication
- Technical Comfort: Expert (comfortable with APIs, data formats, simulation parameters)
- Device: Multi-monitor setup (3×2560×1440), terminal windows, lab workstation

**Motivations:**
- Scientific precision and accuracy
- Batch processing and automation
- Publication-ready outputs
- Custom analysis and simulation parameters

### 7.2 Research Mode: Full Screen Layout ASCII Wireframe

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ File  Edit  View  Data  Tools  Simulation  Export  Help                      │ 32px
├───┬───────────────────────────────────────────────────────────────┬──────┬───┤
│   │                                                               │      │   │
│Si │  3D CANVAS                                                    │ Data │Sta│
│mu │  (Advanced WebGL, High-res rendering)                         │Panel │ts │
│la │                                                               │      │   │
│ti │  [Object selection: 145 objects selected]                    │      │   │
│on │  [Color by: Luminosity] [Size by: Mass]                      │ 320px│360│
│Pa │                                                               │      │px │
│ra │  [Coordinate system: Cartesian | Custom]                     │      │   │
│me │                                                               │      │   │
│te │  [Grid overlay] [Velocity vectors] [Measurement tools]       │      │   │
│rs │                                                               │      │   │
│(3 │  ┌──────────────────────────────────────────────────────┐   │      │   │
│80 │  │ Statistics: Mean luminosity 3.2 × 10^26 W            │   │      │   │
│px)│  │ Std Dev: 1.8 × 10^26 W  | Count: 145               │   │      │   │
│   │  │ Correlation (Luminosity vs Mass): r = 0.876         │   │      │   │
│   │  └──────────────────────────────────────────────────────┘   │      │   │
│   │                                                               │      │   │
│   │  [Query results: 2345 objects | Render time: 234ms | FPS: 58]│      │   │
└───┴───────────────────────────────────────────────────────────┴──────┴───┘

Data Import | Layer | Selection | Color Map | Size Map | Properties | API
```

### 7.3 Traditional Menu Bar

**Position:** Top of window, 32px height
**Styling:** Inter Regular 11px, text-gray-300, dark background

**Menus:**

1. **File**
   - New project
   - Open project
   - Save project
   - Save as...
   - Export (CSV, JSON, VOTable, FITS)
   - Print preview
   - Exit

2. **Edit**
   - Undo / Redo
   - Cut / Copy / Paste
   - Select all
   - Clear selection
   - Preferences

3. **View**
   - Full screen (F)
   - Show/hide panels (Data, Stats, API)
   - Zoom (100%, 50%, 200%, Fit)
   - Grid overlay
   - Coordinate system selector
   - Show performance metrics

4. **Data**
   - Import data (CSV, JSON, VOTable, FITS)
   - Data layers panel
   - Column mapping
   - Coordinate systems
   - Duplicate layer
   - Delete layer
   - Merge layers

5. **Tools**
   - Selection tools (Lasso, Box, Radius)
   - Measurement tools
   - Filter/query builder
   - Statistics
   - Spectral analysis (if applicable)

6. **Simulation**
   - Run simulation
   - Parameter presets
   - Batch jobs
   - Job queue
   - Simulation history

7. **Export**
   - Export as image (PNG, SVG, PDF)
   - Export publication figure
   - Export data (CSV, JSON, VOTable, FITS)
   - Generate publication code (AASTeX)

8. **Help**
   - Documentation
   - API reference
   - Keyboard shortcuts
   - About
   - Check for updates

### 7.4 Data Import Wizard (4-Step Process)

**Step 1: Data Upload**
- Modal width: 600px
- Title: "Import Data - Step 1 of 4: Upload" Inter Bold 14px
- Upload area: Drag-and-drop zone, 300px × 200px
  - Background: `rgba(37, 99, 235, 0.1)`, border 2px dashed `rgba(37, 99, 235, 0.4)`
  - Icon: Upload (32px), Cosmic Blue
  - Text: "Drag files here or click to browse" Inter Regular 12px
  - Supported formats: CSV, JSON, VOTable, FITS, HDF5
- File input: Hidden, triggered on click/drag
- Recent files list: Below upload area (if any)
  - Each file: Name, size, date uploaded
  - On click: Auto-selects file
- Next button: "Continue to Step 2" (disabled until file selected)
- Cancel button

**Step 2: Column Mapping**
- Title: "Import Data - Step 2 of 4: Column Mapping" Inter Bold 14px
- Table: Left side (file columns), Right side (Cosmos field mappings)
- Columns: Name | Format | Example value | Mapped to field
- Each row: 48px height, padding 12px
- File columns (left): Auto-detected from file
  - Name: Inter Regular 11px, text-gray-300
  - Format: "String", "Float", "Integer" (auto-detected)
  - Example: First value (truncated to 40px width)
- Mapped fields (right): Dropdowns
  - Options: "RA", "Dec", "Distance", "Luminosity", "Mass", "Magnitude", "Name", "ID", "Skip"
  - Default: Auto-matched if column names match standard names
  - On change: Validation runs (e.g., RA must be numeric)
- Buttons: "Back", "Continue to Step 3" (disabled until valid mapping)

**Step 3: Coordinate System**
- Title: "Import Data - Step 3 of 4: Coordinate System" Inter Bold 14px
- Current format: "Detected as: Equatorial (J2000.0)" Inter Regular 11px, text-gray-600
- Options: Radio buttons
  - "Equatorial (RA/Dec)" (selected) → epoch input (J2000.0 default)
  - "Galactic (l/b)" → auto-converts to RA/Dec
  - "Ecliptic (λ/β)" → auto-converts
  - "Cartesian (X/Y/Z)" → auto-converts
- Epoch selector: "J2000.0" dropdown (if equatorial selected)
  - Options: J1950.0, J2000.0, B1950.0, Custom
- Distance units: Dropdown "parsecs", "light-years", "kiloparsecs", "megaparsecs"
- Preview: Shows first 3 rows with converted coordinates
- Buttons: "Back", "Continue to Step 4"

**Step 4: Confirmation & Import**
- Title: "Import Data - Step 4 of 4: Confirm & Import" Inter Bold 14px
- Summary table:
  - Rows: Total objects, Columns mapped, File size, Estimated memory
  - Format: Label (Inter SemiBold 11px) | Value (Inter Regular 11px, text-gray-300)
- Data preview: Table showing first 10 rows (minimal columns shown)
  - Columns: RA | Dec | Distance | Luminosity | [mapped columns only]
  - Scrollable horizontally
- Layer naming:
  - Input field: "My Data Set 1" (auto-generated, editable)
  - Suggestion: "Gaia DR3 subset" (if detectable from columns)
- Buttons: "Back", "Import" (Solar Orange), "Cancel"

**On Import:**
- Progress dialog appears: "Importing 2345 objects..." + progress bar
- Can take 1-30 seconds depending on file size
- On complete: Closes wizard, adds layer to data panel, displays on canvas

### 7.5 Data Layer Panel (Left Sidebar)

**Dimensions & Position:**
- Position: Fixed, left side
- Width: 380px
- Height: 100vh - 32px (below menu bar)
- Top: 32px
- Background: `rgba(15, 23, 42, 0.95)`, border-right 1px `rgba(37, 99, 235, 0.2)`
- Padding: 16px
- Scrollable content

**Header:**
- Title: "Data Layers" Inter Bold 14px, text-gray-100
- Count: "3 layers, 12,450 objects" Inter Regular 10px, text-gray-600
- Add button: "[+] Import Data" (full width, 44px height)
  - Background: `rgba(37, 99, 235, 0.1)`, border 1px `rgba(37, 99, 235, 0.3)`
  - On click: Opens import wizard
- Spacing: Below, 16px

**Layers List:**
- Scrollable, max-height calc(100vh - 200px)
- Spacing: 12px between layers

**Each Layer Item (Expanded, ~140px height):**
- Background: `rgba(37, 99, 235, 0.05)`, border 1px `rgba(37, 99, 235, 0.3)`, border-radius 6px
- Padding: 12px

**Layer Header (Flex row, items-center):**
- Visibility toggle: Eye icon (16px), left, on hover visible, Cosmic Blue if visible, gray-700 if hidden
- Layer name: Inter SemiBold 12px, text-gray-100, flex 1
- Object count: "(1,245 objects)" Inter Regular 9px, text-gray-600
- Options menu: Three dots (12px), right, on hover visible

**Layer Controls (Below header):**
- Opacity slider: 0-100%, current 85%
  - Layout: Label "Opacity" (11px) | Slider (flex 1) | Value "85%"
  - Slider height: 4px, thumb 12px, Cosmic Blue
  - Margin-bottom: 8px

- Color swatch: 16px × 16px circle, shows layer color
  - Clickable: Opens color picker
  - On change: All objects in layer recolor
  - Margin-bottom: 8px

**Layer Info (Small text):**
- Source: "CSV import (Nov 5, 2024)" Inter Regular 9px, text-gray-700
- Columns: "RA, Dec, Distance, Luminosity, +" (Inter Regular 9px, text-gray-700, truncate)

**Layer Menu (On three-dot click):**
- Options: Rename, Duplicate, Merge with..., Delete
- Delete triggers confirmation: "Delete layer? (1,245 objects)" OK/Cancel

### 7.6 Selection Tools

**Toolbar:** Below canvas (floating, can be repositioned)

**Tools (Buttons, each 44px × 44px circle):**

1. **Lasso Tool** (Free-form selection)
   - Icon: Lasso outline (20px)
   - On click: Activates lasso mode
   - On canvas: Click-drag to draw free-form polygon around objects
   - Double-click to close selection
   - Selected objects highlight (glow effect)

2. **Box Tool** (Rectangular selection)
   - Icon: Rectangle (20px)
   - On click-drag: Creates rectangle, selects all objects within bounds
   - Shift+click-drag: Adds to selection
   - Ctrl+click-drag: Removes from selection

3. **Radius Tool** (Circular selection)
   - Icon: Circle (20px)
   - On click: Activates radius mode
   - Click on canvas: Sets center, drag to set radius
   - All objects within circle selected

**Selection Info Display:**
- Position: Top-left of canvas (or floating panel)
- Background: Subtle, `rgba(15, 23, 42, 0.8)`, padding 12px, border-radius 4px
- Content:
  - "Selected: 145 objects" Inter Regular 11px, text-gray-200
  - "Selection stats:" (link, expands stats panel)
  - Color-coded count by layer: "Layer 1: 92 | Layer 2: 53"

**Selection Highlight:**
- Selected objects glow: `0 0 16px rgba(37, 99, 235, 0.6)`
- Object outline: 2px Aurora Green
- Glow animates: Opacity 0.6 → 0.8, 1.5s infinite (subtle pulse)

### 7.7 Color Mapping Controls

**Position:** Right sidebar (or floating panel)

**Label:** "Color Mapping" Inter SemiBold 12px, text-gray-400

**Column Selector:**
- Dropdown: "Select column to map..." (shows all numeric columns)
- Options: "Luminosity", "Mass", "Temperature", "Redshift", "None"
- Default: "None" (use layer color)
- On select: Applies color gradient to objects

**Gradient Editor (When column selected):**
- Gradient preview: Horizontal bar (100% width, 30px height)
  - Left color (min value): Color swatch, clickable
  - Right color (max value): Color swatch, clickable
  - Preset gradients: Dropdown "Viridis", "Hot", "Cool", "Spectral"
- Min/Max value inputs:
  - Min: Auto-fills with dataset minimum, editable
  - Max: Auto-fills with dataset maximum, editable
  - Format: Scientific notation for large ranges (e.g., "3.2e25")
- Log scale toggle: Checkbox "Logarithmic scale"
  - When enabled: Maps color to log(value) instead of linear
  - Useful for wide-range data (e.g., luminosity)

**Color mapping applied:**
- All objects re-color in real-time
- Legend appears: Scale from min color to max color with value labels
- Position: Right edge of canvas, vertical

### 7.8 Size Mapping Controls

**Position:** Below color mapping in right sidebar

**Label:** "Size Mapping" Inter SemiBold 12px, text-gray-400

**Column Selector:**
- Dropdown: "Select column to map..." (shows all numeric columns)
- Options: "Mass", "Radius", "Luminosity", "Distance", "None"
- Default: "None" (all objects same size)
- On select: Applies size scaling to objects

**Size Scale Controls:**
- Min size: Input field, range 0.1-10 (pixels or visual units)
- Max size: Input field, range 0.1-50
- Default: Min 2px, Max 20px
- Preview: Shows example spheres next to size sliders

**Log scale toggle:** Checkbox "Logarithmic scale"

**Size mapping applied:**
- Objects resize in real-time
- Smooth animation to new sizes (300ms ease-out)
- Maintains relative position (center point doesn't move)

### 7.9 Properties Table

**Position:** Right sidebar, below size mapping

**Label:** "Selected Object Properties" Inter SemiBold 12px, text-gray-400

**Table Format:**
- Two columns: "Property" (150px) | "Value" (170px)
- Scrollable, max-height 200px
- Background: `rgba(15, 23, 42, 0.6)`, border 1px `rgba(37, 99, 235, 0.2)`

**Rows (36px each):**
- Property: Inter Regular 11px, text-gray-600
- Value: Inter Regular 11px, text-gray-200 (selectable/copyable)
- Background: Default transparent, hover `rgba(37, 99, 235, 0.05)`

**Copy Button (Right edge):**
- Icon: Copy (12px), opacity 0, on hover opacity 1
- On click: Copies property value to clipboard, toast "Copied"

**Typical Properties:**
- RA, Dec, Distance, Luminosity, Mass, Temperature, Redshift, Type, Catalog ID, etc.
- Only displays properties that exist for selected object(s)

**Multiple Selection:**
- If multiple objects selected: Shows "Mean", "Std Dev", "Min", "Max" for numeric properties
- Property rows adjust dynamically

### 7.10 Coordinate Readout Bar (Bottom)

**Position:** Fixed, bottom of screen (above status bar)
- Height: 28px
- Background: `rgba(15, 23, 42, 0.9)`, border-top 1px `rgba(37, 99, 235, 0.2)`
- Padding: 4px 16px

**Content (Flex row, items-center, spacing 24px):**

**Mouse Position:**
- Label: "Cursor position:" Inter Regular 10px, text-gray-600
- Coordinates: "RA: 12h34m56s | Dec: +45°23'12" | Dist: 3.5 kpc" JetBrains Mono 9px, text-gray-300
- Updates in real-time as mouse moves

**Coordinate System Selector:**
- Dropdown: "Equatorial (J2000.0)" (current system)
- Options: "Equatorial", "Galactic", "Ecliptic", "Cartesian"
- On change: Updates all coordinate displays

**Distance Unit:**
- Dropdown: "parsecs" (current)
- Options: "parsecs", "light-years", "kiloparsecs", "megaparsecs", "AU"
- On change: Converts all distance values

**Right side:** Performance metrics (floating)
- "FPS: 58 | Render: 234ms | Objects: 12,450" JetBrains Mono 9px, text-gray-700

### 7.11 Publication Export Modal

**Access:** Export menu → "Publication Export" or button in toolbar

**Modal:**
- Width: 700px
- Title: "Export Publication Figure" Inter Bold 14px
- Tabs: "Preview", "Settings", "Code"

**Tab 1: Preview**
- Preview image: 600px × 400px, shows current canvas rendering at export resolution
- Title field: "Figure 1: Distribution of Stars in Gaia DR3 Subset" (editable)
- Caption field: "Color represents absolute luminosity. Size represents mass." (editable)
- Refresh button: "🔄 Refresh preview"

**Tab 2: Settings**

**Resolution:**
- Radio: "Screen resolution" (default, ~2560×1440)
- Radio: "Publication (300 DPI)" → 4800×3200
- Radio: "Poster (100 DPI)" → 1600×1080
- Radio: "Custom" → width/height inputs

**Format:**
- Radio: "PNG" (default, lossless, larger file)
- Radio: "SVG" (vector, scalable)
- Radio: "PDF" (vector, publication-ready)

**Figure Options:**
- Checkbox: "Include axis labels"
- Checkbox: "Include colorbar legend"
- Checkbox: "Include title and caption"
- Checkbox: "White background" (default: dark background)
- Checkbox: "High quality rendering" (might be slow)

**Font Settings:**
- Font family: Dropdown "Inter", "Courier New", "Times New Roman"
- Font size: Slider, 8-20pt
- Line width (for vectors): Slider, 0.5-3pt

**Color Profile:**
- Dropdown: "sRGB" (default), "Adobe RGB", "Linear", "Print CMYK"

**Tab 3: Code**
- AASTeX code: Auto-generated LaTeX code for the figure
- Code block: Monospace, selectable, 200px height
- Example:
  ```
  \begin{figure}[h]
  \includegraphics[width=0.8\columnwidth]{figure1.pdf}
  \caption{Distribution of stars in Gaia DR3 subset...}
  \label{fig:1}
  \end{figure}
  ```
- Copy button: Copies LaTeX code to clipboard

**Buttons:**
- "Export" (Solar Orange) → saves file, displays success dialog with filename
- "Preview print" → opens print preview
- "Cancel"

### 7.12 API Console

**Access:** Tools menu → "API Console" or Ctrl+Shift+K

**Panel (Floating, resizable):**
- Width: 600px (default), resizable from edges
- Height: 400px (default), resizable
- Background: `rgba(15, 23, 42, 0.98)`, border 1px `rgba(37, 99, 235, 0.4)`, border-radius 6px
- Shadow: `0 12px 48px rgba(37, 99, 235, 0.3)`

**Header:**
- Title: "API Console" Inter SemiBold 12px, text-gray-200
- Close button: X (top-right)
- Mode selector: Dropdown "JavaScript", "Python", "cURL", "REST"
- Default: JavaScript

**Code Editor (Top section, 60% height):**
- Syntax highlighting for selected language
- Font: JetBrains Mono Regular 11px
- Background: `rgba(10, 10, 26, 0.8)`, border-bottom 1px `rgba(37, 99, 235, 0.2)`
- Example query:
  ```javascript
  // Query 10 brightest stars
  const stars = await cosmos.query({
    type: 'Star',
    filters: { magnitude: { '<': 3.0 } },
    limit: 10,
    orderBy: 'magnitude'
  });
  ```
- Auto-complete: Ctrl+Space triggers suggestions
- Line numbers: Left side, text-gray-700

**Controls (Below editor):**
- Run button: "▶ Run" (44px width, Cosmic Blue background)
- Clear button: "Clear" (transparent)
- Save button: "💾 Save query" (optional)
- Keyboard shortcut: Ctrl+Enter to run

**Output Panel (Bottom section, 40% height):**
- Background: `rgba(10, 10, 26, 0.6)`, border-top 1px `rgba(37, 99, 235, 0.2)`
- Scrollable
- Font: JetBrains Mono Regular 10px, text-gray-400
- Output format: JSON pretty-printed
- Example output:
  ```json
  {
    "success": true,
    "count": 10,
    "executionTime": 234,
    "data": [
      { "name": "Sirius", "magnitude": -1.46, "distance": 2.64 },
      ...
    ]
  }
  ```
- Error highlighting: Errors in red text, with line reference
- Tab: "History" shows recent queries

**API Documentation:**
- Link: "📖 API Docs" (opens new window/tab with full API documentation)
- Inline help: Hover over function name → tooltip with description

### 7.13 Statistics Panel

**Access:** Tools → "Statistics" or right-click on selection → "Statistics"

**Panel (Right sidebar or floating):**
- Width: 360px
- Height: Auto or max 600px (scrollable)
- Background: `rgba(15, 23, 42, 0.9)`, border 1px `rgba(37, 99, 235, 0.2)`, border-radius 6px
- Padding: 16px

**Header:**
- Title: "Statistics: Luminosity (145 objects selected)" Inter SemiBold 12px, text-gray-100
- Selector: Dropdown to change analyzed property
- Auto-update: Checkbox "Auto-update on selection change"

**Summary Statistics:**
- Count: "145" Inter Regular 11px
- Mean: "2.3 × 10²⁶ W" JetBrains Mono 10px
- Median: "1.8 × 10²⁶ W" JetBrains Mono 10px
- Std Dev: "1.2 × 10²⁶ W" JetBrains Mono 10px
- Min: "3.4 × 10²⁴ W" JetBrains Mono 10px
- Max: "8.7 × 10²⁷ W" JetBrains Mono 10px
- Skewness: "0.34"
- Kurtosis: "0.12"
- All with labels (Inter SemiBold 10px, text-gray-500) and values (Inter Regular 11px, text-gray-300)
- Spacing: 12px between stats

**Histogram (Below summary):**
- Width: 100%, height 150px
- X-axis: Property values (auto-scaled)
- Y-axis: Count/frequency
- Bars: Cosmic Blue color with transparency
- Bins: Auto-determined (can adjust via slider)
- Grid lines: Subtle, text-gray-700
- On hover: Tooltip shows bin count

**Scatter Plot (Optional, if correlation requested):**
- Width: 100%, height 150px
- X-axis: First property, Y-axis: Second property
- Points: Small circles (4px), Nebula Purple, opacity 0.6
- Trend line: Thin line showing correlation (if > 0.3)
- Correlation coefficient displayed: "r = 0.876" Inter Regular 10px

**Buttons:**
- "Export as CSV" → saves stats table
- "Export as JSON" → saves detailed statistics
- "Copy table" → copies formatted table to clipboard

---

## Section 8: Cross-Mode Shared Components (~100 lines)

### 8.1 Loading Screen

**Full-screen overlay when app initializes or major data loads:**
- Background: Gradient (top-left Cosmic Blue #2563eb, bottom-right Nebula Purple #8b5cf6)
- Centered content:
  - Logo: COSMOS wordmark (64px)
  - Spinner: Rotating circle (32px), Supernova Gold, 2s linear infinite
  - Text: "Loading universe..." Inter Regular 13px, text-gray-300, margin-top 16px
  - Progress bar: Optional, 300px width, 4px height, shows actual progress if available
  - Loading tips: Rotating tips every 3 seconds, "Did you know? Andromeda is..." Inter Regular 11px, text-gray-600
- Fade-out: 300ms ease-out on completion
- Time: Never stays < 1s (prevents UI jitter), max 30s with fallback error state

### 8.2 Error States

**Error Modal (Center overlay):**
- Background: `rgba(15, 23, 42, 0.98)`, border 2px Red Giant #ef4444
- Icon: ⚠️ (48px)
- Title: "Something went wrong" Inter Bold 16px, text-gray-100
- Message: "Unable to load object. Please try again or contact support." Inter Regular 12px, text-gray-400
- Error code: "Error: 404_OBJECT_NOT_FOUND" Inter Regular 10px, text-gray-700 (for debugging)
- Buttons: "Retry" (Aurora Green), "Go Home", "Contact Support"

**Inline Error (In-place notification):**
- Position: Related component (e.g., search bar)
- Background: `rgba(239, 68, 68, 0.1)`, border 1px Red Giant
- Icon: ✕ (16px), left
- Text: "Search failed. Please try again." Inter Regular 11px, text-gray-300
- Dismiss button: ✕ (12px), right
- Auto-dismiss: 5 seconds if not dismissed manually

### 8.3 Help Overlay

**Access:** Question mark icon (top-right corner) or F1 key

**Modal (Center, 600px width):**
- Title: "Help & Documentation" Inter Bold 16px
- Tabs: "Getting Started", "Keyboard Shortcuts", "FAQ", "Contact Support"
- Content: Scrollable, max-height 600px

**Getting Started Tab:**
- Step-by-step guide for current mode
- Screenshots: Small (200px) with annotations
- Text: Inter Regular 11px, line-height 1.6

**Keyboard Shortcuts Tab:**
- Two-column table: Command | Shortcut
- Grouped by category (Navigation, Selection, Export, etc.)
- Shortcut font: JetBrains Mono 10px
- Example: "Undo" | "Ctrl+Z"

**FAQ Tab:**
- Collapsible Q&A items
- Question: Inter SemiBold 12px
- Answer: Inter Regular 11px, scrollable if long
- Search box: Filter FAQs by keyword

**Contact Support Tab:**
- Email link, chat support (if available), feedback form

### 8.4 Performance Monitor

**Access:** Settings → "Show Performance Monitor" or Ctrl+Shift+P

**Display (Top-right corner or floating panel):**
- Background: `rgba(15, 23, 42, 0.8)`, border 1px `rgba(37, 99, 235, 0.3)`, border-radius 4px
- Padding: 8px 12px
- Font: JetBrains Mono 9px, text-gray-600

**Metrics:**
- FPS: "58" (white if > 50, yellow if 30-50, red if < 30)
- Frame time: "17.2ms" (per-frame render time)
- GPU mem: "256 / 1024 MB" (used / total)
- Object count: "12,450 visible / 45,000 total"
- Draw calls: "234"

**Collapsible:** Click to expand detailed metrics panel

---

## Section 9: Responsive Design Matrix (~100 lines)

| Component | Desktop (1920px+) | Tablet (768-1919px) | Mobile (< 768px) |
|---|---|---|---|
| **Toolbar** | 56px height, full width icons | 56px height, icons + text reduced | 52px height, icon-only, hamburger menu |
| **Search Bar** | 320px width | 240px width | 100% width - 100px, appears in dropdown menu |
| **Sidebar** | 280-380px, persistent | 280px, toggleable, slides over content | Hamburger menu, full-height drawer |
| **Info Panel** | 360px fixed right | 320px, expandable, overlay | 100vw full-sheet from bottom |
| **Modal Dialogs** | 500-700px centered | 90vw, centered or bottom-sheet | 100vw, full-height with safe areas |
| **Timeline** | 120px height, full timeline view | 80px height, zoom controls | Hidden, access via modal |
| **Data Table** | Full horizontal scroll | Horizontal scroll with row collapse | Vertical stack, columns as rows |
| **Carousel Cards** | 150px width, 3-4 visible | 140px width, 2-3 visible | Full width, 1 visible (vertical scroll) |
| **Tap Targets** | 44px minimum | 44px minimum | 48px minimum (larger for touch) |
| **Font Sizes** | 11px body, 14px headings | 12px body, 15px headings | 13px body, 16px headings (larger for readability) |
| **Canvas** | Full screen - UI | Full screen - UI | Full screen - UI (top toolbar fixed) |

---

## Section 10: Animation Specification (~100 lines)

**All animations use Cubic Bezier easing unless specified. Default durations listed.**

### Entrance/Exit Animations

| Element | Trigger | Duration | Easing | Property |
|---|---|---|---|---|
| Panel slide-in | Open action | 300-400ms | cubic-bezier(0.4, 0, 0.2, 1) | transform: translateX |
| Panel slide-out | Close action | 200-300ms | ease-in | transform: translateX |
| Modal fade-in | Open action | 250-300ms | ease-out | opacity |
| Dropdown expand | Click | 200ms | ease-out | max-height, opacity |
| Tooltip appear | Hover (200ms delay) | 200ms | ease-out | opacity, transform: scale |
| Toast slide-in | New notification | 300ms | cubic-bezier(0.4, 0, 0.2, 1) | transform: translateX |
| Toast slide-out | Auto-dismiss/close | 200ms | ease-in | transform: translateX |

### Interactive Animations

| Element | Trigger | Duration | Easing | Property |
|---|---|---|---|---|
| Button hover | Hover state | 200ms | ease-out | scale, background-color |
| Icon rotate | Loading state | 2s | linear | transform: rotate |
| Progress bar fill | Progress update | 600ms | ease-out | width |
| Slider thumb | Drag | Instant | N/A | transform: translateX |
| Text input focus | Focus state | 300ms | ease-out | border-color, box-shadow |
| Toggle switch | Click | 200ms | ease-out | transform: translateX |
| Checkbox check | Click | 200ms | ease-out | opacity, transform: scale |

### Continuous Animations

| Element | Animation | Duration | Easing | Property |
|---|---|---|---|---|
| Compass needle | Rotate to camera direction | Continuous | N/A (immediate) | transform: rotate |
| Pulsing indicator | Sync status (recording, etc.) | 1.5s | ease-in-out | opacity |
| Breathing effect | UI idle state | 3s | ease-in-out | opacity |
| Spinning loader | Data loading | 2s | linear | transform: rotate |
| Shimmer effect | Skeleton loading | 2s | ease-in-out | background-position |

---

## Section 11: Accessibility (~100 lines)

### Keyboard Navigation

**Global Shortcuts (All Modes):**
- Tab: Cycle through interactive elements
- Shift+Tab: Reverse cycle
- Enter: Activate focused button
- Space: Toggle checkbox/radio
- Escape: Close modal/panel
- ?: Show help overlay
- Ctrl+/: Show keyboard shortcuts

**Mode-Specific Shortcuts:**

| Mode | Shortcut | Action |
|---|---|---|
| Explorer | "/" | Focus search |
| Explorer | "B" | Open bookmarks |
| Explorer | "T" | Launch tour |
| Educator | "A" | Activate annotation tool |
| Educator | "P" | Enter presentation mode |
| Creator | "R" | Toggle recording |
| Creator | "H" | Hide UI |
| Observer | "L" | Open observation log |
| Research | "Ctrl+Shift+K" | Open API console |
| All | "Ctrl+S" | Save project |
| All | "Ctrl+Z" | Undo |
| All | "Ctrl+Y" | Redo |

### Screen Reader Support

**ARIA Labels:**
- All interactive elements: `aria-label` attribute
- Icon buttons: "aria-label='Toggle sidebar'" (not empty alt text)
- Form inputs: Associated `<label>` elements or `aria-labelledby`
- Dialog modals: `role="dialog"`, `aria-labelledby`, `aria-describedby`
- Tabs: `role="tab"`, `role="tablist"`, `aria-selected`

**Semantic HTML:**
- Proper heading hierarchy (h1 > h2 > h3)
- Landmark regions: `<nav>`, `<main>`, `<aside>`, `<section>`
- List elements for lists (not divs)
- Buttons for buttons (not divs with onclick)

**Live Regions:**
- Toast notifications: `role="status"`, `aria-live="polite"`
- Loading states: `role="status"`, `aria-live="assertive"`
- Dynamic updates: `aria-live="polite"`, `aria-atomic="true"`

### WCAG AA Compliance

**Color Contrast:**
- Normal text: 4.5:1 ratio (white on dark backgrounds)
- Large text (18px+): 3:1 ratio
- UI components: 3:1 ratio for borders/edges
- Tool: All colors verified with WCAG Contrast Checker

**Focus Management:**
- Visible focus indicator: 2px outline, Cosmic Blue, 4px offset
- Focus order follows logical tab order (left-to-right, top-to-bottom)
- Modal dialogs: Focus trap (Tab in last element → first element)
- Close modal: Focus returns to triggering element

**Motion & Animation:**
- Respects `prefers-reduced-motion` media query
- Default animations disabled if user has set preference
- Essential animations (confirmation) still shown at 50% speed
- No auto-playing background videos

**Text Sizing:**
- Minimum font size: 11px (body text), 12px (UI labels)
- Line height: 1.5 minimum for body text
- Letter spacing: Normal or slightly increased
- All text resizable via browser zoom (no `user-select: none` on text)

**Form Accessibility:**
- All form fields have labels
- Error messages associated with fields: `aria-describedby`
- Required fields: `aria-required="true"`, visual indicator
- Validation messages live in `aria-live` region

---

