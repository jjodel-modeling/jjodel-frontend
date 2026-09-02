/**
 * Test of `jjform/themes` — the four presets, the per-field cascade, and the closure
 * of the registry (slice FL2).
 *
 * Pure over plain data, like the rest of this directory: the module imports nothing,
 * so there is no fake store to build.
 *
 * What is worth holding here is not that four objects have the right values — it is
 * the two properties those objects are FOR. First, that the cascade merges per FIELD
 * and not per preset: a class that wants a denser form must be able to say so without
 * inheriting the placement of whatever preset it was written next to. Second, that the
 * registry is closed at three fields, which is a compile-time claim and therefore has
 * to be tested at compile time (`@ts-expect-error`, checked by `npm run typecheck`
 * since tsconfig includes `src`).
 */

import { describe, expect, it } from 'vitest';
import {
    DENSITY_SCALE,
    FORM_THEME_DEFAULT,
    FORM_THEME_DEFAULT_NAME,
    FORM_THEME_NAMES,
    FORM_THEME_PRESETS,
    LABEL_COLUMN_WIDTH,
    LABEL_LAYOUT,
    SECTION_CHROME,
    SECTION_HEADER_BAND,
    resolveTheme,
    themeLayer,
    themeName,
} from '../themes';
import type { Density, FormTheme, FormThemeName, SectionStyle } from '../themes';

describe('the four presets', () => {
    /** The spec's table, transcribed once and read by the cases below. If this
     *  disagrees with `docs/design/design_handoff_jjodel_form_views/form-autolayout-spec.md`
     *  section "Themes", the spec wins and this is the bug. */
    const TABLE: Record<FormThemeName, FormTheme> = {
        Comfortable: { labelPlacement: 'top', density: 'comfortable', sectionStyle: 'flat' },
        Compact: { labelPlacement: 'left', density: 'compact', sectionStyle: 'divided' },
        Sectioned: { labelPlacement: 'top', density: 'comfortable', sectionStyle: 'card' },
        Dense: { labelPlacement: 'left', density: 'dense', sectionStyle: 'none' },
    };

    it.each(FORM_THEME_NAMES)('%s resolves to the spec row', (name) => {
        expect(FORM_THEME_PRESETS[name]).toEqual(TABLE[name]);
        // And through the cascade, not only as a literal: a preset used as the
        // viewpoint layer must land on itself.
        expect(resolveTheme(null, themeLayer(name))).toEqual(TABLE[name]);
    });

    it('names exactly four presets, no more', () => {
        expect(Object.keys(FORM_THEME_PRESETS).sort()).toEqual(
            ['Comfortable', 'Compact', 'Dense', 'Sectioned'],
        );
        expect(FORM_THEME_NAMES).toHaveLength(4);
    });

    it('distinguishes the preset Compact from the density compact', () => {
        // Two presets share `comfortable` and differ in chrome, which is the whole
        // reason the preset name is not the density name.
        expect(FORM_THEME_PRESETS.Sectioned.density).toBe('comfortable');
        expect(FORM_THEME_PRESETS.Comfortable.density).toBe('comfortable');
        expect(FORM_THEME_PRESETS.Sectioned).not.toEqual(FORM_THEME_PRESETS.Comfortable);
    });

    it('round-trips a preset through themeName', () => {
        for (const name of FORM_THEME_NAMES) {
            expect(themeName(FORM_THEME_PRESETS[name])).toBe(name);
        }
    });
});

describe('the default', () => {
    it('is Comfortable when nothing is declared at any level', () => {
        expect(resolveTheme()).toEqual(FORM_THEME_PRESETS.Comfortable);
        expect(resolveTheme(undefined, undefined, undefined)).toEqual(FORM_THEME_PRESETS.Comfortable);
        expect(resolveTheme(null, null, null)).toEqual(FORM_THEME_PRESETS.Comfortable);
        expect(FORM_THEME_DEFAULT_NAME).toBe('Comfortable');
        expect(FORM_THEME_DEFAULT).toEqual(FORM_THEME_PRESETS.Comfortable);
    });

    it('is Comfortable when the layers are present but empty', () => {
        expect(resolveTheme({}, {}, {})).toEqual(FORM_THEME_PRESETS.Comfortable);
    });
});

