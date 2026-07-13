/**
 * JjScript Parser
 * Parses tokenized JjScript input into an Abstract Syntax Tree
 */

import { Lexer, tokenize } from './lexer';
import {
    parseQualifiedName,
    parseMultiplicity,
    parseTypeReference,
    parseLiteralValue,
    suggestCorrection
} from './grammar';
import {
    Token,
    TokenType,
    CommandNode,
    CommandType,
    ElementType,
    ParseResult,
    ParseError,
    CreateArgs,
    DeleteArgs,
    RenameArgs,
    SetArgs,
    AddArgs,
    RemoveArgs,
    MoveArgs,
    CopyArgs,
    ListArgs,
    ShowArgs,
    HelpArgs,
    UndoRedoArgs,
    ClearArgs,
    ValidateArgs,
    ExtendsArgs,
    EvalArgs,
    LetArgs,
    ForAllArgs,
    AbstractArgs,
    BlockArgs,
    CreateOptions,
    QualifiedName,
    COMMANDS,
    ELEMENT_TYPES,
    KEYWORDS
} from '../types';

// ============================================
// PARSER CLASS
// ============================================

/** JjEL expression trigger keywords — when these appear as the first token, the entire input is treated as a JjEL expression.
 *  Note: 'forall' is handled separately to distinguish JjScript forall...do from JjEL forall. */
const JJEL_EXPRESSION_TRIGGERS = ['exists', 'with'];

export class Parser {
    private tokens: Token[] = [];
    private current: number = 0;
    private errors: ParseError[] = [];
    private originalInput: string = '';

    /**
     * Parse input string into AST
     */
    parse(input: string, opts?: { strict?: boolean }): ParseResult {
        // Tokenize
        this.tokens = tokenize(input);
        this.current = 0;
        this.errors = [];
        this.originalInput = input;

        // Skip leading newlines
        while (this.check('NEWLINE')) {
            this.advance();
        }

        // Empty input
        if (this.isAtEnd() || this.check('EOF')) {
            return {
                success: false,
                errors: [{ message: 'Empty command', position: { line: 1, column: 1 } }],
                tokens: this.tokens
            };
        }

        try {
            const ast = this.parseCommand();
            if (opts?.strict) {
                // Strict mode (used by detect()): require the whole input to be
                // consumed, so trailing natural-language tokens don't parse clean.
                while (this.check('NEWLINE')) this.advance();
                if (!this.isAtEnd() && !this.check('EOF')) {
                    this.errors.push({
                        message: 'Unexpected trailing input',
                        position: this.currentPosition()
                    });
                }
            }
            return {
                success: this.errors.length === 0,
                ast: this.errors.length === 0 ? ast : undefined,
                errors: this.errors.length > 0 ? this.errors : undefined,
                tokens: this.tokens
            };
        } catch (e) {
            const error = e as Error;
            this.errors.push({
                message: error.message,
                position: this.currentPosition()
            });
            return {
                success: false,
                errors: this.errors,
                tokens: this.tokens
            };
        }
    }

    // ============================================
    // COMMAND PARSING
    // ============================================

