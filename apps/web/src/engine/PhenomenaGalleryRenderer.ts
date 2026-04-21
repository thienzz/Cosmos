import * as THREE from 'three';

import { applyEntityToggles } from './applyEntityToggles';
import type { GpuLifecycleHook } from './gpuLifecycle';

/**
 * T52 — Doc 22 8xxx phenomena placeholder gallery.
 *
 * The 8xxx ENT band covers specific astrophysical phenomena (Kilonova,
 * GRB, TDE, Accretion Disk, Bow Shock, etc.) that don't have dedicated
 * procedural shaders yet. This gallery mounts one invisible sphere per
 * ENT-ID using a trivial GLSL3 material so every Doc 22 phenomenon
 * toggle in the InfoPanel lands on a real shader uniform.
 *
 * The shader writes a constant colour — the universal `u_toggleBright`
 * / `u_toggleSat` / `u_toggleTint` post-correction patched in by
 * `applyEntityToggles` still drives a visible response when the user
 * flips toggles. If/when a renderer lands a proper shader for one of
 * these phenomena, route its material through `applyEntityToggles`
 * directly and the corresponding entry here becomes redundant.
 */

interface PhenomenonEntry {
  entId: string;
  /** Tint colour (hex). Used to visually distinguish rows when visible. */
  tint: string;
  label: string;
}

/**
 * 13 Doc 22 phenomena without a dedicated shader. ENT-8010 (Magnetar)
 * and ENT-8030 (Protoplanetary Disk) are routed via ExoticGallery and
 * NebulaGallery respectively. ENT-8024 (Gravitational Lens) and ENT-8034
 * (CMB) already have custom renderers. ENT-8040 (SMBH) is covered by
 * ExoticGallery's `quasistar` routing.
 */
const PHENOMENA_ENTRIES: readonly PhenomenonEntry[] = [
  // 4xxx small-body subtypes without a dedicated scene mesh.
  { entId: 'ENT-4021', tint: '#9ec5ff', label: 'Kuiper Belt Object' },
  { entId: 'ENT-4022', tint: '#e8b27a', label: 'Centaur Object' },
  { entId: 'ENT-4026', tint: '#b89265', label: 'Trojan Asteroid Cluster' },
  { entId: 'ENT-4028', tint: '#ffb070', label: 'Meteoroid Stream' },
  { entId: 'ENT-4034', tint: '#c8d8ff', label: 'Oort Cloud' },
  // 7xxx LSS entities whose real meshes are LineBasic (unpatchable).
  { entId: 'ENT-7010', tint: '#ffd27a', label: 'Galaxy Cluster' },
  { entId: 'ENT-7020', tint: '#7ac7ff', label: 'Cosmic Web Filament' },
  { entId: 'ENT-7060', tint: '#b48cff', label: 'Galaxy Supercluster' },
  // 8xxx astrophysical phenomena without a dedicated shader.
  { entId: 'ENT-8020', tint: '#ffd27a', label: 'Binary Star System' },
  { entId: 'ENT-8021', tint: '#b48cff', label: 'Kilonova' },
  { entId: 'ENT-8022', tint: '#ff6b4a', label: 'Gamma-Ray Burst' },
  { entId: 'ENT-8026', tint: '#7ac7ff', label: 'Pulsar Wind Nebula' },
  { entId: 'ENT-8028', tint: '#ffc87a', label: 'Type Ia Supernova' },
  { entId: 'ENT-8031', tint: '#ff8b42', label: 'Accretion Disk' },
  { entId: 'ENT-8032', tint: '#7dffd4', label: 'Bow Shock Nebula' },
  { entId: 'ENT-8036', tint: '#ff4fa3', label: 'Fast Radio Burst' },
  { entId: 'ENT-8038', tint: '#d4b87d', label: 'Circumstellar Envelope' },
  { entId: 'ENT-8042', tint: '#90a5ff', label: 'X-ray Binary' },
  { entId: 'ENT-8044', tint: '#ff7bd8', label: 'Tidal Disruption Event' },
  { entId: 'ENT-8046', tint: '#8ce0a0', label: 'Heliosphere' },
];

const PHENOMENON_VERT = `#version 300 es
precision highp float;
in vec3 position;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const PHENOMENON_FRAG = `#version 300 es
precision highp float;
uniform vec3 u_tint;
out vec4 fragColor;
void main() {
  // Constant-colour placeholder. The universal toggle post-correction
  // (injected by applyEntityToggles.patchMaterial) drives visible change.
  fragColor = vec4(u_tint, 1.0);
}
`;

interface Body {
  entId: string;
  material: THREE.ShaderMaterial;
  mesh: THREE.Mesh;
}

export interface PhenomenaGalleryOptions {
  size?: number;
  gap?: number;
  rowZ?: number;
}

export class PhenomenaGalleryRenderer implements GpuLifecycleHook {
  readonly group: THREE.Group;
  private readonly bodies: Body[] = [];

  constructor(options: PhenomenaGalleryOptions = {}) {
    this.group = new THREE.Group();
    this.group.name = 'PhenomenaGallery';

    const size = options.size ?? 3;
    const gap = options.gap ?? 2;
    const rowZ = options.rowZ ?? -7500;

    const geometry = new THREE.SphereGeometry(1, 12, 12);
    let cursor = 0;
    for (const entry of PHENOMENA_ENTRIES) {
      const material = new THREE.ShaderMaterial({
        name: `phenomenon:${entry.entId}`,
        glslVersion: THREE.GLSL3,
        uniforms: {
          u_tint: { value: new THREE.Color(entry.tint) },
        },
        vertexShader: PHENOMENON_VERT,
        fragmentShader: PHENOMENON_FRAG,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = `PhenomenaGallery:${entry.entId}`;
      mesh.scale.setScalar(size);
      mesh.position.set(cursor, 0, rowZ);
      cursor += size * 2 + gap;
      this.group.add(mesh);
      this.bodies.push({ entId: entry.entId, material, mesh });
    }

    // Default-mount as invisible placeholder pool.
    this.group.visible = false;
  }

  update(_deltaSec: number, _elapsedSec: number): void {
    for (const { entId, material } of this.bodies) {
      applyEntityToggles(material, entId);
    }
  }

  rebuildAfterContextRestore(): void {
    for (const { material } of this.bodies) {
      material.needsUpdate = true;
    }
  }

  dispose(): void {
    for (const { material, mesh } of this.bodies) {
      mesh.geometry.dispose();
      material.dispose();
      this.group.remove(mesh);
    }
    this.bodies.length = 0;
  }

  getEntityIds(): ReadonlyArray<string> {
    return this.bodies.map((b) => b.entId);
  }
}
