import { readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig, type PluginOption } from 'vite';
import glsl from 'vite-plugin-glsl';

/**
 * Dev-only middleware: serve the seeded star-tile fixture tree from
 * `<repo>/data/tiles` as if the Rust tile-server (apps/tile-server) were
 * running on the default API port. Keeps T26 preview smoke working when
 * the backend is not booted (Windows dev without Rust toolchain, CI without
 * a tile-server sidecar). Runs BEFORE the `/v1` proxy so requests short-
 * circuit before hitting `localhost:8080`.
 */
function devStarTileMiddleware(): PluginOption {
  const tilesRoot = resolve(fileURLToPath(new URL('../../data/tiles', import.meta.url)));
  return {
    name: 'dev-star-tile-middleware',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '';
        // Match `/v1/tiles/manifest`, `/v1/tiles/stars/z/x/y/level`, …
        if (!url.startsWith('/v1/tiles/')) return next();
        try {
          const rel = url.slice('/v1/tiles/'.length).replace(/\?.*$/, '');
          const fsPath =
            rel === 'manifest'
              ? join(tilesRoot, 'manifest.json')
              : join(tilesRoot, `${rel}.bin`);
          const s = await stat(fsPath).catch(() => null);
          if (!s || !s.isFile()) {
            res.statusCode = 404;
            res.setHeader('content-type', 'application/json; charset=utf-8');
            res.end(
              JSON.stringify({
                error: {
                  code: rel === 'manifest' ? 'MANIFEST_NOT_AVAILABLE' : 'TILE_NOT_FOUND',
                  message: `No fixture at ${fsPath}`,
                  status: 404,
                  request_id: 'dev-mw',
                },
              }),
            );
            return;
          }
          const buf = await readFile(fsPath);
          if (rel === 'manifest') {
            // The manifest is already the envelope-unwrapped body (per
            // `buildStarManifest`). Wrap it so `apiGet` finds the `data`
            // field just like the Rust server's response would have.
            const payload = JSON.parse(buf.toString('utf8')) as unknown;
            const enveloped = { data: payload, meta: { request_id: 'dev-mw' } };
            const bodyText = JSON.stringify(enveloped);
            res.statusCode = 200;
            res.setHeader('content-type', 'application/json; charset=utf-8');
            res.setHeader('cache-control', 'public, max-age=3600');
            res.setHeader('x-tile-version', '2026.Q2.1');
            res.setHeader('x-data-version', '2026.Q2.1');
            res.end(bodyText);
            return;
          }
          res.statusCode = 200;
          res.setHeader('content-type', 'application/octet-stream');
          res.setHeader('cache-control', 'public, max-age=86400, immutable');
          res.setHeader('x-tile-version', '2026.Q2.1');
          res.setHeader('x-data-version', '2026.Q2.1');
          res.end(buf);
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('content-type', 'application/json');
          res.end(
            JSON.stringify({
              error: {
                code: 'INTERNAL_ERROR',
                message: (err as Error).message,
                status: 500,
                request_id: 'dev-mw',
              },
            }),
          );
        }
      });
    },
  };
}

/**
 * Dev-only middleware: serve `/v1/search*` from the local Elasticsearch
 * instance (cosmos_entities index populated by T38 Messier ingest). Keeps
 * the SearchPanel working while the Fastify API gateway (T18) is still
 * a stub. Runs BEFORE the `/v1` proxy so requests short-circuit before
 * hitting `localhost:8080`.
 *
 * Set `COSMOS_DEV_SEARCH_ES_URL` to point at a different ES endpoint
 * (default: http://localhost:9201). Set to empty string to disable.
 */
