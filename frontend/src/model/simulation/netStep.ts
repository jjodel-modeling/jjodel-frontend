/**
 * netStep — the step of the Petri core (step 3a, spec §4, R-SIM-21, R-SIM-23..30).
 *
 * One cycle, candidates → choice → effect → label, over a net compiled by
 * `netCompile.ts`:
 *
 * - candidates (§4.2): a transition the input accepts, whose preset is
 *   enabled, that no inhibitor blocks and whose guard is true; a terminated
 *   configuration has none (R-SIM-27);
 * - admissibility (§4.3): the selector names a candidate, or is `null` only
 *   when there is none (progress); `null` is then a discard (an event) or
 *   quiescence (ε);
 * - effect (§4.4): M' = M − pre + post, refused as «unsafe» when a place of M'
 *   exceeds k (R-SIM-23: the run stops, it does not saturate); then the actions
 *   of every site, all read on σ and written together, a double assignment or a
 *   value outside its domain halting the run;
 * - status (R-SIM-29): five values on the candidate set.
 *
 * Interleaving (R-SIM-7): one firing per step, chosen by the caller.
 *
 * Pure: guards and actions come through the oracles the caller passes, so the
 * core never evaluates JjEL itself (R-SIM-14). Not wired yet (R-SIM-33).
 */

import type { GuardOutcome } from './guardEvaluator';
import type {
    ActionOracle, Candidate, CandidateSet, CompiledNet, Domain, Evaluation, GuardOracle, HaltReason,
    NetConfiguration, NetLabel, NetRunStatus, NetTransition, SimAssignment, SimState, SimStateAccess, SimValue,
    StepOutcome,
} from './netTypes';

const TRUE: GuardOutcome = { kind: 'true' };
const FALSE: GuardOutcome = { kind: 'false' };

/** The tokens on a place: 0 when absent. */
export function tokens(state: SimState, place: string): number {
    return state.marking.get(place) ?? 0;
}

/** The derived boolean view of the marking (R-SIM-11): a value other than the domain's default, 0. */
export function isMarked(state: SimState, id: string): boolean {
    return tokens(state, id) !== 0;
}

/**
 * The read-only accessor of σ (R-SIM-30). `site` is the element an action is
 * attached to: only its presentation is readable (locality, R-SIM-18); without
 * a site no presentation is.
 */
export function stateAccess(state: SimState, site?: string): SimStateAccess {
    return {
        read: (elementId, attr) => state.attrs.get(elementId)?.get(attr),
        readPresentation: attr => (site === undefined ? undefined : state.presentation.get(site)?.get(attr)),
        isMarked: elementId => isMarked(state, elementId),
        tokens: elementId => tokens(state, elementId),
    };
}

/**
 * R-SIM-27: the marking is not empty and every marked place is final. Never
 * true without the terminal role (R-SIM-28).
 */
export function terminated(net: CompiledNet, state: SimState): boolean {
    const final = net.final;
    if (final === null) return false;
    let any = false;
    for (const [place, n] of state.marking) {
        if (n === 0) continue;
        if (!final.has(place)) return false;
        any = true;
    }
    return any;
}

const INDEX = new WeakMap<CompiledNet, ReadonlyMap<string, NetTransition>>();

function transitionsById(net: CompiledNet): ReadonlyMap<string, NetTransition> {
    let index = INDEX.get(net);
    if (!index) {
        index = new Map(net.transitions.map(t => [t.id, t]));
        INDEX.set(net, index);
    }
    return index;
}

/** ε accepts an untriggered transition; an event, a transition it is among the triggers of (R-SIM-16). */
function accepts(t: NetTransition, event: string | null): boolean {
    return event === null ? t.triggers.length === 0 : t.triggers.includes(event);
}

function presetEnabled(t: NetTransition, state: SimState): boolean {
    return t.preset.every(a => tokens(state, a.place) >= a.weight);
}

/** The conjunction of the guard sites: a defect wins, then false; no site is true (R-SIM-17). */
function guardOf(t: NetTransition, event: string | null, access: SimStateAccess, guards: GuardOracle): GuardOutcome {
    let result = TRUE;
    for (const site of t.guardSites) {
        const g = guards(site, event, access);
        if (g.kind === 'defect') return g;
        if (g.kind === 'false') result = FALSE;
    }
    return result;
}

