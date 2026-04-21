/**
 * HTTP client — the single fetch entry point for every REST call into the
 * Cosmos Explorer backend (Doc 26 §2). Rules:
 *
 *   - GET + JSON only here. Binary tile fetches live in `tileStore` (T23).
 *   - Parses the Doc 26 §2.5 envelope → returns unwrapped `data`.
 *   - Parses the Doc 26 §15 error envelope → throws {@link ApiError}.
 *   - Retries 429 once honouring `error.retry_after_seconds`; 5xx with
 *     capped exponential backoff (Doc 27 §15.3).
 *   - In-memory ETag cache (Doc 26 §2.4): attaches `If-None-Match` on repeat
 *     GETs, returns cached body on 304. Keyed by request URL.
 *   - Pure — no store / DOM side-effects. Callers (stores, hooks) own UX.
 */

import { apiConfig } from './config';
import type {
  ApiCollectionEnvelope,
  ApiEnvelope,
  ApiErrorBody,
  ApiErrorResponse,
  ApiPagination,
} from './types';

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/**
 * Typed wrapper for Doc 26 §15 error responses plus transport-level failures.
 * `code === 'NETWORK_ERROR'` denotes fetch rejection / unparseable body;
 * everything else echoes the server's `error.code`.
 */
export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly requestId: string;
  public readonly retryAfterSeconds?: number;
  public readonly details?: ApiErrorBody['details'];

  constructor(body: ApiErrorBody, statusFallback?: number) {
    super(`[${body.code}] ${body.message}`);
    this.name = 'ApiError';
    this.code = body.code;
    this.status = body.status || statusFallback || 0;
    this.requestId = body.request_id;
    this.retryAfterSeconds = body.retry_after_seconds;
    this.details = body.details;
  }

  static network(message: string): ApiError {
    return new ApiError(
      { code: 'NETWORK_ERROR', message, status: 0, request_id: 'n/a' },
      0,
    );
  }

  static upstream(status: number, text: string): ApiError {
    return new ApiError(
      {
        code: status === 503 ? 'SERVICE_UNAVAILABLE' : 'INTERNAL_ERROR',
        message: text || `HTTP ${status}`,
        status,
        request_id: 'n/a',
      },
      status,
    );
  }

  isRetryable(): boolean {
    return (
      this.code === 'SERVICE_UNAVAILABLE' ||
      this.code === 'UPSTREAM_TIMEOUT' ||
      this.code === 'RATE_LIMIT_EXCEEDED' ||
      this.code === 'NETWORK_ERROR' ||
      this.status === 502 ||
      this.status === 503 ||
      this.status === 504
    );
  }

  isNotFound(): boolean {
    return (
      this.code === 'ENTITY_NOT_FOUND' ||
      this.code === 'CATALOG_ENTRY_NOT_FOUND' ||
      this.status === 404
    );
  }
}

// ---------------------------------------------------------------------------
// ETag cache — module-scoped Map. Cleared on `data_version_update` WS frame
// once the WS manager wires it up in T19. For now we expose `clearEtagCache`.
// ---------------------------------------------------------------------------

interface EtagEntry {
  etag: string;
  body: unknown;
  envelope: 'item' | 'collection';
  pagination?: ApiPagination;
}
const etagCache = new Map<string, EtagEntry>();

export function clearEtagCache(): void {
  etagCache.clear();
}

// ---------------------------------------------------------------------------
// Rate-limit snapshot — updated on every response. UI can read but shouldn't
// gate on it; the retry path already handles 429.
// ---------------------------------------------------------------------------

export interface RateLimitSnapshot {
  limit: number | null;
  remaining: number | null;
  resetUnix: number | null;
  dataVersion: string | null;
}

const rateLimit: RateLimitSnapshot = {
  limit: null,
  remaining: null,
  resetUnix: null,
  dataVersion: null,
};

export function getRateLimit(): RateLimitSnapshot {
  return { ...rateLimit };
}

// ---------------------------------------------------------------------------
// Request helpers
// ---------------------------------------------------------------------------

export interface RequestOptions {
  /** Appended verbatim to the URL. Values are encoded. */
  query?: Record<string, string | number | boolean | null | undefined>;
  /** Skip ETag cache even if globally enabled. */
  bypassCache?: boolean;
  /** Abort the request (forwarded to `fetch`). */
  signal?: AbortSignal;
  /** Override max retries for 5xx/429. Default 2 total additional attempts. */
  maxRetries?: number;
}

