/**
 * SimulationPanel — control panel of the state-machine simulation, v1
 * (R-SIM-1..R-SIM-6). Floating panel, closed to a chip (progressive
 * disclosure), mounted in editor-v2 and portaled to <body> by EditorV2.
 *
 * Two faces, one component:
 *
 * - M2 face (metamodel): the six simulation ROLES, written into the `data.state`
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
import './simulation-panel.scss';

// ---------------------------------------------------------------------------
// Roles — flat keys in the M2 bag (R-SIM-2). No nested `sim: {...}` object: the
// bag copy is shallow, a nested mutation would escape actions/undo/re-render.
// ---------------------------------------------------------------------------

type RoleKey =
    | 'simNode'
    | 'simInitial'
    | 'simTerminal'
    | 'simTransition'
    | 'simOwnedTransitions'
    | 'simNextState';

type RoleKind = 'class' | 'composition' | 'reference';

interface RoleSpec {
    key: RoleKey;
    label: string;
    kind: RoleKind;
    placeholder: string;
}

const ROLE_SPECS: RoleSpec[] = [
    { key: 'simNode', label: 'Node', kind: 'class', placeholder: 'Select a metaclass' },
    { key: 'simInitial', label: 'Initial', kind: 'class', placeholder: 'Select a metaclass' },
    { key: 'simTerminal', label: 'Terminal', kind: 'class', placeholder: 'Select a metaclass' },
    { key: 'simTransition', label: 'Transition', kind: 'class', placeholder: 'Select a metaclass' },
    { key: 'simOwnedTransitions', label: 'Owned transitions', kind: 'composition', placeholder: 'Select a composition' },
    { key: 'simNextState', label: 'Next state', kind: 'reference', placeholder: 'Select a reference' },
];

const ROLE_KEYS: RoleKey[] = ROLE_SPECS.map(r => r.key);

/**
 * Roles the ENGINE reads: initial (reset), terminal (termination), the
 * composition of the outgoing transitions and the reference to the next state
 * (step). `simNode` and `simTransition` are declarative in v1 — `simTransition`
 * is configurable but unread in the prototype too (discovery Q2), and the
 * run-state no longer needs `simNode` to know which instances to clear (the
 * singleton is emptied wholesale). Gating the buttons on exactly what the engine
 * reads avoids a panel disabled for a role nothing consumes.
 */
const ENGINE_ROLE_KEYS: RoleKey[] = ['simInitial', 'simTerminal', 'simOwnedTransitions', 'simNextState'];

type Roles = Partial<Record<RoleKey, string>>;

interface MetaOption { id: string; name: string }
interface MetaOptions { classes: MetaOption[]; compositions: MetaOption[]; references: MetaOption[] }

const EMPTY_OPTIONS: MetaOptions = { classes: [], compositions: [], references: [] };

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
    return { classes: classes.sort(byName), compositions: compositions.sort(byName), references: references.sort(byName) };
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type RunStatus = 'Not started' | 'Running' | 'Terminated' | 'Deadlock';

type AllProps = OwnProps & StateProps & DispatchProps;

