import * as THREE from 'three';

import type { StarFamilyKind } from '@/utils/starFamilyPalette';

import { applyEntityToggles } from './applyEntityToggles';
import type { GpuLifecycleHook } from './gpuLifecycle';
import {
  createStarMaterial,
  type StarMaterialHandle,
} from './StarMaterialFamily';

/**
 * T52 — Star-type gallery (Doc 22 ENT-1012..ENT-1058).
 *
 * Mounts one small sphere per non-Sun Doc 22 star spec so every star
 * ENT-ID has a live shader material that `applyEntityToggles` can patch.
 * Used as an off-screen "placeholder pool" in the default scene so
 * flipping any star toggle in the InfoPanel lands on a real uniform.
 *
 * The same pattern the nebula/exotic/galaxy galleries use: create a row
 * of sample meshes, each owning its own `ShaderMaterial`, registered as
 * a `GpuLifecycleHook`. Default mount position is far off-screen and
 * `visible = false` so the gallery doesn't clutter the default solar
 * system view but still ticks `update()` each frame.
 */

interface StarTypeEntry {
  entId: string;
  kind: StarFamilyKind;
  /** Optional display label — only used for debug. */
  label: string;
}

/**
 * Doc 22 star ENT-IDs → StarMaterialFamily kind. ENT-1007 (Sun) is
 * excluded because SolarSystemRenderer already mounts the Sun.
 */
const STAR_TYPE_ENTRIES: readonly StarTypeEntry[] = [
  { entId: 'ENT-1012', kind: 'redgiant',       label: 'Red Giant' },
  { entId: 'ENT-1015', kind: 'bluesupergiant', label: 'Blue Supergiant' },
  { entId: 'ENT-1016', kind: 'wolfrayet',      label: 'Wolf-Rayet' },
  { entId: 'ENT-1020', kind: 'neutronstar',    label: 'Neutron Star / Pulsar' },
  { entId: 'ENT-1025', kind: 'whitedwarf',     label: 'White Dwarf' },
  // ENT-1030 stellar black hole has no star-family kind; routed via
  // ExoticGalleryRenderer's `blackhole` kind.
  { entId: 'ENT-1040', kind: 'M',              label: 'Red Dwarf' },
  { entId: 'ENT-1042', kind: 'L',              label: 'Brown Dwarf' },
  { entId: 'ENT-1044', kind: 'cepheid',        label: 'Cepheid Variable' },
  { entId: 'ENT-1046', kind: 'lbv',            label: 'Luminous Blue Variable' },
  { entId: 'ENT-1048', kind: 'O',              label: 'O-Type Blue MS' },
  { entId: 'ENT-1050', kind: 'carbon',         label: 'Carbon Star (AGB)' },
  { entId: 'ENT-1052', kind: 'protostar',      label: 'T Tauri' },
  { entId: 'ENT-1054', kind: 'symbiotic',      label: 'Symbiotic Star' },
  { entId: 'ENT-1058', kind: 'protostar',      label: 'Protostar' },
];

interface Body {
  entId: string;
  handle: StarMaterialHandle;
  mesh: THREE.Mesh;
}

export interface StarTypeGalleryOptions {
  /** Radius of each sample sphere. */
  size?: number;
  /** Horizontal gap between spheres. */
  gap?: number;
  /** Row Z offset — defaults to very far off-screen. */
  rowZ?: number;
}

export class StarTypeGalleryRenderer implements GpuLifecycleHook {
  readonly group: THREE.Group;
  private readonly bodies: Body[] = [];
  private readonly sunDir = new THREE.Vector3(1, 0, 0);

  constructor(options: StarTypeGalleryOptions = {}) {
    this.group = new THREE.Group();
    this.group.name = 'StarTypeGallery';

    const size = options.size ?? 4;
    const gap = options.gap ?? 2;
    const rowZ = options.rowZ ?? -5000;

    const geometry = new THREE.SphereGeometry(1, 16, 16);
    let cursor = 0;
    for (const entry of STAR_TYPE_ENTRIES) {
      const handle = createStarMaterial(entry.kind);
      const mesh = new THREE.Mesh(geometry, handle.material);
      mesh.name = `StarTypeGallery:${entry.entId}`;
      mesh.scale.setScalar(size);
      mesh.position.set(cursor, 0, rowZ);
      cursor += size * 2 + gap;
      this.group.add(mesh);
      this.bodies.push({ entId: entry.entId, handle, mesh });
    }

    // Default-mount as invisible placeholder pool.
    this.group.visible = false;
  }

  update(deltaSec: number, elapsedSec: number, cameraWorld: THREE.Vector3): void {
    for (const { entId, handle, mesh } of this.bodies) {
      mesh.updateWorldMatrix(true, false);
      handle.update(deltaSec, elapsedSec, this.sunDir, cameraWorld, mesh.matrixWorld);
      applyEntityToggles(handle.material, entId);
    }
  }

  rebuildAfterContextRestore(): void {
    for (const { handle } of this.bodies) {
      handle.material.needsUpdate = true;
    }
  }

  dispose(): void {
    for (const { handle, mesh } of this.bodies) {
      mesh.geometry.dispose();
      handle.dispose();
      this.group.remove(mesh);
    }
    this.bodies.length = 0;
  }

  /** Test helper — list of live ENT-IDs in declaration order. */
  getEntityIds(): ReadonlyArray<string> {
    return this.bodies.map((b) => b.entId);
  }
}
