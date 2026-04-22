/**
 * T-V-61 — Standalone visual baseline capture entry.
 *
 * Bound to `apps/web/visual-capture.html`. Reads `?entId=ENT-NNNN` (and an
 * optional `?shader=key` fallback) from the URL, builds the corresponding
 * procedural material via `MaterialFactory`, mounts it on a unit sphere
 * under a fixed camera, settles for a deterministic dwell, and signals
 * `window.__captureReady = true` so the Playwright driver can screenshot.
 *
 * Why a separate page (not the main app)? The production search-fly path
 * (`SearchTargetMarker`) only resolves `GAL-/NEB-/EXO-/HIP-/STAR-/OC-/GC-/OB-`
 * prefixes — it has no branch for the canonical `ENT-NNNN` taxonomy IDs
 * used by the 262-row coverage fixture. Driving the full app would either
 * require a refactor of `SearchTargetMarker` (risky for a test scaffold) or
 * a brittle catalog-lookup pipeline. This isolated harness builds the
 * material directly, gives every shader the same framing, and runs in a
 * fraction of the time of a full app boot per capture.
 *
 * The dwell loop ticks `u_time` from 0 → SETTLE_SEC so animated shaders can
 * reach a representative frame. The final frame pins `u_time` to FIXED_TIME
 * so the screenshot is reproducible regardless of wall-clock jitter.
 */

import * as THREE from 'three';

import { createMaterialForEntity } from '@/engine/MaterialFactory';
import { buildCaptureMaterial } from '@/testHarness/visualCaptureRegistry';

const CANVAS_PX = 512;
const SETTLE_SEC = 0.4; // run animated shaders for this long before capture
const FIXED_TIME = 1.0; // deterministic u_time value stamped at capture
const CAMERA_Z = 2.6;

interface CaptureGlobals {
  __captureReady?: boolean;
  __captureError?: string;
  __captureShaderKey?: string;
}

const win = window as typeof window & CaptureGlobals;

const params = new URLSearchParams(window.location.search);
const entId = params.get('entId') ?? undefined;
const shaderHint = params.get('shader') ?? undefined;

const errorEl = document.getElementById('capture-error') as HTMLPreElement | null;
function reportError(message: string): never {
  if (errorEl) {
    errorEl.hidden = false;
    errorEl.textContent = message;
  }
  win.__captureError = message;
  win.__captureReady = true; // unblock Playwright so it can read the error
  throw new Error(message);
}

function buildMaterial(): { material: THREE.ShaderMaterial; shaderKey: string } {
  // Prefer the capture registry — it routes each shader through its
  // dedicated builder so the resulting material has Doc-accurate palette
  // and parameter uniforms (not just the bare MaterialFactory defaults).
  if (shaderHint) {
    const r = buildCaptureMaterial(shaderHint, entId);
    return { material: r.material, shaderKey: r.shaderKey };
  }
  if (entId) {
    // No shader hint from the URL — fall back to MaterialFactory's
    // ENT-ID resolution. Some palette uniforms will be missing, but
    // Tier B `#define`s still apply.
    try {
      return createMaterialForEntity({ ent_id: entId });
    } catch {
      // fall through
    }
  }
  reportError(
    'visualCaptureEntry: missing query param — supply ?entId=ENT-NNNN or ?shader=key',
  );
}

const canvas = document.getElementById('capture-canvas') as HTMLCanvasElement | null;
if (!canvas) reportError('visualCaptureEntry: #capture-canvas missing in DOM');

const renderer = new THREE.WebGLRenderer({
  canvas: canvas as HTMLCanvasElement,
  antialias: true,
  alpha: false,
  preserveDrawingBuffer: true,
});
renderer.setSize(CANVAS_PX, CANVAS_PX, false);
renderer.setPixelRatio(1);
renderer.setClearColor(0x000000, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
camera.position.set(0, 0, CAMERA_Z);
camera.lookAt(0, 0, 0);

let material: THREE.ShaderMaterial;
let shaderKey: string;
try {
  const built = buildMaterial();
  material = built.material;
  shaderKey = built.shaderKey;
} catch (err) {
  reportError(`visualCaptureEntry: ${(err as Error).message}`);
}

win.__captureShaderKey = shaderKey;

const geometry = new THREE.SphereGeometry(1, 96, 96);
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);

function setUniformTime(t: number): void {
  const u = material.uniforms;
  if (u.u_time) (u.u_time as { value: number }).value = t;
  if (u.uTime) (u.uTime as { value: number }).value = t;
  if (u.time) (u.time as { value: number }).value = t;
}

const startMs = performance.now();

function tick(): void {
  const elapsed = (performance.now() - startMs) / 1000;
  if (elapsed < SETTLE_SEC) {
    setUniformTime(elapsed);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
    return;
  }
  // Final pinned-time frame for reproducibility.
  setUniformTime(FIXED_TIME);
  renderer.render(scene, camera);
  win.__captureReady = true;
}

requestAnimationFrame(tick);
