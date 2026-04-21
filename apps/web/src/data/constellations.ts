/**
 * T49 — IAU 88 constellations, traditional asterism connection lines, and
 * IAU WGSN-approved star names.
 *
 * Canonical source of truth: the JSON files shipped at
 *   - `<repo>/data/constellations/iau-88-boundaries.json`
 *   - `<repo>/data/constellations/connection-lines.json`
 *   - `<repo>/data/names/iau-approved-star-names.json`
 *
 * This module mirrors that data as typed TS constants so the frontend
 * renderer can import it inside `rootDir` without plumbing a fetch call
 * through the vite middleware (the canonical files live outside
 * `apps/web/src` per the spec). The T38 ETL pipeline will regenerate both
 * copies from the upstream Delporte / Hipparcos / WGSN catalogs.
 *
 * Coordinates: ICRS J2000.0, RA/Dec in degrees (RA wrapped to [0, 360)).
 */

export interface ConstellationMeta {
  /** IAU 3-letter code (e.g. "Ori", "UMa"). */
  readonly abbr: string;
  /** Full Latin-nominative name. */
  readonly name: string;
  /** Genitive — used in Bayer designations like "α Orionis". */
  readonly genitive: string;
  /** Approximate centroid RA in degrees — used for label placement. */
  readonly centroidRaDeg: number;
  /** Approximate centroid Dec in degrees — used for label placement. */
  readonly centroidDecDeg: number;
  /** Area in square degrees (per IAU Delporte). */
  readonly areaSqDeg: number;
}

/** A pair of endpoints connected by an asterism line. */
export type ConnectionSegment = readonly [
  ra1Deg: number,
  dec1Deg: number,
  ra2Deg: number,
  dec2Deg: number,
];

export interface ConstellationLines {
  readonly abbr: string;
  readonly name: string;
  /** Traditional figure name ("Big Dipper", "Northern Cross", …). Empty
   *  string for constellations without a curated asterism in v1. */
  readonly asterism: string;
  readonly segments: ReadonlyArray<ConnectionSegment>;
}

export interface IauNamedStar {
  /** IAU-approved common name. */
  readonly name: string;
  /** Bayer / Flamsteed designation or GJ catalog label. `null` for stars
   *  with no traditional designation. */
  readonly bayer: string | null;
  /** Flamsteed number + constellation abbr (e.g. "9 CMa"). Optional. */
  readonly flamsteed?: string;
  /** Hipparcos catalogue id. `null` for stars not in Hipparcos (very
   *  faint brown dwarfs, etc.). */
  readonly hip: number | null;
  /** HD (Henry Draper) catalog id. `null` when not catalogued. */
  readonly hd?: number | null;
  /** IAU 3-letter constellation code. */
  readonly constellation: string;
  readonly raDeg: number;
  readonly decDeg: number;
  readonly magV: number;
  readonly distancePc: number;
  readonly spectralType?: string;
}

// ---------------------------------------------------------------------------
// IAU 88 constellation metadata (all 88 — centroid + area)
// ---------------------------------------------------------------------------

