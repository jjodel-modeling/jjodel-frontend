/**
 * JjScript Run — the pass loop (R-JS-3)
 *
 * Pass 1 runs every command in script order and never pauses. A command that fails is
 * DEFERRED when its verb is constructive and its error is an unresolved name: the thing it
 * names may be created by a later line. After pass 1 the deferred commands run again, in
 * script order; passes repeat while a pass makes at least one command succeed, at most
 * `MAX_RETRY_PASSES` after the first. Whatever still fails is final with the error of its
 * last attempt.
 *
 * Re-running is safe because every deferrable failure writes nothing before it fails
 * (`docs/discovery/discovery_2026-10-01_jjscript_requeue.md` §3.2): a command succeeds at
 * most once, so a `+=` cannot append twice and a class cannot be created twice. A pass in
 * which nothing succeeds leaves the model as it found it, which is why it ends the loop.
 *
 * One exception to the retry, from the GO of P-2026-10-01-1725: a deferred `set` is not run
 * again when a LATER line that already succeeded sets the same feature of the same target.
 * Running it late would overwrite the value the script meant to leave. It becomes final as
 * `superseded` instead, and it is not an error.
 *
 * Pure on purpose: the commands, the executor call and the deferral rule are arguments, and
 * the only runtime import is the parser, so the loop runs under the bench's
 * `environment: 'node'`, which `ScriptBlock.tsx` does not.
 */

import { parse } from '../parser/parser';
import type { CommandNode, SetArgs } from '../types';

/** The part of a command result the loop reads: `ScriptLineResult` and `ExecutionResult` both fit. */
export interface PassResult {
    success: boolean;
    errors?: ReadonlyArray<{ code: string }>;
}

export type FinalStatus = 'success' | 'failed' | 'superseded';

export interface CommandOutcome<R extends PassResult> {
    /** The command's index in the `commands` array. */
    index: number;
    status: FinalStatus;
    /** The result of the last attempt. */
    result: R;
    attempts: number;
    /** The pass of the last attempt; for a success, the pass in which it succeeded. */
    pass: number;
    /** For `superseded`: the index of the later `set` that made the retry pointless. */
    supersededBy?: number;
}

export interface RunPassesOptions {
    /** The commands to run, by index; all of them when absent. Run in line order. */
    indices?: readonly number[];
    /** Retry passes allowed after the first. */
    maxRetryPasses?: number;
    /** Checked before each command; true stops the run where it is. */
    shouldStop?: () => boolean;
}

export interface RunPassesResult<R extends PassResult> {
    /** One per attempted command, ordered by index. */
    outcomes: CommandOutcome<R>[];
    /** Passes run, the first included. */
    passes: number;
    /** True when `shouldStop` ended the run. */
    stopped: boolean;
}

export const MAX_RETRY_PASSES = 3;

/**
 * R-JS-7: how many commands of a retry pass (pass 2 and later) are running right now. Module
 * state on purpose: the command reaches the executor through the host's callback
 * (`ScriptBlock` -> `onExecute` -> `JjScriptService` -> `JjScriptExecutor`), and none of those
 * signatures carries a pass number, so the run publishes it here and `waitForDependencies`
 * reads it. Raised around `execOne` and lowered in a `finally`, so a throwing command cannot
 * leave it up.
 */
let retryPassDepth = 0;

/**
 * True while a retry pass is running a command. `waitForDependencies` then awaits every
 * dependency of that command, `type-reference` and `value-reference` included: a forward
 * reference that pass 1 deferred waits for the line that created its target to reach the
 * resolvers, instead of failing again at the first poll and ending the run (R-JS-7).
 */
export function isRetryPass(): boolean {
    return retryPassDepth > 0;
}

/**
 * The executor's codes for a name that did not resolve, each emitted before anything is
 * written (report §3.2). `TARGET_NOT_FOUND` is not here: no handler emits it.
 */
export const DEFERRABLE_ERROR_CODES: ReadonlySet<string> = new Set([
    'PARENT_NOT_FOUND', 'CHILD_NOT_FOUND', 'MEMBER_NOT_FOUND', 'NO_PARENT', 'ELEMENT_NOT_FOUND',
    'UNKNOWN_ATTRIBUTE_TYPE', 'UNKNOWN_REFERENCE_TYPE', 'UNKNOWN_OPERATION_TYPE',
    'UNKNOWN_PARAMETER_TYPE', 'UNKNOWN_TYPE',
    'OUT_OF_SCOPE', 'AMBIGUOUS_OUT_OF_SCOPE',
]);

/**
 * The M1 handlers' codes for a name that did not resolve (R-JS-8), each emitted before anything
 * is written (`docs/discovery/discovery_2026-10-04_jjscript_m1_containment.md` §4.2): an instance
 * a later line creates (`INSTANCE_NOT_FOUND`, on a `set` target or value or on the container of
 * `create instance … in`), and a container created by an earlier line whose slots the store has
 * not committed yet (`CONTAINER_NOT_READY`). Kept apart from the M2 set, whose list R-JS-3 fixes.
 */
export const M1_DEFERRABLE_ERROR_CODES: ReadonlySet<string> = new Set([
    'INSTANCE_NOT_FOUND', 'CONTAINER_NOT_READY',
]);

