import { describe, expect, it } from 'vitest';
import {
    decodeExprBinding, encodeExprBinding, mapIds, parsePattern, resolveBindingNames,
    type ExprBinding, type ExprMetamodelSketch,
} from '../exprBinding';

const minimal = (extra: Record<string, unknown> = {}): Record<string, unknown> => ({
    v: 1, parens: 'always', slots: [{ class: 'C', feature: 'f' }], roles: [{ class: 'C', role: 'reference', attribute: 'a' }], ...extra,
});

const decoded = (raw: unknown): ExprBinding => {
    const r = decodeExprBinding(raw);
    if (!r.ok || !r.value) throw new Error(`expected a binding: ${JSON.stringify(r)}`);
    return r.value;
};

const errorsOf = (raw: unknown): string[] => {
    const r = decodeExprBinding(raw);
    if (r.ok) throw new Error('expected a refusal');
    return r.errors;
};

describe('decodeExprBinding', () => {
    it('reads no key as no binding and no error', () => {
        expect(decodeExprBinding(undefined)).toEqual({ ok: true, value: null });
        expect(decodeExprBinding(null)).toEqual({ ok: true, value: null });
    });

    it('refuses an unknown version', () => {
        expect(errorsOf(JSON.stringify(minimal({ v: 2 })))).toEqual(['Unknown version 2: only 1 is read.']);
    });

    it('refuses what is not JSON', () => {
        expect(errorsOf('{nope')).toEqual(['The binding is not JSON.']);
    });

    it('lists every defect, not the first', () => {
        const errors = errorsOf({
            v: 1, parens: 'sometimes',
            slots: [{ class: '', feature: 'f' }],
            roles: [{ class: 'C', role: 'infix', symbol: '+', precedence: 'high', assoc: 'left', operands: ['a'] }, { class: 'D', role: 'wat' }],
        });
        expect(errors).toEqual([
            'parens: not always or minimal.',
            'slots[0].class: not an id.',
            'roles[0].precedence: not a number.',
            'roles[0].operands: not two ids.',
            'roles[1].role: unknown role "wat".',
        ]);
    });

    it('keeps unknown keys of the root, a slot and a role through encode', () => {
        const source = minimal({
            future: { a: 1 },
            slots: [{ class: 'C', feature: 'f', hint: 'x' }],
            roles: [{ class: 'C', role: 'reference', attribute: 'a', templates: ['t'] }],
        });
        const again = decoded(encodeExprBinding(decoded(JSON.stringify(source))));
        expect(again.future).toEqual({ a: 1 });
        expect(again.slots[0].hint).toBe('x');
        expect(again.roles[0].templates).toEqual(['t']);
    });

    it('accepts the sharing record and refuses a bad one', () => {
        const sharing = { classes: ['C'], minLength: 10, minCount: 3, prefix: 'D' };
        expect(decoded(minimal({ sharing })).sharing).toEqual(sharing);
        expect(errorsOf(minimal({ sharing: { ...sharing, prefix: '' } }))).toEqual(['sharing.prefix: not a non-empty text.']);
    });

    it('refuses a hole with no arg, in a text and in a form', () => {
        expect(errorsOf(minimal({ roles: [{ class: 'C', role: 'pattern', args: { a: 'f' }, text: '{a} {b}' }] })))
            .toEqual(['roles[0].text: the hole b has no arg.']);
        expect(errorsOf(minimal({ roles: [{ class: 'C', role: 'pattern', args: {}, forms: [{ text: '{z}' }] }] })))
            .toEqual(['roles[0].forms[0].text: the hole z has no arg.']);
    });

    it('refuses a form condition on an unknown local, not on a mode', () => {
        expect(errorsOf(minimal({ roles: [{ class: 'C', role: 'pattern', args: {}, forms: [{ when: [{ has: 'q' }], text: 'x' }] }] })))
            .toEqual(['roles[0].forms[0].when[0]: q has no arg.']);
        expect(decoded(minimal({ roles: [{ class: 'C', role: 'pattern', args: {}, forms: [{ when: [{ mode: 'caseArm' }], text: 'x' }] }] }))).toBeTruthy();
    });

    it('needs exactly one of text and forms', () => {
        expect(errorsOf(minimal({ roles: [{ class: 'C', role: 'pattern', args: {} }] }))).toEqual(['roles[0]: needs either text or forms.']);
        expect(errorsOf(minimal({ roles: [{ class: 'C', role: 'pattern', args: {}, text: 'x', forms: [{ text: 'y' }] }] })))
            .toEqual(['roles[0]: needs either text or forms.']);
    });
});

