import { describe, it, expect, vi, afterEach } from 'vitest';

/**
 * SPEC.md §12.2, each row reproduced against the current code (P-2026-11-03-1402).
 * The verdict of each row, and the evidence, are in the SPEC; the row's name is
 * in the describe.
 *
 * `joiner` is mocked as in resolution-fallbacks.test.ts; the executor runs unstubbed.
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
import { toJjelAst } from '../astBridge';
import { getJjelErrors, isValidJjel, jjelEval } from '../../../jjel';

const PATHS = [
    ['legacy parser (no source)', false],
    ['JjEL parser (source)', true],
] as const;

function parse(text: string, withSource: boolean) {
    const { tokens } = new JjtlLexer(text).tokenize();
    return new JjtlParser(tokens, withSource ? text : undefined).parse();
}

function cls(name: string, attributes: string[], references: any[] = []) {
    const attrs = attributes.map(a => ({ name: a }));
    return {
        className: 'DClass', name,
        attributes: attrs, allAttributes: attrs,
        references, allReferences: references,
    };
}

const HEAD = 'transformation T\nfrom S\nto Tg\n\n';

describe('row: .forAll(...) never parses (stale since 3aa5993c8)', () => {
    it('JjEL parses coll.forAll(x => p) and the evaluator names coll.all', () => {
        expect(getJjelErrors('xs.forAll(x => x > 0)')).toEqual([]);
        expect(isValidJjel('xs.all(x => x > 0)')).toBe(true);
        expect(() => jjelEval('xs.forAll(x => x > 0)', { xs: [1, -1] } as any))
            .toThrow(/Unknown method 'forAll' for type Array\. Did you mean 'all'\?/);
    });

    it('a JjTL binding with .forAll parses on the JjEL path, the one the app uses', () => {
        const { errors } = parse(HEAD + 'A -> B {\n    ok := xs.forAll(x => x > 0)\n}', true);
        expect(errors).toEqual([]);
    });

    it('the legacy path, reached by tests only, still refuses it', () => {
        const { errors } = parse(HEAD + 'A -> B {\n    ok := xs.forAll(x => x > 0)\n}', false);
        expect(errors.length).toBeGreaterThan(0);
    });
});

describe('row: multiplicity [*]', () => {
    it.each(PATHS)('[*] creates one target per source, [3] creates three — %s', async (_l, withSource) => {
        const target = { classes: [cls('B', ['name'])] };
        for (const [mult, expected] of [['[*]', 1], ['[3]', 3]] as const) {
            const { ast, errors } = parse(HEAD + `A -> B${mult} {\n    name := name\n}`, withSource);
            expect(errors).toEqual([]);
            const result = await execute(ast!, [{ id: 'a0', name: 'a0', className: 'A' }], target);
            expect(result.targetModel!.instances.get('B')!.length).toBe(expected);
        }
    });
});

describe('row: number type', () => {
    it('a bridged decimal literal is tagged EDouble, an integer EInt', () => {
        const lit = (value: number) => ({ type: 'Literal', literalType: 'number', value, location: undefined } as any);
        expect(toJjelAst(lit(3.5))).toMatchObject({ value: 3.5, dataType: 'EDouble' });
        expect(toJjelAst(lit(3))).toMatchObject({ value: 3, dataType: 'EInt' });
    });

    it.each(PATHS)('a decimal binding keeps its fraction — %s', async (_l, withSource) => {
        const { ast } = parse(HEAD + 'A -> B {\n    w := 3.5\n    v := 2 + 0.25\n}', withSource);
        const result = await execute(ast!, [{ id: 'a0', className: 'A' }], { classes: [cls('B', ['w', 'v'])] });
        expect(result.targetModel!.instances.get('B')![0]).toMatchObject({ w: 3.5, v: 2.25 });
    });
});

describe('row: duplicate values (B_1 receiving A_0\'s values)', () => {
    const text = HEAD + 'A -> B {\n    name := name\n    n := n\n}';
    const target = { classes: [cls('B', ['name', 'n'])] };
    const sources = () => [
        { id: 'a0', name: 'a0', n: 0, className: 'A' },
        { id: 'a1', name: 'a1', n: 1, className: 'A' },
    ];

    it.each(PATHS)('flat array source: each target has its own source\'s values — %s', async (_l, withSource) => {
        const { ast } = parse(text, withSource);
        const result = await execute(ast!, sources(), target);
        const bs = result.targetModel!.instances.get('B')!;
        expect(bs.map((b: any) => [b.name, b.n])).toEqual([['a0', 0], ['a1', 1]]);
    });

    it.each(PATHS)('{ instances } source: each instance is matched once — %s', async (_l, withSource) => {
        const { ast } = parse(text, withSource);
        const result = await execute(ast!, { instances: sources() }, target);
        const bs = result.targetModel!.instances.get('B')!;
        expect(bs.map((b: any) => [b.name, b.n])).toEqual([['a0', 0], ['a1', 1]]);
    });
});

describe('row: debug logging', () => {
    afterEach(() => vi.restoreAllMocks());

    it('a run writes nothing to console.log', async () => {
        const log = vi.spyOn(console, 'log').mockImplementation(() => {});
        const { ast } = parse(HEAD + 'A -> B {\n    name := name\n}\nZ -> Nope {\n}', true);
        await execute(ast!, [{ id: 'a0', name: 'a0', className: 'A' }], { classes: [cls('B', ['name'])] });
        expect(log).not.toHaveBeenCalled();
    });
});

describe('#445: a binding to a feature the target class does not declare', () => {
    const target = {
        classes: [
            cls('Box', ['name'], [{ name: 'kids', composition: true, type: { name: 'Kid' } }]),
            cls('Kid', ['weight']),
            { ...cls('Toy', []), extends: [{ name: 'Named' }] },
            cls('Named', ['name']),
        ],
    };
    const text = HEAD +
        'B -> Box {\n' +                     // line 5
        '    name := name\n' +               // line 6
        '    colour := "red"\n' +            // line 7
        '    -> kids {\n' +                  // line 8
        '        -> Kid {\n' +               // line 9
        '            name := "k1"\n' +       // line 10
        '            weight := 3\n' +        // line 11
        '        }\n' +
        '    }\n' +
        '}\n' +
        'C -> Toy {\n' +                     // line 15
        '    name := "inherited"\n' +        // line 16
        '}';

    it.each(PATHS)('is warned once, with rule, line and column, and the value is not a feature — %s', async (_l, withSource) => {
        const { ast, errors } = parse(text, withSource);
        expect(errors).toEqual([]);
        const result = await execute(ast!, [
            { id: 'b1', name: 'b1', className: 'B' },
            { id: 'b2', name: 'b2', className: 'B' },
            { id: 'c1', name: 'c1', className: 'C' },
        ], target);
        expect(result.errors).toEqual([]);
        const undeclared = result.warnings.filter(w => /is not a feature of target class/.test(w));
        expect(undeclared).toHaveLength(2);
        expect(undeclared[0]).toMatch(
            /^Rule 'B -> Box', binding 'colour' at line 7, column \d+: 'colour' is not a feature of target class 'Box'; the value is not written to the model\.$/);
        expect(undeclared[1]).toMatch(
            /^Rule 'B -> Box', binding 'name' at line 10, column \d+: 'name' is not a feature of target class 'Kid'; the value is not written to the model\.$/);
    });

    it('is not warned when the target metamodel is unknown', async () => {
        const { ast } = parse(text, true);
        const result = await execute(ast!, [{ id: 'b1', name: 'b1', className: 'B' }]);
        expect(result.warnings.filter(w => /is not a feature of target class/.test(w))).toEqual([]);
    });

    it('is warned inside a let body', async () => {
        const { ast, errors } = parse(HEAD + 'B -> Box {\n    let $x = 1 in {\n        size := $x\n    }\n}', true);
        expect(errors).toEqual([]);
        const result = await execute(ast!, [{ id: 'b1', name: 'b1', className: 'B' }], target);
        expect(result.warnings.filter(w => /binding 'size' at line 7, column \d+: 'size' is not a feature of target class 'Box'/.test(w)))
            .toHaveLength(1);
    });
});
