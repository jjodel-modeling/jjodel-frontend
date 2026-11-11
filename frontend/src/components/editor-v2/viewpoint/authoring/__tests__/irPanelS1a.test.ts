/**
 * IR view panel S1a (P-2026-11-11-2035): the controls for five keys the panel could not author
 * (audit rows V-12, V-21, V-22, V-48, V-53 of docs/discovery/discovery_2026-11-11_ir_view_panel_coverage.md).
 *
 * For every key: set, change, reset (the key removed, not left `undefined`), and every other key of the
 * IR deep-equal to before (R-IPC-7). Two levels:
 *  - the pure writers, called directly;
 *  - the wiring, run: the vertex panel is rendered to markup through `react-dom/server` (the joiner barrel
 *    mocked as in panelSections.test.ts) with pass-through spies on the `ui` controls it mounts, and
 *    `withMetaclassPins` spied, since every edit of the panel goes through it (`patch`), so a call to a
 *    control's onChange runs the panel's handler up to the draft it would set. The two hook-free editors
 *    (compartments, segment) are called as functions and their elements' handlers fired.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';

const state = { advanced: false, idlookup: {} as Record<string, unknown> };

vi.mock('../../../../../joiner', () => ({
    store: { getState: () => state, subscribe: () => () => {}, dispatch: (a: unknown) => a },
    LProject: { getProject: () => ({ metamodels: [] }) },
    LPointerTargetable: { fromPointer: () => null, from: () => null, fromD: () => null, wrap: () => null },
    DClass: { cname: 'DClass' },
    Input: () => React.createElement('input'),
    Select: () => React.createElement('select'),
    U: {},
}));

type AnyProps = Record<string, any>;
const uiMounts: { kind: string; props: AnyProps }[] = [];

vi.mock('../../../../ui', async (importOriginal) => {
    const ui = await importOriginal<Record<string, any>>();
    const spy = (kind: string) => (p: AnyProps) => {
        uiMounts.push({ kind, props: p });
        return React.createElement(ui[kind], p);
    };
    return { ...ui, Select: spy('Select'), Input: spy('Input'), ConditionalEditor: spy('ConditionalEditor') };
});

const patched: any[] = [];

vi.mock('../../ir/metaclassPin', async (importOriginal) => {
    const mp = await importOriginal<Record<string, any>>();
    return {
        ...mp,
        withMetaclassPins: (...args: unknown[]) => {
            const result = mp.withMetaclassPins(...args);
            patched.push(result);
            return result;
        },
    };
});

import { VertexAuthoringPanel, withBarThickness, withShapeEntry, withVertexVisible } from '../VertexAuthoringPanel';
import {
    FieldCompartmentListEditor, withCompartmentSource, withSourceExclude,
    type FieldCompartmentListEditorProps,
} from '../FieldCompartmentListEditor';
import { FieldSegmentEditor, applyLiteralStyle, type FieldSegmentEditorProps } from '../FieldSegmentEditor';
import { TextStyleField } from '../TextStyleField';
import { ListEditor, Select, Toggle, type PathBuilderFeatures } from '../../../../ui';
import { defaultObjectViewIR } from '../../ir/irDefaults';
import { validateIR } from '../../ir/irValidate';
import type { FieldCompartmentSpec, FieldSegment, VertexViewIR } from '../../ir/irTypes';

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const COND = { when: { op: 'literal', value: true }, then: false, else: true } as const;

/** A vertex IR carrying keys on every side of the ones under test, so «untouched» has something to measure. */
function vertexIR(over: { visible?: unknown; entry?: unknown; barThickness?: unknown; form?: unknown } = {}): VertexViewIR {
    const ir = clone(defaultObjectViewIR()) as any;
    ir.label = 'L';
    ir.defaultSize = { width: 80 };
    ir.shape = { ...ir.shape, form: over.form ?? 'bar', cornerRadius: 6, padding: 'small', marker: 'x' };
    if (over.visible !== undefined) ir.visible = over.visible;
    if (over.entry !== undefined) ir.shape.entry = over.entry;
    if (over.barThickness !== undefined) ir.shape.barThickness = over.barThickness;
    return ir;
}

