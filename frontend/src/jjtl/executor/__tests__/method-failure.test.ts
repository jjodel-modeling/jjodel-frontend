import { describe, it, expect, vi } from 'vitest';

/**
 * A JjEL method that fails inside a JjTL expression stops the mapping with an
 * error on both parser paths, as a failing builtin does (R-FA-11, extended by
 * R-FA-12, P-2026-11-05-1530): a method that does not exist for the value's
 * type (`"4".log2()`) and a library method that throws (`4.toFixed(200)`), in a
 * binding, a guard, a `forall` collection and a helper body. The message names
 * the method, the expression, the rule and the source element; no
 * `Expression evaluation failed` warning.
 *
 * Out of the extension, unchanged: a name that resolves to nothing, a method
 * called on null (a missing feature reads as null) and a call on a model
 * element that has no feature of that name keep their warning and `null`.
 *
 * Outside JjTL nothing changes: JjEL throws the same error, class and message,
 * as before; only a symbol-keyed mark tells JjTL the call was a method's.
 *
 * The `joiner` barrel is mocked as in builtin-error.test.ts.
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
import type { TransformationAST } from '../../types/ast';
import { parseExpression } from '../../../jjel/parser/parser';
import { evaluate } from '../../../jjel/evaluator/evaluator';

function cls(name: string, attributes: string[], references: any[] = []) {
    const attrs = attributes.map(a => ({ name: a }));
    return {
        className: 'DClass', name,
        attributes: attrs, allAttributes: attrs,
        references, allReferences: references,
    };
}

const TARGET = {
    classes: [
        cls('M', ['nregs'], [
            { name: 'regs', composition: true, type: { name: 'Register' } },
        ]),
        cls('Register', ['name', 'index']),
    ],
};

/** `xlen` as an XMI import before #607 left it: a string. No `missing` attribute. */
const SOURCE = [{ id: 'S1', name: 's', className: 'Core', __type: 'Core', nregs: 4, xlen: '4' }];

const HEADER = 'transformation T\nfrom S\nto Tg\n\n';

function parseJjtl(body: string, withSource: boolean): TransformationAST {
    const text = HEADER + body.trim();
    const { tokens, errors: lexErrors } = new JjtlLexer(text).tokenize();
    expect(lexErrors).toEqual([]);
    const { ast, errors } = new JjtlParser(tokens, withSource ? text : undefined).parse();
    expect(errors).toEqual([]);
    expect(ast).not.toBeNull();
    return ast!;
}

async function run(body: string, withSource: boolean) {
    return execute(parseJjtl(body, withSource), SOURCE, TARGET);
}

const FAILED_EVAL = /^Expression evaluation failed/;

const FAILURES = [
    ['a method the string does not have', 'c.xlen.log2()', 'log2', /Unknown method 'log2' for type String/],
    ['a library method that throws', 'c.nregs.toFixed(200)', 'toFixed', /RangeError|toFixed\(\) digits/],
] as const;

const PATHS = [
    ['legacy parser (no source)', false],
    ['JjEL delegation (source)', true],
] as const;

describe.each(PATHS)('a failing JjEL method: %s', (_label, withSource) => {
    describe.each(FAILURES)('%s', (_kind, call, method, reason) => {
        /** One error, naming the method, the expression's line and the reason; no fallback warning. */
        function expectStopped(result: Awaited<ReturnType<typeof run>>, prefix: string, line: number) {
            expect(result.success).toBe(false);
            expect(result.errors).toHaveLength(1);
            const [error] = result.errors;
            expect(error.startsWith(`${prefix}Method '${method}' failed in expression at line ${line}, column `)).toBe(true);
            expect(error).toContain(` (rule 'Core -> M', source element 's'): `);
            expect(error).toMatch(reason);
            expect(result.warnings.filter(w => FAILED_EVAL.test(w))).toEqual([]);
        }

        it('in a binding, the attribute mapping stops with an error', async () => {
            const result = await run(`
Core c -> M {
    nregs := 1 + ${call}
}`, withSource);
            expectStopped(result, 'Failed to map (creation) -> nregs: ', 6);
        });

        it('in a guard, the run stops with an error and creates nothing', async () => {
            const result = await run(`
Core c -> M where ${call} == 2 {
    nregs := 1
}`, withSource);
            expectStopped(result, 'Execution failed: ', 5);
        });

        it('in a forall collection, the feature mapping stops with an error', async () => {
            const result = await run(`
Core c -> M {
    -> regs {
        forall i in ${call} -> Register {
            index := i
        }
    }
}`, withSource);
            expectStopped(result, 'Failed to map (creation) -> regs: ', 7);
        });

        it('in a helper body, the binding that calls it stops with an error', async () => {
            const result = await run(`
helper f(x: Any) -> Int { ${call.replace(/^c\./, 'x.')} }

Core c -> M {
    nregs := f(c)
}`, withSource);
            expectStopped(result, 'Failed to map (creation) -> nregs: ', 8);
        });
    });
});

describe.each(PATHS)('out of the extension, still a warning and null: %s', (_label, withSource) => {
    async function expectWarned(expression: string, warning: RegExp) {
        const result = await run(`
Core c -> M {
    nregs := ${expression}
}`, withSource);
        expect(result.success).toBe(true);
        expect(result.errors).toEqual([]);
        expect(result.warnings.filter(w => FAILED_EVAL.test(w)).some(w => warning.test(w))).toBe(true);
        expect(result.targetModel!.instances.get('M')![0].nregs ?? null).toBeNull();
    }

    it('a function name that resolves to nothing, with the same argument', async () => {
        await expectWarned('nowhere(c.xlen)', /Function 'nowhere' is not defined/);
    });

    it('a method called on a missing feature, which reads as null', async () => {
        await expectWarned('c.missing.log2()', /Cannot call method 'log2' on null/);
    });

    it('a call on a model element that has no feature of that name', async () => {
        await expectWarned('c.log2()', /Unknown method 'log2'/);
    });
});

describe('JjEL on its own throws what it threw before', () => {
    function thrown(source: string, bindings: Record<string, any>): any {
        const { expression, errors } = parseExpression(source);
        expect(errors).toEqual([]);
        try {
            evaluate(expression!, bindings);
        } catch (error) {
            return error;
        }
        throw new Error(`'${source}' did not throw`);
    }

    it('a method the string does not have: a JjelEvaluationError, same class name and message', () => {
        const error = thrown('xlen.log2()', { xlen: '4' });
        expect(error.constructor.name).toBe('JjelEvaluationError');
        expect(String(error)).toMatch(/^JjelEvaluationError: Unknown method 'log2' for type String/);
    });

    it('a library method that throws: the native error itself', () => {
        const error = thrown('n.toFixed(200)', { n: 4 });
        expect(error).toBeInstanceOf(RangeError);
        expect(Object.keys(error)).toEqual([]);
    });
});
