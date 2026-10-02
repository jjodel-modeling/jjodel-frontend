/**
 * JjScript profile guard (#168 J5)
 *
 * A stand-alone environment (`#/project?id=X&profile=Y`, #157) gives its viewer a profile that
 * says, per metaclass, whether its elements can be edited, only read, or not seen at all
 * (`resolveTypePermission`). The Configurator applies it to its own gestures; this check applies
 * it to every JjScript command, so a script Jodie proposes, or one typed in the console, cannot
 * do what the profile forbids. It runs once per command, before dispatch and before
 * `checkBoundScope`, and only when the URL carries a profile: in developer mode nothing here is
 * consulted.
 *
 * Closed by default. A command is allowed only when it is one of the reading commands, or a
 * `create` / `set` / `rename` / `delete` on M1 instances of types the profile lets the viewer
 * edit. Anything the caller could not resolve to a type is refused, so a handler that learns to
 * find more than this check does still cannot write past it.
 *
 * Pure on purpose: the caller resolves the names (`executor.ts`) and passes the types it found;
 * the only runtime import is `joiner/environmentConfig.ts`, which has none, so the module runs
 * under the bench's `environment: 'node'`, which the executor does not.
 */

import { resolveTypePermission } from '../../joiner/environmentConfig';

export type PermissionRefusalCode =
    | 'PROFILE_NOT_FOUND'
    | 'PROFILE_LANGUAGE_LOCKED'
    | 'PROFILE_COMMAND_LOCKED'
    | 'PROFILE_TYPE_LOCKED'
    | 'PROFILE_HIDDEN_TARGET'
    | 'PROFILE_UNRESOLVED';

export interface PermissionRefusal {
    code: PermissionRefusalCode;
    message: string;
    suggestion?: string;
}

/** A metaclass a command touches: its id, the key of `typePermissions`, and its name for the message. */
export interface GuardType {
    id: string;
    name: string;
}

/** A name the caller could not resolve, with the sentence the handler would have answered. */
export interface GuardUnresolved {
    unresolved: string;
}

/** One command as the caller resolved it. Absent fields on a command that needs them are refused. */
export interface GuardCommand {
    /** `CommandNode.command`. */
    command: string;
    /** `ExecutionContext.level`; anything but 'M1' runs the metamodel handlers. */
    level?: 'M1' | 'M2';
    /** The explicit element type of `create` / `delete` / `rename`, when the command has one. */
    elementType?: string;
    /** `create instance of X` at M1: every metaclass named exactly X (`metaclassesNamed`). */
    creates?: GuardType[] | GuardUnresolved;
    /** `set` / `rename` / `delete` at M1: the exact metaclass of the instance. */
    subject?: GuardType | GuardUnresolved;
    /** `set` at M1 on a reference whose value names an instance: that instance's metaclass. */
    linkTarget?: GuardType | GuardUnresolved;
}

export interface GuardEnvironment {
    /** The `profile` of the URL; null or empty is developer mode. */
    profileId: string | null | undefined;
    /** The profile entity `findProfile` returned for it, or null when the id resolves to nothing. */
    profile: any | null | undefined;
}

/** Commands that never write the model (`docs/discovery/discovery_2026-10-01_168_b_guard.md` §3.2). */
const READING_COMMANDS: ReadonlySet<string> = new Set(['list', 'show', 'help', 'eval', 'validate']);

/** Commands whose every inner command passes through this check again (`executeBlock`). */
const CONTAINER_COMMANDS: ReadonlySet<string> = new Set(['block']);

/** Commands that only ever change the metamodel. */
const LANGUAGE_COMMANDS: ReadonlySet<string> = new Set(['add', 'remove', 'move', 'copy', 'extends', 'abstract']);

/** Commands that, at M1, change instances. */
const INSTANCE_COMMANDS: ReadonlySet<string> = new Set(['create', 'set', 'rename', 'delete']);

const NO_RESOLUTION = 'This change could not be matched to an element of the model, so it was not made.';

/**
 * The refusal for a command the profile does not allow, or `null`.
 *
 * - No profile in the URL: `null`, always (developer mode).
 * - `list`, `show`, `help`, `eval`, `validate` and `block`: allowed, even when the profile is
 *   missing; the commands inside a block are checked one by one.
 * - Profile in the URL but not in the project: every other command is refused.
 * - The metamodel commands, and `create` / `set` / `rename` / `delete` outside M1 or with an
 *   element type other than `instance`: refused as changes to the language.
 * - At M1: `create instance of X` needs every class named X to be `edit`; `set`, `rename` and
 *   `delete` need the instance's exact class to be `edit`; a `set` that links to an instance
 *   needs that instance's class not to be `hidden`.
 * - Every other command (`let`, `forall`, `undo`, `redo`, `clear`, an unknown one): refused.
 */
