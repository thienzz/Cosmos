/**
 * Client-side search fallback (Doc 26 §6 offline variant).
 *
 * When the dev ES middleware or production search API is unreachable, this
 * module answers autocomplete + full-text queries against an in-memory index
 * built from every catalog the frontend already ships. Hits carry the same
 * {@link AutocompleteItem} / {@link TextSearchItem} shape the HTTP client
 * returns — including ICRS `ra` / `dec` / `distance_pc` — so the
 * SearchPanel can route deep-sky clicks through
 * `requestFlyToCelestialCoord` without a round-trip to the server.
 *
 * Coverage (2026-04-21):
 *   Solar bodies : Sun, 8 planets, 5 dwarfs, major + named minor moons,
 *                  named asteroids, named comets, notable exoplanets
 *   Stars        : IAU_NAMED_STARS (91 bright stars, Bayer + HIP + HD alias)
 *   Galaxies     : GALAXY_CATALOG (M31 + Local Group + Messier + NGC)
 *   Nebulae      : NEBULA_CATALOG (M42, Crab, Eagle, Horsehead, …)
 *   Exotic       : EXOTIC_CATALOG (Sgr A*, M87*, Crab pulsar, …)
 *   LSS          : GALAXY_CLUSTERS, HARRIS_DIAS_OPEN_CLUSTERS,
 *                  HARRIS_GLOBULAR_CLUSTERS, OB_ASSOCIATIONS,
 *                  GREAT_WALLS, COSMIC_VOIDS, LYMAN_ALPHA_BLOBS,
 *                  COLLIDING_CLUSTERS
 *   Sky          : IAU_CONSTELLATIONS (88 constellations by centroid)
 *
 * Generic category synonyms ("black hole", "pulsar", "galaxy", …) are
 * surfaced as synthetic "index" rows that the UI routes into category
 * filters — they match first and tell the user where to look.
 */

import type { AutocompleteItem, TextSearchItem } from '@/api/search';
import { isGasGiant, type PlanetKind } from '@/utils/planetPalette';

import { IAU_NAMED_STARS, IAU_CONSTELLATIONS } from './constellations';
import { NOTABLE_EXOPLANETS } from './exoplanetCatalog';
import { EXOTIC_CATALOG } from './exoticCatalog';
import { GALAXY_CATALOG } from './galaxyCatalog';
import {
  HARRIS_DIAS_OPEN_CLUSTERS,
  HARRIS_GLOBULAR_CLUSTERS,
  OB_ASSOCIATIONS,
  GALAXY_CLUSTERS,
  COLLIDING_CLUSTERS,
  GREAT_WALLS,
  COSMIC_VOIDS,
  LYMAN_ALPHA_BLOBS,
} from './largeScaleStructureCatalog';
import { NAMED_MINOR_MOONS } from './minorMoons';
import { NAMED_ASTEROIDS } from './namedAsteroids';
import { NAMED_COMETS } from './namedComets';
import { NEBULA_CATALOG } from './nebulaCatalog';
import {
  DWARF_PLANETS,
  MAJOR_MOONS,
  PLANETS,
  SUN,
  type BodyKind,
  type SolarSystemBody,
} from './solarSystemCatalog';

/** Doc 26 §6.2 category ids. Kept in sync with SearchPanel `CATEGORY_OPTIONS`. */
const CATEGORY: Record<number, { id: number; name: string }> = {
  1: { id: 1, name: 'Stars' },
  2: { id: 2, name: 'Rocky planets' },
  3: { id: 3, name: 'Gas giants' },
  4: { id: 4, name: 'Moons' },
  5: { id: 5, name: 'Nebulae' },
  6: { id: 6, name: 'Galaxies' },
  7: { id: 7, name: 'Small bodies' },
  8: { id: 8, name: 'Large-scale structure' },
  9: { id: 9, name: 'Exotic objects' },
  10: { id: 10, name: 'Constellations' },
};

