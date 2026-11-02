import { describe, it, expect, vi } from 'vitest';

/**
 * The three resolution fallbacks are reported (P-2026-11-02-1742, slice A0, R-JTG-2).
 *
 * Each one used to be silent. Each now adds one warning naming the rule and the source
 * element whose binding hit it, and the executor binds exactly what it bound before.
 *
 * The `joiner` barrel is mocked as in source-collections-in-expressions.test.ts:
 * `executor.ts` imports it for `U.asNumber` alone, which drags in monaco and
 * fails under `environment: 'node'`. The lexer, parser and executor run unstubbed.
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
        cls('M', ['name'], [
            { name: 'reqs', composition: false, type: { name: 'Reg' } },
            { name: 'note', composition: false, type: { name: 'Reg' } },
        ]),
        cls('Reg', ['name']),
    ],
};

const SOURCE = [
    {
        id: 'A1', name: 'arb', className: 'Arbiter', __type: 'Arbiter',
        requirements: [{ __ref: 'R1' }],
        // An embedded object, not a reference wrapper: its class has no rule.
        memo: { id: 'N1', name: 'n1', className: 'Note', __type: 'Note' },
    },
    { id: 'R1', name: 'r1', className: 'Requirement', __type: 'Requirement', _containerId: 'A1' },
];

function parseJjtl(body: string, withSource: boolean): TransformationAST {
    const text = 'transformation T\nfrom S\nto Tg\n\n' + body.trim();
    const { tokens, errors: lexErrors } = new JjtlLexer(text).tokenize();
    expect(lexErrors).toEqual([]);
    const { ast, errors } = new JjtlParser(tokens, withSource ? text : undefined).parse();
    expect(errors).toEqual([]);
    return ast!;
}

async function run(body: string, withSource: boolean) {
    const result = await execute(parseJjtl(body, withSource), SOURCE, TARGET);
    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
    return {
        m: result.targetModel!.instances.get('M')![0],
        regs: result.targetModel!.instances.get('Reg') ?? [],
        warnings: result.warnings,
    };
}

describe.each([
    ['legacy parser (no source)', false],
    ['JjEL delegation (source)', true],
])('resolution fallbacks are reported: %s', (_label, withSource) => {
    it('an object of a class without a rule is bound as the source object, with a warning', async () => {
        const { m, warnings } = await run(`
Arbiter a -> M {
    note := memo
}`, withSource);

        expect(m.note).toMatchObject({ id: 'N1', name: 'n1', className: 'Note' });
        expect(m.note.__ref_result).toBeUndefined();
        expect(warnings).toEqual([
            "Unresolved reference: Note 'n1' bound to 'note' has no rule mapping 'Note': " +
            "the source object itself was bound (rule 'Arbiter -> M', source element 'arb').",
        ]);
    });

    it('a reference to an element no rule maps resolves to null, with a warning', async () => {
        const { m, warnings } = await run(`
Arbiter a -> M {
    reqs := requirements
}`, withSource);

        expect(m.reqs).toEqual([null]);
        expect(warnings).toEqual([
            "Unresolved reference: the reference to 'R1' bound to 'reqs' points to an element no rule maps: " +
            "it resolved to null (rule 'Arbiter -> M', source element 'arb').",
        ]);
    });

    it('several targets of one rule for one source: the first is bound, with a warning', async () => {
        const { m, regs, warnings } = await run(`
Arbiter a -> M {
    reqs := requirements
}

Requirement -> Reg[2] {
    name := name
}`, withSource);

        expect(regs).toHaveLength(2);
        expect(m.reqs).toEqual({ __ref_result: true, targets: [regs[0]] });
        expect(m.reqs.targets[0]).toBe(regs[0]);
        expect(warnings).toEqual([
            "Unresolved reference: the reference to 'R1' bound to 'reqs' has 2 targets from rule " +
            "'Requirement -> Reg': the first was bound (rule 'Arbiter -> M', source element 'arb').",
        ]);
    });

    it('a healthy transformation reports nothing', async () => {
        const { warnings } = await run(`
Arbiter a -> M {
    name := name
    reqs := requirements
}

Requirement -> Reg {
    name := name
}`, withSource);

        expect(warnings).toEqual([]);
    });
});
