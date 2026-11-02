/**
 * PanelFields — the Identity and Attributes sections of one element of the Configurator panel
 * (#187, P-2026-10-14-1100), and what the panel's parts share.
 *
 * ── The widgets are the form's ─────────────────────────────────────────────────
 *
 * Every attribute is rendered by `IRFormField`, mounted here exactly as `IRForm` mounts it
 * (`IRForm.tsx:686-706`): the same widgets, the same extended widgets of the width map, the same
 * read-only, locked and auto-id branches, the same refusal and dirty messages. A second dispatch
 * would be the drift R-CFG-2 accepts for the panel's structure and not for its widgets. What
 * changes is the title above it: `name (cardinality) [Type]` (#187 tasks 7 and 8) in place of the
 * field's own label row, which `configuratorPanel.scss` hides under `.cfg-panel`. The title is a
 * `<label for>` bound to the id the field gives its control (`ir-field-<slotId>`), and every
 * widget carries `aria-label` as well.
 *
 * The widgets take their scale from custom properties declared on `.ir-form`
 * (`irFormStyle.scss:27-73`), so the panel's body carries that class.
 *
 * ── Read only for this role ────────────────────────────────────────────────────
 *
 * An element of a type the role reads is passed to the field as read-only (`isReadOnly`), so the
 * dispatch takes its read-only branches and no input is rendered: the soft gate of
 * `InstanceDetail` (pointer events off) left four tabbable controls inside it (measured,
 * `docs/discovery/discovery_2026-10-14_187_configurator_panel.md` §4.5).
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DATA_MANAGER_VIEWPOINT_ID, LPointerTargetable, store } from '../../../joiner';
import { useIRFormView } from '../../editor-v2/viewpoint/ir/useIRFormView';
import { describeSlots, type FormFieldDescriptor, type FormFieldOptionGroup } from '../../editor-v2/viewpoint/ir/useFormWidgets';
import { orderFields, resolveFormSpec } from '../../editor-v2/viewpoint/ir/formHosts';
import { featureAccessIn, isLockedValue, offerForProfile, withoutHiddenFeatures, type ProfileReads } from '../../editor-v2/viewpoint/ir/formPermissions';
import { autoLayoutRows, inputFromDescriptor, spanWithOverflow, type LayoutField } from '../../editor-v2/viewpoint/ir/formAutoLayout';
import { useChipOverflow } from '../../editor-v2/viewpoint/ir/useChipOverflow';
import { setObjectName } from '../../editor-v2/viewpoint/ir/formWrite';
import { worstSeverity, type FieldDiagnostic, type FormDiagnostics } from '../../editor-v2/viewpoint/ir/formDiagnostics';
import { makeWriteCtx } from '../../editor-v2/hooks/writeCtxLproxy';
import IRFormField from '../../editor-v2/viewpoint/ir/IRFormField';
import TextWidget from '../../editor-v2/viewpoint/ir/widgets/TextWidget';
import { targetOptions } from '../../../jjform';
import type { LayoutAnnotations, RefShape, RefSlotControls, ShapeCtx } from '../../../jjform';
import type { FormSpec } from '../../editor-v2/viewpoint/ir/irTypes';
import type { SummaryItem } from '../../abstract/tabs/instanceTable';
import type { DetailPermission } from '../../abstract/tabs/InstanceDetail';
import { fieldPresentationOf, sanitizeDeclarations, textPropsOf, type TypePresentation } from '../../../joiner/environmentConfig';
import { cardinalityText, foldKey, parseFolds, partitionFields, roleRendering, serializeFolds, typeLabel, type SectionKey } from './panelModel';
import { PanelDropdown } from './PanelDropdown';

/** What the panel's parts share: the store, the role, the host's gestures, the panel's bookkeeping. */
export interface PanelEnv {
    idlookup: Record<string, any>;
    shapeCtx: ShapeCtx;
    /** The viewer's permission on an instance, on a metaclass by name. `edit` without a role. */
    permOfInstance: (id: string | null | undefined) => DetailPermission;
    permOfClassName: (name: string) => DetailPermission;
    /** The role's reads (#157 step B); undefined without a role. */
    profileReads?: ProfileReads;
    /** Instances per metaclass name, for the singleton rule of `newInstanceReason`. */
    countsByName: Record<string, number>;
    /** The key fields of an element (`referenceSummary`), through the Data Manager's view. */
    summaryOf: (targetId: string) => SummaryItem[];
    /** A reference slot as `jjform/refSlot` rules it: on the render's lookup, and on the store now (R-REF-4). */
    ruleSlot: (objectId: string, ref: RefShape) => RefSlotControls;
    liveSlot: (objectId: string, ref: RefShape) => RefSlotControls;
    /** The candidates of a reference, asked when a picker opens, filtered for the role. */
    offerFor: (objectId: string, key: string) => FormFieldOptionGroup[];
    /** Written by this panel since the last save, by element and feature. */
    isDirty: (objectId: string, key: string) => boolean;
    markDirty: (objectId: string, key: string) => void;
    /** An element on screen says how many problems it has; null when it leaves the screen. */
    reportIssues: (objectId: string, counts: { errors: number; warnings: number } | null) => void;
    /** Open an element as the panel's body (`via`: the inline card it is reached through). */
    drillTo: (targetId: string, key: string, via?: { id: string; key: string }) => void;
    /** The child cards expanded in a multi-valued composition. Held by the panel, not by the card,
     *  so a Back finds the layout it left and its scroll offset is not clamped by a shorter page. */
    isExpanded: (childId: string) => boolean;
    toggleExpanded: (childId: string) => void;
    openDelete?: (instanceId: string) => void;
    onCreate?: (cls: string, ownerId: string | null, childKey: string | null) => void;
    onCreateAndLink?: (targetCls: string, sourceId: string, refKey: string, at?: number) => void;
    /** #186: the active role's presentation of a metaclass, by DClass id. Absent: no role (the
     *  developer overlay), nothing presented. */
    presentationOf?: (classId: string) => TypePresentation | null;
    /** #186: the RENDER of «Customize element»: the sections ignore their remembered folds. */
    preview?: boolean;
}

