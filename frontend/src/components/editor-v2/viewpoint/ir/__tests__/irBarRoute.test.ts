/**
 * Q3 (P-2026-10-03-1304, docs/lir/lir_2026-10-03_bar_orientation.md): an ELK route records the orientation each bar end
 * was laid out with (elkLayout.ts); UnifiedEdge draws it only while the bar still stands that way.
 *
 * The bench of irA1Render.test.ts (`renderToStaticMarkup` in node, the joiner barrel and the canvas write-back mocked,
 * React Flow's node and edge hooks answering from `rf`).
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReactFlowProvider } from '@xyflow/react';

const rf: { nodes: Record<string, any>; edges: any[] } = { nodes: {}, edges: [] };

vi.mock('../../../../../joiner', () => ({
    store: { getState: () => ({ idlookup: {} }), subscribe: () => () => {}, dispatch: (a: unknown) => a },
    U: {},
    LPointerTargetable: { from: () => null, fromPointer: () => null, fromD: () => null, wrap: () => null },
}));
vi.mock('../../../sync/canvasToJjom', () => ({
    syncNodeLabel: () => {},
    syncUpdateFeatureValue: () => {},
    syncSetReferenceValue: () => {},
    syncEdgeRefProperty: () => {},
}));
vi.mock('../irResolve', () => ({ useIRRowView: () => null }));
vi.mock('@xyflow/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@xyflow/react')>();
    return {
        ...actual,
        EdgeLabelRenderer: ({ children }: { children?: unknown }) => createElement(Fragment, null, children as never),
        useReactFlow: () => ({ setEdges: () => {}, getNodes: () => Object.values(rf.nodes) }),
        useInternalNode: (id: string) => rf.nodes[id],
        useEdges: () => rf.edges,
    };
});

import UnifiedEdge from '../../../edges/UnifiedEdge';
import { setElkRoutes, type ElkRoute } from '../../../utils/elkLayout';

const H = 8;
/** A lying bar's box 56 x 56 at the origin, its ink 12 high in the middle; a place 44 x 44 below it. */
function scene(orientation: 'upright' | 'lying') {
    const barHandle = { id: 'bottom-0', type: 'source', nodeId: 'T', position: 'bottom', x: 28 - H / 2, y: 34 - H / 2, width: H, height: H };
    rf.nodes = {
        T: { id: 'T', position: { x: 0, y: 0 }, measured: { width: 56, height: 56 }, internals: { positionAbsolute: { x: 0, y: 0 }, handleBounds: { source: [barHandle], target: [] } }, data: { irBarThickness: 12, irBarOrientation: orientation } },
        P: { id: 'P', position: { x: 6, y: 200 }, measured: { width: 44, height: 44 }, internals: { positionAbsolute: { x: 6, y: 200 }, handleBounds: { source: [], target: [{ id: 'top-0', type: 'target', nodeId: 'P', position: 'top', x: 22 - H / 2, y: -H / 2, width: H, height: H }] } }, data: {} },
    };
    rf.edges = [{ id: 'a1', source: 'T', target: 'P', sourceHandle: 'bottom-0', targetHandle: 'top-0' }];
}
// A detour the router never draws, so the path says whose geometry it is.
const ROUTE: ElkRoute = {
    points: [{ x: 28, y: 34 }, { x: 28, y: 120 }, { x: 140, y: 120 }, { x: 140, y: 160 }, { x: 28, y: 160 }, { x: 28, y: 200 }],
    sourceSide: 'bottom', targetSide: 'top', orthogonal: true,
    sourceRect: { x: 0, y: 0, width: 56, height: 56 }, targetRect: { x: 6, y: 200, width: 44, height: 44 }, sourceBar: 'lying',
};
function renderA1(): string {
    const props = {
        id: 'a1', source: 'T', target: 'P', sourceX: 28, sourceY: 38, targetX: 28, targetY: 196,
        sourceHandleId: 'bottom-0', targetHandleId: 'top-0', selected: false, type: 'instanceRef',
        data: { irEdgeViewId: 'V_a', irObjectAsEdge: true, irSourceForm: 'bar' },
    } as any;
    return renderToStaticMarkup(createElement(ReactFlowProvider, { children: createElement(UnifiedEdge, props) }));
}
const pathD = (html: string) => html.match(/<path d="([^"]+)" fill="none" class="reference-edge/)?.[1] ?? '';

describe('UnifiedEdge: an ELK route on a turned bar', () => {
    it('drawn while the bar lies as ELK laid it out; dropped for the router once it has turned upright', () => {
        setElkRoutes(['a1'], new Map([['a1', ROUTE]]));
        scene('lying');
        expect(pathD(renderA1())).toContain('140');
        scene('upright');
        const d = pathD(renderA1());
        expect(d).not.toBe('');
        expect(d).not.toContain('140');
    });
});
