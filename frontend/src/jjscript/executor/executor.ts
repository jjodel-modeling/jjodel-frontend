/**
 * JjScript Executor
 * Executes parsed JjScript commands against the Jjodel model
 */

import { parse } from '../parser/parser';
import {
    CommandNode,
    CommandType,
    ExecutionResult,
    ExecutionError,
    ExecutionContext,
    CommandHistoryEntry,
    LetArgs,
    ForAllArgs,
    AbstractArgs,
    BlockArgs
} from '../types';
import { executeCreate } from './commands/create';
import { executeDelete } from './commands/delete';
import { executeRename } from './commands/rename';
import { executeSet } from './commands/set';
import { executeAdd } from './commands/add';
import { executeRemove } from './commands/remove';
import { executeMove } from './commands/move';
import { executeCopy } from './commands/copy';
import { executeList } from './commands/list';
import { executeShow } from './commands/show';
import { executeHelp } from './commands/help';
import { executeUndo, executeRedo } from './commands/undoredo';
import { executeClear } from './commands/clear';
import { executeValidate } from './commands/validate';
import { executeExtends } from './commands/extends';
import { executeEval } from './commands/eval';
import { executeLet } from './commands/let';
import { executeForAll } from './commands/forall';
import { executeAbstract } from './commands/abstract';
import { extractDependencies } from './dependencies';
import { waitForDependencies } from './elementWaiter';
import { checkBoundScope } from './scopeGuard';
import { getMetamodelById } from './resolvers';
import { getProject } from './utils';
import { checkCommandPermission, containedTypes, instanceType, metaclassesNamed, rememberCreated } from './permissionGuard';
import type { GuardCommand, GuardType } from './permissionGuard';
import { resolveTargetModel, resolveInstanceHandle } from './commands/instance';
import { activeProfileId } from '../../components/environment/consumerMode';
import { findProfile } from '../../joiner/environmentConfig';
import { store } from '../../joiner';

// ============================================
// EXECUTOR CLASS
// ============================================

export class JjScriptExecutor {
    private context: ExecutionContext;
    private undoStack: (() => void)[] = [];
    private redoStack: (() => void)[] = [];
    /** The metaclass of each instance a guarded `create` made, by id, until the store has it (#176). */
    private createdTypes = new Map<string, GuardType>();

    constructor(projectId: string, modelId?: string, targetMetamodelId?: string, level?: 'M1' | 'M2', scopeBound?: boolean) {
        this.context = {
            projectId,
            modelId,
            targetMetamodelId,
            level,
            scopeBound,
            history: [],
            variables: new Map()
        };
    }

    /**
     * Execute a JjScript command string
     */
    async execute(input: string): Promise<ExecutionResult> {
        const _tParseStart = performance.now(); // TEMP-DISCOVERY
        // Parse the input
        const parseResult = parse(input);
        (this as any)._tParseMs = performance.now() - _tParseStart; // TEMP-DISCOVERY
        (this as any)._tLastInput = input; // TEMP-DISCOVERY

        if (!parseResult.success || !parseResult.ast) {
            return {
                success: false,
                command: 'help' as CommandType,
                message: 'Parse error',
                errors: parseResult.errors?.map(e => ({
                    code: 'PARSE_ERROR',
                    message: e.message,
                    position: e.position,
                    suggestion: e.expected ? `Expected: ${e.expected.join(', ')}` : undefined
                }))
            };
        }

        // Execute the command
        return this.executeAST(parseResult.ast);
    }

