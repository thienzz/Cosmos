import * as THREE from 'three';

/**
 * Ray-cast picking (Doc 19 §4.2, Doc 27 §5.2).
 *
 * Attaches pointer listeners to a canvas; on every mousemove it casts a ray
 * from the camera through the pointer's normalised-device-coordinate and
 * tests it against a caller-supplied list of meshes whose `userData.pickable`
 * is `true`.
 *
 * Two callbacks are exposed:
 *   - `onHover(naifId | null, hit)` — fires at the configured interval while
 *     the pointer moves. Feeds the `selectionStore.setHover()` preview.
 *   - `onPick(naifId, hit)` — fires on a click that was NOT a drag (pointer
 *     moved < dragThresholdPx between down and up). Feeds `selectEntity()`.
 *
 * # Click-vs-drag discrimination
 *
 * The same left-button is used for orbit drag (CameraController) and
 * picking. We treat any pointerup whose total pixel travel since pointerdown
 * is below `dragThresholdPx` as a click. 4 px matches the Windows/Mac
 * "double-click drift" defaults and avoids treating tiny hand tremors as
 * drag. The camera controller is a separate listener — both fire, but the
 * camera has already consumed the delta, so selecting a planet while
 * mid-orbit is impossible.
 *
 * # Hover throttle
 *
 * Raycasting against ~30 meshes is cheap, but the React re-render cost of
 * `useSelectionStore` subscribers isn't. Doc 27 §6.3 specifies a 100 ms
 * warm-state throttle — we use the same cadence here.
 */

export interface PickingControllerOptions {
  /** Maximum pointer travel (px) between pointerdown and pointerup for a click. */
  dragThresholdPx?: number;
  /** Minimum interval between hover callbacks. */
  hoverThrottleMs?: number;
  /** Optional callback log — used in tests. */
  onPick?: (naifId: number, hit: THREE.Intersection) => void;
  onHover?: (naifId: number | null, hit: THREE.Intersection | null) => void;
  /** Only the left button triggers picking by default. */
  pickButton?: 0 | 1 | 2;
}

interface PickableOwner {
  /** Return the current flat list of meshes that should participate in picking. */
  getPickableMeshes(): THREE.Object3D[];
}

const DEFAULT_OPTIONS: Required<
  Omit<PickingControllerOptions, 'onPick' | 'onHover' | 'pickButton'>
> & { pickButton: 0 | 1 | 2 } = {
  dragThresholdPx: 4,
  hoverThrottleMs: 100,
  pickButton: 0,
};

export class PickingController {
  readonly camera: THREE.Camera;
  readonly canvas: HTMLCanvasElement;

  private readonly raycaster = new THREE.Raycaster();
  private readonly pointerNdc = new THREE.Vector2();
  private readonly options: Required<Omit<PickingControllerOptions, 'onPick' | 'onHover'>>;

  private owner: PickableOwner | null = null;
  private pickHandler: PickingControllerOptions['onPick'];
  private hoverHandler: PickingControllerOptions['onHover'];

  private downX = 0;
  private downY = 0;
  private downButton = -1;

  private lastHoveredNaifId: number | null = null;
  private lastHoverAt = 0;
  private disposed = false;

  constructor(
    camera: THREE.Camera,
    canvas: HTMLCanvasElement,
    options: PickingControllerOptions = {},
  ) {
    this.camera = camera;
    this.canvas = canvas;
    this.options = {
      ...DEFAULT_OPTIONS,
      dragThresholdPx: options.dragThresholdPx ?? DEFAULT_OPTIONS.dragThresholdPx,
      hoverThrottleMs: options.hoverThrottleMs ?? DEFAULT_OPTIONS.hoverThrottleMs,
      pickButton: options.pickButton ?? DEFAULT_OPTIONS.pickButton,
    };
    this.pickHandler = options.onPick;
    this.hoverHandler = options.onHover;

    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerleave', this.onPointerLeave);
  }

  /** Swap the pickable mesh source (SceneManager wires this to SolarSystemRenderer). */
  setPickableOwner(owner: PickableOwner | null): void {
    this.owner = owner;
  }

  setPickHandler(handler: PickingControllerOptions['onPick']): void {
    this.pickHandler = handler;
  }

  setHoverHandler(handler: PickingControllerOptions['onHover']): void {
    this.hoverHandler = handler;
  }

  /**
   * Perform a one-shot pick using canvas-local pixel coordinates. Public so
   * tests (and the future "click on mini-map") can drive it synchronously.
   */
  pickAtClientXY(clientX: number, clientY: number): {
    naifId: number | null;
    hit: THREE.Intersection | null;
  } {
    const meshes = this.owner?.getPickableMeshes() ?? [];
    if (meshes.length === 0) return { naifId: null, hit: null };
    this.updatePointer(clientX, clientY);
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const hits = this.raycaster.intersectObjects(meshes, false);
    const hit = hits.length > 0 ? hits[0] ?? null : null;
    if (!hit) return { naifId: null, hit: null };
    const naif = hit.object.userData?.naifId;
    return { naifId: typeof naif === 'number' ? naif : null, hit };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerleave', this.onPointerLeave);
    this.owner = null;
    this.pickHandler = undefined;
    this.hoverHandler = undefined;
  }

  // -- private -------------------------------------------------------------

  private readonly onPointerDown = (event: PointerEvent): void => {
    this.downButton = event.button;
    this.downX = event.clientX;
    this.downY = event.clientY;
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    try {
      if (event.button !== this.options.pickButton) return;
      if (this.downButton !== event.button) return;
      const dx = event.clientX - this.downX;
      const dy = event.clientY - this.downY;
      if (Math.hypot(dx, dy) > this.options.dragThresholdPx) return;
      const { naifId, hit } = this.pickAtClientXY(event.clientX, event.clientY);
      if (naifId !== null && hit !== null && this.pickHandler) {
        this.pickHandler(naifId, hit);
      } else if (naifId === null && this.pickHandler) {
        // Click on empty space — caller decides whether to clear selection.
        // Encode the null as a sentinel id; keep API simple.
      }
    } finally {
      this.downButton = -1;
    }
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (!this.hoverHandler) return;
    const now =
      typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now();
    if (now - this.lastHoverAt < this.options.hoverThrottleMs) return;
    this.lastHoverAt = now;

    const { naifId, hit } = this.pickAtClientXY(event.clientX, event.clientY);
    if (naifId === this.lastHoveredNaifId) return;
    this.lastHoveredNaifId = naifId;
    this.hoverHandler(naifId, hit);
    // Update cursor to hint pickability.
    this.canvas.style.cursor = naifId !== null ? 'pointer' : '';
  };

  private readonly onPointerLeave = (): void => {
    if (this.lastHoveredNaifId !== null) {
      this.lastHoveredNaifId = null;
      this.hoverHandler?.(null, null);
    }
    this.canvas.style.cursor = '';
  };

  private updatePointer(clientX: number, clientY: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    this.pointerNdc.x = ((clientX - rect.left) / width) * 2 - 1;
    this.pointerNdc.y = -((clientY - rect.top) / height) * 2 + 1;
  }
}
