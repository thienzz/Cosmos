/**
 * T47 — Large-scale structure seed catalog.
 *
 * Doc 17 §7010..7040 (ENT-7010..ENT-7040) + Doc 23 §21 sources:
 *   - Harris 2010 (revision 2023) — Milky Way globular clusters (157 total).
 *   - Dias + Cantat-Gaudin (Gaia DR3) — open clusters (~2,700 total).
 *   - Historical OB-association literature — MW young associations.
 *   - Abell 1989 catalogue — rich galaxy clusters (4,073 total).
 *   - Planck SZ 2015 DR2 — SZ-selected clusters (1,653 total).
 *   - Tully 2014 — superclusters and Laniakea definition.
 *   - Pan et al. 2012 cosmic-void catalog (1,054 total).
 *   - Ly-α blob literature (LAB-1, Himiko, MAMMOTH-1 flagships).
 *
 * This file ships the **showpiece subset** that each gallery-style
 * `LargeScaleStructureRenderer` slot renders (a handful per category). The
 * full ~40k-row catalog lives in the tile pipeline (Doc 23 §6.1.4) and is
 * streamed by `TileStreamingManager` at Cosmic regime — not by this file.
 *
 * All positions are stored as ICRS (J2000.0) spherical triples and optionally
 * pre-resolved as Cartesian world-space offsets inside the renderer's
 * gallery coordinate system. See Doc 23 §2.1 for the canonical transform.
 */

import type { Vec3D } from '@cosmos/coordinate-utils';
import { icrsToCartesian } from '@cosmos/coordinate-utils';

/** Parsecs per kiloparsec. */
const PC_PER_KPC = 1_000;

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface IcrsPoint {
  /** Right ascension (degrees, 0–360). */
  raDeg: number;
  /** Declination (degrees, −90..+90). */
  decDeg: number;
  /** Radial distance (parsecs for GC/OC/OB; Mpc×10⁶ pc for Abell+). */
  distancePc: number;
}

/** Convert an IcrsPoint to an ICRS Cartesian triple in the same unit as distancePc. */
export function toCartesian(p: IcrsPoint): Vec3D {
  return icrsToCartesian(p.raDeg, p.decDeg, p.distancePc);
}

// ---------------------------------------------------------------------------
// ENT-7010 — Open Star Clusters (Dias showpiece subset)
// ---------------------------------------------------------------------------

export interface OpenClusterEntry {
  /** Unique id used for fly-to and info-panel lookup. */
  id: string;
  /** Common or messier name (e.g. "Pleiades"). */
  name: string;
  /** Dias catalog or NGC alias, if any. */
  altId?: string;
  position: IcrsPoint;
  /** Cluster age (Myr). */
  ageMyr: number;
  /** Nominal star count (Gaia DR3 membership). */
  memberCount: number;
  /** Physical radius (parsecs). */
  radiusPc: number;
}

/**
 * 10 flagship open clusters — mix of Messier-famous (Pleiades, Praesepe, M11,
 * Double Cluster) and young-reference objects. Distances from Doc 23 §19.3
 * table A; nominal member counts follow Cantat-Gaudin Gaia DR3.
 */
