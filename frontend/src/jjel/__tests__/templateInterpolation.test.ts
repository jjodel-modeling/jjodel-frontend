import { describe, it, expect } from 'vitest';
/**
 * JjEL template interpolation (R-GEN-10, P-2026-10-10-0900): the `interpolation`
 * lexer option, `parseTemplate`, and the `textHost` and `readObserver` context
 * fields. Off by default and inert when unused: the identity block pins what
 * the base commit returned for an interpolated string through every other entry.
 */

import { parseExpression, parseExpressionStrict, parseAction, parseTemplate } from '../parser/parser';
import { tokenize } from '../lexer/lexer';
import { JjelEvaluator } from '../evaluator/evaluator';
import { EvaluationContext } from '../evaluator/context';
import type { JjelValue, JjelObject, JjelTextHost, JjelTextPart } from '../evaluator/context';
import type { JjelExpression, InterpolatedStringExpr } from '../types';

// ============================================
// HELPERS
// ============================================

function template(src: string): JjelExpression {
    const result = parseTemplate(src);
    expect(result.errors).toEqual([]);
    expect(result.expression).not.toBeNull();
    return result.expression!;
}

function run(src: string, bindings: Record<string, JjelValue> = {}, setup?: (ctx: EvaluationContext) => void): JjelValue {
    const expr = template(src);
    const ctx = new EvaluationContext(bindings);
    setup?.(ctx);
    return new JjelEvaluator(ctx).evaluate(expr, ctx);
}

function tokenRows(src: string, options?: { interpolation?: boolean }): unknown[] {
    return tokenize(src, options).tokens.map(t => [t.type, t.value, t.start, t.end, t.line, t.column]);
}

function holes(expr: JjelExpression): JjelExpression[] {
    expect(expr.type).toBe('InterpolatedString');
    return (expr as InterpolatedStringExpr).parts.flatMap(p => (p.kind === 'expression' ? [p.expr] : []));
}

function texts(expr: JjelExpression): string[] {
    return (expr as InterpolatedStringExpr).parts.flatMap(p => (p.kind === 'text' ? [p.value] : []));
}

function startOf(expr: JjelExpression): { line: number; column: number; offset?: number } {
    expect(expr.location).toBeDefined();
    return expr.location!.start;
}

/** A Text stand-in: a tagged object the fake host builds and recognises. */
interface FakeText { __fake: true; s: string }

function isFake(value: unknown): value is FakeText {
    return typeof value === 'object' && value !== null && (value as FakeText).__fake === true;
}

function fakeHost() {
    const calls: { op: string; args: unknown[] }[] = [];
    const mk = (s: string): JjelValue => ({ __fake: true, s }) as unknown as JjelValue;
    const plain = (v: JjelValue | undefined): string => (isFake(v) ? v.s : String(v ?? ''));
    const host: JjelTextHost = {
        isText: v => isFake(v),
        interpolate(parts: JjelTextPart[], expr: JjelExpression) {
            calls.push({ op: 'interpolate', args: [parts, expr] });
            return mk(parts.map(p => (p.kind === 'text' ? p.value : p.render())).join(''));
        },
        concat(left, right) {
            calls.push({ op: 'concat', args: [left, right] });
            return mk(plain(left) + plain(right));
        },
        join(items, separator) {
            calls.push({ op: 'join', args: [items, separator] });
            return mk(items.map(plain).join(plain(separator)));
        },
        stringify(text) {
            calls.push({ op: 'stringify', args: [text] });
            return (text as unknown as FakeText).s;
        },
    };
    const ops = () => calls.map(c => c.op);
    return { host, calls, ops, mk };
}

// ============================================
// LEXER
// ============================================

