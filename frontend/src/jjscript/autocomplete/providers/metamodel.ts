/**
 * Metamodel Provider
 * Provides suggestions from the current metamodel (classes, attributes, references, etc.)
 */

import {
    SuggestionProvider,
    AutocompleteContext,
    MetamodelContext,
    Suggestion,
    ClassInfo,
    EnumInfo,
    PackageInfo,
} from '../types';

// ============================================
// METAMODEL PROVIDER
// ============================================

export class MetamodelProvider implements SuggestionProvider {
    name = 'metamodel';
    priority = 90;

    getSuggestions(context: AutocompleteContext, metamodel?: MetamodelContext): Suggestion[] {
        if (!metamodel) return [];

        const suggestions: Suggestion[] = [];
        const { parseContext, currentWord, command, elementType } = context;
        const filter = currentWord.toLowerCase();

        switch (parseContext) {
            case 'target':
                suggestions.push(...this.getTargetSuggestions(filter, metamodel, command, elementType));
                break;

            case 'type':
                suggestions.push(...this.getTypeSuggestions(filter, metamodel));
                break;

            case 'name':
                // For name context, we might suggest existing names for copy/reference
                if (command === 'copy' || command === 'rename') {
                    suggestions.push(...this.getTargetSuggestions(filter, metamodel, command, elementType));
                }
                break;

            case 'property':
                suggestions.push(...this.getPropertySuggestions(filter, context, metamodel));
                break;

            case 'value':
                suggestions.push(...this.getValueSuggestions(filter, context, metamodel));
                break;
        }

        return suggestions;
    }

    // ========================================
    // TARGET SUGGESTIONS
    // ========================================

    private getTargetSuggestions(
        filter: string,
        metamodel: MetamodelContext,
        command?: string,
        elementType?: string
    ): Suggestion[] {
        const suggestions: Suggestion[] = [];

        // Determine what types of elements to suggest based on context
        const suggestClasses = this.shouldSuggestClasses(command, elementType);
        const suggestEnums = this.shouldSuggestEnums(command, elementType);
        const suggestPackages = this.shouldSuggestPackages(command, elementType);
        const suggestAttributes = this.shouldSuggestAttributes(command, elementType);
        const suggestReferences = this.shouldSuggestReferences(command, elementType);

        // Classes
        if (suggestClasses) {
            for (const cls of metamodel.classes) {
                if (this.matches(cls.name, filter)) {
                    suggestions.push(this.createClassSuggestion(cls, filter));
                }
            }
        }

        // Enums
        if (suggestEnums) {
            for (const enm of metamodel.enums) {
                if (this.matches(enm.name, filter)) {
                    suggestions.push(this.createEnumSuggestion(enm, filter));
                }
            }
        }

        // Packages
        if (suggestPackages) {
            for (const pkg of metamodel.packages) {
                if (this.matches(pkg.name, filter)) {
                    suggestions.push(this.createPackageSuggestion(pkg, filter));
                }
            }
        }

        // Attributes and References (need class context)
        if (suggestAttributes || suggestReferences) {
            // Try to find class from context (e.g., "delete Person.name")
            const dotIndex = filter.lastIndexOf('.');
            if (dotIndex !== -1) {
                const className = filter.substring(0, dotIndex);
                const memberFilter = filter.substring(dotIndex + 1);
                const cls = metamodel.classes.find(c =>
                    c.name.toLowerCase() === className.toLowerCase()
                );

                if (cls) {
                    if (suggestAttributes) {
                        for (const attr of cls.attributes) {
                            if (this.matches(attr.name, memberFilter)) {
                                suggestions.push(this.createAttributeSuggestion(attr, cls.name, memberFilter));
                            }
                        }
                    }
                    if (suggestReferences) {
                        for (const ref of cls.references) {
                            if (this.matches(ref.name, memberFilter)) {
                                suggestions.push(this.createReferenceSuggestion(ref, cls.name, memberFilter));
                            }
                        }
                    }
                }
            }
        }

        return suggestions;
    }

    private shouldSuggestClasses(command?: string, elementType?: string): boolean {
        // Most commands can target classes
        if (['delete', 'rename', 'show', 'move', 'copy', 'set'].includes(command || '')) {
            return true;
        }
        // For create/add attribute/reference, we need a class as parent
        if ((command === 'create' || command === 'add') &&
            ['attribute', 'reference', 'operation'].includes(elementType || '')) {
            return true;
        }
        // For list command
        if (command === 'list') {
            return true;
        }
        return false;
    }

    private shouldSuggestEnums(command?: string, _elementType?: string): boolean {
        return ['delete', 'rename', 'show', 'move', 'copy'].includes(command || '');
    }

    private shouldSuggestPackages(command?: string, _elementType?: string): boolean {
        return ['delete', 'rename', 'show', 'move', 'copy', 'list'].includes(command || '');
    }

    private shouldSuggestAttributes(command?: string, elementType?: string): boolean {
        if (['delete', 'rename', 'set'].includes(command || '')) {
            return true;
        }
        if (elementType === 'attribute') {
            return true;
        }
        return false;
    }

    private shouldSuggestReferences(command?: string, elementType?: string): boolean {
        if (['delete', 'rename', 'set'].includes(command || '')) {
            return true;
        }
        if (elementType === 'reference') {
            return true;
        }
        return false;
    }

    // ========================================
    // TYPE SUGGESTIONS
    // ========================================