export const HARRIS_DIAS_OPEN_CLUSTERS: readonly OpenClusterEntry[] = [
  {
    id: 'oc-pleiades',
    name: 'Pleiades',
    altId: 'M45 / Melotte 22',
    position: { raDeg: 56.75,  decDeg: +24.12, distancePc: 136 },
    ageMyr: 100, memberCount: 1_000, radiusPc: 4,
  },
  {
    id: 'oc-hyades',
    name: 'Hyades',
    altId: 'Melotte 25',
    position: { raDeg: 66.75,  decDeg: +15.87, distancePc: 47 },
    ageMyr: 625, memberCount: 400, radiusPc: 5,
  },
  {
    id: 'oc-praesepe',
    name: 'Praesepe (Beehive)',
    altId: 'M44 / NGC 2632',
    position: { raDeg: 130.03, decDeg: +19.98, distancePc: 187 },
    ageMyr: 600, memberCount: 1_000, radiusPc: 6,
  },
  {
    id: 'oc-double-cluster',
    name: 'Double Cluster',
    altId: 'NGC 869 / NGC 884',
    position: { raDeg: 35.00,  decDeg: +57.13, distancePc: 2_300 },
    ageMyr: 13, memberCount: 5_000, radiusPc: 15,
  },
  {
    id: 'oc-m11',
    name: 'Wild Duck Cluster',
    altId: 'M11 / NGC 6705',
    position: { raDeg: 282.77, decDeg: -6.27,  distancePc: 1_877 },
    ageMyr: 220, memberCount: 3_000, radiusPc: 10,
  },
  {
    id: 'oc-jewelbox',
    name: 'Jewel Box',
    altId: 'NGC 4755',
    position: { raDeg: 193.42, decDeg: -60.37, distancePc: 2_100 },
    ageMyr: 14, memberCount: 100, radiusPc: 3,
  },
  {
    id: 'oc-m67',
    name: 'M67',
    altId: 'NGC 2682',
    position: { raDeg: 132.82, decDeg: +11.80, distancePc: 860 },
    ageMyr: 3_500, memberCount: 500, radiusPc: 7,
  },
  {
    id: 'oc-alpha-per',
    name: 'α Persei Cluster',
    altId: 'Melotte 20',
    position: { raDeg: 51.08,  decDeg: +49.87, distancePc: 172 },
    ageMyr: 50, memberCount: 100, radiusPc: 5,
  },
  {
    id: 'oc-ngc2516',
    name: 'Southern Beehive',
    altId: 'NGC 2516',
    position: { raDeg: 119.52, decDeg: -60.75, distancePc: 346 },
    ageMyr: 150, memberCount: 2_000, radiusPc: 9,
  },
  {
    id: 'oc-m35',
    name: 'M35',
    altId: 'NGC 2168',
    position: { raDeg: 92.22,  decDeg: +24.33, distancePc: 912 },
    ageMyr: 110, memberCount: 2_500, radiusPc: 12,
  },
  // ---- Phase 4 additions (P2G) — remaining famous open clusters -----------
  {
    id: 'oc-ic2602',
    name: 'Southern Pleiades',
    altId: 'IC 2602 / Caldwell 102',
    position: { raDeg: 160.50, decDeg: -64.40, distancePc: 150 },
    ageMyr: 50, memberCount: 60, radiusPc: 3,
  },
  {
    id: 'oc-ic2391',
    name: 'Omicron Velorum Cluster',
    altId: 'IC 2391 / Caldwell 85',
    position: { raDeg: 130.13, decDeg: -53.03, distancePc: 147 },
    ageMyr: 50, memberCount: 30, radiusPc: 2,
  },
];

// ---------------------------------------------------------------------------
// ENT-7011 — Globular Star Clusters (Harris showpiece subset)
// ---------------------------------------------------------------------------

export interface GlobularClusterEntry {
  id: string;
  name: string;
  altId?: string;
  position: IcrsPoint;
  /** Total visual magnitude. More negative = more luminous. */
  absoluteMagV: number;
  /** Metallicity [Fe/H] on Zinn & West scale. */
  feH: number;
  /** Harris concentration parameter c = log₁₀(r_t / r_c). c ≥ 2.5 = core-collapsed. */
  concentration: number;
  /** Approximate tidal radius (parsecs). */
  tidalRadiusPc: number;
  /** Approximate star count. */
  starCount: number;
}

/**
 * 10 flagship globular clusters — the Harris 2010 "top-10" for
 * recognizability, mass, and variety. Positions from Harris 2023 revision
 * (Doc 23 §19 table); metallicities Zinn-West scale.
 */
