import React from 'react';
import { Select, Input, ColorPicker, ConditionalEditor, isConditionalValue, type PathBuilderFeatures } from '../../../ui';
import type { TextStyle, FontFamilyToken, FontWeightToken, Conditional } from '../ir/irTypes';

const FAMILY_OPTIONS = [
    { value: 'sans', label: 'Sans' },
    { value: 'mono', label: 'Mono' },
];
const WEIGHT_OPTIONS = [
    { value: 'normal', label: 'Normal' },
    { value: 'medium', label: 'Medium' },
    { value: 'semibold', label: 'Semibold' },
    { value: 'bold', label: 'Bold' },
];
const STYLE_OPTIONS = [
    { value: 'normal', label: 'Normal' },
    { value: 'italic', label: 'Italic' },
];

const COLOR_SEED = '#334155';

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
 * byte-identical. UNCHANGED from TS1 — the "Default" state of a control unsets the
 * axis through exactly this key-drop (no new write path).
 */
function setAxis(prev: TextStyle | undefined, patch: Partial<TextStyle>): TextStyle | undefined {
    const base: TextStyle = { ...(prev ?? {}) };
    (Object.keys(patch) as (keyof TextStyle)[]).forEach((k) => {
        if (patch[k] === undefined) delete base[k];
        else (base as Record<string, unknown>)[k] = patch[k];
    });
    return Object.keys(base).length === 0 ? undefined : base;
}

interface AxisRowProps<T> {
    label: string;
    value: Conditional<T> | undefined;
    /** Already bound to setAxis(+key) in the parent. */
    onChange: (next: Conditional<T> | undefined) => void;
    /** Non-conditional control incl. the "Default"/unset affordance (bare = current bare value or undefined). */
    renderSimple: (bare: T | undefined, setBare: (v: T | undefined) => void) => React.ReactNode;
    /** Control for a conditional branch value (always a real T, no "Default"). */
    renderBranch: (v: T, onCh: (v: T) => void) => React.ReactNode;
    /** Seed value when flipping to conditional and ConditionalEditor's branch default. */
    axisDefault: T;
    features: PathBuilderFeatures | null;
    featuresHint?: string;
    classNames: string[];
}

/**
 * One typographic axis as a compact row: [label] [control] [ƒx]. The ƒx state is
 * DERIVED from the value (Conditional -> active, showing the ConditionalEditor below;
 * bare/undefined -> inactive, showing the simple control whose "Default" option unsets
 * the axis). ConditionalEditor is reused verbatim (its own Fixed/Conditional switch
 * stays — it only appears once ƒx is already active).
 */
function AxisRow<T>({
    label,
    value,
    onChange,
    renderSimple,
    renderBranch,
    axisDefault,
    features,
    featuresHint,
    classNames,
}: AxisRowProps<T>): React.ReactElement {
    const isCond = isConditionalValue(value);
    const bare = isCond ? undefined : (value as T | undefined);

    const flip = () => {
        if (isCond) {
            // Collapse to the then-branch value (stays authored, not undefined).
            onChange((value as { then: T }).then);
        } else {
            const base = (value as T | undefined) ?? axisDefault;
            onChange({ when: { op: 'literal', value: true }, then: base });
        }
    };

    return (
        <div className={`jj-textstyle-row${isCond ? ' jj-textstyle-row--cond' : ''}`}>
            <div className="jj-textstyle-row__main">
                <span className="jj-textstyle-row__label">{label}</span>
                <div className="jj-textstyle-row__control">
                    {isCond
                        ? <span className="jj-textstyle-row__condlabel">Conditional</span>
                        : renderSimple(bare, (v) => onChange(v))}
                </div>
                <button
                    type="button"
                    className={`jj-textstyle-row__fx${isCond ? ' is-active' : ''}`}
                    onClick={flip}
                    title={isCond ? 'Back to fixed value' : 'Make conditional (ƒx)'}
                    aria-pressed={isCond}
                >
                    <i className="bi bi-lightning-charge" aria-hidden="true" />
                </button>
            </div>
            {isCond && (
                <div className="jj-textstyle-row__cond">
                    <ConditionalEditor<T>
                        value={value}
                        onChange={onChange}
                        renderValue={renderBranch}
                        defaultValue={axisDefault}
                        features={features}
                        featuresHint={featuresHint}
                        classNames={classNames}
                    />
                </div>
            )}
        </div>
    );
}

/**
 * TextStyleEditor — per-axis authoring body of the Tipografia popover (ir-1.3 TS1,
 * Fase 2b redesign). Five always-visible rows (Font, Dimensione, Peso, Stile, Colore);
 * the unset state lives inside each control as "Default" (key-drop via setAxis); a
 * per-row ƒx toggle enters conditional mode (reusing ConditionalEditor). Presentational:
 * flat data props, design-system tokens, no editor-v2 runtime import.
 */