interface ResolvedRequest {
  url: string;
  init: RequestInit;
  cacheKey: string;
  useCache: boolean;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const base = apiConfig.baseUrl;
  const joined = path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
  if (!query) return joined;
  const entries = Object.entries(query).filter(
    ([, v]) => v !== null && v !== undefined && v !== '',
  ) as Array<[string, string | number | boolean]>;
  if (entries.length === 0) return joined;
  const qs = entries
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `${joined}?${qs}`;
}

function resolveRequest(
  method: 'GET' | 'POST',
  path: string,
  opts: RequestOptions & { body?: unknown },
): ResolvedRequest {
  const url = buildUrl(path, opts.query);
  const headers: Record<string, string> = {
    accept: 'application/json',
  };
  if (apiConfig.apiKey) {
    headers.authorization = `Bearer ${apiConfig.apiKey}`;
  }
  const init: RequestInit = { method, headers, signal: opts.signal };
  if (method === 'POST' && opts.body !== undefined) {
    headers['content-type'] = 'application/json; charset=utf-8';
    init.body = JSON.stringify(opts.body);
  }
  const useCache =
    method === 'GET' && apiConfig.etagCache && !opts.bypassCache;
  const cached = useCache ? etagCache.get(url) : undefined;
  if (cached) headers['if-none-match'] = cached.etag;
  return { url, init, cacheKey: url, useCache };
}

function readRateLimit(response: Response): void {
  const toNumber = (h: string | null): number | null => {
    if (h === null) return null;
    const n = Number(h);
    return Number.isFinite(n) ? n : null;
  };
  const limit = toNumber(response.headers.get('x-ratelimit-limit'));
  const remaining = toNumber(response.headers.get('x-ratelimit-remaining'));
  const reset = toNumber(response.headers.get('x-ratelimit-reset'));
  if (limit !== null) rateLimit.limit = limit;
  if (remaining !== null) rateLimit.remaining = remaining;
  if (reset !== null) rateLimit.resetUnix = reset;
  const dv = response.headers.get('x-data-version');
  if (dv) rateLimit.dataVersion = dv;
}

async function parseErrorBody(response: Response): Promise<ApiError> {
  try {
    const text = await response.text();
    if (!text) return ApiError.upstream(response.status, response.statusText);
    const parsed = JSON.parse(text) as Partial<ApiErrorResponse>;
    if (parsed.error && typeof parsed.error === 'object') {
      return new ApiError(parsed.error as ApiErrorBody, response.status);
    }
    return ApiError.upstream(response.status, text);
  } catch {
    return ApiError.upstream(response.status, response.statusText);
  }
}

function backoffDelay(attempt: number, err: ApiError): number {
  if (err.retryAfterSeconds && err.retryAfterSeconds > 0) {
    return Math.min(err.retryAfterSeconds * 1000, 10_000);
  }
  // Doc 27 §15.3: 250 / 500 / 1000 ms, capped.
  return Math.min(250 * 2 ** attempt, 2_000);
}

async function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return;
  await new Promise<void>((resolve, reject) => {
    const handle = setTimeout(resolve, ms);
    const onAbort = (): void => {
      clearTimeout(handle);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    if (signal) {
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener('abort', onAbort, { once: true });
    }
  });
}

// ---------------------------------------------------------------------------
// Core executor
// ---------------------------------------------------------------------------

interface RawResult<T> {
  data: T;
  envelope: 'item' | 'collection';
  pagination?: ApiPagination;
}

async function executeOnce<T>(req: ResolvedRequest): Promise<RawResult<T>> {
  let response: Response;
  try {
    response = await apiConfig.fetchImpl(req.url, req.init);
  } catch (err) {
    throw ApiError.network((err as Error)?.message ?? 'fetch failed');
  }
  readRateLimit(response);

  // 304 → serve cached body.
  if (response.status === 304) {
    const cached = etagCache.get(req.cacheKey);
    if (!cached) {
      throw ApiError.network(
        '304 Not Modified without a cached entry — cache evicted mid-flight',
      );
    }
    return {
      data: cached.body as T,
      envelope: cached.envelope,
      ...(cached.pagination ? { pagination: cached.pagination } : {}),
    };
  }

  if (!response.ok) {
    throw await parseErrorBody(response);
  }

  const etag = response.headers.get('etag');
  const text = await response.text();
  if (!text) {
    throw ApiError.network(`empty body on ${req.url}`);
  }

  let parsed: ApiEnvelope<T> | ApiCollectionEnvelope<T>;
  try {
    parsed = JSON.parse(text) as ApiEnvelope<T> | ApiCollectionEnvelope<T>;
  } catch {
    throw ApiError.network(`malformed JSON on ${req.url}`);
  }

  if (!parsed || typeof parsed !== 'object' || !('data' in parsed)) {
    throw ApiError.network(`missing data envelope on ${req.url}`);
  }

  const isCollection = 'pagination' in parsed && parsed.pagination !== undefined;
  const result: RawResult<T> = {
    data: parsed.data as T,
    envelope: isCollection ? 'collection' : 'item',
  };
  if (isCollection) {
    result.pagination = (parsed as ApiCollectionEnvelope<T>).pagination;
  }

  if (req.useCache && etag) {
    const entry: EtagEntry = {
      etag,
      body: result.data,
      envelope: result.envelope,
    };
    if (result.pagination) entry.pagination = result.pagination;
    etagCache.set(req.cacheKey, entry);
  }

  return result;
}

