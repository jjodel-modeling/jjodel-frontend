/**
 * memoryIdiom (slice S-D0): the ROM read, the RAM read and write target of the
 * hardware demonstrator plan §5.2, both forms of `.first`, and the shapes that
 * are not a key lookup.
 */

import { describe, it, expect } from 'vitest';
import { parseAction, parseExpressionStrict } from '../../../jjel/parser';
import type { JjelExpression } from '../../../jjel/types/ast';
import { matchMemoryIdiom } from '../memoryIdiom';

function expr(source: string): JjelExpression {
    const r = parseExpressionStrict(source);
    if (!r.expression || r.errors.length > 0) throw new Error(`${source}: ${r.errors.map(e => e.message).join('; ')}`);
    return r.expression;
}

describe('matchMemoryIdiom', () => {
    it('reads a ROM word: a model feature of the selected element', () => {
        const m = matchMemoryIdiom(expr('rom.cells.filter(c => c.addr == PC.[value].toNumber()).first.init'));
        expect(m).not.toBeNull();
        expect(m!.collection).toMatchObject({ type: 'MemberAccess', property: 'cells', object: { type: 'Identifier', name: 'rom' } });
        expect(m!.element).toBe('c');
        expect(m!.keyFeature).toBe('addr');
        expect(m!.key).toMatchObject({ type: 'MethodCall', method: 'toNumber' });
        expect(m!.read).toEqual({ kind: 'feature', feature: 'init' });
    });

    it('reads a RAM word: a σ read of the selected element, `.first()` too', () => {
        for (const first of ['first', 'first()']) {
            const m = matchMemoryIdiom(expr(`cells.filter(k => k.addr == 3).${first}.[value]`));
            expect(m).toMatchObject({ element: 'k', keyFeature: 'addr', key: { type: 'Literal', value: 3 } });
            expect(m!.read).toEqual({ kind: 'state', attribute: 'value' });
        }
    });

    it('recognises the target of a dynamic write', () => {
        const a = parseAction('ram.cells.filter(c => c.addr == IR.[value].slice(3, 0).toNumber()).first.[value] := ACC.[value]');
        expect(a.errors).toEqual([]);
        const m = matchMemoryIdiom(a.action!.target);
        expect(m).toMatchObject({ keyFeature: 'addr', read: { kind: 'state', attribute: 'value' } });
        expect(m!.key).toMatchObject({ type: 'MethodCall', method: 'toNumber', object: { type: 'MethodCall', method: 'slice' } });
    });

    it('refuses a key that mentions the element, and shapes that are not a key lookup', () => {
        for (const source of [
            'cells.filter(c => c.addr == c.width).first.[value]',
            'cells.filter(c => 3 == c.addr).first.[value]',
            'cells.filter(c => c.addr != 3).first.[value]',
            'cells.filter(c => c.addr == 3).last.[value]',
            'cells.filter(c => c.addr == 3).first',
            'cells.select(c => c.addr == 3).first.[value]',
            'PC.[value]',
            'bits(8, 1)',
        ]) {
            expect(matchMemoryIdiom(expr(source)), source).toBeNull();
        }
    });
});
