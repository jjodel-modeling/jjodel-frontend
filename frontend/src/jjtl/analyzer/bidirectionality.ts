/**
 * JjTL Bidirectionality Analyzer
 *
 * Analyzes JjTL transformations to determine if they can be executed
 * bidirectionally (both forward and backward) or only unidirectionally.
 *
 * A transformation is bidirectional if it only uses Core constructs:
 * - Simple property mappings (source -> target)
 * - Symmetric value mappings (both directions exist)
 * - No expressions in conversions
 * - No interactive statements (alert, notify, prompt, input)
 *
 * A transformation is unidirectional if it uses Full constructs:
 * - Expressions in conversions
 * - Conditionals (when clauses)
 * - Interactive statements
 * - Asymmetric value mappings
 * - Object creation
 */

import {
    TransformationAST,
    ClassMappingAST,
    AttributeMappingAST,
    ConversionAST,
    ExpressionAST,
    MappingBodyItemAST,
} from '../types';

// ============================================
// ANALYSIS RESULT TYPES
// ============================================

export type BidirectionalityLevel =
    | 'bidirectional'      // Can execute in both directions
    | 'unidirectional'     // Can only execute forward
    | 'partial';           // Some mappings are bidirectional

export interface BidirectionalityIssue {
    /** Type of issue */
    type:
        | 'expression_conversion'
        | 'conditional_mapping'
        | 'interactive_statement'
        | 'interactive_expression'
        | 'asymmetric_value_mapping'
        | 'object_creation'
        | 'computed_source'
        | 'helper_call'
        | 'lambda_expression'
        | 'null_safe_navigation';

    /** Human-readable message */
    message: string;

    /** Location in source */
    location?: {
        line: number;
        column: number;
    };

    /** Which mapping this affects */
    mapping?: string;

    /** Severity */
    severity: 'error' | 'warning';
}

export interface MappingAnalysis {
    /** Source class */
    sourceClass: string;
    /** Target class */
    targetClass: string;
    /** Is this mapping bidirectional? */
    bidirectional: boolean;
    /** Issues preventing bidirectionality */
    issues: BidirectionalityIssue[];
    /** Attribute mappings analysis */
    attributes: AttributeAnalysis[];
}

export interface AttributeAnalysis {
    /** Source attribute (if any) */
    sourceAttribute?: string;
    /** Target attribute */
    targetAttribute: string;
    /** Is this attribute mapping bidirectional? */
    bidirectional: boolean;
    /** Reason if not bidirectional */
    reason?: string;
}

export interface BidirectionalityAnalysis {
    /** Overall bidirectionality level */
    level: BidirectionalityLevel;

    /** Is the transformation fully bidirectional? */
    isBidirectional: boolean;

    /** Count of bidirectional mappings */
    bidirectionalCount: number;

    /** Count of unidirectional mappings */
    unidirectionalCount: number;

    /** All issues found */
    issues: BidirectionalityIssue[];

    /** Per-mapping analysis */
    mappings: MappingAnalysis[];

    /** Summary message */
    summary: string;
}

// ============================================
// ANALYZER CLASS
// ============================================

export class BidirectionalityAnalyzer {
    private issues: BidirectionalityIssue[] = [];