    /**
     * Execute a parsed AST node.
     * @param contextOverride — optional scoped context (used by `let` to inject variables)
     */
    async executeAST(ast: CommandNode, contextOverride?: ExecutionContext): Promise<ExecutionResult> {
        const context = contextOverride || this.context;
        const startTime = Date.now();
        const _tTotalStart = performance.now(); // TEMP-DISCOVERY
        let _waitMs = 0; // TEMP-DISCOVERY
        let _applyMs = 0; // TEMP-DISCOVERY

        try {
            // PRE-CHECK: Wait for dependencies before executing
            const dependencies = extractDependencies(ast);
            if (dependencies.length > 0) {
                const _tWaitStart = performance.now(); // TEMP-DISCOVERY
                const waitResult = await waitForDependencies(dependencies, context);
                _waitMs = performance.now() - _tWaitStart; // TEMP-DISCOVERY
                if (!waitResult.allResolved) {
                    const missing = waitResult.unresolved.map(d => `${d.name.raw} (${d.role})`).join(', ');
                    console.warn(`[JjScript] Unresolved dependencies after ${waitResult.waitedMs}ms: ${missing}`);
                    // Don't fail here - let the command handler produce the proper error message
                } else if (waitResult.waitedMs > 0) {
                    // console.log(`[JjScript] Dependencies resolved after ${waitResult.waitedMs}ms`);
                }
            }

            // A stand-alone environment (#157) carries a profile in the URL, and the profile decides
            // what a script may change (#168 J5, `permissionGuard.ts`). After the wait, so the check
            // resolves names against the state the handler will see; before the scope check, so the
            // profile's refusal is the one the viewer reads. No profile: nothing is resolved here.
            const profileId = activeProfileId();
            let guarded: GuardCommand | undefined;
            if (profileId) {
                const profile = findProfile((store.getState() as any).idlookup, profileId);
                guarded = describeForGuard(ast, context, this.createdTypes);
                const refusal = checkCommandPermission(guarded, { profileId, profile });
                if (refusal) {
                    return {
                        success: false,
                        command: ast.command,
                        message: refusal.message,
                        errors: [{ code: refusal.code, message: refusal.message, suggestion: refusal.suggestion }]
                    };
                }
            }

            // A scope carried from a Jjodie reply says where the script writes: refuse a bare
            // name only another metamodel holds, before a handler can fall back to it
            // project-wide. M1 commands already resolve against the bound model's metamodel.
            if (context.scopeBound && context.level !== 'M1') {
                const project = getProject(context);
                if (project) {
                    const refusal = checkBoundScope(
                        dependencies, getMetamodelById(project, context.targetMetamodelId ?? ''), project);
                    if (refusal) {
                        return {
                            success: false,
                            command: ast.command,
                            message: refusal.message,
                            errors: [{ code: refusal.code, message: refusal.message, suggestion: refusal.suggestion }]
                        };
                    }
                }
            }

            let result: ExecutionResult;

            const _tApplyStart = performance.now(); // TEMP-DISCOVERY
            switch (ast.command) {
                case 'create':
                    result = await executeCreate(ast.args as any, context);
                    break;
                case 'delete':
                    result = await executeDelete(ast.args as any, context);
                    break;
                case 'rename':
                    result = await executeRename(ast.args as any, context);
                    break;
                case 'set':
                    result = await executeSet(ast.args as any, context);
                    break;
                case 'add':
                    result = await executeAdd(ast.args as any, context);
                    break;
                case 'remove':
                    result = await executeRemove(ast.args as any, context);
                    break;
                case 'move':
                    result = await executeMove(ast.args as any, context);
                    break;
                case 'copy':
                    result = await executeCopy(ast.args as any, context);
                    break;
                case 'list':
                    result = await executeList(ast.args as any, context);
                    break;
                case 'show':
                    result = await executeShow(ast.args as any, context);
                    break;
                case 'help':
                    result = executeHelp(ast.args as any);
                    break;
                case 'undo':
                    result = executeUndo(ast.args as any, this.undoStack, this.redoStack);
                    break;
                case 'redo':
                    result = executeRedo(ast.args as any, this.undoStack, this.redoStack);
                    break;
                case 'clear':
                    result = executeClear(ast.args as any, context);
                    break;
                case 'validate':
                    result = await executeValidate(ast.args as any, context);
                    break;
                case 'extends':
                    result = await executeExtends(ast.args as any, context);
                    break;
                case 'eval':
                    result = await executeEval(ast.args as any, context);
                    break;
                case 'let':
                    result = await executeLet(ast.args as LetArgs, context);
                    break;
                case 'forall':
                    result = await executeForAll(ast.args as ForAllArgs, context);
                    break;
                case 'abstract':
                    result = await executeAbstract(ast.args as AbstractArgs, context);
                    break;
                case 'block':
                    result = await this.executeBlock(ast.args as BlockArgs, context);
                    break;
                default:
                    result = {
                        success: false,
                        command: ast.command,
                        message: `Unknown command: ${ast.command}`,
                        errors: [{ code: 'UNKNOWN_COMMAND', message: `Command '${ast.command}' is not implemented` }]
                    };
            }

            _applyMs = performance.now() - _tApplyStart; // TEMP-DISCOVERY

            // The type a create was checked against stands in for `instanceof` until the store has it.
            if (guarded) rememberCreated(this.createdTypes, guarded, result);

            // Record in main history (always on this.context, not override)
            this.recordHistory(ast, result);

            // TEMP-DISCOVERY: per-command executor breakdown (parse in execute(), wait = pre-check poll, apply = synchronous handler/dispatch)
            const _parseMs = (this as any)._tParseMs ?? 0; // TEMP-DISCOVERY
            console.log(`[JjScript-TIMING] cmd=${ast.command} parse=${_parseMs.toFixed(1)} wait=${_waitMs.toFixed(1)} apply=${_applyMs.toFixed(1)} total=${(_parseMs + (performance.now() - _tTotalStart)).toFixed(1)} in="${((this as any)._tLastInput ?? '').slice(0, 60)}"`); // TEMP-DISCOVERY

            return result;
        } catch (error) {
            const err = error as Error;
            return {
                success: false,
                command: ast.command,
                message: `Execution error: ${err.message}`,
                errors: [{ code: 'EXECUTION_ERROR', message: err.message }]
            };
        }
    }

