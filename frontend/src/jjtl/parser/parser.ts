/**
 * JjTL Parser
 * Converts tokens into AST
 *
 * JjTL uses JjEL for expressions. This parser implements the full
 * JjEL expression grammar with proper operator precedence.
 */

import {
    Token,
    TokenType,
    TransformationAST,
    ClassMappingAST,
    AttributeMappingAST,
    ConversionAST,
    ValueMappingAST,
    ObjectCreationAST,
    ExpressionAST,
    LiteralAST,
    IdentifierAST,
    MemberAccessAST,
    NullSafeMemberAccessAST,
    FunctionCallAST,
    NullSafeFunctionCallAST,
    BinaryExpressionAST,
    UnaryExpressionAST,
    ConditionalExpressionAST,
    NullCoalesceExpressionAST,
    IsTypeExpressionAST,
    LambdaExpressionAST,
    MultiplicityAST,
    HelperAST,
    ParameterAST,
    ParserResult,
    ParserError,
    // Interactive types
    MappingBodyItemAST,
    AlertStatementAST,
    NotifyStatementAST,
    PromptExpressionAST,
    InputExpressionAST,
    ArrayLiteralAST,
    AlertType,
    InputType,
} from '../types';

export class JjtlParser {
    private tokens: Token[] = [];
    private current: number = 0;
    private errors: ParserError[] = [];

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    parse(): ParserResult {
        try {
            const ast = this.transformation();
            return { ast, errors: this.errors };
        } catch (error) {
            return { ast: null, errors: this.errors };
        }
    }

    // transformation = "transformation" IDENTIFIER "from" IDENTIFIER "to" IDENTIFIER (classMapping | helper)*
    private transformation(): TransformationAST {
        const startToken = this.consume(TokenType.TRANSFORMATION, "Expected 'transformation'");
        const name = this.consume(TokenType.IDENTIFIER, "Expected transformation name").value;

        // Allow newlines between header parts
        this.skipNewlines();
        this.consume(TokenType.FROM, "Expected 'from'");
        const sourceMetamodel = this.consume(TokenType.IDENTIFIER, "Expected source metamodel name").value;

        this.skipNewlines();
        this.consume(TokenType.TO, "Expected 'to'");
        const targetMetamodel = this.consume(TokenType.IDENTIFIER, "Expected target metamodel name").value;

        const mappings: ClassMappingAST[] = [];
        const helpers: HelperAST[] = [];

        while (!this.isAtEnd()) {
            this.skipNewlines();
            if (this.isAtEnd()) break;

            if (this.check(TokenType.HELPER)) {
                helpers.push(this.helper());
            } else if (this.check(TokenType.IDENTIFIER)) {
                mappings.push(this.classMapping());
            } else {
                break;
            }
        }

        return {
            type: 'Transformation',
            name,
            sourceMetamodel,
            targetMetamodel,
            mappings,
            helpers,
            location: this.makeLocation(startToken, this.previous()),
        };
    }

    // classMapping = IDENTIFIER "->" IDENTIFIER multiplicity? condition? mappingBody?
    private classMapping(): ClassMappingAST {
        const startToken = this.peek();
        const sourceClass = this.consume(TokenType.IDENTIFIER, "Expected source class name").value;

        this.consume(TokenType.ARROW, "Expected '->'");

        const targetClass = this.consume(TokenType.IDENTIFIER, "Expected target class name").value;

        let targetMultiplicity: MultiplicityAST | undefined;
        if (this.match(TokenType.LBRACKET)) {
            targetMultiplicity = this.multiplicity();
        }

        let condition: ExpressionAST | undefined;
        if (this.match(TokenType.WHEN)) {
            this.consume(TokenType.LBRACE, "Expected '{' after 'when'");
            condition = this.expression();
            this.consume(TokenType.RBRACE, "Expected '}' after condition");
        }

        let body: AttributeMappingAST[] = [];
        if (this.match(TokenType.LBRACE)) {
            body = this.mappingBody();
            this.consume(TokenType.RBRACE, "Expected '}'");
        }

        return {
            type: 'ClassMapping',
            sourceClass,
            targetClass,
            targetMultiplicity,
            condition,
            body,
            location: this.makeLocation(startToken, this.previous()),
        };
    }

