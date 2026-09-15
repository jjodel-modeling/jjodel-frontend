/**
 * ChipInputWidget — the multivalued control: one chip per value, `bi-x` to remove.
 *
 * Serves the spec's single `chips` width class, which covers «any 0..* (collection,
 * multi ref)», in the two variants that class contains:
 *
 *  - TAGS, a multivalued attribute. The chip is neutral, the Add affordance turns
 *    into a field in place and reads `add…`: the value is TYPED, not chosen, so a
 *    popover would be ceremony around a text input.
 *  - REFS, a multivalued reference. The chip is the cyan reference pill, the Add
 *    affordance reads `+ add target`, and it does not open anything itself — it
 *    calls `onRequestAdd` with its own rect and the host mounts the picker.
 *
 * ── Why the refs are cyan, and cyan from those tokens ─────────────────────────
 *
 * The write side of a reference must be the same pill the read side draws, which is
 * `RowValue`'s `mm-object__ref-pill`: `--color-inode-ref-bg` / `-fg` / `-border`,
 * whose light values are exactly the `#ecfeff` / `#0891b2` / `#a5f3fc` the design
 * names. Reaching for the literals instead would have made a second cyan that drifts
 * the first time the dark palette is corrected — and those tokens already carry a
 * dark-surface correction, because `#0891b2` goes muddy there.
 *
 * The manager's table does NOT draw these pills in cyan today
 * (`instanceManagerTab.scss`, `&__pill`, slate), although the spec says it should.
 * Using the tokens rather than the literals is what will make the two agree when the
 * table is aligned; aligning it is not this slice's business.
 *
 * ── Why the picker is the host's ──────────────────────────────────────────────
 *
 * `ReferencePicker` imports `metaclassLetter` from `ReferenceWidget`, which reaches
 * the `joiner` barrel, which pulls Monaco, which dereferences `window` at import
 * time — a module that cannot be loaded by a node-environment test. Every widget in
 * FL3 stays clear of that so the registry and its tests remain loadable, which is
 * also why the chips arrive already LABELLED: a widget here never resolves a pointer
 * to a name.
 *
 * ── Why it does not extend ChipsWidget ────────────────────────────────────────
 *
 * ChipsWidget is committed, is wired into `IRFormField`'s dispatch, and says `+ Add`
 * on an affordance the design now spells two other ways. Its behaviour is verified;
 * widening it to carry a second variant, a second label and a second chip treatment
 * would put that at risk for no gain while FL2 is editing the same stylesheet in
 * parallel. Which of the two the dispatch ends up calling is FL4's decision, and
 * retiring the loser is a commit of its own.
 *
 * Holes: `chips` is what the host resolved, in raw-array order, and `onRemove`
 * carries BOTH the key and the index — `clearSlotValue` blanks a position rather
 * than splicing it, so the index is the address and re-packing here would misaddress
 * the next removal (the rule `ListWidget` and `ChipsWidget` already state).
 */

import { useEffect, useRef, useState } from 'react';
import { controlClass, controlDecision, optionSlotClass } from '../../../../../jjform';
import type { ExtendedWidgetProps } from './widgetProps';

export function ChipInputWidget(props: ExtendedWidgetProps) {
    const {
        chips = [], onRemove, onAppend, onRequestAdd,
        atUpperBound, upperBound, readOnly, invalid, id, ariaLabel,
    } = props;

    // A reference variant is the one the host drives with a picker. Derived from the
    // callbacks rather than from a flag: whoever passes `onRequestAdd` has a picker
    // to open, and whoever passes `onAppend` has a value to type.
    const isRef = !!onRequestAdd;

    const [adding, setAdding] = useState(false);
    const [draft, setDraft] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const addRef = useRef<HTMLButtonElement>(null);

    useEffect(() => { if (adding) inputRef.current?.focus(); }, [adding]);

    const close = () => { setAdding(false); setDraft(''); };

    const commit = () => {
        const text = draft.trim();
        // An empty commit is a cancel, not an append of ''. The empty string is how
        // this codebase spells "no value", so appending one would add a hole on purpose.
        if (text) onAppend?.(text);
        close();
    };

    const openAdd = () => {
        if (readOnly || atUpperBound) return;
        if (isRef) {
            const r = addRef.current?.getBoundingClientRect();
            if (r) onRequestAdd?.(r);
            return;
        }
        setAdding(true);
    };

    const decision = controlDecision({ readOnly, invalid });
    const chipClass = isRef ? 'ir-chipinput__pill' : 'ir-chipinput__chip';

    return (
        <div
            className={controlClass('ir-chipinput', decision, isRef ? 'ir-chipinput--ref' : 'ir-chipinput--tag')}
            id={id}
            aria-label={ariaLabel}
        >
            {chips.map((c, i) => (
                <span
                    /* The slot rides on the REF pill only: a tag is a value the user typed,
                       not one of a set of alternatives, so there is nothing to tell apart.
                       Broken wins over the slot in the stylesheet — a target that does not
                       resolve is not an alternative either, and `optionSlot` already
                       refuses it, so the two never contradict each other. */
                    className={`${chipClass}${c.broken ? ` ${chipClass}--broken` : ''}${isRef ? optionSlotClass(chipClass, c.slot ?? null) : ''}`}
                    key={`${c.key}-${i}`}
                >
                    {/* The same glyph the read side puts on a reference pill, so the
                        two read as one thing. A broken target is not navigable, and
                        must not wear the affordance that says it is. */}
                    {isRef && (
                        <i
                            className={`bi ${c.broken ? 'bi-exclamation-circle-fill' : 'bi-link-45deg'}`}
                            aria-hidden="true"
                        />
                    )}
                    <span className={`${chipClass}-text`} title={c.label}>{c.label}</span>
                    {!readOnly && (
                        <button
                            type="button"
                            className="ir-chipinput__remove"
                            aria-label={`Remove ${c.label}`}
                            onClick={() => onRemove?.(c.key, i)}
                        >
                            <i className="bi bi-x" aria-hidden="true" />
                        </button>
                    )}
                </span>
            ))}

            {chips.length === 0 && !adding && <span className="ir-chipinput__empty">No values</span>}

            {!readOnly && (adding ? (
                <input
                    ref={inputRef}
                    className="ir-chipinput__input"
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
                    ref={addRef}
                    type="button"
                    className={`ir-chipinput__add${atUpperBound ? ' ir-chipinput__add--disabled' : ''}`}
                    disabled={!!atUpperBound}
                    title={atUpperBound ? `Maximum ${upperBound}` : (isRef ? 'Add target' : 'Add value')}
                    onClick={openAdd}
                >
                    {isRef && <i className="bi bi-plus" aria-hidden="true" />}
                    {isRef ? 'add target' : 'add…'}
                </button>
            ))}
        </div>
    );
}

export default ChipInputWidget;
