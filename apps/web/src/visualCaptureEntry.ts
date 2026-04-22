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
import {
  buildCaptureMaterial,
  type CaptureGeometry,
  type CaptureMaterial,
} from '@/testHarness/visualCaptureRegistry';

const CANVAS_PX = 512;
const SETTLE_SEC = 1.0; // run animated shaders for this long before capture
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

function buildMaterial(): CaptureMaterial {
  // Prefer the capture registry — it routes each shader through its
  // dedicated builder so the resulting material has Doc-accurate palette
  // and parameter uniforms (not just the bare MaterialFactory defaults).
  if (shaderHint) {
    return buildCaptureMaterial(shaderHint, entId);
  }
  if (entId) {
    // No shader hint from the URL — fall back to MaterialFactory's
    // ENT-ID resolution. Some palette uniforms will be missing, but
    // Tier B `#define`s still apply.
    try {
      const r = createMaterialForEntity({ ent_id: entId });
      return { material: r.material, shaderKey: r.shaderKey, geometry: 'sphere' };
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

let built: CaptureMaterial;
try {
  built = buildMaterial();
} catch (err) {
  reportError(`visualCaptureEntry: ${(err as Error).message}`);
}
const material = built.material;
const shaderKey = built.shaderKey;
const geometryKind = built.geometry;

win.__captureShaderKey = shaderKey;

function buildMesh(kind: CaptureGeometry): THREE.Object3D {
  switch (kind) {
    case 'box-raymarch': {
      // Volumetric raymarch — camera sits OUTSIDE the box at +Z, looks at
      // origin. Don't touch material.side — exotic/nebula builders set it
      // to DoubleSide intentionally so the front faces register hits even
      // when the box's bounding volume occludes itself.
      const geom = new THREE.BoxGeometry(2, 2, 2);
      return new THREE.Mesh(geom, material);
    }
    case 'plane': {
      // Screen-aligned billboard — fills most of the view from the
      // default camera position (CAMERA_Z ≈ 2.6, FOV 45°). Leave
      // material.side alone (most plane shaders default to FrontSide
      // and depthTest=true; flipping causes culling artefacts).
      const geom = new THREE.PlaneGeometry(2.2, 2.2);
      return new THREE.Mesh(geom, material);
    }
    case 'tilted-plane': {
      // Plane shader (reads v_uv) but tilted away from the camera so the
      // canvas shows it as a 3D sheet rather than a flat square stamp.
      // Sized smaller (1.4×1.4) so there's visible black margin around
      // the wall — important for shaders like lss-great-wall whose
      // texture-fill effect would otherwise read as a square pattern.
      const geom = new THREE.PlaneGeometry(1.4, 1.4);
      const m = new THREE.Mesh(geom, material);
      m.rotation.set(-0.45, 0.7, 0); // tilt + yaw
      material.side = THREE.DoubleSide;
      return m;
    }
    case 'fullscreen-quad': {
      // Render a true fullscreen quad — bypass camera projection by using
      // an ortho setup. Currently unused (all 'plane' cases tile well
      // enough under the perspective camera); kept for future shaders.
      const geom = new THREE.PlaneGeometry(2, 2);
      material.side = THREE.DoubleSide;
      material.depthTest = false;
      return new THREE.Mesh(geom, material);
    }
    case 'points': {
      // Scatter 512 particles in a unit cube — enough for cluster/field
      // shaders to paint something non-trivial.
      const count = 512;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 0] = (Math.random() - 0.5) * 1.6;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 1.6;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 1.6;
      }
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      return new THREE.Points(geom, material);
    }
    case 'small-sphere': {
      // Radius 0.5 — for shaders whose density shell only fires at
      // length(v_modelPos) < 1 (transient fireballs, lss-void NFW).
      const geom = new THREE.SphereGeometry(0.5, 64, 64);
      return new THREE.Mesh(geom, material);
    }
    case 'comet': {
      // Inline NamedCometRenderer-style composite — 4 meshes sharing
      // one ShaderMaterial, each switching `u_component` via
      // onBeforeRender. Smallbody-comet shader expects an `a_tailCoord`
      // vec2 attribute on the tail ribbons + the per-component switch.
      const buildRibbon = (uSeg: number, vSeg: number): THREE.BufferGeometry => {
        const positions: number[] = [];
        const tailCoord: number[] = [];
        const indices: number[] = [];
        for (let u = 0; u <= uSeg; u++) {
          for (let v = 0; v <= vSeg; v++) {
            const uu = u / uSeg;
            const vv = v / vSeg;
            positions.push(uu, vv, 0);
            tailCoord.push(uu, vv);
          }
        }
        const stride = vSeg + 1;
        for (let u = 0; u < uSeg; u++) {
          for (let v = 0; v < vSeg; v++) {
            const a = u * stride + v;
            indices.push(a, a + 1, a + stride, a + 1, a + stride + 1, a + stride);
          }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        g.setAttribute(
          'a_tailCoord',
          new THREE.Float32BufferAttribute(tailCoord, 2),
        );
        g.setIndex(indices);
        g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e9);
        return g;
      };
      // Seed comet-specific uniforms — NamedCometRenderer normally sets
      // these per-frame; the capture page only needs static-frame values.
      const u = material.uniforms as Record<string, { value: unknown }>;
      const ensure = (k: string, v: unknown): void => {
        if (u[k]) u[k]!.value = v;
        else u[k] = { value: v };
      };
      ensure('u_sunDirection', new THREE.Vector3(0, 0, -1)); // anti-camera
      ensure('u_tailLengthScene', 1.6);
      ensure('u_tailWidthScene', 0.18);
      ensure('u_nucleusRadius', 0.06);
      ensure('u_activity', 0.85);
      ensure('u_ionCurl', 0.12);
      ensure('u_component', 0);
      // Only seed comet colours when injectCaptureDefaults didn't
      // already populate them — overwriting would erase the per-ENT
      // hue variation that gives each comet a distinct baseline.
      const setIfAbsent = (k: string, hex: string): void => {
        if (u[k]) return;
        u[k] = { value: new THREE.Color(hex) };
      };
      setIfAbsent('u_nucleusColour', '#1a1a2e');
      setIfAbsent('u_dustColour',    '#f5e6d3');
      setIfAbsent('u_ionColour',     '#4a8fc8');
      setIfAbsent('u_comaColour',    '#9fbf9f');

      material.transparent = true;
      material.depthWrite = false;
      material.blending = THREE.AdditiveBlending;

      const group = new THREE.Group();
      group.name = 'CapturedComet';
      // Set u_component on the SHARED material right before each draw.
      const dust = new THREE.Mesh(buildRibbon(16, 4), material);
      dust.frustumCulled = false;
      dust.renderOrder = 0;
      dust.onBeforeRender = () => {
        (material.uniforms.u_component as { value: number }).value = 1;
      };
      const ion = new THREE.Mesh(buildRibbon(16, 4), material);
      ion.frustumCulled = false;
      ion.renderOrder = 1;
      ion.onBeforeRender = () => {
        (material.uniforms.u_component as { value: number }).value = 2;
      };
      const coma = new THREE.Mesh(buildRibbon(1, 1), material);
      coma.frustumCulled = false;
      coma.renderOrder = 2;
      coma.onBeforeRender = () => {
        (material.uniforms.u_component as { value: number }).value = 3;
      };
      const nucleus = new THREE.Mesh(buildRibbon(1, 1), material);
      nucleus.frustumCulled = false;
      nucleus.renderOrder = 3;
      nucleus.onBeforeRender = () => {
        (material.uniforms.u_component as { value: number }).value = 0;
      };
      group.add(dust, ion, coma, nucleus);
      return group;
    }
    case 'sphere':
    default: {
      const geom = new THREE.SphereGeometry(1, 96, 96);
      return new THREE.Mesh(geom, material);
    }
  }
}

const mesh = buildMesh(geometryKind);
scene.add(mesh);

// Precompute per-frame tick context — most fields are static over the
// capture. sunDirWorld picks a generic 3/4-angle so planet/moon/star
// shaders that shade against it get a non-polar illumination pattern.
const sunDirWorld = new THREE.Vector3(0.8, 0.35, 0.5).normalize();
const cameraWorld = camera.position.clone();

function setUniformTime(t: number): void {
  const u = material.uniforms;
  if (u.u_time) (u.u_time as { value: number }).value = t;
  if (u.uTime) (u.uTime as { value: number }).value = t;
  if (u.time) (u.time as { value: number }).value = t;
}

// Reused scratch objects for camera-local sync (avoids per-frame alloc).
const _tmpCameraLocal = new THREE.Vector3();
const _tmpInvMat = new THREE.Matrix4();

function syncCameraLocal(): void {
  // Many raymarch shaders (exotic-blackhole/compact/dark, nebula-emission/
  // dark/planetary, lss-supercluster, …) read `u_cameraLocal` to compute
  // the view ray inside object-local space. The dedicated builders set it
  // via their `update()` callback; for materials that fall through to
  // MaterialFactory (no update), we set it here so the raymarch isn't
  // degenerate. Harmless when the uniform is absent.
  const u = material.uniforms as Record<string, { value: unknown } | undefined>;
  const slot = u['u_cameraLocal'];
  if (!slot) return;
  _tmpCameraLocal.copy(cameraWorld);
  _tmpInvMat.copy(mesh.matrixWorld).invert();
  _tmpCameraLocal.applyMatrix4(_tmpInvMat);
  const v = slot.value as { copy?: (s: THREE.Vector3) => void; set?: (x: number, y: number, z: number) => void };
  if (v.copy) v.copy(_tmpCameraLocal);
  else if (v.set) v.set(_tmpCameraLocal.x, _tmpCameraLocal.y, _tmpCameraLocal.z);
}

function tickMaterial(deltaSec: number, elapsedSec: number): void {
  setUniformTime(elapsedSec);
  mesh.updateWorldMatrix(true, false);
  if (built.update) {
    built.update({
      deltaSec,
      elapsedSec,
      sunDirWorld,
      cameraWorld,
      meshMatrixWorld: mesh.matrixWorld,
    });
  } else {
    syncCameraLocal();
  }
}

const startMs = performance.now();
let lastMs = startMs;

function finish(): void {
  // Render the deterministic pinned frame three times with an explicit
  // GPU flush between each. Single-render captures occasionally race
  // ahead of the WebGL pipeline (the screenshot reads back before the
  // fragment shader has actually written), producing black PNGs even
  // though the material compiled fine. Three renders + flushes is
  // empirically race-free under headless Chromium swiftshader.
  tickMaterial(0, FIXED_TIME);
  setUniformTime(FIXED_TIME);
  for (let i = 0; i < 3; i++) {
    renderer.render(scene, camera);
    const gl = renderer.getContext();
    gl.flush();
    gl.finish();
  }
  // Wait one more rAF so Chromium's compositor has the latest texture
  // bound to the canvas before the screenshot arrives.
  requestAnimationFrame(() => {
    win.__captureReady = true;
  });
}

function tick(): void {
  const nowMs = performance.now();
  const elapsed = (nowMs - startMs) / 1000;
  const delta = (nowMs - lastMs) / 1000;
  lastMs = nowMs;
  if (elapsed < SETTLE_SEC) {
    tickMaterial(delta, elapsed);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
    return;
  }
  finish();
}

requestAnimationFrame(tick);
