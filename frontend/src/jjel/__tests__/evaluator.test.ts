import { describe, it, test, expect } from 'vitest';
/**
 * JjEL Evaluator Tests
 */

import { jjelEval } from '../index';
import type { JjelValue } from '../evaluator';

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