    private parseCommand(): CommandNode {
        const token = this.peek();
        const position = { line: token.line, column: token.column };

        // Special case: forall — JjScript (forall...do) vs JjEL (forall...:/such that)
        if ((token.type === 'IDENTIFIER' || token.type === 'KEYWORD' || token.type === 'COMMAND') &&
            token.value.toLowerCase() === 'forall') {
            if (this.isForAllDoCommand()) {
                const args = this.parseForAllCommand();
                return { type: 'Command', command: 'forall', args, position };
            } else {
                // No 'do' found → delegate remaining input to JjEL
                const args: EvalArgs = { command: 'eval', expression: this.remainingInput() };
                return { type: 'Command', command: 'eval', args, position };
            }
        }

        // Special case: JjEL expression triggers (exists, with)
        // The remaining input is passed as-is to JjEL for evaluation
        if ((token.type === 'IDENTIFIER' || token.type === 'KEYWORD') &&
            JJEL_EXPRESSION_TRIGGERS.includes(token.value.toLowerCase())) {
            const args: EvalArgs = { command: 'eval', expression: this.remainingInput() };
            return { type: 'Command', command: 'eval', args, position };
        }

        // Special case: "abstract ClassName" — toggle abstract flag on a class
        // When 'abstract' is followed by an identifier (not 'class'), it's the toggle command
        // Note: 'abstract' is in both COMMANDS and KEYWORDS, so the lexer may tokenize it as COMMAND
        if ((token.type === 'IDENTIFIER' || token.type === 'KEYWORD' || token.type === 'COMMAND') &&
            token.value.toLowerCase() === 'abstract') {
            const nextToken = this.peekNext();
            if (nextToken && (nextToken.type === 'IDENTIFIER' || nextToken.type === 'QUALIFIED_NAME') &&
                nextToken.value.toLowerCase() !== 'class') {
                this.advance(); // consume 'abstract'
                const target = this.parseQualifiedNameToken();
                const args: AbstractArgs = { command: 'abstract', target };
                return { type: 'Command', command: 'abstract', args, position };
            }
        }

        // Special case: "ChildClass extends ParentClass" syntax
        // Check if first token is identifier/qualified_name and next is 'extends'
        if ((token.type === 'IDENTIFIER' || token.type === 'QUALIFIED_NAME') &&
            this.peekNext()?.value.toLowerCase() === 'extends') {
            const args = this.parseExtendsCommand();
            return { type: 'Command', command: 'extends', args, position };
        }

        // Standalone do...end block
        if ((token.type === 'IDENTIFIER' || token.type === 'KEYWORD') &&
            token.value.toLowerCase() === 'do') {
            this.advance(); // consume 'do'
            const commands = this.parseBlockBody();
            const args: BlockArgs = { command: 'block', commands };
            return { type: 'Command', command: 'block', args, position };
        }

        if (token.type !== 'COMMAND') {
            // Not a known command — delegate remaining input to JjEL as an expression
            const args: EvalArgs = { command: 'eval', expression: this.remainingInput() };
            return { type: 'Command', command: 'eval', args, position };
        }

        const command = token.value.toLowerCase() as CommandType;
        this.advance();

        let args;
        switch (command) {
            case 'create':
                args = this.parseCreateCommand();
                break;
            case 'delete':
                args = this.parseDeleteCommand();
                break;
            case 'rename':
                args = this.parseRenameCommand();
                break;
            case 'set':
                args = this.parseSetCommand();
                break;
            case 'add':
                args = this.parseAddCommand();
                break;
            case 'remove':
                args = this.parseRemoveCommand();
                break;
            case 'move':
                args = this.parseMoveCommand();
                break;
            case 'copy':
                args = this.parseCopyCommand();
                break;
            case 'list':
                args = this.parseListCommand();
                break;
            case 'show':
                args = this.parseShowCommand();
                break;
            case 'help':
                args = this.parseHelpCommand();
                break;
            case 'undo':
            case 'redo':
                args = this.parseUndoRedoCommand(command);
                break;
            case 'clear':
                args = this.parseClearCommand();
                break;
            case 'validate':
                args = this.parseValidateCommand();
                break;
            case 'eval':
                args = this.parseEvalCommand();
                break;
            case 'let':
                args = this.parseLetCommand();
                break;
            case 'forall':
                args = this.parseForAllCommand();
                break;
            case 'abstract': {
                // Fallback: 'abstract' reached the switch (e.g., typed alone without a target)
                const target = this.parseQualifiedNameToken();
                args = { command: 'abstract', target } as AbstractArgs;
                break;
            }
            default:
                throw new Error(`Unknown command: ${command}`);
        }

        return { type: 'Command', command, args, position };
    }

    // ============================================
    // CREATE COMMAND
    // ============================================

    private parseCreateCommand(): CreateArgs {
        // Parse element type (e.g., "class", "abstract class", "attribute")
        const elementType = this.parseElementType();

        // M1: 'create instance of <ClassName>' requires the 'of' keyword.
        // The class name follows; the optional instance name is parsed in parseCreateOptions.
        if (elementType === 'instance') {
            if (!this.matchKeyword('of')) {
                throw new Error(
                    "Expected 'of' after 'create instance'. " +
                    "Syntax: create instance of <ClassName> [\"<instanceName>\"]"
                );
            }
        }

        // Parse name
        const name = this.expectIdentifierOrQualified('element name');

        // Parse optional parent context (in Package, in Class)
        let parent: QualifiedName | undefined;
        if (this.matchKeyword('in')) {
            parent = this.parseQualifiedNameToken();
        }

        // Parse options
        const options = this.parseCreateOptions(elementType);

        return {
            command: 'create',
            elementType,
            name: typeof name === 'string' ? name : name.segments[name.segments.length - 1],
            parent: typeof name === 'string' ? parent : name,
            options
        };
    }

    private parseElementType(): ElementType {
        // Check for "abstract class" or "interface"
        if (this.checkKeyword('abstract')) {
            this.advance();
            if (this.checkKeyword('class')) {
                this.advance();
                return 'abstract class';
            }
            throw new Error("Expected 'class' after 'abstract'");
        }

        const token = this.peek();
        if (token.type === 'KEYWORD' || token.type === 'IDENTIFIER') {
            const value = token.value.toLowerCase();

            // Handle element types
            // Note: 'containment' and 'composition' are shortcuts for "reference ... containment"
            const elementTypes: ElementType[] = [
                'class', 'interface', 'attribute', 'reference',
                'containment', 'composition',  // Shortcuts for containment references
                'operation', 'parameter', 'package', 'enum', 'enumeration', 'literal',
                'model', 'metamodel', 'project', 'annotation',
                'instance'   // M1: DObject instance
            ];

            if (elementTypes.includes(value as ElementType)) {
                this.advance();
                return value as ElementType;
            }
        }

        const suggestion = suggestCorrection(token.value, ELEMENT_TYPES);
        const msg = suggestion
            ? `Expected element type (class, attribute, etc.), found '${token.value}'. Did you mean '${suggestion}'?`
            : `Expected element type (class, attribute, reference, etc.), found '${token.value}'`;
        throw new Error(msg);
    }

