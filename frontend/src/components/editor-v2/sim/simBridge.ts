/**
 * simBridge — from the store to a run of the Petri core, and back (step 3b, R-SIM-34..37).
 *
 * The impure side of the simulator, kept pure: every function reads the raw
 * `idlookup` it is given, and the one call that needs the joiner, the JjEL
 * context builder, is injected (`ContextBuilder`). So the rules of the bridge
 * run under the node test bench (sim/__tests__/simBridge.test.ts), which cannot
 * load the panel (the panel imports the joiner). The panel passes
 * `buildEvalContext` and the store's lookup.
 *
 * - `startRun`: at Reset, the STC from the M2 bag (`netStcFromRoles`), the net
 *   (`compileNet` over `makeNetModelView`), the JjEL context of the model with
 *   `targetMetamodelId` always set (R-SIM-37, the defect of report §8.1 of step 3
 *   must not reach the simulator), frozen once (`freezeSnapshot`), the guards
 *   compiled once per site, and the baseline signature of R-SIM-13.
 * - `pressInput`: one input of the panel, with the choice among candidates
 *   (R-SIM-35) and the commit to the store; it returns what the panel shows, so
 *   the panel never reads its lines from the version (R-SIM-36).
 * - `runSignature`: what a run depends on; a model edit that changes it
 *   interrupts the run (R-SIM-34).
 * - the texts of the panel: `haltMessage`, `candidateLabel`, `defectsLine`, and
 *   `panelInputs`, the inputs a status leaves enabled (R-SIM-29).
 *
 * Actions return no assignment until the Action lane (R-SIM-17).
 */

import type { ExecutionContext } from '../../../jjscript/types';
import type { JjelValue } from '../../../jjel/evaluator';
import { compileNet, eventAlphabet, netStcFromRoles } from '../../../model/simulation/netCompile';
import { candidates, step } from '../../../model/simulation/netStep';
import { buildGuardContext, freezeSnapshot, SimSnapshotError } from '../../../model/simulation/guardContext';
import type { SimSnapshot } from '../../../model/simulation/guardContext';
import { compileGuard, evaluateGuard } from '../../../model/simulation/guardEvaluator';
import type { CompiledGuard } from '../../../model/simulation/guardEvaluator';
import { isKindOf } from '../../../model/simulation/isKindOf';
import { objectLabel, objectReferences, objectSlotValues } from '../../../model/simulation/objectSlots';
import type {
    ActionOracle, Arc, Candidate, CompiledNet, GuardOracle, HaltReason, NetModelView, NetRunStatus, NetStc, StepOutcome,
} from '../../../model/simulation/netTypes';
import { getSimRun, simCommit } from './simRunState';
import type { SimRun } from './simRunState';

type Lookup = Record<string, any>;

// ---------------------------------------------------------------------------
// Reading the model
// ---------------------------------------------------------------------------

/**
 * DObject ids belonging to an M1 model — the equivalent of `allSubObjects` on
 * raw data. Nested objects hang off a DValue slot, so the owner is found by
 * walking `father` up to the DModel (the idiom of joiner/classes.ts:415).
 * Moved from SimulationPanel.tsx unchanged.
 */
