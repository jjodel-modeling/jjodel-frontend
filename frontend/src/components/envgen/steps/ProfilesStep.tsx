/**
 * ProfilesStep — #157, wizard step: the profiles (roles) of the stand-alone environment and,
 * per profile, the per-metaclass permission (Editable / Read only / Hidden). Absorbed from the
 * Fase 0b modal, renamed role→profile.
 *
 * Self-contained: reads/writes the project-state config directly (DEnvironmentConfig / DProfile,
 * created lazily). A stand-alone viewer opens `#/project?id=...&profile=<id>` and the Configurator
 * applies that profile's permissions.
 */
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
    DState,
    U,
    LProject,
    DEnvironmentConfig,
    DProfile,
    SetFieldAction,
    findEnvironmentConfig,
    profileIdsOf,
    profilesOfConfig,
    resolveTypePermission,
    type EnvPermission,
} from '../../../joiner';
import { SegmentedControl } from '../../ui/SegmentedControl/SegmentedControl';
import { Input } from '../../ui/Input/Input';
import { getStandaloneEnvironmentUrl, copyToClipboard } from '../../../utils/shareUtils';
import { CustomizeElementModal } from '../../environment/configurator/CustomizeElementModal';

const PERMISSION_OPTIONS = [
    { value: 'edit', label: 'Editable' },
    { value: 'read', label: 'Read only' },
    { value: 'hidden', label: 'Hidden' },
];

