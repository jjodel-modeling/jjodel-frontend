/**
 * JjScript Autocomplete Types
 * Type definitions for the autocomplete engine
 */

// ============================================
// SUGGESTION TYPES
// ============================================

export type SuggestionType =
    | 'command'      // /create, /delete, etc.
    | 'keyword'      // class, enum, with, as, etc.
    | 'class'        // Class names from metamodel
    | 'attribute'    // Attribute names
    | 'reference'    // Reference names
    | 'type'         // Primitive types (String, Integer, etc.)
    | 'enum'         // Enum names
    | 'literal'      // Enum literal values
    | 'package'      // Package names
    | 'property'     // Property names for set command
    | 'value'        // Property values
    | 'snippet';     // Full command templates

export interface Suggestion {
    /** What to insert */
    text: string;
    /** What to show in dropdown */
    displayText: string;
    /** Category for styling */
    type: SuggestionType;
    /** Optional description */
    description?: string;
    /** Template with placeholders for snippets */
    snippet?: string;
    /** Ranking priority (higher = better) */
    priority: number;
    /** Optional icon class */
    icon?: string;
    /** Additional metadata */
    metadata?: Record<string, any>;
}

// ============================================
// CONTEXT TYPES
// ============================================

export type ParseContext =
    | 'start'           // Beginning of input
    | 'command'         // After typing a command
    | 'element_type'    // Expecting element type (class, attribute, etc.)
    | 'name'            // Expecting element name
    | 'target'          // Expecting target reference
    | 'type'            // Expecting type specification
    | 'multiplicity'    // Expecting [0..1] style
    | 'default'         // Expecting default value
    | 'keyword'         // Expecting keyword (in, to, from, etc.)
    | 'property'        // Expecting property name
    | 'value';          // Expecting property value

export interface AutocompleteContext {
    /** The full input string */
    input: string;
    /** Cursor position in input */
    cursorPosition: number;
    /** Current word being typed */
    currentWord: string;
    /** Start position of current word */
    wordStart: number;
    /** Detected parse context */
    parseContext: ParseContext;
    /** Command being typed (if any) */
    command?: string;
    /** Element type being worked with */
    elementType?: string;
    /** Target element name (if specified) */
    targetName?: string;
    /** Parent element (for 'in' clause) */
    parentName?: string;
    /** Tokens parsed so far */
    tokens: PartialToken[];
}

export interface PartialToken {
    type: string;
    value: string;
    start: number;
    end: number;
}

// ============================================
// PROVIDER TYPES
// ============================================

export interface SuggestionProvider {
    /** Provider name for debugging */
    name: string;
    /** Get suggestions for the given context */
    getSuggestions(context: AutocompleteContext, metamodel?: MetamodelContext): Suggestion[];
    /** Provider priority (higher = runs first) */
    priority: number;
}

// ============================================
// METAMODEL CONTEXT
// ============================================

export interface MetamodelContext {
    /** Available classes */
    classes: ClassInfo[];
    /** Available enums */
    enums: EnumInfo[];
    /** Available packages */
    packages: PackageInfo[];
    /** Current active metamodel name */
    activeMetamodel?: string;
    /** Current active package */
    activePackage?: string;
}

export interface ClassInfo {
    id: string;
    name: string;
    isAbstract: boolean;
    isInterface: boolean;
    attributes: AttributeInfo[];
    references: ReferenceInfo[];
    operations: OperationInfo[];
    package?: string;
    superTypes?: string[];
}

export interface AttributeInfo {
    id: string;
    name: string;
    type: string;
    multiplicity?: string;
    defaultValue?: string;
}

export interface ReferenceInfo {
    id: string;
    name: string;
    targetType: string;
    multiplicity?: string;
    containment?: boolean;
    opposite?: string;
}

export interface OperationInfo {
    id: string;
    name: string;
    returnType?: string;
    parameters?: ParameterInfo[];
}

export interface ParameterInfo {
    name: string;
    type: string;
}

export interface EnumInfo {
    id: string;
    name: string;
    literals: string[];
}

export interface PackageInfo {
    id: string;
    name: string;
    path: string;
}

