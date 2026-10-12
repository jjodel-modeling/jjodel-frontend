/**
 * InstanceDetail — the detail of ONE instance, as the Data Manager shows it: header,
 * breadcrumb and Back, the form, the contained children inline, the reference
 * sections, the «Add» bar.
 *
 * Extracted from `InstanceManagerTab` (2026-09-28, #157 + #158) so the stand-alone
 * environment (`environment/ConfiguratorTab`) shows and navigates an element exactly as
 * the Data Manager does. Two hosts, one component: a second copy of this panel would be
 * two surfaces that drift at the first change — the reason `RefSlotsSection` was
 * extracted by #158 P3 in the first place. The body moved verbatim; what is new is only
 * what a second host needs: the host-owned events and the optional permissions.
 *
 * ── Controlled ─────────────────────────────────────────────────────────────────
 *
 * The navigation (`nav`) is the HOST's state. The Data Manager clears it from each of
 * its four selection emitters (`selectOnly`, `selectFromOutline`, `selectFromEgo`,
 * `toggleSelected`), and those are its contract, asserted in its tests; keeping `nav`
 * there keeps them where they are. The scroll container is the host's too
 * (`scrollRef`): the pane that scrolls is the host's layout, not this panel's.
 *
 * ── Events, not dialogs ────────────────────────────────────────────────────────
 *
 * Creating and deleting belong to the host: the Data Manager opens its draft and its
 * delete preflight, the stand-alone creates directly. An absent event is an absent
 * control — no button that does nothing.
 *
 * ── Permissions (stand-alone profiles, #157) ───────────────────────────────────
 *
 * `permissionOf(classId)` is the profile's per-type rule (`resolveTypePermission`),
 * applied to every instance this panel shows or offers, including the ones reached by
 * navigating: `read` → the form takes no input (the soft gate of D1) and nothing is
 * created or deleted from it; `hidden` → the element is not shown, nor is a reference or
 * child slot typed by its class (step B; the form gets the same rule as `IRForm`'s
 * `permissionOf`). Absent (the Data Manager), everything is `edit`.
 */

import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import IRForm from '../../editor-v2/viewpoint/ir/IRForm';
import { computeIRSignature, getIRIndex, resolveIRView } from '../../editor-v2/viewpoint/ir/irResolveCore';
import { findFeatureRaw, makeDrawReadCtx } from '../../editor-v2/viewpoint/ir/irReadCtx';
import { orderFields, resolveFormSpec } from '../../editor-v2/viewpoint/ir/formHosts';
import { appendValue, clearValue, setValue, type WriteResult } from '../../editor-v2/viewpoint/ir/formWrite';
import { featureAccessIn, isLockedValue, offerForProfile, type ProfileReads } from '../../editor-v2/viewpoint/ir/formPermissions';
import { collectFormDiagnostics, worstSeverity, type FieldDiagnostic } from '../../editor-v2/viewpoint/ir/formDiagnostics';
import { groupTargets, type FormFieldOptionGroup } from '../../editor-v2/viewpoint/ir/useFormWidgets';
import { assignableOptions } from '../../editor-v2/viewpoint/ir/slotValues';
import ReferencePicker from '../../editor-v2/viewpoint/ir/widgets/ReferencePicker';
import { computeListStyle } from '../../editor-v2/components/InlineObjectSelect';
import { useNodeProblems } from '../../editor-v2/problems/useNodeProblems';
import { makeShapeCtx } from '../../editor-v2/hooks/shapeAdapter';
import { makeWriteCtx } from '../../editor-v2/hooks/writeCtxLproxy';
import { childSlotCount } from '../../editor-v2/hooks/createAdapter';
import { childrenIn, navStepOf, pathTo } from '../../editor-v2/hooks/multiDraw';
import {
    addChildReason,
    backOf,
    breadcrumbOf,
    crumbLabel,
    currentOf,
    depthOf,
    drillInto,
    hasRowMenu,
    multiplicity,
    navFor,
    newInstanceReason,
    refSlotControls,
    rendersInline,
    survivorOf,
    targetOptions,
    truncateTo,
} from '../../../jjform';
import { DATA_MANAGER_VIEWPOINT_ID, store, U } from '../../../joiner';
import { instanceCountsByClass } from './instanceManagerModel';
import { referenceSummary, tableRow, type SummaryItem } from './instanceTable';
import type { ClassShape, Crumb, NavState, RefRowAction, RefShape, RefSlotControls, RefSlotRow } from '../../../jjform';

/** A type's permission for the viewer: the three values of `EnvPermission` (#157),
 *  restated so this component does not depend on the environment module. */
export type DetailPermission = 'edit' | 'read' | 'hidden';

/** Why a create is not offered when the viewer's profile forbids it. */
const NOT_EDITABLE = 'Not editable with this profile';

export interface InstanceDetailProps {
    /** The model the instance belongs to. */
    modelid: string;
    /** The instance the panel is opened on: the root of the navigation. */
    subjectId: string;
    /** Where the form has drilled to; null while it sits on `subjectId`. Host state. */
    nav: NavState | null;
    setNav: React.Dispatch<React.SetStateAction<NavState | null>>;
    /** The element the panel scrolls in, for Back's scroll restore. Host layout. */
    scrollRef: React.RefObject<HTMLElement | null>;
    /** Delete an instance (the host opens its confirmation). Absent: no Delete. */
    openDelete?: (instanceId: string) => void;
    /** Create `cls` in `ownerId.childKey`, or at root when both are null. Absent: no «Add». */
    onCreate?: (cls: string, ownerId: string | null, childKey: string | null) => void;
    /** Create `targetCls` at root and link it from `sourceId.refKey`. Absent: no «New … & link». */
    onCreateAndLink?: (targetCls: string, sourceId: string, refKey: string) => void;
    /** The viewer's permission on a metaclass, by DClass id. Absent: everything `edit`. */
    permissionOf?: (classId: string) => DetailPermission;
}

/** One non-containment reference slot of an instance, as the detail lists it (#142, and
 *  since #172 the reference's one rendering, R-REF-1): its rows with their gestures, what
 *  its foot may link, and why «New … & link» is not offered when it is not. */
type RefSlot = {
    ref: RefShape;
    /** What the heading prints: the view's label for the feature, else its name. */
    label: string;
    /** The rows and the foot's link, by the rule of `jjform/refSlot` (R-REF-3, R-REF-4). */
    controls: RefSlotControls;
    count: number;
    createReason: string | null;
    /** R-REF-6: hidden by the view author. It keeps the section it had before #172:
     *  rows that open, «New … & link», no other gesture and no diagnostic. */
    authorHidden: boolean;
    /** #158 P4 — the key fields of each target, by target id (`referenceSummary`). */
    summaries: Record<string, SummaryItem[]>;
};

/** Shown when the host refuses a write without saying why, as `IRFormField` words it. */
const UNSTATED_REFUSAL = 'The model refused this change';

/** How long the box of a row's menu stays as a shield after an item acts (R-REF-6). */
const MENU_SHIELD_MS = 300;

