/**
 * Jjodie Help System
 * Provides help documentation and examples for commands
 */

export interface HelpTopic {
    command: string;
    syntax: string;
    description: string;
    examples: string[];
    notes?: string[];
    relatedCommands?: string[];
}

export class JjodieHelpSystem {
    private static topics: Record<string, HelpTopic> = {
        create: {
            command: '/create',
            syntax: '/create ClassName [attr:Type [mult]] [extends:Parent] [abstract]',
            description:
                'Create a new metaclass with optional attributes and inheritance.',
            examples: [
                '/create Person name:String age:Integer',
                '/create Employee salary:Float extends:Person',
                '/create NamedElement name:String abstract',
            ],
            notes: [
                'Use "abstract" flag to create an abstract class',
                'Attributes format: name:Type [multiplicity]',
                'Multiplicity defaults to [1] if not specified',
            ],
            relatedCommands: ['/abstract', '/attr', '/extends'],
        },

        abstract: {
            command: '/abstract',
            syntax: '/abstract ClassName [attr:Type [mult]]',
            description: 'Create an abstract metaclass (shorthand for /create with abstract flag).',
            examples: [
                '/abstract NamedElement name:String',
                '/abstract Element id:String',
            ],
            notes: [
                'Abstract classes cannot be instantiated directly',
                'Use for common base classes in hierarchies',
            ],
            relatedCommands: ['/create', '/extends'],
        },

        enum: {
            command: '/enum',
            syntax: '/enum EnumName [literal1,literal2,literal3]',
            description: 'Create an enumeration type with literals.',
            examples: [
                '/enum Gender [Male,Female,Other]',
                '/enum Status [Active,Inactive,Pending]',
            ],
            notes: [
                'Literals are comma-separated within brackets',
                'Use for fixed set of values',
            ],
            relatedCommands: ['/create'],
        },

        ref: {
            command: '/ref',
            syntax: '/ref Source->Target [name:refName] [type:refType] [mult]',
            description: 'Add a reference between two metaclasses.',
            examples: [
                '/ref Book->Author type:association [1]',
                '/ref Entity->Attribute type:composition [0..*]',
                '/ref Department->Employee name:members type:aggregation [0..*]',
            ],
            notes: [
                'Reference types: association, composition, aggregation',
                'Default type is association',
                'Composition means strong ownership (◆)',
                'Aggregation means shared ownership (◇)',
            ],
            relatedCommands: ['/biref', '/ref-'],
        },

        biref: {
            command: '/biref',
            syntax: '/biref ClassA<->ClassB nameA:refA nameB:refB [type:refType] [multA] [multB]',
            description: 'Add a bidirectional reference between two metaclasses.',
            examples: [
                '/biref Person<->Company owner:employer employees:staff [1] [0..*]',
                '/biref State<->Transition outgoing:source incoming:target [0..*] [1]',
            ],
            notes: [
                'Creates references in both directions',
                'nameA is the reference from A to B',
                'nameB is the reference from B to A',
            ],
            relatedCommands: ['/ref'],
        },

        extends: {
            command: '/extends',
            syntax: '/extends Child->Parent',
            description: 'Set inheritance relationship between classes.',
            examples: ['/extends Train->Vehicle', '/extends Manager->Employee'],
            notes: [
                'Child inherits all attributes and references from Parent',
                'A class can only have one superclass',
            ],
            relatedCommands: ['/extends-', '/create'],
        },

        'extends-': {
            command: '/extends-',
            syntax: '/extends- ClassName',
            description: 'Remove inheritance from a class.',
            examples: ['/extends- Train'],
            notes: ['Removes the superclass relationship'],
            relatedCommands: ['/extends'],
        },

        attr: {
            command: '/attr',
            syntax: '/attr ClassName attrName:Type [mult]',
            description: 'Add an attribute to an existing metaclass.',
            examples: [
                '/attr Person email:String [1]',
                '/attr Book publishDate:Date [0..1]',
            ],
            notes: [
                'Common types: String, Integer, Float, Boolean, Date, DateTime',
                'Multiplicity format: [min..max] or [exact]',
            ],
            relatedCommands: ['/attr-', '/attr~'],
        },

        'attr-': {
            command: '/attr-',
            syntax: '/attr- ClassName attrName',
            description: 'Remove an attribute from a metaclass.',
            examples: ['/attr- Person age'],
            notes: ['Permanently removes the attribute'],
            relatedCommands: ['/attr', '/attr~'],
        },

        'attr~': {
            command: '/attr~',
            syntax: '/attr~ ClassName oldName->newName [Type] [mult]',
            description: 'Modify an existing attribute (rename, change type, or multiplicity).',
            examples: [
                '/attr~ Person age->birthYear Integer',
                '/attr~ Book title:String [1]',
            ],
            notes: [
                'Use oldName->newName to rename',
                'Use attrName:Type to change type',
            ],
            relatedCommands: ['/attr', '/attr-'],
        },

        delete: {
            command: '/delete',
            syntax: '/delete ClassName',
            description: 'Delete a metaclass from the metamodel.',
            examples: ['/delete Person'],
            notes: [
                'Also removes all references to/from this class',
                'Cannot be undone directly (use /undo)',
            ],
            relatedCommands: ['/ref-', '/undo'],
        },

        'ref-': {
            command: '/ref-',
            syntax: '/ref- Source->Target [refName]',
            description: 'Remove a reference between classes.',
            examples: [
                '/ref- Book->Author',
                '/ref- Entity->Attribute attributes',
            ],
            notes: ['Specify refName if multiple references exist to same target'],
            relatedCommands: ['/ref', '/delete'],
        },

        clear: {
            command: '/clear',
            syntax: '/clear [--keep-context]',
            description:
                'Clear the entire metamodel. Optionally keep conversation context.',
            examples: ['/clear', '/clear --keep-context'],
            notes: [
                'Without flags: Prompts about clearing context',
                'With --keep-context: Preserves conversation history',
                'This action can be undone with /undo',
            ],
            relatedCommands: ['/undo', '/delete'],
        },

        list: {
            command: '/list',
            syntax: '/list [classes|attrs|refs|all]',
            description: 'List elements in the metamodel.',
            examples: [
                '/list',
                '/list classes',
                '/list refs',
            ],
            notes: [
                'Default lists all classes',
                'Use "refs" to see all references',
            ],
            relatedCommands: ['/show', '/tree'],
        },

        show: {
            command: '/show',
            syntax: '/show ClassName',
            description: 'Show detailed information about a class.',
            examples: ['/show Person'],
            notes: [
                'Displays attributes, references, and inheritance',
            ],
            relatedCommands: ['/list', '/tree'],
        },

        tree: {
            command: '/tree',
            syntax: '/tree [ClassName]',
            description: 'Show class hierarchy as a tree.',
            examples: ['/tree', '/tree Vehicle'],
            notes: [
                'Without argument: shows full hierarchy',
                'With class name: shows subtree from that class',
            ],
            relatedCommands: ['/list', '/show'],
        },

        check: {
            command: '/check',
            syntax: '/check',
            description: 'Validate the metamodel for errors and warnings.',
            examples: ['/check'],
            notes: [
                'Checks for: circular inheritance, missing targets, duplicates',
                'Reports both errors and warnings',
            ],
            relatedCommands: ['/analyze'],
        },

        export: {
            command: '/export',
            syntax: '/export [format]',
            description: 'Export the metamodel to a file.',
            examples: [
                '/export',
                '/export json',
                '/export ecore',
                '/export md',
            ],
            notes: [
                'Formats: json (default), ecore, xmi, md',
                'json: Standard JSON format',
                'ecore: Eclipse Ecore format',
                'md: Markdown documentation',
            ],
            relatedCommands: ['/import'],
        },

        import: {
            command: '/import',
            syntax: '/import [format]',
            description: 'Import a metamodel from a file.',
            examples: ['/import', '/import json'],
            notes: ['Opens file picker to select file'],
            relatedCommands: ['/export'],
        },

        undo: {
            command: '/undo',
            syntax: '/undo',
            description: 'Undo the last action.',
            examples: ['/undo'],
            notes: ['Can undo most metamodel modifications'],
            relatedCommands: ['/redo'],
        },

        redo: {
            command: '/redo',
            syntax: '/redo',
            description: 'Redo the last undone action.',
            examples: ['/redo'],
            notes: ['Only available after /undo'],
            relatedCommands: ['/undo'],
        },

        help: {
            command: '/help',
            syntax: '/help [command]',
            description: 'Show help for commands.',
            examples: ['/help', '/help create', '/help ref'],
            notes: ['Without argument: shows all commands'],
            relatedCommands: ['/examples'],
        },

        examples: {
            command: '/examples',
            syntax: '/examples [domain]',
            description: 'Show example metamodels for common domains.',
            examples: [
                '/examples',
                '/examples statemachine',
                '/examples erd',
                '/examples library',
            ],
            notes: [
                'Available domains: statemachine, erd, library',
                'Shows complete command sequences',
            ],
            relatedCommands: ['/help'],
        },

        analyze: {
            command: '/analyze',
            syntax: '/analyze',
            description: 'Analyze the metamodel and suggest improvements.',
            examples: ['/analyze'],
            notes: [
                'Suggests: abstract base classes, missing constraints',
                'Identifies optimization opportunities',
            ],
            relatedCommands: ['/check'],
        },
    };

