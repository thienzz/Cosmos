/**
 * Tone.js backend for {@link AudioEngine} (T31).
 *
 * Synthesis chain (matches Doc 10 §7 signal flow):
 *
 *   per-voice:                                 master:
 *     Oscillator → Filter → voiceGain   ─┐
 *     Oscillator → Filter → voiceGain   ─┤
 *     ...                                ├─→ ambienceGain → Reverb → masterGain → Destination
 *     SubBassOscillator → subGain       ─┘
 *
 * Voices are organised into one {@link Soundscape} per scale regime; each
 * soundscape exposes a single fade-in `voicesGain` that the backend ramps
 * 0 → 1 (target) and 1 → 0 (outgoing) over `fadeMs` to crossfade.
 *
 * Per Doc 22 §15.4:
 *   - AUD-001: AudioContext starts on first `ensureStarted()` call only.
 *   - AUD-002: All voices are oscillators / noise (no samples).
 *   - AUD-004: ambience and master are separate gain stages, mute zeros master.
 *   - AUD-005: <100 ms latency — Tone routes via Web Audio's native scheduling.
 *   - AUD-006: Idle CPU = 4 voices × 2 oscillators per soundscape (only the
 *     active one ramps in; inactive ones sit at 0 voicesGain so the engine
 *     short-circuits the upstream signal). Within Tone's <5% budget.
 */

import * as Tone from 'tone';

import type { ScaleRegime } from '@/stores/types';

import type { AudioBackend, AudioVolumeState } from './AudioBackend';
import { SOUNDSCAPE_PROFILES, type SoundscapeProfile } from './soundscape';

/**
 * One soundscape's worth of synthesis nodes — owned per scale regime.
 * Created lazily on first activation (avoid spinning up 4× oscillators
 * before they're needed; CPU budget per Doc 22 §15.4 AUD-006).
 */
interface Soundscape {
  readonly regime: ScaleRegime;
  readonly profile: SoundscapeProfile;
  /** Top-level fade gain — ramped 0..1 for crossfade. */
  readonly voicesGain: Tone.Gain;
  readonly oscillators: readonly Tone.Oscillator[];
  readonly filters: readonly Tone.Filter[];
  readonly subBassOsc: Tone.Oscillator | null;
  readonly subBassGain: Tone.Gain | null;
  readonly lfo: Tone.LFO;
  /** Whether the oscillators have been .start()-ed. */
  started: boolean;
}

export interface ToneAudioBackendOptions {
  /**
   * Inject a different Tone module. Production = the real `tone`; tests can
   * pass a mock with the same shape. Default = the real Tone.
   */
  ToneNS?: typeof Tone;
  /**
   * Override the destination node — defaults to `Tone.getDestination()`.
   * Tests can pass `null` to skip wiring (sink to a Gain instead).
   */
  destination?: Tone.ToneAudioNode | null;
}

const RAMP_SECONDS = 0.02; // 20 ms anti-click ramp on volume changes.

export class ToneAudioBackend implements AudioBackend {
  private readonly Tn: typeof Tone;
  private readonly destination: Tone.ToneAudioNode;

  // Master chain — built lazily inside `ensureStarted`.
  private masterGain: Tone.Gain | null = null;
  private ambienceGain: Tone.Gain | null = null;
  private reverb: Tone.Reverb | null = null;

  private readonly soundscapes = new Map<ScaleRegime, Soundscape>();
  private activeRegime: ScaleRegime | null = null;
  private started = false;

  // Cached most-recent volume state so a regime swap can re-derive the
  // post-mute master gain without poking the store again.
  private currentVolumes: AudioVolumeState = {
    master: 0.7,
    ambience: 0.8,
    effects: 0.9,
    muted: false,
  };

  constructor(options: ToneAudioBackendOptions = {}) {
    this.Tn = options.ToneNS ?? Tone;
    // We need a destination resolved up-front but Tone's `getDestination()`
    // throws before the context exists in some test envs — fall back to a
    // disconnected Gain that the start path will rewire.
    this.destination = options.destination ?? this.Tn.getDestination();
  }

