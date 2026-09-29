/**
 * LabelEntryEditor — the position select with the outside positions (P-2026-09-29-1245).
 *
 * Executed, not read: `LabelEntryEditor.tsx` loads in the node bench (React and the `ui`
 * barrel are pure at import, as for TextStyleEditor), so the two mappers are called and the
 * editor is rendered to markup through `react-dom/server`, where React emits `selected` on
 * the option of a controlled `<select>`.
 */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LabelEntryEditor, applyLabelPositionValue, labelPositionValue } from '../LabelEntryEditor';
import type { LabelSpec } from '../../ir/irTypes';

const base = (over: Partial<LabelSpec> = {}): LabelSpec =>
    ({ position: 'top', source: { from: 'intrinsic', prop: 'name' }, ...over });

describe('labelPositionValue: the select value of a label', () => {
    it('is the position itself for the four inside positions', () => {
        for (const position of ['top', 'center', 'inside', 'bottom'] as const) {
            expect(labelPositionValue(base({ position }))).toBe(position);
        }
    });

    it('is outside:<anchor> for an outside label, below when the anchor is absent', () => {
        expect(labelPositionValue(base({ position: 'outside' }))).toBe('outside:s');
        for (const anchor of ['n', 'e', 's', 'w'] as const) {
            expect(labelPositionValue(base({ position: 'outside', anchor }))).toBe(`outside:${anchor}`);
        }
    });

    it('reads an unknown persisted anchor as the canvas draws it, below', () => {
        expect(labelPositionValue(base({ position: 'outside', anchor: 'nw' as unknown as 'n' }))).toBe('outside:s');
    });
});

describe('applyLabelPositionValue: the label after a choice', () => {
    it('an inside choice writes the position in its place and nothing else', () => {
        const label = base({ position: 'top', editable: false });
        const next = applyLabelPositionValue(label, 'bottom');
        expect(next).toEqual({ ...label, position: 'bottom' });
        expect(Object.keys(next)).toEqual(Object.keys(label));
    });

    it('Above, Left and Right write outside plus the anchor', () => {
        for (const anchor of ['n', 'w', 'e'] as const) {
            expect(applyLabelPositionValue(base(), `outside:${anchor}`)).toEqual({ ...base(), position: 'outside', anchor });
        }
    });

    it('Below writes outside alone: the s default is never persisted', () => {
        const next = applyLabelPositionValue(base({ position: 'outside', anchor: 'n' }), 'outside:s');
        expect(next).toEqual({ ...base(), position: 'outside' });
        expect('anchor' in next).toBe(false);
    });

    it('going back inside drops the anchor', () => {
        const next = applyLabelPositionValue(base({ position: 'outside', anchor: 'e' }), 'center');
        expect(next).toEqual({ ...base(), position: 'center' });
        expect('anchor' in next).toBe(false);
    });

    it('round-trips through the select value for every option', () => {
        for (const v of ['top', 'center', 'inside', 'bottom', 'outside:n', 'outside:s', 'outside:w', 'outside:e']) {
            expect(labelPositionValue(applyLabelPositionValue(base(), v)), v).toBe(v);
        }
    });
});

describe('LabelEntryEditor: the rendered position select', () => {
    const render = (label: LabelSpec) => renderToStaticMarkup(React.createElement(LabelEntryEditor, {
        label, features: null, classNames: [], onChange: () => undefined,
    }));

    it('offers the positions in two groups, Inside then Outside, in a fixed order', () => {
        const html = render(base());
        const inside = html.indexOf('<optgroup label="Inside">');
        const outside = html.indexOf('<optgroup label="Outside">');
        expect(inside).toBeGreaterThanOrEqual(0);
        expect(outside).toBeGreaterThan(inside);
        const order = ['"top"', '"center"', '"inside"', '"bottom"', '"outside:n"', '"outside:s"', '"outside:w"', '"outside:e"']
            .map(v => html.indexOf(`value=${v}`));
        expect(order.every(i => i >= 0)).toBe(true);
        expect([...order].sort((a, b) => a - b)).toEqual(order);
        expect(html).toMatch(/value="outside:n"[^>]*>Above</);
        expect(html).toMatch(/value="outside:s"[^>]*>Below</);
        expect(html).toMatch(/value="outside:w"[^>]*>Left</);
        expect(html).toMatch(/value="outside:e"[^>]*>Right</);
    });

    it('selects the option of the label: an outside label with anchor e reads Right', () => {
        expect(render(base({ position: 'outside', anchor: 'e' }))).toMatch(/value="outside:e" selected=""/);
        expect(render(base({ position: 'outside' }))).toMatch(/value="outside:s" selected=""/);
        expect(render(base({ position: 'inside' }))).toMatch(/value="inside" selected=""/);
    });
});
