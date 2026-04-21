#!/usr/bin/env node
/**
 * Star tile seeder (T26) — writes a deterministic star-tile fixture tree
 * that the Rust tile server (apps/tile-server) serves verbatim.
 *
 * Output layout matches `FilesystemTileStore`:
 *
 *   <out>/
 *     manifest.json
 *     stars/{z}/{x}/{y}/{level}.bin
 *
 * Usage:
 *   node scripts/seed-star-tiles.mjs [--out <dir>] [--stars <count>] [--seed <int>]
 *
 * Defaults:
 *   --out    ./data/tiles
 *   --stars  100000
 *   --seed   13371337
 *
 * The generator itself lives in `@cosmos/tile-decoder` so the preview
 * smoke layer can reuse it with the same seed and get byte-identical
 * output.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildStarManifest,
  generateStarCatalog,
} from '../packages/tile-decoder/dist/starSeedGenerator.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..');

function parseArgs(argv) {
  const args = { out: join(REPO_ROOT, 'data', 'tiles'), stars: 100_000, seed: 13_371_337 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') args.out = resolve(argv[++i]);
    else if (a === '--stars') args.stars = Number.parseInt(argv[++i], 10);
    else if (a === '--seed') args.seed = Number.parseInt(argv[++i], 10);
    else if (a === '-h' || a === '--help') {
      // eslint-disable-next-line no-console
      console.log('Usage: node scripts/seed-star-tiles.mjs [--out <dir>] [--stars <count>] [--seed <int>]');
      process.exit(0);
    } else {
      // eslint-disable-next-line no-console
      console.error(`Unknown arg: ${a}`);
      process.exit(2);
    }
  }
  return args;
}

async function main() {
  const { out, stars, seed } = parseArgs(process.argv.slice(2));
  // eslint-disable-next-line no-console
  console.log(`[seed-star-tiles] generating ~${stars} stars, seed=${seed}, out=${out}`);

  const catalog = generateStarCatalog({ totalStarCount: stars, seed });

  // Ensure output directory exists.
  await mkdir(out, { recursive: true });

  // Write manifest.
  const manifest = buildStarManifest(catalog);
  const manifestJson = JSON.stringify(manifest, null, 2);
  await writeFile(join(out, 'manifest.json'), manifestJson, 'utf8');

  // Write each tile. Addresses look like "stars/1/3/3/0"; strip the leading
  // "stars/" prefix for the filesystem path since the Rust store already
  // prepends `stars/` itself.
  let totalBytes = 0;
  for (const tile of catalog.tiles) {
    const rel = tile.address.replace(/^stars\//, '');
    const [z, x, y, level] = rel.split('/');
    const tilePath = join(out, 'stars', z, x, y, `${level}.bin`);
    await mkdir(dirname(tilePath), { recursive: true });
    await writeFile(tilePath, Buffer.from(tile.buffer));
    totalBytes += tile.buffer.byteLength;
    // eslint-disable-next-line no-console
    console.log(
      `  wrote ${tile.address}  (${tile.starCount.toString().padStart(6)} stars, ${tile.buffer.byteLength} B)`,
    );
  }

  // eslint-disable-next-line no-console
  console.log(
    `[seed-star-tiles] ${catalog.tiles.length} tiles, ${catalog.totalStars.toLocaleString()} stars, ${(
      totalBytes / 1024
    ).toFixed(1)} KB`,
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[seed-star-tiles] failed:', err);
  process.exit(1);
});
