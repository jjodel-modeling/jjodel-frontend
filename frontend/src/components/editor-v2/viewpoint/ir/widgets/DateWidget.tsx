/**
 * DateWidget — `date` and `datetime`, the write-side twin of the `date` Row view.
 *
 * One component for both, the way TextWidget serves single-line and multiline: what
 * differs is the input's `type` and the glyph beside it (`bi-calendar3` /
 * `bi-clock`), while the draft, the commit and the picker affordance are identical.
 *
 * ── What it emits ─────────────────────────────────────────────────────────────
 *
 * `YYYY-MM-DD`, or `YYYY-MM-DDTHH:mm`, which is what `absoluteDate` reads back
 * (`valueRenderer.ts`): the row prints the ISO date and the age after it, from the
 * same string. Normalisation goes through `jjform.normalizeIsoDate` rather than
 * through `new Date()`, for the reason the read side spells out — a plain ISO date
 * parsed as UTC midnight prints the day before in any timezone west of Greenwich,
 * and a model is a document.
 *
 * ── Why a draft, on a control that has a picker ───────────────────────────────
 *
 * A native date input reports `''` for every incomplete state, and it is incomplete
 * on the way through: typing `2026` into an empty field fires `change` with `''`
 * three times before the day is in. Committing on change would blank the slot on
 * each of them. So the draft/commit-on-blur/revert-on-Escape dance of TextWidget
 * applies here too, and the picker simply fills the draft.
 *
 * ── The glyph is the picker, and it has to be ─────────────────────────────────
 *
 * `formWidgets.scss` hides `::-webkit-calendar-picker-indicator`, because the design
 * names the icon. Hiding the native affordance without replacing it would leave the
 * control keyboard-only, so the button calls `showPicker()`. That throws when the
 * browser does not have it (Safari before 16) or when the call is not user-activated,
 * hence the try/catch and the fall back to focusing the field, which is exactly what
 * the native indicator would have done.
 *
 * Custom datepicker: out of scope for v0, by the prompt. The native one is the picker.
 */

import { useEffect, useRef, useState } from 'react';
import { controlClass, controlDecision, normalizeIsoDate, normalizeIsoDateTime } from '../../../../../jjform';
import type { ExtendedWidgetProps } from './widgetProps';

/** The input can only ever show a value it can parse; anything else would silently
 *  read as empty and hide what the model holds. */
function shownValue(raw: string, withTime: boolean): string {
    return (withTime ? normalizeIsoDateTime(raw) : normalizeIsoDate(raw)) ?? '';
}

export function DateWidget(props: ExtendedWidgetProps) {
    const { widget, value = '', onCommit, readOnly, invalid, id, ariaLabel } = props;
    const withTime = widget === 'datetime';

    const committed = shownValue(value, withTime);
    const [draft, setDraft] = useState(committed);
    const focused = useRef(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!focused.current) setDraft(committed);
    }, [committed]);

    const commit = () => {
        focused.current = false;
        // An unparseable draft is not written and snaps back, the rule NumberWidget
        // already applies. An EMPTY draft is a value: clearing a date is an edit.
        const next = draft === '' ? '' : shownValue(draft, withTime);
        if (draft !== '' && next === '') { setDraft(committed); return; }
        if (next !== committed) onCommit?.(next);
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            setDraft(committed);
            focused.current = false;
            (e.target as HTMLElement).blur();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            commit();
            (e.target as HTMLElement).blur();
        }
    };

    const openPicker = () => {
        const el = inputRef.current;
        if (!el || readOnly) return;
        try {
            // Not on the HTMLInputElement type in this TS lib version; guarded anyway,
            // because it also throws when the browser refuses the call.
            (el as unknown as { showPicker?: () => void }).showPicker?.();
        } catch {
            el.focus();
        }
    };

    const decision = controlDecision({ readOnly, invalid });

    return (
        <div className={controlClass('ir-datefield', decision)}>
            <input
                ref={inputRef}
                id={id}
                aria-label={ariaLabel}
                aria-invalid={invalid || undefined}
                className="ir-datefield__input"
                type={withTime ? 'datetime-local' : 'date'}
                value={draft}
                readOnly={readOnly}
                onFocus={() => { focused.current = true; }}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={onKeyDown}
            />
            <button
                type="button"
                className="ir-datefield__icon"
                disabled={readOnly}
                tabIndex={-1}
                aria-label={withTime ? 'Pick a date and time' : 'Pick a date'}
                onClick={openPicker}
            >
                <i className={`bi ${withTime ? 'bi-clock' : 'bi-calendar3'}`} aria-hidden="true" />
            </button>
        </div>
    );
}

export default DateWidget;
