import React from 'react';
import { Select, Toggle, HelpText, ConditionalEditor, PRESERVED_CHIP, type PathBuilderFeatures } from '../../../ui';
import { TextSourceEditor } from './TextSourceEditor';
import { TextStyleField } from './TextStyleField';
import { resolveLabelAnchor } from '../ir/irCompile';
import { labelCanRename, labelEditsName } from '../ir/irLabelEdit';
import type { LabelSpec, LabelPosition, LabelAnchor, TextSource, TextStyle } from '../ir/irTypes';

const POSITION_OPTIONS = [
    { value: 'top', label: 'Top' },
    { value: 'center', label: 'Center' },
    { value: 'inside', label: 'Inside' },
    { value: 'bottom', label: 'Bottom' },
];

/**
 * The outside positions (R-VP-15 (1), P-2026-09-29-1245): one option per side, each standing
 * for `position: 'outside'` plus an anchor. The select value `outside:<anchor>` exists in this
 * control only; the IR carries the two fields (labelPositionValue / applyLabelPositionValue).
 */
const OUTSIDE_POSITION_OPTIONS = [
    { value: 'outside:n', label: 'Above' },
    { value: 'outside:s', label: 'Below' },
    { value: 'outside:w', label: 'Left' },
    { value: 'outside:e', label: 'Right' },
];

const POSITION_OPTION_GROUPS = [
    { label: 'Inside', options: POSITION_OPTIONS },
    { label: 'Outside', options: OUTSIDE_POSITION_OPTIONS },
];

const OUTSIDE_VALUE_PREFIX = 'outside:';

/** The select value of a label: its position, or `outside:<anchor>` with the anchor resolved
 *  as the canvas resolves it (absent or unknown reads 's'). */
export function labelPositionValue(label: LabelSpec): string {
    return label.position === 'outside' ? `${OUTSIDE_VALUE_PREFIX}${resolveLabelAnchor(label.anchor)}` : label.position;
}

/**
 * The label after a choice in the select. An inside choice drops `anchor`; an outside one writes
 * it only when it is not the 's' default, the padding/marker idiom: a default is never persisted,
 * so «Below» saves as `position: 'outside'` alone. Every other key keeps its place.
 */
export function applyLabelPositionValue(label: LabelSpec, value: string): LabelSpec {
    const { anchor: _anchor, ...rest } = label;
    if (!value.startsWith(OUTSIDE_VALUE_PREFIX)) return { ...rest, position: value as LabelPosition };
    const anchor: LabelAnchor = resolveLabelAnchor(value.slice(OUTSIDE_VALUE_PREFIX.length));
    return anchor === 's' ? { ...rest, position: 'outside' } : { ...rest, position: 'outside', anchor };
}

/**
 * The label after a click on the Editable toggle. OFF writes `editable: false`; ON removes the key:
 * absent is the default (an intrinsic name label renames), so the IR stays minimal and a persisted
 * `true` is dropped too. Every other key keeps its place.
 */
export function applyLabelEditable(label: LabelSpec, checked: boolean): LabelSpec {
    if (!checked) return { ...label, editable: false };
    const { editable: _editable, ...rest } = label;
    return rest;
}

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
                    options={POSITION_OPTION_GROUPS}
                    value={labelPositionValue(label)}
                    onChange={(e) => onChange(applyLabelPositionValue(label, e.target.value))}
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
                    ? <span style={PRESERVED_CHIP}>editable: advanced widget</span>
                    : <Toggle
                        checked={labelEditsName(label)}
                        disabled={!labelCanRename(label.source)}
                        onChange={(c) => onChange(applyLabelEditable(label, c))}
                        size="xs"
                    />}
                {!editableIsWidget && !labelCanRename(label.source) && (
                    <HelpText icon={false}>Only a name label can be renamed on the canvas.</HelpText>
                )}
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
