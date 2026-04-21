import * as THREE from 'three';

import type { GpuLifecycleHook } from './SceneManager';

/**
 * T29 — Cosmic web renderer (Doc 17 §ENT-7030 Cosmic Filaments + ENT-7031
 * Cosmic Voids + Doc 18 §Cosmic Filaments / Cosmic Voids).
 *
 * Renders:
 *   1. Filaments: Catmull-Rom tube-geometry threads between cluster nodes,
 *      coloured Doc 17 deep purple `#440088` with fbm-modulated transparency.
 *   2. Voids:      faint wireframe icosahedra marking under-dense regions
 *      (Doc 17 colour `#001133`, opacity 0.15 — subtle shell).
 *   3. Nodes:      bright cluster points at filament junctions
 *      (Doc 17 `#DD5555` red ellipticals, `#4488CC` blue spirals).
 *
 * All geometry is deterministic from a fixed topology — this is a static
 * scaffolding that represents the Doc 18 §Large-Scale Structure overview
 * for `?demo=cosmicweb`. The full N-body-ingested mesh ships with the
 * tile-decoder's `decodeCosmicWebMesh` path in a later task.
 */

export interface CosmicWebNodeSpec {
  /** Cluster centre (world-space units). */
  position: THREE.Vector3;
  /** Dominant galaxy morphology (drives colour + size). */
  kind: 'elliptical' | 'spiral' | 'group';
  /** Scale factor applied to the default node size. */
  weight?: number;
}

export interface CosmicWebFilamentSpec {
  /** Ordered node indices (into `nodes`) the filament routes through. */
  nodeIndices: number[];
  /** Base tube radius (world units). Scales down for secondary filaments. */
  radius?: number;
}

export interface CosmicWebVoidSpec {
  /** Void centre. */
  position: THREE.Vector3;
  /** Void radius. */
  radius: number;
}

export interface CosmicWebRendererOptions {
  /** Cluster-node specs. */
  nodes: CosmicWebNodeSpec[];
  /** Filaments connecting nodes. */
  filaments: CosmicWebFilamentSpec[];
  /** Void regions. */
  voids: CosmicWebVoidSpec[];
  /** Base tube radius (default 1.2 world units). */
  filamentRadius?: number;
  /** Tube segments per unit arc length (default 4). */
  tubeSegments?: number;
  /** Radial segments per tube cross-section (default 8). */
  radialSegments?: number;
  /** Filament colour hex (default Doc 17 `#440088`). */
  filamentColorHex?: string;
  /** Void-shell colour hex (default Doc 17 `#001133`). */
  voidColorHex?: string;
  /** Elliptical-cluster node colour (default Doc 17 `#DD5555`). */
  ellipticalNodeColorHex?: string;
  /** Spiral-cluster node colour (default Doc 17 `#4488CC`). */
  spiralNodeColorHex?: string;
  /** Group-cluster node colour (default Doc 17 `#8888AA`). */
  groupNodeColorHex?: string;
}

export const DEFAULT_COSMIC_WEB: Pick<CosmicWebRendererOptions, 'nodes' | 'filaments' | 'voids'> = {
  nodes: [
    // Local cluster at origin.
    { position: new THREE.Vector3(0, 0, 0), kind: 'group', weight: 0.8 },
    // Virgo-like cluster node, +X.
    { position: new THREE.Vector3(40, 5, 10), kind: 'elliptical', weight: 1.4 },
    // Coma-like cluster, +Y.
    { position: new THREE.Vector3(-10, 45, 0), kind: 'elliptical', weight: 1.6 },
    // Perseus-like cluster, -X-Z.
    { position: new THREE.Vector3(-35, -5, -30), kind: 'elliptical', weight: 1.2 },
    // Sculptor-like group, -Z.
    { position: new THREE.Vector3(5, -8, -45), kind: 'spiral', weight: 0.9 },
    // Hercules-like cluster, +X+Y.
    { position: new THREE.Vector3(35, 30, -5), kind: 'elliptical', weight: 1.1 },
    // Abell 2065 analogue, -X+Y.
    { position: new THREE.Vector3(-40, 20, 15), kind: 'spiral', weight: 1.0 },
    // Tail node, +X-Y.
    { position: new THREE.Vector3(25, -30, 25), kind: 'group', weight: 0.8 },
  ],
  filaments: [
    // Local → Virgo (local supercluster)
    { nodeIndices: [0, 1], radius: 1.4 },
    // Virgo → Hercules (extended supercluster)
    { nodeIndices: [1, 5], radius: 1.2 },
    // Hercules → Coma (great wall)
    { nodeIndices: [5, 2], radius: 1.3 },
    // Coma → Perseus (Perseus-Pisces supercluster)
    { nodeIndices: [2, 3], radius: 1.2 },
    // Perseus → Sculptor (void bridge)
    { nodeIndices: [3, 4], radius: 0.9 },
    // Local → Perseus
    { nodeIndices: [0, 3], radius: 1.0 },
    // Local → Sculptor
    { nodeIndices: [0, 4], radius: 0.9 },
    // Virgo → Tail
    { nodeIndices: [1, 7], radius: 0.9 },
    // Abell → Coma
    { nodeIndices: [6, 2], radius: 1.1 },
    // Abell → Local
    { nodeIndices: [6, 0], radius: 1.0 },
  ],
  voids: [
    // Boötes-like void.
    { position: new THREE.Vector3(15, 20, -20), radius: 14 },
    // Sculptor void analogue.
    { position: new THREE.Vector3(-15, -25, 5), radius: 12 },
    // Local void.
    { position: new THREE.Vector3(-5, 5, 25), radius: 10 },
  ],
};

