import { describe, it, expect } from 'vitest'
import { buildRoundedPath } from '../MegamodelEdge'

describe('buildRoundedPath degenerate input', () => {
    it('two equal points: no NaN', () => {
        const d = buildRoundedPath([{ x: 5, y: 7 }, { x: 5, y: 7 }])
        expect(d).not.toContain('NaN')
        expect(d).toBe('')
    })

    it('a single point gives an empty path', () => {
        expect(buildRoundedPath([{ x: 1, y: 2 }])).toBe('')
    })

    it('vertical edge whose ports share an x (two equal middle points): no NaN', () => {
        const d = buildRoundedPath([
            { x: 150, y: 100 },
            { x: 150, y: 220 },
            { x: 150, y: 220 },
            { x: 150, y: 340 },
        ])
        expect(d).not.toContain('NaN')
        expect(d.startsWith('M150,100')).toBe(true)
        expect(d.endsWith('L150,340')).toBe(true)
    })

    it('three collinear points with a zero-length first segment: no NaN', () => {
        const d = buildRoundedPath([{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 50 }])
        expect(d).not.toContain('NaN')
        expect(d).toBe('M0,0 L0,50')
    })

    it('three collinear points with distinct positions: no NaN', () => {
        const d = buildRoundedPath([{ x: 0, y: 0 }, { x: 0, y: 40 }, { x: 0, y: 100 }])
        expect(d).not.toContain('NaN')
    })

    it('a regular corner still gets its rounded arc', () => {
        const d = buildRoundedPath([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }])
        expect(d).toContain('Q100,0')
        expect(d).not.toContain('NaN')
    })
})
