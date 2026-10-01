/**
 * MetaclassesStep — #157, wizard step: which metaclasses are editable in the stand-alone
 * environment (the Configurator's top-level entry points). Absorbed from the Fase 0b modal.
 *
 * Self-contained: reads/writes the project-state config directly (DEnvironmentConfig,
 * created lazily), so what the developer marks here travels with the project and is what
 * a stand-alone `?profile=` viewer sees. Not the wizard's localStorage config.
 */
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { DState, U, LProject, DEnvironmentConfig, SetFieldAction, findEnvironmentConfig } from '../../../joiner';
import { Checkbox } from '../../ui/Checkbox/Checkbox';

export const MetaclassesStep: React.FC = () => {
    const idlookup = useSelector((s: DState) => s.idlookup);
    const projectId = (U.getProjectID_URL() || '') as string;

    useEffect(() => {
        if (projectId) DEnvironmentConfig.getOrCreate(projectId);
    }, [projectId]);

    const config: any = findEnvironmentConfig(idlookup, projectId);
    const project = LProject.getProject();
    // R6 (#157): one group per metamodel, with the metamodel name carried by the group heading
    // instead of repeated on every row. The flat `metamodel:metaclass` list was reported as hard to
    // scan when several metamodels contribute classes; homonymous classes stay distinguishable
    // because each one sits under its own metamodel.
    const groups: Array<{ mmId: string; mmName: string; items: Array<{ id: string; label: string }> }> = [];
    for (const mm of (((project as any)?.metamodels ?? []) as any[])) {
        const mmName: string = mm?.name || 'metamodel';
        const items: Array<{ id: string; label: string }> = [];
        for (const c of ((mm?.classes ?? []) as Array<{ id: string; name: string }>)) {
            if (c && c.id) items.push({ id: c.id, label: c.name || c.id });
        }
        if (items.length) groups.push({ mmId: mm?.id || mmName, mmName, items });
    }
    const totalClasses = groups.reduce((n, g) => n + g.items.length, 0);
    const topLevel: string[] = config && Array.isArray(config.topLevelTypes) ? config.topLevelTypes : [];

    const toggle = (classId: string, on: boolean) => {
        if (!config) return;
        const next = on ? [...topLevel, classId] : topLevel.filter((x) => x !== classId);
        SetFieldAction.new(config.id, 'topLevelTypes', next, '', true);
        // R1 (#157): the config travels with the project, so a change here is an unsaved change
        // of the project — the flag behind «Unsaved» and the leave prompt. No write here set it.
        U.isProjectModified = true;
    };

    return (
        <div>
            <div className="envgen-section-header">
                <h3 className="envgen-section-title">Editable metaclasses</h3>
                <p className="envgen-section-description">
                    The metaclasses promoted here become the Configurator's top-level entry points for
                    stand-alone users. Changes are part of the project: «Done» saves it, as Ctrl+S does.
                </p>
            </div>

            {totalClasses === 0 ? (
                <p className="envgen-empty-hint">
                    This project has no metaclasses yet. Define a metamodel first.
                </p>
            ) : (
                groups.map((g) => (
                    <div className="envgen-mm-group" key={g.mmId}>
                        <div className="envgen-mm-group__title">{g.mmName}</div>
                        <ul className="envgen-checklist">
                            {g.items.map((it) => (
                                <li key={it.id}>
                                    <Checkbox
                                        checked={topLevel.includes(it.id)}
                                        onChange={(on) => toggle(it.id, on)}
                                        label={it.label}
                                    />
                                </li>
                            ))}
                        </ul>
                    </div>
                ))
            )}
        </div>
    );
};

export default MetaclassesStep;
