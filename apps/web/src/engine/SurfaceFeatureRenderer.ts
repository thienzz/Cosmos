import * as THREE from 'three';

import {
  IAU_NOMENCLATURE,
  featuresOf,
  unitSphereVector,
  type SurfaceFeature,
} from '@/data/iauNomenclature';

import type { GpuLifecycleHook } from './gpuLifecycle';

/**
 * Surface-feature renderer for IAU planetary nomenclature (T39, Doc 23 §8).
 *
 * Renders a small marker dot at each named feature's planetographic
 * (lat, lon) position projected onto the parent body's sphere. Markers
 * stay hidden until the camera is within {@link visibilityDistanceUnits}
 * of the body's centre — Doc 23 calls out that nomenclature ingest must
 * happen but rendering is per-body and only "when zoom is close enough".
 *
 * # Per-body lifecycle
 *
 * The renderer holds a Map<naifId, FeatureGroup> so the SolarSystemRenderer
 * can attach feature groups to its planet `THREE.Group`s. Each group
 * carries a single `THREE.Points` cloud — fast to mount/unmount even with
 * the full 15k catalog, since geometry + material live in JS land until a
 * group is added to the scene.
 *
 * # Zoom gating
 *
 * Each frame, given the camera world position, the renderer measures the
 * distance from each feature group's parent (`group.parent`) to the camera
 * and toggles `group.visible` accordingly. Groups that haven't been
 * attached to a parent are skipped silently (they're harmless).
 */

export interface SurfaceFeatureRendererOptions {
  /**
   * Distance in scene units below which features become visible. Default
   * 8 — slightly larger than the default Earth visual radius (~0.6 units)
   * so markers appear before the user lands on the body.
   */
  visibilityDistanceUnits?: number;
  /** Marker dot colour. Default phosphor cyan. */
  markerColor?: string;
  /** Marker dot pixel size. Default 6. */
  markerSizePx?: number;
  /** Override which body NAIF ids get features (defaults to all in catalog). */
  bodyNaifIds?: readonly number[];
}

export interface SurfaceFeatureGroupHandle {
  readonly parentNaifId: number;
  /** The Three.js group to attach to the body's transform. */
  readonly group: THREE.Group;
  /** The flat list of features rendered in this group, in cloud order. */
  readonly features: readonly SurfaceFeature[];
}

const DEFAULT_VISIBILITY_DISTANCE = 8.0;
const DEFAULT_COLOR = '#3fe0ff';
const DEFAULT_SIZE_PX = 4;

/**
 * Build a small circular alpha-mask texture so PointsMaterial renders
 * round dots instead of hard 6×6 pixel squares. At close zoom those
 * squares painted across the planet surface like bright patches (user
 * report: "Venus có các ô vuông trắng kỳ cục"). One shared texture is
 * enough for every marker type.
 */
let sharedDotTexture: THREE.Texture | null = null;
function getDotTexture(): THREE.Texture | null {
  if (sharedDotTexture) return sharedDotTexture;
  if (typeof document === 'undefined') return null;
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx || typeof ctx.createRadialGradient !== 'function') return null;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0.0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.85)');
  g.addColorStop(0.8, 'rgba(255,255,255,0.1)');
  g.addColorStop(1.0, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  sharedDotTexture = tex;
  return tex;
}

export class SurfaceFeatureRenderer implements GpuLifecycleHook {
  private readonly handles: Map<number, SurfaceFeatureGroupHandle> = new Map();
  private readonly disposables: { dispose(): void }[] = [];
  private readonly visibilityDistance: number;
  private readonly markerColor: THREE.Color;
  private readonly markerSizePx: number;
  private readonly tmpCameraPos = new THREE.Vector3();
  private readonly tmpBodyPos = new THREE.Vector3();

  constructor(options: SurfaceFeatureRendererOptions = {}) {
    this.visibilityDistance = options.visibilityDistanceUnits ?? DEFAULT_VISIBILITY_DISTANCE;
    this.markerColor = new THREE.Color(options.markerColor ?? DEFAULT_COLOR);
    this.markerSizePx = options.markerSizePx ?? DEFAULT_SIZE_PX;

    // Build a feature group per parent body that has any features.
    const parentIds = new Set<number>(
      options.bodyNaifIds ?? IAU_NOMENCLATURE.map((f) => f.parentNaifId),
    );
    for (const parentId of parentIds) {
      const features = featuresOf(parentId);
      if (features.length === 0) continue;
      this.handles.set(parentId, this.buildGroup(parentId, features));
    }
  }