export function checkCommandPermission(cmd: GuardCommand, env: GuardEnvironment): PermissionRefusal | null {
    if (!env.profileId) return null;
    if (READING_COMMANDS.has(cmd.command) || CONTAINER_COMMANDS.has(cmd.command)) return null;

    if (!env.profile) {
        return {
            code: 'PROFILE_NOT_FOUND',
            message: "This environment's profile can't be found, so changes are turned off.",
            suggestion: 'Open the link to this environment again, or ask whoever shared it for a new one.'
        };
    }

    if (LANGUAGE_COMMANDS.has(cmd.command)) return languageLocked();
    if (!INSTANCE_COMMANDS.has(cmd.command)) {
        return {
            code: 'PROFILE_COMMAND_LOCKED',
            message: `'${cmd.command}' isn't available in this environment.`,
            suggestion: 'Use create, set, rename or delete on the elements this environment lets you change.'
        };
    }

    // `create` always carries an element type; `set` never does; `delete` and `rename` may.
    const onInstances = cmd.command === 'create'
        ? cmd.elementType === 'instance'
        : cmd.elementType === undefined || cmd.elementType === 'instance';
    if (!onInstances) return languageLocked();
    if (cmd.level !== 'M1') {
        // An explicit instance command outside M1 has no model to go to; the rest is the metamodel.
        return cmd.elementType === 'instance'
            ? unresolved('No model is in focus, so this change has nowhere to go.')
            : languageLocked();
    }

    if (cmd.command === 'create') {
        const types = cmd.creates;
        if (!Array.isArray(types)) return unresolved(types?.unresolved ?? NO_RESOLUTION);
        if (types.length === 0) return unresolved(NO_RESOLUTION);
        for (const t of types) {
            if (resolveTypePermission(env.profile, t.id) !== 'edit') return typeLocked('create', t);
        }
        return null;
    }

    const subject = cmd.subject;
    if (!isType(subject)) return unresolved(subject?.unresolved ?? NO_RESOLUTION);
    if (resolveTypePermission(env.profile, subject.id) !== 'edit') {
        return typeLocked(cmd.command === 'delete' ? 'delete' : 'change', subject);
    }

    if (cmd.command === 'set' && cmd.linkTarget !== undefined) {
        const target = cmd.linkTarget;
        if (!isType(target)) return unresolved(target?.unresolved ?? NO_RESOLUTION);
        if (resolveTypePermission(env.profile, target.id) === 'hidden') {
            return {
                code: 'PROFILE_HIDDEN_TARGET',
                message: `You can't link to ${typeName(target)} elements in this environment.`
            };
        }
    }
    return null;
}

/**
 * Every metaclass named exactly `name` in a metamodel.
 *
 * Walks the containers `findMetaclassByName` walks in `commands/instance.ts` (a container's
 * `classes`, then its `subpackages` / `subPackages` and `packages`, depth first, each container
 * once by id), but returns every match instead of the first: the guard then checks them all, so
 * the order in which the handler picks one does not matter. Exact, case-sensitive comparison,
 * as the handler's. A class reached twice is listed once.
 */
export function metaclassesNamed(metamodel: any, name: string): GuardType[] {
    const found: GuardType[] = [];
    const listed = new Set<string>();
    const visited = new Set<string>();
    const stack: any[] = [metamodel];

    while (stack.length > 0) {
        const container = stack.pop();
        if (!container || visited.has(container.id)) continue;
        visited.add(container.id);

        for (const c of (container.classes ?? [])) {
            if (c?.name === name && typeof c.id === 'string' && !listed.has(c.id)) {
                listed.add(c.id);
                found.push({ id: c.id, name: c.name });
            }
        }

        for (const sp of (container.subpackages ?? container.subPackages ?? [])) stack.push(sp);
        for (const p of (container.packages ?? [])) stack.push(p);
    }

    return found;
}

function isType(r: GuardType | GuardUnresolved | undefined): r is GuardType {
    return !!r && typeof (r as GuardType).id === 'string';
}

function typeName(t: GuardType): string {
    return t.name || t.id;
}

function languageLocked(): PermissionRefusal {
    return {
        code: 'PROFILE_LANGUAGE_LOCKED',
        message: "This environment doesn't allow changing the language itself.",
        suggestion: 'You can create and change elements of the types this environment allows.'
    };
}

function typeLocked(verb: 'create' | 'change' | 'delete', t: GuardType): PermissionRefusal {
    return {
        code: 'PROFILE_TYPE_LOCKED',
        message: `You can't ${verb} ${typeName(t)} elements in this environment.`
    };
}

function unresolved(message: string): PermissionRefusal {
    return { code: 'PROFILE_UNRESOLVED', message };
}
