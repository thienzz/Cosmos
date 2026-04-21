/**
 * P2C — Exotic-object seed catalog (Doc 17 §8010..8040).
 *
 * Covers the three {@link ExoticKind} shaders — black hole, pulsar,
 * magnetar — with well-known real objects at their ICRS J2000.0 positions.
 * Distances follow SIMBAD / NED consensus values; the Sgr A* and M87*
 * entries match the Event Horizon Telescope 2019/2022 papers.
 *
 * The full-ingest pipeline (ATNF Pulsar catalogue 3,600+; GCN + GRB
 * catalogues; stellar-mass BH population synthesis) lives in the tile
 * server. This file is the "showpiece" subset rendered by
 * {@link ExoticGalleryRenderer} in catalog mode.
 */

import type { ExoticKind } from '@/utils/exoticPalette';

export interface ExoticCatalogEntry {
  /** Stable internal id. */
  id: string;
  /** Common name. */
  name: string;
  /** ExoticKind driving the shader. */
  kind: ExoticKind;
  /** ICRS J2000.0 right ascension (degrees). */
  ra_deg: number;
  /** ICRS J2000.0 declination (degrees). */
  dec_deg: number;
  /** Distance from the Sun (parsecs). */
  distance_pc: number;
  /** Optional apparent magnitude (V-band). Most compact objects have no
   *  optical counterpart; left undefined for BH, pulsar, magnetar entries. */
  magnitude?: number;
  /** Common aliases for search. */
  aliases?: string[];
  /** One-line description. */
  description?: string;
}

/**
 * Showpiece subset. Ordered by kind (BH → pulsar → magnetar) so a
 * full-catalog render walks the Doc 17 taxonomy top-to-bottom.
 */
