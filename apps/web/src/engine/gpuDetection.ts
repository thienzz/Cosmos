/**
 * GPU tier heuristic — maps a WebGL2 context's renderer string + capability
 * hints to a tier from Doc 10 §1. Intentionally conservative: unknown
 * hardware falls back to 'low' so the adaptive-quality logic can upgrade
 * once it has real FPS evidence.
 */

export type GpuTier = 'low' | 'mid' | 'high';

/** Subset of WebGL2 we rely on, so tests can pass a plain object. */
export interface GpuContextLike {
  getExtension(name: string): unknown;
  getParameter(param: number): number | string;
  MAX_TEXTURE_SIZE: number;
}

/** Information captured while probing a context. Exposed for telemetry/debug. */
export interface GpuProbe {
  tier: GpuTier;
  vendor: string | null;
  renderer: string | null;
  maxTextureSize: number;
  reason: string;
}

const HIGH_TIER_KEYWORDS = [
  /rtx\s?[234567]0\d{2}/i,
  /rtx\s?40\d{2}/i,
  /radeon\s+rx\s?[67]\d{3}/i,
  /radeon\s+pro/i,
  /m[12]\s?(pro|max|ultra)/i,
  /apple\s?m[234]/i,
  /a1[57]\s?pro/i,
];

const MID_TIER_KEYWORDS = [
  /gtx\s?1[06]\d{2}/i,
  /gtx\s?16\d{2}/i,
  /rtx\s?20[56]0/i,
  /rtx\s?30[56]0/i,
  /radeon\s+rx\s?[56]\d{3}/i,
  /iris\s?xe/i,
  /arc\s?[ab]\d/i,
  /apple\s?m1/i,
];

const LOW_TIER_KEYWORDS = [
  /intel.*\b(hd|uhd)\s?graphics/i,
  /mali/i,
  /adreno/i,
  /powervr/i,
  /swiftshader/i,
  /llvmpipe/i,
];

/**
 * Probe a live WebGL2 context. Throws if `WEBGL_debug_renderer_info` is
 * unavailable — rare, but caller should handle gracefully.
 */
export function probeGpu(gl: GpuContextLike): GpuProbe {
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info') as
    | { UNMASKED_VENDOR_WEBGL: number; UNMASKED_RENDERER_WEBGL: number }
    | null;

  let vendor: string | null = null;
  let renderer: string | null = null;
  if (debugInfo) {
    const vendorRaw = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const rendererRaw = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    if (typeof vendorRaw === 'string') vendor = vendorRaw;
    if (typeof rendererRaw === 'string') renderer = rendererRaw;
  }

  const maxTextureSizeRaw = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  const maxTextureSize = typeof maxTextureSizeRaw === 'number' ? maxTextureSizeRaw : 0;

  return classifyGpu({ vendor, renderer, maxTextureSize });
}

/** Pure tier classifier — exported for unit tests and offline probe results. */
export function classifyGpu(info: {
  vendor: string | null;
  renderer: string | null;
  maxTextureSize: number;
}): GpuProbe {
  const renderer = info.renderer ?? '';

  for (const pattern of LOW_TIER_KEYWORDS) {
    if (pattern.test(renderer)) {
      return {
        tier: 'low',
        vendor: info.vendor,
        renderer: info.renderer,
        maxTextureSize: info.maxTextureSize,
        reason: `matched low-tier pattern ${pattern}`,
      };
    }
  }

  for (const pattern of HIGH_TIER_KEYWORDS) {
    if (pattern.test(renderer)) {
      return {
        tier: 'high',
        vendor: info.vendor,
        renderer: info.renderer,
        maxTextureSize: info.maxTextureSize,
        reason: `matched high-tier pattern ${pattern}`,
      };
    }
  }

  for (const pattern of MID_TIER_KEYWORDS) {
    if (pattern.test(renderer)) {
      return {
        tier: 'mid',
        vendor: info.vendor,
        renderer: info.renderer,
        maxTextureSize: info.maxTextureSize,
        reason: `matched mid-tier pattern ${pattern}`,
      };
    }
  }

  // Capability-based fallback: maxTextureSize is a rough proxy for VRAM/age.
  if (info.maxTextureSize >= 16384) {
    return {
      tier: 'mid',
      vendor: info.vendor,
      renderer: info.renderer,
      maxTextureSize: info.maxTextureSize,
      reason: 'capability fallback: MAX_TEXTURE_SIZE ≥ 16384',
    };
  }
  if (info.maxTextureSize >= 8192) {
    return {
      tier: 'low',
      vendor: info.vendor,
      renderer: info.renderer,
      maxTextureSize: info.maxTextureSize,
      reason: 'capability fallback: MAX_TEXTURE_SIZE ≥ 8192',
    };
  }
  return {
    tier: 'low',
    vendor: info.vendor,
    renderer: info.renderer,
    maxTextureSize: info.maxTextureSize,
    reason: 'capability fallback: MAX_TEXTURE_SIZE < 8192',
  };
}
