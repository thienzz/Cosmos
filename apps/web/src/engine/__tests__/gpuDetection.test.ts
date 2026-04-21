import { describe, expect, it } from 'vitest';

import { classifyGpu, probeGpu } from '../gpuDetection';
import type { GpuContextLike } from '../gpuDetection';

describe('classifyGpu', () => {
  it('maps RTX 4090 renderer strings to high tier', () => {
    const probe = classifyGpu({
      vendor: 'NVIDIA',
      renderer: 'NVIDIA GeForce RTX 4090/PCIe/SSE2',
      maxTextureSize: 16384,
    });
    expect(probe.tier).toBe('high');
  });

  it('maps Apple M2 Pro to high tier', () => {
    const probe = classifyGpu({
      vendor: 'Apple',
      renderer: 'Apple M2 Pro',
      maxTextureSize: 16384,
    });
    expect(probe.tier).toBe('high');
  });

  it('maps GTX 1660 to mid tier', () => {
    const probe = classifyGpu({
      vendor: 'NVIDIA',
      renderer: 'NVIDIA GeForce GTX 1660 Ti/PCIe/SSE2',
      maxTextureSize: 16384,
    });
    expect(probe.tier).toBe('mid');
  });

  it('maps Intel UHD Graphics to low tier', () => {
    const probe = classifyGpu({
      vendor: 'Intel',
      renderer: 'ANGLE (Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0)',
      maxTextureSize: 16384,
    });
    expect(probe.tier).toBe('low');
  });

  it('falls back to mid tier when renderer is unknown but texture size ≥ 16384', () => {
    const probe = classifyGpu({
      vendor: 'Unknown',
      renderer: 'SomeUnknownRenderer 2042',
      maxTextureSize: 16384,
    });
    expect(probe.tier).toBe('mid');
    expect(probe.reason).toMatch(/capability fallback/);
  });

  it('falls back to low tier when renderer is unknown and texture size < 16384', () => {
    const probe = classifyGpu({
      vendor: null,
      renderer: null,
      maxTextureSize: 4096,
    });
    expect(probe.tier).toBe('low');
  });

  it('swiftshader / llvmpipe software renderers drop to low', () => {
    expect(
      classifyGpu({
        vendor: 'Google Inc.',
        renderer: 'SwiftShader',
        maxTextureSize: 16384,
      }).tier,
    ).toBe('low');
    expect(
      classifyGpu({
        vendor: 'Mesa',
        renderer: 'llvmpipe (LLVM 15.0.0, 256 bits)',
        maxTextureSize: 16384,
      }).tier,
    ).toBe('low');
  });
});

describe('probeGpu', () => {
  it('returns a high-tier probe for a mocked RTX 4080 context', () => {
    const UNMASKED_VENDOR_WEBGL = 0x9245;
    const UNMASKED_RENDERER_WEBGL = 0x9246;
    const MAX_TEXTURE_SIZE = 0x0d33;

    const context: GpuContextLike = {
      MAX_TEXTURE_SIZE,
      getExtension: (name) =>
        name === 'WEBGL_debug_renderer_info'
          ? { UNMASKED_VENDOR_WEBGL, UNMASKED_RENDERER_WEBGL }
          : null,
      getParameter: (param) => {
        if (param === UNMASKED_VENDOR_WEBGL) return 'NVIDIA';
        if (param === UNMASKED_RENDERER_WEBGL) return 'NVIDIA GeForce RTX 4080';
        if (param === MAX_TEXTURE_SIZE) return 32768;
        return 0;
      },
    };

    const probe = probeGpu(context);
    expect(probe.tier).toBe('high');
    expect(probe.vendor).toBe('NVIDIA');
    expect(probe.renderer).toContain('RTX 4080');
    expect(probe.maxTextureSize).toBe(32768);
  });

  it('returns a capability-based probe when WEBGL_debug_renderer_info is unavailable', () => {
    const MAX_TEXTURE_SIZE = 0x0d33;
    const context: GpuContextLike = {
      MAX_TEXTURE_SIZE,
      getExtension: () => null,
      getParameter: (param) => (param === MAX_TEXTURE_SIZE ? 16384 : 0),
    };
    const probe = probeGpu(context);
    expect(probe.tier).toBe('mid');
    expect(probe.vendor).toBeNull();
    expect(probe.renderer).toBeNull();
  });
});
