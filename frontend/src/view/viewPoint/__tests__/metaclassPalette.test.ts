/**
 * «Color by metaclass» (P-2026-09-30-1815, reworked by P-2026-09-30-2022): the pure half of the
 * viewpoint option.
 *
 * The pastel swatches, the seed, the reference-aware assignment, the overrides, the text
 * contrast, the border shade, the settings reader, the metaclass order and graph and the
 * override resolver all live in `metaclassPalette.ts`, which imports nothing, so this bench
 * EXECUTES them (CLAUDE.md §5). The two render points (`ObjectNode.tsx`, `IRNodeContent.tsx`)
 * and the panel (`ViewpointProperties.tsx`) do not import here (`joiner` reaches monaco:
 * `window is not defined`) and are measured by the lane probe instead.
 *
 * «Absent on a fresh viewpoint» is a fixture shaped as `Constructors.DViewElement` leaves
 * a viewpoint (it sets none of the optional viewpoint fields); the constructor itself
 * does not import in this bench, and that gap is stated in the log entry.
 */

import { describe, expect, it } from 'vitest';
import {
    DEFAULT_METACLASS_BASE_COLOR,
    PASTEL_SWATCHES,
    assignMetaclassColors,
    borderShade,
    clearMetaclassOverrides,
    contrastText,
    metaclassColorTable,
    metaclassColoringVars,
    metaclassGraph,
    metaclassOrder,
    metaclassPalette,
    modelOfClass,
    readMetaclassColoring,
    resolveMetaclassColoring,
    seedSwatchIndex,
    withMetaclassOverride,
} from '../metaclassPalette';
import { proxyToIdReplacer } from '../../../model/unproxy';

/** An HSL reading written independently of the module, for the assertions. */
function hslOf(hex: string): [number, number, number] {
    const n = parseInt(hex.slice(1), 16);
    const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    const l = (max + min) / 2;
    if (d === 0) return [0, 0, l * 100];
    const s = d / (1 - Math.abs(2 * l - 1));
    let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
    return [h, s * 100, l * 100];
}
const hueGap = (a: number, b: number) => { const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d); };
const HEX = /^#[0-9a-f]{6}$/;

/** CIE76 ΔE on Lab (D65), written independently of the module. */
function deltaE(a: string, b: string): number {
    const lab = (hex: string) => {
        const n = parseInt(hex.slice(1), 16);
        const lin = (c: number) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
        const [r, g, bb] = [lin((n >> 16) & 255), lin((n >> 8) & 255), lin(n & 255)];
        const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
        const x = f((r * 0.4124 + g * 0.3576 + bb * 0.1805) / 0.95047), y = f(r * 0.2126 + g * 0.7152 + bb * 0.0722),
            z = f((r * 0.0193 + g * 0.1192 + bb * 0.9505) / 1.08883);
        return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
    };
    const [p, q] = [lab(a), lab(b)];
    return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
}
/** WCAG 2.x contrast ratio, written independently of the module. */
function ratio(a: string, b: string): number {
    const lum = (hex: string) => {
        const n = parseInt(hex.slice(1), 16);
        const f = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
        return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
    };
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
}

const SW = PASTEL_SWATCHES;
/** The swatch k steps from index i, round the wheel. */
const at = (i: number, k: number) => SW[((i + k) % 12 + 12) % 12];
/** The nominal hue of a swatch (30 degrees per index), or the hue read from any other hex. */
const hueOfColor = (c: string) => (SW.indexOf(c) >= 0 ? 30 * SW.indexOf(c) : hslOf(c)[0]);
const BASES = ['#0ea5e9', '#f59e0b', '#808080', '#6366f1', '#22c55e', '#ff0000', '#fefce8', '#0b0b1f'];

describe('PASTEL_SWATCHES (R-VP-37)', () => {
    it('holds twelve distinct #rrggbb swatches, one every 30 degrees of hue from 0', () => {
        expect(SW).toHaveLength(12);
        expect(new Set(SW).size).toBe(12);
        SW.forEach((c, k) => {
            expect(c).toMatch(HEX);
            expect(hueGap(hslOf(c)[0], 30 * k)).toBeLessThanOrEqual(1);
        });
    });

    it('is pastel: saturation 55..70 % and lightness 82..88 %, read back from the hex', () => {
        for (const c of SW) {
            const [, s, l] = hslOf(c);
            expect(s).toBeGreaterThanOrEqual(55);
            expect(s).toBeLessThanOrEqual(70);
            expect(l).toBeGreaterThanOrEqual(82);
            expect(l).toBeLessThanOrEqual(88);
        }
    });

    it('keeps every pair apart: CIE76 deltaE >= 10 over all 66 pairs', () => {
        let min = Infinity;
        for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) min = Math.min(min, deltaE(SW[i], SW[j]));
        expect(min).toBeGreaterThanOrEqual(10);
    });

    it('takes black text on every swatch, by the WCAG rule (not hard-coded), at 7:1 or better', () => {
        for (const c of SW) {
            expect(contrastText(c)).toBe('#000000');
            expect(ratio(c, '#000000')).toBeGreaterThanOrEqual(7);
        }
    });
});

