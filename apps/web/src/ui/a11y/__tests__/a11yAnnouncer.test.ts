import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  announce,
  createAriaAnnouncer,
  disposeAnnouncer,
  getAnnouncer,
} from '../a11yAnnouncer';

/**
 * T33 — aria-live announcer contract (Doc 16 §Live Regions, Doc 24 §17.3).
 * These tests cover TS-A11Y-002 (screen reader — entity info announced)
 * plus the plumbing the rest of the a11y suite relies on.
 */

describe('createAriaAnnouncer', () => {
  beforeEach(() => {
    // Each test starts with a clean DOM.
    document.body.innerHTML = '';
    disposeAnnouncer();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    disposeAnnouncer();
    document.body.innerHTML = '';
  });

  it('mounts two off-screen live regions with correct ARIA', () => {
    createAriaAnnouncer();
    const polite = document.querySelector<HTMLElement>('[data-testid="a11y-live-polite"]');
    const assertive = document.querySelector<HTMLElement>(
      '[data-testid="a11y-live-assertive"]',
    );
    expect(polite).not.toBeNull();
    expect(assertive).not.toBeNull();
    expect(polite!.getAttribute('aria-live')).toBe('polite');
    expect(polite!.getAttribute('aria-atomic')).toBe('true');
    expect(polite!.getAttribute('role')).toBe('status');
    expect(assertive!.getAttribute('aria-live')).toBe('assertive');
    expect(assertive!.getAttribute('role')).toBe('alert');
    // Off-screen via clip.
    expect(polite!.style.position).toBe('absolute');
    expect(polite!.style.width).toBe('1px');
  });

  it('writes a polite message after a short debounce', () => {
    const announcer = createAriaAnnouncer();
    announcer.announce('Selected: Earth. Type: Terrestrial.');
    // Clearing phase fires synchronously.
    const polite = document.querySelector<HTMLElement>(
      '[data-testid="a11y-live-polite"]',
    )!;
    expect(polite.textContent).toBe('');
    vi.advanceTimersByTime(20);
    expect(polite.textContent).toBe('Selected: Earth. Type: Terrestrial.');
  });

  it('routes assertive messages to the alert region', () => {
    const announcer = createAriaAnnouncer();
    announcer.announce('Connection lost.', 'assertive');
    vi.advanceTimersByTime(20);
    const polite = document.querySelector<HTMLElement>(
      '[data-testid="a11y-live-polite"]',
    )!;
    const assertive = document.querySelector<HTMLElement>(
      '[data-testid="a11y-live-assertive"]',
    )!;
    expect(polite.textContent).toBe('');
    expect(assertive.textContent).toBe('Connection lost.');
  });

  it('re-announces identical messages by clearing first', () => {
    const announcer = createAriaAnnouncer();
    announcer.announce('Tour step 1.');
    vi.advanceTimersByTime(20);
    const region = document.querySelector<HTMLElement>(
      '[data-testid="a11y-live-polite"]',
    )!;
    expect(region.textContent).toBe('Tour step 1.');

    // Second call with same string must clear+rewrite (forces a mutation record).
    announcer.announce('Tour step 1.');
    expect(region.textContent).toBe('');
    vi.advanceTimersByTime(20);
    expect(region.textContent).toBe('Tour step 1.');
  });

  it('ignores empty / whitespace-only messages', () => {
    const announcer = createAriaAnnouncer();
    announcer.announce('   ');
    announcer.announce('');
    vi.advanceTimersByTime(20);
    const region = document.querySelector<HTMLElement>(
      '[data-testid="a11y-live-polite"]',
    )!;
    expect(region.textContent).toBe('');
  });

  it('no-ops after dispose (idempotent teardown)', () => {
    const announcer = createAriaAnnouncer();
    announcer.dispose();
    expect(
      document.querySelector('[data-testid="a11y-live-polite"]'),
    ).toBeNull();
    // Subsequent announce calls don't throw.
    announcer.announce('should not appear');
    vi.advanceTimersByTime(20);
    // Second dispose is a no-op.
    announcer.dispose();
    expect(document.querySelector('[data-testid="a11y-live-polite"]')).toBeNull();
  });

  it('getAnnouncer returns a stable singleton', () => {
    const a = getAnnouncer();
    const b = getAnnouncer();
    expect(a).toBe(b);
    // After dispose, a fresh singleton is minted.
    disposeAnnouncer();
    const c = getAnnouncer();
    expect(c).not.toBe(a);
  });

  it('module-level announce() delegates to the singleton', () => {
    announce('Mode: Research.');
    vi.advanceTimersByTime(20);
    const polite = document.querySelector<HTMLElement>(
      '[data-testid="a11y-live-polite"]',
    )!;
    expect(polite.textContent).toBe('Mode: Research.');
  });
});
