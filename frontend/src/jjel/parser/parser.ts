/**
 * JjEL Parser
 * Recursive descent parser for Jjodel Expression Language
 *
 * Operator Precedence (lowest to highest):
 * 0. forall / exists / with...do (keyword expressions)
 * 1. if then else
 * 2. ?? (null coalesce)
 * 3. implies (right-associative)
 * 4. or
 * 5. and
 * 6. == !=
 * 7. < > <= >=
 * 8. is
 * 9. + -
 * 10. * / %
 * 11. not - (unary)
 * 12. . ?. [] (postfix)
 */

import {
    JjelToken,
    JjelTokenType,
    JjelExpression,
    JjelParserError,
    JjelParserResult,
    JjelLexerError,
    LiteralExpr,
    IdentifierExpr,
    BinaryExpr,
    UnaryExpr,
    MemberAccessExpr,
    NullSafeMemberAccessExpr,
    MethodCallExpr,
    NullSafeMethodCallExpr,
    IfThenElseExpr,
    NullCoalesceExpr,
    IsTypeExpr,
    ImpliesExpr,
    LambdaExpr,
    ArrayLiteralExpr,
    InterpolatedStringExpr,
    InterpolatedStringPart,
    ForAllExpr,
    ExistsExpr,
    WithDoExpr,
    IndexAccessExpr,
    ASTLocation,
    BinaryOperator,
} from '../types';
import { JjelLexer } from '../lexer';

export class JjelParser {
    private tokens: JjelToken[] = [];
    private current: number = 0;
    private errors: JjelParserError[] = [];

    constructor(tokens: JjelToken[]) {
        this.tokens = tokens;
    }

    /**
     * Parse tokens into an AST
     */
    parse(): JjelParserResult {
        try {
            if (this.isAtEnd()) {
                return { expression: null, errors: [] };
            }
            const expression = this.expression();
            return { expression, errors: this.errors };
        } catch (error) {
            return { expression: null, errors: this.errors };
        }
    }

    // ============================================
    // EXPRESSION PRECEDENCE CHAIN
    // ============================================

    /**
     * expression = forall | exists | withDo | ifThenElse
     */
    private expression(): JjelExpression {
        if (this.check(JjelTokenType.FORALL)) return this.forAll();
        if (this.check(JjelTokenType.EXISTS)) return this.exists();
        if (this.check(JjelTokenType.WITH))   return this.withDo();
        return this.ifThenElse();
    }

    /**
     * ifThenElse = nullCoalesce | IF nullCoalesce THEN expression (ELSE expression)?
     */
    private ifThenElse(): JjelExpression {
        if (this.match(JjelTokenType.IF)) {
            const startToken = this.previous();
            const condition = this.nullCoalesce();

            this.consume(JjelTokenType.THEN, "Expected 'then' after condition");
            const thenBranch = this.expression();

            let elseBranch: JjelExpression | null = null;
            if (this.match(JjelTokenType.ELSE)) {
                elseBranch = this.expression();
            }

            return {
                type: 'IfThenElse',
                condition,
                thenBranch,
                elseBranch,
                location: this.makeLocation(startToken, this.previous()),
            } as IfThenElseExpr;
        }

        return this.nullCoalesce();
    }

    /**
     * nullCoalesce = implies (?? implies)*
     */
    private nullCoalesce(): JjelExpression {
        let expr = this.implies();

        while (this.match(JjelTokenType.NULL_COALESCE)) {
            const right = this.implies();
            expr = {
                type: 'NullCoalesce',
                left: expr,
                right,
                location: this.makeLocationFromExprs(expr, right),
            } as NullCoalesceExpr;
        }

        return expr;
    }

    /**
     * implies = logicalOr (IMPLIES implies)?   — right-associative
     */
    private implies(): JjelExpression {
        const left = this.logicalOr();

        if (this.match(JjelTokenType.IMPLIES)) {
            const right = this.implies(); // right-recursive → right-associative
            return {
                type: 'Implies',
                left,
                right,
                location: this.makeLocationFromExprs(left, right),
            } as ImpliesExpr;
        }

        return left;
    }

