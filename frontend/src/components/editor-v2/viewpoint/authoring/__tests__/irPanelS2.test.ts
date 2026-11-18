/**
 * IR view panel S2 (P-2026-11-11-2120): the rules table on every Conditional control that still showed a
 * saved multi-rule value as the read-only chip (audit rows V-28/G-30, V-32, V-34, V-56, X3, G-12, E-13..17,
 * R-10 of docs/discovery/discovery_2026-11-11_ir_view_panel_coverage.md).
 *
 * For every mount: a saved `rules` value reaches a ConditionalEditor that carries `rulesTable`, so it renders
 * the rules editor in Advanced and not the «not yet editable» chip; an edit of one rule, in the normal form
 * `fromRules` writes, goes through the mount's own writer and every other key of the IR stays deep-equal.
 * R-10 also: the row control is offered from absent, a set writes the key and Reset removes it.
 *
 * Harness as irPanelS1a.test.ts: the panels are rendered to markup through `react-dom/server` (the joiner
 * barrel mocked) with a pass-through spy on the `ui` ConditionalEditor and on `withMetaclassPins`; the
 * hook-free list editors are called as functions and their elements read.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';

const state = { advanced: true, idlookup: {} as Record<string, unknown> };

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
const ceMounts: AnyProps[] = [];
const buttonMounts: AnyProps[] = [];

vi.mock('../../../../ui', async (importOriginal) => {
    const ui = await importOriginal<Record<string, any>>();
    return {
        ...ui,
        ConditionalEditor: (p: AnyProps) => {
            ceMounts.push(p);
            return React.createElement(ui.ConditionalEditor, p);
        },
        Button: (p: AnyProps) => {
            buttonMounts.push(p);
            return React.createElement(ui.Button, p);
        },
    };
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

import { ConditionalEditor as RealConditionalEditor } from '../../../../ui/ConditionalEditor/ConditionalEditor';
import { fromRules, toRules } from '../../../../ui/ConditionalEditor/conditional';
import { ConditionalEditor } from '../../../../ui';
import { LabelEntryEditor, type LabelEntryEditorProps } from '../LabelEntryEditor';
import { BadgeListEditor, type BadgeListEditorProps } from '../BadgeListEditor';
import { FieldCompartmentListEditor, type FieldCompartmentListEditorProps } from '../FieldCompartmentListEditor';
import { TextStyleEditor } from '../TextStyleEditor';
import { GraphVertexAuthoringPanel } from '../GraphVertexAuthoringPanel';
import { EdgeAuthoringPanel } from '../EdgeAuthoringPanel';
import { RowAuthoringPanel, withRowVisible } from '../RowAuthoringPanel';
import { defaultEdgeViewIR, defaultObjectViewIR, defaultRowViewIR } from '../../ir/irDefaults';
import { graphVertexSeedIR } from '../../ir/irCreationSeed';
import type {
    BadgeSpec, EdgeViewIR, FieldCompartmentSpec, GraphVertexViewIR, LabelSpec, RowViewIR, TextStyle,
} from '../../ir/irTypes';

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
const WHEN = { op: 'literal', value: true } as const;

/** A saved multi-rule value: two rules and a default. */
const rulesOf = <T,>(a: T, b: T, d: T) => ({ rules: [{ when: WHEN, then: a }, { when: WHEN, then: b }], default: d });
/** The same value after an edit of rule 0's THEN, in the normal form the rules editor writes. */
const editedOf = <T,>(saved: { rules: { when: unknown; then: T }[]; default?: T }, then: T) => {
    const form = toRules<T>(saved as any);
    return fromRules<T>({ ...form, rules: form.rules.map((r, i) => (i === 0 ? { ...r, then } : r)) });
};

