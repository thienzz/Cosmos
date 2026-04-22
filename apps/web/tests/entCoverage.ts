/**
 * Flat ENT-ID → shader coverage fixture (T-V-02).
 *
 * Authoritative source: [docs/17-coverage-checklist.md](../../../../docs/17-coverage-checklist.md).
 * Each row mirrors one checklist row. Tier A only — 154 subtypes. Tier B
 * (+108) is appended by T-V-36/41/44/47/50/53/57 as those families ship.
 *
 * Status values follow the Doc 17 vocabulary:
 *   - 'shipped'     : shader + MaterialFactory wiring complete.
 *   - 'in-progress' : shader exists but per-subtype polish pending.
 *   - 'planned'     : shader does not yet exist or is not factory-wired.
 *   - 'inline'      : currently rendered via inline ShaderMaterial inside a
 *                     specific *Renderer.ts; T-V-29 / T-V-58 externalises it
 *                     and registers it with MaterialFactory.
 *
 * The `shader` column matches the canonical MaterialFactory registry key
 * (Doc 17 column 3, filename stem without `.frag`).
 */

export type CoverageStatus = 'shipped' | 'in-progress' | 'planned' | 'inline';

export interface EntCoverageRow {
  id: string;
  subtype: string;
  shader: string | null; // null => currently inline, not in registry
  status: CoverageStatus;
  note?: string;
}

