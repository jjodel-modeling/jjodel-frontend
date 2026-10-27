/**
 * irFrame — the geometry of a self-framing `free` container (S2b, spec addendum 2026-10-10 §11): a composite UML state
 * is the box that holds its substates and grows with them. The sibling of irPartitions.ts, for the other layout mode.
 *
 * The box is the bounding box of the visible children, plus `padding` on every side, plus the header band on its side;
 * a box sized by hand (`isResized`) keeps its stored size but never shrinks below that. The box starts where the
 * children's box, padding and band put it: the children do not move, the frame follows them.
 *
 * Computed placement in absolute coordinates (R-GV-6): nothing here is persisted.
 *
 * Pure module: no React, no Redux, no joiner. Unit-tested in __tests__/irFrame.test.ts.
 */

import type { HeaderSide } from './irTypes';
import type { Rect } from './irPartitions';

export interface FrameInput {
    /** The visible children's boxes, in absolute coordinates. */
    children: ReadonlyArray<Rect>;
    /** px, >= 0, on every side. */
    padding?: number;
    header?: { side: HeaderSide; size: number } | null;
    /** The container's stored size; with `isResized` it is kept, as a floor the children's box can only raise. */
    stored?: { w?: number; h?: number; isResized?: boolean };
}

const finite = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const positive = (v: unknown): number => Math.max(0, finite(v));

/** The frame of a self-framing container, or null when it has no visible child (it then keeps its own box). */
export function frameBox(input: FrameInput): Rect | null {
    const kids = input.children.filter(r => [r.x, r.y, r.w, r.h].every(v => typeof v === 'number' && Number.isFinite(v)));
    if (kids.length === 0) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const r of kids) {
        minX = Math.min(minX, r.x); minY = Math.min(minY, r.y);
        maxX = Math.max(maxX, r.x + positive(r.w)); maxY = Math.max(maxY, r.y + positive(r.h));
    }
    const pad = positive(input.padding);
    const side = input.header?.side;
    const band = input.header && (side === 'w' || side === 'n') ? positive(input.header.size) : 0;
    const bandW = side === 'w' ? band : 0;
    const bandH = side === 'n' ? band : 0;
    let w = maxX - minX + 2 * pad + bandW;
    let h = maxY - minY + 2 * pad + bandH;
    const s = input.stored;
    if (s?.isResized === true) {
        w = Math.max(w, positive(s.w));
        h = Math.max(h, positive(s.h));
    }
    return { x: minX - pad - bandW, y: minY - pad - bandH, w, h };
}
