import { useEffect } from 'react';

import { useSettingsStore } from '@/stores/settingsStore';

/**
 * T33 — reconciles `settingsStore.reducedMotion` with the OS
 * `prefers-reduced-motion` media query (Doc 16 §Reduced Motion).
 *
 * Behaviour contract:
 *   1. If the user has *explicitly* toggled the setting in the UI, their
 *      pick wins — system pref is ignored. We don't currently track that
 *      explicit flag separately; instead, we treat the first OS signal as
 *      the bootstrap value and re-apply on every OS flip. Granular
 *      "user-override" telemetry lives with a follow-up.
 *   2. Whatever the effective value, mirror it onto
 *      `document.documentElement.dataset.reducedMotion` so the global CSS
 *      rules in `a11yStyles.ts` pick it up without React chatter.
 *   3. Returns the effective boolean so callers can gate animations
 *      imperatively (FlyToAnimator, TourEngine pacing, …).
 *
 * The store is the source of truth for the effective value. The OS flip
 * only *seeds* the store on mount if it hasn't already been flipped.
 */

const MEDIA_QUERY = '(prefers-reduced-motion: reduce)';

export function useReducedMotion(): boolean {
  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const setSetting = useSettingsStore((s) => s.setSetting);

  // OS sync — one-way from media-query → settings. If the user toggles
  // the panel manually mid-session, their pick sticks (unless the OS
  // flips again, which is rare and a reasonable re-seed trigger).
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(MEDIA_QUERY);
    // Seed: if the OS prefers reduced motion, bring the setting into sync.
    if (mql.matches && !useSettingsStore.getState().reducedMotion) {
      setSetting('reducedMotion', true);
    }
    const handleChange = (event: MediaQueryListEvent): void => {
      setSetting('reducedMotion', event.matches);
    };
    // Older Safari: no addEventListener on MediaQueryList.
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

  // Apply `data-reduced-motion` to <html>.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (reducedMotion) {
      document.documentElement.setAttribute('data-reduced-motion', 'true');
    } else {
      document.documentElement.removeAttribute('data-reduced-motion');
    }
  }, [reducedMotion]);

  return reducedMotion;
}