export const HARRIS_GLOBULAR_CLUSTERS: readonly GlobularClusterEntry[] = [
  {
    id: 'gc-omega-cen', name: 'ω Centauri', altId: 'NGC 5139',
    position: { raDeg: 201.70, decDeg: -47.48, distancePc: 5.2 * PC_PER_KPC },
    absoluteMagV: -10.26, feH: -1.53, concentration: 1.24,
    tidalRadiusPc: 70, starCount: 10_000_000,
  },
  {
    id: 'gc-47tuc', name: '47 Tucanae', altId: 'NGC 104',
    position: { raDeg: 6.02, decDeg: -72.08, distancePc: 4.5 * PC_PER_KPC },
    absoluteMagV: -9.42, feH: -0.72, concentration: 2.07,
    tidalRadiusPc: 60, starCount: 1_500_000,
  },
  {
    id: 'gc-m13', name: 'M13', altId: 'NGC 6205',
    position: { raDeg: 250.42, decDeg: +36.46, distancePc: 7.1 * PC_PER_KPC },
    absoluteMagV: -8.55, feH: -1.53, concentration: 1.53,
    tidalRadiusPc: 48, starCount: 300_000,
  },
  {
    id: 'gc-m22', name: 'M22', altId: 'NGC 6656',
    position: { raDeg: 279.10, decDeg: -23.90, distancePc: 3.2 * PC_PER_KPC },
    absoluteMagV: -8.50, feH: -1.70, concentration: 1.31,
    tidalRadiusPc: 45, starCount: 500_000,
  },
  {
    id: 'gc-m15', name: 'M15', altId: 'NGC 7078',
    position: { raDeg: 322.49, decDeg: +12.17, distancePc: 10.4 * PC_PER_KPC },
    absoluteMagV: -9.19, feH: -2.37, concentration: 2.50,
    tidalRadiusPc: 35, starCount: 500_000,
  },
  {
    id: 'gc-m3', name: 'M3', altId: 'NGC 5272',
    position: { raDeg: 205.55, decDeg: +28.38, distancePc: 10.2 * PC_PER_KPC },
    absoluteMagV: -8.93, feH: -1.50, concentration: 1.84,
    tidalRadiusPc: 42, starCount: 500_000,
  },
  {
    id: 'gc-m5', name: 'M5', altId: 'NGC 5904',
    position: { raDeg: 229.64, decDeg: +2.08, distancePc: 7.5 * PC_PER_KPC },
    absoluteMagV: -8.81, feH: -1.29, concentration: 1.68,
    tidalRadiusPc: 39, starCount: 500_000,
  },
  {
    id: 'gc-m92', name: 'M92', altId: 'NGC 6341',
    position: { raDeg: 259.28, decDeg: +43.14, distancePc: 8.3 * PC_PER_KPC },
    absoluteMagV: -8.21, feH: -2.31, concentration: 1.68,
    tidalRadiusPc: 38, starCount: 300_000,
  },
  {
    id: 'gc-m4', name: 'M4', altId: 'NGC 6121',
    position: { raDeg: 245.90, decDeg: -26.53, distancePc: 2.2 * PC_PER_KPC },
    absoluteMagV: -7.19, feH: -1.16, concentration: 1.65,
    tidalRadiusPc: 32, starCount: 100_000,
  },
  {
    id: 'gc-ngc2808', name: 'NGC 2808',
    position: { raDeg: 138.01, decDeg: -64.86, distancePc: 9.6 * PC_PER_KPC },
    absoluteMagV: -9.39, feH: -1.14, concentration: 1.77,
    tidalRadiusPc: 45, starCount: 1_000_000,
  },
];

// ---------------------------------------------------------------------------
// ENT-7012 — Stellar / OB Associations
// ---------------------------------------------------------------------------

export interface ObAssociationEntry {
  id: string;
  name: string;
  position: IcrsPoint;
  /** OB association age (Myr). */
  ageMyr: number;
  /** OB-type star count (O/early-B). */
  obCount: number;
  /** Characteristic radius (parsecs). */
  radiusPc: number;
  /** Whether a bright H-II region is associated (ionized natal cloud). */
  hasHIIRegion: boolean;
}

/**
 * 5 canonical Milky Way OB associations — Orion, Sco-Cen (subgroup Upper
 * Scorpius representative), Cygnus OB2, Carina OB1, Cepheus OB3.
 */