    private parseCreateOptions(elementType: ElementType): CreateOptions | undefined {
        const options: CreateOptions = {};
        let hasOptions = false;

        // Parse options based on element type
        while (!this.isAtEnd() && !this.check('NEWLINE') && !this.check('EOF')) {
            // M1: instance name as positional STRING after class name
            // e.g., "create instance Customer \"Alice\"" — Alice is the instance name.
            // Reuses options.defaultValue as the carrier (read by executeCreateInstance).
            if (elementType === 'instance' && this.check('STRING') && !options.defaultValue) {
                options.defaultValue = { kind: 'string', value: this.advance().value };
                hasOptions = true;
                continue;
            }

            // type: TypeName
            if (this.matchKeyword('type') || this.matchOperator(':')) {
                options.type = parseTypeReference(this.expectIdentifierOrQualified('type name') as string);
                hasOptions = true;
                continue;
            }

            // extends: SuperClass
            if (this.matchKeyword('extends')) {
                const superClass = this.parseQualifiedNameToken();
                if (!options.superClasses) options.superClasses = [];
                options.superClasses.push(superClass);
                options.superClass = superClass;
                hasOptions = true;
                continue;
            }

            // [multiplicity]
            if (this.check('MULTIPLICITY')) {
                options.multiplicity = parseMultiplicity(this.advance().value);
                hasOptions = true;
                continue;
            }

            // default: value
            if (this.matchKeyword('default')) {
                if (this.matchOperator('=') || this.matchOperator(':')) {
                    // optional = or :
                }
                options.defaultValue = this.parseLiteralValueToken();
                hasOptions = true;
                continue;
            }

            // opposite: referenceName
            if (this.matchKeyword('opposite')) {
                options.opposite = this.parseQualifiedNameToken();
                hasOptions = true;
                continue;
            }

            // Boolean flags
            if (this.matchKeyword('abstract')) { options.abstract = true; hasOptions = true; continue; }
            if (this.matchKeyword('derived')) { options.derived = true; hasOptions = true; continue; }
            if (this.matchKeyword('readonly')) { options.readonly = true; hasOptions = true; continue; }
            if (this.matchKeyword('transient')) { options.transient = true; hasOptions = true; continue; }
            if (this.matchKeyword('volatile')) { options.volatile = true; hasOptions = true; continue; }
            if (this.matchKeyword('unsettable')) { options.unsettable = true; hasOptions = true; continue; }
            if (this.matchKeyword('containment')) { options.containment = true; hasOptions = true; continue; }
            if (this.matchKeyword('container')) { options.container = true; hasOptions = true; continue; }
            if (this.matchKeyword('id')) { options.id = true; hasOptions = true; continue; }

            // returnType for operations
            if (this.matchKeyword('returns') || this.matchKeyword('return')) {
                options.returnType = parseTypeReference(this.expectIdentifierOrQualified('return type') as string);
                hasOptions = true;
                continue;
            }

            // value for enum literals
            if (this.matchKeyword('value') || this.matchOperator('=')) {
                const valueToken = this.peek();
                if (valueToken.type === 'NUMBER') {
                    options.value = parseInt(this.advance().value, 10);
                    hasOptions = true;
                }
                continue;
            }

            // nsUri, nsPrefix for packages
            if (this.matchKeyword('nsuri') || this.matchKeyword('uri')) {
                if (this.matchOperator('=')) {
                    // optional =
                }
                const uriToken = this.peek();
                if (uriToken.type === 'STRING') {
                    options.nsUri = this.advance().value;
                    hasOptions = true;
                }
                continue;
            }

            if (this.matchKeyword('nsprefix') || this.matchKeyword('prefix')) {
                if (this.matchOperator('=')) {
                    // optional =
                }
                options.nsPrefix = this.expectIdentifierOrString('namespace prefix');
                hasOptions = true;
                continue;
            }

            // If we can't parse more options, break
            break;
        }

        return hasOptions ? options : undefined;
    }

    // ============================================
    // DELETE COMMAND
    // ============================================

    private parseDeleteCommand(): DeleteArgs {
        // Check if an element type is specified (e.g., "delete class MyClass")
        // This is optional - "delete MyClass" also works
        let elementType: ElementType | undefined;
        const token = this.peek();

        if (token.type === 'KEYWORD' || token.type === 'IDENTIFIER') {
            const value = token.value.toLowerCase();
            const elementTypes: ElementType[] = [
                'class', 'interface', 'attribute', 'reference',
                'operation', 'parameter', 'package', 'enum', 'enumeration', 'literal',
                'instance'   // M1: DObject instance
            ];

            if (elementTypes.includes(value as ElementType)) {
                elementType = value as ElementType;
                this.advance();
            }
        }

        let target = this.parseQualifiedNameToken();

        // Check for "in <parent>" clause (e.g., "delete attribute name in MyClass")
        // This creates a qualified target: MyClass.name — same pattern as parseRenameCommand
        if (this.matchKeyword('in')) {
            const parent = this.parseQualifiedNameToken();
            const elementName = target.segments[target.segments.length - 1];
            target = {
                segments: parent.segments,
                member: elementName,
                raw: `${parent.raw}.${elementName}`
            };
        }

        let cascade = false;
        let force = false;

        while (!this.isAtEnd() && !this.check('NEWLINE') && !this.check('EOF')) {
            if (this.matchKeyword('cascade')) { cascade = true; continue; }
            if (this.matchKeyword('force')) { force = true; continue; }
            break;
        }

        return { command: 'delete', target, cascade, force, elementType };
    }

