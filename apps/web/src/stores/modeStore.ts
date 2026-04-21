import { create } from 'zustand';

import type { AppMode } from './types.js';

/**
 * Cool state: updated on mode or journey change.
 * Source: Doc 27 §5.4, §10.
 */
export interface ModeState {
  activeMode: AppMode;

  tourId: string | null;
  tourStep: number;
  tourTotalSteps: number;

  educationTopic: string | null;
  researchDatasetId: string | null;

  // Actions
  setMode: (mode: AppMode) => void;
  startTour: (tourId: string, totalSteps: number) => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  exitTour: () => void;
  setEducationTopic: (topic: string | null) => void;
  setResearchDatasetId: (datasetId: string | null) => void;
  resetToDefault: () => void;
}

export const MODE_DEFAULT_STATE: Omit<
  ModeState,
  | 'setMode'
  | 'startTour'
  | 'nextTourStep'
  | 'prevTourStep'
  | 'exitTour'
  | 'setEducationTopic'
  | 'setResearchDatasetId'
  | 'resetToDefault'
> = {
  activeMode: 'exploration',
  tourId: null,
  tourStep: 0,
  tourTotalSteps: 0,
  educationTopic: null,
  researchDatasetId: null,
};

/**
 * Per Doc 27 §10, Guided Tour can only be entered from Education or Exploration.
 * Other transitions are unrestricted.
 */
function canStartTour(from: AppMode): boolean {
  return from === 'exploration' || from === 'education';
}

export const useModeStore = create<ModeState>()((set, get) => ({
  ...MODE_DEFAULT_STATE,

  setMode: (mode) => {
    // Exiting guided_tour wipes tour state to avoid stale step pointers.
    if (get().activeMode === 'guided_tour' && mode !== 'guided_tour') {
      set({
        activeMode: mode,
        tourId: null,
        tourStep: 0,
        tourTotalSteps: 0,
      });
      return;
    }
    set({ activeMode: mode });
  },

  startTour: (tourId, totalSteps) => {
    if (!canStartTour(get().activeMode)) {
      return;
    }
    set({
      activeMode: 'guided_tour',
      tourId,
      tourStep: 0,
      tourTotalSteps: totalSteps,
    });
  },

  nextTourStep: () => {
    const { tourStep, tourTotalSteps } = get();
    if (tourStep + 1 >= tourTotalSteps) return;
    set({ tourStep: tourStep + 1 });
  },

  prevTourStep: () => {
    const { tourStep } = get();
    if (tourStep <= 0) return;
    set({ tourStep: tourStep - 1 });
  },

  exitTour: () =>
    set({
      activeMode: 'exploration',
      tourId: null,
      tourStep: 0,
      tourTotalSteps: 0,
    }),

  setEducationTopic: (educationTopic) => set({ educationTopic }),
  setResearchDatasetId: (researchDatasetId) => set({ researchDatasetId }),

  resetToDefault: () => set(MODE_DEFAULT_STATE),
}));
