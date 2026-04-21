/**
 * T49 — Constellation lines + IAU 88 + named-star labels.
 *
 * Builds:
 *   - a single {@link THREE.LineSegments} containing every curated asterism
 *     line, projected onto a celestial sphere of radius {@link ConstellationRendererOptions.sphereRadius};
 *   - one {@link LabelHandle} per constellation for the centroid-anchored
 *     name label (AETHER V4 Press Start 2P heading, amber phosphor glow);
 *   - one {@link LabelHandle} per IAU-named star for the Bayer + common-name
 *     callout (AETHER V4 IBM Plex Mono data style, cyan glow), with a
 *     distance-gated show-threshold so clutter doesn't pile up in the
 *     cosmic regime.
 *
 * Refs: Doc 23 §17 (Hipparcos + bright-star catalogues), Doc 33 §8.3
 *       (completeness audit), Doc 16 §Labels + Screen Reader Support,
 *       Doc 24 §2.4/3.1/3.2 (AETHER V4 typography + phosphor glow).
 *
 * Design notes:
 *  - Stars live at 3D parallax distances ranging over 9 orders of
 *    magnitude. Connecting them through true 3D space produces ugly
 *    sloped segments that look nothing like the sky figures users expect.
 *    We project every endpoint onto a single celestial sphere so the
 *    stick-figures read correctly from any camera pose that brackets the
 *    origin. This mirrors how Stellarium / Celestia / Astropy draw them.
 *  - The sphere's radius is picked large enough to sit *behind* every
 *    solar-system body at display scale (outer planets at ~60u for
 *    `orbitScale=12`) and in front of the T29 CMB boundary sphere at
 *    800u. Default: 600.
 *  - Labels live in `EntityLabelOverlay` (a CSS2DRenderer-backed DOM
 *    layer) so their a11y tree inheritance is automatic per Doc 16.
 */

import * as THREE from 'three';

import {
  CONSTELLATION_LINES,
  IAU_CONSTELLATIONS,
  IAU_NAMED_STARS,
  type ConstellationMeta,
  type IauNamedStar,
} from '@/data/constellations';

import { type EntityLabelOverlay, type LabelHandle } from './EntityLabelOverlay';
import type { GpuLifecycleHook } from './gpuLifecycle';

export interface ConstellationRendererOptions {
  /** Celestial sphere radius (scene units). Default 600 — sits behind the
   *  T14 solar system at display scale but inside the CMB boundary. */
  sphereRadius?: number;
  /** Line colour. AETHER V4 neon cyan (Doc 24 §3.2). */
  lineColorHex?: string;
  /** Line opacity. 0.35 reads as a translucent UI overlay against the
   *  star field without overwhelming the actual stars. */
  lineOpacity?: number;
  /** Named-star label distance gate (scene units). When the camera is
   *  farther than this from a label's anchor, the label hides. Default
   *  null — always visible. Per T49 spec, "Label overlay for Sirius
   *  visible at d < 10 pc from star" — the solar-system display uses
   *  `sphereRadius` scene-units = "at this regime, always show". */
  starLabelThresholdUnits?: number | null;
  /** Constellation-name label anchor distance gate. Always shown in v1. */
  constellationLabelThresholdUnits?: number | null;
  /** Group name for dev-tools walks. */
  groupName?: string;
  /** Hide the named-star label layer. Used by tests + the future
   *  uiStore.showLabels HUD toggle so lines and labels can be toggled
   *  independently. */
  showStarLabels?: boolean;
  /** Hide the constellation-name label layer. */
  showConstellationLabels?: boolean;
}

const DEG_TO_RAD = Math.PI / 180;

/** Convert (RA, Dec) in degrees to a world position on a sphere of
 *  `radius` centred on the scene origin. ICRS convention matches
 *  {@link icrsToCartesian} in `@cosmos/coordinate-utils` (z = sin δ). */
function projectOnSphere(raDeg: number, decDeg: number, radius: number): THREE.Vector3 {
  const ra = raDeg * DEG_TO_RAD;
  const dec = decDeg * DEG_TO_RAD;
  const cosDec = Math.cos(dec);
  return new THREE.Vector3(
    radius * cosDec * Math.cos(ra),
    radius * cosDec * Math.sin(ra),
    radius * Math.sin(dec),
  );
}

/** Render-time bookkeeping per named-star label so we can refresh
 *  `visibilityOverride` / text without rebuilding the overlay. */
interface NamedStarLabelEntry {
  readonly star: IauNamedStar;
  readonly labelHandle: LabelHandle;
}

