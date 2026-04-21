import * as THREE from 'three';

import { IAU_NAMED_STARS } from '@/data/constellations';
import { EXOTIC_CATALOG } from '@/data/exoticCatalog';
import { GALAXY_CATALOG } from '@/data/galaxyCatalog';
import { NEBULA_CATALOG } from '@/data/nebulaCatalog';
import { subtypeToKind, type NebulaKind } from '@/utils/nebulaPalette';
import type { MainSeqKind, StarFamilyKind } from '@/utils/starFamilyPalette';

import { createExoticMaterial, type ExoticMaterialHandle } from './ExoticMaterial';
import { createGalaxyMaterial, type GalaxyMaterialHandle } from './GalaxyMaterial';
import {
  createNebulaMaterial,
  createNebulaMaterialForSubtype,
  type NebulaMaterialHandle,
} from './NebulaMaterial';
import { createStarMaterial, type StarMaterialHandle } from './StarMaterialFamily';

/**
 * P2E / P2F — ephemeral visualization spawned at the fly-to target of a deep-sky
 * search result (Andromeda, Sirius, Sgr A*, Virgo Cluster…).
 *
 * Problem: {@link SceneManager.flyToCelestialCoord} lands the camera at a
 * piecewise-compressed scene position along the correct ICRS direction, but
 * the actual galaxy/nebula/exotic renderers place their meshes at raw
 * catalog coordinates (Mpc × unitsPerMpc = millions of units), so the
 * destination frame is empty space — the user sees nothing. The result feels
 * broken even though the camera motion is correct.
 *
 * P2F update: instead of only showing a generic cyan orb + text label, when the
 * search target resolves to an entry in the galaxy / nebula / exotic catalog we
 * also mount the **actual procedural shader** (spiral galaxy volumetric cube,
 * Orion-style emission raymarch, Kerr disk + jets, etc.) at the fly-to position,
 * sized to fill a meaningful fraction of the view. This makes "fly to Andromeda"
 * actually show Andromeda-shaped light instead of a hovering label.
 *
 * The orb/label are kept as secondary anchors so the user still has a clear
 * "you arrived here" affordance on top of the volumetric mesh.
 */

const VERT_SHADER = `
uniform float u_time;
varying vec3 v_normal;
varying vec3 v_worldPos;
void main() {
  v_normal = normalize(normalMatrix * normal);
  // Gentle breathing pulse (±3%) so the marker reads as "live" not a dead ball.
  float s = 1.0 + 0.03 * sin(u_time * 2.5);
  vec4 world = modelMatrix * vec4(position * s, 1.0);
  v_worldPos = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}`;

// Three.js auto-declares `cameraPosition` in the fragment shader, but NOT
// `modelMatrix` — pass world position via a varying so we can compute the
// view vector without touching unavailable uniforms.
const FRAG_SHADER = `
uniform float u_time;
uniform vec3 u_color;
varying vec3 v_normal;
varying vec3 v_worldPos;
void main() {
  // Rim-lit sphere — fresnel falloff plus soft core so it reads against a
  // black starfield background.
  vec3 view = normalize(cameraPosition - v_worldPos);
  float fres = pow(1.0 - max(0.0, dot(v_normal, view)), 2.0);
  float core = max(0.0, dot(v_normal, view));
  // Slow hue shift so multiple markers can be distinguished at a glance.
  float pulse = 0.6 + 0.4 * sin(u_time * 1.7);
  vec3 col = u_color * (core * 0.7 + fres * 1.5 * pulse);
  // Clamp + soft glow — alpha falloff on rim so the sphere looks translucent
  // rather than cartoony solid.
  float a = 0.35 + 0.55 * fres;
  gl_FragColor = vec4(col, a);
}`;

