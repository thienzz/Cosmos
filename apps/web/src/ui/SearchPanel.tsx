import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  getEntityByEntId,
  getSolarSystemBody,
  type AutocompleteItem,
  type TextSearchItem,
} from '@/api';
import { apiSolarSystemBodyToEntityData } from '@/data/entityAdapter';
import {
  requestFlyToCelestialCoord,
  requestFlyToEntity,
} from '@/engine/engineBridge';
import { useSearchStore } from '@/stores/searchStore';
import { useSelectionStore } from '@/stores/selectionStore';
import { useUIStore } from '@/stores/uiStore';

/**
 * Global search (Doc 21 Screen 1.11, Doc 26 §6).
 *
 * Layout: top-center search input that expands a dropdown with grouped
 * suggestions + full-text results + category/magnitude/distance filter
 * chips. Key behaviour:
 *
 *   - `/` or `Ctrl+K` focuses the input from anywhere (gated on
 *     INPUT/TEXTAREA focus, so typing isn't hijacked).
 *   - 150 ms debounce on autocomplete (Doc 27 §7.2).
 *   - Enter on the input or Enter on a highlighted suggestion triggers
 *     selection; Arrow Up/Down cycles the highlight.
 *   - Selection fires `selectEntityAsync` (T18) and `requestFlyToEntity`
 *     (T16) so the camera lands on the picked body.
 *   - Escape blurs + closes the dropdown; a second Escape clears the query.
 */

// Styling tokens (Doc 21 §Screen 1.11 + Doc 24 §3.1 bridge).
const TOKENS = {
  inputBg: 'rgba(15,23,42,0.85)',
  dropdownBg: 'rgba(15,23,42,0.98)',
  border: 'rgba(37,99,235,0.3)',
  borderStrong: 'rgba(37,99,235,0.5)',
  hoverBg: 'rgba(37,99,235,0.08)',
  selectedBg: 'rgba(37,99,235,0.18)',
  text: '#e5e7eb',
  textMuted: '#9ca3af',
  textPlaceholder: '#6b7280',
  badgeBg: 'rgba(37,99,235,0.2)',
  badgeText: '#60a5fa',
  inter:
    'Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif',
  ibmPlex: '"IBM Plex Mono", "Space Mono", monospace',
  dangerText: '#ff6b9d',
};

const DEBOUNCE_MS = 150;

type Row =
  | { kind: 'suggestion'; index: number; item: AutocompleteItem }
  | { kind: 'result'; index: number; item: TextSearchItem };

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

function formatDistance(ly?: number): string {
  if (typeof ly !== 'number' || !Number.isFinite(ly)) return '';
  if (ly < 1) return `${(ly * 63_241).toFixed(1)} AU`; // 1 ly ≈ 63 241 AU
  if (ly < 1_000) return `${ly.toFixed(2)} ly`;
  if (ly < 1_000_000) return `${(ly / 1_000).toFixed(1)} kly`;
  return `${(ly / 1_000_000).toFixed(2)} Mly`;
}

function formatMagnitude(m?: number): string {
  if (typeof m !== 'number' || !Number.isFinite(m)) return '';
  return `mag ${m.toFixed(2)}`;
}

function stripHighlight(text: string): string {
  return text.replace(/<\/?em>/gi, '');
}

// ---------------------------------------------------------------------------
// Result row helpers (render highlight HTML safely)
// ---------------------------------------------------------------------------

const HIGHLIGHT_RE = /<em>([^<]*)<\/em>/gi;

