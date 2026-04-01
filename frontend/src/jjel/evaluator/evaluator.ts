/**
 * JjEL Expression Evaluator
 * Evaluates parsed JjEL AST nodes
 */

import {
    JjelExpression,
    LiteralExpr,
    IdentifierExpr,
    BinaryExpr,
    UnaryExpr,
    MemberAccessExpr,
    NullSafeMemberAccessExpr,
    MethodCallExpr,
    NullSafeMethodCallExpr,
    IfThenElseExpr,
    NullCoalesceExpr,
    IsTypeExpr,
    ImpliesExpr,
    LambdaExpr,
    ArrayLiteralExpr,
    InterpolatedStringExpr,
    ForAllExpr,
    ExistsExpr,
    WithDoExpr,
    IndexAccessExpr,
    ObjectLiteralExpr,
    BinaryOperator,
    UnaryOperator
} from '../types/ast';

import {
    JjelValue,
    JjelFunction,
    JjelObject,
    EvaluationContext,
    createFunction,
    isJjelFunction,
    isJjelObject
} from './context';

import {
    getCollectionMethod,
    getStringMethod,
    getNumberMethod,
    getDateMethod,
    getDateConstructor
} from './builtins';

// ============================================
// EVALUATION ERROR
// ============================================

export class JjelEvaluationError extends Error {
    constructor(
        message: string,
        public readonly expression?: JjelExpression,
        public readonly cause?: Error
    ) {
        super(message);
        this.name = 'JjelEvaluationError';
    }
}

// ============================================
// EVALUATOR CLASS
// ============================================

export class JjelEvaluator {
    private context: EvaluationContext;

    constructor(context?: EvaluationContext) {
        this.context = context || new EvaluationContext();
        this.registerGlobalBuiltins();
    }

    /**
     * Register global builtin functions
     */
    private registerGlobalBuiltins(): void {
        // Date constructors
        const dateConstructors = ['now', 'today', 'date', 'datetime', 'parseDate'];
        for (const name of dateConstructors) {
            const fn = getDateConstructor(name);
            if (fn) {
                this.context.registerBuiltin(name, createFunction([], (args) => fn(...args)));
            }
        }

        // Type conversion functions
        this.context.registerBuiltin('String', createFunction(['value'], ([value]) => {
            if (value === null) return 'null';
            return String(value);
        }));

        this.context.registerBuiltin('Number', createFunction(['value'], ([value]) => {
            if (typeof value === 'number') return value;
            if (typeof value === 'string') {
                const num = parseFloat(value);
                return isNaN(num) ? null : num;
            }
            if (typeof value === 'boolean') return value ? 1 : 0;
            return null;
        }));

        this.context.registerBuiltin('Boolean', createFunction(['value'], ([value]) => {
            return Boolean(value);
        }));

        this.context.registerBuiltin('Array', createFunction(['...values'], (args) => {
            return args;
        }));
    }

