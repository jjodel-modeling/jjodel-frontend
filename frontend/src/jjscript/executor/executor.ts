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
    CommandHistoryEntry
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
import { extractDependencies } from './dependencies';
import { waitForDependencies } from './elementWaiter';

// ============================================
// EXECUTOR CLASS
// ============================================

export class JjScriptExecutor {
    private context: ExecutionContext;
    private undoStack: (() => void)[] = [];
    private redoStack: (() => void)[] = [];

    constructor(projectId: string, modelId?: string) {
        this.context = {
            projectId,
            modelId,
            history: [],
            variables: new Map()
        };
    }

    /**
     * Execute a JjScript command string
     */
    async execute(input: string): Promise<ExecutionResult> {
        // Parse the input
        const parseResult = parse(input);

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
     * Execute a parsed AST node
     */
    async executeAST(ast: CommandNode): Promise<ExecutionResult> {
        const startTime = Date.now();

        try {
            // PRE-CHECK: Wait for dependencies before executing
            const dependencies = extractDependencies(ast);
            if (dependencies.length > 0) {
                const waitResult = await waitForDependencies(dependencies, this.context);
                if (!waitResult.allResolved) {
                    const missing = waitResult.unresolved.map(d => `${d.name.raw} (${d.role})`).join(', ');
                    console.warn(`[JjScript] Unresolved dependencies after ${waitResult.waitedMs}ms: ${missing}`);
                    // Don't fail here - let the command handler produce the proper error message
                } else if (waitResult.waitedMs > 0) {
                    console.log(`[JjScript] Dependencies resolved after ${waitResult.waitedMs}ms`);
                }
            }

            let result: ExecutionResult;

            switch (ast.command) {
                case 'create':
                    result = await executeCreate(ast.args as any, this.context);
                    break;
                case 'delete':
                    result = await executeDelete(ast.args as any, this.context);
                    break;
                case 'rename':
                    result = await executeRename(ast.args as any, this.context);
                    break;
                case 'set':
                    result = await executeSet(ast.args as any, this.context);
                    break;
                case 'add':
                    result = await executeAdd(ast.args as any, this.context);
                    break;
                case 'remove':
                    result = await executeRemove(ast.args as any, this.context);
                    break;
                case 'move':
                    result = await executeMove(ast.args as any, this.context);
                    break;
                case 'copy':
                    result = await executeCopy(ast.args as any, this.context);
                    break;
                case 'list':
                    result = await executeList(ast.args as any, this.context);
                    break;
                case 'show':
                    result = await executeShow(ast.args as any, this.context);
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
                    result = executeClear(ast.args as any, this.context);
                    break;
                case 'validate':
                    result = await executeValidate(ast.args as any, this.context);
                    break;
                case 'extends':
                    result = await executeExtends(ast.args as any, this.context);
                    break;
                case 'eval':
                    result = await executeEval(ast.args as any, this.context);
                    break;
                default:
                    result = {
                        success: false,
                        command: ast.command,
                        message: `Unknown command: ${ast.command}`,
                        errors: [{ code: 'UNKNOWN_COMMAND', message: `Command '${ast.command}' is not implemented` }]
                    };
            }

            // Record in history
            this.recordHistory(ast, result);

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
// SINGLETON INSTANCE
// ============================================

let executorInstance: JjScriptExecutor | null = null;

/**
 * Get or create executor instance
 */
export function getExecutor(projectId?: string, modelId?: string): JjScriptExecutor {
    if (!executorInstance || (projectId && executorInstance.getContext().projectId !== projectId)) {
        executorInstance = new JjScriptExecutor(projectId || '', modelId);
    }
    return executorInstance;
}

/**
 * Execute a JjScript command (convenience function)
 */
export async function executeCommand(input: string, projectId?: string, modelId?: string): Promise<ExecutionResult> {
    const executor = getExecutor(projectId, modelId);
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
    modelId?: string
): Promise<ExecutionResult[]> {
    const executor = getExecutor(projectId, modelId);
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
 * Execute a script (multiple lines)
 */
export async function executeScript(
    script: string,
    projectId?: string,
    modelId?: string
): Promise<ExecutionResult[]> {
    const lines = script.split('\n');
    return executeBatch(lines, projectId, modelId);
}
