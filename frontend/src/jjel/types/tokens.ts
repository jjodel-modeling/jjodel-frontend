/**
 * JjEL Token Types
 * Jjodel Expression Language - Token Definitions
 */

export enum JjelTokenType {
    // ============================================
    // LITERALS
    // ============================================
    STRING = 'STRING',
    NUMBER = 'NUMBER',
    BOOLEAN = 'BOOLEAN',
    NULL = 'NULL',
    IDENTIFIER = 'IDENTIFIER',

    // ============================================
    // KEYWORDS
    // ============================================
    // Conditional
    IF = 'IF',
    THEN = 'THEN',
    ELSE = 'ELSE',

    // Logical (word-based, NOT symbols)
    AND = 'AND',
    OR = 'OR',
    NOT = 'NOT',

    // Type checking
    IS = 'IS',

    // Boolean literals are also keywords
    TRUE = 'TRUE',
    FALSE = 'FALSE',

    // ============================================
    // ARITHMETIC OPERATORS
    // ============================================
    PLUS = 'PLUS',               // +
    MINUS = 'MINUS',             // -
    STAR = 'STAR',               // *
    SLASH = 'SLASH',             // /
    PERCENT = 'PERCENT',         // %

    // ============================================
    // COMPARISON OPERATORS
    // ============================================
    EQ = 'EQ',                   // ==
    NEQ = 'NEQ',                 // !=
    LT = 'LT',                   // <
    GT = 'GT',                   // >
    LTE = 'LTE',                 // <=
    GTE = 'GTE',                 // >=

    // ============================================
    // NAVIGATION & NULL-SAFE
    // ============================================
    DOT = 'DOT',                 // .
    QUESTION_DOT = 'QUESTION_DOT',   // ?.
    NULL_COALESCE = 'NULL_COALESCE', // ??

    // ============================================
    // PUNCTUATION
    // ============================================
    COLON = 'COLON',             // :
    COMMA = 'COMMA',             // ,
    LPAREN = 'LPAREN',           // (
    RPAREN = 'RPAREN',           // )
    LBRACKET = 'LBRACKET',       // [
    RBRACKET = 'RBRACKET',       // ]

    // ============================================
    // STRING INTERPOLATION
    // ============================================
    DOLLAR_LBRACE = 'DOLLAR_LBRACE', // ${
    RBRACE = 'RBRACE',           // }
    STRING_PART = 'STRING_PART', // Text part in interpolated string

    // ============================================
    // SPECIAL
    // ============================================
    EOF = 'EOF',
    ERROR = 'ERROR',
}

/**
 * JjEL Keywords Map
 * Maps lowercase keyword strings to token types
 */
export const JJEL_KEYWORDS: Record<string, JjelTokenType> = {
    'if': JjelTokenType.IF,
    'then': JjelTokenType.THEN,
    'else': JjelTokenType.ELSE,
    'and': JjelTokenType.AND,
    'or': JjelTokenType.OR,
    'not': JjelTokenType.NOT,
    'is': JjelTokenType.IS,
    'true': JjelTokenType.TRUE,
    'false': JjelTokenType.FALSE,
    'null': JjelTokenType.NULL,
};

/**
 * Token representation
 */
export interface JjelToken {
    type: JjelTokenType;
    value: string;
    line: number;
    column: number;
    start: number;
    end: number;
}

/**
 * Lexer error
 */
export interface JjelLexerError {
    message: string;
    line: number;
    column: number;
}

/**
 * Lexer result
 */
export interface JjelLexerResult {
    tokens: JjelToken[];
    errors: JjelLexerError[];
}