    /**
     * Evaluate an expression
     */
    evaluate(expr: JjelExpression, ctx?: EvaluationContext): JjelValue {
        const evalCtx = ctx || this.context;

        switch (expr.type) {
            case 'Literal':
                return this.evaluateLiteral(expr);
            case 'Identifier':
                return this.evaluateIdentifier(expr, evalCtx);
            case 'Binary':
                return this.evaluateBinary(expr, evalCtx);
            case 'Unary':
                return this.evaluateUnary(expr, evalCtx);
            case 'MemberAccess':
                return this.evaluateMemberAccess(expr, evalCtx);
            case 'NullSafeMemberAccess':
                return this.evaluateNullSafeMemberAccess(expr, evalCtx);
            case 'MethodCall':
                return this.evaluateMethodCall(expr, evalCtx);
            case 'NullSafeMethodCall':
                return this.evaluateNullSafeMethodCall(expr, evalCtx);
            case 'IfThenElse':
                return this.evaluateIfThenElse(expr, evalCtx);
            case 'NullCoalesce':
                return this.evaluateNullCoalesce(expr, evalCtx);
            case 'IsType':
                return this.evaluateIsType(expr, evalCtx);
            case 'Lambda':
                return this.evaluateLambda(expr, evalCtx);
            case 'ArrayLiteral':
                return this.evaluateArrayLiteral(expr, evalCtx);
            case 'InterpolatedString':
                return this.evaluateInterpolatedString(expr, evalCtx);
            case 'Implies':
                return this.evaluateImplies(expr, evalCtx);
            case 'ForAll':
                return this.evaluateForAll(expr, evalCtx);
            case 'Exists':
                return this.evaluateExists(expr, evalCtx);
            case 'WithDo':
                return this.evaluateWithDo(expr, evalCtx);
            case 'IndexAccess':
                return this.evaluateIndexAccess(expr, evalCtx);
            case 'ObjectLiteral':
                return this.evaluateObjectLiteral(expr, evalCtx);
            default:
                throw new JjelEvaluationError(`Unknown expression type: ${(expr as any).type}`, expr);
        }
    }

    // ============================================
    // LITERAL EVALUATION
    // ============================================

    private evaluateLiteral(expr: LiteralExpr): JjelValue {
        return expr.value;
    }

    // ============================================
    // IDENTIFIER EVALUATION
    // ============================================

    private evaluateIdentifier(expr: IdentifierExpr, ctx: EvaluationContext): JjelValue {
        // Check for builtins first
        if (ctx.hasBuiltin(expr.name)) {
            return ctx.getBuiltin(expr.name)!;
        }

        // Check context variables
        if (ctx.has(expr.name)) {
            return ctx.get(expr.name)!;
        }

        // Undefined variable
        return null;
    }

    // ============================================
    // BINARY OPERATIONS
    // ============================================

    private evaluateBinary(expr: BinaryExpr, ctx: EvaluationContext): JjelValue {
        const left = this.evaluate(expr.left, ctx);
        const right = this.evaluate(expr.right, ctx);

        return this.applyBinaryOperator(expr.operator, left, right);
    }

    private applyBinaryOperator(op: BinaryOperator, left: JjelValue, right: JjelValue): JjelValue {
        switch (op) {
            // Arithmetic
            case '+':
                if (typeof left === 'string' || typeof right === 'string') {
                    return String(left ?? '') + String(right ?? '');
                }
                if (typeof left === 'number' && typeof right === 'number') {
                    return left + right;
                }
                if (Array.isArray(left) && Array.isArray(right)) {
                    return [...left, ...right];
                }
                return null;

            case '-':
                if (typeof left === 'number' && typeof right === 'number') {
                    return left - right;
                }
                return null;

            case '*':
                if (typeof left === 'number' && typeof right === 'number') {
                    return left * right;
                }
                if (typeof left === 'string' && typeof right === 'number') {
                    return left.repeat(Math.max(0, Math.floor(right)));
                }
                return null;

            case '/':
                if (typeof left === 'number' && typeof right === 'number') {
                    if (right === 0) return null;
                    return left / right;
                }
                return null;

            case '%':
                if (typeof left === 'number' && typeof right === 'number') {
                    if (right === 0) return null;
                    return left % right;
                }
                return null;

            // Comparison
            case '==':
                return this.isEqual(left, right);

            case '!=':
                return !this.isEqual(left, right);

            case '<':
                return this.compare(left, right) < 0;

            case '>':
                return this.compare(left, right) > 0;

            case '<=':
                return this.compare(left, right) <= 0;

            case '>=':
                return this.compare(left, right) >= 0;

            // Logical
            case 'and':
                return this.isTruthy(left) && this.isTruthy(right);

            case 'or':
                return this.isTruthy(left) || this.isTruthy(right);

            default:
                throw new JjelEvaluationError(`Unknown binary operator: ${op}`);
        }
    }

    // ============================================
    // UNARY OPERATIONS
    // ============================================