    // ============================================
    // RENAME COMMAND
    // ============================================

    private parseRenameCommand(): RenameArgs {
        // Check if an element type is specified (e.g., "rename class MyClass to NewName")
        // This is optional - "rename MyClass to NewName" also works
        let elementType: ElementType | undefined;
        const token = this.peek();

        if (token.type === 'KEYWORD' || token.type === 'IDENTIFIER') {
            const value = token.value.toLowerCase();
            const elementTypes: ElementType[] = [
                'class', 'interface', 'attribute', 'reference',
                'operation', 'parameter', 'package', 'enum', 'enumeration', 'literal',
                'instance'   // M1: DObject instance
            ];

            if (elementTypes.includes(value as ElementType)) {
                elementType = value as ElementType;
                this.advance();
            }
        }

        // Parse element name
        let target = this.parseQualifiedNameToken();

        // Check for "in <parent>" clause (e.g., "rename attribute attr_0 in MyClass to newName")
        // This creates a qualified target: MyClass.attr_0
        if (this.matchKeyword('in')) {
            const parent = this.parseQualifiedNameToken();
            // Reconstruct target as parent.elementName
            const elementName = target.segments[target.segments.length - 1];
            target = {
                segments: parent.segments,
                member: elementName,
                raw: `${parent.raw}.${elementName}`
            };
        }

        // Expect 'to' or 'as'
        if (!this.matchKeyword('to') && !this.matchKeyword('as')) {
            throw new Error("Expected 'to' or 'as' after target in rename command");
        }

        const newName = this.expectIdentifier('new name');

        return { command: 'rename', target, newName, elementType };
    }

    // ============================================
    // SET COMMAND
    // ============================================

    private parseSetCommand(): SetArgs {
        const target = this.parseQualifiedNameToken();

        // Property name (could be part of qualified name or separate)
        let property: string;
        if (target.member) {
            property = target.member;
            target.member = undefined;
        } else {
            if (this.matchOperator('.')) {
                property = this.expectIdentifier('property name');
            } else {
                property = this.expectIdentifier('property name');
            }
        }

        // Operator (=, +=, -=)
        let operator: '=' | '+=' | '-=' = '=';
        if (this.matchOperator('+=')) {
            operator = '+=';
        } else if (this.matchOperator('-=')) {
            operator = '-=';
        } else if (this.matchOperator('=')) {
            operator = '=';
        } else if (this.matchKeyword('to')) {
            operator = '=';
        }

        // Value
        const value = this.parseValueOrQualified();

        return { command: 'set', target, property, value, operator };
    }

    // ============================================
    // ADD COMMAND
    // ============================================

    private parseAddCommand(): AddArgs {
        const elementType = this.parseElementType();
        const name = this.expectIdentifier('element name');

        // Expect 'to'
        if (!this.matchKeyword('to') && !this.matchKeyword('in')) {
            throw new Error("Expected 'to' or 'in' after element name in add command");
        }

        const to = this.parseQualifiedNameToken();
        const options = this.parseCreateOptions(elementType);

        return { command: 'add', elementType, name, to, options };
    }

    // ============================================
    // REMOVE COMMAND
    // ============================================

    private parseRemoveCommand(): RemoveArgs {
        // Special case: "remove extends from ChildClass" - clear all inheritance
        if (this.checkKeyword('extends')) {
            this.advance(); // consume 'extends'

            // Expect 'from'
            if (!this.matchKeyword('from')) {
                throw new Error("Expected 'from' after 'extends' in remove command");
            }

            const from = this.parseQualifiedNameToken();

            // Use special marker for extends removal
            return {
                command: 'remove',
                target: { segments: ['__extends__'], raw: '__extends__' },
                from
            };
        }

        const target = this.parseQualifiedNameToken();

        // Expect 'from'
        if (!this.matchKeyword('from')) {
            throw new Error("Expected 'from' after target in remove command");
        }

        const from = this.parseQualifiedNameToken();

        return { command: 'remove', target, from };
    }

    // ============================================
    // MOVE COMMAND
    // ============================================

    private parseMoveCommand(): MoveArgs {
        const target = this.parseQualifiedNameToken();

        // Expect 'to'
        if (!this.matchKeyword('to')) {
            throw new Error("Expected 'to' after target in move command");
        }

        const to = this.parseQualifiedNameToken();

        return { command: 'move', target, to };
    }

