/**
 * ProfilesStep — #157, wizard step: the profiles (roles) of the stand-alone environment and,
 * per profile, the per-metaclass permission (Editable / Read only / Hidden). Absorbed from the
 * Fase 0b modal, renamed role→profile.
 *
 * Self-contained: reads/writes the project-state config directly (DEnvironmentConfig / DProfile,
 * created lazily). A stand-alone viewer opens `#/project?id=...&profile=<id>` and the Configurator
 * applies that profile's permissions.
 */
import React, { useEffect, useState } from 'react';
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

const PERMISSION_OPTIONS = [
    { value: 'edit', label: 'Editable' },
    { value: 'read', label: 'Read only' },
    { value: 'hidden', label: 'Hidden' },
];

export const ProfilesStep: React.FC = () => {
    const idlookup = useSelector((s: DState) => s.idlookup);
    const [newProfileName, setNewProfileName] = useState('');
    const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

    const projectId = (U.getProjectID_URL() || '') as string;

    useEffect(() => {
        if (projectId) DEnvironmentConfig.getOrCreate(projectId);
    }, [projectId]);

    const config: any = findEnvironmentConfig(idlookup, projectId);
    const topLevel: string[] = config && Array.isArray(config.topLevelTypes) ? config.topLevelTypes : [];
    // classId → `metamodel:metaclass`, so the permission rows read like the metaclasses step.
    const project = LProject.getProject();
    const classNameById: Record<string, string> = {};
    for (const mm of (((project as any)?.metamodels ?? []) as any[])) {
        const mmName: string = mm?.name || 'metamodel';
        for (const c of ((mm?.classes ?? []) as Array<{ id: string; name: string }>)) {
            if (c && c.id) classNameById[c.id] = `${mmName}:${c.name || c.id}`;
        }
    }
    const profiles = profilesOfConfig(idlookup, config);
    const selectedProfile: any = selectedProfileId ? idlookup[selectedProfileId] : null;

    const addProfile = () => {
        if (!config) return;
        const name = newProfileName.trim() || 'New profile';
        const profile = DProfile.new(config.id, name);
        SetFieldAction.new(config.id, 'profiles', [...profileIdsOf(config), profile.id], '', true);
        setNewProfileName('');
        setSelectedProfileId(profile.id);
    };
    const renameProfile = (profileId: string, name: string) => {
        SetFieldAction.new(profileId, 'name', name, '', false);
    };
    const deleteProfile = (profileId: string) => {
        if (!config) return;
        SetFieldAction.new(config.id, 'profiles', profileIdsOf(config).filter((x) => x !== profileId), '', true);
        // TODO: cleanup — also DeleteElementAction the now-orphaned DProfile entity.
        if (selectedProfileId === profileId) setSelectedProfileId(null);
    };
    const setPermission = (profileD: any, classId: string, perm: EnvPermission) => {
        const cur = { ...(profileD.typePermissions || {}) };
        if (perm === 'edit') delete cur[classId];
        else cur[classId] = perm;
        SetFieldAction.new(profileD.id, 'typePermissions', cur, '', false);
    };

    return (
        <div>
            <div className="envgen-section-header">
                <h3 className="envgen-section-title">Profiles</h3>
                <p className="envgen-section-description">
                    A profile restricts what a stand-alone user can see and edit. Share the environment as
                    <code> #/project?id=…&profile=&lt;id&gt;</code>. Changes are saved to the project immediately.
                </p>
            </div>

            <div className="envgen-profile-add">
                <Input
                    value={newProfileName}
                    onChange={(e) => setNewProfileName((e.target as HTMLInputElement).value)}
                    placeholder="New profile name"
                />
                <button className="envgen-btn envgen-btn--secondary" onClick={addProfile} disabled={!config}>
                    <i className="bi bi-plus-lg" /> Add profile
                </button>
            </div>

            {profiles.length === 0 ? (
                <p className="envgen-empty-hint">No profiles yet.</p>
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
                                    aria-label="Delete profile"
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
                            <div className="envgen-field-label" style={{ marginTop: 12 }}>Permissions per top-level type</div>
                            {topLevel.length === 0 ? (
                                <p className="envgen-empty-hint">Mark some editable metaclasses first.</p>
                            ) : (
                                topLevel.map((cid) => (
                                    <div key={cid} className="envgen-perm-row">
                                        <span className="envgen-perm-row__name">{classNameById[cid] || cid}</span>
                                        <SegmentedControl
                                            options={PERMISSION_OPTIONS}
                                            value={resolveTypePermission(selectedProfile, cid)}
                                            onChange={(v) => setPermission(selectedProfile, cid, v as EnvPermission)}
                                            ariaLabel={`Permission for ${classNameById[cid] || cid}`}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProfilesStep;
