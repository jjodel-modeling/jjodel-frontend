/**
 * EnvironmentConfigModal — #157 Fase 0b, the language-developer's mini-UI to configure
 * a project's role environments (see docs/discovery/discovery_2026-09-23_157_standalone_configurator.md).
 *
 * Two sections: (1) mark which metaclasses are the Configurator's top-level entry points;
 * (2) create/delete roles and, per role, set the per-type permission (Editable / Read only /
 * Hidden; absent override = Editable, the default). The config entity is created lazily on
 * open (`DEnvironmentConfig.getOrCreate`) and read straight from `idlookup`; writes go through
 * `SetFieldAction` (replace semantics, op ''). Portalled to document.body like the other modals.
 *
 * This is developer tooling: the restricted consumer shell (Fase 3) will not mount it.
 */
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import {
    DState,
    U,
    LProject,
    DEnvironmentConfig,
    DRole,
    SetFieldAction,
    findEnvironmentConfig,
    resolveTypePermission,
    type EnvPermission,
} from '../../joiner';
import { Checkbox } from '../ui/Checkbox/Checkbox';
import { Select } from '../ui/Select/Select';
import { Input } from '../ui/Input/Input';
import './environmentConfigModal.scss';

export interface EnvironmentConfigModalProps {
    open: boolean;
    onClose: () => void;
}

const PERMISSION_OPTIONS = [
    { value: 'edit', label: 'Editable' },
    { value: 'read', label: 'Read only' },
    { value: 'hidden', label: 'Hidden' },
];

export function EnvironmentConfigModal({ open, onClose }: EnvironmentConfigModalProps) {
    const idlookup = useSelector((s: DState) => s.idlookup);
    const [newRoleName, setNewRoleName] = useState('');
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

    const projectId = (U.getProjectID_URL() || '') as string;

    // Lazy-create the config the first time the modal opens on a project.
    useEffect(() => {
        if (open && projectId) DEnvironmentConfig.getOrCreate(projectId);
    }, [open, projectId]);

    if (!open) return null;

    const config: any = findEnvironmentConfig(idlookup, projectId);
    const project = LProject.getProject();
    const classes = ((project as any)?.classes ?? []) as Array<{ id: string; name: string }>;
    const topLevel: string[] = config && Array.isArray(config.topLevelTypes) ? config.topLevelTypes : [];
    const roleIds: string[] = config && Array.isArray(config.roles) ? config.roles : [];
    const roles = roleIds.map((id) => idlookup[id]).filter(Boolean) as any[];
    const selectedRole: any = selectedRoleId ? idlookup[selectedRoleId] : null;

    // ── writes (replace semantics; isPointer flag matches the field kind) ──
    const toggleTopLevel = (classId: string, on: boolean) => {
        if (!config) return;
        const next = on ? [...topLevel, classId] : topLevel.filter((x) => x !== classId);
        SetFieldAction.new(config.id, 'topLevelTypes', next, '', true);
    };
    const addRole = () => {
        if (!config) return;
        const name = newRoleName.trim() || 'New role';
        const role = DRole.new(config.id, name);
        SetFieldAction.new(config.id, 'roles', [...roleIds, role.id], '', true);
        setNewRoleName('');
        setSelectedRoleId(role.id);
    };
    const renameRole = (roleId: string, name: string) => {
        SetFieldAction.new(roleId, 'name', name, '', false);
    };
    const deleteRole = (roleId: string) => {
        if (!config) return;
        SetFieldAction.new(config.id, 'roles', roleIds.filter((x) => x !== roleId), '', true);
        // TODO: cleanup — also DeleteElementAction the now-orphaned DRole entity (deferred:
        // DeleteElementAction cascades to sub-elements and is untested for this leaf here).
        if (selectedRoleId === roleId) setSelectedRoleId(null);
    };
    const setPermission = (roleD: any, classId: string, perm: EnvPermission) => {
        const cur = { ...(roleD.typePermissions || {}) };
        if (perm === 'edit') delete cur[classId];
        else cur[classId] = perm;
        SetFieldAction.new(roleD.id, 'typePermissions', cur, '', false);
    };

    return createPortal(
        <div className="env-config-modal-backdrop" onClick={onClose}>
            <div
                className="env-config-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Environment configuration"
            >
                <div className="env-config-modal__header">
                    <div className="env-config-modal__icon"><i className="bi bi-diagram-3" /></div>
                    <div className="env-config-modal__heading">
                        <strong>Environment configuration</strong>
                        <span className="env-config-modal__subtitle">
                            Top-level element types and role permissions for this project
                        </span>
                    </div>
                    <button className="env-config-modal__close" onClick={onClose} aria-label="Close">
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                <div className="env-config-modal__body">
                    <section className="env-config-section">
                        <h4>Top-level element types</h4>
                        <p className="env-config-hint">
                            The metaclasses promoted here become the Configurator's entry points.
                        </p>
                        {classes.length === 0 ? (
                            <p className="env-config-empty">
                                This project has no metaclasses yet. Define a metamodel first.
                            </p>
                        ) : (
                            <ul className="env-config-typelist">
                                {classes.map((c) => (
                                    <li key={c.id}>
                                        <Checkbox
                                            checked={topLevel.includes(c.id)}
                                            onChange={(on) => toggleTopLevel(c.id, on)}
                                            label={c.name || c.id}
                                        />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section className="env-config-section">
                        <h4>Roles</h4>
                        <div className="env-config-roleadd">
                            <Input
                                value={newRoleName}
                                onChange={(e) => setNewRoleName((e.target as HTMLInputElement).value)}
                                placeholder="New role name"
                            />
                            <button className="env-config-btn" onClick={addRole} disabled={!config}>
                                <i className="bi bi-plus-lg" /> Add role
                            </button>
                        </div>
                        {roles.length === 0 ? (
                            <p className="env-config-empty">No roles yet.</p>
                        ) : (
                            <div className="env-config-roles">
                                <ul className="env-config-rolelist">
                                    {roles.map((r) => (
                                        <li
                                            key={r.id}
                                            className={selectedRoleId === r.id ? 'selected' : ''}
                                            onClick={() => setSelectedRoleId(r.id)}
                                        >
                                            <span>{r.name || r.id}</span>
                                            <button
                                                className="env-config-btn env-config-btn--danger"
                                                onClick={(e) => { e.stopPropagation(); deleteRole(r.id); }}
                                                aria-label="Delete role"
                                            >
                                                <i className="bi bi-trash" />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                {selectedRole && (
                                    <div className="env-config-roledetail">
                                        <label className="env-config-field">
                                            <span>Name</span>
                                            <Input
                                                value={selectedRole.name || ''}
                                                onChange={(e) => renameRole(selectedRole.id, (e.target as HTMLInputElement).value)}
                                            />
                                        </label>
                                        <div className="env-config-perms">
                                            <div className="env-config-perms__title">Permissions per top-level type</div>
                                            {topLevel.length === 0 ? (
                                                <p className="env-config-empty">Mark some top-level types above first.</p>
                                            ) : (
                                                topLevel.map((cid) => {
                                                    const cls = classes.find((c) => c.id === cid);
                                                    return (
                                                        <div key={cid} className="env-config-permrow">
                                                            <span className="env-config-permrow__name">{cls?.name || cid}</span>
                                                            <Select
                                                                options={PERMISSION_OPTIONS}
                                                                value={resolveTypePermission(selectedRole, cid)}
                                                                onChange={(e) => setPermission(selectedRole, cid, (e.target as HTMLSelectElement).value as EnvPermission)}
                                                            />
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>,
        document.body,
    );
}

export default EnvironmentConfigModal;
