/**
 * IR view panel S3 (P-2026-11-11-2140): the edge view `label` (E-10), `edge.labels.placement` (E-21) and
 * `edge.persistWaypoints` (E-26) in the edge panel, and the `caption` of an expression source in every
 * TextSourceEditor (V-27 note), rows of docs/discovery/discovery_2026-11-11_ir_view_panel_coverage.md.
 *
 * For every control: absent stays absent on mount; set writes the key; change replaces it; reset removes the key;
 * every other key of the IR stays deep-equal (R-IPC-7).
 *
 * Harness as edgeCurveLabelControls.test.ts: the panel is rendered to markup through `react-dom/server` (the joiner
 * barrel mocked), pass-through spies on the `ui` barrel record the mounts in render order, and `withMetaclassPins`,
 * which every `patch` of the panel goes through, records the next IR. TextSourceEditor is hook-free: it is called as
 * a function and its elements read.
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
/** Every spied mount, in render order. */
const mounts: { kind: 'Select' | 'Input' | 'Toggle' | 'Button'; p: AnyProps }[] = [];
const patched: any[] = [];

vi.mock('../../../../ui', async (importOriginal) => {
    const ui = await importOriginal<Record<string, any>>();
    const spy = (kind: 'Select' | 'Input' | 'Toggle' | 'Button') => (p: AnyProps) => {
        mounts.push({ kind, p });
        return React.createElement(ui[kind], p);
    };
    return { ...ui, Select: spy('Select'), Input: spy('Input'), Toggle: spy('Toggle'), Button: spy('Button') };
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
import { TextSourceEditor, withCaption } from '../TextSourceEditor';
import { defaultEdgeViewIR } from '../../ir/irDefaults';
import type { EdgeViewIR, TextSource } from '../../ir/irTypes';

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

/** An edge view with siblings on every object the writes touch, so a rebuilt sibling would show. */
function irWith(extra: Partial<EdgeViewIR['edge']> = {}, labels: Record<string, unknown> = {}, top: Partial<EdgeViewIR> = {}): EdgeViewIR {
    const ir = defaultEdgeViewIR();
    return {
        ...ir,
        priority: 3,
        ...top,
        edge: {
            ...ir.edge,
            line: { color: '#123456', width: 2 },
            routing: 'straight',
            terminations: { sourceEnd: 'none', targetEnd: 'openArrow' },
            labels: { center: { from: 'literal', text: 'c' }, style: { fontSize: 12 }, ...labels },
            ...extra,
        },
    } as EdgeViewIR;
}

/** Renders the panel on `ir`; returns the assignments to `view.ir` and the three controls of this slice. */
function render(ir: EdgeViewIR) {
    let current: unknown = ir;
    const assigned: unknown[] = [];
    const view = {
        id: 'view_1', name: 'View', appliableToClasses: [],
        get ir() { return current; },
        set ir(v: unknown) { assigned.push(v); current = v; },
    } as any;
    const reduxStore = { getState: () => state, subscribe: () => () => {}, dispatch: (a: unknown) => a } as any;
    renderToStaticMarkup(createElement(Provider, { store: reduxStore, children: createElement(EdgeAuthoringPanel, { view }) }));

    const placements = mounts.filter(m => m.kind === 'Select' && m.p.options?.[0]?.value === 'above');
    expect(placements).toHaveLength(1);
    const toggleAt = mounts.findIndex(m => m.kind === 'Toggle' && m.p.label === 'Save the layout');
    expect(toggleAt).toBeGreaterThanOrEqual(0);
    // The Reset of the toggle is the Button right after it, when the key is set.
    const next = mounts[toggleAt + 1];
    const reset = next?.kind === 'Button' && next.p.children === 'Reset' ? next.p : undefined;
    // The view label is the only Input of the panel that sits before the center label's TextSourceEditor and
    // carries no placeholder; the fixture's center literal is 'c'.
    const labelInputs = mounts.filter(m => m.kind === 'Input' && m.p.placeholder === undefined && m.p.value !== 'c');
    expect(labelInputs).toHaveLength(1);
    return { assigned, placement: placements[0].p, toggle: mounts[toggleAt].p, reset, label: labelInputs[0].p };
}

/** The single write since the render. */
const lastWrite = (): EdgeViewIR => {
    expect(patched).toHaveLength(1);
    return patched[0];
};

const withoutEdgeKey = (ir: EdgeViewIR, key: string): EdgeViewIR => {
    const out = clone(ir);
    delete (out.edge as Record<string, unknown>)[key];
    return out;
};
const withoutLabelsKey = (ir: EdgeViewIR, key: string): EdgeViewIR => {
    const out = clone(ir);
    delete (out.edge.labels as Record<string, unknown>)[key];
    return out;
};

beforeEach(() => {
    state.advanced = false;
    mounts.length = 0; patched.length = 0;
});

describe('S3 controls: nothing is written on mount', () => {
    for (const advanced of [false, true]) {
        it(`absent keys read as their default and stay absent (${advanced ? 'Advanced' : 'Basic'})`, () => {
            state.advanced = advanced;
            const ir = irWith();
            const before = clone(ir);
            const { assigned, placement, toggle, reset, label } = render(ir);
            expect(placement.value).toBe('');
            expect(toggle.checked).toBe(true);
            expect(reset).toBeUndefined();
            expect(label.value).toBe('');
            expect(assigned).toEqual([]);
            expect(patched).toEqual([]);
            expect(ir).toEqual(before);
        });
    }

    it('persisted values reach their controls', () => {
        const { placement, toggle, reset, label } = render(irWith({ persistWaypoints: false }, { placement: 'below' }, { label: 'Owns' }));
        expect(placement.value).toBe('below');
        expect(toggle.checked).toBe(false);
        expect(reset).toBeDefined();
        expect(label.value).toBe('Owns');
    });

    it('an explicit auto, and a value outside the vocabulary, read as the empty option', () => {
        expect(render(irWith({}, { placement: 'auto' })).placement.value).toBe('');
        mounts.length = 0;
        expect(render(irWith({}, { placement: 'left' })).placement.value).toBe('');
        expect(patched).toEqual([]);
    });
});

describe('edge view label (E-10)', () => {
    it('set: the label is written, the rest of the IR untouched', () => {
        const ir = irWith();
        render(ir).label.onChange({ target: { value: 'Owns' } });
        const next = lastWrite();
        expect(next.label).toBe('Owns');
        const { label: _l, ...rest } = next;
        expect(rest).toEqual(ir);
    });

    it('change: a new label replaces the old', () => {
        const ir = irWith({}, {}, { label: 'Owns' });
        render(ir).label.onChange({ target: { value: 'Has' } });
        expect(lastWrite()).toEqual({ ...ir, label: 'Has' });
    });

    it('reset: an emptied field removes the key, not label: ""', () => {
        const ir = irWith({}, {}, { label: 'Owns' });
        render(ir).label.onChange({ target: { value: '' } });
        const next = lastWrite();
        expect('label' in next).toBe(false);
        const { label: _l, ...rest } = ir;
        expect(next).toEqual(rest);
    });
});

describe('edge.labels.placement (E-21)', () => {
    it('set: above is written beside center and style', () => {
        const ir = irWith();
        render(ir).placement.onChange({ target: { value: 'above' } });
        const next = lastWrite();
        expect(next.edge.labels?.placement).toBe('above');
        expect(withoutLabelsKey(next, 'placement')).toEqual(ir);
    });

    it('change: below replaces above, siblings kept', () => {
        const ir = irWith({}, { placement: 'above' });
        render(ir).placement.onChange({ target: { value: 'below' } });
        const next = lastWrite();
        expect(next.edge.labels?.placement).toBe('below');
        expect(withoutLabelsKey(next, 'placement')).toEqual(withoutLabelsKey(ir, 'placement'));
    });

    it('reset: the empty option removes the key, not placement: undefined', () => {
        const ir = irWith({}, { placement: 'below' });
        render(ir).placement.onChange({ target: { value: '' } });
        const next = lastWrite();
        expect('placement' in (next.edge.labels ?? {})).toBe(false);
        expect(next).toEqual(withoutLabelsKey(ir, 'placement'));
    });

    it('reset: with no other label key left, labels goes too', () => {
        const ir = irWith();
        ir.edge.labels = { placement: 'above' };
        render(ir).placement.onChange({ target: { value: '' } });
        const next = lastWrite();
        expect('labels' in next.edge).toBe(false);
        expect(next).toEqual(withoutEdgeKey(ir, 'labels'));
    });

    it('the menu offers the validator vocabulary minus the auto default', () => {
        expect(render(irWith()).placement.options.map((o: { value: string }) => o.value)).toEqual(['above', 'below']);
    });
});

describe('edge.persistWaypoints (E-26)', () => {
    it('set: switching off from absent writes false, the rest of the IR untouched', () => {
        const ir = irWith();
        render(ir).toggle.onChange(false);
        const next = lastWrite();
        expect(next.edge.persistWaypoints).toBe(false);
        expect(withoutEdgeKey(next, 'persistWaypoints')).toEqual(ir);
    });

    it('change: switching on from false writes true', () => {
        const ir = irWith({ persistWaypoints: false });
        render(ir).toggle.onChange(true);
        const next = lastWrite();
        expect(next.edge.persistWaypoints).toBe(true);
        expect(withoutEdgeKey(next, 'persistWaypoints')).toEqual(withoutEdgeKey(ir, 'persistWaypoints'));
    });

    it('reset: the Reset button removes the key', () => {
        const ir = irWith({ persistWaypoints: false });
        const { reset } = render(ir);
        reset!.onClick();
        const next = lastWrite();
        expect('persistWaypoints' in next.edge).toBe(false);
        expect(next).toEqual(withoutEdgeKey(ir, 'persistWaypoints'));
    });
});

describe('TextSourceEditor: the caption of an expression source', () => {
    /** The caption Input of the editor's element tree, when there is one. */
    const captionInput = (source: TextSource, onChange: (s: TextSource) => void = () => {}) => {
        const el = (TextSourceEditor as (p: unknown) => React.ReactElement<{ children: unknown[] }>)({ source, onChange, features: null });
        const kids = (el.props.children as unknown[]).flat().filter(Boolean) as React.ReactElement<AnyProps>[];
        return kids.find(k => k.props?.placeholder === 'Caption (optional)')?.props;
    };
    const EXPR = { from: 'expression', slot: 'weight' } as const;

    it('offered on an expression source only, absent read as empty', () => {
        expect(captionInput(EXPR)?.value).toBe('');
        expect(captionInput({ ...EXPR, caption: 'Weight' })?.value).toBe('Weight');
        expect(captionInput({ from: 'literal', text: 'x' })).toBeUndefined();
        expect(captionInput({ from: 'path', expr: 'name' })).toBeUndefined();
        expect(captionInput({ from: 'intrinsic', prop: 'name' })).toBeUndefined();
    });

    it('set: the caption is written beside the slot', () => {
        const out: TextSource[] = [];
        captionInput(EXPR, s => out.push(s))!.onChange({ target: { value: 'Weight' } });
        expect(out).toEqual([{ ...EXPR, caption: 'Weight' }]);
    });

    it('change: a new caption replaces the old, the slot kept', () => {
        const out: TextSource[] = [];
        captionInput({ ...EXPR, caption: 'Weight' }, s => out.push(s))!.onChange({ target: { value: 'Cost' } });
        expect(out).toEqual([{ ...EXPR, caption: 'Cost' }]);
    });

    it('reset: an emptied field removes the key, not caption: ""', () => {
        const out: TextSource[] = [];
        captionInput({ ...EXPR, caption: 'Weight' }, s => out.push(s))!.onChange({ target: { value: '' } });
        expect(out).toEqual([EXPR]);
        expect('caption' in out[0]).toBe(false);
    });

    it('a slot edit keeps the caption', () => {
        const el = (TextSourceEditor as (p: unknown) => React.ReactElement<{ children: unknown[] }>)({
            source: { ...EXPR, caption: 'Weight' }, onChange: (s: TextSource) => out.push(s), features: null,
        });
        const out: TextSource[] = [];
        const kids = (el.props.children as unknown[]).flat().filter(Boolean) as React.ReactElement<AnyProps>[];
        kids.find(k => k.props?.placeholder === 'Slot feature name')!.props.onChange({ target: { value: 'cost' } });
        expect(out).toEqual([{ from: 'expression', slot: 'cost', caption: 'Weight' }]);
    });

    it('withCaption does not mutate its input', () => {
        const src = { ...EXPR, caption: 'Weight' };
        withCaption(src, '');
        withCaption(src, 'Cost');
        expect(src).toEqual({ ...EXPR, caption: 'Weight' });
    });
});
