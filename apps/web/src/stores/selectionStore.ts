import { create } from 'zustand';

// Dev-only: expose the store on `window.__cosmosSelectionStore` so the
// preview harness + devtools can drive selection without routing through
// React's module graph. No-op in production builds.
declare global {
  interface Window {
    __cosmosSelectionStore?: unknown;
  }
}

import { ApiError, getSolarSystemBody } from '@/api';
import {
  apiSolarSystemBodyToEntityData,
} from '@/data/entityAdapter';

import type { EntityData, EntityPreview } from './types.js';

/**
 * Warm state: updated on click / search result activation.
 * Source: Doc 27 §5.2.
 */
export interface SelectionState {
  selectedEntityId: number | null;
  selectedEntity: EntityData | null;
  isLoadingEntity: boolean;

  hoveredEntityId: number | null;
  hoveredEntityPreview: EntityPreview | null;

  /** Undo/redo stack of entity IDs. Index points at the "current" entry. */
  history: number[];
  historyIndex: number;

  /** Last fetch error, surfaced for debugging. UI reads via `selectionError`. */
  selectionError: string | null;

  // Actions
  selectEntity: (id: number, data?: EntityData) => void;
  /**
   * T18: optimistically seed selection with `optimisticData` (usually the
   * client-side synthesis from `bodyToEntity`), then kick off
   * `GET /solar-system/bodies/:naifId` and upgrade when the real payload
   * arrives. A newer selection before the fetch resolves is respected —
   * the stale response is dropped.
   */
  selectEntityAsync: (
    id: number,
    optimisticData: EntityData | null,
    opts?: { fetcher?: (naifId: number) => Promise<EntityData> },
  ) => Promise<void>;
  setSelectedEntityData: (data: EntityData | null) => void;
  setLoadingEntity: (loading: boolean) => void;
  clearSelection: () => void;
  setHover: (id: number | null, preview?: EntityPreview | null) => void;
  goBack: () => void;
  goForward: () => void;
  resetToDefault: () => void;
}

export const SELECTION_DEFAULT_STATE: Omit<
  SelectionState,
  | 'selectEntity'
  | 'selectEntityAsync'
  | 'setSelectedEntityData'
  | 'setLoadingEntity'
  | 'clearSelection'
  | 'setHover'
  | 'goBack'
  | 'goForward'
  | 'resetToDefault'
> = {
  selectedEntityId: null,
  selectedEntity: null,
  isLoadingEntity: false,
  selectionError: null,
  hoveredEntityId: null,
  hoveredEntityPreview: null,
  history: [],
  historyIndex: -1,
};

/** Default async fetcher: call `GET /solar-system/bodies/:naifId` + adapt. */
async function defaultSolarSystemFetcher(naifId: number): Promise<EntityData> {
  const body = await getSolarSystemBody(naifId);
  return apiSolarSystemBodyToEntityData(body);
}

export const useSelectionStore = create<SelectionState>()((set, get) => ({
  ...SELECTION_DEFAULT_STATE,

  selectEntity: (id, data) => {
    const { history, historyIndex } = get();
    // Discard any forward history when a new selection is made.
    const trimmed = history.slice(0, historyIndex + 1);
    const nextHistory = trimmed[trimmed.length - 1] === id ? trimmed : [...trimmed, id];
    set({
      selectedEntityId: id,
      selectedEntity: data ?? null,
      isLoadingEntity: data === undefined,
      selectionError: null,
      history: nextHistory,
      historyIndex: nextHistory.length - 1,
    });
  },

  selectEntityAsync: async (id, optimisticData, opts = {}) => {
    // Seed synchronously via the existing path — InfoPanel shows immediately.
    get().selectEntity(id, optimisticData ?? undefined);
    set({ isLoadingEntity: true, selectionError: null });
    const fetcher = opts.fetcher ?? defaultSolarSystemFetcher;
    try {
      const fresh = await fetcher(id);
      // Stale response? User already clicked another body.
      if (get().selectedEntityId !== id) return;
      set({
        selectedEntity: fresh,
        isLoadingEntity: false,
        selectionError: null,
      });
    } catch (err) {
      if (get().selectedEntityId !== id) return;
      const message =
        err instanceof ApiError
          ? `${err.code}: ${err.message}`
          : err instanceof Error
            ? err.message
            : String(err);
      // Keep whatever optimistic data we already have; just surface the error.
      set({ isLoadingEntity: false, selectionError: message });
    }
  },

  setSelectedEntityData: (data) =>
    set({
      selectedEntity: data,
      selectedEntityId: data?.id ?? null,
      isLoadingEntity: false,
    }),

  setLoadingEntity: (isLoadingEntity) => set({ isLoadingEntity }),

  clearSelection: () =>
    set({
      selectedEntityId: null,
      selectedEntity: null,
      isLoadingEntity: false,
      selectionError: null,
    }),

  setHover: (id, preview) =>
    set({
      hoveredEntityId: id,
      hoveredEntityPreview: preview ?? null,
    }),

  goBack: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    const nextIndex = historyIndex - 1;
    set({
      historyIndex: nextIndex,
      selectedEntityId: history[nextIndex] ?? null,
      selectedEntity: null,
      isLoadingEntity: history[nextIndex] !== undefined,
    });
  },

  goForward: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    set({
      historyIndex: nextIndex,
      selectedEntityId: history[nextIndex] ?? null,
      selectedEntity: null,
      isLoadingEntity: history[nextIndex] !== undefined,
    });
  },

  resetToDefault: () => set(SELECTION_DEFAULT_STATE),
}));

if (import.meta.env?.DEV && typeof window !== 'undefined') {
  window.__cosmosSelectionStore = useSelectionStore;
}
