/**
 * JjTL Executor
 * Executes transformations from source models to target models using JjEL for expression evaluation
 */

import {
    TransformationAST,
    ClassMappingAST,
    AttributeMappingAST,
    ConversionAST,
    ForAllMappingAST,
    ExpressionAST,
    LiteralAST,
    IdentifierAST,
    MemberAccessAST,
    NullSafeMemberAccessAST,
    FunctionCallAST,
    BinaryExpressionAST,
    UnaryExpressionAST,
    ConditionalExpressionAST,
    NullCoalesceExpressionAST,
    IsTypeExpressionAST,
    LambdaExpressionAST,
    ValueMappingAST,
    ObjectCreationAST,
    HelperAST,
    ArrayLiteralAST,
    AlertStatementAST,
    NotifyStatementAST,
    LetStatementAST,
    MappingBodyItemAST,
    PromptExpressionAST,
    InputExpressionAST,
    ConfirmExpressionAST,
    JjelExpressionWrapperAST,
} from '../types';
import type { JjelExpression } from '../../jjel/types/ast';

import { getUIBridge } from './UIBridge';

import {
    jjelEval,
    JjelEvaluator,
    EvaluationContext,
    createFunction,
    toJjelValue,
    fromJjelValue,
    isJjelObject,
} from '../../jjel';
import type { JjelValue, JjelFunction } from '../../jjel';

import { toJjelAst } from './astBridge';
import { extractAttributeValues } from '../../jjel/evaluator/modelContext';
import { registerRangeBuiltin, methodFailureOf } from '../../jjel/evaluator/evaluator';

import {
    TraceModel,
    TraceModelBuilder,
    TraceElementRef,
    TraceLinkBuilder,
} from './traceModel';

/**
 * `U.asNumber` of common/U.tsx, verbatim, and the only thing this file took from the
 * joiner barrel, which drags monaco into every importer: seven test files failed at
 * import with `window is not defined` under the node environment (SPEC.md §12.2).
 */
const U = {
    asNumber(val: any, returnInvalid: any = 0, returnNAN: any = NaN): number {
        if (isNaN(val)) return returnNAN;
        if (typeof val === 'number') return val;
        let v = +val;
        if (isNaN(v)) return returnInvalid;
        return v;
    },
};

// Re-export Jjodel converter utilities for convenience
export {
    convertJjodelModelToSource,
    convertLObjectToSource,
    convertResultToJjodel,
    buildSourceLookup,
    buildSourceByClass,
    getSourceAttribute,
    getSourceReference,
    resolveReference,
    resolveReferences,
} from './jjodelConverter';

// Re-export types separately to satisfy isolatedModules
export type { SourceElement, TargetElement } from './jjodelConverter';

// ============================================
// BINDING BY IDENTITY
// ============================================

/**
 * A target created by a rule of this run (pass 1), as opposed to a nested creation.
 * A rule target placed in a containment is marked `__nested` after pass 2, and `__placed`
 * with it (P-2026-11-02-2108): it is still a rule target.
 */
function isRuleTarget(value: unknown): boolean {
    return !!value && typeof value === 'object' && !Array.isArray(value)
        && (value as any).__createdBy === 'JjTL' && (!(value as any).__nested || !!(value as any).__placed);
}

/**
 * `fromJjelValue` for a value about to be bound, except that a rule target is kept
 * as the live instance (P-2026-11-02-1742, slice A0, R-JTG-2). A copy taken at bind
 * time missed whatever pass 2 bound on that target later, so rule order decided what
 * the parent held. Identity also lets two targets point at each other: the walk stops
 * at a rule target, so it never follows such a cycle.
 *
 * An object created in a body (`__nested`) is converted in place and kept too
 * (P-2026-11-02-1956): it may be the container of a placed rule target, and the
 * ownership map names it by identity. The executor made it, so no one else holds it.
 */
function fromJjelValueKeepingTargets(value: JjelValue): unknown {
    if (isRuleTarget(value)) return value;
    if (Array.isArray(value)) return value.map(fromJjelValueKeepingTargets);
    if (isJjelObject(value) && (value as any).__createdBy === 'JjTL' && (value as any).__nested) {
        for (const [k, v] of Object.entries(value)) {
            (value as any)[k] = fromJjelValueKeepingTargets(v);
        }
        return value;
    }
    if (isJjelObject(value)) {
        const result: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value)) {
            result[k] = fromJjelValueKeepingTargets(v);
        }
        return result;
    }
    return fromJjelValue(value);
}