/** `x` less one key at `path` (dot separated). */
function without(x: unknown, path: string): unknown {
    const c = clone(x) as any;
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

/** The one ConditionalEditor whose value is `value`. */
const mountOf = (mounts: AnyProps[], value: unknown): AnyProps => {
    const hits = mounts.filter(m => JSON.stringify(m.value) === JSON.stringify(value));
    expect(hits).toHaveLength(1);
    return hits[0];
};

/** The mount offers the rules table, and renders the rules editor rather than the read-only chip. */
function expectRulesEditor(props: AnyProps, valueNoun: string) {
    expect(props.rulesTable).toBeDefined();
    expect(props.rulesTable.valueNoun).toBe(valueNoun);
    const html = renderToStaticMarkup(createElement(RealConditionalEditor as any, props));
    expect(html).not.toContain('not yet editable');
    expect(html).not.toContain('edit in Advanced mode');
    expect(html).toContain('first match wins');
    expect(html).toContain(`Then ${valueNoun}`);
}

/** Renders a panel on `ir`; returns the markup and the assignments to `view.ir`. */
function renderPanel(Panel: React.FC<any>, ir: unknown, advanced = true) {
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
        children: createElement(Panel, { view }),
    }));
    return { html, assigned };
}

beforeEach(() => { ceMounts.length = 0; buttonMounts.length = 0; patched.length = 0; });

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// The hook-free editors
// ─────────────────────────────────────────────────────────────────────────────────────────────────

describe('V-28 / G-30 labels[].visible: LabelEntryEditor', () => {
    const saved = rulesOf(false, true, true);
    const label = (): LabelSpec => ({ ...clone(defaultObjectViewIR().shape.labels![0]), visible: saved } as LabelSpec);

    it('a saved rules value renders the rules editor; a rule edit writes only visible', () => {
        const out: LabelSpec[] = [];
        const l = label();
        const tree = (LabelEntryEditor as unknown as (p: LabelEntryEditorProps) => React.ReactNode)({
            label: l, features: null, classNames: [], onChange: (n) => out.push(n),
        });
        const m = mountOf(find<AnyProps>(tree, ConditionalEditor).map(e => e.props), saved);
        expectRulesEditor(m, 'visibility');
        const edited = editedOf(saved, true);
        m.onChange(edited);
        expect(out[0].visible).toEqual(edited);
        expect(without(out[0], 'visible')).toEqual(without(l, 'visible'));
    });

    it('in Basic the chip stays', () => {
        const tree = (LabelEntryEditor as unknown as (p: LabelEntryEditorProps) => React.ReactNode)({
            label: label(), features: null, classNames: [], allowConditional: false, onChange: () => undefined,
        });
        const m = mountOf(find<AnyProps>(tree, ConditionalEditor).map(e => e.props), saved);
        expect(renderToStaticMarkup(createElement(RealConditionalEditor as any, m))).toContain('edit in Advanced mode');
    });
});

describe('V-32 / V-34 badges[].icon and badges[].visible: BadgeListEditor', () => {
    const icon = rulesOf('bi-star', 'bi-flag', 'bi-dot');
    const visible = rulesOf(false, true, true);

    for (const [key, saved, then, noun] of [
        ['icon', icon, 'bi-x', 'icon'],
        ['visible', visible, true, 'visibility'],
    ] as const) {
        it(`${key}: a saved rules value renders the rules editor; a rule edit writes only ${key}`, () => {
            const badge = { icon: 'bi-star', position: 'tr', visible: true, tooltip: 't', [key]: saved } as unknown as BadgeSpec;
            const other = { icon: 'bi-flag', position: 'bl', visible: true } as BadgeSpec;
            const emitted: BadgeSpec[][] = [];
            const props: BadgeListEditorProps = {
                badges: [badge, other], features: null, classNames: [], onChange: (n) => emitted.push(n),
            };
            const outer = (BadgeListEditor as unknown as (p: BadgeListEditorProps) => React.ReactElement)(props);
            const body = (outer.props as AnyProps).renderItem(badge, 0) as React.ReactNode;
            const m = mountOf(find<AnyProps>(body, ConditionalEditor).map(e => e.props), saved);
            expectRulesEditor(m, noun);
            const edited = editedOf<any>(saved, then);
            m.onChange(edited);
            expect((emitted[0][0] as any)[key]).toEqual(edited);
            expect(without(emitted[0][0], key)).toEqual(without(badge, key));
            expect(emitted[0][1]).toEqual(other);
        });
    }
});

