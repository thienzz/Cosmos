import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSettingsStore } from '@/stores/settingsStore';

import { useHighContrast } from '../useHighContrast';

/**
 * T33 — TS-A11Y-005 coverage. Verifies the OS `prefers-contrast: more`
 * query seeds the settings store and the `<html data-high-contrast>`
 * attribute mirror flips.
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
  useHighContrast();
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

describe('useHighContrast', () => {
  beforeEach(() => {
    useSettingsStore.getState().resetToDefaults();
    document.documentElement.removeAttribute('data-high-contrast');
    installMatchMediaMock(false);
  });

  afterEach(() => {
    useSettingsStore.getState().resetToDefaults();
    document.documentElement.removeAttribute('data-high-contrast');
    listeners = [];
  });

  it('TS-A11Y-005: sets data-high-contrast when setting flips on', () => {
    const h = mount();
    try {
      expect(document.documentElement.hasAttribute('data-high-contrast')).toBe(false);
      act(() => {
        useSettingsStore.getState().setSetting('highContrast', true);
      });
      expect(document.documentElement.getAttribute('data-high-contrast')).toBe('true');
      act(() => {
        useSettingsStore.getState().setSetting('highContrast', false);
      });
      expect(document.documentElement.hasAttribute('data-high-contrast')).toBe(false);
    } finally {
      h.unmount();
    }
  });

  it('seeds from OS prefers-contrast: more on mount', () => {
    installMatchMediaMock(true);
    const h = mount();
    try {
      expect(useSettingsStore.getState().highContrast).toBe(true);
    } finally {
      h.unmount();
    }
  });

  it('responds to live OS flips', () => {
    const h = mount();
    try {
      expect(useSettingsStore.getState().highContrast).toBe(false);
      act(() => {
        fireMediaChange(true);
      });
      expect(useSettingsStore.getState().highContrast).toBe(true);
    } finally {
      h.unmount();
    }
  });
});
