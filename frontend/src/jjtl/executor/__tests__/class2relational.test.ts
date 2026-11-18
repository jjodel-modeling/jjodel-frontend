import { describe, it, expect, vi } from 'vitest';

/**
 * Class2Relational, a non-hardware acceptance case (P-2026-11-03-1434).
 *
 * Fixture: `../../__tests__/fixtures/class2relational.ts`: the two metamodels, a source model
 * with every case, the transformation as first written (NATURAL) and the version that runs
 * (WORKAROUND), each difference with its reason, and the matched-rule form of the keys
 * (MATCHED_KEYS), the text that ran before a `let` held its value (P-2026-11-03-2111). Report:
 * `docs/discovery/discovery_2026-11-03_jjtl_class2relational.md`.
 *
 * Runs on the JjEL parse path (with the source text), the one the app takes. The `joiner`
 * barrel is mocked as in resolution-fallbacks.test.ts; the lexer, parser and executor run
 * unstubbed.
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
import {
    NATURAL, WORKAROUND, WORKAROUNDS, MATCHED_KEYS, MATCHED_KEY_EDITS, applyEdits, RELATIONAL, SHOP, EXPECTED_SCHEMA,
} from '../../__tests__/fixtures/class2relational';

function parse(text: string) {
    const { tokens, errors: lexErrors } = new JjtlLexer(text).tokenize();
    expect(lexErrors).toEqual([]);
    return new JjtlParser(tokens, text).parse();
}

async function run(text: string) {
    const { ast, errors } = parse(text);
    expect(errors).toEqual([]);
    return execute(ast!, SHOP, RELATIONAL);
}

const ptr = (v: any): any[] => (v && v.__ref_result ? v.targets : Array.isArray(v) ? v : v == null ? [] : [v]);
const nameOf = (x: any) => (x && typeof x === 'object' ? x.name ?? '?' : String(x));

/**
 * The output as text, in the shape of EXPECTED_SCHEMA. A key or foreign-key column that is
 * not, by identity, a column of its own table is marked; so is a root other than the schema.
 */
function render(result: any): string[] {
    const roots: any[] = result.targetModel?.roots ?? [];
    const out: string[] = [];
    const one = (v: any) => ptr(v).map(nameOf).join('/') || 'null';
    for (const s of roots.filter(r => r.className === 'Schema')) {
        out.push(`schema ${s.name}`);
        out.push(`types ${ptr(s.types).map(nameOf).join(', ')}`);
        for (const t of ptr(s.tables)) {
            const own = (k: any) => (ptr(t.columns).includes(k) ? nameOf(k) : nameOf(k) + '(not a column of the table)');
            let line = `table ${t.name}: ${ptr(t.columns).map((c: any) => `${c.name}:${one(c.type)}`).join(', ')}`;
            line += ` | key ${ptr(t.key).map(own).join(', ')}`;
            for (const fk of ptr(t.foreignKeys)) line += ` | ${fk.name}(${ptr(fk.column).map(own).join('/') || 'null'} -> ${one(fk.refersTo)})`;
            out.push(line);
        }
    }
    for (const r of roots.filter(r => r.className !== 'Schema')) out.push(`root ${r.className} ${nameOf(r)}`);
    return out;
}

/** NATURAL with the workarounds before index `n` applied, as WORKAROUND applies them all. */
const partly = (n: number): string => applyEdits(NATURAL, WORKAROUNDS.slice(0, n));
const firstOf = (tag: string) => WORKAROUNDS.findIndex(w => w.why.startsWith(tag));
const firstKeyEdit = (tag: string) => MATCHED_KEY_EDITS.findIndex(w => w.why.startsWith(tag));

/** WORKAROUND with each use of `$id` written as a call of idColumn, and the let gone. */
const ID_CALLED_THRICE = WORKAROUND
    .replace('    let $id = idColumn(c) in {\n        columns := [$id]', '    columns := [idColumn(c)]')
    .replace('        key := [$id]\n', '    key := [idColumn(c)]\n')
    .replace('        foreignKeys := c.attributes', '    foreignKeys := c.attributes')
    .replace('[superFk(c, $id)])\n    }\n}', '[superFk(c, idColumn(c))])\n}');