    private evaluateUnary(expr: UnaryExpr, ctx: EvaluationContext): JjelValue {
        const operand = this.evaluate(expr.operand, ctx);

        switch (expr.operator) {
            case 'not':
                return !this.isTruthy(operand);

            case '-':
                if (typeof operand === 'number') {
                    return -operand;
                }
                return null;

            default:
                throw new JjelEvaluationError(`Unknown unary operator: ${expr.operator}`);
        }
    }

    // ============================================
    // MEMBER ACCESS
    // ============================================

    private evaluateMemberAccess(expr: MemberAccessExpr, ctx: EvaluationContext): JjelValue {
        const obj = this.evaluate(expr.object, ctx);

        if (obj === null) {
            throw new JjelEvaluationError(
                `Cannot access property '${expr.property}' of null`,
                expr
            );
        }

        return this.getProperty(obj, expr.property);
    }

    private evaluateNullSafeMemberAccess(expr: NullSafeMemberAccessExpr, ctx: EvaluationContext): JjelValue {
        const obj = this.evaluate(expr.object, ctx);

        if (obj === null) {
            return null;
        }

        return this.getProperty(obj, expr.property);
    }

    private getProperty(obj: JjelValue, property: string): JjelValue {
        // Array properties
        if (Array.isArray(obj)) {
            switch (property) {
                case 'length':
                case 'size':
                    return obj.length;
                case 'first':
                    return obj.length > 0 ? obj[0] : null;
                case 'last':
                    return obj.length > 0 ? obj[obj.length - 1] : null;
                case 'isEmpty':
                    return obj.length === 0;
                case 'isNotEmpty':
                case 'notEmpty':
                    return obj.length > 0;
            }
        }

        // String properties
        if (typeof obj === 'string') {
            switch (property) {
                case 'length':
                case 'size':
                    return obj.length;
                case 'isEmpty':
                    return obj.length === 0;
                case 'isNotEmpty':
                case 'notEmpty':
                    return obj.length > 0;
                // String methods as property access (no parentheses)
                case 'toUpper':
                case 'toUpperCase':
                    return obj.toUpperCase();
                case 'toLower':
                case 'toLowerCase':
                    return obj.toLowerCase();
                case 'trim':
                    return obj.trim();
                case 'trimStart':
                case 'trimLeft':
                    return obj.trimStart();
                case 'trimEnd':
                case 'trimRight':
                    return obj.trimEnd();
            }
        }

        // Object property
        if (isJjelObject(obj)) {
            // DClass inheritance properties
            if (obj.className === 'DClass' || (obj as any).__isProxy) {
                switch (property) {
                    case 'superclass': {
                        // First direct parent (or null)
                        const parent = obj.extends ?? obj.father ?? obj.extendedBy;
                        if (Array.isArray(parent)) return parent[0] ?? null;
                        return parent ?? null;
                    }
                    case 'superclasses': {
                        // All direct parents (array)
                        const parents = obj.extends ?? obj.father ?? obj.extendedBy;
                        if (!parents) return [];
                        return Array.isArray(parents) ? parents : [parents];
                    }
                    case 'allSuperclasses': {
                        // Full hierarchy going up (recursive)
                        return this.getAllSuperclasses(obj);
                    }
                    case 'subclass': {
                        // First direct child (or null)
                        const children = obj.subclasses ?? obj.children ?? obj.extendedBy;
                        if (Array.isArray(children)) return children[0] ?? null;
                        return children ?? null;
                    }
                    case 'subclasses': {
                        // All direct children (array)
                        const children = obj.subclasses ?? obj.children ?? obj.extendedBy;
                        if (!children) return [];
                        return Array.isArray(children) ? children : [children];
                    }
                    case 'allSubclasses': {
                        // Full hierarchy going down (recursive)
                        return this.getAllSubclasses(obj);
                    }
                }
            }

            // Check if property exists before accessing
            if (property in obj) {
                return obj[property] ?? null;
            }

            // Property doesn't exist - warn about potential typo
            const availableKeys = Object.keys(obj).filter(k => !k.startsWith('__'));
            const similar = this.findSimilarProperty(property, availableKeys);

            if (similar) {
                console.warn(`[JjEL] Property '${property}' not found. Did you mean '${similar}'?`);
            } else if (availableKeys.length > 0 && availableKeys.length <= 20) {
                console.warn(`[JjEL] Property '${property}' not found. Available: ${availableKeys.slice(0, 10).join(', ')}${availableKeys.length > 10 ? '...' : ''}`);
            } else {
                console.warn(`[JjEL] Property '${property}' not found on object`);
            }

            return null;
        }

        return null;
    }

