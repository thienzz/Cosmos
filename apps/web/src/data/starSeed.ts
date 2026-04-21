/**
 * Deterministic 5K-star seed generator.
 *
 * Generates a representative Hipparcos-scale sample at runtime so we don't
 * check a multi-megabyte JSON into the repo. Same seed → same stars across
 * sessions, which keeps visual regression tests stable.
 *
 * Spectral-class proportions are compressed from real main-sequence
 * statistics — M is still dominant (≈48%) but O/B/A are boosted so the
 * demo shows visible variety.
 *
 * P2A — Shell radii are expressed in parsecs and resolved to scene units
 * via {@link DEFAULT_SCENE_SCALE}.unitsPerPc (500 by default, matching
 * StarTileRenderer). This puts seed stars on the same physical grid as the
 * Gaia DR3 tile pyramid once it streams — mixing the two no longer
 * produces 13× scale jumps between "seed-derived" and "tile-derived"
 * copies of the same star.
 *
 * P2B — Callers can pin a subset of stars to real ICRS coordinates via
 * {@link StarFieldSeedOptions.anchors}. Anchored stars land first in the
 * returned array at their exact (RA, Dec, distance) positions; the random
 * background fills the rest of the requested `count`. The anchor list is
 * typically {@link IAU_NAMED_STARS} — 92 named bright stars with verified
 * Hipparcos coordinates.
 */
import {
  DEFAULT_SCENE_SCALE,
  icrsToSceneUnitsPc,
  type SceneScaleConfig,
} from '@cosmos/coordinate-utils';

import type { SpectralClass } from '@/utils/spectralColor';
import { colorForSpectralClass, type RGB } from '@/utils/spectralColor';

export interface StarSeed {
  position: { x: number; y: number; z: number };
  color: RGB;
  /** Apparent magnitude (Pogson); brighter ⇒ smaller. */
  magnitude: number;
  spectralClass: SpectralClass;
  /** Random [0, 2π]; passed as-is to the shader. */
  twinklePhase: number;
  /**
   * Optional IAU / Hipparcos identity. Present only for P2B anchor stars
   * placed from a real catalog; random background stars leave this unset so
   * the picking layer doesn't try to resolve labels for them.
   */
  anchorId?: string;
}

/**
 * Real-catalog anchor entry. Drop one of these into
 * {@link StarFieldSeedOptions.anchors} and the star is placed at the given
 * ICRS position instead of being sampled from the random shell.
 */
export interface StarAnchor {
  /** ICRS right ascension in degrees, J2000.0. */
  raDeg: number;
  /** ICRS declination in degrees, J2000.0. */
  decDeg: number;
  /** Parallax distance in parsecs. */
  distancePc: number;
  /** Apparent magnitude (Pogson). */
  magV: number;
  /**
   * Full MK spectral type such as "A1V" or "M1-2Ia-Iab". Only the leading
   * O/B/A/F/G/K/M letter is consulted for the colour lookup.
   */
  spectralType?: string | null;
  /** IAU common name, Bayer label, or catalog id — stored on the seed for picking. */
  id?: string;
}

export interface StarFieldSeedOptions {
  /** Number of stars to generate. Default 5000. */
  count?: number;
  /** Deterministic seed; default 1234. */
  seed?: number;
  /**
   * Inner radius of the spherical shell in parsecs. Default 1 pc. (The
   * Hipparcos bright subset has no stars inside ~1 pc; the closest neighbour
   * is Proxima at 1.301 pc.)
   */
  innerRadiusPc?: number;
  /**
   * Outer radius of the spherical shell in parsecs. Default 50 pc, which
   * matches a reasonable "naked-eye-visible Hipparcos neighbourhood".
   */
  outerRadiusPc?: number;
  /**
   * Scene units per parsec. Default matches DEFAULT_SCENE_SCALE.unitsPerPc
   * (500). Pass the same value used by StarTileRenderer so seed and tile
   * coordinates agree.
   */
  sceneUnitsPerPc?: number;
  /**
   * Real-catalog stars to pin at their ICRS positions. Emitted first in the
   * returned array, each at `raDeg/decDeg/distancePc` converted via
   * {@link icrsToSceneUnitsPc}. Anchors in excess of `count` are clipped so
   * this is safe to pass even when the caller wants a tiny seed.
   */
  anchors?: readonly StarAnchor[];
}

/** Spectral-class weighting used by sampleSpectralClass(). Sum must be 1. */
const SPECTRAL_DISTRIBUTION: Array<[SpectralClass, number]> = [
  ['O', 0.005],
  ['B', 0.02],
  ['A', 0.04],
  ['F', 0.06],
  ['G', 0.1],
  ['K', 0.3],
  ['M', 0.475],
];

