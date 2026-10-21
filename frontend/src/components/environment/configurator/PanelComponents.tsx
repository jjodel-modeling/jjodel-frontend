/**
 * PanelComponents — one element of the Configurator panel (`ObjectView`), and its Components
 * section (#187, P-2026-10-14-1100).
 *
 * References and children are one section (#187 task 9): what a component offers follows its kind.
 *
 * ── References (non-containment, `shape.refs`) ─────────────────────────────────
 *
 * A single-valued one is a card: the target's name, a one-line summary of its key fields
 * (`referenceSummary`, through the Data Manager's view), «open» (drill-in) and a chevron that opens
 * `ComponentPicker` (search, candidates, «+ New»); empty, it reads «(none selected)». A multi-valued
 * one lists a row per target with «Remove from the list» and «open», then «+ Add target», disabled
 * at the upper bound. Remove unlinks and never deletes (R-REF-3's semantics, R-CFG-2); every write
 * addresses the raw index of its row, on the slot read again from the store at the click (R-REF-4),
 * through `formWrite`. A reference the view author hides keeps rows that open and «+ New» (R-REF-6).
 *
 * ── Compositions (`shape.children`) ────────────────────────────────────────────
 *
 * Creation only, no select (#187 task 9; Juri's decision of 2026-10-14 in the GO of
 * P-2026-10-14-1100): no existing element is picked into a composition and no child is evicted to
 * the model root, as the form's «Children» field allowed. Each child is a card with delete (the
 * host's `openDelete`, its confirmation) and «open». At the inline level of the subject
 * (`rendersInline`) a card holds the child's own Identity, Attributes and Components; a multi-valued
 * composition lists its children collapsed, each expandable. Past the inline level, and for the
 * grandchildren inside a card, a card is the child's name and its key fields (#187 task 10).
 *
 * ── The role (#157 step B, #187 usability note) ────────────────────────────────
 *
 * A type the role hides is not shown, not offered, not reachable; a type it reads renders without
 * inputs and offers no create, delete, link or unlink; a value of a non-`edit` type held in a slot
 * that re-fathers is locked. The rules are `formPermissions`' and `jjform/refSlot`'s, as in
 * `InstanceDetail`.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useNodeProblems } from '../../editor-v2/problems/useNodeProblems';
import { collectFormDiagnostics, type FieldDiagnostic } from '../../editor-v2/viewpoint/ir/formDiagnostics';
import { appendValue, clearValue, setValue, type WriteResult } from '../../editor-v2/viewpoint/ir/formWrite';
import { assignableOptions } from '../../editor-v2/viewpoint/ir/slotValues';
import { childSlotCount } from '../../editor-v2/hooks/createAdapter';
import { childrenIn, navStepOf } from '../../editor-v2/hooks/multiDraw';
import { addChildReason, crumbLabel, newInstanceReason, rendersInline } from '../../../jjform';
import type { RefShape, RefSlotControls, RefSlotRow } from '../../../jjform';
import { ComponentPicker } from './ComponentPicker';
import { DiagLine, FieldTitle, ObjectFields, SectionHead, problemsAttr, useFolds, useObjectModel, usePanelEnv } from './PanelFields';
import { canUnlink, componentKind, createControl, newTargetAt, orderComponents, summaryLine } from './panelModel';

/** Shown when the host refuses a write without saying why, as `IRFormField` words it. */
const UNSTATED_REFUSAL = 'The model refused this change';

/** The inline card an element is shown in, and the slot of its owner it sits in. */
type Via = { id: string; key: string } | null;

/** One component of an element: the feature, its label in the view, whether the author hides it. */
type Component = { key: string; ref: RefShape; label: string; authorHidden: boolean };

/** The label of an element as the breadcrumb prints it («PhA: Phase»). */
function labelOf(idlookup: Record<string, any>, id: string, cls: string): string {
    return crumbLabel(navStepOf(idlookup, id) ?? { id, name: '', cls, childKey: null });
}

/**
 * One element of the panel: the subject on screen (`via` null) or a child shown inline in a card.
 * It reads its view, counts its problems for the header's chip, and renders the three sections.
 */