export const OB_ASSOCIATIONS: readonly ObAssociationEntry[] = [
  {
    id: 'ob-orion-ob1', name: 'Orion OB1',
    position: { raDeg: 83.82, decDeg: -5.39, distancePc: 400 },
    ageMyr: 5, obCount: 100, radiusPc: 75, hasHIIRegion: true,
  },
  {
    id: 'ob-upper-sco', name: 'Upper Scorpius',
    position: { raDeg: 243.00, decDeg: -22.5, distancePc: 145 },
    ageMyr: 10, obCount: 60, radiusPc: 60, hasHIIRegion: false,
  },
  {
    id: 'ob-cyg-ob2', name: 'Cygnus OB2',
    position: { raDeg: 308.30, decDeg: +41.32, distancePc: 1_700 },
    ageMyr: 3, obCount: 120, radiusPc: 40, hasHIIRegion: true,
  },
  {
    id: 'ob-carina-ob1', name: 'Carina OB1',
    position: { raDeg: 161.00, decDeg: -59.70, distancePc: 2_300 },
    ageMyr: 3, obCount: 70, radiusPc: 50, hasHIIRegion: true,
  },
  {
    id: 'ob-cep-ob3', name: 'Cepheus OB3',
    position: { raDeg: 342.50, decDeg: +62.50, distancePc: 750 },
    ageMyr: 8, obCount: 30, radiusPc: 35, hasHIIRegion: true,
  },
];

// ---------------------------------------------------------------------------
// ENT-7020 / ENT-7021 / ENT-7022 — Galaxy Groups, Clusters, Superclusters
// ---------------------------------------------------------------------------

export type GalaxyClusterRichness = 'group' | 'cluster' | 'supercluster';

export interface GalaxyClusterEntry {
  id: string;
  name: string;
  altId?: string;
  position: IcrsPoint;
  /** Cosmological redshift z. */
  redshift: number;
  /** Number of galaxies (rich-cluster N for Abell, group N for 2MRS). */
  galaxyCount: number;
  /** Total mass (×10¹⁴ M☉). */
  massTenPow14: number;
  richness: GalaxyClusterRichness;
}

/**
 * Galaxy groups (ENT-7020), clusters (ENT-7021), and superclusters (ENT-7022)
 * — Doc 23 §21.2 / §20.3. Distances are converted from redshift to Mpc using
 * H₀ = 67.8 km/s/Mpc where not directly tabulated.
 */
