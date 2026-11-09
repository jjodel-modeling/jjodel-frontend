/**
 * dcnRoles — the resolved DCN roles of a bag (P-2026-11-07-0941, R-DCN-8,
 * R-SIM-47): the closure of the dcn shape or `null`, the optional roles only
 * with what they depend on. The bag is the DCN metamodel of
 * frontend/scripts/probe/dcn-drone-fixture.ts, one id per feature; Operation
 * and Body hold a list (R-SIM-90), both operation references and both bodies.
 */

import { describe, it, expect } from 'vitest';
import { encodeRoleValues } from '../../roleCatalog';
import { dcnCoherenceFromRoles, dcnStcFromRoles } from '../dcnRoles';
import type { DcnStc } from '../dcnRoles';
import type { DcnReadView } from '../dcnCompile';

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

// ---------------------------------------------------------------------------
// The coherence constraints (P-2026-11-09-0124, R-DCN-28, spec §3)
// ---------------------------------------------------------------------------

const COHERENCE_KEYS = {
    simCoherence: 'CoherenceConstraint',
    simCoherenceContext: 'CoherenceConstraint.context',
    simCoherencePointwise: 'CoherenceConstraint.pointwise',
    simCoherencePattern: 'CoherenceConstraint.pattern',
    simPersistenceCondition: 'BoundedPersistence.condition',
    simPersistenceBound: 'BoundedPersistence.k',
    simResponseTrigger: 'BoundedResponse.trigger',
    simResponseResponse: 'BoundedResponse.response',
    simResponseBound: 'BoundedResponse.k',
};

const COHERENCE_BAG = { ...DRONE_BAG, ...COHERENCE_KEYS };

interface Obj {
    meta: string;
    name?: string;
    refs?: Record<string, string[]>;
    attrs?: Record<string, unknown>;
}
type Model = Record<string, Obj>;

const CONTEXT = 'CoherenceConstraint.context';
const POINTWISE = 'CoherenceConstraint.pointwise';
const PATTERN = 'CoherenceConstraint.pattern';

/** One φ-only constraint, one persistence, one response, among objects of other metaclasses. */
function coherenceModel(): Model {
    return {
        Drone: { meta: 'StaticClass', name: 'Drone' },
        phi: { meta: 'CoherenceConstraint', name: 'chargeNonNegative', refs: { [CONTEXT]: ['Drone'] }, attrs: { [POINTWISE]: 'self.battery >= 0' } },
        persists: { meta: 'CoherenceConstraint', name: 'notTooFast', refs: { [CONTEXT]: ['Drone'], [PATTERN]: ['p1'] } },
        responds: { meta: 'CoherenceConstraint', name: 'landsWhenLow', refs: { [CONTEXT]: ['Drone'], [PATTERN]: ['p2'] }, attrs: { [POINTWISE]: 'self.power > 0' } },
        p1: { meta: 'BoundedPersistence', attrs: { 'BoundedPersistence.condition': 'self.speed > 10', 'BoundedPersistence.k': 3 } },
        p2: { meta: 'BoundedResponse', attrs: { 'BoundedResponse.trigger': 'self.battery < 5', 'BoundedResponse.response': 'self.altitude = 0', 'BoundedResponse.k': '2' } },
    };
}

/** `SpecialConstraint` extends `CoherenceConstraint`, `SlowPersistence` extends `BoundedPersistence`. */
const SUPERS: Record<string, string> = { SpecialConstraint: 'CoherenceConstraint', SlowPersistence: 'BoundedPersistence' };

function viewOf(m: Model): DcnReadView {
    return {
        objects: () => Object.keys(m),
        metaclassOf: id => m[id]?.meta,
        referenceTargets: (id, ref) => [...(m[id]?.refs?.[ref] ?? [])],
        attributeValue: (id, attr) => m[id]?.attrs?.[attr],
        ownerOf: f => (f.includes('.') ? f.split('.')[0] : undefined),
        conformsTo: (c, s) => c === s || SUPERS[c] === s,
        nameOf: id => m[id]?.name,
    };
}

const stcOf = (bag: Record<string, unknown>): DcnStc => dcnStcFromRoles(bag) as DcnStc;

describe('the coherence roles of dcnStcFromRoles', () => {
    it('reads the nine keys, and leaves the stc of a bag without them as it was', () => {
        expect(stcOf(COHERENCE_BAG)).toMatchObject({
            coherence: 'CoherenceConstraint',
            coherenceContext: 'CoherenceConstraint.context',
            coherencePointwise: 'CoherenceConstraint.pointwise',
            coherencePattern: 'CoherenceConstraint.pattern',
            persistenceCondition: 'BoundedPersistence.condition',
            persistenceBound: 'BoundedPersistence.k',
            responseTrigger: 'BoundedResponse.trigger',
            responseResponse: 'BoundedResponse.response',
            responseBound: 'BoundedResponse.k',
        });
        expect(stcOf(DRONE_BAG)).not.toHaveProperty('coherence');
    });

    it('a bag without them is still complete, and they do not stand in for the closure (mutant: a coherence role in the closure)', () => {
        expect(dcnStcFromRoles(DRONE_BAG)).not.toBeNull();
        expect(dcnStcFromRoles(without(COHERENCE_BAG, 'simInvariant'))).toBeNull();
    });

    it('drops what hangs on an unset role, transitively (mutant: a pattern role depending on the constraint only)', () => {
        const noPattern = stcOf(without(COHERENCE_BAG, 'simCoherencePattern'));
        expect(noPattern.persistenceCondition).toBeUndefined();
        expect(noPattern.persistenceBound).toBeUndefined();
        expect(noPattern.responseTrigger).toBeUndefined();
        expect(noPattern.responseResponse).toBeUndefined();
        expect(noPattern.responseBound).toBeUndefined();
        // control: what hangs on the constraint stays
        expect(noPattern.coherenceContext).toBe(CONTEXT);
        expect(noPattern.coherencePointwise).toBe(POINTWISE);
        const noConstraint = stcOf(without(COHERENCE_BAG, 'simCoherence'));
        for (const k of ['coherenceContext', 'coherencePointwise', 'coherencePattern', 'responseBound'] as const) {
            expect(noConstraint[k], k).toBeUndefined();
        }
    });
});