/** The items of a row's menu (R-REF-3), in the words and with the glyphs they are drawn with. */
const ROW_ACTION: Record<RefRowAction, { text: string; icon: string }> = {
    open: { text: 'Open', icon: 'bi-box-arrow-in-right' },
    change: { text: 'Change…', icon: 'bi-arrow-left-right' },
    remove: { text: 'Remove from the list', icon: 'bi-x' },
};

/** The raw `values` of a reference slot, holes included (R-FORM-7), off a D lookup. */
function rawRefValues(idlookup: Record<string, any> | null | undefined, objectId: string, key: string): unknown[] {
    const values = idlookup ? findFeatureRaw(idlookup, objectId, key)?.values : null;
    return Array.isArray(values) ? values : [];
}

/**
 * The rule of `jjform/refSlot` asked of a D lookup: at render, and again by every handler
 * at its click, on the store as it is then (R-REF-4). A value is locked as the form locked
 * it (#157 step B): an element of a non-`edit` class held in a slot that re-fathers.
 */
function ruleRefSlot(
    idlookup: Record<string, any> | null | undefined,
    objectId: string,
    ref: RefShape,
    sourceEditable: boolean,
    profileReads: ProfileReads | undefined,
): RefSlotControls {
    const access = profileReads ? featureAccessIn(idlookup, objectId, ref.key) : undefined;
    return refSlotControls(ref, rawRefValues(idlookup, objectId, ref.key), {
        resolves: id => idlookup?.[id]?.className === 'DObject',
        sourceEditable,
        isLocked: profileReads ? id => isLockedValue(id, access, profileReads) : undefined,
    });
}

/**
 * The menu of one row of a reference section (R-REF-3): Open, and Change or Remove from
 * the list by the kind of the slot. Opened by the row's button and by nothing else.
 *
 * A portal on `document.body`, as `ReferencePicker` is and for the reason measured on
 * 2026-10-12: inside the pane a menu under the last row is cut where the section ends a
 * scrolled pane (61 of 96 px). The vertical axis, the flip and the stacking are
 * `computeListStyle`'s, imported and not re-derived; the horizontal one is the button's
 * right edge, because that function clamps `left` against a width narrower than this menu.
 *
 * It closes on a `mousedown` outside, on a scroll or a resize (its place is computed
 * once), on Escape and on Tab, which give the focus back to the button.
 */
function RefRowMenu({ id, label, anchor, opener, actions, onAct, onClose }: {
    id: string;
    label: string;
    /** The rect of the button that opened it. */
    anchor: DOMRect;
    /** That button: a `mousedown` on it is its own toggle, not an outside click. */
    opener: HTMLElement;
    actions: RefRowAction[];
    /** An item was chosen; `box` is where the menu stood (the shield takes its place). */
    onAct: (action: RefRowAction, box: DOMRect) => void;
    /** Closed without a choice; `refocus` when the keyboard closed it. */
    onClose: (refocus: boolean) => void;
}) {
    const boxRef = useRef<HTMLDivElement>(null);
    const items = () => Array.from(boxRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    // The listeners below are mounted once per menu; they call the close of the last render.
    const closeRef = useRef(onClose);
    closeRef.current = onClose;

    useLayoutEffect(() => { items()[0]?.focus(); }, []);

    useEffect(() => {
        const inside = (t: EventTarget | null) => !!boxRef.current?.contains(t as Node);
        const onDown = (e: MouseEvent) => {
            if (inside(e.target) || opener.contains(e.target as Node)) return;
            closeRef.current(false);
        };
        const onScroll = (e: Event) => { if (!inside(e.target)) closeRef.current(false); };
        const onResize = () => closeRef.current(false);
        // `mousedown` in capture, as `ReferencePicker` listens: before anything under it acts.
        document.addEventListener('mousedown', onDown, true);
        window.addEventListener('resize', onResize);
        // The scroll listener starts one frame late. A scroll that happened BEFORE the menu
        // opened is announced with the frame that paints the menu, and is no reason to close
        // it: measured 2026-10-12, a menu opened right after its button had been scrolled
        // into view was added and removed in the same frame.
        const frame = requestAnimationFrame(() => window.addEventListener('scroll', onScroll, true));
        return () => {
            cancelAnimationFrame(frame);
            document.removeEventListener('mousedown', onDown, true);
            window.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('resize', onResize);
        };
    }, [opener]);

    const onKeyDown = (e: React.KeyboardEvent) => {
        const all = items();
        const at = all.indexOf(document.activeElement as HTMLElement);
        switch (e.key) {
            case 'ArrowDown': e.preventDefault(); all[(at + 1) % all.length]?.focus(); break;
            case 'ArrowUp': e.preventDefault(); all[(at - 1 + all.length) % all.length]?.focus(); break;
            case 'Escape':
            case 'Tab': e.preventDefault(); onClose(true); break;
            default: break;
        }
    };

    return createPortal(
        <div
            ref={boxRef}
            id={id}
            className="instance-manager__ref-menu"
            role="menu"
            aria-label={label}
            style={{ ...computeListStyle(anchor), left: 'auto', right: Math.max(8, window.innerWidth - anchor.right) }}
            onKeyDown={onKeyDown}
        >
            {actions.map(action => (
                <button
                    type="button"
                    role="menuitem"
                    tabIndex={-1}
                    className="instance-manager__outline-menu-item instance-manager__ref-menu-item"
                    key={action}
                    onClick={() => { if (boxRef.current) onAct(action, boxRef.current.getBoundingClientRect()); }}
                >
                    <i className={`bi ${ROW_ACTION[action].icon}`} aria-hidden="true" />
                    {ROW_ACTION[action].text}
                </button>
            ))}
        </div>,
        document.body,
    );
}

/**
 * What stays where a row's menu stood, for `MENU_SHIELD_MS` after one of its items acted
 * (R-REF-6). An item closes the menu before it acts, so the second click of a double
 * click would reach what is under it, and under the last row of a section that is
 * «New … & link», which the stand-alone creates at once. The shield takes that click.
 *
 * The `mousedown` is stopped at the window, in capture: the picker «Change…» has just
 * opened listens on the document, and would read the same click as one outside itself.
 */
function MenuShield({ rect, onDone }: { rect: DOMRect; onDone: () => void }) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const swallow = (e: Event) => {
            if (e.target !== ref.current) return;
            e.stopPropagation();
            e.preventDefault();
        };
        window.addEventListener('mousedown', swallow, true);
        const timer = window.setTimeout(onDone, MENU_SHIELD_MS);
        return () => {
            window.removeEventListener('mousedown', swallow, true);
            window.clearTimeout(timer);
        };
        // Mounted once per shield: the timer is not restarted by a render of the section.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return createPortal(
        <div
            ref={ref}
            aria-hidden="true"
            style={{ position: 'fixed', left: rect.left, top: rect.top, width: rect.width, height: rect.height, zIndex: 10001 }}
        />,
        document.body,
    );
}

/** The row whose menu is open: what it showed when it opened, and where. */
type OpenMenu = {
    slot: RefSlot;
    index: number;
    value: string;
    name: string;
    actions: RefRowAction[];
    anchor: DOMRect;
    /** The row's rect: the picker of «Change…» opens against the card it changes. */
    rowRect: DOMRect;
    button: HTMLElement;
};

