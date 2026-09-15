/**
 * Jjodie Command Parser
 * Parses slash commands for metamodel manipulation
 */

export interface CommandParseResult {
    success: boolean;
    command?: ParsedCommand;
    error?: string;
}

export interface ParsedCommand {
    type: CommandType;
    data: Record<string, unknown>;
    confirmationMessage: string;
}

export type CommandType =
    | 'CREATE_CLASS'
    | 'CREATE_ABSTRACT'
    | 'CREATE_ENUM'
    | 'ADD_REFERENCE'
    | 'ADD_BIDIRECTIONAL_REF'
    | 'SET_INHERITANCE'
    | 'REMOVE_INHERITANCE'
    | 'ADD_ATTRIBUTE'
    | 'REMOVE_ATTRIBUTE'
    | 'MODIFY_ATTRIBUTE'
    | 'DELETE_CLASS'
    | 'DELETE_REFERENCE'
    | 'CLEAR_METAMODEL'
    | 'QUERY_LIST'
    | 'QUERY_SHOW'
    | 'QUERY_TREE'
    | 'QUERY_CHECK'
    | 'EXPORT'
    | 'IMPORT'
    | 'UNDO'
    | 'REDO'
    | 'HELP'
    | 'EXAMPLES'
    | 'ANALYZE';

interface AttributeDefinition {
    name: string;
    type: string;
    multiplicity: string;
}

export class JjodieCommandParser {
    /**
     * Check if input is a command
     */
    static isCommand(input: string): boolean {
        return input.trim().startsWith('/');
    }

    /**
     * Parse a command string
     */
    static parse(input: string): CommandParseResult {
        const trimmed = input.trim();

        if (!trimmed.startsWith('/')) {
            return { success: false, error: 'Not a command' };
        }

        const parts = this.tokenize(trimmed);
        const commandName = parts[0].substring(1).toLowerCase();

        switch (commandName) {
            case 'create':
                return this.parseCreate(parts.slice(1));

            case 'abstract':
                return this.parseAbstract(parts.slice(1));

            case 'enum':
                return this.parseEnum(parts.slice(1));

            case 'ref':
                return this.parseReference(parts.slice(1));

            case 'biref':
                return this.parseBidirectionalRef(parts.slice(1));

            case 'extends':
                return this.parseExtends(parts.slice(1));

            case 'extends-':
                return this.parseRemoveExtends(parts.slice(1));

            case 'attr':
                return this.parseAddAttribute(parts.slice(1));

            case 'attr-':
                return this.parseRemoveAttribute(parts.slice(1));

            case 'attr~':
                return this.parseModifyAttribute(parts.slice(1));

            case 'delete':
                return this.parseDelete(parts.slice(1));

            case 'ref-':
                return this.parseDeleteReference(parts.slice(1));

            case 'clear':
                return this.parseClear(parts.slice(1));

            case 'list':
                return this.parseList(parts.slice(1));

            case 'show':
                return this.parseShow(parts.slice(1));

            case 'tree':
                return this.parseTree(parts.slice(1));

            case 'check':
                return this.parseCheck();

            case 'export':
                return this.parseExport(parts.slice(1));

            case 'import':
                return this.parseImport(parts.slice(1));

            case 'undo':
                return {
                    success: true,
                    command: {
                        type: 'UNDO',
                        data: {},
                        confirmationMessage: 'Undo last action',
                    },
                };

            case 'redo':
                return {
                    success: true,
                    command: {
                        type: 'REDO',
                        data: {},
                        confirmationMessage: 'Redo last action',
                    },
                };

            case 'help':
                return this.parseHelp(parts.slice(1));

            case 'examples':
                return this.parseExamples(parts.slice(1));

            case 'analyze':
                return this.parseAnalyze();

            default:
                return {
                    success: false,
                    error: `Unknown command: /${commandName}. Type /help for available commands.`,
                };
        }
    }

