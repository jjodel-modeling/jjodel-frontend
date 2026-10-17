/**
 * ComponentPicker — the dropdown of a reference in the Configurator panel (#187 task 9, mockup
 * `187_3`): a search, the candidates, and «+ New» at its foot.
 *
 * Not `ReferencePicker`: that popover has no foot, and it closes on any `mousedown` outside its own
 * box (`ReferencePicker.tsx:106-113`), so a «+ New» drawn beside it would be closed before its click
 * landed; it is shared with the form and is not edited. This one is placed as `RefRowMenu` places
 * its menu: a portal on `document.body`, the vertical axis and the flip from `computeListStyle`,
 * imported and not re-derived.
 *
 * Keyboard: the focus starts in the search; ArrowUp and ArrowDown walk the list, Enter picks,
 * Tab reaches «+ New», Escape closes and gives the focus back to the opener; the focus leaving the
 * picker closes it. It also closes on a `mousedown` outside it, on a scroll outside it and on a
 * resize, since its place is computed once.
 */

import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { computeListStyle } from '../../editor-v2/components/InlineObjectSelect';
import type { FormFieldOptionGroup } from '../../editor-v2/viewpoint/ir/useFormWidgets';
import type { ControlState } from './panelModel';

/** «(none)» in the list: a value no pointer id can take (they start with `Pointer`). */
const NONE = '__cfg_none__';

export interface ComponentPickerProps {
    /** The rect of the control that opened it. */
    anchor: DOMRect;
    /** That control: a `mousedown` on it is its own toggle, not an outside click. */
    opener: HTMLElement;
    /** What the list is for, read by assistive technology («Choose goal»). */
    label: string;
    options: FormFieldOptionGroup[];
    /** The target the slot holds at the row the picker changes; '' for none. */
    value: string;
    /** Offer «(none)»: a single-valued row the viewer may remove. */
    allowNone: boolean;
    /** The declared target type, for the empty message and «+ New <Type>». */
    typeName: string;
    /** «+ New»: its state and why it is disabled; null when the slot offers no create. */
    create: { state: ControlState; reason: string | null } | null;
    onPick: (id: string) => void;
    onNone: () => void;
    onNew: () => void;
    /** Closed; `refocus` when the keyboard closed it. */
    onClose: (refocus: boolean) => void;
}

export function ComponentPicker(props: ComponentPickerProps) {
    const { anchor, opener, label, options, value, allowNone, typeName, create, onPick, onNone, onNew, onClose } = props;
    const listId = useId();
    const [query, setQuery] = useState('');
    const boxRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    // The listeners are mounted once per picker; they call the close of the last render.
    const closeRef = useRef(onClose);
    closeRef.current = onClose;

    const multiGroup = options.length > 1;
    const all = useMemo(() => {
        const out: Array<{ value: string; label: string; group?: string }> = [];
        for (const g of options) for (const o of g.options) out.push({ value: o.value, label: o.label, group: multiGroup ? g.label : undefined });
        return out;
    }, [options, multiGroup]);
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const matches = q ? all.filter(c => c.label.toLowerCase().includes(q)) : all;
        return allowNone ? [{ value: NONE, label: '(none)' }, ...matches] : matches;
    }, [all, query, allowNone]);
    const [active, setActive] = useState(() => Math.max(0, filtered.findIndex(c => c.value === value)));
    useEffect(() => { setActive(0); }, [query]);

    useLayoutEffect(() => { inputRef.current?.focus(); }, []);
    useEffect(() => {
        boxRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' });
    }, [active]);

    useEffect(() => {
        const inside = (t: EventTarget | null) => !!boxRef.current?.contains(t as Node);
        const onDown = (e: MouseEvent) => {
            if (inside(e.target) || opener.contains(e.target as Node)) return;
            closeRef.current(false);
        };
        const onScroll = (e: Event) => { if (!inside(e.target)) closeRef.current(false); };
        const onResize = () => closeRef.current(false);
        document.addEventListener('mousedown', onDown, true);
        window.addEventListener('resize', onResize);
        // One frame late, as `RefRowMenu`: a scroll announced with the frame that paints the
        // picker happened before it opened, and is no reason to close it.
        const frame = requestAnimationFrame(() => window.addEventListener('scroll', onScroll, true));
        return () => {
            cancelAnimationFrame(frame);
            document.removeEventListener('mousedown', onDown, true);
            window.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('resize', onResize);
        };
    }, [opener]);

    const commit = (c: { value: string } | undefined) => {
        if (!c) return;
        if (c.value === NONE) onNone(); else onPick(c.value);
        onClose(true);
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown': e.preventDefault(); setActive(a => Math.min(a + 1, filtered.length - 1)); break;
            case 'ArrowUp': e.preventDefault(); setActive(a => Math.max(a - 1, 0)); break;
            case 'Enter':
                if (e.target === inputRef.current) { e.preventDefault(); commit(filtered[active]); }
                break;
            case 'Escape': e.preventDefault(); onClose(true); break;
            default: break;
        }
    };

    return createPortal(
        <div
            ref={boxRef}
            className="cfg-panel__picker"
            style={{ ...computeListStyle(anchor), width: Math.max(280, Math.round(anchor.width)) }}
            onKeyDown={onKeyDown}
            onBlur={e => { if (!boxRef.current?.contains(e.relatedTarget as Node)) closeRef.current(false); }}
        >
            <div className="cfg-panel__picker-search">
                <i className="bi bi-search" aria-hidden="true" />
                <input
                    ref={inputRef}
                    type="text"
                    className="cfg-panel__picker-input"
                    placeholder="Search"
                    aria-label={`Search ${typeName || 'element'}`}
                    aria-controls={listId}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                />
            </div>
            <div className="cfg-panel__picker-list" id={listId} role="listbox" aria-label={label}>
                {filtered.length === 0 ? (
                    <div className="cfg-panel__picker-empty">No {typeName || 'element'} to choose</div>
                ) : filtered.map((c, i) => (
                    <div
                        key={c.value}
                        data-idx={i}
                        role="option"
                        aria-selected={c.value === value}
                        className={`cfg-panel__picker-row${i === active ? ' cfg-panel__picker-row--active' : ''}${c.value === NONE ? ' cfg-panel__picker-row--none' : ''}`}
                        onMouseEnter={() => setActive(i)}
                        onMouseDown={e => { e.preventDefault(); commit(c); }}
                    >
                        <span className="cfg-panel__picker-name">{c.label}</span>
                        {'group' in c && c.group && <span className="cfg-panel__picker-group">{c.group}</span>}
                    </div>
                ))}
            </div>
            {create && create.state !== 'hidden' && (
                <div className="cfg-panel__picker-foot">
                    {create.state === 'disabled' && <span className="cfg-panel__reason">{create.reason}</span>}
                    <button
                        type="button"
                        className="cfg-panel__new"
                        disabled={create.state === 'disabled'}
                        aria-label={`New ${typeName}`}
                        title={create.reason ?? `Create a new ${typeName} and link it`}
                        onClick={() => { onNew(); onClose(true); }}
                    >
                        <i className="bi bi-plus-lg" aria-hidden="true" />
                        New
                    </button>
                </div>
            )}
        </div>,
        document.body,
    );
}

export default ComponentPicker;
