/**
 * The viewport at model open when the fit frames no node (ticket #419, P-2026-11-02-1856).
 *
 * The pane is the one measured on the harness (1238 x 776, overlay inset 368 px, `fitPadding()` with the inset:
 * 0.2 on top, bottom and left, `388px` on the right). Its visible part is x in [0, 870], y in [0, 776]; the padded
 * pane centre is ((103 + 1238 - 388) / 2, (64 + 776 - 64) / 2) = (476.5, 388).
 *
 * Mutation bench (P11), each run on the module and each killed:
 *   (m1) the inset dropped from the visible area dies on «a node only under the overlay is not in view»;
 *   (m2) the id tie-break dropped dies on «equal distances: the smaller id, in either order»;
 *   (m3) the in-view test on the padded area instead of the visible one dies on «a node in the left margin is in view».
 */
import { describe, expect, it } from 'vitest';
import { openViewportFallback, resolvePadding, type NodeRect } from '../openViewport';

const PANE = { width: 1238, height: 776, rightInset: 368 };
const PADDING = { top: 0.2, bottom: 0.2, left: 0.2, right: '388px' as const };
const CX = 476.5;
const CY = 388;

const rect = (id: string, x: number, y: number, w: number, h: number): NodeRect => ({ id, x, y, w, h });

describe('resolvePadding', () => {
    it('a relative number resolves per axis as xyflow 12.10.2 does', () => {
        expect(resolvePadding(0.2, 1238, 776)).toEqual({ top: 64, right: 103, bottom: 64, left: 103 });
    });

    it('a px string is floored and the same on every side', () => {
        expect(resolvePadding('30.7px', 1238, 776)).toEqual({ top: 30, right: 30, bottom: 30, left: 30 });
    });

    it('the object form resolves each side on its own axis', () => {
        expect(resolvePadding(PADDING, 1238, 776)).toEqual({ top: 64, right: 388, bottom: 64, left: 103 });
    });

    it('a missing side is 0', () => {
        expect(resolvePadding({ top: '10px' }, 1238, 776)).toEqual({ top: 10, right: 0, bottom: 0, left: 0 });
    });
});

describe('openViewportFallback', () => {
    it('no node: nothing to move', () => {
        expect(openViewportFallback([], { x: 0, y: 0, zoom: 1 }, PANE, PADDING)).toBeNull();
    });

    it('a pane with no size: nothing to move', () => {
        const rects = [rect('a', 5000, 5000, 100, 50)];
        expect(openViewportFallback(rects, { x: 0, y: 0, zoom: 1 }, { width: 0, height: 0, rightInset: 0 }, 0.2)).toBeNull();
    });

    it('a node in view: nothing to move', () => {
        const rects = [rect('a', 0, 0, 100, 50), rect('b', 9000, 9000, 100, 50)];
        expect(openViewportFallback(rects, { x: 10, y: 10, zoom: 1 }, PANE, PADDING)).toBeNull();
    });

    it('an unmeasured node counts by its position', () => {
        const rects = [rect('a', 100, 100, 0, 0), rect('b', 9000, 9000, 100, 50)];
        expect(openViewportFallback(rects, { x: 0, y: 0, zoom: 1 }, PANE, PADDING)).toBeNull();
    });

    it('a node in the left margin is in view (the visible area, not the padded one)', () => {
        // Screen x in [10, 60], left of the 103 px padding, y in the middle of the pane.
        const rects = [rect('a', 10, 300, 50, 40), rect('b', 9000, 9000, 100, 50)];
        expect(openViewportFallback(rects, { x: 0, y: 0, zoom: 1 }, PANE, PADDING)).toBeNull();
    });

    it('a node only under the overlay is not in view', () => {
        // Screen x in [900, 1000]: inside the pane, past its visible right edge 870.
        const rects = [rect('a', 900, 100, 100, 40)];
        expect(openViewportFallback(rects, { x: 0, y: 0, zoom: 1 }, PANE, PADDING)).toEqual({ x: CX - 950, y: CY - 120, zoom: 1 });
    });

    it('no node in view: the node nearest the box centre goes to the padded pane centre, same zoom', () => {
        // Box [0, 1100] x [0, 2100], centre (550, 1050). a and b are 450 x 950 away, c only 950 below.
        const rects = [rect('a', 0, 0, 100, 100), rect('b', 1000, 0, 100, 100), rect('c', 450, 2000, 100, 100)];
        expect(openViewportFallback(rects, { x: 5000, y: 5000, zoom: 0.5 }, PANE, PADDING)).toEqual({
            x: CX - 500 * 0.5, y: CY - 2050 * 0.5, zoom: 0.5,
        });
    });

    it('the distance is to the node rect, 0 inside it, not to its centre', () => {
        // Box [0, 1010]^2, centre (505, 505): inside big (centre 318 away), 120 from small (centre 134 away).
        const rects = [rect('c1', 0, 0, 10, 10), rect('big', 450, 450, 560, 560), rect('small', 400, 400, 20, 20)];
        expect(openViewportFallback(rects, { x: 5000, y: 5000, zoom: 1 }, PANE, PADDING)).toEqual({ x: CX - 730, y: CY - 730, zoom: 1 });
    });

    it('equal distances: the smaller id, in either order', () => {
        // Box [0, 1100] x [0, 100], centre (550, 50): a and b both 450 away.
        const a = rect('a', 0, 0, 100, 100);
        const b = rect('b', 1000, 0, 100, 100);
        const want = { x: CX - 50, y: CY - 50, zoom: 1 };
        expect(openViewportFallback([b, a], { x: -5000, y: 0, zoom: 1 }, PANE, PADDING)).toEqual(want);
        expect(openViewportFallback([a, b], { x: -5000, y: 0, zoom: 1 }, PANE, PADDING)).toEqual(want);
    });

    it('the fallback puts its anchor in view', () => {
        const rects = [rect('a', 0, 0, 100, 100), rect('b', 1000, 0, 100, 100), rect('c', 450, 2000, 100, 100)];
        const next = openViewportFallback(rects, { x: 5000, y: 5000, zoom: 0.5 }, PANE, PADDING)!;
        expect(openViewportFallback(rects, next, PANE, PADDING)).toBeNull();
    });
});
