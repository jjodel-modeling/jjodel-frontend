/**
 * InstanceManagerTab — the instance manager, third kind of project tab.
 *
 * Sister surface of the canvas (R-FORM-1): same subject as the canvas tab (one M1
 * model, ratified Q2), different reading of it. The canvas shows the model as a
 * diagram; the manager shows it as a catalogue — metaclasses on the left, the
 * instances of the selected one as a TABLE, the selected instance as a form.
 *
 * Turno 11a of the design handoff, which describes exactly this recomposition:
 * «collezioni = metaclassi, tabella = le righe del nodo in orizzontale (colonne
 * dai widget della precedenza), drawer = form di tipo 1».
 *
 * ── Almost no new code inside the three panes ─────────────────────────────────
 *
 *  - the metaclass list is `getMetaclassInfo`, consumed unchanged;
 *  - the columns and cells are `instanceTable`, pure, over the `MetamodelShape`
 *    that `shapeAdapter` derives — and the renderer of each cell is the SAME
 *    precedence the canvas rows use (`valueRenderer`), not a second reading of it;
 *  - the detail pane is `IRForm` mounted as it is. `IRForm` takes a bare
 *    `objectId` and `useIRFormView` was written for subjects with no vertex.
 *
 * WHAT THAT INHERITS, declared rather than discovered later: mounting `IRForm`
 * brings its whole write path (`formWrite.ts`) with it, so this tab EDITS — it is
 * read-only only in its two lists. It also brings `IRForm`'s coupling to
 * `sim/simRunState` and to the `irCrossDeps` registry of editor-v2 (discovery
 * §5.2). Accepted inside jjodel; it is the seam a future extraction cuts.
 *
 * ── Reactivity and cost ────────────────────────────────────────────────────────
 *
 * One subscription to `state.idlookup`, whose reference changes on any model
 * write, and `useMemo`s keyed on it. The shape is rebuilt once per store change
 * (memoised inside the `ShapeCtx` for the rest); the rows are one pass over the
 * lookup plus one `pointedBy` lookup each — an index read, not a scan. Honest for
 * a catalogue of a single model, and measured nowhere: if a large project makes it
 * show, the fix is a signature selector, not a cache.
 */

import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { getMetaclassInfo, type MetaclassInfo } from '../../editor-v2/hooks/useEditorMode';
import { makeShapeCtx } from '../../editor-v2/hooks/shapeAdapter';
import {
    applyCreate,
    childSlotCount,
    classIdOf,
    draftContext,
} from '../../editor-v2/hooks/createAdapter';
import IRForm from '../../editor-v2/viewpoint/ir/IRForm';
import { EmptyState } from '../../ui';
import type { RendererDecision } from '../../editor-v2/nodes/valueRenderer';
import type { ClassShape, Draft, DraftField, RefShape } from '../../../jjform';
import {
    addChildReason,
    draftModel,
    newDraft,
    newInstanceReason,
    setDraftRef,
    setDraftValue,
} from '../../../jjform';
import {
    instanceCountsByClass,
    instancesOfClass,
    uninstantiableReason,
} from './instanceManagerModel';
import {
    filterRows,
    tableColumns,
    tableRow,
    type TableCell,
    type TableRow,
} from './instanceTable';
import './instanceManagerTab.scss';

export interface InstanceManagerTabProps {
    /** The M1 model this manager is the catalogue of. */
    modelid: string;
}

/**
 * One cell, painted from the decision the precedence already made.
 *
 * Every branch is one LINE: a table cell that wraps turns the table into a wall,
 * and the drawer beside it is where a value gets room. `truncatedText`, `date`,
 * `progress` and the fallback all land on plain text for that reason — the
 * distinction they carry matters in a node, not in a column that is 120px wide.
 */
