/**
 * DurationWidget — a mono field with the unit welded to its right edge.
 *
 * The write-side twin of the `numberUnit` Row view, and the twin is what fixes the
 * value shape: that renderer prints the number from the slot and the unit from
 * `jjodel/unit`, so what the slot HOLDS is the number. This widget therefore emits a
 * bare numeric string and never `"250ms"` — writing the unit into the value would
 * make the row print it twice.
 *
 * The suffix is not editable, for the same reason: it is not part of the value. It
 * is the declared dimension, shown where the design puts it so the number is read
 * with its unit and not guessed at.
 *
 * ── It still accepts a unit on the way IN ─────────────────────────────────────
 *
 * Typing `2s` into a field declared in `ms` stores `2000`. A person who knows the
 * quantity in seconds should not have to convert it by hand, and refusing the
 * spelling would be the form being pedantic about something it can read. The
 * conversion is `jjform.durationValueIn`, tested on its own; garbage snaps back
 * rather than writing a NaN, the rule `NumberWidget.commit` already applies.
 *
 * Without a declared unit there is no dimension to convert to. The field then holds
 * a plain number and the suffix is absent — which is also what the row shows, since
 * `numberUnit` prints no unit it was not given.
 */

import { useEffect, useRef, useState } from 'react';
import { controlClass, controlDecision, durationValueIn } from '../../../../../jjform';
import type { ExtendedWidgetProps } from './widgetProps';

export function DurationWidget(props: ExtendedWidgetProps) {
    const { value = '', onCommit, unit, readOnly, invalid, id, ariaLabel } = props;

    const [draft, setDraft] = useState(value);
    const focused = useRef(false);

    useEffect(() => {
        if (!focused.current) setDraft(value);
    }, [value]);

    const commit = () => {
        focused.current = false;
        const text = draft.trim();
        if (text === '') { if (value !== '') onCommit?.(''); return; }
        // No declared unit: nothing to convert to, so the number passes through and
        // the field behaves as the plain numeric one it is.
        const next = unit ? durationValueIn(text, unit) : (Number.isFinite(Number(text)) ? String(Number(text)) : null);
        if (next === null) { setDraft(value); return; }
        if (next !== value) onCommit?.(next);
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            setDraft(value);
            focused.current = false;
            (e.target as HTMLElement).blur();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            commit();
            (e.target as HTMLElement).blur();
        }
    };

    const decision = controlDecision({ readOnly, invalid });

    return (
        <div className={controlClass('ir-unitfield', decision)}>
            <input
                id={id}
                aria-label={ariaLabel}
                aria-invalid={invalid || undefined}
                className="ir-unitfield__input"
                // `text`, not `number`: the field accepts `2s`, which a number input
                // would discard as you type. Same choice, same reason, as NumberWidget.
                type="text"
                inputMode="decimal"
                value={draft}
                readOnly={readOnly}
                onFocus={() => { focused.current = true; }}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={onKeyDown}
            />
            {unit && (
                <span className="ir-unitfield__unit" aria-hidden="true">{unit}</span>
            )}
        </div>
    );
}

export default DurationWidget;
