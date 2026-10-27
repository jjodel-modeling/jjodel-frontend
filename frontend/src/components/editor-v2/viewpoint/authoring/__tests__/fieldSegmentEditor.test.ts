/**
 * FieldSegmentEditor — the «editable inline» toggle of a value segment (P-2026-10-02-1646).
 *
 * The toggle shows what the canvas does: the runtime reads `row.editableValue && seg.editable !==
 * false` (`IRNodeContent.tsx:706`), so an absent key edits and must read ON. Executed, not read: the
 * component loads in the node bench (React and the `ui` barrel are pure at import), so it is rendered
 * to markup for the switch state, and called as a function (it has no hooks) to reach the Toggle
 * element and fire its onChange, so the wiring from the switch to the segment is run.
 */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FieldSegmentEditor, applyValueEditable } from '../FieldSegmentEditor';
import type { FieldSegmentEditorProps } from '../FieldSegmentEditor';
import { Toggle, Select } from '../../../../ui';
import type { FieldSegment } from '../../ir/irTypes';

type ValueSegment = Extract<FieldSegment, { kind: 'value' }>;

const value = (over: Partial<ValueSegment> = {}): ValueSegment => ({ kind: 'value', ...over });

const props = (segment: FieldSegment, onChange: (s: FieldSegment) => void = () => undefined): FieldSegmentEditorProps =>
    ({ segment, onChange });
const render = (segment: FieldSegment) => renderToStaticMarkup(React.createElement(FieldSegmentEditor, props(segment)));
const tree = (segment: FieldSegment, onChange?: (s: FieldSegment) => void) =>
    (FieldSegmentEditor as unknown as (p: FieldSegmentEditorProps) => React.ReactNode)(props(segment, onChange));

/** Every element of `type` in the tree the component returns, in document order. */
const find = <P,>(node: React.ReactNode, type: unknown, out: React.ReactElement<P>[] = []) => {
    if (Array.isArray(node)) node.forEach(n => find(n, type, out));
    else if (React.isValidElement(node)) {
        if (node.type === type) out.push(node as React.ReactElement<P>);
        find((node.props as { children?: React.ReactNode }).children, type, out);
    }
    return out;
};
type TogglePr = { checked?: boolean; disabled?: boolean; onChange?: (c: boolean) => void };
const toggles = (segment: FieldSegment, onChange?: (s: FieldSegment) => void) =>
    find<TogglePr>(tree(segment, onChange), Toggle);

/** The one switch of a value segment's markup. */
const theSwitch = (html: string): string => html.match(/<button[^>]*role="switch"[^>]*>/)![0];

describe('applyValueEditable: the segment after a click on the toggle', () => {
    it('OFF writes editable false; writing true instead kills this test', () => {
        expect(applyValueEditable(value(), false)).toEqual({ kind: 'value', editable: false });
    });

    it('ON removes the key, the IR stays minimal; writing true instead kills this test', () => {
        const next = applyValueEditable(value({ editable: false }), true);
        expect(next).toEqual({ kind: 'value' });
        expect('editable' in next).toBe(false);
    });

    it('ON on a persisted true removes it too, and the kind keeps its place', () => {
        const next = applyValueEditable(value({ editable: true }), true);
        expect('editable' in next).toBe(false);
        expect(Object.keys(applyValueEditable(value({ editable: true }), false))).toEqual(['kind', 'editable']);
    });
});

describe('FieldSegmentEditor: the editable inline toggle of a value segment', () => {
    it('reads ON at rest for an absent key; testing === true kills this test', () => {
        expect(theSwitch(render(value()))).toContain('aria-checked="true"');
    });

    it('reads ON for a persisted true and OFF for false', () => {
        expect(theSwitch(render(value({ editable: true })))).toContain('aria-checked="true"');
        expect(theSwitch(render(value({ editable: false })))).toContain('aria-checked="false"');
    });

    it('carries its label and is never disabled: the panel does not know the row', () => {
        const html = render(value());
        expect(html).toContain('editable inline');
        expect(theSwitch(html)).not.toContain('disabled');
        expect(theSwitch(render(value({ editable: false })))).not.toContain('disabled');
    });

    it('writes nothing on render', () => {
        const calls: FieldSegment[] = [];
        const segment = value();
        renderToStaticMarkup(React.createElement(FieldSegmentEditor, props(segment, (s) => calls.push(s))));
        expect(calls).toEqual([]);
        expect(segment).toEqual({ kind: 'value' });
    });

    it('the switch writes false when turned OFF', () => {
        const calls: FieldSegment[] = [];
        const found = toggles(value(), (s) => calls.push(s));
        expect(found).toHaveLength(1);
        found[0].props.onChange!(false);
        expect(calls).toEqual([{ kind: 'value', editable: false }]);
    });

    it('the switch removes the key when turned ON again; writing true instead kills this test', () => {
        const calls: FieldSegment[] = [];
        const found = toggles(value({ editable: false }), (s) => calls.push(s));
        expect(found).toHaveLength(1);
        expect(found[0].props.checked).toBe(false);
        found[0].props.onChange!(true);
        expect(calls).toHaveLength(1);
        expect('editable' in calls[0]).toBe(false);
        expect(calls[0]).toEqual({ kind: 'value' });
    });

    it('the widget variant keeps its read-only chip and draws no switch of its own', () => {
        const segment = value({ editable: { widget: 'text' } });
        expect(toggles(segment)).toHaveLength(0);
        expect(render(segment)).toContain('editable: advanced widget');
    });

    it('a name, type or literal segment draws no switch', () => {
        for (const segment of [{ kind: 'name' }, { kind: 'type' }, { kind: 'literal', text: '=' }] as FieldSegment[]) {
            expect(toggles(segment), segment.kind).toHaveLength(0);
            expect(render(segment), segment.kind).not.toContain('role="switch"');
        }
    });

    it('a kind switch to Value seeds a clean segment: no editable key', () => {
        const calls: FieldSegment[] = [];
        const selects = find<{ onChange?: (e: { target: { value: string } }) => void }>(
            tree({ kind: 'name' }, (s) => calls.push(s)), Select);
        expect(selects).toHaveLength(1);
        selects[0].props.onChange!({ target: { value: 'value' } });
        expect(calls).toEqual([{ kind: 'value' }]);
        expect('editable' in calls[0]).toBe(false);
    });
});
