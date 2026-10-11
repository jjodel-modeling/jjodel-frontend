/**
 * irPartitions (R-GV-7, spec addendum 2026-10-10 §7): the geometry of partitions in a graphVertex, BPMN lanes in a pool.
 * Pure: every case is a literal input and the exact boxes it must produce.
 */
import { describe, it, expect } from 'vitest';
import { layoutPartitions, MIN_PARTITION_EXTENT, partitionExtent, resizePartitionBorder } from '../irPartitions';

describe('partitionExtent', () => {
    it('takes the stored size of a partition resized by hand, even under the floor', () => {
        expect(partitionExtent({ stored: 140, isResized: true, content: 60 })).toBe(140);
        expect(partitionExtent({ stored: 10, isResized: true, content: 60 })).toBe(10);
    });
    it('takes the content, floored, when not resized, whatever is stored', () => {
        expect(partitionExtent({ stored: 140, isResized: false, content: 60 })).toBe(60);
        expect(partitionExtent({ stored: 140, content: 60 })).toBe(60);
        expect(partitionExtent({ content: 5 })).toBe(MIN_PARTITION_EXTENT);
        expect(partitionExtent({})).toBe(MIN_PARTITION_EXTENT);
        expect(partitionExtent({ content: 5 }, 40)).toBe(40);
    });
    it('falls back to the content when a resized partition stores nothing usable', () => {
        expect(partitionExtent({ stored: 0, isResized: true, content: 70 })).toBe(70);
        expect(partitionExtent({ stored: Number.NaN, isResized: true, content: 70 })).toBe(70);
    });
});

describe('layoutPartitions — vertical, header on the left (the BPMN pool)', () => {
    const pool = (extra: any = {}) => layoutPartitions({
        container: { x: 100, y: 50 },
        header: { side: 'w', size: 30 },
        partitions: [{ content: 80, contentCross: 200 }, { content: 120, contentCross: 260 }],
        ...extra,
    });
    it('stacks the lanes top to bottom across the full inner width, the band on the left', () => {
        const l = pool();
        expect(l.container).toEqual({ x: 100, y: 50, w: 290, h: 200 });
        expect(l.header).toEqual({ x: 100, y: 50, w: 30, h: 200 });
        expect(l.partitions).toEqual([
            { x: 130, y: 50, w: 260, h: 80 },
            { x: 130, y: 130, w: 260, h: 120 },
        ]);
        expect(l.extents).toEqual([80, 120]);
    });
    it('insets the lanes by the padding on both sides of both axes', () => {
        const l = pool({ padding: 10 });
        expect(l.container).toEqual({ x: 100, y: 50, w: 310, h: 220 });
        expect(l.partitions).toEqual([
            { x: 140, y: 60, w: 260, h: 80 },
            { x: 140, y: 140, w: 260, h: 120 },
        ]);
    });
    it('gives the slack of a pool resized taller to the last lane only', () => {
        const l = pool({ container: { x: 100, y: 50, w: 400, h: 260, isResized: true } });
        expect(l.container).toEqual({ x: 100, y: 50, w: 400, h: 260 });
        expect(l.extents).toEqual([80, 180]);
        expect(l.partitions[0]).toEqual({ x: 130, y: 50, w: 370, h: 80 });
        expect(l.partitions[1]).toEqual({ x: 130, y: 130, w: 370, h: 180 });
    });
    it('never shrinks a resized pool below what its lanes need', () => {
        const l = pool({ container: { x: 0, y: 0, w: 100, h: 100, isResized: true } });
        expect(l.container).toEqual({ x: 0, y: 0, w: 290, h: 200 });
    });
    it('ignores the stored box of a pool that was not resized', () => {
        const l = pool({ container: { x: 100, y: 50, w: 900, h: 900 } });
        expect(l.container).toEqual({ x: 100, y: 50, w: 290, h: 200 });
        expect(l.extents).toEqual([80, 120]);
    });
    it('floors the pool at its own content', () => {
        const l = pool({ container: { x: 100, y: 50, contentW: 500, contentH: 300 } });
        expect(l.container).toEqual({ x: 100, y: 50, w: 500, h: 300 });
        expect(l.extents).toEqual([80, 220]);
        expect(l.partitions[1].w).toBe(470);
    });
    it('takes a hand-resized lane height as its extent', () => {
        const l = layoutPartitions({
            container: { x: 0, y: 0 }, header: { side: 'w', size: 30 },
            partitions: [{ stored: 150, isResized: true, content: 80 }, { content: 10 }],
        });
        expect(l.extents).toEqual([150, MIN_PARTITION_EXTENT]);
        expect(l.container.h).toBe(150 + MIN_PARTITION_EXTENT);
    });
});

