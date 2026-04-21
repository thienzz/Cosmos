import type { EntityToggleFeature } from '@cosmos/shared-types';
import { getEntityToggleSpec } from '@cosmos/shared-types';
import { useMemo, useState } from 'react';

import { useEntityToggleStore } from '@/stores/entityToggleStore';

/**
 * T52 — Doc 22 entity-toggle panel.
 *
 * Rendered into the reserved slot inside `InfoPanel` (Doc 24 S-3.1 Full
 * layout). For the selected entity's ENT-ID, looks up the auto-generated
 * spec in `@cosmos/shared-types/entityToggles` and renders a collapsible
 * section per Doc 22 grouping, with one checkbox row per feature.
 *
 * Toggle writes are synchronous into `entityToggleStore`; the render-loop
 * (PlanetMaterial.update, etc.) reads via `getState()` on the next frame —
 * no subscription wiring needed on the GPU side (Doc 27 §6.4).
 *
 * Unknown ENT-IDs (not in Doc 22) render nothing, so the parent can drop
 * this component in unconditionally without guarding.
 */

export interface EntityToggleSectionProps {
  entId: string | null | undefined;
  /** Theme accent from the parent InfoPanel — used for the active border. */
  accent?: string;
}

const AETHER = {
  border: '#2a2a3a',
  textPrimary: '#e8e8f0',
  textSecondary: '#a0a0b8',
  textTertiary: '#6a6a80',
  textLabel: '#fbbf24',
  accentCyan: '#00e5ff',
  accentGreen: '#4ade80',
  pressStart2p: '"Press Start 2P", "Space Mono", monospace',
  spaceMono: '"Space Mono", "Courier New", monospace',
  ibmPlex: '"IBM Plex Mono", "Space Mono", monospace',
} as const;

interface GroupedSection {
  section: string;
  features: EntityToggleFeature[];
}

/** Doc 22 lists features in section order — preserve that order but group. */
function groupBySection(features: readonly EntityToggleFeature[]): GroupedSection[] {
  const order: string[] = [];
  const bySection = new Map<string, EntityToggleFeature[]>();
  for (const feat of features) {
    if (!bySection.has(feat.section)) {
      order.push(feat.section);
      bySection.set(feat.section, []);
    }
    bySection.get(feat.section)!.push(feat);
  }
  return order.map((section) => ({
    section,
    features: bySection.get(section)!,
  }));
}

export function EntityToggleSection({
  entId,
  accent = AETHER.accentCyan,
}: EntityToggleSectionProps): JSX.Element | null {
  const spec = entId ? getEntityToggleSpec(entId) : null;
  const grouped = useMemo(
    () => (spec ? groupBySection(spec.features) : []),
    [spec],
  );
  const toggles = useEntityToggleStore((s) =>
    entId ? s.toggles[entId] : undefined,
  );
  const setToggleOn = useEntityToggleStore((s) => s.setToggleOn);
  const resetEntityToggles = useEntityToggleStore((s) => s.resetEntityToggles);

  // Collapsed sections for the current entity. Reset on entity change so a
  // user's "collapse Aurorae" on Jupiter doesn't bleed into Saturn.
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const lastEntIdRef = useLastRef(entId);
  if (entId && lastEntIdRef.current !== entId) {
    lastEntIdRef.current = entId;
    if (collapsed.size > 0) setCollapsed(new Set());
  }

  if (!spec || !entId || spec.features.length === 0) return null;

  const getValue = (feat: EntityToggleFeature): number => {
    if (toggles && feat.uniform in toggles) return toggles[feat.uniform] ?? 0;
    return feat.defaultOn ? 1.0 : 0.0;
  };

  const toggleSection = (section: string): void => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  return (
    <section
      data-testid="entity-toggles"
      data-ent-id={entId}
      aria-label={`${spec.displayName} toggles`}
      style={{
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        borderTop: `1px solid ${AETHER.border}`,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          margin: '2px 0 6px',
        }}
      >
        <h3
          style={{
            fontFamily: AETHER.pressStart2p,
            fontSize: 9,
            fontWeight: 400,
            letterSpacing: '1.5px',
            color: AETHER.textLabel,
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          Features
        </h3>
        <button
          type="button"
          aria-label="Reset toggles to defaults"
          onClick={() => resetEntityToggles(entId)}
          style={{
            fontFamily: AETHER.spaceMono,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            padding: '2px 6px',
            background: 'transparent',
            border: `1px solid ${AETHER.border}`,
            color: AETHER.textTertiary,
            cursor: 'pointer',
            borderRadius: 2,
          }}
        >
          Reset
        </button>
      </header>
      {grouped.map(({ section, features }) => {
        const isCollapsed = collapsed.has(section);
        const onCount = features.filter((f) => getValue(f) > 0.5).length;
        return (
          <div
            key={section}
            data-testid={`entity-toggle-group:${section}`}
            style={{
              border: `1px solid ${AETHER.border}`,
              borderRadius: 2,
              padding: '4px 6px',
            }}
          >
            <button
              type="button"
              onClick={() => toggleSection(section)}
              aria-expanded={!isCollapsed}
              aria-controls={`toggle-group-${section}`}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'transparent',
                border: 'none',
                padding: '2px 0',
                cursor: 'pointer',
                color: AETHER.textSecondary,
              }}
            >
              <span
                style={{
                  fontFamily: AETHER.ibmPlex,
                  fontSize: 10,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: accent,
                  textShadow: `0 0 4px ${accent}50`,
                }}
              >
                {isCollapsed ? '▸' : '▾'} {section}
              </span>
              <span
                style={{
                  fontFamily: AETHER.ibmPlex,
                  fontSize: 9,
                  color: AETHER.textTertiary,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {onCount}/{features.length}
              </span>
            </button>
            {!isCollapsed && (
              <ul
                id={`toggle-group-${section}`}
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: '4px 0 2px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                {features.map((feat) => {
                  const on = getValue(feat) > 0.5;
                  return (
                    <li
                      key={feat.uniform}
                      data-testid={`entity-toggle:${feat.uniform}`}
                      data-on={on ? 'true' : 'false'}
                    >
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 6,
                          cursor: 'pointer',
                          padding: '2px 0',
                        }}
                        title={feat.description}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          aria-label={feat.name}
                          onChange={(e) =>
                            setToggleOn(entId, feat.uniform, e.currentTarget.checked)
                          }
                          style={{
                            marginTop: 2,
                            accentColor: AETHER.accentGreen,
                          }}
                        />
                        <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <span
                            style={{
                              fontFamily: AETHER.spaceMono,
                              fontSize: 11,
                              color: AETHER.textPrimary,
                              letterSpacing: 0.3,
                            }}
                          >
                            {feat.name}
                            {feat.defaultLabel !== 'ON' && feat.defaultLabel !== 'OFF' && (
                              <span
                                style={{
                                  fontFamily: AETHER.ibmPlex,
                                  fontSize: 9,
                                  color: AETHER.textTertiary,
                                  marginLeft: 6,
                                }}
                              >
                                [{feat.defaultLabel}]
                              </span>
                            )}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </section>
  );
}

/** Tiny non-subscribing mutable ref without importing useRef — keeps the
 *  render pure but lets us detect an entity change without an effect. */
function useLastRef<T>(value: T): { current: T } {
  const [state] = useState<{ current: T }>(() => ({ current: value }));
  return state;
}