describe('lexer: interpolation option', () => {
    it('emits the text parts and one token per hole carrying its source and absolute offset', () => {
        // "a ${b} c": quote 0, b at 5, closing quote 9.
        expect(tokenRows('"a ${b} c"', { interpolation: true })).toEqual([
            ['STRING_PART', 'a ', 0, 3, 1, 1],
            ['DOLLAR_LBRACE', 'b', 5, 6, 1, 6],
            ['STRING', ' c', 7, 10, 1, 8],
            ['EOF', '', 10, 10, 1, 11],
        ]);
    });

    it('a hole keeps a nested string, its braces and its own holes in its source', () => {
        const src = '"${xs.map(x => "<${x.name}>").join(", ")}"';
        const rows = tokenRows(src, { interpolation: true });
        expect(rows[1]).toEqual(['DOLLAR_LBRACE', 'xs.map(x => "<${x.name}>").join(", ")', 3, src.length - 2, 1, 4]);
        expect(rows.map(r => (r as unknown[])[0])).toEqual(['STRING_PART', 'DOLLAR_LBRACE', 'STRING', 'EOF']);
    });

    it('a string without holes is one STRING, as without the option', () => {
        expect(tokenRows('"plain"', { interpolation: true })[0]).toEqual(['STRING', 'plain', 0, 7, 1, 1]);
    });

    it('the escape \\$ is a literal ${, not a hole', () => {
        expect(tokenRows('"\\${x}"', { interpolation: true })[0]).toEqual(['STRING', '${x}', 0, 7, 1, 1]);
    });

    it('single-quoted strings stay literal', () => {
        expect(tokenRows("'a ${b}'", { interpolation: true })[0]).toEqual(['STRING', 'a ${b}', 0, 8, 1, 1]);
    });

    it('an unterminated hole is a lexer error', () => {
        const { errors } = tokenize('"a ${b"', { interpolation: true });
        expect(errors.map(e => e.message)).toEqual(['Unterminated string interpolation']);
    });
});

// ============================================
// PARSER
// ============================================

describe('parseTemplate: InterpolatedStringExpr with absolute locations', () => {
    it('one hole', () => {
        const expr = template('"Hello ${name}!"');
        expect(texts(expr)).toEqual(['Hello ', '!']);
        const [name] = holes(expr);
        expect(name).toMatchObject({ type: 'Identifier', name: 'name' });
        expect(startOf(name)).toEqual({ line: 1, column: 10, offset: 9 });
        expect(expr.location!.start.offset).toBe(0);
        expect(expr.location!.end.offset).toBe(16);
    });

    it('several holes', () => {
        const src = '"${a.b} and ${c}"';
        const expr = template(src);
        expect(texts(expr)).toEqual([' and ']);
        const [ab, c] = holes(expr);
        expect(ab.type).toBe('MemberAccess');
        expect(startOf(ab)).toEqual({ line: 1, column: 4, offset: 3 });
        expect(startOf(c)).toEqual({ line: 1, column: src.indexOf('c}') + 1, offset: src.indexOf('c}') });
    });

    it('a hole holding a lambda that contains an interpolated string', () => {
        const src = '"${xs.map(x => "<${x.name}>").join(", ")}"';
        const expr = template(src);
        const [join] = holes(expr);
        expect(join).toMatchObject({ type: 'MethodCall', method: 'join' });
        const map = (join as any).object;
        expect(map).toMatchObject({ type: 'MethodCall', method: 'map' });
        expect(startOf(map.object)).toEqual({ line: 1, column: 4, offset: 3 });
        const lambda = map.args[0];
        expect(lambda.type).toBe('Lambda');
        const inner = lambda.body as JjelExpression;
        expect(texts(inner)).toEqual(['<', '>']);
        const [xName] = holes(inner);
        expect(xName).toMatchObject({ type: 'MemberAccess', property: 'name' });
        const at = src.indexOf('x.name');
        expect(startOf(xName)).toEqual({ line: 1, column: at + 1, offset: at });
        expect(startOf(inner).offset).toBe(src.indexOf('"<'));
    });

    it('a multi-line string', () => {
        // quote 0; line 2 starts at 7, `a` at 11; line 3 starts at 14, `b` at 20.
        const expr = template('"line1\n  ${a}\nend ${b}"');
        expect(texts(expr)).toEqual(['line1\n  ', '\nend ']);
        const [a, b] = holes(expr);
        expect(startOf(a)).toEqual({ line: 2, column: 5, offset: 11 });
        expect(startOf(b)).toEqual({ line: 3, column: 7, offset: 20 });
    });

    it('a hole spanning lines shifts the lines after its first by line only', () => {
        // `a` at 3 on line 1; line 2 starts at 7, `b` at 9.
        const expr = template('"${a +\n  b}"');
        const [sum] = holes(expr);
        expect(sum.type).toBe('Binary');
        expect(startOf((sum as any).left)).toEqual({ line: 1, column: 4, offset: 3 });
        expect(startOf((sum as any).right)).toEqual({ line: 2, column: 3, offset: 9 });
    });

    it('the escape \\$ inside a template', () => {
        const expr = template('"cost \\${x} ${y}"');
        expect(texts(expr)).toEqual(['cost ${x} ']);
        expect(holes(expr).map(h => (h as any).name)).toEqual(['y']);
    });

    it('errors inside a hole carry absolute positions', () => {
        // `b` of the hole is at offset 8.
        expect(parseTemplate('"ab ${a b}"')).toEqual({
            expression: null,
            errors: [{ message: "Unexpected 'b' after the end of the expression", line: 1, column: 9 }],
        });
    });

    it('an empty hole is an error', () => {
        const result = parseTemplate('"${}"');
        expect(result.expression).toBeNull();
        expect(result.errors).toEqual([{ message: "Expected an expression inside '${}'", line: 1, column: 4 }]);
    });

    it('strict end of input', () => {
        const result = parseTemplate('"a" b');
        expect(result.expression).toBeNull();
        expect(result.errors.map(e => e.message)).toEqual(["Unexpected 'b' after the end of the expression"]);
    });
});

