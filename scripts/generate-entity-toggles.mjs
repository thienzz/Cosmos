#!/usr/bin/env node
/**
 * scripts/generate-entity-toggles.mjs — T52 Doc 22 parser.
 *
 * Parses `docs/22-interactive-toggle-features.md` (the canonical 96-entity
 * toggle catalog) and the five per-category crossref reports into a single
 * generated TypeScript file at
 *   `packages/shared-types/src/entityToggles.ts`.
 *
 * Usage:
 *   node scripts/generate-entity-toggles.mjs
 *     -> regenerates `entityToggles.ts` on disk.
 *   node scripts/generate-entity-toggles.mjs --check
 *     -> regenerates in memory + diffs against disk; exit 1 on any drift.
 *        Meant for CI — fails if Doc 22 was edited but the TS file wasn't.
 *
 * Rules (per T52 spec):
 *   - 96 entities × ~26 features.
 *   - Every entity has a universal "Camera" section (3 features).
 *   - Uniform naming: Doc 22 §2.4 camel-case ("Great Red Spot" →
 *     `u_greatRedSpot`). Doc 22 tables already write them as `uGreatRedSpot`
 *     or `u_greatRedSpot` depending on vintage — we normalise to
 *     `u_<camelCase>` to match the in-repo shader convention (`u_cloudColor`,
 *     `u_atmosphereStrength`, etc.).
 *   - Default column: ON → defaultOn=true, anything else (OFF, SELF, 86400x,
 *     ...) → defaultOn=false. Non-boolean defaults are preserved in
 *     `defaultLabel` so the UI can show "86400x".
 *
 * The output is ONLY a spec (shape, defaults, descriptions). Wiring a
 * toggle to a real shader uniform is done elsewhere (hot-path lookup in
 * the engine); toggles whose uniform doesn't exist in any ShaderMaterial
 * render as "educational-only" per T52.
 */

import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const DOC22 = join(REPO_ROOT, "docs", "22-interactive-toggle-features.md");
const CROSSREF_DOCS = [
  "22-stars-feature-crossref.md",
  "22-rocky-planets-feature-crossref.md",
  "22-gas-giants-feature-crossref.md",
  "22-moons-feature-crossref.md",
  "22-nebulae-galaxies-smallbodies-exotic-feature-crossref.md",
].map((f) => join(REPO_ROOT, "docs", f));
const OUT = join(
  REPO_ROOT,
  "packages",
  "shared-types",
  "src",
  "entityToggles.ts",
);

const EXPECTED_ENTITY_COUNT = 96;

const args = process.argv.slice(2);
const CHECK_MODE = args.includes("--check");

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * An entity header looks like:
 *   ### Jupiter-Type
 *   ### G-Type (Sun-like)
 *   ### 4.16 Protostar (Class 0 / Class I)      (v4.1 additions use N.M prefix)
 * followed on the next non-blank line by:
 *   **Entity ID:** ENT-2020
 */