describe('layoutPartitions — other axes and bands', () => {
    it('stacks three lanes, each starting where the previous one ends', () => {
        const l = layoutPartitions({
            container: { x: 0, y: 0 }, partitions: [{ content: 40 }, { content: 50 }, { content: 60 }],
        });
        expect(l.partitions.map(r => r.y)).toEqual([0, 40, 90]);
        expect(l.container.h).toBe(150);
    });
    it('a band on top of a vertical stack adds to the height, not the width', () => {
        const l = layoutPartitions({
            container: { x: 0, y: 0 }, header: { side: 'n', size: 20 },
            partitions: [{ content: 50, contentCross: 100 }, { content: 60, contentCross: 90 }],
        });
        expect(l.container).toEqual({ x: 0, y: 0, w: 100, h: 130 });
        expect(l.header).toEqual({ x: 0, y: 0, w: 100, h: 20 });
        expect(l.partitions).toEqual([
            { x: 0, y: 20, w: 100, h: 50 },
            { x: 0, y: 70, w: 100, h: 60 },
        ]);
    });
    it('a horizontal stack runs left to right and a band on top adds to the height', () => {
        const l = layoutPartitions({
            container: { x: 10, y: 20 }, axis: 'horizontal', header: { side: 'n', size: 30 },
            partitions: [{ content: 70, contentCross: 150 }, { content: 90, contentCross: 120 }],
        });
        expect(l.container).toEqual({ x: 10, y: 20, w: 160, h: 180 });
        expect(l.header).toEqual({ x: 10, y: 20, w: 160, h: 30 });
        expect(l.partitions).toEqual([
            { x: 10, y: 50, w: 70, h: 150 },
            { x: 80, y: 50, w: 90, h: 150 },
        ]);
    });
    it('a horizontal stack with a band on the left adds the band to the width and gives slack to the last', () => {
        const l = layoutPartitions({
            container: { x: 0, y: 0, w: 300, h: 50, isResized: true }, axis: 'horizontal', header: { side: 'w', size: 40 },
            partitions: [{ content: 100, contentCross: 80 }, { content: 60, contentCross: 70 }],
        });
        expect(l.container).toEqual({ x: 0, y: 0, w: 300, h: 80 });
        expect(l.extents).toEqual([100, 160]);
        expect(l.partitions).toEqual([
            { x: 40, y: 0, w: 100, h: 80 },
            { x: 140, y: 0, w: 160, h: 80 },
        ]);
    });
    it('no band and no partitions: the container keeps its content box', () => {
        const l = layoutPartitions({ container: { x: 5, y: 6, contentW: 40, contentH: 30 }, partitions: [] });
        expect(l).toEqual({ container: { x: 5, y: 6, w: 40, h: 30 }, header: null, partitions: [], extents: [] });
    });
    it('a malformed band or padding reads as none', () => {
        const l = layoutPartitions({
            container: { x: 0, y: 0 }, header: { side: 'e' as any, size: 30 }, padding: -5,
            partitions: [{ content: 50, contentCross: 100 }],
        });
        expect(l.header).toBeNull();
        expect(l.container).toEqual({ x: 0, y: 0, w: 100, h: 50 });
    });
});