describe('Class2Relational', () => {
    it('builds the expected schema: tables, columns, keys, foreign keys and join tables', async () => {
        const result = await run(WORKAROUND);
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
        expect(result.success).toBe(true);
        expect(render(result)).toEqual(EXPECTED_SCHEMA);
    });

    it('shares targets by identity: types, key columns and the tables a foreign key refers to', async () => {
        const result = await run(WORKAROUND);
        const [schema] = result.targetModel!.roots as any[];
        expect(result.targetModel!.roots).toHaveLength(1);
        const tables = ptr(schema.tables);
        const types = ptr(schema.types);
        const table = (n: string) => tables.find((t: any) => t.name === n);
        // Every column type is one of the schema's types, not a copy.
        for (const t of tables) for (const c of ptr(t.columns)) expect(types).toContain(ptr(c.type)[0]);
        // The key is the table's first column, the same object.
        for (const t of tables) expect(ptr(t.key)[0]).toBe(ptr(t.columns)[0]);
        // Foreign keys point at the placed tables.
        const customer = table('Customer');
        expect(ptr(ptr(customer.foreignKeys)[0].refersTo)[0]).toBe(table('Named'));
        expect(ptr(ptr(table('Order').foreignKeys)[0].refersTo)[0]).toBe(customer);
        expect(ptr(ptr(table('Order').foreignKeys)[0].column)[0]).toBe(ptr(table('Order').columns)[2]);
        // Counts: 6 tables, 14 columns, 3 foreign keys, 3 types, 1 schema.
        const inst = result.targetModel!.instances;
        expect(['Schema', 'Table', 'Column', 'ForeignKey', 'Type'].map(c => inst.get(c)?.length ?? 0)).toEqual([1, 6, 14, 3, 3]);
    });

    it('records each workaround against a passage of the natural text', () => {
        expect(WORKAROUND).not.toEqual(NATURAL);
        for (const tag of ['W1', 'W2', 'W3', 'W4']) expect(firstOf(tag)).toBeGreaterThanOrEqual(0);
        for (const tag of ['W5', 'W6']) expect(firstOf(tag)).toBe(-1);
        expect(WORKAROUNDS).toHaveLength(10);
        // The natural keys: the let stays, no resolve() is written.
        expect(WORKAROUND).toContain('let $id = idColumn(c) in {');
        expect(WORKAROUND).not.toContain('resolve(');
    });

    it('the matched-rule form of the keys builds the same schema', async () => {
        const result = await run(MATCHED_KEYS);
        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
        expect(render(result)).toEqual(EXPECTED_SCHEMA);
    });

    // -----------------------------------------------------------------------
    // What the natural version meets, each pinned just before the workaround that answers it.

    it('W1: a binding continued on the next line is a parse error', () => {
        const { errors } = parse(NATURAL);
        expect(errors.map((e: any) => `${e.line}:${e.column} ${e.message}`)).toEqual(['23:13 Expected source attribute name']);
    });

    it('W2, W3: `x.parent` is null for an element other than the rule\'s own', async () => {
        const result = await run(partly(firstOf('W2')));
        expect(result.success).toBe(true);
        expect(new Set(result.warnings)).toEqual(new Set([
            "Expression evaluation failed (JjelExpression): Cannot access property 'types' of null",
            "Expression evaluation failed (JjelExpression): Cannot access property 'name' of null",
        ]));
        // The join tables lose their name, their owner column's name and every Integer type. The
        // key is the table's own owner column (#515); before P-2026-11-03-2111 it was a second one.
        expect(render(result).filter(l => l.startsWith('table null'))).toEqual([
            'table null: null:null, phones:String | key ?',
            'table null: null:null, itemsId:null | key ?',
        ]);
    });

    it('#515: a let holds its value: $id used three times is one column, the table\'s own, and nothing is left at the root', async () => {
        const result = await run(WORKAROUND);
        expect(result.errors).toEqual([]);
        expect(result.targetModel!.roots.map((r: any) => r.className)).toEqual(['Schema']);
        const tables = ptr((result.targetModel!.roots[0] as any).tables);
        const customer = tables.find((t: any) => t.name === 'Customer');
        const id = ptr(customer.columns)[0];
        expect(id.name).toBe('id');
        expect(ptr(customer.key)).toEqual([id]);
        expect(ptr(ptr(customer.foreignKeys)[0].column)[0]).toBe(id);
        // The owner column of a join table, bound by `let $owner`, is its key by identity too.
        const phones = tables.find((t: any) => t.name === 'Customer_phones');
        expect(ptr(phones.key)[0]).toBe(ptr(phones.columns)[0]);
        expect(result.targetModel!.instances.get('Column')).toHaveLength(14);
    });

    it('W6: a bare type name in a nested resolve() is evaluated, so the call reports the ambiguity it settles', async () => {
        const result = await run(applyEdits(WORKAROUND, MATCHED_KEY_EDITS.slice(0, firstKeyEdit('W6'))));
        expect(result.success).toBe(false);
        expect(result.errors[0]).toMatch(/Ambiguous cross-type resolution .* source id 'cNamed' has targets from 2 rules \(Table, Column\)\. Use resolve\(expr, TargetType\) to disambiguate\./);
    });

    it('resolve(x, "T") finds the rule to T that matched x, when several rules map its class to T', async () => {
        // The join tables' owner columns: Attribute has three rules to Column, the third matching
        // only multi-valued attributes. Before P-2026-11-03-1434 the first rule to Column was
        // chosen and its missing trace entry threw "Unresolved reference".
        const result = await run(MATCHED_KEYS);
        expect(result.errors).toEqual([]);
        expect(render(result).slice(-2)).toEqual(EXPECTED_SCHEMA.slice(-2));
    });

    // -----------------------------------------------------------------------
    // Neighbouring forms.

    it('a unique lazy DataType rule gives the same schema: placed by the schema, pointed at by the columns', async () => {
        const result = await run(WORKAROUND.replace('DataType -> Type {', 'unique lazy DataType -> Type {'));
        expect(result.errors).toEqual([]);
        expect(render(result)).toEqual(EXPECTED_SCHEMA);
    });

    it('unique rule idColumn(c): three calls with the same argument return one column, placed once', async () => {
        const result = await run(ID_CALLED_THRICE.replace('rule idColumn(c)', 'unique rule idColumn(c)'));
        expect(result.errors).toEqual([]);
        expect(render(result)).toEqual(EXPECTED_SCHEMA);
        expect(result.targetModel!.roots).toHaveLength(1);
    });

    it('without unique the same three calls create three columns: a called rule is fresh per call (R-JTG-6)', async () => {
        const result = await run(ID_CALLED_THRICE);
        expect(result.errors).toEqual([]);
        expect(render(result)).toContain('table Customer: id:Integer, email:String, vip:Boolean | key id(not a column of the table)'
            + ' | fk_Customer_super(id(not a column of the table) -> Named)');
        // 10 calls on 4 classes (2 each, 3 with a superclass), one placed per table: 6 left at the root.
        expect(render(result).filter(l => l.startsWith('root Column'))).toEqual(Array(6).fill('root Column id'));
    });

    it('a unique lazy rule on Class beside the matched one builds the same schema, reached through features typed Column', async () => {
        // The lazy rule does not compete in pass 1 (P-2026-11-04-0015). resolve() finds matched
        // targets only (R-JTG-13), so the key column is reached as `c` where a Column is expected.
        const text = MATCHED_KEYS
            .replace('-- The key column of a class\'s table.\nClass c -> Column {', 'unique lazy Class c -> Column {')
            .replace(/resolve\(c, "?Column"?\)/g, 'c');
        const result = await run(text);
        expect(result.errors).toEqual([]);
        expect(render(result)).toEqual(EXPECTED_SCHEMA);
        expect(result.targetModel!.roots).toHaveLength(1);
    });

    it('#445: a binding to a feature the target class does not declare is warned with rule, line and column', async () => {
        const text = WORKAROUND.replace('    name := a.name\n    type := a.type\n', '    name := a.name\n    type := a.type\n    nullable := false\n');
        const result = await run(text);
        expect(result.success).toBe(true);
        expect(result.warnings).toEqual([
            "Rule 'Attribute -> Column', binding 'nullable' at line 29, column 5: 'nullable' is not a feature of target class 'Column'; "
            + 'the value is not written to the model.',
        ]);
    });
});
