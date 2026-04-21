import { create } from 'zustand';

import type { HUDElement, ModalName, PanelName, UINotification } from './types.js';

declare global {
  interface Window {
    __cosmosUIStore?: unknown;
  }
}

/**
 * Warm state: panel visibility, modals, notifications, HUD toggles.
 * Source: Doc 27 §5.8.
 */
export interface UIState {
  infoPanelOpen: boolean;
  searchPanelOpen: boolean;
  settingsPanelOpen: boolean;
  timelinePanelOpen: boolean;
  miniMapVisible: boolean;

  activeModal: ModalName | null;
  /** Resizable sidebar width in CSS pixels. */
  sidebarWidth: number;

  globalLoading: boolean;
  loadingMessage: string | null;

  notifications: UINotification[];

  showGrid: boolean;
  showConstellationLines: boolean;
  showLabels: boolean;
  showOrbitalPaths: boolean;
  showScaleBar: boolean;

  // Actions
  togglePanel: (panel: PanelName) => void;
  openPanel: (panel: PanelName) => void;
  closePanel: (panel: PanelName) => void;
  openModal: (modal: ModalName) => void;
  closeModal: () => void;
  setSidebarWidth: (width: number) => void;
  setGlobalLoading: (loading: boolean, message?: string | null) => void;
  addNotification: (n: Omit<UINotification, 'id' | 'createdAt'>) => string;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
  toggleHUD: (element: HUDElement) => void;
  resetToDefault: () => void;
}

export const UI_DEFAULT_STATE: Omit<
  UIState,
  | 'togglePanel'
  | 'openPanel'
  | 'closePanel'
  | 'openModal'
  | 'closeModal'
  | 'setSidebarWidth'
  | 'setGlobalLoading'
  | 'addNotification'
  | 'dismissNotification'
  | 'clearNotifications'
  | 'toggleHUD'
  | 'resetToDefault'
> = {
  infoPanelOpen: false,
  searchPanelOpen: false,
  settingsPanelOpen: false,
  timelinePanelOpen: false,
  miniMapVisible: true,

  activeModal: null,
  sidebarWidth: 320,

  globalLoading: false,
  loadingMessage: null,

  notifications: [],

  showGrid: false,
  showConstellationLines: true,
  showLabels: true,
  showOrbitalPaths: true,
  showScaleBar: true,
};

const PANEL_TO_KEY: Record<PanelName, keyof UIState> = {
  info: 'infoPanelOpen',
  search: 'searchPanelOpen',
  settings: 'settingsPanelOpen',
  timeline: 'timelinePanelOpen',
  miniMap: 'miniMapVisible',
};

const HUD_TO_KEY: Record<HUDElement, keyof UIState> = {
  grid: 'showGrid',
  constellationLines: 'showConstellationLines',
  labels: 'showLabels',
  orbitalPaths: 'showOrbitalPaths',
  scaleBar: 'showScaleBar',
};

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useUIStore = create<UIState>()((set, get) => ({
  ...UI_DEFAULT_STATE,

  togglePanel: (panel) => {
    const key = PANEL_TO_KEY[panel];
    set((state) => ({ [key]: !state[key] }) as Partial<UIState>);
  },

  openPanel: (panel) => {
    const key = PANEL_TO_KEY[panel];
    set({ [key]: true } as Partial<UIState>);
  },

  closePanel: (panel) => {
    const key = PANEL_TO_KEY[panel];
    set({ [key]: false } as Partial<UIState>);
  },

  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),

  setSidebarWidth: (width) => set({ sidebarWidth: Math.max(200, Math.min(720, width)) }),

  setGlobalLoading: (loading, message = null) =>
    set({ globalLoading: loading, loadingMessage: loading ? message : null }),

  addNotification: (n) => {
    const id = generateId();
    const notification: UINotification = {
      id,
      createdAt: Date.now(),
      ...n,
    };
    set({ notifications: [...get().notifications, notification] });
    return id;
  },

  dismissNotification: (id) =>
    set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),

  clearNotifications: () => set({ notifications: [] }),

  toggleHUD: (element) => {
    const key = HUD_TO_KEY[element];
    set((state) => ({ [key]: !state[key] }) as Partial<UIState>);
  },

  resetToDefault: () => set(UI_DEFAULT_STATE),
}));

if (import.meta.env?.DEV && typeof window !== 'undefined') {
  window.__cosmosUIStore = useUIStore;
}