    /**
     * Get all superclasses recursively (for DClass inheritance)
     */
    private getAllSuperclasses(cls: JjelObject, visited: Set<string> = new Set()): JjelValue[] {
        const result: JjelValue[] = [];

        // Get direct parents (could be single or array)
        const directParents = cls.extends ?? cls.father ?? cls.extendedBy;
        if (!directParents) return result;

        const parents = Array.isArray(directParents) ? directParents : [directParents];

        for (const parent of parents) {
            if (parent && isJjelObject(parent)) {
                // Use id to track visited to avoid cycles
                const parentId = (parent.id as string) ?? String(parent);
                if (!visited.has(parentId)) {
                    visited.add(parentId);
                    result.push(parent);
                    // Recurse for ancestors
                    result.push(...this.getAllSuperclasses(parent, visited));
                }
            }
        }

        return result;
    }

    /**
     * Get all subclasses recursively (for DClass inheritance)
     */
    private getAllSubclasses(cls: JjelObject, visited: Set<string> = new Set()): JjelValue[] {
        const result: JjelValue[] = [];

        // Get direct children (could be single or array)
        const directChildren = cls.subclasses ?? cls.children ?? cls.extendedBy;
        if (!directChildren) return result;

        const children = Array.isArray(directChildren) ? directChildren : [directChildren];

        for (const child of children) {
            if (child && isJjelObject(child)) {
                // Use id to track visited to avoid cycles
                const childId = (child.id as string) ?? String(child);
                if (!visited.has(childId)) {
                    visited.add(childId);
                    result.push(child);
                    // Recurse for descendants
                    result.push(...this.getAllSubclasses(child, visited));
                }
            }
        }

        return result;
    }

    /**
     * Find a similar property name (for typo detection)
     */
    private findSimilarProperty(target: string, candidates: string[]): string | null {
        const targetLower = target.toLowerCase();

        for (const candidate of candidates) {
            const candidateLower = candidate.toLowerCase();

            // Exact match (different case)
            if (targetLower === candidateLower) {
                return candidate;
            }

            // Levenshtein distance <= 2 for short strings
            if (target.length <= 10 && this.levenshteinDistance(targetLower, candidateLower) <= 2) {
                return candidate;
            }

            // Contains check for longer strings
            if (targetLower.includes(candidateLower) || candidateLower.includes(targetLower)) {
                return candidate;
            }
        }

        return null;
    }

    /**
     * Simple Levenshtein distance for typo detection
     */
    private levenshteinDistance(a: string, b: string): number {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;

        const matrix: number[][] = [];

        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1, // substitution
                        matrix[i][j - 1] + 1,     // insertion
                        matrix[i - 1][j] + 1      // deletion
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }

    // ============================================
    // METHOD CALLS
    // ============================================

    private evaluateMethodCall(expr: MethodCallExpr, ctx: EvaluationContext): JjelValue {
        const obj = this.evaluate(expr.object, ctx);

        if (obj === null) {
            throw new JjelEvaluationError(
                `Cannot call method '${expr.method}' on null`,
                expr
            );
        }

        const args = expr.args.map(arg => this.evaluate(arg, ctx));
        return this.callMethod(obj, expr.method, args, ctx);
    }

