import { describe, test, expect, vi } from 'vitest';
/**
 * `forall` and `exists` over several variables (R-FA-1..6, P-2026-11-02-1330).
 *
 * The parser desugars: `forall x in A, <rest>` is `(forall x in A : <rest>).flatten()`,
 * `exists x in A, <rest> such that P` is `exists x in A such that (exists <rest> such that P)`.
 * Discovery: docs/discovery/discovery_2026-11-02_jjel_forall_multivar.md (F1 for `flatten`
 * in place of `flatMap`, F2 for the self-reading collection).
 */

import { parseExpression } from '../parser';
import { jjelEval } from '../index';
import type { JjelValue } from '../evaluator';
import { boundVariablesBefore } from '../autocomplete/util/boundVariables';
import { detectJjelContext } from '../autocomplete/context';
import { getJjelIdentifierSuggestions } from '../autocomplete/providers/identifier';

// The provider reads the class names through the Jodie context, which imports the joiner (window).
vi.mock('../../components/Jodie/jodieJjelContext', () => ({ buildJodieJjelVariables: () => ({}) }));

const a = { name: 'a', p: 1, children: [{ name: 'a1' }, { name: 'a2' }] };
const b = { name: 'b', p: 2, children: [{ name: 'b1' }] };
const c = { name: 'c', p: 3, children: [] };
const S = [a, b, c];
const VARS: Record<string, JjelValue> = {
    S, AB: [a, b], CD: [{ name: 'c' }, { name: 'd' }], E: [], N: null, O: { name: 'o' }, Str: 'xy',
    Dup: [a, { name: 'a', p: 9, children: [] }],
};

const ev = (src: string): JjelValue => jjelEval(src, VARS);

function errorsOf(src: string): string[] {
    return parseExpression(src).errors.map(e => e.message);
}

function parsed(src: string): any {
    const r = parseExpression(src);
    expect(r.errors.map(e => e.message)).toEqual([]);
    return r.expression;
}

describe('forall over several variables: the forms of R-FA-1', () => {
    test('same collection, filter and projection', () => {
        expect(ev('forall x, y in S such that x.p < y.p : x.name + y.name')).toEqual(['ab', 'ac', 'bc']);
    });

    test('two collections, projection only, first variable outermost', () => {
        expect(ev('forall x in AB, y in CD : x.name + y.name')).toEqual(['ac', 'ad', 'bc', 'bd']);
    });

    test('without a filter the pair (a, a) and both orders are present', () => {
        expect(ev('forall x, y in AB : x.name + y.name')).toEqual(['aa', 'ab', 'ba', 'bb']);
    });

    test('three variables, the third a dependent collection, no projection: records { x, y, z }', () => {
        const out = ev('forall x, y in AB, z in x.children such that y.p >= x.p') as any[];
        expect(out.map(r => Object.keys(r))).toEqual(Array(5).fill(['x', 'y', 'z']));
        expect(out.map(r => r.x.name + r.y.name + r.z.name)).toEqual(['aaa1', 'aaa2', 'aba1', 'aba2', 'bbb1']);
    });

    test('three collections with a projection', () => {
        expect(ev('forall x in [1, 2], y in [10], z in [100, 200] : x + y + z')).toEqual([111, 211, 112, 212]);
    });

    test('a later collection reads an earlier variable (R-FA-2)', () => {
        expect(ev('forall p in S, k in p.children : p.name + "/" + k.name')).toEqual(['a/a1', 'a/a2', 'b/b1']);
    });

    test('records read as p.x.name (R-FA-3)', () => {
        expect(ev('forall p in (forall x, y in S such that x.p < y.p) : p.x.name + p.y.name')).toEqual(['ab', 'ac', 'bc']);
    });

    test('one variable keeps returning the element itself', () => {
        expect(ev('forall x in AB such that x.p > 1')).toEqual([b]);
    });

    test('an array projection stays one element: one level is flattened', () => {
        expect(ev('forall x in [1, 2], y in [3] : [x, y]')).toEqual([[1, 3], [2, 3]]);
    });

    test('the filter may refer to any variable', () => {
        expect(ev('forall x, y in AB such that x.p == 1 : x.name + y.name')).toEqual(['aa', 'ab']);
        expect(ev('forall x, y in AB such that y.p == 1 : x.name + y.name')).toEqual(['aa', 'ba']);
        expect(ev('forall x in AB, y in CD, z in [1, 2] such that z == 2 and y.name == "d" : x.name + y.name + z'))
            .toEqual(['ad2', 'bd2']);
    });

    test('`|` is the filter alias with several variables too', () => {
        expect(ev('forall x, y in AB | x != y : x.name + y.name')).toEqual(['ab', 'ba']);
    });
});

