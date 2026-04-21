/**
 * Runtime configuration for the HTTP client (Doc 26 §2).
 *
 * T18 keeps the surface tiny: a base URL (env-driven, defaults to the public
 * edge) and an optional bearer token. A pluggable `fetchImpl` lets tests
 * inject a fake without monkey-patching `globalThis.fetch`.
 *
 * `apiConfig.setBaseUrl / setApiKey` exist so higher layers (settings store,
 * login flow) can mutate auth at runtime without reinstantiating the module.
 */

export type FetchLike = typeof fetch;

export interface ApiConfig {
  /** Base URL, including the `/v1` prefix. E.g. `https://api.cosmosexplorer.app/v1`. */
  baseUrl: string;
  /** Optional bearer token (Doc 26 §3). `null` = anonymous tier. */
  apiKey: string | null;
  /** Enable/disable module-local ETag cache (Doc 26 §2.4). */
  etagCache: boolean;
  /** Replace this to inject a mock in tests. Defaults to `globalThis.fetch`. */
  fetchImpl: FetchLike;
}

/** Env-aware default. Falls back to production URL for non-Vite contexts (tests). */
function defaultBaseUrl(): string {
  const viteEnv = (import.meta as { env?: Record<string, string | undefined> }).env;
  return viteEnv?.VITE_API_BASE_URL ?? 'https://api.cosmosexplorer.app/v1';
}

function defaultFetch(): FetchLike {
  const g = globalThis as { fetch?: FetchLike };
  if (!g.fetch) {
    throw new Error('globalThis.fetch unavailable — supply apiConfig.fetchImpl');
  }
  return g.fetch.bind(globalThis);
}

const state: ApiConfig = {
  baseUrl: defaultBaseUrl(),
  apiKey: null,
  etagCache: true,
  fetchImpl: defaultFetch(),
};

export const apiConfig = {
  get baseUrl(): string {
    return state.baseUrl;
  },
  get apiKey(): string | null {
    return state.apiKey;
  },
  get etagCache(): boolean {
    return state.etagCache;
  },
  get fetchImpl(): FetchLike {
    return state.fetchImpl;
  },
  setBaseUrl(url: string): void {
    state.baseUrl = url.replace(/\/+$/, '');
  },
  setApiKey(key: string | null): void {
    state.apiKey = key;
  },
  setEtagCache(enabled: boolean): void {
    state.etagCache = enabled;
  },
  setFetchImpl(fn: FetchLike): void {
    state.fetchImpl = fn;
  },
  /** Reset to defaults — test helper. */
  reset(): void {
    state.baseUrl = defaultBaseUrl();
    state.apiKey = null;
    state.etagCache = true;
    state.fetchImpl = defaultFetch();
  },
};
