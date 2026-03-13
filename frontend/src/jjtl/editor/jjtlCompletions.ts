/**
 * JjTL Autocompletion Provider for Monaco Editor
 */

import * as monaco from 'monaco-editor';
import { JJTL_LANGUAGE_ID } from './jjtlLanguage';

// Keywords with descriptions
const KEYWORDS = [
    { label: 'transformation', detail: 'Define a new transformation', insertText: 'transformation ${1:Name}\n\nfrom ${2:SourceMetamodel}\nto   ${3:TargetMetamodel}\n\n$0' },
    { label: 'from', detail: 'Source metamodel', insertText: 'from ${1:Metamodel}' },
    { label: 'to', detail: 'Target metamodel', insertText: 'to ${1:Metamodel}' },
    { label: 'where', detail: 'Conditional mapping guard', insertText: 'where ${1:condition}' },
    { label: 'helper', detail: 'Define a helper function', insertText: 'helper ${1:name}(${2:param}: ${3:Type}) -> ${4:ReturnType} {\n    $0\n}' },
];

// Built-in functions
const BUILTIN_FUNCTIONS = [
    { label: 'map', detail: 'Map source element to target', insertText: 'map()' },
    { label: 'mapAll', detail: 'Map all source elements', insertText: 'mapAll()' },
    { label: 'resolve', detail: 'Resolve a mapped element', insertText: 'resolve(${1:element})' },
    { label: 'select', detail: 'Select elements matching condition', insertText: 'select(${1:condition})' },
    { label: 'collect', detail: 'Collect elements into collection', insertText: 'collect(${1:expression})' },
    { label: 'first', detail: 'Get first element', insertText: 'first()' },
    { label: 'isEmpty', detail: 'Check if collection is empty', insertText: 'isEmpty()' },
    { label: 'size', detail: 'Get collection size', insertText: 'size()' },
    { label: 'concat', detail: 'Concatenate strings', insertText: 'concat(${1:str1}, ${2:str2})' },
    { label: 'toUpper', detail: 'Convert to uppercase', insertText: 'toUpper()' },
    { label: 'toLower', detail: 'Convert to lowercase', insertText: 'toLower()' },
];

// Interactive functions (statements and expressions)
const INTERACTIVE_FUNCTIONS = [
    // Statements (blocking dialogs, no return value used in mappings)
    {
        label: 'alert',
        detail: 'Show blocking alert dialog',
        documentation: 'Displays a modal alert dialog that blocks execution until dismissed.\nTypes: info, warning, error, success',
        insertText: 'alert("${1:message}"${2:, "${3|info,warning,error,success|}"})',
    },
    {
        label: 'alert-info',
        detail: 'Show info alert',
        documentation: 'Display an informational message to the user',
        insertText: 'alert("${1:message}", "info")',
    },
    {
        label: 'alert-warning',
        detail: 'Show warning alert',
        documentation: 'Display a warning message to the user',
        insertText: 'alert("${1:message}", "warning")',
    },
    {
        label: 'alert-error',
        detail: 'Show error alert',
        documentation: 'Display an error message to the user',
        insertText: 'alert("${1:message}", "error")',
    },
    {
        label: 'alert-success',
        detail: 'Show success alert',
        documentation: 'Display a success message to the user',
        insertText: 'alert("${1:message}", "success")',
    },
    {
        label: 'notify',
        detail: 'Show non-blocking toast notification',
        documentation: 'Displays a toast notification that auto-dismisses.\nDuration in milliseconds (default: 3000)',
        insertText: 'notify("${1:message}"${2:, ${3:3000}})',
    },
    // Expressions (return values, can be used in attribute mappings)
    {
        label: 'prompt',
        detail: 'Ask user for text input (returns String)',
        documentation: 'Displays a dialog asking for text input.\nReturns the user\'s input as a String.',
        insertText: 'prompt("${1:Enter value}"${2:, "${3:default}"})',
    },
    {
        label: 'input',
        detail: 'Ask user for typed input',
        documentation: 'Displays a dialog asking for typed input.\nTypes: string, number, boolean, date, select',
        insertText: 'input("${1:Enter value}", "${2|string,number,boolean,date,select|}"${3:, ${4:defaultValue}})',
    },
    {
        label: 'input-string',
        detail: 'Ask user for string input',
        documentation: 'Ask user for a string value',
        insertText: 'input("${1:Enter text}", "string"${2:, "${3:default}"})',
    },
    {
        label: 'input-number',
        detail: 'Ask user for number input',
        documentation: 'Ask user for a numeric value',
        insertText: 'input("${1:Enter number}", "number"${2:, ${3:0}})',
    },
    {
        label: 'input-boolean',
        detail: 'Ask user for yes/no choice',
        documentation: 'Ask user for a boolean (yes/no) value',
        insertText: 'input("${1:Confirm action?}", "boolean"${2:, ${3:false}})',
    },
    {
        label: 'input-date',
        detail: 'Ask user for date input',
        documentation: 'Ask user to select a date',
        insertText: 'input("${1:Select date}", "date")',
    },
    {
        label: 'input-select',
        detail: 'Ask user to select from options',
        documentation: 'Ask user to select from a list of options',
        insertText: 'input("${1:Choose option}", "select", ${2:null}, ["${3:Option 1}", "${4:Option 2}"])',
    },
];

