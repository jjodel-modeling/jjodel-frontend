import { describe, it, expect, vi } from 'vitest';

/**
 * A builtin that fails inside a JjTL expression stops the mapping with an
 * error, on both parser paths (R-FA-11, P-2026-11-03-1135): the message names
 * the builtin, the expression and, as a failing method does under R-FA-12, the
 * rule and the source element (R-FA-13, P-2026-11-06-2305); the run reports it
 * in `errors`. A name
 * that resolves to nothing is not a failing builtin: it keeps its warning and
 * the value `null`.
 *
 * The `joiner` barrel is mocked as in contained-sources.test.ts: `executor.ts`
 * imports it for `U.asNumber` alone, which drags in monaco and fails under
 * `environment: 'node'`. The lexer, parser and executor run unstubbed.
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

/** No `missing` attribute: it reads as null, and `range(null)` throws. */
const SOURCE = [{ id: 'S1', name: 's', className: 'Core', __type: 'Core', nregs: 4 }];

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

const ORIGIN = " (rule 'Core -> M', source element 's')";

describe.each([
    ['legacy parser (no source)', false],
    ['JjEL delegation (source)', true],
])('a failing builtin: %s', (_label, withSource) => {
    it('in a forall collection, the feature mapping stops with an error naming the builtin and the expression', async () => {
        const result = await run(`
Core c -> M {
    -> regs {
        forall i in range(missing) -> Register {
            index := i
        }
    }
}`, withSource);

        expect(result.success).toBe(false);
        expect(result.errors).toEqual([
            "Failed to map (creation) -> regs: Builtin 'range' failed in expression at line 7, column " +
            `${'        forall i in '.length + 1}${ORIGIN}: range() takes integers, got null`,
        ]);
        expect(result.warnings.filter(w => FAILED_EVAL.test(w))).toEqual([]);
    });

    it('inside a larger expression, the attribute mapping stops with the same error', async () => {
        const result = await run(`
Core c -> M {
    nregs := 1 + range(missing)
}`, withSource);

        // The legacy parser locates a binary expression at its operator, the
        // JjEL wrapper at the first token of the expression.
        const column = withSource ? '    nregs := '.length + 1 : '    nregs := 1 '.length + 1;
        expect(result.success).toBe(false);
        expect(result.errors).toEqual([
            "Failed to map (creation) -> nregs: Builtin 'range' failed in expression at line 6, column " +
            `${column}${ORIGIN}: range() takes integers, got null`,
        ]);
        expect(result.warnings.filter(w => FAILED_EVAL.test(w))).toEqual([]);
    });

    it('in a guard, the run stops with an error naming the rule and creates nothing', async () => {
        const result = await run(`
Core c -> M where range(missing) == 2 {
    nregs := 1
}`, withSource);

        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toMatch(/^Execution failed: Builtin 'range' failed in expression at line 5, column \d+/);
        expect(result.errors[0]).toContain(`${ORIGIN}: range() takes integers, got null`);
        expect(result.warnings.filter(w => FAILED_EVAL.test(w))).toEqual([]);
    });

    it('in a helper body, the binding that calls it stops with an error naming the rule', async () => {
        const result = await run(`
helper f(x: Any) -> Int { range(x.missing) }

Core c -> M {
    nregs := f(c)
}`, withSource);

        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toMatch(/^Failed to map \(creation\) -> nregs: Builtin 'range' failed in expression at line 8, column \d+/);
        expect(result.errors[0]).toContain(`${ORIGIN}: range() takes integers, got null`);
        expect(result.warnings.filter(w => FAILED_EVAL.test(w))).toEqual([]);
    });

    it('a name that resolves to nothing is not a failing builtin: a warning and null, no error', async () => {
        const result = await run(`
Core c -> M {
    nregs := nowhere(1)
}`, withSource);

        expect(result.success).toBe(true);
        expect(result.errors).toEqual([]);
        expect(result.warnings.filter(w => FAILED_EVAL.test(w)).map(w => w.replace(/\(\w+\)/, '(...)')))
            .toEqual(["Expression evaluation failed (...): Function 'nowhere' is not defined"]);
        expect(result.targetModel!.instances.get('M')![0].nregs ?? null).toBeNull();
    });
});