export const GALAXY_CLUSTERS: readonly GalaxyClusterEntry[] = [
  // Local Group (ENT-7020)
  {
    id: 'gg-local', name: 'Local Group',
    position: { raDeg: 10.68, decDeg: +41.27, distancePc: 0.78 * 1_000_000 },
    redshift: 0, galaxyCount: 80, massTenPow14: 0.02, richness: 'group',
  },
  // Virgo Cluster (ENT-7021)
  {
    id: 'cl-virgo', name: 'Virgo Cluster',
    position: { raDeg: 187.70, decDeg: +12.33, distancePc: 16.5 * 1_000_000 },
    redshift: 0.004, galaxyCount: 1_300, massTenPow14: 6.0, richness: 'cluster',
  },
  // Coma Cluster (ENT-7021)
  {
    id: 'cl-coma', name: 'Coma Cluster', altId: 'Abell 1656',
    position: { raDeg: 194.95, decDeg: +27.98, distancePc: 100 * 1_000_000 },
    redshift: 0.023, galaxyCount: 1_000, massTenPow14: 15.0, richness: 'cluster',
  },
  // Perseus Cluster (ENT-7021)
  {
    id: 'cl-perseus', name: 'Perseus Cluster', altId: 'Abell 426',
    position: { raDeg: 49.95, decDeg: +41.51, distancePc: 75 * 1_000_000 },
    redshift: 0.018, galaxyCount: 500, massTenPow14: 6.7, richness: 'cluster',
  },
  // Abell 2029 (ENT-7021)
  {
    id: 'cl-a2029', name: 'Abell 2029',
    position: { raDeg: 227.73, decDeg: +5.74, distancePc: 311 * 1_000_000 },
    redshift: 0.0767, galaxyCount: 800, massTenPow14: 10.0, richness: 'cluster',
  },
  // Abell 2218 (strong lensing cluster)
  {
    id: 'cl-a2218', name: 'Abell 2218',
    position: { raDeg: 248.95, decDeg: +66.21, distancePc: 770 * 1_000_000 },
    redshift: 0.176, galaxyCount: 400, massTenPow14: 7.0, richness: 'cluster',
  },
  // Laniakea Supercluster (ENT-7022)
  {
    id: 'sc-laniakea', name: 'Laniakea Supercluster',
    position: { raDeg: 158.00, decDeg: -46.00, distancePc: 80 * 1_000_000 },
    redshift: 0.02, galaxyCount: 100_000, massTenPow14: 1_000, richness: 'supercluster',
  },
  // Shapley Supercluster (ENT-7022)
  {
    id: 'sc-shapley', name: 'Shapley Supercluster',
    position: { raDeg: 201.25, decDeg: -30.30, distancePc: 210 * 1_000_000 },
    redshift: 0.048, galaxyCount: 25_000, massTenPow14: 10_000, richness: 'supercluster',
  },
  // ---- Phase 4 additions (P2G) — remaining flagship clusters ---------------
  // Fornax Cluster — nearest cluster after Virgo.
  {
    id: 'cl-fornax', name: 'Fornax Cluster', altId: 'Abell S 0373',
    position: { raDeg: 54.62, decDeg: -35.45, distancePc: 19.3 * 1_000_000 },
    redshift: 0.0046, galaxyCount: 340, massTenPow14: 7.0, richness: 'cluster',
  },
  // Hydra Cluster — Abell 1060.
  {
    id: 'cl-hydra', name: 'Hydra Cluster', altId: 'Abell 1060',
    position: { raDeg: 159.17, decDeg: -27.53, distancePc: 55 * 1_000_000 },
    redshift: 0.0126, galaxyCount: 157, massTenPow14: 3.5, richness: 'cluster',
  },
  // Centaurus Cluster — Abell 3526.
  {
    id: 'cl-centaurus', name: 'Centaurus Cluster', altId: 'Abell 3526',
    position: { raDeg: 192.20, decDeg: -41.31, distancePc: 48 * 1_000_000 },
    redshift: 0.0114, galaxyCount: 400, massTenPow14: 4.0, richness: 'cluster',
  },
  // Norma Cluster — Abell 3627, core of the Great Attractor.
  {
    id: 'cl-norma', name: 'Norma Cluster', altId: 'Abell 3627 / Great Attractor',
    position: { raDeg: 243.55, decDeg: -60.88, distancePc: 70 * 1_000_000 },
    redshift: 0.01625, galaxyCount: 900, massTenPow14: 10.0, richness: 'cluster',
  },
  // Hercules Supercluster (ENT-7022).
  {
    id: 'sc-hercules', name: 'Hercules Supercluster',
    position: { raDeg: 241.00, decDeg: +18.00, distancePc: 154 * 1_000_000 },
    redshift: 0.0367, galaxyCount: 12_000, massTenPow14: 5_000, richness: 'supercluster',
  },
  // Abell 2744 — Pandora's Cluster (HST Frontier Fields).
  {
    id: 'cl-a2744', name: "Pandora's Cluster", altId: 'Abell 2744',
    position: { raDeg: 3.58, decDeg: -30.40, distancePc: 1_220 * 1_000_000 },
    redshift: 0.308, galaxyCount: 500, massTenPow14: 23.0, richness: 'cluster',
  },
  // El Gordo — most massive distant cluster known (ACT-CL J0102-4915).
  {
    id: 'cl-elgordo', name: 'El Gordo', altId: 'ACT-CL J0102-4915',
    position: { raDeg: 15.71, decDeg: -49.27, distancePc: 2_800 * 1_000_000 },
    redshift: 0.870, galaxyCount: 200, massTenPow14: 22.0, richness: 'cluster',
  },
  // CL J1001+0220 — proto-cluster at z=2.506.
  {
    id: 'cl-j1001', name: 'CL J1001+0220',
    position: { raDeg: 150.25, decDeg: +2.33, distancePc: 3_900 * 1_000_000 },
    redshift: 2.506, galaxyCount: 80, massTenPow14: 3.6, richness: 'cluster',
  },
];

// ---------------------------------------------------------------------------
// ENT-7023 — Galaxy Cluster Collisions
// ---------------------------------------------------------------------------

