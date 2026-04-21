import type { TileManifestStarEntry } from '@cosmos/tile-decoder';
import * as THREE from 'three';


import {
  CosmosWebSocket,
  fetchManifest,
  type CosmosWebSocketOptions,
  type WsDataVersionUpdateMessage,
  type WsEphemerisPushMessage,
} from '@/api';
import { entityDataByNaif, entityPreviewByNaif } from '@/data/bodyToEntity';
import { bodyById } from '@/data/solarSystemCatalog';
import { IAU_NAMED_STARS } from '@/data/constellations';
import { generateStarSeed, type StarAnchor } from '@/data/starSeed';
import { useCameraStore } from '@/stores/cameraStore';
import { useModeStore } from '@/stores/modeStore';
import { useSelectionStore } from '@/stores/selectionStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTileStore } from '@/stores/tileStore';
import { useTimeStore } from '@/stores/timeStore';
import type { TileAddress } from '@/stores/types';
import { useUIStore } from '@/stores/uiStore';

import { BlackHoleLensingPass } from './BlackHoleLensingPass';
import { CameraController } from './CameraController';
import { CmbBoundarySphere, type CmbBoundarySphereOptions } from './CmbBoundarySphere';
import {
  ConstellationRenderer,
  type ConstellationRendererOptions,
} from './ConstellationRenderer';
import { DefaultSceneComposer, type SceneLayerHandles } from './DefaultSceneComposer';
import {
  CosmicWebRenderer,
  DEFAULT_COSMIC_WEB,
  type CosmicWebRendererOptions,
} from './CosmicWebRenderer';
import { EntityLabelOverlay } from './EntityLabelOverlay';
import {
  LargeScaleStructureRenderer,
  type LargeScaleStructureRendererOptions,
} from './LargeScaleStructureRenderer';
import { registerEngineBridge } from './engineBridge';
import { EphemerisSampler, type EphemerisSamplerEvent } from './EphemerisSampler';
import {
  ExoticGalleryRenderer,
  type ExoticGalleryOptions,
} from './ExoticGalleryRenderer';
import { approachDistanceForRadius } from './FlyToAnimator';
import { SearchTargetMarker } from './SearchTargetMarker';
import {
  GalaxyGalleryRenderer,
  type GalaxyGalleryOptions,
} from './GalaxyGalleryRenderer';
import { probeGpu, type GpuProbe, type GpuTier } from './gpuDetection';
import type { GpuLifecycleHook } from './gpuLifecycle';
import {
  MilkyWayInteriorComposer,
  type MilkyWayInteriorOptions,
} from './MilkyWayInteriorComposer';
import {
  MoonGalleryRenderer,
  type MoonGalleryOptions,
} from './MoonGalleryRenderer';
import {
  NebulaGalleryRenderer,
  type NebulaGalleryOptions,
} from './NebulaGalleryRenderer';
import {
  PerformanceMonitor,
  qualityToAsteroidFraction,
  qualityToGpuTier,
  shouldBypassPostProcessing,
  type PerformanceSnapshot,
  type QualityLevel,
} from './performanceMonitor';
import { PickingController } from './PickingController';
import { PlanetGalleryRenderer } from './PlanetGalleryRenderer';
import {
  DEFAULT_FEATURES,
  PostProcessingChain,
  type PostProcessingFeatureFlags,
} from './PostProcessingChain';
import {
  ScaleRegimeController,
  type RegimeTransition,
  type ScaleRegimeControllerOptions,
} from './ScaleRegimeController';
import type { AppMode, ScaleRegime } from '@/stores/types';

/**
 * P4 — base WASD translation speed (units/sec) per regime. The solar-system
 * view spans ±360 scene units at `orbitScale=12`; galactic spans ~1e9; so a
 * constant `moveSpeed` either crawls through galactic space or teleports
 * past planets. Values picked so that ~4 seconds of held-W traverses ~¼ of
 * the regime's visible volume at its default camera distance.
 */
const REGIME_MOVE_SPEED: Record<ScaleRegime, number> = {
  solar_system: 20,       // ~ 360u box → traverse in ~18s at steady state
  stellar: 2_000,         // ~ 50k u box
  galactic: 200_000,      // ~ 5M u at Galactic scale
  cosmic: 2_000_000,      // ~ 100M+ u; shift key still multiplies by 5
};

/**
 * P4 — per-regime safe camera distance ceiling to protect float32 vertex
 * precision. Float32 holds ~7 decimal digits, so positions > 1e7 units lose
 * sub-unit detail; > 1e10 loses > 1000-unit detail (visible jitter on
 * galaxy billboards). Clamp the orbit radius so the user can't accidentally
 * wheel-zoom out into precision-loss territory.
 *
 * Each regime's ceiling is chosen to comfortably contain the farthest real
 * catalog entry at {@link DEFAULT_SCENE_SCALE} × some headroom:
 *   solar_system: Pluto ~470u, stellar-boundary hysteresis max ~7.6k u → 1e5
 *   stellar     : Hipparcos bright max ~400k u (Deneb @ 802 pc) → 1e6
 *   galactic    : Local Group max ~5e6 u (Triangulum 840 kpc) → 1e9
 *   cosmic      : CMB boundary ~7e9 u (14.26 Gpc) → 2e10
 */
/**
 * P2C — map an ICRS distance (parsecs) to a scene-space target distance for
 * deep-sky fly-to inside the single-scale solar_system regime.
 *
 * Below 120 pc we use the star-seed's true stellar scale (500 u/pc) so the
 * camera lands right among the IAU-named bright stars at the correct depth.
 * Beyond 120 pc we log-compress into [60k, 90k] u so any object — from Sgr
 * A* (8.2 kpc) to the Coma Cluster (100 Mpc) — stays inside the regime's
 * camera clamp (`1e5`) while preserving monotonic ordering: farther objects
 * always land farther from the Sun in scene units.
 *
 * `distancePc = null` (constellation centroids, unknown distance) returns
 * the near/far boundary — 60 000 u — which reads as "a point on the sky"
 * without pretending to a specific depth.
 *
 * Exported for unit tests; prefer {@link SceneManager.flyToCelestialCoord}
 * in application code.
 */
export function celestialDistanceToSceneUnits(distancePc: number | null): number {
  const STELLAR_UNITS_PER_PC = 500;
  const NEAR_PC_CAP = 120;                                // stars within ~400 ly stay 1:1 in scene
  const NEAR_SCENE = NEAR_PC_CAP * STELLAR_UNITS_PER_PC;  // 60 000 u
  const FAR_SCENE = 90_000;                               // extragalactic marker ceiling
  const FAR_PC_CAP = 1_000_000_000;                       // Gpc-scale clamp (~14 Gly)
  if (distancePc == null || !Number.isFinite(distancePc) || distancePc <= 0) {
    return NEAR_SCENE;
  }
  if (distancePc <= NEAR_PC_CAP) {
    return distancePc * STELLAR_UNITS_PER_PC;
  }
  // Log-compress (NEAR_PC_CAP, FAR_PC_CAP] → (NEAR_SCENE, FAR_SCENE].
  const t = Math.log10(distancePc / NEAR_PC_CAP) /
            Math.log10(FAR_PC_CAP / NEAR_PC_CAP);
  const clamped = Math.max(0, Math.min(1, t));
  return NEAR_SCENE + clamped * (FAR_SCENE - NEAR_SCENE);
}

const REGIME_MAX_DISTANCE: Record<ScaleRegime, number> = {
  solar_system: 1e5,
  stellar: 1e6,
  galactic: 1e9,
  cosmic: 2e10,
};

const REGIME_MIN_DISTANCE: Record<ScaleRegime, number> = {
  solar_system: 0.001,
  stellar: 1,
  galactic: 100,
  cosmic: 10_000,
};

/**
 * P4 — moon-orbit display multiplier per UI mode. Doc 23 §3.3 mandates
 * strict 1:1 km scale ("true scale"); Doc 22 readability pushes back so
 * Luna isn't invisible 60 Earth-radii away. Research persona tolerates
 * the realism; the rest default to the educational 6× inflation.
 */
const MODE_MOON_ORBIT_SCALE: Record<AppMode, number> = {
  exploration: 6,
  education: 6,
  observation: 6,
  research: 60,           // Doc 23 §3.3 — Luna at 60 R_earth
  guided_tour: 6,
};
import { createProceduralSkybox } from './Skybox';
import { SolarSystemRenderer } from './SolarSystemRenderer';
import { ExoplanetGalleryRenderer } from './ExoplanetGalleryRenderer';
import { PhenomenaGalleryRenderer } from './PhenomenaGalleryRenderer';
import { StarFieldRenderer } from './StarFieldRenderer';
import { StarTypeGalleryRenderer } from './StarTypeGalleryRenderer';
import { StarTileRenderer, type StarTileRendererOptions } from './StarTileRenderer';
import { TileStreamingManager, tilePriorityHintsFromWsUrls, type TileStreamingManagerOptions } from './TileStreamingManager';
import { TimeEngine } from './TimeEngine';
import { TourEngine } from './TourEngine';

/**
 * SceneManager bootstraps Three.js r184 with the hard requirements from
 * Doc 10 §3, Doc 27 §6, and CLAUDE.md §Critical Rules #6:
 *
 * - WebGL 2.0 context (no WebGL 1 fallback).
 * - Logarithmic depth buffer enabled at construction (required at all times).
 * - HDR render target (Float16) so the T30 post-processing chain can feed on
 *   linear light values.
 * - Resize observer wired to the canvas element.
 * - rAF loop exposes a `onFrame` callback; engine writes hot state via
 *   `useCameraStore.getState()` (Doc 27 §6.4) — not yet hooked up, but the
 *   stubbed frame callback keeps the wiring testable.
 * - Performance monitor drives adaptive quality per Doc 27 §14.3.
 */

