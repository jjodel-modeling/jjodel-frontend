/**
 * JjScript Recovery Rules — Types
 *
 * A RecoveryRule inspects the state captured at pause time and proposes zero or more
 * RecoveryActions that offer deterministic one-click fixes. Rules are evaluated in
 * registry order; the first one that matches contributes its actions to the error
 * dialog.
 *
 * Adding a new rule:
 *   1. Implement the matcher (pure: input → RecoveryAction[] | null).
 *   2. Add a new discriminant to the RecoveryAction union with any payload fields.
 *   3. Append the rule to `RECOVERY_RULES` in `rules.ts`.
 *   4. Handle the new `action.kind` in ScriptBlock.tsx's recovery dispatcher.
 */

import type { LModel } from '../../joiner';

/**
 * Snapshot of the failing execution passed to every rule matcher. Keep this shape
 * additive — adding fields is fine, removing/renaming them breaks existing rules.
 */
export interface RecoveryContext {
    /** The raw command string that failed (as written by the user). */
    command: string;
    /** 1-based line number of the failing command. */
    lineNumber: number;
    /** Flat array of all commands in the script (raw strings, one per line). */
    allCommands: string[];
    /** Error message text from the runtime. */
    errorMessage: string;
    /** The metamodel the script is targeting, if resolvable. */
    metamodel: LModel | null;
}

/**
 * Discriminated union of every concrete recovery action. Each variant carries only
 * the data the handler needs (no closures, no function references) so the list can
 * be passed across the ScriptBlock → dialog boundary without lifetime issues.
 *
 * Handlers for each `kind` live in ScriptBlock.tsx.
 */
export type RecoveryAction =
    | {
        id: string;
        kind: 'createEnumAndRetry';
        label: string;
        icon?: string;
        /** The enum name to create before retrying the failed line. */
        enumName: string;
      }
    | {
        id: string;
        kind: 'skipMatchingCreateLiteral';
        label: string;
        icon?: string;
        /** The target name `Y`: all lines matching `create literal <ident> in Y` are skipped. */
        targetName: string;
      };

export interface RecoveryRule {
    /** Stable identifier; shown in logs/debug. */
    id: string;
    /** Pure matcher. Returns the list of actions to expose, or null if this rule doesn't apply. */
    match(ctx: RecoveryContext): RecoveryAction[] | null;
}