export interface ColliderPairEntry {
  id: string;
  name: string;
  altId?: string;
  position: IcrsPoint;
  redshift: number;
  /** Sub-cluster mass ratio (larger / smaller). Typical Bullet: 10:1. */
  massRatio: number;
  /** Projected DM-to-gas offset (kpc). */
  dmGasOffsetKpc: number;
  /** Collision velocity (km/s). */
  velocityKmS: number;
}

/** 2 flagship colliding-cluster systems. */
export const COLLIDING_CLUSTERS: readonly ColliderPairEntry[] = [
  {
    id: 'cc-bullet', name: 'Bullet Cluster', altId: '1E 0657-558',
    position: { raDeg: 104.63, decDeg: -55.95, distancePc: 1_240 * 1_000_000 },
    redshift: 0.296, massRatio: 10, dmGasOffsetKpc: 150, velocityKmS: 3_000,
  },
  {
    id: 'cc-musket', name: 'Musket Ball Cluster', altId: 'DLSCL J0916.2+2951',
    position: { raDeg: 139.04, decDeg: +29.85, distancePc: 1_700 * 1_000_000 },
    redshift: 0.53, massRatio: 2, dmGasOffsetKpc: 460, velocityKmS: 2_000,
  },
];

// ---------------------------------------------------------------------------
// ENT-7030 / ENT-7032 — Cosmic Filaments and Great Walls
// ---------------------------------------------------------------------------

export interface GreatWallEntry {
  id: string;
  name: string;
  /** Centroid of the wall (ICRS). */
  position: IcrsPoint;
  redshift: number;
  /** Major axis length (Mpc). */
  lengthMpc: number;
  /** Wall thickness (Mpc). */
  thicknessMpc: number;
}

/**
 * 3 famous "Great Walls". The Hercules–Corona Borealis Great Wall is flagged
 * speculative per Doc 17 ENT-7032 + Doc 22 §2.1 but kept for educational
 * completeness (UI should render it with a `[SPECULATIVE]` badge).
 */
export const GREAT_WALLS: readonly GreatWallEntry[] = [
  {
    id: 'gw-sloan', name: 'Sloan Great Wall',
    position: { raDeg: 200.00, decDeg: +0.00, distancePc: 350 * 1_000_000 },
    redshift: 0.08, lengthMpc: 420, thicknessMpc: 60,
  },
  {
    id: 'gw-cfa2', name: 'CfA2 Great Wall',
    position: { raDeg: 195.00, decDeg: +28.00, distancePc: 270 * 1_000_000 },
    redshift: 0.03, lengthMpc: 230, thicknessMpc: 50,
  },
  {
    id: 'gw-boss', name: 'BOSS Great Wall',
    position: { raDeg: 160.00, decDeg: +35.00, distancePc: 1_800 * 1_000_000 },
    redshift: 0.47, lengthMpc: 300, thicknessMpc: 80,
  },
];

// ---------------------------------------------------------------------------
// ENT-7031 — Cosmic Voids (Pan et al. 2012 showpiece subset)
// ---------------------------------------------------------------------------

export interface VoidEntry {
  id: string;
  name: string;
  /** Void centroid (ICRS). */
  position: IcrsPoint;
  redshift: number;
  /** Void diameter (Mpc). */
  diameterMpc: number;
  /** Density contrast δ = ρ/ρ̄ − 1. Typical void δ ≈ −0.8. */
  densityContrast: number;
  /** Whether the void is classified speculative (Doc 22 §2.1). */
  speculative?: boolean;
}

