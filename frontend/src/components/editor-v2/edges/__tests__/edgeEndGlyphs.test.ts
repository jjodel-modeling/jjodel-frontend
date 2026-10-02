/**
 * Slice E (P-2026-09-30-1810): the pure half of the edge ends.
 *  - edgeEndGlyphs: the glyph table of the seven new ends, the crow's foot composition rule, the marker
 *    attributes, the grouped options of the authoring panel;
 *  - edgeUtils.trimPathEnds: the line stops at the glyph's back, on every path shape the edge draws;
 *  - edgeUtils.computeCardinalityAnchor: the role on the other side of the line, on the four sides.
 */
import { describe, expect, it } from 'vitest';
import {
    END_GLYPHS,
    TERMINATION_OPTION_GROUPS,
    endGlyphMarker,
    endGlyphOf,
    endLabelParts,
    withEndLabelPart,
    glyphCircles,
    glyphPathD,
    type GlyphPart,
} from '../edgeEndGlyphs';
import { computeCardinalityAnchor, roundManhattanPath, trimPathEnds, MARKER_APPROACH_RUN, type Side } from '../../utils/edgeUtils';
import { VALID_TERMINATIONS } from '../../viewpoint/ir/irValidate';

const NEW_ENDS = ['filledCircle', 'bar', 'cross', 'erZeroOrOne', 'erExactlyOne', 'erZeroOrMany', 'erOneOrMany'];
const OLD_ENDS = ['none', 'openArrow', 'closedArrow', 'hollowTriangle', 'filledDiamond', 'hollowDiamond', 'hollowCircle'];
const OLD_LABELS = ['None', 'Open arrow', 'Closed arrow', 'Hollow triangle', 'Filled diamond', 'Hollow diamond', 'Hollow circle'];

describe('END_GLYPHS — the seven new ends', () => {
    it('covers the seven new ends and none of the seven existing ones (their markers stay in UnifiedEdge)', () => {
        expect(Object.keys(END_GLYPHS)).toEqual(NEW_ENDS);
        for (const t of OLD_ENDS) expect(endGlyphOf(t), t).toBeNull();
        expect(endGlyphOf('toString')).toBeNull();
        expect(endGlyphOf(undefined)).toBeNull();
    });

    it('the back of each glyph, where the line stops, in px', () => {
        expect(Object.fromEntries(NEW_ENDS.map(t => [t, END_GLYPHS[t as keyof typeof END_GLYPHS]!.back]))).toEqual({
            filledCircle: 8, bar: 8, cross: 14, erZeroOrOne: 20, erExactlyOne: 12, erZeroOrMany: 20, erOneOrMany: 14,
        });
    });

    it('the longest back fits the Manhattan stub, so a Manhattan end is trimmed whole', () => {
        const longest = Math.max(...Object.values(END_GLYPHS).map(g => g!.back));
        expect(longest).toBeLessThanOrEqual(24 - 4);
        expect(MARKER_APPROACH_RUN).toBeLessThanOrEqual(24);
    });

    it('crow\'s foot: the glyph nearest the node gives the maximum, the one farther along the edge the minimum', () => {
        const meaning = (p: GlyphPart) => (p.kind === 'crow' ? 'many' : p.kind === 'bar' ? 'one' : p.kind === 'circle' ? 'zero' : '?');
        const read = (t: string) => END_GLYPHS[t as keyof typeof END_GLYPHS]!.parts
            .filter(p => p.kind !== 'stem')
            .slice().sort((a, b) => b.x - a.x)
            .map(meaning);
        expect({
            erZeroOrOne: read('erZeroOrOne'), erExactlyOne: read('erExactlyOne'),
            erZeroOrMany: read('erZeroOrMany'), erOneOrMany: read('erOneOrMany'),
        }).toEqual({
            erZeroOrOne: ['one', 'zero'], erExactlyOne: ['one', 'one'],
            erZeroOrMany: ['many', 'zero'], erOneOrMany: ['many', 'one'],
        });
    });

    it('the glyph draws its own stem from the back of its first line part to the tip, never under a hollow part', () => {
        for (const t of NEW_ENDS) {
            const g = END_GLYPHS[t as keyof typeof END_GLYPHS]!;
            for (const c of glyphCircles(g)) {
                const stem = g.parts.find(p => p.kind === 'stem') as { from: number } | undefined;
                if (c.fill === 'surface') expect(stem && stem.from >= c.cx + c.r - 1e-9, t).toBe(true);
                expect(c.cx - c.r, t).toBeGreaterThanOrEqual(-g.back - 1e-9);
            }
        }
        expect(glyphPathD(END_GLYPHS.bar!)).toBe('M -8 -6 L -8 6 M -8 0 L 0 0');
        expect(glyphPathD(END_GLYPHS.erZeroOrMany!)).toBe('M -10 0 L 0 -6 M -10 0 L 0 6 M -12 0 L 0 0');
        expect(glyphPathD(END_GLYPHS.filledCircle!)).toBe('');
        expect(glyphCircles(END_GLYPHS.erZeroOrMany!)).toEqual([{ cx: -16, cy: 0, r: 4, fill: 'surface' }]);
        expect(glyphCircles(END_GLYPHS.filledCircle!)).toEqual([{ cx: -4, cy: 0, r: 4, fill: 'ink' }]);
    });
});

