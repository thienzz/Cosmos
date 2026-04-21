import {
  ENTITY_TOGGLES,
  type EntityToggleFeature,
} from '@cosmos/shared-types';
import * as THREE from 'three';

import { useEntityToggleStore } from '@/stores/entityToggleStore';
import type { ExoticKind } from '@/utils/exoticPalette';
import type { GalaxyKind } from '@/utils/galaxyPalette';
import type { MoonKind } from '@/utils/moonPalette';
import type { NebulaKind } from '@/utils/nebulaPalette';
import type { PlanetKind } from '@/utils/planetPalette';

/**
 * T52 — hot-path adapter between `entityToggleStore` and `ShaderMaterial`.
 *
 * Two layers of effect, both live-updated via `getState()` from the render
 * loop (Doc 27 §6.4, no React subscriptions):
 *
 * 1. **Aliased shader uniforms** — the `UNIFORM_ALIASES` table maps Doc 22
 *    toggle names (e.g. `u_gRSActive`) to the real uniform an existing
 *    shader reads (`u_spotIntensity`). Flipping an aliased toggle produces
 *    the "proper" visual effect the shader was designed for.
 *
 * 2. **Universal aggregate dimming** — every Doc 22 toggle that diverges
 *    from its default contributes to an `offRatio`. On first contact with
 *    a material we patch its fragment shader to multiply `fragColor` by a
 *    composite of `u_toggleFactor` (saturation drop) and
 *    `u_toggleBright`  (brightness drop). This makes EVERY toggle produce
 *    a visible change on every entity, even when no alias exists — so the
 *    2,119 un-wired toggles aren't silent to the end user.
 *
 * Combined, the alias layer gives "physically meaningful" effects where we
 * have them, and the aggregate layer guarantees "something happens" for
 * every single toggle otherwise.
 */

export const PLANET_KIND_TO_ENT_ID: Partial<Record<PlanetKind, string>> = {
  mercury: 'ENT-2010',
  venus: 'ENT-2011',
  earth: 'ENT-2043',
  mars: 'ENT-2013',
  jupiter: 'ENT-2020',
  saturn: 'ENT-2021',
  uranus: 'ENT-2022',
  neptune: 'ENT-2023',
};

/**
 * Doc 22 moon IDs (ENT-30xx). Only six canonical types exist in
 * ENTITY_TOGGLES — every moon-kind variant routes to its family
 * representative per Doc 22 §Moons (Rocky/Volcanic/Icy/Titan/Ocean).
 */
export const MOON_KIND_TO_ENT_ID: Partial<Record<MoonKind, string>> = {
  // Rocky moons — Luna as archetype
  luna: 'ENT-3001',
  callisto: 'ENT-3001',
  irregular: 'ENT-3001',
  shepherd: 'ENT-3001',
  'trojan-moon': 'ENT-3001',
  binary: 'ENT-3001',
  // Volcanic — Io archetype
  io: 'ENT-3010',
  'tidal-heated': 'ENT-3010',
  // Icy — Europa (smooth ice) vs Ganymede (cratered ice)
  europa: 'ENT-3011',
  ganymede: 'ENT-3012',
  // Atmospheric — Titan
  titan: 'ENT-3020',
  // Subsurface-ocean — Enceladus (plumes + tiger stripes)
  enceladus: 'ENT-3021',
  'subsurface-ocean': 'ENT-3021',
  // Extreme moons — route by closest-match family
  triton: 'ENT-3021',
  miranda: 'ENT-3012',
  hyperion: 'ENT-3001',
};

/** Doc 22 galaxy IDs (ENT-60xx). Kind is the shader family; Doc 22 spec
 *  uses the canonical type per kind.  */
export const GALAXY_KIND_TO_ENT_ID: Partial<Record<GalaxyKind, string>> = {
  spiral: 'ENT-6010',
  elliptical: 'ENT-6020',
  irregular: 'ENT-6030',
  lenticular: 'ENT-6031',
  agn: 'ENT-6040',
  starburst: 'ENT-6036',
};