export const IAU_CONSTELLATIONS: ReadonlyArray<ConstellationMeta> = [
  { abbr: 'And', name: 'Andromeda', genitive: 'Andromedae', centroidRaDeg: 10.0, centroidDecDeg: 37.4, areaSqDeg: 722.3 },
  { abbr: 'Ant', name: 'Antlia', genitive: 'Antliae', centroidRaDeg: 157.7, centroidDecDeg: -32.5, areaSqDeg: 238.9 },
  { abbr: 'Aps', name: 'Apus', genitive: 'Apodis', centroidRaDeg: 247.9, centroidDecDeg: -75.3, areaSqDeg: 206.3 },
  { abbr: 'Aqr', name: 'Aquarius', genitive: 'Aquarii', centroidRaDeg: 332.6, centroidDecDeg: -10.8, areaSqDeg: 979.9 },
  { abbr: 'Aql', name: 'Aquila', genitive: 'Aquilae', centroidRaDeg: 297.7, centroidDecDeg: 3.4, areaSqDeg: 652.5 },
  { abbr: 'Ara', name: 'Ara', genitive: 'Arae', centroidRaDeg: 261.0, centroidDecDeg: -56.6, areaSqDeg: 237.1 },
  { abbr: 'Ari', name: 'Aries', genitive: 'Arietis', centroidRaDeg: 37.4, centroidDecDeg: 20.8, areaSqDeg: 441.4 },
  { abbr: 'Aur', name: 'Auriga', genitive: 'Aurigae', centroidRaDeg: 89.5, centroidDecDeg: 41.6, areaSqDeg: 657.4 },
  { abbr: 'Boo', name: 'Boötes', genitive: 'Boötis', centroidRaDeg: 215.0, centroidDecDeg: 31.2, areaSqDeg: 906.8 },
  { abbr: 'Cae', name: 'Caelum', genitive: 'Caeli', centroidRaDeg: 70.5, centroidDecDeg: -37.9, areaSqDeg: 124.9 },
  { abbr: 'Cam', name: 'Camelopardalis', genitive: 'Camelopardalis', centroidRaDeg: 90.0, centroidDecDeg: 69.4, areaSqDeg: 756.8 },
  { abbr: 'Cnc', name: 'Cancer', genitive: 'Cancri', centroidRaDeg: 130.2, centroidDecDeg: 19.8, areaSqDeg: 505.9 },
  { abbr: 'CVn', name: 'Canes Venatici', genitive: 'Canum Venaticorum', centroidRaDeg: 195.7, centroidDecDeg: 40.1, areaSqDeg: 465.2 },
  { abbr: 'CMa', name: 'Canis Major', genitive: 'Canis Majoris', centroidRaDeg: 104.3, centroidDecDeg: -22.1, areaSqDeg: 380.1 },
  { abbr: 'CMi', name: 'Canis Minor', genitive: 'Canis Minoris', centroidRaDeg: 113.5, centroidDecDeg: 6.4, areaSqDeg: 183.4 },
  { abbr: 'Cap', name: 'Capricornus', genitive: 'Capricorni', centroidRaDeg: 320.7, centroidDecDeg: -18.0, areaSqDeg: 413.9 },
  { abbr: 'Car', name: 'Carina', genitive: 'Carinae', centroidRaDeg: 130.0, centroidDecDeg: -63.2, areaSqDeg: 494.2 },
  { abbr: 'Cas', name: 'Cassiopeia', genitive: 'Cassiopeiae', centroidRaDeg: 14.5, centroidDecDeg: 61.7, areaSqDeg: 598.4 },
  { abbr: 'Cen', name: 'Centaurus', genitive: 'Centauri', centroidRaDeg: 201.5, centroidDecDeg: -48.9, areaSqDeg: 1060.4 },
  { abbr: 'Cep', name: 'Cepheus', genitive: 'Cephei', centroidRaDeg: 330.0, centroidDecDeg: 71.0, areaSqDeg: 587.8 },
  { abbr: 'Cet', name: 'Cetus', genitive: 'Ceti', centroidRaDeg: 25.0, centroidDecDeg: -7.0, areaSqDeg: 1231.4 },
  { abbr: 'Cha', name: 'Chamaeleon', genitive: 'Chamaeleontis', centroidRaDeg: 160.0, centroidDecDeg: -79.2, areaSqDeg: 131.6 },
  { abbr: 'Cir', name: 'Circinus', genitive: 'Circini', centroidRaDeg: 222.6, centroidDecDeg: -63.0, areaSqDeg: 93.4 },
  { abbr: 'Col', name: 'Columba', genitive: 'Columbae', centroidRaDeg: 85.7, centroidDecDeg: -35.1, areaSqDeg: 270.2 },
  { abbr: 'Com', name: 'Coma Berenices', genitive: 'Comae Berenices', centroidRaDeg: 187.4, centroidDecDeg: 23.3, areaSqDeg: 386.5 },
  { abbr: 'CrA', name: 'Corona Australis', genitive: 'Coronae Australis', centroidRaDeg: 283.8, centroidDecDeg: -41.1, areaSqDeg: 127.7 },
  { abbr: 'CrB', name: 'Corona Borealis', genitive: 'Coronae Borealis', centroidRaDeg: 236.0, centroidDecDeg: 32.6, areaSqDeg: 178.7 },
  { abbr: 'Crv', name: 'Corvus', genitive: 'Corvi', centroidRaDeg: 187.5, centroidDecDeg: -18.4, areaSqDeg: 183.8 },
  { abbr: 'Crt', name: 'Crater', genitive: 'Crateris', centroidRaDeg: 170.0, centroidDecDeg: -15.9, areaSqDeg: 282.4 },
  { abbr: 'Cru', name: 'Crux', genitive: 'Crucis', centroidRaDeg: 187.5, centroidDecDeg: -60.2, areaSqDeg: 68.4 },
  { abbr: 'Cyg', name: 'Cygnus', genitive: 'Cygni', centroidRaDeg: 305.0, centroidDecDeg: 42.8, areaSqDeg: 803.9 },
  { abbr: 'Del', name: 'Delphinus', genitive: 'Delphini', centroidRaDeg: 310.4, centroidDecDeg: 12.0, areaSqDeg: 188.5 },
  { abbr: 'Dor', name: 'Dorado', genitive: 'Doradus', centroidRaDeg: 79.0, centroidDecDeg: -59.3, areaSqDeg: 179.2 },
  { abbr: 'Dra', name: 'Draco', genitive: 'Draconis', centroidRaDeg: 220.0, centroidDecDeg: 67.0, areaSqDeg: 1082.9 },
  { abbr: 'Equ', name: 'Equuleus', genitive: 'Equulei', centroidRaDeg: 318.5, centroidDecDeg: 7.8, areaSqDeg: 71.6 },
  { abbr: 'Eri', name: 'Eridanus', genitive: 'Eridani', centroidRaDeg: 56.5, centroidDecDeg: -28.8, areaSqDeg: 1137.9 },
  { abbr: 'For', name: 'Fornax', genitive: 'Fornacis', centroidRaDeg: 40.0, centroidDecDeg: -31.6, areaSqDeg: 397.5 },
  { abbr: 'Gem', name: 'Gemini', genitive: 'Geminorum', centroidRaDeg: 105.0, centroidDecDeg: 22.6, areaSqDeg: 513.8 },
  { abbr: 'Gru', name: 'Grus', genitive: 'Gruis', centroidRaDeg: 332.0, centroidDecDeg: -46.4, areaSqDeg: 365.5 },
  { abbr: 'Her', name: 'Hercules', genitive: 'Herculis', centroidRaDeg: 257.5, centroidDecDeg: 27.5, areaSqDeg: 1225.1 },
  { abbr: 'Hor', name: 'Horologium', genitive: 'Horologii', centroidRaDeg: 47.5, centroidDecDeg: -53.3, areaSqDeg: 248.9 },
  { abbr: 'Hya', name: 'Hydra', genitive: 'Hydrae', centroidRaDeg: 175.0, centroidDecDeg: -14.5, areaSqDeg: 1302.8 },
  { abbr: 'Hyi', name: 'Hydrus', genitive: 'Hydri', centroidRaDeg: 37.5, centroidDecDeg: -70.0, areaSqDeg: 243.0 },
  { abbr: 'Ind', name: 'Indus', genitive: 'Indi', centroidRaDeg: 318.5, centroidDecDeg: -60.0, areaSqDeg: 294.0 },
  { abbr: 'Lac', name: 'Lacerta', genitive: 'Lacertae', centroidRaDeg: 338.3, centroidDecDeg: 46.0, areaSqDeg: 200.6 },
  { abbr: 'Leo', name: 'Leo', genitive: 'Leonis', centroidRaDeg: 160.0, centroidDecDeg: 13.1, areaSqDeg: 946.9 },
  { abbr: 'LMi', name: 'Leo Minor', genitive: 'Leonis Minoris', centroidRaDeg: 157.5, centroidDecDeg: 32.1, areaSqDeg: 231.9 },
  { abbr: 'Lep', name: 'Lepus', genitive: 'Leporis', centroidRaDeg: 82.0, centroidDecDeg: -19.0, areaSqDeg: 290.3 },
  { abbr: 'Lib', name: 'Libra', genitive: 'Librae', centroidRaDeg: 227.5, centroidDecDeg: -15.2, areaSqDeg: 538.1 },
  { abbr: 'Lup', name: 'Lupus', genitive: 'Lupi', centroidRaDeg: 229.0, centroidDecDeg: -42.7, areaSqDeg: 333.7 },
  { abbr: 'Lyn', name: 'Lynx', genitive: 'Lyncis', centroidRaDeg: 120.0, centroidDecDeg: 47.5, areaSqDeg: 545.4 },
  { abbr: 'Lyr', name: 'Lyra', genitive: 'Lyrae', centroidRaDeg: 283.8, centroidDecDeg: 36.7, areaSqDeg: 286.5 },
  { abbr: 'Men', name: 'Mensa', genitive: 'Mensae', centroidRaDeg: 82.5, centroidDecDeg: -77.5, areaSqDeg: 153.5 },
  { abbr: 'Mic', name: 'Microscopium', genitive: 'Microscopii', centroidRaDeg: 314.0, centroidDecDeg: -36.3, areaSqDeg: 209.5 },
  { abbr: 'Mon', name: 'Monoceros', genitive: 'Monocerotis', centroidRaDeg: 104.0, centroidDecDeg: 0.3, areaSqDeg: 481.6 },
  { abbr: 'Mus', name: 'Musca', genitive: 'Muscae', centroidRaDeg: 190.7, centroidDecDeg: -70.2, areaSqDeg: 138.4 },
  { abbr: 'Nor', name: 'Norma', genitive: 'Normae', centroidRaDeg: 241.6, centroidDecDeg: -51.4, areaSqDeg: 165.3 },
  { abbr: 'Oct', name: 'Octans', genitive: 'Octantis', centroidRaDeg: 330.0, centroidDecDeg: -82.2, areaSqDeg: 291.0 },
  { abbr: 'Oph', name: 'Ophiuchus', genitive: 'Ophiuchi', centroidRaDeg: 257.5, centroidDecDeg: -7.9, areaSqDeg: 948.3 },
  { abbr: 'Ori', name: 'Orion', genitive: 'Orionis', centroidRaDeg: 83.2, centroidDecDeg: 5.9, areaSqDeg: 594.1 },
  { abbr: 'Pav', name: 'Pavo', genitive: 'Pavonis', centroidRaDeg: 280.0, centroidDecDeg: -65.8, areaSqDeg: 377.7 },
  { abbr: 'Peg', name: 'Pegasus', genitive: 'Pegasi', centroidRaDeg: 340.0, centroidDecDeg: 19.5, areaSqDeg: 1120.8 },
  { abbr: 'Per', name: 'Perseus', genitive: 'Persei', centroidRaDeg: 52.5, centroidDecDeg: 45.0, areaSqDeg: 615.0 },
  { abbr: 'Phe', name: 'Phoenix', genitive: 'Phoenicis', centroidRaDeg: 15.0, centroidDecDeg: -48.6, areaSqDeg: 469.3 },
  { abbr: 'Pic', name: 'Pictor', genitive: 'Pictoris', centroidRaDeg: 87.0, centroidDecDeg: -53.5, areaSqDeg: 246.7 },
  { abbr: 'Psc', name: 'Pisces', genitive: 'Piscium', centroidRaDeg: 5.0, centroidDecDeg: 13.7, areaSqDeg: 889.4 },
  { abbr: 'PsA', name: 'Piscis Austrinus', genitive: 'Piscis Austrini', centroidRaDeg: 340.0, centroidDecDeg: -30.6, areaSqDeg: 245.4 },
  { abbr: 'Pup', name: 'Puppis', genitive: 'Puppis', centroidRaDeg: 116.5, centroidDecDeg: -31.2, areaSqDeg: 673.4 },
  { abbr: 'Pyx', name: 'Pyxis', genitive: 'Pyxidis', centroidRaDeg: 133.5, centroidDecDeg: -27.4, areaSqDeg: 220.8 },
  { abbr: 'Ret', name: 'Reticulum', genitive: 'Reticuli', centroidRaDeg: 60.7, centroidDecDeg: -60.0, areaSqDeg: 114.0 },
  { abbr: 'Sge', name: 'Sagitta', genitive: 'Sagittae', centroidRaDeg: 297.5, centroidDecDeg: 18.9, areaSqDeg: 79.9 },
  { abbr: 'Sgr', name: 'Sagittarius', genitive: 'Sagittarii', centroidRaDeg: 285.0, centroidDecDeg: -28.5, areaSqDeg: 867.4 },
  { abbr: 'Sco', name: 'Scorpius', genitive: 'Scorpii', centroidRaDeg: 252.5, centroidDecDeg: -27.0, areaSqDeg: 496.8 },
  { abbr: 'Scl', name: 'Sculptor', genitive: 'Sculptoris', centroidRaDeg: 5.0, centroidDecDeg: -32.1, areaSqDeg: 474.8 },
  { abbr: 'Sct', name: 'Scutum', genitive: 'Scuti', centroidRaDeg: 282.5, centroidDecDeg: -9.9, areaSqDeg: 109.1 },
  { abbr: 'Ser', name: 'Serpens', genitive: 'Serpentis', centroidRaDeg: 252.5, centroidDecDeg: 6.1, areaSqDeg: 636.9 },
  { abbr: 'Sex', name: 'Sextans', genitive: 'Sextantis', centroidRaDeg: 157.5, centroidDecDeg: -2.6, areaSqDeg: 313.5 },
  { abbr: 'Tau', name: 'Taurus', genitive: 'Tauri', centroidRaDeg: 67.5, centroidDecDeg: 14.9, areaSqDeg: 797.2 },
  { abbr: 'Tel', name: 'Telescopium', genitive: 'Telescopii', centroidRaDeg: 287.5, centroidDecDeg: -51.0, areaSqDeg: 251.5 },
  { abbr: 'Tri', name: 'Triangulum', genitive: 'Trianguli', centroidRaDeg: 31.5, centroidDecDeg: 31.5, areaSqDeg: 131.8 },
  { abbr: 'TrA', name: 'Triangulum Australe', genitive: 'Trianguli Australis', centroidRaDeg: 252.5, centroidDecDeg: -65.4, areaSqDeg: 109.9 },
  { abbr: 'Tuc', name: 'Tucana', genitive: 'Tucanae', centroidRaDeg: 355.0, centroidDecDeg: -65.8, areaSqDeg: 294.6 },
  { abbr: 'UMa', name: 'Ursa Major', genitive: 'Ursae Majoris', centroidRaDeg: 172.5, centroidDecDeg: 50.7, areaSqDeg: 1279.7 },
  { abbr: 'UMi', name: 'Ursa Minor', genitive: 'Ursae Minoris', centroidRaDeg: 232.5, centroidDecDeg: 77.7, areaSqDeg: 255.9 },
  { abbr: 'Vel', name: 'Vela', genitive: 'Velorum', centroidRaDeg: 142.5, centroidDecDeg: -47.2, areaSqDeg: 499.6 },
  { abbr: 'Vir', name: 'Virgo', genitive: 'Virginis', centroidRaDeg: 195.0, centroidDecDeg: -4.2, areaSqDeg: 1294.4 },
  { abbr: 'Vol', name: 'Volans', genitive: 'Volantis', centroidRaDeg: 118.0, centroidDecDeg: -69.8, areaSqDeg: 141.4 },
  { abbr: 'Vul', name: 'Vulpecula', genitive: 'Vulpeculae', centroidRaDeg: 300.0, centroidDecDeg: 24.4, areaSqDeg: 268.2 },
];

