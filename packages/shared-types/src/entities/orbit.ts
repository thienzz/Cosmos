/**
 * Classical Keplerian orbital elements.
 * Source: Doc 11 §3.2.
 */
export interface KeplerianElements {
  /** Semi-major axis (AU) */
  a: number;
  /** Eccentricity (0 = circle, <1 = ellipse, 1 = parabola, >1 = hyperbola) */
  e: number;
  /** Inclination (degrees) */
  i: number;
  /** Longitude of ascending node Ω (degrees) */
  Omega: number;
  /** Argument of perihelion ω (degrees) */
  omega: number;
  /** Mean anomaly at epoch (degrees) */
  M: number;
  /** Orbital period (days) — optional, derivable from a + GM */
  P?: number;
}
