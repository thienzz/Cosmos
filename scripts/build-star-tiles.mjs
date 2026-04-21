#!/usr/bin/env node
/**
 * Octree tile pyramid builder for the T40 stellar catalog.
 *
 * Reads real Hipparcos positions from
 * `data/catalogs/raw/hipparcos_bright.csv`, projects them to ICRS Cartesian
 * parsecs (Doc 23 §2.1), buckets by Doc 11 §5.1 octree tile footprint, and
 * writes binary tiles (Doc 11 §4.1) + a `manifest.json` so the Rust
 * `FilesystemTileStore` can serve them verbatim.
 *
 * Complements `scripts/seed-star-tiles.mjs`:
 *   - `seed-star-tiles.mjs`  — ~100k SYNTHETIC stars (Mulberry32 sim)
 *   - `build-star-tiles.mjs` — REAL Hipparcos bright positions (this script)
 *
 * When the full T40 Gaia DR3 G<16 ingest lands, this script swaps the CSV
 * path for the Postgres `stars` table (streamed via `COPY TO`) — the
 * bucketing + write logic stays the same.
 *
 * Output layout:
 *
 *   <out>/
 *     manifest.json
 *     stars/{z}/{x}/{y}/{level}.bin
 *
 * Usage:
 *   node scripts/build-star-tiles.mjs [--out <dir>] [--csv <path>]
 *
 * Defaults:
 *   --out  ./data/tiles-hipparcos
 *   --csv  ./data/catalogs/raw/hipparcos_bright.csv
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  POPULATED_TILE_ADDRESSES,
  TILE_ROOT_MAX_PC,
  TILE_ROOT_MIN_PC,
  TILE_ROOT_SIZE_PC,
  icrsToCartesianPc,
} from '../packages/tile-decoder/dist/starSeedGenerator.js';
import {
  encodeStarTile,
  packColorIndex,
  packMagnitude,
} from '../packages/tile-decoder/dist/starTileEncode.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..');

// Spectral-class → Doc 11 §4.1 code (0=O, 1=B, 2=A, 3=F, 4=G, 5=K, 6=M, 7=Unknown)
const SPECTRAL_CODE = { O: 0, B: 1, A: 2, F: 3, G: 4, K: 5, M: 6 };

function parseArgs(argv) {
  const args = {
    out: join(REPO_ROOT, 'data', 'tiles-hipparcos'),
    csv: join(REPO_ROOT, 'data', 'catalogs', 'raw', 'hipparcos_bright.csv'),
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') args.out = resolve(argv[++i]);
    else if (a === '--csv') args.csv = resolve(argv[++i]);
    else if (a === '-h' || a === '--help') {
      // eslint-disable-next-line no-console
      console.log(
        'Usage: node scripts/build-star-tiles.mjs [--out <dir>] [--csv <path>]',
      );
      process.exit(0);
    } else {
      // eslint-disable-next-line no-console
      console.error(`Unknown arg: ${a}`);
      process.exit(2);
    }
  }
  return args;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  const header = lines[0].split(',');
  const idx = Object.fromEntries(header.map((k, i) => [k, i]));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = splitCsvLine(lines[i]);
    const plx = Number.parseFloat(parts[idx.parallax_mas]);
    const distance =
      Number.isFinite(plx) && plx > 1 ? 1000 / plx : null; // clamp to d < 1 kpc
    rows.push({
      hip: Number.parseInt(parts[idx.hip], 10),
      name: parts[idx.name] || null,
      bayer: parts[idx.bayer] || null,
      ra: Number.parseFloat(parts[idx.ra_deg]),
      dec: Number.parseFloat(parts[idx.dec_deg]),
      mag: Number.parseFloat(parts[idx.mag_v]),
      bp_rp: Number.parseFloat(parts[idx.bp_rp]),
      spectral: parts[idx.spectral_type],
      distance,
    });
  }
  return rows;
}

/** Minimal CSV splitter — the seed files don't use quoted commas today. */
function splitCsvLine(line) {
  return line.split(',');
}

function cellSizeAt(depth) {
  return TILE_ROOT_SIZE_PC / Math.pow(8, depth);
}

function tileBounds(z, x, y) {
  const cell = cellSizeAt(z);
  const minX = TILE_ROOT_MIN_PC + x * cell;
  const minY = TILE_ROOT_MIN_PC + y * cell;
  return {
    min: { x: minX, y: minY, z: TILE_ROOT_MIN_PC },
    max: { x: minX + cell, y: minY + cell, z: TILE_ROOT_MAX_PC },
  };
}

