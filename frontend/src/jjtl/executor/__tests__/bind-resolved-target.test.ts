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
import { serializeTraceModel } from '../traceModel';
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

// Until P-2026-11-02-1742 the parent held a copy taken at bind time (fromJjelValue at
// executor.ts:1671, committed green in d2e2c8574): with the Arbiter rule first the copies
// had no name, with the Requirement rule first they had it. Binding is now by identity.
describe.each([
    ['legacy parser (no source)', false],
    ['JjEL delegation (source)', true],
])('a parent bound to a resolved target: %s', (_label, withSource) => {
    it('holds the live target, so what a later rule binds on it is there', async () => {
        const { m, regs, warnings } = await run(ARBITER_RULE + '\n' + REQUIREMENT_RULE, withSource);

        expect(m.reqs.__ref_result).toBe(true);
        expect(m.reqs.targets[0]).toBe(regs[0]);
        expect(m.reqs.targets[1]).toBe(regs[1]);
        expect(m.reqs.targets.map((t: any) => t.name)).toEqual(['r1', 'r2']);
        expect(warnings).toEqual([]);
    });

    it('holds the same thing whatever the rule order', async () => {
        const { m, regs } = await run(REQUIREMENT_RULE + '\n' + ARBITER_RULE, withSource);

        expect(m.reqs.targets[0]).toBe(regs[0]);
        expect(m.reqs.targets.map((t: any) => t.name)).toEqual(['r1', 'r2']);
    });

    it('lets two rule targets point at each other, and every reader of the output survives the cycle', async () => {
        const target = {
            classes: [
                cls('M', ['name'], [{ name: 'reqs', composition: false, type: { name: 'Reg' } }]),
                cls('Reg', ['name'], [{ name: 'owner', composition: false, type: { name: 'M' } }]),
            ],
        };
        const source = SOURCE.map(e => e.className === 'Requirement' ? { ...e, arbiter: { __ref: 'A1' } } : e);
        const ast = parseJjtl(ARBITER_RULE + `
Requirement -> Reg {
    name := name
    owner := arbiter
}`, withSource);
        const result = await execute(ast, source, target);

        expect(result.success).toBe(true);
        expect(result.errors).toEqual([]);
        const m = result.targetModel!.instances.get('M')![0];
        const regs = result.targetModel!.instances.get('Reg')!;
        expect(m.reqs.targets[0]).toBe(regs[0]);
        expect(regs[0].owner.targets[0]).toBe(m);
        expect(m.reqs.targets[0].owner.targets[0].reqs.targets[1]).toBe(regs[1]);

        // The trace holds the same live values; its serialization writes a rule target short.
        const trace = JSON.parse(serializeTraceModel(result.traceModel!));
        const owner = trace.links.flatMap((l: any) => l.bindings).find((b: any) => b.targetAttribute === 'owner');
        expect(owner.targetValue).toEqual({
            __ref_result: true,
            targets: [{ __type: 'M', className: 'M', __sourceId: 'A1' }],
        });
    });
});