describe('exists over several variables (R-FA-4)', () => {
    test('same collection', () => {
        expect(ev('exists x, y in S such that x != y and x.name == y.name')).toBe(false);
        expect(ev('exists x, y in Dup such that x != y and x.name == y.name')).toBe(true);
    });

    test('two collections and a dependent one', () => {
        expect(ev('exists x in AB, y in CD such that x.p == 2 and y.name == "d"')).toBe(true);
        expect(ev('exists x in S, k in x.children such that k.name == "b1"')).toBe(true);
        expect(ev('exists x in S, k in x.children such that k.name == "c1"')).toBe(false);
    });

    test('stays equivalent to (forall ... such that P).isNotEmpty', () => {
        for (const p of ['x.p < y.p', 'x.p + y.p == 6', 'x.p + y.p == 7']) {
            expect(ev(`exists x, y in S such that ${p}`)).toBe((ev(`forall x, y in S such that ${p}`) as any[]).length > 0);
        }
    });

    test("':' is still refused", () => {
        expect(errorsOf('exists x, y in S : x')[0]).toMatch(/exists does not accept ':'/);
    });
});

describe('empty products and non-array collections', () => {
    test('an empty collection anywhere gives [] and false', () => {
        expect(ev('forall x in S, y in E : x')).toEqual([]);
        expect(ev('forall x, y in E : x')).toEqual([]);
        expect(ev('exists x in S, y in E such that true')).toBe(false);
        expect(ev('exists x in E, y in S such that true')).toBe(false);
    });

    test('a non-array first collection gives [] and false, as with one variable', () => {
        for (const coll of ['N', 'O', 'Str']) {
            expect(ev(`forall x in ${coll} : x`)).toEqual([]);
            expect(ev(`forall x in ${coll}, y in S : y`)).toEqual([]);
            expect(ev(`forall x, y in ${coll} : y`)).toEqual([]);
            expect(ev(`exists x in ${coll}, y in S such that true`)).toBe(false);
        }
    });

    test('a non-array collection that is not the first binding gives [] and false', () => {
        expect(ev('forall x in S, y in N : y')).toEqual([]);
        expect(ev('forall x in S, y in x.p : y')).toEqual([]);
        expect(ev('forall x in S, y in x.name such that true')).toEqual([]);
        expect(ev('exists x in S, y in x.p such that true')).toBe(false);
    });
});

