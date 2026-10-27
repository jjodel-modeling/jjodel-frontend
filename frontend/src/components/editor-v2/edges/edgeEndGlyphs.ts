/**
 * edgeEndGlyphs — the seven edge ends of slice E (P-2026-09-30-1810), as a data table.
 *
 * `filledCircle`, `bar`, `cross` and the four crow's foot ends. The seven ends of before (the arrows, the
 * diamonds, the hollow triangle, the hollow circle) keep their own markers in UnifiedEdge, byte for byte.
 *
 * Conventions:
 * - local frame: the tip at x = 0, on the path's end (the node's side of the edge); the line runs towards −x;
 *   y across the line. Sizes in px, fixed: the line's resolved width sets the stroke only, so the longest
 *   back (20) always fits the 24 px Manhattan stub (edgeUtils `MIN_APPROACH_RUN`);
 * - `back` is where the line stops (edgeUtils `trimPathEnds`); the glyph draws its own stem from there, or
 *   from the front of a hollow circle, to the tip, so the line never runs under a hollow part;
 * - the crow's foot ends compose three primitives: the part nearest the node gives the maximum (bar one,
 *   crow many), the part farther along the edge the minimum (circle zero, bar one);
 * - one path carries all the line work, so a semi-transparent ink does not darken where two strokes cross;
 *   a circle is its own element, `ink` filled with the line colour, `surface` with the canvas background.
 *
 * The module also holds what the edge authoring panel needs of the ends and cannot test in place (the panel
 * imports monaco): the grouped options of the Ends select and the two forms of an end label.
 *
 * Pure module: no React, no Redux, no runtime import from the rest of editor-v2.
 */
import type { EdgeEndLabels, EdgeTermination, TextSource } from '../viewpoint/ir/irTypes';

/** A part of a glyph, in the local frame. */
export type GlyphPart =
    /** The line from `from` to the tip. */
    | { kind: 'stem'; from: number }
    /** A bar across the line at `x`, half the glyph's `half` each side. */
    | { kind: 'bar'; x: number }
    /** Three toes from (`x`, 0): to the tip across ±half (the middle toe is the stem). */
    | { kind: 'crow'; x: number }
    /** An X centred at (`x`, 0), `arm` each way. */
    | { kind: 'cross'; x: number; arm: number }
    /** A circle centred at (`x`, 0). */
    | { kind: 'circle'; x: number; r: number; fill: 'ink' | 'surface' };

export interface EndGlyph {
    /** Distance from the tip to the glyph's back, px: where the line stops. */
    readonly back: number;
    /** Half the glyph's extent across the line, px, stroke excluded. */
    readonly half: number;
    /** The parts, nearest the node first. */
    readonly parts: readonly GlyphPart[];
}

export const END_GLYPHS: Readonly<Partial<Record<EdgeTermination, EndGlyph>>> = {
    filledCircle: { back: 8, half: 4, parts: [{ kind: 'circle', x: -4, r: 4, fill: 'ink' }] },
    bar: { back: 8, half: 6, parts: [{ kind: 'bar', x: -8 }, { kind: 'stem', from: -8 }] },
    cross: { back: 14, half: 4, parts: [{ kind: 'cross', x: -10, arm: 4 }, { kind: 'stem', from: -14 }] },
    erZeroOrOne: { back: 20, half: 6, parts: [{ kind: 'bar', x: -8 }, { kind: 'circle', x: -16, r: 4, fill: 'surface' }, { kind: 'stem', from: -12 }] },
    erExactlyOne: { back: 12, half: 6, parts: [{ kind: 'bar', x: -8 }, { kind: 'bar', x: -12 }, { kind: 'stem', from: -12 }] },
    erZeroOrMany: { back: 20, half: 6, parts: [{ kind: 'crow', x: -10 }, { kind: 'circle', x: -16, r: 4, fill: 'surface' }, { kind: 'stem', from: -12 }] },
    erOneOrMany: { back: 14, half: 6, parts: [{ kind: 'crow', x: -10 }, { kind: 'bar', x: -14 }, { kind: 'stem', from: -14 }] },
};

/** The glyph of an end, or null for the seven ends of before, an unknown end, or no end. */
export function endGlyphOf(t: unknown): EndGlyph | null {
    if (typeof t !== 'string' || !Object.prototype.hasOwnProperty.call(END_GLYPHS, t)) return null;
    return END_GLYPHS[t as EdgeTermination] ?? null;
}

/** The line work of a glyph as one path `d`, in the local frame; '' when it has none. */
export function glyphPathD(g: EndGlyph): string {
    const h = g.half;
    const out: string[] = [];
    for (const p of g.parts) {
        switch (p.kind) {
            case 'bar': out.push(`M ${p.x} ${-h} L ${p.x} ${h}`); break;
            case 'crow': out.push(`M ${p.x} 0 L 0 ${-h} M ${p.x} 0 L 0 ${h}`); break;
            case 'cross': out.push(`M ${p.x - p.arm} ${-p.arm} L ${p.x + p.arm} ${p.arm} M ${p.x - p.arm} ${p.arm} L ${p.x + p.arm} ${-p.arm}`); break;
            case 'stem': out.push(`M ${p.from} 0 L 0 0`); break;
            default: break;
        }
    }
    return out.join(' ');
}