// Snippets for common patterns
const SNIPPETS = [
    {
        label: 'class-mapping',
        detail: 'Class mapping with body',
        insertText: '${1:SourceClass} -> ${2:TargetClass} {\n    ${3:targetAttr} := ${4:sourceAttr}\n    $0\n}',
    },
    {
        label: 'class-mapping-multi',
        detail: 'Class mapping with multiplicity',
        insertText: '${1:SourceClass} -> ${2:TargetClass} [*] {\n    ${3:targetAttr} := ${4:sourceAttr}\n    $0\n}',
    },
    {
        label: 'attr-mapping',
        detail: 'Attribute mapping (target := source)',
        insertText: '${1:target} := ${2:source}',
    },
    {
        label: 'attr-conversion',
        detail: 'Attribute mapping with value conversion',
        insertText: '${1:target} := ${2:source} : ${3:true}=${4:1}, ${5:false}=${6:0}',
    },
    {
        label: 'attr-expression',
        detail: 'Attribute mapping with expression',
        insertText: '${1:target} := ${2:expression}',
    },
    {
        label: 'object-creation',
        detail: 'Create new object',
        insertText: '-> ${1:targetAttr} {\n    -> ${2:NewClass} {\n        ${3:targetAttr} := ${4:sourceExpr}\n    }\n}',
    },
    {
        label: 'conditional-mapping',
        detail: 'Mapping with condition',
        insertText: '${1:SourceClass} -> ${2:TargetClass} where ${3:condition} {\n    ${4:target} := ${5:source}\n    $0\n}',
    },
    {
        label: 'alias-mapping',
        detail: 'Class mapping with source alias',
        insertText: '${1:SourceClass} ${2:s} -> ${3:TargetClass} where ${4:condition} {\n    ${5:target} := ${2:s}.${6:attr}\n    $0\n}',
    },
    {
        label: 'multi-source-mapping',
        detail: 'Multi-source class mapping',
        insertText: '${1:ClassA} ${2:a}, ${3:ClassB} ${4:b} -> ${5:TargetClass} where ${2:a}.${6:ref} = ${4:b} {\n    ${7:target} := ${2:a}.${8:attr}\n    $0\n}',
    },
];

export interface CompletionContext {
    sourceMetamodel?: string;
    targetMetamodel?: string;
    sourceClasses?: string[];
    targetClasses?: string[];
}

let completionContext: CompletionContext = {};

/**
 * Update completion context with metamodel information
 */
export function setCompletionContext(context: CompletionContext): void {
    completionContext = { ...completionContext, ...context };
}

/**
 * Create completion item from definition
 */
function createCompletionItem(
    item: { label: string; detail: string; insertText: string; documentation?: string },
    kind: monaco.languages.CompletionItemKind,
    range: monaco.IRange
): monaco.languages.CompletionItem {
    return {
        label: item.label,
        kind,
        detail: item.detail,
        documentation: item.documentation,
        insertText: item.insertText,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        range,
    };
}

/**
 * JjTL Completion Provider
 */
