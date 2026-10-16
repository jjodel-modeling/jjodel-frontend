/**
 * MetaclassesStep — #157, wizard step: which metaclasses are editable in the stand-alone
 * environment (the Configurator's top-level entry points). Absorbed from the Fase 0b modal.
 *
 * Self-contained: reads/writes the project-state config directly (DEnvironmentConfig,
 * created lazily), so what the developer marks here travels with the project and is what
 * a stand-alone `?profile=` viewer sees. Not the wizard's localStorage config.
 */
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { DState, U, LProject, DEnvironmentConfig, SetFieldAction, findEnvironmentConfig } from '../../../joiner';
import { topLevelReason } from '../../../joiner/environmentConfig';
import { Checkbox } from '../../ui/Checkbox/Checkbox';
import { splitSelectable, foldToggleLabel } from '../../project/endpointsModel';

export const MetaclassesStep: React.FC = () => {
    const idlookup = useSelector((s: DState) => s.idlookup);
    const projectId = (U.getProjectID_URL() || '') as string;
    // #186: the metamodel groups whose not selectable classes are shown (folded by default).
    const [unfolded, setUnfolded] = useState<Record<string, boolean>>({});

    // #186 (P-2026-10-14-1101): no config is created at mount. The project page mounts this step
    // for every developer, and a project opened without an environment must not get one; the
    // config is created by the first write, in `toggle`.
    const config: any = findEnvironmentConfig(idlookup, projectId);
    const project = LProject.getProject();
    // R6 (#157): one group per metamodel, with the metamodel name carried by the group heading
    // instead of repeated on every row. The flat `metamodel:metaclass` list was reported as hard to
    // scan when several metamodels contribute classes; homonymous classes stay distinguishable
    // because each one sits under its own metamodel.
    // R3 (#157): `reason` says why a class cannot be created on its own at the model root
    // (abstract, contained in another, …), read from the core's `LClass.rootable` — such a class
    // is not offered, as @tmaog asked on 2026-09-23 («phase» only lives inside «scenario»).
    const groups: Array<{ mmId: string; mmName: string; items: Array<{ id: string; label: string; reason: string | null }> }> = [];
    for (const mm of (((project as any)?.metamodels ?? []) as any[])) {
        const mmName: string = mm?.name || 'metamodel';
        const items: Array<{ id: string; label: string; reason: string | null }> = [];
        for (const c of ((mm?.classes ?? []) as Array<{ id: string; name: string }>)) {
            if (c && c.id) items.push({ id: c.id, label: c.name || c.id, reason: topLevelReason(c) });
        }
        if (items.length) groups.push({ mmId: mm?.id || mmName, mmName, items });
    }
    const totalClasses = groups.reduce((n, g) => n + g.items.length, 0);
    const topLevel: string[] = config && Array.isArray(config.topLevelTypes) ? config.topLevelTypes : [];
    // #186 (task 3): the classes that cannot be offered were most of a large metamodel's rows. Per
    // group they are folded away behind one button; a marked one stays visible, so it can be removed.
    const folds = groups.map((g) => ({ ...g, ...splitSelectable(g.items, topLevel) }));

    const toggle = (classId: string, on: boolean) => {
        const cfg: any = config || (projectId ? DEnvironmentConfig.getOrCreate(projectId) : null);
        if (!cfg) return;
        const next = on ? [...topLevel, classId] : topLevel.filter((x) => x !== classId);
        SetFieldAction.new(cfg.id, 'topLevelTypes', next, '', true);
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
                    stand-alone users. Only metaclasses that can be created on their own are offered: not
                    abstract ones, nor those that only live inside another. Changes are part of the
                    project: «Done» saves it, as Ctrl+S does.
                </p>
            </div>

            {totalClasses === 0 ? (
                <p className="envgen-empty-hint">
                    This project has no metaclasses yet. Define a metamodel first.
                </p>
            ) : (
                folds.map((g) => (
                    <div className="envgen-mm-group" key={g.mmId}>
                        <div className="envgen-mm-group__title">{g.mmName}</div>
                        <ul className="envgen-checklist">
                            {(unfolded[g.mmId] ? g.items : g.shown).map((it) => {
                                const marked = topLevel.includes(it.id);
                                return (
                                    <li key={it.id}>
                                        {/* R3: not offered when it cannot be created on its own; one
                                            marked before this rule can still be removed. */}
                                        <Checkbox
                                            checked={marked}
                                            onChange={(on) => toggle(it.id, on)}
                                            label={it.label}
                                            disabled={!!it.reason && !marked}
                                        />
                                        {it.reason && (
                                            <span className={`envgen-checklist__reason${marked ? ' envgen-checklist__reason--marked' : ''}`}>
                                                {marked
                                                    ? `${it.reason}: remove it`
                                                    : it.reason}
                                            </span>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                        {g.folded.length > 0 && (
                            <button
                                type="button"
                                className="btn btn--ghost btn--xs"
                                style={{ marginTop: 6 }}
                                aria-expanded={!!unfolded[g.mmId]}
                                onClick={() => setUnfolded((u) => ({ ...u, [g.mmId]: !u[g.mmId] }))}
                            >
                                {foldToggleLabel(g.folded.length, !!unfolded[g.mmId])}
                            </button>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};

export default MetaclassesStep;
