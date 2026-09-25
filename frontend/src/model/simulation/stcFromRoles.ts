/**
 * stcFromRoles — the STC descriptor from the role bag of the M2 model.
 *
 * Reads the six flat `sim*` keys (R-SIM-2) and keeps a value only when it is a
 * non-empty string, the same filter `mapStateToProps` applies in
 * SimulationPanel.tsx. Returns `null` unless the four keys the engine reads are
 * all set: the rule of `rolesComplete` (`ENGINE_ROLE_KEYS.every(...)`).
 *
 * Step 1 adds three optional keys for the event role (R-SIM-16): `simEvent`,
 * `simTrigger`, `simEventIdentifier`. The role exists only when `simEvent` and
 * `simTrigger` are both set; one of them alone is no event role at all.
 */

import { classIsKindOf } from './isKindOf';
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
    const event = pointer(state, 'simEvent');
    const trigger = pointer(state, 'simTrigger');
    if (event && trigger) {
        descriptor.roles.event = event;
        descriptor.roles.trigger = trigger;
        const eventIdentifier = pointer(state, 'simEventIdentifier');
        if (eventIdentifier) descriptor.roles.eventIdentifier = eventIdentifier;
    }
    return descriptor;
}

/**
 * The four sorts of elements the metaclass roles select. Initial, terminal,
 * fork and join are nodes: a subclass of the node metaclass playing them is the
 * norm, not an overlap. An inhibitor arc is an arc (step 3b, R-SIM-37).
 */
const ROLE_SORTS: ReadonlyArray<{ sort: string; keys: readonly string[] }> = [
    { sort: 'node', keys: ['simNode', 'simInitial', 'simTerminal', 'simFork', 'simJoin'] },
    { sort: 'transition', keys: ['simTransition'] },
    { sort: 'arc', keys: ['simArc', 'simInhibitorArc'] },
    { sort: 'event', keys: ['simEvent'] },
];

/** A class that would play roles of two sorts or more, with those sorts. */
export interface RoleOverlap {
    classId: string;
    sorts: string[];
}

/**
 * The disjointness of the STC roles (R-SIM-16): no class may be a kind of the
 * metaclasses of two sorts, under the same "is a" as the engine (R-SIM-8).
 * Covers the same class in two roles, one role's class a subclass of another's,
 * and a class inheriting from both through several `extends`.
 *
 * `roles` is a flat role bag (the set keys only count); `classIds` are the
 * classes to test, the concrete classes of the metamodel. The role classes
 * themselves are always tested, and first, so that the overlap reported names
 * the class the user picked when it is one. Returns the first overlap, or `null`.
 */
export function roleOverlaps(
    lookup: Record<string, any>,
    roles: Record<string, unknown>,
    classIds: readonly string[],
): RoleOverlap | null {
    const sorts = ROLE_SORTS.map(({ sort, keys }) => ({
        sort,
        classes: keys.map(k => pointer(roles, k)).filter((c): c is string => !!c),
    }));
    const candidates = new Set<string>();
    for (const s of sorts) for (const c of s.classes) candidates.add(c);
    for (const c of classIds) candidates.add(c);
    for (const classId of candidates) {
        const hit = sorts
            .filter(s => s.classes.some(c => classIsKindOf(lookup, classId, c)))
            .map(s => s.sort);
        if (hit.length > 1) return { classId, sorts: hit };
    }
    return null;
}

/**
 * What a run start or a role save does with the role overlaps (R-SIM-16). With
 * the event role declared (`simEvent` and `simTrigger` both set), or the Petri
 * shape (`simArc` set, R-SIM-37), any overlap refuses. Otherwise an overlap is a
 * warning and the run starts, or the role is saved, as in slice 0: the parity of
 * R-SIM-16 covers the control-flow metamodels configured before step 1. `null`
 * when the roles are disjoint.
 */
export function overlapVerdict(
    lookup: Record<string, any>,
    roles: Record<string, unknown>,
    classIds: readonly string[],
): { overlap: RoleOverlap; refuse: boolean } | null {
    const overlap = roleOverlaps(lookup, roles, classIds);
    if (!overlap) return null;
    return { overlap, refuse: !!((pointer(roles, 'simEvent') && pointer(roles, 'simTrigger')) || pointer(roles, 'simArc')) };
}

/**
 * The verdict of a role save, judged on the roles as they will stand after it:
 * `value` replaces the key, `''` clears it. So adding the event role to a
 * metamodel whose node and transition roles already overlap is refused, and
 * clearing `simTrigger` on one turns the refusal into a warning.
 */
export function roleWriteVerdict(
    lookup: Record<string, any>,
    roles: Record<string, unknown>,
    key: string,
    value: string,
    classIds: readonly string[],
): { overlap: RoleOverlap; refuse: boolean } | null {
    return overlapVerdict(lookup, { ...roles, [key]: value === '' ? undefined : value }, classIds);
}
