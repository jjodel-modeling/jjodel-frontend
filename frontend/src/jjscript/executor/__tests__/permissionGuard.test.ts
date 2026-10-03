/**
 * JjScript profile guard — a stand-alone environment refuses what its profile does not allow (#168 J5).
 *
 * The table runs every command against the four profiles a viewer can arrive with: none (the
 * language developer), one that grants `edit`, `read` or `hidden` on the type the command
 * touches, and one whose id the project does not hold. Permissions go through
 * `resolveTypePermission`, so the profile here is the D-layer shape it reads
 * (`typePermissions: { [classId]: mode }`).
 *
 * Guard-level tests on purpose, as for `scopeGuard.test.ts`: the executor that resolves the names
 * and calls the guard cannot be imported under `environment: 'node'` (it reaches monaco through
 * `joiner`). The adapter in `executor.ts` is verified by the browser probe of P-2026-10-01-2302.
 */

import { describe, it, expect } from 'vitest';
import { checkCommandPermission, metaclassesNamed } from '../permissionGuard';
import type { GuardCommand, GuardEnvironment, GuardType } from '../permissionGuard';

// ─── fixtures ────────────────────────────────────────────────────────────────

const EDIT: GuardType = { id: 'cls-edit', name: 'Course' };
const READ: GuardType = { id: 'cls-read', name: 'Competency' };
const HIDDEN: GuardType = { id: 'cls-hidden', name: 'Grade' };
const UNLISTED: GuardType = { id: 'cls-unlisted', name: 'Note' };

const PROFILE = {
    id: 'profile-1',
    className: 'DProfile',
    typePermissions: { 'cls-edit': 'edit', 'cls-read': 'read', 'cls-hidden': 'hidden' }
};

const DEVELOPER: GuardEnvironment = { profileId: null, profile: null };
const CONSUMER: GuardEnvironment = { profileId: 'profile-1', profile: PROFILE };
const MISSING: GuardEnvironment = { profileId: 'profile-gone', profile: null };

const create = (...types: GuardType[]): GuardCommand =>
    ({ command: 'create', level: 'M1', elementType: 'instance', creates: types });
const onInstance = (command: 'set' | 'rename' | 'delete', subject: GuardType, extra: Partial<GuardCommand> = {}): GuardCommand =>
    ({ command, level: 'M1', subject, ...extra });

const code = (cmd: GuardCommand, env: GuardEnvironment = CONSUMER) => checkCommandPermission(cmd, env)?.code ?? null;

// ─── the table ───────────────────────────────────────────────────────────────

describe('checkCommandPermission — command × permission', () => {
    const rows: Array<[string, (t: GuardType) => GuardCommand]> = [
        ['create instance', (t) => create(t)],
        ['set', (t) => onInstance('set', t)],
        ['rename', (t) => onInstance('rename', t)],
        ['delete', (t) => onInstance('delete', t)],
    ];

    for (const [label, build] of rows) {
        it(`${label}: edit passes, read and hidden are refused, a type with no override passes`, () => {
            expect(code(build(EDIT))).toBeNull();
            expect(code(build(READ))).toBe('PROFILE_TYPE_LOCKED');
            expect(code(build(HIDDEN))).toBe('PROFILE_TYPE_LOCKED');
            expect(code(build(UNLISTED))).toBeNull();
        });

        it(`${label}: with no profile in the URL everything passes, even a read type`, () => {
            expect(code(build(READ), DEVELOPER)).toBeNull();
            expect(code(build(HIDDEN), DEVELOPER)).toBeNull();
        });

        it(`${label}: a profile the project does not hold refuses, even an edit type`, () => {
            expect(code(build(EDIT), MISSING)).toBe('PROFILE_NOT_FOUND');
        });
    }

    it('the permission is read through resolveTypePermission: an unknown mode counts as edit', () => {
        const odd = { ...PROFILE, typePermissions: { ...PROFILE.typePermissions, 'cls-edit': 'bogus' } };
        expect(checkCommandPermission(create(EDIT), { profileId: 'profile-1', profile: odd })).toBeNull();
    });
});

// ─── messages ────────────────────────────────────────────────────────────────

