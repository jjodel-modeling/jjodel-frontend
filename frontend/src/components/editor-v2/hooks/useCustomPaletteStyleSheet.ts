import { useEffect } from 'react';
import type { CustomColorScheme } from '../types';
import { derivePaletteVars } from '../utils/derivePalette';

// ============================================================
// useCustomPaletteStyleSheet
//
// User-created palettes cannot be precompiled SCSS classes, so we inject
// their rules at runtime into a single <style id="jjodel-custom-palettes">
// element in <head>. The emitted CSS is FLAT (no SCSS nesting): one block
// per (palette × theme), mirroring the 3-class specificity of the curated
// `.editor-v2.scheme-<id>.theme-<t>` blocks so they slot into the same
// cascade position. Active scheme is still toggled by the `scheme-<id>`
// class on the `.editor-v2` root (EditorV2.tsx), exactly like built-ins.
// ============================================================

const STYLE_ID = 'jjodel-custom-palettes';

function block(selector: string, vars: Record<string, string>): string {
    const body = Object.entries(vars)
        .map(([k, v]) => `  ${k}: ${v};`)
        .join('\n');
    return `${selector} {\n${body}\n}`;
}

function buildCss(palettes: CustomColorScheme[]): string {
    const blocks: string[] = [];
    for (const p of palettes) {
        if (!p?.id || !p?.seed) continue;
        const { light, dark, lightAbstract, lightEnum, lightPackage } = derivePaletteVars(p.seed);
        const base = `.editor-v2.scheme-${p.id}`;
        blocks.push(block(`${base}.theme-dark`, dark));
        blocks.push(block(`${base}.theme-light`, light));
        blocks.push(block(`${base}.theme-light .mm-class.abstract`, lightAbstract));
        blocks.push(block(`${base}.theme-light .mm-enum`, lightEnum));
        blocks.push(block(`${base}.theme-light .mm-package`, lightPackage));
    }
    return blocks.join('\n\n');
}

/**
 * Keep the injected stylesheet in sync with the current custom palettes.
 * Re-renders the <style> content whenever the palette list changes; the
 * element is removed on full unmount.
 */
export function useCustomPaletteStyleSheet(customPalettes: CustomColorScheme[]): void {
    useEffect(() => {
        let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
        if (!style) {
            style = document.createElement('style');
            style.id = STYLE_ID;
            document.head.appendChild(style);
        }
        style.textContent = buildCss(customPalettes);
    }, [customPalettes]);

    useEffect(() => {
        return () => {
            document.getElementById(STYLE_ID)?.remove();
        };
    }, []);
}
