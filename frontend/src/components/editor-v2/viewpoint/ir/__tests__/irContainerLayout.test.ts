/**
 * The S2 presentation passes of irContainment (P-2026-10-10-0105, R-GV-4, R-GV-6, R-GV-7): partitions applied to the
 * React Flow nodes in absolute coordinates, z-order of layout containers, and channel-edge suppression. Pure: the
 * containment model, the D-layer vertex records and the nodes are literals.
 */
import { describe, it, expect } from 'vitest';
import type { Edge, Node } from '@xyflow/react';
import {
    applyContainerLayout, LAYOUT_CONTAINER_Z, PARTITION_CONTENT_MARGIN, PARTITION_NEXT_CLASS, suppressChannelEdges, type ContainmentModel,
} from '../irContainment';
import type { CompiledContainmentLayout } from '../irTypes';

const partitions = (header: CompiledContainmentLayout['header'] = { side: 'w', size: 30 }): CompiledContainmentLayout =>
    ({ mode: 'partitions', axis: 'vertical', header, padding: 0 });
const free = (header: CompiledContainmentLayout['header'] = { side: 'w', size: 30 }): CompiledContainmentLayout =>
    ({ mode: 'free', axis: 'vertical', header, padding: 0 });

/** Shop (partitions) holds Sales and Warehouse (free, banded); Sales holds t1, Warehouse holds t2. */
function world(opts: { shop?: any; sales?: any; warehouse?: any; nodes?: Partial<Record<string, Partial<Node>>>; extraContainers?: Array<[string, any]> } = {}) {
    const model: ContainmentModel = {
        containers: new Map<string, any>([
            ['shop', { objectId: 'shop', vertexId: 'Vshop', collapsible: false, layout: partitions() }],
            ['sales', { objectId: 'sales', vertexId: 'Vsales', collapsible: false, layout: free() }],
            ['warehouse', { objectId: 'warehouse', vertexId: 'Vwarehouse', collapsible: false, layout: free() }],
            ...(opts.extraContainers ?? []),
        ]),
        childrenOf: new Map([['shop', ['sales', 'warehouse']], ['sales', ['t1']], ['warehouse', ['t2']]]),
        parentOf: new Map([['sales', 'shop'], ['warehouse', 'shop'], ['t1', 'sales'], ['t2', 'warehouse']]),
        objByVertex: new Map([['Vshop', 'shop'], ['Vsales', 'sales'], ['Vwarehouse', 'warehouse'], ['Vt1', 't1'], ['Vt2', 't2'], ['Vx', 'x']]),
        vertexByObj: new Map([['shop', 'Vshop'], ['sales', 'Vsales'], ['warehouse', 'Vwarehouse'], ['t1', 'Vt1'], ['t2', 'Vt2'], ['x', 'Vx']]),
    };
    const rec = (x: number, y: number, w: number, h: number, isResized: boolean) => ({ x, y, w, h, isResized });
    const idlookup: Record<string, any> = {
        Vshop: opts.shop ?? rec(100, 100, 900, 360, true),
        Vsales: opts.sales ?? rec(0, 0, 200, 180, true),
        Vwarehouse: opts.warehouse ?? rec(0, 0, 200, 180, true),
        Vt1: rec(300, 160, 140, 60, true), Vt2: rec(300, 340, 140, 60, true), Vx: rec(0, 0, 100, 40, false),
    };
    const node = (id: string, x: number, y: number, w?: number, h?: number): Node => ({
        id, type: 'objectNode', position: { x, y }, data: {}, ...(w !== undefined ? { width: w, height: h } : {}),
        ...(opts.nodes?.[id] ?? {}),
    } as Node);
    const nodes = [
        node('Vshop', 100, 100, 900, 360), node('Vsales', 7, 7, 200, 180), node('Vwarehouse', 9, 9, 200, 180),
        node('Vt1', 300, 160, 140, 60), node('Vt2', 300, 340, 140, 60), node('Vx', 0, 0),
    ];
    return { model, idlookup, nodes };
}
const pick = (nodes: Node[], id: string) => {
    const n = nodes.find(m => m.id === id)!;
    return { x: n.position.x, y: n.position.y, w: n.width, h: n.height, z: n.zIndex };
};