function parseDoc22(md) {
  const lines = md.split(/\r?\n/);
  const entities = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Only `### ` (h3), not `#### ` or deeper.
    if (!/^### (?!#)/.test(line)) continue;
    // Strip "### " prefix + optional "N.M " section-number prefix.
    const titleRaw = line.replace(/^###\s+/, "");
    const title = titleRaw.replace(/^\d+\.\d+\s+/, "").trim();

    // The next non-blank line should be the Entity ID marker. Scan forward
    // up to 3 lines — blank lines between are permitted.
    let entId = null;
    for (let j = i + 1; j <= Math.min(i + 3, lines.length - 1); j++) {
      const m = /^\*\*Entity ID:\*\*\s*(ENT-\d{4})/.exec(lines[j]);
      if (m) {
        entId = m[1];
        break;
      }
    }
    if (!entId) continue; // not an entity header — TOC link, design subsection, etc.

    // Find the end of this entity's block: next `### ` header or EOF.
    let end = lines.length;
    for (let j = i + 1; j < lines.length; j++) {
      if (/^### (?!#)/.test(lines[j])) {
        end = j;
        break;
      }
    }

    const body = lines.slice(i, end);
    const entity = parseEntityBody(title, entId, body);
    entities.push(entity);
    // fast-forward i past the block we just consumed
    i = end - 1;
  }
  return entities;
}

/**
 * Parse one entity block — pulls `#### <Section> (N features)` headers and
 * the `| Section | Feature | Uniform | Default | Description |` tables that
 * follow each one.
 */
function parseEntityBody(title, entId, lines) {
  const features = [];
  let currentSection = null;
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // `#### Section Name (N features)` — capture canonical section label.
    const sectionMatch = /^####\s+(.+?)(?:\s*\(\d+\s*features?\))?\s*$/.exec(line);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      inTable = false;
      continue;
    }

    // Table header: `| Section | Feature | Uniform | Default | Description |`
    // v4.1 additions use `Uniform Name`; Protoplanetary Disk has an
    // accidental `Unsigned` typo in column 3. Accept any middle column as
    // long as the surrounding headers match.
    if (/^\|\s*Section\s*\|\s*Feature\s*\|\s*\w[\w\s]*\s*\|\s*Default\s*\|\s*Description\s*\|/i.test(line)) {
      inTable = true;
      // Next line is the `|---|---|...` separator — skip it.
      continue;
    }
    if (!inTable) continue;

    // Separator line or blank line → table ended.
    if (/^\|[-\s|]+\|$/.test(line)) continue;
    if (!line.trim()) {
      inTable = false;
      continue;
    }
    if (!line.startsWith("|")) {
      inTable = false;
      continue;
    }

    // Split the row into cells. Feature descriptions can contain pipe chars
    // inside code spans, but Doc 22 doesn't use any — so a naive split on
    // `|` is safe here. Drop the leading/trailing empty cells.
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 5) continue;
    const [sectionColumn, featureName, uniformRaw, defaultRaw, ...descParts] = cells;
    const description = descParts.join(" | ").trim();
    if (!featureName || !uniformRaw) continue;

    const uniform = normaliseUniformName(uniformRaw);
    if (!uniform) continue;

    const { defaultOn, defaultLabel } = parseDefault(defaultRaw);

    features.push({
      section: currentSection ?? sectionColumn ?? "Misc",
      sectionColumn: sectionColumn || null,
      name: featureName,
      uniform,
      defaultOn,
      defaultLabel: defaultLabel ?? (defaultOn ? "ON" : "OFF"),
      description,
    });
  }

  // Deduplicate by uniform name within the same entity (Doc 22 occasionally
  // repeats a uniform across sections — e.g. `uCameraMode` for three camera
  // preset features). Keep the first occurrence; remember the alternate names.
  const seen = new Map();
  const deduped = [];
  for (const feat of features) {
    const existing = seen.get(feat.uniform);
    if (existing) {
      existing.aliasNames = existing.aliasNames ?? [];
      existing.aliasNames.push(feat.name);
      continue;
    }
    seen.set(feat.uniform, feat);
    deduped.push(feat);
  }

  return {
    entId,
    displayName: title,
    features: deduped,
  };
}

