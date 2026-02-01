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
    { label: 'when', detail: 'Conditional mapping', insertText: 'when { ${1:condition} }' },
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

// Snippets for common patterns
const SNIPPETS = [
    {
        label: 'class-mapping',
        detail: 'Class mapping with body',
        insertText: '${1:SourceClass} -> ${2:TargetClass} {\n    ${3:sourceAttr} -> ${4:targetAttr}\n    $0\n}',
    },
    {
        label: 'class-mapping-multi',
        detail: 'Class mapping with multiplicity',
        insertText: '${1:SourceClass} -> ${2:TargetClass} [*] {\n    ${3:sourceAttr} -> ${4:targetAttr}\n    $0\n}',
    },
    {
        label: 'attr-mapping',
        detail: 'Attribute mapping',
        insertText: '${1:source} -> ${2:target}',
    },
    {
        label: 'attr-conversion',
        detail: 'Attribute mapping with conversion',
        insertText: '${1:source} -> ${2:target} : ${3:true}=${4:1}, ${5:false}=${6:0}',
    },
    {
        label: 'object-creation',
        detail: 'Create new object',
        insertText: '-> ${1:targetAttr} {\n    -> ${2:NewClass} {\n        ${3:attr} -> ${4:value}\n    }\n}',
    },
    {
        label: 'conditional-mapping',
        detail: 'Mapping with condition',
        insertText: '${1:SourceClass} -> ${2:TargetClass} when { ${3:condition} } {\n    $0\n}',
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
    item: { label: string; detail: string; insertText: string },
    kind: monaco.languages.CompletionItemKind,
    range: monaco.IRange
): monaco.languages.CompletionItem {
    return {
        label: item.label,
        kind,
        detail: item.detail,
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