// ============================================
// ENGINE OPTIONS
// ============================================

export interface AutocompleteOptions {
    /** Maximum number of suggestions to return */
    maxSuggestions?: number;
    /** Minimum characters before showing suggestions */
    minChars?: number;
    /** Include snippet suggestions */
    includeSnippets?: boolean;
    /** Case-insensitive matching */
    caseInsensitive?: boolean;
    /** Fuzzy matching threshold (0-1) */
    fuzzyThreshold?: number;
}

export const DEFAULT_OPTIONS: AutocompleteOptions = {
    maxSuggestions: 10,
    minChars: 1,
    includeSnippets: true,
    caseInsensitive: true,
    fuzzyThreshold: 0.6,
};

// ============================================
// COMMAND DEFINITIONS
// ============================================

export interface CommandDef {
    name: string;
    description: string;
    syntax: string;
    examples: string[];
    nextContexts: ParseContext[];
}

export const COMMAND_DEFS: CommandDef[] = [
    {
        name: 'create',
        description: 'Create a new element',
        syntax: 'create <type> <name> [in <parent>] [options]',
        examples: ['create class Person', 'create attribute name in Person type String'],
        nextContexts: ['element_type'],
    },
    {
        name: 'delete',
        description: 'Delete an element',
        syntax: 'delete <target> [cascade] [force]',
        examples: ['delete Person', 'delete Person cascade'],
        nextContexts: ['target'],
    },
    {
        name: 'rename',
        description: 'Rename an element',
        syntax: 'rename <target> to <newname>',
        examples: ['rename Person to Human', 'rename Person.name to fullName'],
        nextContexts: ['target'],
    },
    {
        name: 'set',
        description: 'Set a property value',
        syntax: 'set <target>.<property> = <value>',
        examples: ['set Person.abstract = true', 'set Person.name type = String'],
        nextContexts: ['target'],
    },
    {
        name: 'add',
        description: 'Add element to container',
        syntax: 'add <type> <name> to <target> [options]',
        examples: ['add attribute email to Person type String'],
        nextContexts: ['element_type'],
    },
    {
        name: 'remove',
        description: 'Remove element from container',
        syntax: 'remove <target> from <parent>',
        examples: ['remove name from Person'],
        nextContexts: ['target'],
    },
    {
        name: 'move',
        description: 'Move element to new location',
        syntax: 'move <target> to <destination>',
        examples: ['move Person to NewPackage'],
        nextContexts: ['target'],
    },
    {
        name: 'copy',
        description: 'Copy an element',
        syntax: 'copy <target> to <destination> [as <name>] [deep]',
        examples: ['copy Person to OtherPackage as PersonCopy'],
        nextContexts: ['target'],
    },
    {
        name: 'list',
        description: 'List elements',
        syntax: 'list [type] [in <scope>]',
        examples: ['list', 'list class', 'list attribute in Person'],
        nextContexts: ['element_type', 'keyword'],
    },
    {
        name: 'show',
        description: 'Show element details',
        syntax: 'show <target> [brief|full|tree]',
        examples: ['show Person', 'show Person tree', 'show project'],
        nextContexts: ['target'],
    },
    {
        name: 'help',
        description: 'Show help',
        syntax: 'help [topic]',
        examples: ['help', 'help create', 'help syntax'],
        nextContexts: ['keyword'],
    },
    {
        name: 'undo',
        description: 'Undo last action',
        syntax: 'undo [n]',
        examples: ['undo', 'undo 3'],
        nextContexts: ['value'],
    },
    {
        name: 'redo',
        description: 'Redo undone action',
        syntax: 'redo [n]',
        examples: ['redo', 'redo 2'],
        nextContexts: ['value'],
    },
    {
        name: 'validate',
        description: 'Validate the model',
        syntax: 'validate [target|all]',
        examples: ['validate', 'validate all', 'validate Person'],
        nextContexts: ['target'],
    },
    {
        name: 'clear',
        description: 'Clear state',
        syntax: 'clear [history|console]',
        examples: ['clear history', 'clear console'],
        nextContexts: ['keyword'],
    },
];

