/**
 * ChipsWidget, a multivalued ATTRIBUTE, as chips inside a bordered container.
 *
 * The Add chip turns into an input in place rather than opening anything: the value is typed,
 * not chosen, so a popover would be ceremony around a text field.
 *
 * No conversion happens here, on purpose. The typed text is appended as-is and `LValue` casts
 * it against the feature's type, exactly as the classic panel's inputs do. A widget that
 * parsed `EInt` itself would be a second place where "what is a valid value for this type" is
 * decided, and the two would drift; a value the type cannot take produces a conformance
 * diagnostic, which is the form's declared way of reporting such things.
 *
 * Holes: the index is the position in the raw array, kept for the same reason as in
 * ListWidget: `clearSlotValue` blanks a position instead of splicing it, so re-packing would misaddress
 * the next removal.
 */

import { useEffect, useRef, useState } from 'react';

export interface ChipsWidgetProps {
    /** Raw values, holes included. */
    values: unknown[];
    onRemove: (index: number) => void;
    onAppend: (text: string) => void;
    atUpperBound?: boolean;
    upperBound?: number;
    readOnly?: boolean;
    id?: string;
    ariaLabel?: string;
}

export function ChipsWidget(props: ChipsWidgetProps) {
    const { values, onRemove, onAppend, atUpperBound, upperBound, readOnly, id, ariaLabel } = props;
    const [adding, setAdding] = useState(false);
    const [draft, setDraft] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { if (adding) inputRef.current?.focus(); }, [adding]);

    const close = () => { setAdding(false); setDraft(''); };

    const commit = () => {
        const text = draft.trim();
        // An empty commit is a cancel, not an append of ''. The empty string is how this
        // codebase spells "no value", so appending one would add a hole on purpose.
        if (text) onAppend(text);
        close();
    };

    const chips = values
        .map((v, i) => ({ v, i }))
        .filter(({ v }) => v != null && v !== '');

    return (
        <div className={`ir-chips${readOnly ? ' ir-chips--readonly' : ''}`} id={id} aria-label={ariaLabel}>
            {chips.map(({ v, i }) => (
                <span className="ir-chips__chip" key={`${String(v)}-${i}`}>
                    <span className="ir-chips__text" title={String(v)}>{String(v)}</span>
                    {!readOnly && (
                        <button
                            type="button"
                            className="ir-chips__remove"
                            aria-label={`Remove ${String(v)}`}
                            onClick={() => onRemove(i)}
                        >
                            <i className="bi bi-x" aria-hidden="true" />
                        </button>
                    )}
                </span>
            ))}

            {chips.length === 0 && !adding && <span className="ir-chips__empty">No values</span>}

            {!readOnly && (adding ? (
                <input
                    ref={inputRef}
                    className="ir-chips__input"
                    type="text"
                    value={draft}
                    aria-label="New value"
                    onChange={e => setDraft(e.target.value)}
                    onBlur={commit}
                    onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); commit(); }
                        else if (e.key === 'Escape') { e.preventDefault(); close(); }
                    }}
                />
            ) : (
                <button
                    type="button"
                    className={`ir-chips__add${atUpperBound ? ' ir-chips__add--disabled' : ''}`}
                    disabled={atUpperBound}
                    title={atUpperBound ? `Maximum ${upperBound}` : 'Add value'}
                    onClick={() => setAdding(true)}
                >
                    <i className="bi bi-plus" aria-hidden="true" />
                    Add
                </button>
            ))}
        </div>
    );
}

export default ChipsWidget;
