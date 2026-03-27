/**
 * JjTL Language Definition for Monaco Editor
 */

import {Monaco, monaco} from "../../joiner";

export const JJTL_LANGUAGE_ID = 'jjtl';

export const jjtlLanguageDefinition: Monaco.languages.IMonarchLanguage = {
    defaultToken: 'invalid',
    tokenPostfix: '.jjtl',

    keywords: [
        'transformation', 'from', 'to', 'where', 'helper',
        'forall', 'in', 'such', 'that', 'exists', 'implies', 'with', 'do', 'is',
        'not', 'and', 'or',
        'if', 'then', 'else', 'true', 'false', 'null',
    ],

    // Interactive keywords - highlighted distinctly
    interactiveKeywords: [
        'alert', 'notify', 'prompt', 'input',
    ],

    builtinFunctions: [
        'map', 'mapAll', 'resolve', 'select', 'collect',
        'first', 'isEmpty', 'size', 'concat', 'toUpper', 'toLower',
    ],

    // Alert types and input types
    typeConstants: [
        'info', 'warning', 'error', 'success',
        'string', 'number', 'boolean', 'date', 'select',
    ],

    operators: [
        '->', ':=', ':', '=', '.', ',', '+', '-', '*', '/', '==', '!=', '<', '>', '<=', '>=', '=>', '?.', '??',
    ],

    symbols: /[=><!~?:&|+\-*\/\^%]+/,

    tokenizer: {
        root: [
            // Comments (-- line comments)
            [/--.*$/, 'comment'],

            // Keywords
            [/\b(transformation|from|to|where|helper|forall|in|such|that|exists|implies|with|do|is|not|and|or|if|then|else)\b/, 'keyword'],

            // Interactive keywords - distinct purple color
            [/\b(alert|notify)\b/, 'keyword.interactive.statement'],
            [/\b(prompt|input)\b/, 'keyword.interactive.expression'],

            // Booleans and null
            [/\b(true|false|null)\b/, 'constant.language'],

            // Built-in functions
            [/\b(map|mapAll|resolve|select|collect|first|isEmpty|size)\b/, 'support.function'],

            // Identifiers (class names start with uppercase)
            [/[A-Z][a-zA-Z0-9_]*/, 'type.identifier'],
            [/[a-z][a-zA-Z0-9_]*/, 'identifier'],

            // Numbers
            [/\d+(\.\d+)?/, 'number'],

            // Strings with special handling for type constants
            [/"(info|warning|error|success)"/, 'string.alerttype'],
            [/"(string|number|boolean|date|select)"/, 'string.inputtype'],
            [/"([^"\\]|\\.)*"/, 'string'],

            // Assignment operator :=
            [/:=/, 'operator.assignment'],

            // Arrow operators
            [/->/, 'operator.arrow'],
            [/=>/, 'operator.lambda'],

            // Null-safe and null-coalesce
            [/\?\./, 'operator'],
            [/\?\?/, 'operator'],

            // Operators
            [/[{}()\[\]]/, '@brackets'],
            [/:/, 'delimiter'],
            [/,/, 'delimiter'],
            [/\./, 'delimiter'],
            [/==|!=|<=|>=/, 'operator'],
            [/=/, 'operator'],

            // Whitespace
            [/\s+/, 'white'],
        ],
    },
};

export const jjtlLanguageConfiguration: Monaco.languages.LanguageConfiguration = {
    comments: {
        lineComment: '--',
    },
    brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
    ],
    autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
    ],
    surroundingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
    ],
    folding: {
        markers: {
            start: /^\s*#\s*region\b/,
            end: /^\s*#\s*endregion\b/,
        },
    },
};

export function registerJjtlLanguage(): void {
    monaco.languages.register({ id: JJTL_LANGUAGE_ID });
    monaco.languages.setMonarchTokensProvider(JJTL_LANGUAGE_ID, jjtlLanguageDefinition);
    monaco.languages.setLanguageConfiguration(JJTL_LANGUAGE_ID, jjtlLanguageConfiguration);
}
