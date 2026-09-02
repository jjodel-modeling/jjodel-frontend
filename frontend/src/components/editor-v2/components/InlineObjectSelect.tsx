import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

export interface InlineObjectOption {
    id: string;
    name: string;
}

interface InlineObjectSelectProps {
    /** Currently assigned object id (replace mode), or null (append mode / empty slot). */
    value: string | null;
    /** Declared type of the reference — shown as the group header. */
    typeName: string;
    options: InlineObjectOption[];
    /** `(none)` is offered only where clearing has a meaning: a 0..1 reference (replace).
     *  In append mode it would be an instruction with no target. */
    allowNone: boolean;
    /** Viewport rect of the row segment that opened the select. Read once, at open. */
    anchorRect: DOMRect;
    onChange: (objectId: string | null) => void;
    onClose: () => void;
}

/** `.inline-type-select__list` min-width, mirrored here to keep the flip inside the viewport. */
const MIN_WIDTH = 140;
/** `.inline-type-select__list` max-height: the space the popover asks for before flipping up. */
const PREFERRED_HEIGHT = 200;
const GAP = 4;
const VIEWPORT_MARGIN = 8;

/**
 * Fixed-position style for the portalled list.
 *
 * The popover is rendered on `document.body` because `.ir-node-content` sets
 * `overflow: hidden` (irStyle.ts) and would clip a popover positioned inside the node —
 * unlike `.mm-node`, whose `overflow` is commented out, which is why the native enum
 * popover works in place. Everything visual still comes from `.inline-type-select__list`;
 * only the positioning axes are overridden inline, so no stylesheet changes.
 * `top: auto` is explicit on the flipped branch: the class sets `top: 100%`, and a
 * `bottom` alone would not neutralize it.
 */
export function computeListStyle(rect: DOMRect): React.CSSProperties {
    const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;
    const spaceAbove = rect.top - VIEWPORT_MARGIN;
    const openUp = spaceBelow < PREFERRED_HEIGHT && spaceAbove > spaceBelow;
    const maxHeight = Math.max(80, Math.min(PREFERRED_HEIGHT, (openUp ? spaceAbove : spaceBelow) - GAP));
    const left = Math.max(VIEWPORT_MARGIN, Math.min(rect.left, window.innerWidth - MIN_WIDTH - VIEWPORT_MARGIN));
    const base: React.CSSProperties = { position: 'fixed', left, margin: 0, maxHeight, zIndex: 10000, outline: 'none' };
    return openUp
        ? { ...base, top: 'auto', bottom: window.innerHeight - rect.top + GAP }
        : { ...base, top: rect.bottom + GAP };
}

/**
 * Popover for assigning a reference whose declared type is singleton-conforming, while the
 * singleton instances are hidden from the canvas (R-SGL-4): with no node on screen there is
 * no arrow to draw, so the value is picked from a list.
 *
 * Sibling of InlineEnumSelect and deliberately a separate component: that one is keyed on
 * literal NAMES, this one on object IDS (instance names are not unique). Same
 * `.inline-type-select*` classes, so the two read as one control. Unifying them is a
 * declared debt.
 */
function InlineObjectSelect({ value, typeName, options, allowNone, anchorRect, onChange, onClose }: InlineObjectSelectProps) {
    const [highlighted, setHighlighted] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);

    const entries: Array<{ id: string | null; label: string }> = [];
    if (allowNone) entries.push({ id: null, label: '(none)' });
    for (const o of options) entries.push({ id: o.id, label: o.name });

    // Focus on mount so the keyboard works without a click.
    useEffect(() => {
        const raf = requestAnimationFrame(() => listRef.current?.focus());
        return () => cancelAnimationFrame(raf);
    }, []);

    // Start on the current value when there is one.
    useEffect(() => {
        const idx = entries.findIndex(e => e.id === value);
        if (idx >= 0) setHighlighted(idx);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Close on Escape, on a click outside, and on any ancestor scroll: the position is
    // computed once from the anchor rect, so a scroll would leave the popover behind.
    // A scroll INSIDE the list is ignored, otherwise the list could not be scrolled.
    useEffect(() => {
        const onKeyDownDoc = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
        const onMouseDownDoc = (e: MouseEvent) => {
            if (listRef.current && !listRef.current.contains(e.target as Node)) onClose();
        };
        const onScroll = (e: Event) => {
            if (listRef.current?.contains(e.target as Node)) return;
            onClose();
        };
        document.addEventListener('keydown', onKeyDownDoc, true);
        document.addEventListener('mousedown', onMouseDownDoc, true);
        window.addEventListener('scroll', onScroll, true);
        return () => {
            document.removeEventListener('keydown', onKeyDownDoc, true);
            document.removeEventListener('mousedown', onMouseDownDoc, true);
            window.removeEventListener('scroll', onScroll, true);
        };
    }, [onClose]);

    useEffect(() => {
        const items = listRef.current?.querySelectorAll('.inline-type-select__option');
        if (items && items[highlighted]) (items[highlighted] as HTMLElement).scrollIntoView({ block: 'nearest' });
    }, [highlighted]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        e.stopPropagation();
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlighted(h => Math.min(h + 1, entries.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlighted(h => Math.max(h - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const picked = entries[highlighted];
            if (picked) onChange(picked.id);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    }, [highlighted, entries, onChange, onClose]);

    // `nodrag nowheel` are belt-and-braces here: the portal lives outside the React Flow pane,
    // so its drag and wheel handlers never see these events. They stay as a declaration of
    // intent, and they matter if the popover is ever moved back inside a node.
    return createPortal(
        <div
            ref={listRef}
            className="inline-type-select__list nodrag nowheel"
            style={computeListStyle(anchorRect)}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            tabIndex={0}
            role="listbox"
        >
            <div className="inline-type-select__group">{typeName}</div>
            {entries.length === 0 ? (
                <div className="inline-type-select__group">No conforming singleton instances</div>
            ) : entries.map((entry, idx) => (
                <div
                    key={entry.id ?? '__none__'}
                    className={
                        `inline-type-select__option` +
                        (value === entry.id ? ' selected' : '') +
                        (highlighted === idx ? ' highlighted' : '')
                    }
                    role="option"
                    aria-selected={value === entry.id}
                    onClick={() => onChange(entry.id)}
                    onMouseEnter={() => setHighlighted(idx)}
                >
                    {entry.label}
                </div>
            ))}
        </div>,
        document.body,
    );
}

export default InlineObjectSelect;