function makeLabelSprite(label: string, color = '#a5f3fc'): THREE.Sprite | null {
  const canvas = document.createElement('canvas');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const fontPx = 26 * dpr;
  const paddingX = 14 * dpr;
  const paddingY = 8 * dpr;
  const ctx = canvas.getContext('2d');
  // jsdom returns a stub 2D context that lacks measureText / fillText —
  // fall back to returning `null` so the marker still renders (just
  // without the text sprite). Tests don't rely on the sprite, only the
  // orb + position.
  if (!ctx || typeof ctx.measureText !== 'function') return null;
  ctx.font = `600 ${fontPx}px "IBM Plex Mono", "Space Mono", monospace`;
  const textWidth = ctx.measureText(label).width;
  canvas.width = Math.ceil(textWidth + paddingX * 2);
  canvas.height = Math.ceil(fontPx + paddingY * 2);
  // Redo font after resize (context gets reset).
  ctx.font = `600 ${fontPx}px "IBM Plex Mono", "Space Mono", monospace`;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2 * dpr;
  // Rounded rect background.
  const r = 8 * dpr;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(canvas.width - r, 0);
  ctx.quadraticCurveTo(canvas.width, 0, canvas.width, r);
  ctx.lineTo(canvas.width, canvas.height - r);
  ctx.quadraticCurveTo(canvas.width, canvas.height, canvas.width - r, canvas.height);
  ctx.lineTo(r, canvas.height);
  ctx.quadraticCurveTo(0, canvas.height, 0, canvas.height - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(label, paddingX, canvas.height / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    depthTest: false,    // label always on top so it's readable against nebulae
    depthWrite: false,
    transparent: true,
  });
  const sprite = new THREE.Sprite(mat);
  // Aspect ratio scaled so the label reads ~80 px tall at 1:1 distance.
  sprite.scale.set(canvas.width / canvas.height, 1, 1);
  return sprite;
}

export interface SearchTargetMarkerOptions {
  /** Label text shown above the orb. Defaults to 'TARGET'. */
  label?: string;
  /** Marker color (hex). Defaults to cyan phosphor. */
  color?: string;
  /**
   * Approximate visual radius in scene units. Auto-scaled by distance so
   * the marker stays readable both at near (≤1 k) and far (~100 k) ranges.
   */
  radiusHint?: number;
  /**
   * P2F — search-result entity id. When it resolves to an entry in the
   * galaxy / nebula / exotic catalog the marker mounts that entity's
   * procedural shader at the fly-to target (sized by camera distance).
   * Prefix-encoded: `GAL-<id>`, `NEB-<id>`, `EXO-<id>`. Unknown prefixes
   * or misses fall back to the orb-only marker.
   */
  entId?: string;
}

// ---------------------------------------------------------------------------
// Entity-kind resolver
// ---------------------------------------------------------------------------

type EntityVisual =
  | { kind: 'galaxy'; handle: GalaxyMaterialHandle }
  | { kind: 'nebula'; handle: NebulaMaterialHandle }
  | { kind: 'exotic'; handle: ExoticMaterialHandle }
  | { kind: 'star'; handle: StarMaterialHandle };

/**
 * Parse an IAU spectralType string (e.g. "A1V", "K1.5III", "B8Ia", "DA2",
 * "M5.5Ve", "WC8") into the nearest {@link StarFamilyKind} understood by
 * {@link createStarMaterial}. Best-effort — when the parse is ambiguous we
 * fall back to the generic 'MS' (main-sequence) shader, which is a safe
 * middle-temperature template.
 */
function spectralTypeToFamilyKind(spectralType: string | undefined): StarFamilyKind {
  if (!spectralType) return 'MS';
  const s = spectralType.trim();
  // White dwarf prefix (DA, DB, DC, …).
  if (/^D[A-Z]?/.test(s)) return 'whitedwarf';
  // Wolf-Rayet (WN / WC / WO).
  if (/^W[NCO]/i.test(s)) return 'wolfrayet';
  // Carbon star (C-, C2, …).
  if (/^C[-0-9]/.test(s)) return 'carbon';
  // Luminosity-class sniff on the tail: `Ia` / `Ib` / `II` = supergiant;
  // `III` = giant; `V` = main sequence.
  const first = s.charAt(0).toUpperCase();
  const mainSeqMap: Record<string, MainSeqKind> = {
    O: 'O', B: 'B', A: 'A', F: 'F', G: 'G', K: 'K', M: 'M',
    L: 'L', T: 'T', Y: 'Y',
  };
  if (/I[ab]?(?![IV])/.test(s)) {
    // Supergiant (I, Ia, Ib). Hot supergiants → BSG template; cool → hypergiant.
    if (first === 'O' || first === 'B' || first === 'A') return 'bluesupergiant';
    return 'hypergiant';
  }
  if (/III/.test(s)) return 'redgiant';
  const k = mainSeqMap[first];
  return k ?? 'MS';
}

