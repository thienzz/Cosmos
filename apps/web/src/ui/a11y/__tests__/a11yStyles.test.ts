import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { A11Y_CSS, mountA11yStyles } from '../a11yStyles';

describe('a11yStyles', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.documentElement.removeAttribute('data-high-contrast');
    document.documentElement.removeAttribute('data-reduced-motion');
  });

  afterEach(() => {
    document.head.innerHTML = '';
    document.documentElement.removeAttribute('data-high-contrast');
    document.documentElement.removeAttribute('data-reduced-motion');
  });

  it('CSS string covers the T33 contract', () => {
    expect(A11Y_CSS).toContain('.sr-only');
    expect(A11Y_CSS).toContain(':focus-visible');
    expect(A11Y_CSS).toContain('.cosmos-skip-link');
    expect(A11Y_CSS).toContain('[data-high-contrast="true"]');
    expect(A11Y_CSS).toContain('[data-reduced-motion="true"]');
    expect(A11Y_CSS).toContain('prefers-reduced-motion');
    // Focus ring >= 3px outline (Doc 16 checklist).
    expect(A11Y_CSS).toContain('outline: 3px solid');
    // HC mode removes CRT overlay (Doc 24 §17.5).
    expect(A11Y_CSS).toContain('backdrop-filter: none');
  });

  it('injects one <style> tag into <head>', () => {
    const dispose = mountA11yStyles();
    const tag = document.getElementById('cosmos-a11y-styles');
    expect(tag).not.toBeNull();
    expect(tag?.tagName).toBe('STYLE');
    expect(tag?.textContent).toContain('.sr-only');
    dispose();
    expect(document.getElementById('cosmos-a11y-styles')).toBeNull();
  });

  it('is idempotent across repeated mounts', () => {
    const d1 = mountA11yStyles();
    const d2 = mountA11yStyles();
    const tags = document.querySelectorAll('#cosmos-a11y-styles');
    expect(tags.length).toBe(1);
    d1();
    // Second disposer has the existing reference — calling it removes the same tag.
    expect(document.getElementById('cosmos-a11y-styles')).toBeNull();
    d2();
  });
});
