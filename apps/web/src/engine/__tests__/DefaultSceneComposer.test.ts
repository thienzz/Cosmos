import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  DefaultSceneComposer,
  isLayerVisible,
  type SceneLayer,
  type SceneLayerHandles,
  type VisibilityHandle,
} from '../DefaultSceneComposer';
import { useCameraStore } from '@/stores/cameraStore';
import { useModeStore } from '@/stores/modeStore';
import { useUIStore } from '@/stores/uiStore';

type FullHandles = Record<SceneLayer, VisibilityHandle>;

/**
 * T50 — unit coverage for the regime × mode visibility router.
 *
 * Tests the pure visibility table (`isLayerVisible`) plus the composer's
 * reactivity to store transitions. No Three.js — handles are plain objects
 * with `.visible` booleans so the expectations line up 1:1 with the matrix
 * documented at the top of DefaultSceneComposer.ts.
 */

function makeHandles(): FullHandles {
  return {
    solarSystem: { visible: false },
    starField: { visible: false },
    starTileField: { visible: false },
    nebulaGallery: { visible: false },
    galaxyGallery: { visible: false },
    cosmicWeb: { visible: false },
    cmbBoundary: { visible: false },
    largeScaleStructure: { visible: false },
    milkyWayInterior: { visible: false },
    constellations: { visible: false },
    planetGallery: { visible: false },
    moonGallery: { visible: false },
    starTypeGallery: { visible: false },
    phenomenaGallery: { visible: false },
    exoplanetGallery: { visible: false },
    exoticGallery: { visible: false },
  };
}

const originalCamera = useCameraStore.getState();
const originalMode = useModeStore.getState();
const originalUI = useUIStore.getState();

beforeEach(() => {
  // Reset to Doc 27 §15.4 / §5.4 defaults so cross-test state doesn't leak.
  useCameraStore.setState({ scaleRegime: 'solar_system' });
  useModeStore.setState({ activeMode: 'exploration' });
  useUIStore.setState({ showConstellationLines: true });
});

afterEach(() => {
  useCameraStore.setState(originalCamera);
  useModeStore.setState(originalMode);
  useUIStore.setState(originalUI);
});

