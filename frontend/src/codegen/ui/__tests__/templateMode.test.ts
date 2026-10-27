/**
 * templateMode — the converter of the «Text | Expression» toggle (slice S5, P-2026-10-23-2030; R-GEN-27, discovery
 * 2026-10-23 §2.2, §2.3 T4).
 *
 * The rows of the converter, then T4 on both gallery examples: every body that is one string literal, switched to
 * text, generates the same code as its expression form, and its literal origins move left by the dropped quote.
 * Mutations each test kills are in its name.
 */
import { describe, it, expect } from 'vitest';
import { generate } from '../../engine/generate';
import { decodeTemplates, GEN_TEMPLATES_KEY } from '../../engine/templateCodec';
import type { TemplateRecord } from '../../engine/templates';
import { EXAMPLES, loadExample, recordOf } from '../../oracle/__tests__/exampleFixture';
import { convertBody, expressionToText, textToExpression } from '../templateMode';

const body = (r: ReturnType<typeof expressionToText>) => (r.ok ? r.body : `REFUSED: ${r.reason}`);

describe('expression to text', () => {
    it.each([
        ['"a ${x} b"', 'a ${x} b'],
        ['  "a"  ', 'a'],
        ["'a${b}'", 'a\\${b}'],
        ['"say \\"hi\\"\\n"', 'say "hi"\n'],
        ['"\\${x} costs \\$${p}"', '\\${x} costs $${p}'],
        ['"${ s.map(x => "<${x}>") -- c\n}"', '${ s.map(x => "<${x}>") -- c\n}'],
        ['"a\\\\b"', 'a\\b'],
    ])('%s -> %s (mutant: ${ not escaped)', (from, to) => {
        expect(body(expressionToText(from))).toBe(to);
    });

    it.each([
        ['main + "x"', 'one string'],
        ['if c then "a" else "b"', 'one string'],
        ['-- c\n"x"', 'one string'],
        ['"x" -- c', 'one string'],
        ['"a\\\\${x}"', 'backslash'],
        ['"a', 'does not parse'],
    ])('refuses %s', (from, reason) => {
        const r = expressionToText(from);
        expect(r.ok).toBe(false);
        expect(r.ok ? '' : r.reason).toContain(reason);
    });
});

describe('text to expression', () => {
    it.each([
        ['', '""'],
        ['SELECT "${c}" FROM t \\ ${"}"}', '"SELECT \\"${c}\\" FROM t \\\\ ${"}"}"'],
        ['\\${x} and $', '"\\${x} and $"'],
        ['line\n  next', '"line\n  next"'],
    ])('%s -> %s', (from, to) => {
        expect(body(textToExpression(from))).toBe(to);
    });

    it('refuses a hole that is not closed', () => {
        expect(textToExpression('a ${x').ok).toBe(false);
    });

    it('the same mode is the same body', () => {
        expect(convertBody('x + 1', 'expression', 'expression')).toEqual({ ok: true, body: 'x + 1' });
    });
});

describe.each(EXAMPLES)('T4: the convertible bodies of %s', name => {
    const ex = loadExample(name);
    const templates = decodeTemplates(ex.lookup[ex.metamodelId]._state[GEN_TEMPLATES_KEY]).templates;
    const run = (ts: readonly TemplateRecord[]) => generate(recordOf(ex.lookup, ex.modelId), ex.lookup, ex.modelId, ts, 'main');
    const converted = templates.map(t => {
        const r = expressionToText(t.body);
        return r.ok ? { ...t, body: r.body, mode: 'text' as const } : t;
    });
    const textNames = new Set(converted.filter(t => t.mode === 'text').map(t => t.name));

    // Measured: 4 of 13 (turnstile) and 5 of 12 (petri) are not one string, every one a call, a navigation or an
    // `if`; the discovery's «3 of 13» was a count by eye.
    it('the bodies that are not one string are refused, main is converted', () => {
        expect(templates.length - textNames.size).toBe(name === 'turnstile' ? 4 : 5);
        expect(textNames.has('main')).toBe(true);
    });

    it('text form and expression form give the same code (mutant: ${ not escaped in the converter)', () => {
        const before = run(templates);
        const after = run(converted);
        expect(after.errors).toEqual([]);
        expect(after.code).toBe(before.code);
    });

    it('back to expression, the bodies are the same strings as values and the code is the same', () => {
        const back = converted.map(t => {
            if (t.mode !== 'text') return t;
            const r = textToExpression(t.body);
            if (!r.ok) throw new Error(r.reason);
            return { name: t.name, params: t.params, body: r.body };
        });
        expect(run(back).code).toBe(run(templates).code);
    });

    type At = { kind: string; template: string; offset: number; line: number; column: number };

    it('literal origins move left by the dropped quote, up to the first escape', () => {
        const before = run(templates).text.fragments;
        const after = run(converted).text.fragments;
        let checked = 0;
        // The fragments agree up to the first plain-string body (`engine`): as an expression it is one `Literal`,
        // as text an `InterpolatedString` with an origin per line.
        for (let i = 0; i < before.length && i < after.length && before[i].text === after[i].text; i++) {
            const o = before[i].origin as At;
            const t = templates.find(r => r.name === o.template);
            if (before[i].kind !== 'literal' || !t || !textNames.has(t.name) || t.body.slice(0, o.offset).includes('\\')) continue;
            expect(after[i].origin).toEqual({ ...o, offset: o.offset - 1, column: o.line === 1 ? o.column - 1 : o.column });
            checked++;
        }
        expect(checked).toBeGreaterThan(0);
    });

    it('every literal origin of a text body points at its text in the body', () => {
        const bodies = new Map(converted.filter(t => t.mode === 'text').map(t => [t.name, t.body]));
        let checked = 0;
        for (const f of run(converted).text.fragments) {
            const o = f.origin as At;
            const b = f.kind === 'literal' ? bodies.get(o.template) : undefined;
            if (b === undefined) continue;
            expect(b.slice(o.offset, o.offset + 3 * f.text.length).split('\\${').join('${').startsWith(f.text)).toBe(true);
            const lineStart = o.offset - o.column + 1;
            expect(b.slice(0, lineStart).split('\n').length).toBe(o.line);
            checked++;
        }
        expect(checked).toBeGreaterThan(100);
    });
});
