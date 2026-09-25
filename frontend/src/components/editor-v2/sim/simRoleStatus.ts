/**
 * simRoleStatus — the simulation roles, and what the role bag is missing.
 *
 * Pure: no React, no store, no import from the joiner, so these rules run under
 * the node test bench (sim/__tests__/simRoleStatus.test.ts). The role specs,
 * the engine keys and the role types moved here unchanged from
 * SimulationPanel.tsx, which imports them (P-2026-09-24-1005).
 */

// ---------------------------------------------------------------------------
// Roles — flat keys in the M2 bag (R-SIM-2). No nested `sim: {...}` object: the
// bag copy is shallow, a nested mutation would escape actions/undo/re-render.
// ---------------------------------------------------------------------------

export type RoleKey =
    | 'simNode'
    | 'simInitial'
    | 'simInitialMarking'
    | 'simTerminal'
    | 'simBound'
    | 'simTransition'
    | 'simGuard'
    | 'simOwnedTransitions'
    | 'simSource'
    | 'simNextState'
    | 'simFork'
    | 'simJoin'
    | 'simArc'
    | 'simArcSource'
    | 'simArcTarget'
    | 'simArcWeight'
    | 'simInhibitorArc'
    | 'simEvent'
    | 'simTrigger'
    | 'simEventIdentifier';

/** `number`: a value, not a pointer; written as a digit string (`simBound`, R-SIM-37). */
export type RoleKind = 'class' | 'composition' | 'reference' | 'attribute' | 'number';

export interface RoleSpec {
    key: RoleKey;
    label: string;
    kind: RoleKind;
    placeholder: string;
}

export const ROLE_SPECS: RoleSpec[] = [
    { key: 'simNode', label: 'Node', kind: 'class', placeholder: 'Select a metaclass' },
    { key: 'simInitial', label: 'Initial', kind: 'class', placeholder: 'Select a metaclass' },
    // The keys of the Petri core (R-SIM-32, definitive with step 3b, R-SIM-37), and simSource (R-SIM-10).
    { key: 'simInitialMarking', label: 'Initial marking', kind: 'attribute', placeholder: 'Select an attribute' },
    { key: 'simTerminal', label: 'Terminal', kind: 'class', placeholder: 'Select a metaclass' },
    { key: 'simBound', label: 'Bound', kind: 'number', placeholder: '1' },
    { key: 'simTransition', label: 'Transition', kind: 'class', placeholder: 'Select a metaclass' },
    { key: 'simGuard', label: 'Guard', kind: 'attribute', placeholder: 'Select an attribute' },
    { key: 'simOwnedTransitions', label: 'Owned transitions', kind: 'composition', placeholder: 'Select a composition' },
    { key: 'simSource', label: 'Source', kind: 'reference', placeholder: 'Select a reference' },
    { key: 'simNextState', label: 'Next state', kind: 'reference', placeholder: 'Select a reference' },
    { key: 'simFork', label: 'Fork', kind: 'class', placeholder: 'Select a metaclass' },
    { key: 'simJoin', label: 'Join', kind: 'class', placeholder: 'Select a metaclass' },
    { key: 'simArc', label: 'Arc', kind: 'class', placeholder: 'Select a metaclass' },
    { key: 'simArcSource', label: 'Arc source', kind: 'reference', placeholder: 'Select a reference' },
    { key: 'simArcTarget', label: 'Arc target', kind: 'reference', placeholder: 'Select a reference' },
    { key: 'simArcWeight', label: 'Arc weight', kind: 'attribute', placeholder: 'Select an attribute' },
    { key: 'simInhibitorArc', label: 'Inhibitor arc', kind: 'class', placeholder: 'Select a metaclass' },
    // The event role (step 1, R-SIM-16), configured by Trigger alone (R-SIM-38):
    // simEvent is the Trigger's declared type, derived at every read of the bag
    // (withDerivedEventRole, netCompile.ts) and never written. It stays here so
    // mapStateToProps copies the derived value into the roles; the panel does not
    // show it (ROLE_GROUPS). The identifier only labels the buttons, default `name`.
    { key: 'simEvent', label: 'Event', kind: 'class', placeholder: 'Select a metaclass' },
    { key: 'simTrigger', label: 'Trigger', kind: 'reference', placeholder: 'Select a reference' },
    { key: 'simEventIdentifier', label: 'Event identifier', kind: 'attribute', placeholder: 'name (default)' },
];

