import { describe, it, expect, vi } from 'vitest';

/**
 * A failed run returns no target model (R-FA-14, P-2026-11-07-1125): the
 * executor itself withholds the partial model, so no caller can write it. The
 * errors, the warnings and the trace stay as they were. `targetModel` is
 * optional in `ExecutionResult`, so a failed run leaves it `undefined`.
 *
 * The `joiner` barrel is mocked as in builtin-error.test.ts: `executor.ts`
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

function cls(name: string, attributes: string[]) {
    const attrs = attributes.map(a => ({ name: a }));
    return {
        className: 'DClass', name,
        attributes: attrs, allAttributes: attrs,
        references: [], allReferences: [],
    };
}

const TARGET = { classes: [cls('M', ['nregs']), cls('Register', ['index'])] };

/** No `missing` attribute: it reads as null, and `range(null)` throws. */
const SOURCE = [{ id: 'S1', name: 's', className: 'Core', __type: 'Core', nregs: 4 }];

const TEXT = `transformation T
from S
to Tg

Core c -> M {
    nregs := c.nregs
}

Core c -> Register {
    index := 1 + range(missing)
}`;

function parseJjtl(text: string, withSource: boolean): TransformationAST {
    const { tokens, errors: lexErrors } = new JjtlLexer(text).tokenize();
    expect(lexErrors).toEqual([]);
    const { ast, errors } = new JjtlParser(tokens, withSource ? text : undefined).parse();
    expect(errors).toEqual([]);
    expect(ast).not.toBeNull();
    return ast!;
}

describe.each([
    ['legacy parser (no source)', false],
    ['JjEL delegation (source)', true],
])('a run whose second rule fails: %s', (_label, withSource) => {
    it('returns success false, its errors, warnings and trace, and no target model', async () => {
        const result = await execute(parseJjtl(TEXT, withSource), SOURCE, TARGET);

        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toMatch(/^Failed to map \(creation\) -> index: Builtin 'range' failed/);
        expect(result.errors[0]).toContain("(rule 'Core -> Register', source element 's')");
        expect(Array.isArray(result.warnings)).toBe(true);
        expect(result.trace).toBeInstanceOf(Map);
        expect(result.traceModel?.links.length).toBe(2);
        expect(result.targetModel).toBeUndefined();
    });

    it('a run that succeeds still returns its target model', async () => {
        const ok = TEXT.replace('1 + range(missing)', '1');
        const result = await execute(parseJjtl(ok, withSource), SOURCE, TARGET);

        expect(result.success).toBe(true);
        expect(result.targetModel?.instances.get('M')).toHaveLength(1);
        expect(result.targetModel?.instances.get('Register')).toHaveLength(1);
    });
});
