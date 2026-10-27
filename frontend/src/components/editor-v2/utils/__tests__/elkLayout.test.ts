import { describe, it, expect, beforeEach } from 'vitest';
import type { Node, Edge } from '@xyflow/react';
import {
    buildElkGraph,
    computeElkAutoLayout,
    isElkRouteValid,
    fitRouteToEnds,
    setElkRoutes,
    getElkRoute,
    elkRoutesRevision,
    measureOutsideLabels,
    CLASS_VIEW_PROFILE,
    ELK_GRID,
    type ElkRoute,
    type ElkLayoutProfile,
    type ElkNodeLabelInput,
} from '../elkLayout';
import { DERIVED_NOTATIONS, DERIVED_LAYOUT_KEY } from '../../viewpoint/derive/notations';

// P-2026-10-01-2215 Phase 2: the toolbar auto-layout's ELK input, its routes, and the route store.
// The legacy computeElkLayout (onInit and the late-edge re-layout) is not under test here: it is unchanged.

const node = (id: string, extra: Partial<Node> = {}): Node => ({ id, position: { x: 0, y: 0 }, data: {}, ...extra });
const sized = (id: string, width: number, height: number, extra: Partial<Node> = {}): Node =>
    node(id, { measured: { width, height }, ...extra });
const edge = (id: string, source: string, target: string, type?: string): Edge => ({ id, source, target, ...(type ? { type } : {}) });

const rootOpt = (g: any, k: string) => g.layoutOptions?.[`elk.${k}`];
const childOf = (g: any, id: string) => g.children.find((c: any) => c.id === id);
const edgeOf = (g: any, id: string) => g.edges.find((e: any) => e.id === id);

describe('buildElkGraph: the input ELK receives', () => {
    it('real sizes: measured first, then the node width/height of the size contract, 180x120 last', () => {
        const g = buildElkGraph([
            sized('m', 44, 44, { width: 300, height: 300 }),
            node('w', { width: 7, height: 120 }),
            node('none'),
        ], []);
        expect([childOf(g, 'm').width, childOf(g, 'm').height]).toEqual([44, 44]);
        expect([childOf(g, 'w').width, childOf(g, 'w').height]).toEqual([7, 120]);
        expect([childOf(g, 'none').width, childOf(g, 'none').height]).toEqual([180, 120]);
    });

    it('hidden nodes (object-as-edge vertices) and the edges that touch them stay out; edges between visible nodes stay in', () => {
        const g = buildElkGraph(
            [sized('a', 100, 40), sized('b', 100, 40), sized('flowObj', 100, 40, { hidden: true })],
            [edge('irobj_f', 'a', 'b'), edge('own', 'flowObj', 'b')],
        );
        expect(g.children!.map((c: any) => c.id)).toEqual(['a', 'b']);
        expect(g.edges!.map((e: any) => e.id)).toEqual(['irobj_f']);
    });

    it('edge labels go in with their measured size, centre CENTER, target HEAD, source TAIL', () => {
        const g = buildElkGraph([sized('a', 100, 40), sized('b', 100, 40)], [edge('e', 'a', 'b')], {
            labelsOf: (id) => (id === 'e' ? [
                { kind: 'center', text: '[x < 2]', width: 94, height: 14 },
                { kind: 'target', text: '0..1', width: 22, height: 12 },
                { kind: 'source', text: 'N', width: 9, height: 12 },
            ] : undefined),
        });
        const labels = edgeOf(g, 'e').labels;
        expect(labels.map((l: any) => [l.text, l.width, l.height, l.layoutOptions['elk.edgeLabels.placement']])).toEqual([
            ['[x < 2]', 94, 14, 'CENTER'], ['0..1', 22, 12, 'HEAD'], ['N', 9, 12, 'TAIL'],
        ]);
    });

    it('model order is off, with and without a profile', () => {
        const nodes = [sized('a', 100, 40)];
        expect(rootOpt(buildElkGraph(nodes, []), 'layered.considerModelOrder.strategy')).toBe('NONE');
        expect(rootOpt(buildElkGraph(nodes, [], { profile: { direction: 'RIGHT' } }), 'layered.considerModelOrder.strategy')).toBe('NONE');
    });

    it('no profile keeps today\'s strategy: DOWN, NETWORK_SIMPLEX, spacing 100 and 120, inheritance reversed at priority 10', () => {
        const g = buildElkGraph([sized('child', 100, 40), sized('parent', 100, 40)], [edge('i', 'child', 'parent', 'inheritance')]);
        expect(rootOpt(g, 'direction')).toBe('DOWN');
        expect(rootOpt(g, 'layered.nodePlacement.strategy')).toBe('NETWORK_SIMPLEX');
        expect(rootOpt(g, 'spacing.nodeNode')).toBe('100');
        expect(rootOpt(g, 'layered.spacing.nodeNodeBetweenLayers')).toBe('120');
        expect(edgeOf(g, 'i').sources).toEqual(['parent']);
        expect(edgeOf(g, 'i').layoutOptions['elk.layered.priority.direction']).toBe('10');
    });

    it('a profile is honoured: direction, placement, spacing, layer constraints by role', () => {
        const profile: ElkLayoutProfile = {
            direction: 'RIGHT', nodePlacement: 'BRANDES_KOEPF', edgeRouting: 'POLYLINE',
            spacing: { node: 40, layer: 56 }, layerConstraints: { first: ['initial'], last: ['terminal'] },
        };
        const roles: Record<string, string> = { i: 'initial', f: 'terminal', a: 'node' };
        const g = buildElkGraph([sized('i', 20, 20), sized('a', 100, 40), sized('f', 24, 24)], [], { profile, roleOf: (id) => roles[id] });
        expect(rootOpt(g, 'direction')).toBe('RIGHT');
        expect(rootOpt(g, 'layered.nodePlacement.strategy')).toBe('BRANDES_KOEPF');
        expect(rootOpt(g, 'layered.nodePlacement.bk.fixedAlignment')).toBe('NONE');
        expect(rootOpt(g, 'edgeRouting')).toBe('POLYLINE');
        expect(rootOpt(g, 'spacing.nodeNode')).toBe('40');
        expect(rootOpt(g, 'layered.spacing.nodeNodeBetweenLayers')).toBe('56');
        expect(childOf(g, 'i').layoutOptions['elk.layered.layering.layerConstraint']).toBe('FIRST');
        expect(childOf(g, 'f').layoutOptions['elk.layered.layering.layerConstraint']).toBe('LAST');
        expect(childOf(g, 'a').layoutOptions?.['elk.layered.layering.layerConstraint']).toBeUndefined();
    });

    it('the stress profile asks for stress', () => {
        const g = buildElkGraph([sized('a', 100, 40)], [], { profile: { algorithm: 'stress', overlapRemoval: true } });
        expect(rootOpt(g, 'algorithm')).toBe('stress');
    });
});

