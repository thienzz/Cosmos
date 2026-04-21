/**
 * Scale-regime state machine (Doc 27 §9, Doc 19 scale transitions).
 *
 * Four regimes:
 *   Solar System ↔ Stellar ↔ Galactic ↔ Cosmic
 *
 * Each boundary has a hysteresis band (Doc 27 §9.2) — the camera must move
 * `threshold + hysteresis` outward to promote and `threshold − hysteresis`
 * inward to demote. This kills the flicker that a plain threshold produces
 * when the camera sits on the boundary and a single pixel of wheel input
 * would bounce the regime every frame.
 *
 * Controller is PURE: takes a scalar distance (AU from the Sun) each frame,
 * returns whether the regime changed. It doesn't know about scene units,
 * does no rendering, and has no side-effects of its own — the caller is
 * responsible for publishing the new regime (cameraStore, tile filter,
 * UI adaptation). That keeps unit tests synchronous + deterministic.
 */

import type { ScaleRegime } from '../stores/types';

// 1 pc = 206 264.806 AU (IAU 2012 definition, truncated to 3 dp).
export const AU_PER_PC = 206_264.806;
export const AU_PER_KPC = AU_PER_PC * 1_000;
export const AU_PER_MPC = AU_PER_PC * 1_000_000;

/**
 * Threshold + hysteresis (Doc 27 §9.2). `enter` is crossed outward to
 * promote; `exit` is crossed inward to demote. Invariant: `exit < enter`.
 */
export interface RegimeBoundary {
  /** Promote when `distance > enter`. */
  enter: number;
  /** Demote when `distance < exit`. */
  exit: number;
}

export interface RegimeThresholds {
  /** 500 ± 100 AU. */
  solarToStellar: RegimeBoundary;
  /** 1 kpc ± 200 pc → AU. */
  stellarToGalactic: RegimeBoundary;
  /** 1 Mpc ± 0.2 Mpc → AU. The 8 kpc Sun↔MW-centre offset is <1% of the
   *  hysteresis band, so we treat distance-from-Sun as distance-from-MW
   *  at Mpc scale. */
  galacticToCosmic: RegimeBoundary;
}

export const DEFAULT_THRESHOLDS: RegimeThresholds = {
  solarToStellar: { enter: 500, exit: 400 },
  stellarToGalactic: { enter: 1_000 * AU_PER_PC, exit: 800 * AU_PER_PC },
  galacticToCosmic: { enter: 1 * AU_PER_MPC, exit: 0.8 * AU_PER_MPC },
};

export interface RegimeTransition {
  from: ScaleRegime;
  to: ScaleRegime;
  /** Distance that triggered the change — useful for telemetry. */
  distanceAU: number;
}

/** Ordered so "next" / "prev" comparisons are cheap. */
const ORDER: readonly ScaleRegime[] = [
  'solar_system',
  'stellar',
  'galactic',
  'cosmic',
];

export function regimeRank(r: ScaleRegime): number {
  return ORDER.indexOf(r);
}

export interface ScaleRegimeControllerOptions {
  initial?: ScaleRegime;
  thresholds?: RegimeThresholds;
  /** Fires on transition. Always invoked inside `update()`. */
  onTransition?: (transition: RegimeTransition) => void;
}

export class ScaleRegimeController {
  private regime: ScaleRegime;
  private readonly thresholds: RegimeThresholds;
  private onTransition: (t: RegimeTransition) => void;

  constructor(options: ScaleRegimeControllerOptions = {}) {
    this.regime = options.initial ?? 'solar_system';
    this.thresholds = options.thresholds ?? DEFAULT_THRESHOLDS;
    this.onTransition = options.onTransition ?? (() => {});
  }

  get current(): ScaleRegime {
    return this.regime;
  }

  setOnTransition(fn: (t: RegimeTransition) => void): void {
    this.onTransition = fn;
  }

  /**
   * Force-set the regime (no transition callback). Used by test harnesses,
   * scripted tours, and `resetToDefault` paths — anywhere the camera jumps
   * rather than glides.
   */
  reset(regime: ScaleRegime): void {
    this.regime = regime;
  }

  /**
   * Consume the camera's distance from the Sun in AU and advance the state
   * machine. Returns `true` if the regime changed this frame. Only advances
   * / demotes by one step per call — if the camera teleports across two
   * bands in a single frame (e.g. fly-to end-point), repeated calls will
   * walk up / down the ladder one rung per invocation. The caller can
   * simply loop until `update` returns `false` when that matters.
   */
  update(distanceAU: number): boolean {
    if (!Number.isFinite(distanceAU) || distanceAU < 0) {
      return false;
    }
    const next = this.computeNextRegime(distanceAU);
    if (next === this.regime) return false;
    const from = this.regime;
    this.regime = next;
    this.onTransition({ from, to: next, distanceAU });
    return true;
  }

  private computeNextRegime(d: number): ScaleRegime {
    switch (this.regime) {
      case 'solar_system':
        return d > this.thresholds.solarToStellar.enter ? 'stellar' : 'solar_system';
      case 'stellar':
        if (d < this.thresholds.solarToStellar.exit) return 'solar_system';
        if (d > this.thresholds.stellarToGalactic.enter) return 'galactic';
        return 'stellar';
      case 'galactic':
        if (d < this.thresholds.stellarToGalactic.exit) return 'stellar';
        if (d > this.thresholds.galacticToCosmic.enter) return 'cosmic';
        return 'galactic';
      case 'cosmic':
        return d < this.thresholds.galacticToCosmic.exit ? 'galactic' : 'cosmic';
    }
  }
}

/**
 * Per-regime tile kinds (Doc 27 §9.3). The tile streaming manager uses this
 * to drop enqueue hints for kinds that aren't visible in the active regime —
 * e.g. fetching `cosmic-web/3` while the camera is at Saturn is pure waste.
 *
 * `solar_system` draws no tiles (discrete meshes only), so the set is empty.
 */
export type TileKind = 'stars' | 'galaxies' | 'cosmic_web';

export const REGIME_TILE_KINDS: Record<ScaleRegime, ReadonlySet<TileKind>> = {
  solar_system: new Set<TileKind>(),
  stellar: new Set<TileKind>(['stars']),
  galactic: new Set<TileKind>(['stars', 'galaxies']),
  cosmic: new Set<TileKind>(['galaxies', 'cosmic_web']),
};

/**
 * Classify a tile address by the prefix used in the manifest / WS frames.
 * Returns `null` for unrecognised shapes — the streaming manager treats
 * unknowns as kind-agnostic and lets them through (forward-compat with
 * future tile families like CMB or custom-FITS render tiles).
 */
export function tileKindFromAddress(address: string): TileKind | null {
  // Strip leading slashes for tolerance — both `"stars/…"` and `"/stars/…"`
  // are valid in the wild (depending on whether the address passed through
  // `tilePriorityHintsFromWsUrls`).
  const stripped = address.replace(/^\/+/, '');
  if (stripped.startsWith('stars/')) return 'stars';
  if (stripped.startsWith('galaxies/')) return 'galaxies';
  if (stripped.startsWith('cosmic-web/') || stripped.startsWith('cosmic_web/')) {
    return 'cosmic_web';
  }
  return null;
}

export function isAddressRelevantForRegime(address: string, regime: ScaleRegime): boolean {
  const kind = tileKindFromAddress(address);
  if (kind === null) return true;
  return REGIME_TILE_KINDS[regime].has(kind);
}
