/**
 * T-V-62 — Node-side visual-regression runner.
 *
 * Reads the committed `baseline/**` tree and a `--current <dir>` tree
 * produced by `tests/visual/capture.ts`, diffs each pair with the
 * pure-TS metrics in `metrics.ts` (ΔE2000 + SSIM + pHash), and prints
 * a table. Exits non-zero if any pair breaches Doc 33 thresholds.
 *
 * Usage:
 *   tsx tests/visual/runner.ts --current <path>
 *   tsx tests/visual/runner.ts --current <path> --baseline <path>
 *   tsx tests/visual/runner.ts --current <path> --fail-fast
 *
 * Default thresholds (Doc 33 §Visual QA):
 *   - ΔE2000 ≤ 5.0  (tightened to 3.0 for `star/`, 4.0 for `nebula/`)
 *   - SSIM ≥ 0.65
 *   - pHash Hamming ≤ 8
 */

import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PNG } from 'pngjs';

import {
  DEFAULT_THRESHOLDS,
  diffImages,
  passesThresholds,
  type DiffResult,
  type DiffThresholds,
  type ImageLike,
} from './metrics';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_BASELINE_DIR = resolve(HERE, 'baseline');

interface Args {
  current: string;
  baseline: string;
  failFast: boolean;
  verbose: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Args = {
    current: '',
    baseline: DEFAULT_BASELINE_DIR,
    failFast: false,
    verbose: true,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === '--current') out.current = resolve(argv[++i] ?? '');
    else if (a === '--baseline') out.baseline = resolve(argv[++i] ?? '');
    else if (a === '--fail-fast') out.failFast = true;
    else if (a === '--quiet') out.verbose = false;
    else if (a === '--verbose') out.verbose = true;
    else if (a === '--') continue;
    else throw new Error(`runner: unknown arg '${a}'`);
  }
  if (!out.current) {
    throw new Error('runner: --current <dir> is required');
  }
  return out;
}

/**
 * Doc 33 §4.2 per-family tightening. Families whose palette tolerance is
 * tighter than the global ΔE ≤ 5.0 inherit a stricter cap. Any other
 * family passes at the global default.
 */
function thresholdsFor(family: string): DiffThresholds {
  if (family === 'star') return { ...DEFAULT_THRESHOLDS, maxDeltaE2000: 3.0 };
  if (family === 'nebula') return { ...DEFAULT_THRESHOLDS, maxDeltaE2000: 4.0 };
  return DEFAULT_THRESHOLDS;
}

async function walkPngs(root: string): Promise<string[]> {
  const out: string[] = [];
  async function recurse(dir: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = join(dir, e.name);
      if (e.isDirectory()) await recurse(full);
      else if (e.isFile() && full.endsWith('.png')) out.push(full);
    }
  }
  await recurse(root);
  return out.sort();
}

async function loadPng(path: string): Promise<ImageLike> {
  const buf = await readFile(path);
  return new Promise<ImageLike>((res, rej) => {
    new PNG().parse(buf, (err, parsed) => {
      if (err) return rej(err);
      res({
        width: parsed.width,
        height: parsed.height,
        data: new Uint8ClampedArray(parsed.data),
      });
    });
  });
}

interface RowOutcome {
  relPath: string;
  family: string;
  entId: string;
  status: 'pass' | 'fail' | 'missing-current' | 'missing-baseline' | 'shape-mismatch' | 'error';
  diff?: DiffResult;
  thresholds?: DiffThresholds;
  error?: string;
}

function parseRel(relPath: string): { family: string; entId: string } {
  // baseline/<family>/<ENT-ID>.png
  const parts = relPath.replace(/\\/g, '/').split('/');
  const family = parts[0] ?? 'misc';
  const entId = (parts[parts.length - 1] ?? '').replace(/\.png$/, '');
  return { family, entId };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  const baselinePngs = await walkPngs(args.baseline);
  if (baselinePngs.length === 0) {
    console.error(`runner: no PNGs found under ${args.baseline}`);
    process.exit(2);
  }
  if (args.verbose) {
    console.log(
      `runner: diffing ${baselinePngs.length} baselines against ${args.current}`,
    );
  }

  const outcomes: RowOutcome[] = [];
  for (const baselinePath of baselinePngs) {
    const relPath = relative(args.baseline, baselinePath);
    const { family, entId } = parseRel(relPath);
    const currentPath = join(args.current, relPath);
    const thresholds = thresholdsFor(family);
    try {
      const [baseline, current] = await Promise.all([
        loadPng(baselinePath),
        loadPng(currentPath).catch(() => null),
      ]);
      if (!current) {
        outcomes.push({ relPath, family, entId, status: 'missing-current', thresholds });
        if (args.failFast) break;
        continue;
      }
      if (baseline.width !== current.width || baseline.height !== current.height) {
        outcomes.push({
          relPath,
          family,
          entId,
          status: 'shape-mismatch',
          thresholds,
          error: `baseline=${baseline.width}×${baseline.height} current=${current.width}×${current.height}`,
        });
        if (args.failFast) break;
        continue;
      }
      const diff = diffImages(baseline, current);
      const ok = passesThresholds(diff, thresholds);
      outcomes.push({
        relPath,
        family,
        entId,
        status: ok ? 'pass' : 'fail',
        diff,
        thresholds,
      });
      if (!ok && args.failFast) break;
    } catch (err) {
      outcomes.push({
        relPath,
        family,
        entId,
        status: 'error',
        thresholds,
        error: (err as Error).message,
      });
      if (args.failFast) break;
    }
  }

  // Extra: currents that have no baseline (new ENT-ID added without updating baselines)
  const currentPngs = await walkPngs(args.current);
  const baselineRels = new Set(
    baselinePngs.map((p) => relative(args.baseline, p).replace(/\\/g, '/')),
  );
  for (const currentPath of currentPngs) {
    const rel = relative(args.current, currentPath).replace(/\\/g, '/');
    if (baselineRels.has(rel)) continue;
    const { family, entId } = parseRel(rel);
    outcomes.push({
      relPath: rel,
      family,
      entId,
      status: 'missing-baseline',
    });
  }

  const pass = outcomes.filter((o) => o.status === 'pass').length;
  const fail = outcomes.filter((o) => o.status !== 'pass').length;

  if (args.verbose) {
    console.log('');
    console.log('ΔE2000    SSIM    pHash  family          ENT-ID     status');
    for (const o of outcomes) {
      const dE = o.diff ? o.diff.deltaE2000.toFixed(2).padStart(6, ' ') : '   --';
      const ssim = o.diff ? o.diff.ssim.toFixed(3).padStart(5, ' ') : '   --';
      const phash = o.diff ? String(o.diff.pHashHamming).padStart(4, ' ') : '  --';
      const fam = o.family.padEnd(15, ' ');
      const id = o.entId.padEnd(10, ' ');
      const extra = o.error ? `  ${o.error}` : '';
      console.log(`${dE}    ${ssim}    ${phash}   ${fam} ${id} ${o.status}${extra}`);
    }
    console.log('');
  }

  console.log(`runner: ${pass} pass / ${fail} fail (${outcomes.length} total)`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error('runner: fatal', err);
  process.exit(1);
});