    /**
     * Tokenize command string, respecting quotes and brackets
     */
    private static tokenize(input: string): string[] {
        const tokens: string[] = [];
        let current = '';
        let inQuotes = false;
        let inBrackets = false;

        for (let i = 0; i < input.length; i++) {
            const char = input[i];

            if (char === '"' || char === "'") {
                inQuotes = !inQuotes;
                current += char;
            } else if (char === '[') {
                inBrackets = true;
                current += char;
            } else if (char === ']') {
                inBrackets = false;
                current += char;
            } else if (char === ' ' && !inQuotes && !inBrackets) {
                if (current.length > 0) {
                    tokens.push(current);
                    current = '';
                }
            } else {
                current += char;
            }
        }

        if (current.length > 0) {
            tokens.push(current);
        }

        return tokens;
    }

    /**
     * Parse /create command
     */
    private static parseCreate(parts: string[]): CommandParseResult {
        if (parts.length === 0) {
            return {
                success: false,
                error: 'Usage: /create ClassName [attr:Type [mult]] [extends:Parent] [abstract]',
            };
        }

        const className = parts[0];
        const attributes: AttributeDefinition[] = [];
        let superclass: string | undefined;
        let isAbstract = false;

        for (let i = 1; i < parts.length; i++) {
            const part = parts[i];

            if (part === 'abstract') {
                isAbstract = true;
            } else if (part.startsWith('extends:')) {
                superclass = part.substring(8);
            } else if (part.includes(':')) {
                const attr = this.parseAttributeDefinition(part, parts[i + 1]);
                if (attr) {
                    attributes.push(attr);
                    // Skip multiplicity if it was next
                    if (parts[i + 1]?.startsWith('[')) {
                        i++;
                    }
                }
            }
        }

        return {
            success: true,
            command: {
                type: 'CREATE_CLASS',
                data: {
                    name: className,
                    isAbstract,
                    superclass,
                    attributes,
                },
                confirmationMessage: `Create ${isAbstract ? 'abstract ' : ''}class ${className}${superclass ? ` extending ${superclass}` : ''}`,
            },
        };
    }

    /**
     * Parse /abstract command
     */
    private static parseAbstract(parts: string[]): CommandParseResult {
        if (parts.length === 0) {
            return {
                success: false,
                error: 'Usage: /abstract ClassName [attr:Type [mult]]',
            };
        }

        const className = parts[0];
        const attributes: AttributeDefinition[] = [];

        for (let i = 1; i < parts.length; i++) {
            if (parts[i].includes(':')) {
                const attr = this.parseAttributeDefinition(parts[i], parts[i + 1]);
                if (attr) {
                    attributes.push(attr);
                    if (parts[i + 1]?.startsWith('[')) {
                        i++;
                    }
                }
            }
        }

        return {
            success: true,
            command: {
                type: 'CREATE_ABSTRACT',
                data: {
                    name: className,
                    isAbstract: true,
                    attributes,
                },
                confirmationMessage: `Create abstract class ${className}`,
            },
        };
    }

    /**
     * Parse /enum command
     */
    private static parseEnum(parts: string[]): CommandParseResult {
        if (parts.length === 0) {
            return {
                success: false,
                error: 'Usage: /enum EnumName [literal1,literal2,literal3]',
            };
        }

        const enumName = parts[0];
        let literals: string[] = [];

        // Check for [literal1,literal2] format
        for (const part of parts.slice(1)) {
            if (part.startsWith('[') && part.endsWith(']')) {
                const content = part.slice(1, -1);
                literals = content.split(',').map((l) => l.trim());
            }
        }

        return {
            success: true,
            command: {
                type: 'CREATE_ENUM',
                data: {
                    name: enumName,
                    literals,
                },
                confirmationMessage: `Create enumeration ${enumName}${literals.length > 0 ? ` with ${literals.length} literals` : ''}`,
            },
        };
    }