describe('applyContainerLayout: partitions (R-GV-7) in absolute coordinates (R-GV-6)', () => {
    it('stacks the lanes under the pool band, each as wide as the pool body, and sizes the pool', () => {
        const { model, idlookup, nodes } = world();
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        expect(pick(out, 'Vshop')).toEqual({ x: 100, y: 100, w: 900, h: 360, z: LAYOUT_CONTAINER_Z });
        expect(pick(out, 'Vsales')).toEqual({ x: 130, y: 100, w: 870, h: 180, z: LAYOUT_CONTAINER_Z + 1 });
        expect(pick(out, 'Vwarehouse')).toEqual({ x: 130, y: 280, w: 870, h: 180, z: LAYOUT_CONTAINER_Z + 1 });
    });
    it('marks every partition after the first so it drops its leading border, by axis, keeping other classes', () => {
        const { model, idlookup, nodes } = world({ nodes: { Vwarehouse: { className: 'mine ir-partition-next-h' } } });
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        expect(out.find(n => n.id === 'Vsales')!.className).toBeUndefined();
        expect(out.find(n => n.id === 'Vwarehouse')!.className).toBe(`mine ${PARTITION_NEXT_CLASS.vertical}`);
        (model.containers.get('shop') as any).layout = { ...partitions(), axis: 'horizontal' };
        const h = applyContainerLayout(nodes, model, idlookup, null, new Set());
        expect(h.find(n => n.id === 'Vwarehouse')!.className).toBe(`mine ${PARTITION_NEXT_CLASS.horizontal}`);
    });
    it('leaves the flow nodes and the nodes outside every container untouched, by reference', () => {
        const { model, idlookup, nodes } = world();
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        for (const id of ['Vt1', 'Vt2', 'Vx']) expect(out.find(n => n.id === id)).toBe(nodes.find(n => n.id === id));
    });
    it('reads the records under the layout key in force, not the seed', () => {
        const base = world();
        const idlookup = { ...base.idlookup, Vsales: { ...base.idlookup.Vsales, h: 50, layoutByViewpoint: { VP: { x: 0, y: 0, w: 200, h: 220, isResized: true } } } };
        const seedOut = applyContainerLayout(base.nodes, base.model, idlookup, null, new Set());
        expect(pick(seedOut, 'Vsales').h).toBe(50);
        const vpOut = applyContainerLayout(base.nodes, base.model, idlookup, 'VP', new Set());
        expect(pick(vpOut, 'Vsales').h).toBe(220);
        expect(pick(vpOut, 'Vwarehouse').y).toBe(320);
    });
    it('a lane not resized by hand takes its children span plus the margins', () => {
        const { model, idlookup, nodes } = world({ sales: { x: 0, y: 0, w: 200, h: 180, isResized: false }, shop: { x: 100, y: 100, w: 900, h: 100, isResized: true } });
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        // t1 is 60 high: 60 + 2 * margin.
        expect(pick(out, 'Vsales').h).toBe(60 + 2 * PARTITION_CONTENT_MARGIN);
        expect(pick(out, 'Vwarehouse').y).toBe(100 + 60 + 2 * PARTITION_CONTENT_MARGIN);
        expect(pick(out, 'Vshop').h).toBe(60 + 2 * PARTITION_CONTENT_MARGIN + 180);
    });
    it('a pool not resized by hand is as wide as its band plus the widest lane content', () => {
        const { model, idlookup, nodes } = world({ shop: { x: 100, y: 100, w: 900, h: 360, isResized: false } });
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        // Each lane needs t's 140 plus the margins plus its own 30 px band.
        expect(pick(out, 'Vshop').w).toBe(30 + 140 + 2 * PARTITION_CONTENT_MARGIN + 30);
        expect(pick(out, 'Vshop').h).toBe(360);
    });
    it('follows the pool node where it is now (a drag in progress), not where its record says', () => {
        const { model, idlookup, nodes } = world({ nodes: { Vshop: { position: { x: 400, y: 50 } } } });
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        expect(pick(out, 'Vsales')).toMatchObject({ x: 430, y: 50 });
        expect(pick(out, 'Vwarehouse')).toMatchObject({ x: 430, y: 230 });
    });
    it('leaves a hidden partition out of the stack', () => {
        const { model, idlookup, nodes } = world();
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set(['sales']));
        expect(pick(out, 'Vwarehouse')).toMatchObject({ x: 130, y: 100, h: 360 });
        expect(out.find(n => n.id === 'Vsales')).toBe(nodes.find(n => n.id === 'Vsales'));
    });
    it('does nothing for a hidden container', () => {
        const { model, idlookup, nodes } = world();
        expect(applyContainerLayout(nodes, model, idlookup, null, new Set(['shop', 'sales', 'warehouse']))).toBe(nodes);
    });
    it('keeps a measured size equal to the applied one and drops a stale one', () => {
        const { model, idlookup, nodes } = world({ nodes: {
            Vsales: { measured: { width: 870, height: 180 } }, Vwarehouse: { measured: { width: 200, height: 40 } },
        } });
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        expect(out.find(n => n.id === 'Vsales')!.measured).toEqual({ width: 870, height: 180 });
        expect(out.find(n => n.id === 'Vwarehouse')!.measured).toBeUndefined();
    });
    it('returns the same array when no container declares a layout', () => {
        const { model, idlookup, nodes } = world();
        for (const info of model.containers.values()) delete (info as any).layout;
        expect(applyContainerLayout(nodes, model, idlookup, null, new Set())).toBe(nodes);
    });
    it('returns the same array on a second pass over its own output', () => {
        const { model, idlookup, nodes } = world();
        const once = applyContainerLayout(nodes, model, idlookup, null, new Set());
        expect(applyContainerLayout(once, model, idlookup, null, new Set())).toBe(once);
    });
    it('nests: a lane with sub-lanes fills its own box with them, below the outer stack', () => {
        const base = world({ extraContainers: [['sales', { objectId: 'sales', vertexId: 'Vsales', collapsible: false, layout: partitions() }]] });
        base.model.childrenOf.set('sales', ['s1', 's2']);
        base.model.parentOf.set('s1', 'sales'); base.model.parentOf.set('s2', 'sales');
        base.model.objByVertex.set('Vs1', 's1'); base.model.objByVertex.set('Vs2', 's2');
        base.model.vertexByObj.set('s1', 'Vs1'); base.model.vertexByObj.set('s2', 'Vs2');
        const idlookup = { ...base.idlookup, Vs1: { x: 0, y: 0, w: 1, h: 60, isResized: true }, Vs2: { x: 0, y: 0, w: 1, h: 70, isResized: true } };
        const nodes = [...base.nodes,
            { id: 'Vs1', type: 'objectNode', position: { x: 0, y: 0 }, data: {} } as Node,
            { id: 'Vs2', type: 'objectNode', position: { x: 0, y: 0 }, data: {} } as Node];
        const out = applyContainerLayout(nodes, base.model, idlookup, null, new Set());
        expect(pick(out, 'Vsales')).toMatchObject({ x: 130, y: 100, w: 870, h: 180 });
        expect(pick(out, 'Vs1')).toEqual({ x: 160, y: 100, w: 840, h: 60, z: LAYOUT_CONTAINER_Z + 2 });
        expect(pick(out, 'Vs2')).toEqual({ x: 160, y: 160, w: 840, h: 120, z: LAYOUT_CONTAINER_Z + 2 });
    });
    it('a nested lane not sized by hand takes the stack of its sub-lanes as its extent', () => {
        const base = world({ sales: { x: 0, y: 0, w: 200, h: 180, isResized: false },
            extraContainers: [['sales', { objectId: 'sales', vertexId: 'Vsales', collapsible: false, layout: partitions() }]] });
        base.model.childrenOf.set('sales', ['s1', 's2']);
        base.model.parentOf.set('s1', 'sales'); base.model.parentOf.set('s2', 'sales');
        base.model.objByVertex.set('Vs1', 's1'); base.model.objByVertex.set('Vs2', 's2');
        base.model.vertexByObj.set('s1', 'Vs1'); base.model.vertexByObj.set('s2', 'Vs2');
        const idlookup = { ...base.idlookup, Vs1: { x: 0, y: 0, w: 1, h: 60, isResized: true }, Vs2: { x: 0, y: 0, w: 1, h: 70, isResized: true } };
        const nodes = [...base.nodes,
            { id: 'Vs1', type: 'objectNode', position: { x: 0, y: 0 }, data: {} } as Node,
            { id: 'Vs2', type: 'objectNode', position: { x: 0, y: 0 }, data: {} } as Node];
        const out = applyContainerLayout(nodes, base.model, idlookup, null, new Set());
        expect(pick(out, 'Vsales').h).toBe(130);
        expect(pick(out, 'Vwarehouse')).toMatchObject({ y: 230, h: 230 });
    });
    it('a band on top of a lane not sized by hand adds to its content height', () => {
        const base = world({ sales: { x: 0, y: 0, w: 200, h: 180, isResized: false } });
        (base.model.containers.get('sales') as any).layout = free({ side: 'n', size: 20 });
        const out = applyContainerLayout(base.nodes, base.model, base.idlookup, null, new Set());
        expect(pick(out, 'Vsales').h).toBe(60 + 2 * PARTITION_CONTENT_MARGIN + 20);
    });
    it('a free container with a band only goes under the edges, its size and place untouched', () => {
        const base = world();
        base.model.containers.delete('shop');
        base.model.parentOf.delete('sales'); base.model.parentOf.delete('warehouse');
        const out = applyContainerLayout(base.nodes, base.model, base.idlookup, null, new Set());
        expect(pick(out, 'Vsales')).toEqual({ x: 7, y: 7, w: 200, h: 180, z: LAYOUT_CONTAINER_Z });
    });
});

