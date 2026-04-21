import { describe, expect, it } from 'vitest';

import {
  isAsteroid,
  isComet,
  isGalaxy,
  isMoon,
  isNebula,
  isPlanet,
  isStar,
  STAR_FLAG_HAS_TEMP,
  STAR_FLAG_HAS_VELOCITY,
  STAR_TILE_HEADER_BYTES,
  STAR_TILE_RECORD_BYTES,
  GALAXY_TILE_HEADER_BYTES,
  GALAXY_TILE_RECORD_BYTES,
  COSMIC_WEB_HEADER_BYTES,
  OCTREE_INDEX_HEADER_BYTES,
  OCTREE_NODE_BYTES,
} from '../index.js';
import type {
  Asteroid,
  CelestialObject,
  Comet,
  CosmicWebNode,
  EntityInstance,
  EntityTypeDefinition,
  Galaxy,
  Moon,
  Nebula,
  OctreeNode,
  Planet,
  Star,
  StarTileHeader,
  StarTileRecord,
} from '../index.js';

// Sirius A — Doc 33 reference object.
const sirius: Star & { object_type: 'star' } = {
  object_type: 'star',
  id: 'hip_32349',
  name: 'Sirius',
  names: ['Sirius', 'Dog Star', 'Alpha Canis Majoris'],
  aliases: ['HD 48915'],
  position: { x: 2.58, y: -0.23, z: -0.47 },
  ra: 101.287,
  dec: -16.716,
  distance: 2.64,
  parallax: 379.21,
  parallax_error: 1.58,
  proper_motion: { ra: -546.01, dec: -1223.07 },
  radial_velocity: -5.5,
  magnitude: -1.46,
  magnitude_absolute: 1.42,
  color: { r: 0.69, g: 0.75, b: 1.0 },
  color_index_bp_rp: 0.01,
  spectral_type: 'A1V',
  temperature: 9940,
  luminosity: 25.4,
  mass: 2.063,
  radius: 1.711,
  constellation: 'Canis Major',
  catalog_ids: { hipparcos: 32349, gaia_dr3: 'Gaia DR3 2947050466531873024' },
  data_quality: {
    source: 'hipparcos2',
    parallax_snr: 240,
    astrometric_quality: 0.98,
    last_updated: '2024-01-01',
  },
};

// Jupiter — orbital elements at J2000.0.
const jupiter: Planet & { object_type: 'planet' } = {
  object_type: 'planet',
  id: 'sol_jupiter',
  name: 'Jupiter',
  parentBody: 'sol',
  aliases: ['Jove'],
  position: { x: 5.2, y: 0, z: 0 },
  orbitalElements: {
    a: 5.2028,
    e: 0.0489,
    i: 1.303,
    Omega: 100.464,
    omega: 273.867,
    M: 20.02,
    P: 4332.59,
  },
  epoch: '2000-01-01T12:00:00Z',
  physicalProperties: {
    mass_earth_masses: 317.8,
    radius_earth_radii: 10.97,
    density: 1326,
    rotation_period: 9.925,
    obliquity: 3.13,
  },
  moons: ['io', 'europa', 'ganymede', 'callisto'],
  equilibrium_temperature: 110,
};

// Andromeda Galaxy M31 — Doc 33 reference object.
const andromeda: Galaxy & { object_type: 'galaxy' } = {
  object_type: 'galaxy',
  id: 'ngc_224',
  name: 'Andromeda Galaxy',
  aliases: ['M31', 'NGC 224'],
  position: { x: 0, y: 0, z: 0.778 },
  ra: 10.6847,
  dec: 41.2689,
  redshift: -0.001,
  distance_mpc: 0.778,
  type: 'spiral',
  hubble_classification: 'SA(s)b',
  morphology: { axis_ratio: 0.32, position_angle: 35, sersic_index: 4.0 },
  magnitude: 3.44,
  magnitude_absolute: -21.5,
  angular_size: 190,
  catalog_ids: { messier: 31, ngc: 224 },
  data_source: 'sdss_dr18',
};

