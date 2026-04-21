import { defaultTogglesFor, getEntityToggleSpec } from '@cosmos/shared-types';
import { create } from 'zustand';

/**
 * T52 — Doc 22 entity toggle state.
 *
 * Shape: `{ [entId]: { [uniformName]: number } }`. Toggles are scoped per
 * entity *type* (Doc 22 catalogues features per type — all Jupiter-type
 * planets share the "Great Red Spot" toggle). Boolean toggles use 0.0/1.0
 * so the value can flow straight into a float shader uniform (Doc 22 §2.4).
 *
 * Hot-path access: the render loop reads state via `getState()` — no
 * subscriptions, no re-renders (Doc 27 §6.4). React subscribes through
 * `useEntityToggleStore(selector)` for the toggle panel UI.
 *
 * Each entity's state is lazily initialised from `defaultTogglesFor()` the
 * first time a toggle is read or mutated. Unknown ENT-IDs return an empty
 * map — the UI hides the toggle section in that case.
 */

export type EntityToggleMap = Record<string, number>;

export interface EntityToggleState {
  /** Per-entity-type toggle maps. Keys are ENT-IDs like "ENT-2020". */
  readonly toggles: Readonly<Record<string, EntityToggleMap>>;

  /** Read the current value for (entId, uniform). Falls back to spec default. */
  getToggle: (entId: string, uniform: string) => number;

  /** Read the full uniform map for an entity (defaults materialised). */
  getEntityToggles: (entId: string) => EntityToggleMap;

  /** Write a new value. Creates the entity slot if it doesn't exist yet. */
  setToggle: (entId: string, uniform: string, value: number) => void;

  /** Boolean-specific setter for the checkbox UI path. */
  setToggleOn: (entId: string, uniform: string, on: boolean) => void;

  /** Reset one entity to its Doc 22 defaults. */
  resetEntityToggles: (entId: string) => void;

  /** Reset every entity — test-only. */
  resetToDefault: () => void;
}

function ensureEntityMap(
  current: Readonly<Record<string, EntityToggleMap>>,
  entId: string,
): { toggles: Record<string, EntityToggleMap>; map: EntityToggleMap } {
  if (current[entId]) {
    const map = { ...current[entId] };
    return { toggles: { ...current, [entId]: map }, map };
  }
  const map = defaultTogglesFor(entId);
  return { toggles: { ...current, [entId]: map }, map };
}

// Dev-only: expose the store on `window.__cosmosToggleStore` so the preview
// harness + browser devtools can drive it without reaching through React's
// module graph. No-op in production builds.
declare global {
  interface Window {
    __cosmosToggleStore?: unknown;
  }
}

export const useEntityToggleStore = create<EntityToggleState>()((set, get) => ({
  toggles: {},

  getToggle: (entId, uniform) => {
    const slot = get().toggles[entId];
    if (slot && uniform in slot) return slot[uniform] ?? 0;
    const spec = getEntityToggleSpec(entId);
    const feat = spec?.features.find((f) => f.uniform === uniform);
    return feat?.defaultOn ? 1.0 : 0.0;
  },

  getEntityToggles: (entId) => {
    const slot = get().toggles[entId];
    if (slot) return slot;
    return defaultTogglesFor(entId);
  },

  setToggle: (entId, uniform, value) => {
    const { toggles, map } = ensureEntityMap(get().toggles, entId);
    map[uniform] = value;
    set({ toggles });
  },

  setToggleOn: (entId, uniform, on) => {
    const { toggles, map } = ensureEntityMap(get().toggles, entId);
    map[uniform] = on ? 1.0 : 0.0;
    set({ toggles });
  },

  resetEntityToggles: (entId) => {
    const next = { ...get().toggles };
    next[entId] = defaultTogglesFor(entId);
    set({ toggles: next });
  },

  resetToDefault: () => set({ toggles: {} }),
}));

if (import.meta.env?.DEV && typeof window !== 'undefined') {
  window.__cosmosToggleStore = useEntityToggleStore;
}