/** The open picker: a row's «Change…» (`at` is its raw index) or the foot's «Link existing». */
type OpenPicker = {
    slot: RefSlot;
    at: number | 'link';
    value: string;
    anchor: DOMRect;
    options: FormFieldOptionGroup[];
    allowNone: boolean;
    returnTo: HTMLElement;
};

/**
 * The reference sections of ONE form (#142), extracted by #158 P3 so the subject and
 * each inline child render the same thing: the same markup, the same drill-in, the same
 * create-and-link. Two copies would be two sections that drift at the first change.
 *
 * Since #172 the section is the reference's ONE rendering (R-REF-1), and it does what the
 * form field did. A row opens its target on a click, as before, and carries its other
 * gestures in a menu (R-REF-3). The foot links an existing target and creates a new one.
 * The heading says what the field's label said: required, read-only, derived, modified,
 * and under it the host's refusal of the last write or the feature's first diagnostic.
 * Every write goes through `formWrite` at the row's RAW index, after the slot has been
 * read again from the store (`liveOf`, R-REF-4).
 *
 * `nested` is the inline child's variant: it sits inside the child's frame, under the
 * child's own form, so it drops the band (rule and padding) that separates the
 * subject's section from the fields above it.
 *
 * `isHidden` (#157): a target of a type the profile hides is not listed. It used to stay
 * listed, locked, because the form's own chips named it; since step B the form does not
 * (`IRForm` takes `permissionOf`), and neither does this section. `onCreate` absent: no
 * create control at all.
 */
