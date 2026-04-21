import { toursForMode } from '@/engine/tourCatalog';
import { useModeStore } from '@/stores/modeStore';

/**
 * Tour launcher (T32, Doc 20 §2.12, Doc 21 §Screen 1.14).
 *
 * Floating card on the right side. Offers the tours available from the
 * current mode — per Doc 27 §10 only `exploration` and `education` can
 * start a guided tour, so the launcher hides itself in any other mode.
 *
 * Clicking a tour calls `modeStore.startTour(id, totalSteps)`. The store
 * switches `activeMode` to `guided_tour`; the {@link TourEngine}
 * subscription then dispatches the first fly-to waypoint.
 */

const AETHER = {
  bgSurface: 'rgba(13,13,20,0.92)',
  border: '#2a2a3a',
  textPrimary: '#e8e8f0',
  textSecondary: '#a0a0b8',
  textLabel: '#fbbf24',
  accentCyan: '#00e5ff',
  accentPurple: '#c084fc',
  pressStart2p: '"Press Start 2P", "Space Mono", monospace',
  spaceMono: '"Space Mono", "Courier New", monospace',
  ibmPlex: '"IBM Plex Mono", monospace',
} as const;

export function TourLauncher(): JSX.Element | null {
  const activeMode = useModeStore((s) => s.activeMode);
  const startTour = useModeStore((s) => s.startTour);

  const tours = toursForMode(activeMode);
  if (tours.length === 0) return null;

  return (
    <section
      data-testid="tour-launcher"
      aria-label="Guided tours"
      style={{
        position: 'fixed',
        top: 140,
        right: 16,
        width: 220,
        background: AETHER.bgSurface,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid ${AETHER.border}`,
        borderRadius: 2,
        padding: 8,
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        fontFamily: AETHER.spaceMono,
      }}
    >
      <div
        style={{
          fontFamily: AETHER.pressStart2p,
          fontSize: 8,
          letterSpacing: 1,
          color: AETHER.textLabel,
          textTransform: 'uppercase',
          textShadow: `0 0 4px ${AETHER.textLabel}40`,
        }}
      >
        ◢ Tours
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {tours.map((tour) => (
          <button
            key={tour.id}
            type="button"
            data-testid={`tour-start-${tour.id}`}
            title={tour.description}
            onClick={() => startTour(tour.id, tour.waypoints.length)}
            style={{
              padding: '6px 8px',
              background: 'transparent',
              border: `1px solid ${AETHER.accentPurple}66`,
              color: AETHER.accentPurple,
              fontFamily: AETHER.spaceMono,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.5,
              textAlign: 'left',
              cursor: 'pointer',
              borderRadius: 2,
            }}
          >
            ▶ {tour.id} — {tour.title}
            <div
              style={{
                fontFamily: AETHER.ibmPlex,
                fontSize: 10,
                fontWeight: 400,
                letterSpacing: 0,
                color: AETHER.textSecondary,
                marginTop: 2,
              }}
            >
              {tour.waypoints.length} steps
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
