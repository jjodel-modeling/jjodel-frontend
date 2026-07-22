import React from 'react';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { PredicateBuilder } from '../PredicateBuilder';
import type { PathBuilderFeatures } from '../PathBuilder';
import { isConditionalValue } from './conditional';
import type { Conditional, Predicate } from '../../editor-v2/viewpoint/ir/irTypes';
import styles from './ConditionalEditor.module.css';

export interface ConditionalEditorProps<T> {
    value: Conditional<T> | undefined;
    onChange: (next: Conditional<T> | undefined) => void;
    /** Renders the editor for a fixed value of T (Fixed mode, then-branch, else-branch). */
    renderValue: (value: T, onChange: (v: T) => void) => React.ReactNode;
    /** Fallback used when seeding from undefined / an absent else. */
    defaultValue: T;
    features: PathBuilderFeatures | null;
    featuresHint?: string;
    classNames: string[];
}

/**
 * ConditionalEditor<T> — wraps any scalar value editor with a Fixed/Conditional
 * toggle (authoring phase B2b-i). Fixed mode delegates entirely to `renderValue`;
 * Conditional mode exposes a PredicateBuilder for `when`, `renderValue` for
 * `then`, and an optional `else` branch. The multi-rule (`rules`) form is not
 * editable in this phase: it renders as a read-only chip and round-trips verbatim
 * (never coerced into `when/then/else`).
 *
 * Design-system layer: only the erased `import type` couples it to the IR.
 */
export function ConditionalEditor<T>({
    value,
    onChange,
    renderValue,
    defaultValue,
    features,
    featuresHint,
    classNames,
}: ConditionalEditorProps<T>): React.ReactElement {
    const isCond = isConditionalValue(value);
    const isRules = isCond && 'rules' in (value as any);
    const isWhen = isCond && 'when' in (value as any);
    const mode: 'fixed' | 'conditional' = isWhen ? 'conditional' : 'fixed';

    // Multi-rule form: not editable this phase — preserved verbatim as a chip.
    if (isRules) {
        return <span className={styles.chip}>conditional (regole multiple, non ancora editabile)</span>;
    }

    const switchToFixed = () => {
        if (mode === 'fixed') return;
        // Take the then-branch as the new fixed value; the predicate is discarded
        // (explicit user action, not silent loss).
        onChange((value as { then: T }).then);
    };
    const switchToConditional = () => {
        if (mode === 'conditional') return;
        const base = (value ?? defaultValue) as T;
        onChange({ when: { op: 'literal', value: true }, then: base });
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.modeToggle}>
                <Button variant={mode === 'fixed' ? 'primary' : 'ghost'} size="sm" onClick={switchToFixed}>Fisso</Button>
                <Button variant={mode === 'conditional' ? 'primary' : 'ghost'} size="sm" onClick={switchToConditional}>Condizionale</Button>
            </div>

            {mode === 'fixed' && renderValue((value as T) ?? defaultValue, (v) => onChange(v))}

            {mode === 'conditional' && (() => {
                const cond = value as { when: Predicate; then: T; else?: T };
                const hasElse = cond.else !== undefined;
                return (
                    <div className={styles.conditional}>
                        <div className={styles.section}>
                            <div className={styles.sectionLabel}>Quando</div>
                            <PredicateBuilder
                                value={cond.when}
                                onChange={(w) => onChange({ ...cond, when: w })}
                                features={features}
                                featuresHint={featuresHint}
                                classNames={classNames}
                            />
                        </div>
                        <div className={styles.section}>
                            <div className={styles.sectionLabel}>Allora</div>
                            {renderValue(cond.then, (t) => onChange({ ...cond, then: t }))}
                        </div>
                        <Checkbox
                            checked={hasElse}
                            label="Includi ramo else"
                            onChange={(c) => {
                                if (c) onChange({ ...cond, else: cond.else ?? defaultValue });
                                // Drop the else key entirely (no placeholder) — rebuild without it.
                                else onChange({ when: cond.when, then: cond.then });
                            }}
                        />
                        {hasElse && (
                            <div className={styles.section}>
                                <div className={styles.sectionLabel}>Altrimenti</div>
                                {renderValue(cond.else ?? defaultValue, (e) => onChange({ ...cond, else: e }))}
                            </div>
                        )}
                    </div>
                );
            })()}
        </div>
    );
}

export default ConditionalEditor;
