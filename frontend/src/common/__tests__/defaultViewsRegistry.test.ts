/**
 * registerSystemViews — the scan that fills Defaults.defaultViewPointsMap / defaultViewsMap (P-2026-10-21-1950, F2).
 *
 * The reducer runs it while the seeded viewpoint is not yet an object in the map. On an in-page open the seed is
 * skipped, the guard stays open and the scan saw the loaded project: its user viewpoints and views entered the
 * built-in maps and `Defaults.check` made them read-only for the rest of the page session
 * (discovery_2026-10-21_gv_f2_readonly_views_f3_palette_click.md §3.1). Only `Pointer_View*` ids are built-in.
 */
import { describe, it, expect } from 'vitest';
import { registerSystemViews } from '../defaultViewsRegistry';

const SEEDED_VP = 'Pointer_ViewPointDefault';
const USER_VP = 'Pointer1792603814204_USER_17';
const USER_VIEW = 'Pointer1792603814204_USER_18';

const vp = (id: string) => ({ id, className: 'DViewPoint' });
const view = (id: string) => ({ id, className: 'DViewElement' });

function scan(idlookup: Record<string, unknown>) {
    const vpMap: Record<string, any> = { [SEEDED_VP]: true };
    const viewMap: Record<string, any> = {};
    registerSystemViews(idlookup, vpMap, viewMap);
    return { vpMap, viewMap };
}

describe('registerSystemViews', () => {
    it('does not register a user viewpoint or view when the seeded viewpoint is present (s5-card)', () => {
        const { vpMap, viewMap } = scan({ [SEEDED_VP]: vp(SEEDED_VP), [USER_VP]: vp(USER_VP), [USER_VIEW]: view(USER_VIEW) });
        expect(vpMap[USER_VP]).toBeUndefined();
        expect(viewMap[USER_VIEW]).toBeUndefined();
        expect(Object.keys(vpMap)).toEqual([SEEDED_VP]);
    });

    it('does not register a user viewpoint or view when the seeded viewpoint is absent (s5-url)', () => {
        const { vpMap, viewMap } = scan({ [USER_VP]: vp(USER_VP), [USER_VIEW]: view(USER_VIEW) });
        expect(vpMap[USER_VP]).toBeUndefined();
        expect(viewMap[USER_VIEW]).toBeUndefined();
        expect(vpMap[SEEDED_VP]).toBe(true);
    });

    it('registers the seeded viewpoint and a Pointer_View* view as their records', () => {
        const seeded = vp(SEEDED_VP);
        const sys = view('Pointer_ViewEdgeAssociation');
        const { vpMap, viewMap } = scan({ [SEEDED_VP]: seeded, Pointer_ViewEdgeAssociation: sys });
        expect(vpMap[SEEDED_VP]).toBe(seeded);
        expect(viewMap.Pointer_ViewEdgeAssociation).toBe(sys);
    });

    it('does not register a Pointer_View* id whose record is not a view or a viewpoint', () => {
        const { vpMap, viewMap } = scan({ Pointer_ViewNotAView: { id: 'Pointer_ViewNotAView', className: 'DGraph' } });
        expect(vpMap.Pointer_ViewNotAView).toBeUndefined();
        expect(viewMap.Pointer_ViewNotAView).toBeUndefined();
    });

    it('skips a clonedCounter number and a null record without throwing', () => {
        const { vpMap, viewMap } = scan({ clonedCounter: 7, Pointer_ViewNull: null, Pointer_ViewNum: 3 });
        expect(Object.keys(vpMap)).toEqual([SEEDED_VP]);
        expect(Object.keys(viewMap)).toEqual([]);
    });
});
