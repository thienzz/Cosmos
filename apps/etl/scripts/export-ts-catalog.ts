/**
 * T-C-01 — export client TS catalogs to data/seed/entities.json.
 *
 * Single Node entrypoint that imports every catalog, flattens them into
 * rows shaped for the Postgres `entities` table (+ the per-category
 * sidecar tables), and writes the result to `data/seed/entities.json`.
 *
 * The JSON is the handoff contract between the TS world and the Python
 * ETL in T-C-02 — Python never has to parse TypeScript. Re-running is
 * idempotent; the output is purely derived from the catalogs.
 *
 * Usage:
 *   pnpm seed:export
 *   # or: pnpm --filter @cosmos/etl-scripts seed:export
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Catalog imports — every file under apps/web/src/data that owns "what
// exists" for its category. Keep these behind path aliases that tsx can
// resolve by walking the workspace tsconfig chain.
// ---------------------------------------------------------------------------

import { IAU_NAMED_STARS } from '../../web/src/data/constellations.js';
import { NOTABLE_EXOPLANETS } from '../../web/src/data/exoplanetCatalog.js';
import { EXOTIC_CATALOG } from '../../web/src/data/exoticCatalog.js';
import { GALAXY_CATALOG } from '../../web/src/data/galaxyCatalog.js';
import {
  COLLIDING_CLUSTERS,
  COSMIC_VOIDS,
  GALAXY_CLUSTERS,
  GREAT_WALLS,
  HARRIS_DIAS_OPEN_CLUSTERS,
  HARRIS_GLOBULAR_CLUSTERS,
  LYMAN_ALPHA_BLOBS,
  OB_ASSOCIATIONS,
} from '../../web/src/data/largeScaleStructureCatalog.js';
import { NAMED_MINOR_MOONS } from '../../web/src/data/minorMoons.js';
import { NAMED_ASTEROIDS } from '../../web/src/data/namedAsteroids.js';
import { NAMED_COMETS } from '../../web/src/data/namedComets.js';
import { NEBULA_CATALOG } from '../../web/src/data/nebulaCatalog.js';
import {
  DWARF_PLANETS,
  MAJOR_MOONS,
  PLANETS,
  SUN,
  type SolarSystemBody,
} from '../../web/src/data/solarSystemCatalog.js';

// ---------------------------------------------------------------------------
// Output row shape — mirrors Postgres entities column set plus a sidecar
// bag per category. The Python ingester in T-C-02 picks the right bag.
// ---------------------------------------------------------------------------

interface EntityRow {
  /** VARCHAR(12) — Doc 17 subtype code (ENT-XXXX). */
  ent_id: string;
  /** Stable external id the client uses (e.g. "GAL-m31"). Goes into
   *  cross_identifications so the API's string lookup finds it. */
  external_id: string;
  name: string;
  aliases?: string[];
  /** Doc 17 entity_type smallint. */
  entity_type: number;
  /** Doc 17 category smallint. 1=star, 2=planet, 3=moon, 4=small body,
   *  5=nebula, 6=galaxy, 7=LSS, 8=exotic, 9=exoplanet, 10=structure. */
  category: number;
  ra_deg: number;
  dec_deg: number;
  distance_pc: number | null;
  properties: Record<string, unknown>;
  /** If present, also insert into solar_system_bodies with these fields. */
  solar_system?: {
    naif_id: number;
    body_type: string;
    parent_naif_id?: number | null;
    semi_major_au?: number | null;
    eccentricity?: number | null;
    inclination_deg?: number | null;
    lon_asc_node_deg?: number | null;
    arg_periapsis_deg?: number | null;
    mean_anomaly_deg?: number | null;
    epoch_jd?: number | null;
    radius_km?: number | null;
    axial_tilt_deg?: number | null;
  };
}

