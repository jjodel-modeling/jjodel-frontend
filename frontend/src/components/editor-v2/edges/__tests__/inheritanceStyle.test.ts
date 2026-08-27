import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Regression guard on how an inheritance edge is coloured and how big its
 * triangle is, after the bus fix (fbb0d1115) changed both.
 *
 * Limit, stated because it decides what these tests are worth: this runs in
 * node, so it reads the sources and asserts the WIRING — which token each rule
 * consumes, which value the light map holds. It cannot resolve the cascade, so
 * it cannot prove the painted colour. The browser-side measurement of the
 * resolved stroke lives in `scripts/smoke/_tmp_inheritance_bus.ts`, which reads
 * getComputedStyle on a real tree (measured 2026-08-27: rgb(148, 163, 184) on a
 * non-selected edge in the light theme).
 */

const read = (p: string) => readFileSync(resolve(__dirname, p), 'utf8');

const THEMES = read('../../_themes.scss');
const EDITOR_SCSS = read('../../EditorV2.scss');
const UNIFIED_EDGE = read('../UnifiedEdge.tsx');

/** The body of one of the two theme maps. */
const themeMap = (which: 'light' | 'dark') =>
    THEMES.split(`$editor-v2-theme-${which}: (`)[1].split('\n);')[0];

/** A top-level SCSS block, from its selector to the closing brace in column 0. */
const scssBlock = (selector: string) => {
    const start = EDITOR_SCSS.indexOf(`\n${selector} {`);
    expect(start, `block ${selector} not found`).toBeGreaterThan(-1);
    const end = EDITOR_SCSS.indexOf('\n}', start);
    return EDITOR_SCSS.slice(start, end);
};

/** Declarations of a block, minus its nested rules (`&.selected` and friends). */
const topLevelDecls = (block: string) => block.split(/&[.:]/)[0];

describe('inheritance edge — colour wiring', () => {
    it('the light map carries the slate stroke and the white triangle', () => {
        const light = themeMap('light');
        expect(light).toMatch(/'inheritance-stroke':\s*#94a3b8,/);
        expect(light).toMatch(/'inheritance-marker-fill':\s*#ffffff,/);
    });

    it('the dark map defines the same two names — a token missing on one side paints nothing', () => {
        const dark = themeMap('dark');
        expect(dark).toMatch(/'inheritance-stroke':/);
        expect(dark).toMatch(/'inheritance-marker-fill':/);
    });

    it('the non-selected edge consumes the inheritance token, and nothing else', () => {
        const decls = topLevelDecls(scssBlock('.inheritance-edge'));
        expect(decls).toMatch(/stroke:\s*var\(--inheritance-stroke\)/);
        // The blue of selection is legitimate only under `&.selected`; the grey of
        // the reference edges is not this edge's colour any more.
        expect(decls).not.toMatch(/--edge-selected/);
        expect(decls).not.toMatch(/--edge-color/);
    });

    it('selection keeps its own colour, and only there', () => {
        const block = scssBlock('.inheritance-edge');
        expect(block).toMatch(/&\.selected\s*\{[^}]*stroke:\s*var\(--edge-selected\)/);
    });

    it('the junction dot and the triangle take the stroke colour of the line', () => {
        expect(topLevelDecls(scssBlock('.inheritance-junction'))).toMatch(/fill:\s*var\(--inheritance-stroke\)/);
        const marker = topLevelDecls(scssBlock('.inheritance-marker'));
        expect(marker).toMatch(/stroke:\s*var\(--inheritance-stroke\)/);
        expect(marker).toMatch(/fill:\s*var\(--inheritance-marker-fill\)/);
    });
});

describe('inheritance triangle — size is fixed, not a function of the line', () => {
    /** Every <marker> that carries an inheritance triangle, with its attributes. */
    const markers = () => {
        const out: string[] = [];
        const re = /<marker\b[\s\S]*?>/g;
        for (const m of UNIFIED_EDGE.match(re) ?? []) {
            if (/treeMarkerId|markerTriangleId/.test(m)) out.push(m);
        }
        return out;
    };

    it('both classic triangles are declared, and each pins its own size', () => {
        const found = markers();
        expect(found).toHaveLength(2);
        for (const m of found) {
            // Without this, markerUnits defaults to 'strokeWidth' and the triangle
            // scales with the line: at 1.5px it rendered 18x10 instead of 12x10
            // (measured 2026-08-27, scale factor 1.5).
            expect(m).toMatch(/markerUnits="userSpaceOnUse"/);
        }
    });

    it('the triangle geometry is the committed one — only fill and stroke ever changed', () => {
        for (const m of markers()) {
            expect(m).toMatch(/viewBox="0 0 12 10"/);
            expect(m).toMatch(/markerWidth="12"/);
            expect(m).toMatch(/markerHeight="10"/);
            expect(m).toMatch(/refX="7"/);
            expect(m).toMatch(/refY="5"/);
        }
        // Two triangles drawn with the same polygon: the tree one and the single-edge one.
        const triangles = UNIFIED_EDGE.match(/d="M 0 0 L 12 5 L 0 10 Z"/g) ?? [];
        expect(triangles.length).toBeGreaterThanOrEqual(2);
    });

    it('the outline of the triangle keeps its pre-fix weight', () => {
        expect(topLevelDecls(scssBlock('.inheritance-marker'))).toMatch(/stroke-width:\s*1;/);
    });
});
