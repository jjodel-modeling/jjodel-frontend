/**
 * conditional.ts — the rules normal form (toRules / fromRules) and formatPredicate
 * (Symbol Editor 1b, slice 1). Imports the module file directly, never the `ui`
 * barrel, which re-exports React components.
 *
 * The compile checks run the real interpreter (irCompile on the draw ReadCtx), so
 * "same result" means the same value per element, not the same JSON.
 */
import { describe, it, expect } from 'vitest';
import { toRules, fromRules, formatPredicate, PREDICATE_PLACEHOLDER } from '../conditional';
import { compileView, clearCompileCache } from '../../../editor-v2/viewpoint/ir/irCompile';
import { makeDrawReadCtx } from '../../../editor-v2/viewpoint/ir/irReadCtx';
import type { Conditional, Predicate, VertexViewIR } from '../../../editor-v2/viewpoint/ir/irTypes';

/** s1 State isInitial=true, s2 FinalState isInitial=false, s3 State with no slots. */
function world() {
    const idlookup: Record<string, any> = {
        C_State: { id: 'C_State', name: 'State', extends: [] },
        C_Final: { id: 'C_Final', name: 'FinalState', extends: ['C_State'] },
        A_isInitial: { id: 'A_isInitial', name: 'isInitial' },
        s1: { id: 's1', name: 'obj_s1', instanceof: 'C_State', features: ['v1i'] },
        v1i: { id: 'v1i', instanceof: 'A_isInitial', values: [true] },
        s2: { id: 's2', name: 'obj_s2', instanceof: 'C_Final', features: ['v2i'] },
        v2i: { id: 'v2i', instanceof: 'A_isInitial', values: [false] },
        s3: { id: 's3', name: 'obj_s3', instanceof: 'C_State', features: [] },
    };
    return makeDrawReadCtx(idlookup);
}

const IS_INITIAL: Predicate = { op: 'eq', left: '$isInitial.value', right: { kind: 'boolean', value: true } };
const IS_FINAL: Predicate = { op: 'isKind', class: 'FinalState' };

let viewSeq = 0;
/** The fill each element renders with, for a given fill axis. */
function fillsOf(fill: Conditional<string> | undefined): string[] {
    clearCompileCache();
    const ir = {
        irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['State'],
        shape: fill === undefined ? { form: 'rect' } : { form: 'rect', fill },
    } as VertexViewIR;
    const cv = compileView(`v_rules_${viewSeq++}`, ir);
    const ctx = world();
    return ['s1', 's2', 's3'].map((id) => (cv.fill ? cv.fill(ctx, id) : ''));
}

describe('toRules', () => {
    it('absent axis: no rules, no default key', () => {
        const r = toRules<string>(undefined);
        expect(r).toStrictEqual({ rules: [] });
        expect('default' in r).toBe(false);
    });
    it('scalar: no rules, the scalar as default', () => {
        expect(toRules<string>('#ff0000')).toStrictEqual({ rules: [], default: '#ff0000' });
    });
    it('{when, then, else}: one rule, else as default', () => {
        expect(toRules<string>({ when: IS_INITIAL, then: '#00ff00', else: '#0000ff' }))
            .toStrictEqual({ rules: [{ when: IS_INITIAL, then: '#00ff00' }], default: '#0000ff' });
    });
    it('{when, then} without else: no default key', () => {
        const r = toRules<string>({ when: IS_INITIAL, then: '#00ff00' });
        expect(r).toStrictEqual({ rules: [{ when: IS_INITIAL, then: '#00ff00' }] });
        expect('default' in r).toBe(false);
    });
    it('{rules, default}: same rules, a copy of the array', () => {
        const src = { rules: [{ when: IS_INITIAL, then: 'a' }, { when: IS_FINAL, then: 'b' }], default: 'c' };
        const r = toRules<string>(src);
        expect(r).toStrictEqual(src);
        expect(r.rules).not.toBe(src.rules);
    });
    it('{rules} without default: no default key', () => {
        const r = toRules<string>({ rules: [{ when: IS_FINAL, then: 'b' }] });
        expect('default' in r).toBe(false);
    });
});