// Doc 17 subtype (ent_id) + category constants used by the mapping below.
// The numeric ent_id on each row is a "showpiece" default — future Phase D
// Gaia ingest will refine.
const KIND = {
  GALAXY_SPIRAL: 'ENT-6010',
  GALAXY_ELLIPTICAL: 'ENT-6020',
  GALAXY_IRREGULAR: 'ENT-6030',
  GALAXY_LENTICULAR: 'ENT-6040',
  GALAXY_AGN: 'ENT-6050',
  GALAXY_STARBURST: 'ENT-6060',
  GALAXY_DWARF: 'ENT-6070',
  NEBULA_EMISSION: 'ENT-5010',
  NEBULA_REFLECTION: 'ENT-5020',
  NEBULA_DARK: 'ENT-5030',
  NEBULA_PLANETARY: 'ENT-5040',
  NEBULA_SUPERNOVA: 'ENT-5050',
  NEBULA_WR: 'ENT-5060',
  NEBULA_PROTOPLANETARY: 'ENT-5070',
  BLACK_HOLE: 'ENT-8010',
  PULSAR: 'ENT-8020',
  MAGNETAR: 'ENT-8030',
  STAR_SUN: 'ENT-1000',
  PLANET_ROCKY: 'ENT-2010',
  PLANET_GAS: 'ENT-2020',
  MOON_ROCKY: 'ENT-3010',
  ASTEROID: 'ENT-4010',
  COMET: 'ENT-4020',
  STAR_MAIN_SEQUENCE: 'ENT-1000',
  EXOPLANET: 'ENT-9010',
  OPEN_CLUSTER: 'ENT-7040',
  GLOBULAR_CLUSTER: 'ENT-7050',
  OB_ASSOCIATION: 'ENT-7060',
  GALAXY_CLUSTER: 'ENT-7080',
  COLLIDING_CLUSTER: 'ENT-7085',
  GREAT_WALL: 'ENT-7090',
  COSMIC_VOID: 'ENT-7100',
  LYMAN_ALPHA_BLOB: 'ENT-7110',
} as const;

const CATEGORY = {
  STAR: 1,
  PLANET: 2,
  MOON: 3,
  SMALL_BODY: 4,
  NEBULA: 5,
  GALAXY: 6,
  LSS: 7,
  EXOTIC: 8,
  EXOPLANET: 9,
} as const;

function nebulaSubtypeToKind(subtype: string): string {
  if (subtype.startsWith('hii')) return KIND.NEBULA_EMISSION;
  if (subtype === 'reflection') return KIND.NEBULA_REFLECTION;
  if (subtype === 'dark') return KIND.NEBULA_DARK;
  if (subtype === 'planetary') return KIND.NEBULA_PLANETARY;
  if (subtype === 'supernova-remnant') return KIND.NEBULA_SUPERNOVA;
  if (subtype === 'wolf-rayet') return KIND.NEBULA_WR;
  if (subtype === 'protoplanetary') return KIND.NEBULA_PROTOPLANETARY;
  return KIND.NEBULA_EMISSION;
}

function galaxyKindToEnt(kind: string): string {
  switch (kind) {
    case 'spiral': return KIND.GALAXY_SPIRAL;
    case 'elliptical': return KIND.GALAXY_ELLIPTICAL;
    case 'irregular': return KIND.GALAXY_IRREGULAR;
    case 'lenticular': return KIND.GALAXY_LENTICULAR;
    case 'agn': return KIND.GALAXY_AGN;
    case 'starburst': return KIND.GALAXY_STARBURST;
    case 'dwarf-spheroidal':
    case 'dwarf-irregular':
    case 'dwarf':
      return KIND.GALAXY_DWARF;
    default: return KIND.GALAXY_SPIRAL;
  }
}

function exoticKindToEnt(kind: string): string {
  switch (kind) {
    case 'blackhole': return KIND.BLACK_HOLE;
    case 'pulsar': return KIND.PULSAR;
    case 'magnetar': return KIND.MAGNETAR;
    default: return KIND.BLACK_HOLE;
  }
}

// Convert Keplerian semi-major axis (km) to AU — Doc 23 uses km for moons,
// ssb schema stores AU.
const AU_KM = 149_597_870.7;
const km_to_au = (km: number): number => km / AU_KM;

