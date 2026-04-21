import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCameraStore } from '@/stores/cameraStore';
import { useModeStore } from '@/stores/modeStore';
import { useSelectionStore } from '@/stores/selectionStore';
import type { EntityData } from '@/stores/types';
import { useUIStore } from '@/stores/uiStore';

import { useAriaAnnouncements } from '../useAriaAnnouncements';

/**
 * T33 — the cross-store a11y bridge. Covers TS-A11Y-002: selecting an
 * entity announces its name + type via the ARIA live region.
 */

function Harness({
  announce,
}: {
  announce: (m: string, p?: 'polite' | 'assertive') => void;
}): null {
  useAriaAnnouncements({ announce });
  return null;
}

function mount(
  announce: (m: string, p?: 'polite' | 'assertive') => void,
): { unmount: () => void; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<Harness announce={announce} />);
  });
  return {
    root,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe('useAriaAnnouncements', () => {
  beforeEach(() => {
    useSelectionStore.getState().resetToDefault();
    useModeStore.getState().resetToDefault();
    useCameraStore.getState().resetToDefault();
    useUIStore.getState().resetToDefault();
  });

  afterEach(() => {
    useSelectionStore.getState().resetToDefault();
    useModeStore.getState().resetToDefault();
    useCameraStore.getState().resetToDefault();
    useUIStore.getState().resetToDefault();
  });

  it('TS-A11Y-002: announces selected entity with name + type + distance', () => {
    const announce = vi.fn();
    const h = mount(announce);
    try {
      const sirius: EntityData = {
        id: 1,
        ent_id: 'ENT-1001',
        object_type: 'star',
        name: 'Sirius',
        payload: {
          kindLabel: 'Main Sequence Star',
          semiMajorAxis_display: 8.6,
          semiMajorAxis_unit: 'ly',
        },
      };
      act(() => {
        useSelectionStore.getState().selectEntity(1, sirius);
      });
      const hit = announce.mock.calls.find((c) => String(c[0]).includes('Sirius'));
      expect(hit).toBeDefined();
      expect(hit![0]).toContain('Selected: Sirius');
      expect(hit![0]).toContain('Main Sequence Star');
      expect(hit![0]).toContain('8.60 ly');
    } finally {
      h.unmount();
    }
  });

  it('does not announce when selection is cleared', () => {
    const announce = vi.fn();
    const h = mount(announce);
    try {
      // Prime with a selection — that fires once.
      const earth: EntityData = {
        id: 399,
        ent_id: 'ENT-2001',
        object_type: 'planet',
        name: 'Earth',
        payload: { kindLabel: 'Terrestrial' },
      };
      act(() => {
        useSelectionStore.getState().selectEntity(399, earth);
      });
      announce.mockClear();
      act(() => {
        useSelectionStore.getState().clearSelection();
      });
      // Clearing should stay quiet (user dismissed panel).
      const hit = announce.mock.calls.find((c) =>
        String(c[0]).toLowerCase().includes('clear'),
      );
      expect(hit).toBeUndefined();
    } finally {
      h.unmount();
    }
  });

  it('announces mode changes', () => {
    const announce = vi.fn();
    const h = mount(announce);
    try {
      act(() => {
        useModeStore.getState().setMode('research');
      });
      const hit = announce.mock.calls.find((c) =>
        String(c[0]).includes('Research'),
      );
      expect(hit).toBeDefined();
      expect(hit![0]).toContain('Application mode');
    } finally {
      h.unmount();
    }
  });

  it('announces guided tour step transitions', () => {
    const announce = vi.fn();
    const h = mount(announce);
    try {
      act(() => {
        useModeStore.getState().startTour('J1', 5);
      });
      const start = announce.mock.calls.find((c) =>
        String(c[0]).startsWith('Tour step 1 of 5'),
      );
      expect(start).toBeDefined();
      act(() => {
        useModeStore.getState().nextTourStep();
      });
      const next = announce.mock.calls.find((c) =>
        String(c[0]).startsWith('Tour step 2 of 5'),
      );
      expect(next).toBeDefined();
      act(() => {
        useModeStore.getState().exitTour();
      });
      const exit = announce.mock.calls.find((c) => String(c[0]) === 'Tour ended.');
      expect(exit).toBeDefined();
    } finally {
      h.unmount();
    }
  });

  it('announces scale regime changes', () => {
    const announce = vi.fn();
    const h = mount(announce);
    try {
      act(() => {
        useCameraStore.getState().setScaleRegime('stellar');
      });
      const hit = announce.mock.calls.find((c) => String(c[0]).includes('Stellar'));
      expect(hit).toBeDefined();
      expect(hit![0]).toContain('Scale');
    } finally {
      h.unmount();
    }
  });

  it('announces scene loaded when globalLoading flips false', () => {
    const announce = vi.fn();
    const h = mount(announce);
    try {
      act(() => {
        useUIStore.getState().setGlobalLoading(true, 'Loading tiles...');
      });
      act(() => {
        useUIStore.getState().setGlobalLoading(false);
      });
      const loaded = announce.mock.calls.find((c) => String(c[0]) === 'Scene loaded.');
      expect(loaded).toBeDefined();
    } finally {
      h.unmount();
    }
  });
});
