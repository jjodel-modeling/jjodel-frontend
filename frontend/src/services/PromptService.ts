/**
 * Prompt Service
 * Manages AI prompts with cascading overrides (project -> global -> default)
 */

import {
    PromptType,
    PromptContext,
    StoredPrompt,
    PROMPT_GLOBAL_PREFIX,
    PROMPT_PROJECT_PREFIX,
    PROMPT_REGISTRY
} from '../types/prompts';
import { DEFAULT_PROMPTS } from '../constants/defaultPrompts';

// ============================================
// PROMPT MIGRATION
// ============================================

/**
 * Version markers for critical prompt content.
 * When a prompt is missing these markers, it's considered stale and reset.
 */
const CRITICAL_MARKERS: Partial<Record<PromptType, string[]>> = {
    chat: ['JjScript', 'create class', '```jjscript', 'conversational, flowing style'],  // JjScript section + response style markers
};

/**
 * Migration version - increment when prompts have breaking changes
 */
const PROMPT_VERSION = 3;
const PROMPT_VERSION_KEY = 'jjodel_prompt_version';

// ============================================
// PROMPT SERVICE
// ============================================

export class PromptService {

    /**
     * Run migration on service initialization
     */
    private static migrationRun = false;

    private static runMigration(): void {
        if (this.migrationRun) return;
        this.migrationRun = true;

        try {
            const storedVersion = parseInt(localStorage.getItem(PROMPT_VERSION_KEY) || '0', 10);

            if (storedVersion < PROMPT_VERSION) {
                console.log(`[PromptService] Migrating prompts from v${storedVersion} to v${PROMPT_VERSION}`);

                // Check and reset stale prompts
                for (const [type, markers] of Object.entries(CRITICAL_MARKERS)) {
                    const globalPrompt = this.getGlobalPromptRaw(type as PromptType);
                    if (globalPrompt && markers) {
                        const isMissingMarkers = markers.some(marker =>
                            !globalPrompt.content.includes(marker)
                        );

                        if (isMissingMarkers) {
                            console.log(`[PromptService] Resetting stale '${type}' prompt (missing critical content)`);
                            this.resetGlobalPrompt(type as PromptType);
                        }
                    }
                }

                localStorage.setItem(PROMPT_VERSION_KEY, String(PROMPT_VERSION));
            }
        } catch (err) {
            console.warn('[PromptService] Migration error:', err);
        }
    }

