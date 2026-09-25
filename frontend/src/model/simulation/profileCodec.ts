/**
 * profileCodec — the `simProfile` key of the M2 bag (R-SIM-55).
 *
 * The value is the id of a system profile, or the JSON of a user profile. A bag
 * without the key gets a «Custom» profile rebuilt from the role keys it holds:
 * no migration, no VersionFixer step, as for `simSource` (R-SIM-10). The shape
 * comes from `simArc` (R-SIM-31(4)).
 *
 * Pure: nothing here reads or writes the store.
 */

import { ROLE_CATALOG, ROLE_IDS, roleDescriptor } from './roleCatalog';
import type { RoleId } from './roleCatalog';
import {
    CONTROL_FLOW_DERIVED, EVENT_FROM_TRIGGER, OTHER_SHAPE_GROUP, closureRoles, isSystemProfileId, systemProfile,
} from './simProfiles';
import type { ProfileConstraint, ProfileShape, RoleMode, SimProfile } from './simProfiles';

const SHAPES: readonly string[] = ['controlFlow', 'petri'] satisfies ProfileShape[];
const CONSTRAINTS: readonly string[] = ['noEpsilon', 'deterministic', 'singleToken'] satisfies ProfileConstraint[];

/** The `simProfile` value: the id for a system profile, the JSON otherwise. */
export function encodeProfile(profile: SimProfile): string {
    return profile.system && isSystemProfileId(profile.id) ? profile.id : JSON.stringify(profile);
}

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isRoleId(v: unknown): v is RoleId {
    return typeof v === 'string' && (ROLE_IDS as readonly string[]).includes(v);
}

function readMode(raw: unknown): RoleMode | null {
    if (!isRecord(raw)) return null;
    switch (raw.mode) {
        case 'edit':
            return { mode: 'edit' };
        case 'off':
            return typeof raw.reason === 'string' ? { mode: 'off', reason: raw.reason } : null;
        case 'derived': {
            const { value, from, note } = raw;
            if (typeof note !== 'string') return null;
            if (value !== undefined && !(typeof value === 'number' && Number.isFinite(value))) return null;
            if (from !== undefined && !isRoleId(from)) return null;
            return {
                mode: 'derived',
                note,
                ...(value !== undefined ? { value } : {}),
                ...(from !== undefined ? { from } : {}),
            };
        }
        default:
            return null;
    }
}

/**
 * The profile a `simProfile` value names, or `null` when the value is not a
 * string, names no system profile and is not the JSON of a well-formed user
 * profile (every role with a mode, known shape, constraints and roles). A
 * well-formed profile can still have defects: that is `validateProfile`'s job.
 * Fields a profile does not have are dropped. Never throws.
 */
export function decodeProfile(value: unknown): SimProfile | null {
    if (typeof value !== 'string' || value === '') return null;
    if (isSystemProfileId(value)) return systemProfile(value) ?? null;
    let raw: unknown;
    try {
        raw = JSON.parse(value);
    } catch {
        return null;
    }
    if (!isRecord(raw)) return null;
    const { id, name, system, basedOn, shape, modes, params, constraints, addedRequired } = raw;
    if (typeof id !== 'string' || id === '' || typeof name !== 'string' || system !== false) return null;
    if (basedOn !== undefined && !(typeof basedOn === 'string' && isSystemProfileId(basedOn))) return null;
    if (typeof shape !== 'string' || !SHAPES.includes(shape)) return null;
    if (!isRecord(modes)) return null;
    const decoded = {} as Record<RoleId, RoleMode>;
    for (const r of ROLE_IDS) {
        const mode = readMode(modes[r]);
        if (!mode) return null;
        decoded[r] = mode;
    }
    if (!isRecord(params) || params.selector !== 'list') return null;
    const bound = params.bound;
    if (typeof bound !== 'number' || !Number.isInteger(bound) || bound < 1) return null;
    if (!Array.isArray(constraints) || !constraints.every(c => typeof c === 'string' && CONSTRAINTS.includes(c))) return null;
    if (!Array.isArray(addedRequired) || !addedRequired.every(isRoleId)) return null;
    return {
        id,
        name,
        system: false,
        ...(basedOn !== undefined ? { basedOn } : {}),
        shape: shape as ProfileShape,
        modes: decoded,
        params: { bound, selector: 'list' },
        constraints: constraints as ProfileConstraint[],
        addedRequired,
    };
}

