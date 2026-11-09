/**
 * dcnCoherence — coherence constraints over a trajectory (P-2026-11-09-0259,
 * R-DCN-28, R-DCN-31; SoSyM 2026 §3.1 Examples 1 and 2, §4.2 Definition 5).
 *
 * The view is a small drone-like model in the shape of dcnHandles.test.ts,
 * written by hand (a test file is not imported by another): two drones, one
 * temperature sensor under the abstract `Sensor`, a viewpoint `Mode`. The
 * constraints are plain `DcnCoherenceConstraint` data, the reader's output.
 */

import { describe, it, expect } from 'vitest';
import type { JjelValue } from '../../../../jjel/evaluator';
import { compileDcn } from '../dcnCompile';
import type { DcnCompileInput, DcnReadView } from '../dcnCompile';
import { readDcnModel } from '../dcnHandles';
import type { DcnModel } from '../dcnHandles';
import type { DcnCoherenceConstraint, DcnStc } from '../dcnRoles';
import { compileDcnCoherence, coherenceHits } from '../dcnCoherence';
import type { DcnCoherenceHit, DcnCompiledCoherence } from '../dcnCoherence';
import { freezeSnapshot } from '../../guardContext';
import type { SimSnapshot } from '../../guardContext';
import type { NetConfiguration, SimValue } from '../../netTypes';
import type { OntoBinding } from '../../../ontological/bindingCodec';

const SUPERS: Record<string, string[]> = {
    NamedElement: [], Classifier: ['NamedElement'], StaticClass: ['Classifier'], PrimitiveType: ['Classifier'],
    InstanceSpecification: ['NamedElement'], Property: ['NamedElement'], Generalization: [],
    Viewpoint: ['NamedElement'], DynamicClass: ['NamedElement'],
};
const conformsTo = (m: string, s: string): boolean => m === s || (SUPERS[m] ?? []).some(x => conformsTo(x, s));

const STC: DcnStc = {
    staticClass: 'StaticClass', viewpoints: 'StaticClass.viewpoints',
    dynamicClasses: 'Viewpoint.classes', invariant: 'DynamicClass.invariant',
};

const BINDING: OntoBinding = {
    name: 'object',
    typeReference: 'InstanceSpecification.classifier',
    featureContainer: 'StaticClass.ownedAttributes',
    generalization: { via: 'Classifier.generalizations', general: 'Generalization.general' },
    featureType: 'TypedElement.type',
    defaultValue: 'Property.defaultValue',
} as OntoBinding;

interface Obj { meta: string; name?: string; refs?: Record<string, string[]>; attrs?: Record<string, unknown> }
type Model = Record<string, Obj>;

function droneModel(): Model {
    const m: Model = {};
    const prop = (owner: string, name: string, type: string, attrs: Record<string, unknown>) => {
        const id = `p_${owner}_${name}`;
        m[id] = { meta: 'Property', name, refs: { 'TypedElement.type': [type] }, attrs };
        ((m[owner].refs ??= {})['StaticClass.ownedAttributes'] ??= []).push(id);
    };
    const inst = (id: string, classifier: string) => {
        m[id] = { meta: 'InstanceSpecification', name: id, refs: { 'InstanceSpecification.classifier': [classifier] } };
    };
    m.Boolean = { meta: 'PrimitiveType', name: 'Boolean' };
    m.Integer = { meta: 'PrimitiveType', name: 'Integer' };

    m.Drone = { meta: 'StaticClass', name: 'Drone', refs: { 'StaticClass.viewpoints': ['Mode'] } };
    for (const b of ['highLoad', 'lowBattery', 'landed', 'airborne']) prop('Drone', b, 'Boolean', { 'Property.defaultValue': 'false' });
    prop('Drone', 'battery', 'Integer', { 'Property.rangeMin': 0, 'Property.rangeMax': 100, 'Property.defaultValue': '80' });
    m.Mode = { meta: 'Viewpoint', name: 'Mode', refs: { 'Viewpoint.classes': ['Flying'] } };
    m.Flying = { meta: 'DynamicClass', name: 'Flying', attrs: { 'DynamicClass.invariant': 'self.airborne' } };

    m.Sensor = { meta: 'StaticClass', name: 'Sensor' };
    m.TempSensor = { meta: 'StaticClass', name: 'TempSensor', refs: { 'Classifier.generalizations': ['gen_Temp'] } };
    m.gen_Temp = { meta: 'Generalization', refs: { 'Generalization.general': ['Sensor'] } };
    prop('TempSensor', 'faulty', 'Boolean', { 'Property.defaultValue': 'false' });

    inst('dji', 'Drone');
    inst('dji2', 'Drone');
    inst('temp1', 'TempSensor');
    return m;
}

