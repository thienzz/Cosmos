/**
 * T45 — Nebula catalog (Doc 17 §5010–§5080 exemplars + TASKS.md T45 verify).
 *
 * This is the *seed* catalog shipped with the frontend — the production
 * 15k-nebula ingest pipeline (Sharpless 313 + Barnard 366 + Lynds LBN 1,125
 * + LDN 1,802 + Strasbourg PN ~3,500 + Green SNR 303 + NGC) lives in the
 * Airflow ETL and streams in via the tile server. The entries below cover:
 *   - Every one of the 14 Doc 17 subtypes (so the `?demo=nebulae` gallery
 *     has one real-world exemplar per subtype).
 *   - The four T45 verification targets: M42 (Orion), M1 (Crab),
 *     Barnard 68 (Bok globule), HL Tau (protoplanetary disk).
 *   - Iconic Hubble / HST / ALMA objects so search lookups by common name
 *     land on something recognisable even without the full ingest.
 *
 * Positions are J2000.0 (ICRS) — consistent with CLAUDE.md Rule #5. Sizes
 * are physical diameters in parsecs; for flat protoplanetary disks we use
 * the outer-disk diameter.
 */

import type { NebulaSubtype } from '@/utils/nebulaPalette';

export interface NebulaCatalogEntry {
  /** Stable internal id. */
  id: string;
  /** Common name. */
  name: string;
  /** Messier number if any. */
  messier?: number;
  /** NGC id if any. */
  ngc?: number;
  /** IC id if any. */
  ic?: number;
  /** Barnard dark-nebula number. */
  barnard?: number;
  /** Sharpless HII number. */
  sharpless?: number;
  /** Lynds Bright Nebula number. */
  lbn?: number;
  /** Lynds Dark Nebula number. */
  ldn?: number;
  /** Subtype per Doc 17 §5010–§5080. */
  subtype: NebulaSubtype;
  /** Right ascension (J2000, degrees). */
  ra_deg: number;
  /** Declination (J2000, degrees). */
  dec_deg: number;
  /** Distance from Sol (parsecs). */
  distance_pc: number;
  /** Physical diameter (parsecs). */
  diameter_pc: number;
  /** Apparent magnitude (V-band, integrated). `null` for dark nebulae. */
  magnitude: number | null;
  /** Apparent size on the sky (arcminutes). */
  angular_size_arcmin?: number;
  /** Common aliases for search. */
  aliases?: string[];
  /** One-line description — used by info-panel preview. */
  description?: string;
}

// ---------------------------------------------------------------------------
// Seed catalog. Ordered to mirror Doc 17 §5010..5080 so visual QA sweeps
// through the taxonomy top-to-bottom.
// ---------------------------------------------------------------------------

