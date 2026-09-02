/**
 * IRForm, renders a model object as a form of editable widgets.
 *
 * The second rendering mode of a view. The same view that draws a symbol on the canvas
 * (applies-to, predicate, priority, compartments) can also render as a form; what the
 * form adds is the `FormSpec` supplement, and everything it adds is optional. An object
 * whose view declares no `form`, or which no view matches at all, still renders: the
 * fields are derived from the metamodel and the sections from whatever the object has.
 * That fallback is the normal case today, not an error state (spec v1.2 sez. 10).
 *
 * Slice 1a covers the `plain` theme in the Properties rail. The theme is already read
 * from the spec and carried on the root as a class, so the remaining three are a
 * stylesheet away; the host's default is passed in rather than materialized at compile,
 * because the default differs per host (plain in the rail, card in the document).
 *
 * ── FL4: the auto-layout, the theme and the extended widgets ───────────────────
 *
 * The body is no longer a vertical list of label-and-field. Each section is packed into
 * the spec's 12-COLUMN GRID by `formAutoLayout.autoLayoutRows`, which is FL1's packer
 * reached through the adapter: the metamodel decides where a field sits, and there is no
 * per-field width and no layout control anywhere in this component — the only choice the
 * user has is the theme preset, and the theme cannot move a field.
 *
 * The theme is FL2's, resolved through `resolveFormTheme` from what the saved IR actually
 * carries (the panel skin, plus `FormSpec.labelPlacement` when the author stated one — see
 * spec amendment A2). It reaches the DOM as CSS custom properties and three data
 * attributes; the four legacy skin classes stay exactly as they were, so nothing that
 * renders today changes because of a preset it never chose.
 *
 * One field width is decided at RUNTIME and only one: a chip input promotes from half a row
 * to the whole row when its chips outgrow the half (`useChipOverflow`, hysteresis in
 * `overflowVerdict`). That is the spec's rule 2 and the only measurement in the form.
 *
 * Reactivity is `useIRFormView`, whose signature covers the object's name, its metaclass
 * and every slot's values, plus one selector of its own for what that signature cannot
 * see: the `jjodel/…` declarations, which hang off the METAFEATURE and not off the object
 * (IRF1 — see the comment on `annotationSignature`). This component holds no model state,
 * only the Basic/Advanced mode, which is a property of the viewer, not of the model.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { LPointerTargetable, U } from '../../../../joiner';
import { entityLetter, resolveEntityType } from '../../../../common/entityMeta';
import { getInterfaceMode } from '../../../../hooks/useInterfaceMode';
import { SegmentedControl } from '../../../ui';
import { useIRFormView } from './useIRFormView';
import { describeSlots, isBasicField, type FieldOffer } from './useFormWidgets';
import { targetOptions } from '../../../../jjform';
import { makeWriteCtx } from '../../hooks/writeCtxLproxy';
import { ROW_VIEW_ANNOTATION_PREFIX } from '../../nodes/rowViewAnnotations';
import { setObjectName } from './formWrite';
import { useNodeProblems } from '../../problems/useNodeProblems';
import { collectFormDiagnostics } from './formDiagnostics';
import { buildFormSections } from './formSections';
import type { FormSpec, FormTheme } from './irTypes';
import type { LayoutAnnotations } from '../../../../jjform';
import {
    autoLayoutRows,
    chromeOf,
    inputFromDescriptor,
    isFormThemeName,
    resolveFormTheme,
    spanWithOverflow,
    themeVars,
    type LayoutField,
} from './formAutoLayout';
import { useChipOverflow } from './useChipOverflow';
import IRFormField from './IRFormField';
import TextWidget from './widgets/TextWidget';
import './irFormStyle.scss';

export type FormMode = 'basic' | 'advanced';

export interface IRFormProps {
    /** DObject id. The form's subject is an M1 object; M2 elements keep the classic panel. */
    objectId: string;
    /** Host default when the view declares no theme. */
    defaultTheme?: FormTheme;
}

