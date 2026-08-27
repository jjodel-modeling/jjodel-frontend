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
import { LPointerTargetable } from '../../../../joiner';
import type { FormFieldDescriptor } from './useFormWidgets';
import { multiplicityLabel } from './useFormWidgets';
import { setSlotValue } from './formWrite';
import { worstSeverity, type FieldDiagnostic } from './formDiagnostics';
import TextWidget from './widgets/TextWidget';
import NumberWidget from './widgets/NumberWidget';
import CheckboxWidget from './widgets/CheckboxWidget';
import SelectWidget from './widgets/SelectWidget';

/** Re-exported so the widgets and the host keep importing it from here, as in Slice 1a;
 *  the single definition now lives with the projection that produces them. */
export type { FieldDiagnostic };

export interface IRFormFieldProps {
    field: FormFieldDescriptor;
    /** Projected from the problems registry by the host; the slot is reserved either way. */
    diagnostics?: FieldDiagnostic[];
    /** True when this field was edited and the project has not been saved since. */
    dirty?: boolean;
    /** Called after a commit that actually changed something, so the host can mark the
     *  field dirty. The host owns the set: a field does not remember its own history. */
    onCommitted?: (slotId: string) => void;
}

/**
 * Display text of a single value.
 *
 * A pointer resolves to the name of the element it points at, so a reference reads as
 * "Running" and not as a pointer id.
 *
 * Through the L PROXY, not through `idlookup`. The two disagree, and visibly: `DObject.name`
 * is the D-layer field, which the XMI importer leaves at its generated default (`State_0`),
 * while the L getter reads the identity the user sees — the same one the form header shows a
 * few pixels above. Reading the raw field made a row say `State_0` under a header saying
 * `Running`, for the same object. The proxy costs a wrap per value; correctness of identity
 * is worth more than that, and the reactivity is unchanged because the caller's subscription
 * already covers the slot values this resolves.
 *
 * See CLAUDE.md 3.12 for why the two sides of the name binding are wired asymmetrically.
 */
function displayValue(raw: unknown): string {
    if (raw == null) return '';
    if (typeof raw === 'string') {
        try {
            const l: any = LPointerTargetable.fromPointer(raw);
            if (l?.name) return String(l.name);
        } catch {
            // Not a pointer, or a pointer to something that no longer exists: fall through
            // and show the value itself rather than blanking the row.
        }
    }
    return String(raw);
}

export function IRFormField({ field, diagnostics, dirty, onCommitted }: IRFormFieldProps) {
    const fieldId = `ir-field-${field.slotId}`;
    const first = field.values[0];
    const worst = worstSeverity(diagnostics);

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
        if (setSlotValue(field.slot, 0, next, false)) onCommitted?.(field.slotId);
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
                onCommit={(v) => { if (setSlotValue(field.slot, 0, v, true)) onCommitted?.(field.slotId); }}
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
        <div className={`ir-field${worst ? ` ir-field--${worst}` : ''}${dirty ? ' ir-field--dirty' : ''}`}>
            <div className="ir-field__labelrow">
                {/* Before the label, not after: it marks the whole field, and the reader
                    should meet it on the way in. A diagnostic still wins the border and the
                    message slot below — being unsaved is not being wrong. */}
                {dirty && <span className="ir-field__dirty-dot" title="Modified, not saved" aria-hidden="true" />}
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

            {/* Fixed height, always present. See the module comment. A diagnostic wins over
                the dirty note: a field can be both, and "this value is invalid" is worth
                more of the one line available than "you have not saved yet", which the dot
                and the border already say. */}
            <div className="ir-field__message" role={worst ? 'alert' : undefined}>
                {worst && diagnostics?.length ? (
                    <>
                        <i
                            className={`bi ${worst === 'error' ? 'bi-x-circle-fill' : 'bi-exclamation-triangle-fill'} ir-field__message-icon`}
                            aria-hidden="true"
                        />
                        <span className="ir-field__message-text" title={diagnostics[0].message}>{diagnostics[0].message}</span>
                    </>
                ) : dirty ? (
                    <span className="ir-field__message-text">Modified, not saved</span>
                ) : null}
            </div>
        </div>
    );
}

export default IRFormField;
