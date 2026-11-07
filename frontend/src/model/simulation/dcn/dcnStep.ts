/**
 * dcnStep — the DCN nucleus: one step over the placeless net of `compileDcn`
 * (R-DCN-2, R-DCN-3, R-DCN-4, R-DCN-11, R-DCN-12; spec §6; discovery 2026-11-06 §3.2).
 *
 * `readDcnStep` runs once per run over the compile input and `readDcnModel`:
 * the `isOverlapping` and `isComplete` flags of every viewpoint, by dynamic
 * class (defaults false and true), and the redefinitions: a dynamic class's
 * operation that redefines (`simRedefines`) a static operation of the same
 * instance. `dcnNucleus` is a `SimNucleus` over that, run on the shared `step`
 * of `netStep.ts` for guards and slots (R-DCN-11), with these DCN parts:
 *
 * - The net: every transition whose entry has a precondition or a class to be
 *   active is guarded at its own id; a redefinition is re-triggered by the
 *   invocation of the operation it redefines, so it is no input of its own and
 *   a press of that operation has both as candidates (the expansion of R-DCN-2).
 * - The oracles (`guards`, `actions`, which the run will carry, lane L4.5): the
 *   binding of `bindDcn` over the σ the core hands them, cached per accessor. A
 *   guard is the class test first (`classifiedAs`, through the L4.3 accessor; a
 *   throw is an `exception`), then the precondition, compiled in the DCN subset
 *   mode. An action is compiled in the DCN action mode, so a slot write carries
 *   `slot: true`.
 * - The slot marker is read before any lookup by name (L3.4 ticket): an
 *   assignment whose marker disagrees with "the attribute is a slot of the
 *   element" halts `undeclared`, so `self.[battery] := e` never lands on the
 *   slot `battery`.
 * - Interleave (the default, R-DCN-4) is SoSyM Definition 3: each transition
 *   (σ, Vi, σ′) is triggered by one viewpoint, and a trajectory is one
 *   interleaving of them. So one step fires one contribution, chosen through
 *   the selector, and two ticks may fire two monitors in either order. Sync
 *   fires every candidate of the input in one parallel assignment read on σ:
 *   `candidates` answers the one candidate `DCN_SYNC_SELECTOR`, and the step
 *   fuses the real ones into one transition run by the shared step, so two
 *   writes of one slot halt `double-assignment` (R-SIM-17). The label lists the
 *   real candidates. Ask | Random over `candidates` stays the caller's.
 * - After a fired step σ′ is classified, and checked in this order: ranges (the
 *   core's `domain` halt, already given), completeness of every complete
 *   viewpoint over every instance (`unclassified`; an invariant that throws is
 *   `unclassified` with its detail, on any viewpoint), then exclusivity of every
 *   non-overlapping viewpoint (`ambiguous`, the classes in model order). A
 *   viewpoint with no class is not checked. A halt keeps σ, as the core's do.
 *
 * Not wired into `startRun` (lane L4.5). Pure: JjEL, no React, no store.
 */

import { JjelEvaluator, isJjelObject } from '../../../jjel/evaluator';
import type { EvaluationContext, JjelValue, JjelWarning } from '../../../jjel/evaluator';
import { isBitVector } from '../../../jjel/evaluator/context';
import type { JjelExpression } from '../../../jjel/types/ast';
import { describeType, firstAbsence } from '../../jjelTriState';
import type { SimNucleus } from '../../../components/editor-v2/sim/simNucleus';
import { compileActions } from '../actionEvaluator';
import type { ActionAssignment, CompiledAction } from '../actionEvaluator';
import { buildGuardContext, toJjelStateAccess } from '../guardContext';
import type { SimSnapshot } from '../guardContext';
import { compileGuard, evaluateGuard } from '../guardEvaluator';
import type { CompiledGuard, GuardOutcome } from '../guardEvaluator';
import { candidates as netCandidates, step as netStep, structuralInputs, terminated } from '../netStep';
import type {
    ActionOracle, CandidateSet, CompiledNet, GuardOracle, HaltReason, NetConfiguration, NetLabel, NetTransition,
    SimAssignment, SimState, SimStateAccess, SimValue, StepOutcome,
} from '../netTypes';
import type { DcnCompileInput, DcnReadView } from './dcnCompile';
import { bindDcn } from './dcnHandles';
import type { DcnBinding, DcnDynamicClass, DcnModel } from './dcnHandles';

/** The one candidate of a Sync step, and the id of the fused transition. */
export const DCN_SYNC_SELECTOR = 'dcn-sync';

/** Interleave (default) or Sync (R-DCN-4). */
export type DcnPolicy = 'interleave' | 'sync';

export interface DcnViewpointFlags {
    readonly overlapping: boolean;
    readonly complete: boolean;
}

