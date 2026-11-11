/**
 * The edge panel's controls for `edge.curve` (R-VP-22), `edge.labels.template` and `edge.labels.style` (R-VP-20)
 * (P-2026-11-11-2036, slice S1 of the IR view panel coverage audit, rows E-19, E-22, E-23).
 *
 * The node bench has no DOM, so the panel is rendered to markup through `react-dom/server` (the joiner barrel mocked
 * as in panelSections.test.ts): effects do not run there, and a setState after the render is a no-op. Pass-through
 * spies make the writes observable anyway: the `ui` barrel's Select and ListEditor and the TextStyleField module
 * record the props of the three mounts, and `withMetaclassPins`, which every `patch` of the panel goes through,
 * records the next IR. Each write is then checked against the IR it started from: the key set, changed or removed,
 * and the rest of the IR deep-equal to before (R-IPC-7).
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

type SelectProps = { options: { value: string }[]; value: string; onChange: (e: { target: { value: string } }) => void };
type ListProps = {
    items: unknown[];
    onAdd: () => void;
    onRemove: (i: number) => void;
    onMove: (i: number, d: number) => void;
    renderItem: (item: any, i: number) => React.ReactElement<{ onChange: (s: unknown) => void }>;
    addLabel?: string;
};
type StyleProps = { value: unknown; onChange: (next: unknown) => void; label?: string };

const curveMounts: SelectProps[] = [];
const listMounts: ListProps[] = [];
const styleMounts: StyleProps[] = [];
const patched: any[] = [];

vi.mock('../../../../ui', async (importOriginal) => {
    const ui = await importOriginal<Record<string, any>>();
    return {
        ...ui,
        Select: (p: SelectProps) => {
            if (p.options?.[0]?.value === 'arc') curveMounts.push(p);
            return React.createElement(ui.Select, p);
        },
        ListEditor: (p: ListProps) => {
            if (p.addLabel === 'Add segment') listMounts.push(p);
            return React.createElement(ui.ListEditor, p);
        },
    };
});

vi.mock('../TextStyleField', async (importOriginal) => {
    const tsf = await importOriginal<Record<string, any>>();
    return {
        ...tsf,
        TextStyleField: (p: StyleProps) => {
            styleMounts.push(p);
            return React.createElement(tsf.TextStyleField, p);
        },
    };
});

vi.mock('../../ir/metaclassPin', async (importOriginal) => {
    const mp = await importOriginal<Record<string, any>>();
    return {
        ...mp,
        withMetaclassPins: (prev: unknown, next: unknown, ctx: unknown) => {
            const out = mp.withMetaclassPins(prev, next, ctx);
            patched.push(out);
            return out;
        },
    };
});

import { EdgeAuthoringPanel } from '../EdgeAuthoringPanel';
import { defaultEdgeViewIR } from '../../ir/irDefaults';
import type { EdgeViewIR, TextSource, TextStyle } from '../../ir/irTypes';

const LITERAL: TextSource = { from: 'literal', text: 'weight = ' };
const PATH: TextSource = { from: 'path', expr: 'weight' };
const STYLE: TextStyle = { fontSize: 12, fontWeight: 'medium', color: 'var(--color-inode-quiet)' };

/** An edge view with siblings on every object the three writes touch, so a rebuilt sibling would show. */
function irWith(extra: Partial<EdgeViewIR['edge']> = {}, labels: Record<string, unknown> = {}): EdgeViewIR {
    const ir = defaultEdgeViewIR();
    return {
        ...ir,
        priority: 3,
        edge: {
            ...ir.edge,
            line: { color: '#123456', width: 2 },
            routing: 'straight',
            terminations: { sourceEnd: 'none', targetEnd: 'openArrow' },
            labels: { center: { from: 'literal', text: 'c' }, placement: 'above', ...labels },
            ...extra,
        },
    } as EdgeViewIR;
}

/** Renders the panel on `ir`; returns the markup, the assignments to `view.ir`, and the three mounts. */
function render(ir: EdgeViewIR) {
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
        children: createElement(EdgeAuthoringPanel, { view }),
    }));
    expect(curveMounts).toHaveLength(1);
    expect(listMounts).toHaveLength(1);
    expect(styleMounts).toHaveLength(1);
    return { html, assigned, curve: curveMounts[0], list: listMounts[0], style: styleMounts[0] };
}

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

/** The single write since the render. */
const lastWrite = (): EdgeViewIR => {
    expect(patched).toHaveLength(1);
    return patched[0];
};

/** `ir` with `edge.labels[key]` removed: what the rest of the IR must still equal. */
const withoutLabelsKey = (ir: EdgeViewIR, key: string): EdgeViewIR => {
    const out = clone(ir);
    delete (out.edge.labels as Record<string, unknown>)[key];
    return out;
};

beforeEach(() => {
    state.advanced = false;
    curveMounts.length = 0; listMounts.length = 0; styleMounts.length = 0; patched.length = 0;
});

