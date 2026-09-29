/**
 * View default size (P-2026-09-29-1230): the pure half of the rule, in nodeSizing.ts.
 * The hook (useContentSize.ts) only measures and writes; who owns the box, which axes
 * are usable and what box the default gives are decided here, so they run in the node
 * vitest env (nodeSizing -> shapeRegistry, no joiner, no window).
 */
import { describe, expect, it } from 'vitest';
import {
    SHAPE_MIN_SIZE, authoredDefaultSize, defaultBoxFor, sizeSourceOf, usableSizeAxis,
} from '../nodeSizing';
import { getShapeDescriptor, hasSizeSupplement } from '../../viewpoint/ir/shapeRegistry';

describe('usableSizeAxis', () => {
    it('keeps a finite positive number', () => {
        for (const v of [1, 24, 120, 120.5]) expect(usableSizeAxis(v)).toBe(v);
    });

    it('reads zero, a negative, a non-finite and a non-number as absent', () => {
        for (const v of [0, -5, NaN, Infinity, '120', null, undefined, {}]) expect(usableSizeAxis(v)).toBeUndefined();
    });
});

describe('authoredDefaultSize', () => {
    it('is undefined when the view has no default (absent key, empty object, not an object)', () => {
        for (const v of [undefined, null, {}, 120, '120x60', [120, 60]]) expect(authoredDefaultSize(v)).toBeUndefined();
    });

    it('is undefined when no axis is usable (a persisted bad value reads as absent)', () => {
        expect(authoredDefaultSize({ width: 0, height: -1 })).toBeUndefined();
    });

    it('keeps the usable axes only, without materializing the missing one', () => {
        expect(authoredDefaultSize({ width: 120, height: 60 })).toEqual({ width: 120, height: 60 });
        const one = authoredDefaultSize({ width: 120, height: -1 });
        expect(one).toEqual({ width: 120 });
        expect('height' in (one as object)).toBe(false);
    });
});

describe('defaultBoxFor', () => {
    const derived = { w: 150, h: 48 };

    it('both axes set: the default box, whatever the content says', () => {
        expect(defaultBoxFor({ width: 120, height: 60 }, derived, false)).toEqual({ w: 120, h: 60 });
    });

    it('one axis set: the other stays derived from content', () => {
        expect(defaultBoxFor({ width: 120 }, derived, false)).toEqual({ w: 120, h: 48 });
        expect(defaultBoxFor({ height: 60 }, derived, false)).toEqual({ w: 150, h: 60 });
    });

    it('below the minimum: clamped to the manual-resize floor, not to the derivation floor', () => {
        expect(SHAPE_MIN_SIZE).toBe(24);
        expect(defaultBoxFor({ width: 3, height: 10 }, derived, false)).toEqual({ w: 24, h: 24 });
        // Below the rect's derivation floor (140x40) is legal: an explicit size is not held to it.
        expect(defaultBoxFor({ width: 100, height: 30 }, derived, false)).toEqual({ w: 100, h: 30 });
    });

    it('a fixed-aspect form (circle) is squared on the larger authored axis', () => {
        const circle = getShapeDescriptor('circle');
        expect(circle.keepAspectRatio).toBe(true);
        expect(defaultBoxFor({ width: 100, height: 60 }, derived, circle.keepAspectRatio)).toEqual({ w: 100, h: 100 });
        // One axis on a circle: the authored side wins over the derived one.
        expect(defaultBoxFor({ width: 100 }, { w: 150, h: 150 }, true)).toEqual({ w: 100, h: 100 });
        expect(defaultBoxFor({ height: 10 }, { w: 150, h: 150 }, true)).toEqual({ w: 24, h: 24 });
    });
});

describe('sizeSourceOf: who owns the box of an IR vertex', () => {
    const rect = hasSizeSupplement(getShapeDescriptor('rect'));
    const ellipse = hasSizeSupplement(getShapeDescriptor('ellipse'));
    const defaults = { width: 120, height: 60 };

    it('an instance with no manual size takes the default, on any form', () => {
        expect(rect).toBe(false);
        expect(ellipse).toBe(true);
        expect(sizeSourceOf(false, rect, defaults)).toBe('default');
        expect(sizeSourceOf(false, ellipse, defaults)).toBe('default');
    });

    it('a manually resized instance keeps its size: the manual size beats the default', () => {
        expect(sizeSourceOf(true, rect, defaults)).toBe('manual');
        expect(sizeSourceOf(true, ellipse, defaults)).toBe('manual');
    });

    it('with no default nothing changes: derived on a supplement form, CSS content-hug otherwise', () => {
        expect(sizeSourceOf(false, ellipse, undefined)).toBe('derived');
        expect(sizeSourceOf(false, rect, undefined)).toBeNull();
        expect(sizeSourceOf(true, rect, undefined)).toBe('manual');
    });
});
