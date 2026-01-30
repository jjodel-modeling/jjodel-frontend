/**
 * JjScript VALIDATE Command Handler
 * Validates model elements
 */

import {
    ValidateArgs,
    ExecutionResult,
    ExecutionContext
} from '../../types';
import { resolveElement } from '../resolvers';
import { qualifiedNameToString } from '../../parser/grammar';
import { getProject } from '../utils';

import { LProject } from '../../../joiner';

// ============================================
// VALIDATE COMMAND EXECUTOR
// ============================================

export async function executeValidate(
    args: ValidateArgs,
    context: ExecutionContext
): Promise<ExecutionResult> {
    const { target } = args;

    try {
        // Get current project
        const project = getProject(context);
        if (!project) {
            return {
                success: false,
                command: 'validate',
                message: 'No active project',
                errors: [{ code: 'NO_PROJECT', message: 'Cannot validate without an active project' }]
            };
        }

        // Determine what to validate
        let scope: any;
        let scopeName: string;

        if (!target || target === 'all') {
            scope = project;
            scopeName = 'project';
        } else {
            scope = resolveElement(target, project);
            if (!scope) {
                return {
                    success: false,
                    command: 'validate',
                    message: `Element not found: ${qualifiedNameToString(target)}`,
                    errors: [{
                        code: 'ELEMENT_NOT_FOUND',
                        message: `Could not find element '${qualifiedNameToString(target)}'`
                    }]
                };
            }
            scopeName = scope.name || qualifiedNameToString(target);
        }

        // Perform validation
        const issues = validateElement(scope);

        if (issues.length === 0) {
            return {
                success: true,
                command: 'validate',
                message: `Validation passed: ${scopeName} has no issues`,
                data: {
                    scope: scopeName,
                    issues: [],
                    valid: true
                }
            };
        }

        // Format issues
        const errors = issues.filter(i => i.severity === 'error');
        const warnings = issues.filter(i => i.severity === 'warning');
        const infos = issues.filter(i => i.severity === 'info');

        let message = `Validation of ${scopeName}:\n`;
        message += `  Errors: ${errors.length}\n`;
        message += `  Warnings: ${warnings.length}\n`;
        message += `  Info: ${infos.length}`;

        if (errors.length > 0) {
            message += '\n\nErrors:';
            for (const err of errors.slice(0, 5)) {
                message += `\n  - ${err.message}`;
                if (err.element) message += ` (${err.element})`;
            }
            if (errors.length > 5) {
                message += `\n  ... and ${errors.length - 5} more`;
            }
        }

        if (warnings.length > 0) {
            message += '\n\nWarnings:';
            for (const warn of warnings.slice(0, 5)) {
                message += `\n  - ${warn.message}`;
            }
            if (warnings.length > 5) {
                message += `\n  ... and ${warnings.length - 5} more`;
            }
        }

        return {
            success: errors.length === 0,
            command: 'validate',
            message,
            data: {
                scope: scopeName,
                issues,
                valid: errors.length === 0,
                errorCount: errors.length,
                warningCount: warnings.length,
                infoCount: infos.length
            },
            warnings: warnings.map(w => w.message)
        };

    } catch (error) {
        const err = error as Error;
        return {
            success: false,
            command: 'validate',
            message: `Validation failed: ${err.message}`,
            errors: [{ code: 'VALIDATE_ERROR', message: err.message }]
        };
    }
}

// ============================================
// VALIDATION LOGIC
// ============================================

interface ValidationIssue {
    severity: 'error' | 'warning' | 'info';
    code: string;
    message: string;
    element?: string;
}

function validateElement(element: any): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Recursive validation
    function validate(item: any, path: string = ''): void {
        if (!item) return;

        const itemName = item.name || 'unnamed';
        const itemPath = path ? `${path}::${itemName}` : itemName;
        const className = item.className || item.constructor?.name || '';

        // Validate based on element type
        if (className.includes('Class')) {
            validateClass(item, itemPath, issues);
        } else if (className.includes('Attribute')) {
            validateAttribute(item, itemPath, issues);
        } else if (className.includes('Reference')) {
            validateReference(item, itemPath, issues);
        } else if (className.includes('Operation')) {
            validateOperation(item, itemPath, issues);
        } else if (className.includes('Package')) {
            validatePackage(item, itemPath, issues);
        } else if (className.includes('Enum') && !className.includes('Literal')) {
            validateEnum(item, itemPath, issues);
        }

        // Recurse into children
        if (item.metamodels) item.metamodels.forEach((m: any) => validate(m, itemPath));
        if (item.packages) item.packages.forEach((p: any) => validate(p, itemPath));
        if (item.subPackages) item.subPackages.forEach((p: any) => validate(p, itemPath));
        if (item.classifiers) item.classifiers.forEach((c: any) => validate(c, itemPath));
        if (item.attributes) item.attributes.forEach((a: any) => validate(a, itemPath));
        if (item.references) item.references.forEach((r: any) => validate(r, itemPath));
        if (item.operations) item.operations.forEach((o: any) => validate(o, itemPath));
        if (item.literals) item.literals.forEach((l: any) => validate(l, itemPath));
    }

    validate(element);
    return issues;
}