    // ============================================
    // COPY COMMAND
    // ============================================

    private parseCopyCommand(): CopyArgs {
        const target = this.parseQualifiedNameToken();

        // Expect 'to'
        if (!this.matchKeyword('to')) {
            throw new Error("Expected 'to' after target in copy command");
        }

        const to = this.parseQualifiedNameToken();

        let newName: string | undefined;
        let deep = false;

        while (!this.isAtEnd() && !this.check('NEWLINE') && !this.check('EOF')) {
            if (this.matchKeyword('as')) {
                newName = this.expectIdentifier('new name');
                continue;
            }
            if (this.matchKeyword('deep')) {
                deep = true;
                continue;
            }
            break;
        }

        return { command: 'copy', target, to, newName, deep };
    }

    // ============================================
    // LIST COMMAND
    // ============================================

    private parseListCommand(): ListArgs {
        let elementType: ElementType | 'all' | undefined;

        // Mapping plurals to singular element types
        const pluralToSingular: Record<string, ElementType> = {
            'classes': 'class',
            'attributes': 'attribute',
            'references': 'reference',
            'operations': 'operation',
            'parameters': 'parameter',
            'packages': 'package',
            'enums': 'enum',
            'enumerations': 'enumeration',
            'literals': 'literal',
            'models': 'model',
            'metamodels': 'metamodel',
            'projects': 'project',
            'annotations': 'annotation',
            'interfaces': 'interface'
        };

        // Optional element type filter
        if (!this.isAtEnd() && !this.check('NEWLINE') && !this.check('EOF')) {
            if (this.checkKeyword('all')) {
                this.advance();
                elementType = 'all';
            } else if (this.peek().type === 'KEYWORD' || this.peek().type === 'IDENTIFIER') {
                const value = this.peek().value.toLowerCase();

                // Check for plural form first
                if (pluralToSingular[value]) {
                    this.advance();
                    elementType = pluralToSingular[value];
                } else if (ELEMENT_TYPES.includes(value as ElementType)) {
                    elementType = this.parseElementType();
                }
            }
        }

        // Parse filters
        let filter: ListArgs['filter'];
        while (!this.isAtEnd() && !this.check('NEWLINE') && !this.check('EOF')) {
            if (this.matchKeyword('in')) {
                if (!filter) filter = {};
                filter.in = this.parseQualifiedNameToken();
                continue;
            }
            break;
        }

        return { command: 'list', elementType, filter };
    }

    // ============================================
    // SHOW COMMAND
    // ============================================

    private parseShowCommand(): ShowArgs {
        let target: QualifiedName | 'project' | 'model';
        let detail: 'brief' | 'full' | 'tree' | undefined;

        if (this.checkKeyword('project')) {
            this.advance();
            target = 'project';
        } else if (this.checkKeyword('model')) {
            this.advance();
            target = 'model';
        } else {
            target = this.parseQualifiedNameToken();
        }

        // Parse detail level
        if (this.matchKeyword('brief')) detail = 'brief';
        else if (this.matchKeyword('full')) detail = 'full';
        else if (this.matchKeyword('tree')) detail = 'tree';

        return { command: 'show', target, detail };
    }

    // ============================================
    // HELP COMMAND
    // ============================================

    private parseHelpCommand(): HelpArgs {
        let topic: HelpArgs['topic'];

        if (!this.isAtEnd() && !this.check('NEWLINE') && !this.check('EOF')) {
            const token = this.peek();
            if (token.type === 'COMMAND' || token.type === 'KEYWORD' || token.type === 'IDENTIFIER') {
                this.advance();
                topic = token.value.toLowerCase() as HelpArgs['topic'];
            }
        }

        return { command: 'help', topic };
    }

    // ============================================
    // UNDO/REDO COMMAND
    // ============================================

    private parseUndoRedoCommand(command: 'undo' | 'redo'): UndoRedoArgs {
        let steps: number | undefined;

        if (this.check('NUMBER')) {
            steps = parseInt(this.advance().value, 10);
        }

        return { command, steps };
    }

    // ============================================
    // CLEAR COMMAND
    // ============================================

    private parseClearCommand(): ClearArgs {
        let target: 'history' | 'selection' | 'console' | undefined;

        if (this.matchKeyword('history')) target = 'history';
        else if (this.matchKeyword('selection')) target = 'selection';
        else if (this.matchKeyword('console')) target = 'console';

        return { command: 'clear', target };
    }

    // ============================================
    // VALIDATE COMMAND
    // ============================================

    private parseValidateCommand(): ValidateArgs {
        let target: QualifiedName | 'all' | undefined;

        if (this.checkKeyword('all')) {
            this.advance();
            target = 'all';
        } else if (!this.isAtEnd() && !this.check('NEWLINE') && !this.check('EOF')) {
            if (this.peek().type === 'IDENTIFIER' || this.peek().type === 'QUALIFIED_NAME') {
                target = this.parseQualifiedNameToken();
            }
        }

        return { command: 'validate', target };
    }