    // multiplicity = "[" (NUMBER | "*") (".." (NUMBER | "*"))? "]"
    private multiplicity(): MultiplicityAST {
        const startToken = this.previous();
        let lower = 0;
        let upper = -1;

        if (this.check(TokenType.NUMBER)) {
            lower = parseInt(this.advance().value, 10);

            if (this.match(TokenType.DOT)) {
                this.consume(TokenType.DOT, "Expected '..' in multiplicity");
                if (this.check(TokenType.NUMBER)) {
                    upper = parseInt(this.advance().value, 10);
                } else if (this.peek().value === '*') {
                    this.advance();
                    upper = -1;
                } else {
                    this.errors.push({
                        message: "Expected number or '*' in multiplicity",
                        line: this.peek().line,
                        column: this.peek().column,
                    });
                }
            } else {
                upper = lower;
            }
        } else if (this.peek().value === '*') {
            this.advance();
            lower = 0;
            upper = -1;
        }

        this.consume(TokenType.RBRACKET, "Expected ']'");

        return {
            type: 'Multiplicity',
            lower,
            upper,
            location: this.makeLocation(startToken, this.previous()),
        };
    }

    // mappingBody = (attributeMapping | interactiveStatement)*
    private mappingBody(): MappingBodyItemAST[] {
        const items: MappingBodyItemAST[] = [];

        this.skipNewlines();

        while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
            // Check for interactive statements first
            if (this.check(TokenType.ALERT)) {
                items.push(this.alertStatement());
            } else if (this.check(TokenType.NOTIFY)) {
                items.push(this.notifyStatement());
            } else {
                items.push(this.attributeMapping());
            }
            this.skipNewlines();
        }

