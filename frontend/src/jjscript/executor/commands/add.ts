/**
 * JjScript ADD Command Handler
 * Adds elements to collections (similar to create but explicit about target)
 */

import {
    AddArgs,
    ExecutionResult,
    ExecutionContext
} from '../../types';
import { resolveElement } from '../resolvers';
import { qualifiedNameToString } from '../../parser/grammar';
import { executeCreate } from './create';

// ============================================
// ADD COMMAND EXECUTOR
// ============================================

export async function executeAdd(
    args: AddArgs,
    context: ExecutionContext
): Promise<ExecutionResult> {
    const { elementType, name, to, options } = args;

    // Convert to create command with explicit parent
    const createArgs = {
        command: 'create' as const,
        elementType,
        name,
        parent: to,
        options
    };

    const result = await executeCreate(createArgs, context);

    // Adjust message if successful
    if (result.success) {
        result.message = `Added ${elementType} '${name}' to '${qualifiedNameToString(to)}'`;
    }

    return result;
}
