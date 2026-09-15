/**
 * Jjodel Model Converter
 *
 * Utilities for converting between Jjodel LObject/LModel format
 * and the JjTL executor's internal format.
 */

import type { ExecutionResult } from './executor';

// ============================================
// SOURCE ELEMENT TYPES
// ============================================

/**
 * Normalized source element for transformation
 */
export interface SourceElement {
    /** Unique identifier */
    id: string;
    /** Class name from metamodel */
    className: string;
    /** Optional name attribute */
    name?: string;
    /** Attribute values keyed by name */
    attributes: Map<string, any>;
    /** Reference values keyed by name (IDs or array of IDs) */
    references: Map<string, string | string[]>;
    /** Original Jjodel object reference (for debugging) */
    __raw?: any;
}

/**
 * Normalized target element created by transformation
 */
export interface TargetElement {
    /** Unique identifier */
    id: string;
    /** Class name in target metamodel */
    className: string;
    /** Name attribute */
    name?: string;
    /** Attribute values */
    attributes: Map<string, any>;
    /** Reference values (IDs) */
    references: Map<string, string | string[]>;
    /** ID of source element that created this */
    sourceId: string;
    /** Mapping rule that created this */
    mappingRule: string;
}

// ============================================
// JJODEL TO EXECUTOR CONVERSION
// ============================================

/**
 * Convert a Jjodel LModel's objects to SourceElement array
 *
 * @param model - Jjodel LModel containing objects
 * @returns Array of normalized source elements
 */
export function convertJjodelModelToSource(model: any): SourceElement[] {
    const elements: SourceElement[] = [];

    if (!model) return elements;

    // Handle LModel with objects array
    const objects = model.objects || model.allObjects || [];

    for (const obj of objects) {
        const element = convertLObjectToSource(obj);
        if (element) {
            elements.push(element);
        }
    }

    return elements;
}

/**
 * Convert a single Jjodel LObject to SourceElement
 */
export function convertLObjectToSource(obj: any): SourceElement | null {
    if (!obj) return null;

    // Get class name from various possible locations
    const className = getClassName(obj);
    if (!className) {
        console.warn('[JjTL Converter] Could not determine class name for object:', obj);
        return null;
    }

    return {
        id: obj.id || generateId(),
        className,
        name: obj.name,
        attributes: extractAttributes(obj),
        references: extractReferences(obj),
        __raw: obj,
    };
}

/**
 * Get class name from Jjodel object
 */
function getClassName(obj: any): string | null {
    // LObject.instanceof.name
    if (obj.instanceof?.name) {
        return obj.instanceof.name;
    }

    // Direct className property
    if (obj.className) {
        return obj.className;
    }

    // __type from plain objects
    if (obj.__type) {
        return obj.__type;
    }

    // Class reference
    if (obj.class?.name) {
        return obj.class.name;
    }

    return null;
}

/**
 * Extract attribute values from Jjodel object
 */
function extractAttributes(obj: any): Map<string, any> {
    const attrs = new Map<string, any>();

    // From features (LAttributeValue[])
    if (obj.features && Array.isArray(obj.features)) {
        for (const feature of obj.features) {
            if (isAttributeFeature(feature)) {
                const name = feature.name || feature.instanceof?.name;
                if (name) {
                    // Get value - could be single or array
                    const value = feature.value ?? feature.values?.[0] ?? null;
                    attrs.set(name, value);
                }
            }
        }
    }

    // From attributeFeatures (specific array)
    if (obj.attributeFeatures && Array.isArray(obj.attributeFeatures)) {
        for (const feature of obj.attributeFeatures) {
            const name = feature.name || feature.instanceof?.name;
            if (name) {
                attrs.set(name, feature.value ?? feature.values?.[0] ?? null);
            }
        }
    }

    // From attributes array
    if (obj.attributes && Array.isArray(obj.attributes)) {
        for (const attr of obj.attributes) {
            if (attr.name) {
                attrs.set(attr.name, attr.value ?? attr.values?.[0] ?? null);
            }
        }
    }

    // From direct properties (plain object format)
    if (typeof obj === 'object' && !Array.isArray(obj)) {
        for (const [key, value] of Object.entries(obj)) {
            // Skip internal properties and already extracted
            if (key.startsWith('_') ||
                key.startsWith('__') ||
                ['id', 'className', 'name', 'features', 'attributes', 'references',
                 'instanceof', 'class', 'attributeFeatures', 'referenceFeatures'].includes(key)) {
                continue;
            }

            // Skip if it looks like a reference (ID or array of IDs)
            if (typeof value === 'string' && value.match(/^[a-zA-Z]+-\d+/) ||
                (Array.isArray(value) && value.every(v => typeof v === 'string' && v.match(/^[a-zA-Z]+-\d+/)))) {
                continue;
            }

            // Skip if already extracted from features
            if (!attrs.has(key)) {
                attrs.set(key, value);
            }
        }
    }

    return attrs;
}