    /**
     * Analyze a transformation for bidirectionality
     */
    analyze(ast: TransformationAST): BidirectionalityAnalysis {
        this.issues = [];

        const mappingAnalyses: MappingAnalysis[] = [];

        // Analyze each class mapping
        for (const mapping of ast.mappings) {
            mappingAnalyses.push(this.analyzeClassMapping(mapping));
        }

        // Analyze helpers (always make transformation unidirectional)
        if (ast.helpers.length > 0) {
            this.issues.push({
                type: 'helper_call',
                message: `Transformation uses ${ast.helpers.length} helper function(s), which are not bidirectional`,
                severity: 'warning',
            });
        }

        // Calculate counts
        const bidirectionalCount = mappingAnalyses.filter(m => m.bidirectional).length;
        const unidirectionalCount = mappingAnalyses.filter(m => !m.bidirectional).length;

        // Determine overall level
        let level: BidirectionalityLevel;
        if (unidirectionalCount === 0 && this.issues.length === 0) {
            level = 'bidirectional';
        } else if (bidirectionalCount === 0) {
            level = 'unidirectional';
        } else {
            level = 'partial';
        }

        // Generate summary
        const summary = this.generateSummary(level, bidirectionalCount, unidirectionalCount);

        return {
            level,
            isBidirectional: level === 'bidirectional',
            bidirectionalCount,
            unidirectionalCount,
            issues: this.issues,
            mappings: mappingAnalyses,
            summary,
        };
    }

    /**
     * Analyze a class mapping
     */
    private analyzeClassMapping(mapping: ClassMappingAST): MappingAnalysis {
        const issues: BidirectionalityIssue[] = [];
        const attributeAnalyses: AttributeAnalysis[] = [];

        const sourceDesc = mapping.sources.map(s => s.alias ? `${s.className} ${s.alias}` : s.className).join(', ');
        const mappingName = `${sourceDesc} -> ${mapping.targetClass}`;
        const primarySourceClass = mapping.sources[0]?.className ?? '';

        // Check for conditional mapping
        if (mapping.condition) {
            issues.push({
                type: 'conditional_mapping',
                message: `Class mapping ${mappingName} has a 'when' condition`,
                location: mapping.location?.start,
                mapping: mappingName,
                severity: 'warning',
            });
            this.issues.push(issues[issues.length - 1]);
        }

        // Check multiplicity (non-1:1 mappings are harder to reverse)
        if (mapping.targetMultiplicity) {
            const { lower, upper } = mapping.targetMultiplicity;
            if (lower !== upper || lower !== 1) {
                issues.push({
                    type: 'conditional_mapping',
                    message: `Non-1:1 multiplicity may affect reversibility`,
                    location: mapping.location?.start,
                    mapping: mappingName,
                    severity: 'warning',
                });
            }
        }

        // Analyze body items
        for (const item of mapping.body) {
            const analysis = this.analyzeBodyItem(item, mappingName);
            if ('sourceAttribute' in analysis || 'targetAttribute' in analysis) {
                attributeAnalyses.push(analysis as AttributeAnalysis);
            }
            if (analysis.issues) {
                issues.push(...analysis.issues);
                this.issues.push(...analysis.issues);
            }
        }

        const bidirectional = issues.length === 0;

        return {
            sourceClass: primarySourceClass,
            targetClass: mapping.targetClass,
            bidirectional,
            issues,
            attributes: attributeAnalyses,
        };
    }

    /**
     * Analyze a body item (attribute mapping or interactive statement)
     */
    private analyzeBodyItem(
        item: MappingBodyItemAST,
        mappingName: string
    ): AttributeAnalysis & { issues?: BidirectionalityIssue[] } {
        const issues: BidirectionalityIssue[] = [];

        // Interactive statements
        if (item.type === 'AlertStatement') {
            issues.push({
                type: 'interactive_statement',
                message: `Alert statement is not bidirectional`,
                location: item.location?.start,
                mapping: mappingName,
                severity: 'error',
            });
            return { targetAttribute: '[alert]', bidirectional: false, reason: 'Interactive statement', issues };
        }

        if (item.type === 'NotifyStatement') {
            issues.push({
                type: 'interactive_statement',
                message: `Notify statement is not bidirectional`,
                location: item.location?.start,
                mapping: mappingName,
                severity: 'error',
            });
            return { targetAttribute: '[notify]', bidirectional: false, reason: 'Interactive statement', issues };
        }

        // Attribute mapping
        if (item.type === 'AttributeMapping') {
            return this.analyzeAttributeMapping(item, mappingName);
        }

        return { targetAttribute: '[unknown]', bidirectional: false, issues };
    }