function Cell({ cell }: { cell: TableCell }) {
    const d: RendererDecision = cell.decision;
    const extra = cell.count > 1 ? <span className="instance-manager__more">+{cell.count - 1}</span> : null;

    switch (d.kind) {
        case 'dash':
            return <span className="instance-manager__dash" title="No value">—</span>;

        case 'brokenRef':
            return (
                <span className="instance-manager__broken" title={d.reason}>
                    <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
                    broken
                </span>
            );

        case 'swatch':
            return (
                <span className="instance-manager__swatch-cell" title={`${cell.text} — ${d.reason}`}>
                    <span className="instance-manager__swatch" style={{ background: d.swatch }} aria-hidden="true" />
                    {cell.text}
                    {extra}
                </span>
            );

        case 'boolean':
            return (
                <i
                    className={`bi ${d.boolValue ? 'bi-check-square' : 'bi-square'} instance-manager__bool`}
                    title={cell.text}
                    aria-label={cell.text}
                />
            );

        case 'enumChip':
            return <span className="instance-manager__chip" title={cell.text}>{cell.text}{extra}</span>;

        case 'refPill':
            return (
                <span className="instance-manager__pill" title={cell.text}>
                    <i className="bi bi-box-arrow-up-right" aria-hidden="true" />
                    {cell.text}
                    {extra}
                </span>
            );

        case 'numberUnit':
            return (
                <span className="instance-manager__num" title={cell.text}>
                    {d.numValue ?? cell.text}
                    {d.unit && <span className="instance-manager__unit">{d.unit}</span>}
                </span>
            );

        case 'code':
            return <span className="instance-manager__code" title={cell.text}>{cell.text}</span>;

        case 'collection':
            return (
                <span className="instance-manager__collection" title={cell.text}>
                    {cell.text.split(', ')[0]}
                    {extra}
                </span>
            );

        default:
            return <span className="instance-manager__text" title={cell.text}>{cell.text}</span>;
    }
}

/**
 * The create draft, as a modal (12a).
 *
 * Transactional in the strict sense: this component holds NO model state and
 * writes nothing. It renders the `DraftModel` the engine produced, hands every
 * keystroke back as a new `Draft`, and Commit is the only thing that reaches the
 * D graph — through the caller. Cancel therefore leaves no trace by construction,
 * not by cleanup.
 *
 * The copy is the simulation's: «New <Cls>» as the title, the owner and «not
 * created until «Create»» as the subtitle, the required star, the cardinality
 * beside the label, the per-field error under the control, and a Create button
 * that is disabled while any field carries one.
 */
