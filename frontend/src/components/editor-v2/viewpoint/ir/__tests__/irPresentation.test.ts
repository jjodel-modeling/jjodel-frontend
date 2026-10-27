/**
 * `node.[x]` read by IR views (R-SIM-108, interpreter side, P-2026-10-03-0121).
 *
 * The compile half runs on the draw ReadCtx with an injected presentation reader, as
 * irMarked.test.ts injects the marking: the tests are about the accessor and the channel,
 * not about the run-state singleton. The consumer half runs the production memo of
 * `useIRView` (irResolve.ts) with React stubbed, the joiner replaced by a store over a
 * hand-built lookup, and the REAL run state (simRunState.ts): a Reset is the bump a Step
 * makes, and `getSimPresentation` reaches the view through `makeReadCtx`. It asserts the
 * consumption, not the deposit (R-MK-5's addendum).
 *
 * The golden shapes of the views without `node.[x]` were captured on the tree before this
 * lane (`98c0ec37c`): dependency set, cross paths, key order, `channels` absent, irHash.
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
import { makeDrawReadCtx } from '../irReadCtx';
import { validateIR } from '../irValidate';
import { getIRIndex } from '../irResolveCore';
import { labelPathFeature } from '../irLabelEdit';
import { useIRView } from '../irResolve';
import { __resetSimRunsForTests, simClear, simReset, type SimRun } from '../../../sim/simRunState';
import type { AnyViewIR, EdgeViewIR, RowViewIR, VertexViewIR } from '../irTypes';
import type { CompiledNet, SimState, SimValue } from '../../../../../model/simulation/netTypes';

/** o1 has a `name` slot; o2 has none. */
function world(presentation: Record<string, Record<string, unknown>> = {}) {
    const idlookup: Record<string, any> = {
        C_State: { id: 'C_State', name: 'State', extends: [] },
        A_name: { id: 'A_name', name: 'name' },
        o1: { id: 'o1', name: 'obj_o1', instanceof: 'C_State', features: ['v1name'] },
        v1name: { id: 'v1name', instanceof: 'A_name', values: ['Idle'] },
        o2: { id: 'o2', name: 'obj_o2', instanceof: 'C_State', features: [] },
    };
    const reader = (id: string, attr: string) => presentation[id]?.[attr];
    return { idlookup, presentation, ctx: makeDrawReadCtx(idlookup, () => false, reader) };
}

const vertexIR = (over: Partial<VertexViewIR>): VertexViewIR => ({
    irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['State'], shape: { form: 'rect' }, ...over,
} as VertexViewIR);
const edgeIR = (over: Partial<EdgeViewIR>): EdgeViewIR => ({
    irVersion: 'ir-1.2', kind: 'edge', metaclasses: ['Transition'], edge: {}, ...over,
} as EdgeViewIR);
const rowIR = (over: Partial<RowViewIR>): RowViewIR => ({
    irVersion: 'ir-1.0', kind: 'row', metaclasses: ['State'], template: [{ from: 'intrinsic', prop: 'name' }], ...over,
} as RowViewIR);
const heatLabel = (expr = 'node.[heat]') => vertexIR({
    shape: { form: 'rect', labels: [{ position: 'center', source: { from: 'path', expr } }] },
});

beforeEach(() => {
    clearCompileCache();
});