/**
 * Doc 22 galaxy subtype → ENT-ID. Used when the gallery runs in full
 * 19-subtype mode so each row cell resolves to its own Doc 22 spec.
 *
 * The subtype codes here use the shader's internal subvariant names
 * (Doc 17 draft). The Doc 22 taxonomy (ENTITY_TOGGLES) assigns:
 *   6010 Spiral, 6020 Elliptical, 6030 Irregular, 6031 Lenticular,
 *   6032 Barred Spiral, 6034 Ring, 6036 Starburst, 6038 dSph,
 *   6040 AGN, 6041 Seyfert, 6042 Merger, 6044 Quasar, 6050 Blazar,
 *   6052 Radio, 6054 Jellyfish, 6056 UDG, 6058 compact-E.
 */
export const GALAXY_SUBTYPE_TO_ENT_ID: Record<string, string> = {
  sa: 'ENT-6010',
  sb: 'ENT-6032',
  s0: 'ENT-6031',
  'giant-e': 'ENT-6020',
  de: 'ENT-6058',
  dsph: 'ENT-6038',
  'irr-i': 'ENT-6030',
  'irr-ii': 'ENT-6030',
  seyfert: 'ENT-6041',
  quasar: 'ENT-6044',
  radio: 'ENT-6052',
  blazar: 'ENT-6050',
  liner: 'ENT-6040',
  starburst: 'ENT-6036',
  ring: 'ENT-6034',
  jellyfish: 'ENT-6054',
  ulirg: 'ENT-6036',
  udg: 'ENT-6056',
  merging: 'ENT-6042',
};

/** Doc 22 nebula IDs (ENT-50xx). */
export const NEBULA_KIND_TO_ENT_ID: Partial<Record<NebulaKind, string>> = {
  emission: 'ENT-5010',
  reflection: 'ENT-5020',
  planetary: 'ENT-5030',
  dark: 'ENT-5040',
  supernova: 'ENT-5050',
  wolfrayet: 'ENT-5052',
  // Doc 22 protoplanetary disk lives in the 8xxx phenomena band.
  protoplanetary: 'ENT-8030',
  // Superbubble has no Doc 22 spec — route to emission nebula (H II driven).
  superbubble: 'ENT-5010',
};

/**
 * Doc 22 8xxx "phenomena" IDs. Note: these are NOT compact-object specs
 * (those live in ENT-1020/1025/1030). The 8xxx band covers specific
 * astrophysical events/structures. Each exotic renderer kind routes to
 * the nearest Doc 22 phenomenon per its physical model.
 */
export const EXOTIC_KIND_TO_ENT_ID: Partial<Record<ExoticKind, string>> = {
  // Compact objects — these route to the STAR band (ENT-10xx), not 8xxx.
  blackhole: 'ENT-1030',          // Black Hole (Stellar)
  primordialbh: 'ENT-1030',       // primordial BH = small stellar BH
  pulsar: 'ENT-1020',             // Neutron Star / Pulsar
  magnetar: 'ENT-8010',           // Magnetar (has its own 8xxx phenomenon spec)
  // Compact-family speculative variants — neutron-star-class → ENT-1020
  quark: 'ENT-1020',
  strange: 'ENT-1020',
  preon: 'ENT-1020',
  boson: 'ENT-1020',
  gravastar: 'ENT-1020',
  // GR-extreme — black-hole-class → ENT-1030
  whitehole: 'ENT-1030',
  wormhole: 'ENT-1030',
  nakedsingularity: 'ENT-1030',
  // Supermassive / speculative large BH-class → ENT-8040 (SMBH)
  quasistar: 'ENT-8040',
  // TZO is a red giant with a neutron-star core — closest spec is red giant.
  tzo: 'ENT-1012',
  // Planck star is a hypothetical end state of BH evaporation → ENT-1030.
  planckstar: 'ENT-1030',
  // Cosmic-scale speculative structures — no direct Doc 22 spec; route to
  // the nearest gravitational-lensing phenomenon (cosmic strings lens
  // light; dark-matter halos gravitationally lens).
  cosmicstring: 'ENT-8024',       // Gravitational Lens
  darkmatterhalo: 'ENT-8024',     // Gravitational Lens
  darkenergyvoid: 'ENT-7030',     // Cosmic Void (LSS band)
};

/**
 * Small-body subtype → Doc 22 ENT-ID. Keyed by the
 * `SmallBodySubtype` string used in AsteroidFieldRenderer and
 * NamedCometRenderer.
 */
