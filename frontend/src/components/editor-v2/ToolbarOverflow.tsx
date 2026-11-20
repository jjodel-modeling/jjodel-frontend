/**
 * The overflow of the canvas bar (P-2026-11-20-2310): when the editor group is too narrow, the lowest-priority
 * buttons of the left zone leave the bar and are listed, with icon and label, in the menu of a trailing
 * `bi-three-dots` button. Nothing leaves the bar without an entry here.
 *
 * `useOverflowFit` decides how many buttons stay. It measures the box that already scrolls when the bar is short of
 * room (EditorBar's `.editor-bar__scroll`): while its content is wider than the box, one more button leaves. The
 * loop runs in a layout effect, so the trimmed bar is what paints. A resize of the bar, or a change of the buttons
 * themselves (`signature`), starts again from all of them.
 */

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { computeListStyle } from './components/InlineObjectSelect';

export interface OverflowEntry {
    readonly key: string;
    readonly label: string;
    readonly icon: ReactNode;
    readonly onClick?: () => void;
    readonly disabled?: boolean;
    /** A muted second line: the state the button showed beside it (the validation freshness). */
    readonly desc?: string;
    readonly danger?: boolean;
    /** Entries listed under this one, as a section (the views menu). */
    readonly children?: readonly OverflowEntry[];
}

/** How many of `total` buttons fit. `anchorRef` is any element inside the bar's scroll box. */
export function useOverflowFit(total: number, signature: string, anchorRef: RefObject<HTMLElement>): number {
    const [shown, setShown] = useState(total);
    const [, setRefit] = useState(0);
    const totalRef = useRef(total);
    totalRef.current = total;

    // The buttons changed: all of them again, then the loop below trims.
    useLayoutEffect(() => { setShown(total); }, [signature, total]);

    // Every render: while the content overflows the box, one more button leaves.
    useLayoutEffect(() => {
        const box = anchorRef.current?.closest('.editor-bar__scroll') as HTMLElement | null;
        if (!box || box.clientWidth === 0) return;
        if (box.scrollWidth > box.clientWidth + 1 && shown > 0) setShown(shown - 1);
    });

    // A narrower or wider bar: all of them again, synchronously, so the trim lands before the paint.
    useEffect(() => {
        const bar = anchorRef.current?.closest('.editor-bar') as HTMLElement | null;
        if (!bar || typeof ResizeObserver === 'undefined') return;
        let last = -1;
        const ro = new ResizeObserver(entries => {
            const w = Math.round(entries[0]?.contentRect.width ?? 0);
            if (w === last) return;
            last = w;
            flushSync(() => { setShown(totalRef.current); setRefit(n => n + 1); });
        });
        ro.observe(bar);
        return () => ro.disconnect();
    }, [anchorRef]);

    return Math.min(shown, total);
}

export interface ToolbarOverflowProps {
    readonly entries: readonly OverflowEntry[];
    /** Set on the wrapper, which stays in the DOM (hidden) when nothing overflows: the fit measures from it. */
    readonly rootRef: RefObject<HTMLSpanElement>;
}

/** The trailing button and its menu, portalled onto `document.body` like the syntax listbox, for the same reason. */
export default function ToolbarOverflow({ entries, rootRef }: ToolbarOverflowProps) {
    const [open, setOpen] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => { if (entries.length === 0) setOpen(false); }, [entries.length]);

    // Closing: outside press, Escape (capture, §15.1), and any scroll, wheel or resize outside the menu.
    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            const t = e.target as Node;
            if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
            setOpen(false);
        };
        const onMove = (e: Event) => { if (!menuRef.current?.contains(e.target as Node)) setOpen(false); };
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            e.preventDefault();
            setOpen(false);
            triggerRef.current?.focus();
        };
        window.addEventListener('mousedown', onDown, true);
        window.addEventListener('keydown', onKey, true);
        window.addEventListener('scroll', onMove, true);
        window.addEventListener('wheel', onMove, true);
        window.addEventListener('resize', onMove);
        const raf = requestAnimationFrame(() => menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')?.focus());
        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('mousedown', onDown, true);
            window.removeEventListener('keydown', onKey, true);
            window.removeEventListener('scroll', onMove, true);
            window.removeEventListener('wheel', onMove, true);
            window.removeEventListener('resize', onMove);
        };
    }, [open]);

    const onMenuKeyDown = (e: React.KeyboardEvent) => {
        e.stopPropagation();
        const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? []);
        if (items.length === 0) return;
        const i = items.indexOf(document.activeElement as HTMLElement);
        const go = (n: number) => { e.preventDefault(); items[(n + items.length) % items.length].focus(); };
        if (e.key === 'ArrowDown') go(i + 1);
        else if (e.key === 'ArrowUp') go(i - 1);
        else if (e.key === 'Home') go(0);
        else if (e.key === 'End') go(items.length - 1);
        else if (e.key === 'Tab') setOpen(false);
    };

    const run = (entry: OverflowEntry) => { setOpen(false); entry.onClick?.(); };

    const item = (entry: OverflowEntry, nested: boolean) => (
        <button key={entry.key} type="button" role="menuitem" disabled={entry.disabled}
                className={'toolbar-overflow__item' + (nested ? ' toolbar-overflow__item--nested' : '') + (entry.danger ? ' toolbar-overflow__item--danger' : '')}
                onClick={() => run(entry)}>
            <span className="toolbar-overflow__icon" aria-hidden="true">{entry.icon}</span>
            <span className="toolbar-overflow__label">{entry.label}</span>
            {entry.desc && <span className="toolbar-overflow__desc">{entry.desc}</span>}
        </button>
    );

    return (
        <span ref={rootRef} className="toolbar-overflow" hidden={entries.length === 0}>
            <button ref={triggerRef} type="button" className="toolbar-btn toolbar-overflow__trigger"
                    title="More actions" aria-label="More actions" aria-haspopup="menu" aria-expanded={open}
                    onClick={() => {
                        if (open) { setOpen(false); return; }
                        if (triggerRef.current) setRect(triggerRef.current.getBoundingClientRect());
                        setOpen(true);
                    }}>
                <i className="bi bi-three-dots" aria-hidden="true" />
            </button>
            {open && rect && createPortal(
                <div ref={menuRef} className="toolbar-overflow__menu" role="menu" aria-label="More actions"
                     style={computeListStyle(rect)} onKeyDown={onMenuKeyDown}>
                    {entries.map(entry => entry.children ? (
                        <Fragment key={entry.key}>
                            <div className="toolbar-overflow__section" role="presentation">
                                <span className="toolbar-overflow__icon" aria-hidden="true">{entry.icon}</span>{entry.label}
                            </div>
                            {entry.children.map(child => item(child, true))}
                        </Fragment>
                    ) : item(entry, false))}
                </div>,
                document.body,
            )}
        </span>
    );
}
