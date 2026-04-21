import { COSMIC_WEB_FLAG_U32_INDICES, COSMIC_WEB_HEADER_BYTES } from '@cosmos/shared-types';
import { describe, expect, it } from 'vitest';


import { decodeCosmicWebMesh } from '../cosmicWeb';
import { TileDecodeError } from '../starTile';

function buildCosmicWeb(opts: { u32: boolean }): ArrayBuffer {
  const vertexCount = 4;
  const indexCount = 6; // 2 triangles
  const indexStride = opts.u32 ? 4 : 2;
  const buf = new ArrayBuffer(COSMIC_WEB_HEADER_BYTES + vertexCount * 16 + indexCount * indexStride);
  const v = new DataView(buf);
  v.setUint32(0, vertexCount, true);
  v.setUint32(4, indexCount, true);
  v.setFloat32(8, 2.5, true);
  v.setUint32(12, 1, true);
  v.setUint16(16, opts.u32 ? COSMIC_WEB_FLAG_U32_INDICES : 0, true);
  v.setUint16(18, 0, true);

  const vertices = [
    { x: 0, y: 0, z: 0, d: 0.1 },
    { x: 1, y: 0, z: 0, d: 0.2 },
    { x: 0, y: 1, z: 0, d: 0.3 },
    { x: 0, y: 0, z: 1, d: 0.4 },
  ];
  for (let i = 0; i < vertices.length; i++) {
    const vert = vertices[i]!;
    const o = COSMIC_WEB_HEADER_BYTES + i * 16;
    v.setFloat32(o + 0, vert.x, true);
    v.setFloat32(o + 4, vert.y, true);
    v.setFloat32(o + 8, vert.z, true);
    v.setFloat32(o + 12, vert.d, true);
  }

  const indices = [0, 1, 2, 0, 2, 3];
  const indexBase = COSMIC_WEB_HEADER_BYTES + vertexCount * 16;
  for (let i = 0; i < indices.length; i++) {
    if (opts.u32) v.setUint32(indexBase + i * 4, indices[i]!, true);
    else v.setUint16(indexBase + i * 2, indices[i]!, true);
  }
  return buf;
}

describe('decodeCosmicWebMesh', () => {
  it('decodes a u16-indexed mesh', () => {
    const buf = buildCosmicWeb({ u32: false });
    const mesh = decodeCosmicWebMesh(buf);
    expect(mesh.header.vertex_count).toBe(4);
    expect(mesh.header.index_count).toBe(6);
    expect(mesh.header.density_scale).toBeCloseTo(2.5);
    expect(mesh.positions.length).toBe(12);
    expect(mesh.positions[3]).toBeCloseTo(1); // vertex 1 x
    expect(mesh.densities[3]).toBeCloseTo(0.4);
    expect(mesh.indices).toBeInstanceOf(Uint16Array);
    expect(Array.from(mesh.indices)).toEqual([0, 1, 2, 0, 2, 3]);
  });

  it('decodes a u32-indexed mesh', () => {
    const buf = buildCosmicWeb({ u32: true });
    const mesh = decodeCosmicWebMesh(buf);
    expect(mesh.indices).toBeInstanceOf(Uint32Array);
    expect(Array.from(mesh.indices)).toEqual([0, 1, 2, 0, 2, 3]);
  });

  it('throws on truncated buffer', () => {
    const buf = buildCosmicWeb({ u32: false }).slice(0, 30);
    expect(() => decodeCosmicWebMesh(buf)).toThrow(TileDecodeError);
  });

  it('throws when index_count is not a multiple of 3', () => {
    const bad = new ArrayBuffer(COSMIC_WEB_HEADER_BYTES);
    const v = new DataView(bad);
    v.setUint32(0, 0, true);
    v.setUint32(4, 5, true); // not mod 3
    expect(() => decodeCosmicWebMesh(bad)).toThrow(TileDecodeError);
  });
});