    /**
     * logicalOr = logicalAnd (OR logicalAnd)*
     */
    private logicalOr(): JjelExpression {
        let expr = this.logicalAnd();

        while (this.match(JjelTokenType.OR)) {
            const right = this.logicalAnd();
            expr = {
                type: 'Binary',
                operator: 'or' as BinaryOperator,
                left: expr,
                right,
                location: this.makeLocationFromExprs(expr, right),
            } as BinaryExpr;
        }

        return expr;
    }

    /**
     * logicalAnd = equality (AND equality)*
     */
    private logicalAnd(): JjelExpression {
        let expr = this.equality();

        while (this.match(JjelTokenType.AND)) {
            const right = this.equality();
            expr = {
                type: 'Binary',
                operator: 'and' as BinaryOperator,
                left: expr,
                right,
                location: this.makeLocationFromExprs(expr, right),
            } as BinaryExpr;
        }

        return expr;
    }

    /**
     * equality = comparison ((== | !=) comparison)*
     */
    private equality(): JjelExpression {
        let expr = this.comparison();

        while (this.match(JjelTokenType.EQ, JjelTokenType.NEQ)) {
            const operator = this.previous().value as BinaryOperator;
            const right = this.comparison();
            expr = {
                type: 'Binary',
                operator,
                left: expr,
                right,
                location: this.makeLocationFromExprs(expr, right),
            } as BinaryExpr;
        }

        return expr;
    }

    /**
     * comparison = isType ((< | > | <= | >=) isType)*
     */
    private comparison(): JjelExpression {
        let expr = this.isType();

        while (this.match(JjelTokenType.LT, JjelTokenType.GT, JjelTokenType.LTE, JjelTokenType.GTE)) {
            const operator = this.previous().value as BinaryOperator;
            const right = this.isType();
            expr = {
                type: 'Binary',
                operator,
                left: expr,
                right,
                location: this.makeLocationFromExprs(expr, right),
            } as BinaryExpr;
        }

        return expr;
    }

    /**
     * isType = addition (IS IDENTIFIER)?
     */
    private isType(): JjelExpression {
        let expr = this.addition();

        if (this.match(JjelTokenType.IS)) {
            const typeToken = this.consume(JjelTokenType.IDENTIFIER, "Expected type name after 'is'");
            expr = {
                type: 'IsType',
                expression: expr,
                targetType: typeToken.value,
                location: this.makeLocation(this.getStartToken(expr), typeToken),
            } as IsTypeExpr;
        }

        return expr;
    }

    /**
     * addition = multiplication ((+ | -) multiplication)*
     */
    private addition(): JjelExpression {
        let expr = this.multiplication();

        while (this.match(JjelTokenType.PLUS, JjelTokenType.MINUS)) {
            const operator = this.previous().value as BinaryOperator;
            const right = this.multiplication();
            expr = {
                type: 'Binary',
                operator,
                left: expr,
                right,
                location: this.makeLocationFromExprs(expr, right),
            } as BinaryExpr;
        }

        return expr;
    }

    /**
     * multiplication = unary ((* | / | %) unary)*
     */
    private multiplication(): JjelExpression {
        let expr = this.unary();

        while (this.match(JjelTokenType.STAR, JjelTokenType.SLASH, JjelTokenType.PERCENT)) {
            const operator = this.previous().value as BinaryOperator;
            const right = this.unary();
            expr = {
                type: 'Binary',
                operator,
                left: expr,
                right,
                location: this.makeLocationFromExprs(expr, right),
            } as BinaryExpr;
        }

        return expr;
    }

    /**
     * unary = (NOT | -) unary | postfix
     */
    private unary(): JjelExpression {
        if (this.match(JjelTokenType.NOT)) {
            const startToken = this.previous();
            const operand = this.unary();
            return {
                type: 'Unary',
                operator: 'not',
                operand,
                location: this.makeLocation(startToken, this.previous()),
            } as UnaryExpr;
        }

        if (this.match(JjelTokenType.MINUS)) {
            const startToken = this.previous();
            const operand = this.unary();
            return {
                type: 'Unary',
                operator: '-',
                operand,
                location: this.makeLocation(startToken, this.previous()),
            } as UnaryExpr;
        }

        return this.postfix();
    }

