/**
 * IRFormField, one field of a form: label row, widget, message slot.
 *
 * Three rows, and the third one is the point. The message slot is a fixed 16px that is
 * ALWAYS in the layout, occupied or not, so a diagnostic appearing or clearing never
 * moves the fields below it. Zero layout shift is a hard requirement of the design, not a
 * nicety, and it is the reason this component does not use `ui/Field`: that wrapper
 * renders its message conditionally (`{error && <ErrorText/>}`), so the field's height
 * changes with its validity. The rest of `ui/Field`, label, help text, error text, is
 * exactly what is not wanted here either, since the label row carries a required marker
 * and a multiplicity that `ui/Label` knows nothing about.
 *
 * Slice 1a renders the slot reserved and always empty: the per-field diagnostics arrive
 * in 1b, once the problems registry carries the feature name. The height is already
 * final, so nothing moves when they do. S2 puts a second kind of message in the same
 * slot: the host's REFUSAL of a write this field just attempted, with the host's own
 * reason. It sits above the registry's diagnostics because it is about the edit and not
 * about the model, and it costs no layout for the same reason the rest does not.
 *
 * ── S3: how this component addresses a write ──────────────────────────────────
 *
 * By `(objectId, field.name)`, resolved at the instant of the write — never through the
 * proxy the descriptor used to carry in `field.slot` (removed in S5, once the offer was
 * the last reader of it). The two were the same slot at the moment
 * the form renders and they can stop being the same afterwards, and a form stays open for
 * minutes: measured on the running app (`scripts/smoke/_tmp_s3_probe.ts`, 2026-08-30),
 * with the metaclass losing and regaining the feature the instance's `DValue` is
 * REPLACED, and a write through the captured proxy reports `{ok: true, changed: true}`
 * while landing the value in no slot at all. The id and the feature name are the two
 * halves of an address that survives that; the proxy is not.
 *
 * `field.name` is the feature key, the same string the adapters use in `lOwner['$' + key]`
 * and the same one `describeSlot` reads the slot's name from. `objectId` comes from the
 * host: `IRForm` already had it, and passes it to `setObjectName` one component up.
 *
 * S5 completes that address on the READ side too: the candidates of a picker are asked of
 * the same `WriteCtx` the writes go through, by `(objectId, field.name)`, and the
 * descriptor no longer carries a slot proxy at all.
 *
 * Multivalued features, references and compositions are READ-ONLY here, rendered as value
 * rows with the full label row above them, so the multiplicity and the required marker are
 * legible before the editing controls exist. That is a slice boundary, not a design
 * decision: 1b turns them into pickers and lists.
 *
 * ── FL4: the extended widgets, in front of the dispatch that was already here ──
 *
 * The field now receives its `LayoutField` — FL1's verdict on this feature: a width, and the
 * NAME of the write-side Row view that should render it. When `formAutoLayout.extendedWidgetFor`
 * resolves that name in FL3's registry, the registry's component renders and the branches
 * below are not reached; when it returns null the dispatch is exactly the committed one.
 *
 * Null is the answer for more than «the registry does not have it». It is also the answer for
 * an author override (`FormSpec.widgets`, persisted and definitive under R-B9), for a
 * read-only cell, and for a containment list — the three cases where the committed dispatch
 * is right and the width map's opinion is not. The rules and their reasons live in
 * `extendedWidgetFor`, in one place, rather than as conditions scattered through this file.
 *
 * The chip input is the one extended widget the host has to help: its reference variant does
 * not open a picker, it asks (`onRequestAdd`, with its own rect), because `ReferencePicker`
 * reaches the joiner barrel and every FL3 widget stays clear of it. Mounting the picker is
 * this component's job, and it already mounts the same one for `ReferenceWidget` and
 * `ListWidget` — same popover, same offer, asked again at open.
 */

