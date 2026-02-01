/**
 * JjTL Parser
 * Converts tokens into AST
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
    MultiplicityAST,
    HelperAST,
    ParameterAST,
    ParserResult,
    ParserError,
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

        this.consume(TokenType.FROM, "Expected 'from'");
        const sourceMetamodel = this.consume(TokenType.IDENTIFIER, "Expected source metamodel name").value;

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

    // mappingBody = attributeMapping*
    private mappingBody(): AttributeMappingAST[] {
        const mappings: AttributeMappingAST[] = [];

        this.skipNewlines();

        while (!this.check(TokenType.RBRACE) && !this.isAtEnd()) {
            mappings.push(this.attributeMapping());
            this.skipNewlines();
        }

        return mappings;
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

    // expression = primary ("." IDENTIFIER ("(" arguments? ")")?)*
    private expression(): ExpressionAST {
        let expr = this.primary();

        while (this.match(TokenType.DOT)) {
            const property = this.consume(TokenType.IDENTIFIER, "Expected property name").value;

            if (this.match(TokenType.LPAREN)) {
                // Function call
                const args: ExpressionAST[] = [];
                if (!this.check(TokenType.RPAREN)) {
                    do {
                        args.push(this.expression());
                    } while (this.match(TokenType.COMMA));
                }
                this.consume(TokenType.RPAREN, "Expected ')'");

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
                };
            } else {
                // Member access
                expr = {
                    type: 'MemberAccess',
                    object: expr,
                    property,
                    location: this.makeLocation(this.previous(), this.previous()),
                };
            }
        }

        return expr;
    }

    // primary = IDENTIFIER | literal | "(" expression ")"
    private primary(): ExpressionAST {
        if (this.check(TokenType.BOOLEAN) || this.check(TokenType.NUMBER) || this.check(TokenType.STRING)) {
            return this.literal();
        }

        if (this.check(TokenType.IDENTIFIER)) {
            const token = this.advance();

            // Check for function call
            if (this.match(TokenType.LPAREN)) {
                const args: ExpressionAST[] = [];
                if (!this.check(TokenType.RPAREN)) {
                    do {
                        args.push(this.expression());
                    } while (this.match(TokenType.COMMA));
                }
                this.consume(TokenType.RPAREN, "Expected ')'");

                return {
                    type: 'FunctionCall',
                    callee: {
                        type: 'Identifier',
                        name: token.value,
                        location: this.makeLocation(token, token),
                    } as IdentifierAST,
                    arguments: args,
                    location: this.makeLocation(token, this.previous()),
                };
            }

            return {
                type: 'Identifier',
                name: token.value,
                location: this.makeLocation(token, token),
            };
        }

        if (this.match(TokenType.LPAREN)) {
            const expr = this.expression();
            this.consume(TokenType.RPAREN, "Expected ')'");
            return expr;
        }

        throw this.error(this.peek(), "Expected expression");
    }

    // literal = STRING | NUMBER | BOOLEAN
    private literal(): LiteralAST {
        const token = this.advance();
        let value: string | number | boolean;
        let literalType: 'string' | 'number' | 'boolean';

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
