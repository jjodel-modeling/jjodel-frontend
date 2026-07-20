/**
 * JjScript Service
 * Integration service for JjScript with Jjodie chat
 */

import { executeCommand, ExecutionResult, parse } from '../index';
import { getSuggestions as getAutocompleteSuggestions, addRecentCommand } from '../autocomplete';
import type { Suggestion } from '../autocomplete';
import { DUser, L, LUser, LProject } from '../../joiner';
import { getActiveLevel, getActiveModel, getActiveMetamodel } from '../executor/utils';

// ============================================
// JJSCRIPT SERVICE
// ============================================

export class JjScriptService {
    private static commandHistory: string[] = [];
    private static maxHistorySize = 50;

    /**
     * Execute a JjScript command
     */
    static async execute(input: string): Promise<ExecutionResult> {
        let command = input.trim();

        // Remove / prefix if present
        if (command.startsWith('/')) {
            command = command.substring(1).trim();
        }

        // Get current project context
        const projectId = this.getCurrentProjectId();

        // Resolve M1/M2 level + modelId + targetMetamodelId from current UI state
        // (read-on-demand: no React coupling, mirrors getCurrentProjectId pattern).
        const level = getActiveLevel();
        const activeModel = level === 'M1' ? getActiveModel() : null;
        const modelId = activeModel?.id;

        let targetMetamodelId: string | undefined;
        if (level === 'M1' && activeModel) {
            const inst = (activeModel as any).instanceof;
            if (inst) {
                targetMetamodelId = typeof inst === 'string' ? inst : inst?.id;
            }
        }
        if (!targetMetamodelId) {
            targetMetamodelId = getActiveMetamodel()?.id;
        }

        // Execute the command
        const result = await executeCommand(command, projectId, modelId, targetMetamodelId, level);

        // Add to history if successful
        if (result.success) {
            this.addToHistory(command);
            // Record for autocomplete recency boosting
            this.recordCommand(command.split(/\s+/)[0]);
        }

        return result;
    }

    /**
     * Parse a command without executing (for preview/validation)
     */
    static parseCommand(input: string) {
        let command = input.trim();
        if (command.startsWith('/')) {
            command = command.substring(1).trim();
        }
        return parse(command);
    }

    /**
     * Get the current project ID
     */
    static getCurrentProjectId(): string | undefined {
        try {
            const user: LUser = L.fromPointer(DUser.current);
            if (user?.project) {
                return (user.project as LProject).id;
            }
        } catch {
            // Ignore errors
        }
        return undefined;
    }

    /**
     * Get command history
     */
    static getHistory(): string[] {
        return [...this.commandHistory];
    }

    /**
     * Add command to history
     */
    private static addToHistory(command: string): void {
        // Remove duplicate if exists
        const existingIndex = this.commandHistory.indexOf(command);
        if (existingIndex !== -1) {
            this.commandHistory.splice(existingIndex, 1);
        }

        // Add to end
        this.commandHistory.push(command);

        // Trim to max size
        if (this.commandHistory.length > this.maxHistorySize) {
            this.commandHistory.shift();
        }
    }

    /**
     * Clear command history
     */
    static clearHistory(): void {
        this.commandHistory = [];
    }

    /**
     * Format result for display in chat
     */
    static formatResultForChat(result: ExecutionResult): string {
        const lines: string[] = [];

        if (result.success) {
            // Success formatting based on command type
            lines.push(...this.formatSuccessResult(result));
        } else {
            // Error formatting
            lines.push(...this.formatErrorResult(result));
        }

        return lines.join('\n');
    }

