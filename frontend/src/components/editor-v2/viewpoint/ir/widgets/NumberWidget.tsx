/**
 * NumberWidget — value plus two stepper segments inside the field's border.
 *
 * NOT a wrapper over `ui/NumberInput`, and the reason is a correctness one rather than a
 * stylistic one. That component parses with `parseInt`, so on an `EFloat` (step 0.1) or
 * an `EDouble` (step 0.01) typing "0.5" commits 0 and the decimal part is silently lost.
 * It also commits on every keystroke, with no blur semantics, and drops out-of-range
 * input without telling anyone. A form whose whole premise is "validation is diagnostic,
 * never blocking" cannot use a control that discards what the user typed.
 *
 * `ui/NumberInput` is deliberately left untouched: it has other consumers, and changing
 * its parsing under them is not this slice's business.
 *
 * Commit semantics match TextWidget: draft while focused, commit on blur or Enter, revert
 * on Escape. The text stays a string in the draft so a half-typed "0." or "-" survives
 * keystrokes; it is parsed once, at commit.
 */

import { useEffect, useRef, useState } from 'react';

export interface NumberWidgetProps {
    value: number | null;
    onCommit: (next: number | null) => void;
    step?: number;
    readOnly?: boolean;
    invalid?: boolean;
    id?: string;
    ariaLabel?: string;
}

/** Decimal places implied by the step, so stepping 0.1 from 0.3 gives 0.4 and not
 *  0.30000000000000004. Derived from the step rather than hardcoded because the step
 *  itself comes from the feature's type (1 / 0.1 / 0.01). */
function roundToStep(n: number, step: number): number {
    const decimals = (String(step).split('.')[1] ?? '').length;
    return Number(n.toFixed(decimals));
}

export function NumberWidget(props: NumberWidgetProps) {
    const { value, onCommit, step = 1, readOnly, invalid, id, ariaLabel } = props;
    const asText = value == null ? '' : String(value);
    const [draft, setDraft] = useState(asText);
    const focused = useRef(false);

    useEffect(() => {
        if (!focused.current) setDraft(asText);
    }, [asText]);

    const parse = (text: string): number | null => {
        const t = text.trim();
        if (t === '') return null;
        const n = Number(t);          // Number, not parseInt: keeps the decimals
        return Number.isFinite(n) ? n : null;
    };

    const commit = () => {
        focused.current = false;
        const next = parse(draft);
        // An unparseable draft ("abc") commits nothing and snaps back. The form does not
        // block editing, but it also does not write a NaN into the model.
        if (next === null && draft.trim() !== '') { setDraft(asText); return; }
        if (next !== value) onCommit(next);
    };

    const bump = (direction: 1 | -1) => {
        if (readOnly) return;
        const base = parse(draft) ?? 0;
        const next = roundToStep(base + direction * step, step);
        setDraft(String(next));
        onCommit(next);
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            setDraft(asText);
            focused.current = false;
            (e.target as HTMLElement).blur();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            commit();
            (e.target as HTMLElement).blur();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault(); bump(1);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault(); bump(-1);
        }
    };

    return (
        <div className={`ir-field__stepper${invalid ? ' ir-field__stepper--invalid' : ''}${readOnly ? ' ir-field__stepper--readonly' : ''}`}>
            <input
                id={id}
                aria-label={ariaLabel}
                aria-invalid={invalid || undefined}
                className="ir-field__stepper-value"
                // `text`, not `number`: a number input hides what the user typed when the
                // draft is momentarily unparseable ("0.", "-") and adds a second set of
                // native spinners next to the two segments the design asks for.
                type="text"
                inputMode="decimal"
                value={draft}
                readOnly={readOnly}
                onFocus={() => { focused.current = true; }}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={onKeyDown}
            />
            <button
                type="button"
                className="ir-field__stepper-btn"
                onClick={() => bump(-1)}
                disabled={readOnly}
                tabIndex={-1}
                aria-label="Decrease"
            >
                <i className="bi bi-dash" aria-hidden="true" />
            </button>
            <button
                type="button"
                className="ir-field__stepper-btn"
                onClick={() => bump(1)}
                disabled={readOnly}
                tabIndex={-1}
                aria-label="Increase"
            >
                <i className="bi bi-plus" aria-hidden="true" />
            </button>
        </div>
    );
}

export default NumberWidget;
