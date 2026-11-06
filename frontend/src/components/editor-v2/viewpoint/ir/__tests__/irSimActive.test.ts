/**
 * The `simActive` predicate (P-2026-10-19-0930): true while a simulation run is active on the model
 * the element belongs to.
 *
 * Three halves, as irPresentation.test.ts has them. The compile half runs on the draw ReadCtx with an
 * injected run check (a Set of model ids), so it is about the operator, the walk to the model and the
 * channel. The backend half builds both ReadCtx backends over the REAL run state (simRunState.ts):
 * the lproxy one through makeLproxyReadCtx, whose run check is the production one, and the draw one
 * with the same check injected; they must answer alike. The consumer half runs the production memo of
 * `useIRView` with React stubbed: a Reset and a Stop re-resolve a view that reads `simActive`.
 */
import { beforeEach, describe, it, expect, vi } from 'vitest';

// ── React stub: useMemo honours its deps, effects do not run, the external store is read ──
const hooks = vi.hoisted(() => ({ slots: [] as Array<{ deps: unknown[]; value: unknown } | undefined>, i: 0 }));
const fake = vi.hoisted(() => ({ state: {} as any }));

vi.mock('react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react')>();
    return {
        ...actual,
        useMemo: (factory: () => unknown, deps: unknown[]) => {
            const k = hooks.i++;
            const prev = hooks.slots[k];
            if (prev && prev.deps.length === deps.length && prev.deps.every((d, j) => Object.is(d, deps[j]))) return prev.value;
            const value = factory();
            hooks.slots[k] = { deps, value };
            return value;
        },
        useEffect: () => {},
        useSyncExternalStore: (_subscribe: unknown, get: () => unknown) => get(),
    };
});
vi.mock('react-redux', () => ({ useSelector: (sel: (s: any) => unknown) => sel(fake.state) }));
vi.mock('../../../../../joiner', () => ({
    store: { getState: () => fake.state },
    // No L-layer in node: the lproxy backend falls back to draw on a throw, by design.
    LPointerTargetable: { fromPointer: () => { throw new Error('no L-layer in the node bench'); } },
}));

import { compileView, compileEdgeView, compileRowView, clearCompileCache, irHash } from '../irCompile';
import { makeDrawReadCtx, type ReadCtx } from '../irReadCtx';
import { makeLproxyReadCtx, makeReadCtx } from '../irReadCtxLproxy';
import { validateIR } from '../irValidate';
import { getIRIndex } from '../irResolveCore';
import { useIRView } from '../irResolve';
import { __resetSimRunsForTests, getSimRun, simClear, simReset, type SimRun } from '../../../sim/simRunState';
import type { AnyViewIR, EdgeViewIR, Predicate, RowViewIR, VertexViewIR } from '../irTypes';
import type { CompiledNet, SimState } from '../../../../../model/simulation/netTypes';

/**
 * Two M1 models of one metamodel. `ready` and `inner` (nested under ready's slot) are in M, `p1` in N;
 * the metamodel's class is in MM; `orphan` has no father; `loopA` and `loopB` father each other.
 */
function world(runs: Set<string> = new Set()) {
    const idlookup: Record<string, any> = {
        M: { id: 'M', className: 'DModel', name: 'producerConsumer' },
        N: { id: 'N', className: 'DModel', name: 'demoNet' },
        MM: { id: 'MM', className: 'DModel', name: 'DemoPetri' },
        PKG: { id: 'PKG', className: 'DPackage', name: 'demopetri', father: 'MM' },
        C_Place: { id: 'C_Place', className: 'DClass', name: 'Place', extends: [], father: 'PKG' },
        A_tokens: { id: 'A_tokens', className: 'DAttribute', name: 'tokens', father: 'C_Place' },
        ready: { id: 'ready', className: 'DObject', name: 'ready', instanceof: 'C_Place', father: 'M', features: ['v_ready'] },
        v_ready: { id: 'v_ready', className: 'DValue', instanceof: 'A_tokens', values: [1], father: 'ready' },
        inner: { id: 'inner', className: 'DObject', name: 'inner', instanceof: 'C_Place', father: 'v_ready', features: [] },
        p1: { id: 'p1', className: 'DObject', name: 'p1', instanceof: 'C_Place', father: 'N', features: [] },
        orphan: { id: 'orphan', className: 'DObject', name: 'orphan', instanceof: 'C_Place', features: [] },
        loopA: { id: 'loopA', className: 'DObject', father: 'loopB' },
        loopB: { id: 'loopB', className: 'DObject', father: 'loopA' },
    };
    return { idlookup, runs, ctx: makeDrawReadCtx(idlookup, () => false, () => undefined, (m: string) => runs.has(m)) };
}

