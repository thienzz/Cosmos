import {
  DEFAULT_SCENE_SCALE,
  icrsToSceneUnitsPc,
  type SceneScaleConfig,
} from '@cosmos/coordinate-utils';
import * as THREE from 'three';

import { GALAXY_CATALOG, type GalaxyCatalogEntry } from '@/data/galaxyCatalog';
import {
  AGN_PALETTE,
  ELLIPTICAL_PALETTE,
  GALAXY_KINDS,
  GALAXY_SUBTYPES,
  GALAXY_SUBTYPE_KIND,
  IRREGULAR_PALETTE,
  LENTICULAR_PALETTE,
  MORPHOLOGY_SPECIAL_PALETTE,
  SPIRAL_PALETTE,
  STARBURST_PALETTE,
  type AgnSubvariant,
  type EllipticalSubvariant,
  type GalaxyKind,
  type GalaxySubtype,
  type IrregularSubvariant,
  type SpecialSubvariant,
  type SpiralSubvariant,
  type StarburstSubvariant,
} from '@/utils/galaxyPalette';

import {
  applyEntityToggles,
  GALAXY_KIND_TO_ENT_ID,
  GALAXY_SUBTYPE_TO_ENT_ID,
} from './applyEntityToggles';
import {
  GalaxyLod,
  type GalaxyLodOptions,
  type GalaxyLodTier,
} from './GalaxyLOD';
import type { GalaxyMaterialOptions } from './GalaxyMaterial';
import type { GpuLifecycleHook } from './SceneManager';

/**
 * T29 (4 kinds) + T46 (19 subtypes) — visual fixture for Doc 18 §Galaxy
 * Rendering shaders.
 *
 * Defaults to the historical 4-galaxy row (spiral / elliptical / irregular /
 * lenticular) so the existing `?demo=galaxies` flow is unchanged. Pass
 * `subtypes: GALAXY_SUBTYPES` (or `GalaxyGalleryRenderer.ALL_SUBTYPES`) to
 * render the full 19-subtype grid.
 *
 * Layout:
 *   - 4-base-kind mode: single row of 4 galaxies along +X.
 *   - 19-subtype mode:  2-row grid (top: 10, bottom: 9) laid out in XY so
 *     the camera at (0, 6, 90) sees every entry without tilt per kind. The
 *     grid is auto-centred on world origin.
 */

export type GalaxyPositionMode = 'gallery' | 'catalog';

export interface GalaxyGalleryOptions {
  /** Row-centre Z offset in world units (default -40). */
  rowZ?: number;
  /** Per-kind cube half-extent (default 7 → 14u box). Billboards match. */
  size?: number;
  /** Horizontal gap between galaxies (default 6). */
  gap?: number;
  /** Shared steps override — forwarded to GalaxyMaterial. */
  stepsOverride?: number;
  /** Override the LOD breakpoints of all entries. */
  lodBreakpoints?: GalaxyLodOptions['breakpoints'];
  /**
   * Optional subset of subtypes to render. When undefined, the legacy 4
   * base-kind layout is used. Pass `GALAXY_SUBTYPES` to render the full
   * Doc 17 19-subtype grid.
   */
  subtypes?: ReadonlyArray<GalaxySubtype>;
  /**
   * P2C — positioning strategy:
   *  - `'gallery'` (default, legacy): flat row/grid showcasing Hubble kinds.
   *  - `'catalog'`: read GALAXY_CATALOG and place each galaxy at its real
   *    ICRS (RA, Dec, distance_kpc) using the stellar-regime pc scale.
   *
   * Catalog mode ignores {@link subtypes}, {@link rowZ}, and {@link gap} —
   * positions come from NED consensus values. Downstream code that relies
   * on the gallery layout keeps passing `'gallery'` (or omits it).
   */
  positionMode?: GalaxyPositionMode;
  /**
   * Optional catalog override — defaults to {@link GALAXY_CATALOG}. Passing
   * a subset is the easiest way to render only the Local Group, only the
   * cosmic-scale clusters, etc.
   */
  catalog?: ReadonlyArray<GalaxyCatalogEntry>;
  /**
   * Scene-scale overrides applied to catalog positioning. When omitted,
   * {@link DEFAULT_SCENE_SCALE} is used — same grid as the star tile
   * pyramid (500 units/pc). Override `unitsPerPc` to compress the Local
   * Group into a tighter region for narrow demos.
   */
  sceneScale?: SceneScaleConfig;
}