/** A short form of a bound value for the console: the full one may be cyclic. */
// TODO: cleanup — unused since the per-binding console.log went (P-2026-11-03-1402).
function describeBoundValue(value: unknown): string {
    if (isRuleTarget(value)) return `<${(value as any).className} from ${(value as any).__sourceId}>`;
    if (value && typeof value === 'object' && (value as any).__ref_result) {
        return `<ref ${((value as any).targets as unknown[]).map(describeBoundValue).join(', ')}>`;
    }
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

// ============================================
// PROXY-SAFE UTILITIES
// ============================================

/**
 * Flatten a Jjodel L-layer proxy into a plain object (SHALLOW — one level only).
 *
 * L-layer proxies (LClass, LObject, etc.) expose computed properties like
 * `isAbstract`, `attributes`, `subClasses`, `references` via proxy getter traps.
 * `Object.keys()`, `Object.entries()`, and the spread operator all call
 * `getOwnPropertyDescriptor` which returns undefined for these trap-only keys,
 * so they are silently dropped.
 *
 * `Reflect.ownKeys()` calls the proxy's `ownKeys` trap directly and returns
 * ALL keys (D-layer own + L-layer getters), which we then read via the proxy's
 * `get` trap to capture the computed values.
 *
 * IMPORTANT: Only flattens ONE level. Property values are kept as-is (may still be
 * proxies). This prevents infinite loops from circular proxy references
 * (e.g., LClass.attributes[0].owner → LClass).
 */
function flattenProxy(obj: any): Record<string, any> {
    if (obj == null || typeof obj !== 'object' || Array.isArray(obj)) {
        return obj;
    }

    const result: Record<string, any> = {};
    let keys: (string | symbol)[];
    try {
        keys = Reflect.ownKeys(obj);
    } catch {
        keys = Object.keys(obj);
    }

    for (const key of keys) {
        if (typeof key === 'symbol') continue;
        if (key === 'constructor' || key === '_proxied') continue;
        try {
            result[key] = obj[key];
        } catch {
            // Skip properties that throw on access
        }
    }

    return result;
}

/**
 * Iterate own properties of an object using Reflect.ownKeys (proxy-safe).
 * Returns [key, value] pairs like Object.entries, but captures proxy getter keys.
 */
function proxyEntries(obj: any): [string, any][] {
    if (obj == null || typeof obj !== 'object') return [];

    let keys: (string | symbol)[];
    try {
        keys = Reflect.ownKeys(obj);
    } catch {
        keys = Object.keys(obj);
    }

    const entries: [string, any][] = [];
    for (const key of keys) {
        if (typeof key === 'symbol') continue;
        if (key === 'constructor' || key === '_proxied') continue;
        try {
            entries.push([key, obj[key]]);
        } catch {
            // Skip
        }
    }
    return entries;
}

/**
 * Convert a value to JjelValue WITHOUT recursing into objects/arrays.
 *
 * Unlike `toJjelValue()` from JjEL (which recursively converts via Object.entries),
 * this function passes objects and arrays through as-is. This prevents infinite loops
 * when the value contains L-layer proxies with circular references
 * (e.g., LClass.attributes[0].owner → LClass).
 *
 * The JjEL evaluator navigates objects lazily via MemberAccess (obj[prop]),
 * which correctly triggers proxy getters on demand — no need to pre-flatten.
 */
function shallowToJjelValue(value: unknown): JjelValue {
    if (value === null || value === undefined) return null;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return value;
    // Objects and arrays: pass through as-is, let JjEL navigate lazily
    return value as JjelValue;
}

/**
 * Compute the cartesian product of an array of arrays.
 * e.g. cartesianProduct([[a,b],[1,2]]) → [[a,1],[a,2],[b,1],[b,2]]
 */
function cartesianProduct<T>(arrays: T[][]): T[][] {
    if (arrays.length === 0) return [[]];
    return arrays.reduce<T[][]>(
        (acc, arr) => acc.flatMap(combo => arr.map(item => [...combo, item])),
        [[]]
    );
}

/**
 * Deep-copy a source model safely, handling circular references.
 * Falls back to the original value if serialization fails (e.g., due to proxies).
 */
function safeDeepCopy(sourceModel: any): any {
    if (sourceModel == null) return sourceModel;

    // For arrays: shallow-copy each element via flattenProxy (captures proxy keys)
    if (Array.isArray(sourceModel)) {
        return sourceModel.map(item => {
            if (item && typeof item === 'object') {
                return flattenProxy(item);
            }
            return item;
        });
    }

    // For objects with classes/instances arrays
    if (typeof sourceModel === 'object') {
        const result: any = {};
        for (const [key, value] of proxyEntries(sourceModel)) {
            if (Array.isArray(value)) {
                result[key] = value.map((item: any) => {
                    if (item && typeof item === 'object') {
                        return flattenProxy(item);
                    }
                    return item;
                });
            } else {
                result[key] = value;
            }
        }
        return result;
    }

    return sourceModel;
}

// ============================================
// TYPES
// ============================================

/**
 * Entry in the name-keyed trace map.
 * One source element can produce multiple target elements (from different rules).
 */
interface TargetEntry {
    source: any;
    target: any;
    rule: ClassMappingAST;
    targetClass: string;
    /** Third part of the trace key (source, rule, environment), R-JTG-6. */
    environment: TraceEnvironment;
}

/**
 * The environment of a rule application, and the third part of a trace key (R-JTG-5,
 * R-JTG-6). Dynamically scoped: an application inherits its caller's environment unless
 * a called rule receives one through an `Env` parameter. Each frame binds names to
 * closures; a lookup walks the frames innermost first. Trace keys compare environments
 * structurally (envKey), so two frames binding the same closures are one key.
 */
interface Environment {
    readonly parent: Environment | null;
    readonly bindings: ReadonlyMap<string, Closure>;
}
/** A bound value: the expression as written and the environment of its binding site. */
interface Closure {
    readonly value: any;
    readonly env: Environment;
}
type TraceEnvironment = Environment;
const EMPTY_ENVIRONMENT: TraceEnvironment = Object.freeze({ parent: null, bindings: new Map<string, Closure>() });

/**
 * Deepest nesting of rule applications (called, lazy, delegating, closures) before a
 * run stops as non-terminating: a recursive call that makes no progress ends in an
 * error naming the application stack instead of hanging the browser (P-2026-11-02-2224).
 */
const MAX_APPLICATION_DEPTH = 256;

/**
 * A rule application asked for during an expression and carried out by the binding that
 * receives it (slice B). JjEL builtins are synchronous and a rule body is evaluated with
 * the async binding machinery, so a call evaluates to a marker `{ __jjtlDemand: id }`,
 * realized by realizeDemands before the binding resolves its value. The marker is plain
 * data: a copy made by fromJjelValue still names the same demand.
 */
interface CallDemand {
    kind: 'call';
    rule: ClassMappingAST;
    args: any[];
    callerEnv: TraceEnvironment;
}
/** The value bound to `name`, asked for by envLookup: lowered under the closure's environment. */
interface ClosureDemand {
    kind: 'closure';
    name: string;
    closure: Closure;
}
type Demand = CallDemand | ClosureDemand;

/** One rule application on the stack, named in errors (rule, source element, environment). */
interface ApplicationFrame {
    rule: string;
    source: string;
    env: TraceEnvironment;
}

/** Stops the run: rethrown by every binding, reported once at the top. */
class JjtlApplicationAbort extends Error {}

/**
 * A builtin that threw inside a JjTL expression (R-FA-11), or a JjEL method that
 * failed there (R-FA-12, kind 'Method'): it stops the mapping with an error on
 * both parser paths, never a warning with `null`. The message names the builtin
 * or method and, once `evaluateExpression` has located it, the outermost
 * expression it was evaluated in and the rule and source element of the run
 * (R-FA-13 for a builtin).
 */
class JjtlBuiltinError extends Error {
    /** Where the run was when it failed, ` (rule '...', source element '...')`; set by the innermost evaluateExpression. */
    origin = '';

    constructor(readonly builtin: string, readonly reason: string, readonly kind: 'Builtin' | 'Method' = 'Builtin') {
        super(`${kind} '${builtin}' failed: ${reason}`);
    }

    /** Called by each enclosing evaluateExpression: the outermost call names the expression. */
    locate(expr: ExpressionAST): void {
        const start = expr.location?.start;
        const where = start ? `expression at line ${start.line}, column ${start.column}` : 'expression';
        this.message = `${this.kind} '${this.builtin}' failed in ${where}${this.origin}: ${this.reason}`;
    }
}

/**
 * The evaluation context of a run. Every builtin registered on it (range, resolve,
 * helpers, called rules, the environment functions) throws a JjtlBuiltinError
 * when it fails, whichever evaluator calls it. Child contexts share its builtins.
 */
class JjtlEvaluationContext extends EvaluationContext {
    registerBuiltin(name: string, fn: JjelFunction): void {
        super.registerBuiltin(name, {
            ...fn,
            call: (args, ctx) => {
                try {
                    return fn.call(args, ctx);
                } catch (error) {
                    if (error instanceof JjtlBuiltinError || error instanceof JjtlApplicationAbort) throw error;
                    throw new JjtlBuiltinError(name, error instanceof Error ? error.message : String(error));
                }
            },
        });
    }
}

/**
 * The JjEL evaluator of a run: a demand used as the operand of an operator stops the run
 * (P-2026-11-08-0740). A demand is carried out only where a binding places it; as an operand
 * JjEL sees the marker object, and `+` wrote `"[object Object]_w"` or `null` with
 * `success true`. Operands are marked when their operator node is evaluated, before them,
 * so the check is structural; JjEL reaches every subexpression through `evaluate`.
 */
class JjtlJjelEvaluator extends JjelEvaluator {
    private readonly operands = new WeakMap<JjelExpression, string>();

    constructor(private readonly demandSource: (value: unknown) => string | undefined) {
        super();
    }

    evaluate(expr: JjelExpression, ctx?: EvaluationContext): JjelValue {
        if (expr.type === 'Binary') {
            this.operands.set(expr.left, `an operand of '${expr.operator}'`);
            this.operands.set(expr.right, `an operand of '${expr.operator}'`);
        } else if (expr.type === 'Unary') {
            this.operands.set(expr.operand, `the operand of '${expr.operator}'`);
        }
        const value = super.evaluate(expr, ctx);
        if (value !== null && typeof value === 'object') {
            const use = this.operands.get(expr);
            const source = use !== undefined ? this.demandSource(value) : undefined;
            if (source !== undefined) {
                throw new JjtlBuiltinError(source, `its result, a demand, is ${use}; a demand is carried out only ` +
                    'where a binding places it; bind it with let, or read a bound value with envValue');
            }
        }
        return value;
    }
}

/** Key under which a delegating rule's error carries the application stack of its throw. */
const APPLICATION_STACK = Symbol('jjtlApplicationStack');

/** Who holds a rule target placed by a containment binding (slice A, R-JTG-4). */
interface ContainmentClaim {
    container: any;
    feature: string;
    rule?: string;
}

/**
 * State carried from Pass 1 to Pass 2 for a single source/target pair.
 * Holds everything the binding phase needs to evaluate attributes on the
 * already-created target instance.
 */
interface PendingBinding {
    sourceInstance: any;
    /** Synthetic source for multi-source mappings; identical to sourceInstance for single-source */
    evalSource: any;
    targetInstance: any;
    traceLink: TraceLinkBuilder;
    sourceAlias?: string;
}

/**
 * Context for transformation execution
 */
export interface ExecutionContext {
    /** Source model containing instances to transform */
    sourceModel: any;
    /** Target metamodel for type validation */
    targetMetamodel?: any;
    /** Trace mapping: source instance -> target instance(s) */
    trace: Map<any, any>;
    /** JjEL evaluation context with variables */
    evalContext: EvaluationContext;
    /** Registered helper functions */
    helpers: Map<string, JjelFunction>;
    /** Trace model builder for recording execution trace */
    traceBuilder: TraceModelBuilder;
    /** Current rule name for dialog context (e.g. "Person -> Human") */
    currentRuleName?: string;
    /** Current source instance name for dialog context (e.g. "Mario") */
    currentInstanceName?: string;
    /**
     * Cross-type resolution index: source class name → rules that match it.
     * Built once before Pass 1; consulted during binding evaluation.
     */
    rulesBySourceType: Map<string, ClassMappingAST[]>;
    /**
     * Name-keyed trace: source element name → target entries created from it.
     * Populated in Pass 1; consulted by resolve() and implicit cross-type
     * resolution during Pass 2.
     */
    targetsBySourceName: Map<string, TargetEntry[]>;
    /**
     * Pending bindings per mapping: Pass 1 populates this list for each mapping,
     * Pass 2 drains it to evaluate attribute bindings on the already-created
     * target instances.
     */
    pendingByMapping: Map<ClassMappingAST, PendingBinding[]>;
}

/**
 * Result of transformation execution
 */
export interface ExecutionResult {
    /** Whether execution completed successfully */
    success: boolean;
    /** Created target model */
    targetModel?: TargetModel;
    /** Trace mapping: source -> target */
    trace?: Map<any, any>;
    /** Structured trace model for visualization and bidi support */
    traceModel?: TraceModel;
    /** Error messages */
    errors: string[];
    /** Warning messages */
    warnings: string[];
    /** Execution statistics */
    stats?: ExecutionStats;
}

/**
 * Target model structure
 */
export interface TargetModel {
    /** All created instances by class name */
    instances: Map<string, any[]>;
    /** Root instances (top-level elements) */
    roots: any[];
    /**
     * Rule targets placed by a containment binding, with the object and feature that
     * hold them (slice A, R-JTG-4). None of them is in `roots`.
     */
    containment?: Map<any, { container: any; feature: string }>;
}

/**
 * Execution statistics
 */
export interface ExecutionStats {
    /** Number of source instances processed */
    sourceInstancesProcessed: number;
    /** Number of target instances created */
    targetInstancesCreated: number;
    /** Number of class mappings executed */
    classMappingsExecuted: number;
    /** Number of attribute mappings executed */
    attributeMappingsExecuted: number;
    /** Execution time in milliseconds */
    executionTimeMs: number;
}

// ============================================
// EXECUTOR CLASS
// ============================================

/** A feature (attribute or reference) of a target metamodel class. */
interface TargetFeatureInfo {
    name: string;
    isReference: boolean;
    /** Name of the referenced class; references only. */
    typeName?: string;
    composition?: boolean;
}

/** The feature a binding's value is reached through, and its declared type when known. */
interface Reach {
    feature: string;
    typeName?: string;
}

/** A class of the target metamodel, indexed by name. */
interface TargetClassInfo {
    name: string;
    isAbstract?: boolean;
    superNames: string[];
    features: Map<string, TargetFeatureInfo>;
}

/**
 * What an `AttributeMapping` carrying an `objectCreation` actually means.
 *
 * The parser produces two shapes for the same node. `-> feature { -> Class {} }`
 * yields `targetAttribute = feature`, `objectCreation.targetClass = Class`;
 * `-> feature { forall ... }` falls into the "nested mapping body" branch and
 * yields `targetClass = feature`, with the real creations inside the body. The
 * feature name is `targetAttribute` in BOTH, which is why placement never needs
 * the metamodel — only validation does.
 */
type CreationShape =
    | { kind: 'featureCreation'; featureName: string; className: string }
    | { kind: 'featureForAll'; featureName: string }
    | { kind: 'ruleLevelClass'; className: string }
    | { kind: 'unknownFeature'; featureName: string }
    | { kind: 'unsupportedBody'; featureName: string };

export class JjtlExecutor {
    private ast: TransformationAST;
    private context!: ExecutionContext;
    private jjelEvaluator: JjelEvaluator = new JjtlJjelEvaluator(value => {
        const demand = this.demandOf(value);
        return demand?.kind === 'call' ? demand.rule.ruleName ?? 'a called rule' : demand ? 'envLookup' : undefined;
    });
    private errors: string[] = [];
    private warnings: string[] = [];
    // Target classes referenced by mappings that don't exist in the target
    // metamodel. Populated by validateTargetClasses and consulted by
    // executeClassMapping to skip the mapping instead of creating orphan
    // instances under an unknown className.
    private unknownTargetClasses: Set<string> = new Set();
    // Source classes referenced by mappings that never appear in the source
    // model. Populated lazily when executeClassMapping sees them; kept so we
    // don't emit the same warning per-rule for the same missing class.
    private warnedSourceClasses: Set<string> = new Set();
    // Target metamodel indexed by class name: features (attributes + references)
    // and supertypes. Empty when no target metamodel was handed over — every
    // lookup then returns undefined and the executor keeps its unvalidated
    // behaviour, which is what most unit tests exercise.
    private targetClasses: Map<string, TargetClassInfo> = new Map();
    // Readable stand-ins for `{ __ref: id }` source values, one per id per run,
    // and plain-data views of the source objects that hold such values. See
    // liftSourceRefs.
    private sourceRefHandles: Map<string, any> = new Map();
    private sourceViews: WeakMap<object, any> = new WeakMap();
    private sourceIndexById: Map<string, any> | null = null;
    // Member reads on unresolved references made by the JjEL evaluation in
    // progress; null outside one. Drained into a warning by evaluateExpression.
    private unresolvedReads: Set<string> | null = null;
    // Containment placement (slice A, R-JTG-4): rule target -> the object whose
    // containment feature holds it. Decided here, before any write-back.
    private containerOf: Map<any, ContainmentClaim> = new Map();
    // Second claims, formatted after pass 2 so the names of both containers are bound.
    private containmentConflicts: { target: any; first: ContainmentClaim; second: ContainmentClaim }[] = [];
    // Objects created in a body -> the object whose feature holds them; walked with
    // containerOf to find containment cycles.
    private nestedParentOf: WeakMap<object, any> = new WeakMap();
    // Slice B (P-2026-11-02-2224): the target model, reached by rules applied in pass 2;
    // pending demands by id; the stack of rule applications, whose top holds the
    // environment of the application in progress (dynamic scope).
    private targetModelRef: TargetModel | null = null;
    private demands: Map<number, Demand> = new Map();
    private applicationStack: ApplicationFrame[] = [];
    // Environments by marker id (`{ __jjtlEnv: id }` survives JjEL copies), their
    // structural keys, and what each (rule, source, environment) realized to.
    private environments: Map<number, Environment> = new Map();
    private envKeys: WeakMap<Environment, string> = new WeakMap();
    private objectKeys: WeakMap<object, number> = new WeakMap();
    private objectKeyCount = 0;
    private realized: Map<string, any> = new Map();
    // Lazy rules by source class (step 4, R-JTG-7), and every rule's position, the rule
    // part of the (rule, source, environment) key.
    private lazyBySourceType: Map<string, ClassMappingAST[]> = new Map();
    private ruleIds: Map<ClassMappingAST, number> = new Map();
    private stats: ExecutionStats = {
        sourceInstancesProcessed: 0,
        targetInstancesCreated: 0,
        classMappingsExecuted: 0,
        attributeMappingsExecuted: 0,
        executionTimeMs: 0,
    };

    constructor(ast: TransformationAST) {
        this.ast = ast;
    }

    /**
     * Execute the transformation on a source model
     * NOTE: Creates a deep copy of sourceModel to prevent mutation of the original data
     */
    async execute(sourceModel: any, targetMetamodel?: any): Promise<ExecutionResult> {
        // console.log('[JjTL Executor] Starting execution...');
        // console.log('[JjTL Executor] AST:', this.ast);
        // console.log('[JjTL Executor] AST mappings count:', this.ast?.mappings?.length ?? 0);

        // Flatten L-layer proxies into plain objects (shallow — one level only).
        // JSON.parse(JSON.stringify()) is NOT used because L-layer proxies have
        // circular references (e.g., LClass.attributes[0].owner → LClass) that
        // cause infinite loops during serialization.
        // safeDeepCopy uses flattenProxy (Reflect.ownKeys) to materialize proxy
        // getter properties into plain object keys at the top level only.
        const sourceModelCopy = sourceModel ? safeDeepCopy(sourceModel) : sourceModel;

        // === DEBUG: Step 4 — Source model pipeline ===
        // console.log('=== SOURCE MODEL ENTRY (before copy) ===');
        if (Array.isArray(sourceModel) && sourceModel.length > 0) {
            const first = sourceModel[0];
            // console.log('first instance type:', typeof first);
            // console.log('first instance constructor:', first?.constructor?.name);
            // console.log('first instance keys:', Object.keys(first));
            // console.log('first instance ownKeys:', Reflect.ownKeys(first));
            // console.log('first instance has $name:', '$name' in first);
            // console.log('first instance has $surname:', '$surname' in first);
            if ('$surname' in first) {
                // console.log('first instance $surname:', first['$surname']);
                // console.log('first instance $surname.value:', first['$surname']?.value);
            }
        } else if (sourceModel && typeof sourceModel === 'object') {
            // console.log('sourceModel keys:', Object.keys(sourceModel));
        }
        // console.log('=== SOURCE MODEL ENTRY (after copy) ===');
        if (Array.isArray(sourceModelCopy) && sourceModelCopy.length > 0) {
            const firstCopy = sourceModelCopy[0];
            // console.log('first copy type:', typeof firstCopy);
            // console.log('first copy constructor:', firstCopy?.constructor?.name);
            // console.log('first copy keys:', Object.keys(firstCopy));
            // console.log('first copy ownKeys:', Reflect.ownKeys(firstCopy));
            // console.log('first copy has $name:', '$name' in firstCopy);
            // console.log('first copy has $surname:', '$surname' in firstCopy);
            if ('$surname' in firstCopy) {
                // console.log('first copy $surname:', firstCopy['$surname']);
                // console.log('first copy $surname.value:', firstCopy['$surname']?.value);
            }
        }
        // === END DEBUG Step 4 ===

        // console.log('[JjTL Executor] Source model (flattened):', sourceModelCopy);
        // console.log('[JjTL Executor] Target metamodel:', targetMetamodel);

        const startTime = performance.now();

        try {
            // Initialize context with the COPY, not the original
            this.initializeContext(sourceModelCopy, targetMetamodel);

            // Register helpers
            this.registerHelpers();

            // Called rules become JjEL builtins (slice B)
            this.registerRules();

            // Create target model container
            const targetModel: TargetModel = {
                instances: new Map(),
                roots: [],
            };
            this.targetModelRef = targetModel;

            // Get all source instances from the COPY
            const sourceInstances = this.extractSourceInstances(sourceModelCopy);

            // Index the target metamodel (classes + features), then validate
            // target classes (e.g. reject abstract targets)
            this.buildTargetClassIndex();
            this.validateTargetClasses();

            // If validation errors, return early
            if (this.errors.length > 0) {
                this.stats.executionTimeMs = performance.now() - startTime;
                return {
                    success: false,
                    errors: this.errors,
                    warnings: this.warnings,
                    stats: this.stats,
                };
            }

            // Two-pass execution:
            //   Pass 1 — match each mapping against source instances, evaluate
            //   guard (`where`), create empty target instances, register them
            //   in the trace. No bindings evaluated here.
            //   Pass 2 — evaluate bindings with the full trace available, so
            //   cross-type resolution (source element → target element) works
            //   regardless of rule order.
            const totalMappings = this.ast.mappings.length;

            for (let mi = 0; mi < totalMappings; mi++) {
                const mapping = this.ast.mappings[mi];
                await this.pass1CreateTargets(mapping, sourceInstances, targetModel);
            }

            for (let mi = 0; mi < totalMappings; mi++) {
                const mapping = this.ast.mappings[mi];
                await this.pass2BindAttributes(mapping);
            }

            // Containment placement: report second claims and cycles, take the
            // placed targets out of roots, record the placements in the trace.
            this.settleContainment(targetModel);

            this.stats.executionTimeMs = performance.now() - startTime;

            // Build final trace model
            const traceModel = this.context.traceBuilder.build();

            // Log trace stats
            const traceStats = this.context.traceBuilder.getStats();
            // console.log('[JjTL Executor] Trace stats:', traceStats);
            // console.log('[JjTL Executor] Trace model:', {
            //     transformationName: traceModel.transformationName,
            //     linksCount: traceModel.links.length,
            //     invertiblePercentage: traceStats.invertiblePercentage + '%',
            // });

            // A failed run returns no target model, so no caller can write a
            // partial one (R-FA-14).
            const success = this.errors.length === 0;
            return {
                success,
                targetModel: success ? targetModel : undefined,
                trace: this.context.trace,
                traceModel,
                errors: this.errors,
                warnings: this.warnings,
                stats: this.stats,
            };
        } catch (error) {
            this.stats.executionTimeMs = performance.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.errors.push(`Execution failed: ${errorMessage}`);

            return {
                success: false,
                errors: this.errors,
                warnings: this.warnings,
                stats: this.stats,
            };
        }
    }

    /**
     * Collect the class elements of the target metamodel, whatever shape it
     * arrives in: an array, an LModel-like object with `.classes`, or a tree
     * with `.children`. Shared by validateTargetClasses and the feature index.
     */
    private collectTargetClassElements(): any[] {
        const tm = this.context.targetMetamodel;
        if (!tm) return [];
        const allClasses: any[] = [];
        const traverse = (el: any) => {
            if (el?.type === 'class' || el?.className === 'DClass') {
                allClasses.push(el);
            }
            if (el?.children && Array.isArray(el.children)) {
                el.children.forEach(traverse);
            }
        };
        if (Array.isArray(tm)) {
            tm.forEach(traverse);
        } else if (tm?.classes && Array.isArray(tm.classes)) {
            tm.classes.forEach((el: any) => traverse(el));
        }
        return allClasses;
    }

    /**
     * Index the target metamodel by class name, with the features of each class.
     *
     * This is what makes `-> feature { ... }` resolvable: a feature name is looked
     * up here and never validated as a class. Reads both the L-layer accessors
     * (`allAttributes`, `allReferences`, `allSuperClasses` on an LClass proxy) and
     * the plain-object shape used by tests (`attributes`, `references`, `extends`).
     */
    private buildTargetClassIndex(): void {
        this.targetClasses = new Map();
        const nameOf = (v: any): string | undefined => {
            if (!v) return undefined;
            if (typeof v === 'string') return v;
            return typeof v.name === 'string' ? v.name : undefined;
        };
        for (const el of this.collectTargetClassElements()) {
            const className = nameOf(el);
            if (!className) continue;
            const features = new Map<string, TargetFeatureInfo>();
            const attrs: any[] = el.allAttributes || el.attributes || [];
            for (const a of attrs) {
                const n = nameOf(a);
                if (n) features.set(n, { name: n, isReference: false });
            }
            const refs: any[] = el.allReferences || el.references || [];
            for (const r of refs) {
                const n = nameOf(r);
                if (!n) continue;
                features.set(n, {
                    name: n,
                    isReference: true,
                    typeName: nameOf(r.type),
                    composition: !!(r.composition || r.containment),
                });
            }
            const supers: any[] = el.allSuperClasses || el.superclasses || el.extends || [];
            const superNames = supers.map(nameOf).filter((n): n is string => !!n && n !== className);
            this.targetClasses.set(className, {
                name: className,
                isAbstract: !!el.isAbstract,
                superNames,
                features,
            });
        }
    }

    /** True when the target metamodel is known well enough to validate against. */
    private hasTargetClassIndex(): boolean { return this.targetClasses.size > 0; }

    /** A feature (attribute or reference) of `className`, or undefined. */
    private resolveTargetFeature(className: string, featureName: string): TargetFeatureInfo | undefined {
        return this.targetClasses.get(className)?.features.get(featureName);
    }

    /** `className` itself or any of its (transitive) supertypes equals `ancestorName`. */
    private classIsOrExtends(className: string, ancestorName: string): boolean {
        if (className === ancestorName) return true;
        const seen = new Set<string>();
        const stack = [...(this.targetClasses.get(className)?.superNames || [])];
        while (stack.length) {
            const n = stack.pop()!;
            if (n === ancestorName) return true;
            if (seen.has(n)) continue;
            seen.add(n);
            stack.push(...(this.targetClasses.get(n)?.superNames || []));
        }
        return false;
    }

    /**
     * The feature of `ownerClassName` that can hold instances of `createdClassName`
     * — used by a rule-level `forall ... -> Class { ... }`, which names no feature.
     * Returns the reference only when EXACTLY ONE matches: with none or several the
     * caller falls back to the pluralization heuristic and says so.
     */
    private findFeatureForCreatedClass(
        ownerClassName: string, createdClassName: string
    ): TargetFeatureInfo | undefined {
        const info = this.targetClasses.get(ownerClassName);
        if (!info) return undefined;
        const matches: TargetFeatureInfo[] = [];
        for (const f of info.features.values()) {
            if (!f.isReference || !f.typeName) continue;
            if (this.classIsOrExtends(createdClassName, f.typeName)) matches.push(f);
        }
        return matches.length === 1 ? matches[0] : undefined;
    }

    /**
     * Validate target classes in all mappings.
     * Rejects abstract classes as transformation targets.
     */
    private validateTargetClasses(): void {
        const tm = this.context.targetMetamodel;
        if (!tm) return;

        const allClasses: Array<{ name: string; isAbstract?: boolean }> = this.collectTargetClassElements();

        const classMap = new Map(allClasses.map(c => [c.name, c]));
        const knownNames = new Set(classMap.keys());
        const abstractNames = new Set(allClasses.filter(c => c.isAbstract).map(c => c.name));

        // Bail only if we couldn't enumerate any classes at all — we can't
        // validate against an unknown metamodel shape.
        if (knownNames.size === 0) return;

        // Find concrete subclasses for helpful messages
        const findConcreteSubclasses = (abstractName: string): string[] => {
            // Simple heuristic: non-abstract classes in the same metamodel
            // A full implementation would check inheritance; for now list all concrete classes
            return allClasses
                .filter(c => !c.isAbstract && c.name !== abstractName)
                .map(c => c.name);
        };

        // Check class mappings
        const checkTarget = (targetClass: string, context: string) => {
            if (abstractNames.has(targetClass)) {
                const concrete = findConcreteSubclasses(targetClass);
                const suggestion = concrete.length > 0
                    ? ` Use concrete subclasses: ${concrete.join(', ')}`
                    : '';
                this.errors.push(
                    `Cannot use abstract class '${targetClass}' as transformation target in ${context}.${suggestion}`
                );
            } else if (!knownNames.has(targetClass)) {
                // A target the metamodel lacks stops the run before pass 1, as an abstract
                // target does: going on wrote a partial model that looked done. Rule targets
                // P-2026-11-04-0015 (ratified 2026-11-03); nested creations P-2026-11-04-0255
                // (ratified 2026-11-04), R-JTG-17; inside a let body P-2026-11-04-0900.
                this.errors.push(`Target class '${targetClass}' not found in target metamodel (${context}). Nothing is written.`);
                this.unknownTargetClasses.add(targetClass);
            }
        };

        // `inLet`: a let body gets the binding check (#445) and the class checks, missing and
        // abstract (R-JTG-17, R-JTG-22, P-2026-11-04-0900); the shape checks never ran there
        // and are left as they were.
        let ruleLabel = '';
        const checkBody = (body: any[], parentContext: string, inLet: boolean = false) => {
            for (const item of body) {
                if (item.type === 'LetStatement' && item.body) {
                    checkBody(item.body, parentContext, true);
                }
                if (item.type === 'AttributeMapping' && !item.objectCreation) {
                    this.warnUndeclaredBinding(item as AttributeMappingAST, parentContext, ruleLabel);
                }
                if (item.type === 'ForAllMapping' && item.objectCreation) {
                    checkTarget(item.objectCreation.targetClass, `forall in ${parentContext}`);
                    if (item.objectCreation.body) {
                        checkBody(item.objectCreation.body, item.objectCreation.targetClass, inLet);
                    }
                }
                if (item.type === 'AttributeMapping' && item.objectCreation) {
                    // `-> feature { ... }`: the feature name is resolved against the
                    // target metamodel and NEVER validated as a class. Only the class
                    // created inside the wrapper is checked against the class names.
                    const shape = this.classifyCreation(item as AttributeMappingAST, parentContext);
                    if (inLet) {
                        if (shape.kind === 'featureCreation') {
                            checkTarget(shape.className, `object creation in ${parentContext}.${shape.featureName}`);
                        }
                    } else switch (shape.kind) {
                        case 'featureCreation':
                            checkTarget(shape.className, `object creation in ${parentContext}.${shape.featureName}`);
                            break;
                        case 'featureForAll':
                            // the forall inside the wrapper is checked by the recursion below
                            break;
                        case 'ruleLevelClass':
                            this.errors.push(
                                `Object creation must be nested in a feature: write ` +
                                `'-> feature { -> ${shape.className} { ... } }' in '${parentContext}', ` +
                                `not '-> ${shape.className} { ... }'. ` +
                                `A bare class creation has no feature to be stored in.`
                            );
                            break;
                        case 'unknownFeature':
                            this.warnings.push(
                                `Feature '${shape.featureName}' not found on target class '${parentContext}' ` +
                                `(object creation). Nothing is created for it.`
                            );
                            break;
                        case 'unsupportedBody':
                            this.warnings.push(
                                `'-> ${shape.featureName} { ... }' in '${parentContext}' contains neither ` +
                                `'-> Class { ... }' nor 'forall ... -> Class { ... }'. Nothing is created for it.`
                            );
                            break;
                    }
                    if (item.objectCreation.body) {
                        checkBody(item.objectCreation.body, shape.kind === 'featureCreation'
                            ? shape.className
                            : parentContext, inLet);
                    }
                }
            }
        };

        for (const mapping of [...this.ast.mappings, ...(this.ast.rules ?? [])]) {
            // A delegating rule creates no target of its own (slice B).
            if (mapping.result) continue;
            checkTarget(mapping.targetClass, this.ruleLabel(mapping));
            ruleLabel = this.ruleLabel(mapping);
            if (mapping.body) {
                checkBody(mapping.body, mapping.targetClass);
            }
        }
    }

    /**
     * A binding to a feature its target class does not declare, own or inherited (#445):
     * one warning per binding, in the form of warnUnresolvedReads, never a silent drop.
     * The executor keeps the value on its object, and the write-back writes only declared
     * features, so the warning names what the model will not receive. Silent when the
     * metamodel or the class is unknown: nothing to check against, and an unknown class
     * is warned already.
     */
    private warnUndeclaredBinding(mapping: AttributeMappingAST, className: string, rule: string): void {
        if (!this.hasTargetClassIndex() || !this.targetClasses.has(className)) return;
        const feature = mapping.targetAttribute;
        if (!feature || this.targetClassHasFeature(className, feature)) return;
        const start = mapping.location?.start;
        const where = start ? `binding '${feature}' at line ${start.line}, column ${start.column}` : `binding '${feature}'`;
        const msg = `Rule '${rule || 'transformation'}', ${where}: '${feature}' is not a feature of target class ` +
            `'${className}'; the value is not written to the model.`;
        if (!this.warnings.includes(msg)) this.warnings.push(msg);
    }

    /** A feature of `className` or of any of its (transitive) supertypes. */
    private targetClassHasFeature(className: string, featureName: string): boolean {
        const seen = new Set<string>();
        const stack = [className];
        while (stack.length) {
            const n = stack.pop()!;
            if (seen.has(n)) continue;
            seen.add(n);
            if (this.resolveTargetFeature(n, featureName)) return true;
            stack.push(...(this.targetClasses.get(n)?.superNames || []));
        }
        return false;
    }

    /**
     * Decide what an `AttributeMapping` carrying an `objectCreation` means, given
     * the class of the instance it is written on. See CreationShape.
     *
     * The discriminator between the two parser shapes is `targetClass === targetAttribute`,
     * which the "nested mapping body" branch always produces. It is ambiguous in exactly
     * one case — a feature whose name equals the class it holds, written as
     * `-> Column { -> Column { ... } }` — which lands on 'unsupportedBody' and says so
     * rather than failing silently.
     */
    private classifyCreation(mapping: AttributeMappingAST, ownerClassName: string): CreationShape {
        const creation = mapping.objectCreation!;
        const featureName = mapping.targetAttribute;
        const wrapperIsFallback = creation.targetClass === featureName;
        const hasNestedForAll = (creation.body || []).some((i: any) => i?.type === 'ForAllMapping');

        if (!wrapperIsFallback) {
            if (this.hasTargetClassIndex() && !this.resolveTargetFeature(ownerClassName, featureName)) {
                return { kind: 'unknownFeature', featureName };
            }
            return { kind: 'featureCreation', featureName, className: creation.targetClass };
        }
        if (hasNestedForAll) {
            return { kind: 'featureForAll', featureName };
        }
        // A wrapper with a plain body. With the metamodel known we can tell a
        // rule-level `-> Class { ... }` (D2: an error) from an unsupported wrapper.
        if (this.hasTargetClassIndex()
            && !this.resolveTargetFeature(ownerClassName, featureName)
            && this.targetClasses.has(featureName)) {
            return { kind: 'ruleLevelClass', className: featureName };
        }
        if (this.hasTargetClassIndex() && !this.resolveTargetFeature(ownerClassName, featureName)) {
            return { kind: 'unknownFeature', featureName };
        }
        return { kind: 'unsupportedBody', featureName };
    }

    /**
     * Dereference a `{ __ref: id }` wrapper to the SOURCE object it names.
     *
     * ProjectEditor serializes every reference value as `{ __ref: pointerId }`, so
     * iterating a reference collection (`forall a in ownedAttributes`) handed the body
     * the wrapper instead of the object and `a.name` read undefined. This resolves the
     * pointer against the source array — possible now that contained instances are
     * enumerated. Unrelated to `resolveValue`, which resolves the same wrapper the
     * other way, source to TARGET, through the trace.
     */
    private derefSourceRef(value: any): any {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
        const ref = (value as any).__ref;
        if (typeof ref !== 'string') return value;
        const arr = Array.isArray(this.context?.sourceModel) ? this.context.sourceModel : null;
        if (!arr) return value;
        const found = arr.find((o: any) => o && o.id === ref);
        return found !== undefined ? found : value;
    }

    /**
     * Make `{ __ref: id }` source values readable from a JjEL expression.
     *
     * A forall dereferences each element of its collection (runForAll), but an
     * expression read the same feature as raw wrappers: `requirements.first().kind`
     * was null, in silence. A wrapper is replaced by a handle whose only enumerable
     * key is still `__ref`, so Object.keys, fromJjelValue, JSON and resolveValue's
     * `'__ref' in value` see exactly the wrapper they saw before (the id path of
     * cross-type resolution, fail-open, is unchanged). The features of the source
     * object sit on the handle as non-enumerable getters, which JjEL's `in` and
     * `[]` reach. Arrays are mapped, anything else is returned as is.
     */
    private liftSourceRefs(value: any): any {
        if (Array.isArray(value)) {
            let changed = false;
            const lifted = value.map(el => {
                const out = this.liftSourceRefs(el);
                if (out !== el) changed = true;
                return out;
            });
            return changed ? lifted : value;
        }
        // Own-property check first: it never runs the get trap of an L-layer proxy.
        if (!value || typeof value !== 'object'
            || !Object.prototype.hasOwnProperty.call(value, '__ref')) return value;
        const id = (value as any).__ref;
        if (typeof id !== 'string') return value;
        const cached = this.sourceRefHandles.get(id);
        if (cached) return cached;

        const target = this.derefSourceRef(value);
        let handle: any;
        if (target !== value) {
            handle = { __ref: id };
            for (const [key, raw] of proxyEntries(target)) {
                if (key === '__ref') continue;
                Object.defineProperty(handle, key, {
                    get: () => this.liftSourceRefs(raw),
                    enumerable: false,
                    configurable: true,
                });
            }
        } else {
            // Not in the source model: every member read made by an expression is
            // recorded and reads null, and evaluateExpression turns the record into
            // a warning instead of a silent null.
            handle = new Proxy({ __ref: id }, {
                has: (t, key) => Reflect.has(t, key)
                    || (this.unresolvedReads !== null && typeof key === 'string' && !key.startsWith('__')),
                get: (t, key, receiver) => {
                    if (Reflect.has(t, key)) return Reflect.get(t, key, receiver);
                    // `className` is probed by JjEL itself on every member access.
                    if (this.unresolvedReads !== null && typeof key === 'string'
                        && !key.startsWith('__') && key !== 'then' && key !== 'className') {
                        this.unresolvedReads.add(`'${key}' of '${id}'`);
                    }
                    return undefined;
                },
            });
        }
        this.sourceRefHandles.set(id, handle);
        return handle;
    }

    /**
     * The value an expression sees for a source value: an element of the source
     * model becomes a plain-data view whose reference features are lifted (same
     * keys, so cross-type resolution and the trace see the same object shape);
     * anything else goes through liftSourceRefs. Objects outside the source array,
     * L-layer proxies included, are never copied.
     */
    private bindSourceValue(value: any): JjelValue {
        if (value && typeof value === 'object' && !Array.isArray(value) && this.isSourceElement(value)) {
            return shallowToJjelValue(this.sourceView(value));
        }
        return shallowToJjelValue(this.liftSourceRefs(value));
    }

    /**
     * The value a forall variable sees for one element of its collection. A record
     * built by an expression (`{ hi: q, lo: r }`) reaches the forall through
     * fromJjelValue, which copies it by Object.entries and so drops the getters of
     * the source handles inside it: `pr.hi` was a bare `{ __ref }` and `pr.hi.name`
     * read null. The fields of a plain record are lifted again; every other element
     * goes through bindSourceValue as before.
     */
    private bindForAllElement(item: any): JjelValue {
        if (item && typeof item === 'object' && !Array.isArray(item)
            && Object.getPrototypeOf(item) === Object.prototype
            && !Object.prototype.hasOwnProperty.call(item, '__ref')
            && !this.isSourceElement(item)) {
            const lifted: Record<string, any> = {};
            for (const [key, value] of Object.entries(item)) {
                lifted[key] = this.liftSourceRefs(value);
            }
            return shallowToJjelValue(lifted);
        }
        return this.bindSourceValue(item);
    }

    private isSourceElement(obj: any): boolean {
        const arr = Array.isArray(this.context?.sourceModel) ? this.context.sourceModel : null;
        if (!arr) return false;
        if (!this.sourceIndexById) {
            // First match wins, as in derefSourceRef.
            this.sourceIndexById = new Map();
            for (const o of arr) {
                if (o && typeof o.id === 'string' && !this.sourceIndexById.has(o.id)) {
                    this.sourceIndexById.set(o.id, o);
                }
            }
        }
        const id = obj.id;
        return typeof id === 'string' && this.sourceIndexById.get(id) === obj;
    }

    private sourceView(obj: any): any {
        const cached = this.sourceViews.get(obj);
        if (cached) return cached;
        let changed = false;
        const view: Record<string, any> = {};
        for (const [key, value] of proxyEntries(obj)) {
            const lifted = this.liftSourceRefs(value);
            if (lifted !== value) changed = true;
            view[key] = lifted;
        }
        const result = changed ? view : obj;
        this.sourceViews.set(obj, result);
        return result;
    }

    /**
     * Initialize execution context
     */
    private initializeContext(sourceModel: any, targetMetamodel?: any): void {
        // Create base bindings — use shallowToJjelValue to prevent circular ref loops
        const bindings: Record<string, JjelValue> = {
            source: shallowToJjelValue(sourceModel),
            data: shallowToJjelValue(sourceModel),
        };

        // Add model-specific bindings
        if (sourceModel?.classes) {
            bindings.classes = shallowToJjelValue(sourceModel.classes);
        }
        if (sourceModel?.instances) {
            bindings.instances = shallowToJjelValue(sourceModel.instances);
        }

        // Create trace model builder
        const transformationName = this.ast.name || 'Anonymous';
        const sourceModelName = this.ast.sourceMetamodel || 'source';
        const targetModelName = this.ast.targetMetamodel || 'target';
        const traceBuilder = new TraceModelBuilder(transformationName, sourceModelName, targetModelName);

        // Build rules-by-source-type index for cross-type resolution
        const rulesBySourceType = new Map<string, ClassMappingAST[]>();
        for (const mapping of this.ast.mappings) {
            for (const src of mapping.sources) {
                const list = rulesBySourceType.get(src.className) || [];
                list.push(mapping);
                rulesBySourceType.set(src.className, list);
            }
        }

        this.context = {
            sourceModel,
            targetMetamodel,
            trace: new Map(),
            evalContext: new JjtlEvaluationContext(bindings),
            helpers: new Map(),
            traceBuilder,
            rulesBySourceType,
            targetsBySourceName: new Map(),
            pendingByMapping: new Map(),
        };
        this.sourceRefHandles = new Map();
        this.sourceViews = new WeakMap();
        this.sourceIndexById = null;
        this.containerOf = new Map();
        this.containmentConflicts = [];
        this.nestedParentOf = new WeakMap();
        this.targetModelRef = null;
        this.demands = new Map();
        this.applicationStack = [];
        this.environments = new Map();
        this.envKeys = new WeakMap();
        this.objectKeys = new WeakMap();
        this.objectKeyCount = 0;
        this.realized = new Map();
        this.lazyBySourceType = new Map();
        this.ruleIds = new Map();
        [...this.ast.mappings, ...(this.ast.rules ?? [])].forEach((r, i) => this.ruleIds.set(r, i));
        for (const rule of this.ast.rules ?? []) {
            if (rule.ruleKind !== 'lazy') continue;
            for (const src of rule.sources) {
                const list = this.lazyBySourceType.get(src.className) || [];
                list.push(rule);
                this.lazyBySourceType.set(src.className, list);
            }
        }

        // Register resolve() and resolveAll() as JjEL builtins
        this.registerTraceBuiltins();

        // The executor evaluates in its own context, which the JjelEvaluator's global builtins never reach.
        registerRangeBuiltin(this.context.evalContext);
    }

    /**
     * Register helper functions from AST
     */
    private registerHelpers(): void {
        for (const helper of this.ast.helpers) {
            const helperFn = this.createHelperFunction(helper);
            this.context.helpers.set(helper.name, helperFn);
            this.context.evalContext.registerBuiltin(helper.name, helperFn);
        }
    }

    /**
     * Register trace-related builtins.
     *
     * `resolve` is intercepted at the JjTL executor level (so the optional
     * target-type argument can be read as an identifier name without being
     * evaluated), and the builtin registered here is a fallback that receives
     * already-evaluated args. See `evaluateExpression` for the intercept path.
     *
     * `resolveAll` is kept as a debugging/serialization helper returning
     * TraceElementRefs (names only) — not the actual target instances.
     */
    private registerTraceBuiltins(): void {
        const traceBuilder = this.context.traceBuilder;

        // resolve(sourceElement, targetClassName?) — fallback path (no AST-level
        // identifier hint). Accepts either a source element object or its name.
        const resolveFn = createFunction(
            ['source', 'targetClass'],
            (args: JjelValue[]) => {
                const srcArg = args[0] as any;
                const typeHint = args[1] != null ? String(args[1]) : undefined;
                return this.resolveValue(srcArg, '<resolve>', typeHint) as JjelValue;
            }
        );
        this.context.evalContext.registerBuiltin('resolve', resolveFn);

        // resolveAll(sourceElementName, targetClassName?) -> TraceElementRef[]
        const resolveAllFn = createFunction(
            ['sourceElementName', 'targetClassName'],
            (args: JjelValue[]) => {
                const sourceElementName = String(args[0] ?? '');
                const targetClassName = args[1] ? String(args[1]) : undefined;
                const results = traceBuilder.resolveAll(sourceElementName, targetClassName);
                return toJjelValue(results);
            }
        );
        this.context.evalContext.registerBuiltin('resolveAll', resolveAllFn);
    }

    /**
     * Create a callable function from a helper AST node
     */
    private createHelperFunction(helper: HelperAST): JjelFunction {
        const paramNames = helper.parameters.map(p => p.name);
        // Inside the body the parameters shadow helpers and builtins of the same name
        // (SPEC §3.4); a helper called from here sees its own parameters only
        const shadowed: ReadonlySet<string> = new Set(paramNames);

        return createFunction(paramNames, (args: JjelValue[], ctx: EvaluationContext) => {
            // Create child context with parameter bindings
            const bindings: Record<string, JjelValue> = {};
            paramNames.forEach((name, i) => {
                bindings[name] = args[i] ?? null;
            });

            const childCtx = ctx.child(bindings);
            childCtx.shadowedBuiltins = shadowed;
            return this.evaluateExpression(helper.body, childCtx);
        });
    }

    /**
     * Extract all instances from source model
     */
    private extractSourceInstances(sourceModel: any): Map<string, any[]> {
        const instances = new Map<string, any[]>();

        // console.log('[JjTL Executor] extractSourceInstances: input type:',
            // Array.isArray(sourceModel) ? 'array' : typeof sourceModel);

        // Handle ARRAY of objects directly (from Jjodel model.objects)
        if (Array.isArray(sourceModel)) {
            // console.log('[JjTL Executor] Processing array of', sourceModel.length, 'elements');
            for (const item of sourceModel) {
                if (item && typeof item === 'object') {
                    const className = item.className || item.__type || 'UnknownClass';
                    if (!instances.has(className)) {
                        instances.set(className, []);
                    }
                    instances.get(className)!.push(item);
                    // console.log(`[JjTL Executor] Added instance of "${className}":`, item.name || item.id);
                }
            }
            // console.log('[JjTL Executor] Instances by class:',
                // Array.from(instances.entries()).map(([k, v]) => `${k}: ${v.length}`).join(', '));
            return instances;
        }

        // Handle Jjodel model structure with .classes
        if (sourceModel?.classes && Array.isArray(sourceModel.classes)) {
            // Extract class definitions
            for (const cls of sourceModel.classes) {
                const className = cls.name || cls.className || 'UnknownClass';
                if (!instances.has(className)) {
                    instances.set(className, []);
                }
                instances.get(className)!.push(cls);
            }
        }

        // Handle instances array
        if (sourceModel?.instances && Array.isArray(sourceModel.instances)) {
            for (const inst of sourceModel.instances) {
                const className = inst.className || inst.__type || 'UnknownClass';
                if (!instances.has(className)) {
                    instances.set(className, []);
                }
                instances.get(className)!.push(inst);
            }
        }

        // Handle flat object with typed elements; `classes` and `instances` were read above,
        // and reading them again matched every instance twice (SPEC.md §12.2).
        if (sourceModel && typeof sourceModel === 'object' && !Array.isArray(sourceModel)) {
            for (const [key, value] of Object.entries(sourceModel)) {
                if (key === 'classes' || key === 'instances') continue;
                if (Array.isArray(value)) {
                    // Assume array property contains instances
                    for (const item of value) {
                        if (item && typeof item === 'object') {
                            const className = item.className || item.__type || key;
                            if (!instances.has(className)) {
                                instances.set(className, []);
                            }
                            instances.get(className)!.push(item);
                        }
                    }
                }
            }
        }

        // console.log('[JjTL Executor] Final instances by class:',
            // // Array.from(instances.entries()).map(([k, v]) => `${k}: ${v.length}`).join(', '));

        return instances;
    }

    /**
     * Pass 1: match source instances to this mapping, evaluate its guard (`where`),
     * create empty target instances, and register them in the trace.
     *
     * No attribute bindings are evaluated here — that happens in Pass 2 once the
     * full trace is available, so cross-type resolution (source element → target
     * element) works regardless of rule declaration order.
     */
    private async pass1CreateTargets(
        mapping: ClassMappingAST,
        sourceInstances: Map<string, any[]>,
        targetModel: TargetModel
    ): Promise<void> {
        if (this.unknownTargetClasses.has(mapping.targetClass)) {
            return;
        }

        if (mapping.result) {
            this.pass1Delegating(mapping, sourceInstances);
            return;
        }

        if (mapping.sources.length > 1) {
            await this.pass1MultiSource(mapping, sourceInstances, targetModel);
            return;
        }

        const src = mapping.sources[0];
        const sourceClassName = src.className;
        const sourceAlias = src.alias;
        const targetClassName = mapping.targetClass;

        if (!sourceInstances.has(sourceClassName) && !this.warnedSourceClasses.has(sourceClassName)) {
            const msg = `Source class '${sourceClassName}' has no instances in the source model. Mapping '${sourceClassName} -> ${targetClassName}' produced no output.`;
            console.warn(`[JjTL] ${msg}`);
            this.warnings.push(msg);
            this.warnedSourceClasses.add(sourceClassName);
        }

        const instances = sourceInstances.get(sourceClassName) || [];
        const ruleName = `${sourceClassName} -> ${targetClassName}`;
        const hasGuard = !!mapping.condition;


        this.context.currentRuleName = ruleName;

        const MAX_INSTANCES_PER_MAPPING = 10000;
        let iterCount = 0;
        const pending: PendingBinding[] = [];

        for (const sourceInstance of instances) {
            if (++iterCount > MAX_INSTANCES_PER_MAPPING) {
                const msg = `Aborted '${ruleName}': exceeded ${MAX_INSTANCES_PER_MAPPING} source instances (possible runaway).`;
                console.warn(`[JjTL Executor] ${msg}`);
                this.warnings.push(msg);
                break;
            }
            this.context.currentInstanceName =
                sourceInstance?.name ??
                sourceInstance?.$name?.value ??
                (sourceInstance != null ? String(sourceInstance) : undefined);

            this.stats.sourceInstancesProcessed++;

            if (mapping.condition) {
                const condResult = this.evaluateCondition(mapping.condition, sourceInstance, sourceAlias);
                if (!condResult) {
                    continue;
                }
            }

            const targetInstances = this.createTargetInstances(mapping, sourceInstance, targetModel);

            const sourceRef: TraceElementRef = {
                modelName: this.ast.sourceMetamodel || 'source',
                elementName: sourceInstance.name || sourceInstance.id || `${sourceClassName}_${this.stats.sourceInstancesProcessed}`,
                className: sourceClassName,
            };
            const targetRefs: TraceElementRef[] = targetInstances.map((t, i) => ({
                modelName: this.ast.targetMetamodel || 'target',
                elementName: t.name || t.id || `${targetClassName}_${i}`,
                className: targetClassName,
            }));
            const traceLink = this.context.traceBuilder.addLink(ruleName, sourceRef, targetRefs, hasGuard);

            // Register by name for cross-type resolution during Pass 2
            this.registerTargetsBySourceName(sourceInstance, targetInstances, mapping, targetClassName);

            for (const targetInstance of targetInstances) {
                pending.push({
                    sourceInstance,
                    evalSource: sourceInstance,
                    targetInstance,
                    traceLink,
                    sourceAlias,
                });
            }
        }

        this.context.pendingByMapping.set(mapping, pending);
        this.context.currentInstanceName = undefined;
        this.context.currentRuleName = undefined;
    }

    /**
     * Pass 1 for multi-source mapping (cartesian product). Identical shape to
     * pass1CreateTargets but builds a synthetic evalSource per combo.
     */
    private async pass1MultiSource(
        mapping: ClassMappingAST,
        sourceInstances: Map<string, any[]>,
        targetModel: TargetModel
    ): Promise<void> {
        for (const src of mapping.sources) {
            if (!src.alias) {
                this.errors.push(
                    `Multi-source mapping to '${mapping.targetClass}' requires aliases on every source. ` +
                    `'${src.className}' has no alias.`
                );
                return;
            }
        }

        const targetClassName = mapping.targetClass;
        const hasGuard = !!mapping.condition;
        const ruleName = mapping.sources.map(s => `${s.className} ${s.alias}`).join(', ') + ` -> ${targetClassName}`;

        for (const src of mapping.sources) {
            if (!sourceInstances.has(src.className) && !this.warnedSourceClasses.has(src.className)) {
                const msg = `Source class '${src.className}' has no instances in the source model. Mapping '${ruleName}' produced no output.`;
                console.warn(`[JjTL] ${msg}`);
                this.warnings.push(msg);
                this.warnedSourceClasses.add(src.className);
            }
        }

        const instanceArrays = mapping.sources.map(s => sourceInstances.get(s.className) || []);
        const combinations = cartesianProduct(instanceArrays);
        const pending: PendingBinding[] = [];

        for (const combo of combinations) {
            this.stats.sourceInstancesProcessed++;

            const syntheticSource: Record<string, any> = {};
            if (combo[0] && typeof combo[0] === 'object') {
                for (const [k, v] of proxyEntries(combo[0])) {
                    if (!k.startsWith('__')) syntheticSource[k] = v;
                }
            }
            for (let i = 0; i < mapping.sources.length; i++) {
                syntheticSource[mapping.sources[i].alias!] = combo[i];
            }

            if (mapping.condition) {
                const condResult = this.evaluateCondition(mapping.condition, syntheticSource);
                if (!condResult) continue;
            }

            const targetInstances = this.createTargetInstances(mapping, combo[0], targetModel);

            const sourceRef: TraceElementRef = {
                modelName: this.ast.sourceMetamodel || 'source',
                elementName: mapping.sources.map((s, i) => combo[i]?.name || combo[i]?.id || s.alias!).join('+'),
                className: mapping.sources.map(s => s.className).join(','),
            };
            const targetRefs: TraceElementRef[] = targetInstances.map((t, i) => ({
                modelName: this.ast.targetMetamodel || 'target',
                elementName: t.name || t.id || `${targetClassName}_${i}`,
                className: targetClassName,
            }));
            const traceLink = this.context.traceBuilder.addLink(ruleName, sourceRef, targetRefs, hasGuard);

            // Register by name for each combo element (so cross-type resolution works)
            for (let i = 0; i < mapping.sources.length; i++) {
                this.registerTargetsBySourceName(combo[i], targetInstances, mapping, targetClassName);
            }

            for (const targetInstance of targetInstances) {
                pending.push({
                    sourceInstance: combo[0],
                    evalSource: syntheticSource,
                    targetInstance,
                    traceLink,
                });
            }
        }

        this.context.pendingByMapping.set(mapping, pending);
    }

    /**
     * Register target instances under the source element's name (and id) so
     * both implicit cross-type resolution and explicit `resolve()` can find
     * the target(s) from a source reference.
     */
    private registerTargetsBySourceName(
        sourceInstance: any,
        targetInstances: any[],
        mapping: ClassMappingAST,
        targetClass: string,
        environment: TraceEnvironment = EMPTY_ENVIRONMENT,
    ): void {
        const keys = new Set<string>();
        if (sourceInstance?.name) keys.add(String(sourceInstance.name));
        if (sourceInstance?.id) keys.add(String(sourceInstance.id));
        if (keys.size === 0) return;
        for (const key of keys) {
            const entries = this.context.targetsBySourceName.get(key) || [];
            for (const target of targetInstances) {
                entries.push({ source: sourceInstance, target, rule: mapping, targetClass, environment });
            }
            this.context.targetsBySourceName.set(key, entries);
        }
    }

    /**
     * Pass 2: evaluate attribute bindings on every pending (source, target) pair
     * for this mapping. The full trace is available, so cross-type resolution
     * succeeds regardless of rule order.
     */
    private async pass2BindAttributes(mapping: ClassMappingAST): Promise<void> {
        const pending = this.context.pendingByMapping.get(mapping);
        if (!pending || pending.length === 0) return;

        if (mapping.result) {
            // A binding that reached the element first has already lowered it (realizeSource).
            // An error of one element is that element's, as a binding's is (slice B2): the
            // others are still lowered. The depth-limit abort still ends the run.
            for (const entry of pending) {
                try {
                    await this.realizeSource(entry.sourceInstance, mapping, EMPTY_ENVIRONMENT);
                } catch (error) {
                    if (error instanceof JjtlApplicationAbort) throw error;
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    const stack = (error as any)?.[APPLICATION_STACK] ?? this.applicationStackSuffix();
                    this.errors.push(
                        `Failed to lower ${this.describeSubject(entry.sourceInstance)} by rule ` +
                        `'${this.ruleLabel(mapping)}': ${errorMessage}${stack}`
                    );
                }
            }
            return;
        }

        const ruleName = `${mapping.sources.map(s => s.className).join(', ')} -> ${mapping.targetClass}`;
        this.context.currentRuleName = ruleName;

        for (const entry of pending) {
            this.context.currentInstanceName =
                entry.sourceInstance?.name ??
                entry.sourceInstance?.$name?.value ??
                (entry.sourceInstance != null ? String(entry.sourceInstance) : undefined);

            await this.executeAttributeMappingsWithTrace(
                mapping.body,
                entry.evalSource,
                entry.targetInstance,
                entry.traceLink,
                entry.sourceAlias,
            );
            this.stats.classMappingsExecuted++;
        }

        this.context.currentInstanceName = undefined;
        this.context.currentRuleName = undefined;
    }

    /**
     * Evaluate a condition expression
     */
    private evaluateCondition(condition: ExpressionAST, sourceInstance: any, alias?: string): boolean {
        const ctx = this.createInstanceContext(sourceInstance, alias);
        const result = this.evaluateExpression(condition, ctx);
        return Boolean(result);
    }

    /**
     * Create target instance(s) based on multiplicity
     */
    private createTargetInstances(
        mapping: ClassMappingAST,
        sourceInstance: any,
        targetModel: TargetModel
    ): any[] {
        const targetClassName = mapping.targetClass;
        const multiplicity = mapping.targetMultiplicity;

        // Determine how many instances to create
        let count = 1;
        if (multiplicity) {
            if (multiplicity.upper === -1) {
                // Unbounded: the bound fixes no count. `[*]` (= `[0..*]`) creates one target
                // per source, `[n..*]` creates n, its lower bound (P-2026-11-04-0900).
                count = Math.max(1, multiplicity.lower);
            } else {
                count = multiplicity.upper;
            }
        }

        // Clamp against malformed AST that could otherwise freeze the main thread.
        const MAX_MULTIPLICITY = 1000;
        if (count > MAX_MULTIPLICITY) {
            const msg = `Multiplicity ${count} for target '${targetClassName}' exceeds max ${MAX_MULTIPLICITY}; clamping.`;
            console.warn(`[JjTL Executor] ${msg}`);
            this.warnings.push(msg);
            count = MAX_MULTIPLICITY;
        }

        const created: any[] = [];

        for (let i = 0; i < count; i++) {
            const targetInstance = this.createTargetInstance(targetClassName, sourceInstance);
            created.push(targetInstance);

            // Add to target model
            if (!targetModel.instances.has(targetClassName)) {
                targetModel.instances.set(targetClassName, []);
            }
            targetModel.instances.get(targetClassName)!.push(targetInstance);
            targetModel.roots.push(targetInstance);

            this.stats.targetInstancesCreated++;
        }

        // Update trace
        if (created.length === 1) {
            this.context.trace.set(sourceInstance, created[0]);
        } else {
            this.context.trace.set(sourceInstance, created);
        }

        return created;
    }

    /**
     * Create a single target instance
     * @param className - The TARGET class name (from mapping.targetClass)
     * @param sourceInstance - The source instance being transformed
     */
    private createTargetInstance(className: string, sourceInstance: any): any {
        // IMPORTANT: className must be the TARGET class, not the source class!
        // console.log(`[JjTL Executor] createTargetInstance: creating instance of TARGET class "${className}"`);
        // console.log(`[JjTL Executor] createTargetInstance: from source "${sourceInstance?.className || sourceInstance?.__type}"`);

        const targetInstance = {
            __type: className,
            className,
            __sourceId: sourceInstance?.id || sourceInstance?.name,
            __createdBy: 'JjTL',
        };

        // console.log(`[JjTL Executor] createTargetInstance: created:`, targetInstance);
        return targetInstance;
    }

    /**
     * Execute attribute mappings on a target instance
     */
    private async executeAttributeMappings(
        body: any[],
        sourceInstance: any,
        targetInstance: any,
        alias?: string
    ): Promise<void> {
        // console.log('[JjTL Executor] executeAttributeMappings called:', {
        //     bodyLength: body?.length || 0,
        //     bodyTypes: body?.map(b => b?.type) || [],
        //     sourceInstanceName: sourceInstance?.name,
        //     targetInstanceClassName: targetInstance?.className
        // });

        if (!body || body.length === 0) {
            // console.log('[JjTL Executor] WARNING: No attribute mappings in body!');
            return;
        }

        for (const item of body) {
            // console.log('[JjTL Executor] Processing body item:', {
            //     type: item?.type,
            //     sourceAttribute: item?.sourceAttribute,
            //     targetAttribute: item?.targetAttribute,
            //     hasConversion: !!item?.conversion,
            //     conversionType: item?.conversion?.type,
            //     hasExpression: !!item?.conversion?.expression
            // });

            if (item.type === 'AttributeMapping') {
                await this.executeAttributeMapping(item as AttributeMappingAST, sourceInstance, targetInstance, alias);
                this.stats.attributeMappingsExecuted++;
            } else if (item.type === 'ForAllMapping') {
                await this.executeForAllMapping(item as ForAllMappingAST, sourceInstance, targetInstance, alias);
            } else if (item.type === 'AlertStatement') {
                const alertItem = item as AlertStatementAST;
                const ctx = this.createInstanceContext(sourceInstance, alias);
                const msg = this.evaluateExpression(alertItem.message, ctx);
                await getUIBridge().showAlert(String(msg ?? ''), alertItem.alertType ?? 'info');
            } else if (item.type === 'NotifyStatement') {
                const notifyItem = item as NotifyStatementAST;
                const ctx = this.createInstanceContext(sourceInstance, alias);
                const msg = this.evaluateExpression(notifyItem.message, ctx);
                getUIBridge().showNotify(String(msg ?? ''), notifyItem.duration ?? 3000);
            } else if (item.type === 'LetStatement') {
                const letItem = item as LetStatementAST;
                let letCtx = this.createInstanceContext(sourceInstance, alias);
                const letVars: Record<string, JjelValue> = {};
                for (const binding of letItem.bindings) {
                    const value = await this.letValue(binding.value, letCtx);
                    letVars[binding.name] = value;
                    letCtx = letCtx.child({ [binding.name]: value });
                }
                // Execute let body with enriched context — delegate to a helper
                await this.executeLetBody(letItem.body, sourceInstance, targetInstance, letCtx, alias, letVars);
            }
        }

        // console.log('[JjTL Executor] Target instance after mappings:', targetInstance);
    }

    /**
     * Execute attribute mappings with trace recording
     */
    private async executeAttributeMappingsWithTrace(
        body: any[],
        sourceInstance: any,
        targetInstance: any,
        traceLink: TraceLinkBuilder,
        alias?: string
    ): Promise<void> {
        // console.log('[JjTL Executor] executeAttributeMappingsWithTrace called');

        if (!body || body.length === 0) {
            return;
        }

        for (const item of body) {
            if (item.type === 'AttributeMapping') {
                const mapping = item as AttributeMappingAST;
                await this.executeAttributeMappingWithTrace(mapping, sourceInstance, targetInstance, traceLink, alias);
                this.stats.attributeMappingsExecuted++;
            } else if (item.type === 'ForAllMapping') {
                await this.executeForAllMapping(item as ForAllMappingAST, sourceInstance, targetInstance, alias);
            } else if (item.type === 'AlertStatement') {
                const alertItem = item as AlertStatementAST;
                const ctx = this.createInstanceContext(sourceInstance, alias);
                const msg = this.evaluateExpression(alertItem.message, ctx);
                await getUIBridge().showAlert(String(msg ?? ''), alertItem.alertType ?? 'info');
            } else if (item.type === 'NotifyStatement') {
                const notifyItem = item as NotifyStatementAST;
                const ctx = this.createInstanceContext(sourceInstance, alias);
                const msg = this.evaluateExpression(notifyItem.message, ctx);
                getUIBridge().showNotify(String(msg ?? ''), notifyItem.duration ?? 3000);
            } else if (item.type === 'LetStatement') {
                const letItem = item as LetStatementAST;
                let letCtx = this.createInstanceContext(sourceInstance, alias);
                const letVars: Record<string, JjelValue> = {};
                for (const binding of letItem.bindings) {
                    const value = await this.letValue(binding.value, letCtx);
                    letVars[binding.name] = value;
                    letCtx = letCtx.child({ [binding.name]: value });
                }
                await this.executeLetBodyWithTrace(letItem.body, sourceInstance, targetInstance, letCtx, traceLink, alias, letVars);
            }
        }

        // console.log('[JjTL Executor] Target instance after mappings:', targetInstance);
    }

    /**
     * Execute a single attribute mapping with trace recording
     */
    private async executeAttributeMappingWithTrace(
        mapping: AttributeMappingAST,
        sourceInstance: any,
        targetInstance: any,
        traceLink: TraceLinkBuilder,
        alias?: string
    ): Promise<void> {
        try {
            let value: JjelValue;
            let sourceValue: any = null;
            const hasExpression = !!mapping.conversion?.expression;
            const expressionSource = hasExpression ? this.getExpressionSource(mapping.conversion!.expression!) : undefined;

            if (mapping.objectCreation) {
                const created = await this.executeCreationMapping(
                    mapping, sourceInstance, targetInstance, this.aliasBindings(sourceInstance, alias)
                );
                traceLink.addBinding(
                    null, mapping.targetAttribute, undefined, null,
                    created === undefined ? null : created, false, undefined, undefined
                );
                return;
            } else if (mapping.expression !== undefined) {
                // New := syntax: evaluate expression, optionally apply value mapping
                const ctx = this.createInstanceContext(sourceInstance, alias);
                value = await this.evaluateExpressionAsync(mapping.expression, ctx);
                sourceValue = fromJjelValue(value);
                if (mapping.valueMapping && mapping.valueMapping.length > 0) {
                    const match = mapping.valueMapping.find(vm =>
                        this.valuesEqual(value, this.getLiteralValue(vm.sourceValue))
                    );
                    if (match) value = this.getLiteralValue(match.targetValue);
                }
            } else if (mapping.conversion) {
                // Get source value before conversion (legacy)
                if (mapping.sourceAttribute) {
                    const ctx = this.createInstanceContext(sourceInstance, alias);
                    sourceValue = fromJjelValue(this.evaluatePropertyPath(mapping.sourceAttribute, ctx));
                }
                value = await this.executeConversion(mapping.conversion, sourceInstance, mapping.sourceAttribute, alias);
            } else if (mapping.sourceAttribute) {
                const ctx = this.createInstanceContext(sourceInstance, alias);
                value = this.evaluatePropertyPath(mapping.sourceAttribute, ctx);
                sourceValue = fromJjelValue(value);
            } else {
                value = null;
            }

            // Cross-type resolution: if the binding value is (or contains) a
            // source element whose type has a rule, swap it for the
            // corresponding target element via the trace.
            const resolved = await this.resolveBinding(value, mapping.targetAttribute, targetInstance);

            // Set target attribute
            const finalValue = fromJjelValueKeepingTargets(resolved);
            targetInstance[mapping.targetAttribute] = finalValue;

            // Determine invertibility
            const invertible = this.isBindingInvertible(mapping);

            // Determine if the value was provided by the user via prompt()/input()
            const userProvided = mapping.expression !== undefined
                ? this.isUserProvidedExpression(mapping.expression)
                : false;

            // Record binding in trace
            traceLink.addBinding(
                mapping.sourceAttribute || null,
                mapping.targetAttribute,
                expressionSource,
                sourceValue,
                finalValue,
                invertible,
                invertible ? this.computeInverseExpression(mapping) : undefined,
                userProvided || undefined
            );

            // console.log(`[JjTL Executor] Set ${mapping.targetAttribute} = ${JSON.stringify(finalValue)} (invertible: ${invertible})`);
        } catch (error) {
            if (error instanceof JjtlApplicationAbort) throw error;
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.errors.push(
                `Failed to map ${mapping.sourceAttribute || '(creation)'} -> ${mapping.targetAttribute}: ${errorMessage}` +
                this.applicationStackSuffix()
            );
        }
    }

    /**
     * Determine if a binding is invertible (can be reversed)
     */
    private isBindingInvertible(mapping: AttributeMappingAST): boolean {
        // Object creation is not invertible
        if (mapping.objectCreation) {
            return false;
        }

        // New := syntax
        if (mapping.expression !== undefined) {
            if (mapping.valueMapping && mapping.valueMapping.length > 0) {
                const targetValues = mapping.valueMapping.map(m => JSON.stringify(m.targetValue.value));
                return new Set(targetValues).size === mapping.valueMapping.length;
            }
            return this.isExpressionInvertible(mapping.expression);
        }

        // Legacy -> syntax
        if (!mapping.conversion) {
            return true;
        }
        if (mapping.conversion.mappings && mapping.conversion.mappings.length > 0) {
            const targetValues = mapping.conversion.mappings.map(m => JSON.stringify(m.targetValue.value));
            const uniqueTargets = new Set(targetValues);
            return uniqueTargets.size === mapping.conversion.mappings.length;
        }
        if (mapping.conversion.expression) {
            return this.isExpressionInvertible(mapping.conversion.expression);
        }

        return true;
    }

    /**
     * Check if an expression is invertible
     */
    private isExpressionInvertible(expr: ExpressionAST): boolean {
        switch (expr.type) {
            case 'Identifier':
                // Simple property reference is invertible
                return true;

            case 'MemberAccess':
            case 'NullSafeMemberAccess':
                // Property access is invertible
                return true;

            case 'BinaryExpression': {
                const binExpr = expr as BinaryExpressionAST;
                // String concatenation with constant is invertible if we know the constant
                if (binExpr.operator === '+') {
                    const leftIsLiteral = binExpr.left.type === 'Literal';
                    const rightIsLiteral = binExpr.right.type === 'Literal';
                    // name + '_suffix' is invertible (can strip suffix)
                    // '_prefix' + name is invertible (can strip prefix)
                    return leftIsLiteral || rightIsLiteral;
                }
                return false;
            }

            case 'FunctionCall':
                // Most function calls are not invertible
                return false;

            case 'Literal':
                // Constant values are technically invertible (always same)
                return true;

            default:
                return false;
        }
    }

    /**
     * Compute inverse expression for invertible bindings
     */
    private computeInverseExpression(mapping: AttributeMappingAST): string | undefined {
        const inverseExpr = mapping.expression ?? mapping.conversion?.expression;

        if (inverseExpr) {
            // Handle name + '_suffix' -> strip suffix
            if (inverseExpr.type === 'BinaryExpression') {
                const binExpr = inverseExpr as BinaryExpressionAST;
                if (binExpr.operator === '+' && binExpr.right.type === 'Literal') {
                    const suffix = (binExpr.right as LiteralAST).value;
                    if (typeof suffix === 'string') {
                        return `${mapping.targetAttribute}.substring(0, ${mapping.targetAttribute}.length - ${suffix.length})`;
                    }
                }
                if (binExpr.operator === '+' && binExpr.left.type === 'Literal') {
                    const prefix = (binExpr.left as LiteralAST).value;
                    if (typeof prefix === 'string') {
                        return `${mapping.targetAttribute}.substring(${prefix.length})`;
                    }
                }
            }
            return undefined;
        }

        // Direct copy: inverse is also direct copy
        return mapping.targetAttribute;
    }

    /**
     * Get source representation of an expression (for trace)
     */
    private getExpressionSource(expr: ExpressionAST): string {
        return this.astToSource(expr);
    }

    /**
     * Execute a single attribute mapping
     */
    private async executeAttributeMapping(
        mapping: AttributeMappingAST,
        sourceInstance: any,
        targetInstance: any,
        alias?: string
    ): Promise<void> {
        // console.log('[JjTL Executor] executeAttributeMapping:', {
        //     sourceAttribute: mapping.sourceAttribute,
        //     targetAttribute: mapping.targetAttribute,
        //     hasObjectCreation: !!mapping.objectCreation,
        //     hasConversion: !!mapping.conversion,
        //     conversionExpression: mapping.conversion?.expression?.type,
        //     conversionMappings: mapping.conversion?.mappings?.length
        // });

        try {
            let value: JjelValue;

            if (mapping.objectCreation) {
                // Object creation is placed into a FEATURE of the enclosing target
                // instance, which executeCreationMapping resolves and writes itself.
                await this.executeCreationMapping(mapping, sourceInstance, targetInstance, this.aliasBindings(sourceInstance, alias));
                return;
            } else if (mapping.expression !== undefined) {
                // New := syntax: evaluate expression, optionally apply value mapping
                // console.log('[JjTL Executor] New := syntax, expression type:', mapping.expression.type);
                const ctx = this.createInstanceContext(sourceInstance, alias);
                value = await this.evaluateExpressionAsync(mapping.expression, ctx);
                if (mapping.valueMapping && mapping.valueMapping.length > 0) {
                    const match = mapping.valueMapping.find(vm =>
                        this.valuesEqual(value, this.getLiteralValue(vm.sourceValue))
                    );
                    if (match) value = this.getLiteralValue(match.targetValue);
                }
                // console.log('[JjTL Executor] := result:', value);
            } else if (mapping.conversion) {
                // Handle conversion (legacy -> syntax)
                // console.log('[JjTL Executor] Handling conversion with expression or mappings');
                value = await this.executeConversion(mapping.conversion, sourceInstance, mapping.sourceAttribute, alias);
                // console.log('[JjTL Executor] Conversion result:', value);
            } else if (mapping.sourceAttribute) {
                // Direct attribute mapping: source.attr -> target.attr (legacy)
                // console.log('[JjTL Executor] Direct attribute mapping');
                const ctx = this.createInstanceContext(sourceInstance, alias);
                value = this.evaluatePropertyPath(mapping.sourceAttribute, ctx);
                // console.log('[JjTL Executor] Direct mapping result:', value);
            } else {
                // No source, use null
                // console.log('[JjTL Executor] No source, using null');
                value = null;
            }

            // Cross-type resolution: swap source elements for target elements via trace.
            const resolved = await this.resolveBinding(value, mapping.targetAttribute, targetInstance);

            // Set target attribute
            const finalValue = fromJjelValueKeepingTargets(resolved);
            targetInstance[mapping.targetAttribute] = finalValue;
            // console.log(`[JjTL Executor] Set ${mapping.targetAttribute} = ${JSON.stringify(finalValue)}`);
        } catch (error) {
            if (error instanceof JjtlApplicationAbort) throw error;
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('[JjTL Executor] Error in executeAttributeMapping:', errorMessage);
            this.errors.push(
                `Failed to map ${mapping.sourceAttribute || '(creation)'} -> ${mapping.targetAttribute}: ${errorMessage}` +
                this.applicationStackSuffix()
            );
        }
    }

    /**
     * Apply value-mapping pairs to an already evaluated value.
     * `type := a.type : String=VARCHAR, Integer=INTEGER` — with no match the value
     * passes through, which is what the pairs-only form does too.
     */
    private applyValueMappings(value: JjelValue, pairs?: ValueMappingAST[]): JjelValue {
        if (!pairs || pairs.length === 0) return value;
        const match = pairs.find(vm => this.valuesEqual(value, this.getLiteralValue(vm.sourceValue)));
        return match ? this.getLiteralValue(match.targetValue) : value;
    }

    /**
     * Execute a conversion (value mappings or expression)
     */
    private async executeConversion(
        conversion: ConversionAST,
        sourceInstance: any,
        sourceAttribute?: string,
        alias?: string
    ): Promise<JjelValue> {
        // console.log('[JjTL Executor] executeConversion:', {
        //     hasExpression: !!conversion.expression,
        //     expressionType: conversion.expression?.type,
        //     hasMappings: !!(conversion.mappings && conversion.mappings.length > 0),
        //     sourceAttribute,
        //     sourceInstanceKeys: Object.keys(sourceInstance || {})
        // });

        if (conversion.expression) {
            // JjEL expression
            // console.log('[JjTL Executor] Evaluating expression type:', conversion.expression?.type);
            const ctx = this.createInstanceContext(sourceInstance, alias);
            // console.log('[JjTL Executor] Context bindings for expression:', {
            //     name: ctx.get('name'),
            //     source: ctx.get('source'),
            //     self: ctx.get('self')
            // });
            const result = await this.evaluateExpressionAsync(conversion.expression, ctx);
            // console.log('[JjTL Executor] Expression result:', result);
            // `-> type : a.type : String=VARCHAR, Integer=INTEGER` — the pairs apply
            // to the expression result. Both fields of ConversionAST are populated in
            // that form; with no match the expression result passes through.
            return this.applyValueMappings(result, conversion.mappings);
        }

        if (conversion.mappings && conversion.mappings.length > 0) {
            // Value mappings: true=1, false=0
            // console.log('[JjTL Executor] Evaluating value mappings');
            const ctx = this.createInstanceContext(sourceInstance, alias);
            const sourceValue = sourceAttribute
                ? this.evaluatePropertyPath(sourceAttribute, ctx)
                : null;

            for (const vm of conversion.mappings) {
                const vmSourceValue = this.getLiteralValue(vm.sourceValue);
                if (this.valuesEqual(sourceValue, vmSourceValue)) {
                    return this.getLiteralValue(vm.targetValue);
                }
            }

            // No mapping matched, return source value as-is
            return sourceValue;
        }

        // console.log('[JjTL Executor] No expression or mappings, returning null');
        return null;
    }

    /**
     * Execute an object creation written as `-> feature { ... }` and place the
     * result in that feature of the enclosing target instance.
     *
     * Two forms are legal inside the wrapper (SPEC §3.3):
     *   -> feature { -> Class { ... } }                       one object
     *   -> feature { forall v in expr -> Class { ... } }      one object per element
     *
     * Placement never needs the target metamodel — the feature name is on the
     * AttributeMapping in both parser shapes. The metamodel is consulted only to
     * tell a misplaced rule-level `-> Class { ... }` from a real feature, and to
     * name the reason in a warning instead of dropping the value in silence.
     *
     * @returns the value written into the feature, or undefined when nothing was.
     */
    private async executeCreationMapping(
        mapping: AttributeMappingAST,
        sourceInstance: any,
        targetInstance: any,
        extraBindings?: Record<string, JjelValue>,
    ): Promise<any> {
        const ownerClassName = targetInstance?.__type || targetInstance?.className || '';
        const shape = this.classifyCreation(mapping, ownerClassName);
        const ruleContext = `${ownerClassName || 'target'}.${mapping.targetAttribute}`;

        switch (shape.kind) {
            case 'ruleLevelClass':
                // validateTargetClasses already pushed the error; write nothing.
                return undefined;

            case 'unknownFeature':
                this.warnings.push(
                    `Feature '${shape.featureName}' not found on target class '${ownerClassName}': ` +
                    `the objects created by '-> ${shape.featureName} { ... }' have nowhere to go and were dropped.`
                );
                return undefined;

            case 'unsupportedBody':
                this.warnings.push(
                    `'-> ${shape.featureName} { ... }' (${ruleContext}) contains neither '-> Class { ... }' ` +
                    `nor 'forall ... -> Class { ... }': nothing was created.`
                );
                return undefined;

            case 'featureForAll': {
                const results: any[] = [];
                for (const item of mapping.objectCreation!.body || []) {
                    if (item.type === 'ForAllMapping') {
                        results.push(...await this.runForAll(item as ForAllMappingAST, sourceInstance, extraBindings));
                    } else {
                        this.warnings.push(
                            `'-> ${shape.featureName} { ... }' (${ruleContext}) mixes a forall with a ` +
                            `'${item.type}': only the forall produced objects.`
                        );
                    }
                }
                this.noteNestedParent(targetInstance, results);
                targetInstance[shape.featureName] = this.afterPlacedTargets(targetInstance, shape.featureName, results);
                return results;
            }

            case 'featureCreation': {
                const created = fromJjelValueKeepingTargets(
                    await this.executeObjectCreation(mapping.objectCreation!, sourceInstance, extraBindings)
                );
                this.noteNestedParent(targetInstance, [created]);
                targetInstance[shape.featureName] = this.afterPlacedTargets(targetInstance, shape.featureName, created);
                return created;
            }
        }
        return undefined;
    }

    /**
     * Run a forall and return the created objects, without deciding where they go.
     *
     * Each element of the collection is dereferenced first: a reference collection
     * arrives as `[{ __ref: id }, ...]`, and the body needs the source object.
     */
    private async runForAll(
        forall: ForAllMappingAST,
        sourceInstance: any,
        extraBindings?: Record<string, JjelValue>,
    ): Promise<any[]> {
        const baseCtx = extraBindings
            ? this.createInstanceContext(sourceInstance).child(extraBindings)
            : this.createInstanceContext(sourceInstance);
        // `forall q, r in xs` and `forall q in xs, r in ys` carry every variable in
        // `bindings`; a one-variable forall carries none.
        const vars = forall.bindings ?? [{ variable: forall.variable, collection: forall.collection }];

        const results: any[] = [];
        let unresolvedRefs = 0;

        // The cartesian product, first variable outermost (R-FA-1). Each collection is
        // evaluated with the variables before it bound, so `forall q in xs, r in q.children`
        // reads q (R-FA-2). The created objects form one flat list.
        const iterate = async (level: number, bound: Record<string, JjelValue>, lastItem: any): Promise<void> => {
            if (level === vars.length) {
                const itemBindings: Record<string, JjelValue> = {
                    ...(extraBindings || {}),
                    ...bound,
                };
                // Also add item properties directly for unqualified access.
                // Uses proxyEntries to capture L-layer proxy properties.
                // One variable only: the properties of two elements would collide.
                if (vars.length === 1 && lastItem && typeof lastItem === 'object') {
                    for (const [key, value] of proxyEntries(lastItem)) {
                        if (!key.startsWith('__')) {
                            itemBindings[key] = this.bindSourceValue(value);
                        }
                    }
                }
                // The `such that` sees what the body sees, bare names included
                // (P-2026-11-04-0015, ratified by Alfonso 2026-11-03).
                const childCtx = baseCtx.child(itemBindings);

                if (forall.filter) {
                    const passes = this.evaluateExpression(forall.filter, childCtx);
                    if (!fromJjelValue(passes)) return;
                }

                const created = await this.executeObjectCreation(
                    forall.objectCreation, sourceInstance, itemBindings
                );
                results.push(fromJjelValueKeepingTargets(created));
                return;
            }

            const ctx = level === 0 ? baseCtx : baseCtx.child(bound);
            const collectionValue = this.evaluateExpression(vars[level].collection, ctx);
            const collection = fromJjelValue(collectionValue);

            if (!Array.isArray(collection)) {
                if (collection != null) {
                    this.warnings.push(`ForAll collection is not an array: ${typeof collection}`);
                }
                return;
            }

            for (const rawItem of collection) {
                const item = this.derefSourceRef(rawItem);
                if (item === rawItem && rawItem && typeof rawItem === 'object'
                    && typeof (rawItem as any).__ref === 'string') {
                    unresolvedRefs++;
                }
                await iterate(level + 1, { ...bound, [vars[level].variable]: this.bindForAllElement(item) }, item);
            }
        };
        await iterate(0, {}, undefined);

        if (unresolvedRefs > 0) {
            this.warnings.push(
                `forall ${vars.map(v => v.variable).join(', ')}: ${unresolvedRefs} element(s) of the collection are references ` +
                `to objects outside the source model and were iterated unresolved ` +
                `(target of '-> ${forall.objectCreation.targetClass}').`
            );
        }

        return results;
    }

    /**
     * The feature of `ownerClassName` that receives the objects of a forall which
     * names none. Falls back to the pluralization heuristic, saying which name it
     * inferred, so a wrong guess is visible instead of silent.
     */
    private resolveForAllFeature(ownerClassName: string, createdClassName: string): string {
        const byType = ownerClassName
            ? this.findFeatureForCreatedClass(ownerClassName, createdClassName)
            : undefined;
        if (byType) return byType.name;

        const guessed = createdClassName.charAt(0).toLowerCase() + createdClassName.slice(1) + 's';
        if (this.hasTargetClassIndex() && ownerClassName) {
            const exists = !!this.resolveTargetFeature(ownerClassName, guessed);
            this.warnings.push(
                `forall -> ${createdClassName} in '${ownerClassName}' names no feature: ` +
                `guessed '${guessed}' by pluralization` +
                (exists ? '.' : `, which is not a feature of '${ownerClassName}'.`) +
                ` Write '-> feature { forall ... }' to say it explicitly.`
            );
        }
        return guessed;
    }

    /**
     * Execute object creation
     */
    private async executeObjectCreation(
        creation: ObjectCreationAST,
        sourceInstance: any,
        extraBindings?: Record<string, JjelValue>
    ): Promise<JjelValue> {
        const newObject: Record<string, JjelValue> = {
            __type: creation.targetClass,
            className: creation.targetClass,
            // Same provenance marker as a rule-level target, plus __nested so the
            // write-back can tell "an object to create inside a feature" from
            // "a pointer to a target created by another rule" (__ref_result).
            __sourceId: sourceInstance?.id || sourceInstance?.name,
            __createdBy: 'JjTL',
            __nested: true,
        };
        this.stats.targetInstancesCreated++;

        await this.executeCreationBody(creation.body, sourceInstance, newObject, extraBindings);

        return newObject;
    }

    /**
     * Execute the body items of a created object (attribute mappings, forall mappings,
     * let and interactive statements). A let body runs through here again with its
     * variables merged into the extra bindings, so they reach nested bodies at any depth.
     */
    private async executeCreationBody(
        body: MappingBodyItemAST[],
        sourceInstance: any,
        newObject: Record<string, JjelValue>,
        extraBindings?: Record<string, JjelValue>
    ): Promise<void> {
        // Execute nested body items (attribute mappings, forall mappings, and interactive statements)
        for (const item of body) {
            if (item.type === 'AttributeMapping') {
                const attrMapping = item as AttributeMappingAST;
                const ctx = extraBindings
                    ? this.createInstanceContext(sourceInstance).child(extraBindings)
                    : this.createInstanceContext(sourceInstance);
                let value: JjelValue;

                if (attrMapping.objectCreation) {
                    // `-> feature { ... }` inside a created object: the same placement as at rule level
                    // (one object, or one per element of a forall, into that feature), with the enclosing
                    // forall variables still bound. Before this, the body fell into the wrapper path and
                    // `-> ops { forall ... }` built an object typed `ops` with pluralized sub-lists.
                    await this.executeCreationMapping(attrMapping, sourceInstance, newObject, extraBindings);
                    continue;
                } else if (attrMapping.expression !== undefined) {
                    value = await this.evaluateExpressionAsync(attrMapping.expression, ctx);
                    if (attrMapping.valueMapping && attrMapping.valueMapping.length > 0) {
                        const match = attrMapping.valueMapping.find(vm =>
                            this.valuesEqual(value, this.getLiteralValue(vm.sourceValue))
                        );
                        if (match) value = this.getLiteralValue(match.targetValue);
                    }
                } else if (attrMapping.conversion?.expression) {
                    value = this.applyValueMappings(
                        await this.evaluateExpressionAsync(attrMapping.conversion.expression, ctx),
                        attrMapping.conversion.mappings
                    );
                } else if (attrMapping.sourceAttribute) {
                    value = this.evaluatePropertyPath(attrMapping.sourceAttribute, ctx);
                } else {
                    value = null;
                }

                newObject[attrMapping.targetAttribute] = await this.resolveBinding(value, attrMapping.targetAttribute, newObject) as JjelValue;
            } else if (item.type === 'ForAllMapping') {
                await this.executeForAllMappingOnObject(item as ForAllMappingAST, sourceInstance, newObject, extraBindings);
            } else if (item.type === 'AlertStatement') {
                const alertItem = item as AlertStatementAST;
                const ctx = extraBindings
                    ? this.createInstanceContext(sourceInstance).child(extraBindings)
                    : this.createInstanceContext(sourceInstance);
                const msg = this.evaluateExpression(alertItem.message, ctx);
                await getUIBridge().showAlert(String(msg ?? ''), alertItem.alertType ?? 'info');
            } else if (item.type === 'NotifyStatement') {
                const notifyItem = item as NotifyStatementAST;
                const ctx = extraBindings
                    ? this.createInstanceContext(sourceInstance).child(extraBindings)
                    : this.createInstanceContext(sourceInstance);
                const msg = this.evaluateExpression(notifyItem.message, ctx);
                getUIBridge().showNotify(String(msg ?? ''), notifyItem.duration ?? 3000);
            } else if (item.type === 'LetStatement') {
                const letItem = item as LetStatementAST;
                let letCtx = extraBindings
                    ? this.createInstanceContext(sourceInstance).child(extraBindings)
                    : this.createInstanceContext(sourceInstance);
                const letVars: Record<string, JjelValue> = {};
                for (const binding of letItem.bindings) {
                    const value = await this.letValue(binding.value, letCtx);
                    letVars[binding.name] = value;
                    letCtx = letCtx.child({ [binding.name]: value });
                }
                // The let body runs on the same newObject, with the let variables
                // bound in every nested body (forall, created objects, -> feature { }).
                await this.executeCreationBody(
                    letItem.body, sourceInstance, newObject, { ...(extraBindings || {}), ...letVars }
                );
            }
        }
    }

    /**
     * Execute a forall mapping inside a class mapping body — i.e. one that names
     * no feature. The created objects go into the feature of the target class that
     * can hold them, or into the pluralized guess with a warning.
     */
    private async executeForAllMapping(
        forall: ForAllMappingAST,
        sourceInstance: any,
        targetInstance: any,
        alias?: string,
        letBindings?: Record<string, JjelValue>
    ): Promise<void> {
        const results = await this.runForAll(forall, sourceInstance, this.aliasBindings(sourceInstance, alias, letBindings));
        if (results.length === 0) return;

        const ownerClassName = targetInstance?.__type || targetInstance?.className || '';
        const propName = this.resolveForAllFeature(ownerClassName, forall.objectCreation.targetClass);

        this.noteNestedParent(targetInstance, results);
        const existing = targetInstance[propName];
        targetInstance[propName] = Array.isArray(existing) ? [...existing, ...results] : results;
    }

    /**
     * The rule's source alias as an extra binding. Nested bodies (forall, created
     * objects, `-> feature { ... }`) build their context from the source instance
     * alone, so without it `a.name` read null below rule level.
     *
     * The variables of the enclosing `let` statements travel the same way, for the
     * same reason. Their names carry `$`, so they cannot shadow the alias.
     */
    private aliasBindings(
        sourceInstance: any,
        alias?: string,
        letBindings?: Record<string, JjelValue>
    ): Record<string, JjelValue> | undefined {
        const hasLet = !!letBindings && Object.keys(letBindings).length > 0;
        if (!alias && !hasLet) return undefined;
        return {
            ...(alias ? { [alias]: this.bindSourceValue(sourceInstance) } : {}),
            ...(hasLet ? letBindings : {}),
        };
    }

    /**
     * Execute a forall mapping inside an object creation context
     * (e.g. `-> feature { -> Class { forall ... } }`).
     * Results are added to the parent object being created.
     */
    private async executeForAllMappingOnObject(
        forall: ForAllMappingAST,
        sourceInstance: any,
        parentObject: Record<string, JjelValue>,
        extraBindings?: Record<string, JjelValue>
    ): Promise<void> {
        const results = await this.runForAll(forall, sourceInstance, extraBindings);
        if (results.length === 0) return;

        const ownerClassName = String(
            (parentObject as any).__type || (parentObject as any).className || ''
        );
        const propName = this.resolveForAllFeature(ownerClassName, forall.objectCreation.targetClass);

        this.noteNestedParent(parentObject, results);
        const existing = parentObject[propName];
        parentObject[propName] = (Array.isArray(existing)
            ? [...(existing as any[]), ...results]
            : results) as any;
    }

    /**
     * Execute a let body with a pre-built context (used by executeAttributeMappings).
     * Each body item uses the enriched letCtx instead of creating a fresh instance context.
     */
    private async executeLetBody(
        body: MappingBodyItemAST[],
        sourceInstance: any,
        targetInstance: any,
        letCtx: EvaluationContext,
        alias?: string,
        letBindings: Record<string, JjelValue> = {}
    ): Promise<void> {
        for (const item of body) {
            if (item.type === 'AttributeMapping') {
                const mapping = item as AttributeMappingAST;
                let value: JjelValue;
                if (mapping.objectCreation) {
                    // Placed into the feature like at rule level (executeAttributeMapping).
                    await this.executeCreationMapping(
                        mapping, sourceInstance, targetInstance, this.aliasBindings(sourceInstance, alias, letBindings)
                    );
                    this.stats.attributeMappingsExecuted++;
                    continue;
                } else if (mapping.expression !== undefined) {
                    value = await this.evaluateExpressionAsync(mapping.expression, letCtx);
                    if (mapping.valueMapping && mapping.valueMapping.length > 0) {
                        const match = mapping.valueMapping.find(vm =>
                            this.valuesEqual(value, this.getLiteralValue(vm.sourceValue))
                        );
                        if (match) value = this.getLiteralValue(match.targetValue);
                    }
                } else if (mapping.conversion) {
                    value = mapping.conversion.expression
                        ? this.applyValueMappings(
                            await this.evaluateExpressionAsync(mapping.conversion.expression, letCtx),
                            mapping.conversion.mappings)
                        : null;
                } else if (mapping.sourceAttribute) {
                    value = this.evaluatePropertyPath(mapping.sourceAttribute, letCtx);
                } else {
                    value = null;
                }
                targetInstance[mapping.targetAttribute] = fromJjelValueKeepingTargets(await this.resolveBinding(value, mapping.targetAttribute, targetInstance));
                this.stats.attributeMappingsExecuted++;
            } else if (item.type === 'ForAllMapping') {
                await this.executeForAllMapping(item as ForAllMappingAST, sourceInstance, targetInstance, alias, letBindings);
            } else if (item.type === 'AlertStatement') {
                const msg = this.evaluateExpression((item as AlertStatementAST).message, letCtx);
                await getUIBridge().showAlert(String(msg ?? ''), (item as AlertStatementAST).alertType ?? 'info');
            } else if (item.type === 'NotifyStatement') {
                const msg = this.evaluateExpression((item as NotifyStatementAST).message, letCtx);
                getUIBridge().showNotify(String(msg ?? ''), (item as NotifyStatementAST).duration ?? 3000);
            } else if (item.type === 'LetStatement') {
                // Nested let
                const nested = item as LetStatementAST;
                let nestedCtx = letCtx;
                const nestedVars: Record<string, JjelValue> = { ...letBindings };
                for (const binding of nested.bindings) {
                    const value = await this.letValue(binding.value, nestedCtx);
                    nestedVars[binding.name] = value;
                    nestedCtx = nestedCtx.child({ [binding.name]: value });
                }
                await this.executeLetBody(nested.body, sourceInstance, targetInstance, nestedCtx, alias, nestedVars);
            }
        }
    }

    /**
     * Execute a let body with trace recording (used by executeAttributeMappingsWithTrace).
     */
    private async executeLetBodyWithTrace(
        body: MappingBodyItemAST[],
        sourceInstance: any,
        targetInstance: any,
        letCtx: EvaluationContext,
        traceLink: TraceLinkBuilder,
        alias?: string,
        letBindings: Record<string, JjelValue> = {}
    ): Promise<void> {
        for (const item of body) {
            if (item.type === 'AttributeMapping') {
                const mapping = item as AttributeMappingAST;
                let value: JjelValue;
                let sourceValue: any = null;
                const hasExpression = !!mapping.conversion?.expression;
                const expressionSource = hasExpression ? this.getExpressionSource(mapping.conversion!.expression!) : undefined;

                if (mapping.objectCreation) {
                    // Placed into the feature like at rule level (executeAttributeMappingWithTrace).
                    const created = await this.executeCreationMapping(
                        mapping, sourceInstance, targetInstance, this.aliasBindings(sourceInstance, alias, letBindings)
                    );
                    traceLink.addBinding(
                        null, mapping.targetAttribute, undefined, null,
                        created === undefined ? null : created, false, undefined, undefined
                    );
                    this.stats.attributeMappingsExecuted++;
                    continue;
                } else if (mapping.expression !== undefined) {
                    value = await this.evaluateExpressionAsync(mapping.expression, letCtx);
                    sourceValue = fromJjelValue(value);
                    if (mapping.valueMapping && mapping.valueMapping.length > 0) {
                        const match = mapping.valueMapping.find(vm =>
                            this.valuesEqual(value, this.getLiteralValue(vm.sourceValue))
                        );
                        if (match) value = this.getLiteralValue(match.targetValue);
                    }
                } else if (mapping.conversion) {
                    if (mapping.sourceAttribute) {
                        sourceValue = fromJjelValue(this.evaluatePropertyPath(mapping.sourceAttribute, letCtx));
                    }
                    value = mapping.conversion.expression
                        ? this.applyValueMappings(
                            await this.evaluateExpressionAsync(mapping.conversion.expression, letCtx),
                            mapping.conversion.mappings)
                        : null;
                } else if (mapping.sourceAttribute) {
                    value = this.evaluatePropertyPath(mapping.sourceAttribute, letCtx);
                    sourceValue = fromJjelValue(value);
                } else {
                    value = null;
                }

                const resolved = await this.resolveBinding(value, mapping.targetAttribute, targetInstance);
                const finalValue = fromJjelValueKeepingTargets(resolved);
                targetInstance[mapping.targetAttribute] = finalValue;
                const invertible = this.isBindingInvertible(mapping);
                const userProvided = mapping.expression !== undefined
                    ? this.isUserProvidedExpression(mapping.expression)
                    : false;
                traceLink.addBinding(
                    mapping.sourceAttribute || null,
                    mapping.targetAttribute,
                    expressionSource,
                    sourceValue,
                    finalValue,
                    invertible,
                    invertible ? this.computeInverseExpression(mapping) : undefined,
                    userProvided || undefined
                );
                this.stats.attributeMappingsExecuted++;
            } else if (item.type === 'ForAllMapping') {
                await this.executeForAllMapping(item as ForAllMappingAST, sourceInstance, targetInstance, alias, letBindings);
            } else if (item.type === 'AlertStatement') {
                const msg = this.evaluateExpression((item as AlertStatementAST).message, letCtx);
                await getUIBridge().showAlert(String(msg ?? ''), (item as AlertStatementAST).alertType ?? 'info');
            } else if (item.type === 'NotifyStatement') {
                const msg = this.evaluateExpression((item as NotifyStatementAST).message, letCtx);
                getUIBridge().showNotify(String(msg ?? ''), (item as NotifyStatementAST).duration ?? 3000);
            } else if (item.type === 'LetStatement') {
                const nested = item as LetStatementAST;
                let nestedCtx = letCtx;
                const nestedVars: Record<string, JjelValue> = { ...letBindings };
                for (const binding of nested.bindings) {
                    const value = await this.letValue(binding.value, nestedCtx);
                    nestedVars[binding.name] = value;
                    nestedCtx = nestedCtx.child({ [binding.name]: value });
                }
                await this.executeLetBodyWithTrace(nested.body, sourceInstance, targetInstance, nestedCtx, traceLink, alias, nestedVars);
            }
        }
    }

    /**
     * Create evaluation context with source instance bindings.
     * Uses proxyEntries (Reflect.ownKeys) to capture L-layer computed properties
     * like isAbstract, attributes, subClasses, references, etc.
     *
     * IMPORTANT: Uses shallowToJjelValue instead of toJjelValue to prevent infinite
     * loops from circular proxy references (e.g., LClass.attributes[0].owner → LClass).
     * The JjEL evaluator navigates objects lazily via property access.
     */
    private createInstanceContext(sourceInstance: any, alias?: string): EvaluationContext {
        const bindings: Record<string, JjelValue> = {
            source: this.bindSourceValue(sourceInstance),
            self: this.bindSourceValue(sourceInstance),
            it: this.bindSourceValue(sourceInstance),
        };

        // Add instance properties directly — use proxyEntries to capture proxy getter keys
        if (sourceInstance && typeof sourceInstance === 'object') {
            for (const [key, value] of proxyEntries(sourceInstance)) {
                if (!key.startsWith('__')) {
                    bindings[key] = this.bindSourceValue(
                        key === 'parent' ? this.derefSourceRef(value) : value
                    );
                }
            }

            // Extract M1 attribute values from $attrName.value pattern
            // This allows transformations to access attribute values by name
            // (e.g., `surname` instead of `$surname.value`)
            extractAttributeValues(sourceInstance, bindings);
        }

        // Bind alias as an additional name for the source instance
        if (alias) {
            bindings[alias] = this.bindSourceValue(sourceInstance);
        }

        // `parent` keyword: evaluates to the eContainer (owning DObject) of
        // the current source instance.
        //
        // Resolution order:
        //   1. User-defined feature named "parent" (already in bindings from proxyEntries)
        //   2. _containerId → look up the containing DObject in the source model
        //   3. Fallback to .father / .eContainer / .owner (for L-layer proxies or tests)
        if (sourceInstance && typeof sourceInstance === 'object' && bindings.parent === undefined) {
            let resolved = false;
            const containerId = (sourceInstance as any)._containerId;
            if (containerId && typeof containerId === 'string') {
                const sourceArr = Array.isArray(this.context.sourceModel) ? this.context.sourceModel : [];
                const parentObj = sourceArr.find((o: any) => o.id === containerId);
                if (parentObj) {
                    bindings.parent = this.bindSourceValue(parentObj);
                    resolved = true;
                }
            }
            if (!resolved) {
                const container =
                    (sourceInstance as any).father ??
                    (sourceInstance as any).eContainer ??
                    (sourceInstance as any).owner ??
                    null;
                if (container !== null && container !== undefined) {
                    // Same dereference as inside a forall: a container arriving as
                    // { __ref: id } is resolved to the source object it names.
                    bindings.parent = this.bindSourceValue(this.derefSourceRef(container));
                }
            }
        }


        return this.context.evalContext.child(bindings);
    }

    /**
     * Evaluate a property path (e.g., "source.owner.name" or simple "name")
     */
    private evaluatePropertyPath(path: string, ctx: EvaluationContext): JjelValue {
        const source = ctx.get('source');

        // FIRST: Try direct property access for simple attribute names (most common case)
        if (source && typeof source === 'object' && source !== null && !path.includes('.')) {
            const directValue = (source as Record<string, any>)[path];
            if (directValue !== undefined) {
                // console.log(`[JjTL Executor] evaluatePropertyPath: direct access "${path}" = ${JSON.stringify(directValue)}`);
                return toJjelValue(directValue);
            }
        }

        // SECOND: Try context variable lookup
        const ctxValue = ctx.get(path);
        if (ctxValue !== undefined) {
            // console.log(`[JjTL Executor] evaluatePropertyPath: context lookup "${path}" = ${JSON.stringify(ctxValue)}`);
            return ctxValue;
        }

        // THIRD: Try JjEL evaluation for complex paths
        try {
            const result = jjelEval(path, this.contextToRecord(ctx));
            // console.log(`[JjTL Executor] evaluatePropertyPath: jjelEval "${path}" = ${JSON.stringify(result)}`);
            return result;
        } catch (e) {
            console.warn(`[JjTL Executor] evaluatePropertyPath: jjelEval failed for "${path}":`, e);
        }

        // FOURTH: Manual path traversal for dotted paths
        if (source && typeof source === 'object' && path.includes('.')) {
            const parts = path.split('.');
            let current: any = source;
            for (const part of parts) {
                if (current && typeof current === 'object' && part in current) {
                    current = current[part];
                } else {
                    console.warn(`[JjTL Executor] evaluatePropertyPath: path "${path}" failed at "${part}"`);
                    return null;
                }
            }
            return toJjelValue(current);
        }

        console.warn(`[JjTL Executor] evaluatePropertyPath: could not resolve "${path}"`);
        return null;
    }

    /**
     * Evaluate an expression AST node.
     *
     * Delegates to the JjEL evaluator via the AST bridge (toJjelAst).
     * This gives JjTL access to ALL JjEL builtins (snakeCase, camelCase,
     * pascalCase, kebabCase, forall, exists, implies, etc.) without
     * duplicating evaluation logic.
     *
     * Special cases handled before delegation:
     * - FunctionCall with Identifier callee (standalone builtins/helpers)
     *   must be handled here because JjEL doesn't have a standalone
     *   function call AST node.
     */
    private evaluateExpression(expr: ExpressionAST, ctx: EvaluationContext): JjelValue {
        // An interactive call nested inside another expression opens no dialog:
        // only a whole expression is awaited (evaluateExpressionAsync). The JjEL
        // path fails the whole expression in its evaluator; the legacy path does
        // the same here, with the same warning, instead of a silent null operand.
        const nested = this.findNestedInteractive(expr);
        if (nested) {
            this.warnings.push(`Expression evaluation failed (JjelExpression): Function '${nested}' is not defined`);
            return null;
        }

        // Special case: resolve(expr) / resolve(expr, TargetType) — the second
        // argument is an identifier that names a target class; it must NOT be
        // evaluated (no binding exists for class names in the value context).
        const resolved = this.tryEvaluateResolveCall(expr, ctx);
        if (resolved !== undefined) return resolved;

        // Special case: standalone function calls (builtins/helpers)
        // JjEL now has its own FunctionCall node, but this branch still handles
        // the JjTL-native FunctionCall produced by the legacy expression path.
        if (expr.type === 'FunctionCall') {
            const fc = expr as FunctionCallAST;
            if (fc.callee.type === 'Identifier') {
                const fnName = (fc.callee as IdentifierAST).name;
                // A helper parameter that holds a function shadows a helper or
                // builtin of the same name; one that holds a value does not (SPEC §3.4)
                const shadow = ctx.shadowedBuiltins?.has(fnName) ? ctx.get(fnName) : undefined;
                const shadowed = !!shadow && typeof shadow === 'object' && '__jjelFunction' in shadow;
                const builtin = shadowed ? undefined : ctx.getBuiltin(fnName);
                if (builtin) {
                    try {
                        const args = fc.arguments.map(arg => this.evaluateExpression(arg, ctx));
                        return builtin.call(args, ctx);
                    } catch (error) {
                        if (error instanceof JjtlBuiltinError) this.withOrigin(error).locate(expr);
                        throw error;
                    }
                }
                // Also check if it's a function value in context
                const fnValue = ctx.get(fnName);
                if (fnValue && typeof fnValue === 'object' && fnValue !== null && '__jjelFunction' in fnValue) {
                    const fn = fnValue as JjelFunction;
                    const args = fc.arguments.map(arg => this.evaluateExpression(arg, ctx));
                    return fn.call(args, ctx);
                }
            }
            // For method calls (obj.method()), fall through to JjEL delegation below
        }

        // Convert JjTL AST to JjEL AST and delegate to JjEL evaluator
        const outerReads = this.unresolvedReads;
        this.unresolvedReads = new Set();
        try {
            const jjelExpr = toJjelAst(expr);
            return this.jjelEvaluator.evaluate(jjelExpr, ctx);
        } catch (error) {
            // A builtin that failed stops the mapping, as on the legacy fast path
            // above (R-FA-11), and so does a JjEL method that failed (R-FA-12):
            // rethrown, naming the expression. Any other evaluation error, a call
            // to a name that resolves to nothing or a read on null among them,
            // is logged and falls back to null.
            if (error instanceof JjtlBuiltinError) {
                this.withOrigin(error).locate(expr);
                throw error;
            }
            const method = methodFailureOf(error);
            if (method !== undefined) {
                const failed = new JjtlBuiltinError(method, error instanceof Error ? error.message : String(error), 'Method');
                this.withOrigin(failed).locate(expr);
                throw failed;
            }
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn(`[JjTL Executor] JjEL evaluation failed for ${expr.type}: ${errorMessage}`);
            this.warnings.push(`Expression evaluation failed (${expr.type}): ${errorMessage}`);
            return null;
        } finally {
            const reads = this.unresolvedReads;
            this.unresolvedReads = outerReads;
            if (reads.size > 0) this.warnUnresolvedReads(expr, reads);
        }
    }

    /**
     * Names the rule and source element the run was in when a builtin (R-FA-13)
     * or a method (R-FA-12) failed: a binding's error prefix does not name the
     * rule. The innermost call sets it; the enclosing ones keep it.
     */
    private withOrigin(error: JjtlBuiltinError): JjtlBuiltinError {
        const { currentRuleName, currentInstanceName } = this.context;
        if (!error.origin && currentRuleName) error.origin = ` (rule '${currentRuleName}', source element '${currentInstanceName ?? '?'}')`;
        return error;
    }

    /**
     * One warning per expression that read a member of a reference absent from
     * the source model (see liftSourceRefs). Neither JjEL AST keeps its source
     * text, so the expression is named by its position.
     */
    private warnUnresolvedReads(expr: ExpressionAST, reads: Set<string>): void {
        const rule = this.context.currentRuleName ?? 'transformation';
        const start = expr.location?.start;
        const where = start ? `expression at line ${start.line}, column ${start.column}` : `${expr.type} expression`;
        const msg = `Rule '${rule}', ${where}: read ${[...reads].join(', ')}, ` +
            `a reference to an object that is not in the source model; the value is null.`;
        if (!this.warnings.includes(msg)) this.warnings.push(msg);
    }

    /**
     * The name of the first interactive call (prompt, confirm, input) found
     * strictly below `expr` in the legacy JjTL AST, depth-first. A JjEL
     * wrapper is not entered: its evaluator reports the call itself.
     */
    private findNestedInteractive(expr: ExpressionAST): string | undefined {
        const NAMES: Record<string, string> = {
            PromptExpression: 'prompt', ConfirmExpression: 'confirm', InputExpression: 'input',
        };
        const visit = (node: any, isRoot: boolean): string | undefined => {
            if (!node || typeof node !== 'object') return undefined;
            if (Array.isArray(node)) {
                for (const el of node) {
                    const found = visit(el, false);
                    if (found) return found;
                }
                return undefined;
            }
            if (typeof node.type !== 'string' || node.type === 'JjelExpression') return undefined;
            if (!isRoot && NAMES[node.type]) return NAMES[node.type];
            for (const key of Object.keys(node)) {
                if (key === 'location') continue;
                const found = visit(node[key], false);
                if (found) return found;
            }
            return undefined;
        };
        return visit(expr, true);
    }

    /**
     * Check if an expression is a top-level user-input expression (prompt/input).
     */
    private isUserProvidedExpression(expr: ExpressionAST): boolean {
        return expr.type === 'PromptExpression' || expr.type === 'InputExpression' || expr.type === 'ConfirmExpression';
    }

    /**
     * Async wrapper around evaluateExpression that handles interactive expressions
     * (PromptExpression, InputExpression) which require awaiting user input via UIBridge.
     * Falls through to the synchronous evaluateExpression for all other expression types.
     */
    private buildDialogContext(): string | undefined {
        const { currentRuleName, currentInstanceName } = this.context;
        if (!currentRuleName) return undefined;
        const rule = currentRuleName.replace('->', '\u2192');
        if (!currentInstanceName) return rule;
        return `${rule} :: ${currentInstanceName}`;
    }

    private async evaluateExpressionAsync(expr: ExpressionAST, ctx: EvaluationContext): Promise<JjelValue> {
        if (expr.type === 'PromptExpression') {
            const pe = expr as PromptExpressionAST;
            const msg = this.evaluateExpression(pe.message, ctx);
            const defaultVal = pe.defaultValue
                ? this.evaluateExpression(pe.defaultValue, ctx)
                : undefined;
            const executionContext = this.buildDialogContext();
            const result = await getUIBridge().showPrompt(
                String(msg ?? ''),
                pe.typeRef,
                defaultVal !== undefined ? String(defaultVal) : undefined,
                executionContext
            );
            if (result.cancelled) return null;
            return result.value;
        }
        if (expr.type === 'ConfirmExpression') {
            const ce = expr as ConfirmExpressionAST;
            const msg = this.evaluateExpression(ce.message, ctx);
            const executionContext = this.buildDialogContext();
            return await getUIBridge().showConfirm(String(msg ?? ''), executionContext);
        }
        if (expr.type === 'InputExpression') {
            const ie = expr as InputExpressionAST;
            const msg = this.evaluateExpression(ie.message, ctx);
            const typeHint = ie.inputType ?? 'EString';
            const opts = ie.options
                ? ie.options.map(o => fromJjelValue(this.evaluateExpression(o, ctx)))
                : undefined;
            const defaultVal = ie.defaultValue
                ? fromJjelValue(this.evaluateExpression(ie.defaultValue, ctx))
                : undefined;
            const result = await getUIBridge().showInput(
                String(msg ?? ''),
                typeHint,
                defaultVal,
                Array.isArray(opts) ? opts.map(String) : undefined
            );
            if (result.cancelled) return null;
            return result.value as unknown as JjelValue;
        }
        return this.evaluateExpression(expr, ctx);
    }

    // ============================================
    // CROSS-TYPE RESOLUTION
    // ============================================

    /**
     * If a binding RHS produced a source element whose type has a rule in
     * this transformation, swap the source element for the corresponding
     * target element via the trace. Primitives and objects of types without
     * rules pass through unchanged. Arrays are resolved element-wise.
     *
     * Ambiguity (N>1 rules for the same source type) throws; use
     * `resolve(expr, TargetType)` in the JjTL binding to disambiguate.
     *
     * Missing target (no trace entry for this source) also throws: silently
     * dropping a reference would be much harder to debug than failing loud.
     *
     * @param value            The evaluated RHS value
     * @param targetAttribute  The target attribute being bound (used only for error messages)
     */
    /**
     * Report a resolution fallback as a warning, naming the rule and the source element
     * whose binding hit it (P-2026-11-02-1742). What the executor binds does not change.
     * The same message is reported once, so a forall does not repeat it per element.
     */
    private reportFallback(message: string): void {
        const where = this.context.currentRuleName
            ? ` (rule '${this.context.currentRuleName}', source element '${this.context.currentInstanceName ?? '?'}')`
            : '';
        const msg = `Unresolved reference: ${message}${where}.`;
        if (!this.warnings.includes(msg)) this.warnings.push(msg);
    }


    // ============================================
    // SLICE B: CALLED, LAZY AND DELEGATING RULES (P-2026-11-02-2224)
    // ============================================

    /** `Class -> Target`, `rule name(...) -> Target`, `lazy Class -> Target`, `= ...` for delegations. */
    private ruleLabel(rule: ClassMappingAST): string {
        const head = rule.ruleKind === 'called'
            ? `${rule.unique ? 'unique ' : ''}rule ${rule.ruleName}(${(rule.parameters ?? []).map(p => p.name).join(', ')})`
            : `${rule.ruleKind === 'lazy' ? (rule.unique ? 'unique lazy ' : 'lazy ') : ''}` +
              rule.sources.map(s => s.className).join(', ');
        return rule.result ? `${head} = ...` : `${head} -> ${rule.targetClass}`;
    }

    /**
     * Register every called rule as a JjEL builtin that returns a demand; a name taken by a
     * helper, a builtin or another called rule is an error.
     */
    private registerRules(): void {
        this.registerEnvironmentBuiltins();
        for (const rule of this.ast.rules ?? []) {
            if (rule.ruleKind !== 'called' || !rule.ruleName) continue;
            const name = rule.ruleName;
            if (this.context.evalContext.getBuiltin(name)) {
                this.errors.push(`Called rule '${name}' has the name of a helper, a builtin or another called rule.`);
                continue;
            }
            const params = (rule.parameters ?? []).map(p => p.name);
            this.context.evalContext.registerBuiltin(name, createFunction(params, (args: JjelValue[]) =>
                this.makeDemand({ kind: 'call', rule, args: [...args], callerEnv: this.currentEnvironment() }) as JjelValue
            ));
        }
    }

    /**
     * The environment as JjEL sees it (R-JTG-5): `extendEnv(names, values)` returns a new
     * frame over the current environment, each value a closure over the current
     * environment, the binding site; `envHas(name)`; `envLookup(name)`, the bound value as
     * a demand lowered under its closure's environment, or null when unbound;
     * `envValue(name[, env])`, the bound value as bound, never a demand, read from the
     * current environment or from an `extendEnv` marker; unbound, it fails (R-FA-11).
     */
    private registerEnvironmentBuiltins(): void {
        const ctx = this.context.evalContext;
        const list = (v: any): any[] => (Array.isArray(v) ? v : v == null ? [] : [v]);
        ctx.registerBuiltin('extendEnv', createFunction(['names', 'values'], (args: JjelValue[]) => {
            const names = list(args[0]).map(n => String(n));
            const values = list(args[1]);
            const site = this.currentEnvironment();
            const bindings = new Map<string, Closure>();
            names.forEach((n, i) => bindings.set(n, { value: values[i] ?? null, env: site }));
            return this.envMarker({ parent: site, bindings }) as JjelValue;
        }));
        ctx.registerBuiltin('envHas', createFunction(['name'], (args: JjelValue[]) =>
            this.lookupClosure(this.currentEnvironment(), String(args[0])) !== undefined
        ));
        ctx.registerBuiltin('envLookup', createFunction(['name'], (args: JjelValue[]) => {
            const name = String(args[0]);
            const closure = this.lookupClosure(this.currentEnvironment(), name);
            return (closure ? this.makeDemand({ kind: 'closure', name, closure }) : null) as JjelValue;
        }));
        ctx.registerBuiltin('envValue', createFunction(['name', 'env'], (args: JjelValue[]) => {
            const name = String(args[0]);
            const closure = this.lookupClosure(this.environmentOf(args[1]) ?? this.currentEnvironment(), name);
            if (!closure) throw new Error(`'${name}' is not bound in the environment; envHas tests it`);
            return closure.value as JjelValue;
        }));
    }

    private envMarker(env: Environment): { __jjtlEnv: number } {
        const id = this.environments.size + 1;
        this.environments.set(id, env);
        return { __jjtlEnv: id };
    }

    private environmentOf(value: any): Environment | undefined {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
        const id = (value as any).__jjtlEnv;
        return typeof id === 'number' ? this.environments.get(id) : undefined;
    }

    private lookupClosure(env: Environment, name: string): Closure | undefined {
        for (let e: Environment | null = env; e; e = e.parent) {
            const c = e.bindings.get(name);
            if (c) return c;
        }
        return undefined;
    }

    /**
     * The structural key of an environment: the visible bindings, innermost first wins,
     * sorted by name, each as its value's identity and its closure's key. Empty is ''.
     */
    private envKey(env: Environment): string {
        if (env === EMPTY_ENVIRONMENT) return '';
        const cached = this.envKeys.get(env);
        if (cached !== undefined) return cached;
        const visible = new Map<string, Closure>();
        for (let e: Environment | null = env; e; e = e.parent) {
            for (const [n, c] of e.bindings) if (!visible.has(n)) visible.set(n, c);
        }
        const key = [...visible.keys()].sort()
            .map(n => `${n}=${this.valueKey(visible.get(n)!.value)}@{${this.envKey(visible.get(n)!.env)}}`)
            .join(';');
        this.envKeys.set(env, key);
        return key;
    }

    /** The identity of a bound value: a source element by id, an object by first sight. */
    private valueKey(value: any): string {
        if (value == null || typeof value !== 'object') return JSON.stringify(value) ?? String(value);
        if (Array.isArray(value)) return `[${value.map(v => this.valueKey(v)).join(',')}]`;
        const el = this.asSourceElement(value);
        if (el && (el.id ?? el.name) != null) return `#${el.id ?? el.name}`;
        let n = this.objectKeys.get(value);
        if (n === undefined) { n = ++this.objectKeyCount; this.objectKeys.set(value, n); }
        return `@${n}`;
    }

    /** `{ x := Var 'a', ... }` for the application stack; empty for the empty environment. */
    private describeBindings(env: Environment): string {
        const visible = new Map<string, Closure>();
        for (let e: Environment | null = env; e; e = e.parent) {
            for (const [n, c] of e.bindings) if (!visible.has(n)) visible.set(n, c);
        }
        if (visible.size === 0) return '';
        return ` with { ${[...visible].map(([n, c]) => `${n} := ${this.describeSubject(c.value)}`).join(', ')} }`;
    }

    private makeDemand(demand: Demand): { __jjtlDemand: number } {
        const id = this.demands.size + 1;
        this.demands.set(id, demand);
        return { __jjtlDemand: id };
    }

    private demandOf(value: any): Demand | undefined {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
        const id = (value as any).__jjtlDemand;
        return typeof id === 'number' ? this.demands.get(id) : undefined;
    }

    /** The environment of the rule application in progress; empty outside one. */
    private currentEnvironment(): TraceEnvironment {
        return this.applicationStack.length > 0
            ? this.applicationStack[this.applicationStack.length - 1].env
            : EMPTY_ENVIRONMENT;
    }

    /** A binding's value: demands realized first, then resolved and placed as before. */
    private async resolveBinding(value: any, targetAttribute: string, owner?: any): Promise<any> {
        const reach: Reach = { feature: targetAttribute, typeName: this.featureTypeOf(owner, targetAttribute) };
        return this.applyCrossTypeResolution(await this.realizeDemands(value, false, reach), targetAttribute, owner);
    }

    /** The declared type of `featureName` on the class of `owner`, own or inherited, or undefined. */
    private featureTypeOf(owner: any, featureName: string): string | undefined {
        const start = owner?.className ?? owner?.__type;
        if (typeof start !== 'string') return undefined;
        const seen = new Set<string>();
        const stack = [start];
        while (stack.length) {
            const n = stack.pop()!;
            if (seen.has(n)) continue;
            seen.add(n);
            const f = this.resolveTargetFeature(n, featureName);
            if (f) return f.typeName;
            stack.push(...(this.targetClasses.get(n)?.superNames || []));
        }
        return undefined;
    }

    /** True when `value` holds something realizeDemands would replace. */
    private needsRealization(value: any, fresh = false, reach?: Reach): boolean {
        if (Array.isArray(value)) return value.some(el => this.needsRealization(el, fresh, reach));
        return this.demandOf(value) !== undefined || this.sourceRuleOf(value, fresh, reach) !== undefined;
    }

    /**
     * The source element `value` stands for and the matched rule that lowers it now, in
     * the current environment: a delegating rule always (its result exists only once
     * applied), any rule under a non-empty environment (implicit resolution inherits the
     * environment down to the leaves, R-JTG-6). Otherwise undefined: the pass 1 target
     * answers, through the resolution that follows, unless `fresh` asks for a new
     * lowering (a bound value, step 5). For a class of lazy rules, the candidates
     * instead: realizeLazy selects one. A class with both is settled by `reach`, the
     * receiving feature (lazyOrMatched).
     */
    private sourceRuleOf(
        value: any, fresh = false, reach?: Reach,
    ): { element: any; rule?: ClassMappingAST; lazy?: ClassMappingAST[] } | undefined {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
        if (value.__createdBy === 'JjTL' || this.demandOf(value) || this.environmentOf(value)) return undefined;
        const element = this.asSourceElement(value);
        if (!element) return undefined;
        const className = this.detectSourceClassName(element);
        const rules = className ? this.context.rulesBySourceType.get(className) : undefined;
        // A class lowered by lazy rules: reaching the node is what applies one (R-JTG-7).
        const lazy = className ? this.lazyBySourceType.get(className) : undefined;
        if (lazy && lazy.length > 0) {
            if (!rules || rules.length === 0) return { element, lazy };
            const side = this.lazyOrMatched(element, lazy, rules, reach);
            if (side !== 'matched') return { element, lazy: side };
        }
        // Ambiguity and absence stay with resolveValue, which reports them.
        if (!rules || rules.length !== 1) return undefined;
        const rule = rules[0];
        if (!rule.result && !fresh && this.currentEnvironment() === EMPTY_ENVIRONMENT) return undefined;
        return { element, rule };
    }

    /**
     * A class with both matched and lazy rules: the lazy rules never match in pass 1, so
     * they do not compete with the matched ones there (R-JTG-3, P-2026-11-04-0015). A binding
     * that reaches a node of the class is settled by the type of its feature: the lazy rules
     * whose target fits it, when no matched rule's does; the matched rule's pass 1 target
     * when no lazy rule's does. Both fitting, or a reach with no feature type, is an error
     * naming the rules. A delegating rule's result has no declared class, so it fits any type.
     */
    private lazyOrMatched(
        element: any, lazy: ClassMappingAST[], matched: ClassMappingAST[], reach?: Reach,
    ): ClassMappingAST[] | 'matched' {
        const typeName = reach?.typeName;
        const fits = (r: ClassMappingAST) => !!typeName && (!!r.result || this.classIsOrExtends(r.targetClass, typeName));
        const lazyFit = lazy.filter(fits);
        const matchedFit = matched.filter(fits);
        if (lazyFit.length > 0 && matchedFit.length === 0) return lazyFit;
        if (typeName && lazyFit.length === 0) return 'matched';
        const labels = (rules: ClassMappingAST[]) => rules.map(r => `'${this.ruleLabel(r)}'`).join(', ');
        const where = reach ? `binding '${reach.feature}'` : 'a value';
        const why = typeName
            ? `the type '${typeName}' of '${reach!.feature}' fits both`
            : 'no feature type tells them apart';
        throw new Error(
            `${where} reaches ${this.describeSubject(element)}, lowered by matched ${labels(matched)} ` +
            `and lazy ${labels(lazy)}: ${why}. Write resolve() for the matched target.`
        );
    }

    /**
     * The lazy rule that lowers `element`: the one whose guard holds, a rule without a
     * guard always holding. None or several is an error naming the candidates.
     */
    private selectLazyRule(element: any, candidates: ClassMappingAST[]): ClassMappingAST {
        const holding = candidates.filter(r =>
            !r.condition || this.evaluateCondition(r.condition, element, r.sources[0]?.alias)
        );
        if (holding.length === 1) return holding[0];
        const subject = this.describeSubject(element);
        const labels = (rules: ClassMappingAST[]) => rules.map(r => `'${this.ruleLabel(r)}'`).join(', ');
        if (holding.length === 0) {
            throw new Error(`No lazy rule applies to ${subject}: the guard of ${labels(candidates)} is false.`);
        }
        throw new Error(`Ambiguous lazy rules for ${subject}: ${labels(holding)} all apply. A guard must select one.`);
    }

    /**
     * A node of a lazy class, reached now: the selected rule is applied afresh under the
     * current environment, or, when `unique`, once per (rule, source, environment).
     */
    private async realizeLazy(element: any, candidates: ClassMappingAST[]): Promise<any> {
        const rule = this.selectLazyRule(element, candidates);
        const env = this.currentEnvironment();
        if (rule.unique) return this.realizeSource(element, rule, env);
        const lowered = await this.applyRule(rule, { source: element, env });
        if (rule.result) this.stats.classMappingsExecuted++;
        return lowered;
    }

    /**
     * Carry out the demands a value holds, element by element: a call applies its rule, a
     * closure lowers its value under its own environment, a source element is lowered as
     * sourceRuleOf says; each is replaced by the result, flattened into an enclosing
     * collection. Any other value is returned unchanged, for the resolution that follows.
     * With `fresh`, a source element of a matched class is lowered anew by its rule, not
     * looked up: a bound value lowers like a lazy node (step 5, R-JTG-6, R-JTG-7).
     */
    private async realizeDemands(value: any, fresh = false, reach?: Reach): Promise<any> {
        if (!this.needsRealization(value, fresh, reach)) return value;
        if (Array.isArray(value)) {
            const out: any[] = [];
            for (const el of value) {
                const realized = await this.realizeDemands(el, fresh, reach);
                if (Array.isArray(realized) && !Array.isArray(el)) out.push(...realized);
                else out.push(realized);
            }
            return out;
        }
        const demand = this.demandOf(value);
        if (demand?.kind === 'call') return this.realizeCall(demand);
        if (demand?.kind === 'closure') return this.realizeClosure(demand);
        const { element, rule, lazy } = this.sourceRuleOf(value, fresh, reach)!;
        if (lazy) return this.realizeLazy(element, lazy);
        if (fresh) {
            // Untraced: a reference to the element still means its pass 1 target.
            const lowered = await this.applyRule(rule!, { source: element, env: this.currentEnvironment(), untraced: true });
            if (rule!.result) this.stats.classMappingsExecuted++;
            return lowered;
        }
        return this.realizeSource(element, rule!, this.currentEnvironment());
    }

    /**
     * A call of a called rule: applied afresh (R-JTG-6), or, when the rule is `unique`, once
     * per (rule, arguments, environment), a later equal call returning the same target
     * (P-2026-11-03-2111). Arguments compare as bound values do: a source element by id, any
     * other object by identity; the environment is the one the application runs under.
     */
    private async realizeCall(demand: CallDemand): Promise<any> {
        const { rule, args, callerEnv } = demand;
        if (!rule.unique) return this.applyRule(rule, { args, env: callerEnv });
        const envParam = (rule.parameters ?? []).findIndex(p => p.paramType === 'Env');
        const env = envParam >= 0 ? (this.environmentOf(args[envParam]) ?? callerEnv) : callerEnv;
        const argKey = args.filter((_, i) => i !== envParam).map(a => this.valueKey(a)).join(',');
        const key = `call|${this.ruleIds.get(rule)}|(${argKey})|${this.envKey(env)}`;
        if (this.realized.has(key)) return this.realized.get(key);
        const lowered = await this.applyRule(rule, { args, env: callerEnv });
        this.realized.set(key, lowered);
        return lowered;
    }

    /**
     * The value a `let` binds: its expression evaluated once, at the binding, with the calls
     * and environment lookups it holds carried out there, so every use of the name means the
     * same target (#515, P-2026-11-03-2111). A source element stays the element, for the
     * binding that uses it to resolve.
     */
    private async letValue(expression: ExpressionAST, ctx: EvaluationContext): Promise<JjelValue> {
        return this.realizeCalls(await this.evaluateExpressionAsync(expression, ctx));
    }

    private holdsDemand(value: any): boolean {
        return Array.isArray(value) ? value.some(el => this.holdsDemand(el)) : this.demandOf(value) !== undefined;
    }

    /** realizeDemands for demands only: source elements are left as they are. */
    private async realizeCalls(value: any): Promise<any> {
        if (!this.holdsDemand(value)) return value;
        if (Array.isArray(value)) {
            const out: any[] = [];
            for (const el of value) {
                const realized = await this.realizeCalls(el);
                if (Array.isArray(realized) && !Array.isArray(el)) out.push(...realized);
                else out.push(realized);
            }
            return out;
        }
        const demand = this.demandOf(value)!;
        return demand.kind === 'call' ? this.realizeCall(demand) : this.realizeClosure(demand);
    }

    /**
     * A source element lowered by a matched rule under `env`, once per (rule, source,
     * environment): the trace key of R-JTG-6. The rule's targets are registered under
     * that key, so the resolution of a later binding finds them.
     */
    private async realizeSource(element: any, rule: ClassMappingAST, env: TraceEnvironment): Promise<any> {
        const sourceKey = String(element?.id ?? element?.name ?? this.valueKey(element));
        const key = `${this.ruleIds.get(rule)}|${sourceKey}|${this.envKey(env)}`;
        if (this.realized.has(key)) return this.realized.get(key);
        const lowered = await this.applyRule(rule, { source: element, env });
        this.realized.set(key, lowered);
        if (rule.result) {
            const targets = (Array.isArray(lowered) ? lowered : [lowered]).filter(isRuleTarget);
            if (targets.length > 0) this.registerTargetsBySourceName(element, targets, rule, targets[0].__type, env);
            this.stats.classMappingsExecuted++;
        }
        return lowered;
    }

    /**
     * The value bound to a name, lowered where it was written: under the environment of
     * its binding site, so the names of the use site are not captured (R-JTG-5). The
     * closure is a frame of its own on the application stack. Each lookup lowers it
     * afresh, even when the binding site's environment is empty: never a shared pass 1
     * target, so one bound value may be placed twice (R-JTG-6).
     */
    private async realizeClosure(demand: ClosureDemand): Promise<any> {
        const { closure } = demand;
        const frame: ApplicationFrame = {
            rule: `binding ${demand.name}`, source: this.describeSubject(closure.value), env: closure.env,
        };
        this.checkDepth(`binding ${demand.name}`, frame);
        this.applicationStack.push(frame);
        try {
            return await this.realizeDemands(closure.value, true);
        } finally {
            this.applicationStack.pop();
        }
    }

    private checkDepth(label: string, frame: ApplicationFrame): void {
        if (this.applicationStack.length >= MAX_APPLICATION_DEPTH) {
            throw new JjtlApplicationAbort(
                `Rule application depth limit (${MAX_APPLICATION_DEPTH}) exceeded applying '${label}' ` +
                `to ${frame.source}: a recursion that makes no progress.` +
                this.applicationStackSuffix([...this.applicationStack, frame], 8)
            );
        }
    }

    /**
     * Apply a called, lazy or delegating rule now, during pass 2, under `env`. A rule that
     * creates a target returns it, after its body is bound; a delegating rule returns what
     * its expression lowers to; a guard that fails returns null with a warning.
     */
    private async applyRule(
        rule: ClassMappingAST,
        app: { source?: any; args?: any[]; env: TraceEnvironment; untraced?: boolean },
    ): Promise<any> {
        const label = this.ruleLabel(rule);
        const source = rule.ruleKind === 'called' ? this.calledRuleSource(rule, app.args ?? []) : app.source;
        const subject = rule.ruleKind === 'called' ? (app.args ?? [])[0] : app.source;
        // An `Env` parameter sets the environment of the application; otherwise the caller's.
        const envParam = rule.ruleKind === 'called'
            ? (rule.parameters ?? []).findIndex(p => p.paramType === 'Env') : -1;
        const env = envParam >= 0 ? (this.environmentOf((app.args ?? [])[envParam]) ?? app.env) : app.env;
        const frame: ApplicationFrame = { rule: label, source: this.describeSubject(subject), env };
        this.checkDepth(label, frame);

        const savedRule = this.context.currentRuleName;
        const savedInstance = this.context.currentInstanceName;
        this.applicationStack.push(frame);
        this.context.currentRuleName = label;
        this.context.currentInstanceName = frame.source;
        try {
            const alias = rule.ruleKind === 'called' ? undefined : rule.sources[0]?.alias;
            if (rule.result) {
                try {
                    const ctx = this.createInstanceContext(source, alias);
                    const value = await this.evaluateExpressionAsync(rule.result, ctx);
                    // What is left a source element resolves through the trace, as a binding would.
                    return this.resolveValue(await this.realizeDemands(value), `<${label}>`, undefined);
                } catch (error) {
                    // The stack where the expression failed, innermost delegation first, for the
                    // caller that reports it once this frame is popped (pass 2).
                    if (error && typeof error === 'object' && !(APPLICATION_STACK in error)) {
                        (error as any)[APPLICATION_STACK] = this.applicationStackSuffix();
                    }
                    throw error;
                }
            }
            if (rule.condition && !this.evaluateCondition(rule.condition, source, alias)) {
                const msg = `Rule '${label}' was applied to ${frame.source} and its guard is false: it returned null.`;
                if (!this.warnings.includes(msg)) this.warnings.push(msg);
                return null;
            }
            if (this.unknownTargetClasses.has(rule.targetClass)) return null;

            const sourceElement = rule.ruleKind === 'called' ? this.asSourceElement(subject) : app.source;
            const target = this.createTargetInstance(rule.targetClass, sourceElement);
            const targetModel = this.targetModelRef!;
            if (!targetModel.instances.has(rule.targetClass)) targetModel.instances.set(rule.targetClass, []);
            targetModel.instances.get(rule.targetClass)!.push(target);
            targetModel.roots.push(target);
            this.stats.targetInstancesCreated++;

            const sourceRef: TraceElementRef = {
                modelName: this.ast.sourceMetamodel || 'source',
                elementName: sourceElement?.name || sourceElement?.id || frame.source,
                className: this.detectSourceClassName(sourceElement) ?? '?',
            };
            const targetRef: TraceElementRef = {
                modelName: this.ast.targetMetamodel || 'target',
                elementName: rule.targetClass,
                className: rule.targetClass,
            };
            const traceLink = this.context.traceBuilder.addLink(label, sourceRef, [targetRef], !!rule.condition);
            if (sourceElement && !app.untraced) {
                this.registerTargetsBySourceName(sourceElement, [target], rule, rule.targetClass, env);
            }

            await this.executeAttributeMappingsWithTrace(rule.body, source, target, traceLink, alias);
            this.stats.classMappingsExecuted++;
            return target;
        } finally {
            this.applicationStack.pop();
            this.context.currentRuleName = savedRule;
            this.context.currentInstanceName = savedInstance;
        }
    }

    /** The object a called rule's body evaluates against: one key per parameter. */
    private calledRuleSource(rule: ClassMappingAST, args: any[]): Record<string, any> {
        const source: Record<string, any> = {};
        (rule.parameters ?? []).forEach((p, i) => { source[p.name] = args[i] ?? null; });
        return source;
    }

    /** The source element a value stands for (a view, a `{ __ref }` handle), or undefined. */
    private asSourceElement(value: any): any {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
        if (value.__createdBy === 'JjTL') return undefined;
        if (typeof value.__ref === 'string') {
            const found = this.derefSourceRef({ __ref: value.__ref });
            return found && typeof found.__ref !== 'string' ? found : undefined;
        }
        if (typeof value.id === 'string' && this.isSourceElement(value)) return value;
        if (typeof value.id === 'string' && this.sourceIndexById?.has(value.id)) return this.sourceIndexById.get(value.id);
        return this.detectSourceClassName(value) ? value : undefined;
    }

    /** `Class 'name'` for a source element or argument, for errors and the stack. */
    private describeSubject(value: any): string {
        const el = this.asSourceElement(value) ?? value;
        if (el == null) return 'null';
        if (typeof el !== 'object') return JSON.stringify(el);
        const className = this.detectSourceClassName(el) ?? 'object';
        const name = el.name ?? el.id;
        return name != null ? `${className} '${name}'` : className;
    }

    /** The application stack, innermost first, for an error message; empty outside one. */
    private applicationStackSuffix(stack: ApplicationFrame[] = this.applicationStack, limit = 12): string {
        if (stack.length === 0) return '';
        const frames = [...stack].reverse();
        const shown = frames.slice(0, limit).map(f => `\n  at ${f.rule} on ${f.source}${this.describeEnvironment(f.env)}`);
        const more = frames.length > limit ? `\n  ... ${frames.length - limit} more` : '';
        return `${shown.join('')}${more}`;
    }

    private describeEnvironment(env: TraceEnvironment): string {
        return this.describeBindings(env);
    }

    /** Pass 1 of a delegating matched rule: its source elements, no target. */
    private pass1Delegating(mapping: ClassMappingAST, sourceInstances: Map<string, any[]>): void {
        if (mapping.sources.length > 1) {
            this.errors.push(`Rule '${this.ruleLabel(mapping)}': a delegating rule takes one source class.`);
            return;
        }
        const pending: PendingBinding[] = (sourceInstances.get(mapping.sources[0].className) || [])
            .map(sourceInstance => ({
                sourceInstance,
                evalSource: sourceInstance,
                targetInstance: null,
                traceLink: undefined as unknown as TraceLinkBuilder,
                sourceAlias: mapping.sources[0].alias,
            }));
        this.context.pendingByMapping.set(mapping, pending);
    }

    /**
     * @param owner  The object whose feature `targetAttribute` receives the value. When that
     *               feature is a containment, resolved rule targets are placed inside `owner`
     *               (slice A) instead of travelling as `__ref_result`.
     */
    private applyCrossTypeResolution(value: any, targetAttribute: string, owner?: any): any {
        const resolved = this.resolveValue(value, targetAttribute, undefined, 0);
        if (owner && this.isContainmentFeature(owner, targetAttribute)) {
            return this.placeInContainer(resolved, owner, targetAttribute);
        }
        return this.wrapIfTargetReference(resolved);
    }

    /** `featureName` of the class of `owner` is a containment reference (`composition`). */
    private isContainmentFeature(owner: any, featureName: string): boolean {
        const ownerClassName = owner?.__type || owner?.className;
        if (typeof ownerClassName !== 'string') return false;
        const info = this.resolveTargetFeature(ownerClassName, featureName);
        return !!info?.isReference && !!info.composition;
    }

    /**
     * Place the rule targets of a resolved value inside `owner`, by identity, in order
     * (slice A, SPEC §5.3.2, R-JTG-4). A value holding no rule target is bound as before.
     *
     * The binding replaces what an earlier binding of the same feature had placed, so those
     * claims are released first. Objects created in a body that the feature already holds
     * stay ahead of the placed targets, which keeps source order when a rule names both.
     * A target claimed by another container is not placed; the conflict is reported after
     * pass 2 (settleContainment). Leaving `roots` happens there too.
     */
    private placeInContainer(resolved: any, owner: any, feature: string): any {
        const items: any[] = Array.isArray(resolved) ? resolved : [resolved];
        if (!items.some(isRuleTarget)) return this.wrapIfTargetReference(resolved);

        const prior = owner[feature];
        const priorItems: any[] = Array.isArray(prior) ? prior : prior != null ? [prior] : [];
        for (const el of priorItems) {
            const claim = this.containerOf.get(el);
            if (claim && claim.container === owner && claim.feature === feature) this.containerOf.delete(el);
        }
        const created = priorItems.filter(el => el && typeof el === 'object' && el.__nested);

        const placed: any[] = [];
        let dropped = 0;
        for (const el of items) {
            if (el == null) { dropped++; continue; }
            if (!isRuleTarget(el)) { placed.push(el); continue; }
            if (placed.includes(el)) continue;
            if (this.claimContainment(el, owner, feature)) placed.push(el);
        }
        if (dropped > 0) {
            this.warnings.push(
                `Partially resolved reference array: kept ${items.length - dropped} resolved ` +
                `target(s), dropped ${dropped} unresolved element(s) (target type without a matching rule).`
            );
        }
        if (!Array.isArray(resolved) && created.length === 0) return placed[0] ?? null;
        return [...created, ...placed];
    }

    /** Record `owner.feature` as the container of `target`; false on a second claim. */
    private claimContainment(target: any, owner: any, feature: string): boolean {
        const second: ContainmentClaim = { container: owner, feature, rule: this.context.currentRuleName };
        const first = this.containerOf.get(target);
        if (first && (first.container !== owner || first.feature !== feature)) {
            this.containmentConflicts.push({ target, first, second });
            return false;
        }
        this.containerOf.set(target, second);
        return true;
    }

    /** Remember which object holds the objects created in one of its features. */
    private noteNestedParent(owner: any, created: any[]): void {
        for (const obj of created) {
            if (obj && typeof obj === 'object') this.nestedParentOf.set(obj, owner);
        }
    }

    /**
     * Objects created into `owner.feature` by `-> feature { ... }`, after the rule targets
     * that an earlier binding placed there. Without placed targets the value is `created`,
     * as before: the feature is overwritten.
     */
    private afterPlacedTargets(owner: any, feature: string, created: any): any {
        const prior = owner[feature];
        const priorItems: any[] = Array.isArray(prior) ? prior : prior != null ? [prior] : [];
        const placed = priorItems.filter(el => {
            const claim = this.containerOf.get(el);
            return !!claim && claim.container === owner && claim.feature === feature;
        });
        if (placed.length === 0) return created;
        return [...placed, ...(Array.isArray(created) ? created : [created])];
    }

    /** `Class 'name'` for a target-side object, by its bound name or its source id. */
    private describeTargetObject(obj: any): string {
        const className = obj?.__type || obj?.className || '?';
        const name = typeof obj?.name === 'string' && obj.name ? obj.name : obj?.__sourceId;
        return `${className} '${name ?? '?'}'`;
    }

    /**
     * After pass 2: report second claims and containment cycles as errors, take every
     * placed target out of `roots`, and record each placement in the trace (R-JTG-4).
     */
    private settleContainment(targetModel: TargetModel): void {
        for (const { target, first, second } of this.containmentConflicts) {
            this.errors.push(
                `Containment conflict: ${this.describeTargetObject(target)} is claimed by ` +
                `${this.describeTargetObject(first.container)}.${first.feature} (rule '${first.rule ?? '?'}') and by ` +
                `${this.describeTargetObject(second.container)}.${second.feature} (rule '${second.rule ?? '?'}'). ` +
                `A target has one container; the second claim was not placed.`
            );
        }

        const containerOfAny = (obj: any): any =>
            this.containerOf.get(obj)?.container ?? this.nestedParentOf.get(obj);
        const settled = new Set<any>();
        for (const start of this.containerOf.keys()) {
            if (settled.has(start)) continue;
            const path: any[] = [];
            const index = new Map<any, number>();
            let cur: any = start;
            while (cur && !settled.has(cur)) {
                if (index.has(cur)) {
                    const cycle = path.slice(index.get(cur));
                    this.errors.push(
                        `Containment cycle: ${[...cycle, cur].map(o => this.describeTargetObject(o)).join(' is contained in ')}.`
                    );
                    break;
                }
                index.set(cur, path.length);
                path.push(cur);
                cur = containerOfAny(cur);
            }
            for (const p of path) settled.add(p);
        }

        if (this.containerOf.size === 0) return;
        const kept = targetModel.roots.filter(r => !this.containerOf.has(r));
        targetModel.roots.length = 0;
        targetModel.roots.push(...kept);
        targetModel.containment = new Map(
            [...this.containerOf].map(([t, c]) => [t, { container: c.container, feature: c.feature }])
        );
        // The write-back's nested format (P-2026-11-02-2108). Marked here, after pass 2, never at
        // claim time: a binding made while the target is marked would not wrap a pointer to it.
        // `__placed` keeps it a rule target for the readers that tell the two apart.
        for (const target of this.containerOf.keys()) {
            target.__nested = true;
            target.__placed = true;
        }

        const targetModelName = this.ast.targetMetamodel || 'target';
        const ref = (obj: any): TraceElementRef => ({
            modelName: targetModelName,
            elementName: (typeof obj?.name === 'string' && obj.name) || obj?.__sourceId || '?',
            className: obj?.__type || obj?.className || '?',
        });
        for (const [target, claim] of this.containerOf) {
            this.context.traceBuilder.addPlacement(claim.rule ?? '?', ref(target), ref(claim.container), claim.feature);
        }
    }

    /**
     * If `value` is (or contains) a target instance produced by this
     * transformation, wrap it as `{ __ref_result: true, targets: [...] }`
     * so ProjectEditor can distinguish resolved references from primitive
     * attribute values and write them using the correct (pointer-aware) API.
     */
    private wrapIfTargetReference(value: any): any {
        if (value == null || typeof value !== 'object') return value;
        if ((value as any).__ref_result) return value;
        // A nested creation is an object to be CREATED in a feature, not a pointer
        // to an existing target: wrapping it would make the write-back look for a
        // target that never existed.
        if ((value as any).__nested) return value;

        if (Array.isArray(value)) {
            if (value.some(el => el && typeof el === 'object' && el.__nested)) return value;
            const jjtlTargets = value.filter(el =>
                el && typeof el === 'object' && el.__createdBy === 'JjTL'
            );
            const nullCount = value.filter(el => el == null).length;
            const nonTargetNonNull = value.length - jjtlTargets.length - nullCount;

            // Wrap when the array has at least one JjTL target and every other
            // element is a fail-open null (dropped by resolveValue for a target
            // type without a matching rule). An array that mixes targets with
            // non-null, non-target values keeps the original passthrough.
            if (jjtlTargets.length > 0 && nonTargetNonNull === 0) {
                if (nullCount > 0) {
                    this.warnings.push(
                        `Partially resolved reference array: kept ${jjtlTargets.length} resolved ` +
                        `target(s), dropped ${nullCount} unresolved element(s) (target type without a matching rule).`
                    );
                }
                // Deduplicate by identity — duplicate entries can arise when the raw
                // DValue.values array has the same Pointer twice, which resolves to the
                // same target object. Not by __sourceId: called, lazy and fresh rules give
                // one source element several targets, each its own pointer (slice B2).
                const unique = [...new Set(jjtlTargets)];
                return { __ref_result: true, targets: unique };
            }
            return value;
        }

        if (value.__createdBy === 'JjTL') {
            return { __ref_result: true, targets: [value] };
        }
        return value;
    }

    /**
     * Core resolution logic — shared between the implicit path (invoked on
     * every binding RHS) and the explicit `resolve(expr, Type)` builtin.
     *
     * Handles three value shapes:
     *   1. `{ __ref: pointerId }` — reference wrapper produced by ProjectEditor
     *      when reading raw DValue values. Looked up by pointer ID in the trace.
     *   2. Plain object with `className` / `__type` — source element (from tests
     *      or from proxy flattening). Looked up by name/id in the trace.
     *   3. Primitive / null / array — passthrough or element-wise recursion.
     *
     * @param expectedTarget  Optional target class filter (from resolve(e, T))
     * @param depth           Recursion guard against circular structures
     */
    private resolveValue(
        value: any,
        targetAttribute: string,
        expectedTarget: string | undefined,
        depth: number = 0,
    ): any {
        if (value == null) return value;
        if (depth > 10) {
            console.error('[JjTL] resolveValue: max depth exceeded, returning raw value');
            return value;
        }

        const t = typeof value;
        if (t === 'number' || t === 'boolean') return value;
        if (t === 'string') return value;

        if (Array.isArray(value)) {
            const out: any[] = [];
            for (const el of value) {
                const resolved = this.resolveValue(el, targetAttribute, expectedTarget, depth + 1);
                if (resolved !== undefined) out.push(resolved);
            }
            return out;
        }

        if (t !== 'object') return value;

        // ── Reference wrapper: { __ref: pointerId } ───────────────────────
        // Produced by ProjectEditor when serializing reference features.
        // The pointer ID is looked up in targetsBySourceName (which registers
        // both name and id for every source element in Pass 1).
        if ('__ref' in value && typeof value.__ref === 'string') {
            return this.resolveRefById(value.__ref, targetAttribute, expectedTarget);
        }

        // ── An object of the target model is never a source element ───────
        // The trace is per (source model, target model): with one class name on
        // both sides (`Add -> Add`), a target that `resolve()` returned would
        // otherwise be looked up again as a source `Add` (P-2026-11-02-1956).
        if (value.__createdBy === 'JjTL') return value;

        // ── Object with className (test / flattened proxy path) ───────────
        const className = this.detectSourceClassName(value);
        if (!className) return value;

        const rules = this.context.rulesBySourceType.get(className);
        if (!rules || rules.length === 0) {
            // Fallback kept, now reported: the source object itself is bound.
            if (value.__createdBy !== 'JjTL') {
                this.reportFallback(
                    `${className} '${value.name ?? value.id ?? '?'}' bound to '${targetAttribute}' has no rule ` +
                    `mapping '${className}': the source object itself was bound`
                );
            }
            return value;
        }

        let chosenRule: ClassMappingAST | undefined;
        if (expectedTarget) {
            chosenRule = rules.find(r => r.targetClass === expectedTarget);
            if (!chosenRule) {
                throw new Error(
                    `resolve(${targetAttribute}, ${expectedTarget}): no rule maps '${className}' to '${expectedTarget}'`
                );
            }
        } else if (rules.length === 1) {
            chosenRule = rules[0];
        } else {
            const targetClasses = rules.map(r => r.targetClass).join(', ');
            throw new Error(
                `Ambiguous cross-type resolution for attribute '${targetAttribute}': ` +
                `source type '${className}' has ${rules.length} rules (${targetClasses}). ` +
                `Use resolve(expr, TargetType) to disambiguate.`
            );
        }

        const elementName = value.name || value.id;
        if (!elementName) {
            throw new Error(
                `Cross-type resolution failed for attribute '${targetAttribute}': ` +
                `source element of type '${className}' has no name or id to look up in the trace.`
            );
        }

        const entries = this.traceEntries(String(elementName), EMPTY_ENVIRONMENT);
        const match = entries?.find(e => (expectedTarget ? e.targetClass === expectedTarget : e.rule === chosenRule));
        if (!match) {
            throw new Error(
                `Unresolved reference: no target found for ${className} '${elementName}' ` +
                `in rule '${chosenRule.sources.map(s => s.className).join(',')} -> ${chosenRule.targetClass}' ` +
                `(attribute '${targetAttribute}'). ` +
                `The source element may have been filtered by a 'where' guard.`
            );
        }
        return match.target;
    }

    /**
     * The trace entries for a source element (by name or id) under `environment`: the
     * lookup half of the key (source, rule, environment), R-JTG-6. The caller filters by
     * rule. Implicit resolution passes the caller's environment, always empty before B.
     */
    private traceEntries(sourceKey: string, environment: TraceEnvironment): TargetEntry[] | undefined {
        const entries = this.context.targetsBySourceName.get(sourceKey);
        const key = this.envKey(environment);
        return entries?.filter(e => this.envKey(e.environment) === key);
    }

    /**
     * Resolve a `{ __ref: pointerId }` wrapper by looking up the pointer ID
     * in the trace. Returns `null` (fail-open) if the ID has no corresponding
     * target — the reference may point to an element whose type has no rule.
     *
     * When `expectedTarget` is set (explicit resolve()), ambiguity is resolved
     * by filtering to the matching target class; missing entries throw.
     */
    private resolveRefById(
        sourceId: string,
        targetAttribute: string,
        expectedTarget: string | undefined,
    ): any {
        // Targets of called and lazy rules are not what a reference to the element means:
        // they answer only their own rule (slice B).
        const entries = this.traceEntries(sourceId, EMPTY_ENVIRONMENT)?.filter(e => !e.rule.ruleKind);

        if (!entries || entries.length === 0) {
            if (expectedTarget) {
                throw new Error(
                    `resolve(<ref>, ${expectedTarget}): no traced element with id '${sourceId}'`
                );
            }
            // Implicit path — fail open: reference points to a type without a rule.
            // Fallback kept, now reported.
            this.reportFallback(
                `the reference to '${sourceId}' bound to '${targetAttribute}' points to an element no rule maps: it resolved to null`
            );
            return null;
        }

        if (expectedTarget) {
            const match = entries.find(e => e.targetClass === expectedTarget);
            if (!match) {
                const available = [...new Set(entries.map(e => e.targetClass))].join(', ');
                throw new Error(
                    `resolve(<ref>, ${expectedTarget}): id '${sourceId}' has targets [${available}], none match '${expectedTarget}'`
                );
            }
            return match.target;
        }

        // Single entry (common case: 1 rule, 1 target per source)
        if (entries.length === 1) return entries[0].target;

        // Multiple entries — check if they all come from the same rule
        const distinctRules = new Set(entries.map(e => e.rule));
        if (distinctRules.size === 1) {
            // Fallback kept, now reported: the first target is bound.
            const rule = entries[0].rule;
            this.reportFallback(
                `the reference to '${sourceId}' bound to '${targetAttribute}' has ${entries.length} targets from rule ` +
                `'${rule.sources.map(s => s.className).join(', ')} -> ${rule.targetClass}': the first was bound`
            );
            return entries[0].target;
        }

        // Ambiguous — multiple rules produced targets for the same source ID
        const targetClasses = [...new Set(entries.map(e => e.targetClass))].join(', ');
        throw new Error(
            `Ambiguous cross-type resolution for attribute '${targetAttribute}': ` +
            `source id '${sourceId}' has targets from ${distinctRules.size} rules (${targetClasses}). ` +
            `Use resolve(expr, TargetType) to disambiguate.`
        );
    }

    /**
     * Intercept `resolve(expr)` / `resolve(expr, TargetType)` calls.
     *
     * Recognized in two AST shapes:
     *   1. JjTL FunctionCall with Identifier callee (legacy expression path)
     *   2. JjelExpressionWrapper around JjEL FunctionCall (new `:=` path)
     *
     * The second argument is read as an identifier (class name) WITHOUT being
     * evaluated — this is what makes `resolve(x, Place)` work even though
     * `Place` is not a bound value at runtime. A string literal is also
     * accepted for programmatic callers.
     *
     * Returns `undefined` when the expression is not a resolve call, so the
     * caller falls through to the normal evaluation path.
     */
    private tryEvaluateResolveCall(expr: ExpressionAST, ctx: EvaluationContext): JjelValue | undefined {
        // Case 1: JjTL FunctionCall with Identifier callee named 'resolve'
        if (expr.type === 'FunctionCall') {
            const fc = expr as FunctionCallAST;
            if (fc.callee.type === 'Identifier' && (fc.callee as IdentifierAST).name === 'resolve') {
                return this.runResolveCall(
                    fc.arguments,
                    (arg) => this.evaluateExpression(arg, ctx),
                    (arg) => this.extractJjTLTypeName(arg),
                );
            }
            return undefined;
        }

        // Case 2: JjelExpressionWrapper containing a JjEL FunctionCall named 'resolve'
        if (expr.type === 'JjelExpression') {
            const wrapper = expr as JjelExpressionWrapperAST;
            const inner = wrapper.expression;
            if (inner && inner.type === 'FunctionCall' && inner.name === 'resolve') {
                return this.runResolveCall(
                    inner.args,
                    (arg) => this.jjelEvaluator.evaluate(arg as JjelExpression, ctx),
                    (arg) => this.extractJjelTypeName(arg as JjelExpression),
                );
            }
            return undefined;
        }

        return undefined;
    }

    /**
     * Shared resolve(...) driver: evaluates arg 0 as the source element and
     * extracts arg 1 (optional) as a target class name string, then calls
     * `resolveValue` with both.
     */
    private runResolveCall<A>(
        args: A[],
        evalArg: (arg: A) => JjelValue,
        extractTypeName: (arg: A) => string | undefined,
    ): JjelValue {
        if (args.length === 0) {
            throw new Error(`resolve() requires at least one argument (a source element)`);
        }
        const srcValue = evalArg(args[0]);
        const srcRaw = fromJjelValue(srcValue);
        let typeName: string | undefined;
        if (args.length >= 2) {
            typeName = extractTypeName(args[1]);
            if (!typeName) {
                throw new Error(`resolve(expr, TargetType): the second argument must be a class name identifier`);
            }
        }
        return this.resolveValue(srcRaw, '<resolve>', typeName) as JjelValue;
    }

    /** Read a JjTL expression AST as a type-name identifier, if possible. */
    private extractJjTLTypeName(arg: ExpressionAST): string | undefined {
        if (arg.type === 'Identifier') return (arg as IdentifierAST).name;
        if (arg.type === 'Literal') {
            const lit = arg as LiteralAST;
            return typeof lit.value === 'string' ? lit.value : undefined;
        }
        if (arg.type === 'JjelExpression') {
            return this.extractJjelTypeName((arg as JjelExpressionWrapperAST).expression);
        }
        return undefined;
    }

    /** Read a JjEL expression AST as a type-name identifier, if possible. */
    private extractJjelTypeName(arg: JjelExpression): string | undefined {
        if (arg.type === 'Identifier') return arg.name;
        if (arg.type === 'Literal' && typeof arg.value === 'string') return arg.value;
        return undefined;
    }

    /**
     * Detect the source class name of an object. Looks at the usual Jjodel
     * markers (__type, className) and falls back to the L-layer `instanceof`
     * pointer when available (produced by L proxies).
     */
    private detectSourceClassName(obj: any): string | undefined {
        if (!obj || typeof obj !== 'object') return undefined;
        if (typeof obj.className === 'string') return obj.className;
        if (typeof obj.__type === 'string') return obj.__type;
        // L-layer: .instanceof is an LClass proxy whose .name is the source type
        const inst = obj.instanceof;
        if (inst && typeof inst === 'object' && typeof inst.name === 'string') return inst.name;
        return undefined;
    }

    // ============================================
    // LEGACY — bypassed, kept for reference during migration
    // All expression evaluation now delegates to JjEL via astBridge.
    // The methods below are no longer called by evaluateExpression().
    // ============================================

    /**
     * LEGACY — Evaluate function call
     * @deprecated Replaced by JjEL evaluator delegation via astBridge
     */
    private _evaluateFunctionCallLegacy(expr: FunctionCallAST, ctx: EvaluationContext): JjelValue {
        // Get callee
        const callee = this.evaluateExpression(expr.callee, ctx);

        // Check if it's a builtin or helper
        if (expr.callee.type === 'Identifier') {
            const fnName = (expr.callee as IdentifierAST).name;
            const builtin = ctx.getBuiltin(fnName);
            if (builtin) {
                const args = expr.arguments.map(arg => this.evaluateExpression(arg, ctx));
                return builtin.call(args, ctx);
            }
        }

        // Check if callee is a function
        if (callee && typeof callee === 'object' && '__jjelFunction' in callee) {
            const fn = callee as JjelFunction;
            const args = expr.arguments.map(arg => this.evaluateExpression(arg, ctx));
            return fn.call(args, ctx);
        }

        // Handle method calls on objects/arrays (map, filter, etc.)
        if (expr.callee.type === 'MemberAccess' || expr.callee.type === 'NullSafeMemberAccess') {
            const memberExpr = expr.callee as MemberAccessAST;
            const obj = this.evaluateExpression(memberExpr.object, ctx);
            const method = memberExpr.property;

            return this._evaluateMethodCallLegacy(obj, method, expr.arguments, ctx);
        }

        return null;
    }

    /**
     * LEGACY — Evaluate method call on object/array
     * @deprecated Replaced by JjEL evaluator delegation via astBridge
     */
    private _evaluateMethodCallLegacy(
        obj: JjelValue,
        method: string,
        args: ExpressionAST[],
        ctx: EvaluationContext
    ): JjelValue {
        if (Array.isArray(obj)) {
            switch (method) {
                case 'filter': {
                    if (args.length > 0) {
                        const predicate = this.evaluateExpression(args[0], ctx);
                        return obj.filter(item => {
                            const result = this._applyFunctionLegacy(predicate, [item], ctx);
                            return Boolean(result);
                        });
                    }
                    return obj;
                }
                case 'map': {
                    if (args.length > 0) {
                        const mapper = this.evaluateExpression(args[0], ctx);
                        return obj.map(item => this._applyFunctionLegacy(mapper, [item], ctx));
                    }
                    return obj;
                }
                case 'find':
                case 'first': {
                    if (args.length > 0) {
                        const predicate = this.evaluateExpression(args[0], ctx);
                        return obj.find(item => Boolean(this._applyFunctionLegacy(predicate, [item], ctx))) ?? null;
                    }
                    return obj.length > 0 ? obj[0] : null;
                }
                case 'any':
                case 'some': {
                    if (args.length > 0) {
                        const predicate = this.evaluateExpression(args[0], ctx);
                        return obj.some(item => Boolean(this._applyFunctionLegacy(predicate, [item], ctx)));
                    }
                    return obj.length > 0;
                }
                case 'all':
                case 'every': {
                    if (args.length > 0) {
                        const predicate = this.evaluateExpression(args[0], ctx);
                        return obj.every(item => Boolean(this._applyFunctionLegacy(predicate, [item], ctx)));
                    }
                    return true;
                }
                case 'count':
                case 'size':
                    return obj.length;
                case 'isEmpty':
                    return obj.length === 0;
                case 'notEmpty':
                case 'isNotEmpty':
                    return obj.length > 0;
                case 'flatten':
                    return obj.flat();
                case 'distinct':
                case 'unique':
                    return [...new Set(obj)];
                case 'sum':
                    if (args.length > 0) {
                        const selector = this.evaluateExpression(args[0], ctx);
                        return obj.reduce<number>((sum, item) => {
                            const val = U.asNumber(this._applyFunctionLegacy(selector, [item], ctx), 0, NaN);
                            return sum + (isNaN(val) ? 0 : val);
                        }, 0);
                    }
                    return obj.reduce<number>((sum, val) => sum + U.asNumber(val, 0, NaN), 0);
                case 'avg':
                case 'average': {
                    if (obj.length === 0) return null;
                    if (args.length > 0) {
                        const selector = this.evaluateExpression(args[0], ctx);
                        const sum = obj.reduce<number>((s, item) => {
                            const val = this._applyFunctionLegacy(selector, [item], ctx);
                            return s + U.asNumber(val, 0, NaN);
                        }, 0);
                        return sum / obj.length;
                    }
                    const sum = obj.reduce<number>((s, val) => s + U.asNumber(val, 0, NaN), 0);
                    return sum / obj.length;
                }
                case 'join': {
                    const sep = args.length > 0 ? String(this.evaluateExpression(args[0], ctx)) : ',';
                    return obj.map(String).join(sep);
                }
                case 'sortBy':
                case 'orderBy': {
                    if (args.length > 0) {
                        const selector = this.evaluateExpression(args[0], ctx);
                        return [...obj].sort((a, b) => {
                            const valA: any = this._applyFunctionLegacy(selector, [a], ctx);
                            const valB: any = this._applyFunctionLegacy(selector, [b], ctx);
                            if (valA < valB) return -1;
                            if (valA > valB) return 1;
                            return 0;
                        });
                    }
                    return [...obj].sort();
                }
                case 'reverse':
                    return [...obj].reverse();
                case 'take':
                case 'limit': {
                    const n = args.length > 0 ? Number(this.evaluateExpression(args[0], ctx)) : 10;
                    return obj.slice(0, n);
                }
                case 'skip':
                case 'drop': {
                    const n = args.length > 0 ? Number(this.evaluateExpression(args[0], ctx)) : 0;
                    return obj.slice(n);
                }
            }
        }

        if (typeof obj === 'string') {
            switch (method) {
                case 'toUpper':
                case 'toUpperCase':
                    return obj.toUpperCase();
                case 'toLower':
                case 'toLowerCase':
                    return obj.toLowerCase();
                case 'trim':
                    return obj.trim();
                case 'length':
                case 'size':
                    return obj.length;
                case 'startsWith': {
                    const prefix = args.length > 0 ? String(this.evaluateExpression(args[0], ctx)) : '';
                    return obj.startsWith(prefix);
                }
                case 'endsWith': {
                    const suffix = args.length > 0 ? String(this.evaluateExpression(args[0], ctx)) : '';
                    return obj.endsWith(suffix);
                }
                case 'contains':
                case 'includes': {
                    const substr = args.length > 0 ? String(this.evaluateExpression(args[0], ctx)) : '';
                    return obj.includes(substr);
                }
                case 'replace': {
                    if (args.length >= 2) {
                        const search = String(this.evaluateExpression(args[0], ctx));
                        const replacement = String(this.evaluateExpression(args[1], ctx));
                        return obj.replace(search, replacement);
                    }
                    return obj;
                }
                case 'split': {
                    const sep = args.length > 0 ? String(this.evaluateExpression(args[0], ctx)) : '';
                    return obj.split(sep);
                }
                case 'substring':
                case 'substr': {
                    const start = args.length > 0 ? Number(this.evaluateExpression(args[0], ctx)) : 0;
                    const length = args.length > 1 ? Number(this.evaluateExpression(args[1], ctx)) : undefined;
                    return length !== undefined ? obj.substring(start, start + length) : obj.substring(start);
                }
            }
        }

        return null;
    }

    /**
     * LEGACY — Apply a function value to arguments
     * @deprecated Replaced by JjEL evaluator delegation via astBridge
     */
    private _applyFunctionLegacy(fn: JjelValue, args: JjelValue[], ctx: EvaluationContext): JjelValue {
        if (fn && typeof fn === 'object' && '__jjelFunction' in fn) {
            return (fn as JjelFunction).call(args, ctx);
        }
        return null;
    }

    /**
     * LEGACY — Evaluate binary expression
     * @deprecated Replaced by JjEL evaluator delegation via astBridge
     */
    private _evaluateBinaryExpressionLegacy(expr: BinaryExpressionAST, ctx: EvaluationContext): JjelValue {
        const left = this.evaluateExpression(expr.left, ctx);
        const right = this.evaluateExpression(expr.right, ctx);

        // console.log('[JjTL Executor] evaluateBinaryExpression:', {
        //     operator: expr.operator,
        //     left,
        //     right,
        //     leftType: typeof left,
        //     rightType: typeof right
        // });

        switch (expr.operator) {
            // Arithmetic
            case '+':
                if (typeof left === 'string' || typeof right === 'string') {
                    const result = String(left ?? '') + String(right ?? '');
                    // console.log('[JjTL Executor] String concatenation result:', result);
                    return result;
                }
                return (Number(left) || 0) + (Number(right) || 0);
            case '-':
                return (Number(left) || 0) - (Number(right) || 0);
            case '*':
                return (Number(left) || 0) * (Number(right) || 0);
            case '/':
                const divisor = Number(right) || 0;
                return divisor !== 0 ? (Number(left) || 0) / divisor : null;
            case '%':
                const mod = Number(right) || 0;
                return mod !== 0 ? (Number(left) || 0) % mod : null;

            // Comparison
            case '==':
            case '=':
                return this.valuesEqual(left, right);
            case '!=':
            case '<>':
                return !this.valuesEqual(left, right);
            case '<':
                return (Number(left) || 0) < (Number(right) || 0);
            case '>':
                return (Number(left) || 0) > (Number(right) || 0);
            case '<=':
                return (Number(left) || 0) <= (Number(right) || 0);
            case '>=':
                return (Number(left) || 0) >= (Number(right) || 0);

            // Logical
            case 'and':
            case '&&':
                return Boolean(left) && Boolean(right);
            case 'or':
            case '||':
                return Boolean(left) || Boolean(right);

            default:
                return null;
        }
    }

    /**
     * LEGACY — Evaluate unary expression
     * @deprecated Replaced by JjEL evaluator delegation via astBridge
     */
    private _evaluateUnaryExpressionLegacy(expr: UnaryExpressionAST, ctx: EvaluationContext): JjelValue {
        const operand = this.evaluateExpression(expr.operand, ctx);

        switch (expr.operator) {
            case 'not':
                return !Boolean(operand);
            case '-':
                return -(Number(operand) || 0);
            default:
                return null;
        }
    }

    /**
     * LEGACY — Evaluate conditional expression (if-then-else)
     * @deprecated Replaced by JjEL evaluator delegation via astBridge
     */
    private _evaluateConditionalExpressionLegacy(expr: ConditionalExpressionAST, ctx: EvaluationContext): JjelValue {
        const condition = this.evaluateExpression(expr.condition, ctx);
        if (Boolean(condition)) {
            return this.evaluateExpression(expr.thenBranch, ctx);
        } else if (expr.elseBranch) {
            return this.evaluateExpression(expr.elseBranch, ctx);
        }
        return null;
    }

    /**
     * LEGACY — Create lambda function value
     * @deprecated Replaced by JjEL evaluator delegation via astBridge
     */
    private _createLambdaFunctionLegacy(expr: LambdaExpressionAST, ctx: EvaluationContext): JjelFunction {
        return createFunction(expr.params, (args: JjelValue[], callCtx: EvaluationContext) => {
            const bindings: Record<string, JjelValue> = {};
            expr.params.forEach((name, i) => {
                bindings[name] = args[i] ?? null;
            });

            // Use the captured context + new bindings
            const lambdaCtx = ctx.child(bindings);
            return this.evaluateExpression(expr.body, lambdaCtx);
        });
    }

    /**
     * LEGACY — Check if value is of given type
     * @deprecated Replaced by JjEL evaluator delegation via astBridge
     */
    private _checkTypeLegacy(value: JjelValue, typeName: string): boolean {
        // Check className for Jjodel objects
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            const obj = value as Record<string, JjelValue>;
            if (obj.className === typeName || obj.__type === typeName) {
                return true;
            }
        }

        // Primitive types
        switch (typeName) {
            case 'String':
            case 'EString':
                return typeof value === 'string';
            case 'Number':
            case 'Integer':
            case 'EInt':
            case 'EInteger':
                return typeof value === 'number';
            case 'Boolean':
            case 'EBoolean':
                return typeof value === 'boolean';
            case 'Array':
            case 'List':
            case 'Collection':
                return Array.isArray(value);
            case 'Null':
                return value === null;
            default:
                return false;
        }
    }

    /**
     * Get literal value from AST node
     */
    private getLiteralValue(literal: LiteralAST): JjelValue {
        return literal.value as JjelValue;
    }

    /**
     * Check if two values are equal
     */
    private valuesEqual(a: JjelValue, b: JjelValue): boolean {
        if (a === b) return true;
        if (a === null || b === null) return false;
        if (typeof a !== typeof b) return false;

        if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length) return false;
            return a.every((val, i) => this.valuesEqual(val, b[i]));
        }

        if (typeof a === 'object' && typeof b === 'object') {
            const keysA = Object.keys(a);
            const keysB = Object.keys(b);
            if (keysA.length !== keysB.length) return false;
            return keysA.every(key =>
                this.valuesEqual((a as Record<string, JjelValue>)[key], (b as Record<string, JjelValue>)[key])
            );
        }

        return a === b;
    }

    /**
     * Convert EvaluationContext to plain record for jjelEval
     */
    private contextToRecord(ctx: EvaluationContext): Record<string, JjelValue> {
        const record: Record<string, JjelValue> = {};

        // Extract known variables
        const knownVars = ['source', 'self', 'it', 'data', 'classes', 'instances'];
        for (const name of knownVars) {
            const value = ctx.get(name);
            if (value !== undefined) {
                record[name] = value;
            }
        }

        // Also extract instance properties from 'source'.
        // Uses shallowToJjelValue to prevent infinite loops from circular proxy refs.
        const source = ctx.get('source');
        if (source && typeof source === 'object' && !Array.isArray(source)) {
            for (const [key, value] of proxyEntries(source)) {
                if (!key.startsWith('__') && !(key in record)) {
                    record[key] = shallowToJjelValue(value);
                }
            }

            // Extract M1 attribute values from $attrName.value pattern
            extractAttributeValues(source, record);
        }

        // === DEBUG: Step 3 — What does contextToRecord produce? ===
        // console.log('=== CONTEXT RECORD ===');
        // console.log('record keys:', Object.keys(record));
        // console.log('record.surname:', record['surname']);
        // === END DEBUG Step 3 ===

        return record;
    }

    /**
     * Convert AST back to source string for JjEL evaluation
     * This is a simplified version - for complex expressions, use the native evaluator
     */
    private astToSource(expr: ExpressionAST): string {
        switch (expr.type) {
            case 'Literal': {
                const lit = expr as LiteralAST;
                if (lit.literalType === 'string') return `"${lit.value}"`;
                if (lit.value === null) return 'null';
                return String(lit.value);
            }
            case 'Identifier':
                return (expr as IdentifierAST).name;
            case 'MemberAccess': {
                const ma = expr as MemberAccessAST;
                return `${this.astToSource(ma.object)}.${ma.property}`;
            }
            case 'NullSafeMemberAccess': {
                const nma = expr as NullSafeMemberAccessAST;
                return `${this.astToSource(nma.object)}?.${nma.property}`;
            }
            default:
                // For complex expressions, fallback
                return 'null';
        }
    }
}

// ============================================
// CONVENIENCE FUNCTION
// ============================================

/**
 * Execute a transformation
 * NOTE: Creates a deep copy of sourceModel to prevent mutation of the original data
 */
export async function execute(
    ast: TransformationAST,
    sourceModel: any,
    targetMetamodel?: any
): Promise<ExecutionResult> {
    // NOTE: The executor.execute() method handles flattening + deep copy internally,
    // so we pass the original sourceModel directly (no double-copy needed).
    const executor = new JjtlExecutor(ast);
    return executor.execute(sourceModel, targetMetamodel);
}