function buildStarVisualFromNamedStar(hipOrName: string): EntityVisual | null {
  const hipNum = Number.parseInt(hipOrName, 10);
  let entry = null;
  if (!Number.isNaN(hipNum)) {
    entry = IAU_NAMED_STARS.find((s) => s.hip === hipNum) ?? null;
  }
  if (!entry) {
    // STAR-<CompactName> lookup — strip spaces + case-insensitive compare.
    const norm = hipOrName.replace(/\s+/g, '').toLowerCase();
    entry =
      IAU_NAMED_STARS.find(
        (s) => s.name.replace(/\s+/g, '').toLowerCase() === norm,
      ) ?? null;
  }
  if (!entry) return null;
  const kind = spectralTypeToFamilyKind(entry.spectralType);
  return { kind: 'star', handle: createStarMaterial(kind) };
}

function buildEntityVisual(entId: string): EntityVisual | null {
  if (entId.startsWith('GAL-')) {
    const id = entId.slice(4);
    const entry = GALAXY_CATALOG.find((g) => g.id === id);
    if (!entry) return null;
    return { kind: 'galaxy', handle: createGalaxyMaterial(entry.kind) };
  }
  if (entId.startsWith('NEB-')) {
    const id = entId.slice(4);
    const entry = NEBULA_CATALOG.find((n) => n.id === id);
    if (!entry) return null;
    // Prefer the subtype factory so e.g. `bok-globule` vs `dark-molecular`
    // get distinct parameter overrides inside the shared shader family.
    return { kind: 'nebula', handle: createNebulaMaterialForSubtype(entry.subtype) };
  }
  if (entId.startsWith('EXO-')) {
    const id = entId.slice(4);
    const entry = EXOTIC_CATALOG.find((e) => e.id === id);
    if (!entry) return null;
    return { kind: 'exotic', handle: createExoticMaterial(entry.kind) };
  }
  if (entId.startsWith('HIP-') || entId.startsWith('STAR-')) {
    const rest = entId.startsWith('HIP-') ? entId.slice(4) : entId.slice(5);
    return buildStarVisualFromNamedStar(rest);
  }
  // OC- / GC- — open and globular clusters don't have a dedicated shader but
  // visually they're dense, roughly spherical stellar populations. The
  // elliptical-galaxy shader's `dsph` (dwarf spheroidal) sub-variant renders
  // exactly that aesthetic — a concentrated core with diffuse envelope — so
  // it serves as a faithful procedural stand-in. Doc 18 carries no per-entry
  // catalog tuning for clusters yet, so kind alone is enough here.
  if (entId.startsWith('OC-') || entId.startsWith('GC-')) {
    return {
      kind: 'galaxy',
      handle: createGalaxyMaterial('elliptical', { ellipticalSubvariant: 'dsph' }),
    };
  }
  // OB- — OB associations are loose groupings of hot young stars with heavy
  // HII ionisation. Render with a generic emission-nebula shader so the sky
  // direction reads as a glowing star-forming region rather than a point.
  if (entId.startsWith('OB-')) {
    return { kind: 'nebula', handle: createNebulaMaterial('emission') };
  }
  // LSS- and CON- are abstract / too-large to render as a single entity cube.
  // (LSS = galaxy walls, voids, filaments, supercluster extents; CON = a sky
  // direction at the constellation centroid.) The orb + label stays as their
  // visual anchor.
  return null;
}

