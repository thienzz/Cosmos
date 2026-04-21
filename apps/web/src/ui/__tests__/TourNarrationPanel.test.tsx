import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useModeStore } from '@/stores/modeStore';

import { TourNarrationPanel } from '../TourNarrationPanel';

function render(): { container: HTMLDivElement; unmount: () => void; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<TourNarrationPanel />);
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

describe('TourNarrationPanel', () => {
  beforeEach(() => useModeStore.getState().resetToDefault());
  afterEach(() => useModeStore.getState().resetToDefault());

  it('renders nothing when no tour is active', () => {
    const h = render();
    try {
      expect(h.container.querySelector('[data-testid="tour-narration"]')).toBeNull();
    } finally {
      h.unmount();
    }
  });

  it('renders the step header + narration once a tour starts (TS-MODE-003)', () => {
    const h = render();
    try {
      act(() => {
        useModeStore.getState().startTour('J2', 5);
      });
      const panel = h.container.querySelector('[data-testid="tour-narration"]');
      expect(panel).not.toBeNull();
      const header = h.container.querySelector('[data-testid="tour-step-header"]');
      // J2 step 0 is the Sun.
      expect(header?.textContent).toContain('STEP 1 of 5');
      expect(header?.textContent).toContain('The Sun');
      expect(panel?.textContent).toContain('centre of mass');
    } finally {
      h.unmount();
    }
  });

  it('Next/Back buttons advance + roll back the step in modeStore', () => {
    const h = render();
    try {
      act(() => {
        useModeStore.getState().startTour('J2', 5);
      });
      const next = h.container.querySelector<HTMLButtonElement>('[data-testid="tour-next"]');
      const prev = h.container.querySelector<HTMLButtonElement>('[data-testid="tour-prev"]');

      // Prev is disabled on step 0.
      expect(prev?.disabled).toBe(true);

      act(() => {
        next!.click();
      });
      expect(useModeStore.getState().tourStep).toBe(1);

      act(() => {
        next!.click();
      });
      expect(useModeStore.getState().tourStep).toBe(2);

      const prev2 = h.container.querySelector<HTMLButtonElement>('[data-testid="tour-prev"]');
      act(() => {
        prev2!.click();
      });
      expect(useModeStore.getState().tourStep).toBe(1);
    } finally {
      h.unmount();
    }
  });

  it('Next is disabled on the last step', () => {
    const h = render();
    try {
      act(() => {
        useModeStore.getState().startTour('J2', 5);
      });
      for (let i = 0; i < 4; i++) {
        const next = h.container.querySelector<HTMLButtonElement>('[data-testid="tour-next"]');
        act(() => {
          next!.click();
        });
      }
      const next = h.container.querySelector<HTMLButtonElement>('[data-testid="tour-next"]');
      expect(next?.disabled).toBe(true);
      // Header reads "STEP 5 of 5".
      const header = h.container.querySelector('[data-testid="tour-step-header"]');
      expect(header?.textContent).toContain('STEP 5 of 5');
    } finally {
      h.unmount();
    }
  });

  it('End Tour button exits back to Exploration (TS-MODE-004)', () => {
    const h = render();
    try {
      act(() => {
        useModeStore.getState().startTour('J2', 5);
        useModeStore.getState().nextTourStep();
      });
      const exit = h.container.querySelector<HTMLButtonElement>('[data-testid="tour-exit"]');
      act(() => {
        exit!.click();
      });
      const state = useModeStore.getState();
      expect(state.activeMode).toBe('exploration');
      expect(state.tourId).toBeNull();
      expect(state.tourStep).toBe(0);
    } finally {
      h.unmount();
    }
  });

  it('progress bar reflects completion percent', () => {
    const h = render();
    try {
      act(() => {
        useModeStore.getState().startTour('J2', 5);
      });
      // Step 0 of 5 = 20%.
      const bar = h.container.querySelector('[data-testid="tour-progress"]');
      expect(bar?.getAttribute('aria-valuenow')).toBe('20');
      act(() => {
        useModeStore.getState().nextTourStep();
      });
      // Step 1 of 5 = 40%.
      const bar2 = h.container.querySelector('[data-testid="tour-progress"]');
      expect(bar2?.getAttribute('aria-valuenow')).toBe('40');
    } finally {
      h.unmount();
    }
  });

  it('ArrowRight / ArrowLeft keyboard shortcuts step through waypoints', () => {
    const h = render();
    try {
      act(() => {
        useModeStore.getState().startTour('J2', 5);
      });
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      });
      expect(useModeStore.getState().tourStep).toBe(1);
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
      });
      expect(useModeStore.getState().tourStep).toBe(0);
    } finally {
      h.unmount();
    }
  });

  it('Escape exits the tour', () => {
    const h = render();
    try {
      act(() => {
        useModeStore.getState().startTour('J2', 5);
      });
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      });
      expect(useModeStore.getState().activeMode).toBe('exploration');
    } finally {
      h.unmount();
    }
  });

  it('keyboard shortcuts are no-op when an input is focused', () => {
    const h = render();
    try {
      act(() => {
        useModeStore.getState().startTour('J2', 5);
      });
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();
      try {
        const ev = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true });
        // Ensure the event's `target` matches the focused input (jsdom
        // treats `dispatchEvent` on `window` as having `target === window`
        // by default), so dispatch from the input instead.
        input.dispatchEvent(ev);
        expect(useModeStore.getState().tourStep).toBe(0);
      } finally {
        input.remove();
      }
    } finally {
      h.unmount();
    }
  });
});