describe('endGlyphMarker — the marker that draws a glyph', () => {
    const g = END_GLYPHS.erZeroOrMany!;
    it('the reference point is the trim, the orientation the chord from the trimmed point to the tip', () => {
        const m = endGlyphMarker(g, 1, { at: { x: 80, y: 0 }, tip: { x: 100, y: 0 }, length: 20, angle: 0 }, 'target');
        expect(m).toEqual({ viewBox: '-21 -7 22 14', markerWidth: 22, markerHeight: 14, refX: -20, refY: 0, orient: '0' });
    });
    it('the stroke width pads the box, the geometry stays', () => {
        const m = endGlyphMarker(g, 2, { at: { x: 80, y: 0 }, tip: { x: 100, y: 0 }, length: 20, angle: 90 }, 'source');
        expect(m).toEqual({ viewBox: '-21.5 -7.5 23 15', markerWidth: 23, markerHeight: 15, refX: -20, refY: 0, orient: '90' });
    });
    it('with no trim the tip sits on the vertex and the path gives the orientation', () => {
        expect(endGlyphMarker(g, 1, null, 'target')).toMatchObject({ refX: 0, orient: 'auto' });
        expect(endGlyphMarker(g, 1, null, 'source')).toMatchObject({ refX: 0, orient: 'auto-start-reverse' });
    });
});

describe('TERMINATION_OPTION_GROUPS — the Ends select', () => {
    const flat = TERMINATION_OPTION_GROUPS.flatMap(gr => gr.options);
    it('four groups, every end of the vocabulary once', () => {
        expect(TERMINATION_OPTION_GROUPS.map(gr => gr.label)).toEqual(['Arrows', 'UML', 'ER', 'Petri']);
        expect(flat.map(o => o.value).sort()).toEqual(Object.keys(VALID_TERMINATIONS).sort());
        expect(new Set(flat.map(o => o.value)).size).toBe(flat.length);
    });
    it('the seven existing options keep their order and their labels', () => {
        const old = flat.filter(o => OLD_ENDS.includes(o.value));
        expect(old.map(o => o.value)).toEqual(OLD_ENDS);
        expect(old.map(o => o.label)).toEqual(OLD_LABELS);
    });
});

// ---------------------------------------------------------------------------
// trimPathEnds
// ---------------------------------------------------------------------------

const nums = (d: string) => (d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []).map(Number);
const last = (d: string) => { const n = nums(d); return { x: n[n.length - 2], y: n[n.length - 1] }; };
const first = (d: string) => { const n = nums(d); return { x: n[0], y: n[1] }; };
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
/** Arc length of a quadratic or cubic between parameters, by 400 samples. */
function arcLen(p: number[][], t0: number, t1: number): number {
    const at = (t: number) => {
        let q = p.map(v => v.slice());
        while (q.length > 1) q = q.slice(1).map((v, i) => [q[i][0] + (v[0] - q[i][0]) * t, q[i][1] + (v[1] - q[i][1]) * t]);
        return q[0];
    };
    let s = 0; let prev = at(t0);
    for (let i = 1; i <= 400; i++) { const c = at(t0 + (t1 - t0) * i / 400); s += Math.hypot(c[0] - prev[0], c[1] - prev[1]); prev = c; }
    return s;
}

