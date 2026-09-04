import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
    DATA_MANAGER_VIEWPOINT_ID,
    DViewElement,
    LPointerTargetable,
    LProject,
    LViewPoint,
    ensureDataManagerViewpoint,
    DATA_MANAGER_VIEWPOINT_NAME,
    store,
} from '../../../../joiner';
import { EmptyState, HelpText, Select } from '../../../ui';
import { getMetaclassInfo, type MetaclassInfo } from '../../../editor-v2/hooks/useEditorMode';
import { pinAccepts } from '../../../editor-v2/viewpoint/ir/irResolveCore';
import {
    deriveAuthoringWidget,
    offeredOverrides,
    rowsForMetaclass,
    widgetLabel,
    withFormEntry,
    type AuthoringFeatureRow,
} from '../../../editor-v2/viewpoint/authoring/FormAuthoringBody';
import { overrideIsCompatible } from '../../../editor-v2/viewpoint/ir/useFormWidgets';
import type { FormSpec, VertexViewIR, WidgetKind } from '../../../editor-v2/viewpoint/ir/irTypes';
import { FORM_THEME_DEFAULT_NAME, FORM_THEME_NAMES, type FormThemeName } from '../../../../jjform';
// Same self-import as ViewpointProperties, and for the same reason: `.wp-field` and
// `.workbench-properties` must render when Info.tsx mounts this outside WorkbenchProperties.
import './properties.scss';
import './DataManagerViewpointPanel.scss';

/**
 * DataManagerViewpointPanel — the rail of the Data Manager Viewpoint singleton (R-DMV-4).
 *
 * A COMPONENT OF ITS OWN, and not a branch inside `ViewpointProperties`, for two reasons
 * that are both load-bearing:
 *
 *  1. The segmented «Type» must be UNREACHABLE here, not merely disabled. That control
 *     writes `isExclusiveView = (newType === 'syntax')`, and a singleton with
 *     `isExclusiveView: false` has its per-class views applied as DECORATIVE on the classic
 *     canvas of every project (`selectors.ts`, referto §2.3). Absence by construction is
 *     cheaper to keep true than a condition somebody can later invert.
 *  2. `viewpointThemeHint.test.ts` asserts that `ViewpointProperties.tsx` contains none of
 *     `LProject.getProject`, `viewpoints`, `_lastSelected`. That test is right — it forbids
 *     a second derivation of «which viewpoint is active» — and this panel needs
 *     `LProject.getProject` to list the project's metaclasses. Two files, no conflict.
 *
 * What it does NOT show, decided in the GO (Q5): no per-view `theme` / `labelPlacement`.
 * The viewpoint's own «Form theme» is one rung of the cascade; offering the view's rung
 * beside it would put two controls for the same visible effect at two different levels,
 * on a surface whose whole point is that there is only one configuration per project.
 *
 * The «Applies when this viewpoint is active» hint of `ViewpointProperties` is absent too,
 * and not by omission: the singleton is never `state.viewpoint` (R-DMV-1), so that hint
 * would be permanently visible and permanently false.
 *
 * `viewpoint` IS NULLABLE, and that is the stub of R-DMV-6. The sidebar entry exists in
 * every project, including the ones where nobody has configured anything, and selecting it
 * points `_lastSelected.view` at `Pointer_ViewPointDataManager` whether or not that object
 * exists. The panel renders identically either way — what it shows with no singleton is
 * the state every project is in today — and the FIRST WRITE, whichever control it comes
 * from, is what brings the viewpoint into being. Materializing on mount instead would put
 * the object in every project that ever opened this rail, which is the thing R-DMV-6 exists
 * to prevent.
 */

interface DataManagerViewpointPanelProps {
    /** Null when the singleton has not been written to yet: the stub of R-DMV-6. */
    viewpoint: LViewPoint | null;
    readOnly: boolean;
}

/** The «no opinion» entry of the Form Theme select — the same sentinel, and the same
 *  contract, as `ViewpointProperties`: mapped back to `undefined` on write so no fifth
 *  literal ever reaches the field. */
const FORM_THEME_INHERIT = '__inherit__';

/**
 * Id of the per-class view this panel owns, one per metaclass.
 *
 * Deterministic like `Pointer_ViewPointDataManager` itself, and for the same reason: the
 * panel must find again what it wrote, with no scan and no ambiguity. It is a fallback,
 * not the lookup — `findClassView` below looks for ANY admissible view of the class first,
 * so a view authored by hand or by an AI is edited rather than shadowed by a second one.
 */
