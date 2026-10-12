/**
 * A custom palette derives light variables only (P-2026-10-10-0910, D-UI-15).
 *
 * `derivePaletteVars` feeds the stylesheet injected by `useCustomPaletteStyleSheet`. Jjodel has
 * no dark theme, so it carries no `.theme-dark` set; the light sets are the values derived on
 * the base of the lane (32ff5bf34 line), pinned literally so that removing the dark set cannot
 * move them.
 */
import { describe, it, expect } from 'vitest';
import { derivePaletteVars } from '../derivePalette';

const SKY = {
    light: {
        '--class-header-bg': 'hsl(199, 85%, 92%)', '--class-abstract-header-bg': 'hsl(199, 30%, 95%)',
        '--enum-header-bg': 'hsl(185, 88%, 93%)', '--package-header-bg': 'hsl(199, 35%, 97%)',
        '--object-header-bg': 'hsl(199, 85%, 92%)', '--orphan-border-color': 'hsl(199, 89%, 47%)',
        '--orphan-header-bg': 'hsl(199, 18%, 90%)', '--node-header-text': 'hsl(199, 55%, 26%)',
        '--stereotype-color': 'hsl(199, 25%, 38%)', '--field-type-color': 'hsl(199, 89%, 45%)',
        '--enum-accent': 'hsl(185, 85%, 42%)', '--package-accent': 'hsl(199, 89%, 41%)',
    },
    lightAbstract: { '--node-header-text': 'hsl(199, 12%, 35%)', '--stereotype-color': 'hsl(199, 10%, 45%)' },
    lightEnum: { '--node-header-text': 'hsl(185, 80%, 27%)' },
    lightPackage: { '--package-header-text': 'hsl(199, 30%, 28%)' },
};

const AMBER = {
    light: {
        '--class-header-bg': 'hsl(32, 85%, 92%)', '--class-abstract-header-bg': 'hsl(32, 30%, 95%)',
        '--enum-header-bg': 'hsl(18, 88%, 93%)', '--package-header-bg': 'hsl(32, 35%, 97%)',
        '--object-header-bg': 'hsl(32, 85%, 92%)', '--orphan-border-color': 'hsl(32, 95%, 47%)',
        '--orphan-header-bg': 'hsl(32, 18%, 90%)', '--node-header-text': 'hsl(32, 55%, 26%)',
        '--stereotype-color': 'hsl(32, 25%, 38%)', '--field-type-color': 'hsl(32, 95%, 45%)',
        '--enum-accent': 'hsl(18, 85%, 42%)', '--package-accent': 'hsl(32, 95%, 41%)',
    },
    lightAbstract: { '--node-header-text': 'hsl(32, 12%, 35%)', '--stereotype-color': 'hsl(32, 10%, 45%)' },
    lightEnum: { '--node-header-text': 'hsl(18, 80%, 27%)' },
    lightPackage: { '--package-header-text': 'hsl(32, 30%, 28%)' },
};

describe('derivePaletteVars — light only', () => {
    it('returns the four light sets and no dark set', () => {
        expect(Object.keys(derivePaletteVars('#0ea5e9')).sort()).toEqual(['light', 'lightAbstract', 'lightEnum', 'lightPackage']);
    });

    it('the light values are the ones derived before the dark set went (sky seed)', () => {
        expect(derivePaletteVars('#0ea5e9')).toEqual(SKY);
    });

    it('the light values are the ones derived before the dark set went (amber seed)', () => {
        expect(derivePaletteVars('#d97706')).toEqual(AMBER);
    });
});
