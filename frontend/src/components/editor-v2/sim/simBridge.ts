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
 * - why an input has no candidate: `inputReason` and `stopReason`, recomputed
 *   from the run and explained guard site by guard site (R-SIM-57..62).
 *
 * Actions return no assignment until lane C (R-SIM-39).
 */

import type { ExecutionContext } from '../../../jjscript/types';
import type { JjelValue } from '../../../jjel/evaluator';
import { compileNet, eventAlphabet, netStcFromRoles, withDerivedEventRole } from '../../../model/simulation/netCompile';
import { candidates, stateAccess, step } from '../../../model/simulation/netStep';
import { buildGuardContext, freezeSnapshot, SimSnapshotError, toJjelStateAccess } from '../../../model/simulation/guardContext';
import type { SimSnapshot } from '../../../model/simulation/guardContext';
import { compileGuard, evaluateGuard } from '../../../model/simulation/guardEvaluator';
import type { CompiledGuard, GuardDefectReason } from '../../../model/simulation/guardEvaluator';
import { isKindOf } from '../../../model/simulation/isKindOf';
import { objectLabel, objectReferences, objectSlotValues } from '../../../model/simulation/objectSlots';
import type {
    ActionOracle, Arc, Candidate, CandidateSet, CompiledNet, GuardOracle, HaltReason, NetModelView, NetRunStatus, NetStc,
    SimStateAccess, StepOutcome,
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

/**
 * The guard oracle of the core over the frozen snapshot: `self` is the site,
 * `event` the input, and σ the state the core hands the oracle, read through
 * the adapter over the net's places (R-SIM-30, R-SIM-43).
 */
function makeGuardOracle(snapshot: SimSnapshot, guards: ReadonlyMap<string, CompiledGuard>, places: ReadonlySet<string>): GuardOracle {
    const absent = compileGuard(undefined);
    return (site, event, state) =>
        evaluateGuard(guards.get(site) ?? absent,
            buildGuardContext(snapshot, { transitionId: site }, { event }, toJjelStateAccess(state, places)));
}

/** No assignment until lane C (R-SIM-39): a step moves the marking only. */
export const NO_SIM_ACTIONS: ActionOracle = () => ({ kind: 'ok', assignments: [] });

/**
 * What never runs, found at Reset (R-SIM-61): today a guard that does not parse
 * or that the subset checker rejects. Lane C adds actions and declarations.
 * Never a run-time outcome: those depend on σ and are explained by `stopReason`.
 */
export interface CompileDefect {
    readonly element: string;
    readonly role: 'guard';
    readonly reason: 'parse-error' | 'subset';
    readonly detail: string;
    readonly source: string;
}

export type RunStart =
    | { readonly kind: 'started'; readonly run: SimRun; readonly compileDefects?: readonly CompileDefect[] }
    | { readonly kind: 'refused'; readonly reason: string };

/** The guards of the map that never run, in compile order. */
function guardDefectsOf(guards: ReadonlyMap<string, CompiledGuard>): CompileDefect[] {
    const out: CompileDefect[] = [];
    for (const [element, g] of guards) {
        if (g.defect) out.push({ element, role: 'guard', reason: g.defect.reason, detail: g.defect.detail, source: g.source });
    }
    return out;
}

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
    // The event class is the Trigger's type, derived here and never read from the bag (R-SIM-38).
    const stc = netStcFromRoles(bag ? withDerivedEventRole(bag, lookup) : undefined);
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
    const guards = compileGuards(net, stc, lookup);
    return {
        kind: 'started',
        run: {
            net,
            config: { state: net.initial, event: null },
            halt: null,
            guards: makeGuardOracle(snapshot, guards, net.places),
            actions: NO_SIM_ACTIONS,
            alphabet: eventAlphabet(stc, view, ids).map(e => e.id),
            signature: runSignature(lookup, modelId, configModelId),
        },
        compileDefects: guardDefectsOf(guards),
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
    const raw = configModelId ? lookup[configModelId]?._state : undefined;
    if (raw && typeof raw === 'object') {
        // The bag the run reads: `simEvent` derived from the Trigger, a stale one ignored (R-SIM-38).
        const bag = withDerivedEventRole(raw, lookup);
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

/**
 * The short form of a guard defect (R-SIM-62): the parse position and message,
 * the subset code, the evaluation message without the error class, the type a
 * non-boolean guard returned.
 */
function defectShort(reason: GuardDefectReason, detail: string): string {
    switch (reason) {
        case 'parse-error':
            return `parse error ${detail}`;
        case 'subset':
            return detail.split(':')[0];
        case 'exception':
            return detail.replace(/^JjelEvaluationError: /, '');
        case 'non-boolean': {
            const m = /^the guard returned (.+), not a boolean$/.exec(detail);
            return m ? `returns ${m[1]}` : detail;
        }
        default:
            return detail;
    }
}

/**
 * The defects of a run at Reset in one line, the first three then a count
 * (R-SIM-37, R-SIM-61): the net's (an element the compiler left out) and the
 * guards' (a transition compiled but never a candidate), in the one wording
 * true for both. `null` when none.
 */
export function defectsLine(net: CompiledNet, lookup: Lookup, compileDefects: readonly CompileDefect[] = []): string | null {
    const items = [
        ...net.defects.map(d => `${elementName(lookup, d.element)} (${d.message})`),
        ...compileDefects.map(d => `${elementName(lookup, d.element)} ${d.role} (${defectShort(d.reason, d.detail)})`),
    ];
    if (items.length === 0) return null;
    const more = items.length > 3 ? `, and ${items.length - 3} more` : '';
    return `${items.length} defect${items.length === 1 ? '' : 's'}: ${items.slice(0, 3).join('; ')}${more}.`;
}

/** The `title` of the defects line: every defect in full, one per line, a guard with its source (R-SIM-62). */
export function defectsTitle(net: CompiledNet, lookup: Lookup, compileDefects: readonly CompileDefect[] = []): string | null {
    const lines = [
        ...net.defects.map(d => `${elementName(lookup, d.element)}: ${d.message}`),
        ...compileDefects.map(d => `${elementName(lookup, d.element)} ${d.role}: ${d.detail} [${d.source}]`),
    ];
    return lines.length === 0 ? null : lines.join('\n');
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
// Why an input has no candidate (R-SIM-57..62)
// ---------------------------------------------------------------------------

/** The label of an input: `ε` for `null`, the event's identifier otherwise; the panel's. */
export type InputLabel = (event: string | null) => string;

/** Why one input has no candidate, in the configuration of the run. */
export interface InputReason {
    /** The event instance id, `null` for ε. */
    readonly event: string | null;
    /** One line: `ε: t1 false`, `Coin: nothing enabled`; the guard's element is named. */
    readonly short: string;
    /** For the list: transitions as `name (S → D)`, never a guard's source (R-SIM-62). */
    readonly detail: string;
    /** For the `title`: the detail with the guard sources in brackets. */
    readonly full: string;
}

/** Why a run in Deadlock has no candidate for any input (R-SIM-58). */
export interface StopReason {
    /** After the status in the status row: the inputs that say why, the first three then a count. */
    readonly line: string;
    /** Every input in full, one per line. */
    readonly title: string;
    /** ε, then the alphabet, in order. */
    readonly inputs: readonly InputReason[];
}

/** The text of a guard, read by the `simGuard` pointer; a model edit interrupts the run (R-SIM-34), so it is the compiled one. */
function guardText(lookup: Lookup, site: string, guardFeature: string | undefined): string | null {
    if (!guardFeature) return null;
    const value = objectSlotValues(lookup, site, guardFeature)[0];
    return value === undefined ? null : String(value);
}

/** The first guard site among the siblings of an `else` whose outcome is a defect. */
function defectiveSibling(run: SimRun, siblings: readonly string[], event: string | null, access: SimStateAccess): string | null {
    for (const id of siblings) {
        const sibling = run.net.transitions.find(x => x.id === id);
        for (const site of sibling?.guardSites ?? []) if (run.guards(site, event, access).kind === 'defect') return site;
    }
    return null;
}

/**
 * One evaluated transition that is not a candidate, or `null` for one that is.
 * The guard is explained site by site (R-SIM-59): a fused fork/join names the
 * edge whose guard failed, a defect first, as the core's conjunction decides.
 */
function blocked(
    run: SimRun, e: CandidateSet['evaluated'][number], event: string | null, access: SimStateAccess, lookup: Lookup,
    guardFeature: string | undefined,
): { short: string; detail: string; full: string } | null {
    const t = run.net.transitions.find(x => x.id === e.transition);
    const own = elementName(lookup, e.transition.split('#')[0]);
    const label = candidateLabel(run.net, e.transition, lookup);
    const out = e.outcome;
    if (out.kind === 'inhibited') {
        const v = `inhibited by ${elementName(lookup, out.place)}`;
        return { short: `${own} ${v}`, detail: `${label} ${v}`, full: `${label} ${v}` };
    }
    if (out.kind === 'else') {
        if (out.outcome.kind === 'true') return null;
        const sibling = out.outcome.kind === 'defect' ? defectiveSibling(run, t?.elseOf ?? [], event, access) : null;
        const v = out.outcome.kind === 'defect'
            ? `else, ${sibling === null ? 'a sibling' : elementName(lookup, sibling)} is defective`
            : 'else, a sibling is true';
        return { short: `${own} ${v}`, detail: `${label} ${v}`, full: `${label} ${v}` };
    }
    if (out.kind === 'true') return null;
    const sites = (t?.guardSites ?? []).map(site => ({ site, g: run.guards(site, event, access) }));
    const defect = sites.find(s => s.g.kind === 'defect');
    const failing = defect ? [defect] : sites.filter(s => s.g.kind === 'false');
    if (failing.length === 0) return { short: `${own} ${out.kind}`, detail: `${label} ${out.kind}`, full: `${label} ${out.kind}` };
    const g = failing[0].g;
    const names = failing.map(s => elementName(lookup, s.site)).join(', ');
    const short = g.kind === 'defect' ? `defect, ${defectShort(g.reason, g.detail)}` : 'false';
    const full = g.kind === 'defect' ? `defect, ${g.reason === 'exception' ? defectShort(g.reason, g.detail) : g.detail}` : 'false';
    const sources = failing.map(s => guardText(lookup, s.site, guardFeature)).filter((x): x is string => x !== null);
    const src = sources.map(x => ` [${x}]`).join('');
    const plain = failing.length === 1 && failing[0].site === e.transition;
    const detail = plain ? `${label} ${full}` : `${label}: ${names} ${full}`;
    return { short: `${names} ${short}`, detail, full: `${detail}${src}` };
}

/** The reason of one input, and whether any transition said why; `null` when the input has a candidate or the run cannot move. */
function explain(
    run: SimRun, event: string | null, lookup: Lookup, label: InputLabel, guardFeature: string | undefined,
): { reason: InputReason; explained: boolean } | null {
    if (run.halt !== null) return null;
    const cs = candidates(run.net, { state: run.config.state, event }, run.guards);
    if (cs.terminated || cs.candidates.length > 0) return null;
    const access = stateAccess(run.config.state);
    const entries = cs.evaluated.map(e => blocked(run, e, event, access, lookup, guardFeature)).filter((b): b is { short: string; detail: string; full: string } => b !== null);
    const name = label(event);
    if (entries.length === 0) {
        const nothing = `${name}: nothing enabled`;
        return { reason: { event, short: nothing, detail: nothing, full: nothing }, explained: false };
    }
    const form = (key: 'short' | 'detail' | 'full') => `${name}: ${entries.map(b => b[key]).join('; ')}`;
    return { reason: { event, short: form('short'), detail: form('detail'), full: form('full') }, explained: true };
}

/**
 * Why an input has no candidate in the run's configuration (R-SIM-60: the
 * `title` of a button that is on in `Running`); `null` when it has one, or
 * without a run, or when the run is terminated or halted.
 */
export function inputReason(
    run: SimRun | undefined, event: string | null, lookup: Lookup, label: InputLabel, guardFeature?: string,
): InputReason | null {
    return run ? explain(run, event, lookup, label, guardFeature)?.reason ?? null : null;
}

/**
 * The reason of a run in Deadlock, for ε and every event (R-SIM-58, R-SIM-59):
 * the candidate sets recomputed from the run, as `netRunStatus` computes them,
 * so it is non-null exactly when that says `Deadlock`. The caller computes it
 * once per panel action, never per render (report §3.4).
 */
export function stopReason(run: SimRun | undefined, lookup: Lookup, label: InputLabel, guardFeature?: string): StopReason | null {
    if (!run) return null;
    const all: Array<{ reason: InputReason; explained: boolean }> = [];
    for (const event of [null, ...run.alphabet]) {
        const r = explain(run, event, lookup, label, guardFeature);
        if (r === null) return null;
        all.push(r);
    }
    const said = all.filter(r => r.explained).map(r => r.reason.short);
    const more = said.length > 3 ? ` · and ${said.length - 3} more` : '';
    return {
        line: said.length === 0 ? 'nothing enabled' : `${said.slice(0, 3).join(' · ')}${more}`,
        title: all.map(r => r.reason.full).join('\n'),
        inputs: all.map(r => r.reason),
    };
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

/**
 * The first transition the label shows blocked, in its short form (R-SIM-57):
 * what a discard or a quiescence names instead of claiming that nothing
 * accepted the input. The configuration is the run's before the commit, which
 * a discard and a quiescence leave as it was.
 */
function firstBlocked(run: SimRun, outcome: StepOutcome, lookup: Lookup): string | null {
    const access = stateAccess(run.config.state);
    for (const e of outcome.label.evaluated) {
        const b = blocked(run, e, outcome.label.event, access, lookup, undefined);
        if (b) return b.short;
    }
    return null;
}

function lastStepText(outcome: StepOutcome, net: CompiledNet, lookup: Lookup, input: string, why: string | null = null): string {
    const chosen = outcome.label.selector;
    switch (outcome.kind) {
        case 'fired':
            return `${input}: ${candidateLabel(net, chosen ?? '', lookup)} fired`;
        case 'halted':
            return `${input}: ${candidateLabel(net, chosen ?? '', lookup)} halted the run`;
        case 'discard':
            return why === null ? `${input}: discarded, no transition accepted it` : `${input}: discarded, ${why}`;
        case 'quiescence':
            return why === null ? `${input}: nothing to fire` : `${input}: nothing to fire, ${why}`;
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
    const why = outcome.kind === 'discard' || outcome.kind === 'quiescence' ? firstBlocked(run, outcome, lookup) : null;
    return { pending: null, lastStep: lastStepText(outcome, run.net, lookup, input, why), outcome };
}
