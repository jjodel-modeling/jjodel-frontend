/**
 * InstanceManagerTab — the instance manager, third kind of project tab.
 *
 * Sister surface of the canvas (R-FORM-1): same subject as the canvas tab (one M1
 * model, ratified Q2), different reading of it. The canvas shows the model as a
 * diagram; the manager shows it as a catalogue — metaclasses on the left, the
 * instances of the selected one in the middle, the selected instance as a form on
 * the right.
 *
 * Slice 2a is deliberately thin on new code: the three panes are new, everything
 * inside them already existed.
 *
 *  - the metaclass list is `getMetaclassInfo(modelId)`, the non-hook accessor the IR
 *    authoring panels already use, consumed unchanged;
 *  - the instance list is `instancesOfClass`, a pure function over `idlookup`
 *    (`instanceManagerModel.ts`);
 *  - the detail pane is `IRForm` mounted as it is. `IRForm` takes a bare `objectId`
 *    and `useIRFormView` was written for subjects with no vertex — an object
 *    selected in a tree, in a closed graph, or off-canvas entirely. That is exactly
 *    the manager's subject, so the form needs nothing from here.
 *
 * WHAT THAT INHERITS, declared rather than discovered later: mounting `IRForm` brings
 * its whole write path (`formWrite.ts`) with it, so this tab EDITS from the first
 * slice — it is read-only only in its own two lists. It also brings `IRForm`'s
 * coupling to `sim/simRunState` and to the `irCrossDeps` registry of editor-v2
 * (discovery §5.2). Accepted inside jjodel; it is the seam a future extraction cuts.
 *
 * REACTIVITY — one subscription to `state.idlookup`, whose reference changes on any
 * model write, and three `useMemo`s keyed on it. Each list is one pass over the
 * lookup, so a store change costs O(|idlookup|) here. That is honest for a catalogue
 * of a single model and it is measured nowhere: if a large project makes it show,
 * the fix is a signature selector, not a cache.
 */

import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { getMetaclassInfo, type MetaclassInfo } from '../../editor-v2/hooks/useEditorMode';
import IRForm from '../../editor-v2/viewpoint/ir/IRForm';
import { EmptyState } from '../../ui';
import {
    instanceCountsByClass,
    instancesOfClass,
    uninstantiableReason,
} from './instanceManagerModel';
import './instanceManagerTab.scss';

export interface InstanceManagerTabProps {
    /** The M1 model this manager is the catalogue of. */
    modelid: string;
}

export function InstanceManagerTab({ modelid }: InstanceManagerTabProps) {
    // One subscription for the whole tab. `idlookup`'s reference changes on every
    // model write, which is precisely the granularity three derived lists need.
    const idlookup = useSelector((state: any) => state?.idlookup);

    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

    // Name-sorted so the column does not reorder itself when a class is renamed
    // elsewhere. `getMetaclassInfo` is impure (it reads the store and L-proxies),
    // hence the memo on the lookup rather than on the model id alone.
    const classes: MetaclassInfo[] = useMemo(() => {
        if (!modelid) return [];
        try {
            return [...(getMetaclassInfo(modelid).allClasses ?? [])]
                .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
        } catch {
            // A half-loaded model resolves to no metamodel; an empty column is the
            // honest rendering of that, and it recovers on the next store change.
            return [];
        }
    }, [modelid, idlookup]);

    const counts = useMemo(
        () => instanceCountsByClass(idlookup, modelid),
        [idlookup, modelid],
    );

    const selectedClass = useMemo(
        () => classes.find(c => c.id === selectedClassId) ?? null,
        [classes, selectedClassId],
    );

    const rows = useMemo(
        () => (selectedClassId ? instancesOfClass(idlookup, modelid, selectedClassId) : []),
        [idlookup, modelid, selectedClassId],
    );

    // The selected instance may have been deleted, or may belong to the class that
    // was just deselected. Resolving it against the CURRENT rows rather than
    // trusting the state means the detail pane can never show a dead object.
    const subjectId = selectedObjectId && rows.some(r => r.id === selectedObjectId)
        ? selectedObjectId
        : null;

    const selectClass = (cls: MetaclassInfo) => {
        if (uninstantiableReason(cls)) return;
        setSelectedClassId(cls.id);
        setSelectedObjectId(null);
    };

    return (
        <div className="instance-manager">
            {/* ── Metaclasses ─────────────────────────────────────────────── */}
            <aside className="instance-manager__pane instance-manager__pane--classes">
                <h3 className="instance-manager__eyebrow">Metaclasses</h3>
                {classes.length === 0 ? (
                    <p className="instance-manager__note">
                        No metamodel resolved for this model.
                    </p>
                ) : (
                    <ul className="instance-manager__list">
                        {classes.map(cls => {
                            const reason = uninstantiableReason(cls);
                            const count = counts[cls.id] ?? 0;
                            return (
                                <li
                                    key={cls.id}
                                    className={
                                        'instance-manager__row'
                                        + (reason ? ' instance-manager__row--disabled' : '')
                                        + (cls.id === selectedClassId ? ' instance-manager__row--selected' : '')
                                    }
                                    title={reason ?? cls.name}
                                    aria-disabled={reason ? true : undefined}
                                    onClick={() => selectClass(cls)}
                                >
                                    <span className="instance-manager__row-name">{cls.name}</span>
                                    {/* The word, not the canvas's `1` badge: here the
                                        count column sits right beside it, and a singleton
                                        printed "1  1" reads as a duplication rather than
                                        as a statement. The two tags of this column are
                                        both words, which also makes them one thing. */}
                                    {cls.isSingleton && (
                                        <span
                                            className="instance-manager__tag"
                                            title={`${cls.name} is a singleton: it has at most one instance`}
                                        >singleton</span>
                                    )}
                                    {reason
                                        ? <span className="instance-manager__tag" title={reason}>abstract</span>
                                        : <span className="instance-manager__count">{count}</span>}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </aside>

            {/* ── Instances of the selected metaclass ─────────────────────── */}
            <section className="instance-manager__pane instance-manager__pane--instances">
                <h3 className="instance-manager__eyebrow">
                    {selectedClass ? `${selectedClass.name} instances` : 'Instances'}
                </h3>
                {!selectedClass ? (
                    <p className="instance-manager__note">Pick a metaclass to list its instances.</p>
                ) : rows.length === 0 ? (
                    <p className="instance-manager__note">
                        No instance of {selectedClass.name} in this model.
                    </p>
                ) : (
                    <ul className="instance-manager__list">
                        {rows.map(row => (
                            <li
                                key={row.id}
                                className={
                                    'instance-manager__row'
                                    + (row.id === subjectId ? ' instance-manager__row--selected' : '')
                                }
                                title={row.name || row.id}
                                onClick={() => setSelectedObjectId(row.id)}
                            >
                                <span className="instance-manager__row-name">
                                    {row.name || <em className="instance-manager__unnamed">unnamed</em>}
                                </span>
                                <span className="instance-manager__row-type">{row.metaclassName}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {/* ── The selected instance, as a form ────────────────────────── */}
            <section className="instance-manager__pane instance-manager__pane--detail">
                {subjectId ? (
                    <IRForm objectId={subjectId} />
                ) : (
                    <EmptyState
                        icon="bi-ui-checks-grid"
                        title="No instance selected"
                        description="Pick a metaclass, then an instance, to edit it here."
                    />
                )}
            </section>
        </div>
    );
}

export default InstanceManagerTab;