    /**
     * Parse /ref command
     */
    private static parseReference(parts: string[]): CommandParseResult {
        if (parts.length === 0) {
            return {
                success: false,
                error: 'Usage: /ref Source->Target [name:refName] [type:refType] [mult]',
            };
        }

        const refPattern = parts[0];
        const match = refPattern.match(/^(\w+)->(\w+)$/);

        if (!match) {
            return { success: false, error: 'Invalid format. Use: Source->Target' };
        }

        const [, source, target] = match;
        let refName = target.charAt(0).toLowerCase() + target.slice(1);
        let refType = 'association';
        let multiplicity = '[1]';

        for (let i = 1; i < parts.length; i++) {
            const part = parts[i];

            if (part.startsWith('name:')) {
                refName = part.substring(5);
            } else if (part.startsWith('type:')) {
                refType = part.substring(5);
            } else if (part.startsWith('[')) {
                multiplicity = part;
            }
        }

        return {
            success: true,
            command: {
                type: 'ADD_REFERENCE',
                data: {
                    metaclassName: source,
                    reference: {
                        name: refName,
                        target: target,
                        type: refType,
                        multiplicity,
                    },
                },
                confirmationMessage: `Add reference ${source} → ${target} (${refType})`,
            },
        };
    }

    /**
     * Parse /biref command
     */
    private static parseBidirectionalRef(parts: string[]): CommandParseResult {
        if (parts.length === 0) {
            return {
                success: false,
                error: 'Usage: /biref ClassA<->ClassB nameA:refA nameB:refB [type:refType] [multA] [multB]',
            };
        }

        const birefPattern = parts[0];
        const match = birefPattern.match(/^(\w+)<->(\w+)$/);

        if (!match) {
            return { success: false, error: 'Invalid format. Use: ClassA<->ClassB' };
        }

        const [, classA, classB] = match;
        let nameA = classB.charAt(0).toLowerCase() + classB.slice(1);
        let nameB = classA.charAt(0).toLowerCase() + classA.slice(1);
        let refType = 'association';
        let multA = '[1]';
        let multB = '[1]';
        let multIndex = 0;

        for (let i = 1; i < parts.length; i++) {
            const part = parts[i];

            if (part.startsWith('nameA:') || part.match(/^\w+:\w+$/)) {
                const colonIndex = part.indexOf(':');
                const key = part.substring(0, colonIndex);
                const value = part.substring(colonIndex + 1);
                if (key === 'nameA' || i === 1) {
                    nameA = value;
                } else if (key === 'nameB' || i === 2) {
                    nameB = value;
                }
            } else if (part.startsWith('type:')) {
                refType = part.substring(5);
            } else if (part.startsWith('[')) {
                if (multIndex === 0) {
                    multA = part;
                    multIndex++;
                } else {
                    multB = part;
                }
            }
        }

        return {
            success: true,
            command: {
                type: 'ADD_BIDIRECTIONAL_REF',
                data: {
                    classA,
                    classB,
                    nameA,
                    nameB,
                    type: refType,
                    multiplicityA: multA,
                    multiplicityB: multB,
                },
                confirmationMessage: `Add bidirectional reference ${classA} ↔ ${classB}`,
            },
        };
    }

    /**
     * Parse /extends command
     */
    private static parseExtends(parts: string[]): CommandParseResult {
        if (parts.length === 0) {
            return {
                success: false,
                error: 'Usage: /extends Child->Parent',
            };
        }

        const pattern = parts[0];
        const match = pattern.match(/^(\w+)->(\w+)$/);

        if (!match) {
            return { success: false, error: 'Invalid format. Use: Child->Parent' };
        }

        const [, child, parent] = match;

        return {
            success: true,
            command: {
                type: 'SET_INHERITANCE',
                data: {
                    metaclassName: child,
                    superclassName: parent,
                },
                confirmationMessage: `Make ${child} inherit from ${parent}`,
            },
        };
    }

    /**
     * Parse /extends- command
     */
    private static parseRemoveExtends(parts: string[]): CommandParseResult {
        if (parts.length === 0) {
            return {
                success: false,
                error: 'Usage: /extends- ClassName',
            };
        }

        const className = parts[0];

        return {
            success: true,
            command: {
                type: 'REMOVE_INHERITANCE',
                data: {
                    metaclassName: className,
                },
                confirmationMessage: `Remove inheritance from ${className}`,
            },
        };
    }

    /**
     * Parse /attr command
     */
    private static parseAddAttribute(parts: string[]): CommandParseResult {
        if (parts.length < 2) {
            return {
                success: false,
                error: 'Usage: /attr ClassName attrName:Type [mult]',
            };
        }

        const className = parts[0];
        const attrDef = this.parseAttributeDefinition(parts[1], parts[2]);

        if (!attrDef) {
            return {
                success: false,
                error: 'Invalid attribute format. Use: attrName:Type',
            };
        }

        return {
            success: true,
            command: {
                type: 'ADD_ATTRIBUTE',
                data: {
                    metaclassName: className,
                    attribute: attrDef,
                },
                confirmationMessage: `Add attribute ${attrDef.name} to ${className}`,
            },
        };
    }

