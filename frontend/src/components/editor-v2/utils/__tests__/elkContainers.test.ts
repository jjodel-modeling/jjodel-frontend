/**
 * elkContainers (P-2026-10-10-0105, slice S6): the toolbar Auto layout across graphVertex containers, with ELK. The
 * results are read back through the presentation pass (irContainment.applyContainerLayout): the boxes it draws from the
 * new positions must hold what the layout put in them.
 */
import { describe, it, expect } from 'vitest';
import type { Edge, Node } from '@xyflow/react';
import { computeContainedAutoLayout, planContainedLayout, CONTAINER_CONTENT_MARGIN, type StoredBox } from '../elkContainers';
import { computeElkAutoLayout } from '../elkLayout';
import { applyContainerLayout, PARTITION_CONTENT_MARGIN, type ContainmentModel } from '../../viewpoint/ir/irContainment';
import type { CompiledContainmentLayout } from '../../viewpoint/ir/irTypes';

const node = (id: string, x: number, y: number, w = 120, h = 60, extra: Partial<Node> = {}): Node =>
    ({ id, type: 'objectNode', position: { x, y }, data: {}, width: w, height: h, measured: { width: w, height: h }, ...extra } as Node);
const edge = (id: string, source: string, target: string, extra: Partial<Edge> = {}): Edge => ({ id, source, target, type: 'instanceRef', ...extra } as Edge);
const lay = (l: Partial<CompiledContainmentLayout> & { mode: CompiledContainmentLayout['mode'] }): CompiledContainmentLayout =>
    ({ axis: 'vertical', header: null, padding: 0, ...l });

/** A model whose objects are their vertices' ids without the leading V. */
function modelOf(containers: Array<[string, CompiledContainmentLayout | undefined]>, children: Array<[string, string[]]>, objects: string[]): ContainmentModel {
    const parentOf = new Map<string, string>();
    for (const [p, ks] of children) for (const k of ks) parentOf.set(k, p);
    return {
        containers: new Map(containers.map(([o, layout]) => [o, { objectId: o, vertexId: 'V' + o, collapsible: true, ...(layout ? { layout } : {}) }] as const)),
        childrenOf: new Map(children), parentOf,
        objByVertex: new Map(objects.map(o => ['V' + o, o] as const)), vertexByObj: new Map(objects.map(o => [o, 'V' + o] as const)),
    };
}
const records = (nodes: Node[], over: Record<string, Partial<StoredBox>> = {}) => {
    const out: Record<string, any> = {};
    for (const n of nodes) out[n.id] = { x: n.position.x, y: n.position.y, w: n.width, h: n.height, isResized: false, ...(over[n.id] ?? {}) };
    return out;
};
const moveTo = (nodes: Node[], positions: Map<string, { x: number; y: number }>) =>
    nodes.map(n => (positions.has(n.id) ? { ...n, position: positions.get(n.id)! } : n));
/** The records after the write: the positions, and the sizes written by hand. */
const written = (rec: Record<string, any>, res: { positions: Map<string, { x: number; y: number }>; sizes: Map<string, { w: number; h: number }> }) => {
    const out: Record<string, any> = {};
    for (const [v, r] of Object.entries(rec)) out[v] = { ...r, ...(res.positions.get(v) ?? {}), ...(res.sizes.has(v) ? { ...res.sizes.get(v), isResized: true } : {}) };
    return out;
};
const boxOf = (nodes: Node[], id: string) => {
    const n = nodes.find(m => m.id === id)!;
    return { x: n.position.x, y: n.position.y, w: (n.width ?? n.measured?.width) as number, h: (n.height ?? n.measured?.height) as number };
};
const inside = (c: { x: number; y: number; w: number; h: number }, p: { x: number; y: number; w: number; h: number }, m = 0) =>
    c.x >= p.x + m - 0.5 && c.y >= p.y + m - 0.5 && c.x + c.w <= p.x + p.w - m + 0.5 && c.y + c.h <= p.y + p.h - m + 0.5;
