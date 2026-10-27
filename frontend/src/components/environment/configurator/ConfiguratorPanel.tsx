/**
 * ConfiguratorPanel — the element panel of the Configurator (#187, P-2026-10-14-1100).
 *
 * The end user's surface of one element, mounted by `ConfiguratorTab` in place of the Data
 * Manager's `InstanceDetail` (R-CFG-2: the Configurator has a panel of its own, the Data Manager
 * keeps `InstanceDetail` as it is). Mockup `187_3` of #187:
 *
 *  - a header band: «<Type> properties», `*` while this panel has written since the last save, the
 *    issues chip, then the save status, Save and Delete (tasks 2, 4, 5);
 *  - the breadcrumb and Back of the `jjform` navigation, drill-in included, as `InstanceDetail`;
 *  - Identity, Attributes and Components, each folded by its chevron (task 6), the fold remembered
 *    per metaclass (`PanelFields`, `PanelComponents`).
 *
 * What is the host's stays the host's, through the same props `InstanceDetail` took: the
 * navigation state, the scroll container, create, create-and-link and delete (with its
 * confirmation and the role's delete restriction), the role's permission. The Data Manager's view
 * of a class still applies: labels, order, hidden features and widget overrides.
 *
 * The navigation code below is `InstanceDetail`'s (`InstanceDetail.tsx:777-870`), for the same
 * behaviour measured on both before the move (drill-in, pass-through, Back and its scroll, the
 * survivor after a delete): the report's census, §5 rows 1-4.
 */

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { DATA_MANAGER_VIEWPOINT_ID, LProject, store, U } from '../../../joiner';
import { computeIRSignature, getIRIndex, resolveIRView } from '../../editor-v2/viewpoint/ir/irResolveCore';
import { findFeatureRaw, makeDrawReadCtx } from '../../editor-v2/viewpoint/ir/irReadCtx';
import { resolveFormSpec } from '../../editor-v2/viewpoint/ir/formHosts';
import { featureAccessIn, isLockedValue, offerForProfile, type ProfileReads } from '../../editor-v2/viewpoint/ir/formPermissions';
import { groupTargets, type FormFieldOptionGroup } from '../../editor-v2/viewpoint/ir/useFormWidgets';
import { resolveFormTheme, themeVars } from '../../editor-v2/viewpoint/ir/formAutoLayout';
import { makeShapeCtx } from '../../editor-v2/hooks/shapeAdapter';
import { makeWriteCtx } from '../../editor-v2/hooks/writeCtxLproxy';
import { navStepOf } from '../../editor-v2/hooks/multiDraw';
import {
    backOf,
    breadcrumbOf,
    crumbLabel,
    currentOf,
    depthOf,
    drillInto,
    navFor,
    refSlotControls,
    survivorOf,
    targetOptions,
    truncateTo,
} from '../../../jjform';
import { instanceCountsByClass } from '../../abstract/tabs/instanceManagerModel';
import { referenceSummary, tableRow, type SummaryItem } from '../../abstract/tabs/instanceTable';
import { saveProjectWithFeedback } from '../../../common/libraries/saveProject';
import { useLastSaved } from '../../../common/libraries/lastSaved';
import { PanelEnvContext, type PanelEnv } from './PanelFields';
import { ObjectView } from './PanelComponents';
import { issuesText, saveStatus } from './panelModel';
import type { Crumb, NavState, RefShape, RefSlotControls } from '../../../jjform';
import type { DetailPermission } from '../../abstract/tabs/InstanceDetail';
import '../../editor-v2/viewpoint/ir/irFormStyle.scss';
import './configuratorPanel.scss';

export interface ConfiguratorPanelProps {
    /** The model the instance belongs to. */
    modelid: string;
    /** The instance the panel is opened on: the root of the navigation. */
    subjectId: string;
    /** Where the panel has drilled to; null while it sits on `subjectId`. Host state. */
    nav: NavState | null;
    setNav: React.Dispatch<React.SetStateAction<NavState | null>>;
    /** The element the panel scrolls in, for Back's scroll restore. Host layout. */
    scrollRef: React.RefObject<HTMLElement | null>;
    /** Delete an instance (the host opens its confirmation). Absent: no Delete. */
    openDelete?: (instanceId: string) => void;
    /** Create `cls` in `ownerId.childKey`. Absent: no create of a composition. */
    onCreate?: (cls: string, ownerId: string | null, childKey: string | null) => void;
    /** Create `targetCls` at root and link it from `sourceId.refKey`: at the raw index `at`, or
     *  appended without it. Absent: no «+ New» on a reference. */
    onCreateAndLink?: (targetCls: string, sourceId: string, refKey: string, at?: number) => void;
    /** The viewer's permission on a metaclass, by DClass id. Absent: everything `edit`. */
    permissionOf?: (classId: string) => DetailPermission;
}

