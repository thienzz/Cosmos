import { Client } from '@elastic/elasticsearch';

type ClientOptions = ConstructorParameters<typeof Client>[0];

export interface EsClientOptions {
  readonly node?: string;
  readonly username?: string;
  readonly password?: string;
  readonly requestTimeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 5_000;

export function createEsClient(opts: EsClientOptions = {}): Client {
  const node = opts.node ?? process.env.ELASTICSEARCH_URL;
  if (!node) {
    throw new Error('ELASTICSEARCH_URL is required to create the ES client');
  }
  const config: ClientOptions = {
    node,
    requestTimeout: opts.requestTimeoutMs ?? DEFAULT_TIMEOUT_MS,
  };
  const username = opts.username ?? process.env.ELASTICSEARCH_USERNAME;
  const password = opts.password ?? process.env.ELASTICSEARCH_PASSWORD;
  if (username && password) {
    config.auth = { username, password };
  }
  return new Client(config);
}

let sharedClient: Client | null = null;

export function getEsClient(): Client {
  if (sharedClient) return sharedClient;
  sharedClient = createEsClient();
  return sharedClient;
}

export async function closeEsClient(): Promise<void> {
  if (!sharedClient) return;
  const client = sharedClient;
  sharedClient = null;
  await client.close();
}