interface Body {
  /** Either the legacy 4-kind label, detailed subtype label, or catalog id. */
  id: GalaxyKind | GalaxySubtype | string;
  kind: GalaxyKind;
  subtype?: GalaxySubtype;
  lod: GalaxyLod;
  /** Present only in catalog mode — source entry for lookups. */
  catalogEntry?: GalaxyCatalogEntry;
}

/**
 * P2C — map `GalaxyCatalogEntry.kind` values ('spiral', 'elliptical', …)
 * to the palette's {@link GalaxyKind}. The catalog is authored to match
 * the renderer's kind enum directly, so the cast is safe — this wrapper
 * just narrows for future drift where the catalog adds a kind (e.g.
 * 'dwarf-spheroidal') that the palette doesn't know about yet.
 */
function resolveCatalogKind(entry: GalaxyCatalogEntry): GalaxyKind {
  const k = entry.kind as GalaxyKind;
  return GALAXY_KINDS.includes(k) ? k : 'spiral';
}

// Palette-driven billboard tint per kind.
const KIND_TINT: Record<GalaxyKind, string> = {
  spiral:              SPIRAL_PALETTE.bulgeColor,          // #FFD8A0
  elliptical:          ELLIPTICAL_PALETTE.coreColor,       // #FFDA80
  irregular:           IRREGULAR_PALETTE.youngStarColor,   // #A0C8FF
  lenticular:          LENTICULAR_PALETTE.innerDiskColor,  // #FFAA44
  agn:                 AGN_PALETTE.coreColor,              // #5588FF
  starburst:           STARBURST_PALETTE.youngStarColor,   // #5085FF
  'morphology-special': MORPHOLOGY_SPECIAL_PALETTE.ringBulkColor, // #4A90E2
};

/**
 * Map each Doc 17 subtype to the material options needed to render it with
 * the right subvariant tuning.
 */
function materialOptionsForSubtype(subtype: GalaxySubtype): GalaxyMaterialOptions {
  switch (subtype) {
    case 'sa':         return { spiralSubvariant: 'sa' satisfies SpiralSubvariant };
    case 'sb':         return { spiralSubvariant: 'sb' satisfies SpiralSubvariant };
    case 's0':         return {};
    case 'giant-e':    return { ellipticalSubvariant: 'giant' satisfies EllipticalSubvariant };
    case 'de':         return { ellipticalSubvariant: 'de' satisfies EllipticalSubvariant };
    case 'dsph':       return { ellipticalSubvariant: 'dsph' satisfies EllipticalSubvariant };
    case 'irr-i':      return { irregularSubvariant: 'irr-i' satisfies IrregularSubvariant };
    case 'irr-ii':     return { irregularSubvariant: 'irr-ii' satisfies IrregularSubvariant };
    case 'seyfert':    return { agnSubvariant: 'seyfert2' satisfies AgnSubvariant };
    case 'quasar':     return { agnSubvariant: 'quasar' satisfies AgnSubvariant };
    case 'radio':      return { agnSubvariant: 'radio' satisfies AgnSubvariant };
    case 'blazar':     return { agnSubvariant: 'blazar' satisfies AgnSubvariant };
    case 'liner':      return { agnSubvariant: 'liner' satisfies AgnSubvariant };
    case 'starburst':  return { starburstSubvariant: 'starburst' satisfies StarburstSubvariant };
    case 'ulirg':      return { starburstSubvariant: 'ulirg' satisfies StarburstSubvariant };
    case 'ring':       return { specialSubvariant: 'ring' satisfies SpecialSubvariant };
    case 'jellyfish':  return { specialSubvariant: 'jellyfish' satisfies SpecialSubvariant };
    case 'udg':        return { specialSubvariant: 'udg' satisfies SpecialSubvariant };
    case 'merging':    return { specialSubvariant: 'merging' satisfies SpecialSubvariant };
  }
}

export class GalaxyGalleryRenderer implements GpuLifecycleHook {
  readonly group: THREE.Group;
  private readonly bodies: Body[] = [];