function viewOf(m: Model): DcnReadView {
    return {
        objects: () => Object.keys(m),
        metaclassOf: id => m[id]?.meta,
        referenceTargets: (id, r) => [...(m[id]?.refs?.[r] ?? [])],
        attributeValue: (id, attr) => m[id]?.attrs?.[attr],
        ownerOf: f => (f.includes('.') ? f.split('.')[0] : undefined),
        conformsTo,
        nameOf: id => m[id]?.name,
    };
}

function snapshotOf(m: Model): SimSnapshot {
    const instances = Object.entries(m).map(([id, o]) => ({ __type: 'Object', id, name: o.name ?? id, metaclass: o.meta }));
    const globals: Record<string, JjelValue> = { instances };
    return freezeSnapshot(globals, { id: 'drone', name: 'Drones' });
}

interface Fixture { input: DcnCompileInput; model: DcnModel; snapshot: SimSnapshot; initial: DcnModel['compiled']['net']['initial'] }

function fixture(): Fixture {
    const m = droneModel();
    const input: DcnCompileInput = {
        modelId: 'drone', stc: STC, binding: BINDING, view: viewOf(m),
        features: { rangeMin: 'Property.rangeMin', rangeMax: 'Property.rangeMax' },
    };
    const compiled = compileDcn(input);
    return { input, model: readDcnModel(input, compiled), snapshot: snapshotOf(m), initial: compiled.net.initial };
}

const F = fixture();

type Over = Record<string, Record<string, SimValue>>;

function cfg(over: Over = {}): NetConfiguration {
    const attrs = new Map([...F.initial.attrs].map(([i, a]) => [i, new Map(a)]));
    for (const [i, values] of Object.entries(over)) for (const [k, v] of Object.entries(values)) attrs.get(i)!.set(k, v);
    return { state: { ...F.initial, attrs }, event: null };
}

/** σ0..σn from the values one attribute of `instance` takes. */
const along = (attr: string, values: SimValue[], instance = 'dji'): NetConfiguration[] =>
    values.map(v => cfg({ [instance]: { [attr]: v } }));

const compile = (...constraints: DcnCoherenceConstraint[]): DcnCompiledCoherence =>
    compileDcnCoherence({ constraints, model: F.model, view: F.input.view, binding: BINDING, snapshot: F.snapshot });

const constraint = (over: Partial<DcnCoherenceConstraint>): DcnCoherenceConstraint =>
    ({ id: 'c1', name: 'c1', context: 'Drone', pointwise: null, pattern: null, ...over });

const phi = (text: string, over: Partial<DcnCoherenceConstraint> = {}) => constraint({ pointwise: text, ...over });

const persistence = (condition: string | null, k: number, over: Partial<DcnCoherenceConstraint> = {}) =>
    constraint({ pattern: { kind: 'persistence', id: 'p1', condition, k }, ...over });

const response = (trigger: string | null, resp: string | null, k: number, over: Partial<DcnCoherenceConstraint> = {}) =>
    constraint({ pattern: { kind: 'response', id: 'p1', trigger, response: resp, k }, ...over });

