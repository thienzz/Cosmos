/**
 * Extended 96-entity taxonomy added in Doc 11 v2.0 §10.
 */

export type EntityCategory =
  | 'stars'
  | 'planets'
  | 'moons'
  | 'small-bodies'
  | 'nebulae'
  | 'galaxies'
  | 'large-scale'
  | 'exotic';

/** Range of a physical property expressed with a unit label. */
export interface PropertyRange {
  min: number;
  max: number;
  unit: string;
}

/** Physical-property envelope for a catalogue type. */
export interface EntityTypeProperties {
  temperature?: PropertyRange;
  mass?: PropertyRange;
  radius?: PropertyRange;
  luminosity?: PropertyRange;
  /** Hex colour, e.g. "#ffd28a" */
  color: string;
  /** Type-specific additional properties (numeric scalars, strings, ranges) */
  [key: string]: PropertyRange | string | number | undefined;
}

export interface LODConfig {
  level: 0 | 1 | 2 | 3 | 4;
  /** In current scale units */
  maxDistance: number;
  renderMethod: 'full' | 'simplified' | 'billboard' | 'point' | 'icon';
  /** 1.0 at L0, 0.0 at L4 */
  particleMultiplier: number;
}

export interface EntityRendering {
  shaderFamily: string;
  uniforms: Record<string, number | number[]>;
  particleCount?: { min: number; max: number };
  lodLevels: LODConfig[];
  /** true for nebulae and other volumetric shaders */
  volumetric?: boolean;
}

export interface EntityRealExample {
  name: string;
  data: Record<string, unknown>;
}

/** Definition of one of the 96 catalogue entity types. */
export interface EntityTypeDefinition {
  /** e.g., "ENT-2037" */
  id: string;
  category: EntityCategory;
  name: string;
  shaderFamily: string;
  properties: EntityTypeProperties;
  rendering: EntityRendering;
  /** Which S0-S6 scale levels show this entity */
  visibleAtScales: number[];
  searchTerms: string[];
  realExamples: EntityRealExample[];
}

/** Concrete instance of an entity type placed somewhere in the universe. */
export interface EntityInstance {
  id: string;
  /** References EntityTypeDefinition.id */
  typeId: string;
  name: string;

  position: {
    x: number;
    y: number;
    z: number;
    /** Primary scale level (S0..S6) */
    scaleLevel: number;
  };

  propertyOverrides?: Partial<EntityTypeProperties>;
  renderingOverrides?: Partial<EntityRendering>;

  /** e.g., planet's star, moon's planet */
  parentId?: string;
  childIds?: string[];

  catalogIds?: {
    hipparcos?: string;
    gaia?: string;
    ngc?: string;
    messier?: string;
    exoplanetArchive?: string;
  };
}
