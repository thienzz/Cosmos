import type { AppMode } from '@/stores/types';

/**
 * Guided-tour catalog (T32, Doc 20 §1.5, Doc 21 §Screen 1.14, Doc 05 §J1/§J2).
 *
 * A *tour* is a scripted sequence of camera waypoints with per-step narration.
 * The {@link TourEngine} consumes this catalog: each `tourStep` change in
 * `modeStore` resolves a waypoint and dispatches a fly-to via the engine
 * bridge. The catalog itself is pure data — no DOM, no Three.js, no mutable
 * state — so tests can import it directly and the renderer never has to know
 * the shape of a tour until playback time.
 *
 * # Waypoint semantics
 *
 * A waypoint is "where the camera settles" at step N. The catalog uses NAIF
 * ids so {@link SceneManager.flyToEntity} can resolve the body's current world
 * position at playback time (which matters because bodies move under time
 * advance). Non-solar targets (galaxies, nebulae) are not yet supported —
 * they would need parallel `flyToGalaxy` / `flyToNebula` handlers which we
 * haven't wired; deferred for a later task.
 *
 * # Gate per mode
 *
 * Doc 27 §10 lets Guided Tour only be entered from Exploration or Education.
 * The catalog mirrors that: `J1` is the "first-contact" tour offered from
 * Exploration, `J2` is the "solar-system tour" offered from Education. A
 * single tour may be offered from both modes — the array encodes a set.
 */

export interface TourWaypoint {
  /** NAIF id of the target body (Doc 26 Appendix A). */
  naifId: number;
  /** Display title shown in the narration panel ("STEP 3 of 5: {title}"). */
  title: string;
  /**
   * Narrative text. Kept short — the panel caps visible height at 80 px
   * (Doc 21 §Screen 1.14) so long prose scrolls or clips.
   */
  narration: string;
  /**
   * Fly-to duration in seconds. Omit to use {@link SceneManager.flyToEntity}'s
   * default (3 s via FlyToAnimator). Short legs (adjacent planets) can shrink
   * this; long legs (Sun → Jupiter) may grow it.
   */
  durationSec?: number;
}

export interface Tour {
  id: string;
  title: string;
  description: string;
  /** Modes that may launch this tour. Doc 27 §10: only exploration/education. */
  availableFromModes: readonly AppMode[];
  waypoints: readonly TourWaypoint[];
}

/**
 * **J1 — First Contact.**
 *
 * The "Casual Explorer" entry tour (Doc 05 §Journey 1, Doc 21 §J1). Drops
 * the user into the inner solar system, then climbs outward to the gas
 * giants. Five waypoints keeps the tour under ~60 s of camera travel at
 * default fly-to timing — matching TS-E2E-001's 60-second budget.
 */
export const TOUR_J1: Tour = {
  id: 'J1',
  title: 'First Contact',
  description:
    'A first tour of our solar system — from home planet to the gas giants.',
  availableFromModes: ['exploration'],
  waypoints: [
    {
      naifId: 399, // Earth
      title: 'Earth — Home',
      narration:
        'You are here. Earth orbits the Sun at 1 astronomical unit — the reference for all other distances in our system.',
    },
    {
      naifId: 10, // Sun
      title: 'The Sun',
      narration:
        'At the heart of the system: a G-type main-sequence star that has burned steadily for 4.6 billion years.',
      durationSec: 4,
    },
    {
      naifId: 499, // Mars
      title: 'Mars — The Red Planet',
      narration:
        'Iron-oxide dust paints Mars rust-red. The next world humans hope to walk on.',
    },
    {
      naifId: 599, // Jupiter
      title: 'Jupiter — Gas Giant',
      narration:
        'The largest planet — 318 Earth-masses of hydrogen and helium, home to the Great Red Spot storm.',
      durationSec: 5,
    },
    {
      naifId: 699, // Saturn
      title: 'Saturn — Ringed Wonder',
      narration:
        "Saturn's rings span 280,000 km but average only 10 metres thick — a disc of ice shepherded by dozens of moons.",
      durationSec: 5,
    },
  ],
} as const;

/**
 * **J2 — Educator Solar-System Tour.**
 *
 * The Kepler's-laws lesson path (Doc 05 §Journey 2, Doc 21 §J2). Marches
 * outward through the inner planets so students can compare orbital
 * periods and temperatures as the Sun–distance grows. TS-MODE-003 and
 * TS-E2E-002 expect exactly **5 steps** in this tour.
 */
export const TOUR_J2: Tour = {
  id: 'J2',
  title: 'Solar System Tour',
  description:
    "Kepler's laws in motion: four rocky worlds and the star that binds them.",
  availableFromModes: ['education'],
  waypoints: [
    {
      naifId: 10, // Sun
      title: 'The Sun — Centre of Mass',
      narration:
        'Every body in the system orbits this common centre of mass. 99.86% of the system mass is here.',
      durationSec: 4,
    },
    {
      naifId: 199, // Mercury
      title: 'Mercury — 88-day year',
      narration:
        'The fastest planet: 88-day year. Kepler 3: closer orbits mean shorter periods.',
    },
    {
      naifId: 299, // Venus
      title: 'Venus — 225-day year',
      narration:
        "Venus' year is 225 days. Notice how the ratio P²/a³ stays constant across all planets.",
    },
    {
      naifId: 399, // Earth
      title: 'Earth — 1 AU baseline',
      narration:
        'Our baseline: 1 AU, 1-year period, in the habitable zone where liquid water is stable.',
    },
    {
      naifId: 499, // Mars
      title: 'Mars — 687-day year',
      narration:
        "Mars takes 687 days to lap the Sun. The outer we go, the slower — Kepler's second law.",
    },
  ],
} as const;

/** All shipped tours, keyed by id. */
export const TOUR_CATALOG: Readonly<Record<string, Tour>> = {
  [TOUR_J1.id]: TOUR_J1,
  [TOUR_J2.id]: TOUR_J2,
} as const;

export function getTourById(id: string | null): Tour | null {
  if (id === null) return null;
  return TOUR_CATALOG[id] ?? null;
}

/** Tours offered from a given mode, in stable catalog order. */
export function toursForMode(mode: AppMode): Tour[] {
  return Object.values(TOUR_CATALOG).filter((t) =>
    t.availableFromModes.includes(mode),
  );
}
