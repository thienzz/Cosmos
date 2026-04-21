import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  AudioEngine,
  type AudioBackend,
  type AudioVolumeState,
} from '@/audio';
import { useCameraStore, CAMERA_DEFAULT_STATE } from '@/stores/cameraStore';
import {
  useSettingsStore,
  SETTINGS_DEFAULT_STATE,
} from '@/stores/settingsStore';
import type { ScaleRegime } from '@/stores/types';

/**
 * In-memory backend that records every call. Lets us assert engine policy
 * without instantiating a real Tone.js graph (no AudioContext in jsdom).
 */
class StubAudioBackend implements AudioBackend {
  private started = false;
  private active: ScaleRegime | null = null;
  ensureCalls = 0;
  setVolumesCalls: AudioVolumeState[] = [];
  setRegimeCalls: { regime: ScaleRegime; fadeMs: number }[] = [];
  disposeCalls = 0;
  ensureRejection: Error | null = null;

  async ensureStarted(): Promise<void> {
    this.ensureCalls += 1;
    if (this.ensureRejection) throw this.ensureRejection;
    this.started = true;
  }
  isStarted(): boolean {
    return this.started;
  }
  setVolumes(state: AudioVolumeState): void {
    this.setVolumesCalls.push({ ...state });
  }
  setScaleRegime(regime: ScaleRegime, fadeMs: number): void {
    this.setRegimeCalls.push({ regime, fadeMs });
    this.active = regime;
  }
  getActiveRegime(): ScaleRegime | null {
    return this.active;
  }
  dispose(): void {
    this.disposeCalls += 1;
    this.started = false;
  }
}

function resetStores(): void {
  // Reset settings to defaults (no actions to copy across).
  useSettingsStore.setState({ ...SETTINGS_DEFAULT_STATE });
  useCameraStore.setState({ ...CAMERA_DEFAULT_STATE });
}

let engine: AudioEngine | null = null;

beforeEach(() => {
  resetStores();
});

afterEach(() => {
  engine?.dispose();
  engine = null;
  resetStores();
});

describe('AudioEngine — TS-AUDIO-001 (AudioContext inits on user gesture)', () => {
  it('does not start the backend on construction', () => {
    const backend = new StubAudioBackend();
    engine = new AudioEngine({ backend });
    expect(backend.ensureCalls).toBe(0);
    expect(backend.isStarted()).toBe(false);
    expect(engine.isStarted()).toBe(false);
  });

  it('start() invokes backend.ensureStarted and sets started=true', async () => {
    const backend = new StubAudioBackend();
    engine = new AudioEngine({ backend });
    await engine.start();
    expect(backend.ensureCalls).toBe(1);
    expect(engine.isStarted()).toBe(true);
  });

  it('repeated start() calls do not double-start the backend', async () => {
    const backend = new StubAudioBackend();
    engine = new AudioEngine({ backend });
    await Promise.all([engine.start(), engine.start(), engine.start()]);
    expect(backend.ensureCalls).toBe(1);
  });

  it('start() seeds the backend with current volumes + scale regime', async () => {
    useSettingsStore.setState({ masterVolume: 0.42, ambienceVolume: 0.21 });
    useCameraStore.setState({ scaleRegime: 'galactic' });
    const backend = new StubAudioBackend();
    engine = new AudioEngine({ backend });
    await engine.start();
    expect(backend.setVolumesCalls.at(-1)).toMatchObject({
      master: 0.42,
      ambience: 0.21,
    });
    expect(backend.setRegimeCalls.at(-1)).toEqual({
      regime: 'galactic',
      fadeMs: 0,
    });
  });

  it('throws on start() after dispose()', async () => {
    const backend = new StubAudioBackend();
    engine = new AudioEngine({ backend });
    engine.dispose();
    await expect(engine.start()).rejects.toThrow(/disposed/);
  });
});