  /** Get the handle for a body so the SolarSystemRenderer can parent it. */
  getHandle(parentNaifId: number): SurfaceFeatureGroupHandle | null {
    return this.handles.get(parentNaifId) ?? null;
  }

  /** All registered handles — used by integration code that mounts them. */
  allHandles(): readonly SurfaceFeatureGroupHandle[] {
    return Array.from(this.handles.values());
  }

  /**
   * Per-frame zoom gating. Pass the camera's world position; the renderer
   * walks each handle, computes its parent's world position, and toggles
   * `visible` based on distance.
   */
  update(cameraWorldPos: THREE.Vector3): void {
    this.tmpCameraPos.copy(cameraWorldPos);
    const limit = this.visibilityDistance;
    const limitSq = limit * limit;
    // P2F — hide markers when the camera is so close it's inside or right
    // against the body's visual radius. Without this the dots paste over
    // the whole hemisphere and read as bright square patches at extreme
    // zoom. 0.6 u chosen because that's roughly the default body floor;
    // bodies smaller than the floor (most rocky planets) still show dots
    // at moderate zoom.
    const nearCutoffSq = 0.6 * 0.6;
    for (const handle of this.handles.values()) {
      const parent = handle.group.parent;
      if (!parent) {
        handle.group.visible = false;
        continue;
      }
      parent.getWorldPosition(this.tmpBodyPos);
      const distSq = this.tmpBodyPos.distanceToSquared(this.tmpCameraPos);
      handle.group.visible = distSq <= limitSq && distSq >= nearCutoffSq;
    }
  }

  /**
   * Resolve the world-space position of a named feature, given its parent
   * body's current world transform. Returns `null` if no group exists for
   * the parent (e.g. caller never registered IAU features for that body).
   */
  getFeatureWorldPosition(
    parentNaifId: number,
    featureName: string,
    bodyRadiusUnits: number,
    out?: THREE.Vector3,
  ): THREE.Vector3 | null {
    const handle = this.handles.get(parentNaifId);
    if (!handle) return null;
    const feature = handle.features.find((f) => f.name === featureName);
    if (!feature) return null;
    const v = unitSphereVector(feature.lat_deg, feature.lon_deg);
    const target = out ?? new THREE.Vector3();
    target.set(v.x, v.y, v.z).multiplyScalar(bodyRadiusUnits);
    handle.group.localToWorld(target);
    return target;
  }

  rebuildAfterContextRestore(): void {
    for (const handle of this.handles.values()) {
      for (const child of handle.group.children) {
        const points = child as THREE.Points;
        const material = points.material as THREE.Material;
        material.needsUpdate = true;
      }
    }
  }

  dispose(): void {
    for (const d of this.disposables) d.dispose();
    this.disposables.length = 0;
    this.handles.clear();
  }

  // -------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------

  private buildGroup(
    parentNaifId: number,
    features: readonly SurfaceFeature[],
  ): SurfaceFeatureGroupHandle {
    const positions = new Float32Array(features.length * 3);
    for (let i = 0; i < features.length; i++) {
      const f = features[i];
      const v = unitSphereVector(f.lat_deg, f.lon_deg);
      // Lift slightly above the unit sphere so markers don't z-fight with
      // the body surface. The body's visual radius scales the local
      // coordinate system at mount time, so a 1.005 multiplier here keeps
      // the marker hovering 0.5% above any radius.
      positions[i * 3]     = v.x * 1.005;
      positions[i * 3 + 1] = v.y * 1.005;
      positions[i * 3 + 2] = v.z * 1.005;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1.5);
    // P2F — circular alpha-mask + additive blending so the dots look like
    // soft glowing pips rather than hard square pixel blocks.
    const material = new THREE.PointsMaterial({
      color: this.markerColor,
      size: this.markerSizePx,
      sizeAttenuation: false,
      map: getDotTexture() ?? undefined,
      alphaTest: 0.05,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geometry, material);
    points.name = `Nomenclature:${parentNaifId}:dots`;
    const group = new THREE.Group();
    group.name = `Nomenclature:${parentNaifId}`;
    group.add(points);
    group.visible = false;
    this.disposables.push({
      dispose: () => {
        geometry.dispose();
        material.dispose();
      },
    });
    return { parentNaifId, group, features };
  }
}