export const NEBULA_CATALOG: NebulaCatalogEntry[] = [
  // ---- ENT-5010 — HII Giant ------------------------------------------------
  {
    id: 'm42',
    name: 'Orion Nebula',
    messier: 42,
    ngc: 1976,
    sharpless: 281,
    subtype: 'hii-giant',
    ra_deg: 83.8221,
    dec_deg: -5.3911,
    distance_pc: 412,
    diameter_pc: 7.3,
    magnitude: 4.0,
    angular_size_arcmin: 65,
    aliases: ['M42', 'NGC 1976', 'Orion Nebula', 'Sh2-281', 'Great Orion Nebula'],
    description: 'Giant HII region ionised by the Trapezium cluster.',
  },
  {
    id: 'm16',
    name: 'Eagle Nebula',
    messier: 16,
    ngc: 6611,
    sharpless: 49,
    subtype: 'hii-giant',
    ra_deg: 274.7,
    dec_deg: -13.8,
    distance_pc: 2000,
    diameter_pc: 21,
    magnitude: 6.0,
    angular_size_arcmin: 35,
    aliases: ['M16', 'NGC 6611', 'Eagle Nebula', 'Sh2-49', 'Pillars of Creation'],
    description: 'Star-forming region famous for HST "Pillars of Creation".',
  },
  {
    id: 'ngc3372',
    name: 'Carina Nebula',
    ngc: 3372,
    sharpless: 318,
    subtype: 'hii-giant',
    ra_deg: 161.265,
    dec_deg: -59.867,
    distance_pc: 2300,
    diameter_pc: 140,
    magnitude: 1.0,
    angular_size_arcmin: 120,
    aliases: ['NGC 3372', 'Eta Carinae Nebula', 'Sh2-318'],
    description: 'Massive complex surrounding Eta Carinae LBV system.',
  },
  // ---- ENT-5011 — HII Compact / ultracompact ------------------------------
  {
    id: 'w49a',
    name: 'W49A',
    subtype: 'hii-compact',
    ra_deg: 287.57,
    dec_deg: 9.12,
    distance_pc: 11100,
    diameter_pc: 12,
    magnitude: null,
    aliases: ['W49A', 'GAL 043.17+00.00'],
    description: 'Ultracompact HII region hosting dozens of massive YSOs.',
  },
  {
    id: 'ngc6334',
    name: "Cat's Paw Nebula",
    ngc: 6334,
    sharpless: 8,
    subtype: 'hii-compact',
    ra_deg: 260.08,
    dec_deg: -35.83,
    distance_pc: 1700,
    diameter_pc: 15,
    magnitude: null,
    aliases: ['NGC 6334', 'Cat\'s Paw', 'Bear Claw', 'Sh2-8'],
    description: 'Multi-core compact HII complex along the galactic plane.',
  },
  // ---- ENT-5012 — HI neutral atomic hydrogen ------------------------------
  {
    id: 'localhi',
    name: 'Local Interstellar Cloud',
    subtype: 'hi-region',
    ra_deg: 262.0,
    dec_deg: -25.0,
    distance_pc: 0.5,
    diameter_pc: 9,
    magnitude: null,
    aliases: ['LIC', 'Local Fluff', 'Local Interstellar Medium'],
    description: 'Diffuse neutral HI cloud enveloping the Solar System.',
  },
  // ---- ENT-5020 — Planetary Spherical -------------------------------------
  {
    id: 'm57',
    name: 'Ring Nebula',
    messier: 57,
    ngc: 6720,
    subtype: 'planetary-spherical',
    ra_deg: 283.396,
    dec_deg: 33.0293,
    distance_pc: 787,
    diameter_pc: 0.67,
    magnitude: 8.8,
    angular_size_arcmin: 3.8,
    aliases: ['M57', 'NGC 6720', 'Ring Nebula'],
    description: 'Archetypal spherical planetary nebula with OIII dominated shell.',
  },
  {
    id: 'm97',
    name: 'Owl Nebula',
    messier: 97,
    ngc: 3587,
    subtype: 'planetary-spherical',
    ra_deg: 168.6988,
    dec_deg: 55.019,
    distance_pc: 700,
    diameter_pc: 2.4,
    magnitude: 9.9,
    angular_size_arcmin: 3.4,
    aliases: ['M97', 'NGC 3587', 'Owl Nebula'],
    description: 'Low-surface-brightness near-spherical PN with darker eyes.',
  },
  // ---- ENT-5021 — Planetary Bipolar ---------------------------------------
  {
    id: 'ngc6543',
    name: "Cat's Eye Nebula",
    ngc: 6543,
    subtype: 'planetary-bipolar',
    ra_deg: 269.639,
    dec_deg: 66.633,
    distance_pc: 1000,
    diameter_pc: 0.4,
    magnitude: 8.1,
    angular_size_arcmin: 0.3,
    aliases: ['NGC 6543', 'Cat\'s Eye'],
    description: 'Complex bipolar PN with concentric shells and jets.',
  },
  {
    id: 'ngc6302',
    name: 'Butterfly Nebula',
    ngc: 6302,
    subtype: 'planetary-bipolar',
    ra_deg: 258.44,
    dec_deg: -37.1,
    distance_pc: 1140,
    diameter_pc: 2.0,
    magnitude: 9.6,
    angular_size_arcmin: 0.8,
    aliases: ['NGC 6302', 'Bug Nebula', 'Butterfly Nebula'],
    description: 'Extreme bipolar lobes with hot dense equatorial dust torus.',
  },
  // ---- ENT-5022 — Planetary Irregular -------------------------------------
  {
    id: 'ngc7293',
    name: 'Helix Nebula',
    ngc: 7293,
    subtype: 'planetary-irregular',
    ra_deg: 337.4108,
    dec_deg: -20.8372,
    distance_pc: 215,
    diameter_pc: 0.76,
    magnitude: 7.6,
    angular_size_arcmin: 16,
    aliases: ['NGC 7293', 'Helix Nebula', 'Eye of God'],
    description: 'Nearest PN, dominated by thousands of cometary knots.',
  },
  {
    id: 'ngc246',
    name: 'Skull Nebula',
    ngc: 246,
    subtype: 'planetary-irregular',
    ra_deg: 11.766,
    dec_deg: -11.872,
    distance_pc: 610,
    diameter_pc: 2.0,
    magnitude: 8.0,
    angular_size_arcmin: 3.8,
    aliases: ['NGC 246', 'Skull Nebula'],
    description: 'Irregular asymmetric shell with multiple dust patches.',
  },
  // ---- ENT-5030 — Reflection ----------------------------------------------
  {
    id: 'm45',
    name: 'Pleiades Reflection Nebula',
    messier: 45,
    subtype: 'reflection',
    ra_deg: 56.75,
    dec_deg: 24.1167,
    distance_pc: 136,
    diameter_pc: 3.5,
    magnitude: 1.6,
    angular_size_arcmin: 110,
    aliases: ['M45', 'Pleiades', 'Seven Sisters'],
    description: 'Classic blue reflection nebulosity around the Pleiades cluster.',
  },
  {
    id: 'ic2118',
    name: 'Witch Head Nebula',
    ic: 2118,
    lbn: 959,
    subtype: 'reflection',
    ra_deg: 76.5,
    dec_deg: -7.75,
    distance_pc: 275,
    diameter_pc: 40,
    magnitude: 13.0,
    angular_size_arcmin: 180,
    aliases: ['IC 2118', 'Witch Head', 'LBN 959'],
    description: 'Blue reflection nebula illuminated by Rigel.',
  },
  // ---- ENT-5040 — Dark / Molecular Cloud ----------------------------------
  {
    id: 'b33',
    name: 'Horsehead Nebula',
    barnard: 33,
    ic: 434,
    subtype: 'dark-molecular',
    ra_deg: 85.247,
    dec_deg: -2.458,
    distance_pc: 422,
    diameter_pc: 1.5,
    magnitude: null,
    angular_size_arcmin: 8,
    aliases: ['B33', 'Barnard 33', 'Horsehead'],
    description: 'Iconic dark column silhouetted against IC 434.',
  },
  {
    id: 'coalsack',
    name: 'Coalsack Nebula',
    subtype: 'dark-molecular',
    ra_deg: 186.0,
    dec_deg: -62.5,
    distance_pc: 180,
    diameter_pc: 15,
    magnitude: null,
    angular_size_arcmin: 420,
    aliases: ['Coalsack', 'Caldwell 99'],
    description: 'Large diffuse dark cloud near the Southern Cross.',
  },
  {
    id: 'ldn1622',
    name: 'Boogeyman Nebula',
    ldn: 1622,
    subtype: 'dark-molecular',
    ra_deg: 89.87,
    dec_deg: 1.78,
    distance_pc: 152,
    diameter_pc: 1.2,
    magnitude: null,
    angular_size_arcmin: 60,
    aliases: ['LDN 1622', 'Boogeyman Nebula'],
    description: 'Dense dark cloud in the Orion-B complex.',
  },
  // ---- ENT-5041 — Bok Globule ---------------------------------------------
  {
    id: 'b68',
    name: 'Barnard 68',
    barnard: 68,
    subtype: 'bok-globule',
    ra_deg: 260.2633,
    dec_deg: -23.84,
    distance_pc: 125,
    diameter_pc: 0.2,
    magnitude: null,
    angular_size_arcmin: 6,
    aliases: ['B68', 'Barnard 68', 'LDN 57'],
    description: 'Nearby dense Bok globule completely opaque to background stars.',
  },
  {
    id: 'b72',
    name: "Barnard's S Nebula",
    barnard: 72,
    subtype: 'bok-globule',
    ra_deg: 261.28,
    dec_deg: -23.63,
    distance_pc: 200,
    diameter_pc: 0.35,
    magnitude: null,
    angular_size_arcmin: 15,
    aliases: ['B72', 'Snake Nebula'],
    description: 'S-shaped cluster of small Bok globules near Ophiuchus.',
  },
  // ---- ENT-5050 — SNR Shell -----------------------------------------------
  {
    id: 'veil',
    name: 'Cygnus Loop',
    ngc: 6960,
    sharpless: 103,
    subtype: 'snr-shell',
    ra_deg: 311.833,
    dec_deg: 30.717,
    distance_pc: 735,
    diameter_pc: 40,
    magnitude: 7.0,
    angular_size_arcmin: 180,
    aliases: ['Cygnus Loop', 'Veil Nebula', 'NGC 6960', 'Sh2-103'],
    description: 'Shell-type SNR from an ~10k-year-old supernova.',
  },
  {
    id: 'tycho',
    name: 'Tycho SNR',
    subtype: 'snr-shell',
    ra_deg: 6.33,
    dec_deg: 64.14,
    distance_pc: 2400,
    diameter_pc: 5.5,
    magnitude: null,
    angular_size_arcmin: 8,
    aliases: ['SN 1572', 'Tycho SNR', '3C 10', 'G120.1+1.4'],
    description: 'Type Ia remnant from the SN 1572 observed by Tycho Brahe.',
  },
  // ---- ENT-5051 — SNR Plerion / Pulsar Wind Nebula ------------------------
  {
    id: 'm1',
    name: 'Crab Nebula',
    messier: 1,
    ngc: 1952,
    subtype: 'snr-plerion',
    ra_deg: 83.6331,
    dec_deg: 22.0145,
    distance_pc: 2000,
    diameter_pc: 3.4,
    magnitude: 8.4,
    angular_size_arcmin: 6,
    aliases: ['M1', 'NGC 1952', 'Crab Nebula', 'SN 1054', 'Taurus A'],
    description: 'Archetypal pulsar wind nebula energised by the Crab Pulsar.',
  },
  {
    id: 'velapwn',
    name: 'Vela Pulsar Wind Nebula',
    subtype: 'snr-plerion',
    ra_deg: 128.838,
    dec_deg: -45.178,
    distance_pc: 290,
    diameter_pc: 0.5,
    magnitude: null,
    angular_size_arcmin: 2,
    aliases: ['Vela PWN', 'PSR B0833-45'],
    description: 'Inner plerion of the Vela SNR with visible jets.',
  },
  // ---- ENT-5060 — Wolf-Rayet ----------------------------------------------
  {
    id: 'ngc6888',
    name: 'Crescent Nebula',
    ngc: 6888,
    sharpless: 105,
    subtype: 'wolfrayet',
    ra_deg: 303.11,
    dec_deg: 38.36,
    distance_pc: 1900,
    diameter_pc: 6,
    magnitude: 7.4,
    angular_size_arcmin: 18,
    aliases: ['NGC 6888', 'Crescent Nebula', 'Sh2-105'],
    description: 'Classic WR wind-blown shell around the WN6 star WR 136.',
  },
  {
    id: 'm167',
    name: 'M1-67',
    subtype: 'wolfrayet',
    ra_deg: 292.11,
    dec_deg: 4.12,
    distance_pc: 1400,
    diameter_pc: 1.2,
    magnitude: 13.2,
    angular_size_arcmin: 1,
    aliases: ['M1-67', 'WR 124 nebula', 'Merrill\'s Star'],
    description: 'Young WR nebula around the runaway WN8h star WR 124.',
  },
  // ---- ENT-5070 — Protoplanetary Disk -------------------------------------
  {
    id: 'hltau',
    name: 'HL Tauri Disk',
    subtype: 'protoplanetary',
    ra_deg: 67.9102,
    dec_deg: 18.2336,
    distance_pc: 140,
    diameter_pc: 0.00029, // 60 AU ≈ 0.00029 pc
    magnitude: null,
    aliases: ['HL Tau', 'HL Tauri'],
    description: 'ALMA-resolved concentric rings and planet-forming gaps.',
  },
  {
    id: 'twhya',
    name: 'TW Hydrae Disk',
    subtype: 'protoplanetary',
    ra_deg: 165.466,
    dec_deg: -34.705,
    distance_pc: 60,
    diameter_pc: 0.00097, // 200 AU ≈ 0.00097 pc
    magnitude: null,
    aliases: ['TW Hya', 'TW Hydrae'],
    description: 'Nearby face-on protoplanetary disk with ALMA-imaged gaps.',
  },
  // ---- ENT-5080 — Superbubble ---------------------------------------------
  {
    id: 'localbubble',
    name: 'Local Bubble',
    subtype: 'superbubble',
    ra_deg: 0.0,
    dec_deg: 0.0,
    distance_pc: 0,
    diameter_pc: 150,
    magnitude: null,
    aliases: ['Local Bubble', 'Local Cavity'],
    description: 'Hot low-density ISM cavity enclosing the Solar neighbourhood.',
  },
  {
    id: '30dor',
    name: '30 Doradus Superbubble',
    ngc: 2070,
    subtype: 'superbubble',
    ra_deg: 84.675,
    dec_deg: -69.101,
    distance_pc: 49970,
    diameter_pc: 200,
    magnitude: 8.0,
    angular_size_arcmin: 40,
    aliases: ['30 Dor', 'Tarantula Nebula', 'NGC 2070'],
    description: 'Giant superbubble in the LMC carved by its OB association.',
  },
  {
    id: 'goulds-belt',
    name: "Gould's Belt",
    subtype: 'superbubble',
    ra_deg: 270.0,
    dec_deg: 0.0,
    distance_pc: 300,
    diameter_pc: 700,
    magnitude: null,
    aliases: ['Gould Belt', 'Gould\'s Belt'],
    description: 'Ring of overlapping superbubbles in the solar neighbourhood.',
  },
  // ---- Phase 2 additions (P2G) — iconic nebulae per audit ------------------
  // Canonical Messier / NGC HII regions + planetary nebulae + historic SNRs
  // that should resolve by search. Distances from SIMBAD consensus; angular
  // sizes from NED / GCPN where available.
  {
    id: 'm8',
    name: 'Lagoon Nebula',
    messier: 8,
    ngc: 6523,
    sharpless: 25,
    subtype: 'hii-giant',
    ra_deg: 270.9042,
    dec_deg: -24.3867,
    distance_pc: 1250,
    diameter_pc: 40,
    magnitude: 6.0,
    angular_size_arcmin: 90,
    aliases: ['M8', 'NGC 6523', 'Lagoon Nebula', 'Sh2-25'],
    description: 'Giant HII region in Sagittarius — one of the largest Messier nebulae.',
  },
  {
    id: 'm20',
    name: 'Trifid Nebula',
    messier: 20,
    ngc: 6514,
    sharpless: 30,
    subtype: 'hii-giant',
    ra_deg: 270.6083,
    dec_deg: -23.0303,
    distance_pc: 1680,
    diameter_pc: 13,
    magnitude: 6.3,
    angular_size_arcmin: 28,
    aliases: ['M20', 'NGC 6514', 'Trifid Nebula', 'Sh2-30'],
    description: 'Combined emission + reflection + dark nebula split by dust lanes.',
  },
  {
    id: 'm17',
    name: 'Omega Nebula',
    messier: 17,
    ngc: 6618,
    sharpless: 45,
    subtype: 'hii-giant',
    ra_deg: 275.1958,
    dec_deg: -16.1728,
    distance_pc: 1700,
    diameter_pc: 15,
    magnitude: 6.0,
    angular_size_arcmin: 46,
    aliases: ['M17', 'NGC 6618', 'Omega Nebula', 'Swan Nebula', 'Horseshoe Nebula', 'Sh2-45'],
    description: 'Massive HII region and active star-forming cluster.',
  },
  {
    id: 'ngc2237',
    name: 'Rosette Nebula',
    ngc: 2237,
    sharpless: 275,
    subtype: 'hii-giant',
    ra_deg: 97.9708,
    dec_deg: 4.9517,
    distance_pc: 1600,
    diameter_pc: 40,
    magnitude: 9.0,
    angular_size_arcmin: 80,
    aliases: ['NGC 2237', 'NGC 2244', 'Rosette Nebula', 'Sh2-275', 'Caldwell 49'],
    description: 'Large circular HII region with cluster NGC 2244 at its core.',
  },
  {
    id: 'ngc2264',
    name: 'Cone Nebula',
    ngc: 2264,
    sharpless: 273,
    subtype: 'hii-giant',
    ra_deg: 100.2420,
    dec_deg: 9.8950,
    distance_pc: 800,
    diameter_pc: 2.7,
    magnitude: 3.9,
    angular_size_arcmin: 20,
    aliases: ['NGC 2264', 'Cone Nebula', 'Sh2-273', 'Christmas Tree Cluster', 'Caldwell 50'],
    description: 'Dark pillar silhouetted against the HII nebula NGC 2264.',
  },
  {
    id: 'ngc1499',
    name: 'California Nebula',
    ngc: 1499,
    sharpless: 220,
    subtype: 'hii-giant',
    ra_deg: 60.0000,
    dec_deg: 36.4167,
    distance_pc: 450,
    diameter_pc: 13,
    magnitude: 6.0,
    angular_size_arcmin: 160,
    aliases: ['NGC 1499', 'California Nebula', 'Sh2-220', 'Caldwell 24'],
    description: 'Large faint emission nebula in Perseus ionised by ξ Persei.',
  },
  {
    id: 'ngc7000',
    name: 'North America Nebula',
    ngc: 7000,
    sharpless: 117,
    subtype: 'hii-giant',
    ra_deg: 314.7500,
    dec_deg: 44.3333,
    distance_pc: 795,
    diameter_pc: 30,
    magnitude: 4.0,
    angular_size_arcmin: 120,
    aliases: ['NGC 7000', 'North America Nebula', 'Sh2-117', 'Caldwell 20'],
    description: 'Continent-shaped emission nebula near Deneb.',
  },
  {
    id: 'ic5070',
    name: 'Pelican Nebula',
    ic: 5070,
    sharpless: 117,
    subtype: 'hii-giant',
    ra_deg: 313.0000,
    dec_deg: 44.3667,
    distance_pc: 795,
    diameter_pc: 13,
    magnitude: 8.0,
    angular_size_arcmin: 60,
    aliases: ['IC 5070', 'Pelican Nebula', 'Sh2-117'],
    description: 'Companion HII region to NGC 7000 across a dark dust lane.',
  },
  {
    id: 'm27',
    name: 'Dumbbell Nebula',
    messier: 27,
    ngc: 6853,
    subtype: 'planetary-bipolar',
    ra_deg: 299.9016,
    dec_deg: 22.7214,
    distance_pc: 380,
    diameter_pc: 0.9,
    magnitude: 7.5,
    angular_size_arcmin: 8.0,
    aliases: ['M27', 'NGC 6853', 'Dumbbell Nebula', 'Apple Core Nebula'],
    description: 'First planetary nebula ever discovered (Messier 1764).',
  },
  {
    id: 'cas-a',
    name: 'Cassiopeia A',
    subtype: 'snr-shell',
    ra_deg: 350.8500,
    dec_deg: 58.8150,
    distance_pc: 3400,
    diameter_pc: 3.1,
    magnitude: null,
    angular_size_arcmin: 5.0,
    aliases: ['Cas A', 'Cassiopeia A', '3C 461', 'SN 1680'],
    description: 'Youngest known galactic SNR (~340 yr); brightest radio source in the sky.',
  },
  {
    id: 'sn1006',
    name: 'SN 1006 SNR',
    subtype: 'snr-shell',
    ra_deg: 225.7000,
    dec_deg: -41.9333,
    distance_pc: 2200,
    diameter_pc: 18,
    magnitude: null,
    angular_size_arcmin: 30,
    aliases: ['SN 1006', 'PKS 1459-41', 'G327.6+14.6'],
    description: 'Brightest stellar event in recorded history (1006 AD, mag -7.5).',
  },
  {
    id: 'kepler-snr',
    name: "Kepler's Supernova SNR",
    subtype: 'snr-shell',
    ra_deg: 262.6750,
    dec_deg: -21.4833,
    distance_pc: 6100,
    diameter_pc: 5,
    magnitude: null,
    angular_size_arcmin: 3.0,
    aliases: ['SN 1604', 'Kepler SNR', 'G4.5+6.8', '3C 358'],
    description: 'Last naked-eye Milky Way supernova (1604 AD); likely Type Ia.',
  },
  {
    id: 'boomerang',
    name: 'Boomerang Nebula',
    subtype: 'protoplanetary',
    ra_deg: 186.6250,
    dec_deg: -54.2333,
    distance_pc: 1500,
    diameter_pc: 0.12,
    magnitude: null,
    angular_size_arcmin: 1.7,
    aliases: ['Boomerang Nebula', 'ESO 172-7', 'Bow Tie Nebula'],
    description: 'Coldest known natural location in the universe (~1 K).',
  },
];

