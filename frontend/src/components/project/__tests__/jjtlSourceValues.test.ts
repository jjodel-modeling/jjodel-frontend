import { describe, it, expect, vi } from 'vitest';

/**
 * A many-valued source feature reaches the JjTL rules as a collection, whatever the number of
 * values (P-2026-11-03-0539, ticket #473).
 *
 * The serializer of `handleExecuteTransformation` picked the shape from the count: one value gave the
 * bare value, so `requirements.map(...)` failed with `Unknown method 'map'` and a `forall` over the
 * feature produced nothing. `serializeFeatureValues` follows the declared upper bound instead.
 *
 * The executor cases run the helper's output through the executor on both parse paths: without
 * `source` (the legacy expression parser, which the app uses today) and with it (JjEL delegation).
 * The `joiner` barrel is mocked as in source-collections-in-expressions.test.ts: `executor.ts`
 * imports it for `U.asNumber` alone, which drags in monaco and fails under `environment: 'node'`.
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

import { isManyValued, serializeFeatureValues } from '../jjtlSourceValues';
import { JjtlLexer } from '../../../jjtl/lexer/lexer';
import { JjtlParser } from '../../../jjtl/parser/parser';
import { execute } from '../../../jjtl/executor/executor';
import type { TransformationAST } from '../../../jjtl/types/ast';

const wrap = (v: any) => (typeof v === 'string' && v.startsWith('Pointer') ? { __ref: v } : v);

describe('serializeFeatureValues', () => {
    it('reads -1 and bounds above 1 as many-valued, 0 and 1 as single, a missing bound as unknown', () => {
        expect(isManyValued(-1)).toBe(true);
        expect(isManyValued(3)).toBe(true);
        expect(isManyValued(1)).toBe(false);
        expect(isManyValued(0)).toBe(false);
        expect(isManyValued(undefined)).toBeUndefined();
        expect(isManyValued('-1')).toBeUndefined();
    });

    it('gives a many-valued reference holding one value as a one-element list', () => {
        expect(serializeFeatureValues(['Pointer1_a_1'], -1, wrap)).toEqual([{ __ref: 'Pointer1_a_1' }]);
    });

    it('gives a many-valued attribute holding one value as a one-element list', () => {
        expect(serializeFeatureValues(['x'], -1, wrap)).toEqual(['x']);
        expect(serializeFeatureValues([0], 5, wrap)).toEqual([0]);
    });

    it('gives an empty many-valued feature as an empty list, an empty single-valued one as null', () => {
        expect(serializeFeatureValues([], -1, wrap)).toEqual([]);
        expect(serializeFeatureValues([null, ''], -1, wrap)).toEqual([]);
        expect(serializeFeatureValues(undefined, -1, wrap)).toEqual([]);
        expect(serializeFeatureValues([], 1, wrap)).toBeNull();
    });

    it('gives a single-valued feature as the bare value', () => {
        expect(serializeFeatureValues(['Pointer1_a_1'], 1, wrap)).toEqual({ __ref: 'Pointer1_a_1' });
        expect(serializeFeatureValues([false], 1, wrap)).toBe(false);
    });

    it('keeps several values of a single-valued slot as a list, as before', () => {
        expect(serializeFeatureValues(['a', 'b'], 1, wrap)).toEqual(['a', 'b']);
    });

    it('keeps the count-based shape for a slot with no declared bound', () => {
        expect(serializeFeatureValues([], undefined, wrap)).toBeNull();
        expect(serializeFeatureValues(['a'], undefined, wrap)).toBe('a');
        expect(serializeFeatureValues(['a', 'b'], undefined, wrap)).toEqual(['a', 'b']);
    });

    it('still keeps a repeated Pointer id once (ticket #474, unchanged)', () => {
        expect(serializeFeatureValues(['Pointer1_a_1', 'Pointer1_a_1'], -1, wrap))
            .toEqual([{ __ref: 'Pointer1_a_1' }]);
    });

    // #474: the collapse applies to features declared unique only, the EMF default; a feature
    // declared unique=false hands every repeat to the rules.
    it('keeps a repeated value once on a feature declared unique, or with no unique flag', () => {
        expect(serializeFeatureValues(['Pointer1_a_1', 'Pointer1_a_1'], -1, wrap, true))
            .toEqual([{ __ref: 'Pointer1_a_1' }]);
        expect(serializeFeatureValues(['Pointer1_a_1', 'Pointer1_a_1'], -1, wrap, undefined))
            .toEqual([{ __ref: 'Pointer1_a_1' }]);
        expect(serializeFeatureValues(['x', 'x'], -1, wrap, true)).toEqual(['x']);
        // Only an explicit false turns the collapse off.
        expect(serializeFeatureValues(['x', 'x'], -1, wrap, null)).toEqual(['x']);
    });

    it('keeps every repeat on a feature declared unique=false (#474)', () => {
        expect(serializeFeatureValues(['Pointer1_a_1', 'Pointer1_a_1'], -1, wrap, false))
            .toEqual([{ __ref: 'Pointer1_a_1' }, { __ref: 'Pointer1_a_1' }]);
        expect(serializeFeatureValues(['x', 'x', null, ''], -1, wrap, false)).toEqual(['x', 'x']);
        expect(serializeFeatureValues(['Pointer1_a_1', 'Pointer1_a_1'], undefined, wrap, false))
            .toEqual([{ __ref: 'Pointer1_a_1' }, { __ref: 'Pointer1_a_1' }]);
    });
});

describe('a repeated pointer in a many-valued reference (#474)', () => {
    const RULE_474 = `
Arbiter a -> M {
    a := requirements.size()
    -> regs {
        forall p in requirements -> Reg {
            name := p.name
        }
    }
}
`;
    const run = async (unique: boolean) => {
        const src = [
            {
                id: 'A1', name: 'arb', className: 'Arbiter', __type: 'Arbiter',
                requirements: serializeFeatureValues(['Pointer1_r_1', 'Pointer1_r_1'], -1, wrap, unique),
            },
            { id: 'Pointer1_r_1', name: 'r1', className: 'Requirement', __type: 'Requirement', _containerId: 'A1' },
        ];
        const result = await execute(parseJjtl(RULE_474, true), src, TARGET);
        expect(result.success).toBe(true);
        return result.targetModel!.instances.get('M')![0];
    };

    it('reaches the rules twice when the reference is declared unique=false', async () => {
        const m = await run(false);
        expect(m.a).toBe(2);
        expect((m.regs ?? []).map((r: any) => r.name)).toEqual(['r1', 'r1']);
    });

    it('reaches the rules once when the reference is unique', async () => {
        const m = await run(true);
        expect(m.a).toBe(1);
        expect((m.regs ?? []).map((r: any) => r.name)).toEqual(['r1']);
    });
});

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
        cls('M', ['a', 'b', 'c', 'd', 'e', 'f'], [
            { name: 'regs', composition: true, type: { name: 'Reg' } },
        ]),
        cls('Reg', ['name']),
    ],
};

/** An Arbiter whose slots are serialized by the helper, as ProjectEditor does. */
function source(upperBound: number | undefined) {
    return [
        {
            id: 'A1', name: 'arb', className: 'Arbiter', __type: 'Arbiter',
            requirements: serializeFeatureValues(['Pointer1_r_1'], upperBound, wrap),
            requesters: serializeFeatureValues([], upperBound, wrap),
            tags: serializeFeatureValues(['fixed'], upperBound, wrap),
        },
        {
            id: 'Pointer1_r_1', name: 'r1', className: 'Requirement', __type: 'Requirement',
            kind: 'X', _containerId: 'A1',
        },
    ];
}

