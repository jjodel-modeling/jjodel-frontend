/**
 * Level 2 of R-TXT-16: a style, a parameter record that gives the base grammar's abstract shapes their tokens
 * (docs/discovery/discovery_2026-11-01_textual_viewpoint.md §A.2). The record already holds the Pascal/Ada and the
 * indentation styles of step T5 (`begin`/`end ;`, `:=`, `;`, quote doubling, reserved names; `layout: 'indent'` with
 * no delimiters); only C-like is defined and tested in T1.
 *
 * The catalog (step C3a, P-2026-11-04-0345; R-TXT-16 (2)): the styles a syntax record can name by `style.base`, C-like
 * when it names none. Pascal/Ada is the probe's record of P-2026-11-04-0303 (report §4, F16), whose check passes on every
 * corpus case.
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
    /** A blank line before each containment, except at the start of a body (step T4, a syntax annotation's style option). */
    readonly blankBeforeContainment?: boolean;
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

/** Pascal/Ada: `begin ... end ;`, `f := v ;`, `( a, b )`, `'it''s'`, `--` and `(* *)`; `begin` and `end` are reserved. */
export const PASCAL_STYLE: NotationStyle = {
    id: 'pascal',
    name: 'Pascal/Ada',
    layout: 'free',
    blockOpen: ['begin'],
    blockClose: ['end', ';'],
    emptyBlock: ['begin', 'end', ';'],
    assign: [':='],
    terminator: [';'],
    list: { open: '(', separator: ',', close: ')' },
    string: { quote: "'", escape: 'double' },
    comments: { line: '--', block: ['(*', '*)'] },
    reservedNames: ['begin', 'end'],
    classCase: 'declared',
    literalCase: 'declared',
    indent: 2,
};

/** The id a syntax record names a style by (annotations.ts `SyntaxAnnotations.style.base`). */
export type StyleBase = 'clike' | 'pascal';

/** The styles of the catalog, by their record id, in the order a picker lists them. */
export const STYLE_CATALOG: Readonly<Record<StyleBase, NotationStyle>> = { clike: CLIKE_STYLE, pascal: PASCAL_STYLE };

export const isStyleBase = (v: unknown): v is StyleBase => typeof v === 'string' && Object.prototype.hasOwnProperty.call(STYLE_CATALOG, v);

/** The style a record names; C-like when it names none. */
export const styleOf = (base: StyleBase | undefined): NotationStyle => STYLE_CATALOG[base ?? 'clike'];
