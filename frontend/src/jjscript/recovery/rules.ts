/**
 * JjScript Recovery Rules — Registry
 *
 * The first rule whose matcher returns a non-null array contributes its actions to
 * the error dialog. Subsequent rules are NOT evaluated in this pass (first-match wins).
 * This avoids action-button spam and gives rule authors predictable priority.
 */

import type { RecoveryRule, RecoveryContext, RecoveryAction } from './types';

// ============================================
// RULE: literal in attribute
// ============================================
//
// Matches: `create literal X in Y` fails with "Literals can only be added to enums"
// because Y is actually an attribute (the user confused an attribute name with an
// enum name — a common mistake when iterating metamodel design).
//
// Offered fixes:
//   A. Create enum `Y` and retry the failed line.
//   B. Skip every remaining `create literal ... in Y` line.

const LITERAL_IN_CMD_REGEX = /^\s*create\s+literal\s+[A-Za-z_][\w]*\s+in\s+([A-Za-z_][\w]*)\s*$/i;

/**
 * Build a matcher for the `create literal ... in Y` pattern on *any* command line
 * (used both to detect the failing line and to scan remaining lines for the "skip
 * all" action).
 */
function parseLiteralInTarget(command: string): string | null {
    const m = command.match(LITERAL_IN_CMD_REGEX);
    return m ? m[1] : null;
}

/**
 * Look up an attribute by case-insensitive name across every class in the metamodel.
 * Returns true if found. We only care about existence for the matcher — the object
 * itself is never surfaced.
 */
function hasAttributeNamed(metamodel: any, name: string): boolean {
    if (!metamodel) return false;
    const lower = name.toLowerCase();
    const classes = metamodel.classes ?? [];
    for (const cls of classes) {
        const attrs = cls?.attributes ?? [];
        for (const a of attrs) {
            if (typeof a?.name === 'string' && a.name.toLowerCase() === lower) return true;
        }
    }
    return false;
}

/**
 * Check whether an enum with the exact (case-sensitive) name already exists in the
 * metamodel or the enclosing project. If it does, the rule does NOT fire: the
 * original error is probably about a different problem (e.g. naming collision or a
 * stale parse).
 */
function hasEnumNamed(metamodel: any, name: string): boolean {
    if (!metamodel) return false;

    // Model-level: some setups expose enums directly as model children with a
    // className containing "Enum".
    const candidates: any[] = [];
    if (Array.isArray(metamodel.children)) candidates.push(...metamodel.children);
    if (Array.isArray(metamodel.classes)) candidates.push(...metamodel.classes);
    if (Array.isArray((metamodel as any).enumerators)) candidates.push(...(metamodel as any).enumerators);

    for (const el of candidates) {
        if (!el || el.name !== name) continue;
        const className: string = el.className || el?.constructor?.name || '';
        if (className.includes('Enum')) return true;
    }

    // Project-level fallback: some models expose enumerators via parent project.
    const project = (metamodel as any).project;
    if (project?.enumerators) {
        for (const en of project.enumerators) {
            if (en?.name === name) return true;
        }
    }

    return false;
}

export const literalInAttributeRule: RecoveryRule = {
    id: 'literal-in-attribute',
    match(ctx: RecoveryContext): RecoveryAction[] | null {
        // 1. The failing line must match `create literal X in Y`.
        const targetName = parseLiteralInTarget(ctx.command);
        if (!targetName) return null;

        // 2. The error must be the specific "literals only in enums" runtime.
        if (!ctx.errorMessage.includes('Literals can only be added to enums')) return null;

        // 3. The target name `Y` must resolve to an existing attribute (case-insensitive).
        if (!hasAttributeNamed(ctx.metamodel, targetName)) return null;

        // 4. There must NOT be an enum with the exact name `Y` already — if there is, the
        //    error is about something else (e.g. the parent resolved to the wrong type).
        if (hasEnumNamed(ctx.metamodel, targetName)) return null;

        return [
            {
                id: 'create-enum-and-retry',
                kind: 'createEnumAndRetry',
                label: `Create enum "${targetName}" and retry`,
                icon: 'plus-circle',
                enumName: targetName,
            },
            {
                id: 'skip-matching-create-literal',
                kind: 'skipMatchingCreateLiteral',
                label: `Skip all "create literal ... in ${targetName}"`,
                icon: 'skip-forward',
                targetName,
            },
        ];
    },
};

// ============================================
// REGISTRY
// ============================================

export const RECOVERY_RULES: RecoveryRule[] = [
    literalInAttributeRule,
    // Add future rules here. Order matters: first match wins.
];

/**
 * Scan the registry and return the actions proposed by the first matching rule,
 * or an empty array if no rule applies (dialog then shows only Skip/Close).
 */
export function findRecoveryActions(ctx: RecoveryContext): RecoveryAction[] {
    for (const rule of RECOVERY_RULES) {
        try {
            const actions = rule.match(ctx);
            if (actions && actions.length > 0) return actions;
        } catch (e) {
            // A buggy rule must never break the error dialog. Swallow and continue.
            // eslint-disable-next-line no-console
            console.warn(`[jjscript recovery] rule "${rule.id}" threw during match:`, e);
        }
    }
    return [];
}

/**
 * Utility exported for the ScriptBlock handler: tests whether a given command line
 * is `create literal <ident> in Y`, case-sensitive on the target. Used by
 * `skipMatchingCreateLiteral` to decide which subsequent lines to skip.
 */
export function isCreateLiteralInTarget(command: string, targetName: string): boolean {
    const m = command.match(LITERAL_IN_CMD_REGEX);
    if (!m) return false;
    return m[1] === targetName; // case-sensitive by spec
}