function DraftDialog({ draft, model, ownerLabel, onChange, onCancel, onCommit }: {
    draft: Draft;
    model: ReturnType<typeof draftModel>;
    ownerLabel: string;
    onChange: (d: Draft) => void;
    onCancel: () => void;
    onCommit: () => void;
}) {
    const field = (f: DraftField) => {
        const invalid = !!f.error;
        const common = {
            id: `instance-manager-draft-${f.key}`,
            className: 'instance-manager__draft-control'
                + (invalid ? ' instance-manager__draft-control--invalid' : ''),
        };

        if (f.kind === 'ref') {
            return (
                <select
                    {...common}
                    value={f.value}
                    onChange={e => onChange(setDraftRef(draft, f.key, e.target.value))}
                >
                    <option value="">Select a {f.typeName}…</option>
                    {f.options.map(o => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                </select>
            );
        }
        if (f.kind === 'enum') {
            return (
                <select
                    {...common}
                    value={f.value}
                    onChange={e => onChange(setDraftValue(draft, f.key, e.target.value))}
                >
                    {!f.required && <option value="">—</option>}
                    {f.options.map(o => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                </select>
            );
        }
        if (f.kind === 'boolean') {
            return (
                <select
                    {...common}
                    value={f.value}
                    onChange={e => onChange(setDraftValue(draft, f.key, e.target.value))}
                >
                    <option value="">—</option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                </select>
            );
        }
        return (
            <input
                {...common}
                type={f.kind === 'number' ? 'number' : 'text'}
                value={f.value}
                placeholder={`${f.key}…`}
                onChange={e => onChange(setDraftValue(draft, f.key, e.target.value))}
            />
        );
    };

    return (
        <div className="instance-manager__scrim" role="dialog" aria-modal="true" aria-label={model.title}>
            <div className="instance-manager__draft">
                <header className="instance-manager__draft-head">
                    <div>
                        <div className="instance-manager__draft-title">{model.title}</div>
                        <div className="instance-manager__draft-subtitle">
                            {model.cls} · {ownerLabel} · not created until «Create»
                        </div>
                    </div>
                    <button
                        type="button"
                        className="instance-manager__draft-close"
                        aria-label="Cancel"
                        onClick={onCancel}
                    >
                        <i className="bi bi-x-lg" aria-hidden="true" />
                    </button>
                </header>

                <div className="instance-manager__draft-body">
                    {model.fields.length === 0 ? (
                        <p className="instance-manager__note">
                            {model.cls} declares no editable feature — «Create» makes an empty instance.
                        </p>
                    ) : model.fields.map(f => (
                        <div className="instance-manager__draft-field" key={f.key}>
                            <label
                                className="instance-manager__draft-label"
                                htmlFor={`instance-manager-draft-${f.key}`}
                            >
                                {f.key}
                                {f.required && <span className="instance-manager__req" aria-hidden="true">*</span>}
                                <span className="instance-manager__draft-card">
                                    {f.typeName} [{f.multiplicity}]
                                </span>
                            </label>
                            {field(f)}
                            {f.error && (
                                <span className="instance-manager__draft-error" role="alert">
                                    <i className="bi bi-exclamation-circle" aria-hidden="true" />
                                    {f.error}
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                <footer className="instance-manager__draft-foot">
                    <span className="instance-manager__draft-hint">
                        <i className="bi bi-info-circle" aria-hidden="true" />
                        Transactional: nothing exists until Create
                    </span>
                    <button type="button" className="instance-manager__draft-cancel" onClick={onCancel}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="instance-manager__draft-commit"
                        disabled={!model.valid}
                        onClick={onCommit}
                    >
                        Create
                    </button>
                </footer>
            </div>
        </div>
    );
}

export function InstanceManagerTab({ modelid }: InstanceManagerTabProps) {
    // One subscription for the whole tab. `idlookup`'s reference changes on every
    // model write, which is precisely the granularity the derived lists need.
    const idlookup = useSelector((state: any) => state?.idlookup);

    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    /** The transactional draft (12a). Null when no create is in flight, and the
     *  ONLY place a not-yet-created instance exists: nothing reaches the store
     *  until Create, so Cancel is `setDraft(null)` and nothing else. */
    const [draft, setDraft] = useState<Draft | null>(null);

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

    /** The shape port. Rebuilt when the lookup changes identity; the shape itself
     *  is memoised inside the context, so the rebuild is one pass, not one per row. */
    const shapeCtx = useMemo(() => makeShapeCtx(modelid), [modelid, idlookup]);

    const selectedClass = useMemo(
        () => classes.find(c => c.id === selectedClassId) ?? null,
        [classes, selectedClassId],
    );

    /** The `ClassShape` of the selected metaclass — the columns come from it.
     *  Keyed by NAME because that is how `MetamodelShape.classes` is keyed. */
    const classShape = useMemo(
        () => (selectedClass ? shapeCtx.shape().classes[selectedClass.name] ?? null : null),
        [shapeCtx, selectedClass],
    );

    const columns = useMemo(() => (classShape ? tableColumns(classShape) : []), [classShape]);

    const rows: TableRow[] = useMemo(() => {
        if (!classShape || !selectedClassId) return [];
        const shape = shapeCtx.shape();
        return instancesOfClass(idlookup, modelid, selectedClassId).map(r =>
            tableRow(idlookup, r.id, classShape, shape, shapeCtx.referencedBy(r.id)));
    }, [idlookup, modelid, selectedClassId, classShape, shapeCtx]);

    const visible = useMemo(() => filterRows(rows, query), [rows, query]);

    // The selected instance may have been deleted, or filtered out of view, or may
    // belong to a class that was just deselected. Resolving it against the CURRENT
    // rows rather than trusting the state means the drawer can never show a dead
    // object — but it is resolved against `rows`, not `visible`, so typing in the
    // search box does not close the drawer on the row being edited.
    const subjectId = selectedObjectId && rows.some(r => r.id === selectedObjectId)
        ? selectedObjectId
        : null;

    const selectClass = (cls: MetaclassInfo) => {
        if (uninstantiableReason(cls)) return;
        setSelectedClassId(cls.id);
        setSelectedObjectId(null);
        setQuery('');
    };

    // ── Create (2c) ────────────────────────────────────────────────────────────
    // Two routes, ONE event. `openCreate` is called from the catalogue with
    // (cls, null, null) and from a child slot with (cls, ownerId, childKey), and
    // nothing downstream knows which gesture produced it — the Q8 warning honoured
    // in code, since where the rootable create is offered from is re-decided in 10b.

    /** Why the selected metaclass does NOT offer `New`, or null when it does.
     *  When it is a string the button is ABSENT, not disabled, and the sentence
     *  goes at the foot of the collection — the same idiom the abstract row in the
     *  metaclass list already uses. */
    const newReason = useMemo(
        () => (classShape ? newInstanceReason(classShape, rows.length) : null),
        [classShape, rows.length],
    );

    /** The `ClassShape` of the selected instance — where its child slots come from. */
    const subjectShape: ClassShape | null = useMemo(() => {
        if (!subjectId) return null;
        const name = shapeCtx.classOf(subjectId);
        return name ? shapeCtx.shape().classes[name] ?? null : null;
    }, [shapeCtx, subjectId]);

    /** One entry per child slot of the selected instance: how full it is, and why
     *  Add is not offered when it is not. */
    const childSlots = useMemo(() => {
        if (!subjectId || !subjectShape) return [] as Array<{ child: RefShape; count: number; reason: string | null }>;
        return subjectShape.children.map(child => {
            const count = childSlotCount(subjectId, child.key);
            return { child, count, reason: addChildReason(child, count) };
        });
    }, [subjectId, subjectShape, idlookup]);

    /** What the live model answers about the draft: reference candidates (with the
     *  containment-loop filter already applied — see `createAdapter.draftContext`)
     *  and the sibling names the uniqueness rule reads. */
    const draftCtx = useMemo(
        () => (draft ? draftContext(modelid, shapeCtx.shape(), draft) : null),
        [draft, modelid, shapeCtx],
    );

    const draftView = useMemo(
        () => (draft && draftCtx ? draftModel(shapeCtx.shape(), draft, draftCtx) : null),
        [draft, draftCtx, shapeCtx],
    );

    const draftOwnerLabel = useMemo(() => {
        if (!draft?.ownerId) return 'model root';
        const owner = rows.find(r => r.id === draft.ownerId);
        return owner?.name || idlookup?.[draft.ownerId]?.name || draft.ownerId;
    }, [draft, rows, idlookup]);

    const openCreate = (clsName: string, ownerId: string | null, childKey: string | null) => {
        setDraft(newDraft(shapeCtx.shape(), clsName, ownerId, childKey));
    };

    const commitDraft = () => {
        if (!draft || !draftView?.valid) return;
        const createdId = applyCreate(modelid, shapeCtx.shape(), draft);
        setDraft(null);
        if (!createdId) return;
        // Show what was just made, whichever route made it: the created instance's
        // own collection becomes the visible one and the instance is selected, so
        // the round trip through the table of 2b is what the user sees next.
        const createdClassId = classIdOf(modelid, draft.cls);
        if (typeof createdClassId === 'string' && createdClassId !== selectedClassId) {
            setSelectedClassId(createdClassId);
            setQuery('');
        }
        setSelectedObjectId(createdId);
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

            {/* ── The collection: a table of the selected metaclass ────────── */}
            <section className="instance-manager__pane instance-manager__pane--table">
                <div className="instance-manager__toolbar">
                    <h3 className="instance-manager__eyebrow">
                        {selectedClass
                            ? `${selectedClass.name} · ${rows.length} instance${rows.length === 1 ? '' : 's'}`
                            : 'Instances'}
                    </h3>
                    {selectedClass && rows.length > 0 && (
                        <input
                            className="instance-manager__search"
                            type="search"
                            value={query}
                            placeholder="Search…"
                            aria-label={`Search ${selectedClass.name} instances`}
                            onChange={e => setQuery(e.target.value)}
                        />
                    )}
                    {/* Route 1 of Turno 10: the catalogue creates the rootable ones.
                        Absent, never disabled, when the metamodel says no — the
                        sentence below the toolbar carries the reason instead. */}
                    {classShape && !newReason && (
                        <button
                            type="button"
                            className="instance-manager__new"
                            onClick={() => openCreate(classShape.key, null, null)}
                        >
                            <i className="bi bi-plus-lg" aria-hidden="true" />
                            New {classShape.key}
                        </button>
                    )}
                </div>

                {classShape && newReason && (
                    <p className="instance-manager__note instance-manager__note--reason">
                        {newReason}
                    </p>
                )}

                {!selectedClass ? (
                    <p className="instance-manager__note">Pick a metaclass to list its instances.</p>
                ) : rows.length === 0 ? (
                    <p className="instance-manager__note">
                        No instance of {selectedClass.name} in this model.
                    </p>
                ) : visible.length === 0 ? (
                    <p className="instance-manager__note">
                        No instance matches “{query}”.
                    </p>
                ) : (
                    <div className="instance-manager__table-scroll">
                        <table className="instance-manager__table">
                            <thead>
                                <tr>
                                    <th scope="col" className="instance-manager__th-name">name</th>
                                    {columns.map(col => (
                                        <th
                                            key={col.key}
                                            scope="col"
                                            className={col.readOnly ? 'instance-manager__th--readonly' : undefined}
                                            title={`${col.key} : ${col.typeName} [${col.multiplicity}]`
                                                + (col.derived ? ' — derived' : col.readOnly ? ' — read-only' : '')}
                                        >
                                            {col.key}
                                            {col.required && <span className="instance-manager__req" aria-hidden="true">*</span>}
                                            {col.readOnly && (
                                                <i className="bi bi-lock-fill instance-manager__lock"
                                                   title={col.derived ? 'Derived' : 'Read-only'} aria-hidden="true" />
                                            )}
                                        </th>
                                    ))}
                                    {/* The delete preflight of 12d, one slice early: a
                                        count here is what the confirmation dialogue of
                                        2c will expand into a list. */}
                                    <th scope="col" className="instance-manager__th-refs" title="Incoming references — how many other instances point at this one">
                                        referenced by
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map(row => (
                                    <tr
                                        key={row.id}
                                        className={row.id === subjectId ? 'instance-manager__tr--selected' : undefined}
                                        title={row.name || row.id}
                                        onClick={() => setSelectedObjectId(row.id)}
                                    >
                                        <th scope="row" className="instance-manager__td-name">
                                            {row.name || <em className="instance-manager__unnamed">unnamed</em>}
                                        </th>
                                        {columns.map(col => (
                                            <td key={col.key}>
                                                <Cell cell={row.cells[col.key]} />
                                            </td>
                                        ))}
                                        <td className="instance-manager__td-refs">
                                            {row.referencedBy.length === 0 ? (
                                                <span className="instance-manager__dash">—</span>
                                            ) : (
                                                <span
                                                    className="instance-manager__refcount"
                                                    title={row.referencedBy
                                                        .map(r => `${r.instanceName || r.instanceId} · ${r.featureKey}`)
                                                        .join('\n')}
                                                >
                                                    {row.referencedBy.length}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* ── The selected instance, as a form ────────────────────────── */}
            <section className="instance-manager__pane instance-manager__pane--detail">
                {subjectId ? (
                    <>
                        <IRForm objectId={subjectId} />
                        {/* Route 2 of Turno 10: containment creates. One Add per child
                            slot of the shape, gated by `upper`; when the slot is full
                            the control is absent and the cardinality says why. The
                            event is the same `create` the catalogue emits.

                            A BAR BESIDE THE FORM, not an Add inside the form's own
                            children group, for two measured reasons. `ListWidget`'s Add
                            is a PICKER over existing elements (`onAppend`, then
                            `ReferencePicker`), which is «reference selects» — the wrong
                            gesture for a containment slot, whose whole rule is that it
                            creates. And giving it a second, creating Add means threading
                            a callback through `IRForm` → `IRFormField` → `ListWidget`,
                            three components this tab HOSTS unchanged (2a) and that the
                            canvas rail mounts too. The form lists the children; this
                            bar is the create the module comment of `ListWidget` defers. */}
                        {childSlots.length > 0 && (
                            <div className="instance-manager__children">
                                <h3 className="instance-manager__eyebrow">Add contained</h3>
                                <ul className="instance-manager__list">
                                    {childSlots.map(({ child, count, reason }) => (
                                        <li className="instance-manager__child" key={child.key}>
                                            <span className="instance-manager__row-name">
                                                {child.key}
                                                <span className="instance-manager__draft-card">
                                                    {child.of} [{count}/{child.upper === -1 ? '*' : child.upper}]
                                                </span>
                                            </span>
                                            {reason ? (
                                                <span className="instance-manager__child-reason" title={reason}>
                                                    {reason}
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="instance-manager__add"
                                                    onClick={() => openCreate(child.of, subjectId, child.key)}
                                                >
                                                    <i className="bi bi-plus" aria-hidden="true" />
                                                    Add {child.of}
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </>
                ) : (
                    <EmptyState
                        icon="bi-ui-checks-grid"
                        title="No instance selected"
                        description="Pick a metaclass, then a row, to edit it here."
                    />
                )}
            </section>

            {draft && draftView && (
                <DraftDialog
                    draft={draft}
                    model={draftView}
                    ownerLabel={draftOwnerLabel}
                    onChange={setDraft}
                    onCancel={() => setDraft(null)}
                    onCommit={commitDraft}
                />
            )}
        </div>
    );
}

export default InstanceManagerTab;