/** The circles of a glyph, in the local frame. */
export function glyphCircles(g: EndGlyph): { cx: number; cy: number; r: number; fill: 'ink' | 'surface' }[] {
    return g.parts.flatMap(p => (p.kind === 'circle' ? [{ cx: p.x, cy: 0, r: p.r, fill: p.fill }] : []));
}

/** Where the line was cut for an end (edgeUtils `trimPathEnds`): the new end point, the tip, the length cut, the angle. */
export interface GlyphCut {
    at: { x: number; y: number };
    tip: { x: number; y: number };
    length: number;
    /** Degrees, the direction from `at` to `tip`. */
    angle: number;
}

/**
 * The `<marker>` attributes of a glyph at an end drawn `width` px wide. In user space (the size does not
 * follow the selection's CSS width), the box the glyph's, padded by half the stroke and half a pixel. With a
 * cut, the reference point is the cut on the line (the path now ends there) and the orientation the chord to
 * the tip, so the tip lands on the path's original end; without one (a path the trim cannot read) the tip
 * sits on the vertex and the path's own direction orients it.
 */
export function endGlyphMarker(g: EndGlyph, width: number, cut: GlyphCut | null, role: 'source' | 'target') {
    const pad = width / 2 + 0.5;
    const w = g.back + 2 * pad;
    const h = 2 * (g.half + pad);
    return {
        viewBox: `${-g.back - pad} ${-g.half - pad} ${w} ${h}`,
        markerWidth: w,
        markerHeight: h,
        refX: cut ? -cut.length : 0,
        refY: 0,
        orient: cut ? String(cut.angle) : role === 'source' ? 'auto-start-reverse' : 'auto',
    };
}

/**
 * The Ends select of the edge authoring panel, grouped. The seven ends of before keep their order and their
 * labels (Arrows, then UML's diamonds, then the hollow circle under Petri); the seven new ones slot in.
 */
export const TERMINATION_OPTION_GROUPS: { label: string; options: { value: EdgeTermination; label: string }[] }[] = [
    {
        label: 'Arrows',
        options: [
            { value: 'none', label: 'None' },
            { value: 'openArrow', label: 'Open arrow' },
            { value: 'closedArrow', label: 'Closed arrow' },
            { value: 'hollowTriangle', label: 'Hollow triangle' },
        ],
    },
    {
        label: 'UML',
        options: [
            { value: 'filledDiamond', label: 'Filled diamond' },
            { value: 'hollowDiamond', label: 'Hollow diamond' },
            { value: 'filledCircle', label: 'Filled circle' },
            { value: 'cross', label: 'Cross (non-navigable)' },
        ],
    },
    {
        label: 'ER',
        options: [
            { value: 'bar', label: 'Bar (one)' },
            { value: 'erZeroOrOne', label: 'Zero or one' },
            { value: 'erExactlyOne', label: 'Exactly one' },
            { value: 'erZeroOrMany', label: 'Zero or many' },
            { value: 'erOneOrMany', label: 'One or many' },
        ],
    },
    {
        label: 'Petri',
        options: [
            { value: 'hollowCircle', label: 'Hollow circle' },
        ],
    },
];

/**
 * The two parts of an end label as the panel edits them: a bare text source (R-VP-23) is the multiplicity,
 * an object without `from` an `EdgeEndLabels`; anything else has neither.
 */
export function endLabelParts(v: unknown): EdgeEndLabels {
    if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
    if ('from' in v) return { multiplicity: v as TextSource };
    const { multiplicity, role } = v as EdgeEndLabels;
    return { ...(multiplicity !== undefined ? { multiplicity } : {}), ...(role !== undefined ? { role } : {}) };
}

/**
 * The end label `v` with one part set (`src`) or removed (undefined): undefined when neither is left; a bare
 * text source when only the multiplicity is left and `v` was one or absent, so a view that never had a role
 * keeps the R-VP-23 form; an `EdgeEndLabels` otherwise.
 */
export function withEndLabelPart(v: unknown, part: 'multiplicity' | 'role', src: TextSource | undefined): TextSource | EdgeEndLabels | undefined {
    const parts: EdgeEndLabels = { ...endLabelParts(v) };
    if (src === undefined) delete parts[part];
    else parts[part] = src;
    if (parts.multiplicity === undefined && parts.role === undefined) return undefined;
    const wasObject = !!v && typeof v === 'object' && !Array.isArray(v) && !('from' in v);
    if (parts.role === undefined && !wasObject) return parts.multiplicity;
    return parts;
}
