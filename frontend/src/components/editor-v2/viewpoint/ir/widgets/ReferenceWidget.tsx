/**
 * ReferenceWidget, the single-valued reference control: badge, target name, chevron.
 *
 * Opens the shared ReferencePicker. The value is written by id
 * (`setSlotValue(slot, 0, id, true)`), which is what the classic panel writes, so the two
 * surfaces leave a slot in the same shape.
 *
 * The displayed name comes from the L PROXY, not from `idlookup[id].name`. On a model
 * imported from XMI the two disagree, the D field keeps the generated default (`State_0`)
 * while the proxy carries the identity the user sees (`Running`), and a row saying
 * `State_0` under a header saying `Running`, for the same object, is the defect this was
 * born with rather than acquired. Same resolution as IRFormField.displayValue.
 */

import { useCallback, useRef, useState } from 'react';
import { LPointerTargetable } from '../../../../../joiner';
import type { FormFieldOptionGroup } from '../useFormWidgets';
import ReferencePicker from './ReferencePicker';

export interface ReferenceWidgetProps {
    /** Current target id, or '' when the slot is empty. */
    value: string;
    onPick: (id: string) => void;
    onClear: () => void;
    options: FormFieldOptionGroup[];
    /** Declared type of the reference, for the placeholder and the search message. */
    typeName: string;
    /** [1..1] cannot be unset, so the picker offers no "(none)". */
    allowNone: boolean;
    readOnly?: boolean;
    invalid?: boolean;
    id?: string;
    ariaLabel?: string;
}

/** Display name of a pointed element, through the L proxy. See the module comment. */
export function referenceName(id: string): string {
    if (!id) return '';
    try {
        const l: any = LPointerTargetable.fromPointer(id);
        if (l?.name) return String(l.name);
    } catch {
        // Dangling pointer: show nothing rather than the raw id, and let the conformance
        // diagnostic be the thing that explains it.
    }
    return '';
}

/** Letter badge of a pointed element: first letter of its name, as the picker rows use. */
export function referenceLetter(name: string): string {
    return (name || '?').charAt(0).toUpperCase();
}

export function ReferenceWidget(props: ReferenceWidgetProps) {
    const { value, onPick, onClear, options, typeName, allowNone, readOnly, invalid, id, ariaLabel } = props;
    const [anchor, setAnchor] = useState<DOMRect | null>(null);
    const btnRef = useRef<HTMLButtonElement>(null);

    const open = useCallback(() => {
        if (readOnly) return;
        const r = btnRef.current?.getBoundingClientRect();
        if (r) setAnchor(r);
    }, [readOnly]);

    const name = referenceName(value);
    const empty = !name;

    return (
        <>
            <button
                ref={btnRef}
                id={id}
                type="button"
                aria-label={ariaLabel}
                aria-invalid={invalid || undefined}
                aria-haspopup="listbox"
                aria-expanded={anchor !== null}
                disabled={readOnly}
                className={`ir-field__control ir-ref${empty ? ' ir-ref--empty' : ''}`}
                onClick={open}
            >
                {empty ? (
                    <>
                        <i className="bi bi-link-45deg ir-ref__link" aria-hidden="true" />
                        <span className="ir-ref__placeholder">Select a {typeName || 'element'}</span>
                    </>
                ) : (
                    <>
                        <span className="ir-ref__badge" aria-hidden="true">{referenceLetter(name)}</span>
                        <span className="ir-ref__name">{name}</span>
                    </>
                )}
                <i className="bi bi-chevron-down ir-ref__chevron" aria-hidden="true" />
            </button>

            {anchor && (
                <ReferencePicker
                    anchor={anchor}
                    options={options}
                    value={value}
                    allowNone={allowNone}
                    typeName={typeName}
                    onPick={onPick}
                    onClear={onClear}
                    onClose={() => setAnchor(null)}
                />
            )}
        </>
    );
}

export default ReferenceWidget;