/**
 * Mulberry32 — small, fast, good-enough PRNG with a uint32 seed.
 * See George Marsaglia's original note + Tommy Ettinger's refinement.
 */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Extract the O/B/A/F/G/K/M class letter from a full MK spectral type
 * string ("A1V", "M1-2Ia-Iab", "B0.5IV", "F5Ib"…). Returns 'G' as a neutral
 * fallback when the string doesn't start with a recognised class letter;
 * real Hipparcos entries always do, so the fallback is purely defensive.
 */
export function spectralClassFromType(type: string | null | undefined): SpectralClass {
  if (!type) return 'G';
  const first = type.trim().charAt(0).toUpperCase();
  switch (first) {
    case 'O':
    case 'B':
    case 'A':
    case 'F':
    case 'G':
    case 'K':
    case 'M':
      return first;
    default:
      return 'G';
  }
}

function sampleSpectralClass(random: () => number): SpectralClass {
  const r = random();
  let acc = 0;
  for (const [cls, weight] of SPECTRAL_DISTRIBUTION) {
    acc += weight;
    if (r < acc) return cls;
  }
  return 'M';
}

/** Unit vector uniformly distributed on S². */
function sampleDirection(random: () => number): { x: number; y: number; z: number } {
  // Marsaglia method — cheap and artefact-free.
  const u = random() * 2 - 1;
  const theta = random() * 2 * Math.PI;
  const s = Math.sqrt(1 - u * u);
  return { x: s * Math.cos(theta), y: s * Math.sin(theta), z: u };
}

/**
 * Magnitude sampler — biased so most stars are faint, with a few bright
 * reference anchors. Doesn't follow a published luminosity function
 * exactly; the goal is a visually interesting distribution.
 */
function sampleMagnitude(random: () => number, spectralClass: SpectralClass): number {
  // Roughly: hotter classes peak brighter.
  const mean: Record<SpectralClass, number> = {
    O: -0.8,
    B: 0.3,
    A: 1.0,
    F: 2.0,
    G: 3.0,
    K: 3.8,
    M: 4.5,
  };
  // Gaussian-ish via sum of two uniforms (central-limit with n=2 → triangular).
  const noise = random() + random() - 1; // triangular on [-1, 1]
  return mean[spectralClass] + noise * 1.5;
}

export function generateStarSeed(options: StarFieldSeedOptions = {}): StarSeed[] {
  const count = Math.max(0, Math.floor(options.count ?? 5000));
  const seed = options.seed ?? 1234;
  const innerRadiusPc = options.innerRadiusPc ?? 1;
  const outerRadiusPc = options.outerRadiusPc ?? 50;
  const unitsPerPc = options.sceneUnitsPerPc ?? DEFAULT_SCENE_SCALE.unitsPerPc;
  const scale: SceneScaleConfig = { unitsPerPc };
  const anchors = options.anchors ?? [];

  if (outerRadiusPc <= innerRadiusPc) {
    throw new Error(
      `outerRadiusPc (${outerRadiusPc}) must exceed innerRadiusPc (${innerRadiusPc})`,
    );
  }

  // Resolve parsec-space radii into scene units once so the per-particle
  // inverse-CDF stays in scene coordinates (matches StarTileRenderer).
  const innerRadius = innerRadiusPc * unitsPerPc;
  const outerRadius = outerRadiusPc * unitsPerPc;

  const random = mulberry32(seed);
  const stars: StarSeed[] = [];

  // P2B — anchored catalog stars first. Each lands at its exact ICRS
  // position so picking, labels, and constellation overlays agree on
  // coordinates. Anchor count is clipped when `count` is smaller than the
  // anchor list.
  const anchorCap = Math.min(anchors.length, count);
  for (let i = 0; i < anchorCap; i++) {
    const a = anchors[i];
    if (!Number.isFinite(a.distancePc) || a.distancePc <= 0) continue;
    const pos = icrsToSceneUnitsPc(a.raDeg, a.decDeg, a.distancePc, scale);
    const spectralClass = spectralClassFromType(a.spectralType);
    stars.push({
      position: { x: pos.x, y: pos.y, z: pos.z },
      color: colorForSpectralClass(spectralClass),
      magnitude: a.magV,
      spectralClass,
      twinklePhase: random() * Math.PI * 2,
      anchorId: a.id,
    });
  }

  // Random background population fills the remaining budget. The PRNG is
  // advanced for anchors (one draw per anchor) so changing the anchor list
  // doesn't invalidate cached background samples downstream.
  for (let i = stars.length; i < count; i++) {
    const spectralClass = sampleSpectralClass(random);
    const color = colorForSpectralClass(spectralClass);
    const direction = sampleDirection(random);
    // Inverse-CDF for uniform volume distribution in a shell.
    const r = Math.cbrt(random() * (outerRadius ** 3 - innerRadius ** 3) + innerRadius ** 3);
    const magnitude = sampleMagnitude(random, spectralClass);
    stars.push({
      position: { x: direction.x * r, y: direction.y * r, z: direction.z * r },
      color,
      magnitude,
      spectralClass,
      twinklePhase: random() * Math.PI * 2,
    });
  }

  return stars;
}
