import { beforeEach, describe, expect, it } from 'vitest';

import {
  SETTINGS_DEFAULT_STATE,
  SETTINGS_STORAGE_KEY,
  useSettingsStore,
} from '../settingsStore.js';

describe('settingsStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.getState().resetToDefaults();
  });

  it('starts with the documented default preferences', () => {
    const state = useSettingsStore.getState();
    expect(state.language).toBe(SETTINGS_DEFAULT_STATE.language);
    expect(state.units).toBe('astronomical');
    expect(state.distanceUnit).toBe('pc');
    expect(state.qualityPreset).toBe('auto');
    expect(state.gpuTier).toBe('mid');
    expect(state.masterVolume).toBeCloseTo(0.7);
    expect(state.isMuted).toBe(false);
    expect(state.reducedMotion).toBe(false);
    expect(state.recentSearches).toEqual([]);
  });

  it('setSetting updates typed fields and triggers persistence', () => {
    const { setSetting } = useSettingsStore.getState();
    setSetting('qualityPreset', 'high');
    setSetting('masterVolume', 0.25);
    setSetting('isMuted', true);
    setSetting('reducedMotion', true);

    const state = useSettingsStore.getState();
    expect(state.qualityPreset).toBe('high');
    expect(state.masterVolume).toBeCloseTo(0.25);
    expect(state.isMuted).toBe(true);
    expect(state.reducedMotion).toBe(true);

    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw ?? '{}') as { state: Record<string, unknown> };
    expect(parsed.state.qualityPreset).toBe('high');
    expect(parsed.state.reducedMotion).toBe(true);
  });

  it('pushRecentSearch dedupes and caps at 10 entries', () => {
    const { pushRecentSearch } = useSettingsStore.getState();
    for (let i = 0; i < 15; i++) {
      pushRecentSearch(`query-${i}`);
    }
    pushRecentSearch('query-3'); // existing entry gets moved to the front
    const recent = useSettingsStore.getState().recentSearches;
    expect(recent).toHaveLength(10);
    expect(recent[0]).toBe('query-3');
    expect(new Set(recent).size).toBe(10); // no duplicates
  });

  it('pushRecentSearch ignores empty / whitespace queries', () => {
    const { pushRecentSearch } = useSettingsStore.getState();
    pushRecentSearch('');
    pushRecentSearch('   ');
    expect(useSettingsStore.getState().recentSearches).toEqual([]);
  });

  it('clearRecentSearches empties the list', () => {
    const store = useSettingsStore.getState();
    store.pushRecentSearch('alpha');
    store.pushRecentSearch('beta');
    store.clearRecentSearches();
    expect(useSettingsStore.getState().recentSearches).toEqual([]);
  });

  it('resetToDefaults restores after mutations', () => {
    const store = useSettingsStore.getState();
    store.setSetting('qualityPreset', 'low');
    store.setSetting('isMuted', true);
    store.pushRecentSearch('something');
    store.resetToDefaults();
    const state = useSettingsStore.getState();
    expect(state.qualityPreset).toBe(SETTINGS_DEFAULT_STATE.qualityPreset);
    expect(state.isMuted).toBe(false);
    expect(state.recentSearches).toEqual([]);
  });

  it('exportSettings produces JSON that importSettings can round-trip', () => {
    const store = useSettingsStore.getState();
    store.setSetting('qualityPreset', 'ultra');
    store.setSetting('bloomIntensity', 0.9);
    store.setSetting('language', 'vi');
    const exported = store.exportSettings();

    store.resetToDefaults();
    store.importSettings(exported);

    const state = useSettingsStore.getState();
    expect(state.qualityPreset).toBe('ultra');
    expect(state.bloomIntensity).toBeCloseTo(0.9);
    expect(state.language).toBe('vi');
  });

  it('importSettings ignores unknown keys', () => {
    useSettingsStore
      .getState()
      .importSettings(JSON.stringify({ qualityPreset: 'high', bogus: 'xxx' }));
    const state = useSettingsStore.getState();
    expect(state.qualityPreset).toBe('high');
    expect((state as unknown as { bogus?: unknown }).bogus).toBeUndefined();
  });

  it('importSettings rejects non-object JSON', () => {
    expect(() => useSettingsStore.getState().importSettings('"nope"')).toThrow();
    expect(() => useSettingsStore.getState().importSettings('null')).toThrow();
  });
});
