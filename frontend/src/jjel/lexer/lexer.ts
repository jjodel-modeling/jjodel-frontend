/**
 * JjEL Lexer
 * Converts source code into tokens for the Jjodel Expression Language
 */

import {
    JjelToken,
    JjelTokenType,
    JjelLexerError,
    JjelLexerResult,
    JJEL_KEYWORDS,
} from '../types';

export class JjelLexer {
    private source: string;
    private tokens: JjelToken[] = [];
    private errors: JjelLexerError[] = [];
    private start: number = 0;
    private current: number = 0;
    private line: number = 1;
    private column: number = 1;
    private lineStart: number = 0;

    constructor(source: string) {
        this.source = source;
    }

    /**
     * Tokenize the source string
     */
    tokenize(): JjelLexerResult {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }

        this.tokens.push({
            type: JjelTokenType.EOF,
            value: '',
            line: this.line,
            column: this.column,
            start: this.current,
            end: this.current,
        });

        return {
            tokens: this.tokens,
            errors: this.errors,
        };
    }

    private scanToken(): void {
        const c = this.advance();

        switch (c) {
            // Single character tokens
            case '(': this.addToken(JjelTokenType.LPAREN); break;
            case ')': this.addToken(JjelTokenType.RPAREN); break;
            case '[': this.addToken(JjelTokenType.LBRACKET); break;
            case ']': this.addToken(JjelTokenType.RBRACKET); break;
            case '{': this.addToken(JjelTokenType.LBRACE); break;
            case '}': this.addToken(JjelTokenType.RBRACE); break;
            case ':': this.addToken(JjelTokenType.COLON); break;
            case ',': this.addToken(JjelTokenType.COMMA); break;
            case '+': this.addToken(JjelTokenType.PLUS); break;
            case '*': this.addToken(JjelTokenType.STAR); break;
            case '/': this.addToken(JjelTokenType.SLASH); break;
            case '%': this.addToken(JjelTokenType.PERCENT); break;
            case '|': this.addToken(JjelTokenType.PIPE); break;

            // Multi-character operators
            case '-':
                if (this.match('-')) {
                    // Line comment: -- skip to end of line
                    while (!this.isAtEnd() && this.peek() !== '\n') {
                        this.advance();
                    }
                    // No token emitted
                } else {
                    this.addToken(JjelTokenType.MINUS);
                }
                break;

            case '.':
                // Could be . or start of a number like .5
                if (this.isDigit(this.peek())) {
                    // Number starting with decimal point
                    this.current--; // Back up
                    this.column--;
                    this.number();
                } else {
                    this.addToken(JjelTokenType.DOT);
                }
                break;

            case '?':
                if (this.match('.')) {
                    this.addToken(JjelTokenType.QUESTION_DOT);
                } else if (this.match('?')) {
                    this.addToken(JjelTokenType.NULL_COALESCE);
                } else {
                    this.error("Ternary operator '?:' is not supported. Use 'if condition then value1 else value2' instead.");
                }
                break;

            case '=':
                if (this.match('=')) {
                    if (this.peek() === '=') {
                        this.advance();
                        this.error("Strict equality '===' is not supported. Use '==' instead.");
                    } else {
                        this.addToken(JjelTokenType.EQ);
                    }
                } else if (this.match('>')) {
                    this.addToken(JjelTokenType.ARROW);
                } else {
                    // Single = is not valid in JjEL expressions
                    this.error(`Unexpected '='. Did you mean '==' or '=>'?`);
                }
                break;

            case '!':
                if (this.match('=')) {
                    this.addToken(JjelTokenType.NEQ);
                } else {
                    // ! alone is not valid - use 'not' keyword
                    this.error(`Unexpected '!'. Use 'not' for logical negation.`);
                }
                break;

            case '<':
                if (this.match('=')) {
                    this.addToken(JjelTokenType.LTE);
                } else {
                    this.addToken(JjelTokenType.LT);
                }
                break;

            case '>':
                if (this.match('=')) {
                    this.addToken(JjelTokenType.GTE);
                } else {
                    this.addToken(JjelTokenType.GT);
                }
                break;

            case '$':
                if (this.match('{')) {
                    this.addToken(JjelTokenType.DOLLAR_LBRACE);
                } else {
                    this.error(`Unexpected '$'. Did you mean '\${' for interpolation?`);
                }
                break;

            // Whitespace - skip
            case ' ':
            case '\r':
            case '\t':
                break;

            case '\n':
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
                    this.error(`Unexpected character: ${c}`);
                }
        }
    }

    /**
     * Parse a string literal with escape sequences
     * Handles both regular strings and detects interpolation
     */
    private string(): void {
        // For simple strings without interpolation
        const parts: { type: 'text' | 'interpolation'; value: string }[] = [];
        let currentText = '';

        while (this.peek() !== '"' && !this.isAtEnd()) {
            const c = this.peek();

            if (c === '\n') {
                // Strings can span multiple lines
                this.line++;
                this.lineStart = this.current + 1;
                currentText += c;
                this.advance();
            } else if (c === '\\') {
                // Escape sequence
                this.advance(); // consume backslash
                const escaped = this.peek();
                this.advance(); // consume escaped char

                switch (escaped) {
                    case 'n': currentText += '\n'; break;
                    case 't': currentText += '\t'; break;
                    case 'r': currentText += '\r'; break;
                    case '"': currentText += '"'; break;
                    case '\\': currentText += '\\'; break;
                    case '$': currentText += '$'; break;
                    default:
                        this.error(`Unknown escape sequence: \\${escaped}`);
                        currentText += escaped;
                }
            } else if (c === '$' && this.peekNext() === '{') {
                // String interpolation detected
                // For now, emit the text so far as STRING and emit DOLLAR_LBRACE
                // The parser will handle the interpolation parsing
                if (currentText) {
                    this.addTokenWithValue(JjelTokenType.STRING_PART, currentText);
                    currentText = '';
                }
                this.advance(); // $
                this.advance(); // {
                this.addToken(JjelTokenType.DOLLAR_LBRACE);

                // Scan until matching }
                // We need to track brace depth for nested expressions
                let braceDepth = 1;
                const exprStart = this.current;

                while (braceDepth > 0 && !this.isAtEnd()) {
                    const ec = this.advance();
                    if (ec === '{') braceDepth++;
                    else if (ec === '}') braceDepth--;
                    else if (ec === '\n') {
                        this.line++;
                        this.lineStart = this.current;
                    }
                }

                if (braceDepth > 0) {
                    this.error('Unterminated string interpolation');
                    return;
                }

                // Back up to before the closing brace
                this.current--;
                this.column--;

                // The expression between ${ and } needs to be re-tokenized
                // For simplicity, we'll emit the entire expression as a single token
                // and let the parser handle nested tokenization
                const exprValue = this.source.substring(exprStart, this.current);
                this.addTokenWithValue(JjelTokenType.IDENTIFIER, exprValue); // Placeholder

                this.advance(); // consume }
                this.addToken(JjelTokenType.RBRACE);

            } else {
                currentText += c;
                this.advance();
            }
        }

        if (this.isAtEnd()) {
            this.error('Unterminated string');
            return;
        }

        this.advance(); // Closing "

        // Emit the remaining text or the whole string
        if (parts.length === 0) {
            // Simple string without interpolation
            this.addTokenWithValue(JjelTokenType.STRING, currentText);
        } else if (currentText) {
            this.addTokenWithValue(JjelTokenType.STRING_PART, currentText);
        }
    }

    /**
     * Parse a number (integer or decimal)
     */
    private number(): void {
        // Integer part
        while (this.isDigit(this.peek())) {
            this.advance();
        }

        // Decimal part
        if (this.peek() === '.' && this.isDigit(this.peekNext())) {
            this.advance(); // consume .
            while (this.isDigit(this.peek())) {
                this.advance();
            }
        }

        this.addToken(JjelTokenType.NUMBER);
    }

    /**
     * Parse an identifier or keyword
     */
    private identifier(): void {
        while (this.isAlphaNumeric(this.peek())) {
            this.advance();
        }

        const text = this.source.substring(this.start, this.current);
        const textLower = text.toLowerCase();

        // Check if it's a keyword
        const keywordType = JJEL_KEYWORDS[textLower];
        if (keywordType) {
            // For boolean keywords, also store the value
            if (keywordType === JjelTokenType.TRUE || keywordType === JjelTokenType.FALSE) {
                this.addTokenWithValue(JjelTokenType.BOOLEAN, textLower);
            } else if (keywordType === JjelTokenType.NULL) {
                this.addToken(JjelTokenType.NULL);
            } else {
                this.addToken(keywordType);
            }
        } else {
            this.addToken(JjelTokenType.IDENTIFIER);
        }
    }

    // ============================================
    // HELPER METHODS
    // ============================================

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

    private addToken(type: JjelTokenType): void {
        const text = this.source.substring(this.start, this.current);
        this.tokens.push({
            type,
            value: text,
            line: this.line,
            column: this.start - this.lineStart + 1,
            start: this.start,
            end: this.current,
        });
    }

    private addTokenWithValue(type: JjelTokenType, value: string): void {
        this.tokens.push({
            type,
            value,
            line: this.line,
            column: this.start - this.lineStart + 1,
            start: this.start,
            end: this.current,
        });
    }

    private error(message: string): void {
        this.errors.push({
            message,
            line: this.line,
            column: this.column - 1,
        });
        this.addToken(JjelTokenType.ERROR);
    }
}

/**
 * Convenience function to tokenize a source string
 */
export function tokenize(source: string): JjelLexerResult {
    const lexer = new JjelLexer(source);
    return lexer.tokenize();
}