describe('seedSwatchIndex', () => {
    it('picks the swatch nearest in hue to the base', () => {
        expect(seedSwatchIndex('#0ea5e9')).toBe(7); // hue 199: 210 is 11 away, 180 is 19
        expect(seedSwatchIndex('#f59e0b')).toBe(1); // hue 38
        expect(seedSwatchIndex('#ff0000')).toBe(0);
        expect(seedSwatchIndex('#ff00ff')).toBe(10);
        expect(seedSwatchIndex('#ff0080')).toBe(11); // hue 329.9
        expect(seedSwatchIndex('#6366f1')).toBe(8); // hue 239
    });

    it('turns at the midpoint between two swatches', () => {
        expect(seedSwatchIndex('#ff3f00')).toBe(0); // hue 14.8
        expect(seedSwatchIndex('#ff4000')).toBe(1); // hue 15.1
        expect(seedSwatchIndex('#ff00c0')).toBe(10); // hue 314.8: 300 is 14.8 away, 330 is 15.2
        expect(seedSwatchIndex('#ff00bf')).toBe(11); // hue 315.1
    });

    it('gives an exact tie to the lower index', () => {
        expect(seedSwatchIndex('#fcbd00')).toBe(1); // hue 45.000: 30 and 60 both 15 away
        expect(seedSwatchIndex('#00fcbd')).toBe(5); // hue 165.000
        expect(seedSwatchIndex('#bd00fc')).toBe(9); // hue 285.000
    });

    it('wraps round 360: a hue near 359 seeds swatch 0', () => {
        expect(seedSwatchIndex('#ff0004')).toBe(0);
    });

    it('reads an achromatic base as hue 0, and an invalid one as the default', () => {
        expect(seedSwatchIndex('#808080')).toBe(0);
        expect(seedSwatchIndex('nope')).toBe(seedSwatchIndex(DEFAULT_METACLASS_BASE_COLOR));
        expect(DEFAULT_METACLASS_BASE_COLOR).toBe('#0ea5e9');
    });
});

describe('metaclassPalette (the analogous order round the seed, R-VP-29 as amended)', () => {
    it('is deterministic, and gives an empty list for a count of zero or less', () => {
        expect(metaclassPalette('#0ea5e9', 8)).toEqual(metaclassPalette('#0ea5e9', 8));
        expect(metaclassPalette('#0ea5e9', 8)).toHaveLength(8);
        expect(metaclassPalette('#0ea5e9', 0)).toEqual([]);
        expect(metaclassPalette('#0ea5e9', -3)).toEqual([]);
    });

    it('starts at the seed swatch, then +30, -30, +60, -60, ... degrees, and +180 last', () => {
        const s = 7;
        expect(metaclassPalette('#0ea5e9', 12)).toEqual([
            at(s, 0), at(s, 1), at(s, -1), at(s, 2), at(s, -2), at(s, 3), at(s, -3),
            at(s, 4), at(s, -4), at(s, 5), at(s, -5), at(s, 6),
        ]);
        expect(metaclassPalette('#f59e0b', 3)).toEqual([SW[1], SW[2], SW[0]]);
        expect(metaclassPalette('#ff0000', 3)).toEqual([SW[0], SW[1], SW[11]]);
    });

    it('uses all twelve before repeating, then starts again from the seed', () => {
        const p = metaclassPalette('#6366f1', 26);
        expect(new Set(p.slice(0, 12)).size).toBe(12);
        expect(p.slice(12, 24)).toEqual(p.slice(0, 12));
        expect(p[24]).toBe(p[0]);
    });

    it('falls back to the default base on an invalid hex', () => {
        const expected = metaclassPalette(DEFAULT_METACLASS_BASE_COLOR, 5);
        for (const bad of ['blue', '#12345', '', '#ggg', '0ea5e9', undefined as unknown as string, null as unknown as string]) {
            expect(metaclassPalette(bad, 5)).toEqual(expected);
        }
    });

    it('answers only pastel swatches, whatever the base', () => {
        for (const base of BASES) for (const c of metaclassPalette(base, 14)) expect(SW).toContain(c);
    });
});

