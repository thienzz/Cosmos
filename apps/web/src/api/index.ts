/**
 * Barrel for the web app's HTTP client. Import from `@/api` rather than
 * drilling into individual modules so the implementation can grow (search,
 * tiles, cone queries) without ripple edits in every consumer.
 */

export { apiConfig, type ApiConfig, type FetchLike } from './config';
export {
  apiGet,
  apiGetBinary,
  apiGetCollection,
  apiPost,
  ApiError,
  clearEtagCache,
  getRateLimit,
  type BinaryResponse,
  type CollectionResult,
  type RateLimitSnapshot,
  type RequestOptions,
} from './client';
export {
  fetchCosmicWebTile,
  fetchGalaxyTile,
  fetchManifest,
  fetchStarTile,
  fetchTileByAddress,
  type TileFetchOptions,
} from './tiles';
export {
  getEntity,
  getEntityByCatalog,
  getEntityByEntId,
  clearEntityCache,
  peekEntityCache,
  type EntityFetchOptions,
} from './entities';
export {
  parseSearchPrefix,
  formatPrefix,
  type CatalogKey,
  type ParsedSearchPrefix,
} from './searchPrefix';
export {
  getSolarSystemBody,
  listSolarSystemBodies,
  type GetBodyOptions,
  type ListBodiesOptions,
} from './solarSystem';
export {
  searchAutocomplete,
  searchText,
  searchCone,
  clearAutocompleteCache,
  computeBoostedScore,
  type AutocompleteItem,
  type AutocompleteOptions,
  type AutocompleteResponse,
  type ConeSearchItem,
  type ConeSearchOptions,
  type TextSearchItem,
  type TextSearchOptions,
} from './search';
export {
  getEphemeris,
  getEphemerisRange,
  postEphemerisBatch,
  validateBatchEphemerisRequest,
  BatchEphemerisError,
  BATCH_EPHEMERIS_LIMITS,
  EphemerisPushDispatcher,
  isEphemerisPushMessage,
  sendTimeUpdate,
  type BatchEphemerisRequest,
  type BatchEphemerisResponse,
  type BatchEphemerisResult,
  type EphemerisPushBody,
  type EphemerisPushMessage,
  type GetEphemerisOptions,
  type GetEphemerisRangeOptions,
  type TimeUpdateMessage,
  type WebSocketLike,
} from './ephemeris';
export {
  CosmosWebSocket,
  deriveWebSocketUrl,
  type ConnectionState,
  type CosmosWebSocketOptions,
  type CosmosWsListeners,
  type CosmosWsMessage,
  type WebSocketAdapter,
  type WebSocketFactory,
  type WsConnectedMessage,
  type WsDataVersionUpdateMessage,
  type WsEphemerisPushBody,
  type WsEphemerisPushMessage,
  type WsExportProgressMessage,
  type WsTilePriorityMessage,
} from './websocket';
export type {
  ApiCatalogIds,
  ApiCollectionEnvelope,
  ApiDataSource,
  ApiEntity,
  ApiEntityCategory,
  ApiEnvelope,
  ApiEphemerisFrame,
  ApiEphemerisPoint,
  ApiEphemerisRange,
  ApiErrorBody,
  ApiErrorCode,
  ApiErrorResponse,
  ApiKeplerianElements,
  ApiMeta,
  ApiPagination,
  ApiPhysicalProperties,
  ApiPosition,
  ApiSolarSystemBody,
  ApiSolarSystemBodyType,
  ApiVec3,
} from './types';
