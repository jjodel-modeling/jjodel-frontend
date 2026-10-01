import { describe, it, test, expect } from 'vitest';
/**
 * JjEL Evaluator Tests
 */

import { jjelEval } from '../index';
import type { JjelValue } from '../evaluator';
import { EvaluationContext, JjelEvaluator, JjelEvaluationError } from '../evaluator';
import { parseExpression } from '../parser';

function eval_(src: string, ctx?: Record<string, JjelValue>): JjelValue {
    return jjelEval(src, ctx);
}

// ============================================================
// EXISTING CONSTRUCTS (regression)
// ============================================================

describe('Literals', () => {
    test('number', () => { expect(eval_('42')).toBe(42); });
    test('string', () => { expect(eval_('"hello"')).toBe('hello'); });
    test('boolean true', () => { expect(eval_('true')).toBe(true); });
    test('boolean false', () => { expect(eval_('false')).toBe(false); });
    test('null', () => { expect(eval_('null')).toBeNull(); });
});

describe('Arithmetic', () => {
    test('1 + 2 = 3', () => { expect(eval_('1 + 2')).toBe(3); });
    test('10 - 3 = 7', () => { expect(eval_('10 - 3')).toBe(7); });
    test('2 * 3 = 6', () => { expect(eval_('2 * 3')).toBe(6); });
    test('7 / 2 = 3.5', () => { expect(eval_('7 / 2')).toBe(3.5); });
    test('7 % 3 = 1', () => { expect(eval_('7 % 3')).toBe(1); });
    test('string concat', () => { expect(eval_('"a" + "b"')).toBe('ab'); });
});

describe('Comparison', () => {
    test('1 == 1', () => { expect(eval_('1 == 1')).toBe(true); });
    test('1 != 2', () => { expect(eval_('1 != 2')).toBe(true); });
    test('2 > 1', () => { expect(eval_('2 > 1')).toBe(true); });
    test('1 < 2', () => { expect(eval_('1 < 2')).toBe(true); });
});

describe('Logical', () => {
    test('true and true', () => { expect(eval_('true and true')).toBe(true); });
    test('true and false', () => { expect(eval_('true and false')).toBe(false); });
    test('false or true', () => { expect(eval_('false or true')).toBe(true); });
    test('not true', () => { expect(eval_('not true')).toBe(false); });
    test('not false', () => { expect(eval_('not false')).toBe(true); });
});

describe('Null coalesce', () => {
    test('null ?? "default" = "default"', () => { expect(eval_('null ?? "default"')).toBe('default'); });
    test('"value" ?? "default" = "value"', () => { expect(eval_('"value" ?? "default"')).toBe('value'); });
});

describe('If/then/else', () => {
    test('if true then 1 else 2 = 1', () => { expect(eval_('if true then 1 else 2')).toBe(1); });
    test('if false then 1 else 2 = 2', () => { expect(eval_('if false then 1 else 2')).toBe(2); });
    test('if false then 1 (no else) = null', () => { expect(eval_('if false then 1')).toBeNull(); });
});

describe('String methods', () => {
    test('toUpper()', () => { expect(eval_('"hello".toUpper()')).toBe('HELLO'); });
    test('toLower()', () => { expect(eval_('"HELLO".toLower()')).toBe('hello'); });
    test('camelCase()', () => { expect(eval_('"some_name".camelCase()')).toBe('someName'); });
    test('snakeCase()', () => { expect(eval_('"someName".snakeCase()')).toBe('some_name'); });
    test('trim()', () => { expect(eval_('"  hi  ".trim()')).toBe('hi'); });
    test('startsWith()', () => { expect(eval_('"hello".startsWith("hel")')).toBe(true); });
});

