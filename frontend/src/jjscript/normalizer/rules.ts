/**
 * JjScript Normalizer Rules
 * Converts natural language syntax to formal JjScript commands
 */

export interface NormalizationRule {
    name: string;
    pattern: RegExp;
    transform: (match: RegExpMatchArray) => string;
    priority?: number; // Higher = checked first
}

export const NORMALIZATION_RULES: NormalizationRule[] = [
    // ============================================
    // CLASSES
    // ============================================
    {
        name: 'create-class',
        pattern: /^create\s+class\s+(\w+)$/i,
        transform: (m) => `/add class ${m[1]}`,
        priority: 10,
    },
    {
        name: 'create-abstract-class',
        pattern: /^create\s+abstract\s+class\s+(\w+)$/i,
        transform: (m) => `/add class abstract ${m[1]}`,
        priority: 10,
    },
    {
        name: 'add-class',
        pattern: /^add\s+class\s+(\w+)$/i,
        transform: (m) => `/add class ${m[1]}`,
        priority: 10,
    },
    {
        name: 'add-abstract-class',
        pattern: /^add\s+abstract\s+class\s+(\w+)$/i,
        transform: (m) => `/add class abstract ${m[1]}`,
        priority: 10,
    },

    // ============================================
    // ATTRIBUTES
    // ============================================
    {
        name: 'create-attribute-full',
        pattern: /^create\s+attribute\s+(\w+)\s+in\s+(\w+)\s+(?:of\s+)?type\s+(\w+)(?:\s+\[([*+?\d.]+)\])?$/i,
        transform: (m) => {
            const mult = m[4] ? ` [${m[4]}]` : '';
            return `/add ${m[2]}.${m[1]}: ${m[3]}${mult}`;
        },
        priority: 9,
    },
    {
        name: 'add-attribute-to',
        pattern: /^add\s+attribute\s+(\w+)\s+to\s+(\w+)\s+(?:of\s+)?type\s+(\w+)(?:\s+\[([*+?\d.]+)\])?$/i,
        transform: (m) => {
            const mult = m[4] ? ` [${m[4]}]` : '';
            return `/add ${m[2]}.${m[1]}: ${m[3]}${mult}`;
        },
        priority: 9,
    },
    {
        name: 'add-attribute-simple',
        pattern: /^add\s+(\w+)\s+to\s+(\w+)\s+as\s+(\w+)$/i,
        transform: (m) => `/add ${m[2]}.${m[1]}: ${m[3]}`,
        priority: 8,
    },
    {
        name: 'create-attribute-short',
        pattern: /^(\w+)\.(\w+)\s*:\s*(\w+)(?:\s+\[([*+?\d.]+)\])?$/i,
        transform: (m) => {
            const mult = m[4] ? ` [${m[4]}]` : '';
            return `/add ${m[1]}.${m[2]}: ${m[3]}${mult}`;
        },
        priority: 7,
    },

    // ============================================
    // REFERENCES
    // ============================================
    {
        name: 'create-reference',
        pattern: /^create\s+reference\s+(\w+)\s+in\s+(\w+)\s+(?:of\s+)?type\s+(\w+)(?:\s+\[([*+?\d.]+)\])?$/i,
        transform: (m) => {
            const mult = m[4] ? ` [${m[4]}]` : '';
            return `/add ${m[2]} -> ${m[3]} as ${m[1]}${mult}`;
        },
        priority: 9,
    },
    {
        name: 'add-reference-to',
        pattern: /^add\s+reference\s+(\w+)\s+to\s+(\w+)\s+(?:of\s+)?type\s+(\w+)(?:\s+\[([*+?\d.]+)\])?$/i,
        transform: (m) => {
            const mult = m[4] ? ` [${m[4]}]` : '';
            return `/add ${m[2]} -> ${m[3]} as ${m[1]}${mult}`;
        },
        priority: 9,
    },
    {
        name: 'create-composition',
        pattern: /^create\s+composition\s+(\w+)\s+in\s+(\w+)\s+(?:of\s+)?type\s+(\w+)(?:\s+\[([*+?\d.]+)\])?$/i,
        transform: (m) => {
            const mult = m[4] ? ` [${m[4]}]` : '';
            return `/add ${m[2]} *-> ${m[3]} as ${m[1]}${mult}`;
        },
        priority: 9,
    },
    {
        name: 'create-aggregation',
        pattern: /^create\s+aggregation\s+(\w+)\s+in\s+(\w+)\s+(?:of\s+)?type\s+(\w+)(?:\s+\[([*+?\d.]+)\])?$/i,
        transform: (m) => {
            const mult = m[4] ? ` [${m[4]}]` : '';
            return `/add ${m[2]} o-> ${m[3]} as ${m[1]}${mult}`;
        },
        priority: 9,
    },

    // ============================================
    // ENUMS
    // ============================================
    {
        name: 'create-enum',
        pattern: /^create\s+enum\s+(\w+)$/i,
        transform: (m) => `/add enum ${m[1]}:`,
        priority: 10,
    },
    {
        name: 'create-enum-with-literals',
        pattern: /^create\s+enum\s+(\w+)\s*:\s*(.+)$/i,
        transform: (m) => `/add enum ${m[1]}: ${m[2]}`,
        priority: 10,
    },
    {
        name: 'add-enum',
        pattern: /^add\s+enum\s+(\w+)$/i,
        transform: (m) => `/add enum ${m[1]}:`,
        priority: 10,
    },
    {
        name: 'add-enum-with-literals',
        pattern: /^add\s+enum\s+(\w+)\s*:\s*(.+)$/i,
        transform: (m) => `/add enum ${m[1]}: ${m[2]}`,
        priority: 10,
    },
    {
        name: 'add-literal',
        pattern: /^add\s+literal\s+(\w+)\s+to\s+(\w+)$/i,
        transform: (m) => `/add literal ${m[2]}: ${m[1]}`,
        priority: 9,
    },
    {
        name: 'add-literals',
        pattern: /^add\s+literals?\s+(.+)\s+to\s+(\w+)$/i,
        transform: (m) => `/add literal ${m[2]}: ${m[1]}`,
        priority: 9,
    },

    // ============================================
    // PACKAGES
    // ============================================
    {
        name: 'create-package',
        pattern: /^create\s+package\s+(\w+)$/i,
        transform: (m) => `/add package ${m[1]}`,
        priority: 10,
    },
    {
        name: 'add-package',
        pattern: /^add\s+package\s+(\w+)$/i,
        transform: (m) => `/add package ${m[1]}`,
        priority: 10,
    },

    // ============================================
    // INHERITANCE
    // ============================================
    {
        name: 'extend-class',
        pattern: /^(\w+)\s+extends\s+(\w+)$/i,
        transform: (m) => `/extend ${m[2]}: ${m[1]}`,
        priority: 8,
    },
    {
        name: 'set-parent',
        pattern: /^set\s+parent\s+of\s+(\w+)\s+to\s+(\w+)$/i,
        transform: (m) => `/extend ${m[2]}: ${m[1]}`,
        priority: 8,
    },
    {
        name: 'make-extend',
        pattern: /^make\s+(\w+)\s+extend\s+(\w+)$/i,
        transform: (m) => `/extend ${m[2]}: ${m[1]}`,
        priority: 8,
    },

    // ============================================
    // OPERATIONS
    // ============================================
    {
        name: 'create-operation',
        pattern: /^create\s+operation\s+(\w+)\s+in\s+(\w+)(?:\s+return(?:s|ing)?\s+(\w+))?$/i,
        transform: (m) => {
            const ret = m[3] ? `: ${m[3]}` : '';
            return `/add operation ${m[2]}.${m[1]}()${ret}`;
        },
        priority: 9,
    },
    {
        name: 'add-operation',
        pattern: /^add\s+operation\s+(\w+)\s+to\s+(\w+)(?:\s+return(?:s|ing)?\s+(\w+))?$/i,
        transform: (m) => {
            const ret = m[3] ? `: ${m[3]}` : '';
            return `/add operation ${m[2]}.${m[1]}()${ret}`;
        },
        priority: 9,
    },

    // ============================================
    // DOCUMENTATION
    // ============================================
    {
        name: 'set-doc',
        pattern: /^set\s+(?:doc|documentation)\s+(?:of\s+)?(\w+(?:\.\w+)?)\s+to\s+"([^"]+)"$/i,
        transform: (m) => `/doc ${m[1]} "${m[2]}"`,
        priority: 8,
    },
    {
        name: 'document',
        pattern: /^document\s+(\w+(?:\.\w+)?)\s+(?:as\s+|with\s+)?"([^"]+)"$/i,
        transform: (m) => `/doc ${m[1]} "${m[2]}"`,
        priority: 8,
    },

    // ============================================
    // DELETE / REMOVE
    // ============================================
    {
        name: 'delete-element',
        pattern: /^delete\s+(\w+(?:\.\w+)?)$/i,
        transform: (m) => `/delete ${m[1]}`,
        priority: 10,
    },
    {
        name: 'remove-element',
        pattern: /^remove\s+(\w+(?:\.\w+)?)$/i,
        transform: (m) => `/delete ${m[1]}`,
        priority: 10,
    },
    {
        name: 'delete-class',
        pattern: /^delete\s+class\s+(\w+)$/i,
        transform: (m) => `/delete ${m[1]}`,
        priority: 10,
    },
    {
        name: 'delete-attribute',
        pattern: /^delete\s+attribute\s+(\w+)\s+from\s+(\w+)$/i,
        transform: (m) => `/delete ${m[2]}.${m[1]}`,
        priority: 9,
    },
    {
        name: 'remove-attribute',
        pattern: /^remove\s+attribute\s+(\w+)\s+from\s+(\w+)$/i,
        transform: (m) => `/delete ${m[2]}.${m[1]}`,
        priority: 9,
    },

    // ============================================
    // RENAME
    // ============================================
    {
        name: 'rename-element',
        pattern: /^rename\s+(\w+(?:\.\w+)?)\s+to\s+(\w+)$/i,
        transform: (m) => `/rename ${m[1]} to ${m[2]}`,
        priority: 10,
    },
    {
        name: 'rename-class',
        pattern: /^rename\s+class\s+(\w+)\s+to\s+(\w+)$/i,
        transform: (m) => `/rename ${m[1]} to ${m[2]}`,
        priority: 10,
    },

    // ============================================
    // SHOW / LIST
    // ============================================
    {
        name: 'show-element',
        pattern: /^show\s+(\w+(?:\.\w+)?)$/i,
        transform: (m) => `/show ${m[1]}`,
        priority: 10,
    },
    {
        name: 'list-classes',
        pattern: /^list\s+classes$/i,
        transform: () => `/list classes`,
        priority: 10,
    },
    {
        name: 'list-enums',
        pattern: /^list\s+enums$/i,
        transform: () => `/list enums`,
        priority: 10,
    },
    {
        name: 'list-all',
        pattern: /^list\s+all$/i,
        transform: () => `/list all`,
        priority: 10,
    },
    {
        name: 'list-attributes-of',
        pattern: /^list\s+attributes\s+(?:of|in)\s+(\w+)$/i,
        transform: (m) => `/list attributes ${m[1]}`,
        priority: 9,
    },

    // ============================================
    // UTILITY
    // ============================================
    {
        name: 'undo',
        pattern: /^undo$/i,
        transform: () => `/undo`,
        priority: 10,
    },
    {
        name: 'redo',
        pattern: /^redo$/i,
        transform: () => `/redo`,
        priority: 10,
    },
    {
        name: 'clear',
        pattern: /^clear$/i,
        transform: () => `/clear`,
        priority: 10,
    },
    {
        name: 'help',
        pattern: /^help(?:\s+(\w+))?$/i,
        transform: (m) => m[1] ? `/help ${m[1]}` : `/help`,
        priority: 10,
    },
];

// Sort rules by priority (highest first)
NORMALIZATION_RULES.sort((a, b) => (b.priority || 0) - (a.priority || 0));
