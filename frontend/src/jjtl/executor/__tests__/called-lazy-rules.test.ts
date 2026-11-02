import { describe, it, expect, vi } from 'vitest';

/**
 * Called rules, the environment and lazy rules (P-2026-11-02-2224, P-2026-11-02-2247,
 * slice B, R-JTG-5..7), on a toy pair: source expressions (Add, Const, Var, Bind, Binding,
 * Op, Template, and a matched entry class Main), target Add(left, right), Const(value),
 * Ref(name). No inheritance: one rule per concrete class.
 *
 * The `joiner` barrel is mocked as in containment-placement.test.ts: `executor.ts` imports
 * it for `U.asNumber` alone, which drags in monaco and fails under `environment: 'node'`.
 * The lexer, parser and executor run unstubbed.
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
const contains = (name: string, type: string) => ({ name, composition: true, type: { name: type } });

const TARGET = {
    classes: [
        cls('Add', [], [contains('left', 'Add'), contains('right', 'Add')]),
        cls('Const', ['value']),
        cls('Ref', ['name']),
    ],
};

function parseJjtl(body: string, withSource: boolean): TransformationAST {
    const text = 'transformation Lower\nfrom Expr\nto Tgt\n\n' + body.trim();
    const { tokens, errors: lexErrors } = new JjtlLexer(text).tokenize();
    expect(lexErrors).toEqual([]);
    const { ast, errors } = new JjtlParser(tokens, withSource ? text : undefined).parse();
    expect(errors).toEqual([]);
    return ast!;
}

const el = (id: string, className: string, extra: Record<string, any> = {}) =>
    ({ id, name: id, className, __type: className, ...extra });
const ref = (id: string) => ({ __ref: id });

/** A target subtree as text: Add(l, r), Const(v), Ref(n). */
function term(node: any): string {
    if (node == null) return 'null';
    if (Array.isArray(node)) return node.length === 1 ? term(node[0]) : `[${node.map(term).join(', ')}]`;
    switch (node.__type) {
        case 'Add': return `Add(${term(node.left)}, ${term(node.right)})`;
        case 'Const': return `Const(${node.value})`;
        case 'Ref': return `Ref(${node.name})`;
        default: return `?${node.__type}`;
    }
}

describe.each([
    ['legacy parser (no source)', false],
    ['JjEL parser (source)', true],
] as const)('called rules — %s', (_label, withSource) => {
    const run = (rules: string, source: any[]) => execute(parseJjtl(rules, withSource), source, TARGET);

    it('builds and places a target through called rules from a delegating entry rule', async () => {
        const source = [
            el('m1', 'Main', { expr: ref('a1') }),
            el('a1', 'Add', { left: ref('c1'), right: ref('c2'), _containerId: 'm1' }),
            el('c1', 'Const', { value: 1, _containerId: 'a1' }),
            el('c2', 'Const', { value: 2, _containerId: 'a1' }),
        ];
        const result = await run(`
rule mkConst(c) -> Const {
    value := c.value
}

rule mkAdd(a) -> Add {
    left := mkConst(a.left)
    right := mkConst(a.right)
}

Main m = mkAdd(m.expr)
`, source);
        expect(result.errors).toEqual([]);
        const roots = result.targetModel!.roots;
        expect(roots.map(term)).toEqual(['Add(Const(1), Const(2))']);
        const add = result.targetModel!.instances.get('Add')![0];
        expect(roots[0]).toBe(add);
        const left = Array.isArray(add.left) ? add.left[0] : add.left;
        expect(left.__placed).toBe(true);
    });

    it('stops a recursion with no progress at the depth limit, naming the stack', async () => {
        const source = [
            el('m1', 'Main', { expr: ref('a1') }),
            el('a1', 'Add', { left: ref('a1'), right: ref('a1'), _containerId: 'm1' }),
        ];
        const result = await run(`
rule loop(a) -> Add {
    left := loop(a)
}

Main m = loop(m.expr)
`, source);
        expect(result.success).toBe(false);
        const depth = result.errors.filter(e => /depth limit/.test(e));
        expect(depth).toHaveLength(1);
        expect(depth[0]).toMatch(/depth limit \(256\) exceeded applying 'rule loop\(a\) -> Add' to Add 'a1'/);
        expect(depth[0]).toMatch(/\n  at rule loop\(a\) -> Add on Add 'a1'/);
        expect(depth[0]).toMatch(/more/);
    });
});
