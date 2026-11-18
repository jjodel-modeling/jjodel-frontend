import { describe, it, expect, vi } from 'vitest';

/**
 * Several creation blocks on one feature of one rule (jjodel-lanes #898,
 * P-2026-11-13-1245, GO of 2026-11-13).
 *
 * `afterPlacedTargets` kept only the rule targets a binding had placed, so a
 * second `-> cols { ... }` dropped what the first one had created: the key
 * column of the book's UML to RDBMS listing was lost. A `:=` binding already
 * kept them (`placeInContainer`, SPEC.md §5.3.2 "Assignment").
 *
 * Now the blocks accumulate, in the order written, when the feature is
 * multi-valued (`upperBound` -1 or above 1) or its multiplicity is unknown; on a
 * feature known single-valued the last object stays and a warning says so.
 *
 * The joiner barrel is mocked (see contained-sources.test.ts for why).
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

const PATHS = [['app path (source text)', true], ['legacy path', false]] as const;

function parse(text: string, withSource: boolean) {
    const { tokens } = new JjtlLexer(text).tokenize();
    const { ast, errors } = new JjtlParser(tokens, withSource ? text : undefined).parse();
    expect(errors).toEqual([]);
    return ast!;
}

const cls = (name: string, attributes: string[], references: any[] = []) => {
    const attrs = attributes.map(a => ({ name: a }));
    return { className: 'DClass', name, attributes: attrs, allAttributes: attrs, references, allReferences: references };
};
/** SimpleRDBMS with the opposites; `upperBound` of `cols` and `pkey` as given, absent when undefined. */
const RDBMS = (colsUpper?: number, pkeyUpper?: number) => {
    const bound = (u?: number) => (u === undefined ? {} : { upperBound: u });
    return {
        classes: [
            cls('Schema', ['name'], [{ name: 'tables', composition: true, type: { name: 'Table' } }]),
            cls('Table', ['name'], [
                { name: 'cols', composition: true, type: { name: 'Column' }, ...bound(colsUpper) },
                { name: 'pkey', composition: false, type: { name: 'Column' }, ...bound(pkeyUpper) },
                { name: 'schema', composition: false, type: { name: 'Schema' } },
            ]),
            cls('Column', ['name', 'type'], [{ name: 'table', composition: false, type: { name: 'Table' } }]),
        ],
    };
};

/** The sample model of the book's Ch4: package App, Customer (persistent; name, age), Address. */
const ref = (id: string) => ({ __ref: id });
const el = (id: string, className: string, extra: Record<string, any> = {}) => ({ id, name: id, className, __type: className, ...extra });
const APP = [
    el('App', 'Package', { classes: [ref('Customer'), ref('Address')] }),
    el('String', 'PrimitiveDataType'), el('Integer', 'PrimitiveDataType'),
    el('Customer', 'Class', { isPersistent: true, package: ref('App'), attrs: [ref('a_name'), ref('a_age')], _containerId: 'App' }),
    el('Address', 'Class', { isPersistent: false, package: ref('App'), attrs: [], _containerId: 'App' }),
    { ...el('a_name', 'Attribute', { type: ref('String'), owner: ref('Customer'), _containerId: 'Customer' }), name: 'name' },
    { ...el('a_age', 'Attribute', { type: ref('Integer'), owner: ref('Customer'), _containerId: 'Customer' }), name: 'age' },
];

const HEAD = 'transformation UmlToRdbms\n\nfrom SimpleUML\nto   SimpleRDBMS\n\n';
const HELPER = '\nhelper convertType(t: PrimitiveDataType) -> String {\n    if t.name == "String" then "VARCHAR" else "NUMBER"\n}\n';

/** `lst:jjtl-uml2rdbms` of the Jjodel book, verbatim (author/tools/codegen-fixture/uml2rdbms-as-printed.jjtl). */
const UML2RDBMS = `transformation UmlToRdbms

from SimpleUML
to   SimpleRDBMS

# Mapping 1: Package to Schema
Package -> Schema {
    name := name
}

# Mapping 2: Persistent Class to Table
Class -> Table where isPersistent {
    name   := name
    schema := package          -- resolved via the trace

    # Generated primary-key column
    -> cols {
        -> Column {
            name := name + "_tid"
            type := "NUMBER"
        }
    }

    # Columns from the attributes of the class
    -> cols {
        forall a in attrs
        -> Column {
            name := a.name
            type := convertType(a.type)
        }
    }
}

helper convertType(t: PrimitiveDataType) -> String {
    if t.name == "String" then "VARCHAR" else "NUMBER"
}`;

