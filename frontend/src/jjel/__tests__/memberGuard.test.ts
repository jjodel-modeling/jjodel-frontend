import { describe, test, expect } from 'vitest';
/**
 * JjEL member guard (R-GEN-29, P-2026-10-23-2105)
 *
 * `__proto__` and the names inherited from Object.prototype read as missing on
 * every member path (dot, `?.`, index, method call, interpolation holes); a
 * member read never yields a native function; builtin method tables answer own
 * keys only; an object literal key `__proto__` is an own key. Own attributes
 * named `constructor` or `toString` stay readable, and so do proxy and class
 * instance features that are not own properties.
 *
 * The rows of the discovery probe (discovery_2026-10-23_codegen_textmode_safety
 * §3.1) are the expectations of the first block.
 */

import { jjelEval, jjelEvalWithDiagnostics } from '../index';
import { parseTemplate } from '../parser/parser';
import { JjelEvaluator } from '../evaluator/evaluator';
import { EvaluationContext } from '../evaluator/context';
import {
    getCollectionMethod,
    getStringMethod,
    getNumberMethod,
    getDateMethod,
    getDateConstructor,
} from '../evaluator/builtins';

const INHERITED = ['constructor', 'toString', 'valueOf', 'hasOwnProperty', '__defineGetter__', '__proto__'];

function vars() {
    const x = { __type: 'Object', id: 'o1', name: 'A' };
    const own = {
        __type: 'Object', id: 'o2', name: 'B',
        constructor: 'C', toString: 'T', valueOf: 3,
        fn: function () { return 'called'; },
    };
    return { x, xs: [x], own, owns: [own] };
}

const ev = (src: string) => jjelEval(src, vars() as any);

/** A template body (holes on), as the code generator evaluates it. */
function tpl(src: string) {
    const { expression, errors } = parseTemplate(src);
    expect(errors).toEqual([]);
    const ctx = new EvaluationContext(vars() as any);
    return new JjelEvaluator(ctx).evaluate(expression!, ctx);
}

describe('The probe rows read as missing', () => {
    for (const src of ['x.constructor', 'x?.constructor', 'x["constructor"]', 'x.__proto__', 'x["__proto__"]',
        'x.toString', 'x.hasOwnProperty', 'x.__defineGetter__', 'x?.__proto__', '"a".constructor',
        'x.constructor["name"]', 'x.__proto__["__proto__"]']) {
        test(`${src} is null`, () => {
            expect(ev(src)).toBeNull();
        });
    }

    for (const name of INHERITED) {
        test(`x.${name}, x?.${name} and x["${name}"] are null`, () => {
            expect(ev(`x.${name}`)).toBeNull();
            expect(ev(`x?.${name}`)).toBeNull();
            expect(ev(`x["${name}"]`)).toBeNull();
        });
    }

    test('x.__proto__.constructor and x.constructor.name throw the null-receiver error', () => {
        expect(() => ev('x.__proto__.constructor')).toThrow(/of null/);
        expect(() => ev('x.constructor.name')).toThrow(/of null/);
    });

    test('x.constructor(), x.toString() and x.__proto__() throw the unknown-method error', () => {
        expect(() => ev('x.constructor()')).toThrow(/Unknown method 'constructor'/);
        expect(() => ev('x.toString()')).toThrow(/Unknown method 'toString'/);
        expect(() => ev('x.__defineGetter__()')).toThrow(/Unknown method '__defineGetter__'/);
        expect(() => ev('x.__proto__()')).toThrow(/Unknown method '__proto__'/);
    });

    test('xs.constructor still throws the collection-property error', () => {
        expect(() => ev('xs.constructor')).toThrow(/on a collection/);
    });

    test('an interpolation hole reads the same missing value', () => {
        const out = tpl('"${x.constructor} ${x.__proto__} ${x["toString"]}"');
        expect(out).toBe(tpl('"${x.nothing} ${x.nothing} ${x.nothing}"'));
        expect(String(out)).not.toMatch(/native code|function|\{\}/);
    });

    test('a blocked read pushes the property-not-found diagnostic', () => {
        const { value, warnings } = jjelEvalWithDiagnostics('x.constructor', vars() as any);
        expect(value).toBeNull();
        expect(warnings.some(w => w.kind === 'property-not-found' && w.identifier === 'constructor')).toBe(true);
    });
});