/** Bookkeeping per constellation name label. */
interface ConstellationLabelEntry {
  readonly constellation: ConstellationMeta;
  readonly labelHandle: LabelHandle;
}

export class ConstellationRenderer implements GpuLifecycleHook {
  readonly group: THREE.Group;

  private readonly lineSegments: THREE.LineSegments;
  private readonly lineMaterial: THREE.LineBasicMaterial;
  private readonly lineGeometry: THREE.BufferGeometry;
  private readonly sphereRadius: number;

  private readonly constellationLabels: ConstellationLabelEntry[] = [];
  private readonly namedStarLabels: NamedStarLabelEntry[] = [];

  private disposed = false;

  constructor(overlay: EntityLabelOverlay, options: ConstellationRendererOptions = {}) {
    this.sphereRadius = options.sphereRadius ?? 600;
    const lineColor = new THREE.Color(options.lineColorHex ?? '#00e5ff'); // AETHER V4 data-cyan
    const lineOpacity = options.lineOpacity ?? 0.35;

    this.group = new THREE.Group();
    this.group.name = options.groupName ?? 'ConstellationRenderer';
    // Stars + nebulae + galaxies live at smaller scene distances at the
    // default regime; render constellation lines early so the additive
    // blend doesn't occlude them.
    this.group.renderOrder = -3;

    // --- Build LineSegments ---
    const vertices: number[] = [];
    for (const constellation of CONSTELLATION_LINES) {
      for (const segment of constellation.segments) {
        const [ra1, dec1, ra2, dec2] = segment;
        const p1 = projectOnSphere(ra1, dec1, this.sphereRadius);
        const p2 = projectOnSphere(ra2, dec2, this.sphereRadius);
        vertices.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
      }
    }

    this.lineGeometry = new THREE.BufferGeometry();
    this.lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    this.lineMaterial = new THREE.LineBasicMaterial({
      color: lineColor,
      transparent: true,
      opacity: lineOpacity,
      depthWrite: false,
      depthTest: false, // draw on top of the starfield always (spherical overlay)
      blending: THREE.AdditiveBlending,
    });

    this.lineSegments = new THREE.LineSegments(this.lineGeometry, this.lineMaterial);
    this.lineSegments.name = 'ConstellationLines';
    this.lineSegments.frustumCulled = false;
    this.group.add(this.lineSegments);

    // --- Constellation-name labels ---
    const showConstellationLabels = options.showConstellationLabels ?? true;
    if (showConstellationLabels) {
      for (const constellation of IAU_CONSTELLATIONS) {
        const position = projectOnSphere(
          constellation.centroidRaDeg,
          constellation.centroidDecDeg,
          this.sphereRadius * 0.98, // pull slightly inside the line sphere
        );
        const root = buildConstellationLabelDom(constellation);
        const handle = overlay.addLabel({
          content: root,
          position,
          className: 'cosmos-label cosmos-label--constellation',
          ariaLabel: `Constellation ${constellation.name}`,
          showWithinUnits: options.constellationLabelThresholdUnits ?? null,
        });
        this.constellationLabels.push({ constellation, labelHandle: handle });
      }
    }

    // --- Named-star labels ---
    const showStarLabels = options.showStarLabels ?? true;
    if (showStarLabels) {
      for (const star of IAU_NAMED_STARS) {
        const position = projectOnSphere(star.raDeg, star.decDeg, this.sphereRadius * 0.99);
        const root = buildNamedStarLabelDom(star);
        const ariaPieces = [star.name];
        if (star.bayer) ariaPieces.push(`Bayer designation ${star.bayer}`);
        ariaPieces.push(`in ${star.constellation}`);
        const handle = overlay.addLabel({
          content: root,
          position,
          className: 'cosmos-label cosmos-label--star',
          ariaLabel: ariaPieces.join(', '),
          showWithinUnits: options.starLabelThresholdUnits ?? null,
        });
        this.namedStarLabels.push({ star, labelHandle: handle });
      }
    }
  }

  /** Show / hide the entire constellation layer (line + name labels +
   *  named-star labels). Wired to `uiStore.showConstellationLines`. */
  setVisible(visible: boolean): void {
    this.group.visible = visible;
    for (const entry of this.constellationLabels) entry.labelHandle.setVisibleOverride(visible ? null : false);
    for (const entry of this.namedStarLabels) entry.labelHandle.setVisibleOverride(visible ? null : false);
  }

  /** Independently toggle only the constellation-name labels. */
  setConstellationLabelsVisible(visible: boolean): void {
    for (const entry of this.constellationLabels) {
      entry.labelHandle.setVisibleOverride(visible ? null : false);
    }
  }