describe('computeElkAutoLayout: positions and routes', () => {
    const chain = [sized('a', 100, 40), sized('b', 60, 30), sized('c', 100, 40)];
    const chainEdges = [edge('ab', 'a', 'b'), edge('bc', 'b', 'c')];

    it('every position on the 8 px grid', async () => {
        const r = await computeElkAutoLayout(chain, chainEdges, { profile: { direction: 'DOWN', spacing: { node: 37, layer: 53 } } });
        expect(ELK_GRID).toBe(8);
        for (const p of r.positions.values()) expect([p.x % 8, p.y % 8]).toEqual([0, 0]);
        expect(r.positions.size).toBe(3);
    });

    it('a hidden node gets no position', async () => {
        const r = await computeElkAutoLayout([...chain, sized('h', 100, 40, { hidden: true })], chainEdges);
        expect(r.positions.has('h')).toBe(false);
    });

    it('a route per edge, its sides from its own ends: DOWN gives bottom to top, RIGHT right to left', async () => {
        const down = await computeElkAutoLayout(chain, chainEdges, { profile: { direction: 'DOWN' } });
        const right = await computeElkAutoLayout(chain, chainEdges, { profile: { direction: 'RIGHT' } });
        for (const id of ['ab', 'bc']) {
            expect(down.routes.get(id)!.points.length).toBeGreaterThanOrEqual(2);
            expect([down.routes.get(id)!.sourceSide, down.routes.get(id)!.targetSide]).toEqual(['bottom', 'top']);
            expect([right.routes.get(id)!.sourceSide, right.routes.get(id)!.targetSide]).toEqual(['right', 'left']);
        }
    });

    it('the route carries the snapped rects of its two nodes', async () => {
        const r = await computeElkAutoLayout(chain, chainEdges);
        const route = r.routes.get('ab')!;
        const pa = r.positions.get('a')!; const pb = r.positions.get('b')!;
        expect(route.sourceRect).toEqual({ x: pa.x, y: pa.y, width: 100, height: 40 });
        expect(route.targetRect).toEqual({ x: pb.x, y: pb.y, width: 60, height: 30 });
    });

    it('an inheritance route runs child to parent, though ELK lays it out reversed', async () => {
        const r = await computeElkAutoLayout([sized('child', 100, 40), sized('parent', 100, 40)], [edge('i', 'child', 'parent', 'inheritance')]);
        const route = r.routes.get('i')!;
        const pc = r.positions.get('child')!; const pp = r.positions.get('parent')!;
        expect(pp.y).toBeLessThan(pc.y);
        const first = route.points[0]; const last = route.points[route.points.length - 1];
        expect(Math.abs(first.y - pc.y)).toBeLessThanOrEqual(ELK_GRID);
        expect(Math.abs(last.y - (pp.y + 40))).toBeLessThanOrEqual(ELK_GRID);
        expect([route.sourceSide, route.targetSide]).toEqual(['top', 'bottom']);
    });

    it('layer constraints by role: the initial comes first even when an edge points into it', async () => {
        const nodes = [sized('a', 100, 40), sized('b', 100, 40), sized('i', 20, 20), sized('f', 24, 24)];
        const edges = [edge('ab', 'a', 'b'), edge('bi', 'b', 'i'), edge('if', 'i', 'f')];
        const roles: Record<string, string> = { i: 'initial', f: 'terminal' };
        const h: Record<string, number> = { a: 40, b: 40, i: 20, f: 24 };
        // Same layer under DOWN: the two vertical bands overlap.
        const sameLayer = (r: typeof free, p: string, q: string) => {
            const yp = r.positions.get(p)!.y, yq = r.positions.get(q)!.y;
            return yp < yq + h[q] && yq < yp + h[p];
        };
        const free = await computeElkAutoLayout(nodes, edges, { profile: { direction: 'DOWN' } });
        expect(free.positions.get('i')!.y).toBeGreaterThan(free.positions.get('b')!.y);
        const bound = await computeElkAutoLayout(nodes, edges, { profile: { direction: 'DOWN', layerConstraints: { first: ['initial'], last: ['terminal'] } }, roleOf: (id) => roles[id] });
        const ys = (id: string) => bound.positions.get(id)!.y;
        // FIRST: the initial joins the first layer (with a, the other source), above b.
        expect(sameLayer(bound, 'i', 'a')).toBe(true);
        expect(ys('i')).toBeLessThan(ys('b'));
        // LAST: the terminal joins the last layer, below a.
        expect(sameLayer(bound, 'f', 'b')).toBe(true);
        expect(ys('f')).toBeGreaterThan(ys('a'));
    });

    it('the centre label comes back as a position on the route', async () => {
        const r = await computeElkAutoLayout(chain, chainEdges, { labelsOf: (id) => (id === 'ab' ? [{ kind: 'center', text: 'g', width: 40, height: 14 }] : undefined) });
        expect(r.routes.get('ab')!.centerLabel).toBeDefined();
        expect(r.routes.get('bc')!.centerLabel).toBeUndefined();
    });

    it('stress with overlap removal: no two boxes overlap, every route is a straight line', async () => {
        const nodes = Array.from({ length: 9 }, (_, i) => sized(`n${i}`, 120, 60));
        const edges = Array.from({ length: 8 }, (_, i) => edge(`e${i}`, 'n0', `n${i + 1}`));
        const r = await computeElkAutoLayout(nodes, edges, { profile: { algorithm: 'stress', overlapRemoval: true } });
        const rects = nodes.map((n) => ({ ...r.positions.get(n.id)!, w: 120, h: 60 }));
        for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
            const a = rects[i], b = rects[j];
            const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x); const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
            expect(ox > 0 && oy > 0, `${i} ${j}`).toBe(false);
        }
        for (const route of r.routes.values()) { expect(route.points.length).toBe(2); expect(route.orthogonal).toBe(false); expect(route.straight).toBe(true); }
        const layered = await computeElkAutoLayout(nodes, edges);
        for (const route of layered.routes.values()) expect(route.straight).toBeUndefined();
    });
});

