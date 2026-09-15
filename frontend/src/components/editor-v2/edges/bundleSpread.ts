/**
 * Bundle spread — perpendicular offset of the middle corridor of a 4-point
 * Manhattan Z-shape, so parallel edges between the same node pair fan apart
 * instead of collapsing onto one line.
 *
 * The offset is a monotonic function of the edge's PHYSICAL position along the
 * side (the mean of its two endpoint coordinates), centered on the bundle center
 * (the midpoint between the two node centers). This keeps the corridor order
 * consistent with the geometric anchor order produced by computeSidePositions
 * (byGeometry + byPairStable) — so the trunks nest instead of crossing.
 *
 * Previous behavior offset by handle INDEX and split the two directions with a
 * sign; when the index order diverged from the physical order (the same-opposite-
 * node tie case — e.g. Families.ecore Family<->Member, 4 containment + 4 eOpposite)
 * the corridors inverted and produced avoidable crossings (defect S1). See
 * docs/discovery/2026-07-06-family-member-capture.md (6 measured crossings).
 *
 * Pure: no DOM, no React, no ReactFlow — testable in isolation. Extracted from
 * UnifiedEdge.tsx because that component's import graph (canvasToJjom -> joiner/
 * monaco) cannot load under the node-env test runner.
 */

export interface Point {
    x: number;
    y: number;
}

/**
 * Trunk offset (px) per px of cross-axis distance between the edge's mean position
 * and the bundle center. ~0.6 gives ~8px lane spacing for an 8-edge bundle on a
 * 120px side — comparable in magnitude to the previous fixed 6px/lane step, while
 * being monotonic in the physical anchor order.
 */
export const BUNDLE_SPREAD_GAIN = 0.6;

/**
 * Shift the middle corridor of a 4-point Manhattan Z-shape perpendicular to its
 * longitudinal axis, ordered by the edge's physical position and centered on the
 * bundle center. Returns the points unchanged when the path is not a 4-point
 * Z-shape (L-shape with 3 points, U-detour with 6 points, self-loop) — those cases
 * keep the original routing.
 *
 * @param points       the 4-point Z path: [sourceAnchor, bend1, bend2, targetAnchor]
 * @param bundleCenter midpoint between the two node centers; null → no offset
 *                     (leaves the corridor at its midpoint, i.e. the pre-spread route)
 */
export function applyBundleSpread(
    points: Point[],
    bundleCenter: Point | null,
): Point[] {
    if (points.length !== 4) return points;

    const p0 = points[0];
    const p1 = points[1];
    const p2 = points[2];
    const p3 = points[3];

    const isMiddleVertical = Math.abs(p1.x - p2.x) < 1;
    const isMiddleHorizontal = Math.abs(p1.y - p2.y) < 1;

    if (isMiddleVertical) {
        // opposite-H: vertical trunk (constant x) offset in X, ordered by mean Y.
        // The fan direction must be OPPOSITE to the bundle's vertical shear (which
        // facing side is lower); otherwise the target-side horizontals cut across
        // sibling trunks and the corridors cross. The shear is read from THIS edge's
        // own anchors — sign(rightAnchor.y − leftAnchor.y) — which is uniform across
        // a facing bundle, so no sibling context is needed.
        const leftA = p0.x <= p3.x ? p0 : p3;
        const rightA = p0.x <= p3.x ? p3 : p0;
        const shear = Math.sign(rightA.y - leftA.y) || 1;
        const meanY = (p0.y + p3.y) / 2;
        const refY = bundleCenter ? bundleCenter.y : meanY; // fallback → 0 offset
        const offset = -shear * (meanY - refY) * BUNDLE_SPREAD_GAIN;
        return [p0, { x: p1.x + offset, y: p1.y }, { x: p2.x + offset, y: p2.y }, p3];
    }
    if (isMiddleHorizontal) {
        // opposite-V: horizontal trunk (constant y) offset in Y, ordered by mean X.
        // Symmetric to the vertical case: fan opposite to the horizontal shear
        // (sign(bottomAnchor.x − topAnchor.x)) so the corridors nest.
        const topA = p0.y <= p3.y ? p0 : p3;
        const botA = p0.y <= p3.y ? p3 : p0;
        const shear = Math.sign(botA.x - topA.x) || 1;
        const meanX = (p0.x + p3.x) / 2;
        const refX = bundleCenter ? bundleCenter.x : meanX; // fallback → 0 offset
        const offset = -shear * (meanX - refX) * BUNDLE_SPREAD_GAIN;
        return [p0, { x: p1.x, y: p1.y + offset }, { x: p2.x, y: p2.y + offset }, p3];
    }
    return points;
}
