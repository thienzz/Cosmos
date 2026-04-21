import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { J2000_JD, useTimeStore } from '@/stores/timeStore';

import { TimeControls } from '../TimeControls';

/**
 * React's controlled <input> listens to the native `input` event. Dispatching
 * a `change` event alone won't flip the React state. Use the prototype's
 * native value setter so React's tracked-value check sees the new value and
 * then fire `input` (bubbling).
 */
function setRangeValue(input: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function render(): { container: HTMLDivElement; unmount: () => void; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<TimeControls />);
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

describe('TimeControls', () => {
  beforeEach(() => {
    useTimeStore.getState().resetToDefault();
  });

  afterEach(() => {
    useTimeStore.getState().resetToDefault();
  });

  it('renders the BC time control panel with default state', () => {
    const h = render();
    try {
      const panel = h.container.querySelector('[data-testid="time-controls"]');
      expect(panel).not.toBeNull();
      // Date shows J2000 on mount (default epoch).
      const date = h.container.querySelector('[data-testid="time-date"]');
      expect(date?.textContent).toBe('2000-01-01 12:00:00');
      // Play toggle shows "▶" when paused (default).
      const play = h.container.querySelector<HTMLButtonElement>(
        '[data-testid="time-play-toggle"]',
      );
      expect(play?.getAttribute('aria-label')).toBe('Play');
    } finally {
      h.unmount();
    }
  });

  it('clicking the play toggle flips isPlaying and label', () => {
    const h = render();
    try {
      const btn = h.container.querySelector<HTMLButtonElement>(
        '[data-testid="time-play-toggle"]',
      );
      expect(btn).not.toBeNull();
      act(() => btn!.click());
      expect(useTimeStore.getState().isPlaying).toBe(true);
      expect(btn?.getAttribute('aria-label')).toBe('Pause');
      act(() => btn!.click());
      expect(useTimeStore.getState().isPlaying).toBe(false);
    } finally {
      h.unmount();
    }
  });

  it('Space key toggles play/pause', () => {
    const h = render();
    try {
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
      });
      expect(useTimeStore.getState().isPlaying).toBe(true);
    } finally {
      h.unmount();
    }
  });

  it('speed slider at 0.5 sets playbackSpeed to ~10^4.5', () => {
    const h = render();
    try {
      const input = h.container.querySelector<HTMLInputElement>(
        '[data-testid="time-speed-slider"]',
      );
      expect(input).not.toBeNull();
      act(() => setRangeValue(input!, '500'));
      const speed = Math.abs(useTimeStore.getState().playbackSpeed);
      // log10(speed) ≈ 4.5 → speed ≈ 31,623
      expect(Math.log10(speed)).toBeCloseTo(4.5, 1);
    } finally {
      h.unmount();
    }
  });

  it('speed slider preserves the current sign (reverse stays reverse)', () => {
    useTimeStore.getState().setSpeed(-1);
    const h = render();
    try {
      const input = h.container.querySelector<HTMLInputElement>(
        '[data-testid="time-speed-slider"]',
      );
      act(() => setRangeValue(input!, '300'));
      expect(useTimeStore.getState().playbackSpeed).toBeLessThan(0);
    } finally {
      h.unmount();
    }
  });

  it('Reverse button flips the sign of playbackSpeed', () => {
    useTimeStore.getState().setSpeed(86_400);
    const h = render();
    try {
      const reverse = h.container.querySelector<HTMLButtonElement>(
        'button[aria-label="Reverse direction"]',
      );
      act(() => reverse!.click());
      expect(useTimeStore.getState().playbackSpeed).toBe(-86_400);
    } finally {
      h.unmount();
    }
  });

  it('Reset button jumps the epoch to "now" (within ~1 day of system time)', () => {
    useTimeStore.getState().setEpoch(J2000_JD);
    const h = render();
    try {
      const reset = h.container.querySelector<HTMLButtonElement>(
        'button[aria-label="Reset time to now"]',
      );
      act(() => reset!.click());
      const epochNow = useTimeStore.getState().epochJD;
      // Now-JD should be ≥ J2000 (+26 years).
      expect(epochNow).toBeGreaterThan(J2000_JD + 9000);
    } finally {
      h.unmount();
    }
  });

  it('preset toggle reveals step forward / back buttons', () => {
    const h = render();
    try {
      expect(
        h.container.querySelector('button[aria-label="Step forward 1day"]'),
      ).toBeNull();
      const toggle = h.container.querySelector<HTMLButtonElement>(
        'button[aria-label="Toggle time step presets"]',
      );
      act(() => toggle!.click());
      expect(
        h.container.querySelector('button[aria-label="Step forward 1day"]'),
      ).not.toBeNull();
      expect(
        h.container.querySelector('button[aria-label="Step back 1yr"]'),
      ).not.toBeNull();
    } finally {
      h.unmount();
    }
  });

  it('preset step forward/back advances/reverses epoch', () => {
    const h = render();
    try {
      const toggle = h.container.querySelector<HTMLButtonElement>(
        'button[aria-label="Toggle time step presets"]',
      );
      act(() => toggle!.click());

      const before = useTimeStore.getState().epochJD;
      const fwd = h.container.querySelector<HTMLButtonElement>(
        'button[aria-label="Step forward 1day"]',
      );
      act(() => fwd!.click());
      expect(useTimeStore.getState().epochJD).toBeCloseTo(before + 1, 5);

      const back = h.container.querySelector<HTMLButtonElement>(
        'button[aria-label="Step back 1day"]',
      );
      act(() => back!.click());
      expect(useTimeStore.getState().epochJD).toBeCloseTo(before, 5);
    } finally {
      h.unmount();
    }
  });

  it('speed label reflects current playbackSpeed', () => {
    useTimeStore.getState().setSpeed(86_400);
    const h = render();
    try {
      const label = h.container.querySelector('[data-testid="time-speed-label"]');
      expect(label?.textContent).toContain('d/s');
    } finally {
      h.unmount();
    }
  });
});