// P-2026-10-03-1415 (R-VP-53): a vertex's outside labels are reserved in the toolbar auto-layout's ELK input.
describe('outside vertex labels: ELK reserves them, the positions stay the node boxes', () => {
    const lab = (anchor: ElkNodeLabelInput['anchor'], width: number, height: number, gap = 6, text = 't'): ElkNodeLabelInput => ({ anchor, text, width, height, gap });

    it('each goes in as an ELK node label with its measured size, placed outside on its anchor\'s side (mutation: a placement swapped)', () => {
        const labels: Record<string, ElkNodeLabelInput[]> = {
            n: [lab('n', 14, 16, 6, 't1')], s: [lab('s', 20, 17, 6, 'p1')], e: [lab('e', 30, 15, 6, 'x')], w: [lab('w', 31, 13, 6, 'y')],
        };
        const g = buildElkGraph(['n', 's', 'e', 'w'].map((id) => sized(id, 12, 56)), [], { outsideLabelsOf: (id) => labels[id] });
        const row = (id: string) => childOf(g, id).labels.map((l: any) => [l.text, l.width, l.height, l.layoutOptions['elk.nodeLabels.placement']]);
        expect(row('n')).toEqual([['t1', 14, 16, 'OUTSIDE V_TOP H_CENTER']]);
        expect(row('s')).toEqual([['p1', 20, 17, 'OUTSIDE V_BOTTOM H_CENTER']]);
        expect(row('e')).toEqual([['x', 30, 15, 'OUTSIDE H_RIGHT V_CENTER']]);
        expect(row('w')).toEqual([['y', 31, 13, 'OUTSIDE H_LEFT V_CENTER']]);
        // The node keeps its own size: the label is beside the box, not in it.
        expect([childOf(g, 'n').width, childOf(g, 'n').height]).toEqual([12, 56]);
    });

    it('the gap the label is painted at is the node\'s label spacing, the largest of its labels, rounded (mutation: the gap dropped or the smallest taken)', () => {
        const g = buildElkGraph([sized('a', 44, 44)], [], { outsideLabelsOf: () => [lab('s', 20, 17, 5.6), lab('n', 20, 17, 8.2)] });
        expect(childOf(g, 'a').layoutOptions['elk.spacing.individual']).toBe('elk.spacing.labelNode:8');
        // A label painted over its box (a negative distance) asks for no gap, never a negative one.
        const over = buildElkGraph([sized('a', 44, 44)], [], { outsideLabelsOf: () => [lab('s', 20, 17, -3)] });
        expect(childOf(over, 'a').layoutOptions['elk.spacing.individual']).toBe('elk.spacing.labelNode:0');
    });

    it('a label with no size stays out; a node without labels gets neither labels nor a spacing override', () => {
        const g = buildElkGraph([sized('a', 44, 44), sized('b', 44, 44)], [], { outsideLabelsOf: (id) => (id === 'a' ? [lab('s', 0, 16), lab('s', 20, 0)] : undefined) });
        for (const id of ['a', 'b']) {
            expect(childOf(g, id).labels, id).toBeUndefined();
            expect(childOf(g, id).layoutOptions?.['elk.spacing.individual'], id).toBeUndefined();
        }
    });

    it('a layer constraint and the labels coexist on one node (mutation: one overwrites the other)', () => {
        const g = buildElkGraph([sized('i', 20, 20)], [], {
            profile: { direction: 'RIGHT', layerConstraints: { first: ['initial'] } }, roleOf: () => 'initial', outsideLabelsOf: () => [lab('s', 20, 16)],
        });
        expect(childOf(g, 'i').layoutOptions['elk.layered.layering.layerConstraint']).toBe('FIRST');
        expect(childOf(g, 'i').layoutOptions['elk.spacing.individual']).toBe('elk.spacing.labelNode:6');
        expect(childOf(g, 'i').labels).toHaveLength(1);
    });

    it('the position mapped back is the node box, not the box with its label (mutation: the label\'s room read as the node)', async () => {
        const profile: ElkLayoutProfile = { direction: 'RIGHT' };
        const bare = await computeElkAutoLayout([sized('t', 12, 56)], [], { profile });
        // 18 high at 6 px, 60 wide on a 12 px bar: 24 above, 24 overhang on the left, both on the 8 px grid.
        const labelled = await computeElkAutoLayout([sized('t', 12, 56)], [], { profile, outsideLabelsOf: () => [lab('n', 60, 18, 6)] });
        expect(bare.positions.get('t')).toEqual({ x: 48, y: 48 });
        expect(labelled.positions.get('t')).toEqual({ x: 72, y: 72 });
    });

    it('a neighbour clears the label: two bars in one layer, the name above the lower one stays off the upper bar (mutation: labels not passed)', async () => {
        const nodes = [sized('p', 44, 44), sized('t1', 12, 56), sized('t2', 12, 56), sized('q', 44, 44)];
        const edges = [edge('a', 'p', 't1'), edge('b', 'p', 't2'), edge('c', 't1', 'q'), edge('d', 't2', 'q')];
        const profile: ElkLayoutProfile = { direction: 'RIGHT', spacing: { node: 8, layer: 40 } };
        const names: Record<string, ElkNodeLabelInput[]> = { t1: [lab('n', 40, 18, 6)], t2: [lab('n', 40, 18, 6)] };
        const overlaps = (r: Awaited<ReturnType<typeof computeElkAutoLayout>>) => ['t1', 't2'].some((id) => {
            const p = r.positions.get(id)!;
            const label = { x: p.x + 6 - 20, y: p.y - 6 - 18, w: 40, h: 18 };
            return nodes.some((n) => {
                if (n.id === id) return false;
                const q = r.positions.get(n.id)!; const w = n.measured!.width!, h = n.measured!.height!;
                return Math.min(label.x + label.w, q.x + w) - Math.max(label.x, q.x) > 0 && Math.min(label.y + label.h, q.y + h) - Math.max(label.y, q.y) > 0;
            });
        });
        expect(overlaps(await computeElkAutoLayout(nodes, edges, { profile }))).toBe(true);
        expect(overlaps(await computeElkAutoLayout(nodes, edges, { profile, outsideLabelsOf: (id) => names[id] }))).toBe(false);
    });
});