describe('suppressChannelEdges (R-GV-4)', () => {
    const edge = (id: string, source: string, target: string, type: string, referenceName: string): Edge =>
        ({ id, source, target, type, data: { referenceName } } as Edge);
    const model = (info: any): ContainmentModel => ({
        containers: new Map([['L', { objectId: 'L', vertexId: 'VL', collapsible: false, ...info }]]),
        childrenOf: new Map([['L', ['t']]]), parentOf: new Map([['t', 'L']]),
        objByVertex: new Map([['VL', 'L'], ['Vt', 't'], ['Vu', 'u']]), vertexByObj: new Map([['L', 'VL'], ['t', 'Vt'], ['u', 'Vu']]),
    });
    const edges = [
        edge('e1', 'VL', 'Vt', 'instanceRef', 'flowNodeRefs'),
        edge('e2', 'VL', 'Vt', 'instanceRef', 'owner'),
        edge('e3', 'VL', 'Vu', 'instanceRef', 'flowNodeRefs'),
        edge('e4', 'Vt', 'VL', 'instanceRef', 'flowNodeRefs'),
        edge('e5', 'VL', 'Vt', 'composition', 'childLaneSet'),
    ];
    const hiddenIds = (out: Edge[]) => out.filter(e => e.hidden).map(e => e.id);
    it('hides the edge of the declared single-hop channel from the container to a child it draws, only that one', () => {
        expect(hiddenIds(suppressChannelEdges(edges, model({ edges: 'hide', channelFeature: 'flowNodeRefs' })))).toEqual(['e1']);
    });
    it('hides the composition edges to its children for the default channel', () => {
        expect(hiddenIds(suppressChannelEdges(edges, model({ edges: 'hide' })))).toEqual(['e5']);
    });
    it('hides nothing for a multi-hop channel, with show, or with the key absent (same array)', () => {
        expect(suppressChannelEdges(edges, model({ edges: 'hide', channelFeature: null }))).toBe(edges);
        expect(suppressChannelEdges(edges, model({ edges: 'show', channelFeature: 'flowNodeRefs' }))).toBe(edges);
        expect(suppressChannelEdges(edges, model({ channelFeature: 'flowNodeRefs' }))).toBe(edges);
    });
    it('drops an edge of the feature to an object the slot no longer holds, keeps one to an object it holds unclaimed', () => {
        const held = model({ edges: 'hide', channelFeature: 'flowNodeRefs', channelValues: new Set(['t', 'u']) });
        const outHeld = suppressChannelEdges(edges, held);
        expect(outHeld.map(e => e.id)).toEqual(['e1', 'e2', 'e3', 'e4', 'e5']);
        expect(hiddenIds(outHeld)).toEqual(['e1']);
        const stale = model({ edges: 'hide', channelFeature: 'flowNodeRefs', channelValues: new Set(['t']) });
        const outStale = suppressChannelEdges(edges, stale);
        expect(outStale.map(e => e.id)).toEqual(['e1', 'e2', 'e4', 'e5']);
        expect(hiddenIds(outStale)).toEqual(['e1']);
        // Already hidden (a collapsed hull, a row) and stale: dropped all the same.
        const hiddenStale = [{ ...edges[2], hidden: true }];
        expect(suppressChannelEdges(hiddenStale, stale)).toEqual([]);
        // Two edges of the feature for one pair: the older is a leftover, the last one stays (and is hidden).
        const twice = [edge('old', 'VL', 'Vt', 'instanceRef', 'flowNodeRefs'), ...edges];
        const outTwice = suppressChannelEdges(twice, held);
        expect(outTwice.map(e => e.id)).toEqual(['e1', 'e2', 'e3', 'e4', 'e5']);
        expect(hiddenIds(outTwice)).toEqual(['e1']);
        // Without a declared single-hop channel nothing is dropped, duplicates included.
        expect(suppressChannelEdges(twice, model({ edges: 'hide', channelFeature: 'flowNodeRefs' })).map(e => e.id))
            .toEqual(['old', 'e1', 'e2', 'e3', 'e4', 'e5']);
        const shown = model({ edges: 'show', channelFeature: 'flowNodeRefs', channelValues: new Set(['t']) });
        expect(suppressChannelEdges(edges, shown)).toBe(edges);
    });
    it('hides the edge of a claim the container lost to another claimant as well', () => {
        const m = model({ edges: 'hide', channelFeature: 'flowNodeRefs' });
        m.parentOf.set('t', 'M');
        expect(suppressChannelEdges(edges, m)).toBe(edges);
        m.multiClaimed = new Map([['t', ['L', 'M']]]);
        expect(hiddenIds(suppressChannelEdges(edges, m))).toEqual(['e1']);
    });
    it('matches only reference and composition edges, and leaves an edge already hidden as it is', () => {
        const m2 = edge('e6', 'VL', 'Vt', 'reference', 'flowNodeRefs');
        expect(suppressChannelEdges([m2], model({ edges: 'hide', channelFeature: 'flowNodeRefs' }))).toEqual([m2]);
        const done = [{ ...edges[0], hidden: true }];
        expect(suppressChannelEdges(done, model({ edges: 'hide', channelFeature: 'flowNodeRefs' }))).toBe(done);
    });
    it('never removes an edge the slot still holds: the array keeps its length and ids', () => {
        const out = suppressChannelEdges(edges, model({ edges: 'hide', channelFeature: 'flowNodeRefs' }));
        expect(out.map(e => e.id)).toEqual(edges.map(e => e.id));
    });
});

