/**
 * JjScript RENAME Command Handler
 * Renames model elements
 */

import {
    RenameArgs,
    ExecutionResult,
    ExecutionContext
} from '../../types';
import { resolveElement } from '../resolvers';
import { qualifiedNameToString, isValidIdentifier } from '../../parser/grammar';
import { getProject } from '../utils';
import { executeRenameInstance } from './instance';

import {
    LProject
} from '../../../joiner';
import { checkM2NameUniqueness, m2KindOf, type UniquenessVerdict } from '../../../model/logicWrapper/nameUniqueness';

// ============================================
// RENAME COMMAND EXECUTOR
// ============================================

export async function executeRename(
    args: RenameArgs,
    context: ExecutionContext
): Promise<ExecutionResult> {
    const { target, newName } = args;

    try {
        // Validate new name
        if (!isValidIdentifier(newName)) {
            return {
                success: false,
                command: 'rename',
                message: `Invalid identifier: '${newName}'`,
                errors: [{
                    code: 'INVALID_NAME',
                    message: 'Name must start with a letter or underscore and contain only letters, numbers, and underscores',
                    suggestion: `Try a name like '${newName.replace(/[^a-zA-Z0-9_]/g, '_')}'`
                }]
            };
        }

        // Get current project
        const project = getProject(context);
        if (!project) {
            return {
                success: false,
                command: 'rename',
                message: 'No active project',
                errors: [{ code: 'NO_PROJECT', message: 'Cannot rename element without an active project' }]
            };
        }

        // M1 routing: 'rename instance X' or any 'rename X' in M1 context targets an instance.
        if (args.elementType === 'instance' || context.level === 'M1') {
            return executeRenameInstance(args, context, project);
        }

        // Resolve the target element
        const element = resolveElement(target, project);
        if (!element) {
            return {
                success: false,
                command: 'rename',
                message: `Element not found: ${qualifiedNameToString(target)}`,
                errors: [{
                    code: 'ELEMENT_NOT_FOUND',
                    message: `Could not find element '${qualifiedNameToString(target)}'`
                }]
            };
        }

        const oldName = element.name;

        // ── Uniqueness (S1-M2): ONE verdict, and no bypass of `set_name` ──────────
        //
        // Until S1-M2 this command carried a rule of its own — `checkNameConflict`,
        // per-kind and case-INSENSITIVE — and then wrote the field directly with
        // `SetFieldAction`, so the core rule in `LPointerTargetable.set_name` never
        // ran on this path. Two rules, and the one that applied depended on which
        // surface the user happened to use.
        //
        // Now: the same `checkM2NameUniqueness` the create and the rename consult,
        // and the write goes through the L-layer setter, which consults it again for
        // the paths that do not come through here. Case-SENSITIVE by decision
        // (R-M2U-1): `dupprobe` next to `DupProbe` is a near-homonym, which is legal
        // and reported, not a conflict. That is a deliberate change of committed
        // behaviour — this command used to refuse it.
        const kind = m2KindOf(element.className);
        const verdict = kind
            ? checkM2NameUniqueness({father: element.father, kind, name: newName, excludeId: element.id})
            : {ok: true} as UniquenessVerdict;
        if (!verdict.ok) {
            return {
                success: false,
                command: 'rename',
                message: `Name conflict: '${newName}' already exists`,
                errors: [{
                    code: 'NAME_CONFLICT',
                    message: verdict.reason as string,
                    suggestion: 'Choose a different name'
                }]
            };
        }

        // Perform rename through the L-layer setter, not a direct SetFieldAction:
        // `set_name` owns the side effects this command has no business rebuilding
        // (LClass re-emits `ClassNameChanged.<id>`, LAttribute re-infers the type).
        try {
            element.name = newName;
        } catch (error) {
            return {
                success: false,
                command: 'rename',
                message: `Failed to rename: ${(error as Error).message}`,
                errors: [{ code: 'RENAME_ERROR', message: (error as Error).message }]
            };
        }

        return {
            success: true,
            command: 'rename',
            message: verdict.warning
                ? `Renamed '${oldName}' to '${newName}' — ${verdict.warning}`
                : `Renamed '${oldName}' to '${newName}'`,
            data: {
                id: element.id,
                oldName,
                newName
            },
            affectedElements: [element.id],
            undoable: true
        };

    } catch (error) {
        const err = error as Error;
        return {
            success: false,
            command: 'rename',
            message: `Failed to rename: ${err.message}`,
            errors: [{ code: 'RENAME_ERROR', message: err.message }]
        };
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// `checkNameConflict` used to live here: a second, per-kind, case-insensitive rule,
// applied on this path only. It was not narrowed or widened — it was REMOVED, and its
// callers now consult `checkM2NameUniqueness` (S1-M2). One rule, one place.