function SimulationPanelComponent(props: AllProps): ReactElement | null {
    const { modelid, isModelMode, configModelId, roleSig, optionSig, ownedTransitionsName, nextStateName } = props;
    const [open, setOpen] = useState(false);
    // Subscribes the panel to the run-state singleton (status line + highlight).
    const simVersion = useSimVersion();

    const roles: Roles = useMemo(() => {
        try { return JSON.parse(roleSig) as Roles; } catch { return {}; }
    }, [roleSig]);

    const options: MetaOptions = useMemo(() => {
        if (!optionSig) return EMPTY_OPTIONS;
        try { return JSON.parse(optionSig) as MetaOptions; } catch { return EMPTY_OPTIONS; }
    }, [optionSig]);

    // R-SIM-5: the run-state is per model. Clearing on modelid change and on
    // unmount keeps the flags from surviving into another model of the session.
    useEffect(() => () => { simClear(); }, [modelid]);

    const rolesComplete = ENGINE_ROLE_KEYS.every(k => !!roles[k]);

    const writeRole = useCallback((key: RoleKey, value: string): void => {
        if (!configModelId) return;
        const lmm: any = LPointerTargetable.fromPointer(configModelId);
        if (!lmm) return;
        // Shallow patch of the bag: the empty option writes `undefined`, which
        // set_state turns into the removal of the key (joiner/classes.ts:2222).
        // The value is a pointer (the option id), never a proxy.
        lmm.state = { [key]: value === '' ? undefined : value };
    }, [configModelId]);

    const runStatus: RunStatus | null = useMemo(() => {
        if (!isModelMode || !rolesComplete) return null;
        const lookup: any = (store.getState() as any).idlookup ?? {};
        const activeIds = getSimActiveIds().filter(id => !!lookup[id]);
        if (activeIds.length === 0) return 'Not started';
        if (activeIds.some(id => lookup[id]?.instanceof === roles.simTerminal)) return 'Terminated';
        // Deadlock: at least one active non-terminal instance with no outgoing
        // transition, and no terminal active. Derived at every render, never stored.
        const stuck = activeIds.some(id => outgoingTransitions(id, ownedTransitionsName).length === 0);
        return stuck ? 'Deadlock' : 'Running';
        // simVersion is the subscription to the active set — the real input of
        // this memo, and the reason the D-layer read above can go through
        // store.getState() (same idiom as irResolve.ts:78).
    }, [isModelMode, rolesComplete, roles.simTerminal, ownedTransitionsName, simVersion]);

    const onReset = useCallback((): void => {
        const lookup: any = (store.getState() as any).idlookup ?? {};
        const initialId = roles.simInitial;
        if (!initialId) return;
        const ids = collectModelObjectIds(lookup, modelid)
            .filter(id => lookup[id]?.instanceof === initialId);
        simReset(ids);
    }, [modelid, roles.simInitial]);

    const onStop = useCallback((): void => { simClear(); }, []);

    /**
     * One step, one `simApplyStep`. For every active instance: its outgoing
     * transitions fire, their targets activate, the source deactivates. An
     * active instance with no outgoing transition stays active — the deadlock
     * stays visible instead of silently emptying the set (prototype behaviour,
     * Control.tsx:288-295, made explicit). A transition whose `nextState` is
     * unset still consumes the source token, as in the prototype: a dangling
     * transition is a modelling error and shows up as a token that vanishes.
     */
    const onStep = useCallback((): void => {
        const lookup: any = (store.getState() as any).idlookup ?? {};
        const activeIds = getSimActiveIds().filter(id => !!lookup[id]);
        // Terminated: no-op, exactly like the prototype's termination guard.
        if (activeIds.some(id => lookup[id]?.instanceof === roles.simTerminal)) return;

        const deactivate: string[] = [];
        const activate: string[] = [];
        for (const id of activeIds) {
            const transitions = outgoingTransitions(id, ownedTransitionsName);
            if (transitions.length === 0) continue;
            for (const t of transitions) {
                const targetId = transitionTargetId(t, nextStateName);
                if (targetId && lookup[targetId]) activate.push(targetId);
            }
            deactivate.push(id);
        }
        simApplyStep(deactivate, activate);
    }, [roles.simTerminal, ownedTransitionsName, nextStateName]);

    const optionsFor = (kind: RoleKind): MetaOption[] => {
        if (kind === 'class') return options.classes;
        if (kind === 'composition') return options.compositions;
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
                    </>
                ) : !rolesComplete ? (
                    <div className="sim-panel__hint">Configure simulation roles on the metamodel</div>
                ) : (
                    <>
                        <div className="sim-panel__actions">
                            <button type="button" className="sim-panel__btn" title="Reset" onClick={onReset}>
                                <i className="bi bi-skip-backward-fill" />
                            </button>
                            <button
                                type="button"
                                className="sim-panel__btn"
                                title="Step"
                                onClick={onStep}
                                disabled={runStatus === 'Terminated'}
                            >
                                <i className="bi bi-play-fill" />
                            </button>
                            <button type="button" className="sim-panel__btn" title="Stop" onClick={onStop}>
                                <i className="bi bi-stop-fill" />
                            </button>
                        </div>
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
    /** JSON of the six role pointers — a primitive, so shallow compare works. */
    roleSig: string;
    /** JSON of the option lists; empty on the M1 face, which does not need them. */
    optionSig: string;
    /** Feature names of the two navigated roles, resolved from their pointers. */
    ownedTransitionsName: string;
    nextStateName: string;
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
        roleSig: JSON.stringify(roles),
        optionSig: !ownProps.isModelMode && configModelId
            ? JSON.stringify(collectMetaOptions(lookup, configModelId))
            : '',
        ownedTransitionsName: (roles.simOwnedTransitions && lookup[roles.simOwnedTransitions]?.name) || '',
        nextStateName: (roles.simNextState && lookup[roles.simNextState]?.name) || '',
    };
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
