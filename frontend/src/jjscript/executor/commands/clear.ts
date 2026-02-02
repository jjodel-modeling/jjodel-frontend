/**
 * JjScript CLEAR Command Handler
 */

import {
    ClearArgs,
    ExecutionResult,
    ExecutionContext
} from '../../types';

// ============================================
// CLEAR COMMAND EXECUTOR
// ============================================

export function executeClear(
    args: ClearArgs,
    context: ExecutionContext
): ExecutionResult {
    const { target } = args;

    switch (target) {
        case 'history':
            context.history = [];
            return {
                success: true,
                command: 'clear',
                message: 'Command history cleared'
            };

        case 'console':
            // Console clearing is handled by the UI
            return {
                success: true,
                command: 'clear',
                message: 'Console cleared',
                data: { action: 'clear_console' }
            };

        case 'selection':
            context.selectedElement = undefined;
            return {
                success: true,
                command: 'clear',
                message: 'Selection cleared'
            };

        default:
            // Clear everything
            context.history = [];
            context.selectedElement = undefined;
            return {
                success: true,
                command: 'clear',
                message: 'All state cleared'
            };
    }
}
