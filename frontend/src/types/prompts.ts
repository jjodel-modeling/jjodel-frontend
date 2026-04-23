/**
 * AI Prompt Types and Constants
 */

// ============================================
// PROMPT TYPES
// ============================================

/**
 * Available prompt types in the system
 */
export type PromptType =
    | 'chat'           // Jjodie chat assistant
    | 'documentation'  // Documentation generation
    | 'validation'     // Model validation suggestions
    | 'refactoring'    // Metamodel improvement suggestions
    | 'ocl'            // OCL constraint generation
    | 'import'         // Import mapping assistant
    | 'mappings';      // Analyze Metamodels (JjTL suggestion generation)

/**
 * Prompt metadata
 */
export interface PromptMeta {
    id: PromptType;
    name: string;
    description: string;
    category: 'assistant' | 'generation' | 'analysis';
    supportsVariables: boolean;
}

/**
 * Stored prompt with metadata
 */
export interface StoredPrompt {
    type: PromptType;
    content: string;
    updatedAt: number;
    isCustom: boolean;
}

/**
 * Prompt variable context
 */
export interface PromptContext {
    projectName?: string;
    projectDescription?: string;
    classCount?: number;
    classes?: Array<{
        name: string;
        isAbstract: boolean;
        attributeCount: number;
        referenceCount: number;
    }>;
    metamodelName?: string;
    userName?: string;
    customVariables?: Record<string, string>;
}

// ============================================
// PROMPT REGISTRY
// ============================================

/**
 * Registry of all available prompts
 */
export const PROMPT_REGISTRY: Record<PromptType, PromptMeta> = {
    chat: {
        id: 'chat',
        name: 'Chat Assistant',
        description: 'System prompt for Jjodie chat conversations',
        category: 'assistant',
        supportsVariables: true,
    },
    documentation: {
        id: 'documentation',
        name: 'Documentation Generation',
        description: 'Prompt for generating metamodel documentation',
        category: 'generation',
        supportsVariables: true,
    },
    validation: {
        id: 'validation',
        name: 'Validation Assistant',
        description: 'Prompt for analyzing and suggesting fixes for model errors',
        category: 'analysis',
        supportsVariables: true,
    },
    refactoring: {
        id: 'refactoring',
        name: 'Refactoring Suggestions',
        description: 'Prompt for suggesting metamodel improvements',
        category: 'analysis',
        supportsVariables: true,
    },
    ocl: {
        id: 'ocl',
        name: 'OCL Generation',
        description: 'Prompt for generating OCL constraints',
        category: 'generation',
        supportsVariables: true,
    },
    import: {
        id: 'import',
        name: 'Import Assistant',
        description: 'Prompt for helping map external data to metamodel',
        category: 'assistant',
        supportsVariables: true,
    },
    mappings: {
        id: 'mappings',
        name: 'Analyze Metamodels',
        description: 'System prompt used by the AI when analyzing source and target metamodels to suggest mappings',
        category: 'analysis',
        supportsVariables: true,
    },
};

// ============================================
// STORAGE KEYS
// ============================================

export const PROMPT_STORAGE_PREFIX = 'jjodel_prompt_';
export const PROMPT_GLOBAL_PREFIX = `${PROMPT_STORAGE_PREFIX}global_`;
export const PROMPT_PROJECT_PREFIX = `${PROMPT_STORAGE_PREFIX}project_`;