describe('the cascade merges per field', () => {
    it('viewpoint Compact plus a per-class density override gives left/dense/divided', () => {
        // The case named in the prompt. `Compact` is left/compact/divided; the class
        // changes only the density, and keeps the other two.
        const out = resolveTheme(null, themeLayer('Compact'), { density: 'dense' });
        expect(out).toEqual({ labelPlacement: 'left', density: 'dense', sectionStyle: 'divided' });
        // And the result is deliberately NOT one of the four presets: a per-field
        // override can produce a combination no preset names.
        expect(themeName(out)).toBeNull();
    });

    it('applies the levels least- to most-specific', () => {
        const out = resolveTheme(
            { labelPlacement: 'left', density: 'dense', sectionStyle: 'card' },
            { density: 'compact' },
            { sectionStyle: 'none' },
        );
        expect(out).toEqual({ labelPlacement: 'left', density: 'compact', sectionStyle: 'none' });
    });

    it('lets a metamodel default survive levels that have no opinion', () => {
        const out = resolveTheme({ labelPlacement: 'left' }, {}, {});
        expect(out.labelPlacement).toBe('left');
        // The two fields nobody spoke about fall back to the factory default, not to
        // whatever the metamodel's preset would have been.
        expect(out.density).toBe('comfortable');
        expect(out.sectionStyle).toBe('flat');
    });

    it('does not let an explicit undefined erase the level below', () => {
        // This is the case a bare spread gets wrong, and the reason the resolver
        // filters. A layer built by an authoring UI carries the key with `undefined`
        // when the control is set to "inherit".
        const out = resolveTheme(null, themeLayer('Dense'), { density: undefined });
        expect(out).toEqual(FORM_THEME_PRESETS.Dense);
    });

    it('does not mutate the presets', () => {
        const before = { ...FORM_THEME_PRESETS.Compact };
        resolveTheme(themeLayer('Compact'), { density: 'dense' }, { sectionStyle: 'card' });
        expect(FORM_THEME_PRESETS.Compact).toEqual(before);
        // `themeLayer` hands out a copy, so a caller that writes into it cannot reach
        // the table.
        const layer = themeLayer('Compact');
        layer.density = 'dense';
        expect(FORM_THEME_PRESETS.Compact.density).toBe('compact');
    });
});

describe('the registry is closed', () => {
    it('rejects a fourth field at compile time', () => {
        const ok: FormTheme = { labelPlacement: 'top', density: 'compact', sectionStyle: 'flat' };
        expect(ok.density).toBe('compact');

        // @ts-expect-error — a theme has exactly three fields; a fourth is not a
        // theme. If this directive ever becomes unused, the type stopped closing the
        // registry and `npm run typecheck` says so (tsconfig includes `src`).
        const extra: FormTheme = { labelPlacement: 'top', density: 'compact', sectionStyle: 'flat', accent: '#ff0000' };
        expect(Object.keys(extra)).toHaveLength(4);
    });

    it('rejects a value outside the three vocabularies', () => {
        // @ts-expect-error — 'cosy' is not a density.
        const bad: Partial<FormTheme> = { density: 'cosy' };
        expect(bad.density).toBe('cosy');
    });

    it('accepts a new preset only as a combination of the same three fields', () => {
        // What "a new theme is a new preset, no new fields" means when written down.
        const invented: FormTheme = { labelPlacement: 'left', density: 'comfortable', sectionStyle: 'card' };
        expect(resolveTheme(null, invented)).toEqual(invented);
        expect(themeName(invented)).toBeNull();
    });
});

