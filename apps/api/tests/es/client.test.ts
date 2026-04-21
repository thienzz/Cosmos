import { describe, expect, it } from 'vitest';

import { createEsClient } from '../../src/es/client.js';
import {
  ENTITIES_AUTOCOMPLETE_INDEX,
  entitiesAutocompleteMapping,
} from '../../src/es/schemas/entities_autocomplete.js';

describe('es/client', () => {
  it('throws when ELASTICSEARCH_URL missing', () => {
    const saved = process.env.ELASTICSEARCH_URL;
    delete process.env.ELASTICSEARCH_URL;
    try {
      expect(() => createEsClient()).toThrow(/ELASTICSEARCH_URL/);
    } finally {
      if (saved) process.env.ELASTICSEARCH_URL = saved;
    }
  });

  it('accepts explicit node option', () => {
    const client = createEsClient({ node: 'http://localhost:9200' });
    expect(client).toBeDefined();
  });
});

describe('es/schemas/entities_autocomplete', () => {
  it('declares `name` as a completion field', () => {
    expect(entitiesAutocompleteMapping.properties.name.type).toBe('completion');
  });

  it('uses a stable index name', () => {
    expect(ENTITIES_AUTOCOMPLETE_INDEX).toBe('entities_autocomplete');
  });
});