function devSearchMiddleware(): PluginOption {
  const esUrl = (process.env.COSMOS_DEV_SEARCH_ES_URL ?? 'http://localhost:9201').replace(/\/$/, '');
  const CATEGORY_NAMES: Record<number, string> = {
    1: 'Star',
    2: 'Planet',
    3: 'Moon',
    4: 'Small Body',
    5: 'Nebula',
    6: 'Galaxy',
    7: 'Large-Scale Structure',
    8: 'Exotic',
  };
  return {
    name: 'dev-search-middleware',
    apply: 'serve',
    configureServer(server) {
      if (!esUrl) return;
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? '';
        if (!url.startsWith('/v1/search')) return next();
        const writeJson = (status: number, body: unknown): void => {
          res.statusCode = status;
          res.setHeader('content-type', 'application/json; charset=utf-8');
          res.setHeader('cache-control', 'no-store');
          res.end(JSON.stringify(body));
        };
        const writeError = (code: string, message: string, status = 500): void => {
          writeJson(status, {
            error: { code, message, status, request_id: 'dev-search-mw' },
          });
        };
        const q = new URL(url, 'http://localhost').searchParams;
        const term = (q.get('q') ?? '').trim();
        const categoryFilter = q.get('category');
        const limit = Math.min(Number(q.get('limit') ?? 25), 100);
        const offset = Number(q.get('offset') ?? 0);
        try {
          if (url.startsWith('/v1/search/autocomplete')) {
            if (!term) {
              return writeJson(200, { data: { suggestions: [], query: '' }, meta: { request_id: 'dev-search-mw' } });
            }
            const body = {
              size: limit || 10,
              query: {
                bool: {
                  must: [{ match: { name: { query: term, operator: 'and' } } }],
                  filter: categoryFilter ? [{ term: { category: Number(categoryFilter) } }] : [],
                },
              },
              highlight: { fields: { name: { pre_tags: ['<em>'], post_tags: ['</em>'] } } },
            };
            const esResp = await fetch(`${esUrl}/cosmos_entities/_search`, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(body),
            });
            if (!esResp.ok) {
              return writeError('UPSTREAM_ERROR', `ES ${esResp.status} ${await esResp.text()}`, 502);
            }
            const es = (await esResp.json()) as {
              took: number;
              hits: { hits: Array<{ _id: string; _source: Record<string, unknown>; highlight?: { name?: string[] } }> };
            };
            const suggestions = es.hits.hits.map((h) => {
              const s = h._source;
              const catalogIds = (s.catalog_ids as Record<string, unknown> | undefined) ?? {};
              // NAIF id is numeric — prefer it over the ES _id string so
              // solar bodies route through SearchPanel's numeric-id path
              // and land in SolarSystemRenderer.flyToEntity().
              const naifId = typeof catalogIds.naif === 'number' ? catalogIds.naif : null;
              return {
                text: String(s.name ?? ''),
                ent_id: String(s.ent_id ?? ''),
                id: naifId !== null ? naifId : h._id,
                category: Number(s.category ?? 0),
                category_name: CATEGORY_NAMES[Number(s.category ?? 0)] ?? 'Unknown',
                magnitude: typeof s.magnitude === 'number' ? s.magnitude : undefined,
                highlight: h.highlight?.name?.[0],
                ra: typeof s.ra === 'number' ? s.ra : undefined,
                dec: typeof s.dec === 'number' ? s.dec : undefined,
                distance_pc:
                  typeof s.distance_pc === 'number' ? s.distance_pc : null,
              };
            });
            return writeJson(200, {
              data: { suggestions, query: term, took_ms: es.took },
              meta: { request_id: 'dev-search-mw' },
            });
          }

          if (url.startsWith('/v1/search/cone')) {
            const ra = Number(q.get('ra'));
            const dec = Number(q.get('dec'));
            const radius = Number(q.get('radius'));
            if (!Number.isFinite(ra) || !Number.isFinite(dec) || !Number.isFinite(radius)) {
              return writeError('VALIDATION_ERROR', 'ra, dec, radius must be numbers', 400);
            }
            // Wrap RA [0,360) → lon [-180,180].
            const lon = ra > 180 ? ra - 360 : ra;
            // 1 deg ≈ 111.32 km on the sky.
            const distanceKm = radius * 111.32;
            const body = {
              size: limit || 25,
              from: offset,
              query: {
                bool: {
                  filter: [
                    { geo_distance: { distance: `${distanceKm}km`, position_geo: { lat: dec, lon } } },
                    ...(categoryFilter ? [{ term: { category: Number(categoryFilter) } }] : []),
                  ],
                },
              },
            };
            const esResp = await fetch(`${esUrl}/cosmos_entities/_search`, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(body),
            });
            if (!esResp.ok) {
              return writeError('UPSTREAM_ERROR', `ES ${esResp.status} ${await esResp.text()}`, 502);
            }
            const es = (await esResp.json()) as {
              hits: { total: { value: number }; hits: Array<{ _id: string; _source: Record<string, unknown> }> };
            };
            const items = es.hits.hits.map((h) => shapeTextItem(h, CATEGORY_NAMES));
            return writeJson(200, {
              data: items,
              meta: {
                request_id: 'dev-search-mw',
                pagination: { total: es.hits.total.value, limit, offset, has_more: offset + items.length < es.hits.total.value },
              },
            });
          }

          // /v1/search — full-text search
          const magMax = q.get('mag_max');
          const distMax = q.get('distance_max_pc');
          const filters: unknown[] = [];
          if (categoryFilter) filters.push({ term: { category: Number(categoryFilter) } });
          if (magMax) filters.push({ range: { magnitude: { lte: Number(magMax) } } });
          if (distMax) filters.push({ range: { distance_pc: { lte: Number(distMax) } } });
          const body = term
            ? {
                size: limit || 25,
                from: offset,
                query: {
                  bool: {
                    must: [
                      {
                        multi_match: {
                          query: term,
                          fields: ['name^3', 'aliases^2', 'constellation'],
                          type: 'best_fields',
                          fuzziness: 'AUTO',
                        },
                      },
                    ],
                    filter: filters,
                  },
                },
              }
            : {
                size: limit || 25,
                from: offset,
                query: { bool: { must: [{ match_all: {} }], filter: filters } },
              };
          const esResp = await fetch(`${esUrl}/cosmos_entities/_search`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(body),
          });
          if (!esResp.ok) {
            return writeError('UPSTREAM_ERROR', `ES ${esResp.status} ${await esResp.text()}`, 502);
          }
          const es = (await esResp.json()) as {
            hits: { total: { value: number }; hits: Array<{ _id: string; _score: number; _source: Record<string, unknown> }> };
          };
          const items = es.hits.hits.map((h) => shapeTextItem(h, CATEGORY_NAMES));
          return writeJson(200, {
            data: items,
            meta: {
              request_id: 'dev-search-mw',
              pagination: { total: es.hits.total.value, limit, offset, has_more: offset + items.length < es.hits.total.value },
            },
          });
        } catch (err) {
          return writeError('INTERNAL_ERROR', (err as Error).message, 500);
        }
      });
    },
  };
}