        return items;
    }

    // attributeMapping = (IDENTIFIER "->")? IDENTIFIER (":" conversion)? | "->" IDENTIFIER objectCreation
    private attributeMapping(): AttributeMappingAST {
        const startToken = this.peek();

        // Check for object creation: -> targetAttr { ... }
        if (this.match(TokenType.ARROW)) {
            const targetAttribute = this.consume(TokenType.IDENTIFIER, "Expected target attribute name").value;

            let objectCreation: ObjectCreationAST | undefined;
            let conversion: ConversionAST | undefined;

            if (this.match(TokenType.LBRACE)) {
                // Check if it's object creation or inline body
                if (this.check(TokenType.ARROW)) {
                    objectCreation = this.objectCreation(targetAttribute);
                } else {
                    // It's a nested mapping body
                    const body = this.mappingBody();
                    this.consume(TokenType.RBRACE, "Expected '}'");
                    objectCreation = {
                        type: 'ObjectCreation',
                        targetClass: targetAttribute,
                        body,
                        location: this.makeLocation(startToken, this.previous()),
                    };
                }
            } else if (this.match(TokenType.COLON)) {
                conversion = this.conversion();
            }

            return {
                type: 'AttributeMapping',
                sourceAttribute: undefined,
                targetAttribute,
                conversion,
                objectCreation,
                location: this.makeLocation(startToken, this.previous()),
            };
        }

        // Regular mapping: sourceAttr -> targetAttr : conversion
        const sourceAttribute = this.consume(TokenType.IDENTIFIER, "Expected source attribute name").value;
        this.consume(TokenType.ARROW, "Expected '->'");
        const targetAttribute = this.consume(TokenType.IDENTIFIER, "Expected target attribute name").value;

        let conversion: ConversionAST | undefined;
        if (this.match(TokenType.COLON)) {
            conversion = this.conversion();
        }

        return {
            type: 'AttributeMapping',
            sourceAttribute,
            targetAttribute,
            conversion,
            objectCreation: undefined,
            location: this.makeLocation(startToken, this.previous()),
        };
    }

    // objectCreation = "{" "->" IDENTIFIER "{" attributeMapping* "}" "}"
    private objectCreation(parentAttr: string): ObjectCreationAST {
        const startToken = this.previous();

        this.consume(TokenType.ARROW, "Expected '->' in object creation");
        const targetClass = this.consume(TokenType.IDENTIFIER, "Expected class name").value;
        this.consume(TokenType.LBRACE, "Expected '{'");

        const body = this.mappingBody();

        this.consume(TokenType.RBRACE, "Expected '}'");
        this.consume(TokenType.RBRACE, "Expected '}'");

        return {
            type: 'ObjectCreation',
            targetClass,
            body,
            location: this.makeLocation(startToken, this.previous()),
        };
    }

    // conversion = valueMapping ("," valueMapping)* | expression
    private conversion(): ConversionAST {
        const startToken = this.peek();

        // Try to parse as value mappings: true=1, false=0
        if (this.check(TokenType.BOOLEAN) || this.check(TokenType.NUMBER) || this.check(TokenType.STRING)) {
            const mappings: ValueMappingAST[] = [];

            do {
                const sourceValue = this.literal();
                this.consume(TokenType.EQUALS, "Expected '=' in value mapping");
                const targetValue = this.literal();

                mappings.push({
                    type: 'ValueMapping',
                    sourceValue,
                    targetValue,
                    location: this.makeLocation(startToken, this.previous()),
                });
            } while (this.match(TokenType.COMMA));

            return {
                type: 'Conversion',
                mappings,
                location: this.makeLocation(startToken, this.previous()),
            };
        }

        // Parse as expression
        const expression = this.expression();
        return {
            type: 'Conversion',
            expression,
            location: this.makeLocation(startToken, this.previous()),
        };
    }

    // helper = "helper" IDENTIFIER "(" paramList? ")" "->" IDENTIFIER "{" expression "}"
    private helper(): HelperAST {
        const startToken = this.consume(TokenType.HELPER, "Expected 'helper'");
        const name = this.consume(TokenType.IDENTIFIER, "Expected helper name").value;

        this.consume(TokenType.LPAREN, "Expected '('");

        const parameters: ParameterAST[] = [];
        if (!this.check(TokenType.RPAREN)) {
            do {
                const paramName = this.consume(TokenType.IDENTIFIER, "Expected parameter name").value;
                this.consume(TokenType.COLON, "Expected ':'");
                const paramType = this.consume(TokenType.IDENTIFIER, "Expected parameter type").value;
                parameters.push({
                    type: 'Parameter',
                    name: paramName,
                    paramType,
                    location: this.makeLocation(this.previous(), this.previous()),
                });
            } while (this.match(TokenType.COMMA));
        }

        this.consume(TokenType.RPAREN, "Expected ')'");
        this.consume(TokenType.ARROW, "Expected '->'");
        const returnType = this.consume(TokenType.IDENTIFIER, "Expected return type").value;
        this.consume(TokenType.LBRACE, "Expected '{'");

        const body = this.expression();

        this.consume(TokenType.RBRACE, "Expected '}'");

        return {
            type: 'Helper',
            name,
            parameters,
            returnType,
            body,
            location: this.makeLocation(startToken, this.previous()),
        };
    }

    // ============================================
    // JJEL EXPRESSION PARSING
    // ============================================
    // Precedence (lowest to highest):
    // 1. if-then-else
    // 2. ?? (null coalesce)
    // 3. or
    // 4. and
    // 5. == !=
    // 6. < > <= >=
    // 7. is
    // 8. + -
    // 9. * / %
    // 10. not, unary -
    // 11. . ?. () (postfix)
    // 12. primary

    // expression = ifThenElse
    private expression(): ExpressionAST {
        return this.ifThenElse();
    }

    // ifThenElse = nullCoalesce ("if" nullCoalesce "then" nullCoalesce ("else" ifThenElse)?)?
    private ifThenElse(): ExpressionAST {
        // Check for "if" at start
        if (this.check(TokenType.IF)) {
            const startToken = this.advance();
            const condition = this.nullCoalesce();
            this.consume(TokenType.THEN, "Expected 'then' after condition");
            const thenBranch = this.nullCoalesce();

            let elseBranch: ExpressionAST | null = null;
            if (this.match(TokenType.ELSE)) {
                elseBranch = this.ifThenElse();
            }

            return {
                type: 'ConditionalExpression',
                condition,
                thenBranch,
                elseBranch,
                location: this.makeLocation(startToken, this.previous()),
            } as ConditionalExpressionAST;
        }

        return this.nullCoalesce();
    }

    // nullCoalesce = logicalOr ("??" logicalOr)*
    private nullCoalesce(): ExpressionAST {
        let expr = this.logicalOr();

        while (this.match(TokenType.NULL_COALESCE)) {
            const startToken = this.previous();
            const right = this.logicalOr();
            expr = {
                type: 'NullCoalesceExpression',
                left: expr,
                right,
                location: this.makeLocation(startToken, this.previous()),
            } as NullCoalesceExpressionAST;
        }

        return expr;
    }

    // logicalOr = logicalAnd ("or" logicalAnd)*
    private logicalOr(): ExpressionAST {
        let expr = this.logicalAnd();

        while (this.match(TokenType.OR)) {
            const startToken = this.previous();
            const right = this.logicalAnd();
            expr = {
                type: 'BinaryExpression',
                operator: 'or',
                left: expr,
                right,
                location: this.makeLocation(startToken, this.previous()),
            } as BinaryExpressionAST;
        }

        return expr;
    }

    // logicalAnd = equality ("and" equality)*
    private logicalAnd(): ExpressionAST {
        let expr = this.equality();

        while (this.match(TokenType.AND)) {
            const startToken = this.previous();
            const right = this.equality();
            expr = {
                type: 'BinaryExpression',
                operator: 'and',
                left: expr,
                right,
                location: this.makeLocation(startToken, this.previous()),
            } as BinaryExpressionAST;
        }

        return expr;
    }

    // equality = comparison (("==" | "!=") comparison)*
    private equality(): ExpressionAST {
        let expr = this.comparison();

        while (this.match(TokenType.EQUALS_EQUALS, TokenType.NOT_EQUALS)) {
            const op = this.previous().type === TokenType.EQUALS_EQUALS ? '==' : '!=';
            const startToken = this.previous();
            const right = this.comparison();
            expr = {
                type: 'BinaryExpression',
                operator: op,
                left: expr,
                right,
                location: this.makeLocation(startToken, this.previous()),
            } as BinaryExpressionAST;
        }

        return expr;
    }

    // comparison = isType (("<" | ">" | "<=" | ">=") isType)*
    private comparison(): ExpressionAST {
        let expr = this.isType();

        while (this.match(TokenType.LESS_THAN, TokenType.GREATER_THAN, TokenType.LESS_EQUAL, TokenType.GREATER_EQUAL)) {
            const opToken = this.previous();
            let op: string;
            switch (opToken.type) {
                case TokenType.LESS_THAN: op = '<'; break;
                case TokenType.GREATER_THAN: op = '>'; break;
                case TokenType.LESS_EQUAL: op = '<='; break;
                case TokenType.GREATER_EQUAL: op = '>='; break;
                default: op = '<';
            }
            const right = this.isType();
            expr = {
                type: 'BinaryExpression',
                operator: op,
                left: expr,
                right,
                location: this.makeLocation(opToken, this.previous()),
            } as BinaryExpressionAST;
        }

        return expr;
    }

    // isType = addition ("is" IDENTIFIER)?
    private isType(): ExpressionAST {
        let expr = this.addition();

        if (this.match(TokenType.IS)) {
            const startToken = this.previous();
            const typeName = this.consume(TokenType.IDENTIFIER, "Expected type name after 'is'").value;
            expr = {
                type: 'IsTypeExpression',
                expression: expr,
                targetType: typeName,
                location: this.makeLocation(startToken, this.previous()),
            } as IsTypeExpressionAST;
        }

        return expr;
    }

    // addition = multiplication (("+" | "-") multiplication)*
    private addition(): ExpressionAST {
        let expr = this.multiplication();

        while (this.match(TokenType.PLUS, TokenType.MINUS)) {
            const op = this.previous().type === TokenType.PLUS ? '+' : '-';
            const startToken = this.previous();
            const right = this.multiplication();
            expr = {
                type: 'BinaryExpression',
                operator: op,
                left: expr,
                right,
                location: this.makeLocation(startToken, this.previous()),
            } as BinaryExpressionAST;
        }

        return expr;
    }

    // multiplication = unary (("*" | "/" | "%") unary)*
    private multiplication(): ExpressionAST {
        let expr = this.unary();

        while (this.match(TokenType.STAR, TokenType.SLASH, TokenType.PERCENT)) {
            const opToken = this.previous();
            let op: string;
            switch (opToken.type) {
                case TokenType.STAR: op = '*'; break;
                case TokenType.SLASH: op = '/'; break;
                case TokenType.PERCENT: op = '%'; break;
                default: op = '*';
            }
            const right = this.unary();
            expr = {
                type: 'BinaryExpression',
                operator: op,
                left: expr,
                right,
                location: this.makeLocation(opToken, this.previous()),
            } as BinaryExpressionAST;
        }

        return expr;
    }

    // unary = ("not" | "-") unary | postfix
    private unary(): ExpressionAST {
        if (this.match(TokenType.NOT)) {
            const startToken = this.previous();
            const operand = this.unary();
            return {
                type: 'UnaryExpression',
                operator: 'not',
                operand,
                location: this.makeLocation(startToken, this.previous()),
            } as UnaryExpressionAST;
        }

        if (this.match(TokenType.MINUS)) {
            const startToken = this.previous();
            const operand = this.unary();
            return {
                type: 'UnaryExpression',
                operator: '-',
                operand,
                location: this.makeLocation(startToken, this.previous()),
            } as UnaryExpressionAST;
        }

        return this.postfix();
    }

    // postfix = primary (("." | "?.") IDENTIFIER ("(" arguments? ")")?)*
    private postfix(): ExpressionAST {
        let expr = this.primary();

        while (true) {
            if (this.match(TokenType.DOT)) {
                const property = this.consume(TokenType.IDENTIFIER, "Expected property name").value;

                if (this.match(TokenType.LPAREN)) {
                    const args = this.argumentList();
                    expr = {
                        type: 'FunctionCall',
                        callee: {
                            type: 'MemberAccess',
                            object: expr,
                            property,
                            location: this.makeLocation(this.previous(), this.previous()),
                        } as MemberAccessAST,
                        arguments: args,
                        location: this.makeLocation(this.previous(), this.previous()),
                    } as FunctionCallAST;
                } else {
                    expr = {
                        type: 'MemberAccess',
                        object: expr,
                        property,
                        location: this.makeLocation(this.previous(), this.previous()),
                    } as MemberAccessAST;
                }
            } else if (this.match(TokenType.QUESTION_DOT)) {
                const property = this.consume(TokenType.IDENTIFIER, "Expected property name after '?.'").value;

                if (this.match(TokenType.LPAREN)) {
                    const args = this.argumentList();
                    expr = {
                        type: 'NullSafeFunctionCall',
                        callee: {
                            type: 'NullSafeMemberAccess',
                            object: expr,
                            property,
                            location: this.makeLocation(this.previous(), this.previous()),
                        } as NullSafeMemberAccessAST,
                        arguments: args,
                        location: this.makeLocation(this.previous(), this.previous()),
                    } as NullSafeFunctionCallAST;
                } else {
                    expr = {
                        type: 'NullSafeMemberAccess',
                        object: expr,
                        property,
                        location: this.makeLocation(this.previous(), this.previous()),
                    } as NullSafeMemberAccessAST;
                }
            } else {
                break;
            }
        }

        return expr;
    }

    // argumentList = (expression ("," expression)*)?
    private argumentList(): ExpressionAST[] {
        const args: ExpressionAST[] = [];

        if (!this.check(TokenType.RPAREN)) {
            do {
                // Check for lambda: identifier ":" expression
                if (this.check(TokenType.IDENTIFIER) && this.peekNext()?.type === TokenType.COLON) {
                    args.push(this.lambda());
                } else if (this.check(TokenType.LPAREN) && this.isLambdaStart()) {
                    args.push(this.lambda());
                } else {
                    args.push(this.expression());
                }
            } while (this.match(TokenType.COMMA));
        }

        this.consume(TokenType.RPAREN, "Expected ')' after arguments");
        return args;
    }

    // Check if current position starts a multi-param lambda: (a, b): expr
    private isLambdaStart(): boolean {
        if (!this.check(TokenType.LPAREN)) return false;

        // Look ahead to find matching ) and check if followed by :
        let depth = 0;
        let i = this.current;

        while (i < this.tokens.length) {
            const t = this.tokens[i];
            if (t.type === TokenType.LPAREN) depth++;
            else if (t.type === TokenType.RPAREN) {
                depth--;
                if (depth === 0) {
                    // Check if followed by colon
                    const next = this.tokens[i + 1];
                    return next && next.type === TokenType.COLON;
                }
            }
            i++;
        }

        return false;
    }

    // lambda = IDENTIFIER ":" expression | "(" paramList ")" ":" expression
    private lambda(): LambdaExpressionAST {
        const startToken = this.peek();
        const params: string[] = [];

        if (this.match(TokenType.LPAREN)) {
            // Multi-param: (a, b): expr
            if (!this.check(TokenType.RPAREN)) {
                do {
                    params.push(this.consume(TokenType.IDENTIFIER, "Expected parameter name").value);
                } while (this.match(TokenType.COMMA));
            }
            this.consume(TokenType.RPAREN, "Expected ')' after parameters");
        } else {
            // Single param: x: expr
            params.push(this.consume(TokenType.IDENTIFIER, "Expected parameter name").value);
        }

        this.consume(TokenType.COLON, "Expected ':' in lambda");
        const body = this.expression();

        return {
            type: 'LambdaExpression',
            params,
            body,
            location: this.makeLocation(startToken, this.previous()),
        };
    }

    // Peek next token
    private peekNext(): Token | undefined {
        if (this.current + 1 >= this.tokens.length) return undefined;
        return this.tokens[this.current + 1];
    }

    // primary = IDENTIFIER | literal | "(" expression ")" | "[" elements "]" | prompt | input
    private primary(): ExpressionAST {
        // Check for literals (boolean, number, string, null)
        if (this.check(TokenType.BOOLEAN) || this.check(TokenType.NUMBER) || this.check(TokenType.STRING) || this.check(TokenType.NULL)) {
            return this.literal();
        }

        // Check for interactive expressions
        if (this.check(TokenType.PROMPT)) {
            return this.promptExpression();
        }

        if (this.check(TokenType.INPUT)) {
            return this.inputExpression();
        }

        // Check for array literal
        if (this.check(TokenType.LBRACKET)) {
            return this.arrayLiteral();
        }

        // Check for identifier or function call
        if (this.check(TokenType.IDENTIFIER)) {
            const token = this.advance();

            // Check for function call
            if (this.match(TokenType.LPAREN)) {
                const args = this.argumentList();
                return {
                    type: 'FunctionCall',
                    callee: {
                        type: 'Identifier',
                        name: token.value,
                        location: this.makeLocation(token, token),
                    } as IdentifierAST,
                    arguments: args,
                    location: this.makeLocation(token, this.previous()),
                } as FunctionCallAST;
            }

            return {
                type: 'Identifier',
                name: token.value,
                location: this.makeLocation(token, token),
            } as IdentifierAST;
        }

        // Parenthesized expression
        if (this.match(TokenType.LPAREN)) {
            const expr = this.expression();
            this.consume(TokenType.RPAREN, "Expected ')'");
            return expr;
        }

        throw this.error(this.peek(), "Expected expression");
    }

    // literal = STRING | NUMBER | BOOLEAN | NULL
    private literal(): LiteralAST {
        const token = this.advance();
        let value: string | number | boolean | null;
        let literalType: 'string' | 'number' | 'boolean' | 'null';

        switch (token.type) {
            case TokenType.STRING:
                value = token.value;
                literalType = 'string';
                break;
            case TokenType.NUMBER:
                value = parseFloat(token.value);
                literalType = 'number';
                break;
            case TokenType.BOOLEAN:
                value = token.value.toLowerCase() === 'true';
                literalType = 'boolean';
                break;
            case TokenType.NULL:
                value = null;
                literalType = 'null';
                break;
            default:
                throw this.error(token, "Expected literal");
        }

        return {
            type: 'Literal',
            value,
            literalType,
            location: this.makeLocation(token, token),
        };
    }

    // ============================================
    // INTERACTIVE STATEMENTS
    // ============================================

    // alertStatement = "alert" "(" expression ("," alertType)? ")"
    private alertStatement(): AlertStatementAST {
        const startToken = this.consume(TokenType.ALERT, "Expected 'alert'");
        this.consume(TokenType.LPAREN, "Expected '(' after 'alert'");

        const message = this.expression();

        let alertType: AlertType = 'info';
        if (this.match(TokenType.COMMA)) {
            const typeToken = this.consume(TokenType.STRING, "Expected alert type string");
            const typeValue = typeToken.value.toLowerCase();
            if (['info', 'warning', 'error', 'success'].includes(typeValue)) {
                alertType = typeValue as AlertType;
            } else {
                this.errors.push({
                    message: `Invalid alert type: "${typeValue}". Expected: info, warning, error, success`,
                    line: typeToken.line,
                    column: typeToken.column,
                });
            }
        }

        this.consume(TokenType.RPAREN, "Expected ')' after alert arguments");

        return {
            type: 'AlertStatement',
            message,
            alertType,
            location: this.makeLocation(startToken, this.previous()),
        };
    }

    // notifyStatement = "notify" "(" expression ("," NUMBER)? ")"
    private notifyStatement(): NotifyStatementAST {
        const startToken = this.consume(TokenType.NOTIFY, "Expected 'notify'");
        this.consume(TokenType.LPAREN, "Expected '(' after 'notify'");

        const message = this.expression();

        let duration = 3000;
        if (this.match(TokenType.COMMA)) {
            const durationToken = this.consume(TokenType.NUMBER, "Expected duration number");
            duration = parseInt(durationToken.value, 10);
        }

        this.consume(TokenType.RPAREN, "Expected ')' after notify arguments");

        return {
            type: 'NotifyStatement',
            message,
            duration,
            location: this.makeLocation(startToken, this.previous()),
        };
    }

    // ============================================
    // INTERACTIVE EXPRESSIONS
    // ============================================

    // promptExpression = "prompt" "(" expression ("," expression)? ")"
    private promptExpression(): PromptExpressionAST {
        const startToken = this.consume(TokenType.PROMPT, "Expected 'prompt'");
        this.consume(TokenType.LPAREN, "Expected '(' after 'prompt'");

        const message = this.expression();

        let defaultValue: ExpressionAST | undefined;
        if (this.match(TokenType.COMMA)) {
            defaultValue = this.expression();
        }

        this.consume(TokenType.RPAREN, "Expected ')' after prompt arguments");

        return {
            type: 'PromptExpression',
            message,
            defaultValue,
            location: this.makeLocation(startToken, this.previous()),
        };
    }

    // inputExpression = "input" "(" expression "," inputType ("," defaultValue)? ")"
    private inputExpression(): InputExpressionAST {
        const startToken = this.consume(TokenType.INPUT, "Expected 'input'");
        this.consume(TokenType.LPAREN, "Expected '(' after 'input'");

        const message = this.expression();
        this.consume(TokenType.COMMA, "Expected ',' after message");

        const typeToken = this.consume(TokenType.STRING, "Expected input type");
        const inputType = typeToken.value.toLowerCase() as InputType;

        if (!['string', 'number', 'boolean', 'date', 'select'].includes(inputType)) {
            this.errors.push({
                message: `Invalid input type: "${inputType}". Expected: string, number, boolean, date, select`,
                line: typeToken.line,
                column: typeToken.column,
            });
        }

        let defaultValue: ExpressionAST | undefined;
        let options: ExpressionAST[] | undefined;

        if (this.match(TokenType.COMMA)) {
            if (inputType === 'select') {
                // Parse array literal for options
                const arrayLiteral = this.arrayLiteral();
                options = arrayLiteral.elements;
            } else {
                defaultValue = this.expression();
            }
        }

        this.consume(TokenType.RPAREN, "Expected ')' after input arguments");

        return {
            type: 'InputExpression',
            message,
            inputType,
            defaultValue,
            options,
            location: this.makeLocation(startToken, this.previous()),
        };
    }

    // arrayLiteral = "[" (expression ("," expression)*)? "]"
    private arrayLiteral(): ArrayLiteralAST {
        const startToken = this.consume(TokenType.LBRACKET, "Expected '[' for array");

        const elements: ExpressionAST[] = [];

        if (!this.check(TokenType.RBRACKET)) {
            do {
                elements.push(this.expression());
            } while (this.match(TokenType.COMMA));
        }

        this.consume(TokenType.RBRACKET, "Expected ']' after array elements");

        return {
            type: 'ArrayLiteral',
            elements,
            location: this.makeLocation(startToken, this.previous()),
        };
    }

    // Helper methods
    private skipNewlines(): void {
        while (this.match(TokenType.NEWLINE)) {
            // Skip
        }
    }

    private match(...types: TokenType[]): boolean {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    private check(type: TokenType): boolean {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }

    private advance(): Token {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    private isAtEnd(): boolean {
        return this.peek().type === TokenType.EOF;
    }

    private peek(): Token {
        return this.tokens[this.current];
    }

    private previous(): Token {
        return this.tokens[this.current - 1];
    }

    private consume(type: TokenType, message: string): Token {
        if (this.check(type)) return this.advance();
        throw this.error(this.peek(), message);
    }

    private error(token: Token, message: string): Error {
        this.errors.push({
            message,
            line: token.line,
            column: token.column,
        });
        return new Error(message);
    }

    private makeLocation(start: Token, end: Token) {
        return {
            start: { line: start.line, column: start.column },
            end: { line: end.line, column: end.column },
        };
    }
}

export function parse(tokens: Token[]): ParserResult {
    const parser = new JjtlParser(tokens);
    return parser.parse();
}