export function ObjectView({ objectId, depth, via }: { objectId: string; depth: number; via: Via }) {
    const env = usePanelEnv();
    const model = useObjectModel(objectId, env.profileReads);
    const clsName = env.shapeCtx.classOf(objectId);
    const cls = clsName ? env.shapeCtx.shape().classes[clsName] ?? null : null;
    const [folds, toggle] = useFolds(cls?.id ?? null);
    const readOnly = env.permOfInstance(objectId) !== 'edit';

    const spec = model?.spec;
    const slotOrder: string[] = (env.idlookup?.[objectId]?.features ?? [])
        .map((fid: string) => env.idlookup?.[env.idlookup?.[fid]?.instanceof]?.name)
        .filter((n: unknown): n is string => typeof n === 'string');
    const components: Component[] = cls
        ? orderComponents(
            [...cls.refs, ...cls.children]
                // #157 step B: a feature typed by a class the role hides is no component at all.
                .filter(r => env.permOfClassName(r.of) !== 'hidden')
                .map(r => ({
                    key: r.key,
                    ref: r,
                    label: spec?.labels?.[r.key] ?? r.key,
                    authorHidden: !!spec?.hidden?.includes(r.key) || spec?.features?.[r.key] === 'hidden',
                })),
            slotOrder,
            spec?.order,
        )
        : [];

    const problems = useNodeProblems(objectId);
    const names = [...(model?.fields ?? []).map(f => f.name), ...components.filter(c => !c.authorHidden).map(c => c.key)];
    const namesKey = names.join('|');
    const diagnostics = useMemo(
        () => collectFormDiagnostics(problems, new Set(names)),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [problems, namesKey],
    );
    useEffect(() => {
        env.reportIssues(objectId, { errors: diagnostics.errorCount, warnings: diagnostics.warningCount });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [objectId, diagnostics.errorCount, diagnostics.warningCount]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => () => env.reportIssues(objectId, null), [objectId]);

    if (!model) return null;
    const componentsFolded = folds.has('components');
    return (
        <div className="cfg-panel__object" data-object={objectId} data-problems={problemsAttr(diagnostics.residue)}>
            {readOnly && (
                <p className="cfg-panel__ro-note">
                    <i className="bi bi-eye" aria-hidden="true" />
                    Read only for this role
                </p>
            )}
            <ObjectFields objectId={objectId} model={model} readOnly={readOnly} diagnostics={diagnostics} folds={folds} onToggle={toggle} />
            {components.length > 0 && (
                <section className="cfg-panel__section" data-section="components">
                    <SectionHead title="Components" folded={componentsFolded} onToggle={() => toggle('components')} />
                    {!componentsFolded && (
                        <div className="cfg-panel__components">
                            {components.map(c => (componentKind(c.ref) === 'reference' ? (
                                <ReferenceSlot key={c.key} objectId={objectId} comp={c} diagnostics={c.authorHidden ? [] : (diagnostics.byField.get(c.key) ?? [])} via={via} />
                            ) : (
                                <CompositionSlot key={c.key} objectId={objectId} comp={c} readOnly={readOnly} diagnostics={diagnostics.byField.get(c.key) ?? []} depth={depth} via={via} />
                            )))}
                        </div>
                    )}
                </section>
            )}
        </div>
    );
}

/** The open picker of a reference: the row it changes (its raw index), or null to link or append. */
type OpenPicker = { anchor: DOMRect; opener: HTMLElement; row: number | null };

function ReferenceSlot({ objectId, comp, diagnostics, via }: { objectId: string; comp: Component; diagnostics: FieldDiagnostic[]; via: Via }) {
    const env = usePanelEnv();
    const { ref, label, authorHidden } = comp;
    const [refusal, setRefusal] = useState<string | null>(null);
    const [picker, setPicker] = useState<OpenPicker | null>(null);
    useEffect(() => { setRefusal(null); setPicker(null); }, [objectId]);

    const ruled = env.ruleSlot(objectId, ref);
    // R-REF-6: rows that open, no link; «+ New» stays.
    const controls: RefSlotControls = authorHidden
        ? { ...ruled, rows: ruled.rows.filter(r => !r.broken).map(r => ({ ...r, actions: ['open'] })), link: null }
        : ruled;
    // #157 step B: a target of a type the role hides is not named.
    const rows = controls.rows.filter(r => r.broken || env.permOfInstance(r.value) !== 'hidden');
    const single = ref.upper === 1;
    const upperText = ref.upper === -1 ? '*' : String(ref.upper);

    const writable = !ref.readOnly && !ref.derived && !!env.onCreateAndLink
        && env.permOfInstance(objectId) === 'edit' && env.permOfClassName(ref.of) === 'edit';
    const instanceReason = newInstanceReason(env.shapeCtx.shape().classes[ref.of], env.countsByName[ref.of] ?? 0);
    const createFor = (rowIndex?: number) => createControl({
        writable,
        reason: instanceReason ?? (newTargetAt(ref, ruled, rowIndex) === null ? `Slot full [${ruled.rows.length}/${upperText}]` : null),
    });

    // R-REF-6: a reference the author hides is listed only with targets or with a create offered.
    if (authorHidden && rows.length === 0 && createFor().state !== 'enabled') return null;

    const consume = (r: WriteResult) => {
        setRefusal(r.ok ? null : (r.reason ?? UNSTATED_REFUSAL));
        if (r.changed) env.markDirty(objectId, ref.key);
    };
    const live = () => env.liveSlot(objectId, ref);
    const open = (id: string) => env.drillTo(id, ref.key, via ?? undefined);

    const togglePicker = (e: React.MouseEvent<HTMLButtonElement>, row: number | null) => {
        const button = e.currentTarget;
        if (picker && picker.opener === button) { setPicker(null); return; }
        const card = button.closest('.cfg-panel__ref-card, .cfg-panel__ref-list') ?? button;
        setPicker({ anchor: card.getBoundingClientRect(), opener: button, row });
    };
    const closePicker = (refocus: boolean) => {
        const p = picker;
        setPicker(null);
        if (refocus && p?.opener.isConnected) p.opener.focus();
    };
    /** A candidate of the open picker: change the row, set the empty single, or append. */
    const pick = (id: string) => {
        const p = picker;
        if (!p) return;
        const now = live();
        if (p.row !== null) {
            const row = now.rows.find(r => r.index === p.row);
            if (row?.actions.includes('change')) consume(setValue(objectId, ref.key, p.row, id, true));
            return;
        }
        if (now.link === 'append') {
            if (!now.rows.some(r => r.value === id)) consume(appendValue(objectId, ref.key, id, true));
        } else if (now.link !== null) {
            consume(setValue(objectId, ref.key, now.link, id, true));
        }
    };
    /** «(none)»: the unlink of the row, at its index (R-CFG-7: a required single one too). */
    const pickNone = () => {
        const p = picker;
        if (!p || p.row === null) return;
        const row = live().rows.find(r => r.index === p.row);
        if (row && canUnlink(ref, row)) consume(clearValue(objectId, ref.key, p.row, true));
    };
    /** «+ New»: created by the host and linked where `newTargetAt` says (Q4 of the report). */
    const createNew = (rowIndex: number | null) => {
        if (!env.onCreateAndLink || createFor(rowIndex ?? undefined).state !== 'enabled') return;
        const at = newTargetAt(ref, live(), rowIndex ?? undefined);
        if (at === null) return;
        env.onCreateAndLink(ref.of, objectId, ref.key, at === 'append' ? undefined : at);
        env.markDirty(objectId, ref.key);
    };
    /** «Remove from the list»: unlink at the raw index, never delete. The second click of a double
     *  click is ignored: the rows below move up, and it would unlink the next one (the hazard
     *  `MenuShield` covers in the Data Manager). */
    const remove = (e: React.MouseEvent, row: RefSlotRow) => {
        if (e.detail > 1) return;
        const now = live().rows.find(r => r.index === row.index && r.value === row.value);
        if (now && canUnlink(ref, now)) consume(clearValue(objectId, ref.key, row.index, true));
    };

    const shown: FieldDiagnostic[] = refusal ? [{ severity: 'error', message: refusal }, ...diagnostics] : diagnostics;
    const titleId = `cfg-panel-ref-${objectId}-${ref.key}`;
    const nameOf = (row: RefSlotRow) => (row.broken ? row.value : labelOf(env.idlookup, row.value, ref.of));
    const summaryOf = (row: RefSlotRow) => (row.broken ? '' : summaryLine(env.summaryOf(row.value)));
    const openButton = (row: RefSlotRow) => row.actions.includes('open') && (
        <button type="button" className="cfg-panel__icon" aria-label={`Open ${nameOf(row)}`} title="Open" onClick={() => open(row.value)}>
            <i className="bi bi-box-arrow-in-right" aria-hidden="true" />
        </button>
    );
    /** R-CFG-7: on every row the viewer may unlink, a single required one included. */
    const removeButton = (row: RefSlotRow) => canUnlink(ref, row) && (
        <button
            type="button"
            className="cfg-panel__icon"
            aria-label={`Remove ${nameOf(row)} from ${label}`}
            title="Remove from the list (the element is not deleted)"
            onClick={e => remove(e, row)}
        >
            <i className="bi bi-x-lg" aria-hidden="true" />
        </button>
    );
    const brokenGlyph = (row: RefSlotRow) => row.broken && (
        <i className="bi bi-exclamation-triangle cfg-panel__broken" title={`Dangling pointer: ${row.value}`} aria-hidden="true" />
    );
    const chevron = (row: number | null) => (
        <button
            type="button"
            className="cfg-panel__icon cfg-panel__chevron"
            aria-haspopup="listbox"
            aria-expanded={!!picker && picker.row === row}
            aria-label={`Choose ${label}`}
            title="Choose"
            onClick={e => togglePicker(e, row)}
        >
            <i className="bi bi-chevron-down" aria-hidden="true" />
        </button>
    );
    const emptySingleOffers = controls.link !== null || createFor().state !== 'hidden';

    return (
        <div
            className={`cfg-panel__component cfg-panel__component--reference${single ? '' : ' cfg-panel__component--multi'}`}
            data-component={ref.key}
            data-kind="reference"
            data-problems={problemsAttr(diagnostics)}
        >
            <FieldTitle
                id={titleId}
                label={label}
                lower={ref.lower}
                upper={ref.upper}
                derived={ref.derived}
                count={controls.rows.length}
                typeName={ref.of}
                readOnly={ref.readOnly}
                dirty={env.isDirty(objectId, ref.key)}
            />
            <DiagLine shown={shown} />
            {single ? (
                rows.length === 0 ? (
                    <div className="cfg-panel__ref-card cfg-panel__ref-card--empty" role="group" aria-labelledby={titleId}>
                        <span className="cfg-panel__none">(none selected)</span>
                        {emptySingleOffers && chevron(null)}
                    </div>
                ) : rows.map(row => (
                    <div className={`cfg-panel__ref-card${row.broken ? ' cfg-panel__ref-card--broken' : ''}`} key={row.index} data-row={row.index} role="group" aria-labelledby={titleId}>
                        <div className="cfg-panel__ref-main">
                            <span className="cfg-panel__ref-name">{row.broken ? row.value : (navStepOf(env.idlookup, row.value)?.name || nameOf(row))}</span>
                            {summaryOf(row) && <span className="cfg-panel__ref-summary">{summaryOf(row)}</span>}
                        </div>
                        {brokenGlyph(row)}
                        {removeButton(row)}
                        {openButton(row)}
                        {row.actions.includes('change') && chevron(row.index)}
                    </div>
                ))
            ) : (
                <div className="cfg-panel__ref-list" role="group" aria-labelledby={titleId}>
                    {rows.map(row => (
                        <div className={`cfg-panel__ref-row${row.broken ? ' cfg-panel__ref-row--broken' : ''}`} key={row.index} data-row={row.index}>
                            <div className="cfg-panel__ref-main">
                                <span className="cfg-panel__ref-name">{nameOf(row)}</span>
                                {summaryOf(row) && <span className="cfg-panel__ref-summary">{summaryOf(row)}</span>}
                            </div>
                            {brokenGlyph(row)}
                            {removeButton(row)}
                            {openButton(row)}
                        </div>
                    ))}
                    {controls.lockedBy === null && !authorHidden && (
                        <button
                            type="button"
                            className="cfg-panel__add"
                            disabled={controls.link === null}
                            title={controls.link === null ? `Slot full [${controls.rows.length}/${upperText}]` : `Link a ${ref.of} to ${label}`}
                            aria-haspopup="listbox"
                            aria-expanded={!!picker && picker.row === null}
                            onClick={e => togglePicker(e, null)}
                        >
                            <i className="bi bi-plus-lg" aria-hidden="true" />
                            Add target
                        </button>
                    )}
                    {authorHidden && createFor().state === 'enabled' && (
                        <button type="button" className="cfg-panel__add" onClick={() => createNew(null)}>
                            <i className="bi bi-plus-lg" aria-hidden="true" />
                            New {ref.of}
                        </button>
                    )}
                </div>
            )}
            {picker && (() => {
                const offered = env.offerFor(objectId, ref.key);
                const options = picker.row === null && !single ? assignableOptions(offered, live().rows.map(r => r.value)) : offered;
                const row = picker.row !== null ? controls.rows.find(r => r.index === picker.row) : undefined;
                const canLink = picker.row !== null ? !!row?.actions.includes('change') : controls.link !== null;
                return (
                    <ComponentPicker
                        anchor={picker.anchor}
                        opener={picker.opener}
                        label={`Choose ${label}`}
                        options={canLink ? options : []}
                        value={row?.value ?? ''}
                        allowNone={!!row && canUnlink(ref, row)}
                        typeName={ref.of}
                        create={createFor(picker.row ?? undefined)}
                        onPick={pick}
                        onNone={pickNone}
                        onNew={() => createNew(picker.row)}
                        onClose={closePicker}
                    />
                );
            })()}
        </div>
    );
}

function CompositionSlot({ objectId, comp, readOnly, diagnostics, depth, via }: {
    objectId: string;
    comp: Component;
    readOnly: boolean;
    diagnostics: FieldDiagnostic[];
    depth: number;
    via: Via;
}) {
    const env = usePanelEnv();
    const { ref, label } = comp;

    // #157 step B: a child of a type the role hides is not listed.
    const ids = childrenIn(env.idlookup, objectId, ref.key).filter(id => env.permOfInstance(id) !== 'hidden');
    const count = childSlotCount(objectId, ref.key);
    const single = ref.upper === 1;
    // The subject's children are cards with a body at the inline level; a card's own children,
    // and every child past that level, are simplified (#187 task 10).
    const inline = via === null && rendersInline(depth);
    const writable = !readOnly && !ref.readOnly && !ref.derived && !!env.onCreate && env.permOfClassName(ref.of) === 'edit';
    const create = createControl({ writable, reason: addChildReason(ref, count, env.shapeCtx.shape().classes[ref.of]) });
    const titleId = `cfg-panel-ref-${objectId}-${ref.key}`;

    const add = () => {
        if (create.state !== 'enabled' || !env.onCreate) return;
        env.onCreate(ref.of, objectId, ref.key);
        env.markDirty(objectId, ref.key);
    };
    const createButton = (text: string, aria: string) => create.state !== 'hidden' && (
        <button type="button" className="cfg-panel__add" disabled={create.state === 'disabled'} title={create.reason ?? undefined} aria-label={aria} onClick={add}>
            <i className="bi bi-plus-lg" aria-hidden="true" />
            {text}
        </button>
    );

    const card = (id: string) => {
        const name = labelOf(env.idlookup, id, ref.of);
        const body = inline && (single || env.isExpanded(id));
        const expandable = inline && !single;
        const canDelete = !!env.openDelete && !readOnly && env.permOfInstance(id) === 'edit';
        const summary = body ? '' : summaryLine(env.summaryOf(id));
        return (
            <div className={`cfg-panel__child${body ? ' cfg-panel__child--open' : ''}`} key={id} data-child={id}>
                <div className="cfg-panel__child-head">
                    {expandable && (
                        <button type="button" className="cfg-panel__icon" aria-expanded={body} aria-label={`${body ? 'Collapse' : 'Expand'} ${name}`} title={body ? 'Collapse' : 'Expand'} onClick={() => env.toggleExpanded(id)}>
                            <i className={`bi bi-chevron-${body ? 'down' : 'right'}`} aria-hidden="true" />
                        </button>
                    )}
                    <div className="cfg-panel__ref-main">
                        <span className="cfg-panel__ref-name">{name}</span>
                        {summary && <span className="cfg-panel__ref-summary">{summary}</span>}
                    </div>
                    {canDelete && (
                        <button type="button" className="cfg-panel__icon" aria-label={`Delete ${name}`} title="Delete" onClick={() => env.openDelete!(id)}>
                            <i className="bi bi-trash" aria-hidden="true" />
                        </button>
                    )}
                    <button type="button" className="cfg-panel__icon" aria-label={`Open ${name}`} title="Open" onClick={() => env.drillTo(id, ref.key, via ?? undefined)}>
                        <i className="bi bi-box-arrow-in-right" aria-hidden="true" />
                    </button>
                </div>
                {body && (
                    <div className="cfg-panel__child-body">
                        <ObjectView objectId={id} depth={depth + 1} via={{ id, key: ref.key }} />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div
            className={`cfg-panel__component cfg-panel__component--composition${single ? '' : ' cfg-panel__component--multi'}`}
            data-component={ref.key}
            data-kind="composition"
            data-problems={problemsAttr(diagnostics)}
        >
            <FieldTitle
                id={titleId}
                label={label}
                lower={ref.lower}
                upper={ref.upper}
                derived={ref.derived}
                count={count}
                typeName={ref.of}
                readOnly={ref.readOnly}
                dirty={env.isDirty(objectId, ref.key)}
            />
            <DiagLine shown={diagnostics} />
            <div className="cfg-panel__children" role="group" aria-labelledby={titleId}>
                {single && ids.length === 0 ? (
                    <div className="cfg-panel__ref-card cfg-panel__ref-card--empty">
                        <span className="cfg-panel__none">(none added)</span>
                        {createButton('New', `New ${ref.of} in ${label}`)}
                    </div>
                ) : ids.map(card)}
                {!single && createButton(`Add ${ref.of}`, `Add ${ref.of} to ${label}`)}
            </div>
        </div>
    );
}
