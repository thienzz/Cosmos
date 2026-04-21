# Cosmos Explorer — UI/UX Design Brief

**Document:** 24 — Comprehensive UI/UX Design Brief  
**Version:** 1.0  
**Date:** 2026-04-19  
**Status:** Published  
**Design Direction:** AETHER V4 — Retro-Futuristic Terminal  
**Product:** Cosmos Explorer — Interactive 3D Universe Visualization  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Design Direction: AETHER V4 Retro-Futuristic Terminal](#2-design-direction)
3. [Design System — AETHER V4 Adaptation](#3-design-system)
4. [User Personas & Mode Mapping](#4-user-personas)
5. [Screen Inventory & Journey Mapping](#5-screen-inventory)
6. [Journey 1: First-Time Discovery — Screen Designs](#6-journey-1)
7. [Journey 2: Classroom Lesson — Screen Designs](#7-journey-2)
8. [Journey 3: Content Creation — Screen Designs](#8-journey-3)
9. [Journey 4: Casual Exploration — Screen Designs](#9-journey-4)
10. [Journey 5: Observation Planning — Screen Designs](#10-journey-5)
11. [Journey 6: Research Visualization — Screen Designs](#11-journey-6)
12. [Global Components — AETHER V4 Specification](#12-global-components)
13. [Entity Display System — 96 Entity Types](#13-entity-display)
14. [Mode-Specific UI Configurations](#14-mode-configurations)
15. [Responsive Design & Breakpoints](#15-responsive-design)
16. [Animation & Micro-Interaction Specification](#16-animation)
17. [Accessibility Requirements](#17-accessibility)
18. [SRS Requirement Cross-Reference Matrix](#18-srs-crossref)
19. [Appendices](#19-appendices)

---

## 1. Executive Summary

This document is the authoritative UI/UX design brief for Cosmos Explorer, specifying the visual design, interaction patterns, screen layouts, and component specifications for every user-facing surface of the application. It applies the **AETHER V4 Retro-Futuristic Terminal** aesthetic — a design language that merges CRT-era computing aesthetics with futuristic data visualization — to all 45+ screens across 6 user journeys, 5 application modes, and 96 entity types.

### Design Vision Statement

AETHER V4 treats the cosmos as data to be decoded through a terminal interface from a future that never was. The aesthetic draws from vintage computing terminals, phosphor-glow CRTs, and pixel-grid overlays, combined with dense scientific data presentation and modern interaction patterns. The result is a UI that feels like operating a spacecraft's navigation console — simultaneously retro in its visual character and advanced in its information density.

### Key Design Principles

**Terminal Authenticity:** Every panel, label, and data readout evokes a phosphor-glow terminal. Text shimmers with subtle CRT text-shadow effects. Backgrounds carry faint scanline overlays. The interface feels like a piece of hardware, not a webpage.

**Data as Art:** Scientific data is not hidden behind progressive disclosure — it is the visual centerpiece. Orbital parameters, spectral classifications, atmospheric compositions, and physical properties are displayed simultaneously in dense, beautifully typeset terminal panels. The density of information itself becomes an aesthetic feature.

**Pixel Precision:** The retro-pixel motif extends beyond decoration. Grid overlays, pixel-perfect alignment, and geometric shapes built from discrete units create a visual rhythm that unifies all screens. Every element snaps to a 4px grid with mathematical precision.

**Chromatic Restraint with Neon Accent:** The palette is dark and muted by default (#0a0a0f base), punctuated by deliberate bursts of hot pink, electric cyan, neon purple, CRT amber, and phosphor green. Color is information — each hue maps to a data category or interaction state.

### Document Scope

This brief covers all screens required by the 6 user journeys defined in Doc 05, all 5 application modes defined in Doc 20, the complete design system adapted to AETHER V4, all 96 entity types from Doc 22, and cross-references every relevant SRS functional requirement. It supersedes and adapts the design system in Doc 08 and the screen designs in Doc 21 by applying the AETHER V4 visual language.

### Cross-Reference Documents

| Doc | Title | Relationship |
|-----|-------|-------------|
| 04 | User Personas | Persona definitions → mode mapping |
| 05 | User Journeys | Journey flows → screen sequencing |
| 07 | Information Architecture | Content taxonomy → screen content |
| 08 | UI/UX Design System | Base design system → AETHER V4 adaptation |
| 20 | UI Specs per Persona | Mode configurations → AETHER V4 overlay |
| 21 | Journey Screen Designs | Wireframes → AETHER V4 visual treatment |
| 22 | Interactive Toggle Features | 96 entity types → entity display panels |
| 23 | Spatial Universe Database | Data sources → data display formatting |
| SRS | Software Requirements Specification | Functional requirements → screen mapping |
| DFS | Detailed Functional Specification | Interaction specs → animation/behavior |

---

## 2. Design Direction: AETHER V4 Retro-Futuristic Terminal

### 2.1 Aesthetic Origin

AETHER V4 is the fourth iteration of the AETHER concept family, evolved through user feedback demanding a retro-futuristic style with pixel-dominant color language. The design draws from the visual vocabulary of 1980s–1990s computing terminals (Amiga Workbench, early SGI displays, VT100 terminals), science fiction interfaces (Alien's MU-TH-UR 6000, WarGames WOPR), and contemporary retro-gaming aesthetics (Celeste, Hyper Light Drifter).

### 2.2 Visual DNA

The AETHER V4 visual identity is built on five pillars:

**CRT Scanlines:** A subtle horizontal line pattern (1px lines at 2px intervals, opacity 0.03–0.06) overlays the entire viewport, creating the characteristic CRT monitor texture. This layer sits above the 3D viewport but below UI panels, grounding the experience in the terminal metaphor without interfering with readability.

**Pixel Grid Overlay:** A fine dot-grid pattern (dots at 8px intervals, 1px diameter, opacity 0.04) provides visual structure and reinforces the digital/computed nature of the display. This grid is visible in negative space and creates a subtle "graph paper" effect that suggests precision measurement.

**Phosphor Glow Typography:** All text carries a subtle colored text-shadow matching its semantic category. Data values glow cyan, labels glow amber, warnings glow pink, and system text glows green. The glow radius is tight (0 0 6px for body text, 0 0 10px for headings) to simulate phosphor persistence on a CRT.

**Terminal Panel Chrome:** UI panels use hard borders (1px solid, color varies by context), squared corners (border-radius: 2px maximum), and minimal internal padding. Panel headers use uppercase monospace text with geometric separator lines. The overall effect is industrial and functional, like instrument readouts on a spacecraft console.

**Neon Color Accents on Deep Black:** The base background is near-black (#0a0a0f) with panel surfaces at #0d0d14. All color comes from accent hues — hot pink for primary interactions, electric cyan for data values, neon purple for secondary elements, CRT amber for labels and warnings, and phosphor green for success/active states.

### 2.3 Mood References

The visual mood sits at the intersection of: retrofuturism (Syd Mead production design), lo-fi computing aesthetics (demoscene, BBS culture), scientific instrumentation interfaces (oscilloscopes, spectrum analyzers), and contemporary pixel art (high-fidelity limited-palette digital illustration). The tone is serious and authoritative — this is a scientific instrument, not a game — but carries a warmth and personality through its retro character that makes dense data feel inviting rather than intimidating.

---

## 3. Design System — AETHER V4 Adaptation

### 3.1 Color Palette

The AETHER V4 palette replaces the Doc 08 color system while maintaining semantic mapping.

#### Background & Surface Colors

| Token | Hex | Purpose | Doc 08 Equivalent |
|-------|-----|---------|-------------------|
| `--bg-void` | #0a0a0f | Primary background, deepest surface | Deep Space Black #000000 |
| `--bg-surface` | #0d0d14 | Panel backgrounds, card surfaces | Void #050510 |
| `--bg-elevated` | #12121a | Elevated panels, modals, dropdowns | Deep Space Black #0f172a |
| `--bg-hover` | #1a1a24 | Hover states on surfaces | Surface Tint #1e293b |
| `--border-default` | #2a2a3a | Default borders, dividers | rgba(203,213,225,0.1) |
| `--border-active` | #3a3a4a | Active/focused borders | rgba(203,213,225,0.2) |

#### Accent Colors (Neon Spectrum)

| Token | Hex | Glow Shadow | Semantic Purpose | Doc 08 Equivalent |
|-------|-----|------------|-----------------|-------------------|
| `--accent-pink` | #ff6b9d | 0 0 8px #ff6b9d40 | Primary CTA, interactive highlights, navigation | Cosmic Blue #2563eb |
| `--accent-cyan` | #00e5ff | 0 0 8px #00e5ff40 | Data values, measurements, coordinates | Cosmic Blue #3b82f6 |
| `--accent-purple` | #c084fc | 0 0 8px #c084fc40 | Secondary accents, filters, categories | Nebula Purple #8b5cf6 |
| `--accent-amber` | #fbbf24 | 0 0 8px #fbbf2440 | Labels, warnings, discovery markers | Supernova Gold #f59e0b |
| `--accent-green` | #4ade80 | 0 0 8px #4ade8040 | Success, active, verified, loaded | Aurora Green #10b981 |
| `--accent-orange` | #fb923c | 0 0 6px #fb923c40 | Warning states, pending, caution | Solar Orange #f97316 |
| `--accent-red` | #f87171 | 0 0 6px #f8717140 | Error, critical, danger | Red Giant #ef4444 |

#### Text Colors

| Token | Hex | Purpose |
|-------|-----|---------|
| `--text-primary` | #e8e8f0 | Primary text, headings |
| `--text-secondary` | #a0a0b8 | Secondary text, descriptions |
| `--text-tertiary` | #6a6a80 | Muted text, disabled labels |
| `--text-data` | #00e5ff | Data values (with cyan glow) |
| `--text-label` | #fbbf24 | Category labels (with amber glow) |

### 3.2 Typography

The AETHER V4 type system replaces Inter/JetBrains Mono with a three-font stack optimized for the retro-futuristic aesthetic.

#### Font Stack

| Role | Font | Weights | Use Case |
|------|------|---------|----------|
| **Display** | Press Start 2P | 400 | Major headings, panel titles, mode labels, entity names at large sizes. The pixel font establishes the retro identity. |
| **UI** | Space Mono | 400, 700 | All body text, descriptions, button labels, navigation text. Monospace character provides uniform terminal feel. |
| **Data** | IBM Plex Mono | 400, 600 | Scientific data values, coordinates (RA/Dec), measurements, technical readouts. Optimized for tabular data legibility. |

#### Type Scale

| Role | Font | Size | Weight | Line Height | Letter Spacing | Glow |
|------|------|------|--------|-------------|----------------|------|
| **H1 — Screen Title** | Press Start 2P | 20px | 400 | 1.4 (28px) | 2px | 0 0 10px accent-pink |
| **H2 — Section Title** | Press Start 2P | 14px | 400 | 1.4 (20px) | 1.5px | 0 0 8px accent-cyan |
| **H3 — Panel Title** | Press Start 2P | 11px | 400 | 1.4 (15px) | 1px | 0 0 6px accent-purple |
| **H4 — Subsection** | Space Mono | 14px | 700 | 1.5 (21px) | 0.5px | none |
| **Body** | Space Mono | 13px | 400 | 1.6 (21px) | 0px | none |
| **Body Small** | Space Mono | 11px | 400 | 1.5 (17px) | 0.3px | none |
| **Data Value** | IBM Plex Mono | 13px | 600 | 1.4 (18px) | 0px | 0 0 6px accent-cyan |
| **Data Label** | IBM Plex Mono | 10px | 400 | 1.5 (15px) | 1px | 0 0 4px accent-amber |
| **Caption** | Space Mono | 10px | 400 | 1.5 (15px) | 0.5px | none |
| **Button** | Space Mono | 11px | 700 | 1.0 | 1px | inherits button color |

#### Typographic Rules (AETHER V4 Specific)

All text uppercase for Press Start 2P usage (H1, H2, H3). Body text in Space Mono uses sentence case. Data values always use IBM Plex Mono with tabular figures enabled. All panel header text includes a geometric separator line below (1px solid, 50% opacity of header glow color). Maximum line length for body text: 65 characters. Data values are right-aligned within their columns. Units are displayed in `--text-tertiary` color immediately after the value with no space (e.g., `1.496AU` not `1.496 AU`).

### 3.3 Spacing & Grid

Base unit: **4px** (unchanged from Doc 08).

| Token | Value | Use Case |
|-------|-------|----------|
| `--space-1` | 4px | Micro gaps, icon-to-text, tight grouping |
| `--space-2` | 8px | Component internal padding, small gaps |
| `--space-3` | 12px | Standard panel padding, row gaps |
| `--space-4` | 16px | Section gaps, panel margins |
| `--space-5` | 24px | Large section gaps |
| `--space-6` | 32px | Major section spacing |
| `--space-8` | 48px | Screen-level spacing |

#### Layout Grid

The 3D viewport occupies the full screen. All UI elements are overlaid in fixed-position zones:

```
┌──────────────────────────────────────────────────────────────────────┐
│ [TL: System Bar]                              [TR: Mode / Settings] │
│                                                                      │
│ [LEFT: Navigation      ┌─────────────────────┐     RIGHT: Entity   │
│  Panel / Object        │                     │     Info Panel /     │
│  List / Filters]       │   3D VIEWPORT       │     Data Readout]    │
│                        │   (FULL SCREEN)      │                      │
│                        │                     │                      │
│                        └─────────────────────┘                      │
│                                                                      │
│ [BL: Scale / Coords]   [BC: Time Control]    [BR: Quick Actions]   │
└──────────────────────────────────────────────────────────────────────┘
```

**Zone Specifications:**

| Zone | Position | Max Width | Max Height | Trigger |
|------|----------|-----------|------------|---------|
| TL — System Bar | top: 0, left: 0 | 100% | 48px | Always visible |
| LEFT — Nav Panel | top: 48px, left: 0 | 320px | calc(100vh - 96px) | Toggle or auto |
| RIGHT — Info Panel | top: 48px, right: 0 | 380px | calc(100vh - 96px) | Object selection |
| BL — Scale/Coords | bottom: 0, left: 0 | 300px | 48px | Always visible |
| BC — Time Control | bottom: 0, center | 400px | 48px | Always visible |
| BR — Quick Actions | bottom: 0, right: 0 | 200px | 48px | Always visible |

### 3.4 Panel Chrome (AETHER V4)

All panels follow the terminal panel pattern:

```
┌─ PANEL TITLE ──────────────────────────────────┐
│ ▸ subtitle or category label                    │
│─────────────────────────────────────────────────│
│                                                  │
│  content area                                    │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Panel Specifications:**
- Background: `--bg-surface` (#0d0d14) at 92% opacity
- Backdrop-filter: blur(12px)
- Border: 1px solid `--border-default` (#2a2a3a)
- Border-radius: 2px
- Header: 32px height, Press Start 2P 11px, uppercase, `--text-primary`, bottom border 1px solid at 40% of accent color
- Content padding: 12px
- Corner decoration: Optional 4px square pixel accent at top-left corner (accent color at 60% opacity)
- Shadow: none (depth via border and background contrast)

### 3.5 Overlay Effects

**CRT Scanlines (Global):**
- Pattern: 1px transparent / 1px rgba(0,0,0,0.06) repeating
- Applied as: `::after` pseudo-element on viewport container
- Z-index: 1 (above 3D, below UI panels)
- Pointer-events: none

**Pixel Grid (Global):**
- Pattern: 1px dots at 8px intervals, rgba(255,255,255,0.04)
- Applied as: repeating radial-gradient background on viewport container
- Z-index: 1
- Pointer-events: none

**Phosphor Flicker (Subtle):**
- Animation: opacity oscillation between 0.98 and 1.0
- Duration: 4s, ease-in-out, infinite
- Applied to: panel containers (optional, disabled by default for accessibility)

---

## 4. User Personas & Mode Mapping

### 4.1 Persona-to-Mode Matrix

Each persona maps to a primary application mode. The AETHER V4 design adapts panel density, data depth, and interaction complexity per mode.

| Persona | Doc 04 Name | Primary Mode | Data Depth | Panel Density | Key UI Emphasis |
|---------|-------------|-------------|-----------|---------------|-----------------|
| Space Dreamer | Marcus Chen | Explorer | Simplified | Low (2-3 panels) | Discovery, sharing, visual impact |
| Astronomy Educator | Dr. Sarah Williams | Educator | Adjustable | Medium (3-4 panels) | Annotation, lesson tools, presentation |
| Science Communicator | Alex Rivera | Creator | Technical | Medium-High (4-5 panels) | Camera paths, export, recording |
| Casual Explorer | Jennifer Thompson | Explorer (Casual) | Minimal | Minimal (1-2 panels) | Guided tours, touch gestures, sharing |
| Amateur Astronomer | Robert Patterson | Observer | Full detail | High (5-6 panels) | Catalog search, measurements, planning |
| Researcher | Dr. Priya Kapoor | Research | Maximum | Maximum (6-8 panels) | Data import, analysis, publication export |

### 4.2 Mode Visual Differentiation

Each mode applies a subtle color accent to the System Bar to indicate active context:

| Mode | Bar Accent Color | Bar Label | Icon |
|------|-----------------|-----------|------|
| Explorer | `--accent-pink` #ff6b9d | EXPLORER | ◎ |
| Educator | `--accent-amber` #fbbf24 | EDUCATOR | ⬡ |
| Creator | `--accent-purple` #c084fc | CREATOR | ◈ |
| Observer | `--accent-cyan` #00e5ff | OBSERVER | ⊕ |
| Research | `--accent-green` #4ade80 | RESEARCH | ▽ |

---

## 5. Screen Inventory & Journey Mapping

### 5.1 Complete Screen Inventory

The following table enumerates every unique screen/state across all journeys and maps them to SRS functional requirements.

| # | Screen ID | Screen Name | Journey(s) | Mode(s) | SRS Req |
|---|----------|-------------|-----------|---------|---------|
| 1 | S-1.0 | Landing Page | J1 | All | F-WEB-001 |
| 2 | S-1.1 | Loading State | J1, J2, J3, J4, J5, J6 | All | F-PERF-001 |
| 3 | S-1.2 | Mode Selection Wizard | J1 | All | F-MODE-001 |
| 4 | S-1.3 | Onboarding Overlay (First View) | J1, J4 | Explorer | F-ONBOARD-001 |
| 5 | S-2.0 | Main Viewport — Solar System Default | J1, J2, J4 | All | F-NAV-001 |
| 6 | S-2.1 | Main Viewport — Stellar Neighborhood | J1, J5 | All | F-NAV-002 |
| 7 | S-2.2 | Main Viewport — Milky Way | J1, J5 | All | F-NAV-003 |
| 8 | S-2.3 | Main Viewport — Local Group | J6 | Research | F-NAV-004 |
| 9 | S-2.4 | Main Viewport — Galaxy Clusters | J6 | Research | F-NAV-005 |
| 10 | S-2.5 | Main Viewport — Cosmic Web | J6 | Research | F-NAV-006 |
| 11 | S-2.6 | Main Viewport — Observable Universe | J1 | All | F-NAV-007 |
| 12 | S-3.0 | Entity Info Panel — Compact | J1, J2, J4 | Explorer, Educator | F-INFO-001 |
| 13 | S-3.1 | Entity Info Panel — Full | J3, J5, J6 | Creator, Observer, Research | F-INFO-002 |
| 14 | S-3.2 | Entity Info Panel — Comparison Mode | J2, J5 | Educator, Observer | F-INFO-003 |
| 15 | S-4.0 | Search Interface — Quick Search | J1, J4 | Explorer | F-SEARCH-001 |
| 16 | S-4.1 | Search Interface — Advanced Catalog | J5, J6 | Observer, Research | F-SEARCH-002 |
| 17 | S-4.2 | Search Results — List View | J5, J6 | Observer, Research | F-SEARCH-003 |
| 18 | S-5.0 | Time Control Panel | J1, J2, J3 | All | F-TIME-001 |
| 19 | S-5.1 | Time Control — Educator Presets | J2 | Educator | F-TIME-002 |
| 20 | S-6.0 | Guided Tour — Selection | J1, J4 | Explorer | F-TOUR-001 |
| 21 | S-6.1 | Guided Tour — Active (HUD overlay) | J1, J4 | Explorer | F-TOUR-002 |
| 22 | S-6.2 | Guided Tour — Educator Version | J2 | Educator | F-TOUR-003 |
| 23 | S-7.0 | Settings Panel | All | All | F-SET-001 |
| 24 | S-7.1 | Settings — Performance | All | All | F-SET-002 |
| 25 | S-7.2 | Settings — Audio | All | All | F-AUDIO-001 |
| 26 | S-7.3 | Settings — Accessibility | All | All | F-A11Y-001 |
| 27 | S-8.0 | Sharing Dialog | J1, J3, J4 | Explorer, Creator | F-SHARE-001 |
| 28 | S-8.1 | Screenshot Capture (clean viewport) | J1, J3, J4 | Explorer, Creator | F-SHARE-002 |
| 29 | S-9.0 | Bookmarks Panel | J1, J5 | Explorer, Observer | F-BOOK-001 |
| 30 | S-10.0 | Annotation Toolbar | J2 | Educator | F-ANNOT-001 |
| 31 | S-10.1 | Annotation — Drawing Mode | J2 | Educator | F-ANNOT-002 |
| 32 | S-11.0 | Creator — Camera Path Editor | J3 | Creator | F-CAM-001 |
| 33 | S-11.1 | Creator — Timeline / Keyframe | J3 | Creator | F-CAM-002 |
| 34 | S-11.2 | Creator — Export Dialog | J3 | Creator | F-EXPORT-001 |
| 35 | S-11.3 | Creator — Recording Controls HUD | J3 | Creator | F-EXPORT-002 |
| 36 | S-12.0 | Observer — Measurement Tools | J5 | Observer | F-MEAS-001 |
| 37 | S-12.1 | Observer — Observability Calculator | J5 | Observer | F-OBS-001 |
| 38 | S-12.2 | Observer — Catalog Browser | J5 | Observer | F-CAT-001 |
| 39 | S-12.3 | Observer — Observation Log | J5 | Observer | F-LOG-001 |
| 40 | S-13.0 | Research — Data Import Wizard | J6 | Research | F-IMPORT-001 |
| 41 | S-13.1 | Research — Custom Catalog Overlay | J6 | Research | F-IMPORT-002 |
| 42 | S-13.2 | Research — Analysis Dashboard | J6 | Research | F-ANAL-001 |
| 43 | S-13.3 | Research — Publication Export | J6 | Research | F-PUBEX-001 |
| 44 | S-14.0 | Educator — Classroom Mode | J2 | Educator | F-CLASS-001 |
| 45 | S-14.1 | Educator — Student Sync View | J2 | Educator | F-CLASS-002 |
| 46 | S-14.2 | Educator — Lesson Plan Builder | J2 | Educator | F-LESSON-001 |
| 47 | S-15.0 | Fullscreen / Presentation Mode | J2, J3 | Educator, Creator | F-FULL-001 |
| 48 | S-16.0 | Error State — WebGL Unsupported | All | All | F-ERR-001 |
| 49 | S-16.1 | Error State — Connection Lost | All | All | F-ERR-002 |
| 50 | S-16.2 | Empty State — No Results | All | All | F-ERR-003 |
| 51 | S-17.0 | Interactive Toggle Panel | All | All | F-TOGGLE-001 |
| 52 | S-17.1 | Toggle Feature — Per Entity | All | All | F-TOGGLE-002 |

### 5.2 Journey-to-Screen Flow Diagrams

**Journey 1 (First-Time Discovery):**
S-1.0 → S-1.1 → S-1.2 → S-1.3 → S-2.0 → S-3.0 → S-5.0 → S-8.0 → S-2.2 → S-6.0 → S-6.1 → S-9.0

**Journey 2 (Classroom Lesson):**
S-1.1 → S-14.0 → S-2.0 → S-3.2 → S-5.1 → S-10.0 → S-10.1 → S-15.0 → S-6.2 → S-14.1

**Journey 3 (Content Creation):**
S-1.1 → S-2.0 → S-3.1 → S-11.0 → S-11.1 → S-11.3 → S-11.2 → S-8.0 → S-8.1 → S-15.0

**Journey 4 (Casual Exploration):**
S-1.0 → S-1.1 → S-1.3 → S-6.0 → S-6.1 → S-2.0 → S-3.0 → S-8.0 → S-4.0

**Journey 5 (Observation Planning):**
S-1.1 → S-12.2 → S-4.1 → S-4.2 → S-12.1 → S-3.1 → S-12.0 → S-12.3 → S-9.0

**Journey 6 (Research Visualization):**
S-1.1 → S-13.0 → S-13.1 → S-2.3 → S-3.1 → S-13.2 → S-13.3 → S-4.1

---

## 6. Journey 1: First-Time Discovery — Screen Designs

### Screen S-1.0: Landing Page

**Context:** First touchpoint. User arrives from external link (Reddit, social media, article). Must communicate value proposition and launch the experience with zero friction.

**AETHER V4 Treatment:**

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ┌─ COSMOS EXPLORER ────────────────────────────────────────────────┐   │
│  │                                                                    │   │
│  │  bg: animated star particles on #0a0a0f                           │   │
│  │  CRT scanlines overlay (opacity 0.04)                             │   │
│  │  Pixel grid dots visible in dark areas                            │   │
│  │                                                                    │   │
│  │         ░░ COSMOS EXPLORER ░░                                     │   │
│  │         (Press Start 2P, 24px, #ff6b9d, glow)                    │   │
│  │                                                                    │   │
│  │         THE UNIVERSE DECODED                                      │   │
│  │         (Space Mono 14px, #a0a0b8)                               │   │
│  │                                                                    │   │
│  │         Explore 96 entity types across 9 scales                   │   │
│  │         of the observable universe.                                │   │
│  │         Real data. No account. Free.                              │   │
│  │         (Space Mono 12px, #6a6a80)                               │   │
│  │                                                                    │   │
│  │         ┌─────────────────────────────────┐                      │   │
│  │         │ ▸ INITIALIZE EXPLORER           │                      │   │
│  │         │ (Space Mono 12px bold, #0a0a0f  │                      │   │
│  │         │  bg: #ff6b9d, glow: 0 0 20px)   │                      │   │
│  │         └─────────────────────────────────┘                      │   │
│  │                                                                    │   │
│  │         ◎ 100,000+ stars    ◎ NASA/ESA data                      │   │
│  │         ◎ 96 entity types   ◎ 9 cosmic scales                    │   │
│  │         (IBM Plex Mono 10px, #4ade80)                            │   │
│  │                                                                    │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─ CAPABILITIES ───────────────────────────────────────────────────┐   │
│  │                                                                    │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │   │
│  │  │ ◎ EXPLORE    │  │ ⬡ LEARN     │  │ ◈ CREATE     │           │   │
│  │  │ Navigate 9   │  │ Real NASA   │  │ Export 4K    │           │   │
│  │  │ cosmic       │  │ data for    │  │ footage and  │           │   │
│  │  │ scales in    │  │ 96 entity   │  │ publication  │           │   │
│  │  │ real-time    │  │ types       │  │ figures      │           │   │
│  │  │ 3D           │  │             │  │              │           │   │
│  │  │ (#00e5ff     │  │ (#fbbf24    │  │ (#c084fc     │           │   │
│  │  │  border)     │  │  border)    │  │  border)     │           │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘           │   │
│  │                                                                    │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌─ SYSTEM ─────────────────────────────────────────────────────────┐   │
│  │  Chrome 90+ | Firefox 88+ | Safari 14+ | Edge 90+                │   │
│  │  WebGL 2.0 required | Three.js r184                              │   │
│  │  (IBM Plex Mono 10px, #6a6a80)                                   │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Component Specifications:**

Hero Section:
- Full viewport height (100vh), display: flex, center alignment
- Background: #0a0a0f with animated particle starfield (Three.js, 500 stars, 0.5-1.5px, white at 20-60% opacity)
- CRT scanlines: pseudo-element, repeating-linear-gradient
- Title: Press Start 2P 24px, `--accent-pink`, text-shadow: 0 0 20px #ff6b9d60, 0 0 40px #ff6b9d20
- Subtitle: Space Mono 14px, `--text-secondary`
- CTA button: 240px × 48px, bg `--accent-pink`, color #0a0a0f, border: none, border-radius: 2px, box-shadow: 0 0 20px #ff6b9d40, hover: box-shadow 0 0 30px #ff6b9d60 + scale(1.02), transition: 200ms ease
- Feature badges: IBM Plex Mono 10px, `--accent-green`, arranged in 2×2 grid with 16px gap

Capability Cards (3):
- Width: calc(33.333% - 16px), min-height: 160px
- Background: `--bg-surface` at 90% opacity, backdrop-filter: blur(8px)
- Border: 1px solid (card-specific accent color at 30% opacity)
- Padding: 16px
- Icon: geometric symbol, 16px, card accent color
- Title: Space Mono 12px bold, uppercase, card accent color
- Body: Space Mono 11px, `--text-secondary`
- Hover: border opacity → 60%, subtle glow of accent color

**SRS Requirements Covered:** F-WEB-001 (Landing page), F-WEB-002 (Browser compatibility display), F-PERF-001 (Loading indication), HW-001 (System requirements communication)

---

### Screen S-1.1: Loading State

**AETHER V4 Treatment:**

The loading screen presents as a terminal boot sequence — lines of initialization text scroll upward as systems come online, with a horizontal progress bar below.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            bg: #0a0a0f                                   │
│                     CRT scanlines + pixel grid                           │
│                                                                          │
│           ░░ COSMOS EXPLORER v2.0 ░░                                    │
│           (Press Start 2P 14px, #ff6b9d, glow)                          │
│                                                                          │
│           > Initializing WebGL 2.0 context......... OK                  │
│           > Loading Three.js r184 engine............ OK                  │
│           > Fetching stellar database (117,955)..... ██████░░ 72%       │
│           > Rendering solar system geometry......... PENDING             │
│           > Calibrating ICRS J2000.0 frame......... PENDING             │
│           (IBM Plex Mono 11px, #4ade80 for OK, #fbbf24 for active,     │
│            #6a6a80 for PENDING)                                          │
│                                                                          │
│           ┌────────────────────────────────────────┐                    │
│           │██████████████████████░░░░░░░░░░░░░░░░░│ 72%                │
│           └────────────────────────────────────────┘                    │
│           (bar: 300px × 6px, fill: gradient #ff6b9d → #c084fc,         │
│            bg: #2a2a3a, border-radius: 1px)                             │
│                                                                          │
│           EST: 2.4s remaining                                           │
│           (Space Mono 10px, #6a6a80)                                    │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Boot text lines appear sequentially (120ms delay between lines)
- Each line: IBM Plex Mono 11px, starts in `--accent-amber` while loading, transitions to `--accent-green` with "OK" on completion
- Progress bar: 300px × 6px, background `--border-default`, fill linear-gradient(90deg, #ff6b9d, #c084fc), smooth width transition
- Terminal cursor (blinking `█`) at the end of the active line, 800ms blink cycle
- Once 100%, screen fades to mode selection (300ms fade)
- Performance target: total load ≤ 4 seconds on desktop, ≤ 8 seconds on mobile (SRS F-PERF-001)

---

### Screen S-1.2: Mode Selection Wizard

**Context:** First-time users select their primary mode. The selection configures panel density, data depth, toolbar composition, and default behaviors.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            bg: #0a0a0f                                   │
│                                                                          │
│           ░░ SELECT PRIMARY MODE ░░                                     │
│           (Press Start 2P 16px, #e8e8f0)                                │
│                                                                          │
│           Choose how you want to explore the cosmos.                    │
│           You can switch modes at any time.                             │
│           (Space Mono 12px, #a0a0b8)                                    │
│                                                                          │
│  ┌─ ◎ EXPLORER ──────┐  ┌─ ⬡ EDUCATOR ──────┐  ┌─ ◈ CREATOR ───────┐ │
│  │ Discover, explore  │  │ Teach, annotate    │  │ Record, export    │ │
│  │ and share the     │  │ and present the    │  │ and publish       │ │
│  │ cosmos freely     │  │ cosmos in class    │  │ cinematic views   │ │
│  │                   │  │                    │  │                   │ │
│  │ border: #ff6b9d   │  │ border: #fbbf24    │  │ border: #c084fc   │ │
│  └───────────────────┘  └────────────────────┘  └───────────────────┘ │
│                                                                          │
│  ┌─ ⊕ OBSERVER ──────┐  ┌─ ▽ RESEARCH ──────┐                         │
│  │ Measure, catalog   │  │ Analyze, import    │                         │
│  │ and plan           │  │ and publish data   │                         │
│  │ observations       │  │ from catalogs      │                         │
│  │                    │  │                    │                         │
│  │ border: #00e5ff    │  │ border: #4ade80    │                         │
│  └────────────────────┘  └────────────────────┘                         │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Mode Card Specifications:**
- Width: 220px, Height: 140px
- Background: `--bg-surface`, border: 2px solid (mode accent at 40%)
- Hover: border opacity → 80%, background: mode accent at 8%, box-shadow: 0 0 12px (mode accent at 20%)
- Selected: border opacity → 100%, corner pixel accent fills, pulsing glow
- Icon: geometric symbol, Press Start 2P 14px, mode accent color
- Title: Space Mono 13px bold, `--text-primary`
- Description: Space Mono 11px, `--text-secondary`
- Transition: 200ms ease for all state changes
- Layout: flex-wrap, centered, 16px gap
- After selection: 400ms scale(1.05) + glow animation, then transition to S-1.3 or S-2.0

**SRS Requirements:** F-MODE-001 (Mode selection), F-MODE-002 (Mode persistence), F-ONBOARD-001 (First-time setup)

---

### Screen S-1.3: Onboarding Overlay (First View)

**Context:** After mode selection, user sees the 3D viewport for the first time with a minimal onboarding tooltip. The overlay teaches basic interactions without blocking the view.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ┌─ SYSTEM ─── COSMOS EXPLORER ─────── [◎ EXPLORER] ─── [⚙] [?] ──┐  │
│  │ (System Bar, 48px, bg: #0d0d14, border-bottom: 1px #2a2a3a)     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│                    3D VIEWPORT — Solar System Default                    │
│                    (Stars, Sun, 8 planets, orbital lines)               │
│                                                                          │
│  ┌─ CONTROLS ──────────────────────┐                                    │
│  │                                  │                                    │
│  │  ◎ DRAG to rotate view          │                                    │
│  │  ◎ SCROLL to zoom               │                                    │
│  │  ◎ CLICK any object for data    │                                    │
│  │                                  │                                    │
│  │  [▸ START GUIDED TOUR]          │                                    │
│  │  [✕ DISMISS]                    │                                    │
│  │                                  │                                    │
│  │  (Space Mono 11px, positioned    │                                    │
│  │   bottom-left, 280px width,      │                                    │
│  │   bg: #0d0d14 at 95%,           │                                    │
│  │   border: 1px #ff6b9d40)        │                                    │
│  └──────────────────────────────────┘                                    │
│                                                                          │
│  SOLAR SYSTEM                    ──── NOW ────            [📷] [↗] [⛶] │
│  1.0 AU from Sol                 [◄ ■ ►►]                               │
│  (Scale/coords, bottom-left)     (Time control, bottom-center)          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Onboarding panel: 280px width, positioned 16px from bottom-left
- Auto-dismiss after user performs first drag interaction
- Staggered appearance: each instruction line fades in with 200ms delay
- "Start Guided Tour" button: `--accent-pink` text, no background, underline on hover
- "Dismiss" button: `--text-tertiary`, no background

**SRS Requirements:** F-ONBOARD-001, F-ONBOARD-002 (Progressive disclosure), F-NAV-001 (Default view)

---

### Screen S-2.0: Main Viewport — Solar System Default

**Context:** The primary exploration view. The 3D viewport fills the screen with overlaid UI zones. This screen specification covers the viewport layout and persistent UI elements visible across all journeys.

**AETHER V4 Layout:**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ┌─ SYS ──── COSMOS EXPLORER ──── [🔍____] ── [◎ EXPLORER] ── [⚙] ──┐ │
│ └──────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌────────────┐                                         ┌──────────────┐ │
│ │─ OBJECTS ──│                                         │─ ENTITY ─────│ │
│ │            │              ☀                           │              │ │
│ │ ▸ Mercury  │         ●  ●  ●  ●                     │ SATURN       │ │
│ │ ▸ Venus    │      ●              ●                   │──────────────│ │
│ │ ▸ Earth    │    ●                  ●                 │ TYPE  Gas    │ │
│ │ ▸ Mars     │                        ●                │       Giant  │ │
│ │ ▸ Jupiter  │          3D VIEWPORT                    │ DIST  9.54AU│ │
│ │ ▸ Saturn ◄ │          (WebGL 2.0)                    │ MASS  95.2M⊕│ │
│ │ ▸ Uranus   │                                         │ RAD   9.45R⊕│ │
│ │ ▸ Neptune  │                                         │ TEMP  134K  │ │
│ │            │                                         │ MOONS 146   │ │
│ │ (Space Mono│                                         │ RINGS Yes   │ │
│ │  11px,     │                                         │──────────────│ │
│ │  #a0a0b8,  │                                         │ ORBIT       │ │
│ │  selected: │                                         │ Period 29.5y│ │
│ │  #00e5ff)  │                                         │ Ecc    0.054│ │
│ │            │                                         │ Incl   2.49°│ │
│ │ [TOGGLES▾] │                                         │──────────────│ │
│ └────────────┘                                         │ [▸ DETAILS]  │ │
│                                                         │ [★ BOOKMARK] │ │
│                                                         │ [↗ SHARE]    │ │
│ SOLAR SYSTEM > SATURN        ─── 2026-04-19 ──        └──────────────┘ │
│ 9.54AU from Sol              [◄ ■ 1x ►►]        [📷] [↗] [⛶]         │
└──────────────────────────────────────────────────────────────────────────┘
```

**System Bar (48px, always visible):**
- Background: `--bg-surface` at 95%, backdrop-filter: blur(12px)
- Border-bottom: 1px solid `--border-default`
- Left: "SYS" label (Press Start 2P 8px, `--accent-green`), app name (Space Mono 12px bold, `--text-primary`)
- Center: Search input (200px, Space Mono 11px, `--bg-elevated`, border: 1px `--border-active`)
- Right: Mode indicator (mode accent color badge), Settings gear icon, Help "?" icon

**Left Panel — Object List (320px max, collapsible):**
- Header: Press Start 2P 11px, `--text-primary`, "OBJECTS"
- List items: Space Mono 11px, `--text-secondary`, 32px row height
- Selected item: `--accent-cyan` text, left border 2px `--accent-cyan`, bg `--accent-cyan` at 8%
- Hover: bg `--bg-hover`
- Scroll: custom scrollbar (4px wide, `--border-active` thumb, `--bg-surface` track)
- Toggle section at bottom: collapsible "TOGGLES" for entity-specific features (Doc 22)

**Right Panel — Entity Info (380px max, slides in on selection):**
- Header: Press Start 2P 11px, entity name, `--text-primary`, border-bottom with entity category accent
- Data rows: label (IBM Plex Mono 10px, `--text-label`, uppercase) + value (IBM Plex Mono 13px, `--text-data`)
- Section dividers: 1px solid `--border-default` with 8px vertical margin
- Action buttons at bottom: Space Mono 11px bold, `--accent-pink` text, 36px height, no background, underline on hover
- Animation: slide from right 300ms cubic-bezier(0.4, 0, 0.2, 1)

**Bottom Bar:**
- Left: Breadcrumb (Space Mono 10px, `--text-tertiary`, ">" separator in `--accent-purple`), current distance
- Center: Time control (date display + playback buttons, 200px width)
- Right: Quick action icons (screenshot, share, fullscreen), 32px each, `--text-secondary`, hover: `--accent-pink`

**SRS Requirements:** F-NAV-001 through F-NAV-007, F-INFO-001, F-INFO-002, F-SEARCH-001, F-TIME-001, F-TOGGLE-001, F-TOGGLE-002, D-001 (Data display accuracy)

---

### Screen S-3.0: Entity Info Panel — Compact (Explorer Mode)

**Context:** When a casual user clicks on a celestial object in Explorer mode. Displays essential information without overwhelming.

**Data Fields Shown (Explorer/Compact):**
- Entity name + ENT ID (e.g., ENT-2006 for Saturn)
- Category icon (◎ Star, ⬡ Planet, ◈ Galaxy, ⊕ Moon, ▽ Nebula, ◉ Small Body, ⊙ Exotic)
- Type classification (e.g., "Gas Giant — Hydrogen-Helium")
- Distance from current reference point
- 3-4 key physical properties (mass, radius, temperature, notable feature)
- One "interesting fact" line
- Action bar: Details, Bookmark, Share

**Typography:**
- Name: Press Start 2P 14px, `--text-primary`, glow: 0 0 8px entity-category-accent
- Data labels: IBM Plex Mono 10px, `--text-label`
- Data values: IBM Plex Mono 13px, `--text-data`
- Fact line: Space Mono 11px italic, `--text-secondary`
- Width: 320px
- Total height: ~280px (varies with content)

---

### Screen S-3.1: Entity Info Panel — Full (Observer/Research Mode)

**Context:** Full data readout for power users. Displays all available properties for the selected entity type.

**Data Sections (expandable):**

Section 1 — IDENTIFICATION: Name, ENT ID, catalog IDs (Hipparcos, NGC, Messier, etc.), constellation, discovery info
Section 2 — POSITION: RA/Dec (ICRS J2000.0), galactic coordinates, distance (multiple units), proper motion
Section 3 — PHYSICAL: Mass, radius, density, temperature, luminosity, spectral class, age
Section 4 — ORBITAL: Semi-major axis, eccentricity, period, inclination, longitude of ascending node
Section 5 — ATMOSPHERE/COMPOSITION: Chemical composition percentages, atmospheric layers
Section 6 — FEATURES: Moons, rings, magnetic field, notable surface features
Section 7 — TOGGLES: Entity-specific interactive toggles from Doc 22 (checkboxes/sliders)
Section 8 — SOURCES: Data origin citations (Gaia DR3, JPL Horizons, SDSS DR18)

**Panel Width:** 380px. Each section collapsible with Press Start 2P 9px header. Total scrollable height varies (600-1200px depending on entity complexity).

**SRS Requirements:** F-INFO-001, F-INFO-002, F-INFO-003, D-001 through D-008 (Data accuracy per entity category)

---

## 7. Journey 2: Classroom Lesson — Screen Designs

### Screen S-14.0: Classroom Mode

**Context:** Educator activates Classroom Mode. The interface simplifies, auto-mutes sound, hides social sharing, and adds annotation/presentation tools.

**AETHER V4 Treatment:**

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ┌─ SYS ── COSMOS EXPLORER ────── [🔍____] ── [⬡ EDUCATOR] ── [⚙] ──┐ │
│ │ CLASSROOM MODE ACTIVE   |  Students: [Sync ▸]   |  [Present ⛶]    │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌─ LESSON ───┐                                    ┌─ ANNOTATION ──────┐ │
│ │            │                                    │                    │ │
│ │ Topic:     │              3D VIEWPORT           │ ✏ Draw            │ │
│ │ Kepler's   │              (WebGL 2.0)           │ T  Text            │ │
│ │ Laws       │                                    │ → Arrow            │ │
│ │            │            ☀                        │ ○ Circle           │ │
│ │ Step 1/4:  │       ●  ●  ●                      │ □ Rectangle        │ │
│ │ Show inner │                                    │ ╳ Clear all        │ │
│ │ planets    │                                    │                    │ │
│ │            │                                    │ Color:             │ │
│ │ [▸ Next]   │                                    │ ● ● ● ● ●         │ │
│ │ [◄ Back]   │                                    │ (5 neon colors)    │ │
│ │            │                                    │                    │ │
│ │ Notes:     │                                    │ Width: ─●───       │ │
│ │ Ask about  │                                    │ (1-5px slider)     │ │
│ │ orbital    │                                    │                    │ │
│ │ periods    │                                    └────────────────────┘ │
│ └────────────┘                                                          │
│                                                                          │
│ SOLAR SYSTEM > INNER PLANETS     ─── 2026-04-19 ──     [📷] [⛶]      │
│ 1.0AU from Sol                   [◄ ■ 1yr/s ►►]                        │
└──────────────────────────────────────────────────────────────────────────┘
```

**Educator-Specific Elements:**
- System Bar extended: "CLASSROOM MODE ACTIVE" badge in `--accent-amber`, Student Sync button, Presentation mode button
- Left Panel: Lesson navigator replaces object list. Shows lesson title, current step, navigation buttons, teacher notes
- Right Panel: Annotation toolbar replaces entity info (entity info accessible via object click)
- Sound: auto-muted on activation (SRS F-AUDIO-002)
- Social sharing: hidden in classroom mode
- Annotation drawings: rendered as SVG overlay on the 3D viewport, z-index 2
- Time control: presets added — "Show 1 Earth year", "Show 10 years", "Show 100 years"

**SRS Requirements:** F-CLASS-001, F-CLASS-002, F-ANNOT-001, F-ANNOT-002, F-TIME-002, F-LESSON-001

---

### Screen S-3.2: Comparison Mode

**Context:** Educator or Observer selects two entities for side-by-side data comparison. Critical for teaching Kepler's Laws, scale comparisons, and stellar evolution.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ┌─ COMPARE ──────────────────────────────────────────────────────────┐ │
│  │                                                                      │ │
│  │  ┌─ ENTITY A ──────────┐     ┌─ ENTITY B ──────────┐              │ │
│  │  │ EARTH               │ vs  │ JUPITER              │              │ │
│  │  │ ENT-2003            │     │ ENT-2005             │              │ │
│  │  │─────────────────────│     │──────────────────────│              │ │
│  │  │ MASS    1.0 M⊕     │     │ MASS    317.8 M⊕    │  ████████   │ │
│  │  │ RADIUS  1.0 R⊕     │     │ RADIUS  11.21 R⊕    │  ████████   │ │
│  │  │ PERIOD  365.25 d   │     │ PERIOD  4,332.6 d   │  ██████     │ │
│  │  │ DIST    1.0 AU     │     │ DIST    5.2 AU      │  ████       │ │
│  │  │ TEMP    288 K      │     │ TEMP    165 K       │  ██         │ │
│  │  │ MOONS   1          │     │ MOONS   95          │  ████████   │ │
│  │  │                     │     │                      │              │ │
│  │  │ (values: cyan glow) │     │ (values: cyan glow)  │ (bar chart  │ │
│  │  │                     │     │                      │  in purple)  │ │
│  │  └─────────────────────┘     └──────────────────────┘              │ │
│  │                                                                      │ │
│  │  [SWAP] [ADD 3RD] [EXPORT CSV] [CLOSE]                             │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Modal overlay: centered, max-width 800px, max-height 600px
- Background: `--bg-elevated` at 95%, backdrop-filter: blur(16px)
- Each entity column: 320px
- Bar chart column: 120px, horizontal bars in `--accent-purple` showing relative magnitude
- Values with significant difference (>10×): highlighted with `--accent-amber` background flash
- All data values: IBM Plex Mono 13px, `--text-data`

**SRS Requirements:** F-INFO-003 (Comparison mode), F-EDU-001 (Scale comparison)

---

## 8. Journey 3: Content Creation — Screen Designs

### Screen S-11.0: Camera Path Editor

**Context:** Creator mode. User defines cinematic camera paths through keyframes for recording video content.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ┌─ SYS ── COSMOS EXPLORER ──── [🔍____] ── [◈ CREATOR] ── [⚙] ────┐  │
│ └──────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│ ┌─ PATH ─────┐                                    ┌─ KEYFRAME ───────┐ │
│ │            │              3D VIEWPORT           │                    │ │
│ │ PATH: Fly  │              (Camera path          │ KF #3 / 8         │ │
│ │ through    │               preview line         │──────────────────│ │
│ │ Saturn     │               shown as dotted      │ POS               │ │
│ │ Rings      │               cyan line)           │  X: 12.4 AU      │ │
│ │            │                                    │  Y: -0.2 AU      │ │
│ │ Keyframes: │            ●─ ─ ─●─ ─ ─●         │  Z: 3.1 AU       │ │
│ │ ● KF1 0s  │           ╱               ╲        │ ROT               │ │
│ │ ● KF2 3s  │         ●                   ●      │  Pitch: -12°     │ │
│ │ ◉ KF3 6s  │         (camera path dots)         │  Yaw:   45°      │ │
│ │ ● KF4 9s  │                                    │  Roll:  0°       │ │
│ │ ● KF5 12s │                                    │ FOV: 60°          │ │
│ │ ● KF6 15s │                                    │ EASE: cubic-out   │ │
│ │ ● KF7 18s │                                    │ SPEED: 0.5AU/s    │ │
│ │ ● KF8 21s │                                    │                    │ │
│ │            │                                    │ [SET FROM VIEW]   │ │
│ │ [+ ADD KF] │                                    │ [DELETE KF]       │ │
│ └────────────┘                                    └────────────────────┘ │
│                                                                          │
│ ┌─ TIMELINE ────────────────────────────────────────────────────────────┐ │
│ │  0s     3s     6s     9s     12s    15s    18s    21s               │ │
│ │  ●──────●──────◉──────●──────●──────●──────●──────●                │ │
│ │  ▲ playhead                                                         │ │
│ │  [◄] [▶ PREVIEW] [■ STOP]  Duration: 21s  FPS: 60  Res: 4K       │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Specifications:**
- Timeline bar: full width, 80px height, bg `--bg-surface`, positioned at bottom
- Keyframe dots: 8px circles, `--accent-purple`, selected: `--accent-pink` with glow
- Playhead: vertical line 1px `--accent-pink`, triangle marker
- Path preview: dotted line in viewport, `--accent-cyan` at 60% opacity
- Keyframe data panel: all values editable inline (click to type)
- Preview playback: smooth camera interpolation using cubic bezier easing
- Export settings accessible via S-11.2 dialog

**SRS Requirements:** F-CAM-001 (Camera path definition), F-CAM-002 (Keyframe editing), F-EXPORT-001, F-EXPORT-002

---

### Screen S-11.2: Export Dialog

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ┌─ EXPORT ───────────────────────────────────────────────────────────┐ │
│  │                                                                      │ │
│  │  ░░ EXPORT SETTINGS ░░                                              │ │
│  │  (Press Start 2P 14px, #c084fc)                                     │ │
│  │                                                                      │ │
│  │  FORMAT      ◉ MP4 (H.264)  ○ WebM  ○ PNG Sequence  ○ GIF        │ │
│  │  RESOLUTION  ◉ 3840×2160 (4K)  ○ 1920×1080  ○ 1280×720           │ │
│  │  FRAMERATE   ◉ 60fps  ○ 30fps  ○ 24fps                            │ │
│  │  QUALITY     ─────●──── (High)                                      │ │
│  │  DURATION    21.0s (from camera path)                               │ │
│  │  EST. SIZE   ~248 MB                                                │ │
│  │                                                                      │ │
│  │  ┌───────────────────────────────────────┐                          │ │
│  │  │ INCLUDE                               │                          │ │
│  │  │ ☑ UI overlay     ☑ Entity labels     │                          │ │
│  │  │ ☑ Time stamp     ☐ Watermark         │                          │ │
│  │  │ ☑ Scale bar      ☐ CRT effects       │                          │ │
│  │  └───────────────────────────────────────┘                          │ │
│  │                                                                      │ │
│  │  [▸ BEGIN EXPORT]                    [CANCEL]                       │ │
│  │  (bg: #c084fc, text: #0a0a0f)       (text only, #6a6a80)          │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**SRS Requirements:** F-EXPORT-001 (Video export), F-EXPORT-002 (Image export), F-EXPORT-003 (Format options)

---

## 9. Journey 4: Casual Exploration — Screen Designs

### Screen S-6.0: Guided Tour Selection

**Context:** Casual users (Jennifer Thompson persona) access curated tours designed for low cognitive load and maximum visual impact.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ┌─ GUIDED TOURS ─────────────────────────────────────────────────────┐ │
│  │                                                                      │ │
│  │  ░░ CHOOSE YOUR JOURNEY ░░                                          │ │
│  │  (Press Start 2P 14px, #ff6b9d)                                     │ │
│  │                                                                      │ │
│  │  ┌────────────────────────────────────────────────────────┐         │ │
│  │  │ ◎ COSMIC SCALE VOYAGE                    Duration: 8m │         │ │
│  │  │ From Earth to the edge of the observable universe      │         │ │
│  │  │ Experience 9 orders of magnitude                       │         │ │
│  │  │ (border-left: 3px #ff6b9d)                            │         │ │
│  │  └────────────────────────────────────────────────────────┘         │ │
│  │                                                                      │ │
│  │  ┌────────────────────────────────────────────────────────┐         │ │
│  │  │ ⬡ SOLAR SYSTEM EXPLORER                  Duration: 5m │         │ │
│  │  │ Visit all 8 planets and the Sun                        │         │ │
│  │  │ Learn key facts about our cosmic neighborhood          │         │ │
│  │  │ (border-left: 3px #fbbf24)                            │         │ │
│  │  └────────────────────────────────────────────────────────┘         │ │
│  │                                                                      │ │
│  │  ┌────────────────────────────────────────────────────────┐         │ │
│  │  │ ◈ COLORFUL NEBULAE                       Duration: 6m │         │ │
│  │  │ 5 of the most stunning nebulae in our galaxy           │         │ │
│  │  │ Emission, reflection, and planetary nebulae            │         │ │
│  │  │ (border-left: 3px #c084fc)                            │         │ │
│  │  └────────────────────────────────────────────────────────┘         │ │
│  │                                                                      │ │
│  │  ┌────────────────────────────────────────────────────────┐         │ │
│  │  │ ⊕ EXTREME OBJECTS                        Duration: 7m │         │ │
│  │  │ Black holes, neutron stars, and magnetars              │         │ │
│  │  │ The most extreme phenomena in the universe             │         │ │
│  │  │ (border-left: 3px #00e5ff)                            │         │ │
│  │  └────────────────────────────────────────────────────────┘         │ │
│  │                                                                      │ │
│  │  [✕ CLOSE — EXPLORE FREELY]                                        │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Tour Card Specifications:**
- Width: 100% (max 600px), height: auto (min 72px)
- Background: `--bg-surface`
- Border-left: 3px solid tour accent color
- Padding: 16px
- Title: Space Mono 13px bold, `--text-primary`
- Description: Space Mono 11px, `--text-secondary`
- Duration: IBM Plex Mono 10px, `--text-tertiary`, right-aligned
- Hover: background `--bg-hover`, border-left width → 5px
- Click: tour begins, modal fades, viewport transitions

**SRS Requirements:** F-TOUR-001 (Tour selection), F-TOUR-002 (Tour playback), F-TOUR-003 (Educator tours)

---

## 10. Journey 5: Observation Planning — Screen Designs

### Screen S-12.1: Observability Calculator

**Context:** Amateur astronomer (Robert Patterson persona) plans an observing session. Inputs location and date/time to see which objects are visible.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ┌─ SYS ── COSMOS EXPLORER ──── [🔍____] ── [⊕ OBSERVER] ── [⚙] ───┐  │
│ └──────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│ ┌─ OBSERVABILITY ──────────────────────────────────────────────────────┐ │
│ │                                                                        │ │
│ │  LOCATION  Asheville, NC (35.595°N, 82.551°W)    [CHANGE]            │ │
│ │  DATE      2026-04-19    TIME  21:00 EST          [NOW]               │ │
│ │  LIMITING MAG  6.0       TELESCOPE  8" Reflector  [EDIT]              │ │
│ │                                                                        │ │
│ │  ┌─ VISIBLE TONIGHT ────────────────────────────────────────────────┐ │ │
│ │  │ OBJECT         TYPE        MAG    ALT    AZ     TRANSIT         │ │ │
│ │  │────────────────────────────────────────────────────────────────  │ │ │
│ │  │ M42 Orion Neb  Emission    4.0    42°    SW     19:30          │ │ │
│ │  │ M31 Andromeda  Spiral Gal  3.4    28°    NW     18:45          │ │ │
│ │  │ M45 Pleiades   Open Clust  1.6    55°    W      20:10          │ │ │
│ │  │ M1  Crab Neb   SNR         8.4    62°    S      22:30          │ │ │
│ │  │ Saturn         Gas Giant   0.8    35°    SE     23:15          │ │ │
│ │  │ Jupiter        Gas Giant  -2.1    15°    WSW    18:20          │ │ │
│ │  │ ...                                                              │ │ │
│ │  │ (IBM Plex Mono 11px, cyan values, amber labels)                 │ │ │
│ │  │                                                                  │ │ │
│ │  │ FILTERS: [All] [Messier] [NGC] [Planets] [Stars] [Mag < ___]   │ │ │
│ │  └──────────────────────────────────────────────────────────────────┘ │ │
│ │                                                                        │ │
│ │  [ADD TO PLAN]  [EXPORT LIST]  [SHOW ON MAP]                          │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Table Specifications:**
- Header row: IBM Plex Mono 10px bold, `--text-label`, uppercase
- Data rows: IBM Plex Mono 11px, `--text-data` for values, `--text-secondary` for names
- Row height: 28px, alternate row bg: `--bg-hover` at 30%
- Sortable columns: click header to sort, arrow indicator
- Selected row: left border 2px `--accent-cyan`, bg `--accent-cyan` at 5%
- Filter bar: pill buttons, Space Mono 10px, `--border-default` border, active: `--accent-cyan` border + text

**SRS Requirements:** F-OBS-001 (Observability calculation), F-CAT-001 (Catalog browsing), F-MEAS-001 (Measurement display)

---

## 11. Journey 6: Research Visualization — Screen Designs

### Screen S-13.0: Data Import Wizard

**Context:** Researcher (Dr. Priya Kapoor persona) imports a custom catalog for 3D visualization.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ┌─ DATA IMPORT ──────────────────────────────────────────────────────┐ │
│  │                                                                      │ │
│  │  ░░ IMPORT CATALOG DATA ░░                                          │ │
│  │  (Press Start 2P 14px, #4ade80)                                     │ │
│  │                                                                      │ │
│  │  STEP 1 OF 4: SELECT SOURCE                                        │ │
│  │                                                                      │ │
│  │  ┌────────────────────┐  ┌────────────────────┐                    │ │
│  │  │ ▸ UPLOAD FILE      │  │ ▸ PASTE DATA       │                    │ │
│  │  │ CSV, FITS, JSON    │  │ Paste RA/Dec/z     │                    │ │
│  │  │ (drag & drop)      │  │ from clipboard     │                    │ │
│  │  └────────────────────┘  └────────────────────┘                    │ │
│  │                                                                      │ │
│  │  ┌────────────────────┐  ┌────────────────────┐                    │ │
│  │  │ ▸ QUERY CATALOG    │  │ ▸ LOAD PREVIOUS    │                    │ │
│  │  │ SDSS, Gaia, 2MASS  │  │ Saved imports      │                    │ │
│  │  │ (SQL interface)     │  │ (local storage)    │                    │ │
│  │  └────────────────────┘  └────────────────────┘                    │ │
│  │                                                                      │ │
│  │  STEP 2: MAP COLUMNS                                                │ │
│  │  RA column:    [___ra___▾]                                          │ │
│  │  Dec column:   [___dec__▾]                                          │ │
│  │  Redshift:     [___z____▾]  (optional)                              │ │
│  │  Magnitude:    [___mag__▾]  (optional)                              │ │
│  │  Label:        [___name_▾]  (optional)                              │ │
│  │                                                                      │ │
│  │  STEP 3: PREVIEW (showing 10 of 500 objects)                        │ │
│  │  ┌──────────────────────────────────────────────┐                  │ │
│  │  │ 3D scatter preview with mapped coordinates   │                  │ │
│  │  └──────────────────────────────────────────────┘                  │ │
│  │                                                                      │ │
│  │  STEP 4: CONFIRM & RENDER                                           │ │
│  │  Objects: 500  |  Coord system: ICRS J2000.0  |  Color: by z       │ │
│  │                                                                      │ │
│  │  [▸ RENDER IN VIEWPORT]                  [CANCEL]                   │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**SRS Requirements:** F-IMPORT-001 (Data import), F-IMPORT-002 (Column mapping), F-IMPORT-003 (Format support), F-ANAL-001 (Analysis tools)

---

## 12. Global Components — AETHER V4 Specification

### 12.1 Button Styles

| Variant | Background | Text Color | Border | Glow | Use |
|---------|-----------|-----------|--------|------|-----|
| Primary | `--accent-pink` | #0a0a0f | none | 0 0 12px #ff6b9d40 | Main CTAs |
| Secondary | transparent | `--accent-cyan` | 1px `--accent-cyan` | none | Secondary actions |
| Tertiary | transparent | `--text-secondary` | none | none | Tertiary, dismiss |
| Danger | transparent | `--accent-red` | 1px `--accent-red` | none | Destructive actions |
| Mode-accent | mode color | #0a0a0f | none | 0 0 12px (mode) | Mode-specific CTAs |

**All buttons:** Height 36px, padding 0 16px, Space Mono 11px bold, uppercase, letter-spacing 1px, border-radius 2px, transition 200ms ease, cursor pointer. Hover: opacity 0.85 + subtle scale(1.01). Active: opacity 0.7 + translateY(1px). Disabled: opacity 0.3, pointer-events none.

### 12.2 Form Inputs

- Height: 36px, padding: 0 12px
- Background: `--bg-elevated`
- Border: 1px solid `--border-default`
- Border-radius: 2px
- Font: IBM Plex Mono 12px, `--text-primary`
- Focus: border-color `--accent-cyan`, box-shadow 0 0 8px `--accent-cyan` at 20%
- Placeholder: `--text-tertiary`

### 12.3 Checkboxes & Toggles

Checkbox: 16px × 16px, border 1px `--border-active`, border-radius 1px. Checked: bg `--accent-cyan`, checkmark in #0a0a0f. Focus: cyan glow.

Toggle switch: 36px × 18px, bg `--border-default`, border-radius 2px. Active: bg `--accent-green`, thumb slides right. Transition: 200ms ease.

### 12.4 Slider

Track: 100% width, 4px height, bg `--border-default`, border-radius 1px. Fill: accent color (context-dependent). Thumb: 12px × 12px, bg accent color, border-radius 1px, box-shadow: 0 0 6px accent at 40%. Focus: glow expands to 10px.

### 12.5 Tooltip

Background: `--bg-elevated` at 95%, border: 1px `--border-active`, border-radius: 2px, padding: 8px 12px. Font: Space Mono 10px, `--text-secondary`. Arrow: 6px, matching background. Max-width: 240px. Appear: 400ms delay, fade 150ms.

### 12.6 Scrollbar

Width: 4px, thumb: `--border-active`, track: transparent, border-radius: 2px. Hover: thumb width → 6px, color → `--accent-purple` at 60%.

### 12.7 Context Menu (Right-Click)

Background: `--bg-elevated` at 95%, backdrop-filter: blur(12px), border: 1px `--border-active`, border-radius: 2px. Items: 32px height, Space Mono 11px, `--text-secondary`. Hover: bg `--accent-cyan` at 8%, text `--text-primary`. Separator: 1px `--border-default`, margin 4px 0.

---

## 13. Entity Display System — 96 Entity Types

### 13.1 Entity Category Visual Mapping

Each of the 9 entity categories (Doc 22) receives a dedicated accent color and icon for consistent visual identification across all panels and screens.

| Category | ENT Range | Icon | Accent Color | Entity Count | Example Display |
|----------|-----------|------|-------------|-------------|-----------------|
| Stars | ENT-1000 | ◎ | #fbbf24 (amber) | 31 types | Spectral class, luminosity, temp |
| Planets | ENT-2000 | ⬡ | #00e5ff (cyan) | 27 types | Orbital elements, atmosphere, surface |
| Moons & Satellites | ENT-3000 | ⊕ | #a0a0b8 (silver) | 15 types | Parent body, orbital params, geology |
| Small Bodies | ENT-4000 | ◉ | #fb923c (orange) | 20 types | Orbit class, composition, discovery |
| Nebulae & ISM | ENT-5000 | ▽ | #c084fc (purple) | 14 types | Emission type, extent, ionizing source |
| Galaxies | ENT-6000 | ◈ | #ff6b9d (pink) | 19 types | Morphology, redshift, mass, SFR |
| Large-Scale Structure | ENT-7000 | ⊙ | #4ade80 (green) | 12 types | Scale, member count, mass estimate |
| Exotic Objects | ENT-8000 | ✦ | #f87171 (red) | 16 types | Type-specific extreme properties |

### 13.2 Info Panel Data Template per Category

Each entity category defines a standardized data panel layout. The following specifies which data sections appear for each category in the AETHER V4 full info panel (S-3.1):

**Stars (ENT-1000):**
Sections: Identification (name, catalog IDs, constellation), Position (RA/Dec, galactic coords, distance, parallax), Spectral (class, temperature, B-V index), Physical (mass, radius, luminosity, age), Kinematics (proper motion, radial velocity), Toggles (corona, chromosphere, convection, flares, stellar wind — per Doc 22)

**Planets (ENT-2000):**
Sections: Identification (name, parent star, discovery), Orbital (semi-major axis, eccentricity, period, inclination), Physical (mass, radius, density, gravity), Atmosphere (composition percentages, pressure, temperature profile), Surface (terrain type, features, temperature), Satellites (moon count + names), Rings (if applicable), Toggles (atmosphere layers, surface detail, magnetic field, ring transparency — per Doc 22)

**Moons & Satellites (ENT-3000):**
Sections: Identification (name, parent body, discovery), Orbital (semi-major axis, eccentricity, period, inclination, tidal lock status), Physical (mass, radius, density, albedo), Surface (composition, geological features, craters), Toggles (subsurface ocean, cryovolcanism, tidal heating — per Doc 22)

**Small Bodies (ENT-4000):**
Sections: Identification (designation, orbit class, discovery), Orbital (elements, period, Tisserand parameter), Physical (dimensions, mass, rotation, spectral type), Composition (surface mineralogy, volatile content), Toggles (outgassing, tail, rotation visualization — per Doc 22)

**Nebulae & ISM (ENT-5000):**
Sections: Identification (name, catalog IDs, type), Position (RA/Dec, distance, angular extent), Physical (mass, temperature, density, emission lines), Structure (morphology, ionizing sources, associated clusters), Toggles (emission/absorption toggle, ionization front, dust opacity — per Doc 22)

**Galaxies (ENT-6000):**
Sections: Identification (name, catalog IDs, morphological type), Position (RA/Dec, redshift, distance), Physical (mass, size, luminosity, SFR), Structure (bar presence, spiral arm count, nucleus type), SMBH (estimated mass, activity level), Toggles (spiral arms, dust lanes, star-forming regions, AGN jet — per Doc 22)

**Large-Scale Structure (ENT-7000):**
Sections: Identification (name, type), Position (center coordinates, extent), Scale (physical size, member count, mass estimate), Properties (type-specific: cluster richness, void diameter, filament length), Toggles (member galaxies, dark matter halo, intracluster medium — per Doc 22)

**Exotic Objects (ENT-8000):**
Sections: Identification (name, type, discovery), Position (RA/Dec, distance), Extreme Properties (type-specific: event horizon, spin, magnetic field, jet power), Observational (detection method, multi-messenger data), Toggles (accretion disk, relativistic jet, gravitational lensing, Hawking radiation — per Doc 22)

### 13.3 Toggle Feature UI (Doc 22 Integration)

Each entity's interactive toggles (Doc 22) appear in a dedicated collapsible section at the bottom of the info panel (S-3.1) or in the left panel toggle drawer.

**Toggle Row Layout:**
```
┌────────────────────────────────────────────────┐
│ ☑ ATMOSPHERE LAYERS                 [i]        │
│   Shows stratified atmospheric composition      │
│   (Space Mono 10px, #6a6a80)                   │
├────────────────────────────────────────────────┤
│ ☑ RING TRANSPARENCY    ─●────── 0.7           │
│   Adjusts ring system opacity                   │
├────────────────────────────────────────────────┤
│ ☐ MAGNETIC FIELD LINES                         │
│   Displays dipolar magnetic field vectors       │
└────────────────────────────────────────────────┘
```

- Checkbox toggles: boolean on/off, immediate shader uniform update
- Slider toggles: continuous value, IBM Plex Mono value display, live update
- Toggle label: Space Mono 11px, `--text-primary`
- Toggle description: Space Mono 10px, `--text-tertiary`
- Info icon [i]: tooltip with physics explanation
- State persistence: localStorage per entity per session

**SRS Requirements:** F-TOGGLE-001 (Toggle system), F-TOGGLE-002 (Per-entity toggles), D-001 through D-008 (Data accuracy)

---

## 14. Mode-Specific UI Configurations

### 14.1 Explorer Mode

**Panel density:** Low. Left panel: object list only. Right panel: compact info (S-3.0).
**Toolbar:** Search, Bookmarks, Tours, Share, Screenshot.
**Data depth:** Simplified — no spectral class codes, no orbital elements in degrees, plain English descriptions.
**Special:** Guided tour prompts appear after 30s idle. Social sharing buttons prominent. Sound enabled by default.

### 14.2 Educator Mode

**Panel density:** Medium. Left panel: lesson navigator OR object list. Right panel: annotation tools OR info panel.
**Toolbar:** Annotation, Time presets, Comparison, Student Sync, Presentation, Lesson Builder.
**Data depth:** Adjustable via "Student-Friendly / Advanced" toggle in settings.
**Special:** Sound auto-muted. Social sharing hidden. Classroom Mode badge in system bar. Annotation overlay available. Discussion prompt generator.

### 14.3 Creator Mode

**Panel density:** Medium-High. Left panel: camera path list. Right panel: keyframe editor. Bottom: timeline.
**Toolbar:** Camera Path, Timeline, Recording, Export, Preview, Render Queue.
**Data depth:** Full technical — metadata exposed for citation in content.
**Special:** Clean viewport mode (hide all UI for recording). 4K render support. Batch export queue. Embedding code generator.

### 14.4 Observer Mode

**Panel density:** High. Left panel: catalog browser + filters. Right panel: full info (S-3.1). Bottom-left: observability calculator.
**Toolbar:** Catalog Search, Measurement Tools, Observability, Observation Log, Coordinate Display.
**Data depth:** Full detail — all catalog IDs, scientific notation, error bars.
**Special:** Coordinate crosshair overlay. Angular distance measurement tool. Altitude/azimuth grid overlay. Night vision mode (red-only accent option).

### 14.5 Research Mode

**Panel density:** Maximum. Left panel: data import + custom overlay controls. Right panel: full info + analysis. Bottom: multi-panel dashboard.
**Toolbar:** Data Import, Query Builder, Analysis Dashboard, Publication Export, API Console, Batch Processing.
**Data depth:** Maximum — full precision, error margins, source citations, DOI links.
**Special:** Custom catalog overlay (rendered as additional 3D point cloud). Color-by-property mapping. Statistical analysis panel. Export to LaTeX/BibTeX. SQL query interface.

---

## 15. Responsive Design & Breakpoints

### 15.1 Breakpoint System

| Breakpoint | Width | Grid | Panel Behavior |
|-----------|-------|------|---------------|
| Desktop XL | ≥1440px | 12-col | All panels visible simultaneously |
| Desktop | 1024–1439px | 12-col | Panels toggle (left OR right, not both) |
| Tablet Landscape | 768–1023px | 8-col | Panels as slide-over sheets |
| Tablet Portrait | 600–767px | 4-col | Bottom sheet panels, simplified toolbar |
| Mobile | <600px | 4-col | Single panel at a time, bottom sheet, minimal toolbar |

### 15.2 Touch Adaptation

| Interaction | Desktop | Touch Device |
|-------------|---------|-------------|
| Rotate view | Click + drag | Single finger drag |
| Zoom | Scroll wheel | Pinch gesture |
| Select object | Click | Tap |
| Open context menu | Right-click | Long press (300ms) |
| Pan | Middle-click + drag | Two-finger drag |
| Time scrub | Click + drag slider | Swipe on time bar |

### 15.3 Mobile-Specific Adaptations

On screens <768px: System bar collapses to 40px height with hamburger menu. All panels become bottom sheets (slide up from bottom, 60% viewport max height). Entity info panel shows compact version (S-3.0) only. Time control becomes a single-line bar. Navigation breadcrumb hidden (replaced by minimap button). Font sizes: H1 → 16px, H2 → 12px, Body → 12px, Data → 12px. Touch targets minimum 44px × 44px (WCAG 2.1). Guided tours use swipe-to-advance gesture.

---

## 16. Animation & Micro-Interaction Specification

### 16.1 Transition Timing

| Animation | Duration | Easing | Trigger |
|-----------|----------|--------|---------|
| Panel slide in/out | 300ms | cubic-bezier(0.4, 0, 0.2, 1) | Object select/deselect |
| Modal fade in | 200ms | ease-out | Modal open |
| Modal fade out | 150ms | ease-in | Modal close |
| Button hover glow | 200ms | ease | Mouse enter |
| Tab switch | 200ms | ease-out | Tab click |
| Tooltip appear | 150ms | ease-out | 400ms delay after hover |
| Loading text line | 120ms | step-end | Sequential boot text |
| Scale transition | 800ms | cubic-bezier(0.25, 0.46, 0.45, 0.94) | Zoom level change |
| Entity highlight | 300ms | ease-out | Object hover |
| CRT flicker (optional) | 4000ms | ease-in-out | Continuous loop |

### 16.2 3D Viewport Animations

Camera transitions between objects: 1200ms ease-in-out with slight overshoot (cubic-bezier 0.34, 1.56, 0.64, 1). Orbit entry: camera spirals to orbit distance in 800ms. Time acceleration: smooth ramp from 0→target speed over 300ms. Entity label fade: 200ms fade at zoom threshold distances. Scale transition: logarithmic interpolation over 800ms with motion blur post-process effect.

### 16.3 Phosphor Glow Pulse

Selected/active elements exhibit a subtle brightness pulse: opacity oscillation 0.8→1.0→0.8 over 2000ms, ease-in-out, infinite. This simulates CRT phosphor persistence and draws attention without being distracting. Applied to: selected entity labels in viewport, active panel headers, mode indicator badge.

---

## 17. Accessibility Requirements

### 17.1 WCAG 2.1 AA Compliance

All text meets minimum 4.5:1 contrast ratio against its background. `--text-primary` (#e8e8f0) on `--bg-surface` (#0d0d14) achieves 14.2:1. `--text-secondary` (#a0a0b8) on `--bg-surface` achieves 7.1:1. `--text-tertiary` (#6a6a80) on `--bg-surface` achieves 3.8:1 — used only for decorative/non-essential text; essential information always uses `--text-secondary` or higher.

### 17.2 Keyboard Navigation

All interactive elements are focusable via Tab. Focus indicator: 2px outline in `--accent-cyan`, 2px offset. Focus is visible and never obscured by other elements. Arrow keys navigate within panels and lists. Escape closes modals/panels. Enter/Space activates buttons and toggles. Keyboard shortcuts: documented in Help panel (S-7.0), all customizable.

### 17.3 Screen Reader Support

All images and icons carry aria-label descriptions. Data tables use proper `<th>` / `<td>` markup with scope attributes. Panel states announced via aria-live regions. Mode changes announced. Loading progress announced at 25%, 50%, 75%, 100%. Entity selection announced with name and type.

### 17.4 Reduced Motion

`prefers-reduced-motion` media query disables: CRT scanline animation, phosphor flicker, panel slide animations (replaced with instant show/hide), viewport camera transitions (replaced with instant jump), loading boot text animation (show all at once). Scale transitions still operate but without motion blur.

### 17.5 High Contrast Mode

Activatable in Settings (S-7.3). Increases all text contrast to 7:1 minimum (WCAG AAA). Removes CRT overlay effects. Increases border widths to 2px. Accent colors shift to higher-saturation variants. Background becomes pure #000000.

### 17.6 CRT Effects Accessibility Toggle

CRT scanlines, pixel grid overlay, and phosphor flicker can all be independently disabled in Settings → Accessibility. Default: scanlines ON, pixel grid ON, flicker OFF. Users with photosensitivity or vestibular disorders should disable all three.

**SRS Requirements:** F-A11Y-001 through F-A11Y-008, A-001 (WCAG compliance), A-002 (Keyboard navigation), A-003 (Screen reader)

---

## 18. SRS Requirement Cross-Reference Matrix

### 18.1 Functional Requirements Coverage

| SRS Requirement ID | Requirement Description | Screen(s) | Status |
|-------------------|------------------------|-----------|--------|
| F-WEB-001 | Landing page with value proposition | S-1.0 | Covered |
| F-WEB-002 | Browser compatibility display | S-1.0 | Covered |
| F-PERF-001 | Loading state with progress indication | S-1.1 | Covered |
| F-MODE-001 | Mode selection interface | S-1.2 | Covered |
| F-MODE-002 | Mode persistence and switching | S-7.0 | Covered |
| F-ONBOARD-001 | First-time onboarding overlay | S-1.3 | Covered |
| F-ONBOARD-002 | Progressive disclosure of controls | S-1.3, S-6.1 | Covered |
| F-NAV-001–007 | Scale-level viewports (Solar→Observable) | S-2.0–S-2.6 | Covered |
| F-INFO-001 | Compact entity information display | S-3.0 | Covered |
| F-INFO-002 | Full entity information display | S-3.1 | Covered |
| F-INFO-003 | Entity comparison mode | S-3.2 | Covered |
| F-SEARCH-001 | Quick search interface | S-4.0 | Covered |
| F-SEARCH-002 | Advanced catalog search | S-4.1 | Covered |
| F-SEARCH-003 | Search results display | S-4.2 | Covered |
| F-TIME-001 | Time control panel | S-5.0 | Covered |
| F-TIME-002 | Educator time presets | S-5.1 | Covered |
| F-TOUR-001 | Guided tour selection | S-6.0 | Covered |
| F-TOUR-002 | Tour playback HUD | S-6.1 | Covered |
| F-TOUR-003 | Educator-specific tours | S-6.2 | Covered |
| F-SET-001–002 | Settings panel and performance | S-7.0–S-7.1 | Covered |
| F-AUDIO-001–002 | Audio settings and classroom mute | S-7.2, S-14.0 | Covered |
| F-A11Y-001 | Accessibility settings | S-7.3 | Covered |
| F-SHARE-001–002 | Sharing dialog and screenshot capture | S-8.0–S-8.1 | Covered |
| F-BOOK-001 | Bookmarks panel | S-9.0 | Covered |
| F-ANNOT-001–002 | Annotation toolbar and drawing | S-10.0–S-10.1 | Covered |
| F-CAM-001–002 | Camera path and keyframe editor | S-11.0–S-11.1 | Covered |
| F-EXPORT-001–003 | Export dialog and format options | S-11.2 | Covered |
| F-MEAS-001 | Measurement tools | S-12.0 | Covered |
| F-OBS-001 | Observability calculator | S-12.1 | Covered |
| F-CAT-001 | Catalog browser | S-12.2 | Covered |
| F-LOG-001 | Observation log | S-12.3 | Covered |
| F-IMPORT-001–003 | Data import wizard and formats | S-13.0 | Covered |
| F-ANAL-001 | Analysis dashboard | S-13.2 | Covered |
| F-PUBEX-001 | Publication export | S-13.3 | Covered |
| F-CLASS-001–002 | Classroom mode and student sync | S-14.0–S-14.1 | Covered |
| F-LESSON-001 | Lesson plan builder | S-14.2 | Covered |
| F-FULL-001 | Fullscreen/presentation mode | S-15.0 | Covered |
| F-ERR-001–003 | Error and empty states | S-16.0–S-16.2 | Covered |
| F-TOGGLE-001–002 | Toggle system (96 entity types) | S-17.0–S-17.1 | Covered |

### 18.2 Non-Functional Requirements

| NFR Category | Requirement | Design Impact |
|-------------|-------------|---------------|
| Performance | 60 FPS minimum | CRT overlay uses CSS only (no JS). Panels use `will-change: transform`. Animations respect `prefers-reduced-motion`. |
| Performance | <4s load on desktop | Boot sequence designed for progressive rendering. Critical CSS inlined. Fonts preloaded. |
| Accessibility | WCAG 2.1 AA | All contrast ratios verified. Keyboard navigation complete. Screen reader markup specified. |
| Responsive | Support 320px–2560px | 5 breakpoint tiers defined. Touch adaptation specified. |
| Data Accuracy | Scientific precision | IBM Plex Mono with tabular figures for all numerical data. Unit formatting standardized. |
| Hardware | 2016+ laptops | Adaptive quality settings. CRT effects optional. Reduced particle counts at lower tiers. |

### 18.3 Entity Type Coverage

All 96 entity types across 9 categories defined in Doc 22 v4.2 are supported by the entity display system (Section 13). Each entity type's interactive toggles are mapped to the Toggle Feature UI. Each category has a dedicated accent color, icon, and data template for the info panel.

---

## 19. Appendices

### Appendix A: Font Loading Strategy

1. Press Start 2P: loaded from Google Fonts CDN, `font-display: swap`, fallback: monospace
2. Space Mono: loaded from Google Fonts CDN, `font-display: swap`, fallback: 'Courier New', monospace
3. IBM Plex Mono: loaded from Google Fonts CDN, `font-display: swap`, fallback: 'Consolas', monospace
4. Critical text (system bar, loading screen) uses system monospace until custom fonts load

### Appendix B: Icon System

AETHER V4 uses geometric Unicode symbols rather than icon fonts or SVGs for maximum retro authenticity and zero additional asset loading:

| Symbol | Usage |
|--------|-------|
| ◎ | Stars category, Explorer mode |
| ⬡ | Planets category, Educator mode |
| ◈ | Galaxies category, Creator mode |
| ⊕ | Moons category, Observer mode |
| ▽ | Nebulae category, Research mode |
| ◉ | Small Bodies category |
| ⊙ | Large-Scale Structure category |
| ✦ | Exotic Objects category |
| ▸ | Expand/action indicator |
| ◄ ■ ►► | Playback controls |
| ★ | Bookmark |
| ↗ | Share/external link |
| ⛶ | Fullscreen |
| 📷 | Screenshot |
| ⚙ | Settings |
| ✏ | Annotation draw |
| ✕ | Close/dismiss |

### Appendix C: Z-Index Stack

| Z-Index | Layer |
|---------|-------|
| 0 | 3D WebGL Canvas |
| 1 | CRT scanlines + pixel grid overlay |
| 2 | Annotation drawings (Educator mode) |
| 10 | Entity labels in viewport |
| 50 | Bottom bar (scale, time, actions) |
| 60 | Left panel (object list / navigation) |
| 70 | Right panel (entity info / tools) |
| 80 | System bar (top) |
| 90 | Dropdowns, tooltips, context menus |
| 100 | Modal overlays (comparison, export, import) |
| 110 | Onboarding overlay |
| 9999 | Loading screen |

### Appendix D: Color-Coding by Entity Category in 3D Viewport

Entity labels and selection highlights in the 3D viewport use the category accent color from Section 13.1. This creates immediate visual grouping: amber labels cluster around stars, cyan labels around planets, pink labels around galaxies. The consistent color language across viewport labels and info panels reduces cognitive load when navigating between 96 entity types.

### Appendix E: Design File References

| Asset | Location | Format |
|-------|----------|--------|
| AETHER V4 concept mockup | /ui-concepts/aether-v4-retro.png | PNG, 2880×1800, 541KB |
| AETHER V4 HTML prototype | /sessions/aether-v4.html | HTML, 33KB |
| Design evolution (V1→V4) | /ui-concepts/ | PNG series |

---

**End of Document**

*This document is the authoritative UI/UX design brief for Cosmos Explorer. All implementation should reference this document alongside the SRS (functional requirements), DFS (interaction specifications), Doc 22 (entity toggles), and Doc 23 (spatial database) for complete coverage.*
