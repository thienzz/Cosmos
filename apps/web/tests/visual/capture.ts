/**
 * T-V-61 — Playwright baseline capture driver.
 *
 * For each row in {@link ENT_COVERAGE_FIXTURE} (skipping `shader === null`
 * inline entries), navigate the standalone capture page (`visual-capture.html`)
 * with the row's ENT-ID, wait for the in-page `__captureReady` signal, and
 * screenshot the canvas to `tests/visual/baseline/<family>/<ENT-ID>.png`.
 *
 * Usage:
 *   pnpm --filter @cosmos/web test:visual:capture-all
 *   pnpm --filter @cosmos/web test:visual:capture ENT-1010
 *   pnpm --filter @cosmos/web test:visual:capture --outdir <path>
 *
 * Optional flags:
 *   --baseUrl <url>   default http://localhost:5183
 *   --outdir  <path>  default tests/visual/baseline
 *   --limit   <n>     stop after N rows (debug)
 *   --concurrency <n> parallel page contexts (default 4)
 *   --verbose         per-row logs (default true; pass --quiet to silence)
 *
 * Exits non-zero on any capture failure.
 */

import { mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium, type Browser, type Page } from '@playwright/test';

import { ENT_COVERAGE_FIXTURE, type EntCoverageRow } from '../entCoverage';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUTDIR = resolve(HERE, 'baseline');
const DEFAULT_BASE_URL = 'http://localhost:5183';
const DEFAULT_CONCURRENCY = 4;
const PER_PAGE_TIMEOUT_MS = 20_000;
const POST_READY_DWELL_MS = 50;
const FAILURE_RETRY_PASSES = 2; // serial passes after the parallel pass

interface Args {
  baseUrl: string;
  outdir: string;
  ids: string[]; // empty = all
  all: boolean;
  limit: number | null;
  concurrency: number;
  verbose: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Args = {
    baseUrl: DEFAULT_BASE_URL,
    outdir: DEFAULT_OUTDIR,
    ids: [],
    all: false,
    limit: null,
    concurrency: DEFAULT_CONCURRENCY,
    verbose: true,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === '--all') out.all = true;
    else if (a === '--quiet') out.verbose = false;
    else if (a === '--verbose') out.verbose = true;
    else if (a === '--baseUrl') out.baseUrl = argv[++i] ?? out.baseUrl;
    else if (a === '--outdir') out.outdir = resolve(argv[++i] ?? out.outdir);
    else if (a === '--limit') out.limit = Number.parseInt(argv[++i] ?? '0', 10);
    else if (a === '--concurrency') {
      out.concurrency = Math.max(1, Number.parseInt(argv[++i] ?? '4', 10));
    } else if (a.startsWith('ENT-')) out.ids.push(a);
    else if (a === '--' || a === '') continue;
    else throw new Error(`capture: unknown arg '${a}'`);
  }
  if (!out.all && out.ids.length === 0) {
    throw new Error(
      'capture: pass --all to capture every row, or one or more ENT-IDs.',
    );
  }
  return out;
}

/**
 * Family bucket for output directory layout. Mirrors Doc 17 §0.1 nine
 * top-level categories so baseline browsing is one folder per family.
 */
function familyForRow(row: EntCoverageRow): string {
  const id = row.id;
  if (id.startsWith('ENT-1')) return 'star';
  if (id.startsWith('ENT-2')) {
    if (row.shader === 'planet-gas') return 'gas-giant';
    if (row.shader === 'planet-extreme') return 'extreme-planet';
    return 'rocky-planet';
  }
  if (id.startsWith('ENT-3')) return 'moon';
  if (id.startsWith('ENT-4')) {
    if (row.shader?.includes('comet')) return 'comet';
    if (row.shader === 'meteoroid-stream') return 'meteoroid';
    return 'small-body';
  }
  if (id.startsWith('ENT-5')) return 'nebula';
  if (id.startsWith('ENT-6')) return 'galaxy';
  if (id.startsWith('ENT-7')) {
    if (row.shader?.startsWith('cluster-')) return 'cluster';
    if (row.shader?.startsWith('transient-')) return 'transient';
    return 'lss';
  }
  if (id.startsWith('ENT-8')) return 'exotic';
  return 'misc';
}

interface CaptureTask {
  row: EntCoverageRow;
  family: string;
  outPath: string;
}

interface CaptureOutcome {
  task: CaptureTask;
  ok: boolean;
  error?: string;
  shaderKeyOnPage?: string;
}

async function captureOne(
  page: Page,
  baseUrl: string,
  task: CaptureTask,
): Promise<CaptureOutcome> {
  const url = `${baseUrl}/visual-capture.html?entId=${encodeURIComponent(task.row.id)}&shader=${encodeURIComponent(task.row.shader ?? '')}`;
  try {
    await page.goto(url, { waitUntil: 'load', timeout: PER_PAGE_TIMEOUT_MS });
    await page.waitForFunction(
      () => (window as unknown as { __captureReady?: boolean }).__captureReady === true,
      undefined,
      { timeout: PER_PAGE_TIMEOUT_MS },
    );
    const inPageError = await page.evaluate(
      () => (window as unknown as { __captureError?: string }).__captureError,
    );
    if (inPageError) {
      return { task, ok: false, error: `page error: ${inPageError}` };
    }
    const shaderKeyOnPage = await page.evaluate(
      () =>
        (window as unknown as { __captureShaderKey?: string }).__captureShaderKey,
    );
    // Tiny extra dwell so the post-ready frame is fully composited before
    // grabbing the framebuffer (some headless drivers need an extra tick).
    await page.waitForTimeout(POST_READY_DWELL_MS);
    await mkdir(dirname(task.outPath), { recursive: true });
    await page.locator('#capture-canvas').screenshot({
      path: task.outPath,
      type: 'png',
      omitBackground: false,
    });
    return { task, ok: true, shaderKeyOnPage };
  } catch (err) {
    return { task, ok: false, error: (err as Error).message };
  }
}

