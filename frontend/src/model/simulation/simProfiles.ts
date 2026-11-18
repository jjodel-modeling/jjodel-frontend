/**
 * simProfiles — the simulation profiles (R-SIM-47, R-SIM-48, R-SIM-49, R-SIM-54).
 *
 * A profile is a name plus, for every role of the catalog, a mode: `edit`,
 * `derived` (a fixed value or a declared source) or `off` (with a reason); plus
 * the parameters and the constraints of R-SIM-49 and the requirements it adds.
 * It restricts the core, it adds no semantics: the engine and the exporter read
 * the resolved roles, never the profile. The required set is computed, not
 * declared: the runnability closure of the shape, which no profile can drop,
 * plus the profile's added requirements.
 *
 * Constraints are identifiers only here; they become the rules of a generated
 * validation viewpoint in a later lane (R-SIM-49). Pure data and functions.
 */

import { ROLE_IDS, roleDescriptor } from './roleCatalog';
import type { RoleGroup, RoleId } from './roleCatalog';

export type ProfileShape = 'controlFlow' | 'petri' | 'dcn';

export type ProfileConstraint = 'noEpsilon' | 'deterministic' | 'singleToken';

export type RoleMode =
    | { readonly mode: 'edit' }
    | { readonly mode: 'derived'; readonly value?: number; readonly from?: RoleId; readonly note: string }
    | { readonly mode: 'off'; readonly reason: string };

export interface ProfileParams {
    /** k (`simBound`, R-SIM-23). */
    readonly bound: number;
    /** The selector policy: the list only, until the trace of step 5 (R-SIM-35). */
    readonly selector: 'list';
}

export const SYSTEM_PROFILE_IDS = [
    'petri', 'flowchart', 'stateMachine', 'extendedStateMachine', 'dfa', 'nfa', 'moore', 'mealy',
    'dynamicClassification',
] as const;

export type SystemProfileId = typeof SYSTEM_PROFILE_IDS[number];

export interface SimProfile {
    readonly id: string;
    readonly name: string;
    readonly system: boolean;
    /** The system profile a user profile was copied from: information, no inheritance. */
    readonly basedOn?: SystemProfileId;
    readonly shape: ProfileShape;
    readonly modes: { readonly [K in RoleId]: RoleMode };
    readonly params: ProfileParams;
    readonly constraints: readonly ProfileConstraint[];
    readonly addedRequired: readonly RoleId[];
}

/** A requirement met by any one of its roles: the control-flow source (R-SIM-10) and initial tokens (R-SIM-56). */
export interface EitherRequirement {
    readonly anyOf: readonly RoleId[];
}

export type RequiredItem = RoleId | EitherRequirement;

/**
 * The runnability closure of each shape (R-SIM-48): not negotiable. The shape
 * is not the genre (R-SIM-56): control flow starts from Initial or from
 * Initial marking. The dcn shape (R-DCN-8) needs a static class, its
 * viewpoints, their dynamic classes and an invariant to classify by.
 */
const CLOSURE: { readonly [S in ProfileShape]: readonly RequiredItem[] } = {
    controlFlow: ['node', 'transition', 'nextState', { anyOf: ['initial', 'initialMarking'] }, { anyOf: ['source', 'ownedTransitions'] }],
    petri: ['node', 'transition', 'arc', 'arcSource', 'arcTarget', 'initialMarking'],
    dcn: ['staticClass', 'viewpoints', 'dynamicClasses', 'invariant'],
};

/**
 * The groups of the other shapes, whose roles a profile keeps off (R-SIM-48,
 * R-SIM-31(4)): control flow and Petri hide each other's group as before, and
 * both hide the dcn group, which hides both (P-2026-11-07-0941). The one list
 * the validator, the codec and the dialog read.
 */
export const OTHER_SHAPE_GROUP: { readonly [S in ProfileShape]: readonly RoleGroup[] } = {
    controlFlow: ['petri', 'dcn'],
    petri: ['controlFlow', 'dcn'],
    dcn: ['controlFlow', 'petri'],
};