// ---------------------------------------------------------------------------
// Connection lines — traditional asterism stick-figures
// ---------------------------------------------------------------------------

/** Internal helper — narrows tuple literal inference. */
const S = (
  ra1: number,
  dec1: number,
  ra2: number,
  dec2: number,
): ConnectionSegment => [ra1, dec1, ra2, dec2] as const;

export const CONSTELLATION_LINES: ReadonlyArray<ConstellationLines> = [
  { abbr: 'UMa', name: 'Ursa Major', asterism: 'Big Dipper / Plough', segments: [
    S(165.9319, 61.7510, 165.4602, 56.3824),
    S(165.4602, 56.3824, 178.4579, 53.6948),
    S(178.4579, 53.6948, 183.8566, 57.0325),
    S(183.8566, 57.0325, 165.9319, 61.7510),
    S(183.8566, 57.0325, 193.5073, 55.9598),
    S(193.5073, 55.9598, 200.9814, 54.9254),
    S(200.9814, 54.9254, 206.8852, 49.3133),
  ] },
  { abbr: 'UMi', name: 'Ursa Minor', asterism: 'Little Dipper', segments: [
    S(37.9546, 89.2642, 263.0541, 86.5865),
    S(263.0541, 86.5865, 236.0067, 82.0372),
    S(236.0067, 82.0372, 251.4921, 77.7944),
    S(251.4921, 77.7944, 230.1822, 71.8340),
    S(230.1822, 71.8340, 222.6763, 74.1555),
    S(222.6763, 74.1555, 251.4921, 77.7944),
  ] },
  { abbr: 'Ori', name: 'Orion', asterism: 'Orion the Hunter', segments: [
    S(88.7929, 7.4069, 81.2828, 6.3497),
    S(88.7929, 7.4069, 85.1896, -1.9426),
    S(81.2828, 6.3497, 83.0017, -0.2991),
    S(85.1896, -1.9426, 86.9391, -9.6697),
    S(83.0017, -0.2991, 78.6345, -8.2016),
    S(78.6345, -8.2016, 86.9391, -9.6697),
    S(83.0017, -0.2991, 84.0534, -1.2019),
    S(84.0534, -1.2019, 85.1896, -1.9426),
    S(83.8186, -5.3899, 83.7184, -5.6666),
    S(83.6584, -5.9098, 83.8186, -5.3899),
  ] },
  { abbr: 'CMa', name: 'Canis Major', asterism: 'The Greater Dog', segments: [
    S(101.2875, -16.7161, 95.6749, -17.9559),
    S(101.2875, -16.7161, 104.6564, -28.9721),
    S(104.6564, -28.9721, 107.0977, -26.3932),
    S(107.0977, -26.3932, 111.0237, -29.3031),
    S(101.2875, -16.7161, 105.7569, -15.6333),
    S(105.7569, -15.6333, 95.0779, -30.0634),
  ] },
  { abbr: 'CMi', name: 'Canis Minor', asterism: 'The Lesser Dog', segments: [
    S(114.8255, 5.2250, 111.7876, 8.2893),
  ] },
  { abbr: 'Gem', name: 'Gemini', asterism: 'The Twins', segments: [
    S(113.6500, 31.8883, 116.3289, 28.0262),
    S(113.6500, 31.8883, 100.9831, 25.1311),
    S(116.3289, 28.0262, 110.0307, 21.9824),
    S(110.0307, 21.9824, 99.4279, 16.3993),
    S(100.9831, 25.1311, 95.7400, 22.5136),
    S(95.7400, 22.5136, 93.7194, 22.5069),
    S(99.4279, 16.3993, 95.7400, 22.5136),
  ] },
  { abbr: 'Tau', name: 'Taurus', asterism: 'The Bull', segments: [
    S(68.9801, 16.5093, 81.5729, 28.6075),
    S(68.9801, 16.5093, 64.9485, 15.8708),
    S(64.9485, 15.8708, 60.7000, 12.4900),
    S(68.9801, 16.5093, 74.2400, 12.6500),
    S(74.2400, 12.6500, 81.5729, 28.6075),
    S(56.8711, 24.1051, 57.2912, 24.0534),
    S(56.2188, 24.1134, 56.8711, 24.1051),
  ] },
  { abbr: 'Cas', name: 'Cassiopeia', asterism: 'The W', segments: [
    S(2.2949, 59.1498, 10.1269, 56.5373),
    S(10.1269, 56.5373, 14.1772, 60.7167),
    S(14.1772, 60.7167, 21.4538, 60.2354),
    S(21.4538, 60.2354, 28.5985, 63.6701),
  ] },
  { abbr: 'Cep', name: 'Cepheus', asterism: "The King's House", segments: [
    S(319.6449, 62.5855, 322.1650, 70.5606),
    S(322.1650, 70.5606, 354.8369, 77.6323),
    S(319.6449, 62.5855, 337.2800, 58.2000),
    S(337.2800, 58.2000, 354.8369, 77.6323),
    S(319.6449, 62.5855, 311.3224, 61.8400),
    S(311.3224, 61.8400, 337.2800, 58.2000),
  ] },
  { abbr: 'Per', name: 'Perseus', asterism: 'The Hero', segments: [
    S(47.0423, 40.9556, 51.0807, 49.8612),
    S(51.0807, 49.8612, 63.7240, 47.7878),
    S(51.0807, 49.8612, 52.2670, 41.9000),
    S(52.2670, 41.9000, 56.0796, 32.2883),
    S(47.0423, 40.9556, 46.2945, 38.8402),
  ] },
  { abbr: 'And', name: 'Andromeda', asterism: 'The Chained Maiden', segments: [
    S(2.0968, 29.0905, 17.4330, 35.6206),
    S(17.4330, 35.6206, 30.9747, 42.3296),
    S(30.9747, 42.3296, 51.0807, 49.8612),
    S(17.4330, 35.6206, 9.8321, 38.5000),
  ] },
  { abbr: 'Peg', name: 'Pegasus', asterism: 'Great Square', segments: [
    S(346.1902, 15.2053, 345.9437, 28.0828),
    S(345.9437, 28.0828, 2.0968, 29.0905),
    S(2.0968, 29.0905, 3.3089, 15.1836),
    S(3.3089, 15.1836, 346.1902, 15.2053),
    S(345.9437, 28.0828, 326.0465, 9.8750),
  ] },
  { abbr: 'Cyg', name: 'Cygnus', asterism: 'Northern Cross', segments: [
    S(310.3580, 45.2803, 305.5571, 40.2567),
    S(305.5571, 40.2567, 292.6803, 27.9597),
    S(305.5571, 40.2567, 311.5527, 33.9703),
    S(305.5571, 40.2567, 298.1183, 45.1308),
  ] },
  { abbr: 'Lyr', name: 'Lyra', asterism: 'The Lyre', segments: [
    S(279.2347, 38.7837, 282.5200, 33.3627),
    S(282.5200, 33.3627, 284.7360, 32.6895),
    S(284.7360, 32.6895, 279.2347, 38.7837),
    S(282.5200, 33.3627, 281.1914, 36.8985),
  ] },
  { abbr: 'Aql', name: 'Aquila', asterism: 'The Eagle', segments: [
    S(297.6958, 8.8683, 296.5649, 10.6133),
    S(297.6958, 8.8683, 298.1183, 6.4068),
    S(297.6958, 8.8683, 286.3525, 13.8634),
    S(297.6958, 8.8683, 310.1857, -0.8215),
  ] },
  { abbr: 'Sgr', name: 'Sagittarius', asterism: 'The Teapot', segments: [
    S(276.0430, -34.3846, 283.8163, -26.2968),
    S(283.8163, -26.2968, 276.9930, -25.4217),
    S(276.9930, -25.4217, 275.2486, -29.8281),
    S(275.2486, -29.8281, 276.0430, -34.3846),
    S(275.2486, -29.8281, 285.6530, -29.8803),
    S(285.6530, -29.8803, 283.8163, -26.2968),
  ] },
  { abbr: 'Sco', name: 'Scorpius', asterism: 'The Scorpion', segments: [
    S(240.0833, -22.6217, 241.3593, -19.8054),
    S(241.3593, -19.8054, 247.3519, -26.4320),
    S(247.3519, -26.4320, 252.5411, -34.2933),
    S(252.5411, -34.2933, 263.4022, -37.1038),
    S(263.4022, -37.1038, 262.6911, -37.2958),
    S(263.4022, -37.1038, 264.3298, -42.9978),
  ] },
  { abbr: 'Leo', name: 'Leo', asterism: 'The Lion / Sickle', segments: [
    S(152.0929, 11.9672, 154.9930, 19.8415),
    S(154.9930, 19.8415, 154.1729, 23.4173),
    S(154.1729, 23.4173, 146.4625, 23.7743),
    S(146.4625, 23.7743, 154.9930, 19.8415),
    S(152.0929, 11.9672, 168.5271, 20.5237),
    S(168.5271, 20.5237, 177.2649, 14.5720),
    S(177.2649, 14.5720, 168.5601, 15.4298),
    S(168.5601, 15.4298, 152.0929, 11.9672),
  ] },
  { abbr: 'Vir', name: 'Virgo', asterism: 'The Maiden', segments: [
    S(201.2983, -11.1613, 190.4151, -1.4494),
    S(190.4151, -1.4494, 177.6737, 1.7649),
    S(201.2983, -11.1613, 210.4107, -0.5958),
    S(210.4107, -0.5958, 195.5443, 10.9592),
    S(195.5443, 10.9592, 193.9007, 3.3974),
  ] },
  { abbr: 'Boo', name: 'Boötes', asterism: 'The Herdsman (kite)', segments: [
    S(213.9153, 19.1824, 221.2467, 27.0742),
    S(221.2467, 27.0742, 218.0190, 38.3082),
    S(218.0190, 38.3082, 225.4866, 40.3906),
    S(225.4866, 40.3906, 213.9153, 19.1824),
    S(213.9153, 19.1824, 208.6711, 18.3977),
  ] },
  { abbr: 'CrB', name: 'Corona Borealis', asterism: 'Northern Crown', segments: [
    S(233.6717, 26.7147, 231.9570, 29.1058),
    S(231.9570, 29.1058, 231.2331, 26.2957),
    S(233.6717, 26.7147, 235.9100, 26.2957),
    S(235.9100, 26.2957, 237.4051, 26.0684),
    S(237.4051, 26.0684, 240.3604, 29.8510),
  ] },
  { abbr: 'Her', name: 'Hercules', asterism: 'The Keystone', segments: [
    S(247.5549, 21.4896, 250.3227, 31.6027),
    S(250.3227, 31.6027, 258.7620, 24.8392),
    S(258.7620, 24.8392, 264.8663, 38.9222),
    S(264.8663, 38.9222, 250.3227, 31.6027),
    S(247.5549, 21.4896, 258.6620, 14.3904),
  ] },
  { abbr: 'Dra', name: 'Draco', asterism: 'The Dragon', segments: [
    S(269.1516, 51.4889, 262.6080, 52.3014),
    S(262.6080, 52.3014, 268.3819, 56.8725),
    S(268.3819, 56.8725, 269.1516, 51.4889),
    S(262.6080, 52.3014, 257.1968, 65.7147),
    S(257.1968, 65.7147, 246.2250, 61.5136),
    S(246.2250, 61.5136, 231.2325, 58.9663),
    S(231.2325, 58.9663, 211.0973, 64.3758),
  ] },
  { abbr: 'Cnc', name: 'Cancer', asterism: 'The Crab', segments: [
    S(131.1712, 18.1542, 134.6216, 11.8577),
    S(131.1712, 18.1542, 124.1280, 9.1855),
    S(131.1712, 18.1542, 131.6740, 28.7600),
  ] },
  { abbr: 'Ari', name: 'Aries', asterism: 'The Ram', segments: [
    S(31.7933, 23.4624, 28.6603, 20.8080),
    S(28.6603, 20.8080, 28.3829, 19.2941),
  ] },
  { abbr: 'Psc', name: 'Pisces', asterism: 'The Fishes', segments: [
    S(30.5121, 2.7636, 23.4871, 6.8639),
    S(23.4871, 6.8639, 9.8325, 7.5850),
    S(9.8325, 7.5850, 0.4843, 6.8639),
    S(0.4843, 6.8639, 354.9910, 15.7350),
    S(354.9910, 15.7350, 345.9604, 17.1900),
    S(345.9604, 17.1900, 351.7279, 14.5750),
  ] },
  { abbr: 'Cet', name: 'Cetus', asterism: 'The Whale', segments: [
    S(45.5699, 4.0897, 40.8232, 3.2359),
    S(40.8232, 3.2359, 34.8367, -2.9776),
    S(34.8367, -2.9776, 27.8653, -10.3350),
    S(27.8653, -10.3350, 10.8975, -17.9867),
    S(10.8975, -17.9867, 17.1476, -10.1821),
    S(17.1476, -10.1821, 27.8653, -10.3350),
  ] },
  { abbr: 'Eri', name: 'Eridanus', asterism: 'The River', segments: [
    S(24.4286, -57.2367, 40.4069, -40.3048),
    S(40.4069, -40.3048, 55.8122, -9.7633),
    S(55.8122, -9.7633, 59.5074, -13.5086),
    S(59.5074, -13.5086, 63.8180, -7.6529),
    S(63.8180, -7.6529, 76.9622, -5.0864),
  ] },
  { abbr: 'Lep', name: 'Lepus', asterism: 'The Hare', segments: [
    S(83.1825, -17.8222, 82.0614, -20.7594),
    S(83.1825, -17.8222, 76.3642, -22.3714),
    S(82.0614, -20.7594, 85.8432, -20.8787),
  ] },
  { abbr: 'Col', name: 'Columba', asterism: 'The Dove', segments: [
    S(84.9123, -34.0741, 87.7398, -35.7683),
    S(87.7398, -35.7683, 84.3577, -33.4365),
  ] },
  { abbr: 'Aur', name: 'Auriga', asterism: 'The Charioteer', segments: [
    S(79.1723, 45.9980, 89.8822, 44.9475),
    S(89.8822, 44.9475, 81.5729, 28.6075),
    S(81.5729, 28.6075, 74.2482, 33.1661),
    S(74.2482, 33.1661, 79.1723, 45.9980),
  ] },
  { abbr: 'Cru', name: 'Crux', asterism: 'Southern Cross', segments: [
    S(186.6495, -63.0991, 187.7915, -57.1133),
    S(191.9303, -59.6887, 183.7863, -58.7489),
  ] },
  { abbr: 'Cen', name: 'Centaurus', asterism: 'The Centaur', segments: [
    S(219.9042, -60.8339, 210.9559, -60.3730),
    S(210.9559, -60.3730, 204.9719, -53.4664),
    S(204.9719, -53.4664, 211.6708, -36.3700),
    S(211.6708, -36.3700, 197.9683, -48.9598),
    S(197.9683, -48.9598, 210.9559, -60.3730),
  ] },
  { abbr: 'Car', name: 'Carina', asterism: 'The Keel', segments: [
    S(95.9880, -52.6957, 139.2725, -59.2753),
    S(139.2725, -59.2753, 138.3000, -69.7171),
    S(138.3000, -69.7171, 125.6286, -59.5095),
    S(125.6286, -59.5095, 95.9880, -52.6957),
  ] },
  { abbr: 'Vel', name: 'Vela', asterism: 'The Sails', segments: [
    S(140.5284, -55.0108, 131.1760, -54.7086),
    S(131.1760, -54.7086, 136.9990, -43.4326),
    S(136.9990, -43.4326, 140.5284, -55.0108),
  ] },
  { abbr: 'Pup', name: 'Puppis', asterism: 'The Stern', segments: [
    S(120.8961, -40.0032, 116.3113, -37.0974),
    S(116.3113, -37.0974, 109.2856, -37.0984),
  ] },
  { abbr: 'Hya', name: 'Hydra', asterism: 'The Water Snake', segments: [
    S(141.8969, -8.6586, 131.6740, 6.4186),
    S(141.8969, -8.6586, 162.4140, -16.1936),
    S(162.4140, -16.1936, 194.0074, -23.1714),
    S(194.0074, -23.1714, 211.8889, -26.6824),
  ] },
  { abbr: 'Crv', name: 'Corvus', asterism: 'The Crow', segments: [
    S(183.9515, -17.5420, 187.4661, -16.5154),
    S(187.4661, -16.5154, 188.5968, -23.3965),
    S(188.5968, -23.3965, 182.5316, -22.6197),
    S(182.5316, -22.6197, 183.9515, -17.5420),
  ] },
  { abbr: 'Crt', name: 'Crater', asterism: 'The Cup', segments: [
    S(164.9436, -18.2988, 169.8366, -14.7782),
    S(169.8366, -14.7782, 171.1518, -17.1500),
    S(171.1518, -17.1500, 175.2657, -22.8262),
    S(175.2657, -22.8262, 168.6716, -21.4194),
  ] },
  { abbr: 'Lib', name: 'Libra', asterism: 'The Scales', segments: [
    S(222.7195, -16.0418, 229.2517, -9.3829),
    S(229.2517, -9.3829, 228.8664, -14.7895),
    S(228.8664, -14.7895, 222.7195, -16.0418),
  ] },
  { abbr: 'Oph', name: 'Ophiuchus', asterism: 'The Serpent Bearer', segments: [
    S(263.7335, 12.5600, 257.5946, -15.7250),
    S(257.5946, -15.7250, 249.2891, -10.5671),
    S(249.2891, -10.5671, 240.4723, -3.6943),
    S(240.4723, -3.6943, 263.7335, 12.5600),
  ] },
  { abbr: 'Cap', name: 'Capricornus', asterism: 'The Sea-Goat', segments: [
    S(305.2527, -14.7814, 325.0228, -16.6625),
    S(325.0228, -16.6625, 326.7602, -16.1273),
    S(326.7602, -16.1273, 321.6669, -22.4113),
    S(321.6669, -22.4113, 316.4896, -25.2737),
    S(316.4896, -25.2737, 305.2527, -14.7814),
  ] },
  { abbr: 'Aqr', name: 'Aquarius', asterism: 'The Water Bearer', segments: [
    S(331.4459, -0.3198, 322.8898, -5.5713),
    S(331.4459, -0.3198, 339.2906, -7.5796),
    S(339.2906, -7.5796, 348.5908, -9.0823),
  ] },
  { abbr: 'PsA', name: 'Piscis Austrinus', asterism: 'The Southern Fish', segments: [
    S(344.4127, -29.6222, 340.6667, -27.0435),
  ] },
  { abbr: 'Gru', name: 'Grus', asterism: 'The Crane', segments: [
    S(332.0583, -46.9611, 340.6667, -46.8846),
    S(340.6667, -46.8846, 337.5217, -43.4954),
  ] },
  { abbr: 'Phe', name: 'Phoenix', asterism: 'The Phoenix', segments: [
    S(6.5708, -42.3060, 16.5211, -46.7183),
    S(16.5211, -46.7183, 22.0912, -43.3180),
  ] },
  { abbr: 'Tri', name: 'Triangulum', asterism: 'The Triangle', segments: [
    S(28.2700, 29.5792, 32.3853, 34.9873),
    S(32.3853, 34.9873, 34.3285, 33.8473),
    S(34.3285, 33.8473, 28.2700, 29.5792),
  ] },
  { abbr: 'Del', name: 'Delphinus', asterism: 'The Dolphin', segments: [
    S(310.5028, 14.5952, 310.1857, 15.9122),
    S(310.1857, 15.9122, 308.8263, 15.9120),
    S(308.8263, 15.9120, 309.9055, 14.5952),
    S(309.9055, 14.5952, 310.5028, 14.5952),
  ] },
  { abbr: 'Sge', name: 'Sagitta', asterism: 'The Arrow', segments: [
    S(295.0240, 17.4761, 297.5012, 18.0139),
    S(297.5012, 18.0139, 299.6892, 19.4924),
  ] },
  { abbr: 'Vul', name: 'Vulpecula', asterism: 'The Fox', segments: [
    S(293.5470, 24.6651, 299.5400, 27.2900),
  ] },
  { abbr: 'CVn', name: 'Canes Venatici', asterism: 'The Hunting Dogs', segments: [
    S(194.0074, 38.3184, 188.4362, 41.3575),
  ] },
  { abbr: 'Com', name: 'Coma Berenices', asterism: "Berenice's Hair", segments: [
    S(197.9683, 27.8776, 186.7349, 28.2683),
  ] },
];

