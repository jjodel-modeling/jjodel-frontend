import { describe, it, expect } from 'vitest';
/**
 * Text-mode template bodies (R-GEN-26, P-2026-10-23-2030): the `textBody` lexer
 * option and `parseTemplateText`. The whole source is the inside of one
 * interpolated string: `"` and `'` are text, a backslash is itself except in
 * `\${`, the end of input closes; positions are the body's own (T5 of the
 * discovery 2026-10-23 §2.3). Off by default: the other entries are unchanged.
 */

import { parseTemplate, parseTemplateText } from '../parser/parser';
import { tokenize } from '../lexer/lexer';
import { JjelEvaluator } from '../evaluator/evaluator';
import { EvaluationContext } from '../evaluator/context';
import type { JjelValue } from '../evaluator/context';
import type { JjelExpression, InterpolatedStringExpr } from '../types';

function text(src: string): InterpolatedStringExpr {
    const result = parseTemplateText(src);
    expect(result.errors).toEqual([]);
    expect(result.expression?.type).toBe('InterpolatedString');
    return result.expression as InterpolatedStringExpr;
}

function run(src: string, bindings: Record<string, JjelValue> = {}): JjelValue {
    const expr = text(src);
    const ctx = new EvaluationContext(bindings);
    return new JjelEvaluator(ctx).evaluate(expr, ctx);
}

function texts(expr: InterpolatedStringExpr): string[] {
    return expr.parts.flatMap(p => (p.kind === 'text' ? [p.value] : []));
}

function hole(expr: InterpolatedStringExpr, i = 0): JjelExpression {
    return expr.parts.filter(p => p.kind === 'expression').map(p => (p as { expr: JjelExpression }).expr)[i];
}

describe('lexer: textBody option', () => {
    it('lexes from offset 0 with no quote, the final STRING ending at the end of input', () => {
        const rows = tokenize('a"b ${x} c', { textBody: true }).tokens.map(t => [t.type, t.value, t.start, t.end, t.line, t.column]);
        expect(rows).toEqual([
            ['STRING_PART', 'a"b ', 0, 4, 1, 1],
            ['DOLLAR_LBRACE', 'x', 6, 7, 1, 7],
            ['STRING', ' c', 8, 10, 1, 9],
            ['EOF', '', 10, 10, 1, 11],
        ]);
    });

    it('is off by default: the same source lexes as an expression', () => {
        const types = tokenize('a"b ${x} c').tokens.map(t => t.type);
        expect(types[0]).toBe('IDENTIFIER');
    });

    it('reports an unterminated hole', () => {
        const { errors } = tokenize('a ${x', { textBody: true });
        expect(errors.map(e => e.message)).toEqual(['Unterminated string interpolation']);
    });
});

describe('parseTemplateText: always one InterpolatedStringExpr', () => {
    it('a body with no hole is one text part, never a Literal', () => {
        const expr = text('hello');
        expect(expr.parts).toEqual([{ kind: 'text', value: 'hello' }]);
        expect(expr.location).toEqual({ start: { line: 1, column: 1, offset: 0 }, end: { line: 1, column: 1, offset: 5 } });
    });

    it('an empty body has no part', () => {
        expect(text('').parts).toEqual([]);
    });

    it('quotes are text, a backslash is itself, only \\${ escapes', () => {
        expect(texts(text(`SELECT "id", 'x' FROM t -- c\\n \\\\ \\\${y}`))).toEqual([`SELECT "id", 'x' FROM t -- c\\n \\\\ \${y}`]);
    });

    it('newlines are text, nothing is trimmed', () => {
        expect(texts(text('\n  a\n\n'))).toEqual(['\n  a\n\n']);
    });

    it('holes keep the JjEL rules: strings, escapes, nested interpolation, a } inside a string', () => {
        expect(run('<${"}"}|${"a\\"${n}"}>', { n: 'b' })).toBe('<}|a"b>');
    });

    it('evaluates to the text with its holes filled', () => {
        expect(run('SELECT "${c}" FROM t;\n', { c: 'name' })).toBe('SELECT "name" FROM t;\n');
    });
});

describe('positions are in body coordinates (T5)', () => {
    it('a hole expression has its offset, line and column in the body', () => {
        const expr = text('line1\nab ${x}');
        expect(hole(expr).location?.start).toEqual({ line: 2, column: 6, offset: 11 });
    });

    it('a broken hole at line 3, column 7 of the body is reported at 3:7', () => {
        const result = parseTemplateText('one\ntwo\nabcd${)x}');
        expect(result.expression).toBeNull();
        expect(result.errors[0]).toMatchObject({ line: 3, column: 7 });
    });

    it('the same hole in expression mode is one column right of the quote', () => {
        const result = parseTemplate('"one\ntwo\nabcd${)x}"');
        expect(result.errors[0]).toMatchObject({ line: 3, column: 7 });
        const shifted = parseTemplate('"abcd${)x}"');
        expect(shifted.errors[0]).toMatchObject({ line: 1, column: 8 });
    });
});
