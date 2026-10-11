/**
 * JjScript M1 reference writes — the plan a `set` applies to a reference slot (#168 C1).
 *
 * Plan-level tests on purpose, as for `permissionGuard.test.ts`: `commands/instance.ts`, which
 * reads the slot, drains the queued writes and applies the plan, cannot be imported under
 * `environment: 'node'` (it reaches monaco through `joiner`).
 *
 * One property is NOT covered here: two `set`s on one slot inside the 300 ms commit window both
 * survive. That belongs to the drain in `instance.ts` (`settlePendingWrites`), not to the plan, and
 * the browser probe of P-2026-10-02-1255 is what fails when the drain is removed. The chained test
 * below only shows that a plan built on the previous write keeps both.
 */

import { describe, it, expect } from 'vitest';
import { isManyValued, linkedIds, planLink, planUnlink, planAdd, planRemove } from '../referenceWrite';

describe('isManyValued — same cardinality rule as eval.ts', () => {
    it('upper bound 1 is single (dies if 1 counts as many)', () => {
        expect(isManyValued(1)).toBe(false);
    });
    it('-1 and "*" are many (dies if the unbounded forms are dropped)', () => {
        expect(isManyValued(-1)).toBe(true);
        expect(isManyValued('*')).toBe(true);
    });
    it('a bound above 1 is many (dies if only -1 counts)', () => {
        expect(isManyValued(2)).toBe(true);
        expect(isManyValued(5)).toBe(true);
    });
    it('0 and a missing bound read as single, as eval.ts reads them', () => {
        expect(isManyValued(0)).toBe(false);
        expect(isManyValued(undefined)).toBe(false);
    });
});

describe('linkedIds', () => {
    it('drops null, undefined and empty-string holes (dies if a hole survives)', () => {
        expect(linkedIds([null, 'p1', undefined, '', 'p2'])).toEqual(['p1', 'p2']);
    });
    it('keeps order and duplicates (dies if it sorts or dedupes)', () => {
        expect(linkedIds(['p2', 'p1', 'p2'])).toEqual(['p2', 'p1', 'p2']);
    });
    it('reads a missing slot as empty (dies if it throws on a non-array)', () => {
        expect(linkedIds(undefined)).toEqual([]);
        expect(linkedIds(null)).toEqual([]);
    });
});

describe('planLink — single-valued reference replaces', () => {
    it('empty slot: writes the target, removes nothing', () => {
        expect(planLink([], 'p1', false)).toEqual({ remove: [], write: ['p1'] });
    });
    it('one value held: the old one leaves, the target is written (dies on the G4 append)', () => {
        expect(planLink(['p1'], 'p2', false)).toEqual({ remove: ['p1'], write: ['p2'] });
    });
    it('slot overfilled by older appends: every old value leaves (dies if only index 0 is replaced)', () => {
        expect(planLink(['p1', 'p2'], 'p3', false)).toEqual({ remove: ['p1', 'p2'], write: ['p3'] });
    });
    it('target already held among others: only the others leave, nothing is written (dies if the target is written again)', () => {
        expect(planLink(['p1', 'p3'], 'p3', false)).toEqual({ remove: ['p1'] });
    });
    it('the slot already holds exactly the target: nothing to do', () => {
        expect(planLink(['p3'], 'p3', false)).toEqual({ remove: [] });
    });
    it('each old id is removed once (dies without the distinct)', () => {
        expect(planLink(['p1', 'p1', 'p2'], 'p3', false)).toEqual({ remove: ['p1', 'p2'], write: ['p3'] });
    });
});

describe('planLink — multi-valued reference appends', () => {
    it('appends after what the slot holds, in order (dies if it prepends or replaces)', () => {
        expect(planLink(['p1'], 'p2', true)).toEqual({ remove: [], write: ['p1', 'p2'] });
    });
    it('keeps duplicates as today (dies if it dedupes)', () => {
        expect(planLink(['p1'], 'p1', true)).toEqual({ remove: [], write: ['p1', 'p1'] });
    });
    it('removes nothing (dies if the multi branch takes the single rule)', () => {
        expect(planLink(['p1', 'p2'], 'p3', true).remove).toEqual([]);
    });
    it('a plan built on the previous write keeps both targets', () => {
        const first = planLink([], 'p1', true);
        const second = planLink(first.write!, 'p2', true);
        expect(second.write).toEqual(['p1', 'p2']);
    });
});

describe('planUnlink — `= null` empties the slot', () => {
    it('every held id leaves, each once (dies if unlink removes nothing or repeats an id)', () => {
        expect(planUnlink(['p1', 'p2', 'p1'])).toEqual({ remove: ['p1', 'p2'] });
    });
    it('writes nothing back (dies if it falls back to writing an empty array)', () => {
        expect(planUnlink(['p1']).write).toBeUndefined();
    });
    it('an empty slot gives an empty plan', () => {
        expect(planUnlink([])).toEqual({ remove: [] });
    });
});

describe('planAdd — `+=` appends while the slot has room (#175)', () => {
    it('an unbounded slot appends, duplicates kept as `=` keeps them', () => {
        expect(planAdd(['p1'], 'p2', -1)).toEqual({ write: ['p1', 'p2'] });
        expect(planAdd(['p1'], 'p1', '*')).toEqual({ write: ['p1', 'p1'] });
    });
    it('an empty single-valued slot takes the target', () => {
        expect(planAdd([], 'p1', 1)).toEqual({ write: ['p1'] });
    });
    it('a single-valued slot holding another is full (dies on the replace of planLink)', () => {
        expect(planAdd(['p2'], 'p1', 1)).toEqual({ full: 1 });
    });
    it('a single-valued slot already holding the target is left as it is (dies if it is reported full)', () => {
        expect(planAdd(['p1'], 'p1', 1)).toEqual({ held: true });
    });
    it('a bounded multi-valued slot appends below its bound and is full at it (dies if the bound is ignored)', () => {
        expect(planAdd(['p1', 'p2'], 'p3', 3)).toEqual({ write: ['p1', 'p2', 'p3'] });
        expect(planAdd(['p1', 'p2', 'p3'], 'p4', 3)).toEqual({ full: 3 });
    });
    it('a missing or 0 bound reads as single, as isManyValued reads it', () => {
        expect(planAdd(['p2'], 'p1', undefined)).toEqual({ full: 1 });
        expect(planAdd(['p2'], 'p1', 0)).toEqual({ full: 1 });
    });
});

describe('planRemove — `-=` takes the target out by value (#175)', () => {
    it('a held target is removed (dies on the old append)', () => {
        expect(planRemove(['p1', 'p2'], 'p1')).toEqual({ remove: ['p1'] });
    });
    it('listed once even when the slot holds it twice: the by-value removal takes every copy', () => {
        expect(planRemove(['p1', 'p2', 'p1'], 'p1')).toEqual({ remove: ['p1'] });
    });
    it('a target the slot does not hold is absent (dies if absence is not reported)', () => {
        expect(planRemove(['p2'], 'p1')).toEqual({ absent: true });
        expect(planRemove([], 'p1')).toEqual({ absent: true });
    });
});
