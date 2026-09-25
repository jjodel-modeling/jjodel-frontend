/**
 * roleCatalog — the one catalog of the simulation roles (R-SIM-47).
 *
 * The superset of every role a profile can select: each role has a group, the
 * flat `sim*` key of the M2 bag it reads (R-SIM-2), the kind of element it
 * binds and the roles it depends on (memo table «Catalogo e dipendenze»). A
 * profile (simProfiles.ts) picks a mode for each role; it adds no semantics.
 *
 * `simAccepting`, `simActivityFinal`, `simAction`, `simEntry`, `simExit`,
 * `simStateOutput` and `simTransitionOutput` are new and provisional (R-SIM-52):
 * nothing reads or writes them yet. `simEvent` is not here: the event metaclass
 * is the declared type of Trigger, derived on every read (R-SIM-38).
 *
 * Pure data: no React, no store.
 */

export const ROLE_IDS = [
    'node', 'initial', 'initialMarking', 'terminal', 'accepting', 'activityFinal', 'bound', 'transition',
    'ownedTransitions', 'source', 'nextState', 'fork', 'join',
    'arc', 'arcSource', 'arcTarget', 'arcWeight', 'inhibitorArc',
    'trigger', 'event', 'eventIdentifier',
    'guard', 'action', 'entry', 'exit', 'stateAttributes',
    'stateOutput', 'transitionOutput',
] as const;

export type RoleId = typeof ROLE_IDS[number];

export type RoleGroup = 'general' | 'controlFlow' | 'petri' | 'events' | 'data' | 'output';

/**
 * What a role binds. `int` is a value, not a pointer (`simBound`, a digit
 * string); `derived` has no key of its own (event, from trigger);
 * `declarations` is a table per metaclass (R-SIM-19), not a binding.
 */
export type RoleBindingKind =
    | 'class'
    | 'reference'
    | 'attribute'
    | 'intAttribute'
    | 'expressionAttribute'
    | 'actionListAttribute'
    | 'int'
    | 'derived'
    | 'declarations';

export interface RoleDescriptor {
    readonly id: RoleId;
    readonly group: RoleGroup;
    /** The bag key, `null` for a role with no key of its own. */
    readonly key: string | null;
    readonly kind: RoleBindingKind;
    readonly dependsOn: readonly RoleId[];
    readonly label: string;
    readonly description: string;
}

