/**
 * Editor V3 — useAutoAnchor: automatic side selection with hysteresis.
 *
 * Determines which side of a node an edge should connect to based on
 * relative node positions. Uses hysteresis to prevent flickering when
 * nodes are near a diagonal.
 */

import { useMemo } from 'react';
import type { Side } from '../edges/edgeRouting';

const HYSTERESIS = 0.15; // 15% bias toward current side

export interface AutoAnchorResult {
    sourceSide: Side;
    targetSide: Side;
}

/**
 * Compute best sides for source and target based on relative positions.
 * The "best" side is the one that faces the other node.
 */
export function computeAutoSides(
    sourceX: number, sourceY: number, sourceW: number, sourceH: number,
    targetX: number, targetY: number, targetW: number, targetH: number,
    prevSourceSide?: Side,
    prevTargetSide?: Side,
): AutoAnchorResult {
    // Node centers
    const sCx = sourceX + sourceW / 2;
    const sCy = sourceY + sourceH / 2;
    const tCx = targetX + targetW / 2;
    const tCy = targetY + targetH / 2;

    const dx = tCx - sCx;
    const dy = tCy - sCy;

    const sourceSide = pickSide(dx, dy, prevSourceSide);
    const targetSide = pickSide(-dx, -dy, prevTargetSide);

    return { sourceSide, targetSide };
}

function pickSide(dx: number, dy: number, prevSide?: Side): Side {
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Base preference: horizontal vs vertical
    let preferHorizontal = absDx > absDy;

    // Apply hysteresis: if we're close to the diagonal and the previous side
    // is still reasonable, keep it
    if (prevSide && Math.abs(absDx - absDy) < (absDx + absDy) * HYSTERESIS) {
        const prevIsHorizontal = prevSide === 'left' || prevSide === 'right';
        preferHorizontal = prevIsHorizontal;
    }

    if (preferHorizontal) {
        return dx > 0 ? 'right' : 'left';
    } else {
        return dy > 0 ? 'bottom' : 'top';
    }
}

/**
 * Hook wrapper for auto-anchor computation.
 */
export function useAutoAnchor(
    sourceX: number, sourceY: number, sourceW: number, sourceH: number,
    targetX: number, targetY: number, targetW: number, targetH: number,
): AutoAnchorResult {
    return useMemo(
        () => computeAutoSides(sourceX, sourceY, sourceW, sourceH, targetX, targetY, targetW, targetH),
        [sourceX, sourceY, sourceW, sourceH, targetX, targetY, targetW, targetH]
    );
}
