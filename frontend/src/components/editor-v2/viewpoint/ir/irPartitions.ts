/**
 * irPartitions — the geometry of a graphVertex whose `containment.layout.mode` is `partitions` (R-GV-7, spec addendum
 * 2026-10-10 §7): BPMN lanes in a pool. The partitions are stacked along the main axis and fill the container's inner
 * cross extent; the container's main size is their sum; slack goes to the last; a header band sits on one side.
 *
 * Computed placement in absolute coordinates (R-GV-6): nothing here is persisted. A partition's manual size is the
 * existing per-vertex record (`isResized`, R-LAY-4, R-LAY-14), handed in by the caller.
 *
 * Pure module: no React, no Redux, no joiner. Unit-tested in __tests__/irPartitions.test.ts.
 */

import type { HeaderSide, PartitionAxis } from './irTypes';

/** The floor of a partition's extent along the main axis, px. */
export const MIN_PARTITION_EXTENT = 24;

export interface Rect { x: number; y: number; w: number; h: number }

/** One partition as the caller knows it, sizes on the MAIN axis unless named cross. */
export interface PartitionSpec {
    /** The partition's stored size on the main axis (its vertex's h for `vertical`, w for `horizontal`). */
    stored?: number;
    /** True when that stored size was chosen by a human: it is then the extent. */
    isResized?: boolean;
    /** The extent its content needs on the main axis. */
    content?: number;
    /** The extent its content needs on the cross axis. */
    contentCross?: number;
}

export interface PartitionLayoutInput {
    /** The container's position and its stored box; `isResized` makes the stored box a floor. */
    container: { x: number; y: number; w?: number; h?: number; isResized?: boolean; contentW?: number; contentH?: number };
    axis?: PartitionAxis;
    header?: { side: HeaderSide; size: number } | null;
    padding?: number;
    partitions: PartitionSpec[];
    minExtent?: number;
}

export interface PartitionLayout {
    container: Rect;
    /** The header band, or null when none is declared. */
    header: Rect | null;
    partitions: Rect[];
    /** The extents used on the main axis, slack included, one per partition. */
    extents: number[];
}

const finite = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const positive = (v: unknown): number => Math.max(0, finite(v));

/** A partition's extent on the main axis (spec addendum §7.1): its stored size when resized by hand, else the larger
 *  of its content and the floor. A resized size is taken as chosen; the floor binds the content and the resize. */
export function partitionExtent(p: PartitionSpec, minExtent: number = MIN_PARTITION_EXTENT): number {
    const stored = positive(p.stored);
    if (p.isResized === true && stored > 0) return stored;
    return Math.max(positive(p.content), minExtent);
}

/**
 * The container box, the header band and the partition boxes (spec addendum §7, points 1 to 4).
 * `vertical` stacks top to bottom (main = y), `horizontal` left to right (main = x). A band on `w` consumes width,
 * on `n` height; it adds to the main size when it consumes the main dimension, to the cross size otherwise.
 */
export function layoutPartitions(input: PartitionLayoutInput): PartitionLayout {
    const vertical = (input.axis ?? 'vertical') !== 'horizontal';
    const min = Math.max(0, finite(input.minExtent ?? MIN_PARTITION_EXTENT));
    const pad = positive(input.padding);
    const side = input.header?.side;
    const band = input.header && (side === 'w' || side === 'n') ? positive(input.header.size) : 0;
    // The band consumes width on 'w', height on 'n'; main is height when vertical.
    const bandOnMain = band > 0 && (vertical ? side === 'n' : side === 'w');
    const bandW = band > 0 && side === 'w' ? band : 0;
    const bandH = band > 0 && side === 'n' ? band : 0;

    const extents = input.partitions.map(p => partitionExtent(p, min));
    const sumMain = extents.reduce((s, e) => s + e, 0);
    const maxCross = input.partitions.reduce((m, p) => Math.max(m, positive(p.contentCross)), 0);

    const c = input.container;
    const resized = c.isResized === true;
    const storedMain = resized ? positive(vertical ? c.h : c.w) : 0;
    const storedCross = resized ? positive(vertical ? c.w : c.h) : 0;
    const contentMain = positive(vertical ? c.contentH : c.contentW);
    const contentCross = positive(vertical ? c.contentW : c.contentH);

    const needMain = sumMain + 2 * pad + (bandOnMain ? band : 0);
    const needCross = maxCross + 2 * pad + (bandOnMain ? 0 : band);
    const main = Math.max(needMain, storedMain, contentMain);
    const cross = Math.max(needCross, storedCross, contentCross);
    if (extents.length > 0) extents[extents.length - 1] += main - needMain;

    const x = finite(c.x);
    const y = finite(c.y);
    const container: Rect = vertical ? { x, y, w: cross, h: main } : { x, y, w: main, h: cross };
    const header: Rect | null = band === 0 ? null
        : side === 'w' ? { x, y, w: band, h: container.h } : { x, y, w: container.w, h: band };

    const regionX = x + bandW + pad;
    const regionY = y + bandH + pad;
    const regionW = container.w - bandW - 2 * pad;
    const regionH = container.h - bandH - 2 * pad;
    const partitions: Rect[] = [];
    let offset = 0;
    for (const e of extents) {
        partitions.push(vertical
            ? { x: regionX, y: regionY + offset, w: regionW, h: e }
            : { x: regionX + offset, y: regionY, w: e, h: regionH });
        offset += e;
    }
    return { container, header, partitions, extents };
}

/**
 * Paired-border resize (spec addendum §7, point 5): move the border between partitions `border` and `border + 1` by
 * `delta` along the main axis. The two extents change by +d and -d, d clamped so that both stay at or above the floor;
 * the sum is unchanged. Returns a new array; the input is not mutated. An out-of-range border returns a copy.
 */
export function resizePartitionBorder(extents: ReadonlyArray<number>, border: number, delta: number, minExtent: number = MIN_PARTITION_EXTENT): number[] {
    const out = extents.slice();
    if (!Number.isInteger(border) || border < 0 || border + 1 >= out.length) return out;
    const a = out[border];
    const b = out[border + 1];
    const d = Math.min(Math.max(finite(delta), minExtent - a), b - minExtent);
    if (d < minExtent - a) return out;   // both already under the floor: nothing can move
    out[border] = a + d;
    out[border + 1] = b - d;
    return out;
}
