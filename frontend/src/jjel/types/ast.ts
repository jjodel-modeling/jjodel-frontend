/**
 * JjEL Abstract Syntax Tree Types
 * Jjodel Expression Language - AST Definitions
 */

// ============================================
// BASE NODE
// ============================================

export interface ASTLocation {
    start: { line: number; column: number; offset?: number };
    end: { line: number; column: number; offset?: number };
}

export interface JjelASTNode {
    type: string;
    location?: ASTLocation;
}

// ============================================
// EXPRESSION UNION TYPE
// ============================================

export type JjelExpression =
    | LiteralExpr
    | IdentifierExpr
    | BinaryExpr
    | UnaryExpr
    | MemberAccessExpr
    | NullSafeMemberAccessExpr
    | MethodCallExpr
    | NullSafeMethodCallExpr
    | IfThenElseExpr
    | NullCoalesceExpr
    | IsTypeExpr
    | LambdaExpr
    | ArrayLiteralExpr
    | InterpolatedStringExpr;

// ============================================
// LITERALS
// ============================================

/**
 * Literal values: strings, numbers, booleans, null
 * Examples: "hello", 42, 3.14, true, false, null
 */
export interface LiteralExpr extends JjelASTNode {
    type: 'Literal';
    value: string | number | boolean | null;
    dataType: 'EString' | 'EInt' | 'EDouble' | 'EBoolean' | 'null';
}

// ============================================
// IDENTIFIERS
// ============================================

/**
 * Variable or property reference
 * Examples: name, isAbstract, _privateField, element1
 */
export interface IdentifierExpr extends JjelASTNode {
    type: 'Identifier';
    name: string;
}

// ============================================
// OPERATORS
// ============================================

/**
 * Binary operators
 */
export type BinaryOperator =
    // Arithmetic
    | '+' | '-' | '*' | '/' | '%'
    // Comparison
    | '==' | '!=' | '<' | '>' | '<=' | '>='
    // Logical (word-based)
    | 'and' | 'or';

/**
 * Binary expression: a + b, x == y, a and b
 */
export interface BinaryExpr extends JjelASTNode {
    type: 'Binary';
    operator: BinaryOperator;
    left: JjelExpression;
    right: JjelExpression;
}

/**
 * Unary operators
 */
export type UnaryOperator = 'not' | '-';

/**
 * Unary expression: not x, -value
 */
export interface UnaryExpr extends JjelASTNode {
    type: 'Unary';
    operator: UnaryOperator;
    operand: JjelExpression;
}

// ============================================
// MEMBER ACCESS
// ============================================

/**
 * Property access: object.property
 * Examples: element.name, class.attributes
 */
export interface MemberAccessExpr extends JjelASTNode {
    type: 'MemberAccess';
    object: JjelExpression;
    property: string;
}

/**
 * Null-safe property access: object?.property
 * Returns null if object is null instead of throwing
 * Examples: parent?.name, element?.container?.name
 */
export interface NullSafeMemberAccessExpr extends JjelASTNode {
    type: 'NullSafeMemberAccess';
    object: JjelExpression;
    property: string;
}

// ============================================
// METHOD CALLS
// ============================================

/**
 * Method call: object.method(args)
 * Examples: name.toUpper(), list.filter(x: x.isPublic)
 */
export interface MethodCallExpr extends JjelASTNode {
    type: 'MethodCall';
    object: JjelExpression;
    method: string;
    args: JjelExpression[];
}

/**
 * Null-safe method call: object?.method(args)
 * Returns null if object is null
 * Examples: name?.toUpper(), parent?.getChildren()
 */
export interface NullSafeMethodCallExpr extends JjelASTNode {
    type: 'NullSafeMethodCall';
    object: JjelExpression;
    method: string;
    args: JjelExpression[];
}

// ============================================
// CONDITIONALS
// ============================================

/**
 * Conditional expression: if condition then a else b
 * Note: Uses keywords, NOT ternary operator
 * Examples: if isAbstract then "abstract" else "concrete"
 */
export interface IfThenElseExpr extends JjelASTNode {
    type: 'IfThenElse';
    condition: JjelExpression;
    thenBranch: JjelExpression;
    elseBranch: JjelExpression | null; // null for "if then" without "else"
}

/**
 * Null coalesce: a ?? b
 * Returns b if a is null
 * Examples: name ?? "unnamed", parent?.name ?? "no parent"
 */
export interface NullCoalesceExpr extends JjelASTNode {
    type: 'NullCoalesce';
    left: JjelExpression;
    right: JjelExpression;
}

// ============================================
// TYPE CHECKING
// ============================================

/**
 * Type check: expression is Type
 * Examples: element is Class, node is Package
 */
export interface IsTypeExpr extends JjelASTNode {
    type: 'IsType';
    expression: JjelExpression;
    targetType: string;
}

// ============================================
// LAMBDA
// ============================================

/**
 * Lambda expression: params: body
 * Note: Uses COLON, not arrow
 * Single param: x: x.name
 * Multiple params: (a, b): a + b
 */
export interface LambdaExpr extends JjelASTNode {
    type: 'Lambda';
    params: string[];
    body: JjelExpression;
}

// ============================================
// COLLECTIONS
// ============================================

/**
 * Array literal: [elem1, elem2, ...]
 * Examples: [], [1, 2, 3], ["a", "b", "c"]
 */
export interface ArrayLiteralExpr extends JjelASTNode {
    type: 'ArrayLiteral';
    elements: JjelExpression[];
}

// ============================================
// STRING INTERPOLATION
// ============================================

/**
 * Interpolated string: "Hello ${name}!"
 * Parts alternate between string text and expressions
 */
export interface InterpolatedStringExpr extends JjelASTNode {
    type: 'InterpolatedString';
    parts: InterpolatedStringPart[];
}

export type InterpolatedStringPart =
    | { kind: 'text'; value: string }
    | { kind: 'expression'; expr: JjelExpression };

// ============================================
// PARSER TYPES
// ============================================

export interface JjelParserError {
    message: string;
    line: number;
    column: number;
}

export interface JjelParserResult {
    expression: JjelExpression | null;
    errors: JjelParserError[];
}
