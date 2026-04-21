/**
 * Adapters between the backend wire types (Doc 26 §5 / §9) and the web
 * app's in-store {@link EntityData} shape.
 *
 * T15 baked the InfoPanel against a solar-system-centric payload built by
 * {@link bodyToEntity}. T18's HTTP client returns a richer, category-aware
 * `ApiEntity` (or the structured `ApiSolarSystemBody` from `/solar-system/
 * bodies/:id`). This module funnels both into the same `EntityData` keys
 * the panel already reads, so the UI stays unchanged.
 *
 * Kind resolution (Doc 24 §13.1 / Doc 17 §3):
 *   ApiEntity.category 1 → star
 *   ApiEntity.category 2 → rocky/gas planet (we collapse to 'planet')
 *   ApiEntity.category 4 → moon
 *   ApiEntity.category 7 → small body → asteroid
 *   everything else     → 'star' (display only — the renderer owns its mesh)
 */

import type { ObjectType } from '@cosmos/shared-types';

import type {
  ApiEntity,
  ApiEntityCategory,
  ApiKeplerianElements,
  ApiPhysicalProperties,
  ApiSolarSystemBody,
  ApiSolarSystemBodyType,
} from '@/api/types';
import type { EntityData, EntityPreview } from '@/stores/types';

import {
  KIND_ACCENT_COLOR,
  KIND_ICON,
  KIND_LABEL,
  entIdForBody,
} from './bodyToEntity';
import { bodyById, type BodyKind, type SolarSystemBody } from './solarSystemCatalog';

const AU_KM = 149_597_870.7;

const CATEGORY_TO_OBJECT_TYPE: Record<ApiEntityCategory, ObjectType> = {
  1: 'star',
  2: 'planet',
  3: 'planet', // gas giants
  4: 'moon',
  5: 'nebula',
  6: 'galaxy',
  7: 'asteroid',
  8: 'galaxy', // large-scale structure — fall back for colouring
  9: 'star',   // exotic — ditto
};

const BODY_TYPE_TO_KIND: Record<ApiSolarSystemBodyType, BodyKind> = {
  planet: 'planet',
  dwarf_planet: 'dwarf_planet',
  moon: 'moon',
  asteroid: 'asteroid',
  comet: 'asteroid',
};

function kindForApiEntity(entity: ApiEntity): BodyKind {
  switch (entity.category) {
    case 1:
      return 'star';
    case 2:
    case 3:
      return 'planet';
    case 4:
      return 'moon';
    case 7:
      return 'asteroid';
    default:
      return 'star';
  }
}

function resolveParentName(parentNaifId: number | null | undefined): string | null {
  if (parentNaifId === null || parentNaifId === undefined || parentNaifId < 0) {
    return null;
  }
  return bodyById(parentNaifId)?.name ?? null;
}

// ---------------------------------------------------------------------------
// ApiSolarSystemBody → EntityData
// ---------------------------------------------------------------------------

/**
 * Solar-system-specialised mapping. Uses the structured Keplerian + physical
 * fields directly; no guessing from `properties`.
 */
export function apiSolarSystemBodyToEntityData(
  body: ApiSolarSystemBody,
): EntityData {
  const kind = BODY_TYPE_TO_KIND[body.type];
  const parentName = resolveParentName(body.parent_naif_id);
  const el: ApiKeplerianElements = body.orbital_elements;
  const phys: ApiPhysicalProperties = body.physical;
  const isMoonLike = kind === 'moon';

  const semiMajor_km = el.a * AU_KM;
  const semiMajor_display = isMoonLike ? semiMajor_km : el.a;
  const unit = isMoonLike ? 'km' : 'AU';

  return {
    id: body.naif_id,
    ent_id: body.ent_id,
    object_type: kindToObjectType(kind),
    name: body.name,
    payload: {
      kind,
      kindLabel: KIND_LABEL[kind],
      parentName,
      parentNaifId: body.parent_naif_id,
      renderAs: null,
      radius_km: phys.radius_km,
      obliquity_deg: phys.obliquity_deg ?? null,
      hasRings: body.rings !== null,
      semiMajorAxis_km: semiMajor_km,
      semiMajorAxis_display: semiMajor_display,
      semiMajorAxis_unit: unit,
      eccentricity: el.e,
      inclination_deg: el.i,
      periodDays: el.P ?? 0,
      isRetrograde: el.i > 90,
      accentColor: KIND_ACCENT_COLOR[kind],
      icon: KIND_ICON[kind],
      source: 'api:solar-system',
    },
  };
}

