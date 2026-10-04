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
 * created or deleted from it; `hidden` → the element is listed but does not open.
 * Absent (the Data Manager), everything is `edit`.
 */

import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import IRForm from '../../editor-v2/viewpoint/ir/IRForm';
import { computeIRSignature, getIRIndex, resolveIRView } from '../../editor-v2/viewpoint/ir/irResolveCore';
import { makeDrawReadCtx } from '../../editor-v2/viewpoint/ir/irReadCtx';
import { resolveFormSpec } from '../../editor-v2/viewpoint/ir/formHosts';
import { makeShapeCtx } from '../../editor-v2/hooks/shapeAdapter';
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
    navFor,
    newInstanceReason,
    rendersInline,
    survivorOf,
    truncateTo,
} from '../../../jjform';
import { DATA_MANAGER_VIEWPOINT_ID } from '../../../joiner';
import { instanceCountsByClass } from './instanceManagerModel';
import { referenceSummary, tableRow, type SummaryItem } from './instanceTable';
import type { ClassShape, Crumb, NavState, RefShape } from '../../../jjform';

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

/** One non-containment reference slot of an instance, as the form's reference
 *  section lists it (#142): what it points at, and why «New … & link» is not offered
 *  when it is not. */
type RefSlot = {
    ref: RefShape;
    targets: string[];
    count: number;
    createReason: string | null;
    /** #158 P4 — the key fields of each target, by target id (`referenceSummary`). */
    summaries: Record<string, SummaryItem[]>;
};

/**
 * The reference sections of ONE form (#142), extracted by #158 P3 so the subject and
 * each inline child render the same thing: the same markup, the same drill-in, the same
 * create-and-link. Two copies would be two sections that drift at the first change.
 *
 * `nested` is the inline child's variant: it sits inside the child's frame, under the
 * child's own form, so it drops the band (rule and padding) that separates the
 * subject's section from the fields above it.
 *
 * `isHidden` (#157): a target of a type the profile hides stays LISTED — the form's own
 * chips already name it, and a list that disagreed with them would read as a bug — but
 * it does not open and carries no summary. `onCreate` absent: no create control at all.
 */
function RefSlotsSection({ slots, idlookup, nested, onOpen, onCreate, isHidden }: {
    slots: RefSlot[];
    idlookup: Record<string, any>;
    nested?: boolean;
    /** Open a target as the form body. */
    onOpen: (targetId: string, refKey: string) => void;
    /** «New <Target> & link» on this form's instance. */
    onCreate?: (targetCls: string, refKey: string) => void;
    isHidden?: (targetId: string) => boolean;
}) {
    if (slots.length === 0) return null;
    return (
        <div className={'instance-manager__inline instance-manager__refs'
            + (nested ? ' instance-manager__refs--nested' : '')}>
            {slots.map(slot => (
                <div className="instance-manager__inline-slot" key={slot.ref.key}>
                    <h3 className="instance-manager__eyebrow">
                        {slot.ref.key}
                        <span className="instance-manager__draft-card">
                            {slot.ref.of} [{slot.count}/{slot.ref.upper === -1 ? '*' : slot.ref.upper}]
                        </span>
                    </h3>
                    {slot.targets.map(targetId => {
                        const label = crumbLabel(navStepOf(idlookup, targetId) ?? { id: targetId, name: '', cls: slot.ref.of, childKey: null });
                        if (isHidden?.(targetId)) {
                            return (
                                <span
                                    className="instance-manager__inline-link instance-manager__ref-link instance-manager__ref-link--hidden"
                                    key={targetId}
                                    title="Hidden for this profile"
                                >
                                    <span className="instance-manager__ref-text">
                                        <span className="instance-manager__ref-name">{label}</span>
                                    </span>
                                    <i className="bi bi-eye-slash" aria-hidden="true" />
                                </span>
                            );
                        }
                        const summary = slot.summaries[targetId] ?? [];
                        const summaryText = summary.map(s => `${s.label}: ${s.text}`).join(' · ');
                        return (
                            <button
                                type="button"
                                className="instance-manager__inline-link instance-manager__ref-link"
                                key={targetId}
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
                        );
                    })}
                    {slot.targets.length === 0 && (
                        <p className="instance-manager__note">No {slot.ref.of} linked yet.</p>
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
            ))}
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
        return subjectShape.children.map(child => {
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
     * `targets` are the pointer values the slot holds, read with the same
     * `childrenIn` the containment side uses: it filters holes and dangling
     * pointers, so a link is never mounted on a phantom. `createReason` gates the
     * «New & link» button exactly as `childSlots`'s `reason` gates «Add»: a
     * read-only or derived reference, a full slot, or a target that cannot be
     * instantiated at root (`newInstanceReason`) leaves the reason and drops the
     * button. A slot is shown when it has targets to navigate to OR a create is
     * offered — an empty, uncreatable reference is noise, like an empty child slot.
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
        return shape.refs.map(ref => {
            const targets = childrenIn(idlookup, objectId, ref.key);
            const count = targets.length;
            const full = ref.upper !== -1 && count >= ref.upper;
            let createReason: string | null;
            if (ref.readOnly || ref.derived) createReason = 'Read-only reference';
            else if (full) createReason = `Slot full [${count}/${ref.upper}]`;
            else if (!sourceEditable || permOfClassName(ref.of) !== 'edit') createReason = NOT_EDITABLE;
            else createReason = newInstanceReason(shapeAll.classes[ref.of], countsByName[ref.of] ?? 0);
            const summaries: Record<string, SummaryItem[]> = {};
            for (const t of targets) summaries[t] = summaryOf(t);
            return { ref, targets, count, createReason, summaries };
        }).filter(s => s.targets.length > 0 || s.createReason === null);
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
                <IRForm objectId={formSubjectId ?? subjectId} host="manager" />
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
                                            <IRForm objectId={childId} host="manager" />
                                        </ReadOnlyGate>
                                        {/* #158 P3 — the child's own reference
                                            sections, under its own form and inside
                                            its frame: they are the child's, and the
                                            frame is what says so. Opening a target
                                            goes THROUGH the child (`via`). */}
                                        <RefSlotsSection
                                            slots={inlineRefSlots[childId] ?? []}
                                            idlookup={idlookup}
                                            nested
                                            isHidden={isHidden}
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
                slots={refSlots}
                idlookup={idlookup}
                isHidden={isHidden}
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
