/**
 * SimulationPanel — control panel of the state-machine simulation, v1
 * (R-SIM-1..R-SIM-6). Floating panel, closed to a chip (progressive
 * disclosure), mounted by EditorV2 inside the editor, not portaled: a hidden
 * dock tab hides it with its editor (P-2026-09-24-1005).
 *
 * Two faces, one component:
 *
 * - M2 face (metamodel): the profile row (R-SIM-77..79): a preset, its summary,
 *   Apply, and «Configure…», which opens the «Simulation roles» dialog
 *   (SimRolesModal.tsx, R-SIM-55; P-2026-09-27-1740). The roles are written into
 *   the `data.state` bag of the M2 model with flat `sim*` keys and pointer values
 *   (R-SIM-2), the bound as a digit string, the declared state attributes as one
 *   JSON string (R-SIM-67). Persisted, undoable, shared in collaborative — it is
 *   authoring.
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
import { Defaults, DState, DUser, LPointerTargetable, store } from '../../../joiner';
import { buildEvalContext } from '../../../jjscript';
import { getSimRun, simClear, simReset } from './simRunState';
import {
    PANEL_PROFILE_IDS, PROFILE_KEY, ROLE_SPECS, STATE_ATTRIBUTES_SPEC, boundProposalBag, boundProposalInputs, incompleteConfigurationMessage, invalidEngineRoles, missingEngineRoles,
    profilePatch, profileSummary, profileSummaryText, storedProfile,
} from './simRoleStatus';
import {
    candidateLabel, collectModelObjectIds, defectsLine, defectsTitle, haltMessage, haltTitle, inputReason, makeNetModelView, markingLine, panelInputs,
    pressInput, runSignature, startRun, stopReason,
} from './simBridge';
import type { InputLabel, StopReason } from './simBridge';
import { sketchOfMetamodel } from './metamodelSketch';
import { boundEstimate, boundEstimateSignature } from './modelMarkings';
import { eventAlphabet, netStcFromRoles, withDerivedEventRole } from '../../../model/simulation/netCompile';
import { netRunStatus, structuralInputs } from '../../../model/simulation/netStep';
import { overlapVerdict } from '../../../model/simulation/stcFromRoles';
import { bindProfile } from '../../../model/simulation/profileBinder';
import { ROLE_CATALOG } from '../../../model/simulation/roleCatalog';
import { systemProfile } from '../../../model/simulation/simProfiles';
import type { MetamodelSketch, ProfileBindings } from '../../../model/simulation/profileBinder';
import type { SimProfile } from '../../../model/simulation/simProfiles';
import type { RoleOverlap } from '../../../model/simulation/stcFromRoles';
import type { Candidate, NetRunStatus } from '../../../model/simulation/netTypes';
import type { SimEventInfo } from '../../../model/simulation/types';
import type { RoleKey, Roles } from './simRoleStatus';
import { SimRolesModal } from './SimRolesModal';
import './simulation-panel.scss';

// Roles: ROLE_SPECS, ENGINE_ROLE_KEYS and the role types live in simRoleStatus.ts.
const ROLE_KEYS: RoleKey[] = ROLE_SPECS.map(r => r.key);

/** The keys the profile row reads from the raw bag: every role of the catalog, and `simProfile` (R-SIM-55). */
const PROFILE_BAG_KEYS: string[] = [...ROLE_CATALOG.flatMap(d => (d.key === null ? [] : [d.key])), PROFILE_KEY];

/** The presets of the select (R-SIM-79, A2). */
const PANEL_PROFILES: SimProfile[] = PANEL_PROFILE_IDS.map(id => systemProfile(id) as SimProfile);

/** The title of the summary while Apply has something to write (R-SIM-78, R-SIM-34). */
const APPLY_NOTE = 'Apply writes the proposed bindings and the profile in one step; one undo reverts it. '
    + 'A run on a model of this metamodel is interrupted.';

interface MetaOption { id: string; name: string }
interface MetaOptions {
    classes: MetaOption[]; compositions: MetaOption[]; references: MetaOption[]; attributes: MetaOption[];
    /** The Data group (R-SIM-71): attributes typed `Expression` or EString, `Action` or EString; classes abstract included. */
    expressionAttributes: MetaOption[]; actionAttributes: MetaOption[]; allClasses: MetaOption[];
}