describe('fromRules: the write rules', () => {
    it('two rules and a default: {rules: [{when, then}, {when, then}], default}', () => {
        const out = fromRules<string>({ rules: [{ when: IS_INITIAL, then: '#DCFCE7' }, { when: IS_FINAL, then: '#FEE2E2' }], default: '#ffffff' });
        expect(out).toStrictEqual({ rules: [{ when: IS_INITIAL, then: '#DCFCE7' }, { when: IS_FINAL, then: '#FEE2E2' }], default: '#ffffff' });
    });
    it('rules without a default: the default key is not written', () => {
        const out = fromRules<string>({ rules: [{ when: IS_FINAL, then: 'b' }] }) as object;
        expect(out).toStrictEqual({ rules: [{ when: IS_FINAL, then: 'b' }] });
        expect('default' in out).toBe(false);
    });
    it('always the rules form, never {when, then, else}', () => {
        const out = fromRules<string>(toRules<string>({ when: IS_INITIAL, then: 'x', else: 'y' })) as object;
        expect('when' in out).toBe(false);
        expect(out).toStrictEqual({ rules: [{ when: IS_INITIAL, then: 'x' }], default: 'y' });
    });
    it('no rules, default set: {rules: [], default} (state 2i)', () => {
        expect(fromRules<string>({ rules: [], default: '#abcdef' })).toStrictEqual({ rules: [], default: '#abcdef' });
        expect(fromRules<string>({ rules: [], default: '' }, { noneValue: '' })).toStrictEqual({ rules: [], default: '' });
    });
    it('no rules, no default, axis with a none value: the axis is removed', () => {
        expect(fromRules<string>({ rules: [] }, { noneValue: '', fallback: '' })).toBeUndefined();
    });
    it('no rules, no default, axis without a none value: the fallback scalar, never {rules: []}', () => {
        expect(fromRules<string>({ rules: [] }, { fallback: 'solid' })).toBe('solid');
    });
    it('does not alias the rules array it was given', () => {
        const rules = [{ when: IS_FINAL, then: 'b' }];
        const out = fromRules<string>({ rules }) as { rules: unknown[] };
        expect(out.rules).not.toBe(rules);
    });
});

describe('toRules / fromRules round trip on the three input shapes', () => {
    const shapes: [string, Conditional<string>][] = [
        ['scalar', '#ff0000'],
        ['{when, then, else}', { when: IS_INITIAL, then: '#00ff00', else: '#0000ff' }],
        ['{when, then}', { when: IS_INITIAL, then: '#00ff00' }],
        ['{rules, default}', { rules: [{ when: IS_INITIAL, then: 'a' }, { when: IS_FINAL, then: 'b' }], default: 'c' }],
        ['{rules}', { rules: [{ when: IS_FINAL, then: 'b' }] }],
    ];
    for (const [name, c] of shapes) {
        it(`${name}: the normal form is a fixed point`, () => {
            const once = toRules(c);
            expect(toRules(fromRules(once))).toStrictEqual(once);
        });
        it(`${name}: written back, every element renders the same fill`, () => {
            expect(fillsOf(fromRules(toRules(c)))).toStrictEqual(fillsOf(c));
        });
    }
    it('{rules, default?} comes back identical', () => {
        const r = { rules: [{ when: IS_INITIAL, then: 'a' }, { when: IS_FINAL, then: 'b' }], default: 'c' };
        expect(fromRules(toRules<string>(r))).toStrictEqual(r);
    });
});