const hit = (step: number, kind: DcnCoherenceHit['kind'], instanceId = 'dji', constraintId = 'c1'): DcnCoherenceHit =>
    ({ step, instanceId, constraintId, kind });

/** The trigger and the response of dji along a trace: T a trigger, R a response, B both, `.` neither. */
function responseTrace(marks: string): NetConfiguration[] {
    return [...marks].map(c => cfg({ dji: { lowBattery: c === 'T' || c === 'B', landed: c === 'R' || c === 'B' } }));
}

const RESPONSE = response('self.lowBattery', 'self.landed', 2);
const NOTHING = { hits: [], pending: [], failures: [] };
const hitsOf = (c: DcnCompiledCoherence, trace: readonly NetConfiguration[]) => coherenceHits(c, trace).hits;

describe('φ, pointwise', () => {
    it('is violated at the step where it is false, once per step, on the instance it is false for', () => {
        const trace = along('battery', [80, 5, 80]);
        expect(hitsOf(compile(phi('self.battery > 10')), trace)).toEqual([hit(1, 'pointwise')]);
    });

    it('is checked at σ0 too, and reported again at a later step', () => {
        const trace = along('battery', [5, 80, 5]);
        expect(hitsOf(compile(phi('self.battery > 10')), trace)).toEqual([hit(0, 'pointwise'), hit(2, 'pointwise')]);
    });
});

describe('BoundedPersistence (SoSyM §3.1, Examples 1 and 2)', () => {
    const P = persistence('self.highLoad', 2);

    it('Example 1: two consecutive steps with k = 2 are admissible', () => {
        expect(hitsOf(compile(P), along('highLoad', [true, true, false]))).toEqual([]);
    });

    it('Example 2: three consecutive steps are not, and the violation is at the third', () => {
        expect(hitsOf(compile(P), along('highLoad', [true, true, true]))).toEqual([hit(2, 'persistence')]);
    });

    it('a step that does not hold resets the count', () => {
        expect(hitsOf(compile(P), along('highLoad', [true, true, false, true, true]))).toEqual([]);
    });

    it('the monitor keeps going: every further step of the run is a violation', () => {
        expect(hitsOf(compile(P), along('highLoad', [true, true, true, true]))).toEqual([hit(2, 'persistence'), hit(3, 'persistence')]);
    });

    it('a later run is reported again', () => {
        const trace = along('highLoad', [true, true, true, false, true, true, true]);
        expect(hitsOf(compile(P), trace)).toEqual([hit(2, 'persistence'), hit(6, 'persistence')]);
    });

    it('k = 1 allows one step only', () => {
        expect(hitsOf(compile(persistence('self.highLoad', 1)), along('highLoad', [true, true]))).toEqual([hit(1, 'persistence')]);
    });
});

describe('BoundedResponse', () => {
    it('a response at i + k meets the trigger', () => {
        expect(coherenceHits(compile(RESPONSE), responseTrace('.T.R'))).toEqual(NOTHING);
    });

    it('a response at i + k + 1 is too late: the violation is at i + k', () => {
        const out = coherenceHits(compile(RESPONSE), responseTrace('.T..R'));
        expect(out.hits).toEqual([hit(3, 'response')]);
        expect(out.pending).toEqual([]);
    });

    it('a response at the trigger step meets it (j = i)', () => {
        expect(coherenceHits(compile(RESPONSE), responseTrace('B...'))).toEqual(NOTHING);
    });

    it('a response before the trigger does not meet it', () => {
        expect(hitsOf(compile(RESPONSE), responseTrace('RT..'))).toEqual([hit(3, 'response')]);
    });

    it('a trigger open at the end is pending, not violated, up to i + k - 1', () => {
        const out = coherenceHits(compile(RESPONSE), responseTrace('.T.'));
        expect(out.hits).toEqual([]);
        expect(out.pending).toEqual([{ step: 1, deadline: 3, instanceId: 'dji', constraintId: 'c1' }]);
    });

    it('at i + k with no response it is violated, not pending', () => {
        const out = coherenceHits(compile(RESPONSE), responseTrace('.T..'));
        expect(out.hits).toEqual([hit(3, 'response')]);
        expect(out.pending).toEqual([]);
    });

    it('one response meets every open trigger', () => {
        expect(coherenceHits(compile(RESPONSE), responseTrace('TTR...'))).toEqual(NOTHING);
    });

    it('each unmet trigger is its own violation at its own step', () => {
        const out = coherenceHits(compile(RESPONSE), responseTrace('TT..'));
        expect(out.hits).toEqual([hit(2, 'response'), hit(3, 'response')]);
        expect(out.pending).toEqual([]);
    });

    it('after a violation a new trigger opens a new obligation', () => {
        expect(hitsOf(compile(RESPONSE), responseTrace('T..T..'))).toEqual([hit(2, 'response'), hit(5, 'response')]);
    });
});