  /**
   * Default 6-kind order — spiral, elliptical, irregular, lenticular, agn,
   * starburst. Covers every Doc 22 galaxy ENT-ID with a Doc 22 toggle spec
   * (ENT-6010/6020/6030/6031/6036/6040) so the default gallery wires all
   * galaxy toggle specs without needing `subtypes` override.
   *
   * 'morphology-special' is excluded — it has no Doc 22 spec and collapses
   * to a grab-bag of visual oddities.
   */
  static readonly ORDER: GalaxyKind[] = GALAXY_KINDS.slice(0, 6) as GalaxyKind[];
  /** Full 19-subtype enumeration (Doc 17 ENT-6010..6055). */
  static readonly ALL_SUBTYPES: readonly GalaxySubtype[] = GALAXY_SUBTYPES;

  constructor(options: GalaxyGalleryOptions = {}) {
    this.group = new THREE.Group();
    this.group.name = 'GalaxyGallery';

    const size = options.size ?? 7;
    const gap = options.gap ?? 6;
    const rowZ = options.rowZ ?? -40;

    const gallerySpaceBreakpoints = {
      volumetricMax: 260,
      pointMin: 900,
      ...(options.lodBreakpoints ?? {}),
    };

    const diskKinds = new Set<GalaxyKind>(['spiral', 'lenticular', 'starburst']);
    const tiltForKind: Partial<Record<GalaxyKind, number>> = {
      spiral: -Math.PI / 5,
      lenticular: -Math.PI / 6,
      starburst: -Math.PI / 5,
    };

    const positionMode: GalaxyPositionMode = options.positionMode ?? 'gallery';
    if (positionMode === 'catalog') {
      // -------- P2C catalog layout --------
      // Every GalaxyCatalogEntry placed at its ICRS (ra, dec, distance)
      // via the scene-scale helper. distance_kpc → pc via ×1000 so the
      // result lands on the same grid as the Gaia star tiles.
      const catalog = options.catalog ?? GALAXY_CATALOG;
      const scale = options.sceneScale ?? {};
      const unitsPerPc = scale.unitsPerPc ?? DEFAULT_SCENE_SCALE.unitsPerPc;
      const scaleCfg: SceneScaleConfig = { ...scale, unitsPerPc };
      for (const entry of catalog) {
        if (!Number.isFinite(entry.distance_kpc) || entry.distance_kpc <= 0) continue;
        const kind = resolveCatalogKind(entry);
        const pos = icrsToSceneUnitsPc(
          entry.ra_deg,
          entry.dec_deg,
          entry.distance_kpc * 1000,
          scaleCfg,
        );
        const lodOpts: GalaxyLodOptions = {
          kind,
          size,
          tint: KIND_TINT[kind],
          ...(options.stepsOverride !== undefined
            ? { materialOptions: { stepsOverride: options.stepsOverride } }
            : {}),
          breakpoints: gallerySpaceBreakpoints,
        };
        const lod = new GalaxyLod(lodOpts);
        lod.group.position.set(pos.x, pos.y, pos.z);
        if (diskKinds.has(kind)) {
          const tilt = tiltForKind[kind];
          if (tilt !== undefined) lod.group.rotation.x = tilt;
        }
        this.group.add(lod.group);
        this.bodies.push({ id: entry.id, kind, lod, catalogEntry: entry });
      }
    } else if (options.subtypes && options.subtypes.length > 0) {
      // -------- 19-subtype grid layout --------
      // Two rows, 10 entries top + remaining bottom, centred on origin.
      const entries = options.subtypes.slice();
      const perRow = Math.ceil(entries.length / 2);
      const rowSpacing = size * 2 + gap;
      for (let i = 0; i < entries.length; i++) {
        const subtype = entries[i]!;
        const kind: GalaxyKind = GALAXY_SUBTYPE_KIND[subtype];
        const row = i < perRow ? 0 : 1;
        const colIndex = i - row * perRow;
        const rowWidth = (row === 0 ? perRow : entries.length - perRow);
        const x = (colIndex - (rowWidth - 1) / 2) * (size * 2 + gap);
        const y = (row === 0 ? +1 : -1) * rowSpacing * 0.5;

        const opts: GalaxyLodOptions = {
          kind,
          size,
          tint: KIND_TINT[kind],
          materialOptions: {
            ...materialOptionsForSubtype(subtype),
            ...(options.stepsOverride !== undefined ? { stepsOverride: options.stepsOverride } : {}),
          },
          breakpoints: gallerySpaceBreakpoints,
        };
        const lod = new GalaxyLod(opts);
        lod.group.position.set(x, y, rowZ);
        if (diskKinds.has(kind)) {
          const tilt = tiltForKind[kind];
          if (tilt !== undefined) lod.group.rotation.x = tilt;
        }
        this.group.add(lod.group);
        this.bodies.push({ id: subtype, kind, subtype, lod });
      }
    } else {
      // -------- Legacy 4-kind row layout (unchanged) --------
      let cursor = 0;
      for (const kind of GalaxyGalleryRenderer.ORDER) {
        const lodOpts: GalaxyLodOptions = {
          kind,
          size,
          tint: KIND_TINT[kind],
          ...(options.stepsOverride !== undefined
            ? { materialOptions: { stepsOverride: options.stepsOverride } }
            : {}),
          breakpoints: gallerySpaceBreakpoints,
        };
        const lod = new GalaxyLod(lodOpts);
        cursor += size;
        lod.group.position.set(cursor, 0, rowZ);
        if (diskKinds.has(kind)) {
          const tilt = tiltForKind[kind];
          if (tilt !== undefined) lod.group.rotation.x = tilt;
        }
        cursor += size + gap;
        this.group.add(lod.group);
        this.bodies.push({ id: kind, kind, lod });
      }

      // Centre the row on origin.
      const bounds = new THREE.Box3().setFromObject(this.group);
      const centre = bounds.getCenter(new THREE.Vector3());
      this.group.position.x -= centre.x;
    }
  }

