import { describe, it, expect, beforeEach } from 'vitest';
import { executeHelp } from '../executor/commands/help';
import { executeUndo, executeRedo } from '../executor/commands/undoredo';
import { executeClear } from '../executor/commands/clear';
import type {
    ExecutionContext,
} from '../types';

// ─── HELP command (pure function, no deps) ───────────────────

describe('executeHelp', () => {
    it('should return general help with no topic', () => {
        const result = executeHelp({ command: 'help' });
        expect(result.success).toBe(true);
        expect(result.command).toBe('help');
        expect(result.message).toContain('JjScript');
        expect(result.message).toContain('COMMANDS');
        expect(result.data?.topic).toBe('general');
    });

    it('should return help for "create" command', () => {
        const result = executeHelp({ command: 'help', topic: 'create' });
        expect(result.success).toBe(true);
        expect(result.message).toContain('CREATE');
        expect(result.data?.type).toBe('command');
    });

    it('should return help for "delete" command', () => {
        const result = executeHelp({ command: 'help', topic: 'delete' });
        expect(result.success).toBe(true);
        expect(result.message).toContain('DELETE');
    });

    it('should return help for "rename" command', () => {
        const result = executeHelp({ command: 'help', topic: 'rename' });
        expect(result.success).toBe(true);
        expect(result.message).toContain('RENAME');
    });

    it('should return help for "set" command', () => {
        const result = executeHelp({ command: 'help', topic: 'set' });
        expect(result.success).toBe(true);
        expect(result.message).toContain('SET');
    });

    it('should return help for each known command', () => {
        const cmds = ['add', 'remove', 'move', 'copy', 'list', 'show',
            'undo', 'redo', 'validate', 'clear', 'extends'] as const;
        for (const cmd of cmds) {
            const result = executeHelp({ command: 'help', topic: cmd });
            expect(result.success, `help for ${cmd} should succeed`).toBe(true);
            expect(result.data?.type).toBe('command');
        }
    });

    it('should return help for element types', () => {
        const types = ['class', 'attribute', 'reference', 'operation', 'package', 'enum'] as const;
        for (const type of types) {
            const result = executeHelp({ command: 'help', topic: type as any });
            expect(result.success, `help for element type ${type} should succeed`).toBe(true);
            expect(result.data?.type).toBe('element');
        }
    });

    it('should return help for "syntax" topic', () => {
        const result = executeHelp({ command: 'help', topic: 'syntax' as any });
        expect(result.success).toBe(true);
        expect(result.message).toContain('QUALIFIED NAMES');
        expect(result.message).toContain('MULTIPLICITY');
    });

    it('should return help for "examples" topic', () => {
        const result = executeHelp({ command: 'help', topic: 'examples' as any });
        expect(result.success).toBe(true);
        expect(result.message).toContain('CREATING A SIMPLE METAMODEL');
    });

    it('should fail for unknown topic', () => {
        const result = executeHelp({ command: 'help', topic: 'nonexistent' as any });
        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors![0].code).toBe('UNKNOWN_TOPIC');
    });
});

// ─── UNDO command (operates on stacks, no Redux) ────────────

describe('executeUndo', () => {
    let undoStack: (() => void)[];
    let redoStack: (() => void)[];
    let log: string[];

    beforeEach(() => {
        log = [];
        undoStack = [];
        redoStack = [];
    });

    it('should fail when undo stack is empty', () => {
        const result = executeUndo({ command: 'undo' }, undoStack, redoStack);
        expect(result.success).toBe(false);
        expect(result.errors![0].code).toBe('EMPTY_UNDO_STACK');
    });

    it('should undo one action by default', () => {
        undoStack.push(() => log.push('undo1'));
        const result = executeUndo({ command: 'undo' }, undoStack, redoStack);
        expect(result.success).toBe(true);
        expect(log).toEqual(['undo1']);
        expect(undoStack.length).toBe(0);
        expect(redoStack.length).toBe(1);
    });

    it('should undo multiple actions', () => {
        undoStack.push(() => log.push('undo1'));
        undoStack.push(() => log.push('undo2'));
        undoStack.push(() => log.push('undo3'));
        const result = executeUndo({ command: 'undo', steps: 2 }, undoStack, redoStack);
        expect(result.success).toBe(true);
        expect(result.data.undone).toBe(2);
        // Stack is LIFO, so undo3 and undo2 are popped
        expect(log).toEqual(['undo3', 'undo2']);
        expect(undoStack.length).toBe(1);
        expect(redoStack.length).toBe(2);
    });

    it('should cap undo steps at stack size', () => {
        undoStack.push(() => log.push('undo1'));
        const result = executeUndo({ command: 'undo', steps: 10 }, undoStack, redoStack);
        expect(result.success).toBe(true);
        expect(result.data.undone).toBe(1);
        expect(result.data.remaining).toBe(0);
    });

    it('should move actions to redo stack', () => {
        const action = () => log.push('action');
        undoStack.push(action);
        executeUndo({ command: 'undo' }, undoStack, redoStack);
        expect(redoStack.length).toBe(1);
        expect(redoStack[0]).toBe(action);
    });

    it('should handle undo error gracefully', () => {
        undoStack.push(() => { throw new Error('undo failed'); });
        const result = executeUndo({ command: 'undo' }, undoStack, redoStack);
        expect(result.success).toBe(false);
        expect(result.errors![0].code).toBe('UNDO_ERROR');
    });
});

