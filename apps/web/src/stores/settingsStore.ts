import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { createDexieSettingsStorage } from '../persistence/dexieStorage';

/**
 * Cold/persisted state: loaded from IndexedDB on app start, saved on every
 * change. T23 swaps the zustand persist backend from pure localStorage to a
 * Dexie-backed adapter that dual-writes (localStorage for the sync read
 * during first paint, IndexedDB for the durable copy).
 * Source: Doc 27 §5.7, §13.
 */
export type QualityPreset = 'low' | 'medium' | 'high' | 'ultra' | 'auto';
export type GpuTier = 'low' | 'mid' | 'high';
export type UnitsSystem = 'metric' | 'imperial' | 'astronomical';
export type DistanceUnit = 'ly' | 'pc' | 'au' | 'km';
export type CoordinateFormat = 'decimal' | 'hms_dms';
/**
 * P2D — solar-system visual scale mode (Doc 22 §Scale tradeoff).
 *   default    : current educational compression — every planet ≥ 0.6 u
 *                so even Mercury is readable at Neptune-distance frames.
 *                Sun/Earth ratio visually ~3.5× (real ≈ 109).
 *   realistic  : Sun dominant (up to ~5 u), rocky planets shrunk to a
 *                0.35 u floor. Sun/Earth ratio visually ~14× — closer to
 *                reality, still usable at default camera framing.
 */
export type SolarSystemScaleMode = 'default' | 'realistic';

export interface SettingsState {
  // Display
  language: string;
  units: UnitsSystem;
  distanceUnit: DistanceUnit;
  coordinateFormat: CoordinateFormat;

  // Graphics
  qualityPreset: QualityPreset;
  gpuTier: GpuTier;
  bloomIntensity: number;
  crtScanlines: boolean;
  phosphorGlow: boolean;
  starPointSize: number;
  /**
   * T30 — additional post-processing toggles. Doc 18 §3.5 + Doc 16
   * accessibility: each feature has its own switch so reduced-motion
   * users can keep bloom while killing the animated grain, etc.
   */
  chromaticAberration: boolean;
  filmGrain: boolean;
  vignette: boolean;
  fxaa: boolean;
  /** T30 — enable the Doc 18 §Black Hole Schwarzschild lensing post pass. */
  gravitationalLensing: boolean;

  /**
   * P2D — visual scale profile for the solar-system renderer. Changes take
   * effect on the next engine mount (reload or persona switch); live
   * swaps rebuild body meshes which is too heavy for a toggle response.
   */
  solarSystemScaleMode: SolarSystemScaleMode;

  // Audio
  masterVolume: number;
  isMuted: boolean;
  ambienceVolume: number;
  effectsVolume: number;

  // Accessibility
  reducedMotion: boolean;
  highContrast: boolean;
  screenReaderMode: boolean;

  // Session
  sessionToken: string;
  recentSearches: string[];

  // Actions
  setSetting: <K extends SettingKey>(key: K, value: SettingsState[K]) => void;
  pushRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  resetToDefaults: () => void;
  importSettings: (json: string) => void;
  exportSettings: () => string;
}

/** Keys that represent stored settings (excludes action function properties). */
type SettingKey = {
  [K in keyof SettingsState]: SettingsState[K] extends (...args: never[]) => unknown
    ? never
    : K;
}[keyof SettingsState];

export const SETTINGS_DEFAULT_STATE: Pick<SettingsState, SettingKey> = {
  language: 'en',
  units: 'astronomical',
  distanceUnit: 'pc',
  coordinateFormat: 'decimal',

  qualityPreset: 'auto',
  gpuTier: 'mid',
  bloomIntensity: 0.6,
  crtScanlines: true,
  phosphorGlow: true,
  starPointSize: 1,
  chromaticAberration: true,
  filmGrain: true,
  vignette: true,
  fxaa: true,
  gravitationalLensing: true,
  solarSystemScaleMode: 'default',

  masterVolume: 0.7,
  isMuted: false,
  ambienceVolume: 0.8,
  effectsVolume: 0.9,

  reducedMotion: false,
  highContrast: false,
  screenReaderMode: false,

  sessionToken: '',
  recentSearches: [],
};

const MAX_RECENT_SEARCHES = 10;

export const SETTINGS_STORAGE_KEY = 'cosmos.settings.v1';

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...SETTINGS_DEFAULT_STATE,

      setSetting: (key, value) => set({ [key]: value } as Partial<SettingsState>),

      pushRecentSearch: (query) => {
        const trimmed = query.trim();
        if (!trimmed) return;
        const current = get().recentSearches;
        const deduped = [trimmed, ...current.filter((q) => q !== trimmed)];
        set({ recentSearches: deduped.slice(0, MAX_RECENT_SEARCHES) });
      },

      clearRecentSearches: () => set({ recentSearches: [] }),

      resetToDefaults: () => set(SETTINGS_DEFAULT_STATE),

      importSettings: (json) => {
        const parsed: unknown = JSON.parse(json);
        if (parsed === null || typeof parsed !== 'object') {
          throw new Error('Settings JSON must be an object.');
        }
        const known = new Set(Object.keys(SETTINGS_DEFAULT_STATE));
        const next: Partial<SettingsState> = {};
        for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
          if (known.has(key)) {
            (next as Record<string, unknown>)[key] = value;
          }
        }
        set({ ...SETTINGS_DEFAULT_STATE, ...next });
      },

      exportSettings: () => {
        const state = get();
        const payload: Record<string, unknown> = {};
        for (const key of Object.keys(SETTINGS_DEFAULT_STATE)) {
          payload[key] = state[key as SettingKey];
        }
        return JSON.stringify(payload);
      },
    }),
    {
      name: SETTINGS_STORAGE_KEY,
      storage: createJSONStorage(() => createDexieSettingsStorage()),
      partialize: (state) => {
        const persisted: Partial<SettingsState> = {};
        for (const key of Object.keys(SETTINGS_DEFAULT_STATE) as SettingKey[]) {
          (persisted as Record<string, unknown>)[key] = state[key];
        }
        return persisted;
      },
    },
  ),
);