describe('No native function is invoked', () => {
    test('xs.map(x.toString) does not call Object.prototype.toString', () => {
        let out: unknown;
        try { out = ev('xs.map(x.toString)'); } catch { out = undefined; }
        expect(JSON.stringify(out ?? null)).not.toMatch(/\[object/);
    });

    test('"abc".replace("a", x.toString) replaces with null, not a native result', () => {
        expect(ev('"abc".replace("a", x.toString)')).toBe('nullbc');
    });

    test('an own function-valued attribute reads as null on every path', () => {
        expect(ev('own.fn')).toBeNull();
        expect(ev('own?.fn')).toBeNull();
        expect(ev('own["fn"]')).toBeNull();
        expect(() => ev('own.fn()')).toThrow(/Unknown method 'fn'/);
        expect(ev('"abc".replace("a", own.fn)')).toBe('nullbc');
    });

    test('a class-prototype method reads as null on every path', () => {
        class Element { id = 'e1'; method() { return 'called'; } }
        const e = new Element();
        expect(jjelEval('e.method', { e } as any)).toBeNull();
        expect(jjelEval('e["method"]', { e } as any)).toBeNull();
        expect(() => jjelEval('e.method()', { e } as any)).toThrow(/Unknown method 'method'/);
    });
});

describe('Own attributes with inherited names stay readable', () => {
    test('dot, ?. and index read the own value', () => {
        expect(ev('own.constructor')).toBe('C');
        expect(ev('own?.toString')).toBe('T');
        expect(ev('own["valueOf"]')).toBe(3);
    });

    test('the zero-argument dual form reads the own value', () => {
        expect(ev('own.toString()')).toBe('T');
        expect(ev('own.constructor()')).toBe('C');
    });

    test('ordinary attributes are unchanged', () => {
        expect(ev('x.name')).toBe('A');
        expect(ev('x["id"]')).toBe('o1');
        expect(tpl('"${x.name}-${own.constructor}"')).toBe('A-C');
    });
});

describe('Proxy and class-instance features stay readable', () => {
    const target = { __type: 'Object' };
    const features: Record<string, unknown> = { name: 'P', id: 'p1', size: 2 };
    const p = new Proxy(target, {
        has: (t, k) => k === '__isProxy' || (typeof k === 'string' && k in features) || k in t,
        get: (t, k) => {
            if (k === '__isProxy') return true;
            if (typeof k === 'string' && Object.prototype.hasOwnProperty.call(features, k)) return features[k];
            if (k === 'save') return () => 'saved';
            return (t as any)[k];
        },
    });

    test('a trap feature that is not an own key reads', () => {
        expect(jjelEval('p.name', { p } as any)).toBe('P');
        expect(jjelEval('p["id"]', { p } as any)).toBe('p1');
        expect(jjelEval('p.size()', { p } as any)).toBe(2);
    });

    test('an inherited name and a trap function read as null', () => {
        expect(jjelEval('p.constructor', { p } as any)).toBeNull();
        expect(jjelEval('p.save', { p } as any)).toBeNull();
    });

    test('a prototype getter of a class instance reads', () => {
        class Shell { get label() { return 'L'; } }
        expect(jjelEval('s.label', { s: new Shell() } as any)).toBe('L');
    });
});

describe('Builtin method tables answer own keys only', () => {
    const tables = { getCollectionMethod, getStringMethod, getNumberMethod, getDateMethod, getDateConstructor };

    for (const [label, get] of Object.entries(tables)) {
        test(`${label} answers no inherited Object.prototype member`, () => {
            for (const name of INHERITED) {
                const m = get(name);
                expect(m === undefined || m !== (Object.prototype as any)[name]).toBe(true);
            }
        });
    }

    test('only the number table owns one of these names: its own toString', () => {
        for (const name of INHERITED) {
            for (const get of [getCollectionMethod, getStringMethod, getDateMethod, getDateConstructor]) {
                expect(get(name)).toBeUndefined();
            }
            if (name !== 'toString') expect(getNumberMethod(name)).toBeUndefined();
        }
        expect(jjelEval('n.toString()', { n: 3 })).toBe('3');
    });

    test('positive control: each table still answers its own names', () => {
        expect(getCollectionMethod('map')).toBeTypeOf('function');
        expect(getStringMethod('replace')).toBeTypeOf('function');
        expect(getNumberMethod('abs')).toBeTypeOf('function');
        expect(getDateMethod('year')).toBeTypeOf('function');
        expect(getDateConstructor('now')).toBeTypeOf('function');
    });

    test('inherited method names on builtin receivers throw the unknown-method error', () => {
        expect(() => ev('"s".toString()')).toThrow(/Unknown method 'toString'/);
        expect(() => ev('"2026-01-01".valueOf()')).toThrow(/Unknown method 'valueOf'/);
        expect(() => ev('xs.constructor(1)')).toThrow(/Unknown method 'constructor'/);
        expect(() => jjelEval('n.valueOf()', { n: 3 })).toThrow(/Unknown method 'valueOf'/);
    });
});

describe('An object literal key __proto__ is an own key', () => {
    test('the literal keeps Object.prototype and owns the key', () => {
        const o = ev('{__proto__: x, a: 1}') as Record<string, unknown>;
        expect(Object.getPrototypeOf(o)).toBe(Object.prototype);
        expect(Object.keys(o)).toEqual(['__proto__', 'a']);
    });

    test('{__proto__: x}.id is null, not the id of x', () => {
        expect(ev('{__proto__: x}.id')).toBeNull();
    });

    test('{__proto__: x}.__proto__ is still a blocked name', () => {
        expect(ev('{__proto__: x}.__proto__')).toBeNull();
        expect(ev('{__proto__: x}["__proto__"]')).toBeNull();
    });
});
