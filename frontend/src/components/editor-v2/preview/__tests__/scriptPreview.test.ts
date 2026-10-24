/**
 * Ghost preview (S4b, R-JJD-2): the synthetic elements built from a plan, and the preview store.
 *
 * Plain fixtures only: a plan read by the planner against a small `PlanWorld`, the boxes of the
 * drawn nodes, and a D-layer `idlookup` for the store.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import type { Node } from '@xyflow/react';
import { planEffects, type PlanWorld } from '../../../../jjscript/executor/effectsPlanner';
import {
    PREVIEW_ID_PREFIX,
    PREVIEW_NODE_HEIGHT,
    appendPreview,
    buildPreviewElements,
    drawnNodes,
    isPreviewId,
    type DrawnNode,
} from '../previewElements';
import {
    clearScriptPreview,
    getScriptPreview,
    isPreviewStale,
    requestScriptPreview,
    setScriptPreviewApplying,
    subscribeScriptPreview,
} from '../scriptPreviewStore';

function world(): PlanWorld {
    return {
        classes: {
            Machine: {
                name: 'Machine', kinds: ['Machine'], attributes: [{ name: 'name', upper: 1 }],
                references: [{ name: 'states', containment: true, upper: -1, type: 'State' }],
            },
            State: {
                name: 'State', kinds: ['State'], attributes: [{ name: 'name', upper: 1 }],
                references: [
                    { name: 'next', containment: false, upper: 1, type: 'State', opposite: 'prev' },
                    { name: 'prev', containment: false, upper: 1, type: 'State', opposite: 'next' },
                ],
            },
        },
        elements: [
            { id: 'o1', name: 'M', className: 'Machine', root: true, references: { states: ['o2'] } },
            { id: 'o2', name: 'Idle', className: 'State', root: false, container: { owner: 'o1', feature: 'states' } },
        ],
    };
}

const drawn: DrawnNode[] = [
    { nodeId: 'v1', elementId: 'o1', x: 100, y: 40, width: 200, height: 120, nested: false },
    { nodeId: 'v2', elementId: 'o2', x: 400, y: 300, width: 150, height: 60, nested: false },
    // A nested node: relative position, ignored by the placement.
    { nodeId: 'v3', elementId: 'o9', x: 5000, y: -5000, width: 10, height: 10, nested: true },
];

describe('buildPreviewElements', () => {
    it('draws one prefixed, inert node per planned creation, in a column right of the drawn nodes', async () => {
        const plan = await planEffects('create instance of State "A" in M.states\ncreate instance of State "B" in M.states', world());
        const { nodes } = buildPreviewElements(plan, world(), drawn);
        expect(nodes.map((n) => n.id)).toEqual([`${PREVIEW_ID_PREFIX}planned:1`, `${PREVIEW_ID_PREFIX}planned:2`]);
        expect(nodes.every((n) => isPreviewId(n.id))).toBe(true);
        // Column: right of the widest drawn right edge (400 + 150) plus the gap; top of the drawn nodes.
        expect(nodes[0].position).toEqual({ x: 630, y: 40 });
        expect(nodes[1].position.x).toBe(630);
        expect(nodes[1].position.y).toBeGreaterThanOrEqual(40 + PREVIEW_NODE_HEIGHT);
        for (const n of nodes) {
            expect(n).toMatchObject({ draggable: false, selectable: false, deletable: false, connectable: false, focusable: false });
            expect(n.className).toBe('jj-preview-node');
        }
        expect(nodes[0].data).toEqual({ label: 'A : State' });
    });

    it('does not overlap any drawn top-level node', async () => {
        const plan = await planEffects('create instance of State "A"\ncreate instance of State "B"\ncreate instance of State "C"', world());
        const { nodes } = buildPreviewElements(plan, world(), drawn);
        for (const n of nodes) {
            for (const d of drawn.filter((x) => !x.nested)) {
                const apart = n.position.x >= d.x + d.width || n.position.x + (n.width as number) <= d.x
                    || n.position.y >= d.y + d.height || n.position.y + (n.height as number) <= d.y;
                expect(apart).toBe(true);
            }
        }
    });

    it('starts at the origin on an empty canvas', async () => {
        const plan = await planEffects('create instance of State "A"', world());
        expect(buildPreviewElements(plan, world(), []).nodes[0].position).toEqual({ x: 0, y: 0 });
    });

    it('draws the containment of a create and the reference writes, dashed and inert, to drawn or planned nodes', async () => {
        const plan = await planEffects([
            'create instance of State "A" in M.states',
            'set A.next = Idle',
            'set Idle.next = A',
        ].join('\n'), world());
        const { edges } = buildPreviewElements(plan, world(), drawn);
        const a = `${PREVIEW_ID_PREFIX}planned:1`;
        expect(edges.map((e) => [e.source, e.target, e.label])).toEqual([
            ['v1', a, 'states'],
            [a, 'v2', 'next'],
            ['v2', a, 'next'],
        ]);
        expect(edges[0].className).toBe('jj-preview-edge jj-preview-edge--containment');
        expect(edges[1].className).toBe('jj-preview-edge');
        for (const e of edges) {
            expect(isPreviewId(e.id)).toBe(true);
            expect(e).toMatchObject({ selectable: false, deletable: false, reconnectable: false, focusable: false });
        }
    });

    it('skips an edge whose end is not drawn', async () => {
        const plan = await planEffects('create instance of State "A"\nset A.next = Idle', world());
        const { edges } = buildPreviewElements(plan, world(), drawn.filter((d) => d.elementId !== 'o2'));
        expect(edges).toEqual([]);
    });

    it('marks the planned element a warning names, and only it', async () => {
        // `set A.next = Idle` writes one end of the next/prev pair: OPPOSITE_ONE_END on line 3.
        const plan = await planEffects('create instance of State "A"\ncreate instance of State "B"\nset A.next = Idle', world());
        expect(plan.warnings.map((w) => [w.code, w.line])).toEqual([['OPPOSITE_ONE_END', 3]]);
        const { nodes } = buildPreviewElements(plan, world(), drawn);
        expect(nodes.map((n) => n.className)).toEqual(['jj-preview-node jj-preview-node--warning', 'jj-preview-node']);
    });

    it('marks the owner a warned line writes when the line plans no effect (unknown feature, unresolvable target)', async () => {
        const script = [
            'create instance of State "A"',
            'create instance of State "B"',
            'create instance of State "C"',
            '',
            'set B.zzNoSuchFeature = 1',
            'remove Nobody from C.next',
        ].join('\n');
        const plan = await planEffects(script, world());
        expect(plan.warnings.map((w) => [w.code, w.line])).toEqual([['UNKNOWN_PROPERTY', 5], ['INSTANCE_NOT_FOUND', 6]]);
        expect(plan.features).toEqual([]);
        expect(plan.references).toEqual([]);
        const marked = (s?: string) => buildPreviewElements(plan, world(), drawn, s).nodes.map((n) => !!n.className?.includes('--warning'));
        // The blank line keeps the numbering: line 5 is `set B…`, line 6 is `remove … from C.next`.
        expect(marked(script)).toEqual([false, true, true]);
        // Without the script the lines cannot be read: no marker.
        expect(marked()).toEqual([false, false, false]);
    });

    it('draws nothing for a plan without creations or links', async () => {
        const plan = await planEffects('set Idle.name = "Off"', world());
        expect(buildPreviewElements(plan, world(), drawn)).toEqual({ nodes: [], edges: [] });
    });
});

describe('appendPreview and drawnNodes', () => {
    it('returns the base itself when there is nothing to add, a concatenation otherwise', () => {
        const base = { nodes: [{ id: 'v1' } as Node], edges: [] };
        expect(appendPreview(base, null)).toBe(base);
        expect(appendPreview(base, { nodes: [], edges: [] })).toBe(base);
        const out = appendPreview(base, { nodes: [{ id: 'jjpreview:x' } as Node], edges: [] });
        expect(out.nodes.map((n) => n.id)).toEqual(['v1', 'jjpreview:x']);
        expect(base.nodes).toHaveLength(1);
    });

    it('reads the boxes of the visible nodes, preview and hidden left out', () => {
        const nodes = [
            { id: 'v1', position: { x: 1, y: 2 }, measured: { width: 30, height: 40 }, data: {} },
            { id: 'v2', position: { x: 0, y: 0 }, hidden: true, data: {} },
            { id: 'jjpreview:planned:1', position: { x: 0, y: 0 }, data: {} },
            { id: 'v4', position: { x: 3, y: 4 }, parentId: 'v1', width: 10, height: 20, data: {} },
        ] as Node[];
        expect(drawnNodes(nodes, (id) => (id === 'v1' ? 'o1' : undefined))).toEqual([
            { nodeId: 'v1', elementId: 'o1', x: 1, y: 2, width: 30, height: 40, nested: false },
            { nodeId: 'v4', elementId: 'v4', x: 3, y: 4, width: 10, height: 20, nested: true },
        ]);
    });
});

/** The D-layer of a model with one root machine `M` of metaclass Machine. */
function idlookup(): Record<string, any> {
    return {
        mm: { id: 'mm', className: 'DModel' },
        pkg: { id: 'pkg', className: 'DPackage', father: 'mm' },
        cMachine: { id: 'cMachine', className: 'DClass', name: 'Machine', father: 'pkg', attributes: [], references: [] },
        m: { id: 'm', className: 'DModel', instanceof: 'mm' },
        o1: { id: 'o1', className: 'DObject', instanceof: 'cMachine', father: 'm', name: 'M', features: [] },
    };
}

