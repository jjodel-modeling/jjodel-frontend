/**
 * SimulationPanel — control panel of the state-machine simulation, v1
 * (R-SIM-1..R-SIM-6). Floating panel, closed to a chip (progressive
 * disclosure), mounted by EditorV2 inside the editor, not portaled: a hidden
 * dock tab hides it with its editor (P-2026-09-24-1005).
 *
 * Two faces, one component:
 *
 * - M2 face (metamodel): the six simulation ROLES, plus the three optional keys
 *   of the event role (step 1, R-SIM-16), written into the `data.state`
 *   bag of the M2 model with flat `sim*` keys and pointer values (R-SIM-2).
 *   Persisted, undoable, shared in collaborative — it is authoring.
 * - M1 face (model): Reset / Step / Stop over the run-state, which lives in the
 *   `simRunState` singleton, outside Redux (R-SIM-1). The simulation NEVER
 *   writes to the model nor to any bag (R-SIM-6, prototype invariant).
 *
 * The roles are read from `lmodel.instanceof.state` on the M1 face (the pattern
 * of the prototype, forEndUser/Control.tsx:244-248) and from the model's own bag
 * on the M2 face. `connect`-ed in the shape of components/editors/MetaData.tsx,
 * so a role change re-renders from the ordinary Redux cycle.
 *
 * Every prop coming out of mapStateToProps is a primitive (a JSON signature
 * where a collection is needed): connect's shallow compare then filters the
 * re-renders instead of firing one per dispatched action.
 */