describe('outside labels: the declared side reserved, moved once when a route takes it (P-2026-10-03-1920, item 2)', () => {
    const lab = (anchor: ElkNodeLabelInput['anchor'], width = 20, height = 16, gap = 6, text = 't'): ElkNodeLabelInput => ({ anchor, text, width, height, gap });

    it('a route leaving the declared side: ELK runs again with the label on the free side (mutation: no second pass)', async () => {
        const r = await computeElkAutoLayout([sized('a', 44, 44), sized('b', 44, 44)], [edge('ab', 'a', 'b')],
            { profile: { direction: 'DOWN' }, outsideLabelsOf: (id) => (id === 'a' ? [lab('s')] : undefined) });
        expect(r.outsideAnchors?.get('a')).toEqual({ s: 'n' });
        expect(r.routes.get('ab')?.sourceSide).toBe('bottom');
        // The layout drawn is the second one: the room above a, as if the label were declared there.
        const above = await computeElkAutoLayout([sized('a', 44, 44), sized('b', 44, 44)], [edge('ab', 'a', 'b')],
            { profile: { direction: 'DOWN' }, outsideLabelsOf: (id) => (id === 'a' ? [lab('n')] : undefined) });
        expect([...r.positions]).toEqual([...above.positions]);
        expect(r.positions.get('a')!.y).toBeGreaterThan(48);
    });

    it('the declared side free after the layout: kept, one pass (mutation: the label always moved)', async () => {
        const r = await computeElkAutoLayout([sized('a', 44, 44), sized('b', 44, 44)], [edge('ab', 'a', 'b')],
            { profile: { direction: 'RIGHT' }, outsideLabelsOf: (id) => (id === 'a' ? [lab('s')] : undefined) });
        expect(r.outsideAnchors?.get('a')).toEqual({ s: 's' });
    });

    it('a label painted on a moved side is reserved on its declared one, read back through the node data (mutation: the painted side reserved)', async () => {
        const a = sized('a', 44, 44, { data: { irLabelAnchors: { s: 'n' } } });
        const r = await computeElkAutoLayout([a, sized('b', 44, 44)], [edge('ab', 'a', 'b')],
            { profile: { direction: 'RIGHT' }, outsideLabelsOf: (id) => (id === 'a' ? [lab('n')] : undefined) });
        expect(r.outsideAnchors?.get('a')).toEqual({ s: 's' });
    });
});