const overlap = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) =>
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** A pool with two lanes (stacked, bands on the left), five flow nodes, a flow that crosses from Sales to Warehouse. */
function bpmn(over: { warehouseRec?: Partial<StoredBox> } = {}) {
    const band = { side: 'w' as const, size: 30 };
    const model = modelOf(
        [['shop', lay({ mode: 'partitions', header: band })], ['sales', lay({ mode: 'free', header: band })], ['wh', lay({ mode: 'free', header: band })]],
        [['shop', ['sales', 'wh']], ['sales', ['start', 'check', 'gw']], ['wh', ['ship', 'end']]],
        ['shop', 'sales', 'wh', 'start', 'check', 'gw', 'ship', 'end', 'other'],
    );
    const nodes = [
        node('Vshop', 100, 100, 900, 360), node('Vsales', 130, 100, 870, 180), node('Vwh', 130, 280, 870, 180),
        node('Vstart', 700, 400, 36, 36), node('Vcheck', 160, 300), node('Vgw', 500, 120, 50, 50), node('Vship', 300, 140), node('Vend', 160, 400, 36, 36),
        node('Vother', 1500, 900),
    ];
    const edges = [
        edge('sf1', 'Vstart', 'Vcheck'), edge('sf2', 'Vcheck', 'Vgw'), edge('sf3', 'Vgw', 'Vship'), edge('sf4', 'Vship', 'Vend'),
        edge('chan', 'Vsales', 'Vstart', { hidden: true }), edge('mf', 'Vother', 'Vcheck'),
    ];
    const rec = records(nodes, over.warehouseRec ? { Vwh: over.warehouseRec } : {});
    return { model, nodes, edges, rec, storedOf: (v: string) => rec[v] as StoredBox };
}

describe('planContainedLayout', () => {
    it('makes the pool an owner, the lanes bands, and lists each run\'s nodes', () => {
        const { model, nodes } = bpmn();
        const p = planContainedLayout(nodes, model);
        expect(p.owners).toEqual(['shop']);
        expect(p.isBand('sales')).toBe(true);
        expect(p.isOwner('sales')).toBe(false);
        expect(p.itemsOf.get('shop')).toEqual(['start', 'check', 'gw', 'ship', 'end']);
        expect(p.itemsOf.get(undefined)).toEqual(['shop', 'other']);
        // An edge's ends at the root: the pool stands for a flow node; a band is never a node of a run.
        expect(p.itemIn(undefined, 'check')).toBe('shop');
        expect(p.itemIn('shop', 'check')).toBe('check');
        expect(p.itemIn('shop', 'sales')).toBeNull();
        expect(p.itemIn('shop', 'shop')).toBeNull();
    });
});