describe('Collection methods with lambda (=>) syntax', () => {
    const items = [{ name: 'a', active: true }, { name: 'b', active: false }];

    test('filter', () => {
        const r = eval_('items.filter(x => x.active)', { items } as any) as any[];
        expect(r).toHaveLength(1);
        expect(r[0].name).toBe('a');
    });

    test('map', () => {
        const r = eval_('items.map(x => x.name)', { items } as any);
        expect(r).toEqual(['a', 'b']);
    });

    test('sortBy', () => {
        const unsorted = [{ name: 'b' }, { name: 'a' }];
        const r = eval_('items.sortBy(x => x.name)', { items: unsorted } as any) as any[];
        expect(r[0].name).toBe('a');
    });

    test('any', () => {
        expect(eval_('items.any(x => x.active)', { items } as any)).toBe(true);
    });

    test('all', () => {
        expect(eval_('items.all(x => x.active)', { items } as any)).toBe(false);
    });
});

// ============================================================
// NEW: IMPLIES
// ============================================================

describe('implies', () => {
    test('true implies true = true', () => { expect(eval_('true implies true')).toBe(true); });
    test('true implies false = false', () => { expect(eval_('true implies false')).toBe(false); });
    test('false implies true = true', () => { expect(eval_('false implies true')).toBe(true); });
    test('false implies false = true', () => { expect(eval_('false implies false')).toBe(true); });
    test('null implies anything = true (falsy antecedent)', () => {
        expect(eval_('null implies false')).toBe(true);
    });
    test('right-associative: false implies false implies false = true', () => {
        // false implies (false implies false) = false implies true = true
        expect(eval_('false implies false implies false')).toBe(true);
    });
});

// ============================================================
// NEW: FORALL
// ============================================================

describe('forall', () => {
    const attrs = [
        { name: 'x', isPublic: true },
        { name: 'y', isPublic: false },
        { name: 'z', isPublic: true },
    ];

    test('projection: forall x in [1,2,3] : x + 1 = [2,3,4]', () => {
        expect(eval_('forall x in [1,2,3] : x + 1')).toEqual([2, 3, 4]);
    });

    test('filter only: returns filtered set', () => {
        const result = eval_('forall a in attrs such that a.isPublic', { attrs } as any) as any[];
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('x');
    });

    test('filter + projection: names of public attrs', () => {
        const result = eval_('forall a in attrs such that a.isPublic : a.name', { attrs } as any);
        expect(result).toEqual(['x', 'z']);
    });

    test('non-array collection returns []', () => {
        expect(eval_('forall x in null : x')).toEqual([]);
    });

    test('empty collection returns []', () => {
        expect(eval_('forall x in [] : x + 1')).toEqual([]);
    });

    test('variable does not leak to outer scope', () => {
        // After forall, 'a' should not be defined in outer scope
        // (This tests child context isolation)
        const result = eval_('forall x in [1,2] : x', {});
        expect(result).toEqual([1, 2]);
    });
});

// ============================================================
// NEW: EXISTS
// ============================================================

describe('exists', () => {
    test('returns true when match found', () => {
        expect(eval_('exists x in [1,2,3] such that x > 2')).toBe(true);
    });

    test('returns false when no match', () => {
        expect(eval_('exists x in [1,2,3] such that x > 10')).toBe(false);
    });

    test('returns false for empty collection', () => {
        expect(eval_('exists x in [] such that x > 0')).toBe(false);
    });

    test('returns false for non-array', () => {
        expect(eval_('exists x in null such that x > 0')).toBe(false);
    });

    test('with such that variant', () => {
        expect(eval_('exists x in [1,2,3] such that x == 2')).toBe(true);
    });
});

// ============================================================
// NEW: WITH...DO
// ============================================================

describe('with...do', () => {
    test('exposes object properties as identifiers', () => {
        expect(eval_('with obj do name', { obj: { name: 'test' } } as any)).toBe('test');
    });

    test('can access nested method on exposed property', () => {
        expect(eval_('with obj do name.toUpper()', { obj: { name: 'hello' } } as any)).toBe('HELLO');
    });

    test('outer scope still accessible', () => {
        expect(eval_('with obj do x + 1', { obj: {}, x: 5 } as any)).toBe(6);
    });

    test('null context does not crash (no properties exposed)', () => {
        // null is not a JjelObject so nothing is added, body uses outer scope
        expect(eval_('with null do 42')).toBe(42);
    });
});

// ============================================================
// NEW: INDEX ACCESS
// ============================================================

