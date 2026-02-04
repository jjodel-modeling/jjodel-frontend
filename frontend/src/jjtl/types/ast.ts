/**
 * JjTL Abstract Syntax Tree Types
 */

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

// Class mapping: State -> Place { ... }
export interface ClassMappingAST extends ASTNode {
    type: 'ClassMapping';
    sourceClass: string;
    targetClass: string;
    targetMultiplicity?: MultiplicityAST;
    condition?: ExpressionAST;
    body: AttributeMappingAST[];
}

// Multiplicity: [*], [1], [0..*]
export interface MultiplicityAST extends ASTNode {
    type: 'Multiplicity';
    lower: number;
    upper: number; // -1 = unbounded (*)
}

// Attribute mapping: name -> label : expression
export interface AttributeMappingAST extends ASTNode {
    type: 'AttributeMapping';
    sourceAttribute?: string;        // undefined for creation (-> attr)
    targetAttribute: string;
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
    body: AttributeMappingAST[];
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
export type ExpressionAST =
    | LiteralAST
    | IdentifierAST
    | MemberAccessAST
    | FunctionCallAST
    | BinaryExpressionAST
    | ConditionalExpressionAST;

// Literal: "hello", 42, true
export interface LiteralAST extends ASTNode {
    type: 'Literal';
    value: string | number | boolean;
    literalType: 'string' | 'number' | 'boolean';
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

// Function call: source.map(), calculateAge(birthDate)
export interface FunctionCallAST extends ASTNode {
    type: 'FunctionCall';
    callee: ExpressionAST;
    arguments: ExpressionAST[];
}

// Binary expression: a + b, x == y
export interface BinaryExpressionAST extends ASTNode {
    type: 'BinaryExpression';
    operator: string;
    left: ExpressionAST;
    right: ExpressionAST;
}

// Conditional: if x then y else z
export interface ConditionalExpressionAST extends ASTNode {
    type: 'ConditionalExpression';
    condition: ExpressionAST;
    thenBranch: ExpressionAST;
    elseBranch: ExpressionAST;
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