function shapeTextItem(
  h: { _id: string; _score?: number; _source: Record<string, unknown> },
  categoryNames: Record<number, string>,
): Record<string, unknown> {
  const s = h._source;
  const category = Number(s.category ?? 0);
  const distancePc = typeof s.distance_pc === 'number' ? s.distance_pc : null;
  const catalogIds = (s.catalog_ids as Record<string, unknown> | undefined) ?? {};
  const naifId = typeof catalogIds.naif === 'number' ? catalogIds.naif : null;
  return {
    id: naifId !== null ? naifId : h._id,
    ent_id: String(s.ent_id ?? ''),
    name: String(s.name ?? ''),
    category,
    category_name: categoryNames[category] ?? 'Unknown',
    type_name: categoryNames[category] ?? 'Unknown',
    magnitude_apparent: typeof s.magnitude === 'number' ? s.magnitude : undefined,
    distance_ly: distancePc !== null ? distancePc * 3.26156 : undefined,
    constellation: typeof s.constellation === 'string' ? s.constellation : undefined,
    ra: typeof s.ra === 'number' ? s.ra : undefined,
    dec: typeof s.dec === 'number' ? s.dec : undefined,
    distance_pc: distancePc,
    _score: h._score,
    _links: { self: `/v1/entities/ent/${s.ent_id}` },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    glsl({
      include: ['**/*.glsl', '**/*.vert', '**/*.frag'],
      warnDuplicatedImports: true,
      compress: mode === 'production',
    }),
    devStarTileMiddleware(),
    devSearchMiddleware(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    // T18: forward `/v1/...` to the local API gateway (Doc 25 §6.1). Keeps
    // dev on same-origin so the browser applies no CORS preflight churn.
    // Override the target via `VITE_DEV_API_TARGET` if you front a remote
    // environment (staging, colleague's tunnel).
    proxy: {
      '/v1': {
        target: process.env.VITE_DEV_API_TARGET ?? 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
  worker: {
    format: 'es',
  },
}));