    private getTypeSuggestions(filter: string, metamodel: MetamodelContext): Suggestion[] {
        const suggestions: Suggestion[] = [];

        // Classes as types (for references)
        for (const cls of metamodel.classes) {
            if (this.matches(cls.name, filter)) {
                suggestions.push({
                    text: cls.name,
                    displayText: cls.name,
                    type: 'class',
                    description: cls.isAbstract ? 'Abstract class' : 'Class',
                    priority: this.getPriority(cls.name, filter, 75),
                    icon: cls.isInterface ? 'bi-diamond' : (cls.isAbstract ? 'bi-square' : 'bi-square-fill'),
                });
            }
        }

        // Enums as types
        for (const enm of metamodel.enums) {
            if (this.matches(enm.name, filter)) {
                suggestions.push({
                    text: enm.name,
                    displayText: enm.name,
                    type: 'enum',
                    description: `Enum (${enm.literals.length} literals)`,
                    priority: this.getPriority(enm.name, filter, 70),
                    icon: 'bi-list-ol',
                });
            }
        }

        return suggestions;
    }

    // ========================================
    // PROPERTY SUGGESTIONS
    // ========================================

    private getPropertySuggestions(
        filter: string,
        context: AutocompleteContext,
        metamodel: MetamodelContext
    ): Suggestion[] {
        const suggestions: Suggestion[] = [];

        // Try to find the class from the target
        const targetName = context.targetName;
        if (!targetName) return suggestions;

        const cls = metamodel.classes.find(c =>
            c.name.toLowerCase() === targetName.toLowerCase()
        );

        if (cls) {
            // Suggest attributes
            for (const attr of cls.attributes) {
                if (this.matches(attr.name, filter)) {
                    suggestions.push({
                        text: attr.name,
                        displayText: attr.name,
                        type: 'attribute',
                        description: `Attribute: ${attr.type}`,
                        priority: this.getPriority(attr.name, filter, 80),
                        icon: 'bi-dash',
                    });
                }
            }

            // Suggest references
            for (const ref of cls.references) {
                if (this.matches(ref.name, filter)) {
                    suggestions.push({
                        text: ref.name,
                        displayText: ref.name,
                        type: 'reference',
                        description: `Reference to ${ref.targetType}`,
                        priority: this.getPriority(ref.name, filter, 75),
                        icon: 'bi-arrow-right',
                    });
                }
            }
        }

        return suggestions;
    }

    // ========================================
    // VALUE SUGGESTIONS
    // ========================================

    private getValueSuggestions(
        filter: string,
        _context: AutocompleteContext,
        metamodel: MetamodelContext
    ): Suggestion[] {
        const suggestions: Suggestion[] = [];

        // Suggest enum literals if we're setting a property of enum type
        for (const enm of metamodel.enums) {
            for (const literal of enm.literals) {
                if (this.matches(literal, filter)) {
                    suggestions.push({
                        text: `${enm.name}.${literal}`,
                        displayText: literal,
                        type: 'literal',
                        description: `${enm.name} literal`,
                        priority: this.getPriority(literal, filter, 65),
                        icon: 'bi-dot',
                    });
                }
            }
        }

        return suggestions;
    }

    // ========================================
    // SUGGESTION CREATORS
    // ========================================

    private createClassSuggestion(cls: ClassInfo, filter: string): Suggestion {
        let description = cls.isInterface ? 'Interface' : (cls.isAbstract ? 'Abstract class' : 'Class');
        if (cls.attributes.length > 0 || cls.references.length > 0) {
            description += ` (${cls.attributes.length} attrs, ${cls.references.length} refs)`;
        }

        return {
            text: cls.name,
            displayText: cls.name,
            type: 'class',
            description,
            priority: this.getPriority(cls.name, filter, 85),
            icon: cls.isInterface ? 'bi-diamond' : (cls.isAbstract ? 'bi-square' : 'bi-square-fill'),
            metadata: { id: cls.id },
        };
    }

    private createEnumSuggestion(enm: EnumInfo, filter: string): Suggestion {
        return {
            text: enm.name,
            displayText: enm.name,
            type: 'enum',
            description: `Enum with ${enm.literals.length} literals`,
            priority: this.getPriority(enm.name, filter, 80),
            icon: 'bi-list-ol',
            metadata: { id: enm.id },
        };
    }

    private createPackageSuggestion(pkg: PackageInfo, filter: string): Suggestion {
        return {
            text: pkg.name,
            displayText: pkg.name,
            type: 'package',
            description: `Package: ${pkg.path}`,
            priority: this.getPriority(pkg.name, filter, 75),
            icon: 'bi-folder',
            metadata: { id: pkg.id },
        };
    }

    private createAttributeSuggestion(
        attr: { id: string; name: string; type: string },
        className: string,
        filter: string
    ): Suggestion {
        return {
            text: `${className}.${attr.name}`,
            displayText: `${className}.${attr.name}`,
            type: 'attribute',
            description: `Attribute: ${attr.type}`,
            priority: this.getPriority(attr.name, filter, 80),
            icon: 'bi-dash',
            metadata: { id: attr.id, className },
        };
    }

    private createReferenceSuggestion(
        ref: { id: string; name: string; targetType: string },
        className: string,
        filter: string
    ): Suggestion {
        return {
            text: `${className}.${ref.name}`,
            displayText: `${className}.${ref.name}`,
            type: 'reference',
            description: `Reference to ${ref.targetType}`,
            priority: this.getPriority(ref.name, filter, 75),
            icon: 'bi-arrow-right',
            metadata: { id: ref.id, className },
        };
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

export const metamodelProvider = new MetamodelProvider();