const vertexIR = (over: Partial<VertexViewIR>): VertexViewIR => ({
    irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['Place'], shape: { form: 'circle' }, ...over,
} as VertexViewIR);
const edgeIR = (over: Partial<EdgeViewIR>): EdgeViewIR => ({
    irVersion: 'ir-1.2', kind: 'edge', metaclasses: ['Arc'], edge: {}, ...over,
} as EdgeViewIR);
const rowIR = (over: Partial<RowViewIR>): RowViewIR => ({
    irVersion: 'ir-1.0', kind: 'row', metaclasses: ['Place'], template: [{ from: 'intrinsic', prop: 'name' }], ...over,
} as RowViewIR);

const SIM_ACTIVE: Predicate = { op: 'simActive' };
const NOT_SIM_ACTIVE: Predicate = { op: 'not', arg: SIM_ACTIVE };
/** The Place view of the gallery's Petri net: one token drawn as a dot, hidden while a run shows the model. */
const placeIR = (): VertexViewIR => vertexIR({
    shape: {
        form: 'circle',
        marker: { rules: [{ when: { op: 'and', args: [{ op: 'eq', left: '$tokens.value', right: { kind: 'number', value: 1 } }, NOT_SIM_ACTIVE] }, then: 'dot' }], default: '' },
    },
});

const ALL = ['M', 'ready', 'v_ready', 'inner', 'p1', 'N', 'C_Place', 'MM', 'orphan', 'loopA', 'ghost'];

beforeEach(() => {
    clearCompileCache();
});

