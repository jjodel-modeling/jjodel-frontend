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

/**
 * Letter badge of a pointed element: the initial of its METACLASS, not of its own name.
 *
 * `S` for every State and `T` for every Transition, so the badge says what kind of thing the
 * row holds. Keying it on the instance name instead gave three different letters to three
 * States (`I`, `R`, `O`), which reads as three kinds and carries no information the name
 * beside it does not already carry.
 *
 * `fallbackTypeName` is the DECLARED type of the reference, used when the target cannot be
 * resolved: a dangling pointer still belongs to a known type, so the badge stays right even
 * when the element is gone.
 */
export function metaclassLetter(id: string, fallbackTypeName?: string): string {
    let source = fallbackTypeName ?? '';
    if (id) {
        try {
            const l: any = LPointerTargetable.fromPointer(id);
            const n = l?.instanceof?.name;
            if (n) source = String(n);
        } catch {
            // Falls through to the declared type.
        }
    }
    return (source || '?').charAt(0).toUpperCase();
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
                        <span className="ir-ref__badge" aria-hidden="true">{metaclassLetter(value, typeName)}</span>
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