describe('AudioEngine — TS-AUDIO-002/003 (volume + mute)', () => {
  it('forwards masterVolume change to backend.setVolumes after start', async () => {
    const backend = new StubAudioBackend();
    engine = new AudioEngine({ backend });
    await engine.start();
    backend.setVolumesCalls.length = 0;
    useSettingsStore.getState().setSetting('masterVolume', 0.33);
    expect(backend.setVolumesCalls.at(-1)).toMatchObject({ master: 0.33 });
  });

  it('forwards ambienceVolume changes', async () => {
    const backend = new StubAudioBackend();
    engine = new AudioEngine({ backend });
    await engine.start();
    backend.setVolumesCalls.length = 0;
    useSettingsStore.getState().setSetting('ambienceVolume', 0.55);
    expect(backend.setVolumesCalls.at(-1)).toMatchObject({ ambience: 0.55 });
  });

  it('forwards isMuted toggles', async () => {
    const backend = new StubAudioBackend();
    engine = new AudioEngine({ backend });
    await engine.start();
    backend.setVolumesCalls.length = 0;
    useSettingsStore.getState().setSetting('isMuted', true);
    expect(backend.setVolumesCalls.at(-1)).toMatchObject({ muted: true });
    useSettingsStore.getState().setSetting('isMuted', false);
    expect(backend.setVolumesCalls.at(-1)).toMatchObject({ muted: false });
  });

  it('does not forward volume changes that occur before start()', () => {
    const backend = new StubAudioBackend();
    engine = new AudioEngine({ backend });
    useSettingsStore.getState().setSetting('masterVolume', 0.1);
    expect(backend.setVolumesCalls.length).toBe(0);
  });

  it('ignores changes to non-audio settings', async () => {
    const backend = new StubAudioBackend();
    engine = new AudioEngine({ backend });
    await engine.start();
    backend.setVolumesCalls.length = 0;
    useSettingsStore.getState().setSetting('language', 'fr');
    useSettingsStore.getState().setSetting('crtScanlines', false);
    expect(backend.setVolumesCalls.length).toBe(0);
  });

  it('dispose stops forwarding store changes', async () => {
    const backend = new StubAudioBackend();
    engine = new AudioEngine({ backend });
    await engine.start();
    engine.dispose();
    backend.setVolumesCalls.length = 0;
    useSettingsStore.getState().setSetting('masterVolume', 0.05);
    expect(backend.setVolumesCalls.length).toBe(0);
    expect(backend.disposeCalls).toBe(1);
  });
});

describe('AudioEngine — TS-AUDIO-004 (soundscape changes with scale regime)', () => {
  it('crossfades to new regime when cameraStore.scaleRegime changes', async () => {
    const backend = new StubAudioBackend();
    engine = new AudioEngine({ backend, crossfadeMs: 250 });
    await engine.start();
    backend.setRegimeCalls.length = 0;
    useCameraStore.getState().setScaleRegime('stellar');
    expect(backend.setRegimeCalls).toEqual([{ regime: 'stellar', fadeMs: 250 }]);
    useCameraStore.getState().setScaleRegime('galactic');
    expect(backend.setRegimeCalls.at(-1)).toEqual({
      regime: 'galactic',
      fadeMs: 250,
    });
  });

  it('does not refire for repeated regime writes (no actual change)', async () => {
    const backend = new StubAudioBackend();
    engine = new AudioEngine({ backend });
    await engine.start();
    useCameraStore.setState({ scaleRegime: 'stellar' });
    backend.setRegimeCalls.length = 0;
    useCameraStore.setState({ scaleRegime: 'stellar' });
    useCameraStore.setState({ scaleRegime: 'stellar' });
    expect(backend.setRegimeCalls.length).toBe(0);
  });

  it('regime changes before start() are not forwarded', () => {
    const backend = new StubAudioBackend();
    engine = new AudioEngine({ backend });
    useCameraStore.getState().setScaleRegime('cosmic');
    expect(backend.setRegimeCalls.length).toBe(0);
  });

  it('all four regimes are reachable end-to-end', async () => {
    const backend = new StubAudioBackend();
    engine = new AudioEngine({ backend });
    await engine.start();
    backend.setRegimeCalls.length = 0;
    for (const r of ['solar_system', 'stellar', 'galactic', 'cosmic'] as const) {
      useCameraStore.getState().setScaleRegime(r);
    }
    expect(backend.setRegimeCalls.map((c) => c.regime)).toEqual([
      'stellar',
      'galactic',
      'cosmic',
    ]);
  });

  it('manual setScaleRegime() honours an explicit fadeMs override', async () => {
    const backend = new StubAudioBackend();
    engine = new AudioEngine({
      backend,
      manualWiring: true,
      crossfadeMs: 300,
    });
    await engine.start();
    backend.setRegimeCalls.length = 0;
    engine.setScaleRegime('cosmic', 50);
    expect(backend.setRegimeCalls).toEqual([{ regime: 'cosmic', fadeMs: 50 }]);
    engine.setScaleRegime('stellar');
    expect(backend.setRegimeCalls.at(-1)).toEqual({
      regime: 'stellar',
      fadeMs: 300,
    });
  });
});

