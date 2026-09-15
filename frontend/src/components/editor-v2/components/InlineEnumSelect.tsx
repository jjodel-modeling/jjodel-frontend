import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { computeListStyle } from './InlineObjectSelect';

interface EnumLiteral {
    name: string;
}

interface InlineEnumSelectProps {
    value: string;
    enumName: string;
    literals: EnumLiteral[];
    isStale?: boolean;
    /** Viewport rect of the trigger that opened the select. Read once, at open. */
    anchorRect: DOMRect;
    onChange: (value: string) => void;
    onClose: () => void;
}

/**
 * Popover dropdown for selecting enum literal values.
 * Reuses the same visual style as InlineTypeSelect (`.inline-type-select` classes).
 *
 * ── Why the list is portalled onto `body` ──────────────────────────────────
 *
 * It used to be an absolutely-positioned child of `.inline-type-select`, which
 * worked only as long as no ancestor clipped it. `.mm-node.mm-object` sets
 * `overflow: hidden` (instanceNode.scss) — it is what clips the accent bar to
 * the node's radius — so on an instance node the list was cut at the node's
 * bottom border. Measured 2026-08-28 on the RowViewSmoke fixture: the list
 * overflowed the node by 178px, and `elementFromPoint` at the centre of `Green`
 * and `Blue` did not land on them. That is the whole of the "only (none) shows"
 * symptom: the literals were in the DOM, below the cut.
 *
 * Positioning comes from `computeListStyle`, imported rather than re-derived —
 * the same helper `InlineObjectSelect` (its sibling on these very rows) and
 * `ReferencePicker` already use, so the flip-up, the viewport clamp and the
 * screen-space geometry stay one implementation. The popover therefore does NOT
 * scale with the canvas zoom, and closes on a viewport gesture instead of
 * following the node: matching the sibling control matters more here than
 * tracking, since the two open from adjacent rows of the same node.
 */
function InlineEnumSelect({ value, enumName, literals, isStale, anchorRect, onChange, onClose }: InlineEnumSelectProps) {
    const [highlighted, setHighlighted] = useState(0);
    const listRef = useRef<HTMLDivElement>(null);

    // Options: empty (clear) + literals; if stale, add the invalid value
    const options: Array<{ value: string; label: string; stale?: boolean }> = [];
    options.push({ value: '', label: '(none)' });
    if (isStale && value) {
        options.push({ value, label: `${value} (invalid)`, stale: true });
    }
    for (const lit of literals) {
        options.push({ value: lit.name, label: lit.name });
    }

    // Find initial highlighted index
    useEffect(() => {
        const idx = options.findIndex(o => o.value === value);
        if (idx >= 0) setHighlighted(idx);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Focus the list on mount so keyboard events work without a second click.
    useEffect(() => {
        const raf = requestAnimationFrame(() => listRef.current?.focus());
        return () => cancelAnimationFrame(raf);
    }, []);

    // Close on Escape, on a click outside, and on any gesture that moves the
    // anchor: the position is computed once from the trigger's rect, so a scroll
    // or a canvas pan/zoom would leave the popover behind. Gestures INSIDE the
    // list are ignored, otherwise the list could not be scrolled.
    useEffect(() => {
        const onKeyDownDoc = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
        const onMouseDownDoc = (e: MouseEvent) => {
            if (listRef.current && !listRef.current.contains(e.target as Node)) onClose();
        };
        const onViewportMove = (e: Event) => {
            if (listRef.current?.contains(e.target as Node)) return;
            onClose();
        };
        document.addEventListener('keydown', onKeyDownDoc, true);
        document.addEventListener('mousedown', onMouseDownDoc, true);
        window.addEventListener('scroll', onViewportMove, true);
        // React Flow pans and zooms with the wheel, and a transform fires no
        // scroll event: without this the popover detaches from its node.
        window.addEventListener('wheel', onViewportMove, true);
        return () => {
            document.removeEventListener('keydown', onKeyDownDoc, true);
            document.removeEventListener('mousedown', onMouseDownDoc, true);
            window.removeEventListener('scroll', onViewportMove, true);
            window.removeEventListener('wheel', onViewportMove, true);
        };
    }, [onClose]);

    // Scroll highlighted item into view
    useEffect(() => {
        if (listRef.current) {
            const items = listRef.current.querySelectorAll('.inline-type-select__option');
            if (items[highlighted]) {
                (items[highlighted] as HTMLElement).scrollIntoView({ block: 'nearest' });
            }
        }
    }, [highlighted]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        e.stopPropagation();
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlighted(h => Math.min(h + 1, options.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlighted(h => Math.max(h - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            onChange(options[highlighted].value);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onClose();
        }
    }, [highlighted, options, onChange, onClose]);

    // `nodrag nowheel` are belt-and-braces here, exactly as on InlineObjectSelect:
    // the portal lives outside the React Flow pane, so its drag and wheel handlers
    // never see these events.
    return createPortal(
        <div
            ref={listRef}
            className="inline-type-select__list nodrag nowheel"
            style={computeListStyle(anchorRect)}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            tabIndex={0}
            role="listbox"
        >
            <div className="inline-type-select__group">{enumName}</div>
            {options.map((opt, idx) => (
                <div
                    key={opt.value || '__none__'}
                    className={
                        `inline-type-select__option` +
                        (value === opt.value ? ' selected' : '') +
                        (highlighted === idx ? ' highlighted' : '') +
                        (opt.stale ? ' inline-type-select__option--stale' : '')
                    }
                    role="option"
                    aria-selected={value === opt.value}
                    onClick={() => onChange(opt.value)}
                    onMouseEnter={() => setHighlighted(idx)}
                >
                    {opt.label}
                </div>
            ))}
        </div>,
        document.body,
    );
}

export default InlineEnumSelect;
