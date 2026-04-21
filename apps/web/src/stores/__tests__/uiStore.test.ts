import { beforeEach, describe, expect, it } from 'vitest';

import { UI_DEFAULT_STATE, useUIStore } from '../uiStore.js';

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.getState().resetToDefault();
  });

  it('starts with defaults: panels closed, minimap + HUD toggles on', () => {
    const state = useUIStore.getState();
    expect(state.infoPanelOpen).toBe(false);
    expect(state.searchPanelOpen).toBe(false);
    expect(state.settingsPanelOpen).toBe(false);
    expect(state.timelinePanelOpen).toBe(false);
    expect(state.miniMapVisible).toBe(true);
    expect(state.activeModal).toBeNull();
    expect(state.sidebarWidth).toBe(UI_DEFAULT_STATE.sidebarWidth);
    expect(state.notifications).toEqual([]);
    expect(state.showConstellationLines).toBe(true);
    expect(state.showLabels).toBe(true);
  });

  it('togglePanel / openPanel / closePanel drive individual panels', () => {
    const { togglePanel, openPanel, closePanel } = useUIStore.getState();
    togglePanel('info');
    expect(useUIStore.getState().infoPanelOpen).toBe(true);
    togglePanel('info');
    expect(useUIStore.getState().infoPanelOpen).toBe(false);

    openPanel('search');
    openPanel('settings');
    expect(useUIStore.getState().searchPanelOpen).toBe(true);
    expect(useUIStore.getState().settingsPanelOpen).toBe(true);

    closePanel('search');
    expect(useUIStore.getState().searchPanelOpen).toBe(false);
  });

  it('openModal / closeModal manage the single active modal', () => {
    const { openModal, closeModal } = useUIStore.getState();
    openModal('fitsImport');
    expect(useUIStore.getState().activeModal).toBe('fitsImport');
    openModal('export');
    expect(useUIStore.getState().activeModal).toBe('export');
    closeModal();
    expect(useUIStore.getState().activeModal).toBeNull();
  });

  it('setSidebarWidth clamps to [200, 720]', () => {
    const { setSidebarWidth } = useUIStore.getState();
    setSidebarWidth(100);
    expect(useUIStore.getState().sidebarWidth).toBe(200);
    setSidebarWidth(10_000);
    expect(useUIStore.getState().sidebarWidth).toBe(720);
    setSidebarWidth(400);
    expect(useUIStore.getState().sidebarWidth).toBe(400);
  });

  it('setGlobalLoading toggles the flag and drops message when clearing', () => {
    const { setGlobalLoading } = useUIStore.getState();
    setGlobalLoading(true, 'Loading tiles…');
    expect(useUIStore.getState().globalLoading).toBe(true);
    expect(useUIStore.getState().loadingMessage).toBe('Loading tiles…');
    setGlobalLoading(false);
    expect(useUIStore.getState().globalLoading).toBe(false);
    expect(useUIStore.getState().loadingMessage).toBeNull();
  });

  it('addNotification returns an id; dismissNotification removes exactly one', () => {
    const { addNotification, dismissNotification } = useUIStore.getState();
    const id1 = addNotification({ severity: 'info', message: 'hi', ttlMs: 3000 });
    const id2 = addNotification({ severity: 'error', message: 'oops', ttlMs: null });
    expect(useUIStore.getState().notifications).toHaveLength(2);
    dismissNotification(id1);
    const remaining = useUIStore.getState().notifications;
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.id).toBe(id2);
  });

  it('clearNotifications wipes the queue', () => {
    const { addNotification, clearNotifications } = useUIStore.getState();
    addNotification({ severity: 'info', message: 'a', ttlMs: null });
    addNotification({ severity: 'info', message: 'b', ttlMs: null });
    clearNotifications();
    expect(useUIStore.getState().notifications).toEqual([]);
  });

  it('toggleHUD flips each of the HUD element keys', () => {
    const { toggleHUD } = useUIStore.getState();
    toggleHUD('grid');
    expect(useUIStore.getState().showGrid).toBe(true);
    toggleHUD('labels');
    expect(useUIStore.getState().showLabels).toBe(false);
    toggleHUD('orbitalPaths');
    expect(useUIStore.getState().showOrbitalPaths).toBe(false);
    toggleHUD('constellationLines');
    expect(useUIStore.getState().showConstellationLines).toBe(false);
    toggleHUD('scaleBar');
    expect(useUIStore.getState().showScaleBar).toBe(false);
  });

  it('resetToDefault restores every HUD and panel flag', () => {
    const store = useUIStore.getState();
    store.openPanel('info');
    store.openModal('share');
    store.toggleHUD('grid');
    store.setSidebarWidth(500);
    store.resetToDefault();
    const state = useUIStore.getState();
    expect(state.infoPanelOpen).toBe(false);
    expect(state.activeModal).toBeNull();
    expect(state.showGrid).toBe(false);
    expect(state.sidebarWidth).toBe(UI_DEFAULT_STATE.sidebarWidth);
  });
});