function solarSystemToRows(): EntityRow[] {
  const rows: EntityRow[] = [];
  const pushBody = (body: SolarSystemBody, bodyType: string, category: number, kindEnt: string): void => {
    rows.push({
      ent_id: kindEnt,
      external_id: `NAIF-${body.naifId}`,
      name: body.name,
      aliases: [`NAIF ${body.naifId}`],
      entity_type: parseInt(kindEnt.replace('ENT-', ''), 10),
      category,
      ra_deg: 0,
      dec_deg: 0,
      distance_pc: null,
      properties: {
        naif_id: body.naifId,
        body_type: bodyType,
        radius_km: body.radius_km,
        parent_naif_id: body.parentNaifId,
      },
      solar_system: {
        naif_id: body.naifId,
        body_type: bodyType,
        parent_naif_id: body.parentNaifId >= 0 ? body.parentNaifId : null,
        semi_major_au: body.orbit.a_km > 0 ? km_to_au(body.orbit.a_km) : null,
        eccentricity: body.orbit.e,
        inclination_deg: body.orbit.i_deg,
        lon_asc_node_deg: body.orbit.Omega_deg,
        arg_periapsis_deg: body.orbit.omega_deg,
        mean_anomaly_deg: body.orbit.M0_deg,
        radius_km: body.radius_km,
        axial_tilt_deg: body.obliquity_deg ?? null,
      },
    });
  };

  pushBody(SUN, 'star', CATEGORY.STAR, KIND.STAR_SUN);
  for (const p of PLANETS) pushBody(p, 'planet', CATEGORY.PLANET, KIND.PLANET_ROCKY);
  for (const d of DWARF_PLANETS) pushBody(d, 'dwarf_planet', CATEGORY.PLANET, KIND.PLANET_ROCKY);
  for (const m of MAJOR_MOONS) pushBody(m, 'moon', CATEGORY.MOON, KIND.MOON_ROCKY);
  return rows;
}

function galaxiesToRows(): EntityRow[] {
  return GALAXY_CATALOG.map((g) => {
    const kindEnt = galaxyKindToEnt(g.kind);
    return {
      ent_id: kindEnt,
      external_id: `GAL-${g.id}`,
      name: g.name,
      aliases: g.aliases ?? [],
      entity_type: parseInt(kindEnt.replace('ENT-', ''), 10),
      category: CATEGORY.GALAXY,
      ra_deg: g.ra_deg,
      dec_deg: g.dec_deg,
      distance_pc: g.distance_kpc * 1000,
      properties: {
        kind: g.kind,
        hubble: g.hubble ?? null,
        messier: g.messier ?? null,
        ngc: g.ngc ?? null,
        pgc: g.pgc ?? null,
        magnitude_apparent: g.magnitude,
        angular_diameter_arcmin: g.angular_diameter_arcmin ?? null,
      },
    };
  });
}

function nebulaeToRows(): EntityRow[] {
  return NEBULA_CATALOG.map((n) => {
    const kindEnt = nebulaSubtypeToKind(n.subtype);
    return {
      ent_id: kindEnt,
      external_id: `NEB-${n.id}`,
      name: n.name,
      aliases: n.aliases ?? [],
      entity_type: parseInt(kindEnt.replace('ENT-', ''), 10),
      category: CATEGORY.NEBULA,
      ra_deg: n.ra_deg,
      dec_deg: n.dec_deg,
      distance_pc: n.distance_pc,
      properties: {
        subtype: n.subtype,
        messier: n.messier ?? null,
        ngc: n.ngc ?? null,
        ic: n.ic ?? null,
        barnard: n.barnard ?? null,
        sharpless: n.sharpless ?? null,
        lbn: n.lbn ?? null,
        ldn: n.ldn ?? null,
        magnitude_apparent: n.magnitude,
        diameter_pc: n.diameter_pc,
        angular_size_arcmin: n.angular_size_arcmin ?? null,
        description: n.description ?? null,
      },
    };
  });
}

function exoticsToRows(): EntityRow[] {
  return EXOTIC_CATALOG.map((x) => {
    const kindEnt = exoticKindToEnt(x.kind);
    return {
      ent_id: kindEnt,
      external_id: `EXO-${x.id}`,
      name: x.name,
      aliases: x.aliases ?? [],
      entity_type: parseInt(kindEnt.replace('ENT-', ''), 10),
      category: CATEGORY.EXOTIC,
      ra_deg: x.ra_deg,
      dec_deg: x.dec_deg,
      distance_pc: x.distance_pc,
      properties: {
        kind: x.kind,
        magnitude_apparent: x.magnitude ?? null,
        description: x.description ?? null,
      },
    };
  });
}

