import { useEffect, useRef } from 'react';

import { getTourById } from '@/engine/tourCatalog';
import { useCameraStore } from '@/stores/cameraStore';
import { useModeStore } from '@/stores/modeStore';
import { useSelectionStore } from '@/stores/selectionStore';
import type { EntityData, ScaleRegime } from '@/stores/types';
import { useUIStore } from '@/stores/uiStore';

import { announce as defaultAnnounce, type AnnouncePriority } from './a11yAnnouncer';

/**
 * T33 — bridge from Zustand state changes to the ARIA live region
 * (Doc 16 §Live Regions, Doc 24 §17.3).
 *
 * Subscribes to the warm/cool stores and emits screen-reader
 * announcements on:
 *
 *   - Selection change → entity name + type + (optional) distance.
 *     Applies to TS-A11Y-002.
 *   - Application mode change → "Mode: Research" etc.
 *   - Tour step change → "Step 2 of 5: Mercury".
 *   - Scale regime change → "Scale: Stellar".
 *
 * Uses the singleton announcer by default; tests can inject a mock via the
 * `announce` prop. Mounted once near the root of the app so every change is
 * captured regardless of which panel is visible.
 */

export interface UseAriaAnnouncementsOptions {
  /** Replace the default ARIA announcer — useful for tests. */
  announce?: (message: string, priority?: AnnouncePriority) => void;
}

export function useAriaAnnouncements(options: UseAriaAnnouncementsOptions = {}): void {
  const emit = options.announce ?? defaultAnnounce;

  // Keep prior values in refs so we only announce *changes*, not every
  // React render. We deliberately don't prime from initial state — the
  // first real store write after mount produces the first announcement.
  const lastEntityId = useRef<number | null>(null);
  const lastMode = useRef<string | null>(null);
  const lastTourKey = useRef<string | null>(null);
  const lastRegime = useRef<ScaleRegime | null>(null);

  // --- Selection --------------------------------------------------------
  useEffect(() => {
    return useSelectionStore.subscribe((state, prev) => {
      const id = state.selectedEntityId;
      const entity = state.selectedEntity;
      if (id === prev.selectedEntityId && entity === prev.selectedEntity) return;
      if (id === null || entity === null) {
        // Selection cleared — stay quiet. Avoid spam if user just closes panel.
        lastEntityId.current = null;
        return;
      }
      if (lastEntityId.current === id && state.isLoadingEntity === prev.isLoadingEntity) {
        // Same id + same loading state — likely an identical upgrade pass; skip.
        return;
      }
      lastEntityId.current = id;
      emit(buildSelectionAnnouncement(entity), 'polite');
    });
    // emit is stable when the user passes `announce`; default is module-singleton.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Mode -------------------------------------------------------------
  useEffect(() => {
    lastMode.current = useModeStore.getState().activeMode;
    return useModeStore.subscribe((state) => {
      if (state.activeMode === lastMode.current) return;
      const prev = lastMode.current;
      lastMode.current = state.activeMode;
      // Skip re-firing on initial tour-entry (the tour announcer will cover it).
      if (state.activeMode === 'guided_tour') return;
      // Skip echo of "exploration" when leaving a tour — the tour exit announcement
      // covers it too.
      if (prev === 'guided_tour' && state.activeMode === 'exploration' && state.tourId === null) {
        return;
      }
      emit(`Application mode: ${MODE_LABELS[state.activeMode] ?? state.activeMode}.`, 'polite');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Tour step --------------------------------------------------------
  useEffect(() => {
    return useModeStore.subscribe((state) => {
      const key = buildTourKey(state.tourId, state.tourStep);
      if (key === lastTourKey.current) return;
      const prevKey = lastTourKey.current;
      lastTourKey.current = key;

      // Tour exit.
      if (state.tourId === null && prevKey !== null) {
        emit('Tour ended.', 'polite');
        return;
      }
      if (state.tourId === null) return;

      const tour = getTourById(state.tourId);
      if (tour === null) return;
      const waypoint = tour.waypoints[state.tourStep];
      const total = state.tourTotalSteps || tour.waypoints.length;
      const step = state.tourStep + 1;
      const title = waypoint?.title ?? '';
      emit(
        `Tour step ${step} of ${total}${title ? `: ${title}` : ''}.`,
        'polite',
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Scale regime -----------------------------------------------------
  useEffect(() => {
    lastRegime.current = useCameraStore.getState().scaleRegime;
    return useCameraStore.subscribe((state) => {
      if (state.scaleRegime === lastRegime.current) return;
      lastRegime.current = state.scaleRegime;
      emit(`Scale: ${REGIME_LABELS[state.scaleRegime] ?? state.scaleRegime}.`, 'polite');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Global loading (mount progress) ----------------------------------
  // Loading-progress announcements at 25/50/75/100% land in `uiStore`.
  // Emit when globalLoading flips off to surface "loaded" to the reader.
  const lastLoading = useRef(useUIStore.getState().globalLoading);
  useEffect(() => {
    return useUIStore.subscribe((state) => {
      if (state.globalLoading === lastLoading.current) return;
      lastLoading.current = state.globalLoading;
      if (!state.globalLoading) {
        emit('Scene loaded.', 'polite');
      } else if (state.loadingMessage !== null) {
        emit(state.loadingMessage, 'polite');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// ---- Formatting helpers ---------------------------------------------------

const MODE_LABELS: Record<string, string> = {
  exploration: 'Exploration',
  education: 'Education',
  observation: 'Observation',
  research: 'Research',
  guided_tour: 'Guided Tour',
};

const REGIME_LABELS: Record<ScaleRegime, string> = {
  solar_system: 'Solar System',
  stellar: 'Stellar',
  galactic: 'Galactic',
  cosmic: 'Cosmic',
};

function buildTourKey(tourId: string | null, step: number): string | null {
  return tourId === null ? null : `${tourId}#${step}`;
}

function buildSelectionAnnouncement(entity: EntityData): string {
  const payload = entity.payload as {
    kindLabel?: string;
    parentName?: string | null;
    semiMajorAxis_display?: number;
    semiMajorAxis_unit?: string;
  };
  const type = payload.kindLabel ?? entity.object_type ?? 'object';
  const parts = [`Selected: ${entity.name}`, `Type: ${type}`];
  if (
    typeof payload.semiMajorAxis_display === 'number' &&
    payload.semiMajorAxis_display > 0
  ) {
    const unit = payload.semiMajorAxis_unit ?? 'AU';
    parts.push(`Distance: ${formatNumberLoose(payload.semiMajorAxis_display)} ${unit}`);
  }
  return `${parts.join('. ')}.`;
}

function formatNumberLoose(v: number): string {
  if (!Number.isFinite(v)) return '—';
  if (v >= 100) return v.toFixed(0);
  if (v >= 1) return v.toFixed(2);
  return v.toPrecision(3);
}
