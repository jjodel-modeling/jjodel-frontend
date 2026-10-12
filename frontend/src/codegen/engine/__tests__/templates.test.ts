/**
 * templates — records `{name, params, body}` registered as JjEL builtins (slice S2, P-2026-10-10-0945; spec §4,
 * R-GEN-4, R-GEN-12, discovery §A.3, §B.1, U1).
 *
 * Executed through `generate` (P11): a template calls another and itself, the recursion bound turns an unbounded
 * recursion into one error fragment, and `with … do` is refused before evaluation. The tree is a synthetic record
 * of plain handles, as in origin.test.ts.
 * Mutations each test kills are in its name; the bench is in the commit body.
 */

import { describe, it, expect } from 'vitest';
import { generate } from '../generate';
import { MAX_TEMPLATE_DEPTH } from '../templates';
import type { TemplateRecord } from '../templates';

const T = (name: string, params: string[], body: string): TemplateRecord => ({ name, params, body });

/** a(b(c), d): handles with `label` and a containment `children`. */
function tree() {
    const node = (id: string, children: any[] = []) => ({ id, __type: 'Object', name: id, label: id, children });
    const c = node('c');
    const b = node('b', [c]);
    const d = node('d');
    const a = node('a', [b, d]);
    return { instances: [a, b, c, d], root: a };
}

const gen = (templates: TemplateRecord[], globals: Record<string, any> = {}, entry = 'main', args: any[] = []) =>
    generate(globals, {}, 'M', templates, entry, args);

describe('template records as builtins', () => {
    it('a template calls another with its arguments; a missing argument is null', () => {
        const out = gen([
            T('main', [], '"${greet("Ada")}|${greet()}!"'),
            T('greet', ['who'], '"Hello ${who}"'),
        ]);
        expect(out.errors).toEqual([]);
        expect(out.code).toBe('Hello Ada|Hello !');
    });

    it('the entry takes its arguments from generate', () => {
        expect(gen([T('greet', ['who'], '"Hello ${who}"')], {}, 'greet', ['Bob']).code).toBe('Hello Bob');
    });

    it('a template sees the globals and its own parameters, not the caller\'s locals (lexical scope)', () => {
        const out = gen([
            T('main', [], '"${["x"].map(local => show())}"'),
            T('show', [], '"${g}/${local}"'),
        ], { g: 'G' });
        expect(out.code).toBe('G/');
    });

    it('a template recurses over a containment tree, and the nesting indents (U1)', () => {
        const { instances, root } = tree();
        const out = gen([
            T('main', [], '"${node(root)}"'),
            T('node', ['n'], '"<${n.label}>${n.children.map(c => "\n  ${node(c)}").join("")}"'),
        ], { instances, root });
        expect(out.errors).toEqual([]);
        expect(out.code).toBe('<a>\n  <b>\n    <c>\n  <d>');
    });

    it('a body that is not an interpolated string still yields Text', () => {
        const out = gen([T('main', [], '["a", "b"].map(x => item(x)).join("\n")'), T('item', ['x'], '"- ${x}"')]);
        expect(out.code).toBe('- a\n- b');
        expect(gen([T('main', [], '"plain"')]).code).toBe('plain');
    });
});

describe('the recursion bound', () => {
    it(`is ${MAX_TEMPLATE_DEPTH} nested calls: one more is an error fragment at the hole that made the call (mutant: the bound off by one)`, () => {
        expect(MAX_TEMPLATE_DEPTH).toBe(64);
        const down = T('down', ['k'], '"${if k > 0 then down(k - 1) else "end"}"');
        // down(63) is 64 calls, down(64) is 65.
        const ok = gen([down], {}, 'down', [MAX_TEMPLATE_DEPTH - 1]);
        expect([ok.code, ok.hasErrors]).toEqual(['end', false]);
        const over = gen([down], {}, 'down', [MAX_TEMPLATE_DEPTH]);
        expect(over.hasErrors).toBe(true);
        expect(over.errors).toHaveLength(1);
        expect(over.errors[0]).toMatchObject({ template: 'down', offset: 3, line: 1, column: 4 });
    });

    it('an unbounded recursion is one error fragment naming the bound, not a stack overflow (mutant: the bound removed)', () => {
        const out = gen([T('main', [], '"a${loop()}b"'), T('loop', [], '"${loop()}"')]);
        expect(out.code).toBe('ab');
        expect(out.errors).toHaveLength(1);
        expect(out.errors[0].message).toBe(`Template 'loop' called more than ${MAX_TEMPLATE_DEPTH} levels deep: the recursion has no end`);
    });
});

describe('template problems, found before evaluation', () => {
    it('`with … do` is refused with a template error, and no hole of the template is evaluated (discovery §B.1)', () => {
        const out = gen([T('main', [], '"${boom.x}${with s do title}"')], { s: { id: 's', title: 'T' } });
        expect(out.hasErrors).toBe(true);
        expect(out.errors).toHaveLength(1);
        expect(out.errors[0]).toMatchObject({ template: 'main', offset: 12, line: 1, column: 13 });
        expect(out.errors[0].message).toMatch(/^`with … do` is not allowed in a template/);
        expect(out.code).toBe('');
    });

    it('a parse error is a template error with its position; a call to that template is an error, the rest generates', () => {
        const out = gen([T('main', [], '"ok ${bad()}"'), T('bad', [], '"${1 +}"')]);
        expect(out.errors.map(e => e.template)).toEqual(['bad', 'main']);
        expect(out.errors[1].message).toBe("Template 'bad' has errors and cannot be called");
        expect(out.code).toBe('ok ');
    });

    it('a duplicate name, a name that is not an identifier and a name of a JjEL builtin are template errors', () => {
        const out = gen([T('main', [], '"m"'), T('main', [], '"again"'), T('two words', [], '"x"'), T('now', [], '"x"')]);
        expect(out.code).toBe('m');
        expect(out.errors.map(e => [e.template, e.message])).toEqual([
            ['main', "Template 'main' is defined twice: the first definition is used"],
            ['two words', "Template name 'two words' is not an identifier"],
            ['now', "Template name 'now' is a JjEL builtin"],
        ]);
    });

    it('an entry that does not exist is one error', () => {
        const out = gen([T('main', [], '"m"')], {}, 'nope');
        expect(out.errors).toEqual([{ template: 'nope', offset: 0, line: 1, column: 1, message: "No template named 'nope'" }]);
        expect(out.code).toBe('');
    });
});
