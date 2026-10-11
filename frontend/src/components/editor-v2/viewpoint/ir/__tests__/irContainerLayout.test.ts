/**
 * The S2 presentation passes of irContainment (P-2026-10-10-0105, R-GV-4, R-GV-6, R-GV-7): partitions applied to the
 * React Flow nodes in absolute coordinates, z-order of layout containers, and channel-edge suppression. Pure: the
 * containment model, the D-layer vertex records and the nodes are literals.
 */
import { describe, it, expect } from 'vitest';
import type { Edge, Node } from '@xyflow/react';
import {
    applyContainerLayout, LAYOUT_CONTAINER_Z, PARTITION_CONTENT_MARGIN, PARTITION_DASHED_CLASS, PARTITION_NEXT_CLASS, SELECTED_NODE_LIFT,
    suppressChannelEdges, type ContainmentModel,
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
        // The seed's 250 and the viewpoint's 220 both hold t1 (R-GV-17: a size under its child's need would grow).
        const idlookup = { ...base.idlookup, Vsales: { ...base.idlookup.Vsales, h: 250, layoutByViewpoint: { VP: { x: 0, y: 0, w: 200, h: 220, isResized: true } } } };
        const seedOut = applyContainerLayout(base.nodes, base.model, idlookup, null, new Set());
        expect(pick(seedOut, 'Vsales').h).toBe(250);
        const vpOut = applyContainerLayout(base.nodes, base.model, idlookup, 'VP', new Set());
        expect(pick(vpOut, 'Vsales').h).toBe(220);
        expect(pick(vpOut, 'Vwarehouse').y).toBe(320);
    });
    it('a lane not resized by hand takes its children span plus the margins', () => {
        const { model, idlookup, nodes } = world({ sales: { x: 0, y: 0, w: 200, h: 180, isResized: false }, shop: { x: 100, y: 100, w: 900, h: 100, isResized: true } });
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        // t1 is drawn 160..220, 60 px into Sales: Sales reaches the margin under it (R-GV-17), no longer its span plus
        // two margins from where it starts, which cut t1 (the bottom-margin ticket of P-2026-10-11-0040).
        expect(pick(out, 'Vsales').h).toBe(220 + PARTITION_CONTENT_MARGIN - 100);
        expect(pick(out, 'Vwarehouse').y).toBe(220 + PARTITION_CONTENT_MARGIN);
        expect(pick(out, 'Vshop').h).toBe(220 + PARTITION_CONTENT_MARGIN - 100 + 180);
    });
    it('a pool not resized by hand is as wide as its band plus the widest lane content', () => {
        const { model, idlookup, nodes } = world({ shop: { x: 100, y: 100, w: 900, h: 360, isResized: false } });
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        // Each lane starts at 130, past the pool's band, and reaches the margin past t's right edge (300 + 140); its own
        // 30 px band lies before t (P-2026-10-11-0040: no longer t's 140 plus the margins plus the band, which cut t).
        expect(pick(out, 'Vshop').w).toBe(30 + (300 + 140 + PARTITION_CONTENT_MARGIN - 130));
        expect(pick(out, 'Vshop').h).toBe(360);
    });
    it('a lane not sized by hand keeps the margin on its right, measured from where it starts (P-2026-10-11-0040)', () => {
        // t1 sits 27 px past Sales's band: its span plus two margins would leave 32 - 27 = 5 px on its right.
        const { model, idlookup, nodes } = world({ shop: { x: 100, y: 100, w: 900, h: 360, isResized: false },
            nodes: { Vt1: { position: { x: 187, y: 160 } }, Vt2: { position: { x: 176, y: 340 } } } });
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        const sales = pick(out, 'Vsales');
        expect(sales.x).toBe(130);
        expect(sales.x + sales.w! - (187 + 140)).toBe(PARTITION_CONTENT_MARGIN);
        expect(pick(out, 'Vwarehouse')).toMatchObject({ x: 130, w: sales.w });
        expect(pick(out, 'Vshop').w).toBe(30 + sales.w!);
        // The children do not move: the frame grows.
        expect(out.find(n => n.id === 'Vt1')).toBe(nodes.find(n => n.id === 'Vt1'));
    });
    it('a padded pool starts its lanes past its padding, and the margin on their right is measured from there', () => {
        const { model, idlookup, nodes } = world({ shop: { x: 100, y: 100, w: 900, h: 360, isResized: false },
            nodes: { Vt1: { position: { x: 197, y: 170 } }, Vt2: { position: { x: 186, y: 350 } } } });
        (model.containers.get('shop') as any).layout = { ...partitions(), padding: 10 };
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        const sales = pick(out, 'Vsales');
        expect(sales.x).toBe(140);
        expect(sales.x + sales.w! - (197 + 140)).toBe(PARTITION_CONTENT_MARGIN);
        expect(pick(out, 'Vshop').w).toBe(30 + 10 + sales.w! + 10);
    });
    it('a lane whose children sit closer to its start than the margin keeps the span plus the margins as its floor', () => {
        const { model, idlookup, nodes } = world({ shop: { x: 100, y: 100, w: 900, h: 360, isResized: false },
            nodes: { Vt1: { position: { x: 160, y: 160 } }, Vt2: { position: { x: 160, y: 340 } } } });
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        expect(pick(out, 'Vsales').w).toBe(140 + 2 * PARTITION_CONTENT_MARGIN + 30);
    });
    it('side by side, the margin past the children is kept on the cross axis, below them', () => {
        const { model, idlookup, nodes } = world({ shop: { x: 100, y: 100, w: 900, h: 100, isResized: false },
            nodes: { Vt1: { position: { x: 300, y: 157 } }, Vt2: { position: { x: 600, y: 146 } } } });
        (model.containers.get('shop') as any).layout = { mode: 'partitions', axis: 'horizontal', header: { side: 'n', size: 30 }, padding: 0 };
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        // The region starts under the band, at 130; t1 sits 27 px into it, 60 high.
        const sales = pick(out, 'Vsales');
        expect(sales.y).toBe(130);
        expect(sales.y + sales.h! - (157 + 60)).toBe(PARTITION_CONTENT_MARGIN);
        expect(pick(out, 'Vshop').h).toBe(30 + sales.h!);
    });
    it('follows the pool node where it is now (a drag in progress), not where its record says', () => {
        const { model, idlookup, nodes } = world({ nodes: { Vshop: { position: { x: 400, y: 50 } } } });
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        // The stack starts at the node, y 50; the lanes reach back left to their children, which no drag carried, and
        // Sales down past t1 (R-GV-17).
        expect(pick(out, 'Vsales')).toMatchObject({ x: 300 - PARTITION_CONTENT_MARGIN - 30, y: 50 });
        expect(pick(out, 'Vwarehouse')).toMatchObject({ x: 300 - PARTITION_CONTENT_MARGIN - 30, y: 220 + PARTITION_CONTENT_MARGIN });
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
        // t1 one band and one margin under the stack's start, so the lane's top meets its need (R-GV-17).
        const base = world({ sales: { x: 0, y: 0, w: 200, h: 180, isResized: false }, nodes: { Vt1: { position: { x: 300, y: 136 } } } });
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
        // The border stops at the margin over t2, the neighbour's child (R-GV-17: a resize never cuts a child).
        expect(pick(o1, 'Vwarehouse')).toMatchObject({ y: 340 - PARTITION_CONTENT_MARGIN, h: 460 - 340 + PARTITION_CONTENT_MARGIN });
        expect(pick(o1, 'Vsales').h).toBe(340 - PARTITION_CONTENT_MARGIN - 100);
        // With no child in the way the floor still holds the neighbour.
        const empty = world({ nodes: { Vsales: { resizing: true, measured: { width: 870, height: 500 } }, Vt2: { hidden: true } } });
        const o3 = applyContainerLayout(empty.nodes, empty.model, empty.idlookup, null, new Set());
        expect(pick(o3, 'Vwarehouse').h).toBe(24);
        expect(pick(o3, 'Vsales').h).toBe(336);
        const last = world({ nodes: { Vwarehouse: { resizing: true, measured: { width: 870, height: 230 } } } });
        const o2 = applyContainerLayout(last.nodes, last.model, last.idlookup, null, new Set());
        expect(pick(o2, 'Vwarehouse').h).toBe(230);
        expect(pick(o2, 'Vshop').h).toBe(410);
    });
});

