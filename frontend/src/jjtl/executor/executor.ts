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
    PromptExpressionAST,
    InputExpressionAST,
} from '../types';

import { getUIBridge } from './UIBridge';

import {
    jjelEval,
    JjelEvaluator,
    EvaluationContext,
    createFunction,
    toJjelValue,
    fromJjelValue,
} from '../../jjel';
import type { JjelValue, JjelFunction } from '../../jjel';

import { toJjelAst } from './astBridge';
import { extractAttributeValues } from '../../jjel/evaluator/modelContext';

import {
    TraceModel,
    TraceModelBuilder,
    TraceElementRef,
    TraceLinkBuilder,
} from './traceModel';

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

export class JjtlExecutor {
    private ast: TransformationAST;
    private context!: ExecutionContext;
    private jjelEvaluator: JjelEvaluator = new JjelEvaluator();
    private errors: string[] = [];
    private warnings: string[] = [];
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
        console.log('[JjTL Executor] Starting execution...');
        console.log('[JjTL Executor] AST:', this.ast);
        console.log('[JjTL Executor] AST mappings count:', this.ast?.mappings?.length ?? 0);

        // Flatten L-layer proxies into plain objects (shallow — one level only).
        // JSON.parse(JSON.stringify()) is NOT used because L-layer proxies have
        // circular references (e.g., LClass.attributes[0].owner → LClass) that
        // cause infinite loops during serialization.
        // safeDeepCopy uses flattenProxy (Reflect.ownKeys) to materialize proxy
        // getter properties into plain object keys at the top level only.
        const sourceModelCopy = sourceModel ? safeDeepCopy(sourceModel) : sourceModel;

        // === DEBUG: Step 4 — Source model pipeline ===
        console.log('=== SOURCE MODEL ENTRY (before copy) ===');
        if (Array.isArray(sourceModel) && sourceModel.length > 0) {
            const first = sourceModel[0];
            console.log('first instance type:', typeof first);
            console.log('first instance constructor:', first?.constructor?.name);
            console.log('first instance keys:', Object.keys(first));
            console.log('first instance ownKeys:', Reflect.ownKeys(first));
            console.log('first instance has $name:', '$name' in first);
            console.log('first instance has $surname:', '$surname' in first);
            if ('$surname' in first) {
                console.log('first instance $surname:', first['$surname']);
                console.log('first instance $surname.value:', first['$surname']?.value);
            }
        } else if (sourceModel && typeof sourceModel === 'object') {
            console.log('sourceModel keys:', Object.keys(sourceModel));
        }
        console.log('=== SOURCE MODEL ENTRY (after copy) ===');
        if (Array.isArray(sourceModelCopy) && sourceModelCopy.length > 0) {
            const firstCopy = sourceModelCopy[0];
            console.log('first copy type:', typeof firstCopy);
            console.log('first copy constructor:', firstCopy?.constructor?.name);
            console.log('first copy keys:', Object.keys(firstCopy));
            console.log('first copy ownKeys:', Reflect.ownKeys(firstCopy));
            console.log('first copy has $name:', '$name' in firstCopy);
            console.log('first copy has $surname:', '$surname' in firstCopy);
            if ('$surname' in firstCopy) {
                console.log('first copy $surname:', firstCopy['$surname']);
                console.log('first copy $surname.value:', firstCopy['$surname']?.value);
            }
        }
        // === END DEBUG Step 4 ===

        console.log('[JjTL Executor] Source model (flattened):', sourceModelCopy);
        console.log('[JjTL Executor] Target metamodel:', targetMetamodel);

        const startTime = performance.now();