describe('measureOutsideLabels: the outside labels a node paints, as drawn', () => {
    // A stub of the canvas DOM, enough for the helper: the selectors it asks, the classes, the sizes and the rects.
    const rect = (left: number, top: number, width: number, height: number) => ({ left, top, width, height, right: left + width, bottom: top + height });
    const labelEl = (classes: string[], text: string, w: number, h: number, r: ReturnType<typeof rect>) =>
        ({ classList: { contains: (c: string) => classes.includes(c) }, textContent: ` ${text} `, offsetWidth: w, offsetHeight: h, getBoundingClientRect: () => r });
    const nodeEl = (id: string, w: number, h: number, r: ReturnType<typeof rect>, labels: unknown[], ink?: ReturnType<typeof rect>) => ({
        getAttribute: (k: string) => (k === 'data-id' ? id : null), offsetWidth: w, offsetHeight: h, getBoundingClientRect: () => r,
        querySelectorAll: (sel: string) => (sel === '.ir-node-content > .ir-label--outside' ? labels : []),
        // Q3: the ink of a turned bar, the element its outside labels are placed against.
        querySelector: (sel: string) => (sel === '.ir-node-content.ir-bar-ink' && ink ? { getBoundingClientRect: () => ink } : null),
    });
    const container = (nodes: unknown[]) => ({ querySelectorAll: (sel: string) => (sel === '.react-flow__node[data-id]' ? nodes : []) }) as unknown as ParentNode;

    it('size in flow units, the side from the anchor class, the gap from the rects divided by the zoom (mutations: a side, the zoom)', () => {
        // Zoom 2: the 12x56 bar is 24x112 on screen at (100, 200).
        const bar = rect(100, 200, 24, 112);
        const out = measureOutsideLabels(container([
            nodeEl('t1', 12, 56, bar, [
                labelEl(['ir-label', 'ir-label--outside', 'ir-label--anchor-n'], 't1', 14, 16, rect(98, 200 - 16 - 32, 28, 32)),
                labelEl(['ir-label', 'ir-label--outside', 'ir-label--anchor-e'], 'r', 8, 16, rect(124 + 12, 220, 16, 32)),
                labelEl(['ir-label', 'ir-label--outside', 'ir-label--anchor-s'], 'b', 8, 16, rect(100, 312 + 10, 16, 32)),
                labelEl(['ir-label', 'ir-label--outside', 'ir-label--anchor-w'], 'l', 8, 16, rect(100 - 4 - 16, 220, 16, 32)),
            ]),
            nodeEl('plain', 44, 44, rect(0, 0, 88, 88), []),
        ]));
        expect(out.get('t1')).toEqual([
            { anchor: 'n', text: 't1', width: 14, height: 16, gap: 8 },
            { anchor: 'e', text: 'r', width: 8, height: 16, gap: 6 },
            { anchor: 's', text: 'b', width: 8, height: 16, gap: 5 },
            { anchor: 'w', text: 'l', width: 8, height: 16, gap: 2 },
        ]);
        expect(out.has('plain')).toBe(false);
    });

    it('a turned bar (Q3): the gap is read from its ink, not from its square box (mutation: the box kept)', () => {
        // Zoom 1: a 56 x 56 box at (0, 0), its ink lying 56 x 12 at (0, 22); the name 8 px above the ink.
        const out = measureOutsideLabels(container([
            nodeEl('t1', 56, 56, rect(0, 0, 56, 56), [
                labelEl(['ir-label', 'ir-label--outside', 'ir-label--anchor-n'], 't1', 14, 16, rect(21, 22 - 8 - 16, 14, 16)),
            ], rect(0, 22, 56, 12)),
        ]));
        expect(out.get('t1')).toEqual([{ anchor: 'n', text: 't1', width: 14, height: 16, gap: 8 }]);
    });

    it('a label with no anchor class or no size is left out (mutation: the size guard dropped)', () => {
        const box = rect(0, 0, 44, 44);
        const out = measureOutsideLabels(container([
            nodeEl('p', 44, 44, box, [
                labelEl(['ir-label', 'ir-label--outside'], 'x', 10, 10, rect(0, 50, 10, 10)),
                labelEl(['ir-label', 'ir-label--outside', 'ir-label--anchor-s'], 'y', 0, 10, rect(0, 50, 0, 10)),
                labelEl(['ir-label', 'ir-label--outside', 'ir-label--anchor-s'], 'z', 10, 0, rect(0, 50, 10, 0)),
            ]),
        ]));
        expect(out.has('p')).toBe(false);
    });
});

describe('Activity (UML) junctions and the grid snap', () => {
    const flows = [
        { ...edge('f1', 'i', 'work'), data: { irActivityFlow: true, irJunctionTarget: { kind: 'merge', side: 'top', primary: true } } },
        { ...edge('f3', 'd', 'work'), data: { irActivityFlow: true, irJunctionTarget: { kind: 'merge', side: 'top', primary: false } } },
        edge('f2', 'work', 'd'),
    ] as Edge[];
    const nodes = [sized('i', 20, 20), sized('work', 142, 44), sized('d', 36, 36)];

    it('a merge becomes one diamond-sized node: the members end on it, a trunk runs from it to the action', () => {
        const g = buildElkGraph(nodes, flows);
        const j = g.children!.find((c: any) => c.id.includes('junction'))!;
        expect([j.width, j.height]).toEqual([28, 28]);
        expect(g.children!.filter((c: any) => c.id.includes('junction')).length).toBe(1);
        expect(edgeOf(g, 'f1').targets).toEqual([j.id]);
        expect(edgeOf(g, 'f3').targets).toEqual([j.id]);
        const trunk = g.edges!.find((e: any) => e.id.includes('trunk'))!;
        expect([trunk.sources, trunk.targets]).toEqual([[j.id], ['work']]);
    });

    it('a member\'s route ends at the junction with the junction\'s side, and the diamond gets no position', async () => {
        const r = await computeElkAutoLayout(nodes, flows, { profile: { direction: 'DOWN' } });
        expect([...r.positions.keys()].sort()).toEqual(['d', 'i', 'work']);
        const route = r.routes.get('f1')!;
        expect(route.targetSide).toBe('top');
        const w = r.positions.get('work')!;
        expect(route.points[route.points.length - 1].y).toBeLessThan(w.y - 20);
        expect(route.targetRect).toEqual({ x: w.x, y: w.y, width: 142, height: 44 });
    });

    it('the ends on real nodes follow the snap: on the snapped border, the route still axis-aligned', async () => {
        // Heights and spacing chosen so the second and third layers fall off the grid (141 and 222 before the snap).
        const h: Record<string, number> = { a: 43, b: 31, c: 29 };
        const chain = [sized('a', 101, 43), sized('b', 57, 31), sized('c', 70, 29)];
        const r = await computeElkAutoLayout(chain, [edge('ab', 'a', 'b'), edge('bc', 'b', 'c')], { profile: { direction: 'DOWN', spacing: { node: 37, layer: 50 } } });
        for (const [id, s, t] of [['ab', 'a', 'b'], ['bc', 'b', 'c']]) {
            const route = r.routes.get(id)!;
            const ps = r.positions.get(s)!, pt = r.positions.get(t)!;
            const first = route.points[0], last = route.points[route.points.length - 1];
            expect(Math.abs(first.y - (ps.y + h[s])), `${id} start`).toBeLessThanOrEqual(0.5);
            expect(Math.abs(last.y - pt.y), `${id} end`).toBeLessThanOrEqual(0.5);
            expect(route.points.every((p, i) => i === 0 || p.x === route.points[i - 1].x || p.y === route.points[i - 1].y), id).toBe(true);
        }
    });
});