/** What the step needs beyond `DcnModel`, read once per run. */
export interface DcnStepModel {
    readonly model: DcnModel;
    /** Dynamic class id to the flags of the viewpoint that lists it. */
    readonly flags: ReadonlyMap<string, DcnViewpointFlags>;
    /** A redefinition's transition id to the transition id of the static operation it redefines. */
    readonly redefines: ReadonlyMap<string, string>;
}

/** The classification of one σ: instance to viewpoint name to its active classes, and the first halt it implies. */
export interface DcnClassification {
    readonly classes: ReadonlyMap<string, ReadonlyMap<string, readonly string[]>>;
    readonly halt: HaltReason | null;
}

export interface DcnNucleus extends SimNucleus {
    /** The placeless net with the DCN guard sites and re-triggered redefinitions. */
    readonly net: CompiledNet;
    readonly guards: GuardOracle;
    readonly actions: ActionOracle;
    /** The candidates of `cfg`: the net's under Interleave; under Sync `DCN_SYNC_SELECTOR` alone when any is enabled. */
    candidates(cfg: NetConfiguration, guards: GuardOracle): CandidateSet;
    classify(state: SimState): DcnClassification;
}

const DEFAULT_FLAGS: DcnViewpointFlags = { overlapping: false, complete: true };

const TRUE: GuardOutcome = { kind: 'true' };
const FALSE: GuardOutcome = { kind: 'false' };

function flag(view: DcnReadView, viewpoint: string, feature: string | undefined, fallback: boolean): boolean {
    if (feature === undefined) return fallback;
    const v = view.attributeValue(viewpoint, feature);
    return v === true || v === 'true' ? true : v === false || v === 'false' ? false : fallback;
}

/** Once per run: the viewpoint flags and the redefinitions (see the module comment). */
export function readDcnStep(input: DcnCompileInput, model: DcnModel): DcnStepModel {
    const { stc, view } = input;
    const flags = new Map<string, DcnViewpointFlags>();
    for (const vp of view.objects()) {
        const classes = view.referenceTargets(vp, stc.dynamicClasses);
        if (classes.length === 0) continue;
        const f = { overlapping: flag(view, vp, stc.overlapping, false), complete: flag(view, vp, stc.complete, true) };
        for (const dc of classes) if (!flags.has(dc)) flags.set(dc, f);
    }
    const redefines = new Map<string, string>();
    if (stc.redefines !== undefined) {
        const entries = [...model.compiled.entries.values()];
        for (const e of entries) {
            if (e.kind !== 'invocation' || e.dynamicClass === null) continue;
            const targets = view.referenceTargets(e.element, stc.redefines);
            const redefined = entries.find(s =>
                s.kind === 'invocation' && s.viewpoint === null && s.instance === e.instance && targets.includes(s.element));
            if (redefined) redefines.set(e.id, redefined.id);
        }
    }
    return { model, flags, redefines };
}

/** Path B, as for guards and actions: no context at construction. */
const EVALUATOR = new JjelEvaluator();

const message = (error: unknown): string => {
    const e: any = error;
    return `${e?.constructor?.name ?? 'Error'}: ${e?.message ?? String(e)}`;
};

/** A bit-vector is one too (R-BV-7), as in actionEvaluator.ts. */
function isSimValue(value: unknown): value is SimValue {
    return typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string' || isBitVector(value as JjelValue);
}

type Evaluated = { readonly ok: true; readonly value: JjelValue } | { readonly ok: false; readonly why: string };

/** One expression with diagnostics: an exception, then an absence (as actionEvaluator.ts). */
function evaluate(expr: JjelExpression, ctx: EvaluationContext): Evaluated {
    let out: { value: JjelValue; warnings: JjelWarning[] };
    try {
        out = EVALUATOR.evaluateWithDiagnostics(expr, ctx);
    } catch (error) {
        return { ok: false, why: message(error) };
    }
    const absent = firstAbsence(out.warnings);
    if (absent) {
        return {
            ok: false,
            why: absent.suggestion ? `'${absent.identifier}' does not exist; maybe '${absent.suggestion}'` : `'${absent.identifier}' does not exist`,
        };
    }
    return { ok: true, value: out.value };
}

/** One action: actionEvaluator.ts `evaluateAction` without locality, which has no presentation to judge here. */
function evaluateAction(c: CompiledAction, ctx: EvaluationContext): ActionAssignment | string {
    if (c.action === null || c.defect !== null) return c.defect ?? 'no action produced';
    const { target, value } = c.action;
    const object = evaluate(target.object, ctx);
    if (!object.ok) return `the target: ${object.why}`;
    const id = isJjelObject(object.value) ? (object.value as any).id : undefined;
    if (typeof id !== 'string' || id === '') return `the target is ${describeType(object.value)}, not a model element`;
    const rhs = evaluate(value, ctx);
    if (!rhs.ok) return rhs.why;
    if (!isSimValue(rhs.value)) return `the value is ${describeType(rhs.value)}, not a boolean, a number or a string`;
    return target.type === 'SlotTarget' ? { element: id, attr: target.attribute, value: rhs.value, slot: true } : { element: id, attr: target.attribute, value: rhs.value };
}