describe('parsePattern', () => {
    it('reads every hole form and the escapes', () => {
        expect(parsePattern('{{a}} {x} {x^} {x!d} {x?a|b} {x*, }')).toEqual({
            parts: [
                { kind: 'text', text: '{a} ' },
                { kind: 'one', arg: 'x', atom: false },
                { kind: 'text', text: ' ' },
                { kind: 'one', arg: 'x', atom: true },
                { kind: 'text', text: ' ' },
                { kind: 'one', arg: 'x', atom: false, fallback: 'd' },
                { kind: 'text', text: ' ' },
                { kind: 'truth', arg: 'x', yes: 'a', no: 'b' },
                { kind: 'text', text: ' ' },
                { kind: 'many', arg: 'x', separator: ', ' },
            ],
        });
    });

    it('reports an unclosed, an unmatched and a bad hole', () => {
        expect(parsePattern('a {x')).toEqual({ error: 'unclosed { at 2' });
        expect(parsePattern('a } b')).toEqual({ error: 'unmatched } at 2' });
        expect(parsePattern('{1x}')).toEqual({ error: 'bad hole {1x}' });
    });
});

const SKETCH: ExprMetamodelSketch = {
    classes: [
        { id: 'c-base', name: 'Base', supers: [] },
        { id: 'c-add', name: 'Add', supers: ['c-base'] },
        { id: 'c-case', name: 'Case', supers: [] },
        { id: 'c-arm', name: 'Arm', supers: [] },
    ],
    attributes: [{ id: 'a-note', name: 'note', owner: 'c-base' }],
    references: [
        { id: 'r-left', name: 'left', owner: 'c-add' },
        { id: 'r-right', name: 'right', owner: 'c-add' },
        { id: 'r-arms', name: 'arms', owner: 'c-case' },
        { id: 'r-else', name: 'otherwise', owner: 'c-case' },
        { id: 'r-cond', name: 'cond', owner: 'c-arm' },
        { id: 'r-value', name: 'value', owner: 'c-arm' },
    ],
};

describe('resolveBindingNames and mapIds', () => {
    const file: ExprBinding = {
        v: 1, parens: 'minimal', keep: 'me',
        slots: [{ class: 'Add', feature: 'note' }],
        roles: [
            { class: 'Add', role: 'infix', symbol: '+', precedence: 6, assoc: 'left', operands: ['left', 'right'] },
            { class: 'Case', role: 'case', arms: 'arms', armClass: 'Arm', cond: 'cond', value: 'value', otherwise: 'otherwise' },
        ],
        sharing: { classes: ['Base'], minLength: 1, minCount: 2, prefix: 'D', host: 'Case' },
    };

    it('resolves names, a feature through the lineage, and case features on armClass', () => {
        const r = resolveBindingNames(file, SKETCH);
        if (!r.ok) throw new Error(r.errors.join());
        expect(r.value.slots[0]).toEqual({ class: 'c-add', feature: 'a-note' });
        expect(r.value.roles[0]).toMatchObject({ class: 'c-add', operands: ['r-left', 'r-right'] });
        expect(r.value.roles[1]).toMatchObject({ arms: 'r-arms', armClass: 'c-arm', cond: 'r-cond', value: 'r-value', otherwise: 'r-else' });
        expect(r.value.sharing).toMatchObject({ classes: ['c-base'], host: 'c-case' });
        expect(r.value.keep).toBe('me');
    });

    it('lists unknown names, and no follow-up error for a feature of an unknown class', () => {
        const r = resolveBindingNames({
            ...file, sharing: undefined,
            slots: [{ class: 'Nope', feature: 'x' }, { class: 'Add', feature: 'ghost' }],
            roles: [],
        }, SKETCH);
        expect(r).toEqual({ ok: false, errors: ['slots[0].class: unknown class Nope.', 'slots[1].feature: unknown feature ghost.'] });
    });

    it('checks that stored ids still exist', () => {
        const stored = resolveBindingNames(file, SKETCH);
        if (!stored.ok) throw new Error(stored.errors.join());
        const known = new Set(['c-add', 'c-base', 'c-case', 'c-arm', 'a-note', 'r-left', 'r-right', 'r-arms', 'r-else', 'r-cond', 'r-value']);
        const has = (x: string): string | undefined => (known.has(x) ? x : undefined);
        expect(mapIds(stored.value, has, (_c, f) => has(f)).ok).toBe(true);
        known.delete('r-right');
        expect(mapIds(stored.value, has, (_c, f) => has(f))).toEqual({ ok: false, errors: ['roles[0].operands[1]: unknown feature r-right.'] });
    });
});
