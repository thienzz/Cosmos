import { useEffect } from 'react';

import { mountA11yStyles } from '@/ui/a11y/a11yStyles';
import { AccessibilityPanel } from '@/ui/a11y/AccessibilityPanel';
import { SkipLinks } from '@/ui/a11y/SkipLinks';
import { useAriaAnnouncements } from '@/ui/a11y/useAriaAnnouncements';
import { useHighContrast } from '@/ui/a11y/useHighContrast';
import { useReducedMotion } from '@/ui/a11y/useReducedMotion';
import { AudioControls } from '@/ui/AudioControls';
import { CosmosCanvas } from '@/ui/CosmosCanvas';
import { InfoPanel } from '@/ui/InfoPanel';
import { ModeSwitcher } from '@/ui/ModeSwitcher';
import { SearchPanel } from '@/ui/SearchPanel';
import { TimeControls } from '@/ui/TimeControls';
import { TourLauncher } from '@/ui/TourLauncher';
import { TourNarrationPanel } from '@/ui/TourNarrationPanel';

export function App(): JSX.Element {
  // T33 — global a11y plumbing. Order matters:
  //   1. Style injection before any hook that reads the cascade.
  //   2. Motion + contrast hooks sync OS media queries ↔ settings store.
  //   3. Announcement subscriptions convert state changes → SR updates.
  useEffect(() => {
    const dispose = mountA11yStyles();
    return () => dispose();
  }, []);
  useReducedMotion();
  useHighContrast();
  useAriaAnnouncements();

  return (
    <div
      id="cosmos-root"
      style={{
        position: 'fixed',
        inset: 0,
        margin: 0,
        background: '#02030a',
        color: '#5affb5',
        fontFamily: '"IBM Plex Mono", monospace',
      }}
    >
      <SkipLinks />
      {/* Landmark anchors targeted by the skip links. */}
      <main
        id="cosmos-viewport"
        role="main"
        aria-label="3D viewport"
        tabIndex={-1}
        style={{ position: 'absolute', inset: 0 }}
      >
        {/* T50 — unified universe scene. SceneManager defaults now mount
            every content layer; DefaultSceneComposer drives per-layer
            visibility from scale regime × app mode so the same canvas
            handles Solar System → Stellar → Galactic → Cosmic zoom-out
            without gallery overlap. */}
        <CosmosCanvas />
      </main>
      <div id="cosmos-search" tabIndex={-1}>
        <SearchPanel />
      </div>
      <InfoPanel />
      <div id="cosmos-controls" tabIndex={-1}>
        <TimeControls />
      </div>
      <AudioControls />
      <ModeSwitcher />
      <TourLauncher />
      <TourNarrationPanel />
      <AccessibilityPanel />
    </div>
  );
}