  /** Independently toggle only the named-star labels. */
  setStarLabelsVisible(visible: boolean): void {
    for (const entry of this.namedStarLabels) {
      entry.labelHandle.setVisibleOverride(visible ? null : false);
    }
  }

  /** T49 verification + search fly-to — resolve a star reference back to
   *  its sky position. Returns null if no match. Accepts IAU name,
   *  Bayer designation, or Hipparcos id. */
  findNamedStarPosition(query: string | number): {
    star: IauNamedStar;
    position: THREE.Vector3;
  } | null {
    for (const entry of this.namedStarLabels) {
      const s = entry.star;
      if (typeof query === 'number') {
        if (s.hip === query) {
          return { star: s, position: entry.labelHandle.object.position.clone() };
        }
      } else {
        const q = query.trim().toLowerCase();
        if (
          s.name.toLowerCase() === q ||
          (s.bayer !== null && s.bayer.toLowerCase() === q)
        ) {
          return { star: s, position: entry.labelHandle.object.position.clone() };
        }
      }
    }
    return null;
  }

  /** Telemetry / test helper — how many figure segments ended up in the
   *  LineSegments buffer. */
  getSegmentCount(): number {
    const position = this.lineGeometry.getAttribute('position') as THREE.BufferAttribute | undefined;
    if (!position) return 0;
    // Two vertices per segment.
    return Math.floor(position.count / 2);
  }

  getConstellationLabelCount(): number {
    return this.constellationLabels.length;
  }

  getStarLabelCount(): number {
    return this.namedStarLabels.length;
  }

  rebuildAfterContextRestore(): void {
    // Line material only references a vertex colour + opacity; flagging
    // needsUpdate lets Three.js re-upload when the GL context comes back.
    this.lineMaterial.needsUpdate = true;
    const position = this.lineGeometry.getAttribute('position') as THREE.BufferAttribute | undefined;
    if (position) position.needsUpdate = true;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const entry of this.constellationLabels) entry.labelHandle.dispose();
    this.constellationLabels.length = 0;
    for (const entry of this.namedStarLabels) entry.labelHandle.dispose();
    this.namedStarLabels.length = 0;
    this.group.remove(this.lineSegments);
    this.lineGeometry.dispose();
    this.lineMaterial.dispose();
  }
}

// ---------------------------------------------------------------------------
// DOM builders (AETHER V4 styling — mounted via EntityLabelOverlay)
// ---------------------------------------------------------------------------

function buildConstellationLabelDom(constellation: ConstellationMeta): HTMLElement {
  const root = document.createElement('div');
  root.className = 'cosmos-label__constellation-inner';
  // Placed inline so we don't need a separate stylesheet contribution in
  // v1; T50 + Doc 24 §S-3 will graduate these to `cosmos-ui.css`.
  root.style.cssText = [
    "font-family: 'Press Start 2P', 'IBM Plex Mono', monospace",
    'font-size: 10px',
    'letter-spacing: 1.5px',
    'color: #fbbf24',
    'text-shadow: 0 0 8px rgba(251,191,36,0.6)',
    'white-space: nowrap',
    'text-transform: uppercase',
    'opacity: 0.75',
    'user-select: none',
  ].join(';');
  root.textContent = constellation.abbr.toUpperCase();
  // Title tooltip for hover details — hands-off; pointer-events are
  // none per EntityLabelOverlay, so the tooltip shows only when the
  // user activates it via screen reader.
  root.title = `${constellation.name} (${constellation.genitive})`;
  return root;
}

function buildNamedStarLabelDom(star: IauNamedStar): HTMLElement {
  const root = document.createElement('div');
  root.className = 'cosmos-label__star-inner';
  root.style.cssText = [
    "font-family: 'IBM Plex Mono', 'Space Mono', monospace",
    'font-size: 11px',
    'color: #00e5ff',
    'text-shadow: 0 0 6px rgba(0,229,255,0.7)',
    'white-space: nowrap',
    'user-select: none',
    'line-height: 1.2',
  ].join(';');

  // If we have a Bayer designation, stack it above the common name.
  if (star.bayer) {
    const bayerLine = document.createElement('div');
    bayerLine.style.cssText = 'font-size: 10px; opacity: 0.7';
    bayerLine.textContent = star.bayer;
    root.appendChild(bayerLine);
  }

  const nameLine = document.createElement('div');
  nameLine.style.cssText = 'font-weight: 600';
  nameLine.textContent = star.name;
  root.appendChild(nameLine);

  return root;
}