function addressForPosition(x, y) {
  for (const addr of POPULATED_TILE_ADDRESSES) {
    const b = tileBounds(addr.z, addr.x, addr.y);
    if (x >= b.min.x && x < b.max.x && y >= b.min.y && y < b.max.y) return addr;
  }
  return null;
}

function addressString(a) {
  return `stars/${a.z}/${a.x}/${a.y}/${a.level}`;
}

function spectralCode(spectral) {
  if (!spectral) return 7;
  const first = spectral.trim().toUpperCase()[0];
  const code = SPECTRAL_CODE[first];
  return code === undefined ? 7 : code;
}

async function main() {
  const { out, csv } = parseArgs(process.argv.slice(2));
  // eslint-disable-next-line no-console
  console.log(`[build-star-tiles] reading ${csv}`);
  const text = await readFile(csv, 'utf-8');
  const rows = parseCsv(text);

  // Bucket by tile footprint.
  const buckets = new Map();
  for (const addr of POPULATED_TILE_ADDRESSES) {
    buckets.set(addressString(addr), { addr, stars: [] });
  }
  let outOfBox = 0;
  let unknownDistance = 0;
  let tileId = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r.distance === null || !Number.isFinite(r.distance)) {
      unknownDistance++;
      continue;
    }
    const { x, y, z } = icrsToCartesianPc(r.ra, r.dec, r.distance);
    const addr = addressForPosition(x, y);
    if (!addr) {
      outOfBox++;
      continue;
    }
    const bucket = buckets.get(addressString(addr));
    const b = tileBounds(addr.z, addr.x, addr.y);
    const cx = 0.5 * (b.min.x + b.max.x);
    const cy = 0.5 * (b.min.y + b.max.y);
    bucket.stars.push({
      x: x - cx,
      y: y - cy,
      z,
      magnitude: packMagnitude(Number.isFinite(r.mag) ? r.mag : 15),
      colorIndex: packColorIndex(Number.isFinite(r.bp_rp) ? r.bp_rp : 1.0),
      spectralType: spectralCode(r.spectral),
      flags: 0,
      catalogIndex: i & 0xffff,
      distancePc: r.distance,
    });
  }

  // eslint-disable-next-line no-console
  console.log(
    `[build-star-tiles] parsed ${rows.length} rows — ${outOfBox} out-of-root, ${unknownDistance} no-distance`,
  );

  // Emit binary tiles.
  await mkdir(out, { recursive: true });
  const tiles = [];
  for (const [key, { addr, stars }] of buckets) {
    if (stars.length === 0) continue;
    const distances = stars.map((s) => s.distancePc);
    const buffer = encodeStarTile({
      tileId: ++tileId,
      minDistance: Math.min(...distances),
      maxDistance: Math.max(...distances),
      stars,
    });
    const tilePath = join(out, 'stars', String(addr.z), String(addr.x), String(addr.y), `${addr.level}.bin`);
    await mkdir(dirname(tilePath), { recursive: true });
    await writeFile(tilePath, Buffer.from(buffer));
    tiles.push({
      address: key,
      boundsPc: tileBounds(addr.z, addr.x, addr.y),
      starCount: stars.length,
      sizeBytes: buffer.byteLength,
    });
    // eslint-disable-next-line no-console
    console.log(`[build-star-tiles] wrote ${key} (${stars.length} stars)`);
  }

  // Manifest — matches the shape the web client reads in `TileStreamingManager`.
  const manifest = {
    version: `hipparcos-${new Date().toISOString().slice(0, 10)}`,
    totalTiles: tiles.length,
    source: 'hipparcos_bright',
    rootBoundsPc: {
      min: { x: TILE_ROOT_MIN_PC, y: TILE_ROOT_MIN_PC, z: TILE_ROOT_MIN_PC },
      max: { x: TILE_ROOT_MAX_PC, y: TILE_ROOT_MAX_PC, z: TILE_ROOT_MAX_PC },
    },
    tiles,
    generatedAt: new Date().toISOString(),
  };
  await writeFile(join(out, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8');
  // eslint-disable-next-line no-console
  console.log(`[build-star-tiles] wrote ${tiles.length} tiles + manifest to ${out}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[build-star-tiles] failed:', err);
  process.exit(1);
});