describe('isLayerVisible', () => {
  it('solar_system regime shows solar system, MW interior, constellations only', () => {
    expect(isLayerVisible('solarSystem', 'solar_system', 'exploration')).toBe(true);
    expect(isLayerVisible('milkyWayInterior', 'solar_system', 'exploration')).toBe(true);
    expect(isLayerVisible('constellations', 'solar_system', 'exploration')).toBe(true);
  });

  it('solar_system regime hides background starField, nebula gallery, and cosmic-scale layers', () => {
    // P1 — the 5K-point decorative starfield (radius 10–80u) and the 14-cube
    // nebula gallery test fixture both mesh with the solar-system volume
    // (Neptune at 360u). Both stay hidden at this regime so the user sees
    // only the actual solar system.
    expect(isLayerVisible('starField', 'solar_system', 'exploration')).toBe(false);
    expect(isLayerVisible('nebulaGallery', 'solar_system', 'exploration')).toBe(false);
    expect(isLayerVisible('galaxyGallery', 'solar_system', 'exploration')).toBe(false);
    expect(isLayerVisible('cosmicWeb', 'solar_system', 'exploration')).toBe(false);
    expect(isLayerVisible('cmbBoundary', 'solar_system', 'exploration')).toBe(false);
    expect(isLayerVisible('largeScaleStructure', 'solar_system', 'exploration')).toBe(false);
    // Star tiles are not mounted at solar-system regime — no Gaia catalogue
    // to draw at AU scale.
    expect(isLayerVisible('starTileField', 'solar_system', 'exploration')).toBe(false);
  });

  it('stellar regime unlocks starField + star tiles and keeps the solar system', () => {
    expect(isLayerVisible('starField', 'stellar', 'exploration')).toBe(true);
    expect(isLayerVisible('starTileField', 'stellar', 'exploration')).toBe(true);
    expect(isLayerVisible('solarSystem', 'stellar', 'exploration')).toBe(true);
    // Nebula gallery is a 14-cube test fixture (NebulaGalleryRenderer
    // docstring); it stays off until production nebula tiles ship (T45/T46).
    expect(isLayerVisible('nebulaGallery', 'stellar', 'exploration')).toBe(false);
    expect(isLayerVisible('cosmicWeb', 'stellar', 'exploration')).toBe(false);
  });

  it('galactic regime swaps in galaxy gallery and drops solar system + starField', () => {
    expect(isLayerVisible('solarSystem', 'galactic', 'exploration')).toBe(false);
    expect(isLayerVisible('starField', 'galactic', 'exploration')).toBe(false);
    expect(isLayerVisible('starTileField', 'galactic', 'exploration')).toBe(true);
    expect(isLayerVisible('galaxyGallery', 'galactic', 'exploration')).toBe(true);
    expect(isLayerVisible('cosmicWeb', 'galactic', 'exploration')).toBe(false);
  });

  it('cosmic regime shows galaxies, cosmic web, CMB, LSS only', () => {
    expect(isLayerVisible('galaxyGallery', 'cosmic', 'exploration')).toBe(true);
    expect(isLayerVisible('cosmicWeb', 'cosmic', 'exploration')).toBe(true);
    expect(isLayerVisible('cmbBoundary', 'cosmic', 'exploration')).toBe(true);
    expect(isLayerVisible('largeScaleStructure', 'cosmic', 'exploration')).toBe(true);
    expect(isLayerVisible('solarSystem', 'cosmic', 'exploration')).toBe(false);
    expect(isLayerVisible('starField', 'cosmic', 'exploration')).toBe(false);
    expect(isLayerVisible('starTileField', 'cosmic', 'exploration')).toBe(false);
  });

  it('education mode drops 1.8 B Gaia tile pyramid even when regime would allow it', () => {
    expect(isLayerVisible('starTileField', 'stellar', 'education')).toBe(false);
    expect(isLayerVisible('starTileField', 'stellar', 'exploration')).toBe(true);
  });

  it('education mode drops cosmic web + LSS (too abstract)', () => {
    expect(isLayerVisible('cosmicWeb', 'cosmic', 'education')).toBe(false);
    expect(isLayerVisible('largeScaleStructure', 'cosmic', 'education')).toBe(false);
    // CMB remains so learners can see the recombination boundary.
    expect(isLayerVisible('cmbBoundary', 'cosmic', 'education')).toBe(true);
  });

  it('observation mode hides all cosmic-scale scaffolding', () => {
    expect(isLayerVisible('galaxyGallery', 'cosmic', 'observation')).toBe(false);
    expect(isLayerVisible('cosmicWeb', 'cosmic', 'observation')).toBe(false);
    expect(isLayerVisible('cmbBoundary', 'cosmic', 'observation')).toBe(false);
    expect(isLayerVisible('largeScaleStructure', 'cosmic', 'observation')).toBe(false);
  });
});

/**
 * P5 — full regime × mode × layer truth table. Acts as a guardrail so future
 * visibility-matrix edits stay consistent with Doc 19 §Scale Transitions,
 * Doc 20 §Mode-Specific Content Filters, and the P1 regression fix
 * (starField + nebulaGallery off at solar_system scale).
 *
 * The table is authored as the expected *truth* per (regime, mode, layer)
 * triple. Missing entries are treated as `false`. Entries matching
 * `isLayerVisible` are the passing cases; mismatches fail with the full
 * triple printed for diagnosis.
 */