describe('edge panel mounts: nothing is written on mount', () => {
    for (const advanced of [false, true]) {
        it(`absent keys read absent and stay absent (${advanced ? 'Advanced' : 'Basic'})`, () => {
            state.advanced = advanced;
            const ir = irWith();
            const before = clone(ir);
            const { assigned, curve, list, style } = render(ir);
            expect(curve.value).toBe('');
            expect(list.items).toEqual([]);
            expect(style.value).toBeUndefined();
            expect(assigned).toEqual([]);
            expect(patched).toEqual([]);
            expect(ir).toEqual(before);
        });
    }

    it('persisted values reach their controls', () => {
        const { curve, list, style } = render(irWith({ curve: 'arc' }, { template: [LITERAL, PATH], style: STYLE }));
        expect(curve.value).toBe('arc');
        expect(list.items).toEqual([LITERAL, PATH]);
        expect(style.value).toEqual(STYLE);
    });
});

describe('edge.curve (E-19)', () => {
    it('set: arc is written, the rest of the IR untouched', () => {
        const ir = irWith();
        render(ir).curve.onChange({ target: { value: 'arc' } });
        const next = lastWrite();
        expect(next.edge.curve).toBe('arc');
        const { curve: _c, ...edge } = next.edge;
        expect({ ...next, edge }).toEqual(ir);
    });

    it('change: rewriting arc keeps the rest of the IR', () => {
        const ir = irWith({ curve: 'arc' });
        render(ir).curve.onChange({ target: { value: 'arc' } });
        expect(lastWrite()).toEqual(ir);
    });

    it('reset: the empty option removes the key, not curve: undefined', () => {
        const ir = irWith({ curve: 'arc' });
        render(ir).curve.onChange({ target: { value: '' } });
        const next = lastWrite();
        expect('curve' in next.edge).toBe(false);
        const { curve: _c, ...edge } = ir.edge;
        expect(next).toEqual({ ...ir, edge });
    });

    it('the menu offers the validator vocabulary only', () => {
        expect(render(irWith()).curve.options.map(o => o.value)).toEqual(['arc']);
    });
});

describe('edge.labels.template (E-22)', () => {
    it('set: Add writes a one-segment template beside center and placement', () => {
        const ir = irWith();
        render(ir).list.onAdd();
        const next = lastWrite();
        expect(next.edge.labels?.template).toEqual([{ from: 'literal', text: '' }]);
        expect(withoutLabelsKey(next, 'template')).toEqual(ir);
    });

    it('change: a segment edit replaces that segment only', () => {
        const ir = irWith({}, { template: [LITERAL, PATH] });
        const { list } = render(ir);
        const edited: TextSource = { from: 'literal', text: 'w = ' };
        list.renderItem(LITERAL, 0).props.onChange(edited);
        const next = lastWrite();
        expect(next.edge.labels?.template).toEqual([edited, PATH]);
        expect(withoutLabelsKey(next, 'template')).toEqual(withoutLabelsKey(ir, 'template'));
    });

    it('change: Move swaps two segments', () => {
        const ir = irWith({}, { template: [LITERAL, PATH] });
        render(ir).list.onMove(0, 1);
        const next = lastWrite();
        expect(next.edge.labels?.template).toEqual([PATH, LITERAL]);
        expect(withoutLabelsKey(next, 'template')).toEqual(withoutLabelsKey(ir, 'template'));
    });

    it('reset: removing the last segment removes the key (the validator refuses an empty template)', () => {
        const ir = irWith({}, { template: [LITERAL] });
        render(ir).list.onRemove(0);
        const next = lastWrite();
        expect(next.edge.labels && 'template' in next.edge.labels).toBe(false);
        expect(next).toEqual(withoutLabelsKey(ir, 'template'));
    });

    it('reset: with no other label key left, labels goes too', () => {
        const ir = irWith();
        ir.edge.labels = { template: [LITERAL] };
        render(ir).list.onRemove(0);
        const next = lastWrite();
        expect('labels' in next.edge).toBe(false);
        const { labels: _l, ...edge } = ir.edge;
        expect(next).toEqual({ ...ir, edge });
    });
});

describe('edge.labels.style (E-23)', () => {
    it('set: the style is written beside center and placement', () => {
        const ir = irWith();
        render(ir).style.onChange(STYLE);
        const next = lastWrite();
        expect(next.edge.labels?.style).toEqual(STYLE);
        expect(withoutLabelsKey(next, 'style')).toEqual(ir);
    });

    it('change: a new style replaces the old, siblings kept', () => {
        const ir = irWith({}, { style: STYLE, template: [LITERAL] });
        const changed: TextStyle = { ...STYLE, fontSize: 14 };
        render(ir).style.onChange(changed);
        const next = lastWrite();
        expect(next.edge.labels?.style).toEqual(changed);
        expect(withoutLabelsKey(next, 'style')).toEqual(withoutLabelsKey(ir, 'style'));
    });

    it('reset: undefined removes the key, not style: undefined', () => {
        const ir = irWith({}, { style: STYLE });
        render(ir).style.onChange(undefined);
        const next = lastWrite();
        expect(next.edge.labels && 'style' in next.edge.labels).toBe(false);
        expect(next).toEqual(withoutLabelsKey(ir, 'style'));
    });
});
