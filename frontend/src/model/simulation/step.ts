/**
 * The step of the simulation, as it runs today (slice 0, behaviour-preserving).
 *
 * Moved out of the React handlers of SimulationPanel.tsx (Reset, Step and the
 * status line) without changing what they do, so that the next slices change a
 * tested function instead of a handler. The semantics is the committed one,
 * quirks included (discovery_2026-09-13_simulation_engine_state.md §4):
 *
 * - every outgoing transition of every marked instance fires in one step (the
 *   fire-all that R-SIM-7 replaces in step 3, not here);
 * - any marked terminal freezes the whole run;
 * - a marked instance with no outgoing transition stays marked;
 * - a source is deactivated even when all its targets dangle, so its token
 *   vanishes;
 * - deactivations apply before activations: activation wins on an id in both.
 *
 * Step 1 (R-SIM-16, option (a) of discovery_2026-09-23_sim_step1_events.md):
 * the input event restricts that same fire-all to the transitions it accepts.
 * A transition is accepted when the input event is among the values of its
 * trigger, by identity: an event is an instance, not a type (R-SIM-12); a
 * multi-valued trigger accepts any of its values. The ε step (`event: null`)
 * accepts the transitions without a trigger. Without the event role no
 * transition has a trigger, so ε accepts them all and the step is the slice 0
 * step. The engine is total: an event that fires nothing is a discard, a step
 * with the marking unchanged, recorded in the label. Interleaving with a
 * selector replaces the fire-all in step 3 (R-SIM-7), for ε and events alike.
 */

import type { SimConfiguration, SimEventInfo, SimModelView, SimRunStatus, StcDescriptor, StepLabel } from './types';

/**
 * Applies the effect of a label to a marking: the ids in `deactivated` leave,
 * then the ids in `activated` enter, so activation wins on an id present in
 * both (self-loop, or a state re-entered by another firing transition). Ids
 * not mentioned stay as they are, including ids no longer in the model.
 *
 * The single place of this rule: the run-state store applies a step through it
 * as well.
 */
export function applyStepLabel(
    marking: ReadonlySet<string>,
    deactivated: readonly string[],
    activated: readonly string[],
): Set<string> {
    const next = new Set(marking);
    for (const id of deactivated) next.delete(id);
    for (const id of activated) next.add(id);
    return next;
}

/** Marked ids still present in the model, in marking order. */
function markedInModel(config: SimConfiguration, view: SimModelView): string[] {
    return [...config.marking].filter(id => view.exists(id));
}

/** The event role is declared: both pointers set, as `stcFromRoles` guarantees. */
function hasEventRole(stc: StcDescriptor): boolean {
    return !!(stc.roles.event && stc.roles.trigger);
}

/**
 * The triggers of a transition: event instance ids, `[]` when it has none.
 * Without the event role the view is never asked, so every transition is
 * untriggered, whatever the model holds.
 */
function triggersOf(stc: StcDescriptor, view: SimModelView, transitionId: string): string[] {
    if (!hasEventRole(stc) || !view.transitionTriggers) return [];
    return view.transitionTriggers(transitionId);
}

/** The input accepts the transition: ε an untriggered one, an event one it is among the triggers of. */
function accepts(stc: StcDescriptor, view: SimModelView, transitionId: string, event: string | null): boolean {
    const triggers = triggersOf(stc, view, transitionId);
    return event === null ? triggers.length === 0 : triggers.includes(event);
}

/** Any marked instance is terminal: the freeze of the step, 'Terminated' of the status. */
function anyTerminal(marked: readonly string[], stc: StcDescriptor, view: SimModelView): boolean {
    return marked.some(id => view.isInstanceOf(id, stc.roles.terminal));
}

/**
 * Reset: every instance of the initial metaclass among `ids` is marked.
 * `ids` are the DObject ids of the model; which ids belong to the model is the
 * caller's reading of the store.
 */
export function initialConfiguration(stc: StcDescriptor, view: SimModelView, ids: readonly string[]): SimConfiguration {
    return {
        marking: new Set(ids.filter(id => view.isInstanceOf(id, stc.roles.initial))),
        event: null,
    };
}

