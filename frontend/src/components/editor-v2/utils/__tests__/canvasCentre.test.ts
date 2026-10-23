/**
 * clientCentre — the point a palette click creates at (P-2026-10-21-1950, F3).
 *
 * A click hands `createFromPalette` the centre of the canvas element in client coordinates, the same space as a
 * drop's `clientX/Y`, so the drop path converts it with `screenToFlowPosition` and centres the node on it.
 */
import { describe, it, expect } from 'vitest';
import { clientCentre } from '../canvasCentre';

describe('clientCentre', () => {
    it('is the centre of an offset rect, in client coordinates', () => {
        expect(clientCentre({ left: 240, top: 96, width: 1000, height: 700 })).toEqual({ x: 740, y: 446 });
    });

    it('is the corner of a zero-size rect', () => {
        expect(clientCentre({ left: 12, top: 34, width: 0, height: 0 })).toEqual({ x: 12, y: 34 });
    });

    // The Properties+Tree overlay covers the right of the canvas (--jj-canvas-right-inset, P-2026-10-22-1325):
    // measured canvas 201..1599 under an overlay from 1200, inset 408.
    it('is the centre of the part the right inset leaves uncovered', () => {
        expect(clientCentre({ left: 201, top: 91, width: 1398, height: 876 }, 408)).toEqual({ x: 696, y: 529 });
    });

    it('clamps the inset to the width, and ignores a negative one', () => {
        expect(clientCentre({ left: 100, top: 0, width: 300, height: 10 }, 500)).toEqual({ x: 100, y: 5 });
        expect(clientCentre({ left: 100, top: 0, width: 300, height: 10 }, -50)).toEqual({ x: 250, y: 5 });
    });
});
