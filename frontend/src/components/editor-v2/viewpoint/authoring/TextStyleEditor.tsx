import React from 'react';
import { Select, NumberInput, Checkbox, ColorPicker, ConditionalEditor, type PathBuilderFeatures } from '../../../ui';
import type { TextStyle, FontFamilyToken, FontWeightToken, Conditional } from '../ir/irTypes';

const FAMILY_OPTIONS = [
    { value: 'sans', label: 'Sans' },
    { value: 'mono', label: 'Mono' },
];
const WEIGHT_OPTIONS = [
    { value: 'normal', label: 'Normal (400)' },
    { value: 'medium', label: 'Medium (500)' },
    { value: 'semibold', label: 'Semibold (600)' },
    { value: 'bold', label: 'Bold (700)' },
];
const STYLE_OPTIONS = [
    { value: 'normal', label: 'Normal' },
    { value: 'italic', label: 'Italic' },
];

export interface TextStyleEditorProps {
    value: TextStyle | undefined;
    onChange: (next: TextStyle | undefined) => void;
    /** Feature descriptors for the target metaclass; null = PathBuilder disabled. */
    features: PathBuilderFeatures | null;
    featuresHint?: string;
    /** All project class names — for the `isKind` selector in the conditional editor. */
    classNames: string[];
}

/**
 * Immutable axis patch (ir-1.3 TS1): apply `patch` over the current TextStyle,
 * dropping any key whose patched value is undefined; collapse the whole object to
 * undefined when no axis remains, so a label with no authored style round-trips
 * byte-identical (mirrors the key-drop discipline of EdgeAuthoringPanel).
 */
function setAxis(prev: TextStyle | undefined, patch: Partial<TextStyle>): TextStyle | undefined {
    const base: TextStyle = { ...(prev ?? {}) };
    (Object.keys(patch) as (keyof TextStyle)[]).forEach((k) => {
        if (patch[k] === undefined) delete base[k];
        else (base as Record<string, unknown>)[k] = patch[k];
    });
    return Object.keys(base).length === 0 ? undefined : base;
}

interface AxisFieldProps<T> {
    label: string;
    /** Axis present in the TextStyle (checkbox on = override; off = inherit default). */
    enabled: boolean;
    onToggle: (on: boolean) => void;
    value: Conditional<T> | undefined;
    onChange: (next: Conditional<T> | undefined) => void;
    renderValue: (v: T, onCh: (v: T) => void) => React.ReactNode;
    defaultValue: T;
    features: PathBuilderFeatures | null;
    featuresHint?: string;
    classNames: string[];
}

/**
 * One typographic axis: a presence checkbox (absent = inherit the surface CSS
 * default, §4) plus, when present, the existing ConditionalEditor<T> — which
 * carries its own Fixed/Conditional toggle. Reuse, not a bespoke conditional UI.
 */
function AxisField<T>({
    label,
    enabled,
    onToggle,
    value,
    onChange,
    renderValue,
    defaultValue,
    features,
    featuresHint,
    classNames,
}: AxisFieldProps<T>): React.ReactElement {
    return (
        <div className="jj-field">
            <Checkbox checked={enabled} onChange={onToggle} label={label} />
            {enabled && (
                <ConditionalEditor<T>
                    value={value}
                    onChange={onChange}
                    renderValue={renderValue}
                    defaultValue={defaultValue}
                    features={features}
                    featuresHint={featuresHint}
                    classNames={classNames}
                />
            )}
        </div>
    );
}

/**
 * TextStyleEditor — authors a TextStyle (ir-1.3 TS1): fontFamily, fontSize,
 * fontWeight, fontStyle, color. Each axis is optional (absent = inherit) and can
 * be fixed or Conditional through the shared ConditionalEditor. Presentational:
 * flat data props, design-system tokens, no editor-v2 runtime import.
 */
export const TextStyleEditor: React.FC<TextStyleEditorProps> = ({
    value,
    onChange,
    features,
    featuresHint,
    classNames,
}) => {
    const v = value;
    return (
        <>
            <AxisField<FontFamilyToken>
                label="Font"
                enabled={v?.fontFamily !== undefined}
                onToggle={(on) => onChange(setAxis(v, { fontFamily: on ? 'sans' : undefined }))}
                value={v?.fontFamily}
                onChange={(next) => onChange(setAxis(v, { fontFamily: next }))}
                defaultValue="sans"
                renderValue={(val, onCh) => (
                    <Select options={FAMILY_OPTIONS} value={val} onChange={(e) => onCh(e.target.value as FontFamilyToken)} />
                )}
                features={features}
                featuresHint={featuresHint}
                classNames={classNames}
            />
            <AxisField<number>
                label="Dimensione (px)"
                enabled={v?.fontSize !== undefined}
                onToggle={(on) => onChange(setAxis(v, { fontSize: on ? 12 : undefined }))}
                value={v?.fontSize}
                onChange={(next) => onChange(setAxis(v, { fontSize: next }))}
                defaultValue={12}
                renderValue={(val, onCh) => <NumberInput value={val} min={8} max={32} onChange={onCh} />}
                features={features}
                featuresHint={featuresHint}
                classNames={classNames}
            />
            <AxisField<FontWeightToken>
                label="Peso"
                enabled={v?.fontWeight !== undefined}
                onToggle={(on) => onChange(setAxis(v, { fontWeight: on ? 'normal' : undefined }))}
                value={v?.fontWeight}
                onChange={(next) => onChange(setAxis(v, { fontWeight: next }))}
                defaultValue="normal"
                renderValue={(val, onCh) => (
                    <Select options={WEIGHT_OPTIONS} value={val} onChange={(e) => onCh(e.target.value as FontWeightToken)} />
                )}
                features={features}
                featuresHint={featuresHint}
                classNames={classNames}
            />
            <AxisField<'normal' | 'italic'>
                label="Stile"
                enabled={v?.fontStyle !== undefined}
                onToggle={(on) => onChange(setAxis(v, { fontStyle: on ? 'normal' : undefined }))}
                value={v?.fontStyle}
                onChange={(next) => onChange(setAxis(v, { fontStyle: next }))}
                defaultValue="normal"
                renderValue={(val, onCh) => (
                    <Select options={STYLE_OPTIONS} value={val} onChange={(e) => onCh(e.target.value as 'normal' | 'italic')} />
                )}
                features={features}
                featuresHint={featuresHint}
                classNames={classNames}
            />
            <AxisField<string>
                label="Colore"
                enabled={v?.color !== undefined}
                onToggle={(on) => onChange(setAxis(v, { color: on ? '' : undefined }))}
                value={v?.color}
                onChange={(next) => onChange(setAxis(v, { color: next }))}
                defaultValue=""
                renderValue={(val, onCh) => <ColorPicker value={val} onChange={onCh} />}
                features={features}
                featuresHint={featuresHint}
                classNames={classNames}
            />
        </>
    );
};

export default TextStyleEditor;