/** Replays the greedy rule on an assignment and throws where a class did not get the best swatch. */
function checkGreedy(ids: string[], edges: [string, string][], got: Record<string, string>, overrides: Record<string, string> = {}) {
    const nb = new Map<string, Set<string>>(ids.map((i) => [i, new Set<string>()]));
    for (const [a, b] of edges) if (a !== b && nb.has(a) && nb.has(b)) { nb.get(a)!.add(b); nb.get(b)!.add(a); }
    const done = new Map<string, string>();
    for (const id of ids) if (overrides[id]) done.set(id, overrides[id].toLowerCase());
    for (const id of ids) {
        if (overrides[id]) { expect(got[id]).toBe(overrides[id].toLowerCase()); continue; }
        const used = new Set(done.values());
        const free = SW.filter((c) => !used.has(c));
        const near = [...nb.get(id)!].filter((n) => done.has(n)).map((n) => hueOfColor(done.get(n)!));
        const score = (c: string) => (near.length ? Math.min(...near.map((h) => hueGap(hueOfColor(c), h))) : Infinity);
        const pool = free.length ? free : [...SW];
        const best = Math.max(...pool.map(score));
        if (free.length) {
            if (!free.includes(got[id])) throw new Error(`${id} took a used swatch while ${free.length} were free`);
            for (const n of nb.get(id)!) if (done.has(n) && done.get(n) === got[id]) throw new Error(`${id} shares ${got[id]} with ${n}`);
        }
        if (score(got[id]) !== best) throw new Error(`${id}: distance ${score(got[id])}, best ${best}`);
        done.set(id, got[id]);
    }
}
const adjacencyOf = (edges: [string, string][]) => {
    const out: Record<string, string[]> = {};
    for (const [a, b] of edges) (out[a] ??= []).push(b);
    return out;
};