export interface SceneManagerOptions {
  /** Optional override for GPU tier (skips probing, useful in tests). */
  gpuTierOverride?: GpuTier;
  /** Callback invoked before each `renderer.render(scene, camera)`. */
  onFrame?: (deltaMs: number, elapsedMs: number) => void;
  /** Callback fired whenever adaptive quality changes. */
  onQualityChange?: (next: QualityLevel) => void;
  /** Number of stars to seed the field with. Default 5000. */
  starCount?: number;
  /** Milliseconds before an unrecovered context loss becomes a user error. */
  contextLossTimeoutMs?: number;
  /**
   * Show the Doc 18 planet gallery (T13 visual verification fixture). Disabled
   * by default so production boot still lands on the star field; the dev UI
   * toggles it via `?demo=planets`.
   */
  showPlanetGallery?: boolean;
  /**
   * Planet-gallery layout. 'solar' (default) mirrors T13 (8-planet row).
   * 'all27' renders every Doc 17 subtype on a 6-wide grid — set via
   * `?demo=planets-all27` for T42 visual QA.
   */
  planetGalleryMode?: 'solar' | 'all27';
  /**
   * Show the Doc 23 §8 solar-system renderer (T14). Planets orbit at
   * accelerated time; also drives the `?demo=solarsystem` URL flag.
   */
  showSolarSystem?: boolean;
  /**
   * Attach the T21 live-ephemeris sampler to the solar-system renderer.
   * Default `true` — the renderer will pull SPICE-backed positions from
   * `/ephemeris/range/{naifId}` when the backend is reachable and fall
   * back to local Kepler otherwise. Set `false` to run Kepler-only (tests
   * that do not want network traffic or HTTP mocking plumbed through).
   */
  useLiveEphemeris?: boolean;
  /**
   * T22 — construct the {@link CosmosWebSocket} manager. Default `true`.
   * The manager is built but does *not* auto-connect; the scene needs a
   * session token / login flow before dialling out. Set `false` for tests
   * that don't want the manager at all.
   */
  attachWebSocket?: boolean;
  /**
   * T22 — pass through ctor options for the WS manager (URL override,
   * session token, factory, heartbeat timing). Ignored when
   * `attachWebSocket === false`.
   */
  webSocketOptions?: CosmosWebSocketOptions;
  /**
   * T22 — if `true` and a session is configured, call `connect()` on the
   * WebSocket manager immediately after construction. Default `false`
   * because dev without a live backend produces a noisy reconnect loop.
   */
  autoConnectWebSocket?: boolean;
  /**
   * T23 — attach the {@link TileStreamingManager}. Default `true`. When on,
   * the WebSocket's `tile_priority` frames are routed into the streaming
   * queue automatically. Set `false` for tests that don't need the pipeline
   * wired (and don't want the Dexie IDB adapter probed).
   */
  attachTileStreaming?: boolean;
  /**
   * T23 — options forwarded to the {@link TileStreamingManager} constructor
   * (fetcher override, disk cache override, concurrency cap, decode hooks).
   */
  tileStreamingOptions?: TileStreamingManagerOptions;
  /**
   * T25 — options forwarded to the {@link ScaleRegimeController}. Useful
   * for tests that want to pin to a specific regime at construction or
   * shrink the thresholds for a preview smoke without a real AU-scale
   * fly-out.
   */
  scaleRegimeOptions?: ScaleRegimeControllerOptions;
  /**
   * T25 — scene units per AU (Doc 27 §5.1 unit note). Matches the renderer's
   * `orbitScale` so `camera.position.length() / sceneUnitsPerAU` gives the
   * physical distance from the Sun in AU. Default 12 (SolarSystemRenderer).
   */
  sceneUnitsPerAU?: number;
  /** T25 — fires after a regime transition (preview smoke / telemetry). */
  onRegimeChanged?: (transition: RegimeTransition) => void;
  /**
   * T26 — boot with the streaming star-field pipeline active. Construct
   * a {@link StarTileRenderer}, fetch `/v1/tiles/manifest`, and enqueue
   * every star tile through the {@link TileStreamingManager}. Requires
   * `attachTileStreaming !== false`. Default `false` — solar-system
   * demos don't want the tile fetcher reaching out.
   */
  attachStarTileStreaming?: boolean;
  /**
   * T26 — options forwarded to the {@link StarTileRenderer}. Most useful
   * for tuning `sceneUnitsPerPc`, the colour palette's quality tier, or
   * the renderer's group name for dev-tools walks.
   */
  starTileRendererOptions?: StarTileRendererOptions;
  /**
   * T26 — fires after the manifest has been fetched + the tile queue has
   * been populated. Preview smoke uses this as a ready signal.
   */
  onStarTileManifestReady?: (entries: ReadonlyArray<TileManifestStarEntry>) => void;
  /**
   * T27 — show the Doc 18 nebula gallery. Drives `?demo=nebulae` through
   * {@link CosmosCanvas}. Disabled by default so production boot still
   * lands on the star field.
   */
  showNebulaGallery?: boolean;
  /** T27 — options forwarded to the {@link NebulaGalleryRenderer}. */
  nebulaGalleryOptions?: NebulaGalleryOptions;
  /**
   * T43 — show the Doc 18 moon gallery (15 subtypes across 6 families).
   * Drives `?demo=moons` through {@link CosmosCanvas}. Disabled by default.
   */
  showMoonGallery?: boolean;
  /** T43 — options forwarded to the {@link MoonGalleryRenderer}. */
  moonGalleryOptions?: MoonGalleryOptions;
  /**
   * T28 — show the Doc 18 exotic-object gallery (black hole, pulsar,
   * magnetar). Drives `?demo=exotic` through {@link CosmosCanvas}.
   * Disabled by default.
   */
  showExoticGallery?: boolean;
  /** T28 — options forwarded to the {@link ExoticGalleryRenderer}. */
  exoticGalleryOptions?: ExoticGalleryOptions;
  /**
   * T29 — show the Doc 18 galaxy gallery (spiral, elliptical, irregular,
   * lenticular). Drives `?demo=galaxies` through {@link CosmosCanvas}.
   * Disabled by default.
   */
  showGalaxyGallery?: boolean;
  /** T29 — options forwarded to the {@link GalaxyGalleryRenderer}. */
  galaxyGalleryOptions?: GalaxyGalleryOptions;
  /**
   * T29 — mount the cosmic-web filament/void scaffolding. Drives
   * `?demo=cosmicweb` through {@link CosmosCanvas}.
   */
  showCosmicWeb?: boolean;
  /** T29 — options forwarded to the {@link CosmicWebRenderer}. Falls back
   *  to {@link DEFAULT_COSMIC_WEB} when omitted. */
  cosmicWebOptions?: CosmicWebRendererOptions;
  /**
   * T29 — attach the Doc 17 ENT-7040 CMB boundary sphere to the scene.
   * Independently toggleable from `showCosmicWeb` so the sphere can ride
   * alongside the star-tile stream or the galaxy gallery.
   */
  showCmbBoundary?: boolean;
  /** T29 — options forwarded to {@link CmbBoundarySphere}. */
  cmbBoundaryOptions?: CmbBoundarySphereOptions;
  /**
   * T47 — mount the {@link LargeScaleStructureRenderer} gallery (Doc 17
   * §7010..7033). Drives `?demo=lss` through {@link CosmosCanvas}. Disabled
   * by default. Ships alongside the existing cosmic-web + CMB boundary
   * so all three can be inspected together when the caller opts in.
   */
  showLargeScaleStructure?: boolean;
  /** T47 — options forwarded to {@link LargeScaleStructureRenderer}. */
  largeScaleStructureOptions?: LargeScaleStructureRendererOptions;
  /**
   * T46a — mount the {@link MilkyWayInteriorComposer} (MW band + dust lanes +
   * zodiacal light + gegenschein). Visible at Solar System + Stellar
   * regimes, dissolves across the 800..1000 pc hysteresis band (Doc 19
   * §Scale Transitions). Disabled by default; drives `?demo=mw-interior`
   * through {@link CosmosCanvas}.
   */
  showMilkyWayInterior?: boolean;
  /** T46a — options forwarded to {@link MilkyWayInteriorComposer}. */
  milkyWayInteriorOptions?: MilkyWayInteriorOptions;
  /**
   * T30 — enable the post-processing chain (bloom, ACES tone-map, FXAA,
   * chromatic aberration, film grain, vignette, CRT scanlines + the
   * Schwarzschild gravitational-lensing pass). Default `true`: the chain
   * is cheap enough on mid-tier GPUs and the whole scene aesthetic
   * (Doc 18 §3.5, Doc 24 §3.5) depends on it. Tests that want to assert
   * on raw rendered frames can set this to `false`.
   */
  attachPostProcessing?: boolean;
  /**
   * T30 — per-feature override for the post chain. Individual booleans
   * take precedence over {@link useSettingsStore} values at construction.
   */
  postProcessingFeatures?: Partial<PostProcessingFeatureFlags>;
  /**
   * T32 — attach the {@link TourEngine} that turns guided-tour step changes
   * in `modeStore` into fly-to commands. Default `true`. Tests that assert
   * on `modeStore` transitions without the fly-to side effect set this to
   * `false`.
   */
  attachTourEngine?: boolean;
  /**
   * T49 — mount the {@link ConstellationRenderer} (88 IAU asterism figures
   * + IAU WGSN-approved star name labels). Drives `?demo=constellations`
   * through {@link CosmosCanvas} and is default-off outside explicit
   * opt-in; visibility is additionally gated by `uiStore.showConstellationLines`.
   */
  showConstellations?: boolean;
  /** T49 — options forwarded to {@link ConstellationRenderer}. */
  constellationOptions?: ConstellationRendererOptions;
  /**
   * T50 — attach the {@link DefaultSceneComposer} that toggles per-renderer
   * visibility based on `cameraStore.scaleRegime` crossed with
   * `modeStore.activeMode` (Doc 19 §Scale Transitions × Doc 20 §Mode-Specific
   * Content Filters). Default `true`. When `false`, every mounted renderer
   * stays visible at all times — useful for single-layer demo fixtures that
   * want to see their content without the regime gate culling it.
   */
  attachDefaultScene?: boolean;
  /**
   * T49 — DOM parent the {@link EntityLabelOverlay} will attach its
   * CSS2DRenderer element to. Defaults to the canvas's `parentElement`
   * at construction time. Tests that want the label overlay mounted
   * without a DOM tree can pass `null` to skip the attach step.
   */
  labelOverlayParent?: HTMLElement | null;
}

// GpuLifecycleHook lives in ./gpuLifecycle so the post-processing chain +
// lensing pass can import the type without pulling SceneManager into the
// cycle. Re-export here for backwards-compat with existing consumers.
export type { GpuLifecycleHook };

export class SceneManager {
  readonly canvas: HTMLCanvasElement;
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly hdrTarget: THREE.WebGLRenderTarget;
  readonly performance: PerformanceMonitor;
  readonly controls: CameraController;
  readonly starField: StarFieldRenderer;
  readonly timeEngine: TimeEngine;
  readonly planetGallery: PlanetGalleryRenderer | null;
  readonly moonGallery: MoonGalleryRenderer | null;
  readonly nebulaGallery: NebulaGalleryRenderer | null;
  readonly exoticGallery: ExoticGalleryRenderer | null;
  readonly galaxyGallery: GalaxyGalleryRenderer | null;
  readonly starTypeGallery: StarTypeGalleryRenderer;
  readonly phenomenaGallery: PhenomenaGalleryRenderer;
  readonly exoplanetGallery: ExoplanetGalleryRenderer;
  readonly cosmicWeb: CosmicWebRenderer | null;
  readonly cmbBoundary: CmbBoundarySphere | null;
  readonly largeScaleStructure: LargeScaleStructureRenderer | null;
  readonly milkyWayInterior: MilkyWayInteriorComposer | null;
  readonly solarSystem: SolarSystemRenderer | null;
  readonly ephemerisSampler: EphemerisSampler | null;
  readonly webSocket: CosmosWebSocket | null;
  readonly tileStreaming: TileStreamingManager | null;
  readonly starTileField: StarTileRenderer | null;
  readonly scaleRegime: ScaleRegimeController;
  readonly picking: PickingController;
  readonly postProcessing: PostProcessingChain | null;
  readonly blackHoleLensing: BlackHoleLensingPass | null;
  readonly tourEngine: TourEngine | null;
  readonly labelOverlay: EntityLabelOverlay | null;
  readonly constellations: ConstellationRenderer | null;
  /** T50 — regime × mode visibility router. `null` when opted out. */
  readonly defaultSceneComposer: DefaultSceneComposer | null;
  /**
   * P2E — ephemeral marker spawned by deep-sky fly-to so the user sees a
   * visible target at the computed scene position (galaxy / nebula /
   * exotic catalogs render at raw Mpc scales that the current regime
   * doesn't frame). Replaced on every new search, cleared on explicit
   * cancel.
   */
  private searchTargetMarker: SearchTargetMarker | null = null;

  readonly gpu: GpuProbe | null;

  private readonly options: SceneManagerOptions;
  private readonly timer: THREE.Timer;
  private readonly resizeObserver: ResizeObserver | null;
  private readonly onVisibilityChange = (): void => {
    if (document.hidden) this.stop();
    else this.start();
  };

  private rafId: number | null = null;
  private lastQuality: QualityLevel = 'ultra';
  private disposed = false;
  /** P3 — 4-frame cadence counter for star-tile frustum/priority updates. */
  private tileCullCounter = 0;
  /** P3 — scratch frustum + projection matrix reused across tile culling. */
  private readonly tileCullFrustum = new THREE.Frustum();
  private readonly tileCullMatrix = new THREE.Matrix4();
  private unregisterEngineBridge: (() => void) | null = null;

  private contextLost = false;
  private contextLossTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly gpuHooks: GpuLifecycleHook[] = [];

  /**
   * T26 — map of tile address → absolute centre (parsecs). Populated from
   * the manifest fetch; consumed inside the `onTileLoaded` callback so the
   * StarTileRenderer can offset the record-relative positions correctly.
   */
  private readonly starTileCentres = new Map<TileAddress, { x: number; y: number; z: number }>();
  private starTileBootstrapAbort: AbortController | null = null;

