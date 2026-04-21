/**
 * AudioEngine — T31 procedural ambient music orchestrator.
 *
 * Doc references:
 *   - Doc 10 §7 (Audio Specifications — synthesis chain, frequency mapping,
 *     latency budget, dynamic volume control)
 *   - Doc 22 §15 (Audio System Integration — per-entity triggers, scale-aware
 *     mixing table, AUD-001..006 requirements)
 *   - CLAUDE.md §Tech Stack — Tone.js 14.8+ for procedural synthesis
 *
 * Responsibilities:
 *   1. Wait for a user gesture, then call backend.ensureStarted (AUD-001).
 *   2. Subscribe to settingsStore (masterVolume / ambienceVolume / effects /
 *      isMuted) and forward changes to the backend (AUD-004).
 *   3. Subscribe to cameraStore.scaleRegime and crossfade soundscapes when it
 *      changes (T31 spec — solar = warm pad, stellar = ethereal, galactic =
 *      deep drone, cosmic = minimal sub-bass; see {@link SOUNDSCAPE_PROFILES}).
 *
 * The engine is a pure controller — no Tone.js or Web Audio API imports here.
 * Synthesis lives in {@link ToneAudioBackend} (production) and a stub
 * backend (tests). This makes the file deterministic in jsdom and keeps
 * the audio policy testable independent of the Web Audio implementation.
 */

import { useCameraStore } from '@/stores/cameraStore';
import { useSettingsStore, type SettingsState } from '@/stores/settingsStore';
import type { ScaleRegime } from '@/stores/types';

import type { AudioBackend, AudioVolumeState } from './AudioBackend';
import { SOUNDSCAPE_CROSSFADE_MS } from './soundscape';

export interface AudioEngineOptions {
  /**
   * Backend providing synthesis. Production = `ToneAudioBackend`; tests pass
   * a stub. Engine never imports Tone directly.
   */
  backend: AudioBackend;
  /**
   * Crossfade duration when the scale regime changes. Default = Doc 22 §15.2
   * 300 ms easing. Allows tests to set `0` for synchronous assertions.
   */
  crossfadeMs?: number;
  /**
   * Skip auto-subscription to {@link useSettingsStore} +
   * {@link useCameraStore}. Useful for tests that drive the engine
   * imperatively. Default `false`.
   */
  manualWiring?: boolean;
}

export class AudioEngine {
  private readonly backend: AudioBackend;
  private readonly crossfadeMs: number;
  private readonly manualWiring: boolean;

  private startPromise: Promise<void> | null = null;
  private disposed = false;

  private unsubSettings: (() => void) | null = null;
  private unsubCamera: (() => void) | null = null;

  constructor(options: AudioEngineOptions) {
    this.backend = options.backend;
    this.crossfadeMs = options.crossfadeMs ?? SOUNDSCAPE_CROSSFADE_MS;
    this.manualWiring = options.manualWiring ?? false;

    if (!this.manualWiring) {
      this.attachStoreSubscriptions();
    }
  }

  /**
   * Return the underlying backend — primarily for tests. The engine treats
   * the backend as opaque; this accessor is *not* part of the runtime
   * contract.
   */
  getBackend(): AudioBackend {
    return this.backend;
  }

  /**
   * AUD-001 entry point — call from a user-gesture handler (click, key, etc).
   * Resolves once the audio context is producing sound. Subsequent calls
   * return the same promise (start-up is single-shot).
   *
   * After a successful start the backend is sync'd with the current
   * settingsStore + cameraStore.scaleRegime values so the user hears the
   * right soundscape at the right volume on the very first frame.
   */
  async start(): Promise<void> {
    if (this.disposed) {
      throw new Error('AudioEngine has been disposed.');
    }
    if (this.startPromise) return this.startPromise;
    this.startPromise = (async (): Promise<void> => {
      await this.backend.ensureStarted();
      // Sync once on entry — until now the backend was idle and we couldn't
      // push gains/regime through.
      this.backend.setVolumes(this.snapshotVolumes());
      this.backend.setScaleRegime(useCameraStore.getState().scaleRegime, 0);
    })();
    return this.startPromise;
  }

  /** True once `start()` has resolved at least once. Mirrors backend state. */
  isStarted(): boolean {
    return this.backend.isStarted();
  }

  /**
   * Manual hook for test harnesses that pass `manualWiring: true`. Forwards
   * the current settings snapshot through the backend — same logic the
   * subscription would have run.
   */
  syncSettings(): void {
    if (!this.backend.isStarted()) return;
    this.backend.setVolumes(this.snapshotVolumes());
  }

  /**
   * Manual hook for test harnesses. Forces a soundscape crossfade for the
   * supplied regime. When `manualWiring=false`, the cameraStore subscription
   * already does this on every regime change.
   */
  setScaleRegime(regime: ScaleRegime, fadeMs?: number): void {
    if (!this.backend.isStarted()) return;
    this.backend.setScaleRegime(regime, fadeMs ?? this.crossfadeMs);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.unsubSettings?.();
    this.unsubCamera?.();
    this.unsubSettings = null;
    this.unsubCamera = null;
    this.backend.dispose();
  }

  // -- private --------------------------------------------------------------

  private attachStoreSubscriptions(): void {
    // Settings — fire on any change to the audio-relevant fields. We use a
    // selector + equality check so unrelated settings (units, language) don't
    // wake the audio engine.
    this.unsubSettings = useSettingsStore.subscribe((state, prev) => {
      if (
        state.masterVolume === prev.masterVolume &&
        state.ambienceVolume === prev.ambienceVolume &&
        state.effectsVolume === prev.effectsVolume &&
        state.isMuted === prev.isMuted
      ) {
        return;
      }
      if (!this.backend.isStarted()) return;
      this.backend.setVolumes(this.snapshotVolumes());
    });

    // Scale regime — crossfade on transition.
    this.unsubCamera = useCameraStore.subscribe((state, prev) => {
      if (state.scaleRegime === prev.scaleRegime) return;
      if (!this.backend.isStarted()) return;
      this.backend.setScaleRegime(state.scaleRegime, this.crossfadeMs);
    });
  }

  private snapshotVolumes(): AudioVolumeState {
    const s: SettingsState = useSettingsStore.getState();
    return {
      master: s.masterVolume,
      ambience: s.ambienceVolume,
      effects: s.effectsVolume,
      muted: s.isMuted,
    };
  }
}
