export const ENTITIES_AUTOCOMPLETE_INDEX = 'entities_autocomplete';

export const entitiesAutocompleteMapping = {
  properties: {
    ent_id: { type: 'keyword' as const },
    name: {
      type: 'completion' as const,
      analyzer: 'simple',
      preserve_separators: true,
      preserve_position_increments: true,
      max_input_length: 100,
    },
    aliases: {
      type: 'completion' as const,
      analyzer: 'simple',
      max_input_length: 100,
    },
    category: { type: 'keyword' as const },
    kind: { type: 'keyword' as const },
    magnitude: { type: 'float' as const },
  },
} as const;

export const entitiesAutocompleteSettings = {
  number_of_shards: 1,
  number_of_replicas: 0,
} as const;