export function collectModelObjectIds(lookup: Lookup, modelId: string): string[] {
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
 * The view the compiler reads: raw slots by feature POINTER (objectSlots.ts),
 * metaclasses with ancestry (R-SIM-8). `outgoingTransitions` and
 * `transitionTarget` belong to the committed `SimModelView` and are never called
 * by the compiler.
 */
export function makeNetModelView(lookup: Lookup, eventIdentifier?: string): NetModelView {
    return {
        exists: id => !!lookup[id],
        isInstanceOf: (id, classId) => isKindOf(lookup, id, classId),
        outgoingTransitions: () => [],
        transitionTarget: () => null,
        references: (objectId, featureId) => objectReferences(lookup, objectId, featureId),
        values: (objectId, featureId) => objectSlotValues(lookup, objectId, featureId),
        label: id => objectLabel(lookup, id, eventIdentifier),
    };
}

/**
 * A name for any element: its `name` (the instance name the canvas shows, kept
 * in sync with the identity slot), else the label of `objectLabel`, else the
 * short id.
 */
function elementName(lookup: Lookup, id: string): string {
    const name = lookup[id]?.name;
    return typeof name === 'string' && name ? name : objectLabel(lookup, id);
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

/** The JjEL context builder, `buildEvalContext` in production (jjscript/executor/commands/eval.ts). */
export type ContextBuilder = (context: ExecutionContext, opts: { extentModelId: string }) => Record<string, JjelValue>;

/**
 * The execution context of a run: the model's own metamodel, never the active
 * one nor the first of the project (`getTargetMetamodel`, jjscript/executor/utils.ts).
 * `scopeBound` makes a missing metamodel an empty context instead of a
 * fallback, so a broken model gives defective guards, not guards over another
 * metamodel.
 */
export function evalContextFor(lookup: Lookup, modelId: string, projectId: string): ExecutionContext {
    const metamodel = lookup[modelId]?.instanceof;
    return {
        projectId,
        modelId,
        level: 'M1',
        targetMetamodelId: typeof metamodel === 'string' && metamodel ? metamodel : undefined,
        scopeBound: true,
        history: [],
        variables: new Map(),
    };
}

/** Every guard of the net, compiled once per run: the text read by the `simGuard` pointer. */
function compileGuards(net: CompiledNet, stc: NetStc, lookup: Lookup): Map<string, CompiledGuard> {
    const out = new Map<string, CompiledGuard>();
    if (!stc.guard) return out;
    for (const t of net.transitions) {
        for (const site of t.guardSites) {
            if (out.has(site)) continue;
            const value = objectSlotValues(lookup, site, stc.guard)[0];
            // A value that is not a string is still a guard: its text makes it a defect, never `true`.
            out.set(site, compileGuard(value === undefined ? undefined : String(value)));
        }
    }
    return out;
}

/** The guard oracle of the core over the frozen snapshot: `self` is the site, `event` the input. */
function makeGuardOracle(snapshot: SimSnapshot, guards: ReadonlyMap<string, CompiledGuard>): GuardOracle {
    const absent = compileGuard(undefined);
    return (site, event) =>
        evaluateGuard(guards.get(site) ?? absent, buildGuardContext(snapshot, { transitionId: site }, { event }));
}

/** No assignment until the Action lane (R-SIM-17): a step moves the marking only. */
export const NO_SIM_ACTIONS: ActionOracle = () => ({ kind: 'ok', assignments: [] });

export type RunStart =
    | { readonly kind: 'started'; readonly run: SimRun }
    | { readonly kind: 'refused'; readonly reason: string };

/**
 * The run of an M1 model at Reset. `configModelId` is the metamodel whose bag
 * holds the roles. Refused when the roles do not make an STC or the snapshot
 * cannot be frozen; the overlap check of the roles stays with the panel, which
 * has the metamodel's class list.
 */
export function startRun(
    lookup: Lookup, modelId: string, configModelId: string | null, projectId: string, build: ContextBuilder,
): RunStart {
    const bag = configModelId ? lookup[configModelId]?._state : undefined;
    const stc = netStcFromRoles(bag);
    if (!stc) return { kind: 'refused', reason: 'The simulation roles are incomplete.' };
    const ids = collectModelObjectIds(lookup, modelId);
    const view = makeNetModelView(lookup, stc.eventIdentifier);
    const net = compileNet(stc, view, modelId, ids);
    const globals = build(evalContextFor(lookup, modelId, projectId), { extentModelId: modelId });
    let snapshot: SimSnapshot;
    try {
        snapshot = freezeSnapshot(globals, { id: modelId, name: String(lookup[modelId]?.name ?? '') });
    } catch (e) {
        if (e instanceof SimSnapshotError) return { kind: 'refused', reason: `The model cannot be frozen: ${e.message}.` };
        throw e;
    }
    return {
        kind: 'started',
        run: {
            net,
            config: { state: net.initial, event: null },
            halt: null,
            guards: makeGuardOracle(snapshot, compileGuards(net, stc, lookup)),
            actions: NO_SIM_ACTIONS,
            alphabet: eventAlphabet(stc, view, ids).map(e => e.id),
            signature: runSignature(lookup, modelId, configModelId),
        },
    };
}

// ---------------------------------------------------------------------------
// R-SIM-13: the signature of what a run reads
// ---------------------------------------------------------------------------

function ptrs(v: unknown): string {
    return Array.isArray(v) ? v.join(',') : '';
}

/**
 * The content a run depends on (R-SIM-34): the model itself (name, metaclass),
 * the `sim*` keys of the metamodel's bag, the model's objects with every slot,
 * and the metamodel part of `buildValidationSignature`
 * (problems/validationFreshness.ts), since guards read class and feature names.
 * Not layout, not other models: moving a node or editing another model of the
 * same metamodel leaves it unchanged (measured, report §6.2).
 */
export function runSignature(lookup: Lookup, modelId: string, configModelId: string | null): string {
    const model = lookup[modelId];
    let sig = `m${modelId}=${model?.name ?? ''},${model?.instanceof ?? ''};`;
    const bag = configModelId ? lookup[configModelId]?._state : undefined;
    if (bag && typeof bag === 'object') {
        for (const key of Object.keys(bag).filter(k => k.startsWith('sim')).sort()) sig += `${key}=${JSON.stringify(bag[key])};`;
    }
    for (const id of collectModelObjectIds(lookup, modelId)) {
        const o = lookup[id];
        sig += `o${id}=${o.instanceof ?? ''},${o.name ?? ''};`;
        for (const valueId of (Array.isArray(o.features) ? o.features : [])) {
            // JSON, not join: a value holding a comma must not pass for two values.
            sig += `v${valueId}=${JSON.stringify(lookup[valueId]?.values ?? null)};`;
        }
    }
    for (const id in lookup) {
        const raw = lookup[id];
        switch (raw?.className) {
            case 'DClass':
                sig += `c${id}=${raw.name ?? ''},${raw.abstract ?? ''},${ptrs(raw.attributes)}|${ptrs(raw.references)}|${ptrs(raw.extends)};`;
                break;
            case 'DAttribute':
                sig += `a${id}=${raw.name ?? ''},${raw.type ?? ''},${raw.lowerBound ?? ''},${raw.upperBound ?? ''};`;
                break;
            case 'DReference':
                sig += `r${id}=${raw.name ?? ''},${raw.type ?? ''},${raw.lowerBound ?? ''},${raw.upperBound ?? ''};`;
                break;
            case 'DEnumerator':
                sig += `e${id}=${raw.name ?? ''},${ptrs(raw.literals)};`;
                break;
            case 'DEnumLiteral':
                sig += `l${id}=${raw.name ?? ''};`;
                break;
            default:
                break;
        }
    }
    return sig;
}

// ---------------------------------------------------------------------------
// The panel's texts and gates
// ---------------------------------------------------------------------------

/** The halt line, by reason (R-SIM-29); cleared by Reset. */
export function haltMessage(reason: HaltReason, lookup: Lookup): string {
    switch (reason.kind) {
        case 'unsafe':
            return `Halted: unsafe. ${elementName(lookup, reason.place)} would hold ${reason.value} tokens; the bound is ${reason.bound}.`;
        case 'domain':
            return `Halted: ${reason.attr} of ${elementName(lookup, reason.element)} would be ${String(reason.value)}, outside its domain.`;
        case 'double-assignment':
            return `Halted: ${reason.attr} of ${elementName(lookup, reason.element)} is assigned twice in one step.`;
        case 'action-defect':
            return `Halted: the ${reason.site.role} action of ${elementName(lookup, reason.site.element)} failed: ${reason.detail}.`;
    }
}

function arcsText(arcs: readonly Arc[], lookup: Lookup): string {
    return arcs.map(a => (a.weight === 1 ? elementName(lookup, a.place) : `${elementName(lookup, a.place)} ×${a.weight}`)).join(', ');
}

/**
 * A transition as the choice list shows it: the name of its own element (an
 * edge, a Petri transition, or the fork/join node a fused transition is named
 * after, `node#edge`), then its preset and postset: "tCoin (Locked → Unlocked)".
 */
export function candidateLabel(net: CompiledNet, transitionId: string, lookup: Lookup): string {
    const t = net.transitions.find(x => x.id === transitionId);
    const own = elementName(lookup, transitionId.split('#')[0]);
    if (!t) return own;
    return `${own} (${arcsText(t.preset, lookup)} → ${arcsText(t.postset, lookup)})`;
}

/** The compile defects of a run in one line, the first three then a count (R-SIM-37); `null` when none. */
export function defectsLine(net: CompiledNet, lookup: Lookup): string | null {
    const defects = net.defects;
    if (defects.length === 0) return null;
    const shown = defects.slice(0, 3).map(d => `${elementName(lookup, d.element)} (${d.message})`);
    const more = defects.length > 3 ? `, and ${defects.length - 3} more` : '';
    return `${defects.length} element${defects.length === 1 ? '' : 's'} not compiled: ${shown.join('; ')}${more}.`;
}

export interface PanelInputs {
    readonly epsilon: boolean;
    readonly events: ReadonlySet<string>;
}

const NO_INPUTS: PanelInputs = { epsilon: false, events: new Set<string>() };

/** The statuses that stop the run: every input button off (R-SIM-29). */
const STOPPED: ReadonlySet<NetRunStatus> = new Set<NetRunStatus>(['Terminated', 'Deadlock', 'Halted']);

/**
 * The inputs the panel enables: the structural ones (R-SIM-16, `structuralInputs`)
 * while the run is `Running`; none without a run or in a status that stops it,
 * so a run blocked by its guards alone shows no enabled button (R-SIM-29).
 */
export function panelInputs(status: NetRunStatus, structural: PanelInputs | null): PanelInputs {
    if (structural === null || status === 'Not started' || STOPPED.has(status)) return NO_INPUTS;
    return structural;
}

// ---------------------------------------------------------------------------
// One input
// ---------------------------------------------------------------------------

export interface InputPress {
    /** More than one candidate and no selector: the list to choose from (R-SIM-35); nothing committed. */
    readonly pending: readonly Candidate[] | null;
    /** The «Last step» line of the committed step, `null` when nothing was committed. */
    readonly lastStep: string | null;
    readonly outcome: StepOutcome | null;
}

function lastStepText(outcome: StepOutcome, net: CompiledNet, lookup: Lookup, input: string): string {
    const chosen = outcome.label.selector;
    switch (outcome.kind) {
        case 'fired':
            return `${input}: ${candidateLabel(net, chosen ?? '', lookup)} fired`;
        case 'halted':
            return `${input}: ${candidateLabel(net, chosen ?? '', lookup)} halted the run`;
        case 'discard':
            return `${input}: discarded, no transition accepted it`;
        case 'quiescence':
            return `${input}: nothing to fire`;
        case 'inadmissible':
            return `${input}: refused, ${chosen ?? 'none'} is not a candidate`;
    }
}

/**
 * One input of the model's run: `event` an event instance id, `null` for ε.
 * Without a `selector` the candidates decide: none is a discard or a
 * quiescence, one fires, several come back as `pending` for the user to choose
 * (R-SIM-35). With a `selector` (the user's choice) that transition is asked
 * for. The outcome is committed to the store, and the «Last step» line comes
 * back with it whatever the version did (R-SIM-36). `input` is the label of the
 * input for that line.
 */
export function pressInput(
    modelId: string, event: string | null, selector: string | undefined, lookup: Lookup, input: string,
): InputPress {
    const run = getSimRun(modelId);
    if (!run) return { pending: null, lastStep: null, outcome: null };
    const cfg = { state: run.config.state, event };
    let chosen: string | null;
    if (selector === undefined) {
        const cs = candidates(run.net, cfg, run.guards);
        if (cs.candidates.length > 1) return { pending: cs.candidates, lastStep: null, outcome: null };
        chosen = cs.candidates[0]?.transition ?? null;
    } else {
        chosen = selector;
    }
    const outcome = step(run.net, cfg, chosen, run.guards, run.actions);
    simCommit(modelId, outcome);
    return { pending: null, lastStep: lastStepText(outcome, run.net, lookup, input), outcome };
}
