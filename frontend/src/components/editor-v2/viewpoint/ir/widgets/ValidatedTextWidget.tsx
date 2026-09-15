/**
 * ValidatedTextWidget — `@email` and `@url`: a text field that says what it thinks.
 *
 * One component for both because they differ in two data — which check runs, and
 * whether there is a trailing action — and in nothing else. The check is inline,
 * to the right of the value, and it is DIAGNOSTIC: it never blocks the write, never
 * rewrites the value, and never empties the field. The form's own idiom, stated in
 * `NumberWidget`: «a form whose whole premise is "validation is diagnostic, never
 * blocking" cannot use a control that discards what the user typed.»
 *
 * An empty optional field shows NO verdict. `checkEmail`/`checkUrl` return `empty`
 * rather than `invalid` for exactly this: whether a blank slot is a problem is the
 * cardinality's answer, drawn by the read side as `missingRequired`, and a green
 * tick or a red cross on an untouched field would be the form scolding the user for
 * something the metamodel allows.
 *
 * ── The open-link affordance, and why the href is not the value ───────────────
 *
 * `bi-box-arrow-up-right` appears only when `checkUrl` produced an `href`, and it
 * does that only for an allowlisted scheme. A model is a document that travels
 * between people, and `javascript:` or `data:` in an `href` executes in the app's
 * own origin: the value is still shown and still editable, because hiding it would
 * hide the thing that has to be fixed, but it gets no button.
 *
 * `example.com` gets one. The href is completed with `https://` and the STORED VALUE
 * is left as the user wrote it — the link is completed, the model is not edited
 * behind the user's back.
 *
 * ── The read half ─────────────────────────────────────────────────────────────
 *
 * `truncatedText` for both, today: `RendererKind` has no `link` member, and adding
 * one propagates to `RENDERER_LABELS`, `DECLARABLE_RENDERERS`, `RowValue`'s switch,
 * the inspector and `WIDGET_RENDERER` (declared total over `WidgetKind`). Ratified
 * on 2026-08-31 as a slice of its own, so this pair ships with its write half first
 * and its read half named. Declared, not forgotten:
 * `docs/discovery/discovery_2026-08-31_fl3_widget_estesi.md` §F5.
 */

import { useEffect, useRef, useState } from 'react';
import { checkEmail, checkUrl, controlClass, controlDecision, type FieldCheck, type UrlCheck } from '../../../../../jjform';
import type { ExtendedWidgetProps } from './widgetProps';

export function ValidatedTextWidget(props: ExtendedWidgetProps) {
    const { widget, value = '', onCommit, readOnly, invalid, id, ariaLabel } = props;
    const isUrl = widget === 'url';

    const [draft, setDraft] = useState(value);
    const focused = useRef(false);

    useEffect(() => {
        if (!focused.current) setDraft(value);
    }, [value]);

    const commit = () => {
        focused.current = false;
        // Committed as typed, valid or not. The check is a diagnostic; refusing the
        // write would lose what the user meant to record.
        if (draft !== value) onCommit?.(draft);
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

    // Checked on the DRAFT, not on the committed value: the tick has to follow the
    // typing, which is the whole point of an inline check.
    const check: FieldCheck | UrlCheck = isUrl ? checkUrl(draft) : checkEmail(draft);
    const href = isUrl ? (check as UrlCheck).href : undefined;
    const decision = controlDecision({ readOnly, invalid });

    return (
        <div className={controlClass('ir-checkedfield', decision)}>
            <input
                id={id}
                aria-label={ariaLabel}
                aria-invalid={invalid || check.status === 'invalid' || undefined}
                className="ir-checkedfield__input"
                type="text"
                spellCheck={false}
                inputMode={isUrl ? 'url' : 'email'}
                value={draft}
                readOnly={readOnly}
                placeholder={isUrl ? 'https://example.com' : 'name@example.com'}
                onFocus={() => { focused.current = true; }}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={onKeyDown}
            />

            {check.status !== 'empty' && (
                <i
                    className={`bi ${check.status === 'valid' ? 'bi-check-circle' : 'bi-exclamation-circle'} ir-checkedfield__check ir-checkedfield__check--${check.status}`}
                    title={check.status === 'valid' ? undefined : check.reason}
                    aria-hidden="true"
                />
            )}

            {isUrl && (
                <a
                    className={`ir-checkedfield__open${href ? '' : ' ir-checkedfield__open--disabled'}`}
                    // No href at all when there is nothing safe to open: an anchor with
                    // a dead href is still a link the browser will follow somewhere.
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    tabIndex={href ? 0 : -1}
                    aria-disabled={href ? undefined : true}
                    title={href ? `Open ${href}` : 'Nothing to open'}
                    onClick={(e) => { if (!href) e.preventDefault(); }}
                >
                    <i className="bi bi-box-arrow-up-right" aria-hidden="true" />
                </a>
            )}
        </div>
    );
}

export default ValidatedTextWidget;
