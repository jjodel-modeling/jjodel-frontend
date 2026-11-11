/**
 * The three validator checks of IR view panel S3 (P-2026-11-11-2140, rows E-21, E-26 and the `caption` of V-27 in
 * docs/discovery/discovery_2026-11-11_ir_view_panel_coverage.md): `edge.labels.placement` one of three literals,
 * `edge.persistWaypoints` a boolean, an expression source's `caption` a string. For each, a valid value passes, an
 * invalid one is refused with the key named, and an absent key passes.
 * Pure: no store, no React — irValidate -> irCompile is joiner-free.
 */
import { describe, it, expect } from 'vitest';
import { validateIR, VALID_LABEL_PLACEMENTS } from '../irValidate';
import { clearCompileCache } from '../irCompile';
import type { EdgeViewIR, RowViewIR, VertexViewIR } from '../irTypes';

const edge = (extra: Record<string, unknown> = {}, labels?: Record<string, unknown>): EdgeViewIR => ({
    irVersion: 'ir-1.2', kind: 'edge', metaclasses: ['Arc'],
    edge: { source: '$src.value', target: '$tgt.value', ...(labels ? { labels } : {}), ...extra } as never,
});
const vertex = (source: unknown): VertexViewIR => ({
    irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['State'],
    shape: { form: 'rounded', labels: [{ position: 'top', source: source as never }] },
} as VertexViewIR);
const row = (template: unknown[]): RowViewIR => ({ irVersion: 'ir-1.0', kind: 'row', metaclasses: ['A'], template: template as never });

const ok = (id: string, ir: unknown) => { clearCompileCache(); expect(validateIR(id, ir as never), id).toEqual({ ok: true }); };
const refused = (id: string, ir: unknown, match: RegExp) => {
    clearCompileCache();
    const r = validateIR(id, ir as never);
    expect(r.ok, id).toBe(false);
    if (!r.ok) expect(r.error, id).toMatch(match);
};

const CENTER = { from: 'literal', text: 'c' };
const expr = (caption?: unknown) => ({ from: 'expression', slot: 'weight', ...(caption !== undefined ? { caption } : {}) });

describe('validateIR: edge.labels.placement (E-21)', () => {
    it('the vocabulary is the three literals of the type', () => {
        expect(VALID_LABEL_PLACEMENTS).toEqual(['auto', 'above', 'below']);
    });

    it('accepts each literal', () => {
        for (const p of VALID_LABEL_PLACEMENTS) ok(`s3-pl-${p}`, edge({}, { center: CENTER, placement: p }));
    });

    it('accepts an absent placement, with or without labels', () => {
        ok('s3-pl-absent', edge({}, { center: CENTER }));
        ok('s3-pl-nolabels', edge());
    });

    it('refuses a value outside the vocabulary', () => {
        for (const bad of ['', 'left', 'Above', 1, null, true]) {
            refused(`s3-pl-${String(bad)}`, edge({}, { center: CENTER, placement: bad }),
                /edge\.labels\.placement must be one of auto \| above \| below/);
        }
    });
});

describe('validateIR: edge.persistWaypoints (E-26)', () => {
    it('accepts true and false', () => {
        ok('s3-pw-true', edge({ persistWaypoints: true }));
        ok('s3-pw-false', edge({ persistWaypoints: false }));
    });

    it('accepts an absent key', () => {
        ok('s3-pw-absent', edge());
    });

    it('refuses a value that is not a boolean', () => {
        for (const bad of ['false', 0, 1, null, {}]) {
            refused(`s3-pw-${JSON.stringify(bad)}`, edge({ persistWaypoints: bad }), /edge\.persistWaypoints must be a boolean/);
        }
    });
});

describe('validateIR: the caption of an expression source (V-27)', () => {
    it('accepts a string caption, empty included, on every text source surface', () => {
        for (const c of ['Weight', '']) {
            ok(`s3-cap-vertex-${c}`, vertex(expr(c)));
            ok(`s3-cap-center-${c}`, edge({}, { center: expr(c) }));
            ok(`s3-cap-template-${c}`, edge({}, { template: [CENTER, expr(c)] }));
            ok(`s3-cap-end-${c}`, edge({}, { sourceEnd: expr(c) }));
            ok(`s3-cap-endpart-${c}`, edge({}, { targetEnd: { multiplicity: expr(c), role: expr(c) } }));
            ok(`s3-cap-row-${c}`, row([expr(c)]));
        }
    });

    it('accepts an absent caption', () => {
        ok('s3-cap-absent-vertex', vertex(expr()));
        ok('s3-cap-absent-center', edge({}, { center: expr() }));
        ok('s3-cap-absent-row', row([expr()]));
    });

    it('refuses a caption that is not a string, naming the surface', () => {
        for (const bad of [1, null, true, { text: 'x' }]) {
            const k = JSON.stringify(bad);
            refused(`s3-cap-vertex-${k}`, vertex(expr(bad)), /shape\.labels\[0\]\.source\.caption must be a string/);
            refused(`s3-cap-center-${k}`, edge({}, { center: expr(bad) }), /edge\.labels\.center\.caption must be a string/);
            refused(`s3-cap-template-${k}`, edge({}, { template: [CENTER, expr(bad)] }), /edge\.labels\.template\[1\]\.caption must be a string/);
            refused(`s3-cap-end-${k}`, edge({}, { sourceEnd: expr(bad) }), /edge\.labels\.sourceEnd\.caption must be a string/);
            refused(`s3-cap-role-${k}`, edge({}, { targetEnd: { role: expr(bad) } }), /edge\.labels\.targetEnd\.role\.caption must be a string/);
            refused(`s3-cap-row-${k}`, row([CENTER, expr(bad)]), /template\[1\]\.caption must be a string/);
        }
    });

    it('a caption on another source kind is left alone (the type has none there)', () => {
        ok('s3-cap-literal', vertex({ from: 'literal', text: 'x', caption: 1 }));
    });
});
