/**
 * dcnRoles — the resolved DCN roles of a bag (P-2026-11-07-0941, R-DCN-8,
 * R-SIM-47): the closure of the dcn shape or `null`, the optional roles only
 * with what they depend on. The bag is the DCN metamodel of
 * frontend/scripts/probe/dcn-drone-fixture.ts, one id per feature; Operation
 * and Body hold a list (R-SIM-90), both operation references and both bodies.
 */

import { describe, it, expect } from 'vitest';
import { encodeRoleValues } from '../../roleCatalog';
import { dcnStcFromRoles } from '../dcnRoles';

const DRONE_BAG = {
    simStaticClass: 'StaticClass',
    simViewpoints: 'StaticClass.viewpoints',
    simDynamicClasses: 'Viewpoint.classes',
    simInvariant: 'DynamicClass.invariant',
    simOperation: encodeRoleValues(['Class.ownedOperations', 'DynamicClass.operations']),
    simPrecondition: 'Operation.pre',
    simBody: encodeRoleValues(['Operation.body', 'Monitor.body']),
    simRedefines: 'Operation.redefines',
    simMonitor: 'DynamicClass.monitors',
    simOverlapping: 'Viewpoint.isOverlapping',
    simComplete: 'Viewpoint.isComplete',
};

const CLOSURE_KEYS = ['simStaticClass', 'simViewpoints', 'simDynamicClasses', 'simInvariant'] as const;

function without(bag: Record<string, unknown>, ...keys: string[]): Record<string, unknown> {
    const out = { ...bag };
    for (const k of keys) delete out[k];
    return out;
}

/** Every subset of the closure keys, the full one aside. */
function properSubsets(): string[][] {
    const out: string[][] = [];
    for (let mask = 0; mask < (1 << CLOSURE_KEYS.length) - 1; mask++) {
        out.push(CLOSURE_KEYS.filter((_, i) => mask & (1 << i)));
    }
    return out;
}

describe('dcnStcFromRoles', () => {
    it('reads every role of the drone metamodel', () => {
        expect(dcnStcFromRoles(DRONE_BAG)).toEqual({
            staticClass: 'StaticClass',
            viewpoints: 'StaticClass.viewpoints',
            dynamicClasses: 'Viewpoint.classes',
            invariant: 'DynamicClass.invariant',
            operation: ['Class.ownedOperations', 'DynamicClass.operations'],
            precondition: 'Operation.pre',
            body: ['Operation.body', 'Monitor.body'],
            redefines: 'Operation.redefines',
            monitor: 'DynamicClass.monitors',
            overlapping: 'Viewpoint.isOverlapping',
            complete: 'Viewpoint.isComplete',
        });
    });

    it('is null for every incomplete closure, the optional roles all set (mutant: one closure role not checked)', () => {
        const optional = without(DRONE_BAG, ...CLOSURE_KEYS);
        const subsets = properSubsets();
        expect(subsets).toHaveLength(15);
        for (const keys of subsets) {
            const bag: Record<string, unknown> = { ...optional };
            for (const k of keys) bag[k] = (DRONE_BAG as Record<string, string>)[k];
            expect(dcnStcFromRoles(bag), keys.join(',') || 'none').toBeNull();
        }
    });

    it('is null without a bag, and counts a role only as a non-empty string (mutant: a truthy test)', () => {
        expect(dcnStcFromRoles(undefined)).toBeNull();
        expect(dcnStcFromRoles({})).toBeNull();
        for (const bad of ['', 3, null, true, ['Viewpoint.classes']]) {
            expect(dcnStcFromRoles({ ...DRONE_BAG, simDynamicClasses: bad }), String(bad)).toBeNull();
        }
    });

    it('needs only the closure: the optional roles are absent when unset', () => {
        const closure = Object.fromEntries(CLOSURE_KEYS.map(k => [k, DRONE_BAG[k]]));
        expect(dcnStcFromRoles(closure)).toEqual({
            staticClass: 'StaticClass',
            viewpoints: 'StaticClass.viewpoints',
            dynamicClasses: 'Viewpoint.classes',
            invariant: 'DynamicClass.invariant',
        });
    });

    it('drops an optional role whose dependency is unset, transitively (mutant: the dependency not checked)', () => {
        const stc = dcnStcFromRoles(without(DRONE_BAG, 'simOperation'));
        expect(stc).not.toBeNull();
        expect(stc?.precondition).toBeUndefined();
        expect(stc?.body).toBeUndefined();
        expect(stc?.redefines).toBeUndefined();
        // control: the roles that hang on the closure stay
        expect(stc?.monitor).toBe('DynamicClass.monitors');
        expect(stc?.overlapping).toBe('Viewpoint.isOverlapping');
        expect(stc?.complete).toBe('Viewpoint.isComplete');
    });

    it('reads Operation and Body as lists, a plain id as one element (mutants: multi dropped, the first kept only)', () => {
        const one = dcnStcFromRoles({ ...DRONE_BAG, simOperation: 'DynamicClass.operations', simBody: 'Operation.body' });
        expect(one?.operation).toEqual(['DynamicClass.operations']);
        expect(one?.body).toEqual(['Operation.body']);
        // an empty list is unset, so its dependents drop
        const none = dcnStcFromRoles({ ...DRONE_BAG, simOperation: '[]' });
        expect(none?.operation).toBeUndefined();
        expect(none?.precondition).toBeUndefined();
        // control: the single-valued roles stay strings
        expect(one?.redefines).toBe('Operation.redefines');
    });

    it('ignores the keys of the other groups and does not mutate the bag', () => {
        const bag = { ...DRONE_BAG, simNode: 'c_node', simArc: 'c_arc', simTrigger: 'f_t' };
        const before = JSON.stringify(bag);
        const stc = dcnStcFromRoles(bag);
        expect(Object.keys(stc ?? {}).sort()).toEqual([
            'body', 'complete', 'dynamicClasses', 'invariant', 'monitor', 'operation', 'overlapping', 'precondition',
            'redefines', 'staticClass', 'viewpoints',
        ]);
        expect(JSON.stringify(bag)).toBe(before);
    });
});
