// ============================================================
// derivePalette — seed-driven canvas palette derivation
//
// A user palette is defined by a single seed hex color. From it we
// derive the same ~12 CSS custom properties (× light/dark theme) that
// the curated palettes in `_color-schemes.scss` hardcode, plus the
// light-only per-node-type text re-overrides.
//
// The HSL formulas below were fitted to the 5 curated palettes so that
// a blue seed reproduces "Sapphire" closely; every seed yields an
// internally-consistent palette. Pure functions of the seed — no drift.
// ============================================================

type HSL = [number, number, number];

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
const wrap = (h: number): number => ((h % 360) + 360) % 360;

/** Parse a #rgb / #rrggbb hex into HSL (h 0-360, s/l 0-100, integer-rounded). */
export function hexToHsl(hex: string): HSL {
    let h = hex.replace('#', '').trim();
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    const l = (max + min) / 2;
    let hue = 0;
    let sat = 0;
    if (d !== 0) {
        sat = d / (1 - Math.abs(2 * l - 1));
        switch (max) {
            case r: hue = ((g - b) / d) % 6; break;
            case g: hue = (b - r) / d + 2; break;
            default: hue = (r - g) / d + 4; break;
        }
        hue *= 60;
        if (hue < 0) hue += 360;
    }
    return [Math.round(hue), Math.round(sat * 100), Math.round(l * 100)];
}

const hsl = (h: number, s: number, l: number): string => `hsl(${Math.round(wrap(h))}, ${Math.round(s)}%, ${Math.round(l)}%)`;
const hsla = (h: number, s: number, l: number, a: number): string => `hsla(${Math.round(wrap(h))}, ${Math.round(s)}%, ${Math.round(l)}%, ${a})`;

/** The CSS custom properties a palette controls, grouped for the injector. */
export interface DerivedPaletteVars {
    /** Root vars for `.theme-light`. */
    light: Record<string, string>;
    /** Root vars for `.theme-dark`. */
    dark: Record<string, string>;
    /** Light-only `.mm-class.abstract` re-overrides. */
    lightAbstract: Record<string, string>;
    /** Light-only `.mm-enum` re-override. */
    lightEnum: Record<string, string>;
    /** Light-only `.mm-package` re-override. */
    lightPackage: Record<string, string>;
}

/**
 * Derive the full set of canvas vars (both themes) from a seed hex.
 * Mirrors the structure of the curated palette blocks 1:1.
 */
export function derivePaletteVars(seed: string): DerivedPaletteVars {
    const [h, s] = hexToHsl(seed);
    const sC = clamp(s, 55, 95);   // saturated channel (accents / borders)
    const eH = wrap(h - 14);       // enum sibling hue

    const classBgLight = hsl(h, 85, 92);

    const light: Record<string, string> = {
        '--class-header-bg': classBgLight,
        '--class-abstract-header-bg': hsl(h, 30, 95),
        '--enum-header-bg': hsl(eH, 88, 93),
        '--package-header-bg': hsl(h, 35, 97),
        '--object-header-bg': classBgLight,
        '--orphan-border-color': hsl(h, sC, 47),
        '--orphan-header-bg': hsl(h, 18, 90),
        '--node-header-text': hsl(h, 55, 26),
        '--stereotype-color': hsl(h, 25, 38),
        '--field-type-color': hsl(h, sC, 45),
        '--enum-accent': hsl(eH, 85, 42),
        '--package-accent': hsl(h, sC, 41),
    };

    const dark: Record<string, string> = {
        '--class-header-bg': hsla(h, sC, 50, 0.24),
        '--class-abstract-header-bg': hsla(h, 28, 33, 0.26),
        '--enum-header-bg': hsla(eH, 82, 48, 0.22),
        '--package-header-bg': hsla(h, 45, 22, 0.28),
        '--object-header-bg': hsla(h, sC, 50, 0.18),
        '--orphan-border-color': hsl(h, sC, 58),
        '--orphan-header-bg': hsla(h, 13, 50, 0.2),
        // Dark text is theme-constant across all curated palettes.
        '--node-header-text': 'rgba(255, 255, 255, 0.92)',
        '--stereotype-color': 'rgba(255, 255, 255, 0.55)',
        '--field-type-color': hsl(h, 88, 76),
        '--enum-accent': hsl(eH, 88, 62),
        '--package-accent': hsl(h, sC, 58),
    };

    const lightAbstract: Record<string, string> = {
        '--node-header-text': hsl(h, 12, 35),
        '--stereotype-color': hsl(h, 10, 45),
    };
    const lightEnum: Record<string, string> = {
        '--node-header-text': hsl(eH, 80, 27),
    };
    const lightPackage: Record<string, string> = {
        '--package-header-text': hsl(h, 30, 28),
    };

    return { light, dark, lightAbstract, lightEnum, lightPackage };
}

/**
 * Derive the 4 menu-preview swatches for a seed, in the same order the
 * curated `PALETTE_OPTIONS` use: [class, abstract, enum, package].
 * Mirrors the curated swatch logic (saturated color / light slate /
 * sibling color / dark slate) so custom rows read consistently next to
 * the built-ins. Kept separate from `derivePaletteVars` on purpose: the
 * light header fills (L 91-97%) are near-white and illegible at swatch
 * size, so the menu shows saturated representatives instead.
 */
export function derivePaletteSwatches(seed: string): [string, string, string, string] {
    const [h, s] = hexToHsl(seed);
    const sC = clamp(s, 55, 95);
    const eH = wrap(h - 14);
    return [
        hsl(h, sC, 50),   // class
        hsl(h, 16, 70),   // abstract (light slate tint)
        hsl(eH, 85, 52),  // enum (sibling color)
        hsl(h, 20, 40),   // package (dark slate tint)
    ];
}