    private evaluateNullSafeMethodCall(expr: NullSafeMethodCallExpr, ctx: EvaluationContext): JjelValue {
        const obj = this.evaluate(expr.object, ctx);

        if (obj === null) {
            return null;
        }

        const args = expr.args.map(arg => this.evaluate(arg, ctx));
        return this.callMethod(obj, expr.method, args, ctx);
    }

    private callMethod(obj: JjelValue, method: string, args: JjelValue[], ctx: EvaluationContext): JjelValue {
        // Array methods
        if (Array.isArray(obj)) {
            const collectionMethod = getCollectionMethod(method);
            if (collectionMethod) {
                // Check if first arg is a lambda (function)
                const firstArg = args[0];
                if (isJjelFunction(firstArg)) {
                    return collectionMethod(obj, firstArg, ctx, ...args.slice(1));
                }
                return collectionMethod(obj, ...args);
            }
        }

        // String methods
        if (typeof obj === 'string') {
            const stringMethod = getStringMethod(method);
            if (stringMethod) {
                return stringMethod(obj, ...args);
            }

            // Date methods (strings can be ISO date strings)
            const dateMethod = getDateMethod(method);
            if (dateMethod) {
                return dateMethod(obj, ...args);
            }
        }

        // Number methods
        if (typeof obj === 'number') {
            const numberMethod = getNumberMethod(method);
            if (numberMethod) {
                return numberMethod(obj, ...args);
            }
        }

        // Object methods
        if (isJjelObject(obj)) {
            const methodValue = obj[method];
            if (isJjelFunction(methodValue)) {
                return methodValue.call(args, ctx);
            }
        }

        // Method not found - provide helpful error with suggestions
        const typeName = this.getTypeName(obj);
        const availableMethods = this.getAvailableMethods(obj);
        const similar = this.findSimilarProperty(method, availableMethods);

        let errorMsg = `Unknown method '${method}' for type ${typeName}`;
        if (similar) {
            errorMsg += `. Did you mean '${similar}'?`;
        } else if (availableMethods.length > 0) {
            errorMsg += `. Available: ${availableMethods.slice(0, 8).join(', ')}${availableMethods.length > 8 ? '...' : ''}`;
        }

        throw new JjelEvaluationError(errorMsg);
    }

    /**
     * Get available methods for a value type
     */
    private getAvailableMethods(obj: JjelValue): string[] {
        if (Array.isArray(obj)) {
            return ['filter', 'map', 'flatMap', 'first', 'last', 'any', 'all', 'none',
                    'count', 'size', 'isEmpty', 'contains', 'distinct', 'sortBy',
                    'reverse', 'take', 'skip', 'flatten', 'groupBy', 'join', 'sum', 'avg', 'min', 'max'];
        }
        if (typeof obj === 'string') {
            return ['toUpper', 'toLower', 'capitalize', 'trim', 'startsWith', 'endsWith',
                    'substring', 'split', 'replace', 'matches', 'camelCase', 'pascalCase',
                    'snakeCase', 'kebabCase'];
        }
        if (typeof obj === 'number') {
            return ['abs', 'round', 'floor', 'ceil', 'sqrt', 'pow'];
        }
        if (isJjelObject(obj)) {
            return Object.keys(obj).filter(k => !k.startsWith('__') && isJjelFunction(obj[k]));
        }
        return [];
    }

    // ============================================
    // CONDITIONALS
    // ============================================

    private evaluateIfThenElse(expr: IfThenElseExpr, ctx: EvaluationContext): JjelValue {
        const condition = this.evaluate(expr.condition, ctx);

        if (this.isTruthy(condition)) {
            return this.evaluate(expr.thenBranch, ctx);
        }

        if (expr.elseBranch) {
            return this.evaluate(expr.elseBranch, ctx);
        }

        return null;
    }

    private evaluateNullCoalesce(expr: NullCoalesceExpr, ctx: EvaluationContext): JjelValue {
        const left = this.evaluate(expr.left, ctx);
        if (left !== null) {
            return left;
        }
        return this.evaluate(expr.right, ctx);
    }

