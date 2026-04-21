import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useModeStore } from '@/stores/modeStore';

import { TourLauncher } from '../TourLauncher';

function render(): { container: HTMLDivElement; unmount: () => void; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<TourLauncher />);
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

describe('TourLauncher', () => {
  beforeEach(() => useModeStore.getState().resetToDefault());
  afterEach(() => useModeStore.getState().resetToDefault());

  it('in Exploration mode, lists J1 only (Doc 27 §10 gate)', () => {
    const h = render();
    try {
      expect(h.container.querySelector('[data-testid="tour-launcher"]')).not.toBeNull();
      expect(h.container.querySelector('[data-testid="tour-start-J1"]')).not.toBeNull();
      expect(h.container.querySelector('[data-testid="tour-start-J2"]')).toBeNull();
    } finally {
      h.unmount();
    }
  });

  it('in Education mode, lists J2', () => {
    useModeStore.getState().setMode('education');
    const h = render();
    try {
      expect(h.container.querySelector('[data-testid="tour-start-J2"]')).not.toBeNull();
      expect(h.container.querySelector('[data-testid="tour-start-J1"]')).toBeNull();
    } finally {
      h.unmount();
    }
  });

  it('in Research mode, renders nothing (tours not launchable from Research)', () => {
    useModeStore.getState().setMode('research');
    const h = render();
    try {
      expect(h.container.querySelector('[data-testid="tour-launcher"]')).toBeNull();
    } finally {
      h.unmount();
    }
  });

  it('clicking a tour triggers startTour on the store', () => {
    const h = render();
    try {
      const btn = h.container.querySelector<HTMLButtonElement>(
        '[data-testid="tour-start-J1"]',
      );
      expect(btn).not.toBeNull();
      act(() => {
        btn!.click();
      });
      const state = useModeStore.getState();
      expect(state.activeMode).toBe('guided_tour');
      expect(state.tourId).toBe('J1');
      expect(state.tourTotalSteps).toBe(5);
    } finally {
      h.unmount();
    }
  });
});
