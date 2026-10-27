/**
 * templateCompletion — completion in the Template Editor (slice S4, P-2026-10-23-2300; R-GEN-24, R-GEN-26).
 *
 * A hand-built metamodel lookup: `Node` with `name`, `State extends Node` with `isInitial` and `next`, `Final
 * extends State`, a subpackage class, and a class name two packages share. Each test name says which break kills
 * it; the bench is in the commit body.
 */

import { describe, it, expect } from 'vitest';
import {
    STC_MEMBERS, TARGET_MEMBERS, buildCompletionContext, classesOf, completionsAt, inCodeAt, paramClassesOf,
} from '../templateCompletion';
import type { TemplateCompletionContext } from '../templateCompletion';
import type { TemplateRecord } from '../../engine/templates';

const lookup = {
    MM: { className: 'DModel', id: 'MM', packages: ['P1', 'P2'] },
    P1: { className: 'DPackage', id: 'P1', classifiers: ['Node', 'State', 'Final', 'E', 'Dup1'], subpackages: ['P1s'] },
    P1s: { className: 'DPackage', id: 'P1s', classifiers: ['Sub'] },
    P2: { className: 'DPackage', id: 'P2', classifiers: ['Dup2'] },
    Node: { className: 'DClass', id: 'Node', name: 'Node', attributes: ['Node_name'], references: [], extends: [] },
    State: { className: 'DClass', id: 'State', name: 'State', attributes: ['State_isInitial'], references: ['State_next'], extends: ['Node'] },
    Final: { className: 'DClass', id: 'Final', name: 'Final', attributes: [], references: [], extends: ['State', 'Final'] },
    Sub: { className: 'DClass', id: 'Sub', name: 'Sub', attributes: [], references: [], extends: [] },
    Dup1: { className: 'DClass', id: 'Dup1', name: 'Dup', attributes: [], references: [], extends: [] },
    Dup2: { className: 'DClass', id: 'Dup2', name: 'Dup', attributes: [], references: [], extends: [] },
    E: { className: 'DEnumerator', id: 'E', name: 'E' },
    Node_name: { className: 'DAttribute', id: 'Node_name', name: 'name', type: 'EString' },
    State_isInitial: { className: 'DAttribute', id: 'State_isInitial', name: 'isInitial', type: 'EBoolean' },
    State_next: { className: 'DReference', id: 'State_next', name: 'next', type: 'State' },
    EString: { className: 'DClass', id: 'EString', name: 'EString' },
    EBoolean: { className: 'DClass', id: 'EBoolean', name: 'EBoolean' },
};

const tpl = (name: string, params: string[], body: string, mode: 'text' | 'expression' = 'text'): TemplateRecord => ({ name, params, body, mode });

const templates: TemplateRecord[] = [
    tpl('main', [], '${forall s in State.instances : state(s)}'),
    tpl('state', ['s'], '${s.name}${forall f in Final.instances : fin(f, s)}'),
    tpl('fin', ['f', 'from'], '${f.name}'),
    tpl('loose', ['x'], '${x}'),
];

/** The context with the cursor in `name` (its params given), over the fixture. */
const ctxFor = (name: string, params: string[], list: TemplateRecord[] = templates): TemplateCompletionContext =>
    buildCompletionContext(lookup, 'MM', list, name, params);

const labels = (body: string, mode: 'text' | 'expression', ctx: TemplateCompletionContext, offset = body.length) =>
    completionsAt(ctx, body, offset, mode)?.map(c => c.label) ?? null;