/**
 * The keys whose presence decides whether the Petri core can run
 * (`netStcFromRoles`, model/simulation/netCompile.ts), `simBound` aside: that
 * one is a value, checked by `invalidEngineRoles`. Terminal is not among them:
 * the role is optional (R-SIM-28), and without it the run ends in Deadlock or
 * never. Which of these a bag needs depends on its shape, Petri exactly when
 * `simArc` is set (R-SIM-31):
 *
 * - control flow: Next state, one of Owned transitions and Source, one of
 *   Initial and Initial marking;
 * - Petri: Node, Transition, Arc source, Arc target, Initial marking.
 */
export const ENGINE_ROLE_KEYS: RoleKey[] = [
    'simNextState', 'simOwnedTransitions', 'simSource', 'simInitial', 'simInitialMarking',
    'simNode', 'simTransition', 'simArc', 'simArcSource', 'simArcTarget',
];

export type Roles = Partial<Record<RoleKey, string>>;

// ---------------------------------------------------------------------------
// What is missing
// ---------------------------------------------------------------------------

function labelOf(key: RoleKey): string {
    return ROLE_SPECS.find(spec => spec.key === key)?.label ?? key;
}

/**
 * What the bag lacks for its shape, in ROLE_SPECS order; a pair either of which
 * will do is one entry, "Owned transitions or Source". An empty string counts as
 * unset. Together with `invalidEngineRoles` empty exactly when `netStcFromRoles`
 * builds an STC (the parity of simRoleStatus.test.ts): the run controls show
 * only then.
 */
export function missingEngineRoles(roles: Roles): string[] {
    if (roles.simArc) {
        const petri: RoleKey[] = ['simNode', 'simInitialMarking', 'simTransition', 'simArcSource', 'simArcTarget'];
        return ROLE_SPECS.filter(spec => petri.includes(spec.key) && !roles[spec.key]).map(spec => spec.label);
    }
    const missing: string[] = [];
    if (!roles.simInitial && !roles.simInitialMarking) missing.push(`${labelOf('simInitial')} or ${labelOf('simInitialMarking')}`);
    if (!roles.simOwnedTransitions && !roles.simSource) missing.push(`${labelOf('simOwnedTransitions')} or ${labelOf('simSource')}`);
    if (!roles.simNextState) missing.push(labelOf('simNextState'));
    return missing;
}

/**
 * The keys set to a value the engine refuses: today `simBound`, which must be a
 * whole number >= 1 written in digits (the rule of `readBound` in netCompile.ts).
 */
export function invalidEngineRoles(roles: Roles): string[] {
    const bound = roles.simBound;
    if (!bound) return [];
    const ok = /^\s*\d+\s*$/.test(bound) && Number(bound) >= 1;
    return ok ? [] : [`${labelOf('simBound')} (a whole number ≥ 1)`];
}

/** Where the missing roles are to be set: the metamodel by name, or a generic fallback. */
function onMetamodel(metamodelName: string): string {
    return ` on ${metamodelName || 'the metamodel'}`;
}

/** The model face's message, in place of the run controls, when an engine role is missing or invalid. */
export function incompleteConfigurationMessage(metamodelName: string, missing: readonly string[]): string {
    return `Simulation not configured. Missing${onMetamodel(metamodelName)}: ${missing.join(', ')}.`;
}

// TODO: cleanup -- no caller since R-SIM-38 (P-2026-09-25-1500): the half-set event role is gone.
/**
 * The warning line of a half-set event role. The model face names the
 * metamodel; the metamodel face (`metamodelName` null) is the metamodel itself.
 */
export function eventRoleWarning(missing: readonly string[], metamodelName: string | null): string {
    const where = metamodelName === null ? '' : onMetamodel(metamodelName);
    return `Events disabled. Missing${where}: ${missing.join(', ')}.`;
}