// ---------------------------------------------------------------------------
// «Custom» from a bag without `simProfile`
// ---------------------------------------------------------------------------

export interface InferredProfile {
    readonly profile: SimProfile;
    /** The role keys set in the bag that the profile does not read, in catalog order. */
    readonly ignoredKeys: readonly string[];
}

const EDIT: RoleMode = { mode: 'edit' };
const NOT_BOUND: RoleMode = { mode: 'off', reason: 'Not bound' };

/** A role value: a non-empty string, the filter of stcFromRoles.ts. */
function isSet(bag: Readonly<Record<string, unknown>>, key: string | null): boolean {
    if (key === null) return false;
    const value = bag[key];
    return typeof value === 'string' && value !== '';
}

/** k from `simBound`: an integer ≥ 1 written as digits, else 1 (as netCompile's default). */
function boundOf(raw: unknown): number {
    const n = typeof raw === 'string' && /^\s*\d+\s*$/.test(raw) ? Number(raw) : NaN;
    return Number.isInteger(n) && n >= 1 ? n : 1;
}

/**
 * The «Custom» profile of a bag without `simProfile`. The shape is Petri when
 * `simArc` is set, control flow otherwise. The closure roles of the shape are
 * `edit`; every other role whose key is set is `edit`; the rest is `off`. As in
 * the system profiles of the shape: in control flow Bound and Initial marking
 * are derived, and Event is derived from Trigger when Trigger is bound; in Petri
 * Initial is off. A set key the profile does not read is listed in
 * `ignoredKeys`: a key of the other shape's group, Bound and Initial marking in
 * control flow, Initial in Petri, and a role whose dependency ended up off.
 * The result always validates.
 */
export function inferCustomProfile(bag: Readonly<Record<string, unknown>>): InferredProfile {
    const shape: ProfileShape = isSet(bag, 'simArc') ? 'petri' : 'controlFlow';
    const closure = new Set<RoleId>(closureRoles(shape));
    const other = OTHER_SHAPE_GROUP[shape];
    const modes = {} as Record<RoleId, RoleMode>;
    const ignored = new Set<RoleId>();

    for (const d of ROLE_CATALOG) {
        const set = isSet(bag, d.key);
        const derived = shape === 'controlFlow' ? CONTROL_FLOW_DERIVED[d.id] : undefined;
        if (closure.has(d.id)) {
            modes[d.id] = EDIT;
        } else if (derived) {
            modes[d.id] = derived;
            if (set) ignored.add(d.id);
        } else if (!set) {
            modes[d.id] = NOT_BOUND;
        } else if (d.group === other) {
            modes[d.id] = { mode: 'off', reason: shape === 'controlFlow' ? 'Compiled from control flow' : 'Not used by the Petri shape' };
            ignored.add(d.id);
        } else if (shape === 'petri' && d.id === 'initial') {
            modes[d.id] = { mode: 'off', reason: 'Petri shape uses Initial marking' };
            ignored.add(d.id);
        } else {
            modes[d.id] = EDIT;
        }
    }
    if (modes.trigger.mode === 'edit') modes.event = EVENT_FROM_TRIGGER;

    // A role left without a dependency goes off with it, so that the result validates.
    for (let changed = true; changed;) {
        changed = false;
        for (const d of ROLE_CATALOG) {
            if (modes[d.id].mode === 'off') continue;
            const dep = d.dependsOn.find(r => modes[r].mode === 'off');
            if (!dep) continue;
            modes[d.id] = { mode: 'off', reason: `Needs ${roleDescriptor(dep).label}` };
            if (isSet(bag, d.key)) ignored.add(d.id);
            changed = true;
        }
    }

    const profile: SimProfile = {
        id: 'custom',
        name: 'Custom',
        system: false,
        shape,
        modes,
        params: { bound: shape === 'petri' && modes.bound.mode === 'edit' ? boundOf(bag.simBound) : 1, selector: 'list' },
        constraints: [],
        addedRequired: [],
    };
    const ignoredKeys = ROLE_CATALOG.filter(d => ignored.has(d.id) && d.key !== null).map(d => d.key as string);
    return { profile, ignoredKeys };
}