export const ENT_COVERAGE_FIXTURE: readonly EntCoverageRow[] = Object.freeze([
  // Stars (ENT-1xxx) — 31 subtypes, all shipped
  { id: 'ENT-1010', subtype: 'O-Type MS',         shader: 'star-mainseq', status: 'shipped' },
  { id: 'ENT-1011', subtype: 'B-Type MS',         shader: 'star-mainseq', status: 'shipped' },
  { id: 'ENT-1012', subtype: 'A-Type MS',         shader: 'star-mainseq', status: 'shipped' },
  { id: 'ENT-1013', subtype: 'F-Type MS',         shader: 'star-mainseq', status: 'shipped' },
  { id: 'ENT-1014', subtype: 'G-Type MS',         shader: 'star-mainseq', status: 'shipped' },
  { id: 'ENT-1015', subtype: 'K-Type MS',         shader: 'star-mainseq', status: 'shipped' },
  { id: 'ENT-1016', subtype: 'M-Type MS',         shader: 'star-mainseq', status: 'shipped' },
  { id: 'ENT-1017', subtype: 'L-Type BD',         shader: 'star-mainseq', status: 'shipped' },
  { id: 'ENT-1018', subtype: 'T-Type BD',         shader: 'star-mainseq', status: 'shipped' },
  { id: 'ENT-1019', subtype: 'Y-Type BD',         shader: 'star-mainseq', status: 'shipped' },
  { id: 'ENT-1020', subtype: 'Protostar/T-Tauri', shader: 'star-evolved', status: 'shipped' },
  { id: 'ENT-1021', subtype: 'MS (General)',      shader: 'star-mainseq', status: 'shipped' },
  { id: 'ENT-1022', subtype: 'Subgiant',          shader: 'star-evolved', status: 'shipped' },
  { id: 'ENT-1023', subtype: 'Red Giant/SG',      shader: 'star-evolved', status: 'shipped' },
  { id: 'ENT-1024', subtype: 'Blue SG',           shader: 'star-evolved', status: 'shipped' },
  { id: 'ENT-1025', subtype: 'AGB',               shader: 'star-evolved', status: 'shipped' },
  { id: 'ENT-1026', subtype: 'Horizontal Branch', shader: 'star-evolved', status: 'shipped' },
  { id: 'ENT-1027', subtype: 'Wolf-Rayet',        shader: 'star-evolved', status: 'shipped' },
  { id: 'ENT-1028', subtype: 'LBV',               shader: 'star-evolved', status: 'shipped' },
  { id: 'ENT-1029', subtype: 'Carbon',            shader: 'star-evolved', status: 'shipped' },
  { id: 'ENT-1030', subtype: 'White Dwarf',       shader: 'star-remnant', status: 'shipped' },
  { id: 'ENT-1031', subtype: 'Neutron/Pulsar',    shader: 'star-remnant', status: 'shipped' },
  { id: 'ENT-1032', subtype: 'Black Hole (stellar)', shader: 'exotic-blackhole', status: 'shipped' },
  { id: 'ENT-1033', subtype: 'Cepheid',           shader: 'star-variable', status: 'shipped' },
  { id: 'ENT-1034', subtype: 'RR Lyrae',          shader: 'star-variable', status: 'shipped' },
  { id: 'ENT-1035', subtype: 'Mira',              shader: 'star-variable', status: 'shipped' },
  { id: 'ENT-1036', subtype: 'Eclipsing Binary',  shader: 'star-variable', status: 'shipped' },
  { id: 'ENT-1037', subtype: 'Cataclysmic',       shader: 'star-variable', status: 'shipped' },
  { id: 'ENT-1038', subtype: 'Symbiotic',         shader: 'star-variable', status: 'shipped' },
  { id: 'ENT-1039', subtype: 'Blue Straggler',    shader: 'star-variable', status: 'shipped' },
  { id: 'ENT-1040', subtype: 'Hypergiant',        shader: 'star-evolved', status: 'shipped' },

  // Tier B stellar extensions (T-V-30..36, reserved range ENT-1050..1069).
  { id: 'ENT-1050', subtype: 'L Dwarf (dedicated)', shader: 'star-brown-dwarf', status: 'shipped', note: 'T-V-30 BD_L + HAS_CLOUDS' },
  { id: 'ENT-1051', subtype: 'T Dwarf (dedicated)', shader: 'star-brown-dwarf', status: 'shipped', note: 'T-V-30 BD_T + HAS_CLOUDS' },
  { id: 'ENT-1052', subtype: 'Y Dwarf (dedicated)', shader: 'star-brown-dwarf', status: 'shipped', note: 'T-V-30 BD_Y thermal-only' },
  { id: 'ENT-1053', subtype: 'sdO Subdwarf',       shader: 'star-subdwarf',    status: 'shipped', note: 'T-V-31 SUBDWARF_O' },
  { id: 'ENT-1054', subtype: 'sdB Subdwarf',       shader: 'star-subdwarf',    status: 'shipped', note: 'T-V-31 SUBDWARF_B' },
  { id: 'ENT-1055', subtype: 'Carbon C-R',         shader: 'star-carbon',      status: 'shipped', note: 'T-V-32 CARBON_CR ruby' },
  { id: 'ENT-1056', subtype: 'Carbon C-N',         shader: 'star-carbon',      status: 'shipped', note: 'T-V-32 CARBON_CN N-type' },
  { id: 'ENT-1057', subtype: 'Carbon C-J',         shader: 'star-carbon',      status: 'shipped', note: 'T-V-32 CARBON_CJ 13C-enhanced' },
  { id: 'ENT-1058', subtype: 'Herbig Ae',          shader: 'star-pms',         status: 'shipped', note: 'T-V-33 PMS_HERBIG_AE' },
  { id: 'ENT-1059', subtype: 'Herbig Be',          shader: 'star-pms',         status: 'shipped', note: 'T-V-33 PMS_HERBIG_BE' },
  { id: 'ENT-1060', subtype: 'Classical T Tauri',  shader: 'star-pms',         status: 'shipped', note: 'T-V-33 PMS_T_TAURI' },
  { id: 'ENT-1061', subtype: 'Weak-lined T Tauri', shader: 'star-pms',         status: 'shipped', note: 'T-V-33 PMS_T_TAURI_WL' },
  { id: 'ENT-1062', subtype: 'FU Orionis',         shader: 'star-pms',         status: 'shipped', note: 'T-V-33 PMS_FU_ORI outburst' },
  { id: 'ENT-1063', subtype: 'LBV',                shader: 'star-variable',    status: 'shipped', note: 'T-V-34 VAR_LBV' },
  { id: 'ENT-1064', subtype: 'Be Star',            shader: 'star-variable',    status: 'shipped', note: 'T-V-34 VAR_BE_STAR' },
  { id: 'ENT-1065', subtype: 'AM CVn',             shader: 'star-variable',    status: 'shipped', note: 'T-V-34 VAR_AM_CVN' },
  { id: 'ENT-1066', subtype: 'Post-AGB',           shader: 'star-evolved',     status: 'shipped', note: 'T-V-35 EVOLVED_POST_AGB' },
  { id: 'ENT-1067', subtype: 'Horizontal Branch (Tier B)', shader: 'star-evolved', status: 'shipped', note: 'T-V-35' },
  { id: 'ENT-1068', subtype: 'RGB Tip',            shader: 'star-evolved',     status: 'shipped', note: 'T-V-35 EVOLVED_RGB_TIP' },
  { id: 'ENT-1069', subtype: 'Extreme AGB',        shader: 'star-evolved',     status: 'shipped', note: 'T-V-35 EVOLVED_EXTREME_AGB' },

  // Planets (ENT-2xxx) — 27 subtypes, polished by V3
  { id: 'ENT-2010', subtype: 'Mercury',      shader: 'planet-rocky',   status: 'shipped', note: 'T-V-17 ROCKY_MERCURY + full Doc 22 toggle uniforms (T52)' },
  { id: 'ENT-2011', subtype: 'Venus',        shader: 'planet-rocky',   status: 'shipped', note: 'T-V-17 ROCKY_VENUS + cloud deck + Doc 22 toggles' },
  { id: 'ENT-2012', subtype: 'Earth',        shader: 'planet-rocky',   status: 'shipped', note: 'T-V-17 ROCKY_EARTH + PBR ocean/clouds/atmosphere rim' },
  { id: 'ENT-2013', subtype: 'Mars',         shader: 'planet-rocky',   status: 'shipped', note: 'T-V-17 ROCKY_MARS + polar caps + iron-oxide dust' },
  { id: 'ENT-2020', subtype: 'Jupiter',      shader: 'planet-gas',     status: 'shipped', note: 'T-V-18 GAS_JUPITER + GRS + Doc 22 toggles' },
  { id: 'ENT-2021', subtype: 'Saturn',       shader: 'planet-gas',     status: 'shipped', note: 'T-V-18 GAS_SATURN + hexagon + Cassini ring' },
  { id: 'ENT-2025', subtype: 'Uranus',       shader: 'planet-gas',     status: 'shipped', note: 'T-V-18 GAS_URANUS + methane + tilt' },
  { id: 'ENT-2026', subtype: 'Neptune',      shader: 'planet-gas',     status: 'shipped', note: 'T-V-18 GAS_NEPTUNE + Great Dark Spot' },
  { id: 'ENT-2030', subtype: 'Hot Jupiter',  shader: 'planet-gas',     status: 'shipped', note: 'T-V-19 GAS_HOT_JUPITER' },
  { id: 'ENT-2031', subtype: 'Super-Earth',  shader: 'planet-rocky',   status: 'shipped', note: 'T-V-19 ROCKY_SUPER_EARTH' },
  { id: 'ENT-2032', subtype: 'Mini-Neptune', shader: 'planet-gas',     status: 'shipped', note: 'T-V-19 GAS_MINI_NEPTUNE' },
  { id: 'ENT-2033', subtype: 'Hycean',       shader: 'planet-extreme', status: 'shipped', note: 'T-V-19 EXTREME_HYCEAN' },
  { id: 'ENT-2034', subtype: 'Eyeball',      shader: 'planet-extreme', status: 'shipped', note: 'T-V-19 EXTREME_EYEBALL' },
  { id: 'ENT-2035', subtype: 'Magma',        shader: 'planet-rocky',   status: 'shipped', note: 'T-V-19 ROCKY_MAGMA' },
  { id: 'ENT-2036', subtype: 'Ocean',        shader: 'planet-rocky',   status: 'shipped', note: 'T-V-20 ROCKY_OCEAN' },
  { id: 'ENT-2037', subtype: 'Carbon',       shader: 'planet-rocky',   status: 'shipped', note: 'T-V-20 ROCKY_CARBON' },
  { id: 'ENT-2038', subtype: 'Iron',         shader: 'planet-rocky',   status: 'shipped', note: 'T-V-20 ROCKY_IRON' },
  { id: 'ENT-2039', subtype: 'Desert',       shader: 'planet-rocky',   status: 'shipped', note: 'T-V-20 ROCKY_DESERT' },
  { id: 'ENT-2040', subtype: 'Rogue',        shader: 'planet-rocky',   status: 'shipped', note: 'T-V-20 ROCKY_ROGUE self-emission' },
  { id: 'ENT-2041', subtype: 'Puffy',        shader: 'planet-gas',     status: 'shipped', note: 'T-V-20 GAS_PUFFY low-density' },
  { id: 'ENT-2042', subtype: 'Protoplanet',  shader: 'planet-rocky',   status: 'shipped', note: 'T-V-20 ROCKY_PROTOPLANET' },
  { id: 'ENT-2043', subtype: 'Tidally-Heated Io-Type', shader: 'planet-extreme', status: 'shipped', note: 'T-V-20 EXTREME_TIDALLY_HEATED' },
  { id: 'ENT-2044', subtype: 'Water',        shader: 'planet-rocky',   status: 'shipped', note: 'T-V-20 ROCKY_WATER' },
  { id: 'ENT-2045', subtype: 'Helium',       shader: 'planet-gas',     status: 'shipped', note: 'T-V-20 GAS_HELIUM' },
  { id: 'ENT-2046', subtype: 'Circumbinary', shader: 'planet-gas',     status: 'shipped', note: 'T-V-20 GAS_CIRCUMBINARY dual sun' },
  { id: 'ENT-2047', subtype: 'Synestia',     shader: 'planet-extreme', status: 'shipped', note: 'T-V-20 EXTREME_SYNESTIA' },
  { id: 'ENT-2050', subtype: 'Chthonian',    shader: 'planet-rocky',   status: 'shipped', note: 'T-V-20 ROCKY_CHTHONIAN stripped core' },

  // Moons (ENT-3xxx) — 15 subtypes, polished by V4
  { id: 'ENT-3010', subtype: 'Volcanic (Io)',    shader: 'moon-volcanic',    status: 'shipped', note: 'T-V-22 MOON_IO + SO2 plumes' },
  { id: 'ENT-3011', subtype: 'Cracked Ice',      shader: 'moon-icy',         status: 'shipped', note: 'T-V-22 MOON_EUROPA chaos lineae' },
  { id: 'ENT-3012', subtype: 'Hazy Atmosphere',  shader: 'moon-atmospheric', status: 'shipped', note: 'T-V-22 MOON_TITAN methane haze' },
  { id: 'ENT-3013', subtype: 'Cratered Rocky',   shader: 'moon-rocky',       status: 'shipped', note: 'T-V-22 MOON_LUNA maria + rays' },
  { id: 'ENT-3014', subtype: 'Irregular',        shader: 'moon-rocky',       status: 'shipped', note: 'T-V-22 MOON_IRREGULAR Phobos-like' },
  { id: 'ENT-3015', subtype: 'Cryo-Geyser',      shader: 'moon-icy',         status: 'shipped', note: 'T-V-22 MOON_ENCELADUS tiger stripes' },
  { id: 'ENT-3016', subtype: 'Ancient Surface',  shader: 'moon-rocky',       status: 'shipped', note: 'T-V-22 MOON_CALLISTO Valhalla ring' },
  { id: 'ENT-3017', subtype: 'Magnetosphere',    shader: 'moon-icy',         status: 'shipped', note: 'T-V-22 MOON_GANYMEDE grooved terrain' },
  { id: 'ENT-3018', subtype: 'Retrograde Capture', shader: 'moon-extreme',   status: 'shipped', note: 'T-V-23 MOON_TRITON N2 geysers' },
  { id: 'ENT-3019', subtype: 'Extreme Geology',  shader: 'moon-extreme',     status: 'shipped', note: 'T-V-23 MOON_MIRANDA Verona Rupes' },
  { id: 'ENT-3020', subtype: 'Sponge',           shader: 'moon-extreme',     status: 'shipped', note: 'T-V-23 MOON_HYPERION porous' },
  { id: 'ENT-3021', subtype: 'Shepherd',         shader: 'moon-minor',       status: 'shipped', note: 'T-V-23 MOON_SHEPHERD Pan/Daphnis' },
  { id: 'ENT-3022', subtype: 'Trojan',           shader: 'moon-minor',       status: 'shipped', note: 'T-V-23 MOON_TROJAN_MOON L4/L5' },
  { id: 'ENT-3023', subtype: 'Binary',           shader: 'moon-minor',       status: 'shipped', note: 'T-V-23 MOON_BINARY Pluto-Charon' },
  { id: 'ENT-3024', subtype: 'Subsurface Ocean', shader: 'moon-icy',         status: 'shipped', note: 'T-V-23 MOON_SUBSURFACE_OCEAN' },

  // Small Bodies (ENT-4xxx) — 20 subtypes, wired in V1
  { id: 'ENT-4010', subtype: 'C-Type Asteroid', shader: 'smallbody-asteroid',        status: 'shipped', note: 'T-V-03 #define TYPE_C' },
  { id: 'ENT-4011', subtype: 'S-Type Asteroid', shader: 'smallbody-asteroid',        status: 'shipped', note: 'T-V-03 #define TYPE_S' },
  { id: 'ENT-4012', subtype: 'M-Type Asteroid', shader: 'smallbody-asteroid',        status: 'shipped', note: 'T-V-03 #define TYPE_M' },
  { id: 'ENT-4013', subtype: 'V-Type Asteroid', shader: 'smallbody-asteroid',        status: 'shipped', note: 'T-V-03 #define TYPE_V' },
  { id: 'ENT-4014', subtype: 'Binary Asteroid', shader: 'smallbody-asteroid-binary', status: 'shipped', note: 'T-V-04 #define BINARY_PAIR' },
  { id: 'ENT-4015', subtype: 'Rubble-Pile',     shader: 'smallbody-rubble',          status: 'shipped', note: 'T-V-05 Worley-F2F1 boulder AO' },
  { id: 'ENT-4016', subtype: 'Contact Binary',  shader: 'smallbody-asteroid-binary', status: 'shipped', note: 'T-V-04 #define BINARY_CONTACT' },
  { id: 'ENT-4020', subtype: 'Short-Period Comet', shader: 'smallbody-comet',        status: 'planned' },
  { id: 'ENT-4021', subtype: 'Long-Period Comet',  shader: 'smallbody-comet',        status: 'planned' },
  { id: 'ENT-4022', subtype: 'Halley-Type Comet',  shader: 'smallbody-comet',        status: 'planned' },
  { id: 'ENT-4023', subtype: 'Interstellar Object',shader: 'smallbody-comet',        status: 'planned' },
  { id: 'ENT-4030', subtype: 'Pluto',  shader: 'smallbody-kbo',      status: 'shipped', note: 'T-V-06 #define KBO_PLUTO (Sputnik heart)' },
  { id: 'ENT-4031', subtype: 'Ceres',  shader: 'smallbody-kbo',      status: 'shipped', note: 'T-V-06 #define KBO_CERES (Occator spots)' },
  { id: 'ENT-4032', subtype: 'Eris',   shader: 'smallbody-kbo',      status: 'shipped', note: 'T-V-06 #define KBO_ERIS (methane frost)' },
  { id: 'ENT-4040', subtype: 'Classical KBO',    shader: 'smallbody-kbo',     status: 'shipped', note: 'T-V-06 default tholin' },
  { id: 'ENT-4041', subtype: 'Plutino (Resonant KBO)', shader: 'smallbody-kbo', status: 'shipped', note: 'T-V-06 default tholin' },
  { id: 'ENT-4042', subtype: 'Scattered Disk',   shader: 'smallbody-kbo',     status: 'shipped', note: 'T-V-06 default tholin' },
  { id: 'ENT-4050', subtype: 'Centaur',          shader: 'smallbody-centaur', status: 'shipped', note: 'T-V-07 CHIRON/CHARIKLO/ACTIVE defines' },
  { id: 'ENT-4051', subtype: 'Jupiter Trojan',   shader: 'smallbody-trojan',  status: 'shipped', note: 'T-V-08 TROJAN_L4/L5 halo defines' },
  { id: 'ENT-4060', subtype: 'Meteoroid Stream', shader: 'meteoroid-stream',  status: 'shipped', note: 'T-V-09 ribbon + radiant boost' },

  // Nebulae (ENT-5xxx) — 14 subtypes, polished by V5
  { id: 'ENT-5010', subtype: 'HII Giant',    shader: 'nebula-emission',        status: 'shipped', note: 'T-V-25 Doc 22 toggle set' },
  { id: 'ENT-5011', subtype: 'HII Compact',  shader: 'nebula-emission',        status: 'shipped', note: 'T-V-25' },
  { id: 'ENT-5012', subtype: 'HI Region',    shader: 'nebula-emission',        status: 'shipped', note: 'T-V-25 21cm hint palette' },
  { id: 'ENT-5020', subtype: 'PN Spherical', shader: 'nebula-planetary',       status: 'shipped', note: 'T-V-25 concentric shells' },
  { id: 'ENT-5021', subtype: 'PN Bipolar',   shader: 'nebula-planetary',       status: 'shipped', note: 'T-V-25 PN_BIPOLAR' },
  { id: 'ENT-5022', subtype: 'PN Irregular', shader: 'nebula-planetary',       status: 'shipped', note: 'T-V-25 PN_IRREGULAR cometary knots' },
  { id: 'ENT-5030', subtype: 'Reflection',   shader: 'nebula-reflection',      status: 'shipped' },
  { id: 'ENT-5040', subtype: 'Dark/MC',      shader: 'nebula-dark',            status: 'shipped', note: 'T-V-25 optical-depth extinction' },
  { id: 'ENT-5041', subtype: 'Bok Globule',  shader: 'nebula-dark',            status: 'shipped', note: 'T-V-25 DARK_BOK_GLOBULE' },
  { id: 'ENT-5050', subtype: 'SNR Shell',    shader: 'nebula-supernova',       status: 'shipped', note: 'T-V-26 renamed from nebula-snr alias' },
  { id: 'ENT-5051', subtype: 'SNR Plerion',  shader: 'nebula-supernova',       status: 'shipped', note: 'T-V-25 SNR_PLERION center-bright' },
  { id: 'ENT-5060', subtype: 'Wolf-Rayet Nebula', shader: 'nebula-wolfrayet',  status: 'shipped', note: 'T-V-26 renamed from nebula-wr alias' },
  { id: 'ENT-5070', subtype: 'Protoplanetary', shader: 'nebula-protoplanetary', status: 'shipped', note: 'T-V-25 disk + bipolar jets' },
  { id: 'ENT-5080', subtype: 'Superbubble',    shader: 'nebula-superbubble',    status: 'shipped', note: 'T-V-25 ionized cavity' },

  // Galaxies (ENT-6xxx) — 19 subtypes, polished by V6
  { id: 'ENT-6010', subtype: 'Spiral (SA)',  shader: 'galaxy-spiral',     status: 'shipped', note: 'T-V-27' },
  { id: 'ENT-6011', subtype: 'Barred (SB)',  shader: 'galaxy-spiral',     status: 'shipped', note: 'T-V-27 HAS_BAR' },
  { id: 'ENT-6012', subtype: 'Lenticular',   shader: 'galaxy-lenticular', status: 'shipped' },
  { id: 'ENT-6020', subtype: 'Giant Elliptical', shader: 'galaxy-elliptical', status: 'shipped', note: 'T-V-27' },
  { id: 'ENT-6021', subtype: 'Dwarf Elliptical', shader: 'galaxy-elliptical', status: 'shipped', note: 'T-V-27 DWARF_ELLIPTICAL' },
  { id: 'ENT-6022', subtype: 'Dwarf Spheroidal', shader: 'galaxy-elliptical', status: 'shipped', note: 'T-V-27 DWARF_SPHEROIDAL' },
  { id: 'ENT-6030', subtype: 'Irregular I',  shader: 'galaxy-irregular', status: 'shipped', note: 'T-V-27' },
  { id: 'ENT-6031', subtype: 'Irregular II', shader: 'galaxy-irregular', status: 'shipped', note: 'T-V-27 IRR_II dust chaos' },
  { id: 'ENT-6040', subtype: 'Seyfert',      shader: 'galaxy-agn',       status: 'shipped', note: 'T-V-27 AGN_SEYFERT' },
  { id: 'ENT-6041', subtype: 'Quasar',       shader: 'galaxy-agn',       status: 'shipped', note: 'T-V-27 AGN_QUASAR' },
  { id: 'ENT-6042', subtype: 'Radio Galaxy', shader: 'galaxy-agn',       status: 'shipped', note: 'T-V-27 AGN_RADIO bipolar lobes' },
  { id: 'ENT-6043', subtype: 'Blazar',       shader: 'galaxy-agn',       status: 'shipped', note: 'T-V-27 AGN_BLAZAR aligned jet' },
  { id: 'ENT-6044', subtype: 'LINER',        shader: 'galaxy-agn',       status: 'shipped', note: 'T-V-27 AGN_LINER' },
  { id: 'ENT-6050', subtype: 'Starburst',    shader: 'galaxy-starburst', status: 'shipped', note: 'T-V-27' },
  { id: 'ENT-6051', subtype: 'Ring Galaxy',  shader: 'galaxy-morphology-special', status: 'shipped', note: 'T-V-27 MORPH_RING' },
  { id: 'ENT-6052', subtype: 'Jellyfish',    shader: 'galaxy-morphology-special', status: 'shipped', note: 'T-V-27 MORPH_JELLYFISH ram-pressure' },
  { id: 'ENT-6053', subtype: 'ULIRG',        shader: 'galaxy-starburst', status: 'shipped', note: 'T-V-27 SB_ULIRG' },
  { id: 'ENT-6054', subtype: 'Ultra-Diffuse',shader: 'galaxy-morphology-special', status: 'shipped', note: 'T-V-27 MORPH_ULTRA_DIFFUSE' },
  { id: 'ENT-6055', subtype: 'Merging',      shader: 'galaxy-morphology-special', status: 'shipped', note: 'T-V-27 MORPH_MERGING' },

  // LSS (ENT-7xxx) — 12 subtypes, V2 + V7
  { id: 'ENT-7010', subtype: 'Open Cluster',     shader: 'cluster-open',     status: 'shipped', note: 'T-V-11 NEBULOSITY_ON' },
  { id: 'ENT-7011', subtype: 'Globular Cluster', shader: 'cluster-globular', status: 'shipped', note: 'T-V-12 Plummer profile' },
  { id: 'ENT-7012', subtype: 'OB Association',   shader: 'cluster-ob',       status: 'shipped', note: 'T-V-13 HAS_PARENT_NEBULA' },
  { id: 'ENT-7020', subtype: 'Galaxy Group',     shader: 'lss-supercluster', status: 'shipped', note: 'T-V-29 LSS_GROUP; renderer swap T-V-58' },
  { id: 'ENT-7021', subtype: 'Galaxy Cluster',   shader: 'lss-supercluster', status: 'shipped', note: 'T-V-29 LSS_CLUSTER; renderer swap T-V-58' },
  { id: 'ENT-7022', subtype: 'Supercluster',     shader: 'lss-supercluster', status: 'shipped', note: 'T-V-29 LSS_SUPERCL; renderer swap T-V-58' },
  { id: 'ENT-7023', subtype: 'Cluster Collision',shader: 'cluster-collision', status: 'shipped', note: 'T-V-14 mergePhase animation' },
  { id: 'ENT-7030', subtype: 'Cosmic Filament',  shader: 'lss-filament',     status: 'shipped', note: 'T-V-29 tube shader; renderer swap T-V-58' },
  { id: 'ENT-7031', subtype: 'Cosmic Void',      shader: 'lss-void',         status: 'shipped', note: 'T-V-29 void dimming; renderer swap T-V-58' },
  { id: 'ENT-7032', subtype: 'Great Wall',       shader: 'lss-great-wall',   status: 'shipped', note: 'T-V-29 planar sheet; renderer swap T-V-58' },
  { id: 'ENT-7033', subtype: 'Lyman-α Blob',     shader: 'lyman-alpha-blob', status: 'shipped', note: 'T-V-15 volumetric 16-sample' },
  { id: 'ENT-7040', subtype: 'CMB',              shader: null,               status: 'inline',  note: 'CmbBoundarySphere — CLAUDE.md §1 texture exception' },

  // Exotic (ENT-8xxx) — 16 subtypes, all shipped
  { id: 'ENT-8010', subtype: 'Quark Star',      shader: 'exotic-compact',    status: 'shipped' },
  { id: 'ENT-8011', subtype: 'Strange Star',    shader: 'exotic-compact',    status: 'shipped' },
  { id: 'ENT-8012', subtype: 'Preon Star',      shader: 'exotic-compact',    status: 'shipped' },
  { id: 'ENT-8013', subtype: 'Boson Star',      shader: 'exotic-compact',    status: 'shipped' },
  { id: 'ENT-8014', subtype: 'Gravastar',       shader: 'exotic-compact',    status: 'shipped' },
  { id: 'ENT-8015', subtype: 'White Hole',      shader: 'exotic-gr-extreme', status: 'shipped' },
  { id: 'ENT-8016', subtype: 'Wormhole',        shader: 'exotic-gr-extreme', status: 'shipped' },
  { id: 'ENT-8017', subtype: 'Cosmic String',   shader: 'exotic-topology',   status: 'shipped' },
  { id: 'ENT-8018', subtype: 'DM Halo',         shader: 'exotic-dark',       status: 'shipped' },
  { id: 'ENT-8019', subtype: 'DE Void',         shader: 'exotic-dark',       status: 'shipped' },
  { id: 'ENT-8020', subtype: 'Magnetar',        shader: 'exotic-magnetar',   status: 'shipped' },
  { id: 'ENT-8021', subtype: 'Thorne-Zytkow',   shader: 'exotic-tzo',        status: 'shipped' },
  { id: 'ENT-8022', subtype: 'Primordial BH',   shader: 'exotic-primordial', status: 'shipped' },
  { id: 'ENT-8023', subtype: 'Quasi-Star',      shader: 'exotic-quasi-star', status: 'shipped' },
  { id: 'ENT-8024', subtype: 'Planck Star',     shader: 'exotic-planck',     status: 'shipped' },
  { id: 'ENT-8025', subtype: 'Naked Singularity', shader: 'exotic-gr-extreme', status: 'shipped' },
]);

export function assertUniqueEntIds(rows = ENT_COVERAGE_FIXTURE): void {
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.id)) {
      throw new Error(`Duplicate ENT-ID in fixture: ${row.id}`);
    }
    seen.add(row.id);
  }
}

export function countByStatus(
  rows: readonly EntCoverageRow[] = ENT_COVERAGE_FIXTURE,
): Record<CoverageStatus, number> {
  const counts: Record<CoverageStatus, number> = {
    shipped: 0,
    'in-progress': 0,
    planned: 0,
    inline: 0,
  };
  for (const row of rows) counts[row.status]++;
  return counts;
}
