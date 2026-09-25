/**
 * netTypes — the data of the Petri core of the simulator (step 3a, R-SIM-21..33).
 *
 * Pure types: no React, no store, no L proxies, no JjEL (R-SIM-14). The core
 * sits beside the committed step (`step.ts`, `types.ts`) and is not wired yet:
 * the panel and the run-state move onto it in 3b, which deletes the old step
 * (R-SIM-33). Evidence and the compilation table:
 * docs/discovery/discovery_2026-09-25_sim_step3_petri_core.md §5.
 *
 * The configuration is (σ, e) (spec §2): σ holds the marking, a natural 0..k
 * per place (R-SIM-23), and the declared state attributes (R-SIM-19); e is the
 * input event of the next step, or `null` for ε. The model M is not here: the
 * net is compiled from it once, and the snapshot of step 2 carries it to the
 * guards (`guardContext.ts`).
 */

import type { SimModelView } from './types';
import type { SimStateReader } from './guardContext';
import type { GuardOutcome } from './guardEvaluator';

// ── σ (R-SIM-19, R-SIM-23) ──────────────────────────────────────────────────

/** A state attribute value. An enumeration literal is its name. */
export type SimValue = boolean | number | string;

/** The finite domain of a semantic attribute (spec §3.2). */
export type Domain =
    | { readonly kind: 'boolean' }
    | { readonly kind: 'range'; readonly min: number; readonly max: number }
    | { readonly kind: 'enum'; readonly literals: readonly string[] };

/**
 * A state attribute, declared in the STC per metaclass (R-SIM-19). `marked`
 * and `tokens` are reserved names (R-SIM-30). `metaclass` is `null` for a
 * global attribute, which lives on the model element (`model.[x]`, R-SIM-18).
 */
export interface StateAttributeDecl {
    readonly name: string;
    /** DClass id: every instance that is a kind of it carries the attribute; `null`: global. */
    readonly metaclass: string | null;
    readonly space: 'semantic' | 'presentation';
    /** Required when semantic; presentation has no finite domain (R-SIM-18). */
    readonly domain: Domain | null;
    readonly initial: SimValue;
}

/** σ, owned by the engine. The marking maps a place to 1..k; an absent place holds 0. */
export interface SimState {
    readonly marking: ReadonlyMap<string, number>;
    /** Element id (the model id for a global) → attribute → value. */
    readonly attrs: ReadonlyMap<string, ReadonlyMap<string, SimValue>>;
    readonly presentation: ReadonlyMap<string, ReadonlyMap<string, SimValue>>;
}

/** (σ, e). `event` is an event instance id, or `null` for ε; every step consumes it. */
export interface NetConfiguration {
    readonly state: SimState;
    readonly event: string | null;
}

/** The read-only accessor of σ (R-SIM-30): step 2's reader plus the count. */
export interface SimStateAccess extends SimStateReader {
    tokens(elementId: string): number;
}

// ── the STC and the view the compiler reads ─────────────────────────────────

/**
 * The STC of the Petri core, from the flat `sim*` keys (R-SIM-2, R-SIM-32).
 * Every role is a pointer. The shape is `petri` exactly when `simArc` is set
 * (R-SIM-31); `bound` is k, default 1 (R-SIM-23); `terminal` is optional
 * (R-SIM-28). The event role is all or nothing, as in `stcFromRoles`.
 */
export interface NetStc {
    readonly shape: 'control-flow' | 'petri';
    readonly bound: number;
    readonly node?: string;
    readonly transition?: string;
    /** The metaclass rule: one token on each instance (the boolean kind). */
    readonly initial?: string;
    /** The integer feature of the initial marking (the natural kind, R-SIM-9, R-SIM-28). */
    readonly initialMarking?: string;
    readonly terminal?: string;
    readonly ownedTransitions?: string;
    readonly source?: string;
    readonly nextState?: string;
    readonly fork?: string;
    readonly join?: string;
    readonly guard?: string;
    readonly arc?: string;
    readonly arcSource?: string;
    readonly arcTarget?: string;
    readonly arcWeight?: string;
    readonly inhibitorArc?: string;
    readonly event?: string;
    readonly trigger?: string;
    readonly eventIdentifier?: string;
}

/**
 * The read interface of the compiler: the committed view plus two readers by
 * feature POINTER, never by name (the 3b adapter implements them with
 * `objectSlots.ts` over the raw lookup). Both answer `[]` for an unset or
 * missing slot, without `null` entries.
 */
export interface NetModelView extends SimModelView {
    references(objectId: string, featureId: string): string[];
    values(objectId: string, featureId: string): unknown[];
}

// ── the compiled net ────────────────────────────────────────────────────────

/** An arc of a transition: a place and a natural weight ≥ 1 (R-SIM-23). */
export interface Arc {
    readonly place: string;
    readonly weight: number;
}

/**
 * Where the actions of a step come from (R-SIM-17): the exit of each place of
 * the preset, the transition's own elements (edges, the Petri transition), the
 * entry of each place of the postset. One parallel assignment for them all.
 */
export interface ActionSite {
    readonly element: string;
    readonly role: 'exit' | 'transition' | 'entry';
}

/**
 * A transition of the net (R-SIM-21). A control-flow edge is one, a fork or a
 * join node fuses its edges into one (R-SIM-22, R-SIM-31), a Petri transition
 * is one.
 */
