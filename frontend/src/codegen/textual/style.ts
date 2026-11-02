/**
 * Level 2 of R-TXT-16: a style, a parameter record that gives the base grammar's abstract shapes their tokens
 * (docs/discovery/discovery_2026-11-01_textual_viewpoint.md §A.2). The record already holds the Pascal/Ada and the
 * indentation styles of step T5 (`begin`/`end ;`, `:=`, `;`, quote doubling, reserved names; `layout: 'indent'` with
 * no delimiters); only C-like is defined and tested in T1.
 */

export type LetterCase = 'declared' | 'lower';

export interface NotationStyle {
    readonly id: string;
    readonly name: string;
    /** `free`: blocks are delimited by tokens. `indent`: by INDENT/DEDENT from the layout (step T5). */
    readonly layout: 'free' | 'indent';
    /** Tokens that open and close a block (an object's body, a containment). */
    readonly blockOpen: readonly string[];
    readonly blockClose: readonly string[];
    /** What an object with nothing set prints in place of its body. */
    readonly emptyBlock: readonly string[];
    /** Tokens between a feature's keyword and its value (none in C-like: `f v`). */
    readonly assign: readonly string[];
    /** Tokens after a feature item (none in C-like). */
    readonly terminator: readonly string[];
    readonly list: { readonly open: string; readonly separator: string; readonly close: string };
    /** `backslash`: `\"`, `\\`, `\n` escapes. `double`: the quote doubled. */
    readonly string: { readonly quote: string; readonly escape: 'backslash' | 'double' };
    readonly comments: { readonly line: string | null; readonly block: readonly [string, string] | null };
    /** Words that cannot be a bare name: an object name equal to one of them is printed quoted. */
    readonly reservedNames: readonly string[];
    /** Case of the class keywords and of the enumeration literals; `lower` falls back to `declared` when it would merge two (R-TXT-21 (10)), or fold a class keyword onto a style word (R-TXT-25 (7)). */
    readonly classCase: LetterCase;
    readonly literalCase: LetterCase;
    /** Spaces per nesting level. */
    readonly indent: number;
}

export const CLIKE_STYLE: NotationStyle = {
    id: 'c-like',
    name: 'C-like',
    layout: 'free',
    blockOpen: ['{'],
    blockClose: ['}'],
    emptyBlock: ['{}'],
    assign: [],
    terminator: [],
    list: { open: '[', separator: ',', close: ']' },
    string: { quote: '"', escape: 'backslash' },
    comments: { line: '//', block: ['/*', '*/'] },
    reservedNames: [],
    classCase: 'declared',
    literalCase: 'declared',
    indent: 2,
};