/**
 * Per-view mode preference.
 *
 * Keyed by view id and stored as an object rather than a bare string: the inspector
 * theme's collapse state and the theme override itself will want the same entry, and a
 * second key per concern is how a preference namespace turns into a swamp. The dotted
 * prefix is the newest of the four naming conventions in use and the only one with an
 * established per-scope idiom (`jjodel.editorPrefs.<modelid>`).
 */
const PREF_PREFIX = 'jjodel.formPrefs.';

/** Everything the form remembers per view. One entry, not one key per concern: the comment
 *  on PREF_PREFIX anticipated the collapse state landing beside the mode, and it does. */
interface FormPrefs { mode?: FormMode; collapsed?: string[] }

function readPrefs(viewKey: string): FormPrefs {
    try {
        const raw = localStorage.getItem(PREF_PREFIX + viewKey);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') return parsed as FormPrefs;
        }
    } catch {
        // A corrupt or unreadable entry is not worth a broken panel.
    }
    return {};
}

function readMode(viewKey: string): FormMode {
    const m = readPrefs(viewKey).mode;
    if (m === 'basic' || m === 'advanced') return m;
    // No preference for THIS view yet: inherit the user's global interface mode rather
    // than hardcoding 'basic', so a form opened for the first time agrees with the rest
    // of the app instead of contradicting it.
    return getInterfaceMode();
}

function readCollapsed(viewKey: string): Set<string> {
    const c = readPrefs(viewKey).collapsed;
    return new Set(Array.isArray(c) ? c.filter(x => typeof x === 'string') : []);
}

/** Merge one field into the stored entry, so writing the mode does not drop the collapse
 *  state and the other way round. */
function writePrefs(viewKey: string, patch: FormPrefs): void {
    try {
        localStorage.setItem(PREF_PREFIX + viewKey, JSON.stringify({ ...readPrefs(viewKey), ...patch }));
    } catch {
        // Private mode, quota, disabled storage: the preference is a convenience.
    }
}

const MODE_OPTIONS: { value: FormMode; label: string }[] = [
    { value: 'basic', label: 'Basic' },
    { value: 'advanced', label: 'Advanced' },
];


/**
 * One cell of the 12-column grid.
 *
 * A component and not an inline `<div>` because of the hook: `useChipOverflow` measures ONE
 * cell, and a hook cannot be called from inside a `.map`. That constraint is also the right
 * shape — a chip input that promotes measures itself and re-renders itself, and a field that
 * is not one passes `enabled: false` and observes nothing.
 *
 * The span reaches CSS as a custom property rather than as a class per width: three classes
 * would be three places to change when a width class is added, which rule 4 of the packing
 * says must be one row in a map.
 */
function FormCell({ layout, children }: { layout: LayoutField; children: React.ReactNode }) {
    const { ref, promoted } = useChipOverflow(layout.growsOnOverflow);
    const span = spanWithOverflow(layout, promoted);
    return (
        <div
            ref={ref}
            className={`ir-form__cell${layout.stretched ? ' ir-form__cell--stretched' : ''}${promoted ? ' ir-form__cell--promoted' : ''}`}
            style={{ ['--ir-form-span' as any]: String(span) }}
            data-width-kind={layout.kind}
            /* The rung that decided the width, for the same reason FL1 carries it: a layout
               nobody can interrogate is a layout nobody can go and correct at the metamodel. */
            data-width-rung={layout.rung}
        >
            {children}
        </div>
    );
}

