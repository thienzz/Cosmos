import { useModeStore } from '@/stores/modeStore';
import type { AppMode } from '@/stores/types';

/**
 * Application-mode switcher (T32, Doc 20 §1.2, Doc 27 §10).
 *
 * Top-right HUD. Five-button segmented control — one per mode in the
 * state machine (Doc 27 §10.1). Clicking a button calls
 * `modeStore.setMode(...)` which:
 *
 *   - preserves the current camera position/rotation (TS-MODE-005); the
 *     camera store is never touched from here,
 *   - wipes any active tour state if we're leaving `guided_tour`.
 *
 * `guided_tour` is NOT shown as a switchable target — Doc 27 §10 constrains
 * entry to "from Exploration or Education", and only through the tour
 * launcher (see {@link TourLauncher}). When a tour is running the switcher
 * shows a dimmed "ON TOUR" badge instead of the button row so the user
 * doesn't accidentally wipe the tour by clicking another mode.
 */

const AETHER = {
  bgSurface: 'rgba(13,13,20,0.92)',
  border: '#2a2a3a',
  textPrimary: '#e8e8f0',
  textSecondary: '#a0a0b8',
  textLabel: '#fbbf24',
  accentCyan: '#00e5ff',
  accentPurple: '#c084fc',
  accentGreen: '#4ade80',
  accentAmber: '#fbbf24',
  pressStart2p: '"Press Start 2P", "Space Mono", monospace',
  spaceMono: '"Space Mono", "Courier New", monospace',
  ibmPlex: '"IBM Plex Mono", monospace',
} as const;

interface ModeDescriptor {
  id: Exclude<AppMode, 'guided_tour'>;
  label: string;
  accent: string;
  /** Short caption shown as `title` attribute. */
  title: string;
}

const MODES: readonly ModeDescriptor[] = [
  {
    id: 'exploration',
    label: 'Explorer',
    accent: AETHER.accentCyan,
    title: 'Exploration — full search, all entity toggles, free camera',
  },
  {
    id: 'education',
    label: 'Educator',
    accent: AETHER.accentGreen,
    title: 'Education — curated subset, simplified search, guided tours',
  },
  {
    id: 'observation',
    label: 'Observer',
    accent: AETHER.accentAmber,
    title: 'Observation — filtered to visible, orbit-locked camera',
  },
  {
    id: 'research',
    label: 'Research',
    accent: AETHER.accentPurple,
    title: 'Research — advanced search + data overlays + FITS import',
  },
] as const;

export function ModeSwitcher(): JSX.Element {
  const activeMode = useModeStore((s) => s.activeMode);
  const setMode = useModeStore((s) => s.setMode);

  const isInTour = activeMode === 'guided_tour';

  return (
    <section
      data-testid="mode-switcher"
      aria-label="Application mode"
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
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
        minWidth: 220,
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 4,
          height: 4,
          background: AETHER.accentCyan,
          opacity: 0.6,
        }}
      />
      <div
        style={{
          fontFamily: AETHER.pressStart2p,
          fontSize: 8,
          letterSpacing: 1,
          color: AETHER.textLabel,
          textTransform: 'uppercase',
          textShadow: `0 0 4px ${AETHER.accentAmber}40`,
        }}
      >
        ◢ Mode
      </div>
      {isInTour ? (
        <div
          data-testid="mode-tour-badge"
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 8px',
            border: `1px solid ${AETHER.accentPurple}66`,
            background: `${AETHER.accentPurple}12`,
            color: AETHER.accentPurple,
            fontFamily: AETHER.ibmPlex,
            fontSize: 11,
            letterSpacing: 0.5,
            borderRadius: 2,
          }}
        >
          <span aria-hidden>◉</span>
          <span>ON TOUR — exit to switch modes</span>
        </div>
      ) : (
        <div
          role="group"
          aria-label="Switch application mode"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 4,
          }}
        >
          {MODES.map((mode) => {
            const active = mode.id === activeMode;
            return (
              <button
                key={mode.id}
                type="button"
                data-testid={`mode-btn-${mode.id}`}
                aria-pressed={active}
                title={mode.title}
                onClick={() => setMode(mode.id)}
                style={{
                  height: 28,
                  padding: '0 10px',
                  background: active ? `${mode.accent}22` : 'transparent',
                  border: `1px solid ${active ? `${mode.accent}aa` : AETHER.border}`,
                  color: active ? mode.accent : AETHER.textSecondary,
                  fontFamily: AETHER.spaceMono,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  borderRadius: 2,
                  textShadow: active ? `0 0 6px ${mode.accent}66` : 'none',
                  textAlign: 'left',
                }}
              >
                {active ? '◉ ' : '○ '}
                {mode.label}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
