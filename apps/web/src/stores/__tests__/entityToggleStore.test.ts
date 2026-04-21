import { ENTITY_TOGGLES, ENTITY_TOGGLES_COUNT } from '@cosmos/shared-types';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useEntityToggleStore } from '../entityToggleStore';

describe('entityToggleStore', () => {
  beforeEach(() => useEntityToggleStore.getState().resetToDefault());
  afterEach(() => useEntityToggleStore.getState().resetToDefault());

  it('returns Doc 22 default for an untouched entity', () => {
    // Jupiter's Great Red Spot (u_gRSActive) is default ON per Doc 22.
    expect(useEntityToggleStore.getState().getToggle('ENT-2020', 'u_gRSActive')).toBe(1);
    // Impact Scars is default OFF.
    expect(useEntityToggleStore.getState().getToggle('ENT-2020', 'u_impactScars')).toBe(0);
  });

  it('setToggle overrides the default and persists', () => {
    useEntityToggleStore.getState().setToggle('ENT-2020', 'u_gRSActive', 0);
    expect(useEntityToggleStore.getState().getToggle('ENT-2020', 'u_gRSActive')).toBe(0);
    // Unrelated entity unaffected — Io's volcanic activity is default ON.
    expect(useEntityToggleStore.getState().getToggle('ENT-3010', 'u_volcanicActivity')).toBe(1);
  });

  it('resetEntityToggles restores defaults for one entity', () => {
    useEntityToggleStore.getState().setToggleOn('ENT-2020', 'u_gRSActive', false);
    expect(useEntityToggleStore.getState().getToggle('ENT-2020', 'u_gRSActive')).toBe(0);
    useEntityToggleStore.getState().resetEntityToggles('ENT-2020');
    expect(useEntityToggleStore.getState().getToggle('ENT-2020', 'u_gRSActive')).toBe(1);
  });

  it('getEntityToggles materialises the full default map', () => {
    const map = useEntityToggleStore.getState().getEntityToggles('ENT-2020');
    expect(Object.keys(map).length).toBeGreaterThanOrEqual(20);
    expect(map.u_gRSActive).toBe(1);
    expect(map.u_impactScars).toBe(0);
  });

  it('returns 0 for unknown entity IDs', () => {
    expect(useEntityToggleStore.getState().getToggle('ENT-9999', 'u_whatever')).toBe(0);
    expect(useEntityToggleStore.getState().getEntityToggles('ENT-9999')).toEqual({});
  });

  it('generated catalog covers all 96 Doc 22 entity types', () => {
    expect(ENTITY_TOGGLES_COUNT).toBe(96);
    expect(Object.keys(ENTITY_TOGGLES)).toHaveLength(96);
  });
});
