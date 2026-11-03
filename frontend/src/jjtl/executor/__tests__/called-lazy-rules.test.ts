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

    // `unique rule` (P-2026-11-03-2111): one target per (rule, arguments, environment).
    const UNIQUE_CALLS = `
unique rule mkConst(c) -> Const {
    value := c.value
}

rule mkAdd(a) -> Add {
    left := mkConst(a.left)
    right := mkConst(a.right)
}

Main m = mkAdd(m.expr)
`;

    it('returns the target of a unique called rule for a second call with the same argument: placed twice, a second claim', async () => {
        const result = await run(UNIQUE_CALLS, [
            el('m1', 'Main', { expr: ref('a1') }),
            el('a1', 'Add', { left: ref('c1'), right: ref('c1'), _containerId: 'm1' }),
            el('c1', 'Const', { value: 1, _containerId: 'a1' }),
        ]);
        expect(result.targetModel!.instances.get('Const')).toHaveLength(1);
        const conflicts = result.errors.filter(e => /Containment conflict/.test(e));
        expect(conflicts).toHaveLength(1);
        expect(conflicts[0]).toMatch(/is claimed by Add .*\.left .* and by Add .*\.right/);
    });

    it('creates a fresh target of a unique called rule for different arguments', async () => {
        const result = await run(UNIQUE_CALLS, [
            el('m1', 'Main', { expr: ref('a1') }),
            el('a1', 'Add', { left: ref('c1'), right: ref('c2'), _containerId: 'm1' }),
            el('c1', 'Const', { value: 1, _containerId: 'a1' }),
            el('c2', 'Const', { value: 2, _containerId: 'a1' }),
        ]);
        expect(result.errors).toEqual([]);
        expect(result.targetModel!.roots.map(term)).toEqual(['Add(Const(1), Const(2))']);
    });

    it('calls a called rule not declared unique afresh for the same argument (R-JTG-6)', async () => {
        const result = await run(UNIQUE_CALLS.replace('unique rule', 'rule'), [
            el('m1', 'Main', { expr: ref('a1') }),
            el('a1', 'Add', { left: ref('c1'), right: ref('c1'), _containerId: 'm1' }),
            el('c1', 'Const', { value: 1, _containerId: 'a1' }),
        ]);
        expect(result.errors).toEqual([]);
        expect(result.targetModel!.roots.map(term)).toEqual(['Add(Const(1), Const(1))']);
        expect(result.targetModel!.instances.get('Const')).toHaveLength(2);
    });

    it('holds the value of a let bound to a called rule: two uses, one target (#515)', async () => {
        const result = await run(`
rule mkConst(c) -> Const {
    value := c.value
}

Add a -> Add {
    let $c = mkConst(a.left) in {
        left := $c
        right := $c
    }
}
`, [
            el('a1', 'Add', { left: ref('c1'), right: ref('c1') }),
            el('c1', 'Const', { value: 1, _containerId: 'a1' }),
        ]);
        expect(result.targetModel!.instances.get('Const')).toHaveLength(1);
        expect(result.errors.filter(e => /Containment conflict/.test(e))).toHaveLength(1);
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

    it('holds the value of a let bound to envLookup: one lowering for two uses, placed twice, a second claim (#515)', async () => {
        const result = await run(`
rule twice(e, env: Env) -> Add {
    let $x = envLookup("x") in {
        left := $x
        right := $x
    }
}

lazy Const -> Const {
    value := value
}

Main m = twice(m.expr, extendEnv(["x"], [m.expr]))
`, [
            el('m1', 'Main', { expr: ref('c5') }),
            k('c5', 5, 'm1'),
        ]);
        expect(result.targetModel!.instances.get('Const')).toHaveLength(1);
        expect(result.errors.filter(e => /Containment conflict/.test(e))).toHaveLength(1);
    });

    it('creates a unique called rule\'s target once per environment, not once per argument', async () => {
        // One Var y under two Binds: mkRef(y) is called under {x := c5} twice and under {x := c6} once.
        const text = ENV_RULES.replace('rule mkRef(v)', 'unique rule mkRef(v)');
        const source = (second: string) => [
            el('m1', 'Main', { expr: ref('a0') }),
            add('a0', 'b1', 'b2', 'm1'),
            bind('b1', 'vy', ['bd1'], 'a0'),
            bind('b2', 'vy', ['bd2'], 'a0'),
            v('vy', 'y', 'b1'),
            binding('bd1', 'x', 'c5', 'b1'),
            binding('bd2', 'x', second, 'b2'),
            k('c5', 5, 'bd1'),
            k('c6', 6, 'bd2'),
        ];
        const different = await run(text, source('c6'));
        expect(different.errors).toEqual([]);
        expect(different.targetModel!.instances.get('Ref')).toHaveLength(2);
        const equal = await run(text, source('c5'));
        expect(equal.targetModel!.instances.get('Ref')).toHaveLength(1);
        expect(equal.errors.filter(e => /Containment conflict/.test(e))).toHaveLength(1);
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

// ---------------------------------------------------------------------------
// Containment under B (step 5, R-JTG-6): a call of a rule not `unique`, a lazy node and a
// bound value each lower to a fresh subtree, so one expression may be placed twice; the
// double-claim error stays for implicit resolutions and `unique` rules.

describe.each([
    ['legacy parser (no source)', false],
    ['JjEL parser (source)', true],
] as const)('containment under B — %s', (_label, withSource) => {
    const run = (rules: string, source: any[]) => execute(parseJjtl(rules, withSource), source, TARGET);
    const rootTerms = (result: any) => result.targetModel!.roots.map(term).sort();
    // Add(Bind(e, [x := c1]), Bind(e, [x := ?])), e = Add(Var x, Const 0): e placed twice.
    const twice = (secondBinding: string) => [
        el('m1', 'Main', { expr: ref('a0') }),
        add('a0', 'b1', 'b2', 'm1'),
        bind('b1', 'e1', ['bd1'], 'a0'),
        bind('b2', 'e1', [secondBinding], 'a0'),
        add('e1', 'vx', 'c0', 'b1'),
        v('vx', 'x', 'e1'),
        k('c0', 0, 'e1'),
        binding('bd1', 'x', 'c1', 'b1'),
        k('c1', 1, 'bd1'),
        binding('bd2', 'x', 'c2', 'b2'),
        k('c2', 2, 'bd2'),
    ];

    it('places one expression twice with the same bindings as two separate subtrees', async () => {
        const result = await run(ENV_RULES, twice('bd1'));
        expect(result.errors).toEqual([]);
        expect(rootTerms(result)).toEqual(['Add(Add(Const(1), Const(0)), Add(Const(1), Const(0)))']);
        const root = result.targetModel!.roots[0];
        const [l, r] = [root.left, root.right].map(x => (Array.isArray(x) ? x[0] : x));
        expect(l).not.toBe(r);
        expect(result.targetModel!.instances.get('Add')).toHaveLength(3);
    });

    it('places one expression twice with different bindings as two different subtrees', async () => {
        const result = await run(ENV_RULES, twice('bd2'));
        expect(result.errors).toEqual([]);
        expect(rootTerms(result)).toEqual(['Add(Add(Const(1), Const(0)), Add(Const(2), Const(0)))']);
    });

    it('lowers a bound value of a matched class afresh, never to its shared pass 1 target', async () => {
        // Bind(Add(Var x, Var x), [x := Const 5]) with Const matched: the binding site's
        // environment is empty, and x is placed twice without a second claim.
        const rules = ENV_RULES.replace('lazy Const -> Const', 'Const -> Const');
        const result = await run(rules, [
            el('m1', 'Main', { expr: ref('b1') }),
            bind('b1', 'a1', ['bd1'], 'm1'),
            add('a1', 'vx', 'vx2', 'b1'),
            v('vx', 'x', 'a1'),
            v('vx2', 'x', 'a1'),
            binding('bd1', 'x', 'c5', 'b1'),
            k('c5', 5, 'bd1'),
        ]);
        expect(result.errors).toEqual([]);
        // The pass 1 Const stays a root of its own: nothing claims it.
        expect(rootTerms(result)).toEqual(['Add(Const(5), Const(5))', 'Const(5)']);
    });

    // Bind(Add(Var x, Var x), [x := Add(Const 5, Const 6)]): the bound value is placed twice
    // (R-JTG-12, P-2026-11-03-0539).
    const boundTree = [
        el('m1', 'Main', { expr: ref('b1') }),
        bind('b1', 'a1', ['bd1'], 'm1'),
        add('a1', 'vx', 'vx2', 'b1'),
        v('vx', 'x', 'a1'),
        v('vx2', 'x', 'a1'),
        binding('bd1', 'x', 'a5', 'b1'),
        add('a5', 'c5', 'c6', 'bd1'),
        k('c5', 5, 'a5'),
        k('c6', 6, 'a5'),
    ];

    it('resolves the matched descendants of a bound value through the trace: placed twice, a second claim', async () => {
        const rules = ENV_RULES.replace('lazy Const -> Const', 'Const -> Const');
        const result = await run(rules, boundTree);
        const conflicts = result.errors.filter(e => /Containment conflict/.test(e));
        expect(conflicts).toHaveLength(2);
        expect(conflicts[0]).toMatch(/Const '?.*'? is claimed by Add .*\.left .* and by Add .*\.left/);
        expect(conflicts[1]).toMatch(/Const '?.*'? is claimed by Add .*\.right .* and by Add .*\.right/);
        // The bound Add itself is lowered afresh, once per placement.
        expect(result.targetModel!.instances.get('Add')).toHaveLength(3);
        expect(result.targetModel!.instances.get('Const')).toHaveLength(2);
    });

    it('places the same bound tree twice when its descendants are written with lazy rules', async () => {
        const result = await run(ENV_RULES, boundTree);
        expect(result.errors).toEqual([]);
        expect(rootTerms(result)).toEqual(['Add(Add(Const(5), Const(6)), Add(Const(5), Const(6)))']);
        expect(result.targetModel!.instances.get('Const')).toHaveLength(4);
    });

    it('still reports a second claim through an implicit resolution', async () => {
        const result = await run(`
lazy Var v = mkRef(v)

rule mkRef(v) -> Ref {
    name := v.name
}

Add -> Add {
    left := left
    right := right
}

Const -> Const {
    value := value
}
`, [
            add('a1', 'c1', 'c1', 'm1'),
            k('c1', 1, 'a1'),
        ]);
        const conflicts = result.errors.filter(e => /Containment conflict/.test(e));
        expect(conflicts).toHaveLength(1);
        expect(conflicts[0]).toMatch(/Const '?.*'? is claimed by Add .*\.left .* and by Add .*\.right/);
    });

    it('expands a template into one target per referenced Op, semantics lowered, operands bound', async () => {
        // Template(each = [inc, dbl], body = Var a): inc = Add(Var x, Const 1),
        // dbl = Add(Var x, Var x); each Op's semantics lowered with x := the body.
        const rules = ENV_RULES.replace(
            'Main m = m.expr',
            'lazy Template t = t.each.map(op => under(op.semantics, extendEnv(\'x\', t.body)))\n\nMain m = m.expr',
        );
        const result = await run(rules, [
            el('m1', 'Main', { expr: ref('t1') }),
            el('t1', 'Template', { each: [ref('op1'), ref('op2')], body: ref('va'), _containerId: 'm1' }),
            v('va', 'a', 't1'),
            el('op1', 'Op', { name: 'inc', semantics: ref('s1') }),
            add('s1', 'vx1', 'c1', 'op1'),
            v('vx1', 'x', 's1'),
            k('c1', 1, 's1'),
            el('op2', 'Op', { name: 'dbl', semantics: ref('s2') }),
            add('s2', 'vx2', 'vx3', 'op2'),
            v('vx2', 'x', 's2'),
            v('vx3', 'x', 's2'),
        ]);
        expect(result.errors).toEqual([]);
        expect(rootTerms(result)).toEqual(['Add(Ref(a), Const(1))', 'Add(Ref(a), Ref(a))']);
    });
});

// ---------------------------------------------------------------------------
// What the app's write-back receives (slice B2, P-2026-11-02-2338).

const POINTER_TARGET = {
    classes: [
        cls('Holder', [], [{ name: 'items', composition: false, type: { name: 'Const' } }]),
        cls('Const', ['value']),
    ],
};

describe.each([
    ['legacy parser (no source)', false],
    ['JjEL parser (source)', true],
] as const)('write-back shape (B2) — %s', (_label, withSource) => {
    const runOn = (target: any, rules: string, source: any[]) => execute(parseJjtl(rules, withSource), source, target);

    it('keeps a pointer to each of two fresh targets of one source element, by identity', async () => {
        const result = await runOn(POINTER_TARGET, `
lazy Const -> Const {
    value := value
}

Main m -> Holder {
    items := exprs
}
`, [el('m1', 'Main', { exprs: [ref('c1'), ref('c1')] }), k('c1', 4, 'm1')]);
        expect(result.errors).toEqual([]);
        const consts = result.targetModel!.instances.get('Const')!;
        expect(consts).toHaveLength(2);
        expect(consts[0].__sourceId).toBe(consts[1].__sourceId);
        const holder = result.targetModel!.instances.get('Holder')![0];
        expect(holder.items.__ref_result).toBe(true);
        expect(holder.items.targets).toHaveLength(2);
        expect(holder.items.targets[0]).toBe(consts[0]);
        expect(holder.items.targets[1]).toBe(consts[1]);
    });

    it('still collapses the same matched target held twice to one pointer', async () => {
        const result = await runOn(POINTER_TARGET, `
Const -> Const {
    value := value
}

Main m -> Holder {
    items := exprs
}
`, [el('m1', 'Main', { exprs: [ref('c1'), ref('c1')] }), k('c1', 4, 'm1')]);
        expect(result.errors).toEqual([]);
        const holder = result.targetModel!.instances.get('Holder')![0];
        expect(holder.items.targets).toEqual([result.targetModel!.instances.get('Const')![0]]);
    });

    it('reports a lazy selection error under a delegating matched rule per element, with the stack', async () => {
        const result = await execute(parseJjtl(`
lazy Const c -> Const where c.value > 5 {
    value := value
}

Main m = m.expr
`, withSource), [
            el('m1', 'Main', { expr: ref('c1') }),
            el('m2', 'Main', { expr: ref('c2') }),
            k('c1', 1, 'm1'),
            k('c2', 9, 'm2'),
        ], TARGET);
        expect(result.success).toBe(false);
        expect(result.errors.some(e => /Execution failed/.test(e))).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toMatch(/^Failed to lower Main 'm1' by rule '.*': No lazy rule applies to Const 'c1'/);
        expect(result.errors[0]).toMatch(/\n  at .* on Main 'm1'/);
        expect(result.targetModel!.roots.map(term)).toEqual(['Const(9)']);
    });
});
