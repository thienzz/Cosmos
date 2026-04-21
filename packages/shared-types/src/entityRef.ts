/**
 * EntityRef — catalog-native + surrogate dual identifier.
 *
 * Problem: T14–T38 assumed `entityId: number`, which is fine when every
 * object has a JPL NAIF id (solar system) but breaks with real catalogs:
 *   - Gaia DR3 source_id is u64 → overflows JS Number at 2^53.
 *   - NGC/Messier/Caldwell/IC are short strings (e.g. "M31", "NGC 224").
 *   - WDS components carry HJ-codes ("HJ 2139AB").
 *   - Cross-catalog entries (same physical object, many ids) need a stable
 *     client-side key without collapsing their provenance.
 *
 * This type (Doc 27 §5.2, T40 scope) pairs a catalog-native string `id`
 * with a u32 `surrogate` that acts as the in-memory Map/Set key. The
 * `surrogate` is minted once per entity in `EntityRefRegistry` and stays
 * stable across a session — safe to use in Zustand stores, render-loop
 * hot paths, and WebGL instance attributes (where we need a compact int).
 *
 * This file ships the type additively. Stores keep using `number` today;
 * callers that need multi-catalog IDs (search, tile streamer, WDS renderer)
 * can opt in without a coordinated refactor.
 */

/**
 * Catalog kinds we resolve across. Stable set — adding a new catalog is an
 * additive change (append to this union + teach the registry about its
 * string format).
 */
export type EntityRefKind =
  | 'naif' // JPL NAIF SPICE id (solar system)
  | 'gaia' // Gaia DR3 source_id (stringified — overflow-safe)
  | 'hipparcos'
  | 'tycho2'
  | 'hd' // Henry Draper
  | 'hr' // Bright Star / Yale
  | 'ngc'
  | 'ic'
  | 'messier'
  | 'caldwell'
  | 'sharpless'
  | 'barnard'
  | 'lbn'
  | 'ldn'
  | 'wds' // Washington Double Star
  | 'sb9' // 9th Spectroscopic Binary Orbit
  | 'gcvs' // General Catalogue of Variable Stars
  | 'pgc' // HyperLEDA Principal Galaxies
  | 'ugc'
  | 'sdss'
  | 'mpc' // Minor Planet Center
  | 'iau' // IAU-approved name (stars, planets, minor features)
  | 'bayer' // e.g. "alpha Orionis"
  | 'flamsteed' // e.g. "58 Orionis"
  | 'exoplanet' // NASA Exoplanet Archive name
  | 'psr' // ATNF pulsar
  | 'simbad' // SIMBAD identifier (fallback)
  | 'internal'; // Client-only surrogate entities (markers, UI overlays)

export interface EntityRef {
  readonly kind: EntityRefKind;
  /** Catalog-native identifier (preserved verbatim — string for overflow-safety). */
  readonly id: string;
  /**
   * Client-minted u32 used as the store/map/instance-attribute key. Stable
   * across a session; not meaningful outside the browser. Do NOT send this
   * back to the server — use `kind + id` as the wire key.
   */
  readonly surrogate: number;
}

/** NAIF convenience (covers every existing T14 call site). */
export function naifRef(naifId: number | string): EntityRef {
  const id = typeof naifId === 'number' ? String(naifId) : naifId;
  return entityRefRegistry.intern({ kind: 'naif', id });
}

/** Bayer/Flamsteed/IAU convenience — stars searched by name. */
export function nameRef(
  kind: 'iau' | 'bayer' | 'flamsteed',
  designation: string,
): EntityRef {
  return entityRefRegistry.intern({ kind, id: designation });
}

/**
 * Normalise catalog-native ids so "NGC 224", "ngc 224", "NGC0224" collapse
 * to the same surrogate. Catalog-specific — most simply upper-case + collapse
 * whitespace; NGC/IC zero-pad tolerated.
 */