/** `ir` less one key at `path` (dot separated): what must stay deep-equal across a write of that key. */
function without(ir: unknown, path: string): unknown {
    const c = clone(ir) as any;
    const keys = path.split('.');
    let o = c;
    for (const k of keys.slice(0, -1)) o = o[k];
    delete o[keys[keys.length - 1]];
    return c;
}

/** Every element of `type` in a tree, in document order. */
const find = <P,>(node: React.ReactNode, type: unknown, out: React.ReactElement<P>[] = []) => {
    if (Array.isArray(node)) node.forEach(n => find(n, type, out));
    else if (React.isValidElement(node)) {
        if (node.type === type) out.push(node as React.ReactElement<P>);
        find((node.props as { children?: React.ReactNode }).children, type, out);
    }
    return out;
};

beforeEach(() => { uiMounts.length = 0; patched.length = 0; });

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Pure writers
// ─────────────────────────────────────────────────────────────────────────────────────────────────

describe('V-12 visible: withVertexVisible', () => {
    it('set false, change to a Conditional, reset by true and by undefined; nothing else moves', () => {
        const ir = vertexIR();
        const set = withVertexVisible(ir, false);
        expect(set.visible).toBe(false);
        const changed = withVertexVisible(set, COND as any);
        expect(changed.visible).toEqual(COND);
        for (const reset of [withVertexVisible(changed, true), withVertexVisible(changed, undefined)]) {
            expect('visible' in reset).toBe(false);
            expect(reset).toEqual(ir);
        }
        expect(without(changed, 'visible')).toEqual(ir);
        expect(validateIR('v', changed).ok).toBe(true);
    });
});

describe('V-21 shape.entry: withShapeEntry', () => {
    it('set dot, change to arrow, reset removes the key; nothing else moves', () => {
        const ir = vertexIR();
        const set = withShapeEntry(ir, 'dot');
        expect(set.shape.entry).toBe('dot');
        const changed = withShapeEntry(set, 'arrow');
        expect(changed.shape.entry).toBe('arrow');
        expect(without(changed, 'shape.entry')).toEqual(ir);
        const reset = withShapeEntry(changed, undefined);
        expect('entry' in reset.shape).toBe(false);
        expect(reset).toEqual(ir);
        expect(validateIR('v', changed).ok).toBe(true);
    });
});

describe('V-22 shape.barThickness: withBarThickness', () => {
    it('set 12, change to 8, empty removes the key; nothing else moves', () => {
        const ir = vertexIR();
        const set = withBarThickness(ir, '12');
        expect(set.shape.barThickness).toBe(12);
        const changed = withBarThickness(set, '8');
        expect(changed.shape.barThickness).toBe(8);
        expect(without(changed, 'shape.barThickness')).toEqual(ir);
        for (const raw of ['', '  ']) {
            const reset = withBarThickness(changed, raw);
            expect('barThickness' in reset.shape).toBe(false);
            expect(reset).toEqual(ir);
        }
        expect(validateIR('v', changed).ok).toBe(true);
    });

    it('a value that is not usable is written as typed and refused by the validator', () => {
        expect(validateIR('v', withBarThickness(vertexIR(), '0')).ok).toBe(false);
    });
});

const comp = (source: FieldCompartmentSpec['source']): FieldCompartmentSpec => ({
    id: 'slots', title: 'Slots', separator: true, visible: COND as any,
    source,
    rowFormat: { segments: [{ kind: 'name' }, { kind: 'literal', text: ' = ' }, { kind: 'value' }], style: { fontSize: 11 } },
});