const luna: Moon & { object_type: 'moon' } = {
  object_type: 'moon',
  id: 'sol_earth_luna',
  name: 'Moon',
  parentPlanet: 'sol_earth',
  position: { x: 0, y: 0, z: 0 },
  orbitalElements: { a: 0.00257, e: 0.0549, i: 5.145, Omega: 125.08, omega: 318.15, M: 135.27 },
  epoch: '2000-01-01T12:00:00Z',
  physicalProperties: {
    mass_kg: 7.342e22,
    radius_km: 1737.4,
    density: 3344,
    surface_gravity: 1.62,
    escape_velocity: 2.38,
    rotation_period: 655.72,
    mean_surface_temperature: 250,
  },
  albedo: 0.136,
  composition: 'silicate_rock',
};

const orionNebula: Nebula & { object_type: 'nebula' } = {
  object_type: 'nebula',
  id: 'm42',
  name: 'Orion Nebula',
  aliases: ['M42', 'NGC 1976'],
  position: { x: 0, y: 0, z: 412 },
  ra: 83.8221,
  dec: -5.3911,
  distance: 412,
  angular_size: 65,
  type: 'emission',
  temperature: 10000,
  density: 600,
  mass: 2000,
  associated_stars: ['trapezium_cluster'],
  catalog_ids: { messier: 42, ngc: 1976 },
};

const ceres: Asteroid & { object_type: 'asteroid' } = {
  object_type: 'asteroid',
  id: 'mpc_1',
  name: 'Ceres',
  designation: '1 Ceres',
  aliases: [],
  position: { x: 0, y: 0, z: 0 },
  orbitalElements: { a: 2.7675, e: 0.0758, i: 10.59, Omega: 80.31, omega: 73.60, M: 77.37 },
  epoch: '2000-01-01T12:00:00Z',
  diameter: 939.4,
  albedo: 0.09,
  absolute_magnitude: 3.34,
  taxonomic_type: 'C',
  catalog_ids: { mpc: 1 },
};

const halley: Comet & { object_type: 'comet' } = {
  object_type: 'comet',
  id: 'comet_1p',
  name: "Halley's Comet",
  designation: '1P/Halley',
  position: { x: 0, y: 0, z: 0 },
  orbitalElements: { a: 17.834, e: 0.967, i: 162.26, Omega: 58.42, omega: 111.33, M: 38.38 },
  perihelion_distance: 0.586,
  perihelion_date: '1986-02-09T00:00:00Z',
  aphelion_distance: 35.08,
  magnitude: 4.0,
  composition: { volatile: ['H2O', 'CO2', 'CO', 'CH4'] },
  catalog_ids: { iau_designation: '1P/1982 U1' },
  number_of_apparitions: 30,
  last_perihelion: '1986-02-09T00:00:00Z',
  next_perihelion: '2061-07-28T00:00:00Z',
};

const cosmicWebSample: CosmicWebNode = {
  position: { x: 100, y: 50, z: -200 },
  density: 0.73,
  type: 'filament',
};

describe('entity fixtures satisfy their interfaces', () => {
  it('Sirius parses as a Star', () => {
    expect(sirius.spectral_type).toBe('A1V');
    expect(sirius.distance).toBeCloseTo(2.64, 2);
  });

  it('Jupiter has a valid Keplerian orbit and physical block', () => {
    expect(jupiter.orbitalElements.e).toBeGreaterThan(0);
    expect(jupiter.orbitalElements.e).toBeLessThan(1);
    expect(jupiter.physicalProperties.mass_earth_masses).toBeCloseTo(317.8, 1);
  });

  it('Andromeda is a spiral galaxy with Messier + NGC ids', () => {
    expect(andromeda.type).toBe('spiral');
    expect(andromeda.catalog_ids.messier).toBe(31);
    expect(andromeda.catalog_ids.ngc).toBe(224);
  });

  it('Luna and Orion Nebula and Ceres round-trip through their types', () => {
    expect(luna.parentPlanet).toBe('sol_earth');
    expect(orionNebula.type).toBe('emission');
    expect(ceres.taxonomic_type).toBe('C');
  });

  it('Halley has a highly eccentric orbit and named volatiles', () => {
    expect(halley.orbitalElements.e).toBeGreaterThan(0.9);
    expect(halley.composition.volatile).toContain('H2O');
  });

  it('CosmicWebNode supports filament classification', () => {
    expect(cosmicWebSample.type).toBe('filament');
  });
});