    /**
     * Execute a block of commands sequentially (do...end)
     */
    private async executeBlock(args: BlockArgs, context: ExecutionContext): Promise<ExecutionResult> {
        if (args.commands.length === 0) {
            return { success: true, command: 'block', message: 'Empty block' };
        }

        let lastResult: ExecutionResult | undefined;
        let successCount = 0;
        let errorCount = 0;

        for (const cmd of args.commands) {
            lastResult = await this.executeAST(cmd, context);
            if (lastResult.success) successCount++;
            else {
                errorCount++;
                break; // stop on first error
            }
        }

        const total = successCount + errorCount;
        return {
            success: errorCount === 0,
            command: 'block',
            message: errorCount === 0
                ? `Block: ${successCount}/${args.commands.length} commands executed`
                : `Block: failed at command ${total}/${args.commands.length} — ${lastResult!.message}`,
            errors: lastResult && !lastResult.success ? lastResult.errors : undefined
        };
    }

    /**
     * Record command in history
     */
    private recordHistory(ast: CommandNode, result: ExecutionResult): void {
        const entry: CommandHistoryEntry = {
            command: `${ast.command} ...`,
            timestamp: Date.now(),
            result
        };

        this.context.history.push(entry);

        // Limit history size
        if (this.context.history.length > 100) {
            this.context.history.shift();
        }
    }

    /**
     * Get execution context
     */
    getContext(): ExecutionContext {
        return this.context;
    }

    /**
     * Update project/model context
     */
    setContext(projectId: string, modelId?: string): void {
        this.context.projectId = projectId;
        this.context.modelId = modelId;
    }

    /**
     * Set selected element
     */
    setSelectedElement(elementId: string | undefined): void {
        this.context.selectedElement = elementId;
    }

    /**
     * Get command history
     */
    getHistory(): CommandHistoryEntry[] {
        return [...this.context.history];
    }

    /**
     * Clear command history
     */
    clearHistory(): void {
        this.context.history = [];
    }
}

// ============================================
// PROFILE GUARD ADAPTER
// ============================================

/**
 * The command as `checkCommandPermission` reads it: the names it touches, resolved the way the
 * M1 handlers resolve them (`commands/instance.ts`), so the type checked is the type written.
 * Resolves only at M1 and only for `create instance` / `set` / `rename` / `delete`; a name that
 * does not resolve travels as the handler's own sentence, and the guard refuses it.
 */
