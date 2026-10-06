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
 * - `startRun`: at Reset, the STC from the M2 bag (`netStcFromRoles`) as
 *   `runBag` resolves it, the keys of the roles that are off dropped, the net
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
 * Actions (lane C1, R-SIM-67..71): the declarations are decoded from
 * `simStateAttributes` at Reset, the `Action` values read by site role into a
 * table beside the guards, and what never runs is listed with the guards'
 * defects; the run-time halts stay the backstop. No action role bound: the run
 * keeps `NO_SIM_ACTIONS`.
 *
 * Inputs (R-SIM-88, P-2026-09-28-0034): at Reset the input reads of every
 * transition are folded into `SimRun.inputs`; at a press, `inputAsks` lists
 * those of the enabled transitions that accept the input, and `pressInput`
 * returns them instead of committing; the answer comes back as `values`, which
 * reach guards and actions through an overlay of the state accessor, never σ.
 * `runStatus` keeps a run that waits for an input `Running`, and the reasons
 * never explain such an input as blocked.
 *
 * The globals of a model (R-SIM-94): the model's own bag carries the same key
 * for them; `startRun` merges it over the metamodel's (`mergeDeclarations`),
 * drops it when the profile turns the declarations off, as `runBag` drops the
 * metamodel's, and labels its defects as the model's; `runSignature` covers
 * the model's `sim*` keys, so an edit of them interrupts the run.
 *
 * The faces of Accepting and the outputs (R-SIM-91, R-SIM-92; P-2026-09-29-0300):
 * `acceptingMark` for the status row, `outputLine` (Moore) under the marking, and
 * the output of a fired step (Mealy) after its input in «Last step», `coin / unlock:`,
 * and in its title, all read from the compiled net, so a role that is off shows nothing.
 *
 * Derived attributes (lane C2, R-SIM-73..75): their equations are compiled at
 * Reset and, when one is declared, the run gets a `DerivedOracle` that gives
 * the initial σ its derived values and every step its σ′'s; with none the run
 * has no oracle. What the equations or their first values say wrong is listed
 * with the declarations; an action on a derived target is `read-only`.
 *
 * Random (R-SIM-100, P-2026-09-29-1840): `startRun` draws the run's seed once
 * with `crypto.getRandomValues`, or takes the one it is given; `pressRandom`
 * fires one of an ε list's candidates drawn with the run's next draw
 * (simRandom.ts), as a click on it would, the input marked `ε (random)` in
 * «Last step» and the seed in its title. Every commit carries its origin to
 * the run's trace: `user` for a click on the list, `random` for a draw.
 *
 * The run policy and Play (R-SIM-101, P-2026-09-29-1943): `pressStep` is Step
 * under the model's policy (simRunState.ts), which under Random draws an ε list
 * at once instead of opening it; `playTick` decides, purely, what one tick of
 * Play does, and `playPress` runs one tick against the store, so the panel's
 * timer reads the run and the policy afresh at every tick. Play presses ε only:
 * it never chooses an event nor the value of an input.
 *
 * The navigable trace and the face's state (R-SIM-102, R-SIM-104, R-SIM-106;
 * P-2026-10-03-0040): a press records the input values it was given on the
 * step it commits, so `configAt` (simRunState.ts) can replay it, and returns a
 * past step shown to live, since it acts on the live configuration. The pure
 * builders of the M1 face: `watchRows`, `markingChips` and `statusLine`.
 *
 * Invariants and breakpoints (R-SIM-137, P-2026-10-05-1735): `watchResults`
 * reads the model's watches (its bag's `runWatches`, read at each call, so an
 * edit applies at the next press and interrupts nothing) on a configuration of
 * the run, compiled against the run's declarations and the M frozen at Reset;
 * `playPress` reads them after the press it committed, never on the
 * configuration Play started from, and stops on a hit (`'watch'`), the same
 * under Random for the same seed; `watchHitLine` is the panel's line naming the
 * watch, the step and the firing; `watchHitSteps` the steps of the trace that hit.
 */

import type { ExecutionContext } from '../../../jjscript/types';
import type { JjelValue } from '../../../jjel/evaluator';
import { compileNet, eventAlphabet, featuresOf, netStcFromRoles, withDerivedEventRole, withDerivedInitial } from '../../../model/simulation/netCompile';
import {
    candidates, isAccepting, netRunStatus, stateAccess, stateOutputOf, step, terminated, tokens, transitionOutputOf,
} from '../../../model/simulation/netStep';
import { buildGuardContext, freezeSnapshot, SimSnapshotError, toJjelStateAccess } from '../../../model/simulation/guardContext';
import type { SimSnapshot } from '../../../model/simulation/guardContext';
import { compileGuard, evaluateGuard } from '../../../model/simulation/guardEvaluator';
import type { CompiledGuard, GuardDefectReason, GuardOutcome } from '../../../model/simulation/guardEvaluator';
import { actionSiteKey, compileAction, compileActions, judgeActionTarget, makeActionOracle } from '../../../model/simulation/actionEvaluator';
import type { CompiledAction } from '../../../model/simulation/actionEvaluator';
import { compileDerived, makeDerivedOracle } from '../../../model/simulation/derivedEvaluator';
import { decodeStateAttributes, encodeStateAttributes, mergeDeclarations, STATE_ATTRIBUTES_KEY } from '../../../model/simulation/stateAttributesCodec';
import type { StateAttributeRecord } from '../../../model/simulation/stateAttributesCodec';
import {
    checkActionSubset, checkActionValue, checkElse, checkGuard, checkInputTarget, checkTargetName, inputReads, inputTarget,
} from '../../../model/simulation/stcChecks';
import type { StcDefect, StcScope } from '../../../model/simulation/stcChecks';
import { isKindOf } from '../../../model/simulation/isKindOf';
import { objectLabel, objectReferences, objectSlotValues } from '../../../model/simulation/objectSlots';
import { ROLE_CATALOG, roleValues } from '../../../model/simulation/roleCatalog';
import { drawTransition, seededRng } from '../../../model/simulation/simRandom';
import type { SimRng } from '../../../model/simulation/simRandom';
import { decodeWatches, RUN_WATCHES_KEY } from '../../../model/simulation/watchCodec';
import { compileWatch, readWatches } from '../../../model/simulation/watchEvaluator';
import type { CompiledWatch, WatchResult } from '../../../model/simulation/watchEvaluator';
import type {
    ActionOracle, ActionSite, Arc, Candidate, CandidateSet, CompiledNet, DeclarationDefect, DeclarationDefectCode, Domain, GuardOracle, HaltReason,
    InputRead, NetConfiguration, NetModelView, NetRunStatus, NetStc, SimState, SimStateAccess, SimValue, StateAttributeDecl, StepOutcome,
} from '../../../model/simulation/netTypes';
import { getSimPolicy, getSimRun, simCommit, simSetView, withInputs } from './simRunState';
import type { SimOrigin, SimPolicy, SimRun } from './simRunState';
import { storedProfile } from './simRoleStatus';
import { stateKindOf, stateValueOf } from './simCanvasState';
import type { SimStateKind } from './simCanvasState';
import { defaultSimPins } from './simViewerPrefs';
import type { SimAttrRef } from './simViewerPrefs';

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
 * The bag a run reads (R-SIM-78): the raw bag without the keys of the roles its
 * profile turns off, so an `off` role is read exactly as an unbound one, and
 * with the event class derived from the Trigger unless Event is off (R-SIM-38).
 * The profile is the one the panel names (`storedProfile`): `simProfile`, else
 * «Custom» rebuilt from the keys, whose `off` roles are the keys it does not
 * read. Only `off` is resolved: a derived role with its key set is read as
 * before. The input is not mutated.
 */
export function runBag(raw: Record<string, unknown>, lookup: Lookup): Record<string, unknown> {
    const { profile } = storedProfile(raw);
    const bag: Record<string, unknown> = { ...raw };
    for (const d of ROLE_CATALOG) if (d.key !== null && profile.modes[d.id].mode === 'off') delete bag[d.key];
    const derived = withDerivedEventRole(bag, lookup);
    if (profile.modes.event.mode === 'off') delete derived.simEvent;
    return derived;
}

/**
 * The model's own bag as a run reads it (R-SIM-94): its `sim*` keys, the
 * declarations dropped when the metamodel's profile turns them off, as `runBag`
 * drops the metamodel's key (R-SIM-78). `configRaw` is the metamodel's raw bag.
 * The input is not mutated.
 */
