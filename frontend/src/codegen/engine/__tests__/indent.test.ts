/**
 * indent — block indentation (slice S2, P-2026-10-10-0945; spec §4, discovery §B.4).
 *
 * The rule: a multi-line value interpolated on a template line whose leading whitespace is `w` gets `w` before
 * every line after its first, and the rule composes across nested template calls. Executed through `generate`, the
 * path the code panel takes (P11), as property tests over a seeded generator, plus `layoutFragments` alone. The
 * expected texts are computed by `indentLines` below, written from the rule and not from the module.
 * Empty lines carry no prefix (no trailing whitespace), so the generated lines are non-empty.
 * Mutations each test kills are in its name; the bench is in the commit body.
 */

import { describe, it, expect } from 'vitest';
import { generate } from '../generate';
import { layoutFragments } from '../indent';
import { fragment } from '../text';
import type { TemplateRecord } from '../templates';

/** mulberry32: a fixed seed per test, so a red run is reproducible. */
function rng(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const pick = <T,>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];
const word = (r: () => number, min: number, max: number): string => {
    const n = min + Math.floor(r() * (max - min + 1));
    let s = '';
    for (let i = 0; i < n; i++) s += pick(r, 'abcXYZ ;{}()=,'.split(''));
    return s;
};
const indentOf = (r: () => number): string => {
    const n = Math.floor(r() * 7);
    let s = '';
    for (let i = 0; i < n; i++) s += pick(r, [' ', ' ', '\t']);
    return s;
};
/** The rule, independently: `w` before every non-empty line of `s` after the first. */
const indentLines = (s: string, w: string): string => s.split('\n').map((l, j) => (j === 0 || l === '' ? l : w + l)).join('\n');

const T = (name: string, body: string, params: string[] = []): TemplateRecord => ({ name, params, body });
const run = (templates: TemplateRecord[], globals: Record<string, any> = {}) => {
    const out = generate(globals, {}, 'M', templates, 'main');
    expect(out.errors).toEqual([]);
    return out.code;
};

describe('block indentation, properties', () => {
    it('a single-line value is unchanged, at the start of a line and after text', () => {
        const r = rng(1);
        for (let i = 0; i < 60; i++) {
            const w = indentOf(r);
            const v = word(r, 0, 12);
            expect(run([T('main', '"' + w + '${v}"')], { v })).toBe(w + v);
            expect(run([T('main', '"' + w + 'x = ${v};"')], { v })).toBe(w + 'x = ' + v + ';');
        }
    });

    it('an n-line value on a line whose leading whitespace is w gains exactly n-1 prefixes w, a string and a Text alike (mutant: no indent on continuation lines)', () => {
        const r = rng(2);
        for (let i = 0; i < 60; i++) {
            const w = indentOf(r);
            const lines = Array.from({ length: 1 + Math.floor(r() * 6) }, () => word(r, 1, 8).replace(/^ +| +$/g, '') || 'q');
            const v = lines.join('\n');
            const expected = w + lines.join('\n' + w);
            expect(run([T('main', '"' + w + '${v}"')], { v })).toBe(expected);
            expect(run([T('main', '"' + w + '${block()}"'), T('block', '"' + v + '"')])).toBe(expected);
            expect(expected.split('\n' + w).length - 1).toBe(lines.length - 1);
        }
    });

    it('composes across nested template calls: each level adds its own line\'s whitespace (mutant: only the innermost level indents)', () => {
        const r = rng(3);
        for (let i = 0; i < 30; i++) {
            const depth = 1 + Math.floor(r() * 4);
            const ws = Array.from({ length: depth }, () => indentOf(r) || ' ');
            const templates: TemplateRecord[] = [T(`t${depth}`, '"a\nb"')];
            for (let k = depth - 1; k >= 0; k--) templates.push(T(`t${k}`, '"head\n' + ws[k] + '${t' + (k + 1) + '()}\ntail"'));
            templates.push(T('main', '"${t0()}"'));
            let expected = 'a\nb';
            for (let k = depth - 1; k >= 0; k--) expected = 'head\n' + ws[k] + indentLines(expected, ws[k]) + '\ntail';
            expect(run(templates)).toBe(expected);
        }
    });
});

describe('block indentation, cases', () => {
    it('a template that calls another inside an indented line indents the callee\'s whole block', () => {
        const code = run([
            T('main', '"class A {\n    ${inner()}\n}"'),
            T('inner', '"a\nb {\n  ${leaf()}\n}"'),
            T('leaf', '"x\ny"'),
        ]);
        expect(code).toBe('class A {\n    a\n    b {\n      x\n      y\n    }\n}');
    });

    it('w is the line\'s leading whitespace, not the text before the hole', () => {
        expect(run([T('main', '"  x = ${v};"')], { v: 'a\nb' })).toBe('  x = a\n  b;');
    });

    it('a value ending with a newline does not indent the template\'s next line, and empty lines stay empty (mutant: the prefix written eagerly)', () => {
        expect(run([T('main', '"{\n  ${v}}"')], { v: 'a\n\nb\n' })).toBe('{\n  a\n\n  b\n}');
    });

    it('a join inside a hole is one value: its lines are indented by the hole\'s line', () => {
        const code = run([T('main', '"[\n  ${xs.map(x => "${x}").join(",\n")}\n]"')], { xs: ['a', 'b', 'c'] });
        expect(code).toBe('[\n  a,\n  b,\n  c\n]');
    });
});

describe('layoutFragments', () => {
    it('writes a level\'s prefix after a newline, before the next character of a fragment that shares the level, as a piece of no fragment', () => {
        const L = { id: 7, prefix: '  ' };
        const pieces = layoutFragments([
            fragment('a\nb\n', { kind: 'opaque', reads: [] }, [L]),
            fragment('c', { kind: 'opaque', reads: [] }, []),
        ]);
        expect(pieces).toEqual([
            { text: 'a', fragment: 0 }, { text: '\n', fragment: 0 },
            { text: '  ', fragment: null }, { text: 'b', fragment: 0 }, { text: '\n', fragment: 0 },
            { text: 'c', fragment: 1 },
        ]);
    });
});