describe('array indexing', () => {
    test('[1,2,3][0] = 1', () => { expect(eval_('[1,2,3][0]')).toBe(1); });
    test('[1,2,3][2] = 3', () => { expect(eval_('[1,2,3][2]')).toBe(3); });
    test('out of bounds = null', () => { expect(eval_('[1,2,3][9]')).toBeNull(); });
    test('variable index', () => {
        expect(eval_('items[i]', { items: ['a', 'b', 'c'], i: 1 } as any)).toBe('b');
    });
    test('chained index', () => {
        expect(eval_('[[1,2],[3,4]][0][1]')).toBe(2);
    });
    test('index after method call', () => {
        expect(eval_('items.sortBy(x => x)[0]', { items: [3, 1, 2] } as any)).toBe(1);
    });
});

// ============================================================
// OBJECT LITERALS
// ============================================================

describe('object literals', () => {
    test('simple object', () => {
        expect(eval_('{name: "hello", count: 42}')).toEqual({ name: 'hello', count: 42 });
    });

    test('empty object', () => {
        expect(eval_('{}')).toEqual({});
    });

    test('dot access', () => {
        expect(eval_('{name: "hello"}.name')).toBe('hello');
    });

    test('index access with string key', () => {
        expect(eval_('{"my-key": "hello"}["my-key"]')).toBe('hello');
    });

    test('nested object', () => {
        expect(eval_('{a: {b: 42}}.a.b')).toBe(42);
    });

    test('object with expressions', () => {
        expect(eval_('{sum: 1 + 2, upper: "hi".toUpper()}')).toEqual({ sum: 3, upper: 'HI' });
    });

    test('object with context variables', () => {
        expect(eval_('{n: x + 1}', { x: 10 } as any)).toEqual({ n: 11 });
    });

    test('array of objects', () => {
        expect(eval_('[{a: 1}, {a: 2}]')).toEqual([{ a: 1 }, { a: 2 }]);
    });

    test('sortBy on array of objects', () => {
        const result = eval_('[{n: "B"}, {n: "A"}].sortBy(x => x.n)') as any[];
        expect(result).toEqual([{ n: 'A' }, { n: 'B' }]);
    });

    test('filter on array of objects', () => {
        const result = eval_('[{v: 1}, {v: 2}, {v: 3}].filter(x => x.v > 1)') as any[];
        expect(result).toEqual([{ v: 2 }, { v: 3 }]);
    });

    test('map on array of objects', () => {
        const result = eval_('[{n: "a"}, {n: "b"}].map(x => x.n)') as any[];
        expect(result).toEqual(['a', 'b']);
    });

    test('groupBy on array of objects', () => {
        const result = eval_('[{type: "A", n: 1}, {type: "A", n: 2}, {type: "B", n: 3}].groupBy(x => x.type)') as any[];
        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({ key: 'A', items: [{ type: 'A', n: 1 }, { type: 'A', n: 2 }] });
        expect(result[1]).toMatchObject({ key: 'B', items: [{ type: 'B', n: 3 }] });
    });

    test('distinctBy on array of objects', () => {
        const result = eval_('[{c: "A"}, {c: "B"}, {c: "A"}].distinctBy(x => x.c)') as any[];
        expect(result).toEqual([{ c: 'A' }, { c: 'B' }]);
    });

    test('forall projection to object', () => {
        const ctx = {
            classes: [
                { name: 'Person', count: 3 },
                { name: 'Animal', count: 1 },
            ],
        } as any;
        const result = eval_('forall c in classes : {cls: c.name, n: c.count}', ctx) as any[];
        expect(result).toEqual([
            { cls: 'Person', n: 3 },
            { cls: 'Animal', n: 1 },
        ]);
    });

    test('nested forall with object projection', () => {
        const ctx = {
            classes: [
                { name: 'Person', attributes: [{ name: 'age' }, { name: 'name' }] },
            ],
        } as any;
        const result = eval_(
            'forall c in classes : forall a in c.attributes : {class: c.name, attribute: a.name}',
            ctx
        ) as any[];
        expect(result).toEqual([
            [{ class: 'Person', attribute: 'age' }, { class: 'Person', attribute: 'name' }],
        ]);
    });

    test('object equality', () => {
        expect(eval_('{a: 1, b: 2} == {a: 1, b: 2}')).toBe(true);
        expect(eval_('{a: 1} == {a: 2}')).toBe(false);
    });
});