describe('computeContainedAutoLayout', () => {
    it('is today\'s flat layout when no container declares a layout', async () => {
        const model = modelOf([['r', undefined]], [['r', ['a', 'b']]], ['r', 'a', 'b']);
        const nodes = [node('Vr', 0, 0), node('Va', 10, 10), node('Vb', 300, 10)];
        const edges = [edge('e', 'Va', 'Vb')];
        const flat = await computeElkAutoLayout(nodes, edges, {});
        const got = await computeContainedAutoLayout(nodes, edges, { containment: model });
        expect([...got.positions]).toEqual([...flat.positions]);
        expect(got.sizes.size).toBe(0);
        const none = await computeContainedAutoLayout(nodes, edges, {});
        expect([...none.positions]).toEqual([...flat.positions]);
    });

    it('keeps every flow node inside its own lane, flows left to right, and the pool holds its lanes', async () => {
        const { model, nodes, edges, rec, storedOf } = bpmn();
        const res = await computeContainedAutoLayout(nodes, edges, { containment: model, storedOf });
        const drawn = applyContainerLayout(moveTo(nodes, res.positions), model, written(rec, res), null, new Set());
        const lane = { start: 'Vsales', check: 'Vsales', gw: 'Vsales', ship: 'Vwh', end: 'Vwh' } as const;
        for (const [o, l] of Object.entries(lane)) expect(inside(boxOf(drawn, 'V' + o), boxOf(drawn, l), PARTITION_CONTENT_MARGIN - 0.5)).toBe(true);
        // ...and clear of the lane's band (30 px on the left), by the margin.
        for (const [o, l] of Object.entries(lane)) expect(boxOf(drawn, 'V' + o).x).toBeGreaterThanOrEqual(boxOf(drawn, l).x + 30 + PARTITION_CONTENT_MARGIN - 0.5);
        for (const l of ['Vsales', 'Vwh']) expect(inside(boxOf(drawn, l), boxOf(drawn, 'Vshop'))).toBe(true);
        for (const [s, t] of [['Vstart', 'Vcheck'], ['Vcheck', 'Vgw'], ['Vgw', 'Vship'], ['Vship', 'Vend']]) {
            expect(boxOf(drawn, s).x).toBeLessThan(boxOf(drawn, t).x);
        }
        const flow = ['Vstart', 'Vcheck', 'Vgw', 'Vship', 'Vend'];
        for (const a of flow) for (const b of flow) if (a < b) expect(overlap(boxOf(drawn, a), boxOf(drawn, b))).toBe(false);
        // The node outside the pool is laid out with it at the root, and the hidden channel edge took no part.
        expect(overlap(boxOf(drawn, 'Vother'), boxOf(drawn, 'Vshop'))).toBe(false);
        expect(res.routes.has('chan')).toBe(false);
        // The shared flow runs past the lanes' own spans: the pool's box is written; no lane is.
        expect([...res.sizes.keys()]).toEqual(['Vshop']);
    });

    it('lets no hidden edge take part: positions as if it were not there', async () => {
        const { model, nodes, edges, storedOf } = bpmn();
        const hiddenBack = edge('hid', 'Vend', 'Vstart', { hidden: true });
        const hiddenCross = edge('hid2', 'Vship', 'Vcheck', { hidden: true });
        const plain = await computeContainedAutoLayout(nodes, edges, { containment: model, storedOf });
        const withHidden = await computeContainedAutoLayout(nodes, [...edges, hiddenBack, hiddenCross], { containment: model, storedOf });
        expect([...withHidden.positions]).toEqual([...plain.positions]);
    });
    it('is idempotent: a second run on its own result gives the same positions', async () => {
        const { model, nodes, edges, storedOf } = bpmn();
        const first = await computeContainedAutoLayout(nodes, edges, { containment: model, storedOf });
        const rec2 = written(records(nodes), first);
        const again = await computeContainedAutoLayout(moveTo(nodes, first.positions), edges, { containment: model, storedOf: v => rec2[v] });
        expect([...again.sizes]).toEqual([]);
        for (const [id, p] of first.positions) {
            expect(Math.abs(again.positions.get(id)!.x - p.x)).toBeLessThanOrEqual(1);
            expect(Math.abs(again.positions.get(id)!.y - p.y)).toBeLessThanOrEqual(1);
        }
    });

    it('grows a lane sized by hand that its nodes outgrow, never shrinks one, and leaves a lane sized by content', async () => {
        const small = bpmn({ warehouseRec: { h: 40, isResized: true } });
        const r1 = await computeContainedAutoLayout(small.nodes, small.edges, { containment: small.model, storedOf: small.storedOf });
        expect(r1.sizes.get('Vwh')!.h).toBeGreaterThan(40);
        expect(r1.sizes.has('Vsales')).toBe(false);
        const big = bpmn({ warehouseRec: { h: 600, isResized: true } });
        const r2 = await computeContainedAutoLayout(big.nodes, big.edges, { containment: big.model, storedOf: big.storedOf });
        expect(r2.sizes.has('Vwh')).toBe(false);
        // The band keeps its 600: the next lane's nodes start below it.
        const drawn = applyContainerLayout(moveTo(big.nodes, r2.positions), big.model, written(big.rec, r2), null, new Set());
        expect(boxOf(drawn, 'Vwh').h).toBe(600);
    });

    it('lays out a self-framing container\'s children inside its frame, and the frame as one block at the root', async () => {
        const run = lay({ mode: 'free', frame: 'self', header: { side: 'n', size: 28 }, padding: 16 });
        const model = modelOf([['run', run]], [['run', ['f', 'c', 'i']]], ['run', 'f', 'c', 'i', 'idle']);
        const nodes = [node('Vrun', 900, 900, 200, 60), node('Vf', 500, 40), node('Vc', 40, 500), node('Vi', 300, 300, 20, 20), node('Vidle', 0, 0)];
        const edges = [edge('t1', 'Vi', 'Vf'), edge('t2', 'Vf', 'Vc'), edge('t3', 'Vc', 'Vidle'), edge('t4', 'Vidle', 'Vrun')];
        const rec = records(nodes);
        const res = await computeContainedAutoLayout(nodes, edges, { containment: model, storedOf: v => rec[v] });
        const drawn = applyContainerLayout(moveTo(nodes, res.positions), model, written(rec, res), null, new Set());
        for (const k of ['Vf', 'Vc', 'Vi']) expect(inside(boxOf(drawn, k), boxOf(drawn, 'Vrun'), 16 - 0.5)).toBe(true);
        // The frame starts where the layout put the container, and nothing overlaps it at the root.
        expect(boxOf(drawn, 'Vrun').x).toBe(res.positions.get('Vrun')!.x);
        expect(boxOf(drawn, 'Vrun').y).toBe(res.positions.get('Vrun')!.y);
        expect(overlap(boxOf(drawn, 'Vidle'), boxOf(drawn, 'Vrun'))).toBe(false);
        // A route laid out inside the frame moved with it; one whose end is the frame's content was not kept at the root.
        expect(res.routes.has('t2')).toBe(true);
        expect(res.routes.has('t3')).toBe(false);
        // The route moved with the frame: its end rects are where the nodes are drawn.
        const t2 = res.routes.get('t2')!;
        expect(Math.abs(t2.sourceRect.x - boxOf(drawn, 'Vf').x)).toBeLessThanOrEqual(0.5);
        expect(Math.abs(t2.targetRect.y - boxOf(drawn, 'Vc').y)).toBeLessThanOrEqual(0.5);
    });
    it('keeps a frame sized by hand at its stored size as a block, and lays the root out around it', async () => {
        const run = lay({ mode: 'free', frame: 'self', padding: 16 });
        const model = modelOf([['run', run]], [['run', ['f', 'c']]], ['run', 'f', 'c', 'idle']);
        const nodes = [node('Vrun', 0, 0, 900, 600), node('Vf', 10, 10), node('Vc', 200, 10), node('Vidle', 50, 50)];
        const edges = [edge('t1', 'Vf', 'Vc'), edge('t2', 'Vrun', 'Vidle')];
        const rec = records(nodes, { Vrun: { w: 900, h: 600, isResized: true } });
        const res = await computeContainedAutoLayout(nodes, edges, { containment: model, storedOf: v => rec[v] });
        const drawn = applyContainerLayout(moveTo(nodes, res.positions), model, written(rec, res), null, new Set());
        expect(boxOf(drawn, 'Vrun')).toMatchObject({ w: 900, h: 600 });
        expect(overlap(boxOf(drawn, 'Vidle'), boxOf(drawn, 'Vrun'))).toBe(false);
    });

    it('places a frame inside a region of an orthogonal state, each region with its own states', async () => {
        const band = { side: 'n' as const, size: 28 };
        const model = modelOf(
            [['active', lay({ mode: 'partitions', header: band, separator: 'dashed' })], ['a1', lay({ mode: 'free' })], ['a2', lay({ mode: 'free' })],
                ['run', lay({ mode: 'free', frame: 'self', header: band, padding: 16 })]],
            [['active', ['a1', 'a2']], ['a1', ['w', 'p1']], ['a2', ['run', 'pz']], ['run', ['f', 'c']]],
            ['active', 'a1', 'a2', 'w', 'p1', 'run', 'pz', 'f', 'c'],
        );
        const nodes = [node('Vactive', 0, 0, 300, 200), node('Va1', 0, 28, 300, 80), node('Va2', 0, 108, 300, 80), node('Vw', 900, 0), node('Vp1', 0, 900),
            node('Vrun', 500, 500, 100, 40), node('Vpz', 30, 30), node('Vf', 700, 700, 400, 60), node('Vc', 100, 100, 400, 60)];
        const edges = [edge('e1', 'Vw', 'Vp1'), edge('e2', 'Vrun', 'Vpz'), edge('e3', 'Vf', 'Vc'), edge('e4', 'Vpz', 'Vf')];
        const rec = records(nodes);
        const res = await computeContainedAutoLayout(nodes, edges, { containment: model, storedOf: v => rec[v] });
        const drawn = applyContainerLayout(moveTo(nodes, res.positions), model, written(rec, res), null, new Set());
        for (const k of ['Vw', 'Vp1']) expect(inside(boxOf(drawn, k), boxOf(drawn, 'Va1'), CONTAINER_CONTENT_MARGIN - 0.5)).toBe(true);
        for (const k of ['Vrun', 'Vpz']) expect(inside(boxOf(drawn, k), boxOf(drawn, 'Va2'), CONTAINER_CONTENT_MARGIN - 0.5)).toBe(true);
        for (const k of ['Vf', 'Vc']) expect(inside(boxOf(drawn, k), boxOf(drawn, 'Vrun'), 16 - 0.5)).toBe(true);
        for (const r of ['Va1', 'Va2']) expect(inside(boxOf(drawn, r), boxOf(drawn, 'Vactive'))).toBe(true);
        expect(overlap(boxOf(drawn, 'Vrun'), boxOf(drawn, 'Vpz'))).toBe(false);
    });

    it('keeps the edges inside a frame out of the root run: the root lays out as if they were not there', async () => {
        const run = lay({ mode: 'free', frame: 'self', padding: 16 });
        const model = modelOf([['run', run]], [['run', ['f', 'c', 'i']]], ['run', 'f', 'c', 'i', 'idle', 'done']);
        const nodes = [node('Vrun', 0, 0), node('Vf', 10, 10), node('Vc', 200, 10), node('Vi', 0, 0, 20, 20), node('Vidle', 50, 50), node('Vdone', 0, 0)];
        const outer = [edge('a', 'Vidle', 'Vrun'), edge('b', 'Vrun', 'Vdone')];
        const inner = [edge('t1', 'Vi', 'Vf'), edge('t2', 'Vf', 'Vc'), edge('t3', 'Vc', 'Vi')];
        const rec = records(nodes);
        const both = await computeContainedAutoLayout(nodes, [...outer, ...inner], { containment: model, storedOf: v => rec[v] });
        // The frame's own size depends on its inner edges; the root is compared on the same block, so on the outer nodes' order.
        const ys = (r: typeof both) => ['Vidle', 'Vrun', 'Vdone'].map(v => r.positions.get(v)!.y);
        const [yi, yr, yd] = ys(both);
        expect(yi).toBeLessThan(yr);
        expect(yr).toBeLessThan(yd);
        expect(both.positions.get('Vidle')!.x).toBe(both.positions.get('Vdone')!.x);
    });
    it('drops an edge whose two ends stand for one block at a level (a substate to its own frame): no self-loop there', async () => {
        const run = lay({ mode: 'free', frame: 'self', padding: 16 });
        const model = modelOf([['run', run]], [['run', ['f', 'c']]], ['run', 'f', 'c', 'top', 'idle']);
        const nodes = [node('Vrun', 0, 0), node('Vf', 10, 10), node('Vc', 200, 10), node('Vtop', 0, 0), node('Vidle', 50, 50)];
        const base = [edge('t2', 'Vf', 'Vc'), edge('a', 'Vtop', 'Vrun'), edge('b', 'Vtop', 'Vidle')];
        const rec = records(nodes);
        const without = await computeContainedAutoLayout(nodes, base, { containment: model, storedOf: v => rec[v] });
        const withLoop = await computeContainedAutoLayout(nodes, [...base, edge('up', 'Vf', 'Vrun'), edge('up2', 'Vc', 'Vrun')], { containment: model, storedOf: v => rec[v] });
        expect([...withLoop.positions]).toEqual([...without.positions]);
    });
    it('lays out a collapsed container as one node and carries its hidden content by its own move', async () => {
        const run = lay({ mode: 'free', frame: 'self', padding: 16 });
        const model = modelOf([['run', run], ['other', lay({ mode: 'free' })]], [['run', ['f', 'c']], ['other', ['x']]], ['run', 'f', 'c', 'other', 'x', 'idle']);
        const nodes = [node('Vrun', 400, 400, 120, 40), node('Vf', 416, 416, 60, 30, { hidden: true }), node('Vc', 520, 416, 60, 30, { hidden: true }),
            node('Vother', 0, 0, 200, 100), node('Vx', 20, 20), node('Vidle', 900, 0)];
        const edges = [edge('t', 'Vidle', 'Vrun')];
        const rec = records(nodes);
        const res = await computeContainedAutoLayout(nodes, edges, { containment: model, storedOf: v => rec[v] });
        const to = res.positions.get('Vrun')!;
        const d = { x: to.x - 400, y: to.y - 400 };
        expect(res.positions.get('Vf')).toEqual({ x: 416 + d.x, y: 416 + d.y });
        expect(res.positions.get('Vc')).toEqual({ x: 520 + d.x, y: 416 + d.y });
        expect(planContainedLayout(nodes, model).isOwner('run')).toBe(false);
    });

    it('grows a free container sized below its content, and keeps one large enough', async () => {
        const model = modelOf([['pool', lay({ mode: 'free', header: { side: 'w', size: 30 } })]], [['pool', ['a', 'b']]], ['pool', 'a', 'b']);
        const tight = [node('Vpool', 0, 0, 100, 50), node('Va', 10, 10), node('Vb', 10, 10)];
        const edges = [edge('e', 'Va', 'Vb')];
        const rec = records(tight);
        const r1 = await computeContainedAutoLayout(tight, edges, { containment: model, storedOf: v => rec[v] });
        const g = r1.sizes.get('Vpool')!;
        expect(g.w).toBeGreaterThan(100);
        const a = r1.positions.get('Va')!; const p = r1.positions.get('Vpool')!;
        expect(a.x - p.x).toBeGreaterThanOrEqual(30 + CONTAINER_CONTENT_MARGIN);
        const roomy = [node('Vpool', 0, 0, 2000, 2000), node('Va', 10, 10), node('Vb', 10, 10)];
        const r2 = await computeContainedAutoLayout(roomy, edges, { containment: model, storedOf: v => records(roomy)[v] });
        expect(r2.sizes.size).toBe(0);
    });
});