    // ============================================
    // TYPE CHECKING
    // ============================================

    private evaluateIsType(expr: IsTypeExpr, ctx: EvaluationContext): JjelValue {
        const value = this.evaluate(expr.expression, ctx);
        return ctx.typeRegistry.isInstance(value, expr.targetType);
    }

    // ============================================
    // LAMBDA
    // ============================================

    private evaluateLambda(expr: LambdaExpr, ctx: EvaluationContext): JjelValue {
        // Capture the current context
        const capturedCtx = ctx;

        return createFunction(expr.params, (args, callCtx) => {
            // Create child context with captured scope
            const lambdaCtx = capturedCtx.child();

            // Bind parameters
            for (let i = 0; i < expr.params.length; i++) {
                lambdaCtx.set(expr.params[i], args[i] ?? null);
            }

            // Evaluate body
            return this.evaluate(expr.body, lambdaCtx);
        });
    }

    // ============================================
    // ARRAY LITERAL
    // ============================================

    private evaluateArrayLiteral(expr: ArrayLiteralExpr, ctx: EvaluationContext): JjelValue {
        return expr.elements.map(elem => this.evaluate(elem, ctx));
    }

    // ============================================
    // OBJECT LITERAL
    // ============================================

    private evaluateObjectLiteral(expr: ObjectLiteralExpr, ctx: EvaluationContext): JjelValue {
        const result: Record<string, JjelValue> = {};
        for (const entry of expr.entries) {
            result[entry.key] = this.evaluate(entry.value, ctx);
        }
        return result;
    }

    // ============================================
    // IMPLIES
    // ============================================

    private evaluateImplies(expr: ImpliesExpr, ctx: EvaluationContext): JjelValue {
        const left = this.evaluate(expr.left, ctx);
        // false implies anything = true (vacuous truth)
        if (!this.isTruthy(left)) return true;
        // true implies x = x
        return this.isTruthy(this.evaluate(expr.right, ctx));
    }

    // ============================================
    // FORALL / EXISTS
    // ============================================

    private evaluateForAll(expr: ForAllExpr, ctx: EvaluationContext): JjelValue {
        const collection = this.evaluate(expr.collection, ctx);
        if (!Array.isArray(collection)) return [];

        const results: JjelValue[] = [];
        for (const item of collection) {
            const childCtx = ctx.child({ [expr.variable]: item });

            if (expr.filter) {
                const passes = this.evaluate(expr.filter, childCtx);
                if (!this.isTruthy(passes)) continue;
            }

            results.push(expr.projection ? this.evaluate(expr.projection, childCtx) : item);
        }
        return results;
    }

    private evaluateExists(expr: ExistsExpr, ctx: EvaluationContext): JjelValue {
        const collection = this.evaluate(expr.collection, ctx);
        if (!Array.isArray(collection)) return false;

        for (const item of collection) {
            const childCtx = ctx.child({ [expr.variable]: item });
            if (this.isTruthy(this.evaluate(expr.predicate, childCtx))) return true;
        }
        return false;
    }

    // ============================================
    // WITH...DO
    // ============================================

    private evaluateWithDo(expr: WithDoExpr, ctx: EvaluationContext): JjelValue {
        const ctxObj = this.evaluate(expr.context, ctx);
        const childCtx = ctx.child();

        // Expose all properties of the context object as unqualified identifiers
        if (isJjelObject(ctxObj)) {
            for (const [key, val] of Object.entries(ctxObj)) {
                if (!key.startsWith('__')) childCtx.set(key, val);
            }
        }

        return this.evaluate(expr.body, childCtx);
    }

    // ============================================
    // INDEX ACCESS
    // ============================================