describe('applyContainerLayout: live gestures (S3)', () => {
    it('a pool being dragged carries its flow nodes by its offset from its record, and the lanes with it', () => {
        const { model, idlookup, nodes } = world({ nodes: { Vshop: { position: { x: 300, y: 140 }, dragging: true } } });
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        expect(pick(out, 'Vsales')).toMatchObject({ x: 330, y: 140 });
        expect(pick(out, 'Vt1')).toMatchObject({ x: 500, y: 200 });
        expect(pick(out, 'Vt2')).toMatchObject({ x: 500, y: 380 });
        expect(out.find(n => n.id === 'Vx')).toBe(nodes.find(n => n.id === 'Vx'));
    });
    it('a pool being dragged leaves a hidden descendant where it is', () => {
        const { model, idlookup, nodes } = world({ nodes: { Vshop: { position: { x: 300, y: 140 }, dragging: true } } });
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set(['t1']));
        expect(pick(out, 'Vt1')).toMatchObject({ x: 300, y: 160 });
        expect(pick(out, 'Vt2')).toMatchObject({ x: 500, y: 380 });
    });
    it('a pool at its record, or not dragged, carries nothing', () => {
        const atRest = world({ nodes: { Vshop: { dragging: true } } });
        expect(pick(applyContainerLayout(atRest.nodes, atRest.model, atRest.idlookup, null, new Set()), 'Vt1')).toMatchObject({ x: 300, y: 160 });
        const moved = world({ nodes: { Vshop: { position: { x: 300, y: 140 } } } });
        expect(pick(applyContainerLayout(moved.nodes, moved.model, moved.idlookup, null, new Set()), 'Vt1')).toMatchObject({ x: 300, y: 160 });
    });
    it('a lane being dragged carries nothing: its place is computed', () => {
        const { model, idlookup, nodes } = world({ nodes: { Vsales: { position: { x: 600, y: 600 }, dragging: true } } });
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        expect(pick(out, 'Vt1')).toMatchObject({ x: 300, y: 160 });
        expect(pick(out, 'Vsales')).toMatchObject({ x: 130, y: 100 });
    });
    it('a lane being resized moves its end border live: the next lane gives the difference, the sum stays', () => {
        const { model, idlookup, nodes } = world({ nodes: { Vsales: { resizing: true, measured: { width: 870, height: 220 } } } });
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        expect(pick(out, 'Vsales')).toMatchObject({ y: 100, h: 220 });
        expect(pick(out, 'Vwarehouse')).toMatchObject({ y: 320, h: 140 });
        expect(pick(out, 'Vshop').h).toBe(360);
    });
    it('the floor holds the neighbour, and the last lane grows the pool', () => {
        const big = world({ nodes: { Vsales: { resizing: true, measured: { width: 870, height: 500 } } } });
        const o1 = applyContainerLayout(big.nodes, big.model, big.idlookup, null, new Set());
        expect(pick(o1, 'Vwarehouse').h).toBe(24);
        expect(pick(o1, 'Vsales').h).toBe(336);
        const last = world({ nodes: { Vwarehouse: { resizing: true, measured: { width: 870, height: 230 } } } });
        const o2 = applyContainerLayout(last.nodes, last.model, last.idlookup, null, new Set());
        expect(pick(o2, 'Vwarehouse').h).toBe(230);
        expect(pick(o2, 'Vshop').h).toBe(410);
    });
});
