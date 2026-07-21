import React from 'react';
import { Select } from '../Select';
import { NumberInput } from '../NumberInput';
import { pathExprFromSelection, type PathSelection } from './pathExpr';
import styles from './PathBuilder.module.css';

/**
 * Flat feature descriptors for one metaclass. The panel (Fase B) maps
 * MetaclassInfo -> these props; PathBuilder stays decoupled from editor-v2 /
 * redux so it lives in the design-system layer.
 */
export interface PathBuilderFeatures {
    attributes: { name: string; type: string; upperBound: number }[];
    references: { name: string; targetClassName: string; upperBound: number }[];
}

export interface PathBuilderProps {
    /** Feature descriptors for the target metaclass; null = no metaclass (wildcard) -> disabled. */
    features: PathBuilderFeatures | null;
    /** Current PathExpr (read/display). */
    value: string;
    onChange: (expr: string) => void;
    disabled?: boolean;
    disabledHint?: string;
}

type Take = PathSelection['take'];

/** Best-effort parse of a single-hop PathExpr into its selection parts. */
function parseExpr(expr: string): { feature: string; take: Take; index: number } {
    const m = /^\$([A-Za-z_][A-Za-z0-9_]*)(?:\.(value|values(?:\[(\d+)\])?))?$/.exec(expr ?? '');
    if (!m) return { feature: '', take: 'value', index: 0 };
    const feature = m[1];
    const suffix = m[2];
    if (!suffix || suffix === 'value') return { feature, take: 'value', index: 0 };
    if (suffix === 'values') return { feature, take: 'values', index: 0 };
    return { feature, take: 'valuesAt', index: m[3] ? parseInt(m[3], 10) : 0 };
}

/**
 * PathBuilder — grammar-constrained single-hop PathExpr authoring control.
 * Emits only strings the IR compiler accepts; there is no free-text entry.
 */
export const PathBuilder: React.FC<PathBuilderProps> = ({
    features,
    value,
    onChange,
    disabled = false,
    disabledHint,
}) => {
    // Wildcard / no metaclass: cannot offer feature paths.
    if (!features) {
        return (
            <div className={styles.wrapper}>
                <div className={styles.hint}>
                    {disabledHint || 'Set a metaclass to enable feature paths.'}
                </div>
            </div>
        );
    }

    const { feature, take, index } = parseExpr(value);

    // Combined options + per-feature metadata (upperBound decides multi-valued takes).
    const featureMeta: Record<string, { upperBound: number; isRef: boolean; targetClassName?: string }> = {};
    const options: { value: string; label: string }[] = [];
    for (const a of features.attributes) {
        if (!(a.name in featureMeta)) featureMeta[a.name] = { upperBound: a.upperBound, isRef: false };
        options.push({ value: a.name, label: `${a.name} : ${a.type}` });
    }
    for (const r of features.references) {
        // TODO multi-hop seam (slice successiva): when a reference is selected, offer
        // navigation into r.targetClassName's features to author `$ref.value.$attr.value`.
        if (!(r.name in featureMeta)) {
            featureMeta[r.name] = { upperBound: r.upperBound, isRef: true, targetClassName: r.targetClassName };
        }
        options.push({ value: r.name, label: `${r.name} → ${r.targetClassName}` });
    }

    const selectedMeta = feature ? featureMeta[feature] : undefined;
    const multi = selectedMeta ? selectedMeta.upperBound !== 1 : false;

    const takeOptions = [
        { value: 'value', label: 'value (single)' },
        ...(multi
            ? [
                  { value: 'values', label: 'values (all)' },
                  { value: 'valuesAt', label: 'values[N] (at index)' },
              ]
            : []),
    ];

    const onFeatureChange = (next: string) => {
        if (!next) { onChange(''); return; }
        // Reset take to the always-valid single-value read when the feature changes.
        onChange(pathExprFromSelection({ feature: next, take: 'value' }));
    };
    const onTakeChange = (next: string) => {
        if (!feature) return;
        onChange(pathExprFromSelection({ feature, take: next as Take, index }));
    };
    const onIndexChange = (n: number) => {
        if (!feature) return;
        onChange(pathExprFromSelection({ feature, take: 'valuesAt', index: Math.max(0, n) }));
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.row}>
                <Select
                    className={styles.control}
                    options={options}
                    value={feature}
                    placeholder="Select feature..."
                    disabled={disabled}
                    onChange={(e) => onFeatureChange(e.target.value)}
                />
                <Select
                    className={styles.control}
                    options={takeOptions}
                    value={take}
                    placeholder="value (single)"
                    disabled={disabled || !feature}
                    onChange={(e) => onTakeChange(e.target.value)}
                />
                {take === 'valuesAt' && (
                    <NumberInput
                        className={styles.index}
                        value={index}
                        min={0}
                        onChange={onIndexChange}
                        disabled={disabled || !feature}
                    />
                )}
            </div>
            <div className={`${styles.preview} ${value ? '' : styles.previewEmpty}`.trim()}>
                {value || '— pick a feature —'}
            </div>
        </div>
    );
};

export default PathBuilder;
