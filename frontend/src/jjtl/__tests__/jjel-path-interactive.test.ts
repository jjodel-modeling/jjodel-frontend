import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';

/**
 * The JjEL parser path (`source` passed) keeps what the legacy path did
 * (P-2026-10-31-1910):
 * - `prompt`, `confirm` and `input` open their dialog: the parser turns the
 *   JjEL call back into the JjTL interactive node, which the executor awaits;
 * - a `:=` conditional may continue with `else` on the next line;
 * - SPEC.md §13 example 5, `prompt(message, default)`, parses on both paths.
 *
 * The prompt host is a recording UIBridge set with setUIBridge. The joiner
 * barrel is mocked (see executor/__tests__/contained-sources.test.ts).
 */
vi.mock('../../joiner', () => ({
    U: {
        asNumber: (val: any, returnInvalid: any = 0, returnNAN: any = NaN): number => {
            if (isNaN(val)) return returnNAN;
            if (typeof val === 'number') return val;
            const v = +val;
            if (isNaN(v)) return returnInvalid;
            return v;
        },
    },
}));

import { JjtlLexer } from '../lexer/lexer';
import { JjtlParser } from '../parser/parser';
import { execute } from '../executor/executor';
import { getUIBridge, setUIBridge, UIBridge } from '../executor/UIBridge';
import type { TransformationAST, ParserError } from '../types';

const HEAD = 'transformation T\nfrom S\nto D\n\n';

const SOURCE = [
    { id: 'E1', className: 'Element', __type: 'Element', name: 'alpha', category: 'core', flag: false },
];

let calls: string[] = [];

const RECORDING_BRIDGE: UIBridge = {
    async showAlert() { /* not under test */ },
    showNotify() { /* not under test */ },
    async showPrompt(message, typeRef, defaultValue) {
        calls.push(`prompt|${message}|${typeRef}|${defaultValue}`);
        return { value: 'typed', cancelled: false };
    },
    async showInput(message, inputType, _defaultValue, options) {
        calls.push(`input|${message}|${inputType}|${JSON.stringify(options)}`);
        return { value: 'entered' as any, cancelled: false };
    },
    async showConfirm(message) {
        calls.push(`confirm|${message}`);
        return true;
    },
};

const saved = getUIBridge();
beforeEach(() => { calls = []; setUIBridge(RECORDING_BRIDGE); });
afterAll(() => { setUIBridge(saved); });

function parse(source: string, withSource: boolean): { ast: TransformationAST | null; errors: ParserError[] } {
    const { tokens } = new JjtlLexer(source).tokenize();
    return withSource ? new JjtlParser(tokens, source).parse() : new JjtlParser(tokens).parse();
}

async function run(body: string, withSource: boolean): Promise<any> {
    const { ast, errors } = parse(HEAD + body, withSource);
    expect(errors).toEqual([]);
    const result: any = await execute(ast!, SOURCE);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    return result.targetModel.roots[0];
}

describe('interactive builtins on the JjEL path', () => {
    it('prompt(message, Type) opens the dialog and binds the answer', async () => {
        const out = await run(`Element -> Item {\n    name := prompt("Category?", EString)\n}`, true);
        expect(calls).toEqual(['prompt|Category?|EString|undefined']);
        expect(out.name).toBe('typed');
    });

    it('prompt(message, Type, default) passes the evaluated default', async () => {
        const out = await run(`Element -> Item {\n    name := prompt("Name for " + name, EString, name + "!")\n}`, true);
        expect(calls).toEqual(['prompt|Name for alpha|EString|alpha!']);
        expect(out.name).toBe('typed');
    });

    it('prompt in a let binding opens the dialog', async () => {
        const out = await run(`Element -> Item {\n    let $p = prompt("Name", EString) in {\n        name := $p\n    }\n}`, true);
        expect(calls).toEqual(['prompt|Name|EString|undefined']);
        expect(out.name).toBe('typed');
    });

    it('confirm(message) opens the dialog and binds the answer', async () => {
        const out = await run(`Element -> Item {\n    ok := confirm("Sure about " + name + "?")\n}`, true);
        expect(calls).toEqual(['confirm|Sure about alpha?']);
        expect(out.ok).toBe(true);
    });

    it('input(message, "type") opens the dialog and binds the answer', async () => {
        const out = await run(`Element -> Item {\n    count := input("How many?", "number", 10)\n}`, true);
        expect(calls).toEqual(['input|How many?|number|undefined']);
        expect(out.count).toBe('entered');
    });

    it('input(message, "select", [options]) passes the evaluated options', async () => {
        const out = await run(`Element -> Item {\n    kind := input("Kind?", "select", ["a", name])\n}`, true);
        expect(calls).toEqual(['input|Kind?|select|["a","alpha"]']);
        expect(out.kind).toBe('entered');
    });

    it('builds the same interactive node as the legacy path', () => {
        const body = `Element -> Item {\n    name := prompt("Name", EString, "x")\n    ok := confirm("Sure?")\n    n := input("N?", "number")\n}`;
        const types = (withSource: boolean) =>
            (parse(HEAD + body, withSource).ast!.mappings[0].body as any[]).map(i => [i.expression.type, i.expression.typeRef ?? i.expression.inputType]);
        expect(types(true)).toEqual([['PromptExpression', 'EString'], ['ConfirmExpression', undefined], ['InputExpression', 'number']]);
        expect(types(true)).toEqual(types(false));
    });

    it('reports a malformed call as a parse error', () => {
        const { errors } = parse(HEAD + `Element -> Item {\n    ok := confirm()\n}`, true);
        expect(errors.map(e => e.message)).toEqual(['confirm expects one argument, the message']);
    });
});

describe('a := conditional continues with else on the next line, JjEL path', () => {
    it('binds both attributes', async () => {
        const out = await run(`Element -> Item {\n    a := if flag then 1\n         else 2\n    b := 3\n}`, true);
        expect([out.a, out.b]).toEqual([2, 3]);
    });

    it('a chained else if on the next lines', async () => {
        const out = await run(`Element -> Item {\n    a := if flag then 1\n         else if name == "alpha" then 2\n         else 3\n    b := 4\n}`, true);
        expect([out.a, out.b]).toEqual([2, 4]);
    });

    it('a newline still ends a := conditional with no else', async () => {
        const out = await run(`Element -> Item {\n    a := if flag then 1\n    b := 3\n}`, true);
        expect([out.a, out.b]).toEqual([null, 3]);
    });
});

describe('SPEC.md §13 example 5, prompt(message, default)', () => {
    const EXAMPLE_5 = `transformation InteractiveMapping
from Source
to Target

Element -> TargetElement {
    name := name

    -- Ask user for confirmation on ambiguous mappings
    category := prompt("Category for " + name + "?", source.category)

    alert("Processing element: " + name, "info")
}
`;

    it.each([['JjEL path', true], ['legacy path', false]])('parses on the %s', (_label, withSource) => {
        const { ast, errors } = parse(EXAMPLE_5, withSource as boolean);
        expect(errors).toEqual([]);
        const prompt = (ast!.mappings[0].body as any[])[1].expression;
        expect(prompt.type).toBe('PromptExpression');
        expect(prompt.typeRef).toBe('EString');
        expect(prompt.defaultValue).toBeDefined();
    });

    it('runs with the source value as the default', async () => {
        const { ast } = parse(EXAMPLE_5, true);
        const result: any = await execute(ast!, SOURCE);
        expect(result.errors).toEqual([]);
        expect(calls).toEqual(['prompt|Category for alpha?|EString|core']);
        expect(result.targetModel.roots[0].category).toBe('typed');
    });
});
