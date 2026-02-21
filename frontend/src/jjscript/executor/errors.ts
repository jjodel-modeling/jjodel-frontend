/**
 * JjScript Error System
 * Provides specific, actionable error messages
 */

// ============================================
// ERROR CODES
// ============================================

export type JjScriptErrorCode =
    // Parse errors
    | 'PARSE_ERROR'
    | 'INVALID_SYNTAX'
    | 'UNEXPECTED_TOKEN'
    | 'UNTERMINATED_STRING'
    | 'UNTERMINATED_BLOCK'

    // Element errors
    | 'UNKNOWN_ELEMENT_TYPE'
    | 'UNKNOWN_COMMAND'
    | 'ELEMENT_NOT_FOUND'
    | 'PARENT_NOT_FOUND'
    | 'DUPLICATE_NAME'
    | 'INVALID_NAME'

    // Type errors
    | 'TYPE_MISMATCH'
    | 'INVALID_MULTIPLICITY'
    | 'INVALID_VALUE'

    // Reference errors
    | 'TARGET_NOT_FOUND'
    | 'CIRCULAR_REFERENCE'
    | 'INVALID_REFERENCE'

    // Operation errors
    | 'MISSING_REQUIRED_PARAM'
    | 'INVALID_PARAM'
    | 'OPERATION_FAILED'

    // System errors
    | 'INTERNAL_ERROR'
    | 'TIMEOUT';

// ============================================
// ERROR CONTEXT
// ============================================

export interface ErrorContext {
    /** The problematic token or value */
    found?: string;
    /** What was expected */
    expected?: string;
    /** Valid alternatives */
    validOptions?: string[];
    /** Parent element name */
    parent?: string;
    /** Element being created/modified */
    element?: string;
    /** Element type */
    elementType?: string;
    /** Command that failed */
    command?: string;
    /** Additional details */
    details?: string;
}

// ============================================
// STRUCTURED ERROR
// ============================================

export interface JjScriptError {
    code: JjScriptErrorCode;
    message: string;
    context?: ErrorContext;
    /** Can this error be skipped? */
    skippable: boolean;
    /** Suggested fix (if any) */
    suggestion?: string;
    /** Link to documentation */
    docsUrl?: string;
}

// ============================================
// ERROR FACTORY
// ============================================

const VALID_ELEMENT_TYPES = ['class', 'attribute', 'reference', 'operation', 'package', 'enum', 'literal'];
const VALID_COMMANDS = ['create', 'delete', 'rename', 'set', 'add', 'remove', 'show', 'help'];

export function createError(
    code: JjScriptErrorCode,
    context: ErrorContext = {}
): JjScriptError {
    const { message, skippable, suggestion } = getErrorDetails(code, context);

    return {
        code,
        message,
        context,
        skippable,
        suggestion,
    };
}