/**
 * Extract reference values from Jjodel object
 */
function extractReferences(obj: any): Map<string, string | string[]> {
    const refs = new Map<string, string | string[]>();

    // From features (LReferenceValue[])
    if (obj.features && Array.isArray(obj.features)) {
        for (const feature of obj.features) {
            if (isReferenceFeature(feature)) {
                const name = feature.name || feature.instanceof?.name;
                if (name) {
                    const values = extractReferenceIds(feature);
                    if (values.length > 0) {
                        refs.set(name, values.length === 1 ? values[0] : values);
                    }
                }
            }
        }
    }

    // From referenceFeatures (specific array)
    if (obj.referenceFeatures && Array.isArray(obj.referenceFeatures)) {
        for (const feature of obj.referenceFeatures) {
            const name = feature.name || feature.instanceof?.name;
            if (name) {
                const values = extractReferenceIds(feature);
                if (values.length > 0) {
                    refs.set(name, values.length === 1 ? values[0] : values);
                }
            }
        }
    }

    // From references array
    if (obj.references && Array.isArray(obj.references)) {
        for (const ref of obj.references) {
            if (ref.name) {
                const target = ref.target || ref.targets || ref.value || ref.values;
                if (target) {
                    if (Array.isArray(target)) {
                        refs.set(ref.name, target.map((t: any) => t?.id || t));
                    } else {
                        refs.set(ref.name, target?.id || target);
                    }
                }
            }
        }
    }

    return refs;
}

/**
 * Check if a feature is an attribute feature
 */
function isAttributeFeature(feature: any): boolean {
    // Check instanceof class name
    if (feature.instanceof?.className === 'DAttributeValue' ||
        feature.instanceof?.className === 'DAttribute') {
        return true;
    }

    // Check type property
    if (feature.type === 'attribute' || feature.type === 'DAttribute') {
        return true;
    }

    // Check if it has a primitive value (not an object reference)
    if (feature.value !== undefined &&
        (typeof feature.value !== 'object' || feature.value === null)) {
        return true;
    }

    return false;
}

/**
 * Check if a feature is a reference feature
 */
function isReferenceFeature(feature: any): boolean {
    // Check instanceof class name
    if (feature.instanceof?.className === 'DReferenceValue' ||
        feature.instanceof?.className === 'DReference') {
        return true;
    }

    // Check type property
    if (feature.type === 'reference' || feature.type === 'DReference') {
        return true;
    }

    // Check if it has object references
    if (feature.values && Array.isArray(feature.values) &&
        feature.values.length > 0 &&
        typeof feature.values[0] === 'object') {
        return true;
    }

    return false;
}

/**
 * Extract IDs from a reference feature
 */
function extractReferenceIds(feature: any): string[] {
    const ids: string[] = [];

    // Single value
    if (feature.value) {
        const id = feature.value?.id || feature.value;
        if (typeof id === 'string') {
            ids.push(id);
        }
    }

    // Multiple values
    if (feature.values && Array.isArray(feature.values)) {
        for (const val of feature.values) {
            const id = val?.id || val;
            if (typeof id === 'string') {
                ids.push(id);
            }
        }
    }

    // Target reference
    if (feature.target) {
        const id = feature.target?.id || feature.target;
        if (typeof id === 'string') {
            ids.push(id);
        }
    }

    // Targets array
    if (feature.targets && Array.isArray(feature.targets)) {
        for (const target of feature.targets) {
            const id = target?.id || target;
            if (typeof id === 'string') {
                ids.push(id);
            }
        }
    }

    return ids;
}