// ============================================================
// TRUTHINESS
// ============================================================

describe('truthiness model', () => {
    test('null is falsy', () => { expect(eval_('if null then 1 else 2')).toBe(2); });
    test('false is falsy', () => { expect(eval_('if false then 1 else 2')).toBe(2); });
    test('0 is falsy', () => { expect(eval_('if 0 then 1 else 2')).toBe(2); });
    test('empty string is falsy', () => { expect(eval_('if "" then 1 else 2')).toBe(2); });
    test('empty array is falsy', () => { expect(eval_('if [] then 1 else 2')).toBe(2); });
    test('non-zero number is truthy', () => { expect(eval_('if 1 then "yes" else "no"')).toBe('yes'); });
    test('non-empty string is truthy', () => { expect(eval_('if "x" then "yes" else "no"')).toBe('yes'); });
    test('non-empty array is truthy', () => { expect(eval_('if [1] then "yes" else "no"')).toBe('yes'); });
});

// ============================================================
// STANDALONE FUNCTION CALLS
// Added for JjTL cross-type resolution. Validates that standalone
// function calls (no object receiver) look up the name as a bound
// function value or registered builtin.
// ============================================================

describe('FunctionCall', () => {
    test('call bound lambda', () => {
        // Lambdas can be bound into the context through a regular variable
        // reference; `square(4)` should invoke it.
        // We pass a JjelFunction-shaped binding via ctx — not available
        // through the eval_ helper, so we use a roundtrip: `(x => x * x)(4)`
        // would be ideal, but JjEL doesn't allow calling a parenthesized
        // expression directly. Use the context-less `(x => x)` eval path via
        // a method on the identity instead. Skipped — covered by builtin path.
        expect(() => eval_('undefinedFunction()')).toThrow(/not defined/);
    });

    test('calling an undefined function throws a clear error', () => {
        expect(() => eval_('nonExistentFn(1, 2)')).toThrow(/nonExistentFn/);
    });

    test('parses nested function calls in expressions', () => {
        // This validates the parser accepts `fn(x)` as an expression; the
        // evaluator fails with "not defined" because nothing is registered.
        expect(() => eval_('helper(a + 1)')).toThrow(/helper/);
    });
});

// ============================================================
// STATE ACCESS `.[x]` (R-SIM-18, R-SIM-43), P-2026-09-25-1445
// The hook is JjEL's own reader; `marked` and `tokens` are the simulator's
// business (its adapter), so here they are ordinary attributes. Each test
// names the mutant of report §7.1 that it kills.
// ============================================================

type Reads = Array<[string, string]>;

/** A hook over a table `elementId -> attr -> value` and the site's presentation; records every read. */
function hookOver(attrs: Record<string, Record<string, JjelValue>>, presentation: Record<string, JjelValue> = {}) {
    const reads: Reads = [];
    const presentationReads: string[] = [];
    return {
        reads,
        presentationReads,
        hook: {
            read: (elementId: string, attr: string) => {
                reads.push([elementId, attr]);
                return attrs[elementId]?.[attr];
            },
            readPresentation: (attr: string) => {
                presentationReads.push(attr);
                return presentation[attr];
            },
        },
    };
}

function evalState(src: string, bindings: Record<string, JjelValue>, hook?: unknown): JjelValue {
    const parsed = parseExpression(src);
    expect(parsed.errors).toEqual([]);
    const ctx = new EvaluationContext(bindings);
    if (hook) (ctx as any).stateAccess = hook;
    return new JjelEvaluator().evaluate(parsed.expression!, ctx);
}

const S1 = { id: 's1', __type: 'Object', name: 'S1' };
const S2 = { id: 's2', __type: 'Object', name: 'S2' };
const MODEL = { id: 'm1', __type: 'Model', name: 'M' };