/** R-SIM-31: not (g1 or … or gn) over the siblings; a defective sibling makes the `else` defective. */
function elseOutcome(net: CompiledNet, t: NetTransition, event: string | null, access: SimStateAccess, guards: GuardOracle): GuardOutcome {
    const index = transitionsById(net);
    let anyTrue = false;
    for (const id of t.elseOf ?? []) {
        const sibling = index.get(id);
        if (!sibling) continue;
        const g = guardOf(sibling, event, access, guards);
        if (g.kind === 'defect') return g;
        if (g.kind === 'true') anyTrue = true;
    }
    return anyTrue ? FALSE : TRUE;
}

/** M' = M − pre + post, and the first postset place above k, if any. Zero entries are dropped. */
function fireMarking(net: CompiledNet, marking: ReadonlyMap<string, number>, t: NetTransition): {
    next: Map<string, number>;
    unsafe: Candidate['unsafe'];
} {
    const next = new Map(marking);
    for (const a of t.preset) next.set(a.place, (next.get(a.place) ?? 0) - a.weight);
    for (const a of t.postset) next.set(a.place, (next.get(a.place) ?? 0) + a.weight);
    let unsafe: Candidate['unsafe'] = null;
    for (const a of t.postset) {
        const value = next.get(a.place) ?? 0;
        if (value > net.bound) { unsafe = { place: a.place, value }; break; }
    }
    for (const [place, n] of [...next]) if (n === 0) next.delete(place);
    return { next, unsafe };
}

/**
 * The candidate set of spec §4.2, in compile order. `evaluated` holds what was
 * asked of every structurally enabled transition: an inhibitor that blocked it,
 * its guard, or its `else`; a transition with no guard is a candidate without
 * an entry there. An unsafe firing stays a candidate, flagged.
 */
export function candidates(net: CompiledNet, cfg: NetConfiguration, guards: GuardOracle): CandidateSet {
    const event = cfg.event;
    const state = cfg.state;
    if (terminated(net, state)) return { event, terminated: true, candidates: [], evaluated: [] };
    const access = stateAccess(state);
    const found: Candidate[] = [];
    const evaluated: Array<{ transition: string; outcome: Evaluation }> = [];
    for (const t of net.transitions) {
        if (!accepts(t, event) || !presetEnabled(t, state)) continue;
        const blocker = t.inhibitors.find(a => tokens(state, a.place) >= a.weight);
        if (blocker) {
            evaluated.push({ transition: t.id, outcome: { kind: 'inhibited', place: blocker.place } });
            continue;
        }
        let g: GuardOutcome;
        if (t.elseOf !== null) {
            g = elseOutcome(net, t, event, access, guards);
            evaluated.push({ transition: t.id, outcome: { kind: 'else', outcome: g } });
        } else {
            g = guardOf(t, event, access, guards);
            if (t.guardSites.length > 0) evaluated.push({ transition: t.id, outcome: g });
        }
        if (g.kind !== 'true') continue;
        found.push({ transition: t.id, unsafe: fireMarking(net, state.marking, t).unsafe });
    }
    return { event, terminated: false, candidates: found, evaluated };
}

/** Spec §4.3: a selector names a candidate; `null` only when there is none (progress). */
export function admissible(cs: CandidateSet, selector: string | null): boolean {
    return selector === null ? cs.candidates.length === 0 : cs.candidates.some(c => c.transition === selector);
}

function inDomain(value: SimValue, domain: Domain | null): boolean {
    if (domain === null) return true;
    switch (domain.kind) {
        case 'boolean': return typeof value === 'boolean';
        case 'range': return typeof value === 'number' && Number.isInteger(value) && value >= domain.min && value <= domain.max;
        case 'enum': return typeof value === 'string' && domain.literals.includes(value);
    }
}

function applyAll(
    space: ReadonlyMap<string, ReadonlyMap<string, SimValue>>, writes: readonly SimAssignment[],
): ReadonlyMap<string, ReadonlyMap<string, SimValue>> {
    if (writes.length === 0) return space;
    const next = new Map<string, ReadonlyMap<string, SimValue>>(space);
    const copied = new Set<string>();
    for (const w of writes) {
        let values = next.get(w.element) as Map<string, SimValue> | undefined;
        if (!copied.has(w.element)) {
            values = new Map(values ?? []);
            next.set(w.element, values);
            copied.add(w.element);
        }
        (values as Map<string, SimValue>).set(w.attr, w.value);
    }
    return next;
}