function getErrorDetails(
    code: JjScriptErrorCode,
    ctx: ErrorContext
): { message: string; skippable: boolean; suggestion?: string } {

    switch (code) {
        // ========================================
        // PARSE ERRORS
        // ========================================

        case 'PARSE_ERROR':
            return {
                message: ctx.details || 'Unable to parse this command.',
                skippable: true,
            };

        case 'INVALID_SYNTAX':
            return {
                message: ctx.expected
                    ? `Syntax error: expected ${ctx.expected}${ctx.found ? `, found '${ctx.found}'` : ''}.`
                    : `Syntax error${ctx.found ? ` near '${ctx.found}'` : ''}.`,
                skippable: true,
            };

        case 'UNEXPECTED_TOKEN':
            return {
                message: `Unexpected '${ctx.found}'${ctx.expected ? `. Expected ${ctx.expected}` : ''}.`,
                skippable: true,
            };

        case 'UNTERMINATED_STRING':
            return {
                message: 'Unterminated string. Add a closing quote.',
                skippable: true,
                suggestion: 'Check for missing " at the end of the string.',
            };

        case 'UNTERMINATED_BLOCK':
            return {
                message: 'Unterminated block. Add a closing brace.',
                skippable: true,
                suggestion: 'Check for missing } at the end of the block.',
            };

        // ========================================
        // ELEMENT ERRORS
        // ========================================

        case 'UNKNOWN_ELEMENT_TYPE':
            return {
                message: `'${ctx.found}' is not a supported element type.\n` +
                         `Supported: ${VALID_ELEMENT_TYPES.join(', ')}.`,
                skippable: true,
                suggestion: findSimilar(ctx.found || '', VALID_ELEMENT_TYPES),
            };

        case 'UNKNOWN_COMMAND':
            return {
                message: `'${ctx.found}' is not a recognized command.\n` +
                         `Available: ${VALID_COMMANDS.join(', ')}.`,
                skippable: true,
                suggestion: findSimilar(ctx.found || '', VALID_COMMANDS),
            };

        case 'ELEMENT_NOT_FOUND':
            return {
                message: `Element '${ctx.element}' not found.`,
                skippable: true,
                suggestion: 'Make sure the element exists or was created earlier in the script.',
            };

        case 'PARENT_NOT_FOUND':
            return {
                message: `Cannot find '${ctx.parent}' to add ${ctx.elementType || 'element'} to.`,
                skippable: true,
                suggestion: 'Make sure the parent was created earlier in the script.',
            };

        case 'DUPLICATE_NAME':
            return {
                message: `'${ctx.element}' already exists${ctx.parent ? ` in ${ctx.parent}` : ''}.`,
                skippable: true,
                suggestion: 'Use a different name or delete the existing element first.',
            };

        case 'INVALID_NAME':
            return {
                message: `'${ctx.found}' is not a valid name.`,
                skippable: true,
                suggestion: 'Names must start with a letter and contain only letters, numbers, and underscores.',
            };

        // ========================================
        // TYPE ERRORS
        // ========================================

        case 'TYPE_MISMATCH':
            return {
                message: `Type mismatch: expected ${ctx.expected}, got ${ctx.found}.`,
                skippable: true,
            };

        case 'INVALID_MULTIPLICITY':
            return {
                message: `Invalid multiplicity '${ctx.found}'.\n` +
                         `Use: [1], [0..1], [*], [1..*], or [n..m].`,
                skippable: true,
            };

        case 'INVALID_VALUE':
            return {
                message: `Invalid value '${ctx.found}'${ctx.expected ? ` for ${ctx.expected}` : ''}.`,
                skippable: true,
            };

        // ========================================
        // REFERENCE ERRORS
        // ========================================

        case 'TARGET_NOT_FOUND':
            return {
                message: `Reference target '${ctx.element}' not found.`,
                skippable: true,
                suggestion: 'Make sure the target class exists.',
            };

        case 'CIRCULAR_REFERENCE':
            return {
                message: `Circular reference detected involving '${ctx.element}'.`,
                skippable: true,
            };

        case 'INVALID_REFERENCE':
            return {
                message: `Cannot create reference: ${ctx.details || 'invalid configuration'}.`,
                skippable: true,
            };

        // ========================================
        // OPERATION ERRORS
        // ========================================

        case 'MISSING_REQUIRED_PARAM':
            return {
                message: `Missing required parameter: ${ctx.expected}.`,
                skippable: true,
                suggestion: ctx.details,
            };

        case 'INVALID_PARAM':
            return {
                message: `Invalid parameter '${ctx.found}'${ctx.expected ? `. Expected ${ctx.expected}` : ''}.`,
                skippable: true,
            };

        case 'OPERATION_FAILED':
            return {
                message: ctx.details || 'Operation failed.',
                skippable: true,
            };

        // ========================================
        // SYSTEM ERRORS
        // ========================================

        case 'INTERNAL_ERROR':
            return {
                message: 'An internal error occurred. Please try again.',
                skippable: false,
            };

        case 'TIMEOUT':
            return {
                message: 'Command execution timed out.',
                skippable: false,
            };

        default:
            return {
                message: ctx.details || 'An error occurred.',
                skippable: true,
            };
    }
}