function categoryForBody(body: SolarSystemBody): { id: number; name: string } {
  switch (body.kind as BodyKind) {
    case 'star':
      return CATEGORY[1]!;
    case 'planet':
      return body.renderAs && isGasGiant(body.renderAs)
        ? CATEGORY[3]!
        : CATEGORY[2]!;
    case 'dwarf_planet':
      return CATEGORY[2]!;
    case 'moon':
      return CATEGORY[4]!;
    case 'asteroid':
    case 'kbo':
    case 'comet':
    case 'trojan':
      return CATEGORY[7]!;
  }
}

/** Minimal doc the index stores per entry. Mirrors AutocompleteItem fields. */
interface IndexDoc {
  text: string;
  /** Lowercased text for substring match. */
  searchKey: string;
  /** Extra keywords (aliases, catalog IDs) also matched, lowercased. */
  aliases: readonly string[];
  ent_id: string;
  id: number | string;
  category: number;
  category_name: string;
  magnitude?: number;
  /** ICRS J2000.0 right ascension (degrees). Absent for solar-system bodies. */
  raDeg?: number;
  /** ICRS J2000.0 declination (degrees). */
  decDeg?: number;
  /** Distance in parsecs (null for constellations, undefined for solar bodies). */
  distancePc?: number | null;
  /** Constellation abbr (for IAU constellation entries). */
  constellationAbbr?: string;
}

let cachedIndex: IndexDoc[] | null = null;

function lc(s: string | null | undefined): string | null {
  return typeof s === 'string' && s.length > 0 ? s.toLowerCase() : null;
}

function addAlias(list: string[], alias: string | null | undefined): void {
  const l = lc(alias);
  if (l && !list.includes(l)) list.push(l);
}

function pushSolarBody(docs: IndexDoc[], body: SolarSystemBody): void {
  const cat = categoryForBody(body);
  const aliases: string[] = [];
  addAlias(aliases, String(body.naifId));
  docs.push({
    text: body.name,
    searchKey: body.name.toLowerCase(),
    aliases,
    ent_id: `NAIF-${body.naifId}`,
    id: body.naifId,
    category: cat.id,
    category_name: cat.name,
  });
}

/**
 * Build (or return the cached) flat index. Construction is synchronous and
 * cheap (~600 entries @ <1 ms), so we just do it on first demand and memoize.
 */
