import { useEffect, useRef, useState, type ChangeEvent } from 'react';

import { createDefaultAudioEngine, type AudioEngine } from '@/audio';
import { useSettingsStore } from '@/stores/settingsStore';

/**
 * Audio HUD (T31) — bottom-left corner, AETHER V4 styling.
 *
 *  ┌──────────────────────────┐
 *  │ ◢ AUDIO  [▶ ENABLE]      │   ← idle (before user gesture)
 *  └──────────────────────────┘
 *
 *  ┌──────────────────────────┐
 *  │ ◢ AUDIO  [♪ MUTE]        │
 *  │ MASTER  ▁▃▇▃▁  70%       │
 *  └──────────────────────────┘
 *
 * Lifecycle:
 *  1. Mount creates the {@link AudioEngine} (subscribes to settings + camera
 *     stores immediately, but the backend is silent until `.start()`).
 *  2. The Enable button calls `engine.start()` from the click handler — this
 *     is the AUD-001 user-gesture entry point that resumes the AudioContext.
 *  3. Once started, the panel exposes a master-volume slider + a mute toggle,
 *     both wired to `useSettingsStore`. The engine subscribes to the store
 *     and forwards the values to the backend automatically.
 */

const AETHER = {
  bgSurface: 'rgba(13,13,20,0.92)',
  border: '#2a2a3a',
  textPrimary: '#e8e8f0',
  textSecondary: '#a0a0b8',
  accentGreen: '#4ade80',
  accentAmber: '#fbbf24',
  accentRed: '#f87171',
  pressStart2p: '"Press Start 2P", "Space Mono", monospace',
  ibmPlex: '"IBM Plex Mono", monospace',
};

export function AudioControls(): JSX.Element {
  const masterVolume = useSettingsStore((s) => s.masterVolume);
  const isMuted = useSettingsStore((s) => s.isMuted);
  const setSetting = useSettingsStore((s) => s.setSetting);

  const engineRef = useRef<AudioEngine | null>(null);
  const [audioState, setAudioState] = useState<'idle' | 'starting' | 'running' | 'failed'>(
    'idle',
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Construct the engine once on mount. Subscriptions to settingsStore +
  // cameraStore are wired inside the AudioEngine constructor so we don't
  // need to re-attach them on rerender.
  useEffect(() => {
    const engine = createDefaultAudioEngine();
    engineRef.current = engine;
    // Dev-only handle so preview smoke / DevTools can poke the engine.
    // Mirrors the `window.__cosmosEngine` convention used by SceneManager
    // (Doc 27 §13.5 dev observability).
    if (import.meta.env.DEV) {
      (window as unknown as { __cosmosAudio?: AudioEngine }).__cosmosAudio = engine;
    }
    return () => {
      if (import.meta.env.DEV) {
        delete (window as unknown as { __cosmosAudio?: AudioEngine }).__cosmosAudio;
      }
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const handleEnable = async (): Promise<void> => {
    const engine = engineRef.current;
    if (!engine) return;
    setAudioState('starting');
    setErrorMessage(null);
    try {
      await engine.start();
      setAudioState('running');
    } catch (err) {
      setAudioState('failed');
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
  };

  const handleMuteToggle = (): void => {
    setSetting('isMuted', !isMuted);
  };

  const handleVolume = (e: ChangeEvent<HTMLInputElement>): void => {
    const next = Number(e.target.value) / 100;
    setSetting('masterVolume', Math.min(1, Math.max(0, next)));
  };

  return (
    <div
      role="region"
      aria-label="Audio controls"
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        minWidth: 220,
        padding: '10px 12px',
        background: AETHER.bgSurface,
        border: `1px solid ${AETHER.border}`,
        borderRadius: 4,
        color: AETHER.textPrimary,
        fontFamily: AETHER.ibmPlex,
        fontSize: 11,
        boxShadow: '0 0 12px rgba(0, 229, 255, 0.08)',
        zIndex: 100,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: audioState === 'running' ? 8 : 0,
        }}
      >
        <span
          style={{
            fontFamily: AETHER.pressStart2p,
            fontSize: 9,
            color: AETHER.textSecondary,
            letterSpacing: '0.08em',
          }}
        >
          ◢ AUDIO
        </span>

        {audioState === 'running' ? (
          <button
            type="button"
            onClick={handleMuteToggle}
            aria-pressed={isMuted}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            style={{
              background: 'transparent',
              border: `1px solid ${isMuted ? AETHER.accentRed : AETHER.accentGreen}`,
              color: isMuted ? AETHER.accentRed : AETHER.accentGreen,
              padding: '3px 8px',
              fontFamily: AETHER.pressStart2p,
              fontSize: 8,
              cursor: 'pointer',
              letterSpacing: '0.06em',
            }}
          >
            {isMuted ? '◌ MUTED' : '♪ MUTE'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleEnable}
            disabled={audioState === 'starting'}
            aria-label="Enable audio"
            style={{
              background: 'transparent',
              border: `1px solid ${
                audioState === 'failed' ? AETHER.accentRed : AETHER.accentGreen
              }`,
              color:
                audioState === 'failed' ? AETHER.accentRed : AETHER.accentGreen,
              padding: '3px 8px',
              fontFamily: AETHER.pressStart2p,
              fontSize: 8,
              cursor: audioState === 'starting' ? 'wait' : 'pointer',
              letterSpacing: '0.06em',
            }}
          >
            {audioState === 'starting'
              ? '◌ STARTING'
              : audioState === 'failed'
                ? '✕ RETRY'
                : '▶ ENABLE'}
          </button>
        )}
      </div>

      {audioState === 'running' && (
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: AETHER.textSecondary,
            fontSize: 10,
          }}
        >
          <span style={{ minWidth: 50, letterSpacing: '0.04em' }}>MASTER</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(masterVolume * 100)}
            onChange={handleVolume}
            aria-label="Master volume"
            style={{ flex: 1, accentColor: AETHER.accentGreen }}
          />
          <span
            style={{
              minWidth: 36,
              textAlign: 'right',
              color: AETHER.accentAmber,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {Math.round(masterVolume * 100)}%
          </span>
        </label>
      )}

      {errorMessage && (
        <div
          role="alert"
          style={{
            marginTop: 6,
            color: AETHER.accentRed,
            fontSize: 10,
          }}
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
}
