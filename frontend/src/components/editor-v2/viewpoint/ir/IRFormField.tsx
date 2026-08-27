/**
 * IRFormField — one field of a form: label row, widget, message slot.
 *
 * Three rows, and the third one is the point. The message slot is a fixed 16px that is
 * ALWAYS in the layout, occupied or not, so a diagnostic appearing or clearing never
 * moves the fields below it. Zero layout shift is a hard requirement of the design, not a
 * nicety, and it is the reason this component does not use `ui/Field`: that wrapper
 * renders its message conditionally (`{error && <ErrorText/>}`), so the field's height
 * changes with its validity. The rest of `ui/Field` — label, help text, error text — is
 * exactly what is not wanted here either, since the label row carries a required marker
 * and a multiplicity that `ui/Label` knows nothing about.
 *
 * Slice 1a renders the slot reserved and always empty: the per-field diagnostics arrive
 * in 1b, once the problems registry carries the feature name. The height is already
 * final, so nothing moves when they do.
 *
 * Multivalued features, references and compositions are READ-ONLY here, rendered as value
 * rows with the full label row above them, so the multiplicity and the required marker are
 * legible before the editing controls exist. That is a slice boundary, not a design
 * decision: 1b turns them into pickers and lists.
 */

import { useMemo } from 'react';
import { store } from '../../../../joiner';
import type { FormFieldDescriptor } from './useFormWidgets';
import { multiplicityLabel } from './useFormWidgets';
import { setSlotValue } from './formWrite';
import TextWidget from './widgets/TextWidget';
import NumberWidget from './widgets/NumberWidget';
import CheckboxWidget from './widgets/CheckboxWidget';
import SelectWidget from './widgets/SelectWidget';

export interface FieldDiagnostic {
    severity: 'error' | 'warning';
    message: string;
}

export interface IRFormFieldProps {
    field: FormFieldDescriptor;
    /** Slice 1a always passes none; the slot is reserved regardless. */
    diagnostics?: FieldDiagnostic[];
}

/**
 * Display text of a single value.
 *
 * A pointer resolves to the target's name — the same resolution the canvas rows do
 * (`lookup[v].name` when the value is an id that lands on a named element), so a reference
 * reads as "Running" and not as a pointer id. Read straight from `idlookup`: this is a
 * render-time display of a value the caller's subscription already covers, so a proxy
 * would buy nothing and cost a wrap.
 */
function displayValue(raw: unknown): string {
    if (raw == null) return '';
    if (typeof raw === 'string') {
        const el = (store.getState() as any)?.idlookup?.[raw];
        if (el?.name) return String(el.name);
    }
    return String(raw);
}

export function IRFormField({ field, diagnostics }: IRFormFieldProps) {
    const fieldId = `ir-field-${field.slotId}`;
    const first = field.values[0];
    const worst = diagnostics?.some(d => d.severity === 'error') ? 'error'
        : diagnostics?.length ? 'warning' : null;

    const rowTexts = useMemo(
        () => field.values.map(displayValue).filter(t => t !== ''),
        [field.values],
    );

    // Single-valued and writable: the widget owns the value. Everything else is a
    // read-only presentation in this slice.
    const editable = !field.isMultivalued && !field.isReadOnly
        && !field.isReference && !field.isComposition;

    const commitScalar = (next: string | number | boolean | null) => {
        // isPtr false: this branch only ever runs for attributes, whose values are
        // primitives. Enums and references take the pointer branch below.
        setSlotValue(field.slot, 0, next, false);
    };

    let control: React.ReactNode;
    if (editable && field.widget === 'checkbox') {
        control = (
            <CheckboxWidget
                id={fieldId}
                value={first}
                ariaLabel={field.name}
                onCommit={(b) => commitScalar(b)}
            />
        );
    } else if (editable && field.widget === 'number') {
        control = (
            <NumberWidget
                id={fieldId}
                ariaLabel={field.name}
                value={first == null || first === '' ? null : Number(first)}
                step={field.step}
                invalid={worst === 'error'}
                onCommit={(n) => commitScalar(n)}
            />
        );
    } else if (editable && field.widget === 'select') {
        // Enum: the value is a pointer to a literal, so the write must say so.
        control = (
            <SelectWidget
                id={fieldId}
                ariaLabel={field.name}
                value={typeof first === 'string' ? first : ''}
                options={field.options}
                invalid={worst === 'error'}
                onCommit={(v) => setSlotValue(field.slot, 0, v, true)}
            />
        );
    } else if (editable) {
        control = (
            <TextWidget
                id={fieldId}
                ariaLabel={field.name}
                value={first == null ? '' : String(first)}
                multiline={field.widget === 'textarea'}
                maxLength={field.maxLength}
                invalid={worst === 'error'}
                onCommit={(t) => commitScalar(t)}
            />
        );
    } else if (field.isReadOnly && !field.isMultivalued) {
        control = (
            <div className="ir-field__readonly" id={fieldId}>
                {displayValue(first) || <span className="ir-field__empty">empty</span>}
            </div>
        );
    } else {
        // Multivalued, reference or composition: value rows, no controls (Slice 1a).
        control = (
            <div className="ir-field__rows" id={fieldId}>
                {rowTexts.length === 0
                    ? <div className="ir-field__row ir-field__empty">No values</div>
                    : rowTexts.map((t, i) => <div className="ir-field__row" key={i}>{t}</div>)}
            </div>
        );
    }

    return (
        <div className={`ir-field${worst ? ` ir-field--${worst}` : ''}`}>
            <div className="ir-field__labelrow">
                <label className="ir-field__label" htmlFor={fieldId}>{field.name}</label>
                {/* Required is a 4px cyan dot, never a red asterisk: red is reserved for
                    diagnostics, so a field that is merely mandatory must not look wrong. */}
                {field.isRequired && (
                    <span className="ir-field__required" title="Required" aria-hidden="true" />
                )}
                {field.isReadOnly && (
                    <i className="bi bi-lock-fill ir-field__lock" title="Read-only" aria-hidden="true" />
                )}
                {/* The multiline box is never DERIVED from a type — an EString derives to
                    `text` — so a textarea here always means the view author asked for one,
                    and what they asked for is a JjEL expression editor. The hint says so,
                    since nothing else on the field distinguishes it from a long string. */}
                {field.widget === 'textarea' && field.derivedWidget !== 'textarea' && (
                    <span className="ir-field__hint">JjEL</span>
                )}
                <span className="ir-field__spacer" />
                <span className="ir-field__mult">
                    {field.isDerived ? 'derived' : multiplicityLabel(field)}
                </span>
            </div>

            {control}

            {/* Fixed height, always present. See the module comment. */}
            <div className="ir-field__message" role={worst ? 'alert' : undefined}>
                {worst && diagnostics?.length ? (
                    <>
                        <i
                            className={`bi ${worst === 'error' ? 'bi-x-circle-fill' : 'bi-exclamation-triangle-fill'} ir-field__message-icon`}
                            aria-hidden="true"
                        />
                        <span className="ir-field__message-text">{diagnostics[0].message}</span>
                    </>
                ) : null}
            </div>
        </div>
    );
}

export default IRFormField;
