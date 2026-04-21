import { describe, expect, it } from 'vitest';

import { getTourById, TOUR_CATALOG, TOUR_J1, TOUR_J2, toursForMode } from '../tourCatalog';

describe('tourCatalog', () => {
  it('ships J1 (First Contact) and J2 (Solar System Tour)', () => {
    expect(TOUR_CATALOG['J1']).toBe(TOUR_J1);
    expect(TOUR_CATALOG['J2']).toBe(TOUR_J2);
  });

  it('J1 (First Contact) is a casual 5-waypoint tour from Exploration mode', () => {
    expect(TOUR_J1.id).toBe('J1');
    expect(TOUR_J1.availableFromModes).toContain('exploration');
    expect(TOUR_J1.availableFromModes).not.toContain('research');
    // TS-E2E-001 expects a cohesive First Contact journey; 5 steps covers
    // Earth → Sun → Mars → Jupiter → Saturn without overshooting the 60-s
    // total-travel budget at default fly-to timing.
    expect(TOUR_J1.waypoints).toHaveLength(5);
    const naifIds = TOUR_J1.waypoints.map((w) => w.naifId);
    expect(naifIds).toEqual([399, 10, 499, 599, 699]);
  });

  it('J2 (Solar System Tour) is a 5-step Education-only tour', () => {
    expect(TOUR_J2.id).toBe('J2');
    expect(TOUR_J2.availableFromModes).toEqual(['education']);
    // TS-MODE-003 + TS-E2E-002 both explicitly expect 5 advanceable steps
    // for the "Solar System Tour" example — this locks in that contract.
    expect(TOUR_J2.waypoints).toHaveLength(5);
    const naifIds = TOUR_J2.waypoints.map((w) => w.naifId);
    expect(naifIds).toEqual([10, 199, 299, 399, 499]);
  });

  it('every waypoint has non-empty title + narration', () => {
    for (const tour of Object.values(TOUR_CATALOG)) {
      for (const w of tour.waypoints) {
        expect(w.title.length).toBeGreaterThan(0);
        expect(w.narration.length).toBeGreaterThan(0);
      }
    }
  });

  it('getTourById returns the tour or null', () => {
    expect(getTourById('J1')).toBe(TOUR_J1);
    expect(getTourById('J2')).toBe(TOUR_J2);
    expect(getTourById('nonexistent')).toBeNull();
    expect(getTourById(null)).toBeNull();
  });

  it('toursForMode filters by availability (Doc 27 §10 gate)', () => {
    expect(toursForMode('exploration').map((t) => t.id)).toContain('J1');
    expect(toursForMode('exploration').map((t) => t.id)).not.toContain('J2');

    expect(toursForMode('education').map((t) => t.id)).toContain('J2');

    // Doc 27 §10: observation / research / guided_tour cannot *launch* tours.
    expect(toursForMode('observation')).toEqual([]);
    expect(toursForMode('research')).toEqual([]);
    expect(toursForMode('guided_tour')).toEqual([]);
  });

  it('durationSec overrides exist only on the legs that need them', () => {
    // J1 long-haul legs (Sun + gas giants) get explicit duration. Others
    // default. Lock the count so a future edit of the catalog doesn't
    // accidentally slow every waypoint to 5 s.
    const j1WithDuration = TOUR_J1.waypoints.filter((w) => w.durationSec !== undefined).length;
    expect(j1WithDuration).toBe(3);
    // J2 only lengthens the Sun step — short rocky-planet hops keep the
    // default 3-s flight for classroom pacing.
    const j2WithDuration = TOUR_J2.waypoints.filter((w) => w.durationSec !== undefined).length;
    expect(j2WithDuration).toBe(1);
  });
});
