/**
 * T50 — Unified universe scene composer.
 *
 * Replaces the old `?demo=X` exclusive galleries with ONE canonical scene that
 * mounts every content layer and then drives per-layer visibility from the
 * active scale regime (Doc 19 §Scale Transitions, Doc 27 §9) crossed with the
 * active application mode (Doc 20 §Mode-Specific Content Filters).
 *
 * The composer is a pure visibility router: it does NOT construct renderers.
 * The owning {@link SceneManager} still does all the GPU allocation; this
 * class just subscribes to the two Zustand stores that decide whether a given
 * renderer's group should draw this frame.
 *
 * Visibility rule:
 *
 *   visible(layer) = regimeAllows(layer, regime) ∧ modeAllows(layer, mode)
 *
 * The `guided_tour` mode is treated as a pass-through — the TourEngine
 * already drives the camera + layer visibility for scripted waypoints, so
 * the composer leaves whatever it last wrote alone (applying Exploration's
 * visibility as the tour's backdrop).
 */

import { useCameraStore } from '@/stores/cameraStore';
import { useModeStore } from '@/stores/modeStore';
import type { AppMode, ScaleRegime } from '@/stores/types';
import { useUIStore } from '@/stores/uiStore';

/** Layer keys — one per renderer whose visibility the composer manages. */
export type SceneLayer =
  | 'solarSystem'
  | 'starField'
  | 'starTileField'
  | 'nebulaGallery'
  | 'galaxyGallery'
  | 'cosmicWeb'
  | 'cmbBoundary'
  | 'largeScaleStructure'
  | 'milkyWayInterior'
  | 'constellations'
  // Museum-showcase galleries (hardcoded 1-D layouts at fixed z-offsets).
  // Until Phase 2 grounds them in real 3D positions, they must be hidden in
  // solar_system regime — otherwise every flat-line gallery z=-2042..-7500
  // renders on top of the inner solar system and produces the "everything
  // clustered together" visual.
  | 'planetGallery'
  | 'moonGallery'
  | 'starTypeGallery'
  | 'phenomenaGallery'
  | 'exoplanetGallery'
  | 'exoticGallery';

/** Anything with a `visible` boolean — covers `THREE.Object3D` derivatives. */
export interface VisibilityHandle {
  visible: boolean;
}

/**
 * Regime visibility matrix (T50 spec §Scene composition per regime).
 *
 * - **Solar System** (< 500 AU): solar system + MW interior band + constellations.
 *   The decorative `starField` (5K random points at 10–80u) and the 14-cube
 *   `nebulaGallery` test fixture (±35u wide at Z=-40) are HIDDEN here — both
 *   mesh into the solar-system volume (Neptune ~360u at orbitScale=12) and
 *   produced the "unrelated entities" complaint in the default view. Galaxies,
 *   cosmic web, CMB, and LSS stay hidden for the same reason.
 * - **Stellar** (500 AU–1 kpc): star tiles stream in; `starField` turns on as
 *   the pre-tile placeholder catalogue. Solar system still drawn for a smooth
 *   zoom-out handoff; MW band remains. Nebula gallery stays off — it's a
 *   test fixture, not positioned nebulae (see NebulaGalleryRenderer docstring).
 * - **Galactic** (1 kpc–1 Mpc): star tiles + galaxy tiles overlap. Solar system
 *   drops out. MW interior self-dissolves via its own regime listener.
 * - **Cosmic** (> 1 Mpc): galaxy tiles + cosmic-web scaffold + LSS + CMB sphere.
 *   Stars invisible (Gaia tile pyramid culled by regime filter).
 */
const REGIME_VISIBILITY: Record<ScaleRegime, ReadonlySet<SceneLayer>> = {
  solar_system: new Set<SceneLayer>([
    'solarSystem',
    'milkyWayInterior',
    'constellations',
    // NOTE: no museum-showcase galleries here. They live at z=-2042..-7500
    // world units, which at orbitScale=12 overlaps inner-planet space.
  ]),
  stellar: new Set<SceneLayer>([
    'solarSystem',
    'starField',
    'starTileField',
    'milkyWayInterior',
    'constellations',
    // Stellar-scale showcases — surfaced once the camera leaves the solar
    // system. Their flat-line layouts still aren't physically accurate but
    // they no longer collide with the solar system in this regime.
    'starTypeGallery',
    'exoplanetGallery',
    'exoticGallery',
    'phenomenaGallery',
  ]),
  galactic: new Set<SceneLayer>([
    'starTileField',
    'galaxyGallery',
    'milkyWayInterior',
    'phenomenaGallery',
    'exoticGallery',
  ]),
  cosmic: new Set<SceneLayer>([
    'galaxyGallery',
    'cosmicWeb',
    'cmbBoundary',
    'largeScaleStructure',
  ]),
};

/**
 * Mode filter matrix (Doc 20 §Mode-Specific Content Filters).
 *
 * A layer listed here is permitted in that mode. Layers not listed are
 * hidden even when the regime would otherwise show them.
 *
 * - **Exploration / Research**: everything allowed (full unrestricted scene).
 * - **Education**: curated subset. Star tile pyramid is OFF (1.8 B Gaia stars
 *   overwhelm new learners; the Hipparcos bright subset still renders via the
 *   constellation overlay). Cosmic web + LSS are also off — too abstract for
 *   the persona.
 * - **Observation**: "from Earth at current date" view. Cosmic-scale layers
 *   (galaxies gallery, cosmic web, CMB, LSS) are hidden; only things visible
 *   to a naked-eye observer remain. Sun-glare cone-cull is a T53 follow-up.
 * - **Guided Tour**: pass-through — the TourEngine owns camera + visibility
 *   for scripted waypoints. Composer treats it as Exploration.
 */
