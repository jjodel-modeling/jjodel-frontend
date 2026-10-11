/**
 * Multi-valued navigation (P-2026-10-12-0120).
 *
 * A feature declared multi-valued (upper bound -1 or above 1) navigates to the array of its
 * values, in slot order, an empty array when it holds none; a single-valued feature navigates
 * to its value or null. The declared multiplicity decides, never the number of values.
 *
 * Measured on the trunk (`docs/discovery/discovery_2026-10-12_jjel_multivalued_navigation.md`):
 * `extractAttributeValues` read `$f.value` for every feature, so `self` in the Jodie console
 * (`wrapSelectedElement`) and the bare feature names of the classic Console saw the first
 * value of a multi-valued feature. The pool handles (`fillInstanceSlots`) already honoured
 * the upper bound and are the control here.
 *
 * The fixture mirrors the L-proxy shape the probe measured on the live app: `Reflect.ownKeys`
 * lists `features` and no `$` key, the `$f` slot is served by the `get` trap only, a slot
 * exposes `value` (the first), `values` (all), `instanceof.upperBound` and `__raw.values`.
 *
 * `buildEvalContext` and `evaluateJjelInJodie` import the joiner barrel, which writes on
 * `window`: the barrel is mocked, as in `jjscript/executor/__tests__/m1Operators.test.ts`, so
 * the two readers run for real over the fixture.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

type Rec = Record<string, any>;

const h = vi.hoisted(() => ({
    byId: new Map<string, any>(),
    idlookup: {} as Record<string, any>,
    selected: '' as string,
    project: null as any,
    metamodel: null as any,
}));

vi.mock('../../joiner', () => ({
    store: { getState: () => ({ idlookup: h.idlookup, _lastSelected: { modelElement: h.selected, node: '' } }) },
    LPointerTargetable: { fromPointer: (id: string) => h.byId.get(id) ?? null },
    L: { fromPointer: () => ({ project: h.project }) },
    DUser: { current: 'Pointer_user' },
}));

vi.mock('../../jjscript/executor/utils', () => ({
    getProject: () => h.project,
    getTargetMetamodel: () => h.metamodel,
}));

// The barrel pulls in the editor; the Jodie context needs only the builder from it.
vi.mock('../../jjscript', async () => {
    const real = await vi.importActual<any>('../../jjscript/executor/commands/eval');
    return { buildEvalContext: real.buildEvalContext };
});

import { jjelEval, jjelEvalWithDiagnostics } from '../index';
import { JjelEvaluator, JjelEvaluationError } from '../evaluator/evaluator';
import { EvaluationContext } from '../evaluator/context';
import { parseExpression } from '../parser/parser';
import { extractAttributeValues } from '../evaluator/modelContext';
import { buildEvalContext } from '../../jjscript/executor/commands/eval';
import { evaluateJjelInJodie } from '../../components/Jodie/jodieJjelContext';

// ── The fixture metamodel ───────────────────────────────────────────────────────────────────
//
// Region.subVertices  : Vertex[*]      containment
// Region.subTransitions: Transition[*] containment
// State.outgoing      : Transition[*]  non-containment
// State.tags          : EString[*]     attribute
// Transition.source   : Vertex[1]      non-containment

interface FeatDecl { name: string; kind: 'DReference' | 'DAttribute'; ub: number }

const FEATS: Record<string, FeatDecl[]> = {
    StateMachine: [{ name: 'regions', kind: 'DReference', ub: -1 }],
    Region: [
        { name: 'subVertices', kind: 'DReference', ub: -1 },
        { name: 'subTransitions', kind: 'DReference', ub: -1 },
    ],
    InitialState: [],
    State: [
        { name: 'tags', kind: 'DAttribute', ub: -1 },
        { name: 'outgoing', kind: 'DReference', ub: -1 },
    ],
    Transition: [
        { name: 'source', kind: 'DReference', ub: 1 },
        { name: 'target', kind: 'DReference', ub: 1 },
    ],
};

function metaFeature(cls: string, f: FeatDecl): Rec {
    return {
        name: f.name, className: f.kind, upperBound: f.ub, lowerBound: 0,
        type: { name: f.kind === 'DAttribute' ? 'EString' : 'Vertex' },
        __owner: cls,
    };
}

const CLASSES: Rec[] = Object.keys(FEATS).map(name => ({
    name,
    className: 'DClass',
    attributes: FEATS[name].filter(f => f.kind === 'DAttribute').map(f => metaFeature(name, f)),
    references: FEATS[name].filter(f => f.kind === 'DReference').map(f => metaFeature(name, f)),
    extends: [],
    allSubclasses: [],
    operations: [],
}));
const classByName = new Map(CLASSES.map(c => [c.name, c]));

/** An L-proxy of an M1 object, the shape measured on the live app. */
function makeObject(id: string, cls: string, name: string, slots: Record<string, unknown[]>): any {
    const meta = classByName.get(cls)!;
    const features = FEATS[cls].map(decl => {
        const m = [...meta.attributes, ...meta.references].find((x: Rec) => x.name === decl.name);
        const raw = (slots[decl.name] ?? []).slice();
        const resolve = (v: unknown) => (decl.kind === 'DReference' && typeof v === 'string') ? h.byId.get(v) : v;
        return {
            name: decl.name,
            className: 'DValue',
            instanceof: m,
            __raw: { values: raw },
            get values() { return raw.map(resolve); },
            get value() { return raw.length ? resolve(raw[0]) : undefined; },
        };
    });
    const target: Rec = {
        id, name, className: 'DObject', instanceof: meta, features,
        __raw: { id, className: 'DObject', father: 'Pointer_m1' },
    };
    return new Proxy(target, {
        // The `$f` slot is served by the get trap and is not an own key.
        get(t, k) {
            if (typeof k === 'string' && k.startsWith('$')) return features.find(f => f.name === k.slice(1));
            return (t as any)[k];
        },
        ownKeys: (t) => Reflect.ownKeys(t),
    });
}