export const TextStyleEditor: React.FC<TextStyleEditorProps> = ({
    value,
    onChange,
    features,
    featuresHint,
    classNames,
}) => {
    const patch = (partial: Partial<TextStyle>) => onChange(setAxis(value, partial));

    return (
        <div className="jj-textstyle-rows">
            <AxisRow<FontFamilyToken>
                label="Font"
                value={value?.fontFamily}
                onChange={(next) => patch({ fontFamily: next })}
                axisDefault="sans"
                renderSimple={(bare, setBare) => (
                    <Select
                        placeholder="Default"
                        options={FAMILY_OPTIONS}
                        value={bare ?? ''}
                        onChange={(e) => setBare(e.target.value === '' ? undefined : (e.target.value as FontFamilyToken))}
                    />
                )}
                renderBranch={(val, onCh) => (
                    <Select placeholder="Sans" options={FAMILY_OPTIONS} value={val} onChange={(e) => onCh(e.target.value as FontFamilyToken)} />
                )}
                features={features}
                featuresHint={featuresHint}
                classNames={classNames}
            />
            <AxisRow<number>
                label="Size"
                value={value?.fontSize}
                onChange={(next) => patch({ fontSize: next })}
                axisDefault={12}
                renderSimple={(bare, setBare) => (
                    <div className="jj-textstyle-size">
                        <Input
                            type="number"
                            min={8}
                            max={32}
                            placeholder="Default"
                            value={bare ?? ''}
                            onChange={(e) => { const t = e.target.value; setBare(t === '' ? undefined : Number(t)); }}
                        />
                        <span className="jj-textstyle-size__suffix">px</span>
                    </div>
                )}
                renderBranch={(val, onCh) => (
                    <div className="jj-textstyle-size">
                        <Input
                            type="number"
                            min={8}
                            max={32}
                            value={val}
                            onChange={(e) => { const t = e.target.value; if (t !== '') onCh(Number(t)); }}
                        />
                        <span className="jj-textstyle-size__suffix">px</span>
                    </div>
                )}
                features={features}
                featuresHint={featuresHint}
                classNames={classNames}
            />
            <AxisRow<FontWeightToken>
                label="Weight"
                value={value?.fontWeight}
                onChange={(next) => patch({ fontWeight: next })}
                axisDefault="normal"
                renderSimple={(bare, setBare) => (
                    <Select
                        placeholder="Default"
                        options={WEIGHT_OPTIONS}
                        value={bare ?? ''}
                        onChange={(e) => setBare(e.target.value === '' ? undefined : (e.target.value as FontWeightToken))}
                    />
                )}
                renderBranch={(val, onCh) => (
                    <Select placeholder="Normal" options={WEIGHT_OPTIONS} value={val} onChange={(e) => onCh(e.target.value as FontWeightToken)} />
                )}
                features={features}
                featuresHint={featuresHint}
                classNames={classNames}
            />
            <AxisRow<'normal' | 'italic'>
                label="Style"
                value={value?.fontStyle}
                onChange={(next) => patch({ fontStyle: next })}
                axisDefault="normal"
                renderSimple={(bare, setBare) => (
                    <Select
                        placeholder="Default"
                        options={STYLE_OPTIONS}
                        value={bare ?? ''}
                        onChange={(e) => setBare(e.target.value === '' ? undefined : (e.target.value as 'normal' | 'italic'))}
                    />
                )}
                renderBranch={(val, onCh) => (
                    <Select placeholder="Normal" options={STYLE_OPTIONS} value={val} onChange={(e) => onCh(e.target.value as 'normal' | 'italic')} />
                )}
                features={features}
                featuresHint={featuresHint}
                classNames={classNames}
            />
            <AxisRow<string>
                label="Color"
                value={value?.color}
                onChange={(next) => patch({ color: next })}
                axisDefault={COLOR_SEED}
                renderSimple={(bare, setBare) => (
                    bare === undefined
                        ? (
                            <button type="button" className="jj-textstyle-defaultbtn" onClick={() => setBare(COLOR_SEED)}>
                                Default
                            </button>
                        )
                        : (
                            <div className="jj-textstyle-color">
                                <ColorPicker value={bare} onChange={(hex) => setBare(hex)} />
                                <button type="button" className="jj-textstyle-clear" title="Remove (Default)" onClick={() => setBare(undefined)}>
                                    <i className="bi bi-x-lg" aria-hidden="true" />
                                </button>
                            </div>
                        )
                )}
                renderBranch={(val, onCh) => <ColorPicker value={val} onChange={onCh} />}
                features={features}
                featuresHint={featuresHint}
                classNames={classNames}
            />
        </div>
    );
};

export default TextStyleEditor;
