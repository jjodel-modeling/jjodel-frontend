/**
 * JjScript CREATE Command Handler
 * Creates new model elements (classes, attributes, references, etc.)
 */

import {
    CreateArgs,
    ExecutionResult,
    ExecutionContext,
    QualifiedName
} from '../../types';
import { resolveElement } from '../resolvers';
import { qualifiedNameToString } from '../../parser/grammar';
import { getProject, getDefaultParent, needsParent } from '../utils';

// Import Jjodel model types and actions
import {
    DClass,
    DAttribute,
    DReference,
    DOperation,
    DParameter,
    DPackage,
    DEnumerator,
    DEnumLiteral,
    SetFieldAction
} from '../../../joiner';

// ============================================
// CREATE COMMAND EXECUTOR
// ============================================

export async function executeCreate(
    args: CreateArgs,
    context: ExecutionContext
): Promise<ExecutionResult> {
    const { elementType, name, parent, options } = args;

    try {
        // Get current project and model
        const project = getProject(context);
        if (!project) {
            return {
                success: false,
                command: 'create',
                message: 'No active project',
                errors: [{ code: 'NO_PROJECT', message: 'Cannot create element without an active project' }]
            };
        }

        // Resolve parent context
        const parentElement = parent
            ? resolveElement(parent, project)
            : getDefaultParent(project, elementType);

        if (!parentElement && needsParent(elementType)) {
            return {
                success: false,
                command: 'create',
                message: `Could not find parent for ${elementType}`,
                errors: [{
                    code: 'PARENT_NOT_FOUND',
                    message: parent
                        ? `Parent '${qualifiedNameToString(parent)}' not found`
                        : `No suitable parent found for ${elementType}`
                }]
            };
        }

        // Create the element based on type
        let result: ExecutionResult;

        switch (elementType) {
            case 'class':
            case 'abstract class':
            case 'interface':
                result = await createClass(name, parentElement, options, elementType === 'abstract class', elementType === 'interface', project);
                break;

            case 'attribute':
                result = await createAttribute(name, parentElement, options);
                break;

            case 'reference':
                result = await createReference(name, parentElement, options, false, project);
                break;

            case 'containment':
            case 'composition':
                // "create containment" is shorthand for "create reference ... containment"
                result = await createReference(name, parentElement, options, true, project);
                break;

            case 'operation':
                result = await createOperation(name, parentElement, options);
                break;

            case 'parameter':
                result = await createParameter(name, parentElement, options);
                break;

            case 'package':
                result = await createPackage(name, parentElement, options);
                break;

            case 'enum':
            case 'enumeration':
                result = await createEnumerator(name, parentElement, options);
                break;

            case 'literal':
                result = await createEnumLiteral(name, parentElement, options);
                break;

            default:
                result = {
                    success: false,
                    command: 'create',
                    message: `Element type '${elementType}' is not yet supported`,
                    errors: [{ code: 'UNSUPPORTED_TYPE', message: `Cannot create ${elementType}` }]
                };
        }

        return result;

    } catch (error) {
        const err = error as Error;
        return {
            success: false,
            command: 'create',
            message: `Failed to create ${elementType}: ${err.message}`,
            errors: [{ code: 'CREATE_ERROR', message: err.message }]
        };
    }
}

// ============================================
// ELEMENT CREATORS
// ============================================

async function createClass(
    name: string,
    parent: any,
    options: CreateArgs['options'],
    isAbstract: boolean = false,
    isInterface: boolean = false,
    project?: any
): Promise<ExecutionResult> {
    return new Promise((resolve) => {
        try {
            // Get the parent ID (package or model)
            const parentId = parent?.id || parent;

            // DClass.new signature: (name, isInterface, isAbstract, isPrimitive, partial, partialDefaultName, father, persist, id)
            // With persist=true, the action is automatically fired
            const newClass = DClass.new(
                name,
                isInterface || options?.interface || false,
                isAbstract || options?.abstract || false,
                false,      // isPrimitive
                undefined,  // partial
                undefined,  // partialDefaultName
                parentId,   // father - this is the key parameter!
                true        // persist - automatically dispatches the action
            );

            // Handle superclass (extends)
            let superClassName: string | undefined;
            if (options?.superClass && project) {
                const superClass = resolveElement(options.superClass, project);
                if (superClass) {
                    // Set the extends property using SetFieldAction
                    // The '=' operator sets the array, '+=' adds to it
                    SetFieldAction.new(newClass, 'extends', superClass.id, '+=', true);
                    superClassName = superClass.name;
                }
            }

            // Handle multiple superclasses
            if (options?.superClasses && options.superClasses.length > 1 && project) {
                // Skip first one as it's already handled above
                for (let i = 1; i < options.superClasses.length; i++) {
                    const superClass = resolveElement(options.superClasses[i], project);
                    if (superClass) {
                        SetFieldAction.new(newClass, 'extends', superClass.id, '+=', true);
                    }
                }
            }

            const typeLabel = isInterface ? 'interface' : isAbstract ? 'abstract class' : 'class';

            resolve({
                success: true,
                command: 'create',
                message: `Created ${typeLabel} '${name}'`,
                data: {
                    id: newClass.id,
                    name,
                    type: typeLabel,
                    superClass: superClassName
                },
                affectedElements: [newClass.id],
                undoable: true
            });
        } catch (error) {
            resolve({
                success: false,
                command: 'create',
                message: `Failed to create class: ${(error as Error).message}`,
                errors: [{ code: 'CREATE_CLASS_ERROR', message: (error as Error).message }]
            });
        }
    });
}