describe('classesOf', () => {
    it('lists the classes of every package and subpackage, not the enumerations (kills: subpackages skipped; className not checked)', () => {
        expect([...classesOf(lookup, 'MM').keys()].sort()).toEqual(['Final', 'Node', 'State', 'Sub']);
    });

    it('leaves out a class name two classes share (kills: first Dup kept)', () => {
        expect(classesOf(lookup, 'MM').has('Dup')).toBe(false);
    });

    it('gives a class its own features, then the inherited ones, cycle-safe (kills: inherited features missing)', () => {
        const state = classesOf(lookup, 'MM').get('State')!;
        expect(state.features.map(f => `${f.owner}.${f.name}`)).toEqual(['State.isInitial', 'State.next', 'Node.name']);
        const final = classesOf(lookup, 'MM').get('Final')!;
        expect(final.features.map(f => f.name)).toEqual(['isInitial', 'next', 'name']);
    });

    it('reads the type name of a feature', () => {
        const state = classesOf(lookup, 'MM').get('State')!;
        expect(state.features.find(f => f.name === 'next')).toMatchObject({ kind: 'reference', type: 'State' });
        expect(state.features.find(f => f.name === 'name')).toMatchObject({ kind: 'attribute', type: 'EString' });
    });
});

describe('paramClassesOf', () => {
    const classes = classesOf(lookup, 'MM');

    it('takes a parameter\'s class from a forall over C.instances at its call site (kills: forall binding ignored)', () => {
        expect(paramClassesOf(templates, classes).get('state')?.get('s')).toBe('State');
    });

    it('carries a known parameter on to the next call (kills: one round only)', () => {
        const known = paramClassesOf(templates, classes).get('fin');
        expect(known?.get('f')).toBe('Final');
        expect(known?.get('from')).toBe('State');
    });

    it('leaves a parameter with no call site, or one call site of unknown class, unknown (kills: name-based guess; any-vote wins)', () => {
        expect(paramClassesOf(templates, classes).get('loose')).toBeUndefined();
        const mixed = [...templates, tpl('other', ['n'], '${state(n)}')];
        expect(paramClassesOf(mixed, classes).get('state')?.get('s')).toBeUndefined();
    });

    it('leaves a parameter two call sites give different classes unknown (kills: first class kept)', () => {
        const two = [...templates, tpl('m2', [], '${forall n in Node.instances : state(n)}')];
        expect(paramClassesOf(two, classes).get('state')?.get('s')).toBeUndefined();
    });

    it('reads expression-mode bodies too, and a lambda parameter shadows', () => {
        const list = [
            tpl('main', [], 'forall s in State.allInstances : state(s)', 'expression'),
            tpl('state', ['s'], '"${s.name}"', 'expression'),
            tpl('lam', [], '${forall s in State.instances : Node.instances.map(s => state(s))}'),
        ];
        expect(paramClassesOf(list.slice(0, 2), classes).get('state')?.get('s')).toBe('State');
        expect(paramClassesOf(list, classes).get('state')?.get('s')).toBeUndefined();
    });
});

describe('inCodeAt', () => {
    it('in text mode is true only inside a hole (kills: offer outside a hole in text mode)', () => {
        const body = 'a ${x} b';
        expect(inCodeAt(body, 1, 'text')).toBe(false);
        expect(inCodeAt(body, 4, 'text')).toBe(true);
        expect(inCodeAt(body, 5, 'text')).toBe(true);
        expect(inCodeAt(body, 6, 'text')).toBe(false);
        expect(inCodeAt(body, body.length, 'text')).toBe(false);
    });

    it('in text mode reads an escaped \\${ as text (kills: escape opens a hole)', () => {
        const body = 'a \\${x} b';
        expect(inCodeAt(body, 6, 'text')).toBe(false);
    });

    it('in text mode keeps the hole open over a record literal and a nested string\'s hole', () => {
        expect(inCodeAt('${ {a: 1} ', 10, 'text')).toBe(true);
        expect(inCodeAt('${ "x${y}" ', 11, 'text')).toBe(true);
        expect(inCodeAt('${ "x', 5, 'text')).toBe(false);
        expect(inCodeAt('${ "x${y', 8, 'text')).toBe(true);
    });

    it('in text mode treats a quote and -- outside a hole as text', () => {
        expect(inCodeAt('"--${x', 6, 'text')).toBe(true);
    });

    it('in expression mode is false only in a string\'s text and a comment', () => {
        expect(inCodeAt('a + b', 3, 'expression')).toBe(true);
        expect(inCodeAt('"ab', 2, 'expression')).toBe(false);
        expect(inCodeAt('"a${b', 5, 'expression')).toBe(true);
        expect(inCodeAt("'a${b", 5, 'expression')).toBe(false);
        expect(inCodeAt('"a" + b', 7, 'expression')).toBe(true);
        expect(inCodeAt('a -- c', 6, 'expression')).toBe(false);
        expect(inCodeAt('a -- c\nb', 8, 'expression')).toBe(true);
    });
});

