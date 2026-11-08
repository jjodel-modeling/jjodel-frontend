import { describe, it, expect, vi } from 'vitest';

/**
 * Several source models of one metamodel (R-JTG-26, slice S3).
 *
 * The source may be a list of models, each an array of objects: an array whose
 * items are all arrays. Their objects are united before pass 1, so rules, the
 * trace and `data` see one set. A single model is unchanged.
 *
 * The `joiner` barrel is mocked as in contained-sources.test.ts: `executor.ts`
 * imports it for `U.asNumber` alone.
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
        cls('Schema', ['name'], [{ name: 'tables', composition: true, type: { name: 'Table' } }]),
        cls('Table', ['name'], [{ name: 'fk', composition: false, type: { name: 'Table' } }]),
    ],
};

const entity = (id: string, name: string, other?: string) => ({
    id, name, className: 'Entity', __type: 'Entity',
    ...(other ? { other: { __ref: other } } : {}),
});

// The package and e1 in one model, e2 in the other; each entity points at the other model.
const pkg = { id: 'P1', name: 'pkg', className: 'Pkg', __type: 'Pkg', entities: [{ __ref: 'E1' }, { __ref: 'E2' }] };
const MODEL_A = [pkg, entity('E1', 'e1', 'E2')];
const MODEL_B = [entity('E2', 'e2', 'E1')];

function parseJjtl(body: string, withSource: boolean): TransformationAST {
    const text = 'transformation T\nfrom S\nto Tg\n\n' + body.trim();
    const { tokens, errors: lexErrors } = new JjtlLexer(text).tokenize();
    expect(lexErrors).toEqual([]);
    const { ast, errors } = new JjtlParser(tokens, withSource ? text : undefined).parse();
    expect(errors).toEqual([]);
    return ast!;
}

const tablesOf = (result: any): any[] => result.targetModel.instances.get('Table') ?? [];
const names = (objects: any[]): string[] => objects.map(o => o.name);

describe.each([
    ['legacy parser (no source)', false],
    ['JjEL delegation (source)', true],
])('several source models: %s', (_label, withSource) => {
    const run = (body: string, source: any) => execute(parseJjtl(body, withSource), source, TARGET);

    it('a rule matches the objects of the second model', async () => {
        const result = await run('Entity e -> Table {\n    name := name\n}', [MODEL_A, MODEL_B]);

        expect(result.errors).toEqual([]);
        expect(result.success).toBe(true);
        expect(names(tablesOf(result))).toEqual(['e1', 'e2']);
    });

    it('a reference from one model to another resolves through the trace, both ways', async () => {
        const result = await run('Entity e -> Table {\n    name := name\n    fk := other\n}', [MODEL_A, MODEL_B]);

        expect(result.errors).toEqual([]);
        expect(result.warnings).toEqual([]);
        const [e1, e2] = tablesOf(result);
        expect(e1.fk.targets[0]).toBe(e2);
        expect(e2.fk.targets[0]).toBe(e1);
    });

    it('resolve() sees the union', async () => {
        const result = await run('Entity e -> Table {\n    name := name\n    fk := resolve(other)\n}', [MODEL_A, MODEL_B]);

        expect(result.errors).toEqual([]);
        const [e1, e2] = tablesOf(result);
        expect(e1.fk.targets[0]).toBe(e2);
        expect(e2.fk.targets[0]).toBe(e1);
    });

    it('a target of the first model is contained by references into the second, and only the container is a root', async () => {
        const result = await run(
            'Pkg p -> Schema {\n    name := name\n    tables := entities\n}\n\nEntity e -> Table {\n    name := name\n}',
            [MODEL_A, MODEL_B],
        );

        expect(result.errors).toEqual([]);
        expect(names(result.targetModel!.roots)).toEqual(['pkg']);
        expect(names(result.targetModel!.roots[0].tables)).toEqual(['e1', 'e2']);
    });

    it('data is the union, in the order of the list', async () => {
        const result = await run(
            'Pkg p -> Schema {\n    name := data.map(x => x.name)\n}',
            [MODEL_A, MODEL_B],
        );

        expect(result.errors).toEqual([]);
        expect(result.targetModel!.roots[0].name).toEqual(['pkg', 'e1', 'e2']);
    });

    it('the list gives what the concatenated single model gives', async () => {
        const body = 'Pkg p -> Schema {\n    name := name\n    tables := entities\n}\n\nEntity e -> Table {\n    name := name\n    fk := other\n}';
        const listed = await run(body, [MODEL_A, MODEL_B]);
        const single = await run(body, [...MODEL_A, ...MODEL_B]);

        expect(listed.success).toBe(true);
        expect(names(listed.targetModel!.roots)).toEqual(names(single.targetModel!.roots));
        expect(names(tablesOf(listed))).toEqual(names(tablesOf(single)));
        expect(listed.stats!.sourceInstancesProcessed).toBe(single.stats!.sourceInstancesProcessed);
        expect(listed.warnings).toEqual(single.warnings);
    });

    it('roots without containment are every target, as with one model', async () => {
        const result = await run('Entity e -> Table {\n    name := name\n}', [MODEL_A, MODEL_B]);

        expect(names(result.targetModel!.roots)).toEqual(['e1', 'e2']);
    });

    it('two models sharing an id stop the run, naming the id and the models', async () => {
        const result = await run('Entity e -> Table {\n    name := name\n}', [
            [entity('E1', 'first')],
            [entity('E9', 'other')],
            [entity('E1', 'second')],
        ]);

        expect(result.success).toBe(false);
        expect(result.targetModel).toBeUndefined();
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toContain("'E1' (models 1 and 3)");
    });

    it('the same model listed twice is a shared id', async () => {
        const result = await run('Entity e -> Table {\n    name := name\n}', [MODEL_B, MODEL_B]);

        expect(result.success).toBe(false);
        expect(result.errors[0]).toContain("'E2' (models 1 and 2)");
    });

    it('many shared ids are named up to five and counted', async () => {
        const many = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map(id => entity(id, id));
        const result = await run('Entity e -> Table {\n    name := name\n}', [many, many]);

        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toContain('7 ids');
        expect(result.errors[0]).toContain("'e' (models 1 and 2)");
        expect(result.errors[0]).not.toContain("'f'");
        expect(result.errors[0]).toContain('and 2 more');
    });

    it('objects without an id do not clash across models', async () => {
        const anon = (name: string) => ({ name, className: 'Entity', __type: 'Entity' });
        const result = await run('Entity e -> Table {\n    name := name\n}', [[anon('x')], [anon('y')]]);

        expect(result.errors).toEqual([]);
        expect(names(tablesOf(result))).toEqual(['x', 'y']);
    });

    it('a repeated id inside one model of the list is not a clash, as in a single model', async () => {
        const result = await run('Entity e -> Table {\n    name := name\n}', [
            [entity('E1', 'first'), entity('E1', 'again')],
            [entity('E2', 'other')],
        ]);

        expect(result.errors).toEqual([]);
        expect(result.success).toBe(true);
    });

    it('a list of one model is that model', async () => {
        const body = 'Entity e -> Table {\n    name := name\n}';
        const listed = await run(body, [MODEL_A]);
        const single = await run(body, MODEL_A);

        expect(names(tablesOf(listed))).toEqual(names(tablesOf(single)));
        expect(listed.warnings).toEqual(single.warnings);
    });

    it('an array mixing objects and arrays stays a single model', async () => {
        const result = await run('Entity e -> Table {\n    name := name\n}', [entity('E1', 'e1'), [entity('E2', 'e2')]]);

        expect(names(tablesOf(result))).toEqual(['e1']);
    });

    it('a list does not change the arrays it was given', async () => {
        const a = [entity('E1', 'e1', 'E2')];
        const b = [entity('E2', 'e2', 'E1')];
        const before = JSON.stringify([a, b]);

        await run('Entity e -> Table {\n    name := name\n    fk := other\n}', [a, b]);

        expect(JSON.stringify([a, b])).toBe(before);
    });
});