describe('route invalidation', () => {
    const route: ElkRoute = {
        points: [{ x: 50, y: 100 }, { x: 50, y: 200 }], sourceSide: 'bottom', targetSide: 'top', orthogonal: true,
        sourceRect: { x: 0, y: 60, width: 100, height: 40 }, targetRect: { x: 0, y: 200, width: 100, height: 40 },
    };

    it('valid while both end nodes keep the rects it was computed for, within half a pixel', () => {
        expect(isElkRouteValid(route, { ...route.sourceRect }, { ...route.targetRect })).toBe(true);
        expect(isElkRouteValid(route, { ...route.sourceRect, x: 0.4 }, { ...route.targetRect, y: 199.6 })).toBe(true);
    });

    it('dropped when the source moves, the target moves, or either resizes', () => {
        expect(isElkRouteValid(route, { ...route.sourceRect, x: 1 }, route.targetRect)).toBe(false);
        expect(isElkRouteValid(route, { ...route.sourceRect, y: 59 }, route.targetRect)).toBe(false);
        expect(isElkRouteValid(route, route.sourceRect, { ...route.targetRect, x: -1 })).toBe(false);
        expect(isElkRouteValid(route, route.sourceRect, { ...route.targetRect, y: 201 })).toBe(false);
        expect(isElkRouteValid(route, { ...route.sourceRect, width: 101 }, route.targetRect)).toBe(false);
        expect(isElkRouteValid(route, route.sourceRect, { ...route.targetRect, height: 41 })).toBe(false);
    });
});

describe('fitRouteToEnds: the route meets the handles React Flow gives', () => {
    const axisAligned = (pts: { x: number; y: number }[]) => pts.every((p, i) => i === 0 || p.x === pts[i - 1].x || p.y === pts[i - 1].y);
    const base = { sourceRect: { x: 0, y: 0, width: 1, height: 1 }, targetRect: { x: 0, y: 0, width: 1, height: 1 } };

    it('an L keeps its corner: the bend takes x from the start and y from the end', () => {
        const r: ElkRoute = { ...base, points: [{ x: 50, y: 100 }, { x: 50, y: 150 }, { x: 200, y: 150 }], sourceSide: 'bottom', targetSide: 'left', orthogonal: true };
        expect(fitRouteToEnds(r, { x: 60, y: 104 }, { x: 196, y: 160 })).toEqual([{ x: 60, y: 104 }, { x: 60, y: 160 }, { x: 196, y: 160 }]);
    });

    it('a Z keeps its middle leg', () => {
        const r: ElkRoute = { ...base, points: [{ x: 50, y: 100 }, { x: 50, y: 150 }, { x: 120, y: 150 }, { x: 120, y: 200 }], sourceSide: 'bottom', targetSide: 'top', orthogonal: true };
        const out = fitRouteToEnds(r, { x: 54, y: 104 }, { x: 118, y: 196 });
        expect(out).toEqual([{ x: 54, y: 104 }, { x: 54, y: 150 }, { x: 118, y: 150 }, { x: 118, y: 196 }]);
        expect(axisAligned(out)).toBe(true);
    });

    it('a straight leg between offset handles gets a jog, still axis-aligned', () => {
        const r: ElkRoute = { ...base, points: [{ x: 50, y: 100 }, { x: 50, y: 200 }], sourceSide: 'bottom', targetSide: 'top', orthogonal: true };
        const out = fitRouteToEnds(r, { x: 60, y: 104 }, { x: 40, y: 196 });
        expect(out[0]).toEqual({ x: 60, y: 104 });
        expect(out[out.length - 1]).toEqual({ x: 40, y: 196 });
        expect(axisAligned(out)).toBe(true);
    });

    it('a straight leg between aligned handles stays two points', () => {
        const r: ElkRoute = { ...base, points: [{ x: 50, y: 100 }, { x: 50, y: 200 }], sourceSide: 'bottom', targetSide: 'top', orthogonal: true };
        expect(fitRouteToEnds(r, { x: 52, y: 104 }, { x: 52, y: 196 })).toEqual([{ x: 52, y: 104 }, { x: 52, y: 196 }]);
    });

    it('a polyline keeps its bends and takes the two ends', () => {
        const r: ElkRoute = { ...base, points: [{ x: 0, y: 0 }, { x: 30, y: 40 }, { x: 90, y: 50 }], sourceSide: 'right', targetSide: 'left', orthogonal: false };
        expect(fitRouteToEnds(r, { x: 2, y: 3 }, { x: 88, y: 52 })).toEqual([{ x: 2, y: 3 }, { x: 30, y: 40 }, { x: 88, y: 52 }]);
    });
});

describe('the route store', () => {
    const r = (x: number): ElkRoute => ({
        points: [{ x, y: 0 }, { x, y: 10 }], sourceSide: 'bottom', targetSide: 'top', orthogonal: true,
        sourceRect: { x: 0, y: 0, width: 1, height: 1 }, targetRect: { x: 0, y: 0, width: 1, height: 1 },
    });
    beforeEach(() => setElkRoutes(['s1', 's2', 'other'], new Map()));

    it('replaces the routes of the edges it is given, leaves the others, and bumps the revision', () => {
        setElkRoutes(['other'], new Map([['other', r(9)]]));
        const rev = elkRoutesRevision();
        setElkRoutes(['s1', 's2'], new Map([['s1', r(1)]]));
        expect(elkRoutesRevision()).toBeGreaterThan(rev);
        expect(getElkRoute('s1')!.points[0].x).toBe(1);
        expect(getElkRoute('s2')).toBeUndefined();
        expect(getElkRoute('other')!.points[0].x).toBe(9);
        setElkRoutes(['s1'], new Map());
        expect(getElkRoute('s1')).toBeUndefined();
        expect(getElkRoute('other')).toBeDefined();
    });
});

