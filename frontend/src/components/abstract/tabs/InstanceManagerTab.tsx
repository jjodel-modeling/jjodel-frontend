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

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
import { autoLayoutRows, inputFromDraftField } from '../../editor-v2/viewpoint/ir/formAutoLayout';
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
    Ego,
    EgoNode,
    NavState,
    OutlineMenu,
    OutlineMenuEntry,
    OutlineNode,
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
    egoDispatch,
    egoLabel,
    egoLayout,
    egoNeighborhood,
    egoShowAll,
    egoSummary,
    multiModel,
    navFor,
    childMenu,
    newDraft,
    newInstanceReason,
    optionSlotClass,
    outlineLabel,
    outlineOpenByDefault,
    rendersInline,
    rootMenu,
    setDraftRef,
    setDraftRefMany,
    setDraftValue,
    truncateTo,
    unionPreflight,
} from '../../../jjform';
import { childrenIn, multiInstancesOf, navStepOf, pathTo } from '../../editor-v2/hooks/multiDraw';
import { outlineRows, outlineTree } from '../../editor-v2/hooks/outlineDraw';
import { egoInputOf } from '../../editor-v2/hooks/neighborhoodDraw';
import { openInCanvas } from '../../editor-v2/hooks/neighborhoodAdapter';
import EgoDiagram from './EgoDiagram';
import { applyBulk } from '../../editor-v2/hooks/multiAdapter';
import {
    instanceCountsByClass,
    instancesOfClass,
    modelIdOfObject,
    uninstantiableReason,
} from './instanceManagerModel';
import {
    PAGE_SIZE,
    autoHiddenColumnKeys,
    columnToggles,
    discriminantEnum,
    duplicateNameColumnKeys,
    emptyColumnKeys,
    filterBySegment,
    filterRowsByName,
    mostPopulatedClassId,
    pageCount,
    pageOf,
    shownColumnsWith,
    tableColumns,
    tableRow,
    toCsv,
    type ColumnOverrides,
    type Discriminant,
    type TableCell,
    type TableRow,
} from './instanceTable';
import { entityLetter } from '../../../common/entityMeta';
import { saveProjectWithFeedback } from '../../../common/libraries/saveProject';
import { LProject } from '../../../joiner';
import './instanceManagerTab.scss';

/** La lettera del badge di metaclasse, dal registro delle entita' e non da una
 *  costante locale: `entityMeta` e' la sola fonte del vocabolario di badge del DS,
 *  e una `'C'` scritta a mano qui e' la seconda copia che il giorno in cui il
 *  registro cambia resta indietro senza errore di compilazione. Risolta una volta
 *  al modulo: e' costante. */
const CLASS_LETTER = entityLetter('class');

/** L'assenza di scelte, condivisa. Un `{}` scritto in linea sarebbe un oggetto
 *  NUOVO a ogni render, e i tre `useMemo` che lo hanno fra le dipendenze si
 *  ricalcolerebbero sempre — una tabella che ricostruisce le proprie colonne a
 *  ogni battuta nel filtro. */
