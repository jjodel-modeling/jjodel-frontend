/**
 * JjScript Dependency Extraction
 * Extracts element dependencies from parsed command AST nodes
 */

import {
    CommandNode,
    QualifiedName,
    CreateArgs,
    AddArgs,
    DeleteArgs,
    RenameArgs,
    SetArgs,
    ExtendsArgs,
    MoveArgs,
    CopyArgs,
    RemoveArgs,
    BlockArgs,
} from '../types';

// ============================================
// TYPES
// ============================================

/**
 * Represents an element that must exist before a command can execute.
 */
export interface ElementDependency {
    /** The qualified name to resolve */
    name: QualifiedName;
    /** Why this dependency is needed (for logging/debugging) */
    role: 'parent' | 'target' | 'superclass' | 'type-reference' | 'destination' | 'source' | 'value-reference';
    /** Whether the dependency is strictly required (vs. optional/best-effort) */
    required: boolean;
}

// ============================================
// MAIN FUNCTION
// ============================================

/**
 * Extract all element dependencies from a parsed command AST node.
 * Returns the QualifiedNames that must resolve to existing elements
 * before the command can safely execute.
 */
export function extractDependencies(ast: CommandNode): ElementDependency[] {
    const deps: ElementDependency[] = [];

    switch (ast.command) {
        case 'create': {
            const args = ast.args as CreateArgs;
            extractCreateDependencies(args, deps);
            break;
        }

        case 'add': {
            const args = ast.args as AddArgs;
            // "to" target is always required
            deps.push({ name: args.to, role: 'destination', required: true });
            // Same options as create for superclass/type
            extractOptionsDependencies(args.options, deps);
            break;
        }

        case 'delete': {
            const args = ast.args as DeleteArgs;
            deps.push({ name: args.target, role: 'target', required: true });
            break;
        }

        case 'rename': {
            const args = ast.args as RenameArgs;
            deps.push({ name: args.target, role: 'target', required: true });
            break;
        }

        case 'set': {
            const args = ast.args as SetArgs;
            deps.push({ name: args.target, role: 'target', required: true });
            // If value is a QualifiedName (not a LiteralValue)
            if (isQualifiedName(args.value)) {
                deps.push({ name: args.value, role: 'value-reference', required: false });
            }
            break;
        }

        case 'extends': {
            const args = ast.args as ExtendsArgs;
            deps.push({ name: args.childClass, role: 'target', required: true });
            deps.push({ name: args.parentClass, role: 'superclass', required: true });
            break;
        }

        case 'move': {
            const args = ast.args as MoveArgs;
            deps.push({ name: args.target, role: 'source', required: true });
            deps.push({ name: args.to, role: 'destination', required: true });
            break;
        }

        case 'copy': {
            const args = ast.args as CopyArgs;
            deps.push({ name: args.target, role: 'source', required: true });
            deps.push({ name: args.to, role: 'destination', required: true });
            break;
        }

        case 'remove': {
            const args = ast.args as RemoveArgs;
            deps.push({ name: args.target, role: 'target', required: true });
            deps.push({ name: args.from, role: 'source', required: true });
            break;
        }

        case 'block': {
            // Extract dependencies from the first command in the block
            const blockArgs = ast.args as BlockArgs;
            if (blockArgs.commands.length > 0) {
                deps.push(...extractDependencies(blockArgs.commands[0]));
            }
            break;
        }

        // No dependencies for read-only/utility commands
        case 'list':
        case 'show':
        case 'help':
        case 'undo':
        case 'redo':
        case 'clear':
        case 'validate':
        default:
            break;
    }

    return deps;
}

// ============================================
// HELPERS
// ============================================

/**
 * Extract dependencies from create command args
 */
function extractCreateDependencies(args: CreateArgs, deps: ElementDependency[]): void {
    const elementType = args.elementType;

    // Parent dependency - required for nested elements
    if (args.parent) {
        const needsParent = [
            'attribute', 'reference', 'containment', 'composition',
            'operation', 'parameter', 'literal'
        ].includes(elementType);
        deps.push({ name: args.parent, role: 'parent', required: needsParent });
    }

    // Extract dependencies from options (superclass, type references)
    extractOptionsDependencies(args.options, deps);
}

/**
 * Extract dependencies from create options (superclass, type references, etc.)
 */
function extractOptionsDependencies(options: CreateArgs['options'], deps: ElementDependency[]): void {
    if (!options) return;

    // Superclass dependencies
    if (options.superClass) {
        deps.push({ name: options.superClass, role: 'superclass', required: false });
    }
    if (options.superClasses) {
        for (const sc of options.superClasses) {
            deps.push({ name: sc, role: 'superclass', required: false });
        }
    }

    // Type reference for attributes/references (e.g., "type Order")
    if (options.type) {
        const typeRef = options.type;
        if (typeRef.kind === 'class') {
            deps.push({ name: typeRef.name, role: 'type-reference', required: false });
        } else if (typeRef.kind === 'enum') {
            deps.push({ name: typeRef.name, role: 'type-reference', required: false });
        }
        // CollectionTypeRef's elementType could be class/enum but let's keep it simple
    }

    // Return type for operations
    if (options.returnType) {
        const typeRef = options.returnType;
        if (typeRef.kind === 'class') {
            deps.push({ name: typeRef.name, role: 'type-reference', required: false });
        } else if (typeRef.kind === 'enum') {
            deps.push({ name: typeRef.name, role: 'type-reference', required: false });
        }
    }

    // Opposite reference
    if (options.opposite) {
        deps.push({ name: options.opposite, role: 'value-reference', required: false });
    }

    // Exception types for operations
    if (options.exceptions) {
        for (const exc of options.exceptions) {
            deps.push({ name: exc, role: 'type-reference', required: false });
        }
    }
}

/**
 * Type guard to check if a value is a QualifiedName
 */
function isQualifiedName(value: unknown): value is QualifiedName {
    return (
        value !== null &&
        typeof value === 'object' &&
        'segments' in value &&
        Array.isArray((value as QualifiedName).segments)
    );
}
