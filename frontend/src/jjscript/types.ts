/**
 * JjScript Type Definitions
 * Complete type system for the JjScript scripting language
 */

// ============================================
// TOKEN TYPES
// ============================================

export type TokenType =
    | 'COMMAND'        // create, delete, rename, set, add, remove, move, copy, list, show, help, undo, redo
    | 'KEYWORD'        // class, attribute, reference, operation, package, enum, literal, parameter, to, from, in, as, with
    | 'IDENTIFIER'     // Names: MyClass, myAttribute, etc.
    | 'QUALIFIED_NAME' // Qualified: Package::Class, Package::Class.attribute
    | 'STRING'         // "quoted string" or 'single quoted'
    | 'NUMBER'         // 42, 3.14, -5
    | 'BOOLEAN'        // true, false
    | 'MULTIPLICITY'   // [0..1], [1..*], [*], [0..5]
    | 'OPERATOR'       // =, +=, -=, ::, .
    | 'PUNCTUATION'    // (, ), [, ], {, }, ,, ;
    | 'ARROW'          // ->, <->
    | 'COMMENT'        // // comment or /* block */
    | 'WHITESPACE'     // spaces, tabs
    | 'NEWLINE'        // line breaks
    | 'EOF'            // end of input
    | 'UNKNOWN';       // unrecognized

export interface Token {
    type: TokenType;
    value: string;
    position: number;
    line: number;
    column: number;
}

// ============================================
// COMMAND TYPES
// ============================================

export type CommandType =
    | 'create'
    | 'delete'
    | 'rename'
    | 'set'
    | 'add'
    | 'remove'
    | 'move'
    | 'copy'
    | 'list'
    | 'show'
    | 'help'
    | 'undo'
    | 'redo'
    | 'clear'
    | 'export'
    | 'import'
    | 'validate';

export type ElementType =
    | 'class'
    | 'abstract class'
    | 'interface'
    | 'attribute'
    | 'reference'
    | 'containment'    // Shorthand for reference with containment=true
    | 'composition'    // Alias for containment
    | 'operation'
    | 'parameter'
    | 'package'
    | 'enum'
    | 'enumeration'
    | 'literal'
    | 'model'
    | 'metamodel'
    | 'project'
    | 'annotation';

// ============================================
// AST NODE TYPES
// ============================================

export interface ASTNode {
    type: string;
    position: { line: number; column: number };
}

// Base command node
export interface CommandNode extends ASTNode {
    type: 'Command';
    command: CommandType;
    args: CommandArgs;
}

// ============================================
// COMMAND ARGUMENTS
// ============================================

export type CommandArgs =
    | CreateArgs
    | DeleteArgs
    | RenameArgs
    | SetArgs
    | AddArgs
    | RemoveArgs
    | MoveArgs
    | CopyArgs
    | ListArgs
    | ShowArgs
    | HelpArgs
    | UndoRedoArgs
    | ClearArgs
    | ValidateArgs;

// CREATE command
export interface CreateArgs {
    command: 'create';
    elementType: ElementType;
    name: string;
    parent?: QualifiedName;
    options?: CreateOptions;
}

export interface CreateOptions {
    // Class options
    abstract?: boolean;
    interface?: boolean;
    superClass?: QualifiedName;
    superClasses?: QualifiedName[];

    // Attribute options
    type?: TypeReference;
    multiplicity?: Multiplicity;
    defaultValue?: LiteralValue;
    derived?: boolean;
    readonly?: boolean;
    transient?: boolean;
    volatile?: boolean;
    unsettable?: boolean;
    id?: boolean;

    // Reference options
    opposite?: QualifiedName;
    containment?: boolean;
    container?: boolean;
    resolveProxies?: boolean;

    // Operation options
    returnType?: TypeReference;
    parameters?: ParameterDef[];
    exceptions?: QualifiedName[];

    // Enum literal options
    value?: number;

    // Package options
    nsUri?: string;
    nsPrefix?: string;
}

// DELETE command
export interface DeleteArgs {
    command: 'delete';
    target: QualifiedName;
    cascade?: boolean;
    force?: boolean;
}

