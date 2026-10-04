/**
 * ConfiguratorTab — #157 Fase 1, the Configurator screen (first cut, full-screen overlay).
 *
 * A top bar of the project's top-level element types (from the F0 config, filtered by the
 * role in the URL) replaces the metaclass rail: pick a type → its instances → open one in
 * `IRForm` → create a new one. Reuses the Data Manager engine WITHOUT touching it:
 *   - `instancesOfClass` (pure, instanceManagerModel) for the list;
 *   - `InstanceDetail` for the detail/edit — the Data Manager's own panel (2026-09-28), so
 *     an element shows and navigates the same in both; it replaced a bare `IRForm`;
 *   - `applyCreate` + `newDraft` + `makeShapeCtx` (the same chain InstanceManagerTab commits
 *     through) for "New" — called bare, never wrapped in a TRANSACTION (editor-v2 §3.3).
 *
 * Reads only (no lazy create here): the config is authored in Environment config (Fase 0b).
 * Permission gating of editing (read-only forms) is Fase 2; here the role only filters which
 * types the bar shows (via `visibleTopLevelTypes`).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import {
    DATA_MANAGER_VIEWPOINT_ID,
    DState,
    U,
    LProject,
    LPointerTargetable,
    findEnvironmentConfig,
    findProfile,
    visibleTopLevelTypes,
    resolveTypePermission,
} from '../../joiner';
import { addChildReason, newDraft, paletteAttr } from '../../jjform';
import { metamodelOfClass, modelsForType, restrictDeleteForProfile, topLevelReason } from '../../joiner/environmentConfig';
import { instancesOfClass, modelIdOfObject } from '../abstract/tabs/instanceManagerModel';
import { makeShapeCtx } from '../editor-v2/hooks/shapeAdapter';
import { applyCreate, childSlotCount } from '../editor-v2/hooks/createAdapter';
import { applyDelete, deletePlan, preflightFor } from '../editor-v2/hooks/deleteAdapter';
import { appendValue } from '../editor-v2/viewpoint/ir/formWrite';
import InstanceDetail, { type DetailPermission } from '../abstract/tabs/InstanceDetail';
import { DeleteDialog } from '../abstract/tabs/InstanceManagerTab';
import { createM1 } from '../../pages/components/Navbar';
import { EnvGenEvents } from '../../events/registry';
import { consumerFocusOf, consumerSelectionOf, setConsumerSelection } from './consumerJodieContext';
import { configuratorTargetOf } from '../Jodie/consumerProposalModel';
import type { DeleteOptions, DeletePreflight, NavState } from '../../jjform';
import './configuratorTab.scss';

export interface ConfiguratorTabProps {
    open: boolean;
    onClose: () => void;
    /** #157 R5 — 'page': the consumer's landing page, mounted in place of the project body. No
     *  portal, no close button, no type bar: the type comes from the consumer's left column
     *  (`EnvGenEvents.CONFIGURATOR_SELECT_TYPE`). Default 'overlay', the developer's full-screen
     *  window opened from the sidebar. */
    variant?: 'overlay' | 'page';
}

/** #168 J4 — how long a request to show an element waits for the store to hold it. */
const SELECT_INSTANCE_WAIT_MS = 3000;

/** #173 — how long a create of «Add <Child>» counts against its slot before the store
 *  holds it. The app commits on a timer (300 ms, measured in #168 C1): this outlasts it. */
const IN_FLIGHT_MS = 2000;

/** The `profile` hash param, read via the app's canonical parser (same one `getProjectID_URL` uses). */
function profileIdFromUrl(): string | null {
    try {
        return U.getHashParam('profile');
    } catch {
        return null;
    }
}