// ============================================
// EXECUTOR RESULT TO JJODEL CONVERSION
// ============================================

/**
 * Convert executor result to Jjodel-compatible format
 *
 * @param result - ExecutionResult from JjtlExecutor
 * @param targetMetamodel - Target metamodel for type info
 * @returns Array of objects ready to be converted to DObjects
 */
export function convertResultToJjodel(
    result: ExecutionResult,
    targetMetamodel?: any
): any[] {
    if (!result.success || !result.targetModel) {
        return [];
    }

    const jjodelObjects: any[] = [];

    // Get all instances from target model
    const instances = result.targetModel.instances;

    if (instances) {
        instances.forEach((classInstances, className) => {
            for (const instance of classInstances) {
                const jjodelObj = convertTargetInstanceToJjodel(instance, className, targetMetamodel);
                jjodelObjects.push(jjodelObj);
            }
        });
    }

    return jjodelObjects;
}

/**
 * Convert a single target instance to Jjodel-compatible format
 */
function convertTargetInstanceToJjodel(
    instance: any,
    className: string,
    targetMetamodel?: any
): any {
    // Find class definition in target metamodel
    const classInfo = findClassInMetamodel(className, targetMetamodel);

    const jjodelObj: any = {
        id: instance.id || generateId(),
        className: instance.className || className,
        name: instance.name,
        __sourceId: instance.__sourceId,
        __createdBy: 'JjTL',
    };

    // Copy attributes
    for (const [key, value] of Object.entries(instance)) {
        if (!key.startsWith('__') && !['id', 'className', 'name'].includes(key)) {
            jjodelObj[key] = value;
        }
    }

    // If we have class info, validate and type attributes
    if (classInfo) {
        for (const attrDef of classInfo.attributes || []) {
            if (jjodelObj[attrDef.name] === undefined && attrDef.defaultValue !== undefined) {
                jjodelObj[attrDef.name] = attrDef.defaultValue;
            }
        }
    }

    return jjodelObj;
}

/**
 * Find a class definition in the metamodel
 */
function findClassInMetamodel(className: string, metamodel: any): any | null {
    if (!metamodel) return null;

    // Direct classes array
    if (metamodel.classes) {
        const found = metamodel.classes.find((c: any) => c.name === className);
        if (found) return found;
    }

    // Search in packages
    if (metamodel.packages) {
        for (const pkg of metamodel.packages) {
            const found = findClassInMetamodel(className, pkg);
            if (found) return found;
        }
    }

    return null;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

let idCounter = 0;

/**
 * Generate a unique ID
 */
function generateId(): string {
    return `jjtl-${Date.now()}-${++idCounter}`;
}

/**
 * Reset ID counter (for testing)
 */
export function resetIdCounter(): void {
    idCounter = 0;
}

/**
 * Build a lookup map from source elements by ID
 */
export function buildSourceLookup(elements: SourceElement[]): Map<string, SourceElement> {
    const lookup = new Map<string, SourceElement>();
    for (const elem of elements) {
        lookup.set(elem.id, elem);
    }
    return lookup;
}

/**
 * Build a lookup map from source elements by class name
 */
export function buildSourceByClass(elements: SourceElement[]): Map<string, SourceElement[]> {
    const lookup = new Map<string, SourceElement[]>();
    for (const elem of elements) {
        if (!lookup.has(elem.className)) {
            lookup.set(elem.className, []);
        }
        lookup.get(elem.className)!.push(elem);
    }
    return lookup;
}

/**
 * Get source element attribute value
 */
export function getSourceAttribute(elem: SourceElement, name: string): any {
    return elem.attributes.get(name);
}

/**
 * Get source element reference value(s)
 */
export function getSourceReference(elem: SourceElement, name: string): string | string[] | undefined {
    return elem.references.get(name);
}

/**
 * Resolve a reference to its target source element
 */
export function resolveReference(
    refId: string,
    lookup: Map<string, SourceElement>
): SourceElement | undefined {
    return lookup.get(refId);
}

/**
 * Resolve multiple references to their target source elements
 */
export function resolveReferences(
    refIds: string[],
    lookup: Map<string, SourceElement>
): SourceElement[] {
    return refIds
        .map(id => lookup.get(id))
        .filter((elem): elem is SourceElement => elem !== undefined);
}