// RENAME command
export interface RenameArgs {
    command: 'rename';
    target: QualifiedName;
    newName: string;
}

// SET command
export interface SetArgs {
    command: 'set';
    target: QualifiedName;
    property: string;
    value: LiteralValue | QualifiedName;
    operator?: '=' | '+=' | '-=';
}

// ADD command (add to collection)
export interface AddArgs {
    command: 'add';
    elementType: ElementType;
    name: string;
    to: QualifiedName;
    options?: CreateOptions;
}

// REMOVE command (remove from collection)
export interface RemoveArgs {
    command: 'remove';
    target: QualifiedName;
    from: QualifiedName;
}

// MOVE command
export interface MoveArgs {
    command: 'move';
    target: QualifiedName;
    to: QualifiedName;
}

// COPY command
export interface CopyArgs {
    command: 'copy';
    target: QualifiedName;
    to: QualifiedName;
    newName?: string;
    deep?: boolean;
}

// LIST command
export interface ListArgs {
    command: 'list';
    elementType?: ElementType | 'all';
    filter?: {
        in?: QualifiedName;
        type?: ElementType;
        name?: string;
        pattern?: string;
    };
}

// SHOW command
export interface ShowArgs {
    command: 'show';
    target: QualifiedName | 'project' | 'model';
    detail?: 'brief' | 'full' | 'tree';
}

// HELP command
export interface HelpArgs {
    command: 'help';
    topic?: CommandType | ElementType | 'syntax' | 'examples';
}

// UNDO/REDO command
export interface UndoRedoArgs {
    command: 'undo' | 'redo';
    steps?: number;
}

// CLEAR command
export interface ClearArgs {
    command: 'clear';
    target?: 'history' | 'selection' | 'console';
}

// VALIDATE command
export interface ValidateArgs {
    command: 'validate';
    target?: QualifiedName | 'all';
    rules?: string[];
}

// ============================================
// QUALIFIED NAMES
// ============================================

export interface QualifiedName {
    segments: string[];           // ['Package', 'SubPackage', 'Class']
    member?: string;              // Optional member access: 'attributeName'
    raw: string;                  // Original string: 'Package::SubPackage::Class.attributeName'
}

// ============================================
// TYPE REFERENCES
// ============================================

export type TypeReference =
    | PrimitiveTypeRef
    | ClassTypeRef
    | EnumTypeRef
    | CollectionTypeRef;

export interface PrimitiveTypeRef {
    kind: 'primitive';
    type: PrimitiveTypeName;
}

export type PrimitiveTypeName =
    | 'String' | 'string'
    | 'Integer' | 'int' | 'Int'
    | 'Boolean' | 'bool' | 'Bool'
    | 'Float' | 'float' | 'Double' | 'double'
    | 'Date' | 'date'
    | 'Object' | 'Any' | 'any'
    | 'Void' | 'void';

export interface ClassTypeRef {
    kind: 'class';
    name: QualifiedName;
}

export interface EnumTypeRef {
    kind: 'enum';
    name: QualifiedName;
}

export interface CollectionTypeRef {
    kind: 'collection';
    elementType: TypeReference;
    ordered?: boolean;
    unique?: boolean;
}

// ============================================
// MULTIPLICITY
// ============================================

export interface Multiplicity {
    lower: number;           // 0, 1, etc.
    upper: number | '*';     // 1, *, -1 for unbounded
    raw: string;             // Original: '[0..*]', '[1]', etc.
}

// Common multiplicities
export const MULTIPLICITY = {
    ZERO_ONE: { lower: 0, upper: 1, raw: '[0..1]' } as Multiplicity,
    ONE: { lower: 1, upper: 1, raw: '[1]' } as Multiplicity,
    ZERO_MANY: { lower: 0, upper: '*', raw: '[0..*]' } as Multiplicity,
    ONE_MANY: { lower: 1, upper: '*', raw: '[1..*]' } as Multiplicity,
    MANY: { lower: 0, upper: '*', raw: '[*]' } as Multiplicity,
};

// ============================================
// LITERAL VALUES
// ============================================

export type LiteralValue =
    | StringLiteral
    | NumberLiteral
    | BooleanLiteral
    | NullLiteral
    | ArrayLiteral
    | EnumLiteralRef;