async function execute<T>(
  req: ResolvedRequest,
  opts: Pick<RequestOptions, 'maxRetries' | 'signal'>,
): Promise<RawResult<T>> {
  const maxRetries = opts.maxRetries ?? 2;
  let lastError: ApiError | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await executeOnce<T>(req);
    } catch (err) {
      const apiErr = err instanceof ApiError ? err : ApiError.network(String(err));
      lastError = apiErr;
      if (!apiErr.isRetryable() || attempt === maxRetries) throw apiErr;
      await delay(backoffDelay(attempt, apiErr), opts.signal);
      // Drop stale If-None-Match on retry — server may have rotated etag.
      if (req.init.headers && 'if-none-match' in (req.init.headers as Record<string, string>)) {
        delete (req.init.headers as Record<string, string>)['if-none-match'];
      }
    }
  }
  throw lastError ?? ApiError.network('exhausted retries');
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function apiGet<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const req = resolveRequest('GET', path, opts);
  const result = await execute<T>(req, opts);
  return result.data;
}

export interface CollectionResult<T> {
  items: T[];
  pagination: ApiPagination;
}

export async function apiGetCollection<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<CollectionResult<T>> {
  const req = resolveRequest('GET', path, opts);
  const result = await execute<T[]>(req, opts);
  return {
    items: result.data,
    pagination: result.pagination ?? {
      total: result.data.length,
      limit: result.data.length,
      offset: 0,
      has_more: false,
    },
  };
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  opts: RequestOptions = {},
): Promise<T> {
  const req = resolveRequest('POST', path, { ...opts, body });
  req.useCache = false;
  const result = await execute<T>(req, opts);
  return result.data;
}

// ---------------------------------------------------------------------------
// Binary fetch (Doc 26 §7) — for tile endpoints. Skips the envelope parser
// entirely; returns raw ArrayBuffer on 2xx or throws ApiError on failure.
// ---------------------------------------------------------------------------

export interface BinaryResponse {
  buffer: ArrayBuffer;
  /** `X-Tile-Version` header (if present) — used to stamp cache entries. */
  version: string | null;
  /** Content-Type header (diagnostic only). */
  contentType: string | null;
}

export async function apiGetBinary(
  path: string,
  opts: Pick<RequestOptions, 'signal' | 'query' | 'maxRetries'> = {},
): Promise<BinaryResponse> {
  const url = buildUrl(path, opts.query);
  const headers: Record<string, string> = {
    accept: 'application/octet-stream',
  };
  if (apiConfig.apiKey) {
    headers.authorization = `Bearer ${apiConfig.apiKey}`;
  }
  const init: RequestInit = { method: 'GET', headers, signal: opts.signal };
  const maxRetries = opts.maxRetries ?? 2;

  let lastError: ApiError | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let response: Response;
    try {
      response = await apiConfig.fetchImpl(url, init);
    } catch (err) {
      const apiErr = ApiError.network((err as Error)?.message ?? 'fetch failed');
      lastError = apiErr;
      if (attempt === maxRetries) throw apiErr;
      await delay(backoffDelay(attempt, apiErr), opts.signal);
      continue;
    }
    readRateLimit(response);

    if (!response.ok) {
      const apiErr = await parseErrorBody(response);
      lastError = apiErr;
      if (!apiErr.isRetryable() || attempt === maxRetries) throw apiErr;
      await delay(backoffDelay(attempt, apiErr), opts.signal);
      continue;
    }

    const buffer = await response.arrayBuffer();
    return {
      buffer,
      version: response.headers.get('x-tile-version'),
      contentType: response.headers.get('content-type'),
    };
  }
  throw lastError ?? ApiError.network('exhausted retries');
}
