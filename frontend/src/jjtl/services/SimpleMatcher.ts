/**
 * SimpleMatcher - Suggestions based on name/type comparison
 * Works with MetamodelElement[] from the JjTL views
 */

import { MetamodelElement } from '../views/MetamodelTreeView';
import { MappingSuggestion, SuggestionConfidence, SuggestionReason } from '../types/suggestions';

export class SimpleMatcher {

    /**
     * Analyze two metamodels and generate mapping suggestions
     */
    analyze(
        sourceElements: MetamodelElement[],
        targetElements: MetamodelElement[]
    ): MappingSuggestion[] {
        const suggestions: MappingSuggestion[] = [];

        // Get all classes from both metamodels (filter out abstract targets)
        const sourceClasses = this.getAllClasses(sourceElements);
        const targetClasses = this.getAllClasses(targetElements)
            .filter(c => !c.isAbstract);

        // 1. Match classes by name
        for (const sourceClass of sourceClasses) {
            const targetClass = this.findMatchingClass(sourceClass, targetClasses);

            if (targetClass) {
                // Suggest class mapping
                suggestions.push(this.createClassSuggestion(sourceClass, targetClass));

                // 2. Match attributes within matched classes
                const sourceAttrs = this.getAttributes(sourceClass);
                const targetAttrs = this.getAttributes(targetClass);

                for (const sourceAttr of sourceAttrs) {
                    const targetAttr = this.findMatchingAttribute(sourceAttr, targetAttrs);

                    if (targetAttr) {
                        suggestions.push(this.createAttributeSuggestion(
                            sourceClass, sourceAttr,
                            targetClass, targetAttr
                        ));
                    }
                }

                // 3. Match references
                const sourceRefs = this.getReferences(sourceClass);
                const targetRefs = this.getReferences(targetClass);

                for (const sourceRef of sourceRefs) {
                    const targetRef = this.findMatchingReference(sourceRef, targetRefs);

                    if (targetRef) {
                        suggestions.push(this.createReferenceSuggestion(
                            sourceClass, sourceRef,
                            targetClass, targetRef
                        ));
                    }
                }
            }
        }

        return suggestions;
    }

    /**
     * Recursively get all classes from metamodel elements
     */
    private getAllClasses(elements: MetamodelElement[]): MetamodelElement[] {
        const classes: MetamodelElement[] = [];

        const traverse = (el: MetamodelElement) => {
            if (el.type === 'class') {
                classes.push(el);
            }
            if (el.children) {
                el.children.forEach(traverse);
            }
        };

        elements.forEach(traverse);
        return classes;
    }

    /**
     * Get attributes from a class element
     */
    private getAttributes(classEl: MetamodelElement): MetamodelElement[] {
        return (classEl.children || []).filter(c => c.type === 'attribute');
    }

    /**
     * Get references from a class element
     */
    private getReferences(classEl: MetamodelElement): MetamodelElement[] {
        return (classEl.children || []).filter(c => c.type === 'reference');
    }

    /**
     * Find a matching class by name
     */
    private findMatchingClass(
        source: MetamodelElement,
        targets: MetamodelElement[]
    ): MetamodelElement | undefined {
        // Exact name match (case insensitive)
        let match = targets.find(t =>
            t.name.toLowerCase() === source.name.toLowerCase()
        );
        if (match) return match;

        // Fuzzy match
        match = targets.find(t => this.fuzzyMatch(source.name, t.name));
        return match;
    }

    /**
     * Find a matching attribute
     */
    private findMatchingAttribute(
        source: MetamodelElement,
        targets: MetamodelElement[]
    ): MetamodelElement | undefined {
        // Exact name + compatible type
        let match = targets.find(t =>
            t.name.toLowerCase() === source.name.toLowerCase() &&
            this.isCompatibleType(source.dataType || '', t.dataType || '')
        );
        if (match) return match;

        // Exact name only
        match = targets.find(t =>
            t.name.toLowerCase() === source.name.toLowerCase()
        );
        return match;
    }

    /**
     * Find a matching reference
     */
    private findMatchingReference(
        source: MetamodelElement,
        targets: MetamodelElement[]
    ): MetamodelElement | undefined {
        return targets.find(t =>
            t.name.toLowerCase() === source.name.toLowerCase()
        );
    }

    /**
     * Fuzzy match two names
     */
    private fuzzyMatch(a: string, b: string): boolean {
        const normalize = (s: string) => s.toLowerCase().replace(/[_-]/g, '');
        const na = normalize(a);
        const nb = normalize(b);

        // One contains the other
        if (na.includes(nb) || nb.includes(na)) return true;

        // Same prefix (at least 4 chars)
        if (na.length >= 4 && nb.length >= 4 && na.substring(0, 4) === nb.substring(0, 4)) {
            return true;
        }

        return false;
    }

