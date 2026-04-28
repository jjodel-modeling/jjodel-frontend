/**
 * JjEL Evaluation Context
 * Manages variable bindings and scope during expression evaluation
 */

// ============================================
// VALUE TYPES
// ============================================

/**
 * JjEL runtime values
 */
export type JjelValue =
    | null
    | boolean
    | number
    | string
    | JjelValue[]
    | JjelObject
    | JjelFunction;

/**
 * Object with properties (e.g., model elements)
 */
export interface JjelObject {
    [key: string]: JjelValue;
}

/**
 * Function/lambda value
 */
export interface JjelFunction {
    __jjelFunction: true;
    params: string[];
    call: (args: JjelValue[], ctx: EvaluationContext) => JjelValue;
}

export function isJjelFunction(value: JjelValue): value is JjelFunction {
    return value !== null && typeof value === 'object' && '__jjelFunction' in value;
}

export function isJjelObject(value: JjelValue): value is JjelObject {
    return value !== null && typeof value === 'object' && !Array.isArray(value) && !isJjelFunction(value);
}

// ============================================
// TYPE REGISTRY
// ============================================

/**
 * Type information for 'is' type checking
 */
export interface TypeInfo {
    name: string;
    superTypes?: string[];
    check?: (value: JjelValue) => boolean;
}

/**
 * Registry for type checking with 'is' operator
 */
export class TypeRegistry {
    private types: Map<string, TypeInfo> = new Map();

    register(info: TypeInfo): void {
        this.types.set(info.name, info);
    }

    isInstance(value: JjelValue, typeName: string): boolean {
        const typeInfo = this.types.get(typeName);

        // Custom check function
        if (typeInfo?.check) {
            return typeInfo.check(value);
        }

        // Check __type property on objects
        if (isJjelObject(value) && '__type' in value) {
            const objType = value.__type as string;
            if (objType === typeName) return true;

            // Check supertypes
            const objTypeInfo = this.types.get(objType);
            if (objTypeInfo?.superTypes?.includes(typeName)) return true;
        }

        // Check className property (for Jjodel proxy objects)
        if (isJjelObject(value) && 'className' in value) {
            const className = value.className as string;
            if (className === typeName) return true;

            // Check supertypes
            const objTypeInfo = this.types.get(className);
            if (objTypeInfo?.superTypes?.includes(typeName)) return true;
        }

        // Primitive type checks
        switch (typeName) {
            case 'EString':
            case 'String':
                return typeof value === 'string';
            case 'EInt':
            case 'EInteger':
            case 'Integer':
                return typeof value === 'number' && Number.isInteger(value);
            case 'EDouble':
            case 'EFloat':
            case 'Double':
            case 'Float':
            case 'Number':
                return typeof value === 'number';
            case 'EBoolean':
            case 'Boolean':
                return typeof value === 'boolean';
            case 'Array':
            case 'List':
            case 'Collection':
                return Array.isArray(value);
            case 'Object':
                return isJjelObject(value);
            case 'Null':
                return value === null;
            default:
                return false;
        }
    }
}

// ============================================
// DIAGNOSTICS
// ============================================

/**
 * A diagnostic emitted during evaluation. Today only one kind exists; the
 * union may grow (e.g. `'undefined-property'` once type inference lands).
 */
export type JjelWarning =
    | {
        kind: 'undefined-identifier';
        identifier: string;
        /** Closest known name within Levenshtein distance ≤ 3, or null. */
        suggestion: string | null;
    };

// ============================================
// EVALUATION CONTEXT
// ============================================

/**
 * Context for expression evaluation
 */
export class EvaluationContext {
    private scopes: Map<string, JjelValue>[] = [];
    private builtins: Map<string, JjelFunction> = new Map();
    readonly typeRegistry: TypeRegistry;
    /**
     * Optional diagnostics sink. When set on a context, the evaluator pushes
     * warnings here as they are discovered. Child contexts inherit the same
     * array reference, so nested scopes (forall, lambda, with...do) share
     * the sink. `undefined` means: don't collect — back to silent-null.
     */
    diagnostics?: JjelWarning[];