export function ConfiguratorPanel({
    modelid, subjectId, nav, setNav, scrollRef,
    openDelete, onCreate, onCreateAndLink, permissionOf,
}: ConfiguratorPanelProps) {
    const idlookup = useSelector((state: any) => state?.idlookup);
    // A save from anywhere (this Save, Ctrl/Cmd+S, the autosave) re-renders the status.
    useLastSaved();

    const shapeCtx = useMemo(() => makeShapeCtx(modelid), [modelid, idlookup]);
    /** The Data Manager viewpoint's index (R-DMV-1), as `InstanceDetail` reads it. */
    const irIndex = useSelector((state: any) => getIRIndex(
        state,
        computeIRSignature(state, DATA_MANAGER_VIEWPOINT_ID),
        DATA_MANAGER_VIEWPOINT_ID,
    ));
    const countsByName = useMemo(() => {
        const byId = instanceCountsByClass(idlookup, modelid);
        const out: Record<string, number> = {};
        for (const cls of Object.values(shapeCtx.shape().classes)) out[cls.key] = byId[cls.id] ?? 0;
        return out;
    }, [idlookup, modelid, shapeCtx]);

    // ── The role (#157) ───────────────────────────────────────────────────────
    const permOfClass = (classId: string | null | undefined): DetailPermission =>
        (permissionOf && classId ? permissionOf(classId) : 'edit');
    const permIn = (lookup: Record<string, any> | null | undefined, id: string | null | undefined): DetailPermission =>
        permOfClass(id ? lookup?.[id]?.instanceof : null);
    const permOfInstance = (id: string | null | undefined) => permIn(idlookup, id);
    const permOfClassName = (name: string): DetailPermission => permOfClass(shapeCtx.shape().classes[name]?.id);
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

    /** A reference slot by the rule of `jjform/refSlot`, on a given lookup (`InstanceDetail.ruleRefSlot`). */
    const ruleSlotIn = (lookup: Record<string, any> | null | undefined, objectId: string, ref: RefShape): RefSlotControls => {
        const access = profileReads ? featureAccessIn(lookup, objectId, ref.key) : undefined;
        const values = lookup ? findFeatureRaw(lookup, objectId, ref.key)?.values : null;
        return refSlotControls(ref, Array.isArray(values) ? values : [], {
            resolves: id => lookup?.[id]?.className === 'DObject',
            sourceEditable: permIn(lookup, objectId) === 'edit',
            isLocked: profileReads ? id => isLockedValue(id, access, profileReads) : undefined,
        });
    };

    const writeCtx = useMemo(() => makeWriteCtx(), []);
    const offerFor = (objectId: string, key: string): FormFieldOptionGroup[] => {
        const offered = targetOptions(writeCtx, objectId, key);
        if (!profileReads) return groupTargets(offered);
        const access = featureAccessIn((store.getState() as any)?.idlookup, objectId, key);
        return groupTargets(offerForProfile(offered, access, profileReads));
    };

    /** The key fields of an element, as `InstanceDetail.summaryOf` reads them. */
    const summaryReadCtx = useMemo(() => makeDrawReadCtx(idlookup ?? {}), [idlookup]);
    const summaryOf = (targetId: string): SummaryItem[] => {
        const shapeAll = shapeCtx.shape();
        const clsName = shapeCtx.classOf(targetId);
        const cls = clsName ? shapeAll.classes[clsName] ?? null : null;
        if (!cls) return [];
        const compiled = irIndex ? resolveIRView(targetId, cls.id, irIndex, summaryReadCtx, idlookup) : null;
        const form = resolveFormSpec(compiled?.formSpec ?? undefined, 'manager');
        return referenceSummary(cls, tableRow(idlookup, targetId, cls, shapeAll), form);
    };

    // ── Navigation (`InstanceDetail.tsx:777-870`) ─────────────────────────────
    const formSubjectId: string | null = useMemo(() => {
        if (!nav) return subjectId;
        const cur = currentOf(nav);
        if (cur && idlookup?.[cur.id]?.className === 'DObject') return cur.id;
        return subjectId;
    }, [nav, subjectId, idlookup]);
    const formDepth = nav ? depthOf(nav) : 0;
    const crumbs: Crumb[] = useMemo(() => (nav ? breadcrumbOf(nav) : []), [nav]);
    const navScrollRef = useRef<number[]>([]);
    const pendingScrollRef = useRef<number | null>(null);

    const drillTo = (targetId: string, key: string, via?: { id: string; key: string }) => {
        if (permOfInstance(targetId) === 'hidden') return;
        const step = navStepOf(idlookup, targetId, key);
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
    const restoreScrollFor = (depth: number) => {
        pendingScrollRef.current = navScrollRef.current[depth] ?? 0;
    };
    const goBack = () => {
        if (!nav) return;
        const next = backOf(nav);
        restoreScrollFor(depthOf(next));
        setNav(next);
    };
    /** #173 — the element on screen died under the panel: back to the form the user had before. */
    useLayoutEffect(() => {
        if (!nav) return;
        const next = survivorOf(nav, id => idlookup?.[id]?.className === 'DObject');
        if (next === nav) return;
        if (next) restoreScrollFor(depthOf(next));
        setNav(next);
    }, [nav, idlookup]);
    useLayoutEffect(() => {
        const top = pendingScrollRef.current;
        if (top === null) return;
        pendingScrollRef.current = null;
        if (scrollRef.current) scrollRef.current.scrollTop = top;
    }, [formSubjectId]);

    // ── What this panel has written since the last save ──────────────────────
    // Per element and feature, kept until the save (decision 8 of the report): `U.isProjectModified`
    // going false is the only trace a save leaves, read on render, as `IRForm` reads it.
    const [dirty, setDirty] = useState<Set<string>>(() => new Set());
    const projectModified = !!(U as any).isProjectModified;
    useEffect(() => {
        if (!projectModified) setDirty(prev => (prev.size ? new Set() : prev));
    }, [projectModified]);
    const markDirty = useCallback((objectId: string, key: string) => {
        setDirty(prev => {
            const k = `${objectId}|${key}`;
            return prev.has(k) ? prev : new Set(prev).add(k);
        });
    }, []);

    /** The expanded cards, for the life of the panel on this subject: a child by its id, a reference
     *  row by `ref:<owner>:<key>:<raw index>` (R-CFG-6). */
    const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
    useEffect(() => { setExpanded(new Set()); }, [subjectId]);
    const toggleExpanded = useCallback((childId: string) => {
        setExpanded(prev => {
            const next = new Set(prev);
            if (next.has(childId)) next.delete(childId); else next.add(childId);
            return next;
        });
    }, []);

    // ── The issues of the elements on screen, summed for the chip (Q5 of the report) ─────────
    const issuesRef = useRef(new Map<string, { errors: number; warnings: number }>());
    const [, setIssuesTick] = useState(0);
    const reportIssues = useCallback((objectId: string, counts: { errors: number; warnings: number } | null) => {
        const map = issuesRef.current;
        const prev = map.get(objectId);
        if (counts === null) {
            if (map.delete(objectId)) setIssuesTick(t => t + 1);
            return;
        }
        if (prev && prev.errors === counts.errors && prev.warnings === counts.warnings) return;
        map.set(objectId, counts);
        setIssuesTick(t => t + 1);
    }, []);
    let errors = 0;
    let warnings = 0;
    for (const c of issuesRef.current.values()) { errors += c.errors; warnings += c.warnings; }
    const onScreen = issuesRef.current;
    const starred = Array.from(dirty).some(k => onScreen.has(k.slice(0, k.indexOf('|'))));

    const rootRef = useRef<HTMLDivElement>(null);
    /** The first field or component that carries the severity, in screen order; the element itself
     *  when only it does (a problem of the class, no field). */
    const focusFirst = (severity: 'error' | 'warning') => {
        const root = rootRef.current;
        if (!root) return;
        const has = `[data-problems~="${severity}"]`;
        const el = root.querySelector<HTMLElement>(`[data-field]${has}, [data-component]${has}`)
            ?? root.querySelector<HTMLElement>(`[data-object]${has}`);
        if (!el) return;
        el.scrollIntoView({ block: 'nearest' });
        el.querySelector<HTMLElement>('input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])')?.focus();
    };

    // ── Save and Delete ──────────────────────────────────────────────────────
    const [saving, setSaving] = useState(false);
    const save = async () => {
        if (saving) return;
        setSaving(true);
        try {
            await saveProjectWithFeedback(LProject.getProject() as any);
        } finally {
            setSaving(false);
        }
    };
    const onScreenId = formSubjectId ?? subjectId;
    const subjectStep = navStepOf(idlookup, onScreenId);
    const canDelete = !!openDelete && permOfInstance(onScreenId) === 'edit';

    const preset = useMemo(() => resolveFormTheme(), []);
    const env: PanelEnv = {
        idlookup,
        shapeCtx,
        permOfInstance,
        permOfClassName,
        profileReads,
        countsByName,
        summaryOf,
        ruleSlot: (objectId, ref) => ruleSlotIn(idlookup, objectId, ref),
        liveSlot: (objectId, ref) => ruleSlotIn((store.getState() as any)?.idlookup, objectId, ref),
        offerFor,
        isDirty: (objectId, key) => dirty.has(`${objectId}|${key}`),
        markDirty,
        reportIssues,
        drillTo,
        isExpanded: childId => expanded.has(childId),
        toggleExpanded,
        openDelete,
        onCreate,
        onCreateAndLink,
    };

    return (
        <PanelEnvContext.Provider value={env}>
            <div className="cfg-panel" ref={rootRef}>
                {crumbs.length > 1 && (
                    <nav className="cfg-panel__crumbs" aria-label="Navigation path">
                        <button
                            type="button"
                            className="cfg-panel__back"
                            title={`Back to ${crumbLabel(currentOf(backOf(nav!)) ?? crumbs[0])}`}
                            onClick={goBack}
                        >
                            <i className="bi bi-arrow-left" aria-hidden="true" />
                            Back
                        </button>
                        {crumbs.map(c => (
                            <span key={c.id + ':' + c.depth} className="cfg-panel__crumb-wrap">
                                {c.isCurrent ? (
                                    <span className="cfg-panel__crumb cfg-panel__crumb--current">{crumbLabel(c)}</span>
                                ) : (
                                    <button
                                        type="button"
                                        className="cfg-panel__crumb"
                                        onClick={() => {
                                            restoreScrollFor(c.depth);
                                            setNav(prev => (prev ? truncateTo(prev, c.depth) : prev));
                                        }}
                                    >
                                        {crumbLabel(c)}
                                    </button>
                                )}
                                {!c.isCurrent && <i className="bi bi-chevron-right cfg-panel__crumb-sep" aria-hidden="true" />}
                            </span>
                        ))}
                    </nav>
                )}

                {/* #187 tasks 2, 4, 5: the type, not the name (the name is the Identity field), the
                    issues by the title, the save of the element with its status. Save saves the
                    project: the model has no per-element save. */}
                <header className="cfg-panel__head">
                    <h2 className="cfg-panel__heading">
                        <span className="cfg-panel__heading-type">{subjectStep?.cls ?? ''}</span>
                        {starred && <span className="cfg-panel__star" title="Modified, not saved">*</span>}
                        {' properties'}
                    </h2>
                    {errors + warnings > 0 ? (
                        <button
                            type="button"
                            className={`cfg-panel__issues cfg-panel__issues--${errors > 0 ? 'error' : 'warning'}`}
                            title="Show the first one"
                            onClick={() => focusFirst(errors > 0 ? 'error' : 'warning')}
                        >
                            <i className={`bi ${errors > 0 ? 'bi-x-circle-fill' : 'bi-exclamation-triangle-fill'}`} aria-hidden="true" />
                            {issuesText(errors, warnings)}
                        </button>
                    ) : (
                        <span className="cfg-panel__issues cfg-panel__issues--none">
                            <i className="bi bi-check-circle" aria-hidden="true" />
                            {issuesText(0, 0)}
                        </span>
                    )}
                    <span className="cfg-panel__head-spacer" />
                    <span className={`cfg-panel__status${projectModified ? ' cfg-panel__status--unsaved' : ''}`} role="status">
                        {saveStatus(projectModified)}
                    </span>
                    {/* R-CFG-9: the primary action while the project has unsaved changes, neutral once saved. */}
                    <button
                        type="button"
                        className={`cfg-panel__save${projectModified ? ' cfg-panel__save--unsaved' : ''}`}
                        title="Save the project (Ctrl/Cmd+S)"
                        disabled={saving}
                        onClick={save}
                    >
                        <i className="bi bi-floppy" aria-hidden="true" />
                        Save
                    </button>
                    {canDelete && openDelete && (
                        <button
                            type="button"
                            className="cfg-panel__delete"
                            title={`Delete ${subjectStep?.name || onScreenId}`}
                            onClick={() => openDelete(onScreenId)}
                        >
                            <i className="bi bi-trash" aria-hidden="true" />
                            Delete
                        </button>
                    )}
                </header>

                <div
                    className="ir-form ir-form--plain cfg-panel__body"
                    data-label-placement={preset.labelPlacement}
                    data-density={preset.density}
                    data-section-style={preset.sectionStyle}
                    style={themeVars(preset) as React.CSSProperties}
                >
                    <ObjectView key={onScreenId} objectId={onScreenId} depth={formDepth} via={null} />
                </div>
            </div>
        </PanelEnvContext.Provider>
    );
}

export default ConfiguratorPanel;