        try {
            // Initialize context with the COPY, not the original
            this.initializeContext(sourceModelCopy, targetMetamodel);

            // Register helpers
            this.registerHelpers();

            // Create target model container
            const targetModel: TargetModel = {
                instances: new Map(),
                roots: [],
            };

            // Get all source instances from the COPY
            const sourceInstances = this.extractSourceInstances(sourceModelCopy);

            // Validate target classes (e.g. reject abstract targets)
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

            // Execute class mappings
            for (const mapping of this.ast.mappings) {
                await this.executeClassMapping(mapping, sourceInstances, targetModel);
            }

            this.stats.executionTimeMs = performance.now() - startTime;

            // Build final trace model
            const traceModel = this.context.traceBuilder.build();

            // Log trace stats
            const traceStats = this.context.traceBuilder.getStats();
            console.log('[JjTL Executor] Trace stats:', traceStats);
            console.log('[JjTL Executor] Trace model:', {
                transformationName: traceModel.transformationName,
                linksCount: traceModel.links.length,
                invertiblePercentage: traceStats.invertiblePercentage + '%',
            });

            return {
                success: this.errors.length === 0,
                targetModel,
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
     * Validate target classes in all mappings.
     * Rejects abstract classes as transformation targets.
     */
    private validateTargetClasses(): void {
        const tm = this.context.targetMetamodel;
        if (!tm) return;

        // Extract all classes from target metamodel
        const allClasses: Array<{ name: string; isAbstract?: boolean }> = [];
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

        const classMap = new Map(allClasses.map(c => [c.name, c]));
        const abstractNames = new Set(allClasses.filter(c => c.isAbstract).map(c => c.name));

        if (abstractNames.size === 0) return;

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
            }
        };

        const checkBody = (body: any[], parentContext: string) => {
            for (const item of body) {
                if (item.type === 'ForAllMapping' && item.objectCreation) {
                    checkTarget(item.objectCreation.targetClass, `forall in ${parentContext}`);
                    if (item.objectCreation.body) {
                        checkBody(item.objectCreation.body, item.objectCreation.targetClass);
                    }
                }
                if (item.type === 'AttributeMapping' && item.objectCreation) {
                    checkTarget(item.objectCreation.targetClass, `object creation in ${parentContext}`);
                    if (item.objectCreation.body) {
                        checkBody(item.objectCreation.body, item.objectCreation.targetClass);
                    }
                }
            }
        };

        for (const mapping of this.ast.mappings) {
            checkTarget(mapping.targetClass, `${mapping.sources.map(s => s.className).join(', ')} -> ${mapping.targetClass}`);
            if (mapping.body) {
                checkBody(mapping.body, mapping.targetClass);
            }
        }
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

        this.context = {
            sourceModel,
            targetMetamodel,
            trace: new Map(),
            evalContext: new EvaluationContext(bindings),
            helpers: new Map(),
            traceBuilder,
        };

        // Register resolve() and resolveAll() as JjEL builtins
        this.registerTraceBuiltins();
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
     * Register trace-related builtins: resolve() and resolveAll()
     */
    private registerTraceBuiltins(): void {
        const traceBuilder = this.context.traceBuilder;

        // resolve(sourceElementName, targetClassName?) -> TraceElementRef | null
        const resolveFn = createFunction(
            ['sourceElementName', 'targetClassName'],
            (args: JjelValue[]) => {
                const sourceElementName = String(args[0] ?? '');
                const targetClassName = args[1] ? String(args[1]) : undefined;
                const result = traceBuilder.resolve(sourceElementName, targetClassName);
                return result ? toJjelValue(result) : null;
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

        return createFunction(paramNames, (args: JjelValue[], ctx: EvaluationContext) => {
            // Create child context with parameter bindings
            const bindings: Record<string, JjelValue> = {};
            paramNames.forEach((name, i) => {
                bindings[name] = args[i] ?? null;
            });

            const childCtx = ctx.child(bindings);
            return this.evaluateExpression(helper.body, childCtx);
        });
    }

    /**
     * Extract all instances from source model
     */
    private extractSourceInstances(sourceModel: any): Map<string, any[]> {
        const instances = new Map<string, any[]>();

        console.log('[JjTL Executor] extractSourceInstances: input type:',
            Array.isArray(sourceModel) ? 'array' : typeof sourceModel);

        // Handle ARRAY of objects directly (from Jjodel model.objects)
        if (Array.isArray(sourceModel)) {
            console.log('[JjTL Executor] Processing array of', sourceModel.length, 'elements');
            for (const item of sourceModel) {
                if (item && typeof item === 'object') {
                    const className = item.className || item.__type || 'UnknownClass';
                    if (!instances.has(className)) {
                        instances.set(className, []);
                    }
                    instances.get(className)!.push(item);
                    console.log(`[JjTL Executor] Added instance of "${className}":`, item.name || item.id);
                }
            }
            console.log('[JjTL Executor] Instances by class:',
                Array.from(instances.entries()).map(([k, v]) => `${k}: ${v.length}`).join(', '));
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

        // Handle flat object with typed elements
        if (sourceModel && typeof sourceModel === 'object' && !Array.isArray(sourceModel)) {
            for (const [key, value] of Object.entries(sourceModel)) {
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

        console.log('[JjTL Executor] Final instances by class:',
            Array.from(instances.entries()).map(([k, v]) => `${k}: ${v.length}`).join(', '));

        return instances;
    }

    /**
     * Execute a class mapping for all matching source instances
     */
    private async executeClassMapping(
        mapping: ClassMappingAST,
        sourceInstances: Map<string, any[]>,
        targetModel: TargetModel
    ): Promise<void> {
        if (mapping.sources.length > 1) {
            await this.executeMultiSourceClassMapping(mapping, sourceInstances, targetModel);
            return;
        }

        // Single-source path
        const src = mapping.sources[0];
        const sourceClassName = src.className;
        const sourceAlias = src.alias;
        const targetClassName = mapping.targetClass;
        const instances = sourceInstances.get(sourceClassName) || [];
        const ruleName = `${sourceClassName} -> ${targetClassName}`;
        const hasGuard = !!mapping.condition;

        console.log(`[JjTL Executor] executeClassMapping: ${ruleName}`);
        console.log(`[JjTL Executor] Found ${instances.length} source instances of type "${sourceClassName}"`);
        console.log(`[JjTL Executor] Class mapping body items:`, mapping.body?.length ?? 0);

        for (const sourceInstance of instances) {
            this.stats.sourceInstancesProcessed++;

            // Check condition if present
            if (mapping.condition) {
                const condResult = this.evaluateCondition(mapping.condition, sourceInstance, sourceAlias);
                if (!condResult) {
                    console.log(`[JjTL Executor] Instance skipped due to condition`);
                    continue;
                }
            }

            // Create target instance(s)
            const targetInstances = this.createTargetInstances(mapping, sourceInstance, targetModel);

            // Trace refs
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

            for (const targetInstance of targetInstances) {
                await this.executeAttributeMappingsWithTrace(mapping.body, sourceInstance, targetInstance, traceLink, sourceAlias);
            }

            this.stats.classMappingsExecuted++;
        }
    }

    /**
     * Execute a multi-source class mapping using cartesian product of all source instances.
     * All sources must have aliases; missing aliases produce an error.
     */
    private async executeMultiSourceClassMapping(
        mapping: ClassMappingAST,
        sourceInstances: Map<string, any[]>,
        targetModel: TargetModel
    ): Promise<void> {
        // Validate: every source must have an alias
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

        // Collect instances per source (in declaration order)
        const instanceArrays = mapping.sources.map(s => sourceInstances.get(s.className) || []);

        // Cartesian product of all instance arrays
        const combinations = cartesianProduct(instanceArrays);

        for (const combo of combinations) {
            this.stats.sourceInstancesProcessed++;

            // Build a synthetic source object:
            //   • alias names → the corresponding combo instances (for p.name, c.name)
            //   • also spread the first source's own properties at the top level (implicit context)
            const syntheticSource: Record<string, any> = {};
            // Spread first source's own properties first (lowest priority)
            if (combo[0] && typeof combo[0] === 'object') {
                for (const [k, v] of proxyEntries(combo[0])) {
                    if (!k.startsWith('__')) syntheticSource[k] = v;
                }
            }
            // Then bind each alias (higher priority, may override)
            for (let i = 0; i < mapping.sources.length; i++) {
                syntheticSource[mapping.sources[i].alias!] = combo[i];
            }

            // Check condition
            if (mapping.condition) {
                const condResult = this.evaluateCondition(mapping.condition, syntheticSource);
                if (!condResult) continue;
            }

            // Create target instance (use first combo element as "primary" source)
            const targetInstances = this.createTargetInstances(mapping, combo[0], targetModel);

            // Trace refs
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

            for (const targetInstance of targetInstances) {
                await this.executeAttributeMappingsWithTrace(mapping.body, syntheticSource, targetInstance, traceLink);
            }

            this.stats.classMappingsExecuted++;
        }
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
                // Unbounded: create based on source or default to 1
                count = 1;
            } else {
                count = multiplicity.upper;
            }
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
        console.log(`[JjTL Executor] createTargetInstance: creating instance of TARGET class "${className}"`);
        console.log(`[JjTL Executor] createTargetInstance: from source "${sourceInstance?.className || sourceInstance?.__type}"`);

        const targetInstance = {
            __type: className,
            className,
            __sourceId: sourceInstance?.id || sourceInstance?.name,
            __createdBy: 'JjTL',
        };

        console.log(`[JjTL Executor] createTargetInstance: created:`, targetInstance);
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
        console.log('[JjTL Executor] executeAttributeMappings called:', {
            bodyLength: body?.length || 0,
            bodyTypes: body?.map(b => b?.type) || [],
            sourceInstanceName: sourceInstance?.name,
            targetInstanceClassName: targetInstance?.className
        });

        if (!body || body.length === 0) {
            console.log('[JjTL Executor] WARNING: No attribute mappings in body!');
            return;
        }

        for (const item of body) {
            console.log('[JjTL Executor] Processing body item:', {
                type: item?.type,
                sourceAttribute: item?.sourceAttribute,
                targetAttribute: item?.targetAttribute,
                hasConversion: !!item?.conversion,
                conversionType: item?.conversion?.type,
                hasExpression: !!item?.conversion?.expression
            });

            if (item.type === 'AttributeMapping') {
                await this.executeAttributeMapping(item as AttributeMappingAST, sourceInstance, targetInstance, alias);
                this.stats.attributeMappingsExecuted++;
            } else if (item.type === 'ForAllMapping') {
                await this.executeForAllMapping(item as ForAllMappingAST, sourceInstance, targetInstance);
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
            }
        }

        console.log('[JjTL Executor] Target instance after mappings:', targetInstance);
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
        console.log('[JjTL Executor] executeAttributeMappingsWithTrace called');

        if (!body || body.length === 0) {
            return;
        }

        for (const item of body) {
            if (item.type === 'AttributeMapping') {
                const mapping = item as AttributeMappingAST;
                await this.executeAttributeMappingWithTrace(mapping, sourceInstance, targetInstance, traceLink, alias);
                this.stats.attributeMappingsExecuted++;
            } else if (item.type === 'ForAllMapping') {
                await this.executeForAllMapping(item as ForAllMappingAST, sourceInstance, targetInstance);
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
            }
        }

        console.log('[JjTL Executor] Target instance after mappings:', targetInstance);
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
                value = await this.executeObjectCreation(mapping.objectCreation, sourceInstance);
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

            // Set target attribute
            const finalValue = fromJjelValue(value);
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

            console.log(`[JjTL Executor] Set ${mapping.targetAttribute} = ${JSON.stringify(finalValue)} (invertible: ${invertible})`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.errors.push(
                `Failed to map ${mapping.sourceAttribute || '(creation)'} -> ${mapping.targetAttribute}: ${errorMessage}`
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
        console.log('[JjTL Executor] executeAttributeMapping:', {
            sourceAttribute: mapping.sourceAttribute,
            targetAttribute: mapping.targetAttribute,
            hasObjectCreation: !!mapping.objectCreation,
            hasConversion: !!mapping.conversion,
            conversionExpression: mapping.conversion?.expression?.type,
            conversionMappings: mapping.conversion?.mappings?.length
        });

        try {
            let value: JjelValue;

            if (mapping.objectCreation) {
                // Handle object creation: -> Arc { ... }
                console.log('[JjTL Executor] Handling object creation');
                value = await this.executeObjectCreation(mapping.objectCreation, sourceInstance);
            } else if (mapping.expression !== undefined) {
                // New := syntax: evaluate expression, optionally apply value mapping
                console.log('[JjTL Executor] New := syntax, expression type:', mapping.expression.type);
                const ctx = this.createInstanceContext(sourceInstance, alias);
                value = await this.evaluateExpressionAsync(mapping.expression, ctx);
                if (mapping.valueMapping && mapping.valueMapping.length > 0) {
                    const match = mapping.valueMapping.find(vm =>
                        this.valuesEqual(value, this.getLiteralValue(vm.sourceValue))
                    );
                    if (match) value = this.getLiteralValue(match.targetValue);
                }
                console.log('[JjTL Executor] := result:', value);
            } else if (mapping.conversion) {
                // Handle conversion (legacy -> syntax)
                console.log('[JjTL Executor] Handling conversion with expression or mappings');
                value = await this.executeConversion(mapping.conversion, sourceInstance, mapping.sourceAttribute, alias);
                console.log('[JjTL Executor] Conversion result:', value);
            } else if (mapping.sourceAttribute) {
                // Direct attribute mapping: source.attr -> target.attr (legacy)
                console.log('[JjTL Executor] Direct attribute mapping');
                const ctx = this.createInstanceContext(sourceInstance, alias);
                value = this.evaluatePropertyPath(mapping.sourceAttribute, ctx);
                console.log('[JjTL Executor] Direct mapping result:', value);
            } else {
                // No source, use null
                console.log('[JjTL Executor] No source, using null');
                value = null;
            }

            // Set target attribute
            const finalValue = fromJjelValue(value);
            targetInstance[mapping.targetAttribute] = finalValue;
            console.log(`[JjTL Executor] Set ${mapping.targetAttribute} = ${JSON.stringify(finalValue)}`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('[JjTL Executor] Error in executeAttributeMapping:', errorMessage);
            this.errors.push(
                `Failed to map ${mapping.sourceAttribute || '(creation)'} -> ${mapping.targetAttribute}: ${errorMessage}`
            );
        }
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
        console.log('[JjTL Executor] executeConversion:', {
            hasExpression: !!conversion.expression,
            expressionType: conversion.expression?.type,
            hasMappings: !!(conversion.mappings && conversion.mappings.length > 0),
            sourceAttribute,
            sourceInstanceKeys: Object.keys(sourceInstance || {})
        });

        if (conversion.expression) {
            // JjEL expression
            console.log('[JjTL Executor] Evaluating expression type:', conversion.expression?.type);
            const ctx = this.createInstanceContext(sourceInstance, alias);
            console.log('[JjTL Executor] Context bindings for expression:', {
                name: ctx.get('name'),
                source: ctx.get('source'),
                self: ctx.get('self')
            });
            const result = await this.evaluateExpressionAsync(conversion.expression, ctx);
            console.log('[JjTL Executor] Expression result:', result);
            return result;
        }

        if (conversion.mappings && conversion.mappings.length > 0) {
            // Value mappings: true=1, false=0
            console.log('[JjTL Executor] Evaluating value mappings');
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

        console.log('[JjTL Executor] No expression or mappings, returning null');
        return null;
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
        };

        // Execute nested body items (attribute mappings, forall mappings, and interactive statements)
        for (const item of creation.body) {
            if (item.type === 'AttributeMapping') {
                const attrMapping = item as AttributeMappingAST;
                const ctx = extraBindings
                    ? this.createInstanceContext(sourceInstance).child(extraBindings)
                    : this.createInstanceContext(sourceInstance);
                let value: JjelValue;

                if (attrMapping.objectCreation) {
                    value = await this.executeObjectCreation(attrMapping.objectCreation, sourceInstance, extraBindings);
                } else if (attrMapping.expression !== undefined) {
                    value = await this.evaluateExpressionAsync(attrMapping.expression, ctx);
                    if (attrMapping.valueMapping && attrMapping.valueMapping.length > 0) {
                        const match = attrMapping.valueMapping.find(vm =>
                            this.valuesEqual(value, this.getLiteralValue(vm.sourceValue))
                        );
                        if (match) value = this.getLiteralValue(match.targetValue);
                    }
                } else if (attrMapping.conversion?.expression) {
                    value = await this.evaluateExpressionAsync(attrMapping.conversion.expression, ctx);
                } else if (attrMapping.sourceAttribute) {
                    value = this.evaluatePropertyPath(attrMapping.sourceAttribute, ctx);
                } else {
                    value = null;
                }

                newObject[attrMapping.targetAttribute] = value;
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
            }
        }

        return newObject;
    }

    /**
     * Execute a forall mapping inside a class mapping body.
     * Creates one object per element and appends results to the target instance.
     */
    private async executeForAllMapping(
        forall: ForAllMappingAST,
        sourceInstance: any,
        targetInstance: any
    ): Promise<void> {
        const ctx = this.createInstanceContext(sourceInstance);
        const collectionValue = this.evaluateExpression(forall.collection, ctx);
        const collection = fromJjelValue(collectionValue);

        if (!Array.isArray(collection)) {
            if (collection != null) {
                this.warnings.push(`ForAll collection is not an array: ${typeof collection}`);
            }
            return;
        }

        const results: any[] = [];

        for (const item of collection) {
            const itemBindings: Record<string, JjelValue> = {
                [forall.variable]: shallowToJjelValue(item),
            };
            // Also add item properties directly for unqualified access
            // Uses proxyEntries to capture L-layer proxy properties
            if (item && typeof item === 'object') {
                for (const [key, value] of proxyEntries(item)) {
                    if (!key.startsWith('__')) {
                        itemBindings[key] = shallowToJjelValue(value);
                    }
                }
            }
            const childCtx = ctx.child(itemBindings);

            // Apply filter if present
            if (forall.filter) {
                const passes = this.evaluateExpression(forall.filter, childCtx);
                if (!fromJjelValue(passes)) continue;
            }

            // Execute object creation with the forall variable in scope
            const created = await this.executeObjectCreation(
                forall.objectCreation,
                sourceInstance,
                itemBindings
            );
            results.push(fromJjelValue(created));
            this.stats.targetInstancesCreated++;
        }

        // Find the property name to attach results to on the target.
        // The forall is typically nested inside `-> propName { forall ... }`.
        // The created objects go into the target instance — the caller handles placement.
        // For top-level forall in class mapping body, append to a property
        // named after the target class (lowercased + 's') or use the targetClass directly.
        const propName = forall.objectCreation.targetClass.charAt(0).toLowerCase()
            + forall.objectCreation.targetClass.slice(1) + 's';

        if (results.length > 0) {
            const existing = targetInstance[propName];
            if (Array.isArray(existing)) {
                targetInstance[propName] = [...existing, ...results];
            } else {
                targetInstance[propName] = results;
            }
        }
    }

    /**
     * Execute a forall mapping inside an object creation context (e.g., -> col { forall ... }).
     * Results are added to the parent object.
     */
    private async executeForAllMappingOnObject(
        forall: ForAllMappingAST,
        sourceInstance: any,
        parentObject: Record<string, JjelValue>,
        extraBindings?: Record<string, JjelValue>
    ): Promise<void> {
        const baseCtx = extraBindings
            ? this.createInstanceContext(sourceInstance).child(extraBindings)
            : this.createInstanceContext(sourceInstance);
        const collectionValue = this.evaluateExpression(forall.collection, baseCtx);
        const collection = fromJjelValue(collectionValue);

        if (!Array.isArray(collection)) {
            if (collection != null) {
                this.warnings.push(`ForAll collection is not an array: ${typeof collection}`);
            }
            return;
        }

        const results: any[] = [];

        for (const item of collection) {
            const itemBindings: Record<string, JjelValue> = {
                ...(extraBindings || {}),
                [forall.variable]: shallowToJjelValue(item),
            };
            // Uses proxyEntries to capture L-layer proxy properties
            if (item && typeof item === 'object') {
                for (const [key, value] of proxyEntries(item)) {
                    if (!key.startsWith('__')) {
                        itemBindings[key] = shallowToJjelValue(value);
                    }
                }
            }
            const childCtx = baseCtx.child({ [forall.variable]: shallowToJjelValue(item) });

            if (forall.filter) {
                const passes = this.evaluateExpression(forall.filter, childCtx);
                if (!fromJjelValue(passes)) continue;
            }

            const created = await this.executeObjectCreation(
                forall.objectCreation,
                sourceInstance,
                itemBindings
            );
            results.push(fromJjelValue(created));
            this.stats.targetInstancesCreated++;
        }

        // For object-level forall, store results under the target class name (lowercased + 's')
        const propName = forall.objectCreation.targetClass.charAt(0).toLowerCase()
            + forall.objectCreation.targetClass.slice(1) + 's';

        if (results.length > 0) {
            const existing = parentObject[propName];
            if (Array.isArray(existing)) {
                parentObject[propName] = [...(existing as any[]), ...results];
            } else {
                parentObject[propName] = results as any;
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
            source: shallowToJjelValue(sourceInstance),
            self: shallowToJjelValue(sourceInstance),
            it: shallowToJjelValue(sourceInstance),
        };

        // Add instance properties directly — use proxyEntries to capture proxy getter keys
        if (sourceInstance && typeof sourceInstance === 'object') {
            for (const [key, value] of proxyEntries(sourceInstance)) {
                if (!key.startsWith('__')) {
                    bindings[key] = shallowToJjelValue(value);
                }
            }

            // Extract M1 attribute values from $attrName.value pattern
            // This allows transformations to access attribute values by name
            // (e.g., `surname` instead of `$surname.value`)
            extractAttributeValues(sourceInstance, bindings);
        }

        // Bind alias as an additional name for the source instance
        if (alias) {
            bindings[alias] = shallowToJjelValue(sourceInstance);
        }

        // === DEBUG: Step 2 — What does the context look like? ===
        console.log('=== INSTANCE CONTEXT ===');
        console.log('context keys:', Object.keys(bindings));
        console.log('context.surname:', bindings['surname']);
        console.log('context.name:', bindings['name']);
        // === END DEBUG Step 2 ===

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
                console.log(`[JjTL Executor] evaluatePropertyPath: direct access "${path}" = ${JSON.stringify(directValue)}`);
                return toJjelValue(directValue);
            }
        }

        // SECOND: Try context variable lookup
        const ctxValue = ctx.get(path);
        if (ctxValue !== undefined) {
            console.log(`[JjTL Executor] evaluatePropertyPath: context lookup "${path}" = ${JSON.stringify(ctxValue)}`);
            return ctxValue;
        }

        // THIRD: Try JjEL evaluation for complex paths
        try {
            const result = jjelEval(path, this.contextToRecord(ctx));
            console.log(`[JjTL Executor] evaluatePropertyPath: jjelEval "${path}" = ${JSON.stringify(result)}`);
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
        // Special case: standalone function calls (builtins/helpers)
        // JjEL doesn't have a "FunctionCall" node for standalone calls like resolve("x").
        // We handle these by looking up the function in context and calling it directly.
        if (expr.type === 'FunctionCall') {
            const fc = expr as FunctionCallAST;
            if (fc.callee.type === 'Identifier') {
                const fnName = (fc.callee as IdentifierAST).name;
                const builtin = ctx.getBuiltin(fnName);
                if (builtin) {
                    const args = fc.arguments.map(arg => this.evaluateExpression(arg, ctx));
                    return builtin.call(args, ctx);
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
        try {
            const jjelExpr = toJjelAst(expr);
            return this.jjelEvaluator.evaluate(jjelExpr, ctx);
        } catch (error) {
            // Log and fall back to null on evaluation errors
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn(`[JjTL Executor] JjEL evaluation failed for ${expr.type}: ${errorMessage}`);
            this.warnings.push(`Expression evaluation failed (${expr.type}): ${errorMessage}`);
            return null;
        }
    }

    /**
     * Check if an expression is a top-level user-input expression (prompt/input).
     */
    private isUserProvidedExpression(expr: ExpressionAST): boolean {
        return expr.type === 'PromptExpression' || expr.type === 'InputExpression';
    }

    /**
     * Async wrapper around evaluateExpression that handles interactive expressions
     * (PromptExpression, InputExpression) which require awaiting user input via UIBridge.
     * Falls through to the synchronous evaluateExpression for all other expression types.
     */
    private async evaluateExpressionAsync(expr: ExpressionAST, ctx: EvaluationContext): Promise<JjelValue> {
        if (expr.type === 'PromptExpression') {
            const pe = expr as PromptExpressionAST;
            const msg = this.evaluateExpression(pe.message, ctx);
            const defaultVal = pe.defaultValue
                ? this.evaluateExpression(pe.defaultValue, ctx)
                : undefined;
            const result = await getUIBridge().showPrompt(
                String(msg ?? ''),
                pe.typeRef,
                defaultVal !== undefined ? String(defaultVal) : undefined
            );
            if (result.cancelled) return null;
            return result.value;
        }
        if (expr.type === 'InputExpression') {
            const ie = expr as InputExpressionAST;
            const msg = this.evaluateExpression(ie.message, ctx);
            const typeHint = ie.inputType ?? 'EString';
            const opts = ie.options
                ? ie.options.map(o => fromJjelValue(this.evaluateExpression(o, ctx)))
                : undefined;
            const result = await getUIBridge().showInput(
                String(msg ?? ''),
                typeHint,
                undefined,
                Array.isArray(opts) ? opts.map(String) : undefined
            );
            if (result.cancelled) return null;
            return result.value as unknown as JjelValue;
        }
        return this.evaluateExpression(expr, ctx);
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
                case 'sum': {
                    if (args.length > 0) {
                        const selector = this.evaluateExpression(args[0], ctx);
                        return obj.reduce((sum, item) => {
                            const val = this._applyFunctionLegacy(selector, [item], ctx);
                            return sum + (typeof val === 'number' ? val : 0);
                        }, 0);
                    }
                    return obj.reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
                }
                case 'avg':
                case 'average': {
                    if (obj.length === 0) return null;
                    if (args.length > 0) {
                        const selector = this.evaluateExpression(args[0], ctx);
                        const sum = obj.reduce((s, item) => {
                            const val = this._applyFunctionLegacy(selector, [item], ctx);
                            return s + (typeof val === 'number' ? val : 0);
                        }, 0);
                        return sum / obj.length;
                    }
                    const sum = obj.reduce((s, val) => s + (typeof val === 'number' ? val : 0), 0);
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
                            const valA = this._applyFunctionLegacy(selector, [a], ctx);
                            const valB = this._applyFunctionLegacy(selector, [b], ctx);
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

        console.log('[JjTL Executor] evaluateBinaryExpression:', {
            operator: expr.operator,
            left,
            right,
            leftType: typeof left,
            rightType: typeof right
        });

        switch (expr.operator) {
            // Arithmetic
            case '+':
                if (typeof left === 'string' || typeof right === 'string') {
                    const result = String(left ?? '') + String(right ?? '');
                    console.log('[JjTL Executor] String concatenation result:', result);
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
        console.log('=== CONTEXT RECORD ===');
        console.log('record keys:', Object.keys(record));
        console.log('record.surname:', record['surname']);
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
