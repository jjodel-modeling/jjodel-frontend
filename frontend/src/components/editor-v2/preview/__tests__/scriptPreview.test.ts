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
    PREVIEW_ROW_HEIGHT,
    appendPreview,
    buildPreviewElements,
    drawnNodes,
    isPreviewId,
    type DrawnNode,
} from '../previewElements';
import {
    clearOwnedScriptPreview,
    clearScriptPreview,
    getScriptPreview,
    publishScriptPreview,
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
        const read = drawnNodes(nodes, (id) => (id === 'v1' ? 'o1' : undefined));
        // No DOM behind a bare node: a row is not on screen.
        expect(read.map((d) => d.rowOf?.('name'))).toEqual([null, null]);
        expect(read.map(({ rowOf, ...box }) => box)).toEqual([
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

    it('publishes an owned plan without planning again, superseding a request in flight (P-2026-10-25-0020)', async () => {
        const plan = await planEffects('create instance of Machine "Own"', world());
        const inFlight = requestScriptPreview({ script: 'create instance of Machine "Other"', modelId: 'm' }, idlookup());
        const p = publishScriptPreview({ script: 'x', modelId: 'm', world: world(), plan, owner: 'tab1' });
        expect(await inFlight).toBeNull();
        expect(getScriptPreview()).toBe(p);
        expect(p).toMatchObject({ owner: 'tab1', applying: false, modelId: 'm' });
        expect(p.plan).toBe(plan);
    });

    it('an owner clears only its own preview; a request carries its owner (P-2026-10-25-0020)', async () => {
        await requestScriptPreview({ script: 'create instance of Machine', modelId: 'm' }, idlookup());
        expect(getScriptPreview()!.owner).toBeUndefined();
        clearOwnedScriptPreview('tab1');
        expect(getScriptPreview()).not.toBeNull();
        await requestScriptPreview({ script: 'create instance of Machine', modelId: 'm', owner: 'tab2' }, idlookup());
        clearOwnedScriptPreview('tab1');
        expect(getScriptPreview()!.owner).toBe('tab2');
        clearOwnedScriptPreview('tab2');
        expect(getScriptPreview()).toBeNull();
    });
});

/** A metamodel with a package, a class `Person` and an enum `Color`, drawn as two class/enum nodes. */
function m2world(): PlanWorld {
    return {
        level: 'M2',
        classes: {},
        elements: [],
        m2: {
            id: 'mm', name: 'MM', defaultParent: 'pkg',
            elements: [
                { id: 'pkg', name: 'mmpkg', kind: 'Package', father: 'mm' },
                { id: 'cPerson', name: 'Person', kind: 'Class', father: 'pkg', abstract: false, extends: [] },
                { id: 'eColor', name: 'Color', kind: 'Enumeration', father: 'pkg' },
            ],
        },
    };
}
const m2drawn: DrawnNode[] = [
    { nodeId: 'vPerson', elementId: 'cPerson', x: 0, y: 0, width: 200, height: 100, nested: false },
    { nodeId: 'vColor', elementId: 'eColor', x: 0, y: 200, width: 200, height: 80, nested: false },
];

describe('buildPreviewElements on M2 (P-2026-10-24-1600)', () => {
    const script = [
        'create class Animal',
        'create class Dog extends Animal',
        'create attribute legs in Dog type EInt',
        'create reference owner in Dog type Person',
        'create enumeration Size',
        'create literal SMALL in Size',
        'create attribute nick in Person',
        'create containment pets in Person type Dog',
    ].join('\n');

    it('a ghost node per planned class and enumeration, with its planned rows, beside what it relates to', async () => {
        const plan = await planEffects(script, m2world());
        expect(plan.errors).toEqual([]);
        const { nodes } = buildPreviewElements(plan, m2world(), m2drawn);
        const byLabel = nodes.map((n) => (n.data as any).label);
        // P-2026-10-25-0110: the rows added to Person are a compartment under Person, placed first.
        expect(byLabel).toEqual([
            '+ nick : EString\n+ \u25C6 pets \u2192 Dog',
            'class Animal',
            'class Dog\nlegs : EInt\nowner \u2192 Person',
            'enumeration Size\nSMALL',
        ]);
        expect(nodes.every((n) => isPreviewId(n.id))).toBe(true);
        expect(nodes[2].height).toBe(PREVIEW_NODE_HEIGHT + 2 * PREVIEW_ROW_HEIGHT);
        // Person's compartment flush under Person (same x and width, top at its bottom, no gap); Animal
        // relates to nothing drawn, so the column right of the drawn nodes; Dog right of the Animal it extends;
        // Size below Animal in the column.
        expect(nodes.map((n) => [n.position.x, n.position.y])).toEqual([[0, 100], [280, 0], [540, 0], [280, 72]]);
        expect([nodes[0].width, nodes[0].height]).toEqual([200, 2 * PREVIEW_ROW_HEIGHT + 8]);
        expect(nodes[0].className).toBe('jj-preview-node jj-preview-compartment');
        for (const n of nodes.slice(1)) expect(n).toMatchObject({ draggable: false, selectable: false, className: 'jj-preview-node', style: { whiteSpace: 'pre-line' } });
    });

    it('dashed ghost edges for the rows of an existing class, the references and the generalizations', async () => {
        const plan = await planEffects(script, m2world());
        const { edges } = buildPreviewElements(plan, m2world(), m2drawn);
        // The rows of an existing class are a compartment flush under it: no edge joins them.
        expect(edges.map((e) => [e.source, e.target, e.label, e.className])).toEqual([
            [`${PREVIEW_ID_PREFIX}planned:2`, 'vPerson', 'owner', 'jj-preview-edge'],
            ['vPerson', `${PREVIEW_ID_PREFIX}planned:2`, 'pets', 'jj-preview-edge jj-preview-edge--containment'],
            [`${PREVIEW_ID_PREFIX}planned:2`, `${PREVIEW_ID_PREFIX}planned:1`, 'extends', 'jj-preview-edge'],
        ]);
        // P-2026-10-25-1005: every end has a box, so each edge takes its orthogonal route; only the
        // generalization carries the triangle.
        expect(edges.map((e) => [e.type, (e.data as any)?.generalization])).toEqual([['preview', false], ['preview', false], ['preview', true]]);
        for (const e of edges) {
            const pts = (e.data as any).points as { x: number; y: number }[];
            for (let i = 1; i < pts.length; i++) expect(pts[i].x === pts[i - 1].x || pts[i].y === pts[i - 1].y).toBe(true);
        }
    });

    it('a warned line marks the node that holds the row', async () => {
        const text = 'create class Dog\ncreate reference owner in Dog type Ghost\ncreate attribute a in Person type Nope';
        const plan = await planEffects(text, m2world());
        expect(plan.warnings.map((w) => w.line)).toEqual([2, 3]);
        const { nodes } = buildPreviewElements(plan, m2world(), m2drawn, text);
        expect(nodes.map((n) => n.className)).toEqual(['jj-preview-node jj-preview-node--warning']);
        // No row was planned into Person: no compartment to mark; without the script, no marker.
        expect(buildPreviewElements(plan, m2world(), m2drawn).nodes.map((n) => n.className)).toEqual(['jj-preview-node']);
    });

    it('an M1 plan of a mixed script draws only its M1 creations', async () => {
        const plan = await planEffects('create class Pet\ncreate instance of State "A"', world());
        expect(plan.created.length).toBe(2);
        const { nodes } = buildPreviewElements(plan, world(), drawn);
        expect(nodes.map((n) => (n.data as any).label)).toEqual(['A : State']);
    });

    it('no ghost overlaps a drawn node or another ghost (P-2026-10-25-0020)', async () => {
        const plan = await planEffects(script, m2world());
        const { nodes } = buildPreviewElements(plan, m2world(), m2drawn);
        const boxes = [
            ...m2drawn.map((d) => ({ x: d.x, y: d.y, w: d.width, h: d.height })),
            ...nodes.map((n) => ({ x: n.position.x, y: n.position.y, w: n.width!, h: n.height! })),
        ];
        for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
            const a = boxes[i];
            const b = boxes[j];
            expect(a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h).toBe(false);
        }
    });

    it('a class referencing a drawn class goes right of it; with no free spot beside, the column (P-2026-10-25-0020)', async () => {
        const plan = await planEffects('create class Pet\ncreate reference owner in Pet type Person', m2world());
        expect(buildPreviewElements(plan, m2world(), m2drawn).nodes[0].position).toEqual({ x: 280, y: 0 });
        // Person boxed in on four sides: the column right of everything drawn.
        const walled: DrawnNode[] = [
            ...m2drawn,
            { nodeId: 'r', elementId: 'r', x: 280, y: 0, width: 200, height: 100, nested: false },
            { nodeId: 'l', elementId: 'l', x: -400, y: 0, width: 200, height: 100, nested: false },
            { nodeId: 'u', elementId: 'u', x: 0, y: -400, width: 200, height: 300, nested: false },
        ];
        const sealed = [{ x: -1000, y: -1000, width: 1500, height: 1700 }];
        expect(buildPreviewElements(plan, m2world(), walled, undefined, sealed).nodes[0].position).toEqual({ x: 560, y: -400 });
        // Sliding along a side finds the room the four straight spots lack (P-2026-10-25-0110).
        expect(buildPreviewElements(plan, m2world(), walled).nodes[0].position).toEqual({ x: 280, y: -120 });
    });

    it('a new class keeps 24 px from an edge label (P-2026-10-25-0110)', async () => {
        const plan = await planEffects('create class Pet\ncreate reference owner in Pet type Person', m2world());
        // A label where the straight right spot would sit; below Person is within 24 px of Color: the ghost goes left.
        const label = [{ x: 300, y: 20, width: 60, height: 16 }];
        expect(buildPreviewElements(plan, m2world(), m2drawn, undefined, label).nodes[0].position).toEqual({ x: -260, y: 0 });
    });

    it('a removed row is struck where the node draws it, a removed element whole (P-2026-10-25-0110)', async () => {
        const w = m2world();
        w.m2!.elements.push({ id: 'aName', name: 'name', kind: 'Attribute', father: 'cPerson' } as any);
        const plan = await planEffects('delete Person.name\ndelete Color', w);
        const measured = m2drawn.map((d) => d.nodeId === 'vPerson' ? { ...d, rowOf: (name: string) => name === 'name' ? { dx: 8, dy: 40, width: 184, height: 20 } : null } : d);
        const { nodes, edges } = buildPreviewElements(plan, w, measured);
        expect(nodes.map((n) => [n.id, (n.data as any).label, n.className, n.position, n.width, n.height])).toEqual([
            [`${PREVIEW_ID_PREFIX}strike:aName`, '', 'jj-preview-node jj-preview-strike', { x: 8, y: 40 }, 184, 20],
            [`${PREVIEW_ID_PREFIX}strike:eColor`, '', 'jj-preview-node jj-preview-strike jj-preview-strike--element', { x: 0, y: 200 }, 200, 80],
        ]);
        expect(edges).toEqual([]);
    });

    it('a removed row that is not on screen goes struck in a compartment under its node (P-2026-10-25-0110)', async () => {
        const w = m2world();
        w.m2!.elements.push({ id: 'aName', name: 'name', kind: 'Attribute', father: 'cPerson' } as any);
        const plan = await planEffects('delete Person.name\ncreate attribute nick in Person', w);
        const { nodes } = buildPreviewElements(plan, w, m2drawn);
        // The added rows first, flush under Person; the removed one flush under them.
        expect(nodes.map((n) => [n.id, (n.data as any).label, n.position, n.height])).toEqual([
            [`${PREVIEW_ID_PREFIX}rows:cPerson`, '+ nick : EString', { x: 0, y: 100 }, PREVIEW_ROW_HEIGHT + 8],
            [`${PREVIEW_ID_PREFIX}removed:cPerson`, '\u2212 name', { x: 0, y: 100 + PREVIEW_ROW_HEIGHT + 8 }, PREVIEW_ROW_HEIGHT + 8],
        ]);
        expect(nodes[1].className).toBe('jj-preview-node jj-preview-compartment jj-preview-node--removed');
    });
});