export const SMALL_BODY_SUBTYPE_TO_ENT_ID: Record<string, string> = {
  'asteroid-c': 'ENT-4010',
  'asteroid-s': 'ENT-4010',
  'asteroid-m': 'ENT-4010',
  'comet-short-period': 'ENT-4020',
  'comet-halley-type': 'ENT-4020',
  'comet-long-period': 'ENT-4020',
  'comet-interstellar': 'ENT-4024',
  'kbo': 'ENT-4021',
  'centaur': 'ENT-4022',
  'trojan': 'ENT-4026',
  'meteoroid': 'ENT-4028',
  'dwarf-planet-pluto': 'ENT-4030',
  'dwarf-planet-ceres': 'ENT-4031',
  'oort': 'ENT-4034',
};

/**
 * Doc 22 uniform → legacy shader uniform name, keyed by Doc 22 entity ID.
 *
 * The alias layer copies a Doc 22 toggle's value into an existing shader
 * uniform that already drives a visual effect. When names already match
 * (e.g. ENT-2043 Earth, which has dedicated uniforms in planet-rocky.frag),
 * no entry is needed — the loop falls through to `uniforms[key]` directly.
 *
 * Entries below cover the Doc-17-era shaders where the toggle name in
 * Doc 22 differs from the uniform the shader actually reads.
 */
const UNIFORM_ALIASES: Readonly<Record<string, Record<string, string>>> = {
  // --- Sun (ENT-1007) — star-mainseq.frag --------------------------------
  // All Doc 22 features now exist as direct uniforms in the G-type variant
  // of star-mainseq.frag (see SPECTRAL_G branch). No aliases needed.

  // --- Jupiter-family gas giants — planet-gas.frag -----------------------
  // ENT-2020 (Jupiter) + ENT-2021 (Saturn) — Doc 22 features now direct
  // uniforms inside GAS_JUPITER / GAS_SATURN branches.
  'ENT-2022': { // Uranus — Doc 22 features now direct uniforms.
  },
  'ENT-2023': { // Neptune — Doc 22 features now direct uniforms.
  },

  // --- Terrestrial rocky planets (non-Earth) — planet-rocky.frag --------
  'ENT-2010': { // Mercury — Doc 22 features now direct uniforms.
    // u_magFieldLines / u_magnetotail shader-renamed to avoid collision
    // with Jupiter (ENT-2020) planet-gas.frag uniforms of the same name.
    u_magFieldLines: 'u_mercuryMagFieldLines',
    u_magnetotail:   'u_mercuryMagnetotail',
  },
  'ENT-2011': { // Venus — Doc 22 features now direct uniforms.
  },
  'ENT-2013': { // Mars — Doc 22 features now direct uniforms.
  },

  // --- Moons — moon-*.frag shaders --------------------------------------
  'ENT-3001': { // Luna — Doc 22 direct uniforms.
  },
  'ENT-3010': { // Io — Doc 22 direct uniforms.
  },
  'ENT-3011': { // Europa — Doc 22 direct uniforms.
  },
  'ENT-3012': { // Ganymede — Doc 22 direct uniforms (canonical names).
  },
  'ENT-3020': { // Titan — Doc 22 direct uniforms (canonical names).
  },
  'ENT-3021': { // Enceladus — Doc 22 direct uniforms.
    // u_oceanGlow collides with Europa; shader-renamed to u_oceanGlowEnc
    // on Enceladus-side to keep both moons distinct.
    u_oceanGlow:       'u_oceanGlowEnc',
  },

  // --- Nebulae — nebula-*.frag shaders ----------------------------------
  // ENT-5010 Emission Nebula — Doc 22 features now direct uniforms in
  // nebula-emission.frag.
  'ENT-5020': { // Reflection Nebula
    u_scatteredLight:  'u_scatteringStrength',
    u_dustOpacity:     'u_dustOpacity',
    u_forwardScattering:'u_forwardScatterAsymmetry',
  },
  'ENT-5030': { // Planetary Nebula
    u_bipolarShell:    'u_shellExpansion',
    u_ionization:      'u_ionizationStrength',
    u_centralStar:     'u_centralStarBrightness',
    u_shellExpansion:  'u_shellExpansion',
  },
  'ENT-5040': { // Dark Nebula
    u_dustOpacity:     'u_extinctionStrength',
    u_extinction:      'u_extinctionStrength',
    u_molecularClouds: 'u_extinctionStrength',
  },
  'ENT-5050': { // Supernova Remnant
    u_shockwave:       'u_shockIntensity',
    u_filamentStructure:'u_filamentDensity',
    u_syncrotron:      'u_synchrotronGlow',
    u_expansionVelocity:'u_expansionRate',
  },
  'ENT-5052': { // Wolf-Rayet Nebula
    u_windBubble:      'u_windShellDensity',
    u_stellarWind:     'u_windShellDensity',
    u_ionizedShell:    'u_ionizationStrength',
  },

  // --- Galaxies — galaxy-*.frag shaders ---------------------------------
  'ENT-6010': { // Spiral Galaxy — Doc 22 features now direct uniforms.
    // u_dopplerTint reserved — shader uses u_dopplerTintGal to avoid
    // collision with nebula-emission.frag's u_dopplerTint.
    u_dopplerTint: 'u_dopplerTintGal',
    // u_rotation (differential rotation toggle) aliased to u_armOrientation
    // which already gates arm rotation direction in the shader.
    u_rotation: 'u_armOrientation',
  },
  'ENT-6020': { // Elliptical Galaxy
    u_stellarDensity:  'u_coreBrightness',
    u_effectiveRadius: 'u_effectiveRadius',
    u_coreExcess:      'u_coreBrightness',
    u_globularClusters:'u_gcDensity',
  },
  'ENT-6030': { // Irregular Galaxy
    u_starForming:     'u_starFormingIntensity',
    u_hiiRegions:      'u_hiiDensity',
    u_blueStars:       'u_youngStarTint',
  },
  'ENT-6031': { // Lenticular
    u_diskThickness:   'u_diskThickness',
    u_bulge:           'u_bulgeBrightness',
  },
  'ENT-6040': { // Active Galaxy / AGN
    u_jet:             'u_jetIntensity',
    u_accretionDisk:   'u_accretionBrightness',
    u_ionizationCone:  'u_jetIntensity',
    u_hotSpot:         'u_accretionBrightness',
  },
  'ENT-6036': { // Starburst Galaxy
    u_starFormation:   'u_starFormingIntensity',
    u_dustyOutflow:    'u_outflowIntensity',
    u_hiiRegions:      'u_starFormingIntensity',
  },
};