function SuggestionText({ item }: { item: AutocompleteItem }): JSX.Element {
  const raw = item.highlight ?? item.text;
  const parts: Array<{ text: string; em: boolean }> = [];
  let cursor = 0;
  for (const match of raw.matchAll(HIGHLIGHT_RE)) {
    const [full, inner] = match;
    const start = match.index ?? 0;
    if (start > cursor) parts.push({ text: raw.slice(cursor, start), em: false });
    parts.push({ text: inner ?? '', em: true });
    cursor = start + full.length;
  }
  if (cursor < raw.length) parts.push({ text: raw.slice(cursor), em: false });
  if (parts.length === 0) parts.push({ text: raw, em: false });
  return (
    <span>
      {parts.map((p, i) =>
        p.em ? (
          <em
            key={i}
            style={{ fontStyle: 'normal', color: TOKENS.badgeText, fontWeight: 600 }}
          >
            {p.text}
          </em>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SearchPanel(): JSX.Element | null {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const acAbortRef = useRef<AbortController | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);

  // Store selectors.
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const autocompleteItems = useSearchStore((s) => s.autocompleteItems);
  const resultItems = useSearchStore((s) => s.resultItems);
  const isSearching = useSearchStore((s) => s.isSearching);
  const isAutocompleting = useSearchStore((s) => s.isAutocompleting);
  const searchError = useSearchStore((s) => s.searchError);
  const totalResults = useSearchStore((s) => s.totalResults);
  const filters = useSearchStore((s) => s.filters);
  const setFilter = useSearchStore((s) => s.setFilter);
  const clearFilters = useSearchStore((s) => s.clearFilters);
  const clear = useSearchStore((s) => s.clear);
  const pagination = useSearchStore((s) => s.pagination);
  const loadMore = useSearchStore((s) => s.loadMore);
  const searchPanelOpen = useUIStore((s) => s.searchPanelOpen);
  const openPanel = useUIStore((s) => s.openPanel);
  const closePanel = useUIStore((s) => s.closePanel);

  // -------------------------------------------------------------------
  // Debounced autocomplete + full-text fetch.
  // -------------------------------------------------------------------
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    acAbortRef.current?.abort();
    searchAbortRef.current?.abort();
    if (query.trim().length === 0) {
      useSearchStore.setState({
        autocomplete: [],
        autocompleteItems: [],
        results: [],
        resultItems: [],
        totalResults: 0,
      });
      return;
    }
    debounceRef.current = setTimeout(() => {
      const acCtrl = new AbortController();
      const searchCtrl = new AbortController();
      acAbortRef.current = acCtrl;
      searchAbortRef.current = searchCtrl;
      void useSearchStore.getState().fetchAutocomplete({ signal: acCtrl.signal });
      void useSearchStore.getState().runTextSearch({ signal: searchCtrl.signal });
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // filters need to re-run: changing category means different results.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filters.category, filters.magnitudeMax, filters.distanceMaxPc]);

  // -------------------------------------------------------------------
  // Global keyboard shortcut: "/" or Ctrl+K focuses input.
  // -------------------------------------------------------------------
  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName ?? '';
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable;
      const isSlash = event.key === '/' && !isTyping;
      const isCmdK = event.key.toLowerCase() === 'k' && (event.ctrlKey || event.metaKey);
      if (isSlash || isCmdK) {
        event.preventDefault();
        openPanel('search');
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openPanel]);

  // -------------------------------------------------------------------
  // Click outside closes dropdown.
  // -------------------------------------------------------------------
  useEffect(() => {
    if (!isOpen) return;
    const handler = (event: MouseEvent): void => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // -------------------------------------------------------------------
  // Reset highlight on row changes.
  // -------------------------------------------------------------------
  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    autocompleteItems.slice(0, 5).forEach((item, index) =>
      out.push({ kind: 'suggestion', index, item }),
    );
    resultItems.forEach((item, index) => out.push({ kind: 'result', index, item }));
    return out;
  }, [autocompleteItems, resultItems]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [query]);

  // -------------------------------------------------------------------
  // Row activation → selectEntityAsync + fly-to.
  // -------------------------------------------------------------------
  const activateRow = useCallback(async (row: Row): Promise<void> => {
    // ETL frequently ranks semantically-weak canonical docs above richer
    // sub-documents — e.g. "Andromeda" matches the constellation centroid
    // (ENT-7050, no distance, no galaxy shader) ahead of the Andromeda
    // Galaxy (GAL-m31, full catalog entry + procedural spiral). When the
    // clicked row lacks both a NAIF id AND ra/dec, promote it to any
    // sibling with the same display text that carries richer data. That
    // way a user searching "Andromeda" lands on the galaxy even when the
    // top autocomplete hit is the constellation stub.
    const clickedText =
      row.kind === 'suggestion' ? stripHighlight(row.item.text) : row.item.name;
    const rowText = (r: Row): string =>
      r.kind === 'suggestion' ? stripHighlight(r.item.text) : r.item.name;
    const rowHasActionable = (r: Row): boolean => {
      const id = r.item.id;
      const rra = r.item.ra;
      const rdec = r.item.dec;
      return (
        typeof id === 'number' ||
        (typeof rra === 'number' && typeof rdec === 'number')
      );
    };
    // Score each row so the promotion picks the entry most likely to
    // render a meaningful visualization:
    //
    //   +3  catalog-backed ent_id (GAL-/NEB-/EXO-/HIP-/STAR-/OC-/GC-/OB-)
    //       → SearchTargetMarker mounts its procedural shader.
    //   +2  has a real heliocentric distance → marker lands at the
    //       proper extragalactic depth rather than the null-distance
    //       "60k u sky direction" cap.
    //   +1  has a NAIF id or ra/dec fields at all (Path A/B eligible).
    //
    // For ambiguous names like "Andromeda" this boosts GAL-m31 ahead of
    // the constellation centroid and the plain E-353 duplicate.
    const richnessScore = (r: Row): number => {
      let s = 0;
      const id = r.item.id;
      const rra = r.item.ra;
      const rdec = r.item.dec;
      const dist = r.item.distance_pc;
      const entId = typeof r.item.ent_id === 'string' ? r.item.ent_id : '';
      if (
        /^(GAL|NEB|EXO|HIP|STAR|OC|GC|OB)-/.test(entId)
      ) {
        s += 3;
      }
      if (typeof dist === 'number' && Number.isFinite(dist) && dist > 0) s += 2;
      if (typeof id === 'number') s += 1;
      if (typeof rra === 'number' && typeof rdec === 'number') s += 1;
      return s;
    };
    const clickedScore = richnessScore(row);
    if (!rowHasActionable(row) || clickedScore < 3) {
      // Scan for a higher-scoring sibling with the same display text.
      let best: Row | null = null;
      let bestScore = clickedScore;
      for (const candidate of rows) {
        if (candidate === row) continue;
        if (rowText(candidate) !== clickedText) continue;
        if (!rowHasActionable(candidate)) continue;
        const score = richnessScore(candidate);
        if (score > bestScore) {
          bestScore = score;
          best = candidate;
        }
      }
      if (best) row = best;
    }

    const rawId = row.item.id;
    const ent_id = row.item.ent_id;
    const name =
      row.kind === 'suggestion' ? stripHighlight(row.item.text) : row.item.name;
    const ra = typeof row.item.ra === 'number' ? row.item.ra : null;
    const dec = typeof row.item.dec === 'number' ? row.item.dec : null;
    const distancePc =
      typeof row.item.distance_pc === 'number' ? row.item.distance_pc : null;

    // Path priority: numeric NAIF id > ICRS ra/dec > stub.
    //
    // Path A — numeric NAIF id (solar bodies): goes through the existing
    //   SolarSystemRenderer pipeline (flyToEntity with proper approach distance
    //   + parent-aware geometry). Solar bodies ORBIT so any static RA/Dec
    //   we might have is stale — NAIF lookup resolves live position.
    //
    // Path B — ICRS coordinates (Messier / NGC / galaxy / nebula from T38):
    //   no rendered mesh yet, so flyToCelestialCoord rotates the camera
    //   toward the sky direction at a fixed marker distance.
    //
    // Path C — neither id nor coords: stub InfoPanel, no camera action.
    const numericId = typeof rawId === 'number' ? rawId : null;

    if (numericId !== null) {
      // Optimistic open: seed selection + kick fly-to + show panel IMMEDIATELY.
      // Enrichment (distance, mass, etc.) fetches in the background — if the
      // API stub returns 500 (pre-T18), the optimistic payload stays on
      // screen because selectEntityAsync reseeds with this same data.
      const optimistic = {
        id: numericId,
        ent_id,
        object_type: 'star' as const,
        name,
        payload: {},
      };
      openPanel('info');
      requestFlyToEntity(numericId);
      setIsOpen(false);
      inputRef.current?.blur();
      void useSelectionStore
        .getState()
        .selectEntityAsync(numericId, optimistic, {
          fetcher: async (naifId) => {
            const body = await getSolarSystemBody(naifId);
            return apiSolarSystemBodyToEntityData(body);
          },
        })
        .catch(() => {
          // Pre-T18 stub failures are expected; swallow to keep the UI
          // responsive. The optimistic payload above stays on screen.
        });
      return;
    }

    if (ra !== null && dec !== null) {
      useSelectionStore.getState().selectEntity(0, {
        id: 0,
        ent_id,
        object_type: 'star',
        name,
        payload: {
          ra_deg: ra,
          dec_deg: dec,
          distance_pc: distancePc,
        },
      });
      openPanel('info');
      // P2E — pass the object name so SceneManager spawns a labelled
      // marker at the fly-to target (galaxy / nebula / exotic catalogs
      // aren't meshed in the current regime, so without this the frame
      // looks empty).
      // P2F — also pass the ent_id so SearchTargetMarker can mount the
      // object's procedural shader (galaxy / nebula / exotic) instead of
      // only a generic orb.
      requestFlyToCelestialCoord(ra, dec, distancePc, { label: name, entId: ent_id });
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }

    // Path C — suggestion had neither NAIF id nor ra/dec (common for ETL
    // aggregate docs like `ENT-1000` that strip coords off the canonical
    // record). Fall back to the entity-detail endpoint: the `entities`
    // table always carries ra_deg/dec_deg and `catalog_ids.naif` where
    // applicable, so we can re-route through Path A or Path B once the
    // detail fetch settles. Keeps the click from being a dead no-op when
    // the user picks the most-obvious (topmost) suggestion.
    if (ent_id) {
      try {
        const entity = await getEntityByEntId(ent_id);
        const naifRaw = (entity.catalog_ids as Record<string, unknown> | undefined)?.naif;
        const naifId = typeof naifRaw === 'number' ? naifRaw : null;
        const detailRa = typeof entity.ra_deg === 'number' ? entity.ra_deg : null;
        const detailDec = typeof entity.dec_deg === 'number' ? entity.dec_deg : null;
        const detailDistancePc =
          typeof entity.distance_pc === 'number' ? entity.distance_pc : null;

        if (naifId !== null) {
          openPanel('info');
          requestFlyToEntity(naifId);
          setIsOpen(false);
          inputRef.current?.blur();
          void useSelectionStore
            .getState()
            .selectEntityAsync(
              naifId,
              {
                id: naifId,
                ent_id,
                object_type: 'star',
                name,
                payload: {},
              },
              {
                fetcher: async (nid) => {
                  const body = await getSolarSystemBody(nid);
                  return apiSolarSystemBodyToEntityData(body);
                },
              },
            )
            .catch(() => {});
          return;
        }

        if (detailRa !== null && detailDec !== null) {
          useSelectionStore.getState().selectEntity(0, {
            id: 0,
            ent_id,
            object_type: 'star',
            name,
            payload: {
              ra_deg: detailRa,
              dec_deg: detailDec,
              distance_pc: detailDistancePc,
            },
          });
          openPanel('info');
          requestFlyToCelestialCoord(detailRa, detailDec, detailDistancePc, {
            label: name,
            entId: ent_id,
          });
          setIsOpen(false);
          inputRef.current?.blur();
          return;
        }
      } catch {
        // Fall through to stub below — entity detail genuinely unavailable.
      }
    }

    useSelectionStore.getState().selectEntity(0, {
      id: 0,
      ent_id,
      object_type: 'star',
      name,
      payload: {},
    });
    openPanel('info');
  }, [openPanel, rows]);

  // -------------------------------------------------------------------
  // Input keydown — Arrow / Enter / Escape.
  // -------------------------------------------------------------------
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (query.length > 0) clear();
        else {
          setIsOpen(false);
          closePanel('search');
          inputRef.current?.blur();
        }
        return;
      }
      if (rows.length === 0) return;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, rows.length - 1));
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const row = rows[highlightIndex];
        if (row) void activateRow(row);
      }
    },
    [rows, highlightIndex, query, activateRow, clear, closePanel],
  );

  const onFocus = useCallback((): void => {
    setIsOpen(true);
    openPanel('search');
  }, [openPanel]);

  // -------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------
  const suggestionRows = rows.filter((r) => r.kind === 'suggestion');
  const resultRows = rows.filter((r) => r.kind === 'result');
  const showDropdown = isOpen && (searchPanelOpen || query.length > 0);
  const showEmpty =
    showDropdown &&
    query.trim().length > 0 &&
    !isSearching &&
    rows.length === 0 &&
    searchError === null;

  return (
    <div
      ref={containerRef}
      data-testid="search-panel"
      style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 25,
        fontFamily: TOKENS.inter,
        width: 400,
      }}
    >
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          data-testid="search-input"
          type="search"
          role="searchbox"
          aria-label="Search celestial objects"
          autoComplete="off"
          spellCheck={false}
          placeholder="Search objects…   /"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          style={{
            width: '100%',
            boxSizing: 'border-box',
            height: 36,
            padding: '0 36px 0 14px',
            background: TOKENS.inputBg,
            border: `1px solid ${showDropdown ? TOKENS.borderStrong : TOKENS.border}`,
            borderRadius: 8,
            color: TOKENS.text,
            fontFamily: TOKENS.inter,
            fontSize: 14,
            outline: 'none',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        />
        {query.length > 0 && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              clear();
              inputRef.current?.focus();
            }}
            style={{
              position: 'absolute',
              right: 8,
              top: 6,
              width: 24,
              height: 24,
              border: 'none',
              background: 'transparent',
              color: TOKENS.textMuted,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          data-testid="search-dropdown"
          role="listbox"
          style={{
            marginTop: 8,
            maxHeight: 480,
            overflowY: 'auto',
            background: TOKENS.dropdownBg,
            border: `1px solid ${TOKENS.border}`,
            borderRadius: 8,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 10px 24px rgba(0,0,0,0.6)',
          }}
        >
          {/* --- Filter chips --- */}
          <FilterChips
            filters={filters}
            setFilter={setFilter}
            clearFilters={clearFilters}
          />

          {/* --- Loading indicator --- */}
          {(isAutocompleting || isSearching) && (
            <div
              data-testid="search-loading"
              style={{
                padding: '8px 16px',
                fontFamily: TOKENS.ibmPlex,
                fontSize: 11,
                color: TOKENS.textMuted,
                letterSpacing: 0.5,
              }}
            >
              ◦ Searching…
            </div>
          )}

          {/* --- Error --- */}
          {searchError && (
            <div
              data-testid="search-error"
              style={{
                padding: '8px 16px',
                fontFamily: TOKENS.ibmPlex,
                fontSize: 11,
                color: TOKENS.dangerText,
                letterSpacing: 0.5,
              }}
            >
              ◦ {searchError.slice(0, 80)}
            </div>
          )}

          {/* --- Suggestions group --- */}
          {suggestionRows.length > 0 && (
            <GroupHeader label={`SUGGESTIONS (${suggestionRows.length})`} />
          )}
          {suggestionRows.map((row, i) => {
            const globalIndex = i;
            const active = globalIndex === highlightIndex;
            return (
              <SuggestionRow
                key={`s-${row.index}`}
                item={row.item}
                active={active}
                onPointerEnter={() => setHighlightIndex(globalIndex)}
                onClick={() => void activateRow(row)}
              />
            );
          })}

          {/* --- Results group --- */}
          {resultRows.length > 0 && (
            <GroupHeader
              label={`CELESTIAL OBJECTS (${totalResults} result${totalResults === 1 ? '' : 's'})`}
            />
          )}
          {resultRows.map((row, i) => {
            const globalIndex = suggestionRows.length + i;
            const active = globalIndex === highlightIndex;
            return (
              <ResultRow
                key={`r-${row.index}`}
                item={row.item}
                active={active}
                onPointerEnter={() => setHighlightIndex(globalIndex)}
                onClick={() => void activateRow(row)}
              />
            );
          })}

          {/* --- Load more --- */}
          {pagination.hasMore && resultRows.length > 0 && (
            <div style={{ padding: '8px 16px' }}>
              <button
                type="button"
                data-testid="search-load-more"
                disabled={isSearching}
                onClick={() => void loadMore()}
                style={{
                  width: '100%',
                  height: 32,
                  border: `1px dashed ${TOKENS.borderStrong}`,
                  background: 'rgba(37,99,235,0.15)',
                  color: TOKENS.badgeText,
                  fontFamily: TOKENS.inter,
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: 0.5,
                  cursor: isSearching ? 'progress' : 'pointer',
                  borderRadius: 4,
                }}
              >
                ↓ Load more results
              </button>
            </div>
          )}

          {/* --- Empty state --- */}
          {showEmpty && (
            <div
              data-testid="search-empty"
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                color: TOKENS.textMuted,
              }}
            >
              <div style={{ fontSize: 32, opacity: 0.6 }}>⌕</div>
              <div
                style={{
                  marginTop: 8,
                  color: TOKENS.text,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                No Results Found
              </div>
              <div style={{ marginTop: 6, fontSize: 11, lineHeight: 1.6 }}>
                Refine your search terms · Check spelling · Use fewer filters
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function GroupHeader({ label }: { label: string }): JSX.Element {
  return (
    <div
      style={{
        padding: '10px 16px 4px',
        fontFamily: TOKENS.inter,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
        color: TOKENS.textMuted,
      }}
    >
      {label}
    </div>
  );
}

function CategoryBadge({ label }: { label: string }): JSX.Element {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 6px',
        borderRadius: 3,
        background: TOKENS.badgeBg,
        color: TOKENS.badgeText,
        fontFamily: TOKENS.inter,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: 0.3,
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  );
}

function SuggestionRow({
  item,
  active,
  onPointerEnter,
  onClick,
}: {
  item: AutocompleteItem;
  active: boolean;
  onPointerEnter: () => void;
  onClick: () => void;
}): JSX.Element {
  return (
    <div
      role="option"
      aria-selected={active}
      onPointerEnter={onPointerEnter}
      onClick={onClick}
      style={rowStyle(active)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: TOKENS.textMuted, fontSize: 12 }}>⌕</span>
        <span style={{ color: TOKENS.text, fontSize: 13, fontWeight: 500 }}>
          <SuggestionText item={item} />
        </span>
        <span style={{ marginLeft: 'auto' }}>
          <CategoryBadge label={item.category_name} />
        </span>
      </div>
    </div>
  );
}

function ResultRow({
  item,
  active,
  onPointerEnter,
  onClick,
}: {
  item: TextSearchItem;
  active: boolean;
  onPointerEnter: () => void;
  onClick: () => void;
}): JSX.Element {
  const distanceLabel = formatDistance(item.distance_ly);
  const magLabel = formatMagnitude(item.magnitude_apparent);
  const meta = [item.constellation, magLabel, distanceLabel]
    .filter((s) => s && s.length > 0)
    .join(' · ');
  return (
    <div
      role="option"
      aria-selected={active}
      onPointerEnter={onPointerEnter}
      onClick={onClick}
      style={rowStyle(active)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: TOKENS.text, fontSize: 13, fontWeight: 500 }}>
          {item.name}
        </span>
        <span style={{ marginLeft: 'auto' }}>
          <CategoryBadge label={item.type_name || item.category_name} />
        </span>
      </div>
      {meta.length > 0 && (
        <div
          style={{
            marginTop: 4,
            color: TOKENS.textMuted,
            fontSize: 12,
            fontFamily: TOKENS.ibmPlex,
          }}
        >
          {meta}
        </div>
      )}
    </div>
  );
}

function rowStyle(active: boolean): React.CSSProperties {
  return {
    padding: '10px 16px',
    cursor: 'pointer',
    background: active ? TOKENS.selectedBg : 'transparent',
    borderBottom: `1px solid ${TOKENS.border}`,
  };
}

// ---------------------------------------------------------------------------
// Filter chips
// ---------------------------------------------------------------------------

const CATEGORY_OPTIONS: Array<{ value: number | null; label: string }> = [
  { value: null, label: 'All' },
  { value: 1, label: 'Stars' },
  { value: 2, label: 'Rocky planets' },
  { value: 3, label: 'Gas giants' },
  { value: 4, label: 'Moons' },
  { value: 5, label: 'Nebulae' },
  { value: 6, label: 'Galaxies' },
  { value: 7, label: 'Small bodies' },
  { value: 8, label: 'Large-scale' },
  { value: 9, label: 'Exotic' },
];

function FilterChips({
  filters,
  setFilter,
  clearFilters,
}: {
  filters: { category: number | null; magnitudeMax: number | null; distanceMaxPc: number | null };
  setFilter: <K extends 'category' | 'magnitudeMax' | 'distanceMaxPc'>(
    key: K,
    value: number | null,
  ) => void;
  clearFilters: () => void;
}): JSX.Element {
  const anyActive =
    filters.category !== null ||
    filters.magnitudeMax !== null ||
    filters.distanceMaxPc !== null;
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        padding: '10px 16px',
        borderBottom: `1px solid ${TOKENS.border}`,
      }}
    >
      <label style={chipLabelStyle}>
        Type
        <select
          data-testid="filter-category"
          value={filters.category ?? ''}
          onChange={(e) =>
            setFilter('category', e.target.value === '' ? null : Number(e.target.value))
          }
          style={chipStyle}
        >
          {CATEGORY_OPTIONS.map((o) => (
            <option key={o.label} value={o.value === null ? '' : o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label style={chipLabelStyle}>
        Mag ≤
        <input
          data-testid="filter-mag"
          type="number"
          step="0.5"
          value={filters.magnitudeMax ?? ''}
          placeholder="All"
          onChange={(e) =>
            setFilter('magnitudeMax', e.target.value === '' ? null : Number(e.target.value))
          }
          style={{ ...chipStyle, width: 68 }}
        />
      </label>
      <label style={chipLabelStyle}>
        Dist ≤ (pc)
        <input
          data-testid="filter-dist"
          type="number"
          step="1"
          value={filters.distanceMaxPc ?? ''}
          placeholder="All"
          onChange={(e) =>
            setFilter(
              'distanceMaxPc',
              e.target.value === '' ? null : Number(e.target.value),
            )
          }
          style={{ ...chipStyle, width: 86 }}
        />
      </label>
      {anyActive && (
        <button
          type="button"
          onClick={clearFilters}
          style={{
            ...chipStyle,
            cursor: 'pointer',
            color: TOKENS.dangerText,
            border: `1px solid ${TOKENS.dangerText}55`,
          }}
        >
          Clear
        </button>
      )}
    </div>
  );
}

const chipLabelStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: TOKENS.inter,
  fontSize: 11,
  color: TOKENS.textMuted,
  letterSpacing: 0.3,
};

const chipStyle: React.CSSProperties = {
  height: 26,
  padding: '0 6px',
  background: 'rgba(37,99,235,0.1)',
  border: `1px solid ${TOKENS.border}`,
  borderRadius: 3,
  color: TOKENS.text,
  fontFamily: TOKENS.inter,
  fontSize: 12,
  outline: 'none',
};