  /** Per-frame update — ticks each LOD's volumetric material and picks tier. */
  update(deltaSec: number, elapsedSec: number, cameraWorld: THREE.Vector3): void {
    for (const { kind, subtype, lod } of this.bodies) {
      const worldCentre = new THREE.Vector3();
      lod.group.getWorldPosition(worldCentre);
      const dist = cameraWorld.distanceTo(worldCentre);
      lod.setCameraDistance(dist);
      lod.update(deltaSec, elapsedSec, cameraWorld);
      // T52 — route Doc 22 galaxy toggles into every LOD tier so distant
      // LODs still respond to toggles when the user zooms out. When the
      // gallery runs in 19-subtype mode each entry resolves to its own
      // Doc 22 ENT-ID; the legacy 6-kind mode routes via base kind.
      const entId = (subtype && GALAXY_SUBTYPE_TO_ENT_ID[subtype]) ?? GALAXY_KIND_TO_ENT_ID[kind];
      applyEntityToggles(lod.materialHandle.material, entId);
      const billboardMat = lod.billboardMesh.material as THREE.ShaderMaterial;
      if (billboardMat.isShaderMaterial) applyEntityToggles(billboardMat, entId);
    }
  }

  rebuildAfterContextRestore(): void {
    for (const { lod } of this.bodies) {
      lod.materialHandle.material.needsUpdate = true;
      (lod.volumetricMesh.geometry as THREE.BufferGeometry).attributes.position.needsUpdate = true;
    }
  }

  dispose(): void {
    for (const { lod } of this.bodies) {
      this.group.remove(lod.group);
      lod.dispose();
    }
    this.bodies.length = 0;
  }

  /** Test helper — returns the live LODs in declaration order. */
  getLods(): ReadonlyArray<GalaxyLod> {
    return this.bodies.map((b) => b.lod);
  }

  /** Test helper — current tier of each galaxy in declaration order. */
  getCurrentTiers(): ReadonlyArray<GalaxyLodTier> {
    return this.bodies.map((b) => b.lod.getCurrentTier());
  }

  /** Test helper — the Doc 17 subtype label per body, in order. */
  getSubtypeIds(): ReadonlyArray<GalaxyKind | GalaxySubtype | string> {
    return this.bodies.map((b) => b.id);
  }

  /** Test helper — catalog entries per body (undefined in non-catalog modes). */
  getCatalogEntries(): ReadonlyArray<GalaxyCatalogEntry | undefined> {
    return this.bodies.map((b) => b.catalogEntry);
  }
}