export interface StringLiteral {
    kind: 'string';
    value: string;
}

export interface NumberLiteral {
    kind: 'number';
    value: number;
}

export interface BooleanLiteral {
    kind: 'boolean';
    value: boolean;
}

export interface NullLiteral {
    kind: 'null';
}

export interface ArrayLiteral {
    kind: 'array';
    values: LiteralValue[];
}

export interface EnumLiteralRef {
    kind: 'enumLiteral';
    enum: QualifiedName;
    literal: string;
}

// ============================================
// PARAMETER DEFINITION
// ============================================

export interface ParameterDef {
    name: string;
    type: TypeReference;
    multiplicity?: Multiplicity;
    direction?: 'in' | 'out' | 'inout';
}

// ============================================
// EXECUTION RESULT
// ============================================

export interface ExecutionResult {
    success: boolean;
    command: CommandType;
    message: string;
    data?: any;
    errors?: ExecutionError[];
    warnings?: string[];
    affectedElements?: string[];
    undoable?: boolean;
}

export interface ExecutionError {
    code: string;
    message: string;
    position?: { line: number; column: number };
    suggestion?: string;
}

// ============================================
// PARSER RESULT
// ============================================

export interface ParseResult {
    success: boolean;
    ast?: CommandNode;
    errors?: ParseError[];
    tokens?: Token[];
}

export interface ParseError {
    message: string;
    position: { line: number; column: number };
    expected?: string[];
    found?: string;
}

// ============================================
// EXECUTION CONTEXT
// ============================================

export interface ExecutionContext {
    projectId: string;
    modelId?: string;
    selectedElement?: string;
    history: CommandHistoryEntry[];
    variables: Map<string, any>;
}

export interface CommandHistoryEntry {
    command: string;
    timestamp: number;
    result: ExecutionResult;
    undoAction?: () => void;
}

// ============================================
// AUTOCOMPLETE
// ============================================

export interface AutocompleteContext {
    input: string;
    cursorPosition: number;
    context: ExecutionContext;
}

export interface AutocompleteSuggestion {
    text: string;
    displayText: string;
    type: 'command' | 'keyword' | 'element' | 'type' | 'property' | 'value';
    description?: string;
    insertText?: string;
    cursorOffset?: number;
}

// ============================================
// TYPE ALIASES (for convenience)
// ============================================

export const TYPE_ALIASES: Record<string, PrimitiveTypeName> = {
    'str': 'String',
    'string': 'String',
    'String': 'String',
    'int': 'Integer',
    'Int': 'Integer',
    'integer': 'Integer',
    'Integer': 'Integer',
    'bool': 'Boolean',
    'Bool': 'Boolean',
    'boolean': 'Boolean',
    'Boolean': 'Boolean',
    'float': 'Float',
    'Float': 'Float',
    'double': 'Double',
    'Double': 'Double',
    'date': 'Date',
    'Date': 'Date',
    'any': 'Object',
    'Any': 'Object',
    'object': 'Object',
    'Object': 'Object',
    'void': 'Void',
    'Void': 'Void',
};

// ============================================
// COMMAND KEYWORDS
// ============================================

export const COMMANDS: CommandType[] = [
    'create', 'delete', 'rename', 'set', 'add', 'remove',
    'move', 'copy', 'list', 'show', 'help', 'undo', 'redo',
    'clear', 'export', 'import', 'validate'
];

export const ELEMENT_TYPES: ElementType[] = [
    'class', 'abstract class', 'interface', 'attribute', 'reference',
    'containment', 'composition',  // Shortcuts for "reference ... containment"
    'operation', 'parameter', 'package', 'enum', 'enumeration',
    'literal', 'model', 'metamodel', 'project', 'annotation'
];

export const KEYWORDS = [
    'to', 'from', 'in', 'as', 'with', 'type', 'extends', 'implements',
    'abstract', 'readonly', 'derived', 'transient', 'volatile',
    'containment', 'opposite', 'default', 'ordered', 'unique',
    'cascade', 'force', 'deep', 'brief', 'full', 'tree'
];