// ============================================
// ELEMENT TYPE DEFINITIONS
// ============================================

export const ELEMENT_TYPE_DEFS = [
    { name: 'class', description: 'A class element', icon: 'bi-square-fill' },
    { name: 'abstract class', description: 'An abstract class', icon: 'bi-square' },
    { name: 'interface', description: 'An interface', icon: 'bi-diamond' },
    { name: 'attribute', description: 'A class attribute', icon: 'bi-dash' },
    { name: 'reference', description: 'A class reference', icon: 'bi-arrow-right' },
    { name: 'operation', description: 'A class operation', icon: 'bi-gear' },
    { name: 'parameter', description: 'An operation parameter', icon: 'bi-three-dots' },
    { name: 'package', description: 'A package', icon: 'bi-folder' },
    { name: 'enum', description: 'An enumeration', icon: 'bi-list-ol' },
    { name: 'literal', description: 'An enum literal', icon: 'bi-dot' },
];

// ============================================
// PRIMITIVE TYPES
// ============================================

export const PRIMITIVE_TYPES = [
    { name: 'String', aliases: ['string', 'str', 'EString'], description: 'Text value' },
    { name: 'Integer', aliases: ['int', 'Int', 'EInt'], description: 'Whole number' },
    { name: 'Boolean', aliases: ['bool', 'Bool', 'EBoolean'], description: 'True/false value' },
    { name: 'Float', aliases: ['float', 'EFloat'], description: 'Decimal number' },
    { name: 'Double', aliases: ['double', 'number', 'EDouble'], description: 'Double precision number' },
    { name: 'Date', aliases: ['date', 'EDate'], description: 'Date value' },
    { name: 'Object', aliases: ['any', 'Any'], description: 'Any object' },
];

// ============================================
// KEYWORDS
// ============================================

export const KEYWORDS = [
    { name: 'in', description: 'Specify parent container', contexts: ['name', 'target'] },
    { name: 'to', description: 'Specify destination', contexts: ['target', 'name'] },
    { name: 'from', description: 'Specify source', contexts: ['target'] },
    { name: 'as', description: 'Specify alias', contexts: ['target', 'name'] },
    { name: 'with', description: 'Specify options', contexts: ['name'] },
    { name: 'type', description: 'Specify type', contexts: ['name'] },
    { name: 'extends', description: 'Specify superclass', contexts: ['name'] },
    { name: 'default', description: 'Specify default value', contexts: ['type'] },
    { name: 'cascade', description: 'Delete children too', contexts: ['target'] },
    { name: 'force', description: 'Force operation', contexts: ['target'] },
    { name: 'deep', description: 'Deep copy', contexts: ['target'] },
    { name: 'brief', description: 'Brief output', contexts: ['target'] },
    { name: 'full', description: 'Full output', contexts: ['target'] },
    { name: 'tree', description: 'Tree output', contexts: ['target'] },
];

// ============================================
// PROPERTIES
// ============================================

export const CLASS_PROPERTIES = [
    { name: 'abstract', type: 'boolean', description: 'Make class abstract' },
    { name: 'interface', type: 'boolean', description: 'Make class an interface' },
    { name: 'superTypes', type: 'array', description: 'Parent classes' },
];

export const ATTRIBUTE_PROPERTIES = [
    { name: 'type', type: 'string', description: 'Attribute type' },
    { name: 'lowerBound', type: 'number', description: 'Minimum cardinality' },
    { name: 'upperBound', type: 'number', description: 'Maximum cardinality' },
    { name: 'derived', type: 'boolean', description: 'Computed value' },
    { name: 'changeable', type: 'boolean', description: 'Can be modified' },
    { name: 'defaultValueLiteral', type: 'string', description: 'Default value' },
];

export const REFERENCE_PROPERTIES = [
    { name: 'type', type: 'string', description: 'Target class' },
    { name: 'containment', type: 'boolean', description: 'Composition relationship' },
    { name: 'opposite', type: 'string', description: 'Bidirectional reference' },
    { name: 'lowerBound', type: 'number', description: 'Minimum cardinality' },
    { name: 'upperBound', type: 'number', description: 'Maximum cardinality' },
];
