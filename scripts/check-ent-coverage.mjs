#!/usr/bin/env node
// scripts/check-ent-coverage.mjs
//
// CI gate for Phase 2 (T41–T48): parses docs/17-coverage-checklist.md and
// verifies every Doc 17 ENT-ID is accounted for with a shader file, owning
// task, and valid status.
//
// Usage:
//   node scripts/check-ent-coverage.mjs
//     -> asserts total = EXPECTED_TOTAL, no duplicates, all statuses valid,
//        deferred rows have notes, shader files exist on disk.
//   node scripts/check-ent-coverage.mjs --require-shipped 1010-1040
//     -> additionally asserts every ENT-ID in the given range has status='shipped'.
//   node scripts/check-ent-coverage.mjs --range 8010-8025
//     -> filter reporting to a subrange (prints table for those rows).
//
// Exit code: 0 on pass, 1 on any violation.

import { readFile, access } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const CHECKLIST_PATH = join(REPO_ROOT, "docs", "17-coverage-checklist.md");

// Doc 17 footer line 14003–14010: 31+27+15+20+14+19+12+16 = 154.
// If CLAUDE.md or Doc 17 count changes, update here (it's the single source).
const EXPECTED_TOTAL = 154;
const VALID_STATUSES = new Set(["planned", "in-progress", "shipped", "deferred"]);

const args = process.argv.slice(2);

function parseRangeFlag(flag) {
  const idx = args.indexOf(flag);
  if (idx === -1) return null;
  const value = args[idx + 1];
  if (!value) fatal(`${flag} requires a range argument like 1010-1040`);
  const m = /^(\d{4})-(\d{4})$/.exec(value);
  if (!m) fatal(`${flag} expects NNNN-NNNN, got "${value}"`);
  const lo = Number(m[1]);
  const hi = Number(m[2]);
  if (hi < lo) fatal(`${flag} range high (${hi}) < low (${lo})`);
  return { lo, hi };
}

const requireShippedRange = parseRangeFlag("--require-shipped");
const filterRange = parseRangeFlag("--range");

function fatal(msg) {
  console.error(`[check-ent-coverage] ERROR: ${msg}`);
  process.exit(1);
}

function parseChecklist(md) {
  // Pull every markdown table row that starts with "| ENT-NNNN |" and extract
  // ENT-ID | subtype | shader | task | status | notes.
  const rows = [];
  const lineRe = /^\|\s*(ENT-\d{4})\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|/;
  let lineNo = 0;
  for (const line of md.split(/\r?\n/)) {
    lineNo++;
    const m = lineRe.exec(line);
    if (!m) continue;
    rows.push({
      entId: m[1],
      subtype: m[2].trim(),
      shader: m[3].trim(),
      task: m[4].trim(),
      status: m[5].trim(),
      notes: m[6].trim(),
      lineNo,
    });
  }
  return rows;
}

function stripCode(s) {
  return s.replace(/^`|`$/g, "").trim();
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const md = await readFile(CHECKLIST_PATH, "utf8").catch((e) => {
    fatal(`cannot read ${CHECKLIST_PATH}: ${e.message}`);
  });

  const rows = parseChecklist(md);
  const errors = [];
  const warnings = [];

  // 1. Total count.
  if (rows.length !== EXPECTED_TOTAL) {
    errors.push(`total rows = ${rows.length}, expected ${EXPECTED_TOTAL}`);
  }

  // 2. Duplicate ENT-IDs.
  const seen = new Map();
  for (const r of rows) {
    if (seen.has(r.entId)) {
      errors.push(`duplicate ${r.entId} at lines ${seen.get(r.entId).lineNo} + ${r.lineNo}`);
    } else {
      seen.set(r.entId, r);
    }
  }

  // 3. Valid status + deferred-needs-notes.
  for (const r of rows) {
    if (!VALID_STATUSES.has(r.status)) {
      errors.push(`${r.entId} line ${r.lineNo}: invalid status "${r.status}"`);
    }
    if (r.status === "deferred" && !r.notes) {
      errors.push(`${r.entId} line ${r.lineNo}: status=deferred requires non-empty notes`);
    }
  }

  // 4. Shader file existence check — skip for italic placeholders like
  //    "(TubeGeometry, IllustrisTNG mesh)" or "(Planck 2018 texture — exception …)".
  //    These are scene-level meshes or texture assets, not shader files.
  const shaderCheckPromises = [];
  for (const r of rows) {
    const shader = stripCode(r.shader);
    if (shader.startsWith("*(") || shader.startsWith("(")) continue;
    const abs = resolve(REPO_ROOT, shader);
    shaderCheckPromises.push(
      fileExists(abs).then((exists) => {
        if (!exists && r.status === "shipped") {
          errors.push(`${r.entId} line ${r.lineNo}: status=shipped but shader file missing: ${shader}`);
        } else if (!exists && r.status === "in-progress") {
          warnings.push(`${r.entId}: in-progress, shader file not yet present: ${shader}`);
        }
      }),
    );
  }
  await Promise.all(shaderCheckPromises);

  // 5. Optional --require-shipped enforcement.
  if (requireShippedRange) {
    const { lo, hi } = requireShippedRange;
    for (const r of rows) {
      const num = Number(r.entId.slice(4));
      if (num < lo || num > hi) continue;
      if (r.status !== "shipped") {
        errors.push(
          `${r.entId} (in require-shipped range ${lo}-${hi}) has status="${r.status}", expected "shipped"`,
        );
      }
    }
  }

  // 6. Optional --range filter for human-readable output.
  const toPrint = filterRange
    ? rows.filter((r) => {
        const num = Number(r.entId.slice(4));
        return num >= filterRange.lo && num <= filterRange.hi;
      })
    : rows;

  // Count per status.
  const statusCounts = { planned: 0, "in-progress": 0, shipped: 0, deferred: 0 };
  for (const r of rows) {
    if (statusCounts[r.status] !== undefined) statusCounts[r.status]++;
  }

  console.log(`[check-ent-coverage] rows parsed: ${rows.length} (expected ${EXPECTED_TOTAL})`);
  console.log(
    `  shipped=${statusCounts.shipped}  in-progress=${statusCounts["in-progress"]}  planned=${statusCounts.planned}  deferred=${statusCounts.deferred}`,
  );
  if (filterRange) {
    console.log(`\nRows in range ${filterRange.lo}-${filterRange.hi}:`);
    for (const r of toPrint) {
      console.log(`  ${r.entId}  ${r.status.padEnd(11)}  ${r.subtype}  [${r.task}]`);
    }
  }
  if (warnings.length) {
    console.log("\nWarnings:");
    for (const w of warnings) console.log(`  - ${w}`);
  }
  if (errors.length) {
    console.error("\nErrors:");
    for (const e of errors) console.error(`  - ${e}`);
    console.error(`\n[check-ent-coverage] FAIL (${errors.length} errors)`);
    process.exit(1);
  }
  console.log("\n[check-ent-coverage] OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