describe('resizePartitionBorder (paired border, sum constant)', () => {
    it('moves the border: the upper partition grows, the lower shrinks, the sum is kept', () => {
        expect(resizePartitionBorder([80, 120, 60], 0, 30)).toEqual([110, 90, 60]);
        expect(resizePartitionBorder([80, 120, 60], 1, -50)).toEqual([80, 70, 110]);
    });
    it('clamps so that neither neighbour goes under the floor', () => {
        expect(resizePartitionBorder([80, 120], 0, 500)).toEqual([176, MIN_PARTITION_EXTENT]);
        expect(resizePartitionBorder([80, 120], 0, -500)).toEqual([MIN_PARTITION_EXTENT, 176]);
        expect(resizePartitionBorder([80, 120], 0, 50, 100)).toEqual([100, 100]);
    });
    it('moves nothing when the two neighbours are already under the floor together', () => {
        expect(resizePartitionBorder([10, 10], 0, 5)).toEqual([10, 10]);
    });
    it('returns a copy for an out-of-range border, and never mutates its input', () => {
        const input = [80, 120];
        expect(resizePartitionBorder(input, 1, 10)).toEqual([80, 120]);
        expect(resizePartitionBorder(input, -1, 10)).toEqual([80, 120]);
        expect(resizePartitionBorder(input, 0.5, 10)).toEqual([80, 120]);
        const out = resizePartitionBorder(input, 0, 10);
        expect(out).toEqual([90, 110]);
        expect(input).toEqual([80, 120]);
        expect(out).not.toBe(input);
    });
    it('reads a non-finite delta as no move', () => {
        expect(resizePartitionBorder([80, 120], 0, Number.NaN)).toEqual([80, 120]);
    });
});

/**
 * P-2026-10-11-1156 (R-GV-17): a partition that knows the box its children need (`cover`, absolute, its band and the
 * margin included) is drawn around it on all four sides. Growing left or up moves the container's origin and keeps its
 * far border; a size set by hand is a floor, never a ceiling; growth along the stack goes to the partition and pushes
 * the next ones down, growth against the stack pushes the earlier ones and the origin up. The children are not inputs
 * of the stack beyond their box, so they cannot move.
 */
