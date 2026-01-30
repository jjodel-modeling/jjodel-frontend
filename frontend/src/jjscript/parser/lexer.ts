/**
 * JjScript Lexer
 * Tokenizes JjScript input into a stream of tokens
 */

import { Token, TokenType, COMMANDS, ELEMENT_TYPES, KEYWORDS } from '../types';

// ============================================
// LEXER CLASS
// ============================================

export class Lexer {
    private input: string;
    private position: number = 0;
    private line: number = 1;
    private column: number = 1;
    private tokens: Token[] = [];

    constructor(input: string) {
        this.input = input;
    }

    /**
     * Tokenize the entire input
     */
    tokenize(): Token[] {
        this.tokens = [];
        this.position = 0;
        this.line = 1;
        this.column = 1;

        while (!this.isAtEnd()) {
            const token = this.nextToken();
            if (token) {
                // Skip whitespace and comments for parsing, but keep for formatting
                if (token.type !== 'WHITESPACE' && token.type !== 'COMMENT') {
                    this.tokens.push(token);
                }
            }
        }

        // Add EOF token
        this.tokens.push(this.createToken('EOF', ''));
        return this.tokens;
    }

    /**
     * Get next token
     */
    private nextToken(): Token | null {
        // Skip whitespace
        if (this.isWhitespace(this.peek())) {
            return this.readWhitespace();
        }

        // Check for newline
        if (this.peek() === '\n') {
            const token = this.createToken('NEWLINE', '\n');
            this.advance();
            this.line++;
            this.column = 1;
            return token;
        }

        // Check for carriage return (handle \r\n)
        if (this.peek() === '\r') {
            this.advance();
            if (this.peek() === '\n') {
                this.advance();
            }
            const token = this.createToken('NEWLINE', '\n');
            this.line++;
            this.column = 1;
            return token;
        }

        // Comments
        if (this.peek() === '/' && this.peekNext() === '/') {
            return this.readLineComment();
        }
        if (this.peek() === '/' && this.peekNext() === '*') {
            return this.readBlockComment();
        }

        // Strings
        if (this.peek() === '"' || this.peek() === "'") {
            return this.readString();
        }

        // Numbers
        if (this.isDigit(this.peek()) || (this.peek() === '-' && this.isDigit(this.peekNext()))) {
            return this.readNumber();
        }

        // Multiplicity [...]
        if (this.peek() === '[') {
            return this.readMultiplicityOrPunctuation();
        }

        // Arrows and operators
        if (this.peek() === '-' && this.peekNext() === '>') {
            return this.readArrow();
        }
        if (this.peek() === '<' && this.peekNext() === '-' && this.peekAt(2) === '>') {
            return this.readBidirectionalArrow();
        }

        // Double colon (qualified name separator)
        if (this.peek() === ':' && this.peekNext() === ':') {
            const token = this.createToken('OPERATOR', '::');
            this.advance();
            this.advance();
            return token;
        }

        // Operators
        if (this.isOperator(this.peek())) {
            return this.readOperator();
        }

        // Punctuation
        if (this.isPunctuation(this.peek())) {
            return this.readPunctuation();
        }

        // Identifiers and keywords
        if (this.isIdentifierStart(this.peek())) {
            return this.readIdentifier();
        }

        // Unknown character
        const char = this.peek();
        const token = this.createToken('UNKNOWN', char);
        this.advance();
        return token;
    }

    // ============================================
    // TOKEN READERS
    // ============================================

    private readWhitespace(): Token {
        const start = this.position;
        while (!this.isAtEnd() && this.isWhitespace(this.peek()) && this.peek() !== '\n' && this.peek() !== '\r') {
            this.advance();
        }
        return this.createToken('WHITESPACE', this.input.substring(start, this.position));
    }

    private readLineComment(): Token {
        const start = this.position;
        this.advance(); // /
        this.advance(); // /
        while (!this.isAtEnd() && this.peek() !== '\n') {
            this.advance();
        }
        return this.createToken('COMMENT', this.input.substring(start, this.position));
    }

    private readBlockComment(): Token {
        const start = this.position;
        this.advance(); // /
        this.advance(); // *
        while (!this.isAtEnd()) {
            if (this.peek() === '*' && this.peekNext() === '/') {
                this.advance();
                this.advance();
                break;
            }
            if (this.peek() === '\n') {
                this.line++;
                this.column = 0;
            }
            this.advance();
        }
        return this.createToken('COMMENT', this.input.substring(start, this.position));
    }

    private readString(): Token {
        const quote = this.peek();
        const start = this.position;
        this.advance(); // opening quote

        let value = '';
        while (!this.isAtEnd() && this.peek() !== quote) {
            if (this.peek() === '\\') {
                this.advance();
                if (!this.isAtEnd()) {
                    const escaped = this.peek();
                    switch (escaped) {
                        case 'n': value += '\n'; break;
                        case 't': value += '\t'; break;
                        case 'r': value += '\r'; break;
                        case '\\': value += '\\'; break;
                        case '"': value += '"'; break;
                        case "'": value += "'"; break;
                        default: value += escaped;
                    }
                    this.advance();
                }
            } else {
                value += this.peek();
                this.advance();
            }
        }

        if (!this.isAtEnd()) {
            this.advance(); // closing quote
        }

        const token = this.createToken('STRING', value);
        token.value = value; // Store unquoted value
        return token;
    }

    private readNumber(): Token {
        const start = this.position;

        // Handle negative numbers
        if (this.peek() === '-') {
            this.advance();
        }

        // Integer part
        while (!this.isAtEnd() && this.isDigit(this.peek())) {
            this.advance();
        }

        // Decimal part
        if (this.peek() === '.' && this.isDigit(this.peekNext())) {
            this.advance(); // .
            while (!this.isAtEnd() && this.isDigit(this.peek())) {
                this.advance();
            }
        }

        return this.createToken('NUMBER', this.input.substring(start, this.position));
    }

