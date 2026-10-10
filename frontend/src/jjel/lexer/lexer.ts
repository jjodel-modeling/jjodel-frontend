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

// OCL syntax recognition: JjEL is intentionally not OCL-compatible
// (spec sections 1 and 7.6), but users coming from MDE often write OCL by
// reflex. We surface targeted parse errors instead of generic ones, in the
// same lexer-level pattern already used for `?:`, `===`, single `!`.
const OCL_METHOD_MESSAGES: Record<string, string> = {
    oclIsTypeOf:    "JjEL uses 'expr is Type', not 'expr.oclIsTypeOf(Type)' (which is OCL syntax).",
    oclIsKindOf:    "JjEL uses 'expr is Type', not 'expr.oclIsKindOf(Type)' (which is OCL syntax).",
    oclIsUndefined: "JjEL uses 'expr == null' to test for null, not 'oclIsUndefined()' (which is OCL syntax).",
    oclAsType:      "JjEL does not have explicit type casts. Type checks via 'is' are sufficient.",
};
const OCL_COLLECTION_CONSTRUCTORS = new Set<string>(['Set', 'Sequence', 'Bag', 'OrderedSet']);

// Own-key views of the two tables above: `in` and bracket access on a plain
// object also answer for Object.prototype names (`toString`, `constructor`,
// `__proto__`...). A Map is built once rather than `Object.hasOwn`, which the
// default Vite target (Safari 14) does not ship and esbuild does not polyfill.
const OCL_METHOD_MESSAGES_OWN = new Map<string, string>(Object.entries(OCL_METHOD_MESSAGES));
const JJEL_KEYWORDS_OWN = new Map<string, JjelTokenType>(Object.entries(JJEL_KEYWORDS));

/**
 * `actionMode` lexes `:=` as `ASSIGN`, for `parseAction` (R-SIM-40). Off by
 * default: in an expression `:=` stays an error.
 *
 * `interpolation` lexes the holes of a double-quoted `"…${…}…"`, for
 * `parseTemplate` (R-GEN-10). Off by default: without it a hole lexes as
 * before and every parse of it fails. Single-quoted strings never interpolate.
 */
export interface JjelLexerOptions {
    actionMode?: boolean;
    interpolation?: boolean;
}

export class JjelLexer {
    private source: string;
    private actionMode: boolean;
    private interpolation: boolean;
    private tokens: JjelToken[] = [];
    private errors: JjelLexerError[] = [];
    private start: number = 0;
    private current: number = 0;
    private line: number = 1;
    private column: number = 1;
    private lineStart: number = 0;

    constructor(source: string, options?: JjelLexerOptions) {
        this.source = source;
        this.actionMode = options?.actionMode === true;
        this.interpolation = options?.interpolation === true;
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
            case ':':
                if (this.peek() === '=') {
                    this.advance();
                    if (this.actionMode) {
                        this.addToken(JjelTokenType.ASSIGN);
                    } else {
                        this.error("':=' assigns, and only an action can assign: an expression cannot contain it. An action is written '<target>.[attribute] := <expression>'.");
                    }
                } else {
                    this.addToken(JjelTokenType.COLON);
                }
                break;
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
                } else if (this.match('>')) {
                    this.error("JjEL uses '.' for method calls, not '->' (which is OCL syntax). Replace '->' with '.'.");
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
                } else if (this.peek() === '[') {
                    // `.[` is one token, state access (R-SIM-18, R-SIM-40); `. [` is not.
                    this.advance();
                    this.addToken(JjelTokenType.DOT_LBRACKET);
                } else {
                    this.addToken(JjelTokenType.DOT);
                }
                break;