describe('discriminated union + type guards', () => {
  const objects: CelestialObject[] = [
    sirius,
    jupiter,
    luna,
    andromeda,
    orionNebula,
    ceres,
    halley,
  ];

  it('each guard matches exactly one object', () => {
    expect(objects.filter(isStar)).toHaveLength(1);
    expect(objects.filter(isPlanet)).toHaveLength(1);
    expect(objects.filter(isMoon)).toHaveLength(1);
    expect(objects.filter(isGalaxy)).toHaveLength(1);
    expect(objects.filter(isNebula)).toHaveLength(1);
    expect(objects.filter(isAsteroid)).toHaveLength(1);
    expect(objects.filter(isComet)).toHaveLength(1);
  });

  it('narrowing unlocks entity-specific fields', () => {
    const [star] = objects.filter(isStar);
    // @ts-expect-error Star has no parentPlanet property
    void star?.parentPlanet;
    expect(star?.spectral_type).toBe('A1V');

    const [planet] = objects.filter(isPlanet);
    expect(planet?.orbitalElements.a).toBeCloseTo(5.2028, 3);
  });
});

describe('binary-tile constants match Doc 11 §4', () => {
  it('header and record sizes are fixed', () => {
    expect(STAR_TILE_HEADER_BYTES).toBe(16);
    expect(STAR_TILE_RECORD_BYTES).toBe(16);
    expect(GALAXY_TILE_HEADER_BYTES).toBe(16);
    expect(GALAXY_TILE_RECORD_BYTES).toBe(24);
    expect(COSMIC_WEB_HEADER_BYTES).toBe(20);
    expect(OCTREE_INDEX_HEADER_BYTES).toBe(20);
    expect(OCTREE_NODE_BYTES).toBe(12);
  });

  it('star flag bits do not overlap', () => {
    expect(STAR_FLAG_HAS_VELOCITY & STAR_FLAG_HAS_TEMP).toBe(0);
  });

  it('instances of StarTileHeader / Record / OctreeNode type-check', () => {
    const header: StarTileHeader = {
      tile_id: 1,
      star_count: 2048,
      min_distance: 0,
      max_distance: 10.0,
    };
    const record: StarTileRecord = {
      x: 0.1,
      y: -0.2,
      z: 0.05,
      magnitude: 128,
      color_index: 64,
      spectral_type: 4,
      flags: STAR_FLAG_HAS_VELOCITY | STAR_FLAG_HAS_TEMP,
      catalog_index: 42,
    };
    const node: OctreeNode = {
      tile_offset: 4096,
      tile_size: 16 * 1024,
      child_mask: 0b10110011,
      depth: 3,
      flags: 0,
    };
    expect(header.star_count * STAR_TILE_RECORD_BYTES).toBe(32768);
    expect(record.flags).toBe(0x03);
    expect(node.depth).toBeLessThanOrEqual(8);
  });
});

describe('extended entity taxonomy', () => {
  it('allows creating a 96-type definition + instance', () => {
    const diamondWorld: EntityTypeDefinition = {
      id: 'ENT-2037',
      category: 'planets',
      name: 'Carbon Planet (Diamond World)',
      shaderFamily: 'planet-exotic',
      properties: {
        color: '#d9e6ff',
        temperature: { min: 800, max: 2400, unit: 'K' },
        mass: { min: 0.5, max: 20, unit: 'Earth' },
      },
      rendering: {
        shaderFamily: 'planet-exotic',
        uniforms: { u_reflectance: 0.45, u_facets: [24, 24] },
        particleCount: { min: 0, max: 0 },
        lodLevels: [
          { level: 0, maxDistance: 0.01, renderMethod: 'full', particleMultiplier: 1 },
          { level: 4, maxDistance: 1000, renderMethod: 'icon', particleMultiplier: 0 },
        ],
      },
      visibleAtScales: [0, 1, 2],
      searchTerms: ['carbon', 'diamond', 'exotic planet'],
      realExamples: [{ name: '55 Cancri e', data: { radius: 1.88, mass: 7.99 } }],
    };

    const instance: EntityInstance = {
      id: 'ent-i-000001',
      typeId: diamondWorld.id,
      name: '55 Cancri e',
      position: { x: 12.5, y: 0, z: 0, scaleLevel: 1 },
      parentId: 'star_55_cnc',
    };

    expect(diamondWorld.category).toBe('planets');
    expect(instance.typeId).toBe('ENT-2037');
  });
});
