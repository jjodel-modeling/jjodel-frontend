import React from 'react';
import { Select, Toggle, ConditionalEditor, type PathBuilderFeatures } from '../../../ui';
import { TextSourceEditor } from './TextSourceEditor';
import { TextStyleField } from './TextStyleField';
import type { LabelSpec, LabelPosition, TextSource, TextStyle } from '../ir/irTypes';

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

export interface LabelEntryEditorProps {
    label: LabelSpec;
    /** Feature descriptors for the target metaclass; null = PathBuilder disabled. */
    features: PathBuilderFeatures | null;
    featuresHint?: string;
    /** All project class names — for the `isKind` selector in the conditional editor. */
    classNames: string[];
    /** Forwarded to the `visible` ConditionalEditor; omitted = conditional allowed. */
    allowConditional?: boolean;
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
    classNames,
    allowConditional,
    onChange,
}) => {
    const editable = label.editable;
    const editableIsWidget = editable !== null && typeof editable === 'object';

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
                    : <Toggle
                        checked={editable === true}
                        onChange={(c) => onChange({ ...label, editable: c })}
                        size="xs"
                    />}
            </div>

            {/* `props-label-entry-split`: dashed hairline that separates the field
                block above from the visibility block (styled card-scoped in
                properties-with-tree-view.scss). */}
            <div className="jj-field props-label-entry-split">
                <label className="jj-field-label">Visible</label>
                <ConditionalEditor
                    value={label.visible}
                    onChange={(next) => onChange({ ...label, visible: next })}
                    renderValue={(v, onCh) => <Toggle checked={v} onChange={onCh} size="xs" />}
                    defaultValue={true}
                    features={features}
                    featuresHint={featuresHint}
                    classNames={classNames}
                    allowConditional={allowConditional}
                />
            </div>

            <TextStyleField
                value={label.style}
                onChange={(style: TextStyle | undefined) => onChange({ ...label, style })}
                features={features}
                featuresHint={featuresHint}
                classNames={classNames}
            />
        </>
    );
};

export default LabelEntryEditor;