    /**
     * Get raw global prompt without triggering migration (for migration itself)
     */
    private static getGlobalPromptRaw(type: PromptType): StoredPrompt | null {
        try {
            const key = `${PROMPT_GLOBAL_PREFIX}${type}`;
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }

    // ========================================
    // GET PROMPT (with cascading)
    // ========================================

    /**
     * Get prompt with cascading: project -> global -> default
     */
    static get(type: PromptType, projectId?: string): string {
        // Run migration check
        this.runMigration();
        // 1. Check project override
        if (projectId) {
            const projectPrompt = this.getProjectPrompt(type, projectId);
            if (projectPrompt) {
                return projectPrompt.content;
            }
        }

        // 2. Check global override
        const globalPrompt = this.getGlobalPrompt(type);
        if (globalPrompt) {
            return globalPrompt.content;
        }

        // 3. Fallback to default
        return DEFAULT_PROMPTS[type];
    }

    /**
     * Get prompt and render with context variables
     */
    static getRendered(type: PromptType, context?: PromptContext, projectId?: string): string {
        const template = this.get(type, projectId);
        return this.renderTemplate(template, context);
    }

    // ========================================
    // GLOBAL PROMPTS
    // ========================================

    /**
     * Get global prompt override
     */
    static getGlobalPrompt(type: PromptType): StoredPrompt | null {
        try {
            const key = `${PROMPT_GLOBAL_PREFIX}${type}`;
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }

    /**
     * Save global prompt override
     */
    static setGlobalPrompt(type: PromptType, content: string): void {
        const key = `${PROMPT_GLOBAL_PREFIX}${type}`;
        const prompt: StoredPrompt = {
            type,
            content,
            updatedAt: Date.now(),
            isCustom: true,
        };
        localStorage.setItem(key, JSON.stringify(prompt));

        // Dispatch event for listeners
        window.dispatchEvent(new CustomEvent('prompt-changed', {
            detail: { type, scope: 'global' }
        }));
    }

    /**
     * Reset global prompt to default
     */
    static resetGlobalPrompt(type: PromptType): void {
        const key = `${PROMPT_GLOBAL_PREFIX}${type}`;
        localStorage.removeItem(key);

        window.dispatchEvent(new CustomEvent('prompt-changed', {
            detail: { type, scope: 'global' }
        }));
    }

    /**
     * Check if global prompt is customized
     */
    static isGlobalCustomized(type: PromptType): boolean {
        return this.getGlobalPrompt(type) !== null;
    }

    // ========================================
    // PROJECT PROMPTS
    // ========================================

    /**
     * Get project prompt override
     */
    static getProjectPrompt(type: PromptType, projectId: string): StoredPrompt | null {
        try {
            const key = `${PROMPT_PROJECT_PREFIX}${projectId}_${type}`;
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    }

    /**
     * Save project prompt override
     */
    static setProjectPrompt(type: PromptType, projectId: string, content: string): void {
        const key = `${PROMPT_PROJECT_PREFIX}${projectId}_${type}`;
        const prompt: StoredPrompt = {
            type,
            content,
            updatedAt: Date.now(),
            isCustom: true,
        };
        localStorage.setItem(key, JSON.stringify(prompt));

        window.dispatchEvent(new CustomEvent('prompt-changed', {
            detail: { type, scope: 'project', projectId }
        }));
    }

    /**
     * Reset project prompt (falls back to global or default)
     */
    static resetProjectPrompt(type: PromptType, projectId: string): void {
        const key = `${PROMPT_PROJECT_PREFIX}${projectId}_${type}`;
        localStorage.removeItem(key);

        window.dispatchEvent(new CustomEvent('prompt-changed', {
            detail: { type, scope: 'project', projectId }
        }));
    }

    /**
     * Check if project prompt is customized
     */
    static isProjectCustomized(type: PromptType, projectId: string): boolean {
        return this.getProjectPrompt(type, projectId) !== null;
    }

    /**
     * Get all project prompts
     */
    static getAllProjectPrompts(projectId: string): StoredPrompt[] {
        const prompts: StoredPrompt[] = [];

        for (const type of Object.keys(PROMPT_REGISTRY) as PromptType[]) {
            const prompt = this.getProjectPrompt(type, projectId);
            if (prompt) {
                prompts.push(prompt);
            }
        }

        return prompts;
    }

    // ========================================
    // DEFAULT PROMPTS
    // ========================================

    /**
     * Get default prompt (built-in)
     */
    static getDefault(type: PromptType): string {
        return DEFAULT_PROMPTS[type];
    }

    /**
     * Get all default prompts
     */
    static getAllDefaults(): Record<PromptType, string> {
        return { ...DEFAULT_PROMPTS };
    }

    // ========================================
    // TEMPLATE RENDERING
    // ========================================

    /**
     * Render template with context variables
     * Supports Handlebars-like syntax: {{variable}}, {{#if}}, {{#each}}
     */
    static renderTemplate(template: string, context?: PromptContext): string {
        if (!context) return template;

        let result = template;

        // Simple variable replacement: {{variableName}}
        result = result.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
            const value = (context as Record<string, unknown>)[varName] ?? context.customVariables?.[varName];
            return value !== undefined ? String(value) : '';
        });

        // Conditional blocks: {{#if variable}}...{{/if}}
        result = result.replace(
            /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
            (match, varName, content) => {
                const value = (context as Record<string, unknown>)[varName] ?? context.customVariables?.[varName];
                return value ? content : '';
            }
        );

        // Each loops: {{#each array}}...{{/each}}
        result = result.replace(
            /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
            (match, varName, itemTemplate) => {
                const array = (context as Record<string, unknown>)[varName];
                if (!Array.isArray(array)) return '';

                return array.map(item => {
                    let itemResult = itemTemplate;
                    // Replace item properties
                    for (const [key, val] of Object.entries(item as Record<string, unknown>)) {
                        itemResult = itemResult.replace(
                            new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
                            String(val)
                        );
                    }
                    return itemResult;
                }).join('');
            }
        );

        // Clean up any remaining empty conditional blocks
        result = result.replace(/\n\s*\n\s*\n/g, '\n\n');

        return result.trim();
    }

    // ========================================
    // UTILITIES
    // ========================================

    /**
     * Get prompt source info (where the prompt comes from)
     */
    static getPromptSource(type: PromptType, projectId?: string): 'project' | 'global' | 'default' {
        if (projectId && this.isProjectCustomized(type, projectId)) {
            return 'project';
        }
        if (this.isGlobalCustomized(type)) {
            return 'global';
        }
        return 'default';
    }

    /**
     * Export all prompts (for backup)
     */
    static exportAll(): Record<string, StoredPrompt> {
        const exported: Record<string, StoredPrompt> = {};

        // Export globals
        for (const type of Object.keys(PROMPT_REGISTRY) as PromptType[]) {
            const prompt = this.getGlobalPrompt(type);
            if (prompt) {
                exported[`global_${type}`] = prompt;
            }
        }

        // Export project prompts (scan localStorage)
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(PROMPT_PROJECT_PREFIX)) {
                const stored = localStorage.getItem(key);
                if (stored) {
                    exported[key.replace(PROMPT_PROJECT_PREFIX, 'project_')] = JSON.parse(stored);
                }
            }
        }

        return exported;
    }

    /**
     * Import prompts (from backup)
     */
    static importAll(data: Record<string, StoredPrompt>): void {
        for (const [key, prompt] of Object.entries(data)) {
            if (key.startsWith('global_')) {
                const type = key.replace('global_', '') as PromptType;
                this.setGlobalPrompt(type, prompt.content);
            } else if (key.startsWith('project_')) {
                const parts = key.replace('project_', '').split('_');
                const type = parts.pop() as PromptType;
                const projectId = parts.join('_');
                this.setProjectPrompt(type, projectId, prompt.content);
            }
        }
    }
}

export default PromptService;