describe('V-48 source.exclude: withSourceExclude and withCompartmentSource', () => {
    it('set, change, reset (empty list and undefined remove the key); nothing else moves', () => {
        const c = comp({ from: 'attributes' });
        const set = withSourceExclude(c, ['name']);
        expect(set.source).toEqual({ from: 'attributes', exclude: ['name'] });
        const changed = withSourceExclude(set, ['name', 'weight']);
        expect(changed.source).toEqual({ from: 'attributes', exclude: ['name', 'weight'] });
        expect(without(changed, 'source.exclude')).toEqual(c);
        for (const reset of [withSourceExclude(changed, []), withSourceExclude(changed, undefined)]) {
            expect('exclude' in reset.source).toBe(false);
            expect(reset).toEqual(c);
        }
    });

    it('is a no-op on a source other than attributes', () => {
        const refs = comp({ from: 'references' });
        expect(withSourceExclude(refs, ['name'])).toBe(refs);
    });

    it('a pick of attributes on an attributes source keeps exclude; a switch away drops it', () => {
        const c = comp({ from: 'attributes', exclude: ['name'] });
        expect(withCompartmentSource(c, 'attributes')).toEqual(c);
        expect(withCompartmentSource(c, 'references').source).toEqual({ from: 'references' });
        expect(withCompartmentSource(c, 'children').source).toEqual({ from: 'children' });
        expect(withCompartmentSource(comp({ from: 'references' }), 'attributes').source).toEqual({ from: 'attributes' });
    });
});

type Literal = Extract<FieldSegment, { kind: 'literal' }>;

