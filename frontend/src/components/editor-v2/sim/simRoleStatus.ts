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
    | 'simTerminal'
    | 'simTransition'
    | 'simOwnedTransitions'
    | 'simNextState'
    | 'simEvent'
    | 'simTrigger'
    | 'simEventIdentifier';

export type RoleKind = 'class' | 'composition' | 'reference' | 'attribute';

export interface RoleSpec {
    key: RoleKey;
    label: string;
    kind: RoleKind;
    placeholder: string;
}

export const ROLE_SPECS: RoleSpec[] = [
    { key: 'simNode', label: 'Node', kind: 'class', placeholder: 'Select a metaclass' },
    { key: 'simInitial', label: 'Initial', kind: 'class', placeholder: 'Select a metaclass' },
    { key: 'simTerminal', label: 'Terminal', kind: 'class', placeholder: 'Select a metaclass' },
    { key: 'simTransition', label: 'Transition', kind: 'class', placeholder: 'Select a metaclass' },
    { key: 'simOwnedTransitions', label: 'Owned transitions', kind: 'composition', placeholder: 'Select a composition' },
    { key: 'simNextState', label: 'Next state', kind: 'reference', placeholder: 'Select a reference' },
    // The event role (step 1, R-SIM-16): optional, and it exists only when Event
    // and Trigger are both set (stcFromRoles). The identifier only labels the buttons.
    { key: 'simEvent', label: 'Event', kind: 'class', placeholder: 'Select a metaclass' },
    { key: 'simTrigger', label: 'Trigger', kind: 'reference', placeholder: 'Select a reference' },
    { key: 'simEventIdentifier', label: 'Event identifier', kind: 'attribute', placeholder: 'Select an attribute' },
];

/**
 * Roles the ENGINE reads: initial (reset), terminal (termination), the
 * composition of the outgoing transitions and the reference to the next state
 * (step). `simNode` and `simTransition` are declarative in v1 — `simTransition`
 * is configurable but unread in the prototype too (discovery Q2), and the
 * run-state no longer needs `simNode` to know which instances to clear (the
 * singleton is emptied wholesale). Gating the buttons on exactly what the engine
 * reads avoids a panel disabled for a role nothing consumes.
 */
export const ENGINE_ROLE_KEYS: RoleKey[] = ['simInitial', 'simTerminal', 'simOwnedTransitions', 'simNextState'];

export type Roles = Partial<Record<RoleKey, string>>;

// ---------------------------------------------------------------------------
// What is missing
// ---------------------------------------------------------------------------

function labelOf(key: RoleKey): string {
    return ROLE_SPECS.find(spec => spec.key === key)?.label ?? key;
}

/**
 * The labels of the engine roles the bag leaves unset, in ROLE_SPECS order.
 * Empty exactly when `stcFromRoles` builds a descriptor (same four keys, an
 * empty string counts as unset): the run controls show only then.
 */
export function missingEngineRoles(roles: Roles): string[] {
    return ROLE_SPECS
        .filter(spec => ENGINE_ROLE_KEYS.includes(spec.key) && !roles[spec.key])
        .map(spec => spec.label);
}

/**
 * The missing half of a half-set event role: `['Trigger']` when only Event is
 * set, `['Event']` when only Trigger is set, `[]` when both or neither are. A
 * half-set role is no event role at all (`stcFromRoles`): the run starts with
 * the ε step only (R-SIM-16), and the panel says why there are no events.
 */
export function missingEventRoles(roles: Roles): string[] {
    const event = !!roles.simEvent;
    const trigger = !!roles.simTrigger;
    if (event === trigger) return [];
    return [labelOf(event ? 'simTrigger' : 'simEvent')];
}

/** Where the missing roles are to be set: the metamodel by name, or a generic fallback. */
function onMetamodel(metamodelName: string): string {
    return ` on ${metamodelName || 'the metamodel'}`;
}

/** The model face's message, in place of the run controls, when an engine role is missing. */
export function incompleteConfigurationMessage(metamodelName: string, missing: readonly string[]): string {
    return `Simulation not configured. Missing${onMetamodel(metamodelName)}: ${missing.join(', ')}.`;
}

/**
 * The warning line of a half-set event role. The model face names the
 * metamodel; the metamodel face (`metamodelName` null) is the metamodel itself.
 */
export function eventRoleWarning(missing: readonly string[], metamodelName: string | null): string {
    const where = metamodelName === null ? '' : onMetamodel(metamodelName);
    return `Events disabled. Missing${where}: ${missing.join(', ')}.`;
}
