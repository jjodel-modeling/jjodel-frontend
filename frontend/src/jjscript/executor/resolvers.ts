/**
 * JjScript Element Resolvers
 * Functions to resolve qualified names to actual model elements
 */

import { QualifiedName } from '../types';
import { qualifiedNameToString, matchQualifiedName, parseQualifiedName } from '../parser/grammar';
import { LProject } from '../../joiner';

// ============================================
// MAIN RESOLVER
// ============================================

/**
 * Resolve a qualified name to a model element
 */
export function resolveElement(target: QualifiedName, project: LProject): any {
    if (!target || !project) return null;

    const segments = target.segments;
    if (segments.length === 0) return null;

    // Try multiple resolution strategies
    let result: any = null;

    // Strategy 1: Direct path resolution (Package::Class::Member)
    result = resolveByPath(segments, project);
    if (result) {
        if (target.member) {
            result = resolveMember(result, target.member);
        }
        return result;
    }

    // Strategy 2: Name-only resolution (search all elements)
    if (segments.length === 1) {
        result = resolveByName(segments[0], project);
        if (result) {
            if (target.member) {
                result = resolveMember(result, target.member);
            }
            return result;
        }
    }

    // Strategy 3: Partial path match
    result = resolvePartialPath(segments, project);
    if (result) {
        if (target.member) {
            result = resolveMember(result, target.member);
        }
        return result;
    }

    return null;
}

/**
 * Resolve parent context for element creation
 */
export function resolveParent(parent: QualifiedName | undefined, project: LProject, elementType: string): any {
    if (!parent) {
        return getDefaultParent(project, elementType);
    }
    return resolveElement(parent, project);
}

// ============================================
// RESOLUTION STRATEGIES
// ============================================

/**
 * Resolve by full path (Package::SubPackage::Element)
 */
function resolveByPath(segments: string[], project: LProject): any {
    if (segments.length === 0) return null;

    // Start from project
    let current: any = project;

    for (let i = 0; i < segments.length; i++) {
        const segmentName = segments[i].toLowerCase();
        let found = false;

        // Try to find in various collections
        const collections = [
            'metamodels', 'models', 'packages', 'subPackages',
            'classifiers', 'classes', 'attributes', 'references',
            'operations', 'parameters', 'literals', 'enumerators'
        ];

        for (const collName of collections) {
            const collection = current[collName];
            if (Array.isArray(collection)) {
                const match = collection.find((item: any) =>
                    item?.name?.toLowerCase() === segmentName
                );
                if (match) {
                    current = match;
                    found = true;
                    break;
                }
            }
        }

        // Also check direct name match
        if (!found && current.name?.toLowerCase() === segmentName) {
            found = true;
        }

        if (!found) {
            return null;
        }
    }

    return current;
}

/**
 * Resolve by name only (search all elements in project)
 */
function resolveByName(name: string, project: LProject): any {
    const nameLower = name.toLowerCase();
    const results: any[] = [];

    function search(item: any): void {
        if (!item) return;

        // Check current item
        if (item.name?.toLowerCase() === nameLower) {
            results.push(item);
        }

        // Search in collections
        const collections = [
            'metamodels', 'models', 'packages', 'subPackages',
            'classifiers', 'classes', 'attributes', 'references',
            'operations', 'parameters', 'literals', 'enumerators'
        ];

        for (const collName of collections) {
            const collection = item[collName];
            if (Array.isArray(collection)) {
                for (const child of collection) {
                    search(child);
                }
            }
        }
    }

    search(project);

    // Return first match (could be improved to handle ambiguity)
    return results.length > 0 ? results[0] : null;
}

/**
 * Resolve partial path (try to match suffix)
 */
function resolvePartialPath(segments: string[], project: LProject): any {
    // Try matching from the last segment backwards
    const results: any[] = [];

    function search(item: any, depth: number = 0): void {
        if (!item) return;

        // Check if this item matches the last segment
        const lastSegment = segments[segments.length - 1].toLowerCase();
        if (item.name?.toLowerCase() === lastSegment) {
            // Verify the path matches
            if (verifyPath(item, segments)) {
                results.push(item);
            }
        }

        // Search in collections
        const collections = [
            'metamodels', 'models', 'packages', 'subPackages',
            'classifiers', 'classes', 'attributes', 'references',
            'operations', 'parameters', 'literals', 'enumerators'
        ];

        for (const collName of collections) {
            const collection = item[collName];
            if (Array.isArray(collection)) {
                for (const child of collection) {
                    search(child, depth + 1);
                }
            }
        }
    }

    search(project);
    return results.length > 0 ? results[0] : null;
}