describe('assignMetaclassColors (reference-aware, R-VP-38)', () => {
    it('with no edges it is the analogous order of metaclassPalette, for 1..14 classes and every base', () => {
        for (const base of BASES) {
            for (let n = 1; n <= 14; n++) {
                const ids = Array.from({ length: n }, (_, i) => `c${i}`);
                const got = assignMetaclassColors(ids, {}, base);
                expect(ids.map((i) => got[i])).toEqual(metaclassPalette(base, n));
            }
        }
    });

    it('chain A -> B -> C: A the seed, B opposite (180), C at 150 from B, the + side first', () => {
        const got = assignMetaclassColors(['A', 'B', 'C'], { A: ['B'], B: ['C'] }, '#0ea5e9');
        expect(got).toEqual({ A: at(7, 0), B: at(7, 6), C: at(7, 1) });
        expect(hueGap(hueOfColor(got.A), hueOfColor(got.B))).toBe(180);
        expect(hueGap(hueOfColor(got.B), hueOfColor(got.C))).toBe(150);
        checkGreedy(['A', 'B', 'C'], [['A', 'B'], ['B', 'C']], got);
    });

    it('reads an edge in either direction: C -> B -> A gives the same colours', () => {
        expect(assignMetaclassColors(['A', 'B', 'C'], { C: ['B'], B: ['A'] }, '#0ea5e9'))
            .toEqual(assignMetaclassColors(['A', 'B', 'C'], { A: ['B'], B: ['C'] }, '#0ea5e9'));
    });

    it('star, centre first: the leaves go as far from the centre as the free swatches allow', () => {
        const ids = ['X', 'L1', 'L2', 'L3', 'L4', 'L5'];
        const edges = ids.slice(1).map((l) => ['X', l] as [string, string]);
        const got = assignMetaclassColors(ids, adjacencyOf(edges), '#0ea5e9');
        expect(ids.map((i) => got[i])).toEqual([at(7, 0), at(7, 6), at(7, 5), at(7, -5), at(7, 4), at(7, -4)]);
        expect(ids.slice(1).map((l) => hueGap(hueOfColor(got.X), hueOfColor(got[l])))).toEqual([180, 150, 150, 120, 120]);
        checkGreedy(ids, edges, got);
    });

    it('star, centre last: the leaves take the analogous order, the centre the swatch farthest from all of them', () => {
        const ids = ['L1', 'L2', 'L3', 'L4', 'L5', 'X'];
        const edges = ids.slice(0, 5).map((l) => [l, 'X'] as [string, string]);
        const got = assignMetaclassColors(ids, adjacencyOf(edges), '#0ea5e9');
        expect(ids.slice(0, 5).map((i) => got[i])).toEqual(metaclassPalette('#0ea5e9', 5));
        // The leaves sit at 150..270; 30 is 120 from both ends, nothing free is farther.
        expect(got.X).toBe(SW[1]);
        checkGreedy(ids, edges, got);
    });

    it('never gives two adjacent classes one swatch while one is free, and each takes the best distance (generated graphs)', () => {
        let seed = 12345;
        const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
        for (let g = 0; g < 60; g++) {
            const n = 2 + Math.floor(rnd() * 14);
            const ids = Array.from({ length: n }, (_, i) => `k${i}`);
            const edges: [string, string][] = [];
            for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j && rnd() < 0.25) edges.push([ids[i], ids[j]]);
            const base = BASES[g % BASES.length];
            checkGreedy(ids, edges, assignMetaclassColors(ids, adjacencyOf(edges), base));
        }
    });

    it('a ring of 14 still keeps neighbours apart after the swatches run out', () => {
        const ids = Array.from({ length: 14 }, (_, i) => `r${i}`);
        const edges = ids.map((id, i) => [id, ids[(i + 1) % 14]] as [string, string]);
        const got = assignMetaclassColors(ids, adjacencyOf(edges), '#22c55e');
        for (const [a, b] of edges) expect(got[a]).not.toBe(got[b]);
        expect(new Set(Object.values(got)).size).toBe(12);
        checkGreedy(ids, edges, got);
    });

    it('past twelve, a class still takes the swatch farthest from its neighbours', () => {
        const ids = Array.from({ length: 13 }, (_, i) => `c${i}`);
        // c0 is the only one with a neighbour; c12 comes last with every swatch used once.
        const got = assignMetaclassColors(ids, { c12: ['c0'] }, '#0ea5e9');
        expect(new Set(ids.slice(0, 12).map((i) => got[i])).size).toBe(12);
        expect(got.c12).toBe(at(7, 6)); // the farthest from c0's seed swatch
    });

    it('past twelve, an isolated class takes the least used swatch before the seed order', () => {
        const ids = Array.from({ length: 14 }, (_, i) => `c${i}`);
        // c0 and c1 both hold the seed swatch; c2..c12 take the eleven free ones; c13 finds all used.
        const got = assignMetaclassColors(ids, {}, '#0ea5e9', { c0: SW[7], c1: SW[7] });
        expect(new Set(ids.slice(0, 13).map((i) => got[i])).size).toBe(12);
        expect(got.c13).toBe(at(7, 1)); // used once, where the seed (rank 0) is used twice
    });

    it('ignores self-references and neighbours that are not in the list', () => {
        expect(assignMetaclassColors(['A', 'B'], { A: ['A', 'ghost'], B: ['B'] }, '#0ea5e9'))
            .toEqual(assignMetaclassColors(['A', 'B'], {}, '#0ea5e9'));
    });

    it('is deterministic, whatever the order of the adjacency lists', () => {
        const ids = ['A', 'B', 'C', 'D', 'E'];
        const one = assignMetaclassColors(ids, { A: ['B', 'C', 'D'], D: ['E'], C: ['E'] }, '#f59e0b');
        const two = assignMetaclassColors(ids, { E: ['C', 'D'], D: ['A'], C: ['A'], B: ['A'] }, '#f59e0b');
        expect(two).toEqual(one);
        expect(assignMetaclassColors(ids, { A: ['B', 'C', 'D'], D: ['E'], C: ['E'] }, '#f59e0b')).toEqual(one);
    });

    it('an override wins, and its neighbours adapt to it', () => {
        const got = assignMetaclassColors(['A', 'B', 'C'], { A: ['B'], B: ['C'] }, '#0ea5e9', { B: SW[0] });
        expect(got.B).toBe(SW[0]);
        expect(got.A).toBe(SW[6]); // the farthest from B's 0
        expect(got.C).toBe(SW[7]); // 6 is taken; 7 (the seed) and 5 are both 150 away, the seed wins
        checkGreedy(['A', 'B', 'C'], [['A', 'B'], ['B', 'C']], got, { B: SW[0] });
    });

    it('an overridden swatch is not free: an isolated class does not take it while others are', () => {
        const got = assignMetaclassColors(['A', 'B'], {}, '#0ea5e9', { B: SW[7] });
        expect(got).toEqual({ A: at(7, 1), B: SW[7] });
    });

    it('two overrides may share a swatch; the rest avoid it', () => {
        const got = assignMetaclassColors(['A', 'B', 'C'], {}, '#0ea5e9', { A: SW[3], B: SW[3] });
        expect(got).toEqual({ A: SW[3], B: SW[3], C: SW[7] });
    });

    it('an override on a missing class, or with an invalid colour, is ignored', () => {
        const plain = assignMetaclassColors(['A', 'B'], { A: ['B'] }, '#0ea5e9');
        const got = assignMetaclassColors(['A', 'B'], { A: ['B'] }, '#0ea5e9', { Z: SW[0], A: 'red', B: '#12' });
        expect(got).toEqual(plain);
        expect('Z' in got).toBe(false);
    });

    it('accepts any valid hex as an override, normalized, and keeps its neighbours away from its hue', () => {
        const got = assignMetaclassColors(['A', 'B'], { A: ['B'] }, '#0ea5e9', { A: '#FF0000' });
        expect(got.A).toBe('#ff0000');
        expect(got.B).toBe(SW[6]); // 180 from red
        // Blue (240) is no swatch: its own hue counts, so the neighbour goes to 60.
        expect(assignMetaclassColors(['A', 'B'], { A: ['B'] }, '#0ea5e9', { A: '#0000ff' }).B).toBe(SW[2]);
    });
});