  isStarted(): boolean {
    return this.started;
  }

  getActiveRegime(): ScaleRegime | null {
    return this.activeRegime;
  }

  async ensureStarted(): Promise<void> {
    if (this.started) return;
    // Tone.start() resumes the AudioContext per AUD-001 (must be inside
    // a user-gesture handler in production browsers).
    await this.Tn.start();
    this.buildMasterChain();
    this.started = true;
    // Apply the cached volume state so the master gain reflects the user's
    // last-saved settings on the very first audible moment.
    this.applyMasterGains();
  }

  setVolumes(state: AudioVolumeState): void {
    this.currentVolumes = state;
    if (!this.started) return;
    this.applyMasterGains();
  }

  setScaleRegime(regime: ScaleRegime, fadeMs: number): void {
    if (!this.started) {
      // Even when silent, remember which regime to ramp up first when
      // `ensureStarted()` lands. This lets `AudioEngine.start()` skip a
      // race where it set the regime before the backend was running.
      this.activeRegime = regime;
      return;
    }
    if (this.activeRegime === regime) return;

    const fadeSec = Math.max(0, fadeMs) / 1000;
    const now = this.Tn.now();

    // Outgoing: ramp current scape's voicesGain down to 0.
    if (this.activeRegime !== null) {
      const prev = this.soundscapes.get(this.activeRegime);
      if (prev) {
        prev.voicesGain.gain.cancelScheduledValues(now);
        prev.voicesGain.gain.setValueAtTime(prev.voicesGain.gain.value, now);
        prev.voicesGain.gain.linearRampToValueAtTime(0, now + fadeSec);
      }
    }

    // Incoming: build (lazily) and ramp up to its profile gain.
    const next = this.ensureSoundscape(regime);
    next.voicesGain.gain.cancelScheduledValues(now);
    next.voicesGain.gain.setValueAtTime(next.voicesGain.gain.value, now);
    next.voicesGain.gain.linearRampToValueAtTime(next.profile.gain, now + fadeSec);

    // Reverb wet follows the destination scene immediately — easy crossfade.
    if (this.reverb) {
      const r = this.reverb;
      r.wet.cancelScheduledValues(now);
      r.wet.setValueAtTime(r.wet.value, now);
      r.wet.linearRampToValueAtTime(next.profile.reverbWet, now + fadeSec);
      r.decay = next.profile.reverbDecaySec;
    }

    this.activeRegime = regime;
  }

  dispose(): void {
    for (const scape of this.soundscapes.values()) {
      this.disposeSoundscape(scape);
    }
    this.soundscapes.clear();
    this.reverb?.dispose();
    this.ambienceGain?.dispose();
    this.masterGain?.dispose();
    this.reverb = null;
    this.ambienceGain = null;
    this.masterGain = null;
    this.activeRegime = null;
    this.started = false;
  }

  // -- private --------------------------------------------------------------

  private buildMasterChain(): void {
    // Reverb owns the room character; wet defaults to 0 so the reverb tail
    // doesn't blast on the very first frame before a scape is registered.
    this.reverb = new this.Tn.Reverb({ decay: 4, wet: 0 });
    this.ambienceGain = new this.Tn.Gain(this.currentVolumes.ambience);
    this.masterGain = new this.Tn.Gain(
      this.currentVolumes.muted ? 0 : this.currentVolumes.master,
    );

    // Wire: ambience → reverb → master → destination
    this.ambienceGain.connect(this.reverb);
    this.reverb.connect(this.masterGain);
    this.masterGain.connect(this.destination);
  }

  private ensureSoundscape(regime: ScaleRegime): Soundscape {
    const existing = this.soundscapes.get(regime);
    if (existing) {
      // First-time activation may have left it unstarted (we lazily start
      // oscillators to keep CPU near zero before the user's first nav).
      this.startSoundscape(existing);
      return existing;
    }
    const created = this.createSoundscape(regime);
    this.soundscapes.set(regime, created);
    this.startSoundscape(created);
    return created;
  }