    private evaluateIndexAccess(expr: IndexAccessExpr, ctx: EvaluationContext): JjelValue {
        const obj = this.evaluate(expr.object, ctx);
        const index = this.evaluate(expr.index, ctx);

        if (Array.isArray(obj) && typeof index === 'number') {
            return obj[Math.trunc(index)] ?? null;
        }
        if (isJjelObject(obj) && (typeof index === 'string' || typeof index === 'number')) {
            return (obj as any)[String(index)] ?? null;
        }
        return null;
    }

    // ============================================
    // INTERPOLATED STRING
    // ============================================

    private evaluateInterpolatedString(expr: InterpolatedStringExpr, ctx: EvaluationContext): JjelValue {
        const parts: string[] = [];

        for (const part of expr.parts) {
            if (part.kind === 'text') {
                parts.push(part.value);
            } else {
                const value = this.evaluate(part.expr, ctx);
                parts.push(this.stringify(value));
            }
        }

        return parts.join('');
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private isTruthy(value: JjelValue): boolean {
        if (value === null) return false;
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value !== 0;
        if (typeof value === 'string') return value.length > 0;
        if (Array.isArray(value)) return value.length > 0;
        return true;
    }

    private isEqual(a: JjelValue, b: JjelValue): boolean {
        if (a === b) return true;
        if (a === null || b === null) return a === b;

        if (typeof a !== typeof b) return false;

        if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length !== b.length) return false;
            return a.every((item, i) => this.isEqual(item, b[i]));
        }

        if (isJjelObject(a) && isJjelObject(b)) {
            const keysA = Object.keys(a);
            const keysB = Object.keys(b);
            if (keysA.length !== keysB.length) return false;
            return keysA.every(key => this.isEqual(a[key], b[key]));
        }

        return false;
    }

    private compare(a: JjelValue, b: JjelValue): number {
        if (a === b) return 0;
        if (a === null) return -1;
        if (b === null) return 1;

        if (typeof a === 'number' && typeof b === 'number') {
            return a - b;
        }

        if (typeof a === 'string' && typeof b === 'string') {
            return a.localeCompare(b);
        }

        if (typeof a === 'boolean' && typeof b === 'boolean') {
            return (a ? 1 : 0) - (b ? 1 : 0);
        }

        // Convert to string for comparison
        return String(a).localeCompare(String(b));
    }

    private stringify(value: JjelValue): string {
        if (value === null) return '';
        if (typeof value === 'string') return value;
        if (typeof value === 'number' || typeof value === 'boolean') return String(value);
        if (Array.isArray(value)) return value.map(v => this.stringify(v)).join(', ');
        if (isJjelFunction(value)) return '[Function]';
        if (isJjelObject(value)) return JSON.stringify(value);
        return String(value);
    }

    private getTypeName(value: JjelValue): string {
        if (value === null) return 'null';
        if (typeof value === 'boolean') return 'Boolean';
        if (typeof value === 'number') return Number.isInteger(value) ? 'Integer' : 'Double';
        if (typeof value === 'string') return 'String';
        if (Array.isArray(value)) return 'Array';
        if (isJjelFunction(value)) return 'Function';
        if (isJjelObject(value)) {
            if ('__type' in value) return String(value.__type);
            return 'Object';
        }
        return 'Unknown';
    }

    /**
     * Get the current context
     */
    getContext(): EvaluationContext {
        return this.context;
    }

    /**
     * Create a child evaluator with new bindings
     */
    child(bindings?: Record<string, JjelValue>): JjelEvaluator {
        return new JjelEvaluator(this.context.child(bindings));
    }
}

// ============================================
// CONVENIENCE FUNCTION
// ============================================

/**
 * Evaluate a JjEL expression
 */
export function evaluate(
    expr: JjelExpression,
    context?: EvaluationContext | Record<string, JjelValue>
): JjelValue {
    let ctx: EvaluationContext | undefined;

    if (context instanceof EvaluationContext) {
        ctx = context;
    } else if (context) {
        ctx = new EvaluationContext(context);
    }

    const evaluator = new JjelEvaluator(ctx);
    return evaluator.evaluate(expr);
}
