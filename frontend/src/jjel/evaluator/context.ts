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
 * A diagnostic emitted during evaluation. The union may grow as more
 * silent-null events become introspectable.
 */
export type JjelWarning =
    | {
        kind: 'undefined-identifier';
        identifier: string;
        /** Closest known name within Levenshtein distance ≤ 3, or null. */
        suggestion: string | null;
    }
    | {
        kind: 'property-not-found';
        /** The property name that was looked up but not present on the host. */
        identifier: string;
        /** Closest available property name within Levenshtein distance ≤ 3, or null. */
        suggestion: string | null;
    }
    | {
        kind: 'ambiguous-instance';
        /** The M1 instance name shared by 2+ pool instances (intentionally unbound). */
        identifier: string;
        /** How many pool instances share this name. */
        count: number;
        /** A sample owning class name for the qualified-form hint, or null. */
        sampleClass: string | null;
        /**
         * The instances the name could have meant, when the producer supplies
         * them. Absent (not empty) when it does not: a consumer must be able to
         * tell "no names available" from "named nobody". Never shortened here —
         * truncation is a copy decision, see `formatAmbiguousCandidates`.
         */
        candidates?: AmbiguousInstanceCandidate[];
        /** No Levenshtein suggestion for this kind; null for shape parity. */
        suggestion: string | null;
    };

/**
 * Reserved key under which `buildEvalContext` passes the M1 instance-name
 * ambiguity map (name -> { count, sampleClass, candidates? }) inside the
 * initial bindings.
 * The `EvaluationContext` constructor lifts it into `ambiguousInstances` and
 * does NOT expose it as a user-visible variable.
 */
export const AMBIGUOUS_INSTANCES_KEY = '__ambiguousInstances';

/**
 * One instance an ambiguous M1 name could have meant.
 *
 * The pool this describes is `allSubObjects` across EVERY M1 model
 * (`buildEvalContext`), so two homonyms sit at different depths, under
 * different owners, often in different models: the containment `path` is what
 * actually separates them, and the metaclass alone would not. That is the
 * opposite of the jjscript resolution path, whose pool is the roots of one
 * model — measured in
 * `docs/discovery/discovery_2026-08-30_s1b_ambiguita_dichiarata.md` §5, which
 * is why that side names its candidates by metaclass and keeps its own type.
 */
export interface AmbiguousInstanceCandidate {
    /** The instance pointer id. Printed in full: a truncated id addresses nothing. */
    id: string;
    /** Owning metaclass name, or null when the proxy cannot resolve it. */
    className: string | null;
    /** Containment path from the model root, or null when it cannot be built. */
    path: string | null;
}

/** Per-name ambiguity info for the qualified-form pedagogical warning. */
export interface AmbiguousInstanceInfo {
    count: number;
    sampleClass: string | null;
    /**
     * The named candidates, when the producer supplies them. Optional so a
     * producer that only counts stays valid: `count` remains the authority on
     * how many there are, and may exceed `candidates.length`.
     */
    candidates?: AmbiguousInstanceCandidate[];
}

/** How many candidates the copy names before it starts counting instead. */
export const AMBIGUOUS_CANDIDATES_SHOWN = 5;

/** One candidate as a reader sees it: the path first, the metaclass in tow. */
function describeAmbiguousCandidate(c: AmbiguousInstanceCandidate): string {
    if (c.path && c.className) return `${c.path} (${c.className})`;
    return c.path || c.className || c.id;
}

/**
 * The candidate list as one line of copy, or null when there is nothing to name.
 *
 * Null and '' are not the same answer here: null means the producer named
 * nobody, so the caller keeps the copy it had before candidates existed.
 */
export function formatAmbiguousCandidates(
    candidates: AmbiguousInstanceCandidate[] | null | undefined,
    max: number = AMBIGUOUS_CANDIDATES_SHOWN,
): string | null {
    if (!candidates || candidates.length === 0) return null;
    const shown = candidates.slice(0, max).map(describeAmbiguousCandidate);
    const rest = candidates.length - shown.length;
    return rest > 0 ? `${shown.join(', ')}, and ${rest} more` : shown.join(', ');
}

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
    /**
     * M1 instance names that are ambiguous (shared by 2+ pool instances) and so
     * left unbound. Consulted by the evaluator on a resolution miss to emit a
     * pedagogical 'use the qualified form' warning. Lifted from the reserved
     * `AMBIGUOUS_INSTANCES_KEY` binding at construction; inherited by children.
     */
    ambiguousInstances?: Map<string, AmbiguousInstanceInfo>;

    constructor(
        initialBindings?: Record<string, JjelValue>,
        typeRegistry?: TypeRegistry
    ) {
        this.typeRegistry = typeRegistry || new TypeRegistry();
        this.pushScope();

        if (initialBindings) {
            const ambig = (initialBindings as Record<string, unknown>)[AMBIGUOUS_INSTANCES_KEY];
            if (ambig instanceof Map) this.ambiguousInstances = ambig as Map<string, AmbiguousInstanceInfo>;
            for (const [name, value] of Object.entries(initialBindings)) {
                if (name === AMBIGUOUS_INSTANCES_KEY) continue;
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
        // Propagate the ambiguity map so warnings fire inside forall/lambda scopes.
        child.ambiguousInstances = this.ambiguousInstances;
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
