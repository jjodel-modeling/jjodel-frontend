/**
 * Simulation core — the data the engine works on (R-SIM-14).
 *
 * Pure types: no React, no store, no import from `components/`. The twin of
 * `model/validation/`: the core takes raw data in and gives data out, and the
 * panel in `components/editor-v2/sim/` supplies the impure side through a
 * `SimModelView` adapter.
 *
 * Step 3b deleted the types of the boolean step (the configuration as a Set,
 * the role descriptor, the step label, the four statuses): the Petri core
 * declares its own in `netTypes.ts`. What stays here is shared with it: the
 * event list of the panel and the read interface of the model, which
 * `NetModelView` extends.
 */

/** An event instance as the panel lists it: its id and its display label. */
export interface SimEventInfo {
    readonly id: string;
    readonly label: string;
}

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