/** 6 famous voids — Boötes, Local, Eridanus, Giant (CVn), Sculptor, KBC. */
export const COSMIC_VOIDS: readonly VoidEntry[] = [
  {
    id: 'vd-bootes', name: 'Boötes Void',
    position: { raDeg: 222.50, decDeg: +46.00, distancePc: 250 * 1_000_000 },
    redshift: 0.052, diameterMpc: 250, densityContrast: -0.88,
  },
  {
    id: 'vd-local', name: 'Local Void',
    position: { raDeg: 279.50, decDeg: +18.00, distancePc: 23 * 1_000_000 },
    redshift: 0.0, diameterMpc: 60, densityContrast: -0.75,
  },
  {
    id: 'vd-eridanus', name: 'Eridanus Supervoid',
    altId: 'CMB Cold Spot', // informal
    position: { raDeg: 48.75, decDeg: -19.00, distancePc: 650 * 1_000_000 },
    redshift: 0.15, diameterMpc: 500, densityContrast: -0.8, speculative: true,
  } as VoidEntry & { altId?: string },
  {
    id: 'vd-giant-cvn', name: 'Giant Void (Canes Venatici)',
    position: { raDeg: 195.00, decDeg: +35.00, distancePc: 120 * 1_000_000 },
    redshift: 0.027, diameterMpc: 70, densityContrast: -0.7,
  },
  {
    id: 'vd-sculptor', name: 'Sculptor Void',
    position: { raDeg: 12.50, decDeg: -28.00, distancePc: 44 * 1_000_000 },
    redshift: 0.01, diameterMpc: 40, densityContrast: -0.65,
  },
  {
    id: 'vd-kbc', name: 'KBC Void',
    position: { raDeg: 180.00, decDeg: +30.00, distancePc: 300 * 1_000_000 },
    redshift: 0.07, diameterMpc: 600, densityContrast: -0.5, speculative: true,
  },
];

// ---------------------------------------------------------------------------
// ENT-7033 — Lyman-α Blobs (LAB showpiece set)
// ---------------------------------------------------------------------------

export interface LymanAlphaBlobEntry {
  id: string;
  name: string;
  position: IcrsPoint;
  redshift: number;
  /** Ly-α emitting extent (kpc). */
  extentKpc: number;
  /** Log₁₀ Ly-α luminosity (erg/s). */
  logLumLyA: number;
  /** Power source classification. */
  powerSource: 'starburst' | 'quasar' | 'merger';
}

export const LYMAN_ALPHA_BLOBS: readonly LymanAlphaBlobEntry[] = [
  {
    id: 'lab-1', name: 'LAB-1',
    position: { raDeg: 334.37, decDeg: +0.24, distancePc: 6_700 * 1_000_000 },
    redshift: 3.1, extentKpc: 300, logLumLyA: 44.0, powerSource: 'starburst',
  },
  {
    id: 'lab-himiko', name: 'Himiko',
    position: { raDeg: 33.22, decDeg: -5.08, distancePc: 9_400 * 1_000_000 },
    redshift: 6.6, extentKpc: 55, logLumLyA: 43.4, powerSource: 'merger',
  },
  {
    id: 'lab-mammoth-1', name: 'MAMMOTH-1',
    position: { raDeg: 217.63, decDeg: +53.22, distancePc: 4_200 * 1_000_000 },
    redshift: 2.32, extentKpc: 440, logLumLyA: 43.9, powerSource: 'quasar',
  },
];

// ---------------------------------------------------------------------------
// Aggregate entity-count manifest — used by tests (and a future T55
// validation pipeline) to assert the seed catalog covers every ENT-70xx slot.
// ---------------------------------------------------------------------------

export const LSS_CATALOG_MANIFEST = Object.freeze({
  'ENT-7010': HARRIS_DIAS_OPEN_CLUSTERS.length,
  'ENT-7011': HARRIS_GLOBULAR_CLUSTERS.length,
  'ENT-7012': OB_ASSOCIATIONS.length,
  'ENT-7020_7021_7022': GALAXY_CLUSTERS.length,
  'ENT-7023': COLLIDING_CLUSTERS.length,
  'ENT-7031': COSMIC_VOIDS.length,
  'ENT-7032': GREAT_WALLS.length,
  'ENT-7033': LYMAN_ALPHA_BLOBS.length,
});

/**
 * Total seed-catalog size. Useful for tests and load-time budgeting.
 * Excludes ENT-7030 (cosmic filaments, tile-streamed) and ENT-7040 (CMB,
 * rendered by {@link CmbBoundarySphere}, not a catalog row).
 */
export const LSS_TOTAL_SEED_COUNT =
  HARRIS_DIAS_OPEN_CLUSTERS.length +
  HARRIS_GLOBULAR_CLUSTERS.length +
  OB_ASSOCIATIONS.length +
  GALAXY_CLUSTERS.length +
  COLLIDING_CLUSTERS.length +
  COSMIC_VOIDS.length +
  GREAT_WALLS.length +
  LYMAN_ALPHA_BLOBS.length;
