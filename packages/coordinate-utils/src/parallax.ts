/**
 * Trigonometric parallax ↔ distance (Doc 23 §2.3).
 *
 * The simple `d = 1 / ϖ` inversion is the Standard Galactic Model for stars
 * with high-SNR Gaia parallaxes. For small or negative parallaxes the
 * Bailer-Jones et al. 2021 Bayesian prior should be used — that's scoped
 * into T26 with the Gaia ingest. For now we clamp negative parallaxes to
 * a small positive value and document the caveat.
 */

/** Converts parallax (milliarcseconds) to distance (parsecs). */
export function parallaxToDistance(parallaxMas: number): number {
  if (!Number.isFinite(parallaxMas)) return Number.POSITIVE_INFINITY;
  // Clamp near-zero / negative parallaxes. A 0.001 mas floor corresponds to
  // a 1 Mpc distance cap — well beyond Gaia's reliable range so it's a
  // visible "parallax unreliable" signal rather than silent Infinity.
  const p = Math.max(parallaxMas, 1e-3);
  return 1000 / p; // 1000 because mas → arcsec in the denominator.
}

/** Converts distance (parsecs) to parallax (milliarcseconds). */
export function distanceToParallax(distancePc: number): number {
  if (!Number.isFinite(distancePc) || distancePc <= 0) return 0;
  return 1000 / distancePc;
}

/**
 * Distance modulus `μ = 5 · log10(d / 10 pc)` — exported here because it's
 * the usual companion to parallax-based distances and keeps rendering-layer
 * code from inlining the log.
 */
export function distanceModulus(distancePc: number): number {
  if (distancePc <= 0) return Number.NEGATIVE_INFINITY;
  return 5 * Math.log10(distancePc / 10);
}

/** Inverse of `distanceModulus`. */
export function distanceFromModulus(mu: number): number {
  return 10 * Math.pow(10, mu / 5);
}
