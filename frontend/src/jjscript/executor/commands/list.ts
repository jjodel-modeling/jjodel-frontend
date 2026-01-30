/**
 * JjScript LIST Command Handler
 * Lists model elements with filtering
 */

import {
    ListArgs,
    ExecutionResult,
    ExecutionContext,
    ElementType
} from '../../types';
import { resolveElement } from '../resolvers';
import { qualifiedNameToString } from '../../parser/grammar';
import { getProject } from '../utils';

import { LProject } from '../../../joiner';

// ============================================
// LIST COMMAND EXECUTOR
// ============================================

export async function executeList(
    args: ListArgs,
    context: ExecutionContext
): Promise<ExecutionResult> {
    const { elementType, filter } = args;

    try {
        // Get current project
        const project = getProject(context);
        if (!project) {
            return {
                success: false,
                command: 'list',
                message: 'No active project',
                errors: [{ code: 'NO_PROJECT', message: 'Cannot list elements without an active project' }]
            };
        }

        // Get the scope to search in
        let scope: any = project;
        if (filter?.in) {
            scope = resolveElement(filter.in, project);
            if (!scope) {
                return {
                    success: false,
                    command: 'list',
                    message: `Scope not found: ${qualifiedNameToString(filter.in)}`,
                    errors: [{
                        code: 'ELEMENT_NOT_FOUND',
                        message: `Could not find scope '${qualifiedNameToString(filter.in)}'`
                    }]
                };
            }
        }

        // Collect elements
        const elements = collectElements(scope, elementType, filter?.pattern);

        // Format output
        const output = formatElementList(elements, elementType);

        return {
            success: true,
            command: 'list',
            message: output.summary,
            data: {
                count: elements.length,
                elements: output.items,
                type: elementType || 'all'
            }
        };

    } catch (error) {
        const err = error as Error;
        return {
            success: false,
            command: 'list',
            message: `Failed to list elements: ${err.message}`,
            errors: [{ code: 'LIST_ERROR', message: err.message }]
        };
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

interface CollectedElement {
    id: string;
    name: string;
    type: string;
    path: string;
    details?: string;
}

function collectElements(
    scope: any,
    elementType: ElementType | 'all' | undefined,
    pattern?: string
): CollectedElement[] {
    const elements: CollectedElement[] = [];
    const regex = pattern ? new RegExp(pattern, 'i') : null;

    // Recursive collector
    function collect(item: any, path: string = ''): void {
        if (!item) return;

        const itemType = getElementType(item);
        const itemName = item.name || 'unnamed';
        const itemPath = path ? `${path}::${itemName}` : itemName;

        // Check if matches filter
        const matchesType = !elementType || elementType === 'all' || itemType === elementType;
        const matchesPattern = !regex || regex.test(itemName);

        if (matchesType && matchesPattern && item.id) {
            elements.push({
                id: item.id,
                name: itemName,
                type: itemType,
                path: itemPath,
                details: getElementDetails(item, itemType)
            });
        }

        // Recurse into children
        if (item.metamodels) {
            for (const mm of item.metamodels) {
                collect(mm, itemPath);
            }
        }
        if (item.packages) {
            for (const pkg of item.packages) {
                collect(pkg, itemPath);
            }
        }
        if (item.subPackages) {
            for (const pkg of item.subPackages) {
                collect(pkg, itemPath);
            }
        }
        if (item.classifiers) {
            for (const cls of item.classifiers) {
                collect(cls, itemPath);
            }
        }
        if (item.attributes) {
            for (const attr of item.attributes) {
                collect(attr, itemPath);
            }
        }
        if (item.references) {
            for (const ref of item.references) {
                collect(ref, itemPath);
            }
        }
        if (item.operations) {
            for (const op of item.operations) {
                collect(op, itemPath);
            }
        }
        if (item.parameters) {
            for (const param of item.parameters) {
                collect(param, itemPath);
            }
        }
        if (item.literals) {
            for (const lit of item.literals) {
                collect(lit, itemPath);
            }
        }
    }

    collect(scope);
    return elements;
}

function getElementType(item: any): ElementType {
    const className = item.className || item.constructor?.name || '';

    if (className.includes('Project')) return 'project';
    if (className.includes('Model')) return 'metamodel';
    if (className.includes('Package')) return 'package';
    if (className.includes('Enum') && !className.includes('Literal')) return 'enum';
    if (className.includes('Literal')) return 'literal';
    if (className.includes('Class')) {
        if (item.interface) return 'interface';
        if (item.abstract) return 'abstract class';
        return 'class';
    }
    if (className.includes('Attribute')) return 'attribute';
    if (className.includes('Reference')) return 'reference';
    if (className.includes('Operation')) return 'operation';
    if (className.includes('Parameter')) return 'parameter';
    if (className.includes('Annotation')) return 'annotation';

    return 'class'; // Default
}

function getElementDetails(item: any, type: ElementType): string {
    switch (type) {
        case 'class':
        case 'abstract class':
        case 'interface':
            const attrs = item.attributes?.length || 0;
            const refs = item.references?.length || 0;
            const ops = item.operations?.length || 0;
            return `${attrs}A ${refs}R ${ops}O`;

        case 'attribute':
            return `${item.type || 'String'}${formatMultiplicity(item)}`;

        case 'reference':
            const targetType = item.type?.name || item.type || '?';
            return `→${targetType}${formatMultiplicity(item)}${item.containment ? ' ◆' : ''}`;

        case 'operation':
            const returnType = item.type || 'void';
            const params = item.parameters?.length || 0;
            return `(${params}) → ${returnType}`;

        case 'parameter':
            return item.type || 'Object';

        case 'package':
            const classifiers = item.classifiers?.length || 0;
            const subPkgs = item.subPackages?.length || 0;
            return `${classifiers} classifiers, ${subPkgs} subpackages`;

        case 'enum':
        case 'enumeration':
            const literals = item.literals?.length || 0;
            return `${literals} literals`;

        case 'literal':
            return item.value !== undefined ? `= ${item.value}` : '';

        default:
            return '';
    }
}

function formatMultiplicity(item: any): string {
    const lower = item.lowerBound ?? 0;
    const upper = item.upperBound ?? 1;

    if (lower === 0 && upper === 1) return '';
    if (lower === 1 && upper === 1) return '';
    if (lower === 0 && upper === -1) return '[*]';
    if (lower === 1 && upper === -1) return '[1..*]';

    return `[${lower}..${upper === -1 ? '*' : upper}]`;
}

function pluralizeType(type: string): string {
    const irregulars: Record<string, string> = {
        'class': 'classes',
        'abstract class': 'abstract classes',
        'interface': 'interfaces'
    };
    if (irregulars[type]) return irregulars[type];
    // Default: add 's'
    return type + 's';
}

interface FormattedOutput {
    summary: string;
    items: string[];
}

function formatElementList(elements: CollectedElement[], type?: ElementType | 'all'): FormattedOutput {
    if (elements.length === 0) {
        return {
            summary: type && type !== 'all'
                ? `No ${type}s found`
                : 'No elements found',
            items: []
        };
    }

    // Group by type
    const byType = new Map<string, CollectedElement[]>();
    for (const el of elements) {
        const group = byType.get(el.type) || [];
        group.push(el);
        byType.set(el.type, group);
    }

    const items: string[] = [];

    // Get icon for element type
    const getIcon = (t: string): string => {
        const icons: Record<string, string> = {
            'class': '\u25A0',
            'interface': '\u25C7',
            'abstract class': '\u25A1',
            'attribute': '\u2022',
            'reference': '\u2192',
            'operation': '\u25B8',
            'package': '\u25A3',
            'enum': '\u2261',
            'literal': '\u2022',
        };
        return icons[t] || '\u2022';
    };

    // Format each group
    for (const [elementType, group] of byType) {
        if (type && type !== 'all') {
            // Single type - just list items with icons
            for (const el of group) {
                const icon = getIcon(el.type);
                const details = el.details ? ` *${el.details}*` : '';
                items.push(`${icon} \`${el.name}\`${details}`);
            }
        } else {
            // Multiple types - show headers
            const plural = pluralizeType(elementType);
            items.push(`**${plural.charAt(0).toUpperCase() + plural.slice(1)}** (${group.length})`);
            for (const el of group) {
                const icon = getIcon(el.type);
                const details = el.details ? ` *${el.details}*` : '';
                items.push(`  ${icon} \`${el.name}\`${details}`);
            }
            items.push('');
        }
    }

    const summary = type && type !== 'all'
        ? `Found ${elements.length} ${pluralizeType(type)}`
        : `Found ${elements.length} element${elements.length !== 1 ? 's' : ''}`;

    return { summary, items };
}