function openClustersToRows(): EntityRow[] {
  return HARRIS_DIAS_OPEN_CLUSTERS.map((c) => ({
    ent_id: KIND.OPEN_CLUSTER,
    external_id: `OC-${c.id}`,
    name: c.name,
    aliases: c.altId ? [c.altId] : [],
    entity_type: 7040,
    category: CATEGORY.LSS,
    ra_deg: c.position.raDeg,
    dec_deg: c.position.decDeg,
    distance_pc: c.position.distancePc,
    properties: {
      age_myr: c.ageMyr,
      member_count: c.memberCount,
      radius_pc: c.radiusPc,
      alt_id: c.altId ?? null,
    },
  }));
}

function globularClustersToRows(): EntityRow[] {
  return HARRIS_GLOBULAR_CLUSTERS.map((c) => ({
    ent_id: KIND.GLOBULAR_CLUSTER,
    external_id: `GC-${c.id}`,
    name: c.name,
    aliases: c.altId ? [c.altId] : [],
    entity_type: 7050,
    category: CATEGORY.LSS,
    ra_deg: c.position.raDeg,
    dec_deg: c.position.decDeg,
    distance_pc: c.position.distancePc,
    properties: {
      age_gyr: c.ageGyr,
      metallicity: c.feH,
      member_count: c.memberCount,
      radius_pc: c.halfLightRadiusPc,
      alt_id: c.altId ?? null,
    },
  }));
}

function obAssociationsToRows(): EntityRow[] {
  return OB_ASSOCIATIONS.map((c) => ({
    ent_id: KIND.OB_ASSOCIATION,
    external_id: `OB-${c.id}`,
    name: c.name,
    aliases: [],
    entity_type: 7060,
    category: CATEGORY.LSS,
    ra_deg: c.position.raDeg,
    dec_deg: c.position.decDeg,
    distance_pc: c.position.distancePc,
    properties: {
      age_myr: c.ageMyr,
      member_count: c.memberCount,
      radius_pc: c.radiusPc,
    },
  }));
}

function galaxyClustersToRows(): EntityRow[] {
  return GALAXY_CLUSTERS.map((c) => ({
    ent_id: KIND.GALAXY_CLUSTER,
    external_id: `CL-${c.id}`,
    name: c.name,
    aliases: c.altId ? [c.altId] : [],
    entity_type: 7080,
    category: CATEGORY.LSS,
    ra_deg: c.position.raDeg,
    dec_deg: c.position.decDeg,
    distance_pc: c.position.distancePc,
    properties: {
      richness: c.richness,
      member_galaxies: c.memberGalaxies,
      radius_mpc: c.radiusMpc,
      redshift: c.redshift,
    },
  }));
}

function collidingClustersToRows(): EntityRow[] {
  return COLLIDING_CLUSTERS.map((c) => ({
    ent_id: KIND.COLLIDING_CLUSTER,
    external_id: `CC-${c.id}`,
    name: c.name,
    aliases: [],
    entity_type: 7085,
    category: CATEGORY.LSS,
    ra_deg: c.position.raDeg,
    dec_deg: c.position.decDeg,
    distance_pc: c.position.distancePc,
    properties: {
      primary_cluster: c.primaryCluster,
      secondary_cluster: c.secondaryCluster,
    },
  }));
}

function greatWallsToRows(): EntityRow[] {
  return GREAT_WALLS.map((w) => ({
    ent_id: KIND.GREAT_WALL,
    external_id: `GW-${w.id}`,
    name: w.name,
    aliases: [],
    entity_type: 7090,
    category: CATEGORY.LSS,
    ra_deg: w.position.raDeg,
    dec_deg: w.position.decDeg,
    distance_pc: w.position.distancePc,
    properties: {
      length_mpc: w.lengthMpc,
      width_mpc: w.widthMpc,
    },
  }));
}

function voidsToRows(): EntityRow[] {
  return COSMIC_VOIDS.map((v) => ({
    ent_id: KIND.COSMIC_VOID,
    external_id: `VOID-${v.id}`,
    name: v.name,
    aliases: [],
    entity_type: 7100,
    category: CATEGORY.LSS,
    ra_deg: v.position.raDeg,
    dec_deg: v.position.decDeg,
    distance_pc: v.position.distancePc,
    properties: {
      radius_mpc: v.radiusMpc,
    },
  }));
}