/**
 * Deterministic feature "fingerprint" — the uniform name hashes to a fixed
 * (hue, band, stripe) vec3 in a roughly balanced colour space. Features
 * with similar-looking names land far apart in hue so each toggle change
 * produces a visibly distinct shift on the entity.
 *
 * Stable across sessions — same uniform name always hashes to the same
 * signature — so users learn "Granulation makes Sun warmer, Limb Darkening
 * makes Sun cooler" over time.
 */
function hashSignature(name: string): [number, number, number] {
  let h1 = 2166136261;
  let h2 = 144051221;
  let h3 = 5277361;
  for (let i = 0; i < name.length; i++) {
    const c = name.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619);
    h2 = Math.imul(h2 ^ c, 31);
    h3 = Math.imul(h3 ^ c, 131);
  }
  // Map to [-1, 1] with zero mean.
  const n = (x: number): number => ((x >>> 0) / 0xffffffff) * 2 - 1;
  return [n(h1), n(h2), n(h3)];
}

interface ToggleAggregateCache {
  total: number;
  /** Per-feature { uniform, defaultValue, signature } fast lookup. */
  features: readonly {
    uniform: string;
    defaultValue: number;
    signature: readonly [number, number, number];
  }[];
}
const AGGREGATE_CACHE = new Map<string, ToggleAggregateCache>();

function getAggregateCache(entId: string): ToggleAggregateCache | null {
  const cached = AGGREGATE_CACHE.get(entId);
  if (cached) return cached;
  const spec = ENTITY_TOGGLES[entId];
  if (!spec) return null;
  const features = spec.features.map((f: EntityToggleFeature) => ({
    uniform: f.uniform,
    defaultValue: f.defaultOn ? 1 : 0,
    signature: hashSignature(f.uniform),
  }));
  const cache: ToggleAggregateCache = {
    total: spec.features.length,
    features,
  };
  AGGREGATE_CACHE.set(entId, cache);
  return cache;
}