export const PanelEnvContext = createContext<PanelEnv | null>(null);

export function usePanelEnv(): PanelEnv {
    const env = useContext(PanelEnvContext);
    if (!env) throw new Error('[ConfiguratorPanel] a panel part was rendered outside the panel');
    return env;
}

/** The folded sections of a metaclass, remembered in localStorage (a convenience: try/catch). */
export function useFolds(classId: string | null): [Set<SectionKey>, (k: SectionKey) => void] {
    const key = classId ? foldKey(classId) : null;
    const read = useCallback((): Set<SectionKey> => {
        if (!key) return new Set();
        try {
            return parseFolds(localStorage.getItem(key));
        } catch {
            return new Set();
        }
    }, [key]);
    const [folds, setFolds] = useState<Set<SectionKey>>(read);
    useEffect(() => { setFolds(read()); }, [read]);
    const toggle = useCallback((k: SectionKey) => {
        setFolds(prev => {
            const next = new Set(prev);
            if (next.has(k)) next.delete(k); else next.add(k);
            if (key) {
                try {
                    localStorage.setItem(key, serializeFolds(next));
                } catch {
                    // Private mode, quota, disabled storage: the fold is a convenience.
                }
            }
            return next;
        });
    }, [key]);
    return [folds, toggle];
}

/** The heading of a section: a button that folds it, the chevron saying which way (#187 task 6). */
export function SectionHead({ title, folded, onToggle }: { title: string; folded: boolean; onToggle: () => void }) {
    return (
        <button type="button" className="cfg-panel__section-head" aria-expanded={!folded} onClick={onToggle}>
            <span className="cfg-panel__section-title">{title}</span>
            <i className={`bi bi-chevron-${folded ? 'right' : 'down'} cfg-panel__section-chevron`} aria-hidden="true" />
        </button>
    );
}