describe('compile — node.[x] reads the injected presentation (R-SIM-108)', () => {
    it('a node label reads the value, and absent is undefined', () => {
        const { ctx } = world({ o1: { heat: 3 } });
        const c = compileView('v-label', heatLabel());
        expect(c.labels[0].text(ctx, 'o1')).toBe(3);
        expect(c.labels[0].text(ctx, 'o2')).toBeUndefined();
    });

    it('declares the mark channel, and no feature and no cross path (stray featureNames entry)', () => {
        const c = compileView('v-label-deps', heatLabel());
        expect(c.channels).toEqual(['mark']);
        expect(c.dependencySet).toEqual([]);
        expect(c.crossPaths).toEqual([]);
    });

    it('beside a feature path, only the feature enters the dependency set', () => {
        const c = compileView('v-mixed', vertexIR({
            shape: { form: 'rect', labels: [
                { position: 'center', source: { from: 'path', expr: '$name.value' } },
                { position: 'outside', source: { from: 'path', expr: 'node.[heat]' } },
            ] },
        }));
        expect(c.dependencySet).toEqual(['name']);
        expect(c.channels).toEqual(['mark']);
    });

    it('exists is true on a value, false when absent', () => {
        const { ctx } = world({ o1: { heat: 0 } });
        const c = compileView('v-exists', vertexIR({ predicate: { op: 'exists', path: 'node.[heat]' } }));
        expect(c.predicate(ctx, 'o1')).toBe(true);
        expect(c.predicate(ctx, 'o2')).toBe(false);
        expect(c.channels).toEqual(['mark']);
    });

    it('gt compares the value, and is false when absent', () => {
        const { ctx } = world({ o1: { heat: 3 }, o2: { heat: 1 } });
        const c = compileView('v-gt', vertexIR({
            shape: { form: 'rect', fill: { when: { op: 'gt', left: 'node.[heat]', right: { kind: 'number', value: 2 } }, then: '#ef4444', else: '#ffffff' } },
        }));
        expect(c.fill!(ctx, 'o1')).toBe('#ef4444');
        expect(c.fill!(ctx, 'o2')).toBe('#ffffff');
        expect(c.fill!(world().ctx, 'o1')).toBe('#ffffff');
        expect(c.dependencySet).toEqual([]);
        expect(c.channels).toEqual(['mark']);
    });

    it('an edge template shows the value, and drops its caption when absent', () => {
        const { ctx } = world({ o1: { heat: 3 } });
        const c = compileEdgeView('e-template', edgeIR({
            edge: { labels: { template: [{ from: 'literal', text: 'heat = ' }, { from: 'path', expr: 'node.[heat]' }] } },
        }));
        expect(c.labelText!(ctx, 'o1')).toBe('heat = 3');
        expect(c.labelText!(ctx, 'o2')).toBe('');
        expect(c.dependencySet).toEqual([]);
        expect(c.crossPaths).toEqual([]);
        expect(c.channels).toEqual(['mark']);
    });

    it('a row segment reads the value', () => {
        const { ctx } = world({ o1: { heat: 'hot' } });
        const c = compileRowView('r-seg', rowIR({ template: [{ from: 'path', expr: 'node.[heat]' }] }));
        expect(c.template[0](ctx, 'o1')).toBe('hot');
        expect(c.dependencySet).toEqual([]);
        expect(c.channels).toEqual(['mark']);
    });

    it('reads undefined on a draw ReadCtx built without a reader (the default)', () => {
        const { idlookup } = world();
        const c = compileView('v-default', heatLabel());
        const ctx = makeDrawReadCtx(idlookup);
        expect(() => c.labels[0].text(ctx, 'o1')).not.toThrow();
        expect(c.labels[0].text(ctx, 'o1')).toBeUndefined();
    });

    it('compiles and validates as a well-formed view', () => {
        expect(validateIR('v-valid', heatLabel())).toEqual({ ok: true });
    });
});

describe('compile — what keeps refusing node.[x]', () => {
    it('an edge endpoint refuses it with a message of its own (endpoint accepted)', () => {
        const ir = edgeIR({ edge: { source: 'node.[heat]', target: '$tgt.value' } });
        expect(() => compileEdgeView('e-endpoint', ir)).toThrow('[ir] node.[heat] is a presentation value, not an edge endpoint');
        const target = edgeIR({ edge: { source: '$src.value', target: 'node.[heat]' } });
        expect(() => compileEdgeView('e-endpoint-t', target)).toThrow('not an edge endpoint');
        const v = validateIR('e-endpoint', ir);
        expect(v.ok).toBe(false);
        expect(v.ok ? '' : v.error).toContain('not an edge endpoint');
    });

    it('marked.path keeps today\'s error', () => {
        expect(() => compileView('v-marked-path', vertexIR({ predicate: { op: 'marked', path: 'node.[heat]' } })))
            .toThrow('[ir] invalid PathExpr step "node" in node.[heat]');
    });

    it('isKind.path keeps today\'s error', () => {
        expect(() => compileView('v-iskind-path', vertexIR({ predicate: { op: 'isKind', class: 'State', path: 'node.[heat]' } })))
            .toThrow('[ir] invalid PathExpr step "node" in node.[heat]');
    });

    it('a node.[x] label is not editable: labelPathFeature is null, no editsFeature key', () => {
        expect(labelPathFeature({ from: 'path', expr: 'node.[heat]' })).toBeNull();
        const c = compileView('v-edit', vertexIR({
            shape: { form: 'rect', labels: [{ position: 'center', editable: true, source: { from: 'path', expr: 'node.[heat]' } }] },
        } as Partial<VertexViewIR>));
        expect('editsFeature' in c.labels[0]).toBe(false);
    });
});

