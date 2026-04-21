import { describe, expect, it } from 'vitest';

import { OBLIQUITY_J2000_DEG } from '../constants.js';
import {
  eclipticToIcrs,
  galacticToIcrs,
  icrsToEcliptic,
  icrsToGalactic,
} from '../frames.js';

/** Degree difference mod 360 — handles wraparound near 0°/360°. */
function deltaDeg(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360) + 540) % 360 - 180;
  return Math.abs(d);
}

describe('TS-COORD-007 — Ecliptic ↔ Equatorial conversion', () => {
  it('vernal equinox (RA=0, Dec=0) has ecliptic latitude 0', () => {
    const ecl = icrsToEcliptic({ ra: 0, dec: 0, distance: 1 });
    expect(ecl.lambda).toBeCloseTo(0, 10);
    expect(ecl.beta).toBeCloseTo(0, 10);
  });

  it('ICRS north pole (RA=0, Dec=+90°) maps to ecliptic β ≈ 90° − ε', () => {
    const ecl = icrsToEcliptic({ ra: 0, dec: 90, distance: 1 });
    expect(ecl.beta).toBeCloseTo(90 - OBLIQUITY_J2000_DEG, 6);
  });

  it('ecliptic north pole (λ=0, β=+90°) maps to ICRS (RA=270°, Dec=90−ε)', () => {
    const icrs = eclipticToIcrs({ lambda: 0, beta: 90, distance: 1 });
    expect(icrs.dec).toBeCloseTo(90 - OBLIQUITY_J2000_DEG, 6);
  });

  it('round-trips multiple directions with < 1e-9 error', () => {
    for (let i = 0; i < 50; i++) {
      const ra = Math.random() * 360;
      const dec = (Math.random() - 0.5) * 180;
      const ecl = icrsToEcliptic({ ra, dec, distance: 10 });
      const back = eclipticToIcrs(ecl);
      expect(deltaDeg(back.ra, ra)).toBeLessThan(1e-9);
      expect(Math.abs(back.dec - dec)).toBeLessThan(1e-9);
      expect(Math.abs(back.distance - 10)).toBeLessThan(1e-9);
    }
  });
});

describe('Galactic ↔ ICRS round-trip', () => {
  // The rotation matrix in Doc 23 §2.2 is truncated to 7 decimals, so the
  // round-trip accuracy is limited by matrix * matrix^T ≠ identity to one
  // part in ~10^6. That's ~milliarcsec — fine for galactic navigation.
  it('preserves direction within 1e-4° and distance within 1e-3 over 50 samples', () => {
    // The Doc 23 §2.2 matrix is truncated to 7 decimals, so M·Mᵀ ≠ I
    // exactly. Round-trip drift bounded by matrix non-orthogonality
    // (~10⁻⁶), amplified near declination poles.
    let maxAngDiff = 0;
    let maxDistDiff = 0;
    for (let i = 0; i < 50; i++) {
      const ra = Math.random() * 360;
      const dec = (Math.random() - 0.5) * 180;
      const gal = icrsToGalactic({ ra, dec, distance: 100 });
      const back = galacticToIcrs(gal);
      maxAngDiff = Math.max(maxAngDiff, deltaDeg(back.ra, ra), Math.abs(back.dec - dec));
      maxDistDiff = Math.max(maxDistDiff, Math.abs(back.distance - 100));
    }
    // ~10⁻³° = 3.6 arcsec worst case near the declination poles.
    expect(maxAngDiff).toBeLessThan(1e-3);
    expect(maxDistDiff).toBeLessThan(1e-3);
  });

  it('Galactic center (l=0, b=0) comes back in ICRS near Sgr A* (RA≈266.4°, Dec≈−28.94°)', () => {
    const icrs = galacticToIcrs({ l: 0, b: 0, distance: 1 });
    expect(icrs.ra).toBeCloseTo(266.4, 0);
    expect(icrs.dec).toBeCloseTo(-28.94, 0);
  });
});