describe('the notation profiles (Q2), copied into the derived viewpoint', () => {
    const layoutOf = (id: string) => DERIVED_NOTATIONS.find((n) => n.id === id)?.layout;

    it('Flowchart and Activity (UML) run down, Petri net (classic) and Statechart (UML) right, ER (Chen) is stress with overlap removal', () => {
        expect(layoutOf('flowchart')?.direction).toBe('DOWN');
        expect(layoutOf('activityUml')?.direction).toBe('DOWN');
        expect(layoutOf('petriClassic')?.direction).toBe('RIGHT');
        // P-2026-10-03-1304 (Q1): its arcs on ELK's orthogonal routes, as Petri net's on the router.
        expect(layoutOf('petriClassic')?.edgeRouting).toBe('ORTHOGONAL');
        expect(layoutOf('statechart')?.direction).toBe('RIGHT');
        expect(layoutOf('erChen')).toMatchObject({ algorithm: 'stress', overlapRemoval: true });
        for (const id of ['flowchart', 'activityUml']) {
            expect(layoutOf(id)?.layerConstraints, id).toEqual({ first: ['initial'], last: ['terminal', 'activityFinal'] });
        }
        expect(layoutOf('statechart')?.layerConstraints).toEqual({ first: ['initial'], last: ['terminal'] });
    });

    it('a notation without a measured profile has none: today\'s strategy', () => {
        for (const id of ['generic', 'stateMachine', 'petri', 'flowchartIso']) expect(layoutOf(id), id).toBeUndefined();
    });

    it('the class view profile runs down with NETWORK_SIMPLEX', () => {
        expect(CLASS_VIEW_PROFILE).toMatchObject({ direction: 'DOWN', nodePlacement: 'NETWORK_SIMPLEX' });
    });

    it('the stored key reads back the profile', () => {
        expect(DERIVED_LAYOUT_KEY).toBe('derivedLayout');
        expect(JSON.parse(JSON.stringify(layoutOf('activityUml')))).toEqual(layoutOf('activityUml'));
    });
});

// P-2026-10-03-1304 (Q8 (i), A5): Brandes-Koepf takes the one alignment that gives the narrowest layout
// (`fixedAlignment: NONE`) instead of the average of the four (BALANCED), which pulled `work` 56 px off the
// main path of DemoFlowB (docs/discovery/discovery_2026-10-03_derived_notations_edges.md §3.8).
describe('Activity (UML) under its profile: the main path in one column', () => {
    const activity = DERIVED_NOTATIONS.find((n) => n.id === 'activityUml')!.layout!;
    const merge = (primary: boolean) => ({ irActivityFlow: true, irJunctionTarget: { kind: 'merge', side: 'top', primary } });
    // DemoFlowB as the probe measured it: the node sizes drawn, the two guard labels' boxes.
    const nodes = [
        sized('i0', 20, 20), sized('work', 142, 44), sized('d1', 36, 36), sized('fk', 120, 7),
        sized('left', 142, 44), sized('right', 142, 44), sized('jn', 120, 7), sized('fin', 24, 24),
    ];
    const flows = [
        { ...edge('f1', 'i0', 'work'), data: merge(true) }, edge('f2', 'work', 'd1'), { ...edge('f3', 'd1', 'work'), data: merge(false) },
        edge('f4', 'd1', 'fk'), edge('f5', 'fk', 'left'), edge('f6', 'fk', 'right'), edge('f7', 'left', 'jn'), edge('f8', 'right', 'jn'),
        edge('f9', 'jn', 'fin'),
    ] as Edge[];
    const roles: Record<string, string> = { i0: 'initial', fin: 'terminal' };
    const labels: Record<string, { kind: 'center'; text: string; width: number; height: number }[]> = {
        f3: [{ kind: 'center', text: '[model.[count] < 2]', width: 151, height: 21 }],
        f4: [{ kind: 'center', text: '[model.[count] >= 2]', width: 158, height: 21 }],
    };
    const centreX = (r: Awaited<ReturnType<typeof computeElkAutoLayout>>, id: string) =>
        r.positions.get(id)!.x + (nodes.find((n) => n.id === id)!.measured!.width as number) / 2;

    it('asks Brandes-Koepf for no fixed alignment, not the balanced average', () => {
        const g = buildElkGraph(nodes, flows, { profile: activity, roleOf: (id) => roles[id] });
        expect(rootOpt(g, 'layered.nodePlacement.bk.fixedAlignment')).toBe('NONE');
    });

    it('the centres of i0, work, d1, fork, join and final lie within 16 px across the flow (BALANCED: 60)', async () => {
        const r = await computeElkAutoLayout(nodes, flows, { profile: activity, roleOf: (id) => roles[id], labelsOf: (id) => labels[id] });
        const xs = ['i0', 'work', 'd1', 'fk', 'jn', 'fin'].map((id) => centreX(r, id));
        expect(Math.max(...xs) - Math.min(...xs), JSON.stringify(xs)).toBeLessThanOrEqual(16);
    });

    it('a leg ELK drew straight stays straight on the 8 px grid: the main path has no jog, the merge member lands on the action\'s centre', async () => {
        const r = await computeElkAutoLayout(nodes, flows, { profile: activity, roleOf: (id) => roles[id], labelsOf: (id) => labels[id] });
        for (const id of ['f1', 'f2', 'f4', 'f9']) {
            const pts = r.routes.get(id)!.points;
            expect(pts.length, `${id} ${JSON.stringify(pts)}`).toBe(2);
            expect(pts[0].x, id).toBe(pts[1].x);
        }
        // The merge diamond is drawn at the action's shared handle, its top centre (irJunctions.ts): f1 ends under it.
        expect(r.routes.get('f1')!.points[1].x).toBe(centreX(r, 'work'));
        // Every node still on the grid.
        for (const [id, p] of r.positions) expect([p.x % ELK_GRID, p.y % ELK_GRID], id).toEqual([0, 0]);
    });
});

