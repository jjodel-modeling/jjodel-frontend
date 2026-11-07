import { describe, it, expect, vi } from 'vitest';

/**
 * A forall over `range(n)` (P-2026-10-31-1740): the collection is a list of
 * numbers, not model elements, and the loop variable is the number. The
 * hardware generator iterates registers, bits and stages this way.
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

async function runOne(body: string, withSource: boolean) {
    const result = await execute(parseJjtl(body, withSource), SOURCE, TARGET);
    expect(result.success).toBe(true);
    const ms = result.targetModel!.instances.get('M') ?? [];
    return { m: ms[0], warnings: result.warnings };
}

describe.each([
    ['legacy parser (no source)', false],
    ['JjEL delegation (source)', true],
])('forall over range: %s', (_label, withSource) => {
    it('creates one object per element of range(4), index 0..3 in order', async () => {
        const { m, warnings } = await runOne(`
Core c -> M {
    -> regs {
        forall i in range(4) -> Register {
            index := i
        }
    }
}`, withSource);

        expect(m.regs.map((r: any) => r.index)).toEqual([0, 1, 2, 3]);
        expect(warnings).toEqual([]);
    });

    it('the bound is read from the source and the index builds a name', async () => {
        const { m } = await runOne(`
Core c -> M {
    -> regs {
        forall i in range(nregs) -> Register {
            name := "x" + i
            index := i
        }
    }
}`, withSource);

        expect(m.regs.map((r: any) => r.name)).toEqual(['x0', 'x1', 'x2', 'x3']);
        expect(m.regs.map((r: any) => r.index)).toEqual([0, 1, 2, 3]);
    });

    it('an empty range creates nothing', async () => {
        const { m } = await runOne(`
Core c -> M {
    -> regs {
        forall i in range(0) -> Register {
            index := i
        }
    }
}`, withSource);

        expect(m.regs ?? []).toEqual([]);
    });
});