describe('the rendering scales map the three fields', () => {
    it('gives every density a full scale', () => {
        const densities: Density[] = ['comfortable', 'compact', 'dense'];
        for (const d of densities) {
            const s = DENSITY_SCALE[d];
            expect(s.fieldPaddingY).toBeGreaterThan(0);
            expect(s.fieldPaddingX).toBeGreaterThan(0);
            expect(s.fontSize).toBeGreaterThan(0);
            expect(s.rowGap).toBeGreaterThan(0);
            expect(s.sectionGap).toBeGreaterThan(0);
        }
    });

    it('carries the numbers of the spec', () => {
        expect(DENSITY_SCALE.comfortable).toEqual({
            fieldPaddingY: 7, fieldPaddingX: 10, fontSize: 12.5, rowGap: 14, sectionGap: 14,
        });
        expect(DENSITY_SCALE.compact).toEqual({
            fieldPaddingY: 5, fieldPaddingX: 9, fontSize: 12, rowGap: 8, sectionGap: 14,
        });
        expect(DENSITY_SCALE.dense).toEqual({
            fieldPaddingY: 4, fieldPaddingX: 8, fontSize: 11.5, rowGap: 6, sectionGap: 14,
        });
    });

    it('is monotone: denser is never larger', () => {
        // The property that makes the three steps a SCALE rather than three unrelated
        // presets. A future edit that makes `dense` roomier than `compact` fails here.
        const order = [DENSITY_SCALE.comfortable, DENSITY_SCALE.compact, DENSITY_SCALE.dense];
        for (let i = 1; i < order.length; i++) {
            expect(order[i].fieldPaddingY).toBeLessThan(order[i - 1].fieldPaddingY);
            expect(order[i].fieldPaddingX).toBeLessThan(order[i - 1].fieldPaddingX);
            expect(order[i].fontSize).toBeLessThan(order[i - 1].fontSize);
            expect(order[i].rowGap).toBeLessThan(order[i - 1].rowGap);
        }
    });

    it('keeps the section gap constant across the steps', () => {
        // Deliberate: density tightens the ROWS. Letting it tighten the section
        // boundary too would undo the only separation `sectionStyle: 'none'` leaves.
        expect(DENSITY_SCALE.compact.sectionGap).toBe(DENSITY_SCALE.comfortable.sectionGap);
        expect(DENSITY_SCALE.dense.sectionGap).toBe(DENSITY_SCALE.comfortable.sectionGap);
    });

    it('gives a label column only to the left placement', () => {
        expect(LABEL_LAYOUT.top.columnWidth).toBeNull();
        expect(LABEL_LAYOUT.left.columnWidth).toBe(LABEL_COLUMN_WIDTH);
        expect(LABEL_LAYOUT.left.align).toBe('right');
        expect(LABEL_LAYOUT.top.align).toBe('left');
    });

    it('keeps the label column inside the spec range and on the 8px grid', () => {
        expect(LABEL_COLUMN_WIDTH).toBeGreaterThanOrEqual(72);
        expect(LABEL_COLUMN_WIDTH).toBeLessThanOrEqual(78);
        expect(LABEL_COLUMN_WIDTH % 8).toBe(0);
    });

    it('gives every section style a chrome, and only card gets a band', () => {
        const styles: SectionStyle[] = ['flat', 'divided', 'card', 'none'];
        for (const s of styles) expect(SECTION_CHROME[s]).toBeDefined();

        expect(SECTION_CHROME.flat).toEqual({ eyebrow: true, divider: false, card: false, headerBand: null });
        expect(SECTION_CHROME.divided.divider).toBe(true);
        expect(SECTION_CHROME.card.card).toBe(true);
        expect(SECTION_CHROME.card.headerBand).toBe(SECTION_HEADER_BAND);

        for (const s of styles) {
            if (s !== 'card') expect(SECTION_CHROME[s].headerBand).toBeNull();
        }
    });

    it('draws nothing at all for none', () => {
        expect(SECTION_CHROME.none).toEqual({
            eyebrow: false, divider: false, card: false, headerBand: null,
        });
    });

    it('emits the header band as a token, not as a hex', () => {
        // A literal `#f8fafc` would be right in light and wrong in dark. The token is
        // painted `$slate-50` in light, which IS the spec's value.
        expect(SECTION_HEADER_BAND).toBe('var(--color-form-panel)');
    });
});
