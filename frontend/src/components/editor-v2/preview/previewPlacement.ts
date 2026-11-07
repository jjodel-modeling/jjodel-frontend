/**
 * Placement of the M2 ghost preview (P-2026-10-25-0110): where a ghost goes on the real canvas,
 * and where the marks on an existing class go. Pure: boxes in flow coordinates in, boxes out.
 *
 * - `findFreeSpot`: a new class goes next to the class it relates to, right, then below, left,
 *   above, at the first position whose rect keeps `PLACEMENT_CLEARANCE` from every taken box (a
 *   node, an edge label, a sample of an edge, another ghost). When all four straight spots are
 *   taken the search slides along the sides, nearest first. Deterministic: the same input gives the
 *   same spot. Among the free spots of one slide, one that shares a band with the anchor wide
 *   enough for a straight ghost edge goes first (P-2026-10-25-1005, tie-break only).
 * - `compartmentBelow`: the rows added to an existing class, flush under its node.
 * - `strikeOnRow`: the overlay of a removed row, from the row's offset inside its node.
 */

/** A box in flow coordinates. */
export interface PlacementBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** The clearance a placed ghost keeps from any other box. */
export const PLACEMENT_CLEARANCE = 24;
const SIDE_GAP_X = 80;
const SIDE_GAP_Y = 24;
const SLIDE_STEP = 40;
const SLIDE_STEPS = 12;
/** The height a compartment adds around its rows. */
export const COMPARTMENT_PADDING = 8;

/** True when `a` and `b` are closer than `clearance` (touching or overlapping included). */
export function tooClose(a: PlacementBox, b: PlacementBox, clearance: number = PLACEMENT_CLEARANCE): boolean {
    return a.x < b.x + b.width + clearance && b.x < a.x + a.width + clearance
        && a.y < b.y + b.height + clearance && b.y < a.y + a.height + clearance;
}

/** The band two facing boxes share must leave room for a straight edge away from the corners. */
const STRAIGHT_BAND = 16;

/** True when a `width` x `height` box at `p` shares with `anchor` a band wide enough for a straight edge. */
export function facesAcross(p: { x: number; y: number }, width: number, height: number, anchor: PlacementBox): boolean {
    const xOverlap = Math.min(p.x + width, anchor.x + anchor.width) - Math.max(p.x, anchor.x);
    const yOverlap = Math.min(p.y + height, anchor.y + anchor.height) - Math.max(p.y, anchor.y);
    return Math.max(xOverlap, yOverlap) > STRAIGHT_BAND;
}

/** The first free spot for a `width` x `height` box next to `anchor`; null when none within the slide range. */
export function findFreeSpot(
    anchor: PlacementBox,
    width: number,
    height: number,
    taken: readonly PlacementBox[],
    clearance: number = PLACEMENT_CLEARANCE,
): { x: number; y: number } | null {
    for (let k = 0; k <= SLIDE_STEPS; k++) {
        const slides = k === 0 ? [0] : [k * SLIDE_STEP, -k * SLIDE_STEP];
        const hits: { x: number; y: number }[] = [];
        for (const d of slides) {
            const spots = [
                { x: anchor.x + anchor.width + SIDE_GAP_X, y: anchor.y + d },
                { x: anchor.x + d, y: anchor.y + anchor.height + SIDE_GAP_Y },
                { x: anchor.x - SIDE_GAP_X - width, y: anchor.y + d },
                { x: anchor.x + d, y: anchor.y - SIDE_GAP_Y - height },
            ];
            for (const p of spots) if (!taken.some((t) => tooClose({ ...p, width, height }, t, clearance))) hits.push(p);
        }
        // Tie-break among the free spots of one slide (P-2026-10-25-1005): one that faces the anchor
        // across a shared band, so that the ghost edge runs straight, before the first in order.
        if (hits.length > 0) return hits.find((p) => facesAcross(p, width, height, anchor)) ?? hits[0];
    }
    return null;
}

/** The box of `rows` rows of `rowHeight` snapped under `owner`: same x and width, top at the owner's bottom, no gap. */
export function compartmentBelow(owner: PlacementBox, rows: number, rowHeight: number, below: PlacementBox | null = null): PlacementBox {
    return {
        x: owner.x,
        y: below ? below.y + below.height : owner.y + owner.height,
        width: owner.width,
        height: rows * rowHeight + COMPARTMENT_PADDING,
    };
}

/** A row measured inside its node, in flow units relative to the node's top-left corner. */
export interface RowOffset {
    dx: number;
    dy: number;
    width: number;
    height: number;
}

/** The overlay box of a struck row: the row's rect, placed from the node's box. */
export function strikeOnRow(owner: PlacementBox, row: RowOffset): PlacementBox {
    return { x: owner.x + row.dx, y: owner.y + row.dy, width: row.width, height: row.height };
}
