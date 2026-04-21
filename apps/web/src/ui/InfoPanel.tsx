import { useEffect, useState } from 'react';

import type { ApiCatalogIds } from '@/api/types';
import { doc22TypeIdFor } from '@/data/doc22TypeId';
import { lookupDescription } from '@/data/entityDescriptions';
import {
  requestCancelFlyTo,
  requestFlyToEntity,
  requestSetTrackedEntity,
} from '@/engine/engineBridge';
import { useCameraStore } from '@/stores/cameraStore';
import { useSelectionStore } from '@/stores/selectionStore';
import { useUIStore } from '@/stores/uiStore';

import { EntityToggleSection } from './EntityToggleSection';

/**
 * Entity Info Panel — Compact (Doc 24 S-3.0) + Full (S-3.1, T51).
 *
 * Reads from the selection + UI stores; renders a right-anchored
 * AETHER V4 terminal panel describing the current entity.
 *
 * Responsive layout:
 *   - `window.innerWidth < 768` → S-3.0 Compact (width 320px, core props
 *     + fun-fact only) per Doc 24 §15.3 mobile adaptation.
 *   - otherwise           → S-3.1 Full (width 380px) with additional
 *     Identification / Cross-IDs, Observational Info, Tags, and a
 *     reserved slot for the Doc 22 entity toggles that T52 fills.
 *
 * Close behaviour:
 *   - Click the ✕ button → clearSelection() + closePanel('info')
 *   - Escape key (while panel is open) → same
 *
 * Typography follows Doc 24 §3.2. All colours are inline (no CSS
 * module) so the component ships without touching the global stylesheet
 * — T23's theme tokens are still a future cleanup.
 */

/** Doc 24 §15.3 — S-3.1 collapses to S-3.0 below the tablet breakpoint. */
const FULL_LAYOUT_MIN_WIDTH = 768;

// ---- AETHER V4 tokens (Doc 24 §3.1) -------------------------------------

const AETHER = {
  bgSurface: 'rgba(13,13,20,0.92)',
  border: '#2a2a3a',
  borderActive: '#3a3a4a',
  textPrimary: '#e8e8f0',
  textSecondary: '#a0a0b8',
  textTertiary: '#6a6a80',
  textData: '#00e5ff',
  textLabel: '#fbbf24',
  accentPink: '#ff6b9d',
  accentCyan: '#00e5ff',
  accentPurple: '#c084fc',
  accentAmber: '#fbbf24',
  accentGreen: '#4ade80',
  pressStart2p: '"Press Start 2P", "Space Mono", monospace',
  spaceMono: '"Space Mono", "Courier New", monospace',
  ibmPlex: '"IBM Plex Mono", "Space Mono", monospace',
} as const;

// ---- Typography helpers --------------------------------------------------

const h1Style: React.CSSProperties = {
  fontFamily: AETHER.pressStart2p,
  fontSize: 14,
  fontWeight: 400,
  letterSpacing: '1.5px',
  color: AETHER.textPrimary,
  margin: 0,
  textTransform: 'uppercase',
  lineHeight: 1.4,
};

const labelStyle: React.CSSProperties = {
  fontFamily: AETHER.ibmPlex,
  fontSize: 10,
  fontWeight: 400,
  letterSpacing: '1px',
  color: AETHER.textLabel,
  textShadow: `0 0 4px ${AETHER.accentAmber}40`,
  textTransform: 'uppercase',
};

const valueStyle: React.CSSProperties = {
  fontFamily: AETHER.ibmPlex,
  fontSize: 13,
  fontWeight: 600,
  color: AETHER.textData,
  textShadow: `0 0 6px ${AETHER.accentCyan}40`,
  fontVariantNumeric: 'tabular-nums',
};

const factStyle: React.CSSProperties = {
  fontFamily: AETHER.spaceMono,
  fontSize: 11,
  fontStyle: 'italic',
  color: AETHER.textSecondary,
  lineHeight: 1.5,
};

const buttonStyle: React.CSSProperties = {
  fontFamily: AETHER.spaceMono,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  height: 32,
  padding: '0 12px',
  background: 'rgba(255,107,157,0.08)',
  border: `1px solid ${AETHER.accentPink}50`,
  color: AETHER.accentPink,
  cursor: 'pointer',
  borderRadius: 2,
};

// ---- Formatters ----------------------------------------------------------

