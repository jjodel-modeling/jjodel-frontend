/**
 * Tests of `endpointsModel` — #186, the fold of the metaclasses that cannot be offered
 * (P-2026-10-14-1101, report docs/discovery/discovery_2026-10-14_186_endpoints.md §4.6).
 *
 * The rule under test: a class with a reason (it cannot be created on its own) and not marked
 * is folded away; a marked one stays visible so it can be removed; the rest is shown. Each
 * test names the mutation of the report's bench that kills it.
 */
import { describe, expect, it } from 'vitest';
import { foldToggleLabel, splitSelectable } from '../endpointsModel';

type Row = { id: string; label: string; reason: string | null };
const row = (id: string, reason: string | null = null): Row => ({ id, label: id, reason });
const ids = (rows: Row[]) => rows.map((r) => r.id);

describe('splitSelectable', () => {
    it('T1 shows a class without a reason (M2: inverted reason test)', () => {
        const r = splitSelectable([row('Scenario')], []);
        expect(ids(r.shown)).toEqual(['Scenario']);
        expect(ids(r.folded)).toEqual([]);
    });

    it('T2 folds a class with a reason that is not marked (M2, M4: shown = items)', () => {
        const r = splitSelectable([row('Topic', 'abstract')], []);
        expect(ids(r.shown)).toEqual([]);
        expect(ids(r.folded)).toEqual(['Topic']);
    });

    it('T3 keeps a marked class with a reason visible, so it can be removed (M1: marked clause dropped)', () => {
        const r = splitSelectable([row('Note', 'created inside Scenario')], ['Note']);
        expect(ids(r.shown)).toEqual(['Note']);
        expect(ids(r.folded)).toEqual([]);
    });

    it('T4 keeps the input order in both lists, interleaved (M3: sorted or reversed output)', () => {
        const items = [row('Zeta'), row('Beta', 'abstract'), row('Alpha'), row('Omega', 'singleton'), row('Gamma', 'abstract'), row('Delta')];
        const r = splitSelectable(items, ['Gamma']);
        expect(ids(r.shown)).toEqual(['Zeta', 'Alpha', 'Gamma', 'Delta']);
        expect(ids(r.folded)).toEqual(['Beta', 'Omega']);
    });

    it('T5 puts every item in exactly one list (M4: shown = items; M5: marked rows also folded)', () => {
        const items = [row('A'), row('B', 'abstract'), row('C', 'abstract'), row('D')];
        const r = splitSelectable(items, ['C']);
        expect(r.shown.length + r.folded.length).toBe(items.length);
        const seen = [...ids(r.shown), ...ids(r.folded)].sort();
        expect(seen).toEqual(['A', 'B', 'C', 'D']);
    });

    it('T6 builds rows from the items only: empty input and a marked id with no item add nothing (M6: rows built from marked)', () => {
        expect(splitSelectable([], ['X'])).toEqual({ shown: [], folded: [] });
        const r = splitSelectable([row('A')], ['A', 'Ghost']);
        expect(ids(r.shown)).toEqual(['A']);
        expect(ids(r.folded)).toEqual([]);
    });

    it('returns the item objects themselves, not copies', () => {
        const a = row('A');
        const b = row('B', 'abstract');
        const r = splitSelectable([a, b], []);
        expect(r.shown[0]).toBe(a);
        expect(r.folded[0]).toBe(b);
    });
});

describe('foldToggleLabel', () => {
    it('T7 says how many are folded while closed, and hides them while open (M7: hard-coded count)', () => {
        expect(foldToggleLabel(3, false)).toBe('Show 3 not selectable');
        expect(foldToggleLabel(1, false)).toBe('Show 1 not selectable');
        expect(foldToggleLabel(3, true)).toBe('Hide not selectable');
    });
});
