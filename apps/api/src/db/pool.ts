import { Pool, type PoolConfig, type QueryResultRow } from 'pg';

export interface DbPoolOptions {
  readonly connectionString?: string;
  readonly max?: number;
  readonly idleTimeoutMillis?: number;
  readonly connectionTimeoutMillis?: number;
}

const DEFAULT_MAX = 20;
const DEFAULT_IDLE_MS = 30_000;
const DEFAULT_CONN_MS = 5_000;

export class ParameterMismatchError extends Error {
  constructor(expected: number, received: number, sqlPreview: string) {
    super(
      `SQL placeholder count (${expected}) does not match params length (${received}). ` +
        `SQL: ${sqlPreview}`
    );
    this.name = 'ParameterMismatchError';
  }
}

function countPlaceholders(sql: string): number {
  const stripped = sql
    .replace(/--[^\n]*\n?/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'(?:''|[^'])*'/g, '')
    .replace(/"(?:[^"])*"/g, '');
  const matches = stripped.match(/\$\d+/g);
  if (!matches) return 0;
  const numbers = new Set<number>();
  for (const m of matches) numbers.add(Number(m.slice(1)));
  return numbers.size;
}

export function createPool(opts: DbPoolOptions = {}): Pool {
  const connectionString = opts.connectionString ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required to create the pg pool');
  }
  const config: PoolConfig = {
    connectionString,
    max: opts.max ?? DEFAULT_MAX,
    idleTimeoutMillis: opts.idleTimeoutMillis ?? DEFAULT_IDLE_MS,
    connectionTimeoutMillis: opts.connectionTimeoutMillis ?? DEFAULT_CONN_MS,
  };
  return new Pool(config);
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  pool: Pool,
  text: string,
  params: readonly unknown[] = []
): Promise<T[]> {
  const expected = countPlaceholders(text);
  if (expected !== params.length) {
    throw new ParameterMismatchError(expected, params.length, text.slice(0, 120));
  }
  const result = await pool.query<T>(text, params as unknown[]);
  return result.rows;
}

let sharedPool: Pool | null = null;

export function getPool(): Pool {
  if (sharedPool) return sharedPool;
  sharedPool = createPool();
  return sharedPool;
}

export async function closePool(): Promise<void> {
  if (!sharedPool) return;
  const pool = sharedPool;
  sharedPool = null;
  await pool.end();
}
