/**
 * SimulationPanel — control panel of the state-machine simulation, v1
 * (R-SIM-1..R-SIM-6). Floating panel, closed to a chip (progressive
 * disclosure), mounted by EditorV2 inside the editor, not portaled: a hidden
 * dock tab hides it with its editor (P-2026-09-24-1005).
 *
 * Two faces, one component:
 *
 * - M2 face (metamodel): the simulation ROLES in four groups (step 3b, R-SIM-37),
 *   written into the `data.state` bag of the M2 model with flat `sim*` keys and
 *   pointer values (R-SIM-2), the bound as a digit string. Persisted, undoable,
 *   shared in collaborative — it is authoring.
 * - M1 face (model): Reset / Step / Stop and the event buttons over a run of the
 *   Petri core (model/simulation/net*.ts), built and stepped by the bridge
 *   (simBridge.ts) and kept in the `simRunState` singleton, outside Redux
 *   (R-SIM-1). The simulation NEVER writes to the model nor to any bag (R-SIM-6,
 *   prototype invariant).
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
import { connect, useSelector } from 'react-redux';
import { DState, DUser, LPointerTargetable, store } from '../../../joiner';
import { buildEvalContext } from '../../../jjscript';
import { getSimRun, simClear, simReset } from './simRunState';
import {
    ROLE_SPECS, incompleteConfigurationMessage, invalidEngineRoles, missingEngineRoles,
} from './simRoleStatus';
import {
    candidateLabel, collectModelObjectIds, defectsLine, haltMessage, makeNetModelView, panelInputs, pressInput, runSignature, startRun,
} from './simBridge';
import { eventAlphabet, netStcFromRoles, withDerivedEventRole } from '../../../model/simulation/netCompile';
import { netRunStatus, structuralInputs } from '../../../model/simulation/netStep';
import { overlapVerdict } from '../../../model/simulation/stcFromRoles';
import type { RoleOverlap } from '../../../model/simulation/stcFromRoles';
import type { Candidate, NetRunStatus } from '../../../model/simulation/netTypes';
import type { SimEventInfo } from '../../../model/simulation/types';
import type { RoleKey, RoleKind, RoleSpec, Roles } from './simRoleStatus';
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

/** The reason shown when the roles overlap (R-SIM-16), on either face. */
function overlapMessage(lookup: any, overlap: RoleOverlap): string {
    const name: string = lookup[overlap.classId]?.name ?? overlap.classId;
    return `Roles overlap: ${name} matches the ${overlap.sorts.join(' and ')} roles.`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** The groups of the M2 face (R-SIM-37), in ROLE_SPECS order within each. */
const ROLE_GROUPS: ReadonlyArray<{ id: string; title: string; keys: readonly RoleKey[] }> = [
    { id: 'general', title: 'General', keys: ['simNode', 'simInitial', 'simInitialMarking', 'simTerminal', 'simBound', 'simTransition', 'simGuard'] },
    { id: 'control-flow', title: 'Control flow', keys: ['simOwnedTransitions', 'simSource', 'simNextState', 'simFork', 'simJoin'] },
    { id: 'petri', title: 'Petri net', keys: ['simArc', 'simArcSource', 'simArcTarget', 'simArcWeight', 'simInhibitorArc'] },
    // No Event select: the event class is the Trigger's type (R-SIM-38), shown read-only after Trigger.
    { id: 'events', title: 'Events', keys: ['simTrigger', 'simEventIdentifier'] },
];

/** The project of the current user, as validation reads it (validationContext.ts); '' when none. */
function projectIdOfUser(): string {
    try {
        return (LPointerTargetable.fromPointer(DUser.current as any) as any)?.project?.id ?? '';
    } catch {
        return '';
    }
}

/** A choice waiting for the user (R-SIM-35): the input and its candidates. */
interface PendingChoice {
    event: string | null;
    input: string;
    candidates: readonly Candidate[];
}

type AllProps = OwnProps & StateProps & DispatchProps;

function SimulationPanelComponent(props: AllProps): ReactElement | null {
    const { modelid, isModelMode, configModelId, configModelName, roleSig, optionSig, eventSig, eventClassName } = props;
    const [open, setOpen] = useState(false);
    // Reasons shown when a role write (M2 face) or a run start (M1 face) is refused,
    // and the warning of a run started despite an overlap (no event role, R-SIM-16 parity).
    const [roleError, setRoleError] = useState<string | null>(null);
    const [roleWarning, setRoleWarning] = useState<string | null>(null);
    const [runError, setRunError] = useState<string | null>(null);
    const [runWarning, setRunWarning] = useState<string | null>(null);
    // The panel's own state (R-SIM-36): its status, halt line, choice and «Last step»
    // line change after every input, a discard or a quiescence included, which the
    // version of the 'mark' channel does not follow. `tick` re-reads the run.
    const [tick, setTick] = useState(0);
    const [pending, setPending] = useState<PendingChoice | null>(null);
    const [lastStep, setLastStep] = useState<string | null>(null);
    const [defects, setDefects] = useState<string | null>(null);
    const [interrupted, setInterrupted] = useState(false);
    // M2 face: the groups the user opened or closed; the others follow their default.
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

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

    /** Labels of the engine roles the shape lacks, and of the invalid ones (simRoleStatus.ts). */
    const missingRoles = missingEngineRoles(roles);
    const invalidRoles = invalidEngineRoles(roles);
    const rolesComplete = missingRoles.length === 0 && invalidRoles.length === 0;
    /**
     * The event role is declared: the rule of netStcFromRoles, both keys set, on
     * the derived roles, so a Trigger typed to a class (R-SIM-38).
     */
    const eventRole = !!(roles.simEvent && roles.simTrigger);
    /** The Petri shape, recognised by the arc role (R-SIM-31). */
    const petriShape = !!roles.simArc;

    const writeRole = useCallback((key: RoleKey, value: string): void => {
        if (!configModelId) return;
        const lmm: any = LPointerTargetable.fromPointer(configModelId);
        if (!lmm) return;
        // R-SIM-16, the same verdict as the run start, on the roles as they will
        // stand after this save: with the event role or the Petri shape an overlap
        // refuses the save; otherwise the save goes through with a warning. The
        // event class is derived after the write, so a new Trigger is judged with
        // its own type (R-SIM-38).
        const lookup: any = (store.getState() as any).idlookup ?? {};
        const after = withDerivedEventRole({ ...roles, [key]: value === '' ? undefined : value }, lookup);
        const verdict = overlapVerdict(lookup, after, options.classes.map(c => c.id));
        if (verdict?.refuse) {
            setRoleWarning(null);
            setRoleError(overlapMessage(lookup, verdict.overlap));
            return;
        }
        setRoleError(null);
        setRoleWarning(verdict ? overlapMessage(lookup, verdict.overlap) : null);
        // Shallow patch of the bag: the empty option writes `undefined`, which
        // set_state turns into the removal of the key (joiner/classes.ts:2222).
        // The value is a pointer (the option id), never a proxy; the bound, a digit string.
        lmm.state = { [key]: value === '' ? undefined : value };
    }, [configModelId, roles, options]);

    // The run of this model, read on the panel's renders: the ones its own state
    // triggers (tick) and the ones connect triggers; never on the version.
    const run = isModelMode ? getSimRun(modelid) : undefined;

    // R-SIM-34: while a run exists its signature is read on every dispatch, and a
    // model edit that changes it withdraws the run with one line of declaration.
    // The baseline is the one startRun took on the lookup the net was compiled from.
    const liveSignature = useSelector((state: DState) =>
        (run ? runSignature((state as any)?.idlookup ?? {}, modelid, configModelId) : ''));
    useEffect(() => {
        const current = getSimRun(modelid);
        if (!current || liveSignature === '' || liveSignature === current.signature) return;
        simClear(modelid);
        setPending(null);
        setLastStep(null);
        setDefects(null);
        setRunError(null);
        setRunWarning(null);
        setInterrupted(true);
        setTick(t => t + 1);
    }, [liveSignature, modelid]);

    // Status, enabled inputs and halt line from the Petri core (R-SIM-29).
    const view = useMemo(() => {
        if (!isModelMode || !rolesComplete) return null;
        const r = getSimRun(modelid);
        if (!r) return { status: 'Not started' as NetRunStatus, inputs: panelInputs('Not started', null), halt: null as string | null };
        const status = netRunStatus(r.net, r.config, r.alphabet, r.guards, r.halt);
        const lookup: any = (store.getState() as any).idlookup ?? {};
        return {
            status,
            inputs: panelInputs(status, structuralInputs(r.net, r.config.state)),
            halt: r.halt ? haltMessage(r.halt, lookup) : null,
        };
        // tick is the real input of this memo: the run changes only through this panel.
    }, [isModelMode, rolesComplete, modelid, tick]);

    const onReset = useCallback((): void => {
        const lookup: any = (store.getState() as any).idlookup ?? {};
        setPending(null);
        setLastStep(null);
        setDefects(null);
        setInterrupted(false);
        // R-SIM-16: the roles are checked again at run start, since the
        // metamodel can have changed after they were saved. With the event role
        // or the Petri shape an overlap refuses the run, and a run already under
        // way is stopped; otherwise the run starts and the overlap is a warning.
        const verdict = configModelId
            ? overlapVerdict(lookup, roles, collectMetaOptions(lookup, configModelId).classes.map(c => c.id))
            : null;
        if (verdict?.refuse) {
            simClear(modelid);
            setRunWarning(null);
            setRunError(`Run not started. ${overlapMessage(lookup, verdict.overlap)}`);
            setTick(t => t + 1);
            return;
        }
        // The bridge (simBridge.ts): the net, and the model frozen once with the
        // model's own metamodel as the context's target (R-SIM-37).
        const started = startRun(lookup, modelid, configModelId, projectIdOfUser(), buildEvalContext);
        if (started.kind === 'refused') {
            simClear(modelid);
            setRunWarning(null);
            setRunError(`Run not started. ${started.reason}`);
            setTick(t => t + 1);
            return;
        }
        setRunError(null);
        setRunWarning(verdict ? overlapMessage(lookup, verdict.overlap) : null);
        simReset(modelid, started.run);
        setDefects(defectsLine(started.run.net, lookup));
        setLastStep('Reset');
        setTick(t => t + 1);
    }, [modelid, roles, configModelId]);

    const onStop = useCallback((): void => {
        setRunError(null);
        setRunWarning(null);
        setPending(null);
        setLastStep(null);
        setDefects(null);
        setInterrupted(false);
        simClear(modelid);
        setTick(t => t + 1);
    }, [modelid]);

    /**
     * One input: `event` an event instance id, `null` for ε; `selector` the
     * transition the user chose from the list. The bridge commits the step and
     * gives back the lines to show (R-SIM-35, R-SIM-36).
     */
    const fire = useCallback((event: string | null, selector?: string): void => {
        const lookup: any = (store.getState() as any).idlookup ?? {};
        const input = event === null ? 'ε' : (events.find(e => e.id === event)?.label ?? event);
        const pressed = pressInput(modelid, event, selector, lookup, input);
        setPending(pressed.pending ? { event, input, candidates: pressed.pending } : null);
        if (pressed.lastStep !== null) setLastStep(pressed.lastStep);
        setTick(t => t + 1);
    }, [modelid, events]);

    const onStep = useCallback((): void => { fire(null); }, [fire]);

    const optionsFor = (kind: RoleKind): MetaOption[] => {
        if (kind === 'class') return options.classes;
        if (kind === 'composition') return options.compositions;
        if (kind === 'attribute') return options.attributes;
        return options.references;
    };

    /** Groups open by default: the ones the shape uses, and Events when any of its keys is set. */
    const groupOpen = (id: string): boolean => {
        if (openGroups[id] !== undefined) return openGroups[id];
        if (id === 'control-flow') return !petriShape;
        if (id === 'petri') return petriShape;
        if (id === 'events') return !!(roles.simTrigger || roles.simEventIdentifier);
        return true;
    };

    const renderRole = (spec: RoleSpec): ReactElement => (
        <label className="sim-panel__row" key={spec.key}>
            <span className="sim-panel__label">{spec.label}</span>
            {spec.kind === 'number' ? (
                <input
                    type="number"
                    className="sim-panel__input"
                    min={1}
                    step={1}
                    placeholder={spec.placeholder}
                    value={roles[spec.key] ?? ''}
                    onChange={e => writeRole(spec.key, e.target.value)}
                />
            ) : (
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
            )}
        </label>
    );

    /** The derived event class, read-only (R-SIM-38): its name, or why there is none. */
    const renderEventClass = (): ReactElement => (
        <div className="sim-panel__row" key="eventClass">
            <span className="sim-panel__label">Event class</span>
            <span className="sim-panel__hint">
                {!roles.simTrigger
                    ? 'Set Trigger to enable events.'
                    : roles.simEvent ? eventClassName : 'The Trigger reference has no class type.'}
            </span>
        </div>
    );

    const status: NetRunStatus | null = view?.status ?? null;

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
                    {isModelMode && status && status !== 'Not started' && (
                        <span className={`sim-panel__dot sim-panel__dot--${status.toLowerCase().replace(' ', '-')}`} />
                    )}
                </button>
            </div>
        );
    }

    const lookupNow: any = (store.getState() as any).idlookup ?? {};

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
                        ) : (
                            <>
                                <div className="sim-panel__hint">
                                    {petriShape ? 'Shape: Petri net.' : 'Shape: control flow. Set Arc for a Petri net.'}
                                </div>
                                {ROLE_GROUPS.map(group => {
                                    const isOpen = groupOpen(group.id);
                                    return (
                                        <div key={group.id}>
                                            <button
                                                type="button"
                                                className="sim-panel__group"
                                                aria-expanded={isOpen}
                                                onClick={() => setOpenGroups(g => ({ ...g, [group.id]: !isOpen }))}
                                            >
                                                <i className={`bi bi-chevron-${isOpen ? 'down' : 'right'}`} />
                                                <span>{group.title}</span>
                                            </button>
                                            {isOpen && ROLE_SPECS.filter(spec => group.keys.includes(spec.key)).flatMap(spec => (
                                                spec.key === 'simTrigger' ? [renderRole(spec), renderEventClass()] : [renderRole(spec)]
                                            ))}
                                        </div>
                                    );
                                })}
                            </>
                        )}
                        {invalidRoles.length > 0 && (
                            <div className="sim-panel__hint sim-panel__hint--error">{`Invalid: ${invalidRoles.join(', ')}.`}</div>
                        )}
                        {roleError && <div className="sim-panel__hint sim-panel__hint--error">{roleError}</div>}
                        {roleWarning && <div className="sim-panel__hint sim-panel__hint--warning">{roleWarning}</div>}
                    </>
                ) : !rolesComplete ? (
                    <div className="sim-panel__hint">
                        {configModelId
                            ? incompleteConfigurationMessage(configModelName, [...missingRoles, ...invalidRoles])
                            : 'No metamodel to configure.'}
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
                                title={eventRole ? 'Step (ε)' : 'Step'}
                                onClick={onStep}
                                disabled={!view?.inputs.epsilon}
                            >
                                <i className="bi bi-play-fill" />
                            </button>
                            <button type="button" className="sim-panel__btn" title="Stop" onClick={onStop}>
                                <i className="bi bi-stop-fill" />
                            </button>
                        </div>
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
                                                disabled={!view?.inputs.events.has(e.id)}
                                            >
                                                <i className="bi bi-chevron-right" />
                                                <span>{e.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                        {pending && run && (
                            <>
                                <div className="sim-panel__section">{`Choose a transition (${pending.input})`}</div>
                                <div className="sim-panel__choices">
                                    {pending.candidates.map(c => (
                                        <button
                                            type="button"
                                            className="sim-panel__choice"
                                            key={c.transition}
                                            onClick={() => fire(pending.event, c.transition)}
                                        >
                                            <span>{candidateLabel(run.net, c.transition, lookupNow)}</span>
                                            {c.unsafe && (
                                                <span className="sim-panel__choice-note">{`exceeds bound ${run.net.bound}`}</span>
                                            )}
                                        </button>
                                    ))}
                                    <button type="button" className="sim-panel__cancel" onClick={() => setPending(null)}>
                                        Cancel
                                    </button>
                                </div>
                            </>
                        )}
                        {runError && <div className="sim-panel__hint sim-panel__hint--error">{runError}</div>}
                        {runWarning && <div className="sim-panel__hint sim-panel__hint--warning">{runWarning}</div>}
                        {interrupted && (
                            <div className="sim-panel__hint sim-panel__hint--warning">
                                Run interrupted: the model changed. Reset to run again.
                            </div>
                        )}
                        {defects && <div className="sim-panel__hint sim-panel__hint--warning">{defects}</div>}
                        {lastStep && <div className="sim-panel__hint">{`Last step: ${lastStep}`}</div>}
                        {view?.halt && <div className="sim-panel__hint sim-panel__hint--error">{view.halt}</div>}
                        <div className="sim-panel__status">
                            <span className={`sim-panel__dot sim-panel__dot--${(status ?? 'not started').toLowerCase().replace(' ', '-')}`} />
                            <span className="sim-panel__status-text">{status}</span>
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
    /**
     * JSON of the role values (the twenty `sim*` keys of ROLE_SPECS, `simEvent`
     * derived from the Trigger, R-SIM-38) — a primitive, so shallow compare works.
     */
    roleSig: string;
    /** JSON of the option lists; empty on the M1 face, which does not need them. */
    optionSig: string;
    /**
     * JSON of the event instances of the M1 model with their labels (step 1),
     * sorted; empty on the M2 face and without the event role.
     */
    eventSig: string;
    /** Name of the derived event class, for the read-only row of the M2 face; '' without one. */
    eventClassName: string;
}

interface DispatchProps { }

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const lookup: any = (state as any).idlookup ?? {};
    const dModel: any = lookup[ownProps.modelid];
    const configModelId: string | null = ownProps.isModelMode
        ? (typeof dModel?.instanceof === 'string' ? dModel.instanceof : null)
        : (dModel ? ownProps.modelid : null);

    // The derived bag (R-SIM-38): simEvent is the Trigger's type, a stale value in the bag ignored.
    const bag: any = withDerivedEventRole((configModelId ? lookup[configModelId]?._state : null) ?? {}, lookup);
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
        eventSig: ownProps.isModelMode ? eventSigOf(lookup, ownProps.modelid, roles) : '',
        eventClassName: roles.simEvent ? (lookup[roles.simEvent]?.name || roles.simEvent) : '',
    };
}

/**
 * The event list of an M1 model as a JSON signature, so connect's shallow
 * compare holds. One `collectModelObjectIds` scan per dispatched action, only
 * when the event role is declared.
 */
function eventSigOf(lookup: any, modelId: string, roles: Roles): string {
    if (!roles.simEvent || !roles.simTrigger) return '';
    const stc = netStcFromRoles(roles);
    if (!stc) return '';
    // eventAlphabet reads only isInstanceOf and label from the view.
    return JSON.stringify(eventAlphabet(stc, makeNetModelView(lookup, stc.eventIdentifier), collectModelObjectIds(lookup, modelId)));
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
