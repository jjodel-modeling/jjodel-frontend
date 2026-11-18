/**
 * JjScript RENAME Command Handler
 * Renames model elements
 */

import {
    RenameArgs,
    ExecutionResult,
    ExecutionContext
} from '../../types';
import { resolveTargetInProject, kindLabel, memberMissingMessage, TARGET_KINDS_BY_ELEMENT_TYPE, ambiguityMessage, QUALIFY_ADVICE
} from '../resolvers';
import { qualifiedNameToString, isValidIdentifier } from '../../parser/grammar';
import { getProject } from '../utils';
import { executeRenameInstance } from './instance';
import { buildEvalContext } from './eval';
import { jjelEval } from '../../../jjel';
import type { JjelValue } from '../../../jjel';

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
    try {
        // Validate new name. Not at M1 (#175): an instance name is free, as `create instance of X "…"`
        // takes it, and executeRenameInstance refuses only an empty one.
        const instanceRename = args.elementType === 'instance' || context.level === 'M1';

        // R-FA-9: a computed name is evaluated here, once per execution, and from now on the
        // command is the literal rename to it.
        if (args.newNameExpr !== undefined) {
            const computed = evaluateNewName(args.newNameExpr, context, instanceRename);
            if (typeof computed !== 'string') return computed;
            args = { ...args, newName: computed, newNameExpr: undefined };
        }
        const { target, newName } = args;

        if (!instanceRename && !isValidIdentifier(newName)) {
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
        if (instanceRename) {
            return executeRenameInstance(args, context, project);
        }

        // Resolve the target element, restricted to the named element type when the
        // command gives one (same reasoning as delete: `in <Parent>` is folded into
        // `Parent.member`, so the container has to be resolved to the right kind).
        const targetKinds = args.elementType ? TARGET_KINDS_BY_ELEMENT_TYPE[args.elementType] : undefined;
        const resolution = resolveTargetInProject(target, project, targetKinds);
        if (resolution.memberMissingOn) {
            // The container was found and it is the sort that could have held the member.
            // Not walking on to a case-only sibling is the point: acting on one would
            // touch an element the command never named.
            const missing = memberMissingMessage(resolution.memberMissingOn, kindLabel(targetKinds));
            return {
                success: false,
                command: 'rename',
                message: missing,
                errors: [{
                    code: 'MEMBER_NOT_FOUND',
                    message: missing,
                    suggestion: 'Check the member name, and the case of the container name'
                }]
            };
        }
        if (resolution.ambiguousWith) {
            return {
                success: false,
                command: 'rename',
                message: ambiguityMessage(qualifiedNameToString(target), resolution.ambiguousWith),
                errors: [{
                    code: 'AMBIGUOUS_TARGET',
                    message: `More than one ${kindLabel(targetKinds).toLowerCase()} answers to '${qualifiedNameToString(target)}': ${resolution.ambiguousWith.join(', ')}`,
                    suggestion: QUALIFY_ADVICE
                }]
            };
        }
        const element = resolution.element;
        if (!element) {
            return {
                success: false,
                command: 'rename',
                message: `${kindLabel(targetKinds)} not found: ${qualifiedNameToString(target)}`,
                errors: [{
                    code: 'ELEMENT_NOT_FOUND',
                    message: `Could not find ${kindLabel(targetKinds).toLowerCase()} '${qualifiedNameToString(target)}'`
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

/**
 * The name `newNameExpr` gives, over the variables the `forall` filter sees (`forall.ts`):
 * the metamodel context, then `context.variables` (the forall variables, the `let` bindings).
 * The result must be a non-empty string that is a legal name by the rule this command applies
 * (an identifier at M2, any non-empty name for an instance); anything else is the command's error.
 */
function evaluateNewName(expr: string, context: ExecutionContext, instanceRename: boolean): string | ExecutionResult {
    const refuse = (code: string, message: string): ExecutionResult => ({
        success: false,
        command: 'rename',
        message,
        errors: [{ code, message }]
    });

    let value: unknown;
    try {
        const variables: Record<string, JjelValue> = buildEvalContext(context);
        for (const [key, v] of context.variables) variables[key] = v as JjelValue;
        value = jjelEval(expr, variables);
    } catch (error) {
        return refuse('RENAME_EXPR_ERROR', `Cannot evaluate the new name '${expr}': ${(error as Error).message}`);
    }

    if (typeof value !== 'string' || value === '') {
        return refuse('INVALID_NAME', `The new name '${expr}' gives ${describeValue(value)}, not a non-empty string`);
    }
    if (!instanceRename && !isValidIdentifier(value)) {
        return refuse('INVALID_NAME', `The new name '${expr}' gives "${value}", which is not a valid identifier`);
    }
    return value;
}

function describeValue(value: unknown): string {
    if (value === undefined) return 'undefined';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
        return JSON.stringify(value);
    }
    return Array.isArray(value) ? 'a collection' : 'an object';
}

// `checkNameConflict` used to live here: a second, per-kind, case-insensitive rule,
// applied on this path only. It was not narrowed or widened — it was REMOVED, and its
// callers now consult `checkM2NameUniqueness` (S1-M2). One rule, one place.
