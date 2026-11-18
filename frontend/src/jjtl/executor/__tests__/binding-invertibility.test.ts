import { describe, it, expect, vi } from 'vitest';

/**
 * Per-binding invertibility (SPEC §5.4) is one answer on both parse paths
 * (jjodel-lanes #897, P-2026-11-13-1245).
 *
 * With the source text, what the app hook passes, the parser wraps every `:=`
 * expression as a `JjelExpression`; `isExpressionInvertible` had no case for it,
 * so every binding of the app was traced as not invertible, `name := name`
 * included, while the legacy path (no source text) answered as the table says.
 * The legacy column is the expected answer; the cases that must stay false are
 * the negative control.
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

const SOURCE = `transformation T
from SimpleUML
to SimpleRDBMS

Package -> Schema {
    name := name
    label := name + "_s"
    pre := "p_" + name
    lit := "x"
    up := name.toUpper()
    cond := if name == "a" then "b" else "c"
}

Class -> Table where isPersistent {
    name := name
    schema := package
    pkgName := package.name
}
`;

const cls = (name: string, attributes: string[], references: any[] = []) => {
    const attrs = attributes.map(a => ({ name: a }));
    return { className: 'DClass', name, attributes: attrs, allAttributes: attrs, references, allReferences: references };
};
const RDBMS = {
    classes: [
        cls('Schema', ['name', 'label', 'pre', 'lit', 'up', 'cond'], [{ name: 'tables', composition: true, type: { name: 'Table' } }]),
        cls('Table', ['name', 'pkgName'], [{ name: 'schema', composition: false, type: { name: 'Schema' } }]),
    ],
};
const el = (id: string, className: string, extra: Record<string, any> = {}) => ({ id, name: id, className, __type: className, ...extra });
const APP = [
    el('App', 'Package', { classes: [{ __ref: 'Customer' }] }),
    el('Customer', 'Class', { isPersistent: true, package: { __ref: 'App' }, _containerId: 'App' }),
];

async function bindings(withSource: boolean): Promise<Map<string, { invertible: boolean; inverseExpression?: string }>> {
    const { tokens } = new JjtlLexer(SOURCE).tokenize();
    const { ast, errors } = new JjtlParser(tokens, withSource ? SOURCE : undefined).parse();
    expect(errors).toEqual([]);
    const result = await execute(ast!, APP, RDBMS);
    expect(result.errors).toEqual([]);
    const out = new Map<string, { invertible: boolean; inverseExpression?: string }>();
    for (const link of result.traceModel!.links) {
        for (const b of link.bindings) {
            out.set(`${link.rule}.${b.targetAttribute}`, { invertible: b.invertible, inverseExpression: b.inverseExpression });
        }
    }
    return out;
}

describe.each(PATHS)('binding invertibility, %s', (_label, withSource) => {
    it('a property reference is invertible: name := name, schema := package, package.name', async () => {
        const b = await bindings(withSource);
        expect(b.get('Package -> Schema.name')).toEqual({ invertible: true, inverseExpression: undefined });
        expect(b.get('Class -> Table.name')).toEqual({ invertible: true, inverseExpression: undefined });
        expect(b.get('Class -> Table.schema')).toEqual({ invertible: true, inverseExpression: undefined });
        expect(b.get('Class -> Table.pkgName')).toEqual({ invertible: true, inverseExpression: undefined });
    });

    it('a concatenation with one literal is invertible, with its substring inverse', async () => {
        const b = await bindings(withSource);
        expect(b.get('Package -> Schema.label')).toEqual({
            invertible: true, inverseExpression: 'label.substring(0, label.length - 2)',
        });
        expect(b.get('Package -> Schema.pre')).toEqual({ invertible: true, inverseExpression: 'pre.substring(2)' });
    });

    it('a literal is invertible, as the code answers (the SPEC table says no: ticket)', async () => {
        const b = await bindings(withSource);
        expect(b.get('Package -> Schema.lit')).toEqual({ invertible: true, inverseExpression: undefined });
    });

    it('a method call and a conditional stay not invertible', async () => {
        const b = await bindings(withSource);
        expect(b.get('Package -> Schema.up')).toEqual({ invertible: false, inverseExpression: undefined });
        expect(b.get('Package -> Schema.cond')).toEqual({ invertible: false, inverseExpression: undefined });
    });
});

it('both parse paths give the same answer for every binding', async () => {
    const app = await bindings(true);
    const legacy = await bindings(false);
    expect(app.size).toBe(9);
    expect([...app.entries()]).toEqual([...legacy.entries()]);
});