const MODE_VISIBILITY: Record<AppMode, ReadonlySet<SceneLayer>> = {
  exploration: ALL_LAYERS(),
  research: ALL_LAYERS(),
  education: new Set<SceneLayer>([
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
  // Observation = naked-eye from Earth. Showcase galleries are not naked-eye
  // phenomena, so they are always hidden here regardless of regime.
  observation: new Set<SceneLayer>([
    'solarSystem',
    'starField',
    'starTileField',
    'nebulaGallery',
    'milkyWayInterior',
    'constellations',
  ]),
  guided_tour: ALL_LAYERS(),
};

function ALL_LAYERS(): ReadonlySet<SceneLayer> {
  return new Set<SceneLayer>([
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
  ]);
}

export function isLayerVisible(
  layer: SceneLayer,
  regime: ScaleRegime,
  mode: AppMode,
): boolean {
  return (
    REGIME_VISIBILITY[regime].has(layer) && MODE_VISIBILITY[mode].has(layer)
  );
}

export type SceneLayerHandles = Partial<Record<SceneLayer, VisibilityHandle | null>>;

export interface DefaultSceneComposerOptions {
  /** Renderer handles. Missing keys are skipped silently. */
  handles: SceneLayerHandles;
  /**
   * Override for the initial regime read. When omitted, the composer reads
   * {@link useCameraStore} at construction. Useful for tests that want the
   * composer to pin a specific regime before the store is touched.
   */
  initialRegime?: ScaleRegime;
  /** Same idea for the initial mode (defaults to `useModeStore` value). */
  initialMode?: AppMode;
}

/**
 * Pure visibility router. Cheap to construct; the two `subscribe` calls are
 * flat-cost per regime/mode change and the `apply()` path touches one boolean
 * per renderer handle.
 */
export class DefaultSceneComposer {
  private readonly handles: SceneLayerHandles;
  private regime: ScaleRegime;
  private mode: AppMode;
  /** Doc 22 HUD toggle — user's manual constellation-line preference. */
  private constellationLinesEnabled: boolean;

  private readonly unsubscribers: Array<() => void> = [];
  private disposed = false;

  constructor(options: DefaultSceneComposerOptions) {
    this.handles = options.handles;
    this.regime =
      options.initialRegime ?? useCameraStore.getState().scaleRegime;
    this.mode = options.initialMode ?? useModeStore.getState().activeMode;
    this.constellationLinesEnabled =
      useUIStore.getState().showConstellationLines;

    // Apply the initial visibility before subscribing so the first drawn
    // frame already reflects regime × mode without waiting for a store
    // transition.
    this.apply();

    this.unsubscribers.push(
      useCameraStore.subscribe((state, prev) => {
        if (state.scaleRegime === prev.scaleRegime) return;
        this.regime = state.scaleRegime;
        this.apply();
      }),
    );
    this.unsubscribers.push(
      useModeStore.subscribe((state, prev) => {
        if (state.activeMode === prev.activeMode) return;
        this.mode = state.activeMode;
        this.apply();
      }),
    );
    this.unsubscribers.push(
      useUIStore.subscribe((state, prev) => {
        if (state.showConstellationLines === prev.showConstellationLines) return;
        this.constellationLinesEnabled = state.showConstellationLines;
        this.apply();
      }),
    );
  }

  /** Current regime being applied. Exposed for tests + telemetry. */
  get currentRegime(): ScaleRegime {
    return this.regime;
  }

  /** Current mode being applied. */
  get currentMode(): AppMode {
    return this.mode;
  }

  /**
   * Force-recompute visibility. Useful after mutating `handles` externally
   * (test harnesses that attach a renderer post-construction) or when the
   * caller wants to resync without waiting on a store change.
   */
  apply(): void {
    if (this.disposed) return;
    for (const key of Object.keys(this.handles) as SceneLayer[]) {
      const handle = this.handles[key];
      if (!handle) continue;
      let visible = isLayerVisible(key, this.regime, this.mode);
      // Doc 22 universal HUD toggle: constellation lines also respect the
      // `uiStore.showConstellationLines` flag. The composer is the single
      // writer of `constellations.group.visible`, so combining here keeps
      // the behaviour consistent (no "last writer wins" flicker between
      // the composer and a separate store listener).
      if (key === 'constellations' && !this.constellationLinesEnabled) {
        visible = false;
      }
      handle.visible = visible;
    }
  }

  /** Test seam: pin the regime without going through cameraStore. */
  setRegime(regime: ScaleRegime): void {
    if (this.regime === regime) return;
    this.regime = regime;
    this.apply();
  }

  /** Test seam: pin the mode without going through modeStore. */
  setMode(mode: AppMode): void {
    if (this.mode === mode) return;
    this.mode = mode;
    this.apply();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const unsub of this.unsubscribers) {
      try {
        unsub();
      } catch {
        // best-effort — a throwing unsubscribe shouldn't abort disposal.
      }
    }
    this.unsubscribers.length = 0;
  }
}