export function getLocalSearchIndex(): IndexDoc[] {
  if (cachedIndex) return cachedIndex;

  const docs: IndexDoc[] = [];

  // -----------------------------------------------------------------------
  // Solar system bodies: Sun, planets, dwarf planets, major + named minor
  // moons, named asteroids, named comets.
  // -----------------------------------------------------------------------
  for (const body of [
    SUN,
    ...PLANETS,
    ...DWARF_PLANETS,
    ...MAJOR_MOONS,
    ...NAMED_MINOR_MOONS,
    ...NAMED_ASTEROIDS,
    ...NAMED_COMETS,
  ]) {
    pushSolarBody(docs, body);
  }

  // -----------------------------------------------------------------------
  // Notable exoplanets — indexed on both planet name and host star name so
  // "TRAPPIST" / "Proxima" / "51 Peg" all resolve. These don't carry ICRS
  // positions directly; the UI fetches host-star details via the
  // enrichment path. We still surface them as Gas-giant/Rocky-planet rows.
  // -----------------------------------------------------------------------
  for (const ex of NOTABLE_EXOPLANETS) {
    const cat = isGasGiant(ex.kind as PlanetKind) ? CATEGORY[3]! : CATEGORY[2]!;
    const aliases: string[] = [];
    addAlias(aliases, ex.hostStarName);
    addAlias(aliases, String(ex.hostGaiaId));
    docs.push({
      text: ex.planetName,
      searchKey: ex.planetName.toLowerCase(),
      aliases,
      ent_id: `ENT-${ex.entityTypeId}`,
      id: ex.hostGaiaId,
      category: cat.id,
      category_name: cat.name,
    });
  }

  // -----------------------------------------------------------------------
  // IAU named stars (91) — Bayer, Flamsteed, HIP, HD aliases so the user
  // can type any designation and land on the right star.
  // -----------------------------------------------------------------------
  for (const s of IAU_NAMED_STARS) {
    const aliases: string[] = [];
    addAlias(aliases, s.bayer);
    addAlias(aliases, s.flamsteed);
    if (typeof s.hip === 'number') {
      addAlias(aliases, `HIP${s.hip}`);
      addAlias(aliases, `HIP ${s.hip}`);
    }
    if (typeof s.hd === 'number' && s.hd !== null) {
      addAlias(aliases, `HD${s.hd}`);
      addAlias(aliases, `HD ${s.hd}`);
    }
    docs.push({
      text: s.name,
      searchKey: s.name.toLowerCase(),
      aliases,
      ent_id: typeof s.hip === 'number' ? `HIP-${s.hip}` : `STAR-${s.name.replace(/\s+/g, '')}`,
      id: s.hip ?? s.name,
      category: 1,
      category_name: 'Stars',
      magnitude: s.magV,
      raDeg: s.raDeg,
      decDeg: s.decDeg,
      distancePc: s.distancePc,
    });
  }

  // -----------------------------------------------------------------------
  // Galaxies (21) — Messier / NGC / PGC aliases.
  // -----------------------------------------------------------------------
  for (const g of GALAXY_CATALOG) {
    const aliases: string[] = [];
    if (typeof g.messier === 'number') {
      addAlias(aliases, `M${g.messier}`);
      addAlias(aliases, `M ${g.messier}`);
      addAlias(aliases, `Messier ${g.messier}`);
    }
    if (typeof g.ngc === 'number') {
      addAlias(aliases, `NGC${g.ngc}`);
      addAlias(aliases, `NGC ${g.ngc}`);
    }
    if (typeof g.pgc === 'number') {
      addAlias(aliases, `PGC${g.pgc}`);
      addAlias(aliases, `PGC ${g.pgc}`);
    }
    for (const a of g.aliases ?? []) addAlias(aliases, a);
    addAlias(aliases, g.id);
    docs.push({
      text: g.name,
      searchKey: g.name.toLowerCase(),
      aliases,
      ent_id: `GAL-${g.id}`,
      id: g.id,
      category: 6,
      category_name: 'Galaxies',
      magnitude: g.magnitude,
      raDeg: g.ra_deg,
      decDeg: g.dec_deg,
      distancePc: g.distance_kpc * 1000, // kpc → pc
    });
  }

  // -----------------------------------------------------------------------
  // Nebulae (30) — Messier, NGC, IC, Barnard, Sharpless, LBN, LDN aliases.
  // -----------------------------------------------------------------------
  for (const n of NEBULA_CATALOG) {
    const aliases: string[] = [];
    if (typeof n.messier === 'number') {
      addAlias(aliases, `M${n.messier}`);
      addAlias(aliases, `M ${n.messier}`);
      addAlias(aliases, `Messier ${n.messier}`);
    }
    if (typeof n.ngc === 'number') {
      addAlias(aliases, `NGC${n.ngc}`);
      addAlias(aliases, `NGC ${n.ngc}`);
    }
    if (typeof n.ic === 'number') {
      addAlias(aliases, `IC${n.ic}`);
      addAlias(aliases, `IC ${n.ic}`);
    }
    if (typeof n.barnard === 'number') addAlias(aliases, `B${n.barnard}`);
    if (typeof n.sharpless === 'number') addAlias(aliases, `Sh2-${n.sharpless}`);
    if (typeof n.lbn === 'number') addAlias(aliases, `LBN${n.lbn}`);
    if (typeof n.ldn === 'number') addAlias(aliases, `LDN${n.ldn}`);
    for (const a of n.aliases ?? []) addAlias(aliases, a);
    addAlias(aliases, n.id);
    addAlias(aliases, 'nebula');
    docs.push({
      text: n.name,
      searchKey: n.name.toLowerCase(),
      aliases,
      ent_id: `NEB-${n.id}`,
      id: n.id,
      category: 5,
      category_name: 'Nebulae',
      magnitude: n.magnitude ?? undefined,
      raDeg: n.ra_deg,
      decDeg: n.dec_deg,
      distancePc: n.distance_pc,
    });
  }

  // -----------------------------------------------------------------------
  // Exotic objects (11) — black holes, pulsars, magnetars.
  // -----------------------------------------------------------------------
  for (const e of EXOTIC_CATALOG) {
    const aliases: string[] = [];
    for (const a of e.aliases ?? []) addAlias(aliases, a);
    addAlias(aliases, e.id);
    // Generic category tags for "black hole" / "pulsar" / "magnetar" searches.
    if (e.kind === 'blackhole') {
      addAlias(aliases, 'black hole');
      addAlias(aliases, 'blackhole');
      addAlias(aliases, 'bh');
    } else if (e.kind === 'pulsar') {
      addAlias(aliases, 'pulsar');
      addAlias(aliases, 'neutron star');
    } else if (e.kind === 'magnetar') {
      addAlias(aliases, 'magnetar');
      addAlias(aliases, 'neutron star');
    }
    docs.push({
      text: e.name,
      searchKey: e.name.toLowerCase(),
      aliases,
      ent_id: `EXO-${e.id}`,
      id: e.id,
      category: 9,
      category_name: 'Exotic objects',
      magnitude: e.magnitude,
      raDeg: e.ra_deg,
      decDeg: e.dec_deg,
      distancePc: e.distance_pc,
    });
  }

  // -----------------------------------------------------------------------
  // Large-scale structure — galaxy clusters, superclusters, open clusters,
  // globular clusters, OB associations, great walls, voids, Ly-α blobs,
  // colliding clusters.
  // -----------------------------------------------------------------------
  for (const c of GALAXY_CLUSTERS) {
    const aliases: string[] = [];
    addAlias(aliases, c.altId);
    addAlias(aliases, c.id);
    addAlias(aliases, c.richness);
    addAlias(aliases, c.richness === 'cluster' ? 'galaxy cluster' : null);
    addAlias(aliases, c.richness === 'supercluster' ? 'supercluster' : null);
    addAlias(aliases, c.richness === 'group' ? 'galaxy group' : null);
    docs.push({
      text: c.name,
      searchKey: c.name.toLowerCase(),
      aliases,
      ent_id: `LSS-${c.id}`,
      id: c.id,
      category: 8,
      category_name: 'Large-scale structure',
      raDeg: c.position.raDeg,
      decDeg: c.position.decDeg,
      distancePc: c.position.distancePc,
    });
  }

  for (const oc of HARRIS_DIAS_OPEN_CLUSTERS) {
    const aliases: string[] = [];
    addAlias(aliases, oc.altId);
    addAlias(aliases, oc.id);
    addAlias(aliases, 'open cluster');
    addAlias(aliases, 'star cluster');
    docs.push({
      text: oc.name,
      searchKey: oc.name.toLowerCase(),
      aliases,
      ent_id: `OC-${oc.id}`,
      id: oc.id,
      category: 8,
      category_name: 'Large-scale structure',
      raDeg: oc.position.raDeg,
      decDeg: oc.position.decDeg,
      distancePc: oc.position.distancePc,
    });
  }

  for (const gc of HARRIS_GLOBULAR_CLUSTERS) {
    const aliases: string[] = [];
    addAlias(aliases, gc.altId);
    addAlias(aliases, gc.id);
    addAlias(aliases, 'globular cluster');
    addAlias(aliases, 'star cluster');
    docs.push({
      text: gc.name,
      searchKey: gc.name.toLowerCase(),
      aliases,
      ent_id: `GC-${gc.id}`,
      id: gc.id,
      category: 8,
      category_name: 'Large-scale structure',
      raDeg: gc.position.raDeg,
      decDeg: gc.position.decDeg,
      distancePc: gc.position.distancePc,
    });
  }

  for (const ob of OB_ASSOCIATIONS) {
    docs.push({
      text: ob.name,
      searchKey: ob.name.toLowerCase(),
      aliases: ['ob association', 'stellar association', ob.id],
      ent_id: `OB-${ob.id}`,
      id: ob.id,
      category: 8,
      category_name: 'Large-scale structure',
      raDeg: ob.position.raDeg,
      decDeg: ob.position.decDeg,
      distancePc: ob.position.distancePc,
    });
  }

  for (const cc of COLLIDING_CLUSTERS) {
    const aliases: string[] = [];
    addAlias(aliases, cc.altId);
    addAlias(aliases, cc.id);
    addAlias(aliases, 'colliding cluster');
    addAlias(aliases, 'galaxy cluster');
    docs.push({
      text: cc.name,
      searchKey: cc.name.toLowerCase(),
      aliases,
      ent_id: `LSS-${cc.id}`,
      id: cc.id,
      category: 8,
      category_name: 'Large-scale structure',
      raDeg: cc.position.raDeg,
      decDeg: cc.position.decDeg,
      distancePc: cc.position.distancePc,
    });
  }

  for (const gw of GREAT_WALLS) {
    docs.push({
      text: gw.name,
      searchKey: gw.name.toLowerCase(),
      aliases: ['great wall', 'filament', 'cosmic wall', gw.id],
      ent_id: `LSS-${gw.id}`,
      id: gw.id,
      category: 8,
      category_name: 'Large-scale structure',
      raDeg: gw.position.raDeg,
      decDeg: gw.position.decDeg,
      distancePc: gw.position.distancePc,
    });
  }

  for (const v of COSMIC_VOIDS) {
    docs.push({
      text: v.name,
      searchKey: v.name.toLowerCase(),
      aliases: ['void', 'cosmic void', v.id],
      ent_id: `LSS-${v.id}`,
      id: v.id,
      category: 8,
      category_name: 'Large-scale structure',
      raDeg: v.position.raDeg,
      decDeg: v.position.decDeg,
      distancePc: v.position.distancePc,
    });
  }

  for (const b of LYMAN_ALPHA_BLOBS) {
    docs.push({
      text: b.name,
      searchKey: b.name.toLowerCase(),
      aliases: ['lyman-alpha blob', 'lab', 'lyman alpha', b.id],
      ent_id: `LSS-${b.id}`,
      id: b.id,
      category: 8,
      category_name: 'Large-scale structure',
      raDeg: b.position.raDeg,
      decDeg: b.position.decDeg,
      distancePc: b.position.distancePc,
    });
  }

  // -----------------------------------------------------------------------
  // IAU constellations (88) — searchable by name, abbreviation, genitive.
  // No distance (constellation centroid is a sky direction, not an object).
  // -----------------------------------------------------------------------
  for (const c of IAU_CONSTELLATIONS) {
    docs.push({
      text: c.name,
      searchKey: c.name.toLowerCase(),
      aliases: [c.abbr.toLowerCase(), c.genitive.toLowerCase(), 'constellation'],
      ent_id: `CON-${c.abbr}`,
      id: c.abbr,
      category: 10,
      category_name: 'Constellations',
      raDeg: c.centroidRaDeg,
      decDeg: c.centroidDecDeg,
      distancePc: null,
      constellationAbbr: c.abbr,
    });
  }

  cachedIndex = docs;
  return docs;
}

