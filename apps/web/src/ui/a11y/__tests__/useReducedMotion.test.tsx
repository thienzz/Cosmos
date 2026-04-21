import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSettingsStore } from '@/stores/settingsStore';

import { useReducedMotion } from '../useReducedMotion';

/**
 * T33 — TS-A11Y-003 coverage. Verifies the OS `prefers-reduced-motion`
 * query seeds the settings store and the `<html data-reduced-motion>`
 * mirror flips in lockstep.
 */

let listeners: Array<(e: MediaQueryListEvent) => void> = [];
let currentMatches = false;

function installMatchMediaMock(match: boolean): void {
  currentMatches = match;
  listeners = [];
  window.matchMedia = vi.fn((query: string) => {
    return {
      matches: currentMatches,
      media: query,
      onchange: null,
      addEventListener: (_event: string, cb: (e: MediaQueryListEvent) => void) => {
        listeners.push(cb);
      },
      removeEventListener: (_event: string, cb: (e: MediaQueryListEvent) => void) => {
        listeners = listeners.filter((x) => x !== cb);
      },
      dispatchEvent: () => true,
      addListener: () => undefined,
      removeListener: () => undefined,
    } as unknown as MediaQueryList;
  }) as unknown as typeof window.matchMedia;
}

function fireMediaChange(matches: boolean): void {
  currentMatches = matches;
  for (const listener of listeners) {
    listener({ matches } as MediaQueryListEvent);
  }
}

function Harness(): null {
  useReducedMotion();
  return null;
}

function mount(): { unmount: () => void; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<Harness />);
  });
  return {
    root,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe('useReducedMotion', () => {
  beforeEach(() => {
    useSettingsStore.getState().resetToDefaults();
    document.documentElement.removeAttribute('data-reduced-motion');
    installMatchMediaMock(false);
  });

  afterEach(() => {
    useSettingsStore.getState().resetToDefaults();
    document.documentElement.removeAttribute('data-reduced-motion');
    listeners = [];
  });

  it('seeds the settings store from the OS media query on mount', () => {
    installMatchMediaMock(true);
    const h = mount();
    try {
      expect(useSettingsStore.getState().reducedMotion).toBe(true);
    } finally {
      h.unmount();
    }
  });

  it('mirrors the setting onto <html data-reduced-motion>', () => {
    const h = mount();
    try {
      expect(document.documentElement.hasAttribute('data-reduced-motion')).toBe(false);
      act(() => {
        useSettingsStore.getState().setSetting('reducedMotion', true);
      });
      expect(document.documentElement.getAttribute('data-reduced-motion')).toBe('true');
      act(() => {
        useSettingsStore.getState().setSetting('reducedMotion', false);
      });
      expect(document.documentElement.hasAttribute('data-reduced-motion')).toBe(false);
    } finally {
      h.unmount();
    }
  });

  it('reacts to live OS media-query flips', () => {
    const h = mount();
    try {
      expect(useSettingsStore.getState().reducedMotion).toBe(false);
      act(() => {
        fireMediaChange(true);
      });
      expect(useSettingsStore.getState().reducedMotion).toBe(true);
      act(() => {
        fireMediaChange(false);
      });
      expect(useSettingsStore.getState().reducedMotion).toBe(false);
    } finally {
      h.unmount();
    }
  });

  it('leaves an already-true setting alone when OS does not request it', () => {
    // User manually toggled via the panel. OS says "no", but we don't stomp.
    useSettingsStore.getState().setSetting('reducedMotion', true);
    installMatchMediaMock(false);
    const h = mount();
    try {
      expect(useSettingsStore.getState().reducedMotion).toBe(true);
    } finally {
      h.unmount();
    }
  });
});
