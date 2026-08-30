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
import {
    applyDelete,
    deletePlan,
    preflightFor,
} from '../../editor-v2/hooks/deleteAdapter';
import IRForm from '../../editor-v2/viewpoint/ir/IRForm';
import { EmptyState } from '../../ui';
import type { RendererDecision } from '../../editor-v2/nodes/valueRenderer';
import type {
    ClassShape,
    Crumb,
    DeleteOptions,
    DeletePreflight,
    Draft,
    DraftField,
    MultiField,
    MultiModel,
    NavState,
    RefShape,
    UnionPreflight,
} from '../../../jjform';
import {
    addChildReason,
    breadcrumbOf,
    bulkPlan,
    crumbLabel,
    currentOf,
    depthOf,
    draftModel,
    drillInto,
    multiModel,
    navFor,
    newDraft,
    newInstanceReason,
    rendersInline,
    setDraftRef,
    setDraftValue,
    truncateTo,
    unionPreflight,
} from '../../../jjform';
import { childrenIn, multiInstancesOf, navStepOf, pathTo } from '../../editor-v2/hooks/multiDraw';
import { applyBulk } from '../../editor-v2/hooks/multiAdapter';
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

        // A required feature with nothing in it. The precedence would print a dash,
        // and a dash is exactly the silent emptiness ratified rule 2 of 12d forbids
        // after a dirty delete. The cell says the model needs attention; it does not
        // say why the value went.
        //
        // The verdict arrives from `detectValueRenderer` like every other state
        // (R-FORM-15): it used to be a guard placed ahead of this switch, which made
        // it a SECOND decision beside the engine's — and the canvas node, which has
        // only the engine, painted the same slot as a dash.
        case 'missingRequired':
            return (
                <span className="instance-manager__missing" title="Required by cardinality — no value">
                    <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
                    missing
                </span>
            );

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

/**
 * The delete preflight, as a modal (12d).
 *
 * Same discipline as `DraftDialog`: it holds no model state and writes nothing. It
 * renders the `DeletePreflight` the engine produced and hands back the OPTION the
 * user chose; the caller turns that into a plan and applies it. Cancel therefore
 * leaves no trace by construction.
 *
 * The copy and the states are `CRUD Manager Simulation.dc.html`'s: the red warning
 * badge, «Delete <label>?» as the title, the message that names the referrers and
 * the cardinality that would break, the scrollable list of referrers BY NAME with
 * the feature in mono beside it, the cyan «Reassign all to» row with its select and
 * its Apply, and the quiet row underneath. One row more than the simulation, and it
 * is the ratified difference of 12d: the simulation fuses «clear» and «delete
 * anyway» into one gesture because in its own model they have the same effect,
 * while here they do not — measured, `clearSlotValue` leaves a hole and the core's
 * own cascade shortens the array. Two effects, two rows.
 */
