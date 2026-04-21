import { closeEsClient, getEsClient } from '../src/es/client.js';
import {
  ENTITIES_AUTOCOMPLETE_INDEX,
  entitiesAutocompleteMapping,
  entitiesAutocompleteSettings,
} from '../src/es/schemas/entities_autocomplete.js';

async function bootstrap(): Promise<void> {
  const es = getEsClient();
  const exists = await es.indices.exists({ index: ENTITIES_AUTOCOMPLETE_INDEX });

  if (exists) {
    // eslint-disable-next-line no-console
    console.log(`[bootstrap-es] index ${ENTITIES_AUTOCOMPLETE_INDEX} already exists, skipping.`);
    return;
  }

  await es.indices.create({
    index: ENTITIES_AUTOCOMPLETE_INDEX,
    settings: entitiesAutocompleteSettings,
    mappings: entitiesAutocompleteMapping,
  });

  // eslint-disable-next-line no-console
  console.log(`[bootstrap-es] created index ${ENTITIES_AUTOCOMPLETE_INDEX}`);
}

bootstrap()
  .catch((err: unknown) => {
    // eslint-disable-next-line no-console
    console.error('[bootstrap-es] failed', err);
    process.exit(1);
  })
  .finally(() => {
    void closeEsClient();
  });
