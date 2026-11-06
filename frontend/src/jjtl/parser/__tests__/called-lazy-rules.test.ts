import { describe, it, expect } from 'vitest';

/**
 * Grammar of slice B (P-2026-11-02-2224, R-JTG-5, R-JTG-7): called rules
 * `[unique] rule name(params) -> T { ... }` (unique: P-2026-11-03-2111), lazy rules `[unique] lazy S -> T { ... }`, and the
 * delegating form `... = expression`, on both parser paths. `rule`, `lazy` and `unique`
 * are contextual: a class or a feature with one of those names keeps parsing.
 */

import { JjtlLexer } from '../../lexer/lexer';
import { JjtlParser } from '../parser';

function parse(src: string, withSource: boolean) {
    const { tokens } = new JjtlLexer(src).tokenize();
    return withSource ? new JjtlParser(tokens, src).parse() : new JjtlParser(tokens).parse();
}

const SRC = `transformation Lower from Src to Tgt
rule mkRef(v) -> Ref {
    name := v.name
}
rule under(e, env: Env) = e
lazy Add -> Add {
    left := left
}
unique lazy Const c -> Const where c.value > 0 {
    value := c.value
}
lazy Var v = if envHas(v.name) then envLookup(v.name) else mkRef(v)
Main m = m.expr
Rule -> Rule {
    unique := unique
}
`;

describe.each([false, true])('called and lazy rules parse (JjEL path: %s)', (withSource) => {
    it('keeps matched rules in mappings and the others in rules, in order', () => {
        const { ast, errors } = parse(SRC, withSource);
        expect(errors).toEqual([]);
        expect(ast!.mappings.map(m => m.sources[0].className)).toEqual(['Main', 'Rule']);
        expect(ast!.rules!.map(r => [r.ruleKind, r.ruleName ?? r.sources[0].className, r.targetClass]))
            .toEqual([
                ['called', 'mkRef', 'Ref'],
                ['called', 'under', ''],
                ['lazy', 'Add', 'Add'],
                ['lazy', 'Const', 'Const'],
                ['lazy', 'Var', ''],
            ]);
    });

    it('reads parameters, the environment parameter, unique, alias and guard', () => {
        const { ast } = parse(SRC, withSource);
        const [mkRef, under, , constRule, varRule] = ast!.rules!;
        expect(mkRef.parameters!.map(p => [p.name, p.paramType])).toEqual([['v', '']]);
        expect(mkRef.body).toHaveLength(1);
        expect(under.parameters!.map(p => [p.name, p.paramType])).toEqual([['e', ''], ['env', 'Env']]);
        expect(under.result).toBeDefined();
        expect(constRule.unique).toBe(true);
        expect(constRule.sources[0].alias).toBe('c');
        expect(constRule.condition).toBeDefined();
        expect(varRule.unique).toBeUndefined();
        expect(varRule.result).toBeDefined();
        expect(ast!.mappings[0].result).toBeDefined();
        expect(ast!.mappings[0].targetClass).toBe('');
    });

    it('reads unique on a called rule, which a class or alias named unique or rule does not take', () => {
        const { ast, errors } = parse(
            'transformation T from A to B\nunique rule key(c) -> Column {\n    name := "id"\n}\nrule plain(c) -> Column {\n    name := c.name\n}\n'
            + 'unique u -> Rule {\n    name := name\n}\n',
            withSource,
        );
        expect(errors).toEqual([]);
        expect(ast!.rules!.map(r => [r.ruleKind, r.ruleName, r.unique])).toEqual([
            ['called', 'key', true],
            ['called', 'plain', undefined],
        ]);
        expect(ast!.rules![0].parameters!.map(p => p.name)).toEqual(['c']);
        expect(ast!.mappings.map(m => [m.sources[0].className, m.sources[0].alias])).toEqual([['unique', 'u']]);
    });

    it('leaves a transformation without them as it was: no rules key', () => {
        const { ast, errors } = parse('transformation T from A to B\nX -> Y {\n    name := name\n}\n', withSource);
        expect(errors).toEqual([]);
        expect(ast!.rules).toBeUndefined();
        expect(ast!.mappings[0].ruleKind).toBeUndefined();
    });
});