    // ============================================
    // EXTENDS COMMAND
    // ============================================

    private parseExtendsCommand(): ExtendsArgs {
        // Syntax: ChildClass extends ParentClass
        const childClass = this.parseQualifiedNameToken();

        // Expect 'extends' keyword
        if (!this.matchKeyword('extends')) {
            throw new Error("Expected 'extends' keyword");
        }

        const parentClass = this.parseQualifiedNameToken();

        return { command: 'extends', childClass, parentClass };
    }

    // ============================================
    // LET COMMAND
    // ============================================

    private parseLetCommand(): LetArgs {
        const bindings: LetArgs['bindings'] = [];

        do {
            this.skipNewlines();

            // Parse $identifier
            const name = this.consumeDollarIdentifier();

            this.skipNewlines();

            // Expect '='
            if (!this.matchOperator('=')) {
                throw new Error("Expected '=' after variable name in let binding");
            }

            this.skipNewlines();

            // Collect raw value expression until ',' or 'in' at depth 0
            const valueExpr = this.collectValueExprRaw();
            if (!valueExpr) {
                throw new Error(`Expected expression after '=' for variable ${name}`);
            }

            bindings.push({ name, valueExpr });
        } while (this.matchComma());

        this.skipNewlines();

        // Expect 'in'
        if (!this.matchKeyword('in')) {
            throw new Error("Expected 'in' after let bindings");
        }

        this.skipNewlines();

        // Parse body — single command or multiple commands until 'end'
        const body = this.parseBlockOrCommand();

        return { command: 'let', bindings, body };
    }

    /**
     * Consume a $identifier token pair (PUNCTUATION '$' + IDENTIFIER).
     * Returns the combined string including the '$' sigil.
     */
    private consumeDollarIdentifier(): string {
        const dollarToken = this.peek();
        if (dollarToken.type !== 'PUNCTUATION' || dollarToken.value !== '$') {
            throw new Error("Expected '$' before variable name in let binding");
        }
        this.advance(); // consume '$'

        const identToken = this.peek();
        if (identToken.type !== 'IDENTIFIER' && identToken.type !== 'KEYWORD') {
            throw new Error("Expected variable name after '$'");
        }
        this.advance();
        return '$' + identToken.value;
    }

    /**
     * Collect raw expression text from the original input until we hit
     * ',' or 'in' at parenthesis depth 0 (or end of input).
     * Uses original input positions for faithful reproduction.
     */
    private collectValueExprRaw(): string {
        const startToken = this.peek();
        const startPos = startToken.position;
        let parenDepth = 0;
        let forallExistsDepth = 0;

        while (!this.isAtEnd() && !this.check('EOF')) {
            const token = this.peek();

            if (token.type === 'PUNCTUATION') {
                if (token.value === '(') parenDepth++;
                else if (token.value === ')') { if (parenDepth > 0) parenDepth--; }
                else if (token.value === ',' && parenDepth === 0 && forallExistsDepth === 0) break;
            }

            // Track forall/exists nesting — each expects a following 'in'
            // Note: forall/exists are not in KEYWORDS, so they tokenize as IDENTIFIER
            if ((token.type === 'KEYWORD' || token.type === 'IDENTIFIER') && (token.value === 'forall' || token.value === 'exists')) {
                forallExistsDepth++;
            }

            // 'in' keyword: if inside a forall/exists, it belongs to that construct
            if (token.type === 'KEYWORD' && token.value === 'in') {
                if (forallExistsDepth > 0) {
                    forallExistsDepth--;
                } else if (parenDepth === 0) {
                    break; // this 'in' belongs to the let
                }
            }

            this.advance();
        }

        const endToken = this.peek();
        const endPos = endToken.position;
        return this.originalInput.substring(startPos, endPos).trim();
    }

    private matchComma(): boolean {
        const token = this.peek();
        if (token.type === 'PUNCTUATION' && token.value === ',') {
            this.advance();
            return true;
        }
        return false;
    }

    private skipNewlines(): void {
        while (this.check('NEWLINE')) {
            this.advance();
        }
    }

    /**
     * Return the unparsed remainder of the original input from the current
     * token position.  Used when delegating to JjEL so that, inside a
     * recursive parseCommand() call (e.g. let body), only the body portion
     * is forwarded — not the entire original input.
     */
    private remainingInput(): string {
        const token = this.peek();
        return this.originalInput.substring(token.position).trim();
    }

    // ============================================
    // BLOCK BODY (do...end)
    // ============================================

    /**
     * Parse multiple commands separated by ';' or newlines until 'end' keyword.
     * Consumes the 'end' keyword.
     */
    private parseBlockBody(): CommandNode[] {
        const commands: CommandNode[] = [];

        while (!this.isAtEnd() && !this.check('EOF')) {
            this.skipNewlines();
            // Skip semicolons between commands
            while (!this.isAtEnd() && this.check('PUNCTUATION') && this.peek().value === ';') {
                this.advance();
                this.skipNewlines();
            }

            if (this.isAtEnd() || this.check('EOF')) break;

            // Stop at 'end' keyword
            if (this.checkKeyword('end')) {
                this.advance(); // consume 'end'
                break;
            }

            commands.push(this.parseCommand());
        }

        return commands;
    }