const RULE = `
Arbiter a -> M {
    a := requirements.size()
    b := requirements.first().kind
    c := requirements.map(p => p.kind)
    d := tags.size()
    e := requesters.size()
    -> regs {
        forall p in requirements -> Reg {
            name := p.name
        }
    }
}
`;

function parseJjtl(body: string, withSource: boolean): TransformationAST {
    const text = 'transformation T\nfrom S\nto Tg\n\n' + body.trim();
    const { tokens, errors: lexErrors } = new JjtlLexer(text).tokenize();
    expect(lexErrors).toEqual([]);
    const { ast, errors } = new JjtlParser(tokens, withSource ? text : undefined).parse();
    expect(errors).toEqual([]);
    return ast!;
}

describe.each([
    ['legacy parser (no source)', false],
    ['JjEL parser (source)', true],
] as const)('a many-valued feature with one value or none — %s', (_label, withSource) => {
    const run = async (upperBound: number | undefined) => {
        const result = await execute(parseJjtl(RULE, withSource), source(upperBound), TARGET);
        return { m: result.targetModel!.instances.get('M')![0], warnings: result.warnings, result };
    };

    it('reaches the rules as a collection: size, first, map, forall', async () => {
        const { m, warnings, result } = await run(-1);
        expect(result.success).toBe(true);
        expect(warnings).toEqual([]);
        expect(m.a).toBe(1);
        expect(m.b).toBe('X');
        expect(m.c).toEqual(['X']);
        expect(m.d).toBe(1);
        expect(m.e).toBe(0);
        expect((m.regs ?? []).map((r: any) => r.name)).toEqual(['r1']);
    });

    it('the bare value, the shape of the count-based serializer, is what broke the rules', async () => {
        const { m, warnings, result } = await run(undefined);
        // `tags.size()` on the bare string is a method the string does not have: since
        // R-FA-12 it stops that binding with an error. The calls on the bare element stay
        // warnings, a model element without the feature (P-2026-11-05-1530).
        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toMatch(/^Failed to map \(creation\) -> d: Method 'size' failed in expression at line 9, column \d+ \(rule 'Arbiter -> M', source element 'arb'\): Unknown method 'size' for type String/);
        expect(warnings.some(w => /Unknown method 'map'/.test(w))).toBe(true);
        expect(warnings.some(w => /ForAll collection is not an array/.test(w))).toBe(true);
        expect(m.c ?? null).toBeNull();
        expect(m.regs ?? []).toEqual([]);
    });
});