/**
 * Generic fallback: if the ent_id didn't point at a catalog entry but the
 * category is still clearly "something in the sky", we can still pick a
 * reasonable default shader based on a plain keyword sniff of the label.
 * This keeps M74/NGC-6946/random-Messier rows from falling back to the
 * featureless orb when their real entry just isn't in the seed catalog yet.
 */
function buildFallbackForHint(entId: string | undefined, label: string): EntityVisual | null {
  const lower = `${entId ?? ''} ${label}`.toLowerCase();
  if (lower.includes('black hole') || lower.includes('sgr a') || lower.includes('quasar')) {
    return { kind: 'exotic', handle: createExoticMaterial('blackhole') };
  }
  if (lower.includes('pulsar')) {
    return { kind: 'exotic', handle: createExoticMaterial('pulsar') };
  }
  if (lower.includes('magnetar')) {
    return { kind: 'exotic', handle: createExoticMaterial('magnetar') };
  }
  if (lower.includes('nebula')) {
    // Pick a tonally neutral emission nebula — matches the broad majority of
    // "named nebula" hits in the catalog.
    const kind: NebulaKind = subtypeToKind('hii-giant');
    return { kind: 'nebula', handle: createNebulaMaterial(kind) };
  }
  if (lower.includes('globular') || lower.includes('open cluster')) {
    // Clusters with no catalog hit still read as dense stellar groupings.
    return {
      kind: 'galaxy',
      handle: createGalaxyMaterial('elliptical', { ellipticalSubvariant: 'dsph' }),
    };
  }
  if (lower.includes('ob association')) {
    return { kind: 'nebula', handle: createNebulaMaterial('emission') };
  }
  if (lower.includes('galaxy') || lower.startsWith('gal-') || lower.includes('messier')) {
    return { kind: 'galaxy', handle: createGalaxyMaterial('spiral') };
  }
  return null;
}

/** Reused buffer so the per-frame update path doesn't allocate. */
const SEARCH_MARKER_TMP_DIR = new THREE.Vector3();

export class SearchTargetMarker {
  readonly group: THREE.Group;
  private readonly orb: THREE.Mesh;
  private readonly labelSprite: THREE.Sprite | null;
  private readonly material: THREE.ShaderMaterial;
  private readonly uniforms: { u_time: { value: number }; u_color: { value: THREE.Color } };
  private elapsedSec = 0;
  private radiusHint: number;
  /** P2F — optional procedural entity mesh rendered alongside the orb. */
  private readonly entityMesh: THREE.Mesh | null;
  private readonly entityVisual: EntityVisual | null;

  constructor(targetScene: THREE.Vector3, options: SearchTargetMarkerOptions = {}) {
    const label = options.label ?? 'TARGET';
    const colorHex = options.color ?? '#7dd3fc';
    this.radiusHint = options.radiusHint ?? 1;

    this.group = new THREE.Group();
    this.group.name = 'SearchTargetMarker';
    this.group.position.copy(targetScene);

    this.uniforms = {
      u_time: { value: 0 },
      u_color: { value: new THREE.Color(colorHex) },
    };
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: VERT_SHADER,
      fragmentShader: FRAG_SHADER,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const geo = new THREE.SphereGeometry(1, 32, 24);
    this.orb = new THREE.Mesh(geo, this.material);
    this.orb.name = 'SearchTargetMarker:orb';
    this.group.add(this.orb);

    // P2F — resolve the ent_id (or sniff the label) into a procedural shader.
    // Wrapped in try/catch so a shader-compile edge case (unsupported kind on
    // the current GPU tier, etc.) can't take down the whole marker mount.
    let visual: EntityVisual | null = null;
    try {
      visual = options.entId ? buildEntityVisual(options.entId) : null;
      if (!visual) visual = buildFallbackForHint(options.entId, label);
    } catch {
      visual = null;
    }
    this.entityVisual = visual;
    if (visual) {
      // Galaxy / nebula / exotic shaders raymarch a unit cube spanning
      // (-1,-1,-1)..(+1,+1,+1) — so those kinds get a BoxGeometry(2,2,2).
      // The star shader is a classical sphere-surface renderer, so stars
      // get a unit SphereGeometry instead.
      const geometry =
        visual.kind === 'star'
          ? new THREE.SphereGeometry(1, 32, 24)
          : new THREE.BoxGeometry(2, 2, 2);
      this.entityMesh = new THREE.Mesh(geometry, visual.handle.material);
      this.entityMesh.name = `SearchTargetMarker:${visual.kind}`;
      this.entityMesh.renderOrder = -1; // draw behind the orb + label
      this.group.add(this.entityMesh);
    } else {
      this.entityMesh = null;
    }

    if (typeof document !== 'undefined') {
      this.labelSprite = makeLabelSprite(label, colorHex);
      if (this.labelSprite) {
        this.labelSprite.name = 'SearchTargetMarker:label';
        this.group.add(this.labelSprite);
      }
    } else {
      this.labelSprite = null;
    }
  }