describe('per instance, by context', () => {
    it('two instances have independent persistence counters', () => {
        const flags = [[true, false], [true, true], [false, true], [false, true]];
        const trace = flags.map(([a, b]) => cfg({ dji: { highLoad: a }, dji2: { highLoad: b } }));
        expect(hitsOf(compile(persistence('self.highLoad', 2)), trace)).toEqual([hit(3, 'persistence', 'dji2')]);
    });

    it("a response of one instance does not meet another's trigger", () => {
        const trace = [
            cfg({ dji: { lowBattery: true } }),
            cfg({ dji2: { landed: true } }),
            cfg({ dji2: { landed: true } }),
        ];
        expect(hitsOf(compile(RESPONSE), trace)).toEqual([hit(2, 'response')]);
    });

    it('a constraint is not evaluated on an instance its context does not cover', () => {
        const out = coherenceHits(compile(phi('self.nothingOfTheKind', { context: 'TempSensor' })), along('highLoad', [true]));
        expect(out.failures.map(f => f.instanceId)).toEqual(['temp1']);
        expect(hitsOf(compile(phi('self.faulty', { context: 'TempSensor' })), along('highLoad', [true]))).toEqual([hit(0, 'pointwise', 'temp1')]);
    });

    it('a context general of the classifier covers the instance (the closure)', () => {
        expect(hitsOf(compile(phi('self.faulty', { context: 'Sensor' })), along('highLoad', [true]))).toEqual([hit(0, 'pointwise', 'temp1')]);
    });

    it('a context no classifier reaches covers nobody', () => {
        expect(coherenceHits(compile(phi('false', { context: 'Integer' })), along('highLoad', [true]))).toEqual(NOTHING);
    });

    it('every instance the context covers is monitored, each constraint on its own', () => {
        const hits = hitsOf(compile(phi('self.battery > 10'), phi('self.battery > 90', { id: 'c2', name: 'c2' })), along('battery', [5]));
        expect(hits).toEqual([hit(0, 'pointwise', 'dji', 'c1'), hit(0, 'pointwise', 'dji', 'c2'), hit(0, 'pointwise', 'dji2', 'c2')]);
    });

    it('φ and ψ of one constraint violated at one step are one hit, φ first; the pattern keeps counting', () => {
        const c = constraint({ pointwise: 'self.battery > 10', pattern: { kind: 'persistence', id: 'p1', condition: 'self.highLoad', k: 1 } });
        const trace = [cfg({ dji: { highLoad: true } }), cfg({ dji: { highLoad: true, battery: 5 } }), cfg({ dji: { highLoad: true } })];
        expect(hitsOf(compile(c), trace)).toEqual([hit(1, 'pointwise'), hit(2, 'persistence')]);
    });
});

