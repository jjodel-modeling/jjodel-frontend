/**
 * ConfiguratorTab — #157 Fase 1, the Configurator screen (first cut, full-screen overlay).
 *
 * A top bar of the project's top-level element types (from the F0 config, filtered by the
 * role in the URL) replaces the metaclass rail: pick a type → its instances → open one in
 * `IRForm` → create a new one. Reuses the Data Manager engine WITHOUT touching it:
 *   - `instancesOfClass` (pure, instanceManagerModel) for the list;
 *   - `IRForm` (standalone) for the detail/edit;
 *   - `applyCreate` + `newDraft` + `makeShapeCtx` (the same chain InstanceManagerTab commits
 *     through) for "New" — called bare, never wrapped in a TRANSACTION (editor-v2 §3.3).
 *
 * Reads only (no lazy create here): the config is authored in Environment config (Fase 0b).
 * Permission gating of editing (read-only forms) is Fase 2; here the role only filters which
 * types the bar shows (via `visibleTopLevelTypes`).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import {
    DState,
    U,
    LProject,
    findEnvironmentConfig,
    findProfile,
    visibleTopLevelTypes,
    resolveTypePermission,
} from '../../joiner';
import { newDraft } from '../../jjform';
import { instancesOfClass } from '../abstract/tabs/instanceManagerModel';
import { makeShapeCtx } from '../editor-v2/hooks/shapeAdapter';
import { applyCreate } from '../editor-v2/hooks/createAdapter';
import IRForm from '../editor-v2/viewpoint/ir/IRForm';
import './configuratorTab.scss';

export interface ConfiguratorTabProps {
    open: boolean;
    onClose: () => void;
}

function profileIdFromUrl(): string | null {
    try {
        const q = (window.location.hash.split('?')[1]) || '';
        return new URLSearchParams(q).get('profile');
    } catch {
        return null;
    }
}

export function ConfiguratorTab({ open, onClose }: ConfiguratorTabProps) {
    const idlookup = useSelector((s: DState) => s.idlookup);
    const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
    const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);

    const projectId = (U.getProjectID_URL() || '') as string;
    const config: any = findEnvironmentConfig(idlookup, projectId);
    const profile: any = findProfile(idlookup, profileIdFromUrl());

    const project = LProject.getProject();
    // First cut: the Configurator targets the project's primary model. A model picker for
    // multi-model projects is a later refinement.
    const models = ((project as any)?.models ?? []) as Array<{ id: string }>;
    const modelId: string | null = models[0]?.id ?? null;

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

    // Clear the instance selection when the type changes.
    useEffect(() => { setSelectedInstanceId(null); }, [selectedTypeId]);

    const instances = useMemo(
        () => (selectedTypeId && modelId ? instancesOfClass(idlookup, modelId, selectedTypeId) : []),
        [idlookup, modelId, selectedTypeId],
    );

    if (!open) return null;

    const createNew = () => {
        if (!modelId || !selectedTypeId) return;
        const name = classNameById[selectedTypeId];
        if (!name) return;
        const shape = makeShapeCtx(modelId).shape();
        // Bare call: applyCreate manages its own transaction (editor-v2 §3.3).
        const id = applyCreate(modelId, shape, newDraft(shape, name, null, null));
        if (id) setSelectedInstanceId(id);
    };

    const hasTypes = topTypeIds.length > 0;
    // F2: the profile's permission on the selected type. Absent profile (developer, no ?profile)
    // is unrestricted. 'read' → no create, IRForm gated read-only; 'hidden' types never reach here
    // (filtered out of the top bar by visibleTopLevelTypes).
    const selectedPerm = selectedTypeId ? resolveTypePermission(profile, selectedTypeId) : 'edit';
    const canCreate = selectedPerm === 'edit';
    const readOnly = selectedPerm === 'read';

    return createPortal(
        <div className="configurator-overlay" role="dialog" aria-modal="true" aria-label="Configurator">
            <div className="configurator">
                <div className="configurator__header">
                    <div className="configurator__title"><i className="bi bi-grid-1x2" /> Configurator</div>
                    <button className="configurator__close" onClick={onClose} aria-label="Close">
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                {!hasTypes ? (
                    <div className="configurator__empty">
                        No top-level element types configured for this project.
                        <br />
                        Open <strong>Environment config</strong> in the project sidebar to choose them.
                    </div>
                ) : (
                    <>
                        <div className="configurator__topbar" role="tablist">
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
                        </div>

                        <div className="configurator__body">
                            <div className="configurator__list">
                                <div className="configurator__list-head">
                                    <span>{selectedTypeId ? classNameById[selectedTypeId] : ''} instances</span>
                                    <button
                                        className="configurator__new"
                                        onClick={createNew}
                                        disabled={!modelId || !selectedTypeId || !canCreate}
                                        title={
                                            !modelId ? 'This project has no model yet'
                                            : !canCreate ? 'This profile cannot create instances of this type'
                                            : undefined
                                        }
                                    >
                                        <i className="bi bi-plus-lg" /> New
                                    </button>
                                </div>
                                {!modelId ? (
                                    <p className="configurator__hint">This project has no model yet.</p>
                                ) : instances.length === 0 ? (
                                    <p className="configurator__hint">No instances yet. Click New to create one.</p>
                                ) : (
                                    <ul className="configurator__instances">
                                        {instances.map((row) => (
                                            <li
                                                key={row.id}
                                                className={selectedInstanceId === row.id ? 'selected' : ''}
                                                onClick={() => setSelectedInstanceId(row.id)}
                                            >
                                                {row.name || row.id}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="configurator__detail">
                                {selectedInstanceId ? (
                                    readOnly ? (
                                        <>
                                            <div className="configurator__ro-banner">
                                                <i className="bi bi-eye" /> Read only
                                                {profile?.name ? ` — the "${profile.name}" profile cannot edit ${selectedTypeId ? classNameById[selectedTypeId] : 'this type'}` : ''}
                                            </div>
                                            {/* Soft gate (frontend enforcement, D1): the form still renders but takes no
                                                input. The detail column keeps its own scroll. */}
                                            <div className="configurator__ro-body" aria-disabled="true">
                                                <IRForm objectId={selectedInstanceId} host="rail" />
                                            </div>
                                        </>
                                    ) : (
                                        <IRForm objectId={selectedInstanceId} host="rail" />
                                    )
                                ) : (
                                    <p className="configurator__hint">Select an instance, or create a new one.</p>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>,
        document.body,
    );
}

export default ConfiguratorTab;