describe('irCompile: the rules form against the old forms', () => {
    it('one rule plus a default compiles exactly like {when, then, else}', () => {
        const old = fillsOf({ when: IS_INITIAL, then: '#00ff00', else: '#0000ff' });
        const rules = fillsOf({ rules: [{ when: IS_INITIAL, then: '#00ff00' }], default: '#0000ff' });
        expect(old).toStrictEqual(['#00ff00', '#0000ff', '#0000ff']);
        expect(rules).toStrictEqual(old);
    });
    it('one rule without a default compiles like {when, then}', () => {
        expect(fillsOf({ rules: [{ when: IS_INITIAL, then: '#00ff00' }] }))
            .toStrictEqual(fillsOf({ when: IS_INITIAL, then: '#00ff00' }));
    });
    it('order is semantics: first match wins, so a swap changes the result', () => {
        const a = { when: { op: 'literal', value: true } as Predicate, then: 'A' };
        const b = { when: IS_FINAL, then: 'B' };
        expect(fillsOf({ rules: [b, a] })).toStrictEqual(['A', 'B', 'A']);
        expect(fillsOf({ rules: [a, b] })).toStrictEqual(['A', 'A', 'A']);
    });
    it('{rules: []} alone renders like an absent axis, which is why it is never written', () => {
        expect(fillsOf({ rules: [] })).toStrictEqual(fillsOf(undefined));
    });
    it('{rules: [], default: ""} renders like an absent fill (D2)', () => {
        expect(fillsOf({ rules: [], default: '' })).toStrictEqual(fillsOf(undefined));
    });
});

