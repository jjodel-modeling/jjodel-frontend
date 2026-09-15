/**
 * CheckboxWidget — 14px box with the label to its right.
 *
 * NOT a wrapper over `ui/Checkbox`: that component's box is a hardcoded `width: 18px;
 * height: 18px` in its CSS module, not a custom property, so the 14px the handoff
 * specifies cannot be reached by scoping tokens the way the other controls' heights are.
 * Editing the module would resize every checkbox in the app.
 *
 * Boolean slots commit on change, not on blur: there is no draft to hold, and a
 * half-toggled checkbox is not a state.
 */

import { U } from '../../../../../joiner';

export interface CheckboxWidgetProps {
    value: unknown;
    onCommit: (next: boolean) => void;
    /** Text beside the box ("History state"), distinct from the field's own label. */
    label?: string;
    readOnly?: boolean;
    id?: string;
    ariaLabel?: string;
}

/**
 * Read a slot value as a boolean.
 *
 * The D layer stores booleans as booleans OR as the strings 'true'/'false', depending on
 * which writer produced them (a widget, an Ecore import, JjScript). `U.fromBoolString` is
 * the existing canon for that coercion and is what the classic panel uses on the same
 * values; re-deriving it here with `=== 'true'` would disagree with it on the edges.
 */
function asBool(raw: unknown): boolean {
    if (typeof raw === 'boolean') return raw;
    if (typeof raw === 'string') return U.fromBoolString(raw, false, false, false);
    return !!raw;
}

export function CheckboxWidget(props: CheckboxWidgetProps) {
    const { value, onCommit, label, readOnly, id, ariaLabel } = props;
    const checked = asBool(value);

    return (
        <label className={`ir-field__checkbox${readOnly ? ' ir-field__checkbox--readonly' : ''}`}>
            <input
                id={id}
                type="checkbox"
                className="ir-field__checkbox-box"
                checked={checked}
                disabled={readOnly}
                aria-label={label ? undefined : ariaLabel}
                onChange={(e) => onCommit(e.target.checked)}
            />
            {label && <span className="ir-field__checkbox-label">{label}</span>}
        </label>
    );
}

export default CheckboxWidget;