function formatNumber(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return '0';
  const abs = Math.abs(value);
  if (abs >= 1e9 || abs < 1e-3) {
    return value.toExponential(digits);
  }
  if (abs >= 100) return value.toFixed(0);
  if (abs >= 1) return value.toFixed(digits);
  return value.toPrecision(digits);
}

function formatRadius(km: number): string {
  if (!Number.isFinite(km)) return '—';
  if (km >= 10_000) return `${formatNumber(km, 4)}km`;
  return `${formatNumber(km, 4)}km`;
}

function formatPeriod(days: number): string {
  const abs = Math.abs(days);
  if (abs === 0) return '—';
  if (abs < 2) return `${formatNumber(days, 3)}d`;
  if (abs < 365) return `${formatNumber(days, 3)}d`;
  return `${formatNumber(days / 365.25, 3)}yr`;
}

function formatDistance(value: number, unit: string): string {
  return `${formatNumber(value, 3)}${unit}`;
}

// ---- Subcomponents -------------------------------------------------------

/**
 * Doc 24 §15.3 responsive hook — watches `window.innerWidth` so the panel
 * collapses from S-3.1 Full (380px, all sections) to S-3.0 Compact
 * (320px, core props only) on phones. Subscribes to `resize` because
 * orientation changes below the breakpoint are real-world for tablets.
 */
function useIsFullLayout(): boolean {
  const [isFull, setIsFull] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= FULL_LAYOUT_MIN_WIDTH;
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = (): void => {
      setIsFull(window.innerWidth >= FULL_LAYOUT_MIN_WIDTH);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isFull;
}

/** Doc 26 §5.3 + Doc 23 §6.2 — human-readable labels for each catalog. */
const CATALOG_LABELS: Record<keyof ApiCatalogIds, string> = {
  hipparcos: 'HIP',
  gaia_dr3: 'Gaia DR3',
  tycho2: 'Tycho-2',
  hd: 'HD',
  sao: 'SAO',
  messier: 'Messier',
  ngc: 'NGC',
  ic: 'IC',
  pgc: 'PGC',
  sdss: 'SDSS',
  mpc: 'MPC',
  jplsmd: 'JPL SMD',
};

/**
 * Stable row order (Doc 23 §6.2 authority ranking): stellar catalogues
 * first (Gaia most precise), then bright-star legacy (HIP/HD/Tycho/SAO),
 * then deep-sky (Messier/NGC/IC), then galaxy/small-body ledgers.
 */
const CATALOG_ORDER: ReadonlyArray<keyof ApiCatalogIds> = [
  'gaia_dr3',
  'hipparcos',
  'hd',
  'tycho2',
  'sao',
  'messier',
  'ngc',
  'ic',
  'pgc',
  'sdss',
  'mpc',
  'jplsmd',
];

function renderCatalogIdValue(value: number | string | undefined): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'number') return String(value);
  return value;
}

function CrossIdsTable({ ids }: { ids: ApiCatalogIds }): JSX.Element | null {
  const rows = CATALOG_ORDER
    .map((key) => ({ key, value: ids[key], label: CATALOG_LABELS[key] }))
    .filter(({ value }) => value !== undefined && value !== null && value !== '');
  if (rows.length === 0) return null;
  return (
    <section
      data-testid="info-panel-crossids"
      style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column' }}
    >
      <SectionHeading>Identification</SectionHeading>
      {rows.map(({ key, value, label }) => (
        <DataRow key={key} label={label} value={renderCatalogIdValue(value)} />
      ))}
    </section>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <h3
      style={{
        fontFamily: AETHER.pressStart2p,
        fontSize: 9,
        fontWeight: 400,
        letterSpacing: '1.5px',
        color: AETHER.textLabel,
        textTransform: 'uppercase',
        margin: '4px 0 6px',
      }}
    >
      {children}
    </h3>
  );
}

function Tag({ label, accent }: { label: string; accent: string }): JSX.Element {
  return (
    <span
      style={{
        fontFamily: AETHER.spaceMono,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        padding: '2px 6px',
        color: accent,
        border: `1px solid ${accent}55`,
        background: `${accent}10`,
        borderRadius: 2,
      }}
    >
      {label}
    </span>
  );
}