/** The classification of `state` and its first halt: completeness over every instance, then exclusivity. */
function classifyState(m: DcnStepModel, snapshot: SimSnapshot, state: Pick<SimState, 'attrs'>): DcnClassification {
    const binding = bindDcn(m.model, state, snapshot);
    const classes = new Map<string, Map<string, string[]>>();
    let unclassified: HaltReason | null = null;
    let ambiguous: HaltReason | null = null;
    for (const info of m.model.instances.values()) {
        const handle = binding.handles.get(info.id);
        const byViewpoint = new Map<string, string[]>();
        for (const [viewpoint, dcs] of info.viewpoints) {
            if (dcs.size === 0) continue;
            const active: string[] = [];
            let detail: string | undefined;
            for (const dc of dcs.values()) {
                try {
                    if (binding.classification.isIn(handle, viewpoint, dc.name)) active.push(dc.name);
                } catch (error) {
                    detail ??= message(error);
                }
            }
            byViewpoint.set(viewpoint, active);
            const f = m.flags.get(dcs.values().next().value!.id) ?? DEFAULT_FLAGS;
            if (unclassified === null && detail !== undefined) unclassified = { kind: 'unclassified', element: info.id, viewpoint, detail };
            if (unclassified === null && f.complete && active.length === 0) unclassified = { kind: 'unclassified', element: info.id, viewpoint };
            if (ambiguous === null && !f.overlapping && active.length > 1) ambiguous = { kind: 'ambiguous', element: info.id, viewpoint, classes: active };
        }
        classes.set(info.id, byViewpoint);
    }
    return { classes, halt: unclassified ?? ambiguous };
}

