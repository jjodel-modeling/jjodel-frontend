import { describe, it, expect, vi } from 'vitest';

/**
 * Nested object creation placed into a FEATURE of the target instance
 * (GO 2026-09-06 15:20, decisions D1, D2, D3, D6).
 *
 * Before this change every form produced something the model never received:
 * `-> feature { forall ... }` built an intermediate object typed after the
 * feature name and warned "Target class 'columns' not found ... Mapping skipped"
 * (nothing was skipped); `-> feature { -> Class { ... } }` wrote a plain object
 * under the feature; `-> Class { ... }` at rule level wrote it under a property
 * named after the class. All three were then dropped by ProjectEditor without a
 * word.
 *
 * The joiner barrel is mocked (see contained-sources.test.ts for why); the
 * executor itself runs unstubbed.
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

function parseJjtl(source: string): TransformationAST {
    const { tokens } = new JjtlLexer(source.trim()).tokenize();
    const { ast, errors } = new JjtlParser(tokens).parse();
    expect(errors).toEqual([]);
    return ast!;
}

const HEAD = 'transformation ER2Rel\nfrom ERD\nto Relational\n\n';
const run = (body: string, source: any[], mm?: any) => execute(parseJjtl(HEAD + body), source, mm);

const RELATIONAL = {
    classes: [
        {
            className: 'DClass', name: 'Table',
            allAttributes: [{ name: 'name' }],
            allReferences: [{ name: 'columns', composition: true, type: { name: 'Column' } }],
        },
        {
            className: 'DClass', name: 'Column',
            allAttributes: [{ name: 'name' }, { name: 'isPrimaryKey' }, { name: 'type' }],
            allReferences: [],
        },
    ],
};

const ROOTS = [{
    id: 'E1', name: 'Person', className: 'Entity', __type: 'Entity',
    ownedAttributes: [{ __ref: 'A1' }, { __ref: 'A2' }],
}];
const CONTAINED = [
    { id: 'A1', name: 'ssn', className: 'Attribute', __type: 'Attribute', isKey: true, type: 'String' },
    { id: 'A2', name: 'age', className: 'Attribute', __type: 'Attribute', isKey: false, type: 'Integer' },
];
const FULL = [...ROOTS, ...CONTAINED];

describe('-> feature { forall ... -> Class { ... } }', () => {
    it('creates one object per element and puts them in the feature', async () => {
        const result = await run(`Entity -> Table {
    name := name
    -> columns {
        forall a in ownedAttributes -> Column {
            name := a.name
            isPrimaryKey := a.isKey
        }
    }
}
`, FULL, RELATIONAL);

        expect(result.success).toBe(true);
        expect(result.warnings).toEqual([]);

        const table = result.targetModel!.instances.get('Table')![0];
        expect(Array.isArray(table.columns)).toBe(true);
        expect(table.columns).toHaveLength(2);
        expect(table.columns.map((c: any) => c.name)).toEqual(['ssn', 'age']);
        expect(table.columns.map((c: any) => c.isPrimaryKey)).toEqual([true, false]);
        expect(table.columns.every((c: any) => c.__type === 'Column')).toBe(true);
    });

    it('no longer warns that the feature name is an unknown target class', async () => {
        const result = await run(`Entity -> Table {
    -> columns {
        forall a in ownedAttributes -> Column {
            name := a.name
        }
    }
}
`, FULL, RELATIONAL);

        expect(result.warnings.some(w => w.includes("Target class 'columns'"))).toBe(false);
        expect(result.warnings.some(w => w.includes('Mapping skipped'))).toBe(false);
    });

    it('honours a such-that filter', async () => {
        const result = await run(`Entity -> Table {
    -> columns {
        forall a in ownedAttributes such that a.isKey -> Column {
            name := a.name
        }
    }
}
`, FULL, RELATIONAL);

        const table = result.targetModel!.instances.get('Table')![0];
        expect(table.columns.map((c: any) => c.name)).toEqual(['ssn']);
    });

    it('an empty collection leaves the feature as an empty list, not undefined', async () => {
        const result = await run(`Entity -> Table {
    -> columns {
        forall a in ownedAttributes -> Column {
            name := a.name
        }
    }
}
`, [{ id: 'E9', name: 'Empty', className: 'Entity', __type: 'Entity', ownedAttributes: [] }], RELATIONAL);

        const table = result.targetModel!.instances.get('Table')![0];
        expect(table.columns).toEqual([]);
    });
});

describe('-> feature { -> Class { ... } }', () => {
    it('creates one object and puts it in the feature', async () => {
        const result = await run(`Entity -> Table {
    name := name
    -> columns {
        -> Column {
            name := "id"
            isPrimaryKey := true
        }
    }
}
`, FULL, RELATIONAL);

        expect(result.success).toBe(true);
        expect(result.warnings).toEqual([]);

        const table = result.targetModel!.instances.get('Table')![0];
        expect(table.columns.__type).toBe('Column');
        expect(table.columns.name).toBe('id');
        expect(table.columns.isPrimaryKey).toBe(true);
    });

    it('an unknown class inside the wrapper is reported without claiming a skip', async () => {
        const result = await run(`Entity -> Table {
    -> columns {
        -> Nope {
            name := "x"
        }
    }
}
`, FULL, RELATIONAL);

        const msg = result.warnings.find(w => w.includes("Target class 'Nope'"));
        expect(msg).toBeDefined();
        expect(msg).toContain('Table.columns');
        expect(msg).not.toContain('Mapping skipped');
    });

    it('an unknown feature is named in a warning instead of being dropped in silence', async () => {
        const result = await run(`Entity -> Table {
    -> colonne {
        -> Column {
            name := "id"
        }
    }
}
`, FULL, RELATIONAL);

        expect(result.warnings.some(w =>
            w.includes("Feature 'colonne'") && w.includes('Table')
        )).toBe(true);
    });
});

describe('-> Class { ... } directly in a rule body', () => {
    it('is an error naming the form to use, and nothing is created', async () => {
        const result = await run(`Entity -> Table {
    name := name
    -> Column {
        name := "id"
    }
}
`, FULL, RELATIONAL);

        expect(result.success).toBe(false);
        expect(result.errors.some(e =>
            e.includes('Object creation must be nested in a feature')
            && e.includes('-> feature { -> Column { ... } }')
        )).toBe(true);
    });
});

describe('rule-level forall without a feature name', () => {
    it('uses the one feature of the target class that can hold the created class', async () => {
        const result = await run(`Entity -> Table {
    name := name
    forall a in ownedAttributes -> Column {
        name := a.name
    }
}
`, FULL, RELATIONAL);

        expect(result.success).toBe(true);
        expect(result.warnings).toEqual([]);
        const table = result.targetModel!.instances.get('Table')![0];
        expect(table.columns.map((c: any) => c.name)).toEqual(['ssn', 'age']);
    });

    it('falls back to the pluralization heuristic and says which name it guessed', async () => {
        const mm = {
            classes: [
                {
                    className: 'DClass', name: 'Table',
                    allAttributes: [{ name: 'name' }],
                    // the holding feature is NOT named after the class
                    allReferences: [
                        { name: 'cols', composition: true, type: { name: 'Column' } },
                        { name: 'extra', composition: true, type: { name: 'Column' } },
                    ],
                },
                { className: 'DClass', name: 'Column', allAttributes: [{ name: 'name' }], allReferences: [] },
            ],
        };
        const result = await run(`Entity -> Table {
    forall a in ownedAttributes -> Column {
        name := a.name
    }
}
`, FULL, mm);

        const table = result.targetModel!.instances.get('Table')![0];
        expect(table.columns).toHaveLength(2);          // the guess
        const warn = result.warnings.find(w => w.includes('pluralization'));
        expect(warn).toBeDefined();
        expect(warn).toContain("guessed 'columns'");
        expect(warn).toContain("not a feature of 'Table'");
    });

    it('keeps working with no target metamodel at all (the heuristic, silently)', async () => {
        const result = await run(`Entity -> Table {
    forall a in ownedAttributes -> Column {
        name := a.name
    }
}
`, FULL);

        expect(result.success).toBe(true);
        expect(result.warnings).toEqual([]);
        const table = result.targetModel!.instances.get('Table')![0];
        expect(table.columns.map((c: any) => c.name)).toEqual(['ssn', 'age']);
    });
});

describe('reference collections inside a forall (D3)', () => {
    it('dereferences { __ref: id } to the source object so a.attr reads a value', async () => {
        const result = await run(`Entity -> Table {
    -> columns {
        forall a in ownedAttributes -> Column {
            name := a.name
        }
    }
}
`, FULL, RELATIONAL);

        const table = result.targetModel!.instances.get('Table')![0];
        // Without the dereference every name is null: the body saw {__ref} wrappers.
        expect(table.columns.map((c: any) => c.name)).toEqual(['ssn', 'age']);
    });

    it('a reference to an object outside the source model is reported once per collection', async () => {
        const result = await run(`Entity -> Table {
    -> columns {
        forall a in ownedAttributes -> Column {
            name := a.name
        }
    }
}
`, [{
            id: 'E1', name: 'Person', className: 'Entity', __type: 'Entity',
            ownedAttributes: [{ __ref: 'GONE1' }, { __ref: 'GONE2' }],
        }], RELATIONAL);

        const warn = result.warnings.filter(w => w.includes('iterated unresolved'));
        expect(warn).toHaveLength(1);
        expect(warn[0]).toContain('2 element(s)');
    });

    it('a collection of plain objects keeps working unchanged', async () => {
        const result = await run(`Entity -> Table {
    -> columns {
        forall a in ownedAttributes -> Column {
            name := a.name
        }
    }
}
`, [{
            id: 'E1', name: 'Person', className: 'Entity', __type: 'Entity',
            ownedAttributes: [{ name: 'inline1' }, { name: 'inline2' }],
        }], RELATIONAL);

        expect(result.warnings).toEqual([]);
        const table = result.targetModel!.instances.get('Table')![0];
        expect(table.columns.map((c: any) => c.name)).toEqual(['inline1', 'inline2']);
    });
});

describe('value mappings with identifier keys reach the target (D7, execution half)', () => {
    it('maps an enum-literal name through `attr := expr : Key=Value`', async () => {
        const result = await run(`Entity -> Table {
    -> columns {
        forall a in ownedAttributes -> Column {
            name := a.name
            type := a.type : String=VARCHAR, Integer=INTEGER
        }
    }
}
`, FULL, RELATIONAL);

        const table = result.targetModel!.instances.get('Table')![0];
        expect(table.columns.map((c: any) => c.type)).toEqual(['VARCHAR', 'INTEGER']);
    });

    it('maps them through the conversion form `-> attr : expr : Key=Value` too', async () => {
        const result = await run(`Entity -> Table {
    -> columns {
        forall a in ownedAttributes -> Column {
            -> type : a.type : String=VARCHAR, Integer=INTEGER
        }
    }
}
`, FULL, RELATIONAL);

        const table = result.targetModel!.instances.get('Table')![0];
        expect(table.columns.map((c: any) => c.type)).toEqual(['VARCHAR', 'INTEGER']);
    });

    it('an unmapped value passes through unchanged', async () => {
        const result = await run(`Entity -> Table {
    -> columns {
        forall a in ownedAttributes -> Column {
            type := a.type : String=VARCHAR
        }
    }
}
`, FULL, RELATIONAL);

        const table = result.targetModel!.instances.get('Table')![0];
        expect(table.columns.map((c: any) => c.type)).toEqual(['VARCHAR', 'Integer']);
    });
});

describe('provenance and counters', () => {
    it('nested objects carry __createdBy and __nested, and are counted', async () => {
        const result = await run(`Entity -> Table {
    -> columns {
        forall a in ownedAttributes -> Column {
            name := a.name
        }
    }
}
`, FULL, RELATIONAL);

        const table = result.targetModel!.instances.get('Table')![0];
        expect(table.columns.every((c: any) => c.__createdBy === 'JjTL')).toBe(true);
        expect(table.columns.every((c: any) => c.__nested === true)).toBe(true);
        // 1 Table + 2 Column
        expect(result.stats!.targetInstancesCreated).toBe(3);
    });

    it('a nested creation is not mistaken for a reference to another rule target', async () => {
        const result = await run(`Entity -> Table {
    -> columns {
        forall a in ownedAttributes -> Column {
            name := a.name
        }
    }
}
`, FULL, RELATIONAL);

        const table = result.targetModel!.instances.get('Table')![0];
        expect((table.columns as any).__ref_result).toBeUndefined();
    });
});
