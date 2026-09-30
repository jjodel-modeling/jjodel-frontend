/**
 * «Color by metaclass» (P-2026-09-30-1815): the pure half of the viewpoint option.
 *
 * The palette, the text contrast, the border shade, the settings reader, the metaclass
 * order and the override resolver all live in `metaclassPalette.ts`, which imports
 * nothing, so this bench EXECUTES them (CLAUDE.md §5). The two render points
 * (`ObjectNode.tsx`, `IRNodeContent.tsx`) do not import here (`joiner` reaches monaco:
 * `window is not defined`) and are measured by the lane probe instead.
 *
 * «Absent on a fresh viewpoint» is a fixture shaped as `Constructors.DViewElement` leaves
 * a viewpoint (it sets none of the optional viewpoint fields); the constructor itself
 * does not import in this bench, and that gap is stated in the log entry.
 */

import { describe, expect, it } from 'vitest';
import {
    DEFAULT_METACLASS_BASE_COLOR,
    borderShade,
    contrastText,
    metaclassColoringVars,
    metaclassOrder,
    metaclassPalette,
    readMetaclassColoring,
    resolveMetaclassColoring,
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
/** Signed hue offset of `c` from `h0`, in -180..180. */
const offsetOf = (h0: number, c: string) => { const d = ((hslOf(c)[0] - h0) % 360 + 540) % 360 - 180; return d; };
const expectOffsets = (base: string, count: number, offsets: number[]) => {
    const [h0] = hslOf(base);
    const p = metaclassPalette(base, count);
    offsets.forEach((o, i) => expect(Math.abs(offsetOf(h0, p[i + 1]) - o)).toBeLessThan(1.5));
};
const BASES = ['#0ea5e9', '#f59e0b', '#808080', '#6366f1', '#22c55e', '#ff0000', '#fefce8', '#0b0b1f'];

describe('metaclassPalette (analogous, R-VP-29)', () => {
    it('is deterministic, and gives an empty list for a count of zero or less', () => {
        expect(metaclassPalette('#0ea5e9', 8)).toEqual(metaclassPalette('#0ea5e9', 8));
        expect(metaclassPalette('#0ea5e9', 8)).toHaveLength(8);
        expect(metaclassPalette('#0ea5e9', 8).every((c) => HEX.test(c))).toBe(true);
        expect(metaclassPalette('#0ea5e9', 0)).toEqual([]);
        expect(metaclassPalette('#0ea5e9', -3)).toEqual([]);
    });

    it('colour 0 is the base colour itself, normalized to #rrggbb', () => {
        expect(metaclassPalette('#0EA5E9', 4)[0]).toBe('#0ea5e9');
        expect(metaclassPalette('#abc', 2)[0]).toBe('#aabbcc');
        expect(metaclassPalette('#fefce8', 3)[0]).toBe('#fefce8');
        expect(metaclassPalette('#0ea5e9', 1)).toEqual(['#0ea5e9']);
    });

    it('up to five classes: +30, -30, +60, -60 degrees from the base hue', () => {
        expectOffsets('#0ea5e9', 2, [30]);
        expectOffsets('#0ea5e9', 3, [30, -30]);
        expectOffsets('#0ea5e9', 5, [30, -30, 60, -60]);
        expectOffsets('#f59e0b', 5, [30, -30, 60, -60]);
    });

    it('above five the step is 120 / (count - 1), never under 15 degrees', () => {
        expectOffsets('#0ea5e9', 7, [20, -20, 40, -40, 60, -60]);
        expectOffsets('#0ea5e9', 9, [15, -15, 30, -30, 45, -45, 60, -60]);
        // count 10: 120/9 = 13.3 is floored at 15, so the window holds eight and the ninth cycles.
        expectOffsets('#0ea5e9', 10, [15, -15, 30, -30, 45, -45, 60, -60, 0]);
    });

    it('keeps the base saturation, clamped to 40..80, and the base lightness, clamped to 35..75, from colour 1', () => {
        for (const c of metaclassPalette('#0ea5e9', 5).slice(1)) {
            expect(Math.abs(hslOf(c)[1] - 80)).toBeLessThan(1.5);
            expect(Math.abs(hslOf(c)[2] - 48.4)).toBeLessThan(1);
        }
        for (const c of metaclassPalette('#808080', 5).slice(1)) expect(Math.abs(hslOf(c)[1] - 40)).toBeLessThan(1.5);
        for (const c of metaclassPalette('#ff0000', 5).slice(1)) expect(Math.abs(hslOf(c)[1] - 80)).toBeLessThan(1.5);
        for (const c of metaclassPalette('#fefce8', 5).slice(1)) expect(Math.abs(hslOf(c)[2] - 75)).toBeLessThan(1);
        for (const c of metaclassPalette('#0b0b1f', 5).slice(1)) expect(Math.abs(hslOf(c)[2] - 35)).toBeLessThan(1);
    });

    it('past the window the hues cycle from the base hue, 10 points darker, then 10 lighter', () => {
        const [h0] = hslOf('#0ea5e9');
        // count 6: step 24, window +-24, +-48; colour 5 is the base hue 10 points darker.
        const six = metaclassPalette('#0ea5e9', 6);
        expect(Math.abs(offsetOf(h0, six[5]))).toBeLessThan(1.5);
        expect(Math.abs(hslOf(six[5])[2] - 38.4)).toBeLessThan(1);
        // count 20: step 15, eight in the window, colours 9..17 darker, 18.. lighter.
        const twenty = metaclassPalette('#0ea5e9', 20);
        expect(Math.abs(hslOf(twenty[17])[2] - 38.4)).toBeLessThan(1);
        expect(Math.abs(offsetOf(h0, twenty[18]))).toBeLessThan(1.5);
        expect(Math.abs(hslOf(twenty[18])[2] - 58.4)).toBeLessThan(1);
        expect(Math.abs(offsetOf(h0, twenty[19]) - 15)).toBeLessThan(1.5);
    });

    it('skips a lightness level outside 35..75', () => {
        // Near white: lightness 75, so the first cycle goes darker (65) and the lighter level is skipped.
        const w = metaclassPalette('#fefce8', 20);
        expect(Math.abs(hslOf(w[9])[2] - 65)).toBeLessThan(1);
        expect(Math.abs(hslOf(w[18])[2] - 55)).toBeLessThan(1);
        // Near black: lightness 35, so the first cycle goes lighter (45).
        expect(Math.abs(hslOf(metaclassPalette('#0b0b1f', 10)[9])[2] - 45)).toBeLessThan(1);
    });

    it('stays analogous: every colour within 60 degrees of the base hue, for 2..10 classes', () => {
        for (const base of BASES) {
            const [h0] = hslOf(base);
            for (let n = 2; n <= 10; n++) {
                for (const c of metaclassPalette(base, n).slice(1)) expect(Math.abs(offsetOf(h0, c))).toBeLessThanOrEqual(61);
            }
        }
    });

    it('gives neighbours visibly different colours (hue >= 15, lightness >= 10 or deltaE >= 15), all distinct, for 2..10 classes', () => {
        for (const base of BASES) {
            for (let n = 2; n <= 10; n++) {
                const p = metaclassPalette(base, n);
                expect(new Set(p).size).toBe(n);
                for (let i = 1; i < n; i++) {
                    const [a, b] = [hslOf(p[i - 1]), hslOf(p[i])];
                    const ok = hueGap(a[0], b[0]) >= 14.5 || Math.abs(a[2] - b[2]) >= 9.5 || deltaE(p[i - 1], p[i]) >= 15;
                    if (!ok) throw new Error(`${base} n=${n} i=${i}: ${p[i - 1]} ${p[i]}`);
                }
            }
        }
    });

    it('falls back to the default base on an invalid hex', () => {
        const expected = metaclassPalette(DEFAULT_METACLASS_BASE_COLOR, 5);
        expect(DEFAULT_METACLASS_BASE_COLOR).toBe('#0ea5e9');
        for (const bad of ['blue', '#12345', '', '#ggg', '0ea5e9', undefined as unknown as string, null as unknown as string]) {
            expect(metaclassPalette(bad, 5)).toEqual(expected);
        }
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

describe('borderShade', () => {
    it('keeps hue and saturation and takes 25 points of lightness', () => {
        const [h, s, l] = hslOf('#0ea5e9');
        const [h2, s2, l2] = hslOf(borderShade('#0ea5e9'));
        expect(hueGap(h, h2)).toBeLessThan(1.5);
        expect(Math.abs(s - s2)).toBeLessThan(2);
        expect(Math.abs(l - 25 - l2)).toBeLessThan(1);
    });

    it('never goes below 10% lightness', () => {
        expect(Math.abs(hslOf(borderShade('#1e1e3c'))[2] - 10)).toBeLessThan(1);
        expect(HEX.test(borderShade('#000000'))).toBe(true);
    });
});

describe('readMetaclassColoring', () => {
    it('reads an absent field as off with the defaults the panel shows', () => {
        expect(readMetaclassColoring(undefined)).toEqual({ enabled: false, baseColor: '#0ea5e9', border: true });
        expect(readMetaclassColoring({ id: 'vp' })).toEqual({ enabled: false, baseColor: '#0ea5e9', border: true });
    });

    it('keeps the stored values, and repairs only an invalid base', () => {
        expect(readMetaclassColoring({ metaclassColoring: { enabled: true, baseColor: '#F59E0B', border: false } }))
            .toEqual({ enabled: true, baseColor: '#f59e0b', border: false });
        expect(readMetaclassColoring({ metaclassColoring: { enabled: true, baseColor: 'nope' } }))
            .toEqual({ enabled: true, baseColor: '#0ea5e9', border: true });
    });
});

// A metamodel MM: package P1 holds A, B and the subpackage P2 (holding C); package P3 holds D.
// The model M1 has one object per class. The arrays are in the order the metamodel keeps.
function fixture(coloring?: unknown, active: string | null = 'vp') {
    const idlookup: Record<string, any> = {
        MM: { id: 'MM', className: 'DModel', isMetamodel: true, packages: ['P1', 'P3'] },
        P1: { id: 'P1', className: 'DPackage', father: 'MM', classes: ['A', 'B'], subpackages: ['P2'] },
        P2: { id: 'P2', className: 'DPackage', father: 'P1', classes: ['C'], subpackages: [] },
        P3: { id: 'P3', className: 'DPackage', father: 'MM', classes: ['D'], subpackages: [] },
        A: { id: 'A', className: 'DClass', name: 'A', father: 'P1', abstract: true },
        B: { id: 'B', className: 'DClass', name: 'B', father: 'P1' },
        C: { id: 'C', className: 'DClass', name: 'C', father: 'P2' },
        D: { id: 'D', className: 'DClass', name: 'D', father: 'P3' },
        // A fresh viewpoint as Constructors.DViewElement leaves it: no optional viewpoint field.
        vp: { id: 'vp', className: 'DViewPoint', name: 'Colors', isExclusiveView: true, isValidation: false, viewpoint: 'vp' },
        other: { id: 'other', className: 'DViewPoint', name: 'Other', isExclusiveView: true, isValidation: false, viewpoint: 'other',
            metaclassColoring: { enabled: true, baseColor: '#f59e0b', border: true } },
    };
    if (coloring !== undefined) idlookup.vp.metaclassColoring = coloring;
    return { viewpoint: active, idlookup };
}

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
        expect(resolveMetaclassColoring(fixture({ enabled: true, baseColor: '#0ea5e9', border: true }, null), 'C')).toBeNull();
        expect(resolveMetaclassColoring(fixture({ enabled: true, baseColor: '#0ea5e9', border: true }, ''), 'C')).toBeNull();
        // `other` has the toggle on but is not active; the active one has none.
        expect(resolveMetaclassColoring(fixture(), 'C')).toBeNull();
    });

    it('returns nothing for an object with no metaclass', () => {
        const s = fixture({ enabled: true, baseColor: '#0ea5e9', border: true });
        expect(resolveMetaclassColoring(s, '')).toBeNull();
        expect(resolveMetaclassColoring(s, undefined)).toBeNull();
    });

    it('on: the palette colour at the class index, its contrast text and its shade', () => {
        const s = fixture({ enabled: true, baseColor: '#f59e0b', border: true });
        const palette = metaclassPalette('#f59e0b', 4);
        for (const [cls, i] of [['A', 0], ['B', 1], ['C', 2], ['D', 3]] as const) {
            const o = resolveMetaclassColoring(s, cls)!;
            expect(o.fill).toBe(palette[i]);
            expect(o.text).toBe(contrastText(palette[i]));
            expect(o.stroke).toBe(borderShade(palette[i]));
            expect(o.border).toBe(true);
        }
        expect(resolveMetaclassColoring(s, 'A')!.fill).toBe('#f59e0b');
    });

    it('carries the Border checkbox', () => {
        expect(resolveMetaclassColoring(fixture({ enabled: true, baseColor: '#0ea5e9', border: false }), 'B')!.border).toBe(false);
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

    it('stays absent when it was never written, even if a class field left it undefined', () => {
        const s = fixture();
        s.idlookup.vp.metaclassColoring = undefined;
        const back = roundTrip(s);
        expect('metaclassColoring' in back.idlookup.vp).toBe(false);
        expect(resolveMetaclassColoring(back, 'D')).toBeNull();
    });
});