describe('compile — a view without node.[x] keeps its shape (golden, captured before the lane)', () => {
    const GOLDEN: { name: string; ir: AnyViewIR; hash: string; keys: string[]; json: string }[] = [
        {
            name: 'G_vertex',
            // Written out, not through vertexIR: the key order is part of what irHash hashes.
            ir: ({
                irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['State'],
                predicate: { op: 'and', args: [{ op: 'isKind', class: 'State' }, { op: 'exists', path: '$name.value' }] },
                shape: {
                    form: 'rect',
                    fill: { when: { op: 'gt', left: '$count.value', right: { kind: 'number', value: 2 } }, then: '#ff0000', else: '#00ff00' },
                    labels: [
                        { position: 'center', source: { from: 'path', expr: '$name.value' } },
                        { position: 'outside', anchor: 'n', source: { from: 'intrinsic', prop: 'name' } },
                        { position: 'center', source: { from: 'literal', text: 'hi' } },
                    ],
                    badges: [{ icon: 'star', position: 'top-right', visible: { when: { op: 'empty', path: '$tags.values' }, then: false, else: true } }],
                },
                fieldCompartments: [{ id: 'attrs', source: { from: 'attributes' }, rowFormat: { segments: [{ kind: 'name' }] } }],
            } as unknown as VertexViewIR),
            hash: '1007167488',
            keys: ['viewId', 'ir', 'kind', 'containment', 'priority', 'predicate', 'dependencySet', 'crossPaths', 'formSpec', 'form', 'fill', 'borderColor', 'borderWidth', 'borderStyle', 'cornerRadius', 'marker', 'padding', 'text', 'labels', 'badges', 'fieldCompartments'],
            json: '{"viewId":"G_vertex","kind":"vertex","containment":null,"priority":0,"dependencySet":["name","count","tags"],"crossPaths":[],"formSpec":null,"borderColor":null,"borderWidth":null,"borderStyle":null,"cornerRadius":null,"marker":null,"padding":"normal","labels":[{"position":"center","editsName":false},{"position":"outside","editsName":true,"anchor":"n"},{"position":"center","editsName":false}],"badges":[{"position":"top-right"}],"fieldCompartments":[{"id":"attrs","source":"attributes","segments":[{"kind":"name"}],"separator":true}]}',
        },
        {
            name: 'G_cross_marked',
            ir: vertexIR({
                shape: {
                    form: 'rect',
                    fill: { when: { op: 'marked' }, then: '#ef4444', else: '#ffffff' },
                    labels: [{ position: 'center', source: { from: 'path', expr: '$owner.value.$name.value' } }],
                },
            }),
            hash: '1156963485',
            keys: ['viewId', 'ir', 'kind', 'containment', 'priority', 'predicate', 'dependencySet', 'channels', 'crossPaths', 'formSpec', 'form', 'fill', 'borderColor', 'borderWidth', 'borderStyle', 'cornerRadius', 'marker', 'padding', 'text', 'labels', 'badges', 'fieldCompartments'],
            json: '{"viewId":"G_cross_marked","kind":"vertex","containment":null,"priority":0,"dependencySet":["owner","name"],"channels":["mark"],"crossPaths":[{"hops":[{"feature":"owner","take":"value"}],"terminal":{"feature":"name","take":"value"}}],"formSpec":null,"borderColor":null,"borderWidth":null,"borderStyle":null,"cornerRadius":null,"marker":null,"padding":"normal","labels":[{"position":"center","editsName":false}],"badges":[],"fieldCompartments":[]}',
        },
        {
            name: 'G_edge',
            ir: edgeIR({
                edge: {
                    source: '$src.value', target: '$tgt.value',
                    line: { color: { when: { op: 'eq', left: '$kind.value', right: { kind: 'string', value: 'x' } }, then: '#000', else: '#999' } },
                    labels: { template: [{ from: 'literal', text: 'w = ' }, { from: 'path', expr: '$weight.value' }] },
                },
            }),
            hash: '-2036440749',
            keys: ['viewId', 'ir', 'priority', 'predicate', 'dependencySet', 'crossPaths', 'reference', 'isObjectAsEdge', 'sourceExpr', 'targetExpr', 'sourceIsContainer', 'targetIsContainer', 'lineColor', 'lineWidth', 'lineStyle', 'terminations', 'routing', 'labelText', 'labelPlacement', 'persistWaypoints'],
            json: '{"viewId":"G_edge","priority":0,"dependencySet":["src","tgt","kind","weight"],"crossPaths":[],"reference":null,"isObjectAsEdge":true,"sourceIsContainer":false,"targetIsContainer":false,"lineWidth":null,"lineStyle":null,"terminations":{"sourceEnd":"none","targetEnd":"openArrow"},"routing":null,"labelPlacement":"auto","persistWaypoints":true}',
        },
        {
            name: 'G_row',
            ir: rowIR({ template: [{ from: 'path', expr: '$name.value' }, { from: 'literal', text: ' : ' }, { from: 'path', expr: '$type.value' }] }),
            hash: '-1549819826',
            keys: ['viewId', 'ir', 'kind', 'priority', 'predicate', 'dependencySet', 'crossPaths', 'template', 'visible', 'style'],
            json: '{"viewId":"G_row","kind":"row","priority":0,"dependencySet":["name","type"],"crossPaths":[],"template":[null,null,null]}',
        },
    ];

    const compileAny = (name: string, ir: AnyViewIR): any =>
        ir.kind === 'edge' ? compileEdgeView(name, ir) : ir.kind === 'row' ? compileRowView(name, ir) : compileView(name, ir as VertexViewIR);

    for (const g of GOLDEN) {
        it(`${g.name}: same keys, same JSON, same irHash`, () => {
            const c = compileAny(g.name, g.ir);
            expect(Object.keys(c)).toEqual(g.keys);
            expect(JSON.stringify({ ...c, ir: undefined })).toBe(g.json);
            expect(irHash(g.ir)).toBe(g.hash);
        });
    }
});