function normaliseId(kind: EntityRefKind, raw: string): string {
  const trimmed = raw.trim();
  switch (kind) {
    case 'ngc':
    case 'ic':
    case 'messier':
    case 'caldwell':
    case 'pgc':
    case 'ugc': {
      // Upper-case, then ensure a single space between the letter prefix and
      // the numeric tail so "NGC0224", "NGC 224", and "ngc  0224" all collapse
      // to "NGC 224". Leading zeros in the number are stripped last.
      const upper = trimmed.toUpperCase().replace(/\s+/g, ' ');
      const spaced = upper.replace(/^([A-Z]+)\s*(\d)/, '$1 $2');
      return spaced.replace(/(\s)0+(\d)/g, '$1$2');
    }
    case 'hipparcos':
    case 'hd':
    case 'hr':
    case 'tycho2':
    case 'mpc':
    case 'sb9':
    case 'psr':
      return trimmed.toUpperCase().replace(/\s+/g, ' ');
    case 'gaia':
      // Gaia DR3 source_id — numeric string, strip any leading zeros.
      return trimmed.replace(/^0+/, '') || '0';
    default:
      return trimmed;
  }
}

/**
 * Global EntityRef registry — session-local interner that assigns a stable
 * u32 surrogate to each (kind, id) pair. Exposed as a singleton because the
 * whole point is surrogates being shareable across stores without plumbing.
 *
 * Reset semantics: `clear()` is only safe in tests (or if the whole scene
 * is torn down). Anything holding a surrogate from before clear() becomes
 * invalid — Three.js InstancedBufferAttributes, Zustand entries, etc.
 */
export class EntityRefRegistry {
  private readonly byKey = new Map<string, EntityRef>();
  private readonly bySurrogate = new Map<number, EntityRef>();
  private nextSurrogate = 1; // 0 reserved for "no selection"

  intern(partial: { kind: EntityRefKind; id: string }): EntityRef {
    const normalisedId = normaliseId(partial.kind, partial.id);
    const key = `${partial.kind}:${normalisedId}`;
    const existing = this.byKey.get(key);
    if (existing) return existing;

    const surrogate = this.nextSurrogate++;
    if (surrogate > 0xffff_ffff) {
      throw new Error('EntityRefRegistry surrogate space exhausted (u32 overflow)');
    }
    const ref: EntityRef = Object.freeze({
      kind: partial.kind,
      id: normalisedId,
      surrogate,
    });
    this.byKey.set(key, ref);
    this.bySurrogate.set(surrogate, ref);
    return ref;
  }

  /** Look up a ref by its surrogate. Returns `undefined` if not interned. */
  bySurrogateId(surrogate: number): EntityRef | undefined {
    return this.bySurrogate.get(surrogate);
  }

  /** Look up a ref by catalog-native (kind, id). */
  byCatalogId(kind: EntityRefKind, id: string): EntityRef | undefined {
    return this.byKey.get(`${kind}:${normaliseId(kind, id)}`);
  }

  /** Current number of interned refs. Useful for telemetry + tests. */
  size(): number {
    return this.byKey.size;
  }

  /** Test-only. Do NOT call at runtime — invalidates surrogates in flight. */
  clear(): void {
    this.byKey.clear();
    this.bySurrogate.clear();
    this.nextSurrogate = 1;
  }
}

/** Session-global singleton. */
export const entityRefRegistry = new EntityRefRegistry();

/**
 * Serialise for cross-worker / cross-store transport. The surrogate is NOT
 * stable across processes — receivers must re-intern via `entityRefRegistry`.
 */
export interface SerialisedEntityRef {
  readonly kind: EntityRefKind;
  readonly id: string;
}

export function serialise(ref: EntityRef): SerialisedEntityRef {
  return { kind: ref.kind, id: ref.id };
}

export function deserialise(
  payload: SerialisedEntityRef,
  registry: EntityRefRegistry = entityRefRegistry,
): EntityRef {
  return registry.intern(payload);
}

/** Equality on (kind, id) — surrogates are session-local so this is the
 *  correct comparison when refs might come from different registries. */
export function refsEqual(a: EntityRef | null, b: EntityRef | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.kind === b.kind && a.id === b.id;
}
