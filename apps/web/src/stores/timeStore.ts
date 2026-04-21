import { create } from 'zustand';

/**
 * Hot-ish state: engine reads current epoch every frame when time is playing.
 * Source: Doc 27 §5.3.
 */
export interface TimeState {
  /** Current simulation epoch in Julian Date. */
  epochJD: number;
  isPlaying: boolean;
  /** 1.0 = real-time; 365.25 = 1 simulated year per wall-clock second. */
  playbackSpeed: number;

  /** Lower SPICE kernel bound (1550 CE). */
  minEpochJD: number;
  /** Upper SPICE kernel bound (2650 CE). */
  maxEpochJD: number;

  displayFormat: 'gregorian' | 'julian_date' | 'mjd';

  // Actions
  setEpoch: (jd: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  stepForward: (days: number) => void;
  stepBackward: (days: number) => void;
  goToNow: () => void;
  setDisplayFormat: (format: TimeState['displayFormat']) => void;
  resetToDefault: () => void;
}

/** J2000.0 epoch — 2000-01-01 12:00 TDB. */
export const J2000_JD = 2_451_545.0;
export const MIN_EPOCH_JD = 2_287_184.5; // 1550-01-01 00:00 TDB
export const MAX_EPOCH_JD = 2_688_976.5; // 2650-01-01 00:00 TDB

/** Convert a Unix epoch (ms) to Julian Date. */
export function unixMsToJD(unixMs: number): number {
  return unixMs / 86_400_000 + 2_440_587.5;
}

function clampEpoch(jd: number): number {
  if (jd < MIN_EPOCH_JD) return MIN_EPOCH_JD;
  if (jd > MAX_EPOCH_JD) return MAX_EPOCH_JD;
  return jd;
}

export const TIME_DEFAULT_STATE: Omit<
  TimeState,
  | 'setEpoch'
  | 'play'
  | 'pause'
  | 'togglePlay'
  | 'setSpeed'
  | 'stepForward'
  | 'stepBackward'
  | 'goToNow'
  | 'setDisplayFormat'
  | 'resetToDefault'
> = {
  epochJD: J2000_JD,
  isPlaying: false,
  playbackSpeed: 1,
  minEpochJD: MIN_EPOCH_JD,
  maxEpochJD: MAX_EPOCH_JD,
  displayFormat: 'gregorian',
};

export const useTimeStore = create<TimeState>()((set, get) => ({
  ...TIME_DEFAULT_STATE,

  setEpoch: (jd) => set({ epochJD: clampEpoch(jd) }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set({ isPlaying: !get().isPlaying }),
  setSpeed: (speed) => set({ playbackSpeed: speed }),

  stepForward: (days) => set({ epochJD: clampEpoch(get().epochJD + days) }),
  stepBackward: (days) => set({ epochJD: clampEpoch(get().epochJD - days) }),

  goToNow: () => set({ epochJD: clampEpoch(unixMsToJD(Date.now())) }),
  setDisplayFormat: (displayFormat) => set({ displayFormat }),

  resetToDefault: () => set(TIME_DEFAULT_STATE),
}));
