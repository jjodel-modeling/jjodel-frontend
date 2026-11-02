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

// ---------------------------------------------------------------------------
// The environment (step 3, R-JTG-5, R-JTG-6), on the toy whose expression rules are lazy
// (step 4, R-JTG-7): pass 1 lowers nothing, so the roots hold only what Main reached.

const ENV_RULES = `
rule mkRef(v) -> Ref {
    name := v.name
}

rule under(e, env: Env) = e

lazy Add -> Add {
    left := left
    right := right
}

lazy Const -> Const {
    value := value
}

lazy Var v = if envHas(v.name) then envLookup(v.name) else mkRef(v)

lazy Bind b = under(b.expr, extendEnv(b.bindings.map(x => x.var), b.bindings.map(x => x.expr)))

Main m = m.expr
`;

const v = (id: string, name: string, container: string) => el(id, 'Var', { name, _containerId: container });
const k = (id: string, value: number, container: string) => el(id, 'Const', { value, _containerId: container });
const add = (id: string, l: string, r: string, container: string) =>
    el(id, 'Add', { left: ref(l), right: ref(r), _containerId: container });
const bind = (id: string, expr: string, bindings: string[], container: string) =>
    el(id, 'Bind', { expr: ref(expr), bindings: bindings.map(ref), _containerId: container });
const binding = (id: string, variable: string, expr: string, container: string) =>
    el(id, 'Binding', { var: variable, expr: ref(expr), _containerId: container });

describe.each([
    ['legacy parser (no source)', false],
    ['JjEL parser (source)', true],
] as const)('the environment — %s', (_label, withSource) => {
    const run = (rules: string, source: any[]) => execute(parseJjtl(rules, withSource), source, TARGET);
    const rootTerms = (result: any) => result.targetModel!.roots.map(term).sort();

    it('lowers Bind(Add(Var x, Const 1), [x := Var a]) to Add(Ref a, Const 1)', async () => {
        const result = await run(ENV_RULES, [
            el('m1', 'Main', { expr: ref('b1') }),
            bind('b1', 'a1', ['bd1'], 'm1'),
            add('a1', 'vx', 'c1', 'b1'),
            v('vx', 'x', 'a1'),
            k('c1', 1, 'a1'),
            binding('bd1', 'x', 'va', 'b1'),
            v('va', 'a', 'bd1'),
        ]);
        expect(result.errors).toEqual([]);
        expect(rootTerms(result)).toEqual(['Add(Ref(a), Const(1))']);
    });

    it('carries the environment to the leaves through nested implicit resolutions', async () => {
        const result = await run(ENV_RULES, [
            el('m1', 'Main', { expr: ref('b1') }),
            bind('b1', 'a1', ['bd1'], 'm1'),
            add('a1', 'a2', 'c2', 'b1'),
            add('a2', 'vx', 'c1', 'a1'),
            v('vx', 'x', 'a2'),
            k('c1', 1, 'a2'),
            k('c2', 2, 'a1'),
            binding('bd1', 'x', 'va', 'b1'),
            v('va', 'a', 'bd1'),
        ]);
        expect(result.errors).toEqual([]);
        expect(rootTerms(result)).toEqual(['Add(Add(Ref(a), Const(1)), Const(2))']);
    });

    it('lowers a bound expression where it was written: no capture', async () => {
        // Bind(Add(Var x, Var y), [y := Const 5, x := Var y]): x is the y of the binding
        // site, unbound there, not the y := Const 5 of the use site.
        const result = await run(ENV_RULES, [
            el('m1', 'Main', { expr: ref('b1') }),
            bind('b1', 'a1', ['bdy', 'bdx'], 'm1'),
            add('a1', 'vx', 'vy', 'b1'),
            v('vx', 'x', 'a1'),
            v('vy', 'y', 'a1'),
            binding('bdy', 'y', 'c5', 'b1'),
            k('c5', 5, 'bdy'),
            binding('bdx', 'x', 'vy2', 'b1'),
            v('vy2', 'y', 'bdx'),
        ]);
        expect(result.errors).toEqual([]);
        expect(rootTerms(result)).toEqual(['Add(Ref(y), Const(5))']);
    });

    it('resolves a bound expression in the outer scope of its binding site', async () => {
        // Bind(Bind(Add(Var x, Var y), [y := Const 5, x := Var y]), [y := Const 2]):
        // x lowers to the outer y, Const 2.
        const result = await run(ENV_RULES, [
            el('m1', 'Main', { expr: ref('b0') }),
            bind('b0', 'b1', ['bdo'], 'm1'),
            binding('bdo', 'y', 'c2', 'b0'),
            k('c2', 2, 'bdo'),
            bind('b1', 'a1', ['bdy', 'bdx'], 'b0'),
            add('a1', 'vx', 'vy', 'b1'),
            v('vx', 'x', 'a1'),
            v('vy', 'y', 'a1'),
            binding('bdy', 'y', 'c5', 'b1'),
            k('c5', 5, 'bdy'),
            binding('bdx', 'x', 'vy2', 'b1'),
            v('vy2', 'y', 'bdx'),
        ]);
        expect(result.errors).toEqual([]);
        expect(rootTerms(result)).toEqual(['Add(Const(2), Const(5))']);
    });

    it('names the environment of each frame in an error stack', async () => {
        const result = await run(`
rule spin(e, env: Env) = spin(e, env)

Bind b = spin(b.expr, extendEnv(b.bindings.map(x => x.var), b.bindings.map(x => x.expr)))
`, [
            bind('b1', 'vx', ['bd1'], 'm1'),
            v('vx', 'x', 'b1'),
            binding('bd1', 'x', 'va', 'b1'),
            v('va', 'a', 'bd1'),
        ]);
        const depth = result.errors.filter(e => /depth limit/.test(e));
        expect(depth).toHaveLength(1);
        expect(depth[0]).toMatch(/\n  at rule spin\(e, env\) = \.\.\. on Var 'x' with \{ x := Var 'a' \}/);
    });
});

