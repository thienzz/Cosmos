/**
 * Synthesis backend boundary for the {@link AudioEngine} (T31).
 *
 * The engine handles policy: when to start the audio context (user-gesture
 * gating per Doc 22 §15.4 AUD-001), how settings + scale regime map onto
 * gain & soundscape, and how to crossfade between scenes. The backend
 * handles synthesis: build the Tone.js graph, set the actual gain values,
 * crossfade the active soundscape.
 *
 * The split keeps the engine deterministic + unit-testable in jsdom (which
 * has no AudioContext) — tests inject a stub that records calls. Production
 * wires {@link ToneAudioBackend} in `audio/index.ts`.
 */

import type { ScaleRegime } from '@/stores/types';

export interface AudioVolumeState {
  /** Master volume in [0..1] from settingsStore. */
  master: number;
  /** Ambience (soundscape) volume in [0..1] from settingsStore. */
  ambience: number;
  /** Effects (selection, fly-to) volume in [0..1] — reserved for follow-up. */
  effects: number;
  /** Hard mute flag — when true, all output is silenced regardless of gains. */
  muted: boolean;
}

export interface AudioBackend {
  /**
   * Lazily start the underlying AudioContext + build the Tone graph. Must be
   * called from a user-gesture event handler per Doc 22 §15.4 AUD-001;
   * subsequent calls resolve immediately. Resolves when audio is producing
   * sound; rejects if the platform refused the gesture.
   */
  ensureStarted(): Promise<void>;

  /**
   * `true` once {@link ensureStarted} has succeeded at least once. Used by
   * the engine to skip per-frame work before the first user gesture.
   */
  isStarted(): boolean;

  /**
   * Snap the master / ambience / effects gains and the mute switch to the
   * supplied values. Cheap — meant to be called whenever settingsStore
   * changes. Backends should ramp internally over a few ms to avoid clicks.
   */
  setVolumes(state: AudioVolumeState): void;

  /**
   * Crossfade to the soundscape for `regime`. `fadeMs` is the linear ramp
   * duration; backends should silence the previous scene and ramp up the
   * new one over the same window. Calling with the same regime twice is a
   * no-op — caller-side responsibility, but backends should be idempotent.
   */
  setScaleRegime(regime: ScaleRegime, fadeMs: number): void;

  /** The currently active soundscape regime, or `null` before first set. */
  getActiveRegime(): ScaleRegime | null;

  /**
   * Tear down everything. Stop oscillators, disconnect nodes, dispose
   * AudioContext if owned. Idempotent.
   */
  dispose(): void;
}