// ---------------------------------------------------------------------------
// The consumption: the index exposes the channel, and the production memo re-runs.
// ---------------------------------------------------------------------------

function stateWith(views: { id: string; ir: AnyViewIR }[]) {
    const idlookup: Record<string, any> = { ...world().idlookup, vx1: { id: 'vx1', model: 'o1' } };
    const viewelements: string[] = [];
    for (const v of views) {
        idlookup[v.id] = { id: v.id, viewpoint: 'VP', ir: v.ir };
        viewelements.push(v.id);
    }
    return { viewpoint: 'VP', viewelements, idlookup };
}

describe('channelsInUse — node.[x] alone declares the channel for the index', () => {
    it('from a node label, an edge template or a row segment', () => {
        const cases: [string, AnyViewIR][] = [
            ['V_heat', heatLabel()],
            ['E_heat', edgeIR({ edge: { labels: { template: [{ from: 'path', expr: 'node.[heat]' }] } } })],
            ['R_heat', rowIR({ template: [{ from: 'path', expr: 'node.[heat]' }] })],
        ];
        for (const [id, ir] of cases) {
            clearCompileCache();
            const index = getIRIndex(stateWith([{ id, ir }]), `sig-pres-${id}`)!;
            expect([id, index.channelsInUse?.has('mark')]).toEqual([id, true]);
        }
    });
});

const NET: CompiledNet = {
    modelId: 'M', places: new Set(['o1']), transitions: [], bound: 1, final: null, hasEventRole: false,
    attributes: [], declared: new Map(), initial: { marking: new Map(), attrs: new Map(), presentation: new Map() }, defects: [],
};

function runWith(presentation: Record<string, Record<string, SimValue>>): SimRun {
    const state: SimState = {
        marking: new Map(),
        attrs: new Map(),
        presentation: new Map(Object.entries(presentation).map(([id, a]) => [id, new Map(Object.entries(a))])),
    };
    return {
        net: NET, config: { state, event: null }, halt: null,
        guards: () => ({ kind: 'true' }), actions: () => ({ kind: 'ok', assignments: [] }),
        alphabet: [], signature: 'sig',
    };
}

describe('useIRView — the resolver memo and the mark bump (consumer test, R-MK-5 addendum)', () => {
    const render = () => { hooks.i = 0; return useIRView('vx1', 'C_State'); };

    beforeEach(() => {
        hooks.slots = [];
        __resetSimRunsForTests();
    });

    it('re-resolves on a bump when the view reads node.[x], and the label shows the run\'s value', () => {
        fake.state = stateWith([{ id: 'V_heat', ir: heatLabel() }]);
        simReset('M', runWith({ o1: { heat: 3 } }));
        const r1 = render()!;
        expect(r1).not.toBeNull();
        expect(r1.compiled.labels[0].text(r1.readCtx, 'o1')).toBe(3);
        simReset('M', runWith({ o1: { heat: 4 } }));
        const r2 = render()!;
        expect(r2).not.toBe(r1);
        expect(r2.compiled.labels[0].text(r2.readCtx, 'o1')).toBe(4);
    });

    it('keeps the resolution across a bump when no view reads node.[x] or marked (restrictive clause)', () => {
        fake.state = stateWith([{ id: 'V_name', ir: heatLabel('$name.value') }]);
        simReset('M', runWith({ o1: { heat: 3 } }));
        const r1 = render()!;
        expect(r1).not.toBeNull();
        simReset('M', runWith({ o1: { heat: 4 } }));
        expect(render()).toBe(r1);
    });

    it('reads through the ReadCtx makeReadCtx builds: the run\'s value, then undefined after Stop', () => {
        fake.state = stateWith([{ id: 'V_heat', ir: heatLabel() }]);
        simReset('M', runWith({ o1: { heat: 'hot' } }));
        const r = render()!;
        expect(r.readCtx.getPresentation?.('o1', 'heat')).toBe('hot');
        expect(r.readCtx.getPresentation?.('o2', 'heat')).toBeUndefined();
        simClear('M');
        expect(render()!.compiled.labels[0].text(r.readCtx, 'o1')).toBeUndefined();
    });
});
