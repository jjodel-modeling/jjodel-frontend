/**
 * `is` on model instances has kind-of semantics (SPEC §5.8, P-2026-11-13-1305, jjodel-lanes#912).
 *
 * An instance is a T when its class, or a supertype of that class, is named T. The instance records
 * are shaped as `buildEvalContext` builds them (jjscript/executor/commands/eval.ts): `__type: 'Object'`,
 * no `className`, `instanceOf` and `instanceof` on the shared class shell, whose `superTypes` holds the
 * direct supertypes only. The L proxy is a duck-typed stand-in for what the Console's JjEL mode binds to
 * `data`: `className` is the D-name `'DObject'` (root CLAUDE.md §3.13) and `instanceof` is the class,
 * whose parents are under `extends`.
 *
 * Measure behind it: docs/discovery/discovery_2026-11-13_jjel_is_on_model_instances.md §3.
 */
import { describe, it, expect } from 'vitest';
import { jjelEval } from '../index';
import type { JjelValue } from '../index';

function shell(name: string, superTypes: any[] = []): any {
    return { __type: 'Class', className: 'DClass', name, superTypes, subTypes: [], instances: [], allInstances: [], instanceCount: 0 };
}
function instance(id: string, cls: any): any {
    return { id, __type: 'Object', name: id, instanceOf: cls, instanceof: cls };
}

/** Base <- Sub <- Leaf, and an unrelated Other. */
function hierarchy(): Record<string, JjelValue> {
    const Base = shell('Base');
    const Sub = shell('Sub', [Base]);
    const Leaf = shell('Leaf', [Sub]);
    const Other = shell('Other');
    return { Base, Sub, Leaf, Other, o: instance('o', Sub), l: instance('l', Leaf), u: instance('u', Other) };
}

const is = (expr: string, vars: Record<string, JjelValue> = hierarchy()) => jjelEval(expr, vars);

describe('`is` on model instances is kind-of (P-2026-11-13-1305)', () => {
    it('an instance is its own class (kills: no read of instanceOf)', () => {
        expect(is('o is Sub')).toBe(true);
    });

    it('an instance of a subclass is its superclass (kills: the class itself only)', () => {
        expect(is('o is Base')).toBe(true);
    });

    it('an instance of a grandchild is the grandparent (kills: one level of superTypes only)', () => {
        expect(is('l is Base')).toBe(true);
        expect(is('l is Sub')).toBe(true);
    });

    it('an instance is not an unrelated class, nor a subclass of its own (negative control)', () => {
        expect(is('o is Other')).toBe(false);
        expect(is('o is Leaf')).toBe(false);
        expect(is('u is Base')).toBe(false);
    });

    it('a name that is no class answers false', () => {
        expect(is('o is Nope')).toBe(false);
    });

    it('a cycle in superTypes terminates (kills: a walk without a visited set)', () => {
        const A = shell('A');
        const B = shell('B', [A]);
        A.superTypes.push(B);
        const vars = { A, B, a: instance('a', A) };
        expect(is('a is B', vars)).toBe(true);
        expect(is('a is Nope', vars)).toBe(false);
    });

    it('a class is not an instance of its supertype: `Sub is Base` is false', () => {
        expect(is('Sub is Base')).toBe(false);
    });

    it('a class is still a DClass and a Class', () => {
        expect(is('Sub is DClass')).toBe(true);
        expect(is('Sub is Class')).toBe(true);
    });

    it('an instance is still an Object, and primitives keep their answers', () => {
        expect(is('o is Object')).toBe(true);
        expect(is('"s" is String')).toBe(true);
        expect(is('3 is Integer')).toBe(true);
        expect(is('3 is String')).toBe(false);
        expect(is('[1] is Array')).toBe(true);
    });

    it('an L proxy of an instance walks instanceof and extends (kills: superTypes only)', () => {
        const lBase = new Proxy({ className: 'DClass', id: 'c_Base', name: 'Base', extends: [] }, {});
        const lSub = new Proxy({ className: 'DClass', id: 'c_Sub', name: 'Sub', extends: [lBase] }, {});
        const data = new Proxy({ className: 'DObject', id: 'o', name: 'o', instanceof: lSub }, {});
        const vars = { data: data as unknown as JjelValue };
        expect(is('data is Sub', vars)).toBe(true);
        expect(is('data is Base', vars)).toBe(true);
        expect(is('data is DObject', vars)).toBe(true);
        expect(is('data is Other', vars)).toBe(false);
    });
});