const DESCRIPTORS: { readonly [K in RoleId]: Omit<RoleDescriptor, 'id'> } = {
    node: {
        group: 'general', key: 'simNode', kind: 'class', dependsOn: [], label: 'Node',
        description: 'The metaclass whose instances are the places that hold tokens.',
    },
    initial: {
        group: 'general', key: 'simInitial', kind: 'class', dependsOn: ['node'], label: 'Initial',
        description: 'The node metaclass whose instances hold a token at the start.',
    },
    initialMarking: {
        group: 'general', key: 'simInitialMarking', kind: 'intAttribute', dependsOn: ['node'], label: 'Initial marking',
        description: 'The integer attribute of a node that gives its tokens at the start.',
    },
    terminal: {
        group: 'general', key: 'simTerminal', kind: 'class', dependsOn: ['node'], label: 'Terminal',
        description: 'The node metaclass of the flow finals: the run terminates when every token is in one.',
    },
    accepting: {
        group: 'general', key: 'simAccepting', kind: 'class', dependsOn: ['node'], label: 'Accepting',
        description: 'The node metaclass of the accepting states: a marked one accepts without stopping the run.',
    },
    activityFinal: {
        group: 'general', key: 'simActivityFinal', kind: 'class', dependsOn: ['node'], label: 'Activity final',
        description: 'The node metaclass whose marked instance terminates the run, other tokens aside.',
    },
    bound: {
        group: 'general', key: 'simBound', kind: 'int', dependsOn: [], label: 'Bound',
        description: 'k, the most tokens a place may hold.',
    },
    transition: {
        group: 'general', key: 'simTransition', kind: 'class', dependsOn: [], label: 'Transition',
        description: 'The metaclass whose instances are the edges that fire.',
    },
    ownedTransitions: {
        group: 'controlFlow', key: 'simOwnedTransitions', kind: 'reference', dependsOn: ['node', 'transition'], label: 'Owned transitions',
        description: 'The containment from a node to its outgoing transitions, the source when Source is not bound.',
    },
    source: {
        group: 'controlFlow', key: 'simSource', kind: 'reference', dependsOn: ['transition'], label: 'Source',
        description: 'The reference from a transition to the nodes it leaves.',
    },
    nextState: {
        group: 'controlFlow', key: 'simNextState', kind: 'reference', dependsOn: ['transition'], label: 'Next state',
        description: 'The reference from a transition to the nodes it enters.',
    },
    fork: {
        group: 'controlFlow', key: 'simFork', kind: 'class', dependsOn: ['node'], label: 'Fork',
        description: 'The node metaclass whose transitions fuse into one step with several targets.',
    },
    join: {
        group: 'controlFlow', key: 'simJoin', kind: 'class', dependsOn: ['node'], label: 'Join',
        description: 'The node metaclass whose transitions fuse into one step with several sources.',
    },
    arc: {
        group: 'petri', key: 'simArc', kind: 'class', dependsOn: [], label: 'Arc',
        description: 'The metaclass of the arcs between places and transitions.',
    },
    arcSource: {
        group: 'petri', key: 'simArcSource', kind: 'reference', dependsOn: ['arc'], label: 'Arc source',
        description: 'The reference from an arc to the element it leaves.',
    },
    arcTarget: {
        group: 'petri', key: 'simArcTarget', kind: 'reference', dependsOn: ['arc'], label: 'Arc target',
        description: 'The reference from an arc to the element it enters.',
    },
    arcWeight: {
        group: 'petri', key: 'simArcWeight', kind: 'intAttribute', dependsOn: ['arc'], label: 'Arc weight',
        description: 'The integer attribute of an arc that gives its weight.',
    },
    inhibitorArc: {
        group: 'petri', key: 'simInhibitorArc', kind: 'class', dependsOn: ['arc'], label: 'Inhibitor arc',
        description: 'The arc metaclass whose arcs from a place disable a transition while the place is marked.',
    },
    trigger: {
        group: 'events', key: 'simTrigger', kind: 'reference', dependsOn: ['transition'], label: 'Trigger',
        description: 'The reference from a transition to the events that enable it.',
    },
    event: {
        group: 'events', key: null, kind: 'derived', dependsOn: ['trigger'], label: 'Event',
        description: 'The event metaclass, the declared type of Trigger.',
    },
    eventIdentifier: {
        group: 'events', key: 'simEventIdentifier', kind: 'attribute', dependsOn: ['trigger'], label: 'Event identifier',
        description: 'The attribute that names an event, in place of its name.',
    },
    guard: {
        group: 'data', key: 'simGuard', kind: 'expressionAttribute', dependsOn: ['transition'], label: 'Guard',
        description: 'The Expression attribute of a transition that must hold for it to fire.',
    },
    action: {
        group: 'data', key: 'simAction', kind: 'actionListAttribute', dependsOn: ['transition'], label: 'Action',
        description: 'The Action attribute of a transition, run when it fires.',
    },
    entry: {
        group: 'data', key: 'simEntry', kind: 'actionListAttribute', dependsOn: ['node'], label: 'Entry',
        description: 'The Action attribute of a node, run when a token enters it.',
    },
    exit: {
        group: 'data', key: 'simExit', kind: 'actionListAttribute', dependsOn: ['node'], label: 'Exit',
        description: 'The Action attribute of a node, run when a token leaves it.',
    },
    stateAttributes: {
        group: 'data', key: null, kind: 'declarations', dependsOn: [], label: 'State attributes',
        description: 'The state attributes declared per metaclass, with their domain and initial value.',
    },
    stateOutput: {
        group: 'output', key: 'simStateOutput', kind: 'attribute', dependsOn: ['node'], label: 'State output',
        description: 'The attribute of a node read as the output of the marked state.',
    },
    transitionOutput: {
        group: 'output', key: 'simTransitionOutput', kind: 'attribute', dependsOn: ['transition'], label: 'Transition output',
        description: 'The attribute of a transition read as the output of its firing.',
    },
};

/** The catalog, in the order of the memo table. */
export const ROLE_CATALOG: readonly RoleDescriptor[] = ROLE_IDS.map(id => ({ id, ...DESCRIPTORS[id] }));

const BY_KEY: ReadonlyMap<string, RoleId> = new Map(
    ROLE_CATALOG.filter(d => d.key !== null).map(d => [d.key as string, d.id]),
);

export function roleDescriptor(id: RoleId): RoleDescriptor {
    return { id, ...DESCRIPTORS[id] };
}

/** The role that reads `key`, `undefined` for a key outside the catalog (`simEvent` among them). */
export function roleOfKey(key: string): RoleId | undefined {
    return BY_KEY.get(key);
}

/** The roles that depend directly on `id`, in catalog order. */
export function dependentsOf(id: RoleId): RoleId[] {
    return ROLE_CATALOG.filter(d => d.dependsOn.includes(id)).map(d => d.id);
}
