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
 *   prototype invariant). A press that reads an input opens the input dialog
 *   (SimInputDialog.tsx, R-SIM-88), portaled: nothing in the panel moves.
 *   «State…» (the label of R-SIM-103; the entry of R-SIM-94) opens the model's
 *   own data dialog (SimDataModal.tsx): the globals of the model in its bag's
 *   `simStateAttributes`, authoring as the M2 face is, never the run; the
 *   undeclared globals of the Reset line lead to it.
 *   The Choices row sets the model's run policy (R-SIM-101): Ask opens an ε
 *   list, Random draws it; Play, between Step and Stop, presses ε every 500 ms
 *   on a timer that reads the store at each tick (simBridge.ts `playPress`).
 *
 * The M1 face shows state, not a line (R-SIM-104, P-2026-10-03-0120): above the
 * transport row, from the top, «Watch» (the pinned attributes, `watchRows`),
 * «Marking» (one chip per marked place, `markingChips`; «Configuration» under a
 * control-flow profile, `stateHeading` of simLabels.ts) and «Events»; under it
 * one status line (`statusLine`). The face reads the live run; the builders are
 * simBridge.ts's, the pins simViewerPrefs.ts's. The expand button of the header
 * opens the run inspector (SimInspector.tsx, R-SIM-105, R-SIM-106), a card beside
 * the panel; the board button beside it opens the I/O board (`SimBoard` of
 * simBoardDevices.tsx, R-SIM-110..115) in the same slot, one of the two at a time
 * (R-SIM-119, P-2026-10-03-2000); while a run exists the panel also mounts the canvas layer
 * (SimCanvasLayer.tsx, R-SIM-107, R-SIM-109). All are rendered here, siblings of
 * the panel in the editor, so they hide with its tab as the panel does.
 *
 * The board's clocks belong to the run, not to the card (R-SIM-135,
 * P-2026-10-04-1625): this panel owns them (simBoardClock.ts `createClocks`), one
 * set per model, so they tick with the board closed; the card shows and toggles
 * them. A run seen Running for the first time switches the auto-start clocks on
 * (R-SIM-134); collapsing the panel, an edit of the board and the run's changes
 * switch them off as the card did.
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

import { Dispatch, ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { connect, useSelector } from 'react-redux';
import { Defaults, DState, DUser, LPointerTargetable, store } from '../../../joiner';
import { buildEvalContext } from '../../../jjscript';
import { configAt, getSimPolicy, getSimRun, MAX_PLAY_STEPS, setSimPolicy, simClear, simReset, simSetPending, simSetView } from './simRunState';
import type { SimChoices } from './simRunState';
import { getSimViewerPrefs, MAX_SIM_PINS, useSimViewerPrefsVersion } from './simViewerPrefs';
import {
    PANEL_PROFILE_IDS, PROFILE_KEY, ROLE_SPECS, STATE_ATTRIBUTES_SPEC, boundProposalBag, boundProposalInputs, incompleteConfigurationMessage, invalidEngineRoles, missingEngineRoles,
    profileBindings, profilePatch, profileSummary, profileSummaryText, staleEventWarning, storedProfile,
} from './simRoleStatus';
import {
    acceptingMark, candidateLabel, choiceHead, collectModelObjectIds, defectsLine, defectsTitle, haltMessage, haltTitle, inputAsks, inputLabel, inputOffTitle,
    inputPressTitle, inputReason, makeNetModelView, markingChips, markingLine, outputLine, panelInputs, playPress, playStopLine, pressInput, pressRandom, pressStep,
    runSignature, runStatus, startRun, statusLine, stopReason, undeclaredGlobals, watchRows,
} from './simBridge';
import type { CompileDefect, InputLabel, InputPress, InputValue, SimMarkingChip, SimWatchRow, StopReason } from './simBridge';
import { inputRows } from './simInputs';
import { headedStateLine, stateHeading } from './simLabels';
import type { StateHeading } from './simLabels';
import { sketchOfMetamodel } from './metamodelSketch';
import { boundEstimate, boundEstimateSignature } from './modelMarkings';
import { eventAlphabet, netStcFromRoles, withDerivedEventRole } from '../../../model/simulation/netCompile';
import { structuralInputs } from '../../../model/simulation/netStep';
import { overlapVerdict } from '../../../model/simulation/stcFromRoles';
import { ROLE_CATALOG, roleValues } from '../../../model/simulation/roleCatalog';
import { systemProfile } from '../../../model/simulation/simProfiles';
import { IO_BOARD_KEY, decodeBoard } from '../../../model/simulation/boardCodec';
import type { MetamodelSketch, ProfileBindings } from '../../../model/simulation/profileBinder';
import type { SimProfile } from '../../../model/simulation/simProfiles';
import type { RoleOverlap } from '../../../model/simulation/stcFromRoles';
import type { Candidate, InputRead, NetRunStatus } from '../../../model/simulation/netTypes';
import type { SimEventInfo } from '../../../model/simulation/types';
import type { RoleKey, Roles } from './simRoleStatus';
import { SimRolesModal } from './SimRolesModal';
import { SimInputDialog } from './SimInputDialog';
import { SimDataModal } from './SimDataModal';
import { facePins, SimInspector } from './SimInspector';
import { SimCanvasLayer } from './SimCanvasLayer';
import { SimBoard } from './simBoardDevices';
import { autoClocks, createClocks } from './simBoardClock';
import type { Clocks } from './simBoardClock';
import { planPress } from './simBoardFace';
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

/** Play's pace (R-SIM-101, A1): one ε step every 500 ms. */
const PLAY_INTERVAL_MS = 500;

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

/**
 * The hint of a profile without state attributes (R-SIM-78, `stateAttributes` off): a guard or an action that reads or
 * assigns `.[x]` leaves the run's compile defects with a name no declaration can have, since the run reads none. The
 * state accesses there are the `'undeclared'` defects whose one-line form names the attribute (`undeclared 'x'`, with or
 * without `on <element>`, the forms `undeclaredGlobals` reads); `'declaration'` cannot arise, the key being dropped by
 * `runBag` and `modelRunBag`, and the other reasons are not about declarations. Each access is quoted as its guard or
 * action wrote it, from the defect's source. `null` when the defects name none.
 */
export function stateAccessHint(profileName: string, defects: readonly CompileDefect[]): { line: string; title: string } | null {
    const accessed: string[] = [];
    for (const d of defects) {
        if (d.reason !== 'undeclared' || d.short === undefined) continue;
        const m = /^undeclared '([^']+)'(?: on .+)?$/.exec(d.short);
        if (!m) continue;
        // A JjEL identifier is [A-Za-z_][A-Za-z0-9_]*, so the name needs no escaping.
        const written = new RegExp(`([A-Za-z_]\\w*(?:\\.[A-Za-z_]\\w*)*)\\.\\[${m[1]}\\]`).exec(d.source);
        const path = `${written ? written[1] : ''}.[${m[1]}]`;
        if (!accessed.includes(path)) accessed.push(path);
    }
    if (accessed.length === 0) return null;
    const names = `${accessed.slice(0, 4).join(', ')}${accessed.length > 4 ? ', …' : ''}`;
    return {
        line: `«${profileName}» has no state attributes: use Extended state machine.`,
        title: `The profile «${profileName}» has no state attributes, so ${names} cannot be read or assigned. `
            + `Choose Extended state machine (or a profile with state attributes) in the metamodel's Simulation roles.`,
    };
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