  /**
   * Per-frame update. The orb radius is chosen from camera distance so the
   * marker reads at a similar pixel size whether we're standing at 500 u or
   * 80 000 u from it.
   */
  update(deltaSec: number, cameraWorldPos: THREE.Vector3): void {
    this.elapsedSec += deltaSec;
    this.uniforms.u_time.value = this.elapsedSec;

    const distToCam = this.group.position.distanceTo(cameraWorldPos);
    // Target visual radius ~ 1.2 % of distance (a small but obvious orb at
    // any range). Clamp to a floor so it stays visible up close.
    const r = Math.max(this.radiusHint * 0.8, distToCam * 0.012);
    this.orb.scale.setScalar(r);
    if (this.labelSprite) {
      // Label ~1.5 × orb, offset above the orb.
      const lScale = Math.max(this.radiusHint * 1.5, distToCam * 0.018);
      const aspect = this.labelSprite.scale.x / this.labelSprite.scale.y;
      this.labelSprite.scale.set(lScale * aspect, lScale, 1);
      this.labelSprite.position.set(0, r * 2.2, 0);
    }

    if (this.entityMesh && this.entityVisual) {
      // Procedural entity sized to ~25% of camera distance so it subtends
      // ~28° of the view at orbitDistance=8% (which is what flyToCelestialCoord
      // picks for extragalactic markers). That reads as "a galaxy-sized
      // structure filling a meaningful chunk of the view" instead of a point.
      // Stars are a tighter read — at 25% scale a single star fills the
      // entire frame and loses its point-source character — so they get a
      // much smaller share (~3%).
      const scaleFactor = this.entityVisual.kind === 'star' ? 0.03 : 0.25;
      const entityScale = Math.max(this.radiusHint * 2, distToCam * scaleFactor);
      this.entityMesh.scale.setScalar(entityScale);
      this.entityMesh.updateMatrixWorld();
      if (this.entityVisual.kind === 'star') {
        // Star shaders take a sun-direction uniform (used by limb-darkening,
        // chromospheric variation, etc.). Named-star markers have no parent
        // sun, so pass the camera→star direction as a stable stand-in — it
        // keeps the illuminated hemisphere facing the viewer.
        SEARCH_MARKER_TMP_DIR
          .copy(this.group.position)
          .sub(cameraWorldPos)
          .normalize();
        this.entityVisual.handle.update(
          deltaSec,
          this.elapsedSec,
          SEARCH_MARKER_TMP_DIR,
          cameraWorldPos,
          this.entityMesh.matrixWorld,
        );
      } else {
        // Every volumetric raymarcher needs u_cameraLocal refreshed from the
        // mesh's world matrix.
        this.entityVisual.handle.update(
          deltaSec,
          this.elapsedSec,
          cameraWorldPos,
          this.entityMesh.matrixWorld,
        );
      }
    }
  }

  dispose(): void {
    this.orb.geometry.dispose();
    this.material.dispose();
    if (this.entityMesh) {
      this.entityMesh.geometry.dispose();
    }
    if (this.entityVisual) {
      this.entityVisual.handle.dispose();
    }
    if (this.labelSprite) {
      const m = this.labelSprite.material as THREE.SpriteMaterial;
      m.map?.dispose();
      m.dispose();
    }
  }
}