export function ConfiguratorTab({ open, onClose, variant = 'overlay' }: ConfiguratorTabProps) {
    const isPage = variant === 'page';
    const idlookup = useSelector((s: DState) => s.idlookup);
    const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
    const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
    // The active profile comes from `?profile=` in the hash. Kept in state and refreshed on
    // `hashchange` and when the panel opens, so editing the URL live updates the gate without a
    // reload (the app's project navigation can drop extra params, so we re-read defensively).
    const [profileId, setProfileId] = useState<string | null>(() => profileIdFromUrl());
    useEffect(() => {
        const onHash = () => setProfileId(profileIdFromUrl());
        window.addEventListener('hashchange', onHash);
        onHash();
        return () => window.removeEventListener('hashchange', onHash);
    }, [open]);

    const projectId = (U.getProjectID_URL() || '') as string;
    const config: any = findEnvironmentConfig(idlookup, projectId);
    const profile: any = findProfile(idlookup, profileId);

    const project = LProject.getProject();
    // The project's models, in project order. A type is created and listed in the models of ITS
    // metamodel (`modelsForType`), not in the project's first model: the field test of 2026-09-29
    // had «New» silent on Educator because the first model conformed to another metamodel.
    const projectModelIds: string[] = (((project as any)?.models ?? []) as Array<{ id: string }>).map((m) => m.id);
    const projectModelKey = projectModelIds.join('|');

    // classId → display name, from the project's metaclasses.
    const classNameById = useMemo(() => {
        const map: Record<string, string> = {};
        for (const c of (((project as any)?.classes ?? []) as Array<{ id: string; name: string }>)) {
            map[c.id] = c.name || c.id;
        }
        return map;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idlookup, projectId]);

    const topTypeIds: string[] = visibleTopLevelTypes(config, profile);

    // Default the selected type to the first available one.
    useEffect(() => {
        if (!open) return;
        if ((!selectedTypeId || !topTypeIds.includes(selectedTypeId)) && topTypeIds.length) {
            setSelectedTypeId(topTypeIds[0]);
        }
    }, [open, topTypeIds, selectedTypeId]);

    // #157 R5 — the page takes its type from the consumer's left column, and says which type is
    // on screen so the column can mark it (CustomEvent + useState, CLAUDE.md §8.7). The column
    // offers only the profile's visible types; the default-selection effect above still guards.
    useEffect(() => {
        if (!isPage) return;
        const onSelect = (e: Event) => {
            const typeId = (e as CustomEvent).detail?.typeId;
            if (typeof typeId === 'string') setSelectedTypeId(typeId);
        };
        window.addEventListener(EnvGenEvents.CONFIGURATOR_SELECT_TYPE, onSelect);
        return () => window.removeEventListener(EnvGenEvents.CONFIGURATOR_SELECT_TYPE, onSelect);
    }, [isPage]);
    useEffect(() => {
        if (!isPage) return;
        window.dispatchEvent(new CustomEvent(EnvGenEvents.CONFIGURATOR_TYPE_CHANGED, { detail: { typeId: selectedTypeId } }));
    }, [isPage, selectedTypeId]);

    /** «New» returned no instance. Shown instead of a silent button; cleared on the next try. */
    const [createFailed, setCreateFailed] = useState(false);

    // Clear the instance selection when the type changes.
    useEffect(() => { setSelectedInstanceId(null); setCreateFailed(false); }, [selectedTypeId]);

    /** The models the selected type lives in. «New» creates in the first one; the list shows
     *  the instances of all of them. Empty = the project has no model of that metamodel. */
    const typeModelIds: string[] = useMemo(
        () => (selectedTypeId ? modelsForType(idlookup, projectModelIds, selectedTypeId) : []),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [idlookup, projectModelKey, selectedTypeId],
    );
    const createModelId: string | null = typeModelIds[0] ?? null;
    const typeMetamodelId: string | null = selectedTypeId ? metamodelOfClass(idlookup, selectedTypeId) : null;
    const typeMetamodelName: string = (typeMetamodelId && idlookup[typeMetamodelId]?.name) || 'metamodel';

    const instances = useMemo(
        () => (selectedTypeId
            ? typeModelIds.flatMap((mid) => instancesOfClass(idlookup, mid, selectedTypeId).map((row) => ({ ...row, modelId: mid })))
            : []),
        [idlookup, typeModelIds, selectedTypeId],
    );

    /** The model the detail works in: the selected instance's own, which is one of
     *  `typeModelIds` and not necessarily the first. */
    const modelId: string | null = selectedInstanceId ? modelIdOfObject(idlookup, selectedInstanceId) : null;

    // ── The detail: the Data Manager's panel (`InstanceDetail`) ────────────────
    // The same header, breadcrumb and Back, form, inline children and reference sections
    // the Data Manager shows, so an element reads and navigates the same in both places.
    // What this host adds is what `InstanceDetail` leaves to its hosts: the navigation
    // state, the scroll container, the create and delete gestures, and the profile.

    /** Where the detail has drilled to. Cleared when another instance is picked, as the
     *  Data Manager clears it from its selection gestures. */
    const [nav, setNav] = useState<NavState | null>(null);
    useEffect(() => { setNav(null); }, [selectedInstanceId]);

    // #168 J4 — after «Apply», Jodie's proposal asks the page to show the element it created or
    // changed (`EnvGenEvents.CONFIGURATOR_SELECT_INSTANCE`): its row, or the row of its nearest
    // top-level ancestor drilled down to it (`configuratorTargetOf`). The effect below applies one
    // state per commit (type, then row, then drill-in) and is declared after the two reset effects
    // above, so that in the commit where they clear the row or the drill-in its own write comes
    // last. The run may still be landing in the store: a request that does not resolve yet waits
    // for the next `idlookup`, until its deadline.
    const pendingSelectRef = useRef<{ instanceId: string; deadline: number } | null>(null);
    const [selectTick, setSelectTick] = useState(0);
    useEffect(() => {
        if (!isPage) return;
        const onSelect = (e: Event) => {
            const instanceId = (e as CustomEvent).detail?.instanceId;
            if (typeof instanceId !== 'string') return;
            pendingSelectRef.current = { instanceId, deadline: Date.now() + SELECT_INSTANCE_WAIT_MS };
            setSelectTick((t) => t + 1);
        };
        window.addEventListener(EnvGenEvents.CONFIGURATOR_SELECT_INSTANCE, onSelect);
        return () => window.removeEventListener(EnvGenEvents.CONFIGURATOR_SELECT_INSTANCE, onSelect);
    }, [isPage]);
    useEffect(() => {
        const pending = pendingSelectRef.current;
        if (!isPage || !pending) return;
        if (Date.now() > pending.deadline) { pendingSelectRef.current = null; return; }
        const target = configuratorTargetOf(idlookup, topTypeIds, pending.instanceId,
            (classId) => resolveTypePermission(profile, classId) === 'hidden');
        if (!target) return;
        if (selectedTypeId !== target.typeId) { setSelectedTypeId(target.typeId); return; }
        if (selectedInstanceId !== target.rowId) { setSelectedInstanceId(target.rowId); return; }
        setNav(target.nav);
        pendingSelectRef.current = null;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPage, idlookup, selectedTypeId, selectedInstanceId, selectTick]);

    // #168 J1 — what is on screen, for Jodie: the element in the detail (the breadcrumb's current
    // step after a drill-in, otherwise the selected row), its exact type, its model
    // (`consumerFocusOf`). Written to `consumerJodieContext` (a Jodie that recomputes later still
    // reads it) and announced by event. The page only: the overlay is the developer's, who Jodie
    // follows through the Dock. Primitive deps, so a store update that changes none of them is silent.
    const focus = consumerFocusOf(idlookup, profile, selectedTypeId, selectedInstanceId, nav);
    const selection = consumerSelectionOf(idlookup, projectModelIds, focus.typeId, focus.instanceId);
    useEffect(() => {
        if (!isPage) return;
        const detail = { typeId: selection.typeId, instanceId: selection.instanceId, modelId: selection.modelId };
        setConsumerSelection(detail);
        window.dispatchEvent(new CustomEvent(EnvGenEvents.CONFIGURATOR_SELECTION_CHANGED, { detail }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPage, selection.typeId, selection.instanceId, selection.modelId]);
    useEffect(() => {
        if (!isPage) return;
        return () => {
            setConsumerSelection(null);
            window.dispatchEvent(new CustomEvent(EnvGenEvents.CONFIGURATOR_SELECTION_CHANGED, { detail: null }));
        };
    }, [isPage]);

    /** The detail column is the element that scrolls: Back restores its offset. */
    const detailRef = useRef<HTMLDivElement | null>(null);

    /** The profile's rule for every type the detail shows or reaches by navigating
     *  (`resolveTypePermission`, unchanged: Juri's decision of 2026-09-28). Stable per
     *  profile, because the detail's memos depend on it. */
    const permissionOf = useCallback(
        (classId: string): DetailPermission => resolveTypePermission(profile, classId),
        [profile],
    );

    /** The Data Manager's form palette, so the detail is painted as it is there. */
    const palette = useSelector((s: any) => paletteAttr(s?.idlookup?.[DATA_MANAGER_VIEWPOINT_ID]?.formPalette));

    /** Delete, with the Data Manager's confirmation (12d): the preflight lists who points
     *  at the instance and offers to reassign or clear those references. `InstanceDetail`
     *  offers it only on a type the profile may edit. With a profile, the preflight is the
     *  profile's (`restrictDeleteForProfile`, 2026-10-04): refused when the cascade holds an
     *  element it cannot change, and no hidden element named. */
    const [pendingDelete, setPendingDelete] = useState<DeletePreflight | null>(null);
    const [reassignTo, setReassignTo] = useState('');
    const openDelete = (instanceId: string) => {
        const mid = modelIdOfObject(idlookup, instanceId) ?? modelId;
        if (!mid) return;
        const raw = preflightFor(mid, makeShapeCtx(mid).shape(), instanceId);
        const pre: DeletePreflight = profile
            ? { ...raw, ...restrictDeleteForProfile(raw, (id) => resolveTypePermission(profile, (idlookup as any)?.[id]?.instanceof)) }
            : raw;
        setReassignTo(pre.reassignCandidates[0]?.id ?? '');
        setPendingDelete(pre);
    };
    const confirmDelete = (options: DeleteOptions) => {
        if (!pendingDelete) return;
        const plan = deletePlan(pendingDelete, options);
        setPendingDelete(null);
        if (plan.blocked) {
            console.warn('[ConfiguratorTab] delete refused', plan.blocked);
            return;
        }
        applyDelete(plan);
        if (selectedInstanceId && plan.deletes.includes(selectedInstanceId)) setSelectedInstanceId(null);
    };

    /** #173 — the creates of «Add <Child>» the store does not count yet, by `owner:slot`:
     *  the slot's count when the first was issued (`base`), how many since (`n`), when. */
    const inFlightRef = useRef<Record<string, { base: number; n: number; at: number }>>({});

    /** «Add <Child>» from the detail: created in place, like this screen's «New», without
     *  the Data Manager's draft dialog. Bare call (editor-v2 §3.3).
     *
     *  #173 — the slot's cardinality is checked HERE too, with the creates still in flight
     *  counted in. The store lags a create, so the bar's own gate reads the old count:
     *  measured, a double click on «Add Note» of a 0..1 slot read [0/1] twice, even from
     *  the live store at click time, and left [2/1]. The Data Manager does not need it:
     *  its draft dialog is modal, so a second click never reaches the bar. */
    const createIn = (cls: string, ownerId: string | null, childKey: string | null) => {
        const mid = (ownerId && modelIdOfObject(idlookup, ownerId)) || modelId;
        if (!mid) return;
        const ctx = makeShapeCtx(mid);
        const shape = ctx.shape();
        const slot = ownerId && childKey ? `${ownerId}:${childKey}` : null;
        let base = 0;
        let n = 0;
        if (ownerId && childKey && slot) {
            const live = childSlotCount(ownerId, childKey);
            const prev = inFlightRef.current[slot];
            const pending = prev && Date.now() - prev.at < IN_FLIGHT_MS ? Math.max(0, prev.base + prev.n - live) : 0;
            if (prev && pending > 0) { base = prev.base; n = prev.n; } else base = live;
            const owner = ctx.classOf(ownerId);
            const child = owner ? shape.classes[owner]?.children.find(c => c.key === childKey) : undefined;
            if (child && addChildReason(child, live + pending, shape.classes[child.of]) !== null) return;
        }
        const id = applyCreate(mid, shape, newDraft(shape, cls, ownerId, childKey));
        if (id && slot) inFlightRef.current[slot] = { base, n: n + 1, at: Date.now() };
    };

    /** «New <Target> & link»: the target at model root, then the pointer appended to the
     *  source slot — the same two steps the Data Manager's commit makes (#142). */
    const createAndLink = (targetCls: string, sourceId: string, refKey: string) => {
        const mid = modelIdOfObject(idlookup, sourceId) || modelId;
        if (!mid) return;
        const shape = makeShapeCtx(mid).shape();
        const id = applyCreate(mid, shape, newDraft(shape, targetCls, null, null));
        if (id) appendValue(sourceId, refKey, id, true);
    };

    if (!open) return null;

    const createNew = () => {
        if (!createModelId || !selectedTypeId) return;
        const name = classNameById[selectedTypeId];
        if (!name) return;
        const shape = makeShapeCtx(createModelId).shape();
        // Bare call: applyCreate manages its own transaction (editor-v2 §3.3).
        const id = applyCreate(createModelId, shape, newDraft(shape, name, null, null));
        setCreateFailed(!id);
        if (id) setSelectedInstanceId(id);
    };

    /** Developer only (decision of 2026-10-01): a type whose metamodel has no model in the
     *  project gets a «Create model» button, through the File → New → Model path, without
     *  opening the model's editor (`open` false): the editor hides the LeftBar that hosts this
     *  overlay, and the Configurator closed under the user (measured by probe, 2026-10-01). */
    const createTypeModel = () => {
        if (!typeMetamodelId || !project) return;
        const mm: any = ((project as any).metamodels ?? []).find((m: any) => m?.id === typeMetamodelId);
        if (mm) createM1(project as any, mm, false);
    };

    const hasTypes = topTypeIds.length > 0;
    // F2: the profile's permission on the selected type. Absent profile (developer, no ?profile)
    // is unrestricted. 'read' → no create, IRForm gated read-only; 'hidden' types never reach here
    // (filtered out of the top bar by visibleTopLevelTypes).
    const selectedPerm = selectedTypeId ? resolveTypePermission(profile, selectedTypeId) : 'edit';
    // R3 (#157): a type that cannot be created on its own at the model root (abstract, contained
    // in another — the core's `LClass.rootable`) gets no «New», whatever the profile says. Without
    // this, «New» made a part outside its whole, or an abstract instance (measured 2026-10-01).
    // Its existing instances stay listed and editable.
    const rootReason: string | null = selectedTypeId ? topLevelReason(LPointerTargetable.fromPointer(selectedTypeId)) : null;
    const canCreate = selectedPerm === 'edit' && !rootReason;
    const readOnly = selectedPerm === 'read';

    // R2 (#157, triage of the field test): tell the "nothing to show" cases apart, so a failure is
    // legible instead of reading as a blank panel. `profileMissing` is the load-bearing one: a
    // `?profile=` that resolves to no profile leaves `profile` null, and a null profile is treated
    // as "no profile at all" = full access — on screen that looks exactly like "hidden did not hide".
    const configuredTypes: string[] = (config && Array.isArray(config.topLevelTypes)) ? config.topLevelTypes : [];
    const profileMissing = !!profileId && !profile;
    // No `?profile=` means the developer is looking. Only they can reach the wizard (the action is
    // hidden in consumer mode), so the "go configure it" hint is addressed to them alone.
    const isDeveloperView = !profileId;

    const windowBody = (
            <div className={`configurator${isPage ? ' configurator--page' : ''}`}>
                <div className="configurator__header">
                    <div className="configurator__title"><i className="bi bi-grid-1x2" /> Configurator</div>
                    <div className="configurator__header-right">
                        <span
                            className={`configurator__profile-chip${profile ? '' : ' configurator__profile-chip--none'}`}
                            title={profile ? 'Active profile from the ?profile= URL parameter' : 'No ?profile= in the URL — full access (developer)'}
                        >
                            {profile ? (
                                <><i className="bi bi-person-badge" /> {profile.name || 'profile'}</>
                            ) : (
                                <><i className="bi bi-unlock" /> No profile — full access</>
                            )}
                        </span>
                        {/* R5: the page is where the consumer lands, not a window to close. */}
                        {!isPage && (
                            <button className="configurator__close" onClick={onClose} aria-label="Close">
                                <i className="bi bi-x-lg" />
                            </button>
                        )}
                    </div>
                </div>

                {profileMissing && (
                    <div className="configurator__warn" role="status">
                        <i className="bi bi-exclamation-triangle" />
                        <span>
                            The profile <code>{profileId}</code> is not part of this project's environment
                            configuration, so <strong>no permission is being applied</strong> — everything
                            below reads as editable. If the profile was configured in another session,
                            check that the project was <strong>saved</strong> before this link was opened.
                        </span>
                    </div>
                )}

                {!hasTypes ? (
                    <div className="configurator__empty">
                        {!config ? (
                            <>
                                No environment is configured for this project yet.
                                {isDeveloperView && (
                                    <><br />Open <strong>Configure environment</strong> in the project sidebar to set it up.</>
                                )}
                            </>
                        ) : configuredTypes.length === 0 ? (
                            <>
                                No metaclasses are marked as editable for this project.
                                {isDeveloperView && (
                                    <><br />Open <strong>Configure environment</strong> → <strong>Editable metaclasses</strong> to choose them.</>
                                )}
                            </>
                        ) : (
                            <>
                                The profile <strong>{profile?.name || profileId}</strong> has no visible types:
                                all {configuredTypes.length} configured{' '}
                                {configuredTypes.length === 1 ? 'type is' : 'types are'} set to <em>Hidden</em>.
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        {/* R5: on the page the types are the consumer's left column. */}
                        {!isPage && <div className="configurator__topbar" role="tablist">
                            {topTypeIds.map((tid) => (
                                <button
                                    key={tid}
                                    role="tab"
                                    aria-selected={selectedTypeId === tid}
                                    className={`configurator__typebtn${selectedTypeId === tid ? ' selected' : ''}`}
                                    onClick={() => setSelectedTypeId(tid)}
                                >
                                    {classNameById[tid] || tid}
                                </button>
                            ))}
                        </div>}

                        <div className="configurator__body">
                            <div className="configurator__list">
                                <div className="configurator__list-head">
                                    <span>
                                        {selectedTypeId ? classNameById[selectedTypeId] : ''} instances
                                        {readOnly && <span className="configurator__perm-badge">Read only</span>}
                                    </span>
                                    {/* R4 (#157): on a type the profile may read but not create, the button
                                        is not rendered at all — a disabled "New" was reported as
                                        misleading in the field test. */}
                                    {canCreate && createModelId && (
                                        <button
                                            className="configurator__new"
                                            onClick={createNew}
                                            disabled={!selectedTypeId}
                                            title={typeModelIds.length > 1
                                                ? `Creates it in ${idlookup[createModelId]?.name || 'the first model'}`
                                                : undefined}
                                        >
                                            <i className="bi bi-plus-lg" /> New
                                        </button>
                                    )}
                                </div>
                                {selectedPerm === 'edit' && rootReason && (
                                    <p className="configurator__hint">
                                        No «New» for {selectedTypeId ? classNameById[selectedTypeId] : 'this type'}: {rootReason}.
                                    </p>
                                )}
                                {createFailed && (
                                    <p className="configurator__error" role="alert">
                                        The new {selectedTypeId ? classNameById[selectedTypeId] : 'element'} could not be
                                        created in <strong>{(createModelId && idlookup[createModelId]?.name) || 'its model'}</strong>.
                                        The browser console has the details.
                                    </p>
                                )}
                                {typeModelIds.length === 0 ? (
                                    <div className="configurator__hint">
                                        {!canCreate ? (
                                            <>No instances: this project has no <strong>{typeMetamodelName}</strong> model.</>
                                        ) : isDeveloperView ? (
                                            <>
                                                This project has no <strong>{typeMetamodelName}</strong> model, so{' '}
                                                {selectedTypeId ? classNameById[selectedTypeId] : 'these'} elements cannot be created yet.
                                                <button className="configurator__create-model" onClick={createTypeModel}>
                                                    <i className="bi bi-plus-lg" /> Create {typeMetamodelName} model
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                {selectedTypeId ? classNameById[selectedTypeId] : 'These'} elements cannot be created
                                                yet: this project has no <strong>{typeMetamodelName}</strong> model. Ask the
                                                project's developer to add one.
                                            </>
                                        )}
                                    </div>
                                ) : instances.length === 0 ? (
                                    <p className="configurator__hint">
                                        {canCreate ? 'No instances yet. Click New to create one.' : 'No instances yet.'}
                                    </p>
                                ) : (
                                    <ul className="configurator__instances">
                                        {instances.map((row) => (
                                            <li
                                                key={row.id}
                                                className={selectedInstanceId === row.id ? 'selected' : ''}
                                                onClick={() => setSelectedInstanceId(row.id)}
                                            >
                                                {row.name || row.id}
                                                {typeModelIds.length > 1 && (
                                                    <span className="configurator__row-model">{idlookup[row.modelId]?.name || row.modelId}</span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="configurator__detail" ref={detailRef}>
                                {selectedInstanceId && modelId ? (
                                    /* The Data Manager's detail, not a second one: header,
                                       breadcrumb and Back, the form (host `manager`, so the
                                       Data Manager's view applies here too), inline children,
                                       reference sections with their summaries, «Add».
                                       Wrapped in the manager's root class for its palette and
                                       tokens; `configuratorTab.scss` undoes the root's layout. */
                                    <div className="instance-manager configurator__dm" data-palette={palette}>
                                        <div className="instance-manager__form-inner">
                                            <InstanceDetail
                                                modelid={modelId}
                                                subjectId={selectedInstanceId}
                                                nav={nav}
                                                setNav={setNav}
                                                scrollRef={detailRef}
                                                openDelete={openDelete}
                                                onCreate={createIn}
                                                onCreateAndLink={createAndLink}
                                                permissionOf={permissionOf}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <p className="configurator__hint">Select an instance, or create a new one.</p>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* The Data Manager's delete confirmation, inside the overlay so it paints
                    above it (its scrim is `fixed` at 40, in the overlay's stacking context). */}
                {pendingDelete && (
                    <DeleteDialog
                        pre={pendingDelete}
                        reassignTo={reassignTo}
                        onReassignTo={setReassignTo}
                        onCancel={() => setPendingDelete(null)}
                        onConfirm={confirmDelete}
                    />
                )}
            </div>
    );

    if (isPage) {
        return <div className="configurator-page" role="region" aria-label="Configurator">{windowBody}</div>;
    }
    return createPortal(
        <div className="configurator-overlay" role="dialog" aria-modal="true" aria-label="Configurator">
            {windowBody}
        </div>,
        document.body,
    );
}

export default ConfiguratorTab;
