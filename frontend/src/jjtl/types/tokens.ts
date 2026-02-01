/**
 * JjTL Token Types
 */

export enum TokenType {
    // Keywords
    TRANSFORMATION = 'TRANSFORMATION',
    FROM = 'FROM',
    TO = 'TO',
    WHEN = 'WHEN',
    HELPER = 'HELPER',

    // Literals
    IDENTIFIER = 'IDENTIFIER',
    STRING = 'STRING',
    NUMBER = 'NUMBER',
    BOOLEAN = 'BOOLEAN',

    // Operators
    ARROW = 'ARROW',              // ->
    COLON = 'COLON',              // :
    EQUALS = 'EQUALS',            // =
    DOT = 'DOT',                  // .
    COMMA = 'COMMA',              // ,

    // Brackets
    LBRACE = 'LBRACE',            // {
    RBRACE = 'RBRACE',            // }
    LPAREN = 'LPAREN',            // (
    RPAREN = 'RPAREN',            // )
    LBRACKET = 'LBRACKET',        // [
    RBRACKET = 'RBRACKET',        // ]

    // Special
    COMMENT = 'COMMENT',          // # ...
    NEWLINE = 'NEWLINE',
    WHITESPACE = 'WHITESPACE',
    EOF = 'EOF',

    // Errors
    UNKNOWN = 'UNKNOWN',
}

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