describe('P5 — regime × mode × layer matrix', () => {
  type Regime = Parameters<typeof isLayerVisible>[1];
  type Mode = Parameters<typeof isLayerVisible>[2];
  type Layer = Parameters<typeof isLayerVisible>[0];

  const REGIMES: Regime[] = ['solar_system', 'stellar', 'galactic', 'cosmic'];
  const MODES: Mode[] = ['exploration', 'research', 'education', 'observation', 'guided_tour'];
  const LAYERS: Layer[] = [
    'solarSystem',
    'starField',
    'starTileField',
    'nebulaGallery',
    'galaxyGallery',
    'cosmicWeb',
    'cmbBoundary',
    'largeScaleStructure',
    'milkyWayInterior',
    'constellations',
    'planetGallery',
    'moonGallery',
    'starTypeGallery',
    'phenomenaGallery',
    'exoplanetGallery',
    'exoticGallery',
  ];

  /** Truth table derived from {@link REGIME_VISIBILITY} ∧ {@link MODE_VISIBILITY}. */
  const expectedVisible = (regime: Regime, mode: Mode, layer: Layer): boolean => {
    // Regime-allowed layers (source of truth mirrored from DefaultSceneComposer.ts).
    const REGIME_ALLOWS: Record<Regime, Set<Layer>> = {
      solar_system: new Set(['solarSystem', 'milkyWayInterior', 'constellations']),
      stellar: new Set([
        'solarSystem',
        'starField',
        'starTileField',
        'milkyWayInterior',
        'constellations',
        'starTypeGallery',
        'exoplanetGallery',
        'exoticGallery',
        'phenomenaGallery',
      ]),
      galactic: new Set([
        'starTileField',
        'galaxyGallery',
        'milkyWayInterior',
        'phenomenaGallery',
        'exoticGallery',
      ]),
      cosmic: new Set(['galaxyGallery', 'cosmicWeb', 'cmbBoundary', 'largeScaleStructure']),
    };
    // Mode-allowed layers.
    const ALL: Set<Layer> = new Set(LAYERS);
    const MODE_ALLOWS: Record<Mode, Set<Layer>> = {
      exploration: ALL,
      research: ALL,
      education: new Set([
        'solarSystem',
        'nebulaGallery',
        'galaxyGallery',
        'cmbBoundary',
        'milkyWayInterior',
        'constellations',
        'planetGallery',
        'moonGallery',
        'starTypeGallery',
      ]),
      observation: new Set([
        'solarSystem',
        'starField',
        'starTileField',
        'nebulaGallery',
        'milkyWayInterior',
        'constellations',
      ]),
      guided_tour: ALL,
    };
    return REGIME_ALLOWS[regime].has(layer) && MODE_ALLOWS[mode].has(layer);
  };

  it('isLayerVisible matches the expected matrix for every (regime, mode, layer)', () => {
    const mismatches: string[] = [];
    for (const r of REGIMES) {
      for (const m of MODES) {
        for (const l of LAYERS) {
          const got = isLayerVisible(l, r, m);
          const want = expectedVisible(r, m, l);
          if (got !== want) {
            mismatches.push(`${r} × ${m} × ${l}: got=${got}, want=${want}`);
          }
        }
      }
    }
    expect(mismatches).toEqual([]);
  });

  it('P1 regression guard — starField and nebulaGallery stay off in solar_system', () => {
    for (const m of MODES) {
      expect(isLayerVisible('starField', 'solar_system', m)).toBe(false);
      expect(isLayerVisible('nebulaGallery', 'solar_system', m)).toBe(false);
    }
  });

  it('museum-showcase galleries stay off in solar_system across all modes', () => {
    // Phase 1 fix: the 6 showcase galleries use hardcoded 1-D layouts at
    // z=-2042..-7500 scene units. At solar_system scale that overlaps the
    // inner planets — they must stay hidden here until Phase 2 grounds them
    // in real 3D catalog positions.
    const SHOWCASE: Layer[] = [
      'planetGallery',
      'moonGallery',
      'starTypeGallery',
      'phenomenaGallery',
      'exoplanetGallery',
      'exoticGallery',
    ];
    for (const layer of SHOWCASE) {
      for (const m of MODES) {
        expect(
          isLayerVisible(layer, 'solar_system', m),
          `${layer} must be hidden in solar_system (mode=${m})`,
        ).toBe(false);
      }
    }
  });

  it('starField only draws in the stellar regime (pre-Gaia-tile placeholder)', () => {
    for (const r of REGIMES) {
      const got = isLayerVisible('starField', r, 'exploration');
      expect(got).toBe(r === 'stellar');
    }
  });
});