describe('the fold under a φ hit', () => {
    it('the persistence run counts at a step φ has hit', () => {
        const c = constraint({ pointwise: 'self.battery > 10', pattern: { kind: 'persistence', id: 'p1', condition: 'self.highLoad', k: 2 } });
        const trace = [cfg({ dji: { highLoad: true } }), cfg({ dji: { highLoad: true, battery: 5 } }), cfg({ dji: { highLoad: true } })];
        expect(hitsOf(compile(c), trace)).toEqual([hit(1, 'pointwise'), hit(2, 'persistence')]);
    });
});

describe('the expression context', () => {
    it('.in(V::D) reads the classification of the σ at that step', () => {
        const hits = hitsOf(compile(phi('self.in(Mode::Flying)')), along('airborne', [true, false]));
        expect(hits).toEqual([hit(0, 'pointwise', 'dji2'), hit(1, 'pointwise', 'dji'), hit(1, 'pointwise', 'dji2')]);
    });

    it('an instance is reachable by its name', () => {
        expect(hitsOf(compile(phi('dji.battery > 10', { context: 'TempSensor' })), along('battery', [5, 80]))).toEqual([hit(0, 'pointwise', 'temp1')]);
    });

    it('event is null, whatever the configuration records', () => {
        expect(hitsOf(compile(phi('event == null')), along('battery', [5]).map(c => ({ ...c, event: 'dji' })))).toEqual([]);
    });
});

describe('defects', () => {
    it('an unparsable φ is a parse defect on the constraint, and the pattern is still monitored', () => {
        const compiled = compile(constraint({ pointwise: 'self.battery >', pattern: { kind: 'persistence', id: 'p1', condition: 'self.highLoad', k: 1 } }));
        expect(compiled.defects).toHaveLength(1);
        expect(compiled.defects[0]).toMatchObject({ index: null, name: 'c1', code: 'parse', element: 'c1' });
        expect(hitsOf(compiled, along('highLoad', [true, true]))).toEqual([hit(1, 'persistence')]);
    });

    it('an unparsable pattern expression is a parse defect on the pattern, and φ is still monitored', () => {
        const compiled = compile(constraint({ pointwise: 'self.battery > 10', pattern: { kind: 'persistence', id: 'p1', condition: 'self.highLoad and', k: 1 } }));
        expect(compiled.defects).toHaveLength(1);
        expect(compiled.defects[0]).toMatchObject({ name: 'c1', code: 'parse', element: 'p1' });
        expect(hitsOf(compiled, along('battery', [5, 5]))).toEqual([hit(0, 'pointwise'), hit(1, 'pointwise')]);
    });

    it.each([
        ['trigger', response('self.lowBattery +', 'self.landed', 2)],
        ['response', response('self.lowBattery', 'self.landed +', 2)],
    ])('a response with an unparsable %s is one defect and is not monitored', (_label, c) => {
        const compiled = compile(c);
        expect(compiled.defects).toHaveLength(1);
        expect(compiled.defects[0]).toMatchObject({ name: 'c1', code: 'parse', element: 'p1' });
        expect(coherenceHits(compiled, responseTrace('T...'))).toEqual(NOTHING);
    });

    it('an expression the guard subset refuses is a subset defect', () => {
        const compiled = compile(phi('data.battery > 1'));
        expect(compiled.defects).toHaveLength(1);
        expect(compiled.defects[0]).toMatchObject({ name: 'c1', code: 'subset', element: 'c1' });
        expect(coherenceHits(compiled, along('battery', [5]))).toEqual(NOTHING);
    });

    it('a blank pattern expression and a missing context are record defects, never a true', () => {
        const blank = compile(
            persistence(null, 2),
            response('self.lowBattery', null, 2, { id: 'c2', name: 'c2' }),
            response(null, 'self.landed', 2, { id: 'c3', name: 'c3' }),
            phi('false', { id: 'c4', name: 'c4', context: null }),
        );
        expect(blank.defects.map(d => [d.name, d.code, d.element])).toEqual([['c1', 'record', 'p1'], ['c2', 'record', 'p1'], ['c3', 'record', 'p1'], ['c4', 'record', 'c4']]);
        expect(coherenceHits(blank, responseTrace('TTTT'))).toEqual(NOTHING);
    });

    it('a constraint with neither φ nor ψ is no defect', () => {
        expect(compile(constraint({})).defects).toEqual([]);
    });

    it('an expression that fails on a σ is a failure and holds nothing: no hit, no run, no obligation', () => {
        const named = 'self.nothingOfTheKind';
        for (const c of [phi(named), persistence(named, 1), response(named, 'self.highLoad', 1)]) {
            const out = coherenceHits(compile(c), along('highLoad', [true, true, true]));
            expect(out.hits).toEqual([]);
            expect(out.pending).toEqual([]);
            expect(out.failures.filter(f => f.instanceId === 'dji').map(f => f.step)).toEqual([0, 1, 2]);
            expect(out.failures[0]).toMatchObject({ constraintId: 'c1' });
            expect(out.failures[0].detail).toContain('nothingOfTheKind');
        }
    });

    it('a response that fails on a σ does not meet the trigger', () => {
        const out = coherenceHits(compile(response('self.lowBattery', 'self.nothingOfTheKind', 1)), responseTrace('T.'));
        expect(out.hits).toEqual([hit(1, 'response')]);
        expect(out.failures.filter(f => f.instanceId === 'dji').map(f => f.step)).toEqual([0, 1]);
    });
});

