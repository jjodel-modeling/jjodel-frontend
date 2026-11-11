import React from 'react';
import { Select, Input, Toggle, PRESERVED_CHIP } from '../../../ui';
import { TextStyleField } from './TextStyleField';
import type { FieldSegment, TextStyle } from '../ir/irTypes';

const KIND_OPTIONS = [
    { value: 'name', label: 'Name' },
    { value: 'type', label: 'Type' },
    { value: 'value', label: 'Value' },
    { value: 'literal', label: 'Literal' },
];

/** Clean segment of the chosen kind (kind switch resets kind-specific fields). */
function forKind(kind: FieldSegment['kind']): FieldSegment {
    switch (kind) {
        case 'type': return { kind: 'type' };
        case 'value': return { kind: 'value' };
        case 'literal': return { kind: 'literal', text: '' };
        case 'name':
        default: return { kind: 'name' };
    }
}

/**
 * The value segment after a click on the «editable inline» toggle. OFF writes `editable: false`; ON
 * removes the key: absent is the default (the runtime edits unless `editable === false`), so the IR
 * stays minimal and a persisted `true` is dropped too. Every other key keeps its place.
 */
export function applyValueEditable(
    segment: Extract<FieldSegment, { kind: 'value' }>,
    checked: boolean,
): Extract<FieldSegment, { kind: 'value' }> {
    if (!checked) return { ...segment, editable: false };
    const { editable: _editable, ...rest } = segment;
    return rest;
}

/**
 * The literal segment after a text edit: only `text` changes. A persisted `style` (R-VP-20) and any
 * other key keep their place; rebuilding the segment from scratch dropped them on the first keystroke.
 */
export function applyLiteralText(
    segment: Extract<FieldSegment, { kind: 'literal' }>,
    text: string,
): Extract<FieldSegment, { kind: 'literal' }> {
    return { ...segment, text };
}

/**
 * The literal segment after a style edit (R-VP-20): only `style` changes. `undefined` (the popover's
 * reset, or every axis cleared) drops the KEY, so the literal falls back to the row's style and
 * round-trips byte-identical to one authored without a style.
 */
export function applyLiteralStyle(
    segment: Extract<FieldSegment, { kind: 'literal' }>,
    style: TextStyle | undefined,
): Extract<FieldSegment, { kind: 'literal' }> {
    if (style === undefined) {
        const { style: _dropped, ...rest } = segment;
        return rest;
    }
    return { ...segment, style };
}

export interface FieldSegmentEditorProps {
    segment: FieldSegment;
    onChange: (segment: FieldSegment) => void;
}

/**
 * Editor for a single FieldSegment (a cell of a compartment row): kind +
 * kind-specific field. `literal` gets a text Input and its own TextStyle; `value` exposes the boolean
 * `editable` flag, read as the runtime reads it (`!== false`: absent edits, so absent
 * reads ON; the widget-object variant is read-only and round-trips verbatim — phase
 * B2b); `name`/`type` have no sub-fields.
 */
export const FieldSegmentEditor: React.FC<FieldSegmentEditorProps> = ({ segment, onChange }) => {
    const valueEditable = segment.kind === 'value' ? segment.editable : undefined;
    const editableIsWidget = valueEditable !== null && typeof valueEditable === 'object';

    return (
        <div className="jj-field">
            <Select
                options={KIND_OPTIONS}
                value={segment.kind}
                onChange={(e) => onChange(forKind(e.target.value as FieldSegment['kind']))}
            />

            {segment.kind === 'literal' && (
                <>
                    <Input
                        value={segment.text}
                        onChange={(e) => onChange(applyLiteralText(segment, e.target.value))}
                    />
                    {/* The literal's own style, over the row's (R-VP-20). The other kinds
                        carry no style of their own: they take the row's. */}
                    <TextStyleField
                        value={segment.style}
                        onChange={(style) => onChange(applyLiteralStyle(segment, style))}
                    />
                </>
            )}

            {segment.kind === 'value' && (
                editableIsWidget
                    ? <span style={PRESERVED_CHIP}>editable: advanced widget</span>
                    : <Toggle
                        checked={valueEditable !== false}
                        onChange={(c) => onChange(applyValueEditable(segment, c))}
                        label="editable inline"
                        size="xs"
                    />
            )}
        </div>
    );
};

export default FieldSegmentEditor;