/**
 * Find similar string from valid options (for "Did you mean?" suggestions)
 */
function findSimilar(input: string, validOptions: string[]): string | undefined {
    if (!input) return undefined;

    const inputLower = input.toLowerCase();

    // Exact prefix match
    const prefixMatch = validOptions.find(opt =>
        opt.toLowerCase().startsWith(inputLower) ||
        inputLower.startsWith(opt.toLowerCase())
    );
    if (prefixMatch) {
        return `Did you mean '${prefixMatch}'?`;
    }

    // Levenshtein distance (simple version)
    const threshold = Math.max(2, Math.floor(input.length / 2));
    let closest: string | undefined;
    let closestDist = Infinity;

    for (const opt of validOptions) {
        const dist = levenshteinDistance(inputLower, opt.toLowerCase());
        if (dist < closestDist && dist <= threshold) {
            closestDist = dist;
            closest = opt;
        }
    }

    return closest ? `Did you mean '${closest}'?` : undefined;
}

/**
 * Simple Levenshtein distance
 */
function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b[i - 1] === a[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

// ============================================
// ERROR PARSING (from raw error messages)
// ============================================

/**
 * Parse a raw error message into a structured JjScriptError
 */
export function parseError(rawMessage: string, command?: string): JjScriptError {
    const messageLower = rawMessage.toLowerCase();

    // Pattern matching for common errors
    if (messageLower.includes('not found')) {
        const match = rawMessage.match(/['"]([^'"]+)['"]\s*not found/i);
        const element = match?.[1];

        if (messageLower.includes('parent') || messageLower.includes('class')) {
            return createError('PARENT_NOT_FOUND', { parent: element });
        }
        return createError('ELEMENT_NOT_FOUND', { element });
    }

    if (messageLower.includes('already exists') || messageLower.includes('duplicate')) {
        const match = rawMessage.match(/['"]([^'"]+)['"]/);
        return createError('DUPLICATE_NAME', { element: match?.[1] });
    }

    if (messageLower.includes('unknown') || messageLower.includes('not recognized')) {
        const match = rawMessage.match(/['"]([^'"]+)['"]/);
        const found = match?.[1];

        if (messageLower.includes('command')) {
            return createError('UNKNOWN_COMMAND', { found });
        }
        if (messageLower.includes('type') || messageLower.includes('element')) {
            return createError('UNKNOWN_ELEMENT_TYPE', { found });
        }
    }

    if (messageLower.includes('parse') || messageLower.includes('syntax')) {
        return createError('PARSE_ERROR', { details: rawMessage });
    }

    if (messageLower.includes('timeout')) {
        return createError('TIMEOUT', {});
    }

    // Fallback: return as operation failed with original message
    return createError('OPERATION_FAILED', { details: rawMessage });
}

// ============================================
// EXECUTION TYPES (co-located for convenience)
// ============================================

export interface ExecutionPauseInfo {
    line: number;
    command: string;
    error: JjScriptError;
    /** Commands executed so far */
    executedSoFar: number;
    /** Total commands */
    totalCommands: number;
    /** Time elapsed so far */
    elapsedMs: number;
}

export interface ExecutionSummary {
    /** Total commands in script */
    totalCommands: number;
    /** Successfully executed */
    executedCount: number;
    /** Skipped due to errors */
    skippedCount: number;
    /** Number of errors */
    errorCount: number;
    /** Execution time in ms */
    duration: number;
    /** Line numbers that were skipped */
    skippedLines: number[];
    /** Errors encountered */
    errors: Array<{
        line: number;
        command: string;
        error: JjScriptError;
    }>;
}
