import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SkipLinks, DEFAULT_SKIP_TARGETS } from '../SkipLinks';

/**
 * T33 — TS-A11Y-001 coverage for the "Tab lands on skip link first" flow.
 */

function mount(): { container: HTMLDivElement; unmount: () => void; root: Root } {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <>
        <SkipLinks />
        {/* Landmark targets with tabIndex=-1 so programmatic focus lands. */}
        <div id="cosmos-viewport" tabIndex={-1}>
          viewport
        </div>
        <div id="cosmos-search" tabIndex={-1}>
          search
        </div>
        <div id="cosmos-controls" tabIndex={-1}>
          controls
        </div>
      </>,
    );
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

describe('SkipLinks', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders one anchor per default target with correct href', () => {
    const h = mount();
    try {
      for (const target of DEFAULT_SKIP_TARGETS) {
        const link = h.container.querySelector<HTMLAnchorElement>(
          `[data-testid="skip-link-${target.id}"]`,
        );
        expect(link).not.toBeNull();
        expect(link!.getAttribute('href')).toBe(`#${target.id}`);
        expect(link!.textContent).toBe(target.label);
      }
    } finally {
      h.unmount();
    }
  });

  it('focuses the landmark when the link is clicked', () => {
    const h = mount();
    try {
      const link = h.container.querySelector<HTMLAnchorElement>(
        '[data-testid="skip-link-cosmos-viewport"]',
      );
      expect(link).not.toBeNull();
      act(() => {
        link!.click();
      });
      const viewport = document.getElementById('cosmos-viewport');
      expect(document.activeElement).toBe(viewport);
    } finally {
      h.unmount();
    }
  });

  it('uses the shared cosmos-skip-link class so global styles kick in', () => {
    const h = mount();
    try {
      const links = h.container.querySelectorAll('.cosmos-skip-link');
      expect(links.length).toBe(DEFAULT_SKIP_TARGETS.length);
    } finally {
      h.unmount();
    }
  });
});
