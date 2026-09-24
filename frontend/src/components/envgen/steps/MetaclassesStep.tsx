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
    // One entry per metaclass, qualified as `metamodel:metaclass` so homonymous classes from
    // different metamodels (e.g. two `iSQD_Profile`) are distinguishable.
    const items: Array<{ id: string; label: string }> = [];
    for (const mm of (((project as any)?.metamodels ?? []) as any[])) {
        const mmName: string = mm?.name || 'metamodel';
        for (const c of ((mm?.classes ?? []) as Array<{ id: string; name: string }>)) {
            if (c && c.id) items.push({ id: c.id, label: `${mmName}:${c.name || c.id}` });
        }
    }
    const topLevel: string[] = config && Array.isArray(config.topLevelTypes) ? config.topLevelTypes : [];

    const toggle = (classId: string, on: boolean) => {
        if (!config) return;
        const next = on ? [...topLevel, classId] : topLevel.filter((x) => x !== classId);
        SetFieldAction.new(config.id, 'topLevelTypes', next, '', true);
    };

    return (
        <div>
            <div className="envgen-section-header">
                <h3 className="envgen-section-title">Editable metaclasses</h3>
                <p className="envgen-section-description">
                    The metaclasses promoted here become the Configurator's top-level entry points for
                    stand-alone users. Changes are saved to the project immediately.
                </p>
            </div>

            {items.length === 0 ? (
                <p className="envgen-empty-hint">
                    This project has no metaclasses yet. Define a metamodel first.
                </p>
            ) : (
                <ul className="envgen-checklist">
                    {items.map((it) => (
                        <li key={it.id}>
                            <Checkbox
                                checked={topLevel.includes(it.id)}
                                onChange={(on) => toggle(it.id, on)}
                                label={it.label}
                            />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default MetaclassesStep;