/** `uGreatRedSpot` or `u_greatRedSpot` or `uGRS` → `u_greatRedSpot`. */
function normaliseUniformName(raw) {
  const stripped = raw.replace(/`/g, "").trim();
  if (!stripped) return null;
  if (!stripped.startsWith("u")) return null;
  // Already snake form — ensure camel tail and return.
  if (stripped.startsWith("u_")) {
    const tail = stripped.slice(2);
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(tail)) return null;
    return `u_${camelise(tail)}`;
  }
  // `uGreatRedSpot` → strip `u`, lower first letter → `greatRedSpot`.
  const tail = stripped.slice(1);
  if (!tail) return null;
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(tail)) return null;
  const camel = tail[0].toLowerCase() + tail.slice(1);
  return `u_${camel}`;
}

function camelise(str) {
  // `great_red_spot` → `greatRedSpot`; leave camelCase inputs unchanged.
  const parts = str.split(/[_\s]+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0][0].toLowerCase() + parts[0].slice(1);
  }
  return (
    parts[0][0].toLowerCase() +
    parts[0].slice(1) +
    parts
      .slice(1)
      .map((p) => p[0].toUpperCase() + p.slice(1))
      .join("")
  );
}

/**
 * `ON` → { defaultOn: true }
 * `OFF` → { defaultOn: false }
 * `SELF`, `86400x`, `3.5 AU`, `Primary Star`, etc. → { defaultOn: false, defaultLabel: "<raw>" }
 * Mixed "ON/OFF" or slider defaults like "0.5" → { defaultOn: false, defaultLabel }
 */
function parseDefault(raw) {
  const trimmed = raw.replace(/\*/g, "").trim();
  const upper = trimmed.toUpperCase();
  if (upper === "ON") return { defaultOn: true, defaultLabel: "ON" };
  if (upper === "OFF") return { defaultOn: false, defaultLabel: "OFF" };
  // Slider-style numeric or mixed — surface the literal label so the UI can
  // decide how to render it; treat `defaultOn` conservatively as false.
  return { defaultOn: false, defaultLabel: trimmed || "OFF" };
}

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------

function escapeForTemplate(str) {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");
}

function emitTs(entities, sourceHash) {
  const ENTITY_COUNT = entities.length;
  const featureCount = entities.reduce((n, e) => n + e.features.length, 0);
  // Deliberately no timestamp — the `--check` CI gate diffs the file byte
  // for byte, and a wall-clock stamp would make it fail on every run.

  let out = "";
  out += "// AUTO-GENERATED by scripts/generate-entity-toggles.mjs — DO NOT HAND-EDIT.\n";
  out += "// Source: docs/22-interactive-toggle-features.md (+ 22-*-feature-crossref.md).\n";
  out += "// Run `node scripts/generate-entity-toggles.mjs` after editing Doc 22.\n";
  out += "// CI enforces regeneration via `--check` (scripts/generate-entity-toggles.mjs).\n";
  out += `//\n// ${ENTITY_COUNT} entities, ${featureCount} features.\n\n`;
  out += "/** One interactive toggle feature for a single entity type. */\n";
  out += "export interface EntityToggleFeature {\n";
  out += "  /** Canonical section label from the `#### <Section>` Doc 22 header. */\n";
  out += "  readonly section: string;\n";
  out += "  /** Display name (feature column in the Doc 22 table). */\n";
  out += "  readonly name: string;\n";
  out += "  /** Normalised shader uniform name — `u_camelCase` (Doc 22 §2.4). */\n";
  out += "  readonly uniform: string;\n";
  out += "  /** Default visual state — true if Doc 22 flagged this as ON. */\n";
  out += "  readonly defaultOn: boolean;\n";
  out += "  /** Original label (e.g. `ON`, `OFF`, `SELF`, `86400x`) for non-boolean defaults. */\n";
  out += "  readonly defaultLabel: string;\n";
  out += "  /** Short physics + rendering rationale from the Doc 22 description cell. */\n";
  out += "  readonly description: string;\n";
  out += "  /** Other feature names that map to the same uniform (Doc 22 sometimes reuses one). */\n";
  out += "  readonly aliasNames?: readonly string[];\n";
  out += "}\n\n";
  out += "/** Toggle spec for one of the 96 Doc 22 entity types. */\n";
  out += "export interface EntityToggleSpec {\n";
  out += "  readonly entId: string;\n";
  out += "  readonly displayName: string;\n";
  out += "  readonly features: readonly EntityToggleFeature[];\n";
  out += "}\n\n";
  out += `export const ENTITY_TOGGLES_COUNT = ${ENTITY_COUNT};\n`;
  out += `export const ENTITY_TOGGLES_FEATURE_COUNT = ${featureCount};\n`;
  out += `/** SHA-256 of the parsed source docs (main + crossref). CI checks this. */\n`;
  out += `export const ENTITY_TOGGLES_SOURCE_HASH = ${JSON.stringify(sourceHash)};\n\n`;
  out += "/** All 96 entity toggle specs, keyed by ENT-ID. */\n";
  out += "export const ENTITY_TOGGLES: Readonly<Record<string, EntityToggleSpec>> = {\n";

  // Stable ordering by ENT-ID for diff friendliness.
  const sorted = [...entities].sort((a, b) => a.entId.localeCompare(b.entId));
  for (const entity of sorted) {
    out += `  ${JSON.stringify(entity.entId)}: {\n`;
    out += `    entId: ${JSON.stringify(entity.entId)},\n`;
    out += `    displayName: ${JSON.stringify(entity.displayName)},\n`;
    out += "    features: [\n";
    for (const feat of entity.features) {
      out += "      {\n";
      out += `        section: ${JSON.stringify(feat.section)},\n`;
      out += `        name: ${JSON.stringify(feat.name)},\n`;
      out += `        uniform: ${JSON.stringify(feat.uniform)},\n`;
      out += `        defaultOn: ${feat.defaultOn ? "true" : "false"},\n`;
      out += `        defaultLabel: ${JSON.stringify(feat.defaultLabel)},\n`;
      out += `        description: ${JSON.stringify(feat.description)},\n`;
      if (feat.aliasNames && feat.aliasNames.length > 0) {
        out += `        aliasNames: ${JSON.stringify(feat.aliasNames)},\n`;
      }
      out += "      },\n";
    }
    out += "    ],\n";
    out += "  },\n";
  }
  out += "};\n\n";

  // Helper accessors (terse — just enough to avoid `ENTITY_TOGGLES[id]`
  // repetitions across UI + store + engine).
  out += "/** Look up the toggle spec for an ENT-ID. Returns null if unknown. */\n";
  out += "export function getEntityToggleSpec(entId: string): EntityToggleSpec | null {\n";
  out += "  return ENTITY_TOGGLES[entId] ?? null;\n";
  out += "}\n\n";
  out += "/** Build the default toggle-value map for an ENT-ID (uniform → 0.0/1.0). */\n";
  out += "export function defaultTogglesFor(entId: string): Record<string, number> {\n";
  out += "  const spec = ENTITY_TOGGLES[entId];\n";
  out += "  if (!spec) return {};\n";
  out += "  const out: Record<string, number> = {};\n";
  out += "  for (const feat of spec.features) {\n";
  out += "    out[feat.uniform] = feat.defaultOn ? 1.0 : 0.0;\n";
  out += "  }\n";
  out += "  return out;\n";
  out += "}\n";

  return out;
}

// ---------------------------------------------------------------------------
// Driver
// ---------------------------------------------------------------------------

async function main() {
  const mainMd = await readFile(DOC22, "utf8");
  const crossRefMds = await Promise.all(
    CROSSREF_DOCS.map(async (p) => {
      try {
        return await readFile(p, "utf8");
      } catch {
        return "";
      }
    }),
  );

  const entities = parseDoc22(mainMd);
  if (entities.length !== EXPECTED_ENTITY_COUNT) {
    console.error(
      `[generate-entity-toggles] WARNING: parsed ${entities.length} entities, expected ${EXPECTED_ENTITY_COUNT}.`,
    );
  }

  // Content hash of all source docs — CI `--check` uses this as the
  // regeneration gate.
  const hash = createHash("sha256");
  hash.update(mainMd);
  for (const md of crossRefMds) hash.update(md);
  const sourceHash = hash.digest("hex").slice(0, 16);

  const output = emitTs(entities, sourceHash);

  if (CHECK_MODE) {
    let existing = "";
    try {
      existing = await readFile(OUT, "utf8");
    } catch {
      console.error(
        `[generate-entity-toggles] FAIL: ${relative(REPO_ROOT, OUT)} does not exist. Run the generator without --check to create it.`,
      );
      process.exit(1);
    }
    if (existing !== output) {
      console.error(
        `[generate-entity-toggles] FAIL: ${relative(REPO_ROOT, OUT)} is out of date. ` +
          `Run: node scripts/generate-entity-toggles.mjs`,
      );
      process.exit(1);
    }
    const featureCount = entities.reduce((n, e) => n + e.features.length, 0);
    console.log(
      `[generate-entity-toggles] OK: ${entities.length} entities, ${featureCount} features, hash=${sourceHash}.`,
    );
    return;
  }

  await writeFile(OUT, output, "utf8");
  const featureCount = entities.reduce((n, e) => n + e.features.length, 0);
  console.log(
    `[generate-entity-toggles] wrote ${relative(REPO_ROOT, OUT)} — ${entities.length} entities, ${featureCount} features, hash=${sourceHash}.`,
  );
}

main().catch((err) => {
  console.error(`[generate-entity-toggles] crashed:`, err);
  process.exit(2);
});