    /**
     * Analyze an attribute mapping
     */
    private analyzeAttributeMapping(
        mapping: AttributeMappingAST,
        parentMapping: string
    ): AttributeAnalysis & { issues?: BidirectionalityIssue[] } {
        const issues: BidirectionalityIssue[] = [];
        let bidirectional = true;
        let reason: string | undefined;

        // Object creation is not bidirectional
        if (mapping.objectCreation) {
            issues.push({
                type: 'object_creation',
                message: `Object creation for '${mapping.targetAttribute}' is not bidirectional`,
                location: mapping.location?.start,
                mapping: parentMapping,
                severity: 'warning',
            });
            bidirectional = false;
            reason = 'Object creation';
        }

        // Missing source attribute (computed value)
        if (!mapping.sourceAttribute) {
            issues.push({
                type: 'computed_source',
                message: `Target '${mapping.targetAttribute}' has no source mapping (computed value)`,
                location: mapping.location?.start,
                mapping: parentMapping,
                severity: 'warning',
            });
            bidirectional = false;
            reason = 'Computed value (no source)';
        }

        // Analyze conversion
        if (mapping.conversion) {
            const conversionAnalysis = this.analyzeConversion(mapping.conversion, mapping.targetAttribute, parentMapping);
            if (!conversionAnalysis.bidirectional) {
                bidirectional = false;
                reason = conversionAnalysis.reason;
                issues.push(...conversionAnalysis.issues);
            }
        }

        return {
            sourceAttribute: mapping.sourceAttribute,
            targetAttribute: mapping.targetAttribute,
            bidirectional,
            reason,
            issues,
        };
    }

    /**
     * Analyze a conversion
     */
    private analyzeConversion(
        conversion: ConversionAST,
        targetAttribute: string,
        parentMapping: string
    ): { bidirectional: boolean; reason?: string; issues: BidirectionalityIssue[] } {
        const issues: BidirectionalityIssue[] = [];

        // Expression-based conversion is not bidirectional
        if (conversion.expression) {
            const exprIssues = this.analyzeExpression(conversion.expression, targetAttribute, parentMapping);
            issues.push(...exprIssues);

            if (exprIssues.length > 0 || !this.isSimpleExpression(conversion.expression)) {
                issues.push({
                    type: 'expression_conversion',
                    message: `Expression in conversion for '${targetAttribute}' is not bidirectional`,
                    location: conversion.location?.start,
                    mapping: parentMapping,
                    severity: 'warning',
                });
                return { bidirectional: false, reason: 'Expression conversion', issues };
            }
        }

        // Value mappings - check if symmetric
        if (conversion.mappings && conversion.mappings.length > 0) {
            // For bidirectionality, we need both directions to be mappable
            // This is just a basic check; a full check would verify all values map back
            const sourceValues = new Set(conversion.mappings.map(m => JSON.stringify(m.sourceValue.value)));
            const targetValues = new Set(conversion.mappings.map(m => JSON.stringify(m.targetValue.value)));

            if (sourceValues.size !== targetValues.size) {
                issues.push({
                    type: 'asymmetric_value_mapping',
                    message: `Value mappings for '${targetAttribute}' are asymmetric`,
                    location: conversion.location?.start,
                    mapping: parentMapping,
                    severity: 'warning',
                });
                return { bidirectional: false, reason: 'Asymmetric value mapping', issues };
            }
        }

        return { bidirectional: true, issues };
    }

    /**
     * Check if an expression is simple (just a member access chain)
     */
    private isSimpleExpression(expr: ExpressionAST): boolean {
        switch (expr.type) {
            case 'Identifier':
            case 'Literal':
                return true;
            case 'MemberAccess':
                return this.isSimpleExpression(expr.object);
            default:
                return false;
        }
    }

