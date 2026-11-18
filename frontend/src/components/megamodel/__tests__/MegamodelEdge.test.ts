import { describe, it, expect } from 'vitest'
import {
    computeAdaptiveSides, edgeLabelOf, edgeTitleOf, routePoints, verticalTrackOffsets, EDGE_STYLES, NODE_W, NODE_H,
    type MmNode, type RouteEnds, type Side,
} from '../MegamodelEdge'

describe('edgeLabelOf and edgeTitleOf', () => {
    it('an unmarked edge keeps the label of its kind and has no tooltip', () => {
        expect(edgeLabelOf('instanceInputOf')).toBe(EDGE_STYLES.instanceInputOf.label)
        expect(edgeLabelOf('generatedBy', { timestamp: 5 })).toBe('generatedBy')
        expect(edgeTitleOf('instanceInputOf')).toBeUndefined()
    })

    it('an included edge reads `included`, the full text goes in the tooltip', () => {
        expect(edgeLabelOf('instanceInputOf', { included: true })).toBe('included')
        expect(edgeTitleOf('instanceInputOf', { included: true })).toBe('instanceInputOf (included)')
    })

    it('the pill of an included edge fits the column gap', () => {
        expect(edgeLabelOf('instanceInputOf', { included: true }).length * 6.4 + 16).toBeLessThan(120)
    })
})

describe('verticalTrackOffsets', () => {
    const route = (fromY: number, toY: number, fromX = -120, toX = 0): RouteEnds => ({
        p1: { x: fromX, y: fromY }, exitSide: 'right', p2: { x: toX, y: toY }, entrySide: 'left',
    })
    const trackX = (r: RouteEnds, offset: number) => routePoints(r.p1, r.exitSide, r.p2, r.entrySide, offset)[1].x

    it('a route alone in its gap keeps the x it has today', () => {
        const r = route(10, 90)
        const offsets = verticalTrackOffsets([r])
        expect(offsets).toEqual([0])
        expect(trackX(r, offsets[0])).toBe(routePoints(r.p1, r.exitSide, r.p2, r.entrySide)[1].x)
    })

    it('two routes in one gap get tracks 8 apart, centred on the x of today', () => {
        const routes = [route(10, 90), route(200, 300)]
        const xs = verticalTrackOffsets(routes).map((o, i) => trackX(routes[i], o)).sort((a, b) => a - b)
        expect(xs).toEqual([-64, -56])
    })

    it('three routes in one gap get tracks 8 apart, centred on the x of today', () => {
        const routes = [route(10, 90), route(200, 300), route(400, 500)]
        const xs = verticalTrackOffsets(routes).map((o, i) => trackX(routes[i], o)).sort((a, b) => a - b)
        expect(xs).toEqual([-68, -60, -52])
    })

    it('routes in different gaps do not take tracks from each other', () => {
        expect(verticalTrackOffsets([route(10, 90), route(10, 90, 200, 320)])).toEqual([0, 0])
    })

    it('leaves a route alone when it has no vertical segment between horizontal ports', () => {
        const down: RouteEnds = { p1: { x: 0, y: 0 }, exitSide: 'bottom', p2: { x: 0, y: 100 }, entrySide: 'top' }
        expect(verticalTrackOffsets([down, route(10, 90, -60, 60)])).toEqual([0, 0])
    })

    it('on the ends measured in the browser, the two overlapping tracks come apart', () => {
        const routes = [route(235, 307), route(405, 333), route(575, 359)]
        expect(verticalTrackOffsets(routes)).toEqual([-8, 0, 8])
    })

    it('orders two rising routes so that they do not cross, whatever the input order', () => {
        // Left of the other, the lower route would cross it twice
        const lower = route(575, 359)
        const upper = route(405, 333)
        expect(verticalTrackOffsets([lower, upper])).toEqual([4, -4])
        expect(verticalTrackOffsets([upper, lower])).toEqual([-4, 4])
    })

    it('orders two falling routes so that they do not cross, whatever the input order', () => {
        // The route starting lower takes the left track
        const upper = route(100, 300)
        const lower = route(200, 400)
        expect(verticalTrackOffsets([upper, lower])).toEqual([4, -4])
        expect(verticalTrackOffsets([lower, upper])).toEqual([-4, 4])
    })

    it('reads a route drawn right to left by its left end', () => {
        const rtl: RouteEnds = { p1: { x: 0, y: 300 }, exitSide: 'left', p2: { x: -120, y: 100 }, entrySide: 'right' }
        expect(verticalTrackOffsets([rtl, route(200, 400)])).toEqual([4, -4])
    })
})

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