describe('a pure fold, cached per configuration (R-DCN-31)', () => {
    /** A configuration that counts the reads of its σ. */
    function counted(c: NetConfiguration): { cfg: NetConfiguration; reads: () => number } {
        let reads = 0;
        const out = { event: c.event, get state() { reads++; return c.state; } };
        return { cfg: out, reads: () => reads };
    }

    it('a configuration already seen is not read again, on replay and on step back', () => {
        const a = counted(cfg({ dji: { highLoad: true } }));
        const b = counted(cfg({ dji: { highLoad: true } }));
        const c = compile(persistence('self.highLoad', 1));
        expect(hitsOf(c, [a.cfg, b.cfg])).toEqual([hit(1, 'persistence')]);
        expect([a.reads(), b.reads()]).toEqual([1, 1]);
        expect(hitsOf(c, [a.cfg, b.cfg])).toEqual([hit(1, 'persistence')]);
        expect(hitsOf(c, [a.cfg])).toEqual([]);
        expect([a.reads(), b.reads()]).toEqual([1, 1]);
    });

    it('the cache is per compiled set: other constraints read the same configuration anew', () => {
        const a = counted(cfg());
        hitsOf(compile(phi('self.battery > 10')), [a.cfg]);
        expect(hitsOf(compile(phi('self.battery > 90')), [a.cfg]).map(h => h.step)).toEqual([0, 0]);
        expect(a.reads()).toBe(2);
    });

    it('counters are not cached with the configuration: the same object in another prefix counts anew', () => {
        const high = cfg({ dji: { highLoad: true } });
        const c = compile(persistence('self.highLoad', 1));
        expect(hitsOf(c, [high, high])).toEqual([hit(1, 'persistence')]);
        expect(hitsOf(c, [cfg(), high])).toEqual([]);
        expect(hitsOf(c, [high])).toEqual([]);
    });

    it('step back and a new branch fold from the configurations alone', () => {
        const c = compile(RESPONSE);
        const stem = responseTrace('.T.');
        expect(hitsOf(c, [...stem, ...responseTrace('.')])).toEqual([hit(3, 'response')]);
        expect(coherenceHits(c, stem).pending).toHaveLength(1);
        expect(coherenceHits(c, [...stem, ...responseTrace('R')])).toEqual(NOTHING);
    });

    it('an empty trajectory has no hit', () => {
        expect(coherenceHits(compile(RESPONSE), [])).toEqual(NOTHING);
    });
});
