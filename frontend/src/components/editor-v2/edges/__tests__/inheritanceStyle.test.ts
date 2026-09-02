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
 * getComputedStyle on a real tree, and compares it with a reference edge in the
 * same scene (measured 2026-08-27: both rgba(0, 0, 0, 0.45) at 1px in the light
 * theme; a selected inheritance edge is rgb(2, 132, 199)).
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

describe('inheritance edge — the same stroke as a reference edge', () => {
    const declOf = (block: string, prop: string) => {
        const m = block.match(new RegExp(`${prop}:\\s*([^;]+);`));
        expect(m, `${prop} not declared`).not.toBeNull();
        return m![1].trim();
    };

    it('line: the same colour token and the same width as .reference-edge', () => {
        const ref = topLevelDecls(scssBlock('.reference-edge'));
        const inh = topLevelDecls(scssBlock('.inheritance-edge'));
        // Compared against the reference edge, not against a literal: the point is
        // that the two stay identical in every theme, not that they are slate today.
        expect(declOf(inh, 'stroke')).toBe(declOf(ref, 'stroke'));
        expect(declOf(inh, 'stroke-width')).toBe(declOf(ref, 'stroke-width'));
        expect(declOf(inh, 'stroke')).toBe('var(--edge-color)');
    });

    it('no dedicated token is left behind for the two to drift on', () => {
        expect(THEMES).not.toMatch(/inheritance-stroke/);
        expect(THEMES).not.toMatch(/inheritance-marker-fill/);
        expect(EDITOR_SCSS).not.toMatch(/--inheritance-stroke/);
        expect(EDITOR_SCSS).not.toMatch(/--inheritance-marker-fill/);
    });

    it('selection keeps its own colour, and only there', () => {
        const block = scssBlock('.inheritance-edge');
        expect(topLevelDecls(block)).not.toMatch(/--edge-selected/);
        expect(block).toMatch(/&\.selected\s*\{[^}]*stroke:\s*var\(--edge-selected\)/);
    });

    it('the dot takes the colour of the line, the triangle the marker tokens', () => {
        expect(topLevelDecls(scssBlock('.inheritance-junction'))).toMatch(/fill:\s*var\(--edge-color\)/);
        const marker = topLevelDecls(scssBlock('.inheritance-marker'));
        expect(marker).toMatch(/stroke:\s*var\(--edge-marker-stroke\)/);
        expect(marker).toMatch(/fill:\s*var\(--edge-marker-fill\)/);
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

    it('the line and the outline of the triangle carry the same weight', () => {
        expect(topLevelDecls(scssBlock('.inheritance-edge'))).toMatch(/stroke-width:\s*1;/);
        expect(topLevelDecls(scssBlock('.inheritance-marker'))).toMatch(/stroke-width:\s*1;/);
    });
});

// The failure mode this guards is "nothing is drawn", which no style assertion can
// catch: an inheritance edge that goes silent because the tree was supposed to draw
// it, while the tree has no branch for it.
describe('every child of a tree draws something', () => {
    it('the silent branch of UnifiedEdge is taken only when the tree carries this edge', () => {
        const guard = UNIFIED_EDGE.match(/if \(isInheritance && !isPrimary && isGrouped && treeGeometry[^)]*\)/);
        expect(guard, 'CASE 2 guard not found').not.toBeNull();
        expect(guard![0]).toContain('branchPaths.has(id)');
    });
});
