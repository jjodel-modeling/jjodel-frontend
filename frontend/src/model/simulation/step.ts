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
 */

import type { SimConfiguration, SimModelView, SimRunStatus, StcDescriptor, StepLabel } from './types';

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
 * One step of the boolean flowchart/state-machine run, fire-all.
 *
 * On a terminal freeze the returned `next` is the input configuration itself
 * and the label is empty.
 */
export function stepFlowchartBoolean(
    config: SimConfiguration,
    stc: StcDescriptor,
    view: SimModelView,
): { next: SimConfiguration; label: StepLabel } {
    const label: StepLabel = { fired: [], deactivated: [], activated: [] };
    const marked = markedInModel(config, view);
    if (marked.some(id => view.isInstanceOf(id, stc.roles.terminal))) {
        return { next: config, label };
    }

    for (const id of marked) {
        const transitions = view.outgoingTransitions(id);
        if (transitions.length === 0) continue;
        for (const t of transitions) {
            label.fired.push(t);
            const target = view.transitionTarget(t);
            if (target !== null && view.exists(target)) label.activated.push(target);
        }
        label.deactivated.push(id);
    }

    return {
        next: { marking: applyStepLabel(config.marking, label.deactivated, label.activated), event: null },
        label,
    };
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