export const EXOTIC_CATALOG: ExoticCatalogEntry[] = [
  // ---- Black holes (ENT-8010) ---------------------------------------------
  {
    id: 'sgr-a-star',
    name: 'Sagittarius A*',
    kind: 'blackhole',
    ra_deg: 266.4168,
    dec_deg: -29.0078,
    distance_pc: 8178, // 8.178 kpc (Gravity Collaboration 2019)
    aliases: ['Sgr A*', 'SgrA*', 'Galactic Centre'],
    description: 'Supermassive black hole at the centre of the Milky Way (~4.3×10⁶ M☉).',
  },
  {
    id: 'm87-star',
    name: 'M87*',
    kind: 'blackhole',
    ra_deg: 187.7059,
    dec_deg: 12.3911,
    distance_pc: 16_800_000, // 16.8 Mpc (EHT 2019)
    aliases: ['Pōwehi', 'Virgo A BH', 'NGC 4486 BH'],
    description: 'Supermassive black hole in M87, imaged by the Event Horizon Telescope in 2019.',
  },
  {
    id: 'cygnus-x-1',
    name: 'Cygnus X-1',
    kind: 'blackhole',
    ra_deg: 299.5903,
    dec_deg: 35.2016,
    distance_pc: 2220, // 2.22 kpc (Miller-Jones 2021)
    magnitude: 8.95,
    aliases: ['HDE 226868', 'Cyg X-1'],
    description: 'First widely-accepted stellar-mass black hole (~21 M☉), discovered 1964.',
  },
  {
    id: 'v404-cyg',
    name: 'V404 Cygni',
    kind: 'blackhole',
    ra_deg: 306.0158,
    dec_deg: 33.8672,
    distance_pc: 2390, // 2.39 kpc (Miller-Jones 2009)
    magnitude: 18.4,
    aliases: ['GS 2023+338'],
    description: 'X-ray binary with a ~9 M☉ stellar black hole primary.',
  },

  // ---- Pulsars (ENT-8020) -------------------------------------------------
  {
    id: 'crab-pulsar',
    name: 'Crab Pulsar',
    kind: 'pulsar',
    ra_deg: 83.633,
    dec_deg: 22.0145,
    distance_pc: 2000, // 2.0 kpc
    aliases: ['PSR B0531+21', 'PSR J0534+2200'],
    description: 'Young pulsar (33 ms) at the heart of the Crab Nebula, SN 1054 remnant.',
  },
  {
    id: 'vela-pulsar',
    name: 'Vela Pulsar',
    kind: 'pulsar',
    ra_deg: 128.8363,
    dec_deg: -45.1764,
    distance_pc: 287, // 287 pc (Dodson 2003)
    aliases: ['PSR B0833-45', 'PSR J0835-4510'],
    description: 'Bright Vela supernova-remnant pulsar (89 ms).',
  },
  {
    id: 'psr-b1919',
    name: 'PSR B1919+21',
    kind: 'pulsar',
    ra_deg: 290.3000,
    dec_deg: 21.8830,
    distance_pc: 1000,
    aliases: ['CP 1919'],
    description: 'First pulsar ever detected (Hewish + Bell 1967).',
  },
  {
    id: 'psr-j0437',
    name: 'PSR J0437-4715',
    kind: 'pulsar',
    ra_deg: 69.3158,
    dec_deg: -47.2525,
    distance_pc: 156.8, // 156.8 pc (Reardon 2016)
    aliases: ['PSR B0437-47'],
    description: 'Nearest known millisecond pulsar (5.76 ms).',
  },

  // ---- Magnetars (ENT-8030) -----------------------------------------------
  {
    id: 'sgr-1806-20',
    name: 'SGR 1806-20',
    kind: 'magnetar',
    ra_deg: 272.1630,
    dec_deg: -20.4111,
    distance_pc: 8700, // 8.7 kpc
    aliases: ['SGR J1806-20'],
    description: 'Magnetar famous for the 2004-12-27 giant flare (10⁴⁶ erg in 0.2 s).',
  },
  {
    id: 'sgr-0418',
    name: 'SGR 0418+5729',
    kind: 'magnetar',
    ra_deg: 64.7117,
    dec_deg: 57.4916,
    distance_pc: 2000, // 2 kpc
    description: 'Low-magnetic-field magnetar, quiescent source with sporadic outbursts.',
  },
  {
    id: 'magnetar-1e-1048',
    name: '1E 1048.1-5937',
    kind: 'magnetar',
    ra_deg: 162.3600,
    dec_deg: -59.8833,
    distance_pc: 9000, // 9 kpc
    description: 'Anomalous X-ray pulsar (AXP), confirmed magnetar in Carina.',
  },
  // ---- Phase 3 additions (P2G) — canonical exotic objects ------------------
  // Famous stellar-mass black holes, pulsars, and the first LIGO merger
  // remnant. Positions from SIMBAD; distances from standard catalogue refs.
  {
    id: 'gw150914',
    name: 'GW150914 Merger Remnant',
    kind: 'blackhole',
    ra_deg: 112.5,
    dec_deg: -70.0, // southern-hemisphere localization (440 Mpc sky region)
    distance_pc: 440_000_000, // 440 Mpc, LIGO/Virgo 2016
    aliases: ['GW150914', 'First LIGO Detection'],
    description: 'Post-merger ~62 M☉ black hole from the first LIGO detection (2015-09-14).',
  },
  {
    id: 'geminga',
    name: 'Geminga',
    kind: 'pulsar',
    ra_deg: 98.4756,
    dec_deg: 17.7700,
    distance_pc: 250, // 250 pc (Faherty 2007)
    aliases: ['PSR B0633+17', 'PSR J0633+1746'],
    description: 'Nearby γ-ray-loud, radio-quiet pulsar (237 ms period, age ~340 kyr).',
  },
  {
    id: 'psr-b1937',
    name: 'PSR B1937+21',
    kind: 'pulsar',
    ra_deg: 294.9108,
    dec_deg: 21.5830,
    distance_pc: 3500, // 3.5 kpc
    aliases: ['PSR B1937+21', 'PSR J1939+2134'],
    description: 'First millisecond pulsar ever discovered (1982, 1.558 ms period).',
  },
  {
    id: 'psr-j0740',
    name: 'PSR J0740+6620',
    kind: 'pulsar',
    ra_deg: 115.1917,
    dec_deg: 66.3417,
    distance_pc: 1140, // 1.14 kpc (Fonseca 2021)
    aliases: ['PSR J0740+6620'],
    description: 'Most massive precisely-measured neutron star (2.08 ±0.07 M☉).',
  },
  {
    id: 'gro-j1655',
    name: 'GRO J1655-40',
    kind: 'blackhole',
    ra_deg: 253.5000,
    dec_deg: -39.8458,
    distance_pc: 3200, // 3.2 kpc (Hjellming 1995)
    magnitude: 14.2,
    aliases: ['GRO J1655-40', 'Nova Scorpii 1994', 'V1033 Sco'],
    description: 'Microquasar with superluminal jets, ~6 M☉ black hole primary.',
  },
  {
    id: 'lmc-x-3',
    name: 'LMC X-3',
    kind: 'blackhole',
    ra_deg: 84.7358,
    dec_deg: -64.0839,
    distance_pc: 50_000, // 50 kpc (in the LMC)
    aliases: ['LMC X-3'],
    description: 'Persistent soft-state black hole binary in the Large Magellanic Cloud.',
  },
  {
    id: 'ic10-x1',
    name: 'IC 10 X-1',
    kind: 'blackhole',
    ra_deg: 5.0963,
    dec_deg: 59.2928,
    distance_pc: 790_000, // 790 kpc (in IC 10)
    aliases: ['IC 10 X-1'],
    description: 'Wolf-Rayet + ~30 M☉ BH binary in the starburst galaxy IC 10.',
  },
];
