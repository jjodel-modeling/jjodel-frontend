/**
 * ReferencePicker, the popover that chooses a target element, shared by the single
 * reference control and by the Add button of a reference list.
 *
 * Rendered through a PORTAL onto document.body. It has to be: the rail clips its content
 * (`properties-with-tree-view.scss`, `overflow: hidden`), so a popover in flow would be cut
 * off at the panel edge, and the form sits deep inside that column. The same constraint
 * produced the same solution for the canvas's own inline selects, and the positioning is not
 * re-derived here, `computeListStyle` is IMPORTED from InlineObjectSelect, which already
 * solves the flip-when-there-is-no-room-below problem and the clamp-to-viewport problem.
 * Copying those fifteen lines is how two popovers start drifting apart.
 *
 * Candidates come from `slot.validTargetOptions`, the same source the enum select reads, so
 * "what may this reference point at" has one answer in the codebase and not two.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { computeListStyle } from '../../../components/InlineObjectSelect';
import type { FormFieldOptionGroup } from '../useFormWidgets';

export interface ReferenceCandidate {
    value: string;
    label: string;
    /** Group heading the candidate came from; shown as secondary text when there are several. */
    group?: string;
}

export interface ReferencePickerProps {
    /** Anchor: the control the popover opens against. */
    anchor: DOMRect;
    options: FormFieldOptionGroup[];
    /** Currently selected id, highlighted on open; '' when the slot is empty. */
    value: string;
    /** Offer a "(none)" entry. False for a [1..1] reference, which cannot be unset. */
    allowNone: boolean;
    /** Name of the declared target type, for the empty-search message. */
    typeName: string;
    onPick: (id: string) => void;
    onClear: () => void;
    onClose: () => void;
}

/** Sentinel for the "(none)" entry. A literal that cannot collide with a pointer id, which
 *  always starts with `Pointer`. */
const NONE = '__ir_none__';

export function ReferencePicker(props: ReferencePickerProps) {
    const { anchor, options, value, allowNone, typeName, onPick, onClear, onClose } = props;
    const [query, setQuery] = useState('');
    const listRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const multiGroup = options.length > 1;
    const all: ReferenceCandidate[] = useMemo(() => {
        const out: ReferenceCandidate[] = [];
        for (const g of options) {
            for (const o of g.options) out.push({ value: o.value, label: o.label, group: multiGroup ? g.label : undefined });
        }
        return out;
    }, [options, multiGroup]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const matches = q ? all.filter(c => c.label.toLowerCase().includes(q)) : all;
        return allowNone ? [{ value: NONE, label: '(none)' } as ReferenceCandidate, ...matches] : matches;
    }, [all, query, allowNone]);

    // Highlight starts on the current value, so opening and pressing Enter changes nothing:
    // a picker that opened on the first candidate would turn a look into an edit.
    const [highlight, setHighlight] = useState(() => {
        const i = filtered.findIndex(c => c.value === value);
        return i >= 0 ? i : 0;
    });
    // Typing narrows the list under the cursor; keeping the old index would leave the
    // highlight on whatever slid into that position.
    useEffect(() => { setHighlight(0); }, [query]);

    useLayoutEffect(() => { inputRef.current?.focus(); }, []);

    // Keep the highlighted row in view when the arrows walk past the visible window.
    useEffect(() => {
        const el = listRef.current?.querySelector(`[data-idx="${highlight}"]`);
        (el as HTMLElement | null)?.scrollIntoView({ block: 'nearest' });
    }, [highlight]);

    useEffect(() => {
        const onDocDown = (e: MouseEvent) => {
            if (!listRef.current?.parentElement?.contains(e.target as Node)) onClose();
        };
        // `mousedown`, not `click`: a click that starts inside the popover and ends outside
        // would otherwise close it mid-drag over the search field.
        document.addEventListener('mousedown', onDocDown, true);
        return () => document.removeEventListener('mousedown', onDocDown, true);
    }, [onClose]);

    const commit = (c: ReferenceCandidate | undefined) => {
        if (!c) return;
        if (c.value === NONE) onClear(); else onPick(c.value);
        onClose();
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown': e.preventDefault(); setHighlight(h => Math.min(h + 1, filtered.length - 1)); break;
            case 'ArrowUp': e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)); break;
            case 'Enter': e.preventDefault(); commit(filtered[highlight]); break;
            case 'Escape': e.preventDefault(); onClose(); break;
            default: break;
        }
    };

    return createPortal(
        <div className="ir-picker" style={computeListStyle(anchor)} onKeyDown={onKeyDown}>
            <div className="ir-picker__search">
                <i className="bi bi-search ir-picker__search-icon" aria-hidden="true" />
                <input
                    ref={inputRef}
                    className="ir-picker__search-input"
                    type="text"
                    placeholder="Search"
                    aria-label={`Search ${typeName || 'element'}`}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                />
            </div>
            <div className="ir-picker__list" ref={listRef} role="listbox">
                {filtered.length === 0 ? (
                    <div className="ir-picker__empty">No {typeName || 'element'} matches</div>
                ) : filtered.map((c, i) => (
                    <div
                        key={c.value}
                        data-idx={i}
                        role="option"
                        aria-selected={c.value === value}
                        className={`ir-picker__row${i === highlight ? ' ir-picker__row--active' : ''}`}
                        onMouseEnter={() => setHighlight(i)}
                        onMouseDown={e => { e.preventDefault(); commit(c); }}
                    >
                        {c.value === NONE
                            ? <span className="ir-picker__none">(none)</span>
                            : <>
                                <span className="ir-picker__badge" aria-hidden="true">{(c.label || '?').charAt(0).toUpperCase()}</span>
                                <span className="ir-picker__name">{c.label}</span>
                                {c.group && <span className="ir-picker__group">{c.group}</span>}
                            </>}
                    </div>
                ))}
            </div>
        </div>,
        document.body,
    );
}

export default ReferencePicker;