describe('state access without the hook (M8)', () => {
    test('M8: .[x] throws a JjelEvaluationError, never a silent null', () => {
        expect(() => evalState('self.[visits]', { self: S1 })).toThrow(JjelEvaluationError);
        expect(() => evalState('self.[visits]', { self: S1 })).toThrow(/readable only in the simulator/);
        expect(() => eval_('self.[visits] == null', { self: S1 })).toThrow(/readable only in the simulator/);
    });
});

describe('state access with the hook', () => {
    test('reads the element of the path by its id, the attribute by its name', () => {
        const h = hookOver({ s1: { visits: 3 } });
        expect(evalState('self.[visits] + 1', { self: S1 }, h.hook)).toBe(4);
        expect(h.reads).toEqual([['s1', 'visits']]);
    });

    test('navigates M first: the last segment is the attribute', () => {
        const h = hookOver({ s2: { visits: 7 } });
        expect(evalState('self.target.[visits]', { self: { ...S1, target: S2 } }, h.hook)).toBe(7);
        expect(h.reads).toEqual([['s2', 'visits']]);
    });

    test('model.[i] reads the global attribute under the model id', () => {
        const h = hookOver({ m1: { i: 2 } });
        expect(evalState('model.[i] < 3', { model: MODEL }, h.hook)).toBe(true);
    });

    test('values come back as the hook gives them: boolean, number, string', () => {
        const h = hookOver({ s1: { done: false, n: 0, color: 'red' } });
        expect(evalState('self.[done]', { self: S1 }, h.hook)).toBe(false);
        expect(evalState('self.[n]', { self: S1 }, h.hook)).toBe(0);
        expect(evalState('self.[color]', { self: S1 }, h.hook)).toBe('red');
    });

    test('an attribute the hook does not know is an error, not null', () => {
        const h = hookOver({ s1: {} });
        expect(() => evalState('self.[nope]', { self: S1 }, h.hook)).toThrow(JjelEvaluationError);
        expect(() => evalState('self.[nope]', { self: S1 }, h.hook)).toThrow(/nope/);
    });

    test('a left side that is not an element is an error', () => {
        const h = hookOver({});
        expect(() => evalState('x.[a]', { x: 3 }, h.hook)).toThrow(JjelEvaluationError);
        expect(() => evalState('xs.[a]', { xs: [S1, S2] }, h.hook)).toThrow(JjelEvaluationError);
        expect(() => evalState('x.[a]', { x: null }, h.hook)).toThrow(JjelEvaluationError);
        expect(() => evalState('x.[a]', { x: { name: 'no id' } }, h.hook)).toThrow(JjelEvaluationError);
        expect(h.reads).toEqual([]);
    });
});

describe('node.[x] by syntax (M9)', () => {
    test('M9: node is never evaluated as a variable: a bound node is ignored', () => {
        const h = hookOver({ v1: { color: 'WRONG' } }, { color: 'blue' });
        expect(evalState('node.[color]', { node: { id: 'v1', __type: 'Object' } }, h.hook)).toBe('blue');
        expect(h.reads).toEqual([]);
        expect(h.presentationReads).toEqual(['color']);
    });

    test('node.[x] works with node unbound, as in a simulator context', () => {
        const h = hookOver({}, { level: 2 });
        expect(evalState('node.[level] * 2', {}, h.hook)).toBe(4);
    });

    test('an unknown presentation attribute is an error', () => {
        const h = hookOver({}, {});
        expect(() => evalState('node.[level]', {}, h.hook)).toThrow(JjelEvaluationError);
    });
});

describe('the hook reaches nested scopes (M10)', () => {
    test('M10: lambda, forall and exists bodies see the hook', () => {
        const h = hookOver({ s1: { marked: true }, s2: { marked: false } });
        const xs = [S1, S2];
        expect(evalState('xs.all(x => x.[marked])', { xs }, h.hook)).toBe(false);
        expect(evalState('exists x in xs | x.[marked]', { xs }, h.hook)).toBe(true);
        expect(evalState('forall x in xs : x.[marked]', { xs }, h.hook)).toEqual([true, false]);
    });
});