function buildFixture(): void {
    h.byId.clear();
    h.idlookup = { Pointer_m1: { id: 'Pointer_m1', className: 'DModel', name: 'm1' } };
    const objs: Array<[string, string, string, Record<string, unknown[]>]> = [
        ['o_sm', 'StateMachine', 'StateMachine_0', { regions: ['o_r0'] }],
        ['o_r0', 'Region', 'Region_0', { subVertices: ['o_i0', 'o_s0'], subTransitions: ['o_t0'] }],
        ['o_r1', 'Region', 'Region_1', { subVertices: ['o_s1'], subTransitions: [] }],
        ['o_i0', 'InitialState', 'InitialState_0', {}],
        ['o_s0', 'State', 'State_0', { tags: ['a', 'b'], outgoing: ['o_t0'] }],
        ['o_s1', 'State', 'State_1', { tags: ['x'], outgoing: [] }],
        ['o_s2', 'State', 'State_2', { tags: [], outgoing: ['o_t0', 'o_t1'] }],
        ['o_t0', 'Transition', 'Transition_0', { source: ['o_i0'], target: ['o_s0'] }],
        ['o_t1', 'Transition', 'Transition_1', { source: [], target: [] }],
    ];
    for (const [id, cls, name, slots] of objs) {
        h.byId.set(id, makeObject(id, cls, name, slots));
        h.idlookup[id] = { id, className: 'DObject', name, father: 'Pointer_m1' };
    }
    const m1 = { allSubObjects: objs.map(([id]) => h.byId.get(id)) };
    h.metamodel = { name: 'StatechartMM', classes: CLASSES, instances: [m1], allSubPackages: [], enumerators: [] };
    h.project = { name: 'P', metamodels: [h.metamodel] };
}

const names = (v: unknown): unknown =>
    Array.isArray(v) ? v.map(names) : (v && typeof v === 'object') ? (v as Rec).name : v;

beforeEach(() => {
    buildFixture();
    h.selected = '';
});

// ── 1. The shared layer: extractAttributeValues ─────────────────────────────────────────────

