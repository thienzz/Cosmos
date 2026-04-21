import { beforeEach, describe, expect, it } from 'vitest';

import {
  J2000_JD,
  MAX_EPOCH_JD,
  MIN_EPOCH_JD,
  TIME_DEFAULT_STATE,
  unixMsToJD,
  useTimeStore,
} from '../timeStore.js';

describe('timeStore', () => {
  beforeEach(() => {
    useTimeStore.getState().resetToDefault();
  });

  it('starts at J2000.0 with SPICE epoch bounds', () => {
    const state = useTimeStore.getState();
    expect(state.epochJD).toBe(J2000_JD);
    expect(state.minEpochJD).toBe(MIN_EPOCH_JD);
    expect(state.maxEpochJD).toBe(MAX_EPOCH_JD);
    expect(state.playbackSpeed).toBe(1);
    expect(state.isPlaying).toBe(false);
    expect(state.displayFormat).toBe(TIME_DEFAULT_STATE.displayFormat);
  });

  it('play / pause / togglePlay toggle the isPlaying flag', () => {
    const { play, pause, togglePlay } = useTimeStore.getState();
    play();
    expect(useTimeStore.getState().isPlaying).toBe(true);
    pause();
    expect(useTimeStore.getState().isPlaying).toBe(false);
    togglePlay();
    expect(useTimeStore.getState().isPlaying).toBe(true);
    togglePlay();
    expect(useTimeStore.getState().isPlaying).toBe(false);
  });

  it('setEpoch clamps outside the SPICE kernel range', () => {
    const { setEpoch } = useTimeStore.getState();
    setEpoch(MIN_EPOCH_JD - 1000);
    expect(useTimeStore.getState().epochJD).toBe(MIN_EPOCH_JD);
    setEpoch(MAX_EPOCH_JD + 1000);
    expect(useTimeStore.getState().epochJD).toBe(MAX_EPOCH_JD);
    setEpoch(J2000_JD);
    expect(useTimeStore.getState().epochJD).toBe(J2000_JD);
  });

  it('stepForward and stepBackward move by whole days', () => {
    const { setEpoch, stepForward, stepBackward } = useTimeStore.getState();
    setEpoch(J2000_JD);
    stepForward(30);
    expect(useTimeStore.getState().epochJD).toBeCloseTo(J2000_JD + 30, 6);
    stepBackward(10);
    expect(useTimeStore.getState().epochJD).toBeCloseTo(J2000_JD + 20, 6);
  });

  it('setSpeed accepts a multiplier up to 100,000x', () => {
    const { setSpeed } = useTimeStore.getState();
    setSpeed(365.25);
    expect(useTimeStore.getState().playbackSpeed).toBe(365.25);
    setSpeed(100_000);
    expect(useTimeStore.getState().playbackSpeed).toBe(100_000);
  });

  it('goToNow sets epochJD to a JD within 1 second of Date.now()', () => {
    const before = unixMsToJD(Date.now());
    useTimeStore.getState().goToNow();
    const epoch = useTimeStore.getState().epochJD;
    expect(Math.abs(epoch - before) * 86_400).toBeLessThan(1);
  });

  it('setDisplayFormat accepts each format option', () => {
    const { setDisplayFormat } = useTimeStore.getState();
    for (const format of ['gregorian', 'julian_date', 'mjd'] as const) {
      setDisplayFormat(format);
      expect(useTimeStore.getState().displayFormat).toBe(format);
    }
  });

  it('resetToDefault restores all playback fields', () => {
    const store = useTimeStore.getState();
    store.play();
    store.setSpeed(500);
    store.setEpoch(MIN_EPOCH_JD + 100);
    store.setDisplayFormat('julian_date');
    store.resetToDefault();
    const state = useTimeStore.getState();
    expect(state.epochJD).toBe(J2000_JD);
    expect(state.isPlaying).toBe(false);
    expect(state.playbackSpeed).toBe(1);
    expect(state.displayFormat).toBe('gregorian');
  });
});