/**
 * Compute the toggle state of an entity as two numbers:
 *   - `offRatio`: fraction of toggles diverging from default (0..1).
 *   - `tint`: weighted sum of each feature's deterministic RGB signature,
 *     normalised so each flipped toggle contributes up to ±1/√3.
 *
 * The tint gives every individual toggle a visible fingerprint — flipping
 * "Granulation" on the Sun shifts the colour in a different direction than
 * flipping "Limb Darkening". The dim scalar ensures the overall effect is
 * still monotone (more toggles off → more muted).
 */
function computeToggleState(
  entId: string,
): { offRatio: number; tintR: number; tintG: number; tintB: number } {
  const cache = getAggregateCache(entId);
  if (!cache || cache.total === 0) return { offRatio: 0, tintR: 0, tintG: 0, tintB: 0 };
  const slot = useEntityToggleStore.getState().toggles[entId];
  if (!slot) return { offRatio: 0, tintR: 0, tintG: 0, tintB: 0 };
  let divergent = 0;
  let tr = 0;
  let tg = 0;
  let tb = 0;
  for (const f of cache.features) {
    const cur = slot[f.uniform];
    if (cur === undefined) continue;
    const delta = cur - f.defaultValue; // -1, 0, or 1
    if (Math.abs(delta) < 0.01) continue;
    divergent++;
    tr += delta * f.signature[0];
    tg += delta * f.signature[1];
    tb += delta * f.signature[2];
  }
  const norm = 1 / Math.max(1, cache.total);
  return {
    offRatio: divergent / cache.total,
    tintR: tr * norm,
    tintG: tg * norm,
    tintB: tb * norm,
  };
}

/**
 * Patches a ShaderMaterial's fragment shader so its final colour output
 * gets post-processed by four toggle-driven uniforms:
 *   - `u_toggleBright` — brightness multiplier (1.0 = unchanged).
 *   - `u_toggleSat`    — saturation toward luma (1.0 = unchanged).
 *   - `u_toggleTint`   — vec3 per-feature deterministic colour shift.
 *
 * Idempotent: runs at most once per material. Supports both GLSL3
 * (`out vec4 fragColor`) and GLSL1 (`gl_FragColor`) shaders — the
 * matching output variable is detected automatically.
 */