/** The DCN nucleus of a run: see the module comment. */
export function dcnNucleus(m: DcnStepModel, snapshot: SimSnapshot, policy: DcnPolicy = 'interleave'): DcnNucleus {
    const { compiled } = m.model;
    const transitions = compiled.net.transitions.map((t): NetTransition => {
        const e = compiled.entries.get(t.id);
        const guarded = e !== undefined && (e.guard.precondition !== null || e.guard.classifiedAs !== null);
        const redefined = m.redefines.get(t.id);
        return { ...t, guardSites: guarded ? [t.id] : t.guardSites, triggers: redefined !== undefined ? [redefined] : t.triggers };
    });
    const net: CompiledNet = { ...compiled.net, transitions };
    const byId = new Map(transitions.map(t => [t.id, t]));

    const bindings = new WeakMap<SimStateAccess, DcnBinding>();
    const bindingOf = (access: SimStateAccess): DcnBinding => {
        let b = bindings.get(access);
        if (!b) {
            const attrs = new Map<string, Map<string, SimValue>>();
            for (const [instance, slots] of compiled.slots) {
                const values = new Map<string, SimValue>();
                for (const attr of slots.keys()) {
                    const v = access.read(instance, attr);
                    if (isSimValue(v)) values.set(attr, v);
                }
                attrs.set(instance, values);
            }
            b = bindDcn(m.model, { attrs }, snapshot);
            bindings.set(access, b);
        }
        return b;
    };

    const classOf = (instance: string, id: string): DcnDynamicClass | undefined => {
        for (const dcs of m.model.instances.get(instance)?.viewpoints.values() ?? []) {
            for (const dc of dcs.values()) if (dc.id === id) return dc;
        }
        return undefined;
    };

    const compiledGuards = new Map<string, CompiledGuard>();
    const guards: GuardOracle = (site, event, access) => {
        const entry = compiled.entries.get(site);
        if (entry === undefined) return { kind: 'defect', reason: 'no-handle', detail: `${site} is no transition of the DCN net` };
        const binding = bindingOf(access);
        if (entry.guard.classifiedAs !== null) {
            const dc = classOf(entry.instance, entry.guard.classifiedAs);
            if (dc === undefined) return { kind: 'defect', reason: 'exception', detail: `the dynamic class ${entry.guard.classifiedAs} is no class of ${entry.instance}` };
            try {
                if (!binding.classification.isIn(binding.handles.get(entry.instance), dc.viewpoint, dc.name)) return FALSE;
            } catch (error) {
                return { kind: 'defect', reason: 'exception', detail: message(error) };
            }
        }
        let g = compiledGuards.get(site);
        if (!g) {
            g = compileGuard(entry.guard.precondition, { dcn: true });
            compiledGuards.set(site, g);
        }
        if (g.expr === null && g.defect === null) return TRUE;
        return evaluateGuard(g, buildGuardContext(snapshot, { transitionId: site }, { event }, toJjelStateAccess(access, net.places), undefined, binding));
    };

    const compiledActions = new Map<string, CompiledAction[]>();
    const actions: ActionOracle = (site, event, access) => {
        let list = compiledActions.get(site.element);
        if (!list) {
            list = compileActions(compiled.entries.get(site.element)?.body ?? [], { dcn: true });
            compiledActions.set(site.element, list);
        }
        if (list.length === 0) return { kind: 'ok', assignments: [] };
        const ctx = buildGuardContext(snapshot, { transitionId: site.element }, { event }, toJjelStateAccess(access, net.places), undefined, bindingOf(access));
        if (ctx === null) return { kind: 'defect', detail: `'${list[0].source}': the site ${site.element} has no DCN instance` };
        const assignments: ActionAssignment[] = [];
        for (const c of list) {
            const out = evaluateAction(c, ctx);
            if (typeof out === 'string') return { kind: 'defect', detail: `'${c.source}': ${out}` };
            assignments.push(out);
        }
        return { kind: 'ok', assignments };
    };

    /** The caller's oracle with the slot marker checked first; the first mismatch is kept in `found`. */
    const marked = (inner: ActionOracle, found: { reason: HaltReason | null }): ActionOracle => (site, event, access) => {
        const out = inner(site, event, access);
        if (out.kind !== 'ok') return out;
        for (const a of out.assignments as ReadonlyArray<SimAssignment & { readonly slot?: true }>) {
            const isSlot = compiled.slots.get(a.element)?.has(a.attr) === true;
            if ((a.slot === true) !== isSlot) {
                found.reason = { kind: 'undeclared', site, element: a.element, attr: a.attr };
                return { kind: 'defect', detail: a.slot === true ? `${a.attr} is no slot of ${a.element}` : `${a.attr} is a slot of ${a.element}, not a state attribute` };
            }
        }
        return out;
    };

    const candidates = (cfg: NetConfiguration, g: GuardOracle): CandidateSet => {
        const cs = netCandidates(net, cfg, g);
        if (policy === 'interleave' || cs.candidates.length === 0) return cs;
        return { ...cs, candidates: [{ transition: DCN_SYNC_SELECTOR, unsafe: null }] };
    };

    const sync = (cfg: NetConfiguration, selector: string | null, g: GuardOracle, a: ActionOracle, derived: Parameters<SimNucleus['step']>[4]): StepOutcome => {
        const cs = netCandidates(net, cfg, g);
        if (cs.candidates.length === 0 || selector === null) return netStep(net, cfg, selector, g, a, derived);
        const real = cs.candidates.map(c => c.transition);
        if (selector !== DCN_SYNC_SELECTOR) {
            const label: NetLabel = { event: cfg.event, selector, candidates: real, evaluated: cs.evaluated, consumed: [], produced: [], assignments: [] };
            return { kind: 'inadmissible', label };
        }
        const chosen = real.map(id => byId.get(id)!);
        const fused: NetTransition = {
            id: DCN_SYNC_SELECTOR,
            origin: chosen.flatMap(t => t.origin),
            preset: [], postset: [], inhibitors: [],
            triggers: cfg.event === null ? [] : [cfg.event],
            guardSites: [],
            elseOf: null,
            actionSites: chosen.flatMap(t => t.actionSites),
        };
        const out = netStep({ ...net, transitions: [fused] }, cfg, DCN_SYNC_SELECTOR, g, a, derived);
        return { ...out, label: { ...out.label, candidates: real, evaluated: cs.evaluated } } as StepOutcome;
    };

    return {
        initial: net.initial,
        net,
        guards,
        actions,
        candidates,
        classify: state => classifyState(m, snapshot, state),
        structuralInputs: state => structuralInputs(net, state),
        terminated: state => terminated(net, state),
        step(cfg, selector, g, a, derived) {
            const found: { reason: HaltReason | null } = { reason: null };
            const checked = marked(a, found);
            let out = policy === 'sync' ? sync(cfg, selector, g, checked, derived) : netStep(net, cfg, selector, g, checked, derived);
            if (out.kind === 'halted' && out.reason.kind === 'action-defect' && found.reason !== null) out = { ...out, reason: found.reason };
            if (out.kind !== 'fired') return out;
            const halt = classifyState(m, snapshot, out.next.state).halt;
            if (halt === null) return out;
            return {
                kind: 'halted', reason: halt, next: { state: cfg.state, event: null },
                label: { ...out.label, consumed: [], produced: [], assignments: [] },
            };
        },
    };
}