async function runWithPool<T, U>(
  items: readonly T[],
  size: number,
  worker: (item: T, idx: number) => Promise<U>,
): Promise<U[]> {
  const results: U[] = new Array(items.length);
  let cursor = 0;
  async function pump(): Promise<void> {
    while (true) {
      const idx = cursor++;
      if (idx >= items.length) return;
      results[idx] = await worker(items[idx]!, idx);
    }
  }
  const workers: Promise<void>[] = [];
  const n = Math.min(size, items.length);
  for (let i = 0; i < n; i++) workers.push(pump());
  await Promise.all(workers);
  return results;
}

async function withBrowserPool<T>(
  browser: Browser,
  size: number,
  fn: (pages: Page[]) => Promise<T>,
): Promise<T> {
  const contexts = await Promise.all(
    Array.from({ length: size }, () =>
      browser.newContext({
        viewport: { width: 600, height: 600 },
        deviceScaleFactor: 1,
      }),
    ),
  );
  const pages = await Promise.all(contexts.map((c) => c.newPage()));
  try {
    return await fn(pages);
  } finally {
    await Promise.all(contexts.map((c) => c.close().catch(() => undefined)));
  }
}

function selectRows(args: Args): CaptureTask[] {
  const wanted = new Set(args.ids);
  const rows = ENT_COVERAGE_FIXTURE.filter((r) => {
    if (r.shader === null) return false; // inline-rendered (CMB only)
    if (args.all) return true;
    return wanted.has(r.id);
  });
  const limited = args.limit && args.limit > 0 ? rows.slice(0, args.limit) : rows;
  return limited.map((row) => {
    const family = familyForRow(row);
    return {
      row,
      family,
      outPath: join(args.outdir, family, `${row.id}.png`),
    };
  });
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const tasks = selectRows(args);
  if (tasks.length === 0) {
    console.error('capture: no rows selected');
    process.exit(2);
  }
  const skipped = ENT_COVERAGE_FIXTURE.filter((r) => r.shader === null);
  console.log(
    `capture: planning ${tasks.length} screenshots (${skipped.length} skipped — inline shaders) → ${args.outdir}`,
  );

  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
  });
  const startMs = performance.now();
  const logRow = (idx: number, total: number, r: CaptureOutcome): void => {
    if (!args.verbose) return;
    const tag = r.ok ? 'ok ' : 'FAIL';
    const family = r.task.family.padEnd(14, ' ');
    const idStr = r.task.row.id.padEnd(9, ' ');
    const note = r.ok
      ? `${r.shaderKeyOnPage ?? r.task.row.shader ?? '?'}`
      : (r.error ?? 'unknown');
    console.log(
      `  [${String(idx + 1).padStart(3, ' ')}/${total}] ${tag} ${idStr} ${family} ${note}`,
    );
  };

  const outcomes = await withBrowserPool(browser, args.concurrency, (pages) =>
    runWithPool(tasks, args.concurrency, (task, idx) =>
      captureOne(pages[idx % pages.length]!, args.baseUrl, task).then((r) => {
        logRow(idx, tasks.length, r);
        return r;
      }),
    ),
  );

  // Race conditions during the parallel pass occasionally leave a few
  // outcomes with `Element is not attached to the DOM` /
  // `Execution context was destroyed` / waitForFunction timeouts. Retry
  // them serially in a single fresh page — same harness, no concurrency
  // pressure. Two retry passes covers all observed flakes.
  for (let pass = 1; pass <= FAILURE_RETRY_PASSES; pass++) {
    const stillFailing = outcomes
      .map((o, i) => ({ o, i }))
      .filter((p) => !p.o.ok);
    if (stillFailing.length === 0) break;
    if (args.verbose) {
      console.log(`capture: retry pass ${pass} (${stillFailing.length} failures)`);
    }
    await withBrowserPool(browser, 1, async (pages) => {
      const page = pages[0]!;
      for (const { o, i } of stillFailing) {
        const retry = await captureOne(page, args.baseUrl, o.task);
        outcomes[i] = retry;
        logRow(i, tasks.length, retry);
      }
    });
  }
  await browser.close();

  const failures = outcomes.filter((o) => !o.ok);
  const successes = outcomes.length - failures.length;
  const durSec = ((performance.now() - startMs) / 1000).toFixed(1);
  console.log('');
  console.log(`capture: ${successes}/${outcomes.length} successes in ${durSec}s`);
  if (failures.length > 0) {
    console.log(`capture: ${failures.length} FAILURES:`);
    for (const f of failures.slice(0, 20)) {
      console.log(`  - ${f.task.row.id} (${f.task.family}): ${f.error}`);
    }
    if (failures.length > 20) console.log(`  … and ${failures.length - 20} more`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('capture: fatal', err);
  process.exit(1);
});