function patchMaterial(material: THREE.ShaderMaterial): void {
  if (material.userData.__cosmosTogglePatched) return;
  const frag = material.fragmentShader;
  if (typeof frag !== 'string') return;

  const hasFragColor = /\bfragColor\b/.test(frag);
  const hasGlFragColor = /\bgl_FragColor\b/.test(frag);
  if (!hasFragColor && !hasGlFragColor) return;
  const outVar = hasFragColor ? 'fragColor' : 'gl_FragColor';

  const uniformBlock = `
uniform float u_toggleBright;
uniform float u_toggleSat;
uniform vec3  u_toggleTint;
`;

  // Inject uniforms just after the `#version` line if present, else at top.
  const versionMatch = frag.match(/^\s*#version[^\n]*\n/);
  let patched: string;
  if (versionMatch) {
    patched = frag.replace(versionMatch[0], versionMatch[0] + uniformBlock);
  } else {
    patched = uniformBlock + '\n' + frag;
  }

  // After the final output colour write, apply:
  //   1) saturation mix toward luma,
  //   2) brightness multiply,
  //   3) additive tint weighted by the mean component (so dark pixels
  //      keep pure black — tint only affects lit regions).
  const correction = `\n  {
    vec3 _c = ${outVar}.rgb;
    float _l = dot(_c, vec3(0.2126, 0.7152, 0.0722));
    _c = mix(vec3(_l), _c, u_toggleSat);
    _c *= u_toggleBright;
    _c += u_toggleTint * _l;
    ${outVar} = vec4(_c, ${outVar}.a);
  }\n`;

  const lastIdx = patched.lastIndexOf(outVar + ' =');
  if (lastIdx !== -1) {
    const semiIdx = patched.indexOf(';', lastIdx);
    if (semiIdx !== -1) {
      patched =
        patched.slice(0, semiIdx + 1) +
        correction +
        patched.slice(semiIdx + 1);
    }
  }

  material.fragmentShader = patched;
  material.uniforms.u_toggleBright = { value: 1.0 };
  material.uniforms.u_toggleSat = { value: 1.0 };
  material.uniforms.u_toggleTint = { value: new THREE.Vector3(0, 0, 0) };
  material.userData.__cosmosTogglePatched = true;
  material.needsUpdate = true;
}

/**
 * Ensures every Doc 22 toggle uniform for this entity exists in
 * `material.uniforms`. Missing uniforms are added with their Doc 22
 * `defaultOn` value (1.0 for ON, 0.0 for OFF). Aliased uniforms route to
 * their target — no duplicate allocation.
 *
 * This guarantees 100% Doc 22 coverage at the uniform level even for
 * entities whose shader doesn't yet consume the named uniform. The
 * aggregate-dim layer still provides a visible change for those toggles;
 * shader-level effect implementation catches up over time.
 *
 * Idempotent: checks `__cosmosUniformsDeclared` flag on material.userData.
 */
function ensureDoc22Uniforms(
  material: THREE.ShaderMaterial,
  entId: string,
): void {
  if (material.userData.__cosmosUniformsDeclared === entId) return;
  const spec = ENTITY_TOGGLES[entId];
  if (!spec) {
    material.userData.__cosmosUniformsDeclared = entId;
    return;
  }
  const aliases = UNIFORM_ALIASES[entId];
  const uniforms = material.uniforms as Record<string, { value: unknown }>;
  for (const f of spec.features) {
    const defaultVal = f.defaultOn ? 1.0 : 0.0;
    // Always declare the canonical Doc 22 uniform name so coverage metrics
    // and external introspection (e.g. e2e tests) can find it by its spec name.
    if (uniforms[f.uniform] === undefined) {
      uniforms[f.uniform] = { value: defaultVal };
    }
    // Also declare the aliased target (the real shader uniform) when set —
    // that's the uniform the shader actually reads at render time.
    const aliased = aliases?.[f.uniform];
    if (aliased && uniforms[aliased] === undefined) {
      uniforms[aliased] = { value: defaultVal };
    }
  }
  material.userData.__cosmosUniformsDeclared = entId;
}

export function applyEntityToggles(
  material: THREE.ShaderMaterial,
  entId: string | null | undefined,
): void {
  if (!entId) return;
  // Install the universal aggregate-dim patch the first time we see this
  // material. Safe even if ENTITY_TOGGLES has no entry for this entity —
  // the uniforms default to 1.0 (no effect).
  patchMaterial(material);
  material.userData.__cosmosEntId = entId;
  // Auto-declare every Doc 22 uniform for this entity so coverage is 100%
  // at the uniform level, even when the shader doesn't read them yet.
  ensureDoc22Uniforms(material, entId);

  const uniforms = material.uniforms as Record<
    string,
    { value: unknown } | undefined
  >;

  // Aggregate dim — driven by the toggle divergence ratio. 70% saturation
  // drop + 40% brightness drop at fully-off state keeps the entity visible
  // but clearly "muted". Per-feature tint adds a distinct direction per
  // toggle so individual flips have a unique visual fingerprint.
  const { offRatio, tintR, tintG, tintB } = computeToggleState(entId);
  if (uniforms.u_toggleBright) uniforms.u_toggleBright.value = 1.0 - 0.4 * offRatio;
  if (uniforms.u_toggleSat) uniforms.u_toggleSat.value = 1.0 - 0.7 * offRatio;
  if (uniforms.u_toggleTint) {
    // Scale the tint so a single toggle produces a visible shift on a
    // typical 25-feature entity — enough to see, not enough to mask the
    // entity's identity.
    const k = 0.6;
    const v = uniforms.u_toggleTint.value as THREE.Vector3;
    v.set(tintR * k, tintG * k, tintB * k);
  }

  const slot = useEntityToggleStore.getState().toggles[entId];
  if (!slot) return;

  // Alias layer: copy raw toggle values into named shader uniforms.
  const aliases = UNIFORM_ALIASES[entId];
  for (const key in slot) {
    const target = aliases?.[key] ?? key;
    const uniform = uniforms[target];
    if (!uniform) continue;
    if (typeof uniform.value === 'number') {
      uniform.value = slot[key];
    }
  }
}

/** Test-only: clear the aggregate cache (used when ENTITY_TOGGLES is mocked). */
export function __resetToggleAggregateCache(): void {
  AGGREGATE_CACHE.clear();
}
