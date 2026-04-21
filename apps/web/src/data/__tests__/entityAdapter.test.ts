import { describe, expect, it } from 'vitest';

import type { ApiEntity, ApiSolarSystemBody } from '@/api/types';

import {
  apiEntityToEntityData,
  apiEntityToEntityPreview,
  apiSolarSystemBodyToEntityData,
  entIdForNaifId,
} from '../entityAdapter';

const earthBody: ApiSolarSystemBody = {
  naif_id: 399,
  name: 'Earth',
  type: 'planet',
  parent_naif_id: 10,
  ent_id: 'ENT-2003',
  orbital_elements: {
    a: 1.000_000_011,
    e: 0.016_708,
    i: 0.000_05,
    Omega: -11.26064,
    omega: 114.20783,
    M: 358.617,
    P: 365.256,
  },
  epoch: 'J2000.0',
  physical: {
    mass_kg: 5.972e24,
    radius_km: 6371.0,
    density_kgm3: 5514,
    surface_gravity_ms2: 9.81,
    rotation_period_hours: 23.934,
    obliquity_deg: 23.44,
    albedo: 0.306,
    equilibrium_temperature_k: 254,
  },
  atmosphere: null,
  rings: null,
  moon_count: 1,
  _links: {
    self: '/v1/solar-system/bodies/399',
    entity: '/v1/entities/399',
    moons: '/v1/solar-system/bodies?parent=399',
    ephemeris: '/v1/ephemeris/399',
  },
};

const lunaBody: ApiSolarSystemBody = {
  ...earthBody,
  naif_id: 301,
  name: 'Moon',
  type: 'moon',
  parent_naif_id: 399,
  ent_id: 'ENT-3301',
  orbital_elements: {
    a: 384_400 / 149_597_870.7, // km → AU
    e: 0.0549,
    i: 5.145,
    Omega: 0,
    omega: 0,
    M: 0,
    P: 27.322,
  },
  physical: { ...earthBody.physical, radius_km: 1737.4, obliquity_deg: 6.687 },
};

const siriusEntity: ApiEntity = {
  id: 120052,
  ent_id: 'ENT-1001',
  name: 'Sirius',
  category: 1,
  category_name: 'Stars',
  entity_type: 1001,
  type_name: 'Main Sequence Star',
  aliases: ['Alpha Canis Majoris'],
  position: { ra: 101.28715, dec: -16.71612, distance_pc: 2.64 },
  properties: {
    spectral_type: 'A1V',
    temperature_k: 9940,
    magnitude_apparent: -1.46,
    constellation: 'Canis Major',
  },
  catalog_ids: { hipparcos: 32349 },
  data_source: 'gaia_dr3',
  data_quality: 1,
  toggles: [],
  _links: { self: '/v1/entities/120052' },
};

describe('entityAdapter', () => {
  it('apiSolarSystemBodyToEntityData maps planet orbital + physical fields', () => {
    const data = apiSolarSystemBodyToEntityData(earthBody);
    expect(data.id).toBe(399);
    expect(data.ent_id).toBe('ENT-2003');
    expect(data.object_type).toBe('planet');
    const p = data.payload as Record<string, unknown>;
    expect(p.kind).toBe('planet');
    expect(p.semiMajorAxis_unit).toBe('AU');
    expect(p.semiMajorAxis_display).toBeCloseTo(1.0, 3);
    expect(p.periodDays).toBeCloseTo(365.256, 2);
    expect(p.obliquity_deg).toBeCloseTo(23.44, 2);
    expect(p.source).toBe('api:solar-system');
  });

  it('apiSolarSystemBodyToEntityData expresses moon orbits in km', () => {
    const data = apiSolarSystemBodyToEntityData(lunaBody);
    const p = data.payload as Record<string, unknown>;
    expect(p.kind).toBe('moon');
    expect(p.semiMajorAxis_unit).toBe('km');
    expect(p.semiMajorAxis_display).toBeCloseTo(384_400, -1);
  });

  it('apiEntityToEntityData maps a star into a star-flavoured payload', () => {
    const data = apiEntityToEntityData(siriusEntity);
    expect(data.object_type).toBe('star');
    const p = data.payload as Record<string, unknown>;
    expect(p.kind).toBe('star');
    expect(p.kindLabel).toBe('Main Sequence Star');
    expect(p.spectral_type).toBe('A1V');
    expect(p.temperature_k).toBe(9940);
    expect(p.semiMajorAxis_unit).toBe('pc');
    expect(p.source).toBe('api:entity');
  });

  it('apiEntityToEntityPreview carries distance + magnitude when present', () => {
    const preview = apiEntityToEntityPreview(siriusEntity);
    expect(preview.name).toBe('Sirius');
    expect(preview.distance).toBeCloseTo(2.64, 2);
    expect(preview.magnitude).toBeCloseTo(-1.46, 2);
  });

  it('entIdForNaifId resolves catalog bodies deterministically', () => {
    // Saturn is in the static catalog; it should round-trip to an ENT-2xxx id.
    const saturnEnt = entIdForNaifId(699);
    expect(saturnEnt).toMatch(/^ENT-2\d{3}$/);
    expect(entIdForNaifId(-42)).toBeNull();
  });
});
