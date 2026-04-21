import { useEffect } from 'react';

import { getTourById } from '@/engine/tourCatalog';
import { useModeStore } from '@/stores/modeStore';

/**
 * Guided-tour narration HUD (T32, Doc 21 §Screen 1.14).
 *
 * Bottom-centre panel shown only while `activeMode === 'guided_tour'`:
 *
 *   ┌──────────────────────────────────────────────────────────────┐
 *   │ STEP 2 of 5: Mercury                                         │
 *   │ "The fastest planet: 88-day year. Kepler 3: closer orbits …" │
 *   │ [✕ End Tour] [← Back] [Next Step →]                          │
 *   │ Progress: ████████░░░░░░░░░░░ 40%                             │
 *   └──────────────────────────────────────────────────────────────┘
 *
 * The panel writes to `modeStore` via `prevTourStep / nextTourStep /
 * exitTour`; the TourEngine subscribes to those writes and dispatches the
 * actual fly-to via the engine bridge (see {@link TourEngine}). The panel
 * itself has zero engine dependencies.
 *
 * ## Keyboard shortcuts
 *
 * While the panel is mounted (i.e. a tour is active):
 *   - `←` / `→` step through waypoints (ignored if an input is focused so
 *     the search bar etc. keep their native keybinds)
 *   - `Escape` exits the tour
 */

const AETHER = {
  bgSurface: 'rgba(15,23,42,0.95)',
  border: 'rgba(37,99,235,0.3)',
  textPrimary: '#e5e7eb',
  textSecondary: '#d1d5db',
  textCaption: '#6b7280',
  textLabel: '#fbbf24',
  accentBlue: '#60a5fa',
  accentBlueBg: 'rgba(37,99,235,0.2)',
  accentBlueBorder: 'rgba(37,99,235,0.4)',
  accentRed: '#fca5a5',
  accentRedBg: 'rgba(239,68,68,0.2)',
  accentRedBorder: 'rgba(239,68,68,0.3)',
  accentPurple: '#c084fc',
  pressStart2p: '"Press Start 2P", "Space Mono", monospace',
  spaceMono: '"Space Mono", "Courier New", monospace',
  ibmPlex: '"IBM Plex Mono", monospace',
  inter:
    '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
} as const;

export function TourNarrationPanel(): JSX.Element | null {
  const activeMode = useModeStore((s) => s.activeMode);
  const tourId = useModeStore((s) => s.tourId);
  const tourStep = useModeStore((s) => s.tourStep);
  const tourTotalSteps = useModeStore((s) => s.tourTotalSteps);
  const nextTourStep = useModeStore((s) => s.nextTourStep);
  const prevTourStep = useModeStore((s) => s.prevTourStep);
  const exitTour = useModeStore((s) => s.exitTour);

  const visible = activeMode === 'guided_tour' && tourId !== null;

  // Keyboard shortcuts are only relevant while the panel is visible. Mount
  // the listener inside the effect and early-return when not visible so we
  // don't leak handlers across tour sessions.
  useEffect(() => {
    if (!visible) return;
    const onKey = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        nextTourStep();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        prevTourStep();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        exitTour();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, nextTourStep, prevTourStep, exitTour]);

  if (!visible) return null;

  const tour = getTourById(tourId);
  if (tour === null) return null;

  const waypoint = tour.waypoints[tourStep];
  if (waypoint === undefined) return null;

  const stepNumber = tourStep + 1;
  const totalSteps = tourTotalSteps || tour.waypoints.length;
  const progressPct = totalSteps > 0 ? Math.round((stepNumber / totalSteps) * 100) : 0;

  const atStart = tourStep <= 0;
  const atEnd = tourStep >= totalSteps - 1;

  return (
    <section
      data-testid="tour-narration"
      role="dialog"
      aria-label={`Tour: ${tour.title}`}
      aria-live="polite"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 96,
        transform: 'translateX(-50%)',
        width: 'clamp(300px, 90vw, 600px)',
        background: AETHER.bgSurface,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid ${AETHER.border}`,
        padding: 20,
        borderRadius: 12,
        zIndex: 30,
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
        fontFamily: AETHER.inter,
        color: AETHER.textPrimary,
      }}
    >
      <div
        data-testid="tour-step-header"
        style={{
          fontFamily: AETHER.spaceMono,
          fontSize: 11,
          color: AETHER.textCaption,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 6,
        }}
      >
        STEP {stepNumber} of {totalSteps}: {waypoint.title}
      </div>

      <div
        style={{
          fontSize: 13,
          lineHeight: 1.6,
          color: AETHER.textSecondary,
          marginBottom: 16,
          maxHeight: 80,
          overflowY: 'auto',
        }}
      >
        {waypoint.narration}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <button
          type="button"
          data-testid="tour-exit"
          aria-label="End tour"
          onClick={exitTour}
          style={{
            background: AETHER.accentRedBg,
            border: `1px solid ${AETHER.accentRedBorder}`,
            color: AETHER.accentRed,
            fontFamily: AETHER.inter,
            fontSize: 12,
            fontWeight: 500,
            padding: '8px 12px',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          ✕ End Tour
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            data-testid="tour-prev"
            aria-label="Previous step"
            onClick={prevTourStep}
            disabled={atStart}
            style={{
              background: AETHER.accentBlueBg,
              border: `1px solid ${AETHER.accentBlueBorder}`,
              color: AETHER.accentBlue,
              fontFamily: AETHER.inter,
              fontSize: 12,
              fontWeight: 500,
              padding: '8px 16px',
              borderRadius: 4,
              cursor: atStart ? 'not-allowed' : 'pointer',
              opacity: atStart ? 0.5 : 1,
            }}
          >
            ← Back
          </button>
          <button
            type="button"
            data-testid="tour-next"
            aria-label="Next step"
            onClick={nextTourStep}
            disabled={atEnd}
            style={{
              background: AETHER.accentBlueBg,
              border: `1px solid ${AETHER.accentBlueBorder}`,
              color: AETHER.accentBlue,
              fontFamily: AETHER.inter,
              fontSize: 12,
              fontWeight: 500,
              padding: '8px 16px',
              borderRadius: 4,
              cursor: atEnd ? 'not-allowed' : 'pointer',
              opacity: atEnd ? 0.5 : 1,
            }}
          >
            Next Step →
          </button>
        </div>
      </div>

      <div
        data-testid="tour-progress"
        aria-label={`Progress: ${progressPct}%`}
        role="progressbar"
        aria-valuenow={progressPct}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          width: '100%',
          height: 3,
          background: 'rgba(37,99,235,0.15)',
          borderRadius: 1.5,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progressPct}%`,
            height: '100%',
            background: `linear-gradient(90deg, #2563eb, ${AETHER.accentPurple})`,
          }}
        />
      </div>
    </section>
  );
}
