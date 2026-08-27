/**
 * IRForm — renders a model object as a form of editable widgets.
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
 * Reactivity comes entirely from `useIRFormView`, whose signature covers the object's
 * name, its metaclass and every slot's values. This component holds no model state — only
 * the Basic/Advanced mode, which is a property of the viewer, not of the model.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LPointerTargetable, U } from '../../../../joiner';
import { entityLetter, resolveEntityType } from '../../../../common/entityMeta';
import { getInterfaceMode } from '../../../../hooks/useInterfaceMode';
import { SegmentedControl } from '../../../ui';
import { useIRFormView } from './useIRFormView';
import { describeSlots, isBasicField, type FormFieldDescriptor } from './useFormWidgets';
import { setObjectName } from './formWrite';
import { useNodeProblems } from '../../problems/useNodeProblems';
import { collectFormDiagnostics } from './formDiagnostics';
import type { CompiledFieldCompartment, FormSpec, FormTheme } from './irTypes';
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

function readMode(viewKey: string): FormMode {
    try {
        const raw = localStorage.getItem(PREF_PREFIX + viewKey);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.mode === 'basic' || parsed?.mode === 'advanced') return parsed.mode;
        }
    } catch {
        // A corrupt or unreadable entry is not worth a broken panel.
    }
    // No preference for THIS view yet: inherit the user's global interface mode rather
    // than hardcoding 'basic', so a form opened for the first time agrees with the rest
    // of the app instead of contradicting it.
    return getInterfaceMode();
}

function writeMode(viewKey: string, mode: FormMode): void {
    try {
        localStorage.setItem(PREF_PREFIX + viewKey, JSON.stringify({ mode }));
    } catch {
        // Private mode, quota, disabled storage: the preference is a convenience.
    }
}

const MODE_OPTIONS: { value: FormMode; label: string }[] = [
    { value: 'basic', label: 'Basic' },
    { value: 'advanced', label: 'Advanced' },
];

/** Section heading: the authored title, else the compartment id made presentable. */
function sectionTitle(c: Pick<CompiledFieldCompartment, 'id' | 'title'>): string {
    if (c.title) return c.title;
    const id = c.id ?? '';
    return id ? id.charAt(0).toUpperCase() + id.slice(1) : 'Fields';
}

interface Section {
    key: string;
    title: string;
    fields: FormFieldDescriptor[];
}

/**
 * Partition the fields into sections.
 *
 * With compartments, one section per compartment in the authored order, each taking the
 * fields its `source` selects. Without them, the three natural groups. A `children`
 * compartment takes the composition features: those ARE the object's containment
 * children as seen from its own slots. It is NOT the same set the canvas row-dispatch
 * renders (`rowRenderedChildren` resolves child OBJECTS and gives each its own row view);
 * the form reads the owning slots instead, because that is where the multiplicity and the
 * required marker live. The two converge on the same children, from opposite ends.
 */
function buildSections(fields: FormFieldDescriptor[], compartments: CompiledFieldCompartment[]): Section[] {
    const attributes = fields.filter(f => !f.isReference && !f.isComposition);
    const references = fields.filter(f => f.isReference);
    const children = fields.filter(f => f.isComposition);

    if (compartments.length === 0) {
        return [
            { key: 'attributes', title: 'Attributes', fields: attributes },
            { key: 'references', title: 'References', fields: references },
            { key: 'children', title: 'Children', fields: children },
        ];
    }

    return compartments.map((c, i) => ({
        key: `${c.id}-${i}`,
        title: sectionTitle(c),
        fields: c.source === 'references' ? references : c.source === 'children' ? children : attributes,
    }));
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

    const [mode, setMode] = useState<FormMode>(() => readMode(viewKey));
    const onMode = useCallback((m: FormMode) => {
        setMode(m);
        writeMode(viewKey, m);
    }, [viewKey]);

    const slots: any[] = lObject?.features ?? [];
    const fields = useMemo(
        () => describeSlots(slots, spec),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [slots, spec, resolution],
    );

    const visible = mode === 'advanced' ? fields : fields.filter(f => isBasicField(f, spec));

    // The registry is keyed by node id, and the conformance producer registers every violated
    // object TWICE — once under its DObject id for the tree, once under its DVertex id for the
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
    // to. `SaveManager.save()` sets `U.isProjectModified = false` and nothing else — no
    // action, no custom event, no store field — so the flag going false is the only trace a
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
    const sections = buildSections(visible, resolution?.compiled?.fieldCompartments ?? [])
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

    // The identity field appears only when the metaclass has NO `name` slot. When it has
    // one, that slot's own field already edits the name: writing the slot propagates onto
    // DObject.name through the identity binding (CLAUDE.md 3.12), so rendering both would
    // put two controls on one value. Without a name slot there would otherwise be no way
    // to rename from the form at all.
    const hasNameSlot = fields.some(f => f.name === 'name');

    return (
        <div className={`ir-form ir-form--${theme}`} data-mode={mode}>
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
                in the canvas badge — one unit per violation — so the rail and the node can
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
                        <div className="ir-form__group-title">Identity</div>
                        <div className={`ir-field${dirtyFields.has('name') ? ' ir-field--dirty' : ''}`}>
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
                                onCommit={(next) => { if (setObjectName(objectId, next)) markDirty('name'); }}
                            />
                            <div className="ir-field__message">
                                {dirtyFields.has('name') ? 'Modified, not saved' : null}
                            </div>
                        </div>
                    </div>
                )}

                {sections.map(s => (
                    <div className="ir-form__group" key={s.key}>
                        <div className="ir-form__group-title">{s.title}</div>
                        {s.fields.map(f => (
                            <div
                                key={f.slotId}
                                ref={el => { if (el) fieldRefs.current.set(f.name, el); else fieldRefs.current.delete(f.name); }}
                            >
                                <IRFormField
                                    field={f}
                                    diagnostics={diagnostics.byField.get(f.name)}
                                    dirty={dirtyFields.has(f.slotId)}
                                    onCommitted={markDirty}
                                />
                            </div>
                        ))}
                    </div>
                ))}

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