describe('V-56 fieldCompartments[].visible: FieldCompartmentListEditor', () => {
    it('a saved rules value renders the rules editor; a rule edit writes only visible', () => {
        const saved = rulesOf(false, true, true);
        const c = { ...clone(defaultObjectViewIR().fieldCompartments![0]), visible: saved } as FieldCompartmentSpec;
        const emitted: FieldCompartmentSpec[][] = [];
        const props: FieldCompartmentListEditorProps = {
            compartments: [c], features: null, classNames: [], onChange: (n) => emitted.push(n),
        };
        const outer = (FieldCompartmentListEditor as unknown as (p: FieldCompartmentListEditorProps) => React.ReactElement)(props);
        const body = (outer.props as AnyProps).renderItem(c, 0) as React.ReactNode;
        const m = mountOf(find<AnyProps>(body, ConditionalEditor).map(e => e.props), saved);
        expectRulesEditor(m, 'visibility');
        const edited = editedOf(saved, true);
        m.onChange(edited);
        expect(emitted[0][0].visible).toEqual(edited);
        expect(without(emitted[0][0], 'visible')).toEqual(without(c, 'visible'));
    });
});

describe('X3 the six Conditional axes of TextStyle: TextStyleEditor', () => {
    const base: TextStyle = {
        fontFamily: 'sans', fontSize: 12, fontWeight: 'medium', fontStyle: 'normal', underline: false, color: '#111111',
        letterSpacing: 0.05, textTransform: 'uppercase',
    } as TextStyle;
    const axes = [
        ['fontFamily', rulesOf('mono', 'sans', 'sans'), 'sans', 'font'],
        ['fontSize', rulesOf(10, 14, 12), 18, 'size'],
        ['fontWeight', rulesOf('bold', 'normal', 'medium'), 'semibold', 'weight'],
        ['fontStyle', rulesOf('italic', 'normal', 'normal'), 'normal', 'style'],
        ['underline', rulesOf(true, false, false), false, 'underline'],
        ['color', rulesOf('#ff0000', '#00ff00', '#0000ff'), '#123456', 'color'],
    ] as const;

    for (const [key, saved, then, noun] of axes) {
        it(`${key}: a saved rules value renders the rules editor; a rule edit writes only ${key}`, () => {
            const style = { ...base, [key]: saved } as TextStyle;
            const out: (TextStyle | undefined)[] = [];
            const html = renderToStaticMarkup(createElement(TextStyleEditor, {
                value: style, onChange: (n) => out.push(n), features: null, classNames: [],
            }));
            expect(html).not.toContain('not yet editable');
            const m = mountOf(ceMounts, saved);
            expectRulesEditor(m, noun);
            const edited = editedOf<any>(saved, then);
            m.onChange(edited);
            expect((out[0] as any)[key]).toEqual(edited);
            expect(without(out[0], key)).toEqual(without(style, key));
        });
    }
});

// ─────────────────────────────────────────────────────────────────────────────────────────────────
// The panels
// ─────────────────────────────────────────────────────────────────────────────────────────────────

describe('G-12 graphVertex visible: GraphVertexAuthoringPanel', () => {
    const saved = rulesOf(false, true, true);
    const ir = () => ({ ...(graphVertexSeedIR() as GraphVertexViewIR), visible: saved } as GraphVertexViewIR);

    it('mounting writes nothing; the saved rules value renders the rules editor in Advanced', () => {
        const before = ir();
        const { html, assigned } = renderPanel(GraphVertexAuthoringPanel, before);
        expect(assigned).toEqual([]);
        expect(patched).toEqual([]);
        expect(html).not.toContain('not yet editable');
        expectRulesEditor(mountOf(ceMounts, saved), 'visibility');
    });

    it('a rule edit writes only visible', () => {
        const before = ir();
        renderPanel(GraphVertexAuthoringPanel, before);
        const edited = editedOf(saved, true);
        mountOf(ceMounts, saved).onChange(edited);
        expect(patched[0].visible).toEqual(edited);
        expect(without(patched[0], 'visible')).toEqual(without(before, 'visible'));
    });

    it('in Basic the chip stays', () => {
        const { html } = renderPanel(GraphVertexAuthoringPanel, ir(), false);
        expect(html).toContain('edit in Advanced mode');
        expect(html).not.toContain('not yet editable');
    });
});