/** A field or component title: `label (cardinality) [Type]` (#187 task 7). */
export function FieldTitle({ label, htmlFor, id, lower, upper, derived, count, typeName, readOnly, dirty, hint, bare, showType = true }: {
    label: string;
    /** The control the title labels; absent for a component, which is not one control. */
    htmlFor?: string;
    id?: string;
    lower: number;
    upper: number;
    derived?: boolean;
    count?: number;
    typeName: string;
    readOnly?: boolean;
    dirty?: boolean;
    hint?: string | null;
    /** Identity's title: the name and its type, no cardinality (mockup). */
    bare?: boolean;
    /** #186: the role's «isTypeShown»; false drops `[Type]`. */
    showType?: boolean;
}) {
    return (
        <div className="cfg-panel__title" id={id}>
            {dirty && <span className="cfg-panel__dirty" title="Modified, not saved" aria-hidden="true" />}
            {htmlFor
                ? <label className="cfg-panel__label" htmlFor={htmlFor}>{label}</label>
                : <span className="cfg-panel__label">{label}</span>}
            {/* Spaces in the text, not only the gap: the title reads as one phrase, copied or spoken. */}
            {!bare && <>{' '}<span className="cfg-panel__cardinality">({cardinalityText({ lower, upper, derived, count })})</span></>}
            {showType && <>{' '}<span className="cfg-panel__type">[{typeLabel(typeName)}]</span></>}
            {readOnly && <i className="bi bi-lock-fill cfg-panel__lock" title="Read-only" aria-hidden="true" />}
            {hint && <>{' '}<span className="cfg-panel__hint">{hint}</span></>}
        </div>
    );
}

/** The severities of some diagnostics, as the `data-problems` the issues chip looks for. */
export function problemsAttr(ds: readonly FieldDiagnostic[] | undefined): string | undefined {
    return ds && ds.length ? Array.from(new Set(ds.map(d => d.severity))).join(' ') : undefined;
}

/** One cell of the attributes' 12-column grid: `IRForm`'s `FormCell`, the chip promotion included. */
function FieldCell({ layout, children }: { layout: LayoutField; children: React.ReactNode }) {
    const { ref, promoted } = useChipOverflow(layout.growsOnOverflow);
    const span = spanWithOverflow(layout, promoted);
    return (
        <div
            ref={ref}
            className={`ir-form__cell${layout.stretched ? ' ir-form__cell--stretched' : ''}${promoted ? ' ir-form__cell--promoted' : ''}`}
            style={{ ['--ir-form-span' as any]: String(span) }}
            data-width-kind={layout.kind}
            data-width-rung={layout.rung}
        >
            {children}
        </div>
    );
}

/** What the panel reads of one element: its view, its described attributes, its offer. */
export interface ObjectModel {
    /** The Data Manager view's form spec of this element (labels, order, hidden, widgets). */
    spec: FormSpec | undefined;
    /** Every described feature the role does not hide, in the view's order. */
    fields: FormFieldDescriptor[];
    name: string;
    accessOf: (key: string) => ReturnType<typeof featureAccessIn>;
    offer: (key: string) => ReturnType<typeof targetOptions>;
}

/** The element as `IRForm` reads it (`IRForm.tsx:212-401`), host `manager`, every feature (no Basic). */
export function useObjectModel(objectId: string, profileReads: ProfileReads | undefined): ObjectModel | null {
    const resolution = useIRFormView(objectId, DATA_MANAGER_VIEWPOINT_ID);
    const ctx = useMemo(() => makeWriteCtx(), []);
    const spec = useMemo(() => resolveFormSpec(resolution?.compiled?.formSpec ?? undefined, 'manager'), [resolution]);
    const accessOf = useCallback(
        (key: string) => featureAccessIn((store.getState() as any)?.idlookup, objectId, key),
        [objectId],
    );
    const offer = useCallback((key: string) => {
        const offered = targetOptions(ctx, objectId, key);
        return profileReads ? offerForProfile(offered, accessOf(key), profileReads) : offered;
    }, [ctx, objectId, profileReads, accessOf]);
    if (!resolution) return null;
    const lObject: any = LPointerTargetable.fromPointer(objectId);
    if (!lObject) return null;
    const described = withoutHiddenFeatures(describeSlots(lObject.features ?? [], spec, offer), accessOf, profileReads);
    return { spec, fields: orderFields(described, spec), name: lObject.name ?? '', accessOf, offer };
}

