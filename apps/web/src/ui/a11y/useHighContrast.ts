import { useEffect } from 'react';

import { useSettingsStore } from '@/stores/settingsStore';

/**
 * T33 — sync `settingsStore.highContrast` with the OS `prefers-contrast`
 * media query (Doc 24 §17.5).
 *
 * Mirrors `useReducedMotion`: one-way seed from OS to store on mount +
 * live flips while the app is running, `data-high-contrast` attribute on
 * `<html>` so the global CSS rules in `a11yStyles.ts` kick in.
 *
 * Returns the effective boolean.
 */

const MEDIA_QUERY = '(prefers-contrast: more)';

export function useHighContrast(): boolean {
  const highContrast = useSettingsStore((s) => s.highContrast);
  const setSetting = useSettingsStore((s) => s.setSetting);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(MEDIA_QUERY);
    if (mql.matches && !useSettingsStore.getState().highContrast) {
      setSetting('highContrast', true);
    }
    const handleChange = (event: MediaQueryListEvent): void => {
      setSetting('highContrast', event.matches);
    };
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handleChange);
      return () => mql.removeEventListener('change', handleChange);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mql as any).addListener?.(handleChange);
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mql as any).removeListener?.(handleChange);
    };
  }, [setSetting]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (highContrast) {
      document.documentElement.setAttribute('data-high-contrast', 'true');
    } else {
      document.documentElement.removeAttribute('data-high-contrast');
    }
  }, [highContrast]);

  return highContrast;
}
