/**
 * Astronomical constants + canonical matrices used by the coordinate pipeline.
 * Values from IAU 2015 standards and Doc 23 §2.
 */

/** Metres in one parsec (IAU 2012 definition). */
export const METERS_PER_PARSEC = 3.085_677_581_491_367e16;
export const PARSECS_PER_METER = 1 / METERS_PER_PARSEC;

/** Metres in one astronomical unit (IAU 2012 exact definition). */
export const METERS_PER_AU = 1.495_978_707e11;
export const AU_PER_METER = 1 / METERS_PER_AU;

/** Parsecs per astronomical unit. */
export const AU_PER_PARSEC = METERS_PER_PARSEC / METERS_PER_AU;
export const PARSECS_PER_AU = METERS_PER_AU / METERS_PER_PARSEC;

/** Light-years per parsec. */
export const LIGHT_YEARS_PER_PARSEC = 3.261_563_77;
export const PARSECS_PER_LIGHT_YEAR = 1 / LIGHT_YEARS_PER_PARSEC;

/** Obliquity of the ecliptic at J2000.0 (Doc 23 §2.2). */
export const OBLIQUITY_J2000_DEG = 23.439_291_111_111_11;
export const OBLIQUITY_J2000_RAD = (OBLIQUITY_J2000_DEG * Math.PI) / 180;

/** J2000.0 reference epoch — JD 2451545.0 = 2000-01-01 12:00 TT. */
export const J2000_JULIAN_DATE = 2_451_545.0;

/** Days in a Julian year. */
export const DAYS_PER_JULIAN_YEAR = 365.25;

/** Julian years per km/s in stellar radial-velocity → pc conversion. */
export const PC_PER_KMS_PER_YEAR = 1.022_712_165_045e-6;

/**
 * ICRS → Galactic rotation matrix (Doc 23 §2.2). Row-major: row i, col j.
 * Applied as: `v_gal = M · v_icrs`.
 */
export const ICRS_TO_GALACTIC: readonly (readonly [number, number, number])[] = [
  [-0.054_875_6, -0.873_437_1, -0.483_835_0],
  [0.494_109_4, -0.444_829_6, 0.746_982_3],
  [-0.867_666_1, -0.198_076_4, 0.455_983_8],
] as const;

/** Sirius A reference (ICRS J2000.0), from Hipparcos/Gaia DR3. */
export const SIRIUS_ICRS: Readonly<{ ra: number; dec: number; distance: number }> = Object.freeze({
  ra: 101.287,
  dec: -16.716,
  distance: 2.637,
});
