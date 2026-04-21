/**
 * IAU planetary nomenclature — named surface features (T39, Doc 23 §8).
 *
 * Doc 23 lists ~15,000 IAU-approved features across the inner planets,
 * Moon, and major moons. T39 ingests the catalog but the renderer only
 * draws features when the camera zooms close enough that the per-feature
 * label has visual real estate (see {@link SurfaceFeatureRenderer}).
 *
 * For T39 we ship a curated subset — the features users most likely want
 * to navigate to: Apollo landing sites, Mars rovers, Mercury/Venus volcanic
 * provinces, Jupiter/Saturn moon highlights. The full 15k catalog will
 * stream from the backend (T39 follow-on PR) using the same shape.
 *
 * Coordinates are body-fixed (planetographic latitude/longitude in degrees);
 * the renderer projects them onto the body's tilted sphere.
 */

export type FeatureKind =
  | 'crater'        // Impact crater
  | 'mons'          // Mountain
  | 'mare'          // "Sea" (lunar maria, basaltic plain)
  | 'planitia'      // Plain
  | 'chasma'        // Canyon
  | 'rupes'         // Cliff / scarp
  | 'patera'        // Volcanic vent
  | 'landing-site'  // Spacecraft landing site
  | 'region';       // Generic named region

export interface SurfaceFeature {
  /** IAU-approved (or NASA/ESA approved for landing sites) name. */
  name: string;
  /** NAIF id of the parent body (e.g. 301 for Moon, 499 for Mars). */
  parentNaifId: number;
  kind: FeatureKind;
  /** Planetographic latitude (deg, +N). */
  lat_deg: number;
  /** Planetographic longitude (deg, +E for IAU 2015 conv.). */
  lon_deg: number;
  /** Approximate diameter for craters / mons; length for chasma (km). */
  size_km: number | null;
  /** Optional notes for the InfoPanel. */
  description?: string;
}

// ---------------------------------------------------------------------------
// Moon (Luna) — Apollo sites + iconic features
// ---------------------------------------------------------------------------

const MOON_FEATURES: readonly SurfaceFeature[] = [
  { name: 'Tycho', parentNaifId: 301, kind: 'crater', lat_deg: -43.30, lon_deg: -11.36, size_km: 85,
    description: 'Bright young crater with extensive ray system, ~108 Myr old.' },
  { name: 'Copernicus', parentNaifId: 301, kind: 'crater', lat_deg: 9.62, lon_deg: -20.08, size_km: 93,
    description: 'Iconic ray crater on the Mare Insularum.' },
  { name: 'Mare Tranquillitatis', parentNaifId: 301, kind: 'mare', lat_deg: 8.5, lon_deg: 31.4, size_km: 873 },
  { name: 'Mare Imbrium', parentNaifId: 301, kind: 'mare', lat_deg: 32.8, lon_deg: -15.6, size_km: 1146 },
  { name: 'Mare Serenitatis', parentNaifId: 301, kind: 'mare', lat_deg: 28.0, lon_deg: 17.5, size_km: 707 },
  { name: 'Apollo 11 Landing Site', parentNaifId: 301, kind: 'landing-site', lat_deg: 0.674, lon_deg: 23.473, size_km: null,
    description: 'Tranquility Base — first crewed lunar landing, 1969-07-20.' },
  { name: 'Apollo 12 Landing Site', parentNaifId: 301, kind: 'landing-site', lat_deg: -3.012, lon_deg: -23.422, size_km: null },
  { name: 'Apollo 14 Landing Site', parentNaifId: 301, kind: 'landing-site', lat_deg: -3.646, lon_deg: -17.471, size_km: null },
  { name: 'Apollo 15 Landing Site', parentNaifId: 301, kind: 'landing-site', lat_deg: 26.132, lon_deg: 3.633, size_km: null },
  { name: 'Apollo 16 Landing Site', parentNaifId: 301, kind: 'landing-site', lat_deg: -8.973, lon_deg: 15.501, size_km: null },
  { name: 'Apollo 17 Landing Site', parentNaifId: 301, kind: 'landing-site', lat_deg: 20.190, lon_deg: 30.772, size_km: null },
  { name: 'Mons Hadley', parentNaifId: 301, kind: 'mons', lat_deg: 26.5, lon_deg: 4.7, size_km: 25 },
  { name: 'Aristarchus', parentNaifId: 301, kind: 'crater', lat_deg: 23.7, lon_deg: -47.4, size_km: 40 },
];

// ---------------------------------------------------------------------------
// Mars — rover sites + Olympus Mons + Valles Marineris
// ---------------------------------------------------------------------------

