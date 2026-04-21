/**
 * T49 — DOM-backed label overlay using three.js `CSS2DRenderer`.
 *
 * Consumers (ConstellationRenderer, future InfoPanel pin, T50 scene
 * composer) register a label via {@link EntityLabelOverlay.attach}. The
 * overlay ticks every frame from {@link SceneManager} and re-projects
 * each CSS2DObject through the active camera; HTML text sits on top of
 * the WebGL canvas and inherits DOM accessibility (labels live in the
 * a11y tree per Doc 16 §Labels + Screen Reader Support).
 *
 * Design notes:
 *  - One shared `CSS2DRenderer` DOM element mounted as a sibling of the
 *    WebGL canvas. `pointer-events: none` so picking still hits the GL
 *    layer; individual labels can opt into interaction by overriding the
 *    rule on their own element.
 *  - Labels are added to {@link EntityLabelOverlay.scene} (a standalone
 *    THREE.Scene, not the main render scene) so the overlay's render
 *    pass doesn't mutate the post-processing pipeline's active scene.
 *  - Distance-based visibility: each label carries an optional
 *    `showWithinUnits` radius. Below the threshold the label is shown;
 *    above it the label is hidden. This matches the Doc 24 §S-3 "labels
 *    appear as the camera approaches" affordance. `null` means always
 *    visible (constellation name labels).
 */

import * as THREE from 'three';
// Three ships CSS2DRenderer under examples/jsm; the type shim lives in
// @types/three so the import resolves without `// @ts-ignore`.
import {
  CSS2DObject,
  CSS2DRenderer,
} from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export interface EntityLabelOptions {
  /** Human-readable text shown in the label. Accepts plain text OR an
   *  HTML element reference (for complex layouts like
   *  `<span>α</span><br/>CMa`). */
  content: string | HTMLElement;
  /** World-space position (read once; call {@link LabelHandle.setPosition}
   *  to update after attach). */
  position: THREE.Vector3;
  /** Hide the label when the camera is farther than this many scene
   *  units from `position`. `null` / `undefined` ⇒ always show. */
  showWithinUnits?: number | null;
  /** Semantic class applied to the outer `<div>` for AETHER V4 styling
   *  hooks. Defaults to `cosmos-label`. */
  className?: string;
  /** a11y — screen readers read the text node by default; override with
   *  an explicit aria-label when the visible text isn't self-describing
   *  (e.g. a Greek-letter-only label). */
  ariaLabel?: string;
  /** CSS2DObject center (defaults to 0.5, 0.5 — label is anchored at
   *  centre). Set to 0, 1 to anchor at top-left per Three.js convention. */
  anchor?: { x: number; y: number };
}

export interface LabelHandle {
  readonly id: number;
  readonly object: CSS2DObject;
  /** Update visible text (plain-text fast path). */
  setText(text: string): void;
  /** Move the label in world space. */
  setPosition(x: number, y: number, z: number): void;
  /** Show/hide override (bypasses the distance gate). Pass `null` to
   *  resume distance-gated behaviour. */
  setVisibleOverride(visible: boolean | null): void;
  /** Update the distance gate (or disable with `null`). */
  setThreshold(units: number | null): void;
  /** Detach from the overlay + free the DOM node. */
  dispose(): void;
}

/** Per-label bookkeeping (not exposed). */
interface LabelRecord {
  readonly id: number;
  readonly object: CSS2DObject;
  readonly element: HTMLElement;
  showWithinUnits: number | null;
  visibleOverride: boolean | null;
  disposed: boolean;
}

export class EntityLabelOverlay {
  /** Standalone scene holding every CSS2DObject. Not merged into the
   *  main render scene so we can render the overlay AFTER post-processing
   *  without interfering with the GL pipeline's depth/blend state. */
  readonly scene: THREE.Scene;

  readonly renderer: CSS2DRenderer;

  private readonly labels = new Map<number, LabelRecord>();
  private nextId = 1;
  private attachedParent: HTMLElement | null = null;
  private disposed = false;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.name = 'CosmosLabelOverlay';