    /**
     * Get help for a specific command
     */
    static getHelp(command?: string): string {
        if (!command) {
            return this.getGeneralHelp();
        }

        // Normalize command name (remove leading /)
        const normalizedCommand = command.startsWith('/')
            ? command.substring(1).toLowerCase()
            : command.toLowerCase();

        const topic = this.topics[normalizedCommand];

        if (!topic) {
            return `No help available for "/${normalizedCommand}". Type /help to see all commands.`;
        }

        return this.formatHelpTopic(topic);
    }

    /**
     * Get general help (all commands)
     */
    private static getGeneralHelp(): string {
        const categories: Record<string, string[]> = {
            Creation: ['create', 'abstract', 'enum'],
            References: ['ref', 'biref', 'ref-'],
            Inheritance: ['extends', 'extends-'],
            Attributes: ['attr', 'attr-', 'attr~'],
            Deletion: ['delete'],
            Query: ['list', 'show', 'tree', 'check'],
            Management: ['clear', 'export', 'import', 'undo', 'redo'],
            Utility: ['help', 'examples', 'analyze'],
        };

        let help = '# Jjodie Commands\n\n';
        help += 'Use commands for precise and fast metamodel manipulation.\n\n';

        for (const [category, commands] of Object.entries(categories)) {
            help += `## ${category}\n`;
            commands.forEach((cmd) => {
                const topic = this.topics[cmd];
                if (topic) {
                    help += `- **/${cmd}** - ${topic.description}\n`;
                }
            });
            help += '\n';
        }

        help += '\n**Tips:**\n';
        help += '- Type `/` to see command suggestions\n';
        help += '- Press `Cmd+K` (or `Ctrl+K`) to open command palette\n';
        help += '- Type `/help [command]` for detailed help on a specific command\n';
        help += '- You can also use natural language instead of commands!\n';

        return help;
    }