import { useCallback, useMemo, useState } from 'react';
import { LPointerTargetable } from '../../../../joiner';
import type { LayoutField } from './formAutoLayout';
import { extendedWidgetFor } from './formAutoLayout';
import { toCssColor } from '../../nodes/valueRenderer';
import type { FieldOffer, FormFieldDescriptor } from './useFormWidgets';
import { isAtUpperBound, multiplicityLabel, offerGroups } from './useFormWidgets';
import { appendValue, clearValue, setValue, type WriteResult } from './formWrite';
import { worstSeverity, type FieldDiagnostic } from './formDiagnostics';
import TextWidget from './widgets/TextWidget';
import NumberWidget from './widgets/NumberWidget';
import CheckboxWidget from './widgets/CheckboxWidget';
import SelectWidget from './widgets/SelectWidget';
import ReferenceWidget from './widgets/ReferenceWidget';
import ListWidget from './widgets/ListWidget';
import ChipsWidget from './widgets/ChipsWidget';
import ReferencePicker from './widgets/ReferencePicker';
import { extendedWidget, type WidgetChip } from './widgets';

/** Re-exported so the widgets and the host keep importing it from here, as in Slice 1a;
 *  the single definition now lives with the projection that produces them. */
export type { FieldDiagnostic };

export interface IRFormFieldProps {
    /** DObject id of the instance this field belongs to. Half of the address of every
     *  write this component performs; the other half is `field.name`. See the note on
     *  addressing in the module comment. */
    objectId: string;
    field: FormFieldDescriptor;
    /**
     * The host's offer for this object, bound to `objectId` by `IRForm` and asked per
     * feature key (S5).
     *
     * `field.options` already carries what the offer answered when the form last
     * rendered, and that is what the enum select and the Add button's state read. The two
     * picker controls take this instead, and ask AGAIN when they open: a form stays open
     * for minutes, and the containment-loop filter behind the offer (R-FORM-13) depends on
     * where this object sits in the hierarchy, which something else may have moved
     * meanwhile — without touching this object's own slots, so nothing re-rendered the
     * form. Same source, later moment.
     */
    offer?: FieldOffer;
    /** Projected from the problems registry by the host; the slot is reserved either way. */
    diagnostics?: FieldDiagnostic[];
    /** True when this field was edited and the project has not been saved since. */
    dirty?: boolean;
    /** Called after a commit that actually changed something, so the host can mark the
     *  field dirty. The host owns the set: a field does not remember its own history. */
    onCommitted?: (slotId: string) => void;
    /**
     * FL1's verdict on this feature: the width class, the widget NAME and the rung that
     * decided them. Optional, so a caller that has not been updated renders through the
     * committed dispatch exactly as before — the width belongs to the CELL, which the host
     * draws, and this component only reads which widget the name asks for.
     */
    layout?: LayoutField;
}

/**
 * Display text of a single value.
 *
 * A pointer resolves to the name of the element it points at, so a reference reads as
 * "Running" and not as a pointer id.
 *
 * Through the L PROXY, not through `idlookup`. The two disagree, and visibly: `DObject.name`
 * is the D-layer field, which the XMI importer leaves at its generated default (`State_0`),
 * while the L getter reads the identity the user sees, the same one the form header shows a
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

/** Shown when the host refuses without saying why. The host's own `reason` is used
 *  verbatim whenever there is one; this is the field's own sentence for the case where
 *  there is none, never a guess at what the host meant. */
const UNSTATED_REFUSAL = 'The model refused this change';

