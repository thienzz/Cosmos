import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useEntityToggleStore } from '@/stores/entityToggleStore';

import { EntityToggleSection } from '../EntityToggleSection';

function render(entId: string | null): {
  container: HTMLDivElement;
  root: Root;
  unmount: () => void;
} {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<EntityToggleSection entId={entId} />);
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

describe('EntityToggleSection', () => {
  beforeEach(() => {
    useEntityToggleStore.getState().resetToDefault();
  });
  afterEach(() => {
    useEntityToggleStore.getState().resetToDefault();
  });

  it('renders nothing for an unknown ENT-ID', () => {
    const h = render('ENT-9999');
    try {
      expect(h.container.querySelector('[data-testid="entity-toggles"]')).toBeNull();
    } finally {
      h.unmount();
    }
  });

  it('renders Jupiter (ENT-2020) with Great Red Spot default ON', () => {
    const h = render('ENT-2020');
    try {
      const section = h.container.querySelector('[data-testid="entity-toggles"]');
      expect(section).not.toBeNull();
      expect(section!.getAttribute('data-ent-id')).toBe('ENT-2020');

      // "Great Red Spot" appears as a toggle (uniform u_gRSActive per Doc 22).
      const labels = Array.from(h.container.querySelectorAll('label'));
      const grsLabel = labels.find((l) => l.textContent?.includes('Great Red Spot'));
      expect(grsLabel, 'GRS toggle should be present').toBeDefined();
      const checkbox = grsLabel!.querySelector<HTMLInputElement>('input[type="checkbox"]');
      expect(checkbox?.checked).toBe(true);

      // "Impact Scars (Shoemaker-Levy 9)" — default OFF in Doc 22.
      const scarsLabel = labels.find((l) => l.textContent?.includes('Impact Scars'));
      expect(scarsLabel, 'Impact scars toggle should be present').toBeDefined();
      expect(
        scarsLabel!.querySelector<HTMLInputElement>('input[type="checkbox"]')!.checked,
      ).toBe(false);
    } finally {
      h.unmount();
    }
  });

  it('toggling a checkbox writes into entityToggleStore', () => {
    const h = render('ENT-2020');
    try {
      const auroraCheckbox = Array.from(
        h.container.querySelectorAll<HTMLInputElement>('input[type="checkbox"]'),
      ).find((el) => el.getAttribute('aria-label') === 'Aurora-like Polar Lights');
      expect(auroraCheckbox).toBeDefined();
      const uniformName = auroraCheckbox!
        .closest('[data-testid^="entity-toggle:"]')
        ?.getAttribute('data-testid')
        ?.replace('entity-toggle:', '');
      expect(uniformName?.startsWith('u_')).toBe(true);

      // Before click: store has no override.
      expect(useEntityToggleStore.getState().toggles['ENT-2020']).toBeUndefined();

      act(() => {
        auroraCheckbox!.click();
      });

      const after = useEntityToggleStore.getState().toggles['ENT-2020'];
      expect(after).toBeDefined();
      // Click inverts the checkbox — Aurora was default ON so it's now 0.
      expect(after![uniformName!]).toBe(0);
    } finally {
      h.unmount();
    }
  });

  it('Io (ENT-3010) shows Volcanic Plumes as a toggle', () => {
    const h = render('ENT-3010');
    try {
      const section = h.container.querySelector('[data-testid="entity-toggles"]');
      expect(section).not.toBeNull();
      const labels = Array.from(h.container.querySelectorAll('label'));
      const plumes = labels.find((l) =>
        /plume/i.test(l.textContent ?? ''),
      );
      expect(plumes, 'Io should advertise volcanic plumes').toBeDefined();
    } finally {
      h.unmount();
    }
  });

  it('Reset button restores defaults', () => {
    useEntityToggleStore.getState().setToggleOn('ENT-2020', 'u_gRSActive', false);
    expect(useEntityToggleStore.getState().toggles['ENT-2020']?.u_gRSActive).toBe(0);

    const h = render('ENT-2020');
    try {
      const reset = h.container.querySelector<HTMLButtonElement>(
        'button[aria-label="Reset toggles to defaults"]',
      );
      expect(reset).not.toBeNull();
      act(() => reset!.click());
      // Default for u_gRSActive is ON → 1.0 after reset.
      expect(useEntityToggleStore.getState().toggles['ENT-2020']?.u_gRSActive).toBe(1);
    } finally {
      h.unmount();
    }
  });

  it('section header collapses the feature list', () => {
    const h = render('ENT-2020');
    try {
      // Pick the first group header (Zonal Bands).
      const firstGroup = h.container.querySelector<HTMLElement>(
        '[data-testid="entity-toggle-group:Zonal Bands"]',
      );
      expect(firstGroup).not.toBeNull();
      const beforeCount = firstGroup!.querySelectorAll('input[type="checkbox"]').length;
      expect(beforeCount).toBeGreaterThan(0);
      const header = firstGroup!.querySelector<HTMLButtonElement>('button');
      expect(header).not.toBeNull();
      act(() => header!.click());
      expect(firstGroup!.querySelectorAll('input[type="checkbox"]').length).toBe(0);
    } finally {
      h.unmount();
    }
  });
});