const MARS_FEATURES: readonly SurfaceFeature[] = [
  { name: 'Olympus Mons', parentNaifId: 499, kind: 'mons', lat_deg: 18.65, lon_deg: -133.8, size_km: 624,
    description: 'Tallest known volcano in the solar system — 22 km above datum.' },
  { name: 'Valles Marineris', parentNaifId: 499, kind: 'chasma', lat_deg: -14.0, lon_deg: -59.2, size_km: 4_000,
    description: '4,000-km canyon system, named for Mariner 9.' },
  { name: 'Hellas Planitia', parentNaifId: 499, kind: 'planitia', lat_deg: -42.4, lon_deg: 70.5, size_km: 2_300,
    description: 'Largest visible impact crater in the solar system.' },
  { name: 'Arsia Mons', parentNaifId: 499, kind: 'mons', lat_deg: -8.35, lon_deg: -120.09, size_km: 435 },
  { name: 'Pavonis Mons', parentNaifId: 499, kind: 'mons', lat_deg: 0.78, lon_deg: -113.52, size_km: 375 },
  { name: 'Ascraeus Mons', parentNaifId: 499, kind: 'mons', lat_deg: 11.83, lon_deg: -104.50, size_km: 480 },
  { name: 'Gale Crater', parentNaifId: 499, kind: 'crater', lat_deg: -5.4, lon_deg: 137.8, size_km: 154,
    description: 'Curiosity rover landing site (2012).' },
  { name: 'Jezero Crater', parentNaifId: 499, kind: 'crater', lat_deg: 18.4447, lon_deg: 77.4508, size_km: 49,
    description: 'Perseverance rover + Ingenuity helicopter site (2021).' },
  { name: 'Viking 1 Landing Site', parentNaifId: 499, kind: 'landing-site', lat_deg: 22.697, lon_deg: -49.971, size_km: null },
  { name: 'Viking 2 Landing Site', parentNaifId: 499, kind: 'landing-site', lat_deg: 47.668, lon_deg: 134.281, size_km: null },
  { name: 'Tharsis', parentNaifId: 499, kind: 'region', lat_deg: 0, lon_deg: -100, size_km: 5_000,
    description: 'Vast volcanic plateau holding Olympus + the three Tharsis Montes.' },
];

// ---------------------------------------------------------------------------
// Mercury — Caloris + named craters (BepiColombo targets)
// ---------------------------------------------------------------------------

const MERCURY_FEATURES: readonly SurfaceFeature[] = [
  { name: 'Caloris Planitia', parentNaifId: 199, kind: 'planitia', lat_deg: 30.5, lon_deg: 162.7, size_km: 1_550,
    description: 'Largest impact basin on Mercury — antipodal to chaotic terrain.' },
  { name: 'Beethoven', parentNaifId: 199, kind: 'crater', lat_deg: -20.0, lon_deg: -123.7, size_km: 630 },
  { name: 'Rembrandt', parentNaifId: 199, kind: 'crater', lat_deg: -33.2, lon_deg: 88.0, size_km: 716 },
];

// ---------------------------------------------------------------------------
// Venus — Maxwell Montes + Ishtar Terra
// ---------------------------------------------------------------------------

const VENUS_FEATURES: readonly SurfaceFeature[] = [
  { name: 'Maxwell Montes', parentNaifId: 299, kind: 'mons', lat_deg: 65.2, lon_deg: 3.3, size_km: 853,
    description: 'Highest mountain on Venus, ~11 km above mean planetary radius.' },
  { name: 'Ishtar Terra', parentNaifId: 299, kind: 'region', lat_deg: 70.4, lon_deg: 27.5, size_km: 5_610 },
  { name: 'Aphrodite Terra', parentNaifId: 299, kind: 'region', lat_deg: -5.8, lon_deg: 104.8, size_km: 10_000 },
];

// ---------------------------------------------------------------------------
// Galilean moons — iconic features
// ---------------------------------------------------------------------------

const IO_FEATURES: readonly SurfaceFeature[] = [
  { name: 'Loki Patera', parentNaifId: 501, kind: 'patera', lat_deg: 12.6, lon_deg: 308.8, size_km: 202,
    description: "Largest active volcano in the solar system." },
  { name: 'Pele', parentNaifId: 501, kind: 'patera', lat_deg: -18.7, lon_deg: 255.3, size_km: 30 },
  { name: 'Pillan Patera', parentNaifId: 501, kind: 'patera', lat_deg: -12.3, lon_deg: 244.0, size_km: 65 },
];

const EUROPA_FEATURES: readonly SurfaceFeature[] = [
  { name: 'Conamara Chaos', parentNaifId: 502, kind: 'region', lat_deg: 9.0, lon_deg: 273.8, size_km: 80,
    description: 'Disrupted ice rafts — strong evidence for the subsurface ocean.' },
  { name: 'Pwyll', parentNaifId: 502, kind: 'crater', lat_deg: -25.2, lon_deg: 271.4, size_km: 39 },
];

const ENCELADUS_FEATURES: readonly SurfaceFeature[] = [
  { name: 'South Polar Terrain', parentNaifId: 602, kind: 'region', lat_deg: -85.0, lon_deg: 0, size_km: 500,
    description: 'Cryovolcanic geyser source — "tiger stripes" sulci.' },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const IAU_NOMENCLATURE: readonly SurfaceFeature[] = Object.freeze([
  ...MOON_FEATURES,
  ...MARS_FEATURES,
  ...MERCURY_FEATURES,
  ...VENUS_FEATURES,
  ...IO_FEATURES,
  ...EUROPA_FEATURES,
  ...ENCELADUS_FEATURES,
]);

/** All features for one parent body. */
export function featuresOf(parentNaifId: number): readonly SurfaceFeature[] {
  return IAU_NOMENCLATURE.filter((f) => f.parentNaifId === parentNaifId);
}

/**
 * Resolve a planetographic (lat, lon) onto a unit sphere centred on the
 * body, using the IAU 2015 east-positive longitude convention. The returned
 * vector is on the body's local equatorial frame — callers transform it
 * by the body's group rotation to land in scene space.
 */
export function unitSphereVector(
  lat_deg: number,
  lon_deg: number,
): { x: number; y: number; z: number } {
  const lat = lat_deg * (Math.PI / 180);
  const lon = lon_deg * (Math.PI / 180);
  const cosLat = Math.cos(lat);
  return {
    x: cosLat * Math.cos(lon),
    y: Math.sin(lat),
    z: cosLat * Math.sin(lon),
  };
}