describe('binding lists in the parser (R-FA-5)', () => {
    test('a repeated name is a parse error naming the variable', () => {
        expect(errorsOf('forall x, x in S : x')[0]).toMatch(/'x'/);
        expect(errorsOf('forall x in S, x in S : x')[0]).toMatch(/'x'/);
        expect(errorsOf('forall x in S, y, x in S : x')[0]).toMatch(/'x'/);
        expect(errorsOf('exists y, y in S such that true')[0]).toMatch(/'y'/);
        expect(errorsOf('forall x, x in S : x')[0]).toMatch(/twice/);
    });

    test('f(forall x in S, y) is not a binding: same error as before the change', () => {
        expect(errorsOf('f(forall x in S, y)')).toEqual(["forall requires 'such that' / '|' clause, ':' projection, or both"]);
        expect(errorsOf('exists x in S, y')).toEqual(["exists requires 'such that' or '|' followed by predicate"]);
    });

    test('a comma after the filter or the projection stays an argument separator', () => {
        const call = parsed('f(forall x in S : x, y)');
        expect(call.type).toBe('FunctionCall');
        expect(call.args.map((x: any) => x.type)).toEqual(['ForAll', 'Identifier']);
        expect(parsed('f(forall x in S such that x.p > 1, y)').args).toHaveLength(2);
        expect(parsed('f(exists x in S such that x.p > 1, y)').args).toHaveLength(2);
    });

    test('[forall x in S : x, y] is two elements', () => {
        const arr = parsed('[forall x in S : x, y]');
        expect(arr.type).toBe('ArrayLiteral');
        expect(arr.elements.map((x: any) => x.type)).toEqual(['ForAll', 'Identifier']);
    });

    test('a binding list inside a call is one argument', () => {
        const call = parsed('f(forall x in S, y in T : y, z)');
        expect(call.args).toHaveLength(2);
        expect(call.args[1]).toMatchObject({ type: 'Identifier', name: 'z' });
    });

    test('a comma followed by a name list ending in `in` continues the bindings', () => {
        expect(ev('forall x in [1], y, z in [2, 3] : x + y + z')).toEqual([5, 6, 6, 7]);
    });

    test('a same-collection list whose collection reads one of its own names is refused (discovery F2)', () => {
        expect(errorsOf('forall x, y in x.children : y')[0]).toMatch(/'x'/);
        // The last name of the list is bound after the collection, a lambda rebinds its own: both fine.
        expect(errorsOf('forall x, y in y.children : y')).toEqual([]);
        expect(errorsOf('forall x, y in S.filter(x => x.p > 1) : y')).toEqual([]);
        expect(ev('forall x, y in S.filter(x => x.p > 2) : x.name + y.name')).toEqual(['cc']);
    });

    test('desugared shape: flatten over a one-variable forall, no new node (R-FA-6)', () => {
        const ast = parsed('forall x, y in S : x');
        expect(ast).toMatchObject({ type: 'MethodCall', method: 'flatten', args: [] });
        expect(ast.object).toMatchObject({ type: 'ForAll', variable: 'x', projection: { type: 'ForAll', variable: 'y' } });
        expect(parsed('exists x, y in S such that true')).toMatchObject({
            type: 'Exists', variable: 'x', predicate: { type: 'Exists', variable: 'y', predicate: { type: 'Literal', value: true } },
        });
    });
});

describe('one variable: the AST is unchanged', () => {
    // Captured on HEAD 17beac16c, before the change.
    const FORALL = '{"type":"ForAll","variable":"a","collection":{"type":"Identifier","name":"S","location":{"start":{"line":1,"column":13,"offset":12},"end":{"line":1,"column":13,"offset":13}}},"filter":{"type":"Binary","operator":">","left":{"type":"MemberAccess","object":{"type":"Identifier","name":"a","location":{"start":{"line":1,"column":25,"offset":24},"end":{"line":1,"column":25,"offset":25}}},"property":"p","location":{"start":{"line":1,"column":25,"offset":24},"end":{"line":1,"column":27,"offset":27}}},"right":{"type":"Literal","value":1,"dataType":"EInt","location":{"start":{"line":1,"column":31,"offset":30},"end":{"line":1,"column":31,"offset":31}}},"location":{"start":{"line":1,"column":25,"offset":24},"end":{"line":1,"column":31,"offset":31}}},"projection":{"type":"MemberAccess","object":{"type":"Identifier","name":"a","location":{"start":{"line":1,"column":35,"offset":34},"end":{"line":1,"column":35,"offset":35}}},"property":"name","location":{"start":{"line":1,"column":35,"offset":34},"end":{"line":1,"column":37,"offset":40}}},"location":{"start":{"line":1,"column":1,"offset":0},"end":{"line":1,"column":37,"offset":40}}}';
    const EXISTS = '{"type":"Exists","variable":"a","collection":{"type":"Identifier","name":"S","location":{"start":{"line":1,"column":13,"offset":12},"end":{"line":1,"column":13,"offset":13}}},"predicate":{"type":"Binary","operator":">","left":{"type":"MemberAccess","object":{"type":"Identifier","name":"a","location":{"start":{"line":1,"column":25,"offset":24},"end":{"line":1,"column":25,"offset":25}}},"property":"p","location":{"start":{"line":1,"column":25,"offset":24},"end":{"line":1,"column":27,"offset":27}}},"right":{"type":"Literal","value":1,"dataType":"EInt","location":{"start":{"line":1,"column":31,"offset":30},"end":{"line":1,"column":31,"offset":31}}},"location":{"start":{"line":1,"column":25,"offset":24},"end":{"line":1,"column":31,"offset":31}}},"location":{"start":{"line":1,"column":1,"offset":0},"end":{"line":1,"column":31,"offset":31}}}';

    test('forall', () => {
        expect(JSON.stringify(parsed('forall a in S such that a.p > 1 : a.name'))).toBe(FORALL);
    });

    test('exists', () => {
        expect(JSON.stringify(parsed('exists a in S such that a.p > 1'))).toBe(EXISTS);
    });
});

