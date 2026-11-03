import { describe, it, expect, vi } from 'vitest';

/**
 * Four JjTL language points decided by Alfonso on 2026-11-03 (P-2026-11-04-0015):
 * a rule on a class the target metamodel lacks is an error and nothing is written;
 * `[*]` warns that its count is not settled, and keeps what it does; a lazy rule
 * beside a matched rule on one class does not compete in pass 1 (R-JTG-3); the
 * `such that` of a forall sees the element's bare names, as the body does.
 *
 * `joiner` is mocked as in spec12-known-bugs.test.ts; the executor runs unstubbed.
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

const PATHS = [
    ['legacy parser (no source)', false],
    ['JjEL parser (source)', true],
] as const;

const HEAD = 'transformation T\nfrom S\nto Tg\n\n';

function parse(text: string, withSource: boolean) {
    const { tokens } = new JjtlLexer(text).tokenize();
    const { ast, errors } = new JjtlParser(tokens, withSource ? text : undefined).parse();
    expect(errors).toEqual([]);
    return ast!;
}

function cls(name: string, attributes: string[], references: any[] = [], supers: string[] = []) {
    const attrs = attributes.map(a => ({ name: a }));
    const superclasses = supers.map(s => ({ name: s }));
    return {
        className: 'DClass', name,
        attributes: attrs, allAttributes: attrs,
        references, allReferences: references,
        superclasses, allSuperClasses: superclasses,
    };
}
const contains = (name: string, type: string) => ({ name, composition: true, type: { name: type } });
const el = (id: string, className: string, extra: Record<string, any> = {}) =>
    ({ id, name: id, className, __type: className, ...extra });
const ref = (id: string) => ({ __ref: id });
const ptr = (v: any): any[] => (Array.isArray(v) ? v : v == null ? [] : [v]);

describe('a rule whose target class is not in the target metamodel', () => {
    it.each(PATHS)('is an error naming the rule and the class, and nothing is written — %s', async (_l, withSource) => {
        const ast = parse(HEAD + 'A -> B {\n    name := name\n}\n\nA -> Nope {\n    name := name\n}', withSource);
        const result = await execute(ast, [el('a0', 'A')], { classes: [cls('B', ['name'])] });
        expect(result.success).toBe(false);
        expect(result.targetModel).toBeUndefined();
        expect(result.errors).toEqual([
            "Target class 'Nope' not found in target metamodel (A -> Nope). Nothing is written.",
        ]);
    });
});

describe('multiplicity [*]', () => {
    it.each(PATHS)('warns once per rule that the count is not settled, and still creates one per source — %s', async (_l, withSource) => {
        const target = { classes: [cls('B', ['name'])] };
        const sources = [el('a0', 'A'), el('a1', 'A')];
        const star = await execute(parse(HEAD + 'A -> B[*] {\n    name := name\n}', withSource), sources, target);
        expect(star.success).toBe(true);
        expect(star.targetModel!.instances.get('B')!.length).toBe(2);
        expect(star.warnings).toEqual([
            "Rule 'A -> B': the number of targets of '[*]' is not settled; today one target is created per source.",
        ]);
        const three = await execute(parse(HEAD + 'A -> B[3] {\n    name := name\n}', withSource), sources, target);
        expect(three.targetModel!.instances.get('B')!.length).toBe(6);
        expect(three.warnings).toEqual([]);
    });
});

describe('a lazy rule beside a matched rule on one class', () => {
    const target = {
        classes: [
            cls('Named', ['name']),
            cls('Schema', [], [contains('tables', 'Table'), contains('keys', 'Key'), contains('all', 'Named')]),
            cls('Table', ['name'], [], ['Named']),
            cls('Key', ['name'], [], ['Named']),
        ],
    };
    const source = () => [
        el('p', 'Pkg', { classes: [ref('c1'), ref('c2')] }),
        el('c1', 'Cls', { _containerId: 'p' }),
        el('c2', 'Cls', { _containerId: 'p' }),
    ];
    const RULES = 'Pkg -> Schema {\n    tables := classes\n    keys := classes\n}\n\n'
        + 'Cls -> Table {\n    name := name\n}\n\n'
        + 'unique lazy Cls -> Key {\n    name := name + "_key"\n}';

    it.each(PATHS)('does not compete in pass 1: the feature type selects the lazy or the matched target — %s', async (_l, withSource) => {
        const result = await execute(parse(HEAD + RULES, withSource), source(), target);
        expect(result.errors).toEqual([]);
        expect(result.success).toBe(true);
        const [schema] = result.targetModel!.roots as any[];
        expect(result.targetModel!.roots).toHaveLength(1);
        // tables: the pass 1 targets of the matched rule, by identity.
        expect(ptr(schema.tables)).toEqual(result.targetModel!.instances.get('Table'));
        expect(ptr(schema.tables).map((t: any) => t.name)).toEqual(['c1', 'c2']);
        // keys: the lazy rule, applied on reach.
        expect(ptr(schema.keys).map((k: any) => [k.className, k.name])).toEqual([['Key', 'c1_key'], ['Key', 'c2_key']]);
    });

    it.each(PATHS)('a feature whose type fits both is an error naming both rules — %s', async (_l, withSource) => {
        const text = HEAD + RULES.replace('    keys := classes\n', '    keys := classes\n    all := classes\n');
        const result = await execute(parse(text, withSource), source(), target);
        expect(result.success).toBe(false);
        expect(result.errors.join('\n')).toContain(
            "binding 'all' reaches Cls 'c1', lowered by matched 'Cls -> Table' and lazy 'unique lazy Cls -> Key': the type 'Named' of 'all' fits both"
        );
    });
});

describe('the such that of a forall', () => {
    it.each(PATHS)('sees the element\'s bare names, as the body does — %s', async (_l, withSource) => {
        const target = { classes: [cls('B', [], [contains('items', 'Item')]), cls('Item', ['name'])] };
        const xs = [{ name: 'i1', kind: 'k' }, { name: 'i2', kind: 'other' }, { name: 'i3', kind: 'k' }];
        const text = HEAD + 'A -> B {\n    -> items {\n        forall x in xs such that kind == "k" -> Item {\n'
            + '            name := name\n        }\n    }\n}';
        const result = await execute(parse(text, withSource), [el('a0', 'A', { xs })], target);
        expect(result.errors).toEqual([]);
        const [b] = result.targetModel!.instances.get('B')!;
        expect(ptr(b.items).map((i: any) => i.name)).toEqual(['i1', 'i3']);
    });
});