describe('contrastText (WCAG 2.x relative luminance)', () => {
    it('white gives black, black gives white', () => {
        expect(contrastText('#ffffff')).toBe('#000000');
        expect(contrastText('#fff')).toBe('#000000');
        expect(contrastText('#000000')).toBe('#ffffff');
    });

    it('#0ea5e9 gives black: 7.58:1 against black, 2.77:1 against white', () => {
        expect(contrastText('#0ea5e9')).toBe('#000000');
    });

    it('mid grey #808080 gives black: 5.32:1 against black, 3.95:1 against white', () => {
        expect(contrastText('#808080')).toBe('#000000');
    });

    it('turns between #767676 (black, 4.62 vs 4.54) and #757575 (white, 4.56 vs 4.61)', () => {
        expect(contrastText('#767676')).toBe('#000000');
        expect(contrastText('#757575')).toBe('#ffffff');
    });

    it('weights the channels: pure blue gives white, pure green gives black', () => {
        expect(contrastText('#0000ff')).toBe('#ffffff');
        expect(contrastText('#00ff00')).toBe('#000000');
    });
});

describe('borderShade (R-VP-37: same hue, lightness 55 %)', () => {
    it('keeps hue and saturation and sets the lightness to 55', () => {
        for (const c of SW) {
            const [h, s] = hslOf(c);
            const [h2, s2, l2] = hslOf(borderShade(c));
            expect(hueGap(h, h2)).toBeLessThan(1.5);
            expect(Math.abs(s - s2)).toBeLessThan(1.5);
            expect(Math.abs(l2 - 55)).toBeLessThan(0.5);
        }
    });

    it('answers a #rrggbb for any input, the default base for an invalid one', () => {
        expect(borderShade('#000000')).toMatch(HEX);
        expect(borderShade('nope')).toBe(borderShade(DEFAULT_METACLASS_BASE_COLOR));
    });
});

describe('readMetaclassColoring', () => {
    it('reads an absent field as off with the defaults the panel shows, and no overrides key', () => {
        expect(readMetaclassColoring(undefined)).toEqual({ enabled: false, baseColor: '#0ea5e9', border: true });
        expect(readMetaclassColoring({ id: 'vp' })).toEqual({ enabled: false, baseColor: '#0ea5e9', border: true });
    });

    it('keeps the stored values, and repairs only an invalid base', () => {
        expect(readMetaclassColoring({ metaclassColoring: { enabled: true, baseColor: '#F59E0B', border: false } }))
            .toEqual({ enabled: true, baseColor: '#f59e0b', border: false });
        expect(readMetaclassColoring({ metaclassColoring: { enabled: true, baseColor: 'nope' } }))
            .toEqual({ enabled: true, baseColor: '#0ea5e9', border: true });
    });

    it('keeps the valid overrides, lowercased, and drops the invalid ones', () => {
        const raw = { enabled: true, baseColor: '#0ea5e9', border: true, overrides: { A: '#F3CBCB', B: 'red', C: 7, D: '#abc' } };
        expect(readMetaclassColoring({ metaclassColoring: raw }).overrides).toEqual({ A: '#f3cbcb', D: '#aabbcc' });
    });

    it('has no overrides key when none is valid, or when the map is not an object', () => {
        for (const overrides of [{}, { A: 'x' }, null, 'A', ['#f3cbcb']]) {
            expect('overrides' in readMetaclassColoring({ metaclassColoring: { enabled: true, overrides } })).toBe(false);
        }
    });
});

describe('withMetaclassOverride and clearMetaclassOverrides', () => {
    const base = { enabled: true, baseColor: '#0ea5e9', border: false };

    it('sets, replaces and removes one override, keeping the other fields', () => {
        const one = withMetaclassOverride(base, 'A', SW[2]);
        expect(one).toEqual({ ...base, overrides: { A: SW[2] } });
        const two = withMetaclassOverride(one, 'B', '#EEB5EE');
        expect(two.overrides).toEqual({ A: SW[2], B: '#eeb5ee' });
        expect(withMetaclassOverride(two, 'A', SW[5]).overrides).toEqual({ A: SW[5], B: '#eeb5ee' });
        expect(withMetaclassOverride(two, 'A', null)).toEqual({ ...base, overrides: { B: '#eeb5ee' } });
    });

    it('drops the key when the last override goes, and ignores an invalid colour as a removal', () => {
        const one = withMetaclassOverride(base, 'A', SW[2]);
        const none = withMetaclassOverride(one, 'A', null);
        expect(none).toEqual(base);
        expect('overrides' in none).toBe(false);
        expect(withMetaclassOverride(one, 'A', 'nope')).toEqual(base);
    });

    it('never mutates its input', () => {
        const one = withMetaclassOverride(base, 'A', SW[2]);
        const frozen = JSON.stringify(one);
        withMetaclassOverride(one, 'B', SW[3]);
        withMetaclassOverride(one, 'A', null);
        clearMetaclassOverrides(one);
        expect(JSON.stringify(one)).toBe(frozen);
    });

    it('Reset all removes every override and nothing else', () => {
        const two = withMetaclassOverride(withMetaclassOverride(base, 'A', SW[2]), 'B', SW[3]);
        expect(clearMetaclassOverrides(two)).toEqual(base);
        expect('overrides' in clearMetaclassOverrides(two)).toBe(false);
    });
});

