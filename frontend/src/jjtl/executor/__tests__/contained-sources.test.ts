import { describe, it, expect, vi } from 'vitest';

/**
 * Contained source instances.
 *
 * `ProjectEditor` used to hand the executor `LModel.objects` — the ROOT objects
 * of the source model. An `Attribute` living inside `Entity.ownedAttributes` was
 * therefore invisible, and a rule on it reported
 * "Source class 'X' has no instances in the source model".
 *
 * These tests pin the executor half of the contract: given the full object set
 * (roots + contained, the shape `allSubObjects` produces), a rule on a contained
 * class produces output and `parent` resolves to the containing object.
 *
 * The `joiner` barrel is mocked: `executor.ts` imports it for `U.asNumber` alone,
 * and importing it for real drags in monaco/jquery/sweetalert2/axios, which under
 * `environment: 'node'` fail at import (the seven pre-existing red files of this
 * suite). `asNumber` is reproduced verbatim from `common/U.tsx`. The subject —
 * lexer, parser, executor — runs unstubbed.
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
    const { tokens, errors: lexErrors } = new JjtlLexer(source.trim()).tokenize();
    expect(lexErrors).toEqual([]);
    const { ast, errors } = new JjtlParser(tokens).parse();
    expect(errors).toEqual([]);
    expect(ast).not.toBeNull();
    return ast!;
}

// Target metamodel in the shape ProjectEditor hands over (LModel-like: .classes
// with className 'DClass', LClass-like members).
const RELATIONAL = {
    classes: [
        {
            className: 'DClass', name: 'Table',
            attributes: [{ name: 'name' }], allAttributes: [{ name: 'name' }],
            references: [{ name: 'columns', composition: true, type: { name: 'Column' } }],
            allReferences: [{ name: 'columns', composition: true, type: { name: 'Column' } }],
        },
        {
            className: 'DClass', name: 'Column',
            attributes: [{ name: 'name' }, { name: 'isPrimaryKey' }],
            allAttributes: [{ name: 'name' }, { name: 'isPrimaryKey' }],
            references: [], allReferences: [],
        },
    ],
};

// Two roots and three contained instances, exactly as ProjectEditor serializes
// them: reference values wrapped as { __ref: id }, containment recorded as
// _containerId on the child.
const ROOTS = [
    {
        id: 'E1', name: 'Person', className: 'Entity', __type: 'Entity',
        ownedAttributes: [{ __ref: 'A1' }, { __ref: 'A2' }],
    },
    {
        id: 'E2', name: 'Company', className: 'Entity', __type: 'Entity',
        ownedAttributes: [{ __ref: 'A3' }],
    },
];
const CONTAINED = [
    { id: 'A1', name: 'ssn', className: 'Attribute', __type: 'Attribute', isKey: true, _containerId: 'E1' },
    { id: 'A2', name: 'age', className: 'Attribute', __type: 'Attribute', isKey: false, _containerId: 'E1' },
    { id: 'A3', name: 'vat', className: 'Attribute', __type: 'Attribute', isKey: true, _containerId: 'E2' },
];

const ATTRIBUTE_RULE = `
transformation ER2Rel
from ERD
to Relational

Attribute -> Column {
    name := name
    isPrimaryKey := isKey
}
`;

describe('contained source instances', () => {
    it('roots only: a rule on a contained class produces nothing and says so', async () => {
        const result = await execute(parseJjtl(ATTRIBUTE_RULE), ROOTS, RELATIONAL);

        expect(result.success).toBe(true);
        expect(result.targetModel!.instances.get('Column')).toBeUndefined();
        expect(result.warnings.some(w =>
            w.includes("Source class 'Attribute' has no instances")
        )).toBe(true);
    });

    it('roots plus contained: the same rule produces one Column per Attribute', async () => {
        const result = await execute(parseJjtl(ATTRIBUTE_RULE), [...ROOTS, ...CONTAINED], RELATIONAL);

        expect(result.success).toBe(true);
        expect(result.warnings).toEqual([]);

        const columns = result.targetModel!.instances.get('Column')!;
        expect(columns).toHaveLength(3);
        expect(columns.map(c => c.name)).toEqual(['ssn', 'age', 'vat']);
        expect(columns.map(c => c.isPrimaryKey)).toEqual([true, false, true]);
    });

    it('parent resolves to the containing object for a contained instance', async () => {
        const result = await execute(parseJjtl(`
            transformation ER2Rel
            from ERD
            to Relational

            Attribute -> Column {
                name := parent.name + "." + name
            }
        `), [...ROOTS, ...CONTAINED], RELATIONAL);

        expect(result.success).toBe(true);
        const columns = result.targetModel!.instances.get('Column')!;
        expect(columns.map(c => c.name)).toEqual(['Person.ssn', 'Person.age', 'Company.vat']);
    });

    it('a root instance has no parent: the binding stays empty, nothing throws', async () => {
        const result = await execute(parseJjtl(`
            transformation ER2Rel
            from ERD
            to Relational

            Entity -> Table {
                name := name
            }
        `), [...ROOTS, ...CONTAINED], RELATIONAL);

        expect(result.success).toBe(true);
        const tables = result.targetModel!.instances.get('Table')!;
        expect(tables.map(t => t.name)).toEqual(['Person', 'Company']);
    });
});
