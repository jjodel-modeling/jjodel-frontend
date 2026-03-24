/**
 * JjTL Abstract Syntax Tree Types
 *
 * JjTL uses JjEL for expressions. The ExpressionAST type is a union
 * of both JjTL-specific expressions and JjEL expressions.
 */

import type { JjelExpression } from '../../jjel/types/ast';

// Re-export JjEL expression type for convenience
export type { JjelExpression };

// Base node
export interface ASTNode {
    type: string;
    location: {
        start: { line: number; column: number };
        end: { line: number; column: number };
    };
}

// Root node
export interface TransformationAST extends ASTNode {
    type: 'Transformation';
    name: string;
    sourceMetamodel: string;
    targetMetamodel: string;
    mappings: ClassMappingAST[];
    helpers: HelperAST[];
}

// A single source pattern in a class mapping: ClassName [alias]
export interface SourcePatternAST {
    className: string;
    alias?: string;
}

// Class mapping: State -> Place { ... }
//   or: State s -> Place { ... }       (single source with alias)
//   or: Class c, Package p -> Table { ... }  (multi-source, aliases mandatory)
export interface ClassMappingAST extends ASTNode {
    type: 'ClassMapping';
    sources: SourcePatternAST[];     // one element for single-source, multiple for multi-source
    targetClass: string;
    targetMultiplicity?: MultiplicityAST;
    condition?: ExpressionAST;
    body: MappingBodyItemAST[];
}

// Union type for items that can appear in a mapping body
export type MappingBodyItemAST =
    | AttributeMappingAST
    | ForAllMappingAST
    | AlertStatementAST
    | NotifyStatementAST;

// Multiplicity: [*], [1], [0..*]
export interface MultiplicityAST extends ASTNode {
    type: 'Multiplicity';
    lower: number;
    upper: number; // -1 = unbounded (*)
}

// Attribute mapping: targetAttr := expr  (new syntax)
//   or: sourceAttr -> targetAttr [: conversion]  (legacy syntax)
export interface AttributeMappingAST extends ASTNode {
    type: 'AttributeMapping';
    targetAttribute: string;
    // New := syntax fields
    expression?: ExpressionAST;      // targetAttr := expr
    valueMapping?: ValueMappingAST[]; // targetAttr := sourceExpr : true=1, false=0
    // Legacy -> syntax fields (kept for backward compatibility)
    sourceAttribute?: string;        // undefined for creation (-> attr)
    conversion?: ConversionAST;
    objectCreation?: ObjectCreationAST;
}

// Conversion: true=1, false=0 OR expression
export interface ConversionAST extends ASTNode {
    type: 'Conversion';
    mappings?: ValueMappingAST[];    // true=1, false=0
    expression?: ExpressionAST;      // source.name + "_copy"
}

// Value mapping: true=1
export interface ValueMappingAST extends ASTNode {
    type: 'ValueMapping';
    sourceValue: LiteralAST;
    targetValue: LiteralAST;
}

// Object creation: -> Arc { place -> source.map() }
export interface ObjectCreationAST extends ASTNode {
    type: 'ObjectCreation';
    targetClass: string;
    body: MappingBodyItemAST[];
}

// ForAll mapping: forall x in collection such that predicate -> Type { ... }
export interface ForAllMappingAST extends ASTNode {
    type: 'ForAllMapping';
    variable: string;
    collection: ExpressionAST;
    filter?: ExpressionAST;
    objectCreation: ObjectCreationAST;
}

// Helper: helper formatName(s: String) -> String { ... }
export interface HelperAST extends ASTNode {
    type: 'Helper';
    name: string;
    parameters: ParameterAST[];
    returnType: string;
    body: ExpressionAST;
}

// Parameter: name: String
export interface ParameterAST extends ASTNode {
    type: 'Parameter';
    name: string;
    paramType: string;
}

// Expressions
// JjTL expressions include both JjTL-specific nodes and JjEL expression nodes
export type ExpressionAST =
    // JjTL-specific (kept for backwards compatibility)
    | LiteralAST
    | IdentifierAST
    | MemberAccessAST
    | NullSafeMemberAccessAST
    | FunctionCallAST
    | NullSafeFunctionCallAST
    | BinaryExpressionAST
    | UnaryExpressionAST
    | ConditionalExpressionAST
    | NullCoalesceExpressionAST
    | IsTypeExpressionAST
    | LambdaExpressionAST
    | PromptExpressionAST
    | InputExpressionAST
    | ConfirmExpressionAST
    | ArrayLiteralAST
    // JjEL expression wrapper (for direct JjEL integration)
    | JjelExpressionWrapperAST;