/** The shape in a defect message. */
const SHAPE_NAME: { readonly [S in ProfileShape]: string } = {
    controlFlow: 'control-flow',
    petri: 'Petri',
    dcn: 'dynamic-classification',
};

/** A hidden group in a defect message. */
const GROUP_NAME: Readonly<Partial<Record<RoleGroup, string>>> = {
    controlFlow: 'control flow',
    petri: 'Petri net',
    dcn: 'dynamic classification',
};

function rolesOf(item: RequiredItem): readonly RoleId[] {
    return typeof item === 'string' ? [item] : item.anyOf;
}

/** Every role that appears in the closure of `shape`, both sides of the either-item included. */
export function closureRoles(shape: ProfileShape): RoleId[] {
    return CLOSURE[shape].flatMap(rolesOf);
}

// ---------------------------------------------------------------------------
// System profiles (R-SIM-54)
// ---------------------------------------------------------------------------

const EDIT: RoleMode = { mode: 'edit' };

/**
 * k = 1 and one token on each Initial, the control-flow values of the system
 * profiles (R-SIM-28, R-SIM-56). Initial marking is derived from Initial, not
 * a fixed value: it binds only when Initial does.
 */
export const CONTROL_FLOW_DERIVED: Readonly<Partial<Record<RoleId, RoleMode>>> = {
    bound: { mode: 'derived', value: 1, note: 'k = 1' },
    initialMarking: { mode: 'derived', from: 'initial', note: '1 on Initial' },
};

/** The event metaclass is the declared type of Trigger, never copied (R-SIM-38). */
export const EVENT_FROM_TRIGGER: RoleMode = { mode: 'derived', from: 'trigger', note: 'Declared type of Trigger' };

/**
 * A role of the dcn group under the control-flow and Petri shapes, in every
 * system profile of theirs and in their user copies. The codec fills it in for
 * a profile stored before the group existed and leaves it out when it writes
 * one of these shapes, so such a profile re-encodes to the string it was read
 * from (profileCodec.ts).
 */
export const DCN_OFF: Extract<RoleMode, { mode: 'off' }> = { mode: 'off', reason: 'Used by the dynamic-classification shape' };

interface SystemRow {
    id: SystemProfileId;
    name: string;
    shape: ProfileShape;
    active: RoleId[];
    addedRequired?: RoleId[];
    constraints?: ProfileConstraint[];
}

function systemProfileOf(row: SystemRow): SimProfile {
    const on = new Set<RoleId>([...closureRoles(row.shape), ...row.active]);
    const modes = {} as Record<RoleId, RoleMode>;
    for (const r of ROLE_IDS) {
        if (row.shape === 'controlFlow' && CONTROL_FLOW_DERIVED[r]) modes[r] = CONTROL_FLOW_DERIVED[r] as RoleMode;
        else if (on.has(r)) modes[r] = EDIT;
        else if (r === 'event' && on.has('trigger')) modes[r] = EVENT_FROM_TRIGGER;
        else if (row.shape === 'controlFlow' && roleDescriptor(r).group === 'petri') modes[r] = { mode: 'off', reason: 'Compiled from control flow' };
        else if (row.shape !== 'dcn' && roleDescriptor(r).group === 'dcn') modes[r] = DCN_OFF;
        else if (row.shape === 'petri' && r === 'initial') modes[r] = { mode: 'off', reason: 'Petri shape uses Initial marking' };
        else modes[r] = { mode: 'off', reason: `Not used by ${row.name}` };
    }
    return {
        id: row.id,
        name: row.name,
        system: true,
        shape: row.shape,
        modes,
        params: { bound: 1, selector: 'list' },
        constraints: row.constraints ?? [],
        addedRequired: row.addedRequired ?? [],
    };
}

const EVENTS: RoleId[] = ['trigger', 'eventIdentifier'];

/**
 * The dcn group, in edit in «Dynamic classification» (R-DCN-8). The events
 * group stays as in every profile that does not list it: Trigger needs
 * Transition, which the dcn shape has not, and an invocation is an event of the
 * nucleus (discovery 2026-11-06 §3.3, Q6).
 */
