/**
 * Type Provider
 * Provides suggestions for primitive types and common type patterns
 */

import {
    SuggestionProvider,
    AutocompleteContext,
    MetamodelContext,
    Suggestion,
    PRIMITIVE_TYPES,
} from '../types';

// ============================================
// TYPE PROVIDER
// ============================================

export class TypeProvider implements SuggestionProvider {
    name = 'type';
    priority = 85;

    getSuggestions(context: AutocompleteContext, _metamodel?: MetamodelContext): Suggestion[] {
        const suggestions: Suggestion[] = [];
        const { parseContext, currentWord, elementType } = context;
        const filter = currentWord.toLowerCase();

        // Only provide type suggestions in type context
        if (parseContext !== 'type') {
            return suggestions;
        }

        // Primitive types
        suggestions.push(...this.getPrimitiveTypeSuggestions(filter, elementType));

        // Multiplicity suggestions if appropriate
        suggestions.push(...this.getMultiplicitySuggestions(filter));

        return suggestions;
    }

    // ========================================
    // PRIMITIVE TYPE SUGGESTIONS
    // ========================================

    private getPrimitiveTypeSuggestions(filter: string, elementType?: string): Suggestion[] {
        const suggestions: Suggestion[] = [];

        for (const type of PRIMITIVE_TYPES) {
            // Check main name
            if (this.matches(type.name, filter)) {
                suggestions.push(this.createTypeSuggestion(type, filter, elementType));
            } else {
                // Check aliases
                for (const alias of type.aliases) {
                    if (this.matches(alias, filter)) {
                        suggestions.push(this.createTypeSuggestion(type, filter, elementType, alias));
                        break;
                    }
                }
            }
        }

        return suggestions;
    }

    private createTypeSuggestion(
        type: typeof PRIMITIVE_TYPES[0],
        filter: string,
        elementType?: string,
        matchedAlias?: string
    ): Suggestion {
        let priority = this.getPriority(matchedAlias || type.name, filter, 80);

        // Boost String for attributes as it's most common
        if (elementType === 'attribute' && type.name === 'String') {
            priority += 10;
        }

        return {
            text: type.name,
            displayText: type.name,
            type: 'type',
            description: type.description,
            priority,
            icon: this.getTypeIcon(type.name),
        };
    }

    private getTypeIcon(typeName: string): string {
        const icons: Record<string, string> = {
            'String': 'bi-fonts',
            'Integer': 'bi-123',
            'Boolean': 'bi-toggle-on',
            'Float': 'bi-123',
            'Double': 'bi-123',
            'Date': 'bi-calendar',
            'Object': 'bi-box',
        };
        return icons[typeName] || 'bi-circle';
    }

    // ========================================
    // MULTIPLICITY SUGGESTIONS
    // ========================================

    private getMultiplicitySuggestions(filter: string): Suggestion[] {
        const suggestions: Suggestion[] = [];

        // Common multiplicity patterns
        const multiplicities = [
            { text: '[0..1]', description: 'Optional (zero or one)' },
            { text: '[1]', description: 'Required (exactly one)' },
            { text: '[0..*]', description: 'Many (zero or more)' },
            { text: '[1..*]', description: 'At least one' },
            { text: '[*]', description: 'Many (shorthand)' },
        ];

        for (const mult of multiplicities) {
            if (this.matches(mult.text, filter) || filter.startsWith('[')) {
                suggestions.push({
                    text: mult.text,
                    displayText: mult.text,
                    type: 'keyword',
                    description: mult.description,
                    priority: 65,
                    icon: 'bi-hash',
                });
            }
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

        return false;
    }

    private getPriority(text: string, filter: string, basePriority: number): number {
        if (!filter) return basePriority;

        const textLower = text.toLowerCase();
        const filterLower = filter.toLowerCase();

        // Exact match
        if (textLower === filterLower) return basePriority + 20;

        // Starts with
        if (textLower.startsWith(filterLower)) return basePriority + 15;

        // Contains
        if (textLower.includes(filterLower)) return basePriority + 5;

        return basePriority;
    }
}

export const typeProvider = new TypeProvider();
