/**
 * JjScript UNDO/REDO Command Handlers
 */

import {
    UndoRedoArgs,
    ExecutionResult
} from '../../types';

// ============================================
// UNDO COMMAND EXECUTOR
// ============================================

export function executeUndo(
    args: UndoRedoArgs,
    undoStack: (() => void)[],
    redoStack: (() => void)[]
): ExecutionResult {
    const steps = args.steps || 1;

    if (undoStack.length === 0) {
        return {
            success: false,
            command: 'undo',
            message: 'Nothing to undo',
            errors: [{ code: 'EMPTY_UNDO_STACK', message: 'No actions to undo' }]
        };
    }

    const actualSteps = Math.min(steps, undoStack.length);

    try {
        for (let i = 0; i < actualSteps; i++) {
            const action = undoStack.pop();
            if (action) {
                action();
                redoStack.push(action);
            }
        }

        return {
            success: true,
            command: 'undo',
            message: `Undid ${actualSteps} action${actualSteps !== 1 ? 's' : ''}`,
            data: {
                undone: actualSteps,
                remaining: undoStack.length
            }
        };
    } catch (error) {
        return {
            success: false,
            command: 'undo',
            message: `Undo failed: ${(error as Error).message}`,
            errors: [{ code: 'UNDO_ERROR', message: (error as Error).message }]
        };
    }
}

// ============================================
// REDO COMMAND EXECUTOR
// ============================================

export function executeRedo(
    args: UndoRedoArgs,
    undoStack: (() => void)[],
    redoStack: (() => void)[]
): ExecutionResult {
    const steps = args.steps || 1;

    if (redoStack.length === 0) {
        return {
            success: false,
            command: 'redo',
            message: 'Nothing to redo',
            errors: [{ code: 'EMPTY_REDO_STACK', message: 'No actions to redo' }]
        };
    }

    const actualSteps = Math.min(steps, redoStack.length);

    try {
        for (let i = 0; i < actualSteps; i++) {
            const action = redoStack.pop();
            if (action) {
                action();
                undoStack.push(action);
            }
        }

        return {
            success: true,
            command: 'redo',
            message: `Redid ${actualSteps} action${actualSteps !== 1 ? 's' : ''}`,
            data: {
                redone: actualSteps,
                remaining: redoStack.length
            }
        };
    } catch (error) {
        return {
            success: false,
            command: 'redo',
            message: `Redo failed: ${(error as Error).message}`,
            errors: [{ code: 'REDO_ERROR', message: (error as Error).message }]
        };
    }
}
