/**
 * observe — the canonical projection of the oracle (slice S6, P-2026-10-10-2029; R-GEN-11, discovery §G.2).
 *
 * `observeSim` on hand-built `SimState`s: the marking sorted by place id with its zero entries dropped, the semantic
 * attributes and the derived semantic values sorted, presentation absent. Each test name says which break kills
 * it; the bench is in the commit body.
 */

import { describe, it, expect } from 'vitest';
import type { SimState, SimValue } from '../../../model/simulation/netTypes';
import { observeSim } from '../observe';

const maps = (r: Record<string, Record<string, SimValue>>) => new Map(Object.entries(r).map(([k, v]) => [k, new Map(Object.entries(v))]));

function sigma(over: Partial<{ marking: Record<string, number>; attrs: Record<string, Record<string, SimValue>>; presentation: Record<string, Record<string, SimValue>>; derived: Record<string, Record<string, SimValue>> | null; derivedPresentation: Record<string, Record<string, SimValue>> }> = {}): SimState {
    const derived = over.derived === null ? undefined : over.derived;
    return {
        marking: new Map(Object.entries(over.marking ?? { q: 2, p: 1, z: 0 })),
        attrs: maps(over.attrs ?? { M: { coins: 1, armed: true }, a: { mode: 'RED' } }),
        presentation: maps(over.presentation ?? { a: { color: 'red' } }),
        ...(derived !== undefined ? { derived: { attrs: maps(derived), presentation: maps(over.derivedPresentation ?? { a: { shade: 'dark' } }) } } : {}),
    };
}

describe('observeSim', () => {
    it('sorts the marking by place id (mutant: the marking in insertion order)', () => {
        const o = observeSim(sigma({ marking: { q: 2, p: 1, b: 3 } }));
        expect(Object.keys(o.marking)).toEqual(['b', 'p', 'q']);
    });

    it('drops the places with zero tokens (mutant: projection keeps zero-token places)', () => {
        const o = observeSim(sigma({ marking: { q: 2, z: 0, p: 1 } }));
        expect(o.marking).toEqual({ p: 1, q: 2 });
        expect('z' in o.marking).toBe(false);
    });

    it('keeps the semantic attributes, elements and names sorted (mutant: attributes left out)', () => {
        const o = observeSim(sigma({ attrs: { M: { coins: 1, armed: true }, a: { mode: 'RED' } } }));
        expect(o.attrs).toEqual({ M: { armed: true, coins: 1 }, a: { mode: 'RED' } });
        expect(Object.keys(o.attrs)).toEqual(['M', 'a']);
        expect(Object.keys(o.attrs.M)).toEqual(['armed', 'coins']);
    });

    it('holds no presentation, stored or derived (mutant: projection keeps presentation)', () => {
        const o = observeSim(sigma({ derived: { M: { paid: false } } }));
        expect(Object.keys(o).sort()).toEqual(['attrs', 'derived', 'marking']);
        expect(JSON.stringify(o)).not.toContain('color');
        expect(JSON.stringify(o)).not.toContain('shade');
    });

    it('keeps the derived semantic values, and is empty without them (mutant: derived values dropped)', () => {
        expect(observeSim(sigma({ derived: { M: { paid: true } } })).derived).toEqual({ M: { paid: true } });
        expect(observeSim(sigma({ derived: null })).derived).toEqual({});
    });

    it('is plain data: equal states give equal JSON whatever the insertion order', () => {
        const a = observeSim(sigma({ marking: { p: 1, q: 2 }, attrs: { a: { y: 1, x: 2 }, M: { c: 0 } } }));
        const b = observeSim(sigma({ marking: { q: 2, p: 1 }, attrs: { M: { c: 0 }, a: { x: 2, y: 1 } } }));
        expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    });
});
