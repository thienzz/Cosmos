import { Client } from '@elastic/elasticsearch';

let client: Client | null = null;

export function getEsClient(): Client {
  if (client === null) {
    client = new Client({
      node: process.env.ELASTICSEARCH_URL ?? 'http://localhost:9200',
      maxRetries: 3,
      requestTimeout: 5_000,
    });
  }
  return client;
}

export async function closeEsClient(): Promise<void> {
  if (client !== null) {
    const c = client;
    client = null;
    await c.close();
  }
}
