/**
 * JjScript Service
 * Integration service for JjScript with Jjodie chat
 */

import { executeCommand, ExecutionResult, parse } from '../index';
import { DUser, L, LUser, LProject } from '../../joiner';

// ============================================
// JJSCRIPT SERVICE
// ============================================

export class JjScriptService {
    private static commandHistory: string[] = [];
    private static maxHistorySize = 50;

    /**
     * Check if a message is a JjScript command
     * Commands start with a known command word or / prefix
     */
    static isJjScriptCommand(message: string): boolean {
        if (!message || message.trim() === '') return false;

        const trimmed = message.trim();

        // Check for / prefix (explicit command mode)
        if (trimmed.startsWith('/')) {
            const withoutPrefix = trimmed.substring(1).trim();
            return this.startsWithCommand(withoutPrefix);
        }

        // Check if starts with a command word directly
        return this.startsWithCommand(trimmed);
    }

    /**
     * Check if text starts with a known command
     */
    private static startsWithCommand(text: string): boolean {
        const commands = [
            'create', 'delete', 'rename', 'set', 'add', 'remove',
            'move', 'copy', 'list', 'show', 'help', 'undo', 'redo',
            'validate', 'clear'
        ];

        const firstWord = text.split(/\s+/)[0]?.toLowerCase();
        return commands.includes(firstWord);
    }

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

        // Execute the command
        const result = await executeCommand(command, projectId);

        // Add to history if successful
        if (result.success) {
            this.addToHistory(command);
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
     */
    static getSuggestions(input: string): string[] {
        const suggestions: string[] = [];

        if (!input || input.length < 1) {
            return ['create', 'delete', 'rename', 'list', 'show', 'help'];
        }

        const lower = input.toLowerCase();

        // Command suggestions
        const commands = ['create', 'delete', 'rename', 'set', 'add', 'remove', 'move', 'copy', 'list', 'show', 'help', 'undo', 'redo', 'validate'];
        for (const cmd of commands) {
            if (cmd.startsWith(lower)) {
                suggestions.push(cmd);
            }
        }

        // Context-aware suggestions based on first word
        const parts = input.split(/\s+/);
        if (parts.length >= 2) {
            const firstWord = parts[0].toLowerCase();

            if (firstWord === 'create' || firstWord === 'add') {
                const types = ['class', 'abstract class', 'interface', 'attribute', 'reference', 'operation', 'package', 'enum', 'literal'];
                const lastPart = parts[parts.length - 1].toLowerCase();
                for (const type of types) {
                    if (type.startsWith(lastPart)) {
                        suggestions.push(parts.slice(0, -1).join(' ') + ' ' + type);
                    }
                }
            }
        }

        return suggestions.slice(0, 8);
    }
}

export default JjScriptService;