/** A choice waiting for the user (R-SIM-35): the input and its candidates, and the values it was given (R-SIM-88). */
interface PendingChoice {
    event: string | null;
    input: string;
    candidates: readonly Candidate[];
    values?: readonly InputValue[];
}

/** A press waiting for the values of the inputs it reads (R-SIM-88): nothing committed until the dialog confirms. */
interface AskingInputs {
    event: string | null;
    input: string;
    asks: readonly InputRead[];
    /** The values the I/O board's held devices gave (R-SIM-120): the dialog asks the rest, its confirm sends both. */
    given?: readonly InputValue[];
}

type AllProps = OwnProps & StateProps & DispatchProps;

function SimulationPanelComponent(props: AllProps): ReactElement | null {
    const {
        modelid, isModelMode, configModelId, configModelName, roleSig, optionSig, eventSig, eventClassName, staleEventWarningText, stateAttributesRaw, profileBagSig, sketchSig,
        modelName, modelStateAttributesRaw, modelDataOff, modelProfileName, modelStateHeading, modelBoardRaw,
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
    const [asking, setAsking] = useState<AskingInputs | null>(null);
    // «Last step» and its title, which lists the assignments of the step (R-SIM-71).
    const [lastStep, setLastStep] = useState<{ text: string; title: string } | null>(null);
    const [defects, setDefects] = useState<{ line: string; title: string } | null>(null);
    // The globals the Reset line finds undeclared (R-SIM-94), which lead to the model's Data dialog.
    const [undeclared, setUndeclared] = useState<string[]>([]);
    // Under a profile without state attributes the same defects lead nowhere in this model: the line says why instead.
    const [stateHint, setStateHint] = useState<{ line: string; title: string } | null>(null);
    // The model's Data dialog (M1 face), with the undeclared names it opens with.
    const [dataModal, setDataModal] = useState<{ undeclared: string[] } | null>(null);
    const [interrupted, setInterrupted] = useState(false);
    // The list of reasons under the status row, opened by the user only (R-SIM-58, R-SIM-63).
    const [reasonsOpen, setReasonsOpen] = useState(false);
    // M2 face: the preset picked in the select and not applied yet (R-SIM-79); null shows the stored profile.
    const [chosen, setChosen] = useState<string | null>(null);
    // «Configure…» opens the «Simulation roles» dialog; the declarations hint opens it on Data (R-SIM-81(3)).
    const [modal, setModal] = useState<{ onData: boolean } | null>(null);
    useEffect(() => { setChosen(null); setModal(null); }, [configModelId]);
    useEffect(() => { setDataModal(null); setUndeclared([]); setStateHint(null); }, [modelid]);
    // R-SIM-101: the model Play runs on, null when it does not; why it stopped, for the status row; the k field while typed.
    const [playing, setPlaying] = useState<string | null>(null);
    const [playNote, setPlayNote] = useState<string | null>(null);
    const [kDraft, setKDraft] = useState<string | null>(null);
    // The steps of the current Play press: written by its timer only, never read by a render.
    const playSteps = useRef(0);
    useEffect(() => { setPlaying(null); setPlayNote(null); setKDraft(null); }, [modelid]);
    // R-SIM-105: the run inspector, opened by the header's expand button.
    const [inspectorOpen, setInspectorOpen] = useState(false);
    useEffect(() => { setInspectorOpen(false); }, [modelid]);
    // R-SIM-119: the I/O board, in the inspector's slot; one of the two is open at a time.
    const [boardOpen, setBoardOpen] = useState(false);
    useEffect(() => { setBoardOpen(false); }, [modelid]);
    // R-SIM-104: the Watch rows read the pins, a viewer preference with its own channel, never the 'mark' one.
    const prefsVersion = useSimViewerPrefsVersion();

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
    // «Custom» is bound against nothing: no proposals, no Apply (D7); a user profile is, as in the dialog (profileBindings).
    // profileBag carries a kept Node or Transition into the roles that depend on it (S6).
    const bindings: ProfileBindings | null = useMemo(
        () => profileBindings(selected, sketch, profileBag),
        [selected, sketch, profileBag],
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
    // The verdict with the S11a verdicts, the dialog's pill's (profileVerdict, P-2026-09-28-0140).
    const summary = useMemo(
        () => profileSummary(selected, profileBag, bindings, largestMarking, sketch),
        [selected, profileBag, bindings, largestMarking, sketch],
    );

    // R-SIM-5: the run-state is per model. Clearing on modelid change and on
    // unmount keeps the flags from surviving into another model of the session.
    // R-SIM-13: the cleanup captures the modelid of its own render, so it clears
    // that model's run only.
    // The open choice list goes with it from the canvas (S15 slice A2).
    useEffect(() => () => { simSetPending(modelid, null); simClear(modelid); }, [modelid]);

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
        setPlaying(null);
        setPlayNote(null);
        setPending(null);
        setAsking(null);
        simSetPending(modelid, null);
        setLastStep(null);
        setDefects(null);
        setUndeclared([]);
        setStateHint(null);
        setRunError(null);
        setRunWarning(null);
        setInterrupted(true);
        setReasonsOpen(false);
        setTick(t => t + 1);
    }, [liveSignature, modelid]);

    // R-SIM-135: the clocks of this model's board live with the panel, board open or closed, made per model and disposed
    // with it. A tick reads the run from the store and this render's press through `clockLatest`; the open card leaves
    // the values it holds in `clockHeld` (R-SIM-120); the card shows and toggles the clocks.
    const [, setClockVersion] = useState(0);
    const clocksRef = useRef<Clocks | null>(null);
    const clockHeld = useRef<readonly InputValue[]>([]);
    const clockLatest = useRef<{ waiting: boolean; tick: (event: string) => void }>({ waiting: false, tick: () => undefined });
    useEffect(() => {
        const clocks = createClocks({
            run: () => getSimRun(modelid),
            waiting: () => clockLatest.current.waiting,
            press: event => clockLatest.current.tick(event),
            changed: () => setClockVersion(v => v + 1),
        });
        clocksRef.current = clocks;
        return () => { clocks.dispose(); clocksRef.current = null; };
    }, [modelid]);
    // A new run (Reset), none (Stop, the interruption) or an ended one switches the clocks off now, and a run seen Running
    // for the first time switches the auto clocks on (R-SIM-134). Collapsed, every clock goes off: the input dialog and
    // the list a tick may open are drawn only by the open panel.
    useEffect(() => {
        const clocks = clocksRef.current;
        if (!clocks) return;
        if (!open) clocks.stopAll('panel');
        else clocks.arm?.(() => autoClocks(decodeBoard(modelBoardRaw).devices));
    }, [run, open]);
    // An edit of the board can remove, rebind or re-time a clock: every clock goes off, until Reset or the hand.
    useEffect(() => { clocksRef.current?.stopAll('board'); }, [modelBoardRaw]);

    // Status, enabled inputs and halt line from the Petri core (R-SIM-29), and why
    // an input has no candidate (R-SIM-58..60): computed here, once per panel
    // action, never in the render body and never on the version (report §3.4).
    const view = useMemo(() => {
        if (!isModelMode || !rolesComplete) return null;
        const r = getSimRun(modelid);
        if (!r) {
            return {
                status: 'Not started' as NetRunStatus, inputs: panelInputs('Not started', null), halt: null as { line: string; title: string } | null,
                reason: null as StopReason | null, noCandidate: new Map<string | null, string>(), asks: new Map<string | null, string>(),
                watch: [] as SimWatchRow[], chips: [] as SimMarkingChip[], markingTitle: null as string | null,
                accepting: null as 'accepting' | null, output: null as { line: string; title: string } | null,
                step: 0, seed: undefined as number | undefined,
            };
        }
        // A run waiting for an input is Running, not Deadlock (R-SIM-88).
        const status = runStatus(r);
        const lookup: any = (store.getState() as any).idlookup ?? {};
        const inputs = panelInputs(status, structuralInputs(r.net, r.config.state));
        const label: InputLabel = e => (e === null ? 'ε' : events.find(x => x.id === e)?.label ?? e);
        // R-SIM-60: a button that is on while its input has no candidate says why in its title.
        const noCandidate = new Map<string | null, string>();
        // R-SIM-88: a button whose press reads an input names it in its title.
        const asks = new Map<string | null, string>();
        // R-SIM-90: every Guard attribute, decoded from the bag's key.
        const guards = roleValues(roles.simGuard);
        if (status === 'Running') {
            // R-SIM-104: an event that is off says why in its title too, so every event is asked, not only the enabled ones.
            for (const e of [...(inputs.epsilon ? [null] : []), ...events.map(x => x.id)]) {
                const why = inputReason(r, e, lookup, label, guards);
                if (why) noCandidate.set(e, why.full);
                const read = inputAsks(r, e);
                if (read.length > 0) asks.set(e, read.map(a => inputLabel(a, r.net, lookup)).join(', '));
            }
        }
        // The halt names elements, never ids; the action that stopped the run is in its title only (R-SIM-62, R-SIM-70).
        const features = { actions: roleValues(roles.simAction), entries: roleValues(roles.simEntry), exits: roleValues(roles.simExit) };
        // R-SIM-104: the face reads the live run; the changes are the last step's, against the σ before it.
        const step = r.trace?.length ?? 0;
        const prev = step > 0 ? configAt(r, step - 1)?.state ?? null : null;
        const output = outputLine(r.config.state, r.net, lookup);
        // Four rows at most, Moore's output among them: the globals by default, an instance's attribute once pinned.
        const watch = watchRows(r.net, r.config.state, prev, facePins(getSimViewerPrefs(modelid).pins, r.net.attributes), lookup,
            step > 0 ? r.trace?.[step - 1]?.inputs ?? [] : []).slice(0, MAX_SIM_PINS - (output ? 1 : 0));
        return {
            status,
            inputs,
            halt: r.halt ? { line: haltMessage(r.halt, lookup, features), title: haltTitle(r.halt, lookup, features, r.net) } : null,
            reason: status === 'Deadlock' ? stopReason(r, lookup, label, guards) : null,
            noCandidate,
            asks,
            // The run's σ for the audience, from Reset to Stop; a halt keeps the σ it halted on (R-SIM-82, G3), as rows
            // and chips (R-SIM-104); the marking line stays the title of the chips, so its readers change a selector only.
            watch,
            chips: markingChips(r.config.state, lookup),
            markingTitle: markingLine(r.config.state, r.net, lookup).title,
            // R-SIM-91, R-SIM-92: the accepting mark of the status row, and Moore's output, a Watch row from Reset to Stop or never.
            accepting: acceptingMark(r.net, r.config.state),
            output,
            step,
            seed: r.seed,
        };
        // tick is the real input of this memo: the run changes only through this panel; prefsVersion re-reads the pins.
    }, [isModelMode, rolesComplete, modelid, tick, prefsVersion, events, roles.simGuard, roles.simAction, roles.simEntry, roles.simExit]);

    const onReset = useCallback((): void => {
        const lookup: any = (store.getState() as any).idlookup ?? {};
        setPlaying(null);
        setPlayNote(null);
        setPending(null);
        setAsking(null);
        simSetPending(modelid, null);
        setLastStep(null);
        setDefects(null);
        setUndeclared([]);
        setStateHint(null);
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
        // The globals no declaration has lead to the model's Data dialog (R-SIM-94), unless the profile turns the declarations off.
        setUndeclared(modelDataOff ? [] : undeclaredGlobals(started.compileDefects ?? [], lookup, modelid));
        // ... and then the hint says why there is nothing to declare them in, and where to get it (P-2026-10-03-1420).
        setStateHint(modelDataOff ? stateAccessHint(modelProfileName, started.compileDefects ?? []) : null);
        // The run's seed in the Reset line's title only (R-SIM-100): no visible line.
        setLastStep({ text: 'Reset', title: `Reset\nseed ${started.run.seed}` });
        setTick(t => t + 1);
    }, [modelid, roles, configModelId, modelDataOff, modelProfileName]);

    const onStop = useCallback((): void => {
        setPlaying(null);
        setPlayNote(null);
        setRunError(null);
        setRunWarning(null);
        setPending(null);
        setAsking(null);
        simSetPending(modelid, null);
        setLastStep(null);
        setDefects(null);
        setUndeclared([]);
        setStateHint(null);
        setInterrupted(false);
        setReasonsOpen(false);
        simClear(modelid);
        setTick(t => t + 1);
    }, [modelid]);

    /**
     * The outcome of one press, a hand's or Play's (R-SIM-35, R-SIM-36): the
     * input dialog, the list, «Last step», as the bridge gives them back.
     */
    const show = useCallback((pressed: InputPress, event: string | null, input: string, values?: readonly InputValue[]): void => {
        // The press reads inputs (R-SIM-88): the dialog asks them; nothing was committed, the lines stay.
        if (pressed.asks) {
            setPending(null);
            simSetPending(modelid, null);
            setAsking({ event, input, asks: pressed.asks });
            return;
        }
        setAsking(null);
        setPending(pressed.pending ? { event, input, candidates: pressed.pending, values } : null);
        // The canvas marks the list's candidates while it is open (S15 slice A2); a step that opens none closes it.
        simSetPending(modelid, pressed.pending ? pressed.pending.map(c => c.transition) : null);
        if (pressed.lastStep !== null) setLastStep({ text: pressed.lastStep, title: pressed.lastStepTitle ?? pressed.lastStep });
        setReasonsOpen(false);
        setTick(t => t + 1);
    }, [modelid]);

    /**
     * One input by hand: `event` an event instance id, `null` for ε; `selector`
     * the transition the user chose from the list; `drawFrom` the ε list Random
     * draws among (R-SIM-100). Step reads the model's policy, so under Random no
     * ε list opens (R-SIM-101); a hand press stops Play. The bridge commits the
     * step and gives back the lines to show. `keepPlay` is a Clock's tick
     * (R-SIM-122): a press from the environment, not the hand, so Play goes on.
     */
    const fire = useCallback((event: string | null, selector?: string, values?: readonly InputValue[], drawFrom?: readonly Candidate[], keepPlay?: boolean): void => {
        const lookup: any = (store.getState() as any).idlookup ?? {};
        const input = event === null ? 'ε' : (events.find(e => e.id === event)?.label ?? event);
        if (!keepPlay) {
            setPlaying(null);
            setPlayNote(null);
        }
        const pressed = drawFrom
            ? pressRandom(modelid, drawFrom, lookup, values)
            : event === null && selector === undefined
                ? pressStep(modelid, lookup, values)
                : pressInput(modelid, event, selector, lookup, input, values);
        show(pressed, event, input, values);
    }, [modelid, events, show]);

    const onStep = useCallback((): void => { fire(null); }, [fire]);

    /** Play and Pause (R-SIM-101): Play starts a new count of k steps; Pause stops the timer, the run as it is. */
    const onPlay = useCallback((): void => {
        setPlayNote(null);
        if (playing === modelid) {
            setPlaying(null);
            return;
        }
        playSteps.current = 0;
        setPlaying(modelid);
    }, [playing, modelid]);

    // R-SIM-101: Play, a setTimeout chain, the first tick at the press. Each tick reads the run and the policy from
    // the store (playPress), never this component's state, so Stop, Reset, an interruption or a change of the
    // Choices row reaches the next tick; the cleanup clears the timer when Play stops, the model changes or the pill
    // unmounts. `show` changes with the model only, as this effect does.
    useEffect(() => {
        if (playing === null || playing !== modelid) return undefined;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const tick = (): void => {
            const r = playPress(modelid, (store.getState() as any).idlookup ?? {}, playSteps.current);
            playSteps.current = r.steps;
            if (r.press) show(r.press, null, 'ε');
            if (r.stop === null) {
                timer = setTimeout(tick, PLAY_INTERVAL_MS);
                return;
            }
            setPlaying(null);
            setPlayNote(playStopLine(r.stop, r.steps));
        };
        tick();
        return () => { if (timer !== undefined) clearTimeout(timer); };
    }, [playing, modelid, show]);

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
                    <span className={`sim-panel__badge sim-panel__badge--${summary.status === 'notCheckable' ? 'not-checkable' : summary.status}`}>
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
                {staleEventWarningText && (
                    <div className="sim-panel__hint sim-panel__hint--warning">{staleEventWarningText}</div>
                )}
            </div>
        );
    };

    const status: NetRunStatus | null = view?.status ?? null;
    const reason: StopReason | null = view?.reason ?? null;
    const policy = getSimPolicy(modelid);
    const isPlaying = playing === modelid;
    /** A button's title, and why its input has no candidate when it is on without one (R-SIM-60); the board's devices say the same. */
    const inputTitle = (base: string, event: string | null): string => inputPressTitle(base, view?.noCandidate.get(event), view?.asks.get(event));
    /** An event button that is off says why in its title (R-SIM-104): the run's reason while it runs, its status otherwise. */
    const offTitle = (base: string, event: string): string => inputOffTitle(base, view?.noCandidate.get(event), status);
    /** Closing the inspector, or the panel, shows the live step again (R-SIM-106): no past step is left on the canvas unsaid. */
    const closeInspector = (): void => {
        setInspectorOpen(false);
        simSetView(modelid, null);
    };
    /**
     * R-SIM-119: the board and the inspector share one slot. Opening one closes the other and keeps the step shown, so a
     * past step chosen in the inspector is read on the board's outputs; closing the last one returns to live.
     */
    const openInspector = (): void => {
        setBoardOpen(false);
        setInspectorOpen(true);
    };
    const openBoard = (): void => {
        setInspectorOpen(false);
        setBoardOpen(true);
    };
    const closeBoard = (): void => {
        setBoardOpen(false);
        simSetView(modelid, null);
    };
    /** The input dialog for a board press: the inputs its held devices leave unanswered, their values carried (R-SIM-120). */
    const askInputs = (event: string, asks: readonly InputRead[], given: readonly InputValue[]): void => {
        setPending(null);
        simSetPending(modelid, null);
        setAsking({ event, input: labelOf(event), asks, given });
    };
    /** The label of an input, the panel's: `ε`, or the event's. */
    const labelOf: InputLabel = e => (e === null ? 'ε' : events.find(x => x.id === e)?.label ?? e);
    // R-SIM-135: a clock's tick is the board's press of its event, the values the open card holds answering its asks and
    // the dialog the rest, sent as a press that leaves Play running (R-SIM-122 decision 6); dropped while a press waits.
    clockLatest.current = {
        waiting: asking !== null || pending !== null,
        tick: event => {
            const plan = planPress(getSimRun(modelid), event, clockHeld.current);
            if (plan.kind === 'fire') fire(plan.event, undefined, plan.values, undefined, true);
            else askInputs(plan.event, plan.asks, plan.given);
        },
    };
    // R-SIM-107, R-SIM-109: the canvas layer, while a run of this model exists, whether the panel is open or closed.
    const canvasLayer = isModelMode && rolesComplete && getSimRun(modelid) ? <SimCanvasLayer modelId={modelid} /> : null;

    if (!open) {
        return (
            <>
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
                {canvasLayer}
            </>
        );
    }

    const lookupNow: any = (store.getState() as any).idlookup ?? {};
    const head = pending ? choiceHead(pending.input) : null;
    // R-SIM-104: the one status line under the buttons, `step n · last step`, while a run exists. The seed is in its
    // title only, as R-SIM-100 had it (the chat's visual check, P-2026-10-03-0120): on the line it cut the last step.
    const shownLine = run && view ? statusLine(view.step, undefined, lastStep) : null;
    const line = shownLine && view?.seed !== undefined && !shownLine.title.includes(`seed ${view.seed}`)
        ? { ...shownLine, title: `${shownLine.title}\nseed ${view.seed}` }
        : shownLine;
    const watching = (view?.watch.length ?? 0) > 0 || !!view?.output;

    return (
        <>
        <div className="sim-panel sim-panel--open">
            <div className="sim-panel__header">
                <i className="bi bi-play-circle" />
                <span className="sim-panel__title">Simulation</span>
                {/* R-SIM-114, R-SIM-119: the I/O board, in the inspector's slot; the M1 face only. */}
                {isModelMode && rolesComplete && (
                    <button
                        type="button"
                        className="sim-panel__expand"
                        title={boardOpen ? 'Close the I/O board' : 'Open the I/O board: the machine\'s inputs and outputs'}
                        aria-pressed={boardOpen}
                        onClick={() => (boardOpen ? closeBoard() : openBoard())}
                    >
                        <i className="bi bi-toggles" />
                    </button>
                )}
                {/* R-SIM-105: the run inspector, a card beside the panel; the M1 face only. */}
                {isModelMode && rolesComplete && (
                    <button
                        type="button"
                        className="sim-panel__expand"
                        title={inspectorOpen ? 'Close the run inspector' : 'Open the run inspector: the whole state and the trace'}
                        aria-pressed={inspectorOpen}
                        onClick={() => (inspectorOpen ? closeInspector() : openInspector())}
                    >
                        <i className={`bi ${inspectorOpen ? 'bi-arrows-angle-contract' : 'bi-arrows-angle-expand'}`} />
                    </button>
                )}
                <button
                    type="button"
                    className="sim-panel__collapse"
                    title="Collapse"
                    onClick={() => { setOpen(false); if (inspectorOpen) closeInspector(); if (boardOpen) closeBoard(); }}
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
                        {/* The model's data (R-SIM-94): first, so it never moves with the lines below it; absent when the
                            profile turns the declarations off, since the run would not read them. */}
                        {!modelDataOff && (
                            <button
                                type="button"
                                className="sim-panel__configure"
                                aria-haspopup="dialog"
                                title="The globals of this model, read as model.[name]"
                                onClick={() => setDataModal({ undeclared: [] })}
                            >
                                <i className="bi bi-database" />
                                {/* R-SIM-103: «Data» collided with the Data Manager; the label only, every identifier kept. */}
                                <span>State…</span>
                            </button>
                        )}
                        {dataModal && (
                            <SimDataModal
                                modelId={modelid}
                                modelName={modelName}
                                stateAttributesRaw={modelStateAttributesRaw}
                                undeclared={dataModal.undeclared}
                                onClose={() => setDataModal(null)}
                                onApplied={() => setDataModal(null)}
                            />
                        )}
                        {/* The run policy (R-SIM-101): how Step and Play resolve an ε choice, and Play's step limit k. One
                            row, always there, above the lines and the buttons, so Step keeps its top. */}
                        <div className="sim-panel__row sim-panel__policy">
                            <span className="sim-panel__label">Choices</span>
                            <select
                                className="sim-panel__select"
                                aria-label="Choices"
                                title="How Step and Play resolve a choice among ε transitions: Ask opens the list, Random draws one"
                                value={policy.choices}
                                onChange={e => { setSimPolicy(modelid, { choices: e.target.value as SimChoices }); setTick(t => t + 1); }}
                            >
                                <option value="ask">Ask</option>
                                <option value="random">Random</option>
                            </select>
                            <input
                                type="number"
                                className="sim-panel__input"
                                aria-label="Play step limit"
                                title={`Play stops after this many steps, 1 to ${MAX_PLAY_STEPS}`}
                                min={1}
                                max={MAX_PLAY_STEPS}
                                step={1}
                                value={kDraft ?? String(policy.k)}
                                onChange={e => {
                                    const text = e.target.value;
                                    const k = Number(text);
                                    setKDraft(text);
                                    if (text.trim() !== '' && Number.isInteger(k) && k >= 1 && k <= MAX_PLAY_STEPS) setSimPolicy(modelid, { k });
                                }}
                                onBlur={() => setKDraft(null)}
                            />
                        </div>
                        {/* The lines that add to the others sit above the buttons: the panel is anchored at the
                            bottom and grows upward, so they never move the buttons (R-SIM-65, R-SIM-66). One row
                            each, the full text in the title (R-SIM-63). The choice list opens above them too, so Step
                            stays where it is (R-SIM-82, G8). Then the state, right above the buttons, for the run's
                            whole lifetime (R-SIM-104): Watch, with Moore's output as a row (R-SIM-92), Marking, Events. */}
                        {pending && run && head && (
                            <>
                                <div className="sim-panel__section">{head.heading} (<span className="sim-panel__section-input">{head.input}</span>)</div>
                                <div className="sim-panel__hint sim-panel__hint--line" title={head.subline}>{head.subline}</div>
                                <div className="sim-panel__choices">
                                    {pending.candidates.map(c => (
                                        <button
                                            type="button"
                                            className="sim-panel__choice"
                                            key={c.transition}
                                            onClick={() => fire(pending.event, c.transition, pending.values)}
                                        >
                                            <span>{candidateLabel(run.net, c.transition, lookupNow)}</span>
                                            {c.unsafe && (
                                                <span className="sim-panel__choice-note">{`exceeds bound ${run.net.bound}`}</span>
                                            )}
                                        </button>
                                    ))}
                                    {/* Cancel, and Random right of it on an ε list (R-SIM-100), in one row of Cancel's height. */}
                                    <div className="sim-panel__choice-actions">
                                        <button type="button" className="sim-panel__cancel" onClick={() => { setPending(null); simSetPending(modelid, null); }}>
                                            Cancel
                                        </button>
                                        {pending.event === null && (
                                            <button
                                                type="button"
                                                className="sim-panel__random"
                                                title="Fire one of these transitions, drawn at random"
                                                onClick={() => fire(null, undefined, pending.values, pending.candidates)}
                                            >
                                                <i className="bi bi-shuffle" />
                                                <span>Random</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                        {/* The input dialog (R-SIM-88) is portaled onto the body: nothing is added here, nothing moves. */}
                        {asking && run && (
                            <SimInputDialog
                                press={asking.event === null ? 'Step (ε)' : asking.input}
                                action={asking.event === null ? 'Step' : `Fire ${asking.input}`}
                                rows={inputRows(asking.asks, run.net, lookupNow)}
                                onCancel={() => setAsking(null)}
                                onConfirm={values => { const a = asking; setAsking(null); fire(a.event, undefined, a.given ? [...a.given, ...values] : values); }}
                            />
                        )}
                        {runWarning && <div className="sim-panel__hint sim-panel__hint--warning sim-panel__hint--line" title={runWarning}>{runWarning}</div>}
                        {defects && (
                            <div className="sim-panel__hint sim-panel__hint--warning sim-panel__hint--line" title={defects.title}>{defects.line}</div>
                        )}
                        {undeclared.length > 0 && (
                            <div className="sim-panel__hint sim-panel__hint--line" title={`Undeclared: ${undeclared.join(', ')}. Declare them in the model's state.`}>
                                {`Undeclared: ${undeclared.join(', ')}. `}
                                <button type="button" className="sim-panel__hint-action" onClick={() => setDataModal({ undeclared })}>Declare in State…</button>
                            </div>
                        )}
                        {/* The remedy is the point of this line, so it wraps into the halt line's two-row slot instead of
                            ending in an ellipsis; the slot sits above the buttons, so none of them moves. */}
                        {stateHint && <div className="sim-panel__hint sim-panel__hint--halt" title={stateHint.title}>{stateHint.line}</div>}
                        {view?.halt && <div className="sim-panel__hint sim-panel__hint--error sim-panel__hint--line sim-panel__hint--halt" title={view.halt.title}>{view.halt.line}</div>}
                        {/* R-SIM-104: up to four pinned attributes, globals first by default; a range draws its domain bar,
                            DEFINE and IVAR say their kind, a value the last step changed reads before → after. */}
                        {run && watching && (
                            <>
                                <div className="sim-panel__section">Watch</div>
                                <div className="sim-panel__watch">
                                    {view?.watch.map(w => (
                                        <WatchRow key={`${w.element}\u0000${w.attr}\u0000${w.space}`} row={w} />
                                    ))}
                                    {view?.output && (
                                        <div className="sim-panel__watch-row" title={view.output.title}>
                                            <span className="sim-panel__watch-name">output</span>
                                            <span className="sim-panel__watch-value">{view.output.line.replace(/^Output: /, '')}</span>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                        {/* R-SIM-104: one chip per marked place, `×n` from two tokens; the marking line is the title. */}
                        {run && view && (
                            <>
                                <div className="sim-panel__section">{modelStateHeading}</div>
                                <div className="sim-panel__chips" title={view.markingTitle === null ? undefined : headedStateLine(view.markingTitle, modelStateHeading)}>
                                    {view.chips.length === 0
                                        ? <span className="sim-panel__marking-chip sim-panel__marking-chip--empty">∅</span>
                                        : view.chips.map(c => <span className="sim-panel__marking-chip" key={c.place}>{c.text}</span>)}
                                </div>
                            </>
                        )}
                        {/* Events above the buttons (R-SIM-104): an event that is off says why in its title, and a press that
                            asks an input carries the input chip. */}
                        {eventRole && (
                            <>
                                <div className="sim-panel__section">Events</div>
                                {events.length === 0 ? (
                                    <div className="sim-panel__hint">No event instances in the model.</div>
                                ) : (
                                    <div className="sim-panel__events">
                                        {events.map(e => {
                                            const on = !!view?.inputs.events.has(e.id);
                                            const asks = view?.asks.get(e.id);
                                            return (
                                                <button
                                                    type="button"
                                                    className="sim-panel__event"
                                                    key={e.id}
                                                    title={on ? inputTitle(`Fire ${e.label}`, e.id) : offTitle(`Fire ${e.label}`, e.id)}
                                                    onClick={() => fire(e.id)}
                                                    disabled={!on}
                                                >
                                                    <i className="bi bi-chevron-right" />
                                                    <span>{e.label}</span>
                                                    {on && asks && <span className="sim-state-chip sim-state-chip--ivar sim-panel__event-chip" title={`Asks: ${asks}`}>IVAR</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
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
                            {/* Play (R-SIM-101): on while the run is Running, ε off included, so it can say it waits for an event. */}
                            <button
                                type="button"
                                className="sim-panel__btn"
                                title={isPlaying ? 'Pause' : 'Play'}
                                onClick={onPlay}
                                disabled={!isPlaying && status !== 'Running'}
                            >
                                <i className={`bi ${isPlaying ? 'bi-pause-fill' : 'bi-fast-forward-fill'}`} />
                            </button>
                            <button type="button" className="sim-panel__btn" title="Stop" onClick={onStop}>
                                <i className="bi bi-stop-fill" />
                            </button>
                        </div>
                        {/* In Deadlock the row says why, on its one line, and opens the list per input (R-SIM-58). The one
                            status line of R-SIM-104: the pill, then `step n · last step`, the seed in the title; the R-SIM-66 slot
                            is its last part, so a refused Reset or the interruption takes the place of the last step. */}
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
                            <span className={`sim-panel__status-pill sim-panel__status-pill--${(status ?? 'not started').toLowerCase().replace(' ', '-')}`}>
                                <span className={`sim-panel__dot sim-panel__dot--${(status ?? 'not started').toLowerCase().replace(' ', '-')}`} />
                                <span className="sim-panel__status-text">{status}</span>
                                {/* R-SIM-91: on the row's one line, in the status text's style; the run goes on. */}
                                {view?.accepting && <span className="sim-panel__status-text sim-panel__status-accepting">{`· ${view.accepting}`}</span>}
                            </span>
                            {/* R-SIM-101: why Play stopped while the run goes on; a status, a list or no run say it themselves. */}
                            {playNote && status === 'Running' && <span className="sim-panel__status-reason" title={playNote}>{`· ${playNote}`}</span>}
                            {reason && <span className="sim-panel__status-reason">{`· ${reason.line}`}</span>}
                            {runError ? (
                                <span className="sim-panel__status-line sim-panel__status-line--error" title={runError}>{`· ${runError}`}</span>
                            ) : interrupted ? (
                                <span className="sim-panel__status-line sim-panel__status-line--warning" title="Run interrupted: the model changed. Reset to run again.">
                                    · Run interrupted: the model changed. Reset to run again.
                                </span>
                            ) : line && (
                                <span className="sim-panel__status-line" title={line.title}>{`· ${line.line}`}</span>
                            )}
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
        {isModelMode && rolesComplete && inspectorOpen && (
            <SimInspector
                modelId={modelid} modelName={modelName} inputLabel={labelOf} stateHint={stateHint} markingHeading={modelStateHeading} onClose={closeInspector}
            />
        )}
        {isModelMode && rolesComplete && boardOpen && view && (
            <SimBoard
                modelId={modelid}
                modelName={modelName}
                configModelId={configModelId}
                boardRaw={modelBoardRaw}
                inputs={{ status, eventsOn: view.inputs.events, noCandidate: view.noCandidate, asks: view.asks }}
                statusLine={line}
                contextKey={eventSig}
                fire={fire}
                ask={askInputs}
                clocks={clocksRef.current}
                clockHeld={clockHeld}
                onClose={closeBoard}
            />
        )}
        {canvasLayer}
        </>
    );
}

/**
 * One Watch row (R-SIM-104), from `watchRows`: the name, italic for a DEFINE; the kind chip of a DEFINE or an
 * IVAR; a range's domain bar; the value, `before → after` and the run's cyan when the last step changed it.
 */
function WatchRow({ row }: { row: SimWatchRow }): ReactElement {
    const shown = row.value === null ? '—' : String(row.value);
    const text = row.changed ? `${row.before === null ? '—' : String(row.before)} → ${shown}` : shown;
    const range = row.domain?.kind === 'range' ? row.domain : null;
    const n = typeof row.value === 'number' ? row.value : null;
    const out = range !== null && n !== null && (n < range.min || n > range.max);
    const fill = range !== null && n !== null && range.max > range.min ? Math.min(1, Math.max(0, (n - range.min) / (range.max - range.min))) : 0;
    const title = `${row.name}${row.space === 'presentation' ? ' (node)' : ''} · ${row.kind}`
        + `${range ? ` · ${range.min}..${range.max}` : ''} = ${text}${row.kind === 'IVAR' ? ' (given at the step)' : ''}`;
    return (
        <div
            className={`sim-panel__watch-row${row.space === 'presentation' ? ' sim-panel__watch-row--presentation' : ''}`}
            title={title}
        >
            <span className={`sim-panel__watch-name${row.kind === 'DEFINE' ? ' sim-panel__watch-name--define' : ''}`}>{row.name}</span>
            {row.kind !== 'VAR' && <span className={`sim-state-chip sim-state-chip--${row.kind.toLowerCase()}`}>{row.kind}</span>}
            {range && (
                <span className={`sim-panel__watch-bar${out ? ' sim-panel__watch-bar--out' : ''}`} aria-hidden="true">
                    <span className="sim-panel__watch-fill" style={{ width: `${Math.round(fill * 100)}%` }} />
                </span>
            )}
            <span className={`sim-panel__watch-value${row.changed ? ' sim-panel__watch-value--changed' : ''}`}>{text}</span>
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
     * JSON of the role values (the twenty-seven `sim*` keys of ROLE_SPECS, `simEvent`
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
     * The M2 face's warning when a stored `simEvent` (pre R-SIM-38) differs from
     * the class the Trigger now derives (S7); `null` when there is nothing to warn about.
     */
    staleEventWarningText: string | null;
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
    /** The M1 model's name, for its Data dialog; '' on the M2 face. */
    modelName: string;
    /**
     * The raw `simStateAttributes` string of the M1 model's own bag (R-SIM-94), `null` when unset or on the
     * M2 face: a primitive of its own, as `stateAttributesRaw` is.
     */
    modelStateAttributesRaw: string | null;
    /** The metamodel's profile turns the declarations off (R-SIM-78): the run reads no Data, the M1 face offers none. */
    modelDataOff: boolean;
    /** The name of that profile, for the hint a run under it shows; '' on the M2 face. */
    modelProfileName: string;
    /** The heading of the run's marked places under that profile: `Marking` for Petri, `Configuration` for control flow. */
    modelStateHeading: StateHeading;
    /** The raw `ioBoard` string of the M1 model's own bag (R-SIM-115), `null` when unset or on the M2 face: a primitive. */
    modelBoardRaw: string | null;
}

interface DispatchProps { }

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const lookup: any = (state as any).idlookup ?? {};
    const dModel: any = lookup[ownProps.modelid];
    const configModelId: string | null = ownProps.isModelMode
        ? (typeof dModel?.instanceof === 'string' ? dModel.instanceof : null)
        : (dModel ? ownProps.modelid : null);

    // The derived bag (R-SIM-38): simEvent is the Trigger's type, a stale value in the bag ignored.
    const rawState: any = (configModelId ? lookup[configModelId]?._state : null) ?? {};
    const bag: any = withDerivedEventRole(rawState, lookup);
    const roles: Roles = {};
    for (const key of ROLE_KEYS) {
        const value = bag[key];
        if (typeof value === 'string' && value) roles[key] = value;
    }
    const nameOf = (id: string): string => lookup[id]?.name || id;

    return {
        configModelId,
        configModelName: (configModelId && lookup[configModelId]?.name) || '',
        roleSig: JSON.stringify(roles),
        optionSig: !ownProps.isModelMode && configModelId
            ? JSON.stringify(collectMetaOptions(lookup, configModelId))
            : '',
        eventSig: ownProps.isModelMode ? eventSigOf(lookup, ownProps.modelid, roles) : '',
        eventClassName: roles.simEvent ? nameOf(roles.simEvent) : '',
        staleEventWarningText: !ownProps.isModelMode
            ? staleEventWarning(typeof rawState.simEvent === 'string' && rawState.simEvent ? rawState.simEvent : undefined, roles.simEvent, nameOf)
            : null,
        stateAttributesRaw: !ownProps.isModelMode && typeof bag[STATE_ATTRIBUTES_SPEC.key] === 'string' ? bag[STATE_ATTRIBUTES_SPEC.key] : null,
        profileBagSig: !ownProps.isModelMode && configModelId ? profileBagSigOf(lookup[configModelId]?._state ?? {}) : '',
        sketchSig: !ownProps.isModelMode && configModelId ? JSON.stringify(sketchOfMetamodel(lookup, configModelId)) : '',
        modelName: ownProps.isModelMode ? String(dModel?.name ?? '') : '',
        modelStateAttributesRaw: ownProps.isModelMode && typeof dModel?._state?.[STATE_ATTRIBUTES_SPEC.key] === 'string'
            ? dModel._state[STATE_ATTRIBUTES_SPEC.key]
            : null,
        modelDataOff: ownProps.isModelMode && storedProfile(rawState).profile.modes.stateAttributes.mode === 'off',
        modelProfileName: ownProps.isModelMode ? storedProfile(rawState).profile.name : '',
        modelStateHeading: ownProps.isModelMode ? stateHeading(storedProfile(rawState).profile) : 'Marking',
        modelBoardRaw: ownProps.isModelMode && typeof dModel?._state?.[IO_BOARD_KEY] === 'string' ? dModel._state[IO_BOARD_KEY] : null,
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