const EMPTY_OVERRIDES: Readonly<Record<string, boolean>> = Object.freeze({});

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
            // One colour per alternative: the literals of one enumeration never share a
            // slot, so two values a modeller is choosing between never read the same.
            // Across enumerations they may, and that is the rule, not a collision.
            return (
                <span
                    className={`instance-manager__chip${optionSlotClass('instance-manager__chip', cell.slot ?? null)}`}
                    title={cell.text}
                >{cell.text}{extra}</span>
            );

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
 *
 * ── FL4: the same layout as the edit form, not a second one ───────────────────
 *
 * The body is packed by `formAutoLayout.autoLayoutRows` — the same call `IRForm` makes,
 * over the same width registry — and it renders into `ir-form__row` / `ir-form__cell`, the
 * same two grid classes. A `DraftField` and a `FormFieldDescriptor` are different types, so
 * the adapter projects both onto FL1's input; what they must NOT be is two geometries for
 * the same metaclass, which is what a create dialogue laid out by hand would be.
 *
 * The CONTROLS stay the draft's own. A draft has no slots and no write path — «this
 * component holds NO model state and writes nothing» — while every extended widget of FL3
 * commits through one. Sharing the geometry and not the controls is the line that keeps
 * this dialogue transactional.
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
            // A MULTIVALUED reference (CRUD2). `values` is present only on those, so
            // the branch is the engine's answer and not a second parse of the
            // multiplicity string this component happens to print two lines above.
            //
            // Chips for what is chosen, a select that ADDS — the pattern the edit
            // form already uses for a multivalued slot (`ChipInputWidget` + a
            // picker). What is NOT shared is the picker itself: `ReferencePicker`
            // is mono-selection and lives in `viewpoint/ir/`, whose widgets all
            // commit through a slot. A draft has no slot and no write path, and
            // «sharing the geometry and not the controls is the line that keeps this
            // dialogue transactional» — the docstring above, honoured rather than
            // quoted. So the control is the draft's own, and the critical zone is
            // not entered for a dialogue that writes nothing.
            if (f.values) {
                const chosen = f.values;
                const label = (id: string) => f.options.find(o => o.id === id)?.label ?? id;
                // Only what is not already taken: an option that re-adds a chip
                // already on screen is an option that does nothing, and `setDraftRefMany`
                // would drop it anyway.
                const rest = f.options.filter(o => !chosen.includes(o.id));
                return (
                    <div className="instance-manager__draft-multi">
                        {chosen.length > 0 && (
                            <div className="instance-manager__draft-chips">
                                {chosen.map(id => (
                                    <span className="instance-manager__chip instance-manager__draft-chip" key={id}>
                                        {label(id)}
                                        <button
                                            type="button"
                                            className="instance-manager__draft-chip-x"
                                            aria-label={`Remove ${label(id)}`}
                                            onClick={() => onChange(setDraftRefMany(
                                                draft, f.key, chosen.filter(x => x !== id)))}
                                        >
                                            <i className="bi bi-x" aria-hidden="true" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                        <select
                            {...common}
                            value=""
                            disabled={rest.length === 0}
                            onChange={e => {
                                const id = e.target.value;
                                if (id) onChange(setDraftRefMany(draft, f.key, [...chosen, id]));
                            }}
                        >
                            <option value="">
                                {rest.length === 0
                                    ? (f.options.length === 0
                                        ? `No ${f.typeName} to point at`
                                        : `All ${f.typeName}s are already chosen`)
                                    : `Add a ${f.typeName}…`}
                            </option>
                            {rest.map(o => (
                                <option key={o.id} value={o.id}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                );
            }
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

    // The geometry, from the same packer the edit form uses. No annotations are threaded in:
    // a draft is built from the metaclass shape and the host that would read `jjodel/renderer`
    // off the D graph is `IRForm`, not this dialogue — rung 2 simply does not fire here, which
    // the ladder answers by falling through to rung 3 rather than by blanking the field.
    const rows = autoLayoutRows(model.fields.map(inputFromDraftField));
    const byKey = new Map(model.fields.map(f => [f.key, f]));

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
                    ) : rows.map((row, ri) => (
                        <div className="ir-form__row" key={`draft-row-${ri}`} data-free={row.free}>
                            {row.fields.map(lf => {
                                const f = byKey.get(lf.key);
                                if (!f) return null;
                                return (
                                    <div
                                        className="ir-form__cell"
                                        key={f.key}
                                        style={{ ['--ir-form-span' as any]: String(lf.span) }}
                                        data-width-kind={lf.kind}
                                        data-width-rung={lf.rung}
                                    >
                                        <div className="instance-manager__draft-field">
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
                                    </div>
                                );
                            })}
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

/**
 * OutlinePanel — l'albero di containment del modello (slice 10b, mock 1b di
 * `Q8 Catalogo vs Outline.dc.html`).
 *
 * Q8, ri-sciolta col peso di 2c: «non e' un aut-aut, e' una divisione di ruoli». Questo
 * pannello AFFIANCA il catalogo, non lo sostituisce — «outline per il dove,
 * tabella per il quanto», la nota del design, che e' il layout contract di questa
 * slice. La tabella per metaclasse resta con il suo `New`, e i due gesti emettono
 * lo STESSO evento.
 *
 * ── Un motore in meno, non uno in piu' ────────────────────────────────────────
 *
 * Il pannello non ha regole proprie. L'albero e' `outlineDraw.outlineTree`, il
 * menu del «+» e' `jjform.childMenu` / `jjform.rootMenu` — cioe' `addChildReason`
 * e `newInstanceReason`, le stesse due funzioni che la barra «Add contained» e la
 * toolbar della tabella gia' chiamano — e la create e' `openCreate(cls, ownerId,
 * childKey)`, invariata. La form del nodo selezionato e' la STESSA `IRForm` del
 * manager: l'outline e' una superficie di navigazione in piu', non un motore in
 * piu'.
 *
 * ── Due gesti, distinti apposta ───────────────────────────────────────────────
 *
 * Il chevron APRE, la riga SELEZIONA. Il mock e' una figura statica e non mostra
 * il chevron; e' l'unica aggiunta al disegno, ed e' quella che evita l'alternativa
 * — un click che seleziona E apre — in cui non si puo' guardare la form di un nodo
 * senza sfogliargli sotto i figli.
 *
 * ── Il genere dell'icona viene da entityMeta (10e) ────────────────────────────
 *
 * Non da una tabella locale. 10b ne dipingeva una — scatola per il modello,
 * cartella per chi ha figli, cerchio per chi non ne ha — e quella regola diceva
 * *struttura*, non *tipo*, duplicando cio' che il chevron dice gia' due pixel a
 * sinistra. Ora il glifo esce da `ENTITY_META`, che e' la sola sorgente del
 * vocabolario di icone del DS, e porta il foreground della coppia di entita'.
 *
 * Un puntatore morto resta fuori dalla mappa: non e' un genere di entita', e' uno
 * stato, e tiene il triangolo col token dell'errore — la cosa che 12d dice non
 * debba sparire in silenzio.
 */
function OutlinePanel({
    rows, subjectId, isOpen, hasSlots, menuFor, menuOf,
    onToggle, onSelect, onMenu, onCreate,
}: {
    rows: OutlineNode[];
    subjectId: string | null;
    isOpen: (node: OutlineNode) => boolean;
    hasSlots: (node: OutlineNode) => boolean;
    menuFor: string | null;
    menuOf: (node: OutlineNode) => OutlineMenu;
    onToggle: (node: OutlineNode) => void;
    onSelect: (node: OutlineNode) => void;
    onMenu: (node: OutlineNode) => void;
    onCreate: (node: OutlineNode, entry: OutlineMenuEntry) => void;
}) {
    /* 10f — il badge quadrato lettera al posto del glifo, che e' lo stesso
       vocabolario che il rail delle metaclassi porta due colonne a sinistra
       (10c): quadrato, `--radius-sm`, coppia pastello/saturato dei token di
       entita'. Due pannelli affiancati che dicono «metaclasse» in due alfabeti
       diversi — un'icona qui, una lettera li' — sono due vocabolari, non uno.

       La LETTERA non e' quella del rail. Il rail scrive `entityLetter('class')`,
       cioe' `C`, perche' li' la lettera dice il TIPO dell'elemento e il nome gli
       sta accanto. Qui il tipo e' lo stesso su OGNI riga — F3 di 10e: una riga
       dell'outline e' sempre un `DObject` la cui metaclasse e' una `DClass` — e
       una colonna di `C` sarebbe la monotonia di 10e con un glifo diverso. La
       lettera e' l'iniziale della METACLASSE (`S` State, `T` Transition, `I`
       Initial) e il colore resta uno solo: la famiglia la dice la coppia,
       l'individuo la dice la lettera.

       Le iniziali collidono — State e StateMachine danno entrambe `S` — e non e'
       un difetto da risolvere qui: la classe in mono a destra della riga e' la
       disambiguazione, ed e' li' dal 10b.

       `broken` NON prende un badge. Non ha una metaclasse da cui trarre una
       lettera (`cls` e' vuoto per costruzione, `jjform/outline.ts`), e un
       quadrato vuoto direbbe «istanza senza nome» invece di «puntatore morto»:
       tiene il triangolo col token dell'errore, che e' cio' che 12d impone. */
    const badgePair = (node: OutlineNode): string =>
        node.kind === 'model' ? 'jj-type-badge--model' : 'jj-type-badge--class';

    /* `entityLetter('model')` e' gia' `m` minuscola nel registro: il badge del
       modello non ha un caso speciale, ha la stessa fonte degli altri. Il
       fallback su `entityLetter('class')` copre l'oggetto senza metaclasse — che
       il dominio non produce — perche' un quadrato vuoto e' peggio di una `C`. */
    const badgeLetter = (node: OutlineNode): string => {
        if (node.kind === 'model') return entityLetter('model');
        const initial = (node.cls ?? '').trim().charAt(0);
        return initial ? initial.toUpperCase() : entityLetter('class');
    };

    return (
        <aside className="instance-manager__pane instance-manager__pane--outline">
            <h3 className="instance-manager__eyebrow">Model outline</h3>
            {rows.length === 0 ? (
                <p className="instance-manager__note">No model resolved.</p>
            ) : (
                <ul className="instance-manager__list instance-manager__outline">
                    {rows.map(node => {
                        const menu = menuFor === node.id ? menuOf(node) : null;
                        const selectable = node.kind === 'object';
                        return (
                            <li
                                className="instance-manager__outline-item"
                                key={node.id + '@' + node.depth + ':' + (node.childKey ?? '')}
                            >
                                <div
                                    className={
                                        'instance-manager__outline-node'
                                        + (node.kind === 'model' ? ' instance-manager__outline-node--model' : '')
                                        + (node.id === subjectId ? ' instance-manager__outline-node--selected' : '')
                                        + (node.kind === 'broken' ? ' instance-manager__outline-node--broken' : '')
                                    }
                                    /* 14px d'inserto e 16px per livello: le misure del
                                       mock 1b, che sono le stesse del resto del pannello
                                       (l'inserto e' quello di railSystem) e non hanno un
                                       token — come il 14px del pane. */
                                    style={{ paddingLeft: 14 + node.depth * 16 }}
                                    title={node.kind === 'broken' ? `Dangling pointer: ${node.id}` : outlineLabel(node)}
                                    onClick={selectable ? () => onSelect(node) : undefined}
                                    role={selectable ? 'button' : undefined}
                                    tabIndex={selectable ? 0 : undefined}
                                    onKeyDown={selectable ? e => {
                                        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(node); }
                                    } : undefined}
                                >
                                    {node.children.length > 0 ? (
                                        <button
                                            type="button"
                                            className="instance-manager__outline-caret"
                                            aria-label={isOpen(node) ? `Collapse ${outlineLabel(node)}` : `Expand ${outlineLabel(node)}`}
                                            aria-expanded={isOpen(node)}
                                            onClick={e => { e.stopPropagation(); onToggle(node); }}
                                        >
                                            <i className={'bi ' + (isOpen(node) ? 'bi-chevron-down' : 'bi-chevron-right')} aria-hidden="true" />
                                        </button>
                                    ) : (
                                        <span className="instance-manager__outline-caret" aria-hidden="true" />
                                    )}

                                    {node.kind === 'broken' ? (
                                        <i className="bi bi-exclamation-triangle instance-manager__outline-icon" aria-hidden="true" />
                                    ) : (
                                        <span
                                            className={'instance-manager__outline-badge ' + badgePair(node)}
                                            aria-hidden="true"
                                        >{badgeLetter(node)}</span>
                                    )}

                                    <span className="instance-manager__outline-name">{outlineLabel(node)}</span>

                                    {node.cls && <span className="instance-manager__code">{node.cls}</span>}

                                    {hasSlots(node) && (
                                        <button
                                            type="button"
                                            className="instance-manager__outline-add"
                                            title={`Add inside ${outlineLabel(node)}`}
                                            aria-label={`Add inside ${outlineLabel(node)}`}
                                            aria-expanded={menuFor === node.id}
                                            onClick={e => { e.stopPropagation(); onMenu(node); }}
                                        >
                                            <i className="bi bi-plus-square" aria-hidden="true" />
                                        </button>
                                    )}
                                </div>

                                {/* Il menu dei child-slot leciti di QUEL nodo. Una voce
                                    bloccata e' ASSENTE dalle offerte e presente come
                                    frase — mai una riga grigia che non dice perche'
                                    (Regola 1 del Livello 2, terza superficie che la
                                    osserva). Sul nodo modello le sole rootable. */}
                                {menu && (
                                    <div className="instance-manager__outline-menu" role="menu">
                                        {menu.entries.map(entry => (
                                            <button
                                                type="button"
                                                role="menuitem"
                                                className="instance-manager__outline-menu-item"
                                                key={(entry.childKey ?? '') + ':' + entry.cls}
                                                onClick={e => { e.stopPropagation(); onCreate(node, entry); }}
                                            >
                                                <i className="bi bi-plus" aria-hidden="true" />
                                                {entry.label}
                                                {entry.childKey && (
                                                    <span className="instance-manager__code">{entry.childKey}</span>
                                                )}
                                            </button>
                                        ))}
                                        {menu.entries.length === 0 && menu.blocked.length === 0 && (
                                            <p className="instance-manager__note">Nothing can be created here.</p>
                                        )}
                                        {menu.blocked.map(block => (
                                            <p className="instance-manager__child-reason" key={block.key} title={block.reason}>
                                                {block.reason}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </aside>
    );
}

/**
 * EgoRow — il vicinato a un salto DENTRO la riga espansa (FL6).
 *
 * ── Che cosa aggiunge a `EgoDiagram` ──────────────────────────────────────────
 *
 * Una decisione sola: se il nastro ci sta. `EgoDiagram` disegna, e il suo disegno
 * ha una larghezza NOTA — `egoLayout(ego).width`, aritmetica pura sul vicinato —
 * quindi la soglia non e' un numero inventato ne' una media del viewport: e'
 * quanto quel disegno misura, confrontato con quanto la tabella gli lascia. Sopra
 * la soglia il nastro; sotto, la lista testuale, stessi dati e stessi click.
 *
 * La misura arriva dal padre (`hostWidth`, un solo `ResizeObserver` sul
 * contenitore di scorrimento della tabella) e NON dal viewport: una finestra larga
 * con l'outline aperto e dodici colonne lascia alla riga meno spazio di una
 * finestra stretta con la tabella sola, e la media direbbe il contrario.
 *
 * ── Perche' la scatola ha una larghezza in pixel ──────────────────────────────
 *
 * Perche' vive in un `<td colSpan>`, e in `table-layout: auto` la larghezza
 * MINIMA del contenuto di una cella spinge la tabella. Un nastro da 900px dentro
 * una riga espansa allargherebbe ogni altra riga: la riga espandibile esiste per
 * evitare lo scorrimento orizzontale, non per introdurlo. Fissandola a
 * `hostWidth` la cella non puo' chiedere piu' di quanto il contenitore ha, e
 * `position: sticky` la tiene in vista se la tabella scorre per le sue colonne.
 */
function EgoRow({ ego, hostWidth, onSelect, onOpenInCanvas }: {
    ego: Ego;
    /** Quanto misura il contenitore di scorrimento della tabella, adesso. */
    hostWidth: number;
    onSelect: (instanceId: string) => void;
    onOpenInCanvas: () => void;
}) {
    const drawnWidth = useMemo(() => egoLayout(ego).width, [ego]);
    // `hostWidth` a 0 e' «non ancora misurato», non «larghezza zero»: al primo
    // render l'osservatore non ha ancora parlato, e degradare in quell'istante
    // farebbe lampeggiare la lista su ogni apertura.
    const narrow = hostWidth > 0 && hostWidth < drawnWidth;

    return (
        <div
            className="instance-manager__ego"
            style={hostWidth > 0 ? { width: hostWidth } : undefined}
        >
            {narrow ? (
                <EgoList ego={ego} onSelect={onSelect} onOpenInCanvas={onOpenInCanvas} />
            ) : (
                <EgoDiagram ego={ego} onSelect={onSelect} onOpenInCanvas={onOpenInCanvas} />
            )}
        </div>
    );
}

/**
 * EgoList — lo stesso vicinato, quando il nastro non ci sta.
 *
 * Clausola della specifica ratificata («textual list where space is narrow»,
 * `form-autolayout-spec.md`, Related manager decisions) e punto aperto 2 del
 * referto FL5, che qui si chiude.
 *
 * ── Non e' un secondo disegno ─────────────────────────────────────────────────
 *
 * Legge lo STESSO `Ego` — stessa proiezione, stessa precedenza, stesso cap, stessi
 * conteggi — e instrada il click dagli STESSI due puri, `egoDispatch` e
 * `egoShowAll`. Cio' che cambia e' soltanto la geometria: gruppi impilati invece
 * di colonne affiancate, e niente frecce ne' linea di contenimento, perche'
 * l'intestazione del gruppo dice il legame meglio di quanto un tratto lungo 12px
 * lo direbbe.
 *
 * Il gruppo «this object» c'e' anche qui, in mezzo: e' cio' che rende leggibile
 * l'ordine: chi mi possiede, chi entra, chi sono, chi esco a toccare.
 */
function EgoList({ ego, onSelect, onOpenInCanvas }: {
    ego: Ego;
    onSelect: (instanceId: string) => void;
    onOpenInCanvas: () => void;
}) {
    const handlers = useMemo(() => ({ onSelect, onOpenInCanvas }), [onSelect, onOpenInCanvas]);
    const isolated = ego.counts.incoming === 0
        && ego.counts.outgoing === 0
        && ego.counts.referencedBy === 0;

    const entry = (node: EgoNode) => {
        const clickable = node.kind !== 'broken';
        const activate = () => egoDispatch(node, handlers, ego.subject.id);
        return (
            <li
                key={node.side + ':' + node.id}
                className={
                    'instance-manager__ego-item'
                    + (node.kind === 'more' ? ' instance-manager__ego-item--more' : '')
                    + (node.kind === 'broken' ? ' instance-manager__ego-item--broken' : '')
                }
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                title={node.featureKeys.length > 0 ? `via ${node.featureKeys.join(', ')}` : undefined}
                onClick={clickable ? activate : undefined}
                onKeyDown={clickable ? e => {
                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
                } : undefined}
            >
                <span className="instance-manager__ego-name">{egoLabel(node)}</span>
                {node.kind === 'broken' ? (
                    <span className="instance-manager__broken">
                        <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
                        broken
                    </span>
                ) : node.cls ? (
                    <span className="instance-manager__ego-cls">{node.cls}</span>
                ) : null}
                {node.featureKeys.length > 0 && (
                    <span className="instance-manager__ego-via">{node.featureKeys.join(', ')}</span>
                )}
            </li>
        );
    };

    /** Un gruppo vuoto non si rende: e' la stessa regola del nastro, dove una
     *  colonna senza vicini non occupa spazio invece di occuparne a vuoto. */
    const group = (title: string, nodes: EgoNode[]) => (nodes.length === 0 ? null : (
        <div className="instance-manager__ego-group">
            <h4 className="instance-manager__ego-group-title">{title}</h4>
            <ul className="instance-manager__ego-items">{nodes.map(entry)}</ul>
        </div>
    ));

    return (
        <div className="instance-manager__ego-list">
            <div className="instance-manager__ego-head">
                <span className="instance-manager__eyebrow">Neighborhood · 1 hop</span>
                <span className="instance-manager__ego-hint">
                    click a node to select it ·{' '}
                    <button type="button" className="instance-manager__ego-link" onClick={onOpenInCanvas}>
                        open in canvas
                    </button>
                </span>
            </div>

            {/* L'owner in testa (FL7), dove il nastro lo mette sopra: il
                contenimento si legge prima dei riferimenti. Solo quando ha un
                nodo suo — un owner che e' anche un vicino e' gia' in uno dei due
                gruppi, e una seconda voce con lo stesso nome direbbe due
                istanze. */}
            {ego.owner?.side === 'owner' && group('owner', [ego.owner])}

            {group('incoming', ego.incoming)}

            <div className="instance-manager__ego-group">
                <h4 className="instance-manager__ego-group-title">this object</h4>
                <ul className="instance-manager__ego-items">
                    <li className="instance-manager__ego-item instance-manager__ego-item--subject">
                        <span className="instance-manager__ego-name">{egoLabel(ego.subject)}</span>
                        {ego.subject.cls && (
                            <span className="instance-manager__ego-cls">{ego.subject.cls}</span>
                        )}
                    </li>
                </ul>
            </div>

            {group('outgoing', ego.outgoing)}

            <div className="instance-manager__ego-foot">
                <span className="instance-manager__ego-counts">{egoSummary(ego.counts)}</span>
                {!isolated && (
                    <button
                        type="button"
                        className="instance-manager__ego-link"
                        title="Open the canvas filtered on this instance"
                        onClick={() => egoShowAll(handlers)}
                    >
                        show all
                    </button>
                )}
            </div>
        </div>
    );
}

/** La larghezza massima che il pannello Columns puo' prendere. Serve DUE volte e
 *  deve essere lo stesso numero in entrambe: qui, per non spingere il pannello
 *  oltre il bordo destro della finestra, e in `&__columns-panel` come `max-width`.
 *  Se i due valori divergessero, il clamp misurerebbe una scatola che non e'
 *  quella dipinta e il pannello uscirebbe di nuovo — dal viewport, stavolta. */
const COLUMNS_PANEL_MAX_W = 280;

/** Geometria `fixed` del pannello Columns a partire dal rect del suo bottone
 *  (10k-chiusura). Il pannello e' portato su `document.body`, quindi le
 *  coordinate sono quelle del viewport e non serve nessun antenato posizionato.
 *
 *  Perche' `fixed` e non piu' `absolute` dentro la card: `__pane--table` porta
 *  `overflow: hidden` — glielo chiede il raccordo dei raggi su testata e righe,
 *  ed e' asserito da 10k — e un figlio in `absolute` viene clippato da
 *  quell'antenato. Il pannello finiva tagliato al bordo basso della card,
 *  visibile fino a meta' elenco. Togliere l'`overflow` avrebbe rotto i raccordi:
 *  esce il pannello, non la clip.
 *
 *  Ribalta sopra il bottone quando sotto non c'e' spazio, e stringe al viewport
 *  su entrambi gli assi: e' lo stesso idioma di `TextStyleField`, che risolve
 *  esattamente questo problema in un altro pannello di questo repo. */
function computeColumnsPanelStyle(rect: DOMRect): React.CSSProperties {
    const GAP = 4, MARGIN = 8, PREF = 220, MAX_H = 320;
    const spaceBelow = window.innerHeight - rect.bottom - MARGIN;
    const spaceAbove = rect.top - MARGIN;
    const openUp = spaceBelow < PREF && spaceAbove > spaceBelow;
    const maxHeight = Math.max(140, Math.min(MAX_H, (openUp ? spaceAbove : spaceBelow) - GAP));
    const left = Math.max(MARGIN, Math.min(rect.left, window.innerWidth - COLUMNS_PANEL_MAX_W - MARGIN));
    const base: React.CSSProperties = { left, maxHeight };
    return openUp
        ? { ...base, bottom: window.innerHeight - rect.top + GAP }
        : { ...base, top: rect.bottom + GAP };
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
    /** L'outline (10b). SOLO due stati locali, ed e' deliberato: l'albero NON e'
     *  tenuto qui. Tutto il tab pende da una sola `useSelector(state.idlookup)` e
     *  l'outline e' un `useMemo` sulla stessa sorgente — tenerne una copia in stato
     *  locale sarebbe l'unico modo di far divergere il pannello dalla tabella.
     *
     *  `expanded` e' un OVERRIDE, non l'apertura: assente significa «come
     *  `outlineOpenByDefault` dice», presente significa «l'utente ha detto». Un
     *  default calcolato e memorizzato al primo render avrebbe fissato l'albero di
     *  quel momento, e un figlio nato dopo sarebbe nato chiuso sotto un padre che
     *  nessuno ha mai chiuso. */
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [menuFor, setMenuFor] = useState<string | null>(null);
    /** 10c — la sezione VIEWS del rail. L'outline diventa una VISTA che si apre e
     *  si chiude, e non piu' una colonna che c'e' e basta: il rail e' il posto in
     *  cui si sceglie cosa guardare, e una vista senza interruttore in quel posto
     *  e' l'unica che non si puo' scegliere. Aperta di default — e' lo stato in
     *  cui 10b l'ha consegnata, e chiuderla d'ufficio sarebbe una regressione di
     *  superficie travestita da default. */
    const [showOutline, setShowOutline] = useState(true);
    /** Il literal selezionato nel segmented, `''` per «All». Una stringa e non un
     *  indice: gli indici di un enum cambiano quando il metamodello cambia, e un
     *  filtro che dopo una modifica del metamodello punta a un altro literal e'
     *  peggio di uno che si azzera. */
    const [segment, setSegment] = useState('');
    /** La pagina corrente, 1-based. Pinzata da `pageOf`, quindi non serve tenerla
     *  in bolla con il numero di righe: una pagina 7 su tre pagine RENDE la terza,
     *  invece di rendere il vuoto e aspettare un effetto che la corregga. */
    const [page, setPage] = useState(1);
    /** Le scelte esplicite su quali colonne vedere, PER METACLASSE.
     *
     *  Una mappa sola annidata, e non uno stato che si azzera cambiando
     *  metaclasse: le colonne di `State` e quelle di `Transition` non sono le
     *  stesse colonne, e un record piatto le farebbe collidere sulla prima
     *  chiave omonima — due metamodelli su tre hanno un `kind` da qualche parte.
     *  Vive nello stato del tab e non in `localStorage`: e' la posizione di uno
     *  sguardo dentro una sessione, non una preferenza dell'utente, e R-RAIL-11
     *  chiude la lista delle chiavi che sopravvivono al reload. */
    const [columnChoice, setColumnChoice] = useState<Record<string, ColumnOverrides>>({});
    /** Il pannello Columns e' aperto. Un booleano e non l'id della metaclasse:
     *  il pannello e' uno, appeso al proprio bottone. */
    const [columnsOpen, setColumnsOpen] = useState(false);
    const columnsRef = useRef<HTMLDivElement | null>(null);
    /** Il pannello vive su `document.body` (portale), quindi NON e' piu' dentro
     *  `columnsRef`: il click-fuori deve interrogare due nodi, il gruppo del
     *  bottone e il pannello. Con il solo `columnsRef` ogni spunta chiuderebbe
     *  il pannello che si sta usando. */
    const columnsPanelRef = useRef<HTMLDivElement | null>(null);
    /** Il rect del bottone al momento dell'apertura: e' l'unica cosa da cui la
     *  geometria `fixed` puo' nascere, e viene ricalcolato a scroll e resize. */
    const [columnsRect, setColumnsRect] = useState<DOMRect | null>(null);

    /** SAVE1 — il salvataggio in volo. L'UNICO stato che il bottone «Save
     *  project» tiene, e deliberatamente: NON tiene una nozione di «sporco».
     *
     *  Misurato: `U.isProjectModified` e' un `public static boolean` su `U`
     *  (`common/U.tsx:211`), non un campo dello store; `ProjectsApi.save` lo
     *  rimette a `false` (`api/persistance/projects.ts:133`) senza emettere
     *  azione ne' evento, e `IRForm.tsx` gia' dichiara nel proprio sorgente che
     *  «subscribing to the flag is not possible (it is a plain static)». Un
     *  `disabled={!U.isProjectModified}` sarebbe quindi letto al render e mai
     *  invalidato: dopo una modifica fatta altrove — la canvas, un altro tab —
     *  il bottone resterebbe SPENTO con il progetto sporco, cioe' il salvataggio
     *  diventerebbe irraggiungibile proprio quando serve. Il prompt di SAVE1
     *  prevede questo esito: «se il flag non e' esposto in modo affidabile,
     *  sempre attivo». Sempre attivo, e nessuna nozione di dirty nuova. */
    const [saving, setSaving] = useState(false);

    /* Chiusura del pannello: click fuori ed Esc.
     *
     * `mousedown` e non `click`: un click che parte dentro il pannello e finisce
     * fuori (il trascinamento di una selezione di testo) arriva a `window` come
     * un click sul documento, e chiuderebbe il pannello mentre lo si sta usando.
     * Il listener e' montato SOLO da aperto — un handler globale che gira
     * sempre per uno stato che e' falso quasi sempre e' costo senza lavoro.
     *
     * Scroll e resize CHIUDONO invece di riposizionare: il pannello e' ancorato
     * a un bottone che vive in una barra dentro una card che scorre, e un
     * popover `fixed` che resta fermo mentre il suo ancoraggio scivola via e'
     * peggio di un popover che non c'e' piu'. Lo scroll e' in cattura — quello
     * degli antenati non bolla — e ignora lo scroll INTERNO del pannello, che e'
     * il gesto con cui si scorre un elenco di venti colonne. */
    useEffect(() => {
        if (!columnsOpen) return;
        const onDown = (e: MouseEvent) => {
            const t = e.target as Node;
            if (columnsRef.current?.contains(t) || columnsPanelRef.current?.contains(t)) return;
            setColumnsOpen(false);
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setColumnsOpen(false); };
        const onScroll = (e: Event) => {
            if (columnsPanelRef.current?.contains(e.target as Node)) return;
            setColumnsOpen(false);
        };
        const onResize = () => setColumnsOpen(false);
        window.addEventListener('mousedown', onDown);
        window.addEventListener('keydown', onKey);
        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', onResize);
        return () => {
            window.removeEventListener('mousedown', onDown);
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('resize', onResize);
        };
    }, [columnsOpen]);

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

    /** L'enum discriminante, letto dalla shape. `null` quando la metaclasse non ne
     *  ha uno, e allora il segmented non si rende affatto. */
    const discriminant: Discriminant | null = useMemo(
        () => (classShape ? discriminantEnum(classShape, shapeCtx.shape()) : null),
        [classShape, shapeCtx],
    );

    /** La colonna `name` che RIPETE la colonna fissa dei nomi su ogni riga
     *  (10k punto 4). Tenuta a parte da `hiddenColumnKeys` solo per poterne dire
     *  la ragione: nel canale della riduzione ci entra subito qui sotto. */
    const duplicateKeys = useMemo(() => duplicateNameColumnKeys(rows, columns), [rows, columns]);

    /** Le colonne che la tabella riduce DA SE': quelle interamente vuote, piu' il
     *  doppione dei nomi. Misurate su TUTTE le righe della metaclasse, non sulle
     *  filtrate: una misura che dipendesse dal filtro farebbe cambiare forma alla
     *  tabella a ogni battuta.
     *
     *  UN canale solo, e non due: `shownColumnsWith`, `autoHiddenColumnKeys` e
     *  `columnToggles` leggono tutti questo array, quindi l'override del pannello
     *  vince sul doppione esattamente come vince sulle vuote, e l'indicatore lo
     *  conta come auto-nascosto finche' l'utente non si esprime. Un secondo array
     *  avrebbe voluto dire un secondo posto in cui una colonna puo' sparire. */
    const hiddenColumnKeys = useMemo(
        () => [...emptyColumnKeys(rows, columns), ...duplicateKeys],
        [rows, columns, duplicateKeys],
    );

    /** Gli override della metaclasse corrente. `{}` quando non ci si e' ancora
     *  espressi, che e' il caso in cui la riduzione automatica vale intera. */
    const overrides: ColumnOverrides = columnChoice[selectedClassId ?? ''] ?? EMPTY_OVERRIDES;

    /** Le colonne stampate: l'automatico, con sopra la scelta esplicita. E' la
     *  stessa `shownColumns` di prima e tiene lo stesso nome, cosi' l'export —
     *  che gia' la usa — segue la scelta senza un secondo punto da allineare. */
    const shownColumns = useMemo(
        () => shownColumnsWith(columns, hiddenColumnKeys, overrides),
        [columns, hiddenColumnKeys, overrides],
    );

    /** Quelle che l'indicatore dichiara: le auto-nascoste su cui l'utente TACE. */
    const autoHiddenKeys = useMemo(
        () => autoHiddenColumnKeys(hiddenColumnKeys, overrides),
        [hiddenColumnKeys, overrides],
    );

    /** Le voci del pannello. `name` in testa, bloccata. */
    const toggles = useMemo(
        () => columnToggles(columns, hiddenColumnKeys, overrides, duplicateKeys),
        [columns, hiddenColumnKeys, overrides, duplicateKeys],
    );

    /** Una spunta. Scrive l'override della SOLA metaclasse corrente, e scrive
     *  sempre un booleano esplicito: togliere la chiave riporterebbe la colonna
     *  all'automatico, che per una vuota appena spuntata vorrebbe dire vederla
     *  sparire di nuovo al giro dopo. */
    const toggleColumn = (key: string, next: boolean) => {
        if (!selectedClassId) return;
        setColumnChoice(prev => ({
            ...prev,
            [selectedClassId]: { ...(prev[selectedClassId] ?? {}), [key]: next },
        }));
    };

    /** Le due riduzioni COMPONGONO, in AND: il nome restringe, il segmented
     *  restringe ancora. L'ordine non conta (sono due predicati indipendenti sulla
     *  stessa riga) ma e' fissato qui perche' il footer conti su un solo numero. */
    const visible = useMemo(
        () => filterBySegment(
            filterRowsByName(rows, query),
            discriminant?.key ?? '',
            discriminant ? segment : '',
        ),
        [rows, query, discriminant, segment],
    );

    /** La finestra di pagina. Sotto soglia `pageOf` restituisce l'array stesso e
     *  la paginazione non si rende: `paged === visible` e' la condizione, non un
     *  secondo flag da tenere allineato. */
    const pages = pageCount(visible.length, PAGE_SIZE);
    const paged = useMemo(() => pageOf(visible, page, PAGE_SIZE), [visible, page]);

    // The selected instance may have been deleted, or filtered out of view, or may
    // belong to a class that was just deselected. Resolving it against the CURRENT
    // state rather than trusting it means the drawer can never show a dead object —
    // and it is resolved against `rows`, not `visible`, so typing in the search box
    // does not close the drawer on the row being edited.
    //
    // WIDENED BY 10b, and this one expression is the whole delta the outline needs
    // on the form side. A node of the outline may be an instance of ANOTHER
    // metaclass than the table is listing, and the design is explicit that picking
    // it must NOT change the collection («evidenzia la riga *se* la tabella mostra
    // quella metaclasse»). So the rule becomes «a live row OR a live DObject of this
    // model», and everything downstream stands by itself: the row highlight is
    // already `row.id === subjectId`, so the outline -> table synchrony costs
    // nothing; `subjectShape` goes through `shapeCtx.classOf(subjectId)` and not
    // through the selected class; `childSlots`, `inlineChildren` and `drillTo` go
    // through `formSubjectId` and `pathTo`.
    //
    // Declared: `toggleSelected` and `confirmMultiDelete` still reason over `rows`.
    // They stay correct because the outline never feeds `alsoSelected` — it clears
    // it — so `selectedIds` holds one element and `isMulti` stays false. A future
    // slice that let the outline multi-select would have to redo that boundary.
    const subjectId = selectedObjectId
        && (rows.some(r => r.id === selectedObjectId)
            || (idlookup?.[selectedObjectId]?.className === 'DObject'
                && modelIdOfObject(idlookup, selectedObjectId) === modelid))
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
        // Il pannello si chiude, le SCELTE no: `columnChoice` e' indicizzato per
        // metaclasse apposta, e tornare su `State` deve ritrovare le colonne
        // come le si era lasciate. Chiudere il pannello e' un'altra cosa —
        // resterebbe aperto sopra una lista che nel frattempo e' diventata la
        // lista di un'altra metaclasse.
        setColumnsOpen(false);
        // Le due riduzioni sono PER COLLEZIONE: il segmented parla dei literal di
        // un enum che l'altra metaclasse non ha, e una pagina 4 su una collezione
        // che ne ha una sola sarebbe una tabella vuota all'arrivo.
        setSegment('');
        setPage(1);
    };

    // ── 10c: lo stato di riposo ────────────────────────────────────────────────
    // All'apertura la tabella e' PIENA. Un manager che si apre su «Pick a
    // metaclass» chiede all'utente di fare una scelta che il modello ha gia'
    // fatto: la collezione piu' popolata e' la risposta piu' probabile alla
    // domanda «cosa c'e' qui dentro».
    //
    // L'effetto e' condizionato a `selectedClassId === null`, quindi NON e' una
    // preselezione che si ripete: una volta che l'utente ha scelto, anche
    // scegliendo una collezione vuota, resta la sua. Il `null` di ritorno di
    // `mostPopulatedClassId` (modello senza istanze) lascia la selezione vuota, ed
    // e' li' che si rende l'UNICO empty state.
    useEffect(() => {
        if (selectedClassId !== null) return;
        const best = mostPopulatedClassId(classes, counts);
        if (best) setSelectedClassId(best);
    }, [classes, counts, selectedClassId]);

    /** Quante istanze ha il modello, tutte le metaclassi insieme. Distingue
     *  «modello vuoto» — l'unico empty state possibile — da «collezione vuota»,
     *  che con la preselezione qui sopra puo' capitare solo per scelta esplicita. */
    const modelIsEmpty = useMemo(
        () => classes.every(c => (counts[c.id] ?? 0) === 0),
        [classes, counts],
    );

    /** La COLLEZIONE e' vuota: una metaclasse E' scelta e non ha istanze.
     *
     *  Distinta da `modelIsEmpty`, e la distinzione E' il difetto che 10j
     *  corregge. Misurato il 2026-09-01 sui due casi separati:
     *   - modello vuoto, metaclasse scelta -> il cartello diceva «This model has
     *     no instances yet» con «Device · 0 instances» in testata, cioe'
     *     nominava la cosa sbagliata delle due che aveva sotto gli occhi;
     *   - modello pieno, metaclasse vuota -> nessun cartello affatto, solo la
     *     riga «No instance of Device in this model.».
     *  Sono la stessa domanda («questa collezione e' vuota») e ricevevano due
     *  risposte diverse, nessuna delle quali nominava la metaclasse come
     *  soggetto. Da qui una condizione sola per entrambi.
     *
     *  E' anche la condizione del chrome: a zero righe il filtro, il segmented,
     *  l'indicatore, Columns, il footer e la barra della form non hanno nulla su
     *  cui lavorare. `visible.length === 0` NON e' questa condizione — un filtro
     *  che non trova nulla lascia una collezione PIENA, e togliergli il campo di
     *  ricerca toglierebbe l'unico modo di disfare il filtro. */
    const collectionIsEmpty = !!selectedClass && rows.length === 0;

    /** Il nome del modello, per il sottotitolo di provenienza. Letto dalla
     *  `idlookup` come tutto il resto del tab; l'id nudo e' il ripiego, e non
     *  succede su un modello caricato. */
    const modelName: string = idlookup?.[modelid]?.name || modelid;

    /** Export delle righe FILTRATE, colonne visibili: quel che c'e' sullo schermo.
     *
     *  Nessuna dipendenza nuova (Regola 4): un `Blob`, un `<a download>` e una
     *  revoca, che e' lo stesso giro che `DocumentationTab.tsx:852` gia' fa per il
     *  markdown. Il `revokeObjectURL` non e' igiene: senza, l'URL tiene vivo il
     *  blob per tutta la vita del documento. */
    const exportCsv = () => {
        if (!classShape) return;
        const csv = toCsv(shownColumns, visible);
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `${modelName}-${classShape.key}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    /** SAVE1 — il salvataggio esplicito del progetto dalla testata del manager.
     *
     *  E' LA STESSA funzione di File -> Save Project e di Ctrl/Cmd+S: il blocco
     *  che stava scritto due volte in `Navbar.tsx` e' ora
     *  `common/libraries/saveProject.tsx`, e questo e' il terzo chiamante. Non un
     *  secondo percorso di salvataggio — spinner, timeout a 10s e alert sono
     *  quelli, e non ne esiste una copia qui.
     *
     *  Il progetto viene da `LProject.getProject()` e non da una prop: il tab non
     *  riceve il progetto (`InstanceManagerTabProps` e' il solo `modelid`), ed e'
     *  la stessa risoluzione che `SaveManager.save()` fa dalla topbar. Con nessun
     *  progetto risolto l'helper non fa nulla e ritorna `false`.
     *
     *  `saving` spegne il bottone per la durata della chiamata e nient'altro: la
     *  label non cambia e nessuno spinner nuovo nasce, perche' quello globale
     *  (`isLoading`) lo accende gia' l'helper. */
    const saveProject = async () => {
        if (saving) return;
        setSaving(true);
        try {
            await saveProjectWithFeedback(LProject.getProject());
        } finally {
            setSaving(false);
        }
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
        const shape = shapeCtx.shape();
        return subjectShape.children.map(child => {
            const count = childSlotCount(subjectId, child.key);
            // The third argument is the metaclass the slot is TYPED ON, and it is
            // what closes §2.6: without it the bar offered «Add Node» on an abstract
            // `Node` and the create produced a live instance of it. Resolved by name
            // through the shape, the same map `RefShape.of` keys into.
            const target = shape.classes[child.of];
            return { child, count, reason: addChildReason(child, count, target) };
        });
    }, [subjectId, subjectShape, shapeCtx, idlookup]);

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

    // ── L'outline di containment (10b) ─────────────────────────────────────────
    // Terza superficie della create, e ZERO rami nuovi: `openCreate` e' chiamata
    // qui con (cls, node.id, childKey) da un nodo istanza e con (cls, null, null)
    // dal nodo modello — le stesse due forme che il catalogo e la barra dei figli
    // gia' emettono. La provenienza non e' cablata da nessuna parte, che e' cio'
    // che il docstring di `jjform/create.ts` prometteva a Q8.

    /** L'albero, sulla stessa `idlookup` di tutto il resto del tab. */
    const outline = useMemo(
        () => outlineTree(idlookup, modelid, shapeCtx.shape()),
        [idlookup, modelid, shapeCtx],
    );

    /** Aperto se l'utente l'ha detto, altrimenti come dice la regola di default. */
    const outlineIsOpen = (node: OutlineNode) => expanded[node.id] ?? outlineOpenByDefault(node.depth);

    const outlineVisible = useMemo(
        () => outlineRows(outline, outlineIsOpen),
        [outline, expanded],
    );

    /** Quante istanze per NOME di metaclasse — cio' che `rootMenu` legge per il
     *  singleton. `counts` accanto e' per id, che e' la chiave della colonna. */
    const countsByName = useMemo(() => {
        const out: Record<string, number> = {};
        for (const cls of classes) out[cls.name] = counts[cls.id] ?? 0;
        return out;
    }, [classes, counts]);

    /** Se il «+» va offerto affatto: la metaclasse ha almeno una feature di
     *  contenimento (il modello, almeno una rootable). Una lettura di shape, non
     *  degli slot: contare i valori di ogni slot di ogni nodo a ogni render sarebbe
     *  una scansione per disegnare un'icona. Il conteggio lo fa il menu, che si
     *  costruisce solo per il nodo aperto. */
    const outlineHasSlots = (node: OutlineNode): boolean => {
        if (node.kind === 'broken') return false;
        if (node.kind === 'model') return rootMenu(shapeCtx.shape(), countsByName).entries.length > 0;
        const cls = node.cls ? shapeCtx.shape().classes[node.cls] ?? null : null;
        return (cls?.children.length ?? 0) > 0;
    };

    /** Il menu di UN nodo, costruito solo quando e' aperto. */
    const outlineMenuOf = (node: OutlineNode): OutlineMenu => {
        if (node.kind === 'model') return rootMenu(shapeCtx.shape(), countsByName);
        const cls = node.cls ? shapeCtx.shape().classes[node.cls] ?? null : null;
        const slotCounts: Record<string, number> = {};
        for (const child of cls?.children ?? []) slotCounts[child.key] = childSlotCount(node.id, child.key);
        // The shape goes through so the abstract gate of §2.6 fires here exactly as
        // it does on the children bar: one rule, two surfaces, one verdict.
        return childMenu(cls, slotCounts, shapeCtx.shape());
    };

    const toggleOutline = (node: OutlineNode) => {
        setMenuFor(null);
        setExpanded(prev => ({ ...prev, [node.id]: !(prev[node.id] ?? outlineOpenByDefault(node.depth)) }));
    };

    /** Selezionare un nodo NON cambia la collezione mostrata dalla tabella: e' il
     *  vincolo del design. `subjectId` risolve l'oggetto per conto suo, e la riga
     *  si evidenzia da sola se per caso la tabella sta mostrando quella metaclasse.
     *  Azzera `alsoSelected`: l'outline non alimenta la multi-selezione (12b). */
    const selectFromOutline = (node: OutlineNode) => {
        if (node.kind !== 'object') return;
        setMenuFor(null);
        setSelectedObjectId(node.id);
        setAlsoSelected([]);
        setBulkTouched({});
        setNav(null);
    };

    const outlineCreate = (node: OutlineNode, entry: OutlineMenuEntry) => {
        setMenuFor(null);
        openCreate(entry.cls, node.kind === 'model' ? null : node.id, entry.childKey);
    };

    // ── Il vicinato, dentro la riga (13a → FL5/FL6) ─────────────────────────
    // Vista DERIVATA, non un secondo canvas, e non piu' una colonna: il vicinato
    // sta nella riga ESPANSA della tabella, che e' l'unico posto in cui sta
    // accanto all'istanza di cui parla. Sulla stessa `idlookup` di tutto il resto
    // del tab, quindi una gerarchia cambiata sotto si riflette da se'.
    //
    // L'aside `pane--graph` di 13a e' RIMOSSO: rendeva questo stesso dato in una
    // quarta colonna, e due rese dello stesso vicinato a mezzo schermo di distanza
    // sono la divergenza che la prima modifica di una delle due produce.

    /** L'ingresso del nastro: i tre dati grezzi, prima di ogni decisione. */
    const egoInput = useMemo(
        () => (subjectId ? egoInputOf(idlookup, subjectId, shapeCtx.shape()) : null),
        [idlookup, subjectId, shapeCtx],
    );

    /** La proiezione: dedup, precedenza, cap, conteggi. Tutta del modulo puro. */
    const ego: Ego | null = useMemo(
        () => (egoInput ? egoNeighborhood(egoInput) : null),
        [egoInput],
    );

    /** Quanto spazio la tabella lascia alla riga espansa, misurato.
     *
     *  UN osservatore per il tab, sul contenitore di scorrimento, e non uno per
     *  riga: la riga espansa e' una sola per costruzione (l'espansione segue la
     *  selezione), e la larghezza che le interessa e' quella del contenitore, non
     *  la propria — la propria e' cio' che questo numero DECIDE, e misurarla
     *  sarebbe un anello.
     *
     *  Il fallback quando `ResizeObserver` non c'e' e' la misura al primo render,
     *  che e' quella giusta finche' nessuno ridimensiona: meglio del viewport, che
     *  non saprebbe dell'outline aperto ne' delle dodici colonne. */
    const tableScrollRef = useRef<HTMLDivElement | null>(null);
    const [hostWidth, setHostWidth] = useState(0);
    useEffect(() => {
        const el = tableScrollRef.current;
        if (!el) { setHostWidth(0); return; }
        const measure = () => setHostWidth(el.clientWidth);
        measure();
        if (typeof ResizeObserver === 'undefined') return;
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, [selectedClassId, visible.length]);

    /** Terzo emettitore della selezione, stesso corpo degli altri due
     *  (`selectOnly`, `selectFromOutline`): il nastro non alimenta la
     *  multi-selezione, la azzera. Il memo qui sopra pende da `subjectId`, quindi
     *  la riga espansa si sposta da sola sul nodo appena scelto — che e' il test
     *  «click su un vicino sposta selezione, espansione e form sullo stesso id». */
    const selectFromEgo = (instanceId: string) => {
        if (!instanceId || idlookup?.[instanceId]?.className !== 'DObject') return;
        setMenuFor(null);
        setSelectedObjectId(instanceId);
        setAlsoSelected([]);
        setBulkTouched({});
        setNav(null);
    };

    /** L'innesto del canvas vero: apre il tab del modello e vi seleziona questa
     *  istanza. La risoluzione oggetto -> vertice e l'attesa stanno nell'adapter,
     *  che e' la sola meta' impura di questa slice. */
    const openSubjectInCanvas = () => {
        if (subjectId) void openInCanvas(modelid, subjectId);
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
            {/* ── L'outline di containment (10b) ──────────────────────────────
                Quarta colonna, la prima da sinistra: AFFIANCA il catalogo, non lo
                sostituisce. «Outline per il dove, tabella per il quanto» — la nota
                del mock 1b, che e' il layout contract di questa slice. */}
            {showOutline && <OutlinePanel
                rows={outlineVisible}
                subjectId={subjectId}
                isOpen={outlineIsOpen}
                hasSlots={outlineHasSlots}
                menuFor={menuFor}
                menuOf={outlineMenuOf}
                onToggle={toggleOutline}
                onSelect={selectFromOutline}
                onMenu={node => setMenuFor(prev => (prev === node.id ? null : node.id))}
                onCreate={outlineCreate}
            />}

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
                                    {/* 10c — il badge quadrato «C», nel vocabolario del
                                        DS. Il colore NON e' dichiarato qui: arriva da
                                        `jj-type-badge--class`, cioe' dalla coppia
                                        pastello/saturato dei token di entita'
                                        (`--color-entity-class-bg` / `-fg`), la stessa
                                        che il rail delle proprieta' usa a
                                        `Info.tsx:1085`. Questa slice non introduce una
                                        seconda palette; dichiara la sola geometria, e
                                        quella sta nel foglio. La lettera viene da
                                        `entityMeta`, non da `name.charAt(0)`: e' il
                                        badge del TIPO, non l'iniziale dell'elemento. */}
                                    <span
                                        className="instance-manager__glyph jj-type-badge--class"
                                        aria-hidden="true"
                                    >{CLASS_LETTER}</span>
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

                {/* ── VIEWS (10c) ─────────────────────────────────────────────
                    Sotto le metaclassi, e nella stessa colonna: il rail e' il
                    posto in cui si sceglie COSA guardare, e le due viste del
                    modello sono l'altra meta' di quella scelta. Due voci sole, e
                    dichiaratamente due: la vista Diagram di 13a/1b e' rimandata,
                    e un terzo posto inerte avrebbe promesso una superficie che
                    non c'e'.

                    Outline e' il pannello di 10b, che smette di essere una colonna
                    sempre presente e diventa una vista che si apre. Canvas non e'
                    un pannello: e' l'innesto sul canvas VERO
                    (`neighborhoodAdapter.openInCanvas`), lo stesso che il nastro
                    della riga espansa chiama — un evento, non una seconda resa. */}
                <h3 className="instance-manager__eyebrow instance-manager__eyebrow--views">Views</h3>
                <ul className="instance-manager__list">
                    <li
                        className={'instance-manager__row instance-manager__view'
                            + (showOutline ? ' instance-manager__row--selected' : '')}
                        title="Model outline — the containment tree of this model"
                        role="button"
                        aria-pressed={showOutline}
                        onClick={() => setShowOutline(v => !v)}
                    >
                        <i className="bi bi-list-nested instance-manager__view-icon" aria-hidden="true" />
                        <span className="instance-manager__row-name">Outline</span>
                    </li>
                    {/* Visibile e inerte quando non c'e' un soggetto, con la causa
                        nel `title`: `openInCanvas` prende un oggetto, e la stessa
                        regola con cui il rail tiene visibili le metaclassi astratte
                        vale qui — una voce che sparisce si legge come una funzione
                        che non esiste, una spenta si legge come il modello che dice
                        perche'. */}
                    <li
                        className={'instance-manager__row instance-manager__view'
                            + (subjectId ? '' : ' instance-manager__row--disabled')}
                        title={subjectId
                            ? 'Open the selected instance in the canvas'
                            : 'Select an instance to open it in the canvas'}
                        role="button"
                        aria-disabled={subjectId ? undefined : true}
                        onClick={() => { if (subjectId) openSubjectInCanvas(); }}
                    >
                        <i className="bi bi-diagram-3 instance-manager__view-icon" aria-hidden="true" />
                        <span className="instance-manager__row-name">Canvas</span>
                    </li>
                </ul>
            </aside>

            {/* ── La colonna centrale: la tabella SOPRA, la form SOTTO ────────
                Il riassetto di FL6. La form lascia la quarta colonna e prende il
                pannello sotto la tabella, che e' la sola collocazione in cui una
                griglia a 12 colonne ha 12 colonne da riempire: in 400px di
                larghezza il packer di FL1 impacchettava una colonna sola, e
                l'auto-layout non aveva niente da decidere.

                Le due letture restano affiancate — catalogo e outline a sinistra,
                fissi — perche' scegliere COSA guardare e' l'altro asse, e
                impilarlo sotto la form vorrebbe dire scorrere per cambiare riga. */}
            <div className="instance-manager__main">
            {/* ── La testata (10c, uscita dalla card in 10k) ──────────────────
                Il titolo e' il NOME della metaclasse a 24px, non l'eyebrow con
                il conteggio appiccicato: il conteggio e' sceso nel footer, che
                e' il posto in cui una tabella dice quante righe ha. Il
                sottotitolo dice il MODELLO e la taglia della collezione.

                10d — cade «Created from the container's form»: diceva quasi
                la stessa cosa della frase di `newInstanceReason` sessanta
                pixel piu' sotto (punto aperto del referto 10c, arbitrato).
                Il conteggio e' `rows.length`, NON filtrato: il footer conta
                le visibili, e i due numeri coincidono solo a filtri spenti —
                quanto e' grande la collezione e quanto ne resta sono due
                domande diverse.

                10k punto 2 — la testata ESCE dalla card e sale sul fondo desk,
                sopra di essa. Il titolo nomina la METACLASSE, cioe' il soggetto
                dell'intera colonna: dentro la card diceva «questa tabella si
                chiama State», mentre sul desk dice «stiamo guardando State», ed
                e' la seconda cosa che e' vera anche della form sotto. La card
                comincia dalla toolbar, che e' dove comincia la tabella.

                Resta figlia di `__main`, quindi la gronda e il `gap` del desk
                la spaziano dalla card: nessun margine proprio (vedi il foglio). */}
            {selectedClass && (
                <header className="instance-manager__head">
                    <div className="instance-manager__head-titles">
                        <h2 className="instance-manager__title">{selectedClass.name}</h2>
                        <p className="instance-manager__provenance">
                            {modelName} · {rows.length} instance{rows.length === 1 ? '' : 's'}
                        </p>
                    </div>

                    {/* 10k-CHIUSURA — le due azioni sul SOGGETTO salgono accanto al
                        suo nome. La barra dentro la card riduce cio' che si vede
                        (filtro, segmented, colonne); Export e New agiscono sulla
                        collezione intera, che e' quel che il titolo nomina — ed e'
                        anche perche' sopravvivevano al filtro mentre stavano in una
                        riga che il filtro popola.

                        Export resta il secondario e New il primario: un solo
                        primario in tutta la testata, come da 10c. */}
                    <div className="instance-manager__head-actions">
                        {/* SAVE1 — «Save project» a sinistra di Export.

                            Terzo chiamante di `saveProjectWithFeedback`, non un
                            terzo salvataggio: menu File, Ctrl/Cmd+S e questo
                            bottone passano dalla stessa funzione.

                            SEMPRE ATTIVO, salvo la durata della chiamata. La
                            ragione, misurata, sta sul commento di `saving`:
                            `U.isProjectModified` e' uno static non sottoscrivibile,
                            e un `disabled` che ne dipendesse resterebbe indietro
                            rispetto alle modifiche fatte fuori da questo tab.

                            Vive dentro la stessa condizione della testata
                            (`selectedClass`): dove la testata non c'e' — nessuna
                            metaclasse scelta — non c'e' neanche lui, e il
                            salvataggio resta dove gia' stava (menu e scorciatoia).

                            Secondario come Export, e con la sua stessa regola nel
                            foglio: il primario della testata resta uno solo, la
                            create. */}
                        <button
                            type="button"
                            className="instance-manager__save"
                            title="Save the project"
                            disabled={saving}
                            onClick={saveProject}
                        >
                            <i className="bi bi-floppy" aria-hidden="true" />
                            Save project
                        </button>

                        {classShape && rows.length > 0 && (
                            <button
                                type="button"
                                className="instance-manager__export"
                                title={`Export the ${visible.length} listed instance${visible.length === 1 ? '' : 's'} as CSV`}
                                onClick={exportCsv}
                            >
                                <i className="bi bi-download" aria-hidden="true" />
                                Export
                            </button>
                        )}

                        {/* Route 1 of Turno 10: the catalogue creates the rootable ones.
                            Absent, never disabled, when the metamodel says no — the
                            sentence below the toolbar carries the reason instead.

                            10c non cambia l'evento, e non poteva: `openCreate(cls, null,
                            null)` e' LA STESSA chiamata che `outlineCreate` fa dal nodo
                            modello. La scorciatoia rootable della regola Q8 e' la
                            superficie, non un secondo percorso di create.

                            10k-CHIUSURA — `!collectionIsEmpty` e' NUOVO, ed e' la
                            regola di 10j portata nella nuova posizione. Finche' «New»
                            stava nella toolbar la questione non si poneva: a zero
                            istanze la riga si spegneva intera e il bottone se ne
                            andava con lei, lasciando la CTA del cartello sola. La
                            testata invece RESTA a zero istanze (10j lo dichiara
                            esplicitamente), quindi senza questa guardia lo stesso
                            «New State» comparirebbe due volte a quaranta pixel di
                            distanza. Vince la CTA, che e' dentro il cartello che
                            spiega perche' la tabella e' vuota; il bottone in testata
                            torna appena c'e' una collezione da cui esportare o
                            filtrare. Stessa regola, stesso arbitrato, posizione
                            nuova. */}
                        {classShape && !newReason && !collectionIsEmpty && (
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
                </header>
            )}

            {/* ── The collection: a table of the selected metaclass ────────── */}
            <section className="instance-manager__pane instance-manager__pane--table">
                {/* 10j — la riga di riduzioni si spegne INTERA a collezione vuota.
                    Non `disabled`: un filtro spento su zero righe dichiara un
                    limite che non c'e', ed e' lo stesso argomento con cui 10c ha
                    reso il pager condizionale invece che disabilitato.

                    La condizione sta sulla RIGA e non su ciascun figlio, e la
                    differenza e' misurata: spegnere i quattro dentro una riga che
                    resta libera spazio orizzontale e zero spazio verticale — la
                    barra c'era ancora, con dentro il solo «New», che la CTA del
                    cartello ripete quaranta pixel piu' in basso. `New` e la CTA
                    hanno la STESSA condizione (`classShape && !newReason`): dove
                    la riga sparisce il bottone e' gia' a schermo dentro il
                    cartello, e dove la CTA non c'e' non c'era nemmeno il bottone.
                    La TESTATA — titolo e sottotitolo — non e' toccata. §1 del
                    referto 10j. */}
                {!collectionIsEmpty && (
                    <div className="instance-manager__toolbar">
                        {selectedClass && (
                            <input
                                className="instance-manager__search"
                                type="search"
                                value={query}
                                placeholder="Filter by name…"
                                aria-label={`Filter ${selectedClass.name} instances by name`}
                                onChange={e => { setQuery(e.target.value); setPage(1); }}
                            />
                        )}

                        {/* Il segmented dei literal dell'enum discriminante. I literal
                            arrivano dalla SHAPE (`discriminantEnum`), mai cablati: il
                            `All | normal | initial | final` del prompt e' l'esempio di
                            `State`, e scriverlo qui avrebbe reso la barra muta su ogni
                            altro metamodello. Assente quando la metaclasse non ha un
                            enum a valore singolo con almeno due literal. */}
                        {discriminant && (
                            <div
                                className="instance-manager__segmented"
                                role="group"
                                aria-label={`Filter by ${discriminant.key}`}
                                title={`${discriminant.key} : ${discriminant.enumName}`}
                            >
                                {['', ...discriminant.literals].map(lit => (
                                    <button
                                        type="button"
                                        key={lit || '__all__'}
                                        className={'instance-manager__segment'
                                            + (segment === lit ? ' instance-manager__segment--on' : '')}
                                        aria-pressed={segment === lit}
                                        onClick={() => { setSegment(lit); setPage(1); }}
                                    >
                                        {lit || 'All'}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* L'indicatore dichiara la riduzione che la tabella ha appena
                            fatto da se'. Una colonna che sparisce senza che nulla lo
                            dica e' un metamodello che sembra piu' povero di quel che
                            e': il conteggio e' li' perche' la riduzione sia leggibile,
                            e il `title` elenca quali. */}
                        {/* 10i — il conteggio passa da `hiddenColumnKeys` alle sole
                            NON-OVERRIDATE. Con il pannello, una vuota puo' essere
                            sullo schermo per scelta, e continuare a contarla qui
                            direbbe «nascosta» di una colonna che si vede. */}
                        {/* 10k — la parola «empty» resta solo quando e' VERA di
                            tutte. Con il doppione dei nomi fra le auto-nascoste
                            la frase generalizza, e il `title` porta le due
                            ragioni separate: dire «empty» di una colonna piena
                            di nomi sarebbe la nota che mente al posto della
                            colonna che spariva in silenzio. */}
                        {autoHiddenKeys.length > 0 && (() => {
                            const dup = autoHiddenKeys.filter(k => duplicateKeys.includes(k));
                            const vuote = autoHiddenKeys.filter(k => !duplicateKeys.includes(k));
                            const why = [
                                vuote.length ? `Empty on every instance: ${vuote.join(', ')}` : null,
                                dup.length ? `Same as the name column: ${dup.join(', ')}` : null,
                            ].filter(Boolean).join('\n');
                            return (
                                <span className="instance-manager__hidden-cols" title={why}>
                                    <i className="bi bi-eye-slash" aria-hidden="true" />
                                    {dup.length === 0
                                        ? <>{autoHiddenKeys.length} empty column{autoHiddenKeys.length === 1 ? '' : 's'} hidden</>
                                        : <>{autoHiddenKeys.length} column{autoHiddenKeys.length === 1 ? '' : 's'} hidden</>}
                                </span>
                            );
                        })()}

                        {/* Il pannello Columns (10i).
                            Sta accanto all'indicatore perche' e' il gesto che
                            risponde alla frase: la riga dice «due colonne
                            nascoste», e il bottone subito dopo e' dove si va a
                            rivederle. Secondario come Export: il primario della
                            testata resta la create, uno solo. */}
                        {classShape && columns.length > 0 && (
                            <div className="instance-manager__columns-wrap" ref={columnsRef}>
                                <button
                                    type="button"
                                    className="instance-manager__columns"
                                    aria-expanded={columnsOpen}
                                    aria-haspopup="true"
                                    title="Choose which columns the table shows"
                                    onClick={e => {
                                        setColumnsRect(e.currentTarget.getBoundingClientRect());
                                        setColumnsOpen(o => !o);
                                    }}
                                >
                                    <i className="bi bi-layout-three-columns" aria-hidden="true" />
                                    Columns
                                </button>

                                {/* 10k-chiusura — il pannello esce dall'albero del tab.
                                    `createPortal` su `document.body` piu' la geometria
                                    `fixed` calcolata dal rect del bottone: dentro la card
                                    l'`overflow: hidden` che raccorda i raggi lo tagliava a
                                    meta' elenco. Il tema vive su `html[data-theme]`, quindi
                                    i token seguono il pannello anche fuori dal sottoalbero;
                                    le regole di 10i e 10k sono su classi BEM piatte
                                    (`.instance-manager__columns-item input[…]`), non
                                    discendenti di `.instance-manager`, e lo raggiungono
                                    per costruzione. */}
                                {columnsOpen && columnsRect && createPortal(
                                    <div
                                        ref={columnsPanelRef}
                                        className="instance-manager__columns-panel"
                                        role="group"
                                        aria-label={`Columns of ${classShape.key}`}
                                        style={computeColumnsPanelStyle(columnsRect)}
                                    >
                                        {/* 10k-dd — la testata conta, e conta le VISIBILI
                                            includendo la colonna fissa dei nomi, che e'
                                            a schermo e non passa da `toggles` quando la
                                            feature `name` esiste. Il numero e' cio' che
                                            l'elenco non mostra: le spunte ci sono tutte,
                                            ma vanno contate a mano. */}
                                        <div className="instance-manager__columns-head">
                                            {toggles.filter(t => t.checked).length} of {toggles.length} shown
                                        </div>
                                        {toggles.map(t => (
                                            <label
                                                key={t.key}
                                                className={'instance-manager__columns-item'
                                                    + (t.locked ? ' instance-manager__columns-item--locked' : '')
                                                    + (t.checked ? '' : ' instance-manager__columns-item--off')}
                                                title={t.locked
                                                    ? 'The name column is always shown'
                                                    : t.duplicate ? 'Same value as the name column on every instance — check to show it anyway'
                                                        : t.empty ? 'Empty on every instance — check to show it anyway'
                                                            : undefined}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={t.checked}
                                                    disabled={t.locked}
                                                    onChange={e => toggleColumn(t.key, e.target.checked)}
                                                />
                                                <span className="instance-manager__columns-label">{t.label}</span>
                                                {t.empty && (
                                                    <span className="instance-manager__columns-empty">empty</span>
                                                )}
                                                {t.duplicate && (
                                                    <span className="instance-manager__columns-empty">same as name</span>
                                                )}
                                            </label>
                                        ))}
                                    </div>,
                                    document.body
                                )}
                            </div>
                        )}

                        {/* Export e «New» NON sono piu' qui: 10k-CHIUSURA li porta
                            nella riga di testata, sul desk. Cio' che resta e' cio'
                            che RIDUCE la tabella — filtro, segmented, indicatore,
                            Columns — e questa e' ora la sola cosa che la barra fa.
                            Le due azioni sul soggetto stanno accanto al nome del
                            soggetto. */}
                    </div>
                )}

                {classShape && newReason && (
                    <p className="instance-manager__note instance-manager__note--reason">
                        {newReason}
                    </p>
                )}

                {/* ── L'unico empty state (10c) ───────────────────────────────
                    «Pick a metaclass to list its instances» E' ANDATO VIA. Non era
                    un cartello sbagliato: era il secondo di due in cascata, e con
                    la preselezione della collezione piu' popolata non e' piu'
                    raggiungibile se non su un modello che non ha istanze — che e'
                    esattamente il caso che il cartello sotto dichiara, una volta
                    sola e con il nome giusto. */}
                {/* 10j — la COLLEZIONE vuota viene prima del modello vuoto, e
                    l'ordine e' la correzione. Quando una metaclasse e' scelta il
                    soggetto sullo schermo e' lei: la testata dice «Device · 0
                    instances», e un cartello che risponde parlando del modello
                    nomina l'altra cosa. Il ramo del modello resta, e resta VERO,
                    per il solo caso in cui non c'e' una metaclasse scelta a fare
                    da soggetto — cioe' il riposo di un modello senza istanze,
                    dove `mostPopulatedClassId` non ha nulla da preselezionare.

                    La CTA e' `openCreate(cls, null, null)`: LA STESSA chiamata
                    del bottone in testata e di `outlineCreate` dal nodo modello.
                    Non un secondo percorso di create — la scorciatoia rootable
                    della regola Q8 e' superficie, e qui e' la superficie che
                    risponde alla frase invece di mandare altrove chi la legge.

                    Senza scorciatoia (metaclasse non rootable) il cartello dice
                    DOVE si crea e non mostra un bottone che non puo' esistere:
                    e' lo stesso idioma con cui la testata toglie «New» invece di
                    spegnerlo. */}
                {collectionIsEmpty && selectedClass ? (
                    <EmptyState
                        className="instance-manager__empty"
                        icon="bi-inbox"
                        title={`No ${selectedClass.name} instances yet`}
                        description={classShape && !newReason
                            ? 'Create the first one to see it here.'
                            : 'Add one from its container in the outline.'}
                        action={classShape && !newReason
                            ? {
                                label: `+ New ${classShape.key}`,
                                onClick: () => openCreate(classShape.key, null, null),
                            }
                            : undefined}
                    />
                ) : modelIsEmpty || !selectedClass ? (
                    <EmptyState
                        className="instance-manager__empty"
                        icon="bi-inbox"
                        title="This model has no instances yet"
                        description="Create one from a metaclass on the left, or from the outline."
                    />
                ) : visible.length === 0 ? (
                    <p className="instance-manager__note">
                        No instance of {selectedClass.name} matches the current filters.
                    </p>
                ) : (
                    <div className="instance-manager__table-scroll" ref={tableScrollRef}>
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
                                            checked={paged.length > 0 && paged.every(r => selectedIds.includes(r.id))}
                                            onChange={() => {
                                                const allOn = paged.length > 0 && paged.every(r => selectedIds.includes(r.id));
                                                setBulkTouched({});
                                                setNav(null);
                                                if (allOn) { setSelectedObjectId(null); setAlsoSelected([]); return; }
                                                const [first, ...rest] = paged.map(r => r.id);
                                                setSelectedObjectId(first ?? null);
                                                setAlsoSelected(rest);
                                            }}
                                        />
                                    </th>
                                    <th scope="col" className="instance-manager__th-name">name</th>
                                    {shownColumns.map(col => (
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
                                    {/* La colonna del chevron: intestazione muta,
                                        perche' la parola sopra una freccia che dice
                                        gia' «apri» e' rumore in una riga di dodici
                                        colonne. Il nome resta per chi legge con uno
                                        screen reader. */}
                                    <th scope="col" className="instance-manager__th-chev">
                                        <span className="instance-manager__sr">expand</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {paged.map(row => {
                                    /* L'espansione SEGUE la selezione, e non e' un
                                       secondo stato: «una sola riga espansa alla
                                       volta» non e' una regola da far rispettare, e'
                                       cio' che «espansa == selezionata» significa.
                                       Un `expandedId` accanto a `subjectId` sarebbe
                                       stato il secondo posto in cui la stessa cosa
                                       puo' essere vera, e il primo giorno in cui i
                                       due divergono la form parlerebbe di una riga
                                       e il nastro di un'altra. */
                                    const isExpanded = row.id === subjectId;
                                    return (
                                    <React.Fragment key={row.id}>
                                    <tr
                                        className={
                                            row.id === subjectId ? 'instance-manager__tr--selected'
                                                : selectedIds.includes(row.id) ? 'instance-manager__tr--multi'
                                                    : undefined
                                        }
                                        title={row.name || row.id}
                                        aria-expanded={isExpanded}
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
                                        {shownColumns.map(col => (
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
                                        {/* Il chevron e' un INDICATORE, non un
                                            secondo bottone: il gesto e' il click
                                            sulla riga, gia' scritto sopra, e un
                                            bersaglio annidato che fa la stessa cosa
                                            e' un modo per farla due volte. */}
                                        <td className="instance-manager__td-chev">
                                            <i
                                                className={'bi instance-manager__chev '
                                                    + (isExpanded ? 'bi-chevron-up' : 'bi-chevron-down')}
                                                aria-hidden="true"
                                            />
                                        </td>
                                    </tr>

                                    {/* La riga espansa: il vicinato a un salto, e
                                        nient'altro. La form NON e' qui — e' il
                                        pannello sotto la tabella, dove ha la
                                        larghezza che la sua griglia chiede. `ego`
                                        e' null solo se il soggetto non risolve, e
                                        allora non c'e' riga da rendere. */}
                                    {isExpanded && ego && (
                                        <tr className="instance-manager__tr--expansion">
                                            <td colSpan={shownColumns.length + 5}>
                                                <EgoRow
                                                    ego={ego}
                                                    hostWidth={hostWidth}
                                                    onSelect={selectFromEgo}
                                                    onOpenInCanvas={openSubjectInCanvas}
                                                />
                                            </td>
                                        </tr>
                                    )}
                                    </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── Il footer (10c) ─────────────────────────────────────────
                    A sinistra il conteggio, che dall'eyebrow e' sceso qui: e' il
                    posto in cui una tabella dice quante righe ha, e sopra
                    competeva con il nome della metaclasse per la stessa riga.

                    A destra la paginazione, e SOLO sopra soglia. `pages > 1` e'
                    la condizione — non una prop `disabled`: su una tabella di sei
                    righe una barra di pagine spenta e' arredamento che dichiara un
                    limite che non c'e'. Il conteggio a sinistra e' quello
                    FILTRATO, con il totale accanto quando le due cose differiscono:
                    dire «12 instances» mentre il filtro ne ha lasciate 12 su 300
                    sarebbe vero e fuorviante. */}
                {selectedClass && rows.length > 0 && (
                    <footer className="instance-manager__foot">
                        <span className="instance-manager__foot-count">
                            {visible.length} instance{visible.length === 1 ? '' : 's'}
                            {visible.length !== rows.length && (
                                <span className="instance-manager__foot-of"> of {rows.length}</span>
                            )}
                            {' · '}
                            {selectedIds.length} selected
                        </span>
                        {pages > 1 && (
                            <nav className="instance-manager__pager" aria-label="Table pages">
                                <button
                                    type="button"
                                    className="instance-manager__page-btn"
                                    aria-label="Previous page"
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                >
                                    <i className="bi bi-chevron-left" aria-hidden="true" />
                                </button>
                                <span className="instance-manager__page-of">
                                    Page {Math.min(page, pages)} of {pages}
                                </span>
                                <button
                                    type="button"
                                    className="instance-manager__page-btn"
                                    aria-label="Next page"
                                    disabled={page >= pages}
                                    onClick={() => setPage(p => Math.min(pages, p + 1))}
                                >
                                    <i className="bi bi-chevron-right" aria-hidden="true" />
                                </button>
                            </nav>
                        )}
                    </footer>
                )}
            </section>

            {/* ── The selected instance, as a form ──────────────────────────
                Sotto la tabella, dentro la stessa colonna: e' il riassetto di FL6.
                Il contenuto e' cinturato a 1300px e centrato (decisione
                ratificata) — su un 27" una riga di campi larga tutto lo schermo
                non e' piu' leggibile, e' solo piu' lunga da attraversare con gli
                occhi. */}
            {/* 10j — a collezione vuota il pannello non si rende affatto.
                La barra «Select an instance to edit it» e' il collasso di 10c, e
                quel collasso risponde a «non hai ancora scelto una riga»: con
                zero righe non c'e' una riga da scegliere, e la frase promette un
                gesto che la tabella sopra non offre. Sparisce il pannello e non
                solo la frase, perche' una card vuota con bordo e ombra sarebbe
                un contenitore che dichiara un contenuto assente. */}
            {(isMulti || subjectId || !collectionIsEmpty) && (
            <section
                className={'instance-manager__pane instance-manager__pane--form'
                    + (isMulti || subjectId ? '' : ' instance-manager__pane--form-collapsed')}
            >
                <div className="instance-manager__form-inner">
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

                        {/* L'header della form: chi si sta editando, se il
                            progetto ha scritture non salvate, e la sola azione che
                            un motore ce l'ha.

                            SAVE E DISCARD NON CI SONO, ed e' una constatazione, non
                            una dimenticanza: questa form scrive DIRITTO nello store
                            (`formWrite.ts`, un commit per battuta, `U.isProjectModified`
                            a true su ogni cambiamento reale). Non esiste un draft di
                            edit da salvare ne' da annullare — l'unico draft del tab e'
                            quello della CREATE (12a), che vive nella sua dialogue e ha
                            gia' il suo Create/Cancel. Renderli qui vorrebbe dire o due
                            bottoni inerti o un motore nuovo sul write path: il primo e'
                            una bugia, il secondo e' un'altra slice. Punto aperto,
                            dichiarato nel referto.

                            Il badge dice quel che il flag dice davvero — «il progetto
                            ha modifiche non salvate» — e non «questa istanza». Il flag
                            e' uno statico letto al render, non un sottoscrivibile: si
                            aggiorna al primo re-render dopo la scrittura, che qui e' lo
                            stesso in cui la scrittura arriva, perche' ogni scrittura
                            cambia `idlookup` e il tab pende da quello. */}
                        <header className="instance-manager__form-head">
                            <div className="instance-manager__form-title">
                                <span className="instance-manager__form-name">
                                    {ego?.subject.name || <em className="instance-manager__unnamed">unnamed</em>}
                                </span>
                                {ego?.subject.cls && (
                                    <span className="instance-manager__form-cls">{ego.subject.cls}</span>
                                )}
                                {/* «Unsaved changes» E' ANDATO VIA (deviazione A3,
                                    ratificata e qui portata a termine). Il write e'
                                    DIRETTO — `formWrite.ts`, un commit per battuta —
                                    quindi non esiste un draft di edit da salvare, e
                                    un badge che annuncia modifiche non salvate accanto
                                    a una form che non ne tiene nessuna e' la meta'
                                    superstite di un Save/Discard che questa slice non
                                    costruisce. Il flag di progetto resta vero e resta
                                    leggibile dove il progetto si salva; qui diceva del
                                    progetto mentre sembrava dire dell'istanza. */}
                            </div>
                            <div className="instance-manager__form-actions">
                                <button
                                    type="button"
                                    className="instance-manager__form-delete"
                                    title={`Delete ${ego?.subject.name || subjectId}`}
                                    onClick={() => openDelete(subjectId)}
                                >
                                    <i className="bi bi-trash" aria-hidden="true" />
                                    Delete
                                </button>
                            </div>
                        </header>

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
                        {/* 10k punto 6 — l'eyebrow «Add contained» E' ANDATO VIA.
                            Erano due sezioni per lo stesso slot: la CHILDREN che
                            `IRForm` rende (i valori) e questa (la create), una
                            sotto l'altra, ciascuna con la propria intestazione a
                            nominare `substates`. Due titoli per un argomento sono
                            due argomenti, e chi legge cerca la differenza.

                            Sparisce l'INTESTAZIONE, non il blocco: la barra resta
                            dov'e', perde il proprio titolo e il proprio filetto
                            (vedi il foglio) e si legge come la coda della sezione
                            sopra — «i figli, e come aggiungerne uno». La CTA
                            continua a nominare la metaclasse figlia, che e' la
                            sola parola che l'intestazione portava e che qui
                            serviva davvero.

                            Non si tocca `IRForm`: la sezione CHILDREN e' sua, la
                            monta anche il rail del canvas, e darle una CTA
                            vorrebbe dire infilare una callback per tre componenti
                            che questo tab OSPITA invariati (2a) — la stessa
                            cucitura, e la stessa ragione, che il commento della
                            barra qui sotto gia' dichiara. */}
                        {childSlots.length > 0 && (
                            <div className="instance-manager__children">
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
                    /* 10c — niente piu' cartello. Il pannello COLLASSA a una barra
                       sottile: un `EmptyState` alto mezzo schermo per dire che non
                       c'e' niente da mostrare occupava, per non mostrare nulla,
                       lo spazio che serve alla tabella per mostrare qualcosa. La
                       barra dice la stessa frase in una riga, e il pannello si
                       riapre da se' alla selezione — l'altezza segue lo stato,
                       che e' la sola cosa che questa superficie deve dire. */
                    <p className="instance-manager__collapsed">
                        <i className="bi bi-pencil-square" aria-hidden="true" />
                        Select an instance to edit it
                    </p>
                )}
                </div>
            </section>
            )}
            </div>

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
