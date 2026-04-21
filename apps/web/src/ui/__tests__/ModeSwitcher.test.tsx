import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useCameraStore } from '@/stores/cameraStore';
import { useModeStore } from '@/stores/modeStore';

import { ModeSwitcher } from '../ModeSwitcher';

function render(): { container: HTMLDivElement; unmount: () => void; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<ModeSwitcher />);
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

describe('ModeSwitcher', () => {
  beforeEach(() => {
    useModeStore.getState().resetToDefault();
    useCameraStore.getState().resetToDefault();
  });

  afterEach(() => {
    useModeStore.getState().resetToDefault();
    useCameraStore.getState().resetToDefault();
  });

  it('TS-MODE-001: defaults to Exploration and marks its button active', () => {
    const h = render();
    try {
      expect(useModeStore.getState().activeMode).toBe('exploration');
      const btn = h.container.querySelector<HTMLButtonElement>(
        '[data-testid="mode-btn-exploration"]',
      );
      expect(btn?.getAttribute('aria-pressed')).toBe('true');
      const research = h.container.querySelector<HTMLButtonElement>(
        '[data-testid="mode-btn-research"]',
      );
      expect(research?.getAttribute('aria-pressed')).toBe('false');
    } finally {
      h.unmount();
    }
  });

  it('TS-MODE-002: clicking Research switches mode', () => {
    const h = render();
    try {
      const btn = h.container.querySelector<HTMLButtonElement>(
        '[data-testid="mode-btn-research"]',
      );
      expect(btn).not.toBeNull();
      act(() => {
        btn!.click();
      });
      expect(useModeStore.getState().activeMode).toBe('research');
      const refreshed = h.container.querySelector<HTMLButtonElement>(
        '[data-testid="mode-btn-research"]',
      );
      expect(refreshed?.getAttribute('aria-pressed')).toBe('true');
    } finally {
      h.unmount();
    }
  });

  it('TS-MODE-005: mode switch preserves the camera store', () => {
    const before = { x: 12, y: -7, z: 3.5 };
    useCameraStore.getState().setPosition(before);
    const h = render();
    try {
      const btn = h.container.querySelector<HTMLButtonElement>(
        '[data-testid="mode-btn-observation"]',
      );
      act(() => {
        btn!.click();
      });
      expect(useModeStore.getState().activeMode).toBe('observation');
      // Camera hot state is untouched — ModeSwitcher writes only modeStore.
      expect(useCameraStore.getState().position).toEqual(before);
    } finally {
      h.unmount();
    }
  });

  it('shows an "ON TOUR" badge while a guided tour is running, hiding the button row', () => {
    const h = render();
    try {
      act(() => {
        useModeStore.getState().startTour('J1', 5);
      });
      expect(h.container.querySelector('[data-testid="mode-tour-badge"]')).not.toBeNull();
      // Buttons are hidden while on tour (prevents accidental wipe of tour state).
      expect(h.container.querySelector('[data-testid="mode-btn-exploration"]')).toBeNull();
    } finally {
      h.unmount();
    }
  });

  it('re-renders when modeStore changes externally', () => {
    const h = render();
    try {
      act(() => {
        useModeStore.getState().setMode('education');
      });
      const btn = h.container.querySelector<HTMLButtonElement>(
        '[data-testid="mode-btn-education"]',
      );
      expect(btn?.getAttribute('aria-pressed')).toBe('true');
    } finally {
      h.unmount();
    }
  });
});