    /**
     * Parse either a single command or a block (multiple commands terminated by 'end').
     * Used after 'do' in forall and after 'in' in let.
     * If the next meaningful token starts a command and 'end' appears later, collects
     * all commands until 'end'. Otherwise parses a single command.
     */
    private parseBlockOrCommand(): CommandNode {
        this.skipNewlines();

        // Check if this is a multi-command block (look for 'end' keyword ahead)
        if (this.hasEndAhead()) {
            const commands = this.parseBlockBody();
            if (commands.length === 1) return commands[0];
            const position = commands.length > 0
                ? commands[0].position
                : this.currentPosition();
            const args: BlockArgs = { command: 'block', commands };
            return { type: 'Command', command: 'block', args, position };
        }

        // Single command (no 'end' ahead)
        return this.parseCommand();
    }

    /**
     * Look ahead to check if 'end' keyword appears before end of input.
     * Used to determine if the body after 'do' / 'in' is a block or single command.
     */
    private hasEndAhead(): boolean {
        for (let i = this.current; i < this.tokens.length; i++) {
            const token = this.tokens[i];
            if (token.type === 'EOF') break;
            if ((token.type === 'IDENTIFIER' || token.type === 'KEYWORD') &&
                token.value.toLowerCase() === 'end') {
                return true;
            }
        }
        return false;
    }

    // ============================================
    // FORALL COMMAND (forall <var> in <collection> [such that <filter>] do <command>)
    // ============================================

    /**
     * Look ahead (without consuming) to check if this forall contains a 'do'
     * keyword at paren depth 0, making it a JjScript forall...do command.
     * Returns false if ':' is found first at depth 0 (JjEL projection).
     */
    private isForAllDoCommand(): boolean {
        let depth = 0;
        for (let i = this.current; i < this.tokens.length; i++) {
            const token = this.tokens[i];
            if (token.type === 'EOF' || token.type === 'NEWLINE') break;
            if (token.type === 'PUNCTUATION') {
                if (token.value === '(') depth++;
                else if (token.value === ')') depth--;
                // ':' at depth 0 → JjEL projection separator, not JjScript
                if (depth === 0 && token.value === ':') return false;
            }
            if (depth === 0 && (token.type === 'KEYWORD' || token.type === 'IDENTIFIER')
                && token.value.toLowerCase() === 'do') {
                return true;
            }
        }
        return false;
    }

    /**
     * Parse: forall <var> in <collection> [such that <filter>] do <command>
     */
    private parseForAllCommand(): ForAllArgs {
        this.advance(); // consume 'forall'

        const variable = this.expectIdentifier('variable name');

        if (!this.matchKeyword('in')) {
            throw new Error("Expected 'in' after variable name in forall");
        }

        // Collect collection expression until 'such' or 'do' at depth 0
        const collectionExpr = this.collectExprRawUntil(['do', 'such']);
        if (!collectionExpr) {
            throw new Error("Expected collection expression after 'in' in forall");
        }

        // Check for optional 'such that' filter
        let filterExpr: string | undefined;
        if (this.matchKeyword('such')) {
            if (!this.matchKeyword('that')) {
                throw new Error("Expected 'that' after 'such' in forall");
            }
            filterExpr = this.collectExprRawUntil(['do']);
            if (!filterExpr) {
                throw new Error("Expected filter expression after 'such that' in forall");
            }
        }

        // Expect 'do'
        if (!this.matchKeyword('do')) {
            throw new Error("Expected 'do' keyword in forall...do command");
        }

        // Parse body — single command or multiple commands until 'end'
        const body = this.parseBlockOrCommand();

        return { command: 'forall', variable, collectionExpr, filterExpr, body };
    }

    /**
     * Collect raw expression text from the original input until one of the
     * stop keywords at parenthesis depth 0 (or end of input).
     */
    private collectExprRawUntil(stopKeywords: string[]): string {
        const startToken = this.peek();
        const startPos = startToken.position;
        let depth = 0;

        while (!this.isAtEnd() && !this.check('EOF')) {
            const token = this.peek();

            if (token.type === 'PUNCTUATION') {
                if (token.value === '(') depth++;
                else if (token.value === ')') { if (depth > 0) depth--; }
            }

            if (depth === 0 && (token.type === 'KEYWORD' || token.type === 'IDENTIFIER')) {
                if (stopKeywords.includes(token.value.toLowerCase())) break;
            }

            this.advance();
        }

        const endToken = this.peek();
        const endPos = endToken.position;
        return this.originalInput.substring(startPos, endPos).trim();
    }

    // ============================================
    // EVAL COMMAND (explicit "eval <expression>")
    // ============================================