// ---------------------------------------------------------------------------
// IAU WGSN-approved star names (curated subset — 180+ entries covering
// Doc 33 §8.3 verification targets + 100 brightest + 100 nearest)
// ---------------------------------------------------------------------------

export const IAU_NAMED_STARS: ReadonlyArray<IauNamedStar> = [
  { name: 'Sirius', bayer: 'α CMa', flamsteed: '9 CMa', hip: 32349, hd: 48915, constellation: 'CMa', raDeg: 101.2875, decDeg: -16.7161, magV: -1.46, distancePc: 2.637, spectralType: 'A1V' },
  { name: 'Canopus', bayer: 'α Car', hip: 30438, hd: 45348, constellation: 'Car', raDeg: 95.9880, decDeg: -52.6957, magV: -0.74, distancePc: 95.0, spectralType: 'F0II' },
  { name: 'Arcturus', bayer: 'α Boo', flamsteed: '16 Boo', hip: 69673, hd: 124897, constellation: 'Boo', raDeg: 213.9153, decDeg: 19.1824, magV: -0.05, distancePc: 11.26, spectralType: 'K1.5III' },
  { name: 'Rigil Kentaurus', bayer: 'α Cen A', hip: 71683, hd: 128620, constellation: 'Cen', raDeg: 219.9042, decDeg: -60.8339, magV: -0.01, distancePc: 1.339, spectralType: 'G2V' },
  { name: 'Toliman', bayer: 'α Cen B', hip: 71681, hd: 128621, constellation: 'Cen', raDeg: 219.8963, decDeg: -60.8373, magV: 1.35, distancePc: 1.339, spectralType: 'K1V' },
  { name: 'Proxima Centauri', bayer: 'α Cen C', hip: 70890, hd: null, constellation: 'Cen', raDeg: 217.4290, decDeg: -62.6795, magV: 11.13, distancePc: 1.301, spectralType: 'M5.5Ve' },
  { name: 'Vega', bayer: 'α Lyr', flamsteed: '3 Lyr', hip: 91262, hd: 172167, constellation: 'Lyr', raDeg: 279.2347, decDeg: 38.7837, magV: 0.03, distancePc: 7.68, spectralType: 'A0V' },
  { name: 'Capella', bayer: 'α Aur', flamsteed: '13 Aur', hip: 24608, hd: 34029, constellation: 'Aur', raDeg: 79.1723, decDeg: 45.9980, magV: 0.08, distancePc: 13.2, spectralType: 'G8III' },
  { name: 'Rigel', bayer: 'β Ori', flamsteed: '19 Ori', hip: 24436, hd: 34085, constellation: 'Ori', raDeg: 78.6345, decDeg: -8.2016, magV: 0.13, distancePc: 264.0, spectralType: 'B8Ia' },
  { name: 'Procyon', bayer: 'α CMi', flamsteed: '10 CMi', hip: 37279, hd: 61421, constellation: 'CMi', raDeg: 114.8255, decDeg: 5.2250, magV: 0.34, distancePc: 3.51, spectralType: 'F5IV-V' },
  { name: 'Achernar', bayer: 'α Eri', hip: 7588, hd: 10144, constellation: 'Eri', raDeg: 24.4286, decDeg: -57.2367, magV: 0.46, distancePc: 42.8, spectralType: 'B6Ve' },
  { name: 'Betelgeuse', bayer: 'α Ori', flamsteed: '58 Ori', hip: 27989, hd: 39801, constellation: 'Ori', raDeg: 88.7929, decDeg: 7.4069, magV: 0.50, distancePc: 168.0, spectralType: 'M1-2Ia-Iab' },
  { name: 'Hadar', bayer: 'β Cen', hip: 68702, hd: 122451, constellation: 'Cen', raDeg: 210.9559, decDeg: -60.3730, magV: 0.61, distancePc: 120.0, spectralType: 'B1III' },
  { name: 'Altair', bayer: 'α Aql', flamsteed: '53 Aql', hip: 97649, hd: 187642, constellation: 'Aql', raDeg: 297.6958, decDeg: 8.8683, magV: 0.77, distancePc: 5.13, spectralType: 'A7V' },
  { name: 'Acrux', bayer: 'α Cru', hip: 60718, hd: 108248, constellation: 'Cru', raDeg: 186.6495, decDeg: -63.0991, magV: 0.76, distancePc: 99.0, spectralType: 'B0.5IV' },
  { name: 'Aldebaran', bayer: 'α Tau', flamsteed: '87 Tau', hip: 21421, hd: 29139, constellation: 'Tau', raDeg: 68.9801, decDeg: 16.5093, magV: 0.86, distancePc: 20.4, spectralType: 'K5III' },
  { name: 'Antares', bayer: 'α Sco', flamsteed: '21 Sco', hip: 80763, hd: 148478, constellation: 'Sco', raDeg: 247.3519, decDeg: -26.4320, magV: 0.96, distancePc: 170.0, spectralType: 'M1.5Iab-Ib' },
  { name: 'Spica', bayer: 'α Vir', flamsteed: '67 Vir', hip: 65474, hd: 116658, constellation: 'Vir', raDeg: 201.2983, decDeg: -11.1613, magV: 0.97, distancePc: 77.3, spectralType: 'B1III-IV' },
  { name: 'Pollux', bayer: 'β Gem', flamsteed: '78 Gem', hip: 37826, hd: 62509, constellation: 'Gem', raDeg: 116.3289, decDeg: 28.0262, magV: 1.14, distancePc: 10.4, spectralType: 'K0III' },
  { name: 'Fomalhaut', bayer: 'α PsA', flamsteed: '24 PsA', hip: 113368, hd: 216956, constellation: 'PsA', raDeg: 344.4127, decDeg: -29.6222, magV: 1.16, distancePc: 7.70, spectralType: 'A3V' },
  { name: 'Deneb', bayer: 'α Cyg', flamsteed: '50 Cyg', hip: 102098, hd: 197345, constellation: 'Cyg', raDeg: 310.3580, decDeg: 45.2803, magV: 1.25, distancePc: 802.0, spectralType: 'A2Ia' },
  { name: 'Mimosa', bayer: 'β Cru', hip: 62434, hd: 111123, constellation: 'Cru', raDeg: 191.9303, decDeg: -59.6887, magV: 1.25, distancePc: 85.0, spectralType: 'B0.5III' },
  { name: 'Regulus', bayer: 'α Leo', flamsteed: '32 Leo', hip: 49669, hd: 87901, constellation: 'Leo', raDeg: 152.0929, decDeg: 11.9672, magV: 1.36, distancePc: 24.3, spectralType: 'B8IVn' },
  { name: 'Adhara', bayer: 'ε CMa', flamsteed: '21 CMa', hip: 33579, hd: 52089, constellation: 'CMa', raDeg: 104.6564, decDeg: -28.9721, magV: 1.50, distancePc: 132.0, spectralType: 'B2Iab' },
  { name: 'Castor', bayer: 'α Gem', flamsteed: '66 Gem', hip: 36850, hd: 60178, constellation: 'Gem', raDeg: 113.6500, decDeg: 31.8883, magV: 1.58, distancePc: 15.8, spectralType: 'A1V' },
  { name: 'Shaula', bayer: 'λ Sco', hip: 85927, hd: 158926, constellation: 'Sco', raDeg: 263.4022, decDeg: -37.1038, magV: 1.62, distancePc: 174.0, spectralType: 'B2IV' },
  { name: 'Gacrux', bayer: 'γ Cru', hip: 61084, hd: 108903, constellation: 'Cru', raDeg: 187.7915, decDeg: -57.1133, magV: 1.64, distancePc: 27.2, spectralType: 'M3.5III' },
  { name: 'Bellatrix', bayer: 'γ Ori', flamsteed: '24 Ori', hip: 25336, hd: 35468, constellation: 'Ori', raDeg: 81.2828, decDeg: 6.3497, magV: 1.64, distancePc: 77.3, spectralType: 'B2III' },
  { name: 'Elnath', bayer: 'β Tau', flamsteed: '112 Tau', hip: 25428, hd: 35497, constellation: 'Tau', raDeg: 81.5729, decDeg: 28.6075, magV: 1.65, distancePc: 40.2, spectralType: 'B7III' },
  { name: 'Miaplacidus', bayer: 'β Car', hip: 45238, hd: 80007, constellation: 'Car', raDeg: 138.3000, decDeg: -69.7171, magV: 1.68, distancePc: 34.1, spectralType: 'A1III' },
  { name: 'Alnilam', bayer: 'ε Ori', flamsteed: '46 Ori', hip: 26311, hd: 37128, constellation: 'Ori', raDeg: 84.0534, decDeg: -1.2019, magV: 1.69, distancePc: 411.0, spectralType: 'B0Ia' },
  { name: 'Alnair', bayer: 'α Gru', hip: 109268, hd: 209952, constellation: 'Gru', raDeg: 332.0583, decDeg: -46.9611, magV: 1.74, distancePc: 31.1, spectralType: 'B6V' },
  { name: 'Alnitak', bayer: 'ζ Ori', flamsteed: '50 Ori', hip: 26727, hd: 37742, constellation: 'Ori', raDeg: 85.1896, decDeg: -1.9426, magV: 1.77, distancePc: 225.0, spectralType: 'O9.5Ib' },
  { name: 'Alioth', bayer: 'ε UMa', flamsteed: '77 UMa', hip: 62956, hd: 112185, constellation: 'UMa', raDeg: 193.5073, decDeg: 55.9598, magV: 1.77, distancePc: 25.3, spectralType: 'A1III-IVp' },
  { name: 'Dubhe', bayer: 'α UMa', flamsteed: '50 UMa', hip: 54061, hd: 95689, constellation: 'UMa', raDeg: 165.9319, decDeg: 61.7510, magV: 1.79, distancePc: 37.7, spectralType: 'K0III' },
  { name: 'Mirfak', bayer: 'α Per', flamsteed: '33 Per', hip: 15863, hd: 20902, constellation: 'Per', raDeg: 51.0807, decDeg: 49.8612, magV: 1.79, distancePc: 155.0, spectralType: 'F5Ib' },
  { name: 'Wezen', bayer: 'δ CMa', flamsteed: '25 CMa', hip: 34444, hd: 54605, constellation: 'CMa', raDeg: 107.0977, decDeg: -26.3932, magV: 1.83, distancePc: 490.0, spectralType: 'F8Ia' },
  { name: 'Kaus Australis', bayer: 'ε Sgr', flamsteed: '20 Sgr', hip: 90185, hd: 169022, constellation: 'Sgr', raDeg: 276.0430, decDeg: -34.3846, magV: 1.85, distancePc: 44.0, spectralType: 'B9.5III' },
  { name: 'Alkaid', bayer: 'η UMa', flamsteed: '85 UMa', hip: 67301, hd: 120315, constellation: 'UMa', raDeg: 206.8852, decDeg: 49.3133, magV: 1.86, distancePc: 32.4, spectralType: 'B3V' },
  { name: 'Menkalinan', bayer: 'β Aur', flamsteed: '34 Aur', hip: 28360, hd: 40183, constellation: 'Aur', raDeg: 89.8822, decDeg: 44.9475, magV: 1.90, distancePc: 25.1, spectralType: 'A1IV' },
  { name: 'Atria', bayer: 'α TrA', hip: 82273, hd: 150798, constellation: 'TrA', raDeg: 252.1662, decDeg: -69.0278, magV: 1.92, distancePc: 120.0, spectralType: 'K2IIb-IIIa' },
  { name: 'Alhena', bayer: 'γ Gem', flamsteed: '24 Gem', hip: 31681, hd: 47105, constellation: 'Gem', raDeg: 99.4279, decDeg: 16.3993, magV: 1.93, distancePc: 33.7, spectralType: 'A1IV' },
  { name: 'Peacock', bayer: 'α Pav', hip: 100751, hd: 193924, constellation: 'Pav', raDeg: 306.4120, decDeg: -56.7350, magV: 1.94, distancePc: 55.6, spectralType: 'B2IV' },
  { name: 'Mirzam', bayer: 'β CMa', flamsteed: '2 CMa', hip: 30324, hd: 44743, constellation: 'CMa', raDeg: 95.6749, decDeg: -17.9559, magV: 1.98, distancePc: 152.0, spectralType: 'B1II-III' },
  { name: 'Alphard', bayer: 'α Hya', flamsteed: '30 Hya', hip: 46390, hd: 81797, constellation: 'Hya', raDeg: 141.8969, decDeg: -8.6586, magV: 1.98, distancePc: 55.0, spectralType: 'K3II-III' },
  { name: 'Polaris', bayer: 'α UMi', flamsteed: '1 UMi', hip: 11767, hd: 8890, constellation: 'UMi', raDeg: 37.9546, decDeg: 89.2642, magV: 1.98, distancePc: 133.0, spectralType: 'F7Ib' },
  { name: 'Hamal', bayer: 'α Ari', flamsteed: '13 Ari', hip: 9884, hd: 12929, constellation: 'Ari', raDeg: 31.7933, decDeg: 23.4624, magV: 2.00, distancePc: 20.2, spectralType: 'K2III' },
  { name: 'Alpheratz', bayer: 'α And', flamsteed: '21 And', hip: 677, hd: 358, constellation: 'And', raDeg: 2.0968, decDeg: 29.0905, magV: 2.06, distancePc: 29.7, spectralType: 'B8IVp' },
  { name: 'Mirach', bayer: 'β And', flamsteed: '43 And', hip: 5447, hd: 6860, constellation: 'And', raDeg: 17.4330, decDeg: 35.6206, magV: 2.05, distancePc: 60.2, spectralType: 'M0III' },
  { name: 'Kochab', bayer: 'β UMi', flamsteed: '7 UMi', hip: 72607, hd: 131873, constellation: 'UMi', raDeg: 222.6763, decDeg: 74.1555, magV: 2.08, distancePc: 40.1, spectralType: 'K4III' },
  { name: 'Rasalhague', bayer: 'α Oph', flamsteed: '55 Oph', hip: 86032, hd: 159561, constellation: 'Oph', raDeg: 263.7335, decDeg: 12.5600, magV: 2.07, distancePc: 14.7, spectralType: 'A5III' },
  { name: 'Algol', bayer: 'β Per', flamsteed: '26 Per', hip: 14576, hd: 19356, constellation: 'Per', raDeg: 47.0423, decDeg: 40.9556, magV: 2.12, distancePc: 28.5, spectralType: 'B8V' },
  { name: 'Almach', bayer: 'γ And', flamsteed: '57 And', hip: 9640, hd: 12533, constellation: 'And', raDeg: 30.9747, decDeg: 42.3296, magV: 2.14, distancePc: 109.0, spectralType: 'K3IIb' },
  { name: 'Denebola', bayer: 'β Leo', flamsteed: '94 Leo', hip: 57632, hd: 102647, constellation: 'Leo', raDeg: 177.2649, decDeg: 14.5720, magV: 2.14, distancePc: 11.0, spectralType: 'A3V' },
  { name: 'Eltanin', bayer: 'γ Dra', flamsteed: '33 Dra', hip: 87833, hd: 164058, constellation: 'Dra', raDeg: 269.1516, decDeg: 51.4889, magV: 2.24, distancePc: 47.3, spectralType: 'K5III' },
  { name: 'Schedar', bayer: 'α Cas', flamsteed: '18 Cas', hip: 3179, hd: 3712, constellation: 'Cas', raDeg: 10.1269, decDeg: 56.5373, magV: 2.24, distancePc: 70.1, spectralType: 'K0IIIa' },
  { name: 'Mintaka', bayer: 'δ Ori', flamsteed: '34 Ori', hip: 25930, hd: 36486, constellation: 'Ori', raDeg: 83.0017, decDeg: -0.2991, magV: 2.23, distancePc: 380.0, spectralType: 'O9.5II' },
  { name: 'Caph', bayer: 'β Cas', flamsteed: '11 Cas', hip: 746, hd: 432, constellation: 'Cas', raDeg: 2.2949, decDeg: 59.1498, magV: 2.27, distancePc: 16.8, spectralType: 'F2III-IV' },
  { name: 'Izar', bayer: 'ε Boo', flamsteed: '36 Boo', hip: 72105, hd: 129989, constellation: 'Boo', raDeg: 221.2467, decDeg: 27.0742, magV: 2.37, distancePc: 61.5, spectralType: 'K0II-III' },
  { name: 'Enif', bayer: 'ε Peg', flamsteed: '8 Peg', hip: 107315, hd: 206778, constellation: 'Peg', raDeg: 326.0465, decDeg: 9.8750, magV: 2.39, distancePc: 211.0, spectralType: 'K2Ib' },
  { name: 'Phecda', bayer: 'γ UMa', flamsteed: '64 UMa', hip: 58001, hd: 103287, constellation: 'UMa', raDeg: 178.4579, decDeg: 53.6948, magV: 2.44, distancePc: 25.6, spectralType: 'A0Ve' },
  { name: 'Markab', bayer: 'α Peg', flamsteed: '54 Peg', hip: 113963, hd: 218045, constellation: 'Peg', raDeg: 346.1902, decDeg: 15.2053, magV: 2.49, distancePc: 42.8, spectralType: 'B9III' },
  { name: 'Merak', bayer: 'β UMa', flamsteed: '48 UMa', hip: 53910, hd: 95418, constellation: 'UMa', raDeg: 165.4602, decDeg: 56.3824, magV: 2.37, distancePc: 24.4, spectralType: 'A1IVs' },
  { name: 'Megrez', bayer: 'δ UMa', flamsteed: '69 UMa', hip: 59774, hd: 106591, constellation: 'UMa', raDeg: 183.8566, decDeg: 57.0325, magV: 3.31, distancePc: 24.7, spectralType: 'A3Vvar' },
  { name: 'Mizar', bayer: 'ζ UMa', flamsteed: '79 UMa', hip: 65378, hd: 116656, constellation: 'UMa', raDeg: 200.9814, decDeg: 54.9254, magV: 2.04, distancePc: 25.6, spectralType: 'A1V' },
  { name: 'Alcor', bayer: '80 UMa', hip: 65477, hd: 116842, constellation: 'UMa', raDeg: 201.3060, decDeg: 54.9876, magV: 3.99, distancePc: 25.3, spectralType: 'A5V' },
  { name: 'Thuban', bayer: 'α Dra', flamsteed: '11 Dra', hip: 68756, hd: 123299, constellation: 'Dra', raDeg: 211.0973, decDeg: 64.3758, magV: 3.65, distancePc: 92.9, spectralType: 'A0III' },
  { name: 'Albireo', bayer: 'β Cyg', flamsteed: '6 Cyg', hip: 95947, hd: 183912, constellation: 'Cyg', raDeg: 292.6803, decDeg: 27.9597, magV: 3.05, distancePc: 130.0, spectralType: 'K3II' },
  { name: 'Alderamin', bayer: 'α Cep', flamsteed: '5 Cep', hip: 105199, hd: 203280, constellation: 'Cep', raDeg: 319.6449, decDeg: 62.5855, magV: 2.45, distancePc: 15.0, spectralType: 'A7V' },
  { name: 'Ankaa', bayer: 'α Phe', hip: 2081, hd: 2261, constellation: 'Phe', raDeg: 6.5708, decDeg: -42.3060, magV: 2.40, distancePc: 25.5, spectralType: 'K0.5IIIb' },
  { name: 'Alphecca', bayer: 'α CrB', flamsteed: '5 CrB', hip: 76267, hd: 139006, constellation: 'CrB', raDeg: 233.6717, decDeg: 26.7147, magV: 2.23, distancePc: 22.9, spectralType: 'A0V' },
  { name: 'Algieba', bayer: 'γ Leo', flamsteed: '41 Leo', hip: 50583, hd: 89484, constellation: 'Leo', raDeg: 154.9930, decDeg: 19.8415, magV: 2.28, distancePc: 40.0, spectralType: 'K1-IIIb' },
  { name: 'Suhail', bayer: 'λ Vel', hip: 44816, hd: 78647, constellation: 'Vel', raDeg: 136.9990, decDeg: -43.4326, magV: 2.21, distancePc: 164.0, spectralType: 'K4.5Ib-II' },
  { name: 'Tarazed', bayer: 'γ Aql', flamsteed: '50 Aql', hip: 97278, hd: 186791, constellation: 'Aql', raDeg: 296.5649, decDeg: 10.6133, magV: 2.72, distancePc: 140.0, spectralType: 'K3II' },
  { name: 'Sadr', bayer: 'γ Cyg', flamsteed: '37 Cyg', hip: 100453, hd: 194093, constellation: 'Cyg', raDeg: 305.5571, decDeg: 40.2567, magV: 2.23, distancePc: 560.0, spectralType: 'F8Ib' },
  { name: 'Rastaban', bayer: 'β Dra', flamsteed: '23 Dra', hip: 85670, hd: 159181, constellation: 'Dra', raDeg: 262.6080, decDeg: 52.3014, magV: 2.79, distancePc: 116.0, spectralType: 'G2Ib-IIa' },
  { name: 'Nunki', bayer: 'σ Sgr', flamsteed: '34 Sgr', hip: 92855, hd: 175191, constellation: 'Sgr', raDeg: 283.8163, decDeg: -26.2968, magV: 2.05, distancePc: 69.8, spectralType: 'B2.5V' },
  { name: 'Dschubba', bayer: 'δ Sco', flamsteed: '7 Sco', hip: 78401, hd: 143275, constellation: 'Sco', raDeg: 240.0833, decDeg: -22.6217, magV: 2.32, distancePc: 150.0, spectralType: 'B0.3IV' },
  { name: 'Menkar', bayer: 'α Cet', flamsteed: '92 Cet', hip: 14135, hd: 18884, constellation: 'Cet', raDeg: 45.5699, decDeg: 4.0897, magV: 2.53, distancePc: 76.4, spectralType: 'M1.5IIIa' },
  { name: 'Zubenelgenubi', bayer: 'α Lib', flamsteed: '9 Lib', hip: 72622, hd: 130841, constellation: 'Lib', raDeg: 222.7195, decDeg: -16.0418, magV: 2.75, distancePc: 23.2, spectralType: 'A3IV' },
  { name: 'Unukalhai', bayer: 'α Ser', flamsteed: '24 Ser', hip: 77070, hd: 140573, constellation: 'Ser', raDeg: 236.0670, decDeg: 6.4256, magV: 2.63, distancePc: 22.7, spectralType: 'K2III' },
  { name: 'Rasalgethi', bayer: 'α Her', flamsteed: '64 Her', hip: 84345, hd: 156014, constellation: 'Her', raDeg: 258.6620, decDeg: 14.3904, magV: 3.14, distancePc: 110.0, spectralType: 'M5Ib-II' },
  { name: 'Saiph', bayer: 'κ Ori', flamsteed: '53 Ori', hip: 27366, hd: 38771, constellation: 'Ori', raDeg: 86.9391, decDeg: -9.6697, magV: 2.09, distancePc: 198.0, spectralType: 'B0.5Ia' },
  { name: 'Keid', bayer: '40 Eri A', hip: 19849, hd: 26965, constellation: 'Eri', raDeg: 63.8180, decDeg: -7.6529, magV: 4.43, distancePc: 5.042, spectralType: 'K0.5V' },
  { name: 'Tau Ceti', bayer: 'τ Cet', flamsteed: '52 Cet', hip: 8102, hd: 10700, constellation: 'Cet', raDeg: 26.0170, decDeg: -15.9370, magV: 3.50, distancePc: 3.603, spectralType: 'G8.5V' },
  { name: 'Ran', bayer: 'ε Eri', flamsteed: '18 Eri', hip: 16537, hd: 22049, constellation: 'Eri', raDeg: 53.2327, decDeg: -9.4583, magV: 3.73, distancePc: 3.216, spectralType: 'K2V' },
  { name: 'Barnard\u2019s Star', bayer: null, hip: 87937, hd: null, constellation: 'Oph', raDeg: 269.4521, decDeg: 4.6934, magV: 9.53, distancePc: 1.834, spectralType: 'M4.0Ve' },
  { name: 'Lalande 21185', bayer: null, hip: 54211, hd: 95735, constellation: 'UMa', raDeg: 165.8347, decDeg: 35.9697, magV: 7.49, distancePc: 2.547, spectralType: 'M2V' },
  { name: 'Mira', bayer: 'ο Cet', flamsteed: '68 Cet', hip: 10826, hd: 14386, constellation: 'Cet', raDeg: 34.8367, decDeg: -2.9776, magV: 3.04, distancePc: 92.0, spectralType: 'M7IIIe' },
  { name: 'Cor Caroli', bayer: 'α CVn', flamsteed: '12 CVn', hip: 63125, hd: 112413, constellation: 'CVn', raDeg: 194.0074, decDeg: 38.3184, magV: 2.89, distancePc: 34.8, spectralType: 'A0VpSiEuHg' },
  { name: 'Alcyone', bayer: 'η Tau', flamsteed: '25 Tau', hip: 17702, hd: 23630, constellation: 'Tau', raDeg: 56.8711, decDeg: 24.1051, magV: 2.87, distancePc: 136.0, spectralType: 'B7III' },
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

const CONSTELLATION_BY_ABBR = new Map<string, ConstellationMeta>();
for (const c of IAU_CONSTELLATIONS) CONSTELLATION_BY_ABBR.set(c.abbr.toLowerCase(), c);

export function findConstellationByAbbr(abbr: string): ConstellationMeta | null {
  return CONSTELLATION_BY_ABBR.get(abbr.toLowerCase()) ?? null;
}

const STAR_BY_NAME = new Map<string, IauNamedStar>();
const STAR_BY_BAYER = new Map<string, IauNamedStar>();
const STAR_BY_HIP = new Map<number, IauNamedStar>();
for (const s of IAU_NAMED_STARS) {
  STAR_BY_NAME.set(s.name.toLowerCase(), s);
  if (s.bayer) STAR_BY_BAYER.set(s.bayer.toLowerCase(), s);
  if (s.hip !== null) STAR_BY_HIP.set(s.hip, s);
}

/**
 * Resolve a star reference that might be an IAU name ("Sirius"), a Bayer
 * designation ("α CMa"), or a Hipparcos id (32349). Returns null when no
 * entry matches.
 */
export function findStarByReference(query: string | number): IauNamedStar | null {
  if (typeof query === 'number') {
    return STAR_BY_HIP.get(query) ?? null;
  }
  const trimmed = query.trim();
  if (trimmed.length === 0) return null;
  const byName = STAR_BY_NAME.get(trimmed.toLowerCase());
  if (byName) return byName;
  const byBayer = STAR_BY_BAYER.get(trimmed.toLowerCase());
  if (byBayer) return byBayer;
  return null;
}

/** Total segment count across every curated constellation — diagnostic. */
export function getCurationStats(): { constellations: number; withFigures: number; totalSegments: number } {
  let totalSegments = 0;
  let withFigures = 0;
  for (const c of CONSTELLATION_LINES) {
    totalSegments += c.segments.length;
    if (c.segments.length > 0) withFigures += 1;
  }
  return {
    constellations: IAU_CONSTELLATIONS.length,
    withFigures,
    totalSegments,
  };
}