/**
 * One step of the boolean flowchart/state-machine run, fire-all over the
 * transitions the input event accepts (`config.event`, `null` for ε).
 *
 * On a terminal freeze of an ε step the returned `next` is the input
 * configuration itself and the label is empty; an event on a frozen run is
 * consumed and discarded.
 */
export function stepFlowchartBoolean(
    config: SimConfiguration,
    stc: StcDescriptor,
    view: SimModelView,
): { next: SimConfiguration; label: StepLabel } {
    const label: StepLabel = { fired: [], deactivated: [], activated: [] };
    const event = config.event;
    const marked = markedInModel(config, view);
    if (marked.some(id => view.isInstanceOf(id, stc.roles.terminal))) {
        if (event === null) return { next: config, label };
        return { next: { marking: config.marking, event: null }, label: { ...label, event, discarded: true } };
    }

    for (const id of marked) {
        const transitions = view.outgoingTransitions(id).filter(t => accepts(stc, view, t, event));
        if (transitions.length === 0) continue;
        for (const t of transitions) {
            label.fired.push(t);
            const target = view.transitionTarget(t);
            if (target !== null && view.exists(target)) label.activated.push(target);
        }
        label.deactivated.push(id);
    }

    if (event !== null) {
        label.event = event;
        label.discarded = label.fired.length === 0;
    }
    return {
        next: { marking: applyStepLabel(config.marking, label.deactivated, label.activated), event: null },
        label,
    };
}

/**
 * The event alphabet: the instances of the event metaclass among `ids`, with
 * their labels, sorted by label and then by id. `[]` without the event role.
 * `ids` are the DObject ids of the model, as for `initialConfiguration`.
 */
export function eventAlphabet(stc: StcDescriptor, view: SimModelView, ids: readonly string[]): SimEventInfo[] {
    const eventClass = stc.roles.event;
    if (!hasEventRole(stc) || !eventClass) return [];
    return ids
        .filter(id => view.isInstanceOf(id, eventClass))
        .map(id => ({ id, label: view.label ? view.label(id) : id }))
        .sort((a, b) => a.label.localeCompare(b.label) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/**
 * The events whose button is enabled (R-SIM-16): the triggers of the
 * transitions leaving a marked instance, every value of a multi-valued one.
 * Structural: guards are not evaluated.
 * Empty on a terminal freeze, where any event is a no-op, and without the event
 * role.
 */
export function enabledEvents(config: SimConfiguration, stc: StcDescriptor, view: SimModelView): Set<string> {
    const enabled = new Set<string>();
    if (!hasEventRole(stc)) return enabled;
    const marked = markedInModel(config, view);
    if (anyTerminal(marked, stc, view)) return enabled;
    for (const id of marked) {
        for (const t of view.outgoingTransitions(id)) {
            for (const trigger of triggersOf(stc, view, t)) enabled.add(trigger);
        }
    }
    return enabled;
}

/**
 * Whether the ε step (the Step button) is enabled. Without the event role, the
 * slice 0 rule: disabled only on a terminal freeze. With it, also structural:
 * enabled when a transition without a trigger leaves a marked instance.
 */
export function epsilonEnabled(config: SimConfiguration, stc: StcDescriptor, view: SimModelView): boolean {
    const marked = markedInModel(config, view);
    if (anyTerminal(marked, stc, view)) return false;
    if (!hasEventRole(stc)) return true;
    return marked.some(id => view.outgoingTransitions(id).some(t => accepts(stc, view, t, null)));
}

/**
 * The status line, derived from the configuration, never stored:
 * 'Not started' when nothing in the model is marked; 'Terminated' when any
 * marked instance is terminal; 'Deadlock' when ANY marked instance has no
 * outgoing transition, even if others can still progress; 'Running' otherwise.
 */
export function runStatus(config: SimConfiguration, stc: StcDescriptor, view: SimModelView): SimRunStatus {
    const marked = markedInModel(config, view);
    if (marked.length === 0) return 'Not started';
    if (marked.some(id => view.isInstanceOf(id, stc.roles.terminal))) return 'Terminated';
    const stuck = marked.some(id => view.outgoingTransitions(id).length === 0);
    return stuck ? 'Deadlock' : 'Running';
}