describe('extractAttributeValues follows the declared multiplicity', () => {
    /** The classic Console: flattenProxyContext (own keys) then extractAttributeValues. */
    const flatten = (id: string): Rec => {
        const p = h.byId.get(id);
        const out: Rec = {};
        for (const k of Reflect.ownKeys(p)) if (typeof k === 'string' && !k.startsWith('__')) out[k] = p[k];
        extractAttributeValues(p, out);
        return out;
    };

    it('multi-valued containment reference with 2 values: an array in slot order', () => {
        const c = flatten('o_r0');
        expect(names(c.subVertices)).toEqual(['InitialState_0', 'State_0']);
        expect(jjelEval('subVertices.size', c)).toBe(2);
    });

    it('multi-valued containment reference with 1 value: an array of one, not the object', () => {
        const c = flatten('o_r0');
        expect(names(c.subTransitions)).toEqual(['Transition_0']);
        expect(jjelEval('subTransitions.size', c)).toBe(1);
        expect(names(jjelEval('(forall s in subTransitions such that true)', c))).toEqual(['Transition_0']);
    });

    it('multi-valued containment reference with 0 values: the empty array', () => {
        const c = flatten('o_r1');
        expect(c.subTransitions).toEqual([]);
        expect(jjelEval('subTransitions.size', c)).toBe(0);
    });

    it('multi-valued attribute with 2, 1 and 0 values', () => {
        expect(flatten('o_s0').tags).toEqual(['a', 'b']);
        expect(flatten('o_s1').tags).toEqual(['x']);
        expect(flatten('o_s2').tags).toEqual([]);
    });

    it('multi-valued non-containment reference with 2, 1 and 0 values', () => {
        expect(names(flatten('o_s2').outgoing)).toEqual(['Transition_0', 'Transition_1']);
        expect(names(flatten('o_s0').outgoing)).toEqual(['Transition_0']);
        expect(flatten('o_s1').outgoing).toEqual([]);
    });

    it('single-valued reference with 1 value: the object, not an array', () => {
        const c = flatten('o_t0');
        expect(Array.isArray(c.source)).toBe(false);
        expect(names(c.source)).toBe('InitialState_0');
    });

    it('single-valued reference with 0 values: null, and the name is bound', () => {
        const c = flatten('o_t1');
        expect('source' in c).toBe(true);
        expect(c.source).toBeNull();
        const { value, warnings } = jjelEvalWithDiagnostics('source', c);
        expect(value).toBeNull();
        expect(warnings).toEqual([]);
    });

    it('an empty single-valued slot does not clobber a key already bound (the identity name)', () => {
        const ctx: Rec = { name: 'Transition_1' };
        const p = h.byId.get('o_t1');
        const nameSlot = { name: 'name', instanceof: { upperBound: 1 }, value: undefined, values: [] };
        const withName = new Proxy({ features: [nameSlot] }, { get: (t, k) => k === '$name' ? nameSlot : (t as any)[k] });
        ctx.features = [nameSlot];
        extractAttributeValues(withName, ctx);
        expect(ctx.name).toBe('Transition_1');
        expect(p).toBeTruthy();
    });

    it('a `$`-keyed own property follows the same rule (strategy 1)', () => {
        const ctx: Rec = {};
        extractAttributeValues({
            $many: { value: 'a', values: ['a', 'b'], instanceof: { upperBound: -1 } },
            $two: { value: 'p', values: ['p', 'q'], instanceof: { upperBound: 2 } },
            $one: { value: 'z', values: ['z'], instanceof: { upperBound: 1 } },
            $none: { value: undefined, values: [], instanceof: { upperBound: 1 } },
            $scalar: { value: 'w', values: 'w', instanceof: { upperBound: -1 } },
            $nothing: { value: undefined, values: null, instanceof: { upperBound: -1 } },
        }, ctx);
        expect(ctx.many).toEqual(['a', 'b']);
        expect(ctx.two).toEqual(['p', 'q']);
        expect(ctx.one).toBe('z');
        expect('none' in ctx).toBe(true);
        expect(ctx.none).toBeNull();
        // A slot whose `values` is not an array reads as fillInstanceSlots reads it.
        expect(ctx.scalar).toEqual(['w']);
        expect(ctx.nothing).toEqual([]);
    });
});

// ── 2. The readers that collapsed: JjScript `data` and the Jodie console `self` ──────────────

describe('buildEvalContext: the selected element (`data`) reads like its pool handle', () => {
    const ctx = () => ({ projectId: 'P', history: [], variables: new Map() }) as any;

    it('data.subVertices on Region_0 is the array of both vertices', () => {
        h.selected = 'o_r0';
        const v = buildEvalContext(ctx());
        expect(names(jjelEval('data.subVertices', v))).toEqual(['InitialState_0', 'State_0']);
        expect(jjelEval('data.subVertices.size', v)).toBe(2);
        expect(names(jjelEval('data.subTransitions', v))).toEqual(['Transition_0']);
    });

    it('the pool handle (control) and `data` agree, feature by feature', () => {
        for (const [id, nm] of [['o_r0', 'Region_0'], ['o_r1', 'Region_1'], ['o_s0', 'State_0'], ['o_s1', 'State_1'], ['o_s2', 'State_2'], ['o_t0', 'Transition_0'], ['o_t1', 'Transition_1']]) {
            h.selected = id;
            const v = buildEvalContext(ctx());
            for (const f of FEATS[(h.byId.get(id) as Rec).instanceof.name]) {
                expect(names(jjelEval(`data.${f.name}`, v)), `${nm}.${f.name}`).toEqual(names(jjelEval(`${nm}.${f.name}`, v)));
            }
        }
    });
});

