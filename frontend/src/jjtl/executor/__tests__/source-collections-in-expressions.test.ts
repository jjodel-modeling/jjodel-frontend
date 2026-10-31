import { describe, it, expect, vi } from 'vitest';

/**
 * Source collections read by an expression (P-2026-10-31-1340).
 *
 * ProjectEditor serializes every reference value as `{ __ref: id }`. A JjTL
 * forall dereferenced each element, but a JjEL expression read the same feature
 * as raw wrappers: `requirements.first().kind` was null, with no warning. The
 * rule's source alias was bound at rule level only, so `a.name` failed inside a
 * forall body. `exists` did not parse in a forall `such that`.
 *
 * Each case runs on both parse paths: without `source` (the legacy expression
 * parser, which the app uses today) and with it (JjEL delegation).
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
        cls('M', ['a', 'b', 'c', 'd', 'e', 'f'], [
            { name: 'regs', composition: true, type: { name: 'Reg' } },
            { name: 'reqs', composition: false, type: { name: 'Reg' } },
        ]),
        cls('Reg', ['name'], [
            { name: 'fields', composition: true, type: { name: 'Field' } },
        ]),
        cls('Field', ['name']),
    ],
};

function arbiter(refs: string[]) {
    return {
        id: 'A1', name: 'arb', className: 'Arbiter', __type: 'Arbiter',
        requirements: refs.map(id => ({ __ref: id })),
    };
}
const REQUIREMENTS = [
    { id: 'R1', name: 'r1', className: 'Requirement', __type: 'Requirement', kind: 'X', _containerId: 'A1' },
    { id: 'R2', name: 'r2', className: 'Requirement', __type: 'Requirement', kind: 'Y', _containerId: 'A1' },
    { id: 'R3', name: 'r3', className: 'Requirement', __type: 'Requirement', kind: 'X', _containerId: 'A1' },
];
const SOURCE = [arbiter(['R1', 'R2', 'R3']), ...REQUIREMENTS];

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

async function runOne(body: string, withSource: boolean, source: any[] = SOURCE) {
    const result = await execute(parseJjtl(body, withSource), source, TARGET);
    expect(result.success).toBe(true);
    const ms = result.targetModel!.instances.get('M') ?? [];
    return { m: ms[0], ms, warnings: result.warnings };
}

const names = (objs: any[] | undefined) => (objs ?? []).map(o => o.name);

describe.each([
    ['legacy parser (no source)', false],
    ['JjEL delegation (source)', true],
])('source collections in expressions: %s', (_label, withSource) => {
    it('every expression form reads the resolved elements', async () => {
        const { m, warnings } = await runOne(`
Arbiter a -> M {
    a := requirements.size()
    b := requirements.first().kind
    c := requirements.map(p => p.kind)
    d := requirements.filter(p => p.kind == "X").isNotEmpty()
    e := a.requirements.last().name
    f := self.requirements.filter(p => p.kind == "Y").size()
}`, withSource);

        expect([m.a, m.b, m.c, m.d, m.e, m.f]).toEqual([3, 'X', ['X', 'Y', 'X'], true, 'r3', 1]);
        expect(warnings).toEqual([]);
    });

    it('the guard and the collection form of exists read the resolved elements', async () => {
        const kept = await runOne(`
Arbiter a -> M where requirements.any(q => q.kind == "Y") {
    a := requirements.size()
}`, withSource);
        expect(kept.m?.a).toBe(3);

        const dropped = await runOne(`
Arbiter a -> M where requirements.any(q => q.kind == "Z") {
    a := requirements.size()
}`, withSource);
        expect(dropped.ms).toEqual([]);
    });

    it('a reference collection bound to a reference feature resolves by id, as before', async () => {
        const { m, warnings } = await runOne(`
Arbiter a -> M {
    reqs := requirements
}

Requirement -> Reg {
    name := name
}`, withSource);

        expect(m.reqs.__ref_result).toBe(true);
        // Targets are copied when bound, before pass 2 of the other rule names them.
        expect(m.reqs.targets.map((t: any) => t.__sourceId)).toEqual(['R1', 'R2', 'R3']);
        expect(warnings).toEqual([]);
    });

    it('a reference to a class without a rule still fails open to null, without throwing', async () => {
        const { m } = await runOne(`
Arbiter a -> M {
    reqs := requirements
}`, withSource);

        expect(m.reqs).toEqual([null, null, null]);
    });

    it('the forall filter keeps working on the same collection', async () => {
        const { m, warnings } = await runOne(`
Arbiter a -> M {
    -> regs {
        forall p in requirements such that p.kind == "X" -> Reg {
            name := p.name
        }
    }
}`, withSource);

        expect(names(m.regs)).toEqual(['r1', 'r3']);
        expect(warnings).toEqual([]);
    });

    it('the alias is in scope inside a forall body', async () => {
        const { m, warnings } = await runOne(`
Arbiter a -> M {
    -> regs {
        forall p in requirements -> Reg {
            name := a.name + "." + p.name
        }
    }
}`, withSource);

        expect(names(m.regs)).toEqual(['arb.r1', 'arb.r2', 'arb.r3']);
        expect(warnings).toEqual([]);
    });

    it('the alias is in scope inside a nested forall body and its filter', async () => {
        const { m, warnings } = await runOne(`
Arbiter a -> M {
    -> regs {
        forall p in requirements such that a.requirements.size() == 3 -> Reg {
            name := p.name
            -> fields {
                forall q in a.requirements such that q.kind == p.kind -> Field {
                    name := a.name + "." + p.name + "." + q.name
                }
            }
        }
    }
}`, withSource);

        expect(names(m.regs)).toEqual(['r1', 'r2', 'r3']);
        expect(m.regs.map((r: any) => names(r.fields))).toEqual([
            ['arb.r1.r1', 'arb.r1.r3'],
            ['arb.r2.r2'],
            ['arb.r3.r1', 'arb.r3.r3'],
        ]);
        expect(warnings).toEqual([]);
    });

    it('the alias is in scope inside a forall that names no feature', async () => {
        const { m } = await runOne(`
Arbiter a -> M {
    forall p in requirements -> Reg {
        name := a.name + p.name
    }
}`, withSource);

        expect(names(m.regs)).toEqual(['arbr1', 'arbr2', 'arbr3']);
    });

    it('an unresolved reference read in an expression yields null and one warning naming rule and expression', async () => {
        const source = [arbiter(['R1', 'GHOST']), ...REQUIREMENTS];
        const { m, warnings } = await runOne(`
Arbiter a -> M {
    c := requirements.map(p => p.kind)
}`, withSource, source);

        expect(m.c).toEqual(['X', null]);
        expect(warnings).toHaveLength(1);
        expect(warnings[0]).toMatch(/^Rule 'Arbiter -> M', expression at line \d+, column \d+: read 'kind' of 'GHOST'/);
    });
});

describe('exists in a forall such that (JjEL delegation)', () => {
    it('parses and filters on the resolved elements', async () => {
        const some = await runOne(`
Arbiter a -> M {
    -> regs {
        forall p in requirements such that exists q in requirements such that q.kind == "Y" -> Reg {
            name := p.name
        }
    }
}`, true);
        expect(names(some.m.regs)).toEqual(['r1', 'r2', 'r3']);

        const none = await runOne(`
Arbiter a -> M {
    -> regs {
        forall p in requirements such that exists q in requirements such that q.kind == "Z" -> Reg {
            name := p.name
        }
    }
}`, true);
        expect(none.m.regs ?? []).toEqual([]);
        expect(none.warnings).toEqual([]);
    });
});
