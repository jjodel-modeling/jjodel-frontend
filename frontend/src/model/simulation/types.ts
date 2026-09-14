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
 * the computational model it will become (spec §2-§4). Values, events and the
 * selector are deliberately absent; they enter with the steps that need them.
 */

/**
 * A configuration (spec §2), boolean kind only.
 *
 * `marking` holds the DObject ids of the marked instances, the same ids the
 * run-state singleton has always stored (`simRunState.ts`). `event` is a
 * placeholder typed `null` until step 1 of the plan: no event exists yet.
 */
export interface SimConfiguration {
    readonly marking: ReadonlySet<string>;
    readonly event: null;
}

/**
 * The role pointers of the STC, as read today from the six flat keys of the M2
 * bag (`simInitial`, `simTerminal`, `simOwnedTransitions`, `simNextState`,
 * `simNode`, `simTransition`, R-SIM-2). Each value is the id of a DClass or of a
 * DReference. `node` and `transition` are optional: the engine does not read
 * them (`ENGINE_ROLE_KEYS` in SimulationPanel.tsx).
 */
export interface StcRoles {
    initial: string;
    terminal: string;
    ownedTransitions: string;
    nextState: string;
    node?: string;
    transition?: string;
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
 */
export interface StepLabel {
    fired: string[];
    deactivated: string[];
    activated: string[];
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
 */
export interface SimModelView {
    exists(id: string): boolean;
    isInstanceOf(id: string, classId: string): boolean;
    outgoingTransitions(id: string): string[];
    transitionTarget(transitionId: string): string | null;
}
