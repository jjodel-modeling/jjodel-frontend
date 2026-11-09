import { describe, it, expect, vi } from 'vitest';

/**
 * `envValue(name[, env])` returns the value `extendEnv` bound to `name`, as bound: a string
 * a string, an integer an integer, a source element the element, never a demand
 * (P-2026-11-08-0740, slice S1 of `docs/discovery/discovery_2026-11-08_jjtl_kernel_gaps.md`).
 * An unbound name stops the run naming the builtin, the rule and the source element
 * (R-FA-11, R-FA-13); `envHas` is the test. Measured in a called rule, a helper body, a lazy
 * rule's guard and a `forall` collection, on both parser paths.
 *
 * The `joiner` barrel is mocked as in called-lazy-rules.test.ts: `executor.ts` imports it for
 * `U.asNumber` alone, which drags in monaco and fails under `environment: 'node'`. The
 * lexer, parser and executor run unstubbed.
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
        cls('Const', ['value']),
        cls('Ref', ['name']),
        cls('List', [], [{ name: 'items', composition: true, type: { name: 'Ref' } }]),
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

/** Main m1 whose `expr` is a Var named x, or a Const of value 1. */
const VAR_SOURCE = [
    el('m1', 'Main', { expr: { __ref: 'vx' } }),
    el('vx', 'Var', { name: 'x', _containerId: 'm1' }),
];
const CONST_SOURCE = [
    el('m1', 'Main', { expr: { __ref: 'c1' } }),
    el('c1', 'Const', { value: 1, _containerId: 'm1' }),
];

/** The environment every case lowers under: a string, an integer, a source element, a list. */
const ENV = 'extendEnv(["x", "w", "s", "ns"], ["add", 3, m, ["p", "q"]])';

/** A target subtree as text: Const(v), Ref(n), List(items). */
function term(node: any): string {
    if (node == null) return 'null';
    if (Array.isArray(node)) return `[${node.map(term).join(', ')}]`;
    switch (node.__type) {
        case 'Const': return `Const(${node.value})`;
        case 'Ref': return `Ref(${node.name})`;
        case 'List': return `List(${term(node.items)})`;
        default: return `?${node.__type}`;
    }
}

const FAILED_EVAL = /^Expression evaluation failed/;

describe.each([
    ['legacy parser (no source)', false],
    ['JjEL parser (source)', true],
] as const)('envValue — %s', (_label, withSource) => {
    const run = (rules: string, source: any[]) => execute(parseJjtl(rules, withSource), source, TARGET);
    const rootTerms = (result: any) => result.targetModel!.roots.map(term).sort();
    const clean = (result: any) => {
        expect(result.errors).toEqual([]);
        expect(result.warnings.filter((w: string) => FAILED_EVAL.test(w))).toEqual([]);
        expect(result.success).toBe(true);
    };

    it('in a called rule, a bound string is the string', async () => {
        const result = await run(`
rule mk(v, env: Env) -> Ref {
    name := envValue(v.name) + "_w"
}

Main m = mk(m.expr, ${ENV})`, VAR_SOURCE);
        clean(result);
        expect(rootTerms(result)).toEqual(['Ref(add_w)']);
    });

    it('in a called rule, a bound integer is the integer', async () => {
        const result = await run(`
rule mk(c, env: Env) -> Const {
    value := envValue("w") + c.value
}

Main m = mk(m.expr, ${ENV})`, CONST_SOURCE);
        clean(result);
        expect(rootTerms(result)).toEqual(['Const(4)']);
    });

    it('in a called rule, a bound source element is the element', async () => {
        const result = await run(`
rule mk(v, env: Env) -> Ref {
    name := envValue("s").name + "/" + envValue("s").expr.name
}

Main m = mk(m.expr, ${ENV})`, VAR_SOURCE);
        clean(result);
        expect(rootTerms(result)).toEqual(['Ref(m1/x)']);
    });

    it('in a helper body called from a called rule, the bound value is returned as bound', async () => {
        const result = await run(`
helper tag(n: String) -> String { envValue(n) + "_w" }

rule mk(v, env: Env) -> Ref {
    name := tag(v.name)
}

Main m = mk(m.expr, ${ENV})`, VAR_SOURCE);
        clean(result);
        expect(rootTerms(result)).toEqual(['Ref(add_w)']);
    });

    it("in a lazy rule's guard, the bound integer selects the rule", async () => {
        const result = await run(`
rule under(e, env: Env) = e

lazy Var v -> Ref where envValue("w") == 3 {
    name := "three"
}

lazy Var v -> Ref where envValue("w") != 3 {
    name := "other"
}

Main m = under(m.expr, ${ENV})`, VAR_SOURCE);
        clean(result);
        expect(rootTerms(result)).toEqual(['Ref(three)']);
    });

    it('in a forall collection, a bound list is iterated', async () => {
        const result = await run(`
rule mk(v, env: Env) -> List {
    -> items {
        forall n in envValue("ns") -> Ref {
            name := n
        }
    }
}

Main m = mk(m.expr, ${ENV})`, VAR_SOURCE);
        clean(result);
        expect(rootTerms(result)).toEqual(['List([Ref(p), Ref(q)])']);
    });

    it('with an extendEnv marker as second argument, reads from that environment', async () => {
        const result = await run(`
rule mk(v) -> Ref {
    name := envValue("y", extendEnv(["y"], [v.name + "!"]))
}

Main m = mk(m.expr)`, VAR_SOURCE);
        clean(result);
        expect(rootTerms(result)).toEqual(['Ref(x!)']);
    });

    it('an unbound name stops the run, naming the builtin, the rule and the source element', async () => {
        const result = await run(`
rule mk(v, env: Env) -> Ref {
    name := if envHas("nope") then "bound" else envValue("nope")
}

Main m = mk(m.expr, ${ENV})`, VAR_SOURCE);
        expect(result.success).toBe(false);
        expect(result.targetModel).toBeUndefined();
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toContain("Builtin 'envValue' failed in expression at line 6, column ");
        expect(result.errors[0]).toContain(
            "(rule 'rule mk(v, env) -> Ref', source element 'Var 'x''): 'nope' is not bound in the environment; envHas tests it");
        expect(result.warnings.filter((w: string) => FAILED_EVAL.test(w))).toEqual([]);
    });
});