/**
 * S2b (P-2026-10-10-0105, spec addendum §11): a UML statechart. Active (partitions, band on top, dashed separator) holds
 * the regions A1 and A2; A1 holds Waiting; A2 holds Running (free, `frame: 'self'`, band 28, padding 16) and Paused;
 * Running holds Fetch and Compute. Running's record sits far away: its place is its frame.
 */
function scWorld(opts: { frame?: boolean; nodes?: Partial<Record<string, Partial<Node>>>; recs?: Record<string, any> } = {}) {
    const band = { side: 'n' as const, size: 28 };
    const runLayout: CompiledContainmentLayout = { mode: 'free', axis: 'vertical', header: band, padding: 16, ...(opts.frame === false ? {} : { frame: 'self' as const }) };
    const model: ContainmentModel = {
        containers: new Map<string, any>([
            ['active', { objectId: 'active', vertexId: 'Vactive', collapsible: false, layout: { mode: 'partitions', axis: 'vertical', header: band, padding: 0, separator: 'dashed' } }],
            ['a1', { objectId: 'a1', vertexId: 'Va1', collapsible: false, layout: { mode: 'free', axis: 'vertical', header: null, padding: 0 } }],
            ['a2', { objectId: 'a2', vertexId: 'Va2', collapsible: false, layout: { mode: 'free', axis: 'vertical', header: null, padding: 0 } }],
            ['run', { objectId: 'run', vertexId: 'Vrun', collapsible: true, layout: runLayout }],
        ]),
        childrenOf: new Map([['active', ['a1', 'a2']], ['a1', ['w']], ['a2', ['run', 'p']], ['run', ['f', 'c']]]),
        parentOf: new Map([['a1', 'active'], ['a2', 'active'], ['w', 'a1'], ['run', 'a2'], ['p', 'a2'], ['f', 'run'], ['c', 'run']]),
        objByVertex: new Map(['active', 'a1', 'a2', 'w', 'run', 'p', 'f', 'c'].map(o => ['V' + o, o] as [string, string])),
        vertexByObj: new Map(['active', 'a1', 'a2', 'w', 'run', 'p', 'f', 'c'].map(o => [o, 'V' + o] as [string, string])),
    };
    const rec = (x: number, y: number, w: number, h: number, isResized = false) => ({ x, y, w, h, isResized });
    const idlookup: Record<string, any> = {
        Vactive: rec(100, 100, 200, 100), Va1: rec(0, 0, 200, 60), Va2: rec(0, 0, 200, 60), Vrun: rec(900, 900, 160, 60),
        Vw: rec(170, 144, 140, 60), Vp: rec(600, 266, 140, 60), Vf: rec(220, 280, 140, 60), Vc: rec(400, 280, 140, 60),
        ...(opts.recs ?? {}),
    };
    const node = (id: string): Node => {
        const r = idlookup[id];
        return { id, type: 'objectNode', position: { x: r.x, y: r.y }, data: {}, width: r.w, height: r.h, ...(opts.nodes?.[id] ?? {}) } as Node;
    };
    return { model, idlookup, nodes: ['Vactive', 'Va1', 'Va2', 'Vw', 'Vrun', 'Vp', 'Vf', 'Vc'].map(node) };
}
const scPick = (nodes: Node[], id: string) => {
    const n = nodes.find(m => m.id === id)!;
    return { x: n.position.x, y: n.position.y, w: n.width, h: n.height };
};
const classOf = (nodes: Node[], id: string) => nodes.find(m => m.id === id)!.className;

