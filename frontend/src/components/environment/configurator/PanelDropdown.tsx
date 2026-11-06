/**
 * PanelDropdown — the dropdown a role can choose for a string or a number attribute (#186 «Customize
 * element», P-2026-10-17-1053). The two dropdowns of the issue: a list of strings, with an «Other…»
 * entry that lets the user type a free value when the role allows it, and a list of numbers.
 *
 * A new widget of the panel, not of the form: the form's `WidgetKind` has no dropdown of strings or of
 * numbers, and its vocabulary is persisted and definitive (R-B9). It draws the field's own frame and its
 * fixed message slot, as the panel's Identity name does, and writes through `formWrite` by
 * `(objectId, feature)`, as `IRFormField` does: a string as a string, a number as a number.
 *
 * Honest about what the slot holds: a stored value outside the list is shown as «Other: v» when the
 * role allows a free value, otherwise as an extra entry «v (not in the list)»; nothing is overwritten
 * until the user picks.
 */

import { useEffect, useState } from 'react';
import { Select } from '../../ui';
import TextWidget from '../../editor-v2/viewpoint/ir/widgets/TextWidget';
import { clearValue, setValue, type WriteResult } from '../../editor-v2/viewpoint/ir/formWrite';
import { worstSeverity, type FieldDiagnostic } from '../../editor-v2/viewpoint/ir/formDiagnostics';
import type { FormFieldDescriptor } from '../../editor-v2/viewpoint/ir/useFormWidgets';

/** Option values no list entry can take: the list's own values are trimmed and non-empty. */
const NONE = '\u0000none';
const OTHER = '\u0000other';
const UNSTATED_REFUSAL = 'The model refused this change';

export interface PanelDropdownProps {
    objectId: string;
    field: FormFieldDescriptor;
    /** The role's list, already cleaned (numbers normalized when `numeric`). */
    options: string[];
    /** The string dropdown's «Other…» free entry. */
    allowOther: boolean;
    /** The values are numbers: written as numbers. */
    numeric: boolean;
    diagnostics?: FieldDiagnostic[];
    dirty?: boolean;
    onCommitted?: () => void;
}

export function PanelDropdown({ objectId, field, options, allowOther, numeric, diagnostics, dirty, onCommitted }: PanelDropdownProps) {
    const id = `ir-field-${field.slotId}`;
    const first = field.values[0];
    const current = first == null || first === '' ? '' : String(first);
    const inList = current !== '' && options.includes(current);
    const [otherMode, setOtherMode] = useState(false);
    const [refusal, setRefusal] = useState<string | null>(null);
    useEffect(() => { setRefusal(null); setOtherMode(false); }, [objectId, field.name]);

    const consume = (r: WriteResult) => {
        setRefusal(r.ok ? null : (r.reason ?? UNSTATED_REFUSAL));
        if (r.changed) onCommitted?.();
    };
    const write = (v: string) => consume(setValue(objectId, field.name, 0, numeric ? Number(v) : v, false));

    const showOther = allowOther && (otherMode || (current !== '' && !inList));
    const selected = showOther ? OTHER : current === '' ? (field.lowerBound < 1 ? NONE : '') : current;
    const flat: Array<{ value: string; label: string }> = [];
    if (field.lowerBound < 1) flat.push({ value: NONE, label: '(none)' });
    for (const o of options) flat.push({ value: o, label: o });
    if (current !== '' && !inList && !allowOther) flat.push({ value: current, label: `${current} (not in the list)` });
    if (allowOther) flat.push({ value: OTHER, label: 'Other…' });

    const shown: FieldDiagnostic[] = refusal ? [{ severity: 'error', message: refusal }, ...(diagnostics ?? [])] : (diagnostics ?? []);
    const worst = worstSeverity(shown);

    return (
        <div className={`ir-field${worst ? ` ir-field--${worst}` : ''}${dirty ? ' ir-field--dirty' : ''}`}>
            <div className="cfg-panel__dropdown">
                <Select
                    id={id}
                    aria-label={field.name}
                    aria-invalid={worst === 'error' || undefined}
                    className="ir-field__control"
                    fullWidth
                    size="sm"
                    error={worst === 'error'}
                    placeholder=""
                    options={flat}
                    value={selected}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        const next = e.target.value;
                        if (next === '' || next === selected) return;
                        if (next === OTHER) { setOtherMode(true); return; }
                        setOtherMode(false);
                        if (next === NONE) { if (current !== '') consume(clearValue(objectId, field.name, 0, false)); return; }
                        write(next);
                    }}
                />
                {showOther && (
                    <TextWidget
                        ariaLabel={`${field.name}, other value`}
                        value={inList ? '' : current}
                        placeholder="Other:"
                        maxLength={field.maxLength}
                        invalid={worst === 'error'}
                        onCommit={(t) => { if (t.trim() !== '') write(t.trim()); }}
                    />
                )}
            </div>
            <div className="ir-field__message" role={worst ? 'alert' : undefined}>
                {worst && shown.length ? (
                    <>
                        <i className={`bi ${worst === 'error' ? 'bi-x-circle-fill' : 'bi-exclamation-triangle-fill'} ir-field__message-icon`} aria-hidden="true" />
                        <span className="ir-field__message-text" title={shown[0].message}>{shown[0].message}</span>
                    </>
                ) : dirty ? <span className="ir-field__message-text">Modified, not saved</span> : null}
            </div>
        </div>
    );
}

export default PanelDropdown;
