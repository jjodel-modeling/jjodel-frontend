import { describe, it, expect, vi } from 'vitest';

/**
 * A demand used as a value inside an expression stops the run (P-2026-11-08-0740, slice S2
 * of `docs/discovery/discovery_2026-11-08_jjtl_kernel_gaps.md`, cases A and C of its §3.3).
 * `envLookup(name)` and a called rule yield a demand, carried out only where a binding
 * places it; as the operand of an operator JjEL saw the marker
 * object, and `+` wrote `"[object Object]_w"` or `null` with `success true`. The error names
 * the builtin, the expression, the rule and the source element, as R-FA-12 and R-FA-13 do.
 * A demand that a binding places stays legal. Both parser paths.
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

function cls(name: string, attributes: string[]) {
    const attrs = attributes.map(a => ({ name: a }));
    return { className: 'DClass', name, attributes: attrs, allAttributes: attrs, references: [], allReferences: [] };
}

const TARGET = { classes: [cls('Const', ['value']), cls('Ref', ['name'])] };

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

/** The environment of the discovery probe: x := "add", w := 3. */
const ENV = 'extendEnv(["x", "w"], ["add", 3])';

function term(node: any): string {
    if (node == null) return 'null';
    if (Array.isArray(node)) return `[${node.map(term).join(', ')}]`;
    if (node.__type === 'Const') return `Const(${node.value})`;
    if (node.__type === 'Ref') return `Ref(${node.name})`;
    return `?${node.__type}`;
}

const FAILED_EVAL = /^Expression evaluation failed/;
const RULE_MK_VAR = "(rule 'rule mk(v, env) -> Ref', source element 'Var 'x'')";
const RULE_MK_CONST = "(rule 'rule mk(c, env) -> Const', source element 'Const 'c1'')";
const ADVICE = 'a demand is carried out only where a binding places it; bind it with let, or read a bound value with envValue';

