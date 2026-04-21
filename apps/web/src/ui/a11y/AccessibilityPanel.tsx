import { useEffect, useState } from 'react';

import { useSettingsStore } from '@/stores/settingsStore';

import { announce } from './a11yAnnouncer';

/**
 * T33 — accessibility settings panel (Doc 24 S-7.3, Doc 27 §5.7).
 *
 * A lightweight floating card with the three canonical a11y toggles that
 * Doc 24 §17.4–17.6 call out:
 *
 *   - **Reduced motion** — kills camera fly-to easing, CRT scanline
 *     animation, and every CSS transition (via `data-reduced-motion` on
 *     <html>, wired up by `useReducedMotion`).
 *   - **High contrast** — flips the palette to a WCAG AAA 7:1 scheme via
 *     `data-high-contrast` on <html>. `useHighContrast` does the plumbing.
 *   - **Screen reader mode** — cranks verbosity on the ARIA announcer +
 *     enables hidden celestial-object descriptions (Doc 16 §Hidden Text
 *     Descriptions). Acts as a user-asserted hint; we don't rely on
 *     sniffing for a SR since that's a privacy anti-pattern.
 *
 * Visibility:
 *
 *   - Collapsed by default — one small `A11Y` button in the top-left.
 *   - Expanded via click or `Alt+A` (Doc 16 §Reduced Transparency Mode).
 *   - `Escape` while expanded → collapse.
 *
 * All three toggles read/write `settingsStore`; the store's persist
 * middleware dumps them to IndexedDB so preferences survive reloads.
 */

const AETHER = {
  bgSurface: 'rgba(13,13,20,0.94)',
  border: '#2a2a3a',
  textPrimary: '#e8e8f0',
  textSecondary: '#a0a0b8',
  textLabel: '#fbbf24',
  accentCyan: '#00e5ff',
  accentGreen: '#4ade80',
  accentAmber: '#fbbf24',
  pressStart2p: '"Press Start 2P", "Space Mono", monospace',
  ibmPlex: '"IBM Plex Mono", monospace',
} as const;

export interface AccessibilityPanelProps {
  /** Start expanded. Useful for the Doc 24 S-7.3 modal variant. */
  defaultOpen?: boolean;
}

export function AccessibilityPanel({
  defaultOpen = false,
}: AccessibilityPanelProps): JSX.Element {
  const [open, setOpen] = useState(defaultOpen);

  const reducedMotion = useSettingsStore((s) => s.reducedMotion);
  const highContrast = useSettingsStore((s) => s.highContrast);
  const screenReaderMode = useSettingsStore((s) => s.screenReaderMode);
  const setSetting = useSettingsStore((s) => s.setSetting);

  // Alt+A toggles the panel (Doc 16 §Reduced Transparency Mode).
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.altKey && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        setOpen((prev) => !prev);
        return;
      }
      if (event.key === 'Escape' && open) {
        const target = event.target;
        // Only collapse if focus isn't inside another dismissable panel
        // (InfoPanel/TourNarrationPanel own their own Escape handlers).
        // `event.target` is a Window when the event is dispatched on
        // `window` (tests + the real browser's document-level listener) —
        // guard with `instanceof Element` so `.closest` is safe.
        if (target instanceof Element) {
          if (target.closest('[data-testid="info-panel"]')) return;
          if (target.closest('[data-testid="tour-narration"]')) return;
        }
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const toggle = <K extends 'reducedMotion' | 'highContrast' | 'screenReaderMode'>(
    key: K,
    next: boolean,
    label: string,
  ): void => {
    setSetting(key, next);
    announce(`${label} ${next ? 'enabled' : 'disabled'}.`, 'polite');
  };

  return (
    <section
      data-testid="a11y-panel"
      aria-label="Accessibility settings"
      style={{
        position: 'fixed',
        top: 16,
        left: 16,
        zIndex: 25,
        minWidth: open ? 240 : undefined,
      }}
    >
      <button
        type="button"
        data-testid="a11y-toggle"
        aria-expanded={open}
        aria-controls="cosmos-a11y-body"
        title="Accessibility settings (Alt+A)"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          background: AETHER.bgSurface,
          border: `1px solid ${open ? AETHER.accentCyan : AETHER.border}`,
          color: open ? AETHER.accentCyan : AETHER.textSecondary,
          fontFamily: AETHER.pressStart2p,
          fontSize: 9,
          letterSpacing: '0.08em',
          padding: '6px 10px',
          cursor: 'pointer',
          borderRadius: 2,
          minHeight: 28,
        }}
      >
        {open ? '▾ A11Y' : '◇ A11Y'}
      </button>

      {open && (
        <div
          id="cosmos-a11y-body"
          role="group"
          aria-label="Accessibility toggles"
          style={{
            marginTop: 6,
            padding: 10,
            background: AETHER.bgSurface,
            border: `1px solid ${AETHER.border}`,
            borderRadius: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            fontFamily: AETHER.ibmPlex,
            fontSize: 11,
            color: AETHER.textPrimary,
            boxShadow: '0 0 12px rgba(0, 229, 255, 0.08)',
          }}
        >
          <ToggleRow
            id="reduced-motion"
            label="Reduced motion"
            description="Disable camera fly-to easing + UI transitions"
            checked={reducedMotion}
            onChange={(v) => toggle('reducedMotion', v, 'Reduced motion')}
            accent={AETHER.accentGreen}
          />
          <ToggleRow
            id="high-contrast"
            label="High contrast"
            description="WCAG AAA 7:1 palette, remove CRT overlay"
            checked={highContrast}
            onChange={(v) => toggle('highContrast', v, 'High contrast mode')}
            accent={AETHER.accentAmber}
          />
          <ToggleRow
            id="screen-reader-mode"
            label="Screen reader mode"
            description="Verbose announcements + hidden descriptions"
            checked={screenReaderMode}
            onChange={(v) => toggle('screenReaderMode', v, 'Screen reader mode')}
            accent={AETHER.accentCyan}
          />
          <div
            style={{
              marginTop: 4,
              fontSize: 10,
              color: AETHER.textSecondary,
              lineHeight: 1.5,
            }}
          >
            Press <kbd>Alt+A</kbd> to toggle this panel.
          </div>
        </div>
      )}
    </section>
  );
}

// -- Subcomponents ----------------------------------------------------------

function ToggleRow({
  id,
  label,
  description,
  checked,
  onChange,
  accent,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  accent: string;
}): JSX.Element {
  const descId = `a11y-${id}-desc`;
  return (
    <label
      style={{
        display: 'flex',
        gap: 8,
        cursor: 'pointer',
        alignItems: 'flex-start',
      }}
    >
      <input
        type="checkbox"
        data-testid={`a11y-${id}`}
        checked={checked}
        aria-describedby={descId}
        onChange={(event) => onChange(event.target.checked)}
        style={{
          width: 16,
          height: 16,
          marginTop: 1,
          accentColor: accent,
          flex: '0 0 auto',
        }}
      />
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontWeight: 600, color: checked ? accent : '#e8e8f0' }}>
          {label}
        </span>
        <span id={descId} style={{ fontSize: 10, color: '#a0a0b8', lineHeight: 1.4 }}>
          {description}
        </span>
      </span>
    </label>
  );
}