export function modelRunBag(lookup: Lookup, modelId: string, configRaw: Record<string, unknown> | undefined): Record<string, unknown> {
    const own = lookup[modelId]?._state;
    const bag: Record<string, unknown> = {};
    if (!own || typeof own !== 'object') return bag;
    for (const key of Object.keys(own)) if (key.startsWith('sim')) bag[key] = own[key];
    if (storedProfile(configRaw ?? {}).profile.modes.stateAttributes.mode === 'off') delete bag[STATE_ATTRIBUTES_KEY];
    return bag;
}

/**
 * A new row of the model's Data dialog (R-SIM-94): a global, as the
 * metamodel's Add attribute makes one (stored, semantic, `false`), named
 * `name` or the first `x1`, `x2`, … no row uses.
 */
export function newGlobalRow(rows: readonly StateAttributeRecord[], name?: string): StateAttributeRecord {
    let fresh = name;
    for (let n = 1; fresh === undefined; n++) if (!rows.some(r => r.name === `x${n}`)) fresh = `x${n}`;
    return { name: fresh, metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, initial: 'false' };
}

/**
 * The rows the Data dialog opens with (R-SIM-94): the stored ones as they are,
 * then a new global row for each undeclared name of the Reset line that no row
 * names. Nothing is written until Apply.
 */
export function modelDataRows(stored: readonly StateAttributeRecord[], undeclared: readonly string[]): StateAttributeRecord[] {
    const rows = [...stored];
    for (const name of undeclared) if (!rows.some(r => r.name === name)) rows.push(newGlobalRow(rows, name));
    return rows;
}

/**
 * The Data dialog's Apply (R-SIM-94): one `state` assignment holding the
 * model's key alone, so one `set_state`, one TRANSACTION and one undo step;
 * it moves `runSignature`, so a run of the model is interrupted.
 */
