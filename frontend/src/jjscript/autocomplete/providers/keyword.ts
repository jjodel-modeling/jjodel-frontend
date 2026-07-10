/**
 * Keyword Provider
 * Provides suggestions for commands, keywords, and element types
 */

import {
    SuggestionProvider,
    AutocompleteContext,
    MetamodelContext,
    Suggestion,
    COMMAND_DEFS,
    ELEMENT_TYPE_DEFS,
    KEYWORDS,
} from '../types';

// ============================================
// KEYWORD PROVIDER
// ============================================

export class KeywordProvider implements SuggestionProvider {
    name = 'keyword';
    priority = 100;

    getSuggestions(context: AutocompleteContext, _metamodel?: MetamodelContext): Suggestion[] {
        const suggestions: Suggestion[] = [];
        const { parseContext, currentWord, command } = context;
        const filter = currentWord.toLowerCase().replace(/^\//, '');

        switch (parseContext) {
            case 'start':
                suggestions.push(...this.getCommandSuggestions(filter));
                break;

            case 'command':
                suggestions.push(...this.getCommandSuggestions(filter));
                break;

            case 'element_type':
                suggestions.push(...this.getElementTypeSuggestions(filter, command));
                break;

            case 'keyword':
                suggestions.push(...this.getKeywordSuggestions(filter, command));
                break;

            case 'target':
                // Keywords that can follow targets
                suggestions.push(...this.getTargetKeywords(filter, command));
                break;

            default:
                // For other contexts, might still need keywords
                suggestions.push(...this.getContextKeywords(filter, parseContext, command));
        }

        return suggestions;
    }

    // ========================================
    // COMMAND SUGGESTIONS
    // ========================================

    private getCommandSuggestions(filter: string): Suggestion[] {
        const suggestions: Suggestion[] = [];

        for (const cmd of COMMAND_DEFS) {
            if (this.matches(cmd.name, filter)) {
                suggestions.push({
                    text: cmd.name,
                    displayText: cmd.name,
                    type: 'command',
                    description: cmd.description,
                    snippet: cmd.syntax,
                    priority: this.getCommandPriority(cmd.name, filter),
                    icon: 'bi-terminal',
                });
            }
        }

        return suggestions;
    }

    private getCommandPriority(command: string, filter: string): number {
        // Exact prefix match gets highest priority
        if (command.toLowerCase().startsWith(filter)) {
            // Common commands get boosted
            const commonCommands = ['create', 'show', 'list', 'help', 'delete'];
            if (commonCommands.includes(command)) {
                return 100;
            }
            return 90;
        }
        // Fuzzy match gets lower priority
        return 70;
    }

    // ========================================
    // ELEMENT TYPE SUGGESTIONS
    // ========================================

    private getElementTypeSuggestions(filter: string, command?: string): Suggestion[] {
        const suggestions: Suggestion[] = [];

        for (const elem of ELEMENT_TYPE_DEFS) {
            if (this.matches(elem.name, filter)) {
                const priority = this.getElementTypePriority(elem.name, filter, command);
                suggestions.push({
                    text: elem.name,
                    displayText: elem.name,
                    type: 'keyword',
                    description: elem.description,
                    priority,
                    icon: elem.icon,
                });
            }
        }

        return suggestions;
    }

    private getElementTypePriority(elementType: string, filter: string, command?: string): number {
        let priority = elementType.toLowerCase().startsWith(filter) ? 80 : 60;

        // Boost based on command context
        if (command === 'create' || command === 'add') {
            if (['class', 'attribute', 'reference'].includes(elementType)) {
                priority += 10;
            }
        } else if (command === 'list') {
            if (['class', 'attribute', 'reference', 'enum'].includes(elementType)) {
                priority += 10;
            }
        }

        return priority;
    }

    // ========================================
    // KEYWORD SUGGESTIONS
    // ========================================

    private getKeywordSuggestions(filter: string, command?: string): Suggestion[] {
        const suggestions: Suggestion[] = [];
        const relevantKeywords = this.getRelevantKeywords(command);

        for (const kw of relevantKeywords) {
            if (this.matches(kw.name, filter)) {
                suggestions.push({
                    text: kw.name,
                    displayText: kw.name,
                    type: 'keyword',
                    description: kw.description,
                    priority: kw.name.toLowerCase().startsWith(filter) ? 75 : 55,
                    icon: 'bi-key',
                });
            }
        }

        return suggestions;
    }

    private getRelevantKeywords(command?: string): typeof KEYWORDS {
        if (!command) return KEYWORDS;

        // Filter keywords by command context
        switch (command) {
            case 'create':
            case 'add':
                return KEYWORDS.filter(k =>
                    ['in', 'type', 'extends', 'with', 'default', 'containment', 'opposite', 'derived', 'readonly'].includes(k.name)
                );
            case 'delete':
                return KEYWORDS.filter(k =>
                    ['cascade', 'force', 'in'].includes(k.name)
                );
            case 'rename':
                return KEYWORDS.filter(k =>
                    ['to'].includes(k.name)
                );
            case 'move':
            case 'copy':
                return KEYWORDS.filter(k =>
                    ['to', 'as', 'deep'].includes(k.name)
                );
            case 'remove':
                return KEYWORDS.filter(k =>
                    ['from'].includes(k.name)
                );
            case 'list':
                return KEYWORDS.filter(k =>
                    ['in'].includes(k.name)
                );
            case 'show':
                return KEYWORDS.filter(k =>
                    ['brief', 'full', 'tree'].includes(k.name)
                );
            default:
                return KEYWORDS;
        }
    }

    // ========================================
    // TARGET KEYWORDS
    // ========================================

    private getTargetKeywords(filter: string, command?: string): Suggestion[] {
        const suggestions: Suggestion[] = [];

        // After specifying a target, what keywords make sense?
        let keywords: string[] = [];

        switch (command) {
            case 'create':
            case 'add':
                keywords = ['in', 'type', 'extends', 'default'];
                break;
            case 'delete':
                keywords = ['cascade', 'force', 'in'];
                break;
            case 'rename':
                keywords = ['to'];
                break;
            case 'move':
            case 'copy':
                keywords = ['to', 'as', 'deep'];
                break;
            case 'show':
                keywords = ['brief', 'full', 'tree'];
                break;
            case 'list':
                keywords = ['in'];
                break;
        }

        for (const kw of keywords) {
            if (this.matches(kw, filter)) {
                const kwDef = KEYWORDS.find(k => k.name === kw);
                suggestions.push({
                    text: kw,
                    displayText: kw,
                    type: 'keyword',
                    description: kwDef?.description,
                    priority: kw.toLowerCase().startsWith(filter) ? 70 : 50,
                    icon: 'bi-key',
                });
            }
        }

        return suggestions;
    }

    // ========================================
    // CONTEXT KEYWORDS
    // ========================================

    private getContextKeywords(filter: string, context: string, command?: string): Suggestion[] {
        const suggestions: Suggestion[] = [];

        // Context-specific keyword suggestions
        switch (context) {
            case 'type':
                // After 'type' keyword, suggest type-related keywords
                if (this.matches('containment', filter)) {
                    suggestions.push({
                        text: 'containment',
                        displayText: 'containment',
                        type: 'keyword',
                        description: 'Mark as containment reference',
                        priority: 60,
                    });
                }
                break;

            case 'value':
                // Suggest boolean values
                if (this.matches('true', filter)) {
                    suggestions.push({
                        text: 'true',
                        displayText: 'true',
                        type: 'value',
                        description: 'Boolean true',
                        priority: 70,
                    });
                }
                if (this.matches('false', filter)) {
                    suggestions.push({
                        text: 'false',
                        displayText: 'false',
                        type: 'value',
                        description: 'Boolean false',
                        priority: 70,
                    });
                }
                break;
        }

        return suggestions;
    }

    // ========================================
    // HELPERS
    // ========================================

    private matches(text: string, filter: string): boolean {
        if (!filter) return true;
        const textLower = text.toLowerCase();
        const filterLower = filter.toLowerCase();

        // Exact prefix match
        if (textLower.startsWith(filterLower)) return true;

        // Contains match
        if (textLower.includes(filterLower)) return true;

        // Simple fuzzy match
        let filterIdx = 0;
        for (const char of textLower) {
            if (char === filterLower[filterIdx]) {
                filterIdx++;
                if (filterIdx === filterLower.length) return true;
            }
        }

        return false;
    }
}

export const keywordProvider = new KeywordProvider();