/**
 * Verbs that only add to the model. `delete`, `rename`, `move`, `copy` and `remove` change
 * the meaning of a script when they succeed late; `abstract` toggles, so a late success can
 * undo a later line; `forall`, blocks, `let` and `eval` hide what they do.
 */
const CONSTRUCTIVE_VERBS: ReadonlySet<string> = new Set(['create', 'add', 'set', 'extends']);

function parseCommand(command: string): CommandNode | undefined {
    try {
        const parsed = parse(command.trim());
        return parsed.success ? parsed.ast : undefined;
    } catch {
        return undefined;
    }
}

/**
 * R-JS-3's rule: a failed constructive command whose error is an unresolved name.
 *
 * Reads the EXECUTOR's code (`result.errors[0].code`), never the one `errorFromResult` builds
 * for the dialog, which maps every code it does not know, `OUT_OF_SCOPE` and the
 * `UNKNOWN_*_TYPE` family among them, to `OPERATION_FAILED`. A result without codes (a thrown
 * command) is final.
 */
export function isDeferrable(command: string, result: PassResult): boolean {
    if (result.success) return false;
    const code = result.errors?.[0]?.code;
    if (!code || !(DEFERRABLE_ERROR_CODES.has(code) || M1_DEFERRABLE_ERROR_CODES.has(code))) return false;
    const ast = parseCommand(command);
    return !!ast && CONSTRUCTIVE_VERBS.has(ast.command);
}

/** `Target.feature` of a `set`, spelled exactly as written. */
function setKey(args: SetArgs): string {
    const target = args.target.segments.join('::') + (args.target.member ? `.${args.target.member}` : '');
    return `${target}#${args.property}`;
}

const isCollectionUpdate = (args: SetArgs): boolean => args.operator === '+=' || args.operator === '-=';

/**
 * The nearest later line, among those that succeeded, that sets the same feature of the same
 * target as the `set` at `index`; undefined when there is none or the command is not a `set`.
 * Two collection updates (`+=`, `-=`) compose rather than overwrite, so they do not supersede
 * each other.
 */
export function findSupersedingSet(
    commands: readonly string[],
    index: number,
    succeeded: ReadonlySet<number>
): number | undefined {
    const ast = parseCommand(commands[index] ?? '');
    if (!ast || ast.command !== 'set') return undefined;
    const args = ast.args as SetArgs;
    const key = setKey(args);
    const later = [...succeeded].filter(j => j > index).sort((a, b) => a - b);
    for (const j of later) {
        const other = parseCommand(commands[j] ?? '');
        if (!other || other.command !== 'set') continue;
        const otherArgs = other.args as SetArgs;
        if (setKey(otherArgs) !== key) continue;
        if (isCollectionUpdate(args) && isCollectionUpdate(otherArgs)) continue;
        return j;
    }
    return undefined;
}

/**
 * Run `commands` in passes. `execOne` runs one command and must not throw: a host turns a
 * thrown command into a failed result, which carries no code and is therefore final.
 */
export async function runPasses<R extends PassResult>(
    commands: readonly string[],
    execOne: (index: number) => Promise<R>,
    deferrable: (command: string, result: R) => boolean,
    options: RunPassesOptions = {}
): Promise<RunPassesResult<R>> {
    const maxRetryPasses = options.maxRetryPasses ?? MAX_RETRY_PASSES;
    const all = options.indices ?? commands.map((_, i) => i);
    let pending = [...new Set(all)].filter(i => i >= 0 && i < commands.length).sort((a, b) => a - b);

    const outcomes = new Map<number, CommandOutcome<R>>();
    const succeeded = new Set<number>();
    let passes = 0;
    let stopped = false;

    while (pending.length > 0) {
        passes++;
        const deferred: number[] = [];
        let progress = false;

        for (const i of pending) {
            if (options.shouldStop?.()) { stopped = true; break; }

            const previous = outcomes.get(i);
            if (previous) {
                const by = findSupersedingSet(commands, i, succeeded);
                if (by !== undefined) {
                    outcomes.set(i, { ...previous, status: 'superseded', supersededBy: by });
                    continue;
                }
            }

            let result: R;
            if (passes > 1) {
                retryPassDepth++;
                try {
                    result = await execOne(i);
                } finally {
                    retryPassDepth--;
                }
            } else {
                result = await execOne(i);
            }
            const attempts = (previous?.attempts ?? 0) + 1;
            if (result.success) {
                succeeded.add(i);
                progress = true;
                outcomes.set(i, { index: i, status: 'success', result, attempts, pass: passes });
            } else {
                outcomes.set(i, { index: i, status: 'failed', result, attempts, pass: passes });
                if (deferrable(commands[i], result)) deferred.push(i);
            }
        }

        if (stopped) break;
        // Failed commands wrote nothing, so a pass without a success left the model as it was
        // and the next one would fail the same way.
        if (!progress) break;
        if (passes > maxRetryPasses) break;
        pending = deferred;
    }

    return {
        outcomes: [...outcomes.values()].sort((a, b) => a.index - b.index),
        passes,
        stopped,
    };
}