// ---------------------------------------------------------------------------
// ApiEntity → EntityData
// ---------------------------------------------------------------------------

/**
 * Generic mapper. For a solar-system body we'd rather call
 * {@link apiSolarSystemBodyToEntityData}; this is the fallback when the panel
 * was opened from a search result or a star click.
 */
export function apiEntityToEntityData(entity: ApiEntity): EntityData {
  const kind = kindForApiEntity(entity);
  const props = entity.properties ?? {};
  const radius_km = typeof props.radius_km === 'number' ? props.radius_km : undefined;
  const distance_pc = entity.position?.distance_pc;
  const distance_display = distance_pc !== undefined ? distance_pc : undefined;
  const parent_naif_id =
    typeof props.parent_naif_id === 'number' ? (props.parent_naif_id as number) : null;

  return {
    id: entity.id,
    ent_id: entity.ent_id,
    object_type: CATEGORY_TO_OBJECT_TYPE[entity.category] ?? kindToObjectType(kind),
    name: entity.name,
    payload: {
      kind,
      kindLabel: entity.type_name || KIND_LABEL[kind],
      parentName: resolveParentName(parent_naif_id),
      parentNaifId: parent_naif_id,
      renderAs: null,
      radius_km,
      obliquity_deg: typeof props.obliquity_deg === 'number' ? props.obliquity_deg : null,
      hasRings: props.has_rings === true,
      semiMajorAxis_km:
        typeof props.semi_major_axis_au === 'number'
          ? (props.semi_major_axis_au as number) * AU_KM
          : undefined,
      semiMajorAxis_display:
        typeof props.semi_major_axis_au === 'number'
          ? (props.semi_major_axis_au as number)
          : distance_display,
      semiMajorAxis_unit:
        typeof props.semi_major_axis_au === 'number'
          ? 'AU'
          : distance_pc !== undefined
            ? 'pc'
            : 'AU',
      eccentricity: typeof props.eccentricity === 'number' ? props.eccentricity : undefined,
      inclination_deg:
        typeof props.inclination_deg === 'number' ? props.inclination_deg : undefined,
      periodDays: typeof props.period_days === 'number' ? props.period_days : undefined,
      isRetrograde: props.is_retrograde === true,
      accentColor: KIND_ACCENT_COLOR[kind],
      icon: KIND_ICON[kind],
      source: 'api:entity',
      // Star-specific extras (left undefined for non-stars; InfoPanel ignores
      // unknown keys, so this is forward-compatible for T19 onward).
      spectral_type: props.spectral_type,
      temperature_k: props.temperature_k,
      magnitude_apparent: props.magnitude_apparent,
      constellation: props.constellation,
      // T51 — lift the full ApiCatalogIds into the payload so the S-3.1
      // InfoPanel can render the Cross-IDs section without re-fetching.
      // Also keep the type_name + aliases around for the Identification +
      // Tags sections.
      catalog_ids: entity.catalog_ids,
      type_name: entity.type_name,
      category: entity.category,
      category_name: entity.category_name,
      aliases: entity.aliases,
      ra_deg: entity.position?.ra,
      dec_deg: entity.position?.dec,
      distance_pc: entity.position?.distance_pc,
    },
  };
}

export function apiEntityToEntityPreview(entity: ApiEntity): EntityPreview {
  const kind = kindForApiEntity(entity);
  const distance_pc = entity.position?.distance_pc;
  return {
    id: entity.id,
    name: entity.name,
    object_type: CATEGORY_TO_OBJECT_TYPE[entity.category] ?? kindToObjectType(kind),
    ...(typeof distance_pc === 'number' ? { distance: distance_pc } : {}),
    ...(typeof (entity.properties?.magnitude_apparent as number | undefined) === 'number'
      ? { magnitude: entity.properties.magnitude_apparent as number }
      : {}),
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function kindToObjectType(kind: BodyKind): ObjectType {
  switch (kind) {
    case 'star':
      return 'star';
    case 'planet':
    case 'dwarf_planet':
      return 'planet';
    case 'moon':
      return 'moon';
    case 'asteroid':
    case 'kbo':
      return 'asteroid';
    default:
      return 'star';
  }
}

/**
 * Back-reference: given a catalog body (or its NAIF id), spell out the same
 * `ent_id` the server would mint. Used by the upgrade path to detect "server
 * answered the same body we synthesised, no UI flicker needed".
 */
export function entIdForNaifId(naifId: number): string | null {
  const body = bodyById(naifId) as SolarSystemBody | undefined;
  return body ? entIdForBody(body) : null;
}
