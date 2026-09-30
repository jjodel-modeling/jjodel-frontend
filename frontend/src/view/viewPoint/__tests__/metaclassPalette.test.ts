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

describe('metaclassPalette', () => {
    it('is deterministic, and a colour does not depend on the count', () => {
        const a = metaclassPalette('#0ea5e9', 8);
        const b = metaclassPalette('#0ea5e9', 8);
        expect(a).toEqual(b);
        expect(a).toHaveLength(8);
        expect(a.every((c) => HEX.test(c))).toBe(true);
        expect(metaclassPalette('#0ea5e9', 5)).toEqual(a.slice(0, 5));
    });

    it('colour 0 is the base colour itself, normalized to #rrggbb', () => {
        expect(metaclassPalette('#0EA5E9', 4)[0]).toBe('#0ea5e9');
        expect(metaclassPalette('#abc', 2)[0]).toBe('#aabbcc');
        // A base outside the clamps is still colour 0 as picked.
        expect(metaclassPalette('#fefce8', 3)[0]).toBe('#fefce8');
    });

    it('colour i rotates the hue of the base by i x 137.508 degrees', () => {
        const [h0] = hslOf('#0ea5e9');
        const p = metaclassPalette('#0ea5e9', 6);
        for (let i = 1; i < p.length; i++) {
            expect(hueGap(hslOf(p[i])[0], (h0 + i * 137.508) % 360)).toBeLessThan(1.5);
        }
    });

    it('keeps the base saturation and lightness from colour 1, clamped to S 40..80 and L 40..72', () => {
        // #0ea5e9: S 88.7 is clamped to 80, L 48.4 is kept.
        for (const c of metaclassPalette('#0ea5e9', 6).slice(1)) {
            const [, s, l] = hslOf(c);
            expect(Math.abs(s - 80)).toBeLessThan(1.5);
            expect(Math.abs(l - 48.4)).toBeLessThan(1);
        }
        // Near white: L 95 clamped to 72.
        for (const c of metaclassPalette('#fefce8', 5).slice(1)) expect(Math.abs(hslOf(c)[2] - 72)).toBeLessThan(1);
        // Near black: L 8 clamped to 40.
        for (const c of metaclassPalette('#0b0b1f', 5).slice(1)) expect(Math.abs(hslOf(c)[2] - 40)).toBeLessThan(1);
        // Grey: S 0 raised to 40, so the classes still differ by hue.
        for (const c of metaclassPalette('#808080', 5).slice(1)) expect(Math.abs(hslOf(c)[1] - 40)).toBeLessThan(1.5);
        // Pure red: S 100 lowered to 80.
        for (const c of metaclassPalette('#ff0000', 5).slice(1)) expect(Math.abs(hslOf(c)[1] - 80)).toBeLessThan(1.5);
    });

    it('gives eight classes eight distinct hues, at least 20 degrees apart', () => {
        const hues = metaclassPalette('#0ea5e9', 8).map((c) => hslOf(c)[0]);
        expect(new Set(metaclassPalette('#0ea5e9', 8)).size).toBe(8);
        for (let i = 0; i < hues.length; i++) {
            for (let j = i + 1; j < hues.length; j++) expect(hueGap(hues[i], hues[j])).toBeGreaterThanOrEqual(20);
        }
    });

    it('falls back to the default base on an invalid hex', () => {
        const expected = metaclassPalette(DEFAULT_METACLASS_BASE_COLOR, 5);
        expect(DEFAULT_METACLASS_BASE_COLOR).toBe('#0ea5e9');
        for (const bad of ['blue', '#12345', '', '#ggg', '0ea5e9', undefined as unknown as string, null as unknown as string]) {
            expect(metaclassPalette(bad, 5)).toEqual(expected);
        }
    });

    it('gives an empty list for a count of zero or less', () => {
        expect(metaclassPalette('#0ea5e9', 0)).toEqual([]);
        expect(metaclassPalette('#0ea5e9', -3)).toEqual([]);
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
            '--color-inode-name': '#000000',
            '--color-inode-label': '#000000',
            '--color-inode-quiet': '#000000',
            '--color-inode-footer': '#000000',
        });
    });

    it('paints the border transparent when Border is off (width kept, no layout shift)', () => {
        const o = { fill: '#0ea5e9', text: '#000000' as const, stroke: '#075985', border: false };
        expect(metaclassColoringVars(o)['--color-inode-border']).toBe('transparent');
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
