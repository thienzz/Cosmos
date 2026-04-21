/**
 * T33 — screen-reader announcement hub (Doc 16 §Screen Reader Support,
 * Doc 24 §17.3).
 *
 * A single DOM-backed `aria-live` region mounted at `document.body`, writable
 * from anywhere. The region is visually hidden (off-screen absolute) but
 * remains in the accessibility tree so NVDA/VoiceOver/TalkBack pick up text
 * changes. One region is sufficient — writing into it clears the last value
 * so the same message is re-announced if the user re-fires it.
 *
 * We separate "polite" (announced on the next speech pause) from
 * "assertive" (interrupts the reader) per WCAG recommendation (Doc 16
 * §Polite vs. Assertive). Non-critical state changes — selection, mode
 * switches, tour step updates — go polite. Errors and loading-complete
 * signals can opt into assertive.
 */

export type AnnouncePriority = 'polite' | 'assertive';

export interface Announcer {
  announce: (message: string, priority?: AnnouncePriority) => void;
  /** Tear down the DOM nodes. Idempotent. */
  dispose: () => void;
}

const LIVE_REGION_STYLE: Partial<CSSStyleDeclaration> = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: '0',
};

function applyOffscreenStyles(el: HTMLElement): void {
  for (const [key, value] of Object.entries(LIVE_REGION_STYLE)) {
    if (typeof value === 'string') {
      (el.style as unknown as Record<string, string>)[key] = value;
    }
  }
}

/**
 * Build a new announcer bound to `parent` (defaults to `document.body`).
 * Two live regions are created — one polite, one assertive — per ARIA
 * guidance to keep priorities separable.
 */
export function createAriaAnnouncer(parent?: HTMLElement): Announcer {
  const host = parent ?? document.body;

  const politeRegion = document.createElement('div');
  politeRegion.setAttribute('role', 'status');
  politeRegion.setAttribute('aria-live', 'polite');
  politeRegion.setAttribute('aria-atomic', 'true');
  politeRegion.setAttribute('data-testid', 'a11y-live-polite');
  applyOffscreenStyles(politeRegion);

  const assertiveRegion = document.createElement('div');
  assertiveRegion.setAttribute('role', 'alert');
  assertiveRegion.setAttribute('aria-live', 'assertive');
  assertiveRegion.setAttribute('aria-atomic', 'true');
  assertiveRegion.setAttribute('data-testid', 'a11y-live-assertive');
  applyOffscreenStyles(assertiveRegion);

  host.appendChild(politeRegion);
  host.appendChild(assertiveRegion);

  let disposed = false;

  const announce = (message: string, priority: AnnouncePriority = 'polite'): void => {
    if (disposed) return;
    const trimmed = message.trim();
    if (trimmed.length === 0) return;
    const region = priority === 'assertive' ? assertiveRegion : politeRegion;
    // Clearing then re-writing ensures repeat messages are re-announced.
    // Same-text writes wouldn't otherwise trigger a fresh mutation record.
    region.textContent = '';
    // A single-tick defer is the standard trick to force a fresh mutation;
    // without it some readers coalesce the clear+write into a no-op.
    setTimeout(() => {
      if (disposed) return;
      region.textContent = trimmed;
    }, 10);
  };

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    politeRegion.remove();
    assertiveRegion.remove();
  };

  return { announce, dispose };
}

// -- Singleton ---------------------------------------------------------------

let singleton: Announcer | null = null;

/**
 * Process-wide announcer. Lazy-created on first access so modules can
 * import `announce()` without side-effects at import time.
 */
export function getAnnouncer(): Announcer {
  if (singleton === null) {
    if (typeof document === 'undefined') {
      // SSR-safe no-op.
      const noop: Announcer = {
        announce: () => undefined,
        dispose: () => undefined,
      };
      return noop;
    }
    singleton = createAriaAnnouncer();
  }
  return singleton;
}

/** Convenience: `announce(msg)` without pulling the handle each time. */
export function announce(message: string, priority: AnnouncePriority = 'polite'): void {
  getAnnouncer().announce(message, priority);
}

/** Tear down the singleton. Used by tests + HMR. */
export function disposeAnnouncer(): void {
  if (singleton !== null) {
    singleton.dispose();
    singleton = null;
  }
}