describe('checkCommandPermission — what the viewer reads', () => {
    it('names the type and the gesture', () => {
        expect(checkCommandPermission(create(READ), CONSUMER)?.message)
            .toBe("You can't create Competency elements in this environment.");
        expect(checkCommandPermission(onInstance('set', READ), CONSUMER)?.message)
            .toBe("You can't change Competency elements in this environment.");
        expect(checkCommandPermission(onInstance('rename', HIDDEN), CONSUMER)?.message)
            .toBe("You can't change Grade elements in this environment.");
        expect(checkCommandPermission(onInstance('delete', READ), CONSUMER)?.message)
            .toBe("You can't delete Competency elements in this environment.");
    });

    it('a change to the language says so, with a way forward', () => {
        const r = checkCommandPermission({ command: 'create', level: 'M2', elementType: 'class' }, CONSUMER);
        expect(r?.message).toBe("This environment doesn't allow changing the language itself.");
        expect(r?.suggestion).toBeTruthy();
    });

    it('a missing profile says changes are off, with a way forward', () => {
        const r = checkCommandPermission(create(EDIT), MISSING);
        expect(r?.message).toBe("This environment's profile can't be found, so changes are turned off.");
        expect(r?.suggestion).toBeTruthy();
    });
});

// ─── links ───────────────────────────────────────────────────────────────────

describe('checkCommandPermission — a set that links to another instance', () => {
    it('a hidden target is refused, with its own code and the target type in the message', () => {
        const r = checkCommandPermission(onInstance('set', EDIT, { linkTarget: HIDDEN }), CONSUMER);
        expect(r?.code).toBe('PROFILE_HIDDEN_TARGET');
        expect(r?.message).toBe("You can't link to Grade elements in this environment.");
    });

    it('CONTROL: a read or edit target passes; the link writes the subject, not the target', () => {
        expect(code(onInstance('set', EDIT, { linkTarget: READ }))).toBeNull();
        expect(code(onInstance('set', EDIT, { linkTarget: EDIT }))).toBeNull();
    });

    it('the subject is checked first: a read subject linking to a hidden target is a type refusal', () => {
        expect(code(onInstance('set', READ, { linkTarget: HIDDEN }))).toBe('PROFILE_TYPE_LOCKED');
    });

    it('a target that did not resolve is refused with the sentence the handler would give', () => {
        const r = checkCommandPermission(
            onInstance('set', EDIT, { linkTarget: { unresolved: "No instance named 'p9' in 'm'" } }), CONSUMER);
        expect(r?.code).toBe('PROFILE_UNRESOLVED');
        expect(r?.message).toBe("No instance named 'p9' in 'm'");
    });
});

// ─── commands outside the instance gestures ──────────────────────────────────

describe('checkCommandPermission — the rest of the language', () => {
    it('the reading commands pass in consumer mode, even when the profile is missing', () => {
        for (const command of ['list', 'show', 'help', 'eval', 'validate']) {
            expect(code({ command, level: 'M1' })).toBeNull();
            expect(code({ command, level: 'M2' }, MISSING)).toBeNull();
        }
    });

    it('a block passes as a container (its commands are checked one by one)', () => {
        expect(code({ command: 'block', level: 'M1' })).toBeNull();
        expect(code({ command: 'block', level: 'M1' }, MISSING)).toBeNull();
    });

    it('the metamodel commands are refused as changes to the language, at any level', () => {
        for (const command of ['add', 'remove', 'move', 'copy', 'extends', 'abstract']) {
            expect(code({ command, level: 'M1' })).toBe('PROFILE_LANGUAGE_LOCKED');
            expect(code({ command, level: 'M2' })).toBe('PROFILE_LANGUAGE_LOCKED');
        }
    });

    it('create of a metamodel element is refused at M1 and at M2', () => {
        expect(code({ command: 'create', level: 'M1', elementType: 'class' })).toBe('PROFILE_LANGUAGE_LOCKED');
        expect(code({ command: 'create', level: 'M2', elementType: 'attribute' })).toBe('PROFILE_LANGUAGE_LOCKED');
    });

    it('set, rename and delete outside M1 write the metamodel and are refused', () => {
        for (const command of ['set', 'rename', 'delete']) {
            expect(code({ command, level: 'M2' })).toBe('PROFILE_LANGUAGE_LOCKED');
            expect(code({ command })).toBe('PROFILE_LANGUAGE_LOCKED');
        }
    });

    it('an explicit metamodel element type at M1 is refused, though the handler would route it to an instance', () => {
        expect(code({ command: 'delete', level: 'M1', elementType: 'class', subject: EDIT })).toBe('PROFILE_LANGUAGE_LOCKED');
        expect(code({ command: 'rename', level: 'M1', elementType: 'attribute', subject: EDIT })).toBe('PROFILE_LANGUAGE_LOCKED');
    });

    it('an explicit instance command with no model in focus is refused as unresolved', () => {
        expect(code({ command: 'create', level: 'M2', elementType: 'instance', creates: [EDIT] })).toBe('PROFILE_UNRESOLVED');
        expect(code({ command: 'delete', level: 'M2', elementType: 'instance' })).toBe('PROFILE_UNRESOLVED');
    });

    it('every other command is refused, an unknown one included', () => {
        for (const command of ['let', 'forall', 'undo', 'redo', 'clear', 'export', 'import', 'frobnicate']) {
            const r = checkCommandPermission({ command, level: 'M1' }, CONSUMER);
            expect(r?.code).toBe('PROFILE_COMMAND_LOCKED');
            expect(r?.message).toBe(`'${command}' isn't available in this environment.`);
        }
    });

    it('CONTROL: the same commands pass in developer mode', () => {
        for (const command of ['let', 'forall', 'undo', 'frobnicate', 'add', 'abstract']) {
            expect(code({ command, level: 'M2' }, DEVELOPER)).toBeNull();
        }
        expect(code({ command: 'create', level: 'M2', elementType: 'class' }, DEVELOPER)).toBeNull();
    });
});

