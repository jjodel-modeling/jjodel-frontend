/**
 * matchIndexOf — WHICH rule wins on one element (slice 5, D8).
 *
 * `CompiledConditional` returns the resolved value and says nothing about where it
 * came from, which is exactly what the preview captions need. These tests pin the
 * contract of the helper that answers it, on the same draw fixtures the interpreter
 * tests use: executed, never read.
 *
 * Mutation bench declared with the slice: making the `{rules}` branch return the LAST
 * holding rule instead of the first kills «the FIRST holding rule wins» below, and
 * nothing else in this file.
 */
import { describe, it, expect } from 'vitest';
import { matchIndexOf } from '../irCompile';
import { makeDrawReadCtx } from '../irReadCtx';
import type { Conditional, Predicate } from '../irTypes';

/** s1: isInitial=true, kind='start'. s2: isInitial=false, kind='end'. */
function world() {
    const idlookup: Record<string, any> = {
        C_State: { id: 'C_State', name: 'State', extends: [] },
        A_isInitial: { id: 'A_isInitial', name: 'isInitial' },
        A_kind: { id: 'A_kind', name: 'kind' },
        s1: { id: 's1', name: 'obj_s1', instanceof: 'C_State', features: ['v1i', 'v1k'] },
        v1i: { id: 'v1i', instanceof: 'A_isInitial', values: [true] },
        v1k: { id: 'v1k', instanceof: 'A_kind', values: ['start'] },
        s2: { id: 's2', name: 'obj_s2', instanceof: 'C_State', features: ['v2i', 'v2k'] },
        v2i: { id: 'v2i', instanceof: 'A_isInitial', values: [false] },
        v2k: { id: 'v2k', instanceof: 'A_kind', values: ['end'] },
    };
    return makeDrawReadCtx(idlookup);
}

const isInitial: Predicate = { op: 'eq', left: '$isInitial.value', right: { kind: 'boolean', value: true } } as any;
const isNotInitial: Predicate = { op: 'eq', left: '$isInitial.value', right: { kind: 'boolean', value: false } } as any;
const kindIsStart: Predicate = { op: 'eq', left: '$kind.value', right: { kind: 'string', value: 'start' } } as any;
const always: Predicate = { op: 'literal', value: true } as any;

describe('matchIndexOf', () => {
    it('answers null for an absent axis', () => {
        expect(matchIndexOf(undefined, world(), 's1')).toBeNull();
    });

    it('answers null for a scalar axis: no rule won, the value IS the value', () => {
        expect(matchIndexOf('rect' as Conditional<string>, world(), 's1')).toBeNull();
        expect(matchIndexOf(7 as Conditional<number>, world(), 's1')).toBeNull();
    });

    it('answers 0 for a {when, then, else} whose predicate holds', () => {
        const c: Conditional<string> = { when: isInitial, then: 'circle', else: 'rect' };
        expect(matchIndexOf(c, world(), 's1')).toBe(0);
    });

    it('answers null for a {when, then, else} whose predicate does not hold', () => {
        const c: Conditional<string> = { when: isInitial, then: 'circle', else: 'rect' };
        expect(matchIndexOf(c, world(), 's2')).toBeNull();
    });

    it('answers the index of the holding rule in a {rules, default}', () => {
        const c: Conditional<string> = {
            rules: [{ when: isInitial, then: 'circle' }, { when: isNotInitial, then: 'diamond' }],
            default: 'rect',
        };
        expect(matchIndexOf(c, world(), 's1')).toBe(0);
        expect(matchIndexOf(c, world(), 's2')).toBe(1);
    });

    it('lets the FIRST holding rule win over a later one that also holds', () => {
        // Both rules hold on s1: isInitial is true AND kind is 'start'. First-match-wins
        // is what the canvas applies (compileConditional), so the index must be 0 —
        // a caption naming rule 1 would name a rule that did not paint the node.
        const c: Conditional<string> = {
            rules: [{ when: isInitial, then: 'circle' }, { when: kindIsStart, then: 'diamond' }],
            default: 'rect',
        };
        expect(matchIndexOf(c, world(), 's1')).toBe(0);
    });

    it('answers null when no rule holds, whatever the default', () => {
        const c: Conditional<string> = { rules: [{ when: kindIsStart, then: 'circle' }], default: 'rect' };
        expect(matchIndexOf(c, world(), 's2')).toBeNull();
        const noDefault: Conditional<string> = { rules: [{ when: kindIsStart, then: 'circle' }] };
        expect(matchIndexOf(noDefault, world(), 's2')).toBeNull();
    });

    it('answers null for the empty rules form, the shape D3 persists', () => {
        expect(matchIndexOf({ rules: [], default: 'rect' } as Conditional<string>, world(), 's1')).toBeNull();
    });

    it('resolves the same order compileConditional resolves', () => {
        // The two must agree: the value in force and the index reported for it come
        // from the same rule. A literal-true rule after a holding one is the case that
        // separates "first" from "any".
        const c: Conditional<string> = {
            rules: [{ when: isInitial, then: 'circle' }, { when: always, then: 'diamond' }],
            default: 'rect',
        };
        const i = matchIndexOf(c, world(), 's1');
        expect(i).toBe(0);
        expect((c as any).rules[i as number].then).toBe('circle');
        // s2 falls through to the literal-true rule, not to the default.
        expect(matchIndexOf(c, world(), 's2')).toBe(1);
    });
});