describe('trimPathEnds — the line stops at the glyph\'s back', () => {
    it('no trim: the same string, byte for byte, and no ends', () => {
        const d = 'M 0 0 L 100 0';
        const r = trimPathEnds(d, 0, 0);
        expect(r.d).toBe(d);
        expect([r.start, r.end]).toEqual([null, null]);
    });

    it('a line, in the builders\' and in xyflow\'s spelling: both ends, lengths and angles', () => {
        for (const d of ['M 0 0 L 100 0', 'M 0,0L 100,0']) {
            const r = trimPathEnds(d, 8, 20);
            expect([first(r.d), last(r.d)], d).toEqual([{ x: 8, y: 0 }, { x: 80, y: 0 }]);
            expect(r.end, d).toEqual({ at: { x: 80, y: 0 }, tip: { x: 100, y: 0 }, length: 20, angle: 0 });
            expect(r.start, d).toEqual({ at: { x: 8, y: 0 }, tip: { x: 0, y: 0 }, length: 8, angle: 180 });
        }
    });

    it('a rounded Manhattan route: only the first and the last run move, the corners stay', () => {
        const d = roundManhattanPath('M 0 0 L 50 0 L 50 100 L 100 100', 4, { approachRun: MARKER_APPROACH_RUN, interiorStraight: 0.5 });
        const r = trimPathEnds(d, 14, 20);
        expect(first(r.d)).toEqual({ x: 14, y: 0 });
        expect(last(r.d)).toEqual({ x: 80, y: 100 });
        expect(d).toMatch(/^M 0 0 L 46 0 A .* L 100 100$/);
        expect(r.d).toBe(d.replace(/^M 0 0/, 'M 14 0').replace(/L 100 100$/, 'L 80 100'));
        expect(r.end!.angle).toBe(0);
        expect(r.start!.angle).toBe(180);
    });

    it('a vertical last run: the angle is 90 entering from above, -90 from below', () => {
        expect(trimPathEnds('M 0 0 L 0 100', 0, 20).end!.angle).toBe(90);
        expect(trimPathEnds('M 0 100 L 0 0', 0, 20).end!.angle).toBe(-90);
    });

    it('a quadratic (the arc): the removed piece is 20 px of curve, the kept one the same curve (de Casteljau)', () => {
        const P = [[0, 0], [50, 40], [100, 0]];
        const r = trimPathEnds('M 0 0 Q 50 40 100 0', 0, 20);
        const n = nums(r.d);
        const [c, e] = [{ x: n[2], y: n[3] }, { x: n[4], y: n[5] }];
        expect(e).toEqual(r.end!.at);
        // The kept control point lies on P0→C, at the split parameter t: C' = P0 + t (C − P0).
        const t = c.x / 50;
        expect(c.y).toBeCloseTo(40 * t, 1);
        expect(arcLen(P, t, 1)).toBeCloseTo(20, 0);
        expect(r.end!.angle).toBeCloseTo(Math.atan2(0 - e.y, 100 - e.x) * 180 / Math.PI, 1);
    });

    it('a quadratic cut at its start keeps the same curve: the control on C→P1, 20 px of curve removed', () => {
        const P = [[0, 0], [50, 40], [100, 0]];
        const r = trimPathEnds('M 0 0 Q 50 40 100 0', 20, 0);
        const n = nums(r.d);
        const [s, c, e] = [{ x: n[0], y: n[1] }, { x: n[2], y: n[3] }, { x: n[4], y: n[5] }];
        expect(s).toEqual(r.start!.at);
        expect(e).toEqual({ x: 100, y: 0 });
        // The kept control point lies on C→P1 at the split parameter t: C' = C + t (P1 − C).
        const t = (c.x - 50) / 50;
        expect(c.y).toBeCloseTo(40 - 40 * t, 1);
        expect(arcLen(P, 0, t)).toBeCloseTo(20, 0);
    });

    it('a cubic (the bezier and the loop): both ends trimmed along the curve', () => {
        const P = [[0, 0], [30, 0], [70, 50], [100, 50]];
        const r = trimPathEnds('M 0 0 C 30 0 70 50 100 50', 14, 20);
        expect(dist(first(r.d), { x: 0, y: 0 })).toBeGreaterThan(13);
        expect(dist(first(r.d), { x: 0, y: 0 })).toBeLessThanOrEqual(14 + 1e-6);
        expect(dist(last(r.d), { x: 100, y: 50 })).toBeGreaterThan(19);
        expect(r.end!.length).toBe(20);
        expect(r.start!.length).toBe(14);
        expect(arcLen(P, 0, 1)).toBeGreaterThan(34);
    });

    it('an arc command or a relative command at an end is left as drawn', () => {
        const withArc = 'M 0 0 L 50 0 A 4 4 0 0 1 54 4';
        const r = trimPathEnds(withArc, 8, 20);
        expect(r.end).toBeNull();
        expect(r.start).not.toBeNull();
        expect(last(r.d)).toEqual({ x: 54, y: 4 });
        const rel = trimPathEnds('M 0 0 l 100 0', 8, 20);
        expect([rel.d, rel.start, rel.end]).toEqual(['M 0 0 l 100 0', null, null]);
    });

    it('a last run shorter than the back is trimmed to its length, never past its start', () => {
        const r = trimPathEnds('M 0 0 L 0 50 L 10 50', 0, 20);
        expect(r.end!.length).toBeLessThan(20);
        expect(r.end!.at.x).toBeGreaterThan(0);
        expect(r.end!.at.y).toBe(50);
    });
});

