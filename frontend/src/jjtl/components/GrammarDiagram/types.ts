/**
 * Grammar Diagram Types
 * Type definitions for JjTL grammar rules and diagram rendering
 */

export type GrammarRule =
    | 'transformation'
    | 'classMapping'
    | 'multiplicity'
    | 'condition'
    | 'mappingBody'
    | 'attributeMapping'
    | 'conversion'
    | 'valueMapping'
    | 'objectCreation'
    | 'helper'
    | 'parameter'
    | 'expression'
    | 'memberAccess'
    | 'literal'
    // Interactive statements & expressions
    | 'interactiveStatement'
    | 'alertStatement'
    | 'notifyStatement'
    | 'promptExpression'
    | 'inputExpression'
    | 'alertType'
    | 'inputType';

export interface GrammarRuleInfo {
    id: GrammarRule;
    name: string;
    description: string;
    ebnf: string;
    example?: string;
}

export const GRAMMAR_RULES: GrammarRuleInfo[] = [
    {
        id: 'transformation',
        name: 'Transformation',
        description: 'Root element that defines a model-to-model transformation',
        ebnf: 'transformation = "transformation" ID "from" ID "to" ID (classMapping | helper)*',
        example: `transformation StateMachine2PetriNet
from StateMachineMM
to   PetriNetMM`,
    },
    {
        id: 'classMapping',
        name: 'Class Mapping',
        description: 'Maps a source class to a target class',
        ebnf: 'classMapping = (ID alias?)+ "->" ID multiplicity? condition? mappingBody?',
        example: `State -> Place {
    label := name
}`,
    },
    {
        id: 'multiplicity',
        name: 'Multiplicity',
        description: 'Specifies how many target elements to create',
        ebnf: 'multiplicity = "[" ("*" | NUMBER | NUMBER ".." (NUMBER | "*")) "]"',
        example: `Transition -> Arc [*] { ... }`,
    },
    {
        id: 'condition',
        name: 'Condition',
        description: 'Guards when a mapping should be applied',
        ebnf: 'condition = "where" expression',
        example: `State -> Place where not isAbstract { ... }`,
    },
    {
        id: 'mappingBody',
        name: 'Mapping Body',
        description: 'Contains attribute mappings for a class mapping',
        ebnf: 'mappingBody = "{" attributeMapping* "}"',
        example: `{
    label := name
    tokens := isInitial : true=1, false=0
}`,
    },
    {
        id: 'attributeMapping',
        name: 'Attribute Mapping',
        description: 'Assigns a value to a target attribute',
        ebnf: 'attributeMapping = ID ":=" expression conversion? | "->" ID objectCreation?',
        example: `label := name
tokens := isInitial : true=1, false=0
fullName := name + " " + surname`,
    },
    {
        id: 'conversion',
        name: 'Conversion',
        description: 'Value lookup table for attribute mapping',
        ebnf: 'conversion = ":" valueMappings',
        example: `status := isActive : true="ON", false="OFF"`,
    },
    {
        id: 'valueMapping',
        name: 'Value Mapping',
        description: 'Maps specific values to other values',
        ebnf: 'valueMapping = literal "=" literal ("," literal "=" literal)*',
        example: `true=1, false=0`,
    },
    {
        id: 'objectCreation',
        name: 'Object Creation',
        description: 'Creates nested target objects',
        ebnf: 'objectCreation = "{" "->" ID "{" attributeMapping* "}" "}"',
        example: `-> metadata {
    -> Info {
        content := value
    }
}`,
    },
    {
        id: 'helper',
        name: 'Helper Function',
        description: 'Reusable function for transformations',
        ebnf: 'helper = "helper" ID "(" paramList? ")" "->" ID "{" expression "}"',
        example: `helper formatName(s: String) -> String {
    s.toUpper()
}`,
    },
    {
        id: 'parameter',
        name: 'Parameter',
        description: 'Function parameter definition',
        ebnf: 'parameter = ID ":" TYPE ("," ID ":" TYPE)*',
        example: `name: String, count: Integer`,
    },
    {
        id: 'expression',
        name: 'Expression',
        description: 'Value expression with member access',
        ebnf: 'expression = primary ("." memberAccess)*',
        example: `source.map().name.toUpper()`,
    },
    {
        id: 'memberAccess',
        name: 'Member Access',
        description: 'Property or method access on an object',
        ebnf: 'memberAccess = ID ("(" argList? ")")?',
        example: `.name, .toUpper(), .map(x)`,
    },
    {
        id: 'literal',
        name: 'Literal',
        description: 'Literal values: strings, numbers, booleans',
        ebnf: 'literal = STRING | NUMBER | BOOLEAN',
        example: `"hello", 42, true`,
    },

    // ================================================
    // INTERACTIVE STATEMENTS & EXPRESSIONS
    // ================================================
    {
        id: 'interactiveStatement',
        name: 'Interactive Statement',
        description: 'UI interactions during transformation (alert, notify)',
        ebnf: 'interactiveStatement = alertStatement | notifyStatement',
        example: `alert("Processing...")
notify("Done!", 3000)`,
    },
    {
        id: 'alertStatement',
        name: 'Alert Statement',
        description: 'Shows a blocking modal dialog',
        ebnf: '"alert" "(" expression ("," alertType)? ")"',
        example: `alert("Warning: " + name, "warning")`,
    },
    {
        id: 'notifyStatement',
        name: 'Notify Statement',
        description: 'Shows a non-blocking toast notification',
        ebnf: '"notify" "(" expression ("," NUMBER)? ")"',
        example: `notify("Saved!", 2000)`,
    },
    {
        id: 'promptExpression',
        name: 'Prompt Expression',
        description: 'Asks user for text input, returns String',
        ebnf: '"prompt" "(" expression ("," expression)? ")"',
        example: `prefix := prompt("Table prefix:", "tbl_")`,
    },
    {
        id: 'inputExpression',
        name: 'Input Expression',
        description: 'Asks user for typed input (number, boolean, date, select)',
        ebnf: '"input" "(" expression "," inputType ("," defaultValue)? ")"',
        example: `count := input("How many?", "number", 10)`,
    },
    {
        id: 'alertType',
        name: 'Alert Type',
        description: 'Visual style of alert dialog',
        ebnf: '"info" | "warning" | "error" | "success"',
        example: `"warning", "error"`,
    },
    {
        id: 'inputType',
        name: 'Input Type',
        description: 'Type of user input',
        ebnf: '"string" | "number" | "boolean" | "date" | "select"',
        example: `"number", "boolean", "select"`,
    },
];