// ============================================
// OFF BY DEFAULT
// ============================================

describe('off by default: every other entry fails exactly as on the base commit', () => {
    // Snapshots taken on 0c847329d, before the option existed.
    const BASE_EXPRESSION = { expression: null, errors: [{ message: 'Expected expression', line: 1, column: 1 }] };

    it('parseExpression', () => {
        expect(parseExpression('"a ${b}"')).toEqual(BASE_EXPRESSION);
    });

    it('parseExpressionStrict', () => {
        expect(parseExpressionStrict('"a ${b}"')).toEqual(BASE_EXPRESSION);
    });

    it('parseAction', () => {
        expect(parseAction('x.[a] := "a ${b}"')).toEqual({
            action: null,
            errors: [{ message: 'Expected expression', line: 1, column: 10 }],
        });
    });

    it('the lexer without the option emits the base token stream', () => {
        const BASE_TOKENS = [
            ['STRING_PART', 'a ', 0, 3, 1, 1],
            ['DOLLAR_LBRACE', '"a ${', 0, 5, 1, 1],
            ['IDENTIFIER', 'b', 0, 6, 1, 1],
            ['RBRACE', '"a ${b}', 0, 7, 1, 1],
            ['STRING', '', 0, 8, 1, 1],
            ['EOF', '', 8, 8, 1, 9],
        ];
        expect(tokenRows('"a ${b}"')).toEqual(BASE_TOKENS);
        expect(tokenRows('"a ${b}"', {})).toEqual(BASE_TOKENS);
        expect(tokenRows('"a ${b}"', { interpolation: false })).toEqual(BASE_TOKENS);
    });
});

// ============================================
// EVALUATION WITHOUT A HOST
// ============================================

describe('parseTemplate + evaluate without textHost: plain strings, stringify rules', () => {
    it('renders null as empty, arrays joined by ", ", scalars with String', () => {
        expect(run('"n=${n}, s=${s}, z=${z}, xs=${xs}, b=${b}"', { n: 3, s: 'x', z: null, xs: [1, 'a', null], b: true }))
            .toBe('n=3, s=x, z=, xs=1, a, , b=true');
    });

    it('nested interpolation inside a lambda', () => {
        expect(run('"${xs.map(x => "<${x.name}>").join(", ")}"', { xs: [{ name: 'a' }, { name: 'b' }] }))
            .toBe('<a>, <b>');
    });

    it('a template without holes is a plain string literal', () => {
        expect(run('"plain"')).toBe('plain');
    });
});

// ============================================
// TEXT HOST
// ============================================