  /** T49 — unsubscribe for the uiStore constellation-visibility listener. */
  private constellationVisibilityUnsub: (() => void) | null = null;
  /** P4 — unsubscribe for the modeStore moon-orbit-scale listener. */
  private modeMoonScaleUnsub: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement, options: SceneManagerOptions = {}) {
    this.canvas = canvas;
    this.options = options;

    // --- WebGL 2 context check ---
    const glContext =
      canvas.getContext('webgl2', {
        alpha: false,
        antialias: false,
        depth: true,
        stencil: false,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
      }) ?? null;

    if (!glContext) {
      throw new Error(
        'Cosmos Explorer requires WebGL 2.0; this browser did not return a webgl2 context.',
      );
    }

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      context: glContext,
      logarithmicDepthBuffer: true, // CLAUDE.md Critical Rule #6
      powerPreference: 'high-performance',
      antialias: false, // FXAA runs in post (Doc 10 §3)
      alpha: false,
      stencil: false,
      depth: true,
      preserveDrawingBuffer: false,
    });

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping; // tone mapping happens in post
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const { width, height } = this.measureCanvas();
    this.renderer.setSize(width, height, false);

    // --- GPU tier detection ---
    if (options.gpuTierOverride) {
      this.gpu = {
        tier: options.gpuTierOverride,
        vendor: null,
        renderer: null,
        maxTextureSize: 0,
        reason: 'override',
      };
    } else {
      try {
        this.gpu = probeGpu({
          getExtension: (name) => glContext.getExtension(name),
          getParameter: (param) => glContext.getParameter(param),
          MAX_TEXTURE_SIZE: glContext.MAX_TEXTURE_SIZE,
        });
      } catch (error) {
        console.warn('[SceneManager] GPU probe failed, falling back to mid tier.', error);
        this.gpu = {
          tier: 'mid',
          vendor: null,
          renderer: null,
          maxTextureSize: 0,
          reason: 'probe-failed',
        };
      }
    }
    useSettingsStore.getState().setSetting('gpuTier', this.gpu.tier);

    // --- Scene / camera ---
    this.scene = new THREE.Scene();
    // Procedural deep-space cubemap (Doc 18 §3.1, CLAUDE.md Critical Rule #1).
    // Falls back to a solid near-black when there is no DOM (SSR / unit tests).
    const skybox = createProceduralSkybox();
    this.scene.background = skybox ?? new THREE.Color(0x02030a);

    this.camera = new THREE.PerspectiveCamera(60, width / Math.max(1, height), 1e-4, 1e14);
    this.camera.position.set(0, 0, 50);
    this.camera.lookAt(0, 0, 0);

    // --- HDR Float16 render target (Doc 10 §3 post-processing pipeline input) ---
    this.hdrTarget = new THREE.WebGLRenderTarget(width, height, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      colorSpace: THREE.LinearSRGBColorSpace,
      depthBuffer: true,
      stencilBuffer: false,
      samples: 0,
    });

    // --- Observability + clock ---
    this.timer = new THREE.Timer();
    this.performance = new PerformanceMonitor({ windowSize: 60, hysteresisFps: 3 });

    // --- Camera controls (Doc 19 §4.1 + §4.4) ---
    // P4 — moveSpeed is seeded from the regime table so it matches whatever
    // regime the ScaleRegimeController starts in (see `onRegimeTransition`
    // for the subsequent per-transition update). `solar_system` is the
    // default; the constructor-time read is still valid because the
    // controller is built before the regime controller and a regime
    // transition later will call setMoveSpeed() anyway.
    const initialRegime: ScaleRegime =
      options.scaleRegimeOptions?.initial ?? 'solar_system';
    this.controls = new CameraController(this.camera, this.canvas, {
      moveSpeed: REGIME_MOVE_SPEED[initialRegime],
      orbitSpeed: 0.005,
      zoomSpeed: 0.1,
      dampingLambda: 5,
      // P4 — seed min/max distance from the regime table so wheel-zoom
      // limits are correct on the very first frame (before any regime
      // transition). Subsequent regime crossings call `setDistanceClamp`
      // in onRegimeTransition.
      minDistance: REGIME_MIN_DISTANCE[initialRegime],
      maxDistance: REGIME_MAX_DISTANCE[initialRegime],
    });

    // --- Star field (Doc 10 §3 — 1 draw call for the whole catalogue) ---
    this.starField = new StarFieldRenderer({
      pointSizeScale: 3.0,
      bloomThreshold: 1.5,
      quality: 'high',
    });
    // P2A — seed in parsec coordinates so 5K background stars live on the
    // same physical grid as the Gaia DR3 tile pyramid (StarTileRenderer
    // uses sceneUnitsPerPc = 500). 1–50 pc covers the Hipparcos-bright
    // neighbourhood; Proxima @ 1.3 pc is the closest occupant.
    // P2B — pin the 92 IAU-approved named stars at their real ICRS
    // positions (Sirius, Proxima, Vega, Betelgeuse, …). Anchors come out
    // of the catalog with Hipparcos-grade RA/Dec/distance so constellation
    // labels, picking, and the random background agree on coordinates.
    const starAnchors: StarAnchor[] = IAU_NAMED_STARS.map((s) => ({
      raDeg: s.raDeg,
      decDeg: s.decDeg,
      distancePc: s.distancePc,
      magV: s.magV,
      spectralType: s.spectralType ?? null,
      id: s.name,
    }));
    const seed = generateStarSeed({
      count: options.starCount ?? 5000,
      innerRadiusPc: 1,
      outerRadiusPc: 50,
      sceneUnitsPerPc: options.starTileRendererOptions?.sceneUnitsPerPc ?? 500,
      anchors: starAnchors,
    });
    this.starField.setSeed(seed);
    this.scene.add(this.starField.points);
    this.registerGpuHook(this.starField);

    // --- Simulation clock (Doc 27 §5.3, Doc 26 §14.2.2) ---
    this.timeEngine = new TimeEngine();

    // --- T50 default scene mode ---
    // When the unified scene is active every content layer mounts at the
    // world origin; the per-renderer "frame this fixture" camera pose that
    // each gallery used to apply would clobber the solar-system entry pose
    // (last renderer wins). Gate the gallery camera overrides so they only
    // run when the caller is explicitly driving a single-layer demo.
    const attachDefaultScene = options.attachDefaultScene !== false;
    const galleryFramesCamera = !attachDefaultScene;

    // --- Solar-system renderer (T14). T50 flipped this to default-on so the
    // unified scene mounts every content layer; tests opt out with
    // `showSolarSystem: false`. ---
    if (options.showSolarSystem !== false) {
      // T21 — spin up the live-ephemeris sampler first so the renderer's
      // initial `update()` inside its ctor sees a primed sampler.
      const liveEphemerisEnabled = options.useLiveEphemeris ?? true;
      this.ephemerisSampler = liveEphemerisEnabled
        ? new EphemerisSampler({
            // Earth moves ~2% of its orbit per day, so a 365-day window gives
            // us ~180 days of headroom on each side of the current epoch
            // before a refetch. Step 1 day keeps the cache under the 10k
            // data-point cap (Doc 26 §8.3) and, with Catmull-Rom cubic
            // interpolation, comfortably achieves sub-km accuracy.
            //
            // Events are logged once per body so a missing backend doesn't
            // turn into a per-frame console flood.
            onEvent: reportEphemerisEvent,
          })
        : null;
      // P4 — seed moonOrbitScale off the active UI mode so the first
      // rendered frame already reflects research (1:1 Doc 23 §3.3) vs
      // education (compressed 6×) preferences.
      const initialMode = useModeStore.getState().activeMode;
      const scaleMode = useSettingsStore.getState().solarSystemScaleMode;
      this.solarSystem = new SolarSystemRenderer({
        orbitScale: 12,
        bodySizeScale: 0.000_02,
        scaleMode,
        moonOrbitScale: MODE_MOON_ORBIT_SCALE[initialMode],
        showOrbits: true,
        ephemerisSampler: this.ephemerisSampler,
      });
      this.scene.add(this.solarSystem.group);
      this.registerGpuHook(this.solarSystem);
      // P4 — keep moon scale in sync with the active UI mode. Research
      // persona gets Doc 23 §3.3 true-scale (Luna at 60 Earth-radii);
      // everyone else keeps the readable educational compression.
      this.modeMoonScaleUnsub = useModeStore.subscribe((state, prev) => {
        if (state.activeMode === prev.activeMode) return;
        this.solarSystem?.setMoonOrbitScale(MODE_MOON_ORBIT_SCALE[state.activeMode]);
      });
      // Register every heliocentric body with the sampler. Moons stay on
      // client-Kepler because the catalog stores parent-equatorial
      // elements while the API default is ecliptic J2000 — the frame
      // conversion lands with T27 per-moon shaders.
      if (this.ephemerisSampler) {
        for (const naifId of this.solarSystem.getHeliocentricBodyIds()) {
          this.ephemerisSampler.register({ naifId });
        }
      }
      // T39 — instanced minor-body cloud + IAU surface-feature markers.
      // Both are owned by the SolarSystemRenderer so they share the
      // planet group's transform and lifecycle.
      this.solarSystem.mountAsteroidField();
      this.solarSystem.mountSurfaceFeatures();
      // T44 — named-comet composite (Halley, ZTF, Hale-Bopp, …).
      this.solarSystem.mountNamedComets();
      // P2E — initial camera parked just past Earth's orbit (orbitScale=12
      // → Earth at 12 u). Frames the Sun + inner rocky planets clearly
      // without collapsing the entire solar system into one screen; user
      // must zoom / wheel-out to see Saturn (~114 u) and beyond, which
      // preserves the "space IS vast" intuition.
      this.camera.position.set(0, 8, 22);
      this.camera.lookAt(0, 0, 0);
      this.controls.setTarget(0, 0, 0);
      // Default to real-time (1 sim s / real s) — the TimeControls slider lets
      // the user wind up speed explicitly. Previously this auto-started at
      // 2 628 000× (≈1 yr / 12 s) so planets visibly orbited on load, but
      // that contradicted the T18 "live data" feel and made fly-to targets
      // drift out from under the camera before the animation finished.
      const timeStore = useTimeStore.getState();
      timeStore.setSpeed(1);
      timeStore.play();
    } else {
      this.solarSystem = null;
      this.ephemerisSampler = null;
    }

    // --- Ray-cast picking (T15) ---
    // Constructed unconditionally; it's a no-op until a pickable owner is
    // attached. SolarSystemRenderer provides that owner today; T08's star
    // field will plug in later via its own `getPickableMeshes()`.
    this.picking = new PickingController(this.camera, this.canvas, {
      onPick: (naifId) => {
        // T18: optimistic client-side synthesis first (keeps the panel
        // instant on pick), then upgrade from the HTTP endpoint in the
        // background. Local-only bodies (catalog misses) bail out, but
        // once the backend is live we keep the async path in case the
        // server knows more bodies than the catalog.
        const optimistic = entityDataByNaif(naifId);
        const store = useSelectionStore.getState();
        if (optimistic) {
          // Fire-and-forget — store tracks staleness internally.
          void store.selectEntityAsync(naifId, optimistic);
        } else {
          void store.selectEntityAsync(naifId, null);
        }
        useUIStore.getState().openPanel('info');
      },
      onHover: (naifId) => {
        const preview = naifId !== null ? entityPreviewByNaif(naifId) : null;
        useSelectionStore.getState().setHover(naifId, preview);
      },
    });
    if (this.solarSystem) {
      this.picking.setPickableOwner(this.solarSystem);
    }

    // --- Engine bridge (T16) so React can trigger fly-to without a ref. ---
    this.unregisterEngineBridge = registerEngineBridge({
      flyToEntity: (naifId, opts) => this.flyToEntity(naifId, opts ?? {}),
      flyToCelestialCoord: (ra, dec, dist, opts) =>
        this.flyToCelestialCoord(ra, dec, dist, opts ?? {}),
      cancelFlyTo: () => this.controls.cancelFlyTo(),
      setTrackedEntity: (naifId) => this.setTrackedEntity(naifId),
    });

    // --- Optional moon gallery (T43 visual fixture) ---
    if (options.showMoonGallery) {
      this.moonGallery = new MoonGalleryRenderer(options.moonGalleryOptions);
      this.scene.add(this.moonGallery.group);
      this.registerGpuHook(this.moonGallery);
      // 16 moons on a 4×4 grid at cell=3.2u → ~10u span. Camera at (0,0,32)
      // with FOV=60° gives ~37u visible width — comfortable 16:9 margin.
      this.camera.position.set(0, 0, 32);
      this.camera.lookAt(0, 0, 0);
      this.controls.setTarget(0, 0, 0);
    } else {
      this.moonGallery = null;
    }

    // --- Nebula gallery (T27 + T45). T50 default-on; the DefaultSceneComposer
    // hides the group outside the Solar-System/Stellar regimes. ---
    if (options.showNebulaGallery !== false) {
      // T45 — 14 subtypes by default, laid out as a 2×7 grid so the row
      // width stays below the viewport's usable horizontal space (the UI
      // panels on the right edge eat ~150px). `mode: 'families'` is still
      // available through the options for backward screenshot baselines.
      // P2C — bump default to 'catalog' so each nebula lands at its real
      // ICRS position (M42 at 412 pc, M1 at 2 kpc, …). Explicit opt-in to
      // 'subtypes' / 'families' keeps the showcase demos working.
      const galleryOpts: NebulaGalleryOptions = {
        mode: 'catalog',
        cols: 7,
        size: 4,
        gap: 2.5,
        rowGap: 4,
        ...options.nebulaGalleryOptions,
      };
      this.nebulaGallery = new NebulaGalleryRenderer(galleryOpts);
      this.scene.add(this.nebulaGallery.group);
      this.registerGpuHook(this.nebulaGallery);
      if (galleryFramesCamera) {
        // Grid dims: cols=7 → 7 × 8 + 6 × 2.5 = 71u wide; rows=2 → 2 × 8 +
        // 1 × 4 = 20u tall. Centre at origin. Camera at +Z 95 frames the
        // grid with margin at FOV=60° and keeps all 14 slots clear of the
        // UI panels.
        this.camera.position.set(0, 0, 95);
        this.camera.lookAt(0, 0, 0);
        this.controls.setTarget(0, 0, 0);
      }
    } else {
      this.nebulaGallery = null;
    }

    // --- Exotic-object gallery (T28 + T48 extension, T52 default-on) ---
    // Always mount so the update() loop patches every exotic material's
    // shader and Doc 22 toggles (ENT-8010..8040) work end-to-end. The
    // composer hides the group outside demo mode; passing
    // `showExoticGallery: true` repositions the camera to the gallery row.
    if (options.showExoticGallery !== false) {
      // P2C — catalog mode by default so Sgr A*, Cyg X-1, M87*, Crab pulsar
      // et al. render at their real ICRS positions rather than a 3-cube
      // showcase row. Demo code that wants the legacy row passes
      // `positionMode: 'gallery'`.
      const exoticOpts = {
        ...(options.exoticGalleryOptions ?? {}),
        positionMode:
          options.exoticGalleryOptions?.positionMode ?? ('catalog' as const),
      };
      this.exoticGallery = new ExoticGalleryRenderer(exoticOpts);
      this.scene.add(this.exoticGallery.group);
      this.registerGpuHook(this.exoticGallery);
      if (options.showExoticGallery === true) {
        // T48.1: 18 cubes × 12u + 17 gaps × 4u → row length 284u. Camera
        // at (0, 20, 260) fits the full row at 16:9 with margin.
        this.camera.position.set(0, 20, 260);
        this.camera.lookAt(0, 0, 0);
        this.controls.setTarget(0, 0, 0);
      } else {
        // Default-mount: shift far off-screen so materials still update
        // (toggle patches apply) but the gallery is invisible until the
        // user requests the demo view.
        this.exoticGallery.group.position.set(0, 0, -2000);
        this.exoticGallery.group.visible = false;
      }
    } else {
      this.exoticGallery = null;
    }

    // --- Star-type placeholder gallery (T52) --------------------------------
    // Doc 22 has 16 star ENT-IDs (1007..1058). ENT-1007 is the live Sun in
    // SolarSystemRenderer; the remaining 14 have no scene mesh by default.
    // This gallery mounts one invisible sample sphere per ENT-ID so every
    // star toggle in the InfoPanel lands on a live shader material.
    this.starTypeGallery = new StarTypeGalleryRenderer();
    this.scene.add(this.starTypeGallery.group);
    this.registerGpuHook(this.starTypeGallery);

    // --- Phenomena placeholder gallery (T52) -------------------------------
    // Doc 22 8xxx phenomena (Kilonova, GRB, TDE, Accretion Disk, etc.) have
    // no dedicated shader yet. This gallery mounts an invisible sphere per
    // spec using a trivial GLSL3 shader so every phenomenon toggle lands on
    // a real material.
    this.phenomenaGallery = new PhenomenaGalleryRenderer();
    this.scene.add(this.phenomenaGallery.group);
    this.registerGpuHook(this.phenomenaGallery);

    // --- Exoplanet placeholder gallery (T52) -------------------------------
    this.exoplanetGallery = new ExoplanetGalleryRenderer();
    this.scene.add(this.exoplanetGallery.group);
    this.registerGpuHook(this.exoplanetGallery);

    // --- Galaxy gallery (T29). T50 default-on; composer hides outside the
    // Galactic / Cosmic regimes so it does not overlap the Solar System.
    // T52: default to the full 19-subtype layout so every Doc 22 galaxy
    // spec (ENT-6010..6058) has a live material that responds to toggles.
    // Callers can still override via `galaxyGalleryOptions.subtypes`. ---
    if (options.showGalaxyGallery !== false) {
      const galleryOpts: GalaxyGalleryOptions = {
        ...(options.galaxyGalleryOptions ?? {}),
      };
      // P2C — default to catalog mode so galaxies render at their real ICRS
      // positions (Andromeda 778 kpc, LMC 50 kpc, etc.). Callers explicitly
      // demoing the Hubble-sequence showcase still set `positionMode: 'gallery'`
      // + `subtypes: ALL_SUBTYPES` to get the old flat-grid layout.
      if (galleryOpts.positionMode === undefined) {
        galleryOpts.positionMode = 'catalog';
      }
      if (galleryOpts.positionMode === 'gallery' && !galleryOpts.subtypes) {
        galleryOpts.subtypes = GalaxyGalleryRenderer.ALL_SUBTYPES;
      }
      this.galaxyGallery = new GalaxyGalleryRenderer(galleryOpts);
      this.scene.add(this.galaxyGallery.group);
      this.registerGpuHook(this.galaxyGallery);
      if (galleryFramesCamera) {
        // 4 galaxies × 14u + 3 gaps × 6u → row length ~74u centred on origin.
        // Camera at (0, 6, 90) with FOV=60° gives ~104u visible width at 90u
        // distance — fits the row at 16:9 with margin.
        this.camera.position.set(0, 6, 90);
        this.camera.lookAt(0, 0, 0);
        this.controls.setTarget(0, 0, 0);
      }
    } else {
      this.galaxyGallery = null;
    }

    // --- Cosmic-web scaffolding (T29). T50 default-on; composer hides
    // outside Cosmic regime. ---
    if (options.showCosmicWeb !== false) {
      this.cosmicWeb = new CosmicWebRenderer(
        options.cosmicWebOptions ?? {
          nodes: DEFAULT_COSMIC_WEB.nodes,
          filaments: DEFAULT_COSMIC_WEB.filaments,
          voids: DEFAULT_COSMIC_WEB.voids,
        },
      );
      this.scene.add(this.cosmicWeb.group);
      this.registerGpuHook(this.cosmicWeb);
      if (galleryFramesCamera) {
        // Cosmic web spans ±50u; seat camera at (0, 20, 130) so the whole
        // mesh fits in a 60° FOV.
        this.camera.position.set(0, 20, 130);
        this.camera.lookAt(0, 0, 0);
        this.controls.setTarget(0, 0, 0);
        this.controls.setDistanceClamp(1, 5000);
      }
    } else {
      this.cosmicWeb = null;
    }

    // --- CMB boundary sphere (T29). T50 default-on. ---
    if (options.showCmbBoundary !== false) {
      this.cmbBoundary = new CmbBoundarySphere(options.cmbBoundaryOptions);
      this.scene.add(this.cmbBoundary.mesh);
      this.registerGpuHook(this.cmbBoundary);
    } else {
      this.cmbBoundary = null;
    }

    // --- Large-scale-structure gallery (T47). T50 default-on; composer hides
    // outside Cosmic regime. ---
    if (options.showLargeScaleStructure !== false) {
      this.largeScaleStructure = new LargeScaleStructureRenderer(
        options.largeScaleStructureOptions,
      );
      this.scene.add(this.largeScaleStructure.group);
      this.registerGpuHook(this.largeScaleStructure);
      if (galleryFramesCamera) {
        // LSS gallery fits in a 3×3 grid ~±42u wide; seat camera at
        // (0, 0, 120) so the whole grid fits a 60° FOV with margin.
        this.camera.position.set(0, 0, 120);
        this.camera.lookAt(0, 0, 0);
        this.controls.setTarget(0, 0, 0);
        this.controls.setDistanceClamp(5, 5000);
      }
    } else {
      this.largeScaleStructure = null;
    }

    // --- Milky Way interior composer (T46a). T50 default-on; its own
    // regime listener already drives the dissolve across the 800 pc–1 kpc
    // hysteresis band so the composer leaves group.visible alone at Galactic
    // scale and lets the shader fade itself out. ---
    if (options.showMilkyWayInterior !== false) {
      this.milkyWayInterior = new MilkyWayInteriorComposer(
        options.milkyWayInteriorOptions,
      );
      this.scene.add(this.milkyWayInterior.group);
      this.registerGpuHook(this.milkyWayInterior);
      if (galleryFramesCamera) {
        // Seat the camera at a from-Earth vantage point — small positive Y so
        // the MW band arcs rather than bisecting horizontally, and zero Z so
        // we look toward +X (direction of Sgr A* after ICRS→Galactic).
        this.camera.position.set(0, 0.1, 0.001);
        this.camera.lookAt(1, 0.1, 0);
        this.controls.setTarget(1, 0.1, 0);
        this.controls.setDistanceClamp(0.001, 500);
      }
    } else {
      this.milkyWayInterior = null;
    }

    // --- Optional planet gallery (T13 + T42 visual fixture) ---
    if (options.showPlanetGallery) {
      const mode = options.planetGalleryMode ?? 'solar';
      this.planetGallery = new PlanetGalleryRenderer({
        mode,
        rowZ: 0,
        timeScale: 50_000,
        sunDirection: new THREE.Vector3(0.6, 0.25, 0.75),
      });
      this.scene.add(this.planetGallery.group);
      this.registerGpuHook(this.planetGallery);
      // Pull the camera back far enough that the whole row/grid fits.
      if (mode === 'all27') {
        this.camera.position.set(0, 0, 42);
      } else {
        this.camera.position.set(0, 6, 38);
      }
      this.camera.lookAt(0, 0, 0);
      this.controls.setTarget(0, 0, 0);
    } else {
      this.planetGallery = null;
    }

    // --- T25 Scale-regime state machine ---
    // Construct BEFORE the tile streaming manager so we can seed its
    // `activeRegime` from the controller's initial value in one place.
    this.scaleRegime = new ScaleRegimeController(options.scaleRegimeOptions);
    this.scaleRegime.setOnTransition((transition) => this.onRegimeTransition(transition));
    // Sync the store to the controller's initial regime so React consumers
    // see `useCameraStore.getState().scaleRegime === controller.current`
    // from the first frame.
    useCameraStore.getState().setScaleRegime(this.scaleRegime.current);
    // T46a — seed the interior composer with the initial regime so the MW
    // band renders with the correct dissolve target from frame 1 (the
    // transition listener only fires on a *change*).
    this.milkyWayInterior?.setRegime(this.scaleRegime.current);

    // --- T26 star-tile renderer ---
    // Constructed BEFORE the streaming manager so the manager's
    // `onTileLoaded` callback can bind to a live renderer reference.
    // Renderer is purely a GPU resource owner until tiles are mounted.
    // T50 flipped this to default-on so the unified scene streams Gaia tiles
    // as soon as the camera enters the Stellar regime; tests opt out with
    // `attachStarTileStreaming: false`.
    const attachStarTiles = options.attachStarTileStreaming !== false;
    if (attachStarTiles) {
      this.starTileField = new StarTileRenderer(options.starTileRendererOptions);
      this.scene.add(this.starTileField.group);
      this.registerGpuHook(this.starTileField);
      if (galleryFramesCamera) {
        // Pull the camera back to a stellar-regime pose. Populated tiles
        // span ±100 pc in X/Y at `sceneUnitsPerPc=500` → a ±50k scene-unit
        // box.  Seat the camera ~30 pc (15k units) from the Sun, looking
        // toward the galactic centre, so Sirius (at 2.64 pc) sits well
        // in-frame from the first rendered tile.
        this.camera.position.set(0, 4000, 15000);
        this.camera.lookAt(0, 0, 0);
        this.controls.setTarget(0, 0, 0);
      }
      // P4 — regime-aware distance clamp replaces the old hardcoded
      // `setDistanceClamp(1, 250_000)`. The constructor above already seeded
      // `REGIME_MIN_DISTANCE[initial] .. REGIME_MAX_DISTANCE[initial]`, and
      // `onRegimeTransition` updates the clamp as the user crosses regime
      // boundaries. See REGIME_MAX_DISTANCE / REGIME_MIN_DISTANCE near the
      // top of the file for the per-regime ceilings.
    } else {
      this.starTileField = null;
    }

    // --- T23 Tile streaming manager ---
    // Construct first so the WebSocket listener below can reference it. The
    // manager is opt-in at the SceneManager level only because some tests
    // don't want to construct a Dexie DB during a pure-render assertion.
    if (options.attachTileStreaming !== false) {
      const tsmOptions: TileStreamingManagerOptions = {
        ...(options.tileStreamingOptions ?? {}),
      };
      if (tsmOptions.activeRegime === undefined) {
        tsmOptions.activeRegime = this.scaleRegime.current;
      }
      // T26 — bind the star-tile renderer to the loaded callback. We keep
      // the user's own `onTileLoaded` (if any) as a downstream fan-out.
      const userOnLoaded = tsmOptions.onTileLoaded;
      tsmOptions.onTileLoaded = (address, buffer) => {
        this.mountStarTile(address, buffer);
        userOnLoaded?.(address, buffer);
      };
      this.tileStreaming = new TileStreamingManager(tsmOptions);
    } else {
      this.tileStreaming = null;
    }

    // --- T26 bootstrap manifest fetch ---
    // P3 bugfix — previously checked `options.attachStarTileStreaming` for
    // truthiness, but the option defaults to `true` via `!== false` at line
    // 961. Default constructions never bootstrapped because `undefined`
    // failed the truthiness check here. Use the resolved `attachStarTiles`
    // flag so default-on semantics actually fire the bootstrap.
    if (attachStarTiles && this.tileStreaming && this.starTileField) {
      void this.bootstrapStarTileStream();
    }

    // --- T22 WebSocket manager ---
    // Constructed even without solar-system mounted so that
    // `data_version_update` cache busts stay live across any demo. The
    // manager is OFF by default — call `webSocket.connect()` explicitly
    // (or pass `autoConnectWebSocket: true`) once auth is wired.
    if (options.attachWebSocket !== false) {
      const ws = new CosmosWebSocket(options.webSocketOptions);
      ws.setListeners({
        onEphemerisPush: (msg) => this.applyEphemerisPush(msg),
        onDataVersionUpdate: (msg) => this.handleDataVersionUpdate(msg),
        onTilePriority: (msg) => {
          if (!this.tileStreaming) return;
          this.tileStreaming.enqueue(tilePriorityHintsFromWsUrls(msg.tiles));
        },
      });
      this.webSocket = ws;
      // TimeEngine needs a WebSocket-like transport to send `time_update`
      // frames. Provide a thin adapter that forwards through the typed
      // CosmosWebSocket.send — one JSON round-trip per slider move, so
      // cost is negligible.
      this.timeEngine.attachWebSocket({
        send: (raw: string) => {
          if (!ws.isOpen()) return;
          const payload = JSON.parse(raw) as Record<string, unknown>;
          ws.send(payload);
        },
      });
      if (options.autoConnectWebSocket) ws.connect();
    } else {
      this.webSocket = null;
    }

    // --- T30 post-processing chain ---
    if (options.attachPostProcessing !== false) {
      const settings = useSettingsStore.getState();
      const overrides = options.postProcessingFeatures ?? {};
      const features: PostProcessingFeatureFlags = {
        ...DEFAULT_FEATURES,
        fxaa: overrides.fxaa ?? settings.fxaa,
        chromaticAberration: overrides.chromaticAberration ?? settings.chromaticAberration,
        filmGrain: overrides.filmGrain ?? settings.filmGrain,
        vignette: overrides.vignette ?? settings.vignette,
        scanlines: overrides.scanlines ?? settings.crtScanlines,
        gravitationalLensing:
          overrides.gravitationalLensing ?? settings.gravitationalLensing,
        bloom: overrides.bloom ?? true,
      };

      this.blackHoleLensing = new BlackHoleLensingPass({ width, height });
      this.postProcessing = new PostProcessingChain({
        width,
        height,
        pixelRatio: this.renderer.getPixelRatio(),
        features,
        qualityTier: this.gpu.tier,
        reducedMotion: settings.reducedMotion,
        bloomIntensity: settings.bloomIntensity,
        lensingPass: this.blackHoleLensing,
      });
      this.registerGpuHook(this.postProcessing);
      this.registerGpuHook(this.blackHoleLensing);

      // Auto-register the exotic gallery's black hole so `?demo=exotic`
      // shows the Schwarzschild deflection alongside the T28 photon ring.
      if (this.exoticGallery) {
        const bh = this.exoticGallery.getBlackHoleTransform();
        if (bh) {
          this.blackHoleLensing.addBlackHole({
            position: bh.position,
            schwarzschildRadius: bh.radius,
            einsteinScale: 1.5,
          });
        }
      }
    } else {
      this.postProcessing = null;
      this.blackHoleLensing = null;
    }

    // --- T32 guided-tour driver ---
    // Must be constructed *after* `registerEngineBridge` above so the
    // TourEngine's flyTo dispatch lands on a live handler. Default-on.
    if (options.attachTourEngine !== false) {
      this.tourEngine = new TourEngine();
    } else {
      this.tourEngine = null;
    }

    // --- T49 constellation + label overlay ---
    // The label overlay is a shared CSS2DRenderer wrapper consumed by the
    // ConstellationRenderer today and the T50 per-entity label pin
    // tomorrow. Always construct it so future layers can append labels
    // without re-bootstrapping the DOM element. When no parent is
    // supplied we fall back to the canvas's existing parent.
    this.labelOverlay = new EntityLabelOverlay();
    this.labelOverlay.setSize(width, height);
    const overlayParent =
      options.labelOverlayParent !== undefined
        ? options.labelOverlayParent
        : canvas.parentElement;
    if (overlayParent) this.labelOverlay.attach(overlayParent);

    if (options.showConstellations !== false) {
      this.constellations = new ConstellationRenderer(
        this.labelOverlay,
        options.constellationOptions,
      );
      this.scene.add(this.constellations.group);
      this.registerGpuHook(this.constellations);
      // Seed visibility from the current uiStore value so the layer
      // respects the HUD toggle on first frame.
      const initial = useUIStore.getState().showConstellationLines;
      this.constellations.setVisible(initial);
      // In default-scene mode the DefaultSceneComposer owns
      // `constellations.group.visible` and already combines the uiStore
      // flag with the regime × mode filter — skip a second store
      // subscription to avoid "last writer wins" flicker. Legacy
      // single-layer demos keep the dedicated listener.
      if (!attachDefaultScene) {
        this.constellationVisibilityUnsub = useUIStore.subscribe((state, prev) => {
          if (state.showConstellationLines === prev.showConstellationLines) return;
          this.constellations?.setVisible(state.showConstellationLines);
        });
      }
    } else {
      this.constellations = null;
    }

    // --- T50 Default-scene composer ---
    // Constructed AFTER every renderer so it can read their current `group`
    // or `mesh` handles. The composer is cheap — one subscribe each on
    // cameraStore / modeStore / uiStore — and writes `visible` booleans on
    // regime × mode changes. With the composer attached, the per-regime
    // scene composition (Doc 19 §Scale Transitions) is enforced without the
    // caller having to orchestrate it themselves.
    if (attachDefaultScene) {
      const layerHandles: SceneLayerHandles = {
        solarSystem: this.solarSystem ? this.solarSystem.group : null,
        // T50 follow-up — gate the decorative 5K-point starfield on regime.
        // Previously drawn unconditionally at radius 10–80u, which collided
        // with the solar-system volume (Neptune ~360u at orbitScale=12).
        starField: this.starField.points,
        starTileField: this.starTileField ? this.starTileField.group : null,
        nebulaGallery: this.nebulaGallery ? this.nebulaGallery.group : null,
        galaxyGallery: this.galaxyGallery ? this.galaxyGallery.group : null,
        cosmicWeb: this.cosmicWeb ? this.cosmicWeb.group : null,
        cmbBoundary: this.cmbBoundary ? this.cmbBoundary.mesh : null,
        largeScaleStructure: this.largeScaleStructure
          ? this.largeScaleStructure.group
          : null,
        milkyWayInterior: this.milkyWayInterior
          ? this.milkyWayInterior.group
          : null,
        constellations: this.constellations ? this.constellations.group : null,
        // Museum-showcase galleries — previously drawn unconditionally at
        // fixed z-offsets (-2042..-7500) that overlapped inner-planet space.
        // Compose them into the regime × mode matrix so they only show
        // outside the solar-system regime.
        planetGallery: this.planetGallery ? this.planetGallery.group : null,
        moonGallery: this.moonGallery ? this.moonGallery.group : null,
        starTypeGallery: this.starTypeGallery.group,
        phenomenaGallery: this.phenomenaGallery.group,
        exoplanetGallery: this.exoplanetGallery.group,
        exoticGallery: this.exoticGallery ? this.exoticGallery.group : null,
      };
      this.defaultSceneComposer = new DefaultSceneComposer({
        handles: layerHandles,
      });
    } else {
      this.defaultSceneComposer = null;
    }

    // --- Resize + visibility wiring ---
    this.resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => this.handleResize());
    if (this.resizeObserver) this.resizeObserver.observe(canvas);
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    // --- WebGL context loss + restore (Doc 27 §15.2) ---
    canvas.addEventListener('webglcontextlost', this.onContextLost);
    canvas.addEventListener('webglcontextrestored', this.onContextRestored);
  }

  /** Register a GPU-backed component so context restore can rebuild it. */
  registerGpuHook(hook: GpuLifecycleHook): void {
    if (!this.gpuHooks.includes(hook)) this.gpuHooks.push(hook);
  }

  unregisterGpuHook(hook: GpuLifecycleHook): void {
    const idx = this.gpuHooks.indexOf(hook);
    if (idx >= 0) this.gpuHooks.splice(idx, 1);
  }

  /** True while the WebGL context is lost and we're awaiting restore. */
  isContextLost(): boolean {
    return this.contextLost;
  }

  /**
   * Force-loss the context for tests / "Reset" buttons. Requires the
   * `WEBGL_lose_context` extension (always present in standards browsers).
   */
  forceContextLoss(): void {
    const gl = this.renderer.getContext();
    const ext = gl.getExtension('WEBGL_lose_context');
    ext?.loseContext();
  }

  /** Companion to `forceContextLoss` — triggers the restore flow. */
  forceContextRestore(): void {
    const gl = this.renderer.getContext();
    const ext = gl.getExtension('WEBGL_lose_context');
    ext?.restoreContext();
  }

  /** Begin the rAF loop. Safe to call repeatedly. */
  start(): void {
    if (this.disposed || this.rafId !== null) return;
    // Resync the Timer so the first resumed frame's delta does not include
    // the paused wall-clock time.
    this.timer.update();
    const tick = (): void => {
      if (this.disposed) return;
      this.timer.update();
      const deltaMs = this.timer.getDelta() * 1000;
      const dtSeconds = deltaMs / 1000;
      const elapsedMs = this.timer.getElapsed() * 1000;
      this.performance.recordFrame(deltaMs);

      // Advance the simulation clock + move the solar system BEFORE the
      // camera controller. T20 tracking needs the body's current-frame
      // world position so the Δ shift it applies to `controls.target` is
      // based on the same JD that `solarSystem.update()` produced.
      this.timeEngine.update(deltaMs);
      if (this.solarSystem) {
        const jd = this.timeEngine.getEpochJulianDate();
        // T21 — feed the sampler the current playback rate so it can
        // self-throttle at extreme time-slider speeds.
        if (this.ephemerisSampler) {
          const simSecondsPerRealSecond = useTimeStore.getState().playbackSpeed;
          this.ephemerisSampler.setPlaybackContext(Math.abs(simSecondsPerRealSecond) / 86_400);
        }
        // P3 — pass camera world position so the solar system can adapt
        // the asteroid-field draw range to the viewer's distance.
        this.solarSystem.update(
          dtSeconds,
          elapsedMs / 1000,
          jd,
          undefined,
          this.camera.position,
        );
        // T39 — drive zoom-gating for IAU surface markers off the live
        // camera position. The renderer hides feature groups whose parent
        // body is too far from the camera, so this is cheap (≤8 bodies).
        this.solarSystem.getSurfaceFeatures()?.update(this.camera.position);
      }
      this.syncTracking();
      this.controls.update(dtSeconds);
      this.publishCameraState();

      this.options.onFrame?.(deltaMs, elapsedMs);
      // P2 — gate per-frame `.update()` calls on renderer visibility so
      // gallery layers hidden by the composer stop burning CPU on uniform
      // syncs + `applyEntityToggles` patches that no pixel will ever see.
      // `.update()` is a pure state-sync (no compounding work), so a next
      // visibility flip resyncs from the current store value within 1 frame.
      const elapsedSec = elapsedMs / 1000;
      if (this.starField.points.visible) this.starField.update(elapsedSec);
      if (this.starTileField && this.starTileField.group.visible) {
        this.starTileField.update(elapsedSec);
        // P3 — frustum-cull + priority-reweight star tiles every N frames.
        // Throttled to 4-frame cadence because the Projection × View matrix
        // recomputation and the per-tile sphere test add measurable cost at
        // tile counts > 1000 (Gaia bright subset). 15 fps on cull updates
        // is ample — the human eye can't see pop-in at that cadence when
        // tiles are further out than 1 pc from the camera.
        this.tileCullCounter = (this.tileCullCounter + 1) % 4;
        if (this.tileCullCounter === 0) this.applyStarTileCulling();
      }
      if (this.planetGallery && this.planetGallery.group.visible) {
        this.planetGallery.update(dtSeconds, elapsedSec);
      }
      if (this.moonGallery && this.moonGallery.group.visible) {
        this.moonGallery.update(dtSeconds, elapsedSec);
      }
      if (this.nebulaGallery && this.nebulaGallery.group.visible) {
        this.nebulaGallery.update(dtSeconds, elapsedSec, this.camera.position);
      }
      if (this.exoticGallery && this.exoticGallery.group.visible) {
        this.exoticGallery.update(dtSeconds, elapsedSec, this.camera.position);
      }
      if (this.starTypeGallery.group.visible) {
        this.starTypeGallery.update(dtSeconds, elapsedSec, this.camera.position);
      }
      if (this.phenomenaGallery.group.visible) {
        this.phenomenaGallery.update(dtSeconds, elapsedSec);
      }
      if (this.exoplanetGallery.group.visible) {
        this.exoplanetGallery.update(dtSeconds, elapsedSec);
      }
      if (this.galaxyGallery && this.galaxyGallery.group.visible) {
        this.galaxyGallery.update(dtSeconds, elapsedSec, this.camera.position);
      }
      if (this.cmbBoundary && this.cmbBoundary.mesh.visible) {
        this.cmbBoundary.update(dtSeconds, elapsedSec);
      }
      if (this.largeScaleStructure && this.largeScaleStructure.group.visible) {
        this.largeScaleStructure.update(dtSeconds, elapsedSec);
      }
      if (this.milkyWayInterior && this.milkyWayInterior.group.visible) {
        this.milkyWayInterior.update(dtSeconds, elapsedSec);
      }
      if (this.searchTargetMarker) {
        this.searchTargetMarker.update(dtSeconds, this.camera.position);
      }
      if (!this.contextLost) {
        // P3 — bypass the HDR RTT + post-processing chain at low / emergency
        // quality levels. On those GPUs the bloom pyramid + composite pass
        // alone can cost 4–8 ms/frame; rendering straight to the default
        // framebuffer is the cheapest way back to 30 fps.
        const bypassPost = shouldBypassPostProcessing(this.lastQuality);
        if (this.postProcessing && !bypassPost) {
          this.renderer.setRenderTarget(this.hdrTarget);
          this.renderer.clear();
          this.renderer.render(this.scene, this.camera);
          this.renderer.setRenderTarget(null);
          this.postProcessing.render(
            this.renderer,
            this.hdrTarget,
            dtSeconds,
            null,
            this.camera,
          );
        } else {
          this.renderer.render(this.scene, this.camera);
        }
        // T49 — CSS2D label overlay paints AFTER the post-processing
        // chain so DOM text sits on top of the HDR tonemap + CRT pass.
        // Per-label visibility gate runs just before paint so distance
        // thresholds update in the same frame as the camera move.
        if (this.labelOverlay) {
          this.labelOverlay.updateVisibility(this.camera.position);
          this.labelOverlay.render(this.camera);
        }
      }

      const snapshot = this.performance.getSnapshot();
      if (snapshot.quality !== this.lastQuality) {
        this.lastQuality = snapshot.quality;
        this.applyQualityLevel(snapshot.quality);
        this.options.onQualityChange?.(snapshot.quality);
      }

      this.rafId = window.requestAnimationFrame(tick);
    };
    this.rafId = window.requestAnimationFrame(tick);
  }

  /** Pause the rAF loop and drop the sampling window so resume is stable. */
  stop(): void {
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.performance.resetSamples();
  }

  /** Explicit resize — usually triggered automatically by ResizeObserver. */
  resize(width: number, height: number): void {
    if (width <= 0 || height <= 0) return;
    this.renderer.setSize(width, height, false);
    this.hdrTarget.setSize(width, height);
    this.postProcessing?.setSize(width, height, this.renderer.getPixelRatio());
    this.blackHoleLensing?.setSize(width, height);
    // T49 — keep the CSS2D overlay in sync so label DOM stays pixel-aligned.
    this.labelOverlay?.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /** Exported for UI to display telemetry. */
  getSnapshot(): PerformanceSnapshot {
    return this.performance.getSnapshot();
  }

  /**
   * P3 — propagate a new quality level to the GPU-facing subsystems:
   *
   *   - PostProcessingChain bloom pyramid depth (tier high / mid / low).
   *   - AsteroidFieldRenderer draw count (full → emergency = 10%) via
   *     `setDrawRange` — non-destructive so recovery is a single setter call.
   *
   * The render-block bypass (`shouldBypassPostProcessing`) is read off
   * `this.lastQuality` each frame so the call order above is safe: setting
   * the tier on a chain we're about to skip is cheap.
   *
   * Called from the tick loop on quality transition AND exposed as a public
   * method so tests + UI overrides can force a tier without driving FPS.
   */
  applyQualityLevel(level: QualityLevel): void {
    const tier = qualityToGpuTier(level);
    this.postProcessing?.setQualityTier(tier);
    const asteroidField = this.solarSystem?.getAsteroidField();
    if (asteroidField) {
      asteroidField.setDrawFraction(qualityToAsteroidFraction(level));
    }
  }

  /**
   * T20 — enable or disable camera tracking on a body by NAIF id. `null`
   * disables. Returns `true` if the scene accepts the request (body
   * resolves or tracking is disabled), `false` if the body isn't in the
   * current scene.
   *
   * Writes `cameraStore.trackedEntityId` so downstream subscribers (UI)
   * can read the authoritative value without a round-trip through the
   * bridge. The per-frame `syncTracking()` call consumes the store.
   */
  setTrackedEntity(naifId: number | null): boolean {
    if (naifId === null) {
      useCameraStore.setState({ trackedEntityId: null });
      // Clear the controller's anchor so a later re-enable doesn't apply
      // a stale delta between the old and new body positions.
      this.controls.syncTracking(null, null);
      return true;
    }
    const solar = this.solarSystem;
    if (!solar) return false;
    if (solar.getBodyWorldPosition(naifId) === null) return false;
    useCameraStore.setState({ trackedEntityId: naifId });
    return true;
  }

  /**
   * Resolve the currently-tracked body's world position (via the cameraStore
   * and solar-system renderer) and shift the camera controller so the
   * orbital pose is maintained. Called every frame from `tick()`.
   */
  private syncTracking(): void {
    const trackedId = useCameraStore.getState().trackedEntityId;
    if (trackedId === null || !this.solarSystem) {
      this.controls.syncTracking(null, null);
      return;
    }
    const pos = this.solarSystem.getBodyWorldPosition(trackedId);
    if (pos === null) {
      // Body disappeared from the scene (e.g. renderer swapped). Drop
      // tracking cleanly rather than leaving a stale anchor.
      useCameraStore.setState({ trackedEntityId: null });
      this.controls.syncTracking(null, null);
      return;
    }
    this.controls.syncTracking(trackedId, pos);
  }

  /**
   * Fly-to animation target a solar-system body by NAIF id. Resolves the
   * body's current world position + visual radius from SolarSystemRenderer,
   * applies the Doc 19 §4.2 approach distance, and kicks the camera animator.
   *
   * Returns `true` if the fly-to was started, `false` if the body isn't in
   * the current scene (e.g. solar-system renderer disabled).
   */
  flyToEntity(naifId: number, opts: { durationSec?: number } = {}): boolean {
    const solar = this.solarSystem;
    if (!solar) return false;

    const pickable = solar.getPickableMeshes().find((m) => m.userData.naifId === naifId);

    let worldPos: THREE.Vector3;
    let visualRadius: number;
    if (pickable) {
      // World-space position of the mesh's geometric centre.
      worldPos = new THREE.Vector3();
      pickable.getWorldPosition(worldPos);

      // Visual radius in scene units. `SphereGeometry.parameters.radius` is the
      // radius we fed the ctor; if the mesh was scaled post-construction the
      // world-space radius differs — fold in the max lossy scale.
      const geometry = pickable.geometry as THREE.SphereGeometry;
      const baseRadius = geometry?.parameters?.radius ?? 0.5;
      const worldScale = new THREE.Vector3();
      pickable.getWorldScale(worldScale);
      visualRadius = baseRadius * Math.max(worldScale.x, worldScale.y, worldScale.z);
    } else {
      // P2C — unmeshed catalog body (named minor moon like Amalthea or
      // Dysnomia, unmeshed comet, asteroid). Resolve position via the
      // renderer's Kepler fallback and pick a conservative approach
      // distance so fly-to still works for search-surfaced targets.
      const resolved = solar.getBodyWorldPosition(naifId);
      if (!resolved) return false;
      worldPos = resolved;
      // No mesh → use a small standoff. The body is sub-pixel at current
      // scale, so 0.5 u (per approachDistanceForRadius minimum) is enough
      // for the camera to feel "near" the moon.
      visualRadius = 0.3;
    }

    const orbitDistance = approachDistanceForRadius(visualRadius, 'solar_system');
    const flyToArgs: Parameters<typeof this.controls.flyTo>[0] = {
      endTarget: worldPos,
      orbitDistance,
    };
    if (opts.durationSec !== undefined) flyToArgs.durationSec = opts.durationSec;

    // T33 — honour `settingsStore.reducedMotion` (Doc 16 §Reduced Motion,
    // Doc 24 §17.4): skip the cinematic easing, teleport to the approach
    // point. `durationSec <= 0` is the FlyToAnimator's snap-immediate
    // signal (see FlyToAnimator constructor). We still go through the
    // fly-to pipeline so `isTransitioning` / completion callbacks fire
    // consistently — consumers (InfoPanel "Flying…" label, TourEngine
    // step advance) don't need a separate reduced-motion code path.
    if (useSettingsStore.getState().reducedMotion) {
      flyToArgs.durationSec = 0;
    }

    // Parent-aware approach direction. Without an explicit hint, FlyToAnimator
    // infers `approachDir = start − end`. At the solar-system display scale
    // (1 AU = 12 units, planet radius floored to 0.6 u), that can put the Sun
    // between the camera and the planet — the Sun disc then occludes the
    // planet at arrival. Fix: for heliocentric bodies approach from the
    // sun-lit side (camera between Sun and planet), so the viewer sees the
    // illuminated hemisphere with the Sun safely behind the camera.
    //
    // For moons we mirror the logic with the parent planet.
    const body = bodyById(naifId);
    if (body && body.parentNaifId >= 0) {
      const parentPos = new THREE.Vector3();
      if (body.parentNaifId === 10) {
        parentPos.set(0, 0, 0);
      } else {
        const parentMesh = solar
          .getPickableMeshes()
          .find((m) => m.userData.naifId === body.parentNaifId);
        parentMesh?.getWorldPosition(parentPos);
      }
      const parentToBody = new THREE.Vector3().subVectors(worldPos, parentPos);
      if (parentToBody.lengthSq() > 1e-6) {
        // approachDirection points FROM endTarget toward the approach point.
        // We want the approach point on the parent-facing side of the body,
        // so the direction is from body back toward parent = −parentToBody.
        flyToArgs.approachDirection = parentToBody.normalize().negate();
      }
    }

    // Obstacle-avoidance: if the Sun would be between us and the target, bulge
    // the Bezier away from the origin. The parent-aware approach direction
    // already handles the arrival geometry, but mid-flight the straight-line
    // Bezier baseline can still clip the Sun sphere at display scale.
    if (naifId !== 10) {
      flyToArgs.avoidPoint = new THREE.Vector3(0, 0, 0);
      flyToArgs.avoidRadius = 2; // ~Sun visual radius in current solar-system scale
    }

    // T20 — if the user is tracking a *different* body, flying somewhere
    // else can't coexist with that track; drop tracking cleanly. If we're
    // already tracking the fly-to target, keep the flag on so tracking
    // resumes seamlessly once the Bezier lands.
    const trackedId = useCameraStore.getState().trackedEntityId;
    if (trackedId !== null && trackedId !== naifId) {
      useCameraStore.setState({ trackedEntityId: null });
      this.controls.syncTracking(null, null);
    }

    useCameraStore.setState({ isTransitioning: true, targetEntityId: naifId });
    this.controls.flyTo(flyToArgs, () => {
      useCameraStore.setState({ isTransitioning: false });
    });
    return true;
  }

  /**
   * T38 / P2C — fly to an ICRS sky direction. Used by search activation for
   * deep-sky objects (Messier, NGC, galaxies, nebulae, exotic, large-scale
   * structure) that don't have a mesh in the current scene.
   *
   * The scene renders everything in a SINGLE scale (1 AU = 12 u, 1 pc ≈
   * 500 u per the star seed) inside the solar_system regime's
   * `maxDistance ≈ 1e5` camera clamp. A true 1:1 placement would shove
   * Andromeda (778 kpc) 400 million units away — off the regime. Instead
   * we map physical parsec distance to a scene distance piecewise:
   *
   *   ≤ 120 pc  : true stellar scale (500 u/pc). Sirius 2.637 pc → 1318u;
   *               Vega 7.68 pc → 3840u. Matches the positions of the
   *               anchored star-seed population so fly-to lands IN the
   *               star field at the correct direction and depth.
   *   > 120 pc  : log-compressed to 60 000..90 000 u so the object reads
   *               as "far along this sky direction" without escaping
   *               the solar_system regime. The info panel still shows
   *               the true distance in kpc / Mpc.
   *
   * Callers pass `distancePc = null` (e.g. a constellation centroid) to
   * get a direction-only marker at a regime-appropriate midpoint.
   */
  flyToCelestialCoord(
    raDeg: number,
    decDeg: number,
    distancePc: number | null,
    opts: {
      durationSec?: number;
      label?: string;
      markerColor?: string;
      entId?: string;
    } = {},
  ): boolean {
    // Direction unit vector in ICRS: x = cosδ·cosα, y = cosδ·sinα, z = sinδ.
    const ra = (raDeg * Math.PI) / 180;
    const dec = (decDeg * Math.PI) / 180;
    const cosDec = Math.cos(dec);
    // ICRS (X, Y, Z) → Three.js (X, Z, −Y) so the ecliptic/equatorial plane
    // maps to the scene XZ plane — same convention as SolarSystemRenderer.
    const icrsX = cosDec * Math.cos(ra);
    const icrsY = cosDec * Math.sin(ra);
    const icrsZ = Math.sin(dec);
    const dir = new THREE.Vector3(icrsX, icrsZ, -icrsY);

    const distScene = celestialDistanceToSceneUnits(distancePc);
    const endTarget = dir.clone().multiplyScalar(distScene);

    // Camera orbit distance: 8% of target distance keeps the camera
    // visibly outside the marker, capped to readable bounds. For near
    // stars (distScene ≈ 1-5k u) we want ~200-400u standoff; for
    // extragalactic markers (distScene ≈ 80-90k u) we want ~6-7k u.
    const orbitDistance = Math.max(50, Math.min(distScene * 0.08, 8_000));

    // P2E — spawn a visible marker at the target. The galaxy / nebula /
    // exotic catalog renderers place meshes at their true-scale positions
    // (Mpc × unitsPerMpc), so at the camera's arrival frame the object
    // itself is millions of units away. The marker gives the user a
    // confirmed landing anchor and carries the object's label.
    this.clearSearchTargetMarker();
    this.searchTargetMarker = new SearchTargetMarker(endTarget, {
      label: opts.label ?? 'TARGET',
      color: opts.markerColor ?? '#7dd3fc',
      // P2F — when the ent_id resolves to a catalog entry the marker mounts
      // the actual procedural shader (spiral galaxy, emission nebula, Kerr
      // disk) instead of an empty orb.
      entId: opts.entId,
    });
    this.scene.add(this.searchTargetMarker.group);

    const flyToArgs: Parameters<typeof this.controls.flyTo>[0] = {
      endTarget,
      orbitDistance,
    };
    if (opts.durationSec !== undefined) flyToArgs.durationSec = opts.durationSec;
    if (useSettingsStore.getState().reducedMotion) {
      flyToArgs.durationSec = 0;
    }
    // Drop tracking — flying out of a planetary frame invalidates any
    // orbit anchor.
    const trackedId = useCameraStore.getState().trackedEntityId;
    if (trackedId !== null) {
      useCameraStore.setState({ trackedEntityId: null });
      this.controls.syncTracking(null, null);
    }
    useCameraStore.setState({ isTransitioning: true, targetEntityId: null });
    this.controls.flyTo(flyToArgs, () => {
      useCameraStore.setState({ isTransitioning: false });
    });
    return true;
  }

  /** P2E — drop the active search-target marker (and its GPU resources). */
  clearSearchTargetMarker(): void {
    if (!this.searchTargetMarker) return;
    this.scene.remove(this.searchTargetMarker.group);
    this.searchTargetMarker.dispose();
    this.searchTargetMarker = null;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    this.clearSearchTargetMarker();
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.resizeObserver?.disconnect();
    this.canvas.removeEventListener('webglcontextlost', this.onContextLost);
    this.canvas.removeEventListener('webglcontextrestored', this.onContextRestored);
    if (this.contextLossTimeout) clearTimeout(this.contextLossTimeout);
    this.controls.dispose();
    this.picking.dispose();
    this.unregisterEngineBridge?.();
    this.unregisterEngineBridge = null;
    this.scene.remove(this.starField.points);
    this.starField.dispose();
    if (this.planetGallery) {
      this.scene.remove(this.planetGallery.group);
      this.planetGallery.dispose();
    }
    if (this.moonGallery) {
      this.scene.remove(this.moonGallery.group);
      this.moonGallery.dispose();
    }
    if (this.nebulaGallery) {
      this.scene.remove(this.nebulaGallery.group);
      this.nebulaGallery.dispose();
    }
    if (this.exoticGallery) {
      this.scene.remove(this.exoticGallery.group);
      this.exoticGallery.dispose();
    }
    this.scene.remove(this.starTypeGallery.group);
    this.starTypeGallery.dispose();
    this.scene.remove(this.phenomenaGallery.group);
    this.phenomenaGallery.dispose();
    this.scene.remove(this.exoplanetGallery.group);
    this.exoplanetGallery.dispose();
    if (this.galaxyGallery) {
      this.scene.remove(this.galaxyGallery.group);
      this.galaxyGallery.dispose();
    }
    if (this.cosmicWeb) {
      this.scene.remove(this.cosmicWeb.group);
      this.cosmicWeb.dispose();
    }
    if (this.cmbBoundary) {
      this.scene.remove(this.cmbBoundary.mesh);
      this.cmbBoundary.dispose();
    }
    if (this.largeScaleStructure) {
      this.scene.remove(this.largeScaleStructure.group);
      this.largeScaleStructure.dispose();
    }
    if (this.milkyWayInterior) {
      this.scene.remove(this.milkyWayInterior.group);
      this.milkyWayInterior.dispose();
    }
    if (this.solarSystem) {
      this.scene.remove(this.solarSystem.group);
      this.solarSystem.dispose();
    }
    this.ephemerisSampler?.dispose();
    this.starTileBootstrapAbort?.abort();
    this.starTileBootstrapAbort = null;
    this.tileStreaming?.dispose();
    if (this.starTileField) {
      this.scene.remove(this.starTileField.group);
      this.starTileField.dispose();
    }
    this.starTileCentres.clear();
    this.webSocket?.dispose();
    this.postProcessing?.dispose();
    this.blackHoleLensing?.dispose();
    this.tourEngine?.dispose();
    this.defaultSceneComposer?.dispose();
    this.constellationVisibilityUnsub?.();
    this.constellationVisibilityUnsub = null;
    this.modeMoonScaleUnsub?.();
    this.modeMoonScaleUnsub = null;
    if (this.constellations) {
      this.scene.remove(this.constellations.group);
      this.constellations.dispose();
    }
    this.labelOverlay?.dispose();
    if (this.scene.background instanceof THREE.CubeTexture) {
      this.scene.background.dispose();
    }
    this.hdrTarget.dispose();
    this.renderer.dispose();
  }

  /**
   * T22 — route an `ephemeris_push` frame into:
   *  1. the {@link EphemerisSampler} so the renderer's next tick uses the
   *     SPICE-exact position rather than cubic interp;
   *  2. the {@link TimeEngine.handleWebSocketMessage} dispatcher so any
   *     existing T11 subscriber (tests, future UI listeners) still fires.
   *
   * The push frame's positions are already in AU per Doc 26 §14.3.2; the
   * sampler converts AU → km internally when it stores the override.
   */
  private applyEphemerisPush(msg: WsEphemerisPushMessage): void {
    if (this.ephemerisSampler) {
      for (const body of msg.bodies) {
        this.ephemerisSampler.applyPushFrame(body.naif_id, msg.epoch_jd, {
          x: body.x,
          y: body.y,
          z: body.z,
        });
      }
    }
    // Fan out to the existing T11 dispatcher (via the TimeEngine) so any
    // registered subscribers see the raw frame.
    this.timeEngine.handleWebSocketMessage(
      JSON.stringify({
        type: 'ephemeris_push',
        epoch_jd: msg.epoch_jd,
        bodies: msg.bodies,
      }),
    );
  }

  /**
   * T22 — surface a `data_version_update` notification. The HTTP caches
   * are flushed inside {@link CosmosWebSocket} itself (canonical
   * invalidation signal per Doc 27 §7.2); this handler only pushes a UI
   * toast so the user knows fresh data is available.
   */
  private handleDataVersionUpdate(msg: WsDataVersionUpdateMessage): void {
    useUIStore.getState().addNotification({
      severity: 'info',
      message: msg.message ?? `Data updated to ${msg.new_version}. Reload for the latest catalogue.`,
      ttlMs: 10_000,
    });
  }

  /**
   * Publish the camera's hot state into Zustand every frame (Doc 27 §6.4).
   * We call `setState` directly (not the store's action) so no subscribers
   * observe a double write, and we clone into plain objects because
   * `CameraState.position`/`rotation` are structurally typed primitives.
   */
  private publishCameraState(): void {
    const { position, quaternion, fov } = this.camera;
    useCameraStore.setState({
      position: { x: position.x, y: position.y, z: position.z },
      rotation: { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w },
      fov,
      targetDistance: this.controls.target.distanceTo(this.camera.position),
    });
    // T25 — feed the regime state machine the camera's physical distance
    // from the Sun. Scene units ↔ AU conversion is `sceneUnitsPerAU` (12
    // by default; matches `SolarSystemRenderer.orbitScale`). When T26
    // switches to strict 1:1 km scaling, flip this to `AU_KM` in one spot.
    const sceneUnitsPerAU = this.options.sceneUnitsPerAU ?? 12;
    const distanceScene = this.camera.position.length();
    const distanceAU = distanceScene / sceneUnitsPerAU;
    this.scaleRegime.update(distanceAU);
  }

  /**
   * T26 — fetch `/v1/tiles/manifest`, index star-tile centres, and
   * enqueue every tile through the streaming manager. The TileStreamingManager's
   * regime filter drops the enqueue silently when the active regime's
   * tile-kind set excludes stars — in that case the initial fetch
   * succeeds but no tile fetches dispatch until the user crosses into
   * the Stellar regime, at which point `setActiveRegime` re-pumps the
   * queue (`pump()` will find nothing because we enqueued early, but a
   * second manual `enqueue()` is cheap — left as a follow-up when real
   * per-viewport culling lands).
   *
   * Errors are surfaced as a uiStore notification. Silent fallback would
   * leave the user staring at a black sky with no diagnostics.
   */
  private async bootstrapStarTileStream(): Promise<void> {
    const tsm = this.tileStreaming;
    if (!tsm) return;
    const controller = new AbortController();
    this.starTileBootstrapAbort = controller;
    try {
      const manifest = await fetchManifest({ signal: controller.signal });
      const totalBytes = manifest.stars.tiles.reduce((acc, t) => acc + t.sizeBytes, 0);
      useTileStore.getState().setManifest({
        version: manifest.version,
        generatedAt: manifest.generatedAt,
        totalTiles: manifest.stars.totalTiles,
        totalBytes,
        lodLevels: manifest.stars.lodLevels,
      });
      // Stash each tile's absolute centre so `mountStarTile` can offset
      // record-relative positions. Addresses are namespaced with `stars/`
      // to match the TileStreamingManager's regime-filter prefix convention
      // (Doc 27 §9.3).
      // P3 — distance-based priority: the closer the tile centre is to the
      // camera, the higher the priority. The enqueue() call then pumps the
      // nearest tiles first so progressive streaming actually progresses
      // from what the user sees to what they'll see later.
      const camPos = this.camera.position;
      const hints = manifest.stars.tiles.map((entry) => {
        const fullAddress: TileAddress = `stars/${entry.address}`;
        const cx = 0.5 * (entry.bounds.min.x + entry.bounds.max.x);
        const cy = 0.5 * (entry.bounds.min.y + entry.bounds.max.y);
        const cz = 0.5 * (entry.bounds.min.z + entry.bounds.max.z);
        this.starTileCentres.set(fullAddress, { x: cx, y: cy, z: cz });
        const dx = cx - camPos.x;
        const dy = cy - camPos.y;
        const dz = cz - camPos.z;
        const distSq = dx * dx + dy * dy + dz * dz;
        // priority = 1 / (1 + distSq) — inversely proportional, bounded on
        // [0, 1]. Tiles right on the camera get ~1.0; tiles 10k units away
        // get ~1e-8 (still positive so they remain in the queue, just last
        // in line). Negligible-priority tiles are still important for
        // scroll-out smoothness.
        const priority = 1 / (1 + distSq);
        return {
          address: fullAddress,
          priority,
          estimatedSize: entry.sizeBytes,
        };
      });
      tsm.enqueue(hints);
      this.options.onStarTileManifestReady?.(manifest.stars.tiles);
    } catch (err) {
      if (controller.signal.aborted) return;
      // eslint-disable-next-line no-console
      console.warn('[SceneManager] star-tile manifest fetch failed', err);
      useUIStore.getState().addNotification({
        severity: 'warning',
        message: 'Star tile manifest unavailable — stellar-regime view may be empty.',
        ttlMs: 10_000,
      });
    }
  }

  /**
   * P3 — frustum-cull every mounted star tile and reweight queued hints by
   * camera distance. Called on a 4-frame cadence from the render loop.
   *
   * Two-pass:
   *   1. Compute the view frustum once from the current camera matrices.
   *   2. Pass the frustum to {@link StarTileRenderer.applyFrustumCulling}
   *      which flips `mesh.visible` per tile. Frustum bounding-sphere test
   *      uses the tile radius = 1.5 pc × sceneUnitsPerPc — comfortably
   *      covers the natural spread of a stars LOD-0 tile (~1 pc cubes).
   *   3. Re-sort the tile streaming queue: priority = 1 / (1 + distSq) so
   *      nearer tiles drain first, farther ones settle at the back.
   */
  private applyStarTileCulling(): void {
    if (!this.starTileField || !this.tileStreaming) return;
    this.tileCullMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse,
    );
    this.tileCullFrustum.setFromProjectionMatrix(this.tileCullMatrix);
    // 1.5 pc × 500 units/pc = 750 scene units — LOD-0 Gaia tiles are ~1 pc
    // on a side; 1.5× buffer absorbs edge-of-tile stars without a second
    // look-up per tile.
    const tileRadius = 1.5 * 500;
    this.starTileField.applyFrustumCulling(this.tileCullFrustum, tileRadius);

    // Queue reprioritization — only matters for tiles still pending, not
    // mounted ones. Priority function mirrors the bootstrap formula.
    const camPos = this.camera.position;
    const centres = this.starTileCentres;
    this.tileStreaming.reprioritize((address) => {
      const c = centres.get(address);
      if (!c) return undefined;
      const dx = c.x - camPos.x;
      const dy = c.y - camPos.y;
      const dz = c.z - camPos.z;
      return 1 / (1 + dx * dx + dy * dy + dz * dz);
    });
  }

  /**
   * T26 — TileStreamingManager callback. Decodes the tile into
   * `decodeStarTileToBuffers` inside the renderer and mounts the resulting
   * `THREE.Points`. Keyed by address so repeat loads are idempotent.
   */
  private mountStarTile(address: TileAddress, buffer: ArrayBuffer): void {
    if (!this.starTileField) return;
    const centre = this.starTileCentres.get(address);
    if (!centre) {
      // Tile arrived without a manifest entry — likely a WS-pushed tile
      // before the manifest finished loading, or a test harness that
      // bypassed the manifest. Fall back to tile-centre-at-origin so the
      // tile still renders (coords become absolute).
      this.starTileField.addTile(address, buffer, { x: 0, y: 0, z: 0 });
      return;
    }
    this.starTileField.addTile(address, buffer, centre);
  }

  /**
   * T25 — runs on regime transition. Publishes to the store, swaps the
   * tile-streaming filter, and forwards to the user callback. Keep it
   * cheap; this fires in the render-loop path via `update()`.
   */
  private onRegimeTransition(transition: RegimeTransition): void {
    useCameraStore.getState().setScaleRegime(transition.to);
    this.tileStreaming?.setActiveRegime(transition.to);
    // T46a — MW interior dissolves as the camera leaves the Stellar regime
    // so the external galaxy-spiral renderer (T46) can take over the MW
    // silhouette at Galactic scale. Uses per-frame damping so the transition
    // animates across the hysteresis band rather than snapping.
    this.milkyWayInterior?.setRegime(transition.to);
    // P4 — scale WASD base speed with the regime so the user can actually
    // traverse each scale band. Solar-system spans ~360u, stellar ~50k u,
    // galactic ~1e9 u, cosmic ~1e12 u — picking a single moveSpeed would
    // make 3 of the 4 regimes unusable.
    this.controls.setMoveSpeed(REGIME_MOVE_SPEED[transition.to]);
    // P4 — clamp orbit radius to the regime's float32-safe range so users
    // can't wheel-zoom into precision-loss territory (galaxy billboards
    // start jittering > 1e10 units). Takes effect next frame via the
    // clamp inside CameraController.update().
    this.controls.setDistanceClamp(
      REGIME_MIN_DISTANCE[transition.to],
      REGIME_MAX_DISTANCE[transition.to],
    );
    this.options.onRegimeChanged?.(transition);
  }

  // -- private -------------------------------------------------------------

  private readonly onContextLost = (event: Event): void => {
    // `preventDefault` opts into the recovery flow — without it the browser
    // doesn't fire `webglcontextrestored`.
    event.preventDefault();
    if (this.contextLost) return;
    this.contextLost = true;
    this.stop();
    useUIStore
      .getState()
      .setGlobalLoading(true, 'Restoring 3D view…');

    const timeoutMs = this.options.contextLossTimeoutMs ?? 10_000;
    this.contextLossTimeout = setTimeout(() => {
      if (!this.contextLost) return;
      useUIStore.getState().addNotification({
        severity: 'error',
        message: 'WebGL context could not be restored. Please reload the page.',
        ttlMs: null,
      });
    }, timeoutMs);
  };

  private readonly onContextRestored = (): void => {
    if (this.contextLossTimeout) {
      clearTimeout(this.contextLossTimeout);
      this.contextLossTimeout = null;
    }
    this.contextLost = false;
    for (const hook of this.gpuHooks) {
      try {
        hook.rebuildAfterContextRestore();
      } catch (error) {
        console.error('[SceneManager] GPU hook rebuild failed', error);
      }
    }
    useUIStore.getState().setGlobalLoading(false);
    // Resume the render loop — unless we were disposed during the outage.
    if (!this.disposed) this.start();
  };

  private handleResize = (): void => {
    const { width, height } = this.measureCanvas();
    this.resize(width, height);
  };

  private measureCanvas(): { width: number; height: number } {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width || this.canvas.clientWidth || 1));
    const height = Math.max(1, Math.floor(rect.height || this.canvas.clientHeight || 1));
    return { width, height };
  }
}

