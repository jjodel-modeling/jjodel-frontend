/**
 * ColorWidget — the 12px swatch of the Row view, with the hex beside it in mono.
 *
 * The write-side twin of the `swatch` renderer, and the twin is exact in the one way
 * that matters: the square is painted by the SAME function the row paints with. The
 * read side's `toCssColor` arrives as the `toCss` prop rather than being restated
 * here, because it carries 148 CSS colour names, four functional notations and the
 * `0x` form — a copy of that would be a second vocabulary, and a slot holding
 * `Green` would then paint on the canvas and not in the form.
 *
 * Without `toCss` the widget falls back to the hex forms `jjform.normalizeHex`
 * canonicalises on its own. That is a degradation, not a different rule: fewer
 * colours paint, none paints differently.
 *
 * ── Why not `ui/ColorPicker` ──────────────────────────────────────────────────
 *
 * Three reasons, and the third is a correctness one, the same shape as the argument
 * `NumberWidget` makes against `ui/NumberInput`:
 *
 *  - it is a CSS module with its own wrapper and label, so it cannot sit in the
 *    form's three-row field the way every other control does;
 *  - it commits on every keystroke, with no blur semantics, while this whole form
 *    commits on blur or Enter and reverts on Escape;
 *  - its `HEX_RE` accepts only `#rgb` and `#rrggbb`, so a slot holding `Green` or
 *    `rgb(0,0,0)` — values the row renders without trouble — would be treated as
 *    invalid by the control that is supposed to be its twin.
 *
 * `ui/ColorPicker` is left untouched: it has other consumers.
 *
 * ── The swatch does not pick ──────────────────────────────────────────────────
 *
 * The design is a swatch and a hex field, and a native `<input type="color">` only
 * speaks `#rrggbb`: put behind this square it would show `#000000` for a slot that
 * says `Green` and overwrite it on the first click. The square shows, the field
 * edits. A real picker that can round-trip the whole vocabulary is a slice of its own.
 */

import { useEffect, useRef, useState } from 'react';
import { controlClass, controlDecision, isHexColor, normalizeHex } from '../../../../../jjform';
import type { ExtendedWidgetProps } from './widgetProps';

export function ColorWidget(props: ExtendedWidgetProps) {
    const { value = '', onCommit, toCss, readOnly, invalid, id, ariaLabel } = props;

    const [draft, setDraft] = useState(value);
    const focused = useRef(false);

    useEffect(() => {
        if (!focused.current) setDraft(value);
    }, [value]);

    const commit = () => {
        focused.current = false;
        const text = draft.trim();
        // Hex is canonicalised so two spellings of one colour compare equal in the
        // model; everything else is stored verbatim, because this widget is not the
        // place where the colour vocabulary is decided.
        const next = isHexColor(text) ? (normalizeHex(text) ?? text) : text;
        if (next !== value) onCommit?.(next);
        setDraft(next);
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

    const resolve = toCss ?? normalizeHex;
    const painted = resolve(draft) ?? null;
    const decision = controlDecision({ readOnly, invalid });

    return (
        <div className={controlClass('ir-colorfield', decision)}>
            {/* Not a button and not an input: it is the value, shown. The hairline is
                the row's, and it is what keeps `#ffffff` visible on a white field —
                without it a pale swatch reads as an empty slot. */}
            <span
                className={`ir-colorfield__swatch${painted ? '' : ' ir-colorfield__swatch--unpaintable'}`}
                style={painted ? ({ ['--ir-swatch' as string]: painted } as React.CSSProperties) : undefined}
                title={painted ?? 'Not a colour this can paint'}
                aria-hidden="true"
            />
            <input
                id={id}
                aria-label={ariaLabel}
                aria-invalid={invalid || undefined}
                className="ir-colorfield__hex"
                type="text"
                spellCheck={false}
                value={draft}
                readOnly={readOnly}
                placeholder="#000000"
                onFocus={() => { focused.current = true; }}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={onKeyDown}
            />
        </div>
    );
}

export default ColorWidget;
