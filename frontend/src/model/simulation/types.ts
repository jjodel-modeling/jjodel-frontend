/**
 * Simulation core — the data the engine works on (R-SIM-14).
 *
 * Pure types: no React, no store, no import from `components/`. The twin of
 * `model/validation/`: the core takes raw data in and gives data out, and the
 * panel in `components/editor-v2/sim/` supplies the impure side through a
 * `SimModelView` adapter.
 *
 * Slice 0 is behaviour-preserving: these types describe the engine exactly as
 * it runs today (discovery_2026-09-13_simulation_engine_state.md §3-§4), not
 * the computational model it will become (spec §2-§4). Values and the selector
 * are deliberately absent; they enter with the steps that need them. Events
 * entered with step 1 (R-SIM-16, discovery_2026-09-23_sim_step1_events.md).
 */

/**
 * A configuration (spec §2), boolean kind only.
 *
 * `marking` holds the DObject ids of the marked instances, the same ids the
 * run-state singleton has always stored (`simRunState.ts`). `event` is the
 * input event of the next step: the id of an event instance (R-SIM-12), or
 * `null` for the absent event, the ε step. Every step consumes it: the `next`
 * of a step always carries `event: null` (spec §4.4), so the run-state never
 * holds anything but `null` there.
 */
export interface SimConfiguration {
    readonly marking: ReadonlySet<string>;
    readonly event: string | null;
}

/**
 * The role pointers of the STC, as read today from the six flat keys of the M2
 * bag (`simInitial`, `simTerminal`, `simOwnedTransitions`, `simNextState`,
 * `simNode`, `simTransition`, R-SIM-2). Each value is the id of a DClass or of a
 * DReference. `node` and `transition` are optional: the engine does not read
 * them (`ENGINE_ROLE_KEYS` in SimulationPanel.tsx).
 *
 * The event role (step 1, R-SIM-16) is optional too, and all or nothing:
 * `event` (the event metaclass, key `simEvent`) and `trigger` (the reference
 * from the transition to its event instance, key `simTrigger`) are present
 * together or not at all; `eventIdentifier` (the attribute that labels an
 * event, key `simEventIdentifier`) only with them. Without the event role the
 * alphabet is {ε} and the step is the slice 0 step.
 */
export interface StcRoles {
    initial: string;
    terminal: string;
    ownedTransitions: string;
    nextState: string;
    node?: string;
    transition?: string;
    event?: string;
    trigger?: string;
    eventIdentifier?: string;
}

/** The STC as data. One kind today: a boolean marking (R-SIM-9). */
export interface StcDescriptor {
    kind: 'boolean';
    roles: StcRoles;
}

/**
 * What a step did — the first form of the label of spec §4.5, which grows
 * later (event, selector, guard outcomes).
 *
 * `fired`: ids of the transitions that fired. `deactivated`: sources that left
 * the marking. `activated`: targets that entered it. Order follows the
 * iteration order of the marking, then of each source's transitions.
 *
 * `event` and `discarded` are present if and only if the step received an
 * event, so an ε step keeps the slice 0 shape. `discarded` is true when the
 * event fired nothing: the step leaves the marking unchanged (spec §4.3). An ε
 * step that fires nothing is quiescence, not a discard, and carries no flag.
 */
export interface StepLabel {
    fired: string[];
    deactivated: string[];
    activated: string[];
    event?: string;
    discarded?: boolean;
}

/** An event instance as the panel lists it: its id and its display label. */
export interface SimEventInfo {
    readonly id: string;
    readonly label: string;
}

/** The four status strings of the panel, unchanged. */
export type SimRunStatus = 'Not started' | 'Running' | 'Terminated' | 'Deadlock';

/**
 * The read interface the core runs against, so it never touches `idlookup` or
 * L proxies directly. The panel builds one over the store.
 *
 * - `exists(id)`: the element is still in the model.
 * - `isInstanceOf(id, classId)`: the element is an instance of the metaclass.
 *   Which notion of "is a" applies is the adapter's decision, not the core's.
 * - `outgoingTransitions(id)`: ids of the transitions held by the element's
 *   `ownedTransitions` slot; `[]` when there are none.
 * - `transitionTarget(transitionId)`: the id held by the transition's
 *   `nextState` slot, or `null` when unset.
 * - `transitionTriggers(transitionId)` (step 1): the event instances held by
 *   the transition's trigger slot, `[]` when unset. A multi-valued trigger
 *   accepts any of its values. Read by the core only when the STC declares the
 *   event role.
 * - `label(id)` (step 1): the display label of an element, for the event list.
 */
export interface SimModelView {
    exists(id: string): boolean;
    isInstanceOf(id: string, classId: string): boolean;
    outgoingTransitions(id: string): string[];
    transitionTarget(transitionId: string): string | null;
    transitionTriggers?(transitionId: string): string[];
    label?(id: string): string;
}
