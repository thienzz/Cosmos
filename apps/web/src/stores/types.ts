/**
 * Store-local types that are not yet stable enough to live in @cosmos/shared-types.
 * Promote to shared-types once API/backend contracts settle (Doc 26).
 */
import type { ObjectType } from '@cosmos/shared-types';

/** Payload returned by GET /entities/{id}. Refined when T18 lands the real client. */
export interface EntityData {
  id: number;
  ent_id: string;
  object_type: ObjectType;
  name: string;
  payload: Record<string, unknown>;
}

/** Lightweight preview shown on hover; no network fetch beyond autocomplete. */
export interface EntityPreview {
  id: number;
  name: string;
  object_type: ObjectType;
  magnitude?: number;
  distance?: number;
}

/** Autocomplete suggestion (/search/autocomplete response item). */
export interface AutocompleteSuggestion {
  id: number;
  name: string;
  object_type: ObjectType;
  /** Relevance score 0–1 */
  score: number;
}

/** Tile manifest header (served at /v1/tiles/manifest). */
export interface TileManifest {
  version: string;
  generatedAt: string;
  totalTiles: number;
  totalBytes: number;
  lodLevels: number;
}

/** Resolved tile addressing, used as Map key (e.g. "stars/4/12/7/3"). */
export type TileAddress = string;

export type TileLoadState =
  | { status: 'pending' }
  | { status: 'loading'; startedAt: number }
  | {
      status: 'loaded';
      buffer: ArrayBuffer;
      loadedAt: number;
      lastAccessedAt: number;
      sizeBytes: number;
    }
  | { status: 'failed'; error: string; failedAt: number; retryCount: number };

/** UI toast/notification. Renamed from Doc 27 `Notification` to avoid DOM clash. */
export interface UINotification {
  id: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  message: string;
  /** Auto-dismiss after `ttlMs`. `null` means sticky until user dismisses. */
  ttlMs: number | null;
  createdAt: number;
}

/** Keys of HUD toggles in uiStore; also used by togglePanel/HUD actions. */
export type HUDElement =
  | 'grid'
  | 'constellationLines'
  | 'labels'
  | 'orbitalPaths'
  | 'scaleBar';

export type PanelName =
  | 'info'
  | 'search'
  | 'settings'
  | 'timeline'
  | 'miniMap';

export type ModalName = 'fitsImport' | 'export' | 'share';

export type ScaleRegime = 'solar_system' | 'stellar' | 'galactic' | 'cosmic';

export type AppMode =
  | 'exploration'
  | 'observation'
  | 'education'
  | 'guided_tour'
  | 'research';