/** `lst:jjtl-called-lazy` of the book, verbatim, under mapping 1 and the helper of the listing above. */
const CALLED_LAZY = `${HEAD}Package -> Schema {
    name := name
}

Class -> Table where isPersistent {
    name   := name
    schema := package
    let $pk = keyColumn(self) in {
        cols := [$pk] + attrs
        pkey := $pk
    }
}

rule keyColumn(c) -> Column {
    name := c.name + "_tid"
    type := "NUMBER"
}

lazy Attribute -> Column {
    name := name
    type := convertType(type)
}
${HELPER}`;

const block = (feature: string, name: string) =>
    `    -> ${feature} {\n        -> Column {\n            name := ${name}\n        }\n    }\n`;
const forall = (suffix: string) =>
    `    -> cols {\n        forall a in attrs\n        -> Column {\n            name := a.name${suffix}\n        }\n    }\n`;
const rule = (body: string) => `${HEAD}Class -> Table where isPersistent {\n    name := name\n${body}}\n`;

const names = (v: any): any => (Array.isArray(v) ? v.map(names) : v && typeof v === 'object' ? v.name : v);

async function table(text: string, withSource: boolean, mm: any) {
    const result = await execute(parse(text, withSource), APP, mm);
    expect(result.errors).toEqual([]);
    const tables = result.targetModel!.instances.get('Table')!;
    expect(tables).toHaveLength(1);
    return { result, table: tables[0] };
}

const MULTIPLICITIES = [['multi-valued (upperBound -1)', -1], ['multiplicity unknown', undefined]] as const;

describe.each(PATHS)('creation blocks on one feature, %s', (_label, withSource) => {
    describe.each(MULTIPLICITIES)('cols %s', (_m, upper) => {
        const mm = RDBMS(upper);

        it('single then single: both objects, in the order written', async () => {
            const { result, table: t } = await table(rule(block('cols', 'name + "_tid"') + block('cols', 'name + "_k2"')), withSource, mm);
            expect(names(t.cols)).toEqual(['Customer_tid', 'Customer_k2']);
            expect(result.warnings).toEqual([]);
        });

        it('single then forall (the book\'s shape): the key column first', async () => {
            const { result, table: t } = await table(rule(block('cols', 'name + "_tid"') + forall('')), withSource, mm);
            expect(names(t.cols)).toEqual(['Customer_tid', 'name', 'age']);
            expect(result.warnings).toEqual([]);
        });

        it('forall then single: the key column last', async () => {
            const { table: t } = await table(rule(forall('') + block('cols', 'name + "_tid"')), withSource, mm);
            expect(names(t.cols)).toEqual(['name', 'age', 'Customer_tid']);
        });

        it('forall then forall', async () => {
            const { table: t } = await table(rule(forall('') + forall(' + "_2"')), withSource, mm);
            expect(names(t.cols)).toEqual(['name', 'age', 'name_2', 'age_2']);
        });

        it('one block alone is one object, as before', async () => {
            const { table: t } = await table(rule(block('cols', 'name + "_tid"')), withSource, mm);
            expect(names(t.cols)).toBe('Customer_tid');
        });
    });

    it('on a feature known single-valued (upperBound 1) the last object stays, with a warning', async () => {
        const { result, table: t } = await table(rule(block('pkey', '"pk1"') + block('pkey', '"pk2"')), withSource, RDBMS(-1, 1));
        expect(names(t.pkey)).toBe('pk2');
        expect(result.warnings).toEqual([
            "Feature 'pkey' of 'Table' holds one object: a second '-> pkey { ... }' replaced the object created " +
            'by an earlier block.',
        ]);
    });

    it('the book\'s lst:jjtl-uml2rdbms keeps the key column in cols; pkey stays unset, as its remark says', async () => {
        const { result, table: t } = await table(UML2RDBMS, withSource, RDBMS(-1, 1));
        expect(names(t.cols)).toEqual(['Customer_tid', 'name', 'age']);
        expect(t.cols.map((c: any) => c.type)).toEqual(['NUMBER', 'VARCHAR', 'NUMBER']);
        expect(t.pkey).toBeUndefined();
        expect(result.warnings).toEqual([]);
        expect(result.targetModel!.roots.map((o: any) => o.__type)).toEqual(['Schema', 'Table']);
    });

    it('the book\'s lst:jjtl-called-lazy has the key column in cols and in pkey (unchanged)', async () => {
        const { result, table: t } = await table(CALLED_LAZY, withSource, RDBMS(-1, 1));
        expect(names(t.cols)).toEqual(['Customer_tid', 'name', 'age']);
        const pkey = t.pkey?.__ref_result ? t.pkey.targets[0] : t.pkey;
        expect(pkey).toBe(t.cols[0]);
        expect(result.warnings).toEqual([]);
    });
});