describe('textHost: Text values go through the host', () => {
    it('interpolation hands the host the literal parts and each hole with value, expression and location', () => {
        const { host, calls } = fakeHost();
        const out = run('"Hello ${name}!"', { name: 'Ada' }, ctx => { ctx.textHost = host; });
        expect(isFake(out) && out.s).toBe('Hello Ada!');
        expect(calls.map(c => c.op)).toEqual(['interpolate']);
        const parts = calls[0].args[0] as JjelTextPart[];
        expect(parts.map(p => p.kind)).toEqual(['text', 'hole', 'text']);
        const hole = parts[1] as Extract<JjelTextPart, { kind: 'hole' }>;
        expect(hole.value).toBe('Ada');
        expect(hole.expr).toMatchObject({ type: 'Identifier', name: 'name' });
        expect(hole.location!.start).toEqual({ line: 1, column: 10, offset: 9 });
        expect((calls[0].args[1] as JjelExpression).type).toBe('InterpolatedString');
    });

    it('+ with a Text on the left or on the right', () => {
        const { host, ops, mk } = fakeHost();
        const t = mk('T');
        const left = run('t + "!"', { t }, ctx => { ctx.textHost = host; });
        const right = run('"<" + t', { t }, ctx => { ctx.textHost = host; });
        expect(isFake(left) && left.s).toBe('T!');
        expect(isFake(right) && right.s).toBe('<T');
        expect(ops()).toEqual(['concat', 'concat']);
    });

    it('+ without a Text takes today\'s path under a host', () => {
        const { host, ops } = fakeHost();
        expect(run('"a" + 1', {}, ctx => { ctx.textHost = host; })).toBe('a1');
        expect(ops()).toEqual([]);
    });

    it('join over an array holding a Text', () => {
        const { host, calls, mk } = fakeHost();
        const t = mk('T');
        const out = run('[t, "x"].join(", ")', { t }, ctx => { ctx.textHost = host; });
        expect(isFake(out) && out.s).toBe('T, x');
        expect(calls.map(c => c.op)).toEqual(['join']);
        expect(calls[0].args[1]).toBe(', ');
    });

    it('join without a Text takes today\'s path under a host', () => {
        const { host, ops } = fakeHost();
        expect(run('["a", "b"].join("-")', {}, ctx => { ctx.textHost = host; })).toBe('a-b');
        expect(ops()).toEqual([]);
    });

    it('stringify of a Text, alone and inside an array, goes through the host', () => {
        const { host, ops, mk } = fakeHost();
        const t = mk('T');
        const out = run('"${t}|${[t, 1, t]}"', { t }, ctx => { ctx.textHost = host; });
        expect(isFake(out) && out.s).toBe('T|T, 1, T');
        expect(ops()).toEqual(['interpolate', 'stringify', 'stringify', 'stringify']);
    });

    it('is inherited by lambda scopes: nested interpolations and the join build Texts', () => {
        const { host, ops } = fakeHost();
        const out = run('"${xs.map(x => "<${x.name}>").join(", ")}"', { xs: [{ name: 'a' }, { name: 'b' }] },
            ctx => { ctx.textHost = host; });
        expect(isFake(out) && out.s).toBe('<a>, <b>');
        expect(ops()).toEqual(['interpolate', 'interpolate', 'join', 'interpolate', 'stringify']);
    });

    it('evaluateHole wraps each hole: reads per hole, and a throwing hole becomes the host\'s value', () => {
        const { host, mk } = fakeHost();
        const reads: [string, string][] = [];
        let current = '';
        host.evaluateHole = (expr, evaluate) => {
            current = (expr as any).property ?? (expr as any).method ?? expr.type;
            try {
                return evaluate();
            } catch (e) {
                return mk('ERR');
            }
        };
        const o = { id: 'o1', name: 'A', kind: 'K' };
        const out = run('"${o.name} ${o.kind} ${o.nope(1)}"', { o }, ctx => {
            ctx.textHost = host;
            ctx.readObserver = (_t, property) => { reads.push([current, property]); };
        });
        expect(isFake(out) && out.s).toBe('A K ERR');
        expect(reads).toEqual([['name', 'name'], ['kind', 'kind']]);
    });
});

// ============================================
// READ OBSERVER
// ============================================

describe('readObserver: member reads report (target, property, value)', () => {
    function observed(src: string, bindings: Record<string, JjelValue>) {
        const reads: [JjelObject, string, JjelValue][] = [];
        const value = run(src, bindings, ctx => { ctx.readObserver = (t, p, v) => { reads.push([t, p, v]); }; });
        return { value, reads };
    }

    it('a hole o.name reports once', () => {
        const o = { id: 'o1', name: 'A' };
        const { value, reads } = observed('"${o.name}"', { o });
        expect(value).toBe('A');
        expect(reads).toEqual([[o, 'name', 'A']]);
    });

    it('a hole o.name() (the dual form) reports once', () => {
        const o = { id: 'o1', name: 'A' };
        const { value, reads } = observed('"${o.name()}"', { o });
        expect(value).toBe('A');
        expect(reads).toEqual([[o, 'name', 'A']]);
    });

    it('a missing property reports nothing and still returns null', () => {
        const o = { id: 'o1', name: 'A' };
        expect(observed('"${o.missing}"', { o })).toEqual({ value: '', reads: [] });
        expect(observed('o.missing', { o })).toEqual({ value: null, reads: [] });
    });

    it('is inherited by lambda scopes', () => {
        const a = { name: 'a' };
        const b = { name: 'b' };
        const { reads } = observed('xs.map(x => x.name)', { xs: [a, b] });
        expect(reads).toEqual([[a, 'name', 'a'], [b, 'name', 'b']]);
    });
});