function DeleteDialog({ pre, reassignTo, onReassignTo, onCancel, onConfirm }: {
    pre: DeletePreflight;
    reassignTo: string;
    onReassignTo: (id: string) => void;
    onCancel: () => void;
    onConfirm: (options: DeleteOptions) => void;
}) {
    return (
        <div className="instance-manager__scrim" role="dialog" aria-modal="true" aria-label={pre.title}>
            <div className="instance-manager__del">
                <header className="instance-manager__del-head">
                    <span className="instance-manager__del-badge" aria-hidden="true">
                        <i className="bi bi-exclamation-triangle" />
                    </span>
                    <div>
                        <div className="instance-manager__del-title">{pre.title}</div>
                        <div className="instance-manager__del-message">
                            {pre.blocked ?? pre.message}
                        </div>
                    </div>
                </header>

                {/* The referrers, by NAME. An id in this list would be a list nobody
                    can act on: the whole point of the preflight is that the user
                    recognises what is about to break. */}
                {pre.referencedBy.length > 0 && (
                    <ul className="instance-manager__del-refs">
                        {pre.referencedBy.map((r, i) => (
                            <li key={`${r.instanceId}-${r.featureKey}-${r.index}-${i}`}>
                                <span
                                    className="instance-manager__del-badge-c"
                                    title={r.wouldBreak
                                        ? `Cardinality ${r.multiplicity} would break`
                                        : `Cardinality ${r.multiplicity}`}
                                    aria-hidden="true"
                                >C</span>
                                {r.instanceName || r.instanceId}
                                <span className="instance-manager__del-refname">.{r.featureKey}</span>
                                {r.viaDescendant && (
                                    <span className="instance-manager__del-via" title="Points at a contained element that the cascade deletes">
                                        via contained
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                )}

                {/* The cascade, counted and named. Ratified rule 3: containment
                    falls with the container, so the dialogue says what falls. */}
                {pre.descendants.length > 0 && (
                    <ul className="instance-manager__del-children">
                        {pre.descendants.map(d => (
                            <li key={d.id}>
                                <i className="bi bi-diagram-2" aria-hidden="true" />
                                {d.name || d.id}
                                <span className="instance-manager__del-refname">
                                    : {d.cls} · .{d.childKey}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}

                {!pre.blocked && (
                    <div className="instance-manager__del-options">
                        {pre.canReassign && (
                            <div className="instance-manager__del-reassign">
                                <i className="bi bi-arrow-repeat" aria-hidden="true" />
                                Reassign all to
                                <select
                                    className="instance-manager__del-select"
                                    aria-label="Reassign all references to"
                                    value={reassignTo}
                                    onChange={e => onReassignTo(e.target.value)}
                                >
                                    {pre.reassignCandidates.map(o => (
                                        <option key={o.id} value={o.id}>{o.label}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    className="instance-manager__del-apply"
                                    onClick={() => onConfirm({ reassignTo })}
                                >
                                    Apply
                                </button>
                            </div>
                        )}

                        {pre.referencedBy.length > 0 && (
                            <button
                                type="button"
                                className="instance-manager__del-quiet"
                                onClick={() => onConfirm({ clearRefs: true })}
                            >
                                <i className="bi bi-slash-circle" aria-hidden="true" />
                                {pre.clearLabel}
                            </button>
                        )}

                        <button
                            type="button"
                            className="instance-manager__del-quiet"
                            onClick={() => onConfirm({})}
                        >
                            <i className={pre.referencedBy.length ? 'bi bi-exclamation-octagon' : 'bi bi-trash'} aria-hidden="true" />
                            {pre.dirtyLabel}
                        </button>
                    </div>
                )}

                <footer className="instance-manager__del-foot">
                    <button type="button" className="instance-manager__draft-cancel" onClick={onCancel}>
                        Cancel
                    </button>
                </footer>
            </div>
        </div>
    );
}

/**
 * The multi-delete dialogue (12b): ONE preflight for the whole selection.
 *
 * Not N dialogues in a row. The user made one decision and is shown its whole
 * cost once — the union of the referrers, with the pointers held by anything
 * that is dying already removed (`unionPreflight`), and the reassign candidates
 * that fit EVERY member.
 *
 * The three verdicts are 12d's, unchanged: reassign, clear, dirty. What the set
 * shares is the decision; the arithmetic is still per instance, because
 * `deletePlan`'s verdict is defined over one target.
 */
function MultiDeleteDialog({ pre, reassignTo, onReassignTo, onCancel, onConfirm }: {
    pre: UnionPreflight<any, any>;
    reassignTo: string;
    onReassignTo: (v: string) => void;
    onCancel: () => void;
    onConfirm: (options: DeleteOptions) => void;
}) {
    return (
        <div className="instance-manager__scrim" role="dialog" aria-modal="true" aria-label={pre.title}>
            <div className="instance-manager__draft">
                <h3 className="instance-manager__draft-title">{pre.title}</h3>
                <p className="instance-manager__note">{pre.message}</p>

                {pre.blocked ? (
                    /* Refused as a whole rather than half-performed: deleting the
                       members that can go and silently skipping the rest would leave
                       a selection the user cannot reason about. */
                    <>
                        <p className="instance-manager__note instance-manager__note--reason">{pre.blocked}</p>
                        <div className="instance-manager__multi-actions">
                            <button type="button" className="instance-manager__draft-cancel" onClick={onCancel}>Close</button>
                        </div>
                    </>
                ) : (
                    <>
                        {pre.descendants.length > 0 && (
                            <p className="instance-manager__note">
                                {pre.descendants.length} contained instance{pre.descendants.length === 1 ? '' : 's'} will go with them.
                            </p>
                        )}

                        {pre.referencedBy.length > 0 && (
                            <ul className="instance-manager__list">
                                {pre.referencedBy.map((r: any, i: number) => (
                                    <li className="instance-manager__child" key={`${r.instanceId}:${r.featureKey}:${r.index}:${i}`}>
                                        <span className="instance-manager__row-name">
                                            {r.instanceName || r.instanceId}
                                            <span className="instance-manager__draft-card">.{r.featureKey}</span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className="instance-manager__multi-actions">
                            {pre.canReassign && (
                                <>
                                    <select
                                        className="instance-manager__multi-input"
                                        value={reassignTo}
                                        aria-label="Reassign all references to"
                                        onChange={e => onReassignTo(e.target.value)}
                                    >
                                        {pre.reassignCandidates.map(c => (
                                            <option key={c.id} value={c.id}>{c.label}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        className="instance-manager__new"
                                        disabled={!reassignTo}
                                        onClick={() => onConfirm({ reassignTo })}
                                    >Reassign all, then delete</button>
                                </>
                            )}
                            {pre.referencedBy.length > 0 && (
                                <button
                                    type="button"
                                    className="instance-manager__new"
                                    onClick={() => onConfirm({ clearRefs: true })}
                                >Clear the references, then delete</button>
                            )}
                            <button
                                type="button"
                                className="instance-manager__new"
                                onClick={() => onConfirm({})}
                            >
                                {pre.referencedBy.length > 0
                                    ? `Delete anyway — ${pre.referencedBy.length} reference${pre.referencedBy.length === 1 ? '' : 's'} become invalid`
                                    : `Delete ${pre.count}`}
                            </button>
                            <button type="button" className="instance-manager__draft-cancel" onClick={onCancel}>Cancel</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

/**
 * The multi-selection form (12b).
 *
 * `Instance Node Proposal.dc.html`, Turno 12, panel `12b`. Three things it does
 * that a single-instance form does not, each of them the design's own words:
 *
 *  - a field the selection disagrees on prints «Mixed (Green, Red, Blue)» — the
 *    DISTINCT values, not a representative. Touching it is what replaces it; until
 *    then the control shows the disagreement instead of hiding it;
 *  - a touched field says «will apply to N», because a bulk write is the one edit
 *    whose blast radius is not obvious from where the cursor is;
 *  - a boolean has a THIRD state: «2 on · 1 off», not a checkbox guessing.
 *
 * What it does NOT render is as specified as what it does: `name` and every
 * containment slot are ABSENT, with the reason printed once at the foot. Absent
 * and not disabled — a greyed control invites the gesture it then refuses, and the
 * design says «hidden».
 *
 * The component decides nothing. Which fields exist, which are mixed, which are
 * excluded and why all come from `jjform/multi`; this paints them.
 */
function MultiForm({ model, touched, onTouch, onApply, onClear, onDelete }: {
    model: MultiModel;
    touched: Record<string, unknown>;
    onTouch: (key: string, value: unknown) => void;
    onApply: () => void;
    onClear: () => void;
    onDelete: () => void;
}) {
    const dirty = Object.keys(touched).length;

    /** What a field shows: the value the user typed if they typed one, else the
     *  agreed value, else nothing — because there is no agreed value to show. */
    const shownValue = (f: MultiField): string => {
        if (f.key in touched) return String(touched[f.key] ?? '');
        if (f.state === 'mixed') return '';
        return f.value == null ? '' : String(f.value);
    };

    const mixedLabel = (f: MultiField): string => {
        const shown = f.distinct.map(v => (v == null ? '(empty)' : String(v)));
        return `Mixed (${shown.join(', ')})`;
    };

    return (
        <div className="instance-manager__multi">
            <h3 className="instance-manager__eyebrow">{model.title}</h3>

            {model.fields.map(f => {
                const isTouched = f.key in touched;
                return (
                    <div className="instance-manager__multi-field" key={f.key}>
                        <label className="instance-manager__multi-label" htmlFor={`multi-${f.key}`}>
                            {f.key}
                            {f.required && <span className="instance-manager__req" aria-hidden="true">*</span>}
                        </label>

                        {f.kind === 'boolean' ? (
                            /* The third state. A tri-state is not a checkbox with a
                               dash: the counts are the information, and the two
                               buttons are the only two writes that exist. */
                            <div className="instance-manager__tri">
                                {!isTouched && f.counts && (
                                    <span className="instance-manager__tri-counts">
                                        {f.counts.on} on · {f.counts.off} off
                                        {f.counts.unset > 0 && ` · ${f.counts.unset} unset`}
                                    </span>
                                )}
                                <button
                                    type="button"
                                    className={'instance-manager__tri-btn' + (touched[f.key] === true ? ' instance-manager__tri-btn--on' : '')}
                                    onClick={() => onTouch(f.key, true)}
                                >on</button>
                                <button
                                    type="button"
                                    className={'instance-manager__tri-btn' + (touched[f.key] === false ? ' instance-manager__tri-btn--on' : '')}
                                    onClick={() => onTouch(f.key, false)}
                                >off</button>
                            </div>
                        ) : (
                            <input
                                id={`multi-${f.key}`}
                                className={'instance-manager__multi-input' + (f.state === 'mixed' && !isTouched ? ' instance-manager__multi-input--mixed' : '')}
                                type={f.kind === 'number' ? 'number' : 'text'}
                                value={shownValue(f)}
                                placeholder={f.state === 'mixed' ? mixedLabel(f) : ''}
                                title={f.state === 'mixed' ? mixedLabel(f) : undefined}
                                onChange={e => onTouch(f.key, f.kind === 'number' ? Number(e.target.value) : e.target.value)}
                            />
                        )}

                        {isTouched ? (
                            <span className="instance-manager__multi-apply">will apply to {model.count}</span>
                        ) : f.state === 'mixed' ? (
                            <span className="instance-manager__multi-mixed">{mixedLabel(f)}</span>
                        ) : null}
                    </div>
                );
            })}

            {model.excluded.length > 0 && (
                /* The reason, once, for the fields that are not here. Printed rather
                   than implied: a form that silently drops `name` is a form the user
                   has to guess about. */
                <p className="instance-manager__note instance-manager__note--reason">
                    {Array.from(new Set(model.excluded.map(e => e.reason))).join(' · ')}
                </p>
            )}

            <div className="instance-manager__multi-actions">
                <button type="button" className="instance-manager__draft-cancel" onClick={onDelete}>
                    <i className="bi bi-trash" aria-hidden="true" /> Delete {model.count}
                </button>
                <button
                    type="button"
                    className="instance-manager__draft-cancel"
                    disabled={dirty === 0}
                    onClick={onClear}
                >Discard</button>
                <button
                    type="button"
                    className="instance-manager__new"
                    disabled={dirty === 0}
                    onClick={onApply}
                >
                    Apply to {model.count}
                </button>
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
    /** The EXTRA rows a multi-selection holds, beside `selectedObjectId`.
     *
     *  Two pieces of state rather than one set, and deliberately: the single
     *  selection is what the form is mounted on and what drill-in navigates from,
     *  and collapsing the two would make «which one is the subject» a question
     *  with no answer whenever the set has more than one member. `selectedIds`
     *  below is the union, and it is what 12b reads. */
    const [alsoSelected, setAlsoSelected] = useState<string[]>([]);
    /** The keys the user actually wrote in the multi-form, and their values.
     *  Untouched means unwritten (12b rule 2), so this map — not the rendered
     *  field values — is what `bulkPlan` is given. */
    const [bulkTouched, setBulkTouched] = useState<Record<string, unknown>>({});
    /** Where the form has drilled to (12c). Null while the form sits on its own
     *  subject, which is the common case and costs no breadcrumb. */
    const [nav, setNav] = useState<NavState | null>(null);
    const [query, setQuery] = useState('');
    /** The transactional draft (12a). Null when no create is in flight, and the
     *  ONLY place a not-yet-created instance exists: nothing reaches the store
     *  until Create, so Cancel is `setDraft(null)` and nothing else. */
    const [draft, setDraft] = useState<Draft | null>(null);
    /** The delete preflight in flight (12d). Null when no delete is pending, and
     *  like the draft it is the only place the decision lives: nothing is written
     *  until a row of the dialogue is pressed, so Cancel is `setPending(null)`. */
    const [pending, setPending] = useState<DeletePreflight | null>(null);
    const [reassignTo, setReassignTo] = useState('');
    /** The union preflight of a multi-delete (12b). One dialogue for the set, so
     *  one piece of state — never N pending deletes queued behind each other. */
    const [pendingMulti, setPendingMulti] = useState<UnionPreflight<any, any> | null>(null);
    const [multiReassignTo, setMultiReassignTo] = useState('');

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

    // ── Multi-selection (12b) ──────────────────────────────────────────────────

    /** The whole selection, subject first, resolved against the LIVE rows for the
     *  same reason `subjectId` is: a row deleted under the form must leave the
     *  selection, not linger in it as a phantom that makes every field mixed. */
    const selectedIds: string[] = useMemo(() => {
        const live = new Set(rows.map(r => r.id));
        const out: string[] = [];
        if (subjectId) out.push(subjectId);
        for (const id of alsoSelected) if (id !== subjectId && live.has(id)) out.push(id);
        return out;
    }, [rows, subjectId, alsoSelected]);

    const isMulti = selectedIds.length > 1;

    /** The multi-form, or null when fewer than two rows are selected.
     *  The engine decides what is mixed and what is excluded; `multiDraw` only
     *  says what each instance holds. */
    const multi: MultiModel | null = useMemo(() => {
        if (!classShape || selectedIds.length < 2) return null;
        return multiModel(classShape, multiInstancesOf(idlookup, classShape, selectedIds));
    }, [classShape, selectedIds, idlookup]);

    /** Toggle a row in or out of the selection.
     *
     *  Picking the subject out of the set promotes the next member rather than
     *  leaving the form with nothing: a selection of three minus its subject is
     *  still a selection of two, and blanking the detail pane would read as the
     *  click having deselected everything. */
    const toggleSelected = (id: string) => {
        setBulkTouched({});
        setNav(null);
        if (id === subjectId) {
            const next = alsoSelected.find(x => x !== id) ?? null;
            setSelectedObjectId(next);
            setAlsoSelected(prev => prev.filter(x => x !== id && x !== next));
            return;
        }
        if (alsoSelected.includes(id)) { setAlsoSelected(prev => prev.filter(x => x !== id)); return; }
        if (!subjectId) { setSelectedObjectId(id); return; }
        setAlsoSelected(prev => [...prev, id]);
    };

    /** A plain click on a row: one subject, selection reset. The checkbox is the
     *  gesture that ADDS; a click that quietly extended the selection would make
     *  every ordinary row change a bulk edit waiting to happen. */
    const selectOnly = (id: string) => {
        setSelectedObjectId(id);
        setAlsoSelected([]);
        setBulkTouched({});
        setNav(null);
    };

    const applyBulkEdit = () => {
        if (!multi) return;
        const plan = bulkPlan(multi, bulkTouched);
        setBulkTouched({});
        if (plan.length === 0) return;
        applyBulk(plan);
    };

    // ── Drill-in (12c) ─────────────────────────────────────────────────────────

    /** The instance the form body is showing: the drilled-into child when a
     *  navigation is open, the selected row otherwise. ONE form, whose body is
     *  replaced — the design's own words — so this is an id swap and not a second
     *  mounted form. Resolved against the store so a drilled-into child that was
     *  deleted falls back to the subject instead of showing a dead object. */
    const formSubjectId: string | null = useMemo(() => {
        if (!nav) return subjectId;
        const cur = currentOf(nav);
        if (cur && idlookup?.[cur.id]?.className === 'DObject') return cur.id;
        return subjectId;
    }, [nav, subjectId, idlookup]);

    /** How deep the form has drilled. It is what decides inline vs link. */
    const formDepth = nav ? depthOf(nav) : 0;

    const crumbs: Crumb[] = useMemo(() => (nav ? breadcrumbOf(nav) : []), [nav]);

    /** Drill into a contained child. The road is seeded from the SUBJECT's own
     *  position, not from the model root, so the breadcrumb starts where the form
     *  started and does not print ancestors the user never navigated through. */
    const drillTo = (childId: string, childKey: string) => {
        const step = navStepOf(idlookup, childId, childKey);
        if (!step) return;
        if (nav) { setNav(drillInto(nav, step)); return; }
        const root = subjectId ? navStepOf(idlookup, subjectId) : null;
        if (!root) return;
        setNav(drillInto(navFor(root), step));
    };

    /** The contained children of the form's current subject, per child slot.
     *  Empty at depth >= INLINE_DEPTH_LIMIT: beyond the inline level the children
     *  render as drill-in links, which is the same list read by a different rule. */
    const inlineChildren = useMemo(() => {
        if (!formSubjectId || !shapeCtx) return [] as Array<{ key: string; of: string; ids: string[] }>;
        const clsName = pathTo(idlookup, formSubjectId).slice(-1)[0]?.cls;
        const shape = clsName ? shapeCtx.shape().classes[clsName] : null;
        if (!shape) return [];
        return shape.children.map(c => ({
            key: c.key,
            of: c.of,
            ids: childrenIn(idlookup, formSubjectId, c.key),
        })).filter(c => c.ids.length > 0);
    }, [idlookup, formSubjectId, shapeCtx]);

    const selectClass = (cls: MetaclassInfo) => {
        if (uninstantiableReason(cls)) return;
        setSelectedClassId(cls.id);
        setSelectedObjectId(null);
        setAlsoSelected([]);
        setBulkTouched({});
        setNav(null);
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

    // ── Delete (12d) ───────────────────────────────────────────────────────────
    // ONE event, `delete(id, { reassignTo? | clearRefs })`, whose options are the
    // verdict of the preflight. The preflight is ALWAYS computed (ratified rule 1):
    // an unreferenced instance gets the simple confirmation, a referenced one the
    // dialogue that lists who points at it.

    const openDelete = (instanceId: string) => {
        const pre = preflightFor(modelid, shapeCtx.shape(), instanceId);
        setReassignTo(pre.reassignCandidates[0]?.id ?? '');
        setPending(pre);
    };

    const confirmDelete = (options: DeleteOptions) => {
        if (!pending) return;
        const plan = deletePlan(pending, options);
        setPending(null);
        if (plan.blocked) {
            console.warn('[InstanceManagerTab] delete refused', plan.blocked);
            return;
        }
        applyDelete(plan);
        // The subject may be one of the instances that just died — the target or a
        // descendant of it. Clearing the selection is not a cleanup: `subjectId`
        // already resolves against the live rows, and this only saves the drawer a
        // render on a dead object.
        if (selectedObjectId && plan.deletes.includes(selectedObjectId)) setSelectedObjectId(null);
    };

    // ── Multi-delete (12b) ─────────────────────────────────────────────────────
    // ONE preflight for the set: the referrers are the union, minus the pointers
    // held by anything that is dying. The plans are still per-instance, because
    // `deletePlan` is 12d's and its verdict is defined over one target — what the
    // set shares is the DECISION, not the arithmetic.

    const openMultiDelete = () => {
        if (selectedIds.length < 2) return;
        const shape = shapeCtx.shape();
        const pres = selectedIds.map(id => preflightFor(modelid, shape, id));
        const union = unionPreflight(pres as any);
        setMultiReassignTo(union.reassignCandidates[0]?.id ?? '');
        setPendingMulti(union);
    };

    const confirmMultiDelete = (options: DeleteOptions) => {
        if (!pendingMulti || pendingMulti.blocked) { setPendingMulti(null); return; }
        const shape = shapeCtx.shape();
        for (const id of pendingMulti.ids) {
            const plan = deletePlan(preflightFor(modelid, shape, id), options);
            if (plan.blocked) { console.warn('[InstanceManagerTab] multi delete refused', plan.blocked); continue; }
            applyDelete(plan);
        }
        setPendingMulti(null);
        setSelectedObjectId(null);
        setAlsoSelected([]);
        setBulkTouched({});
        setNav(null);
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
                                    {/* Select-all over the VISIBLE rows: what the
                                        search box left on screen is what a click here
                                        means, so a filtered table cannot silently
                                        select rows the user cannot see. */}
                                    <th scope="col" className="instance-manager__th-pick">
                                        <input
                                            type="checkbox"
                                            aria-label="Select all visible instances"
                                            checked={visible.length > 0 && visible.every(r => selectedIds.includes(r.id))}
                                            onChange={() => {
                                                const allOn = visible.length > 0 && visible.every(r => selectedIds.includes(r.id));
                                                setBulkTouched({});
                                                setNav(null);
                                                if (allOn) { setSelectedObjectId(null); setAlsoSelected([]); return; }
                                                const [first, ...rest] = visible.map(r => r.id);
                                                setSelectedObjectId(first ?? null);
                                                setAlsoSelected(rest);
                                            }}
                                        />
                                    </th>
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
                                    <th scope="col" className="instance-manager__th-del">
                                        <span className="instance-manager__sr">actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map(row => (
                                    <tr
                                        key={row.id}
                                        className={
                                            row.id === subjectId ? 'instance-manager__tr--selected'
                                                : selectedIds.includes(row.id) ? 'instance-manager__tr--multi'
                                                    : undefined
                                        }
                                        title={row.name || row.id}
                                        onClick={() => selectOnly(row.id)}
                                    >
                                        {/* The checkbox is the gesture that ADDS to the
                                            selection; a plain click still means «this one».
                                            Keeping them apart is what stops every ordinary
                                            row change from being a bulk edit in waiting. */}
                                        <td
                                            className="instance-manager__td-pick"
                                            onClick={e => { e.stopPropagation(); toggleSelected(row.id); }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(row.id)}
                                                aria-label={`Select ${row.name || row.id}`}
                                                onChange={() => { /* the cell owns the gesture */ }}
                                            />
                                        </td>
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
                                        {/* The delete affordance of the design: a
                                            trash glyph at the end of the row, quiet
                                            until hovered. It does not delete — it
                                            opens the preflight, which is the whole
                                            of ratified rule 1. */}
                                        <td className="instance-manager__td-del">
                                            <i
                                                className="bi bi-trash instance-manager__trash"
                                                title={`Delete ${row.name || row.id}`}
                                                role="button"
                                                aria-label={`Delete ${row.name || row.id}`}
                                                onClick={e => { e.stopPropagation(); openDelete(row.id); }}
                                            />
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
                {isMulti && multi ? (
                    <MultiForm
                        model={multi}
                        touched={bulkTouched}
                        onTouch={(key, value) => setBulkTouched(prev => ({ ...prev, [key]: value }))}
                        onApply={applyBulkEdit}
                        onClear={() => setBulkTouched({})}
                        onDelete={openMultiDelete}
                    />
                ) : subjectId ? (
                    <>
                        {/* The breadcrumb of 12c: «il breadcrumb tiene la strada del
                            containment. Ogni segmento e' cliccabile». Present only once
                            a drill-in has happened — a form sitting on its own subject
                            has a road of one step, and printing it would be noise. */}
                        {crumbs.length > 1 && (
                            <nav className="instance-manager__crumbs" aria-label="Containment path">
                                {crumbs.map(c => (
                                    <span key={c.id + ':' + c.depth} className="instance-manager__crumb-wrap">
                                        {c.isCurrent ? (
                                            <span className="instance-manager__crumb instance-manager__crumb--current">
                                                {crumbLabel(c)}
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                className="instance-manager__crumb"
                                                onClick={() => setNav(prev => (prev ? truncateTo(prev, c.depth) : prev))}
                                            >
                                                {crumbLabel(c)}
                                            </button>
                                        )}
                                        {!c.isCurrent && <i className="bi bi-chevron-right instance-manager__crumb-sep" aria-hidden="true" />}
                                    </span>
                                ))}
                            </nav>
                        )}

                        <IRForm objectId={formSubjectId ?? subjectId} />

                        {/* The depth rule of 12c, and it is ONE comparison:
                            `rendersInline(formDepth)`. At depth 0 a contained child is
                            edited INLINE, in its own form nested under the parent's; at
                            depth 1 and beyond the same children render as links that
                            drill in, replacing the body of this one form.

                            The nesting is done HERE and not inside `IRFormField`, for
                            the reason the children bar below already states: giving the
                            form's own children group a second behaviour means threading
                            a callback through `IRForm` -> `IRFormField` -> `ListWidget`,
                            three components this tab HOSTS unchanged (2a) and that the
                            canvas rail mounts too. Same seam, same reason. */}
                        {inlineChildren.length > 0 && (
                            <div className="instance-manager__inline">
                                {inlineChildren.map(slot => (
                                    <div className="instance-manager__inline-slot" key={slot.key}>
                                        <h3 className="instance-manager__eyebrow">
                                            {slot.key}
                                            <span className="instance-manager__draft-card">{slot.of}</span>
                                        </h3>
                                        {slot.ids.map(childId => (
                                            rendersInline(formDepth) ? (
                                                <div className="instance-manager__inline-child" key={childId}>
                                                    <button
                                                        type="button"
                                                        className="instance-manager__inline-open"
                                                        title="Open this child as the form body"
                                                        onClick={() => drillTo(childId, slot.key)}
                                                    >
                                                        {crumbLabel(navStepOf(idlookup, childId) ?? { id: childId, name: '', cls: slot.of, childKey: null })}
                                                        <i className="bi bi-box-arrow-in-right" aria-hidden="true" />
                                                    </button>
                                                    <IRForm objectId={childId} />
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="instance-manager__inline-link"
                                                    key={childId}
                                                    onClick={() => drillTo(childId, slot.key)}
                                                >
                                                    {crumbLabel(navStepOf(idlookup, childId) ?? { id: childId, name: '', cls: slot.of, childKey: null })}
                                                    <i className="bi bi-chevron-right" aria-hidden="true" />
                                                </button>
                                            )
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
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

            {pendingMulti && (
                <MultiDeleteDialog
                    pre={pendingMulti}
                    reassignTo={multiReassignTo}
                    onReassignTo={setMultiReassignTo}
                    onCancel={() => setPendingMulti(null)}
                    onConfirm={confirmMultiDelete}
                />
            )}

            {pending && (
                <DeleteDialog
                    pre={pending}
                    reassignTo={reassignTo}
                    onReassignTo={setReassignTo}
                    onCancel={() => setPending(null)}
                    onConfirm={confirmDelete}
                />
            )}

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
