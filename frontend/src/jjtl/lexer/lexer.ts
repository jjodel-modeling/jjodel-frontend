/**
 * JjTL Lexer
 * Converts source code into tokens
 */

import { Token, TokenType, LexerResult, LexerError } from '../types';

const KEYWORDS: Record<string, TokenType> = {
    'transformation': TokenType.TRANSFORMATION,
    'from': TokenType.FROM,
    'to': TokenType.TO,
    'when': TokenType.WHEN,
    'helper': TokenType.HELPER,
    'true': TokenType.BOOLEAN,
    'false': TokenType.BOOLEAN,
    'null': TokenType.NULL,
    // Interactive keywords
    'alert': TokenType.ALERT,
    'notify': TokenType.NOTIFY,
    'prompt': TokenType.PROMPT,
    'input': TokenType.INPUT,
};

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
            case ':': this.addToken(TokenType.COLON); break;
            case '.': this.addToken(TokenType.DOT); break;
            case ',': this.addToken(TokenType.COMMA); break;
            case '=': this.addToken(TokenType.EQUALS); break;

            // Two character tokens
            case '-':
                if (this.match('>')) {
                    this.addToken(TokenType.ARROW);
                } else {
                    this.addToken(TokenType.UNKNOWN);
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

        // Extract string value (without quotes)
        const value = this.source.substring(this.start + 1, this.current - 1);
        this.addToken(TokenType.STRING, value);
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
        const type = KEYWORDS[text.toLowerCase()] || TokenType.IDENTIFIER;
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