async function createAttribute(
    name: string,
    parent: any,
    options: CreateArgs['options']
): Promise<ExecutionResult> {
    if (!parent) {
        return {
            success: false,
            command: 'create',
            message: 'Attribute requires a parent class',
            errors: [{ code: 'NO_PARENT', message: 'Specify a class to add the attribute to' }]
        };
    }

    return new Promise((resolve) => {
        try {
            const parentId = parent.id || parent;

            // Get type if specified
            const typeName = options?.type?.kind === 'primitive' ? options.type.type : 'EString';

            // DAttribute.new(name, type, father, persist)
            const newAttr = DAttribute.new(name, typeName, parentId, true);

            resolve({
                success: true,
                command: 'create',
                message: `Created attribute '${name}'`,
                data: { id: newAttr.id, name, type: 'attribute' },
                affectedElements: [newAttr.id, parentId],
                undoable: true
            });
        } catch (error) {
            resolve({
                success: false,
                command: 'create',
                message: `Failed to create attribute: ${(error as Error).message}`,
                errors: [{ code: 'CREATE_ATTRIBUTE_ERROR', message: (error as Error).message }]
            });
        }
    });
}

async function createReference(
    name: string,
    parent: any,
    options: CreateArgs['options'],
    isContainment: boolean = false,
    project?: any
): Promise<ExecutionResult> {
    if (!parent) {
        return {
            success: false,
            command: 'create',
            message: 'Reference requires a parent class',
            errors: [{ code: 'NO_PARENT', message: 'Specify a class to add the reference to' }]
        };
    }

    return new Promise((resolve) => {
        try {
            const parentId = parent.id || parent;

            // DReference.new(name, type, father, persist)
            const newRef = DReference.new(name, undefined, parentId, true);

            // Apply target type if specified
            let targetTypeName: string | undefined;
            if (options?.type && project) {
                // options.type can be { kind: 'class', name: QualifiedName } or { kind: 'primitive', type: string }
                if (options.type.kind === 'class' && options.type.name) {
                    const targetClass = resolveElement(options.type.name, project);
                    if (targetClass) {
                        SetFieldAction.new(newRef, 'type', targetClass.id, undefined, true);
                        targetTypeName = targetClass.name;
                    }
                }
            }

            // Apply multiplicity if specified
            // Multiplicity values: '*' in parsed form means unbounded, converted to -1 for model
            if (options?.multiplicity) {
                const { lower, upper } = options.multiplicity;
                SetFieldAction.new(newRef, 'lowerBound', lower, undefined, false);
                // Convert '*' to -1 for unbounded upper bound (EMF/Ecore convention)
                const upperValue = upper === '*' ? -1 : upper;
                SetFieldAction.new(newRef, 'upperBound', upperValue, undefined, false);
            }

            // Apply containment if specified (via "containment" keyword or "create containment" command)
            // Note: The DReference property is called 'composition', but in EMF/Ecore it's called 'containment'
            const shouldBeContainment = isContainment || options?.containment;
            if (shouldBeContainment) {
                // SetFieldAction.new(element, property, value, operator, isPointer)
                // operator: undefined = '=' assignment
                // isPointer: false because composition is a boolean value, not a reference
                SetFieldAction.new(newRef, 'composition', true, undefined, false);
            }

            const typeLabel = shouldBeContainment ? 'containment' : 'reference';
            const multiplicityStr = options?.multiplicity?.raw || '';

            resolve({
                success: true,
                command: 'create',
                message: `Created ${typeLabel} '${name}'${targetTypeName ? ` → ${targetTypeName}` : ''}${multiplicityStr ? ` ${multiplicityStr}` : ''}`,
                data: {
                    id: newRef.id,
                    name,
                    type: typeLabel,
                    targetType: targetTypeName,
                    containment: shouldBeContainment,
                    multiplicity: options?.multiplicity
                },
                affectedElements: [newRef.id, parentId],
                undoable: true
            });
        } catch (error) {
            resolve({
                success: false,
                command: 'create',
                message: `Failed to create reference: ${(error as Error).message}`,
                errors: [{ code: 'CREATE_REFERENCE_ERROR', message: (error as Error).message }]
            });
        }
    });
}

