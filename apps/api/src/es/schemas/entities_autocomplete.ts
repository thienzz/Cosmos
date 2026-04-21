export const ENTITIES_AUTOCOMPLETE_INDEX = 'entities_autocomplete';

export const entitiesAutocompleteMapping = {
  properties: {
    ent_id: { type: 'keyword' as const },
    name: {
      type: 'completion' as const,
      analyzer: 'simple',
      preserve_separators: true,
      preserve_position_increments: true,
      max_input_length: 50,
    },
    aliases: {
      type: 'completion' as const,
      analyzer: 'simple',
    },
    category: { type: 'keyword' as const },
    kind: { type: 'keyword' as const },
    magnitude: { type: 'float' as const },
    distance_pc: { type: 'double' as const },
    ra_deg: { type: 'double' as const },
    dec_deg: { type: 'double' as const },
  },
};

export const entitiesAutocompleteSettings = {
  number_of_shards: 1,
  number_of_replicas: 0,
};