    private parseEvalCommand(): EvalArgs {
        // Everything after "eval" is the JjEL expression
        // Reconstruct from remaining tokens
        const parts: string[] = [];
        while (!this.isAtEnd() && !this.check('NEWLINE') && !this.check('EOF')) {
            parts.push(this.advance().value);
        }
        const expression = parts.join(' ').trim();
        if (!expression) {
            throw new Error('Expected JjEL expression after eval');
        }
        return { command: 'eval', expression };
    }

    // ============================================
    // HELPER METHODS
    // ============================================

    private parseQualifiedNameToken(): QualifiedName {
        const token = this.peek();

        if (token.type === 'QUALIFIED_NAME' || token.type === 'IDENTIFIER') {
            this.advance();
            return parseQualifiedName(token.value);
        }

        throw new Error(`Expected qualified name or identifier, found '${token.value}'`);
    }

    private parseLiteralValueToken() {
        const token = this.peek();

        if (token.type === 'STRING') {
            this.advance();
            return parseLiteralValue(`"${token.value}"`);
        }
        if (token.type === 'NUMBER') {
            this.advance();
            return parseLiteralValue(token.value);
        }
        if (token.type === 'BOOLEAN') {
            this.advance();
            return parseLiteralValue(token.value);
        }
        if (token.type === 'IDENTIFIER' || token.type === 'KEYWORD') {
            const value = token.value.toLowerCase();
            if (value === 'null' || value === 'true' || value === 'false') {
                this.advance();
                return parseLiteralValue(value);
            }
        }

        throw new Error(`Expected literal value, found '${token.value}'`);
    }

    private parseValueOrQualified() {
        const token = this.peek();

        // Check for literal values first
        if (token.type === 'STRING' || token.type === 'NUMBER' || token.type === 'BOOLEAN') {
            return this.parseLiteralValueToken();
        }

        // Check for null/true/false keywords
        if (token.type === 'IDENTIFIER' || token.type === 'KEYWORD') {
            const value = token.value.toLowerCase();
            if (value === 'null' || value === 'true' || value === 'false') {
                return this.parseLiteralValueToken();
            }
        }

        // Check for $variable reference (PUNCTUATION '$' + IDENTIFIER)
        if (token.type === 'PUNCTUATION' && token.value === '$') {
            this.advance(); // consume '$'
            const name = this.expectIdentifier('variable name');
            const raw = '$' + name;
            return { segments: [raw], raw } as QualifiedName;
        }

        // Otherwise, treat as qualified name
        return this.parseQualifiedNameToken();
    }

    private expectIdentifier(what: string): string {
        const token = this.peek();
        if (token.type === 'IDENTIFIER' || token.type === 'KEYWORD') {
            this.advance();
            return token.value;
        }
        throw new Error(`Expected ${what}, found '${token.value}'`);
    }

    private expectIdentifierOrQualified(what: string): string | QualifiedName {
        const token = this.peek();
        if (token.type === 'QUALIFIED_NAME') {
            this.advance();
            return parseQualifiedName(token.value);
        }
        if (token.type === 'IDENTIFIER' || token.type === 'KEYWORD') {
            this.advance();
            return token.value;
        }
        throw new Error(`Expected ${what}, found '${token.value}'`);
    }

    private expectIdentifierOrString(what: string): string {
        const token = this.peek();
        if (token.type === 'STRING' || token.type === 'IDENTIFIER') {
            this.advance();
            return token.value;
        }
        throw new Error(`Expected ${what}, found '${token.value}'`);
    }

    // ============================================
    // TOKEN NAVIGATION
    // ============================================

    private peek(): Token {
        return this.tokens[this.current] || { type: 'EOF', value: '', position: 0, line: 1, column: 1 };
    }

    private peekNext(): Token | undefined {
        return this.tokens[this.current + 1];
    }

    private advance(): Token {
        if (!this.isAtEnd()) {
            this.current++;
        }
        return this.tokens[this.current - 1];
    }

    private check(type: TokenType): boolean {
        return this.peek().type === type;
    }

    private checkKeyword(keyword: string): boolean {
        const token = this.peek();
        // Also accept COMMAND tokens for keywords like 'extends' that are both commands and keywords
        return (token.type === 'KEYWORD' || token.type === 'IDENTIFIER' || token.type === 'COMMAND') &&
               token.value.toLowerCase() === keyword.toLowerCase();
    }

    private matchKeyword(keyword: string): boolean {
        if (this.checkKeyword(keyword)) {
            this.advance();
            return true;
        }
        return false;
    }

    private matchOperator(op: string): boolean {
        const token = this.peek();
        if (token.type === 'OPERATOR' && token.value === op) {
            this.advance();
            return true;
        }
        return false;
    }

    private isAtEnd(): boolean {
        return this.current >= this.tokens.length || this.peek().type === 'EOF';
    }

    private currentPosition(): { line: number; column: number } {
        const token = this.peek();
        return { line: token.line, column: token.column };
    }
}

// ============================================
// CONVENIENCE FUNCTION
// ============================================

export function parse(input: string, opts?: { strict?: boolean }): ParseResult {
    const parser = new Parser();
    return parser.parse(input, opts);
}
