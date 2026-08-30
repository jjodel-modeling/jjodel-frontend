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
import IRForm from '../../editor-v2/viewpoint/ir/IRForm';
import { EmptyState } from '../../ui';
import type { RendererDecision } from '../../editor-v2/nodes/valueRenderer';
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

export function InstanceManagerTab({ modelid }: InstanceManagerTabProps) {
    // One subscription for the whole tab. `idlookup`'s reference changes on every
    // model write, which is precisely the granularity the derived lists need.
    const idlookup = useSelector((state: any) => state?.idlookup);

    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
    const [query, setQuery] = useState('');

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
                </div>

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
                    <IRForm objectId={subjectId} />
                ) : (
                    <EmptyState
                        icon="bi-ui-checks-grid"
                        title="No instance selected"
                        description="Pick a metaclass, then a row, to edit it here."
                    />
                )}
            </section>
        </div>
    );
}

export default InstanceManagerTab;