            case '?':
                if (this.match('.')) {
                    if (this.peek() === '[') {
                        this.advance();
                        this.error("'?.[' is not JjEL: in JavaScript it is a computed access. State is read with 'x.[a]', which has no null-safe form.");
                    } else {
                        this.addToken(JjelTokenType.QUESTION_DOT);
                    }
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
                } else if (this.isAlpha(this.peek())) {
                    // $identifier → DOLLAR_IDENT (e.g. $name, $prefix)
                    while (this.isAlphaNumeric(this.peek())) {
                        this.advance();
                    }
                    this.addToken(JjelTokenType.DOLLAR_IDENT);
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
                if (this.interpolation) {
                    this.interpolatedString();
                } else {
                    this.string();
                }
                break;

            // Single-quoted strings (same semantics as double-quoted)
            case "'":
                this.singleQuotedString();
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
     * A double-quoted string under `interpolation` (R-GEN-10). Without holes it
     * is one `STRING`, as in `string()`. With holes it is a `STRING_PART`, then
     * for each hole a `DOLLAR_LBRACE` whose value is the hole's source and whose
     * start, line and column are those of its first character, followed by a
     * `STRING_PART` before the next hole or the final `STRING`. The first text
     * token spans from the opening quote, the last to the closing one; text
     * values are unescaped. The parser lexes each hole again on its own.
     */
    private interpolatedString(): void {
        let text = '';
        let textStart = this.start;
        let textLine = this.line;
        let textColumn = this.start - this.lineStart + 1;

        while (this.peek() !== '"' && !this.isAtEnd()) {
            const c = this.peek();

            if (c === '\\') {
                this.advance(); // consume backslash
                const escaped = this.peek();
                this.advanceInString(); // consume escaped char

                switch (escaped) {
                    case 'n': text += '\n'; break;
                    case 't': text += '\t'; break;
                    case 'r': text += '\r'; break;
                    case '"': text += '"'; break;
                    case '\\': text += '\\'; break;
                    case '$': text += '$'; break;
                    default:
                        this.error(`Unknown escape sequence: \\${escaped}`);
                        text += escaped;
                }
            } else if (c === '$' && this.peekNext() === '{') {
                this.pushToken(JjelTokenType.STRING_PART, text, textStart, this.current, textLine, textColumn);
                this.advance(); // $
                this.advance(); // {
                const holeStart = this.current;
                const holeLine = this.line;
                const holeColumn = this.current - this.lineStart + 1;
                if (!this.skipHole()) {
                    this.error('Unterminated string interpolation');
                    return;
                }
                this.pushToken(JjelTokenType.DOLLAR_LBRACE, this.source.substring(holeStart, this.current),
                    holeStart, this.current, holeLine, holeColumn);
                this.advance(); // }
                text = '';
                textStart = this.current;
                textLine = this.line;
                textColumn = this.current - this.lineStart + 1;
            } else {
                text += c;
                this.advanceInString();
            }
        }

        if (this.isAtEnd()) {
            this.error('Unterminated string');
            return;
        }

        this.advance(); // Closing "
        this.pushToken(JjelTokenType.STRING, text, textStart, this.current, textLine, textColumn);
    }

    /**
     * Skip the source of a hole, from after `${` to its closing `}`, where it
     * stops. Braces nest; a string inside the hole is skipped whole, holes of a
     * double-quoted one included, so a `}` in it closes nothing; a `--` comment
     * runs to the end of the line, as in `scanToken`. False at the end of input.
     */
    private skipHole(): boolean {
        let depth = 1;
        while (!this.isAtEnd()) {
            const c = this.peek();
            if (c === '}') {
                depth--;
                if (depth === 0) return true;
                this.advanceInString();
            } else if (c === '{') {
                depth++;
                this.advanceInString();
            } else if (c === '"' || c === "'") {
                this.advanceInString();
                if (!this.skipQuoted(c)) return false;
            } else if (c === '-' && this.peekNext() === '-') {
                while (!this.isAtEnd() && this.peek() !== '\n') {
                    this.advanceInString();
                }
            } else {
                this.advanceInString();
            }
        }
        return false;
    }

    /** Skip a quoted string inside a hole, after its opening quote, through its closing one. */
    private skipQuoted(quote: string): boolean {
        while (!this.isAtEnd()) {
            const c = this.advanceInString();
            if (c === '\\') {
                if (!this.isAtEnd()) this.advanceInString();
            } else if (c === quote) {
                return true;
            } else if (quote === '"' && c === '$' && this.peek() === '{') {
                this.advanceInString();
                if (!this.skipHole()) return false;
                this.advanceInString(); // }
            }
        }
        return false;
    }

    /** `advance`, keeping line and column right across a newline inside a string. */
    private advanceInString(): string {
        const c = this.advance();
        if (c === '\n') {
            this.line++;
            this.lineStart = this.current;
            this.column = 1;
        }
        return c;
    }

    /**
     * Parse a single-quoted string literal (no interpolation)
     */
    private singleQuotedString(): void {
        let text = '';

        while (this.peek() !== "'" && !this.isAtEnd()) {
            const c = this.peek();
            if (c === '\n') {
                this.line++;
                this.lineStart = this.current + 1;
                text += c;
                this.advance();
            } else if (c === '\\') {
                this.advance();
                const escaped = this.peek();
                this.advance();
                switch (escaped) {
                    case 'n': text += '\n'; break;
                    case 't': text += '\t'; break;
                    case 'r': text += '\r'; break;
                    case "'": text += "'"; break;
                    case '\\': text += '\\'; break;
                    default:
                        this.error(`Unknown escape sequence: \\${escaped}`);
                        text += escaped;
                }
            } else {
                text += c;
                this.advance();
            }
        }

        if (this.isAtEnd()) {
            this.error('Unterminated string');
            return;
        }

        this.advance(); // closing '
        this.addTokenWithValue(JjelTokenType.STRING, text);
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

        // OCL `ocl*` methods: the prefix is OCL-specific, false positives are
        // implausible in JjEL contexts, so we flag the bare identifier.
        const oclMessage = OCL_METHOD_MESSAGES_OWN.get(text);
        if (oclMessage !== undefined) {
            this.error(oclMessage);
            return;
        }

        // OCL collection constructors (`Set{...}`, `Sequence{...}`, ...): only
        // flag when followed by `{`, so a metamodel class literally named
        // `Set` is still usable as a bare identifier.
        if (OCL_COLLECTION_CONSTRUCTORS.has(text) && this.peek() === '{') {
            this.error("JjEL uses '[...]' for collections (no Set/Sequence/Bag/OrderedSet distinction). Try '[1, 2, 3]'.");
            return;
        }

        const textLower = text.toLowerCase();

        // Check if it's a keyword
        const keywordType = JJEL_KEYWORDS_OWN.get(textLower);
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

    private pushToken(type: JjelTokenType, value: string, start: number, end: number, line: number, column: number): void {
        this.tokens.push({ type, value, line, column, start, end });
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
export function tokenize(source: string, options?: JjelLexerOptions): JjelLexerResult {
    const lexer = new JjelLexer(source, options);
    return lexer.tokenize();
}