// ---------------------------------------------------------------------------
// computeCardinalityAnchor — the mirror
// ---------------------------------------------------------------------------

describe('computeCardinalityAnchor — the role on the other side of the line', () => {
    const SIDES: Side[] = ['top', 'right', 'bottom', 'left'];
    it('without the mirror, byte for byte the six-argument call', () => {
        for (const s of SIDES) {
            expect(computeCardinalityAnchor(100, 100, s, 8, 0, undefined, false)).toBe(computeCardinalityAnchor(100, 100, s, 8, 0));
            expect(computeCardinalityAnchor(100, 100, s, 8, 20, [{ x: 0, y: 0 }, { x: 100, y: 100 }], false))
                .toBe(computeCardinalityAnchor(100, 100, s, 8, 20, [{ x: 0, y: 0 }, { x: 100, y: 100 }]));
        }
    });
    it('the four sides: same depth, opposite lateral side, the box flipped to stay off the line', () => {
        expect(SIDES.map(s => [computeCardinalityAnchor(100, 100, s, 8), computeCardinalityAnchor(100, 100, s, 8, 0, undefined, true)])).toEqual([
            ['translate(0%, -100%) translate(104px, 92px)', 'translate(-100%, -100%) translate(96px, 92px)'],
            ['translate(0%, -100%) translate(108px, 96px)', 'translate(0%, 0%) translate(108px, 104px)'],
            ['translate(-100%, 0%) translate(96px, 108px)', 'translate(0%, 0%) translate(104px, 108px)'],
            ['translate(-100%, 0%) translate(92px, 104px)', 'translate(-100%, -100%) translate(92px, 96px)'],
        ]);
    });
});

// ---------------------------------------------------------------------------
// The end label, as the panel edits it
// ---------------------------------------------------------------------------

describe('endLabelParts / withEndLabelPart — the two forms of an end label', () => {
    const N = { from: 'literal', text: 'N' } as const;
    const R = { from: 'literal', text: 'owner' } as const;
    it('reads a bare text source as the multiplicity, an object as its parts, anything else as none', () => {
        expect(endLabelParts(N)).toEqual({ multiplicity: N });
        expect(endLabelParts({ role: R })).toEqual({ role: R });
        expect(endLabelParts({ multiplicity: N, role: R })).toEqual({ multiplicity: N, role: R });
        expect([endLabelParts(undefined), endLabelParts('N'), endLabelParts([])]).toEqual([{}, {}, {}]);
    });
    it('keeps the R-VP-23 form while there is no role, the object once there is one, nothing when both go', () => {
        expect(withEndLabelPart(undefined, 'multiplicity', N)).toEqual(N);
        expect(withEndLabelPart(N, 'multiplicity', R)).toEqual(R);
        expect(withEndLabelPart(N, 'role', R)).toEqual({ multiplicity: N, role: R });
        expect(withEndLabelPart({ multiplicity: N, role: R }, 'role', undefined)).toEqual({ multiplicity: N });
        expect(withEndLabelPart(undefined, 'role', R)).toEqual({ role: R });
        expect(withEndLabelPart(N, 'multiplicity', undefined)).toBeUndefined();
        expect(withEndLabelPart({ role: R }, 'role', undefined)).toBeUndefined();
    });
});
