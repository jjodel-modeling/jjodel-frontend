import { describe, it, expect, vi } from 'vitest';

/**
 * Variables bound by `let` are read inside nested bodies: forall bodies,
 * `-> feature { }` bodies and created objects, at any depth (P-2026-10-31-1710).
 *
 * Before this change the let variables lived only in the let body's own context,
 * and every nested body was built from the source instance plus the rule alias,
 * so `$x` read null below the let body. A `-> feature { }` inside a let body also
 * took the old wrapper path and built an object typed after the feature.
 *
 * The joiner barrel is mocked (see contained-sources.test.ts for why); the
 * executor itself runs unstubbed. Each case runs on both parser paths.
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

const HEAD = 'transformation ER2Rel\nfrom ERD\nto Relational\n\n';

const RELATIONAL = {
    classes: [
        {
            className: 'DClass', name: 'Table',
            allAttributes: [{ name: 'name' }, { name: 'tag' }],
            allReferences: [{ name: 'columns', composition: true, type: { name: 'Column' } }],
        },
        {
            className: 'DClass', name: 'Column',
            allAttributes: [{ name: 'name' }, { name: 'tag' }],
            allReferences: [{ name: 'parts', composition: true, type: { name: 'Part' } }],
        },
        {
            className: 'DClass', name: 'Part',
            allAttributes: [{ name: 'name' }, { name: 'tag' }],
            allReferences: [],
        },
    ],
};

const SOURCE = [
    { id: 'E1', name: 'Person', className: 'Entity', __type: 'Entity', ownedAttributes: [{ __ref: 'A1' }, { __ref: 'A2' }] },
    { id: 'A1', name: 'ssn', className: 'Attribute', __type: 'Attribute', parts: [{ __ref: 'P1' }] },
    { id: 'A2', name: 'age', className: 'Attribute', __type: 'Attribute', parts: [] },
    { id: 'P1', name: 'p', className: 'Part', __type: 'Part' },
];

function parseJjtl(source: string, withSource: boolean): TransformationAST {
    const { tokens } = new JjtlLexer(source).tokenize();
    const { ast, errors } = withSource ? new JjtlParser(tokens, source).parse() : new JjtlParser(tokens).parse();
    expect(errors).toEqual([]);
    return ast!;
}

async function run(body: string, withSource: boolean): Promise<any> {
    const result: any = await execute(parseJjtl(HEAD + body, withSource), SOURCE, RELATIONAL);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    return result.targetModel.roots[0];
}

describe.each([
    ['without source (application path)', false],
    ['with source (JjEL delegation)', true],
])('let variables in nested bodies, %s', (_label, withSource) => {

    it('reads $x inside a forall body', async () => {
        const table = await run(`Entity e -> Table {
    let $x = "T" in {
        forall a in ownedAttributes -> Column {
            name := a.name
            tag := $x
        }
    }
}`, withSource);
        expect(table.columns.map((c: any) => [c.name, c.tag])).toEqual([['ssn', 'T'], ['age', 'T']]);
    });

    it('reads $x inside a nested forall body, under -> feature { }', async () => {
        const table = await run(`Entity e -> Table {
    let $x = "T" in {
        -> columns {
            forall a in ownedAttributes -> Column {
                name := a.name
                -> parts {
                    forall p in a.parts -> Part {
                        tag := $x + p.name
                    }
                }
            }
        }
    }
}`, withSource);
        expect(Array.isArray(table.columns)).toBe(true);
        expect(table.columns[0].parts.map((p: any) => p.tag)).toEqual(['Tp']);
        expect(table.columns[1].parts).toEqual([]);
    });

    it('reads $x inside a -> feature { -> Class { } } body, placed into the feature', async () => {
        const table = await run(`Entity e -> Table {
    let $x = "T" in {
        -> columns {
            -> Column {
                tag := $x
            }
        }
    }
}`, withSource);
        expect(table.columns.__type).toBe('Column');
        expect(table.columns.tag).toBe('T');
    });

    it('reads a let declared inside a created object from a nested creation', async () => {
        const table = await run(`Entity e -> Table {
    -> columns {
        forall a in ownedAttributes -> Column {
            let $y = a.name in {
                name := $y
                -> parts {
                    -> Part {
                        tag := $y
                    }
                }
            }
        }
    }
}`, withSource);
        expect(table.columns.map((c: any) => [c.name, c.parts.__type, c.parts.tag]))
            .toEqual([['ssn', 'Part', 'ssn'], ['age', 'Part', 'age']]);
    });

    it('reads both variables of nested lets inside a forall body', async () => {
        const table = await run(`Entity e -> Table {
    let $x = "T" in {
        let $z = "Z" in {
            forall a in ownedAttributes -> Column {
                tag := $x + $z + a.name
            }
        }
    }
}`, withSource);
        expect(table.columns.map((c: any) => c.tag)).toEqual(['TZssn', 'TZage']);
    });
});