describe('Q3 (P-2026-10-03-1304): ELK lays out the drawn bar, the box keeps its centre', () => {
    // A bar that declares a thickness: a 56 x 56 box, 12 px of ink, its orientation on the node data (irEdgeViews.ts).
    const bar = (id: string, orientation: 'upright' | 'lying' = 'upright') =>
        sized(id, 56, 56, { data: { irBarThickness: 12, irBarOrientation: orientation } });
    const DOWN: ElkLayoutProfile = { direction: 'DOWN', edgeRouting: 'ORTHOGONAL', nodePlacement: 'NETWORK_SIMPLEX' };
    const RIGHT: ElkLayoutProfile = { ...DOWN, direction: 'RIGHT' };

    it('the size ELK sees: across the direction (lying under DOWN, UP and no profile, upright under RIGHT and LEFT), the current orientation under stress', () => {
        const size = (profile: ElkLayoutProfile | null, o: 'upright' | 'lying' = 'upright') => {
            const c = childOf(buildElkGraph([bar('t', o)], [], { profile }), 't');
            return [c.width, c.height];
        };
        expect(size(DOWN)).toEqual([56, 12]);
        expect(size({ ...DOWN, direction: 'UP' })).toEqual([56, 12]);
        expect(size(null)).toEqual([56, 12]);
        expect(size(RIGHT, 'lying')).toEqual([12, 56]);
        expect(size({ ...DOWN, direction: 'LEFT' }, 'lying')).toEqual([12, 56]);
        expect(size({ algorithm: 'stress' }, 'upright')).toEqual([12, 56]);
        expect(size({ algorithm: 'stress' }, 'lying')).toEqual([56, 12]);
        // Anything else keeps its box, a bar without a thickness (a saved view) included.
        const g = buildElkGraph([sized('a', 56, 56), sized('b', 12, 56, { data: { irBarOrientation: 'lying' } })], [], { profile: DOWN });
        expect([childOf(g, 'a').width, childOf(g, 'a').height, childOf(g, 'b').width, childOf(g, 'b').height]).toEqual([56, 56, 12, 56]);
    });

    it('the same layout as the bar of before: every other node where it was, the ink where the old bar was, the box around it', async () => {
        const others = [sized('p1', 44, 44), sized('p2', 44, 44), sized('p3', 44, 44)];
        const edges = [edge('a1', 'p1', 't'), edge('a2', 't', 'p2'), edge('a3', 't', 'p3')];
        const old = await computeElkAutoLayout([...others, sized('t', 56, 12)], edges, { profile: DOWN });
        const now = await computeElkAutoLayout([...others, bar('t', 'upright')], edges, { profile: DOWN });
        for (const id of ['p1', 'p2', 'p3']) expect(now.positions.get(id), id).toEqual(old.positions.get(id));
        const o = old.positions.get('t')!, n = now.positions.get('t')!;
        // The ink (56 x 12, lying) is centred in the 56 x 56 box: its top-left is the box's plus (0, 22).
        expect({ x: n.x, y: n.y + 22 }).toEqual(o);
        // The routes are the old ones, point for point; their rects are the boxes, as React Flow measures them.
        for (const id of ['a1', 'a2', 'a3']) {
            expect(now.routes.get(id)!.points, id).toEqual(old.routes.get(id)!.points);
        }
        expect(now.routes.get('a2')!.sourceRect).toEqual({ x: n.x, y: n.y, width: 56, height: 56 });
    });

    it('a route records the orientation ELK laid each bar end out with; none on any other end', async () => {
        const res = await computeElkAutoLayout([sized('p1', 44, 44), bar('t', 'upright'), sized('p2', 44, 44)], [edge('a1', 'p1', 't'), edge('a2', 't', 'p2')], { profile: DOWN });
        expect(res.routes.get('a1')!.targetBar).toBe('lying');
        expect(res.routes.get('a1')!.sourceBar).toBeUndefined();
        expect(res.routes.get('a2')!.sourceBar).toBe('lying');
        const right = await computeElkAutoLayout([sized('p1', 44, 44), bar('t', 'lying')], [edge('a1', 'p1', 't')], { profile: RIGHT });
        expect(right.routes.get('a1')!.targetBar).toBe('upright');
    });

    it('route invalidation: a bar end that has turned since drops the route; no orientation passed, the rects alone decide', () => {
        const r: ElkRoute = {
            points: [{ x: 28, y: 34 }, { x: 28, y: 200 }], sourceSide: 'bottom', targetSide: 'top', orthogonal: true,
            sourceRect: { x: 0, y: 0, width: 56, height: 56 }, targetRect: { x: 6, y: 200, width: 44, height: 44 }, sourceBar: 'lying',
        };
        expect(isElkRouteValid(r, r.sourceRect, r.targetRect, { source: 'lying' })).toBe(true);
        expect(isElkRouteValid(r, r.sourceRect, r.targetRect, { source: 'upright' })).toBe(false);
        expect(isElkRouteValid(r, r.sourceRect, r.targetRect, {})).toBe(false);
        expect(isElkRouteValid(r, r.sourceRect, r.targetRect)).toBe(true);
        // A route with no bar end and a node that has become one: dropped too.
        const plain: ElkRoute = { ...r, sourceBar: undefined };
        expect(isElkRouteValid(plain, r.sourceRect, r.targetRect, { target: 'upright' })).toBe(false);
    });
});