/** The hint the field's label row prints for an authored JjEL area, moved to the title. */
function jjelHint(f: FormFieldDescriptor): string | null {
    return f.widget === 'textarea' && f.derivedWidget !== 'textarea' ? 'JjEL' : null;
}

/**
 * Identity and Attributes of one element (#187 task 6): the name only, then every other attribute.
 * The name is the `name` attribute when the class declares one (its slot propagates onto
 * `DObject.name`, root CLAUDE.md §3.12), otherwise `DObject.name` through `setObjectName`.
 */
export function ObjectFields({ objectId, model, readOnly, diagnostics, folds, onToggle, presentation }: {
    objectId: string;
    model: ObjectModel;
    readOnly: boolean;
    diagnostics: FormDiagnostics;
    folds: Set<SectionKey>;
    onToggle: (k: SectionKey) => void;
    /** #186: the role's presentation of this element's class, null without one. */
    presentation?: TypePresentation | null;
}) {
    const env = usePanelEnv();
    const { identity, attributes } = partitionFields(model.fields);
    const [nameRefusal, setNameRefusal] = useState<string | null>(null);
    useEffect(() => { setNameRefusal(null); }, [objectId]);

    /** #186: a feature's presentation, and how its widget renders (none on a read-only element). */
    const presented = (f: FormFieldDescriptor) => {
        const fp = fieldPresentationOf(presentation, f.name);
        return { fp, rr: fp && !readOnly ? roleRendering(fp.widget, f) : null };
    };

    const layoutAnnotations = useMemo<LayoutAnnotations>(() => {
        const out: LayoutAnnotations = {};
        for (const f of attributes) {
            // #186: the role's textarea is the width map's growing box, asked for as the metamodel would.
            const multiline = presented(f).rr?.multiline ? true : f.annotations?.multiline;
            out[f.name] = { renderer: f.annotations?.renderer, multiline };
        }
        return out;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attributes, presentation, readOnly]);
    const rows = autoLayoutRows(attributes.map(inputFromDescriptor), layoutAnnotations);
    const byName = new Map(attributes.map(f => [f.name, f]));

    const field = (f: FormFieldDescriptor, layout: LayoutField | undefined, bare: boolean) => {
        const ds = diagnostics.byField.get(f.name);
        const dirty = env.isDirty(objectId, f.name);
        const { fp, rr } = presented(f);
        const base = readOnly ? { ...f, isReadOnly: true } : f;
        const shown = rr ? { ...base, widget: rr.widget } : base;
        const cellLayout = layout && rr?.cellWidget ? { ...layout, widget: rr.cellWidget } : layout;
        // #186: the field's CSS on its box; the text properties it declares also reach the title and
        // the control, through one scoped rule each (`data-cfg-text`, configuratorPanel.scss).
        const css = sanitizeDeclarations(fp?.style);
        const textProps = textPropsOf(css.style).join(' ');
        return (
            <div
                className={`cfg-panel__field${rr?.numberInput ? ' cfg-panel__field--number-input' : ''}`}
                data-field={f.name}
                data-problems={problemsAttr(ds)}
                data-cfg-text={textProps || undefined}
                style={css.text ? (css.style as React.CSSProperties) : undefined}
            >
                <FieldTitle
                    label={fp?.label ?? f.label ?? f.name}
                    htmlFor={`ir-field-${f.slotId}`}
                    lower={f.lowerBound}
                    upper={f.upperBound}
                    derived={f.isDerived}
                    count={f.filled.length}
                    typeName={f.typeName}
                    readOnly={shown.isReadOnly}
                    dirty={dirty}
                    hint={jjelHint(shown)}
                    bare={bare}
                    showType={fp?.showType !== false}
                />
                {rr?.dropdown ? (
                    <PanelDropdown
                        objectId={objectId}
                        field={shown}
                        options={fp?.options ?? []}
                        allowOther={rr.dropdown === 'string' && fp?.allowOther === true}
                        numeric={rr.dropdown === 'number'}
                        diagnostics={ds}
                        dirty={dirty}
                        onCommitted={() => env.markDirty(objectId, f.name)}
                    />
                ) : (
                    <IRFormField
                        objectId={objectId}
                        field={shown}
                        offer={model.offer}
                        diagnostics={ds}
                        dirty={dirty}
                        onCommitted={() => env.markDirty(objectId, f.name)}
                        layout={cellLayout}
                        isLocked={env.profileReads
                            ? (id: string) => isLockedValue(id, model.accessOf(f.name), env.profileReads)
                            : undefined}
                    />
                )}
            </div>
        );
    };

    const nameId = `cfg-panel-name-${objectId}`;
    const identityFolded = folds.has('identity');
    const attributesFolded = folds.has('attributes');
    return (
        <>
            <section className="cfg-panel__section" data-section="identity">
                <SectionHead title="Identity" folded={identityFolded} onToggle={() => onToggle('identity')} />
                {!identityFolded && (identity ? field(identity, undefined, true) : (
                    <div className="cfg-panel__field" data-field="name">
                        <FieldTitle label="name" htmlFor={readOnly ? undefined : nameId} lower={1} upper={1} typeName="EString"
                            readOnly={readOnly} dirty={env.isDirty(objectId, 'name')} bare />
                        <div className={`ir-field${nameRefusal ? ' ir-field--error' : ''}${env.isDirty(objectId, 'name') ? ' ir-field--dirty' : ''}`}>
                            {readOnly ? (
                                <div className="ir-field__readonly">{model.name || <span className="ir-field__empty">empty</span>}</div>
                            ) : (
                                <TextWidget
                                    id={nameId}
                                    ariaLabel="name"
                                    value={model.name}
                                    invalid={!!nameRefusal}
                                    onCommit={(next) => {
                                        const r = setObjectName(objectId, next);
                                        setNameRefusal(r.ok ? null : (r.reason ?? 'The model refused this change'));
                                        if (r.changed) env.markDirty(objectId, 'name');
                                    }}
                                />
                            )}
                            <div className="ir-field__message" role={nameRefusal ? 'alert' : undefined}>
                                {nameRefusal ? (
                                    <>
                                        <i className="bi bi-x-circle-fill ir-field__message-icon" aria-hidden="true" />
                                        <span className="ir-field__message-text" title={nameRefusal}>{nameRefusal}</span>
                                    </>
                                ) : env.isDirty(objectId, 'name') ? 'Modified, not saved' : null}
                            </div>
                        </div>
                    </div>
                ))}
            </section>
            {attributes.length > 0 && (
                <section className="cfg-panel__section" data-section="attributes">
                    <SectionHead title="Attributes" folded={attributesFolded} onToggle={() => onToggle('attributes')} />
                    {!attributesFolded && rows.map((row, ri) => (
                        <div className="ir-form__row" key={`attr-row-${ri}`} data-free={row.free}>
                            {row.fields.map(lf => {
                                const f = byName.get(lf.key);
                                if (!f) return null;
                                return <FieldCell layout={lf} key={f.slotId}>{field(f, lf, false)}</FieldCell>;
                            })}
                        </div>
                    ))}
                </section>
            )}
        </>
    );
}

/** The first diagnostic line of a component, a refusal first: `RefSlotsSection`'s rule (`InstanceDetail.tsx:488-531`). */
export function DiagLine({ shown }: { shown: FieldDiagnostic[] }) {
    const worst = worstSeverity(shown);
    if (!worst) return null;
    return (
        <p className={`cfg-panel__diag cfg-panel__diag--${worst}`} role="alert" data-severity={worst}>
            <i className={`bi ${worst === 'error' ? 'bi-x-circle-fill' : 'bi-exclamation-triangle-fill'}`} aria-hidden="true" />
            {shown[0].message}
        </p>
    );
}
