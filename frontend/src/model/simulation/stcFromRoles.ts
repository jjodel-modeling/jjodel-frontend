/**
 * stcFromRoles — the STC descriptor from the role bag of the M2 model.
 *
 * Reads the six flat `sim*` keys (R-SIM-2) and keeps a value only when it is a
 * non-empty string, the same filter `mapStateToProps` applies in
 * SimulationPanel.tsx. Returns `null` unless the four keys the engine reads are
 * all set: the rule of `rolesComplete` (`ENGINE_ROLE_KEYS.every(...)`).
 */

import type { StcDescriptor } from './types';

function pointer(state: Record<string, unknown>, key: string): string | undefined {
    const value = state[key];
    return typeof value === 'string' && value ? value : undefined;
}

export function stcFromRoles(state: Record<string, unknown> | undefined): StcDescriptor | null {
    if (!state) return null;
    const initial = pointer(state, 'simInitial');
    const terminal = pointer(state, 'simTerminal');
    const ownedTransitions = pointer(state, 'simOwnedTransitions');
    const nextState = pointer(state, 'simNextState');
    if (!initial || !terminal || !ownedTransitions || !nextState) return null;

    const descriptor: StcDescriptor = {
        kind: 'boolean',
        roles: { initial, terminal, ownedTransitions, nextState },
    };
    const node = pointer(state, 'simNode');
    const transition = pointer(state, 'simTransition');
    if (node) descriptor.roles.node = node;
    if (transition) descriptor.roles.transition = transition;
    return descriptor;
}