const CLASS_VIEW_ID_PREFIX = 'Pointer_ViewDataManager_';

/**
 * The metaclasses of the project, grouped by metamodel.
 *
 * ALL metamodels and not one: R-DMV-6 says one theme and one set of overrides per project,
 * «anche con più metamodelli». `getMetaclassInfo` takes an M1 model id and resolves its
 * metamodel from it; passing the metamodel id as the second argument skips that resolution
 * entirely, which is why the first argument is empty here and not a lie about a model.
 */
function collectProjectMetaclasses(): Array<{ id: string; name: string; classes: MetaclassInfo[] }> {
    const out: Array<{ id: string; name: string; classes: MetaclassInfo[] }> = [];
    let project: any = null;
    try { project = LProject.getProject(); } catch { return out; }
    for (const mm of (project?.metamodels ?? [])) {
        if (!mm?.id) continue;
        let classes: MetaclassInfo[] = [];
        try { classes = getMetaclassInfo('', mm.id).allClasses ?? []; } catch { classes = []; }
        if (classes.length === 0) continue;
        out.push({ id: mm.id, name: mm.name || 'Unnamed', classes });
    }
    return out;
}

/**
 * The singleton's view that speaks for this metaclass, or null.
 *
 * The admissibility rule is the one `resolveTableSpec` applies at read time, not a second
 * opinion about it: a node view of the singleton, without a `predicate` (a predicate
 * selects per instance, and this panel configures per metaclass), whose `metaclasses`
 * names the class and whose pin — read through the shared `pinAccepts` — accepts its id.
 * Editing a view the reader would skip is the failure this alignment exists to prevent.
 */
function findClassView(state: any, target: MetaclassInfo): DViewElement | null {
    const lookup = state?.idlookup;
    const list: string[] = state?.viewelements ?? [];
    for (const vid of list) {
        const d = lookup?.[vid];
        if (!d || d.viewpoint !== DATA_MANAGER_VIEWPOINT_ID) continue;
        const ir = (d as any).ir;
        if (!ir || typeof ir !== 'object') continue;
        if (ir.kind !== 'vertex' && ir.kind !== 'graphVertex') continue;
        if (ir.predicate !== undefined) continue;
        if (!Array.isArray(ir.metaclasses) || !ir.metaclasses.includes(target.name)) continue;
        if (!pinAccepts({ pins: ir.authoringMetaclassPins }, target.name, target.id)) continue;
        return d as DViewElement;
    }
    return null;
}

/**
 * The per-class view, created empty.
 *
 * IT CARRIES A `shape`, and R-DMV-3 says «view di classe senza `shape`». The decision holds
 * as intent — this view is not a diagram symbol and nothing ever draws it, because the
 * singleton is never the active viewpoint — but the literal absence does not survive the
 * compiler: measured 2026-09-04, a `vertex` ir without `shape` makes `compileView` throw at
 * `irCompile.ts:305` (`Cannot read properties of undefined (reading 'form')`), `getIRIndex`
 * drops the view with `[ir] compile failed`, and the whole index comes back `null`. A
 * minimal `{ form: 'rect' }` is the smallest thing that keeps the view in the index.
 *
 * `exclusive: true` for a narrower reason of the same kind: `getIRIndex` skips an ir with
 * `exclusive === false` outright.
 */
function createClassView(dVp: DViewElement, target: MetaclassInfo): DViewElement | null {
    const ir: VertexViewIR = {
        irVersion: 'ir-1.2',
        kind: 'vertex',
        metaclasses: [target.name],
        authoringMetaclassPins: { [target.name]: target.id },
        priority: 0,
        exclusive: true,
        shape: { form: 'rect' },
    };
    try {
        return DViewElement.new2(target.name, '', dVp, (d) => {
            d.appliableTo = 'Vertex' as any;
            d.appliableToClasses = ['DObject'];
            // Inside the callback, which `Constructors.end()` runs BEFORE persist: the view
            // is persisted with its ir already on it, in one action. Same pattern as
            // `createViewInWorkbench`.
            (d as any).ir = ir;
        }, true, `${CLASS_VIEW_ID_PREFIX}${target.id}`);
    } catch (e) {
        console.warn('[dataManager] could not create the per-class view for', target.name, e);
        return null;
    }
}