// ---------------------------------------------------------------------------
// T21 — ephemeris sampler event reporter
// ---------------------------------------------------------------------------

/**
 * De-duplicating log bridge for {@link EphemerisSampler} events. The sampler
 * is called per-body per-frame, so naive `console.warn` in the error branch
 * would flood the console if the backend were down. We log each body at most
 * once per error / throttle / restore cycle.
 */
const reportedErrorBodies = new Set<number>();
const reportedOkBodies = new Set<number>();
let loggedThrottle = false;

function reportEphemerisEvent(event: EphemerisSamplerEvent): void {
  if (!import.meta.env.DEV) return;
  switch (event.type) {
    case 'fetch-error':
      if (reportedErrorBodies.has(event.naifId)) return;
      reportedErrorBodies.add(event.naifId);
      reportedOkBodies.delete(event.naifId);
      console.warn(
        `[SceneManager] ephemeris fetch failed for NAIF ${event.naifId}; falling back to client-Kepler until recovery.`,
        event.error,
      );
      break;
    case 'fetch-ok':
      if (reportedOkBodies.has(event.naifId)) return;
      reportedOkBodies.add(event.naifId);
      if (reportedErrorBodies.delete(event.naifId)) {
        console.warn(`[SceneManager] ephemeris recovered for NAIF ${event.naifId}`);
      }
      break;
    case 'throttled':
      if (loggedThrottle) return;
      loggedThrottle = true;
      console.warn(
        `[SceneManager] ephemeris sampler throttled at ${event.playbackDaysPerSec.toFixed(0)} days/s — using Kepler fallback.`,
      );
      break;
    default:
      break;
  }
}