    constructor(
        initialBindings?: Record<string, JjelValue>,
        typeRegistry?: TypeRegistry
    ) {
        this.typeRegistry = typeRegistry || new TypeRegistry();
        this.pushScope();

        if (initialBindings) {
            for (const [name, value] of Object.entries(initialBindings)) {
                this.set(name, value);
            }
        }
    }

    /**
     * Get variable value
     */
    get(name: string): JjelValue | undefined {
        // Search scopes from innermost to outermost
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            const scope = this.scopes[i];
            if (scope.has(name)) {
                return scope.get(name);
            }
        }
        return undefined;
    }

    /**
     * Check if variable exists
     */
    has(name: string): boolean {
        return this.get(name) !== undefined;
    }

    /**
     * Set variable in current scope
     */
    set(name: string, value: JjelValue): void {
        if (this.scopes.length === 0) {
            this.pushScope();
        }
        this.scopes[this.scopes.length - 1].set(name, value);
    }

    /**
     * Push a new scope
     */
    pushScope(): void {
        this.scopes.push(new Map());
    }

    /**
     * Pop the current scope
     */
    popScope(): void {
        if (this.scopes.length > 1) {
            this.scopes.pop();
        }
    }

    /**
     * Create a child context with new bindings
     */
    child(bindings?: Record<string, JjelValue>): EvaluationContext {
        const child = new EvaluationContext(undefined, this.typeRegistry);
        child.scopes = [...this.scopes];
        child.builtins = this.builtins;
        // Propagate the same diagnostics sink reference to nested evaluations.
        child.diagnostics = this.diagnostics;
        child.pushScope();

        if (bindings) {
            for (const [name, value] of Object.entries(bindings)) {
                child.set(name, value);
            }
        }

        return child;
    }

    /**
     * Names visible at the current scope chain, including builtins.
     * Used by the evaluator to compute Levenshtein suggestions for
     * undefined identifiers. Order: builtins first, then innermost scope
     * to outermost (so closer bindings rank earlier on ties).
     */
    allNames(): string[] {
        const seen = new Set<string>();
        const out: string[] = [];
        for (const name of this.builtins.keys()) {
            if (!seen.has(name)) { seen.add(name); out.push(name); }
        }
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            for (const name of this.scopes[i].keys()) {
                if (!seen.has(name)) { seen.add(name); out.push(name); }
            }
        }
        return out;
    }

    /**
     * Register a builtin function
     */
    registerBuiltin(name: string, fn: JjelFunction): void {
        this.builtins.set(name, fn);
    }

    /**
     * Get a builtin function
     */
    getBuiltin(name: string): JjelFunction | undefined {
        return this.builtins.get(name);
    }

    /**
     * Check if a builtin exists
     */
    hasBuiltin(name: string): boolean {
        return this.builtins.has(name);
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create a JjEL function value
 */
export function createFunction(
    params: string[],
    impl: (args: JjelValue[], ctx: EvaluationContext) => JjelValue
): JjelFunction {
    return {
        __jjelFunction: true,
        params,
        call: impl
    };
}

/**
 * Convert JavaScript value to JjEL value
 */
export function toJjelValue(value: unknown): JjelValue {
    if (value === null || value === undefined) return null;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.map(toJjelValue);
    if (typeof value === 'object') {
        const result: JjelObject = {};
        for (const [k, v] of Object.entries(value)) {
            result[k] = toJjelValue(v);
        }
        return result;
    }
    return null;
}

/**
 * Convert JjEL value to JavaScript
 */
export function fromJjelValue(value: JjelValue): unknown {
    if (value === null) return null;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.map(fromJjelValue);
    if (isJjelFunction(value)) return undefined; // Functions don't convert
    if (isJjelObject(value)) {
        const result: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value)) {
            result[k] = fromJjelValue(v);
        }
        return result;
    }
    return null;
}