// Literal: "hello", 42, true, null
export interface LiteralAST extends ASTNode {
    type: 'Literal';
    value: string | number | boolean | null;
    literalType: 'string' | 'number' | 'boolean' | 'null';
}

// Identifier: name, source
export interface IdentifierAST extends ASTNode {
    type: 'Identifier';
    name: string;
}

// Member access: source.name, source.owner.department
export interface MemberAccessAST extends ASTNode {
    type: 'MemberAccess';
    object: ExpressionAST;
    property: string;
}

// Null-safe member access: source?.name
export interface NullSafeMemberAccessAST extends ASTNode {
    type: 'NullSafeMemberAccess';
    object: ExpressionAST;
    property: string;
}

// Function call: source.map(), calculateAge(birthDate)
export interface FunctionCallAST extends ASTNode {
    type: 'FunctionCall';
    callee: ExpressionAST;
    arguments: ExpressionAST[];
}

// Null-safe function call: source?.map()
export interface NullSafeFunctionCallAST extends ASTNode {
    type: 'NullSafeFunctionCall';
    callee: ExpressionAST;
    arguments: ExpressionAST[];
}

// Binary expression: a + b, x == y, a and b
export interface BinaryExpressionAST extends ASTNode {
    type: 'BinaryExpression';
    operator: string;  // +, -, *, /, %, ==, !=, <, >, <=, >=, and, or
    left: ExpressionAST;
    right: ExpressionAST;
}

// Unary expression: not x, -value
export interface UnaryExpressionAST extends ASTNode {
    type: 'UnaryExpression';
    operator: 'not' | '-';
    operand: ExpressionAST;
}

// Conditional: if x then y else z
export interface ConditionalExpressionAST extends ASTNode {
    type: 'ConditionalExpression';
    condition: ExpressionAST;
    thenBranch: ExpressionAST;
    elseBranch: ExpressionAST | null;  // null for "if x then y" without else
}

// Null coalesce: a ?? b
export interface NullCoalesceExpressionAST extends ASTNode {
    type: 'NullCoalesceExpression';
    left: ExpressionAST;
    right: ExpressionAST;
}

// Type check: x is Class
export interface IsTypeExpressionAST extends ASTNode {
    type: 'IsTypeExpression';
    expression: ExpressionAST;
    targetType: string;
}

// Lambda: x: x.name or (a, b): a + b
export interface LambdaExpressionAST extends ASTNode {
    type: 'LambdaExpression';
    params: string[];
    body: ExpressionAST;
}

// Wrapper for direct JjEL AST integration
export interface JjelExpressionWrapperAST extends ASTNode {
    type: 'JjelExpression';
    expression: JjelExpression;
}

// ============================================
// INTERACTIVE STATEMENTS & EXPRESSIONS
// ============================================

export type AlertType = 'info' | 'warning' | 'error' | 'success';
export type InputType = 'string' | 'number' | 'boolean' | 'date' | 'select';

/**
 * Alert statement - blocking modal dialog
 * alert("message", "type")
 */
export interface AlertStatementAST extends ASTNode {
    type: 'AlertStatement';
    message: ExpressionAST;
    alertType: AlertType;
}

/**
 * Notify statement - non-blocking toast notification
 * notify("message", duration)
 */
export interface NotifyStatementAST extends ASTNode {
    type: 'NotifyStatement';
    message: ExpressionAST;
    duration: number; // ms, default 3000
}

/**
 * Prompt expression - asks user for typed input
 * prompt("message", EString, "default")
 */
export interface PromptExpressionAST extends ASTNode {
    type: 'PromptExpression';
    message: ExpressionAST;
    typeRef: string;            // 'EString' | 'EInt' | 'EFloat' | 'EBoolean' | 'EDate' | any IDENTIFIER
    defaultValue?: ExpressionAST;
}

/**
 * Input expression - asks user for typed input
 * input("message", "type", default)
 */
export interface InputExpressionAST extends ASTNode {
    type: 'InputExpression';
    message: ExpressionAST;
    inputType: InputType;
    defaultValue?: ExpressionAST;
    options?: ExpressionAST[]; // For 'select' type
}

/**
 * Confirm expression - blocking Yes/No dialog returning boolean
 * confirm("message")
 */
export interface ConfirmExpressionAST extends ASTNode {
    type: 'ConfirmExpression';
    message: ExpressionAST;
}

/**
 * Array literal for select options
 * ["option1", "option2", "option3"]
 */
export interface ArrayLiteralAST extends ASTNode {
    type: 'ArrayLiteral';
    elements: ExpressionAST[];
}

// Parser result
export interface ParserError {
    message: string;
    line: number;
    column: number;
}

export interface ParserResult {
    ast: TransformationAST | null;
    errors: ParserError[];
}