import { Dispatch, ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import { DState, LPointerTargetable, store } from '../../../joiner';
import { getSimActiveIds, simApplyStep, simClear, simReset, useSimVersion } from './simRunState';
import { ROLE_SPECS, eventRoleWarning, incompleteConfigurationMessage, missingEngineRoles, missingEventRoles } from './simRoleStatus';
import { enabledEvents, epsilonEnabled, eventAlphabet, initialConfiguration, runStatus as computeRunStatus, stepFlowchartBoolean } from '../../../model/simulation/step';
import { overlapVerdict, roleWriteVerdict, stcFromRoles } from '../../../model/simulation/stcFromRoles';
import type { RoleOverlap } from '../../../model/simulation/stcFromRoles';
import { isKindOf } from '../../../model/simulation/isKindOf';
import { objectLabel, objectReferences } from '../../../model/simulation/objectSlots';
import type { SimConfiguration, SimEventInfo, SimModelView } from '../../../model/simulation/types';
import type { RoleKey, RoleKind, Roles } from './simRoleStatus';
import './simulation-panel.scss';

// Roles: ROLE_SPECS, ENGINE_ROLE_KEYS and the role types live in simRoleStatus.ts.
const ROLE_KEYS: RoleKey[] = ROLE_SPECS.map(r => r.key);

interface MetaOption { id: string; name: string }
interface MetaOptions { classes: MetaOption[]; compositions: MetaOption[]; references: MetaOption[]; attributes: MetaOption[] }

const EMPTY_OPTIONS: MetaOptions = { classes: [], compositions: [], references: [], attributes: [] };

// ---------------------------------------------------------------------------
// D-layer readers — raw idlookup, no L proxies: mapStateToProps runs on every
// dispatched action, and the proxy getters for `classes`/`references` scan every
// DClass/DReference of the project per access (LModelElement.tsx:5618).
// ---------------------------------------------------------------------------

/**
 * Concrete classes and references of a metamodel. Mirrors the raw traversal
 * already proven in useEditorMode.ts:275-308 — classes hang off the model
 * directly AND off packages/subpackages.
 */
function collectMetaOptions(lookup: any, modelId: string): MetaOptions {
    const classes: MetaOption[] = [];
    const compositions: MetaOption[] = [];
    const references: MetaOption[] = [];
    const attributes: MetaOption[] = [];
    const seenContainers = new Set<string>();

    const visit = (containerId: string, depth: number): void => {
        if (depth > 10 || seenContainers.has(containerId)) return;
        seenContainers.add(containerId);
        const container = lookup[containerId];
        if (!container) return;

        const classIds = container.classes ?? [];
        if (Array.isArray(classIds)) {
            for (const cid of classIds) {
                if (typeof cid !== 'string') continue;
                const dClass = lookup[cid];
                if (!dClass) continue;
                const className: string = dClass.name ?? cid;
                if (!dClass.abstract) classes.push({ id: cid, name: className });
                // Attributes of every class, abstract ones included: an identifier
                // declared on a superclass is inherited by the event metaclass.
                const attrIds = dClass.attributes ?? [];
                if (Array.isArray(attrIds)) {
                    for (const aid of attrIds) {
                        if (typeof aid !== 'string') continue;
                        const dAttr = lookup[aid];
                        if (dAttr) attributes.push({ id: aid, name: `${className}.${dAttr.name ?? aid}` });
                    }
                }
                const refIds = dClass.references ?? [];
                if (!Array.isArray(refIds)) continue;
                for (const rid of refIds) {
                    if (typeof rid !== 'string') continue;
                    const dRef = lookup[rid];
                    if (!dRef) continue;
                    // Qualified label: two classes can own a reference of the same name.
                    const option: MetaOption = { id: rid, name: `${className}.${dRef.name ?? rid}` };
                    if (dRef.composition) compositions.push(option);
                    else if (!dRef.aggregation) references.push(option);
                }
            }
        }

        const subPkgs = container.subpackages ?? [];
        if (Array.isArray(subPkgs)) {
            for (const sid of subPkgs) if (typeof sid === 'string') visit(sid, depth + 1);
        }
    };

    visit(modelId, 0);
    const pkgIds = lookup[modelId]?.packages ?? [];
    if (Array.isArray(pkgIds)) {
        for (const pid of pkgIds) if (typeof pid === 'string') visit(pid, 0);
    }

    const byName = (a: MetaOption, b: MetaOption) => a.name.localeCompare(b.name);
    return {
        classes: classes.sort(byName), compositions: compositions.sort(byName), references: references.sort(byName),
        attributes: attributes.sort(byName),
    };
}

/**
 * DObject ids belonging to an M1 model — the equivalent of `allSubObjects` on
 * raw data. Nested objects hang off a DValue slot, so the owner is found by
 * walking `father` up to the DModel (the idiom of joiner/classes.ts:415).
 */
function collectModelObjectIds(lookup: any, modelId: string): string[] {
    const ids: string[] = [];
    for (const id in lookup) {
        const d = lookup[id];
        if (!d || d.className !== 'DObject') continue;
        let owner: any = d;
        let depth = 0;
        while (owner && owner.className !== 'DModel' && depth++ < 40) {
            const fatherId = typeof owner.father === 'string' ? owner.father : null;
            owner = fatherId ? lookup[fatherId] : null;
        }
        if (owner?.id === modelId) ids.push(id);
    }
    return ids;
}

/**
 * Outgoing transitions of an active instance: the values of its composition slot
 * named after the `simOwnedTransitions` role. Same navigation as the prototype
 * (`o['$' + role].values`), through the L proxy — the slot is matched by feature
 * name, which is resolved here from the role POINTER, never compared by name.
 */
function outgoingTransitions(objectId: string, ownedTransitionsName: string): any[] {
    if (!ownedTransitionsName) return [];
    try {
        const lobj: any = LPointerTargetable.fromPointer(objectId);
        const slot = lobj?.['$' + ownedTransitionsName];
        const values = slot?.values;
        return Array.isArray(values) ? values.filter(Boolean) : [];
    } catch {
        // A proxy getter can throw on a half-resolved slot. The status line calls
        // this during render: an exception here would take the editor tree down.
        return [];
    }
}

/** Target of a transition: `t['$' + nextState].value`, as the prototype does. */
function transitionTargetId(transition: any, nextStateName: string): string | null {
    if (!nextStateName) return null;
    try {
        const target = transition?.['$' + nextStateName]?.value;
        if (typeof target === 'string') return target;
        return typeof target?.id === 'string' ? target.id : null;
    } catch {
        return null;
    }
}

/**
 * The impure side of the simulation core (model/simulation/): the read interface
 * the step runs against, built over `idlookup` and the L proxy with the readers
 * above. Metaclasses match with ancestry (R-SIM-8): an instance of a subclass
 * of the initial or terminal metaclass plays that role too.
 *
 * Step 1: the trigger and the label are read on the raw D-layer by the role
 * POINTER (model/simulation/objectSlots.ts), not on the proxy by name.
 */
function makeSimModelView(
    lookup: any,
    ownedTransitionsName: string,
    nextStateName: string,
    triggerId?: string,
    eventIdentifierId?: string,
): SimModelView {
    return {
        exists: id => !!lookup[id],
        isInstanceOf: (id, classId) => isKindOf(lookup, id, classId),
        outgoingTransitions: id => outgoingTransitions(id, ownedTransitionsName)
            .map((t: any) => (typeof t === 'string' ? t : t?.id))
            .filter((t: unknown): t is string => typeof t === 'string'),
        transitionTarget: transitionId => {
            try {
                return transitionTargetId(LPointerTargetable.fromPointer(transitionId as any), nextStateName);
            } catch {
                return null;
            }
        },
        transitionTriggers: transitionId => (triggerId ? objectReferences(lookup, transitionId, triggerId) : []),
        label: id => objectLabel(lookup, id, eventIdentifierId),
    };
}

/** The reason shown when the roles overlap (R-SIM-16), on either face. */
function overlapMessage(lookup: any, overlap: RoleOverlap): string {
    const name: string = lookup[overlap.classId]?.name ?? overlap.classId;
    return `Roles overlap: ${name} matches the ${overlap.sorts.join(' and ')} roles.`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type RunStatus = 'Not started' | 'Running' | 'Terminated' | 'Deadlock';

type AllProps = OwnProps & StateProps & DispatchProps;

function SimulationPanelComponent(props: AllProps): ReactElement | null {
    const { modelid, isModelMode, configModelId, configModelName, roleSig, optionSig, ownedTransitionsName, nextStateName, eventSig } = props;
    const [open, setOpen] = useState(false);
    // Reasons shown when a role write (M2 face) or a run start (M1 face) is refused,
    // and the warning of a run started despite an overlap (no event role, R-SIM-16 parity).
    const [roleError, setRoleError] = useState<string | null>(null);
    const [roleWarning, setRoleWarning] = useState<string | null>(null);
    const [runError, setRunError] = useState<string | null>(null);
    const [runWarning, setRunWarning] = useState<string | null>(null);
    // Subscribes the panel to the run-state singleton (status line + highlight).
    const simVersion = useSimVersion();

    const roles: Roles = useMemo(() => {
        try { return JSON.parse(roleSig) as Roles; } catch { return {}; }
    }, [roleSig]);

    const options: MetaOptions = useMemo(() => {
        if (!optionSig) return EMPTY_OPTIONS;
        try { return JSON.parse(optionSig) as MetaOptions; } catch { return EMPTY_OPTIONS; }
    }, [optionSig]);

    const events: SimEventInfo[] = useMemo(() => {
        if (!eventSig) return [];
        try { return JSON.parse(eventSig) as SimEventInfo[]; } catch { return []; }
    }, [eventSig]);

    // R-SIM-5: the run-state is per model. Clearing on modelid change and on
    // unmount keeps the flags from surviving into another model of the session.
    // R-SIM-13: the cleanup captures the modelid of its own render, so it clears
    // that model's run only.
    useEffect(() => () => { simClear(modelid); }, [modelid]);

    /** Labels of the unset engine roles (simRoleStatus.ts): the run controls need none. */
    const missingRoles = missingEngineRoles(roles);
    const rolesComplete = missingRoles.length === 0;
    /** The missing half of a half-set event role: the run starts without events (R-SIM-16). */
    const eventGap = missingEventRoles(roles);
    /** The event role is declared: the rule of stcFromRoles, both keys set. */
    const eventRole = !!(roles.simEvent && roles.simTrigger);

    const writeRole = useCallback((key: RoleKey, value: string): void => {
        if (!configModelId) return;
        const lmm: any = LPointerTargetable.fromPointer(configModelId);
        if (!lmm) return;
        // R-SIM-16, the same verdict as the run start, on the roles as they will
        // stand after this save: with the event role an overlap refuses the
        // save; without it the save goes through with a warning.
        const lookup: any = (store.getState() as any).idlookup ?? {};
        const verdict = roleWriteVerdict(lookup, roles, key, value, options.classes.map(c => c.id));
        if (verdict?.refuse) {
            setRoleWarning(null);
            setRoleError(overlapMessage(lookup, verdict.overlap));
            return;
        }
        setRoleError(null);
        setRoleWarning(verdict ? overlapMessage(lookup, verdict.overlap) : null);
        // Shallow patch of the bag: the empty option writes `undefined`, which
        // set_state turns into the removal of the key (joiner/classes.ts:2222).
        // The value is a pointer (the option id), never a proxy.
        lmm.state = { [key]: value === '' ? undefined : value };
    }, [configModelId, roles, options]);

    // Status, Reset and Step delegate to the core (model/simulation/step.ts), which
    // holds the semantics and its tests; the rules are unchanged (slice 0).
    const runStatus: RunStatus | null = useMemo(() => {
        if (!isModelMode || !rolesComplete) return null;
        const stc = stcFromRoles(roles);
        if (!stc) return null;
        const lookup: any = (store.getState() as any).idlookup ?? {};
        const config: SimConfiguration = { marking: new Set(getSimActiveIds(modelid)), event: null };
        return computeRunStatus(config, stc, makeSimModelView(lookup, ownedTransitionsName, nextStateName));
        // simVersion is the subscription to the active set — the real input of
        // this memo, and the reason the D-layer read above can go through
        // store.getState() (same idiom as irResolve.ts:78).
    }, [isModelMode, rolesComplete, roles, modelid, ownedTransitionsName, nextStateName, simVersion]);

    // Which inputs can fire (R-SIM-16), from the core: the Step button is ε, and
    // without the event role it keeps the slice 0 rule (disabled on Terminated).
    // Same inputs as the status line, plus eventSig: a change to the event
    // instances re-evaluates the buttons.
    const enablement = useMemo(() => {
        if (!isModelMode || !rolesComplete) return null;
        const stc = stcFromRoles(roles);
        if (!stc) return null;
        const lookup: any = (store.getState() as any).idlookup ?? {};
        const config: SimConfiguration = { marking: new Set(getSimActiveIds(modelid)), event: null };
        const view = makeSimModelView(lookup, ownedTransitionsName, nextStateName, roles.simTrigger, roles.simEventIdentifier);
        return { epsilon: epsilonEnabled(config, stc, view), events: enabledEvents(config, stc, view) };
    }, [isModelMode, rolesComplete, roles, modelid, ownedTransitionsName, nextStateName, simVersion, eventSig]);

    const onReset = useCallback((): void => {
        const stc = stcFromRoles(roles);
        if (!stc) return;
        const lookup: any = (store.getState() as any).idlookup ?? {};
        // R-SIM-16: the roles are checked again at run start, since the
        // metamodel can have changed after they were saved. With the event role
        // an overlap refuses the run, and a run already under way is stopped;
        // without it the run starts as in slice 0 and the overlap is a warning.
        const verdict = configModelId
            ? overlapVerdict(lookup, roles, collectMetaOptions(lookup, configModelId).classes.map(c => c.id))
            : null;
        if (verdict?.refuse) {
            simClear(modelid);
            setRunWarning(null);
            setRunError(`Run not started. ${overlapMessage(lookup, verdict.overlap)}`);
            return;
        }
        setRunError(null);
        setRunWarning(verdict ? overlapMessage(lookup, verdict.overlap) : null);
        const view = makeSimModelView(lookup, ownedTransitionsName, nextStateName);
        const config = initialConfiguration(stc, view, collectModelObjectIds(lookup, modelid));
        simReset(modelid, [...config.marking]);
    }, [modelid, roles, ownedTransitionsName, nextStateName, configModelId]);

    const onStop = useCallback((): void => {
        setRunError(null);
        setRunWarning(null);
        simClear(modelid);
    }, [modelid]);

    /**
     * One step, one `simApplyStep`: the core computes the label, the store
     * applies it. `event` is an event instance id, or `null` for the ε step.
     */
    const fire = useCallback((event: string | null): void => {
        const stc = stcFromRoles(roles);
        if (!stc) return;
        const lookup: any = (store.getState() as any).idlookup ?? {};
        const config: SimConfiguration = { marking: new Set(getSimActiveIds(modelid)), event };
        const view = makeSimModelView(lookup, ownedTransitionsName, nextStateName, roles.simTrigger, roles.simEventIdentifier);
        const { label } = stepFlowchartBoolean(config, stc, view);
        simApplyStep(modelid, label.deactivated, label.activated);
    }, [modelid, roles, ownedTransitionsName, nextStateName]);

    const onStep = useCallback((): void => { fire(null); }, [fire]);

    const optionsFor = (kind: RoleKind): MetaOption[] => {
        if (kind === 'class') return options.classes;
        if (kind === 'composition') return options.compositions;
        if (kind === 'attribute') return options.attributes;
        return options.references;
    };

    if (!open) {
        return (
            <div className="sim-panel sim-panel--closed">
                <button
                    type="button"
                    className="sim-panel__chip"
                    title="Simulation"
                    onClick={() => setOpen(true)}
                >
                    <i className="bi bi-play-circle" />
                    <span>Simulation</span>
                    {isModelMode && runStatus && runStatus !== 'Not started' && (
                        <span className={`sim-panel__dot sim-panel__dot--${runStatus.toLowerCase().replace(' ', '-')}`} />
                    )}
                </button>
            </div>
        );
    }

    return (
        <div className="sim-panel sim-panel--open">
            <div className="sim-panel__header">
                <i className="bi bi-play-circle" />
                <span className="sim-panel__title">Simulation</span>
                <button
                    type="button"
                    className="sim-panel__collapse"
                    title="Collapse"
                    onClick={() => setOpen(false)}
                >
                    <i className="bi bi-chevron-down" />
                </button>
            </div>

            <div className="sim-panel__body">
                {!isModelMode ? (
                    <>
                        <div className="sim-panel__section">Simulation roles</div>
                        {!configModelId ? (
                            <div className="sim-panel__hint">No metamodel to configure.</div>
                        ) : ROLE_SPECS.map(spec => (
                            <label className="sim-panel__row" key={spec.key}>
                                <span className="sim-panel__label">{spec.label}</span>
                                <select
                                    className="sim-panel__select"
                                    value={roles[spec.key] ?? ''}
                                    onChange={e => writeRole(spec.key, e.target.value)}
                                >
                                    <option value="">{spec.placeholder}</option>
                                    {optionsFor(spec.kind).map(o => (
                                        <option value={o.id} key={o.id}>{o.name}</option>
                                    ))}
                                </select>
                            </label>
                        ))}
                        {eventGap.length > 0 && (
                            <div className="sim-panel__hint sim-panel__hint--warning">{eventRoleWarning(eventGap, null)}</div>
                        )}
                        {roleError && <div className="sim-panel__hint sim-panel__hint--error">{roleError}</div>}
                        {roleWarning && <div className="sim-panel__hint sim-panel__hint--warning">{roleWarning}</div>}
                    </>
                ) : !rolesComplete ? (
                    <div className="sim-panel__hint">
                        {configModelId ? incompleteConfigurationMessage(configModelName, missingRoles) : 'No metamodel to configure.'}
                    </div>
                ) : (
                    <>
                        <div className="sim-panel__actions">
                            <button type="button" className="sim-panel__btn" title="Reset" onClick={onReset}>
                                <i className="bi bi-skip-backward-fill" />
                            </button>
                            <button
                                type="button"
                                className="sim-panel__btn"
                                title={eventRole ? 'Step (\u03b5)' : 'Step'}
                                onClick={onStep}
                                disabled={!enablement?.epsilon}
                            >
                                <i className="bi bi-play-fill" />
                            </button>
                            <button type="button" className="sim-panel__btn" title="Stop" onClick={onStop}>
                                <i className="bi bi-stop-fill" />
                            </button>
                        </div>
                        {eventGap.length > 0 && (
                            <div className="sim-panel__hint sim-panel__hint--warning">{eventRoleWarning(eventGap, configModelName)}</div>
                        )}
                        {eventRole && (
                            <>
                                <div className="sim-panel__section">Events</div>
                                {events.length === 0 ? (
                                    <div className="sim-panel__hint">No event instances in the model.</div>
                                ) : (
                                    <div className="sim-panel__events">
                                        {events.map(e => (
                                            <button
                                                type="button"
                                                className="sim-panel__event"
                                                key={e.id}
                                                title={`Fire ${e.label}`}
                                                onClick={() => fire(e.id)}
                                                disabled={!enablement?.events.has(e.id)}
                                            >
                                                <i className="bi bi-chevron-right" />
                                                <span>{e.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                        {runError && <div className="sim-panel__hint sim-panel__hint--error">{runError}</div>}
                        {runWarning && <div className="sim-panel__hint sim-panel__hint--warning">{runWarning}</div>}
                        <div className="sim-panel__status">
                            <span className={`sim-panel__dot sim-panel__dot--${(runStatus ?? 'not started').toLowerCase().replace(' ', '-')}`} />
                            <span className="sim-panel__status-text">{runStatus}</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// connect
// ---------------------------------------------------------------------------

export interface OwnProps {
    modelid: string;
    isModelMode: boolean;
}

interface StateProps {
    /** Model whose bag holds the roles: the M2 itself, or the M1's metamodel. */
    configModelId: string | null;
    /** Name of that model, for the messages that say where a role is missing; '' when unknown. */
    configModelName: string;
    /** JSON of the role pointers (six, plus the event role's three) — a primitive, so shallow compare works. */
    roleSig: string;
    /** JSON of the option lists; empty on the M1 face, which does not need them. */
    optionSig: string;
    /** Feature names of the two navigated roles, resolved from their pointers. */
    ownedTransitionsName: string;
    nextStateName: string;
    /**
     * JSON of the event instances of the M1 model with their labels (step 1),
     * sorted; empty on the M2 face and without the event role.
     */
    eventSig: string;
}

interface DispatchProps { }

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const lookup: any = (state as any).idlookup ?? {};
    const dModel: any = lookup[ownProps.modelid];
    const configModelId: string | null = ownProps.isModelMode
        ? (typeof dModel?.instanceof === 'string' ? dModel.instanceof : null)
        : (dModel ? ownProps.modelid : null);

    const bag: any = (configModelId ? lookup[configModelId]?._state : null) ?? {};
    const roles: Roles = {};
    for (const key of ROLE_KEYS) {
        const value = bag[key];
        if (typeof value === 'string' && value) roles[key] = value;
    }

    return {
        configModelId,
        configModelName: (configModelId && lookup[configModelId]?.name) || '',
        roleSig: JSON.stringify(roles),
        optionSig: !ownProps.isModelMode && configModelId
            ? JSON.stringify(collectMetaOptions(lookup, configModelId))
            : '',
        ownedTransitionsName: (roles.simOwnedTransitions && lookup[roles.simOwnedTransitions]?.name) || '',
        nextStateName: (roles.simNextState && lookup[roles.simNextState]?.name) || '',
        eventSig: ownProps.isModelMode ? eventSigOf(lookup, ownProps.modelid, roles) : '',
    };
}

/**
 * The event list of an M1 model as a JSON signature, so connect's shallow
 * compare holds. One `collectModelObjectIds` scan per dispatched action, only
 * when the event role is declared.
 */
function eventSigOf(lookup: any, modelId: string, roles: Roles): string {
    if (!roles.simEvent || !roles.simTrigger) return '';
    const stc = stcFromRoles(roles);
    if (!stc) return '';
    // eventAlphabet reads only isInstanceOf and label from the view.
    const view = makeSimModelView(lookup, '', '', roles.simTrigger, roles.simEventIdentifier);
    return JSON.stringify(eventAlphabet(stc, view, collectModelObjectIds(lookup, modelId)));
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

export const SimulationPanel = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps,
)(SimulationPanelComponent);

export default SimulationPanel;
