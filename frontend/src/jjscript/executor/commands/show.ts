/**
 * JjScript SHOW Command Handler
 * Shows detailed information about elements
 */

import {
    ShowArgs,
    ExecutionResult,
    ExecutionContext
} from '../../types';
import { resolveElement } from '../resolvers';
import { qualifiedNameToString } from '../../parser/grammar';
import { getProject } from '../utils';

import { LProject } from '../../../joiner';

// ============================================
// SHOW COMMAND EXECUTOR
// ============================================

export async function executeShow(
    args: ShowArgs,
    context: ExecutionContext
): Promise<ExecutionResult> {
    const { target, detail } = args;

    try {
        // Get current project
        const project = getProject(context);
        if (!project) {
            return {
                success: false,
                command: 'show',
                message: 'No active project',
                errors: [{ code: 'NO_PROJECT', message: 'Cannot show element without an active project' }]
            };
        }

        // Handle special targets
        if (target === 'project') {
            return showProject(project, detail);
        }
        if (target === 'model') {
            return showModel(project, detail);
        }

        // Resolve the target element
        const element = resolveElement(target, project);
        if (!element) {
            return {
                success: false,
                command: 'show',
                message: `Element not found: ${qualifiedNameToString(target)}`,
                errors: [{
                    code: 'ELEMENT_NOT_FOUND',
                    message: `Could not find element '${qualifiedNameToString(target)}'`
                }]
            };
        }

        // Generate info based on element type
        const info = generateElementInfo(element, detail);

        return {
            success: true,
            command: 'show',
            message: info.summary,
            data: {
                id: element.id,
                name: element.name,
                type: info.type,
                // Flatten important properties for the formatter
                attributes: info.details.attributes?.length ?? element.attributes?.length ?? 0,
                references: info.details.references?.length ?? element.references?.length ?? 0,
                operations: info.details.operations?.length ?? element.operations?.length ?? 0,
                superTypes: info.details.superTypes || [],
                dataType: info.details.dataType,
                targetType: info.details.targetType,
                multiplicity: info.details.multiplicity,
                containment: info.details.containment,
                // Keep details for full view
                details: detail === 'full' ? formatDetailsArray(info.details, info.type) : undefined,
                tree: detail === 'tree' ? info.tree : undefined
            }
        };

    } catch (error) {
        const err = error as Error;
        return {
            success: false,
            command: 'show',
            message: `Failed to show element: ${err.message}`,
            errors: [{ code: 'SHOW_ERROR', message: err.message }]
        };
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format details object as array of strings for display
 */
function formatDetailsArray(details: Record<string, any>, type: string): string[] {
    const lines: string[] = [];

    if (type === 'class' || type === 'interface' || type === 'abstract class') {
        // Format attributes
        if (details.attributes && details.attributes.length > 0) {
            lines.push('**Attributes:**');
            for (const attr of details.attributes) {
                lines.push(`  \u2022 \`${attr.name}\`: ${attr.type || 'String'} ${attr.multiplicity || ''}`);
            }
        }
        // Format references
        if (details.references && details.references.length > 0) {
            lines.push('**References:**');
            for (const ref of details.references) {
                const cont = ref.containment ? ' \u25C6' : '';
                lines.push(`  \u2192 \`${ref.name}\` \u2192 ${ref.type || '?'}${cont}`);
            }
        }
        // Format operations
        if (details.operations && details.operations.length > 0) {
            lines.push('**Operations:**');
            for (const op of details.operations) {
                lines.push(`  \u25B8 \`${op.name}()\` \u2192 ${op.returnType || 'void'}`);
            }
        }
    } else if (type === 'enum' || type === 'enumeration') {
        if (details.literals && details.literals.length > 0) {
            lines.push('**Literals:**');
            for (const lit of details.literals) {
                const val = lit.value !== undefined ? ` = ${lit.value}` : '';
                lines.push(`  \u2022 \`${lit.name}\`${val}`);
            }
        }
    } else if (type === 'package') {
        if (details.classifiers && details.classifiers.length > 0) {
            lines.push('**Classifiers:**');
            for (const cls of details.classifiers.slice(0, 10)) {
                lines.push(`  \u2022 \`${cls}\``);
            }
            if (details.classifiers.length > 10) {
                lines.push(`  *...and ${details.classifiers.length - 10} more*`);
            }
        }
    }

    return lines;
}

function showProject(project: LProject, detail?: 'brief' | 'full' | 'tree'): ExecutionResult {
    const metamodels = project.metamodels || [];
    const models = project.models || [];

    let summary = `Project: ${project.name}\n`;
    summary += `  Metamodels: ${metamodels.length}\n`;
    summary += `  Models: ${models.length}`;

    const details: string[] = [];

    if (detail !== 'brief') {
        for (const mm of metamodels) {
            const classes = mm.classes?.length || 0;
            details.push(`  📦 ${mm.name} (${classes} classes)`);
        }
        for (const m of models) {
            const objects = m.objects?.length || 0;
            details.push(`  📄 ${m.name} (${objects} objects)`);
        }
    }

    let tree: string[] | undefined;
    if (detail === 'tree') {
        tree = generateProjectTree(project);
    }

    return {
        success: true,
        command: 'show',
        message: summary,
        data: {
            id: project.id,
            name: project.name,
            type: 'project',
            metamodels: metamodels.length,
            models: models.length,
            details,
            tree
        }
    };
}

function showModel(project: LProject, detail?: 'brief' | 'full' | 'tree'): ExecutionResult {
    const metamodels = project.metamodels || [];

    if (metamodels.length === 0) {
        return {
            success: true,
            command: 'show',
            message: 'No metamodels in project',
            data: { count: 0 }
        };
    }

    // Show first metamodel by default
    const mm = metamodels[0];
    const classes = (project as any).classes || [];
    const enums = (project as any).enumerators || [];

    let summary = `Metamodel: ${mm.name}\n`;
    summary += `  Classes: ${classes.length}\n`;
    summary += `  Enumerations: ${enums.length}`;

    const details: string[] = [];

    if (detail !== 'brief') {
        for (const cls of classes.slice(0, 20)) {
            const attrs = cls.attributes?.length || 0;
            const refs = cls.references?.length || 0;
            const prefix = cls.abstract ? '🔷' : cls.interface ? '🔶' : '📦';
            details.push(`  ${prefix} ${cls.name} (${attrs}A, ${refs}R)`);
        }
        if (classes.length > 20) {
            details.push(`  ... and ${classes.length - 20} more`);
        }
    }

    let tree: string[] | undefined;
    if (detail === 'tree') {
        tree = generateModelTree(mm);
    }

    return {
        success: true,
        command: 'show',
        message: summary,
        data: {
            id: mm.id,
            name: mm.name,
            type: 'metamodel',
            classes: classes.length,
            enums: enums.length,
            details,
            tree
        }
    };
}

interface ElementInfo {
    type: string;
    summary: string;
    details: Record<string, any>;
    tree?: string[];
}

function generateElementInfo(element: any, detail?: 'brief' | 'full' | 'tree'): ElementInfo {
    const className = element.className || element.constructor?.name || '';

    if (className.includes('Class')) {
        return generateClassInfo(element, detail);
    }
    if (className.includes('Attribute')) {
        return generateAttributeInfo(element, detail);
    }
    if (className.includes('Reference')) {
        return generateReferenceInfo(element, detail);
    }
    if (className.includes('Operation')) {
        return generateOperationInfo(element, detail);
    }
    if (className.includes('Package')) {
        return generatePackageInfo(element, detail);
    }
    if (className.includes('Enum') && !className.includes('Literal')) {
        return generateEnumInfo(element, detail);
    }

    // Default info
    return {
        type: 'element',
        summary: `${element.name || 'unnamed'}`,
        details: { id: element.id, name: element.name }
    };
}

function generateClassInfo(cls: any, detail?: 'brief' | 'full' | 'tree'): ElementInfo {
    const type = cls.interface ? 'interface' : cls.abstract ? 'abstract class' : 'class';
    const attrs = cls.attributes || [];
    const refs = cls.references || [];
    const ops = cls.operations || [];

    let summary = `${type} ${cls.name}\n`;
    summary += `  Attributes: ${attrs.length}\n`;
    summary += `  References: ${refs.length}\n`;
    summary += `  Operations: ${ops.length}`;

    const details: Record<string, any> = {
        abstract: cls.abstract,
        interface: cls.interface,
        superTypes: cls.superTypes?.map((s: any) => s.name || s) || []
    };

    if (detail !== 'brief') {
        details.attributes = attrs.map((a: any) => ({
            name: a.name,
            type: a.type,
            multiplicity: `[${a.lowerBound || 0}..${a.upperBound === -1 ? '*' : a.upperBound || 1}]`
        }));
        details.references = refs.map((r: any) => ({
            name: r.name,
            type: r.type?.name || r.type,
            containment: r.containment
        }));
        details.operations = ops.map((o: any) => ({
            name: o.name,
            returnType: o.type,
            parameters: o.parameters?.length || 0
        }));
    }

    let tree: string[] | undefined;
    if (detail === 'tree') {
        tree = [
            `${type} ${cls.name}`,
            ...attrs.map((a: any) => `  ├─ ${a.name}: ${a.type || 'String'}`),
            ...refs.map((r: any) => `  ├─ ${r.name} → ${r.type?.name || '?'}`),
            ...ops.map((o: any) => `  └─ ${o.name}()`)
        ];
    }

    return { type, summary, details, tree };
}

function generateAttributeInfo(attr: any, detail?: 'brief' | 'full' | 'tree'): ElementInfo {
    const dataType = attr.type || 'String';
    const lower = attr.lowerBound ?? 0;
    const upper = attr.upperBound ?? 1;
    const mult = lower === 0 && upper === 1 ? '' : `[${lower}..${upper === -1 ? '*' : upper}]`;

    let summary = `attribute ${attr.name}: ${dataType}${mult}`;

    const details: Record<string, any> = {
        dataType,
        multiplicity: mult || '[0..1]',
        lowerBound: lower,
        upperBound: upper,
        derived: attr.derived,
        changeable: attr.changeable,
        defaultValue: attr.defaultValueLiteral
    };

    return { type: 'attribute', summary, details };
}

function generateReferenceInfo(ref: any, detail?: 'brief' | 'full' | 'tree'): ElementInfo {
    const targetType = ref.type?.name || ref.type || '?';
    const lower = ref.lowerBound ?? 0;
    const upper = ref.upperBound ?? 1;
    const mult = lower === 0 && upper === 1 ? '' : `[${lower}..${upper === -1 ? '*' : upper}]`;

    let summary = `reference ${ref.name} \u2192 ${targetType}${mult}`;
    if (ref.containment) summary += ' (containment)';
    if (ref.opposite) summary += ` \u2194 ${ref.opposite.name || ref.opposite}`;

    const details: Record<string, any> = {
        targetType,
        multiplicity: mult || '[0..1]',
        lowerBound: lower,
        upperBound: upper,
        containment: ref.containment,
        opposite: ref.opposite?.name
    };

    return { type: 'reference', summary, details };
}

function generateOperationInfo(op: any, detail?: 'brief' | 'full' | 'tree'): ElementInfo {
    const returnType = op.type || 'void';
    const params = op.parameters || [];

    const paramStr = params.map((p: any) => `${p.name}: ${p.type || 'Object'}`).join(', ');
    let summary = `operation ${op.name}(${paramStr}): ${returnType}`;

    const details: Record<string, any> = {
        returnType,
        parameters: params.map((p: any) => ({ name: p.name, type: p.type }))
    };

    return { type: 'operation', summary, details };
}

function generatePackageInfo(pkg: any, detail?: 'brief' | 'full' | 'tree'): ElementInfo {
    const classifiers = pkg.classifiers || [];
    const subPackages = pkg.subPackages || [];

    let summary = `package ${pkg.name}\n`;
    summary += `  Classifiers: ${classifiers.length}\n`;
    summary += `  Subpackages: ${subPackages.length}`;

    const details: Record<string, any> = {
        uri: pkg.uri,
        prefix: pkg.prefix,
        classifiers: classifiers.map((c: any) => c.name),
        subPackages: subPackages.map((p: any) => p.name)
    };

    let tree: string[] | undefined;
    if (detail === 'tree') {
        tree = generatePackageTree(pkg, 0);
    }

    return { type: 'package', summary, details, tree };
}

function generateEnumInfo(enm: any, detail?: 'brief' | 'full' | 'tree'): ElementInfo {
    const literals = enm.literals || [];

    let summary = `enum ${enm.name} { ${literals.map((l: any) => l.name).join(', ')} }`;

    const details: Record<string, any> = {
        literals: literals.map((l: any) => ({ name: l.name, value: l.value }))
    };

    return { type: 'enum', summary, details };
}

function generateProjectTree(project: LProject): string[] {
    const lines: string[] = [`📁 ${project.name}`];

    const metamodels = project.metamodels || [];
    for (let i = 0; i < metamodels.length; i++) {
        const mm = metamodels[i];
        const isLast = i === metamodels.length - 1;
        const prefix = isLast ? '└─' : '├─';
        lines.push(`  ${prefix} 📦 ${mm.name}`);

        const packages = mm.packages || [];
        for (const pkg of packages) {
            const pkgLines = generatePackageTree(pkg, 2);
            lines.push(...pkgLines.map(l => '  ' + (isLast ? '   ' : '│  ') + l));
        }
    }

    return lines;
}

function generateModelTree(mm: any): string[] {
    const lines: string[] = [`📦 ${mm.name}`];

    const packages = mm.packages || [];
    for (const pkg of packages) {
        lines.push(...generatePackageTree(pkg, 1));
    }

    return lines;
}

function generatePackageTree(pkg: any, indent: number): string[] {
    const prefix = '  '.repeat(indent);
    const lines: string[] = [`${prefix}📂 ${pkg.name}`];

    const classifiers = pkg.classifiers || [];
    const subPackages = pkg.subPackages || [];

    for (const cls of classifiers) {
        const icon = cls.interface ? '🔶' : cls.abstract ? '🔷' : '📄';
        lines.push(`${prefix}  ├─ ${icon} ${cls.name}`);
    }

    for (const sub of subPackages) {
        lines.push(...generatePackageTree(sub, indent + 1));
    }

    return lines;
}