async function createOperation(
    name: string,
    parent: any,
    options: CreateArgs['options']
): Promise<ExecutionResult> {
    if (!parent) {
        return {
            success: false,
            command: 'create',
            message: 'Operation requires a parent class',
            errors: [{ code: 'NO_PARENT', message: 'Specify a class to add the operation to' }]
        };
    }

    return new Promise((resolve) => {
        try {
            const parentId = parent.id || parent;
            const returnType = options?.returnType?.kind === 'primitive' ? options.returnType.type : undefined;

            // DOperation.new(name, type, params, father, persist)
            const newOp = DOperation.new(name, returnType, [], parentId, true);

            resolve({
                success: true,
                command: 'create',
                message: `Created operation '${name}'`,
                data: { id: newOp.id, name, type: 'operation' },
                affectedElements: [newOp.id, parentId],
                undoable: true
            });
        } catch (error) {
            resolve({
                success: false,
                command: 'create',
                message: `Failed to create operation: ${(error as Error).message}`,
                errors: [{ code: 'CREATE_OPERATION_ERROR', message: (error as Error).message }]
            });
        }
    });
}

async function createParameter(
    name: string,
    parent: any,
    options: CreateArgs['options']
): Promise<ExecutionResult> {
    if (!parent) {
        return {
            success: false,
            command: 'create',
            message: 'Parameter requires a parent operation',
            errors: [{ code: 'NO_PARENT', message: 'Specify an operation to add the parameter to' }]
        };
    }

    return new Promise((resolve) => {
        try {
            const parentId = parent.id || parent;
            const typeName = options?.type?.kind === 'primitive' ? options.type.type : undefined;

            // DParameter.new(name, type, father, persist)
            const newParam = DParameter.new(name, typeName, parentId, true);

            resolve({
                success: true,
                command: 'create',
                message: `Created parameter '${name}'`,
                data: { id: newParam.id, name, type: 'parameter' },
                affectedElements: [newParam.id, parentId],
                undoable: true
            });
        } catch (error) {
            resolve({
                success: false,
                command: 'create',
                message: `Failed to create parameter: ${(error as Error).message}`,
                errors: [{ code: 'CREATE_PARAMETER_ERROR', message: (error as Error).message }]
            });
        }
    });
}

async function createPackage(
    name: string,
    parent: any,
    options: CreateArgs['options']
): Promise<ExecutionResult> {
    return new Promise((resolve) => {
        try {
            const parentId = parent?.id || parent;

            // DPackage.new(name, uri, prefix, father, persist, fatherClass)
            const newPkg = DPackage.new(
                name,
                options?.nsUri,
                options?.nsPrefix,
                parentId,
                true
            );

            resolve({
                success: true,
                command: 'create',
                message: `Created package '${name}'`,
                data: { id: newPkg.id, name, type: 'package' },
                affectedElements: [newPkg.id],
                undoable: true
            });
        } catch (error) {
            resolve({
                success: false,
                command: 'create',
                message: `Failed to create package: ${(error as Error).message}`,
                errors: [{ code: 'CREATE_PACKAGE_ERROR', message: (error as Error).message }]
            });
        }
    });
}

async function createEnumerator(
    name: string,
    parent: any,
    options: CreateArgs['options']
): Promise<ExecutionResult> {
    return new Promise((resolve) => {
        try {
            const parentId = parent?.id || parent;

            // DEnumerator.new(name, father, persist)
            const newEnum = DEnumerator.new(name, parentId, true);

            resolve({
                success: true,
                command: 'create',
                message: `Created enum '${name}'`,
                data: { id: newEnum.id, name, type: 'enum' },
                affectedElements: [newEnum.id],
                undoable: true
            });
        } catch (error) {
            resolve({
                success: false,
                command: 'create',
                message: `Failed to create enum: ${(error as Error).message}`,
                errors: [{ code: 'CREATE_ENUM_ERROR', message: (error as Error).message }]
            });
        }
    });
}

async function createEnumLiteral(
    name: string,
    parent: any,
    options: CreateArgs['options']
): Promise<ExecutionResult> {
    if (!parent) {
        return {
            success: false,
            command: 'create',
            message: 'Enum literal requires a parent enum',
            errors: [{ code: 'NO_PARENT', message: 'Specify an enum to add the literal to' }]
        };
    }

    return new Promise((resolve) => {
        try {
            const parentId = parent.id || parent;

            // DEnumLiteral.new(name, value, father, persist)
            const newLiteral = DEnumLiteral.new(name, options?.value, parentId, true);

            resolve({
                success: true,
                command: 'create',
                message: `Created enum literal '${name}'`,
                data: { id: newLiteral.id, name, type: 'literal' },
                affectedElements: [newLiteral.id, parentId],
                undoable: true
            });
        } catch (error) {
            resolve({
                success: false,
                command: 'create',
                message: `Failed to create enum literal: ${(error as Error).message}`,
                errors: [{ code: 'CREATE_LITERAL_ERROR', message: (error as Error).message }]
            });
        }
    });
}