describe('scriptPreviewStore', () => {
    beforeEach(() => clearScriptPreview());

    it('plans a request into the preview and notifies', async () => {
        let calls = 0;
        const off = subscribeScriptPreview(() => { calls++; });
        const p = await requestScriptPreview({ script: 'create instance of Machine "N"', modelId: 'm' }, idlookup());
        off();
        expect(p).toBe(getScriptPreview());
        expect(p).toMatchObject({ modelId: 'm', applying: false });
        expect(p!.plan.created.map((c) => c.name)).toEqual(['N']);
        expect(calls).toBe(1);
    });

    it('clears on an empty script, on clear, and only for its own model when one is named', async () => {
        await requestScriptPreview({ script: 'create instance of Machine', modelId: 'm' }, idlookup());
        clearScriptPreview('other');
        expect(getScriptPreview()).not.toBeNull();
        clearScriptPreview('m');
        expect(getScriptPreview()).toBeNull();
        await requestScriptPreview({ script: 'create instance of Machine', modelId: 'm' }, idlookup());
        await requestScriptPreview({ script: '  ', modelId: 'm' }, idlookup());
        expect(getScriptPreview()).toBeNull();
    });

    it('drops the plan of a request superseded while it was planning', async () => {
        const first = requestScriptPreview({ script: 'create instance of Machine "First"', modelId: 'm' }, idlookup());
        const second = requestScriptPreview({ script: 'create instance of Machine "Second"', modelId: 'm' }, idlookup());
        expect(await first).toBeNull();
        expect((await second)!.plan.created[0].name).toBe('Second');
        expect(getScriptPreview()!.plan.created[0].name).toBe('Second');
    });

    it('is stale when the model changes, the model goes, but not while applying', async () => {
        const lookup = idlookup();
        const p = (await requestScriptPreview({ script: 'create instance of Machine', modelId: 'm' }, lookup))!;
        expect(isPreviewStale(p, lookup)).toBe(false);
        // A vertex move or any change outside the model's world is not a model change.
        expect(isPreviewStale(p, { ...lookup, v1: { id: 'v1', className: 'DVertex', x: 10 } })).toBe(false);
        const renamed = { ...lookup, o1: { ...lookup.o1, name: 'M2' } };
        expect(isPreviewStale(p, renamed)).toBe(true);
        const { m, ...gone } = lookup;
        expect(isPreviewStale(p, gone)).toBe(true);
        setScriptPreviewApplying(true);
        expect(isPreviewStale(getScriptPreview()!, renamed)).toBe(false);
    });
});
