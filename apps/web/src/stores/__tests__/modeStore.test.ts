import { beforeEach, describe, expect, it } from 'vitest';

import { MODE_DEFAULT_STATE, useModeStore } from '../modeStore.js';

describe('modeStore', () => {
  beforeEach(() => {
    useModeStore.getState().resetToDefault();
  });

  it('starts in exploration mode with no active tour', () => {
    const state = useModeStore.getState();
    expect(state.activeMode).toBe('exploration');
    expect(state.tourId).toBeNull();
    expect(state.tourStep).toBe(MODE_DEFAULT_STATE.tourStep);
    expect(state.tourTotalSteps).toBe(MODE_DEFAULT_STATE.tourTotalSteps);
    expect(state.educationTopic).toBeNull();
    expect(state.researchDatasetId).toBeNull();
  });

  it('setMode switches between the five modes', () => {
    const { setMode } = useModeStore.getState();
    for (const mode of ['observation', 'education', 'research', 'exploration'] as const) {
      setMode(mode);
      expect(useModeStore.getState().activeMode).toBe(mode);
    }
  });

  it('startTour is allowed from exploration or education only', () => {
    const { setMode, startTour } = useModeStore.getState();

    setMode('exploration');
    startTour('J1', 5);
    expect(useModeStore.getState().activeMode).toBe('guided_tour');
    expect(useModeStore.getState().tourId).toBe('J1');
    expect(useModeStore.getState().tourTotalSteps).toBe(5);

    useModeStore.getState().exitTour();
    setMode('observation');
    startTour('J2', 3);
    expect(useModeStore.getState().activeMode).toBe('observation'); // not switched
    expect(useModeStore.getState().tourId).toBeNull();

    setMode('education');
    startTour('J2', 3);
    expect(useModeStore.getState().activeMode).toBe('guided_tour');
    expect(useModeStore.getState().tourId).toBe('J2');
  });

  it('nextTourStep advances up to (totalSteps - 1) then stops', () => {
    const store = useModeStore.getState();
    store.startTour('J1', 3);
    store.nextTourStep();
    store.nextTourStep();
    store.nextTourStep(); // should be capped
    expect(useModeStore.getState().tourStep).toBe(2);
  });

  it('prevTourStep never goes below zero', () => {
    const store = useModeStore.getState();
    store.startTour('J1', 3);
    store.nextTourStep();
    store.prevTourStep();
    store.prevTourStep();
    expect(useModeStore.getState().tourStep).toBe(0);
  });

  it('exitTour drops tour state and returns to exploration', () => {
    const store = useModeStore.getState();
    store.startTour('J1', 3);
    store.nextTourStep();
    store.exitTour();
    const state = useModeStore.getState();
    expect(state.activeMode).toBe('exploration');
    expect(state.tourId).toBeNull();
    expect(state.tourStep).toBe(0);
    expect(state.tourTotalSteps).toBe(0);
  });

  it('switching away from guided_tour wipes tour state', () => {
    const store = useModeStore.getState();
    store.startTour('J1', 3);
    store.setMode('research');
    const state = useModeStore.getState();
    expect(state.activeMode).toBe('research');
    expect(state.tourId).toBeNull();
  });

  it('setEducationTopic / setResearchDatasetId update their fields', () => {
    const store = useModeStore.getState();
    store.setEducationTopic('stellar-evolution');
    store.setResearchDatasetId('gaia-dr3-sample-A');
    const state = useModeStore.getState();
    expect(state.educationTopic).toBe('stellar-evolution');
    expect(state.researchDatasetId).toBe('gaia-dr3-sample-A');
  });
});