function RefSlotsSection({ objectId, slots, idlookup, nested, onOpen, onCreate, isHidden, liveOf, offerOf }: {
    /** The instance these slots belong to: the address of every write of the section. */
    objectId: string;
    slots: RefSlot[];
    idlookup: Record<string, any>;
    nested?: boolean;
    /** Open a target as the form body. */
    onOpen: (targetId: string, refKey: string) => void;
    /** «New <Target> & link» on this form's instance. */
    onCreate?: (targetCls: string, refKey: string) => void;
    isHidden?: (targetId: string) => boolean;
    /** The slot as the store holds it at the moment it is asked. */
    liveOf: (ref: RefShape) => RefSlotControls;
    /** The candidates of a reference, asked when a picker opens (S5). */
    offerOf: (refKey: string) => FormFieldOptionGroup[];
}) {
    const menuId = useId();
    const problems = useNodeProblems(objectId);
    const diagnostics = useMemo(
        () => collectFormDiagnostics(problems, new Set(slots.filter(s => !s.authorHidden).map(s => s.ref.key))),
        [problems, slots],
    );

    const [menu, setMenu] = useState<OpenMenu | null>(null);
    const [shield, setShield] = useState<DOMRect | null>(null);
    const [picker, setPicker] = useState<OpenPicker | null>(null);
    /** The host's refusal of the last write, by reference key; cleared by the next accepted one. */
    const [refusals, setRefusals] = useState<Record<string, string>>({});
    /** The references written since the last save, as `IRForm` keeps its dirty fields. */
    const [dirty, setDirty] = useState<Set<string>>(() => new Set());
    const projectModified = (U as any).isProjectModified;
    useEffect(() => {
        if (!projectModified) setDirty(prev => (prev.size ? new Set() : prev));
    }, [projectModified]);
    // Another instance: what was open, refused or modified belonged to the previous one.
    useEffect(() => {
        setMenu(null);
        setShield(null);
        setPicker(null);
        setRefusals({});
        setDirty(new Set());
    }, [objectId]);

    if (slots.length === 0) return null;

    /** One verdict, read in one place: `ok` decides the message, `changed` the dirty mark. */
    const consume = (key: string, r: WriteResult) => {
        setRefusals(prev => {
            if (!r.ok) return { ...prev, [key]: r.reason ?? UNSTATED_REFUSAL };
            if (!(key in prev)) return prev;
            const next = { ...prev };
            delete next[key];
            return next;
        });
        if (r.changed) setDirty(prev => (prev.has(key) ? prev : new Set(prev).add(key)));
    };

    const toggleMenu = (slot: RefSlot, row: RefSlotRow, name: string, button: HTMLElement) => {
        if (menu && menu.slot.ref.key === slot.ref.key && menu.index === row.index) {
            setMenu(null);
            return;
        }
        setPicker(null);
        setMenu({
            slot, index: row.index, value: row.value, name, actions: row.actions,
            anchor: button.getBoundingClientRect(),
            rowRect: (button.closest('.instance-manager__ref-row') ?? button).getBoundingClientRect(),
            button,
        });
    };

    /** An item of the open menu. The menu closes first; the row is read again from the
     *  store, and a gesture it no longer offers there does nothing. */
    const act = (action: RefRowAction, box: DOMRect) => {
        const m = menu;
        if (!m) return;
        setMenu(null);
        setShield(box);
        const key = m.slot.ref.key;
        const live = liveOf(m.slot.ref);
        const row = live.rows.find(r => r.index === m.index && r.value === m.value);
        if (!row?.actions.includes(action)) return;
        if (action === 'open') onOpen(m.value, key);
        else if (action === 'remove') consume(key, clearValue(objectId, key, m.index, true));
        else {
            setPicker({
                slot: m.slot, at: m.index, value: m.value, anchor: m.rowRect,
                options: offerOf(key), allowNone: live.allowNone, returnTo: m.button,
            });
        }
    };

    /** «Link existing <Type>». On a list the targets it already holds are not offered: a
     *  multi-valued reference is a set (`assignableOptions`, the rule of `ListWidget`). */
    const openLink = (slot: RefSlot, button: HTMLElement) => {
        const live = liveOf(slot.ref);
        if (live.link === null) return;
        const offered = offerOf(slot.ref.key);
        setMenu(null);
        setPicker({
            slot, at: 'link', value: '', anchor: button.getBoundingClientRect(),
            options: live.link === 'append' ? assignableOptions(offered, live.rows.map(r => r.value)) : offered,
            allowNone: false, returnTo: button,
        });
    };

    const pick = (id: string) => {
        const p = picker;
        if (!p) return;
        const key = p.slot.ref.key;
        const live = liveOf(p.slot.ref);
        if (p.at === 'link') {
            if (live.link === 'append') {
                if (!live.rows.some(r => r.value === id)) consume(key, appendValue(objectId, key, id, true));
            } else if (live.link !== null) {
                consume(key, setValue(objectId, key, live.link, id, true));
            }
            return;
        }
        const row = live.rows.find(r => r.index === p.at && r.value === p.value);
        if (row?.actions.includes('change')) consume(key, setValue(objectId, key, p.at, id, true));
    };

    /** «(none)» of the picker of «Change…»: the write of Remove, at the same index. */
    const pickNone = () => {
        const p = picker;
        if (!p || p.at === 'link') return;
        const key = p.slot.ref.key;
        const row = liveOf(p.slot.ref).rows.find(r => r.index === p.at && r.value === p.value);
        if (row?.actions.includes('remove')) consume(key, clearValue(objectId, key, p.at, true));
    };

    const closePicker = () => {
        const p = picker;
        setPicker(null);
        if (p?.returnTo.isConnected) p.returnTo.focus();
    };

    return (
        <div className={'instance-manager__inline instance-manager__refs'
            + (nested ? ' instance-manager__refs--nested' : '')}>
            {slots.map(slot => {
                const key = slot.ref.key;
                const refusal = refusals[key];
                const found: FieldDiagnostic[] = slot.authorHidden ? [] : (diagnostics.byField.get(key) ?? []);
                // The refusal goes first, as in a field: it is about the edit just made.
                const shown: FieldDiagnostic[] = refusal ? [{ severity: 'error', message: refusal }, ...found] : found;
                const worst = worstSeverity(shown);
                return (
                <div className="instance-manager__inline-slot" key={key} data-ref={key}>
                    <h3 className="instance-manager__eyebrow">
                        {slot.label}
                        {slot.ref.required && (
                            <span className="instance-manager__ref-required" title="Required" aria-hidden="true" />
                        )}
                        {slot.ref.readOnly && (
                            <i className="bi bi-lock-fill instance-manager__ref-lock" title="Read-only" aria-hidden="true" />
                        )}
                        {dirty.has(key) && (
                            <span className="instance-manager__ref-dirty" title="Modified, not saved" aria-hidden="true" />
                        )}
                        {/* R-REF-6: the multiplicity is the chip's tooltip, not a printed label. */}
                        <span className="instance-manager__draft-card" title={multiplicity(slot.ref)}>
                            {slot.ref.of} [{slot.count}/{slot.ref.upper === -1 ? '*' : slot.ref.upper}]
                        </span>
                        {slot.ref.derived && <span className="instance-manager__ref-derived">derived</span>}
                    </h3>
                    {worst && (
                        <p
                            className={`instance-manager__ref-diag instance-manager__ref-diag--${worst}`}
                            role="alert"
                            data-severity={worst}
                        >
                            <i
                                className={`bi ${worst === 'error' ? 'bi-x-circle-fill' : 'bi-exclamation-triangle-fill'}`}
                                aria-hidden="true"
                            />
                            {shown[0].message}
                        </p>
                    )}
                    {slot.controls.rows.map(row => {
                        // #157 step B: not named at all, see the comment above.
                        if (!row.broken && isHidden?.(row.value)) return null;
                        const targetId = row.value;
                        const label = row.broken
                            ? targetId
                            : crumbLabel(navStepOf(idlookup, targetId) ?? { id: targetId, name: '', cls: slot.ref.of, childKey: null });
                        const summary = slot.summaries[targetId] ?? [];
                        const summaryText = summary.map(s => `${s.label}: ${s.text}`).join(' · ');
                        const menuOpen = !!menu && menu.slot.ref.key === key && menu.index === row.index;
                        return (
                            /* Keyed by the RAW index: a slot may hold the same target twice. */
                            <div className="instance-manager__ref-row" key={row.index}>
                                {row.broken ? (
                                    /* A pointer that does not resolve: the card, and not a link
                                       (the look of `&__ref-link--hidden`: no pointer, muted). */
                                    <span
                                        className="instance-manager__inline-link instance-manager__ref-link instance-manager__ref-link--hidden"
                                        title={`Dangling pointer: ${targetId}`}
                                    >
                                        <span className="instance-manager__ref-text">
                                            <span className="instance-manager__ref-name">{label}</span>
                                        </span>
                                        <i className="bi bi-exclamation-triangle" aria-hidden="true" />
                                    </span>
                                ) : (
                            <button
                                type="button"
                                className="instance-manager__inline-link instance-manager__ref-link"
                                title={'Open the referenced element — edits the shared instance'
                                    + (summaryText ? '\n' + summaryText : '')}
                                onClick={() => onOpen(targetId, slot.ref.key)}
                            >
                                {/* #158 P4 — the name, and under it what the target IS:
                                    its key fields, so telling D01 from D05 does not take
                                    opening both. Inside the button: the whole card opens
                                    the element, as the name alone did. */}
                                <span className="instance-manager__ref-text">
                                    <span className="instance-manager__ref-name">{label}</span>
                                    {summary.length > 0 && (
                                        <span className="instance-manager__ref-summary">
                                            {summary.map(s => (
                                                <span className="instance-manager__ref-summary-item" key={s.key}>
                                                    <span className="instance-manager__ref-summary-key">{s.label}</span>
                                                    {s.text}
                                                </span>
                                            ))}
                                        </span>
                                    )}
                                </span>
                                <i className="bi bi-box-arrow-in-right" aria-hidden="true" />
                            </button>
                                )}
                                {/* R-REF-3: the row's other gestures. Absent on a row that can
                                    only be opened: no button that opens a one-item menu. */}
                                {hasRowMenu(row) && (
                                    <button
                                        type="button"
                                        className="instance-manager__ref-menu-btn"
                                        aria-haspopup="menu"
                                        aria-expanded={menuOpen}
                                        aria-controls={menuOpen ? menuId : undefined}
                                        aria-label={`Actions for ${label}`}
                                        title="Actions"
                                        onClick={e => toggleMenu(slot, row, label, e.currentTarget)}
                                    >
                                        <i className="bi bi-three-dots-vertical" aria-hidden="true" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    {slot.controls.rows.length === 0 && (
                        <p className="instance-manager__note">No {slot.ref.of} linked yet.</p>
                    )}
                    {(slot.controls.link !== null || onCreate) && (
                        <div className="instance-manager__ref-foot">
                            {slot.controls.link !== null && (
                                <button
                                    type="button"
                                    className="instance-manager__ref-pick"
                                    aria-label={`Link existing ${slot.ref.of} to ${slot.label}`}
                                    onClick={e => openLink(slot, e.currentTarget)}
                                >
                                    <i className="bi bi-link-45deg" aria-hidden="true" />
                                    Link existing {slot.ref.of}
                                </button>
                            )}
                    {onCreate && (slot.createReason ? (
                        <span className="instance-manager__child-reason" title={slot.createReason}>
                            {slot.createReason}
                        </span>
                    ) : (
                        <button
                            type="button"
                            className="instance-manager__add"
                            onClick={() => onCreate(slot.ref.of, slot.ref.key)}
                        >
                            <i className="bi bi-plus" aria-hidden="true" />
                            New {slot.ref.of} &amp; link
                        </button>
                    ))}
                        </div>
                    )}
                </div>
                );
            })}
            {menu && (
                <RefRowMenu
                    id={menuId}
                    label={`${menu.slot.label}: ${menu.name}`}
                    anchor={menu.anchor}
                    opener={menu.button}
                    actions={menu.actions}
                    onAct={act}
                    onClose={refocus => {
                        const button = menu.button;
                        setMenu(null);
                        if (refocus && button.isConnected) button.focus();
                    }}
                />
            )}
            {shield && <MenuShield rect={shield} onDone={() => setShield(null)} />}
            {picker && (
                <ReferencePicker
                    anchor={picker.anchor}
                    options={picker.options}
                    value={picker.value}
                    allowNone={picker.allowNone}
                    typeName={picker.slot.ref.of}
                    onPick={pick}
                    onClear={pickNone}
                    onClose={closePicker}
                />
            )}
        </div>
    );
}

/** The soft gate of a read-only form (#157, D1): the form renders and takes no input.
 *  A wrapper and not a second `<IRForm>` in a ternary, so each form is written once. */
function ReadOnlyGate({ readOnly, children }: { readOnly: boolean; children: React.ReactNode }) {
    if (!readOnly) return <>{children}</>;
    return (
        <div className="instance-manager__ro" aria-disabled="true">
            <p className="instance-manager__ro-note">
                <i className="bi bi-eye" aria-hidden="true" />
                Read only for this profile
            </p>
            <div className="instance-manager__ro-body">{children}</div>
        </div>
    );
}

export function InstanceDetail({
    modelid, subjectId, nav, setNav, scrollRef,
    openDelete, onCreate, onCreateAndLink, permissionOf,
}: InstanceDetailProps) {
    const idlookup = useSelector((state: any) => state?.idlookup);

    /** The shape port, rebuilt when the lookup changes identity (as in the tab). */
    const shapeCtx = useMemo(() => makeShapeCtx(modelid), [modelid, idlookup]);

    /** The Data Manager viewpoint's index (R-DMV-1): the views the summaries read. The
     *  same selector the tab uses for its columns, and just as stable. */
    const irIndex = useSelector((state: any) => getIRIndex(
        state,
        computeIRSignature(state, DATA_MANAGER_VIEWPOINT_ID),
        DATA_MANAGER_VIEWPOINT_ID,
    ));

    /** Instances per metaclass NAME — what `newInstanceReason` reads for the singleton. */
    const countsByName = useMemo(() => {
        const byId = instanceCountsByClass(idlookup, modelid);
        const out: Record<string, number> = {};
        for (const cls of Object.values(shapeCtx.shape().classes)) out[cls.key] = byId[cls.id] ?? 0;
        return out;
    }, [idlookup, modelid, shapeCtx]);

    // ── Permissions (#157) ─────────────────────────────────────────────────────
    const permOfClass = (classId: string | null | undefined): DetailPermission =>
        (permissionOf && classId ? permissionOf(classId) : 'edit');
    const permOfInstance = (id: string | null | undefined): DetailPermission =>
        permOfClass(id ? idlookup?.[id]?.instanceof : null);
    const permOfClassName = (name: string): DetailPermission =>
        permOfClass(shapeCtx.shape().classes[name]?.id);

    /** The profile's reads for the reference sections (#157 step B), built as `IRForm`
     *  builds its own and asked of the store at the moment of use: which class an
     *  instance has, and whether it sits at the model's root. Undefined without a profile. */
    const profileReads: ProfileReads | undefined = useMemo(() => {
        if (!permissionOf) return undefined;
        const lookup = () => (store.getState() as any)?.idlookup ?? {};
        return {
            permissionOf,
            classOf: (id: string) => lookup()[id]?.instanceof ?? null,
            isBound: (id: string) => {
                const l = lookup();
                const father = l[id]?.father;
                return !father || l[father]?.className !== 'DModel';
            },
        };
    }, [permissionOf]);

    /** The host's write contract, for its OFFER only (S5): the sections write through
     *  `formWrite` by `(instance, feature)`, as the form's fields do. */
    const writeCtx = useMemo(() => makeWriteCtx(), []);

    /** R-REF-4: a reference slot as the store holds it NOW. Every handler of a section
     *  asks it at its click; the render's own answer may be a store update behind. */
    const liveSlot = (objectId: string, ref: RefShape): RefSlotControls => {
        const lookup = (store.getState() as any)?.idlookup ?? {};
        return ruleRefSlot(lookup, objectId, ref, permOfClass(lookup[objectId]?.instanceof) === 'edit', profileReads);
    };

    /** The candidates of a reference, asked when its picker opens and filtered for the
     *  profile exactly as the form filtered its own (`offerForProfile`). */
    const offerFor = (objectId: string, key: string): FormFieldOptionGroup[] => {
        const offered = targetOptions(writeCtx, objectId, key);
        if (!profileReads) return groupTargets(offered);
        const access = featureAccessIn((store.getState() as any)?.idlookup, objectId, key);
        return groupTargets(offerForProfile(offered, access, profileReads));
    };

    // ── Drill-in (12c) ─────────────────────────────────────────────────────────

    /** The instance the form body is showing: the drilled-into child when a
     *  navigation is open, the selected row otherwise. ONE form, whose body is
     *  replaced — the design's own words — so this is an id swap and not a second
     *  mounted form. Resolved against the store so a drilled-into child that was
     *  deleted falls back to the subject instead of showing a dead object. */
    const formSubjectId: string | null = useMemo(() => {
        if (!nav) return subjectId;
        const cur = currentOf(nav);
        if (cur && idlookup?.[cur.id]?.className === 'DObject') return cur.id;
        return subjectId;
    }, [nav, subjectId, idlookup]);

    /** How deep the form has drilled. It is what decides inline vs link. */
    const formDepth = nav ? depthOf(nav) : 0;

    const crumbs: Crumb[] = useMemo(() => (nav ? breadcrumbOf(nav) : []), [nav]);

    /** #158 P1 — the form pane is the scroll container, and a drill-in is usually
     *  started from a link far down the form (the reference list sits under every
     *  field). Going back must land where the user left, not at the top of a long
     *  form: that is what «back to the list» means. One scroll offset per DEPTH,
     *  written when the form leaves that depth, read when it returns to it. A ref and
     *  not state: it is bookkeeping for the next layout, never something to render. */
    const navScrollRef = useRef<number[]>([]);
    const pendingScrollRef = useRef<number | null>(null);

    /** Drill into a contained child. The road is seeded from the SUBJECT's own
     *  position, not from the model root, so the breadcrumb starts where the form
     *  started and does not print ancestors the user never navigated through.
     *
     *  `via` (#158 P3): the inline child a reference link belongs to. Its step goes on
     *  the road first, so opening Antonio from Phase_0's `learners` reads
     *  «ElenaScenario › Phase_0 › Antonio» — the way the user actually came. It goes on
     *  as a PASS-THROUGH step (#158, field test 2026-09-29): Phase_0 was shown inside
     *  ElenaScenario's form, never as a form of its own, so Back from Antonio lands on
     *  ElenaScenario (`backOf`); its breadcrumb segment still opens Phase_0.
     *
     *  A target of a type the profile hides does not open (#157). */
    const drillTo = (childId: string, childKey: string, via?: { id: string; key: string }) => {
        if (permOfInstance(childId) === 'hidden') return;
        const step = navStepOf(idlookup, childId, childKey);
        if (!step) return;
        navScrollRef.current[formDepth] = scrollRef.current?.scrollTop ?? 0;
        pendingScrollRef.current = 0;
        let from = nav;
        if (!from) {
            const root = subjectId ? navStepOf(idlookup, subjectId) : null;
            if (!root) return;
            from = navFor(root);
        }
        const viaStep = via ? navStepOf(idlookup, via.id, via.key) : null;
        if (viaStep) from = drillInto(from, { ...viaStep, passThrough: true });
        setNav(drillInto(from, step));
    };

    /** Where a return to `depth` lands: the offset saved when the form left it. */
    const restoreScrollFor = (depth: number) => {
        pendingScrollRef.current = navScrollRef.current[depth] ?? 0;
    };

    /** #158 P1 — «Back»: to the previous form on screen, with the pure `backOf` of the
     *  breadcrumb module — up one level, past pass-through steps (#158, 2026-09-29). The
     *  breadcrumb stays: it jumps anywhere on the road, Back is the one-step gesture
     *  every list-to-detail screen offers. */
    const goBack = () => {
        if (!nav) return;
        const next = backOf(nav);
        restoreScrollFor(depthOf(next));
        setNav(next);
    };

    /** #173 — the element on screen can die under the form: the header's Delete deletes
     *  it, and a cascade can take it too. The deletes land a tick after the confirmation
     *  (`deleteAdapter` defers them), so the road is healed from the store and not from
     *  the click: back to the form the user had on screen before (`survivorOf`), at the
     *  offset it had. Declared before the scroll effect below, which applies that offset
     *  in the same commit — `formSubjectId` has just fallen back to the subject. */
    useLayoutEffect(() => {
        if (!nav) return;
        const next = survivorOf(nav, id => idlookup?.[id]?.className === 'DObject');
        if (next === nav) return;
        if (next) restoreScrollFor(depthOf(next));
        setNav(next);
    }, [nav, idlookup]);

    /** Applied before paint, so the form never shows one frame at the old offset. */
    useLayoutEffect(() => {
        const top = pendingScrollRef.current;
        if (top === null) return;
        pendingScrollRef.current = null;
        if (scrollRef.current) scrollRef.current.scrollTop = top;
    }, [formSubjectId]);

    /** The contained children of the form's current subject, per child slot.
     *  Empty at depth >= INLINE_DEPTH_LIMIT: beyond the inline level the children
     *  render as drill-in links, which is the same list read by a different rule.
     *  A child of a type the profile hides is left out (#157). */
    const inlineChildren = useMemo(() => {
        if (!formSubjectId || !shapeCtx) return [] as Array<{ key: string; of: string; ids: string[] }>;
        const clsName = pathTo(idlookup, formSubjectId).slice(-1)[0]?.cls;
        const shape = clsName ? shapeCtx.shape().classes[clsName] : null;
        if (!shape) return [];
        return shape.children.map(c => ({
            key: c.key,
            of: c.of,
            ids: childrenIn(idlookup, formSubjectId, c.key).filter(id => permOfInstance(id) !== 'hidden'),
        })).filter(c => c.ids.length > 0);
    }, [idlookup, formSubjectId, shapeCtx, permissionOf]);

    // ── Create (2c) ────────────────────────────────────────────────────────────

    /** The `ClassShape` of the instance ON SCREEN — where its child slots come from. The
     *  drilled-into element during a drill-in, the selected row otherwise: the bar sits
     *  under that element's form, and a bar of the row's slots under D01's form created
     *  children in the row, past the cardinality of the slots on screen (#173). */
    const subjectShape: ClassShape | null = useMemo(() => {
        const ownerId = formSubjectId ?? subjectId;
        if (!ownerId) return null;
        const name = shapeCtx.classOf(ownerId);
        return name ? shapeCtx.shape().classes[name] ?? null : null;
    }, [shapeCtx, subjectId, formSubjectId]);

    /** One entry per child slot of the instance on screen: how full it is, and why
     *  Add is not offered when it is not — a full slot, by its upper bound, among them. */
    const childSlots = useMemo(() => {
        const ownerId = formSubjectId ?? subjectId;
        if (!ownerId || !subjectShape) return [] as Array<{ child: RefShape; count: number; reason: string | null }>;
        const shape = shapeCtx.shape();
        const ownerEditable = permOfInstance(ownerId) === 'edit';
        // #157 step B: a child slot typed by a hidden class is not listed, not even with
        // its reason: the reason would name the class.
        return subjectShape.children.filter(child => permOfClassName(child.of) !== 'hidden').map(child => {
            const count = childSlotCount(ownerId, child.key);
            // The third argument is the metaclass the slot is TYPED ON, and it is
            // what closes §2.6: without it the bar offered «Add Node» on an abstract
            // `Node` and the create produced a live instance of it. Resolved by name
            // through the shape, the same map `RefShape.of` keys into.
            const target = shape.classes[child.of];
            // #157: neither the owner nor the new child may be outside the profile's `edit`.
            const reason = !ownerEditable || permOfClassName(child.of) !== 'edit'
                ? NOT_EDITABLE
                : addChildReason(child, count, target);
            return { child, count, reason };
        });
    }, [subjectId, formSubjectId, subjectShape, shapeCtx, idlookup, permissionOf]);

    // ── Referenced elements (#142, #158 P3/P4) ─────────────────────────────────

    /** #158 P4 — the D-side read context the target's view predicate is evaluated
     *  with: the one the table's cells already come from (`tableRow`). */
    const summaryReadCtx = useMemo(() => makeDrawReadCtx(idlookup ?? {}), [idlookup]);

    /**
     * #158 P4 — the key fields of one referenced element.
     *
     * The target's CONCRETE class (an `ofId` may be abstract: `Goal` points at a
     * `CompetencyGoal`), its row as the table would print it, and the `FormSpec` of
     * its own view in the Data Manager's viewpoint — the one its form opens with
     * (`IRForm host="manager"`), through the same host override. Read only:
     * `resolveIRView` and `resolveFormSpec` are called here as `resolveTableSpec` is
     * in the tab, and nothing under `viewpoint/ir/` changes.
     */
    const summaryOf = (targetId: string): SummaryItem[] => {
        const shapeAll = shapeCtx.shape();
        const clsName = shapeCtx.classOf(targetId);
        const cls = clsName ? shapeAll.classes[clsName] ?? null : null;
        if (!cls) return [];
        const compiled = irIndex ? resolveIRView(targetId, cls.id, irIndex, summaryReadCtx, idlookup) : null;
        const form = resolveFormSpec(compiled?.formSpec ?? undefined, 'manager');
        return referenceSummary(cls, tableRow(idlookup, targetId, cls, shapeAll), form);
    };

    /**
     * The NON-containment reference slots of the form's CURRENT subject (#142).
     *
     * Sister of `inlineChildren`, and read the same way: keyed on `formSubjectId`
     * (not `subjectId`), so after a drill-in the references shown are the ones of
     * the element on screen, and the class comes from `pathTo(...).slice(-1)` for
     * the identical reason `inlineChildren` reads it there. It scans `shape.refs`
     * — the «reference selects» half of the shape — never `shape.children`, which
     * `inlineChildren` and `childSlots` already own.
     *
     * R-REF-1 (#172): EVERY reference the profile does not hide is listed, empty or
     * not, writable or not, because the section is the reference's one rendering: an
     * empty reference whose target cannot be created from here used to be reachable
     * from the form's field alone. The rows and what the foot links come from the rule
     * of `jjform/refSlot`, on the slot's RAW values. The order and the labels are the
     * form's (`FormSpec.order`, `labels`, through the Data Manager's view of the class).
     *
     * `createReason` gates the «New & link» button exactly as `childSlots`'s `reason`
     * gates «Add»: a read-only or derived reference, a full slot, or a target that
     * cannot be instantiated at root (`newInstanceReason`) leaves the reason and drops
     * the button.
     *
     * R-REF-6: a reference the view author HIDES keeps the section it had before
     * #172, listed only with targets or with a create offered, its rows opening and
     * nothing else.
     *
     * #158 P3 — the body is `refSlotsOf(id)`, for ANY instance, because the form shows
     * more than one: its subject and, at the inline level, each contained child with a
     * form of its own. #157 — a source or a target type outside the profile's `edit`
     * turns the create into its reason.
     */
    const refSlotsOf = (objectId: string): RefSlot[] => {
        const shapeAll = shapeCtx.shape();
        const clsName = pathTo(idlookup, objectId).slice(-1)[0]?.cls;
        const shape = clsName ? shapeAll.classes[clsName] : null;
        if (!shape) return [];
        const sourceEditable = permOfInstance(objectId) === 'edit';
        // The form spec of THIS instance, resolved as `summaryOf` resolves a target's.
        const compiled = irIndex ? resolveIRView(objectId, shape.id, irIndex, summaryReadCtx, idlookup) : null;
        const form = resolveFormSpec(compiled?.formSpec ?? undefined, 'manager');
        const slots = shape.refs.map(ref => {
            const authorHidden = !!form?.hidden?.includes(ref.key) || form?.features?.[ref.key] === 'hidden';
            const ruled = ruleRefSlot(idlookup, objectId, ref, sourceEditable, profileReads);
            const controls: RefSlotControls = authorHidden
                ? {
                    ...ruled,
                    rows: ruled.rows.filter(r => !r.broken).map(r => ({ ...r, actions: ['open'] as RefRowAction[] })),
                    link: null,
                }
                : ruled;
            const count = controls.rows.length;
            const full = ref.upper !== -1 && count >= ref.upper;
            let createReason: string | null;
            if (ref.readOnly || ref.derived) createReason = 'Read-only reference';
            else if (full) createReason = `Slot full [${count}/${ref.upper}]`;
            else if (!sourceEditable || permOfClassName(ref.of) !== 'edit') createReason = NOT_EDITABLE;
            else createReason = newInstanceReason(shapeAll.classes[ref.of], countsByName[ref.of] ?? 0);
            const summaries: Record<string, SummaryItem[]> = {};
            for (const row of controls.rows) if (!row.broken) summaries[row.value] = summaryOf(row.value);
            return { ref, label: form?.labels?.[ref.key] ?? ref.key, controls, count, createReason, authorHidden, summaries };
        })
            .filter(s => !s.authorHidden || s.controls.rows.length > 0 || s.createReason === null)
            // #157 step B: a reference typed by a hidden class is no section at all.
            .filter(s => permOfClassName(s.ref.of) !== 'hidden');
        return orderFields(slots.map(slot => ({ name: slot.ref.key, slot })), form).map(x => x.slot);
    };

    const refSlots = useMemo(
        () => (formSubjectId && shapeCtx ? refSlotsOf(formSubjectId) : [] as RefSlot[]),
        [idlookup, formSubjectId, shapeCtx, countsByName, irIndex, summaryReadCtx, permissionOf],
    );

    /** #158 P3 — the same sections for each inline child, by child id. Empty past the
     *  inline level: there the children are drill-in links, and a link carries no form
     *  to put a section under — the section appears once the child IS the form. */
    const inlineRefSlots = useMemo(() => {
        const out: Record<string, RefSlot[]> = {};
        if (!shapeCtx || !rendersInline(formDepth)) return out;
        for (const slot of inlineChildren) for (const id of slot.ids) out[id] = refSlotsOf(id);
        return out;
    }, [inlineChildren, formDepth, idlookup, shapeCtx, countsByName, irIndex, summaryReadCtx, permissionOf]);

    const isHidden = (id: string) => permOfInstance(id) === 'hidden';

    /** The header names the instance ON SCREEN — the drilled-into element during a
     *  drill-in, the selected row otherwise — by the naming rule the neighborhood uses
     *  too (`makeDrawReadCtx`, through `navStepOf`). Its Delete deletes that element,
     *  under that element's permission: a header naming the row over D01's form deleted
     *  the row (#173). */
    const subjectStep = navStepOf(idlookup, formSubjectId ?? subjectId);
    const canDelete = !!openDelete && permOfInstance(formSubjectId ?? subjectId) === 'edit';

    return (
        <>
            {/* The breadcrumb of 12c: «il breadcrumb tiene la strada del
                containment. Ogni segmento e' cliccabile». Present only once
                a drill-in has happened — a form sitting on its own subject
                has a road of one step, and printing it would be noise. */}
            {crumbs.length > 1 && (
                <nav className="instance-manager__crumbs" aria-label="Navigation path">
                    {/* #158 P1 — the one-step way back, ahead of the road it
                        walks. Named after where it lands, so the tooltip says
                        what the arrow alone cannot. */}
                    <button
                        type="button"
                        className="instance-manager__back"
                        title={`Back to ${crumbLabel(currentOf(backOf(nav!)) ?? crumbs[0])}`}
                        onClick={goBack}
                    >
                        <i className="bi bi-arrow-left" aria-hidden="true" />
                        Back
                    </button>
                    {crumbs.map(c => (
                        <span key={c.id + ':' + c.depth} className="instance-manager__crumb-wrap">
                            {c.isCurrent ? (
                                <span className="instance-manager__crumb instance-manager__crumb--current">
                                    {crumbLabel(c)}
                                </span>
                            ) : (
                                <button
                                    type="button"
                                    className="instance-manager__crumb"
                                    onClick={() => {
                                        restoreScrollFor(c.depth);
                                        setNav(prev => (prev ? truncateTo(prev, c.depth) : prev));
                                    }}
                                >
                                    {crumbLabel(c)}
                                </button>
                            )}
                            {!c.isCurrent && <i className="bi bi-chevron-right instance-manager__crumb-sep" aria-hidden="true" />}
                        </span>
                    ))}
                </nav>
            )}

            {/* L'header della form: chi si sta editando e la sola azione che
                un motore ce l'ha.

                SAVE E DISCARD NON CI SONO, ed e' una constatazione, non
                una dimenticanza: questa form scrive DIRITTO nello store
                (`formWrite.ts`, un commit per battuta, `U.isProjectModified`
                a true su ogni cambiamento reale). Non esiste un draft di
                edit da salvare ne' da annullare — l'unico draft del tab e'
                quello della CREATE (12a), che vive nella sua dialogue e ha
                gia' il suo Create/Cancel. Renderli qui vorrebbe dire o due
                bottoni inerti o un motore nuovo sul write path: il primo e'
                una bugia, il secondo e' un'altra slice. Punto aperto,
                dichiarato nel referto. */}
            <header className="instance-manager__form-head">
                <div className="instance-manager__form-title">
                    <span className="instance-manager__form-name">
                        {subjectStep?.name || <em className="instance-manager__unnamed">unnamed</em>}
                    </span>
                    {subjectStep?.cls && (
                        <span className="instance-manager__form-cls">{subjectStep.cls}</span>
                    )}
                    {/* «Unsaved changes» E' ANDATO VIA (deviazione A3,
                        ratificata e qui portata a termine). Il write e'
                        DIRETTO — `formWrite.ts`, un commit per battuta —
                        quindi non esiste un draft di edit da salvare, e
                        un badge che annuncia modifiche non salvate accanto
                        a una form che non ne tiene nessuna e' la meta'
                        superstite di un Save/Discard che questa slice non
                        costruisce. */}
                </div>
                {canDelete && openDelete && (
                    <div className="instance-manager__form-actions">
                        <button
                            type="button"
                            className="instance-manager__form-delete"
                            title={`Delete ${subjectStep?.name || (formSubjectId ?? subjectId)}`}
                            onClick={() => openDelete(formSubjectId ?? subjectId)}
                        >
                            <i className="bi bi-trash" aria-hidden="true" />
                            Delete
                        </button>
                    </div>
                )}
            </header>

            <ReadOnlyGate readOnly={permOfInstance(formSubjectId ?? subjectId) === 'read'}>
                <IRForm objectId={formSubjectId ?? subjectId} host="manager" permissionOf={permissionOf} />
            </ReadOnlyGate>

            {/* The depth rule of 12c, and it is ONE comparison:
                `rendersInline(formDepth)`. At depth 0 a contained child is
                edited INLINE, in its own form nested under the parent's; at
                depth 1 and beyond the same children render as links that
                drill in, replacing the body of this one form.

                The nesting is done HERE and not inside `IRFormField`, for
                the reason the children bar below already states: giving the
                form's own children group a second behaviour means threading
                a callback through `IRForm` -> `IRFormField` -> `ListWidget`,
                three components this panel HOSTS unchanged (2a) and that the
                canvas rail mounts too. Same seam, same reason. */}
            {inlineChildren.length > 0 && (
                <div className="instance-manager__inline">
                    {inlineChildren.map(slot => (
                        <div className="instance-manager__inline-slot" key={slot.key}>
                            <h3 className="instance-manager__eyebrow">
                                {slot.key}
                                <span className="instance-manager__draft-card">{slot.of}</span>
                            </h3>
                            {slot.ids.map(childId => (
                                rendersInline(formDepth) ? (
                                    <div className="instance-manager__inline-child" key={childId}>
                                        <button
                                            type="button"
                                            className="instance-manager__inline-open"
                                            title="Open this child as the form body"
                                            onClick={() => drillTo(childId, slot.key)}
                                        >
                                            {crumbLabel(navStepOf(idlookup, childId) ?? { id: childId, name: '', cls: slot.of, childKey: null })}
                                            <i className="bi bi-box-arrow-in-right" aria-hidden="true" />
                                        </button>
                                        <ReadOnlyGate readOnly={permOfInstance(childId) === 'read'}>
                                            <IRForm objectId={childId} host="manager" permissionOf={permissionOf} />
                                        </ReadOnlyGate>
                                        {/* #158 P3 — the child's own reference
                                            sections, under its own form and inside
                                            its frame: they are the child's, and the
                                            frame is what says so. Opening a target
                                            goes THROUGH the child (`via`). */}
                                        <RefSlotsSection
                                            objectId={childId}
                                            slots={inlineRefSlots[childId] ?? []}
                                            idlookup={idlookup}
                                            nested
                                            isHidden={isHidden}
                                            liveOf={ref => liveSlot(childId, ref)}
                                            offerOf={refKey => offerFor(childId, refKey)}
                                            onOpen={(targetId, refKey) => drillTo(targetId, refKey, { id: childId, key: slot.key })}
                                            onCreate={onCreateAndLink
                                                ? (targetCls, refKey) => onCreateAndLink(targetCls, childId, refKey)
                                                : undefined}
                                        />
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        className="instance-manager__inline-link"
                                        key={childId}
                                        onClick={() => drillTo(childId, slot.key)}
                                    >
                                        {crumbLabel(navStepOf(idlookup, childId) ?? { id: childId, name: '', cls: slot.of, childKey: null })}
                                        <i className="bi bi-chevron-right" aria-hidden="true" />
                                    </button>
                                )
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {/* Referenced elements (#142). The associations/compositions the
                subject POINTS AT — `shape.refs`, the «reference selects» half —
                each target openable in place and each slot able to create a new
                target and link it, WITHOUT the canvas edge workflow.

                Homogeneous with the containment drill-in above: the same
                `drillTo` / `NavState` / breadcrumb, targets rendered as drill-in
                LINKS (references fan out far more than containment, so the body
                swaps to the target rather than nesting a form per pointer). Drill
                replaces the body with the referenced element's OWN `IRForm`, which
                resolves the target metaclass's view — the customization is
                inherited by construction (`useIRFormView`), the same way it is for
                a contained child. A referenced target is SHARED: editing it edits
                the one instance everything points at, said in the link title. */}
            <RefSlotsSection
                objectId={formSubjectId ?? subjectId}
                slots={refSlots}
                idlookup={idlookup}
                isHidden={isHidden}
                liveOf={ref => liveSlot(formSubjectId ?? subjectId, ref)}
                offerOf={refKey => offerFor(formSubjectId ?? subjectId, refKey)}
                onOpen={(targetId, refKey) => drillTo(targetId, refKey)}
                onCreate={onCreateAndLink
                    ? (targetCls, refKey) => { if (formSubjectId) onCreateAndLink(targetCls, formSubjectId, refKey); }
                    : undefined}
            />

            {/* Route 2 of Turno 10: containment creates. One Add per child
                slot of the shape, gated by `upper`; when the slot is full
                the control is absent and the cardinality says why. The
                event is the same `create` the catalogue emits.

                A BAR BESIDE THE FORM, not an Add inside the form's own
                children group, for two measured reasons. `ListWidget`'s Add
                is a PICKER over existing elements (`onAppend`, then
                `ReferencePicker`), which is «reference selects» — the wrong
                gesture for a containment slot, whose whole rule is that it
                creates. And giving it a second, creating Add means threading
                a callback through `IRForm` → `IRFormField` → `ListWidget`,
                three components this panel HOSTS unchanged (2a) and that the
                canvas rail mounts too. The form lists the children; this
                bar is the create the module comment of `ListWidget` defers.

                10k punto 6 — l'eyebrow «Add contained» E' ANDATO VIA: la
                barra si legge come la coda della sezione CHILDREN che `IRForm`
                rende, e la CTA continua a nominare la metaclasse figlia. */}
            {onCreate && childSlots.length > 0 && (
                <div className="instance-manager__children">
                    <ul className="instance-manager__list">
                        {childSlots.map(({ child, count, reason }) => (
                            <li className="instance-manager__child" key={child.key}>
                                <span className="instance-manager__row-name">
                                    {child.key}
                                    <span className="instance-manager__draft-card">
                                        {child.of} [{count}/{child.upper === -1 ? '*' : child.upper}]
                                    </span>
                                </span>
                                {reason ? (
                                    <span className="instance-manager__child-reason" title={reason}>
                                        {reason}
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        className="instance-manager__add"
                                        onClick={() => onCreate(child.of, formSubjectId ?? subjectId, child.key)}
                                    >
                                        <i className="bi bi-plus" aria-hidden="true" />
                                        Add {child.of}
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </>
    );
}

export default InstanceDetail;