describe('Jodie console: `self` (the reported reproduction)', () => {
    const run = (expr: string) => {
        const o = evaluateJjelInJodie(expr);
        expect(o.ok, o.text).toBe(true);
        return o;
    };

    it('Region_0: the six expressions of the report', () => {
        h.selected = 'o_r0';
        expect(run('self.name').value).toBe('Region_0');
        expect(names(run('self.subVertices').value)).toEqual(['InitialState_0', 'State_0']);
        const size = run('self.subVertices.size');
        expect(size.value).toBe(2);
        expect(size.warnings).toEqual([]);
        expect(names(run('self.subTransitions').value)).toEqual(['Transition_0']);
        expect(names(run('(forall s in self.subTransitions such that true)').value)).toEqual(['Transition_0']);
        expect(run('(forall s in [1, 2, 3] such that true)').value).toEqual([1, 2, 3]);
    });

    it('exists over a one-valued multi-valued reference finds it', () => {
        h.selected = 'o_r0';
        expect(run('(exists s in self.subTransitions such that s.name == "Transition_0")').value).toBe(true);
    });

    it('Region_1: 0 values is the empty array, size 0', () => {
        h.selected = 'o_r1';
        expect(run('self.subTransitions').value).toEqual([]);
        expect(run('self.subTransitions.size').value).toBe(0);
        expect(run('(exists s in self.subTransitions such that true)').value).toBe(false);
    });

    it('Transition_0 and Transition_1: single-valued stays one object or null', () => {
        h.selected = 'o_t0';
        expect(names(run('self.source').value)).toBe('InitialState_0');
        expect(run('self.source.name').value).toBe('InitialState_0');
        h.selected = 'o_t1';
        const s = run('self.source');
        expect(s.value).toBeNull();
        expect(s.warnings).toEqual([]);
    });
});

// ── 3. forall / exists on a value that is not a collection (R-VAL-13: nothing is converted) ─

describe('forall and exists raise on a non-null value that is not a collection', () => {
    const fails = (expr: string, bindings: Rec, type: string) => {
        let err: unknown = null;
        try { jjelEval(expr, bindings); } catch (e) { err = e; }
        expect(err, expr).toBeInstanceOf(JjelEvaluationError);
        expect((err as Error).message).toContain(type);
    };

    it('forall over an object, a string, a number, a boolean names the type received', () => {
        fails('forall x in o such that true', { o: { name: 'A' } }, 'Object');
        fails('forall x in s : x', { s: 'abc' }, 'String');
        fails('forall x in n : x', { n: 3 }, 'Integer');
        fails('forall x in b : x', { b: true }, 'Boolean');
    });

    it('exists over an object or a string names the type received', () => {
        fails('exists x in o such that true', { o: { name: 'A' } }, 'Object');
        fails('exists x in s such that true', { s: 'abc' }, 'String');
    });

    it('a single-valued reference iterated by mistake is an error, not a silent []', () => {
        h.selected = 'o_t0';
        const o = evaluateJjelInJodie('(forall s in self.source such that true)');
        expect(o.ok).toBe(false);
        expect(o.text).toContain('forall');
    });

    it('null keeps giving [] and false (control)', () => {
        expect(jjelEval('forall x in n : x', { n: null })).toEqual([]);
        expect(jjelEval('exists x in n such that true', { n: null })).toBe(false);
        expect(jjelEval('forall x in xs : x', { xs: [1, 2] })).toEqual([1, 2]);
        expect(jjelEval('exists x in xs such that x == 2', { xs: [1, 2] })).toBe(true);
    });
});

// ── 4. The read observation fires on the same reads ────────────────────────────────────────

describe('readObserver still sees the member read, now carrying the collection', () => {
    it('self.subVertices reports one read of subVertices with the array', () => {
        h.selected = 'o_r0';
        const v = buildEvalContext({ projectId: 'P', history: [], variables: new Map() } as any);
        const ctx = new EvaluationContext(v);
        const reads: Array<[string, unknown]> = [];
        ctx.readObserver = (_t, p, val) => { reads.push([p, names(val)]); };
        const out = new JjelEvaluator(ctx).evaluate(parseExpression('data.subVertices').expression!, ctx);
        expect(names(out)).toEqual(['InitialState_0', 'State_0']);
        expect(reads).toEqual([['subVertices', ['InitialState_0', 'State_0']]]);
    });
});