    /**
     * postfix = primary (
     *     . IDENTIFIER (( argList ))?
     *   | ?. IDENTIFIER (( argList ))?
     * )*
     */
    private postfix(): JjelExpression {
        let expr = this.primary();

        while (true) {
            if (this.match(JjelTokenType.DOT)) {
                const propToken = this.consume(JjelTokenType.IDENTIFIER, "Expected property name after '.'");

                if (this.match(JjelTokenType.LPAREN)) {
                    // Method call
                    const args = this.argumentList();
                    this.consume(JjelTokenType.RPAREN, "Expected ')' after arguments");
                    expr = {
                        type: 'MethodCall',
                        object: expr,
                        method: propToken.value,
                        args,
                        location: this.makeLocation(this.getStartToken(expr), this.previous()),
                    } as MethodCallExpr;
                } else {
                    // Member access
                    expr = {
                        type: 'MemberAccess',
                        object: expr,
                        property: propToken.value,
                        location: this.makeLocation(this.getStartToken(expr), propToken),
                    } as MemberAccessExpr;
                }
            } else if (this.match(JjelTokenType.QUESTION_DOT)) {
                const propToken = this.consume(JjelTokenType.IDENTIFIER, "Expected property name after '?.'");

                if (this.match(JjelTokenType.LPAREN)) {
                    // Null-safe method call
                    const args = this.argumentList();
                    this.consume(JjelTokenType.RPAREN, "Expected ')' after arguments");
                    expr = {
                        type: 'NullSafeMethodCall',
                        object: expr,
                        method: propToken.value,
                        args,
                        location: this.makeLocation(this.getStartToken(expr), this.previous()),
                    } as NullSafeMethodCallExpr;
                } else {
                    // Null-safe member access
                    expr = {
                        type: 'NullSafeMemberAccess',
                        object: expr,
                        property: propToken.value,
                        location: this.makeLocation(this.getStartToken(expr), propToken),
                    } as NullSafeMemberAccessExpr;
                }
            } else if (this.match(JjelTokenType.LBRACKET)) {
                // Index access: expr[index]
                const index = this.expression();
                this.consume(JjelTokenType.RBRACKET, "Expected ']' after index");
                expr = {
                    type: 'IndexAccess',
                    object: expr,
                    index,
                    location: this.makeLocation(this.getStartToken(expr), this.previous()),
                } as IndexAccessExpr;
            } else {
                break;
            }
        }

        return expr;
    }

    /**
     * primary = literal | IDENTIFIER | lambda | arrayLiteral | ( expression )
     */
    private primary(): JjelExpression {
        // Literals
        if (this.match(JjelTokenType.BOOLEAN)) {
            const token = this.previous();
            return {
                type: 'Literal',
                value: token.value.toLowerCase() === 'true',
                dataType: 'EBoolean',
                location: this.makeLocation(token, token),
            } as LiteralExpr;
        }

        if (this.match(JjelTokenType.NUMBER)) {
            const token = this.previous();
            const value = parseFloat(token.value);
            const isInt = Number.isInteger(value);
            return {
                type: 'Literal',
                value,
                dataType: isInt ? 'EInt' : 'EDouble',
                location: this.makeLocation(token, token),
            } as LiteralExpr;
        }

        if (this.match(JjelTokenType.STRING)) {
            const token = this.previous();
            return {
                type: 'Literal',
                value: token.value,
                dataType: 'EString',
                location: this.makeLocation(token, token),
            } as LiteralExpr;
        }

        if (this.match(JjelTokenType.NULL)) {
            const token = this.previous();
            return {
                type: 'Literal',
                value: null,
                dataType: 'null',
                location: this.makeLocation(token, token),
            } as LiteralExpr;
        }

        // Array literal: [elem1, elem2, ...]
        if (this.match(JjelTokenType.LBRACKET)) {
            return this.arrayLiteral();
        }

        // Parenthesized expression or lambda with multiple params
        if (this.match(JjelTokenType.LPAREN)) {
            return this.parenthesizedOrLambda();
        }

        // Identifier or single-param lambda
        if (this.match(JjelTokenType.IDENTIFIER)) {
            const token = this.previous();

            // Check for lambda: x => expr
            if (this.match(JjelTokenType.ARROW)) {
                const body = this.expression();
                return {
                    type: 'Lambda',
                    params: [token.value],
                    body,
                    location: this.makeLocation(token, this.previous()),
                } as LambdaExpr;
            }

            // Regular identifier
            return {
                type: 'Identifier',
                name: token.value,
                location: this.makeLocation(token, token),
            } as IdentifierExpr;
        }

        throw this.error(this.peek(), "Expected expression");
    }