describe.each([
    ['legacy parser (no source)', false],
    ['JjEL parser (source)', true],
] as const)('a demand used as a value — %s', (_label, withSource) => {
    const run = (rules: string, source: any[]) => execute(parseJjtl(rules, withSource), source, TARGET);
    const failed = (result: any) => {
        expect(result.success).toBe(false);
        expect(result.targetModel).toBeUndefined();
        expect(result.errors).toHaveLength(1);
        expect(result.warnings.filter((w: string) => FAILED_EVAL.test(w))).toEqual([]);
        return result.errors[0] as string;
    };

    it("case A: envLookup concatenated to a string in a helper body stops the run", async () => {
        const result = await run(`
helper tag(n: String) -> String { envLookup(n) + "_w" }

rule mk(v, env: Env) -> Ref {
    name := tag(v.name)
}

Main m = mk(m.expr, ${ENV})`, VAR_SOURCE);
        const error = failed(result);
        expect(error).toMatch(/^Failed to map \(creation\) -> name: Builtin 'envLookup' failed in expression at line \d+, column \d+/);
        expect(error).toContain(`${RULE_MK_VAR}: its result, a demand, is an operand of '+'; ${ADVICE}`);
    });

    it('case C: envLookup in arithmetic stops the run', async () => {
        const result = await run(`
rule mk(c, env: Env) -> Const {
    value := envLookup("w") + c.value
}

Main m = mk(m.expr, ${ENV})`, CONST_SOURCE);
        const error = failed(result);
        expect(error).toMatch(/^Failed to map \(creation\) -> value: Builtin 'envLookup' failed in expression at line 6, column \d+/);
        expect(error).toContain(`${RULE_MK_CONST}: its result, a demand, is an operand of '+'; ${ADVICE}`);
    });

    it("a called rule's demand in arithmetic stops the run, naming the rule", async () => {
        const result = await run(`
rule one(c) -> Const {
    value := 1
}

rule mk(c, env: Env) -> Const {
    value := 1 - one(c)
}

Main m = mk(m.expr, ${ENV})`, CONST_SOURCE);
        const error = failed(result);
        expect(error).toMatch(/^Failed to map \(creation\) -> value: Builtin 'one' failed in expression at line 10, column \d+/);
        expect(error).toContain(`${RULE_MK_CONST}: its result, a demand, is an operand of '-'; ${ADVICE}`);
    });

    it('a demand as the operand of a unary operator stops the run', async () => {
        const result = await run(`
rule mk(c, env: Env) -> Const {
    value := -envLookup("w")
}

Main m = mk(m.expr, ${ENV})`, CONST_SOURCE);
        const error = failed(result);
        expect(error).toMatch(/^Failed to map \(creation\) -> value: Builtin 'envLookup' failed in expression at line 6, column \d+/);
        expect(error).toContain(`${RULE_MK_CONST}: its result, a demand, is the operand of '-'; ${ADVICE}`);
    });

    it.each(['==', '!=', '<', '<=', '>', '>='])("envLookup compared with '%s' stops the run", async op => {
        const result = await run(`
rule mk(c, env: Env) -> Const {
    value := envLookup("w") ${op} c.value
}

Main m = mk(m.expr, ${ENV})`, CONST_SOURCE);
        const error = failed(result);
        expect(error).toMatch(/^Failed to map \(creation\) -> value: Builtin 'envLookup' failed in expression at line 6, column \d+/);
        expect(error).toContain(`${RULE_MK_CONST}: its result, a demand, is an operand of '${op}'; ${ADVICE}`);
    });

    it("a called rule's demand on the right of a comparison stops the run, naming the rule", async () => {
        const result = await run(`
rule one(c) -> Const {
    value := 1
}

rule mk(c, env: Env) -> Const {
    value := c.value == one(c)
}

Main m = mk(m.expr, ${ENV})`, CONST_SOURCE);
        const error = failed(result);
        expect(error).toMatch(/^Failed to map \(creation\) -> value: Builtin 'one' failed in expression at line 10, column \d+/);
        expect(error).toContain(`${RULE_MK_CONST}: its result, a demand, is an operand of '=='; ${ADVICE}`);
    });

    it('a demand compared in the condition of an if-then-else stops the run', async () => {
        const result = await run(`
rule mk(c, env: Env) -> Const {
    value := if envLookup("w") == 3 then 1 else 2
}

Main m = mk(m.expr, ${ENV})`, CONST_SOURCE);
        expect(failed(result)).toContain(`${RULE_MK_CONST}: its result, a demand, is an operand of '=='; ${ADVICE}`);
    });

    it('a method called on envLookup stops the run', async () => {
        const result = await run(`
rule mk(v, env: Env) -> Ref {
    name := envLookup(v.name).toUpper()
}

Main m = mk(m.expr, ${ENV})`, VAR_SOURCE);
        const error = failed(result);
        expect(error).toMatch(/^Failed to map \(creation\) -> name: Builtin 'envLookup' failed in expression at line 6, column \d+/);
        expect(error).toContain(`${RULE_MK_VAR}: its result, a demand, is the receiver of method 'toUpper'; ${ADVICE}`);
    });

    it('a null-safe method called on envLookup stops the run', async () => {
        const result = await run(`
rule mk(v, env: Env) -> Ref {
    name := envLookup(v.name)?.toUpper()
}

Main m = mk(m.expr, ${ENV})`, VAR_SOURCE);
        expect(failed(result)).toContain(`${RULE_MK_VAR}: its result, a demand, is the receiver of method 'toUpper'; ${ADVICE}`);
    });

    it("a method called on a called rule's result stops the run, naming the rule", async () => {
        const result = await run(`
rule one(c) -> Const {
    value := 1
}

rule mk(c, env: Env) -> Const {
    value := one(c).toString()
}

Main m = mk(m.expr, ${ENV})`, CONST_SOURCE);
        const error = failed(result);
        expect(error).toMatch(/^Failed to map \(creation\) -> value: Builtin 'one' failed in expression at line 10, column \d+/);
        expect(error).toContain(`${RULE_MK_CONST}: its result, a demand, is the receiver of method 'toString'; ${ADVICE}`);
    });

    it('a property read on a demand does not stop the run: it reads null (R-FA-12)', async () => {
        const result = await run(`
rule mk(v, env: Env) -> Ref {
    name := envLookup(v.name).name
}

Main m = mk(m.expr, ${ENV})`, VAR_SOURCE);
        expect(result.warnings).toEqual([]);
        expect(result.errors).toEqual([]);
        expect(result.success).toBe(true);
        expect(result.targetModel!.roots.map(term)).toEqual(['Ref(null)']);
    });

    it('a value bound by let compares and takes methods: the same expressions succeed', async () => {
        const compared = await run(`
rule mk(c, env: Env) -> Const {
    let $w = envLookup("w") in {
        value := $w == 3
    }
}

Main m = mk(m.expr, ${ENV})`, CONST_SOURCE);
        expect(compared.errors).toEqual([]);
        expect(compared.targetModel!.roots.map(term)).toEqual(['Const(true)']);

        const called = await run(`
rule mk(v, env: Env) -> Ref {
    let $x = envLookup(v.name) in {
        name := $x.toUpper()
    }
}

Main m = mk(m.expr, ${ENV})`, VAR_SOURCE);
        expect(called.errors).toEqual([]);
        expect(called.targetModel!.roots.map(term)).toEqual(['Ref(ADD)']);
    });

    it('a demand that a binding places stays legal, bare or through if-then-else', async () => {
        const result = await run(`
rule mkRef(v) -> Ref {
    name := v.name
}

rule mk(v, env: Env) = if envHas(v.name) then envLookup(v.name) else mkRef(v)

Main m = mk(m.expr, ${ENV})`, VAR_SOURCE);
        expect(result.errors).toEqual([]);
        expect(result.warnings.filter((w: string) => FAILED_EVAL.test(w))).toEqual([]);
        expect(result.success).toBe(true);
    });

    it('the value read by envValue or held by a let is no demand: the same expressions succeed', async () => {
        const result = await run(`
rule mk(c, env: Env) -> Const {
    let $w = envLookup("w") in {
        value := $w + envValue("w") + c.value
    }
}

Main m = mk(m.expr, ${ENV})`, CONST_SOURCE);
        expect(result.errors).toEqual([]);
        expect(result.warnings.filter((w: string) => FAILED_EVAL.test(w))).toEqual([]);
        expect(result.success).toBe(true);
        expect(result.targetModel!.roots.map(term)).toEqual(['Const(7)']);
    });
});
