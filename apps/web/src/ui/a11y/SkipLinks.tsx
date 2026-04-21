/**
 * T33 — skip navigation links (Doc 16 §Skip Navigation Links).
 *
 * Rendered as the very first focusable elements on the page so `Tab`
 * from a fresh load lands on them before the canvas swallows focus.
 * Each link is hidden above the viewport until focused, then slides
 * down — styling lives in `a11yStyles.ts` (`.cosmos-skip-link`).
 *
 * The target IDs (`#cosmos-viewport`, `#cosmos-search`, `#cosmos-controls`)
 * are landmark anchors attached to the corresponding regions by the App
 * shell. Each landmark is `tabindex=-1` so `.focus()` lands in the region
 * without it being part of the normal tab cycle.
 */

import type { CSSProperties } from 'react';

const A11Y_CONTAINER: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 2000,
  display: 'flex',
  gap: 8,
};

export interface SkipTarget {
  id: string;
  label: string;
}

export const DEFAULT_SKIP_TARGETS: readonly SkipTarget[] = [
  { id: 'cosmos-viewport', label: 'Skip to 3D viewport' },
  { id: 'cosmos-search', label: 'Skip to search' },
  { id: 'cosmos-controls', label: 'Skip to controls' },
] as const;

export function SkipLinks({
  targets = DEFAULT_SKIP_TARGETS,
}: {
  targets?: readonly SkipTarget[];
} = {}): JSX.Element {
  return (
    <div data-testid="skip-links" style={A11Y_CONTAINER}>
      {targets.map((target) => (
        <a
          key={target.id}
          href={`#${target.id}`}
          className="cosmos-skip-link"
          data-testid={`skip-link-${target.id}`}
          onClick={(event) => {
            // Programmatic focus so the landmark actually receives keyboard focus.
            const el = document.getElementById(target.id);
            if (el) {
              event.preventDefault();
              el.focus({ preventScroll: false });
            }
          }}
        >
          {target.label}
        </a>
      ))}
    </div>
  );
}
