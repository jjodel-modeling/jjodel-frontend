/**
 * Unit tests for validateIR (authoring slice-1 enabling layer, F6).
 * Pure: no store, no React — irValidate -> irCompile is joiner-free.
 */
import { describe, it, expect } from 'vitest';
import { validateIR } from '../irValidate';
import { clearCompileCache } from '../irCompile';
import { defaultObjectViewIR } from '../irDefaults';
import type { RowViewIR, VertexViewIR } from '../irTypes';

describe('validateIR', () => {
    it('accepts a valid IR (defaultObjectViewIR)', () => {
        clearCompileCache();
        expect(validateIR('v-ok', defaultObjectViewIR())).toEqual({ ok: true });
    });

    it('rejects a forbidden PathExpr with a non-empty error message', () => {
        clearCompileCache();
        const bad: VertexViewIR = {
            irVersion: 'ir-1.2',
            kind: 'vertex',
            metaclasses: '*',
            shape: {
                form: 'rect',
                labels: [{ position: 'top', source: { from: 'path', expr: '$a?.b' } }],
            },
        };
        const r = validateIR('v-bad', bad);
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error.length).toBeGreaterThan(0);
    });

    it('accepts a well-formed RowViewIR (intrinsic/literal/path template)', () => {
        clearCompileCache();
        const row: RowViewIR = {
            irVersion: 'ir-1.0', kind: 'row', metaclasses: ['Attribute'],
            template: [
                { from: 'intrinsic', prop: 'name' },
                { from: 'literal', text: ' : ' },
                { from: 'path', expr: '$type.value' },
            ],
        };
        expect(validateIR('r-ok', row)).toEqual({ ok: true });
    });

    it('rejects a RowViewIR with an empty template', () => {
        clearCompileCache();
        const row: RowViewIR = { irVersion: 'ir-1.0', kind: 'row', metaclasses: '*', template: [] };
        const r = validateIR('r-empty', row);
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error.length).toBeGreaterThan(0);
    });

    it('rejects a RowViewIR whose template has a forbidden PathExpr', () => {
        clearCompileCache();
        const row: RowViewIR = {
            irVersion: 'ir-1.0', kind: 'row', metaclasses: '*',
            template: [{ from: 'path', expr: '$a?.b' }],
        };
        const r = validateIR('r-bad', row);
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error.length).toBeGreaterThan(0);
    });
});