describe('completionsAt', () => {
    it('offers nothing outside a hole in text mode (kills: offer outside a hole in text mode)', () => {
        expect(labels('hello ', 'text', ctxFor('state', ['s']))).toBeNull();
        expect(labels('${s} x', 'text', ctxFor('state', ['s']))).toBeNull();
    });

    it('offers the params, the templates, the classes, stc and target in a hole', () => {
        expect(labels('${', 'text', ctxFor('state', ['s']))).toEqual(['s', 'main', 'state', 'fin', 'loose', 'Node', 'State', 'Final', 'Sub', 'stc', 'target']);
    });

    it('inserts a template call with its parameters as snippet placeholders', () => {
        const fin = completionsAt(ctxFor('state', ['s']), '${', 2, 'text')!.find(c => c.label === 'fin')!;
        expect(fin).toMatchObject({ kind: 'template', snippet: true, insertText: 'fin(${1:f}, ${2:from})' });
        const main = completionsAt(ctxFor('state', ['s']), '${', 2, 'text')!.find(c => c.label === 'main')!;
        expect(main.insertText).toBe('main()');
    });

    it('after a parameter of known class offers its features, inherited ones included (kills: inherited features missing)', () => {
        expect(labels('${s.', 'text', ctxFor('state', ['s']))).toEqual(['isInitial', 'next', 'name']);
        expect(labels('${f.na', 'text', ctxFor('fin', ['f', 'from']))).toEqual(['isInitial', 'next', 'name']);
        expect(labels('s?.', 'expression', ctxFor('state', ['s']))).toEqual(['isInitial', 'next', 'name']);
    });

    it('after a receiver of unknown class offers nothing (kills: guess by name; self given a class)', () => {
        expect(labels('${x.', 'text', ctxFor('loose', ['x']))).toBeNull();
        expect(labels('${self.', 'text', ctxFor('state', ['s']))).toBeNull();
        expect(labels('${State.', 'text', ctxFor('state', ['s']))).toBeNull();
        expect(labels('${s.next.', 'text', ctxFor('state', ['s']))).toBeNull();
    });

    it('after stc. and target. offers their members, a function as a call', () => {
        const stc = completionsAt(ctxFor('main', []), '${stc.', 6, 'text')!;
        expect(stc.map(c => c.label)).toEqual(STC_MEMBERS.map(m => m.name));
        expect(stc.find(c => c.label === 'source')).toMatchObject({ snippet: true, insertText: 'source(${1:element})' });
        const target = completionsAt(ctxFor('main', []), 'target.', 7, 'expression')!;
        expect(target.map(c => c.label)).toEqual(TARGET_MEMBERS.map(m => m.name));
        expect(target.find(c => c.label === 'guard')).toMatchObject({ insertText: 'guard(${1:site})' });
    });

    it('a parameter named stc shadows the global', () => {
        expect(labels('${stc.', 'text', ctxFor('loose', ['stc']))).toBeNull();
    });

    it('in expression mode offers nothing inside a string\'s text', () => {
        expect(labels('"ab', 'expression', ctxFor('state', ['s']))).toBeNull();
        expect(labels('"${s.', 'expression', ctxFor('state', ['s']))).toEqual(['isInitial', 'next', 'name']);
    });

    it('takes the edited template\'s draft parameters, not the stored ones', () => {
        expect(labels('${', 'text', ctxFor('state', ['s', 'extra']))?.slice(0, 2)).toEqual(['s', 'extra']);
        expect(buildCompletionContext(lookup, 'MM', templates, null, []).paramClasses.size).toBe(0);
    });
});
