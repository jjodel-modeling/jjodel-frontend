/**
 * IR view panel S4a (P-2026-11-11-2315): graphVertex parity with the vertex panel for seven keys the
 * graphVertex panel could not author (audit rows G-19..G-24, G-33 of
 * docs/discovery/discovery_2026-11-11_ir_view_panel_coverage.md).
 *
 * For every key: set from absent, change, reset (the key removed, not left `undefined`), and every other key
 * of the IR strictly deep-equal to before (R-IPC-7). The panel is rendered to markup through
 * `react-dom/server` (the joiner barrel mocked as in panelSections.test.ts), with pass-through spies on the
 * controls it mounts and on `withMetaclassPins`, which every edit of the panel goes through (`patch`): a call
 * to a control's onChange runs the panel's handler up to the draft it would set. Each step re-renders on the
 * previous step's draft.
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
const mounts: { kind: string; props: AnyProps }[] = [];

vi.mock('../../../../ui', async (importOriginal) => {
    const ui = await importOriginal<Record<string, any>>();
    const spy = (kind: string) => (p: AnyProps) => {
        mounts.push({ kind, props: p });
        return React.createElement(ui[kind], p);
    };
    return { ...ui, Select: spy('Select'), Input: spy('Input'), ConditionalEditor: spy('ConditionalEditor') };
});

// Hoisted with the vi.mock calls that use it; `mounts` is read only when a spied editor renders.
const { spyExport } = vi.hoisted(() => ({
    spyExport: (name: string) => async (importOriginal: () => Promise<Record<string, any>>) => {
        const mod = await importOriginal();
        const { createElement: h } = await import('react');
        return {
            ...mod,
            [name]: (p: AnyProps) => {
                mounts.push({ kind: name, props: p });
                return h(mod[name], p);
            },
        };
    },
}));
vi.mock('../BadgeListEditor', spyExport('BadgeListEditor'));
vi.mock('../FieldCompartmentListEditor', spyExport('FieldCompartmentListEditor'));
vi.mock('../TextStyleField', spyExport('TextStyleField'));

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

import { GraphVertexAuthoringPanel } from '../GraphVertexAuthoringPanel';
import { graphVertexSeedIR } from '../../ir/irCreationSeed';
import { validateIR } from '../../ir/irValidate';
import type { BadgeSpec, FieldCompartmentSpec, GraphVertexViewIR, TextStyle } from '../../ir/irTypes';

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const COND = { when: { op: 'literal', value: true }, then: 'x', else: 'plus' } as const;

/** A graphVertex IR carrying keys on every side of the ones under test, so «untouched» has something to measure. */
function gvIR(form: string = 'rect'): GraphVertexViewIR {
    const ir = clone(graphVertexSeedIR()) as any;
    ir.label = 'L';
    ir.defaultSize = { width: 80 };
    ir.visible = false;
    ir.containment = { layout: { mode: 'free', padding: 8 } };
    ir.shape = { ...ir.shape, form, cornerRadius: 6, fill: '#ffffff', border: { color: '#111111', width: 2 } };
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

/** Renders the panel on `ir` and returns the mounts of that render; no edit is patched by the render. */
function render(ir: GraphVertexViewIR, advanced = false) {
    state.advanced = advanced;
    mounts.length = 0;
    patched.length = 0;
    const view = { id: 'view_1', name: 'View', appliableToClasses: [], ir } as any;
    const reduxStore = { getState: () => state, subscribe: () => () => {}, dispatch: (a: unknown) => a } as any;
    const html = renderToStaticMarkup(createElement(Provider, {
        store: reduxStore,
        children: createElement(GraphVertexAuthoringPanel, { view }),
    }));
    expect(patched).toHaveLength(0);
    return { html, mounts: [...mounts] };
}

type Pick = (m: { kind: string; props: AnyProps }) => boolean;

/** The one mount `pick` selects in a render of `ir`. */
function mountOf(ir: GraphVertexViewIR, pick: Pick, advanced = false): AnyProps {
    const found = render(ir, advanced).mounts.filter(pick);
    expect(found).toHaveLength(1);
    return found[0].props;
}

/** Fires `fire` on the mount `pick` selects and returns the draft the panel sets. */
function edit(ir: GraphVertexViewIR, pick: Pick, fire: (p: AnyProps) => void, advanced = false): GraphVertexViewIR {
    const p = mountOf(ir, pick, advanced);
    patched.length = 0;
    fire(p);
    expect(patched).toHaveLength(1);
    return patched[0];
}

/** A Select whose options are exactly `values`, in order (the label editors mount Selects of their own). */
const selectOf = (...values: string[]): Pick => (m) =>
    m.kind === 'Select' && JSON.stringify((m.props.options ?? []).map((o: { value: string }) => o.value)) === JSON.stringify(values);
const isEntry = selectOf('', 'dot', 'arrow');
const isPadding = selectOf('small', 'normal', 'large');
const isMarker: Pick = (m) => m.kind === 'ConditionalEditor' && m.props.rulesTable?.valueNoun === 'marker';
const isBar: Pick = (m) => m.kind === 'Input' && m.props.placeholder === 'box';
const isBadges: Pick = (m) => m.kind === 'BadgeListEditor';
const isCompartments: Pick = (m) => m.kind === 'FieldCompartmentListEditor';
// The Symbol text field hides the underline; a label's own TextStyleField does not.
const isText: Pick = (m) => m.kind === 'TextStyleField' && m.props.hideUnderline === true;

const inputEvent = (value: string) => ({ target: { value } });

/** The common tail of every key: the change touched only `path`, the reset removed it, the result validates. */
function expectRoundTrip(base: GraphVertexViewIR, changed: GraphVertexViewIR, reset: GraphVertexViewIR, path: string) {
    expect(without(changed, path)).toStrictEqual(base);
    const keys = path.split('.');
    const owner = keys.length === 1 ? reset : (reset as any)[keys[0]];
    expect(keys[keys.length - 1] in owner).toBe(false);
    expect(reset).toStrictEqual(base);
    expect(validateIR('view_1', changed).ok).toBe(true);
}

beforeEach(() => { mounts.length = 0; patched.length = 0; state.advanced = false; });

describe('G-21 shape.entry: Entry mark Select', () => {
    it('absent reads None; set dot, change to arrow, None removes the key; nothing else moves', () => {
        const base = gvIR();
        expect(mountOf(base, isEntry).value).toBe('');
        const set = edit(base, isEntry, (p) => p.onChange(inputEvent('dot')));
        expect(set.shape.entry).toBe('dot');
        expect(mountOf(set, isEntry).value).toBe('dot');
        const changed = edit(set, isEntry, (p) => p.onChange(inputEvent('arrow')));
        expect(changed.shape.entry).toBe('arrow');
        const reset = edit(changed, isEntry, (p) => p.onChange(inputEvent('')));
        expectRoundTrip(base, changed, reset, 'shape.entry');
    });
});

describe('G-22 shape.barThickness: Bar thickness field', () => {
    it('not offered on a rect with no value; offered on a bar and on a Conditional form', () => {
        expect(render(gvIR()).mounts.filter(isBar)).toHaveLength(0);
        expect(render(gvIR('bar')).mounts.filter(isBar)).toHaveLength(1);
        const conditional = gvIR();
        (conditional.shape as any).form = { when: { op: 'literal', value: true }, then: 'bar', else: 'rect' };
        expect(render(conditional).mounts.filter(isBar)).toHaveLength(1);
    });

    it('set 12, change to 8, empty removes the key; nothing else moves', () => {
        const base = gvIR('bar');
        expect(mountOf(base, isBar).value).toBe('');
        const set = edit(base, isBar, (p) => p.onChange(inputEvent('12')));
        expect(set.shape.barThickness).toBe(12);
        const changed = edit(set, isBar, (p) => p.onChange(inputEvent('8')));
        expect(changed.shape.barThickness).toBe(8);
        const reset = edit(changed, isBar, (p) => p.onChange(inputEvent(' ')));
        expectRoundTrip(base, changed, reset, 'shape.barThickness');
    });

    it('a value already written keeps the field on a rect, so it can be cleared', () => {
        const ir = gvIR();
        (ir.shape as any).barThickness = 12;
        const reset = edit(ir, isBar, (p) => p.onChange(inputEvent('')));
        expect(reset).toStrictEqual(gvIR());
    });
});

describe('G-19 shape.padding: Padding Select (Advanced only)', () => {
    it('absent in Basic', () => {
        expect(render(gvIR(), false).mounts.filter(isPadding)).toHaveLength(0);
    });

    it('absent reads Normal; set small, change to large, Normal removes the key; nothing else moves', () => {
        const base = gvIR();
        expect(mountOf(base, isPadding, true).value).toBe('normal');
        const set = edit(base, isPadding, (p) => p.onChange(inputEvent('small')), true);
        expect(set.shape.padding).toBe('small');
        const changed = edit(set, isPadding, (p) => p.onChange(inputEvent('large')), true);
        expect(changed.shape.padding).toBe('large');
        const reset = edit(changed, isPadding, (p) => p.onChange(inputEvent('normal')), true);
        expectRoundTrip(base, changed, reset, 'shape.padding');
        const blank = edit(changed, isPadding, (p) => p.onChange(inputEvent('')), true);
        expect(blank).toStrictEqual(base);
    });
});

describe('G-20 shape.marker: Marker ConditionalEditor with the rules table', () => {
    it('mounts with the rules table and the None value; Conditional only in Advanced', () => {
        const basic = mountOf(gvIR(), isMarker, false);
        expect(basic.rulesTable).toMatchObject({ noneValue: '', valueNoun: 'marker' });
        expect(basic.value).toBe('');
        expect(basic.allowConditional).toBe(false);
        expect(mountOf(gvIR(), isMarker, true).allowConditional).toBe(true);
    });

    it('set x, change to a Conditional, None removes the key; nothing else moves', () => {
        const base = gvIR();
        const set = edit(base, isMarker, (p) => p.onChange('x'));
        expect(set.shape.marker).toBe('x');
        expect(mountOf(set, isMarker).value).toBe('x');
        const changed = edit(set, isMarker, (p) => p.onChange(clone(COND)), true);
        expect(changed.shape.marker).toEqual(COND);
        expect(mountOf(changed, isMarker, true).value).toEqual(COND);
        const reset = edit(changed, isMarker, (p) => p.onChange(''), true);
        expectRoundTrip(base, changed, reset, 'shape.marker');
    });
});

describe('G-23 shape.text: Symbol text TextStyleField', () => {
    it('set a size, change to a weight, cleared removes the key; nothing else moves', () => {
        const base = gvIR();
        expect(mountOf(base, isText).value).toBeUndefined();
        const first: TextStyle = { fontSize: 14 };
        const set = edit(base, isText, (p) => p.onChange(first));
        expect(set.shape.text).toEqual(first);
        expect(mountOf(set, isText).value).toEqual(first);
        const second: TextStyle = { fontSize: 14, fontWeight: 'bold' };
        const changed = edit(set, isText, (p) => p.onChange(second));
        expect(changed.shape.text).toEqual(second);
        const reset = edit(changed, isText, (p) => p.onChange(undefined));
        expectRoundTrip(base, changed, reset, 'shape.text');
    });
});

describe('G-24 shape.badges: BadgeListEditor', () => {
    it('absent reads []; add, change, the last removed drops the key; nothing else moves', () => {
        const base = gvIR();
        expect(mountOf(base, isBadges).badges).toEqual([]);
        const one: BadgeSpec = { icon: 'bi-flag', position: 'tr', visible: true };
        const set = edit(base, isBadges, (p) => p.onChange([one]));
        expect(set.shape.badges).toEqual([one]);
        expect(mountOf(set, isBadges).badges).toEqual([one]);
        const changed = edit(set, isBadges, (p) => p.onChange([{ ...one, position: 'bl' }, one]));
        expect(changed.shape.badges).toHaveLength(2);
        const reset = edit(changed, isBadges, (p) => p.onChange([]));
        expectRoundTrip(base, changed, reset, 'shape.badges');
    });
});

describe('G-33 fieldCompartments: FieldCompartmentListEditor', () => {
    const comp = (id: string): FieldCompartmentSpec => ({
        id, source: { from: 'attributes' }, rowFormat: { segments: [{ kind: 'name' }] },
    });

    it('offered on a Symbol with room for rows, not on an ellipse (the vertex panel gate)', () => {
        expect(render(gvIR('rect')).mounts.filter(isCompartments)).toHaveLength(1);
        expect(render(gvIR('ellipse')).mounts.filter(isCompartments)).toHaveLength(0);
    });

    it('absent reads []; add, change, the last removed drops the key; nothing else moves', () => {
        const base = gvIR();
        expect(mountOf(base, isCompartments).compartments).toEqual([]);
        const set = edit(base, isCompartments, (p) => p.onChange([comp('attrs')]));
        expect(set.fieldCompartments).toEqual([comp('attrs')]);
        expect(mountOf(set, isCompartments).compartments).toEqual([comp('attrs')]);
        const changed = edit(set, isCompartments, (p) => p.onChange([comp('attrs'), comp('more')]));
        expect(changed.fieldCompartments).toHaveLength(2);
        const reset = edit(changed, isCompartments, (p) => p.onChange([]));
        expectRoundTrip(base, changed, reset, 'fieldCompartments');
    });
});

describe('absent stays absent', () => {
    it('rendering the seed in Basic and Advanced patches nothing and writes none of the seven keys', () => {
        for (const advanced of [false, true]) {
            const seed = clone(graphVertexSeedIR());
            render(seed, advanced);
            expect(seed).toStrictEqual(graphVertexSeedIR());
        }
    });
});