describe('layoutPartitions — cover: the frame follows its children on four sides', () => {
    // The BPMN fixture: Shop at (100, 100) sized by hand 900 x 360, band w 30; Sales and Warehouse sized by hand 180.
    const pool = (sales: { x0: number; y0: number; x1: number; y1: number }, warehouse = { x0: 484, y0: 324, x1: 656, y1: 416 }, container: any = { x: 100, y: 100, w: 900, h: 360, isResized: true }) =>
        layoutPartitions({
            container, header: { side: 'w', size: 30 },
            partitions: [{ stored: 180, isResized: true, content: 92, cover: sales }, { stored: 180, isResized: true, content: 92, cover: warehouse }],
        });
    it('inside the boxes it had, nothing moves: the cover only adds where the children need it', () => {
        const l = pool({ x0: 274, y0: 144, x1: 456, y1: 236 });
        expect(l.container).toEqual({ x: 100, y: 100, w: 900, h: 360 });
        expect(l.partitions).toEqual([{ x: 130, y: 100, w: 870, h: 180 }, { x: 130, y: 280, w: 870, h: 180 }]);
    });
    it('a child past the left border moves the origin left, the band with it; the right border stays', () => {
        const l = pool({ x0: 100, y0: 144, x1: 466, y1: 236 });
        expect(l.container).toEqual({ x: 70, y: 100, w: 930, h: 360 });
        expect(l.header).toEqual({ x: 70, y: 100, w: 30, h: 360 });
        expect(l.partitions).toEqual([{ x: 100, y: 100, w: 900, h: 180 }, { x: 100, y: 280, w: 900, h: 180 }]);
    });
    it('a child past the right border grows the pool past the size set by hand: a floor, never a ceiling', () => {
        const l = pool({ x0: 274, y0: 144, x1: 1040, y1: 236 });
        expect(l.container).toEqual({ x: 100, y: 100, w: 940, h: 360 });
        expect(l.partitions[1]).toEqual({ x: 130, y: 280, w: 910, h: 180 });
    });
    it('a child above the first partition moves the origin up; its bottom and the next partition stay', () => {
        const l = pool({ x0: 274, y0: 60, x1: 456, y1: 236 });
        expect(l.container).toEqual({ x: 100, y: 60, w: 900, h: 400 });
        expect(l.partitions).toEqual([{ x: 130, y: 60, w: 870, h: 220 }, { x: 130, y: 280, w: 870, h: 180 }]);
    });
    it('a child below a partition sized by hand grows it past its size and pushes the next one down, size kept', () => {
        const l = pool({ x0: 274, y0: 144, x1: 456, y1: 300 });
        expect(l.extents).toEqual([200, 180]);
        expect(l.partitions).toEqual([{ x: 130, y: 100, w: 870, h: 200 }, { x: 130, y: 300, w: 870, h: 180 }]);
        expect(l.container).toEqual({ x: 100, y: 100, w: 900, h: 380 });
    });
    it('a child above the second partition grows it up; the first keeps its size and pushes the origin up', () => {
        const l = pool({ x0: 274, y0: 114, x1: 456, y1: 206 }, { x0: 484, y0: 214, x1: 656, y1: 416 });
        expect(l.partitions).toEqual([{ x: 130, y: 34, w: 870, h: 180 }, { x: 130, y: 214, w: 870, h: 246 }]);
        expect(l.container).toEqual({ x: 100, y: 34, w: 900, h: 426 });
    });
    it('a partition not sized by hand reaches the margin past its lowest child wherever the stack starts it', () => {
        const l = layoutPartitions({
            container: { x: 100, y: 100 }, header: { side: 'w', size: 30 },
            partitions: [{ content: 92, cover: { x0: 274, y0: 144, x1: 456, y1: 236 } }, { content: 92, cover: { x0: 484, y0: 324, x1: 656, y1: 416 } }],
        });
        expect(l.partitions).toEqual([{ x: 130, y: 100, w: 526, h: 136 }, { x: 130, y: 236, w: 526, h: 180 }]);
        expect(l.container).toEqual({ x: 100, y: 100, w: 556, h: 316 });
    });
    it('when two partitions\' children leave no room for a border between them, the earlier partition keeps its children', () => {
        const l = pool({ x0: 274, y0: 144, x1: 456, y1: 236 }, { x0: 484, y0: 220, x1: 656, y1: 416 });
        // The border stays under the first partition's children, at 236; that partition keeps its size set by hand above it.
        expect(l.partitions[0]).toEqual({ x: 130, y: 56, w: 870, h: 180 });
        expect(l.partitions[1]).toEqual({ x: 130, y: 236, w: 870, h: 224 });
        // Its border cannot go above 236; the second partition starts there.
        const l2 = pool({ x0: 274, y0: 144, x1: 456, y1: 236 }, { x0: 484, y0: 200, x1: 656, y1: 416 });
        expect(l2.partitions[1].y).toBe(236);
    });
    it('side by side, a child left of the second partition grows it left and pushes the first and the origin left', () => {
        const l = layoutPartitions({
            container: { x: 100, y: 100, w: 400, h: 200, isResized: true }, axis: 'horizontal', header: { side: 'n', size: 30 },
            partitions: [{ stored: 200, isResized: true, cover: { x0: 120, y0: 150, x1: 240, y1: 250 } }, { stored: 200, isResized: true, cover: { x0: 260, y0: 150, x1: 480, y1: 250 } }],
        });
        expect(l.partitions).toEqual([{ x: 60, y: 130, w: 200, h: 170 }, { x: 260, y: 130, w: 240, h: 170 }]);
        expect(l.container).toEqual({ x: 60, y: 100, w: 440, h: 200 });
    });
});