const EMPTY_OPTIONS: MetaOptions = {
    classes: [], compositions: [], references: [], attributes: [], expressionAttributes: [], actionAttributes: [], allClasses: [],
};

/** The types a guard feature may have, and an action feature (R-SIM-44): the lane-A type, or EString. */
const EXPRESSION_TYPES: ReadonlySet<string> = new Set([Defaults.Pointer_EXPRESSION, Defaults.Pointer_ESTRING]);
const ACTION_TYPES: ReadonlySet<string> = new Set([Defaults.Pointer_ACTION, Defaults.Pointer_ESTRING]);

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
    const expressionAttributes: MetaOption[] = [];
    const actionAttributes: MetaOption[] = [];
    const allClasses: MetaOption[] = [];
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
                // A state attribute may be declared on an abstract class: its instances are its subclasses'.
                allClasses.push({ id: cid, name: className });
                // Attributes of every class, abstract ones included: an identifier
                // declared on a superclass is inherited by the event metaclass.
                const attrIds = dClass.attributes ?? [];
                if (Array.isArray(attrIds)) {
                    for (const aid of attrIds) {
                        if (typeof aid !== 'string') continue;
                        const dAttr = lookup[aid];
                        if (!dAttr) continue;
                        const option: MetaOption = { id: aid, name: `${className}.${dAttr.name ?? aid}` };
                        attributes.push(option);
                        if (EXPRESSION_TYPES.has(dAttr.type)) expressionAttributes.push(option);
                        if (ACTION_TYPES.has(dAttr.type)) actionAttributes.push(option);
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
        attributes: attributes.sort(byName), expressionAttributes: expressionAttributes.sort(byName),
        actionAttributes: actionAttributes.sort(byName), allClasses: allClasses.sort(byName),
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
    const {
        modelid, isModelMode, configModelId, configModelName, roleSig, optionSig, eventSig, eventClassName, stateAttributesRaw, profileBagSig, sketchSig,
    } = props;
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
    // «Last step» and its title, which lists the assignments of the step (R-SIM-71).
    const [lastStep, setLastStep] = useState<{ text: string; title: string } | null>(null);
    const [defects, setDefects] = useState<{ line: string; title: string } | null>(null);
    const [interrupted, setInterrupted] = useState(false);
    // The list of reasons under the status row, opened by the user only (R-SIM-58, R-SIM-63).
    const [reasonsOpen, setReasonsOpen] = useState(false);
    // M2 face: the preset picked in the select and not applied yet (R-SIM-79); null shows the stored profile.
    const [chosen, setChosen] = useState<string | null>(null);
    // «Configure…» opens the «Simulation roles» dialog; the declarations hint opens it on Data (R-SIM-81(3)).
    const [modal, setModal] = useState<{ onData: boolean } | null>(null);
    useEffect(() => { setChosen(null); setModal(null); }, [configModelId]);

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

    // The profile row (M2 face): the raw bag it reads, the sketch the binder reads.
    const profileBag: Record<string, unknown> = useMemo(() => {
        if (!profileBagSig) return {};
        try { return JSON.parse(profileBagSig) as Record<string, unknown>; } catch { return {}; }
    }, [profileBagSig]);
    const sketch: MetamodelSketch | null = useMemo(() => {
        if (!sketchSig) return null;
        try { return JSON.parse(sketchSig) as MetamodelSketch; } catch { return null; }
    }, [sketchSig]);
    const stored = useMemo(() => storedProfile(profileBag), [profileBag]);
    /** The stored profile is one of the select's presets; otherwise the select shows it as the current state. */
    const storedPreset = !stored.custom && stored.profile.system && PANEL_PROFILE_IDS.some(id => id === stored.profile.id);
    const selected: SimProfile = (chosen ? systemProfile(chosen) : undefined) ?? stored.profile;
    // «Custom» is bound against nothing: no proposals, no Apply (D7).
    const bindings: ProfileBindings | null = useMemo(
        () => (selected.system && sketch ? bindProfile(selected, sketch) : null),
        [selected, sketch],
    );
    // The Bound proposal (R-SIM-81, G2): the largest initial marking on the models, read only while the panel is open.
    const markingInputs = useMemo(
        () => (bindings ? boundProposalInputs(selected, profileBag, bindings) : null),
        [selected, profileBag, bindings],
    );
    // Since G12(b) (R-SIM-81(1) as amended 2026-09-27) the reachable markings of the models under the bag as Apply
    // leaves it. The selector reads only their signature, on every store change while the panel is open; the
    // exploration runs in the memo when the signature or the bag changes, capped (report §5.1 risk 5).
    const boundBag = useMemo(
        () => (markingInputs && bindings ? boundProposalBag(selected, profileBag, bindings) : null),
        [markingInputs, selected, profileBag, bindings],
    );
    const markingSig = useSelector((state: DState) => (open && configModelId && boundBag
        ? boundEstimateSignature((state as any)?.idlookup ?? {}, configModelId)
        : ''));
    const largestMarking = useMemo(
        () => (markingSig && configModelId && boundBag
            ? boundEstimate((store.getState() as any).idlookup ?? {}, configModelId, boundBag)
            : null),
        [markingSig, configModelId, boundBag],
    );
    const summary = useMemo(
        () => profileSummary(selected, profileBag, bindings, largestMarking),
        [selected, profileBag, bindings, largestMarking],
    );

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

    /**
     * Apply (R-SIM-78): one assignment of the proposed values of the unset keys
     * and `simProfile`, so one transaction and one undo step (report §6.3). The
     * overlap check of a role write (R-SIM-16) runs first; a refusal writes nothing and says why.
     */
    const applyProfile = useCallback((): void => {
        if (!configModelId || !bindings) return;
        const lmm: any = LPointerTargetable.fromPointer(configModelId);
        if (!lmm) return;
        const lookup: any = (store.getState() as any).idlookup ?? {};
        const result = profilePatch(selected, profileBag, bindings, lookup, options.classes.map(c => c.id), largestMarking);
        if (result.kind === 'refused') {
            setRoleWarning(null);
            setRoleError(overlapMessage(lookup, result.overlap));
            return;
        }
        setRoleError(null);
        setRoleWarning(result.overlap ? overlapMessage(lookup, result.overlap) : null);
        lmm.state = result.patch;
        setChosen(null);
    }, [configModelId, bindings, selected, profileBag, options, largestMarking]);

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
        setReasonsOpen(false);
        setTick(t => t + 1);
    }, [liveSignature, modelid]);

    // Status, enabled inputs and halt line from the Petri core (R-SIM-29), and why
    // an input has no candidate (R-SIM-58..60): computed here, once per panel
    // action, never in the render body and never on the version (report §3.4).
    const view = useMemo(() => {
        if (!isModelMode || !rolesComplete) return null;
        const r = getSimRun(modelid);
        if (!r) {
            return {
                status: 'Not started' as NetRunStatus, inputs: panelInputs('Not started', null), halt: null as { line: string; title: string } | null,
                reason: null as StopReason | null, noCandidate: new Map<string | null, string>(),
                marking: null as { line: string; title: string } | null,
            };
        }
        const status = netRunStatus(r.net, r.config, r.alphabet, r.guards, r.halt);
        const lookup: any = (store.getState() as any).idlookup ?? {};
        const inputs = panelInputs(status, structuralInputs(r.net, r.config.state));
        const label: InputLabel = e => (e === null ? 'ε' : events.find(x => x.id === e)?.label ?? e);
        // R-SIM-60: a button that is on while its input has no candidate says why in its title.
        const noCandidate = new Map<string | null, string>();
        if (status === 'Running') {
            for (const e of [...(inputs.epsilon ? [null] : []), ...inputs.events]) {
                const why = inputReason(r, e, lookup, label, roles.simGuard);
                if (why) noCandidate.set(e, why.full);
            }
        }
        // The halt names elements, never ids; the action that stopped the run is in its title only (R-SIM-62, R-SIM-70).
        const features = { action: roles.simAction, entry: roles.simEntry, exit: roles.simExit };
        return {
            status,
            inputs,
            halt: r.halt ? { line: haltMessage(r.halt, lookup, features), title: haltTitle(r.halt, lookup, features, r.net) } : null,
            reason: status === 'Deadlock' ? stopReason(r, lookup, label, roles.simGuard) : null,
            noCandidate,
            // The run's σ for the audience, from Reset to Stop; a halt keeps the σ it halted on (R-SIM-82, G3).
            marking: markingLine(r.config.state, r.net, lookup),
        };
        // tick is the real input of this memo: the run changes only through this panel.
    }, [isModelMode, rolesComplete, modelid, tick, events, roles.simGuard, roles.simAction, roles.simEntry, roles.simExit]);

    const onReset = useCallback((): void => {
        const lookup: any = (store.getState() as any).idlookup ?? {};
        setPending(null);
        setLastStep(null);
        setDefects(null);
        setInterrupted(false);
        setReasonsOpen(false);
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
        // One line for the net's defects and the guards' (R-SIM-61), every defect in full in its title.
        const line = defectsLine(started.run.net, lookup, started.compileDefects);
        setDefects(line === null ? null : { line, title: defectsTitle(started.run.net, lookup, started.compileDefects) ?? line });
        setLastStep({ text: 'Reset', title: 'Reset' });
        setTick(t => t + 1);
    }, [modelid, roles, configModelId]);

    const onStop = useCallback((): void => {
        setRunError(null);
        setRunWarning(null);
        setPending(null);
        setLastStep(null);
        setDefects(null);
        setInterrupted(false);
        setReasonsOpen(false);
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
        if (pressed.lastStep !== null) setLastStep({ text: pressed.lastStep, title: pressed.lastStepTitle ?? pressed.lastStep });
        setReasonsOpen(false);
        setTick(t => t + 1);
    }, [modelid, events]);

    const onStep = useCallback((): void => { fire(null); }, [fire]);

    /** A class or feature by id, with the labels of the selects: `Class.feature` for a feature. */
    const nameOf = (id: string): string => {
        for (const list of [options.allClasses, options.references, options.compositions, options.attributes]) {
            const hit = list.find(o => o.id === id);
            if (hit) return hit.name;
        }
        return ((store.getState() as any).idlookup ?? {})[id]?.name ?? id;
    };

    /** The hint's «Add attribute» (R-SIM-81, G9): the dialog opens on Data, its Add attribute focused. */
    const declareAttributes = (): void => { setModal({ onData: true }); };

    /** The summary under the profile row (R-SIM-77, R-SIM-79): verdict, missing, choices, proposals, kept, set but off, declarations. */
    const renderSummary = (): ReactElement => {
        const text = profileSummaryText(summary, nameOf);
        return (
            <div className="sim-panel__summary">
                <div className="sim-panel__summary-status" title={summary.pending ? `${text.status}. ${APPLY_NOTE}` : text.status}>
                    <span className="sim-panel__summary-name">{`${summary.name} · `}</span>
                    <span className={`sim-panel__badge sim-panel__badge--${summary.status === 'checkable' ? 'checkable' : 'not-checkable'}`}>
                        {text.badge}
                    </span>
                    {summary.pending && <span className="sim-panel__summary-after"> after Apply</span>}
                </div>
                {text.missing && <div className="sim-panel__hint">{text.missing}</div>}
                {text.choose && <div className="sim-panel__hint">{text.choose}</div>}
                {text.proposals.length > 0 && (
                    <ul className="sim-panel__proposals" aria-label="Apply sets">
                        {summary.proposals.map((p, i) => (
                            <li className="sim-panel__proposal" key={p.key} title={`${text.proposals[i]}. ${p.why ?? bindings?.[p.role]?.why ?? ''}`}>
                                {text.proposals[i]}
                            </li>
                        ))}
                    </ul>
                )}
                {text.kept && <div className="sim-panel__hint">{text.kept}</div>}
                {text.setButOff && <div className="sim-panel__hint">{text.setButOff}</div>}
                {text.declare && (
                    <div className="sim-panel__hint">
                        {`${text.declare} `}
                        <button type="button" className="sim-panel__hint-action" onClick={declareAttributes}>Add attribute</button>
                    </div>
                )}
                {!stored.readable && (
                    <div className="sim-panel__hint sim-panel__hint--warning">The stored profile is not readable.</div>
                )}
            </div>
        );
    };

    const status: NetRunStatus | null = view?.status ?? null;
    const reason: StopReason | null = view?.reason ?? null;
    /** A button's title, and why its input has no candidate when it is on without one (R-SIM-60). */
    const inputTitle = (base: string, event: string | null): string => {
        const why = view?.noCandidate.get(event);
        return why ? `${base}\nNo candidate. ${why}` : base;
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
                                {/* The profile row (R-SIM-79): the presets, «Custom» a state and not an option (D7). */}
                                <div className="sim-panel__row sim-panel__profile">
                                    <span className="sim-panel__label">Profile</span>
                                    <select
                                        className="sim-panel__select"
                                        aria-label="Simulation profile"
                                        value={chosen ?? (storedPreset ? stored.profile.id : '')}
                                        onChange={e => setChosen(storedPreset && e.target.value === stored.profile.id ? null : e.target.value)}
                                    >
                                        {!chosen && !storedPreset && <option value="" disabled hidden>{stored.profile.name}</option>}
                                        {PANEL_PROFILES.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}
                                    </select>
                                    <button
                                        type="button"
                                        className="sim-panel__apply"
                                        title={`Apply ${selected.name}`}
                                        disabled={!summary.pending}
                                        onClick={applyProfile}
                                    >
                                        Apply
                                    </button>
                                </div>
                                {renderSummary()}
                                <button
                                    type="button"
                                    className="sim-panel__configure"
                                    aria-haspopup="dialog"
                                    onClick={() => setModal({ onData: false })}
                                >
                                    <i className="bi bi-sliders" />
                                    <span>Configure…</span>
                                </button>
                                {modal && (
                                    <SimRolesModal
                                        configModelId={configModelId}
                                        bag={profileBag}
                                        sketch={sketch}
                                        options={options}
                                        stateAttributesRaw={stateAttributesRaw}
                                        eventClassName={eventClassName}
                                        initialPreset={chosen}
                                        openOnData={modal.onData}
                                        describeOverlap={o => overlapMessage((store.getState() as any).idlookup ?? {}, o)}
                                        nameOf={nameOf}
                                        onClose={() => setModal(null)}
                                        onApplied={warning => {
                                            setModal(null);
                                            setChosen(null);
                                            setRoleError(null);
                                            setRoleWarning(warning);
                                        }}
                                    />
                                )}
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
                        {/* The lines that add to the others sit above the buttons: the panel is anchored at the
                            bottom and grows upward, so they never move the buttons (R-SIM-65, R-SIM-66). One row
                            each, the full text in the title (R-SIM-63). The choice list opens above them too, so Step
                            stays where it is (R-SIM-82, G8); the marking line sits last, for the run's whole lifetime. */}
                        {pending && run && (
                            <>
                                <div className="sim-panel__section">Choose a transition (<span className="sim-panel__section-input">{pending.input}</span>)</div>
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
                        {runWarning && <div className="sim-panel__hint sim-panel__hint--warning sim-panel__hint--line" title={runWarning}>{runWarning}</div>}
                        {defects && (
                            <div className="sim-panel__hint sim-panel__hint--warning sim-panel__hint--line" title={defects.title}>{defects.line}</div>
                        )}
                        {view?.halt && <div className="sim-panel__hint sim-panel__hint--error sim-panel__hint--line sim-panel__hint--halt" title={view.halt.title}>{view.halt.line}</div>}
                        {view?.marking && (
                            <div className="sim-panel__hint sim-panel__hint--line sim-panel__hint--marking" title={view.marking.title}>{view.marking.line}</div>
                        )}
                        <div className="sim-panel__actions">
                            <button type="button" className="sim-panel__btn" title="Reset" onClick={onReset}>
                                <i className="bi bi-skip-backward-fill" />
                            </button>
                            <button
                                type="button"
                                className="sim-panel__btn"
                                title={inputTitle(eventRole ? 'Step (ε)' : 'Step', null)}
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
                                                title={inputTitle(`Fire ${e.label}`, e.id)}
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
                        {/* One slot for the outcome of the last action (R-SIM-66): a refused Reset, the
                            interruption or «Last step», one at a time, replacing each other in place. */}
                        {runError && <div className="sim-panel__hint sim-panel__hint--error sim-panel__hint--line" title={runError}>{runError}</div>}
                        {interrupted && (
                            <div
                                className="sim-panel__hint sim-panel__hint--warning sim-panel__hint--line"
                                title="Run interrupted: the model changed. Reset to run again."
                            >
                                Run interrupted: the model changed. Reset to run again.
                            </div>
                        )}
                        {lastStep && (
                            <div className="sim-panel__hint sim-panel__hint--line" title={`Last step: ${lastStep.title}`}>{`Last step: ${lastStep.text}`}</div>
                        )}
                        {/* In Deadlock the row says why, on its one line, and opens the list per input (R-SIM-58). */}
                        <div
                            className={`sim-panel__status${reason ? ' sim-panel__status--clickable' : ''}`}
                            role={reason ? 'button' : undefined}
                            tabIndex={reason ? 0 : undefined}
                            aria-expanded={reason ? reasonsOpen : undefined}
                            title={reason?.title}
                            onClick={reason ? () => setReasonsOpen(o => !o) : undefined}
                            onKeyDown={reason ? (ev => {
                                if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); setReasonsOpen(o => !o); }
                            }) : undefined}
                        >
                            <span className={`sim-panel__dot sim-panel__dot--${(status ?? 'not started').toLowerCase().replace(' ', '-')}`} />
                            <span className="sim-panel__status-text">{status}</span>
                            {reason && <span className="sim-panel__status-reason">{`· ${reason.line}`}</span>}
                            {reason && <i className={`bi bi-chevron-${reasonsOpen ? 'down' : 'up'} sim-panel__status-toggle`} />}
                        </div>
                        {reason && reasonsOpen && (
                            <ul className="sim-panel__reasons">
                                {reason.inputs.map(i => (
                                    <li className="sim-panel__reason" key={i.event ?? 'ε'} title={i.full}>{i.detail}</li>
                                ))}
                            </ul>
                        )}
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
    /**
     * The raw `simStateAttributes` string of the M2 face, `null` when unset or on
     * the M1 face: a primitive of its own, parsed in the table's memo, never
     * folded into roleSig (report risk 1).
     */
    stateAttributesRaw: string | null;
    /**
     * JSON of the catalog keys set in the raw bag of the M2 face, `simProfile`
     * included: what the profile row reads (R-SIM-77..79); '' on the M1 face.
     */
    profileBagSig: string;
    /** JSON of the metamodel sketch the profile binder reads (R-SIM-77); '' on the M1 face. */
    sketchSig: string;
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
        stateAttributesRaw: !ownProps.isModelMode && typeof bag[STATE_ATTRIBUTES_SPEC.key] === 'string' ? bag[STATE_ATTRIBUTES_SPEC.key] : null,
        profileBagSig: !ownProps.isModelMode && configModelId ? profileBagSigOf(lookup[configModelId]?._state ?? {}) : '',
        sketchSig: !ownProps.isModelMode && configModelId ? JSON.stringify(sketchOfMetamodel(lookup, configModelId)) : '',
    };
}

/**
 * The set keys the profile row reads, from the raw bag (the event class is
 * derived, not a catalog key). A role key counts as a non-empty string; any
 * `simProfile` counts, so that one which is not a string reads as unreadable (D6).
 */
function profileBagSigOf(raw: any): string {
    const out: Record<string, unknown> = {};
    for (const key of PROFILE_BAG_KEYS) {
        const value = raw?.[key];
        if (key === PROFILE_KEY ? value !== undefined && value !== null && value !== '' : typeof value === 'string' && value) out[key] = value;
    }
    return JSON.stringify(out);
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
