import { describe, it, expect } from 'vitest';
import { parse } from '../parser/parser';
import { extractDependencies, ElementDependency } from '../executor/dependencies';

/**
 * The `required` flag on a superclass dependency, which decides whether the executor waits.
 *
 * `waitForDependencies` polls only the dependencies marked required and returns immediately
 * when there are none (`elementWaiter.ts:51-56`), so this flag is the whole difference between
 * «the class the previous line created is visible» and «it is not». Superclasses of a `create`
 * were `required: false`, which is why `create class Cache extends Register` one line under
 * `create class Register` was refused with the superclass not found while the class was on the
 * canvas. Both reproductions and the mechanism are in
 * `docs/discovery/discovery_2026-09-17_superclass_same_script_race.md`.
 *
 * Driven through `parse` rather than hand-built args on purpose: the parser fills BOTH
 * `superClass` and `superClasses` for one clause, so args written by hand would test a shape
 * the executor never sees.
 */
function depsOf(source: string): ElementDependency[] {
    const result = parse(source);
    expect(result.success, `failed to parse: ${source}`).toBe(true);
    expect(result.ast, `no ast for: ${source}`).toBeTruthy();
    return extractDependencies(result.ast!);
}

function superclassDeps(source: string): ElementDependency[] {
    return depsOf(source).filter(d => d.role === 'superclass');
}

describe('extractDependencies — the superclass is waited for', () => {
    it('marks the superclass of `create class A extends B` required', () => {
        const deps = superclassDeps('create class Cache extends Register');
        expect(deps.length).toBeGreaterThan(0);
        expect(deps.every(d => d.required)).toBe(true);
        expect(deps.some(d => d.name.segments.includes('Register'))).toBe(true);
    });

    it('marks it required for an abstract class and for an interface too', () => {
        for (const source of [
            'create abstract class Cache extends Register',
            'create interface Cache extends Register',
        ]) {
            const deps = superclassDeps(source);
            expect(deps.length, source).toBeGreaterThan(0);
            expect(deps.every(d => d.required), source).toBe(true);
        }
    });

    it('marks EVERY superclass required, not only the last one the parser kept', () => {
        const deps = superclassDeps('create class ALU extends Cache extends Register');
        const names = deps.map(d => d.name.segments.join('::'));
        expect(names).toContain('Cache');
        expect(names).toContain('Register');
        expect(deps.every(d => d.required)).toBe(true);
    });

    it('leaves an element type that takes no extends clause alone', () => {
        // The option parser accepts `extends` after any `create`, but only a class, an abstract
        // class and an interface do anything with it, so an enum must not make the run wait.
        const deps = superclassDeps('create enum Color extends Register');
        expect(deps.length).toBeGreaterThan(0);
        expect(deps.every(d => d.required)).toBe(false);
    });

    it('leaves the type-reference role untouched', () => {
        // Same race is plausible for `type`, but it is not this lane's subject and widening the
        // wait would change the timing of every attribute in every script.
        const deps = depsOf('create attribute stage in Pipeline type PipelineStage')
            .filter(d => d.role === 'type-reference');
        expect(deps.length).toBeGreaterThan(0);
        expect(deps.every(d => d.required)).toBe(false);
    });

    it('keeps the parent of a nested element required, as it already was', () => {
        const deps = depsOf('create attribute name in Person type String')
            .filter(d => d.role === 'parent');
        expect(deps.length).toBeGreaterThan(0);
        expect(deps.every(d => d.required)).toBe(true);
    });

    it('keeps the standalone `A extends B` required, as it already was', () => {
        const deps = superclassDeps('ALU extends FunctionalUnit');
        expect(deps.length).toBeGreaterThan(0);
        expect(deps.every(d => d.required)).toBe(true);
    });

    it('marks the superclass of an `add` required too: it becomes a create', () => {
        // `add` is converted to a `create` with parent = to before execution (`commands/add.ts`),
        // so its superclass runs the same resolution and must be waited for the same way. The
        // options sit after the target: `add <type> <name> to <qn> extends <qn>`.
        const deps = superclassDeps('add class Cache to MM extends Register');
        expect(deps.length).toBeGreaterThan(0);
        expect(deps.some(d => d.name.segments.includes('Register'))).toBe(true);
        expect(deps.every(d => d.required)).toBe(true);
    });
});
