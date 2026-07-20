import { describe, expect, test, vi } from 'vitest';

// The joiner module pulls in window/document/monaco/jquery/handlebars at load time,
// none of which are available in vitest's node environment (and the project doesn't
// have jsdom/happy-dom installed). We mock the slice of joiner that the routing
// module actually consumes at module-load time, then exercise the pure functions.
//
// Coverage scope: svgLetterSize (no geometry deps) is exercised against the prompt's
// expected stride table per EdgeBendingMode. Snapshot tests for the full computeRouting
// pipeline (Edge dritto/midpoint/Bezier) require either jsdom or a full mock of
// GraphPoint/GraphSize/EdgeSegment/LViewElement/LGraph; those are deferred to a
// follow-up that introduces the necessary test scaffolding.
vi.mock('../../../../joiner', () => ({
    EdgeBendingMode: {
        Line: 'L',
        Bezier_quadratic: 'Q',
        Bezier_cubic: 'C',
        Elliptical_arc: 'A',
        Bezier_QT: 'QT',
        Bezier_CS: 'CS',
    },
    Log: {
        exDevv: (msg: string) => { throw new Error('Log.exDevv: ' + msg); },
    },
}));

import { svgLetterSize } from '../stride';

describe('svgLetterSize — stride per EdgeBendingMode', () => {
    // Reference table derived from the original LVoidEdge.svgLetterSize body.
    // Each row is [bendingMode, baseFirst, baseOthers] where base is the "raw"
    // value before doublingMidPoints / addM transformations.
    const baseTable: Array<[string, number, number]> = [
        ['L',  1, 1],
        ['Q',  2, 2],
        ['C',  3, 3],
        ['A',  4, 4],
        ['QT', 2, 1],
        ['CS', 3, 2],
    ];

    test.each(baseTable)('mode %s: addM=false, doubling=false → raw {first, others}', (mode, first, others) => {
        const result = svgLetterSize(mode, false, false);
        expect(result).toEqual({ first, others });
    });

    // doublingMidPoints applies (n - 1) * 2 + 1 to both first and others
    test.each(baseTable)('mode %s: addM=false, doubling=true → doubled stride', (mode, first, others) => {
        const expectedFirst = (first - 1) * 2 + 1;
        const expectedOthers = (others - 1) * 2 + 1;
        const result = svgLetterSize(mode, false, true);
        expect(result).toEqual({ first: expectedFirst, others: expectedOthers });
    });

    // addM adds +1 to both first and others
    test.each(baseTable)('mode %s: addM=true, doubling=false → +1 each', (mode, first, others) => {
        const result = svgLetterSize(mode, true, false);
        expect(result).toEqual({ first: first + 1, others: others + 1 });
    });

    // Both transforms compose: doubling first, then addM
    test.each(baseTable)('mode %s: addM=true, doubling=true → doubled then +1', (mode, first, others) => {
        const expectedFirst = (first - 1) * 2 + 1 + 1;
        const expectedOthers = (others - 1) * 2 + 1 + 1;
        const result = svgLetterSize(mode, true, true);
        expect(result).toEqual({ first: expectedFirst, others: expectedOthers });
    });

    // Production call site (segments.ts:69 / orig get_segments_impl:2569) uses (bm, false, true)
    test('Line at production call shape (false, true) → {first: 1, others: 1}', () => {
        // (1 - 1) * 2 + 1 = 1
        expect(svgLetterSize('L', false, true)).toEqual({ first: 1, others: 1 });
    });

    test('Bezier_QT at production call shape (false, true) → {first: 3, others: 1}', () => {
        // first: (2 - 1) * 2 + 1 = 3
        // others: (1 - 1) * 2 + 1 = 1
        expect(svgLetterSize('QT', false, true)).toEqual({ first: 3, others: 1 });
    });

    test('default arguments are addM=true, doubling=true', () => {
        // Line with defaults: doubled (1) + addM (1) = 2 each
        expect(svgLetterSize('L')).toEqual({ first: 2, others: 2 });
    });

    test('unknown letter triggers Log.exDevv (re-thrown by mock)', () => {
        expect(() => svgLetterSize('XYZ' as any, false, false)).toThrow(/Log\.exDevv/);
    });
});