const DCN_ROLES: RoleId[] = ROLE_IDS.filter(r => roleDescriptor(r).group === 'dcn');

const SYSTEM_ROWS: readonly SystemRow[] = [
    { id: 'petri', name: 'Petri net (P/T)', shape: 'petri', active: ['arcWeight', 'inhibitorArc', 'bound', 'terminal', 'guard'] },
    {
        id: 'flowchart', name: 'Flowchart / Activity', shape: 'controlFlow',
        active: ['guard', 'terminal', 'activityFinal', 'fork', 'join', 'action', 'entry', 'stateAttributes'],
    },
    {
        id: 'stateMachine', name: 'State machine', shape: 'controlFlow',
        active: [...EVENTS, 'guard', 'terminal'], constraints: ['singleToken'],
    },
    {
        id: 'extendedStateMachine', name: 'Extended state machine', shape: 'controlFlow',
        active: [...EVENTS, 'guard', 'terminal', 'action', 'entry', 'exit', 'stateAttributes'], constraints: ['singleToken'],
    },
    {
        id: 'dfa', name: 'DFA', shape: 'controlFlow', active: [...EVENTS, 'accepting'],
        addedRequired: ['trigger', 'accepting'], constraints: ['singleToken', 'noEpsilon', 'deterministic'],
    },
    {
        id: 'nfa', name: 'NFA', shape: 'controlFlow', active: [...EVENTS, 'accepting'],
        addedRequired: ['trigger', 'accepting'], constraints: ['singleToken'],
    },
    {
        id: 'moore', name: 'Moore machine', shape: 'controlFlow', active: [...EVENTS, 'stateOutput'],
        addedRequired: ['trigger', 'stateOutput'], constraints: ['singleToken', 'noEpsilon', 'deterministic'],
    },
    {
        id: 'mealy', name: 'Mealy machine', shape: 'controlFlow', active: [...EVENTS, 'transitionOutput'],
        addedRequired: ['trigger', 'transitionOutput'], constraints: ['singleToken', 'noEpsilon', 'deterministic'],
    },
    { id: 'dynamicClassification', name: 'Dynamic classification', shape: 'dcn', active: DCN_ROLES },
];

/** The eight system profiles of R-SIM-54 and «Dynamic classification» (R-DCN-8), read-only (R-SIM-47). */
export const SYSTEM_PROFILES: readonly SimProfile[] = SYSTEM_ROWS.map(systemProfileOf);

export function isSystemProfileId(id: string): id is SystemProfileId {
    return (SYSTEM_PROFILE_IDS as readonly string[]).includes(id);
}

export function systemProfile(id: string): SimProfile | undefined {
    return SYSTEM_PROFILES.find(p => p.id === id);
}

// ---------------------------------------------------------------------------
// Required set and defects (R-SIM-48)
// ---------------------------------------------------------------------------

/** The closure of the shape, then the added requirements not already in it. */
export function requiredRoles(profile: SimProfile): RequiredItem[] {
    const out: RequiredItem[] = [...CLOSURE[profile.shape]];
    for (const r of profile.addedRequired) if (!out.includes(r)) out.push(r);
    return out;
}

export type ProfileDefectCode =
    | 'closureRoleOff'
    | 'otherShapeActive'
    | 'dependencyOff'
    | 'derivedWithoutSource'
    | 'derivedFromOff'
    | 'blankName'
    | 'systemName';

export interface ProfileDefect {
    readonly code: ProfileDefectCode;
    /** The roles concerned: the role first, then its dependency; both sides of an either-item. */
    readonly roles: readonly RoleId[];
    readonly message: string;
}

function label(r: RoleId): string {
    return roleDescriptor(r).label;
}

/**
 * The defects of a profile, empty when it is valid. A role is active when it is
 * not `off`. The either-item of the closure is met when one of its roles is
 * active. With one `simProfile` key per metamodel, a user profile's name is
 * unique in the metamodel when it is not a system profile's name.
 */