// ---------------------------------------------------------------------------
// Derived helpers.
// ---------------------------------------------------------------------------

/** Lookup by any alias (case-insensitive) or canonical id. */
export function findNebulaByName(query: string): NebulaCatalogEntry | null {
  const needle = query.trim().toLowerCase();
  if (!needle) return null;
  for (const entry of NEBULA_CATALOG) {
    if (entry.id.toLowerCase() === needle) return entry;
    if (entry.name.toLowerCase() === needle) return entry;
    if (entry.messier !== undefined && `m${entry.messier}` === needle) return entry;
    if (entry.messier !== undefined && `m ${entry.messier}` === needle) return entry;
    if (entry.messier !== undefined && `messier ${entry.messier}` === needle) return entry;
    if (entry.ngc !== undefined && `ngc ${entry.ngc}` === needle) return entry;
    if (entry.ngc !== undefined && `ngc${entry.ngc}` === needle) return entry;
    if (entry.barnard !== undefined && `b${entry.barnard}` === needle) return entry;
    if (entry.barnard !== undefined && `barnard ${entry.barnard}` === needle) return entry;
    if (entry.barnard !== undefined && `b ${entry.barnard}` === needle) return entry;
    if (entry.sharpless !== undefined && `sh2-${entry.sharpless}` === needle) return entry;
    if (entry.sharpless !== undefined && `sh 2-${entry.sharpless}` === needle) return entry;
    if (entry.lbn !== undefined && `lbn ${entry.lbn}` === needle) return entry;
    if (entry.ldn !== undefined && `ldn ${entry.ldn}` === needle) return entry;
    if (entry.ic !== undefined && `ic ${entry.ic}` === needle) return entry;
    for (const alias of entry.aliases ?? []) {
      if (alias.toLowerCase() === needle) return entry;
    }
  }
  return null;
}

/** Iterate entries matching a subtype. */
export function nebulaeBySubtype(subtype: NebulaSubtype): NebulaCatalogEntry[] {
  return NEBULA_CATALOG.filter((e) => e.subtype === subtype);
}

/** One exemplar per subtype — for the `?demo=nebulae` gallery. */
export function nebulaGallerySet(): NebulaCatalogEntry[] {
  const seen = new Set<NebulaSubtype>();
  const out: NebulaCatalogEntry[] = [];
  for (const entry of NEBULA_CATALOG) {
    if (seen.has(entry.subtype)) continue;
    seen.add(entry.subtype);
    out.push(entry);
  }
  return out;
}
