/**
 * The corner radius of a graphVertex view in its authoring panel (P-2026-11-11-2025, slice S0, R-IPC-7, R-IRN-35).
 *
 * `shape.cornerRadius` is a Conditional<number>. The panel used a constant-only stepper, which read a persisted
 * conditional as «default» and overwrote it with a number on the first edit (audit row G-14). It now mounts the
 * vertex panel's ConditionalEditor with the rules table.
 *
 * The node bench has no DOM, so the panel is rendered to markup through `react-dom/server` (the joiner barrel mocked
 * as in panelSections.test.ts): effects do not run there, and a setState after the render is a no-op. Two pass-through
 * spies make the wiring observable anyway: the `ui` barrel's ConditionalEditor records the props of the radius mount,
 * and the writers of graphVertexAuthoring.ts record what each call returns, so a call to the mount's onChange runs
 * the panel's handler up to the writer. `view.ir` is an accessor that records every assignment.
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

type MountProps = {
    value: unknown;
    onChange: (next: unknown) => void;
    renderValue: (v: number, onCh: (v: number) => void) => React.ReactNode;
    rulesTable?: { valueNoun?: string };
};
const mounts: MountProps[] = [];

vi.mock('../../../../ui', async (importOriginal) => {
    const ui = await importOriginal<Record<string, any>>();
    return {
        ...ui,
        ConditionalEditor: (p: MountProps) => {
            if (p.rulesTable?.valueNoun === 'corner radius') mounts.push(p);
            return React.createElement(ui.ConditionalEditor, p);
        },
    };
});

const written: { fn: string; result: any }[] = [];

vi.mock('../graphVertexAuthoring', async (importOriginal) => {
    const gva = await importOriginal<Record<string, any>>();
    const spy = (fn: string) => (...args: unknown[]) => {
        const result = gva[fn](...args);
        written.push({ fn, result });
        return result;
    };
    return { ...gva, withShape: spy('withShape'), withoutCornerRadius: spy('withoutCornerRadius') };
});

import { GraphVertexAuthoringPanel } from '../GraphVertexAuthoringPanel';
import { graphVertexSeedIR } from '../../ir/irCreationSeed';
import { Button, NumberInput } from '../../../../ui';
import type { GraphVertexViewIR } from '../../ir/irTypes';

const CONDITIONAL = { when: { op: 'literal', value: true }, then: 16, else: 2 } as const;

function irWith(cornerRadius?: unknown): GraphVertexViewIR {
    const ir = graphVertexSeedIR() as GraphVertexViewIR;
    const { cornerRadius: _seeded, ...shape } = ir.shape;
    return { ...ir, shape: cornerRadius === undefined ? shape : { ...shape, cornerRadius } } as GraphVertexViewIR;
}

/** Renders the panel on `ir`; returns the markup, the radius mount, and the assignments to `view.ir`. */
function render(ir: GraphVertexViewIR, advanced: boolean) {
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
        children: createElement(GraphVertexAuthoringPanel, { view }),
    }));
    expect(mounts).toHaveLength(1);
    return { html, mount: mounts[0], assigned };
}

/** The markup of the Corner radius field: from its label to the next section title. */
const radiusField = (html: string): string => {
    const from = html.indexOf('Corner radius');
    expect(from).toBeGreaterThan(-1);
    return html.slice(from, html.indexOf('<h3', from));
};

/** Every element of `type` in a tree, in document order. */
const find = <P,>(node: React.ReactNode, type: unknown, out: React.ReactElement<P>[] = []) => {
    if (Array.isArray(node)) node.forEach(n => find(n, type, out));
    else if (React.isValidElement(node)) {
        if (node.type === type) out.push(node as React.ReactElement<P>);
        find((node.props as { children?: React.ReactNode }).children, type, out);
    }
    return out;
};

beforeEach(() => { mounts.length = 0; written.length = 0; });

describe('graphVertex panel: a persisted conditional corner radius', () => {
    for (const advanced of [false, true]) {
        it(`writes nothing on mount and hands the conditional to the editor (${advanced ? 'Advanced' : 'Basic'})`, () => {
            const ir = irWith(CONDITIONAL);
            const before = JSON.parse(JSON.stringify(ir));
            const { mount, assigned } = render(ir, advanced);
            expect(assigned).toEqual([]);
            expect(written).toEqual([]);
            expect(ir).toEqual(before);
            expect(mount.value).toEqual(CONDITIONAL);
        });
    }

    it('Basic shows the read-only conditional chip, not «default»; the constant stepper kills this test', () => {
        const field = radiusField(render(irWith(CONDITIONAL), false).html);
        expect(field).toContain('conditional (edit in Advanced mode)');
        expect(field).not.toContain('default');
    });

    it('Advanced shows the rules editor with the persisted then and else, not «default»', () => {
        const field = radiusField(render(irWith(CONDITIONAL), true).html);
        expect(field).not.toContain('>default<');
        expect(field).toContain('value="16"');
        expect(field).toContain('value="2"');
    });

    it('a rule edit writes the conditional through the writer, the radius still a conditional', () => {
        const { mount } = render(irWith(CONDITIONAL), true);
        const next = { ...CONDITIONAL, then: 20 };
        mount.onChange(next);
        expect(written).toHaveLength(1);
        expect(written[0].fn).toBe('withShape');
        expect(written[0].result.shape.cornerRadius).toEqual(next);
    });
});

describe('graphVertex panel: a constant corner radius', () => {
    it('editing the constant writes a number', () => {
        const { mount } = render(irWith(6), false);
        expect(mount.value).toBe(6);
        mount.onChange(9);
        expect(written).toHaveLength(1);
        expect(written[0].fn).toBe('withShape');
        expect(written[0].result.shape.cornerRadius).toBe(9);
    });

    it('the stepper of the constant hands a number to the editor', () => {
        const { mount } = render(irWith(6), false);
        const got: number[] = [];
        const steppers = find<{ onChange?: (v: number) => void; value?: number }>(
            mount.renderValue(6, (v) => got.push(v)), NumberInput);
        expect(steppers).toHaveLength(1);
        expect(steppers[0].props.value).toBe(6);
        steppers[0].props.onChange!(11);
        expect(got).toEqual([11]);
    });

    it('an absent radius reads «default», writes nothing, and stays absent', () => {
        const { html, mount, assigned } = render(irWith(), false);
        expect(mount.value).toBeUndefined();
        expect(radiusField(html)).toContain('default');
        expect(assigned).toEqual([]);
        expect(written).toEqual([]);
    });
});

describe('graphVertex panel: Reset of the corner radius', () => {
    it('the editor clearing the value removes the key (rest/spread, not undefined)', () => {
        const { mount } = render(irWith(6), true);
        mount.onChange(undefined);
        expect(written).toHaveLength(1);
        expect(written[0].fn).toBe('withoutCornerRadius');
        expect('cornerRadius' in written[0].result.shape).toBe(false);
    });

    it('the Reset button beside the stepper removes the key', () => {
        const { mount } = render(irWith(6), false);
        const buttons = find<{ onClick?: () => void }>(mount.renderValue(6, () => undefined), Button);
        expect(buttons).toHaveLength(1);
        buttons[0].props.onClick!();
        expect(written).toHaveLength(1);
        expect(written[0].fn).toBe('withoutCornerRadius');
        expect('cornerRadius' in written[0].result.shape).toBe(false);
    });
});