export function validateProfile(profile: SimProfile): ProfileDefect[] {
    const defects: ProfileDefect[] = [];
    const active = (r: RoleId) => profile.modes[r].mode !== 'off';

    for (const item of CLOSURE[profile.shape]) {
        const roles = rolesOf(item);
        if (roles.some(active)) continue;
        const names = roles.map(label).join(' or ');
        defects.push({ code: 'closureRoleOff', roles, message: `${names} is required by the ${SHAPE_NAME[profile.shape]} shape` });
    }
    const hidden = OTHER_SHAPE_GROUP[profile.shape];
    for (const r of ROLE_IDS) {
        const mode = profile.modes[r];
        if (mode.mode === 'off') continue;
        const group = roleDescriptor(r).group;
        if (hidden.includes(group)) {
            defects.push({ code: 'otherShapeActive', roles: [r], message: `${label(r)} belongs to the ${GROUP_NAME[group]} group` });
        }
        for (const dep of roleDescriptor(r).dependsOn) {
            if (!active(dep)) defects.push({ code: 'dependencyOff', roles: [r, dep], message: `${label(r)} needs ${label(dep)}` });
        }
        if (mode.mode === 'derived' && mode.value === undefined && mode.from === undefined) {
            defects.push({ code: 'derivedWithoutSource', roles: [r], message: `${label(r)} is derived from nothing` });
        }
        if (mode.mode === 'derived' && mode.from !== undefined && !active(mode.from)) {
            defects.push({ code: 'derivedFromOff', roles: [r, mode.from], message: `${label(r)} is derived from ${label(mode.from)}, which is off` });
        }
    }
    const name = profile.name.trim();
    if (!name) defects.push({ code: 'blankName', roles: [], message: 'The profile has no name' });
    else if (!profile.system && SYSTEM_PROFILES.some(p => p.name.trim().toLowerCase() === name.toLowerCase())) {
        defects.push({ code: 'systemName', roles: [], message: `${name} is the name of a system profile` });
    }
    return defects;
}

// ---------------------------------------------------------------------------
// Checkability (R-SIM-48)
// ---------------------------------------------------------------------------

/** The verdict of the binding compatibility check (type, owner, multiplicity), a later lane. */
export type BindingVerdict = 'ok' | 'warn' | 'incompatible';

export type CheckabilityStatus = 'checkable' | 'warnings' | 'notCheckable';

export interface Checkability {
    readonly status: CheckabilityStatus;
    /** The required items not bound, in the order of `requiredRoles`. */
    readonly missing: readonly RequiredItem[];
}

/**
 * Whether the role is bound in the bag. A `derived` role is when it has no
 * source, and when its source (`from`) is bound otherwise (R-SIM-56); a cycle
 * of sources binds nothing. An `off` role is not, even with its key set (the
 * bridge does not read it, R-SIM-55); an `edit` role is when its key holds a
 * non-empty string, the filter of stcFromRoles.ts.
 */
function isBound(
    profile: SimProfile,
    role: RoleId,
    bag: Readonly<Record<string, unknown>>,
    seen: ReadonlySet<RoleId> = new Set(),
): boolean {
    const mode = profile.modes[role];
    if (mode.mode === 'derived') {
        if (mode.from === undefined) return true;
        return !seen.has(mode.from) && isBound(profile, mode.from, bag, new Set([...seen, role]));
    }
    if (mode.mode === 'off') return false;
    const key = roleDescriptor(role).key;
    if (key === null) return false;
    const value = bag[key];
    return typeof value === 'string' && value !== '';
}

/**
 * Checkable when every required item is bound and no binding is incompatible;
 * with warnings when some binding is a warning. `verdicts` absent, or silent on
 * a role, means `ok`.
 */
export function checkability(
    profile: SimProfile,
    bag: Readonly<Record<string, unknown>>,
    verdicts?: Readonly<Partial<Record<RoleId, BindingVerdict>>>,
): Checkability {
    const missing = requiredRoles(profile).filter(item => !rolesOf(item).some(r => isBound(profile, r, bag)));
    const given = Object.values(verdicts ?? {});
    const status: CheckabilityStatus = missing.length > 0 || given.includes('incompatible')
        ? 'notCheckable'
        : given.includes('warn') ? 'warnings' : 'checkable';
    return { status, missing };
}
