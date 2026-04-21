import * as THREE from 'three';

import type { PlanetKind } from '@/utils/planetPalette';

import { applyEntityToggles } from './applyEntityToggles';
import type { GpuLifecycleHook } from './gpuLifecycle';
import {
  createPlanetMaterial,
  type PlanetMaterialHandle,
} from './PlanetMaterial';

/**
 * T52 — Doc 22 2xxx exoplanet placeholder gallery.
 *
 * The classical 8 planets (ENT-2010..ENT-2023) + Earth (ENT-2043) are
 * live in SolarSystemRenderer. Doc 22 also has 8 exoplanet specs that
 * have no default scene mesh:
 *   ENT-2014 Magma World, ENT-2015 Ocean World (Hycean),
 *   ENT-2016 Super-Earth, ENT-2025 Hot Jupiter,
 *   ENT-2035 Mini-Neptune, ENT-2037 Rogue Planet,
 *   ENT-2039 Circumbinary, ENT-2041 Directly Imaged Giant.
 *
 * This gallery mounts an invisible sample sphere per spec using the
 * matching `PlanetMaterial` kind so every exoplanet toggle in the
 * InfoPanel lands on a live shader material.
 */

interface ExoplanetEntry {
  entId: string;
  kind: PlanetKind;
  label: string;
}

const EXOPLANET_ENTRIES: readonly ExoplanetEntry[] = [
  { entId: 'ENT-2014', kind: 'magma',        label: 'Magma World' },
  { entId: 'ENT-2015', kind: 'hycean',       label: 'Ocean World (Hycean)' },
  { entId: 'ENT-2016', kind: 'super-earth',  label: 'Super-Earth' },
  { entId: 'ENT-2025', kind: 'hot-jupiter',  label: 'Hot Jupiter' },
  { entId: 'ENT-2035', kind: 'mini-neptune', label: 'Mini-Neptune' },
  { entId: 'ENT-2037', kind: 'rogue',        label: 'Rogue Planet' },
  { entId: 'ENT-2039', kind: 'circumbinary', label: 'Circumbinary' },
  // ENT-2041 Directly Imaged Giant has no dedicated kind — reuse Jupiter.
  { entId: 'ENT-2041', kind: 'jupiter',      label: 'Directly Imaged Giant' },
];

interface Body {
  entId: string;
  handle: PlanetMaterialHandle;
  mesh: THREE.Mesh;
}

export interface ExoplanetGalleryOptions {
  size?: number;
  gap?: number;
  rowZ?: number;
}

export class ExoplanetGalleryRenderer implements GpuLifecycleHook {
  readonly group: THREE.Group;
  private readonly bodies: Body[] = [];
  private readonly sunDir = new THREE.Vector3(1, 0, 0);

  constructor(options: ExoplanetGalleryOptions = {}) {
    this.group = new THREE.Group();
    this.group.name = 'ExoplanetGallery';

    const size = options.size ?? 3;
    const gap = options.gap ?? 2;
    const rowZ = options.rowZ ?? -6000;

    const geometry = new THREE.SphereGeometry(1, 24, 24);
    let cursor = 0;
    for (const entry of EXOPLANET_ENTRIES) {
      const handle = createPlanetMaterial(entry.kind, {
        sunDirection: this.sunDir,
      });
      const mesh = new THREE.Mesh(geometry, handle.material);
      mesh.name = `ExoplanetGallery:${entry.entId}`;
      mesh.scale.setScalar(size);
      mesh.position.set(cursor, 0, rowZ);
      cursor += size * 2 + gap;
      this.group.add(mesh);
      this.bodies.push({ entId: entry.entId, handle, mesh });
    }

    this.group.visible = false;
  }

  update(deltaSec: number, elapsedSec: number): void {
    for (const { entId, handle } of this.bodies) {
      handle.update(deltaSec, elapsedSec, this.sunDir);
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

  getEntityIds(): ReadonlyArray<string> {
    return this.bodies.map((b) => b.entId);
  }
}
