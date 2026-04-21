/**
 * Per-scale-regime soundscape parameters (Doc 10 §7, Doc 22 §15.3).
 *
 * Doc 10 §7 maps scale → frequency band:
 *   - Cosmic (Mpc): 20–50 Hz (sub-bass)
 *   - Galactic (kpc): 50–200 Hz
 *   - Stellar (AU): 200–800 Hz
 *   - Planetary (m): 800–2000 Hz
 *
 * Doc 22 §15.3 maps the same axis to mixer values:
 *   - Solar System (1):    masterGain 1.0, dry reverb
 *   - Stellar (2-3):       0.8, medium hall
 *   - Galactic (4):        0.6, large cathedral
 *   - Cosmic (5-6+):       0.3, infinite (100% wet) + sub-bass cosmic-web drone
 *
 * The four-rung ScaleRegime ladder folds the Doc 22 6-rung mixer onto the
 * four regimes the engine actually exposes. The values below are the result
 * of that fold + a polar-pad chord per regime so the soundscape has a
 * recognisable identity even before the user starts navigating.
 *
 * NOTE: gains are PRE-master — the AudioEngine multiplies these by the user's
 * `masterVolume` and `ambienceVolume` from settingsStore before sending to
 * the destination. See AudioEngine.applyVolumes for the exact math.
 */

import type { ScaleRegime } from '@/stores/types';

export interface SoundscapeProfile {
  /** Identifier surfaced for tests + telemetry. */
  readonly regime: ScaleRegime;
  /** Pre-master gain in [0..1] (Doc 22 §15.3 master gain column). */
  readonly gain: number;
  /** Reverb wet mix in [0..1] (Doc 22 §15.3 reverb column). */
  readonly reverbWet: number;
  /** Reverb decay in seconds — bigger room = longer tail. */
  readonly reverbDecaySec: number;
  /**
   * Pad voices in Hz (a chord). 1–4 partials. Each voice is summed at equal
   * weight then routed through the master + reverb chain.
   */
  readonly padFrequenciesHz: readonly number[];
  /**
   * LFO rate (Hz) modulating the pad's filter cutoff. Slower at large scale
   * (epic & breathing); faster at solar (warmer, audible motion).
   */
  readonly filterLfoHz: number;
  /** Filter base cutoff (Hz). */
  readonly filterBaseHz: number;
  /** Filter modulation depth (Hz) — peak excursion from the base. */
  readonly filterDepthHz: number;
  /**
   * Sub-bass drone frequency (Hz). Doc 22 §15.3 says cosmic adds a sub-bass
   * cosmic-web drone — present only at galactic / cosmic. `null` = silent.
   */
  readonly subBassHz: number | null;
}

/**
 * Doc 22 §15.3 + Doc 10 §7. Pad chord roots picked so neighbouring regimes
 * share a tone (smooth crossfade) but each profile has its own colour.
 *
 *  - solar_system: warm major triad in the Stellar 200-800 Hz band
 *  - stellar:      ethereal open-fifth shifted up the same band
 *  - galactic:     deep drone in the Galactic 50-200 Hz band + sub-bass
 *  - cosmic:       minimal pad in the lowest band + sub-bass drone, big wet
 */
export const SOUNDSCAPE_PROFILES: Readonly<Record<ScaleRegime, SoundscapeProfile>> = {
  solar_system: {
    regime: 'solar_system',
    gain: 1.0,
    reverbWet: 0.15,
    reverbDecaySec: 1.5,
    // C4 / E4 / G4 — warm major triad rooted at 261.63 Hz.
    padFrequenciesHz: [261.63, 329.63, 392.0],
    filterLfoHz: 0.18,
    filterBaseHz: 1200,
    filterDepthHz: 600,
    subBassHz: null,
  },
  stellar: {
    regime: 'stellar',
    gain: 0.8,
    reverbWet: 0.4,
    reverbDecaySec: 4.5,
    // E3 / B3 — open fifth, ethereal.
    padFrequenciesHz: [164.81, 246.94, 329.63],
    filterLfoHz: 0.1,
    filterBaseHz: 800,
    filterDepthHz: 400,
    subBassHz: null,
  },
  galactic: {
    regime: 'galactic',
    gain: 0.6,
    reverbWet: 0.7,
    reverbDecaySec: 8.0,
    // A2 / E3 — deep drone in the Doc 10 galactic band.
    padFrequenciesHz: [110.0, 164.81, 220.0],
    filterLfoHz: 0.05,
    filterBaseHz: 350,
    filterDepthHz: 180,
    subBassHz: 55.0,
  },
  cosmic: {
    regime: 'cosmic',
    gain: 0.3,
    reverbWet: 1.0,
    reverbDecaySec: 12.0,
    // A1 / E2 — sparse low pad over the cosmic-web sub-bass drone.
    padFrequenciesHz: [55.0, 82.41],
    filterLfoHz: 0.025,
    filterBaseHz: 180,
    filterDepthHz: 100,
    subBassHz: 32.7, // C1 — Doc 10 §7 cosmic 20-50 Hz band.
  },
};

/**
 * Doc 22 §15.2 says audio cross-fades match the visual toggle easing — 300 ms.
 * Used as the default fade duration when {@link AudioEngine.setScaleRegime}
 * crossfades soundscapes.
 */
export const SOUNDSCAPE_CROSSFADE_MS = 300;