    /**
     * Analyze an expression for bidirectionality issues
     */
    private analyzeExpression(
        expr: ExpressionAST,
        context: string,
        parentMapping: string
    ): BidirectionalityIssue[] {
        const issues: BidirectionalityIssue[] = [];

        switch (expr.type) {
            case 'PromptExpression':
            case 'InputExpression':
                issues.push({
                    type: 'interactive_expression',
                    message: `Interactive expression '${expr.type}' in '${context}' is not bidirectional`,
                    location: expr.location?.start,
                    mapping: parentMapping,
                    severity: 'error',
                });
                break;

            case 'LambdaExpression':
                issues.push({
                    type: 'lambda_expression',
                    message: `Lambda expression in '${context}' is not bidirectional`,
                    location: expr.location?.start,
                    mapping: parentMapping,
                    severity: 'warning',
                });
                // Analyze lambda body
                issues.push(...this.analyzeExpression(expr.body, context, parentMapping));
                break;

            case 'NullSafeMemberAccess':
            case 'NullSafeFunctionCall':
                issues.push({
                    type: 'null_safe_navigation',
                    message: `Null-safe navigation in '${context}' may affect bidirectionality`,
                    location: expr.location?.start,
                    mapping: parentMapping,
                    severity: 'warning',
                });
                break;

            case 'ConditionalExpression':
                issues.push(...this.analyzeExpression(expr.condition, context, parentMapping));
                issues.push(...this.analyzeExpression(expr.thenBranch, context, parentMapping));
                if (expr.elseBranch) {
                    issues.push(...this.analyzeExpression(expr.elseBranch, context, parentMapping));
                }
                break;

            case 'BinaryExpression':
                issues.push(...this.analyzeExpression(expr.left, context, parentMapping));
                issues.push(...this.analyzeExpression(expr.right, context, parentMapping));
                break;

            case 'UnaryExpression':
                issues.push(...this.analyzeExpression(expr.operand, context, parentMapping));
                break;

            case 'FunctionCall':
                for (const arg of expr.arguments) {
                    issues.push(...this.analyzeExpression(arg, context, parentMapping));
                }
                break;

            case 'MemberAccess':
                issues.push(...this.analyzeExpression(expr.object, context, parentMapping));
                break;

            case 'NullCoalesceExpression':
                issues.push(...this.analyzeExpression(expr.left, context, parentMapping));
                issues.push(...this.analyzeExpression(expr.right, context, parentMapping));
                break;

            case 'ArrayLiteral':
                for (const elem of expr.elements) {
                    issues.push(...this.analyzeExpression(elem, context, parentMapping));
                }
                break;

            // Simple expressions - no issues
            case 'Identifier':
            case 'Literal':
            case 'IsTypeExpression':
                break;
        }

        return issues;
    }

    /**
     * Generate summary message
     */
    private generateSummary(
        level: BidirectionalityLevel,
        bidirectionalCount: number,
        unidirectionalCount: number
    ): string {
        const total = bidirectionalCount + unidirectionalCount;

        switch (level) {
            case 'bidirectional':
                return `All ${total} mapping(s) are bidirectional. This transformation can be executed in both directions.`;

            case 'unidirectional':
                return `All ${total} mapping(s) are unidirectional. This transformation can only be executed forward.`;

            case 'partial':
                return `${bidirectionalCount} of ${total} mapping(s) are bidirectional. ` +
                       `${unidirectionalCount} mapping(s) can only be executed forward.`;
        }
    }
}

// ============================================
// CONVENIENCE FUNCTION
// ============================================

/**
 * Analyze a transformation for bidirectionality
 */
export function analyzeBidirectionality(ast: TransformationAST): BidirectionalityAnalysis {
    const analyzer = new BidirectionalityAnalyzer();
    return analyzer.analyze(ast);
}

/**
 * Quick check if a transformation is bidirectional
 */
export function isBidirectional(ast: TransformationAST): boolean {
    return analyzeBidirectionality(ast).isBidirectional;
}
