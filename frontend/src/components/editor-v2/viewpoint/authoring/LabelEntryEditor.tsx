import React from 'react';
import { Select, Toggle, HelpText, ConditionalEditor, PRESERVED_CHIP, type PathBuilderFeatures } from '../../../ui';
import { TextSourceEditor } from './TextSourceEditor';
import { TextStyleField } from './TextStyleField';
import { resolveLabelAnchor } from '../ir/irCompile';
import {
    labelEditable, labelEditableDefault, labelEditBlock, labelPathFeature,
    type LabelEditBlock, type LabelFeatureInfo,
} from '../ir/irLabelEdit';
import type { LabelSpec, LabelPosition, LabelAnchor, LabelOrientation, TextSource, TextStyle } from '../ir/irTypes';

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

/**
 * The header band of a graphVertex (R-GV-5, spec addendum 2026-10-10 §2.3): offered only by a host that has one to
 * offer (`allowHeader`), today the graphVertex panel. `validateIR` refuses it where no band is declared.
 */
const HEADER_POSITION_OPTION_GROUP = { label: 'Header band', options: [{ value: 'header', label: 'In the header band' }] };

/** Text direction of a header label. Horizontal is the default and is never written. */
const ORIENTATION_OPTIONS = [
    { value: 'horizontal', label: 'Horizontal' },
    { value: 'vertical', label: 'Vertical (bottom to top)' },
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
    const { anchor: _anchor, orientation, ...rest } = label;
    // `orientation` belongs to the header position alone (R-GV-5): it stays on a header label and leaves with it.
    if (value === 'header') return orientation === undefined ? { ...rest, position: 'header' } : { ...rest, position: 'header', orientation };
    if (!value.startsWith(OUTSIDE_VALUE_PREFIX)) return { ...rest, position: value as LabelPosition };
    const anchor: LabelAnchor = resolveLabelAnchor(value.slice(OUTSIDE_VALUE_PREFIX.length));
    return anchor === 's' ? { ...rest, position: 'outside' } : { ...rest, position: 'outside', anchor };
}

/**
 * The label after a choice of text direction (R-GV-5). Horizontal is the default: the key is removed, so a header
 * label set back to horizontal round-trips byte-identical to one that never carried it.
 */
export function applyLabelOrientation(label: LabelSpec, value: string): LabelSpec {
    const { orientation: _orientation, ...rest } = label;
    return value === 'vertical' ? { ...rest, orientation: value as LabelOrientation } : rest;
}

/**
 * The label after a click on the Editable toggle. The choice that equals the source's default
 * removes the key, the other one is written, so the IR stays minimal: on a name label OFF writes
 * `editable: false` and ON removes the key (absent renames, R-IRN-38); on a path label ON writes
 * `editable: true` and OFF removes the key (absent does not edit, R-IRN-41). Every other key keeps
 * its place.
 */
export function applyLabelEditable(label: LabelSpec, checked: boolean): LabelSpec {
    if (checked !== labelEditableDefault(label.source)) return { ...label, editable: checked };
    const { editable: _editable, ...rest } = label;
    return rest;
}

/** The hint under a disabled Editable toggle, one per reason (R-IRN-38, R-IRN-41). */
const EDIT_BLOCK_HINTS: Record<LabelEditBlock, string> = {
    'name-only': 'Only a name label can be renamed on the canvas.',
    'single-attribute': 'Only a single attribute of this object can be edited on the canvas.',
    'string-only': 'Only a string attribute can be edited on the canvas.',
};

/** The metaclass's feature of a one-step path label, as the edit check reads it; null when there is
 *  no metaclass, no one-step path or no feature of that name. */
function labelFeatureInfo(source: TextSource, features: PathBuilderFeatures | null): LabelFeatureInfo | null {
    const name = labelPathFeature(source);
    if (!features || name === null) return null;
    const attribute = features.attributes.find((a) => a.name === name);
    if (attribute) return { kind: 'attribute', type: attribute.type, upperBound: attribute.upperBound };
    const reference = features.references.find((r) => r.name === name);
    if (reference) return { kind: 'reference', type: reference.targetClassName, upperBound: reference.upperBound };
    return null;
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
    /** Offer the header band position and its text direction (R-GV-5). Omitted = not offered, as before. */
    allowHeader?: boolean;
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
    allowHeader,
    onChange,
}) => {
    const editable = label.editable;
    const editableIsWidget = editable !== null && typeof editable === 'object';
    const featureInfo = labelFeatureInfo(label.source, features);
    const editBlock = labelEditBlock(label.source, featureInfo);

    return (
        <>
            <div className="jj-field">
                <label className="jj-field-label">Position</label>
                <Select
                    options={allowHeader ? [...POSITION_OPTION_GROUPS, HEADER_POSITION_OPTION_GROUP] : POSITION_OPTION_GROUPS}
                    value={labelPositionValue(label)}
                    onChange={(e) => onChange(applyLabelPositionValue(label, e.target.value))}
                />
            </div>

            {allowHeader && label.position === 'header' && (
                <div className="jj-field">
                    <label className="jj-field-label">Text direction</label>
                    <Select
                        options={ORIENTATION_OPTIONS}
                        value={label.orientation ?? 'horizontal'}
                        onChange={(e) => onChange(applyLabelOrientation(label, e.target.value))}
                    />
                </div>
            )}

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
                        checked={labelEditable(label, featureInfo)}
                        disabled={editBlock !== null}
                        onChange={(c) => onChange(applyLabelEditable(label, c))}
                        size="xs"
                    />}
                {!editableIsWidget && editBlock !== null && (
                    <HelpText icon={false}>{EDIT_BLOCK_HINTS[editBlock]}</HelpText>
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