    /**
     * Handle (expr) or (params): body lambda
     */
    private parenthesizedOrLambda(): JjelExpression {
        const startToken = this.previous(); // the LPAREN

        // Try to parse as lambda parameters
        if (this.check(JjelTokenType.IDENTIFIER)) {
            const params: string[] = [];
            const firstIdent = this.advance();
            params.push(firstIdent.value);

            // Check if this is a lambda with multiple params
            while (this.match(JjelTokenType.COMMA)) {
                const paramToken = this.consume(JjelTokenType.IDENTIFIER, "Expected parameter name");
                params.push(paramToken.value);
            }

            if (this.match(JjelTokenType.RPAREN)) {
                // Could be lambda or parenthesized identifier
                if (this.match(JjelTokenType.ARROW)) {
                    // Multi-param lambda: (a, b) => expr
                    const body = this.expression();
                    return {
                        type: 'Lambda',
                        params,
                        body,
                        location: this.makeLocation(startToken, this.previous()),
                    } as LambdaExpr;
                }

                // If only one param and no arrow, it was a parenthesized identifier
                if (params.length === 1) {
                    return {
                        type: 'Identifier',
                        name: params[0],
                        location: this.makeLocation(firstIdent, firstIdent),
                    } as IdentifierExpr;
                }

                // Multiple identifiers without arrow is an error
                throw this.error(this.peek(), "Expected '=>' for lambda expression");
            }
        }

        // It's a parenthesized expression
        // Reset to just after LPAREN
        this.current--; // Back before any consumed tokens
        this.current = this.findTokenIndex(startToken) + 1;

        const expr = this.expression();
        this.consume(JjelTokenType.RPAREN, "Expected ')' after expression");
        return expr;
    }

    /**
     * arrayLiteral = [ (expression (, expression)*)? ]
     */
    private arrayLiteral(): ArrayLiteralExpr {
        const startToken = this.previous(); // the LBRACKET
        const elements: JjelExpression[] = [];

        if (!this.check(JjelTokenType.RBRACKET)) {
            do {
                elements.push(this.expression());
            } while (this.match(JjelTokenType.COMMA));
        }

        this.consume(JjelTokenType.RBRACKET, "Expected ']' after array elements");

        return {
            type: 'ArrayLiteral',
            elements,
            location: this.makeLocation(startToken, this.previous()),
        };
    }

    // ============================================
    // QUANTIFIER / CONTEXT EXPRESSIONS
    // ============================================

    /**
     * forall = FORALL IDENT IN nullCoalesce [SUCH THAT nullCoalesce] [COLON expression]
     * At least one of 'such that' or ':' must be present.
     * Uses nullCoalesce (not expression) for collection/filter to avoid consuming keywords.
     */
    private forAll(): ForAllExpr {
        const startToken = this.peek();
        this.consume(JjelTokenType.FORALL, "Expected 'forall'");
        const varToken = this.consume(JjelTokenType.IDENTIFIER, "Expected variable name after 'forall'");
        this.consume(JjelTokenType.IN, "Expected 'in' after variable name");

        // Collection: stop before 'such', 'that', ':', keywords
        const collection = this.nullCoalesce();

        let filter: JjelExpression | undefined;
        let projection: JjelExpression | undefined;

        if (this.match(JjelTokenType.SUCH)) {
            this.consume(JjelTokenType.THAT, "Expected 'that' after 'such'");
            filter = this.nullCoalesce(); // stop before ':'
        }

        if (this.match(JjelTokenType.COLON)) {
            projection = this.expression();
        }

        if (!filter && !projection) {
            throw this.error(this.peek(), "forall requires 'such that' clause, ':' projection, or both");
        }

        return {
            type: 'ForAll',
            variable: varToken.value,
            collection,
            filter,
            projection,
            location: this.makeLocation(startToken, this.previous()),
        };
    }