describe('V-53 literal style: applyLiteralStyle', () => {
    it('set, change, reset removes the key; the text stays', () => {
        const seg: Literal = { kind: 'literal', text: 'attr ' };
        const set = applyLiteralStyle(seg, { color: '#64748b' });
        expect(set).toEqual({ kind: 'literal', text: 'attr ', style: { color: '#64748b' } });
        const changed = applyLiteralStyle(set, { color: '#64748b', fontSize: 10 });
        expect(changed.style).toEqual({ color: '#64748b', fontSize: 10 });
        expect(without(changed, 'style')).toEqual(seg);
        const reset = applyLiteralStyle(changed, undefined);
        expect('style' in reset).toBe(false);
        expect(reset).toEqual(seg);
    });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Wiring: the vertex panel
// ─────────────────────────────────────────────────────────────────────────────────────────────────

/** Renders the vertex panel on `ir`; returns the markup and the assignments to `view.ir`. */
function renderVertex(ir: VertexViewIR, advanced = false) {
    state.advanced = advanced;
    let current: unknown = ir;
    const assigned: unknown[] = [];
    const view = {
        id: 'view_1', name: 'View', appliableToClasses: [],
        get ir() { return current; },
        set ir(v: unknown) { assigned.push(v); current = v; },
    } as any;
    const reduxStore = { getState: () => state, subscribe: () => () => {}, dispatch: (a: unknown) => a } as any;
    const html = renderToStaticMarkup(createElement(Provider, {
        store: reduxStore,
        children: createElement(VertexAuthoringPanel, { view }),
    }));
    return { html, assigned };
}

const entrySelects = () => uiMounts.filter(m => m.kind === 'Select'
    && (m.props.options as { value: string }[]).some(o => o.value === 'arrow'));
const barInputs = () => uiMounts.filter(m => m.kind === 'Input' && m.props.placeholder === 'box');
const visibleEditors = () => uiMounts.filter(m => m.kind === 'ConditionalEditor'
    && find<{ label?: string }>(m.props.renderValue(true, () => undefined), Toggle)
        .some(t => t.props.label === 'Drawn'));

describe('vertex panel wiring', () => {
    it('mounting writes nothing and hands each persisted value to its control', () => {
        const ir = vertexIR({ visible: COND, entry: 'dot', barThickness: 12 });
        const before = clone(ir);
        const { assigned } = renderVertex(ir, true);
        expect(assigned).toEqual([]);
        expect(patched).toEqual([]);
        expect(ir).toEqual(before);
        expect(visibleEditors()).toHaveLength(1);
        expect(visibleEditors()[0].props.value).toEqual(COND);
        expect(entrySelects()).toHaveLength(1);
        expect(entrySelects()[0].props.value).toBe('dot');
        expect(barInputs()).toHaveLength(1);
        expect(barInputs()[0].props.value).toBe(12);
    });

    it('absent keys read as their defaults: drawn, no mark, empty thickness', () => {
        renderVertex(vertexIR());
        expect(visibleEditors()[0].props.value).toBeUndefined();
        expect(entrySelects()[0].props.value).toBe('');
        expect(barInputs()[0].props.value).toBe('');
    });

    it('visible: off sets false, on removes the key, a Conditional is written as is', () => {
        const ir = vertexIR();
        renderVertex(ir);
        const onChange = visibleEditors()[0].props.onChange;
        onChange(false);
        onChange(COND);
        onChange(true);
        expect(patched.map(p => p.visible)).toEqual([false, COND, undefined]);
        expect(without(patched[1], 'visible')).toEqual(ir);
        expect(patched[2]).toEqual(ir);
    });

    it('entry: a pick writes the mark, None removes the key', () => {
        const ir = vertexIR({ entry: 'dot' });
        renderVertex(ir);
        const onChange = entrySelects()[0].props.onChange;
        onChange({ target: { value: 'arrow' } });
        onChange({ target: { value: '' } });
        expect(patched[0].shape.entry).toBe('arrow');
        expect(without(patched[0], 'shape.entry')).toEqual(without(ir, 'shape.entry'));
        expect('entry' in patched[1].shape).toBe(false);
        expect(patched[1]).toEqual(without(ir, 'shape.entry'));
    });

    it('bar thickness: a number writes it, empty removes the key', () => {
        const ir = vertexIR({ barThickness: 12 });
        renderVertex(ir);
        const onChange = barInputs()[0].props.onChange;
        onChange({ target: { value: '9' } });
        onChange({ target: { value: '' } });
        expect(patched[0].shape.barThickness).toBe(9);
        expect(without(patched[0], 'shape.barThickness')).toEqual(without(ir, 'shape.barThickness'));
        expect(patched[1]).toEqual(without(ir, 'shape.barThickness'));
    });

    it('bar thickness shows on a bar and on a Conditional form, not on a rectangle without one', () => {
        renderVertex(vertexIR({ form: 'rect' }));
        expect(barInputs()).toHaveLength(0);
        uiMounts.length = 0;
        renderVertex(vertexIR({ form: 'rect', barThickness: 12 }));
        expect(barInputs()).toHaveLength(1);
        uiMounts.length = 0;
        renderVertex(vertexIR({ form: { when: { op: 'literal', value: true }, then: 'bar', else: 'rect' } }));
        expect(barInputs()).toHaveLength(1);
    });
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Wiring: the compartment editor and the segment editor
// ─────────────────────────────────────────────────────────────────────────────────────────────────

const FEATURES: PathBuilderFeatures = {
    attributes: [{ name: 'name', type: 'EString', upperBound: 1 }, { name: 'weight', type: 'EInt', upperBound: 1 }],
    references: [],
} as PathBuilderFeatures;

/** The body of compartment 0 as the editor renders it, and the lists it emits. */
function compartmentBody(c: FieldCompartmentSpec, features: PathBuilderFeatures | null = FEATURES) {
    const emitted: FieldCompartmentSpec[][] = [];
    const props: FieldCompartmentListEditorProps = {
        compartments: [c], features, classNames: [], onChange: (n) => emitted.push(n),
    };
    const outer = (FieldCompartmentListEditor as unknown as (p: FieldCompartmentListEditorProps) => React.ReactElement)(props);
    const body = (outer.props as AnyProps).renderItem(c, 0) as React.ReactNode;
    const lists = find<AnyProps>(body, ListEditor);
    return { body, emitted, excludeList: lists.find(l => l.props.addLabel === 'Add slot') };
}

describe('compartment editor wiring: excluded slots', () => {
    it('is offered on an attributes source only', () => {
        expect(compartmentBody(comp({ from: 'attributes' })).excludeList).toBeDefined();
        expect(compartmentBody(comp({ from: 'references' })).excludeList).toBeUndefined();
        expect(compartmentBody(comp({ from: 'children' })).excludeList).toBeUndefined();
    });

    it('add sets the first name not yet excluded; the rest of the compartment untouched', () => {
        const c = comp({ from: 'attributes' });
        const { excludeList, emitted } = compartmentBody(c);
        expect(excludeList!.props.items).toEqual([]);
        excludeList!.props.onAdd();
        expect(emitted[0][0].source).toEqual({ from: 'attributes', exclude: ['name'] });
        expect(without(emitted[0][0], 'source.exclude')).toEqual(c);
    });

    it('a pick in an item changes that name; removing the last item removes the key', () => {
        const c = comp({ from: 'attributes', exclude: ['name'] });
        const { excludeList, emitted } = compartmentBody(c);
        const selects = find<AnyProps>(excludeList!.props.renderItem('name', 0), Select);
        expect(selects).toHaveLength(1);
        selects[0].props.onChange({ target: { value: 'weight' } });
        excludeList!.props.onRemove(0);
        expect(emitted[0][0].source).toEqual({ from: 'attributes', exclude: ['weight'] });
        expect('exclude' in emitted[1][0].source).toBe(false);
        expect(emitted[1][0]).toEqual(without(c, 'source.exclude'));
    });

    it('a name outside the metaclass stays an option, so the Select does not rewrite it', () => {
        const { excludeList } = compartmentBody(comp({ from: 'attributes', exclude: ['gone'] }));
        const sel = find<AnyProps>(excludeList!.props.renderItem('gone', 0), Select)[0];
        expect(sel.props.value).toBe('gone');
        expect(sel.props.options.map((o: { value: string }) => o.value)).toEqual(['gone', 'name', 'weight']);
    });

    it('the source Select picking attributes again keeps exclude', () => {
        const c = comp({ from: 'attributes', exclude: ['name'] });
        const { body, emitted } = compartmentBody(c);
        const sourceSelect = find<AnyProps>(body, Select)
            .find(s => s.props.options.some((o: { value: string }) => o.value === 'children'))!;
        sourceSelect.props.onChange({ target: { value: 'attributes' } });
        expect(emitted[0][0]).toEqual(c);
    });
});

describe('segment editor wiring: literal style', () => {
    const tree = (segment: FieldSegment, onChange: (s: FieldSegment) => void) =>
        (FieldSegmentEditor as unknown as (p: FieldSegmentEditorProps) => React.ReactNode)({ segment, onChange });

    it('the literal mounts a TextStyleField on its own style; the other kinds do not', () => {
        const seg: Literal = { kind: 'literal', text: 'x', style: { fontSize: 10 } };
        const fields = find<AnyProps>(tree(seg, () => undefined), TextStyleField);
        expect(fields).toHaveLength(1);
        expect(fields[0].props.value).toEqual({ fontSize: 10 });
        for (const kind of ['name', 'type', 'value'] as const) {
            expect(find(tree({ kind } as FieldSegment, () => undefined), TextStyleField)).toHaveLength(0);
        }
    });

    it('set, change and reset through the field; the text stays', () => {
        const seg: Literal = { kind: 'literal', text: 'attr ' };
        const out: FieldSegment[] = [];
        const field = find<AnyProps>(tree(seg, (s) => out.push(s)), TextStyleField)[0];
        field.props.onChange({ color: '#64748b' });
        field.props.onChange({ fontSize: 10 });
        field.props.onChange(undefined);
        expect(out[0]).toEqual({ kind: 'literal', text: 'attr ', style: { color: '#64748b' } });
        expect(out[1]).toEqual({ kind: 'literal', text: 'attr ', style: { fontSize: 10 } });
        expect(out[2]).toEqual(seg);
        expect('style' in out[2]).toBe(false);
    });
});
