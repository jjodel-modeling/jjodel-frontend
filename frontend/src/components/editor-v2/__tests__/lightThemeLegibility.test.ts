import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Legibility of the default notation in the light theme, from the token values
 * (lane V2, P-2026-09-29-1332, R-VP-18). The ratios are WCAG 2 contrast: 4.5:1 for
 * text, 3:1 for graphics (an edge and its arrowheads).
 *
 * Limit, stated because it decides what these tests are worth: this runs in node,
 * so it resolves the tokens through the two maps and the design-system file, not
 * through the cascade. A scheme, a header variant or an inline style can still
 * paint something else; the painted colours were measured by the lane's probe
 * (`scripts/smoke/_tmp_v2_visual.ts`, gitignored) on the four demo scenes.
 */

const read = (p: string) => readFileSync(resolve(__dirname, p), 'utf8');
const THEMES = read('../_themes.scss');
const TOKENS = read('../../../styles/tokens/_colors-light.scss');

/** The entries of one of the two theme maps of _themes.scss. */
const themeMap = (which: 'light' | 'dark') => {
    const body = THEMES.split(`$editor-v2-theme-${which}: (`)[1].split('\n);')[0];
    const out = new Map<string, string>();
    for (const m of body.matchAll(/^\s*'([a-z0-9-]+)':\s*(.+),\s*(?:\/\/.*)?$/gm)) out.set(m[1], m[2].trim());
    return out;
};
const LIGHT = themeMap('light');

/** A value of the light map down to a hex: map entries, then --color-* tokens, then $palette variables. */
function hexOf(value: string, depth = 0): string {
    expect(depth, `unresolvable ${value}`).toBeLessThan(8);
    const v = value.trim();
    if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
    const cssVar = v.match(/^var\(--([a-z0-9-]+)\)$/);
    if (cssVar) {
        const own = LIGHT.get(cssVar[1]);
        if (own !== undefined) return hexOf(own, depth + 1);
        const tok = TOKENS.match(new RegExp(`^\\s*--${cssVar[1]}:\\s*([^;]+);`, 'm'));
        expect(tok, `--${cssVar[1]} not in _colors-light.scss`).not.toBeNull();
        return hexOf(tok![1], depth + 1);
    }
    const sass = v.match(/^#\{\$([a-z0-9-]+)\}$/) ?? v.match(/^\$([a-z0-9-]+)$/);
    if (sass) {
        const pal = TOKENS.match(new RegExp(`^\\$${sass[1]}:\\s*([^;]+);`, 'm'));
        expect(pal, `$${sass[1]} not in _colors-light.scss`).not.toBeNull();
        return hexOf(pal![1], depth + 1);
    }
    throw new Error(`not a solid colour: ${value}`);
}

const lum = (hex: string) => {
    const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
        .map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a: string, b: string) => {
    const [x, y] = [lum(hexOf(a)), lum(hexOf(b))];
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const light = (name: string) => { const v = LIGHT.get(name); expect(v, `'${name}' not in the light map`).toBeDefined(); return v!; };

describe('M2 class header — the name reads at 4.5:1 on its fill', () => {
    it('on a concrete class', () => {
        expect(ratio(light('node-header-text'), light('class-header-bg'))).toBeGreaterThanOrEqual(4.5);
    });

    it('on an abstract class', () => {
        expect(ratio(light('node-header-text'), light('class-abstract-header-bg'))).toBeGreaterThanOrEqual(4.5);
    });

    it('the stereotype line of the same header too', () => {
        expect(ratio(light('stereotype-color'), light('class-header-bg'))).toBeGreaterThanOrEqual(4.5);
        expect(ratio(light('stereotype-color'), light('class-abstract-header-bg'))).toBeGreaterThanOrEqual(4.5);
    });
});

describe('edges of the default notation — 3:1 on the canvas, arrowheads with the line', () => {
    it('the line', () => {
        expect(ratio(light('edge-color'), light('canvas-bg'))).toBeGreaterThanOrEqual(3);
    });

    it('the arrowheads follow the line', () => {
        expect(hexOf(light('edge-marker-stroke'))).toBe(hexOf(light('edge-color')));
    });

    it('the ink is the Petri ink', () => {
        expect(hexOf(light('edge-color'))).toBe(hexOf('var(--color-inode-name)'));
    });
});

describe('M1 quiet text — the dash and the count read at 3:1 on the node', () => {
    it('--color-inode-quiet on --color-inode-surface', () => {
        expect(ratio('var(--color-inode-quiet)', 'var(--color-inode-surface)')).toBeGreaterThanOrEqual(3);
    });

    it('and stays the quietest role: not above the property labels', () => {
        expect(ratio('var(--color-inode-quiet)', 'var(--color-inode-surface)'))
            .toBeLessThanOrEqual(ratio('var(--color-inode-label)', 'var(--color-inode-surface)'));
    });
});
