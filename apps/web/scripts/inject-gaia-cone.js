/**
 * T-D-post — dev demo: fetch a cone of Gaia stars and inject them into
 * the running scene via StarFieldRenderer.setSeed.
 *
 * Paste into preview_eval (IIFE wrapper) or copy into the devtools
 * console:
 *
 *   const result = await (await fetch('/apps/web/scripts/inject-gaia-cone.js'))
 *     .text();
 *   new Function(result)();
 *
 * Options via URL:
 *   ?ra=101.2875&dec=-16.7161&radius=10&limit=5000
 */
(async () => {
  const params = new URLSearchParams(location.search);
  const ra = Number(params.get('ra') ?? 101.2875);       // Sirius
  const dec = Number(params.get('dec') ?? -16.7161);
  const radiusDeg = Number(params.get('radius') ?? 10);
  const limit = Number(params.get('limit') ?? 5000);

  const url = `http://localhost:3010/v1/search/cone?ra=${ra}&dec=${dec}&radius_deg=${radiusDeg}&limit=${limit}`;
  console.info('[gaia-inject] fetching', url);
  const res = await fetch(url);
  const body = await res.json();
  const items = body.data?.items ?? [];
  const gaia = items.filter((it) => (it.name ?? '').startsWith('Gaia DR3'));
  console.info(`[gaia-inject] ${gaia.length} Gaia stars of ${items.length} total in cone`);

  if (!window.__cosmosEngine) {
    console.error('[gaia-inject] engine not ready');
    return { error: 'no engine' };
  }
  const engine = window.__cosmosEngine;
  const starField = engine.starField;
  if (!starField) {
    console.error('[gaia-inject] no starField on engine');
    return { error: 'no starField' };
  }

  // Scene scale: 500 scene units per parsec (Doc 12 / coordinate-utils DEFAULT_SCENE_SCALE).
  const UNITS_PER_PC = 500;
  const DEG_TO_RAD = Math.PI / 180;

  const icrsToXyz = (raDeg, decDeg, distPc) => {
    const raRad = raDeg * DEG_TO_RAD;
    const decRad = decDeg * DEG_TO_RAD;
    const d = distPc * UNITS_PER_PC;
    const cd = Math.cos(decRad);
    return { x: d * cd * Math.cos(raRad), y: d * cd * Math.sin(raRad), z: d * Math.sin(decRad) };
  };

  // Rough spectral class from magnitude (bp_rp not in cone response).
  // Gaia colour info lives in properties; for rendering we pick white.
  const color = { r: 1, g: 1, b: 1 };

  const toSeed = (it, i) => {
    if (it.distance_pc == null || it.distance_pc <= 0) return null;
    const pos = icrsToXyz(it.ra_deg, it.dec_deg, it.distance_pc);
    return {
      position: pos,
      color,
      magnitude: typeof it.magnitude === 'number' ? it.magnitude : 12,
      spectralClass: 'G',
      twinklePhase: (i * 0.618) % (2 * Math.PI),
    };
  };

  const newSeed = gaia.map(toSeed).filter((s) => s !== null);
  const existing = starField.getSeed();
  const combined = [...existing, ...newSeed];
  starField.setSeed(combined);

  console.info(`[gaia-inject] setSeed complete — before=${existing.length}, added=${newSeed.length}, total=${combined.length}`);

  return { total: combined.length, added: newSeed.length, firstXyz: newSeed[0]?.position };
})();