function hasObservationalFields(payload: {
  constellation?: string;
  ra_deg?: number;
  dec_deg?: number;
  distance_pc?: number | null;
  magnitude_apparent?: number;
  temperature_k?: number;
  spectral_type?: string;
}): boolean {
  return Boolean(
    payload.constellation ||
      typeof payload.ra_deg === 'number' ||
      typeof payload.dec_deg === 'number' ||
      typeof payload.distance_pc === 'number' ||
      typeof payload.magnitude_apparent === 'number' ||
      typeof payload.temperature_k === 'number' ||
      payload.spectral_type,
  );
}

function hasTags(payload: {
  type_name?: string;
  category_name?: string;
  aliases?: string[];
}): boolean {
  return Boolean(
    payload.type_name ||
      payload.category_name ||
      (payload.aliases && payload.aliases.length > 0),
  );
}

function DataRow({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: '6px 0',
        borderBottom: `1px solid ${AETHER.border}`,
        gap: 8,
      }}
    >
      <span style={labelStyle}>{label}</span>
      <span style={valueStyle}>{value}</span>
    </div>
  );
}

// ---- Main component ------------------------------------------------------

export function InfoPanel(): JSX.Element | null {
  const selectedEntity = useSelectionStore((s) => s.selectedEntity);
  const selectedEntityId = useSelectionStore((s) => s.selectedEntityId);
  const isLoadingEntity = useSelectionStore((s) => s.isLoadingEntity);
  const selectionError = useSelectionStore((s) => s.selectionError);
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const infoPanelOpen = useUIStore((s) => s.infoPanelOpen);
  const closePanel = useUIStore((s) => s.closePanel);
  const isTransitioning = useCameraStore((s) => s.isTransitioning);
  const trackedEntityId = useCameraStore((s) => s.trackedEntityId);
  const isTracking = trackedEntityId !== null && trackedEntityId === selectedEntityId;
  const isFullLayout = useIsFullLayout();

  const close = (): void => {
    clearSelection();
    closePanel('info');
  };

  const navigate = (): void => {
    if (selectedEntityId === null) return;
    requestFlyToEntity(selectedEntityId);
  };

  const toggleTrack = (): void => {
    if (selectedEntityId === null) return;
    // T20 — request engine-side toggle. On success the engine updates
    // `cameraStore.trackedEntityId`, which drives the button's active
    // state through the `trackedEntityId` subscription above.
    requestSetTrackedEntity(isTracking ? null : selectedEntityId);
  };

  // Escape closes panel or cancels an in-flight fly-to (Doc 19 §4.2).
  useEffect(() => {
    if (!infoPanelOpen) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      if (isTransitioning) requestCancelFlyTo();
      else close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [infoPanelOpen, isTransitioning]);

  if (!infoPanelOpen || !selectedEntity) return null;

  const payload = selectedEntity.payload as {
    kindLabel?: string;
    parentName?: string | null;
    renderAs?: string | null;
    radius_km?: number;
    obliquity_deg?: number | null;
    hasRings?: boolean;
    semiMajorAxis_display?: number;
    semiMajorAxis_unit?: string;
    eccentricity?: number;
    inclination_deg?: number;
    periodDays?: number;
    isRetrograde?: boolean;
    accentColor?: string;
    icon?: string;
    // T51 additions (populated by entityAdapter for api:entity payloads).
    catalog_ids?: ApiCatalogIds;
    type_name?: string;
    category?: number;
    category_name?: string;
    aliases?: string[];
    ra_deg?: number;
    dec_deg?: number;
    distance_pc?: number | null;
    constellation?: string;
    spectral_type?: string;
    temperature_k?: number;
    magnitude_apparent?: number;
  };

  const accent = payload.accentColor ?? AETHER.accentCyan;
  const icon = payload.icon ?? '◎';

  const fact = buildFact(selectedEntity.name, payload);
  // T51 — prefer a curated description over the one-liner fact when we
  // have one seeded (Doc 33 §8.3 manual-review pool). Falls back to the
  // autogenerated fact so no entity is left description-less.
  const curated = lookupDescription(
    selectedEntity.name,
    ...(payload.aliases ?? []),
    payload.catalog_ids?.messier !== undefined
      ? `M${payload.catalog_ids.messier}`
      : null,
    payload.catalog_ids?.ngc !== undefined
      ? `NGC${payload.catalog_ids.ngc}`
      : null,
  );
  const descriptionText = curated?.summary ?? fact ?? null;

  return (
    <aside
      data-testid="info-panel"
      role="complementary"
      aria-label={`Info panel — ${selectedEntity.name}`}
      data-layout={isFullLayout ? 'full' : 'compact'}
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        width: isFullLayout ? 380 : 320,
        maxHeight: 'calc(100vh - 32px)',
        overflowY: 'auto',
        background: AETHER.bgSurface,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid ${AETHER.border}`,
        borderRadius: 2,
        boxShadow: `0 0 0 1px rgba(0,0,0,0.4), 0 4px 24px rgba(0,0,0,0.6)`,
        zIndex: 20,
        padding: 0,
      }}
    >
      {/* Corner pixel accent (Doc 24 §3.4) */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 4,
          height: 4,
          background: accent,
          opacity: 0.6,
        }}
      />

      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          borderBottom: `1px solid ${accent}66`,
          gap: 8,
          minHeight: 32,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span
            aria-hidden
            style={{
              fontFamily: AETHER.pressStart2p,
              fontSize: 14,
              color: accent,
              textShadow: `0 0 8px ${accent}80`,
              lineHeight: 1,
            }}
          >
            {icon}
          </span>
          <h1
            style={{
              ...h1Style,
              textShadow: `0 0 8px ${accent}80`,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {selectedEntity.name}
          </h1>
        </div>
        <button
          type="button"
          aria-label="Close info panel"
          onClick={close}
          style={{
            width: 24,
            height: 24,
            background: 'transparent',
            border: `1px solid ${AETHER.border}`,
            color: AETHER.textSecondary,
            cursor: 'pointer',
            fontFamily: AETHER.spaceMono,
            fontSize: 14,
            lineHeight: 1,
            padding: 0,
          }}
        >
          ✕
        </button>
      </header>

      {/* Subtitle row: ENT ID + kind badge */}
      <div
        style={{
          padding: '10px 12px 4px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: AETHER.ibmPlex,
            fontSize: 10,
            letterSpacing: 1,
            color: AETHER.textTertiary,
          }}
        >
          {selectedEntity.ent_id}
        </span>
        <span
          style={{
            fontFamily: AETHER.spaceMono,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
            padding: '2px 6px',
            color: accent,
            border: `1px solid ${accent}66`,
            background: `${accent}12`,
            borderRadius: 2,
          }}
        >
          {payload.kindLabel ?? 'Body'}
        </span>
      </div>

      {/* Properties */}
      <section
        style={{
          padding: '8px 12px 12px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {payload.parentName !== null && payload.parentName !== undefined && (
          <DataRow label="Parent" value={payload.parentName} />
        )}
        {typeof payload.radius_km === 'number' && (
          <DataRow label="Radius" value={formatRadius(payload.radius_km)} />
        )}
        {typeof payload.semiMajorAxis_display === 'number' &&
          payload.semiMajorAxis_display > 0 && (
            <DataRow
              label={payload.parentName === 'Sun' || !payload.parentName ? 'Distance' : 'Orbit'}
              value={formatDistance(
                payload.semiMajorAxis_display,
                payload.semiMajorAxis_unit ?? 'AU',
              )}
            />
          )}
        {typeof payload.periodDays === 'number' && payload.periodDays !== 0 && (
          <DataRow
            label="Period"
            value={`${formatPeriod(payload.periodDays)}${payload.isRetrograde ? ' ↩' : ''}`}
          />
        )}
        {typeof payload.eccentricity === 'number' && payload.eccentricity > 0 && (
          <DataRow label="Eccentricity" value={formatNumber(payload.eccentricity, 4)} />
        )}
        {typeof payload.inclination_deg === 'number' && payload.inclination_deg > 0 && (
          <DataRow
            label="Inclination"
            value={`${formatNumber(payload.inclination_deg, 3)}°`}
          />
        )}
        {typeof payload.obliquity_deg === 'number' && payload.obliquity_deg !== null && (
          <DataRow
            label="Obliquity"
            value={`${formatNumber(payload.obliquity_deg, 3)}°`}
          />
        )}
      </section>

      {/* S-3.1 Full-only sections (T51). Hidden at <768 px so the panel
          collapses to S-3.0 Compact on phones per Doc 24 §15.3. */}
      {isFullLayout && payload.catalog_ids && (
        <CrossIdsTable ids={payload.catalog_ids} />
      )}

      {isFullLayout && hasObservationalFields(payload) && (
        <section
          data-testid="info-panel-observational"
          style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column' }}
        >
          <SectionHeading>Observational Info</SectionHeading>
          {payload.constellation && (
            <DataRow label="Constellation" value={payload.constellation} />
          )}
          {typeof payload.ra_deg === 'number' && (
            <DataRow label="RA (ICRS)" value={`${formatNumber(payload.ra_deg, 4)}°`} />
          )}
          {typeof payload.dec_deg === 'number' && (
            <DataRow label="Dec (ICRS)" value={`${formatNumber(payload.dec_deg, 4)}°`} />
          )}
          {typeof payload.distance_pc === 'number' && (
            <DataRow
              label="Distance"
              value={`${formatNumber(payload.distance_pc, 4)} pc`}
            />
          )}
          {typeof payload.magnitude_apparent === 'number' && (
            <DataRow
              label="App. Mag"
              value={formatNumber(payload.magnitude_apparent, 2)}
            />
          )}
          {typeof payload.temperature_k === 'number' && (
            <DataRow
              label="Temperature"
              value={`${formatNumber(payload.temperature_k, 0)} K`}
            />
          )}
          {payload.spectral_type && (
            <DataRow label="Spectral" value={payload.spectral_type} />
          )}
        </section>
      )}

      {isFullLayout && hasTags(payload) && (
        <section
          data-testid="info-panel-tags"
          style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column' }}
        >
          <SectionHeading>Tags</SectionHeading>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {payload.type_name && <Tag accent={accent} label={payload.type_name} />}
            {payload.category_name && payload.category_name !== payload.type_name && (
              <Tag accent={accent} label={payload.category_name} />
            )}
            {(payload.aliases ?? []).slice(0, 6).map((alias) => (
              <Tag key={alias} accent={AETHER.textTertiary} label={alias} />
            ))}
          </div>
        </section>
      )}

      {/* T52 — Doc 22 entity toggles. Auto-generated spec in
          @cosmos/shared-types/entityToggles drives the per-feature rows;
          writes land in `entityToggleStore`. S-3.0 Compact mode hides the
          section to keep the panel scannable on phones. The selected
          instance's ENT-ID (e.g. ENT-2599 for Jupiter) is mapped to Doc 22's
          type-level ID (ENT-2020) via `doc22TypeIdFor`. */}
      {isFullLayout && (
        <div data-testid="info-panel-toggle-slot">
          <EntityToggleSection
            entId={doc22TypeIdFor(selectedEntity.ent_id)}
            accent={accent}
          />
        </div>
      )}

      {/* Description — curated prose (T51 Doc 33 §8.3) with autogenerated
          fun-fact fallback (the original S-3.0 behaviour). */}
      {descriptionText && (
        <section style={{ padding: '0 12px 12px' }}>
          <p style={{ ...factStyle, margin: 0 }}>{descriptionText}</p>
        </section>
      )}

      {/* Actions — 2×2 grid.  Row 1: Navigate + Track (primary actions).
          Row 2: Bookmark + Share (T23 placeholders). */}
      <footer
        style={{
          padding: 12,
          borderTop: `1px solid ${AETHER.border}`,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 8,
        }}
      >
        <button
          type="button"
          aria-label={`Fly to ${selectedEntity.name}`}
          title={isTransitioning ? 'Fly-to in progress\u2026' : `Fly to ${selectedEntity.name}`}
          disabled={isTransitioning}
          onClick={navigate}
          style={{
            ...buttonStyle,
            opacity: isTransitioning ? 0.5 : 1,
            cursor: isTransitioning ? 'progress' : 'pointer',
          }}
        >
          {isTransitioning ? 'Flying\u2026' : 'Navigate'}
        </button>
        <button
          type="button"
          aria-label={
            isTracking
              ? `Stop tracking ${selectedEntity.name}`
              : `Track ${selectedEntity.name}`
          }
          aria-pressed={isTracking}
          title={
            isTracking
              ? `Camera is locked to ${selectedEntity.name}.  Click to release.`
              : `Lock camera to ${selectedEntity.name} as it orbits through time.`
          }
          onClick={toggleTrack}
          style={{
            ...buttonStyle,
            borderColor: isTracking
              ? `${AETHER.accentGreen}`
              : `${AETHER.accentGreen}50`,
            color: isTracking ? '#0d0d14' : AETHER.accentGreen,
            background: isTracking
              ? AETHER.accentGreen
              : 'rgba(74,222,128,0.08)',
            textShadow: isTracking ? 'none' : `0 0 6px ${AETHER.accentGreen}60`,
            fontWeight: 700,
          }}
        >
          {isTracking ? '\u25C9 Tracking' : 'Track'}
        </button>
        <button
          type="button"
          disabled
          title="Bookmarks ship with T23"
          style={{
            ...buttonStyle,
            borderColor: `${AETHER.accentAmber}50`,
            color: AETHER.accentAmber,
            background: 'rgba(251,191,36,0.06)',
            opacity: 0.5,
            cursor: 'not-allowed',
          }}
        >
          Bookmark
        </button>
        <button
          type="button"
          disabled
          title="Share dialog ships with T23"
          style={{
            ...buttonStyle,
            borderColor: `${AETHER.accentPurple}50`,
            color: AETHER.accentPurple,
            background: 'rgba(192,132,252,0.06)',
            opacity: 0.5,
            cursor: 'not-allowed',
          }}
        >
          Share
        </button>
      </footer>

      {/* T18 live-data status line: shows while the HTTP upgrade is in
          flight or if it failed (optimistic data is still displayed). */}
      {(isLoadingEntity || selectionError) && (
        <div
          data-testid="info-panel-status"
          style={{
            borderTop: `1px solid ${AETHER.border}`,
            padding: '6px 12px',
            fontFamily: AETHER.ibmPlex,
            fontSize: 10,
            color: selectionError ? AETHER.accentPink : AETHER.textTertiary,
            letterSpacing: 0.5,
          }}
        >
          {isLoadingEntity
            ? '◦ SYNCING…'
            : `◦ OFFLINE (${(selectionError ?? '').slice(0, 40)})`}
        </div>
      )}

      {/* dev-only: show id for debugging selection flow */}
      {import.meta.env?.DEV && (
        <div
          style={{
            borderTop: `1px solid ${AETHER.border}`,
            padding: '6px 12px',
            fontFamily: AETHER.ibmPlex,
            fontSize: 9,
            color: AETHER.textTertiary,
            letterSpacing: 0.5,
          }}
        >
          naif={selectedEntityId} · render={payload.renderAs ?? '—'} · src=
          {((payload as { source?: string }).source ?? 'catalog').replace('api:', '')}
        </div>
      )}
    </aside>
  );
}

// ---- Fact generator ------------------------------------------------------

/**
 * Lightweight "interesting fact" line per body. Doc 24 S-3.0 spec includes
 * one italic fact row — a full knowledge-base lookup is out of scope for
 * T15, so we handcraft a small table keyed by the bodies most likely to
 * be picked in the demo. Anything unknown falls back to a generic note.
 */
function buildFact(
  name: string,
  payload: { kindLabel?: string; parentName?: string | null; hasRings?: boolean },
): string | null {
  const FACTS: Record<string, string> = {
    Sun: 'Holds 99.86% of the Solar System\u2019s mass.',
    Mercury: 'Fastest planet: one orbit every 88 Earth days.',
    Venus: 'Hottest surface in the Solar System — 465°C average.',
    Earth: 'Only known world to host liquid-water oceans and life.',
    Mars: 'Home to Olympus Mons, the tallest volcano in the Solar System.',
    Jupiter: 'Its Great Red Spot has been raging for 350+ years.',
    Saturn: 'Ring system spans 282,000 km but is <1 km thick.',
    Uranus: 'Rotates on its side — 97.77° axial tilt.',
    Neptune: 'Supersonic winds top 2,100 km/h — fastest in the system.',
    Pluto: 'Its heart-shaped Tombaugh Regio was revealed by New Horizons.',
    Moon: 'Recedes from Earth by 3.8 cm every year.',
    Io: 'Most volcanically active body known — 400+ active volcanoes.',
    Europa: 'Subsurface ocean holds more water than all Earth\u2019s oceans.',
    Titan: 'Only moon with a dense atmosphere and liquid hydrocarbon lakes.',
    Triton: 'Orbits Neptune retrograde — likely a captured Kuiper Belt object.',
    Ganymede: 'Largest moon in the Solar System — bigger than Mercury.',
    Callisto: 'Most heavily cratered body in the Solar System.',
    Enceladus: 'Geysers of water-ice erupt from its south pole.',
  };
  if (FACTS[name]) return FACTS[name] ?? null;
  if (payload.hasRings) return `${name} carries a visible ring system.`;
  if (payload.parentName) {
    return `${payload.kindLabel ?? 'Body'} of ${payload.parentName}.`;
  }
  return null;
}