describe('applyContainerLayout: self-framing containers and separators (S2b)', () => {
    it('frames Running on its substates, padding and band, and sizes the region and the state around the frame', () => {
        const { model, idlookup, nodes } = scWorld();
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        expect(scPick(out, 'Vrun')).toEqual({ x: 204, y: 236, w: 352, h: 120 });
        // The regions start at Active's 100 and reach the margin past Paused's right edge, 600 + 140 (P-2026-10-11-0040).
        expect(scPick(out, 'Vactive')).toEqual({ x: 100, y: 100, w: 656, h: 272 });
        expect(scPick(out, 'Va1')).toEqual({ x: 100, y: 128, w: 656, h: 92 });
        expect(scPick(out, 'Va2')).toEqual({ x: 100, y: 220, w: 656, h: 152 });
        expect(out.find(n => n.id === 'Vrun')!.zIndex).toBe(LAYOUT_CONTAINER_Z + 2);
        // The substates stay where they are.
        expect(scPick(out, 'Vf')).toEqual({ x: 220, y: 280, w: 140, h: 60 });
    });
    it('without `frame: \'self\'` the container keeps its own box, and the region counts that box', () => {
        const { model, idlookup, nodes } = scWorld({ frame: false });
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        expect(scPick(out, 'Vrun')).toEqual({ x: 900, y: 900, w: 160, h: 60 });
        expect(scPick(out, 'Va2').w).toBe(1060 + PARTITION_CONTENT_MARGIN - 100);
    });
    it('draws the line between two regions dashed: every region but the last carries the dashed class', () => {
        const { model, idlookup, nodes } = scWorld();
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        expect(classOf(out, 'Va1')).toBe(PARTITION_DASHED_CLASS.vertical);
        expect(classOf(out, 'Va2')).toBe(PARTITION_NEXT_CLASS.vertical);
        const solid = scWorld();
        (solid.model.containers.get('active') as any).layout = { mode: 'partitions', axis: 'vertical', header: null, padding: 0 };
        const out2 = applyContainerLayout(solid.nodes, solid.model, solid.idlookup, null, new Set());
        expect(classOf(out2, 'Va1')).toBeUndefined();
        expect(classOf(out2, 'Va2')).toBe(PARTITION_NEXT_CLASS.vertical);
    });
    it('a collapsed frame keeps the top-left its hidden substates give it, at its own size', () => {
        const { model, idlookup, nodes } = scWorld();
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set(['f', 'c']));
        expect(scPick(out, 'Vrun')).toEqual({ x: 204, y: 236, w: 160, h: 60 });
    });
    it('a collapsed frame patches no size: a measure left from its open frame is not kept as its size', () => {
        const { model, idlookup, nodes } = scWorld({ nodes: { Vrun: { width: undefined, height: undefined, measured: { width: 352, height: 120 } } } });
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set(['f', 'c']));
        const run = out.find(n => n.id === 'Vrun')!;
        expect(run.position).toEqual({ x: 204, y: 236 });
        expect([run.width, run.height]).toEqual([undefined, undefined]);
    });
    it('a self-framing partition takes the place its parent\'s partitions give it, not its frame', () => {
        const { model, idlookup, nodes } = scWorld();
        (model.containers.get('a1') as any).layout = { mode: 'free', axis: 'vertical', header: null, padding: 0, frame: 'self' };
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        expect(scPick(out, 'Va1')).toEqual({ x: 100, y: 128, w: 656, h: 92 });
    });
    it('a frame with no child at all keeps its own box', () => {
        const { model, idlookup, nodes } = scWorld();
        model.childrenOf.set('run', []);
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        expect(scPick(out, 'Vrun')).toEqual({ x: 900, y: 900, w: 160, h: 60 });
    });
    it('Active dragged carries its regions, the frame inside and the substates by the same offset', () => {
        const { model, idlookup, nodes } = scWorld({ nodes: { Vactive: { position: { x: 140, y: 160 }, dragging: true } } });
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        expect(scPick(out, 'Va1')).toMatchObject({ x: 140, y: 188 });
        expect(scPick(out, 'Vrun')).toEqual({ x: 244, y: 296, w: 352, h: 120 });
        expect(scPick(out, 'Vf')).toMatchObject({ x: 260, y: 340 });
        expect(scPick(out, 'Vp')).toMatchObject({ x: 640, y: 326 });
        expect(scPick(out, 'Vw')).toMatchObject({ x: 210, y: 204 });
    });
    it('Running dragged from its frame carries its substates; a hidden one stays', () => {
        const { model, idlookup, nodes } = scWorld({ nodes: { Vrun: { position: { x: 230, y: 250 }, dragging: true } } });
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set(['c']));
        expect(scPick(out, 'Vrun')).toMatchObject({ x: 230, y: 250 });
        expect(scPick(out, 'Vf')).toMatchObject({ x: 246, y: 294 });
        expect(scPick(out, 'Vc')).toMatchObject({ x: 400, y: 280 });
    });
    it('a collapsed frame dragged follows the pointer', () => {
        const { model, idlookup, nodes } = scWorld({ nodes: { Vrun: { position: { x: 230, y: 250 }, dragging: true } } });
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set(['f', 'c']));
        expect(scPick(out, 'Vrun')).toEqual({ x: 230, y: 250, w: 160, h: 60 });
    });
    it('a frame dragged carries a partitions container inside it, its regions and their frames', () => {
        const { model, idlookup, nodes } = scWorld();
        model.containers.set('outer', { objectId: 'outer', vertexId: 'Vouter', collapsible: false, layout: { mode: 'free', axis: 'vertical', header: null, padding: 10, frame: 'self' } } as any);
        model.childrenOf.set('outer', ['active']);
        model.parentOf.set('active', 'outer');
        model.objByVertex.set('Vouter', 'outer');
        model.vertexByObj.set('outer', 'Vouter');
        idlookup.Vouter = { x: 0, y: 0, w: 50, h: 50, isResized: false };
        const at = (dragging: boolean) => applyContainerLayout(
            [...nodes, { id: 'Vouter', type: 'objectNode', position: dragging ? { x: 120, y: 130 } : { x: 0, y: 0 }, data: {}, dragging } as Node],
            model, idlookup, null, new Set());
        expect(scPick(at(false), 'Vouter')).toEqual({ x: 90, y: 90, w: 676, h: 292 });
        const out = at(true);
        expect(scPick(out, 'Vouter')).toEqual({ x: 120, y: 130, w: 676, h: 292 });
        expect(scPick(out, 'Vactive')).toEqual({ x: 130, y: 140, w: 656, h: 272 });
        expect(scPick(out, 'Va1')).toMatchObject({ x: 130, y: 168 });
        expect(scPick(out, 'Vrun')).toMatchObject({ x: 234, y: 276 });
    });
    it('drops a dashed class a node kept from an earlier pass when the layout no longer asks for it', () => {
        const { model, idlookup, nodes } = scWorld({ nodes: { Va1: { className: `keep ${PARTITION_DASHED_CLASS.vertical}` } } });
        (model.containers.get('active') as any).layout = { mode: 'partitions', axis: 'vertical', header: null, padding: 0 };
        expect(classOf(applyContainerLayout(nodes, model, idlookup, null, new Set()), 'Va1')).toBe('keep');
    });
    it('a selected container that holds layout containers gives back the lift React Flow adds; one that holds none keeps it', () => {
        const { model, idlookup, nodes } = scWorld({ nodes: { Vactive: { selected: true }, Va1: { selected: true }, Va2: { selected: true }, Vrun: { selected: true } } });
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        const z = (id: string) => out.find(n => n.id === id)!.zIndex!;
        // Active holds the regions, A2 holds Running: both stay under what they hold.
        expect(z('Vactive')).toBe(LAYOUT_CONTAINER_Z - SELECTED_NODE_LIFT);
        expect(z('Va2')).toBe(LAYOUT_CONTAINER_Z + 1 - SELECTED_NODE_LIFT);
        // A1 and Running hold states only: lifted by React Flow as any node, above their neighbours.
        expect(z('Va1')).toBe(LAYOUT_CONTAINER_Z + 1);
        expect(z('Vrun')).toBe(LAYOUT_CONTAINER_Z + 2);
        expect(SELECTED_NODE_LIFT).toBe(1000);
        const rest = scWorld();
        const out2 = applyContainerLayout(rest.nodes, rest.model, rest.idlookup, null, new Set());
        expect(out2.find(n => n.id === 'Vactive')!.zIndex).toBe(LAYOUT_CONTAINER_Z);
    });
    it('a frame being resized takes its live size as a floor; at rest, a size set by hand', () => {
        const live = scWorld({ nodes: { Vrun: { resizing: true, measured: { width: 500, height: 200 } } } });
        expect(scPick(applyContainerLayout(live.nodes, live.model, live.idlookup, null, new Set()), 'Vrun')).toEqual({ x: 204, y: 236, w: 500, h: 200 });
        const hand = scWorld({ recs: { Vrun: { x: 900, y: 900, w: 400, h: 100, isResized: true } } });
        expect(scPick(applyContainerLayout(hand.nodes, hand.model, hand.idlookup, null, new Set()), 'Vrun')).toEqual({ x: 204, y: 236, w: 400, h: 120 });
    });
});