function lymanAlphaBlobsToRows(): EntityRow[] {
  return LYMAN_ALPHA_BLOBS.map((b) => ({
    ent_id: KIND.LYMAN_ALPHA_BLOB,
    external_id: `LAB-${b.id}`,
    name: b.name,
    aliases: [],
    entity_type: 7110,
    category: CATEGORY.LSS,
    ra_deg: b.position.raDeg,
    dec_deg: b.position.decDeg,
    distance_pc: b.position.distancePc,
    properties: {
      redshift: b.redshift,
      size_kpc: b.sizeKpc,
    },
  }));
}

function iauNamedStarsToRows(): EntityRow[] {
  return IAU_NAMED_STARS.map((s) => ({
    ent_id: KIND.STAR_MAIN_SEQUENCE,
    external_id: s.hip !== null ? `HIP-${s.hip}` : `STAR-${s.name.replace(/\s+/g, '')}`,
    name: s.name,
    aliases: [s.bayer, s.flamsteed, s.hip !== null ? `HIP ${s.hip}` : undefined]
      .filter((x): x is string => typeof x === 'string' && x.length > 0),
    entity_type: 1000,
    category: CATEGORY.STAR,
    ra_deg: s.raDeg,
    dec_deg: s.decDeg,
    distance_pc: s.distancePc,
    properties: {
      magnitude_apparent: s.magV,
      spectral_type: s.spectralType,
      constellation: s.constellation,
      hip: s.hip,
      hd: s.hd ?? null,
      bayer: s.bayer,
      flamsteed: s.flamsteed ?? null,
    },
  }));
}

function exoplanetsToRows(): EntityRow[] {
  return NOTABLE_EXOPLANETS.map((p) => ({
    ent_id: KIND.EXOPLANET,
    external_id: `EXOPL-${p.planetName.replace(/\s+/g, '-')}`,
    name: p.planetName,
    aliases: [p.hostStarName],
    entity_type: 9010,
    category: CATEGORY.EXOPLANET,
    ra_deg: p.hostRaHours * 15, // hours → degrees
    dec_deg: p.hostDecDeg,
    distance_pc: p.hostDistancePc,
    properties: {
      host_star_name: p.hostStarName,
      host_gaia_id: p.hostGaiaId,
      host_spectral_type: p.hostSpectralType,
      discovery_method: p.discoveryMethod,
      discovery_year: p.discoveryYear,
      discovery_facility: p.discoveryFacility,
      period_days: p.periodDays,
      semi_major_axis_au: p.semiMajorAxisAU,
      eccentricity: p.eccentricity,
      inclination_deg: p.inclinationDeg,
      mass_earth: p.massEarth,
      radius_earth: p.radiusEarth,
      equilibrium_temp_k: p.equilibriumTempK,
      insolation_earth: p.insolationEarth,
      kind: p.kind,
      architecture: p.architecture,
      in_habitable_zone: p.inHabitableZone,
      atmosphere_detected: p.atmosphereDetected,
    },
  }));
}

function asteroidsAndCometsToRows(): EntityRow[] {
  const rows: EntityRow[] = [];
  for (const a of NAMED_ASTEROIDS) {
    rows.push({
      ent_id: KIND.ASTEROID,
      external_id: `NAIF-${a.naifId}`,
      name: a.name,
      aliases: [`NAIF ${a.naifId}`],
      entity_type: 4010,
      category: CATEGORY.SMALL_BODY,
      ra_deg: 0,
      dec_deg: 0,
      distance_pc: null,
      properties: {
        naif_id: a.naifId,
        body_type: 'asteroid',
        radius_km: a.radius_km,
      },
      solar_system: {
        naif_id: a.naifId,
        body_type: 'asteroid',
        parent_naif_id: a.parentNaifId >= 0 ? a.parentNaifId : null,
        semi_major_au: a.orbit.a_km > 0 ? km_to_au(a.orbit.a_km) : null,
        eccentricity: a.orbit.e,
        inclination_deg: a.orbit.i_deg,
        lon_asc_node_deg: a.orbit.Omega_deg,
        arg_periapsis_deg: a.orbit.omega_deg,
        mean_anomaly_deg: a.orbit.M0_deg,
        radius_km: a.radius_km,
      },
    });
  }
  for (const c of NAMED_COMETS) {
    rows.push({
      ent_id: KIND.COMET,
      external_id: `NAIF-${c.naifId}`,
      name: c.name,
      aliases: [`NAIF ${c.naifId}`],
      entity_type: 4020,
      category: CATEGORY.SMALL_BODY,
      ra_deg: 0,
      dec_deg: 0,
      distance_pc: null,
      properties: {
        naif_id: c.naifId,
        body_type: 'comet',
        subtype: c.subtype,
        nucleus_km: c.nucleus_km,
        activity: c.activity,
      },
      solar_system: {
        naif_id: c.naifId,
        body_type: 'comet',
        parent_naif_id: c.parentNaifId >= 0 ? c.parentNaifId : null,
        semi_major_au: c.orbit.a_km > 0 ? km_to_au(c.orbit.a_km) : null,
        eccentricity: c.orbit.e,
        inclination_deg: c.orbit.i_deg,
        lon_asc_node_deg: c.orbit.Omega_deg,
        arg_periapsis_deg: c.orbit.omega_deg,
        mean_anomaly_deg: c.orbit.M0_deg,
        radius_km: c.nucleus_km,
      },
    });
  }
  return rows;
}