describe('autocomplete: the variables a binding list binds are offered', () => {
    test('every name of both spellings, in order, once', () => {
        expect(boundVariablesBefore('forall x, y in S such that ')).toEqual(['x', 'y']);
        expect(boundVariablesBefore('forall x in A, y in B : ')).toEqual(['x', 'y']);
        expect(boundVariablesBefore('forall x in A, y, z in x.children | ')).toEqual(['x', 'y', 'z']);
        expect(boundVariablesBefore('EXISTS a, b in S | ')).toEqual(['a', 'b']);
        expect(boundVariablesBefore('forall c in classes : c.name + (forall c in S : ')).toEqual(['c']);
    });

    test('nothing without a binder', () => {
        expect(boundVariablesBefore('')).toEqual([]);
        expect(boundVariablesBefore('x in S')).toEqual([]);
        expect(boundVariablesBefore('forall x')).toEqual([]);
        expect(boundVariablesBefore('f(a, b) + c')).toEqual([]);
    });
});

describe('autocomplete: context and identifier provider over several variables', () => {
    const at = (src: string) => detectJjelContext(src, src.length);

    test('`forall x, y in |` and `forall x in A, y in |` are the context of `forall x in |`', () => {
        expect(at('forall x in ').parseContext).toBe('after-forall-in');
        expect(at('forall x, y in ').parseContext).toBe('after-forall-in');
        expect(at('forall x, y in Cl').parseContext).toBe('after-forall-in');
        expect(at('forall x in A, y in ').parseContext).toBe('after-forall-in');
        expect(at('forall x in A, y, z in ').parseContext).toBe('after-forall-in');
        expect(at('forall x in A.b, y in B').parseContext).toBe('after-forall-in');
    });

    test('a comma that does not continue a forall list is not that context', () => {
        expect(at('f(a, b) + ').parseContext).toBe('top-level');
        expect(at('forall x in A : f(a, b').parseContext).toBe('partial-word');
        expect(at('forall x, in ').parseContext).toBe('top-level');
        expect(at('a, b in ').parseContext).toBe('top-level');
    });

    test('the provider offers x and y after `forall x, y in S such that `', () => {
        const names = getJjelIdentifierSuggestions(at('forall x, y in S such that '))
            .filter(s => s.metadata?.jjelKind === 'variable').map(s => s.text);
        expect(names).toEqual(['x', 'y']);
        const prefixed = getJjelIdentifierSuggestions(at('forall xa in A, yb in B : y'))
            .filter(s => s.metadata?.jjelKind === 'variable').map(s => s.text);
        expect(prefixed).toEqual(['yb']);
    });
});