export interface NetTransition {
    /** The edge id; a fused fork/join: the node id, or `node#edge` when the node has several. */
    readonly id: string;
    /** The M elements compiled into it, in order: for the label and the canvas (3c). */
    readonly origin: readonly string[];
    /** One arc per place, weights summed. */
    readonly preset: readonly Arc[];
    readonly postset: readonly Arc[];
    /** Guard conjuncts `tokens(place) < weight` (R-SIM-24, R-SIM-30). */
    readonly inhibitors: readonly Arc[];
    /** Event instance ids; `[]`: accepted by ε only (R-SIM-16). */
    readonly triggers: readonly string[];
    /** The elements whose guard applies, conjoined; `[]`: no guard, true (R-SIM-17). */
    readonly guardSites: readonly string[];
    /** An explicit `else`: its guard is not (g1 or … or gn) over these siblings (R-SIM-25, R-SIM-31). */
    readonly elseOf: readonly string[] | null;
    readonly actionSites: readonly ActionSite[];
}

export type NetDefectCode =
    | 'no-target' | 'no-source' | 'not-a-place' | 'pseudo-chain' | 'pseudo-open'
    | 'bad-arc' | 'bad-weight' | 'else-twice' | 'initial-over-bound';

/** A compile defect (R-SIM-31): the element never becomes a candidate, and the reason is kept. */
export interface NetDefect {
    readonly element: string;
    readonly code: NetDefectCode;
    readonly message: string;
}

export interface CompiledNet {
    readonly modelId: string;
    readonly places: ReadonlySet<string>;
    /** In compile order. A defective transition is not here, only in `defects`. */
    readonly transitions: readonly NetTransition[];
    /** k (R-SIM-23). */
    readonly bound: number;
    /** F, the places that are a kind of `simTerminal`; `null` when the role is unset (R-SIM-27, R-SIM-28). */
    readonly final: ReadonlySet<string> | null;
    readonly hasEventRole: boolean;
    readonly attributes: readonly StateAttributeDecl[];
    /** Element → attribute → its declaration: what an assignment may target, and in which domain. */
    readonly declared: ReadonlyMap<string, ReadonlyMap<string, StateAttributeDecl>>;
    readonly initial: SimState;
    readonly defects: readonly NetDefect[];
}

// ── the step's oracles: the core stays pure (R-SIM-14) ──────────────────────

/** The guard of one site, evaluated read-only on σ and the frozen M (the 3b bridge wires `guardEvaluator.ts`). */
export type GuardOracle = (site: string, event: string | null, state: SimStateAccess) => GuardOutcome;

export interface SimAssignment {
    readonly element: string;
    readonly attr: string;
    readonly value: SimValue;
}

export type ActionOutcome =
    | { readonly kind: 'ok'; readonly assignments: readonly SimAssignment[] }
    | { readonly kind: 'defect'; readonly detail: string };

/** The actions of one site. Every right-hand side is evaluated on σ, the state BEFORE the step (spec §4.4). */
export type ActionOracle = (site: ActionSite, event: string | null, state: SimStateAccess) => ActionOutcome;

// ── candidates, label, outcome, status (spec §4.2-§4.5) ─────────────────────

export interface Candidate {
    readonly transition: string;
    /** Firing it would put `value` tokens on `place`, above k: choosing it halts (R-SIM-23). */
    readonly unsafe: { readonly place: string; readonly value: number } | null;
}

/** What the evaluation of one structurally enabled transition said. */
export type Evaluation =
    | GuardOutcome
    | { readonly kind: 'inhibited'; readonly place: string }
    | { readonly kind: 'else'; readonly outcome: GuardOutcome };

export interface CandidateSet {
    readonly event: string | null;
    /** A terminated configuration has no candidate by definition (R-SIM-27). */
    readonly terminated: boolean;
    readonly candidates: readonly Candidate[];
    readonly evaluated: ReadonlyArray<{ readonly transition: string; readonly outcome: Evaluation }>;
}

/** The label of a step (spec §4.5): the inputs, every guard evaluated, and what the step did. */
export interface NetLabel {
    readonly event: string | null;
    readonly selector: string | null;
    readonly candidates: readonly string[];
    readonly evaluated: CandidateSet['evaluated'];
    readonly consumed: readonly Arc[];
    readonly produced: readonly Arc[];
    readonly assignments: readonly SimAssignment[];
}

/** Why a run stops (R-SIM-23, spec §3.2, R-SIM-17); the status stays `Halted` until Reset (R-SIM-29). */
export type HaltReason =
    | { readonly kind: 'unsafe'; readonly place: string; readonly value: number; readonly bound: number }
    | { readonly kind: 'domain'; readonly element: string; readonly attr: string; readonly value: SimValue }
    | { readonly kind: 'double-assignment'; readonly element: string; readonly attr: string }
    | { readonly kind: 'action-defect'; readonly site: ActionSite; readonly detail: string };

/**
 * The outcome of a step. `halted` leaves σ as it was and consumes the event;
 * `inadmissible` is a selector the step refuses, with nothing consumed.
 */
export type StepOutcome =
    | { readonly kind: 'fired'; readonly next: NetConfiguration; readonly label: NetLabel }
    | { readonly kind: 'discard' | 'quiescence'; readonly next: NetConfiguration; readonly label: NetLabel }
    | { readonly kind: 'halted'; readonly reason: HaltReason; readonly next: NetConfiguration; readonly label: NetLabel }
    | { readonly kind: 'inadmissible'; readonly label: NetLabel };

/** The five statuses of a run (R-SIM-29). */
export type NetRunStatus = 'Not started' | 'Running' | 'Terminated' | 'Deadlock' | 'Halted';