// A metamodel MM: package P1 holds A, B and the subpackage P2 (holding C); package P3 holds D.
// References: A.toB (containment) A -> B, C.toA C -> A, D.self D -> D; B extends D.
// A second metamodel MM2 holds E, and A.toE points at it. The model M1 has one object per class.
// The arrays are in the order the metamodel keeps.
function fixture(coloring?: unknown, active: string | null = 'vp') {
    const idlookup: Record<string, any> = {
        MM: { id: 'MM', className: 'DModel', name: 'MM', isMetamodel: true, packages: ['P1', 'P3'] },
        P1: { id: 'P1', className: 'DPackage', father: 'MM', classes: ['A', 'B'], subpackages: ['P2'] },
        P2: { id: 'P2', className: 'DPackage', father: 'P1', classes: ['C'], subpackages: [] },
        P3: { id: 'P3', className: 'DPackage', father: 'MM', classes: ['D'], subpackages: [] },
        A: { id: 'A', className: 'DClass', name: 'A', father: 'P1', abstract: true, references: ['A.toB', 'A.toE'], extends: [] },
        B: { id: 'B', className: 'DClass', name: 'B', father: 'P1', references: [], extends: ['D'] },
        C: { id: 'C', className: 'DClass', name: 'C', father: 'P2', references: ['C.toA'], extends: [] },
        D: { id: 'D', className: 'DClass', name: 'D', father: 'P3', references: ['D.self'], extends: [] },
        'A.toB': { id: 'A.toB', className: 'DReference', father: 'A', type: 'B', composition: true },
        'A.toE': { id: 'A.toE', className: 'DReference', father: 'A', type: 'E' },
        'C.toA': { id: 'C.toA', className: 'DReference', father: 'C', type: 'A' },
        'D.self': { id: 'D.self', className: 'DReference', father: 'D', type: 'D' },
        MM2: { id: 'MM2', className: 'DModel', name: 'Other', isMetamodel: true, packages: ['Q1'] },
        Q1: { id: 'Q1', className: 'DPackage', father: 'MM2', classes: ['E'], subpackages: [] },
        E: { id: 'E', className: 'DClass', name: 'E', father: 'Q1', references: [], extends: [] },
        // A fresh viewpoint as Constructors.DViewElement leaves it: no optional viewpoint field.
        vp: { id: 'vp', className: 'DViewPoint', name: 'Colors', isExclusiveView: true, isValidation: false, viewpoint: 'vp' },
        other: { id: 'other', className: 'DViewPoint', name: 'Other', isExclusiveView: true, isValidation: false, viewpoint: 'other',
            metaclassColoring: { enabled: true, baseColor: '#f59e0b', border: true } },
    };
    if (coloring !== undefined) idlookup.vp.metaclassColoring = coloring;
    return { viewpoint: active, idlookup };
}
const ON = { enabled: true, baseColor: '#0ea5e9', border: true };

describe('metaclassOrder', () => {
    it('numbers the classes in metamodel order: package classes, then its subpackages, then the next package', () => {
        const { idlookup } = fixture();
        expect(['A', 'B', 'C', 'D'].map((c) => metaclassOrder(idlookup, c))).toEqual([
            { index: 0, count: 4 }, { index: 1, count: 4 }, { index: 2, count: 4 }, { index: 3, count: 4 },
        ]);
    });

    it('does not move a class that is renamed', () => {
        const { idlookup } = fixture();
        idlookup.C.name = 'Renamed';
        expect(metaclassOrder(idlookup, 'C')).toEqual({ index: 2, count: 4 });
    });

    it('answers null for an unknown class or one outside any model', () => {
        const { idlookup } = fixture();
        expect(metaclassOrder(idlookup, 'nope')).toBeNull();
        idlookup.X = { id: 'X', className: 'DClass', father: 'gone' };
        expect(metaclassOrder(idlookup, 'X')).toBeNull();
    });

    it('survives a package cycle', () => {
        const { idlookup } = fixture();
        idlookup.P2.subpackages = ['P1'];
        expect(metaclassOrder(idlookup, 'D')).toEqual({ index: 3, count: 4 });
    });
});

