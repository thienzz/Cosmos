/**
 * T52 — resolve a selected entity's instance-level ENT-ID (e.g. `ENT-2599`
 * for Jupiter's NAIF body 599) to the type-level ENT-ID used by Doc 22
 * (e.g. `ENT-2020` for "Jupiter-Type").
 *
 * Doc 22 catalogues toggle features per entity *type*, not per instance —
 * all Jupiter-type gas giants share the "Great Red Spot" toggle. This
 * resolver lets the UI look up the right spec without teaching every
 * renderer about Doc 22 type IDs.
 *
 * Unknown instance IDs fall back to returning the input verbatim — if the
 * caller already passes a Doc 22 type ID (e.g. from tour/bookmark data),
 * it still resolves correctly.
 */

/** NAIF-derived instance ENT-ID → Doc 22 type ENT-ID. */
const INSTANCE_TO_TYPE: Readonly<Record<string, string>> = {
  // Star — Sun NAIF 10 → ENT-1010 → Doc 22 G-Type (Sun-like)
  'ENT-1010': 'ENT-1007',

  // Planets (NAIF barycenters use tens, bodies use 199/299/399/...).
  'ENT-2199': 'ENT-2010', // Mercury → Mercury-Type
  'ENT-2299': 'ENT-2011', // Venus → Venus-Type
  'ENT-2399': 'ENT-2043', // Earth → Earth-Type Habitable Planet
  'ENT-2499': 'ENT-2013', // Mars → Mars-Type
  'ENT-2599': 'ENT-2020', // Jupiter → Jupiter-Type
  'ENT-2699': 'ENT-2021', // Saturn → Saturn-Type
  'ENT-2799': 'ENT-2022', // Uranus → Uranus-Type (Ice Giant)
  'ENT-2899': 'ENT-2023', // Neptune → Neptune-Type (Ice Giant)

  // Major moons covered by Doc 22.
  'ENT-3301': 'ENT-3001', // Luna NAIF 301
  'ENT-3501': 'ENT-3010', // Io NAIF 501
  'ENT-3502': 'ENT-3011', // Europa NAIF 502
  'ENT-3503': 'ENT-3012', // Ganymede NAIF 503 → Ganymede (Magnetic Moon)
  'ENT-3606': 'ENT-3020', // Titan NAIF 606
  'ENT-3602': 'ENT-3021', // Enceladus NAIF 602
};

export function doc22TypeIdFor(instanceEntId: string | null | undefined): string | null {
  if (!instanceEntId) return null;
  const mapped = INSTANCE_TO_TYPE[instanceEntId];
  if (mapped) return mapped;
  // Fallback: the caller may already have a Doc 22 type ID (e.g. ENT-2020).
  // Doc 22 IDs are always 4-digit ENT-[1-8][0-9]{3}. Return the raw input so
  // the toggle panel can attempt a direct lookup and hide itself on miss.
  if (/^ENT-\d{4}$/.test(instanceEntId)) return instanceEntId;
  return null;
}