export const jjtlCompletionProvider: monaco.languages.CompletionItemProvider = {
    triggerCharacters: ['.', '-', '>', ' '],

    provideCompletionItems(
        model: monaco.editor.ITextModel,
        position: monaco.Position
    ): monaco.languages.ProviderResult<monaco.languages.CompletionList> {
        const word = model.getWordUntilPosition(position);
        const range: monaco.IRange = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
        };

        const lineContent = model.getLineContent(position.lineNumber);
        const textBeforeCursor = lineContent.substring(0, position.column - 1);

        const suggestions: monaco.languages.CompletionItem[] = [];

        // Check context for different completions
        const isAfterDot = textBeforeCursor.endsWith('.');
        const isAfterArrow = textBeforeCursor.endsWith('->');
        const isStartOfLine = textBeforeCursor.trim() === '' || textBeforeCursor.trim() === word.word;
        const isInBody = this.isInsideBody(model, position);

        // After dot - suggest member functions
        if (isAfterDot) {
            BUILTIN_FUNCTIONS.forEach(fn => {
                suggestions.push(createCompletionItem(
                    fn,
                    monaco.languages.CompletionItemKind.Function,
                    range
                ));
            });
        }
        // After arrow - suggest target attributes or classes
        else if (isAfterArrow) {
            if (completionContext.targetClasses) {
                completionContext.targetClasses.forEach(cls => {
                    suggestions.push({
                        label: cls,
                        kind: monaco.languages.CompletionItemKind.Class,
                        detail: 'Target class',
                        insertText: cls,
                        range,
                    });
                });
            }
        }
        // Start of line or general context
        else if (isStartOfLine) {
            // Keywords
            KEYWORDS.forEach(kw => {
                suggestions.push(createCompletionItem(
                    kw,
                    monaco.languages.CompletionItemKind.Keyword,
                    range
                ));
            });

            // Snippets
            SNIPPETS.forEach(snippet => {
                suggestions.push(createCompletionItem(
                    snippet,
                    monaco.languages.CompletionItemKind.Snippet,
                    range
                ));
            });

            // Source classes if in body
            if (isInBody && completionContext.sourceClasses) {
                completionContext.sourceClasses.forEach(cls => {
                    suggestions.push({
                        label: cls,
                        kind: monaco.languages.CompletionItemKind.Class,
                        detail: 'Source class',
                        insertText: cls,
                        range,
                    });
                });
            }

            // Interactive functions (available everywhere in body)
            if (isInBody) {
                INTERACTIVE_FUNCTIONS.forEach(fn => {
                    suggestions.push(createCompletionItem(
                        fn,
                        monaco.languages.CompletionItemKind.Function,
                        range
                    ));
                });
            }
        }
        // Default - show all
        else {
            // Keywords
            KEYWORDS.forEach(kw => {
                suggestions.push(createCompletionItem(
                    kw,
                    monaco.languages.CompletionItemKind.Keyword,
                    range
                ));
            });

            // Built-in functions
            BUILTIN_FUNCTIONS.forEach(fn => {
                suggestions.push(createCompletionItem(
                    fn,
                    monaco.languages.CompletionItemKind.Function,
                    range
                ));
            });

            // Booleans
            suggestions.push({
                label: 'true',
                kind: monaco.languages.CompletionItemKind.Constant,
                detail: 'Boolean true',
                insertText: 'true',
                range,
            });
            suggestions.push({
                label: 'false',
                kind: monaco.languages.CompletionItemKind.Constant,
                detail: 'Boolean false',
                insertText: 'false',
                range,
            });

            // Interactive functions
            INTERACTIVE_FUNCTIONS.forEach(fn => {
                suggestions.push(createCompletionItem(
                    fn,
                    monaco.languages.CompletionItemKind.Function,
                    range
                ));
            });
        }

        return { suggestions };
    },

    /**
     * Check if position is inside a mapping body
     */
    isInsideBody(model: monaco.editor.ITextModel, position: monaco.Position): boolean {
        let braceCount = 0;
        for (let line = 1; line <= position.lineNumber; line++) {
            const lineContent = model.getLineContent(line);
            const maxCol = line === position.lineNumber ? position.column : lineContent.length + 1;
            for (let col = 0; col < maxCol - 1; col++) {
                if (lineContent[col] === '{') braceCount++;
                if (lineContent[col] === '}') braceCount--;
            }
        }
        return braceCount > 0;
    },
};

/**
 * Register completion provider for JjTL
 */
export function registerJjtlCompletions(): monaco.IDisposable {
    return monaco.languages.registerCompletionItemProvider(
        JJTL_LANGUAGE_ID,
        jjtlCompletionProvider
    );
}
