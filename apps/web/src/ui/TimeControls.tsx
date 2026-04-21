import { useEffect, useState, type ChangeEvent } from 'react';

import { useTimeStore } from '@/stores/timeStore';
import {
  TIME_STEP_PRESETS,
  formatJulianDateGregorian,
  formatSpeedLabel,
  sliderToSpeed,
  speedToSlider,
} from '@/utils/timeFormat';

/**
 * Time Control Panel (Doc 24 §3.3 BC zone, Doc 21 Screen 1.9).
 *
 * Anchored to the bottom-center of the viewport — 400 × 48 px per Doc 24 —
 * with expandable height when the preset row is shown.  Reads the full
 * time store; writes via actions.
 *
 * # UX model
 *
 *   ┌────────────────────────────────────────────────────────────────────┐
 *   │  [◀][▶][||][⟳ NOW]   2026-04-19 14:32:00   ▁▃▇▃▁  1yr/s   [+1d ▾] │
 *   └────────────────────────────────────────────────────────────────────┘
 *
 *   - Reverse / Play-Pause / "Go to Now" live in a 3-button cluster.
 *     Keeping play+pause as a single toggle matches Doc 21 §Playback "When
 *     playing: hidden or shows as pause icon".
 *   - Date read-out uses IBM Plex Mono for tabular legibility.
 *   - Speed slider is LOGARITHMIC (Doc 21 §Speed Slider — log10 steps from
 *     1× through 1e9×). The raw `playbackSpeed` value carries the sign; the
 *     slider only drives magnitude.
 *   - Preset steps jump the epoch by a configurable delta (hour / day /
 *     month / year / decade) per Doc 21.
 *
 * # Time-engine integration
 *
 *   The engine drives epoch advance when `isPlaying` is true. We write to
 *   the store; the engine reads on its next rAF tick. No ref to the
 *   SceneManager is required.
 */

// ---- AETHER V4 tokens (Doc 24 §3.1) -------------------------------------

const AETHER = {
  bgSurface: 'rgba(13,13,20,0.92)',
  bgElevated: 'rgba(26,26,36,0.92)',
  border: '#2a2a3a',
  borderActive: '#3a3a4a',
  textPrimary: '#e8e8f0',
  textSecondary: '#a0a0b8',
  textTertiary: '#6a6a80',
  textData: '#00e5ff',
  textLabel: '#fbbf24',
  accentPink: '#ff6b9d',
  accentCyan: '#00e5ff',
  accentPurple: '#c084fc',
  accentAmber: '#fbbf24',
  accentGreen: '#4ade80',
  accentRed: '#f87171',
  pressStart2p: '"Press Start 2P", "Space Mono", monospace',
  spaceMono: '"Space Mono", "Courier New", monospace',
  ibmPlex: '"IBM Plex Mono", "Space Mono", monospace',
} as const;

