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
    /** The box its children need, in absolute coordinates: their union, plus the content margin and the partition's own
     *  band (R-GV-17, P-2026-10-11-1156). The partition is drawn around it on every side; the stack moves its borders
     *  and the container's origin, never the children. */
    cover?: { x0: number; y0: number; x1: number; y1: number };
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
 *
 * A partition that declares `cover` is drawn around that box on every side (R-GV-17, P-2026-10-11-1156): along the
 * stack, a partition reaches past its children's far side and pushes the next ones down, and starts before their near
 * side, pushing the earlier ones (each keeping its floor: its size set by hand, or the minimum) and the container's
 * origin up; across, the region starts before the leftmost need and ends past the farthest. The container's origin
 * only moves up or left of where it is stored, and its far border stays where its stored size puts it when sized by
 * hand: the frame grows, the children do not move. Where two partitions' children leave no room for a border between
 * them, the earlier partition keeps its children. Without any `cover` the result is the stack of before.
 */
export function layoutPartitions(input: PartitionLayoutInput): PartitionLayout {
    const vertical = (input.axis ?? 'vertical') !== 'horizontal';
    const min = Math.max(0, finite(input.minExtent ?? MIN_PARTITION_EXTENT));
    const pad = positive(input.padding);
    const side = input.header?.side;
    const band = input.header && (side === 'w' || side === 'n') ? positive(input.header.size) : 0;
    // The band consumes width on 'w', height on 'n'; main is height when vertical.
    const bandOnMain = band > 0 && (vertical ? side === 'n' : side === 'w');
    const bandMain = bandOnMain ? band : 0;
    const bandCross = band > 0 && !bandOnMain ? band : 0;

    const extents = input.partitions.map(p => partitionExtent(p, min));
    const covers = input.partitions.map(p => {
        const b = p.cover;
        if (!b || ![b.x0, b.y0, b.x1, b.y1].every(v => typeof v === 'number' && Number.isFinite(v))) return null;
        return vertical ? { m0: b.y0, m1: b.y1, c0: b.x0, c1: b.x1 } : { m0: b.x0, m1: b.x1, c0: b.y0, c1: b.y1 };
    });
    // A partition with a cover needs across what its cover spans; its content size, measured from where the region was
    // stored, would overshoot once the region starts further out.
    const maxCross = input.partitions.reduce((m, p, i) => (covers[i] ? m : Math.max(m, positive(p.contentCross))), 0);
    // What a partition keeps when an earlier one is pushed: its size set by hand, the minimum when its children set it
    // (their cover holds them), its extent otherwise.
    const floorOf = (i: number) => {
        const p = input.partitions[i];
        return covers[i] && !(p.isResized === true && positive(p.stored) > 0) ? min : extents[i];
    };

    const c = input.container;
    const resized = c.isResized === true;
    const storedMain = resized ? positive(vertical ? c.h : c.w) : 0;
    const storedCross = resized ? positive(vertical ? c.w : c.h) : 0;
    const contentMain = positive(vertical ? c.contentH : c.contentW);
    const contentCross = positive(vertical ? c.contentW : c.contentH);
    const x = finite(c.x);
    const y = finite(c.y);
    const atMain = vertical ? y : x;
    const atCross = vertical ? x : y;

    // Main axis: the borders t[0..n]. Down from where the stack starts, each partition its extent and past its
    // children's far side; then up, before their near side, the earlier ones keeping their floor.
    const n = extents.length;
    const t: number[] = [atMain + bandMain + pad];
    for (let i = 0; i < n; i++) t.push(Math.max(t[i] + extents[i], covers[i]?.m1 ?? -Infinity));
    for (let i = n - 1; i >= 0; i--) {
        t[i] = Math.min(t[i], covers[i]?.m0 ?? Infinity, t[i + 1] - floorOf(i));
        if (i > 0) t[i] = Math.max(t[i], covers[i - 1]?.m1 ?? -Infinity);
    }
    const endMain = Math.max(t[n] + pad, atMain + storedMain, atMain + contentMain);
    if (n > 0) t[n] = endMain - pad;   // the slack goes to the last
    // Where it is stored, unless a child took the origin up or left (exact: no rounding when nothing moved).
    const originMain = t[0] < atMain + bandMain + pad ? t[0] - pad - bandMain : atMain;

    // Cross axis: the region from where it is stored, widened to every cover.
    const storedStart = atCross + bandCross + pad;
    let regionStart = storedStart;
    let regionEnd = regionStart + maxCross;
    for (const cv of covers) {
        if (!cv) continue;
        regionStart = Math.min(regionStart, cv.c0);
        regionEnd = Math.max(regionEnd, cv.c1);
    }
    const endCross = Math.max(regionEnd + pad, atCross + storedCross, atCross + contentCross);
    const originCross = regionStart < storedStart ? regionStart - pad - bandCross : atCross;

    const container: Rect = vertical
        ? { x: originCross, y: originMain, w: endCross - originCross, h: endMain - originMain }
        : { x: originMain, y: originCross, w: endMain - originMain, h: endCross - originCross };
    const header: Rect | null = band === 0 ? null
        : side === 'w' ? { x: container.x, y: container.y, w: band, h: container.h } : { x: container.x, y: container.y, w: container.w, h: band };

    const regionCross = endCross - pad - regionStart;
    const partitions: Rect[] = [];
    const used: number[] = [];
    for (let i = 0; i < n; i++) {
        const e = t[i + 1] - t[i];
        used.push(e);
        partitions.push(vertical
            ? { x: regionStart, y: t[i], w: regionCross, h: e }
            : { x: t[i], y: regionStart, w: e, h: regionCross });
    }
    return { container, header, partitions, extents: used };
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
