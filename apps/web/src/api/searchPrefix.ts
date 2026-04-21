/**
 * Catalog prefix parser (T51, Doc 26 §5.3 + §6.1).
 *
 * Recognises queries like `"HD 48915"`, `"Messier 31"`, `"NGC 224"`,
 * `"HIP 32349"`, `"Gaia DR3 5072708048013507072"`, `"M42"`, `"IC 10"` and
 * returns a `{ catalog, id }` pair the client can hand to
 * `getEntityByCatalog()` for a definitive lookup instead of a fuzzy
 * full-text search.
 *
 * Parser is DELIBERATELY CONSERVATIVE: when a query doesn't match a known
 * pattern (e.g. `"α CMa"`, `"Dog Star"`, `"Kepler-452 b"`) we return `null`
 * and let the regular `/search` text endpoint handle it. The server's alias
 * index is authoritative for anything the client can't parse.
 */

/** Catalog keys accepted by `GET /entities/catalog/{catalog}/{id}`. */
export type CatalogKey =
  | 'messier'
  | 'ngc'
  | 'ic'
  | 'hip'
  | 'gaia'
  | 'hd'
  | 'sao'
  | 'tycho2'
  | 'sdss'
  | 'mpc'
  | 'caldwell';

export interface ParsedSearchPrefix {
  catalog: CatalogKey;
  /** Raw identifier — already canonicalised (leading zeros stripped,
   *  whitespace collapsed). The server expects the form it indexed:
   *  Messier as `"M42"`, NGC as `"NGC1976"`, Hipparcos as a bare integer.
   *  Callers should not second-guess it — pass straight through. */
  id: string;
}

/**
 * Pattern table. Ordered by specificity — the first match wins, so more
 * specific prefixes (`Gaia DR3 …`, `Tycho 2 …`) appear before shorter
 * prefixes they might share a leading substring with.
 *
 * Each pattern captures a numeric / alphanumeric ID in group 1. The
 * `canonicalise` hook adapts it to the path format the server indexes.
 */
interface PrefixPattern {
  catalog: CatalogKey;
  /** Must use `^` / `$` anchors. Case-insensitive; unicode-aware. */
  regex: RegExp;
  canonicalise: (match: RegExpMatchArray) => string;
}

const PATTERNS: readonly PrefixPattern[] = [
  // Gaia DR3 / DR2 — "Gaia DR3 5072708048013507072" or "Gaia 5072708…".
  {
    catalog: 'gaia',
    regex: /^\s*gaia(?:\s+dr\d)?\s+(\d{5,20})\s*$/i,
    canonicalise: (m) => m[1] ?? '',
  },
  // Tycho-2 — "TYC 5949-2777-1" or "Tycho 5949-2777-1".
  {
    catalog: 'tycho2',
    regex: /^\s*(?:tyc(?:ho)?2?)\s+(\d{1,5}-\d{1,5}-\d{1,2})\s*$/i,
    canonicalise: (m) => `TYC ${m[1] ?? ''}`,
  },
  // SDSS — "SDSS J103027.10+052455.0" (spectroscopic-style).
  {
    catalog: 'sdss',
    regex: /^\s*sdss\s+(j\d{6}(?:\.\d+)?[+-]\d{6}(?:\.\d+)?)\s*$/i,
    canonicalise: (m) => (m[1] ?? '').toUpperCase(),
  },
  // Messier — "Messier 31", "M 31", "M31".
  {
    catalog: 'messier',
    regex: /^\s*(?:messier|m)\s*0*(\d{1,3})\s*$/i,
    canonicalise: (m) => `M${m[1] ?? ''}`,
  },
  // Caldwell — "Caldwell 14", "C 14".
  {
    catalog: 'caldwell',
    regex: /^\s*(?:caldwell|c)\s*0*(\d{1,3})\s*$/i,
    canonicalise: (m) => `C${m[1] ?? ''}`,
  },
  // NGC — "NGC 224", "NGC224".
  {
    catalog: 'ngc',
    regex: /^\s*ngc\s*0*(\d{1,5})\s*$/i,
    canonicalise: (m) => `NGC${m[1] ?? ''}`,
  },
  // IC — "IC 10", "IC10".
  {
    catalog: 'ic',
    regex: /^\s*ic\s*0*(\d{1,5})\s*$/i,
    canonicalise: (m) => `IC${m[1] ?? ''}`,
  },
  // Henry Draper — "HD 48915", "HD48915".
  {
    catalog: 'hd',
    regex: /^\s*hd\s*0*(\d{1,6})\s*$/i,
    canonicalise: (m) => m[1] ?? '',
  },
  // Hipparcos — "HIP 32349", "Hipparcos 32349".
  {
    catalog: 'hip',
    regex: /^\s*(?:hip(?:parcos)?)\s*0*(\d{1,6})\s*$/i,
    canonicalise: (m) => m[1] ?? '',
  },
  // Smithsonian Astrophysical Observatory — "SAO 151881".
  {
    catalog: 'sao',
    regex: /^\s*sao\s*0*(\d{1,6})\s*$/i,
    canonicalise: (m) => m[1] ?? '',
  },
  // Minor Planet Center — "MPC 2020 AV2" (provisional) or "MPC 433".
  {
    catalog: 'mpc',
    regex: /^\s*mpc\s+([\w\s-]{1,20})\s*$/i,
    canonicalise: (m) => (m[1] ?? '').trim(),
  },
];

/**
 * Parse a query into a catalog + id pair, or return `null` if the query
 * doesn't look like any recognised catalog prefix.
 *
 * Not every "prefix-looking" query should be routed through
 * `/entities/catalog/…` — e.g. `"M"` alone is too ambiguous (could be a
 * Bayer designation, a Messier prefix, or a partial name). We require at
 * least one numeric / alphanumeric ID captured.
 */
export function parseSearchPrefix(query: string): ParsedSearchPrefix | null {
  if (!query || typeof query !== 'string') return null;
  const trimmed = query.trim();
  if (trimmed.length === 0) return null;

  for (const pattern of PATTERNS) {
    const match = trimmed.match(pattern.regex);
    if (!match) continue;
    const id = pattern.canonicalise(match);
    if (id.length === 0) continue;
    return { catalog: pattern.catalog, id };
  }

  return null;
}

/**
 * Pretty-print the parsed prefix — useful for the search dropdown's
 * "interpreted as …" hint, and for tests.
 */
export function formatPrefix(parsed: ParsedSearchPrefix): string {
  return `${parsed.catalog.toUpperCase()}: ${parsed.id}`;
}