const iconButtonStyle = (accent: string): React.CSSProperties => ({
  width: 32,
  height: 32,
  background: `${accent}12`,
  border: `1px solid ${accent}66`,
  color: accent,
  fontFamily: AETHER.spaceMono,
  fontSize: 14,
  fontWeight: 700,
  lineHeight: 1,
  cursor: 'pointer',
  borderRadius: 2,
  padding: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const subtleButtonStyle: React.CSSProperties = {
  height: 24,
  padding: '0 8px',
  background: 'transparent',
  border: `1px solid ${AETHER.border}`,
  color: AETHER.textSecondary,
  fontFamily: AETHER.spaceMono,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 1,
  textTransform: 'uppercase',
  cursor: 'pointer',
  borderRadius: 2,
};

// ---- Main component ------------------------------------------------------

export function TimeControls(): JSX.Element {
  const epochJD = useTimeStore((s) => s.epochJD);
  const isPlaying = useTimeStore((s) => s.isPlaying);
  const playbackSpeed = useTimeStore((s) => s.playbackSpeed);
  const togglePlay = useTimeStore((s) => s.togglePlay);
  const setSpeed = useTimeStore((s) => s.setSpeed);
  const stepForward = useTimeStore((s) => s.stepForward);
  const stepBackward = useTimeStore((s) => s.stepBackward);
  const goToNow = useTimeStore((s) => s.goToNow);

  const [presetsOpen, setPresetsOpen] = useState(false);

  // Keyboard shortcut: Space toggles play/pause when no input is focused.
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== ' ') return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      event.preventDefault();
      togglePlay();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay]);

  const onSpeedInput = (event: ChangeEvent<HTMLInputElement>): void => {
    const linear = Number(event.target.value) / 1000;
    const magnitude = sliderToSpeed(linear);
    const sign = playbackSpeed < 0 ? -1 : 1;
    setSpeed(magnitude * sign);
  };

  const onReverse = (): void => setSpeed(-playbackSpeed);

  const sliderValue = Math.round(speedToSlider(playbackSpeed) * 1000);
  const speedLabel = formatSpeedLabel(playbackSpeed);
  const dateText = formatJulianDateGregorian(epochJD);

  return (
    <section
      data-testid="time-controls"
      aria-label="Time controls"
      style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 480,
        maxWidth: 'calc(100vw - 32px)',
        background: AETHER.bgSurface,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid ${AETHER.border}`,
        borderRadius: 2,
        padding: 8,
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        fontFamily: AETHER.spaceMono,
      }}
    >
      {/* Corner pixel accent (Doc 24 §3.4) */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 4,
          height: 4,
          background: AETHER.accentCyan,
          opacity: 0.6,
        }}
      />

      {/* Primary row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          minHeight: 32,
        }}
      >
        {/* Playback cluster */}
        <button
          type="button"
          aria-label="Reverse direction"
          title="Reverse (flip time direction)"
          onClick={onReverse}
          style={iconButtonStyle(AETHER.accentPurple)}
        >
          ◀
        </button>
        <button
          type="button"
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          onClick={togglePlay}
          data-testid="time-play-toggle"
          style={iconButtonStyle(isPlaying ? AETHER.accentAmber : AETHER.accentGreen)}
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>
        <button
          type="button"
          aria-label="Reset time to now"
          title="Reset time to now (real-world)"
          onClick={goToNow}
          style={iconButtonStyle(AETHER.accentCyan)}
        >
          ⟳
        </button>

        {/* Date readout */}
        <div
          data-testid="time-date"
          style={{
            flex: 1,
            fontFamily: AETHER.ibmPlex,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.3,
            color: AETHER.textData,
            textShadow: `0 0 6px ${AETHER.accentCyan}40`,
            textAlign: 'center',
            padding: '0 8px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {dateText}
        </div>

        {/* Preset toggle */}
        <button
          type="button"
          aria-label="Toggle time step presets"
          aria-expanded={presetsOpen}
          title="Step forward/back by preset intervals"
          onClick={() => setPresetsOpen((v) => !v)}
          style={{
            ...subtleButtonStyle,
            color: presetsOpen ? AETHER.accentCyan : AETHER.textSecondary,
            borderColor: presetsOpen ? `${AETHER.accentCyan}66` : AETHER.border,
          }}
        >
          Jump {presetsOpen ? '▴' : '▾'}
        </button>
      </div>

      {/* Speed row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minHeight: 24,
        }}
      >
        <span
          style={{
            fontFamily: AETHER.ibmPlex,
            fontSize: 10,
            letterSpacing: 1,
            color: AETHER.textLabel,
            textShadow: `0 0 4px ${AETHER.accentAmber}40`,
            textTransform: 'uppercase',
            width: 44,
          }}
        >
          Speed
        </span>
        <input
          type="range"
          min={0}
          max={1000}
          step={1}
          value={sliderValue}
          onChange={onSpeedInput}
          aria-label="Playback speed (logarithmic)"
          data-testid="time-speed-slider"
          style={{
            flex: 1,
            accentColor: AETHER.accentPurple,
            height: 4,
          }}
        />
        <span
          data-testid="time-speed-label"
          style={{
            fontFamily: AETHER.ibmPlex,
            fontSize: 12,
            fontWeight: 600,
            color: AETHER.accentPurple,
            textShadow: `0 0 6px ${AETHER.accentPurple}40`,
            minWidth: 80,
            textAlign: 'right',
          }}
        >
          {speedLabel}
        </span>
      </div>

      {/* Preset row (expandable) */}
      {presetsOpen && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 4,
          }}
        >
          {TIME_STEP_PRESETS.map((preset) => (
            <div key={preset.label} style={{ display: 'flex', gap: 2 }}>
              <button
                type="button"
                aria-label={`Step back ${preset.label.replace('+', '')}`}
                title={`Step back ${preset.label.replace('+', '')}`}
                onClick={() => stepBackward(preset.deltaDays)}
                style={{
                  ...subtleButtonStyle,
                  flex: 1,
                  color: AETHER.accentPurple,
                  borderColor: `${AETHER.accentPurple}40`,
                }}
              >
                −{preset.label.replace('+', '')}
              </button>
              <button
                type="button"
                aria-label={`Step forward ${preset.label.replace('+', '')}`}
                title={`Step forward ${preset.label.replace('+', '')}`}
                onClick={() => stepForward(preset.deltaDays)}
                style={{
                  ...subtleButtonStyle,
                  flex: 1,
                  color: AETHER.accentCyan,
                  borderColor: `${AETHER.accentCyan}40`,
                }}
              >
                {preset.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
