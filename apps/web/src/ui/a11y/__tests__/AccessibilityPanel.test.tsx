import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useSettingsStore } from '@/stores/settingsStore';

import { disposeAnnouncer } from '../a11yAnnouncer';
import { AccessibilityPanel } from '../AccessibilityPanel';

function mount(
  defaultOpen = true,
): { container: HTMLDivElement; unmount: () => void; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<AccessibilityPanel defaultOpen={defaultOpen} />);
  });
  return {
    container,
    root,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe('AccessibilityPanel', () => {
  beforeEach(() => {
    useSettingsStore.getState().resetToDefaults();
    disposeAnnouncer();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    useSettingsStore.getState().resetToDefaults();
    disposeAnnouncer();
    document.body.innerHTML = '';
  });

  it('starts collapsed by default, expands on click', () => {
    const h = mount(false);
    try {
      // Body not present when collapsed.
      expect(h.container.querySelector('#cosmos-a11y-body')).toBeNull();
      const toggle = h.container.querySelector<HTMLButtonElement>(
        '[data-testid="a11y-toggle"]',
      )!;
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      act(() => toggle.click());
      expect(h.container.querySelector('#cosmos-a11y-body')).not.toBeNull();
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
    } finally {
      h.unmount();
    }
  });

  it('exposes three toggle checkboxes wired to settingsStore', () => {
    const h = mount();
    try {
      const rm = h.container.querySelector<HTMLInputElement>(
        '[data-testid="a11y-reduced-motion"]',
      );
      const hc = h.container.querySelector<HTMLInputElement>(
        '[data-testid="a11y-high-contrast"]',
      );
      const sr = h.container.querySelector<HTMLInputElement>(
        '[data-testid="a11y-screen-reader-mode"]',
      );
      expect(rm).not.toBeNull();
      expect(hc).not.toBeNull();
      expect(sr).not.toBeNull();
      expect(rm!.checked).toBe(false);
      expect(hc!.checked).toBe(false);
      expect(sr!.checked).toBe(false);

      act(() => rm!.click());
      expect(useSettingsStore.getState().reducedMotion).toBe(true);
      act(() => hc!.click());
      expect(useSettingsStore.getState().highContrast).toBe(true);
      act(() => sr!.click());
      expect(useSettingsStore.getState().screenReaderMode).toBe(true);
    } finally {
      h.unmount();
    }
  });

  it('reflects store changes from outside the component', () => {
    const h = mount();
    try {
      act(() => {
        useSettingsStore.getState().setSetting('highContrast', true);
      });
      const hc = h.container.querySelector<HTMLInputElement>(
        '[data-testid="a11y-high-contrast"]',
      );
      expect(hc!.checked).toBe(true);
    } finally {
      h.unmount();
    }
  });

  it('announces via the SR region when a toggle flips', () => {
    const h = mount();
    try {
      const rm = h.container.querySelector<HTMLInputElement>(
        '[data-testid="a11y-reduced-motion"]',
      )!;
      act(() => rm.click());
      // The singleton announcer was lazy-created; confirm the region exists.
      const polite = document.querySelector<HTMLElement>(
        '[data-testid="a11y-live-polite"]',
      );
      expect(polite).not.toBeNull();
    } finally {
      h.unmount();
    }
  });

  it('toggles via Alt+A keyboard shortcut', () => {
    const h = mount(false);
    try {
      expect(h.container.querySelector('#cosmos-a11y-body')).toBeNull();
      act(() => {
        window.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'a', altKey: true }),
        );
      });
      expect(h.container.querySelector('#cosmos-a11y-body')).not.toBeNull();
      act(() => {
        window.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'A', altKey: true }),
        );
      });
      expect(h.container.querySelector('#cosmos-a11y-body')).toBeNull();
    } finally {
      h.unmount();
    }
  });

  it('collapses on Escape when panel is open', () => {
    const h = mount(true);
    try {
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      });
      expect(h.container.querySelector('#cosmos-a11y-body')).toBeNull();
    } finally {
      h.unmount();
    }
  });
});