function describeForGuard(ast: CommandNode, context: ExecutionContext, created: ReadonlyMap<string, GuardType>): GuardCommand {
    const args: any = ast.args;
    const cmd: GuardCommand = { command: ast.command, level: context.level, elementType: args?.elementType };
    if (context.level !== 'M1') return cmd;

    const project = getProject(context);
    if (ast.command === 'create') {
        if (args?.elementType !== 'instance') return cmd;
        const metamodel = project ? getMetamodelById(project, context.targetMetamodelId ?? '') : null;
        if (!metamodel) {
            cmd.creates = { unresolved: 'No metamodel of conformity in context' };
        } else {
            const types = metaclassesNamed(metamodel, args.name);
            cmd.creates = types.length > 0 ? types : { unresolved: `Class '${args.name}' not found in metamodel` };
        }
        // `create instance … in <Parent>.<reference>` (R-JS-9): the parent, by the same lookup as
        // `resolveContainerSlot` in `commands/instance.ts`.
        if (args.parent) {
            const model = project ? resolveTargetModel(context, project) : null;
            const handle = (args.parent.segments ?? []).join('::');
            cmd.container = model
                ? instanceType(resolveInstanceHandle(model, handle), handle, created)
                : { unresolved: 'No active M1 model' };
        }
        return cmd;
    }
    if (ast.command !== 'set' && ast.command !== 'rename' && ast.command !== 'delete') return cmd;
    if (args?.elementType !== undefined && args.elementType !== 'instance') return cmd;

    const model = project ? resolveTargetModel(context, project) : null;
    if (!model) {
        cmd.subject = { unresolved: 'No active M1 model' };
        return cmd;
    }
    // Same spelling as the handlers (`instance.ts`, executeSet/Rename/DeleteInstance).
    const instanceName = args.target.segments.join('::') || args.target.raw;
    const resolved = resolveInstanceHandle(model, instanceName);
    cmd.subject = instanceType(resolved, instanceName, created);

    // A `delete` touches what the instance contains too (#157, 2026-10-04): read from the store
    // the guard already reads the profile from, through the containment the L-layer names.
    if (ast.command === 'delete' && resolved.ok && typeof resolved.value?.id === 'string') {
        cmd.cascade = containedTypes((store.getState() as any).idlookup, resolved.value.id);
    }

    // A `set` writes a link when the property is a reference (an attribute of the same name wins,
    // as in `classifyMetaclassProperty`) and the value names an instance: a string literal or,
    // like the handler, anything that is not a literal, by its `raw`. `null` unlinks, and any
    // other literal is refused by the handler (TYPE_MISMATCH): neither links to anything.
    if (ast.command === 'set' && resolved.ok) {
        const metaclass: any = resolved.value?.instanceof;
        const attributes: any[] = metaclass?.allAttributes ?? metaclass?.attributes ?? [];
        const references: any[] = metaclass?.allReferences ?? metaclass?.references ?? [];
        const reference = references.find((r) => r?.name === args.property);
        const isReference = !attributes.some((a) => a?.name === args.property) && !!reference;
        const value: any = args.value;
        const isLiteral = !!value && typeof value === 'object' && 'kind' in value
            && ['string', 'number', 'boolean', 'null', 'array', 'enumLiteral'].includes(value.kind);
        const links = isReference && (!isLiteral || value.kind === 'string');
        if (links) {
            const targetName = isLiteral ? value.value : value?.raw;
            cmd.linkTarget = typeof targetName === 'string'
                ? instanceType(resolveInstanceHandle(model, targetName), targetName, created)
                : { unresolved: `Reference '${args.property}' expects an instance name` };
            // `LReference.containment` is `composition || aggregation`: such a link re-fathers the target.
            cmd.linkIsContainment = !!reference?.containment;
        }
    }
    return cmd;
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let executorInstance: JjScriptExecutor | null = null;

/**
 * Get or create executor instance.
 *
 * The singleton is invalidated when ANY of `projectId`, `targetMetamodelId`,
 * `level`, or `modelId` changes. Switching between M1 (instance editor) and
 * M2 (metamodel editor) within the same project — or between two different
 * M1 models of the same metamodel — must yield distinct executors so that
 * `self` resolution and command-handler routing see the correct host.
 * `scopeBound`, when passed, invalidates it too: a typed command must never inherit the
 * bound context a Jjodie reply left behind, nor a reply the unbound one.
 */
export function getExecutor(
    projectId?: string,
    modelId?: string,
    targetMetamodelId?: string,
    level?: 'M1' | 'M2',
    scopeBound?: boolean
): JjScriptExecutor {
    const ctx = executorInstance?.getContext();
    const needsNew = !executorInstance
        || (projectId && ctx?.projectId !== projectId)
        || (targetMetamodelId !== undefined && ctx?.targetMetamodelId !== targetMetamodelId)
        || (level !== undefined && ctx?.level !== level)
        || (modelId !== undefined && ctx?.modelId !== modelId)
        || (scopeBound !== undefined && !!ctx?.scopeBound !== scopeBound);

    if (needsNew) {
        executorInstance = new JjScriptExecutor(projectId || '', modelId, targetMetamodelId, level, scopeBound);
    }
    return executorInstance!;
}

/**
 * Execute a JjScript command (convenience function)
 */
export async function executeCommand(
    input: string,
    projectId?: string,
    modelId?: string,
    targetMetamodelId?: string,
    level?: 'M1' | 'M2',
    scopeBound?: boolean
): Promise<ExecutionResult> {
    const executor = getExecutor(projectId, modelId, targetMetamodelId, level, scopeBound);
    return executor.execute(input);
}

// ============================================
// BATCH EXECUTION
// ============================================

/**
 * Execute multiple commands in sequence
 */
export async function executeBatch(
    commands: string[],
    projectId?: string,
    modelId?: string,
    targetMetamodelId?: string,
    level?: 'M1' | 'M2'
): Promise<ExecutionResult[]> {
    const executor = getExecutor(projectId, modelId, targetMetamodelId, level);
    const results: ExecutionResult[] = [];

    for (const command of commands) {
        const trimmed = command.trim();
        if (trimmed && !trimmed.startsWith('//')) {
            const result = await executor.execute(trimmed);
            results.push(result);

            // Stop on first error unless in batch mode
            if (!result.success) {
                break;
            }
        }
    }

    return results;
}

/**
 * Execute a script (multiple lines).
 * Groups do...end blocks into single commands before batch execution.
 */
export async function executeScript(
    script: string,
    projectId?: string,
    modelId?: string,
    targetMetamodelId?: string,
    level?: 'M1' | 'M2'
): Promise<ExecutionResult[]> {
    const commands = groupBlockCommands(script.split('\n'));
    return executeBatch(commands, projectId, modelId, targetMetamodelId, level);
}

/**
 * Group do...end blocks and forall...do...end blocks spanning multiple lines
 * into single command strings. Lines outside blocks pass through unchanged.
 */
export function groupBlockCommands(lines: string[]): string[] {
    const result: string[] = [];
    let blockLines: string[] | null = null;
    let depth = 0;

    for (const line of lines) {
        const trimmed = line.trim();
        const lower = trimmed.toLowerCase();

        // Count 'do' keywords that open a block (standalone 'do' or at end of forall/let)
        // We detect: line ending with 'do', standalone 'do', or 'do' keyword before body
        const doMatches = (lower === 'do') ||
            lower.endsWith(' do') ||
            / do$/.test(lower);
        const endMatches = lower === 'end' || lower.endsWith(';end') || lower.startsWith('end;') || lower === 'end;';

        if (doMatches && blockLines === null) {
            // Start of a block
            blockLines = [line];
            depth = 1;
        } else if (blockLines !== null) {
            blockLines.push(line);
            // Track nested do...end
            if (doMatches) depth++;
            if (endMatches || lower === 'end') depth--;
            if (depth <= 0) {
                // Block complete — join into single command
                result.push(blockLines.join('\n'));
                blockLines = null;
                depth = 0;
            }
        } else {
            result.push(line);
        }
    }

    // Unterminated block — push what we have
    if (blockLines !== null) {
        result.push(blockLines.join('\n'));
    }

    return result;
}
