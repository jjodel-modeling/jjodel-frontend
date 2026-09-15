/**
 * GrowTextWidget — the 12-column textarea: prose that grows with what is in it.
 *
 * Serves `textarea` and `richtext`, the two width classes the spec puts at span 12
 * («text (multiline), richtext | 12 | textarea, grows vertically»).
 *
 * ── Why this is not TextWidget's `multiline` ──────────────────────────────────
 *
 * They are two different surfaces that happen to both be textareas. TextWidget's
 * multiline is the JjEL expression box: mono face, `min-height: 44px`,
 * `max-height: 56px`, `resize: none` — a SIZED surface, deliberately fixed, and
 * `IRFormField` even labels it with a `JjEL` hint because nothing else distinguishes
 * it from a long string. What FL3 asks for is the opposite: the body face, a
 * `min-height` of 54px, and a box that grows with the text rather than scrolling
 * inside a fixed one.
 *
 * So TextWidget is left exactly as it is — its behaviour is committed and its
 * consumers are the existing dispatch — and the growing box is its own component.
 * The commit dance below is deliberately the same one, because a form in which two
 * text fields commit differently is a form that cannot be learned.
 *
 * ── Growth ───────────────────────────────────────────────────────────────────
 *
 * Height is reset to `auto` before `scrollHeight` is read: without the reset,
 * `scrollHeight` can never report LESS than the current height, so a box that grew
 * once would never shrink when the text is deleted. `useLayoutEffect` and not
 * `useEffect` so the measurement lands before the browser paints and the field does
 * not flash at its old height — the same zero-shift discipline the field's 16px
 * message slot exists for.
 *
 * The floor is the CSS `min-height`, not a value computed here: a stylesheet is
 * where a dimension of the design belongs, and the theme may want to move it.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { controlClass, controlDecision } from '../../../../../jjform';
import type { ExtendedWidgetProps } from './widgetProps';

export function GrowTextWidget(props: ExtendedWidgetProps) {
    const { value = '', onCommit, readOnly, invalid, id, ariaLabel } = props;

    const [draft, setDraft] = useState(value);
    const focused = useRef(false);
    const areaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!focused.current) setDraft(value);
    }, [value]);

    useLayoutEffect(() => {
        const el = areaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    }, [draft]);

    const commit = () => {
        focused.current = false;
        if (draft !== value) onCommit?.(draft);
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            setDraft(value);
            focused.current = false;
            (e.target as HTMLElement).blur();
            return;
        }
        // Enter inserts a newline here — this is prose, and a paragraph break is the
        // most ordinary thing a writer does. Only the modified chord commits, the
        // same rule TextWidget applies to its multiline half.
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            commit();
            (e.target as HTMLElement).blur();
        }
    };

    const decision = controlDecision({ readOnly, invalid });

    return (
        <textarea
            ref={areaRef}
            id={id}
            aria-label={ariaLabel}
            aria-invalid={invalid || undefined}
            className={controlClass('ir-growtext', decision)}
            rows={2}
            value={draft}
            readOnly={readOnly}
            onFocus={() => { focused.current = true; }}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={onKeyDown}
        />
    );
}

export default GrowTextWidget;