// ---------------------------------------------------------------------------
// Lazy rules (step 4, R-JTG-7): indexed by source class, selected by their guards, applied
// only when something reaches the node; `unique` once per (rule, source, environment).

describe.each([
    ['legacy parser (no source)', false],
    ['JjEL parser (source)', true],
] as const)('lazy rules — %s', (_label, withSource) => {
    const run = (rules: string, source: any[]) => execute(parseJjtl(rules, withSource), source, TARGET);
    const rootTerms = (result: any) => result.targetModel!.roots.map(term).sort();

    it('creates no target, and no root, for a lazy node nothing reaches', async () => {
        const result = await run(ENV_RULES, [
            el('m1', 'Main', { expr: ref('a1') }),
            add('a1', 'c1', 'c2', 'm1'),
            k('c1', 1, 'a1'),
            k('c2', 2, 'a1'),
            add('a9', 'c8', 'c9', 'm1'),
            k('c8', 8, 'a9'),
            k('c9', 9, 'a9'),
        ]);
        expect(result.errors).toEqual([]);
        expect(rootTerms(result)).toEqual(['Add(Const(1), Const(2))']);
        expect(result.targetModel!.instances.get('Add')).toHaveLength(1);
        expect(result.targetModel!.instances.get('Const')).toHaveLength(2);
    });

    it('creates a unique lazy target once per environment: a second placement is a second claim', async () => {
        const result = await run(ENV_RULES.replace('lazy Const -> Const', 'unique lazy Const -> Const'), [
            el('m1', 'Main', { expr: ref('b1') }),
            bind('b1', 'a1', ['bd1'], 'm1'),
            add('a1', 'vx', 'vx2', 'b1'),
            v('vx', 'x', 'a1'),
            v('vx2', 'x', 'a1'),
            binding('bd1', 'x', 'c5', 'b1'),
            k('c5', 5, 'bd1'),
        ]);
        expect(result.targetModel!.instances.get('Const')).toHaveLength(1);
        const conflicts = result.errors.filter(e => /Containment conflict/.test(e));
        expect(conflicts).toHaveLength(1);
        expect(conflicts[0]).toMatch(/Const '?.*'? is claimed by Add .*\.left .* and by Add .*\.right/);
    });

    it('selects the one lazy rule whose guard holds', async () => {
        const result = await run(`
lazy Add -> Add {
    left := left
    right := right
}

lazy Const c -> Const where c.value >= 0 {
    value := value
}

lazy Const c -> Ref where c.value < 0 {
    name := 'neg'
}

Main m = m.expr
`, [
            el('m1', 'Main', { expr: ref('a1') }),
            add('a1', 'c1', 'c2', 'm1'),
            k('c1', 1, 'a1'),
            k('c2', -1, 'a1'),
        ]);
        expect(result.errors).toEqual([]);
        expect(rootTerms(result)).toEqual(['Add(Const(1), Ref(neg))']);
    });

    it('reports no applicable lazy rule, and several, as errors naming the rules', async () => {
        const rules = (lo: string, hi: string) => `
lazy Add -> Add {
    left := left
    right := right
}

lazy Const c -> Const where ${lo} {
    value := value
}

lazy Const c -> Ref where ${hi} {
    name := 'neg'
}

Main m = m.expr
`;
        const source = [
            el('m1', 'Main', { expr: ref('a1') }),
            add('a1', 'c1', 'c1', 'm1'),
            k('c1', 1, 'a1'),
        ];
        const none = await run(rules('c.value > 5', 'c.value < -5'), source);
        expect(none.errors.some(e =>
            /No lazy rule applies to Const 'c1': the guard of 'lazy Const -> Const', 'lazy Const -> Ref' is false/.test(e)
        )).toBe(true);
        const both = await run(rules('c.value > 0', 'c.value > -5'), source);
        expect(both.errors.some(e =>
            /Ambiguous lazy rules for Const 'c1': 'lazy Const -> Const', 'lazy Const -> Ref' all apply/.test(e)
        )).toBe(true);
    });

    it('rejects a class with both a matched and a lazy rule', async () => {
        const result = await run(`
Const -> Const {
    value := value
}

lazy Const -> Const {
    value := value
}
`, [k('c1', 1, 'm1')]);
        expect(result.success).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toMatch(/Ambiguous rules for 'Const': matched 'Const -> Const' and lazy 'lazy Const -> Const'/);
    });
});