    private readMultiplicityOrPunctuation(): Token {
        const start = this.position;
        this.advance(); // [

        // Check if it looks like a multiplicity
        const remaining = this.input.substring(this.position);
        const multiplicityMatch = remaining.match(/^(\d+|\*)(?:\.\.(\d+|\*))?\]/);

        if (multiplicityMatch) {
            const innerStart = this.position;
            while (!this.isAtEnd() && this.peek() !== ']') {
                this.advance();
            }
            if (!this.isAtEnd()) {
                this.advance(); // ]
            }
            return this.createToken('MULTIPLICITY', this.input.substring(start, this.position));
        }

        // It's just a punctuation [
        return this.createToken('PUNCTUATION', '[');
    }

    private readArrow(): Token {
        const token = this.createToken('ARROW', '->');
        this.advance(); // -
        this.advance(); // >
        return token;
    }

    private readBidirectionalArrow(): Token {
        const token = this.createToken('ARROW', '<->');
        this.advance(); // <
        this.advance(); // -
        this.advance(); // >
        return token;
    }

    private readOperator(): Token {
        const start = this.position;
        const char = this.peek();

        // Two-character operators
        if ((char === '+' || char === '-' || char === '=' || char === '!' || char === '<' || char === '>') && this.peekNext() === '=') {
            this.advance();
            this.advance();
            return this.createToken('OPERATOR', this.input.substring(start, this.position));
        }

        this.advance();
        return this.createToken('OPERATOR', char);
    }

    private readPunctuation(): Token {
        const char = this.peek();
        this.advance();
        return this.createToken('PUNCTUATION', char);
    }

    private readIdentifier(): Token {
        const start = this.position;
        const startLine = this.line;
        const startColumn = this.column;

        // Read the first segment
        while (!this.isAtEnd() && this.isIdentifierPart(this.peek())) {
            this.advance();
        }

        let value = this.input.substring(start, this.position);

        // Check for qualified names (Package::Class or Package::Class.member)
        while (this.peek() === ':' && this.peekNext() === ':') {
            this.advance(); // :
            this.advance(); // :
            value += '::';

            // Read next segment
            if (this.isIdentifierStart(this.peek())) {
                const segmentStart = this.position;
                while (!this.isAtEnd() && this.isIdentifierPart(this.peek())) {
                    this.advance();
                }
                value += this.input.substring(segmentStart, this.position);
            }
        }

        // Check for member access (Class.attribute)
        if (this.peek() === '.') {
            const dotPos = this.position;
            this.advance(); // .

            if (this.isIdentifierStart(this.peek())) {
                const memberStart = this.position;
                while (!this.isAtEnd() && this.isIdentifierPart(this.peek())) {
                    this.advance();
                }
                value += '.' + this.input.substring(memberStart, this.position);
            } else {
                // It was just a dot operator, back up
                this.position = dotPos;
                this.column--;
            }
        }

        // Determine token type
        const tokenType = this.classifyIdentifier(value);

        const token: Token = {
            type: tokenType,
            value,
            position: start,
            line: startLine,
            column: startColumn
        };

        return token;
    }

    // ============================================
    // CLASSIFICATION
    // ============================================

    private classifyIdentifier(value: string): TokenType {
        const lower = value.toLowerCase();

        // Commands
        if (COMMANDS.includes(lower as any)) {
            return 'COMMAND';
        }

        // Element types (handle multi-word like "abstract class")
        if (ELEMENT_TYPES.includes(lower as any)) {
            return 'KEYWORD';
        }

        // Boolean literals
        if (lower === 'true' || lower === 'false') {
            return 'BOOLEAN';
        }

        // Keywords
        if (KEYWORDS.includes(lower)) {
            return 'KEYWORD';
        }

        // Qualified names (contains :: or .)
        if (value.includes('::') || (value.includes('.') && !value.startsWith('.'))) {
            return 'QUALIFIED_NAME';
        }

        return 'IDENTIFIER';
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private createToken(type: TokenType, value: string): Token {
        return {
            type,
            value,
            position: this.position - value.length,
            line: this.line,
            column: this.column - value.length
        };
    }

    private isAtEnd(): boolean {
        return this.position >= this.input.length;
    }

    private peek(): string {
        if (this.isAtEnd()) return '\0';
        return this.input[this.position];
    }

    private peekNext(): string {
        if (this.position + 1 >= this.input.length) return '\0';
        return this.input[this.position + 1];
    }

    private peekAt(offset: number): string {
        if (this.position + offset >= this.input.length) return '\0';
        return this.input[this.position + offset];
    }

    private advance(): string {
        const char = this.input[this.position];
        this.position++;
        this.column++;
        return char;
    }

    private isWhitespace(char: string): boolean {
        return char === ' ' || char === '\t';
    }

    private isDigit(char: string): boolean {
        return char >= '0' && char <= '9';
    }

    private isAlpha(char: string): boolean {
        return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
    }

    private isIdentifierStart(char: string): boolean {
        return this.isAlpha(char) || char === '_';
    }

    private isIdentifierPart(char: string): boolean {
        return this.isAlpha(char) || this.isDigit(char) || char === '_';
    }

    private isOperator(char: string): boolean {
        return '=+-*/<>!&|^~'.includes(char);
    }

    private isPunctuation(char: string): boolean {
        return '()[]{},.;:@#$'.includes(char);
    }
}

// ============================================
// CONVENIENCE FUNCTION
// ============================================

export function tokenize(input: string): Token[] {
    const lexer = new Lexer(input);
    return lexer.tokenize();
}