    /**
     * Check if two types are compatible
     */
    private isCompatibleType(sourceType: string, targetType: string): boolean {
        if (!sourceType || !targetType) return true; // Unknown types are compatible
        if (sourceType === targetType) return true;

        const s = sourceType.toLowerCase();
        const t = targetType.toLowerCase();

        // Numeric types
        const numericTypes = ['integer', 'int', 'float', 'double', 'number', 'long', 'short', 'eint', 'efloat', 'edouble'];
        if (numericTypes.includes(s) && numericTypes.includes(t)) return true;

        // String types
        const stringTypes = ['string', 'str', 'text', 'estring'];
        if (stringTypes.includes(s) && stringTypes.includes(t)) return true;

        // Boolean types
        const boolTypes = ['boolean', 'bool', 'eboolean'];
        if (boolTypes.includes(s) && boolTypes.includes(t)) return true;

        return false;
    }

    /**
     * Create a class-level mapping suggestion
     */
    private createClassSuggestion(
        source: MetamodelElement,
        target: MetamodelElement
    ): MappingSuggestion {
        const exactMatch = source.name.toLowerCase() === target.name.toLowerCase();

        return {
            id: `cls_${source.id}_${target.id}`,
            sourceClass: source.name,
            sourceClassId: source.id,
            targetClass: target.name,
            targetClassId: target.id,
            confidence: exactMatch ? 'high' : 'medium',
            reason: exactMatch ? 'same-name-same-type' : 'similar-name',
            reasonText: exactMatch
                ? 'Same class name'
                : `Similar names: ${source.name} ~ ${target.name}`,
            status: 'pending',
        };
    }

    /**
     * Create an attribute mapping suggestion
     */
    private createAttributeSuggestion(
        sourceClass: MetamodelElement,
        sourceAttr: MetamodelElement,
        targetClass: MetamodelElement,
        targetAttr: MetamodelElement
    ): MappingSuggestion {
        const sameType = this.isCompatibleType(
            sourceAttr.dataType || '',
            targetAttr.dataType || ''
        );
        const exactName = sourceAttr.name.toLowerCase() === targetAttr.name.toLowerCase();

        let confidence: SuggestionConfidence = 'low';
        let reason: SuggestionReason = 'similar-name';
        let reasonText = '';
        let conversionHint: string | undefined;

        if (exactName && sameType) {
            confidence = 'high';
            reason = 'same-name-same-type';
            reasonText = 'Same name and compatible type';
        } else if (exactName) {
            confidence = 'medium';
            reason = 'same-name-compatible-type';
            reasonText = `Same name, type: ${sourceAttr.dataType || '?'} -> ${targetAttr.dataType || '?'}`;

            // Suggest conversion for boolean -> integer
            if (this.isBooleanType(sourceAttr.dataType) && this.isNumericType(targetAttr.dataType)) {
                conversionHint = 'true=1, false=0';
            }
            // Suggest conversion for integer -> boolean
            if (this.isNumericType(sourceAttr.dataType) && this.isBooleanType(targetAttr.dataType)) {
                conversionHint = '0=false, else=true';
            }
        }

        return {
            id: `attr_${sourceClass.id}_${sourceAttr.id}_${targetAttr.id}`,
            sourceClass: sourceClass.name,
            sourceClassId: sourceClass.id,
            sourceAttribute: sourceAttr.name,
            sourceAttributeId: sourceAttr.id,
            sourceType: sourceAttr.dataType,
            targetClass: targetClass.name,
            targetClassId: targetClass.id,
            targetAttribute: targetAttr.name,
            targetAttributeId: targetAttr.id,
            targetType: targetAttr.dataType,
            confidence,
            reason,
            reasonText,
            conversionHint,
            status: 'pending',
        };
    }

    /**
     * Create a reference mapping suggestion
     */
    private createReferenceSuggestion(
        sourceClass: MetamodelElement,
        sourceRef: MetamodelElement,
        targetClass: MetamodelElement,
        targetRef: MetamodelElement
    ): MappingSuggestion {
        return {
            id: `ref_${sourceClass.id}_${sourceRef.id}_${targetRef.id}`,
            sourceClass: sourceClass.name,
            sourceClassId: sourceClass.id,
            sourceAttribute: sourceRef.name,
            sourceAttributeId: sourceRef.id,
            sourceType: sourceRef.dataType ? `-> ${sourceRef.dataType}` : undefined,
            targetClass: targetClass.name,
            targetClassId: targetClass.id,
            targetAttribute: targetRef.name,
            targetAttributeId: targetRef.id,
            targetType: targetRef.dataType ? `-> ${targetRef.dataType}` : undefined,
            confidence: 'medium',
            reason: 'same-name-same-type',
            reasonText: 'Same reference name',
            status: 'pending',
        };
    }

    private isBooleanType(type: string | undefined): boolean {
        if (!type) return false;
        return ['boolean', 'bool', 'eboolean'].includes(type.toLowerCase());
    }

    private isNumericType(type: string | undefined): boolean {
        if (!type) return false;
        return ['integer', 'int', 'float', 'double', 'number'].includes(type.toLowerCase());
    }
}

export const simpleMatcher = new SimpleMatcher();
