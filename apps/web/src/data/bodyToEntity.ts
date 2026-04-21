/**
 * Convert a catalog {@link SolarSystemBody} into the store's generic
 * {@link EntityData} / {@link EntityPreview} shape — the same shape the real
 * `GET /entities/{id}` endpoint will return once T18 lands the HTTP client.
 *
 * T15 needs this because ray-cast picking resolves a `naifId`, but the
 * selection store and info panel speak in {@link EntityData}. Until the
 * backend is wired, we synthesise the payload from catalog data — every
 * field listed here comes from Doc 23 §8 / Doc 17 / Doc 18.
 *
 * The ENT ID mapping follows Doc 24 §13.1:
 *   Stars   → ENT-1xxx
 *   Planets → ENT-2xxx
 *   Moons   → ENT-3xxx
 *   Small bodies (asteroid/KBO) → ENT-4xxx
 * We append the last three digits of the NAIF id so the mapping is
 * deterministic and unique within a category.
 */

import type { ObjectType } from '@cosmos/shared-types';

import type { EntityData, EntityPreview } from '@/stores/types';

import { namedCometById } from './namedComets';
import {
  SMALL_BODY_SUBTYPE_ENT_ID,
  SMALL_BODY_SUBTYPE_LABEL,
  proceduralBodyByNaif,
  type SmallBodySubtype,
} from './proceduralMinorBodies';
import {
  bodyById,
  type BodyKind,
  type SolarSystemBody,
} from './solarSystemCatalog';

const KIND_TO_OBJECT_TYPE: Record<BodyKind, ObjectType> = {
  star: 'star',
  planet: 'planet',
  dwarf_planet: 'planet',
  moon: 'moon',
  asteroid: 'asteroid',
  kbo: 'asteroid',
  comet: 'asteroid',
  trojan: 'asteroid',
};

const KIND_TO_ENT_PREFIX: Record<BodyKind, number> = {
  star: 1000,
  planet: 2000,
  dwarf_planet: 2000,
  moon: 3000,
  asteroid: 4000,
  kbo: 4000,
  comet: 4000,
  trojan: 4000,
};

/**
 * Doc 24 §13.1 category accent colours. The info panel uses these for the
 * name-glow and type-badge tint so each entity kind reads at a glance.
 */
export const KIND_ACCENT_COLOR: Record<BodyKind, string> = {
  star: '#fbbf24',          // amber
  planet: '#00e5ff',        // cyan
  dwarf_planet: '#c084fc',  // purple
  moon: '#4ade80',          // green
  asteroid: '#fb923c',      // orange
  kbo: '#fb923c',           // orange
  comet: '#67e8f9',         // pale cyan — coma colour cue
  trojan: '#fbbf24',        // amber, distinct from main belt
};

/** Doc 24 §13.1 glyph per category. */
export const KIND_ICON: Record<BodyKind, string> = {
  star: '◎',
  planet: '⬡',
  dwarf_planet: '⬡',
  moon: '⊕',
  asteroid: '◉',
  kbo: '◉',
  comet: '☄',
  trojan: '◉',
};

export const KIND_LABEL: Record<BodyKind, string> = {
  star: 'Star',
  planet: 'Planet',
  dwarf_planet: 'Dwarf Planet',
  moon: 'Moon',
  asteroid: 'Asteroid',
  kbo: 'Kuiper Belt Object',
  comet: 'Comet',
  trojan: 'Jupiter Trojan',
};

export function entIdForBody(body: SolarSystemBody): string {
  // T44 — when the body is a small-body with a known Doc 17 subtype
  // (ENT-4010..4060) we emit that canonical ENT-ID rather than the
  // NAIF-derived fallback so the InfoPanel + search autocomplete route
  // the user to the right catalog page.
  const subtype = subtypeForBody(body);
  if (subtype) return SMALL_BODY_SUBTYPE_ENT_ID[subtype];
  const prefix = KIND_TO_ENT_PREFIX[body.kind];
  const suffix = (Math.abs(body.naifId) % 1000).toString().padStart(3, '0');
  return `ENT-${prefix + Number(suffix)}`;
}

/**
 * Resolve the Doc 17 small-body subtype for a body, or `null` if the
 * body is not a small body (or is an unclassified one, e.g. a named
 * asteroid that doesn't yet have a tagged subtype). Named comets carry
 * their subtype explicitly; procedural cloud particles live in the
 * typed-array store.
 */
export function subtypeForBody(body: SolarSystemBody): SmallBodySubtype | null {
  const named = namedCometById(body.naifId);
  if (named) return named.subtype;
  const procedural = proceduralBodyByNaif(body.naifId);
  if (procedural) return procedural.subtype;
  return null;
}

/** Parent human-readable name — "Sun" for Sun (parent=-1), otherwise resolved. */
function parentNameOf(body: SolarSystemBody): string | null {
  if (body.parentNaifId < 0) return null;
  return bodyById(body.parentNaifId)?.name ?? null;
}

/**
 * AU conversion for display. Catalog stores km — panel shows AU for orbits
 * around the Sun, parent-radii for moons (Luna at 60 Earth radii feels
 * more intuitive than 384,400 km).
 */
const AU_KM = 149_597_870.7;

export function toEntityData(body: SolarSystemBody): EntityData {
  const parentName = parentNameOf(body);
  const el = body.orbit;
  const isSatellite = body.kind === 'moon' || body.kind === 'dwarf_planet';
  const distanceUnits = isSatellite && body.kind === 'moon' ? 'km' : 'AU';
  const distanceValue =
    body.kind === 'moon' ? el.a_km : el.a_km / AU_KM;

  // T44 — prefer the Doc 17 subtype label when the body is classified.
  const subtype = subtypeForBody(body);
  const kindLabel = subtype ? SMALL_BODY_SUBTYPE_LABEL[subtype] : KIND_LABEL[body.kind];

  return {
    id: body.naifId,
    ent_id: entIdForBody(body),
    object_type: KIND_TO_OBJECT_TYPE[body.kind],
    name: body.name,
    payload: {
      kind: body.kind,
      kindLabel,
      subtype,
      parentName,
      parentNaifId: body.parentNaifId,
      renderAs: body.renderAs ?? null,
      radius_km: body.radius_km,
      obliquity_deg: body.obliquity_deg ?? null,
      hasRings: body.hasRings ?? false,
      // Orbital
      semiMajorAxis_km: el.a_km,
      semiMajorAxis_display: distanceValue,
      semiMajorAxis_unit: distanceUnits,
      eccentricity: el.e,
      inclination_deg: el.i_deg,
      periodDays: el.periodDays,
      isRetrograde: el.i_deg > 90 || el.periodDays < 0,
      // Presentation hints (Doc 24 §13.1)
      accentColor: KIND_ACCENT_COLOR[body.kind],
      icon: KIND_ICON[body.kind],
    },
  };
}

export function toEntityPreview(body: SolarSystemBody): EntityPreview {
  return {
    id: body.naifId,
    name: body.name,
    object_type: KIND_TO_OBJECT_TYPE[body.kind],
    distance: body.orbit.a_km / AU_KM,
  };
}

/** Convenience for picking: find body then synthesise EntityData. */
export function entityDataByNaif(naifId: number): EntityData | null {
  const body = bodyById(naifId);
  return body ? toEntityData(body) : null;
}

export function entityPreviewByNaif(naifId: number): EntityPreview | null {
  const body = bodyById(naifId);
  return body ? toEntityPreview(body) : null;
}