export function modelDataPatch(rows: readonly StateAttributeRecord[]): Record<string, string> {
    return { [STATE_ATTRIBUTES_KEY]: encodeStateAttributes(rows) };
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

/**
 * The guard texts of a site (R-SIM-90): the first value of each Guard feature
 * it carries, in feature order; a feature it does not carry, a blank value and
 * the literal `else` (the complement, read by the compiler) are left out, so
 * they count as true (R-SIM-17). A value that is not a string is still a
 * guard: its text makes it a defect, never `true`.
 */
function guardTexts(lookup: Lookup, site: string, features: readonly string[]): string[] {
    const out: string[] = [];
    for (const feature of features) {
        const value = objectSlotValues(lookup, site, feature)[0];
        if (value === undefined) continue;
        const text = String(value);
        if (text.trim() !== '' && text.trim() !== 'else') out.push(text);
    }
    return out;
}

/** A caller's Guard features (R-SIM-90): a list as given, a string decoded (a plain id is one, the raw key its list). */
function guardFeatures(features: string | readonly string[] | undefined): readonly string[] {
    return typeof features === 'string' || features === undefined ? roleValues(features) : features;
}

/** Every guard of the net, compiled once per run: per site, one per Guard attribute it carries (R-SIM-90). */
function compileGuards(net: CompiledNet, stc: NetStc, lookup: Lookup): Map<string, CompiledGuard[]> {
    const out = new Map<string, CompiledGuard[]>();
    const features = featuresOf(stc, 'guard');
    if (features.length === 0) return out;
    for (const t of net.transitions) {
        for (const site of t.guardSites) {
            if (out.has(site)) continue;
            out.set(site, guardTexts(lookup, site, features).map(text => compileGuard(text)));
        }
    }
    return out;
}

/**
 * The guard oracle of the core over the frozen snapshot: `self` is the site,
 * `event` the input, and σ the state the core hands the oracle, read through
 * the adapter over the net's places (R-SIM-30, R-SIM-43). A site's guards are
 * conjoined as the core conjoins the sites (R-SIM-90): a defect wins, then
 * false; none is true.
 */
function makeGuardOracle(snapshot: SimSnapshot, guards: ReadonlyMap<string, readonly CompiledGuard[]>, places: ReadonlySet<string>): GuardOracle {
    return (site, event, state) => {
        const list = guards.get(site) ?? [];
        if (list.length === 0) return { kind: 'true' };
        const ctx = buildGuardContext(snapshot, { transitionId: site }, { event }, toJjelStateAccess(state, places));
        let result: GuardOutcome = { kind: 'true' };
        for (const g of list) {
            const outcome = evaluateGuard(g, ctx);
            if (outcome.kind === 'defect') return outcome;
            if (outcome.kind === 'false') result = outcome;
        }
        return result;
    };
}

/** The oracle of a run with no action role bound (R-SIM-69): a step moves the marking only. */
export const NO_SIM_ACTIONS: ActionOracle = () => ({ kind: 'ok', assignments: [] });

/**
 * The `Action` features of a site's role (R-SIM-69): the transition's own, a place's entry, its exit.
 * R-SIM-90: the lists, or the first attribute alone (a plain id, or the raw key, which is decoded).
 */
export type ActionFeatures = Pick<NetStc, 'action' | 'entry' | 'exit' | 'actions' | 'entries' | 'exits'>;

function actionFeatures(features: ActionFeatures, role: ActionSite['role']): readonly string[] {
    return featuresOf(features, role === 'transition' ? 'action' : role);
}

/**
 * The action texts of a site (R-SIM-90): the `0..*` values of every feature
 * of its role, feature by feature, in order; a feature the element does not
 * carry gives none. The union: the actions of one step are one parallel
 * assignment, so their order changes the label only, never σ′ (R-SIM-17).
 */
function siteTexts(lookup: Lookup, element: string, features: readonly string[]): Array<string | undefined> {
    // A value that is not a string is still an action: its text makes it a defect.
    return features.flatMap(f => objectSlotValues(lookup, element, f)).map(v => (v === undefined || v === null ? undefined : String(v)));
}

/**
 * Every action of the net, compiled once per run and keyed by `actionSiteKey`
 * (R-SIM-69): the `0..*` values of the role's features on the site element, in
 * order, blanks dropped, read from the raw lookup as the guards are. The sites
 * are the core's: in Petri an arc is never one.
 */
function compileActionTable(net: CompiledNet, features: ActionFeatures, lookup: Lookup): Map<string, CompiledAction[]> {
    const out = new Map<string, CompiledAction[]>();
    for (const t of net.transitions) {
        for (const site of t.actionSites) {
            const key = actionSiteKey(site);
            const role = actionFeatures(features, site.role);
            if (out.has(key) || role.length === 0) continue;
            const list = compileActions(siteTexts(lookup, site.element, role));
            if (list.length > 0) out.set(key, list);
        }
    }
    return out;
}

/**
 * What never runs, found at Reset (R-SIM-61, R-SIM-70): a guard that does not
 * parse or that the subset checker rejects; an action that does not parse, that
 * reads `node` into σ, or whose target, known before the run, is undeclared,
 * breaks locality, is derived (`read-only`) or is assigned twice by one
 * transition; a declaration that is wrong, its equation included. Since P2b
 * (`stcChecks.ts`, R-SIM-70 as extended) also a read or a target whose name no
 * declaration has, a guard read or a target known before the run that names no
 * element (`unresolved`) or reads what that element does not have, a subset
 * error on an action's right side, a right side that folds to a non-scalar or
 * outside the target's domain, and a guard that is one non-boolean read
 * (`value`); since R-SIM-87 (R7) an `else` with no sibling (`else-alone`),
 * which the run still reads as always true. Never a run-time outcome: those depend on σ and are explained by
 * `stopReason` or halt the run. A defective guard takes its transition out of
 * the candidates; a defective action does not: the transition halts if it fires.
 */
export interface CompileDefect {
    /** A guard's or an action's element; for a declaration, its name, `record N`, or `state attributes` for the key. */
    readonly element: string;
    readonly role: 'guard' | 'action' | 'declaration';
    readonly reason: 'parse-error' | 'subset' | 'undeclared' | 'locality' | 'double-assignment' | 'declaration' | 'read-only' | 'unresolved' | 'value' | 'else-alone';
    readonly detail: string;
    /** The guard's, the action's or the equation's text; `''` for any other declaration defect. */
    readonly source: string;
    /** The site of an action defect; absent for a double target, which is the transition's. */
    readonly site?: ActionSite;
    /** The form of the one line, when it is not derived from the detail. */
    readonly short?: string;
}

export type RunStart =
    | { readonly kind: 'started'; readonly run: SimRun; readonly compileDefects?: readonly CompileDefect[] }
    | { readonly kind: 'refused'; readonly reason: string };

/**
 * The guards of the map that never run, in compile order: a compile defect,
 * else the first rule of `checkGuard` that applies (P2b: R1, R2, R6).
 */
function guardDefectsOf(guards: ReadonlyMap<string, readonly CompiledGuard[]>, scope: StcScope): CompileDefect[] {
    const out: CompileDefect[] = [];
    for (const [element, list] of guards) {
        // R-SIM-90: each Guard attribute of the site on its own, in feature order.
        for (const g of list) {
            if (g.defect) {
                out.push({ element, role: 'guard', reason: g.defect.reason, detail: g.defect.detail, source: g.source });
                continue;
            }
            const rule = g.expr === null ? null : checkGuard(g.expr, element, scope);
            if (rule) out.push({ element, role: 'guard', reason: rule.reason, detail: rule.detail, source: g.source, ...(rule.short ? { short: rule.short } : {}) });
        }
    }
    return out;
}

/**
 * R7 (R-SIM-87): each `else` with no sibling, named by the edge that says
 * `else` (a fused transition's choice edge) in any Guard attribute (R-SIM-90),
 * in compile order.
 */
function elseDefectsOf(net: CompiledNet, features: readonly string[], lookup: Lookup): CompileDefect[] {
    const out: CompileDefect[] = [];
    for (const t of net.transitions) {
        const rule = checkElse(t);
        if (!rule) continue;
        const element = t.origin.find(id => elseText(lookup, id, features) !== null) ?? t.id;
        out.push({ element, role: 'guard', reason: rule.reason, detail: rule.detail, source: elseText(lookup, element, features) ?? 'else', ...(rule.short ? { short: rule.short } : {}) });
    }
    return out;
}

/**
 * The actions that never run, or that will halt the run whenever they fire,
 * judged before it (R-SIM-70, R-SIM-75): a compile defect; a subset error on
 * the right side (P2b, R4); a folded target unresolved (R3), undeclared,
 * derived or breaking locality, once per site; one folded target twice among
 * the sites of one transition; then the right side (R1, R5). A target that
 * reads σ or the event is left to the run, its name aside (R1).
 */
function actionDefectsOf(
    net: CompiledNet, table: ReadonlyMap<string, readonly CompiledAction[]>, snapshot: SimSnapshot, lookup: Lookup, scope: StcScope,
): CompileDefect[] {
    const out: CompileDefect[] = [];
    const judged = new Set<string>();
    for (const t of net.transitions) {
        const targets = new Set<string>();
        for (const site of t.actionSites) {
            const key = actionSiteKey(site);
            const first = !judged.has(key);
            judged.add(key);
            for (const c of table.get(key) ?? []) {
                const report = (reason: CompileDefect['reason'], detail: string, short?: string) => {
                    if (first) out.push({ element: site.element, role: 'action', reason, detail, source: c.source, site, ...(short ? { short } : {}) });
                };
                const rule = (d: StcDefect) => report(d.reason, d.detail, d.short);
                if (c.defect !== null) {
                    report(c.action === null ? 'parse-error' : 'subset', c.defect);
                    continue;
                }
                const subset = checkActionSubset(c);
                if (subset) {
                    rule(subset);
                    continue;
                }
                const verdict = judgeActionTarget(c, site, snapshot);
                if (verdict.kind === 'unresolved') {
                    report('unresolved', verdict.detail, `unresolved .[${c.action?.target.attribute}]`);
                    continue;
                }
                const target = verdict.kind === 'folded' ? verdict.target : null;
                const value = () => {
                    const v = checkActionValue(c, site, target, scope);
                    if (v) rule(v);
                };
                if (target === null) {
                    const unknown = checkTargetName(c, scope) ?? checkInputTarget(c, scope);
                    if (unknown) rule(unknown);
                    else value();
                    continue;
                }
                const where = elementName(lookup, target.element);
                const decl = net.declared.get(target.element)?.get(target.attr);
                if (!decl) {
                    report('undeclared', `'${target.attr}' is not declared on ${where}`, `undeclared '${target.attr}' on ${where}`);
                    continue;
                }
                if (decl.equation !== undefined) {
                    report('read-only', `'${target.attr}' is derived and cannot be assigned`, `assigns derived '${target.attr}'`);
                    continue;
                }
                if (decl.input === true) {
                    rule(inputTarget(target.attr));
                    continue;
                }
                if ((decl.space === 'semantic') === target.onNode) {
                    report('locality', decl.space === 'semantic'
                        ? `'${target.attr}' is a semantic attribute: node.[${target.attr}] assigns presentation only`
                        : `'${target.attr}' is a presentation attribute: only node.[${target.attr}] assigns it`,
                    `locality, '${target.attr}' is ${decl.space}`);
                    continue;
                }
                const written = `${target.element}\u0000${target.attr}`;
                if (targets.has(written)) {
                    out.push({
                        element: t.id, role: 'action', reason: 'double-assignment', source: c.source,
                        detail: `${target.attr} of ${where} is assigned twice in one step`, short: `${target.attr} of ${where} assigned twice`,
                    });
                }
                targets.add(written);
                value();
            }
        }
    }
    return out;
}

/** The codes of a defect of an equation, whose index is its declaration's in the compiled net. */
const EQUATION_CODES: ReadonlySet<DeclarationDefectCode> = new Set<DeclarationDefectCode>(['parse', 'subset', 'event', 'cycle', 'derived']);

/**
 * The declarations' defects as the defects line lists them (R-SIM-70): named by
 * the declaration, the key as `state attributes`. An equation's defect carries
 * its text for the title only (R-SIM-62); a subset defect is its code in the
 * line; a value at Reset names its element, `cnet.total`, never the id.
 */
function declarationDefectsOf(
    defects: readonly DeclarationDefect[], lookup: Lookup, attributes: readonly StateAttributeDecl[] = [], bag: 'metamodel' | 'model' = 'metamodel',
): CompileDefect[] {
    // The model's key (R-SIM-94) says so: its records are numbered in its own key, not after the metamodel's.
    const own = bag === 'model' ? 'model ' : '';
    return defects.map((d): CompileDefect => {
        const element = d.code === 'key' ? `${own}state attributes` : d.name ?? `${own}record ${(d.index ?? 0) + 1}`;
        const source = EQUATION_CODES.has(d.code) && d.index !== null ? attributes[d.index]?.equation ?? '' : '';
        if (d.code === 'derived') {
            const where = d.element === undefined ? element : `${elementName(lookup, d.element)}.${element}`;
            return { element, role: 'declaration', reason: 'declaration', detail: `${where} ${d.message.replace(/^failed: JjelEvaluationError: /, 'failed: ')}`, source };
        }
        const detail = d.element === undefined ? d.message : `${d.message} on ${elementName(lookup, d.element)}`;
        const short = d.code === 'subset' ? d.message.split(':')[0] : undefined;
        return { element, role: 'declaration', reason: 'declaration', detail, source, ...(short ? { short } : {}) };
    });
}

/**
 * R-SIM-88: per transition, the inputs its evaluation reads, folded once at
 * Reset over the frozen M (`inputReads`): the guards of its sites and of its
 * `else` siblings' sites, which the core evaluates for the complement, and the
 * target objects and right sides of its actions. A transition that reads none
 * has no entry.
 */
function inputReadTable(
    net: CompiledNet, guards: ReadonlyMap<string, readonly CompiledGuard[]>, table: ReadonlyMap<string, readonly CompiledAction[]>, scope: StcScope,
): Map<string, InputRead[]> {
    const byId = new Map(net.transitions.map(t => [t.id, t]));
    // R-SIM-90: every Guard attribute of the site.
    const guardReads = (site: string): InputRead[] => (guards.get(site) ?? []).flatMap(g => (g.expr ? inputReads(g.expr, site, scope) : []));
    const out = new Map<string, InputRead[]>();
    for (const t of net.transitions) {
        const reads: InputRead[] = [];
        const seen = new Set<string>();
        const add = (found: readonly InputRead[]) => {
            for (const r of found) {
                const key = `${r.element}\u0000${r.attr}`;
                if (!seen.has(key)) { seen.add(key); reads.push(r); }
            }
        };
        for (const site of t.guardSites) add(guardReads(site));
        for (const id of t.elseOf ?? []) for (const site of byId.get(id)?.guardSites ?? []) add(guardReads(site));
        for (const site of t.actionSites) {
            for (const c of table.get(actionSiteKey(site)) ?? []) {
                if (c.action === null) continue;
                add(inputReads(c.action.target.object, site.element, scope));
                add(inputReads(c.action.value, site.element, scope));
            }
        }
        if (reads.length > 0) out.set(t.id, reads);
    }
    return out;
}

/** R-SIM-100: the seed of a run, a uniform 32-bit integer; drawn at Reset only, never by the core. */
function freshSeed(): number {
    return crypto.getRandomValues(new Uint32Array(1))[0];
}

/**
 * The run of an M1 model at Reset. `configModelId` is the metamodel whose bag
 * holds the roles. Refused when the roles do not make an STC or the snapshot
 * cannot be frozen; the overlap check of the roles stays with the panel, which
 * has the metamodel's class list. `seed` is the seed of the run's draws
 * (R-SIM-100), drawn here when not given; a test gives it.
 */
export function startRun(
    lookup: Lookup, modelId: string, configModelId: string | null, projectId: string, build: ContextBuilder,
    seed: number = freshSeed(),
): RunStart {
    const raw = configModelId ? lookup[configModelId]?._state : undefined;
    // The keys of the roles the profile turns off are not read (R-SIM-78); the event class is
    // the Trigger's type, derived here and never read from the bag (R-SIM-38).
    const bag = raw ? runBag(raw, lookup) : undefined;
    const stc = netStcFromRoles(bag);
    if (!stc) return { kind: 'refused', reason: 'The simulation roles are incomplete.' };
    const ids = collectModelObjectIds(lookup, modelId);
    const view = makeNetModelView(lookup, stc.eventIdentifier);
    // The declarations (R-SIM-67, R-SIM-68): an absent key is the empty set, any other value is decoded.
    const stored = bag?.[STATE_ATTRIBUTES_KEY];
    const declarations = decodeStateAttributes(stored === undefined || stored === null ? undefined : String(stored));
    // The model's globals (R-SIM-94), over the metamodel's by name; dropped with the metamodel's when the profile turns them off.
    const own = modelRunBag(lookup, modelId, raw)[STATE_ATTRIBUTES_KEY];
    const modelDeclarations = decodeStateAttributes(own === undefined || own === null ? undefined : String(own));
    const merged = mergeDeclarations(declarations, modelDeclarations);
    const plain = compileNet(stc, view, modelId, ids, merged.decls);
    const globals = build(evalContextFor(lookup, modelId, projectId), { extentModelId: modelId });
    let snapshot: SimSnapshot;
    try {
        snapshot = freezeSnapshot(globals, { id: modelId, name: String(lookup[modelId]?.name ?? '') });
    } catch (e) {
        if (e instanceof SimSnapshotError) return { kind: 'refused', reason: `The model cannot be frozen: ${e.message}.` };
        throw e;
    }
    // Derived attributes (R-SIM-73): an oracle only when one is declared, as NO_SIM_ACTIONS for the actions.
    // The dependencies per element over the frozen M (R-SIM-74 as amended): a recursion on M is ordered.
    const equations = compileDerived(plain.attributes, { snapshot, net: plain });
    const derived = plain.attributes.some(d => d.equation !== undefined) ? makeDerivedOracle(snapshot, plain, equations) : undefined;
    const net = derived ? withDerivedInitial(plain, derived, equations.defects) : plain;
    const guards = compileGuards(net, stc, lookup);
    const actionRoles = !!(stc.action || stc.entry || stc.exit);
    const actions = actionRoles ? compileActionTable(net, stc, lookup) : new Map<string, CompiledAction[]>();
    // The rules of P2b read M frozen and the declarations of the net (stcChecks.ts).
    const scope: StcScope = { snapshot, net, nameOf: id => elementName(lookup, id) };
    // The inputs each transition reads (R-SIM-88): only when one is declared, as the derived oracle.
    const inputs = net.attributes.some(d => d.input === true) ? inputReadTable(net, guards, actions, scope) : undefined;
    return {
        kind: 'started',
        run: {
            net,
            config: { state: net.initial, event: null },
            halt: null,
            guards: makeGuardOracle(snapshot, guards, net.places),
            actions: actionRoles ? makeActionOracle(snapshot, net, actions) : NO_SIM_ACTIONS,
            derived,
            alphabet: eventAlphabet(stc, view, ids).map(e => e.id),
            signature: runSignature(lookup, modelId, configModelId),
            ...(inputs ? { inputs } : {}),
            seed,
            draws: 0,
            trace: [],
            // The I/O board's outputs read σ on the same frozen M (P-2026-10-03-1845, report §4).
            snapshot,
        },
        compileDefects: [
            ...guardDefectsOf(guards, scope),
            ...elseDefectsOf(net, featuresOf(stc, 'guard'), lookup),
            ...actionDefectsOf(net, actions, snapshot, lookup, scope),
            ...declarationDefectsOf(declarations.defects, lookup),
            ...declarationDefectsOf([...modelDeclarations.defects, ...merged.defects], lookup, [], 'model'),
            // The compiler's indices are the merged list's, which is the net's.
            ...declarationDefectsOf(net.declarationDefects ?? [], lookup, net.attributes),
        ],
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
 * the `sim*` keys of the metamodel's bag and of the model's (R-SIM-94), the model's objects with every slot,
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
        // The bag the run reads: the keys of off roles dropped (R-SIM-78), `simEvent` derived from the Trigger, a stale one ignored (R-SIM-38).
        const bag = runBag(raw, lookup);
        for (const key of Object.keys(bag).filter(k => k.startsWith('sim')).sort()) sig += `${key}=${JSON.stringify(bag[key])};`;
    }
    // The model's own keys (R-SIM-94), as the run reads them: its declarations dropped when the profile turns them off.
    const own = modelRunBag(lookup, modelId, raw && typeof raw === 'object' ? raw : undefined);
    for (const key of Object.keys(own).sort()) sig += `model.${key}=${JSON.stringify(own[key])};`;
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

/**
 * The texts of the actions of a halt's site, read by the role's feature; a
 * model edit interrupts the run (R-SIM-34), so they are the compiled ones.
 */
function siteSources(site: ActionSite, lookup: Lookup, features: ActionFeatures | undefined): string[] {
    const role = features ? actionFeatures(features, site.role) : [];
    if (role.length === 0) return [];
    return compileActions(siteTexts(lookup, site.element, role)).map(c => c.source);
}

/**
 * The action a halt names, and the detail without its text (R-SIM-62, R-SIM-70):
 * an action defect's detail opens with `'<source>': `, a text of the site; an
 * undeclared or derived target is any action of the site assigning that
 * attribute. A derived value that failed or left its domain names its
 * equation, read from the net's declarations when given.
 */
function haltSource(
    reason: HaltReason, lookup: Lookup, features: ActionFeatures | undefined, net?: Pick<CompiledNet, 'declared'>,
): { sources: string[]; detail: string | null } {
    if (reason.kind === 'action-defect') {
        const source = siteSources(reason.site, lookup, features)
            .filter(x => reason.detail.startsWith(`'${x}': `))
            .sort((a, b) => b.length - a.length)[0];
        // The error class stays out of the line, as for a derived value (R-SIM-82, G10).
        return source === undefined
            ? { sources: [], detail: reason.detail.replace(/^JjelEvaluationError: /, '') }
            : { sources: [source], detail: reason.detail.slice(source.length + 4).replace(/^JjelEvaluationError: /, '') };
    }
    if (reason.kind === 'undeclared' || reason.kind === 'read-only') {
        const sources = siteSources(reason.site, lookup, features).filter(x => compileAction(x)?.action?.target.attribute === reason.attr);
        return { sources, detail: null };
    }
    if (reason.kind === 'derived' || reason.kind === 'domain') {
        const equation = net?.declared.get(reason.element)?.get(reason.attr)?.equation;
        return { sources: equation === undefined ? [] : [equation], detail: null };
    }
    return { sources: [], detail: null };
}

/**
 * The halt line, by reason (R-SIM-29); cleared by Reset. Elements by name,
 * never by id; the text of the action that stopped the run is not in the line
 * but in its title (`haltTitle`), when the action features are given.
 */
export function haltMessage(reason: HaltReason, lookup: Lookup, features?: ActionFeatures): string {
    switch (reason.kind) {
        case 'unsafe':
            return `Halted: unsafe. ${elementName(lookup, reason.place)} would hold ${reason.value} tokens; the bound is ${reason.bound}.`;
        case 'domain':
            return `Halted: ${reason.attr} of ${elementName(lookup, reason.element)} would be ${String(reason.value)}, outside its domain.`;
        case 'double-assignment':
            return `Halted: ${reason.attr} of ${elementName(lookup, reason.element)} is assigned twice in one step.`;
        case 'action-defect':
            return `Halted: the ${reason.site.role} action of ${elementName(lookup, reason.site.element)} failed: ${haltSource(reason, lookup, features).detail}.`;
        case 'undeclared':
            return `Halted: the ${reason.site.role} action of ${elementName(lookup, reason.site.element)} failed: '${reason.attr}' is not declared on ${elementName(lookup, reason.element)}.`;
        case 'read-only':
            return `Halted: the ${reason.site.role} action of ${elementName(lookup, reason.site.element)} failed: '${reason.attr}' is ${reason.input ? 'an input' : 'derived'} and cannot be assigned.`;
        case 'derived':
            return `Halted: derived '${reason.attr}' of ${elementName(lookup, reason.element)} failed: ${reason.detail.replace(/^JjelEvaluationError: /, '')}.`;
    }
}

/**
 * The `title` of the halt line: the line, then the text of the action or of the
 * equation that stopped the run in brackets (R-SIM-62); the equation needs `net`.
 */
export function haltTitle(reason: HaltReason, lookup: Lookup, features?: ActionFeatures, net?: Pick<CompiledNet, 'declared'>): string {
    const line = haltMessage(reason, lookup, features);
    return [line, ...haltSource(reason, lookup, features, net).sources.map(x => `[${x}]`)].join(' ');
}

function arcsText(arcs: readonly Arc[], lookup: Lookup): string {
    // An empty side is said, never left blank: `t3 (lock → ∅)` (R-SIM-82, G11).
    if (arcs.length === 0) return '∅';
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
 * The head of the choice list (R-SIM-98): named for what it is, a
 * nondeterministic choice on the input pressed, `ε` or an event, then one
 * line that says what to do. The panel's section style uppercases the heading
 * and leaves the input in its own case (G13): `NONDETERMINISTIC CHOICE (ε)`.
 */
export function choiceHead(input: string): { heading: string; input: string; subline: string } {
    return { heading: 'Nondeterministic choice', input, subline: 'Choose a transition' };
}

/**
 * The run's σ in one line of the M1 face, for the whole run (R-SIM-82, G3): the
 * marking, places by name with `×n` above one and none at 0, `∅` when empty;
 * then, after ` · `, the stored semantic attributes and the derived semantic
 * ones, each group by element then attribute, a global (the model's own) as
 * `attr = value` and so first. The presentation stays out. The line is clamped
 * by the panel, the title holds it in full (R-SIM-63):
 * `Marking: p2 ×2, p3 · coins = 2, paid = true`.
 */
export function markingLine(state: SimState, net: Pick<CompiledNet, 'modelId'>, lookup: Lookup): { line: string; title: string } {
    const places = [...state.marking]
        .filter(([, n]) => n > 0)
        .map(([place, n]) => ({ name: elementName(lookup, place), n }))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(p => (p.n === 1 ? p.name : `${p.name} ×${p.n}`));
    const values = (space: SimState['attrs'] | undefined): string[] => {
        const out: Array<{ element: string; attr: string; text: string }> = [];
        for (const [element, attrs] of space ?? []) {
            const name = element === net.modelId ? '' : elementName(lookup, element);
            for (const [attr, value] of attrs) out.push({ element: name, attr, text: `${name === '' ? '' : `${name}.`}${attr} = ${String(value)}` });
        }
        return out.sort((a, b) => a.element.localeCompare(b.element) || a.attr.localeCompare(b.attr)).map(x => x.text);
    };
    const sigma = [...values(state.attrs), ...values(state.derived?.attrs)];
    const line = `Marking: ${places.length === 0 ? '∅' : places.join(', ')}${sigma.length === 0 ? '' : ` · ${sigma.join(', ')}`}`;
    return { line, title: line };
}

/**
 * The mark of the status row (R-SIM-50, R-SIM-91): `accepting` while some marked
 * place is a kind of Accepting, whatever the status; `null` otherwise. Read from
 * the net, never the bag: without the role, or with it off (`runBag`, R-SIM-86),
 * `net.accepting` is `null` and there is no mark.
 */
export function acceptingMark(net: CompiledNet, state: SimState): 'accepting' | null {
    return isAccepting(net, state) ? 'accepting' : null;
}

/** Output values as the faces print them: in order, comma-separated. */
function outputValues(values: readonly SimValue[]): string {
    return values.map(v => String(v)).join(', ');
}

/**
 * Moore's line of the M1 face (R-SIM-51, R-SIM-92), under the marking from Reset
 * to Stop: the outputs of the marked places (`stateOutputOf`, read on frozen M at
 * Reset). One such place: `Output: red`, `Output: red, buzz` for two values;
 * several, each named, in the net's order: `Output: s1 red; s2 amber`; none:
 * `Output: none`. `null` when the net has no state outputs (no role, or the role
 * off), so the line is there for the whole run or not at all. The title holds it in full.
 */
export function outputLine(state: SimState, net: CompiledNet, lookup: Lookup): { line: string; title: string } | null {
    if (!net.stateOutputs) return null;
    const marked = stateOutputOf(net, state);
    const text = marked.length === 0
        ? 'none'
        : marked.length === 1
            ? outputValues(marked[0].values)
            : marked.map(o => `${elementName(lookup, o.place)} ${outputValues(o.values)}`).join('; ');
    const line = `Output: ${text}`;
    return { line, title: line };
}

// ---------------------------------------------------------------------------
// The face's state (R-SIM-102, R-SIM-104; P-2026-10-03-0040)
// ---------------------------------------------------------------------------

/** One Watch row of the M1 face (R-SIM-104): an attribute of one element, on the configuration shown. */
export interface SimWatchRow {
    /** The owner: the model id for a global. */
    readonly element: string;
    readonly attr: string;
    /** As the face names it, `inputLabel`'s form: `coins` for a global, `p1.visits` otherwise. */
    readonly name: string;
    readonly space: 'semantic' | 'presentation';
    readonly kind: SimStateKind;
    /** A range draws a domain bar; `null` for the presentation. */
    readonly domain: Domain | null;
    /** Stored then derived; an input's is the value its step was given. `null` when there is none. */
    readonly value: SimValue | null;
    /** The value before the step, when the step changed it (`null` when there was none); `null` otherwise. */
    readonly before: SimValue | null;
    /** The step changed the value. Never an input's: it is not state. */
    readonly changed: boolean;
}

/**
 * The Watch rows (R-SIM-104) of the configuration shown, `state`, after the step
 * from `prev` (`null` at step 0): one per pin, in the pins' order; a pin of a
 * metaclass gives one row per element that carries it, by name. `pins` `null` is
 * the default of `defaultSimPins`; a pin no declaration of the net names is
 * skipped. An input (`IVAR`) reads the value its step was given, `inputs`
 * (`SimTraceStep.inputs`), and is never a change.
 */
export function watchRows(
    net: Pick<CompiledNet, 'modelId' | 'attributes' | 'declared'>, state: SimState, prev: SimState | null,
    pins: readonly SimAttrRef[] | null, lookup: Lookup, inputs: readonly InputValue[] = [],
): SimWatchRow[] {
    const out: SimWatchRow[] = [];
    for (const pin of pins ?? defaultSimPins(net.attributes)) {
        const owners: Array<{ element: string; name: string; decl: StateAttributeDecl }> = [];
        for (const [element, byName] of net.declared) {
            const decl = byName.get(pin.name);
            if (!decl || decl.metaclass !== pin.metaclass || decl.space !== pin.space) continue;
            owners.push({ element, name: inputLabel({ element, attr: pin.name }, net, lookup), decl });
        }
        owners.sort((a, b) => a.name.localeCompare(b.name));
        for (const { element, name, decl } of owners) {
            const kind = stateKindOf(decl);
            const value = kind === 'IVAR'
                ? inputs.find(v => v.element === element && v.attr === decl.name)?.value ?? null
                : stateValueOf(state, decl.space, element, decl.name) ?? null;
            const old = kind === 'IVAR' || prev === null ? value : stateValueOf(prev, decl.space, element, decl.name) ?? null;
            out.push({
                element, attr: decl.name, name, space: decl.space, kind, domain: decl.domain, value,
                before: old === value ? null : old, changed: old !== value,
            });
        }
    }
    return out;
}

/** One Marking chip of the M1 face (R-SIM-104): a marked place, `×n` from two tokens. */
export interface SimMarkingChip {
    readonly place: string;
    readonly name: string;
    readonly tokens: number;
    readonly text: string;
}

/** The Marking chips (R-SIM-104): the places `markingLine` lists, in its order and its words, one chip each. */
export function markingChips(state: SimState, lookup: Lookup): SimMarkingChip[] {
    return [...state.marking]
        .filter(([, n]) => n > 0)
        .map(([place, n]) => ({ place, name: elementName(lookup, place), tokens: n }))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(c => ({ ...c, text: c.tokens === 1 ? c.name : `${c.name} ×${c.tokens}` }));
}

/**
 * The one status line of the M1 face (R-SIM-104), beside the pill that names
 * the status: `step n`, the seed, then the last step, `last` being the text and
 * the title of today's «Last step» line. The title is that line's own,
 * `Last step: …`, so its readers change a selector and not a string; without a
 * last step, the line itself.
 */
export function statusLine(
    step: number, seed: number | undefined, last: { readonly text: string; readonly title: string } | null,
): { line: string; title: string } {
    const line = [`step ${step}`, ...(seed === undefined ? [] : [`seed ${seed}`]), ...(last ? [last.text] : [])].join(' · ');
    return { line, title: last ? `Last step: ${last.title}` : line };
}

/**
 * The short form of a guard defect (R-SIM-62): the parse position and message,
 * the subset code, the evaluation message without the error class, the type a
 * non-boolean guard returned.
 */
function defectShort(reason: GuardDefectReason | CompileDefect['reason'], detail: string): string {
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
 * Who a compile defect is about, as the line and the title name it: a guard's
 * or an action's element by name with its role (`t1 guard`, `t1 action`,
 * `p2 entry`), a declaration by its own name.
 */
function defectSubject(d: CompileDefect, lookup: Lookup): string {
    if (d.role === 'declaration') return d.element;
    const element = d.site?.element ?? d.element;
    const role = d.role === 'action' && d.site && d.site.role !== 'transition' ? d.site.role : d.role;
    return `${elementName(lookup, element.split('#')[0])} ${role}`;
}

/**
 * The defects of a run at Reset in one line, the first three then a count
 * (R-SIM-37, R-SIM-61, R-SIM-70): the net's (an element the compiler left out),
 * then the guards', the actions' and the declarations', in the one wording true
 * for all: a defect. `null` when none.
 */
export function defectsLine(net: CompiledNet, lookup: Lookup, compileDefects: readonly CompileDefect[] = []): string | null {
    const items = [
        ...net.defects.map(d => `${elementName(lookup, d.element)} (${d.message})`),
        ...compileDefects.map(d => `${defectSubject(d, lookup)} (${d.short ?? defectShort(d.reason, d.detail)})`),
    ];
    if (items.length === 0) return null;
    const more = items.length > 3 ? `, and ${items.length - 3} more` : '';
    return `${items.length} defect${items.length === 1 ? '' : 's'}: ${items.slice(0, 3).join('; ')}${more}.`;
}

/** The `title` of the defects line: every defect in full, one per line, a guard or an action with its source (R-SIM-62). */
export function defectsTitle(net: CompiledNet, lookup: Lookup, compileDefects: readonly CompileDefect[] = []): string | null {
    const lines = [
        ...net.defects.map(d => `${elementName(lookup, d.element)}: ${d.message}`),
        ...compileDefects.map(d => `${defectSubject(d, lookup)}: ${d.detail}${d.source === '' ? '' : ` [${d.source}]`}`),
    ];
    return lines.length === 0 ? null : lines.join('\n');
}

/**
 * The names the Reset line finds undeclared that the model's Data… can declare
 * (R-SIM-94): a name no declaration has (`undeclared 'x'`, a guard's or an
 * action's), or one undeclared on the model itself (`undeclared 'x' on <model>`),
 * each once, in the line's order. A name undeclared on another element is bound
 * to a metaclass, the metamodel's to declare, and is not listed. Read from the
 * one-line forms of `stcChecks.ts` and `actionDefectsOf`, which carry no name field.
 */
export function undeclaredGlobals(defects: readonly CompileDefect[], lookup: Lookup, modelId: string): string[] {
    const model = elementName(lookup, modelId);
    const out: string[] = [];
    for (const d of defects) {
        if (d.reason !== 'undeclared' || d.short === undefined) continue;
        const m = /^undeclared '([^']+)'(?: on (.+))?$/.exec(d.short);
        if (!m || (m[2] !== undefined && m[2] !== model)) continue;
        if (!out.includes(m[1])) out.push(m[1]);
    }
    return out;
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

/**
 * The title of an input that is on (R-SIM-60, R-SIM-88): why it has no candidate when it has none, else what its
 * press asks, else the base. The panel's words, lifted so that the I/O board's devices say the same
 * (P-2026-10-03-1845, report §5).
 */
export function inputPressTitle(base: string, why?: string, asks?: string): string {
    return why ? `${base}\nNo candidate. ${why}` : asks ? `${base}\nAsks: ${asks}` : base;
}

/** The title of an input that is off (R-SIM-104): the run's reason while it runs, its status otherwise. */
export function inputOffTitle(base: string, why: string | undefined, status: NetRunStatus | null): string {
    if (why) return `${base}\nOff. ${why}`;
    return `${base}\nOff. ${status === 'Not started' || status === null ? 'Reset starts the run.' : `The run is ${status}.`}`;
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

/**
 * The text of the Guard attribute that says `else` on an element, as written
 * (R-SIM-90: any of them), `null` when none does; a model edit interrupts the
 * run (R-SIM-34), so it is the compiled one.
 */
function elseText(lookup: Lookup, element: string, features: readonly string[]): string | null {
    for (const feature of features) {
        const value = objectSlotValues(lookup, element, feature)[0];
        if (value !== undefined && String(value).trim() === 'else') return String(value);
    }
    return null;
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
    features: readonly string[],
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
    // R-SIM-96: the line names the guard, as an inhibitor names its place; the title keeps `false` and the source.
    const short = g.kind === 'defect' ? `defect, ${defectShort(g.reason, g.detail)}` : 'guard false';
    const full = g.kind === 'defect' ? `defect, ${g.reason === 'exception' ? defectShort(g.reason, g.detail) : g.detail}` : 'false';
    // R-SIM-90: every guard text of a failing site, as the oracle conjoined them.
    const sources = failing.flatMap(s => guardTexts(lookup, s.site, features));
    const src = sources.map(x => ` [${x}]`).join('');
    const plain = failing.length === 1 && failing[0].site === e.transition;
    const detail = plain ? `${label} ${full}` : `${label}: ${names} ${full}`;
    return { short: `${names} ${short}`, detail, full: `${detail}${src}` };
}

/** The reason of one input, and whether any transition said why; `null` when the input has a candidate or the run cannot move. */
function explain(
    run: SimRun, event: string | null, lookup: Lookup, label: InputLabel, features: readonly string[],
): { reason: InputReason; explained: boolean } | null {
    if (run.halt !== null) return null;
    // An input that asks may have a candidate once answered (R-SIM-88): it is waiting, not blocked.
    if (inputAsks(run, event).length > 0) return null;
    const cs = candidates(run.net, { state: run.config.state, event }, run.guards);
    if (cs.terminated || cs.candidates.length > 0) return null;
    const access = stateAccess(run.config.state);
    const entries = cs.evaluated.map(e => blocked(run, e, event, access, lookup, features)).filter((b): b is { short: string; detail: string; full: string } => b !== null);
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
 * without a run, or when the run is terminated or halted. `guardFeature` is
 * every Guard attribute (R-SIM-90), or a string read as the bag's key.
 */
export function inputReason(
    run: SimRun | undefined, event: string | null, lookup: Lookup, label: InputLabel, guardFeature?: string | readonly string[],
): InputReason | null {
    return run ? explain(run, event, lookup, label, guardFeatures(guardFeature))?.reason ?? null : null;
}

/**
 * The reason of a run in Deadlock, for ε and every event (R-SIM-58, R-SIM-59):
 * the candidate sets recomputed from the run, as `netRunStatus` computes them,
 * so it is non-null exactly when that says `Deadlock`. The caller computes it
 * once per panel action, never per render (report §3.4).
 */
export function stopReason(run: SimRun | undefined, lookup: Lookup, label: InputLabel, guardFeature?: string | readonly string[]): StopReason | null {
    if (!run) return null;
    const features = guardFeatures(guardFeature);
    const all: Array<{ reason: InputReason; explained: boolean }> = [];
    for (const event of [null, ...run.alphabet]) {
        const r = explain(run, event, lookup, label, features);
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
// Inputs (R-SIM-88)
// ---------------------------------------------------------------------------

/** The value the environment gave an input for one press. */
export interface InputValue {
    readonly element: string;
    readonly attr: string;
    readonly value: SimValue;
}

/**
 * The inputs a press of `event` (`null` for ε) reads: those of the transitions
 * that accept it, whose preset is enabled and that no inhibitor blocks, in
 * compile order, each (element, name) once. `[]` without inputs, on a halted
 * or terminated run, and wherever none is read: the press is then today's.
 */
export function inputAsks(run: SimRun, event: string | null): InputRead[] {
    if (!run.inputs || run.halt !== null) return [];
    const state = run.config.state;
    if (terminated(run.net, state)) return [];
    const out: InputRead[] = [];
    const seen = new Set<string>();
    for (const t of run.net.transitions) {
        const reads = run.inputs.get(t.id);
        if (!reads) continue;
        if (!(event === null ? t.triggers.length === 0 : t.triggers.includes(event))) continue;
        if (!t.preset.every(a => tokens(state, a.place) >= a.weight)) continue;
        if (t.inhibitors.some(a => tokens(state, a.place) >= a.weight)) continue;
        for (const r of reads) {
            const key = `${r.element}\u0000${r.attr}`;
            if (!seen.has(key)) { seen.add(key); out.push(r); }
        }
    }
    return out;
}

/** An input as the dialog and Last step name it: `D.decision`, a global (the model's own) as `answer`. */
export function inputLabel(read: { readonly element: string; readonly attr: string }, net: Pick<CompiledNet, 'modelId'>, lookup: Lookup): string {
    return read.element === net.modelId ? read.attr : `${elementName(lookup, read.element)}.${read.attr}`;
}

// `withInputs`, the overlay of the values given at a press, moved to simRunState.ts (P-2026-10-03-0040):
// the replay of `configAt` reads a step's inputs through it too.

/**
 * The status of a run as the panel shows it: `netRunStatus`, except that a run
 * the core finds in `Deadlock` while some input asks is `Running`: a transition
 * waiting for an input may fire once it is answered (R-SIM-88).
 */
export function runStatus(run: SimRun): NetRunStatus {
    const status = netRunStatus(run.net, run.config, run.alphabet, run.guards, run.halt);
    if (status !== 'Deadlock') return status;
    return [null, ...run.alphabet].some(e => inputAsks(run, e).length > 0) ? 'Running' : status;
}

// ---------------------------------------------------------------------------
// One input
// ---------------------------------------------------------------------------

export interface InputPress {
    /** More than one candidate and no selector: the list to choose from (R-SIM-35); nothing committed. */
    readonly pending: readonly Candidate[] | null;
    /** The «Last step» line of the committed step, `null` when nothing was committed. */
    readonly lastStep: string | null;
    /** Its `title`: the line, then the assignments of the step when it made any (R-SIM-71), then the derived values of σ′ (R-SIM-73). */
    readonly lastStepTitle?: string;
    readonly outcome: StepOutcome | null;
    /** R-SIM-88: the inputs the press reads and was not given; nothing committed, the panel asks them. */
    readonly asks?: readonly InputRead[];
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
        const b = blocked(run, e, outcome.label.event, access, lookup, []);
        if (b) return b.short;
    }
    return null;
}

/** The derived values of a σ as the title of «Last step» lists them: `cnet.total = 2`, the semantic ones first. */
function derivedText(state: SimState, lookup: Lookup): string[] {
    const out: string[] = [];
    for (const space of [state.derived?.attrs, state.derived?.presentation]) {
        for (const [element, values] of space ?? []) {
            for (const [attr, value] of values) out.push(`${elementName(lookup, element)}.${attr} = ${String(value)}`);
        }
    }
    return out;
}

/** Mealy (R-SIM-51, R-SIM-92): the output of a fired step, its transition's values; `''` when it has none or the net no role. */
function firedOutput(outcome: StepOutcome, net: CompiledNet): string {
    if (outcome.kind !== 'fired' || outcome.label.selector === null) return '';
    return outputValues(transitionOutputOf(net, outcome.label.selector));
}

function lastStepText(outcome: StepOutcome, net: CompiledNet, lookup: Lookup, input: string, why: string | null = null): string {
    const chosen = outcome.label.selector;
    switch (outcome.kind) {
        case 'fired': {
            // Mealy's input / output first: the line is clamped at the panel's width, so an output at its end was cut
            // on the discovery's own turnstile (P-2026-09-29-0300 lane probe, 304px needed in 262px).
            const output = firedOutput(outcome, net);
            return `${input}${output === '' ? '' : ` / ${output}`}: ${candidateLabel(net, chosen ?? '', lookup)} fired`;
        }
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
    values?: readonly InputValue[],
): InputPress {
    return press(modelId, event, selector, lookup, input, values, 'user');
}

/** R-SIM-100: the input of a drawn step as «Last step» names it; the marker after the input, so the clamp cuts `fired` first. */
const RANDOM_INPUT = 'ε (random)';

/**
 * R-SIM-100: Random on an ε list. One of `candidates`, the list the panel
 * shows, is drawn with the run's next draw (`rng` replaces the run's stream in
 * a test) and fired as a click on it would be: recorded `random`, «Last step»
 * reads `ε (random): …`, its title ends with the run's seed. ε only: an
 * event's list has no Random (A3), so an event press is never drawn. Fewer
 * than two candidates is not a list: nothing is drawn, nothing committed.
 */
export function pressRandom(
    modelId: string, candidates: readonly Candidate[], lookup: Lookup, values?: readonly InputValue[], rng?: SimRng,
): InputPress {
    const run = getSimRun(modelId);
    if (!run || candidates.length < 2) return { pending: null, lastStep: null, outcome: null };
    const drawn = drawTransition(candidates, rng ?? seededRng(run.seed ?? 0, run.draws ?? 0)) as Candidate;
    return press(modelId, null, drawn.transition, lookup, RANDOM_INPUT, values, 'random');
}

// ---------------------------------------------------------------------------
// The run policy and Play (R-SIM-101)
// ---------------------------------------------------------------------------

/**
 * R-SIM-101: Step, the ε press of the panel under the model's policy. Under
 * Ask it is `pressInput`; under Random a list of two or more candidates is not
 * shown but drawn at once through `pressRandom`, so no ε list opens. A forced
 * press is the same under both. An event's press never reads the policy (A3).
 */
export function pressStep(modelId: string, lookup: Lookup, values?: readonly InputValue[], rng?: SimRng): InputPress {
    const pressed = pressInput(modelId, null, undefined, lookup, 'ε', values);
    if (pressed.pending === null || getSimPolicy(modelId).choices !== 'random') return pressed;
    return pressRandom(modelId, pressed.pending, lookup, values, rng);
}

/**
 * Why Play stops (R-SIM-101): no run, a status that stops the run, k steps, an input asked, no ε candidate, a list
 * under Ask; and an invariant or a breakpoint hit by the step it pressed (R-SIM-137).
 */
export type PlayStop = 'cleared' | 'Terminated' | 'Deadlock' | 'Halted' | 'limit' | 'input' | 'event' | 'choice' | 'watch';

/** What one tick of Play does: one ε press, or stop and say why. */
export type PlayTick = { readonly kind: 'press' } | { readonly kind: 'stop'; readonly reason: PlayStop };

/**
 * R-SIM-101: one tick of Play, from the run as the store holds it, the model's
 * policy and the steps this Play press has made. Pure. The stops, in order: no
 * run (Stop, the R-SIM-34 interruption); `Terminated`, `Deadlock`, `Halted`; k
 * steps made; an ε press that asks an input (R-SIM-88); no ε candidate while
 * the run is `Running`, so an event has one or asks (A2); two or more
 * candidates under Ask. Otherwise one ε press.
 */
export function playTick(run: SimRun | undefined, policy: SimPolicy, steps: number): PlayTick {
    if (!run) return { kind: 'stop', reason: 'cleared' };
    const status = runStatus(run);
    if (status === 'Terminated' || status === 'Deadlock' || status === 'Halted') return { kind: 'stop', reason: status };
    if (steps >= policy.k) return { kind: 'stop', reason: 'limit' };
    if (inputAsks(run, null).length > 0) return { kind: 'stop', reason: 'input' };
    const found = candidates(run.net, { state: run.config.state, event: null }, run.guards).candidates.length;
    if (found === 0) return { kind: 'stop', reason: 'event' };
    if (found > 1 && policy.choices === 'ask') return { kind: 'stop', reason: 'choice' };
    return { kind: 'press' };
}

/** One tick of Play as the panel runs it (R-SIM-101). */
export interface PlayPress {
    /** Why Play stops at this tick; `null` while it goes on. */
    readonly stop: PlayStop | null;
    /** The tick's ε press, whose lines the panel shows as Step's; `null` when nothing was pressed. */
    readonly press: InputPress | null;
    /** The steps of this Play press after the tick: one more when the press committed a step. */
    readonly steps: number;
    /** R-SIM-137: the watches the committed step hit, in declaration order, when Play stops on them (`'watch'`). */
    readonly hits?: readonly WatchResult[];
}

/**
 * R-SIM-101: one tick of Play on a model's run: `playTick` on the run and the
 * policy the store holds now, so a Stop, a Reset, an interruption or a change
 * of the policy between two ticks is read by the next one. A `press` is Step's
 * (`pressStep`). A list under Ask and an input ask are pressed as Step presses
 * them, committing nothing, so the panel opens the list or the dialog where
 * Play stops. R-SIM-137: after a press that committed a step, the watches are
 * read on the configuration it left; a hit stops Play there. Never before the
 * press, so the configuration Play starts from never stops it, and a breakpoint
 * still true stops it again one step later (level-triggered).
 */
export function playPress(modelId: string, lookup: Lookup, steps: number, rng?: SimRng): PlayPress {
    const tick = playTick(getSimRun(modelId), getSimPolicy(modelId), steps);
    if (tick.kind === 'press') {
        const press = pressStep(modelId, lookup, undefined, rng);
        if (press.outcome === null) return { stop: null, press, steps };
        const run = press.outcome.kind === 'inadmissible' ? undefined : getSimRun(modelId);
        const hits = run ? watchResults(run, lookup).filter(r => r.hit) : [];
        return hits.length > 0 ? { stop: 'watch', press, steps: steps + 1, hits } : { stop: null, press, steps: steps + 1 };
    }
    if (tick.reason === 'choice' || tick.reason === 'input') {
        return { stop: tick.reason, press: pressInput(modelId, null, undefined, lookup, 'ε'), steps };
    }
    return { stop: tick.reason, press: null, steps };
}

/**
 * The status row's note after Play stops (R-SIM-101); `null` where the panel already shows why: a status, a list, no
 * run, a hit (the hit line, `watchHitLine`).
 */
export function playStopLine(stop: PlayStop | null, steps: number): string | null {
    switch (stop) {
        case 'limit':
            return `Play stopped at ${steps} step${steps === 1 ? '' : 's'}`;
        case 'event':
            return 'Play waits for an event';
        case 'input':
            return 'Play waits for an input';
        default:
            return null;
    }
}

// ---------------------------------------------------------------------------
// Invariants and breakpoints (R-SIM-137)
// ---------------------------------------------------------------------------

/** The watches of a run as last compiled, per net: the net and the snapshot are the run's until Reset. */
const compiledWatches = new WeakMap<CompiledNet, { readonly raw: string | undefined; readonly watches: readonly CompiledWatch[] }>();

/**
 * The watches of a run's model (W1, W2): its bag's `runWatches` as it is now, so an edit applies at the next read
 * and, the key being no `sim*` one, interrupts nothing; compiled as a board output against the run's declarations
 * and the M frozen at Reset, once per value of the key. An unreadable key gives none.
 */
function runWatchesOf(run: SimRun, lookup: Lookup): readonly CompiledWatch[] {
    const stored = lookup[run.net.modelId]?._state?.[RUN_WATCHES_KEY];
    const raw = stored === undefined || stored === null ? undefined : String(stored);
    const cached = compiledWatches.get(run.net);
    if (cached && cached.raw === raw) return cached.watches;
    const scope = { net: run.net, snapshot: run.snapshot, nameOf: (id: string) => elementName(lookup, id) };
    const watches = decodeWatches(raw).watches.map(w => compileWatch(w, scope));
    compiledWatches.set(run.net, { raw, watches });
    return watches;
}

/**
 * R-SIM-137: every watch of the run's model read on `state`, the live configuration by default, in declaration
 * order, each with its reading and its hit. None without the M frozen at Reset, which the evaluator reads.
 */
export function watchResults(run: SimRun, lookup: Lookup, state: SimState = run.config.state): WatchResult[] {
    if (!run.snapshot) return [];
    const watches = runWatchesOf(run, lookup);
    return watches.length === 0 ? [] : readWatches(watches, run.snapshot, run.net, state);
}

/** Per kept configuration, whether it hit, for the compiled watches it was read with. */
const keptHits = new WeakMap<NetConfiguration, { readonly watches: readonly CompiledWatch[]; readonly hit: boolean }>();

/**
 * R-SIM-137: the steps of the trace whose configuration hits, for the inspector's marks; step 0 is not a step. Read
 * over the kept configurations (the last `SIM_KEEP_CONFIGS`, simRunState.ts) and remembered per configuration, so a
 * commit reads the new one only; an older step would need a replay each and is not marked.
 */
export function watchHitSteps(run: SimRun, lookup: Lookup): ReadonlySet<number> {
    const out = new Set<number>();
    const snapshot = run.snapshot;
    if (!snapshot) return out;
    const watches = runWatchesOf(run, lookup);
    if (watches.length === 0) return out;
    const kept = run.keptConfigs ?? [];
    const first = (run.trace?.length ?? 0) - kept.length + 1;
    kept.forEach((cfg, i) => {
        let known = keptHits.get(cfg);
        if (!known || known.watches !== watches) {
            known = { watches, hit: readWatches(watches, snapshot, run.net, cfg.state).some(r => r.hit) };
            keptHits.set(cfg, known);
        }
        if (known.hit) out.add(first + i);
    });
    return out;
}

const hitHead = (r: WatchResult): string => (r.watch.kind === 'invariant' ? `Invariant ${r.watch.name} false` : `Breakpoint ${r.watch.name}`);

/**
 * R-SIM-137: the panel's hit line, `Invariant coinsAtMost2 false at step 9 · coin: tc (locked → locked) fired`: the
 * first hit in declaration order, the others counted on the line, the step and the firing that led there (`firing`,
 * the step's «Last step» text). The title is the line, then one line per hit with its expression. `null` without a hit.
 */
export function watchHitLine(hits: readonly WatchResult[], step: number, firing: string): { line: string; title: string } | null {
    if (hits.length === 0) return null;
    const more = hits.length > 1 ? ` and ${hits.length - 1} more` : '';
    const line = `${hitHead(hits[0])}${more} at step ${step}${firing === '' ? '' : ` · ${firing}`}`;
    const each = hits.map(h => `${h.watch.kind === 'invariant' ? 'Invariant' : 'Breakpoint'} ${h.watch.name}: ${h.watch.text}`);
    return { line, title: [line, ...each].join('\n') };
}

/** One press; `origin` says who chose `selector` when one is given: the list's click or Random's draw. */
function press(
    modelId: string, event: string | null, selector: string | undefined, lookup: Lookup, input: string,
    values: readonly InputValue[] | undefined, origin: SimOrigin,
): InputPress {
    const run = getSimRun(modelId);
    if (!run) return { pending: null, lastStep: null, outcome: null };
    // R-SIM-106: a press acts on the live configuration, and a past step shown returns to it.
    simSetView(modelId, null);
    // R-SIM-88: what the press reads is asked first; nothing is committed before the answer.
    if (values === undefined) {
        const asks = inputAsks(run, event);
        if (asks.length > 0) return { pending: null, lastStep: null, outcome: null, asks };
    }
    const live = values === undefined ? run : withInputs(run, values);
    const cfg = { state: run.config.state, event };
    let chosen: string | null;
    if (selector === undefined) {
        const cs = candidates(run.net, cfg, live.guards);
        if (cs.candidates.length > 1) return { pending: cs.candidates, lastStep: null, outcome: null };
        chosen = cs.candidates[0]?.transition ?? null;
    } else {
        chosen = selector;
    }
    const outcome = step(run.net, cfg, chosen, live.guards, live.actions, run.derived);
    // The store keeps the origin only among two or more candidates: a press without a selector was forced.
    // The values given are kept on the step, so a replay reads them (R-SIM-106).
    simCommit(modelId, outcome, origin, values);
    const why = outcome.kind === 'discard' || outcome.kind === 'quiescence' ? firstBlocked(live, outcome, lookup) : null;
    const lastStep = lastStepText(outcome, run.net, lookup, input, why);
    const assigned = outcome.label.assignments.map(a => `${elementName(lookup, a.element)}.${a.attr} = ${String(a.value)}`);
    const asked = (values ?? []).map(v => `${inputLabel(v, run.net, lookup)} = ${String(v.value)}`);
    const derivedValues = outcome.kind === 'fired' ? derivedText(outcome.next.state, lookup) : [];
    const output = firedOutput(outcome, run.net);
    const lastStepTitle = [
        lastStep,
        ...(output === '' ? [] : [`output: ${output}`]),
        ...(assigned.length === 0 ? [] : [`assignments: ${assigned.join(', ')}`]),
        ...(asked.length === 0 ? [] : [`inputs: ${asked.join(', ')}`]),
        ...(derivedValues.length === 0 ? [] : [`derived: ${derivedValues.join(', ')}`]),
        ...(origin === 'random' && outcome.kind !== 'inadmissible' ? [`seed ${run.seed}`] : []),
    ].join('\n');
    return { pending: null, lastStep, lastStepTitle, outcome };
}
