/**
 * JjTL Token Types
 *
 * JjTL uses JjEL for expressions, so this includes both
 * transformation-specific tokens and JjEL expression tokens.
 */

export enum TokenType {
    // ============================================
    // JJTL-SPECIFIC KEYWORDS
    // ============================================
    TRANSFORMATION = 'TRANSFORMATION',
    FROM = 'FROM',
    TO = 'TO',
    WHERE = 'WHERE',
    HELPER = 'HELPER',

    // Iteration Keywords
    FORALL = 'FORALL',
    IN = 'IN',
    SUCH = 'SUCH',
    THAT = 'THAT',

    // Interactive Keywords
    ALERT = 'ALERT',
    NOTIFY = 'NOTIFY',
    PROMPT = 'PROMPT',
    INPUT = 'INPUT',
    CONFIRM = 'CONFIRM',

    // ============================================
    // JJEL KEYWORDS (for expressions)
    // ============================================
    IF = 'IF',
    THEN = 'THEN',
    ELSE = 'ELSE',
    AND = 'AND',
    OR = 'OR',
    NOT = 'NOT',
    IS = 'IS',

    // ============================================
    // LITERALS
    // ============================================
    IDENTIFIER = 'IDENTIFIER',
    STRING = 'STRING',
    NUMBER = 'NUMBER',
    BOOLEAN = 'BOOLEAN',
    NULL = 'NULL',

    // ============================================
    // OPERATORS
    // ============================================
    // JjTL operators
    ARROW = 'ARROW',              // ->
    FAT_ARROW = 'FAT_ARROW',      // =>
    ASSIGN = 'ASSIGN',            // :=
    COLON = 'COLON',              // :
    EQUALS = 'EQUALS',            // =
    DOT = 'DOT',                  // .
    COMMA = 'COMMA',              // ,

    // JjEL operators
    QUESTION_DOT = 'QUESTION_DOT',     // ?.  (null-safe navigation)
    NULL_COALESCE = 'NULL_COALESCE',   // ??  (null coalesce)
    EQUALS_EQUALS = 'EQUALS_EQUALS',   // ==  (equality)
    NOT_EQUALS = 'NOT_EQUALS',         // !=  (inequality)
    LESS_THAN = 'LESS_THAN',           // <
    GREATER_THAN = 'GREATER_THAN',     // >
    LESS_EQUAL = 'LESS_EQUAL',         // <=
    GREATER_EQUAL = 'GREATER_EQUAL',   // >=
    PLUS = 'PLUS',                     // +
    MINUS = 'MINUS',                   // -
    STAR = 'STAR',                     // *
    SLASH = 'SLASH',                   // /
    PERCENT = 'PERCENT',               // %

    // ============================================
    // BRACKETS
    // ============================================
    LBRACE = 'LBRACE',            // {
    RBRACE = 'RBRACE',            // }
    LPAREN = 'LPAREN',            // (
    RPAREN = 'RPAREN',            // )
    LBRACKET = 'LBRACKET',        // [
    RBRACKET = 'RBRACKET',        // ]

    // ============================================
    // SPECIAL
    // ============================================
    COMMENT = 'COMMENT',          // # ...
    NEWLINE = 'NEWLINE',
    WHITESPACE = 'WHITESPACE',
    EOF = 'EOF',

    // Errors
    UNKNOWN = 'UNKNOWN',
}

/**
 * Keywords mapping (lowercase to token type)
 */
export const JJTL_KEYWORDS: Record<string, TokenType> = {
    // JjTL-specific
    'transformation': TokenType.TRANSFORMATION,
    'from': TokenType.FROM,
    'to': TokenType.TO,
    'where': TokenType.WHERE,
    'helper': TokenType.HELPER,
    'forall': TokenType.FORALL,
    'in': TokenType.IN,
    'such': TokenType.SUCH,
    'that': TokenType.THAT,
    'alert': TokenType.ALERT,
    'notify': TokenType.NOTIFY,
    'prompt': TokenType.PROMPT,
    'input': TokenType.INPUT,
    'confirm': TokenType.CONFIRM,

    // JjEL keywords
    'if': TokenType.IF,
    'then': TokenType.THEN,
    'else': TokenType.ELSE,
    'and': TokenType.AND,
    'or': TokenType.OR,
    'not': TokenType.NOT,
    'is': TokenType.IS,

    // Literals
    'true': TokenType.BOOLEAN,
    'false': TokenType.BOOLEAN,
    'null': TokenType.NULL,
};

export interface Token {
    type: TokenType;
    value: string;
    line: number;
    column: number;
    start: number;
    end: number;
}

export interface LexerError {
    message: string;
    line: number;
    column: number;
}

export interface LexerResult {
    tokens: Token[];
    errors: LexerError[];
}
