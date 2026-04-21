import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { toEntityData } from '@/data/bodyToEntity';
import { MAJOR_MOONS, PLANETS, SUN } from '@/data/solarSystemCatalog';
import { registerEngineBridge, resetEngineBridge } from '@/engine/engineBridge';
import { useCameraStore } from '@/stores/cameraStore';
import { useSelectionStore } from '@/stores/selectionStore';
import { useUIStore } from '@/stores/uiStore';

import { InfoPanel } from '../InfoPanel';

/**
 * Minimal DOM harness. React 18 exposes `act` from the `react` package; we
 * drive the stores and flush React state with it. Avoids pulling in
 * @testing-library which isn't in the dep tree yet.
 */

function render(): { container: HTMLDivElement; root: Root; unmount: () => void } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<InfoPanel />);
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

describe('InfoPanel', () => {
  beforeEach(() => {
    useSelectionStore.getState().resetToDefault();
    useUIStore.getState().resetToDefault();
    useCameraStore.getState().resetToDefault();
    resetEngineBridge();
  });

  afterEach(() => {
    useSelectionStore.getState().resetToDefault();
    useUIStore.getState().resetToDefault();
    useCameraStore.getState().resetToDefault();
    resetEngineBridge();
  });

  it('renders nothing when no selection is open', () => {
    const harness = render();
    try {
      expect(harness.container.querySelector('[data-testid="info-panel"]')).toBeNull();
    } finally {
      harness.unmount();
    }
  });

  it('renders nothing when selection set but panel closed', () => {
    act(() => {
      useSelectionStore.getState().selectEntity(SUN.naifId, toEntityData(SUN));
    });
    const harness = render();
    try {
      expect(harness.container.querySelector('[data-testid="info-panel"]')).toBeNull();
    } finally {
      harness.unmount();
    }
  });

  it('renders the selected entity when panel is open', () => {
    const earth = PLANETS.find((p) => p.name === 'Earth')!;
    act(() => {
      useSelectionStore.getState().selectEntity(earth.naifId, toEntityData(earth));
      useUIStore.getState().openPanel('info');
    });
    const harness = render();
    try {
      const panel = harness.container.querySelector('[data-testid="info-panel"]');
      expect(panel).not.toBeNull();
      expect(panel!.textContent).toContain('Earth');
      // ENT ID present
      expect(panel!.textContent).toMatch(/ENT-2\d{3}/);
      // Parent row present
      expect(panel!.textContent).toContain('Sun');
      // Data labels present
      expect(panel!.textContent?.toUpperCase()).toContain('RADIUS');
      expect(panel!.textContent?.toUpperCase()).toContain('PERIOD');
    } finally {
      harness.unmount();
    }
  });

  it('close button clears selection and closes panel', () => {
    const mars = PLANETS.find((p) => p.name === 'Mars')!;
    act(() => {
      useSelectionStore.getState().selectEntity(mars.naifId, toEntityData(mars));
      useUIStore.getState().openPanel('info');
    });
    const harness = render();
    try {
      const close = harness.container.querySelector<HTMLButtonElement>(
        'button[aria-label="Close info panel"]',
      );
      expect(close).not.toBeNull();
      act(() => {
        close!.click();
      });
      expect(useUIStore.getState().infoPanelOpen).toBe(false);
      expect(useSelectionStore.getState().selectedEntity).toBeNull();
      expect(harness.container.querySelector('[data-testid="info-panel"]')).toBeNull();
    } finally {
      harness.unmount();
    }
  });

  it('Escape key dismisses the panel', () => {
    const jupiter = PLANETS.find((p) => p.name === 'Jupiter')!;
    act(() => {
      useSelectionStore.getState().selectEntity(jupiter.naifId, toEntityData(jupiter));
      useUIStore.getState().openPanel('info');
    });
    const harness = render();
    try {
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      });
      expect(useUIStore.getState().infoPanelOpen).toBe(false);
      expect(useSelectionStore.getState().selectedEntity).toBeNull();
    } finally {
      harness.unmount();
    }
  });

  it('Navigate button calls the engine bridge fly-to handler', () => {
    const flyToEntity = vi.fn(() => true);
    registerEngineBridge({ flyToEntity });
    const mars = PLANETS.find((p) => p.name === 'Mars')!;
    act(() => {
      useSelectionStore.getState().selectEntity(mars.naifId, toEntityData(mars));
      useUIStore.getState().openPanel('info');
    });
    const harness = render();
    try {
      const navBtn = harness.container.querySelector<HTMLButtonElement>(
        `button[aria-label="Fly to Mars"]`,
      );
      expect(navBtn).not.toBeNull();
      expect(navBtn?.disabled).toBe(false);
      act(() => navBtn!.click());
      expect(flyToEntity).toHaveBeenCalledWith(mars.naifId, {});
    } finally {
      harness.unmount();
    }
  });

  it('Navigate button is disabled + shows "Flying…" while isTransitioning', () => {
    const earth = PLANETS.find((p) => p.name === 'Earth')!;
    act(() => {
      useSelectionStore.getState().selectEntity(earth.naifId, toEntityData(earth));
      useUIStore.getState().openPanel('info');
      useCameraStore.setState({ isTransitioning: true });
    });
    const harness = render();
    try {
      const navBtn = harness.container.querySelector<HTMLButtonElement>(
        `button[aria-label="Fly to Earth"]`,
      );
      expect(navBtn?.disabled).toBe(true);
      expect(navBtn?.textContent).toMatch(/Flying/);
    } finally {
      harness.unmount();
    }
  });

  it('Escape during fly-to cancels instead of closing the panel', () => {
    const cancelFlyTo = vi.fn();
    registerEngineBridge({ cancelFlyTo });
    const venus = PLANETS.find((p) => p.name === 'Venus')!;
    act(() => {
      useSelectionStore.getState().selectEntity(venus.naifId, toEntityData(venus));
      useUIStore.getState().openPanel('info');
      useCameraStore.setState({ isTransitioning: true });
    });
    const harness = render();
    try {
      act(() => {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      });
      expect(cancelFlyTo).toHaveBeenCalledTimes(1);
      expect(useUIStore.getState().infoPanelOpen).toBe(true);
      expect(useSelectionStore.getState().selectedEntity).not.toBeNull();
    } finally {
      harness.unmount();
    }
  });

  it('retrograde moons (Triton) show the ↩ glyph next to period', () => {
    const triton = MAJOR_MOONS.find((m) => m.name === 'Triton')!;
    act(() => {
      useSelectionStore.getState().selectEntity(triton.naifId, toEntityData(triton));
      useUIStore.getState().openPanel('info');
    });
    const harness = render();
    try {
      expect(harness.container.textContent).toContain('↩');
    } finally {
      harness.unmount();
    }
  });

  it('Track button calls setTrackedEntity with the selected NAIF id when off', () => {
    const setTrackedEntity = vi.fn(() => true);
    registerEngineBridge({ setTrackedEntity });
    const earth = PLANETS.find((p) => p.name === 'Earth')!;
    act(() => {
      useSelectionStore.getState().selectEntity(earth.naifId, toEntityData(earth));
      useUIStore.getState().openPanel('info');
    });
    const harness = render();
    try {
      const track = harness.container.querySelector<HTMLButtonElement>(
        `button[aria-label="Track Earth"]`,
      );
      expect(track).not.toBeNull();
      expect(track!.getAttribute('aria-pressed')).toBe('false');
      expect(track!.textContent?.toLowerCase()).toContain('track');
      act(() => track!.click());
      expect(setTrackedEntity).toHaveBeenCalledWith(earth.naifId);
    } finally {
      harness.unmount();
    }
  });

  it('Track button shows active state when cameraStore.trackedEntityId === selection', () => {
    const earth = PLANETS.find((p) => p.name === 'Earth')!;
    act(() => {
      useSelectionStore.getState().selectEntity(earth.naifId, toEntityData(earth));
      useUIStore.getState().openPanel('info');
      useCameraStore.setState({ trackedEntityId: earth.naifId });
    });
    const harness = render();
    try {
      const track = harness.container.querySelector<HTMLButtonElement>(
        `button[aria-label="Stop tracking Earth"]`,
      );
      expect(track).not.toBeNull();
      expect(track!.getAttribute('aria-pressed')).toBe('true');
      // Active-state label contains the tracking glyph.
      expect(track!.textContent).toMatch(/Tracking/i);
    } finally {
      harness.unmount();
    }
  });

  it('Track button calls setTrackedEntity(null) when clicked while active', () => {
    const setTrackedEntity = vi.fn(() => true);
    registerEngineBridge({ setTrackedEntity });
    const mars = PLANETS.find((p) => p.name === 'Mars')!;
    act(() => {
      useSelectionStore.getState().selectEntity(mars.naifId, toEntityData(mars));
      useUIStore.getState().openPanel('info');
      useCameraStore.setState({ trackedEntityId: mars.naifId });
    });
    const harness = render();
    try {
      const track = harness.container.querySelector<HTMLButtonElement>(
        `button[aria-label="Stop tracking Mars"]`,
      );
      expect(track).not.toBeNull();
      act(() => track!.click());
      expect(setTrackedEntity).toHaveBeenCalledWith(null);
    } finally {
      harness.unmount();
    }
  });

  it('Track button reads inactive for a different body (tracked ≠ selected)', () => {
    const mars = PLANETS.find((p) => p.name === 'Mars')!;
    const earth = PLANETS.find((p) => p.name === 'Earth')!;
    act(() => {
      useSelectionStore.getState().selectEntity(mars.naifId, toEntityData(mars));
      useUIStore.getState().openPanel('info');
      useCameraStore.setState({ trackedEntityId: earth.naifId });
    });
    const harness = render();
    try {
      const track = harness.container.querySelector<HTMLButtonElement>(
        `button[aria-label="Track Mars"]`,
      );
      expect(track).not.toBeNull();
      expect(track!.getAttribute('aria-pressed')).toBe('false');
    } finally {
      harness.unmount();
    }
  });

  // --- T51: S-3.1 Full variant (catalog_ids + observational + tags + slot) ---

  it('S-3.1 renders Cross-IDs section when catalog_ids are present', () => {
    act(() => {
      useSelectionStore.getState().selectEntity(5072708048, {
        id: 5072708048,
        ent_id: 'ENT-1001',
        object_type: 'star',
        name: 'Sirius',
        payload: {
          kind: 'star',
          kindLabel: 'Main Sequence Star',
          accentColor: '#00e5ff',
          icon: '◎',
          catalog_ids: {
            hd: 48915,
            hipparcos: 32349,
            gaia_dr3: '2947050466531873024',
          },
        },
      });
      useUIStore.getState().openPanel('info');
    });
    const harness = render();
    try {
      const crossIds = harness.container.querySelector(
        '[data-testid="info-panel-crossids"]',
      );
      expect(crossIds).not.toBeNull();
      expect(crossIds!.textContent).toContain('48915');
      expect(crossIds!.textContent).toContain('32349');
      expect(crossIds!.textContent?.toUpperCase()).toContain('IDENTIFICATION');
      // Reserved toggle slot exists for T52.
      expect(
        harness.container.querySelector('[data-testid="info-panel-toggle-slot"]'),
      ).not.toBeNull();
    } finally {
      harness.unmount();
    }
  });

  it('S-3.1 renders Observational Info + Tags sections', () => {
    act(() => {
      useSelectionStore.getState().selectEntity(5072708048, {
        id: 5072708048,
        ent_id: 'ENT-1001',
        object_type: 'star',
        name: 'Sirius',
        payload: {
          kind: 'star',
          kindLabel: 'Star',
          accentColor: '#00e5ff',
          icon: '◎',
          ra_deg: 101.2865,
          dec_deg: -16.7161,
          distance_pc: 2.636,
          constellation: 'Canis Major',
          spectral_type: 'A1V',
          magnitude_apparent: -1.46,
          type_name: 'Main Sequence Star',
          category_name: 'Stars',
          aliases: ['Dog Star', 'α CMa'],
        },
      });
      useUIStore.getState().openPanel('info');
    });
    const harness = render();
    try {
      const obs = harness.container.querySelector(
        '[data-testid="info-panel-observational"]',
      );
      expect(obs).not.toBeNull();
      expect(obs!.textContent).toContain('Canis Major');
      expect(obs!.textContent).toContain('A1V');
      const tags = harness.container.querySelector('[data-testid="info-panel-tags"]');
      expect(tags).not.toBeNull();
      expect(tags!.textContent).toContain('Dog Star');
      expect(tags!.textContent).toContain('Main Sequence Star');
    } finally {
      harness.unmount();
    }
  });

  it('S-3.1 renders curated description when seeded', () => {
    act(() => {
      useSelectionStore.getState().selectEntity(5072708048, {
        id: 5072708048,
        ent_id: 'ENT-1001',
        object_type: 'star',
        name: 'Sirius',
        payload: {
          kind: 'star',
          kindLabel: 'Star',
          accentColor: '#00e5ff',
          icon: '◎',
        },
      });
      useUIStore.getState().openPanel('info');
    });
    const harness = render();
    try {
      expect(harness.container.textContent).toMatch(/Brightest star/i);
    } finally {
      harness.unmount();
    }
  });

  it('collapses to S-3.0 Compact at <768 px (width 320, no Full sections)', () => {
    // Force the compact breakpoint — useIsFullLayout reads innerWidth lazily
    // then subscribes to resize. Mutate BEFORE the first render so the
    // initial state is already compact.
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 400,
    });
    try {
      const earth = PLANETS.find((p) => p.name === 'Earth')!;
      act(() => {
        useSelectionStore.getState().selectEntity(earth.naifId, toEntityData(earth));
        useUIStore.getState().openPanel('info');
      });
      const harness = render();
      try {
        const panel = harness.container.querySelector<HTMLElement>(
          '[data-testid="info-panel"]',
        );
        expect(panel).not.toBeNull();
        expect(panel!.getAttribute('data-layout')).toBe('compact');
        expect(panel!.style.width).toBe('320px');
        expect(
          harness.container.querySelector('[data-testid="info-panel-toggle-slot"]'),
        ).toBeNull();
      } finally {
        harness.unmount();
      }
    } finally {
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        value: originalWidth,
      });
    }
  });
});