describe('simActive — compile, on the draw ReadCtx with an injected run check', () => {
    it('is false on every element when no run exists', () => {
        const { ctx } = world();
        const c = compileView('v-none', vertexIR({ predicate: SIM_ACTIVE }));
        expect(ALL.map(id => c.predicate(ctx, id))).toEqual(ALL.map(() => false));
    });

    it('is true on the model a run is on, its objects, a nested object and a slot; false elsewhere', () => {
        const { ctx } = world(new Set(['M']));
        const c = compileView('v-on-M', vertexIR({ predicate: SIM_ACTIVE }));
        expect(Object.fromEntries(ALL.map(id => [id, c.predicate(ctx, id)]))).toEqual({
            M: true, ready: true, v_ready: true, inner: true,
            p1: false, N: false, C_Place: false, MM: false, orphan: false, loopA: false, ghost: false,
        });
    });

    it('another model\'s run does not make it true', () => {
        const { ctx } = world(new Set(['N']));
        const c = compileView('v-on-N', vertexIR({ predicate: SIM_ACTIVE }));
        expect(c.predicate(ctx, 'ready')).toBe(false);
        expect(c.predicate(ctx, 'inner')).toBe(false);
        expect(c.predicate(ctx, 'p1')).toBe(true);
    });

    it('a run on the metamodel\'s id (never started) would not reach the M1 objects', () => {
        const { ctx } = world(new Set(['MM']));
        const c = compileView('v-on-MM', vertexIR({ predicate: SIM_ACTIVE }));
        expect(c.predicate(ctx, 'ready')).toBe(false);
        expect(c.predicate(ctx, 'C_Place')).toBe(true);
    });

    it('Stop returns it to false', () => {
        const { ctx, runs } = world();
        const c = compileView('v-stop', vertexIR({ predicate: SIM_ACTIVE }));
        runs.add('M');
        expect(c.predicate(ctx, 'ready')).toBe(true);
        runs.delete('M');
        expect(c.predicate(ctx, 'ready')).toBe(false);
    });

    it('under `not`, hides the drawn token while the run shows the model, and gives it back after', () => {
        const { ctx, runs } = world();
        const c = compileView('v-place', placeIR());
        expect(c.marker!(ctx, 'ready')).toBe('dot');
        runs.add('M');
        expect(c.marker!(ctx, 'ready')).toBe('');
        runs.delete('M');
        expect(c.marker!(ctx, 'ready')).toBe('dot');
    });

    it('a cycle of stale father links ends the walk: false, no throw', () => {
        const { ctx } = world(new Set(['M', 'N', 'MM']));
        const c = compileView('v-loop', vertexIR({ predicate: SIM_ACTIVE }));
        expect(() => c.predicate(ctx, 'loopA')).not.toThrow();
        expect(c.predicate(ctx, 'loopA')).toBe(false);
    });

    it('is false on a draw ReadCtx built without the run check, and on a ReadCtx without isRunActive', () => {
        const { idlookup } = world();
        const c = compileView('v-default', vertexIR({ predicate: SIM_ACTIVE }));
        expect(c.predicate(makeDrawReadCtx(idlookup), 'ready')).toBe(false);
        const bare: ReadCtx = { ...world(new Set(['M'])).ctx };
        delete bare.isRunActive;
        expect(c.predicate(bare, 'ready')).toBe(false);
    });

    it('declares the mark channel, and nothing in the dependency set or the cross paths', () => {
        const c = compileView('v-deps', vertexIR({ predicate: SIM_ACTIVE }));
        expect(c.channels).toEqual(['mark']);
        expect(c.dependencySet).toEqual([]);
        expect(c.crossPaths).toEqual([]);
    });

    it('declares it from an edge colour and a row visibility too', () => {
        const edge = compileEdgeView('e-ch', edgeIR({ edge: { line: { color: { when: SIM_ACTIVE, then: '#999999' } } } }));
        expect(edge.channels).toEqual(['mark']);
        const row = compileRowView('r-ch', rowIR({ visible: { when: NOT_SIM_ACTIVE, then: true, else: false } }));
        expect(row.channels).toEqual(['mark']);
    });
});

