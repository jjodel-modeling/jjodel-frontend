// Pure geometry for the ghost-parent stubs of a ClassNode (cross-metamodel parents and,
// #225, parents whose inheritance was hidden). No React, no store: unit-testable.
//
// Coordinates are connector-local: the connector SVG has a 12x18 viewBox (1 unit = 1 flow
// px) centred under the node top-center. (6,18) is the node-end of every connector and is
// the SAME point for all parents; (6,1) is the chip-bottom apex at rest.

export type GhostParentOffset = { dx: number; dy: number };

export const GP_START_X = 6;
export const GP_START_Y = 18;
export const GP_REST_APEX_X = 6;
export const GP_REST_APEX_Y = 1;
export const GP_TRIANGLE_LENGTH = 7;
export const GP_TRIANGLE_WIDTH = 8;

// Horizontal gap (flow px) kept between two neighbouring chips, and the width assumed for a
// chip that has not been measured yet.
export const GP_CHIP_GAP = 12;
export const GP_DEFAULT_CHIP_WIDTH = 110;

/**
 * Horizontal centre of each chip relative to the node top-center, left to right, so that
 * the chips sit side by side without overlapping (gap `gap`) and the row is centred on the
 * node top-center. A missing/invalid width falls back to `GP_DEFAULT_CHIP_WIDTH`.
 */
export function ghostParentSpreads(
    widths: ReadonlyArray<number | undefined>,
    gap: number = GP_CHIP_GAP
): number[] {
    const w = widths.map(x => (typeof x === 'number' && isFinite(x) && x > 0 ? x : GP_DEFAULT_CHIP_WIDTH));
    const total = w.reduce((a, b) => a + b, 0) + gap * Math.max(0, w.length - 1);
    const centers: number[] = [];
    let left = -total / 2;
    for (const cw of w) {
        centers.push(left + cw / 2);
        left += cw + gap;
    }
    return centers;
}

/**
 * Connector of one ghost parent. The start is pinned at the node-top-center; the apex is the
 * chip-bottom, which follows the chip: rest position + horizontal `spread` + drag offset.
 */
export function ghostParentConnector(offset: GhostParentOffset | undefined, spread: number) {
    const off = offset ?? { dx: 0, dy: 0 };
    const startX = GP_START_X, startY = GP_START_Y;
    const apexX = GP_REST_APEX_X + spread + off.dx;
    const apexY = GP_REST_APEX_Y + off.dy;
    const ax = apexX - startX, ay = apexY - startY;
    const degenerate = ax === 0 && ay === 0;
    const ang = Math.atan2(ay, ax);
    const cos = Math.cos(ang), sin = Math.sin(ang);
    const baseCx = apexX - GP_TRIANGLE_LENGTH * cos, baseCy = apexY - GP_TRIANGLE_LENGTH * sin;
    const px = -sin, py = cos;
    const hw = GP_TRIANGLE_WIDTH / 2;
    const b1x = baseCx + hw * px, b1y = baseCy + hw * py;
    const b2x = baseCx - hw * px, b2y = baseCy - hw * py;
    const triangle = `${apexX.toFixed(1)},${apexY.toFixed(1)} ${b1x.toFixed(1)},${b1y.toFixed(1)} ${b2x.toFixed(1)},${b2y.toFixed(1)}`;
    return { startX, startY, apexX, apexY, baseCx, baseCy, degenerate, triangle };
}
