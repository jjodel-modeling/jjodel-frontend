import { describe, it, expect, vi } from 'vitest';

/**
 * P-2026-11-06-2226: a helper parameter named like another helper of the same transformation
 * read as that helper (a function object), not as the argument, with no warning. Helpers are
 * registered as JjEL builtins, and the JjEL evaluator looked builtins up before scope bindings.
 *
 * The rule (SPEC.md §3.4, scoping): inside a helper body a parameter shadows a helper, or any
 * builtin, of the same name when read as a value; a call `name(...)` goes to the parameter
 * only when the parameter holds a function, and to the helper otherwise.
 *
 * `joiner` is mocked as in resolution-fallbacks.test.ts.
 */
vi.mock('../../../joiner', () => ({
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

import { JjtlLexer } from '../../lexer/lexer';
import { JjtlParser } from '../../parser/parser';
import { execute } from '../executor';

const TARGET = {
    classes: [{
        className: 'DClass', name: 'Module',
        attributes: [{ name: 'name' }], allAttributes: [{ name: 'name' }],
        references: [], allReferences: [],
    }],
};

const HEAD = 'transformation Rep\nfrom Brief\nto SyncRTL\n' +
    'helper pick(x: Any, which: String) -> String { if which == "a" then "A" else "B" }\n';

async function moduleName(helpers: string, nameExpr: string, withSource: boolean) {
    const text = HEAD + helpers + `Brief b -> Module {\n    name := ${nameExpr}\n}\n`;
    const { tokens } = new JjtlLexer(text).tokenize();
    const { ast, errors } = new JjtlParser(tokens, withSource ? text : undefined).parse();
    expect(errors).toEqual([]);
    const result = await execute(ast!, [{ id: 'b1', name: 'b1', className: 'Brief', __type: 'Brief' }], TARGET);
    expect(result.errors).toEqual([]);
    return result.targetModel!.instances.get('Module')![0].name;
}

describe.each([
    ['legacy parser (no source)', false],
    ['JjEL parser (source)', true],
] as const)('a helper parameter named like a helper — %s', (_label, withSource) => {
    it('reads as the argument, not as the helper', async () => {
        const helpers =
            'helper call(cx: Any, s: String) -> String { pick(cx, s) }\n' +
            'helper echo(cx: Any, pick: String) -> String { pick }\n';
        expect(await moduleName(helpers, 'call(b, "a") + "/" + echo(b, "a")', withSource)).toBe('A/a');
    });

    it('is passed on as the argument, while the call still reaches the helper', async () => {
        const helpers = 'helper call(cx: Any, pick: String) -> String { pick(cx, pick) }\n';
        expect(await moduleName(helpers, 'call(b, "a")', withSource)).toBe('A');
    });

    it('is called when it holds a function', async () => {
        const helpers = 'helper app(cx: Any, pick: Any) -> String { pick("z") }\n';
        expect(await moduleName(helpers, 'app(b, s => s + "!")', withSource)).toBe('z!');
    });

    it('does not shadow inside a helper it calls', async () => {
        const helpers =
            'helper inner(cx: Any) -> String { pick(cx, "a") }\n' +
            'helper outer(cx: Any, pick: Any) -> String { inner(cx) }\n';
        expect(await moduleName(helpers, 'outer(b, s => s + "!")', withSource)).toBe('A');
    });
});
