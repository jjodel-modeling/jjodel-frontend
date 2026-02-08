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
     * NOTE: Creates a deep copy of sourceModel to prevent mutation of the original data
     */
    execute(sourceModel: any, targetMetamodel?: any): ExecutionResult {
        console.log('[JjTL Executor] Starting execution...');
        console.log('[JjTL Executor] AST:', this.ast);
        console.log('[JjTL Executor] AST mappings count:', this.ast?.mappings?.length ?? 0);

        // CRITICAL: Deep copy source model to prevent mutation of original data
        // This ensures the source model remains intact after transformation
        const sourceModelCopy = sourceModel ? JSON.parse(JSON.stringify(sourceModel)) : sourceModel;

        console.log('[JjTL Executor] Source model (deep copy):', sourceModelCopy);
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
    private executeClassMapping(
        mapping: ClassMappingAST,
        sourceInstances: Map<string, any[]>,
        targetModel: TargetModel
    ): void {
        const sourceClassName = mapping.sourceClass;
        const targetClassName = mapping.targetClass;
        const instances = sourceInstances.get(sourceClassName) || [];

        console.log(`[JjTL Executor] executeClassMapping: ${sourceClassName} -> ${targetClassName}`);
        console.log(`[JjTL Executor] Found ${instances.length} source instances of type "${sourceClassName}"`);
        console.log(`[JjTL Executor] Class mapping body:`, JSON.stringify(mapping.body, null, 2));

        for (const sourceInstance of instances) {
            this.stats.sourceInstancesProcessed++;

            console.log(`[JjTL Executor] Processing source instance:`, {
                id: sourceInstance?.id,
                name: sourceInstance?.name,
                className: sourceInstance?.className,
                __type: sourceInstance?.__type,
            });

            // Check condition if present
            if (mapping.condition) {
                const condResult = this.evaluateCondition(mapping.condition, sourceInstance);
                if (!condResult) {
                    console.log(`[JjTL Executor] Instance skipped due to condition`);
                    continue; // Skip this instance
                }
            }

            // Create target instance(s) with the TARGET class name (not source!)
            const targetInstances = this.createTargetInstances(mapping, sourceInstance, targetModel);
            console.log(`[JjTL Executor] Created ${targetInstances.length} target instance(s) of type "${targetClassName}"`);
            console.log(`[JjTL Executor] Target instance(s):`, targetInstances.map(t => ({
                id: t.id,
                className: t.className,
                __type: t.__type,
            })));

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
    private executeAttributeMappings(
        body: any[],
        sourceInstance: any,
        targetInstance: any
    ): void {
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
                this.executeAttributeMapping(item as AttributeMappingAST, sourceInstance, targetInstance);
                this.stats.attributeMappingsExecuted++;
            }
            // Handle other statement types (Alert, Notify) if needed
        }

        console.log('[JjTL Executor] Target instance after mappings:', targetInstance);
    }

    /**
     * Execute a single attribute mapping
     */
    private executeAttributeMapping(
        mapping: AttributeMappingAST,
        sourceInstance: any,
        targetInstance: any
    ): void {
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
                value = this.executeObjectCreation(mapping.objectCreation, sourceInstance);
            } else if (mapping.conversion) {
                // Handle conversion
                console.log('[JjTL Executor] Handling conversion with expression or mappings');
                value = this.executeConversion(mapping.conversion, sourceInstance, mapping.sourceAttribute);
                console.log('[JjTL Executor] Conversion result:', value);
            } else if (mapping.sourceAttribute) {
                // Direct attribute mapping: source.attr -> target.attr
                console.log('[JjTL Executor] Direct attribute mapping');
                const ctx = this.createInstanceContext(sourceInstance);
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
    private executeConversion(
        conversion: ConversionAST,
        sourceInstance: any,
        sourceAttribute?: string
    ): JjelValue {
        console.log('[JjTL Executor] executeConversion:', {
            hasExpression: !!conversion.expression,
            expressionType: conversion.expression?.type,
            hasMappings: !!(conversion.mappings && conversion.mappings.length > 0),
            sourceAttribute,
            sourceInstanceKeys: Object.keys(sourceInstance || {})
        });

        if (conversion.expression) {
            // JjEL expression
            console.log('[JjTL Executor] Evaluating expression:', JSON.stringify(conversion.expression, null, 2));
            const ctx = this.createInstanceContext(sourceInstance);
            console.log('[JjTL Executor] Context bindings for expression:', {
                name: ctx.get('name'),
                source: ctx.get('source'),
                self: ctx.get('self')
            });
            const result = this.evaluateExpression(conversion.expression, ctx);
            console.log('[JjTL Executor] Expression result:', result);
            return result;
        }

        if (conversion.mappings && conversion.mappings.length > 0) {
            // Value mappings: true=1, false=0
            console.log('[JjTL Executor] Evaluating value mappings');
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

        console.log('[JjTL Executor] No expression or mappings, returning null');
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
     * Evaluate an expression AST node
     */
    private evaluateExpression(expr: ExpressionAST, ctx: EvaluationContext): JjelValue {
        switch (expr.type) {
            case 'Literal':
                return this.getLiteralValue(expr as LiteralAST);

            case 'Identifier': {
                const name = (expr as IdentifierAST).name;
                const value = ctx.get(name) ?? null;
                console.log('[JjTL Executor] Identifier lookup:', { name, value });
                return value;
            }

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

        // ★ CRITICAL FIX: Also extract instance properties from 'source'
        // createInstanceContext adds all source instance properties as bindings,
        // but they need to be passed through to jjelEval for property path resolution
        const source = ctx.get('source');
        if (source && typeof source === 'object' && !Array.isArray(source)) {
            for (const [key, value] of Object.entries(source as Record<string, any>)) {
                if (!key.startsWith('__') && !(key in record)) {
                    record[key] = value as JjelValue;
                }
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
