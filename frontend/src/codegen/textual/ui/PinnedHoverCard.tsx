/**
 * The pinned hover card of the Text tab (lane D6, R-TXT-42; design in docs/discovery/discovery_2026-11-08_textual_d6_pinned_hover.md):
 * a Monaco content widget opened by the hover's Pin link or by Alt+H, one per editor, closed by the tab's own rules: ×,
 * Escape, a click on the text, an edit, its line out of view. Public Monaco API only.
 */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type * as Monaco from 'monaco-editor';
import ReactMarkdown from 'react-markdown';
import { cardLimits, cardLineInView, cardTabTarget } from '../hoverCard';
import type { CardLimits, HoverCard } from '../hoverCard';

const WIDGET_ID = 'jjodel.textual.pinnedHover';
const PIN_ACTION_ID = 'jjodel.textual.pinHover';
const FOCUSABLE = 'a[href], button';

/** A doc text's link leaves the tab, as a link of Monaco's hover does. */
const MARKDOWN_COMPONENTS = {
    a: ({ node: _node, ...props }: React.ComponentProps<'a'> & { node?: unknown }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
};

export interface PinnedHoverCardProps {
    readonly editor: Monaco.editor.IStandaloneCodeEditor;
    readonly monaco: typeof Monaco;
    readonly ui: Pick<typeof import('./textualMonaco'), 'onTextualPin' | 'textualHoverCard' | 'textualReveal'>;
    /** The notation's text: a card speaks for the notation it was pinned under. */
    readonly notation: string;
}

export function PinnedHoverCard({ editor, monaco, ui, notation }: PinnedHoverCardProps) {
    const [card, setCard] = useState<HoverCard | null>(null);
    const [limits, setLimits] = useState<CardLimits | null>(null);
    const open = card !== null;
    const rootRef = useRef<HTMLDivElement | null>(null);
    const bodyRef = useRef<HTMLDivElement | null>(null);
    const anchorRef = useRef<Monaco.IPosition | null>(null);
    const wantsFocusRef = useRef(false);
    const host = useMemo(() => document.createElement('div'), []);

    const limitsNow = (): CardLimits => {
        const { contentWidth, height } = editor.getLayoutInfo();
        return cardLimits({ contentWidth, height, lineHeight: editor.getOption(monaco.editor.EditorOption.lineHeight) });
    };

    const widget = useMemo<Monaco.editor.IContentWidget>(() => {
        const { ABOVE, BELOW } = monaco.editor.ContentWidgetPositionPreference;
        return {
            getId: () => WIDGET_ID,
            getDomNode: () => host,
            getPosition: () => (anchorRef.current ? { position: anchorRef.current, preference: [ABOVE, BELOW] } : null),
            // Monaco keeps a new widget hidden until its first render, and a hidden node takes no focus.
            afterRender: position => {
                if (position === null || !wantsFocusRef.current) return;
                wantsFocusRef.current = false;
                rootRef.current?.focus({ preventScroll: true });
            },
        };
    }, [host, monaco]);

    /** Focus inside the card would otherwise fall to the page with it. */
    const closeRef = useRef((): void => {});
    closeRef.current = () => {
        const root = rootRef.current;
        if (root?.contains(root.ownerDocument.activeElement)) editor.focus();
        anchorRef.current = null;
        wantsFocusRef.current = false;
        setCard(null);
    };

    // The two ways in: the hover's link at the hovered offset, the shortcut at the caret. A second pin replaces the card.
    useEffect(() => {
        const pin = (offset: number): void => {
            const m = editor.getModel();
            const next = m ? ui.textualHoverCard(m, offset) : null;
            if (!m || !next) return;
            const anchor = m.getPositionAt(next.start);
            if (!cardLineInView(anchor.lineNumber, editor.getVisibleRanges(), editor.getLayoutInfo().height)) return;
            anchorRef.current = anchor;
            wantsFocusRef.current = true;
            setLimits(limitsNow());
            setCard(next);
        };
        const off = ui.onTextualPin(editor, pin);
        const action = editor.addAction({
            id: PIN_ACTION_ID,
            label: 'Pin hover card',
            keybindings: [monaco.KeyMod.Alt | monaco.KeyCode.KeyH],
            keybindingContext: 'editorTextFocus',
            run: () => {
                const m = editor.getModel();
                const p = editor.getPosition();
                if (m && p) pin(m.getOffsetAt(p));
            },
        });
        return () => { off(); action.dispose(); };
    }, [editor, monaco, ui]);

    useLayoutEffect(() => {
        if (!open) return;
        editor.addContentWidget(widget);
        return () => editor.removeContentWidget(widget);
    }, [editor, widget, open]);

    // Monaco caches the node's size on its first render: a change of content or limits measures it again.
    useLayoutEffect(() => {
        if (open) editor.layoutContentWidget(widget);
    }, [editor, widget, open, card, limits]);

    // The rules of R-TXT-42 that come from the editor. Escape is read, not bound, so a suggest list gets its own Escape too.
    useEffect(() => {
        if (!open) return;
        const close = (): void => closeRef.current();
        const check = (): void => {
            const anchor = anchorRef.current;
            if (anchor && !cardLineInView(anchor.lineNumber, editor.getVisibleRanges(), editor.getLayoutInfo().height)) close();
        };
        const { CONTENT_TEXT, CONTENT_EMPTY } = monaco.editor.MouseTargetType;
        const subscriptions = [
            editor.onKeyDown(e => { if (e.keyCode === monaco.KeyCode.Escape) close(); }),
            editor.onMouseDown(e => { if (e.target.type === CONTENT_TEXT || e.target.type === CONTENT_EMPTY) close(); }),
            editor.onDidChangeModelContent(close),
            editor.onDidScrollChange(check),
            editor.onDidChangeHiddenAreas(check),
            editor.onDidLayoutChange(() => { check(); setLimits(limitsNow()); }),
        ];
        return () => subscriptions.forEach(s => s.dispose());
    }, [editor, monaco, open]);

    useEffect(() => { closeRef.current(); }, [notation]);

    // Listeners on the node, not React props: the editor around the card must not see these keys or this wheel.
    useEffect(() => {
        const root = rootRef.current;
        if (!open || !root) return;
        const onKeyDown = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                editor.focus();
                closeRef.current();
            } else if (e.key === 'Tab') {
                // Past the card, Tab would reach the editor and indent: an edit.
                e.preventDefault();
                e.stopPropagation();
                const items = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)];
                const active = root.ownerDocument.activeElement as HTMLElement | null;
                if (items.length) items[cardTabTarget(active ? items.indexOf(active) : -1, items.length, e.shiftKey)].focus();
            }
        };
        const onWheel = (e: WheelEvent): void => {
            const body = bodyRef.current;
            if (body && body.scrollHeight > body.clientHeight) e.stopPropagation();
        };
        root.addEventListener('keydown', onKeyDown);
        root.addEventListener('wheel', onWheel, { passive: true });
        return () => {
            root.removeEventListener('keydown', onKeyDown);
            root.removeEventListener('wheel', onWheel);
        };
    }, [editor, open]);

    if (!card) return null;
    const { contents, links } = card;
    const more = links.usedOn - links.uses.length;
    return createPortal(
        <div ref={rootRef} className="textual-tab__pinned" role="dialog" aria-label="Pinned hover card" tabIndex={-1} style={limits ?? undefined}>
            <button type="button" className="textual-tab__pinned-close" aria-label="Close the card" title="Close (Esc)"
                    onClick={() => { editor.focus(); closeRef.current(); }}>
                <i className="bi bi-x-lg" aria-hidden="true" />
            </button>
            <div ref={bodyRef} className="textual-tab__pinned-body">
                {contents.map((text, i) => (
                    <div key={i} className="textual-tab__pinned-text"><ReactMarkdown components={MARKDOWN_COMPONENTS}>{text}</ReactMarkdown></div>
                ))}
                {links.definition && (
                    <div className="textual-tab__pinned-row">
                        <button type="button" className="textual-tab__pinned-link" onClick={() => ui.textualReveal(editor, links.definition!.at)}>Go to definition</button>
                        {` · line ${links.definition.line}`}
                    </div>
                )}
                {links.usedOn > 0 && <div className="textual-tab__pinned-row">{`Used on ${links.usedOn} line${links.usedOn === 1 ? '' : 's'}:`}</div>}
                {links.uses.map(u => (
                    <div key={u.line} className="textual-tab__pinned-row">
                        <button type="button" className="textual-tab__pinned-link" onClick={() => ui.textualReveal(editor, u.at)}>{`line ${u.line}`}</button>
                        {' '}<code>{u.text}</code>
                    </div>
                ))}
                {more > 0 && <div className="textual-tab__pinned-row">{`and ${more} more lines`}</div>}
            </div>
        </div>,
        host,
    );
}