describe('modelOfClass and metaclassGraph', () => {
    it('climbs from a class to its metamodel, null outside one', () => {
        const { idlookup } = fixture();
        expect(modelOfClass(idlookup, 'C')).toBe('MM');
        expect(modelOfClass(idlookup, 'E')).toBe('MM2');
        expect(modelOfClass(idlookup, 'nope')).toBeNull();
        idlookup.P2.father = 'P2';
        expect(modelOfClass(idlookup, 'C')).toBeNull();
    });

    it('lists the classes in metamodel order and links them by reference and generalization, both ways', () => {
        const { idlookup } = fixture();
        const g = metaclassGraph(idlookup, 'MM');
        expect(g.ids).toEqual(['A', 'B', 'C', 'D']);
        const sorted = Object.fromEntries(Object.entries(g.adjacency).map(([k, v]) => [k, [...v].sort()]));
        // A-B containment, C-A reference, B-D extends; D.self and A.toE (other metamodel) make no edge.
        expect(sorted).toEqual({ A: ['B', 'C'], B: ['A', 'D'], C: ['A'], D: ['B'] });
    });

    it('skips a reference that is not in the lookup, and lists no neighbour twice', () => {
        const { idlookup } = fixture();
        idlookup.A.references = ['A.toB', 'gone', 'A.toB2'];
        idlookup['A.toB2'] = { id: 'A.toB2', className: 'DReference', father: 'A', type: 'B' };
        idlookup.B.extends = ['D', 'A'];
        const g = metaclassGraph(idlookup, 'MM');
        expect(g.adjacency.A).toEqual(['B', 'C']);
        expect(g.adjacency.B).toEqual(['A', 'D']);
    });

    it('is empty for an unknown model', () => {
        expect(metaclassGraph(fixture().idlookup, 'nope')).toEqual({ ids: [], adjacency: {} });
    });
});

describe('resolveMetaclassColoring', () => {
    it('returns nothing on a fresh viewpoint (the field is absent)', () => {
        const s = fixture();
        expect('metaclassColoring' in s.idlookup.vp).toBe(false);
        expect(resolveMetaclassColoring(s, 'C')).toBeNull();
    });

    it('returns nothing when the toggle is off, whatever the other values', () => {
        expect(resolveMetaclassColoring(fixture({ enabled: false, baseColor: '#f59e0b', border: true }), 'C')).toBeNull();
    });

    it('returns nothing with no active viewpoint, and reads only the active one', () => {
        expect(resolveMetaclassColoring(fixture(ON, null), 'C')).toBeNull();
        expect(resolveMetaclassColoring(fixture(ON, ''), 'C')).toBeNull();
        // `other` has the toggle on but is not active; the active one has none.
        expect(resolveMetaclassColoring(fixture(), 'C')).toBeNull();
    });

    it('returns nothing for an object with no metaclass, or one outside any metamodel', () => {
        const s = fixture(ON);
        expect(resolveMetaclassColoring(s, '')).toBeNull();
        expect(resolveMetaclassColoring(s, undefined)).toBeNull();
        expect(resolveMetaclassColoring(s, 'nope')).toBeNull();
    });

    it('on: the reference-aware colour of the class, its contrast text and its shade', () => {
        const s = fixture(ON);
        const g = metaclassGraph(s.idlookup, 'MM');
        const colors = assignMetaclassColors(g.ids, g.adjacency, '#0ea5e9');
        for (const cls of ['A', 'B', 'C', 'D']) {
            const o = resolveMetaclassColoring(s, cls)!;
            expect(o.fill).toBe(colors[cls]);
            expect(o.text).toBe('#000000');
            expect(o.stroke).toBe(borderShade(colors[cls]));
            expect(o.border).toBe(true);
        }
        // A the seed; B (A's neighbour) opposite; C (A's) 150 from A on the + side; D (B's) 150 from B, next to the seed.
        expect(['A', 'B', 'C', 'D'].map((c) => resolveMetaclassColoring(s, c)!.fill)).toEqual([at(7, 0), at(7, 6), at(7, 5), at(7, 1)]);
    });

    it('gives connected classes different fills', () => {
        const s = fixture(ON);
        const fill = (c: string) => resolveMetaclassColoring(s, c)!.fill;
        for (const [a, b] of [['A', 'B'], ['A', 'C'], ['B', 'D']]) expect(fill(a)).not.toBe(fill(b));
    });

    it('an override wins and the neighbours adapt; one on a deleted class is ignored', () => {
        const s = fixture({ ...ON, overrides: { B: SW[7], gone: SW[0] } });
        expect(resolveMetaclassColoring(s, 'B')!.fill).toBe(SW[7]);
        expect(resolveMetaclassColoring(s, 'A')!.fill).toBe(SW[1]); // 180 from B's 210
        expect(resolveMetaclassColoring(s, 'C')!.fill).toBe(SW[8]); // 150 from A's 30, next to the seed
        // D (B's neighbour) takes 0, 150 from B: the ignored override on `gone` did not use it up.
        expect(resolveMetaclassColoring(s, 'D')!.fill).toBe(SW[0]);
    });

    it('carries the Border checkbox', () => {
        expect(resolveMetaclassColoring(fixture({ ...ON, border: false }), 'B')!.border).toBe(false);
    });
});