    /**
     * Format a help topic
     */
    private static formatHelpTopic(topic: HelpTopic): string {
        let help = `# ${topic.command}\n\n`;
        help += `${topic.description}\n\n`;
        help += `**Syntax:**\n\`\`\`\n${topic.syntax}\n\`\`\`\n\n`;

        help += '**Examples:**\n';
        topic.examples.forEach((ex) => {
            help += `\`\`\`\n${ex}\n\`\`\`\n`;
        });
        help += '\n';

        if (topic.notes && topic.notes.length > 0) {
            help += '**Notes:**\n';
            topic.notes.forEach((note) => {
                help += `- ${note}\n`;
            });
            help += '\n';
        }

        if (topic.relatedCommands && topic.relatedCommands.length > 0) {
            help += '**Related Commands:**\n';
            help += topic.relatedCommands.map((cmd) => `\`${cmd}\``).join(', ');
            help += '\n';
        }

        return help;
    }

    /**
     * Get examples for a domain
     */
    static getExamples(domain?: string): string {
        const examples: Record<string, string> = {
            statemachine: `# State Machine Metamodel

A classic example for modeling finite state machines.

\`\`\`bash
# Create abstract base
/abstract NamedElement name:String

# Create concrete classes
/create StateMachine extends:NamedElement
/create State extends:NamedElement isInitial:Boolean
/create Transition extends:NamedElement
/create Event extends:NamedElement

# Add relationships
/ref StateMachine->State name:states type:composition [1..*]
/ref StateMachine->State name:initialState type:association [1]
/ref State->Transition name:outgoing type:composition [0..*]
/ref Transition->State name:source type:association [1]
/ref Transition->State name:target type:association [1]
/ref Transition->Event name:trigger type:association [0..1]
\`\`\`

**Key concepts:**
- StateMachine contains States (composition)
- States have outgoing Transitions (composition)
- Transitions reference source and target States (association)`,

            erd: `# Entity-Relationship Diagram Metamodel

For modeling database schemas.

\`\`\`bash
# Create base
/abstract NamedElement name:String

# Create classes
/create Entity extends:NamedElement
/create Attribute extends:NamedElement type:String isPrimaryKey:Boolean
/create Relationship extends:NamedElement cardinality:String

# Add relationships
/ref Entity->Attribute name:attributes type:composition [0..*]
/ref Relationship->Entity name:source type:association [1]
/ref Relationship->Entity name:target type:association [1]
\`\`\`

**Key concepts:**
- Entity contains Attributes (composition)
- Relationship links two Entities (association)`,

            library: `# Library System Metamodel

A practical example for a library management system.

\`\`\`bash
# Create classes
/create Library name:String address:String
/create Book title:String isbn:String year:Integer
/create Author name:String birthYear:Integer
/create Member name:String membershipId:String
/create Loan date:Date returnDate:Date

# Add relationships
/ref Library->Book name:books type:composition [0..*]
/ref Book->Author name:authors type:association [1..*]
/ref Library->Member name:members type:composition [0..*]
/ref Member->Loan name:loans type:composition [0..*]
/ref Loan->Book name:book type:association [1]
\`\`\`

**Key concepts:**
- Library owns Books and Members (composition)
- Books reference Authors (association, many-to-many)
- Members have Loans that reference Books`,
        };

        if (!domain) {
            return `# Available Examples

Choose a domain to see a complete metamodel example:

- **statemachine** - Finite State Machine metamodel
- **erd** - Entity-Relationship Diagram metamodel
- **library** - Library Management System metamodel

Use: \`/examples [domain]\`

Example: \`/examples statemachine\``;
        }

        const normalizedDomain = domain.toLowerCase();
        return (
            examples[normalizedDomain] ||
            `No examples for "${domain}". Available: statemachine, erd, library`
        );
    }

    /**
     * Get command suggestions for autocomplete
     */
    static getCommandDescriptions(): Array<{
        command: string;
        description: string;
        example: string;
        category: string;
    }> {
        const categoryMap: Record<string, string> = {
            create: 'Creation',
            abstract: 'Creation',
            enum: 'Creation',
            ref: 'References',
            biref: 'References',
            'ref-': 'References',
            extends: 'Inheritance',
            'extends-': 'Inheritance',
            attr: 'Attributes',
            'attr-': 'Attributes',
            'attr~': 'Attributes',
            delete: 'Deletion',
            list: 'Query',
            show: 'Query',
            tree: 'Query',
            check: 'Query',
            clear: 'Management',
            export: 'Management',
            import: 'Management',
            undo: 'Management',
            redo: 'Management',
            help: 'Utility',
            examples: 'Utility',
            analyze: 'Utility',
        };

        return Object.entries(this.topics).map(([key, topic]) => ({
            command: topic.command,
            description: topic.description,
            example: topic.examples[0] || topic.syntax,
            category: categoryMap[key] || 'Other',
        }));
    }
}

export default JjodieHelpSystem;