describe('E-13..17 edge line axes and terminations: EdgeAuthoringPanel', () => {
    const base = (): EdgeViewIR => {
        const ir = defaultEdgeViewIR();
        return {
            ...ir,
            priority: 3,
            edge: {
                ...ir.edge,
                line: { color: '#123456', width: 2, style: 'dashed' },
                routing: 'straight',
                terminations: { sourceEnd: 'none', targetEnd: 'openArrow' },
            },
        } as EdgeViewIR;
    };
    const cases = [
        ['edge.line.color', rulesOf('#ff0000', '#00ff00', '#0000ff'), '#abcdef', 'line color'],
        ['edge.line.width', rulesOf(1, 3, 2), 5, 'line width'],
        ['edge.line.style', rulesOf('dotted', 'solid', 'dashed'), 'solid', 'line dash'],
        ['edge.terminations.sourceEnd', rulesOf('diamond', 'none', 'none'), 'openArrow', 'source end'],
        ['edge.terminations.targetEnd', rulesOf('openArrow', 'none', 'openArrow'), 'diamond', 'target end'],
    ] as const;

    for (const [path, saved, then, noun] of cases) {
        it(`${path}: the saved rules value renders the rules editor; a rule edit writes only it`, () => {
            const ir = base() as any;
            const [, obj, key] = path.split('.');
            ir.edge[obj][key] = saved;
            const { html, assigned } = renderPanel(EdgeAuthoringPanel, ir);
            expect(assigned).toEqual([]);
            expect(html).not.toContain('not yet editable');
            const m = mountOf(ceMounts, saved);
            expectRulesEditor(m, noun);
            const edited = editedOf<any>(saved, then);
            m.onChange(edited);
            expect(patched[0].edge[obj][key]).toEqual(edited);
            expect(without(patched[0], path)).toEqual(without(ir, path));
        });
    }

    it('in Basic a rules termination keeps the chip', () => {
        const ir = base() as any;
        ir.edge.terminations.sourceEnd = rulesOf('diamond', 'none', 'none');
        const { html } = renderPanel(EdgeAuthoringPanel, ir, false);
        expect(html).toContain('edit in Advanced mode');
        expect(html).not.toContain('not yet editable');
    });
});

describe('R-10 row visible: RowAuthoringPanel', () => {
    const base = (): RowViewIR => ({ ...defaultRowViewIR(), label: 'R', priority: 2 } as RowViewIR);
    const rowVisible = () => {
        const hits = ceMounts.filter(m => m.rulesTable?.valueNoun === 'visibility');
        expect(hits).toHaveLength(1);
        return hits[0];
    };
    const reset = () => buttonMounts.filter(b => b.children === 'Reset');

    it('withRowVisible: undefined drops the key, any other value is written as is', () => {
        const ir = base();
        const set = withRowVisible(ir, false);
        expect(set.visible).toBe(false);
        expect(withRowVisible(set, true).visible).toBe(true);
        const dropped = withRowVisible(set, undefined);
        expect('visible' in dropped).toBe(false);
        expect(dropped).toEqual(ir);
    });

    it('offered from absent: mounting writes nothing, no Reset; a set writes the key', () => {
        const ir = base();
        const { assigned } = renderPanel(RowAuthoringPanel, ir);
        expect(assigned).toEqual([]);
        expect(patched).toEqual([]);
        const m = rowVisible();
        expect(m.value).toBeUndefined();
        expect(reset()).toHaveLength(0);
        m.onChange(false);
        expect(patched[0].visible).toBe(false);
        expect(without(patched[0], 'visible')).toEqual(ir);
    });

    it('Reset removes the key', () => {
        const ir = { ...base(), visible: false } as RowViewIR;
        renderPanel(RowAuthoringPanel, ir);
        expect(reset()).toHaveLength(1);
        reset()[0].onClick();
        expect('visible' in patched[0]).toBe(false);
        expect(patched[0]).toEqual(without(ir, 'visible'));
    });

    it('a saved rules value renders the rules editor; a rule edit writes only visible', () => {
        const saved = rulesOf(false, true, true);
        const ir = { ...base(), visible: saved } as RowViewIR;
        const { html } = renderPanel(RowAuthoringPanel, ir);
        expect(html).not.toContain('not yet editable');
        const m = mountOf(ceMounts, saved);
        expectRulesEditor(m, 'visibility');
        const edited = editedOf(saved, true);
        m.onChange(edited);
        expect(patched[0].visible).toEqual(edited);
        expect(without(patched[0], 'visible')).toEqual(without(ir, 'visible'));
    });
});