describe('metaclassColorTable (the panel list)', () => {
    it('lists each metamodel with its classes in order, the colour the resolver paints and whether it is overridden', () => {
        const s = fixture({ ...ON, overrides: { C: SW[4] } });
        const setting = readMetaclassColoring(s.idlookup.vp);
        const table = metaclassColorTable(s.idlookup, ['MM', 'MM2'], setting);
        expect(table.map((m) => [m.modelId, m.modelName])).toEqual([['MM', 'MM'], ['MM2', 'Other']]);
        expect(table[0].classes.map((c) => [c.id, c.name, c.overridden])).toEqual([
            ['A', 'A', false], ['B', 'B', false], ['C', 'C', true], ['D', 'D', false],
        ]);
        for (const c of [...table[0].classes, ...table[1].classes]) expect(c.color).toBe(resolveMetaclassColoring(s, c.id)!.fill);
    });

    it('skips what is not a model, a model with no class, and names a nameless class by its id', () => {
        const { idlookup } = fixture();
        idlookup.EMPTY = { id: 'EMPTY', className: 'DModel', name: 'Empty', packages: [] };
        idlookup.E.name = undefined;
        const table = metaclassColorTable(idlookup, ['A', 'EMPTY', 'gone', 'MM2'], readMetaclassColoring(undefined));
        expect(table.map((m) => m.modelId)).toEqual(['MM2']);
        expect(table[0].classes[0].name).toBe('E');
    });
});

describe('metaclassColoringVars', () => {
    it('sets the node surface, the text tokens and the border token', () => {
        const o = { fill: '#0ea5e9', text: '#000000' as const, stroke: '#075985', border: true };
        expect(metaclassColoringVars(o)).toEqual({
            '--color-inode-surface': '#0ea5e9',
            '--color-inode-border': '#075985',
            '--color-inode-selected-header-bg': 'transparent',
            '--color-inode-selected-header-border': '#075985',
            '--color-inode-name': '#000000',
            '--color-inode-label': '#000000',
            '--color-inode-quiet': '#000000',
            '--color-inode-footer': '#000000',
        });
    });

    it('paints the border transparent when Border is off (width kept, no layout shift)', () => {
        const o = { fill: '#0ea5e9', text: '#000000' as const, stroke: '#075985', border: false };
        expect(metaclassColoringVars(o)['--color-inode-border']).toBe('transparent');
        expect(metaclassColoringVars(o)['--color-inode-selected-header-border']).toBe('transparent');
    });
});

describe('persistence: the field through the save serializer and a JSON load', () => {
    const roundTrip = <T,>(x: T): T => JSON.parse(JSON.stringify(x, proxyToIdReplacer));

    it('survives the round trip unchanged, and resolves the same', () => {
        const s = fixture({ enabled: true, baseColor: '#f59e0b', border: false });
        const back = roundTrip(s);
        expect(back.idlookup.vp.metaclassColoring).toEqual({ enabled: true, baseColor: '#f59e0b', border: false });
        expect(resolveMetaclassColoring(back, 'D')).toEqual(resolveMetaclassColoring(s, 'D'));
    });

    it('carries the overrides map, keyed by class id, through the round trip', () => {
        const written = withMetaclassOverride(withMetaclassOverride(ON, 'B', SW[0]), 'gone', SW[3]);
        const s = fixture(written);
        const back = roundTrip(s);
        expect(back.idlookup.vp.metaclassColoring).toEqual({ ...ON, overrides: { B: SW[0], gone: SW[3] } });
        expect(readMetaclassColoring(back.idlookup.vp)).toEqual(readMetaclassColoring(s.idlookup.vp));
        for (const c of ['A', 'B', 'C', 'D']) expect(resolveMetaclassColoring(back, c)).toEqual(resolveMetaclassColoring(s, c));
        expect(resolveMetaclassColoring(back, 'B')!.fill).toBe(SW[0]);
    });

    it('stays absent when it was never written, even if a class field left it undefined', () => {
        const s = fixture();
        s.idlookup.vp.metaclassColoring = undefined;
        const back = roundTrip(s);
        expect('metaclassColoring' in back.idlookup.vp).toBe(false);
        expect(resolveMetaclassColoring(back, 'D')).toBeNull();
    });
});