    /**
     * exists = EXISTS IDENT IN nullCoalesce (COLON | SUCH THAT) expression
     */
    private exists(): ExistsExpr {
        const startToken = this.peek();
        this.consume(JjelTokenType.EXISTS, "Expected 'exists'");
        const varToken = this.consume(JjelTokenType.IDENTIFIER, "Expected variable name after 'exists'");
        this.consume(JjelTokenType.IN, "Expected 'in' after variable name");

        const collection = this.nullCoalesce();

        if (this.match(JjelTokenType.COLON)) {
            // exists x in S : pred
        } else if (this.match(JjelTokenType.SUCH)) {
            this.consume(JjelTokenType.THAT, "Expected 'that' after 'such'");
        } else {
            throw this.error(this.peek(), "exists requires ':' or 'such that' followed by predicate");
        }

        const predicate = this.expression();

        return {
            type: 'Exists',
            variable: varToken.value,
            collection,
            predicate,
            location: this.makeLocation(startToken, this.previous()),
        };
    }

    /**
     * withDo = WITH nullCoalesce DO expression
     */
    private withDo(): WithDoExpr {
        const startToken = this.peek();
        this.consume(JjelTokenType.WITH, "Expected 'with'");
        const context = this.nullCoalesce(); // stop before 'do'
        this.consume(JjelTokenType.DO, "Expected 'do' after context expression");
        const body = this.expression();

        return {
            type: 'WithDo',
            context,
            body,
            location: this.makeLocation(startToken, this.previous()),
        };
    }

    /**
     * argumentList = (expression (, expression)*)?
     */
    private argumentList(): JjelExpression[] {
        const args: JjelExpression[] = [];

        if (!this.check(JjelTokenType.RPAREN)) {
            do {
                args.push(this.expression());
            } while (this.match(JjelTokenType.COMMA));
        }

        return args;
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private match(...types: JjelTokenType[]): boolean {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    private check(type: JjelTokenType): boolean {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }

    private advance(): JjelToken {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    private isAtEnd(): boolean {
        return this.peek().type === JjelTokenType.EOF;
    }

    private peek(): JjelToken {
        return this.tokens[this.current];
    }

    private previous(): JjelToken {
        return this.tokens[this.current - 1];
    }

    private consume(type: JjelTokenType, message: string): JjelToken {
        if (this.check(type)) return this.advance();
        throw this.error(this.peek(), message);
    }

    private error(token: JjelToken, message: string): Error {
        this.errors.push({
            message,
            line: token.line,
            column: token.column,
        });
        return new Error(message);
    }

    private findTokenIndex(token: JjelToken): number {
        return this.tokens.findIndex(t =>
            t.start === token.start && t.line === token.line
        );
    }

    private getStartToken(expr: JjelExpression): JjelToken {
        // Return a synthetic token from the expression's location
        const loc = expr.location;
        if (!loc) {
            return this.tokens[0];
        }
        return {
            type: JjelTokenType.IDENTIFIER,
            value: '',
            line: loc.start.line,
            column: loc.start.column,
            start: loc.start.offset || 0,
            end: loc.end.offset || 0,
        };
    }

    private makeLocation(start: JjelToken, end: JjelToken): ASTLocation {
        return {
            start: { line: start.line, column: start.column, offset: start.start },
            end: { line: end.line, column: end.column, offset: end.end },
        };
    }

    private makeLocationFromExprs(left: JjelExpression, right: JjelExpression): ASTLocation | undefined {
        if (!left.location || !right.location) return undefined;
        return {
            start: left.location.start,
            end: right.location.end,
        };
    }
}

/**
 * Convenience function to parse tokens into an AST
 */
export function parse(tokens: JjelToken[]): JjelParserResult {
    const parser = new JjelParser(tokens);
    return parser.parse();
}

/**
 * Convenience function to parse a source string directly
 */
export function parseExpression(source: string): JjelParserResult {
    const lexer = new JjelLexer(source);
    const { tokens, errors: lexerErrors } = lexer.tokenize();

    if (lexerErrors.length > 0) {
        return {
            expression: null,
            errors: lexerErrors.map((e: JjelLexerError) => ({
                message: e.message,
                line: e.line,
                column: e.column,
            })),
        };
    }

    const parser = new JjelParser(tokens);
    return parser.parse();
}