    this.renderer = new CSS2DRenderer();
    const el = this.renderer.domElement;
    el.classList.add('cosmos-label-overlay');
    el.style.position = 'absolute';
    el.style.top = '0';
    el.style.left = '0';
    el.style.pointerEvents = 'none';
    // Defensive: prevent the label layer from ever eating scroll /
    // touch events when labels are covering the HUD.
    el.style.overflow = 'hidden';
  }

  /** Insert the overlay DOM into the DOM tree. Call once per canvas
   *  mount. Safe to call when {@link SceneManager} boots before the
   *  canvas element has a parent — pass the eventual parent. */
  attach(parent: HTMLElement): void {
    if (this.disposed) return;
    if (this.attachedParent === parent) return;
    if (this.attachedParent) this.attachedParent.removeChild(this.renderer.domElement);
    parent.appendChild(this.renderer.domElement);
    this.attachedParent = parent;
  }

  detach(): void {
    if (!this.attachedParent) return;
    try {
      this.attachedParent.removeChild(this.renderer.domElement);
    } catch {
      // Already detached by React — safe to ignore.
    }
    this.attachedParent = null;
  }

  setSize(width: number, height: number): void {
    this.renderer.setSize(width, height);
  }

  /** Attach a label. Returns a handle the caller uses to update or
   *  dispose the label. */
  addLabel(opts: EntityLabelOptions): LabelHandle {
    const id = this.nextId++;

    const root = document.createElement('div');
    root.className = opts.className ?? 'cosmos-label';
    root.setAttribute('data-label-id', String(id));
    if (opts.ariaLabel) root.setAttribute('aria-label', opts.ariaLabel);

    if (typeof opts.content === 'string') {
      root.textContent = opts.content;
    } else {
      root.appendChild(opts.content);
    }

    const obj = new CSS2DObject(root);
    obj.position.copy(opts.position);
    if (opts.anchor) obj.center.set(opts.anchor.x, opts.anchor.y);

    this.scene.add(obj);

    const record: LabelRecord = {
      id,
      object: obj,
      element: root,
      showWithinUnits: opts.showWithinUnits ?? null,
      visibleOverride: null,
      disposed: false,
    };
    this.labels.set(id, record);

    const handle: LabelHandle = {
      id,
      object: obj,
      setText: (text) => {
        if (record.disposed) return;
        record.element.textContent = text;
      },
      setPosition: (x, y, z) => {
        if (record.disposed) return;
        record.object.position.set(x, y, z);
      },
      setVisibleOverride: (v) => {
        if (record.disposed) return;
        record.visibleOverride = v;
      },
      setThreshold: (u) => {
        if (record.disposed) return;
        record.showWithinUnits = u;
      },
      dispose: () => {
        if (record.disposed) return;
        record.disposed = true;
        this.scene.remove(record.object);
        record.element.remove();
        this.labels.delete(id);
      },
    };
    return handle;
  }

  /**
   * Frame update — called before {@link render}. Walks every label and
   * flips visibility based on camera distance vs. the label's threshold.
   * O(n) in labels; with typical n ≤ ~120 (88 constellation names + 30
   * named stars visible at once) this is free.
   */
  updateVisibility(cameraPosition: THREE.Vector3): void {
    for (const record of this.labels.values()) {
      if (record.disposed) continue;
      if (record.visibleOverride !== null) {
        record.object.visible = record.visibleOverride;
        continue;
      }
      if (record.showWithinUnits === null) {
        record.object.visible = true;
        continue;
      }
      const d = record.object.position.distanceTo(cameraPosition);
      record.object.visible = d <= record.showWithinUnits;
    }
  }

  /**
   * Paint the CSS2D layer over the WebGL canvas. Must be called every
   * frame AFTER the post-processing chain so the HTML text sits above
   * the GL output.
   */
  render(camera: THREE.Camera): void {
    if (this.disposed) return;
    this.renderer.render(this.scene, camera);
  }

  /** Number of live labels — test + telemetry helper. */
  getLabelCount(): number {
    return this.labels.size;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const record of [...this.labels.values()]) {
      record.disposed = true;
      this.scene.remove(record.object);
      record.element.remove();
    }
    this.labels.clear();
    this.detach();
  }
}