export function IRFormField({ objectId, field, offer, diagnostics, dirty, onCommitted, layout }: IRFormFieldProps) {
    const fieldId = `ir-field-${field.slotId}`;
    const first = field.values[0];

    /**
     * The host's last refusal on THIS field (S2).
     *
     * Local, not lifted to the host: a refusal belongs to the write that was just
     * attempted here, while `diagnostics` come from the problems registry and describe
     * the model. The next accepted commit clears it — including a no-op, because a field
     * the user left alone is not a field still being refused.
     *
     * The state resets by itself when the form changes subject: IRForm keys each field by
     * `slotId`, so a different instance mounts a different component.
     */
    const [refusal, setRefusal] = useState<string | null>(null);

    // A refusal reads as an error, and it goes FIRST: it is about the edit the user just
    // made, while the registry's diagnostics are about the state of the model.
    const shown: FieldDiagnostic[] = refusal
        ? [{ severity: 'error', message: refusal }, ...(diagnostics ?? [])]
        : (diagnostics ?? []);
    const worst = worstSeverity(shown);

    /** One place where the verdict is read: `ok` decides the message, `changed` decides
     *  the dirty mark. Before S2 a refused write marked the field dirty and said nothing. */
    const consume = (r: WriteResult) => {
        setRefusal(r.ok ? null : (r.reason ?? UNSTATED_REFUSAL));
        if (r.changed) onCommitted?.(field.slotId);
    };

    /** The offer, asked at the moment a picker opens. Falls back to what the last render
     *  got when the host supplies no offer, so a caller that has not been updated renders
     *  exactly as before instead of showing an empty list. */
    const getOptions = useCallback(
        () => (offer ? offerGroups(offer, field.name) : field.options),
        [offer, field.name, field.options],
    );

    const rowTexts = useMemo(
        () => field.values.map(displayValue).filter(t => t !== ''),
        [field.values],
    );

    // Scalars: single-valued, writable, and not pointing at anything. References and lists
    // have their own branches below.
    const editable = !field.isMultivalued && !field.isReadOnly
        && !field.isReference && !field.isComposition;
    const writable = !field.isReadOnly;

    // Every write goes out as (objectId, field.name); since S5 there is no proxy on the
    // descriptor to take instead. See the addressing note in the module comment.
    const commitAt = (index: number, value: string | number | boolean | null, isPtr: boolean) => {
        consume(setValue(objectId, field.name, index, value, isPtr));
    };
    const clearAt = (index: number, isPtr: boolean) => {
        consume(clearValue(objectId, field.name, index, isPtr));
    };
    const appendAt = (value: string | number | boolean, isPtr: boolean) => {
        consume(appendValue(objectId, field.name, value, isPtr));
    };

    /**
     * Secondary text of a reference row: where a Transition goes.
     *
     * Read off the pointed element's own `target` slot through the proxy, a single hop and
     * only for the rows on screen. Absent when the element has no such feature, which is most
     * of them: this is a courtesy for edge-like objects, not a contract.
     */
    const rowSecondary = (targetId: string): string | undefined => {
        try {
            const l: any = LPointerTargetable.fromPointer(targetId);
            const t = l?.$target?.value ?? l?.$target?.values?.[0];
            if (!t) return undefined;
            const n: any = typeof t === 'string' ? LPointerTargetable.fromPointer(t) : t;
            return n?.name ? `to ${n.name}` : undefined;
        } catch {
            return undefined;
        }
    };

    const commitScalar = (next: string | number | boolean | null) => {
        // isPtr false: this branch only ever runs for attributes, whose values are
        // primitives. Enums and references take the pointer branch below.
        commitAt(0, next, false);
    };

    // ── FL4: the chip input's data, and the picker it asks the host to open ──────

    const isPointerValued = field.isReference || field.isComposition;

    /**
     * The chips, and the RAW index each one came from.
     *
     * Two arrays and not one, because `rawValues` has holes — `clearSlotValue` blanks a
     * position rather than splicing it — and the widget addresses a removal by its own
     * position in the array it was handed. Dropping the empties without keeping the
     * original index is how the next removal lands on the wrong value; this is the rule
     * `ListWidget` and `ChipsWidget` already state, applied to a widget that states it too.
     */
    const { chips, chipIndex } = useMemo(() => {
        const out: WidgetChip[] = [];
        const idx: number[] = [];
        field.values.forEach((v, i) => {
            if (v == null || v === '') return;
            if (isPointerValued && typeof v === 'string') {
                const label = displayValue(v);
                // `displayValue` falls through to the pointer itself when nothing resolves,
                // which is exactly the state the read side draws as broken.
                const broken = label === v;
                out.push({ key: v, label, broken });
            } else {
                out.push({ key: `${i}`, label: String(v) });
            }
            idx.push(i);
        });
        return { chips: out, chipIndex: idx };
    }, [field.values, isPointerValued]);

    /** Anchor of the picker the chip input asked for, or null when it is closed. The same
     *  popover `ReferenceWidget` and `ListWidget` open, mounted here for the reason FL3
     *  states: a widget that opened it would have to import the joiner barrel. */
    const [chipPicker, setChipPicker] = useState<DOMRect | null>(null);

    /**
     * FL3's registry, consulted first — and only where `extendedWidgetFor` says so.
     *
     * The rules (author override wins, a read-only cell offers nothing, a containment list
     * stays a sub-form, and the two meanings of the word `textarea`) are all in that one
     * function. Here there is only the lookup and the props.
     */
    const extendedName = layout ? extendedWidgetFor(layout.widget, field) : null;
    const ExtendedDef = extendedName ? extendedWidget(extendedName) : null;
    const declaredUnit = field.annotations?.unit;
    const unit = declaredUnit === 'ms' || declaredUnit === 's' ? declaredUnit : undefined;

    // Dispatch order, and it matters: the extended registry first (it has already refused
    // every case the branches below own), then read-only (nothing may offer an edit on a
    // derived or frozen slot), then the list treatments, then the single reference, then the
    // scalars. The branches are exclusive, so a feature never gets two controls.
    let control: React.ReactNode;
    if (ExtendedDef) {
        const Widget = ExtendedDef.component;
        control = (
            <Widget
                widget={ExtendedDef.id}
                id={fieldId}
                ariaLabel={field.name}
                invalid={worst === 'error'}
                value={field.isMultivalued ? undefined : (first == null ? '' : String(first))}
                chips={field.isMultivalued ? chips : undefined}
                unit={unit}
                // The read side's own colour vocabulary, handed in rather than restated:
                // `jjform/` may not import `components/`, so the form asks the row how to
                // paint (the note on `ExtendedWidgetProps.toCss`).
                toCss={toCssColor}
                atUpperBound={isAtUpperBound(field)}
                upperBound={field.upperBound}
                onCommit={field.isMultivalued ? undefined : ((next: string) => commitScalar(next))}
                onRemove={field.isMultivalued
                    ? ((_key: string, i: number) => clearAt(chipIndex[i] ?? i, isPointerValued))
                    : undefined}
                // Typed values for a multivalued ATTRIBUTE; a reference is chosen, not typed,
                // and the two callbacks are how `ChipInputWidget` tells its variants apart.
                onAppend={field.isMultivalued && !isPointerValued
                    ? ((text: string) => appendAt(text, false))
                    : undefined}
                onRequestAdd={field.isMultivalued && isPointerValued
                    ? ((anchor: DOMRect) => setChipPicker(anchor))
                    : undefined}
            />
        );
    } else if (field.isReadOnly && !field.isMultivalued) {
        control = (
            <div className="ir-field__readonly" id={fieldId}>
                {displayValue(first) || <span className="ir-field__empty">empty</span>}
            </div>
        );
    } else if (writable && field.treatment === 'list' && (field.isReference || field.isComposition)) {
        control = (
            <ListWidget
                id={fieldId}
                values={field.values}
                options={field.options}
                getOptions={getOptions}
                typeName={field.typeName}
                secondary={field.isReference ? rowSecondary : undefined}
                atUpperBound={isAtUpperBound(field)}
                upperBound={field.upperBound}
                onRemove={(i) => clearAt(i, true)}
                // Containment children get no Add in this slice: creating one is a creation
                // flow, not a value edit. See the ListWidget module comment.
                onAppend={field.isReference ? (id) => appendAt(id, true) : undefined}
            />
        );
    } else if (writable && field.isMultivalued && !field.isReference && !field.isComposition) {
        control = (
            <ChipsWidget
                id={fieldId}
                ariaLabel={field.name}
                values={field.values}
                atUpperBound={isAtUpperBound(field)}
                upperBound={field.upperBound}
                onRemove={(i) => clearAt(i, false)}
                onAppend={(text) => appendAt(text, false)}
            />
        );
    } else if (writable && (field.isReference || field.isComposition) && !field.isMultivalued) {
        control = (
            <ReferenceWidget
                id={fieldId}
                ariaLabel={field.name}
                value={typeof first === 'string' ? first : ''}
                options={field.options}
                getOptions={getOptions}
                typeName={field.typeName}
                // A required single reference cannot be unset: offering "(none)" would put the
                // model in a state the metamodel forbids, in one click.
                allowNone={field.lowerBound < 1}
                invalid={worst === 'error'}
                onPick={(id) => commitAt(0, id, true)}
                onClear={() => clearAt(0, true)}
            />
        );
    } else if (editable && field.widget === 'checkbox') {
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
                onCommit={(v) => commitAt(0, v, true)}
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
    } else {
        // What is left is read-only and multivalued: a derived list, shown as plain rows.
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
                    message slot below, being unsaved is not being wrong. */}
                {dirty && <span className="ir-field__dirty-dot" title="Modified, not saved" aria-hidden="true" />}
                {/* The multiplicity also as a tooltip. The compact theme drops it from the row,
                    where an 88px label column leaves no space for it, and this is where it goes
                    (README: "multiplicity may drop to tooltip"). Unconditional rather than
                    theme-aware: the label does not know the theme, and a tooltip repeating a
                    value that is visible two centimetres away costs nothing. */}
                <label className="ir-field__label" htmlFor={fieldId}
                       title={field.isDerived ? 'derived' : multiplicityLabel(field)}>{field.name}</label>
                {/* Required is a 4px cyan dot, never a red asterisk: red is reserved for
                    diagnostics, so a field that is merely mandatory must not look wrong. */}
                {field.isRequired && (
                    <span className="ir-field__required" title="Required" aria-hidden="true" />
                )}
                {field.isReadOnly && (
                    <i className="bi bi-lock-fill ir-field__lock" title="Read-only" aria-hidden="true" />
                )}
                {/* The multiline box is never DERIVED from a type, an EString derives to
                    `text`, so a textarea here always means the view author asked for one,
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

            {/* The chip input's picker. Asked for by the widget with its own rect, mounted
                here, and closed on every outcome including a pick — a chip list stays open
                for the next value, but the popover does not. */}
            {chipPicker && (
                <ReferencePicker
                    anchor={chipPicker}
                    options={getOptions()}
                    value=""
                    // A chip list appends: "(none)" would be a value to add, which it is not.
                    allowNone={false}
                    typeName={field.typeName}
                    onPick={(id) => { setChipPicker(null); appendAt(id, true); }}
                    onClear={() => setChipPicker(null)}
                    onClose={() => setChipPicker(null)}
                />
            )}

            {/* Fixed height, always present. See the module comment. A diagnostic wins over
                the dirty note: a field can be both, and "this value is invalid" is worth
                more of the one line available than "you have not saved yet", which the dot
                and the border already say. */}
            <div className="ir-field__message" role={worst ? 'alert' : undefined}>
                {worst && shown.length ? (
                    <>
                        <i
                            className={`bi ${worst === 'error' ? 'bi-x-circle-fill' : 'bi-exclamation-triangle-fill'} ir-field__message-icon`}
                            aria-hidden="true"
                        />
                        <span className="ir-field__message-text" title={shown[0].message}>{shown[0].message}</span>
                    </>
                ) : dirty ? (
                    <span className="ir-field__message-text">Modified, not saved</span>
                ) : null}
            </div>
        </div>
    );
}

export default IRFormField;
