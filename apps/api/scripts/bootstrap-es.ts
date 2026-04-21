import { createEsClient } from '../src/es/client.js';
import {
  ENTITIES_AUTOCOMPLETE_INDEX,
  entitiesAutocompleteMapping,
  entitiesAutocompleteSettings,
} from '../src/es/schemas/entities_autocomplete.js';

async function main(): Promise<void> {
  const client = createEsClient();
  try {
    const exists = await client.indices.exists({ index: ENTITIES_AUTOCOMPLETE_INDEX });
    if (exists) {
      // eslint-disable-next-line no-console
      console.log(`[bootstrap-es] index "${ENTITIES_AUTOCOMPLETE_INDEX}" already exists — no-op`);
      return;
    }
    await client.indices.create({
      index: ENTITIES_AUTOCOMPLETE_INDEX,
      settings: entitiesAutocompleteSettings,
      mappings: entitiesAutocompleteMapping,
    });
    // eslint-disable-next-line no-console
    console.log(`[bootstrap-es] created index "${ENTITIES_AUTOCOMPLETE_INDEX}"`);
  } finally {
    await client.close();
  }
}

main().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('[bootstrap-es] failed', err);
  process.exit(1);
});