describe('dcnCoherenceFromRoles', () => {
    const read = (m: Model = coherenceModel(), bag: Record<string, unknown> = COHERENCE_BAG) => dcnCoherenceFromRoles(stcOf(bag), viewOf(m));

    it('reads a φ-only constraint, a persistence and a response, in model order, as plain data', () => {
        expect(read()).toEqual({
            constraints: [
                { id: 'phi', name: 'chargeNonNegative', context: 'Drone', pointwise: 'self.battery >= 0', pattern: null },
                {
                    id: 'persists', name: 'notTooFast', context: 'Drone', pointwise: null,
                    pattern: { kind: 'persistence', id: 'p1', condition: 'self.speed > 10', k: 3 },
                },
                {
                    id: 'responds', name: 'landsWhenLow', context: 'Drone', pointwise: 'self.power > 0',
                    pattern: { kind: 'response', id: 'p2', trigger: 'self.battery < 5', response: 'self.altitude = 0', k: 2 },
                },
            ],
            defects: [],
        });
    });

    it('is empty with the roles unbound, even with constraint objects in the model (mutant: the class role not checked)', () => {
        expect(read(coherenceModel(), DRONE_BAG)).toEqual({ constraints: [], defects: [] });
    });

    it('takes subclasses of the constraint and of the pattern (mutants: metaclass by equality, in either place)', () => {
        const m = coherenceModel();
        m.phi.meta = 'SpecialConstraint';
        m.p1.meta = 'SlowPersistence';
        const { constraints } = read(m);
        expect(constraints.map(c => c.id)).toEqual(['phi', 'persists', 'responds']);
        expect(constraints[1].pattern?.kind).toBe('persistence');
    });

    it('reads a blank φ as null and an absent context as null (mutant: the raw value kept)', () => {
        const m = coherenceModel();
        m.phi.attrs = { [POINTWISE]: '   ' };
        m.phi.refs = {};
        expect(read(m).constraints[0]).toEqual({ id: 'phi', name: 'chargeNonNegative', context: null, pointwise: null, pattern: null });
    });

    it('falls back on the id for a constraint with no name', () => {
        const m = coherenceModel();
        delete m.phi.name;
        expect(read(m).constraints[0].name).toBe('phi');
    });

    it('a pattern of neither kind is no pattern and no defect (mutant: the second kind as the default)', () => {
        const m = coherenceModel();
        m.p2.meta = 'SomethingElse';
        const { constraints, defects } = read(m);
        expect(constraints[2].pattern).toBeNull();
        expect(defects).toEqual([]);
    });

    for (const [label, k, message] of [
        ['absent', undefined, 'a pattern with no k'],
        ['blank', '  ', 'a pattern with no k'],
        ['zero', 0, 'k 0 is not a positive integer'],
        ['negative', -1, 'k -1 is not a positive integer'],
        ['negative text', '-4', 'k -4 is not a positive integer'],
        ['fractional', 2.5, 'k 2.5 is not a positive integer'],
        ['not a number', 'many', 'k many is not a positive integer'],
    ] as const) {
        it(`a persistence with a bad k (${label}) is a bounds defect, and its pattern is dropped (mutants: k > 0 relaxed, the defect not pushed)`, () => {
            const m = coherenceModel();
            m.p1.attrs = { 'BoundedPersistence.condition': 'self.speed > 10', ...(k === undefined ? {} : { 'BoundedPersistence.k': k }) };
            const { constraints, defects } = read(m);
            expect(defects).toEqual([{ index: null, name: 'notTooFast', code: 'bounds', message, element: 'p1' }]);
            expect(constraints[1]).toEqual({ id: 'persists', name: 'notTooFast', context: 'Drone', pointwise: null, pattern: null });
            // control: the others are read as before
            expect(constraints[2].pattern?.kind).toBe('response');
        });
    }

    it('a response with a bad k is a defect too, its φ stays (mutant: only the persistence k checked)', () => {
        const m = coherenceModel();
        (m.p2.attrs as Record<string, unknown>)['BoundedResponse.k'] = 0;
        const { constraints, defects } = read(m);
        expect(defects.map(d => [d.code, d.name, d.element])).toEqual([['bounds', 'landsWhenLow', 'p2']]);
        expect(constraints[2]).toMatchObject({ pointwise: 'self.power > 0', pattern: null });
    });

    it('a pattern whose k role is unbound is a defect, as a missing k (mutant: an unbound k read as fine)', () => {
        const { defects } = read(coherenceModel(), without(COHERENCE_BAG, 'simPersistenceBound'));
        expect(defects.map(d => [d.message, d.element])).toEqual([['a pattern with no k', 'p1']]);
    });
});
