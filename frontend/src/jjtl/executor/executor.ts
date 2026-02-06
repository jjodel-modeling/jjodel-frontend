/**
 * JjTL Executor
 * Executes transformations from source models to target models using JjEL for expression evaluation
 */

import {
    TransformationAST,
    ClassMappingAST,
    AttributeMappingAST,
    ConversionAST,
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
} from '../types';

import {
    jjelEval,
    EvaluationContext,
    createFunction,
    toJjelValue,
    fromJjelValue,
} from '../../jjel';
import type { JjelValue, JjelFunction } from '../../jjel';

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
     */
    execute(sourceModel: any, targetMetamodel?: any): ExecutionResult {
        console.log('[JjTL Executor] Starting execution...');
        console.log('[JjTL Executor] AST:', this.ast);
        console.log('[JjTL Executor] AST mappings count:', this.ast?.mappings?.length ?? 0);
        console.log('[JjTL Executor] Source model:', sourceModel);
        console.log('[JjTL Executor] Target metamodel:', targetMetamodel);

        const startTime = performance.now();

        try {
            // Initialize context
            this.initializeContext(sourceModel, targetMetamodel);

            // Register helpers
            this.registerHelpers();

            // Create target model container
            const targetModel: TargetModel = {
                instances: new Map(),
                roots: [],
            };

            // Get all source instances
            const sourceInstances = this.extractSourceInstances(sourceModel);

            // Execute class mappings
            for (const mapping of this.ast.mappings) {
                this.executeClassMapping(mapping, sourceInstances, targetModel);
            }

            this.stats.executionTimeMs = performance.now() - startTime;

            return {
                success: this.errors.length === 0,
                targetModel,
                trace: this.context.trace,
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
     * Initialize execution context
     */
    private initializeContext(sourceModel: any, targetMetamodel?: any): void {
        // Create base bindings
        const bindings: Record<string, JjelValue> = {
            source: toJjelValue(sourceModel),
            data: toJjelValue(sourceModel),
        };

        // Add model-specific bindings
        if (sourceModel?.classes) {
            bindings.classes = toJjelValue(sourceModel.classes);
        }
        if (sourceModel?.instances) {
            bindings.instances = toJjelValue(sourceModel.instances);
        }

        this.context = {
            sourceModel,
            targetMetamodel,
            trace: new Map(),
            evalContext: new EvaluationContext(bindings),
            helpers: new Map(),
        };
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

        // Handle Jjodel model structure
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

        return instances;
    }

    /**
     * Execute a class mapping for all matching source instances
     */
    private executeClassMapping(
        mapping: ClassMappingAST,
        sourceInstances: Map<string, any[]>,
        targetModel: TargetModel
    ): void {
        const sourceClassName = mapping.sourceClass;
        const instances = sourceInstances.get(sourceClassName) || [];

        for (const sourceInstance of instances) {
            this.stats.sourceInstancesProcessed++;

            // Check condition if present
            if (mapping.condition) {
                const condResult = this.evaluateCondition(mapping.condition, sourceInstance);
                if (!condResult) {
                    continue; // Skip this instance
                }
            }

            // Create target instance(s)
            const targetInstances = this.createTargetInstances(mapping, sourceInstance, targetModel);

            // Execute attribute mappings for each target instance
            for (const targetInstance of targetInstances) {
                this.executeAttributeMappings(mapping.body, sourceInstance, targetInstance);
            }

            this.stats.classMappingsExecuted++;
        }
    }

    /**
     * Evaluate a condition expression
     */
    private evaluateCondition(condition: ExpressionAST, sourceInstance: any): boolean {
        const ctx = this.createInstanceContext(sourceInstance);
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
     */
    private createTargetInstance(className: string, sourceInstance: any): any {
        return {
            __type: className,
            className,
            __sourceId: sourceInstance?.id || sourceInstance?.name,
            __createdBy: 'JjTL',
        };
    }

    /**
     * Execute attribute mappings on a target instance
     */
    private executeAttributeMappings(
        body: any[],
        sourceInstance: any,
        targetInstance: any
    ): void {
        for (const item of body) {
            if (item.type === 'AttributeMapping') {
                this.executeAttributeMapping(item as AttributeMappingAST, sourceInstance, targetInstance);
                this.stats.attributeMappingsExecuted++;
            }
            // Handle other statement types (Alert, Notify) if needed
        }
    }

    /**
     * Execute a single attribute mapping
     */
    private executeAttributeMapping(
        mapping: AttributeMappingAST,
        sourceInstance: any,
        targetInstance: any
    ): void {
        try {
            let value: JjelValue;

            if (mapping.objectCreation) {
                // Handle object creation: -> Arc { ... }
                value = this.executeObjectCreation(mapping.objectCreation, sourceInstance);
            } else if (mapping.conversion) {
                // Handle conversion
                value = this.executeConversion(mapping.conversion, sourceInstance, mapping.sourceAttribute);
            } else if (mapping.sourceAttribute) {
                // Direct attribute mapping: source.attr -> target.attr
                const ctx = this.createInstanceContext(sourceInstance);
                value = this.evaluatePropertyPath(mapping.sourceAttribute, ctx);
            } else {
                // No source, use null
                value = null;
            }

            // Set target attribute
            targetInstance[mapping.targetAttribute] = fromJjelValue(value);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.errors.push(
                `Failed to map ${mapping.sourceAttribute || '(creation)'} -> ${mapping.targetAttribute}: ${errorMessage}`
            );
        }
    }

    /**
     * Execute a conversion (value mappings or expression)
     */
    private executeConversion(
        conversion: ConversionAST,
        sourceInstance: any,
        sourceAttribute?: string
    ): JjelValue {
        if (conversion.expression) {
            // JjEL expression
            const ctx = this.createInstanceContext(sourceInstance);
            return this.evaluateExpression(conversion.expression, ctx);
        }

        if (conversion.mappings && conversion.mappings.length > 0) {
            // Value mappings: true=1, false=0
            const ctx = this.createInstanceContext(sourceInstance);
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

        return null;
    }

    /**
     * Execute object creation
     */
    private executeObjectCreation(
        creation: ObjectCreationAST,
        sourceInstance: any
    ): JjelValue {
        const newObject: Record<string, JjelValue> = {
            __type: creation.targetClass,
            className: creation.targetClass,
        };

        // Execute nested attribute mappings
        for (const attrMapping of creation.body) {
            if (attrMapping.type === 'AttributeMapping') {
                const ctx = this.createInstanceContext(sourceInstance);
                let value: JjelValue;

                if (attrMapping.conversion?.expression) {
                    value = this.evaluateExpression(attrMapping.conversion.expression, ctx);
                } else if (attrMapping.sourceAttribute) {
                    value = this.evaluatePropertyPath(attrMapping.sourceAttribute, ctx);
                } else {
                    value = null;
                }

                newObject[attrMapping.targetAttribute] = value;
            }
        }

        return newObject;
    }

    /**
     * Create evaluation context with source instance bindings
     */
    private createInstanceContext(sourceInstance: any): EvaluationContext {
        const bindings: Record<string, JjelValue> = {
            source: toJjelValue(sourceInstance),
            self: toJjelValue(sourceInstance),
            it: toJjelValue(sourceInstance),
        };

        // Add instance properties directly
        if (sourceInstance && typeof sourceInstance === 'object') {
            for (const [key, value] of Object.entries(sourceInstance)) {
                if (!key.startsWith('__')) {
                    bindings[key] = toJjelValue(value);
                }
            }
        }

        return this.context.evalContext.child(bindings);
    }

    /**
     * Evaluate a property path (e.g., "source.owner.name")
     */
    private evaluatePropertyPath(path: string, ctx: EvaluationContext): JjelValue {
        // Use JjEL evaluation for the path
        try {
            return jjelEval(path, this.contextToRecord(ctx));
        } catch {
            // Try direct property access on 'source'
            const source = ctx.get('source');
            if (source && typeof source === 'object' && source !== null) {
                const parts = path.split('.');
                let current: any = source;
                for (const part of parts) {
                    if (current && typeof current === 'object' && part in current) {
                        current = current[part];
                    } else {
                        return null;
                    }
                }
                return toJjelValue(current);
            }
            return null;
        }
    }

    /**
     * Evaluate an expression AST node
     */
    private evaluateExpression(expr: ExpressionAST, ctx: EvaluationContext): JjelValue {
        switch (expr.type) {
            case 'Literal':
                return this.getLiteralValue(expr as LiteralAST);

            case 'Identifier':
                return ctx.get((expr as IdentifierAST).name) ?? null;

            case 'MemberAccess': {
                const memberExpr = expr as MemberAccessAST;
                const obj = this.evaluateExpression(memberExpr.object, ctx);
                if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
                    return (obj as Record<string, JjelValue>)[memberExpr.property] ?? null;
                }
                return null;
            }

            case 'NullSafeMemberAccess': {
                const nullSafeExpr = expr as NullSafeMemberAccessAST;
                const obj = this.evaluateExpression(nullSafeExpr.object, ctx);
                if (obj === null || obj === undefined) return null;
                if (typeof obj === 'object' && !Array.isArray(obj)) {
                    return (obj as Record<string, JjelValue>)[nullSafeExpr.property] ?? null;
                }
                return null;
            }

            case 'FunctionCall':
                return this.evaluateFunctionCall(expr as FunctionCallAST, ctx);

            case 'BinaryExpression':
                return this.evaluateBinaryExpression(expr as BinaryExpressionAST, ctx);

            case 'UnaryExpression':
                return this.evaluateUnaryExpression(expr as UnaryExpressionAST, ctx);

            case 'ConditionalExpression':
                return this.evaluateConditionalExpression(expr as ConditionalExpressionAST, ctx);

            case 'NullCoalesceExpression': {
                const nullCoalesce = expr as NullCoalesceExpressionAST;
                const left = this.evaluateExpression(nullCoalesce.left, ctx);
                return left ?? this.evaluateExpression(nullCoalesce.right, ctx);
            }

            case 'IsTypeExpression': {
                const isType = expr as IsTypeExpressionAST;
                const value = this.evaluateExpression(isType.expression, ctx);
                return this.checkType(value, isType.targetType);
            }

            case 'LambdaExpression':
                return this.createLambdaFunction(expr as LambdaExpressionAST, ctx);

            case 'ArrayLiteral': {
                const arrayExpr = expr as ArrayLiteralAST;
                return arrayExpr.elements.map(el => this.evaluateExpression(el, ctx));
            }

            case 'JjelExpression': {
                // Direct JjEL expression - convert context and use jjelEval
                const source = this.astToSource(expr);
                return jjelEval(source, this.contextToRecord(ctx));
            }

            default:
                this.warnings.push(`Unknown expression type: ${expr.type}`);
                return null;
        }
    }

    /**
     * Evaluate function call
     */
    private evaluateFunctionCall(expr: FunctionCallAST, ctx: EvaluationContext): JjelValue {
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

            return this.evaluateMethodCall(obj, method, expr.arguments, ctx);
        }

        return null;
    }

    /**
     * Evaluate method call on object/array
     */
    private evaluateMethodCall(
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
                            const result = this.applyFunction(predicate, [item], ctx);
                            return Boolean(result);
                        });
                    }
                    return obj;
                }
                case 'map': {
                    if (args.length > 0) {
                        const mapper = this.evaluateExpression(args[0], ctx);
                        return obj.map(item => this.applyFunction(mapper, [item], ctx));
                    }
                    return obj;
                }
                case 'find':
                case 'first': {
                    if (args.length > 0) {
                        const predicate = this.evaluateExpression(args[0], ctx);
                        return obj.find(item => Boolean(this.applyFunction(predicate, [item], ctx))) ?? null;
                    }
                    return obj.length > 0 ? obj[0] : null;
                }
                case 'any':
                case 'some': {
                    if (args.length > 0) {
                        const predicate = this.evaluateExpression(args[0], ctx);
                        return obj.some(item => Boolean(this.applyFunction(predicate, [item], ctx)));
                    }
                    return obj.length > 0;
                }
                case 'all':
                case 'every': {
                    if (args.length > 0) {
                        const predicate = this.evaluateExpression(args[0], ctx);
                        return obj.every(item => Boolean(this.applyFunction(predicate, [item], ctx)));
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
                            const val = this.applyFunction(selector, [item], ctx);
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
                            const val = this.applyFunction(selector, [item], ctx);
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
                            const valA = this.applyFunction(selector, [a], ctx);
                            const valB = this.applyFunction(selector, [b], ctx);
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
     * Apply a function value to arguments
     */
    private applyFunction(fn: JjelValue, args: JjelValue[], ctx: EvaluationContext): JjelValue {
        if (fn && typeof fn === 'object' && '__jjelFunction' in fn) {
            return (fn as JjelFunction).call(args, ctx);
        }
        return null;
    }

    /**
     * Evaluate binary expression
     */
    private evaluateBinaryExpression(expr: BinaryExpressionAST, ctx: EvaluationContext): JjelValue {
        const left = this.evaluateExpression(expr.left, ctx);
        const right = this.evaluateExpression(expr.right, ctx);

        switch (expr.operator) {
            // Arithmetic
            case '+':
                if (typeof left === 'string' || typeof right === 'string') {
                    return String(left ?? '') + String(right ?? '');
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
     * Evaluate unary expression
     */
    private evaluateUnaryExpression(expr: UnaryExpressionAST, ctx: EvaluationContext): JjelValue {
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
     * Evaluate conditional expression (if-then-else)
     */
    private evaluateConditionalExpression(expr: ConditionalExpressionAST, ctx: EvaluationContext): JjelValue {
        const condition = this.evaluateExpression(expr.condition, ctx);
        if (Boolean(condition)) {
            return this.evaluateExpression(expr.thenBranch, ctx);
        } else if (expr.elseBranch) {
            return this.evaluateExpression(expr.elseBranch, ctx);
        }
        return null;
    }

    /**
     * Create lambda function value
     */
    private createLambdaFunction(expr: LambdaExpressionAST, ctx: EvaluationContext): JjelFunction {
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
     * Check if value is of given type
     */
    private checkType(value: JjelValue, typeName: string): boolean {
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
export function execute(
    ast: TransformationAST,
    sourceModel: any,
    targetMetamodel?: any
): ExecutionResult {
    // CRITICAL: Deep copy source model to prevent mutation of original data
    // This ensures the source model remains intact after transformation
    const sourceModelCopy = sourceModel ? JSON.parse(JSON.stringify(sourceModel)) : sourceModel;

    const executor = new JjtlExecutor(ast);
    return executor.execute(sourceModelCopy, targetMetamodel);
}
