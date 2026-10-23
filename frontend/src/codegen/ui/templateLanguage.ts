/**
 * templateLanguage — the Monaco language of a template body, `jjel-template` (slice S2, P-2026-10-23-1945; R-GEN-24,
 * discovery §3.2, §3.3).
 *
 * A body is a JjEL expression lexed with interpolation: a `"…"` string holds `${…}` holes, each a JjEL expression
 * that may hold strings of its own; a `'…'` string never interpolates (jjel/lexer/lexer.ts). The Monarch grammar
 * mirrors that with a `"` state, a hole state pushed by `${` and popped by its `}` (a `{` inside a hole pushes a
 * brace state, so a record literal does not close the hole), and a plain `'` state. Keywords are matched without
 * case, as the lexer lowercases them before the lookup.
 *
 * A text-mode body (S5, R-GEN-26) has a second language, `jjel-template-text`: its root is literal text, its holes
 * the same states; no quote closes itself there, a quote being text.
 *
 * The theme is the JjTL editor's (jjtl/editor/jjtlTheme.ts), reused, with the hole delimiters and the escapes
 * coloured. Registered once, on the first editor; this module is reached only from the Code panel's chunk.
 */

import { Monaco, monaco } from '../../joiner';
import { jjtlTheme } from '../../jjtl/editor/jjtlTheme';

export const TEMPLATE_LANGUAGE_ID = 'jjel-template';
/** The language of a text-mode body (S5, R-GEN-26). */
export const TEMPLATE_TEXT_LANGUAGE_ID = 'jjel-template-text';
export const TEMPLATE_THEME_ID = 'jjel-template-theme';

const KEYWORDS = ['if', 'then', 'else', 'and', 'or', 'not', 'is', 'forall', 'exists', 'in', 'such', 'that', 'implies', 'with', 'do'];
const CONSTANTS = ['true', 'false', 'null'];

// The states both languages share: a JjEL expression, its strings, and the hole a `${` opens.
const sharedStates: Monaco.languages.IMonarchLanguage['tokenizer'] = {
    expression: [
        [/--.*$/, 'comment'],
        [/"/, 'string', '@dstring'],
        [/'/, 'string', '@sstring'],
        [/\d+(\.\d+)?/, 'number'],
        // One rule: under `ignoreCase` a `[A-Z]` class matches lowercase too.
        [/[a-z_]\w*/, { cases: { '@keywords': 'keyword', '@constants': 'constant.language', '@default': 'identifier' } }],
        [/=>/, 'operator.lambda'],
        [/\?\.|\?\?|==|!=|<=|>=|[+\-*\/%<>=!]/, 'operator'],
        [/\{/, 'delimiter.bracket', '@braces'],
        [/[()\[\]]/, '@brackets'],
        [/[.,:]/, 'delimiter'],
        [/\s+/, 'white'],
    ],

    braces: [
        [/\}/, 'delimiter.bracket', '@pop'],
        { include: '@expression' },
    ],

    hole: [
        [/\}/, 'delimiter.interpolation', '@pop'],
        { include: '@expression' },
    ],

    dstring: [
        [/[^\\"$]+/, 'string'],
        [/\\./, 'string.escape'],
        [/\$\{/, 'delimiter.interpolation', '@hole'],
        [/\$/, 'string'],
        [/"/, 'string', '@pop'],
    ],

    sstring: [
        [/[^\\']+/, 'string'],
        [/\\./, 'string.escape'],
        [/'/, 'string', '@pop'],
    ],
};

const templateLanguage: Monaco.languages.IMonarchLanguage = {
    defaultToken: '',
    tokenPostfix: '.jjel-template',
    ignoreCase: true,
    keywords: KEYWORDS,
    constants: CONSTANTS,

    tokenizer: {
        root: [{ include: '@expression' }],
        ...sharedStates,
    },
};

/**
 * A text body: literal text, where only `${` opens a hole and `\${` writes `${` (jjel/lexer/lexer.ts, `textBody`);
 * quotes, backslashes and `--` are text. The hole is the expression language's.
 */
const templateTextLanguage: Monaco.languages.IMonarchLanguage = {
    defaultToken: '',
    tokenPostfix: '.jjel-template-text',
    ignoreCase: true,
    keywords: KEYWORDS,
    constants: CONSTANTS,

    tokenizer: {
        root: [
            [/[^\\$]+/, 'text'],
            [/\\\$\{/, 'string.escape'],
            [/\$\{/, 'delimiter.interpolation', '@hole'],
            [/[\\$]/, 'text'],
        ],
        ...sharedStates,
    },
};

const templateLanguageConfiguration: Monaco.languages.LanguageConfiguration = {
    comments: { lineComment: '--' },
    brackets: [['{', '}'], ['[', ']'], ['(', ')']],
    autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"', notIn: ['string'] },
        { open: "'", close: "'", notIn: ['string'] },
    ],
    surroundingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
    ],
};

/** Text mode: no comment, and no quote closes itself, as a quote is text there. */
const templateTextLanguageConfiguration: Monaco.languages.LanguageConfiguration = {
    brackets: [['{', '}'], ['[', ']'], ['(', ')']],
    autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
    ],
    surroundingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
    ],
};

const templateTheme: Monaco.editor.IStandaloneThemeData = {
    ...jjtlTheme,
    rules: [
        ...jjtlTheme.rules,
        { token: 'delimiter.interpolation', foreground: '0ea5e9', fontStyle: 'bold' },
        { token: 'string.escape', foreground: 'f59e0b' },
        { token: 'operator.lambda', foreground: '0ea5e9' },
    ],
};

let registered = false;

/** Registers both languages and their theme, once. */
export function ensureTemplateLanguage(): void {
    if (registered) return;
    monaco.languages.register({ id: TEMPLATE_LANGUAGE_ID });
    monaco.languages.setMonarchTokensProvider(TEMPLATE_LANGUAGE_ID, templateLanguage);
    monaco.languages.setLanguageConfiguration(TEMPLATE_LANGUAGE_ID, templateLanguageConfiguration);
    monaco.languages.register({ id: TEMPLATE_TEXT_LANGUAGE_ID });
    monaco.languages.setMonarchTokensProvider(TEMPLATE_TEXT_LANGUAGE_ID, templateTextLanguage);
    monaco.languages.setLanguageConfiguration(TEMPLATE_TEXT_LANGUAGE_ID, templateTextLanguageConfiguration);
    monaco.editor.defineTheme(TEMPLATE_THEME_ID, templateTheme);
    registered = true;
}