describe('DefaultSceneComposer', () => {
  it('applies regime × mode visibility on construction', () => {
    const handles = makeHandles();
    useCameraStore.setState({ scaleRegime: 'solar_system' });
    useModeStore.setState({ activeMode: 'exploration' });

    const composer = new DefaultSceneComposer({ handles });

    expect(handles.solarSystem.visible).toBe(true);
    expect(handles.milkyWayInterior.visible).toBe(true);
    expect(handles.constellations.visible).toBe(true);
    // P1 — background starField + nebula test fixture must be hidden at
    // solar_system regime so they don't overlap the inner planets.
    expect(handles.starField.visible).toBe(false);
    expect(handles.nebulaGallery.visible).toBe(false);
    expect(handles.galaxyGallery.visible).toBe(false);
    expect(handles.cosmicWeb.visible).toBe(false);

    composer.dispose();
  });

  it('reacts to a regime transition (solar_system → cosmic)', () => {
    const handles = makeHandles();
    const composer = new DefaultSceneComposer({ handles });

    useCameraStore.setState({ scaleRegime: 'cosmic' });

    expect(handles.solarSystem.visible).toBe(false);
    expect(handles.galaxyGallery.visible).toBe(true);
    expect(handles.cosmicWeb.visible).toBe(true);
    expect(handles.cmbBoundary.visible).toBe(true);
    expect(handles.largeScaleStructure.visible).toBe(true);

    composer.dispose();
  });

  it('reacts to a mode change (exploration → education)', () => {
    const handles = makeHandles();
    useCameraStore.setState({ scaleRegime: 'stellar' });
    const composer = new DefaultSceneComposer({ handles });
    expect(handles.starTileField.visible).toBe(true);
    expect(handles.starField.visible).toBe(true);

    useModeStore.setState({ activeMode: 'education' });

    // Education mode hides the Gaia tile pyramid regardless of regime.
    expect(handles.starTileField.visible).toBe(false);
    // Education mode also hides the decorative starField (curated view).
    expect(handles.starField.visible).toBe(false);
    // But the curated layers (solar system, constellations) stay.
    expect(handles.solarSystem.visible).toBe(true);
    expect(handles.constellations.visible).toBe(true);

    composer.dispose();
  });

  it('gates constellations on the uiStore HUD toggle', () => {
    const handles = makeHandles();
    useUIStore.setState({ showConstellationLines: true });
    const composer = new DefaultSceneComposer({ handles });
    expect(handles.constellations.visible).toBe(true);

    useUIStore.setState({ showConstellationLines: false });
    expect(handles.constellations.visible).toBe(false);

    useUIStore.setState({ showConstellationLines: true });
    expect(handles.constellations.visible).toBe(true);

    composer.dispose();
  });

  it('stops reacting after dispose()', () => {
    const handles = makeHandles();
    const composer = new DefaultSceneComposer({ handles });
    composer.dispose();

    useCameraStore.setState({ scaleRegime: 'cosmic' });
    // Still at solar_system visibility — composer unsubscribed.
    expect(handles.galaxyGallery.visible).toBe(false);
    expect(handles.solarSystem.visible).toBe(true);
  });

  it('skips missing handles silently', () => {
    const partial: SceneLayerHandles = {
      solarSystem: { visible: false },
      // galaxyGallery intentionally omitted
    };
    const composer = new DefaultSceneComposer({ handles: partial });

    useCameraStore.setState({ scaleRegime: 'cosmic' });

    expect(partial.solarSystem?.visible).toBe(false);
    expect(partial.galaxyGallery).toBeUndefined();

    composer.dispose();
  });

  it('P1 — solar_system default view hides decorative starField and nebula test fixture', () => {
    // Regression guard for the "unrelated entities appearing in Sun view"
    // bug. Neither the 5K-point decorative starfield (radius 10–80u) nor
    // the 14-cube NebulaGalleryRenderer test fixture (±35u at Z=-40) may
    // render while the camera is in the solar-system regime, since both
    // overlap the inner-planet volume.
    const handles = makeHandles();
    useCameraStore.setState({ scaleRegime: 'solar_system' });
    useModeStore.setState({ activeMode: 'exploration' });

    const composer = new DefaultSceneComposer({ handles });

    expect(handles.starField.visible).toBe(false);
    expect(handles.nebulaGallery.visible).toBe(false);

    // Zooming out to stellar turns the background starField back on as the
    // pre-Gaia-tile placeholder; nebula fixture stays off (production
    // nebula tiles land in T45/T46).
    useCameraStore.setState({ scaleRegime: 'stellar' });
    expect(handles.starField.visible).toBe(true);
    expect(handles.nebulaGallery.visible).toBe(false);

    composer.dispose();
  });

  it('guided_tour mode is a pass-through (same visibility as exploration)', () => {
    const handles = makeHandles();
    const composer = new DefaultSceneComposer({ handles });
    const snapshotKeys = Object.keys(handles) as SceneLayer[];
    const baseVisibility: Record<string, boolean> = {};
    for (const key of snapshotKeys) {
      baseVisibility[key] = handles[key].visible;
    }

    useModeStore.setState({ activeMode: 'guided_tour' });

    for (const key of snapshotKeys) {
      expect(handles[key].visible).toBe(baseVisibility[key]);
    }

    composer.dispose();
  });
});
