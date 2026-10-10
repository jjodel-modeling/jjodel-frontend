/**
 * irFrame (S2b, spec addendum 2026-10-10 §11): the box of a self-framing container, from its children's boxes.
 */
import { describe, it, expect } from 'vitest';
import { frameBox } from '../irFrame';

const r = (x: number, y: number, w: number, h: number) => ({ x, y, w, h });

describe('frameBox', () => {
    it('is the children\'s bounding box when nothing else is declared', () => {
        expect(frameBox({ children: [r(100, 50, 40, 20), r(200, 120, 60, 30)] })).toEqual(r(100, 50, 160, 100));
    });
    it('adds the padding on every side', () => {
        expect(frameBox({ children: [r(100, 50, 40, 20)], padding: 16 })).toEqual(r(84, 34, 72, 52));
    });
    it('adds a band on top (n) to the height, on the left (w) to the width, and starts the box before it', () => {
        expect(frameBox({ children: [r(100, 100, 40, 20)], padding: 10, header: { side: 'n', size: 28 } })).toEqual(r(90, 62, 60, 68));
        expect(frameBox({ children: [r(100, 100, 40, 20)], padding: 10, header: { side: 'w', size: 30 } })).toEqual(r(60, 90, 90, 40));
    });
    it('keeps a size set by hand as a floor, never below the children', () => {
        const kids = [r(100, 100, 40, 20)];
        expect(frameBox({ children: kids, stored: { w: 300, h: 200, isResized: true } })).toEqual(r(100, 100, 300, 200));
        expect(frameBox({ children: kids, stored: { w: 10, h: 10, isResized: true } })).toEqual(r(100, 100, 40, 20));
        expect(frameBox({ children: kids, stored: { w: 300, h: 200, isResized: false } })).toEqual(r(100, 100, 40, 20));
        expect(frameBox({ children: kids, stored: { w: 300, h: 5, isResized: true } })).toEqual(r(100, 100, 300, 20));
    });
    it('is null with no child, and skips a child with a non-finite box', () => {
        expect(frameBox({ children: [], padding: 16 })).toBeNull();
        expect(frameBox({ children: [r(NaN, 0, 10, 10)] })).toBeNull();
        expect(frameBox({ children: [r(NaN, 0, 10, 10), r(10, 10, 10, 10)] })).toEqual(r(10, 10, 10, 10));
    });
    it('reads a malformed padding or band as none, a negative child size as zero', () => {
        expect(frameBox({ children: [r(10, 10, 10, 10)], padding: -5, header: { side: 'x' as any, size: 20 } })).toEqual(r(10, 10, 10, 10));
        expect(frameBox({ children: [r(10, 10, -4, 10)] })).toEqual(r(10, 10, 0, 10));
    });
});