// ─── REDO command ────────────────────────────────────────────

describe('executeRedo', () => {
    let undoStack: (() => void)[];
    let redoStack: (() => void)[];
    let log: string[];

    beforeEach(() => {
        log = [];
        undoStack = [];
        redoStack = [];
    });

    it('should fail when redo stack is empty', () => {
        const result = executeRedo({ command: 'redo' }, undoStack, redoStack);
        expect(result.success).toBe(false);
        expect(result.errors![0].code).toBe('EMPTY_REDO_STACK');
    });

    it('should redo one action by default', () => {
        redoStack.push(() => log.push('redo1'));
        const result = executeRedo({ command: 'redo' }, undoStack, redoStack);
        expect(result.success).toBe(true);
        expect(log).toEqual(['redo1']);
        expect(redoStack.length).toBe(0);
        expect(undoStack.length).toBe(1);
    });

    it('should redo multiple actions', () => {
        redoStack.push(() => log.push('redo1'));
        redoStack.push(() => log.push('redo2'));
        const result = executeRedo({ command: 'redo', steps: 2 }, undoStack, redoStack);
        expect(result.success).toBe(true);
        expect(result.data.redone).toBe(2);
    });

    it('should cap redo steps at stack size', () => {
        redoStack.push(() => log.push('r'));
        const result = executeRedo({ command: 'redo', steps: 5 }, undoStack, redoStack);
        expect(result.success).toBe(true);
        expect(result.data.redone).toBe(1);
    });

    it('should handle redo error gracefully', () => {
        redoStack.push(() => { throw new Error('redo boom'); });
        const result = executeRedo({ command: 'redo' }, undoStack, redoStack);
        expect(result.success).toBe(false);
        expect(result.errors![0].code).toBe('REDO_ERROR');
    });
});

// ─── Undo/Redo roundtrip ────────────────────────────────────

describe('undo/redo roundtrip', () => {
    it('should undo then redo the same action', () => {
        const log: string[] = [];
        const undoStack: (() => void)[] = [];
        const redoStack: (() => void)[] = [];
        const action = () => log.push('action');

        undoStack.push(action);
        executeUndo({ command: 'undo' }, undoStack, redoStack);
        expect(log).toEqual(['action']);

        executeRedo({ command: 'redo' }, undoStack, redoStack);
        expect(log).toEqual(['action', 'action']);
        expect(undoStack.length).toBe(1);
        expect(redoStack.length).toBe(0);
    });
});

// ─── CLEAR command ───────────────────────────────────────────

describe('executeClear', () => {
    let context: ExecutionContext;

    beforeEach(() => {
        context = {
            projectId: 'proj1',
            modelId: 'model1',
            selectedElement: 'elem1',
            history: [
                { command: 'create ...', timestamp: Date.now(), result: { success: true, command: 'create', message: 'ok' } }
            ],
            variables: new Map([['$x', 42]])
        };
    });

    it('should clear history', () => {
        const result = executeClear({ command: 'clear', target: 'history' }, context);
        expect(result.success).toBe(true);
        expect(context.history.length).toBe(0);
        // selection should remain
        expect(context.selectedElement).toBe('elem1');
    });

    it('should clear console (signal only)', () => {
        const result = executeClear({ command: 'clear', target: 'console' }, context);
        expect(result.success).toBe(true);
        expect(result.data?.action).toBe('clear_console');
        // context should remain untouched
        expect(context.history.length).toBe(1);
    });

    it('should clear selection', () => {
        const result = executeClear({ command: 'clear', target: 'selection' }, context);
        expect(result.success).toBe(true);
        expect(context.selectedElement).toBeUndefined();
        // history should remain
        expect(context.history.length).toBe(1);
    });

    it('should clear everything when no target specified', () => {
        const result = executeClear({ command: 'clear' }, context);
        expect(result.success).toBe(true);
        expect(context.history.length).toBe(0);
        expect(context.selectedElement).toBeUndefined();
    });
});

// ─── Integration: parse → command (pure commands) ────────────
// Note: The full executor (executor.ts) and parser (parser.ts) cannot be imported
// in node environment because they transitively depend on monaco-editor which
// requires `window`. Parser tests are in parser.test.ts (pure, no Monaco dep).
// Executor integration tests require jsdom or a running browser environment.
