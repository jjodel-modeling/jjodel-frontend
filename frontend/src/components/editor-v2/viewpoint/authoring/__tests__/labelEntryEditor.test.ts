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
import { LabelEntryEditor, applyLabelEditable, applyLabelPositionValue, labelPositionValue } from '../LabelEntryEditor';
import type { LabelEntryEditorProps } from '../LabelEntryEditor';
import { Toggle } from '../../../../ui';
import type { LabelSpec, TextSource } from '../../ir/irTypes';

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

/**
 * The Editable toggle (P-2026-10-01-2349). The toggle shows what the canvas does: an intrinsic name
 * or qualifiedName label renames unless `editable` is false, so absent reads ON; a source that
 * cannot rename reads OFF and is disabled. Rendered to markup for the state, and the component
 * called as a function (it has no hooks) to reach the Toggle element and fire its onChange, so the
 * wiring from the switch to the label is executed, not read.
 */
describe('applyLabelEditable: the label after a click on the toggle', () => {
    it('OFF writes editable false; writing true instead kills this test', () => {
        expect(applyLabelEditable(base(), false)).toEqual({ ...base(), editable: false });
    });

    it('ON removes the key, the IR stays minimal; writing true instead kills this test', () => {
        const next = applyLabelEditable(base({ editable: false }), true);
        expect(next).toEqual(base());
        expect('editable' in next).toBe(false);
    });

    it('ON on a persisted true removes it too, and every other key keeps its place', () => {
        const label = base({ editable: true, visible: false, anchor: undefined });
        const next = applyLabelEditable(label, true);
        expect('editable' in next).toBe(false);
        expect(Object.keys(next)).toEqual(Object.keys(label).filter(k => k !== 'editable'));
        expect(applyLabelEditable(label, false)).toEqual({ ...label, editable: false });
        expect(Object.keys(applyLabelEditable(label, false))).toEqual(Object.keys(label));
    });
});

describe('LabelEntryEditor: the Editable toggle', () => {
    const SRC: Record<string, TextSource> = {
        name: { from: 'intrinsic', prop: 'name' },
        qualifiedName: { from: 'intrinsic', prop: 'qualifiedName' },
        metaclassName: { from: 'intrinsic', prop: 'metaclassName' },
        literal: { from: 'literal', text: 'fixed' },
        path: { from: 'path', expr: '$name.value' },
    };
    const HINT = 'Only a name label can be renamed on the canvas.';

    const props = (label: LabelSpec, onChange: (l: LabelSpec) => void = () => undefined): LabelEntryEditorProps =>
        ({ label, features: null, classNames: [], onChange });
    const render = (label: LabelSpec) => renderToStaticMarkup(React.createElement(LabelEntryEditor, props(label)));
    /** The first switch of the markup is the Editable one (Position, Source, Editable, Visible). */
    const editableSwitch = (html: string): string => html.match(/<button[^>]*role="switch"[^>]*>/)![0];

    const toggles = (node: React.ReactNode, out: React.ReactElement<{ checked?: boolean; disabled?: boolean; onChange?: (c: boolean) => void }>[] = []) => {
        if (Array.isArray(node)) node.forEach(n => toggles(n, out));
        else if (React.isValidElement(node)) {
            if (node.type === Toggle) out.push(node as never);
            toggles((node.props as { children?: React.ReactNode }).children, out);
        }
        return out;
    };
    const tree = (label: LabelSpec, onChange?: (l: LabelSpec) => void) =>
        (LabelEntryEditor as unknown as (p: LabelEntryEditorProps) => React.ReactNode)(props(label, onChange));

    it('reads ON at rest for an intrinsic name label with editable absent; testing === true kills this test', () => {
        expect(editableSwitch(render(base()))).toContain('aria-checked="true"');
        expect(editableSwitch(render(base({ source: SRC.qualifiedName })))).toContain('aria-checked="true"');
    });

    it('reads ON for a persisted true and OFF for false', () => {
        expect(editableSwitch(render(base({ editable: true })))).toContain('aria-checked="true"');
        expect(editableSwitch(render(base({ editable: false })))).toContain('aria-checked="false"');
    });

    it('is enabled and carries no hint on an intrinsic name label', () => {
        const html = render(base());
        expect(editableSwitch(html)).not.toContain('disabled');
        expect(html).not.toContain(HINT);
    });

    it('is disabled and OFF with the hint for a literal, a path and a metaclassName; enabling them kills this test', () => {
        for (const key of ['literal', 'path', 'metaclassName']) {
            const html = render(base({ source: SRC[key] }));
            expect(editableSwitch(html), key).toContain('disabled=""');
            expect(editableSwitch(html), key).toContain('aria-checked="false"');
            expect(html, key).toContain(HINT);
        }
    });

    it('stays OFF and disabled on a non-name source even when editable true is stored, and writes nothing on render', () => {
        const calls: LabelSpec[] = [];
        const label = base({ source: SRC.literal, editable: true });
        const html = renderToStaticMarkup(React.createElement(LabelEntryEditor, props(label, (l) => calls.push(l))));
        expect(editableSwitch(html)).toContain('aria-checked="false"');
        expect(editableSwitch(html)).toContain('disabled=""');
        expect(calls).toEqual([]);
        expect(label).toEqual(base({ source: SRC.literal, editable: true }));
    });

    it('the switch of an intrinsic name label writes false when turned OFF', () => {
        const calls: LabelSpec[] = [];
        const found = toggles(tree(base(), (l) => calls.push(l)));
        expect(found).toHaveLength(1);
        found[0].props.onChange!(false);
        expect(calls).toEqual([{ ...base(), editable: false }]);
    });

    it('the switch removes the key when turned ON again; writing true instead kills this test', () => {
        const calls: LabelSpec[] = [];
        const found = toggles(tree(base({ editable: false }), (l) => calls.push(l)));
        expect(found).toHaveLength(1);
        expect(found[0].props.checked).toBe(false);
        found[0].props.onChange!(true);
        expect(calls).toHaveLength(1);
        expect('editable' in calls[0]).toBe(false);
        expect(calls[0]).toEqual(base());
    });

    it('the widget variant keeps its read-only chip and draws no switch of its own', () => {
        const label = base({ editable: { widget: 'text' } });
        expect(toggles(tree(label))).toHaveLength(0);
        expect(render(label)).toContain('editable: advanced widget');
    });
});