    /**
     * Parse /attr- command
     */
    private static parseRemoveAttribute(parts: string[]): CommandParseResult {
        if (parts.length < 2) {
            return {
                success: false,
                error: 'Usage: /attr- ClassName attrName',
            };
        }

        const className = parts[0];
        const attrName = parts[1];

        return {
            success: true,
            command: {
                type: 'REMOVE_ATTRIBUTE',
                data: {
                    metaclassName: className,
                    attributeName: attrName,
                },
                confirmationMessage: `Remove attribute ${attrName} from ${className}`,
            },
        };
    }

    /**
     * Parse /attr~ command
     */
    private static parseModifyAttribute(parts: string[]): CommandParseResult {
        if (parts.length < 2) {
            return {
                success: false,
                error: 'Usage: /attr~ ClassName oldName->newName [Type] [mult]',
            };
        }

        const className = parts[0];
        const renameMatch = parts[1].match(/^(\w+)->(\w+)$/);

        let oldName: string;
        let newName: string;
        let type: string | undefined;
        let multiplicity: string | undefined;

        if (renameMatch) {
            [, oldName, newName] = renameMatch;
        } else if (parts[1].includes(':')) {
            // Format: attrName:Type
            const colonIdx = parts[1].indexOf(':');
            oldName = parts[1].substring(0, colonIdx);
            newName = oldName;
            type = parts[1].substring(colonIdx + 1);
        } else {
            return {
                success: false,
                error: 'Invalid format. Use: oldName->newName or attrName:Type',
            };
        }

        // Check for type and multiplicity in remaining parts
        for (let i = 2; i < parts.length; i++) {
            const part = parts[i];
            if (part.startsWith('[')) {
                multiplicity = part;
            } else if (!part.includes('->')) {
                type = part;
            }
        }

        return {
            success: true,
            command: {
                type: 'MODIFY_ATTRIBUTE',
                data: {
                    metaclassName: className,
                    attributeName: oldName,
                    newAttribute: {
                        name: newName,
                        type,
                        multiplicity,
                    },
                },
                confirmationMessage: `Modify attribute ${oldName} in ${className}`,
            },
        };
    }

    /**
     * Parse /delete command
     */
    private static parseDelete(parts: string[]): CommandParseResult {
        if (parts.length === 0) {
            return {
                success: false,
                error: 'Usage: /delete ClassName',
            };
        }

        const className = parts[0];

        return {
            success: true,
            command: {
                type: 'DELETE_CLASS',
                data: {
                    name: className,
                },
                confirmationMessage: `Delete class ${className}`,
            },
        };
    }

    /**
     * Parse /ref- command
     */
    private static parseDeleteReference(parts: string[]): CommandParseResult {
        if (parts.length === 0) {
            return {
                success: false,
                error: 'Usage: /ref- Source->Target [refName]',
            };
        }

        const refPattern = parts[0];
        const match = refPattern.match(/^(\w+)->(\w+)$/);

        if (!match) {
            return { success: false, error: 'Invalid format. Use: Source->Target' };
        }

        const [, source, target] = match;
        const refName = parts[1] || target.charAt(0).toLowerCase() + target.slice(1);

        return {
            success: true,
            command: {
                type: 'DELETE_REFERENCE',
                data: {
                    metaclassName: source,
                    referenceName: refName,
                    target,
                },
                confirmationMessage: `Remove reference ${source} → ${target}`,
            },
        };
    }

    /**
     * Parse /clear command
     */
    private static parseClear(parts: string[]): CommandParseResult {
        const keepContext = parts.includes('--keep-context');

        return {
            success: true,
            command: {
                type: 'CLEAR_METAMODEL',
                data: { keepContext },
                confirmationMessage:
                    'Clear entire metamodel' + (keepContext ? ' (keep context)' : ''),
            },
        };
    }

