import React from 'react';
import { Select, Checkbox, type PathBuilderFeatures } from '../../../ui';
import { TextSourceEditor } from './TextSourceEditor';
import type { LabelSpec, LabelPosition, TextSource } from '../ir/irTypes';

const POSITION_OPTIONS = [
    { value: 'top', label: 'Top' },
    { value: 'center', label: 'Center' },
    { value: 'inside', label: 'Inside' },
    { value: 'bottom', label: 'Bottom' },
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

/** A value is a Conditional<T> when it is an object carrying when/rules. */
function isConditional(x: unknown): boolean {
    return x !== null && typeof x === 'object' && ('when' in (x as any) || 'rules' in (x as any));
}

/** Describe a Conditional<boolean> visibility as a read-only chip label, or null when absent. */
function describeVisible(visible: LabelSpec['visible']): string | null {
    if (visible === undefined) return null;
    if (isConditional(visible)) return 'conditional (Advanced, phase B2b)';
    return visible ? 'always visible' : 'never visible';
}

export interface LabelEntryEditorProps {
    label: LabelSpec;
    /** Feature descriptors for the target metaclass; null = PathBuilder disabled. */
    features: PathBuilderFeatures | null;
    featuresHint?: string;
    onChange: (label: LabelSpec) => void;
}

/**
 * Editor for a single LabelSpec (position + source + editable/visible).
 *
 * Extracted from the inline primary-label block of Fase B so the label list can
 * reuse it for every entry. `visible` (Conditional<boolean>) and the `editable`
 * widget-object variant are read-only here and round-trip verbatim — authoring
 * them is phase B2b (Advanced). Only the boolean `editable` flag is editable.
 */
export const LabelEntryEditor: React.FC<LabelEntryEditorProps> = ({
    label,
    features,
    featuresHint,
    onChange,
}) => {
    const editable = label.editable;
    const editableIsWidget = editable !== null && typeof editable === 'object';
    const visibleChip = describeVisible(label.visible);

    return (
        <>
            <div className="jj-field">
                <label className="jj-field-label">Position</label>
                <Select
                    options={POSITION_OPTIONS}
                    value={label.position}
                    onChange={(e) => onChange({ ...label, position: e.target.value as LabelPosition })}
                />
            </div>

            <div className="jj-field">
                <label className="jj-field-label">Source</label>
                <TextSourceEditor
                    source={label.source}
                    features={features}
                    disabledHint={featuresHint}
                    onChange={(src: TextSource) => onChange({ ...label, source: src })}
                />
            </div>

            <div className="jj-field">
                <label className="jj-field-label">Editable</label>
                {editableIsWidget
                    ? <span style={CHIP}>editable: advanced widget</span>
                    : <Checkbox
                        checked={editable === true}
                        onChange={(c) => onChange({ ...label, editable: c })}
                        label="editable inline"
                    />}
            </div>

            {visibleChip && (
                <div className="jj-field">
                    <label className="jj-field-label">Visible</label>
                    <span style={CHIP}>{visibleChip}</span>
                </div>
            )}
        </>
    );
};

export default LabelEntryEditor;