// ─── closed by default ───────────────────────────────────────────────────────

describe('checkCommandPermission — what the caller could not resolve is refused', () => {
    it('a class name that matched nothing, with the handler sentence', () => {
        const r = checkCommandPermission(
            { command: 'create', level: 'M1', elementType: 'instance', creates: { unresolved: "Class 'Corse' not found in metamodel" } },
            CONSUMER);
        expect(r?.code).toBe('PROFILE_UNRESOLVED');
        expect(r?.message).toBe("Class 'Corse' not found in metamodel");
    });

    it('an empty list of classes, or none at all', () => {
        expect(code(create())).toBe('PROFILE_UNRESOLVED');
        expect(code({ command: 'create', level: 'M1', elementType: 'instance' })).toBe('PROFILE_UNRESOLVED');
    });

    it('an instance that did not resolve (absent or ambiguous), with the handler sentence', () => {
        const reason = "Ambiguous instance name 'c1': 2 candidates — Course (a), Course (b). Rename one, or address it from the canvas.";
        for (const command of ['set', 'rename', 'delete'] as const) {
            const r = checkCommandPermission({ command, level: 'M1', subject: { unresolved: reason } }, CONSUMER);
            expect(r?.code).toBe('PROFILE_UNRESOLVED');
            expect(r?.message).toBe(reason);
        }
    });

    it('an instance command with no subject at all', () => {
        expect(code({ command: 'set', level: 'M1' })).toBe('PROFILE_UNRESOLVED');
    });

    it('homonym classes: every class the handler could pick must be edit', () => {
        const readTwin: GuardType = { id: 'cls-read', name: 'Course' };
        expect(code(create(EDIT, readTwin))).toBe('PROFILE_TYPE_LOCKED');
        expect(code(create(readTwin, EDIT))).toBe('PROFILE_TYPE_LOCKED');
        expect(code(create(EDIT, UNLISTED))).toBeNull();
    });
});

// ─── the class walker ────────────────────────────────────────────────────────

describe('metaclassesNamed — every class with the exact name, where the handler looks', () => {
    const cls = (id: string, name: string) => ({ id, name, className: 'DClass' });

    const metamodel = {
        id: 'mm',
        classes: [cls('c-top', 'Course'), cls('c-other', 'Person')],
        packages: [
            {
                id: 'pkg-a',
                classes: [cls('c-a', 'Course'), cls('c-top', 'Course')],
                subpackages: [{ id: 'pkg-a1', classes: [cls('c-a1', 'Course')] }]
            },
            { id: 'pkg-b', classes: [cls('c-b', 'course')], subPackages: [{ id: 'pkg-b1', classes: [cls('c-b1', 'Course')] }] }
        ]
    };

    it('finds the matches at the model level, in packages and in sub-packages, each once', () => {
        const ids = metaclassesNamed(metamodel, 'Course').map((t) => t.id).sort();
        expect(ids).toEqual(['c-a', 'c-a1', 'c-b1', 'c-top']);
    });

    it('compares exactly, as the handler does: a case-only match is not the class', () => {
        expect(metaclassesNamed(metamodel, 'course').map((t) => t.id)).toEqual(['c-b']);
        expect(metaclassesNamed(metamodel, 'COURSE')).toEqual([]);
    });

    it('returns the names it matched, for the message', () => {
        expect(metaclassesNamed(metamodel, 'Person')).toEqual([{ id: 'c-other', name: 'Person' }]);
    });

    it('is total on an empty or absent metamodel', () => {
        expect(metaclassesNamed(null, 'Course')).toEqual([]);
        expect(metaclassesNamed({ id: 'empty' }, 'Course')).toEqual([]);
    });
});
