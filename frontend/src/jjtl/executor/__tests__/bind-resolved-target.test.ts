import { describe, it, expect, vi } from 'vitest';

/**
 * How a parent holds a resolved target (P-2026-11-02-1742, slice A0).
 *
 * A reference binding whose value is a source element with a rule resolves,
 * through the trace, to that element's target. This file pins what the parent
 * then holds, and whether pass-2 rule order decides it.
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
        cls('M', ['name'], [{ name: 'reqs', composition: false, type: { name: 'Reg' } }]),
        cls('Reg', ['name']),
    ],
};

const SOURCE = [
    { id: 'A1', name: 'arb', className: 'Arbiter', __type: 'Arbiter', requirements: [{ __ref: 'R1' }, { __ref: 'R2' }] },
    { id: 'R1', name: 'r1', className: 'Requirement', __type: 'Requirement', _containerId: 'A1' },
    { id: 'R2', name: 'r2', className: 'Requirement', __type: 'Requirement', _containerId: 'A1' },
];

const ARBITER_RULE = `
Arbiter a -> M {
    name := name
    reqs := requirements
}`;
const REQUIREMENT_RULE = `
Requirement -> Reg {
    name := name
}`;

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
    const m = result.targetModel!.instances.get('M')![0];
    const regs = result.targetModel!.instances.get('Reg')!;
    return { m, regs, warnings: result.warnings };
}

describe.each([
    ['legacy parser (no source)', false],
    ['JjEL delegation (source)', true],
])('a parent bound to a resolved target: %s', (_label, withSource) => {
    it('holds a copy taken at bind time, so a rule bound later is missing from it', async () => {
        const { m, regs } = await run(ARBITER_RULE + '\n' + REQUIREMENT_RULE, withSource);

        expect(m.reqs.__ref_result).toBe(true);
        expect(m.reqs.targets.map((t: any) => t.__sourceId)).toEqual(['R1', 'R2']);
        // The live targets got their name in pass 2, after the parent was bound.
        expect(regs.map((r: any) => r.name)).toEqual(['r1', 'r2']);
        expect(m.reqs.targets[0]).not.toBe(regs[0]);
        expect(m.reqs.targets.map((t: any) => t.name)).toEqual([undefined, undefined]);
    });

    it('holds a copy whose content depends on pass-2 rule order', async () => {
        const { m, regs } = await run(REQUIREMENT_RULE + '\n' + ARBITER_RULE, withSource);

        expect(m.reqs.targets[0]).not.toBe(regs[0]);
        expect(m.reqs.targets.map((t: any) => t.name)).toEqual(['r1', 'r2']);
    });
});