function validateClass(cls: any, path: string, issues: ValidationIssue[]): void {
    // Check for valid name
    if (!cls.name || cls.name.trim() === '') {
        issues.push({
            severity: 'error',
            code: 'MISSING_NAME',
            message: 'Class has no name',
            element: path
        });
    } else if (!/^[A-Z]/.test(cls.name)) {
        issues.push({
            severity: 'warning',
            code: 'NAMING_CONVENTION',
            message: 'Class name should start with uppercase letter',
            element: path
        });
    }

    // Check abstract class has no instances
    if (cls.abstract && cls.interface) {
        issues.push({
            severity: 'warning',
            code: 'ABSTRACT_INTERFACE',
            message: 'Class is both abstract and interface (redundant)',
            element: path
        });
    }

    // Check for empty class
    const attrs = cls.attributes?.length || 0;
    const refs = cls.references?.length || 0;
    const ops = cls.operations?.length || 0;
    if (attrs === 0 && refs === 0 && ops === 0 && !cls.abstract) {
        issues.push({
            severity: 'info',
            code: 'EMPTY_CLASS',
            message: 'Class has no attributes, references, or operations',
            element: path
        });
    }
}

function validateAttribute(attr: any, path: string, issues: ValidationIssue[]): void {
    // Check for valid name
    if (!attr.name || attr.name.trim() === '') {
        issues.push({
            severity: 'error',
            code: 'MISSING_NAME',
            message: 'Attribute has no name',
            element: path
        });
    } else if (/^[A-Z]/.test(attr.name)) {
        issues.push({
            severity: 'warning',
            code: 'NAMING_CONVENTION',
            message: 'Attribute name should start with lowercase letter',
            element: path
        });
    }

    // Check multiplicity
    const lower = attr.lowerBound ?? 0;
    const upper = attr.upperBound ?? 1;
    if (lower < 0) {
        issues.push({
            severity: 'error',
            code: 'INVALID_MULTIPLICITY',
            message: 'Lower bound cannot be negative',
            element: path
        });
    }
    if (upper !== -1 && upper < lower) {
        issues.push({
            severity: 'error',
            code: 'INVALID_MULTIPLICITY',
            message: 'Upper bound cannot be less than lower bound',
            element: path
        });
    }
}

function validateReference(ref: any, path: string, issues: ValidationIssue[]): void {
    // Check for valid name
    if (!ref.name || ref.name.trim() === '') {
        issues.push({
            severity: 'error',
            code: 'MISSING_NAME',
            message: 'Reference has no name',
            element: path
        });
    }

    // Check for target type
    if (!ref.type) {
        issues.push({
            severity: 'error',
            code: 'MISSING_TYPE',
            message: 'Reference has no target type',
            element: path
        });
    }

    // Check opposite consistency
    if (ref.opposite) {
        // Would need to resolve opposite and check it points back
        // Simplified check for now
    }

    // Check containment with multiplicity
    if (ref.containment) {
        const upper = ref.upperBound ?? 1;
        if (upper === 1) {
            issues.push({
                severity: 'info',
                code: 'SINGLE_CONTAINMENT',
                message: 'Containment reference with max 1 element',
                element: path
            });
        }
    }
}

function validateOperation(op: any, path: string, issues: ValidationIssue[]): void {
    // Check for valid name
    if (!op.name || op.name.trim() === '') {
        issues.push({
            severity: 'error',
            code: 'MISSING_NAME',
            message: 'Operation has no name',
            element: path
        });
    }
}

function validatePackage(pkg: any, path: string, issues: ValidationIssue[]): void {
    // Check for valid name
    if (!pkg.name || pkg.name.trim() === '') {
        issues.push({
            severity: 'error',
            code: 'MISSING_NAME',
            message: 'Package has no name',
            element: path
        });
    }

    // Check for empty package
    const classifiers = pkg.classifiers?.length || 0;
    const subPackages = pkg.subPackages?.length || 0;
    if (classifiers === 0 && subPackages === 0) {
        issues.push({
            severity: 'info',
            code: 'EMPTY_PACKAGE',
            message: 'Package is empty',
            element: path
        });
    }
}

function validateEnum(enm: any, path: string, issues: ValidationIssue[]): void {
    // Check for valid name
    if (!enm.name || enm.name.trim() === '') {
        issues.push({
            severity: 'error',
            code: 'MISSING_NAME',
            message: 'Enum has no name',
            element: path
        });
    }

    // Check for empty enum
    const literals = enm.literals?.length || 0;
    if (literals === 0) {
        issues.push({
            severity: 'warning',
            code: 'EMPTY_ENUM',
            message: 'Enum has no literals',
            element: path
        });
    }
}