    /**
     * Parse /list command
     */
    private static parseList(parts: string[]): CommandParseResult {
        const what = parts[0] || 'all';

        return {
            success: true,
            command: {
                type: 'QUERY_LIST',
                data: { what },
                confirmationMessage: `List ${what}`,
            },
        };
    }

    /**
     * Parse /show command
     */
    private static parseShow(parts: string[]): CommandParseResult {
        if (parts.length === 0) {
            return {
                success: false,
                error: 'Usage: /show ClassName',
            };
        }

        return {
            success: true,
            command: {
                type: 'QUERY_SHOW',
                data: { className: parts[0] },
                confirmationMessage: `Show details for ${parts[0]}`,
            },
        };
    }

    /**
     * Parse /tree command
     */
    private static parseTree(parts: string[]): CommandParseResult {
        const className = parts[0];

        return {
            success: true,
            command: {
                type: 'QUERY_TREE',
                data: { className },
                confirmationMessage: className
                    ? `Show hierarchy for ${className}`
                    : 'Show full hierarchy',
            },
        };
    }

    /**
     * Parse /check command
     */
    private static parseCheck(): CommandParseResult {
        return {
            success: true,
            command: {
                type: 'QUERY_CHECK',
                data: {},
                confirmationMessage: 'Validate metamodel',
            },
        };
    }

    /**
     * Parse /export command
     */
    private static parseExport(parts: string[]): CommandParseResult {
        const format = parts[0] || 'json';

        return {
            success: true,
            command: {
                type: 'EXPORT',
                data: { format },
                confirmationMessage: `Export metamodel as ${format.toUpperCase()}`,
            },
        };
    }

    /**
     * Parse /import command
     */
    private static parseImport(parts: string[]): CommandParseResult {
        const format = parts[0];

        return {
            success: true,
            command: {
                type: 'IMPORT',
                data: { format },
                confirmationMessage: 'Import metamodel',
            },
        };
    }

    /**
     * Parse /help command
     */
    private static parseHelp(parts: string[]): CommandParseResult {
        const topic = parts[0];

        return {
            success: true,
            command: {
                type: 'HELP',
                data: { topic },
                confirmationMessage: topic ? `Help for /${topic}` : 'Show help',
            },
        };
    }

    /**
     * Parse /examples command
     */
    private static parseExamples(parts: string[]): CommandParseResult {
        const domain = parts[0];

        return {
            success: true,
            command: {
                type: 'EXAMPLES',
                data: { domain },
                confirmationMessage: domain
                    ? `Show ${domain} example`
                    : 'List available examples',
            },
        };
    }

    /**
     * Parse /analyze command
     */
    private static parseAnalyze(): CommandParseResult {
        return {
            success: true,
            command: {
                type: 'ANALYZE',
                data: {},
                confirmationMessage: 'Analyze metamodel',
            },
        };
    }

    /**
     * Parse attribute definition (name:Type [mult])
     */
    private static parseAttributeDefinition(
        def: string,
        nextPart?: string
    ): AttributeDefinition | null {
        const colonIndex = def.indexOf(':');
        if (colonIndex === -1) return null;

        const name = def.substring(0, colonIndex);
        const type = def.substring(colonIndex + 1);
        let multiplicity = '[1]';

        if (nextPart?.startsWith('[') && nextPart?.endsWith(']')) {
            multiplicity = nextPart;
        }

        return { name, type, multiplicity };
    }

    /**
     * Get command suggestions for autocomplete
     */
    static getCommandSuggestions(input: string): string[] {
        const commands = [
            '/create',
            '/abstract',
            '/enum',
            '/ref',
            '/biref',
            '/extends',
            '/extends-',
            '/attr',
            '/attr-',
            '/attr~',
            '/delete',
            '/ref-',
            '/clear',
            '/list',
            '/show',
            '/tree',
            '/check',
            '/export',
            '/import',
            '/undo',
            '/redo',
            '/help',
            '/examples',
            '/analyze',
        ];

        const trimmed = input.trim().toLowerCase();
        if (!trimmed.startsWith('/')) return [];

        return commands.filter((cmd) => cmd.startsWith(trimmed));
    }
}

export default JjodieCommandParser;
