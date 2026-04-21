/**
 * Curated prose descriptions for the S-3.1 Full InfoPanel (T51, Doc 24 §6,
 * Doc 33 §8.3 manual-review pool).
 *
 * Seed of the most-searched entities across the four demo journeys (First
 * Contact, Educator, Observer, Research). Keyed by canonical catalog name
 * (IAU name for stars, Messier/NGC/IC number for deep-sky, NAIF-derived
 * name for solar-system bodies) AND by common aliases so `"Sirius"`,
 * `"Dog Star"`, and `"Alpha Canis Majoris"` all hit the same entry.
 *
 * Not exhaustive — the task calls for ~500 descriptions eventually. This
 * file ships the top ~30 and leaves the rest to follow-up CMS work.
 */

export interface EntityDescription {
  /** 1–3 sentence prose paragraph. Kept short so the panel stays legible. */
  summary: string;
  /** Optional NASA / ESA image credit for a future thumbnail attachment. */
  imageCredit?: string;
}

const ENTRIES: Record<string, EntityDescription> = {
  // --- Named stars (IAU WGSN) -------------------------------------------
  sirius: {
    summary:
      'Brightest star in the night sky (apparent mag −1.46). A hot A1V main-sequence star 8.6 ly away, paired with white-dwarf companion Sirius B.',
  },
  vega: {
    summary:
      'Zeroth-magnitude A0V star 25 ly away — the historical photometric standard and former Pole Star (c. 12,000 BCE). Hosts a debris disc detected by IRAS.',
  },
  arcturus: {
    summary:
      'Brightest star north of the celestial equator; a red giant (K1.5III) 37 ly away, drifting toward us at 5 km/s.',
  },
  betelgeuse: {
    summary:
      'Red supergiant in Orion, ~700 ly away. One of the largest stars visible to the naked eye — if placed at the Sun its surface would reach beyond Jupiter. Brightness fluctuates on ~400-day cycles; a supernova is expected within ~100,000 years.',
  },
  rigel: {
    summary:
      'Blue supergiant B8Ia in Orion, ~860 ly away. Shines with ~120,000× the Sun\u2019s luminosity — the most intrinsically luminous star in its vicinity.',
  },
  polaris: {
    summary:
      'Current Northern Pole Star within 0.66° of the celestial north pole. A Cepheid-variable yellow supergiant ~433 ly away, in a triple system.',
  },
  antares: {
    summary:
      'Red supergiant α Sco, a variable M1.5Iab-Ib star ~550 ly away. Diameter ~700× the Sun\u2019s — visible as the reddish "heart" of Scorpius.',
  },
  aldebaran: {
    summary:
      'α Tau, an orange-giant K5III 65 ly away, the brightest star in Taurus. Marks the eye of the bull; the first object ever reached by a deliberate interstellar probe trajectory (Pioneer 10, 2 million years from now).',
  },
  procyon: {
    summary:
      'α CMi, an F5IV-V star 11.5 ly away with a white-dwarf companion. Part of the Winter Triangle with Betelgeuse and Sirius.',
  },
  spica: {
    summary:
      'α Vir, a blue-white B1III-IV close binary ~250 ly away. One of the nearest Type II supernova progenitors.',
  },
  proxima: {
    summary:
      'Closest star to the Sun at 4.24 ly. M5.5Ve red dwarf flaring in UV; hosts Proxima b (Earth-mass exoplanet in habitable zone, 2016) and Proxima d (candidate sub-Earth, 2022).',
  },
  'alpha centauri': {
    summary:
      'Triple system 4.37 ly away — α Cen A (G2V Sun-like), α Cen B (K1V), and Proxima Centauri. Target of the Breakthrough Starshot concept.',
  },

  // --- Messier objects (selected) ---------------------------------------
  'messier 1': {
    summary:
      'Crab Nebula — a supernova remnant 6,500 ly away in Taurus, from SN 1054 recorded by Chinese, Korean, and Arab astronomers. Powered by a 33-ms pulsar at its core.',
  },
  m1: {
    summary:
      'Crab Nebula — a supernova remnant 6,500 ly away in Taurus, from SN 1054 recorded by Chinese, Korean, and Arab astronomers. Powered by a 33-ms pulsar at its core.',
  },
  'messier 31': {
    summary:
      'Andromeda Galaxy — the nearest large spiral galaxy at 2.54 Mly. On collision course with the Milky Way; merger begins in ~4.5 Gyr. Apparent mag 3.4 — visible to the naked eye from dark skies.',
  },
  m31: {
    summary:
      'Andromeda Galaxy — the nearest large spiral galaxy at 2.54 Mly. On collision course with the Milky Way; merger begins in ~4.5 Gyr. Apparent mag 3.4 — visible to the naked eye from dark skies.',
  },
  andromeda: {
    summary:
      'Andromeda Galaxy (M31) — the nearest large spiral galaxy at 2.54 Mly. On collision course with the Milky Way; merger begins in ~4.5 Gyr.',
  },
  'messier 42': {
    summary:
      'Orion Nebula — the nearest major star-forming region at 1,344 ly, cradle of ~2,800 young stars including the Trapezium cluster. Visible as the middle "star" in Orion\u2019s Sword.',
  },
  m42: {
    summary:
      'Orion Nebula — the nearest major star-forming region at 1,344 ly, cradle of ~2,800 young stars including the Trapezium cluster.',
  },
  'messier 45': {
    summary:
      'Pleiades — a young open cluster 444 ly away in Taurus. Seven stars are visible to the unaided eye; the cluster contains ~1,000 stars ~100 Myr old.',
  },
  pleiades: {
    summary:
      'A young open cluster (M45) 444 ly away in Taurus. Seven stars are visible to the unaided eye; ~1,000 stars, 100 Myr old.',
  },
  'messier 51': {
    summary:
      'Whirlpool Galaxy — a face-on grand-design spiral ~23 Mly away, currently interacting with dwarf galaxy NGC 5195. First galaxy identified as a spiral (Lord Rosse, 1845).',
  },
  m51: {
    summary:
      'Whirlpool Galaxy — a face-on grand-design spiral ~23 Mly away, currently interacting with dwarf galaxy NGC 5195.',
  },
  'messier 87': {
    summary:
      'Giant elliptical galaxy 53 Mly away in Virgo. Harbours a 6.5 × 10⁹ M☉ supermassive black hole — the first black hole ever imaged directly (EHT, 2019).',
  },
  m87: {
    summary:
      'Giant elliptical galaxy 53 Mly away in Virgo. Harbours the first black hole ever imaged directly (EHT, 2019).',
  },

  // --- Solar-system highlights ------------------------------------------
  sun: {
    summary:
      'G2V main-sequence star, 4.6 Gyr old. Holds 99.86% of the Solar System\u2019s mass; fuses ~600 million tonnes of hydrogen per second.',
  },
  earth: {
    summary:
      'Third rock from the Sun — the only known planet with liquid-water oceans, plate tectonics, and life. Orbits at 1 AU with a year of 365.256 days.',
  },
  mars: {
    summary:
      'Fourth planet, home to Olympus Mons (tallest volcano in the Solar System) and Valles Marineris (4,000 km canyon system). Surface rovers since 1997.',
  },
  jupiter: {
    summary:
      'Largest planet — 318 Earth masses of hydrogen and helium. The Great Red Spot has persisted for 350+ years. 95 known moons including the four Galilean worlds.',
  },
  saturn: {
    summary:
      'Sixth planet, famed for its icy ring system that spans 282,000 km yet is <1 km thick. 146 known moons; Titan is larger than Mercury and has liquid-methane lakes.',
  },
  uranus: {
    summary:
      'Seventh planet — an ice giant rotating on its side (97.77° axial tilt). Faint ring system discovered in 1977.',
  },
  neptune: {
    summary:
      'Outermost planet; ice giant 30 AU from the Sun. Supersonic winds top 2,100 km/h — the fastest in the Solar System. Triton orbits retrograde.',
  },

  // --- Exotic + deep-sky landmarks --------------------------------------
  'sagittarius a*': {
    summary:
      'The supermassive black hole at the Milky Way\u2019s centre — 4.15 million M☉, 26,500 ly away. Imaged directly by the Event Horizon Telescope in 2022.',
  },
  'sgr a*': {
    summary:
      'Supermassive black hole at the Milky Way\u2019s centre — 4.15 million M☉, imaged by the Event Horizon Telescope in 2022.',
  },
  'crab pulsar': {
    summary:
      'PSR B0531+21 — a 33-ms neutron-star pulsar at the heart of the Crab Nebula (M1), spinning down since the 1054 supernova. Visible across the radio–gamma spectrum.',
  },
};

/**
 * Look up a curated description by name or any known alias.
 * Case/whitespace insensitive. Returns `null` if no entry is seeded yet.
 *
 * The adapter pre-normalises input names + aliases so a bulk callsite
 * (e.g. the InfoPanel) can feed a single array of candidate keys.
 */
export function lookupDescription(
  ...keys: ReadonlyArray<string | null | undefined>
): EntityDescription | null {
  for (const key of keys) {
    if (typeof key !== 'string') continue;
    const normalised = key.trim().toLowerCase();
    if (normalised.length === 0) continue;
    const hit = ENTRIES[normalised];
    if (hit) return hit;
  }
  return null;
}

/** Test seam — number of seeded entries. */
export function describedEntityCount(): number {
  return Object.keys(ENTRIES).length;
}
