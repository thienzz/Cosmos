import { beforeEach, describe, expect, it } from 'vitest';

import { useSelectionStore } from '../selectionStore.js';
import type { EntityData, EntityPreview } from '../types.js';

const fakeEntity = (id: number): EntityData => ({
  id,
  ent_id: `ENT-${id}`,
  object_type: 'star',
  name: `entity-${id}`,
  payload: {},
});

const fakePreview = (id: number): EntityPreview => ({
  id,
  name: `preview-${id}`,
  object_type: 'star',
});

describe('selectionStore', () => {
  beforeEach(() => {
    useSelectionStore.getState().resetToDefault();
  });

  it('starts with an empty selection and history', () => {
    const state = useSelectionStore.getState();
    expect(state.selectedEntityId).toBeNull();
    expect(state.selectedEntity).toBeNull();
    expect(state.isLoadingEntity).toBe(false);
    expect(state.history).toEqual([]);
    expect(state.historyIndex).toBe(-1);
  });

  it('selectEntity without data puts the store in loading state', () => {
    useSelectionStore.getState().selectEntity(42);
    const state = useSelectionStore.getState();
    expect(state.selectedEntityId).toBe(42);
    expect(state.isLoadingEntity).toBe(true);
    expect(state.history).toEqual([42]);
    expect(state.historyIndex).toBe(0);
  });

  it('selectEntity with data hydrates selectedEntity and stops loading', () => {
    useSelectionStore.getState().selectEntity(7, fakeEntity(7));
    const state = useSelectionStore.getState();
    expect(state.selectedEntity).not.toBeNull();
    expect(state.selectedEntity?.id).toBe(7);
    expect(state.isLoadingEntity).toBe(false);
  });

  it('selectEntity twice on the same id does not duplicate history', () => {
    const { selectEntity } = useSelectionStore.getState();
    selectEntity(1);
    selectEntity(1);
    expect(useSelectionStore.getState().history).toEqual([1]);
  });

  it('goBack / goForward walk the history without falling off either end', () => {
    const { selectEntity, goBack, goForward } = useSelectionStore.getState();
    selectEntity(1);
    selectEntity(2);
    selectEntity(3);
    goBack();
    expect(useSelectionStore.getState().selectedEntityId).toBe(2);
    goBack();
    expect(useSelectionStore.getState().selectedEntityId).toBe(1);
    goBack(); // bounded
    expect(useSelectionStore.getState().selectedEntityId).toBe(1);
    goForward();
    expect(useSelectionStore.getState().selectedEntityId).toBe(2);
    goForward();
    goForward(); // bounded
    expect(useSelectionStore.getState().selectedEntityId).toBe(3);
  });

  it('selecting a new entity after goBack trims forward history', () => {
    const { selectEntity, goBack } = useSelectionStore.getState();
    selectEntity(1);
    selectEntity(2);
    selectEntity(3);
    goBack(); // history cursor at 2
    selectEntity(9);
    const state = useSelectionStore.getState();
    expect(state.history).toEqual([1, 2, 9]);
    expect(state.historyIndex).toBe(2);
  });

  it('setHover stores hover id + preview, or clears when id is null', () => {
    const { setHover } = useSelectionStore.getState();
    setHover(5, fakePreview(5));
    expect(useSelectionStore.getState().hoveredEntityId).toBe(5);
    expect(useSelectionStore.getState().hoveredEntityPreview?.name).toBe('preview-5');
    setHover(null);
    expect(useSelectionStore.getState().hoveredEntityId).toBeNull();
    expect(useSelectionStore.getState().hoveredEntityPreview).toBeNull();
  });

  it('setSelectedEntityData + setLoadingEntity + clearSelection compose correctly', () => {
    const store = useSelectionStore.getState();
    store.setLoadingEntity(true);
    expect(useSelectionStore.getState().isLoadingEntity).toBe(true);
    store.setSelectedEntityData(fakeEntity(11));
    expect(useSelectionStore.getState().selectedEntityId).toBe(11);
    expect(useSelectionStore.getState().isLoadingEntity).toBe(false);
    store.clearSelection();
    const after = useSelectionStore.getState();
    expect(after.selectedEntityId).toBeNull();
    expect(after.selectedEntity).toBeNull();
  });

  // -------------------------------------------------------------------
  // T18 — selectEntityAsync: optimistic + upgrade + staleness + errors
  // -------------------------------------------------------------------

  it('selectEntityAsync seeds optimistic data immediately and upgrades on success', async () => {
    const optimistic = fakeEntity(399);
    const fresh: EntityData = { ...fakeEntity(399), name: 'Earth (authoritative)' };

    const promise = useSelectionStore
      .getState()
      .selectEntityAsync(399, optimistic, { fetcher: async () => fresh });

    // Before the fetcher resolves, the optimistic data is already set.
    expect(useSelectionStore.getState().selectedEntityId).toBe(399);
    expect(useSelectionStore.getState().selectedEntity?.name).toBe('entity-399');
    expect(useSelectionStore.getState().isLoadingEntity).toBe(true);

    await promise;

    const finalState = useSelectionStore.getState();
    expect(finalState.selectedEntity?.name).toBe('Earth (authoritative)');
    expect(finalState.isLoadingEntity).toBe(false);
    expect(finalState.selectionError).toBeNull();
  });

  it('selectEntityAsync drops stale responses when a newer selection supersedes', async () => {
    let resolveFirst: (v: EntityData) => void = () => {};
    const firstPending = new Promise<EntityData>((r) => {
      resolveFirst = r;
    });

    const store = useSelectionStore.getState();
    const first = store.selectEntityAsync(100, fakeEntity(100), {
      fetcher: () => firstPending,
    });

    // While the first is in flight, user picks a different body.
    await store.selectEntityAsync(200, fakeEntity(200), {
      fetcher: async () => ({ ...fakeEntity(200), name: '200-authoritative' }),
    });

    // Now resolve the stale first fetch — it should NOT overwrite 200.
    resolveFirst({ ...fakeEntity(100), name: '100-authoritative' });
    await first;

    const state = useSelectionStore.getState();
    expect(state.selectedEntityId).toBe(200);
    expect(state.selectedEntity?.name).toBe('200-authoritative');
  });

  it('selectEntityAsync surfaces errors without dropping optimistic data', async () => {
    await useSelectionStore
      .getState()
      .selectEntityAsync(7, fakeEntity(7), {
        fetcher: async () => {
          throw new Error('boom');
        },
      });
    const s = useSelectionStore.getState();
    expect(s.selectedEntity?.id).toBe(7);
    expect(s.isLoadingEntity).toBe(false);
    expect(s.selectionError).toContain('boom');
  });
});
