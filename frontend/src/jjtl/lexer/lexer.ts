/**
 * JjTL Lexer
 * Converts source code into tokens
 *
 * JjTL uses JjEL for expressions, so this lexer handles both
 * transformation-specific tokens and JjEL expression tokens.
 */

import { Token, TokenType, LexerResult, LexerError, JJTL_KEYWORDS } from '../types';

export class JjtlLexer {
    private source: string;
    private tokens: Token[] = [];
    private errors: LexerError[] = [];
    private start: number = 0;
    private current: number = 0;
    private line: number = 1;
    private column: number = 1;
    private lineStart: number = 0;

    constructor(source: string) {
        this.source = source;
    }

    tokenize(): LexerResult {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }

        this.tokens.push({
            type: TokenType.EOF,
            value: '',
            line: this.line,
            column: this.column,
            start: this.current,
            end: this.current,
        });

        return {
            tokens: this.tokens.filter(t =>
                t.type !== TokenType.WHITESPACE &&
                t.type !== TokenType.COMMENT
            ),
            errors: this.errors,
        };
    }

    private scanToken(): void {
        const c = this.advance();

        switch (c) {
            // Single character tokens
            case '{': this.addToken(TokenType.LBRACE); break;
            case '}': this.addToken(TokenType.RBRACE); break;
            case '(': this.addToken(TokenType.LPAREN); break;
            case ')': this.addToken(TokenType.RPAREN); break;
            case '[': this.addToken(TokenType.LBRACKET); break;
            case ']': this.addToken(TokenType.RBRACKET); break;
            case ':':
                if (this.match('=')) {
                    this.addToken(TokenType.ASSIGN);    // :=
                } else {
                    this.addToken(TokenType.COLON);     // :
                }
                break;
            case ',': this.addToken(TokenType.COMMA); break;
            case '+': this.addToken(TokenType.PLUS); break;
            case '*': this.addToken(TokenType.STAR); break;
            case '/': this.addToken(TokenType.SLASH); break;
            case '%': this.addToken(TokenType.PERCENT); break;

            // Dot and null-safe member access
            case '.':
                this.addToken(TokenType.DOT);
                break;

            // Question mark (null-safe operators)
            case '?':
                if (this.match('.')) {
                    this.addToken(TokenType.QUESTION_DOT);  // ?.
                } else if (this.match('?')) {
                    this.addToken(TokenType.NULL_COALESCE); // ??
                } else {
                    this.errors.push({
                        message: "Unexpected '?'. Did you mean '?.' or '??'?",
                        line: this.line,
                        column: this.column - 1,
                    });
                    this.addToken(TokenType.UNKNOWN);
                }
                break;

            // Equals, fat arrow, and equality
            case '=':
                if (this.match('=')) {
                    this.addToken(TokenType.EQUALS_EQUALS); // ==
                } else if (this.match('>')) {
                    this.addToken(TokenType.FAT_ARROW);     // =>
                } else {
                    this.addToken(TokenType.EQUALS);        // =
                }
                break;

            // Not equals
            case '!':
                if (this.match('=')) {
                    this.addToken(TokenType.NOT_EQUALS);    // !=
                } else {
                    // JjEL uses 'not' keyword, not '!'
                    this.errors.push({
                        message: "Use 'not' for logical negation, not '!'",
                        line: this.line,
                        column: this.column - 1,
                    });
                    this.addToken(TokenType.UNKNOWN);
                }
                break;

            // Less than
            case '<':
                if (this.match('=')) {
                    this.addToken(TokenType.LESS_EQUAL);    // <=
                } else {
                    this.addToken(TokenType.LESS_THAN);     // <
                }
                break;

            // Greater than
            case '>':
                if (this.match('=')) {
                    this.addToken(TokenType.GREATER_EQUAL); // >=
                } else {
                    this.addToken(TokenType.GREATER_THAN);  // >
                }
                break;

            // Minus and arrow
            case '-':
                if (this.match('>')) {
                    this.addToken(TokenType.ARROW);         // ->
                } else if (this.match('-')) {
                    this.comment();                         // -- line comment
                } else {
                    this.addToken(TokenType.MINUS);         // -
                }
                break;

            // Comments
            case '#':
                this.comment();
                break;

            // Whitespace
            case ' ':
            case '\r':
            case '\t':
                this.addToken(TokenType.WHITESPACE);
                break;

            case '\n':
                this.addToken(TokenType.NEWLINE);
                this.line++;
                this.lineStart = this.current;
                this.column = 1;
                break;

            // String literals
            case '"':
                this.string();
                break;

            // Single-quoted strings (also supported)
            case "'":
                this.singleQuotedString();
                break;

            default:
                if (this.isDigit(c)) {
                    this.number();
                } else if (this.isAlpha(c)) {
                    this.identifier();
                } else {
                    this.errors.push({
                        message: `Unexpected character: ${c}`,
                        line: this.line,
                        column: this.column - 1,
                    });
                    this.addToken(TokenType.UNKNOWN);
                }
        }
    }

    private comment(): void {
        while (this.peek() !== '\n' && !this.isAtEnd()) {
            this.advance();
        }
        this.addToken(TokenType.COMMENT);
    }

    private string(): void {
        while (this.peek() !== '"' && !this.isAtEnd()) {
            if (this.peek() === '\n') {
                this.line++;
                this.lineStart = this.current + 1;
            }
            // Handle escape sequences
            if (this.peek() === '\\' && !this.isAtEnd()) {
                this.advance(); // Skip backslash
                if (!this.isAtEnd()) this.advance(); // Skip escaped char
                continue;
            }
            this.advance();
        }

        if (this.isAtEnd()) {
            this.errors.push({
                message: 'Unterminated string',
                line: this.line,
                column: this.column,
            });
            return;
        }

        this.advance(); // Closing "

        // Extract string value (without quotes) and process escapes
        const raw = this.source.substring(this.start + 1, this.current - 1);
        const value = this.processEscapes(raw);
        this.addToken(TokenType.STRING, value);
    }

    private singleQuotedString(): void {
        while (this.peek() !== "'" && !this.isAtEnd()) {
            if (this.peek() === '\n') {
                this.line++;
                this.lineStart = this.current + 1;
            }
            // Handle escape sequences
            if (this.peek() === '\\' && !this.isAtEnd()) {
                this.advance(); // Skip backslash
                if (!this.isAtEnd()) this.advance(); // Skip escaped char
                continue;
            }
            this.advance();
        }

        if (this.isAtEnd()) {
            this.errors.push({
                message: 'Unterminated string',
                line: this.line,
                column: this.column,
            });
            return;
        }

        this.advance(); // Closing '

        // Extract string value (without quotes) and process escapes
        const raw = this.source.substring(this.start + 1, this.current - 1);
        const value = this.processEscapes(raw);
        this.addToken(TokenType.STRING, value);
    }

    private processEscapes(str: string): string {
        let result = '';
        let i = 0;

        while (i < str.length) {
            if (str[i] === '\\' && i + 1 < str.length) {
                const next = str[i + 1];
                switch (next) {
                    case 'n': result += '\n'; break;
                    case 't': result += '\t'; break;
                    case 'r': result += '\r'; break;
                    case '\\': result += '\\'; break;
                    case '"': result += '"'; break;
                    case "'": result += "'"; break;
                    default: result += next; break;
                }
                i += 2;
            } else {
                result += str[i];
                i++;
            }
        }

        return result;
    }

    private number(): void {
        while (this.isDigit(this.peek())) {
            this.advance();
        }

        // Decimal
        if (this.peek() === '.' && this.isDigit(this.peekNext())) {
            this.advance(); // consume .
            while (this.isDigit(this.peek())) {
                this.advance();
            }
        }

        this.addToken(TokenType.NUMBER);
    }

    private identifier(): void {
        while (this.isAlphaNumeric(this.peek())) {
            this.advance();
        }

        const text = this.source.substring(this.start, this.current);
        const type = JJTL_KEYWORDS[text.toLowerCase()] || TokenType.IDENTIFIER;
        this.addToken(type);
    }

    // Helper methods
    private isAtEnd(): boolean {
        return this.current >= this.source.length;
    }

    private advance(): string {
        const c = this.source[this.current];
        this.current++;
        this.column++;
        return c;
    }

    private peek(): string {
        if (this.isAtEnd()) return '\0';
        return this.source[this.current];
    }

    private peekNext(): string {
        if (this.current + 1 >= this.source.length) return '\0';
        return this.source[this.current + 1];
    }

    private match(expected: string): boolean {
        if (this.isAtEnd()) return false;
        if (this.source[this.current] !== expected) return false;
        this.current++;
        this.column++;
        return true;
    }

    private isDigit(c: string): boolean {
        return c >= '0' && c <= '9';
    }

    private isAlpha(c: string): boolean {
        return (c >= 'a' && c <= 'z') ||
               (c >= 'A' && c <= 'Z') ||
               c === '_';
    }

    private isAlphaNumeric(c: string): boolean {
        return this.isAlpha(c) || this.isDigit(c);
    }

    private addToken(type: TokenType, value?: string): void {
        const text = value ?? this.source.substring(this.start, this.current);
        this.tokens.push({
            type,
            value: text,
            line: this.line,
            column: this.start - this.lineStart + 1,
            start: this.start,
            end: this.current,
        });
    }
}

export function tokenize(source: string): LexerResult {
    const lexer = new JjtlLexer(source);
    return lexer.tokenize();
}