describe('AudioEngine — error handling', () => {
  it('surfaces backend.ensureStarted rejection through start()', async () => {
    const backend = new StubAudioBackend();
    backend.ensureRejection = new Error('user gesture missing');
    engine = new AudioEngine({ backend });
    await expect(engine.start()).rejects.toThrow('user gesture missing');
    expect(engine.isStarted()).toBe(false);
  });

  it('manualWiring: true skips store subscriptions entirely', async () => {
    const backend = new StubAudioBackend();
    engine = new AudioEngine({ backend, manualWiring: true });
    await engine.start();
    backend.setVolumesCalls.length = 0;
    backend.setRegimeCalls.length = 0;
    useSettingsStore.getState().setSetting('masterVolume', 0.1);
    useCameraStore.getState().setScaleRegime('cosmic');
    expect(backend.setVolumesCalls.length).toBe(0);
    expect(backend.setRegimeCalls.length).toBe(0);
    // …but the manual sync hook still works.
    engine.syncSettings();
    expect(backend.setVolumesCalls.at(-1)).toMatchObject({ master: 0.1 });
  });
});

describe('AudioEngine — soundscape profile coverage', () => {
  it('profiles cover all four scale regimes', async () => {
    // sanity check that the import wiring is intact + every regime has a profile
    const { SOUNDSCAPE_PROFILES } = await import('@/audio/soundscape');
    const regimes: ScaleRegime[] = ['solar_system', 'stellar', 'galactic', 'cosmic'];
    for (const r of regimes) {
      const p = SOUNDSCAPE_PROFILES[r];
      expect(p).toBeDefined();
      expect(p.regime).toBe(r);
      expect(p.padFrequenciesHz.length).toBeGreaterThan(0);
      expect(p.gain).toBeGreaterThan(0);
      expect(p.gain).toBeLessThanOrEqual(1);
      expect(p.reverbWet).toBeGreaterThanOrEqual(0);
      expect(p.reverbWet).toBeLessThanOrEqual(1);
    }
    // Doc 22 §15.3: master-gain ladder decreases as the camera zooms out.
    const gains = regimes.map((r) => SOUNDSCAPE_PROFILES[r].gain);
    for (let i = 1; i < gains.length; i++) {
      expect(gains[i]).toBeLessThan(gains[i - 1]!);
    }
    // Sub-bass present at galactic + cosmic (Doc 22 §15.3).
    expect(SOUNDSCAPE_PROFILES.solar_system.subBassHz).toBeNull();
    expect(SOUNDSCAPE_PROFILES.stellar.subBassHz).toBeNull();
    expect(SOUNDSCAPE_PROFILES.galactic.subBassHz).not.toBeNull();
    expect(SOUNDSCAPE_PROFILES.cosmic.subBassHz).not.toBeNull();
  });
});