export function IRForm({ objectId, defaultTheme = 'plain' }: IRFormProps) {
    const resolution = useIRFormView(objectId);

    // The L-proxy is read inside the render on purpose: `useIRFormView`'s signature
    // already covers everything read from it (name, metaclass, every slot's values), so a
    // second subscription would only duplicate that one.
    const lObject: any = useMemo(
        () => (resolution ? LPointerTargetable.fromPointer(objectId) : null),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [objectId, resolution],
    );

    const spec: FormSpec | undefined = resolution?.compiled?.formSpec ?? undefined;
    const viewKey = resolution?.compiled?.viewId ?? 'default';

    /**
     * The viewpoint rung of the theme cascade (slice STYLE2).
     *
     * Read from the ACTIVE viewpoint — `state.viewpoint` — and not from the resolved
     * view's own `viewpoint` pointer, for a reason that is the common case and not an
     * edge one: when no IR view matches, the form renders the metamodel-derived default
     * (`useIRFormView` returns `{compiled: null}` precisely so that case stays legible),
     * there is no view to ask, and a rung read off the view would be unreachable exactly
     * where most models live. `state.viewpoint` is also the source `irResolveCore`
     * indexes by (`if (d.viewpoint !== vp) continue`), so the theme and the views it
     * themes come from the same viewpoint by construction.
     *
     * Its own `useSelector` and not a field of `useIRFormView`'s signature: that
     * signature is the object's slot snapshot, rebuilt on every slot write, and adding a
     * viewpoint field to it would recompute the snapshot for a value that changes when
     * somebody picks a theme. A selector returning a string re-renders on that string.
     */
    const viewpointTheme = useSelector((state: any) => {
        const vp = state?.viewpoint;
        const t = vp ? state?.idlookup?.[vp]?.formTheme : undefined;
        return isFormThemeName(t) ? t : undefined;
    });

    const [mode, setMode] = useState<FormMode>(() => readMode(viewKey));
    const onMode = useCallback((m: FormMode) => {
        setMode(m);
        writePrefs(viewKey, { mode: m });
    }, [viewKey]);

    // Collapsed sections. Only the inspector theme exposes the control, but the state is kept
    // for every theme: switching theme and back should not lose what the user folded away.
    const [collapsed, setCollapsed] = useState<Set<string>>(() => readCollapsed(viewKey));
    const toggleSection = useCallback((key: string) => {
        setCollapsed(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            writePrefs(viewKey, { collapsed: Array.from(next) });
            return next;
        });
    }, [viewKey]);
    // A different view has its own entry; without this the sections of the previous one would
    // stay folded over the new one's, which do not even have the same keys.
    useEffect(() => { setCollapsed(readCollapsed(viewKey)); }, [viewKey]);

    /**
     * The host's write contract (S4), and since S5 also its OFFER.
     *
     * Built once per subject, with no model id: `create` is the only primitive that needs
     * one and this form does not create — the catalogue and the child bar do, through
     * their own adapters. Everything the form uses addresses by instance id.
     *
     * The offer is bound to `objectId` here and asked per feature key, so no proxy and no
     * id travels inside a descriptor. It is the same `ctx` the field writes through: the
     * candidates a picker shows and the values a write accepts come from one interface,
     * which is why `validTargets` sits on `WriteCtx` and not beside it.
     */
    const ctx = useMemo(() => makeWriteCtx(), []);
    const offer: FieldOffer = useCallback(
        (featureKey: string) => targetOptions(ctx, objectId, featureKey),
        [ctx, objectId],
    );

    /**
     * The METAFEATURE rung of the subscription (IRF1).
     *
     * `useIRFormView`'s signature is the object's own snapshot: name, metaclass, and every
     * slot's VALUES. A `jjodel/…` declaration lives one level above that, on the METAFEATURE
     * — `DValue.instanceof` → `DAttribute.annotations` → `DAnnotation.source` — so not one of
     * those four steps is in the snapshot, and the form did not re-render when a declaration
     * changed: turning Multiline (or Code, which is older than either toggle) on showed
     * nothing until some unrelated write redrew the panel. Measured, before and after, in
     * `docs/discovery/discovery_2026-09-01_irf1_annotation_subscription.md` §4.
     *
     * Its own `useSelector` and not a field of that signature, for the reason `viewpointTheme`
     * gives above and for one more of its own: widening the snapshot would re-run
     * `resolveIRView` and re-publish the cross-deps on every declaration, which is a whole
     * resolution pass bought for a width. This returns a STRING, so the default equality is
     * the right one and a dispatch that touched no declaration returns the same string and
     * re-renders nothing.
     *
     * It reads down to the `source`, and that is the load-bearing half rather than a detail.
     * The Display panel's two writes are not the same shape: the FIRST declaration creates a
     * `DAnnotation` and grows the pointer array, while clearing one and turning it back on
     * are `SetFieldAction`s on `DAnnotation.source` that leave the array untouched — measured
     * at length 1 → 1 with the source going `jjodel/multiline=true` → ``. A subscription on
     * `DAttribute.annotations` alone would light up on the first toggle and stay blind to
     * every one after it.
     *
     * The prefix is imported from `rowViewAnnotations`, the wire format's one owner, so an
     * annotation that arrived some other way does not redraw a form that cannot read it.
     */
    const annotationSignature = useSelector((state: any) => {
        const lookup = state?.idlookup;
        const featureIds = lookup?.[objectId]?.features;
        if (!lookup || !Array.isArray(featureIds)) return '';
        const parts: string[] = [];
        for (const fid of featureIds) {
            const metaId = lookup[fid]?.instanceof;
            if (typeof metaId !== 'string') continue;
            const annotations = lookup[metaId]?.annotations;
            if (!Array.isArray(annotations)) continue;
            for (const entry of annotations) {
                // Both shapes, exactly as `readRowViewAnnotations` takes them: a pointer id,
                // or the record itself, which some write paths leave in place.
                const source = entry && typeof entry === 'object' && typeof entry.source === 'string'
                    ? entry.source
                    : lookup[typeof entry === 'string' ? entry : entry?.id]?.source;
                if (typeof source === 'string' && source.startsWith(ROW_VIEW_ANNOTATION_PREFIX)) {
                    // Keyed by metafeature: the same declaration moved from one feature to
                    // another is a different form, and an unkeyed list would not say so.
                    parts.push(`${metaId}:${source}`);
                }
            }
        }
        return parts.join(';');
    });

    const slots: any[] = lObject?.features ?? [];
    const fields = useMemo(
        () => describeSlots(slots, spec, offer),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [slots, spec, resolution, offer, annotationSignature],
    );

    const visible = mode === 'advanced' ? fields : fields.filter(f => isBasicField(f, spec));

    /**
     * Rung 2 of the width ladder, keyed by feature name.
     *
     * `jjodel/renderer=…` and `jjodel/multiline=true` as `describeSlot` already parsed them
     * off the feature proxy, threaded in rather than re-read: `AttrShape` does not carry
     * annotations and is not being widened to, which is FL1's own reason for taking this as a
     * parameter. A feature with no declaration contributes an entry with neither key, which
     * the ladder reads as «rung 2 did not fire» — the same answer as an absent entry, so the
     * map needs no filtering.
     */
    const layoutAnnotations = useMemo<LayoutAnnotations>(() => {
        const out: LayoutAnnotations = {};
        for (const f of visible) out[f.name] = {
            renderer: f.annotations?.renderer,
            multiline: f.annotations?.multiline,
        };
        return out;
    }, [visible]);

    // The registry is keyed by node id, and the conformance producer registers every violated
    // object TWICE, once under its DObject id for the tree, once under its DVertex id for the
    // canvas (ConformanceProblemSync). The form asks for the DObject id, which is the half that
    // exists whether or not the object is on a canvas: the rail's subject may have no vertex.
    const problems = useNodeProblems(objectId);
    const fieldNames = useMemo(() => new Set(visible.map(f => f.name)), [visible]);
    const diagnostics = useMemo(
        () => collectFormDiagnostics(problems, fieldNames),
        [problems, fieldNames],
    );

    // Dirty fields, keyed by slot id ('name' for the intrinsic identity field).
    //
    // Reset is EVENTUALLY CONSISTENT, and deliberately so: there is no save event to listen
    // to. `SaveManager.save()` sets `U.isProjectModified = false` and nothing else, no
    // action, no custom event, no store field, so the flag going false is the only trace a
    // save leaves. The form reads it on render and empties the set when it finds it false,
    // which means the markers clear on the first re-render after a save rather than at the
    // instant of it. Subscribing to the flag is not possible (it is a plain static), and
    // adding an event to SaveManager is out of this slice's scope.
    const [dirtyFields, setDirtyFields] = useState<Set<string>>(() => new Set());
    const markDirty = useCallback((key: string) => {
        setDirtyFields(prev => (prev.has(key) ? prev : new Set(prev).add(key)));
    }, []);
    const projectModified = (U as any).isProjectModified;
    useEffect(() => {
        if (!projectModified) setDirtyFields(prev => (prev.size ? new Set() : prev));
    }, [projectModified]);
    // A new subject starts clean: the marks belong to the object being edited, not to the panel.
    useEffect(() => { setDirtyFields(new Set()); }, [objectId]);

    // The host's refusal of the last RENAME (S2). The identity field is rendered here and
    // not by IRFormField, so it needs its own copy of the same rule: `ok` decides the
    // message, `changed` decides the dirty mark. Cleared on the next accepted rename and
    // whenever the subject changes.
    const [nameRefusal, setNameRefusal] = useState<string | null>(null);
    useEffect(() => { setNameRefusal(null); }, [objectId]);

    // Scroll-to-field from a summary chip. Keyed by field name, filled during the render below.
    const fieldRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const focusFirstOf = useCallback((severity: 'error' | 'warning') => {
        for (const f of visible) {
            const ds = diagnostics.byField.get(f.name);
            if (!ds || !ds.some(d => d.severity === severity)) continue;
            const el = fieldRefs.current.get(f.name);
            if (!el) continue;
            el.scrollIntoView({ block: 'nearest' });
            // The control, not the wrapper: focus has to land where typing would fix it.
            (el.querySelector('input, select, textarea, button') as HTMLElement | null)?.focus();
            return;
        }
    }, [visible, diagnostics]);
    const sections = buildFormSections(visible, resolution?.compiled?.fieldCompartments ?? [])
        .filter(s => s.fields.length > 0);   // an empty section renders nothing

    if (!resolution || !lObject) {
        return (
            <div className="ir-form ir-form--empty">
                <div className="ir-form__placeholder">No object selected</div>
            </div>
        );
    }

    const name: string = lObject.name ?? '';
    const metaclassName: string = lObject.instanceof?.name ?? '';
    const letter = entityLetter(resolveEntityType('object') ?? 'object');
    const theme: FormTheme = spec?.theme ?? defaultTheme;

    /**
     * FL2's theme: the viewpoint's rung (STYLE2) under the two legacy fields the saved IR
     * carries (spec amendment A2).
     *
     * The skin keeps its class — every committed rule of the four skins is untouched — and
     * the preset arrives beside it as custom properties and data attributes. Note what is
     * passed and what is not: `spec?.theme`, NOT the `theme` const above. The two differ by
     * exactly the `?? defaultTheme` fallback, and that difference is the precedence. The
     * class name still needs a skin when the view names none, so `theme` keeps its `'plain'`
     * default and keeps rendering `ir-form--plain`; the PRESET must be able to see that the
     * view said nothing, or the viewpoint's rung could never win. A viewpoint theme with no
     * view theme therefore renders as the `plain` skin wearing another preset's custom
     * properties, which is the arrangement STYLE1 measured end to end (its «via contratto»
     * did the same thing by hand, and matched the real path on all three presets where both
     * exist).
     *
     * The per-class rung of the cascade still has no source in the D graph; `resolveFormTheme`
     * keeps it as the third argument so adding one is a change of this call and not of the
     * mechanism.
     */
    const preset = resolveFormTheme(spec?.theme, spec?.labelPlacement, undefined, viewpointTheme);
    const chrome = chromeOf(preset);
    const presetVars = themeVars(preset) as React.CSSProperties;

    // The identity field appears only when the metaclass has NO `name` slot. When it has
    // one, that slot's own field already edits the name: writing the slot propagates onto
    // DObject.name through the identity binding (CLAUDE.md 3.12), so rendering both would
    // put two controls on one value. Without a name slot there would otherwise be no way
    // to rename from the form at all.
    const hasNameSlot = fields.some(f => f.name === 'name');

    return (
        <div
            className={`ir-form ir-form--${theme}`}
            data-mode={mode}
            data-label-placement={preset.labelPlacement}
            data-density={preset.density}
            data-section-style={preset.sectionStyle}
            style={presetVars}
        >
            <div className="ir-form__header">
                <span className="ir-form__eyebrow">PROPERTIES</span>
                <span className="ir-form__spacer" />
                <SegmentedControl
                    options={MODE_OPTIONS}
                    value={mode}
                    onChange={onMode}
                    ariaLabel="Form detail level"
                />
            </div>

            <div className="ir-form__identity">
                <span className="ir-form__badge" aria-hidden="true">{letter}</span>
                <span className="ir-form__name" title={name}>{name}</span>
                {metaclassName && <span className="ir-form__metaclass">{metaclassName}</span>}
            </div>

            {/* Fixed 32px, occupied or not. The counts are the ones NodeProblemIndicator puts
                in the canvas badge, one unit per violation, so the rail and the node can
                never report a different number for the same object. */}
            <div className="ir-form__summary">
                {diagnostics.errorCount === 0 && diagnostics.warningCount === 0 ? (
                    <>
                        <i className="bi bi-check-circle ir-form__summary-icon" aria-hidden="true" />
                        <span className="ir-form__summary-text">No issues</span>
                    </>
                ) : (
                    <>
                        {diagnostics.errorCount > 0 && (
                            <button
                                type="button"
                                className="ir-form__chip ir-form__chip--error"
                                onClick={() => focusFirstOf('error')}
                            >
                                <i className="bi bi-x-circle-fill" aria-hidden="true" />
                                {diagnostics.errorCount} {diagnostics.errorCount === 1 ? 'error' : 'errors'}
                            </button>
                        )}
                        {diagnostics.warningCount > 0 && (
                            <button
                                type="button"
                                className="ir-form__chip ir-form__chip--warning"
                                onClick={() => focusFirstOf('warning')}
                            >
                                <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
                                {diagnostics.warningCount} {diagnostics.warningCount === 1 ? 'warning' : 'warnings'}
                            </button>
                        )}
                    </>
                )}
            </div>

            <div className="ir-form__body">
                {!hasNameSlot && (
                    <div className="ir-form__group">
                        {/* Same heading markup as the sections below, so the inspector theme
                            gives it the same 28px bar with its chevron and count instead of a
                            bare line that looks like a different kind of thing. Not collapsible:
                            folding away the only control that renames the object would hide the
                            field this group exists for.

                            Under `chrome.eyebrow` for the same reason the sections are: with
                            `sectionStyle: 'none'` there is no heading in this form, and one
                            heading surviving would be the only boundary left in a preset whose
                            whole statement is that declaration order IS the boundary. Measured
                            2026-09-01 (STYLE2): unconditional, it left `Dense` rendering ONE
                            eyebrow where the preset states zero. It had never shown, because
                            `none` is reached only by `Dense` and no write surface of the app
                            could select `Dense` until the viewpoint rung existed — STYLE1's
                            0 was measured by a probe that hid every title by hand, which hid
                            this one too. */}
                        {chrome.eyebrow && (
                            <div className="ir-form__group-title ir-form__group-title--static">
                                <i className="bi bi-chevron-down ir-form__group-chevron" aria-hidden="true" />
                                <span className="ir-form__group-label">Identity</span>
                                <span className="ir-form__group-count">1</span>
                            </div>
                        )}
                        {/* The same row/cell wrapper the sections use, so the identity field
                            gets the grid's gaps and the theme's label placement rather than
                            being the one field in the form that sits outside the layout. A
                            whole row: there is nothing to pack it against. */}
                        <div className="ir-form__row" data-free={0}>
                        <div className="ir-form__cell" style={{ ['--ir-form-span' as any]: '12' }}>
                        <div className={`ir-field${nameRefusal ? ' ir-field--error' : ''}${dirtyFields.has('name') ? ' ir-field--dirty' : ''}`}>
                            <div className="ir-field__labelrow">
                                {dirtyFields.has('name') && (
                                    <span className="ir-field__dirty-dot" title="Modified, not saved" aria-hidden="true" />
                                )}
                                <label className="ir-field__label" htmlFor="ir-field-name">name</label>
                                <span className="ir-field__spacer" />
                            </div>
                            <TextWidget
                                id="ir-field-name"
                                ariaLabel="name"
                                value={name}
                                invalid={!!nameRefusal}
                                onCommit={(next) => {
                                    const r = setObjectName(objectId, next);
                                    setNameRefusal(r.ok ? null : (r.reason ?? 'The model refused this change'));
                                    if (r.changed) markDirty('name');
                                }}
                            />
                            <div className="ir-field__message" role={nameRefusal ? 'alert' : undefined}>
                                {nameRefusal ? (
                                    <>
                                        <i className="bi bi-x-circle-fill ir-field__message-icon" aria-hidden="true" />
                                        <span className="ir-field__message-text" title={nameRefusal}>{nameRefusal}</span>
                                    </>
                                ) : dirtyFields.has('name') ? 'Modified, not saved' : null}
                            </div>
                        </div>
                        </div>
                        </div>
                    </div>
                )}

                {sections.map(s => {
                    // A section with no heading has nothing to fold BY, so it never folds:
                    // `sectionStyle: 'none'` removes the eyebrow, and a section folded away
                    // under it would have no control left to bring it back.
                    const folded = chrome.eyebrow && collapsed.has(s.key);
                    // Rule 3: the packing restarts at every section. The fields arrive here
                    // already filtered by `hidden` and by the Basic/Advanced mode, and the
                    // packer sees exactly what the user sees — a form in Basic packs its own
                    // rows rather than showing the holes of the fields Advanced would add.
                    const rows = autoLayoutRows(s.fields.map(inputFromDescriptor), layoutAnnotations);
                    const byName = new Map(s.fields.map(f => [f.name, f]));
                    return (
                    <div className={`ir-form__group${folded ? ' ir-form__group--collapsed' : ''}`} key={s.key}>
                        {/* One heading element for every theme, and the theme decides what it
                            looks like and whether it is interactive. A button in plain/card/compact
                            too, rather than two markups to keep in step: the themes differ in
                            appearance, and the collapse affordance is chrome the stylesheet shows
                            or hides. Whether there is a heading AT ALL is the preset's
                            `sectionStyle`, through FL2's `SECTION_CHROME`. */}
                        {chrome.eyebrow && (
                            <button
                                type="button"
                                className="ir-form__group-title"
                                aria-expanded={!folded}
                                onClick={() => toggleSection(s.key)}
                            >
                                <i className={`bi bi-chevron-${folded ? 'right' : 'down'} ir-form__group-chevron`} aria-hidden="true" />
                                <span className="ir-form__group-label">{s.title}</span>
                                <span className="ir-form__group-count">{s.fields.length}</span>
                            </button>
                        )}
                        {!folded && rows.map((row, ri) => (
                            <div className="ir-form__row" key={`${s.key}-row-${ri}`} data-free={row.free}>
                                {row.fields.map(lf => {
                                    const f = byName.get(lf.key);
                                    if (!f) return null;
                                    return (
                                        <FormCell layout={lf} key={f.slotId}>
                                            <div
                                                ref={el => { if (el) fieldRefs.current.set(f.name, el); else fieldRefs.current.delete(f.name); }}
                                            >
                                                <IRFormField
                                                    // Half of the address of every write the field makes
                                                    // (S3) and of every offer it asks for (S5). The other
                                                    // half is the field's own name; since S5 the descriptor
                                                    // carries no proxy at all.
                                                    objectId={objectId}
                                                    field={f}
                                                    offer={offer}
                                                    diagnostics={diagnostics.byField.get(f.name)}
                                                    dirty={dirtyFields.has(f.slotId)}
                                                    onCommitted={markDirty}
                                                    layout={lf}
                                                />
                                            </div>
                                        </FormCell>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                    );
                })}

                {sections.length === 0 && hasNameSlot === false && (
                    <div className="ir-form__placeholder">No fields to show</div>
                )}
                {sections.length === 0 && hasNameSlot && (
                    <div className="ir-form__placeholder">
                        {mode === 'basic' ? 'No fields in Basic. Switch to Advanced.' : 'No fields to show'}
                    </div>
                )}
            </div>
        </div>
    );
}

export default IRForm;