export const ProfilesStep: React.FC = () => {
    const idlookup = useSelector((s: DState) => s.idlookup);
    const [newProfileName, setNewProfileName] = useState('');
    const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
    const [linkCopied, setLinkCopied] = useState(false);
    /** #186 task 2: the type whose «Customize element» popup is open, and the button that opened it. */
    const [customizing, setCustomizing] = useState<{ classId: string; opener: HTMLElement } | null>(null);

    const projectId = (U.getProjectID_URL() || '') as string;

    // #186 (P-2026-10-14-1101): no config is created at mount, as in MetaclassesStep; the first
    // write that needs one, «Add role», creates it.
    const config: any = findEnvironmentConfig(idlookup, projectId);
    const topLevel: string[] = config && Array.isArray(config.topLevelTypes) ? config.topLevelTypes : [];
    // classId → `metamodel:metaclass`, so the permission rows read like the metaclasses step.
    const project = LProject.getProject();
    const classNameById: Record<string, string> = {};
    // R6 (#157): keep the metamodel name and the bare class name too, so the permission rows can be
    // grouped per metamodel like the metaclasses step — the heading carries the qualification
    // instead of every row repeating it. `classNameById` stays the qualified label, used for a11y.
    const mmNameById: Record<string, string> = {};
    const shortNameById: Record<string, string> = {};
    for (const mm of (((project as any)?.metamodels ?? []) as any[])) {
        const mmName: string = mm?.name || 'metamodel';
        for (const c of ((mm?.classes ?? []) as Array<{ id: string; name: string }>)) {
            if (c && c.id) {
                classNameById[c.id] = `${mmName}:${c.name || c.id}`;
                mmNameById[c.id] = mmName;
                shortNameById[c.id] = c.name || c.id;
            }
        }
    }
    // Groups in first-appearance order, preserving the developer's stored order inside each group.
    const permGroups: Array<{ mmName: string; ids: string[] }> = [];
    for (const cid of topLevel) {
        const mmName = mmNameById[cid] || 'metamodel';
        let g = permGroups.find((x) => x.mmName === mmName);
        if (!g) { g = { mmName, ids: [] }; permGroups.push(g); }
        g.ids.push(cid);
    }
    const profiles = profilesOfConfig(idlookup, config);
    const selectedProfile: any = selectedProfileId ? idlookup[selectedProfileId] : null;

    /** R1 (#157): profiles travel with the project, so every write below is an unsaved change of
     *  the project — the flag behind «Unsaved» and the leave prompt. No write here set it, and a
     *  link copied from an unsaved profile opened on nothing in the field test of 2026-09-25. */
    const markUnsaved = () => { U.isProjectModified = true; };

    const addProfile = () => {
        const cfg: any = config || (projectId ? DEnvironmentConfig.getOrCreate(projectId) : null);
        if (!cfg) return;
        const name = newProfileName.trim() || 'New role';
        const profile = DProfile.new(cfg.id, name);
        SetFieldAction.new(cfg.id, 'profiles', [...profileIdsOf(cfg), profile.id], '', true);
        markUnsaved();
        setNewProfileName('');
        setSelectedProfileId(profile.id);
    };
    const renameProfile = (profileId: string, name: string) => {
        SetFieldAction.new(profileId, 'name', name, '', false);
        markUnsaved();
    };
    const deleteProfile = (profileId: string) => {
        if (!config) return;
        SetFieldAction.new(config.id, 'profiles', profileIdsOf(config).filter((x) => x !== profileId), '', true);
        markUnsaved();
        // TODO: cleanup — also DeleteElementAction the now-orphaned DProfile entity.
        if (selectedProfileId === profileId) setSelectedProfileId(null);
    };
    const setPermission = (profileD: any, classId: string, perm: EnvPermission) => {
        const cur = { ...(profileD.typePermissions || {}) };
        if (perm === 'edit') delete cur[classId];
        else cur[classId] = perm;
        SetFieldAction.new(profileD.id, 'typePermissions', cur, '', false);
        markUnsaved();
    };
    const copyStandaloneLink = async (profileId: string) => {
        if (!projectId) return;
        const ok = await copyToClipboard(getStandaloneEnvironmentUrl(projectId, profileId));
        if (ok) {
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 1500);
        }
    };

    return (
        <div>
            <div className="envgen-section-header">
                <h3 className="envgen-section-title">Roles</h3>
                <p className="envgen-section-description">
                    A role restricts what a stand-alone user can see and edit. Share the environment as
                    <code> #/project?id=…&profile=&lt;id&gt;</code>. Changes are part of the project: «Done» saves it, as Ctrl+S does.
                </p>
            </div>

            <div className="envgen-profile-add">
                <Input
                    value={newProfileName}
                    onChange={(e) => setNewProfileName((e.target as HTMLInputElement).value)}
                    placeholder="New role name"
                />
                <button className="envgen-btn envgen-btn--secondary" onClick={addProfile} disabled={!projectId}>
                    <i className="bi bi-plus-lg" /> Add role
                </button>
            </div>

            {profiles.length === 0 ? (
                <p className="envgen-empty-hint">No roles yet.</p>
            ) : (
                <div className="envgen-profiles">
                    <ul className="envgen-profile-list">
                        {profiles.map((p: any) => (
                            <li
                                key={p.id}
                                className={selectedProfileId === p.id ? 'selected' : ''}
                                onClick={() => setSelectedProfileId(p.id)}
                            >
                                <span>{p.name || p.id}</span>
                                <button
                                    className="envgen-icon-btn"
                                    onClick={(e) => { e.stopPropagation(); deleteProfile(p.id); }}
                                    aria-label="Delete role"
                                >
                                    <i className="bi bi-trash" />
                                </button>
                            </li>
                        ))}
                    </ul>
                    {selectedProfile && (
                        <div className="envgen-profile-detail">
                            <div className="envgen-field">
                                <label className="envgen-field-label">Name</label>
                                <Input
                                    value={selectedProfile.name || ''}
                                    onChange={(e) => renameProfile(selectedProfile.id, (e.target as HTMLInputElement).value)}
                                />
                            </div>
                            <div className="envgen-field" style={{ marginTop: 12 }}>
                                <label className="envgen-field-label">Stand-alone link</label>
                                <button
                                    className="envgen-btn envgen-btn--secondary"
                                    onClick={() => copyStandaloneLink(selectedProfile.id)}
                                    disabled={!projectId}
                                    title="Copy the URL that opens this environment restricted to this role"
                                >
                                    <i className="bi bi-link-45deg" /> {linkCopied ? 'Copied!' : 'Copy stand-alone link'}
                                </button>
                                <p className="envgen-empty-hint">
                                    The link opens the project as last saved: save it («Done» or Ctrl+S) before sharing.
                                </p>
                            </div>
                            <div className="envgen-field-label" style={{ marginTop: 12 }}>Permissions per top-level type</div>
                            {topLevel.length === 0 ? (
                                <p className="envgen-empty-hint">Mark some editable metaclasses first.</p>
                            ) : (
                                permGroups.map((g) => (
                                    <div className="envgen-mm-group" key={g.mmName}>
                                        <div className="envgen-mm-group__title">{g.mmName}</div>
                                        {g.ids.map((cid) => (
                                            <div key={cid} className="envgen-perm-row">
                                                <span className="envgen-perm-row__name">{shortNameById[cid] || cid}</span>
                                                {/* #186 task 2: the type's presentation for this role; nothing to
                                                    customize on a type the role hides. The reason sits on the
                                                    wrapper: a disabled button takes no pointer event. */}
                                                <span
                                                    className="cfg-custom__open-wrap"
                                                    title={resolveTypePermission(selectedProfile, cid) === 'hidden' ? 'Hidden for this role: nothing to customize' : undefined}
                                                >
                                                    <button
                                                        type="button"
                                                        className="envgen-btn envgen-btn--secondary cfg-custom__open"
                                                        disabled={resolveTypePermission(selectedProfile, cid) === 'hidden'}
                                                        aria-label={`Customize element ${shortNameById[cid] || cid}`}
                                                        onClick={(e) => setCustomizing({ classId: cid, opener: e.currentTarget })}
                                                    >
                                                        <i className="bi bi-palette" aria-hidden="true" /> Customize element
                                                    </button>
                                                </span>
                                                <SegmentedControl
                                                    options={PERMISSION_OPTIONS}
                                                    value={resolveTypePermission(selectedProfile, cid)}
                                                    onChange={(v) => setPermission(selectedProfile, cid, v as EnvPermission)}
                                                    ariaLabel={`Permission for ${classNameById[cid] || cid}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}
            {customizing && selectedProfile && (
                <CustomizeElementModal
                    profileId={selectedProfile.id}
                    classId={customizing.classId}
                    opener={customizing.opener}
                    onClose={() => setCustomizing(null)}
                />
            )}
        </div>
    );
};

export default ProfilesStep;