/**
 * One step (spec §4). A `halted` outcome leaves σ as it was and consumes the
 * event; quiescence returns the input configuration itself; every other
 * outcome has `next.event === null`.
 */
export function step(
    net: CompiledNet, cfg: NetConfiguration, selector: string | null, guards: GuardOracle, actions: ActionOracle,
): StepOutcome {
    const cs = candidates(net, cfg, guards);
    const event = cfg.event;
    const label: NetLabel = {
        event, selector, candidates: cs.candidates.map(c => c.transition), evaluated: cs.evaluated,
        consumed: [], produced: [], assignments: [],
    };
    if (!admissible(cs, selector)) return { kind: 'inadmissible', label };
    if (selector === null) {
        return event === null
            ? { kind: 'quiescence', next: cfg, label }
            : { kind: 'discard', next: { state: cfg.state, event: null }, label };
    }

    const halted = (reason: HaltReason): StepOutcome => ({ kind: 'halted', reason, next: { state: cfg.state, event: null }, label });
    const t = transitionsById(net).get(selector) as NetTransition;
    const { next: marking, unsafe } = fireMarking(net, cfg.state.marking, t);
    if (unsafe) return halted({ kind: 'unsafe', place: unsafe.place, value: unsafe.value, bound: net.bound });

    // One parallel assignment: every right-hand side on σ, then every write together.
    const semantic: SimAssignment[] = [];
    const presentation: SimAssignment[] = [];
    const written = new Set<string>();
    for (const site of t.actionSites) {
        const out = actions(site, event, stateAccess(cfg.state, site.element));
        if (out.kind === 'defect') return halted({ kind: 'action-defect', site, detail: out.detail });
        for (const a of out.assignments) {
            const decl = net.declared.get(a.element)?.get(a.attr);
            if (!decl) return halted({ kind: 'action-defect', site, detail: `'${a.attr}' is not a declared attribute of ${a.element}` });
            const key = `${a.element}\u0000${a.attr}`;
            if (written.has(key)) return halted({ kind: 'double-assignment', element: a.element, attr: a.attr });
            written.add(key);
            if (decl.space === 'semantic' && !inDomain(a.value, decl.domain)) {
                return halted({ kind: 'domain', element: a.element, attr: a.attr, value: a.value });
            }
            (decl.space === 'semantic' ? semantic : presentation).push(a);
        }
    }

    const state: SimState = {
        marking,
        attrs: applyAll(cfg.state.attrs, semantic),
        presentation: applyAll(cfg.state.presentation, presentation),
    };
    return {
        kind: 'fired',
        next: { state, event: null },
        label: { ...label, consumed: t.preset, produced: t.postset, assignments: [...semantic, ...presentation] },
    };
}

/**
 * R-SIM-29. `cfg` is `null` when the model has no run; `halt` is the reason the
 * run stopped, kept by the caller until Reset. `Running` when some input among
 * ε and `alphabet` has a candidate, guards and inhibitors evaluated.
 */
export function netRunStatus(
    net: CompiledNet, cfg: NetConfiguration | null, alphabet: readonly string[], guards: GuardOracle,
    halt: HaltReason | null,
): NetRunStatus {
    if (cfg === null) return 'Not started';
    if (halt !== null) return 'Halted';
    if (terminated(net, cfg.state)) return 'Terminated';
    for (const event of [null, ...alphabet]) {
        if (candidates(net, { state: cfg.state, event }, guards).candidates.length > 0) return 'Running';
    }
    return 'Deadlock';
}

/**
 * The inputs whose button is enabled (R-SIM-16): structural, a transition whose
 * preset is enabled, by its triggers or by ε; guards and inhibitors are not
 * evaluated. Empty when terminated.
 */
export function structuralInputs(net: CompiledNet, state: SimState): { epsilon: boolean; events: ReadonlySet<string> } {
    const events = new Set<string>();
    let epsilon = false;
    if (terminated(net, state)) return { epsilon, events };
    for (const t of net.transitions) {
        if (!presetEnabled(t, state)) continue;
        if (t.triggers.length === 0) epsilon = true;
        for (const e of t.triggers) events.add(e);
    }
    return { epsilon, events };
}

