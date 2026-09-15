/**
 * ListWidget, a row per value, for a multivalued reference or for containment children.
 *
 * Two behaviours behind one shape, and the difference is deliberate:
 *
 *  - a multivalued REFERENCE gets an Add button, which opens the same picker the single
 *    reference control uses, and appends by id;
 *  - CONTAINMENT children get no Add in this slice. Adding a child means creating an object,
 *    choosing its metaclass and placing it, which is a creation flow and not a value edit;
 *    the rows are readable and removable, and the rest is deferred. Rendering a disabled Add
 *    would promise a gesture that is not coming.
 *
 * S5: `options` is what the last render of the form got — it drives the Add button's own
 * state, which has to be right BEFORE the gesture ("No candidates left" on a disabled
 * button). `getOptions` asks the host again when the popover opens, for the reason spelt
 * out in `ReferenceWidget`: the offer is filtered per instance, and the hierarchy can move
 * under an open form without re-rendering it.
 *
 * Holes are rendered as nothing. `clearSlotValue` writes `undefined` into a position rather
 * than splicing it out (measured; see formWrite.clearSlotValue), so a slot edited twice holds
 * gaps, and this walks the raw array to keep the INDEX of each row, the index is what a
 * removal is addressed by, so re-packing the list here would make the second removal hit the
 * wrong value.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import type { FormFieldOptionGroup } from '../useFormWidgets';
import { assignableOptions } from '../slotValues';
import ReferencePicker from './ReferencePicker';
import { metaclassLetter, referenceName } from './ReferenceWidget';

export interface ListWidgetProps {
    /** Raw values, holes included: the array index is the removal key. */
    values: unknown[];
    onRemove: (index: number) => void;
    /** Absent for containment children, which have no Add in this slice. */
    onAppend?: (id: string) => void;
    options: FormFieldOptionGroup[];
    /** The same offer, asked again when the Add popover opens (S5). Absent: `options`. */
    getOptions?: () => FormFieldOptionGroup[];
    typeName: string;
    /** Secondary text of a row, e.g. "to Off" for a Transition. Absent = no secondary text. */
    secondary?: (id: string) => string | undefined;
    /** At the upper bound: Add stays visible but refuses, with the reason in its tooltip. */
    atUpperBound?: boolean;
    upperBound?: number;
    readOnly?: boolean;
    id?: string;
}

export function ListWidget(props: ListWidgetProps) {
    const { values, onRemove, onAppend, options, getOptions, typeName, secondary, atUpperBound, upperBound, readOnly, id } = props;
    const [anchor, setAnchor] = useState<DOMRect | null>(null);
    // What the open popover offers, taken when it opened. `addable` below stays the
    // render-time answer, because it is what disables the button.
    const [openAddable, setOpenAddable] = useState<FormFieldOptionGroup[]>([]);
    const addRef = useRef<HTMLButtonElement>(null);

    // Values already in the list, by raw position: `values` carries holes, and a hole is not
    // a taken id.
    const addable = useMemo(() => assignableOptions(options, values), [options, values]);
    const nothingLeft = addable.length === 0;
    const addBlocked = !!atUpperBound || nothingLeft;

    const openAdd = useCallback(() => {
        if (readOnly || addBlocked) return;
        const r = addRef.current?.getBoundingClientRect();
        if (!r) return;
        // Re-asked, then subtracted again: a value added a moment ago must not be offered
        // twice, and the fresh offer knows nothing about this slot's contents.
        setOpenAddable(assignableOptions(getOptions ? getOptions() : options, values));
        setAnchor(r);
    }, [readOnly, addBlocked, getOptions, options, values]);

    // Index preserved: `i` is the position in the raw array, which is what onRemove addresses.
    const rows = values
        .map((v, i) => ({ v, i }))
        .filter(({ v }) => v != null && v !== '');

    return (
        <div className="ir-list" id={id}>
            {rows.length === 0 && <div className="ir-field__row ir-field__empty">No values</div>}

            {rows.map(({ v, i }) => {
                const target = typeof v === 'string' ? v : String(v);
                const name = referenceName(target) || target;
                const sub = secondary?.(target);
                return (
                    <div className="ir-list__row" key={`${target}-${i}`}>
                        <span className="ir-list__badge" aria-hidden="true">{metaclassLetter(target, typeName)}</span>
                        <span className="ir-list__name" title={name}>{name}</span>
                        {sub && <span className="ir-list__secondary">{sub}</span>}
                        {!readOnly && (
                            <button
                                type="button"
                                className="ir-list__remove"
                                aria-label={`Remove ${name}`}
                                title={`Remove ${name}`}
                                onClick={() => onRemove(i)}
                            >
                                <i className="bi bi-x" aria-hidden="true" />
                            </button>
                        )}
                    </div>
                );
            })}

            {onAppend && !readOnly && (
                <button
                    ref={addRef}
                    type="button"
                    className={`ir-list__add${addBlocked ? ' ir-list__add--disabled' : ''}`}
                    disabled={addBlocked}
                    // The native tooltip carries the reason, and the two reasons are different:
                    // "full" and "nothing left to add" look the same on a disabled button and
                    // are not the same situation. A slate bubble is drawn in the mockup, but a
                    // custom tooltip is chrome with its own positioning and dismissal, and this
                    // slice has no other use for one.
                    title={atUpperBound ? `Maximum ${upperBound}`
                        : nothingLeft ? 'No candidates left'
                        : `Add ${typeName || 'element'}`}
                    onClick={openAdd}
                >
                    <i className="bi bi-plus" aria-hidden="true" />
                    Add
                </button>
            )}

            {anchor && onAppend && (
                <ReferencePicker
                    anchor={anchor}
                    options={openAddable}
                    value=""
                    // Appending has nothing to unset: "(none)" would mean "append nothing".
                    allowNone={false}
                    typeName={typeName}
                    onPick={onAppend}
                    onClear={() => { /* unreachable: allowNone is false */ }}
                    onClose={() => setAnchor(null)}
                />
            )}
        </div>
    );
}

export default ListWidget;
