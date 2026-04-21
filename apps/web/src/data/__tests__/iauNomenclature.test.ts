import { describe, expect, it } from 'vitest';

import {
  IAU_NOMENCLATURE,
  featuresOf,
  unitSphereVector,
} from '../iauNomenclature';

describe('iauNomenclature', () => {
  it('ships features for the expected body set', () => {
    // Inner planets + Moon + key Galileans + Enceladus.
    const parents = new Set(IAU_NOMENCLATURE.map((f) => f.parentNaifId));
    expect(parents).toContain(199); // Mercury
    expect(parents).toContain(299); // Venus
    expect(parents).toContain(301); // Moon
    expect(parents).toContain(499); // Mars
    expect(parents).toContain(501); // Io
    expect(parents).toContain(502); // Europa
    expect(parents).toContain(602); // Enceladus
  });

  it('Apollo 11 landing site is enumerated with realistic coordinates', () => {
    const moon = featuresOf(301);
    const a11 = moon.find((f) => f.name === 'Apollo 11 Landing Site');
    expect(a11).toBeDefined();
    expect(a11!.kind).toBe('landing-site');
    expect(a11!.lat_deg).toBeCloseTo(0.674, 2);
    expect(a11!.lon_deg).toBeCloseTo(23.473, 2);
  });

  it('Olympus Mons is the largest Mars feature flagged', () => {
    const mars = featuresOf(499);
    const om = mars.find((f) => f.name === 'Olympus Mons');
    expect(om).toBeDefined();
    expect(om!.kind).toBe('mons');
    expect(om!.size_km).toBeGreaterThan(500); // ~624 km diameter
  });

  it('unitSphereVector lands on a unit sphere', () => {
    for (const lat of [0, 30, -45, 80, -60]) {
      for (const lon of [0, 90, -120, 180]) {
        const v = unitSphereVector(lat, lon);
        const norm = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
        expect(norm).toBeCloseTo(1, 6);
      }
    }
  });

  it('north pole maps to +Y, equator at lon=0 maps to +X', () => {
    const np = unitSphereVector(90, 0);
    expect(np.y).toBeCloseTo(1, 6);
    expect(np.x).toBeCloseTo(0, 6);
    expect(np.z).toBeCloseTo(0, 6);

    const eq = unitSphereVector(0, 0);
    expect(eq.x).toBeCloseTo(1, 6);
    expect(eq.y).toBeCloseTo(0, 6);
    expect(eq.z).toBeCloseTo(0, 6);
  });
});