/**
 * Verify that an element's ancestry matches the path segments
 */
function verifyPath(element: any, segments: string[]): boolean {
    if (segments.length <= 1) return true;

    let current = element;
    for (let i = segments.length - 1; i >= 0; i--) {
        if (!current) return false;
        if (current.name?.toLowerCase() !== segments[i].toLowerCase()) {
            // Allow skipping levels
            continue;
        }
        current = current.parent;
    }

    return true;
}

/**
 * Resolve a member (attribute, reference, operation) of an element
 */
function resolveMember(element: any, memberName: string): any {
    if (!element || !memberName) return element;

    const memberLower = memberName.toLowerCase();

    // Search in structural features
    const collections = ['attributes', 'references', 'operations', 'parameters', 'literals'];

    for (const collName of collections) {
        const collection = element[collName];
        if (Array.isArray(collection)) {
            const match = collection.find((item: any) =>
                item?.name?.toLowerCase() === memberLower
            );
            if (match) {
                return match;
            }
        }
    }

    // Check if it's a property
    if (memberName in element) {
        return element[memberName];
    }

    return null;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get default parent for new element based on type
 */
function getDefaultParent(project: LProject, elementType: string): any {
    const metamodels = project.metamodels || [];

    // For classes, enums, packages: use first metamodel's root package
    if (['class', 'abstract class', 'interface', 'enum', 'enumeration', 'package'].includes(elementType)) {
        if (metamodels.length > 0) {
            const mm = metamodels[0];
            const packages = mm.packages || [];
            if (packages.length > 0) {
                return packages[0];
            }
            return mm;
        }
    }

    return null;
}

/**
 * Find all elements matching a pattern
 */
export function findElements(pattern: string, project: LProject, elementType?: string): any[] {
    const results: any[] = [];
    const qn = parseQualifiedName(pattern);

    function search(item: any): void {
        if (!item) return;

        // Check if matches
        const itemQN: QualifiedName = {
            segments: [item.name || ''],
            raw: item.name || ''
        };

        if (matchQualifiedName(qn, itemQN)) {
            // Check type filter
            if (!elementType || matchesType(item, elementType)) {
                results.push(item);
            }
        }

        // Search in collections
        const collections = [
            'metamodels', 'models', 'packages', 'subPackages',
            'classifiers', 'classes', 'attributes', 'references',
            'operations', 'parameters', 'literals', 'enumerators'
        ];

        for (const collName of collections) {
            const collection = item[collName];
            if (Array.isArray(collection)) {
                for (const child of collection) {
                    search(child);
                }
            }
        }
    }

    search(project);
    return results;
}

/**
 * Check if element matches a type
 */
function matchesType(element: any, type: string): boolean {
    const className = element.className || element.constructor?.name || '';
    const typeLower = type.toLowerCase();

    if (typeLower === 'class' && className.includes('Class')) return true;
    if (typeLower === 'attribute' && className.includes('Attribute')) return true;
    if (typeLower === 'reference' && className.includes('Reference')) return true;
    if (typeLower === 'operation' && className.includes('Operation')) return true;
    if (typeLower === 'package' && className.includes('Package')) return true;
    if ((typeLower === 'enum' || typeLower === 'enumeration') && className.includes('Enum')) return true;
    if (typeLower === 'literal' && className.includes('Literal')) return true;
    if (typeLower === 'parameter' && className.includes('Parameter')) return true;

    return false;
}

/**
 * Get the full path of an element
 */
export function getElementPath(element: any): string {
    const segments: string[] = [];
    let current = element;

    while (current) {
        if (current.name) {
            segments.unshift(current.name);
        }
        current = current.parent;
    }

    return segments.join('::');
}

/**
 * Check if one element is an ancestor of another
 */
export function isAncestor(ancestor: any, descendant: any): boolean {
    let current = descendant;
    while (current) {
        if (current.id === ancestor.id) {
            return true;
        }
        current = current.parent;
    }
    return false;
}