/** Clear the memoized index. Exposed for tests. */
export function resetLocalSearchIndex(): void {
  cachedIndex = null;
}

/**
 * Escape regex metacharacters so the query string is treated literally
 * before we wrap matching substrings in `<em>…</em>` highlight tags.
 */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlight(text: string, q: string): string {
  const rx = new RegExp(escapeRegExp(q), 'ig');
  return text.replace(rx, (match) => `<em>${match}</em>`);
}

/** Normalise a query for alias matching: strip non-alphanumeric so
 *  "M31", "M 31", and "messier 31" collapse toward comparable keys. */
function normalizeForAlias(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

function matches(doc: IndexDoc, queryLower: string): boolean {
  if (doc.searchKey.includes(queryLower)) return true;
  const qNorm = normalizeForAlias(queryLower);
  const qCompact = qNorm.replace(/\s+/g, '');
  for (const alias of doc.aliases) {
    if (alias.includes(queryLower)) return true;
    const aNorm = normalizeForAlias(alias);
    if (aNorm === qNorm) return true;
    if (aNorm.replace(/\s+/g, '') === qCompact) return true;
  }
  return false;
}

function rank(doc: IndexDoc, queryLower: string): number {
  // Prefix match on the main name is best; then name substring; then alias
  // prefix; then alias substring. Lower = better.
  if (doc.searchKey.startsWith(queryLower)) return 0;
  if (doc.searchKey.includes(queryLower)) return 1;
  const qCompact = queryLower.replace(/\s+/g, '');
  for (const alias of doc.aliases) {
    if (alias === queryLower || alias.replace(/\s+/g, '') === qCompact) return 2;
    if (alias.startsWith(queryLower)) return 3;
  }
  return 4;
}

function toAutocompleteItem(doc: IndexDoc, query: string): AutocompleteItem {
  const item: AutocompleteItem = {
    text: doc.text,
    ent_id: doc.ent_id,
    id: doc.id,
    category: doc.category,
    category_name: doc.category_name,
    highlight: highlight(doc.text, query),
    magnitude: doc.magnitude,
  };
  if (typeof doc.raDeg === 'number') item.ra = doc.raDeg;
  if (typeof doc.decDeg === 'number') item.dec = doc.decDeg;
  if (doc.distancePc !== undefined) item.distance_pc = doc.distancePc;
  return item;
}

/** Local autocomplete. Returns up to {@link limit} best matches. */
export function searchLocalAutocomplete(
  q: string,
  opts: { category?: number | null; limit?: number } = {},
): AutocompleteItem[] {
  const query = q.trim();
  if (query.length === 0) return [];
  const queryLower = query.toLowerCase();
  const limit = Math.max(1, Math.min(50, opts.limit ?? 10));
  const index = getLocalSearchIndex();

  const hits = index.filter((d) => matches(d, queryLower));
  if (opts.category != null) {
    for (let i = hits.length - 1; i >= 0; i--) {
      if (hits[i]!.category !== opts.category) hits.splice(i, 1);
    }
  }
  hits.sort((a, b) => {
    const ra = rank(a, queryLower);
    const rb = rank(b, queryLower);
    if (ra !== rb) return ra - rb;
    // When two entries tie on rank, prefer real sky objects over
    // constellation sky-directions. "Andromeda" → Andromeda Galaxy
    // before Andromeda constellation; "Virgo" → Virgo Cluster before
    // Virgo constellation.
    const aConst = a.category === 10 ? 1 : 0;
    const bConst = b.category === 10 ? 1 : 0;
    if (aConst !== bConst) return aConst - bConst;
    return a.searchKey.length - b.searchKey.length;
  });
  return hits.slice(0, limit).map((d) => toAutocompleteItem(d, query));
}

/** Local full-text search. Same shape as api/search.ts returns. */
export function searchLocalText(
  q: string,
  opts: { category?: number | null; limit?: number; offset?: number } = {},
): { items: TextSearchItem[]; total: number } {
  const query = q.trim();
  if (query.length === 0) return { items: [], total: 0 };
  const queryLower = query.toLowerCase();
  const limit = Math.max(1, Math.min(100, opts.limit ?? 20));
  const offset = Math.max(0, opts.offset ?? 0);

  const index = getLocalSearchIndex();
  const hits = index.filter((d) => matches(d, queryLower));
  if (opts.category != null) {
    for (let i = hits.length - 1; i >= 0; i--) {
      if (hits[i]!.category !== opts.category) hits.splice(i, 1);
    }
  }
  hits.sort((a, b) => {
    const ra = rank(a, queryLower);
    const rb = rank(b, queryLower);
    if (ra !== rb) return ra - rb;
    const aConst = a.category === 10 ? 1 : 0;
    const bConst = b.category === 10 ? 1 : 0;
    if (aConst !== bConst) return aConst - bConst;
    return a.searchKey.length - b.searchKey.length;
  });

  const total = hits.length;
  const slice = hits.slice(offset, offset + limit);
  const items: TextSearchItem[] = slice.map((d) => {
    const item: TextSearchItem = {
      id: d.id,
      ent_id: d.ent_id,
      name: d.text,
      category: d.category,
      category_name: d.category_name,
      type_name: d.category_name,
      magnitude_apparent: d.magnitude,
      _score: 1.0,
      _links: { self: `/entities/ent/${d.ent_id}` },
    };
    if (typeof d.raDeg === 'number') item.ra = d.raDeg;
    if (typeof d.decDeg === 'number') item.dec = d.decDeg;
    if (d.distancePc !== undefined) item.distance_pc = d.distancePc;
    return item;
  });
  return { items, total };
}
