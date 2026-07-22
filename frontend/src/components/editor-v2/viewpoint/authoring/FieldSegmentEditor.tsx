import React from 'react';
import { Select, Input, Checkbox } from '../../../ui';
import type { FieldSegment } from '../ir/irTypes';

const KIND_OPTIONS = [
    { value: 'name', label: 'Name' },
    { value: 'type', label: 'Type' },
    { value: 'value', label: 'Value' },
    { value: 'literal', label: 'Literal' },
];

/** Read-only chip for values not editable in Basic (preserved verbatim). */
const CHIP: React.CSSProperties = {
    display: 'inline-block',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-tertiary)',
    fontStyle: 'italic',
    padding: '2px 6px',
    border: '1px dashed var(--color-border-primary)',
    borderRadius: 'var(--radius-sm)',
};

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

export interface FieldSegmentEditorProps {
    segment: FieldSegment;
    onChange: (segment: FieldSegment) => void;
}

/**
 * Editor for a single FieldSegment (a cell of a compartment row): kind +
 * kind-specific field. `literal` gets a text Input; `value` exposes the boolean
 * `editable` flag (the widget-object variant is read-only and round-trips
 * verbatim — phase B2b); `name`/`type` have no sub-fields.
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
                <Input
                    value={segment.text}
                    onChange={(e) => onChange({ kind: 'literal', text: e.target.value })}
                />
            )}

            {segment.kind === 'value' && (
                editableIsWidget
                    ? <span style={CHIP}>editable: advanced widget</span>
                    : <Checkbox
                        checked={valueEditable === true}
                        onChange={(c) => onChange({ kind: 'value', editable: c })}
                        label="editable inline"
                    />
            )}
        </div>
    );
};

export default FieldSegmentEditor;