describe('formatPredicate', () => {
    const P = (x: unknown) => x as Predicate;

    it('literal', () => {
        expect(formatPredicate({ op: 'literal', value: true })).toBe('always true');
        expect(formatPredicate({ op: 'literal', value: false })).toBe('always false');
    });
    it('eq against a boolean literal elides to the path, or not <path>', () => {
        expect(formatPredicate({ op: 'eq', left: '$isFinal.value', right: { kind: 'boolean', value: true } })).toBe('isFinal');
        expect(formatPredicate({ op: 'eq', left: '$isFinal.value', right: { kind: 'boolean', value: false } })).toBe('not isFinal');
        expect(formatPredicate({ op: 'eq', left: { kind: 'boolean', value: true }, right: '$isFinal.value' })).toBe('isFinal');
    });
    it('eq against a number or a string does not elide; strings are quoted', () => {
        expect(formatPredicate({ op: 'eq', left: '$kind.value', right: { kind: 'string', value: 'parallel' } })).toBe('kind == "parallel"');
        expect(formatPredicate({ op: 'eq', left: '$count.value', right: { kind: 'number', value: 1 } })).toBe('count == 1');
    });
    it('the six comparators', () => {
        const n = { kind: 'number' as const, value: 3 };
        expect(formatPredicate({ op: 'eq', left: '$n.value', right: n })).toBe('n == 3');
        expect(formatPredicate({ op: 'neq', left: '$n.value', right: n })).toBe('n != 3');
        expect(formatPredicate({ op: 'lt', left: '$n.value', right: n })).toBe('n < 3');
        expect(formatPredicate({ op: 'lte', left: '$n.value', right: n })).toBe('n <= 3');
        expect(formatPredicate({ op: 'gt', left: '$n.value', right: n })).toBe('n > 3');
        expect(formatPredicate({ op: 'gte', left: '$n.value', right: n })).toBe('n >= 3');
    });
    it('neq against a boolean does not elide', () => {
        expect(formatPredicate({ op: 'neq', left: '$isFinal.value', right: { kind: 'boolean', value: true } })).toBe('isFinal != true');
    });
    it('path against path', () => {
        expect(formatPredicate({ op: 'lt', left: '$a.value', right: '$b.value' })).toBe('a < b');
    });
    it('exists, empty', () => {
        expect(formatPredicate({ op: 'exists', path: '$name.value' })).toBe('exists name');
        expect(formatPredicate({ op: 'empty', path: '$regions.values' })).toBe('empty regions.values');
    });
    it('isKind, with and without path', () => {
        expect(formatPredicate({ op: 'isKind', class: 'FinalState' })).toBe('isKind FinalState');
        expect(formatPredicate({ op: 'isKind', class: 'State', path: '$target.value' })).toBe('isKind State on target');
    });
    it('marked, with and without path', () => {
        expect(formatPredicate({ op: 'marked' })).toBe('marked');
        expect(formatPredicate({ op: 'marked', path: '$source.value' })).toBe('marked on source');
    });
    it('not', () => {
        expect(formatPredicate({ op: 'not', arg: { op: 'exists', path: '$name.value' } })).toBe('not (exists name)');
    });
    it('and / or, parenthesized only where nesting requires it', () => {
        const a: Predicate = { op: 'exists', path: '$a.value' };
        const b: Predicate = { op: 'exists', path: '$b.value' };
        const c: Predicate = { op: 'exists', path: '$c.value' };
        expect(formatPredicate({ op: 'and', args: [a, b] })).toBe('exists a and exists b');
        expect(formatPredicate({ op: 'or', args: [a, b] })).toBe('exists a or exists b');
        expect(formatPredicate({ op: 'and', args: [a, { op: 'or', args: [b, c] }] })).toBe('exists a and (exists b or exists c)');
        expect(formatPredicate({ op: 'or', args: [a, { op: 'and', args: [b, c] }] })).toBe('exists a or exists b and exists c');
        expect(formatPredicate({ op: 'and', args: [a, { op: 'and', args: [b, c] }] })).toBe('exists a and exists b and exists c');
    });
    it('empty and / or follow compile semantics', () => {
        expect(formatPredicate({ op: 'and', args: [] })).toBe('always true');
        expect(formatPredicate({ op: 'or', args: [] })).toBe('always false');
    });
    it('subject prefixes every path, and only paths', () => {
        const opts = { subject: 'state' };
        expect(formatPredicate({ op: 'eq', left: '$isFinal.value', right: { kind: 'boolean', value: true } }, opts)).toBe('state.isFinal');
        expect(formatPredicate({ op: 'eq', left: '$kind.value', right: { kind: 'string', value: 'x' } }, opts)).toBe('state.kind == "x"');
        expect(formatPredicate({ op: 'isKind', class: 'FinalState' }, opts)).toBe('isKind FinalState');
        expect(formatPredicate({ op: 'marked', path: '$source.value' }, opts)).toBe('marked on state.source');
        expect(formatPredicate({ op: 'literal', value: true }, opts)).toBe('always true');
    });
    it('an empty path reads as a placeholder, not as a blank', () => {
        expect(formatPredicate({ op: 'exists', path: '' })).toBe('exists ⟨path⟩');
    });
    it('an invented op returns the placeholder and does not throw', () => {
        expect(() => formatPredicate(P({ op: 'matchesRegex', path: '$name.value', pattern: 'x' }))).not.toThrow();
        expect(formatPredicate(P({ op: 'matchesRegex', path: '$name.value', pattern: 'x' }))).toBe(PREDICATE_PLACEHOLDER);
        expect(formatPredicate(P({ op: 'and', args: [{ op: 'exists', path: '$a.value' }, { op: 'future' }] }))).toBe(`exists a and ${PREDICATE_PLACEHOLDER}`);
    });
    it('malformed known ops and non-objects do not throw', () => {
        for (const bad of [
            null, undefined, 42, 'eq', {},
            { op: 'eq', left: '$a.value' },
            { op: 'and', args: 'nope' },
            { op: 'not' },
            { op: 'isKind' },
            { op: 'literal', value: 'yes' },
        ]) {
            expect(() => formatPredicate(P(bad))).not.toThrow();
            expect(typeof formatPredicate(P(bad))).toBe('string');
        }
    });
    it('an input that makes the walk itself fail still returns the placeholder', () => {
        const cyclic: any = { op: 'not' };
        cyclic.arg = cyclic;
        expect(() => formatPredicate(cyclic)).not.toThrow();
        expect(formatPredicate(cyclic)).toBe(PREDICATE_PLACEHOLDER);
    });
});