    /**
     * Format successful command result
     */
    private static formatSuccessResult(result: ExecutionResult): string[] {
        const lines: string[] = [];
        const { command, data } = result;

        // Command-specific formatting
        switch (command) {
            case 'create':
                lines.push(...this.formatCreateResult(result));
                break;
            case 'delete':
                lines.push(...this.formatDeleteResult(result));
                break;
            case 'rename':
                lines.push(...this.formatRenameResult(result));
                break;
            case 'show':
                lines.push(...this.formatShowResult(result));
                break;
            case 'list':
                lines.push(...this.formatListResult(result));
                break;
            case 'eval':
                lines.push(...this.formatEvalResult(result));
                break;
            case 'set':
                lines.push(...this.formatSetResult(result));
                break;
            case 'help':
                lines.push(result.message);
                if (data?.content) {
                    lines.push('', data.content);
                }
                break;
            default:
                // Generic success format
                lines.push(`\u2713 ${result.message}`);
        }

        // Warnings
        if (result.warnings && result.warnings.length > 0) {
            lines.push('');
            for (const warning of result.warnings) {
                lines.push(`\u26A0 ${warning}`);
            }
        }

        return lines;
    }

    /**
     * Format CREATE command result
     */
    private static formatCreateResult(result: ExecutionResult): string[] {
        const { data } = result;
        const lines: string[] = [];

        const typeIcon = this.getTypeIcon(data?.type);
        const typeName = this.formatTypeName(data?.type);

        lines.push(`${typeIcon} **${typeName} created**`);
        lines.push('');
        lines.push(`\`${data?.name}\`${data?.superClass ? ` extends \`${data.superClass}\`` : ''}`);

        return lines;
    }

    /**
     * Format DELETE command result
     */
    private static formatDeleteResult(result: ExecutionResult): string[] {
        return [`\u2717 **Deleted** \`${result.data?.name || 'element'}\``];
    }

    /**
     * Format RENAME command result
     */
    private static formatRenameResult(result: ExecutionResult): string[] {
        const { data } = result;
        return [`\u270E **Renamed** \`${data?.oldName}\` \u2192 \`${data?.newName}\``];
    }

    /**
     * Format SET command result
     */
    private static formatSetResult(result: ExecutionResult): string[] {
        const { data } = result;
        return [`\u2713 **${data?.property}** = \`${data?.value}\``];
    }

    /**
     * Format SHOW command result
     */
    private static formatShowResult(result: ExecutionResult): string[] {
        const { data } = result;
        const lines: string[] = [];

        if (!data) {
            lines.push(result.message);
            return lines;
        }

        const typeIcon = this.getTypeIcon(data.type);
        const typeName = this.formatTypeName(data.type);

        // Header
        lines.push(`${typeIcon} **${data.name}**`);
        lines.push(`*${typeName}*`);
        lines.push('');

        // Stats in a compact format
        if (data.type === 'class' || data.type === 'interface') {
            const stats: string[] = [];
            if (data.attributes !== undefined) stats.push(`**${data.attributes}** attrs`);
            if (data.references !== undefined) stats.push(`**${data.references}** refs`);
            if (data.operations !== undefined) stats.push(`**${data.operations}** ops`);
            if (stats.length > 0) {
                lines.push(stats.join(' \u00B7 '));
            }
            // Superclass info
            if (data.superTypes && data.superTypes.length > 0) {
                lines.push(`extends \`${data.superTypes.join('`, `')}\``);
            }
        } else if (data.type === 'attribute') {
            lines.push(`type: \`${data.dataType || 'String'}\``);
            if (data.multiplicity) lines.push(`multiplicity: ${data.multiplicity}`);
        } else if (data.type === 'reference') {
            lines.push(`\u2192 \`${data.targetType || '?'}\``);
            if (data.multiplicity) lines.push(`multiplicity: ${data.multiplicity}`);
            if (data.containment) lines.push('*containment*');
        } else if (data.type === 'project' || data.type === 'metamodel') {
            if (data.metamodels !== undefined) lines.push(`**${data.metamodels}** metamodels`);
            if (data.models !== undefined) lines.push(`**${data.models}** models`);
            if (data.classes !== undefined) lines.push(`**${data.classes}** classes`);
        }

        // Tree view
        if (data.tree && data.tree.length > 0) {
            lines.push('');
            lines.push('```');
            lines.push(...data.tree);
            lines.push('```');
        }

        // Additional details
        if (data.details && data.details.length > 0) {
            lines.push('');
            for (const detail of data.details) {
                lines.push(detail);
            }
        }

        return lines;
    }

    /**
     * Format LIST command result
     */
    private static formatListResult(result: ExecutionResult): string[] {
        const { data } = result;
        const lines: string[] = [];

        if (!data || data.count === 0) {
            lines.push('*No elements found*');
            return lines;
        }

        // Header with count
        const typeLabel = data.type === 'all' ? 'elements' : `${data.type}s`;
        lines.push(`Found **${data.count}** ${typeLabel}`);
        lines.push('');

        // Elements
        if (data.elements && data.elements.length > 0) {
            for (const item of data.elements) {
                lines.push(item);
            }
        }

        return lines;
    }

    /**
     * Format EVAL (JjEL expression) result
     */
    private static formatEvalResult(result: ExecutionResult): string[] {
        const { data } = result;
        const lines: string[] = [];

        if (!data) {
            lines.push(result.message);
            return lines;
        }

        // Show expression
        lines.push(`\u25B6 \`${data.expression}\``);
        lines.push('');

        if (data.items && data.items.length > 0) {
            // Array result — show as list
            lines.push(result.message);
            lines.push('');
            for (const item of data.items) {
                lines.push(`  \u2022 ${item}`);
            }
        } else {
            // Scalar/object result
            lines.push(result.message);
        }

        return lines;
    }

    /**
     * Format error result
     */
    private static formatErrorResult(result: ExecutionResult): string[] {
        const lines: string[] = [];

        lines.push(`\u2717 **Error**`);
        lines.push('');
        lines.push(result.message);

        if (result.errors && result.errors.length > 0) {
            lines.push('');
            for (const error of result.errors) {
                lines.push(`> ${error.message}`);
                if (error.suggestion) {
                    lines.push(`> *Tip: ${error.suggestion}*`);
                }
            }
        }

        return lines;
    }

    /**
     * Get icon for element type
     */
    private static getTypeIcon(type?: string): string {
        const icons: Record<string, string> = {
            'class': '\u25A0',           // filled square
            'interface': '\u25C7',       // diamond
            'abstract class': '\u25A1',  // empty square
            'attribute': '\u2022',       // bullet
            'reference': '\u2192',       // arrow
            'operation': '\u25B8',       // triangle
            'package': '\u25A3',         // square with box
            'enum': '\u2261',            // triple bar
            'literal': '\u2022',         // bullet
            'project': '\u25C8',         // diamond with dot
            'metamodel': '\u25A3',       // square with box
        };
        return icons[type || ''] || '\u2022';
    }

    /**
     * Format type name for display
     */
    private static formatTypeName(type?: string): string {
        if (!type) return 'Element';
        return type.charAt(0).toUpperCase() + type.slice(1);
    }

    /**
     * Get help text for quick reference
     */
    static getQuickHelp(): string {
        return `
**JjScript Quick Reference**

\`\`\`
create class <name>           Create a new class
create attribute <name> in <class> type <type>
create reference <name> in <class> type <target>
delete <element>              Delete an element
rename <element> to <name>    Rename an element
set <element>.<prop> = <value>  Set property
list [type]                   List elements
show <element>                Show details
help [topic]                  Get help
\`\`\`

Type \`help\` for full documentation.
`;
    }

    /**
     * Get autocomplete suggestions for current input
     * Returns simple string array for backward compatibility
     */
    static getSuggestions(input: string): string[] {
        const suggestions = getAutocompleteSuggestions(input);
        return suggestions.map(s => s.text).slice(0, 10);
    }

    /**
     * Get full autocomplete suggestions with metadata
     */
    static getFullSuggestions(input: string, cursorPosition?: number): Suggestion[] {
        return getAutocompleteSuggestions(input, cursorPosition);
    }

    /**
     * Record a successfully executed command for recency boosting
     */
    static recordCommand(command: string): void {
        addRecentCommand(command);
    }
}

export default JjScriptService;