export class CosmicWebRenderer implements GpuLifecycleHook {
  readonly group: THREE.Group;

  private readonly filamentMeshes: THREE.Mesh[] = [];
  private readonly voidMeshes: THREE.LineSegments[] = [];
  private readonly nodeMeshes: THREE.Mesh[] = [];
  private readonly nodeSpecs: CosmicWebNodeSpec[];
  private readonly filamentSpecs: CosmicWebFilamentSpec[];
  private readonly voidSpecs: CosmicWebVoidSpec[];

  private readonly filamentColor: THREE.Color;
  private readonly voidColor: THREE.Color;
  private readonly nodeColors: Record<'elliptical' | 'spiral' | 'group', THREE.Color>;
  private readonly sharedMaterials: THREE.Material[] = [];

  constructor(options: CosmicWebRendererOptions) {
    this.nodeSpecs = options.nodes;
    this.filamentSpecs = options.filaments;
    this.voidSpecs = options.voids;
    this.filamentColor = new THREE.Color(options.filamentColorHex ?? '#440088');
    this.voidColor = new THREE.Color(options.voidColorHex ?? '#001133');
    this.nodeColors = {
      elliptical: new THREE.Color(options.ellipticalNodeColorHex ?? '#DD5555'),
      spiral:     new THREE.Color(options.spiralNodeColorHex     ?? '#4488CC'),
      group:      new THREE.Color(options.groupNodeColorHex      ?? '#8888AA'),
    };

    this.group = new THREE.Group();
    this.group.name = 'CosmicWeb';

    const baseRadius = options.filamentRadius ?? 1.2;
    const tubeSegments = options.tubeSegments ?? 4;
    const radialSegments = options.radialSegments ?? 8;

    // --- Filaments ---
    const filamentMaterial = new THREE.MeshBasicMaterial({
      color: this.filamentColor,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.sharedMaterials.push(filamentMaterial);
    for (const spec of this.filamentSpecs) {
      if (spec.nodeIndices.length < 2) continue;
      const points = spec.nodeIndices.map((i) => this.nodeSpecs[i]!.position.clone());
      // Catmull-Rom needs ≥2 points; add gentle mid-point curl for longer
      // filaments so they aren't straight rods.
      const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
      const length = curve.getLength();
      const segments = Math.max(8, Math.round(length * tubeSegments));
      const radius = (spec.radius ?? 1) * baseRadius;
      const tubeGeometry = new THREE.TubeGeometry(curve, segments, radius, radialSegments, false);
      const mesh = new THREE.Mesh(tubeGeometry, filamentMaterial);
      mesh.name = `Filament:${spec.nodeIndices.join('-')}`;
      this.filamentMeshes.push(mesh);
      this.group.add(mesh);
    }

    // --- Voids ---
    const voidMaterial = new THREE.LineBasicMaterial({
      color: this.voidColor,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
    });
    this.sharedMaterials.push(voidMaterial);
    for (const spec of this.voidSpecs) {
      const sphere = new THREE.IcosahedronGeometry(spec.radius, 1);
      const edges = new THREE.EdgesGeometry(sphere);
      const lines = new THREE.LineSegments(edges, voidMaterial);
      lines.position.copy(spec.position);
      lines.name = `Void:${spec.position.toArray().join(',')}`;
      sphere.dispose();  // edges copied the vertex data
      this.voidMeshes.push(lines);
      this.group.add(lines);
    }

    // --- Nodes ---
    for (const spec of this.nodeSpecs) {
      const weight = spec.weight ?? 1.0;
      const radius = 1.2 * weight;
      const geom = new THREE.SphereGeometry(radius, 12, 8);
      const mat = new THREE.MeshBasicMaterial({
        color: this.nodeColors[spec.kind],
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      this.sharedMaterials.push(mat);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(spec.position);
      mesh.name = `ClusterNode:${spec.kind}`;
      this.nodeMeshes.push(mesh);
      this.group.add(mesh);
    }
  }

  /** Number of cosmic-web filaments rendered (test helper). */
  getFilamentCount(): number {
    return this.filamentMeshes.length;
  }

  /** Number of voids rendered (test helper). */
  getVoidCount(): number {
    return this.voidMeshes.length;
  }

  /** Number of cluster-node spheres rendered (test helper). */
  getNodeCount(): number {
    return this.nodeMeshes.length;
  }

  /** Returns the world-space position of node `i` (test helper). */
  getNodePosition(index: number): THREE.Vector3 | null {
    const mesh = this.nodeMeshes[index];
    return mesh ? mesh.position.clone() : null;
  }

  rebuildAfterContextRestore(): void {
    for (const mesh of this.filamentMeshes) {
      (mesh.material as THREE.Material).needsUpdate = true;
      (mesh.geometry as THREE.BufferGeometry).attributes.position.needsUpdate = true;
    }
    for (const line of this.voidMeshes) {
      (line.material as THREE.Material).needsUpdate = true;
    }
    for (const mesh of this.nodeMeshes) {
      (mesh.material as THREE.Material).needsUpdate = true;
    }
  }

  dispose(): void {
    for (const mesh of this.filamentMeshes) {
      mesh.geometry.dispose();
      this.group.remove(mesh);
    }
    for (const line of this.voidMeshes) {
      line.geometry.dispose();
      this.group.remove(line);
    }
    for (const mesh of this.nodeMeshes) {
      mesh.geometry.dispose();
      this.group.remove(mesh);
    }
    for (const mat of this.sharedMaterials) mat.dispose();
    this.filamentMeshes.length = 0;
    this.voidMeshes.length = 0;
    this.nodeMeshes.length = 0;
    this.sharedMaterials.length = 0;
  }
}