describe('simActive — validate, round trip and index', () => {
    it('validateIR accepts it alone, under not, and in a conditional', () => {
        expect(validateIR('v-ok', vertexIR({ predicate: SIM_ACTIVE }))).toEqual({ ok: true });
        clearCompileCache();
        expect(validateIR('v-ok-not', vertexIR({ predicate: NOT_SIM_ACTIVE }))).toEqual({ ok: true });
        clearCompileCache();
        expect(validateIR('v-ok-place', placeIR())).toEqual({ ok: true });
    });

    it('round-trips as JSON: equal, still valid, same irHash, same answers', () => {
        const ir = placeIR();
        const back = JSON.parse(JSON.stringify(ir)) as VertexViewIR;
        expect(back).toEqual(ir);
        expect(irHash(back)).toBe(irHash(ir));
        expect(validateIR('v-rt', back)).toEqual({ ok: true });
        clearCompileCache();
        const { ctx, runs } = world();
        const a = compileView('v-rt-a', ir), b = compileView('v-rt-b', back);
        expect(b.marker!(ctx, 'ready')).toBe(a.marker!(ctx, 'ready'));
        runs.add('M');
        expect([a.marker!(ctx, 'ready'), b.marker!(ctx, 'ready')]).toEqual(['', '']);
    });

    it('a view reading it alone puts the mark channel in the index', () => {
        const idlookup: Record<string, any> = { ...world().idlookup, V_place: { id: 'V_place', viewpoint: 'VP', ir: placeIR() } };
        const index = getIRIndex({ viewpoint: 'VP', viewelements: ['V_place'], idlookup }, 'sig-simactive-index')!;
        expect(index.channelsInUse?.has('mark')).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// The two backends and the consumer, over the real run state.
// ---------------------------------------------------------------------------

const NET: CompiledNet = {
    modelId: 'M', places: new Set(['ready']), transitions: [], bound: 1, final: null, hasEventRole: false,
    attributes: [], declared: new Map(), initial: { marking: new Map(), attrs: new Map(), presentation: new Map() }, defects: [],
};

function run(modelId: string): SimRun {
    const state: SimState = { marking: new Map(), attrs: new Map(), presentation: new Map() };
    return {
        net: { ...NET, modelId }, config: { state, event: null }, halt: null,
        guards: () => ({ kind: 'true' }), actions: () => ({ kind: 'ok', assignments: [] }),
        alphabet: [], signature: 'sig',
    };
}

describe('simActive — both backends read the run state alike', () => {
    const backends = () => {
        const { idlookup } = world();
        return {
            lproxy: makeLproxyReadCtx(idlookup),
            draw: makeDrawReadCtx(idlookup, () => false, () => undefined, (m: string) => getSimRun(m) !== undefined),
            switched: makeReadCtx(idlookup),
        };
    };
    const answers = (ctx: ReadCtx, c = compileView('v-backends', vertexIR({ predicate: SIM_ACTIVE }))) =>
        ALL.map(id => c.predicate(ctx, id));

    beforeEach(() => __resetSimRunsForTests());

    it('no run, a run on M (Reset), a run on N beside it, Stop of M, Stop of N', () => {
        const { lproxy, draw, switched } = backends();
        const seen: boolean[][] = [];
        const step = () => {
            const a = answers(lproxy);
            expect(answers(draw)).toEqual(a);
            expect(answers(switched)).toEqual(a);
            seen.push(a);
        };
        step();
        simReset('M', run('M'));
        step();
        simReset('N', run('N'));
        step();
        simClear('M');
        step();
        simClear('N');
        step();
        const at = (k: number) => Object.fromEntries(ALL.map((id, j) => [id, seen[k][j]]).filter(([, v]) => v));
        expect([0, 1, 2, 3, 4].map(at)).toEqual([
            {},
            { M: true, ready: true, v_ready: true, inner: true },
            { M: true, ready: true, v_ready: true, inner: true, p1: true, N: true },
            { p1: true, N: true },
            {},
        ]);
    });
});

describe('simActive — useIRView re-resolves at Reset and at Stop (consumer test, R-MK-5 addendum)', () => {
    const render = () => { hooks.i = 0; return useIRView('vx1', 'C_Place'); };
    const stateWith = (ir: AnyViewIR) => ({
        viewpoint: 'VP', viewelements: ['V_place'],
        idlookup: { ...world().idlookup, vx1: { id: 'vx1', model: 'ready' }, V_place: { id: 'V_place', viewpoint: 'VP', ir } },
    });

    beforeEach(() => {
        hooks.slots = [];
        __resetSimRunsForTests();
    });

    it('the drawn token: shown before the run, hidden during it, shown again after Stop', () => {
        fake.state = stateWith(placeIR());
        const r1 = render()!;
        expect(r1).not.toBeNull();
        expect(r1.compiled.marker!(r1.readCtx, 'ready')).toBe('dot');
        simReset('M', run('M'));
        const r2 = render()!;
        expect(r2).not.toBe(r1);
        expect(r2.compiled.marker!(r2.readCtx, 'ready')).toBe('');
        simClear('M');
        const r3 = render()!;
        expect(r3).not.toBe(r2);
        expect(r3.compiled.marker!(r3.readCtx, 'ready')).toBe('dot');
    });

    it('another model\'s run leaves the token drawn', () => {
        fake.state = stateWith(placeIR());
        simReset('N', run('N'));
        const r = render()!;
        expect(r.compiled.marker!(r.readCtx, 'ready')).toBe('dot');
    });
});