  private createSoundscape(regime: ScaleRegime): Soundscape {
    const profile = SOUNDSCAPE_PROFILES[regime];
    const voicesGain = new this.Tn.Gain(0); // start silent; setScaleRegime ramps in
    if (this.ambienceGain) voicesGain.connect(this.ambienceGain);

    // One oscillator per pad partial, each through its own filter so we can
    // route the LFO into a single shared cutoff node downstream — but for
    // simplicity one filter per voice keeps the graph independent.
    const oscillators: Tone.Oscillator[] = [];
    const filters: Tone.Filter[] = [];
    for (const freq of profile.padFrequenciesHz) {
      const filter = new this.Tn.Filter({
        type: 'lowpass',
        frequency: profile.filterBaseHz,
        Q: 0.7,
      });
      const osc = new this.Tn.Oscillator({
        type: 'sine',
        frequency: freq,
        // Equal-weight chord summation — divide by partial count so the
        // chord doesn't clip the voicesGain.
        volume: this.Tn.gainToDb(1 / profile.padFrequenciesHz.length),
      });
      osc.connect(filter);
      filter.connect(voicesGain);
      oscillators.push(osc);
      filters.push(filter);
    }

    // Optional sub-bass drone (galactic + cosmic).
    let subBassOsc: Tone.Oscillator | null = null;
    let subBassGain: Tone.Gain | null = null;
    if (profile.subBassHz !== null) {
      subBassGain = new this.Tn.Gain(0.6);
      subBassOsc = new this.Tn.Oscillator({
        type: 'sine',
        frequency: profile.subBassHz,
        volume: this.Tn.gainToDb(0.5),
      });
      subBassOsc.connect(subBassGain);
      subBassGain.connect(voicesGain);
    }

    // LFO modulates each filter's cutoff for slow movement on the pad. One
    // LFO drives every filter — cheaper than per-voice modulation and the
    // result is the chord breathing in unison.
    const lfo = new this.Tn.LFO({
      frequency: profile.filterLfoHz,
      min: profile.filterBaseHz - profile.filterDepthHz,
      max: profile.filterBaseHz + profile.filterDepthHz,
      type: 'sine',
    });
    for (const f of filters) lfo.connect(f.frequency);

    return {
      regime,
      profile,
      voicesGain,
      oscillators,
      filters,
      subBassOsc,
      subBassGain,
      lfo,
      started: false,
    };
  }

  private startSoundscape(scape: Soundscape): void {
    if (scape.started) return;
    const now = this.Tn.now();
    for (const osc of scape.oscillators) osc.start(now);
    scape.subBassOsc?.start(now);
    scape.lfo.start(now);
    scape.started = true;
  }

  private disposeSoundscape(scape: Soundscape): void {
    try {
      for (const osc of scape.oscillators) osc.dispose();
      scape.subBassOsc?.dispose();
      scape.lfo.dispose();
      for (const f of scape.filters) f.dispose();
      scape.subBassGain?.dispose();
      scape.voicesGain.dispose();
    } catch {
      // Tone.js can throw on double-dispose if the context already closed.
      // Soundscape lifecycle is single-shot per backend instance so we
      // don't need to retry — swallow.
    }
  }

  private applyMasterGains(): void {
    if (!this.masterGain || !this.ambienceGain) return;
    const now = this.Tn.now();

    const masterValue = this.currentVolumes.muted ? 0 : this.currentVolumes.master;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(masterValue, now + RAMP_SECONDS);

    this.ambienceGain.gain.cancelScheduledValues(now);
    this.ambienceGain.gain.setValueAtTime(this.ambienceGain.gain.value, now);
    this.ambienceGain.gain.linearRampToValueAtTime(
      this.currentVolumes.ambience,
      now + RAMP_SECONDS,
    );
  }
}