function namedMinorMoonsToRows(): EntityRow[] {
  return NAMED_MINOR_MOONS.map((m) => ({
    ent_id: KIND.MOON_ROCKY,
    external_id: `NAIF-${m.naifId}`,
    name: m.name,
    aliases: [`NAIF ${m.naifId}`],
    entity_type: 3010,
    category: CATEGORY.MOON,
    ra_deg: 0,
    dec_deg: 0,
    distance_pc: null,
    properties: {
      naif_id: m.naifId,
      body_type: 'moon',
      radius_km: m.radius_km,
      parent_naif_id: m.parentNaifId,
    },
    solar_system: {
      naif_id: m.naifId,
      body_type: 'moon',
      parent_naif_id: m.parentNaifId >= 0 ? m.parentNaifId : null,
      semi_major_au: m.orbit.a_km > 0 ? km_to_au(m.orbit.a_km) : null,
      eccentricity: m.orbit.e,
      inclination_deg: m.orbit.i_deg,
      lon_asc_node_deg: m.orbit.Omega_deg,
      arg_periapsis_deg: m.orbit.omega_deg,
      mean_anomaly_deg: m.orbit.M0_deg,
      radius_km: m.radius_km,
      axial_tilt_deg: m.obliquity_deg ?? null,
    },
  }));
}

// ---------------------------------------------------------------------------
// Entrypoint
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const rows: EntityRow[] = [
    ...solarSystemToRows(),
    ...namedMinorMoonsToRows(),
    ...asteroidsAndCometsToRows(),
    ...iauNamedStarsToRows(),
    ...exoplanetsToRows(),
    ...galaxiesToRows(),
    ...nebulaeToRows(),
    ...exoticsToRows(),
    ...openClustersToRows(),
    ...globularClustersToRows(),
    ...obAssociationsToRows(),
    ...galaxyClustersToRows(),
    ...collidingClustersToRows(),
    ...greatWallsToRows(),
    ...voidsToRows(),
    ...lymanAlphaBlobsToRows(),
  ];

  // Deduplicate — a solar-system moon can appear in both MAJOR_MOONS and
  // NAMED_MINOR_MOONS arrays (client ergonomics). Collapse by external_id.
  const seen = new Set<string>();
  const deduped = rows.filter((r) => {
    if (seen.has(r.external_id)) return false;
    seen.add(r.external_id);
    return true;
  });

  const here = dirname(fileURLToPath(import.meta.url));
  const outDir = resolve(here, '../../../data/seed');
  const outPath = resolve(outDir, 'entities.json');
  await mkdir(outDir, { recursive: true });
  await writeFile(outPath, JSON.stringify(deduped, null, 2), 'utf8');

  const byCat: Record<number, number> = {};
  for (const r of deduped) byCat[r.category] = (byCat[r.category] ?? 0) + 1;
  const ssbCount = deduped.filter((r) => r.solar_system !== undefined).length;

  // eslint-disable-next-line no-console
  console.log(
    `[seed:export] wrote ${deduped.length} entities to ${outPath}\n` +
      `  by category: ${JSON.stringify(byCat)}\n` +
      `  solar_system_bodies sidecar: ${ssbCount}`,
  );
}

main().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('[seed:export] failed', err);
  process.exit(1);
});
