/**
 * JjScript language definition for Monaco (P-2026-10-24-2255).
 *
 * A Monarch tokenizer that follows `parser/lexer.ts`: the reserved words come from
 * `reservedIdentifiers.ts`, the one list the lexer reads, so a word added there is highlighted
 * here without a second edit. Comments are `//` and `/* ... *\/`, strings take either quote,
 * keywords are exact and lowercase like the lexer's (`Attribute` stays a class name).
 *
 * Pure: only type imports from monaco, so the tokenizer can be checked in a node test. The
 * registration with the editor lives in `jjscriptMonaco.ts`.
 */

import type * as Monaco from 'monaco-editor';
import {
    JJSCRIPT_BOOLEAN_WORDS,
    JJSCRIPT_COMMAND_WORDS,
    JJSCRIPT_ELEMENT_TYPE_WORDS,
    JJSCRIPT_KEYWORD_WORDS,
} from '../reservedIdentifiers';

export const JJSCRIPT_LANGUAGE_ID = 'jjscript';

/** Every word the lexer reads as COMMAND or KEYWORD; `abstract class` contributes both words. */
export const JJSCRIPT_MONARCH_KEYWORDS: readonly string[] = Array.from(new Set<string>([
    ...JJSCRIPT_COMMAND_WORDS,
    ...JJSCRIPT_ELEMENT_TYPE_WORDS.flatMap(w => w.split(' ')),
    ...JJSCRIPT_KEYWORD_WORDS,
]));

export const JJSCRIPT_MONARCH_CONSTANTS: readonly string[] = [...JJSCRIPT_BOOLEAN_WORDS];

export const jjscriptLanguageDefinition: Monaco.languages.IMonarchLanguage = {
    defaultToken: '',
    tokenPostfix: '.jjscript',

    keywords: JJSCRIPT_MONARCH_KEYWORDS as string[],
    constants: JJSCRIPT_MONARCH_CONSTANTS as string[],

    tokenizer: {
        root: [
            // Comments
            [/\/\/.*$/, 'comment'],
            [/\/\*/, 'comment', '@blockComment'],

            // Strings, either quote, backslash escapes
            [/"([^"\\]|\\.)*"?/, 'string'],
            [/'([^'\\]|\\.)*'?/, 'string'],

            // Arrows before the operators that share their characters
            [/<->|->/, 'operator.arrow'],

            // Numbers, a leading minus belongs to the number as in the lexer
            [/-?\d+(\.\d+)?/, 'number'],

            // Words: reserved words, booleans, class names (uppercase), other names
            [/[a-zA-Z_][a-zA-Z0-9_]*/, {
                cases: {
                    '@keywords': 'keyword',
                    '@constants': 'constant.language',
                    '[A-Z].*': 'type.identifier',
                    '@default': 'identifier',
                },
            }],

            // Path separators of qualified names (Package::Class.member)
            [/::|\./, 'delimiter'],

            // Operators: += -= == != <= >= and the single characters of the lexer
            [/[+\-=!<>]=/, 'operator'],
            [/[=+\-*\/<>!&|^~]/, 'operator'],

            [/[{}()\[\]]/, '@brackets'],
            [/[,;:@#$]/, 'delimiter'],

            [/\s+/, 'white'],
        ],
        blockComment: [
            [/[^*]+/, 'comment'],
            [/\*\//, 'comment', '@pop'],
            [/\*/, 'comment'],
        ],
    },
};

export const jjscriptLanguageConfiguration: Monaco.languages.LanguageConfiguration = {
    comments: {
        lineComment: '//',
        blockComment: ['/*', '*/'],
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
        { open: "'", close: "'" },
    ],
    surroundingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
    ],
};

/**
 * The JjScript token rules, scoped by the `.jjscript` postfix so the theme leaves every other
 * language as `vs` paints it. The colours are the JjTL theme's, passed in, never restated here.
 */
export function jjscriptThemeRules(baseRules: readonly Monaco.editor.ITokenThemeRule[]): Monaco.editor.ITokenThemeRule[] {
    return baseRules
        .filter(r => !r.token.startsWith('@'))
        .map(r => ({ ...r, token: `${r.token}.jjscript` }));
}