/**
 * P-2026-10-11-1156 (R-GV-17): with the pointer inside its container, the frame follows a child on all four sides,
 * live and at rest; with the pointer outside (the node's centre outside the box the container had before the drag), it
 * does not chase it. A dragged container carries its descendants from where it is drawn at rest, not from its record.
 */
describe('applyContainerLayout: the frame follows a child on four sides (R-GV-17)', () => {
    it('a lane\'s child left of the lane moves the pool\'s origin left, its band with it; the children do not move', () => {
        const { model, idlookup, nodes } = world({ nodes: { Vt1: { position: { x: 120, y: 160 } } } });
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        expect(pick(out, 'Vshop')).toMatchObject({ x: 44, y: 100, w: 956, h: 360 });
        expect(pick(out, 'Vsales')).toMatchObject({ x: 74, y: 100, w: 926, h: 180 });
        expect(pick(out, 'Vwarehouse')).toMatchObject({ x: 74, y: 280, w: 926, h: 180 });
        for (const id of ['Vt1', 'Vt2']) expect(out.find(n => n.id === id)).toBe(nodes.find(n => n.id === id));
    });
    it('a first lane\'s child above it moves the pool\'s origin up; the bottom stays', () => {
        const { model, idlookup, nodes } = world({ nodes: { Vt1: { position: { x: 300, y: 90 } } } });
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        expect(pick(out, 'Vshop')).toMatchObject({ x: 100, y: 74, w: 900, h: 386 });
        expect(pick(out, 'Vsales')).toMatchObject({ y: 74, h: 206 });
        expect(pick(out, 'Vwarehouse')).toMatchObject({ y: 280, h: 180 });
    });
    it('a lane sized by hand grows past its size when a child needs it, and pushes the next lane down', () => {
        const { model, idlookup, nodes } = world({ nodes: { Vt1: { position: { x: 300, y: 240 } } } });
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        expect(pick(out, 'Vsales')).toMatchObject({ y: 100, h: 216 });
        expect(pick(out, 'Vwarehouse')).toMatchObject({ y: 316, h: 180 });
        expect(pick(out, 'Vshop')).toMatchObject({ y: 100, h: 396 });
    });
    it('a second lane\'s child above it grows that lane up, the first keeps its size and pushes the origin up', () => {
        const { model, idlookup, nodes } = world({ nodes: { Vt1: { position: { x: 300, y: 130 } }, Vt2: { position: { x: 300, y: 230 } } } });
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        expect(pick(out, 'Vsales')).toMatchObject({ y: 34, h: 180 });
        expect(pick(out, 'Vwarehouse')).toMatchObject({ y: 214, h: 246 });
        expect(pick(out, 'Vshop')).toMatchObject({ y: 34, h: 426 });
    });
    it('the pointer inside the lane: a dragged child is followed live', () => {
        const { model, idlookup, nodes } = world({ nodes: { Vt1: { position: { x: 300, y: 76 }, dragging: true } } });
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        expect(pick(out, 'Vshop')).toMatchObject({ y: 60, h: 400 });
    });
    it('the pointer outside the lane: the lane and the pool do not chase the dragged child', () => {
        const { model, idlookup, nodes } = world({ nodes: { Vt1: { position: { x: 300, y: -200 }, dragging: true } } });
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        expect(pick(out, 'Vshop')).toMatchObject({ x: 100, y: 100, w: 900, h: 360 });
        expect(pick(out, 'Vsales')).toMatchObject({ x: 130, y: 100, h: 180 });
    });
    it('the pointer outside a self frame: the frame keeps the box it had, the region around it too', () => {
        const { model, idlookup, nodes } = scWorld({ nodes: { Vf: { position: { x: 220, y: 700 }, dragging: true } } });
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        expect(scPick(out, 'Vrun')).toEqual({ x: 204, y: 236, w: 352, h: 120 });
        expect(scPick(out, 'Va2')).toMatchObject({ y: 220, h: 152 });
    });
    it('the pointer inside a self frame: the frame follows the dragged substate left (control: frames followed before)', () => {
        const { model, idlookup, nodes } = scWorld({ nodes: { Vf: { position: { x: 150, y: 280 }, dragging: true } } });
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        expect(scPick(out, 'Vrun')).toMatchObject({ x: 134, y: 236 });
        expect(scPick(out, 'Vactive')).toMatchObject({ x: 100 });
        expect(scPick(out, 'Vw')).toEqual({ x: 170, y: 144, w: 140, h: 60 });
    });
    it('a region\'s child left of the region moves the orthogonal state\'s origin left', () => {
        const { model, idlookup, nodes } = scWorld({ nodes: { Vw: { position: { x: 90, y: 144 } } } });
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        expect(scPick(out, 'Vactive')).toMatchObject({ x: 74, y: 100 });
        expect(scPick(out, 'Va1')).toMatchObject({ x: 74 });
        expect(scPick(out, 'Va2')).toMatchObject({ x: 74 });
    });
    it('a pool drawn left of its record carries its children by its move from where it is drawn', () => {
        const { model, idlookup, nodes } = world({ nodes: { Vt1: { position: { x: 120, y: 160 } }, Vshop: { position: { x: 54, y: 100 }, dragging: true } } });
        const out = applyContainerLayout(nodes, model, idlookup, null, new Set());
        expect(pick(out, 'Vt2')).toMatchObject({ x: 310, y: 340 });
        expect(pick(out, 'Vt1')).toMatchObject({ x: 130, y: 160 });
        // Its record moves with it: the far border of its size set by hand too (1000 + 10).
        expect(pick(out, 'Vshop')).toMatchObject({ x: 54, w: 1010 - 54 });
    });
});