const DataManagerViewpointPanel: React.FC<DataManagerViewpointPanelProps> = ({ viewpoint, readOnly }) => {
    // One subscription to `idlookup`, whose reference changes on any write, and memos keyed
    // on it — the shape `InstanceManagerTab` already uses and declares honest. The panel is
    // mounted only while the singleton is selected in the tree, so the cost is paid on one
    // rail and not on the canvas. `viewelements` is a second, cheap subscription because a
    // view CREATED by this panel changes that list and not the identity of `idlookup`'s
    // entries the memo below reads.
    const idlookup = useSelector((state: any) => state.idlookup);
    const viewelements = useSelector((state: any) => state.viewelements);

    const groups = useMemo(() => collectProjectMetaclasses(), [idlookup]);
    const allClasses = useMemo(() => groups.flatMap(g => g.classes), [groups]);

    // The selection falls back to the first class instead of being pinned by an effect: an
    // effect would fight the render on the first paint, and a metamodel that loses the
    // selected class must degrade to «the first one» rather than to an empty table.
    const [pickedClassId, setPickedClassId] = useState<string>('');
    const target: MetaclassInfo | null =
        allClasses.find(c => c.id === pickedClassId) ?? allClasses[0] ?? null;

    const classView = useMemo(
        () => (target ? findClassView({ idlookup, viewelements }, target) : null),
        [idlookup, viewelements, target],
    );
    const form = ((classView as any)?.ir?.form) as FormSpec | undefined;
    const rows: AuthoringFeatureRow[] = useMemo(() => rowsForMetaclass(target), [target]);

    /**
     * Rung 1 of the materialization: every write on the VIEWPOINT goes through here, so
     * that a panel rendered on the stub creates the singleton the moment somebody types a
     * name or picks a theme, and not before.
     *
     * A BARE call, with no TRANSACTION around it (CLAUDE.md §3.3): `newVP` opens its own,
     * and a creator nested in an outer one loses its writes. The L-proxy is taken from the
     * D that `ensure` returns rather than from the `viewpoint` prop, which is null on the
     * stub and stale for one render right after the creation.
     */
    const writeViewpoint = useCallback((mutate: (lvp: any) => void) => {
        if (readOnly) return;
        const dVp = ensureDataManagerViewpoint();
        if (!dVp) {
            console.warn('[dataManager] no project in scope: the singleton cannot be created');
            return;
        }
        try { mutate(LPointerTargetable.fromD(dVp)); }
        catch (e) { console.warn('[dataManager] write on the singleton failed', e); }
    }, [readOnly]);

    // The name the singleton WILL be born with, shown on the stub: the field is not empty
    // and not disabled, because typing in it is a legitimate first write.
    const currentName = viewpoint ? (viewpoint.name || '') : DATA_MANAGER_VIEWPOINT_NAME;
    const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        writeViewpoint(lvp => { lvp.name = v; });
    }, [writeViewpoint]);

    const currentFormTheme = ((viewpoint as any)?.formTheme as FormThemeName | undefined) ?? null;
    const handleFormThemeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const v = e.target.value;
        writeViewpoint(lvp => {
            lvp.formTheme = v === FORM_THEME_INHERIT ? undefined : (v as FormThemeName);
        });
    }, [writeViewpoint]);

    /**
     * The write, and with it the materialization of R-DMV-6, in ONE place.
     *
     * Two rungs, two BARE calls: `ensureDataManagerViewpoint` and `DViewElement.new2` each
     * open their own TRANSACTION, and wrapping creators in an outer one drops their writes
     * (CLAUDE.md §3.3). There is no TRANSACTION here and none around a call to this.
     *
     * Rung 1 is not dead code even though this panel is only mounted with the singleton
     * already selected: the sidebar entry of R-DMV-5 selects the singleton OR its stub, and
     * when it is the stub the first write is what brings the viewpoint into existence.
     *
     * The state is re-read from the store instead of using the `idlookup` of the render:
     * rung 1 may have just created the viewpoint, and the closure's lookup predates it.
     */
    const writeForm = useCallback((next: FormSpec | undefined) => {
        if (readOnly || !target) return;
        const dVp = ensureDataManagerViewpoint();
        if (!dVp) {
            console.warn('[dataManager] no project in scope: the singleton cannot be created');
            return;
        }
        const state: any = store.getState();
        const dView = findClassView(state, target) ?? createClassView(dVp, target);
        if (!dView) return;
        const current = (((dView as any).ir ?? {}) as VertexViewIR);
        const nextIr: any = { ...current };
        // The key is REMOVED and not written undefined: a view whose form was set and reset
        // must round-trip identical to one where it was never set (R-B9, the saved ir has no
        // VersionFixer). Dropping the emptied view itself is slice F, not this.
        if (next === undefined) delete nextIr.form; else nextIr.form = next;
        try {
            (LPointerTargetable.fromD(dView) as any).ir = nextIr;
        } catch (e) {
            console.warn('[dataManager] could not write the form of', target.name, e);
        }
    }, [readOnly, target]);

    const setWidget = useCallback((row: AuthoringFeatureRow, value: WidgetKind | undefined) => {
        writeForm(withFormEntry(form, 'widgets', row.name, value));
    }, [writeForm, form]);

    const classOptions = useMemo(
        () => (groups.length === 1
            ? groups[0].classes.map(c => ({ value: c.id, label: c.name }))
            : groups.map(g => ({ label: g.name, options: g.classes.map(c => ({ value: c.id, label: c.name })) }))),
        [groups],
    );

    const renderRow = (row: AuthoringFeatureRow) => {
        const derived = deriveAuthoringWidget(row);
        const offered = offeredOverrides(derived);
        const declared = form?.widgets?.[row.name];
        // An override the interpreter would drop leaves the select on its placeholder rather
        // than showing a value nothing honours — the same rule as the authoring table.
        const active = declared !== undefined && overrideIsCompatible(derived, declared) && declared !== derived
            ? declared
            : '';
        return (
            <div className="dmv-panel__row" key={row.name}>
                <span className="dmv-panel__name">
                    {row.name}
                    {active !== '' && <span className="dmv-panel__dot" aria-hidden="true" />}
                </span>
                <Select
                    size="sm"
                    options={offered.map(k => ({ value: k, label: widgetLabel(k) }))}
                    placeholder={`Default (${widgetLabel(derived)})`}
                    value={active}
                    disabled={readOnly || offered.length === 0}
                    title={offered.length === 0
                        ? `No alternative widget applies to ${row.typeName || 'this type'}`
                        : undefined}
                    onChange={(e) => setWidget(row, (e.target.value || undefined) as WidgetKind | undefined)}
                />
            </div>
        );
    };

    return (
        <div className="workbench-properties">
            <h4 className="workbench-properties__section-header">Data Manager</h4>

            <div className="wp-field">
                <label className="wp-field__label">Name</label>
                <input
                    className="wp-field__input"
                    value={currentName}
                    onChange={handleNameChange}
                    disabled={readOnly}
                />
            </div>

            <div className="wp-field">
                <label className="wp-field__label">Form theme</label>
                <select
                    className="wp-field__select"
                    value={currentFormTheme ?? FORM_THEME_INHERIT}
                    onChange={handleFormThemeChange}
                    disabled={readOnly}
                    title="Preset applied to the Data Manager drawer: label placement, density and section chrome. A view that declares its own theme overrides it."
                >
                    <option value={FORM_THEME_INHERIT}>Default ({FORM_THEME_DEFAULT_NAME})</option>
                    {FORM_THEME_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
            </div>

            <h4 className="workbench-properties__section-header">Fields</h4>

            {allClasses.length === 0 ? (
                <EmptyState
                    icon="bi-diagram-3"
                    title="No metaclasses"
                    description="This project has no metamodel to configure the Data Manager for."
                />
            ) : (
                <>
                    <div className="wp-field">
                        <label className="wp-field__label">Metaclass</label>
                        <Select
                            size="sm"
                            options={classOptions as any}
                            placeholder=""
                            value={target?.id ?? ''}
                            disabled={readOnly}
                            onChange={(e) => setPickedClassId(e.target.value)}
                        />
                    </div>

                    {rows.length === 0 ? (
                        <HelpText>This metaclass declares no feature.</HelpText>
                    ) : (
                        <div className="dmv-panel__table">
                            <div className="dmv-panel__head">
                                <span>Feature</span>
                                <span>Widget</span>
                            </div>
                            {rows.map(renderRow)}
                        </div>
                    )}
                    <HelpText>
                        A field with no override follows the widget its type derives. The
                        choice applies to the Data Manager only, in every project view.
                    </HelpText>
                </>
            )}
        </div>
    );
};

export default DataManagerViewpointPanel;
