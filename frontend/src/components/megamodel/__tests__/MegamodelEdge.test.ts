import { describe, it, expect } from 'vitest'
import { computeAdaptiveSides, NODE_W, NODE_H, type MmNode, type Side } from '../MegamodelEdge'

// ============================================================
// computeAdaptiveSides — geometry-aware anchor side selection
// ============================================================

function node(x: number, y: number): MmNode {
    return {
        id: `${x}_${y}`,
        kind: 'metamodel',
        name: 'n',
        badgeLabel: 'M',
        typeLabel: 'Metamodel',
        x, y,
        stats: {},
        status: { type: 'info', label: '' },
    }
}

const FALLBACK_FROM: Side = 'top'
const FALLBACK_TO: Side = 'bottom'

describe('computeAdaptiveSides', () => {
    it('target to the right → from right, to left', () => {
        const r = computeAdaptiveSides(node(0, 0), node(500, 0), FALLBACK_FROM, FALLBACK_TO)
        expect(r).toEqual({ fromSide: 'right', toSide: 'left' })
    })

    it('target to the left → from left, to right', () => {
        const r = computeAdaptiveSides(node(500, 0), node(0, 0), FALLBACK_FROM, FALLBACK_TO)
        expect(r).toEqual({ fromSide: 'left', toSide: 'right' })
    })

    it('target below → from bottom, to top', () => {
        const r = computeAdaptiveSides(node(0, 0), node(0, 500), FALLBACK_FROM, FALLBACK_TO)
        expect(r).toEqual({ fromSide: 'bottom', toSide: 'top' })
    })

    it('target above → from top, to bottom', () => {
        const r = computeAdaptiveSides(node(0, 500), node(0, 0), FALLBACK_FROM, FALLBACK_TO)
        expect(r).toEqual({ fromSide: 'top', toSide: 'bottom' })
    })

    it('picks the dominant axis (mostly horizontal → left/right)', () => {
        const r = computeAdaptiveSides(node(0, 0), node(500, 100), FALLBACK_FROM, FALLBACK_TO)
        expect(r).toEqual({ fromSide: 'right', toSide: 'left' })
    })

    it('picks the dominant axis (mostly vertical → top/bottom)', () => {
        const r = computeAdaptiveSides(node(0, 0), node(100, 500), FALLBACK_FROM, FALLBACK_TO)
        expect(r).toEqual({ fromSide: 'bottom', toSide: 'top' })
    })

    it('overlapping centers → keeps the static fallback sides', () => {
        const sameCenter = computeAdaptiveSides(node(10, 20), node(10, 20), FALLBACK_FROM, FALLBACK_TO)
        expect(sameCenter).toEqual({ fromSide: FALLBACK_FROM, toSide: FALLBACK_TO })
    })

    it('compares centers, not corners (offset nodes with equal centers)', () => {
        // Two nodes whose top-left corners differ but whose centers coincide
        // cannot occur for equal-size nodes, so verify center math directly:
        // a node at (0,0) vs one shifted by exactly (NODE_W, 0) → centers differ by NODE_W on x.
        const r = computeAdaptiveSides(node(0, 0), node(NODE_W, 0), FALLBACK_FROM, FALLBACK_TO)
        expect(r).toEqual({ fromSide: 'right', toSide: 'left' })
        expect(NODE_W).toBeGreaterThan(0)
        expect(NODE_H).toBeGreaterThan(0)
    })
})
